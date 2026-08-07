# dev-notes — TES/CMB detector materials (TES session, 2026-08-01)

Supply package per SITE.md §7. Project ledger: mars/STATUS.md 工具账本 TES 三行
(COMSOL / HFSS-pyaedt / gdstk+MC)。任务级接口定案值见 TES 项目
`REPLY_to_mission_sim.md`(与 cosmic_microwave session 联合冻结)。
Dark-matter lab images (pmt_hitmap etc.) in this folder belong to the deeplab
session — this file covers only `dev-*` files.

## Figures

| file | shows |
|---|---|
| dev-3d-overview.jpg | 3D scene: lens array, dual-band pixel, μMUX readout electronics (Blender) |
| dev-pixel-dualband-gds.png | Dual-band MFT 140/166 pixel GDS v2, cascade-verified geometry |
| dev-rf-chain.png | RF chain structural diagram: twin-slot → matching → diplexer tee → BPFs → TES islands |
| dev-tes-structure.png | TES island cross-section / thermal stack (AlMn TES, Pd ballast, Au strap, SiN legs) |
| dev-cascade-eta.png | Full-wave cascade v4 coupling efficiency vs frequency, both arms + crosstalk |
| dev-bpf-sparams.png | BPF140A / BPF166A S-parameters, high-convergence HFSS adjudication |
| dev-umux-chip.png | μMUX 64-resonator demo chip layout (4–8 GHz λ/4 CPW comb) |
| dev-squid-cell.png | rf-SQUID cell layout (washer + 4-turn input coil + flux-ramp line) |

## Numbers with anchors

Format: `number | meaning | produced by (project-relative)`

- 77.1% / 78.0% | full-wave cascade band-avg coupling, 140/166 arms (matches mission 0.80 link budget) | hfss/cascade_v4.py → cascade_v4.csv
- 119–152.4 / 152.4–190.9 GHz | Plan-A crossover band split at 152.4 GHz | mission_tes_design_v2.py
- 171 mK / 100 mK | AlMn TES Tc / bath temperature (mission baseline) | cosmic_microwave/design_tables csv (interface-frozen)
- 0.848 / 0.668 pW | P_sat per island, 140/166 | comsol/tes_island_dual140.java, tes_island_dual166.java → *_results.txt
- 742.6 / 953.4 μm | FEM-frozen leg lengths, nonuniform legs (RF 10 μm + 3×2 μm) | comsol/tes_island_dual140/166.java (two-point bracketing)
- ±0.3 mK (≈±0.4% G) | FEM mesh scatter, absorbed by witness calibration | comsol/*_results.txt convention
- 1.1 dB / ≤0.44 dB | worst in-band insertion pocket, BPF140A / BPF166A | hfss/bpf140A_final.py, bpf166A_wide.py → bpf140Afin.csv, bpf166Awide.csv
- −0.4 dB @ 405/515 GHz | 3f₀ harmonic re-entry (why a quasi-optical mesh LPF is required: fc 210–215 GHz, N≥12) | hfss/bpf_wideswp_v2.py → bpf140A_widesweep.csv, bpf166A_widesweep.csv
- 150 μm | feed open-tail length, swept optimum (≈λ/8, not the classic λ/4) | hfss/ant_feedZ_tailsweep.py → ant_feedZ_tail150.csv
- 90.5% / 89.0% | circuit-level band means after tail-150 re-optimization (full-wave degrades ~12 pts, junction parasitics) | hfss/diplexer_physical_opt_v3.py
- 3.718 GHz / Qc = 2×10⁴ / 3 MHz | μMUX resonator f₀ (HFSS-calibrated n_eff 2.733) / coupling Q / comb spacing | umux/umux_design.py, umux/res_eigen.py
- 48 MHz | min physical-neighbor frequency separation via bit-reversal scrambling | umux/umux_design.py → freq_plan_demo64.csv
- 60 pH / β_L 0.78 / M_in ≈ 250 pH | rf-SQUID washer inductance / screening / input coupling | umux/squid_design_v2.py, umux/neumann_mutuals.py
- 2.50 ± 0.07 (P_sat margin), P(saturate)=0 | thermal design immune to process spread | mc_tolerance.py
- 93.7% @ σ_f=1 MHz | μMUX channel yield vs comb scatter (why post-trim step + foundry Ls uniformity data are required) | mc_tolerance.py
- 72.6% / 42.0% | 119+195 antenna-reuse full-wave verdict (NEGATIVE: 195 band fails) | hfss/cascade_119_195_v2.py → cascade_119_195_v2.csv

PDK-sensitive values (Jc, oxide thickness, trilayer recipe): per PDK design
rules — see JJ_PDK_MAPPING.md in the TES project, not reproduced here.

## What broke (real rework, with round counts)

1. **Sub-micron synthesis trap** — first BPF166 synthesis picked a 0.55 μm
   connector line; Hammerstad breaks below ~1 μm and the filter showed a
   −2.9 dB in-band shelf. Re-synthesized with impedance bounds capped so all
   widths ≥1.0 μm; shelf gone (2 synthesis rounds + 2 HFSS solves).
2. **Cascade integration audit** — antenna, diplexer and BPFs each passed
   standalone, but the first full-wave assembly collapsed to 12–27% coupling.
   Four defects found over 4 cascade versions: 750 μm never-designed tee
   arms, a 390 μm feed line missing from the circuit model, two antenna
   versions (665 vs 684 μm) coexisting in different files, and the feed
   reference-impedance error below. v4 closed at 77/78%.
3. **The feed tail nobody designed** — a 40 μm microstrip stub past the last
   slot was a drawing leftover, never a designed element. It capped the 166
   band at 54.5% (Bode-Fano limit — no matching network could fix it). A
   3-point tail sweep found the optimum at 150 μm (≈λ/8; the textbook λ/4
   rule is shifted by slot loading), unlocking 89–90% circuit-level means.
4. **Circuit models flatter dead antennas** — for the 119+195 band-pair
   study, a 2-element matching analysis promised 80.5% on the 195 band;
   converged full-wave cascade returned 42.0% (antenna radiation resistance
   collapses to 6.6 Ω above 190 GHz). Negative result stands: the 684 μm
   twin-slot has ~48% usable bandwidth, so high bands need their own
   antenna. Feasibility verdicts must be full-wave, never circuit-only.
