# dev-notes — Weather station materials (sci-weather-01, mars-weather session, 2026-08-05)

Supply package per SITE.md §7. Project ledger: mars/STATUS.md 工具账本
「Python/NumPy 解析物理(sci-weather 另册)」行(14 账)。This file covers only
the `dev-weather-*` files in this folder — other science images (obs-*, station.jpg,
linkbudget.png etc.) belong to the observatory/lidar sessions.

## Figures

| file | shows |
|---|---|
| dev-weather-station.jpg | In-city view: 10 m lattice mast station on the NE highland (300,-300), guys, met poles, equipment cabin |
| dev-weather-web-cutaway.jpg | Equipment cabin with access hatch open: box-in-a-box WEB (aerogel shell, twin batteries, DAQ, heater plate) |
| dev-weather-baro-cutaway.jpg | Barometer enclosure cutaway: copper thermostat block, twin Si capsules, intake buffer, CDC board |
| dev-weather-hotfilm.png | Hot-film Nu–Re at 610 Pa CO₂ (Collis-Williams × Churchill-Bernstein), power budget, velocity resolution |
| dev-weather-cta.png | CTA servo: open-loop thermal inertia vs closed-loop time constant, bandwidth, strut-conduction share |
| dev-weather-tau.png | Beer-Lambert transmission vs τ (clear → global dust storm), retrieval uncertainty, LED-takeover trigger at τ=3 |
| dev-weather-langley.png | Quad-cell tracking response + Langley self-calibration Monte Carlo (stable vs hazy mornings) |
| dev-weather-web-thermal.png | Whole-cabin vs WEB insulation trade at −80 °C night; heater/battery night budget |
| dev-weather-paschen.png | Paschen breakdown of CO₂ at 610 Pa (storm-field ceiling) + E-field probe RC response |
| dev-weather-network.png | 4-station network geometry and plane-front triangulation MC (speed/heading sigma) |

## Numbers with anchors

Format: `number | meaning | produced by (project-relative, mars-weather)`

- 0.01468 kg/m³ / Kn=4.6e-3 | surface CO₂ density at 610 Pa, 220 K; slip-flow edge for d=1 mm film | sim_hotfilm.py → out/hotfilm.json
- Nu=1.58 @ Re 6.7 (5 m/s) | cylinder hot-film, Collis-Williams cross-checked with Churchill-Bernstein | sim_hotfilm.py
- 21.6→44.1 mW, 0.13 m/s | element power 5→30 m/s and velocity resolution at 1% bridge noise | sim_hotfilm.py
- 17–48 s → 29.5 ms | open-loop thermal inertia vs CTA closed-loop time constant (2a·G≈925), f3dB 5.4 Hz | sim_cta_response.py → out/cta_response.json
- 33–65% | strut-conduction share of total heat loss = King's-law zero-wind intercept | sim_cta_response.py
- σ_θ 1.4–1.8°, σ_v 1.3% | 3-chip cosine direction retrieval, MC N=4000 at 1% noise | sim_wind_direction.py → out/wind_direction.json
- 83.4× / 3.44 vs 0.79 m/s | Mars/Earth dynamic-pressure ratio; Earth-standard vs oversized cup start threshold | sim_cup_start.py → out/cup_start.json
- 5.1 decades / σ_τ≈0.011 | photometer signal span clear→storm; retrieval uncertainty (0.5% radiometric + 1% Langley) | sim_tau_retrieval.py → out/tau_retrieval.json
- 2.7% @ τ=3 | direct-beam transmission at the greenhouse LED-takeover trigger | sim_tau_retrieval.py
- 0.56 µm / 10.4 ppm | 40 µm Si diaphragm full-scale deflection; ΔC/C per 0.1 Pa | sim_baro_membrane.py → out/baro_membrane.json
- 0.028 Pa | residual drift with ±0.05 K thermostat (0.56 Pa/K uncompensated) | sim_baro_membrane.py
- fc=1.39 Hz (r=3 mm) | inlet pneumatic low-pass: tides and dust devils in-band, wind turbulence out | sim_inlet_filter.py → out/inlet_filter.json
- 27.3 W / 15.3 W / 22% DoD | WEB night heat loss (6 cm aerogel, k=0.010 at 610 Pa), heater power, battery depth-of-discharge | sim_cabin_thermal.py → out/cabin_thermal.json
- 0.014° vs 1° | sun-tracker residual (0.05° step-dominated) vs FOV half-angle: 70× margin | sim_sun_tracking.py → out/sun_tracking.json
- 5.9% → 1.5% → 0.73% | Langley σ_V0: hazy single morning → stable morning → 4-morning average | sim_sun_tracking.py
- σ_τ 0.003–0.01 (night) | stellar-extinction tau from mV≤3 stars, 10 s at f/2 (CIS sensor params reused from the city CMOS project) | sim_skycam_imaging.py → out/skycam_imaging.json
- ~28 kV/m | Paschen breakdown of CO₂ at 610 Pa over meter gaps = storm E-field ceiling and probe range | sim_efield_probe.py → out/efield_probe.json
- SNR 625 / 41.7 nA | single-grain charge counting (10 fC vs 100 e⁻ ENC) / storm integrating-current mode | sim_dust_flux.py → out/dust_flux.json
- σ_v 4–5%, σ_az 2.2–2.8°, 1.2–3.7 min | network front-vector retrieval and warning lead, MC N=4000 | sim_network_triangulation.py → out/network_triangulation.json

## What broke (real rework, with round counts)

1. **Diaphragm bottomed the gap** — first-pass 18 µm Si membrane deflected
   6.2 µm at 900 Pa full scale, punching through the 2 µm capacitive gap.
   Fixed via w∝1/t³: 40 µm final, 0.56 µm deflection (1 redesign round).
2. **Whole-cabin insulation was a dead end** — 4 cm aerogel around the full
   6.8 m² cabin still leaks 128 W on a −80 °C night, unaffordable. The design
   answer is the box-in-a-box WEB (2.88 m², 6 cm aerogel → 27.3 W), which is
   what the cutaway geometry now shows (1 architecture pivot).
3. **Single-morning Langley is unusable** — τ drifting 0.02 during a hazy
   morning sweep blows σ_V0 to 5.9%. The 1% calibration the τ card assumes is
   earned by stable-morning screening (1.5%) plus 4-morning averaging (0.73%);
   the MC was re-run in two drift regimes after the first pass returned the
   surprise (2 MC rounds).
4. **Inlet tube one size down erases dust devils** — r=0.5 mm gives a
   pneumatic cutoff of 0.001 Hz, filtering out the very 0.1–1 Hz dust-devil
   signatures the barometer stakes out; r=3 mm (fc=1.39 Hz) is the version
   that ships (parameter trap caught in the radius sweep).
