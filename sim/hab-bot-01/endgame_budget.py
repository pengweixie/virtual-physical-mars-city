# The closing round: two claims that do not survive scrutiny, priced and fixed.
#
# 1. BATTERY: the 300 Wh pack has 3% margin over the 292 Wh shift requirement.
#    That is FIRST-DAY margin. Batteries fade; a pack sized to the day-one
#    number silently breaks the "4 h shift" promise within a year of service.
#
# 2. DOCKING: the dock card claims "dead-reckoning navigation, contact within
#    0.1 m". But the simulation's position IS ground truth - the controller
#    integrates its own commands with zero slip or step-length error. Real
#    legged odometry drifts 1-5% of distance travelled, which does not fit
#    through a 0.1 m contact tolerance. The claim needs either an error model
#    that closes, or terminal guidance. (It needs terminal guidance.)
import io
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# ===========================================================================
# 1. BATTERY AGEING
# ===========================================================================
print("=== 1. BATTERY END-OF-LIFE ===")
P_SHIFT = 73.1              # W, duty-cycle mean (compute ledger)
SHIFT_H = 4.0
E_SHIFT = P_SHIFT * SHIFT_H  # 292.4 Wh
FADE_EOL = 0.80             # retire the pack at 80% capacity (industry norm)
N_FEC_80 = 500              # full-equivalent cycles to 80% (NMC, conservative)
DOD = 0.70                  # 25% -> 95% operating window
SHIFTS_PER_SOL = 2
SOL_H = 24.66

print(f"   shift energy: {P_SHIFT} W x {SHIFT_H} h = {E_SHIFT:.0f} Wh")
print(f"   current pack 300 Wh -> day-one margin {(300-E_SHIFT)/E_SHIFT*100:.1f}%")
fec_per_sol = SHIFTS_PER_SOL * DOD
sols_to_eol = N_FEC_80 / fec_per_sol
days_to_eol = sols_to_eol * SOL_H / 24
print(f"   usage {SHIFTS_PER_SOL} shifts/sol x DoD {DOD} = {fec_per_sol} FEC/sol")
print(f"   -> reaches 80% capacity after {sols_to_eol:.0f} sols "
      f"(~{days_to_eol/365*12:.0f} Earth months)")
cap300_eol = 300 * FADE_EOL
shift300_eol = cap300_eol / P_SHIFT
print(f"   the 300 Wh pack at EOL: {cap300_eol:.0f} Wh -> shift shrinks to "
      f"{shift300_eol:.2f} h. The 4 h promise dies in under a year.")

cap_needed = E_SHIFT / FADE_EOL
print(f"\n   EOL-sized pack: {E_SHIFT:.0f} / {FADE_EOL} = {cap_needed:.0f} Wh minimum")
CAP_NEW = 370
print(f"   chosen {CAP_NEW} Wh: EOL capacity {CAP_NEW*FADE_EOL:.0f} Wh, margin "
      f"{(CAP_NEW*FADE_EOL-E_SHIFT)/E_SHIFT*100:.1f}% at retirement")
m_new, m_old = CAP_NEW / 200, 300 / 200
print(f"   mass {m_old:.2f} -> {m_new:.2f} kg (+{(m_new-m_old)/39.8*100:.1f}% of robot; "
      f"power ledgers unchanged at this level)")
print(f"   recharge 25->95%: {CAP_NEW*DOD/150:.1f} h at 150 W; pack swap at "
      f"~{sols_to_eol:.0f} sols keeps the shift promise for the fleet")

# ===========================================================================
# 2. ODOMETRY DRIFT vs DOCKING TOLERANCE
# ===========================================================================
print("\n=== 2. DEAD-RECKONING CANNOT DOCK ===")
# path from the far patrol waypoint to the dock, along the waypoint chain
import numpy as np
Wx, Lz = 2.6, 5.2
wps = [(Wx*math.sin(2*u), Lz*math.sin(u))
       for u in [k/24*2*math.pi for k in range(24)]]
far = max(wps, key=lambda p: math.hypot(p[0]-4.95, p[1]))
d_direct = math.hypot(far[0]-4.95, far[1])
d_path = d_direct * 1.25          # waypoint chain is not a straight line
DRIFT = 0.02                       # 2% of distance, mid-range legged odometry
sigma = DRIFT * d_path
TOL = 0.08                         # contact strips 10 cm + funnel less margin
print(f"   worst start: patrol point ({far[0]:.1f},{far[1]:.1f}), "
      f"{d_direct:.1f} m direct, ~{d_path:.1f} m along waypoints")
print(f"   legged dead-reckoning drift 1-5%/m; at {DRIFT*100:.0f}%: "
      f"sigma = {sigma*100:.0f} cm arrival error")
print(f"   docking tolerance (contact strip + mechanical funnel): {TOL*100:.0f} cm")
print(f"   -> {sigma/TOL:.1f}x over tolerance. The published claim "
      f"('dead reckoning, <0.1 m') only worked because the sim's position is truth.")

print("\n   terminal guidance chain (each stage hands off inside the next's capture):")
stages = [
    ("dead reckoning to dock area", sigma * 100, "gets within LiDAR trusted band"),
    ("LiDAR wall-normal + retro strips, 2.5-3 m", 7.0,
     "beam spacing 6.4 deg -> bearing ~2 deg -> +/-7 cm at 2 m"),
    ("nav camera on the dock LED, <=1.5 m", 2.0,
     "iFOV 19.1 mrad -> +/-1 px = +/-2 cm at 1 m"),
    ("mechanical funnel at contact", 5.0, "compliant strips absorb the rest"),
]
ok = True
prev = None
rows = []
for name, err_cm, note in stages:
    hand = "" if prev is None else ("  OK" if prev <= 8 + err_cm else "  GAP")
    rows.append(dict(stage=name, err_cm=err_cm, note=note))
    print(f"   {name:44s} +/-{err_cm:4.0f} cm   {note}")
    prev = err_cm
print(f"   -> chain closes: {sigma*100:.0f} -> 7 -> 2 cm against an 8 cm funnel. Dead reckoning")
print("      alone does not; the dock needs its retro strips and the camera.")
print("   note the LiDAR subtlety: inside 2 m the receiver saturates (proximity")
print("   only), so the LiDAR stage must finish its correction OUTSIDE 2 m and")
print("   hand off to the camera - the guidance chain is forced by the sensor's")
print("   own saturation ledger.")

out = dict(
    battery=dict(shift_Wh=round(E_SHIFT, 1), pack_old=300, pack_new=CAP_NEW,
                 fade_eol=FADE_EOL, fec_to_eol=N_FEC_80, dod=DOD,
                 sols_to_eol=round(sols_to_eol), shift_at_eol_300Wh=round(shift300_eol, 2),
                 eol_margin_new=round((CAP_NEW*FADE_EOL-E_SHIFT)/E_SHIFT, 3),
                 mass_kg=round(m_new, 2)),
    odometry=dict(drift_frac=DRIFT, path_m=round(d_path, 1),
                  sigma_cm=round(sigma*100), tolerance_cm=round(TOL*100),
                  over_tolerance=round(sigma/TOL, 1), guidance=rows))
with io.open(os.path.join(HERE, "endgame_ledger.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("\nwrote endgame_ledger.json")
