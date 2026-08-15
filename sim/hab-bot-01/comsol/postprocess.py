# Post-process hip_thermal.java RESULT lines -> hip_thermal_fem.json
# and render the L1-vs-L2 verdict table.
import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
T_AMB = 295.15
R_INT = 0.55            # winding->housing series resistance (L1 assumption, kept)
MOTOR_LIMIT = 120.0

cases = {}
cur = None
for line in io.open(os.path.join(HERE, "hip_thermal.out"), encoding="utf-8-sig"):
    m = re.match(r"\s*RESULT (\S+) = (.+)", line.strip())
    if not m:
        continue
    key, val = m.groups()
    if key == "case":
        cur = val.strip()
        cases[cur] = {}
    else:
        try:
            cases[cur][key] = float(val)
        except ValueError:
            cases[cur][key] = val.strip()   # SKIP lines survive visibly

L1 = dict(P=22.92, dT_limb=15.7, T_winding=50.3, dT_alone=71.7,
          earth_P=129.9, earth_T=183.1, duty_max=1.0)

print(f"{'':22s} {'A Mars real':>12} {'B iso gate':>12} {'C Earth':>12}")
rows = []
for name in ("A_mars_real", "B_iso_gate", "C_earth"):
    c = cases[name]
    P_in = 22.92 if name != "C_earth" else 129.9
    closure = c["P_out_W"] / P_in
    dT_src = c["T_shell_mean_K"] - T_AMB
    dT_root = c["T_root_K"] - T_AMB
    dT_tip = c["T_tip_K"] - T_AMB
    dT_limb = c["T_limb_mean_K"] - T_AMB
    eta_fin = dT_limb / dT_root if dT_root else float("nan")
    UA = P_in / dT_src
    T_wind = c["T_shell_mean_K"] - 273.15 + P_in * R_INT
    c.update(P_in=P_in, closure=round(closure, 4), dT_src=round(dT_src, 1),
             dT_root=round(dT_root, 1), dT_tip=round(dT_tip, 1),
             dT_limb=round(dT_limb, 1), eta_fin=round(eta_fin, 3),
             UA=round(UA, 3), T_winding_C=round(T_wind, 1))
    rows.append((name, c))

def line_of(label, fmt, key):
    print(f"{label:22s} " + " ".join(f"{fmt.format(cases[n][key]):>12}" for n in
          ("A_mars_real", "B_iso_gate", "C_earth")))

line_of("energy closure", "{:.3f}", "closure")
line_of("A_ext [m2]", "{:.4f}", "A_ext_m2")
line_of("dT source [K]", "{:.1f}", "dT_src")
line_of("dT thigh root [K]", "{:.1f}", "dT_root")
line_of("dT thigh tip [K]", "{:.1f}", "dT_tip")
line_of("dT thigh mean [K]", "{:.1f}", "dT_limb")
line_of("fin efficiency", "{:.3f}", "eta_fin")
line_of("UA [W/K]", "{:.3f}", "UA")
line_of("T winding [degC]", "{:.1f}", "T_winding_C")

A = cases["A_mars_real"]
B = cases["B_iso_gate"]
C = cases["C_earth"]
print(f"\nL1 said: dT_limb {L1['dT_limb']} K, winding {L1['T_winding']} degC, "
      f"Earth {L1['earth_T']} degC")
print(f"analytic fin cross-check said: eta 0.529, dT_src 19.1 K (same areas)")

# duty ceiling recomputed with FEM UA
p_walk_hip, p_idle_hip = 22.92, 1.1
p_allow = (MOTOR_LIMIT - (T_AMB - 273.15)) / (1 / A["UA"] + R_INT)
duty = min(1.0, (p_allow - p_idle_hip) / (p_walk_hip - p_idle_hip))
print(f"duty ceiling with FEM UA: hip may dissipate {p_allow:.1f} W cont. "
      f"-> max walking duty {100*duty:.0f}% (shift assumes 60%)")

out = dict(cases=cases, l1=L1, r_int=R_INT,
           duty=dict(p_allow_W=round(p_allow, 1), duty_max=round(duty, 3)))
with io.open(os.path.join(HERE, "..", "hip_thermal_fem.json"), "w",
             encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("\nwrote sim/hip_thermal_fem.json")
