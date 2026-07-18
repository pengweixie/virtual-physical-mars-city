#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L1.5 栅格舵舵效包线 —— veh-rocket-02(火星大气)
=================================================
舵面控制力矩 M_fin(v,h) = N_fin·Cnδ·δmax·q(v,h)·S·L_arm 与姿控需求力矩
M_req(0.1 rad/s² 俯仰角加速度,I≈m·L²/12)之比,在 (v,h) 平面画等值线;
叠加两条实际回收弹道(sim_hop 跳跃、sim_boostback RTLS 返场)检查舵效覆盖。
参数(推定):Cnδ=1.5 /rad,δmax=20°,S=3.3 m²/片 ×4,臂长 21 m
(空箭 CG ~12 m,舵位 33 m);m=51.4 t,L=36 m。
"""
import numpy as np

G = 3.71
RHO0, HSC = 0.020, 11100.0
CN_D, DMAX = 1.5, np.deg2rad(20)
S_FIN, N_FIN, ARM = 3.3, 4, 21.0
M, L = 51.4e3, 36.0
I = M * L * L / 12
ALPHA_REQ = 0.1                 # rad/s² 姿控需求(5° 修正 ~1.3 s 量级)
M_REQ = I * ALPHA_REQ

q_req = M_REQ / (N_FIN * CN_D * DMAX * S_FIN * ARM)
print('=' * 60)
print('栅格舵舵效包线(火星)')
print('=' * 60)
print('需求力矩 %.2f MN·m(I=%.1e kg·m², α=%.1f rad/s²)' % (M_REQ / 1e6, I, ALPHA_REQ))
print('舵效达标动压 q_req = %.2f kPa' % (q_req / 1e3))
for h in (0, 10e3, 20e3):
    v1 = np.sqrt(2 * q_req / (RHO0 * np.exp(-h / HSC)))
    print('  h=%5.0f km → 需 v ≥ %.0f m/s' % (h / 1e3, v1))
print('对照回收弹道:跳跃演示峰值 q ≈ 0.11 kPa(v=106 m/s 低空)→ 舵效 %.1f%%;'
      % (0.5 * RHO0 * 106**2 / q_req * 100))
print('RTLS 返场再入峰值 q ≈ 0.73 kPa(sim_boostback)→ 舵效 %.0f%%'
      % (730 / q_req * 100))
print('→ 结论:火星大气过稀,整个回收剖面内栅格舵控制权限 <20%'
      '(跳跃段仅 3%),姿控须由推力矢量+RCS 承担;栅格舵在火星构型的'
      '主要职能是网捕挂钩(地球构型遗产件)。')

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    matplotlib.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei']
    matplotlib.rcParams['axes.unicode_minus'] = False
    v = np.linspace(50, 2500, 200)
    h = np.linspace(0, 50e3, 200)
    V, H = np.meshgrid(v, h)
    Q = 0.5 * RHO0 * np.exp(-H / HSC) * V**2
    RATIO = Q / q_req
    fig, ax = plt.subplots(figsize=(8, 5.2))
    cs = ax.contourf(V, H / 1e3, np.clip(RATIO, 0, 3), levels=[0, 0.1, 0.5, 1, 2, 3],
                     cmap='YlOrRd')
    fig.colorbar(cs, label='舵效比 M_fin/M_req')
    ax.contour(V, H / 1e3, RATIO, levels=[1], colors='k', linewidths=1.5)
    # 两条回收弹道包络(特征点折线,示意)
    ax.plot([0, 106, 60, 3], [0.03, 1.2, 2.5, 0.03], 'c-', lw=2, label='跳跃演示弹道')
    ax.plot([1000, 210, 570, 60, 4], [38.2, 53, 20.5, 3, 0.03], 'b--', lw=2,
            label='RTLS 返场弹道')
    ax.set_xlabel('速度 (m/s)'); ax.set_ylabel('高度 (km)')
    ax.set_title('栅格舵舵效包线(黑线 = 舵效比 1;回收弹道全程 <0.11)')
    ax.legend()
    fig.tight_layout()
    fig.savefig('scripts/sim_gridfin_veh_rocket_02.png', dpi=110)
    print('已出图 scripts/sim_gridfin_veh_rocket_02.png')
except ImportError:
    print('(matplotlib 不可用,跳过出图)')
