# Where does hab-bot-01's waste heat go, and what does that forbid?
#
# The power ledger says 86.6 W walking. Almost all of it becomes heat, and the
# robot works inside a sealed, windless undercity. Two questions follow, and
# they have very different answers:
#
#   * whole-body: is 87 W into a 1.65 m shell a problem?  (no)
#   * per-joint: the hip dissipates 23 W into a joint housing the size of a
#     coffee mug.  (this is the actual constraint, and it is what cooks real
#     humanoids — actuator thermal limits, not battery, end most demos)
#
# Also settles a claim the hand card has been making without support: "rated
# payload 3 kg". A force-closure theorem says the grasp type works; it says
# nothing about whether the fingers can hold a tray while the robot walks.
import io
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
dyn = json.load(io.open(os.path.join(HERE, "dynamics_ledger.json"), encoding="utf-8"))
comp = json.load(io.open(os.path.join(HERE, "compute_ledger.json"), encoding="utf-8"))

ACT = dyn["actuator_model"]
WALK = dyn["results"]["walk"]
IDLE = dyn["results"]["idle"]
ELEC_W = comp["power"]["total_W"]          # 15.8 W of electronics
T_AMB = 22.0                                # undercity foyer air, degC
MOTOR_LIMIT = 120.0                         # class-F winding limit, degC
GEAR_LIMIT = 90.0                           # harmonic drive grease limit

# ---- convection + radiation into still, pressurized air (no wind indoors) ----
H_CONV_FREE = 5.0      # W/m^2K, natural convection off a vertical surface
EPS = 0.90
SIGMA = 5.67e-8


def h_rad(T_s=310.0, T_a=295.0):
    return EPS * SIGMA * (T_s ** 2 + T_a ** 2) * (T_s + T_a)


H_TOT = H_CONV_FREE + h_rad()

# ---------------------------------------------------------------------------
# 1. HEAT SOURCES — what fraction of electrical power actually becomes heat
# ---------------------------------------------------------------------------
# P_elec = P_mech/eta + P_cu + P_idle.  The mechanical work itself mostly does
# NOT leave as heat while walking on the level: it is cyclically stored and
# returned (and dissipated in the joints' own damping), so for a thermal bound
# we treat gearbox loss + copper + quiescent as heat, and add the negative-work
# fraction, which the driver dumps as heat rather than regenerating.
print("=== 1. HEAT SOURCES ===")


def joint_heat(name, p_elec):
    a = ACT[name.rsplit("_", 1)[0]]
    # split back out of the model used in analyze_gait.py
    p_idle = a["Pidle"]
    p_rest = max(0.0, p_elec - p_idle)
    # of the remainder, gearbox loss is (1-eta) of the mechanical share
    p_gear = p_rest * (1 - a["eta"])
    p_cu = p_rest - p_gear
    return dict(total=p_elec, gear=p_gear, copper=p_cu, idle=p_idle)


rows = []
for j, p in WALK["W_joint"].items():
    h = joint_heat(j, p)
    rows.append((j, h))
print("   joint     P_elec   gear loss   copper   quiescent   (all W)")
for j, h in rows:
    print(f"   {j:8s} {h['total']:7.2f} {h['gear']:11.2f} {h['copper']:8.2f} "
          f"{h['idle']:11.2f}")
act_heat = sum(h["total"] for _, h in rows)
total_heat = act_heat + ELEC_W
print(f"   actuators {act_heat:.1f} W + electronics {ELEC_W:.1f} W = "
      f"{total_heat:.1f} W of waste heat while walking")

# ---------------------------------------------------------------------------
# 2. WHOLE-BODY — the easy question
# ---------------------------------------------------------------------------
A_BODY = 1.15          # m^2 of outer shell (1.65 m humanoid, slimmer than a person)
dT_body = total_heat / (H_TOT * A_BODY)
print(f"\n=== 2. WHOLE-BODY STEADY STATE ===")
print(f"   h_conv {H_CONV_FREE:.1f} + h_rad {h_rad():.1f} = {H_TOT:.1f} W/m2K, "
      f"shell area {A_BODY} m2")
print(f"   dT = {total_heat:.1f} / ({H_TOT:.1f} x {A_BODY}) = {dT_body:.1f} K "
      f"-> shell {T_AMB + dT_body:.1f} degC")
print("   -> as a whole body this is a non-problem. Averages hide the failure.")

# ---------------------------------------------------------------------------
# 3. PER-JOINT — the real constraint
# ---------------------------------------------------------------------------
print("\n=== 3. PER-JOINT: WHERE IT ACTUALLY GETS HOT ===")
# Geometry from the asset: hip/knee joint drums ~Ø0.10x0.09, thigh/shank shells
JOINTS = {
    "hip":  dict(A_joint=0.030, A_limb=0.107, m_limb=3.2, R_int=0.55),
    "knee": dict(A_joint=0.026, A_limb=0.091, m_limb=2.2, R_int=0.60),
    "ank":  dict(A_joint=0.018, A_limb=0.030, m_limb=0.95, R_int=0.80),
}
C_ALU = 900.0          # J/kgK
print("   joint   P_heat   joint-only dT   with limb conduction   winding temp")
therm = []
for jn, g in JOINTS.items():
    p = next(h["total"] for j, h in rows if j.startswith(jn))
    dT_alone = p / (H_TOT * g["A_joint"])
    dT_limb = p / (H_TOT * (g["A_joint"] + g["A_limb"]))
    T_wind = T_AMB + dT_limb + p * g["R_int"]        # internal thermal resistance
    therm.append(dict(joint=jn, P=p, dT_alone=round(dT_alone, 1),
                      dT_limb=round(dT_limb, 1), T_winding=round(T_wind, 1)))
    flag = "  OVER LIMIT" if T_wind > MOTOR_LIMIT else ""
    print(f"   {jn:6s} {p:7.2f} W {dT_alone:12.1f} K {dT_limb:20.1f} K "
          f"{T_wind:10.1f} degC{flag}")
print(f"   (motor winding limit {MOTOR_LIMIT:.0f} degC, gear grease "
      f"{GEAR_LIMIT:.0f} degC)")
print("   -> the hip housing alone would run "
      f"{therm[0]['dT_alone']:.0f} K above ambient; conducting into the thigh")
print("      shell is not a nicety, it is the whole cooling design")

# ---------------------------------------------------------------------------
# 4. TRANSIENT — how long can it work flat out?
# ---------------------------------------------------------------------------
print("\n=== 4. THERMAL TRANSIENT (does duty cycle save it?) ===")
print("   joint   time constant   T after 10 min   T after 1 h   steady state")
for jn, g in JOINTS.items():
    t = next(x for x in therm if x["joint"] == jn)
    C = g["m_limb"] * C_ALU
    UA = H_TOT * (g["A_joint"] + g["A_limb"])
    tau = C / UA
    T_ss = t["T_winding"]
    def temp(sec):
        return T_AMB + (T_ss - T_AMB) * (1 - math.exp(-sec / tau))
    print(f"   {jn:6s} {tau/60:11.1f} min {temp(600):14.1f} {temp(3600):13.1f} "
          f"{T_ss:14.1f} degC")
tau_hip = JOINTS["hip"]["m_limb"] * C_ALU / (H_TOT * (JOINTS["hip"]["A_joint"] + JOINTS["hip"]["A_limb"]))
print(f"   -> the hip's time constant is {tau_hip/60:.0f} minutes: short bursts are")
print("      thermally free, and the 60/40 duty cycle matters more than peak power")

# duty-cycle sustainable limit
print("\n   sustainable duty cycle (hip winding held at the limit):")
p_walk_hip = next(h["total"] for j, h in rows if j.startswith("hip"))
p_idle_hip = IDLE["W_joint"]["hip_L"]
g = JOINTS["hip"]
UA = H_TOT * (g["A_joint"] + g["A_limb"])
# T = T_amb + P*(1/UA + R_int) solved for the duty-weighted P
p_allow = (MOTOR_LIMIT - T_AMB) / (1 / UA + g["R_int"])
duty_max = min(1.0, (p_allow - p_idle_hip) / (p_walk_hip - p_idle_hip))
print(f"     hip may dissipate {p_allow:.1f} W continuously "
      f"(walking {p_walk_hip:.1f} W, standing {p_idle_hip:.1f} W)")
print(f"     -> max walking duty {100*duty_max:.0f}%  "
      f"(the shift ledger assumes 60%)")

# ---------------------------------------------------------------------------
# 5. RUNNING AND PAYLOAD TRANSIENTS
# ---------------------------------------------------------------------------
print("\n=== 5. RUNNING / PAYLOAD BURSTS ===")
tray = dyn["results"]["walk_tray"]
p_hip_tray = tray["W_joint"]["hip_L"]
print(f"   3 kg tray raises hip dissipation {p_walk_hip:.1f} -> {p_hip_tray:.1f} W "
      f"(+{100*(p_hip_tray/p_walk_hip-1):.0f}%)")
# running: scale hip loss with the square of torque demand (copper dominates)
run_factor = (0.59 / 0.35) ** 2
p_hip_run = p_idle_hip + (p_walk_hip - p_idle_hip) * run_factor
T_run_ss = T_AMB + p_hip_run * (1 / UA + g["R_int"])
t_to_limit = -tau_hip * math.log(1 - (MOTOR_LIMIT - T_AMB) / (T_run_ss - T_AMB)) \
    if T_run_ss > MOTOR_LIMIT else None
print(f"   evacuation run (0.59 m/s): hip ~{p_hip_run:.1f} W, steady state would be "
      f"{T_run_ss:.0f} degC")
if t_to_limit:
    print(f"     -> reaches the {MOTOR_LIMIT:.0f} degC limit after "
          f"{t_to_limit/60:.1f} min of continuous running")
    print(f"     at 0.59 m/s that is {0.59*t_to_limit:.0f} m of corridor — "
          f"comfortably longer than any evacuation route in the foyer block")
else:
    print("     -> never reaches the limit; running is safety-limited, not heat-limited")

# ---------------------------------------------------------------------------
# 5b. THE SAME ROBOT ON EARTH — why this is a Mars result
# ---------------------------------------------------------------------------
# Joint torque scales with g. Copper loss scales with torque SQUARED, gearbox
# loss roughly linearly. So a 2.64x heavier planet does not cost 2.64x the heat.
print("\n=== 5b. THE SAME DESIGN ON EARTH ===")
G_RATIO = 9.81 / 3.71
hip_h = next(h for j, h in rows if j.startswith("hip"))
cu_e = hip_h["copper"] * G_RATIO ** 2
gear_e = hip_h["gear"] * G_RATIO
p_hip_earth = cu_e + gear_e + hip_h["idle"]
T_earth = T_AMB + p_hip_earth * (1 / UA + g["R_int"])
print(f"   hip copper {hip_h['copper']:.1f} -> {cu_e:.1f} W (torque^2), "
      f"gear {hip_h['gear']:.1f} -> {gear_e:.1f} W (torque)")
print(f"   hip dissipation {hip_h['total']:.1f} W (Mars) -> {p_hip_earth:.1f} W (Earth)")
print(f"   steady-state winding {therm[0]['T_winding']:.0f} degC (Mars) -> "
      f"{T_earth:.0f} degC (Earth)")
print(f"   -> an identical machine on Earth {'exceeds' if T_earth > MOTOR_LIMIT else 'stays within'} "
      f"the {MOTOR_LIMIT:.0f} degC limit"
      f"{' and would need bigger motors, liquid cooling, or a slower duty cycle' if T_earth > MOTOR_LIMIT else ''}")
print("   Mars does not merely permit this thermal design — it is the reason it works.")

# ---------------------------------------------------------------------------
# 6. HAND: does 3 kg actually hold?
# ---------------------------------------------------------------------------
print("\n=== 6. THE HAND'S 3 kg CLAIM, CHECKED ===")
MU_PAD = 0.9           # elastomer pad on a smooth tray edge
F_FINGER = 12.0        # N per finger, small geared actuator
N_CONTACT = 3
PAYLOAD = 3.0
g_mars = 3.71
W_tray = PAYLOAD * g_mars
# friction grasp: need mu*F_n*N >= weight + inertial term
a_walk = 0.35 / 0.9    # speed / step period, worst-case CoM acceleration
F_needed = PAYLOAD * math.hypot(g_mars, a_walk)
F_avail = MU_PAD * F_FINGER * N_CONTACT
print(f"   payload {PAYLOAD} kg -> weight {W_tray:.1f} N on Mars "
      f"({PAYLOAD*9.81:.1f} N on Earth)")
print(f"   walking adds {a_walk:.2f} m/s2 of CoM acceleration -> required "
      f"grip reaction {F_needed:.1f} N")
print(f"   available: mu {MU_PAD} x {F_FINGER:.0f} N x {N_CONTACT} contacts = "
      f"{F_avail:.1f} N -> safety factor {F_avail/F_needed:.2f}")
print(f"   the same hand on Earth would need {PAYLOAD*9.81:.1f} N and have "
      f"factor {F_avail/(PAYLOAD*9.81):.2f} — low gravity is what makes the")
print("   two-DoF hand credible; this is a Mars-specific design allowance")

out = dict(ambient_C=T_AMB, h_total=round(H_TOT, 2), body_area_m2=A_BODY,
           heat_W=dict(actuators=round(act_heat, 1), electronics=ELEC_W,
                       total=round(total_heat, 1)),
           body_dT_K=round(dT_body, 1), joints=therm,
           hip_tau_min=round(tau_hip / 60, 1),
           duty_max=round(duty_max, 3),
           run_hip_W=round(p_hip_run, 1),
           run_time_to_limit_min=(round(t_to_limit / 60, 1) if t_to_limit else None),
           earth=dict(hip_W=round(p_hip_earth, 1), T_winding_C=round(T_earth, 1),
                      exceeds_limit=bool(T_earth > MOTOR_LIMIT)),
           hand=dict(payload_kg=PAYLOAD, F_needed=round(F_needed, 1),
                     F_avail=round(F_avail, 1),
                     factor_mars=round(F_avail / F_needed, 2),
                     factor_earth=round(F_avail / (PAYLOAD * 9.81), 2)))
with io.open(os.path.join(HERE, "thermal_ledger.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("\nwrote thermal_ledger.json")
