# Parse Yosys sky130 stat -> measured area vs the L1 scaling estimate.
import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
CHIP = os.path.dirname(HERE)

txt = io.open(os.path.join(CHIP, "syn", "reports", "sky130_stat.txt"),
              encoding="utf-8", errors="replace").read()

m = re.search(r"Chip area for top module .*?: ([0-9.]+)", txt)
area_um2 = float(m.group(1) if m else re.search(r"Chip area for .*?: ([0-9.]+)", txt).group(1))
cells = max(int(n) for n in re.findall(r"(\d+) [0-9.E+]+ cells", txt))
dffs = sum(int(n) for n, c in re.findall(r"(\d+) [0-9.E+]+\s+sky130_fd_sc_hd__(\w*df\w+)", txt))

# L1 (compute_budget.py) for the 2 ns-bin option:
l1 = dict(logic_cells=15 * 900 + 4000, logic_mm2=round((15*900+4000) * 15.77 / 1e6, 3),
          sram_kbit=round(15 * 70 * 16 / 1024, 1), sram_mm2=round(15*70*16/1024 * 1.14/64, 2),
          total_mm2=0.57)

meas_mm2 = area_um2 / 1e6
print(f"measured (Yosys sky130 HD): {cells:,} cells, {dffs:,} DFFs, "
      f"{area_um2:,.0f} um2 = {meas_mm2:.3f} mm2")
print(f"L1 scaling said: logic {l1['logic_cells']:,} cells {l1['logic_mm2']} mm2 "
      f"+ SRAM {l1['sram_kbit']} kbit {l1['sram_mm2']} mm2 = {l1['total_mm2']} mm2")
print(f"-> measured / L1 = {meas_mm2/l1['total_mm2']:.2f}x")

out = dict(measured=dict(cells=cells, dffs=dffs, area_um2=round(area_um2),
                         area_mm2=round(meas_mm2, 3)),
           l1=l1, ratio=round(meas_mm2 / l1["total_mm2"], 2))
with io.open(os.path.join(CHIP, "syn", "area_ledger.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("wrote syn/area_ledger.json")
