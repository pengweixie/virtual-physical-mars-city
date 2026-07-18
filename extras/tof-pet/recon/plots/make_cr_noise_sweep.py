# -*- coding: utf-8 -*-
"""
匹配噪声对照: 对每个配置扫描后平滑 FWHM, 画 对比恢复 CR vs 本底变异 BV 权衡曲线。
在相同 BV 下 CR 更高者更优。消除"固定迭代对 TOF 不公平"的干扰。
"""
import numpy as np, json
from scipy.ndimage import gaussian_filter
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

D = r".\pet\sim\out\gate3d\recon"
vx, vz = 3.0, 4.05
ax = (np.arange(128) - 63.5) * vx
Xg, Yg = np.meshgrid(ax, ax)
zc = 32
cfgs = {"A win+nonTOF": ("noSC.img", "tab:blue"),
        "B nowin+nonTOF": ("B_nowin_nontof.img", "tab:orange"),
        "C nowin+TOF10": ("C_nowin_tof10.img", "tab:green"),
        "D win+TOF10": ("D_win_tof10.img", "tab:red")}
bgpos = [(0, 0, 12), (30, 30, 10), (-30, 30, 10), (30, -30, 10), (-30, -30, 10)]

def roi_mean(v, cx, cy, r, dz=1):
    m = (Xg - cx)**2 + (Yg - cy)**2 < r**2
    return float(v[zc-dz:zc+dz+1, m].mean())

# 目标球: d17(0,+50,r5.5) 和 d13(+50,0,r4) — 中/小病灶最敏感
targets = {"d17": (0, 50, 5.5), "d13": (50, 0, 4)}
fwhms = [0, 2, 4, 6, 8, 10, 12]   # mm, 后平滑核

fig, axes = plt.subplots(1, 2, figsize=(13, 5.5))
out = {}
for tname, (a_ax, (tcx, tcy, tr)) in zip(targets, zip(axes, targets.values())):
    for name, (fn, col) in cfgs.items():
        v0 = np.fromfile(D + "\\" + fn, np.float32).reshape(64, 128, 128)
        crs, bvs = [], []
        for fw in fwhms:
            sig = (fw / 2.355 / vx, fw / 2.355 / vx)  # 面内平滑 (逐层)
            v = np.stack([gaussian_filter(v0[z], sig) for z in range(64)]) if fw > 0 else v0
            bgvals = [roi_mean(v, *p) for p in bgpos]
            bg = np.mean(bgvals); bv = np.std(bgvals) / bg * 100
            cr = roi_mean(v, tcx, tcy, tr) / bg
            crs.append(cr); bvs.append(bv)
        a_ax.plot(bvs, crs, "-o", color=col, ms=4, label=name.split()[0])
        out.setdefault(tname, {})[name.split()[0]] = {"BV": [round(b,1) for b in bvs],
                                                       "CR": [round(c,2) for c in crs]}
    a_ax.axhline(8, color="green", ls="--", lw=0.8, label="nominal 8:1")
    a_ax.set_xlabel("Background Variability (%)  [noise →]")
    a_ax.set_ylabel("Contrast Recovery")
    a_ax.set_title(f"CR–noise tradeoff: {tname} sphere\n(post-smooth FWHM 0→12mm; upper-left=better)", fontsize=10)
    a_ax.legend(fontsize=8); a_ax.grid(alpha=0.3); a_ax.invert_xaxis()
plt.tight_layout(); plt.savefig(D + r"\cr_noise_sweep.png", dpi=140)
json.dump(out, open(D + r"\cr_noise_sweep.json", "w"), indent=2)
print(json.dumps({k: {c: v2["CR"][2] for c, v2 in v.items()} for k, v in out.items()}, indent=2))
print("saved cr_noise_sweep.png")
