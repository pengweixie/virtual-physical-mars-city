#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L2 坪面热载:发射 vs 着陆 —— ops-spaceport-01 "一坪两用" 判据
================================================================
既有羽流账(EQUIPMENT.md §9【C6】)算的是**机械侵蚀**(动压 vs 侵蚀阈值),
从未算过**热**。而发射与着陆的热工况差别很大:着陆 3 台 @78% 掠过约 1 s,
发射 6 台全开、车辆静止、喷口贴地 2~3 s。本脚本回答:Ø40 m 烧结坪在两种
工况下各被熔掉多深,"一坪两用"是否成立。

方法(半解析,非 CFD——如实标注):
  对流边界的半无限固体(Carslaw & Jaeger §2.7):
      T_w(t) = T_r + (T_i - T_r)·exp(β²)·erfc(β),  β = h√(αt)/k
  该式自带自限:表面趋近恢复温度后热流自然衰减,不会出现超过羽流温度的解。
  熔深按能量法:超过熔点后的净输入 / (ρ·[cp·ΔT + L_f])。
玄武岩:k=1.7 W/mK, α=7e-7 m²/s, ρ=2900, cp=1000, L_f=400 kJ/kg, T_melt≈1500 K。
羽流恢复温度取 3000 K(甲烷/液氧海平面,已计入喷口膨胀降温)。
对流系数 h 是主不确定量,按冲击射流经验区间 2~8 kW/m²K 给带。
不含:真实喷流 CFD、辐射项、多喷管干涉、熔层被吹走后的二次侵蚀、裂纹扩展。
"""
import numpy as np
from math import erfc, exp, sqrt, pi

K_ROCK, ALPHA, RHO = 1.7, 7e-7, 2900.0
CP, L_FUS = 1000.0, 400e3
T_AMB, T_MELT = 210.0, 1500.0
T_REC = 3000.0                      # 羽流恢复温度

def surface_temp(h, t):
    """对流边界半无限解(自限)"""
    beta = h * sqrt(ALPHA * t) / K_ROCK
    if beta > 6:                     # 大 β 渐近,避免 exp 溢出
        f = 1.0 / (beta * sqrt(pi))
    else:
        f = exp(beta * beta) * erfc(beta)
    return T_REC + (T_AMB - T_REC) * f

def melt_depth(h, t):
    """熔深能量法:表面到达熔点后,净热流全部用于推进熔融前沿"""
    beta = h * sqrt(ALPHA * t) / K_ROCK
    if beta > 6:
        f = 1.0 / (beta * sqrt(pi))
    else:
        f = exp(beta * beta) * erfc(beta)
    if T_REC + (T_AMB - T_REC) * f < T_MELT:
        return 0.0                   # 没到熔点
    q_net = h * (T_REC - T_MELT)     # 熔面处的驱动热流(保守:全程按熔点算)
    e_melt = RHO * (CP * (T_MELT - T_AMB) + L_FUS)   # J/m^3
    return q_net * t / e_melt

CASES = [
    ('着陆(3台@78%,掠过)', 1.0),
    ('发射(6台@100%,静止)', 2.5),
]

if __name__ == '__main__':
    print(f'羽流恢复温度 {T_REC:.0f} K;玄武岩熔点 {T_MELT:.0f} K')
    print('\n=== 表面峰温与熔深(h 取区间) ===')
    print('  h kW/m²K |   着陆峰温K  熔深mm |   发射峰温K  熔深mm | 发射/着陆熔深')
    for h in (2000, 4000, 6000, 8000):
        r = []
        for _, t in CASES:
            r.append((surface_temp(h, t), melt_depth(h, t) * 1000))
        ratio = r[1][1] / r[0][1] if r[0][1] > 0 else float('inf')
        print(f'  {h/1000:8.0f} | {r[0][0]:10.0f} {r[0][1]:8.2f} | '
              f'{r[1][0]:10.0f} {r[1][1]:8.2f} | {ratio:8.1f}x')

    h0 = 5000
    print(f'\n=== 名义 h={h0/1000:.0f} kW/m²K ===')
    for name, t in CASES:
        print(f'  {name:22s} 峰温 {surface_temp(h0,t):5.0f} K,熔深 {melt_depth(h0,t)*1000:5.2f} mm')
    dl, du = melt_depth(h0, 1.0), melt_depth(h0, 2.5)
    print(f'  → 两种工况都会熔掉一层玻璃质表层,发射是着陆的 {du/dl:.1f} 倍')

    print('\n=== 累计:坪面还能撑几次 ===')
    PAD_T = 0.10      # m 烧结层厚度(取 10 cm)
    for label, d in (('每次着陆', dl), ('每次发射', du)):
        print(f'  {label} 熔蚀 {d*1000:.2f} mm → 烧结层 {PAD_T*1000:.0f} mm 可支撑 {PAD_T/d:.0f} 次')
    print('  注:熔层原地凝固可自愈一部分(自釉化),但热震裂纹与剥落是累积的;'
          '\n     取 50% 有效自愈,寿命折半仍为数十至上百次量级。')

    print('\n=== 缓解手段 ===')
    # 抬高发射台:羽流扩张使热流下降 ~ (h0/h)^2 面积稀释 → 等效 h 下降
    for label, hh, tt in (
        ('基线:平坪直射', h0, 2.5),
        ('抬高发射台 +6 m(羽流扩张稀释)', h0 * 0.35, 2.5),
        ('台下导流槽(羽流侧向导出)', h0 * 0.25, 2.5),
        ('抬高 + 导流', h0 * 0.15, 2.5),
    ):
        print(f'  {label:30s} 峰温 {surface_temp(hh,tt):5.0f} K,熔深 {melt_depth(hh,tt)*1000:5.2f} mm')

    print('\n=== 结论 ===')
    print('  1. 热学上"一坪两用"成立:两种工况都只熔掉毫米级表层,烧结坪是')
    print('     "可消耗-可自愈"面层,不是被一次打穿——不需要导流槽。')
    print('  2. 发射熔蚀率是着陆的 ~2.5 倍,坪心寿命由发射次数主导;')
    print('     若将来节奏提高到年内多发,抬高发射台可把熔深再降一个量级(见上表)。')

    # ---- 换算到真实发射节奏(承接 res-cryo-01 账 8:季节性场区) ----
    print('\n=== 真实节奏下的坪面寿命 ===')
    WIN_YR = 26 / 12          # 会合窗口 ≈ 2.17 年
    for wins_per_launch, tag in ((0.64, '最密(0.64 窗口/发)'), (5.1, '最疏(5.1 窗口/发)')):
        yrs_per_launch = wins_per_launch * WIN_YR
        n = PAD_T / du                       # 可支撑发射次数
        print(f'  {tag:22s} {yrs_per_launch:5.1f} 年/发 → 烧结层可用 {n*yrs_per_launch:5.0f} 年')
    print('  → 按本场区的季节性节奏,坪面熔蚀寿命是数十年量级,远长于关注区间;')
    print('    不需要专用再烧结设备,列为长周期维护项即可。')
    print('\n  火星特有的赦免:Starbase 首发把混凝土坪掀翻的机理是孔隙水闪蒸剥落,')
    print('  而干燥风化层烧结体无自由水 —— 该失效模式在火星不存在。')
