# Find a posture the robot can actually hold up on its own.
#
# The gait bake runs on a planarizing rig (a pitch spring standing in for a
# gait-trainer boom). analyze_gait.py measured what that boom is worth: 55 N.m
# standing, i.e. a 37 cm ZMP shift against a 10 cm foot half-length. So the
# original idle/walk postures are NOT balanceable — the boom was holding the
# robot up and the ledger only found out when we asked it to.
#
# Fix: trim the posture until the boom does nothing. Sweep an ankle offset (the
# classic ankle strategy) and, for the walk, a torso-lean offset, minimizing the
# cycle-mean |rig torque|. Zero rig torque == the robot balances itself.
import json
import math
import os
import mujoco
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
m = mujoco.MjModel.from_xml_path(os.path.join(HERE, "hab_bot.xml"))
d = mujoco.MjData(m)
G = 3.71
MASS = float(m.body_mass[1:].sum())

JN = ["hip_L", "hip_R", "knee_L", "knee_R", "ank_L", "ank_R",
      "sh_L", "sh_R", "elb_L", "elb_R"]
AID = {n: m.actuator("a_" + n).id for n in JN}
QADR = {n: m.joint(n).qposadr[0] for n in JN}
DP = m.joint("root_pitch").dofadr[0]


def com_y():
    return float(np.sum(m.body_mass[1:, None] * d.xipos[1:], axis=0)[1]
                 / m.body_mass[1:].sum())


def foot_span():
    """fore/aft edges of the loaded feet, world y."""
    ys = [d.xpos[m.body(f).id][1] for f in ("foot_L", "foot_R")
          if d.xpos[m.body(f).id][2] < 0.10]
    if not ys:
        return None
    return min(ys) - 0.08, max(ys) + 0.11


# ---------------- posture generators, now with trim knobs ----------------
def idle_cmd(t, T, ank=0.0, hip=0.0, knee=0.0):
    s = math.sin(2 * math.pi * t / T)
    c = math.sin(2 * math.pi * t / T + 1.1)
    return {"hip_L": hip + 0.020 * s, "hip_R": hip + 0.020 * s,
            "knee_L": knee - 0.075 + 0.030 * s, "knee_R": knee - 0.075 + 0.030 * s,
            "ank_L": ank + 0.012 * c, "ank_R": ank + 0.012 * c,
            "sh_L": 0.05 * s, "sh_R": 0.05 * s,
            "elb_L": 0.40 + 0.04 * s, "elb_R": 0.40 + 0.04 * s}


A_HIP, A_ARM = 0.34, 0.28


def leg_walk(p):
    hip = A_HIP * math.cos(2 * math.pi * p)
    if p < 0.6:
        knee = -0.10 - 0.10 * math.sin(math.pi * p / 0.6)
    else:
        s = (p - 0.6) / 0.4
        knee = -0.10 - 0.90 * math.sin(math.pi * s)
    ankle = 0.10 * math.sin(2 * math.pi * p + 0.5)
    return hip, knee, ankle


def walk_cmd(t, T, ank=0.0, hip=0.0, knee=0.0):
    ph = (t % T) / T
    pL, pR = ph, (ph + 0.5) % 1.0
    hL, kL, aL = leg_walk(pL)
    hR, kR, aR = leg_walk(pR)
    return {"hip_L": hip + hL, "hip_R": hip + hR,
            "knee_L": knee + kL, "knee_R": knee + kR,
            "ank_L": ank + aL, "ank_R": ank + aR,
            "sh_L": -A_ARM * math.cos(2 * math.pi * pL),
            "sh_R": -A_ARM * math.cos(2 * math.pi * pR),
            "elb_L": 0.45 + 0.10 * math.sin(2 * math.pi * pL),
            "elb_R": 0.45 + 0.10 * math.sin(2 * math.pi * pR)}


def evaluate(cmd_fn, T, ank, hip, knee, laps=2, verbose=False):
    """Return (mean |rig torque|, mean ZMP-need margin, com-vs-foot offset)."""
    mujoco.mj_resetData(m, d)
    for _ in range(int(6.0 / m.opt.timestep)):
        for k, v in cmd_fn(0.0, T, ank, hip, knee).items():
            d.ctrl[AID[k]] = v
        mujoco.mj_step(m, d)
    t0 = d.time
    while d.time - t0 < laps * T:
        for k, v in cmd_fn((d.time - t0) % T, T, ank, hip, knee).items():
            d.ctrl[AID[k]] = v
        mujoco.mj_step(m, d)
    # measured lap
    taus, margins, offs = [], [], []
    t0 = d.time
    while d.time - t0 < T:
        tt = (d.time - t0) % T
        for k, v in cmd_fn(tt, T, ank, hip, knee).items():
            d.ctrl[AID[k]] = v
        mujoco.mj_step(m, d)
        tau = float(d.qfrc_passive[DP])
        taus.append(tau)
        span = foot_span()
        if span:
            lo, hi = span
            cy = com_y()
            zmp_need = cy + tau / (MASS * G)
            margins.append(min(zmp_need - lo, hi - zmp_need))
            offs.append(cy - (lo + hi) / 2)
    tau_a = np.array(taus)
    return (float(np.abs(tau_a).mean()), float(np.min(margins)) if margins else -9,
            float(np.mean(offs)) if offs else 0.0, float(tau_a.mean()))


print(f"mass {MASS:.2f} kg, weight {MASS*G:.1f} N, "
      f"1 N.m of rig torque == {100/(MASS*G):.2f} cm of ZMP")

# ---------------- 1. standing: sweep the ankle trim ----------------
print("\n=== IDLE ankle trim sweep (looking for zero rig torque) ===")
print("   ank[rad]  |tau_rig| mean   tau_rig signed   min ZMP margin   CoM-foot offset")
best = None
for ank in np.arange(-0.20, 0.21, 0.04):
    a, mg, off, signed = evaluate(idle_cmd, 4.8, float(ank), 0.0, 0.0)
    flag = ""
    if best is None or a < best[1]:
        best = (float(ank), a, mg, off)
        flag = " <-"
    print(f"   {ank:+7.3f}  {a:12.2f}  {signed:+14.2f}  {mg:+14.3f}  {off:+14.3f}{flag}")
print(f"  best ankle trim {best[0]:+.3f} rad -> |tau_rig| {best[1]:.2f} N.m, "
      f"ZMP margin {best[2]:+.3f} m")

# refine around the best with a bisection on signed torque
lo, hi = best[0] - 0.05, best[0] + 0.05
for _ in range(14):
    mid = (lo + hi) / 2
    _, _, _, signed = evaluate(idle_cmd, 4.8, mid, 0.0, 0.0)
    if signed > 0:
        lo = mid
    else:
        hi = mid
ank_idle = (lo + hi) / 2
a, mg, off, signed = evaluate(idle_cmd, 4.8, ank_idle, 0.0, 0.0)
print(f"  REFINED idle ankle trim {ank_idle:+.4f} rad ({math.degrees(ank_idle):+.1f} deg)"
      f" -> |tau_rig| {a:.2f} N.m ({a/(MASS*G)*100:.1f} cm ZMP), margin {mg:+.3f} m")

# ---------------- 2. walking: 2-D trim (ankle + hip lean) ----------------
print("\n=== WALK trim search (ankle x hip lean) ===")
bw = None
for ank in np.arange(ank_idle - 0.10, ank_idle + 0.11, 0.05):
    row = []
    for hip in np.arange(-0.10, 0.11, 0.05):
        a, mg, off, signed = evaluate(walk_cmd, 1.8, float(ank), float(hip), 0.0)
        row.append(f"{a:5.1f}/{mg:+.2f}")
        if bw is None or a < bw[2]:
            bw = (float(ank), float(hip), a, mg)
    print(f"   ank {ank:+.3f}: " + "  ".join(row))
print(f"  best walk trim: ankle {bw[0]:+.3f}, hip {bw[1]:+.3f} -> "
      f"|tau_rig| {bw[2]:.2f} N.m ({bw[2]/(MASS*G)*100:.1f} cm ZMP), margin {bw[3]:+.3f} m")

out = dict(mass_kg=round(MASS, 2), zmp_cm_per_Nm=round(100 / (MASS * G), 3),
           idle_ankle_trim=round(float(ank_idle), 4),
           idle_rig_torque=round(a, 2),
           walk_ankle_trim=round(bw[0], 4), walk_hip_trim=round(bw[1], 4),
           walk_rig_torque=round(bw[2], 2), walk_zmp_margin=round(bw[3], 3))
with open(os.path.join(HERE, "balance_trim.json"), "w") as f:
    json.dump(out, f, indent=1)
print("\nwrote balance_trim.json")
