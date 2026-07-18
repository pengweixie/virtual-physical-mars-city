#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L1.5 ISRU 加注战役 —— veh-rocket-02 火星甲烷化构型
====================================================
每发推进剂需求(取自 sim_ascent RTLS 构型):
  一子级 105.3 t 升轨 + 48 t RTLS 储备 + 上面级 62 t = 215.3 t(O/F=3.5
  → CH4 47.8 t + LOX 167.4 t)。
化学路线(净反应):2H₂O + CO₂ → CH₄ + 2O₂(萨巴蒂尔 + 电解闭环)
  → 净耗水 36/16 × m(CH4),联产 O₂ 64/16 × m(CH4)(O/F=4.0 联产比
  高于 3.5 需求 → CH4 定尺寸,O₂ 有富余转生保/备份)。
能耗模型(推定):电解 4.5 kWh/kg H₂O(含效率)、CO₂ 采集压缩
  0.3 kWh/kg、液化 CH4 0.35 / O2 0.22 kWh/kg,系统冗余 ×1.1。
输出:每发能量、电站功率 vs 加注周期、一个发射窗口(~780 sol)的
发射次数;对照 veh-rocket-01 的 1200 t 满箱加注(EQUIPMENT.md §9)。
"""
import math

SOL_H = 24.65
PROP_T = 215.3
OF = 3.5
CH4 = PROP_T / (1 + OF)              # 47.8 t
LOX = PROP_T - CH4
WATER = CH4 * 36 / 16                # 净耗水
O2_CO = CH4 * 64 / 16                # 联产氧
CO2 = CH4 * 44 / 16
H2_SAB = CH4 * 8 / 16                # 萨巴蒂尔氢流量(电解吞吐定尺寸)
H2O_ELECTRO = H2_SAB * 18 / 2        # 电解吞吐(含循环水)

E_electro = H2O_ELECTRO * 1e3 * 4.5      # kWh
E_co2 = CO2 * 1e3 * 0.3
E_liq = (CH4 * 0.35 + O2_CO * 0.22) * 1e3
E_total = (E_electro + E_co2 + E_liq) * 1.1

print('=' * 62)
print('ISRU 加注战役 —— 每发 %.1f t 推进剂(CH4 %.1f + LOX %.1f)' % (PROP_T, CH4, LOX))
print('=' * 62)
print('净耗水 %.1f t/发(← res-rodwell 冰井)| CO₂ %.1f t | 联产 O₂ %.1f t'
      '(富余 %.1f t → 生保)' % (WATER, CO2, O2_CO, O2_CO - LOX))
print('电解吞吐 %.1f t H₂O/发' % H2O_ELECTRO)
print('能量分解: 电解 %.0f + CO₂采集 %.0f + 液化 %.0f MWh ×1.1 冗余'
      ' = %.0f MWh/发' % (E_electro / 1e3, E_co2 / 1e3, E_liq / 1e3, E_total / 1e3))
print('\n电站功率 vs 加注周期(连续运行):')
print('  功率(kWe)   加注天数(sol)   窗口内(780 sol)发射次数')
rows = []
for p in (100, 200, 400, 800, 1600):
    sols = E_total / (p * SOL_H)
    rows.append((p, sols))
    print('  %6.0f      %8.0f          %4.1f' % (p, sols, 780 / sols))
print('\n对照:veh-rocket-01 满箱 1200 t 需 ~1.6 MWe 才赶单窗口(§9);')
print('长十乙 RTLS 构型按需加注 %.0f t,200 kWe 级(pwr-fusion 零头)即可'
      '每窗口 ~%.1f 发 —— 中型复用箭 + ISRU 是火星发射的能量甜点。'
      % (PROP_T, 780 / (E_total / (200 * SOL_H))))

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np
    matplotlib.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei']
    matplotlib.rcParams['axes.unicode_minus'] = False
    fig, ax = plt.subplots(1, 2, figsize=(10.5, 4))
    parts = [E_electro / 1e3, E_co2 / 1e3, E_liq / 1e3,
             0.1 * (E_electro + E_co2 + E_liq) / 1e3]
    ax[0].bar(['电解', 'CO2采集', '液化', '冗余'], parts, color='C0')
    ax[0].set_ylabel('MWh/发'); ax[0].set_title('每发能量分解(共 %.0f MWh)' % (E_total / 1e3))
    ax[0].grid(alpha=.3, axis='y')
    p = np.linspace(50, 2000, 100)
    ax[1].plot(p, 780 / (E_total / (p * SOL_H)), 'C1')
    for pp, ss in rows:
        ax[1].plot(pp, 780 / ss, 'ko', ms=3)
    ax[1].set_xlabel('电站功率 (kWe)'); ax[1].set_ylabel('发射次数 / 窗口(780 sol)')
    ax[1].set_title('发射节奏 vs 电力规模'); ax[1].grid(alpha=.3)
    fig.suptitle('veh-rocket-02 ISRU 加注战役(每发 %.1f t 甲烷/液氧)' % PROP_T)
    fig.tight_layout()
    fig.savefig('scripts/sim_isru_veh_rocket_02.png', dpi=110)
    print('已出图 scripts/sim_isru_veh_rocket_02.png')
except ImportError:
    print('(matplotlib 不可用)')
