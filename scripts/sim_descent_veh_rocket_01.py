#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L2 着陆段仿真 —— veh-rocket-01 星舰火星动力下降(翻转+反推着陆)
================================================================
1-DOF 垂直动力下降,RK4 定步长:
  恒定近表重力 + 指数大气阻力(竖直姿态小迎风面) + 可节流猛禽推力,
  速度剖面跟踪制导把翻转点的终端速度软着陆清零。
目的:检验 EQUIPMENT.md §9 的 L1 着陆推进剂(49~67 t),
      并量化"推力过剩→深节流/少发动机→不能悬停(硬着陆)"的着陆约束。

场景:腹部再入气动减速后,在翻转点 h0 以终端速度 v0 转竖直、点海平面猛禽,
      反推至软触地(~2 m/s)。竖直段迎风面小(Ø9m 底面),阻力贡献有限。
不含:翻转姿态机动本身(视为瞬时)、三维、晃动、姿控回路。
"""
import numpy as np

# ---- 火星近表常数 ----
G   = 3.71            # m/s^2
RHO0= 0.020           # kg/m^3
HSC = 11100.0         # m
G0E = 9.80665

# ---- 车辆 ----
M_LAND = 220_000.0    # kg 到达质量(干重120 + 出舱货100)
ISP    = 330.0        # s 海平面猛禽(火星近真空,取保守值)
F_ENG  = 2.30e6       # N 单机
THR_MIN= 0.40         # 最小节流
CD_V   = 0.9          # 竖直姿态阻力系数(底面朝下)
A_V    = np.pi*4.5**2 # m^2 Ø9m 底面
V_TD   = 2.0          # m/s 目标触地速度

def flip_altitude(v0, n_eng, m_land, header_prop, sf=0.80):
    """按可达减速度(推力权限×安全系数)反算所需翻转/点火高度。"""
    m0 = m_land + header_prop
    a_avail = n_eng*F_ENG/m0 - G           # 满推净减速
    a_target = sf * a_avail
    return max(1500.0, (v0**2 - V_TD**2)/(2*a_target)), a_avail

def descent(h0=3000.0, v0=-300.0, n_eng=3, m_dry_plus_pay=M_LAND,
            header_prop=50_000.0, kp=0.6, dt=0.02, log=False):
    T_max = n_eng * F_ENG
    T_min = 1 * THR_MIN * F_ENG          # 终端可只留 1 台深节流
    m = m_dry_plus_pay + header_prop
    h, v = h0, v0                        # v<0 向下
    # 速度剖面:v_ref(h)^2 = V_TD^2 + 2*a_dec*h,过 (h0,v0) 定 a_dec
    a_dec = (v0**2 - V_TD**2) / (2*h0)
    dv_used = 0.0; t = 0.0
    peak_g = 0.0; thr_lo = 1e9; thr_hi = 0.0; floor_hit = False
    hist = [] if log else None

    def v_ref(hh):
        return -np.sqrt(max(V_TD**2 + 2*a_dec*max(hh, 0.0), 0.0))

    while h > 0:
        rho = RHO0*np.exp(-h/HSC)
        drag = 0.5*rho*CD_V*A_V*v*v        # 大小(向上,抵抗下降)
        # 制导:跟踪 v_ref,前馈 a_dec + 重力 + 阻力,反馈 Kp
        T_cmd = m*(a_dec + G) - drag + kp*m*(v_ref(h) - v)
        T = min(max(T_cmd, T_min), T_max)
        if T_cmd < T_min: floor_hit = True
        thr_lo = min(thr_lo, T/(n_eng*F_ENG)); thr_hi = max(thr_hi, T/(n_eng*F_ENG))
        a = T/m - G + drag/m               # 向上为正
        peak_g = max(peak_g, abs(a)/G)     # 相对火星 g
        mdot = T/(ISP*G0E)
        dv_used += (T/m)*dt
        if log and (len(hist)==0 or t-hist[-1][0] >= 0.1):
            hist.append((t, h, -v, T/(n_eng*F_ENG)*100, drag/1e3))
        # RK4(状态 [h,v,m])
        def f(st):
            hh, vv, mm = st
            rr = RHO0*np.exp(-max(hh,0)/HSC)
            dd = 0.5*rr*CD_V*A_V*vv*vv
            aa = T/mm - G + dd/mm
            return np.array([vv, aa, -mdot])
        st = np.array([h, v, m])
        k1=f(st); k2=f(st+0.5*dt*k1); k3=f(st+0.5*dt*k2); k4=f(st+dt*k3)
        st = st + (dt/6)*(k1+2*k2+2*k3+k4)
        h, v, m = st; t += dt
        if t > 300: break

    prop_used = (m_dry_plus_pay + header_prop) - m
    return dict(dv=dv_used, prop=prop_used, t_burn=t, v_td=-v, h_end=h,
                peak_g=peak_g, thr_lo=thr_lo, thr_hi=thr_hi, floor_hit=floor_hit,
                a_dec=a_dec, m0=m_dry_plus_pay+header_prop,
                hist=np.array(hist) if log else None)

if __name__ == "__main__":
    print("=== 车辆/发动机 ===")
    print(f"  到达质量 {M_LAND/1000:.0f} t(干120+货100),重量 {M_LAND*G/1e6:.2f} MN")
    print(f"  单机 {F_ENG/1e6:.2f} MN, 最小节流 {THR_MIN*100:.0f}%, Isp {ISP:.0f}s")
    print(f"  单台满推 T/W = {F_ENG/(M_LAND*G):.2f};1台最小推力 T/W = {THR_MIN*F_ENG/(M_LAND*G):.2f}")
    print(f"  → 推力远过剩,着陆必须深节流/少发动机")

    print("\n=== 基线:终端 300 m/s,3 台反推,自适应翻转高度 ===")
    h0b, aav = flip_altitude(300, 3, M_LAND, 50_000)
    print(f"  翻转/点火高度 {h0b:.0f} m(可达净减速 {aav:.1f} m/s^2,取 80% 裕度)")
    r = descent(h0=h0b, v0=-300, n_eng=3, log=True)
    print(f"  着陆 Δv = {r['dv']:.0f} m/s   推进剂 = {r['prop']/1000:.1f} t")
    print(f"  燃烧时长 {r['t_burn']:.1f}s  触地速度 {r['v_td']:.1f} m/s  峰值减速 {r['peak_g']:.1f} g_mars")
    print(f"  节流区间 {r['thr_lo']*100:.0f}%~{r['thr_hi']*100:.0f}%  平均减速 {r['a_dec']:.1f} m/s^2")
    print(f"  最小节流触底: {'是(推力仍过大,末段被迫硬触地)' if r['floor_hit'] else '否'}")

    print("\n=== 敏感性:终端速度 × 到达质量(3 台反推,自适应翻转高度) ===")
    print("  v0(m/s) 质量(t) 翻转(km) Δv(m/s) 推进剂(t) 燃烧(s) 峰值g 触地(m/s)")
    for v0 in (250, 300, 350, 400):
        for mland in (200_000, 220_000, 250_000):
            h0s, _ = flip_altitude(v0, 3, mland, 50_000)
            rr = descent(h0=h0s, v0=-v0, n_eng=3, m_dry_plus_pay=mland)
            print(f"  {v0:6d} {mland/1000:6.0f} {h0s/1e3:7.2f} {rr['dv']:7.0f} {rr['prop']/1000:8.1f} {rr['t_burn']:6.1f} {rr['peak_g']:5.1f} {rr['v_td']:8.1f}")

    print("\n=== 对照 L1 ===")
    print(f"  L1(§9): 着陆 Δv 0.6~0.8 km/s @ 240t → 49~67 t")
    print(f"  L2: 从 ~300 m/s 终端反推,着陆 Δv ~{r['dv']:.0f} m/s → {r['prop']/1000:.0f} t")
    print(f"  → L1 的 0.6~0.8 km/s 偏保守(含再入/悬停裕度);纯反推清零终端速度更省。")
    print(f"    头罐 O(30~50 t) 对 250~400 m/s 终端速度区间够用,高终端速度(>350)才逼近上限。")

    # ---- 出图 ----
    try:
        import matplotlib; matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        H = r['hist']   # t, h, |v|, throttle%, drag(kN)
        fig, ax = plt.subplots(1, 3, figsize=(15, 4.2))
        ax[0].plot(H[:,2], H[:,1]/1e3, 'C1'); ax[0].set_xlabel('speed (m/s)'); ax[0].set_ylabel('altitude (km)')
        ax[0].set_title('Descent (speed vs altitude)'); ax[0].grid(alpha=.3); ax[0].invert_xaxis()
        ax[1].plot(H[:,0], H[:,3], 'C0'); ax[1].axhline(THR_MIN*100, ls='--', c='gray', lw=.8)
        ax[1].set_xlabel('t (s)'); ax[1].set_ylabel('throttle (%, of 3 eng)'); ax[1].set_title('Throttle profile (min 40% dashed)'); ax[1].grid(alpha=.3)
        ax[2].plot(H[:,0], H[:,2], 'C3'); ax[2].set_xlabel('t (s)'); ax[2].set_ylabel('speed (m/s)')
        ax[2].set_title(f'Speed null-out (touchdown {r["v_td"]:.1f} m/s)'); ax[2].grid(alpha=.3)
        fig.suptitle(f'veh-rocket-01 Mars landing burn (L2)  —  dv {r["dv"]:.0f} m/s, prop {r["prop"]/1000:.1f} t, peak {r["peak_g"]:.1f} g_mars')
        fig.tight_layout(); out = "scripts/sim_descent_veh_rocket_01.png"; fig.savefig(out, dpi=110)
        print(f"\n轨迹图已存:{out}")
    except Exception as ex:
        print(f"\n[出图跳过] {ex}")
