# The charging round: the dock was scenery, and the battery ledger's two
# halves never met.
#
# Self-reported numbers under audit:
#   - P_CHG = 150 W        (asset code, never derived)
#   - "recharge 25->95%: 1.7 h at 150 W"  (endgame ledger, ignores the robot's
#                                          own docked load and the CV tail)
#   - the EOL sizing itself: endgame_budget.py counted cycle life with
#     DoD 0.70 (the 25->95% FSM window) but checked the shift margin against
#     80% x FULL capacity - two different SOC windows in one ledger. Multiply
#     them together and the 4 h promise dies on DAY ONE, not at EOL.
#
# This script: (1) the window audit, (2) a self-consistent resize with
# DoD-dependent cycle life, (3) calendar ageing vs charging strategy,
# (4) a CC-CV charge simulation (ECM), (5) the docked-posture power account,
# (6) contact interface and safety checks.
import io
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))

P_SHIFT = 74.1          # W shift mean (compute ledger + voice +1.0 W)
SHIFT_H = 4.0
E_SHIFT = P_SHIFT * SHIFT_H          # 296.4 Wh
SHIFTS_PER_SOL = 2
SOL_H = 24.66
FADE_EOL = 0.80
E_DENS = 200.0          # Wh/kg pack level (unchanged across changes 1-4)

# ===========================================================================
# 1. THE WINDOW AUDIT - two halves of one ledger, two SOC windows
# ===========================================================================
print("=== 1. WINDOW AUDIT: the ledger disagrees with itself ===")
CAP4 = 380.0            # fourth change (voice round)
FLOOR4, CEIL4 = 0.25, 0.95           # the FSM's actual operating window
usable_bol = CAP4 * (CEIL4 - FLOOR4)
usable_eol = CAP4 * FADE_EOL * (CEIL4 - FLOOR4)
print(f"   shift needs {E_SHIFT:.1f} Wh; FSM window {FLOOR4:.0%}->{CEIL4:.0%}")
print(f"   380 Wh pack, usable in-window: BOL {usable_bol:.0f} Wh / EOL {usable_eol:.0f} Wh")
print(f"   -> BOL shift: {usable_bol/P_SHIFT:.2f} h  (promise is 4.00 h)")
print(f"   -> the EOL sizing compared {E_SHIFT:.0f} against 0.80 x 380 = 304 Wh")
print(f"      (full 0-100%), while counting cycles at DoD 0.70. Inconsistent:")
print(f"      the implied per-shift throughput 296.4/380 = "
      f"{E_SHIFT/CAP4:.2f} DoD does not even fit the 0.70 window.")
print(f"   -> the 4 h promise fails on day one at {usable_bol/P_SHIFT:.2f} h,")
print(f"      no ageing required. Caught only by multiplying the two windows.")

# ===========================================================================
# 2. SELF-CONSISTENT RESIZE
#    window: floor 15% (dock-trip + greet-interrupt + retry reserve, ~57 Wh
#    at EOL = 6 h docked idle), ceiling 95% (cell ageing above ~4.1 V/cell).
#    cycle life vs depth: Woehler-like N(DoD) = N_ref (DoD_ref/DoD)^k, k=2.
# ===========================================================================
print("\n=== 2. SELF-CONSISTENT RESIZE (fifth change) ===")
FLOOR, CEIL = 0.15, 0.95
WINDOW = CEIL - FLOOR
N_REF, DOD_REF, K_WOEHLER = 500.0, 0.70, 2.0
MARGIN = 0.03

print(f"   window {FLOOR:.0%}->{CEIL:.0%} (floor holds ~6 h docked idle at EOL;")
print(f"   ceiling avoids the >4.1 V/cell ageing knee)")
print(f"   need: E_shift x (1+{MARGIN:.0%}) <= CAP x {FADE_EOL} x {WINDOW}")
cap_min = E_SHIFT * (1 + MARGIN) / (FADE_EOL * WINDOW)
print(f"   -> CAP >= {cap_min:.0f} Wh")
print(f"\n   {'CAP':>5} {'kg':>5} {'shift DoD':>9} {'FEC/sol':>8} {'N(DoD)':>7} "
      f"{'cycle sols':>10} {'EOL margin':>10}")
trade = []
for cap in (380, 420, 460, 480, 520, 560):
    dod_shift = E_SHIFT / cap                     # actual per-shift swing
    fec_sol = SHIFTS_PER_SOL * dod_shift
    n_dod = N_REF * (DOD_REF / dod_shift) ** K_WOEHLER
    sols = n_dod / fec_sol
    margin = (cap * FADE_EOL * WINDOW - E_SHIFT) / E_SHIFT
    trade.append(dict(cap=cap, kg=round(cap / E_DENS, 2), dod=round(dod_shift, 3),
                      fec_sol=round(fec_sol, 2), n=round(n_dod), cycle_sols=round(sols),
                      eol_margin=round(margin, 3)))
    flag = "  <- fails window" if margin < 0 else (
        "  <- chosen" if cap == 480 else "")
    print(f"   {cap:5d} {cap/E_DENS:5.2f} {dod_shift:9.3f} {fec_sol:8.2f} "
          f"{n_dod:7.0f} {sols:10.0f} {margin:+10.1%}{flag}")
CAP = 480.0
dod_shift = E_SHIFT / CAP
fec_sol = SHIFTS_PER_SOL * dod_shift
n_dod = N_REF * (DOD_REF / dod_shift) ** K_WOEHLER
cycle_sols = n_dod / fec_sol
print(f"\n   fifth change: 380 -> {CAP:.0f} Wh ({CAP/E_DENS:.1f} kg, "
      f"+{(CAP-CAP4)/E_DENS:.2f} kg = +{(CAP-CAP4)/E_DENS/39.8*100:.1f}% robot mass)")
print(f"   EOL usable {CAP*FADE_EOL*WINDOW:.0f} Wh vs {E_SHIFT:.0f} needed: "
      f"+{(CAP*FADE_EOL*WINDOW-E_SHIFT)/E_SHIFT:.1%}")
print(f"   note the shape of the trade: a bigger pack cycles SHALLOWER, so life")
print(f"   grows twice - more capacity AND more cycles ({N_REF:.0f} -> {n_dod:.0f}).")

# ===========================================================================
# 3. CALENDAR AGEING vs CHARGING STRATEGY
#    the pack is parked ~16.7 h/sol. Calendar fade depends on float SOC:
#    NMC @ ~22 C indoor, %/year approx: 30%:1.0  50%:1.5  70%:2.5  95%:4.5
# ===========================================================================
print("\n=== 3. CALENDAR AGEING: when you charge is a lifetime parameter ===")
CAL = [(0.30, 1.0), (0.50, 1.5), (0.70, 2.5), (0.95, 4.5)]   # (SOC, %/Earth-yr)
def cal_rate(soc):
    for (s0, r0), (s1, r1) in zip(CAL, CAL[1:]):
        if soc <= s1:
            return r0 + (r1 - r0) * (max(soc, s0) - s0) / (s1 - s0)
    return CAL[-1][1]

soc_end_shift = CEIL - dod_shift                 # 0.95 - 0.62 = 0.33
cyc_per_sol = 20.0 / n_dod * fec_sol             # % fade per sol from cycling
strategies = {}
for name, soc_float, note in (
        ("charge-on-arrival", 0.92, "charge immediately, float at ~95% for ~14 h"),
        ("just-in-time", 0.45, "hold ~45%, top up to finish right at shift start")):
    r = cal_rate(soc_float)                      # %/yr at the float SOC
    cal_per_sol = r / 365.0 * (SOL_H / 24.0)
    total = cyc_per_sol + cal_per_sol
    sols = 20.0 / total
    strategies[name] = dict(float_soc=soc_float, cal_pct_yr=round(r, 2),
                            sols_to_eol=round(sols))
    print(f"   {name:18s}: float ~{soc_float:.0%} -> calendar {r:.1f}%/yr; "
          f"cycle {cyc_per_sol:.4f} + cal {cal_per_sol:.4f} %/sol "
          f"-> EOL at {sols:.0f} sols   ({note})")
gain = strategies['just-in-time']['sols_to_eol'] - strategies['charge-on-arrival']['sols_to_eol']
print(f"   -> just-in-time buys +{gain} sols (~{gain*SOL_H/24/30.4:.1f} Earth months)")
print(f"      of pack life for zero hardware. The FSM's charge scheduler is a")
print(f"      lifetime component, not a convenience.")

# ===========================================================================
# 4. CC-CV CHARGE SIMULATION (13S NMC ECM)
#    dock supplies 150 W. Robot docked load comes off the top (section 5),
#    conversion/contact chain ~96% -> ~135 W into the cells.
# ===========================================================================
print("\n=== 4. CC-CV: what 150 W actually does at the cell ===")
NS = 13
Q_AH = CAP / (NS * 3.7)                          # ~10 Ah
R_CELL = 0.006                                   # ohm, 10 Ah NMC
V_CV = 4.20
P_DOCKED = 9.4                                   # W (section 5)
ETA_CHAIN = 0.96                                 # charger->contacts->BMS
P_CELLS = (150.0 - P_DOCKED) * ETA_CHAIN
OCV = [(0.00, 3.00), (0.05, 3.45), (0.10, 3.55), (0.20, 3.63), (0.30, 3.68),
       (0.40, 3.73), (0.50, 3.78), (0.60, 3.84), (0.70, 3.90), (0.80, 3.96),
       (0.90, 4.05), (0.95, 4.13), (1.00, 4.20)]
def ocv(soc):
    for (s0, v0), (s1, v1) in zip(OCV, OCV[1:]):
        if soc <= s1:
            return v0 + (v1 - v0) * (soc - s0) / (s1 - s0)
    return OCV[-1][1]

def charge(soc0, soc1):
    soc, t, dt = soc0, 0.0, 10.0
    e_loss = 0.0
    mode_cv_at = None
    while soc < soc1 and t < 12 * 3600:
        v = ocv(soc)
        i = P_CELLS / (NS * v)                   # constant-power CC
        if v + i * R_CELL >= V_CV:               # CV: hold terminal at 4.20
            i = (V_CV - v) / R_CELL
            if mode_cv_at is None:
                mode_cv_at = soc
        e_loss += NS * i * i * R_CELL * dt / 3600.0
        soc += i * dt / 3600.0 / Q_AH
        t += dt
    return t / 3600.0, mode_cv_at, e_loss

t_typ, cv_typ, loss_typ = charge(soc_end_shift, CEIL)
t_worst, cv_worst, _ = charge(FLOOR, CEIL)
i_cc = P_CELLS / (NS * 3.8)
print(f"   {CAP:.0f} Wh = 13S x {Q_AH:.1f} Ah; {P_CELLS:.0f} W at the cells = "
      f"{i_cc:.1f} A = {i_cc/Q_AH:.2f} C - gentle by design")
print(f"   typical recharge (shift end {soc_end_shift:.0%} -> {CEIL:.0%}): "
      f"{t_typ:.1f} h;  worst (floor {FLOOR:.0%}): {t_worst:.1f} h")
print(f"   CV entry: {'not reached below the 95% ceiling' if cv_typ is None else f'{cv_typ:.0%}'}"
      f" -> at 0.2 C the charge is CC the whole way; the CV tail everyone")
print(f"   budgets for only exists above the ceiling we refuse to cross")
print(f"   pack heating while charging: I^2R = {NS*i_cc**2*R_CELL:.1f} W "
      f"(thermally invisible; the dock's own converter dissipates ~9 W)")
gap_h = (SOL_H - SHIFTS_PER_SOL * SHIFT_H) / SHIFTS_PER_SOL
print(f"   inter-shift gap {gap_h:.1f} h vs worst charge {t_worst:.1f} h -> "
      f"fits {gap_h/t_worst:.1f}x over; just-in-time scheduling has "
      f"{gap_h-t_worst:.1f} h of freedom")
print(f"   (the endgame ledger's '1.7 h at 150 W' assumed every watt reaches")
print(f"    the cells and none feeds the robot - off by {t_typ/1.7:.1f}x on a")
print(f"    typical recharge)")

# ===========================================================================
# 5. DOCKED POSTURE: the ledge is a power component
# ===========================================================================
print("\n=== 5. DOCKED POSTURE: why the dock has a ledge ===")
P_STAND_ACT = 52.8 - 15.8        # actuator holding power while standing (37 W)
P_ELEC_DOCKED = 9.4              # MCU 2.4 + radio 6 + BMS ~1; LiDAR/cam/visor asleep
print(f"   standing draw 52.8 W = 15.8 electronics + {P_STAND_ACT:.0f} W actuator holding")
print(f"   docked on the ledge (下托檐, already in the geometry): actuators")
print(f"   de-energized, sensors asleep -> {P_ELEC_DOCKED:.1f} W")
waste = P_STAND_ACT * (t_typ * SHIFTS_PER_SOL) / 1000.0
print(f"   without the ledge (actively standing while charging): "
      f"{P_STAND_ACT:.0f} W x {t_typ:.1f} h x 2/sol = {P_STAND_ACT*t_typ*2:.0f} Wh/sol wasted")
print(f"   = {P_STAND_ACT*t_typ*2/E_SHIFT:.0%} of a shift's energy, every sol,")
print(f"   plus longer charge (net {150-52.8:.0f} W instead of {150-P_ELEC_DOCKED:.0f} W).")
print(f"   The ledge is not furniture; it is a ~{P_STAND_ACT*t_typ*2*365/1000:.0f} kWh/yr component.")

# ===========================================================================
# 6. CONTACTS AND SAFETY
# ===========================================================================
print("\n=== 6. CONTACT INTERFACE: boring numbers, checked anyway ===")
V_BUS = 48.0
i_bus = 150.0 / V_BUS
R_CONTACT = 0.005
print(f"   bus {V_BUS:.0f} V DC < 60 V SELV -> touch-safe for a public foyer, no shroud needed")
print(f"   current {i_bus:.1f} A; contact I^2R = {i_bus**2*R_CONTACT*1000:.0f} mW per strip - nothing")
print(f"   BUT: 48 V / {i_bus:.1f} A is far above the ~15 V / 0.4 A DC arc minimum,")
print(f"   and DC arcs do not self-extinguish. Protocol, not hope:")
print(f"     - strips are DEAD until mate is verified (continuity + data handshake)")
print(f"     - dock relay closes only after verification; current ramps to zero")
print(f"       before any undock; departure only from charge-complete or command")
print(f"   wear: {SHIFTS_PER_SOL} matings/sol -> {SHIFTS_PER_SOL*365:.0f}/Earth-yr vs 1e5-rated")
print(f"   spring strips -> {1e5/(SHIFTS_PER_SOL*365):.0f} yr; the pack swap "
      f"(~{strategies['just-in-time']['sols_to_eol']} sols) retires first by ~100x")
print(f"   vertical strips wipe on mate - self-cleaning against undercity dust")
print(f"   capture: guidance chain delivers +/-8 cm; strip length 10 cm on a")
print(f"   30 cm ledge funnel -> geometric margin OK (same ledger that set 8 cm)")
print(f"   dock power lost: robot parks at floor SOC = {FLOOR*CAP*FADE_EOL:.0f} Wh EOL")
print(f"   = {FLOOR*CAP*FADE_EOL/P_ELEC_DOCKED:.0f} h of docked radio-beacon idle before brownout")

out = dict(
    window_audit=dict(cap=CAP4, window=[FLOOR4, CEIL4], usable_bol=round(usable_bol),
                      usable_eol=round(usable_eol), shift_Wh=round(E_SHIFT, 1),
                      bol_shift_h=round(usable_bol / P_SHIFT, 2),
                      finding="EOL sizing used 0-100% capacity, FEC count used DoD 0.70; "
                              "multiplied together the 4 h promise fails on day one"),
    resize=dict(cap=CAP, window=[FLOOR, CEIL], mass_kg=round(CAP / E_DENS, 2),
                shift_dod=round(dod_shift, 3), n_fec=round(n_dod),
                cycle_sols=round(cycle_sols),
                eol_margin=round((CAP * FADE_EOL * WINDOW - E_SHIFT) / E_SHIFT, 3),
                trade=trade),
    calendar=dict(model=CAL, strategies=strategies, gain_sols=gain),
    charge=dict(p_dock=150, p_docked=P_DOCKED, eta=ETA_CHAIN,
                p_cells=round(P_CELLS), c_rate=round(i_cc / Q_AH, 2),
                t_typical_h=round(t_typ, 2), t_worst_h=round(t_worst, 2),
                cv_below_ceiling=cv_typ, gap_h=round(gap_h, 1),
                pack_heat_W=round(NS * i_cc ** 2 * R_CELL, 1)),
    posture=dict(p_stand_actuators=round(P_STAND_ACT, 1), p_docked=P_ELEC_DOCKED,
                 ledge_saves_Wh_per_sol=round(P_STAND_ACT * t_typ * 2)),
    contacts=dict(v_bus=V_BUS, i_a=round(i_bus, 1), selv_ok=True,
                  arc_risk="48V/3.1A sustains a DC arc; dead-until-handshake + "
                           "zero-current undock", matings_per_yr=730,
                  reserve_h_at_floor=round(FLOOR * CAP * FADE_EOL / P_ELEC_DOCKED)))
with io.open(os.path.join(HERE, "charging_ledger.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("\nwrote charging_ledger.json")
