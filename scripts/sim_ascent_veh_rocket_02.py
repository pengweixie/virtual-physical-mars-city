#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L2 上升段轨迹仿真 —— veh-rocket-02 长十乙火星升轨(两级 + 一子级 RTLS 构型)
==============================================================================
2-DOF 变质量点质量,平面内绕火星球心积分(与 sim_ascent_veh_rocket_01 同框架):
  火星中心引力(1/r²) + 指数大气阻力 + 重力转弯推力程序,RK4 定步长;
  两级:一子级点 3 台 YF-100K(火星 T/W 过剩,7 台全点会 >5 g,只点
  中心 1 + 对置 2)烧到分离速度 v_stage → 热分离(一子级带 RTLS 储备
  返场,见 sim_boostback_veh_rocket_02)→ 上面级单台 YF-100M 续燃至
  远点 200 km → 远点解析圆化。
构型逻辑(火星 RTLS,推进剂全靠 ISRU,按需加注不满箱):
  一子级装填 = 升轨实际消耗(定点迭代收敛) + RTLS 储备 42 t
目的:给出火星构型 GLOW、Δv 分解、max-Q、LMO 运力闭合;
  另附 SSTO 旁证(一子级单独入轨的齐奥尔科夫斯基检查)。
不含:火星自转增益(~240 m/s,注记)、三维、姿控回路。
"""
import numpy as np

# ---- 火星常数 ----
MU, R = 4.282837e13, 3.3895e6
G0S = MU / R**2                    # ~3.73 m/s^2
RHO0, HSC = 0.020, 11100.0
G0E = 9.80665

# ---- 车辆(推定,与 veh-rocket-02.info.json 一致)----
M1_DRY = 45e3                      # 一子级干重(含栅格舵/着陆腿/挂钩)
RESERVE = 48e3                     # RTLS 储备(由 sim_boostback 校核)
M2_DRY = 20e3                      # 上面级干重
M_PAY = 18e3                       # LMO 载荷(演示基线)
P2 = 62e3                          # 上面级装填
ISP1, ISP2 = 335.0, 340.0          # YF-100K / YF-100M(真空,火星≈真空)
F_ENG = 1.34e6
N1, THR1 = 3, 0.70                 # 一子级只点 3 台 @70%(限过载/省损失)
F1 = N1 * F_ENG * THR1
F2 = 1.0 * F_ENG
CD, AREA = 0.8, np.pi * 2.5**2 * 1.12   # Ø5 m + 突出物
V_STAGE = 1000.0                   # 分离速度(RTLS 高抛构型:低速+陡弹道角,
GAMMA_MIN = 25.0                   #  滞空长→返场横向 Δv 便宜;γ 下限约束)
TARGET_ALT = 200e3
MDOT1, MDOT2 = F1 / (ISP1 * G0E), F2 / (ISP2 * G0E)

def deriv(s, F, mdot, u_hat):
    x, y, vx, vy, m = s
    r = np.hypot(x, y)
    rhat = np.array([x, y]) / r
    h = r - R
    v = np.array([vx, vy]); sp = np.hypot(vx, vy)
    ag = -MU / r**2 * rhat
    rho = RHO0 * np.exp(-max(h, 0.0) / HSC)
    ad = -0.5 * rho * CD * AREA * sp * v / m if sp > 1e-3 else np.zeros(2)
    at = (F / m) * u_hat if F > 0 else np.zeros(2)
    return np.array([vx, vy, *(ag + ad + at), -mdot if F > 0 else 0.0]), sp, h, rho

def apoapsis_alt(s):
    x, y, vx, vy, m = s
    r = np.hypot(x, y); v2 = vx * vx + vy * vy
    eps = v2 / 2 - MU / r
    if eps >= 0: return 1e12
    a = -MU / (2 * eps)
    hang = x * vy - y * vx
    e = np.sqrt(max(0.0, 1 + 2 * eps * hang**2 / MU**2))
    return a * (1 + e) - R

def thrust_dir(s, t, t_pitch, pitch_dur, phi_final):
    x, y, vx, vy, m = s
    r = np.hypot(x, y)
    rhat = np.array([x, y]) / r
    that = np.array([rhat[1], -rhat[0]])
    if t < t_pitch: phi = np.pi / 2
    elif t < t_pitch + pitch_dur:
        phi = np.pi / 2 + (t - t_pitch) / pitch_dur * (phi_final - np.pi / 2)
    else: phi = phi_final
    return np.cos(phi) * that + np.sin(phi) * rhat

def run(p1_burn, t_pitch, pitch_dur, phi_final, dt=0.05, log=False):
    m0 = M1_DRY + p1_burn + RESERVE + M2_DRY + P2 + M_PAY
    s = np.array([0.0, R, 0.0, 0.0, m0])
    t, phase = 0.0, 1
    grav_loss = drag_loss = 0.0
    maxq = maxq_alt = max_acc = 0.0
    stage_ev = None; hist = []
    p1_used = 0.0
    while t < 2000:
        if phase == 1: F, mdot = F1, MDOT1
        elif phase == 0: F, mdot = 0.0, 0.0          # 分离滑行
        else: F, mdot = F2, MDOT2
        u = thrust_dir(s, t, t_pitch, pitch_dur, phi_final)
        _, sp, h, rho = deriv(s, F, mdot, u)
        r = np.hypot(s[0], s[1]); rhat = np.array([s[0], s[1]]) / r
        if sp > 1e-3:
            singam = (s[2] * rhat[0] + s[3] * rhat[1]) / sp
            if F > 0: grav_loss += (MU / r**2) * singam * dt
            drag_loss += (0.5 * rho * CD * AREA * sp * sp / s[4]) * dt
        q = 0.5 * rho * sp * sp
        if q > maxq: maxq, maxq_alt = q, h
        if F > 0: max_acc = max(max_acc, F / s[4])
        if log and (not hist or t - hist[-1][0] >= 0.5):
            hist.append((t, h, R * np.arctan2(s[0], s[1]), sp, q))
        k1, *_ = deriv(s, F, mdot, u)
        k2, *_ = deriv(s + 0.5 * dt * k1, F, mdot, u)
        k3, *_ = deriv(s + 0.5 * dt * k2, F, mdot, u)
        k4, *_ = deriv(s + dt * k3, F, mdot, u)
        s = s + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
        t += dt
        if phase == 1:
            p1_used = m0 - s[4]
            if sp >= V_STAGE or p1_used >= p1_burn:
                gam = np.degrees(np.arcsin(
                    (s[2] * rhat[0] + s[3] * rhat[1]) / max(sp, 1e-6)))
                stage_ev = dict(t=t, h=h, v=sp, gamma=gam,
                                downrange=R * np.arctan2(s[0], s[1]),
                                p1_used=p1_used)
                s[4] -= M1_DRY + RESERVE + (p1_burn - p1_used)  # 抛一子级
                phase, t_sep = 0, t
        elif phase == 0 and t - t_sep >= 4.0:
            phase = 2
        elif phase == 2:
            if apoapsis_alt(s) >= TARGET_ALT:
                break
            if s[4] <= M2_DRY + M_PAY:
                return None                            # 上面级烧干,不可行
    # MECO2 后:解析圆化
    x, y, vx, vy, m = s
    r = np.hypot(x, y); eps = (vx * vx + vy * vy) / 2 - MU / r
    a = -MU / (2 * eps); hang = x * vy - y * vx
    e = np.sqrt(max(0.0, 1 + 2 * eps * hang**2 / MU**2))
    r_apo = a * (1 + e)
    dv_circ = np.sqrt(MU / r_apo) - np.sqrt(MU * (2 / r_apo - 1 / a))
    prop_circ = m * (np.exp(dv_circ / (ISP2 * G0E)) - 1)
    p2_used = (M2_DRY + P2 + M_PAY) - m + prop_circ
    if p2_used > P2: return None
    dv2 = ISP2 * G0E * np.log((M2_DRY + P2 + M_PAY) / (m - prop_circ + 0)) \
        if False else ISP2 * G0E * np.log((M2_DRY + P2 + M_PAY) / m) + dv_circ
    dv1 = ISP1 * G0E * np.log(
        (M1_DRY + p1_burn + RESERVE + M2_DRY + P2 + M_PAY)
        / (M1_DRY + p1_burn + RESERVE + M2_DRY + P2 + M_PAY - stage_ev['p1_used']))
    return dict(stage=stage_ev, dv1=dv1, dv2=dv2, dv_total=dv1 + dv2,
                grav_loss=grav_loss, drag_loss=drag_loss,
                p2_used=p2_used, p2_margin=P2 - p2_used, dv_circ=dv_circ,
                maxq=maxq, maxq_alt=maxq_alt, max_acc=max_acc,
                r_apo_alt=r_apo - R, m_final=m - prop_circ,
                hist=np.array(hist) if log else None)

def solve():
    """定点迭代一子级装填 × 俯仰程序粗扫(可行解中总 Δv 最小)。"""
    p1 = 120e3
    best = None
    for _ in range(4):                                 # 装填-消耗定点迭代
        best = None
        for pd in np.arange(50, 130.1, 10):
            for phid in (0, 2, 4, 6, 8):
                r = run(p1, 8.0, pd, np.deg2rad(phid))
                if r is None or r['r_apo_alt'] < TARGET_ALT - 5e3: continue
                if r['stage']['gamma'] < GAMMA_MIN: continue   # RTLS 高抛约束
                if best is None or r['dv_total'] < best[2]['dv_total']:
                    best = (pd, phid, r)
        if best is None:
            raise SystemExit('[!] 无可行解')
        p1_new = best[2]['stage']['p1_used']
        if abs(p1_new - p1) < 200: break
        p1 = p1_new
    return p1, best

if __name__ == '__main__':
    p1, (pd, phid, r) = solve()
    glow = M1_DRY + p1 + RESERVE + M2_DRY + P2 + M_PAY
    st = r['stage']
    print('=== 长十乙火星 RTLS 构型(ISRU 按需加注,推定) ===')
    print(f'  GLOW {glow/1e3:.0f} t = 一子级 {M1_DRY/1e3:.0f}干'
          f'+{p1/1e3:.1f}升轨+{RESERVE/1e3:.0f}RTLS储备'
          f' | 上面级 {M2_DRY/1e3:.0f}干+{P2/1e3:.0f}推 | 载荷 {M_PAY/1e3:.0f} t')
    print(f'  一子级点 3/7 台 @{THR1*100:.0f}% = {F1/1e6:.2f} MN,'
          f'起飞 T/W = {F1/(glow*G0S):.2f}(7 台全点会到 {7*F_ENG/ (glow*G0S):.1f} —— 火星推力过剩的选型依据)')
    print(f'\n=== 最优俯仰程序(起转 8s,压转 {pd:.0f}s,终角 {phid}°) ===')
    print(f'  分离: t={st["t"]:.0f}s  h={st["h"]/1e3:.1f} km  v={st["v"]:.0f} m/s'
          f'  γ={st["gamma"]:.1f}°  下航程={st["downrange"]/1e3:.1f} km')
    print(f'  → 交给 sim_boostback_veh_rocket_02 返场(储备 {RESERVE/1e3:.0f} t)')
    print(f'  max-Q {r["maxq"]:.0f} Pa @ {r["maxq_alt"]/1e3:.1f} km'
          f'(地球长十乙发射 ~30 kPa 量级)  峰值加速度 {r["max_acc"]/G0S:.1f} g_mars')
    print(f'\n=== Δv 分解 ===')
    print(f'  一子级 {r["dv1"]:.0f} m/s + 上面级 {r["dv2"]:.0f} m/s'
          f'(含圆化 {r["dv_circ"]:.0f})= {r["dv_total"]/1e3:.2f} km/s')
    print(f'    ├ 引力损失 {r["grav_loss"]:.0f} m/s  └ 阻力损失 {r["drag_loss"]:.0f} m/s')
    print(f'  上面级推进剂 {r["p2_used"]/1e3:.1f} t / {P2/1e3:.0f} t(余 {r["p2_margin"]/1e3:.1f} t'
          f' ≈ 额外运力 {r["p2_margin"]/1e3:.1f} t → LMO 运力上限 ~{(M_PAY+r["p2_margin"])/1e3:.0f} t)')
    print(f'  对照地球构型 LEO 14 t(回收):火星 Δv 减半 + ISRU 按需加注,'
          f'GLOW 从 740 t 缩到 {glow/1e3:.0f} t')
    # ---- SSTO 旁证(L1)----
    vex = ISP1 * G0E
    m_ss0 = M1_DRY + 180e3 + M_PAY
    dv_ss = vex * np.log(m_ss0 / (M1_DRY + M_PAY))
    print(f'\n=== SSTO 旁证(L1 齐氏,一子级单独带 {M_PAY/1e3:.0f} t 载荷) ===')
    print(f'  装填 180 t → Δv = {dv_ss:.0f} m/s ≥ 升轨需求 ~{r["dv_total"]:.0f} m/s → '
          f'{"可行" if dv_ss >= r["dv_total"] else "不可行"}'
          f'(火星单级入轨成立,但牺牲回收储备与运力,维持两级+RTLS 更优)')
    # ---- 出图 ----
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        rp = run(p1, 8.0, pd, np.deg2rad(phid), log=True)
        H = rp['hist']
        fig, ax = plt.subplots(1, 3, figsize=(15, 4.2))
        ax[0].plot(H[:, 2] / 1e3, H[:, 1] / 1e3, 'C1')
        ax[0].axhline(TARGET_ALT / 1e3, ls='--', c='gray', lw=.8)
        ax[0].set_xlabel('downrange (km)'); ax[0].set_ylabel('altitude (km)')
        ax[0].set_title('Ascent trajectory'); ax[0].grid(alpha=.3)
        ax[1].plot(H[:, 0], H[:, 3], 'C0')
        ax[1].axhline(np.sqrt(MU / (R + TARGET_ALT)), ls='--', c='gray', lw=.8)
        ax[1].axvline(st['t'], ls=':', c='r', lw=.8)
        ax[1].set_xlabel('t (s)'); ax[1].set_ylabel('speed (m/s)')
        ax[1].set_title('Velocity (staging dotted)'); ax[1].grid(alpha=.3)
        ax[2].plot(H[:, 0], H[:, 4] / 1e3, 'C3')
        ax[2].set_xlabel('t (s)'); ax[2].set_ylabel('q (kPa)')
        ax[2].set_title(f'max-Q {r["maxq"]/1e3:.2f} kPa'); ax[2].grid(alpha=.3)
        fig.suptitle(f'veh-rocket-02 Mars two-stage ascent (RTLS config) — '
                     f'dv {r["dv_total"]/1e3:.2f} km/s, GLOW {glow/1e3:.0f} t')
        fig.tight_layout()
        fig.savefig('scripts/sim_ascent_veh_rocket_02.png', dpi=110)
        print('\n轨迹图已存:scripts/sim_ascent_veh_rocket_02.png')
    except Exception as ex:
        print(f'\n[出图跳过] {ex}')
