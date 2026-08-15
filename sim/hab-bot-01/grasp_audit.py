# The grasp round: the hand's 3 kg claim gets contact dynamics.
#
# L1 (thermal_budget.py section 6) said: mu 0.9 x 12 N x 3 contacts = 32.4 N
# available vs 11.7 N needed -> safety factor 2.90 (Mars) / 1.10 (Earth).
# Two things it never checked:
#   1. the CoM acceleration was a guess (0.39 m/s^2, "speed/step-period") -
#      the real hand of a walking biped sees servo jitter and touchdown jolts;
#   2. MOMENT loading. A tray gripped at its edge hangs its CoM 15 cm from
#      the grip line; gravity's torque must be reacted by a force couple
#      across the finger pads' 3 cm reach. L1's ledger is all forces, no
#      torques.
#
# This script: (A) harvest the real hand acceleration from the walking
# MuJoCo model, (B) the analytic moment audit, (C) MuJoCo contact runs:
# edge-pinch statics, then palm-carry under the recorded hand motion scaled
# until the tray slips - the measured safety factor, Mars and Earth.
import io
import json
import math
import os
import mujoco
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))

# ===========================================================================
# A. HAND ACCELERATION HARVEST (walk cycle, bake model, Mars g)
# ===========================================================================
print("=== A. HAND ACCELERATION, MEASURED ===")
m = mujoco.MjModel.from_xml_path(os.path.join(HERE, "hab_bot.xml"))
d = mujoco.MjData(m)
JN = ["hip_L", "hip_R", "knee_L", "knee_R", "ank_L", "ank_R",
      "sh_L", "sh_R", "elb_L", "elb_R"]
ACT = {n: m.actuator("a_" + n).id for n in JN}
A_HIP, A_ARM = 0.34, 0.28

def leg_walk(p):
    hip = A_HIP * math.cos(2 * math.pi * p)
    if p < 0.6:
        knee = -0.10 - 0.10 * math.sin(math.pi * p / 0.6)
    else:
        knee = -0.10 - 0.90 * math.sin(math.pi * (p - 0.6) / 0.4)
    return hip, knee, 0.10 * math.sin(2 * math.pi * p + 0.5)

def walk_cmd(t, T):
    ph = (t % T) / T
    pL, pR = ph, (ph + 0.5) % 1.0
    hL, kL, aL = leg_walk(pL)
    hR, kR, aR = leg_walk(pR)
    return {"hip_L": hL, "hip_R": hR, "knee_L": kL, "knee_R": kR,
            "ank_L": aL, "ank_R": aR,
            "sh_L": -A_ARM * math.cos(2 * math.pi * pL),
            "sh_R": -A_ARM * math.cos(2 * math.pi * pR),
            "elb_L": 0.45 + 0.10 * math.sin(2 * math.pi * pL),
            "elb_R": 0.45 + 0.10 * math.sin(2 * math.pi * pR)}

T_CYC = 1.8
mujoco.mj_resetData(m, d)
for _ in range(int(8.0 / m.opt.timestep)):          # settle (rig spring is slow)
    for n, v in walk_cmd(0.0, T_CYC).items():
        d.ctrl[ACT[n]] = v
    mujoco.mj_step(m, d)
t0 = d.time
while d.time - t0 < 3 * T_CYC:                       # warm to the limit cycle
    for n, v in walk_cmd(d.time - t0, T_CYC).items():
        d.ctrl[ACT[n]] = v
    mujoco.mj_step(m, d)

FB = m.body("farm_L").id
LOCAL = np.array([0.0, 0.0, -0.22])                  # distal forearm = hand point
traj, t0 = [], d.time
N_CYC = 4
while d.time - t0 < N_CYC * T_CYC:
    for n, v in walk_cmd(d.time - t0, T_CYC).items():
        d.ctrl[ACT[n]] = v
    mujoco.mj_step(m, d)
    p = d.xpos[FB] + d.xmat[FB].reshape(3, 3) @ LOCAL
    traj.append([d.time - t0, p[0], p[1], p[2]])
traj = np.array(traj)
dt = np.mean(np.diff(traj[:, 0]))
pos = traj[:, 1:4]
# 20 Hz moving-average prefilter, then central-difference acceleration.
# Edge-replicate padding + 'valid' - NOT convolve(...,'same'), whose implicit
# zero padding drags the last w samples toward zero (z 0.85 -> 0.43, y -4 m):
# that fake plunge then survives detrending, and the loop-blend compresses it
# into a 0.7 s, ~11 m/s^2 whip that hurls the tray. Two rig rebuilds were
# spent hunting a "degrading gait" that was a padding artifact.
w = max(1, int(round(1.0 / 20.0 / dt)))
kern = np.ones(w) / w
lp = w // 2
pad = np.pad(pos, ((lp, w - 1 - lp), (0, 0)), mode="edge")
pos_f = np.column_stack([np.convolve(pad[:, i], kern, "valid") for i in range(3)])
acc = np.gradient(np.gradient(pos_f, dt, axis=0), dt, axis=0)
acc = acc[5 * w:-5 * w]                              # trim filter edges
# The robot WALKS FORWARD while we record: the raw world trajectory sweeps
# ~2.4 m ahead over 4 cycles. For shaking the grasp rig we want only the
# oscillation about the moving mean - detrend each axis linearly, then
# loop-blend the last 10% onto the start so the playback wrap has no jump.
# (First attempt fed the raw trajectory in: the palm dragged the tray metres
# sideways and teleported at the wrap - 16 m of "drift" at scale 1, while
# huge scales "held" because the weld constraint simply lost the mocap.
# Non-monotonic sweep results are a rig smell, not physics.)
tt = traj[:, 0]
osc = pos_f.copy()
for i in range(3):
    fit = np.polyfit(tt, osc[:, i], 1)
    osc[:, i] -= np.polyval(fit, tt)
nb = int(0.10 * len(osc))
for j in range(nb):
    s = (j + 1) / nb
    wgt = s * s * (3 - 2 * s)
    osc[len(osc) - nb + j] = (osc[len(osc) - nb + j] * (1 - wgt) + osc[0] * wgt)

a_h = np.hypot(acc[:, 0], acc[:, 1])
a_v = np.abs(acc[:, 2])
a_h_pk, a_h_95 = float(a_h.max()), float(np.percentile(a_h, 95))
a_v_pk = float(a_v.max())
print(f"   {N_CYC} cycles at {1/dt:.0f} Hz, hand point on farm_L")
print(f"   horizontal accel: 95th pct {a_h_95:.2f} / peak {a_h_pk:.2f} m/s^2")
print(f"   vertical accel:   peak {a_v_pk:.2f} m/s^2")
print(f"   L1 guessed a smooth 0.39 m/s^2 - the measured peak is "
      f"{a_h_pk/0.39:.0f}x that (servo jitter + touchdown)")

# ===========================================================================
# B. THE MOMENT AUDIT (what L1 never wrote down)
# ===========================================================================
print("\n=== B. EDGE-PINCH MOMENT AUDIT ===")
G_MARS, G_EARTH = 3.71, 9.81
M_TRAY = 3.0
LEVER = 0.15            # 0.30 m tray gripped at its edge, CoM at centre
REACH = 0.03            # finger pad reach past the rim
F_FING = 12.0
M_g = M_TRAY * G_MARS * LEVER
M_avail = 2 * F_FING * (REACH * 2 / 3)   # two fingers, mean arm inside the reach
print(f"   gravity moment about the grip line: {M_TRAY}x{G_MARS}x{LEVER} "
      f"= {M_g:.2f} N*m")
print(f"   restoring couple from 2x12 N fingers over a {REACH*100:.0f} cm reach: "
      f"~{M_avail:.2f} N*m")
print(f"   -> moment safety factor {M_avail/M_g:.2f}. L1's force ledger said "
      f"2.90; the torque ledger says the pinch cannot even hold STATIC level.")
print(f"   (force closure is about not dropping; a tray also must not ROTATE)")

# re-audit L1's force factor with the measured acceleration
F_avail = 0.9 * F_FING * 3
F_need = M_TRAY * math.hypot(G_MARS, a_h_pk)
print(f"   L1 force factor re-done with measured accel: 32.4 / "
      f"{F_need:.1f} = {F_avail/F_need:.2f} (was 2.90 with the guessed accel)")

# ===========================================================================
# C. MUJOCO CONTACT RUNS
# ===========================================================================
GRASP_XML = """
<mujoco model="grasp">
  <option gravity="0 0 -{G}" timestep="0.002"/>
  <default>
    <geom friction="0.9 0.005 0.0001" solimp="0.95 0.99 0.001" solref="0.004 1"/>
  </default>
  <worldbody>
    <body name="anchor" mocap="true" pos="0 0 1.00"/>
    <body name="palm" pos="0 0 1.00">
      <freejoint/>
      <geom name="palm_g" type="box" size="0.05 {PY} 0.006" mass="0.3"/>
      {EXTRA}
      <body name="fingerA" pos="0.03 {FY} 0.045">
        <joint name="jA" type="slide" axis="0 0 1" range="-0.04 0.01" damping="2"/>
        <geom type="box" size="0.010 0.012 0.006" mass="0.02"/>
      </body>
      <body name="fingerB" pos="-0.03 {FY} 0.045">
        <joint name="jB" type="slide" axis="0 0 1" range="-0.04 0.01" damping="2"/>
        <geom type="box" size="0.010 0.012 0.006" mass="0.02"/>
      </body>
    </body>
    <body name="tray" pos="0 {TY} {TZ}">
      <freejoint/>
      <geom name="tray_g" type="box" size="0.10 0.15 0.0075" mass="3"/>
    </body>
  </worldbody>
  <equality><weld body1="anchor" body2="palm"/></equality>
  <actuator>
    <general joint="jA" gaintype="fixed" gainprm="12 0 0" biastype="none"/>
    <general joint="jB" gaintype="fixed" gainprm="12 0 0" biastype="none"/>
  </actuator>
</mujoco>
"""

def build(g, pinch):
    if pinch:
        # tray gripped at its rim, CoM hanging OUTBOARD, nothing under it -
        # L1's implicit configuration. Narrow palm so it cannot secretly act
        # as a second support (first attempt did exactly that: the tray tipped
        # 4 deg and landed on the palm plate's edge - a rig artifact, caught
        # because the analytic audit said it MUST tip).
        extra = ('<geom name="thumb" type="box" size="0.03 0.015 0.006" '
                 'pos="0 0.035 0.012"/>')
        xml = GRASP_XML.format(G=g, EXTRA=extra, PY="0.02", FY="0.035",
                               TY="0.185", TZ="1.0255")
    else:
        # palm carry: tray CoM centred on the palm, fingers pressing INSIDE the
        # support footprint so their 24 N loads the palm contact. (A first rig
        # put the fingers 4 cm outboard of the palm edge: their press and the
        # tray's weight then balanced across the edge like a see-saw - 0.96 vs
        # 1.06 N*m - and any vertical shake rocked the tray off. Static was
        # stable to 1.5 mm; only the shake exposed it. Where the fingers press
        # is as load-bearing a choice as how hard.)
        xml = GRASP_XML.format(G=g, EXTRA="", PY="0.05", FY="-0.03",
                               TY="0.0", TZ="1.0135")
    return mujoco.MjModel.from_xml_string(xml)

def run_case(g, pinch, scale, seconds):
    gm = build(g, pinch)
    gd = mujoco.MjData(gm)
    gd.ctrl[:] = -1.0                                # 12 N press per finger
    tray, palm = gm.body("tray").id, gm.body("palm").id
    # settle half a second before shaking
    for _ in range(250):
        mujoco.mj_step(gm, gd)
    rel0 = gd.xpos[tray] - gd.xpos[palm]
    # playback starts at zero phase and ramps in over 0.5 s - without both,
    # the first mocap sample teleports the palm ~10 cm in one 2 ms step and
    # the "slip" being measured is the rig's own infinite acceleration
    t_play, dt_s = 0.0, gm.opt.timestep
    for _ in range(int(seconds / dt_s)):
        t = t_play % (N_CYC * T_CYC)
        p = np.array([np.interp(t, tt, osc[:, i]) for i in range(3)]) - osc[0]
        ramp = min(1.0, t_play / 0.5)
        gd.mocap_pos[0] = np.array([0, 0, 1.0]) + scale * ramp * p
        mujoco.mj_step(gm, gd)
        t_play += dt_s
    rel = gd.xpos[tray] - gd.xpos[palm]
    drift = float(np.linalg.norm((rel - rel0)[:2]))
    dropped = bool((rel[2] - rel0[2]) < -0.05)
    # tray pitch angle from quaternion
    q = gd.xquat[tray]
    r = np.zeros(9)
    mujoco.mju_quat2Mat(r, q)
    tilt = float(math.degrees(math.acos(np.clip(r.reshape(3, 3)[2, 2], -1, 1))))
    return drift, dropped, tilt

print("\n=== C1. EDGE PINCH, STATIC (MuJoCo contact) ===")
for g, name in ((G_MARS, "Mars"), (G_EARTH, "Earth")):
    drift, dropped, tilt = run_case(g, pinch=True, scale=0.0, seconds=3.0)
    print(f"   {name:5s}: tray tilt {tilt:5.1f} deg, dropped={dropped} "
          f"-> {'FAILS' if dropped or tilt > 15 else 'holds'}")

print("\n=== C2. PALM CARRY UNDER THE RECORDED WALK, SCALE SWEEP ===")
mu, g = 0.9, G_MARS
n_press = 2 * F_FING
a_slip_pred = mu * (M_TRAY * g + n_press) / M_TRAY
print(f"   known-answer gate: slip should start near a_h = "
      f"mu(mg+F_fingers)/m = {a_slip_pred:.1f} m/s^2 "
      f"= scale ~{a_slip_pred/a_h_pk:.1f}x the recorded walk")
results = {}
for g, name in ((G_MARS, "Mars"), (G_EARTH, "Earth")):
    rows = []
    for scale in (1, 2, 4, 6, 8, 10, 12):
        drift, dropped, tilt = run_case(g, pinch=False, scale=scale,
                                        seconds=2 * N_CYC * T_CYC)
        ok = (not dropped) and drift < 0.02 and tilt < 10
        rows.append(dict(scale=scale, drift_cm=round(drift * 100, 2),
                         dropped=dropped, tilt_deg=round(tilt, 1), ok=ok))
        print(f"   {name:5s} x{scale:<2d}: drift {drift*100:5.2f} cm, "
              f"tilt {tilt:4.1f} deg, dropped={dropped} "
              f"{'OK' if ok else '<- SLIPS'}")
    holds = [r["scale"] for r in rows if r["ok"]]
    results[name] = dict(rows=rows, factor=max(holds) if holds else 0)
    print(f"   -> {name} measured carry factor: x{results[name]['factor']} "
          f"the real walking excitation")

out = dict(
    hand_accel=dict(dt_s=round(float(dt), 4), n_cycles=N_CYC,
                    a_h_p95=round(a_h_95, 2), a_h_peak=round(a_h_pk, 2),
                    a_v_peak=round(a_v_pk, 2), l1_guess=0.39),
    moment_audit=dict(lever_m=LEVER, reach_m=REACH, M_gravity=round(M_g, 2),
                      M_available=round(M_avail, 2),
                      factor=round(M_avail / M_g, 2), l1_force_factor=2.90,
                      l1_force_factor_measured_accel=round(F_avail / F_need, 2)),
    palm_carry=results,
    slip_gate_pred_ms2=round(a_slip_pred, 1))
with io.open(os.path.join(HERE, "grasp_ledger.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("\nwrote grasp_ledger.json")
