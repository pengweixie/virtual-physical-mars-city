# -*- coding: utf-8 -*-
"""
VM 端: 3D TOF-aware SSS 逐事件注入 CASToR Cdf。
1. ROOT 事件(与 Cdf 同序)→ (φ,r,zm,dz,x_tof) → LUT 插值
2. N_LOR(4D bin) 蒙特卡洛晶体对定标
3. 两分量 tail-fit: 远尾(|r|>170)定平底, 近尾(105<|r|<150)定 SSS 标度 κ
4. s_i [counts/s/mm] = κ·S5D_i/(T·N_LOR·Δx) + flat_density; 插入 Cdf (16B→20B/事件)
运行: python3 sss3d_apply.py  (需 sss3d_lut.npz 在当前目录)
"""
import numpy as np, uproot, json

T_ACQ = 13.0
C_MM_PS = 0.299792458          # mm/ps
lut = np.load("sss3d_lut.npz")
S5D = lut["S5D"]; phis = lut["phis"]; rs = lut["rs"]
zms = lut["zms"]; dzs = lut["dzs"]; xse = lut["xs_edges"]
NPHI, NR, NZM, NDZ, NX = S5D.shape
DX = xse[1] - xse[0]
print("LUT", S5D.shape, "sum", S5D.sum())

# ---------- 1. ROOT 事件 -> 5D 坐标 ----------
t = uproot.open("output/tof10_merged.root")["Coincidences"]
g = lambda b: t[b].array(library="np")
x1, y1, z1 = g("globalPosX1"), g("globalPosY1"), g("globalPosZ1")
x2, y2, z2 = g("globalPosX2"), g("globalPosY2"), g("globalPosZ2")
t1, t2 = g("time1"), g("time2")
N = len(x1)
dx, dy = x2 - x1, y2 - y1
phi = np.arctan2(dy, dx) % np.pi
r = -x1 * np.sin(phi) + y1 * np.cos(phi)
# A = u 投影较小端 (u = (cosφ, sinφ))
proj1 = x1 * np.cos(phi) + y1 * np.sin(phi)
proj2 = x2 * np.cos(phi) + y2 * np.sin(phi)
oneIsA = proj1 <= proj2
zA = np.where(oneIsA, z1, z2); zB = np.where(oneIsA, z2, z1)
tA = np.where(oneIsA, t1, t2); tB = np.where(oneIsA, t2, t1)
zm = 0.5 * (zA + zB); dz = zB - zA
x_tof = (tA - tB) * 1e12 * C_MM_PS / 2.0        # x = (pathA - pathB)/2
# 符号自检 (未散射事件, 真源位置投影)
sc = (g("comptonPhantom1") > 0) | (g("comptonPhantom2") > 0) | \
     (g("RayleighPhantom1") > 0) | (g("RayleighPhantom2") > 0)
sx, sy, sz = g("sourcePosX1"), g("sourcePosY1"), g("sourcePosZ1")
mA = np.stack([np.where(oneIsA, x1, x2), np.where(oneIsA, y1, y2), zA])
mB = np.stack([np.where(oneIsA, x2, x1), np.where(oneIsA, y2, y1), zB])
PA = np.sqrt(((np.stack([sx, sy, sz]) - mA) ** 2).sum(0))
PB = np.sqrt(((np.stack([sx, sy, sz]) - mB) ** 2).sum(0))
x_geom = (PA - PB) / 2.0
u = ~sc
resid = (x_tof - x_geom)[u][:200000]; corr = float(np.median(np.abs(resid)))
print(f"TOF check (trues): median|resid| = {corr:.2f} mm  "
      f"frac<5mm = {(np.abs(resid)<5).mean():.3f}")
assert corr < 5.0, "TOF 符号/尺度不对!"

# ---------- 2. LUT 插值 (线性, 5D) ----------
def interp5d(phi, r, zm, dz, x):
    def frac(v, grid):
        i = np.clip(np.searchsorted(grid, v) - 1, 0, len(grid) - 2)
        f = np.clip((v - grid[i]) / (grid[i + 1] - grid[i]), 0, 1)
        return i, f
    # φ 周期
    pg = phis.copy()
    ip, fp = frac(np.clip(phi, pg[0], pg[-1]), pg)
    ir, fr = frac(np.clip(r, rs[0], rs[-1]), rs)
    iz, fz = frac(np.clip(zm, zms[0], zms[-1]), zms)
    idz, fdz = frac(np.clip(dz, dzs[0], dzs[-1]), dzs)
    xc = 0.5 * (xse[:-1] + xse[1:])
    ix, fx = frac(np.clip(x, xc[0], xc[-1]), xc)
    out = np.zeros(len(phi), np.float64)
    for a in (0, 1):
        for b in (0, 1):
            for c in (0, 1):
                for d in (0, 1):
                    for e in (0, 1):
                        w = (fp if a else 1 - fp) * (fr if b else 1 - fr) * \
                            (fz if c else 1 - fz) * (fdz if d else 1 - fdz) * \
                            (fx if e else 1 - fx)
                        out += w * S5D[ip + a, ir + b, iz + c, idz + d, ix + e]
    return out
S_i = interp5d(phi, r, zm, dz, x_tof)

# ---------- 3. N_LOR 蒙特卡洛 + tail-fit ----------
NCRY, NRING, PITCH, RDET = 592, 64, 4.05, 400.0
NS_MC = 4_000_000
rng = np.random.default_rng(7)
c1 = rng.integers(0, NCRY, NS_MC); c2 = rng.integers(0, NCRY, NS_MC)
r1 = rng.integers(0, NRING, NS_MC); r2 = rng.integers(0, NRING, NS_MC)
ok = c1 != c2
th1 = 2 * np.pi * c1 / NCRY; th2 = 2 * np.pi * c2 / NCRY
mx1, my1 = RDET * np.sin(th1), RDET * np.cos(th1)
mx2, my2 = RDET * np.sin(th2), RDET * np.cos(th2)
mz1 = (r1 - (NRING - 1) / 2) * PITCH; mz2 = (r2 - (NRING - 1) / 2) * PITCH
mphi = np.arctan2(my2 - my1, mx2 - mx1) % np.pi
mr = -mx1 * np.sin(mphi) + my1 * np.cos(mphi)
mproj1 = mx1 * np.cos(mphi) + my1 * np.sin(mphi)
mproj2 = mx2 * np.cos(mphi) + my2 * np.sin(mphi)
mzA = np.where(mproj1 <= mproj2, mz1, mz2); mzB = np.where(mproj1 <= mproj2, mz2, mz1)
mzm = 0.5 * (mzA + mzB); mdz = mzB - mzA
TOTAL_PAIRS = (NCRY * NRING) * (NCRY * NRING - 1) / 2.0
# 4D bin 边 (以 LUT 网格为中心)
def edges(grid):
    e = np.zeros(len(grid) + 1)
    e[1:-1] = 0.5 * (grid[:-1] + grid[1:])
    e[0] = grid[0] - (grid[1] - grid[0]) / 2
    e[-1] = grid[-1] + (grid[-1] - grid[-2]) / 2
    return e
pe, re_, ze, de = edges(phis), edges(rs), edges(zms), edges(dzs)
H_mc, _ = np.histogramdd((mphi[ok], mr[ok], mzm[ok], mdz[ok]), bins=[pe, re_, ze, de])
N_LOR = H_mc / ok.sum() * TOTAL_PAIRS * 2.0     # ×2: MC 有序对/无序对
N_LOR = np.maximum(N_LOR, 1.0)
# 测量事件 4D 直方
H_meas, _ = np.histogramdd((phi, r, zm, dz), bins=[pe, re_, ze, de])
# 双参数联合空间尾定标 (v1, 最终采用): M(b) ≈ κ·S4D(b) + f·B(b), 拟合区 |r|>105。
# 实测教训: TOF 尾定标 (|r|<100,|x|>120, 93%纯散射) 不可用——该区域由多次散射主导,
# 单散射 LUT 的 x 远尾低估 ~30x, 拟合病态 (κ 爆 55x)。空间尾定标物体内覆盖 0.68。
S4D = S5D.sum(axis=4)
rc = 0.5 * (re_[:-1] + re_[1:])
tailm = np.abs(rc) > 105
x_span = np.percentile(x_tof[np.abs(r) > 105], 97.5) - \
         np.percentile(x_tof[np.abs(r) > 105], 2.5)
Mv = H_meas[:, tailm].ravel()
Sv = S4D[:, tailm].ravel()
Bv = (N_LOR[:, tailm] * T_ACQ * x_span).ravel()
A11 = (Sv * Sv).sum(); A12 = (Sv * Bv).sum(); A22 = (Bv * Bv).sum()
b1 = (Sv * Mv).sum(); b2 = (Bv * Mv).sum()
det = A11 * A22 - A12 * A12
kappa = max((b1 * A22 - b2 * A12) / det, 0.0)
flat_dens = max((A11 * b2 - A12 * b1) / det, 0.0)
print(f"joint tail-fit (|r|>105): kappa={kappa:.4e}  flat_dens={flat_dens:.3e} /s/mm/LOR  x_span={x_span:.0f}mm")
sf_pred = kappa * S4D.sum() / N
flat_pred = flat_dens * (N_LOR * T_ACQ * x_span).sum() / N
print(f"SSS 份额={sf_pred*100:.1f}%  flat 份额={flat_pred*100:.1f}%  (真值物体散射 {sc.mean()*100:.1f}%)")

# ---------- 4. 逐事件散射密度 & Cdf 重写 ----------
# N_LOR per event bin
def bin_idx(v, e):
    return np.clip(np.digitize(v, e) - 1, 0, len(e) - 2)
bi = (bin_idx(phi, pe), bin_idx(r, re_), bin_idx(zm, ze), bin_idx(dz, de))
nlor_i = N_LOR[bi]
s_i = (kappa * S_i / (T_ACQ * nlor_i * DX) + flat_dens).astype(np.float32)
print(f"s_i: median={np.median(s_i):.3e}  mean={s_i.mean():.3e} /s/mm")

raw = np.fromfile("castor_data/nowin_tof10_df.Cdf", np.uint8).reshape(N, 16)
new = np.zeros((N, 20), np.uint8)
new[:, 0:4] = raw[:, 0:4]                        # time u32
new[:, 4:8] = s_i.view(np.uint8).reshape(N, 4)   # scatter f32 (插入)
new[:, 8:20] = raw[:, 4:16]                      # TOF f32 + id1 + id2
new.tofile("castor_data/nowin_tof10_ssc_df.Cdf")
hdr = open("castor_data/nowin_tof10_df.Cdh").read()
hdr = hdr.replace("Data filename: nowin_tof10_df.Cdf",
                  "Data filename: nowin_tof10_ssc_df.Cdf")
hdr += "Scatter correction flag: 1\n"
open("castor_data/nowin_tof10_ssc_df.Cdh", "w").write(hdr)
json.dump({"kappa": float(kappa), "flat_dens": float(flat_dens),
           "sf_pred_pct": float(sf_pred * 100), "sf_truth_pct": float(sc.mean() * 100),
           "tof_median_resid_mm": float(corr)}, open("sss3d_apply.json", "w"), indent=2)
print("nowin_tof10_ssc_df.Cdf/Cdh written")
