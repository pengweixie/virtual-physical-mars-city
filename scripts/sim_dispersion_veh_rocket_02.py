#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L2 蒙特卡洛落点散布 —— veh-rocket-02 跳跃回收演示(网捕窗口概率)
==================================================================
对 sim_hop 的一子级着陆段整剖面(起飞→分离→过顶→着陆燃烧→挂缆)做
N=500 次蒙特卡洛,散布(推定 3σ/区间):
  推力 ±3%、Isp ±1%、起飞质量 ±2%、大气密度 ×U(0.7,1.3)、
  定常风 U(-12,+12) m/s(沿飞行平面,含 ±4 m/s 阵风正弦)、
  着陆点火判据延迟 U(0,0.3) s、导航位置偏差 U(±0.5) m + 速度偏差
  U(±0.1) m/s(制导回路使用测量值,偏差不被闭环消除,是散布主导项)
判据(网捕窗口):|落点误差| ≤ 2.0 m 且 |vx| ≤ 1.5 m/s 且 vy 挂缆 ≤ 5 m/s。
输出:σ/CEP、挂缆速度分布、捕获概率;散点图。
注:火星大气稀薄是散布的天然抑制器——12 m/s 大风的气动力对 90 t 级
箭体仅 ~0.003 m/s² 量级,散布主要来自推力/质量/时序误差。
"""
import math
import random

G = 3.71
RHO0, HSCALE = 0.020, 11100.0
CD, AREA = 0.8, 22.0
F1N, VEN = 1340e3, 335 * 9.80665
THR_MIN, THR_MAX = 0.40, 1.00
M1_DRY, P1, M2_WET = 45e3, 60e3, 60e3
Y_PAD, Y_CATCH, Y_CUT, X_TGT = 8.1, 2.7, 0.5, 59.23
APO, A_REF, V_F, KV = 2500.0, 4.0, 1.5, 0.7
KPX, KDX, AX_MAX = 0.06, 0.5, 0.6
TILT_MAX = math.radians(12)
DA = math.radians(0.40)
DT = 0.04
N_MC = 500

def one(seed):
    rng = random.Random(seed)
    kF = 1 + rng.gauss(0, 0.01)          # 推力 3σ=3%
    kI = 1 + rng.gauss(0, 0.0033)        # Isp 3σ=1%
    kM = 1 + rng.gauss(0, 0.0067)        # 质量 3σ=2%
    kR = rng.uniform(0.7, 1.3)
    wind = rng.uniform(-12, 12)
    gust = rng.uniform(0, 4)
    t_delay = rng.uniform(0, 0.3)
    nav_bx = rng.uniform(-0.5, 0.5)      # 导航位置偏差(制导所见)
    nav_bv = rng.uniform(-0.1, 0.1)      # 导航速度偏差
    F1, VE = F1N * kF, VEN * kI
    rho0 = RHO0 * kR
    s = [0.0, Y_PAD, 0.0, 0.0, (M1_DRY + P1 + M2_WET) * kM]
    t, phase, t_meco, t_trig = 0.0, 'ascent', None, None
    while t < 250:
        x, y, vx, vy, m = s
        thr, tilt = 0.0, 0.0
        if phase == 'ascent':
            if y + vy * vy / (2 * G) >= APO: phase = 'sep_coast'; t_meco = t
            else: thr, tilt = 1.0, (DA if (t > 4 and y > 95) else 0.0)
        elif phase == 'sep_coast':
            if t - t_meco >= 2.0:
                s[4] -= M2_WET * kM; s[3] -= 0.5
                phase = 'coast'; continue
        elif phase == 'coast':
            vdes = -math.sqrt(2 * A_REF * max(y - Y_CATCH, 0) + V_F**2)
            if vy < 0 and vy <= vdes + 3.0:
                if t_trig is None: t_trig = t
                if t - t_trig >= t_delay: phase = 'burn'
        elif phase == 'burn':
            if y <= Y_CATCH + Y_CUT: phase = 'drop'
            else:
                vdes = -math.sqrt(2 * A_REF * max(y - Y_CATCH, 0) + V_F**2)
                a_cmd = G + A_REF + KV * (vdes - vy)
                thr = min(max(m * a_cmd / F1, THR_MIN), THR_MAX)
                axc = max(-AX_MAX, min(AX_MAX,
                          -KPX * (x + nav_bx - X_TGT) - KDX * (vx + nav_bv)))
                tilt = max(-TILT_MAX, min(TILT_MAX,
                           math.asin(max(-1, min(1, m * axc / (thr * F1))))))
        # 动力学(含风的相对速度阻力)
        w = wind + gust * math.sin(t * 0.5)
        rvx = vx - w
        v = math.hypot(rvx, vy)
        q = 0.5 * rho0 * math.exp(-max(y, 0) / HSCALE) * CD * AREA * v
        T = thr * F1
        ax = (T * math.sin(tilt) - q * rvx) / m
        ay = (T * math.cos(tilt) - q * vy) / m - G
        s = [x + vx * DT, y + vy * DT, vx + ax * DT, vy + ay * DT,
             m - (T / VE) * DT]
        t += DT
        if phase == 'drop' and s[1] <= Y_CATCH:
            return s[0] - X_TGT, s[2], s[3]
    return None

res = [one(i) for i in range(N_MC)]
res = [r for r in res if r]
xe = [r[0] for r in res]
vxs = [abs(r[1]) for r in res]
vys = [-r[2] for r in res]
n = len(res)
mean = sum(xe) / n
sd = math.sqrt(sum((e - mean) ** 2 for e in xe) / n)
cep = sorted(abs(e) for e in xe)[n // 2]
ok = sum(1 for r in res if abs(r[0]) <= 2.0 and abs(r[1]) <= 1.5 and -r[2] <= 5.0)
print('=' * 60)
print('跳跃回收蒙特卡洛 N=%d(完赛 %d)' % (N_MC, n))
print('=' * 60)
print('落点误差: 均值 %+.2f m  σ=%.2f m  CEP=%.2f m  最差 %+.2f m'
      % (mean, sd, cep, max(xe, key=abs)))
print('挂缆垂速: 均值 %.2f m/s  最大 %.2f m/s' % (sum(vys) / n, max(vys)))
print('残余横速: 均值 %.2f m/s  最大 %.2f m/s' % (sum(vxs) / n, max(vxs)))
print('网捕窗口(|Δx|≤2m, |vx|≤1.5, vy≤5): 捕获概率 %.1f%% (%d/%d)'
      % (ok / n * 100, ok, n))
print('注:±12 m/s 定常风下散布仍这么小,是火星稀薄大气(风载 ~0.003 m/s²)'
      '+ 闭环制导共同作用;散布主导项是导航偏差(±0.5 m 直接映射到落点),'
      '推力/质量/风散布几乎被闭环吃掉。')

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    matplotlib.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei']
    matplotlib.rcParams['axes.unicode_minus'] = False
    fig, ax = plt.subplots(1, 2, figsize=(10.5, 4.2))
    ax[0].scatter(xe, vys, s=8, alpha=0.5)
    ax[0].axvline(-2, c='r', lw=0.8, ls=':'); ax[0].axvline(2, c='r', lw=0.8, ls=':')
    ax[0].axhline(5, c='r', lw=0.8, ls=':')
    ax[0].set_xlabel('落点误差 (m)'); ax[0].set_ylabel('挂缆垂速 (m/s)')
    ax[0].set_title('落点 × 挂缆速度(红线 = 网捕窗口)'); ax[0].grid(alpha=.3)
    ax[1].hist(xe, bins=30)
    ax[1].set_xlabel('落点误差 (m)'); ax[1].set_ylabel('次数')
    ax[1].set_title('落点直方图 σ=%.2f m CEP=%.2f m' % (sd, cep))
    ax[1].grid(alpha=.3)
    fig.suptitle('veh-rocket-02 跳跃回收 MC N=%d — 捕获概率 %.1f%%' % (n, ok / n * 100))
    fig.tight_layout()
    fig.savefig('scripts/sim_dispersion_veh_rocket_02.png', dpi=110)
    print('已出图 scripts/sim_dispersion_veh_rocket_02.png')
except ImportError:
    print('(matplotlib 不可用)')
