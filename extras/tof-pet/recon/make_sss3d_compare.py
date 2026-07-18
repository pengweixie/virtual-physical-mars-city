# -*- coding: utf-8 -*-
"""
3D TOF-aware SSS 最终对照 (申报 40ps 核, 无能量窗):
图1 castor 加性传递函数 γ 扫描 (定标依据) + 本底/物体外响应
图2 it3 三方对照: C40 无校正 / SSS-final (γ*=6 定标) / E40 真值剔除
输入: recon/tof40/{c40,e40}.img, recon/tof40/ssc_final.img, recon/gscan/g{1,3,10,30}.img
"""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import json
plt.rcParams["font.family"] = ["Microsoft YaHei", "SimHei", "DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

D = r".\pet\sim\out\gate3d\recon"
vx = 3.0
ax = (np.arange(128) - 63.5) * vx
X, Y = np.meshgrid(ax, ax)
rho = np.hypot(X, Y)
zc = 32
spheres = {"d13": (50, 0, 4), "d17": (0, 50, 5.5), "d22": (-50, 0, 7.5), "d28": (0, -50, 10)}
bgpos = [(0, 0, 12), (30, 30, 10), (-30, 30, 10), (30, -30, 10), (-30, -30, 10)]
ann = (rho > 115) & (rho < 180)

def load(fn):
    return np.fromfile(D + "\\" + fn, np.float32).reshape(64, 128, 128)

def rm(v, cx, cy, r, dz=1):
    m = (X - cx) ** 2 + (Y - cy) ** 2 < r ** 2
    return float(v[zc - dz:zc + dz + 1, m].mean())

def metrics(v):
    bg = [rm(v, *p) for p in bgpos]
    b, sd = np.mean(bg), np.std(bg)
    out = {"bg": b, "BV": sd / b * 100,
           "ann_ratio": float(v[zc - 2:zc + 3][:, ann].mean()) / b}
    for k, (cx, cy, r) in spheres.items():
        out[k] = rm(v, cx, cy, r) / b
    return out

# ---- 图 1: γ 传递函数扫描 ----
gams = [1, 3, 10, 30]
bgg, anng = [], []
for g in gams:
    v = load(rf"gscan\g{g}.img")
    bgm = rho < 70
    bgg.append(float(v[zc - 3:zc + 4][:, bgm].mean()))
    anng.append(float(v[zc - 3:zc + 4][:, ann].mean()))
fig, axs = plt.subplots(1, 2, figsize=(10, 4))
axs[0].plot(gams, np.array(bgg) / bgg[0] * 100, "o-", c="tab:blue")
axs[0].axhline(100 - 21, ls="--", c="tab:red", label="目标: 加性份额 21%")
axs[0].axvline(6, ls=":", c="k", label=r"$\gamma^*=6$")
axs[0].set(xlabel=r"加性缩放 $\gamma$", ylabel="本底 (%, 相对 γ=1)",
           title="castor 加性传递函数 (实测)\n斜率 ≈ −3.4%/γ → 有效尺度 1/6")
axs[0].legend(fontsize=8); axs[0].grid(alpha=0.3)
axs[1].semilogy(gams, np.maximum(np.array(anng) / bgg[0], 1e-6), "o-", c="tab:orange")
axs[1].set(xlabel=r"$\gamma$", ylabel="物体外活度/本底", title="物体外残余响应")
axs[1].grid(alpha=0.3)
plt.suptitle("加性项定标实验: 1/8 子采样 + scatter 场 ×γ + 复用 sensitivity")
plt.tight_layout()
plt.savefig(D + r"\sss3d_gamma_scan.png", dpi=130)
plt.close()

# ---- 图 2: 最终三方对照 (40ps 核) ----
vC = load(r"tof40\c40.img")
vS = load(r"tof40\ssc_final.img")
vE = load(r"tof40\e40.img")
mC, mS, mE = metrics(vC), metrics(vS), metrics(vE)
fig, axs = plt.subplots(1, 4, figsize=(17, 4.6))
vmax = np.percentile(vS[zc], 99.7)
for a, (v, t) in zip(axs[:3], [(vC, "C 无校正"), (vS, r"真实 3D TOF-SSS ($\gamma^*$定标)"),
                               (vE, "E 真值剔除 (上限)")]):
    a.imshow(v[zc], cmap="hot", vmax=vmax, origin="lower",
             extent=[ax[0], ax[-1], ax[0], ax[-1]])
    a.set_title(t, fontsize=10)
    a.set_xticks([]); a.set_yticks([])
w = 0.25
ks = list(spheres)
for i, (m, t, c) in enumerate([(mC, "C noSC", "tab:gray"), (mS, "SSS", "tab:red"),
                               (mE, "E truth", "tab:green")]):
    axs[3].bar(np.arange(4) + (i - 1) * w, [m[k] for k in ks], w, label=t, color=c)
axs[3].axhline(8, ls=":", c="k", lw=1)
axs[3].set_xticks(range(4), ks)
axs[3].set(ylabel="CR (nominal 8)",
           title=f"CR (BV: C {mC['BV']:.0f}% / SSS {mS['BV']:.0f}% / E {mE['BV']:.0f}%)")
axs[3].legend(fontsize=8)
plt.suptitle("真实 3D TOF-aware SSS 逐事件注入 CASToR — 无校正 vs SSS vs 真值上限 (10ps 数据, 40ps 重建核)")
plt.tight_layout()
plt.savefig(D + r"\sss3d_compare.png", dpi=130)

res = {"C40_noSC": mC, "SSS_final": mS, "E40_truth": mE,
       "gamma_scan": {"gammas": gams, "bg": bgg, "ann": anng}, "gamma_star": 6}
for k in spheres:
    res.setdefault("achievement_pct", {})[k] = round(
        100 * (mS[k] - mC[k]) / max(mE[k] - mC[k], 1e-9))
res["bg_drop_pct"] = round(100 * (1 - mS["bg"] / mC["bg"]), 1)
res["bg_drop_E_pct"] = round(100 * (1 - mE["bg"] / mC["bg"]), 1)
json.dump(res, open(D + r"\sss3d_final.json", "w"), indent=2, default=float)
print(json.dumps(res, indent=2, default=float))
print("saved sss3d_gamma_scan.png / sss3d_compare.png / sss3d_final.json")
