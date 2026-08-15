# Can hab-bot-01 actually stand up on Mars? Capture-point balance, and how much
# of a shove it survives.
#
# The gait bake ran on a planarizing rig whose pitch spring was quietly holding
# the robot up (measured: 55 N.m standing = a 37 cm ZMP shift against a 10 cm
# foot). That model can produce pretty joint curves but cannot answer "does it
# balance". This one can: flat feet, free pitch, torque-controlled ankles, and a
# real feedback law. If the law is wrong, it falls over.
#
# Physics: linear inverted pendulum. xdd_com = (g/z_c)(x_com - x_zmp).
#   time constant  T_c = sqrt(z_c/g)
#   capture point  xi = x_com + xd_com * T_c   <- step here and you stop dead
# Mars makes T_c LONGER (weaker g), which is the whole story for balance here.
import io
import json
import math
import os
import mujoco
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
m = mujoco.MjModel.from_xml_path(os.path.join(HERE, "hab_bot_balance.xml"))
d = mujoco.MjData(m)
G = 3.71
G_EARTH = 9.81
MASS = float(m.body_mass[1:].sum())

POS_J = ["hip_L", "hip_R", "knee_L", "knee_R", "sh_L", "sh_R", "elb_L", "elb_R"]
AID = {n: m.actuator("a_" + n).id for n in POS_J}
AID_ANK = {s: m.actuator("a_ank_" + s).id for s in "LR"}
QADR = {n: m.joint(n).qposadr[0] for n in POS_J + ["ank_L", "ank_R", "root_y", "root_z", "root_pitch"]}
PELVIS = m.body("pelvis").id

# nominal posture: slight knee bend, thigh pitched to put the foot under the CoM
NOM = {"hip_L": 0.045, "hip_R": 0.045, "knee_L": -0.09, "knee_R": -0.09,
       "sh_L": 0.0, "sh_R": 0.0, "elb_L": 0.40, "elb_R": 0.40}

FOOT_HEEL, FOOT_TOE = -0.08, 0.14      # sole edges relative to the ankle joint


def com_state():
    """CoM position and velocity (world), plus its height above the soles."""
    mass = m.body_mass[1:, None]
    tot = m.body_mass[1:].sum()
    pos = np.sum(mass * d.xipos[1:], axis=0) / tot
    # body linear velocity of each body's CoM
    vel = np.zeros(3)
    v6 = np.zeros(6)
    for b in range(1, m.nbody):
        mujoco.mj_objectVelocity(m, d, mujoco.mjtObj.mjOBJ_BODY, b, v6, 0)
        vel += m.body_mass[b] * v6[3:]
    vel /= tot
    return pos, vel


def ankle_world_y():
    return np.mean([d.xpos[m.body(f).id][1] for f in ("foot_L", "foot_R")])


def support_edges():
    ay = ankle_world_y()
    return ay + FOOT_HEEL, ay + FOOT_TOE


def balance_step(x_ref, k_xi=1.6, k_damp=0.10):
    """Capture-point ankle strategy. Returns (zmp_cmd, tau_per_ankle, xi)."""
    com, vel = com_state()
    z_c = max(0.3, com[2])
    Tc = math.sqrt(z_c / G)
    xi = com[1] + vel[1] * Tc                       # capture point
    lo, hi = support_edges()
    # desired ZMP: push the capture point back toward the reference. Gain > 1 is
    # required for stability of the CP dynamics (xi_dot = (xi - p)/Tc).
    p_des = xi + k_xi * (xi - x_ref) + k_damp * vel[1]
    p_sat = min(max(p_des, lo), hi)                 # feet cannot lie
    fz = MASS * G                                   # quasi-static vertical load
    tau_total = -fz * (p_sat - ankle_world_y())     # ankle torque realizing ZMP
    tau = tau_total / 2.0
    tau = float(np.clip(tau, -25, 25))
    for s in "LR":
        d.ctrl[AID_ANK[s]] = tau
    return p_des, p_sat, tau, xi, Tc


def hold_posture():
    for j, v in NOM.items():
        d.ctrl[AID[j]] = v


def settle(seconds=4.0, x_ref=None, balance=True):
    if x_ref is None:
        x_ref = ankle_world_y() + 0.02
    for _ in range(int(seconds / m.opt.timestep)):
        hold_posture()
        if balance:
            balance_step(x_ref)
        mujoco.mj_step(m, d)
    return x_ref


def fallen():
    com, _ = com_state()
    return com[2] < 0.55 or abs(d.qpos[QADR["root_pitch"]]) > 0.6


# ================= 1. does it stand at all? =================
print(f"mass {MASS:.2f} kg | Mars g {G} | T_c = sqrt(z_c/g)")
mujoco.mj_resetData(m, d)
x_ref = settle(6.0)
com, vel = com_state()
Tc = math.sqrt(com[2] / G)
print("\n=== STANDING (flat feet, free pitch, capture-point ankle strategy) ===")
print(f"  after 6 s: pitch {d.qpos[QADR['root_pitch']]:+.4f} rad, "
      f"CoM z {com[2]:.3f} m, CoM drift y {com[1]-x_ref:+.4f} m")
print(f"  STANDS = {not fallen()}")
print(f"  T_c Mars  {Tc:.3f} s   (Earth twin {math.sqrt(com[2]/G_EARTH):.3f} s, "
      f"{Tc/math.sqrt(com[2]/G_EARTH):.2f}x longer)")
lo, hi = support_edges()
tau_max_phys = MASS * G * max(hi - ankle_world_y(), ankle_world_y() - lo)
print(f"  ankle-strategy ceiling: F_z*d_toe = {MASS*G:.1f} N * {hi-ankle_world_y():.2f} m "
      f"= {tau_max_phys:.1f} N.m  (beyond this the foot rolls and it MUST step)")

# ================= 2. how hard a shove survives? =================
print("\n=== PUSH RECOVERY (horizontal impulse at the chest) ===")
print("   impulse[N.s]  dv[m/s]   peak CP excursion   peak ankle tau   result")
results = []
for imp in [2.0, 4.0, 6.0, 8.0, 10.0, 11.0, 12.0, 13.0, 14.0, 16.0, 20.0]:
    mujoco.mj_resetData(m, d)
    xr = settle(5.0)
    # apply impulse over 50 ms at the torso
    dur = 0.05
    force = imp / dur
    peak_xi, peak_tau = 0.0, 0.0
    t0 = d.time
    ok = True
    while d.time - t0 < 4.0:
        hold_posture()
        if d.time - t0 < dur:
            d.xfrc_applied[PELVIS] = [0, force, 0, 0, 0, 0]
        else:
            d.xfrc_applied[PELVIS] = [0, 0, 0, 0, 0, 0]
        _, _, tau, xi, _ = balance_step(xr)
        mujoco.mj_step(m, d)
        peak_xi = max(peak_xi, abs(xi - xr))
        peak_tau = max(peak_tau, abs(tau * 2))
        if fallen():
            ok = False
            break
    dv = imp / MASS
    verdict = "recovered" if ok and not fallen() else "FELL"
    results.append(dict(impulse=imp, dv=round(dv, 3), peak_cp=round(peak_xi, 3),
                        peak_tau=round(peak_tau, 1), ok=ok))
    print(f"   {imp:10.1f}  {dv:7.3f}   {peak_xi:15.3f}   {peak_tau:14.1f}   {verdict}")

recovered = [r for r in results if r["ok"]]
max_imp = max([r["impulse"] for r in recovered], default=0)
print(f"  max recoverable impulse (ankle strategy only, no stepping): "
      f"{max_imp:.1f} N.s = {max_imp/MASS:.2f} m/s of CoM velocity")

# ================= 3. capture-point step length requirement =================
print("\n=== CAPTURE POINT vs WALKING SPEED (why Mars needs longer steps) ===")
print("   v[m/s]   CP offset Mars   CP offset Earth   inside foot? (0.14 m toe)")
z_c = 0.83
Tc_m, Tc_e = math.sqrt(z_c / G), math.sqrt(z_c / G_EARTH)
cp_rows = []
for v in [0.2, 0.4, 0.55, 0.75, 1.0]:
    cp_m, cp_e = v * Tc_m, v * Tc_e
    cp_rows.append(dict(v=v, cp_mars=round(cp_m, 3), cp_earth=round(cp_e, 3)))
    print(f"   {v:5.2f}   {cp_m:14.3f}   {cp_e:15.3f}   "
          f"{'yes' if cp_m < 0.14 else 'NO -> must step'}")
v_ankle_limit = 0.14 / Tc_m
print(f"  ankle strategy alone stops the robot up to v = {v_ankle_limit:.2f} m/s on Mars "
      f"({0.14/Tc_e:.2f} m/s on Earth)")
print(f"  -> above that the robot must take a capture step; at the asset's patrol "
      f"speed 0.55 m/s the CP sits {0.55*Tc_m:.3f} m ahead, i.e. "
      f"{0.55*Tc_m/0.14:.1f}x the foot's toe margin")

# ================= 4. stopping distance from patrol speed =================
# The robot cannot stop by ankle alone above 0.30 m/s, so an emergency stop is a
# capture step: plant the foot at the capture point, then bleed the rest. This is
# what the safety ledger has to use — a 1.65 m humanoid does not stop like a cart.
print("\n=== EMERGENCY STOP FROM PATROL SPEED (capture-step model) ===")
T_STEP = 0.9                                  # one step = half the 1.8 s cycle
stop_rows = []
for v in [0.30, 0.45, 0.55, 0.75]:
    cp = v * Tc_m
    # phase 1: react + finish the swing already in progress (worst case a full
    # step period); phase 2: the capture step itself decelerates the CoM
    d_react = v * T_STEP * 0.5                # mid-swing average during reaction
    d_capture = cp                            # foot must land at the CP
    d_tot = d_react + d_capture
    t_tot = T_STEP * 0.5 + Tc_m               # swing remainder + CP settle
    stop_rows.append(dict(v=v, cp=round(cp, 3), d_stop=round(d_tot, 3),
                          t_stop=round(t_tot, 3)))
    print(f"   v {v:.2f} m/s -> capture point {cp:.3f} m, "
          f"stop distance {d_tot:.3f} m in {t_tot:.2f} s")
v_patrol = 0.55
d_stop_patrol = next(r["d_stop"] for r in stop_rows if r["v"] == v_patrol)
print(f"  at the asset's patrol speed {v_patrol} m/s the mechanical stop distance "
      f"alone is {d_stop_patrol:.2f} m (before adding sensing latency)")

out = dict(mass_kg=round(MASS, 2), g=G, z_c=round(float(com[2]), 3),
           Tc_mars=round(Tc, 3), Tc_earth=round(math.sqrt(com[2] / G_EARTH), 3),
           ankle_torque_ceiling_Nm=round(tau_max_phys, 1),
           stands=bool(not fallen()),
           push_recovery=results, max_impulse_Ns=max_imp,
           max_dv_ms=round(max_imp / MASS, 3),
           capture_point=cp_rows,
           v_ankle_limit_mars=round(v_ankle_limit, 3),
           v_ankle_limit_earth=round(0.14 / Tc_e, 3),
           step_period_s=T_STEP, stopping=stop_rows,
           d_stop_patrol_m=d_stop_patrol)
with io.open(os.path.join(HERE, "balance_ledger.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("\nwrote balance_ledger.json")
