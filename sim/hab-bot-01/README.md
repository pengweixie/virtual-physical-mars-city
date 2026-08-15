# hab-bot-01 — the ledgers behind the numbers

Every quantitative claim on [docs/perception.html](../../docs/perception.html) and in
`viewer/units/hab-bot-01.info.json` cites one of the scripts here. This directory is
that citation made reachable: each file re-runs and reprints the numbers the page
quotes.

`WORKLOG.md` is the round-by-round history, including the numbers that turned out
wrong and what replaced them.

## Layout

| Path | What it produces |
|---|---|
| `run_gait.py` + `hab_bot.xml` | MuJoCo gait bake (walk/turn/idle, Mars g=3.71) → `hab-bot-01.gait.json` |
| `analyze_gait.py` | Measured power from ∫τ·ω + copper + quiescent → `dynamics_ledger.json` |
| `balance_ctrl.py`, `balance_trim.py`, `stepping_ctrl.py` + `hab_bot_balance.xml` | Capture-point balance, push recovery, capture-step walking |
| `running_ctrl.py` | Raibert running (SLIP), Mars vs Earth flight fraction |
| `fall_dynamics.py` | Inverted-pendulum fall, RK4 cross-checked against the energy solution |
| `lidar_ranging.py` | Flash-LiDAR ranging Monte Carlo (Geiger SPAD, pile-up, walk correction) |
| `perception_safety.py` | Indoor photometry, motion blur, ISO/TS 15066 speed-and-separation |
| `hri_proxemics.py` | Proxemics vs engineering separation, PFL contact forces, gaze geometry |
| `compute_budget.py` | Per-algorithm op counts, latency chains, sky130 area scaling |
| `thermal_budget.py` | Lumped thermal, per-joint breakdown, Earth comparison, grasp check |
| `comsol/hip_thermal.java` | COMSOL conjugate-heat FEM of the hip (3 cases + gates) |
| `comsol/fin_check.py`, `comsol/postprocess.py` | Analytic fin cross-check, result parsing |
| `grasp_audit.py` | MuJoCo contact: hand-acceleration harvest, moment ledger, carry sweep |
| `voice_budget.py`, `voice_acoustics_l2.py` | Voice L1 dB budget, then image-source room acoustics + 48 kHz mic array |
| `charging_budget.py` | SOC-window audit, CC-CV charge, dock and contact safety |
| `battery_ageing.py` | SEI √t kinetics, thermally coupled, integrated over the duty cycle |
| `endgame_budget.py` | Pack end-of-life sizing, odometry drift vs docking tolerance |
| `chip/` | The LiDAR front end as RTL → sky130 synthesis → OpenROAD → GDS |
| `_preview.html` | Standalone harness that runs the asset outside the city viewer |

The `*_ledger.json` files are the outputs, checked in so a reader can compare
without re-running.

## Re-running

Python ledgers need `numpy`, `mujoco`, and `matplotlib` (the last only for the
two figures):

```bash
python run_gait.py          # writes hab-bot-01.gait.json + a JS snippet
python analyze_gait.py      # power, CoT, payload comparison
python battery_ageing.py    # pack life + battery_ageing.png
```

The COMSOL model compiles and runs headless:

```bash
comsolcompile comsol/hip_thermal.java
comsolbatch -inputfile comsol/hip_thermal.class -batchlog run.log
```

The chip flow is documented in `chip/pnr/RESULTS.md` (nine P&R rounds, including
the eight that failed). Published copies of the shell scripts use `$env:`
placeholders — `SKY130A`, `OSS_CAD_SUITE`, `MB1_REPO` — in place of machine paths;
set them before running.

```bash
python chip/tools/golden.py            # golden model self-test + test vectors
iverilog -g2012 -o s.vvp chip/rtl/lidar_fe.v chip/tb/tb_lidar_fe.sv && vvp s.vvp
pwsh chip/syn/run_syn.ps1              # Yosys → sky130 standard cells
```

## A caveat worth stating

These are engineering ledgers for a digital-twin asset, not a qualification
campaign. Parameters come from datasheets, standards and published cell data;
nothing here has been checked against a physical robot. Where a result depends on
a modelling choice rather than on data — the calendar/cycle superposition law in
`battery_ageing.py` is the clearest case — the script reports both and books the
conservative one.
