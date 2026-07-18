#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L2 落地倾覆判据 —— veh-rocket-01 星舰 6 腿着陆稳定性
====================================================
刚体绕下坡支撑边(pivot)翻转的静/动稳定分析:
  静态:坡面上 CG 竖直投影落在支撑多边形内 → 不翻;临界坡角 θ_max=atan(d/h_cg)。
  动态:触地残余侧向速度经 pivot 转成转动动能,≥ 翻越能垒则倾覆 → 临界侧速 v_crit。
几何取自模型:6 脚垫半径 R_leg=5.9 m(veh-rocket-01.js 实测),
最不利为"平边朝下坡"翻越,支撑臂 d_edge=R_leg·cos30°。
目的:给出着陆场坡度上限 + GNC 侧向速度上限(落地状态设计约束)。
不含:腿的缓冲行程/弹塑性、地面承载失效、脚垫打滑。
"""
import numpy as np

G = 3.71
R_LEG = 5.9                       # m 脚垫半径(模型实测)
D_EDGE = R_LEG*np.cos(np.pi/6)    # 平边朝下坡:支撑臂(最不利)
D_VERT = R_LEG                    # 单腿朝下坡:支撑臂(较稳)

# CG 高度质量分解(估算,量级用):干重 120t + 出舱货 100t
#   构件            质量t  质心高m
PARTS = [
    ("发动机/推力结构", 27, 3.5),
    ("箱体结构(空)",   45, 16.0),
    ("鼻锥/头罐结构",   18, 42.0),
    ("前后翼",         10, 30.0),
    ("其他系统",       20, 20.0),
]
M_DRY = sum(p[1] for p in PARTS)          # =120 t
CG_DRY = sum(p[1]*p[2] for p in PARTS)/M_DRY

def cg_height(cargo_t=100.0, cargo_h=35.0):
    m = M_DRY + cargo_t
    return (M_DRY*CG_DRY + cargo_t*cargo_h)/m, m

def static_limit(h_cg, d):
    return np.degrees(np.arctan(d/h_cg))

def v_crit(h_cg, m_t, slope_deg, d):
    """触地侧向速度临界值(能量法,绕下坡 pivot 边)。"""
    m = m_t*1000
    L = np.hypot(d, h_cg)                    # CG 到 pivot 距离
    alpha = np.arctan(d/h_cg)                # 到"越过 pivot"需转过的角
    theta = np.radians(slope_deg)
    barrier_ang = alpha - theta              # 坡度抵消一部分能垒
    if barrier_ang <= 0:
        return 0.0                           # 已静态失稳
    dPE = m*G*L*(1 - np.cos(barrier_ang))    # 翻越能垒
    # 转动惯量:I_cg≈m·k^2(k≈有效回转半径,质量沿高分布);pivot 用平行轴
    k = 0.32*h_cg
    I_cg = m*k**2
    I_piv = I_cg + m*L**2
    # 触地水平动量绕 pivot 的角动量 H=m·v·h_cg → 转动动能 = H^2/(2I)
    # 令 KE_rot=dPE 解 v:  (m v h_cg)^2/(2 I_piv)=dPE
    v = np.sqrt(2*I_piv*dPE)/(m*h_cg)
    return v

if __name__ == "__main__":
    print("=== 几何/质量 ===")
    print(f"  脚垫半径 R_leg={R_LEG} m;支撑臂 平边朝下坡 d_edge={D_EDGE:.2f} m(最不利)/ 单腿朝下坡 d_vert={D_VERT:.2f} m")
    print(f"  干重质心 CG_dry={CG_DRY:.1f} m")
    for cargo, hc in [(0,None),(100,35),(150,35)]:
        h,m = cg_height(cargo)
        tag = "空载(返回)" if cargo==0 else f"载货{cargo}t@35m"
        print(f"  {tag:14s}: 质量 {m:.0f}t, CG 高度 {h:.1f} m")

    print("\n=== 静态倾覆:临界坡角 θ_max = atan(d/h_cg) ===")
    print("  CG高(m)  平边朝下坡(°)  单腿朝下坡(°)")
    for h in (16,18,20,22,24,26,28):
        print(f"  {h:6.0f} {static_limit(h,D_EDGE):13.1f} {static_limit(h,D_VERT):13.1f}")
    hL,mL = cg_height(100)
    print(f"  → 载货态 CG {hL:.1f} m:最不利静态坡度极限 {static_limit(hL,D_EDGE):.1f}°"
          f"(建议着陆场坡度 <{static_limit(hL,D_EDGE)*0.6:.0f}° 留 40% 裕度)")

    print("\n=== 动态倾覆:临界触地侧向速度 v_crit(m/s,载货态 CG,平边朝下坡) ===")
    print("  坡度(°)  v_crit(m/s)")
    for s in (0,2,4,6,8,10):
        print(f"  {s:6.0f} {v_crit(hL,mL,s,D_EDGE):10.1f}")
    print(f"  → 平地临界侧速 {v_crit(hL,mL,0,D_EDGE):.1f} m/s;8° 坡上降到 {v_crit(hL,mL,8,D_EDGE):.1f} m/s")
    print(f"    动力下降末端典型残余侧速 1~3 m/s → 平地/缓坡有裕度,陡坡(>8°)需收紧 GNC 横移。")

    # ---- 出图 ----
    try:
        import matplotlib; matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(1, 2, figsize=(11, 4.4))
        hs = np.linspace(14, 30, 60)
        ax[0].plot(hs, [static_limit(h,D_EDGE) for h in hs], 'C3', label='edge-downhill (worst)')
        ax[0].plot(hs, [static_limit(h,D_VERT) for h in hs], 'C0', label='leg-downhill')
        ax[0].axvline(hL, ls='--', c='gray', lw=.8); ax[0].annotate(f'loaded CG {hL:.0f}m',(hL,static_limit(hL,D_VERT)))
        ax[0].set_xlabel('CG height (m)'); ax[0].set_ylabel('static tip-over slope limit (deg)')
        ax[0].set_title('Static slope limit vs CG height'); ax[0].grid(alpha=.3); ax[0].legend()
        ss = np.linspace(0, 12, 60)
        for cargo in (0,100,150):
            h,m = cg_height(cargo); lab = 'empty' if cargo==0 else f'cargo {cargo}t'
            ax[1].plot(ss, [v_crit(h,m,s,D_EDGE) for s in ss], label=f'{lab} (CG {h:.0f}m)')
        ax[1].axhspan(1,3, color='gray', alpha=.15); ax[1].annotate('typical residual 1-3 m/s',(0.3,2.1))
        ax[1].set_xlabel('ground slope (deg)'); ax[1].set_ylabel('critical lateral touchdown speed (m/s)')
        ax[1].set_title('Dynamic tip-over: critical lateral speed'); ax[1].grid(alpha=.3); ax[1].legend()
        fig.suptitle(f'veh-rocket-01 landing tip-over (L2)  —  6 legs R={R_LEG}m, loaded static limit {static_limit(hL,D_EDGE):.1f} deg')
        fig.tight_layout(); out="scripts/sim_tipover_veh_rocket_01.png"; fig.savefig(out, dpi=110)
        print(f"\n图已存:{out}")
    except Exception as ex:
        print(f"\n[出图跳过] {ex}")
