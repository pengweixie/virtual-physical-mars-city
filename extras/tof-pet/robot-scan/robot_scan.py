# -*- coding: utf-8 -*-
u"""
给"火星医务室 16 排 PET/CT"送进一个病人：一台机器人。
用 pet-ct-design 里那套真实的 CT 投影/重建算法给它做一次 PET/CT 扫描。

流程 (真·PET/CT 临床链路):
  1. 机器人解析体模 (圆柱/球原语, 铝壳 + 塑料内胆 + 空腔 + 致密反应堆芯)。
  2. CT 扫描 (复用 projector.py / recon.py):
       A) 单色 60 keV      -> 干净 HU 图 (材料真值参考)
       B) 多色 120 kVp + 蝶形滤器 + 泊松噪声 + 水束硬化校正 -> 临床质感 HU 图
          (金属体模必然出现束硬化条纹, 正是真实现象)
  3. CT 衰减校正 (CTAC): 把重建 HU 经双线性映射成 511 keV 线衰减系数 μ-map,
       这是 PET/CT 里 CT 为 PET 提供的关键产物。
  4. PET 发射扫描: 反应堆芯 / 双眼 / 天线信标为热源, 机身低本底; 前向投影
       (含 μ-map 衰减 + 泊松噪声 + 散射/随机本底), AC-MLEM 重建。
  5. PET/CT 融合图 + 定量报告。

  blender 不参与本步; 纯 GPU(cupy)+numpy。
输出: E:\\Claude\\mars_medical\\out\\scan\\
"""
import os, sys, json
import numpy as np

# --- 接入 pet-ct-design 的真实 CT 算法模块 ---
RECON_DIR = r".\ct\sim\recon"
sys.path.insert(0, RECON_DIR)
import cupy as cp
from ct_common import NVIEW, E_REF, MU_W_REF, hu, mu_of, load_spectrum, bowtie_al_mm
from projector import (project_lengths, mono_sino, poly_sino,
                       water_bhc_lut, apply_water_bhc)
from recon import filter_sino, fdk_axial

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei", "DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False
from scipy.ndimage import rotate

OUT = r".\out\scan"
os.makedirs(OUT, exist_ok=True)
report = {}

# =====================================================================
# 1. 机器人体模  (轴向 x-y 截面 = 机器人正视剪影, 沿孔径 z 拉伸)
#    单位 mm。材料: al(铝壳) / water(塑料内胆,~0 HU) / bone(致密件) / air(空腔)
#    act = PET 相对摄取 (无=结构冷区)
# =====================================================================
ZL = 60.0                       # 圆柱半长, 远超 16 排覆盖 (±9.6 mm)
W = ("water", 1.0)              # host 记号
AL = ("al", 1.0)

def C(c, r, mat, rho=1.0, z=(-ZL, ZL), host=None, act=0.0):
    return {"shape": "cyl", "c": c, "r": r, "z": z, "mat": mat,
            "rho": rho, "host": host, "act": act}
def S(c, r, mat, rho=1.0, host=None, act=0.0):
    return {"shape": "sphere", "c": (c[0], c[1], 0.0), "r": r, "mat": mat,
            "rho": rho, "host": host, "act": act}

ROBOT = [
    # ---------- 头 ----------
    C((0,  52), 34, "al",  1.0),                        # 头壳(铝)
    C((0,  52), 28, "water", 1.0, host=AL, act=0.6),    # 头内胆(塑料)
    C((-13, 58), 7, "bone", 2.0, host=W, act=4.0),      # 左眼传感器(致密) + 热
    C(( 13, 58), 7, "bone", 2.0, host=W, act=4.0),      # 右眼传感器 + 热
    C((-10, 40), 3, "al", 1.0, host=W),                 # 嘴格栅 x3
    C((  0, 40), 3, "al", 1.0, host=W),
    C(( 10, 40), 3, "al", 1.0, host=W),
    C((0,  92), 2.5, "al", 1.0),                        # 天线杆
    S((0, 104),  6, "bone", 3.0, act=5.0),              # 天线信标球 + 热
    # ---------- 颈 ----------
    C((0,  26), 9, "al", 1.0),
    # ---------- 躯干 ----------
    C((0, -30), 46, "al", 1.0),                         # 躯干壳(铝)
    C((0, -30), 40, "water", 1.0, host=AL, act=0.8),    # 躯干内胆(塑料本底)
    S((0, -25), 16, "bone", 4.0, host=W, act=9.0),      # 反应堆芯(致密) + 最热
    C((-30,  -8), 3.5, "al", 1.0, host=W),              # 面板螺栓 x4
    C(( 30,  -8), 3.5, "al", 1.0, host=W),
    C((-30, -52), 3.5, "al", 1.0, host=W),
    C(( 30, -52), 3.5, "al", 1.0, host=W),
    C((0, -60), 8, "water", 0.0, host=W),               # 观察窗(空腔, -1000 HU)
    # ---------- 手臂 ----------
    C((-56, -18), 11, "al", 1.0),                       # 左臂
    C(( 56, -18), 11, "al", 1.0),                       # 右臂
    S((-56, -40),  9, "al", 1.0),                       # 左手
    S(( 56, -40),  9, "al", 1.0),                       # 右手
]

# ---- 511 keV 线衰减系数 (1/mm, 标准密度): 供 CTAC 双线性锚点 & 真值 ----
MU511 = {"water": 0.009597, "bone": 0.017089, "al": 0.022779}

# =====================================================================
#  体模栅格化 (供真值显示 / PET 活度真值)。切面 z=0。
#  host 语义与 projector 一致: 有 host 的原语贡献 (μ_prim - μ_host)。
# =====================================================================
def rasterize(prim_list, XS, YS, mode, E=E_REF):
    """mode='mu'(线衰减,含host扣除) / 'mu511' / 'act'(活度,按序覆盖)"""
    out = np.zeros(XS.shape, np.float64)
    for p in prim_list:
        cx, cy = p["c"][0], p["c"][1]
        inside = (XS - cx) ** 2 + (YS - cy) ** 2 < p["r"] ** 2
        if mode == "act":
            if p["act"] > 0:
                out[inside] = p["act"]       # 后列热源覆盖前列本底
            continue
        if mode == "mu":
            val = mu_of(p["mat"], E) * p["rho"]
            hv = mu_of(p["host"][0], E) * p["host"][1] if p["host"] else 0.0
        else:  # mu511
            val = MU511[p["mat"]] * p["rho"]
            hv = MU511[p["host"][0]] * p["host"][1] if p["host"] else 0.0
        out[inside] += (val - hv)
    return out

# =====================================================================
# 2. CT 扫描  (复用真实算法)
# =====================================================================
print("[CT] 前向投影 (解析原语投影器, GPU) ...")
betas = np.arange(NVIEW) * 2 * np.pi / NVIEW
z0 = np.zeros(NVIEW)
grp = project_lengths(ROBOT, betas, z0)

# 重建网格: 250 mm FOV, 512^2
N = 512
FOVR = 250.0
px = FOVR / N
ax = (np.arange(N) - (N - 1) / 2) * px
XS, YS = np.meshgrid(ax, ax)
xs, ys = cp.asarray(XS), cp.asarray(YS)

# --- A) 单色 60 keV ---
print("[CT-A] 单色 60 keV FDK ...")
p_mono = mono_sino(grp, E_REF)
q = filter_sino(p_mono, window="hann")
huA = cp.asnumpy(hu(fdk_axial(q, betas, xs, ys, [0.0])[0]))

# --- B) 多色 120 kVp + 蝶形 + 噪声 + 水BHC ---
print("[CT-B] 多色 120 kVp + bowtie + noise + water-BHC ...")
Eg, Wg = load_spectrum(120, ebin=2.0)
bt = bowtie_al_mm()
N0 = 3.0e5
pp = poly_sino(grp, Eg, Wg, bowtie_al=bt, N0=N0, seed=7)
ptab, Lg = water_bhc_lut(Eg, Wg, bowtie_al=bt)
p_corr = apply_water_bhc(pp, ptab, Lg)
qB = filter_sino(p_corr, window="hann")
huB = cp.asnumpy(hu(fdk_axial(qB, betas, xs, ys, [0.0])[0]))

# 真值 (μ@60keV -> HU) 供对照
mu_true = rasterize(ROBOT, XS, YS, "mu", E_REF)
hu_true = 1000.0 * (mu_true - MU_W_REF) / MU_W_REF

# --- 各部位 HU 定量 ---
def roi(img, cx, cy, r):
    m = (XS - cx) ** 2 + (YS - cy) ** 2 < r ** 2
    return float(np.mean(img[m])), float(np.std(img[m]))
parts = {
    "head_shell_Al":  (0,  83, 2),
    "head_interior":  (0,  46, 6),
    "reactor_core":   (0, -25, 6),
    "torso_plastic":  (18, -40, 5),
    "arm_Al":         (-56, -18, 5),
    "eye_sensor":     (-13, 58, 3),
    "view_window_air":(0, -60, 4),
}
report["CT_HU"] = {
    "note": "16排轴扫; mono=60keV单色, poly=120kVp多色+bowtie+噪声+水BHC",
    "N0_photons_per_cell": N0,
    "parts": {k: {"mono_HU": round(roi(huA, *v)[0], 1),
                  "poly_HU": round(roi(huB, *v)[0], 1),
                  "poly_noise_sd": round(roi(huB, *v)[1], 1),
                  "truth_HU": round(roi(hu_true, *v)[0], 1)}
              for k, v in parts.items()},
}
print(json.dumps(report["CT_HU"], indent=2, ensure_ascii=False))

# =====================================================================
# 3. CTAC: 重建 HU -> μ@511 双线性映射 (PET 衰减校正图)
# =====================================================================
def hu_to_mu511(hu_img):
    muw, mub = MU511["water"], MU511["bone"]
    HU_BONE = 1900.0                         # 皮质骨在 60keV 的 HU 锚点
    out = np.where(
        hu_img <= 0,
        muw * np.clip(1.0 + hu_img / 1000.0, 0.0, None),          # 空气->0, 水->muw
        muw + hu_img * (mub - muw) / HU_BONE)                     # 骨/金属段
    return np.clip(out, 0.0, None)
mu511_ct = hu_to_mu511(huB)                  # 来自"测得的CT", 真·CTAC

# =====================================================================
# 4. PET 发射扫描 (2D 平行束, CT衰减校正 AC-MLEM)
#    网格与 CT 同心, 128^2 @ 250mm。
# =====================================================================
print("[PET] 发射投影 + AC-MLEM ...")
NP = 128
axp = (np.arange(NP) - (NP - 1) / 2) * (FOVR / NP)
XP, YP = np.meshgrid(axp, axp)
pxp = FOVR / NP
FOVmask = (XP ** 2 + YP ** 2) < (FOVR / 2 - 4) ** 2

A_true = rasterize(ROBOT, XP, YP, "act")               # 活度真值 (128)
# 把 CT 得到的 μ@511 降采样到 PET 网格 (512->128 块平均)
mu511_pet = mu511_ct.reshape(NP, N // NP, NP, N // NP).mean(3).mean(1)

nA = 128
angles = np.linspace(0.0, 180.0, nA, endpoint=False)   # 度

def fwd(img):
    s = np.empty((nA, NP), np.float64)
    for i, a in enumerate(angles):
        s[i] = rotate(img, a, reshape=False, order=1, mode="constant").sum(0) * pxp
    return s
def bwd(sino):
    out = np.zeros((NP, NP), np.float64)
    for i, a in enumerate(angles):
        smear = np.broadcast_to(sino[i][None, :], (NP, NP))
        out += rotate(smear, -a, reshape=False, order=1, mode="constant") * pxp
    return out

acf = np.exp(-fwd(mu511_pet))                          # 衰减因子 sinogram
SCALE = 60.0                                           # 计数标定
true_sino = acf * fwd(A_true) * SCALE
bg = 0.08 * true_sino.mean()                           # 散射+随机本底 (平)
rng = np.random.default_rng(11)
prompts = rng.poisson(true_sino + bg).astype(np.float64)
report["PET_counts"] = {"total_prompts": int(prompts.sum()),
                        "scatter_random_frac": 0.08,
                        "attenuation_correction": "CT-derived mu@511 (bilinear CTAC)"}

# AC-MLEM
sens = bwd(acf) + 1e-6
x = np.ones((NP, NP)) * FOVmask
NIT = 40
for it in range(NIT):
    ybar = acf * fwd(x) + bg
    x *= bwd(acf * (prompts / np.maximum(ybar, 1e-9))) / sens
    x *= FOVmask
pet = x / SCALE                                        # 回到活度标度

# PET 定量: 热源恢复
def roi_p(img, cx, cy, r):
    m = (XP - cx) ** 2 + (YP - cy) ** 2 < r ** 2
    return float(np.mean(img[m]))
report["PET_recovery"] = {
    "reactor_core":  {"true": 9.0, "recon": round(roi_p(pet, 0, -25, 8), 2)},
    "antenna_beacon":{"true": 5.0, "recon": round(roi_p(pet, 0, 104, 4), 2)},
    "eye_L":         {"true": 4.0, "recon": round(roi_p(pet, -13, 58, 4), 2)},
    "torso_bg":      {"true": 0.8, "recon": round(roi_p(pet, 20, -42, 5), 2)},
}
print(json.dumps(report["PET_recovery"], indent=2, ensure_ascii=False))

# =====================================================================
# 5. 出图
# =====================================================================
ext = [ax[0], ax[-1], ax[0], ax[-1]]        # y 升序 + origin='lower' -> 机器人头朝上
extp = [axp[0], axp[-1], axp[0], axp[-1]]

def panel(axh, img, title, cmap="gray", vmin=None, vmax=None, extent=ext, cb=""):
    im = axh.imshow(img, cmap=cmap, vmin=vmin, vmax=vmax, extent=extent, origin="lower")
    axh.set_title(title, fontsize=10); axh.set_xlabel("x (mm)"); axh.set_ylabel("y (mm)")
    plt.colorbar(im, ax=axh, fraction=0.046, pad=0.04).set_label(cb, fontsize=8)

fig, axs = plt.subplots(2, 3, figsize=(16, 10.5))
panel(axs[0,0], hu_true, "真值 (μ@60keV→HU)", vmin=-1000, vmax=3000, cb="HU")
panel(axs[0,1], huA, "CT A: 单色 60 keV FDK", vmin=-200, vmax=2000, cb="HU")
panel(axs[0,2], huB, "CT B: 120kVp 多色+噪声+BHC\n(金属束硬化条纹)", vmin=-200, vmax=2000, cb="HU")
panel(axs[1,0], mu511_pet, "CTAC: CT 导出 μ@511keV", cmap="viridis", extent=extp, cb="1/mm")
panel(axs[1,1], pet, "PET: AC-MLEM 活度 (40 it)", cmap="hot", extent=extp, cb="rel. uptake")
# 融合
axs[1,2].imshow(huB, cmap="gray", vmin=-200, vmax=1500, extent=ext, origin="lower")
petm = np.ma.masked_less(pet, 0.15 * pet.max())
axs[1,2].imshow(petm, cmap="hot", alpha=0.75, extent=extp, origin="lower",
                vmin=0, vmax=pet.max())
axs[1,2].set_title("PET/CT 融合", fontsize=10)
axs[1,2].set_xlabel("x (mm)"); axs[1,2].set_ylabel("y (mm)")
fig.suptitle("火星医务室 16 排 PET/CT — 机器人受检者一次扫描", fontsize=14)
fig.tight_layout(rect=[0, 0, 1, 0.97])
fig.savefig(OUT + r"\robot_petct_scan.png", dpi=115)
plt.close(fig)

with open(OUT + r"\scan_report.json", "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2, ensure_ascii=False)
print("DONE ->", OUT)
print("SCAN_COMPLETE")
