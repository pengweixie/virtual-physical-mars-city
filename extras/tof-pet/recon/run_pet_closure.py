# -*- coding: utf-8 -*-
"""
PET-CT 定量闭环 (2D):
  活度体模 (与 CT 胸部体模同几何) -> 平行 LOR sinogram (真值衰减 + 4.5mm 系统分辨 + 泊松)
  -> MLEM (衰减入模型) 三组对照: T 真值 mu / C CTAC mu (CT 链路产出) / N 无 AC
  -> 本底偏差、热灶恢复系数、C vs T 的 SUV 传递误差
输出: out/*.png, out/pet_closure_results.json
"""
import json, os, sys
import numpy as np
import cupy as cp
from cupyx.scipy.ndimage import map_coordinates as cp_mapc
from cupyx.scipy.ndimage import gaussian_filter as cp_gauss
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

sys.path.insert(0, r".\ct\sim\recon")
from ct_common import MU511
import phantoms

OUT = r".\pet\sim\out"
os.makedirs(OUT, exist_ok=True)
results = {}

# ---------- 网格与 sinogram 参数 ----------
N = 256; FOV = 350.0; px = FOV / N                 # 1.367 mm
NANG = 192; NRAD = 192; drad = 2.0                  # 径向 ±192 mm
axg = (np.arange(N) - (N - 1) / 2) * px
XS, YS = np.meshgrid(axg, axg)
angles = np.arange(NANG) * np.pi / NANG
PSF_SINO_MM = 4.5 / 2.355                           # 系统径向分辨
POST_FWHM = 5.0

# ---------- 体模: 衰减 (真值) 与活度 ----------
def disc_mask(cx, cy, r):
    return (XS - cx) ** 2 + (YS - cy) ** 2 < r ** 2

mu_true = np.zeros((N, N), np.float32)
for p in phantoms.thorax_phantom():
    m = disc_mask(p["c"][0], p["c"][1], p["r"])
    v = MU511[p["mat"]] * (p["rho"] if p["mat"] == "water" else 1.0)
    if p.get("host"):
        v -= MU511[p["host"][0]] * p["host"][1]
    mu_true[m] += v

LESIONS = [(50, 55, 5.0), (-50, 55, 6.5), (-20, -50, 8.5), (60, -60, 11.0)]
act = np.zeros((N, N), np.float32)
act[disc_mask(0, 0, 150)] = 1.0                     # 软组织本底
act[disc_mask(-70, -20, 50)] = 0.3                  # 肺
act[disc_mask(70, -20, 50)] = 0.3
act[disc_mask(0, 95, 18)] = 0.5                     # 骨
for cx, cy, r in LESIONS:                           # 热灶 4:1
    act[disc_mask(cx, cy, r)] = 4.0

# ---------- 旋转法投影对 (GPU) ----------
rad_edges = (np.arange(NRAD + 1) - NRAD / 2) * drad
rad_c = 0.5 * (rad_edges[:-1] + rad_edges[1:])
act_g = cp.asarray(act)

def _rot_coords(theta):
    """把图像旋转 -theta 的采样坐标 (使投影方向恒为列求和)"""
    c, s = np.cos(theta), np.sin(theta)
    xr = XS * c + YS * s
    yr = -XS * s + YS * c
    ci = xr / px + (N - 1) / 2.0
    ri = yr / px + (N - 1) / 2.0
    return cp.asarray(np.stack([ri, ci]))

COORDS = [_rot_coords(t) for t in angles]
# 径向 bin 映射: 旋转后列坐标 x -> bin
col_mm = axg.copy()
bin_of_col = np.clip(np.digitize(col_mm, rad_edges) - 1, 0, NRAD - 1)
bin_of_col_g = cp.asarray(bin_of_col)
# 列->bin 的聚合矩阵思想: 用 bincount
def fp(img_g):
    """前投影: (N,N) -> (NANG, NRAD), 线积分 (mm)"""
    sino = cp.zeros((NANG, NRAD), cp.float32)
    for k in range(NANG):
        rot = cp_mapc(img_g, COORDS[k], order=1, mode="constant", cval=0.0)
        colsum = rot.sum(axis=0) * px                # 沿列积分
        sino[k] = cp.bincount(bin_of_col_g, weights=colsum,
                              minlength=NRAD).astype(cp.float32)
    return sino

# 每 bin 含的列数 (>= 1), 反投影时按列展开
cols_per_bin = cp.bincount(bin_of_col_g, minlength=NRAD).astype(cp.float32)
cols_per_bin = cp.maximum(cols_per_bin, 1.0)

def bp(sino_g):
    """反投影 (fp 的伴随, 同插值)"""
    img = cp.zeros((N, N), cp.float32)
    for k in range(NANG):
        prof = (sino_g[k] / cols_per_bin)[bin_of_col_g]   # bin -> 列
        smear = cp.broadcast_to(prof[None, :], (N, N))
        c, s = np.cos(angles[k]), np.sin(angles[k])
        xr = XS * c - YS * s
        yr = XS * s + YS * c
        ci = xr / px + (N - 1) / 2.0
        ri = yr / px + (N - 1) / 2.0
        img += cp_mapc(smear, cp.asarray(np.stack([ri, ci])),
                       order=1, mode="constant", cval=0.0)
    return img * px

def smooth_rad(sino_g, sigma_mm):
    return cp_gauss(sino_g, sigma=(0, sigma_mm / drad))

# ---------- 衰减 sinogram ----------
att_true = cp.exp(-fp(cp.asarray(mu_true)))
mu_ctac_512 = np.load(r".\ct\sim\recon\out\ctac_mu_pet.npy")
# 512@350mm -> 256@350mm (2x2 平均池化)
mu_ctac = mu_ctac_512.reshape(256, 2, 256, 2).mean(axis=(1, 3)).astype(np.float32)
att_ctac = cp.exp(-fp(cp.asarray(mu_ctac)))

# ---------- 数据生成 (真值衰减 + 系统分辨 + 泊松) ----------
TRUES = 3.0e6
y_mean = smooth_rad(att_true * fp(act_g), PSF_SINO_MM)
y_mean *= TRUES / float(y_mean.sum())
rng = cp.random.RandomState(2026)
y = rng.poisson(y_mean).astype(cp.float32)
results["data"] = {"total_trues": int(float(y.sum())),
                   "sino": [NANG, NRAD], "psf_fwhm_mm": 4.5}

# ---------- MLEM ----------
def mlem(y, att, niter=120):
    a = cp.ones((N, N), cp.float32)
    sens = bp(att * cp.ones_like(y)) + 1e-6
    for _ in range(niter):
        yp = att * fp(a) + 1e-6
        a *= bp(att * (y / yp)) / sens
    return a

cases = {"T_true_mu": att_true, "C_ctac": att_ctac,
         "N_no_ac": cp.ones_like(att_true)}
recons = {}
sig_post = POST_FWHM / 2.355 / px
for name, att in cases.items():
    r = mlem(y, att, niter=120)
    recons[name] = cp.asnumpy(cp_gauss(r, sig_post))
    print("MLEM done:", name)

# ---------- 定标与指标 ----------
# 以 T 组软组织本底均值定标为 1.0 (同一因子用于三组, 模拟统一的活度定标)
bg_rois = [(0, 20, 12), (90, 30, 10), (-90, 30, 10), (0, -110, 10), (35, -100, 10)]
def roi_mean(img, cx, cy, r):
    return float(img[disc_mask(cx, cy, r)].mean())
cal = np.mean([roi_mean(recons["T_true_mu"], *r) for r in bg_rois])
metrics = {}
for name, img in recons.items():
    imgn = img / cal
    bg = np.mean([roi_mean(imgn, *r) for r in bg_rois])
    les = {}
    for i, (cx, cy, r) in enumerate(LESIONS):
        rc = roi_mean(imgn, cx, cy, r * 0.7) / 4.0   # 恢复系数 (ROI 略内收)
        les[f"d{int(2*r)}mm"] = round(rc, 3)
    metrics[name] = {"background": round(bg, 4), "lesion_RC": les}
# C vs T 的传递误差 (体内逐像素)
body = disc_mask(0, 0, 140)
ratio = recons["C_ctac"][body] / np.maximum(recons["T_true_mu"][body], 1e-6)
metrics["C_vs_T_transfer"] = {
    "mean_pct": round(float(ratio.mean() - 1) * 100, 2),
    "sd_pct": round(float(ratio.std()) * 100, 2),
    "p95_abs_pct": round(float(np.percentile(np.abs(ratio - 1), 95)) * 100, 2),
}
results["metrics"] = metrics
print(json.dumps(results, indent=2, ensure_ascii=False))
json.dump(results, open(f"{OUT}\\pet_closure_results.json", "w",
                        encoding="utf-8"), indent=2, ensure_ascii=False)

# ---------- 图 ----------
fig, axs = plt.subplots(1, 4, figsize=(19, 5))
ext = [axg[0], axg[-1], axg[-1], axg[0]]
im = axs[0].imshow(act, cmap="hot", extent=ext); axs[0].set_title("Activity truth")
plt.colorbar(im, ax=axs[0], shrink=0.75)
for ax_, name, ttl in [(axs[1], "T_true_mu", "MLEM, true-mu AC"),
                       (axs[2], "C_ctac", "MLEM, CTAC (CT-chain) AC"),
                       (axs[3], "N_no_ac", "MLEM, no AC")]:
    im = ax_.imshow(recons[name] / cal, cmap="hot", vmin=0, vmax=4.5, extent=ext)
    ax_.set_title(ttl); plt.colorbar(im, ax=ax_, shrink=0.75)
plt.tight_layout(); plt.savefig(f"{OUT}\\pet_recons.png", dpi=130); plt.close()

diff = (recons["C_ctac"] - recons["T_true_mu"]) / cal
diff[~body] = np.nan
plt.figure(figsize=(6.5, 5.5))
plt.imshow(diff, cmap="coolwarm", vmin=-0.1, vmax=0.1, extent=ext)
plt.colorbar(label="ΔSUV-equivalent (C − T)")
plt.title(f"CTAC transfer error: mean {metrics['C_vs_T_transfer']['mean_pct']}%, "
          f"p95 {metrics['C_vs_T_transfer']['p95_abs_pct']}%")
plt.tight_layout(); plt.savefig(f"{OUT}\\pet_ctac_transfer_error.png", dpi=130)
plt.close()
print("pet closure done ->", OUT)
