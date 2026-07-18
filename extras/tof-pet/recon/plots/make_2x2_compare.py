# -*- coding: utf-8 -*-
"""2x2 设计: {窗/无窗} x {非TOF/10ps TOF} 四配置对照"""
import numpy as np, json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

D = r".\pet\sim\out\gate3d\recon"
vx = 3.0
ax = (np.arange(128) - 63.5) * vx
X, Y = np.meshgrid(ax, ax)
zc = 32
cfgs = {"A win+nonTOF": "noSC.img",
        "B nowin+nonTOF": "B_nowin_nontof.img",
        "C nowin+TOF10": "C_nowin_tof10.img",
        "D win+TOF10": "D_win_tof10.img"}
spheres = {"d13": (50, 0, 4), "d17": (0, 50, 5.5),
           "d22": (-50, 0, 7.5), "d28": (0, -50, 10)}
bgpos = [(0, 0, 12), (30, 30, 10), (-30, 30, 10), (30, -30, 10), (-30, -30, 10)]

def roi(v, cx, cy, r, dz=1):
    m = (X - cx)**2 + (Y - cy)**2 < r**2
    sl = v[zc-dz:zc+dz+1, m]
    return float(sl.mean()), float(sl.std())

res, imgs = {}, {}
for name, fn in cfgs.items():
    v = np.fromfile(D + "\\" + fn, np.float32).reshape(64, 128, 128)
    bgvals = [roi(v, *p)[0] for p in bgpos]
    bg = np.mean(bgvals); sd = np.std(bgvals)
    d = {"bv_pct": round(sd / bg * 100, 1)}
    for k, (cx, cy, r) in spheres.items():
        mu, _ = roi(v, cx, cy, r)
        d[k + "_CR"] = round(mu / bg, 2)
        d[k + "_CNR"] = round((mu - bg) / (sd + 1e-30), 1)
    res[name] = d; imgs[name] = v[zc] / bg
print(json.dumps(res, indent=2))
json.dump(res, open(D + r"\compare_2x2_results.json", "w"), indent=2)

fig = plt.figure(figsize=(15, 9))
names = list(cfgs.keys())
for i, name in enumerate(names):
    a = fig.add_subplot(2, 4, i + 1)
    im = a.imshow(imgs[name], cmap="hot", vmin=0, vmax=9,
                  extent=[ax[0], ax[-1], ax[-1], ax[0]])
    a.set_title(name + f"\nBV={res[name]['bv_pct']}%", fontsize=9)
    plt.colorbar(im, ax=a, shrink=0.7)
sph = ["d13", "d17", "d22", "d28"]; w = 0.2
cols = {"A win+nonTOF": "tab:blue", "B nowin+nonTOF": "tab:orange",
        "C nowin+TOF10": "tab:green", "D win+TOF10": "tab:red"}
a5 = fig.add_subplot(2, 4, 5)
for j, name in enumerate(names):
    a5.bar(np.arange(4) + j*w, [res[name][s+"_CR"] for s in sph], w,
           label=name.split()[0], color=cols[name])
a5.axhline(8, color="green", ls="--", lw=0.8)
a5.set_xticks(np.arange(4)+1.5*w); a5.set_xticklabels(sph)
a5.set_ylabel("Contrast Recovery"); a5.set_title("CR: quantitative bias", fontsize=10)
a5.legend(fontsize=7); a5.grid(alpha=0.3, axis="y")
a6 = fig.add_subplot(2, 4, 6)
for j, name in enumerate(names):
    a6.bar(np.arange(4) + j*w, [res[name][s+"_CNR"] for s in sph], w,
           label=name.split()[0], color=cols[name])
a6.set_xticks(np.arange(4)+1.5*w); a6.set_xticklabels(sph)
a6.set_ylabel("CNR"); a6.set_title("CNR: detectability", fontsize=10)
a6.legend(fontsize=7); a6.grid(alpha=0.3, axis="y")
a7 = fig.add_subplot(2, 4, 7)
a7.bar(range(4), [res[n]["bv_pct"] for n in names], color=[cols[n] for n in names])
a7.set_xticks(range(4)); a7.set_xticklabels([n.split()[0] for n in names])
a7.set_ylabel("BV (%)"); a7.set_title("Background Variability: noise", fontsize=10)
a7.grid(alpha=0.3, axis="y")
# 2x2 summary text
a8 = fig.add_subplot(2, 4, 8); a8.axis("off")
txt = "2x2 (d28 CR / BV / counts):\n\n"
txt += "         nonTOF        10psTOF\n"
txt += f" win    {res['A win+nonTOF']['d28_CR']:.1f}/{res['A win+nonTOF']['bv_pct']:.0f}%/353k  "
txt += f"{res['D win+TOF10']['d28_CR']:.1f}/{res['D win+TOF10']['bv_pct']:.0f}%/355k\n\n"
txt += f" nowin  {res['B nowin+nonTOF']['d28_CR']:.1f}/{res['B nowin+nonTOF']['bv_pct']:.0f}%/4.2M  "
txt += f"{res['C nowin+TOF10']['d28_CR']:.1f}/{res['C nowin+TOF10']['bv_pct']:.0f}%/4.2M\n\n"
txt += "FINDING (not my prediction!):\n"
txt += "* window -> higher CR (less scatter)\n"
txt += "* TOF noise benefit NEEDS counts:\n"
txt += "  C(4.2M)+TOF -> BV 5% (best)\n"
txt += "  D(355k)+TOF -> BV 20% (worst!)\n"
txt += "  TOF over-converges at low\n"
txt += "  counts @ fixed 3:8 iterations\n"
txt += "* C wins on detectability because\n"
txt += "  no-window's 12x counts feed TOF"
a8.text(0.0, 0.98, txt, fontsize=8.5, family="monospace", va="top")
plt.tight_layout(); plt.savefig(D + r"\compare_2x2.png", dpi=130)
print("saved compare_2x2.png")
