# -*- coding: utf-8 -*-
"""迭代轴匹配对照: 窗+非TOF(A) vs 窗+10ps TOF(D), 同 353k 计数。
CR-vs-BV across iterations 1..3 = NEMA 标准公平对照(消除 TOF 收敛快的混淆)。"""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

vx = 3.0
ax = (np.arange(128) - 63.5) * vx
X, Y = np.meshgrid(ax, ax)
zc = 32
bgpos = [(0, 0, 12), (30, 30, 10), (-30, 30, 10), (30, -30, 10), (-30, -30, 10)]

def rm(v, cx, cy, r, dz=1):
    m = (X - cx)**2 + (Y - cy)**2 < r**2
    return float(v[zc-dz:zc+dz+1, m].mean())

cfg = {"A win+nonTOF": ("A", "tab:blue"), "D win+TOF10": ("D", "tab:red")}
targets = {"d17": (0, 50, 5.5), "d13": (50, 0, 4)}
data = {}
print("iter | A: CR17 CR13 BV | D: CR17 CR13 BV")
for it in [1, 2, 3]:
    line = f"  {it}  |"
    for name, (tag, _) in cfg.items():
        v = np.fromfile(f"{tag}_it{it}.img", np.float32).reshape(64, 128, 128)
        bg = [rm(v, *p) for p in bgpos]
        b = np.mean(bg); bv = np.std(bg) / b * 100
        for tn, (cx, cy, r) in targets.items():
            data.setdefault(name, {}).setdefault(tn, {"CR": [], "BV": []})
            data[name][tn]["CR"].append(rm(v, cx, cy, r) / b)
            data[name][tn]["BV"].append(bv)
        line += f"  {rm(v,0,50,5.5)/b:.2f} {rm(v,50,0,4)/b:.2f} {bv:.1f}% |"
    print(line)

fig, axes = plt.subplots(1, 2, figsize=(13, 5.5))
for a, tn in zip(axes, targets):
    for name, (tag, col) in cfg.items():
        d = data[name][tn]
        a.plot(d["BV"], d["CR"], "-o", color=col, ms=6, label=name.split()[0])
        for k, it in enumerate([1, 2, 3]):
            a.annotate(f"it{it}", (d["BV"][k], d["CR"][k]), fontsize=7,
                       xytext=(4, 4), textcoords="offset points")
    a.axhline(8, color="green", ls="--", lw=0.8, label="nominal 8:1")
    a.set_xlabel("Background Variability (%)  [noise →]")
    a.set_ylabel("Contrast Recovery")
    a.set_title(f"Iteration-axis fair compare: {tn} sphere\n"
                "same 353k windowed counts; upper-left=better", fontsize=10)
    a.legend(fontsize=8); a.grid(alpha=0.3); a.invert_xaxis()
plt.tight_layout()
plt.savefig("iter_curve.png", dpi=140)
print("saved iter_curve.png")
