# -*- coding: utf-8 -*-
"""
真实 SSS (Watson 单次散射模拟) 2D 演示 — 中心切片, 无窗 10ps 数据。
不使用真值标志、不使用能量: 输入只有 (i) 首轮无校正 MLEM 活度图 (ii) 解析 μ-map
(iii) 物体外 sinogram 尾巴 (tail-fitting 定标)。
三方对照: 无SC / 真实SSS / 真值剔散射(上限), 同一 2D MLEM 框架。

均匀凸水柱的解析简化: 对发射点 P∈[S,A], 水程 ℓw(P→A)+ℓw(P→S) 恒等于
ℓw(S→出口_A) —— 衰减因子拉出发射积分, 只剩 ∫λ dP 需图像采样。
"""
import numpy as np, json
from scipy.ndimage import map_coordinates, gaussian_filter, rotate, zoom
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = r".\pet\sim\out\gate3d"
MU511 = 0.0096          # /mm water
R_CYL = 100.0           # 水柱半径
R_DET = 400.0           # 晶体中心环半径
NPHI, NR = 96, 128      # sinogram
RMAX = 192.0
r_edges = np.linspace(-RMAX, RMAX, NR + 1)
r_c = 0.5 * (r_edges[:-1] + r_edges[1:])
phis = (np.arange(NPHI) + 0.5) * np.pi / NPHI
NIMG, PIX = 128, 3.0
axg = (np.arange(NIMG) - (NIMG - 1) / 2) * PIX

# ---------- 1. 事件 -> 平行 sinogram ----------
ev = np.load(OUT + r"\central_events.npz")
x1, y1, x2, y2 = ev["x1"], ev["y1"], ev["x2"], ev["y2"]
sc_truth = ev["scatter"]
dx, dy = x2 - x1, y2 - y1
phi = np.arctan2(dy, dx) % np.pi
rr = -x1 * np.sin(phi) + y1 * np.cos(phi)
def binsino(mask):
    H, _, _ = np.histogram2d(phi[mask], rr[mask],
                             bins=[np.linspace(0, np.pi, NPHI + 1), r_edges])
    return H.astype(np.float64)
Y_all = binsino(np.ones_like(phi, bool))
Y_unsc = binsino(~sc_truth)                      # 真值剔散射 (上限参照)
print(f"events={len(phi)}  sino_all={Y_all.sum():.0f}  unsc={Y_unsc.sum():.0f}")

# ---------- 2. 2D MLEM (旋转法, 平行几何, 含衰减+加性项) ----------
ACF_L = np.where(np.abs(r_c) < R_CYL, 2 * np.sqrt(np.clip(R_CYL**2 - r_c**2, 0, None)), 0.0)
ATT = np.exp(-MU511 * ACF_L)                     # (NR,) 每 φ 相同 (圆对称)
ATT2 = np.tile(ATT, (NPHI, 1))

def fp(img):
    s = np.zeros((NPHI, NR))
    for i, p in enumerate(phis):
        rot = rotate(img, np.degrees(p) - 90.0, reshape=False, order=1)
        prof = rot.sum(axis=0) * PIX             # 沿列积分
        s[i] = np.interp(r_c, axg, prof)
    return s

def bp(sino):
    img = np.zeros((NIMG, NIMG))
    for i, p in enumerate(phis):
        prof = np.interp(axg, r_c, sino[i])
        sm = np.tile(prof, (NIMG, 1))
        img += rotate(sm, 90.0 - np.degrees(p), reshape=False, order=1)
    return img * PIX

def mlem(y, s_add, nit=30):
    lam = np.ones((NIMG, NIMG))
    sens = bp(ATT2) + 1e-9
    for _ in range(nit):
        fwd = ATT2 * fp(lam) + s_add + 1e-9
        lam *= bp(ATT2 * (y / fwd)) / sens
    return lam

print("recon 1/3: no-SC ...")
lam_noSC = mlem(Y_all, 0.0)
print("recon 2/3: truth-removed (upper bound) ...")
lam_truth = mlem(Y_unsc, 0.0)

# ---------- 3. Watson SSS ----------
print("SSS estimate ...")
# 3a. 首轮活度图 (无校正, 轻平滑抑噪) —— SSS 的 λ 输入
lam_in = gaussian_filter(lam_noSC, 2.0)
# 3b. 散射点网格 (10mm, 柱内)
gs = np.arange(-95, 96, 10.0)
SX, SY = np.meshgrid(gs, gs)
inside = SX**2 + SY**2 < (R_CYL - 5)**2
SX, SY = SX[inside], SY[inside]                  # (NS,)
NS = len(SX)
# 3c. 逐 bin 计算 (粗网格 48x32 再上采样)
NP2, NR2 = 48, 32
phis2 = (np.arange(NP2) + 0.5) * np.pi / NP2
r2 = np.linspace(-RMAX + 6, RMAX - 6, NR2)
def ray_lambda_integral(sx, sy, ux, uy, tmax, nstep=50):
    """∫λ 从 S 沿 (ux,uy) 到距离 tmax (图像采样)"""
    t = np.linspace(0, 1, nstep)[None, :] * tmax[:, None]
    px = sx[:, None] + ux[:, None] * t
    py = sy[:, None] + uy[:, None] * t
    ci = (px / PIX + (NIMG - 1) / 2)
    ri = (py / PIX + (NIMG - 1) / 2)
    v = map_coordinates(lam_in, [ri.ravel(), ci.ravel()], order=1,
                        mode="constant").reshape(px.shape)
    return v.sum(axis=1) * (tmax / nstep)

def water_exit(sx, sy, ux, uy):
    """S(柱内) 沿 (ux,uy) 到柱面的距离 (解析)"""
    b = sx * ux + sy * uy
    c = sx**2 + sy**2 - R_CYL**2
    return -b + np.sqrt(b * b - c)

S_est2 = np.zeros((NP2, NR2))
for i, p in enumerate(phis2):
    u = np.array([np.cos(p), np.sin(p)])         # LOR 方向
    n = np.array([-np.sin(p), np.cos(p)])        # 法向
    for j, r0 in enumerate(r2):
        t_half = np.sqrt(R_DET**2 - r0**2)
        A = r0 * n - t_half * u                  # 两端探测器
        B = r0 * n + t_half * u
        # 对所有散射点 S 向量化
        dAx, dAy = A[0] - SX, A[1] - SY
        dBx, dBy = B[0] - SX, B[1] - SY
        RA = np.hypot(dAx, dAy); RB = np.hypot(dBx, dBy)
        uAx, uAy = dAx / RA, dAy / RA            # S->A 单位向量
        uBx, uBy = dBx / RB, dBy / RB
        cosT = -(uAx * uBx + uAy * uBy)          # 入射(A->S)与出射(S->B)夹角
        Ep = 511.0 / (2.0 - cosT)                # 散射后能量
        k = Ep / 511.0
        KN = k**2 * (k + 1.0 / k - (1.0 - cosT**2))   # dσ/dΩ ∝
        muE = MU511 * (1.0 + 0.35 * (1.0 - k))   # 低能水衰减近似放大
        wA = water_exit(SX, SY, uAx, uAy)        # S->柱面(朝A)水程
        wB = water_exit(SX, SY, uBx, uBy)
        emA = ray_lambda_integral(SX, SY, uAx, uAy, wA)   # ∫λ S->A 侧
        emB = ray_lambda_integral(SX, SY, uBx, uBy, wB)
        IA = np.exp(-MU511 * wA - muE * wB) * emA
        IB = np.exp(-MU511 * wB - muE * wA) * emB
        S_est2[i, j] = np.sum(KN / (RA**2 * RB**2) * (IA + IB))
# 上采样到全 sinogram 网格
S_est = zoom(S_est2, (NPHI / NP2, NR / NR2), order=1)
S_est = np.clip(S_est, 0, None)
# 3d. 两分量尾部定标 (物体外, 不含真值!):
#     远尾 (170<|r|<192) 定平坦本底 (随机+晶体间散射错位事件, 标准随机处理方式)
#     近尾 (105<|r|<160) 定 SSS 标度
far = np.abs(r_c) > 170
near = (np.abs(r_c) > 105) & (np.abs(r_c) < 160)
flat = Y_all[:, far].mean()                       # 每 bin 平坦本底
resid = np.clip(Y_all[:, near] - flat, 0, None)
scale = resid.sum() / max(S_est[:, near].sum(), 1e-12)
S_sss = S_est * scale
s_add_total = S_sss + flat
sf_est = s_add_total.sum() / Y_all.sum()
print(f"flat/bin={flat:.3f}  SSS scale={scale:.3e}  "
      f"加性份额(SSS+flat)={sf_est*100:.1f}% (真值散射 {sc_truth.mean()*100:.1f}%)")

print("recon 3/3: real-SSS corrected ...")
lam_sss = mlem(Y_all, s_add_total)

# ---------- 4. 定量 ----------
Xg, Yg = np.meshgrid(axg, axg)
spheres = {"d13": (50, 0, 4), "d17": (0, 50, 5.5), "d22": (-50, 0, 7.5), "d28": (0, -50, 10)}
bgpos = [(0, 0, 12), (30, 30, 10), (-30, 30, 10), (30, -30, 10), (-30, -30, 10)]
def rm(v, cx, cy, r):
    return float(v[(Xg - cx)**2 + (Yg - cy)**2 < r**2].mean())
res = {}
for tag, v in [("noSC", lam_noSC), ("realSSS", lam_sss), ("truthSC", lam_truth)]:
    bg = [rm(v, *p) for p in bgpos]; b = np.mean(bg)
    res[tag] = {"BV_pct": round(np.std(bg) / b * 100, 1),
                **{k: round(rm(v, cx, cy, r) / b, 2) for k, (cx, cy, r) in spheres.items()}}
# 达成率: SSS 恢复了完美校正增益的百分比
ach = {k: round(100 * (res["realSSS"][k] - res["noSC"][k]) /
       max(res["truthSC"][k] - res["noSC"][k], 1e-9), 0) for k in spheres}
res["SSS_achievement_pct"] = ach
res["SF_est_vs_truth"] = {"SSS_pct": round(sf_est * 100, 1),
                          "truth_pct": round(float(sc_truth.mean()) * 100, 1)}
print(json.dumps(res, indent=2))
json.dump(res, open(OUT + r"\sss_results.json", "w"), indent=2)

# ---------- 5. 图 ----------
fig = plt.figure(figsize=(16, 9))
# 5a. sinogram 剖面: 测量 vs SSS 估计 vs 真值散射
a1 = fig.add_subplot(2, 3, 1)
iphi = NPHI // 2
Y_sc_truth = Y_all - Y_unsc
a1.plot(r_c, Y_all[iphi], "k-", lw=1, label="measured prompts")
a1.plot(r_c, Y_sc_truth[iphi], "r-", lw=1.2, label="true scatter (truth tags)")
a1.plot(r_c, S_sss[iphi] + flat, "b--", lw=1.5, label="SSS+flat estimate (no truth!)")
a1.axvspan(-RMAX, -110, color="gray", alpha=0.15)
a1.axvspan(110, RMAX, color="gray", alpha=0.15, label="tail-fit region")
a1.set_xlabel("r (mm)"); a1.set_ylabel("counts")
a1.set_title("Scatter estimate vs truth (φ=90°)", fontsize=10)
a1.legend(fontsize=7); a1.grid(alpha=0.3)
# 5b. 角度平均剖面
a2 = fig.add_subplot(2, 3, 2)
a2.plot(r_c, Y_all.mean(0), "k-", label="prompts")
a2.plot(r_c, Y_sc_truth.mean(0), "r-", label="true scatter")
a2.plot(r_c, S_sss.mean(0) + flat, "b--", label="SSS+flat")
a2.set_xlabel("r (mm)"); a2.set_title("angle-averaged", fontsize=10)
a2.legend(fontsize=7); a2.grid(alpha=0.3)
# 5c. CR 柱状
a3 = fig.add_subplot(2, 3, 3)
w = 0.25; sph = list(spheres)
for j, (tag, col) in enumerate([("noSC", "tab:green"), ("realSSS", "tab:blue"), ("truthSC", "tab:purple")]):
    a3.bar(np.arange(4) + j * w, [res[tag][s] for s in sph], w, label=tag, color=col)
a3.axhline(8, color="green", ls="--", lw=0.8)
a3.set_xticks(np.arange(4) + w); a3.set_xticklabels(sph)
a3.set_ylabel("Contrast Recovery"); a3.set_title("no-SC vs real-SSS vs truth-SC", fontsize=10)
a3.legend(fontsize=8); a3.grid(alpha=0.3, axis="y")
# 5d-f. 三图像
for k, (tag, v) in enumerate([("no SC", lam_noSC), ("real SSS", lam_sss), ("truth SC (bound)", lam_truth)]):
    a = fig.add_subplot(2, 3, 4 + k)
    b = np.mean([rm(v, *p) for p in bgpos])
    im = a.imshow(v / b, cmap="hot", vmin=0, vmax=9, extent=[axg[0], axg[-1], axg[-1], axg[0]])
    a.set_title(tag, fontsize=10); plt.colorbar(im, ax=a, shrink=0.75)
plt.tight_layout()
plt.savefig(OUT + r"\sss_demo.png", dpi=135)
print("saved sss_demo.png")
