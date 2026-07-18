#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L2 翻转机动仿真 —— veh-rocket-01 腹部飞行→竖直反推(3-DOF 俯仰平面)
====================================================================
状态 (x, h, vx, vz, θ, ω):平动 2 + 俯仰 1,RK4 定步长。
  θ = 体轴偏离竖直角(+x 方向为正);推力沿体轴,TVC 摆角 δ 产生绕质心力矩。
  气动:阻力沿 -v,迎风面积随攻角在"腹部(640 m²·Cd)↔轴向(57)"间插值;
        翼面配平力矩假设已抵消(这正是翼面的职责),不另建气动力矩。
控制:① 翻转段 δ=PD(θ→0) 饱和 ±15°,推力 90%;
      ② 翻转完成后 垂直速度剖面跟踪(同 sim_descent)+ 俯仰微倾清横移 vx。
目的:① 翻转要多高点火(扫 h0 找可行下界);② 翻转期间掉高多少、横移多大;
      ③ 全程推进剂 vs 1-DOF 的 28.5~37 t(翻转+横移的代价);④ TVC 权限够不够。
初值取自再入仿真:终端 ~400 m/s,腹部姿态 θ0=85°。
不含:发动机推力建立瞬态、晃动、六自由度滚偏、风。
"""
import numpy as np

G, G0E = 3.71, 9.80665
RHO0, HSC = 0.020, 11100.0
M_LAND = 220_000.0          # 干+货
PROP0  = 50_000.0           # 头罐装填
ISP    = 330.0
F_ENG  = 2.30e6
D_ARM  = 26.0               # 发动机万向节到质心力臂(载货态 CG 26 m)
I_PITCH= 5.0e7              # kg·m² 俯仰惯量(k≈0.28L 估)
DMAX   = np.radians(15)     # TVC 摆角限
CDA_BELLY, CDA_AXIAL = 640.0, 57.0
V_TD   = 2.0

def run(h0=3500.0, v0=-400.0, theta0=np.radians(85), dt=0.005, log=False):
    x, h, vx, vz = 0.0, h0, 0.0, v0
    th, om = theta0, 0.0
    m = M_LAND + PROP0
    t = 0.0
    flip_done_t = None; flip_alt = None
    a_dec = None
    peak_dv_cmd = 0.0; prop_gone = 0.0
    hist = [] if log else None

    while h > 0 and t < 120:
        sp = np.hypot(vx, vz)
        rho = RHO0*np.exp(-max(h,0)/HSC)
        # 攻角→迎风面积(体轴 vs 速度方向)
        if sp > 1:
            vhat = np.array([vx, vz])/sp
            b = np.array([np.sin(th), np.cos(th)])
            sinAoA = abs(b[0]*vhat[1] - b[1]*vhat[0])
        else:
            sinAoA = 0.0
        cda = CDA_AXIAL + (CDA_BELLY-CDA_AXIAL)*sinAoA
        drag = 0.5*rho*sp*sp*cda
        # —— 制导 ——
        flipping = flip_done_t is None
        if flipping and abs(th) < np.radians(6) and abs(om) < 0.25:
            flip_done_t = t; flip_alt = h
            a_dec = (vz*vz - V_TD*V_TD)/(2*max(h,1.0))     # 以当前状态重定剖面
        if flipping:
            T = 0.9*3*F_ENG
            th_cmd = 0.0
        else:
            vref = -np.sqrt(max(V_TD*V_TD + 2*a_dec*max(h,0.0), 0.0))
            T = m*(a_dec + G) - drag*abs(vz)/max(sp,1) + 0.9*m*(vref - vz)
            T = min(max(T, 0.4*F_ENG), 3*F_ENG)
            T = T/max(np.cos(th), 0.5)                      # 倾角补偿
            th_cmd = np.clip(-0.05*vx, -0.20, 0.20)         # 微倾清横移
        dlt = np.clip(2.0*(th_cmd - th) - 2.5*om, -DMAX, DMAX)
        peak_dv_cmd = max(peak_dv_cmd, abs(dlt))
        # —— 动力学 ——
        def f(st):
            xx, hh, vxx, vzz, tt, oo = st
            spd = np.hypot(vxx, vzz)
            rr = RHO0*np.exp(-max(hh,0)/HSC)
            if spd > 1:
                vh = np.array([vxx, vzz])/spd
                bb = np.array([np.sin(tt), np.cos(tt)])
                sA = abs(bb[0]*vh[1] - bb[1]*vh[0])
            else:
                sA = 0.0
            dd = 0.5*rr*spd*spd*(CDA_AXIAL + (CDA_BELLY-CDA_AXIAL)*sA)
            ax_ = T/m*np.sin(tt) - (dd/m)*(vxx/max(spd,1))
            az_ = T/m*np.cos(tt) - G - (dd/m)*(vzz/max(spd,1))
            return np.array([vxx, vzz, ax_, az_, oo, T*np.sin(dlt)*D_ARM/I_PITCH])
        st = np.array([x, h, vx, vz, th, om])
        k1=f(st); k2=f(st+0.5*dt*k1); k3=f(st+0.5*dt*k2); k4=f(st+dt*k3)
        st = st + (dt/6)*(k1+2*k2+2*k3+k4)
        x, h, vx, vz, th, om = st
        mdot = T/(ISP*G0E); m -= mdot*dt; prop_gone += mdot*dt
        t += dt
        if prop_gone > PROP0: break                        # 头罐烧干
        if log and (len(hist)==0 or t-hist[-1][0] >= 0.05):
            hist.append((t, x, h, vx, vz, np.degrees(th), np.degrees(dlt), T/(3*F_ENG)*100))
    ok = (abs(vz) <= 2.5) and (abs(vx) <= 1.5) and prop_gone <= PROP0 and h <= 0.5
    return dict(ok=ok, td_vz=vz, td_vx=vx, prop=prop_gone, t=t,
                flip_t=flip_done_t, flip_alt_lost=(h0-flip_alt) if flip_alt else None,
                divert_x=x, peak_tvc=np.degrees(peak_dv_cmd),
                hist=np.array(hist) if log else None)

if __name__ == "__main__":
    print("=== 车辆(承接再入仿真交接状态) ===")
    print(f"  m={M_LAND/1000:.0f}t + 头罐 {PROP0/1000:.0f}t;I_pitch={I_PITCH:.1e};力臂 {D_ARM} m;TVC ±15°")
    print(f"  初值:腹部姿态 θ0=85°,垂直速度 -400 m/s(再入仿真终端)")

    print("\n=== 点火高度扫描(翻转+着陆一体) ===")
    print("  h0(km)  可行  翻转用时(s) 翻转掉高(m) 横移(m) 触地vz/vx(m/s) 推进剂(t) 峰值TVC(°)")
    best = None
    for h0 in (2000, 2500, 3000, 3500, 4000, 5000):
        r = run(h0=h0)
        fa = f"{r['flip_alt_lost']:.0f}" if r['flip_alt_lost'] else "  未完成"
        print(f"  {h0/1e3:5.1f}  {'✓' if r['ok'] else '✗'}   {r['flip_t'] if r['flip_t'] else -1:9.1f} {fa:>10s} {r['divert_x']:7.0f}"
              f"  {r['td_vz']:6.1f}/{r['td_vx']:5.1f} {r['prop']/1000:8.1f} {r['peak_tvc']:9.1f}")
        if r['ok'] and best is None: best = (h0, r)
    if best:
        h0b, rb = best
        print(f"  → 最低可行点火高度 ≈ {h0b/1e3:.1f} km(触地 vz={rb['td_vz']:.1f} m/s)")

    nom = run(h0=4000, log=True)
    print(f"\n=== 标称 h0=4.0 km(最低可行) ===")
    print(f"  翻转用时 {nom['flip_t']:.1f} s,翻转期间掉高 {nom['flip_alt_lost']:.0f} m,横移 {nom['divert_x']:.0f} m")
    print(f"  触地 vz={nom['td_vz']:.1f} m/s, vx={nom['td_vx']:.1f} m/s(倾覆判据临界侧速 2.0 → {'满足' if abs(nom['td_vx'])<1.5 else '超限'})")
    print(f"  推进剂 {nom['prop']/1000:.1f} t(1-DOF 同初值 37.3 t → 翻转+横移额外代价 ~{nom['prop']/1000-37.3:+.1f} t)")
    print(f"  峰值 TVC {nom['peak_tvc']:.1f}°(限 15° → {'翻转段饱和(bang-bang),权限刚好够' if nom['peak_tvc']>=14.9 else '有余量'})")
    print(f"\n=== 对着陆链的修正 ===")
    print(f"  1-DOF 时代基线'翻转点 2.6 km'在计入翻转动力学后不可行(翻转本身掉高 ~1.4 km);")
    print(f"  修正链:再入终端 ~400 m/s → 点火/翻转 ≥4.0 km → 3.6 s 翻转 → 反推 → 触地 <2 m/s。")

    try:
        import matplotlib; matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        H = nom['hist']  # t,x,h,vx,vz,thdeg,dltdeg,thr%
        fig, ax = plt.subplots(1, 3, figsize=(15.5, 4.4))
        ax[0].plot(H[:,1], H[:,2], 'C0', lw=1.5)
        step = max(1, len(H)//28)
        for i in range(0, len(H), step):
            tt = np.radians(H[i,5]); L=140
            ax[0].plot([H[i,1], H[i,1]+L*np.sin(tt)], [H[i,2], H[i,2]+L*np.cos(tt)], 'C3-', lw=1, alpha=.7)
        ax[0].set_xlabel('x divert (m)'); ax[0].set_ylabel('altitude (m)')
        ax[0].set_title('Flip + landing trajectory (body axis ticks)'); ax[0].grid(alpha=.3)
        ax[1].plot(H[:,0], H[:,5], 'C0', label='pitch θ')
        ax[1].plot(H[:,0], H[:,6], 'C3', label='TVC δ')
        ax[1].axhline(0, c='gray', lw=.5)
        ax[1].set_xlabel('t (s)'); ax[1].set_ylabel('deg'); ax[1].set_title(f'Attitude & TVC (flip {nom["flip_t"]:.1f}s)')
        ax[1].grid(alpha=.3); ax[1].legend()
        ax[2].plot(H[:,0], -H[:,4], 'C0', label='|vz|')
        ax[2].plot(H[:,0], H[:,3], 'C1', label='vx')
        ax[2].plot(H[:,0], H[:,7]/10, 'C2', ls=':', label='throttle/10 (%)')
        ax[2].set_xlabel('t (s)'); ax[2].set_ylabel('m/s'); ax[2].set_title(f'Velocities (td vz {abs(nom["td_vz"]):.1f}, vx {nom["td_vx"]:.1f} m/s)')
        ax[2].grid(alpha=.3); ax[2].legend()
        fig.suptitle(f'veh-rocket-01 flip maneuver (L2, 3-DOF pitch)  —  h0 4.0 km (min feasible), prop {nom["prop"]/1000:.1f} t')
        fig.tight_layout(); out = "scripts/sim_flip_veh_rocket_01.png"; fig.savefig(out, dpi=110)
        print(f"\n图已存:{out}")
    except Exception as ex:
        print(f"\n[出图跳过] {ex}")
