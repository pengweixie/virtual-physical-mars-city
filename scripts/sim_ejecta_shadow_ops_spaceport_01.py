#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L2 堤后落砂能量 —— ops-spaceport-01 场区哪里能停设备
======================================================
【C6】结论"4 m 土堤拦截 ≤6.3° 的低角喷砂"成立,但由此**不能**推出堤后有
安全阴影:抛得够高的砂粒可以越堤落在任意半径。本脚本换一个判据——
不是"打不打得到",而是**打到时还剩多少能量**。

模型:坪心点源、无阻力抛射(与【C6】同一假设)。
  越堤条件:轨迹在堤顶半径 r=36 m 处高于 4 m。
  无阻力弹道下落地速度 = 抛出速度,故落点动能 ∝ v²。
  真实羽流溅射以贴地低角为主体,故按抛射角锥 15°~45° 给带
  (>45° 的近垂直抛射存在但通量极小,不作设计依据)。
不含:风、弹跳与二次飞溅、颗粒阻力、非点源(喷口离轴)、源角分布的真实权重。
"""
import numpy as np

G = 3.71
R_CREST, H_BERM, R_TOE = 36.0, 4.0, 42.0
V_NOBERM = 200.0        # 无堤时低角喷砂典型速度(【C6】口径)

def v_min_to_clear(th):
    """给定抛射角,越过堤顶所需的最小抛出速度"""
    c, s = np.cos(th), np.sin(th)
    # y(r=36) = 36 tan(th) - g*36^2/(2 v^2 c^2) >= H
    need = R_CREST * s / c - H_BERM
    if need <= 0:
        return None                       # 该角度下无论多快都压不过(太平)
    return np.sqrt(G * R_CREST**2 / (2 * c * c * need))

def landing_range(v, th):
    return v * v * np.sin(2 * th) / G

if __name__ == '__main__':
    print(f'土堤 r={R_CREST} m / 高 {H_BERM} m,外趾 r={R_TOE} m')
    print('\n=== 刚好越堤的砂粒:落在哪、落地多快 ===')
    print('  抛射角  越堤最小速度  落点半径  落地动能(相对无堤 200 m/s)')
    rows = []
    for deg in (10, 15, 20, 25, 30, 35, 45):
        th = np.radians(deg)
        v = v_min_to_clear(th)
        if v is None:
            print(f'  {deg:4d}°   —— 该角度压不过堤(被拦)')
            continue
        R = landing_range(v, th)
        frac = (v / V_NOBERM) ** 2
        rows.append((deg, v, R, frac))
        print(f'  {deg:4d}°  {v:9.1f} m/s  {R:7.0f} m  {frac*100:8.2f}%')

    Rs = [r[2] for r in rows]
    vs = [r[1] for r in rows]
    print(f'\n  → 越堤砂粒最早落在 r≈{min(Rs):.0f} m,落地速度 {min(vs):.0f}~{max(vs):.0f} m/s')
    print(f'    相对无堤低角喷砂(200 m/s),动能剩 {min(r[3] for r in rows)*100:.2f}~'
          f'{max(r[3] for r in rows)*100:.2f}% —— 土堤把能量削掉约两个数量级')

    print('\n=== 场区物件评估 ===')
    items = [
        ('猛禽检修展示台 veh-raptor-01', 49.5, '堤外'),
        ('推进剂区(卧罐)', 50.5, '堤外 -X'),
        ('控制掩体(半埋+覆土)', 62.0, '堤外 +X'),
        ('消防车库', float(np.hypot(12, 37)), '+Z 通道口'),
        ('物资集装箱 ×3', float(np.hypot(20, 32)), '+Z 通道口'),
    ]
    for name, r, where in items:
        if '通道' in where:
            note = '⚠ 土堤在此断开,直面低角喷砂(200 m/s 量级)'
        elif r >= min(Rs):
            note = f'· 可被越堤落砂击中,但仅 {min(vs):.0f}~{max(vs):.0f} m/s 量级'
        else:
            note = '✅ 落砂够不到'
        print(f'  {name:28s} r={r:5.1f} m  {where:10s} {note}')

    print('\n=== 结论 ===')
    print('  1. 土堤不产生几何阴影——抛得够高的砂粒能越堤落到任意半径;')
    print('     它的作用是**削能量**,不是**挡范围**。')
    print('  2. 堤后落砂只有 12~32 m/s(动能剩 0.4~2.6%),对结构件无威胁;')
    print('     猛禽展示台 r=49.5 m **不需要搬迁**——"必须撤离"的旧判断出自')
    print('     迁场前的裸地场景(无堤,200 m/s 直击),土堤建成后已失效。')
    print('  3. 真正的漏洞是 **+Z 通道开口**:土堤在此断开,消防车库与集装箱堆场')
    print('     直面全速低角喷砂。这是本场区唯一需要补强的位置。')
