#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L2 羽流冲刷分析 —— veh-rocket-01 着陆/发射羽流对地面的载荷与喷砂
================================================================
半经验模型(非 CFD,诚实标注):
  羽流场:动量守恒源流——火星 600 Pa 环境下喷管高度欠膨胀(Pe/Pa ~10²),
    羽流以有效半角 θ_p 扩张;地面动压 q(z) ≈ C·F/(π (z·tanθ_p)²),
    C≈2 为轴线集中因子;近场以 F/(N·A_exit) 封顶(平板冲击极限)。
  侵蚀阈值:取火星羽流-风化层文献量级(Metzger / Mehta 等,给区间不给假精度):
    扬尘/跃移起动 ~0.5 kPa · 强冲刷 ~5 kPa · 承载破坏挖坑 ~30 kPa
  喷砂射程:低仰角弹道(火星无稠密大气减速,颗粒近似弹道)。
目的:① 着陆剖面上三阈值的触发高度;② 触地/发射时坪面载荷 → 验证
  ops-spaceport-01 的烧结坪+土堤设计;③ 喷砂射程 vs 基地布局安全距离。
不含:真实喷管流场 CFD、颗粒两相耦合、地形绕流(此为 COMSOL L3 议题)。
"""
import numpy as np

G = 3.71
# 着陆:3 台海平面机,反推段推力 ~78%(sim_descent 实测节流区间中值)
F_LAND = 3 * 2.30e6 * 0.78          # 5.38 MN
# 发射:6 台全开
F_LAUNCH = 6 * 2.30e6               # 13.8 MN
A_EXIT_SL = np.pi * 0.65**2         # 单台海平面出口面积 1.33 m^2
C_AXIS = 2.0                        # 轴线集中因子
TH_P   = np.radians(25.0)           # 羽流有效半角(欠膨胀展宽,±5° 敏感性)

THRESH = [("扬尘/跃移起动", 0.5e3), ("强冲刷(场区剥蚀)", 5e3), ("承载破坏(挖坑)", 30e3)]

def q_ground(F, z, n_eng, th=TH_P):
    """高度 z 处地面峰值动压(近场平板冲击封顶)。"""
    far = C_AXIS * F / (np.pi * (max(z, 0.1) * np.tan(th))**2)
    near_cap = F / (n_eng * A_EXIT_SL)
    return min(far, near_cap)

def onset_alt(F, q_th, th=TH_P):
    return np.sqrt(C_AXIS * F / (np.pi * q_th * np.tan(th)**2))

def ejecta_range(v, ang_deg):
    a = np.radians(ang_deg)
    return v*v*np.sin(2*a)/G

if __name__ == "__main__":
    print("=== 模型与输入 ===")
    print(f"  着陆推力 {F_LAND/1e6:.1f} MN(3×78%)/ 发射 {F_LAUNCH/1e6:.1f} MN(6×100%)")
    print(f"  羽流半角 {np.degrees(TH_P):.0f}°(欠膨胀 Pe/Pa~10²),轴线因子 {C_AXIS}")
    print(f"  阈值取文献量级(Metzger/Mehta 火星羽流侵蚀):扬尘 0.5 / 强冲刷 5 / 挖坑 30 kPa")

    print("\n=== 着陆:侵蚀触发高度(θ_p 敏感性 20°/25°/30°) ===")
    print("  阈值               触发高度(m) @20°   @25°   @30°")
    for name, q in THRESH:
        alts = [onset_alt(F_LAND, q, np.radians(d)) for d in (20, 25, 30)]
        print(f"  {name:14s} {alts[0]:12.0f} {alts[1]:6.0f} {alts[2]:6.0f}")
    print(f"  → 着陆最后 ~{onset_alt(F_LAND, 0.5e3):.0f} m 全程处于扬尘中(参考:翻转点 4 km,反推段 17 s)")

    print("\n=== 坪面载荷(近场) ===")
    for tag, F, n, z in [("着陆触地(喷口距地 ~0.4 m)", F_LAND, 3, 0.4),
                          ("发射点火(喷口距地 ~0.4 m)", F_LAUNCH, 6, 0.4)]:
        q = q_ground(F, z, n)
        print(f"  {tag}: 坪面峰值 ~{q/1e3:.0f} kPa({q/1e6:.2f} MPa,平板冲击封顶)")
    print(f"  → 三阈值全面超限:裸土必深挖坑+抛掷砾石 → **必须硬化/烧结着陆坪**")
    print(f"    (ops-spaceport-01 设计:Ø40 m 微波烧结坪 ✓;Ø40 m 覆盖触地羽流足印")
    print(f"     r_plume(h=20m)={20*np.tan(TH_P):.0f} m,双侧 {2*20*np.tan(TH_P):.0f} m ≈ 坪径 ✓)")

    print("\n=== 喷砂射程(颗粒近似弹道,火星稀薄大气几乎不减速) ===")
    print("  喷射速度(m/s)   仰角2°     5°     10°  → 最远射程(m)")
    for v in (50, 100, 150, 200):
        rs = [ejecta_range(v, a) for a in (2, 5, 10)]
        print(f"  {v:10d} {rs[0]:10.0f} {rs[1]:7.0f} {rs[2]:7.0f}")
    vmax = 200
    print(f"  → 高速砂粒(~{vmax} m/s、~10°)射程可达 ~{ejecta_range(vmax,10):.0f} m 量级;")
    print(f"    低仰角占多数,但无稠密大气减速 → 数百米内均为喷砂区")

    print("\n=== 防爆土堤拦截(ops-spaceport-01:内径60m/高4m/顶宽3m) ===")
    r_in, h_b = 30.0, 4.0
    ang = np.degrees(np.arctan(h_b/(r_in+6)))
    print(f"  从坪心低仰角喷出的砂粒,土堤(r={r_in}~42m, h={h_b}m)拦截仰角 ≤{ang:.1f}° 的全部弹道")
    print(f"  2° 砂粒在 36 m 处高度 {36*np.tan(np.radians(2)):.1f} m < 4 m ✓ 被拦;")
    print(f"  漏过的 >{ang:.1f}° 高仰角砂粒射程内不应有暴露资产")

    print("\n=== 基地布局核查(manifest 实测坐标,星舰@120,200) ===")
    assets = [("veh-raptor-01 猛禽展示台", 138, 188), ("res-rodwell-01 水冰井", -5, 110),
              ("res-isru-01 ISRU 工厂", 40, 25), ("ops-printer-01 打印工地", 95, 5),
              ("res-mine-01 土壤矿场", 180, -120), ("pwr-fusion-01 聚变堆", -140, 40),
              ("ops-spaceport-02 发射工位", 750, 250)]
    print("  资产                          距离(m)  评估(无土堤裸降场景)")
    for name, ax, az in assets:
        d = np.hypot(ax-120, az-200)
        tag = "!! 喷砂区内,着陆时必须移走/遮蔽" if d < 250 else ("边缘,建议朝向防护" if d < 450 else "安全")
        print(f"  {name:26s} {d:8.0f}  {tag}")
    print(f"  → veh-raptor-01 距星舰仅 ~22 m:纯展示摆位没问题,但任何真实起降前必须撤离;")
    print(f"    这正是 ops-spaceport-01 把着陆坪设在基地外 ~900 m 并加土堤的原因(设计自洽 ✓)")

    # ---- 出图 ----
    try:
        import matplotlib; matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        fig, ax1 = plt.subplots(1, 2, figsize=(12, 4.4))
        z = np.linspace(1, 400, 400)
        for F, n, lab, c in [(F_LAND, 3, 'landing (3 eng @78%)', 'C0'), (F_LAUNCH, 6, 'launch (6 eng)', 'C3')]:
            ax1[0].semilogy(z, [q_ground(F, zz, n)/1e3 for zz in z], c, label=lab)
        for en, q in [("dust/saltation", 0.5e3), ("severe scour", 5e3), ("bearing failure", 30e3)]:
            ax1[0].axhline(q/1e3, ls='--', lw=.7, c='gray')
            ax1[0].annotate(f'{en} {q/1e3:.1f} kPa', (250, q/1e3*1.15), fontsize=8)
        ax1[0].set_xlabel('engine height above ground z (m)'); ax1[0].set_ylabel('peak ground dynamic pressure (kPa)')
        ax1[0].set_title('Plume ground loading vs altitude'); ax1[0].grid(alpha=.3, which='both'); ax1[0].legend()
        angs = np.linspace(1, 15, 60)
        for v in (50, 100, 150, 200):
            ax1[1].plot(angs, [ejecta_range(v, a) for a in angs], label=f'{v} m/s')
        ax1[1].axhline(900, ls='--', c='gray', lw=.8); ax1[1].annotate('spaceport standoff 900 m', (8, 930), fontsize=8)
        ax1[1].set_xlabel('ejection angle (deg)'); ax1[1].set_ylabel('ballistic range (m)')
        ax1[1].set_title('Ejecta sandblasting range (Mars ballistic)'); ax1[1].grid(alpha=.3); ax1[1].legend()
        fig.suptitle('veh-rocket-01 plume erosion (L2 semi-empirical)  —  bare-soil landing scours below ~230 m; sintered pad + berm required')
        fig.tight_layout(); out = "scripts/sim_plume_veh_rocket_01.png"; fig.savefig(out, dpi=110)
        print(f"\n图已存:{out}")
    except Exception as ex:
        print(f"\n[出图跳过] {ex}")
