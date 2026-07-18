#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L2 一子级返场仿真 —— veh-rocket-02 长十乙 RTLS(boostback → 再入 → 网捕)
=========================================================================
起点 = sim_ascent_veh_rocket_02 的分离态(高抛构型):
  t=123 s, h=38.2 km, v=1000 m/s, γ=26.1°, 下航程 34.9 km, 质量 93 t
    (一子级干重 45 t + RTLS 储备 48 t)
时间线:调头滑行 8 s → boostback 燃烧(2 台 YF-100K,水平逆向,
  弹道落点预测闭环关机)→ 高抛再入(发动机朝前,气动减速)→
  着陆燃烧(能量一致速度剖面制导,同 sim_hop)→ 挂点上方 0.5 m 关机
  → 栅格舵挂缆截获(箭底 2.7 m)。
方法:平面 2-DOF RK4 dt=0.02 s,平地近似(高 38 km/程 35 km,曲率误差
  ~0.3% 注记);目的:校核 42 t RTLS 储备闭合与各燃烧预算。
"""
import math

G = 3.71
RHO0, HSCALE = 0.020, 11100.0
CD_UP, CD_ENTRY = 0.8, 0.9        # 上升构型 / 发动机朝前再入
AREA = 22.0
F1 = 1340e3
VE = 335 * 9.80665
THR_MIN, THR_MAX = 0.40, 1.00
M_SEP, M_DRY, RESERVE = 93e3, 45e3, 48e3
X_TGT, Y_CATCH, Y_CUT = 59.23, 2.7, 0.5
A_REF, V_F, KV = 8.0, 1.5, 0.7    # a_ref 须使末端(m~52 t)需求油门 ≥ 深节流下限:
                                  # m(g+a_ref)/F1 = 0.46 > 0.40 ✓(过冲推力比防跑飞)
AX_MAX = 3.0                      # 横向加速度上限(≈ 25° 倾角 × 推力加速度)
TILT_MAX = math.radians(25)       # 返场着陆段横向要杀 ~200 m/s 残余漂移,
                                  # ZEM/ZEV 制导(零控脱靶/零控末速,tgo 剖面解析)
N_BB = 2                          # boostback 用 2 台
DT = 0.02

# ---- 分离态(取自 sim_ascent_veh_rocket_02 输出)----
GAM = math.radians(26.1)
S0 = [34.9e3, 38.2e3, 1000 * math.cos(GAM), 1000 * math.sin(GAM), M_SEP]
T0 = 123.0

def rho(y):
    return RHO0 * math.exp(-max(y, 0.0) / HSCALE)

def v_des(y):
    return -math.sqrt(2 * A_REF * max(y - Y_CATCH, 0.0) + V_F * V_F)

def impact_x(x, y, vx, vy):
    """无阻力弹道落点预测(boostback 关机判据)。"""
    t = (vy + math.sqrt(vy * vy + 2 * G * y)) / G
    return x + vx * t

def deriv(s, fx, fy, cd):
    x, y, vx, vy, m = s
    v = math.hypot(vx, vy)
    q = 0.5 * rho(y) * cd * AREA * v
    return [vx, vy, (fx - q * vx) / m, (fy - q * vy) / m - G,
            -math.hypot(fx, fy) / VE]

def rk4(s, fx, fy, cd):
    k1 = deriv(s, fx, fy, cd)
    s2 = [a + 0.5 * DT * b for a, b in zip(s, k1)]
    k2 = deriv(s2, fx, fy, cd)
    s3 = [a + 0.5 * DT * b for a, b in zip(s, k2)]
    k3 = deriv(s3, fx, fy, cd)
    s4 = [a + DT * b for a, b in zip(s, k3)]
    k4 = deriv(s4, fx, fy, cd)
    return [a + DT / 6 * (b + 2 * c + 2 * d + e)
            for a, b, c, d, e in zip(s, k1, k2, k3, k4)]

def fly(x_aim, record=False):
  """整段返场飞行;x_aim = boostback 弹道落点瞄准偏置(外层打靶迭代校准:
  无阻力落点预测不含阻力与着陆燃烧拖长的滞空漂移,离线迭代吸收)。"""
  s, t, phase = list(S0), T0, 'flip'
  ev, hist = {}, []
  prop = {'boostback': 0.0, 'landing': 0.0}
  peak_q = peak_qdot = peak_dec = 0.0
  prev_v = math.hypot(s[2], s[3])
  while t < 800:
    x, y, vx, vy, m = s
    fx = fy = 0.0
    cd = CD_ENTRY
    if phase == 'flip':
        cd = CD_UP
        if t >= T0 + 8:
            phase = 'boostback'
            ev['boostback_ign'] = dict(t=round(t, 1), h=round(y), vx=round(vx))
    elif phase == 'boostback':
        fx = -N_BB * F1
        if impact_x(x, y, vx, vy) <= x_aim:
            phase = 'entry'
            ev['boostback_cut'] = dict(t=round(t, 1), h=round(y), x=round(x),
                                       vx=round(vx, 1), vy=round(vy, 1))
    elif phase == 'entry':
        if vy < 0 and vy <= v_des(y) + 5.0:
            phase = 'burn'
            ev['ignition'] = dict(t=round(t, 1), h=round(y), vx=round(vx, 1),
                                  vy=round(vy, 1))
    elif phase == 'burn':
        if y <= Y_CATCH + Y_CUT:
            phase = 'drop'
            ev['cutoff'] = dict(t=round(t, 1), vy=round(vy, 2))
        else:
            a_cmd = G + A_REF + KV * (v_des(y) - vy)
            if m * a_cmd / F1 < 0.32 and y > 200:      # 需求跌破深节流:中途关机
                phase = 'entry'                        # 滑行,待再点火(多次点火)
                ev.setdefault('relight_offs', 0)
                ev['relight_offs'] += 1
                continue
            thr = min(max(m * a_cmd / F1, THR_MIN), THR_MAX)
            tgo = math.sqrt(2 * max(y - Y_CATCH, 1.0) / A_REF) + 0.5
            zem = X_TGT - x - vx * tgo                 # 零控脱靶量
            ax_cmd = max(-AX_MAX, min(AX_MAX,
                         6 * zem / tgo ** 2 + 2 * vx / tgo))   # ZEM/ZEV 律
            tilt = max(-TILT_MAX, min(TILT_MAX,
                       math.asin(max(-1, min(1, m * ax_cmd / (thr * F1))))))
            fx, fy = thr * F1 * math.sin(tilt), thr * F1 * math.cos(tilt)
    v = math.hypot(vx, vy)
    q = 0.5 * rho(y) * v * v
    peak_q = max(peak_q, q)
    peak_qdot = max(peak_qdot, 0.5 * rho(y) * v ** 3)
    if t > T0 + 0.1:
        peak_dec = max(peak_dec, abs(v - prev_v) / DT)
    prev_v = v
    if not hist or t - hist[-1][0] >= 0.25:
        thr_now = math.hypot(fx, fy) / F1
        hist.append((t, x, y, vx, vy, thr_now))
    burn_key = 'boostback' if phase == 'boostback' else (
        'landing' if phase == 'burn' else None)
    m_before = s[4]
    s = rk4(s, fx, fy, cd)
    if burn_key:
        prop[burn_key] += m_before - s[4]
    t += DT
    if phase == 'drop' and s[1] <= Y_CATCH:
        break
    assert s[4] > M_DRY - 1, 'RTLS 储备烧穿'
  x, y, vx, vy, m = s
  ev['catch'] = dict(t=round(t, 1), x=round(x, 2), vx=round(vx, 2),
                     vy=round(vy, 2))
  return dict(x=x, vland=math.hypot(vx, vy), used=M_SEP - m, ev=ev, prop=prop,
              hist=hist, peak_q=peak_q, peak_qdot=peak_qdot, peak_dec=peak_dec)

# ---- 外层打靶迭代:校准 boostback 瞄准偏置(吸收阻力+着陆滞空漂移)----
x_aim, n_iter = X_TGT, 0
for n_iter in range(1, 7):
    err = fly(x_aim)['x'] - X_TGT
    if abs(err) < 1.0: break
    x_aim -= err
r = fly(x_aim, record=True)
ev, prop, hist = r['ev'], r['prop'], r['hist']
x, vland, used = r['x'], r['vland'], r['used']
peak_q, peak_qdot, peak_dec = r['peak_q'], r['peak_qdot'], r['peak_dec']
vx, vy = ev['catch']['vx'], ev['catch']['vy']
assert vland < 4.5 and abs(x - X_TGT) < 2.0

print('=' * 64)
print('长十乙一子级 RTLS 返场 —— 动力学摘要(接 sim_ascent 分离态)')
print('=' * 64)
print('boostback 瞄准偏置 x_aim = %.0f m(打靶 %d 轮收敛;'
      '偏置吸收再入阻力与着陆滞空的横向漂移)' % (x_aim, n_iter))
for k in ['boostback_ign', 'boostback_cut', 'ignition', 'cutoff', 'catch']:
    print('%-13s %s' % (k, ev[k]))
print('挂缆速度 %.2f m/s | 落点误差 %.2f m' % (vland, abs(x - X_TGT)))
print('推进剂: boostback %.1f t + 着陆 %.1f t = %.1f t / 储备 %.0f t'
      '(余 %.1f t,裕度 %.0f%%)'
      % (prop['boostback'] / 1e3, prop['landing'] / 1e3, used / 1e3,
         RESERVE / 1e3, (RESERVE - used) / 1e3, (RESERVE - used) / RESERVE * 100))
print('再入峰值动压 %.2f kPa | 峰值热流指标 ½ρv³ = %.0f kW/m²'
      '(地球 F9 再入 ~数百 kW/m² 量级 → 火星再入热环境温和,无需再入燃烧)'
      % (peak_q / 1e3, peak_qdot / 1e3))
print('全程峰值减速度 %.1f m/s² (%.2f g_earth) | 平地近似曲率误差 ~0.3%%(注记)'
      % (peak_dec, peak_dec / 9.81))

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    matplotlib.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei']
    matplotlib.rcParams['axes.unicode_minus'] = False
    import numpy as np
    H = np.array(hist)
    fig, ax = plt.subplots(1, 3, figsize=(15, 4.2))
    ax[0].plot(H[:, 1] / 1e3, H[:, 2] / 1e3, 'C1')
    ax[0].plot(X_TGT / 1e3, 0, 'rx', ms=10)
    ax[0].set_xlabel('downrange (km)'); ax[0].set_ylabel('altitude (km)')
    ax[0].set_title('一子级返场弹道(× = 回收网)'); ax[0].grid(alpha=.3)
    ax[1].plot(H[:, 0], np.hypot(H[:, 3], H[:, 4]), 'C0')
    ax[1].set_xlabel('t (s)'); ax[1].set_ylabel('speed (m/s)')
    ax[1].set_title('速度剖面'); ax[1].grid(alpha=.3)
    ax[2].plot(H[:, 0], H[:, 5], 'C3')
    ax[2].set_xlabel('t (s)'); ax[2].set_ylabel('throttle')
    ax[2].set_title('推力剖面(boostback + 着陆)'); ax[2].grid(alpha=.3)
    fig.suptitle('veh-rocket-02 一子级 RTLS:boostback %.1f t + 着陆 %.1f t'
                 ' / 储备 %.0f t' % (prop['boostback'] / 1e3,
                                     prop['landing'] / 1e3, RESERVE / 1e3))
    fig.tight_layout()
    fig.savefig('scripts/sim_boostback_veh_rocket_02.png', dpi=110)
    print('轨迹图已存:scripts/sim_boostback_veh_rocket_02.png')
except Exception as ex:
    print('[出图跳过] %s' % ex)
