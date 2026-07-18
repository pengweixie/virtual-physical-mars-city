# -*- coding: utf-8 -*-
"""散射校正 vs 不校正 对比图: 中心切片 + 水平剖面线"""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

D = r".\pet\sim\out\gate3d\recon"
vx = 3.0
ax = (np.arange(128) - 63.5) * vx
zc = 32
no = np.fromfile(D + r"\noSC.img", np.float32).reshape(64, 128, 128)[zc]
sc = np.fromfile(D + r"\perfectSC.img", np.float32).reshape(64, 128, 128)[zc]
# 归一到本底=1 (各自本底), 便于同尺度比较对比度
def bgmean(v):
    X, Y = np.meshgrid(ax, ax)
    m = (X**2 + Y**2 < 12**2) | ((X-30)**2 + (Y-30)**2 < 10**2) | \
        ((X+30)**2 + (Y-30)**2 < 10**2)
    return v[m].mean()
noN = no / bgmean(no)
scN = sc / bgmean(sc)

fig = plt.figure(figsize=(14, 5.5))
vmax = 9
for i, (img, ttl) in enumerate([(noN, "No scatter correction"),
                                 (scN, "Perfect SC (truth scatter removed)")]):
    a = fig.add_subplot(1, 3, i + 1)
    im = a.imshow(img, cmap="hot", vmin=0, vmax=vmax,
                  extent=[ax[0], ax[-1], ax[-1], ax[0]])
    a.set_title(ttl + f"\n(normalized to background=1)", fontsize=10)
    a.set_xlabel("x (mm)"); a.set_ylabel("y (mm)")
    plt.colorbar(im, ax=a, shrink=0.8, label="contrast (×bg)")
# 剖面线: 过 d22(-50,0) 和 d13(+50,0) 的水平线 y=0
a3 = fig.add_subplot(1, 3, 3)
row = 64  # y≈0
a3.plot(ax, noN[row], "b-", label="No SC", lw=1.5)
a3.plot(ax, scN[row], "r-", label="Perfect SC", lw=1.5)
a3.axhline(1, color="gray", ls=":", lw=0.8, label="background")
a3.axhline(8, color="green", ls="--", lw=0.8, label="nominal 8:1")
a3.set_xlabel("x (mm)  [y=0 line thru d22 & d13]")
a3.set_ylabel("contrast (×bg)")
a3.set_title("Horizontal profile (y=0)\nthrough −50mm(d22) & +50mm(d13) spheres", fontsize=10)
a3.legend(fontsize=8); a3.grid(alpha=0.3); a3.set_ylim(0, 11)
plt.tight_layout()
plt.savefig(D + r"\sc_compare.png", dpi=140)
print("saved sc_compare.png")
