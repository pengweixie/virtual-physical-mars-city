# -*- coding: utf-8 -*-
"""
3D TOF-aware Watson SSS 查找表构建 (主机 GPU/cupy)。
输出 S_5D(φ, r, zm, dz, x_tof) 相对强度 (定标由 VM 端 tail-fitting 完成)。
λ 输入 = nowin_tof10 无校正 TOF 重建 it3 图; μ = 解析水柱 Ø200x180。
TOF 维: 散射事件表观位置 x_app = (|PS|+|SB|-|PA|)/2 (沿 LOR, 相对中点),
        在发射积分采样时按 λ(P) 权重直方图进 x bin。
"""
import numpy as np, json, time
try:
    import cupy as xp
    from cupyx.scipy.ndimage import map_coordinates as mapc
    GPU = True
except Exception:
    import numpy as xp
    from scipy.ndimage import map_coordinates as mapc
    GPU = False

OUT = r".\pet\sim\out\gate3d"
MU511 = 0.0096
# 水 μ(E) 真实曲线 (NIST XCOM, /mm), log-log 插值。
# 教训: μ(E')=μ511·(1+0.35(1-k)) 线性近似低估大角散射衰减 (170keV 真实比值 1.5 vs 1.23),
# 使 LUT 尾部/物体内形状比偏高 ~3x → tail-fit 定标后物体内欠校正 (实测 加性/密度=0.10 vs 真值 0.34)
_E_TAB = xp.asarray(np.log([80., 100., 150., 200., 300., 400., 500., 511., 600.]))
_MU_TAB = xp.asarray(np.log([.01837, .01707, .01505, .01370, .01186, .01061, .00969, .00959, .00894]))
def mu_water(E_kev):
    return xp.exp(xp.interp(xp.log(E_kev), _E_TAB, _MU_TAB))
R_CYL, HZ_CYL = 100.0, 90.0
R_DET = 400.0
# 图像网格 (与 CASToR 重建一致)
NI, NZ, VX, VZ = 128, 64, 3.0, 4.05
# ---- 5D 网格 ----
NPHI, NR, NZM, NDZ, NX = 12, 20, 10, 6, 16
phis = (np.arange(NPHI) + 0.5) * np.pi / NPHI
rs = np.linspace(-190, 190, NR)
zms = np.linspace(-112.5, 112.5, NZM)
dzs = np.linspace(-150, 150, NDZ)                  # z2-z1
xs_edges = np.linspace(-200, 200, NX + 1)          # TOF 表观位置 bin (mm)
xs_c = 0.5 * (xs_edges[:-1] + xs_edges[1:])

# ---- λ 图 (无校正 TOF 重建, 平滑) ----
lam = np.fromfile(OUT + r"\recon\C_nowin_tof10.img", np.float32).reshape(NZ, NI, NI)
from scipy.ndimage import gaussian_filter
lam = gaussian_filter(lam, (1.0, 1.5, 1.5))
LAM = xp.asarray(lam)

# ---- 3D 散射点网格 (20mm) ----
g = np.arange(-90, 91, 20.0)
gz = np.arange(-80, 81, 20.0)
SX, SY, SZ = np.meshgrid(g, g, gz, indexing="ij")
m = SX**2 + SY**2 < (R_CYL - 5)**2
SX, SY, SZ = [xp.asarray(a[m]) for a in (SX, SY, SZ)]
NS = int(SX.size)
print(f"GPU={GPU}  scatter pts={NS}  bins={NPHI*NR*NZM*NDZ}")

def water_exit3d(px, py, pz, ux, uy, uz):
    """点(柱内)沿方向到水柱面(侧面或端盖)的距离, 解析"""
    a = ux * ux + uy * uy
    b = px * ux + py * uy
    c = px * px + py * py - R_CYL**2
    t_rad = xp.where(a > 1e-12, (-b + xp.sqrt(xp.maximum(b * b - a * c, 0))) / xp.maximum(a, 1e-12), 1e9)
    t_cap = xp.where(xp.abs(uz) > 1e-9, (xp.sign(uz) * HZ_CYL - pz) / xp.where(xp.abs(uz) > 1e-9, uz, 1.0), 1e9)
    return xp.minimum(t_rad, xp.maximum(t_cap, 0))

NSAMP = 24
def ray_tof_hist(px, py, pz, ux, uy, uz, tmax, x0, tsign):
    """
    沿 (u) 从 S 采样发射点 P (距离 t∈[0,tmax]), λ 加权, 表观 TOF 位置 x = x0 + tsign·t,
    直方到 NX bins。返回 (NS, NX)。
    """
    t = xp.linspace(0, 1, NSAMP)[None, :] * tmax[:, None]
    PX = px[:, None] + ux[:, None] * t
    PY = py[:, None] + uy[:, None] * t
    PZ = pz[:, None] + uz[:, None] * t
    lamv = mapc(LAM, xp.stack([(PZ / VZ + (NZ - 1) / 2).ravel(),
                               (PY / VX + (NI - 1) / 2).ravel(),
                               (PX / VX + (NI - 1) / 2).ravel()]),
                order=1, mode="constant").reshape(PX.shape)
    w = (lamv * (tmax / NSAMP)[:, None]).astype(xp.float32)
    x_app = x0[:, None] + tsign * t
    idx = xp.clip(((x_app - xs_edges[0]) / (xs_edges[1] - xs_edges[0])).astype(xp.int32), 0, NX - 1)
    out = xp.zeros((int(px.size), NX), dtype=xp.float32)
    rows = xp.arange(int(px.size))[:, None] * xp.ones((1, NSAMP), dtype=xp.int32)
    fidx = (rows * NX + idx).ravel()
    if GPU:
        import cupyx
        cupyx.scatter_add(out.reshape(-1), fidx, w.ravel())
    else:
        np.add.at(out.reshape(-1), fidx, w.ravel())
    return out

S5D = np.zeros((NPHI, NR, NZM, NDZ, NX), np.float32)
t0 = time.time()
for i, p in enumerate(phis):
    u2 = xp.asarray([np.cos(p), np.sin(p)])
    n2 = xp.asarray([-np.sin(p), np.cos(p)])
    for j, r0 in enumerate(rs):
        if abs(r0) >= R_DET - 1:
            continue
        th = np.sqrt(R_DET**2 - r0**2)
        for k, zm in enumerate(zms):
            for l, dz in enumerate(dzs):
                zA, zB = zm - dz / 2, zm + dz / 2
                if abs(zA) > 131 or abs(zB) > 131:
                    continue
                A = xp.asarray([float(r0 * n2[0] - th * u2[0]), float(r0 * n2[1] - th * u2[1]), zA])
                B = xp.asarray([float(r0 * n2[0] + th * u2[0]), float(r0 * n2[1] + th * u2[1]), zB])
                # LOR 单位向量与中点 (用于 x_app 投影)
                Lvec = B - A; Llen = float(xp.linalg.norm(Lvec)); Lu = Lvec / Llen
                mid = (A + B) / 2
                dA = xp.stack([A[0] - SX, A[1] - SY, A[2] - SZ])
                dB = xp.stack([B[0] - SX, B[1] - SY, B[2] - SZ])
                RA = xp.sqrt((dA**2).sum(0)); RB = xp.sqrt((dB**2).sum(0))
                uA = dA / RA; uB = dB / RB                      # S->A, S->B 单位
                cosT = -(uA * uB).sum(0)
                kk = 1.0 / (2.0 - cosT)                          # E'/E
                KN = kk**2 * (kk + 1.0 / kk - (1.0 - cosT**2))
                muE = mu_water(511.0 * kk)
                wA = water_exit3d(SX, SY, SZ, uA[0], uA[1], uA[2])
                wB = water_exit3d(SX, SY, SZ, uB[0], uB[1], uB[2])
                pref = KN / (RA**2 * RB**2)
                # I_A 项: P 沿 S->A; 表观位置推导:
                #   |PS|=t, |PA|=|SA|-t, 散射腿 |SB| 固定
                #   Δ = (|PS|+|SB|) - |PA| = 2t + |SB| - |SA| → x_app_along_time = Δ/2 = t + (|SB|-|SA|)/2
                #   转成沿 LOR 几何坐标(相对中点, 朝 B 为正): 直达事件 P 的 x_geo = (|PA|... 对齐:
                #   对未散射事件 x = (dist(P,B)-dist(P,A))/2? castor TOF 约定: 距 A 近→负/正需一致;
                #   我们只需 LUT 与 VM 端事件同一约定: 均用 x = (t_arr1 - t_arr2)*c/2 的镜像 → 统一取
                #   x_app = ( (|PS|+|SB|) - |PA| ) / 2, 事件端同式 (对未散射: x=(|PB|-|PA|)/2)。
                # x 约定 (LUT 与 VM 事件端统一): x = (到达 A 的总路径 − 到达 B 的总路径)/2 … 等价形式:
                # I_A 项 (P 沿 S->A, 未散射光子到 A): 路径A = |SA|−t, 路径B = t+|SB|
                #   x_app = ((|SA|−t) − (t+|SB|))/2 = (RA−RB)/2 − t
                base = (RA - RB) / 2
                IA = ray_tof_hist(SX, SY, SZ, uA[0], uA[1], uA[2], wA, base, -1.0)
                attA = xp.exp(-MU511 * wA - muE * wB)
                # I_B 项 (P 沿 S->B, 未散射光子到 B): 路径A = t+|SA|, 路径B = |SB|−t
                #   x_app = ((t+|SA|) − (|SB|−t))/2 = (RA−RB)/2 + t
                IB = ray_tof_hist(SX, SY, SZ, uB[0], uB[1], uB[2], wB, base, +1.0)
                attB = xp.exp(-MU511 * wB - muE * wA)
                contrib = (pref * attA)[:, None] * IA + (pref * attB)[:, None] * IB
                S5D[i, j, k, l] = xp.asnumpy(contrib.sum(0)) if GPU else contrib.sum(0)
    print(f"phi {i+1}/{NPHI}  elapsed {time.time()-t0:.0f}s", flush=True)

np.savez_compressed(OUT + r"\sss3d_lut.npz",
                    S5D=S5D, phis=phis, rs=rs, zms=zms, dzs=dzs, xs_edges=xs_edges)
print("LUT saved", S5D.shape, "sum", S5D.sum())
