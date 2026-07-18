# -*- coding: utf-8 -*-
"""
三配置对照: A 常规(435-650,非TOF) / B 无窗非TOF / C 无窗+10ps TOF
量化: 对比恢复 CR(定量偏差维度) + 本底变异 BV(噪声维度) + CNR(可探测性)
"""
import numpy as np, json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

D = r".\pet\sim\out\gate3d\recon"
vx = 3.0
ax = (np.arange(128) - 63.5) * vx
X, Y = np.meshgrid(ax, ax)
zc = 32
cfgs = {"A_conv (435-650, non-TOF)": "noSC.img",
        "B_nowin (all-E, non-TOF)": "B_nowin_nontof.img",
        "C_nowin+10psTOF": "C_nowin_tof10.img"}
spheres = {"d13": (50, 0, 4), "d17": (0, 50, 5.5),
           "d22": (-50, 0, 7.5), "d28": (0, -50, 10)}
bgpos = [(0, 0, 12), (30, 30, 10), (-30, 30, 10), (30, -30, 10), (-30, -30, 10)]

def roi(v, cx, cy, r, dz=1):
    m = (X - cx)**2 + (Y - cy)**2 < r**2
    sl = v[zc-dz:zc+dz+1, m]
    return float(sl.mean()), float(sl.std())

res = {}
imgs = {}
for name, fn in cfgs.items():
    v = np.fromfile(D + "\\" + fn, np.float32).reshape(64, 128, 128)
    bgvals = [roi(v, *p)[0] for p in bgpos]
    bg = np.mean(bgvals); bv = np.std(bgvals) / bg * 100
    d = {"bg_variability_pct": round(bv, 1)}
    for k, (cx, cy, r) in spheres.items():
        mu, _ = roi(v, cx, cy, r)
        d[k + "_CR"] = round(mu / bg, 2)
        # CNR = (球-本底)/本底SD
        d[k + "_CNR"] = round((mu - bg) / (np.std(bgvals) + 1e-30), 1)
    res[name] = d
    imgs[name] = v[zc] / bg   # 归一到本底
print(json.dumps(res, indent=2))
json.dump(res, open(D + r"\tof_compare_results.json", "w"), indent=2)

# 图: 三切片 + CR柱状 + BV柱状
fig = plt.figure(figsize=(16, 8))
names = list(cfgs.keys())
for i, name in enumerate(names):
    a = fig.add_subplot(2, 3, i + 1)
    im = a.imshow(imgs[name], cmap="hot", vmin=0, vmax=9,
                  extent=[ax[0], ax[-1], ax[-1], ax[0]])
    a.set_title(name + f"\nBV={res[name]['bg_variability_pct']}%", fontsize=9)
    a.set_xlabel("x(mm)"); plt.colorbar(im, ax=a, shrink=0.75)
# CR 柱状
a4 = fig.add_subplot(2, 3, 4)
sph = ["d13", "d17", "d22", "d28"]
w = 0.25
for j, name in enumerate(names):
    a4.bar(np.arange(4) + j*w, [res[name][s+"_CR"] for s in sph], w, label=name.split()[0])
a4.axhline(8, color="green", ls="--", lw=0.8, label="nominal 8:1")
a4.set_xticks(np.arange(4)+w); a4.set_xticklabels(sph)
a4.set_ylabel("Contrast Recovery"); a4.set_title("Contrast Recovery (bias)", fontsize=10)
a4.legend(fontsize=7); a4.grid(alpha=0.3, axis="y")
# CNR 柱状
a5 = fig.add_subplot(2, 3, 5)
for j, name in enumerate(names):
    a5.bar(np.arange(4) + j*w, [res[name][s+"_CNR"] for s in sph], w, label=name.split()[0])
a5.set_xticks(np.arange(4)+w); a5.set_xticklabels(sph)
a5.set_ylabel("CNR"); a5.set_title("CNR (detectability)", fontsize=10)
a5.legend(fontsize=7); a5.grid(alpha=0.3, axis="y")
# BV
a6 = fig.add_subplot(2, 3, 6)
a6.bar(range(3), [res[n]["bg_variability_pct"] for n in names],
       color=["tab:blue", "tab:orange", "tab:green"])
a6.set_xticks(range(3)); a6.set_xticklabels([n.split()[0] for n in names])
a6.set_ylabel("Background Variability (%)"); a6.set_title("Background Variability (noise)", fontsize=10)
a6.grid(alpha=0.3, axis="y")
plt.tight_layout(); plt.savefig(D + r"\tof_compare.png", dpi=130)
print("saved tof_compare.png")
