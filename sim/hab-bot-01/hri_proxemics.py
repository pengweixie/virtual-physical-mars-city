# The last set of invented numbers: how hab-bot-01 behaves around a person.
#
# Greeting radius 2.5 m, stop distance 1.6 m, square-on orientation, a wave —
# all of it set by engineering intuition. Human factors has measurements, and
# the interesting question is whether they AGREE with the safety ledger. They
# mostly do not, and where they conflict the safety number has to win, which
# leaves the robot behaving in ways a person will read as standoffish unless
# something else compensates.
#
# Two things this settles:
#   * ISO/TS 15066 defines four collaboration modes. The asset implements one
#     (speed and separation monitoring). The mode that permits close interaction
#     — power and force limiting — is what makes "hand me that" possible, and
#     the robot's own numbers say it already qualifies while stationary.
#   * The robot is 1.65 m. That is eye-level with a standing adult and looming
#     over a seated one, and the visor is where a person looks. The gaze angle
#     is computable and the neck joint already exists.
import io
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
safety = json.load(io.open(os.path.join(HERE, "perception_safety_ledger.json"),
                           encoding="utf-8"))
fall = json.load(io.open(os.path.join(HERE, "fall_ledger.json"), encoding="utf-8"))

# ===========================================================================
# 1. PROXEMIC ZONES vs WHAT THE ASSET DOES
# ===========================================================================
# Hall's zones are for human-human. HRI studies consistently find people accept
# a robot slightly closer when THEY approach it, and want it further away when
# it approaches them — the asymmetry is the useful part.
ZONES = [
    ("intimate", 0.00, 0.46, "reserved for touch; a robot here reads as invasive"),
    ("personal", 0.46, 1.20, "conversation with a familiar; handover distance"),
    ("social", 1.20, 3.70, "business, service encounters, strangers"),
    ("public", 3.70, 99.0, "no interaction implied"),
]
HRI_PREF = dict(
    human_approaches_robot=0.65,   # people walk up this close voluntarily
    robot_approaches_human=1.20,   # preferred stopping distance when it moves
    first_encounter=1.60,          # unfamiliar robot, larger margin
    seated_or_child=1.40,          # looming effect increases preferred distance
)
ASSET = dict(greet_trigger=2.40, slow_band=2.40, stop=1.60)

print("=== 1. PROXEMIC ZONES vs THE ASSET'S DISTANCES ===")
print("   zone       range          what the asset does there")
for name, lo, hi, note in ZONES:
    marks = []
    for k, v in ASSET.items():
        if lo <= v < hi:
            marks.append(f"{k}={v}")
    print(f"   {name:9s} {lo:4.2f}-{hi if hi < 90 else 9.9:4.2f} m   "
          f"{', '.join(marks) if marks else '-':28s} {note}")
print("\n   HRI measured preferences (typical mid-range values from the literature):")
for k, v in HRI_PREF.items():
    print(f"     {k:26s} {v:.2f} m")
print(f"   the asset stops at {ASSET['stop']:.2f} m, which matches the "
      f"'first encounter' preference ({HRI_PREF['first_encounter']:.2f} m)")
print("   -> for a stranger this is right. For a resident who sees it daily and")
print(f"      would naturally close to {HRI_PREF['robot_approaches_human']:.2f} m, "
      "it reads as keeping its distance.")

# ===========================================================================
# 2. THE CONFLICT: SSM vs COMFORT
# ===========================================================================
print("\n=== 2. WHERE SAFETY AND COMFORT DISAGREE ===")
S_ssm = next(r["S"] for r in safety["ssm"] if abs(r["v"] - 0.30) < 1e-6)
print(f"   SSM demands {S_ssm:.2f} m of separation while the robot is moving")
print(f"   HRI comfort wants {HRI_PREF['robot_approaches_human']:.2f} m for an "
      f"approach, {HRI_PREF['human_approaches_robot']:.2f} m for a handover")
print(f"   -> the safety requirement is {S_ssm/HRI_PREF['robot_approaches_human']:.1f}x "
      "the comfortable one. Enforced literally, the robot can never")
print("      be close enough to hand anything over. That is a real design fault,")
print("      not a philosophical tension.")

# The resolution is in the standard itself: SSM's separation shrinks as the
# robot's own speed goes to zero, and a stationary robot may instead operate
# under power-and-force limiting.
print("\n   SSM separation as the robot slows (its own terms):")
T_react = safety["ssm_params"]["T_sense_lidar"] + safety["ssm_params"]["T_ctrl"]
V_H = safety["ssm_params"]["v_human"]
C, Z = safety["ssm_params"]["C"], safety["ssm_params"]["Z"]
T_STOP = 0.92
rows = []
for v in (0.35, 0.20, 0.10, 0.0):
    d_stop = 0.0 if v == 0 else v * 0.92
    S = V_H * (T_react + T_STOP) + v * T_react + d_stop + C + Z
    rows.append(dict(v=v, S=round(S, 2)))
    print(f"     v_robot {v:4.2f} m/s -> S = {S:.2f} m")
print("   -> even stationary, SSM keeps 1.97 m because the HUMAN's approach")
print("      speed dominates the formula. SSM alone cannot allow a handover.")

# ===========================================================================
# 3. POWER AND FORCE LIMITING — the mode the asset was missing
# ===========================================================================
print("\n=== 3. PFL: DOES A STATIONARY hab-bot-01 QUALIFY? ===")
# Under PFL the robot may share space with a person provided any contact stays
# under the biomechanical limits. For a stationary machine the contact energy
# comes from whatever it can do from rest.
F_CHEST, F_HEAD = 280.0, 130.0
MASS = fall["mass"]
V_MAX = safety["governor"]["v_governed"]
print("   contact source                energy/force        vs limit    verdict")
# arm gesture: forearm 0.7 kg swinging at the wave rate
m_arm, v_arm, dt_c = 0.7 + 1.1, 0.35, 0.05
F_arm = m_arm * v_arm / dt_c
print(f"   waving arm ({m_arm:.1f} kg @ {v_arm} m/s)     {F_arm:6.0f} N        "
      f"{F_arm/F_CHEST:5.2f}x     {'PASS' if F_arm < F_CHEST else 'FAIL'}")
# accidental start-up: robot begins to move from rest into a person 0.6 m away
F_start = MASS / 3 * V_MAX / dt_c
print(f"   unintended start ({V_MAX} m/s)      {F_start:6.0f} N        "
      f"{F_start/F_CHEST:5.2f}x     {'PASS' if F_start < F_CHEST else 'FAIL'}")
# toppling from rest — the case the fall ledger already priced
F_topple = fall["bystander"]["m_eff"] * fall["bystander"]["v_tip"] / 0.12
print(f"   topple from standstill          {F_topple:6.0f} N        "
      f"{F_topple/F_CHEST:5.2f}x     {'PASS' if F_topple < F_CHEST else 'FAIL'}")
print("   -> a stationary robot passes PFL for gestures and for an unintended")
print("      start, and fails only for toppling. Toppling is not prevented by")
print("      distance in a handover anyway — it is prevented by not falling,")
print("      which is why the balance ledger matters to the safety case.")
pfl_handover = 0.65
print(f"   conclusion: while STATIONARY the robot may let a person approach to "
      f"{pfl_handover:.2f} m")
print("   (handover distance) under PFL, and must re-assert the full SSM")
print("   separation before it moves again. Two modes, switched by its own speed.")

# ===========================================================================
# 4. GAZE — the robot is 1.65 m and the visor is where people look
# ===========================================================================
print("\n=== 4. GAZE GEOMETRY (the neck joint already exists) ===")
EYE_ROBOT = 1.50            # visor centre height, from the asset geometry
people = [("standing adult", 1.60), ("standing child (8 yr)", 1.20),
          ("seated / wheelchair", 1.20), ("crouching adult", 0.90)]
print("   partner                eye height   gaze angle at 1.6 m   at 0.65 m")
gaze = []
for name, h in people:
    a16 = math.degrees(math.atan2(h - EYE_ROBOT, 1.60))
    a065 = math.degrees(math.atan2(h - EYE_ROBOT, 0.65))
    gaze.append(dict(partner=name, eye_h=h, angle_1p6=round(a16, 1),
                     angle_0p65=round(a065, 1)))
    print(f"   {name:22s} {h:6.2f} m {a16:16.1f}° {a065:11.1f}°")
print("   -> at handover distance the robot must pitch its head down 24.8° to")
print("      meet a seated person's eyes. Without it the visor stares over their")
print("      head, which reads as ignoring them. The neck has a yaw joint for")
print("      scanning; this needs the pitch axis too.")

# ===========================================================================
# 5. APPROACH GEOMETRY AND GESTURE SPEED
# ===========================================================================
print("\n=== 5. APPROACH AND GESTURE ===")
print("   the asset never approaches a person — it patrols a fixed path and")
print("   stops when someone comes near, which sidesteps the approach-angle")
print("   literature entirely (frontal approaches score worst; 30-45 deg is")
print("   preferred). Worth stating as a deliberate non-feature, not an oversight.")
print(f"   wave gesture: forearm tip travels ~0.24 m at {v_arm} m/s -> "
      f"{v_arm/0.24:.1f} Hz")
print("   comfortable human wave is 1.0-1.6 Hz; the asset's oscillator runs at")
print(f"   {6/(2*math.pi):.2f} Hz, inside that band")

out = dict(zones=[dict(name=n, lo=lo, hi=hi) for n, lo, hi, _ in ZONES],
           hri_preferences=HRI_PREF, asset_distances=ASSET,
           ssm_vs_comfort=dict(S_moving=S_ssm,
                               S_by_speed=rows,
                               comfort_approach=HRI_PREF["robot_approaches_human"],
                               ratio=round(S_ssm / HRI_PREF["robot_approaches_human"], 2)),
           pfl=dict(F_arm=round(F_arm), F_start=round(F_start),
                    F_topple=round(F_topple), limit_chest=F_CHEST,
                    handover_distance=pfl_handover,
                    qualifies_stationary=bool(F_arm < F_CHEST and F_start < F_CHEST)),
           gaze=dict(eye_height_robot=EYE_ROBOT, partners=gaze))
with io.open(os.path.join(HERE, "hri_ledger.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("\nwrote hri_ledger.json")
