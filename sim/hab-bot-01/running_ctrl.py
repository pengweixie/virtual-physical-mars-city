# Can hab-bot-01 run? And should it?
#
# Walking and running are different problems. Walking keeps at least one foot
# down, so the linear inverted pendulum applies and the ZMP is steerable.
# Running has a FLIGHT phase: both feet off the ground, no support polygon, no
# ZMP to place. The relevant model becomes a spring-loaded inverted pendulum,
# and the control law is Raibert's decomposition:
#   1. hop height  <- energy injected during stance (leg thrust)
#   2. forward speed <- where the foot lands relative to the "neutral point"
#      x_np = v * t_stance / 2  (land there and speed is unchanged; land ahead
#      of it and you brake, behind it and you accelerate)
#   3. body attitude <- hip torque while the foot is on the ground
#
# Mars makes running EASIER in one way and HARDER in another, and the two are
# usually conflated:
#   easier: flight time for a given take-off speed scales as 1/g, so hops are
#           long and slow, giving the swing leg plenty of time to reposition
#   harder: propulsion is limited by friction, F_x <= mu*m*g. Weaker gravity
#           means a smaller normal force, so less traction and therefore a
#           smaller velocity increment per step. Mars accelerates slowly.
import io
import json
import math
import os
import mujoco
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
G, G_EARTH = 3.71, 9.81
L1 = L2 = 0.38
LEG = L1 + L2
FOOT_HEEL, FOOT_TOE = -0.08, 0.14
ANKLE_REST = 0.08
MU = 1.0                      # sole friction (as modeled in the MJCF)


# ===========================================================================
# PART 1 — analytic ledger (independent of whether the controller works)
# ===========================================================================
def gait_transition(g, L=0.84):
    """Walk->run transition at Froude = 0.5."""
    return math.sqrt(0.5 * g * L)


def flight_time(v_takeoff, g):
    return 2 * v_takeoff / g


def analytic_ledger(mass):
    out = {}
    print("=== PART 1: RUNNING PHYSICS ON MARS (analytic) ===")
    vt_m, vt_e = gait_transition(G), gait_transition(G_EARTH)
    out["v_walk_run_mars"] = round(vt_m, 3)
    out["v_walk_run_earth"] = round(vt_e, 3)
    print(f"  walk->run transition (Froude 0.5, leg 0.84 m):")
    print(f"    Mars  {vt_m:.2f} m/s      Earth {vt_e:.2f} m/s")
    print(f"    -> on Mars you must start running {vt_e/vt_m:.2f}x sooner in speed;")
    print(f"       the asset's governed 0.35 m/s is Froude "
          f"{0.35**2/(G*0.84):.3f}, deep in the walking regime")

    print(f"\n  friction-limited propulsion (mu = {MU}):")
    print("    t_stance   dv per step Mars   dv per step Earth   steps to 1 m/s (Mars)")
    prop = []
    for ts in (0.10, 0.15, 0.22, 0.30):
        dv_m, dv_e = MU * G * ts, MU * G_EARTH * ts
        n_steps = math.ceil(1.0 / dv_m)
        prop.append(dict(t_stance=ts, dv_mars=round(dv_m, 3),
                         dv_earth=round(dv_e, 3), steps_to_1ms=n_steps))
        print(f"    {ts:6.2f} s   {dv_m:15.2f} m/s   {dv_e:16.2f} m/s   {n_steps:19d}")
    out["propulsion"] = prop
    print("    (this is the ceiling on ACCELERATION, not on top speed: with no")
    print("     meaningful air drag, Mars can eventually go as fast — just later)")

    print(f"\n  flight phase for a given vertical take-off speed:")
    print("    v_takeoff   flight time Mars   flight time Earth   hop height Mars")
    fl = []
    for vz in (0.3, 0.5, 0.8):
        tm, te = flight_time(vz, G), flight_time(vz, G_EARTH)
        h = vz ** 2 / (2 * G)
        fl.append(dict(v_takeoff=vz, t_flight_mars=round(tm, 3),
                       t_flight_earth=round(te, 3), h_mars=round(h, 3)))
        print(f"    {vz:8.2f} m/s {tm:16.3f} s {te:18.3f} s {h:16.3f} m")
    out["flight"] = fl
    print(f"    -> Mars flight lasts {G_EARTH/G:.2f}x longer, so the swing leg has")
    print("       generous time to reach the next footstep; that part gets easier")

    # landing impact and the safety consequence
    print(f"\n  landing impact and the safety problem:")
    print("    v_run   momentum   force @50 ms contact   vs ISO 280 N limit")
    imp = []
    for v in (0.35, 0.6, 1.0, 1.5):
        p = mass * v
        f = p / 0.05
        imp.append(dict(v=v, momentum=round(p, 1), force_50ms=round(f),
                        over_iso=round(f / 280, 2)))
        print(f"    {v:5.2f}  {p:8.1f} N.s  {f:18.0f} N  {f/280:15.1f}x")
    out["impact"] = imp
    print("    -> at any running speed a 39.8 kg humanoid violates the")
    print("       biomechanical contact limit by a wide margin: running is only")
    print("       admissible where there are no people, whatever the gait can do")
    return out


# ===========================================================================
# PART 2 — Raibert running controller
# ===========================================================================
m = mujoco.MjModel.from_xml_path(os.path.join(HERE, "hab_bot_balance.xml"))
d = mujoco.MjData(m)
MASS = float(m.body_mass[1:].sum())
AID = {n: m.actuator("a_" + n).id for n in
       ["hip_L", "hip_R", "knee_L", "knee_R", "sh_L", "sh_R", "elb_L", "elb_R"]}
AID_ANK = {s: m.actuator("a_ank_" + s).id for s in "LR"}
QA = {n: m.joint(n).qposadr[0] for n in
      ["hip_L", "hip_R", "knee_L", "knee_R", "ank_L", "ank_R",
       "root_y", "root_z", "root_pitch"]}
DA = {n: m.joint(n).dofadr[0] for n in ["root_y", "root_z", "root_pitch"]}


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


def hip_world(s):
    b = m.body("thigh_" + s).id
    return d.xpos[b][1], d.xpos[b][2]


def ankle_world(s):
    b = m.body("foot_" + s).id
    return d.xpos[b][1], d.xpos[b][2]


def foot_down(s):
    for c in range(d.ncon):
        n1 = m.geom(d.contact[c].geom1).name or ""
        n2 = m.geom(d.contact[c].geom2).name or ""
        if f"foot_{s}_g" in (n1, n2):
            return True
    return False


def leg_ik(dy, dz):
    r = min(math.hypot(dy, dz), LEG - 0.012)
    c = max(-1.0, min(1.0, (r * r - L1 * L1 - L2 * L2) / (2 * L1 * L2)))
    knee = -math.acos(c)
    theta = math.atan2(dy, -dz)
    beta = math.atan2(L2 * math.sin(knee), L1 + L2 * math.cos(knee))
    return theta - beta, knee


class Runner:
    """Raibert-style planar hopper/runner with alternating legs."""

    def __init__(self, v_des=0.8, T_stance=0.18, T_flight=0.22,
                 leg_rest=0.66, thrust=0.075, k_v=0.22,
                 k_pitch=7.0, k_pitch_d=1.0):
        self.v_des = v_des
        self.T_stance, self.T_flight = T_stance, T_flight
        self.leg_rest = leg_rest        # nominal hip-to-ankle length
        self.thrust = thrust            # extra extension injected during stance
        self.k_v = k_v
        self.k_pitch, self.k_pitch_d = k_pitch, k_pitch_d
        self.phase = "stance"
        self.stance = "L"
        self.t_phase = 0.0
        self.steps = 0
        self.flight_seen = 0.0          # accumulated true flight time
        self.peak_z = 0.0

    def neutral_point(self, vel):
        """Raibert: land at v*t_stance/2 for steady speed; bias for control."""
        return vel * self.T_stance / 2 + self.k_v * (vel - self.v_des)

    def step(self, dt):
        com, vel = com_state()
        self.t_phase += dt
        sw = "R" if self.stance == "L" else "L"
        pitch = d.qpos[QA["root_pitch"]]
        pitch_d = d.qvel[DA["root_pitch"]]
        cp, sp = math.cos(-pitch), math.sin(-pitch)
        self.peak_z = max(self.peak_z, com[2])
        both_up = not foot_down("L") and not foot_down("R")
        if both_up:
            self.flight_seen += dt

        if self.phase == "stance":
            # ---- stance leg: thrust profile injects hop energy ----
            s = min(1.0, self.t_phase / self.T_stance)
            # compress early, extend late (a spring that is pushed at the right time)
            ext = self.thrust * math.sin(math.pi * s)
            ay, az = ankle_world(self.stance)
            hy, hz = hip_world(self.stance)
            tgt_dy = ay - hy
            tgt_dz = -(self.leg_rest + ext)
            h, k = leg_ik(cp * tgt_dy - sp * tgt_dz, sp * tgt_dy + cp * tgt_dz)
            h += self.k_pitch * pitch + self.k_pitch_d * pitch_d
            d.ctrl[AID["hip_" + self.stance]] = h
            d.ctrl[AID["knee_" + self.stance]] = k
            # ankle: mild torque only (running does not steer the ZMP)
            d.ctrl[AID_ANK[self.stance]] = float(
                np.clip(-MASS * G * 0.03 - 3.0 * d.qvel[m.joint("ank_" + self.stance).dofadr[0]], -12, 12))
            # ---- swing leg: tuck up out of the way ----
            hy2, hz2 = hip_world(sw)
            h2, k2 = leg_ik(0.02, -(self.leg_rest - 0.10))
            d.ctrl[AID["hip_" + sw]] = h2
            d.ctrl[AID["knee_" + sw]] = k2
            d.ctrl[AID_ANK[sw]] = 0.0
            if self.t_phase >= self.T_stance:
                self.phase = "flight"
                self.t_phase = 0.0
        else:
            # ---- flight: place the swing (soon-to-be stance) leg ----
            s = min(1.0, self.t_phase / self.T_flight)
            np_off = self.neutral_point(vel[1])
            hy2, hz2 = hip_world(sw)
            # target ankle: neutral point ahead of the hip, at touchdown height
            tgt_dy = np_off
            tgt_dz = -(self.leg_rest)
            h2, k2 = leg_ik(cp * tgt_dy - sp * tgt_dz, sp * tgt_dy + cp * tgt_dz)
            d.ctrl[AID["hip_" + sw]] = h2
            d.ctrl[AID["knee_" + sw]] = k2
            d.ctrl[AID_ANK[sw]] = 0.0
            # trailing leg retracts
            h1, k1 = leg_ik(-0.12, -(self.leg_rest - 0.12))
            d.ctrl[AID["hip_" + self.stance]] = h1 + self.k_pitch * pitch
            d.ctrl[AID["knee_" + self.stance]] = k1
            d.ctrl[AID_ANK[self.stance]] = 0.0
            # touchdown of the new leg ends flight
            if foot_down(sw) and self.t_phase > 0.3 * self.T_flight:
                self.stance = sw
                self.phase = "stance"
                self.t_phase = 0.0
                self.steps += 1
            elif self.t_phase > 2.5 * self.T_flight:
                # never landed: treat as a fall-through, let the sim decide
                self.stance = sw
                self.phase = "stance"
                self.t_phase = 0.0
                self.steps += 1
        # arms
        amp = 0.3
        ph = math.pi * (self.steps % 2)
        d.ctrl[AID["sh_L"]] = amp * math.cos(ph)
        d.ctrl[AID["sh_R"]] = -amp * math.cos(ph)
        d.ctrl[AID["elb_L"]] = d.ctrl[AID["elb_R"]] = 0.7


def fallen():
    com, _ = com_state()
    return com[2] < 0.45 or abs(d.qpos[QA["root_pitch"]]) > 0.8


def settle(z=0.66, seconds=3.5):
    """Stand, then crouch into the running posture.

    Commanding the crouched leg length straight from reset does not work: the
    robot has to travel 10 cm down while the ankle law is still catching it, and
    it folds. Two stages instead — hold the validated standing pose, then
    smoothstep the leg length down to the running crouch.
    """
    mujoco.mj_resetData(m, d)
    NOM = {"hip_L": 0.045, "hip_R": 0.045, "knee_L": -0.09, "knee_R": -0.09}
    t_stand, t_crouch = 1.5, seconds - 1.5
    z_stand = 2 * L1 * math.cos(0.045)          # leg length at the nominal pose
    n = int(seconds / m.opt.timestep)
    for i in range(n):
        t = i * m.opt.timestep
        pitch = d.qpos[QA["root_pitch"]]
        pitch_d = d.qvel[DA["root_pitch"]]
        cp, sp = math.cos(-pitch), math.sin(-pitch)
        com, vel = com_state()
        if t < t_stand:
            for j, v in NOM.items():
                d.ctrl[AID[j]] = v
        else:
            s = min(1.0, (t - t_stand) / t_crouch)
            ss = s * s * (3 - 2 * s)
            z_now = z_stand + (z - z_stand) * ss
            for side in "LR":
                ay, _ = ankle_world(side)
                hy, _ = hip_world(side)
                dy, dz = ay - hy, -z_now
                h, k = leg_ik(cp * dy - sp * dz, sp * dy + cp * dz)
                d.ctrl[AID["hip_" + side]] = h + 5.0 * pitch + 0.8 * pitch_d
                d.ctrl[AID["knee_" + side]] = k
        # capture-point ankle law throughout (torque ankles are never "off")
        ay = 0.5 * (ankle_world("L")[0] + ankle_world("R")[0])
        Tc = math.sqrt(max(0.3, com[2]) / G)
        xi = com[1] + vel[1] * Tc
        p_des = xi + 1.6 * (xi - (ay + 0.02)) + 0.1 * vel[1]
        p_sat = min(max(p_des, ay + FOOT_HEEL), ay + FOOT_TOE)
        tau = float(np.clip(-MASS * G * (p_sat - ay) / 2, -25, 25))
        for side in "LR":
            d.ctrl[AID_ANK[side]] = tau
        d.ctrl[AID["elb_L"]] = d.ctrl[AID["elb_R"]] = 0.45
        mujoco.mj_step(m, d)


def run_trial(v_des, T_stance, T_flight, thrust, duration=8.0):
    settle()
    r = Runner(v_des=v_des, T_stance=T_stance, T_flight=T_flight, thrust=thrust)
    y0 = com_state()[0][1]
    t0 = d.time
    while d.time - t0 < duration and not fallen():
        r.step(m.opt.timestep)
        mujoco.mj_step(m, d)
    T = d.time - t0
    dist = com_state()[0][1] - y0
    return dict(v_des=v_des, T_stance=T_stance, T_flight=T_flight, thrust=thrust,
                ok=bool(not fallen() and T > duration - 0.05),
                t=round(T, 2), dist=round(float(dist), 3),
                v_mean=round(float(dist / T), 3), steps=r.steps,
                duty=round(1 - r.flight_seen / T, 3) if T > 0 else None,
                flight_frac=round(r.flight_seen / T, 3) if T > 0 else None,
                peak_z=round(r.peak_z, 3))


if __name__ == "__main__":
    led = analytic_ledger(MASS)

    print("\n=== PART 2: RAIBERT RUNNER IN THE SIMULATOR ===")
    print("   a true run needs a flight fraction > 0 (both feet off the ground)")
    print("   v_des  T_st  T_fl  thrust   survived   v_mean   steps  flight%  peak z")
    rows = []
    for v_des, Tst, Tfl, thr in (
            (0.60, 0.20, 0.16, 0.05),
            (0.60, 0.18, 0.22, 0.075),
            (0.90, 0.16, 0.22, 0.09),
            (0.90, 0.14, 0.26, 0.10),
            (1.20, 0.14, 0.26, 0.10),
            (1.20, 0.12, 0.30, 0.11)):
        r = run_trial(v_des, Tst, Tfl, thr)
        rows.append(r)
        print(f"   {v_des:5.2f} {Tst:5.2f} {Tfl:5.2f} {thr:7.3f}   "
              f"{str(r['ok']):>8}   {r['v_mean']:6.3f} {r['steps']:6d} "
              f"{100*(r['flight_frac'] or 0):7.1f} {r['peak_z']:7.3f}")

    # A 70% flight fraction is not running, it is BOUNDING. Terrestrial running
    # sits near 20-40%. Try to find a low-flight gait, i.e. an actual run.
    print("\n   pushing for a LOW flight fraction (real running, not hopping):")
    print("   v_des  T_st  T_fl  thrust   survived   v_mean   flight%")
    for v_des, Tst, Tfl, thr in ((0.60, 0.30, 0.08, 0.030),
                                 (0.60, 0.34, 0.06, 0.022),
                                 (0.90, 0.28, 0.09, 0.035),
                                 (0.90, 0.32, 0.07, 0.028)):
        r = run_trial(v_des, Tst, Tfl, thr)
        rows.append(r)
        print(f"   {v_des:5.2f} {Tst:5.2f} {Tfl:5.2f} {thr:7.3f}   "
              f"{str(r['ok']):>8}   {r['v_mean']:6.3f} {100*(r['flight_frac'] or 0):8.1f}")

    # Earth comparison: is bounding a Mars artefact or a controller artefact?
    print("\n   same controller under Earth gravity (9.81):")
    m.opt.gravity[2] = -G_EARTH
    earth_rows = []
    for v_des, Tst, Tfl, thr in ((0.60, 0.18, 0.22, 0.075), (1.20, 0.12, 0.30, 0.11)):
        r = run_trial(v_des, Tst, Tfl, thr)
        earth_rows.append(r)
        print(f"   {v_des:5.2f} {Tst:5.2f} {Tfl:5.2f} {thr:7.3f}   "
              f"{str(r['ok']):>8}   {r['v_mean']:6.3f} {100*(r['flight_frac'] or 0):8.1f}")
    m.opt.gravity[2] = -G

    running = [r for r in rows if r["ok"] and (r["flight_frac"] or 0) > 0.05]
    print()
    if running:
        best = max(running, key=lambda r: r["v_mean"])
        print(f"  RAN: {best['v_mean']:.2f} m/s with {100*best['flight_frac']:.0f}% "
              f"flight fraction ({best['steps']} steps)")
    else:
        upright = [r for r in rows if r["ok"]]
        print("  did NOT achieve a sustained run with a real flight phase.")
        if upright:
            b = max(upright, key=lambda r: r["v_mean"])
            print(f"  best surviving trial: {b['v_mean']:.2f} m/s, flight fraction "
                  f"{100*(b['flight_frac'] or 0):.1f}% -> that is fast walking, not running")
        print("  the open-loop-thrust Raibert law here is not enough; a real runner")
        print("  needs series elasticity or explicit stance-energy regulation.")

    low_flight = [r for r in rows if r["ok"] and 0.05 < (r["flight_frac"] or 0) < 0.45]
    if low_flight:
        lf = max(low_flight, key=lambda r: r["v_mean"])
        print(f"  running-like gait (flight fraction under 45%): "
              f"{lf['v_mean']:.2f} m/s at {100*lf['flight_frac']:.0f}% flight")
    else:
        print("  every surviving airborne gait has >45% flight fraction: this")
        print("  controller bounds/hops rather than runs. On Mars that is arguably")
        print("  the right answer (Apollo crews switched to loping in 1/6 g), but")
        print("  it should not be called running.")
    out = dict(mass=MASS, analytic=led, trials=rows, earth_trials=earth_rows,
               ran=bool(running),
               best=(max(running, key=lambda r: r["v_mean"]) if running else None),
               low_flight_best=(max(low_flight, key=lambda r: r["v_mean"])
                                if low_flight else None),
               verdict=("sustained airborne gait achieved" if running else
                        "no sustained flight phase with this controller"))
    with io.open(os.path.join(HERE, "running_ledger.json"), "w",
                 encoding="utf-8") as f:
        json.dump(out, f, indent=1)
    print("\nwrote running_ledger.json")
