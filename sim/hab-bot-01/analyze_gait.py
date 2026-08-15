# hab-bot-01 dynamics ledger: mass budget, true electrical power from joint
# torques, ZMP feasibility of the baked gait, and a 3 kg-tray loaded walk.
#
# Why this exists: the info card previously quoted "80 W walking" as an order-of-
# magnitude guess. MuJoCo already integrates tau and omega every step — the real
# number was sitting there unclaimed. Same for stability: the bake used a
# planarizing pitch spring (a gait-trainer boom), which HIDES whether the gait is
# actually balanceable. Here we compute the ZMP the robot would need and check it
# against the real support polygon, so the answer is honest either way.
import json
import math
import os
import mujoco
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
m = mujoco.MjModel.from_xml_path(os.path.join(HERE, "hab_bot.xml"))
d = mujoco.MjData(m)
G_MARS = 3.71

# ---- actuator/electrical model (BLDC + harmonic drive, service-robot class) ----
# CRITICAL: copper loss must be evaluated at the MOTOR, not at the joint output.
# A 44 N.m joint torque behind a 100:1 harmonic drive is 0.44 N.m at the rotor —
# billing I^2R on the joint torque overstates dissipation by N^2 (~10^4) and was
# the bug that produced a 1.3 kW walking robot on the first pass.
#   tau_motor = tau_joint / (N * eta)    omega_motor = omega_joint * N
#   P_elec = |tau_joint * omega_joint| / eta      (mech through the gearbox)
#          + (tau_joint/(N*eta*Kt))^2 * R         (copper, at the rotor)
#          + P_idle                               (encoder + driver quiescent)
# Negative mechanical work is billed at full rate too (dumped in the driver,
# no regeneration) — conservative for a battery-powered service robot.
ACT = {
    # joint         N[:1]  Kt[N·m/A]  R[ohm]  eta   Pidle[W]
    "hip":   dict(N=100, Kt=0.075, R=0.62, eta=0.75, Pidle=1.1),
    "knee":  dict(N=100, Kt=0.075, R=0.62, eta=0.75, Pidle=1.1),
    "ank":   dict(N=80,  Kt=0.052, R=1.15, eta=0.72, Pidle=0.8),
    "sh":    dict(N=60,  Kt=0.042, R=1.80, eta=0.72, Pidle=0.6),
    "elb":   dict(N=60,  Kt=0.038, R=2.10, eta=0.72, Pidle=0.5),
}
# Non-actuator continuous loads (from the asset's own subsystem list)
P_ELECTRONICS = dict(edge_compute=11.0, cis_camera=1.4, lidar=2.6, radio=6.0,
                     visor_screen=1.2, mcu_sensors=2.4)

JN = ["hip_L", "hip_R", "knee_L", "knee_R", "ank_L", "ank_R",
      "sh_L", "sh_R", "elb_L", "elb_R"]
QADR = {n: m.joint(n).qposadr[0] for n in JN + ["root_y", "root_z", "root_pitch"]}
DADR = {n: m.joint(n).dofadr[0] for n in JN + ["root_y", "root_z", "root_pitch"]}
AID = {n: m.actuator("a_" + n).id for n in JN}


def act_of(j):
    return ACT[j.rsplit("_", 1)[0]]


# ---------------- 1. mass budget ----------------
def mass_budget():
    groups = {"torso+pelvis": ["pelvis"], "head": [], "legs": [], "arms": []}
    rows, total = [], 0.0
    for bid in range(1, m.nbody):
        name = mujoco.mj_id2name(m, mujoco.mjtObj.mjOBJ_BODY, bid)
        mass = m.body_mass[bid]
        total += mass
        rows.append((name, mass))
    # geoms carry the mass in this model; body_mass is the rolled-up value
    print("=== MASS BUDGET ===")
    for n, mass in rows:
        print(f"    {n:10s} {mass:6.2f} kg")
    print(f"    {'TOTAL':10s} {total:6.2f} kg   (weight on Mars "
          f"{total*G_MARS:.0f} N, on Earth {total*9.81:.0f} N)")
    return total


# ---------------- command generators (same as run_gait.py) ----------------
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


def idle_cmd(t, T):
    s = math.sin(2 * math.pi * t / T)
    c = math.sin(2 * math.pi * t / T + 1.1)
    return {"hip_L": 0.020 * s, "hip_R": 0.020 * s,
            "knee_L": -0.075 + 0.030 * s, "knee_R": -0.075 + 0.030 * s,
            "ank_L": 0.012 * c, "ank_R": 0.012 * c,
            "sh_L": 0.05 * s, "sh_R": 0.05 * s,
            "elb_L": 0.40 + 0.04 * s, "elb_R": 0.40 + 0.04 * s}


def apply(cmd):
    for n, v in cmd.items():
        d.ctrl[AID[n]] = v


# ---------------- 2. run a cycle, harvest power + ZMP ----------------
def run_cycle(cmd_fn, T, payload_kg=0.0, label=""):
    """Settle, warm up onto the limit cycle, then instrument one full cycle."""
    mujoco.mj_resetData(m, d)
    # payload: extra mass in the hands, modeled as added mass on both forearms
    if payload_kg:
        for b in ("farm_L", "farm_R"):
            bid = m.body(b).id
            m.body_mass[bid] += payload_kg / 2
    for _ in range(int(8.0 / m.opt.timestep)):
        apply(cmd_fn(0.0, T))
        mujoco.mj_step(m, d)
    t0 = d.time
    while d.time - t0 < 3 * T:
        apply(cmd_fn((d.time - t0) % T, T))
        mujoco.mj_step(m, d)

    # ---- instrumented lap ----
    t0 = d.time
    n_steps = 0
    E_joint = {j: 0.0 for j in JN}          # electrical energy per joint [J]
    P_peak = {j: 0.0 for j in JN}
    tau_peak = {j: 0.0 for j in JN}
    track_err = {j: 0.0 for j in JN}
    zmp_x_list, zmp_y_list, foot_lo, foot_hi = [], [], [], []
    spring_tau = []                          # the rig's cheat torque, measured
    y0 = d.qpos[QADR["root_y"]]

    while d.time - t0 < T:
        tt = (d.time - t0) % T
        cmd = cmd_fn(tt, T)
        apply(cmd)
        mujoco.mj_step(m, d)
        n_steps += 1
        dt = m.opt.timestep

        for j in JN:
            tau = float(d.actuator_force[AID[j]])
            om = float(d.qvel[DADR[j]])
            a = act_of(j)
            p_mech = abs(tau * om) / a["eta"]
            i_motor = tau / (a["N"] * a["eta"] * a["Kt"])       # rotor current
            p_cu = i_motor ** 2 * a["R"]
            p = p_mech + p_cu + a["Pidle"]
            E_joint[j] += p * dt
            P_peak[j] = max(P_peak[j], p)
            tau_peak[j] = max(tau_peak[j], abs(tau))
            track_err[j] = max(track_err[j], abs(d.qpos[QADR[j]] - cmd[j]))

        # ---- ZMP feasibility, done honestly ----
        # Computing the CoP from MuJoCo's own contact forces is a TAUTOLOGY: the
        # CoP is by definition inside the contact convex hull, so "100% inside"
        # proves nothing. The real question is whether this motion is balanceable
        # WITHOUT the planarizing rig. The rig's pitch spring is exactly the
        # external torque a free robot would not have, so convert it to the ZMP
        # offset it is worth:  d_zmp = tau_rig / (M * g)  — if that exceeds the
        # foot half-length, the gait tips over once the boom is removed.
        tau_rig = float(d.qfrc_passive[DADR["root_pitch"]])
        spring_tau.append(abs(tau_rig))
        # true support: which feet are loaded, and their fore/aft edges
        ys = []
        for fb in ("foot_L", "foot_R"):
            bid = m.body(fb).id
            if d.xpos[bid][2] < 0.10:
                ys.append(d.xpos[bid][1])
        if ys:
            # CoM ground projection (the quasi-static ZMP) relative to support
            com_y = float(np.sum(m.body_mass[1:, None] * d.xipos[1:], axis=0)[1]
                          / m.body_mass[1:].sum())
            zmp_needed = com_y + tau_rig / (mass_total * G_MARS)
            zmp_y_list.append(zmp_needed)
            foot_lo.append(min(ys) - 0.08)     # heel edge
            foot_hi.append(max(ys) + 0.11)     # toe edge

    dist = d.qpos[QADR["root_y"]] - y0
    E_act = sum(E_joint.values())
    P_act = E_act / T
    P_elec_other = sum(P_ELECTRONICS.values())
    P_tot = P_act + P_elec_other

    print(f"\n=== {label}  (T={T}s, payload {payload_kg} kg) ===")
    print(f"  travel {dist:+.3f} m  ->  {dist/T:+.3f} m/s")
    print("  per-joint: mean W / peak W / peak |tau| N.m / max track err rad")
    for j in JN:
        print(f"    {j:7s} {E_joint[j]/T:6.2f} {P_peak[j]:8.1f} "
              f"{tau_peak[j]:8.1f} {track_err[j]:8.3f}")
    print(f"  actuators total   {P_act:6.1f} W")
    print(f"  electronics total {P_elec_other:6.1f} W  ({P_ELECTRONICS})")
    print(f"  ROBOT TOTAL       {P_tot:6.1f} W")
    if dist > 0.05:
        cot = P_act / (mass_total * G_MARS * (dist / T))
        print(f"  cost of transport (actuators only) CoT = {cot:.2f}")
    st = np.array(spring_tau)
    d_zmp = st / (mass_total * G_MARS)
    print(f"  RIG CHEAT (pitch-spring torque): mean {st.mean():.1f} N.m, "
          f"peak {st.max():.1f} N.m")
    print(f"    -> worth a ZMP shift of mean {d_zmp.mean()*100:.1f} cm, "
          f"peak {d_zmp.max()*100:.1f} cm  (foot half-length 10 cm)")
    inside = None
    if zmp_y_list:
        zy = np.array(zmp_y_list)
        lo, hi = np.array(foot_lo), np.array(foot_hi)
        mb, mf = zy - lo, hi - zy
        inside = float(np.mean((mb > 0) & (mf > 0)) * 100)
        print(f"  ZMP NEEDED (CoM proj + rig torque / weight), vs support polygon:")
        print(f"    min margin heel {mb.min():+.3f} m / toe {mf.min():+.3f} m"
              f"  -> inside support {inside:.0f}% of the cycle "
              f"{'OK' if inside > 99 else '<-- WOULD TIP without the boom'}")

    if payload_kg:                                # restore model masses
        for b in ("farm_L", "farm_R"):
            m.body_mass[m.body(b).id] -= payload_kg / 2

    return dict(P_act=round(P_act, 1), P_tot=round(P_tot, 1), dist=round(dist, 3),
                W_joint={k: round(v / T, 2) for k, v in E_joint.items()},
                tau_peak={k: round(v, 1) for k, v in tau_peak.items()},
                track_err={k: round(v, 3) for k, v in track_err.items()},
                rig_torque_mean=round(float(st.mean()), 1),
                rig_torque_peak=round(float(st.max()), 1),
                zmp_shift_mean_cm=round(float(d_zmp.mean()) * 100, 1),
                zmp_shift_peak_cm=round(float(d_zmp.max()) * 100, 1),
                zmp_inside_pct=inside)


mass_total = mass_budget()

res = {}
res["walk"] = run_cycle(walk_cmd, 1.8, 0.0, "WALK")
res["idle"] = run_cycle(idle_cmd, 4.8, 0.0, "IDLE (standing)")
res["walk_tray"] = run_cycle(walk_cmd, 1.8, 3.0, "WALK + 3 kg tray")

# ---------------- 3. shift ledger ----------------
print("\n=== SHIFT / BATTERY LEDGER ===")
duty = 0.6
P_shift = duty * res["walk"]["P_tot"] + (1 - duty) * res["idle"]["P_tot"]
print(f"  duty 60% walk / 40% idle -> mean {P_shift:.1f} W")
for hours in (2, 4):
    print(f"  {hours} h shift needs {P_shift*hours:.0f} Wh")
CAP = 260
print(f"  260 Wh pack -> endurance {CAP/P_shift:.2f} h at this duty")
print(f"  pack mass at 200 Wh/kg: {CAP/200:.2f} kg "
      f"({CAP/200/mass_total*100:.1f}% of robot mass)")

out = dict(mass_kg=round(mass_total, 2), g=G_MARS,
           actuator_model=ACT, electronics_W=P_ELECTRONICS,
           results={k: {kk: vv for kk, vv in v.items()} for k, v in res.items()},
           shift=dict(duty=duty, P_mean_W=round(P_shift, 1),
                      endurance_h=round(CAP / P_shift, 2), pack_Wh=CAP))
with open(os.path.join(HERE, "dynamics_ledger.json"), "w") as f:
    json.dump(out, f, indent=1, default=float)
print("\nwrote dynamics_ledger.json")
