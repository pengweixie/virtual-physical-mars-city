# dev-notes.md — number anchors for docs/spectrum.html (SITE.md §7)

Every number that appears on the page, and the run that produced it. Paths are
project-relative (no local absolute paths, SITE.md §7 red line). Six design books
contributed: `mars-ir`, `mars-uv`, `mars-thz`, `mars-swir`, `mars-radio`, `mars-seis`.

## Coverage headline

| Number | Meaning | Produced by |
|---|---|---|
| 600 m → 2.4 pm | span from the 0.5 MHz array edge to the 511 keV annihilation line; 14.4 orders of magnitude, quoted as "fifteen decades" | composed from the six books' band definitions; the X-ray and 511 keV anchors are pre-existing city assets |
| 6 stations | commissioned in this round | `mars/CHECKLIST.md` |
| 40+ ledgers · 150+ gates | ledger scripts and pass/fail gates across the six books | six books' `sim/` + `out/` |

## sci-ir-01 — 8–14 µm thermal IR (`mars-ir`)

| Number | Meaning | Produced by |
|---|---|---|
| 47.3 mK | NETD @ f/1, 300 K scene, 30 Hz (target <60) | `mars-ir/sim/01_pixel_thermal.py` |
| 1.030e-8 W/K, −1.0% | 3-D FEM thermal conductance vs the lumped account | `mars-ir/sim/pixel_fem.java` (COMSOL 6.3 headless) |
| 9.45 ms | 63.2%-rise pixel time constant; lumped 7.67 → 1-D FD 8.43 → 3-D FEM 9.45 | `mars-ir/sim/06_pixel_fem_post.py` |
| 0.883 | absorber-cavity band absorptance over the f/1 cone (dM/dT weighted) | `mars-ir/sim/07_absorber_tmm.py` |
| 0.001% | Sentaurus TMM vs analytic TMM, 25 wavelengths | `mars-ir/tcad/ir_abs_des.cmd` (Sentaurus P-2019.03) + `sim/09_tcad_crosscheck.py` |
| 44×, 173 µs vs 65 µs | constant-voltage pulse over the runaway criterion; divergence time vs row time | `mars-ir/sim/08_electrothermal.py` |
| −27 K noon / +40 K 4 am | bedrock-minus-dust contrast reversal, Jezero 18.4°N | `mars-ir/sim/03_scene_radiance.py` |
| 51:1 | TEC stabilisation vs 77 K Stirling cryocooler input power | `mars-ir/sim/04_mars_specifics.py` |

## sci-uv-01 — AlGaN solar-blind UV (`mars-uv`)

| Number | Meaning | Produced by |
|---|---|---|
| 278.8 nm | Al₀.₄₅Ga₀.₅₅N cutoff (bowing 0.9 eV; 275.1–280.3 over the literature bowing range) | `mars-uv/sim/r1_bandgap.py` |
| 0.117 A/W (EQE 53.7%) | responsivity at 270 nm, back-illuminated PIN | `mars-uv/tcad/uv_pin_sde.cmd` + sdevice (Sentaurus P-2019.03), chains 1–3 |
| 585:1 / >10⁷ | out-of-band rejection at 310 nm / 365 nm | same TCAD chain |
| OD 1.22, 67.1% | filter rejection actually required (vs OD 2 assumed) and in-band throughput of the 25-layer edge stack | `mars-uv/sim/r6_filter.py` |
| 7.5%, −16.8%, 1.25% | isotropic-diffuser cosine error f2, error at 70°, residual after three-channel self-correction | `mars-uv/sim/r7_accuracy.py` |
| 12.8–26.2% | Phobos transit dip = free in-situ direct/diffuse split calibration | `mars-uv/sim/r8_events.py` |
| −2.91% | worst-case polarisation-charge effect on R@270 (verdict: screened) | `mars-uv/sim/r5_polarization.py` + TCAD chain 4 |

## sci-thz-01 — 183 GHz water-vapour radiometer (`mars-thz`)

| Number | Meaning | Produced by |
|---|---|---|
| 37 MHz HWHM, 81× | Mars-surface pressure-broadened linewidth, vs Earth's 3.02 GHz | `mars-thz/sim/sim_lineshape.py` |
| DOF 3.63 | degrees of freedom from the noise-normalised Jacobian SVD — column + 3 coarse layers | `mars-thz/sim/sim_weighting.py` |
| 0.45% in 1 s | water-column error at 10 pr-µm | `mars-thz/sim/sim_sensitivity.py` |
| 744 K vs 514 K (1.51×) | mixer-first vs LNA-first receiver noise temperature | `mars-thz/sim/sim_receiver.py` |
| 18.33 dBi, S11 −28.0 dB, FWHM 20°/24° | feed horn, full-wave | `mars-thz/sim/hfss_horn_183.py` (HFSS 2026.1 headless) |
| 0.470 K (CMB 77%) | total sky brightness in the window channel — authorises using the sky as the cold load | `mars-thz/sim/sim_window.py` |
| 6 decades → 1.49 K | ground pickup narrowed from an unusable bracket to a number; drives a ≥2 mm surface correlation-length spec | `mars-thz/sim/sim_sidelobe.py` |
| 1.15 W, 4% | mirror anti-frost heater, as a fraction of the weather station's night energy | `mars-thz/sim/sim_mech_frost.py` |
| τ₁₈₃ ≈ 1e-3 at τ_vis 5 | dust transparency — the radiometer keeps working when the optical channels are blind | `mars-thz/sim/sim_sensitivity.py` |

## sci-swir-01 — 0.9–1.7 µm InGaAs camera (`mars-swir`)

Device truth source is the frozen Codex InGaAs bench (`physical_model_passed_not_bench_validated`).

| Number | Meaning | Produced by |
|---|---|---|
| 2.1 wt% | minimum detectable ice abundance at 200 µm grain size | `mars-swir/sim/01_filter_bands.py` |
| 0.635 → 2.07× | sub-micron haze SWIR/visible opacity ratio and the contrast gain it buys | `mars-swir/sim/02_dust_transmission.py` |
| 1.194 (negative result) | coarse storm phase — SWIR is *not* better through the main dust mode | same script |
| SNR 319 vs 3.8 | 0.05 MR airglow in a 60 s budget, cooled vs uncooled | `mars-swir/sim/03_airglow_snr.py` |
| −74.4 °C at 0 W | passive night equilibrium; holding −40 °C needs 5.5 W of *heating* | `mars-swir/sim/04_tec_mars.py` |
| 731× | radiator-field stray light at the rejected siting candidate | `mars-swir/sim/09_stray_light.py` |
| 40.7 µm = 13× DOF | aluminium barrel thermal defocus that forced Invar 36 | `mars-swir/sim/11_optics_mtf_defocus.py` |
| sidewall 8.3% | dark-current mechanism split (bulk GR dominant) | `mars-swir/sim/13_tcad_dark_analysis.py` |

## sci-radio-01 — 0.5–10 MHz array (`mars-radio`)

| Number | Meaning | Produced by |
|---|---|---|
| 2.2e7 K, η 0.7% | Galactic sky temperature at 0.5 MHz, and the dipole efficiency that costs nothing against it | `mars-radio/sim/01_sky_noise.py` |
| 28 dipoles, D 160 m, FWHM 36° | array layout (deterministic LCG seed) and zenith beam at 3 MHz | `mars-radio/sim/02_array.py` |
| 4.0 → 0.63 MHz; 53% / 97% | ionospheric cutoff noon vs night, and usable window fraction (Earth: 0%, ever) | `mars-radio/sim/03_ionosphere.py` |
| 30 dB null, ≥400 m | the three stacked levers; distance alone never closes | `mars-radio/sim/04_rfi.py` |
| 12% at 0.5 MHz | capacitive-divider loss, doubling if the amplifier moves 3 m down the mast | `mars-radio/sim/05_frontend.py` |
| 4.4°/sol → 3e-4° | buried-cable phase drift, bare surface vs 0.35 m | `mars-radio/sim/06_calibration.py` |
| 27–105 min; ±72 km/s | SEP warning time for 100→10 MeV protons; shock speed from a drift-track fit (vs 34% from a band edge) | `mars-radio/sim/07_burst_warning.py` |

## sci-seis-01 — the channel that isn't light (`mars-seis`)

| Number | Meaning | Produced by |
|---|---|---|
| 2.53 s vs 0.60 s | VBB pendulum period on Mars vs the same hardware on Earth (T ∝ 1/√g) | `mars-seis/sim/01_vbb_pendulum.py` |
| 1.36e-10 m/s²/√Hz | night noise floor at 0.5 Hz — InSight known-answer gate | `mars-seis/sim/02_noise_budget.py` |
| ×179, ~5 orders | day/night ratio, and what the wind shield buys | same script |
| 0.28 ms → 0.05–0.07% | 50-launch stack pick precision and the velocity-structure resolution it yields | `mars-seis/sim/04_launch_source.py` |
| 25.5° | teleseismic azimuth error — because P rays arrive steep, not because signal is weak | `mars-seis/sim/07_location.py` |
| sol 474 | when a 3 m² solar wing goes offline under full load (0.25%/sol dust, multiplicative) | `mars-seis/sim/08_power_survival.py` |
| 88.7 dB | how much force feedback flattens the Q = 200 open-loop resonance | `mars-seis/sim/09_response_calib.py` |
| 65 gates | pass/fail gates across eleven ledgers, all green | `mars-seis/sim/01…11` |

## What broke — candidate material (pick 4–6)

1. **mars-thz, ledger 8a/8b** — ground pickup was left "somewhere between 1e-5 K and 8.9 K",
   six orders wide. The next ledger found the missing parameter was never a tolerance but the
   *surface correlation length*: same 27 µm rms gives 7.33 K at 0.5 mm and 0.0002 K at 5 mm.
   New spec: diamond-turned, not polished. Also in the same ledger, three numerical bugs were
   caught by one gate — `u = k sin θ` folds back past 90°, making the far field at 180° equal
   the main lobe (beam efficiency 0.459 vs the claimed 0.95; fixed → 0.958).
2. **mars-swir, ledger 2** — "SWIR sees through dust" was the premise of the station and it is
   **false for the main storm mode**: 1–1.5 µm grains sit on the Mie first resonance at 1.6 µm,
   giving τ_swir/τ_vis = 1.194. The real benefit is the sub-micron haze phase (2.07×).
3. **mars-uv, R2** — the reference deck's `QuantumYield(StepFunction(EffectiveBandgap))` zeroes
   the Urbach-tail response at 280 nm (20 meV below Eg). Responsivity at 280 nm read 0 until it
   was changed to `QuantumYield(Unity)`, since the k-table already encodes the tail.
4. **mars-uv, R7/R8** — two delivered claims were withdrawn by their own ledgers: the "<3% cosine
   response" is really 7.5% (−16.8% at 70°, a *negative* bias on a dose-warning instrument), and
   the "2.3 GHz headroom" belongs to the diode, not the transimpedance amplifier, which is pinned
   at 33.6 kHz.
5. **mars-ir, ledger 7** — the transfer-matrix code returned R > 1. The physics convention
   n = n′ + ik had been fed into Macleod characteristic matrices that require N = n − ik, turning
   loss into gain. Three known-answer gates now run before any result prints.
6. **mars-seis, ledgers 6/9** — a cross-ledger consistency gate caught ω₀² written as 1.4685
   instead of 6.183 (a 5.18 s period where 2.53 s was correct). Same-source parameters must be
   derived in one place; ledgers 6 and 9 now declare `L_ARM`/`ETA` at the top.
7. **mars-radio, ledger 5** — ledger 1's slogan "the front end can be bad" is true of the noise
   figure and false of the topology: a 5 m dipole at 1 MHz has Q ≈ 1.6e5 and nothing matches it.
   The circuit is a capacitive voltage probe, which is why the LNA box sits at the mast top and
   the arms are blades rather than wires.

## Figures shipped

| File | What it shows | From |
|---|---|---|
| `dev-ir-tcad.png` | Sentaurus TMM vs analytic TMM reflectance + residuals | `mars-ir/figs/09_tcad_crosscheck.png` |
| `dev-uv-channels.png` | three AlGaN channel bandpasses from the TCAD optical sweep | `mars-uv/figs/r2_three_channels.png` |
| `dev-thz-weighting.png` | 183 GHz weighting functions — which layer each channel sees | `mars-thz/out/weighting.png` |
| `dev-radio-skynoise.png` | Galactic sky temperature vs dipole efficiency | `mars-radio/out/sky_noise.png` |
| `dev-seis-noise.png` | day/night seismic noise budget | `mars-seis/fig/02_noise.png` |
| `dev-swir-head.jpg` | SWIR camera head and filter wheel, in-engine | `mars-swir/shots/look_02_head_filterwheel.jpg` |
| `cluster.jpg` `radio.jpg` `seis.jpg` | in-engine station renders | `mars/snaps/net-*.png` |
| `anim-{ir,uv,thz,swir,seis}.gif` | motion cards, recompressed ≤400 KB | `mars/snaps/anim/sci-*-01.gif` |
