#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
任务 Δv 账本 —— veh-rocket-01 火表 → 低火轨 → 地球转移(TEI)
============================================================
把 L2 上升段结果接上地球返回注入,给出完整返回任务 Δv 预算与返回载荷能力。
方法:上升段用 sim_ascent 的 L2 结果(4.02 km/s,含引力/阻力损失);
      LMO→TEI 用 patched-conic 解析(脉冲 + Oberth);Tsiolkovsky 反解返回载荷。
标注:TEI 段为解析轨道力学(非时间积分),与 L2 上升结果拼接;非高保真轨迹。
"""
import numpy as np

MU   = 4.282837e13
R    = 3.3895e6
PARK = 200e3                 # 低火轨(停泊轨)高度
ISP  = 375.0
G0E  = 9.80665
M_DRY   = 120_000.0
M_PROP_FULL = 1_200_000.0    # 满箱

DV_ASCENT_L2 = 4020.0        # sim_ascent_veh_rocket_01.py 的 L2 结果(m/s)
RESERVE = 0.03               # 中途修正/弥散储备

def v_circ(alt): return np.sqrt(MU/(R+alt))
def v_esc(alt):  return np.sqrt(2*MU/(R+alt))

def tei_dv(v_inf, alt=PARK):
    """从停泊圆轨注入到双曲逃逸(地球转移),Oberth 高效单脉冲。"""
    vp = np.sqrt(v_esc(alt)**2 + v_inf**2)      # 近火点所需速度
    return vp - v_circ(alt)

def max_payload(dv_req):
    """满箱下满足任务 Δv 的最大返回载荷(Tsiolkovsky 反解)。"""
    ve = ISP*G0E
    ratio = np.exp(dv_req/ve)                    # m0/mf
    # m0 = M_DRY + P + PROP_FULL, mf = M_DRY + P
    # ratio = (M_DRY+P+PROP)/(M_DRY+P) → 解 P
    P = M_PROP_FULL/(ratio-1) - M_DRY
    return P

if __name__ == "__main__":
    print("=== 停泊轨(低火轨 200 km) ===")
    print(f"  v_circ = {v_circ(PARK):.0f} m/s, v_esc = {v_esc(PARK):.0f} m/s")

    print("\n=== 地球返回窗口(火星出发 v_inf)对应 TEI Δv ===")
    print("  v_inf(km/s)  TEI Δv(m/s)  任务总Δv(km/s)  满箱返回载荷(t)")
    windows = [(2.6,"低能窗口"),(2.9,"标称窗口"),(3.2,"较快转移"),(3.5,"快速转移")]
    for vinf, tag in windows:
        tei = tei_dv(vinf*1000)
        dv_mission = (DV_ASCENT_L2 + tei)*(1+RESERVE)
        P = max_payload(dv_mission)
        print(f"  {vinf:6.1f} ({tag})  {tei:8.0f}   {dv_mission/1000:11.2f}   {P/1000:10.0f}")

    print("\n=== 标称窗口(v_inf=2.9 km/s)任务 Δv 账本 ===")
    tei = tei_dv(2900)
    dv_core = DV_ASCENT_L2 + tei
    dv_mission = dv_core*(1+RESERVE)
    print(f"  ① 火表→低火轨(L2 上升,含损失)  {DV_ASCENT_L2:6.0f} m/s")
    print(f"  ② 低火轨→地球转移(TEI,Oberth)   {tei:6.0f} m/s")
    print(f"  ③ 储备({RESERVE*100:.0f}% 中途修正/弥散)     {dv_core*RESERVE:6.0f} m/s")
    print(f"  ──────────────────────────────")
    print(f"  任务总 Δv(火表→地球转移)         {dv_mission:6.0f} m/s = {dv_mission/1000:.2f} km/s")
    P = max_payload(dv_mission)
    prop_need = (M_DRY+P)*(np.exp(dv_mission/(ISP*G0E))-1)
    print(f"  满箱 {M_PROP_FULL/1000:.0f}t + 干重 {M_DRY/1000:.0f}t → 最大返回载荷 {P/1000:.0f} t")
    print(f"  (校验:返回载荷 {P/1000:.0f}t 时耗推进剂 {prop_need/1000:.0f}t ≈ 满箱 {M_PROP_FULL/1000:.0f}t)")
    print(f"\n=== 对照 §9【A】 ===")
    print(f"  §9【A】(直接估算):满箱带 ~100t 返回载荷 Δv=6.9 km/s 闭合 TEI")
    print(f"  本账本(经停泊轨,Oberth):任务 Δv {dv_mission/1000:.2f} km/s,满箱带 {P/1000:.0f}t")
    print(f"  → 经停泊轨的 Oberth 效率使实际任务 Δv 低于直接估算,返回能力 {P/1000:.0f}t(与交接文档 100~150t 一致)")

    # ---- 出图:返回载荷 vs 出发窗口 ----
    try:
        import matplotlib; matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        vinf = np.linspace(2.4, 3.8, 60)*1000
        fig, ax = plt.subplots(1, 2, figsize=(11, 4.3))
        dvm = np.array([(DV_ASCENT_L2+tei_dv(v))*(1+RESERVE) for v in vinf])
        ax[0].plot(vinf/1000, dvm/1000, 'C0')
        ax[0].set_xlabel('Mars departure v_inf (km/s)'); ax[0].set_ylabel('mission dv surface->TEI (km/s)')
        ax[0].set_title('Mission dv vs departure window'); ax[0].grid(alpha=.3)
        Ps = np.array([max_payload(d) for d in dvm])/1000
        ax[1].plot(vinf/1000, Ps, 'C1'); ax[1].axhspan(100,150,color='gray',alpha=.15)
        ax[1].annotate('handoff 100-150 t',(2.45,125))
        ax[1].set_xlabel('Mars departure v_inf (km/s)'); ax[1].set_ylabel('max return payload, full tanks (t)')
        ax[1].set_title('Return payload capability'); ax[1].grid(alpha=.3)
        fig.suptitle(f'veh-rocket-01 return mission budget  —  ascent(L2) {DV_ASCENT_L2/1000:.2f} + TEI(patched-conic)')
        fig.tight_layout(); out="scripts/sim_mission_veh_rocket_01.png"; fig.savefig(out, dpi=110)
        print(f"\n图已存:{out}")
    except Exception as ex:
        print(f"\n[出图跳过] {ex}")
