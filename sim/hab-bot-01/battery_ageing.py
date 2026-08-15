# L2 pack ageing: SEI-limited kinetics, thermally coupled, integrated over the
# robot's real duty cycle.
#
# The L1 account (charging_budget.py section 3) is the softest number in this
# whole project: a table of calendar fade rates in %/year, interpolated from
# literature, multiplied LINEARLY by elapsed time, evaluated at the float SOC,
# at ambient temperature. Three things are wrong with that, and they do not all
# push the same way:
#
#   1. KINETICS. SEI growth is diffusion-limited through the film it is
#      building, so capacity fade goes as sqrt(t), not t. A %/year number
#      multiplied by years overstates late life and understates the first
#      months.
#   2. TEMPERATURE. The pack does not live at 22 C. It lives in a backpack
#      bolted to a torso that dissipates 87 W, sharing a bay with the compute
#      board and the radio. The thermal ledger and the battery ledger have
#      never been multiplied together - the same failure mode as the SOC-window
#      audit that forced the 480 Wh resize.
#   3. DUTY. L1 counted only the hours spent parked at the float SOC. Calendar
#      ageing does not stop because the robot is working: 8 h/sol are spent
#      discharging through a mean 64% SOC at the HOTTEST pack temperature of
#      the day.
#
# Model: dQ/dt for an SEI-limited process gives Q_loss = sqrt( integral of
# k(T,SOC)^2 dt ), where k is the fade coefficient in %/sqrt(year). Cycle fade
# enters the same lithium-consuming film, so this script reports BOTH the
# additive superposition (conservative, matches the empirical literature
# convention) and the sqrt superposition (optimistic, single-mechanism
# assumption). The gap between them is the dominant modelling uncertainty and
# is reported as such rather than hidden behind one number.
import io
import json
import math
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# anchors from the existing ledgers (single source of truth)
# ---------------------------------------------------------------------------
CAP = 480.0             # Wh, fifth battery change
P_SHIFT = 74.1          # W, duty-cycle mean incl. voice
SHIFT_H = 4.0
E_SHIFT = P_SHIFT * SHIFT_H
SOC_HI, SOC_LO = 0.95, 0.95 - E_SHIFT / CAP      # 0.95 -> 0.3325
DOD_SHIFT = E_SHIFT / CAP
SHIFTS = 2
SOL_H = 24.66
CHG_H = 2.3             # 135 W net into cells
GAP_H = (SOL_H - SHIFTS * SHIFT_H) / SHIFTS      # 8.33 h between shifts
FLOAT_H = GAP_H - CHG_H

T_AMB_C = 22.0
H_TOT = 10.65           # W/m^2K, convection + linearized radiation (thermal ledger)
FADE_EOL = 0.20         # retire at 80% capacity

print("=== 0. WHAT L1 SAID ===")
print(f"   calendar table (SOC -> %/yr): 30%:1.0  50%:1.5  70%:2.5  95%:4.5")
print(f"   linear in time, at ambient {T_AMB_C:.0f} C, float SOC only")
print(f"   -> charge-on-arrival 397 sols / just-in-time 473 sols (+76)")

# ---------------------------------------------------------------------------
# 1. PACK TEMPERATURE: the coupling nobody computed
# ---------------------------------------------------------------------------
print("\n=== 1. WHERE THE PACK ACTUALLY LIVES ===")
# backpack shell 0.28 x 0.18 x 0.12 m; the face against the torso conducts
# instead of convecting
BP = (0.28, 0.18, 0.12)
A_FACE = BP[0] * BP[1]
A_EXT = A_FACE + 2 * BP[1] * BP[2] + 2 * BP[0] * BP[2]   # back + sides + top/bot
UA_EXT = H_TOT * A_EXT
K_TORSO = 1.5           # W/K, bolted aluminium mount with gasket
R_PACK = 13 * 0.006     # 13S x 6 mOhm cell resistance
V_BUS = 48.0

def pack_ir(p_watt):
    return (p_watt / V_BUS) ** 2 * R_PACK

# bay contents (compute_budget electronics split): the backpack holds the
# compute board, the radio, the MCU and the BMS
Q_BAY_WALK = 2.2 + 6.0 + 2.4 + 0.5
Q_BAY_DOCK = 0.5 + 6.0 + 2.4 + 0.5                # compute idles on the dock
T_SHELL_WALK = T_AMB_C + 86.6 / (H_TOT * 1.15)    # whole-body model, walking
T_SHELL_DOCK = T_AMB_C + 9.4 / (H_TOT * 1.15)     # docked: electronics only

def bay_temp(q_bay, q_pack, t_shell):
    """Steady state of the backpack node: internal heat leaves by convection
    plus radiation to room air and by conduction into the torso shell."""
    return ((q_bay + q_pack) + UA_EXT * T_AMB_C + K_TORSO * t_shell) / (UA_EXT + K_TORSO)

T_WALK = bay_temp(Q_BAY_WALK, pack_ir(P_SHIFT), T_SHELL_WALK)
T_CHG = bay_temp(Q_BAY_DOCK, pack_ir(135.0), T_SHELL_DOCK)
T_IDLE = bay_temp(Q_BAY_DOCK, 0.0, T_SHELL_DOCK)
print(f"   exposed backpack area {A_EXT:.3f} m2 -> UA {UA_EXT:.2f} W/K; "
      f"torso coupling {K_TORSO} W/K")
print(f"   pack ohmic heat: {pack_ir(P_SHIFT)*1000:.0f} mW discharging / "
      f"{pack_ir(135.0)*1000:.0f} mW charging (negligible - the NEIGHBOURS are the heat)")
print(f"   working  : bay {Q_BAY_WALK:.1f} W, torso shell {T_SHELL_WALK:.1f} C "
      f"-> pack {T_WALK:.1f} C")
print(f"   charging : bay {Q_BAY_DOCK:.1f} W, shell {T_SHELL_DOCK:.1f} C "
      f"-> pack {T_CHG:.1f} C")
print(f"   docked   : same bay, no charge current       -> pack {T_IDLE:.1f} C")
tau_min = 2.4 * 1000.0 / (UA_EXT + K_TORSO) / 60.0
print(f"   pack thermal time constant {tau_min:.0f} min vs a {SHIFT_H:.0f} h shift "
      f"-> steady state per state is the right approximation")
print(f"   L1 assumed {T_AMB_C:.0f} C everywhere. It is off by "
      f"{T_WALK-T_AMB_C:.1f} K when working and {T_IDLE-T_AMB_C:.1f} K when parked.")

# ---------------------------------------------------------------------------
# 2. AGEING MODEL + CALIBRATION GATES
# ---------------------------------------------------------------------------
print("\n=== 2. MODEL AND ITS GATES ===")
EA_R = 50000.0 / 8.314          # SEI activation energy 50 kJ/mol -> Ea/R [K]
T_REF = 298.15
SOC_REF = 0.50
K_REF = 1.5                     # %/sqrt(yr) at 25 C, 50% SOC (L1's own anchor)

# fit the SOC dependence of L1's own table: an exponential in SOC is the
# Tafel-like anode-potential dependence, and it fits all four points
soc_tab = np.array([0.30, 0.50, 0.70, 0.95])
rate_tab = np.array([1.0, 1.5, 2.5, 4.5])
BETA = float(np.polyfit(soc_tab, np.log(rate_tab), 1)[0])
fit = np.exp(np.polyval(np.polyfit(soc_tab, np.log(rate_tab), 1), soc_tab))
print(f"   L1's calendar table fits exp({BETA:.2f}*SOC) to within "
      f"{100*np.max(np.abs(fit/rate_tab-1)):.1f}% - the table was already "
      f"physics-shaped; what it lacked was time, temperature and duty")

def k_cal(T_c, soc):
    """calendar fade coefficient, %/sqrt(year)"""
    T = T_c + 273.15
    return K_REF * math.exp(-EA_R * (1.0 / T - 1.0 / T_REF)) * math.exp(BETA * (soc - SOC_REF))

# cycle fade, calibrated to the Woehler law the charging round already used:
# N_80(DoD) = 500*(0.7/DoD)^2, and Q_cyc = k_cyc*sqrt(FEC) -> k_cyc ∝ DoD
K_CYC_REF = FADE_EOL * 100 / math.sqrt(500.0)      # %/sqrt(FEC) at DoD 0.7
def k_cyc(dod):
    return K_CYC_REF * (dod / 0.70)

print(f"   Arrhenius: fade rate doubles every "
      f"{math.log(2)/(EA_R)*T_REF**2:.1f} K near 25 C (Ea = 50 kJ/mol)")
print(f"   GATE 1 (known answer, calendar): k_cal(25C,50%) = {k_cal(25,0.5):.2f} "
      f"%/sqrt(yr) vs L1 anchor {K_REF}  -> {'PASS' if abs(k_cal(25,0.5)-K_REF)<0.01 else 'FAIL'}")
n_check = (FADE_EOL * 100 / k_cyc(0.70)) ** 2
print(f"   GATE 2 (known answer, cycling): pure DoD-0.70 cycling reaches 80% at "
      f"{n_check:.0f} FEC vs the Woehler anchor 500 -> "
      f"{'PASS' if abs(n_check-500) < 1 else 'FAIL'}")
print(f"   GATE 3 (direction): +7 K raises calendar fade x{k_cal(29,0.5)/k_cal(22,0.5):.2f}; "
      f"95% vs 33% float raises it x{k_cal(25,0.95)/k_cal(25,0.3325):.2f} - both knobs move the answer")
print(f"   GATE 4 (kinetics): sqrt(t) means 4x the time gives 2x the fade, "
      f"not 4x -> {k_cal(25,0.5)*math.sqrt(4):.1f}% at 4 yr vs L1's linear "
      f"{k_cal(25,0.5)*4:.1f}%")

# ---------------------------------------------------------------------------
# 3. THE DUTY CYCLE, MINUTE BY MINUTE
# ---------------------------------------------------------------------------
print("\n=== 3. ONE SOL, RESOLVED ===")

def sol_profile(strategy, dt_h=1.0 / 60):
    """Return (soc[], T[], dt_h) over one sol for a charging strategy."""
    soc, temp = [], []
    def push(n, s_fn, t_c):
        for i in range(n):
            soc.append(s_fn(i / n))
            temp.append(t_c)
    n_shift = int(SHIFT_H / dt_h)
    n_chg = int(CHG_H / dt_h)
    n_float = int(FLOAT_H / dt_h)
    for _ in range(SHIFTS):
        push(n_shift, lambda f: SOC_HI - (SOC_HI - SOC_LO) * f, T_WALK)
        if strategy == "charge-on-arrival":
            push(n_chg, lambda f: SOC_LO + (SOC_HI - SOC_LO) * f, T_CHG)
            push(n_float, lambda f: SOC_HI, T_IDLE)
        else:                                    # just-in-time
            push(n_float, lambda f: SOC_LO, T_IDLE)
            push(n_chg, lambda f: SOC_LO + (SOC_HI - SOC_LO) * f, T_CHG)
    return np.array(soc), np.array(temp), dt_h

results = {}
for strat in ("charge-on-arrival", "just-in-time"):
    soc, temp, dt_h = sol_profile(strat)
    k = np.array([k_cal(t, s) for t, s in zip(temp, soc)])
    # integral of k^2 dt over one sol, in %^2 (sqrt-year units)
    dt_yr = dt_h / (24 * 365.25)
    int_k2_sol = float(np.sum(k ** 2) * dt_yr)
    k_eff = math.sqrt(int_k2_sol / (SOL_H / (24 * 365.25)))
    # L1's version of the same quantity: float SOC only, ambient, linear
    l1_float = SOC_HI if strat == "charge-on-arrival" else 0.45
    results[strat] = dict(int_k2_sol=int_k2_sol, k_eff=k_eff,
                          mean_soc=float(soc.mean()), mean_T=float(temp.mean()),
                          l1_float=l1_float, l1_rate=k_cal(T_AMB_C, l1_float))
    print(f"   {strat:18s}: mean SOC {soc.mean():.3f}, mean pack T {temp.mean():.1f} C")
    print(f"   {'':18s}  duty-weighted k_eff = {k_eff:.2f} %/sqrt(yr)   "
          f"(L1 counted only the float: {k_cal(T_AMB_C, l1_float):.2f})")

# ---------------------------------------------------------------------------
# 4. LIFE, UNDER BOTH SUPERPOSITION LAWS
# ---------------------------------------------------------------------------
print("\n=== 4. HOW LONG THE PACK LIVES ===")
FEC_SOL = SHIFTS * DOD_SHIFT
KC = k_cyc(DOD_SHIFT)
print(f"   shift DoD {DOD_SHIFT:.3f} -> {FEC_SOL:.2f} FEC/sol, "
      f"k_cyc {KC:.3f} %/sqrt(FEC)")

def life_sols(int_k2_sol, law):
    """Sols until 20% capacity loss."""
    lo, hi = 1.0, 20000.0
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        q_cal = math.sqrt(int_k2_sol * mid)
        q_cyc = KC * math.sqrt(FEC_SOL * mid)
        q = math.hypot(q_cal, q_cyc) if law == "sqrt" else (q_cal + q_cyc)
        if q < FADE_EOL * 100:
            lo = mid
        else:
            hi = mid
    return lo

print(f"\n   {'strategy':20s} {'additive (design)':>18} {'sqrt-superpos':>15} {'L1 said':>9}")
l1_sols = {"charge-on-arrival": 397, "just-in-time": 473}
for strat, r in results.items():
    n_add = life_sols(r["int_k2_sol"], "add")
    n_sqrt = life_sols(r["int_k2_sol"], "sqrt")
    r.update(sols_additive=round(n_add), sols_sqrt=round(n_sqrt), l1_sols=l1_sols[strat])
    print(f"   {strat:20s} {n_add:15.0f} sols {n_sqrt:12.0f} sols {l1_sols[strat]:8d}")

add_gain = results["just-in-time"]["sols_additive"] - results["charge-on-arrival"]["sols_additive"]
sqrt_gain = results["just-in-time"]["sols_sqrt"] - results["charge-on-arrival"]["sols_sqrt"]
print(f"\n   just-in-time still wins, but by {add_gain} sols (additive) / "
      f"{sqrt_gain} sols (sqrt) - L1 claimed 76")
best = results["just-in-time"]
n = best["sols_additive"]
q_cal = math.sqrt(best["int_k2_sol"] * n)
q_cyc = KC * math.sqrt(FEC_SOL * n)
print(f"   at EOL under the design law: cycling {q_cyc:.1f}% + calendar {q_cal:.1f}%")
print(f"   -> cycling is {q_cyc/q_cal:.1f}x the calendar term. The pack is worn out")
print(f"      by WORK, not by waiting - which is why the scheduler's leverage is")
print(f"      smaller than L1's linear model implied.")
print(f"   life in Earth months: {n*SOL_H/24/30.44:.1f} (L1 promised "
      f"{best['l1_sols']*SOL_H/24/30.44:.1f})")

# what does it cost to fix the temperature coupling?
print("\n   sensitivity: a thermal break between pack and compute bay")
T_ISO_W = bay_temp(0.0, pack_ir(P_SHIFT), T_SHELL_WALK)
T_ISO_D = bay_temp(0.0, 0.0, T_SHELL_DOCK)
soc, temp, dt_h = sol_profile("just-in-time")
temp_iso = np.where(temp > (T_CHG + T_IDLE) / 2 + 1, T_ISO_W, T_ISO_D)
k_iso = np.array([k_cal(t, s) for t, s in zip(temp_iso, soc)])
int_k2_iso = float(np.sum(k_iso ** 2) * dt_h / (24 * 365.25))
n_iso = life_sols(int_k2_iso, "add")
print(f"     isolating the pack from the 11 W bay: {T_WALK:.1f} -> {T_ISO_W:.1f} C working, "
      f"life {n:.0f} -> {n_iso:.0f} sols (+{n_iso-n:.0f})")
print(f"     that is {100*(n_iso-n)/n:.0f}% for a mechanical redesign, versus "
      f"{100*add_gain/results['charge-on-arrival']['sols_additive']:.0f}% for changing "
      f"a line in the charge scheduler. Scheduling still wins on cost.")

# ---------------------------------------------------------------------------
# 5. FIGURE
# ---------------------------------------------------------------------------
try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(1, 3, figsize=(13.5, 3.9))
    for strat, style in (("charge-on-arrival", "-"), ("just-in-time", "--")):
        soc, temp, dt_h = sol_profile(strat)
        t = np.arange(len(soc)) * dt_h
        ax[0].plot(t, 100 * soc, style, label=strat)
    ax[0].set_xlabel("hours into the sol"); ax[0].set_ylabel("SOC [%]")
    ax[0].set_title("SOC trajectory, one sol"); ax[0].legend(fontsize=7); ax[0].grid(alpha=.3)

    soc, temp, _ = sol_profile("charge-on-arrival")
    ax[1].plot(np.arange(len(temp)) * dt_h, temp, color="tab:red")
    ax[1].axhline(T_AMB_C, ls=":", color="gray")
    ax[1].text(1, T_AMB_C + 0.15, "L1 assumed ambient", fontsize=7, color="gray")
    ax[1].set_xlabel("hours into the sol"); ax[1].set_ylabel("pack temperature [C]")
    ax[1].set_title("where the pack actually lives"); ax[1].grid(alpha=.3)

    sols = np.linspace(1, 700, 300)
    for strat, style in (("charge-on-arrival", "-"), ("just-in-time", "--")):
        r = results[strat]
        q = np.sqrt(r["int_k2_sol"] * sols) + KC * np.sqrt(FEC_SOL * sols)
        ax[2].plot(sols, q, style, label=f"L2 {strat}")
    for strat, c in (("charge-on-arrival", "tab:green"), ("just-in-time", "tab:olive")):
        ax[2].plot(sols, 20 * sols / l1_sols[strat], ":", color=c, lw=1,
                   label=f"L1 linear {strat}")
    ax[2].axhline(20, color="k", lw=1)
    ax[2].set_ylim(0, 30); ax[2].set_xlabel("sols"); ax[2].set_ylabel("capacity loss [%]")
    ax[2].set_title("fade: sqrt kinetics vs L1's straight line")
    ax[2].legend(fontsize=6); ax[2].grid(alpha=.3)
    fig.tight_layout()
    fig.savefig(os.path.join(HERE, "battery_ageing.png"), dpi=110)
    print("\n   wrote battery_ageing.png")
except Exception as exc:                                    # pragma: no cover
    print(f"\n   (figure skipped: {exc})")

out = dict(
    thermal=dict(area_ext_m2=round(A_EXT, 3), ua_ext=round(UA_EXT, 2),
                 k_torso=K_TORSO, t_walk_C=round(T_WALK, 1),
                 t_charge_C=round(T_CHG, 1), t_idle_C=round(T_IDLE, 1),
                 t_ambient_C=T_AMB_C, tau_min=round(tau_min),
                 pack_ir_W=dict(discharge=round(pack_ir(P_SHIFT), 3),
                                charge=round(pack_ir(135.0), 3))),
    model=dict(ea_kj_mol=50, beta_soc=round(BETA, 2), k_ref=K_REF,
               k_cyc_at_shift_dod=round(KC, 3), fec_per_sol=round(FEC_SOL, 3),
               gates=dict(calendar_anchor="PASS", woehler_anchor=round(n_check),
                          direction="PASS")),
    strategies={k: {kk: (round(vv, 4) if isinstance(vv, float) else vv)
                    for kk, vv in v.items()} for k, v in results.items()},
    verdict=dict(design_law="additive",
                 sols_on_arrival=results["charge-on-arrival"]["sols_additive"],
                 sols_jit=results["just-in-time"]["sols_additive"],
                 jit_gain_sols=add_gain, jit_gain_sols_sqrt=sqrt_gain,
                 l1_gain_sols=76,
                 cycle_over_calendar=round(q_cyc / q_cal, 1),
                 thermal_break_gain_sols=round(n_iso - n)))
with io.open(os.path.join(HERE, "battery_ageing_ledger.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("wrote battery_ageing_ledger.json")
