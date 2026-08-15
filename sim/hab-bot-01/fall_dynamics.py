# hab-bot-01 falls over. What then?
#
# The stepping controller's feasible region is patchy — 0.45 m/s scored 5/5 on
# perturbed starts but 0.30 and 0.60 both lost one run in five. So this machine
# WILL go down occasionally, and three questions have never been asked:
#
#   1. does it break itself?   (the visor is glass at head height)
#   2. does it hurt somebody?  (39.8 kg toppling is a different hazard from the
#      0.35 m/s walking contact the SSM ledger already covers)
#   3. can it get back up?     (otherwise every fall is a call-out)
#
# Mars changes all three, and in the same direction for once: a fall is an
# inverted pendulum released from rest, so it takes sqrt(L/g) longer, lands at
# sqrt(gL) slower, and delivers mgh less energy. Falling is the one place where
# low gravity is unambiguously good news.
import io
import json
import math
import os
import mujoco
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
G, G_EARTH = 3.71, 9.81
MOTOR_TAU_MAX = 150.0        # actuator force range from the MJCF

# The MJCF is loaded only for its mass properties; the fall itself is solved
# analytically (see section 1 for why the two MuJoCo attempts were abandoned).
m = mujoco.MjModel.from_xml_path(os.path.join(HERE, "hab_bot_balance.xml"))
d = mujoco.MjData(m)
MASS = float(m.body_mass[1:].sum())
AID = {n: m.actuator("a_" + n).id for n in
       ["hip_L", "hip_R", "knee_L", "knee_R", "sh_L", "sh_R", "elb_L", "elb_R"]}
AID_ANK = {s: m.actuator("a_ank_" + s).id for s in "LR"}
QA = {n: m.joint(n).qposadr[0] for n in ["root_y", "root_z", "root_pitch"]}
DA = {n: m.joint(n).dofadr[0] for n in ["root_y", "root_z", "root_pitch"]}
FOOT_HEEL, FOOT_TOE = -0.08, 0.14
L1 = L2 = 0.38


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


def body_speed(name):
    v6 = np.zeros(6)
    mujoco.mj_objectVelocity(m, d, mujoco.mjtObj.mjOBJ_BODY, m.body(name).id, v6, 0)
    return float(np.linalg.norm(v6[3:])), float(v6[5])


def ankle_world(s):
    b = m.body("foot_" + s).id
    return d.xpos[b][1], d.xpos[b][2]


# ===========================================================================
# 1. THE FALL — an inverted pendulum about the ankle, integrated
# ===========================================================================
# Two MuJoCo attempts were abandoned here, and both are worth recording:
#   (a) the full balance model cannot fall onto the floor at all. The pelvis's
#       parent body IS the world and the floor is a world geom, so MuJoCo's
#       default parent-child contact filter silently excludes torso-vs-floor.
#       The run measured 0 N of contact and a centre of mass at -0.44 m: the
#       robot fell straight through. Disabling the filter globally is worse —
#       thigh capsules then collide with the pelvis they hang from.
#   (b) a free-floating rod slides and rolls instead of pivoting about the foot.
# Toppling is a rigid-body rotation about the ankle with a closed-form energy
# solution, so that is what it gets. Use the model the physics asks for.
#
#   I*theta'' = m*g*d*sin(theta),  d = CoM height, I = inertia about the ankle
#   energy:  0.5*I*w^2 = m*g*d*(1 - cos(theta))
H_COM = 0.895            # CoM height standing
L_TOT = 1.65             # ankle to top of head
I_ANKLE = MASS * L_TOT ** 2 / 3      # slender-rod approximation about the foot


def topple(gravity, theta0=0.04):
    """Integrate the topple and return timing plus impact speeds."""
    th, w = theta0, 0.0
    dt = 1e-4
    t = 0.0
    k = MASS * gravity * H_COM / I_ANKLE
    while th < math.pi / 2:
        # RK4 on (theta, omega)
        def f(y):
            return (y[1], k * math.sin(y[0]))
        y = (th, w)
        k1 = f(y)
        k2 = f((y[0] + dt / 2 * k1[0], y[1] + dt / 2 * k1[1]))
        k3 = f((y[0] + dt / 2 * k2[0], y[1] + dt / 2 * k2[1]))
        k4 = f((y[0] + dt * k3[0], y[1] + dt * k3[1]))
        th += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])
        w += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
        t += dt
        if t > 10:
            break
    w_check = math.sqrt(2 * MASS * gravity * H_COM / I_ANKLE)   # energy solution
    return dict(gravity=gravity, land_s=round(t, 3),
                omega=round(w, 3), omega_energy=round(w_check, 3),
                v_com=round(w * H_COM, 2), v_head=round(w * L_TOT, 2),
                energy_J=round(MASS * gravity * H_COM))


print("=== 1. THE FALL (inverted pendulum about the ankle, RK4) ===")
print("   planet   topple time   omega   CoM speed   HEAD speed   energy")
falls = []
for gr, label in ((G, "Mars "), (G_EARTH, "Earth")):
    r = topple(gr)
    r["label"] = label
    falls.append(r)
    print(f"   {label} {r['land_s']:10.3f}s {r['omega']:7.2f} "
          f"{r['v_com']:10.2f} {r['v_head']:12.2f} {r['energy_J']:8d} J")
    assert abs(r["omega"] - r["omega_energy"]) < 0.02, "RK4 vs energy mismatch"
print("   (RK4 and the energy solution agree to 0.02 rad/s — integration checked)")
print(f"   the head lands {falls[0]['v_head']/falls[0]['v_com']:.2f}x faster than the")
print("   centre of mass: it sits at the far end of the lever, which is exactly")
print("   why the visor and not the hip is the part at risk")

mars_limp = next(f for f in falls if f["gravity"] == G)
earth_limp = next(f for f in falls if f["gravity"] == G_EARTH)

# ===========================================================================
# 2. ANALYTIC CROSS-CHECK — the inverted pendulum released from rest
# ===========================================================================
print("\n=== 2. ANALYTIC CROSS-CHECK ===")
H_COM = 0.895
for gr, name in ((G, "Mars"), (G_EARTH, "Earth")):
    # rigid pendulum of length H about the ankle, from near-vertical to ground
    t_fall = math.sqrt(H_COM / gr) * 2.0        # order-of-magnitude toppling time
    v_land = math.sqrt(2 * gr * H_COM)          # free-fall equivalent, upper bound
    E = MASS * gr * H_COM
    print(f"   {name:5s}: topple time ~{t_fall:.2f} s, impact speed <= "
          f"{v_land:.2f} m/s, potential energy {E:.0f} J")
print(f"   -> Mars gives {math.sqrt(G_EARTH/G):.2f}x longer to react and lands "
      f"{math.sqrt(G_EARTH/G):.2f}x slower;")
print(f"      impact ENERGY is {G_EARTH/G:.2f}x lower. Falling is the one place")
print("      where low gravity is unambiguously good news.")

# ===========================================================================
# 3. DOES IT BREAK ITSELF? — the visor is the fragile part
# ===========================================================================
print("\n=== 3. SELF-DAMAGE ===")
E_fall = MASS * G * H_COM
parts = [
    ("visor glass (head)", 0.004, 8.0, "chemically strengthened, 0.8 mm"),
    ("shell panel (hip)", 0.010, 40.0, "3 mm foam over composite"),
    ("elbow/forearm", 0.008, 25.0, "the part a braced fall lands on"),
]
print("   part                  crush depth   energy capacity   fall energy   verdict")
for name, depth, F_kN, note in parts:
    cap = F_kN * 1000 * depth * 0.5     # triangular crush absorption, J
    verdict = "survives" if cap > E_fall * 0.4 else "AT RISK"
    print(f"   {name:21s} {depth*1000:7.0f} mm {cap:15.0f} J {E_fall:12.0f} J   {verdict}")
print(f"   (a fall deposits {E_fall:.0f} J on Mars, {MASS*G_EARTH*H_COM:.0f} J on Earth)")
print(f"   head impact speed {mars_limp['v_head']:.2f} m/s (Mars) vs "
      f"{earth_limp['v_head']:.2f} m/s (Earth)")
print("   -> bracing is what keeps the visor off the floor: the forearm has 100 J")
print("      of crush capacity, the visor 16 J against a 132 J fall")

# ===========================================================================
# 4. DOES IT HURT ANYONE? — a topple is not a walking contact
# ===========================================================================
print("\n=== 4. HAZARD TO A BYSTANDER ===")
# ISO/TS 15066 transient limits, and the energy-density criterion
F_HEAD, F_CHEST = 130.0, 280.0
v_tip = mars_limp["v_head"]
# effective mass of a toppling body about the ankle: I/(r^2) ~ m/3 for a rod
m_eff = MASS / 3
for dt_c, shell in ((0.020, "rigid"), (0.050, "3 mm foam"), (0.120, "15 mm skin")):
    F = m_eff * v_tip / dt_c
    print(f"   toppling onto a person, {shell:11s} contact {dt_c*1000:3.0f} ms -> "
          f"{F:6.0f} N  ({F/F_CHEST:.1f}x chest limit, {F/F_HEAD:.1f}x head limit)")
print(f"   effective mass {m_eff:.1f} kg (rod about the ankle), tip speed "
      f"{v_tip:.2f} m/s")
print("   -> a fall is a worse hazard than any walking contact the SSM ledger")
print("      covers, and it cannot be prevented by speed governing alone. The")
print("      mitigation is the 2.40 m separation: outside it, a topple cannot reach.")
topple_reach = 1.65
print(f"   topple reach {topple_reach:.2f} m < SSM separation 2.40 m -> "
      f"margin {2.40-topple_reach:.2f} m")

# ===========================================================================
# 5. CAN IT GET UP? — static torque demand
# ===========================================================================
print("\n=== 5. SELF-RIGHTING ===")
# prone push-up: arms lift the upper body; worst case is the shoulder moment
# with the CoM at mid-torso, arm reach 0.5 m
print("   phase                     required torque   available   verdict")
phases = [
    ("prone -> arms extended", "shoulder", MASS * 0.45 * G * 0.30, 55.0),
    ("kneel -> squat", "knee", MASS * 0.6 * G * 0.25, MOTOR_TAU_MAX),
    ("squat -> stand", "hip", MASS * 0.7 * G * 0.28, MOTOR_TAU_MAX),
]
ok_all = True
rise = []
for name, joint, need, avail in phases:
    ok = need < avail
    ok_all &= ok
    rise.append(dict(phase=name, joint=joint, need=round(need, 1), avail=avail, ok=ok))
    print(f"   {name:25s} {need:10.1f} N.m {avail:11.1f} N.m   "
          f"{'OK' if ok else 'INSUFFICIENT'}")
print(f"   self-righting on Mars: {'possible' if ok_all else 'NOT possible'}")
earth_need = [p["need"] * G_EARTH / G for p in rise]
earth_ok = all(n < a for n, a in zip(earth_need, [p["avail"] for p in rise]))
print(f"   same joints on Earth would need "
      f"{', '.join(f'{n:.0f}' for n in earth_need)} N.m -> "
      f"{'still possible' if earth_ok else 'NOT possible without bigger actuators'}")

out = dict(mass=MASS, falls=falls,
           analytic=dict(topple_time_mars=round(math.sqrt(H_COM / G) * 2, 2),
                         topple_time_earth=round(math.sqrt(H_COM / G_EARTH) * 2, 2),
                         energy_mars=round(MASS * G * H_COM),
                         energy_earth=round(MASS * G_EARTH * H_COM)),
           bystander=dict(m_eff=round(m_eff, 1), v_tip=v_tip,
                          topple_reach_m=topple_reach, ssm_separation_m=2.40),
           self_right=dict(phases=rise, mars_ok=bool(ok_all), earth_ok=bool(earth_ok)))
with io.open(os.path.join(HERE, "fall_ledger.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("\nwrote fall_ledger.json")
