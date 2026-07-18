#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L2 挂缆截获缓冲仿真 —— veh-rocket-02 网式回收阵位(ops-spaceport-02)
====================================================================
一子级(RTLS 到网质量 51.4 t,取自 sim_boostback 终态)以 v 挂入主缆,
栅格舵 4 挂点承载。两种缓冲方案对比:
  A. 弹性缆 + 阻尼:主缆-塔架系统等效刚度 k(推定 400 kN/m,由主缆
     EA≈80 MN、跨 28 m、横向几何因子折算)+ 临界阻尼比 ζ=0.5,
     1-DOF RK4 求峰值钩载/行程/整定时间;
  B. 恒力缓冲绞车(“领航者”式液压恒张力放缆):恒定 n·m·g 制动力,
     行程 = v²/(2g(n-1)),峰值钩载 = n·m·g/4(解析)。
判据:行程 ≤ 网兜下垂裕量 6 m;单钩载荷对比栅格舵铰结构设计载荷
(推定 250 kN,约 3× 静悬挂载荷)。扫挂网速度 2~6 m/s。
"""
import math

G = 3.71
M = 51.4e3                      # 到网质量(kg)
K = 400e3                       # A 方案等效刚度 N/m(推定)
ZETA = 0.5
N_HOOK = 4
HOOK_LIMIT = 250e3              # 单钩设计载荷(推定)
STROKE_LIMIT = 6.0              # 网兜/放缆行程裕量
DT = 1e-3

def spring_damper(v0):
    """A:接触后 1-DOF(y 向下为正位移),F = k y + c y' + m g 悬挂。"""
    c = 2 * ZETA * math.sqrt(K * M)
    y, vy, t = 0.0, v0, 0.0
    peak_f, peak_y, t_settle = 0.0, 0.0, 0.0
    while t < 60:
        def acc(y_, v_):
            return G - (K * y_ + c * v_) / M
        k1v = acc(y, vy); k1y = vy
        k2v = acc(y + 0.5 * DT * k1y, vy + 0.5 * DT * k1v); k2y = vy + 0.5 * DT * k1v
        k3v = acc(y + 0.5 * DT * k2y, vy + 0.5 * DT * k2v); k3y = vy + 0.5 * DT * k2v
        k4v = acc(y + DT * k3y, vy + DT * k3v); k4y = vy + DT * k3v
        y += DT / 6 * (k1y + 2 * k2y + 2 * k3y + k4y)
        vy += DT / 6 * (k1v + 2 * k2v + 2 * k3v + k4v)
        t += DT
        f = K * y + c * vy
        peak_f, peak_y = max(peak_f, f), max(peak_y, y)
        if abs(vy) > 0.05 or abs(f - M * G) > 0.02 * M * G:
            t_settle = t
    return peak_f, peak_y, t_settle

def const_force(v0, n):
    """B:恒力 n·m·g 制动(解析)。"""
    stroke = v0 * v0 / (2 * G * (n - 1))
    return n * M * G, stroke

print('=' * 66)
print('挂缆截获缓冲 —— 到网质量 %.1f t,静悬挂 %.0f kN(单钩 %.0f kN)'
      % (M / 1e3, M * G / 1e3, M * G / N_HOOK / 1e3))
print('=' * 66)
print('方案 A 弹性缆+阻尼(k=%.0f kN/m, ζ=%.1f):' % (K / 1e3, ZETA))
print('  v(m/s)  峰值总载(kN)  单钩(kN)  行程(m)  整定(s)  判定')
rows_a = []
for v in (2, 3, 4.1, 5, 6):
    pf, py, ts = spring_damper(v)
    ok = pf / N_HOOK < HOOK_LIMIT and py < STROKE_LIMIT
    rows_a.append((v, pf, py))
    print('  %4.1f    %8.0f   %7.0f   %6.2f   %5.1f   %s'
          % (v, pf / 1e3, pf / N_HOOK / 1e3, py, ts, '✓' if ok else '✗ 超限'))
print('方案 B 恒力缓冲绞车(行程解析):')
print('  v(m/s)   n=1.5(载/行程)      n=2.0        n=3.0')
rows_b = []
for v in (2, 3, 4.1, 5, 6):
    cells = []
    for n in (1.5, 2.0, 3.0):
        f, s = const_force(v, n)
        cells.append('%.0fkN/%.2fm' % (f / N_HOOK / 1e3, s))
    rows_b.append((v, *[const_force(v, n) for n in (1.5, 2.0, 3.0)]))
    print('  %4.1f   %s' % (v, '   '.join(cells)))
f2, s2 = const_force(4.1, 2.0)
print('\n结论:名义挂网 4.1 m/s(sim_boostback)下——')
print('  A 弹性缆峰值单钩 %.0f kN(动载系数 %.1f),行程 %.2f m;'
      % (rows_a[2][1] / N_HOOK / 1e3, rows_a[2][1] / (M * G), rows_a[2][2]))
print('  B 恒力 n=2 单钩 %.0f kN,行程 %.2f m —— 载荷低且可控,选 B'
      '(与"领航者"液压恒张力放缆一致);' % (f2 / N_HOOK / 1e3, s2))
print('  单钩设计载荷 %.0f kN → 裕度 %.1f×;行程裕量 %.0f m → %.1f×'
      % (HOOK_LIMIT / 1e3, HOOK_LIMIT / (f2 / N_HOOK), STROKE_LIMIT,
         STROKE_LIMIT / s2))

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    matplotlib.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei']
    matplotlib.rcParams['axes.unicode_minus'] = False
    vs = [r[0] for r in rows_a]
    fig, ax = plt.subplots(1, 2, figsize=(10.5, 4))
    ax[0].plot(vs, [r[1] / N_HOOK / 1e3 for r in rows_a], 'o-', label='A 弹性缆 ζ=0.5')
    for j, n in enumerate((1.5, 2.0, 3.0)):
        ax[0].plot(vs, [r[1 + j][0] / N_HOOK / 1e3 for r in rows_b], 's--',
                   label='B 恒力 n=%.1f' % n)
    ax[0].axhline(HOOK_LIMIT / 1e3, c='r', lw=0.8, ls=':')
    ax[0].set_xlabel('挂网速度 (m/s)'); ax[0].set_ylabel('单钩峰值载荷 (kN)')
    ax[0].legend(fontsize=8); ax[0].grid(alpha=.3)
    ax[1].plot(vs, [r[2] for r in rows_a], 'o-', label='A')
    for j, n in enumerate((1.5, 2.0, 3.0)):
        ax[1].plot(vs, [r[1 + j][1] for r in rows_b], 's--', label='B n=%.1f' % n)
    ax[1].axhline(STROKE_LIMIT, c='r', lw=0.8, ls=':')
    ax[1].set_xlabel('挂网速度 (m/s)'); ax[1].set_ylabel('缓冲行程 (m)')
    ax[1].legend(fontsize=8); ax[1].grid(alpha=.3)
    fig.suptitle('veh-rocket-02 网捕缓冲:单钩峰值载荷 / 行程 vs 挂网速度')
    fig.tight_layout()
    fig.savefig('scripts/sim_catch_veh_rocket_02.png', dpi=110)
    print('已出图 scripts/sim_catch_veh_rocket_02.png')
except ImportError:
    print('(matplotlib 不可用,跳过出图)')
