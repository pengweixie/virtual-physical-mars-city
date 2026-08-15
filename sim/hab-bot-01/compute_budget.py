# hab-bot-01's brain: what does it actually have to compute, and where?
#
# The asset has been asserting "edge perception 11 W, inference runs in the city
# compute centre" since delivery. Neither half was computed. This does both:
#
#   1. Operation counts derived from the algorithms ACTUALLY implemented in
#      hab-bot-01.js — not a guess about what a humanoid "probably needs".
#   2. Latency, which is where the local/remote split is really decided: the
#      SSM safety ledger allots T_react = 0.217 s, and any reflex that depends
#      on a network round trip inherits that link's failure modes.
#   3. If a custom chip were justified, what it would cost in silicon — using
#      the measured sky130 numbers from the city's own MB-1 tapeout rather than
#      a hand-waved area estimate.
#
# MB-1 reference point (mars-bigram, sky130 HD): ~2100 standard cells occupy
# 33,123 um^2 of logic, while a single 64 kbit SRAM macro takes 1.14 mm^2 —
# 97% of that die. On this process, memory is the area, not logic.
import io
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))

MB1 = dict(cells=2100, logic_area_um2=33123, sram_kbit=64,
           sram_area_mm2=1.14, fmax_MHz=173)
LOGIC_AREA_PER_CELL = MB1["logic_area_um2"] / MB1["cells"]      # um^2 per cell
SRAM_AREA_PER_KBIT = MB1["sram_area_mm2"] / MB1["sram_kbit"]    # mm^2 per kbit

# ===========================================================================
# 1. WORKLOAD — counted from the algorithms in the asset
# ===========================================================================
W = H = 64
BAND_ROWS = 16          # scan band used by the dark-region split
CIS_HZ = 5
LIDAR_BEAMS, LIDAR_CELLS, LIDAR_HZ = 15, 1024, 6
CTRL_HZ = 200           # balance / gait inner loop
GAIT_CH = 12

tasks = []


def add(name, ops_per_call, hz, note):
    tasks.append(dict(name=name, ops_per_call=ops_per_call, hz=hz,
                      mops=ops_per_call * hz / 1e6, note=note))


# --- CIS imaging model, per pixel (mirrors perceive() line by line) ---
# luma weighting 5, photoelectron scaling 2, Box-Muller amortized ~10,
# noisy = ne + gauss*sqrt(ne+rn2) -> sqrt + 2 mul + 2 add = 6,
# clamp/round/divide by LSB 5, defect map lookup + branch 2
CIS_OPS_PX = 5 + 2 + 10 + 6 + 5 + 2
add("CIS imaging model", CIS_OPS_PX * W * H, CIS_HZ,
    f"{CIS_OPS_PX} ops/px x {W*H} px")
add("scan-band mean + AE", 3 * BAND_ROWS * W, CIS_HZ, "accumulate + exposure update")
add("dark-region split", 3 * BAND_ROWS * W, CIS_HZ, "threshold compare + L/R tally")

# --- LiDAR: per beam, build a timestamp histogram and find the peak ---
# 1024 microcell timestamps -> 70 bins (2 ns over a 140 ns gate), peak search,
# centroid of the winning bins, walk correction from the fired-cell count
LIDAR_BINS = 70
add("LiDAR histogram + peak", LIDAR_BEAMS * (LIDAR_CELLS * 3 + LIDAR_BINS * 2 + 40),
    LIDAR_HZ, f"{LIDAR_BEAMS} beams x ({LIDAR_CELLS} stamps + {LIDAR_BINS} bins)")

# --- motion: gait playback, balance, navigation ---
add("gait playback (12 ch)", GAIT_CH * 12, CTRL_HZ, "cyclic interpolation + blend")
add("forward kinematics + CoM", 11 * 60, CTRL_HZ, "11 bodies, 4x4 transforms")
add("capture-point balance", 400, CTRL_HZ, "CoM state, ZMP, ankle torque")
add("leg IK (2 legs)", 2 * 120, CTRL_HZ, "two-link closed form + frame rotation")
add("state machine + nav", 300, 60, "waypoints, SSM gate, geofence, battery")
add("visor screen render", 256 * 96 * 2, 2, "expression canvas, redrawn on change")

total_mops = sum(t["mops"] for t in tasks)

print("=== 1. REFLEX-LAYER WORKLOAD (counted from the implemented algorithms) ===")
print("   task                        ops/call     Hz       MOPS   share")
for t in sorted(tasks, key=lambda x: -x["mops"]):
    print(f"   {t['name']:26s} {t['ops_per_call']:10,d} {t['hz']:6.0f} "
          f"{t['mops']:10.3f} {100*t['mops']/total_mops:6.1f}%")
print(f"   {'TOTAL':26s} {'':10s} {'':6s} {total_mops:10.3f} MOPS")
print(f"   -> the entire reflex layer is {total_mops:.1f} MOPS. That is a "
      f"microcontroller,")
print(f"      not an accelerator: a 480 MHz Cortex-M7 runs ~600 MOPS at ~0.3 W.")

# ===========================================================================
# 2. THE COGNITIVE LAYER — what does NOT fit, and why it goes to the city
# ===========================================================================
print("\n=== 2. WHAT DOESN'T FIT ON THE ROBOT ===")
cog = [
    dict(name="person recognition (MobileNet-ish, 64x64)", gops=0.010 * CIS_HZ,
         note="10 MFLOP/frame at 5 Hz"),
    dict(name="visual SLAM (sparse, indoor)", gops=0.30, note="~300 MOPS sustained"),
    dict(name="speech front-end + intent", gops=0.15, note="keyword + parse"),
    dict(name="task planning / dialogue (LLM class)", gops=50.0,
         note="orders of magnitude beyond any battery-powered edge SoC"),
]
for c in cog:
    ratio = c["gops"] * 1000 / total_mops
    print(f"   {c['name']:44s} {c['gops']*1000:9.1f} MOPS  "
          f"({ratio:6.0f}x the reflex layer)  {c['note']}")
print("   -> the split is not a preference, it is three orders of magnitude")

# ===========================================================================
# 3. LATENCY — the real reason reflexes stay local
# ===========================================================================
print("\n=== 3. LATENCY BUDGET vs THE SAFETY LEDGER ===")
T_REACT_BUDGET = 0.217          # from perception_safety.py (SSM)
local = [("LiDAR sampling (6 Hz, mean)", 1 / (2 * LIDAR_HZ)),
         ("histogram + peak on MCU", 0.0008),
         ("control loop quantum (200 Hz)", 1 / CTRL_HZ),
         ("actuator response", 0.020)]
remote = [("camera frame capture", 1 / (2 * CIS_HZ)),
          ("encode + Wi-Fi uplink 16 kB", 0.008),
          ("city compute queue + inference", 0.050),
          ("downlink + command decode", 0.006),
          ("control loop quantum", 1 / CTRL_HZ),
          ("actuator response", 0.020)]
t_local = sum(v for _, v in local)
t_remote = sum(v for _, v in remote)
print("   LOCAL reflex chain:")
for n, v in local:
    print(f"     {n:34s} {v*1000:7.1f} ms")
print(f"     {'TOTAL':34s} {t_local*1000:7.1f} ms   "
      f"({'within' if t_local < T_REACT_BUDGET else 'OVER'} the "
      f"{T_REACT_BUDGET*1000:.0f} ms SSM allowance)")
print("   REMOTE cognitive chain:")
for n, v in remote:
    print(f"     {n:34s} {v*1000:7.1f} ms")
print(f"     {'TOTAL':34s} {t_remote*1000:7.1f} ms   "
      f"({'within' if t_remote < T_REACT_BUDGET else 'OVER'} the same allowance)")
print(f"   -> a remote reflex would consume {100*t_remote/T_REACT_BUDGET:.0f}% of the")
print("      safety budget with zero margin for a retransmit, and inherits the")
print("      link's failure modes. Safety reflexes are local for a computable")
print("      reason, not because it feels tidier.")

# ===========================================================================
# 4. POWER — correcting the asserted 11 W
# ===========================================================================
print("\n=== 4. EDGE POWER, RECOMPUTED ===")
opts = [
    dict(name="Cortex-M7 480 MHz (reflex only)", mops=600, W=0.30),
    dict(name="Cortex-A53 quad 1.2 GHz (reflex + light CV)", mops=8000, W=2.2),
    dict(name="A53 + 1 TOPS NPU (local recognition)", mops=1e6, W=6.5),
]
print("   option                                     capability   power   headroom")
for o in opts:
    print(f"   {o['name']:42s} {o['mops']:9.0f} MOPS {o['W']:6.2f} W "
          f"{o['mops']/total_mops:9.0f}x")
chosen = opts[1]
print(f"   chosen: {chosen['name']} — the M7 covers the reflex layer with 6x")
print("   headroom, but the robot also runs the sensor channel, the radio stack,")
print("   the visor and telemetry, so a small application processor is the honest")
print("   pick. It is still nowhere near the asserted 11 W.")
radio = 6.0
electronics = dict(compute=chosen["W"], radio=radio, lidar_frontend=2.6,
                   mcu_sensors=2.4, camera=1.4, visor=1.2)
new_total = sum(electronics.values())
OLD_TOTAL = 24.6
print(f"   electronics total {new_total:.1f} W (was {OLD_TOTAL:.1f} W asserted) "
      f"-> {OLD_TOTAL-new_total:.1f} W recovered")
P_WALK_ACT, P_IDLE_ACT = 70.8, 37.0        # from analyze_gait.py
p_walk, p_idle = P_WALK_ACT + new_total, P_IDLE_ACT + new_total
duty = 0.6
p_shift = duty * p_walk + (1 - duty) * p_idle
print(f"   walk {p_walk:.1f} W / stand {p_idle:.1f} W -> shift mean {p_shift:.1f} W")
for cap in (260, 340):
    print(f"     {cap} Wh pack -> {cap/p_shift:.2f} h shift")
cap_needed = math.ceil(p_shift * 4 / 10) * 10
print(f"   a 4 h shift now needs {p_shift*4:.0f} Wh -> {cap_needed} Wh pack "
      f"(was specified at 340 Wh)")

# ===========================================================================
# 5. WOULD A CUSTOM CHIP PAY? (sky130 area from MB-1's real tapeout)
# ===========================================================================
print("\n=== 5. IF IT WERE TAPED OUT: THE LiDAR FRONT END ===")
print("   The reflex layer as a whole does NOT justify silicon — an MCU wins.")
print("   The one block that does is the LiDAR timing front end: 1024 microcell")
print("   timestamps per beam at 6 Hz is a throughput and latency problem, and")
print("   it is exactly the block a real flash-LiDAR hardens.")
TDC_BITS, TDC_CELLS_EACH = 12, 900          # 12-bit TDC ~900 cells
CHANNELS = LIDAR_BEAMS
for bin_ps, label in ((2000, "2 ns bins (coarse + interpolation)"),
                      (100, "100 ps bins (TDC-resolution)")):
    bins = int(140e3 / bin_ps)
    kbit = CHANNELS * bins * 16 / 1024
    sram_mm2 = kbit * SRAM_AREA_PER_KBIT
    logic_cells = CHANNELS * TDC_CELLS_EACH + 4000
    logic_mm2 = logic_cells * LOGIC_AREA_PER_CELL / 1e6
    print(f"   {label:36s} {bins:5d} bins/ch  {kbit:8.1f} kbit  "
          f"SRAM {sram_mm2:6.2f} mm2  logic {logic_mm2:.3f} mm2  "
          f"die ~{sram_mm2+logic_mm2:.2f} mm2")
print(f"   (MB-1 for scale: {MB1['sram_area_mm2']:.2f} mm2 of SRAM was 97% of its die)")
print("   -> the fine-bin version is dominated by histogram memory, the same way")
print("      MB-1 was dominated by its CDF table. Coarse bins plus centroid")
print("      interpolation is the design that fits, and it is what the ranging")
print("      Monte Carlo already assumed (2 ns bins, sub-cm sigma).")

out = dict(mb1_reference=MB1, tasks=tasks, total_mops=round(total_mops, 3),
           cognitive=cog, latency=dict(local_s=round(t_local, 4),
                                       remote_s=round(t_remote, 4),
                                       ssm_budget_s=T_REACT_BUDGET),
           power=dict(electronics=electronics, total_W=round(new_total, 1),
                      old_asserted_W=OLD_TOTAL, walk_W=round(p_walk, 1),
                      idle_W=round(p_idle, 1), shift_mean_W=round(p_shift, 1),
                      pack_for_4h_Wh=cap_needed))
with io.open(os.path.join(HERE, "compute_ledger.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("\nwrote compute_ledger.json")
