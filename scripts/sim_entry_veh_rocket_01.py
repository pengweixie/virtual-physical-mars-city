#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L2 再入走廊仿真 —— veh-rocket-01 火星直接再入(腹部升力体)
==========================================================
平面 2-DOF(球面火星)升力体再入,RK4 积分:
  状态 (h, s, v, γ):高度/沿程/速度/飞行路径角
  dh=v·sinγ · ds=v·cosγ·R/r · dv=-D/m-g·sinγ · dγ=L/(mv)+(v/r-g/v)cosγ
腹部迎风(高攻角)常值升阻比 L/D=0.3,升力向上(bank=0),不做倾侧调制。
目的:① 扫入射角 γ_e 给出再入走廊(跳出/过载双约束);
      ② 把着陆仿真的"翻转点终端速度"从假设(300 m/s)变成推导值;
      ③ 给出峰值过载与 Sutton-Graves 驻点热流(防热瓦载荷依据)。
不含:倾侧角调制制导、横程、化学非平衡加热、风。
"""
import numpy as np

MU  = 4.282837e13
R   = 3.3895e6
RHO0, HSC = 0.020, 11100.0
G0E = 9.80665

# ---- 车辆(与着陆链一致:干120+货100 = 220 t)----
M     = 220_000.0
CD_B  = 1.6            # 腹部高攻角迎风
A_B   = 400.0          # m^2 有效腹部面积(~50m×9m 投影折减)
CDA   = CD_B * A_B     # β = M/CDA ≈ 344 kg/m^2(星舰量级)
LOD   = 0.3            # 高超声速升阻比
RN    = 4.5            # m 驻点等效半径(筒体半径)
KSG   = 1.9027e-4      # Sutton-Graves 火星常数

H_ENTRY = 125e3
H_HAND  = 5e3          # 交接高度(此后转终端下坠/翻转)

def v_entry(v_inf=2900.0):
    r = R + H_ENTRY
    return np.sqrt(2*MU/r + v_inf**2)

def v_term(h):
    """低空平衡终端速度:阻力=重力。"""
    rho = RHO0*np.exp(-h/HSC)
    return np.sqrt(2*M*(MU/(R+h)**2)/(rho*CDA))

def entry(gamma_deg, v0=None, dt=0.05, log=False):
    v = v0 if v0 else v_entry()
    h, s, g_ = H_ENTRY, 0.0, np.radians(gamma_deg)
    peak_n = 0.0; peak_q = 0.0; heat = 0.0; skip = False
    hist = [] if log else None
    t = 0.0
    def f(st):
        hh, ss, vv, gg = st
        r = R + hh
        grav = MU/r**2
        rho = RHO0*np.exp(-max(hh,0)/HSC)
        D = 0.5*rho*vv*vv*CDA/M
        L = LOD*D
        return np.array([vv*np.sin(gg), vv*np.cos(gg)*R/r,
                         -D - grav*np.sin(gg),
                         L/vv + (vv/r - grav/vv)*np.cos(gg)])
    while h > H_HAND and v > 150:
        st = np.array([h, s, v, g_])
        rho = RHO0*np.exp(-max(h,0)/HSC)
        D = 0.5*rho*v*v*CDA/M
        n = np.hypot(D, LOD*D)/G0E              # 气动过载(地球 g)
        qdot = KSG*np.sqrt(rho/RN)*v**3         # W/m^2
        peak_n = max(peak_n, n); peak_q = max(peak_q, qdot)
        heat += qdot*dt
        if log and (len(hist)==0 or t-hist[-1][0] >= 1.0):
            hist.append((t, h, v, n, qdot/1e3))
        k1=f(st); k2=f(st+0.5*dt*k1); k3=f(st+0.5*dt*k2); k4=f(st+dt*k3)
        st = st + (dt/6)*(k1+2*k2+2*k3+k4)
        h, s, v, g_ = st; t += dt
        if h > H_ENTRY + 10e3 and g_ > 0:       # 跳出
            skip = True; break
        if t > 2000: break
    return dict(gamma=gamma_deg, v_hand=v, h_end=h, s=s, t=t,
                peak_n=peak_n, peak_q=peak_q/1e3, heat=heat/1e6, skip=skip,
                hist=np.array(hist) if log else None)

if __name__ == "__main__":
    ve = v_entry()
    print("=== 再入条件(直接行星际到达,v_inf=2.9 km/s) ===")
    print(f"  再入界面 125 km,再入速度 {ve:.0f} m/s;m={M/1000:.0f}t, β={M/CDA:.0f} kg/m², L/D={LOD}")
    print(f"  低空平衡终端速度参考:v_term(5km)={v_term(5e3):.0f} / 3km={v_term(3e3):.0f} / 2km={v_term(2e3):.0f} m/s")

    print("\n=== 入射角走廊扫描(bank=0 全升力向上) ===")
    print("  注:火星大气稀薄+双曲线再入速度,入射角远陡于地球习惯(MSL 实飞 -15.5°)")
    print("  γe(°)  结果      交接v@5km(m/s)  峰值过载(g0)  峰值热流(kW/m²)  总热载(MJ/m²)  历时(s)")
    results = []
    for g in (-9.0, -10.0, -11.0, -12.0, -13.0, -14.0, -15.5, -17.0, -19.0):
        r = entry(g)
        tag = "跳出!" if r['skip'] else ("过载超" if r['peak_n'] > 5 else "OK")
        results.append(r)
        print(f"  {g:5.1f}  {tag:6s} {r['v_hand']:12.0f} {r['peak_n']:12.1f} {r['peak_q']:14.0f} {r['heat']:12.1f} {r['t']:8.0f}")
    ok = [r for r in results if not r['skip'] and r['peak_n'] <= 5]
    if ok:
        gmin, gmax = min(r['gamma'] for r in ok), max(r['gamma'] for r in ok)
        print(f"  → 可行走廊(不跳出、过载≤5 g0):γe ∈ [{gmax:.1f}°, {gmin:.1f}°]")

    nom = entry(-13.0, log=True)
    print(f"\n=== 标称 γe=-13.0° ===")
    print(f"  交接状态:h=5 km, v={nom['v_hand']:.0f} m/s;沿程 {nom['s']/1e3:.0f} km,历时 {nom['t']:.0f} s")
    print(f"  峰值过载 {nom['peak_n']:.1f} g0;峰值热流 {nom['peak_q']:.0f} kW/m²;总热载 {nom['heat']:.1f} MJ/m²")
    print(f"\n=== 对着陆链的修正 ===")
    print(f"  此前着陆仿真基线假设翻转点终端速度 300 m/s;")
    print(f"  本仿真:5 km 交接 {nom['v_hand']:.0f} m/s,继续坠至 2~3 km 收敛到平衡终端 ~{v_term(2.5e3):.0f} m/s")
    print(f"  → 着陆基线终端速度应修正为 ~400 m/s(sim_descent 敏感性已覆盖:400 m/s → 37 t,头罐仍够)")

    try:
        import matplotlib; matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(1, 3, figsize=(15, 4.2))
        for g in (-11.0, -13.0, -17.0):
            r = entry(g, log=True); H = r['hist']
            ax[0].plot(H[:,2]/1e3, H[:,1]/1e3, label=f'γe={g}°')
        ax[0].set_xlabel('speed (km/s)'); ax[0].set_ylabel('altitude (km)')
        ax[0].set_title('Entry corridor (v-h)'); ax[0].grid(alpha=.3); ax[0].legend(); ax[0].invert_xaxis()
        H = nom['hist']
        ax[1].plot(H[:,0], H[:,3], 'C3'); ax[1].axhline(5, ls='--', c='gray', lw=.8)
        ax[1].set_xlabel('t (s)'); ax[1].set_ylabel('aero deceleration (g0)')
        ax[1].set_title(f'Deceleration, γe=-13° (peak {nom["peak_n"]:.1f} g0)'); ax[1].grid(alpha=.3)
        ax[2].plot(H[:,0], H[:,4], 'C1')
        ax[2].set_xlabel('t (s)'); ax[2].set_ylabel('stag. heat flux (kW/m²)')
        ax[2].set_title(f'Sutton-Graves heating (peak {nom["peak_q"]:.0f} kW/m²)'); ax[2].grid(alpha=.3)
        fig.suptitle(f'veh-rocket-01 Mars direct entry (L2)  —  v_e {ve:.0f} m/s, handoff@5km {nom["v_hand"]:.0f} m/s')
        fig.tight_layout(); out = "scripts/sim_entry_veh_rocket_01.png"; fig.savefig(out, dpi=110)
        print(f"\n图已存:{out}")
    except Exception as ex:
        print(f"\n[出图跳过] {ex}")
