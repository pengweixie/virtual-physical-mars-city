# -*- coding: utf-8 -*-
"""
sim_hop_veh_rocket_02.py —— 长十乙火星发射回收演示(两体:空中分离)动力学
==========================================================================
任务剖面:全箭从 ops-spaceport-02 发射台起飞(单台中心 YF-100K)→ MECO →
2 s 滑行后**级间热分离**:上面级(二级+梦舟飞船,60 t)点火继续升轨飞离;
一子级(干重 45 t + 残余推进剂)弹道过顶(栅格舵展开)→ 速度剖面制导
着陆燃烧,箭体**穿过网口下降**("井"字主缆中央网眼 9×11 m > Ø5 m 箭体;
展开的栅格舵翼展 9.4 m 充当挂钩)→ 挂点截获面上方 0.5 m **关机跌落挂缆**
→ 栅格舵架上主缆(缆面 34.8 m,挂点高出箭底 32.1 m → 截获时箭底仅
2.7 m,尾部已在台面上方 1.5 m)→ 绞车放缆 0.8 m,喷管触台,回收完成。
着陆燃烧末段羽流经中央网眼直接冲刷台面(资产在网阵台面中心预置了
烧灼痕,与该流程互证)。

方法(L2):平面 2-DOF(x 沿发射台→网心方位角,y 垂直)RK4 dt=0.02 s,
分离后两体各自独立积分;推力倾角小(一子级 <5°),垂直/横向小角度解耦
(cos δ≈1,文末自检);上面级俯仰程序 0→35°(2.5°/s 斜坡)属大角度,
其推力沿倾角矢量完整分解(不做小角度近似)。
着陆制导:能量一致速度剖面 v_des(y) = -√(2·a_ref·(y-y_c) + v_f²),
油门 = 重力补偿 + a_ref 前馈 + 速度误差反馈;横向位置 PD 生成推力倾角。
一子级分离后质量 ~96 t,最小节流 40% 时 T/W≈1.5(过冲推力比,无法悬停)
→ 末段必须关机跌落:y_c+0.5 m 处关机,自由落体入网。
上升段俯仰角 δa 网格搜索(代价 = 一子级落点误差 + 着陆段倾角占用)。

参数溯源:
  火星 g=3.71、ρ0=0.020 kg/m³、H=11.1 km —— 与 sim_ascent_veh_rocket_01 一致
  YF-100K/YF-100M 真空推力 1340 kN、Isp 335 s —— 按 YF-100 系公开数据推定
  质量:一子级干重 45 t + 演示加注 60 t;上面级(二级+飞船)湿重 60 t
    (含二级演示推进剂 20 t)→ 起飞 165 t,单机起飞 T/W=2.19(火星)
  节流范围 40%~100%(补燃深节流下限,推定);Cd=0.8,A=22 m²
  发射台落座 8.1 m / 网捕获面 28.8 m / 网心水平距 59.23 m
    —— 取自 ops-spaceport-02.js 几何

输出:摘要表 + veh-rocket-02.flight.json(一子级 rows + 上面级 rows2)
      + sim_hop_veh_rocket_02.png(四联图)
"""
import json
import math
import os

# ---------------- 常数与构型 ----------------
G = 3.71
RHO0, HSCALE = 0.020, 11100.0
CD, AREA = 0.8, 22.0
CD2, AREA2 = 0.7, 21.0            # 上面级(短粗+飞船)
F1 = 1340e3
VE = 335 * 9.80665
THR_MIN, THR_MAX = 0.40, 1.00
M1_DRY, P1 = 45e3, 60e3           # 一子级干重 / 演示加注
M2_WET = 60e3                     # 上面级湿重(40 干 + 20 推进剂)
M0 = M1_DRY + P1 + M2_WET         # 165 t
Y_PAD = 8.1
CABLE_Y, HOOK_REL = 34.8, 32.1    # 主缆平面 / 挂点(栅格舵铰)高出箭底
Y_CATCH = CABLE_Y - HOOK_REL      # 2.7 m:截获瞬间的箭底高度
Y_REST = 1.9                      # 绞车放缆后箭底(喷管触台,台面 1.2 m)
X_TGT = math.hypot(58.0, 12.0)    # 59.23 m
APO_TGT = 2500.0
A_REF, V_F = 4.0, 1.5             # 着陆剖面参考减速度 / 剖面末端垂速
Y_CUT = 0.5                       # 网上关机高度(自由落体入网)
KV = 0.7
KPX, KDX, AX_MAX = 0.06, 0.5, 0.6
TILT_MAX = math.radians(12)
T_SEP_COAST = 2.0                 # MECO→分离滑行
T_S2_IGN = 3.0                    # 分离→上面级点火
THR2 = 0.75                       # 上面级油门
PITCH2_MAX, PITCH2_RATE = math.radians(35), math.radians(2.5)
DT = 0.02

def rho(y):
    return RHO0 * math.exp(-max(y, 0.0) / HSCALE)

def v_des(y):
    return -math.sqrt(2 * A_REF * max(y - Y_CATCH, 0.0) + V_F * V_F)

def deriv(state, thr, tilt, cd_a):
    x, y, vx, vy, m = state
    T = thr * F1
    v = math.hypot(vx, vy)
    q = 0.5 * rho(y) * cd_a * v
    ax = (T * math.sin(tilt) - q * vx) / m
    ay = (T * math.cos(tilt) - q * vy) / m - G
    return [vx, vy, ax, ay, -T / VE if thr > 0 else 0.0]

def rk4(state, thr, tilt, dt, cd_a=CD * AREA):
    k1 = deriv(state, thr, tilt, cd_a)
    s2 = [a + 0.5 * dt * b for a, b in zip(state, k1)]
    k2 = deriv(s2, thr, tilt, cd_a)
    s3 = [a + 0.5 * dt * b for a, b in zip(state, k2)]
    k3 = deriv(s3, thr, tilt, cd_a)
    s4 = [a + dt * b for a, b in zip(state, k3)]
    k4 = deriv(s4, thr, tilt, cd_a)
    return [a + dt / 6 * (b + 2 * c + 2 * d + e)
            for a, b, c, d, e in zip(state, k1, k2, k3, k4)]

# ---------------- 一子级(含起飞段)制导 ----------------
def control(t, x, y, vx, vy, m, phase, delta_a, t_meco):
    if phase == 'ascent':
        if y + vy * vy / (2 * G) >= APO_TGT:
            return 0.0, 0.0, 'sep_coast'
        return 1.0, (delta_a if (t > 4.0 and y > 95.0) else 0.0), phase
    if phase == 'sep_coast':
        if t - t_meco >= T_SEP_COAST:
            return 0.0, 0.0, 'coast'          # 调用方在此瞬间执行分离
        return 0.0, 0.0, phase
    if phase == 'coast':
        if vy < 0 and vy <= v_des(y) + 3.0:
            return 0.0, 0.0, 'burn'
        return 0.0, 0.0, phase
    if phase == 'burn':
        if y <= Y_CATCH + Y_CUT:
            return 0.0, 0.0, 'drop'           # 网上关机,跌落入网
        a_ff = A_REF
        a_cmd = G + a_ff + KV * (v_des(y) - vy)
        thr = min(max(m * a_cmd / F1, THR_MIN), THR_MAX)
        ax_cmd = max(-AX_MAX, min(AX_MAX, -KPX * (x - X_TGT) - KDX * vx))
        s = max(-1.0, min(1.0, m * ax_cmd / (thr * F1)))
        tilt = max(-TILT_MAX, min(TILT_MAX, math.asin(s)))
        return thr, tilt, phase
    return 0.0, 0.0, phase                    # drop

def simulate(delta_a, record=False):
    state = [0.0, Y_PAD, 0.0, 0.0, M0]
    phase, t, t_meco = 'ascent', 0.0, None
    rows, rows2, events = [], [], {}
    sep_state = None
    tilt_use, prev_vy = 0.0, 0.0
    while t < 300.0:
        x, y, vx, vy, m = state
        thr, tilt, nphase = control(t, x, y, vx, vy, m, phase, delta_a, t_meco)
        if nphase != phase:
            key = {'sep_coast': 'meco', 'coast': 'separation',
                   'burn': 'ignition', 'drop': 'cutoff'}[nphase]
            events[key] = dict(t=round(t, 2), x=round(x, 1), y=round(y, 1),
                               vx=round(vx, 2), vy=round(vy, 2))
            if nphase == 'sep_coast':
                t_meco = t
            if nphase == 'coast':                       # ---- 级间分离 ----
                sep_state = [x, y, vx, vy + 1.5, M2_WET]  # 上面级 + 弹簧分离冲量
                state = [x, y, vx, vy - 0.5, m - M2_WET]  # 一子级
                x, y, vx, vy, m = state
            phase = nphase
        if phase in ('coast', 'burn') and prev_vy > 0 >= vy:
            events['apogee'] = dict(t=round(t, 2), x=round(x, 1), y=round(y, 1))
        prev_vy = vy
        if record:
            rows.append([t, x, y, vx, vy, tilt, thr, phase])
        if phase == 'burn':
            tilt_use += abs(tilt) * DT
        state = rk4(state, thr, tilt, DT)
        t += DT
        if phase == 'drop' and state[1] <= Y_CATCH:
            break
        if state[4] <= M1_DRY:
            raise RuntimeError('一子级推进剂耗尽')
    x, y, vx, vy, m = state
    events['catch'] = dict(t=round(t, 2), x=round(x, 2), y=round(y, 2),
                           vx=round(vx, 2), vy=round(vy, 2),
                           prop_used_t=round((M0 - M2_WET - m) / 1e3, 2))
    # ---------------- 上面级续飞(分离点起) ----------------
    if sep_state is not None:
        t2, s2 = events['separation']['t'], sep_state
        t2_ign = t2 + T_S2_IGN
        pitch = 0.0
        while t2 < events['separation']['t'] + 55.0 and s2[1] < 7000.0:
            burning = t2 >= t2_ign and s2[4] > M2_WET - 20e3 + 100
            if burning:
                pitch = min(PITCH2_MAX, pitch + PITCH2_RATE * DT)
            if record:
                rows2.append([t2, s2[0], s2[1], s2[2], s2[3], pitch,
                              THR2 if burning else 0.0, 's2'])
            s2 = rk4(s2, THR2 if burning else 0.0, pitch, DT, CD2 * AREA2)
            t2 += DT
        events['s2_ignition'] = dict(t=round(t2_ign, 2))
        events['s2_final'] = dict(t=round(t2, 2), x=round(s2[0], 1),
                                  y=round(s2[1], 1), vx=round(s2[2], 1),
                                  vy=round(s2[3], 1),
                                  prop_used_t=round((M2_WET - s2[4]) / 1e3, 2))
    return dict(rows=rows, rows2=rows2, events=events,
                xerr=abs(x - X_TGT), vland=math.hypot(vx, vy),
                tilt_use=tilt_use, m_final=m)

# ---------------- 上升俯仰角搜索 ----------------
best = None
for da_deg in [i * 0.05 for i in range(0, 41)]:
    r = simulate(math.radians(da_deg))
    cost = r['xerr'] + 20 * r['tilt_use']
    if best is None or cost < best[1]:
        best = (da_deg, cost)
res = simulate(math.radians(best[0]), record=True)
ev, rows, rows2 = res['events'], res['rows'], res['rows2']

# ---------------- 自检 ----------------
max_tilt = max(abs(r[5]) for r in rows)
sat = sum(DT for r in rows if r[7] == 'burn' and r[6] >= THR_MAX - 1e-9)
assert res['vland'] < 4.0, '入网速度超限: %.2f' % res['vland']
assert res['xerr'] < 1.0, '落点横向误差超限'
assert max_tilt < TILT_MAX - 1e-6, '一子级倾角饱和'
assert ev['s2_final']['y'] > 5000, '上面级未爬出场景'
cos_err = 1 - math.cos(max_tilt)

print('=' * 66)
print('长十乙 火星发射回收演示(两体·空中分离)—— 动力学摘要 (L2, RK4)')
print('=' * 66)
print('上升俯仰角搜索结果: %.2f deg' % best[0])
for k in ['meco', 'separation', 'apogee', 'ignition', 'cutoff', 'catch']:
    print('%-10s %s' % (k, ev[k]))
print('上面级点火 t=%.1fs | 终态 %s' % (ev['s2_ignition']['t'], ev['s2_final']))
print('一子级挂缆速度 %.2f m/s(%.1f m 关机跌落)| 落点误差 %.2f m'
      % (res['vland'], Y_CUT, res['xerr']))
print('悬挂载荷 L1:m·g = %.0f kN → 4 挂点(栅格舵)各 %.0f kN;'
      '放缆 %.1f m 后喷管触台(箭底 %.1f m)'
      % (res['m_final'] * G / 1e3, res['m_final'] * G / 4e3,
         Y_CATCH - Y_REST, Y_REST))
print('一子级推进剂消耗 %.1f t / %d t | 上面级消耗 %.1f t / 20 t'
      % (ev['catch']['prop_used_t'], P1 / 1e3, ev['s2_final']['prop_used_t']))
print('一子级峰值倾角 %.2f deg | 着陆段油门饱和 %.1f s | 解耦误差 %.5f'
      % (math.degrees(max_tilt), sat, cos_err))

# ---------------- 烘焙 flight.json ----------------
PH = {'ascent': 0, 'sep_coast': 1, 'coast': 1, 'burn': 2, 'drop': 3, 's2': 4}
def bake(rr):
    out = [[round(r[0], 2), round(r[1], 2), round(r[2], 2), round(r[3], 3),
            round(r[4], 3), round(r[5], 4), round(r[6], 3), PH[r[7]]]
           for i, r in enumerate(rr) if i % 5 == 0]
    out.append([round(rr[-1][0], 2)] + [round(v, 3) if isinstance(v, float) else v
                                        for v in rr[-1][1:7]] + [PH[rr[-1][7]]])
    return out
flight = dict(
    id='veh-rocket-02',
    desc='火星发射回收演示弹道(空中级间分离:上面级续飞,一子级网捕)',
    frame='x 沿发射台→网心方位角([58,12] 方向),y 垂直(箭底高度)',
    params=dict(g=G, F1_kN=F1 / 1e3, Isp_s=335, m0_t=M0 / 1e3,
                m1_dry_t=M1_DRY / 1e3, m2_wet_t=M2_WET / 1e3,
                apo_target_m=APO_TGT, a_ref=A_REF, v_f=V_F, y_cut=Y_CUT,
                delta_ascent_deg=round(best[0], 2), x_tgt=round(X_TGT, 2),
                y_pad=Y_PAD, y_catch=Y_CATCH, y_rest=Y_REST,
                cable_y=CABLE_Y, hook_rel=HOOK_REL, lower_rate=0.3),
    events=ev,
    cols=['t', 'x', 'y', 'vx', 'vy', 'tilt_rad', 'throttle',
          'phase(0asc/1coast/2burn/3drop/4s2)'],
    rows=bake(rows), rows2=bake(rows2))
root = os.path.join(os.path.dirname(__file__), '..')
dst = os.path.join(root, 'viewer', 'units', 'veh-rocket-02.flight.json')
with open(dst, 'w', encoding='utf-8') as f:
    json.dump(flight, f, ensure_ascii=False)
print('已烘焙 %s (一子级 %d + 上面级 %d 采样点)'
      % (os.path.relpath(dst, root), len(flight['rows']), len(flight['rows2'])))

# ---------------- 四联图 ----------------
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    matplotlib.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei']
    matplotlib.rcParams['axes.unicode_minus'] = False
    T = [r[0] for r in rows]
    fig, axs = plt.subplots(2, 2, figsize=(11, 7))
    axs[0][0].plot(T, [r[2] for r in rows], label='一子级')
    axs[0][0].plot([r[0] for r in rows2], [r[2] for r in rows2],
                   c='tab:green', label='上面级')
    axs[0][0].axhline(Y_CATCH, ls='--', c='gray', lw=0.8)
    axs[0][0].legend(); axs[0][0].set_title('高度 y(t) / m')
    axs[0][1].plot(T, [r[4] for r in rows], label='vy(一子级)')
    axs[0][1].plot(T, [v_des(r[2]) for r in rows], ls='--', label='v_des(y)')
    axs[0][1].legend(); axs[0][1].set_title('垂直速度与制导剖面 / m/s')
    axs[1][0].plot(T, [r[6] for r in rows])
    axs[1][0].set_title('一子级油门 τ(t)'); axs[1][0].set_ylim(-0.05, 1.1)
    axs[1][1].plot([r[1] for r in rows], [r[2] for r in rows], label='一子级')
    axs[1][1].plot([r[1] for r in rows2], [r[2] for r in rows2],
                   c='tab:green', label='上面级')
    axs[1][1].plot(X_TGT, Y_CATCH, 'rx', ms=10)
    axs[1][1].legend(); axs[1][1].set_title('弹道 x-y / m(× = 网心捕获点)')
    for ax_row in axs:
        for ax in ax_row:
            ax.grid(alpha=0.3)
    fig.suptitle('veh-rocket-02 火星发射回收演示 · 空中分离(%.2f° 上升俯仰)'
                 % best[0])
    fig.tight_layout()
    fig.savefig(os.path.join(os.path.dirname(__file__),
                             'sim_hop_veh_rocket_02.png'), dpi=110)
    print('已出图 scripts/sim_hop_veh_rocket_02.png')
except ImportError:
    print('(matplotlib 不可用,跳过出图)')
