# Two ledgers that turn out to be the same ledger.
#
# (1) CIS in the undercity. The asset inherited the mine robot's imaging chain
#     wholesale and the info card quoted "auto-exposure converges to 117-260 ms"
#     as if that were a success. It is a warning: at 260 ms an object 2 m away
#     smears across several pixels while the robot walks, and smears across the
#     WHOLE frame while it turns. Nobody had computed that.
#
# (2) Human-robot safety. The avoidance threshold (1.2 m) and greeting radius
#     (2.5 m) were invented, not derived. ISO/TS 15066 speed-and-separation
#     monitoring gives the real number, and it needs the stopping distance that
#     balance_ctrl.py measured (a humanoid cannot stop like a cart).
#
# They meet at a speed limit: motion blur says "slow down or go blind", contact
# force says "slow down or hurt someone", and both land near 0.3 m/s.
import io
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# ===================== 1. INDOOR PHOTOMETRIC CHAIN =====================
# As-built indoor camera: the f/2.0 + 50 lux combination in the first pass is
# what forced ~190 ms exposures and made the robot blind while turning. The
# delivered design carries f/1.4 and requires >=120 lux in the foyer.
CAM = dict(fov_deg=70.0, npix=64, pitch_um=5.0, f_number=1.4, lens_T=0.90,
           QE=0.60, FWC=17880, LSB=16.5, READ=1.76, DARK=170.0,
           target_DN=400)
SCENE = dict(illuminance_lux=120.0,     # foyer LED strips, corridor standard
             floor_albedo=0.30,
             lm_per_W=250.0,            # broadband luminous efficacy of the LEDs
             photon_energy_J=3.61e-19)  # ~550 nm


def photoelectron_rate(lux=None, albedo=None):
    """e-/s per pixel for a Lambertian floor under given illuminance."""
    lux = SCENE["illuminance_lux"] if lux is None else lux
    albedo = SCENE["floor_albedo"] if albedo is None else albedo
    L_v = lux * albedo / math.pi                       # cd/m2 (Lambertian)
    # image-side illuminance of a lens: E = pi*L/(4 F^2) * T
    E_img_lux = math.pi * L_v / (4 * CAM["f_number"] ** 2) * CAM["lens_T"]
    E_img_W = E_img_lux / SCENE["lm_per_W"]            # W/m2
    A_pix = (CAM["pitch_um"] * 1e-6) ** 2
    P_pix = E_img_W * A_pix                            # W on one pixel
    return P_pix / SCENE["photon_energy_J"] * CAM["QE"]


def exposure_for_target(lux=None, albedo=None):
    rate = photoelectron_rate(lux, albedo)
    Ne_target = CAM["target_DN"] * CAM["LSB"]
    return Ne_target / rate, rate, Ne_target


print("=== CIS PHOTOMETRIC CHAIN, UNDERCITY FOYER ===")
for lux in (20, 50, 120, 400):
    t_exp, rate, Ne = exposure_for_target(lux)
    shot = math.sqrt(Ne)
    snr = Ne / math.sqrt(Ne + (CAM["READ"]) ** 2 + CAM["DARK"] * t_exp)
    print(f"   {lux:4.0f} lux -> {rate:9.0f} e-/s/px, needs {t_exp*1000:7.1f} ms "
          f"for DN 400 ({Ne:.0f} e-), SNR {snr:5.1f}")
t_exp50, rate50, Ne50 = exposure_for_target()
print(f"  design point {SCENE['illuminance_lux']:.0f} lux -> "
      f"{t_exp50*1000:.0f} ms exposure. The engine's AE loop measured 117-260 ms "
      f"in the actual scene, i.e. the modeled foyer is dimmer still "
      f"({SCENE['illuminance_lux']*t_exp50/0.19:.0f}-lux-equivalent at 190 ms).")

# ===================== 2. MOTION BLUR =====================
ifov = math.radians(CAM["fov_deg"]) / CAM["npix"]      # rad per pixel
print(f"\n=== MOTION BLUR (iFOV {ifov*1000:.1f} mrad/px = "
      f"{math.degrees(ifov):.2f} deg/px) ===")
print("   ground target at 2.0 m; blur in pixels for a given exposure")
print("   exposure   walk 0.55 m/s   walk 0.30 m/s   turn 1.0 rad/s   turn 0.4 rad/s")
D_TGT = 2.0
blur_rows = []
for t_ms in (20, 50, 100, 190, 260):
    t = t_ms / 1000
    b_walk55 = (0.55 * t / D_TGT) / ifov
    b_walk30 = (0.30 * t / D_TGT) / ifov
    b_turn10 = (1.0 * t) / ifov
    b_turn04 = (0.4 * t) / ifov
    blur_rows.append(dict(t_ms=t_ms, walk055=round(b_walk55, 2),
                          walk030=round(b_walk30, 2), turn10=round(b_turn10, 2),
                          turn04=round(b_turn04, 2)))
    print(f"   {t_ms:6d} ms {b_walk55:14.2f} {b_walk30:15.2f} "
          f"{b_turn10:16.2f} {b_turn04:16.2f}")

BLUR_LIMIT = 1.5      # px: beyond this the 64x64 dark-region split degrades
# in-scene AE settles at 36-43 ms with the as-built lens; take the slow end
t_meas = 0.043
v_max_blur = BLUR_LIMIT * ifov * D_TGT / t_meas
w_max_blur = BLUR_LIMIT * ifov / t_meas
print(f"  at the as-built {t_meas*1000:.0f} ms exposure, keeping blur under {BLUR_LIMIT} px needs")
print(f"    forward speed <= {v_max_blur:.2f} m/s   AND   yaw rate <= "
      f"{w_max_blur:.2f} rad/s ({math.degrees(w_max_blur):.0f} deg/s)")
print(f"  for contrast, the FIRST design (f/2.0 + 50 lux -> ~190 ms) allowed only")
print(f"    v <= {BLUR_LIMIT*ifov*D_TGT/0.190:.2f} m/s and w <= {BLUR_LIMIT*ifov/0.190:.2f} rad/s"
      f"  -- a 1 rad/s turn smeared the frame by {1.0*0.190/ifov:.0f} px")

# ===================== 3. ISO/TS 15066 SPEED AND SEPARATION =====================
print("\n=== HUMAN-ROBOT SAFETY: speed and separation monitoring ===")
bal = json.load(io.open(os.path.join(HERE, "balance_ledger.json"), encoding="utf-8"))
MASS = bal["mass_kg"]
D_STOP = {r["v"]: r["d_stop"] for r in bal["stopping"]}
T_STOP = bal["stopping"][0]["t_stop"]

V_HUMAN = 1.6                       # ISO default approach speed
T_SENSE_LIDAR = 1 / 6.0             # LiDAR scan period
T_SENSE_CAM = 1 / 5.0               # camera frame period
T_CTRL = 0.05                       # decision + command latency
C_INTRUSION = 0.10                  # ISO intrusion allowance (hand/arm)
Z_UNCERT = 0.05                     # sensor + position uncertainty

print("   v_robot  T_react   human travel   robot travel   stop dist   S_protective")
ssm_rows = []
for v in (0.30, 0.45, 0.55, 0.75):
    T_react = T_SENSE_LIDAR + T_CTRL
    d_human = V_HUMAN * (T_react + T_STOP)
    d_robot = v * T_react
    d_stop = D_STOP.get(v) or (v * bal["Tc_mars"] + v * 0.45)
    S = d_human + d_robot + d_stop + C_INTRUSION + Z_UNCERT
    ssm_rows.append(dict(v=v, S=round(S, 2), d_human=round(d_human, 2),
                         d_robot=round(d_robot, 2), d_stop=round(d_stop, 2)))
    print(f"   {v:6.2f}  {T_react:6.3f}s  {d_human:12.2f} m {d_robot:13.2f} m "
          f"{d_stop:10.2f} m {S:12.2f} m")
print(f"  the asset's avoidance threshold is 1.2 m and its greeting radius 2.5 m")
S_055 = next(r["S"] for r in ssm_rows if r["v"] == 0.55)
S_030 = next(r["S"] for r in ssm_rows if r["v"] == 0.30)
print(f"    at 0.55 m/s SSM demands {S_055:.2f} m of separation -> the 1.2 m "
      f"threshold is TOO TIGHT by {S_055-1.2:.2f} m")
print(f"    at 0.30 m/s it demands {S_030:.2f} m -> 1.2 m still short, but the "
      f"2.5 m greeting radius covers it with margin")

# ===================== 4. CONTACT FORCE LIMIT =====================
print("\n=== CONTACT FORCE (ISO/TS 15066 biomechanical limits) ===")
# transient contact limits, chest/abdomen: 280 N (transient), 140 N (quasi-static)
F_TRANSIENT, F_QUASI = 280.0, 140.0
print("   shell compliance   contact time   force at 0.55 m/s   force at 0.30 m/s   verdict")
force_rows = []
for label, dt_contact in (("rigid shell", 0.020), ("3 mm foam", 0.050),
                          ("15 mm compliant skin", 0.120)):
    f55 = MASS * 0.55 / dt_contact
    f30 = MASS * 0.30 / dt_contact
    v_ok = F_TRANSIENT * dt_contact / MASS
    force_rows.append(dict(shell=label, dt=dt_contact, f_055=round(f55),
                           f_030=round(f30), v_limit=round(v_ok, 3)))
    print(f"   {label:19s} {dt_contact*1000:8.0f} ms {f55:16.0f} N {f30:17.0f} N"
          f"   v_max {v_ok:.2f} m/s")
print(f"  limits: {F_TRANSIENT:.0f} N transient / {F_QUASI:.0f} N quasi-static (chest)")

# ===================== 5. WHERE THE THREE CONSTRAINTS MEET =====================
v_blur = v_max_blur
v_ankle_only = bal["v_ankle_limit_mars"]
v_contact = next(r["v_limit"] for r in force_rows if r["shell"] == "3 mm foam")
# Stepping lifts the balance limit: capture steps are how bipeds actually stop.
step_path = os.path.join(HERE, "stepping_ledger.json")
v_balance, step_note = v_ankle_only, "ankle strategy only (stepping forbidden)"
if os.path.exists(step_path):
    stp = json.load(io.open(step_path, encoding="utf-8"))
    v_balance = stp.get("v_robust", v_ankle_only)
    step_note = (f"with capture stepping (robust 5/5; edge case "
                 f"{stp['best']['v_mean']:.2f} m/s)")
v_gov = min(v_blur, v_balance, v_contact)
print("\n=== THE SPEED GOVERNOR ===")
print(f"   motion blur (vision stays usable)     v <= {v_blur:.2f} m/s")
print(f"   balance, {step_note:<44} v <= {v_balance:.2f} m/s")
print(f"     (was {v_ankle_only:.2f} m/s when stepping was forbidden)")
print(f"   ISO 15066 contact force (3 mm foam)   v <= {v_contact:.2f} m/s")
print(f"   -> governed patrol speed {v_gov:.2f} m/s, limited by "
      f"{'motion blur' if v_gov == v_blur else 'contact force' if v_gov == v_contact else 'balance'}")
print(f"   yaw rate governed by blur             w <= {w_max_blur:.2f} rad/s")
# Upgrade path: name the binding constraint, then what relieves it.
print("\n   upgrade path:")
order = sorted([("motion blur", v_blur), ("balance (stepping)", v_balance),
                ("contact force", v_contact)], key=lambda x: x[1])
for i, (name, lim) in enumerate(order):
    mark = "  <- binding" if i == 0 else ""
    print(f"     {name:22s} {lim:5.2f} m/s{mark}")
v_skin = next(r["v_limit"] for r in force_rows if r["shell"] == "15 mm compliant skin")
if order[0][0] == "contact force":
    print(f"     relieve it with a 15 mm compliant skin -> {v_skin:.2f} m/s, after which")
    print(f"     balance binds at {v_balance:.2f} m/s and the gait controller "
          f"itself must improve")
lux_needed = None

out = dict(
    camera=CAM, scene=SCENE,
    e_per_s_per_px=round(photoelectron_rate(), 1),
    exposure_ms_for_DN400=round(t_exp50 * 1000, 1),
    ifov_mrad=round(ifov * 1000, 3),
    blur=blur_rows, blur_limit_px=BLUR_LIMIT,
    v_max_blur=round(v_max_blur, 3), w_max_blur=round(w_max_blur, 3),
    ssm=ssm_rows, ssm_params=dict(v_human=V_HUMAN, T_sense_lidar=T_SENSE_LIDAR,
                                  T_ctrl=T_CTRL, C=C_INTRUSION, Z=Z_UNCERT),
    contact=force_rows, F_transient_N=F_TRANSIENT,
    governor=dict(v_blur=round(v_blur, 3), v_balance=v_balance,
                  v_balance_ankle_only=v_ankle_only, balance_note=step_note,
                  v_contact=v_contact, v_governed=round(v_gov, 3),
                  w_governed=round(w_max_blur, 3),
                  binding=('blur' if v_gov == v_blur else
                           'contact' if v_gov == v_contact else 'balance'),
                  limit_order=[[n, l] for n, l in order],
                  upgrade=dict(v_with_15mm_skin=v_skin)))
with io.open(os.path.join(HERE, "perception_safety_ledger.json"), "w",
             encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("\nwrote perception_safety_ledger.json")
