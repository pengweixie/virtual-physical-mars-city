# -*- coding: utf-8 -*-
"""
决定性对照: 丢能量分辨换 10ps TOF, 重建上有优势吗?
 A = 常规 (能量窗+非TOF, 353k)
 C = 无窗+TOF10, 无SC (4.2M, 散射56%)         <- 无能量分辨的裸方案
 E = 无窗+TOF10+散射校正 (1.85M trues, 去散射) <- 无能量分辨的完整方案
CR-noise 权衡曲线(后平滑扫描), 匹配噪声看谁高。
"""
import numpy as np, json
from scipy.ndimage import gaussian_filter
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

D = r".\pet\sim\out\gate3d\recon"
vx = 3.0
ax = (np.arange(128) - 63.5) * vx
Xg, Yg = np.meshgrid(ax, ax)
zc = 32
cfgs = {"A conv (win, nonTOF)": ("noSC.img", "tab:blue"),
        "C nowin+TOF (no SC)": ("C_nowin_tof10.img", "tab:green"),
        "E nowin+TOF+SC": ("E_nowin_tof10_sc.img", "tab:purple")}
bgpos = [(0, 0, 12), (30, 30, 10), (-30, 30, 10), (30, -30, 10), (-30, -30, 10)]

def rm(v, cx, cy, r, dz=1):
    m = (Xg - cx)**2 + (Yg - cy)**2 < r**2
    return float(v[zc-dz:zc+dz+1, m].mean())

targets = {"d13": (50, 0, 4), "d17": (0, 50, 5.5), "d22": (-50, 0, 7.5), "d28": (0, -50, 10)}
fwhms = [0, 2, 4, 6, 8, 10]

# 单点表 (FWHM=0)
print("cfg | CR d13/d17/d22/d28 | BV | CNR d28")
tbl = {}
for name, (fn, _) in cfgs.items():
    v = np.fromfile(D + "\\" + fn, np.float32).reshape(64, 128, 128)
    bg = [rm(v, *p) for p in bgpos]; b = np.mean(bg); sd = np.std(bg); bv = sd/b*100
    crs = {k: rm(v, *t)/b for k, t in targets.items()}
    cnr28 = (rm(v, 0, -50, 10)-b)/sd
    tbl[name] = dict(bv=round(bv,1), cnr28=round(cnr28,1), **{k: round(vv,2) for k,vv in crs.items()})
    print(f"{name.split()[0]} | {crs['d13']:.1f}/{crs['d17']:.1f}/{crs['d22']:.1f}/{crs['d28']:.1f} | {bv:.1f}% | {cnr28:.0f}")
json.dump(tbl, open(D + r"\ACE_results.json", "w"), indent=2)

# CR-noise 曲线 (d13 小球 + d28 大球)
fig, axes = plt.subplots(1, 2, figsize=(13, 5.5))
for a, (tn, tt) in zip(axes, [("d13", targets["d13"]), ("d28", targets["d28"])]):
    for name, (fn, col) in cfgs.items():
        v0 = np.fromfile(D + "\\" + fn, np.float32).reshape(64, 128, 128)
        crv, bvv = [], []
        for fw in fwhms:
            sig = fw/2.355/vx
            v = np.stack([gaussian_filter(v0[z], sig) for z in range(64)]) if fw > 0 else v0
            bg = [rm(v, *p) for p in bgpos]; b = np.mean(bg)
            crv.append(rm(v, *tt)/b); bvv.append(np.std(bg)/b*100)
        a.plot(bvv, crv, "-o", color=col, ms=5, label=name.split()[0])
    a.axhline(8, color="green", ls="--", lw=0.8, label="nominal 8:1")
    a.set_xlabel("Background Variability (%)  [noise →]")
    a.set_ylabel("Contrast Recovery")
    a.set_title(f"CR–noise tradeoff: {tn} sphere\n(upper-left=better)", fontsize=10)
    a.legend(fontsize=8); a.grid(alpha=0.3); a.invert_xaxis()
plt.tight_layout(); plt.savefig(D + r"\ACE_compare.png", dpi=140)
print("saved ACE_compare.png")
