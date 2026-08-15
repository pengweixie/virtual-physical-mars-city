# hab-bot-01: walking by TAKING STEPS, not just leaning on its ankles.
#
# balance_ctrl.py deliberately forbade stepping, which made the ankle strategy
# the only recovery mechanism and produced a hard 0.30 m/s ceiling (the speed at
# which the capture point leaves the toe). That is the conservative answer: real
# bipeds step. This controller does, so the ceiling it reports is the real one.
#
# Control law (planar, sagittal):
#   * DCM / capture point:  xi = x_com + Tc * xd_com,  Tc = sqrt(z_c/g)
#     DCM dynamics are xi_dot = (xi - p)/Tc, unstable and therefore the thing
#     that must be steered. Placing the next foot sets p for the next step.
#   * Footstep:  x_land = xi_predicted + (v_des*T_step)/2 + k_v*(xd - v_des)*Tc
#     i.e. land ahead of the capture point by half a stride to keep moving, plus
#     a velocity-error term that regulates speed.
#   * Stance ankle: torque realizing a ZMP that drives the DCM toward the desired
#     velocity, saturated to the sole (feet cannot lie).
#   * Stance hip: hip strategy — keeps the torso upright (the planar model has a
#     free pitch DoF, so somebody has to hold the trunk up).
#   * Swing leg: two-link IK to a raised-arc trajectory onto the footstep.
import io
import json
import math
import os
import mujoco
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
G = 3.71
G_EARTH = 9.81
L1 = L2 = 0.38                       # thigh, shank
FOOT_HEEL, FOOT_TOE = -0.08, 0.14    # sole edges relative to the ankle joint
ANKLE_REST = 0.08                    # ankle-joint height with the sole flat
# NOTE: the legs are 0.38+0.38 = 0.76 m, so the hip-to-ankle command MUST stay
# under that or the IK saturates into a straight, uncushioned leg. 0.70 keeps a
# working knee bend (this cost the first run every single trial).


def load(gravity=G):
    m = mujoco.MjModel.from_xml_path(os.path.join(HERE, "hab_bot_balance.xml"))
    m.opt.gravity[2] = -gravity
    return m, mujoco.MjData(m)


m, d = load()
MASS = float(m.body_mass[1:].sum())
AID = {n: m.actuator("a_" + n).id for n in
       ["hip_L", "hip_R", "knee_L", "knee_R", "sh_L", "sh_R", "elb_L", "elb_R"]}
AID_ANK = {s: m.actuator("a_ank_" + s).id for s in "LR"}
QA = {n: m.joint(n).qposadr[0] for n in
      ["hip_L", "hip_R", "knee_L", "knee_R", "ank_L", "ank_R",
       "root_y", "root_z", "root_pitch"]}
DA = {n: m.joint(n).dofadr[0] for n in ["root_y", "root_z", "root_pitch"]}
HIP_OFF = {"L": -0.10, "R": 0.10}    # lateral hip offset (unused in sagittal)


def com_state():
    mass = m.body_mass[1:, None]
    tot = m.body_mass[1:].sum()
    pos = np.sum(mass * d.xipos[1:], axis=0) / tot
    vel = np.zeros(3)
    v6 = np.zeros(6)
    for b in range(1, m.nbody):
        mujoco.mj_objectVelocity(m, d, mujoco.mjtObj.mjOBJ_BODY, b, v6, 0)
        vel += m.body_mass[b] * v6[3:]
    return pos, vel / tot


def hip_world(side):
    """world (y,z) of the hip joint centre."""
    b = m.body("thigh_" + side).id
    return d.xpos[b][1], d.xpos[b][2]


def ankle_world(side):
    b = m.body("foot_" + side).id
    return d.xpos[b][1], d.xpos[b][2]


def leg_ik(dy, dz):
    """Target ankle position relative to the hip, in the PELVIS frame.
    Returns (hip_angle, knee_angle) with MuJoCo sign conventions:
    +hip swings the thigh forward (+y); knee is negative (bends backward)."""
    r = math.hypot(dy, dz)
    r = min(r, L1 + L2 - 0.01)
    c = (r * r - L1 * L1 - L2 * L2) / (2 * L1 * L2)
    c = max(-1.0, min(1.0, c))
    knee = -math.acos(c)                       # negative = backward bend
    theta = math.atan2(dy, -dz)                # direction hip -> ankle
    beta = math.atan2(L2 * math.sin(knee), L1 + L2 * math.cos(knee))
    return theta - beta, knee


class Stepper:
    def __init__(self, v_des=0.4, T_step=0.75, z_c=0.70, swing_h=0.05,
                 k_v=0.55, k_pitch=6.0, k_pitch_d=0.9, k_zmp=1.4):
        self.v_des = v_des
        self.T_step = T_step
        self.z_c = z_c
        self.swing_h = swing_h
        self.k_v = k_v
        self.k_pitch, self.k_pitch_d = k_pitch, k_pitch_d
        self.k_zmp = k_zmp
        self.stance = "L"
        self.t_phase = 0.0
        self.swing_start = None
        self.foot_target = None
        self.steps = 0
        self.Tc = math.sqrt(z_c / G)

    def plan_footstep(self, com, vel):
        """Where the swing foot must land, from the DCM.

        Key sign: landing ON the capture point brings you to a STOP. To keep
        moving at v_des the steady-state DCM offset from the stance point is
        v_des*Tc (from xi_dot = (xi - p)/Tc), so the foot goes that far BEHIND
        the predicted capture point. The first version added half a stride in
        front instead, which is a braking step — the robot marched in place at
        0.05 m/s no matter what speed was commanded.
        """
        Tc = self.Tc
        xi = com[1] + Tc * vel[1]
        t_left = max(0.0, self.T_step - self.t_phase)
        p_stance = ankle_world(self.stance)[0]
        xi_td = p_stance + (xi - p_stance) * math.exp(t_left / Tc)
        # steady-state placement, plus a velocity-error correction in the same
        # sense (too slow -> step shorter -> CoM overtakes the foot -> accelerate)
        return xi_td - self.v_des * Tc + self.k_v * (vel[1] - self.v_des) * Tc

    def desired_zmp(self, com, vel):
        """ZMP that steers the DCM toward the commanded velocity."""
        Tc = self.Tc
        xi = com[1] + Tc * vel[1]
        # xi_dot = (xi - p)/Tc; want xi_dot = v_des  ->  p = xi - Tc*v_des
        p = xi - Tc * self.v_des
        # extra damping on velocity error keeps it from running away
        p += self.k_zmp * (vel[1] - self.v_des) * Tc * 0.25
        return p

    def step(self, dt):
        com, vel = com_state()
        self.t_phase += dt
        sw = "R" if self.stance == "L" else "L"

        if self.swing_start is None:
            self.swing_start = ankle_world(sw)
            self.foot_target = self.plan_footstep(com, vel)
        else:
            # keep re-planning early in the swing (reactive to pushes)
            if self.t_phase < 0.6 * self.T_step:
                self.foot_target = self.plan_footstep(com, vel)

        pitch = d.qpos[QA["root_pitch"]]
        pitch_d = d.qvel[DA["root_pitch"]]

        # ---------- stance leg: hold CoM height, hold the trunk up ----------
        hy, hz = hip_world(self.stance)
        ay, az = ankle_world(self.stance)
        # target: hip directly above the desired CoM path at height z_c
        tgt_dy, tgt_dz = ay - hy, -self.z_c
        # rotate world offset into the pelvis frame (pelvis pitches freely)
        cp, sp = math.cos(-pitch), math.sin(-pitch)
        py = cp * tgt_dy - sp * tgt_dz
        pz = sp * tgt_dy + cp * tgt_dz
        h_st, k_st = leg_ik(py, pz)
        # hip strategy: bias the stance hip to right the torso
        h_st += self.k_pitch * pitch + self.k_pitch_d * pitch_d
        d.ctrl[AID["hip_" + self.stance]] = h_st
        d.ctrl[AID["knee_" + self.stance]] = k_st

        # ---------- stance ankle: torque realizing the desired ZMP ----------
        p_des = self.desired_zmp(com, vel)
        lo, hi = ay + FOOT_HEEL, ay + FOOT_TOE
        p_sat = min(max(p_des, lo), hi)
        fz = MASS * G
        tau = float(np.clip(-fz * (p_sat - ay), -25, 25))
        d.ctrl[AID_ANK[self.stance]] = tau

        # ---------- swing leg: arc onto the planned footstep ----------
        s = min(1.0, self.t_phase / self.T_step)
        ss = s * s * (3 - 2 * s)
        y_sw = self.swing_start[0] + (self.foot_target - self.swing_start[0]) * ss
        z_sw = ANKLE_REST + self.swing_h * math.sin(math.pi * s)  # ankle height
        hy2, hz2 = hip_world(sw)
        tgt_dy, tgt_dz = y_sw - hy2, z_sw - hz2
        py = cp * tgt_dy - sp * tgt_dz
        pz = sp * tgt_dy + cp * tgt_dz
        h_sw, k_sw = leg_ik(py, pz)
        d.ctrl[AID["hip_" + sw]] = h_sw
        d.ctrl[AID["knee_" + sw]] = k_sw
        # swing ankle: keep the sole level with the ground
        d.ctrl[AID_ANK[sw]] = float(np.clip(-2.0 * (d.qpos[QA["ank_" + sw]]
                                                    + pitch + h_sw + k_sw), -6, 6))

        # arms: counter-swing for angular momentum
        amp = 0.25 * min(1.0, abs(self.v_des) / 0.6)
        ph = math.pi * s + (0 if self.stance == "L" else math.pi)
        d.ctrl[AID["sh_L"]] = amp * math.cos(ph)
        d.ctrl[AID["sh_R"]] = -amp * math.cos(ph)
        d.ctrl[AID["elb_L"]] = 0.45
        d.ctrl[AID["elb_R"]] = 0.45

        # ---------- touchdown / phase switch ----------
        touched = False
        if s > 0.55:
            for c in range(d.ncon):
                g1 = m.geom(d.contact[c].geom1).name or ""
                g2 = m.geom(d.contact[c].geom2).name or ""
                if f"foot_{sw}_g" in (g1, g2):
                    touched = True
                    break
        if touched or s >= 1.0:
            self.stance = sw
            self.t_phase = 0.0
            self.swing_start = None
            self.steps += 1


def fallen():
    com, _ = com_state()
    return com[2] < 0.5 or abs(d.qpos[QA["root_pitch"]]) > 0.7


def settle(z_c=0.70, seconds=3.0):
    """Stand on two feet before walking.

    The ankles are TORQUE actuators, so commanding zero here means a limp ankle
    and the robot folds up (it did, every time, before this was fixed). Standing
    needs the same capture-point ankle law the walk uses.
    """
    mujoco.mj_resetData(m, d)
    NOM = {"hip_L": 0.045, "hip_R": 0.045, "knee_L": -0.09, "knee_R": -0.09,
           "sh_L": 0.0, "sh_R": 0.0, "elb_L": 0.40, "elb_R": 0.40}
    for _ in range(int(seconds / m.opt.timestep)):
        for j, v in NOM.items():
            d.ctrl[AID[j]] = v
        com, vel = com_state()
        Tc = math.sqrt(max(0.3, com[2]) / G)
        xi = com[1] + vel[1] * Tc
        ay = 0.5 * (ankle_world("L")[0] + ankle_world("R")[0])
        x_ref = ay + 0.02
        p_des = xi + 1.6 * (xi - x_ref) + 0.10 * vel[1]
        p_sat = min(max(p_des, ay + FOOT_HEEL), ay + FOOT_TOE)
        tau = float(np.clip(-MASS * G * (p_sat - ay) / 2.0, -25, 25))
        for s2 in "LR":
            d.ctrl[AID_ANK[s2]] = tau
        mujoco.mj_step(m, d)


def walk_trial(v_des, T_step=0.75, duration=12.0, push=None, verbose=False):
    """Returns dict with survived, distance, mean speed, steps, cost."""
    settle()
    st = Stepper(v_des=v_des, T_step=T_step)
    y0 = com_state()[0][1]
    t0 = d.time
    E = 0.0
    pushed = False
    peak_pitch = 0.0
    while d.time - t0 < duration:
        if push and not pushed and d.time - t0 > 4.0:
            # 50 ms impulse at the pelvis
            if d.time - t0 < 4.05:
                d.xfrc_applied[m.body("pelvis").id] = [0, push / 0.05, 0, 0, 0, 0]
            else:
                d.xfrc_applied[m.body("pelvis").id] = np.zeros(6)
                pushed = True
        st.step(m.opt.timestep)
        mujoco.mj_step(m, d)
        for j, a in AID.items():
            E += abs(d.actuator_force[a] * d.qvel[m.joint(j).dofadr[0]]) * m.opt.timestep
        peak_pitch = max(peak_pitch, abs(d.qpos[QA["root_pitch"]]))
        if fallen():
            return dict(v_des=v_des, ok=False, dist=float(com_state()[0][1] - y0),
                        t=float(d.time - t0), steps=st.steps, v_mean=0.0,
                        peak_pitch=round(peak_pitch, 3))
    dist = float(com_state()[0][1] - y0)
    T = d.time - t0
    return dict(v_des=v_des, ok=True, dist=round(dist, 3), t=round(T, 2),
                steps=st.steps, v_mean=round(dist / T, 3),
                E_mech=round(E / T, 1), peak_pitch=round(peak_pitch, 3))


if __name__ == "__main__":
    print(f"mass {MASS:.2f} kg | Tc(Mars) {math.sqrt(0.70/G):.3f} s "
          f"| Tc(Earth) {math.sqrt(0.70/G_EARTH):.3f} s")

    # Real walkers raise cadence with speed, so step time is a design variable,
    # not a constant. Sweep both and report the feasible region.
    print("\n=== FEASIBLE REGION: commanded speed x step time ===")
    V = (0.30, 0.45, 0.60, 0.75, 0.90)
    TS = (0.45, 0.55, 0.65, 0.75, 0.90)
    grid, best = {}, None
    hdr = "   v_des / T_step " + "".join(f"{t:>8.2f}" for t in TS)
    print(hdr)
    for v in V:
        cells = []
        for Ts in TS:
            r = walk_trial(v, Ts, duration=12.0)
            grid[(v, Ts)] = r
            if r["ok"] and r["v_mean"] > 0.6 * v:
                cells.append(f"{r['v_mean']:8.2f}")
                if best is None or r["v_mean"] > best[2]:
                    best = (v, Ts, r["v_mean"])
            elif r["ok"]:
                cells.append(f"{r['v_mean']:7.2f}~")     # survived but sluggish
            else:
                cells.append("    fell")
        print(f"   {v:5.2f}          " + "".join(cells))
    print("  (number = achieved m/s; '~' = stayed up but did not track command)")
    if best:
        print(f"  best tracked walk: {best[2]:.2f} m/s at v_des {best[0]:.2f}, "
              f"T_step {best[1]:.2f} s")

    # ---- robustness: is a fast cell reproducible, or was it luck? ----
    # The feasible region is patchy, so a single surviving cell proves little.
    # Re-run the candidate speeds with small initial perturbations and count.
    print("\n=== REPRODUCIBILITY (5 perturbed starts per candidate) ===")
    print("   v_des  T_step   survived/5   mean achieved")
    robust = []
    for v, Ts in ((0.30, 0.55), (0.45, 0.55), (0.60, 0.55), (0.75, 0.45)):
        okn, vs = 0, []
        for k in range(5):
            settle()
            # perturbation: a small forward shove before walking starts
            d.qvel[DA["root_y"]] += (k - 2) * 0.02
            st = Stepper(v_des=v, T_step=Ts)
            y0 = com_state()[0][1]
            t0 = d.time
            while d.time - t0 < 10.0 and not fallen():
                st.step(m.opt.timestep)
                mujoco.mj_step(m, d)
            if not fallen():
                okn += 1
                vs.append((com_state()[0][1] - y0) / (d.time - t0))
        mv = round(float(np.mean(vs)), 3) if vs else 0.0
        robust.append(dict(v_des=v, T_step=Ts, survived=okn, v_mean=mv))
        print(f"   {v:5.2f}  {Ts:5.2f}   {okn:8d}/5   {mv:13.3f}")
    solid = [r for r in robust if r["survived"] == 5]
    v_robust = max((r["v_des"] for r in solid), default=0.30)
    print(f"  robust ceiling (5/5 with perturbations): {v_robust:.2f} m/s")

    # ---- push recovery WITH stepping, at a ROBUST operating point ----
    print("\n=== PUSH RECOVERY WHILE WALKING (stepping allowed) ===")
    print("   measured at the robust operating point, not the fastest cell —")
    print("   pushing a robot that is already at its limit only proves it is at its limit")
    v_walk, Ts_walk = v_robust, 0.55
    push_rows = []
    for imp in (5, 8, 12, 16, 20, 25, 30):
        r = walk_trial(v_walk, Ts_walk, duration=10.0, push=float(imp))
        push_rows.append(dict(impulse=imp, ok=r["ok"], peak_pitch=r["peak_pitch"]))
        print(f"   {imp:5.1f} N.s ({imp/MASS:5.3f} m/s)  "
              f"{'recovered' if r['ok'] else 'FELL'}   peak|pitch| {r['peak_pitch']:.3f}")
    surv = [p["impulse"] for p in push_rows if p["ok"]]
    max_imp = max(surv) if surv else 0
    print(f"  max recoverable impulse WITH stepping: {max_imp} N.s "
          f"({max_imp/MASS:.2f} m/s) vs 8 N.s ankle-only -> "
          f"{max_imp/8:.1f}x better")

    # ---- Earth comparison at the same controller settings ----
    print("\n=== SAME CONTROLLER ON EARTH (g = 9.81) ===")
    m.opt.gravity[2] = -G_EARTH
    earth = walk_trial(v_walk, Ts_walk, duration=10.0)
    m.opt.gravity[2] = -G
    print(f"   commanded {v_walk:.2f} m/s, T_step {Ts_walk:.2f} s -> "
          f"{'walked ' + str(earth['v_mean']) + ' m/s' if earth['ok'] else 'fell'} "
          f"(Mars Tc {math.sqrt(0.70/G):.3f} s vs Earth {math.sqrt(0.70/G_EARTH):.3f} s)")

    out = dict(mass=MASS, Tc_mars=round(math.sqrt(0.70/G), 3),
               Tc_earth=round(math.sqrt(0.70/G_EARTH), 3),
               grid={f"{k[0]}|{k[1]}": v for k, v in grid.items()},
               best=dict(v_des=best[0], T_step=best[1], v_mean=best[2]) if best else None,
               push_stepping=push_rows, max_impulse_stepping_Ns=max_imp,
               robustness=robust, v_robust=v_robust,
               push_operating_point=dict(v=v_walk, T_step=Ts_walk),
               earth_trial=earth)
    with io.open(os.path.join(HERE, "stepping_ledger.json"), "w",
                 encoding="utf-8") as f:
        json.dump(out, f, indent=1)
    print("\nwrote stepping_ledger.json")
