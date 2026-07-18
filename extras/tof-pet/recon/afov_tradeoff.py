# -*- coding: utf-8 -*-
"""
PET AFOV 权衡 (00-system-design §8-1):
轴向视野 200-400 mm 对 灵敏度 / 床位数 / 全身扫描时间 / 晶体成本 的解析权衡。
模型: 环半径 R=390 mm (晶面);轴上点源符合几何接受度
      s(z0) = sin(atan((L/2-|z0|)/R)) * eps^2,  eps = 单 gamma 探测效率
线源(全身均匀活度)系统灵敏度 ∝ ∫ s(z) dz;
等计数约束下 全身时间 ∝ 床位数 / 线源灵敏度。
输出: out/afov_tradeoff.png, out/afov_tradeoff.json
"""
import json
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = r".\pet\sim\out"
R = 0.390                       # 晶面半径 m
EPS = 0.60                      # 单 511 keV 探测效率 (20mm LYSO + 能窗)
OVERLAP = 0.33
BODY = 1.900                    # 全身覆盖 m
T_REF_BED = 120.0               # 参考: 259mm AFOV 时 120 s/床
AFOV_REF = 0.2592

def line_sens(L, n=2001):
    z = np.linspace(-L / 2, L / 2, n)
    s = np.sin(np.arctan((L / 2 - np.abs(z)) / R)) * EPS**2
    return np.trapezoid(s, z), np.sin(np.arctan((L / 2) / R)) * EPS**2

afovs = np.arange(0.16, 0.421, 0.02)
rows = []
S_ref, _ = line_sens(AFOV_REF)
for L in afovs:
    S_line, s_center = line_sens(L)
    step = L * (1 - OVERLAP)
    beds = int(np.ceil(BODY / step))
    # 等总计数: 每床时间 ∝ 1/S_line (近似; 忽略床重叠计数复用的二阶效应)
    t_bed = T_REF_BED * S_ref / S_line
    rows.append({
        "AFOV_mm": round(L * 1000, 1),
        "rel_line_sens": round(S_line / S_ref, 3),
        "center_point_sens_pct": round(s_center * 100, 2),
        "beds": beds,
        "t_bed_s_equalcounts": round(t_bed, 1),
        "T_wholebody_min": round(beds * t_bed / 60, 1),
        "rel_crystal_cost": round(L / AFOV_REF, 2),
    })

results = {"model": {"R_m": R, "eps": EPS, "overlap": OVERLAP,
                     "ref": f"{AFOV_REF*1000:.0f} mm @ {T_REF_BED:.0f} s/bed"},
           "table": rows}
json.dump(results, open(f"{OUT}\\afov_tradeoff.json", "w",
                        encoding="utf-8"), indent=2, ensure_ascii=False)

A = np.array([r["AFOV_mm"] for r in rows])
T = np.array([r["T_wholebody_min"] for r in rows])
S = np.array([r["rel_line_sens"] for r in rows])
C = np.array([r["rel_crystal_cost"] for r in rows])
fig, a1 = plt.subplots(figsize=(8.5, 5.5))
a1.plot(A, T, "b-o", ms=4, label="Whole-body time (equal counts)")
a1.set_xlabel("Axial FOV (mm)")
a1.set_ylabel("Whole-body scan time (min)", color="b")
a1.axvline(259, color="gray", ls=":", lw=1)
a1.text(262, T.max() * 0.95, "baseline 259 mm", fontsize=8.5, color="gray")
a1.grid(alpha=0.3)
a2 = a1.twinx()
a2.plot(A, S, "r-s", ms=4, label="Relative line sensitivity")
a2.plot(A, C, "g--^", ms=4, label="Relative crystal cost")
a2.set_ylabel("Relative sensitivity / cost", color="r")
lines = a1.get_lines() + a2.get_lines()
a1.legend(lines, [l.get_label() for l in lines], loc="center right", fontsize=9)
plt.title("PET AFOV trade-off: time / sensitivity / cost")
plt.tight_layout()
plt.savefig(f"{OUT}\\afov_tradeoff.png", dpi=140)
for r in rows[::2]:
    print(r)
