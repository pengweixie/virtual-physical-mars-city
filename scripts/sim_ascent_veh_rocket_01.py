#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L2 上升段轨迹仿真 —— veh-rocket-01 星舰火星升轨
================================================
2-DOF 变质量点质量,平面内绕火星球心积分:
  火星中心引力(1/r²) + 指数大气阻力 + 重力转弯推力程序,RK4 定步长。
目的:检验 EQUIPMENT.md §9 的 L1 理想 Δv,给出真实引力/阻力损失与升轨总 Δv。

坐标:火星球心为原点,发射点 (0, R);+x = 顺行(向东),+y = 天顶。
推力程序:垂直起飞 → 俯仰踢转 δ → 沿速度矢量重力转弯 → 远地点达标 MECO
          → 远地点解析圆化 Δv。
不含:火星自转(注记增益 ~240 m/s 未计)、晃动、姿控回路、三维平面外。
"""
import numpy as np

# ---- 火星常数 ----
MU   = 4.282837e13      # m^3/s^2
R    = 3.3895e6         # m
G0S  = MU / R**2        # 表面重力 ~3.73 m/s^2
RHO0 = 0.020           # kg/m^3 表面大气密度
HSC  = 11100.0         # m 大气标高
G0E  = 9.80665         # m/s^2 (Isp 基准)

# ---- 车辆(与 §9 一致)----
M_DRY   = 120_000.0    # kg 干重(含腿+瓦)
M_PAY   = 50_000.0     # kg 升轨载荷
M_PROP  = 400_000.0    # kg 升轨装填推进剂(非满箱1200t,升轨不需要)
ISP     = 375.0        # s 真空猛禽
N_ENG   = 3            # 升轨点 3 台真空版
F_ENG   = 2.30e6       # N 单机推力
CD      = 0.4          # 升轨迎风阻力系数(近似)
AREA    = np.pi * 4.5**2   # m^2 Ø9m 迎风面

F_TOT = N_ENG * F_ENG
MDOT  = F_TOT / (ISP * G0E)     # kg/s
TB    = M_PROP / MDOT           # 可用燃烧时长
TARGET_ALT = 200e3             # 目标圆轨高度

def deriv(s, thrust_on, u_hat):
    x, y, vx, vy, m = s
    r = np.hypot(x, y)
    rhat = np.array([x, y]) / r
    h = r - R
    v = np.array([vx, vy]); sp = np.hypot(vx, vy)
    # 引力
    ag = -MU / r**2 * rhat
    # 阻力
    rho = RHO0 * np.exp(-max(h, 0.0) / HSC)
    ad = np.zeros(2)
    if sp > 1e-3:
        ad = -0.5 * rho * CD * AREA * sp * v / m
    # 推力
    at = (F_TOT / m) * u_hat if thrust_on else np.zeros(2)
    a = ag + ad + at
    dm = -MDOT if thrust_on else 0.0
    return np.array([vx, vy, a[0], a[1], dm]), sp, h, rho

def apoapsis_alt(s):
    x, y, vx, vy, m = s
    r = np.hypot(x, y); v2 = vx*vx + vy*vy
    eps = v2/2 - MU/r
    if eps >= 0: return 1e12                # 逃逸/抛物
    a = -MU/(2*eps)
    hang = x*vy - y*vx
    e = np.sqrt(max(0.0, 1 + 2*eps*hang**2/MU**2))
    return a*(1+e) - R

def thrust_dir(s, t, t_pitch, pitch_dur, phi_final):
    """主动俯仰程序:俯仰角 φ(自当地水平起算,90°=垂直,0°=顺行水平)
    在 [t_pitch, t_pitch+pitch_dur] 从 90° 线性压到 φ_final,之后保持。"""
    x, y, vx, vy, m = s
    r = np.hypot(x, y)
    rhat = np.array([x, y]) / r                 # 当地天顶
    that = np.array([rhat[1], -rhat[0]])        # 当地水平顺行(+x 方向)
    if t < t_pitch:
        phi = np.pi/2
    elif t < t_pitch + pitch_dur:
        frac = (t - t_pitch) / pitch_dur
        phi = np.pi/2 + frac*(phi_final - np.pi/2)
    else:
        phi = phi_final
    return np.cos(phi)*that + np.sin(phi)*rhat

def run(t_pitch=8.0, pitch_dur=140.0, phi_final=np.deg2rad(2.0), dt=0.05, verbose=False, log=False):
    s = np.array([0.0, R, 0.0, 0.0, M_DRY + M_PAY + M_PROP])
    t = 0.0
    grav_loss = drag_loss = 0.0
    maxq = 0.0; maxq_alt = 0.0; max_acc = 0.0
    meco = None
    hist = [] if log else None
    while t < TB + 1e-9:
        thrust_on = (t < TB)
        u = thrust_dir(s, t, t_pitch, pitch_dur, phi_final)
        d1, sp, h, rho = deriv(s, thrust_on, u)
        # 损失累积(基于当前步)
        r = np.hypot(s[0], s[1]); rhat = np.array([s[0], s[1]]) / r
        if sp > 1e-3:
            singamma = (s[2]*rhat[0] + s[3]*rhat[1]) / sp   # sin(飞行路径角)
            grav_loss += (MU/r**2) * singamma * dt
            drag_loss += (0.5*rho*CD*AREA*sp*sp / s[4]) * dt
        q = 0.5*rho*sp*sp
        if q > maxq: maxq, maxq_alt = q, h
        if thrust_on: max_acc = max(max_acc, F_TOT/s[4])
        if log and (len(hist)==0 or t - hist[-1][0] >= 0.5):
            downrange = R * np.arctan2(s[0], s[1])      # 沿表面里程
            hist.append((t, h, downrange, sp, q))
        # RK4
        k1,_,_,_ = deriv(s, thrust_on, u)
        k2,_,_,_ = deriv(s + 0.5*dt*k1, thrust_on, u)
        k3,_,_,_ = deriv(s + 0.5*dt*k2, thrust_on, u)
        k4,_,_,_ = deriv(s + dt*k3, thrust_on, u)
        s = s + (dt/6)*(k1 + 2*k2 + 2*k3 + k4)
        t += dt
        # MECO:远地点达标即停推
        if thrust_on and apoapsis_alt(s) >= TARGET_ALT:
            meco = dict(t=t, m=s[4], alt=np.hypot(s[0],s[1])-R,
                        sp=np.hypot(s[2],s[3]), apo=apoapsis_alt(s))
            # 停推:把剩余燃烧时间清零
            TB_local = t
            break
    else:
        TB_local = TB
    if meco is None:
        meco = dict(t=t, m=s[4], alt=np.hypot(s[0],s[1])-R,
                    sp=np.hypot(s[2],s[3]), apo=apoapsis_alt(s))
    # 升轨燃烧提供的 Δv(齐奥尔科夫斯基,等于 ∫T/m dt)
    m0 = M_DRY + M_PAY + M_PROP
    dv_ascent = ISP*G0E*np.log(m0/meco['m'])
    prop_used = m0 - meco['m']
    # 远地点圆化 Δv(解析)
    x,y,vx,vy,m = s
    r = np.hypot(x,y); v2 = vx*vx+vy*vy; eps = v2/2 - MU/r
    a = -MU/(2*eps); hang = x*vy - y*vx
    e = np.sqrt(max(0.0,1+2*eps*hang**2/MU**2))
    r_apo = a*(1+e)
    v_apo = np.sqrt(MU*(2/r_apo - 1/a))
    v_circ_apo = np.sqrt(MU/r_apo)
    dv_circ = v_circ_apo - v_apo
    # 近地点(判断是否入轨/是否再入)
    r_peri = a*(1-e); peri_alt = r_peri - R
    # 圆化燃烧所需推进剂(第二次点火,以 MECO 后质量为起点)
    m_meco = meco['m']
    prop_circ = m_meco*(np.exp(dv_circ/(ISP*G0E)) - 1)
    prop_total = prop_used + prop_circ
    return dict(meco=meco, dv_ascent=dv_ascent, dv_circ=dv_circ,
                dv_total=dv_ascent+dv_circ, grav_loss=grav_loss, drag_loss=drag_loss,
                prop_used=prop_used, prop_circ=prop_circ, prop_total=prop_total,
                prop_margin=M_PROP-prop_total, feasible=prop_total <= M_PROP,
                r_apo_alt=r_apo-R, peri_alt=peri_alt,
                maxq=maxq, maxq_alt=maxq_alt, max_acc=max_acc,
                v_circ_target=np.sqrt(MU/(R+TARGET_ALT)),
                hist=np.array(hist) if log else None)

def tune():
    """扫俯仰程序(起始时刻/压转时长/终角),在可行解中找总 Δv 最小。"""
    best = None
    for tp in (6.0, 8.0, 10.0):
        for pd in np.arange(60.0, 190.01, 10.0):
            for phid in np.arange(0.0, 20.01, 2.0):
                r = run(t_pitch=tp, pitch_dur=pd, phi_final=np.deg2rad(phid))
                if r['r_apo_alt'] < TARGET_ALT - 5e3: continue
                if r['peri_alt'] < -50e3: continue      # 排除仍是抛物弹道的解
                if not r['feasible']: continue
                if best is None or r['dv_total'] < best[3]['dv_total']:
                    best = (tp, pd, phid, r)
    return best

if __name__ == "__main__":
    print("=== 车辆/发动机 ===")
    print(f"  m0={ (M_DRY+M_PAY+M_PROP)/1000:.0f} t (干{M_DRY/1000:.0f}+载{M_PAY/1000:.0f}+推进剂{M_PROP/1000:.0f})")
    print(f"  推力 {F_TOT/1e6:.1f} MN ×{N_ENG}RVac, Isp {ISP:.0f}s, mdot {MDOT:.0f} kg/s, 可燃烧 {TB:.0f}s")
    print(f"  起飞 T/W = {F_TOT/((M_DRY+M_PAY+M_PROP)*G0S):.2f}")
    print(f"  目标 {TARGET_ALT/1e3:.0f} km 圆轨 v_circ = {np.sqrt(MU/(R+TARGET_ALT)):.0f} m/s")
    res = tune()
    if res is None:
        print("\n[!] 未找到可行解,尝试放宽装填或目标高度。")
        raise SystemExit(1)
    tp, pd, phid, r = res
    m = r['meco']
    print(f"\n=== 最优俯仰程序(起转 t={tp:.0f}s,压转 {pd:.0f}s,终角 {phid:.0f}°;目标=总Δv最小) ===")
    print(f"  MECO: t={m['t']:.0f}s  高度={m['alt']/1e3:.1f} km  速度={m['sp']:.0f} m/s")
    print(f"  转移椭圆: 远地点 {r['r_apo_alt']/1e3:.0f} km / 近地点 {r['peri_alt']/1e3:.1f} km")
    print(f"  max-Q {r['maxq']:.0f} Pa @ {r['maxq_alt']/1e3:.1f} km   峰值加速度 {r['max_acc']/G0S:.1f} g_mars")
    print(f"\n=== Δv 分解(两次点火:升轨 + 远地点圆化) ===")
    print(f"  升轨燃烧提供 Δv = {r['dv_ascent']:.0f} m/s   (用推进剂 {r['prop_used']/1000:.0f} t)")
    print(f"  远地点圆化   Δv = {r['dv_circ']:.0f} m/s   (用推进剂 {r['prop_circ']/1000:.0f} t)")
    print(f"  ─────────────────────────")
    print(f"  升轨总 Δv       = {r['dv_total']:.0f} m/s = {r['dv_total']/1000:.2f} km/s")
    print(f"    ├ 引力损失 = {r['grav_loss']:.0f} m/s")
    print(f"    └ 阻力损失 = {r['drag_loss']:.0f} m/s  (火星稀薄大气)")
    print(f"  推进剂合计 {r['prop_total']/1000:.0f} t / 装填 {M_PROP/1000:.0f} t (余 {r['prop_margin']/1000:.0f} t)")
    print(f"\n=== 对照 L1 ===")
    print(f"  L1 理想(§9): 火表→低火轨 ~3.9 km/s(纯理想,零损失)")
    print(f"  L2 真实(本次): {r['dv_total']/1000:.2f} km/s = 理想轨速 {r['v_circ_target']:.0f} m/s + 引力损失 {r['grav_loss']:.0f} m/s + 圆化/抬轨")
    print(f"  → L1 的 3.9 km/s 系统性偏乐观 ~{(r['dv_total']-3900):.0f} m/s(主因引力损失)")
    print(f"  注:未计火星自转顺行增益(~240 m/s),计入后净需求再降。")
    print(f"  注:max-Q 仅 {r['maxq']/1e3:.1f} kPa(地球发射 ~30-40 kPa)→ 火星稀薄大气允许低平省Δv弹道,无结构Q惩罚。")

    # ---- 轨迹出图 ----
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        rp = run(t_pitch=tp, pitch_dur=pd, phi_final=np.deg2rad(phid), log=True)
        H = rp['hist']   # t, alt, downrange, speed, q
        fig, ax = plt.subplots(1, 3, figsize=(15, 4.2))
        ax[0].plot(H[:,2]/1e3, H[:,1]/1e3, 'C1'); ax[0].axhline(TARGET_ALT/1e3, ls='--', c='gray', lw=.8)
        ax[0].set_xlabel('downrange (km)'); ax[0].set_ylabel('altitude (km)'); ax[0].set_title('Ascent trajectory'); ax[0].grid(alpha=.3)
        ax[1].plot(H[:,0], H[:,3], 'C0'); ax[1].axhline(r['v_circ_target'], ls='--', c='gray', lw=.8)
        ax[1].set_xlabel('t (s)'); ax[1].set_ylabel('speed (m/s)'); ax[1].set_title('Velocity profile (v_circ dashed)'); ax[1].grid(alpha=.3)
        ax[2].plot(H[:,0], H[:,4]/1e3, 'C3')
        ax[2].set_xlabel('t (s)'); ax[2].set_ylabel('dynamic pressure q (kPa)'); ax[2].set_title(f'max-Q {r["maxq"]/1e3:.1f} kPa'); ax[2].grid(alpha=.3)
        fig.suptitle(f'veh-rocket-01 Mars ascent (L2)  —  total dv {r["dv_total"]/1000:.2f} km/s, gravity loss {r["grav_loss"]:.0f} m/s, drag {r["drag_loss"]:.0f} m/s')
        fig.tight_layout()
        out = "scripts/sim_ascent_veh_rocket_01.png"
        fig.savefig(out, dpi=110)
        print(f"\n轨迹图已存:{out}")
    except Exception as ex:
        print(f"\n[出图跳过] {ex}")
