# dev-notes-rad.md — surface radiation station supply package (SITE.md §7)

Scope: **sci-rad-01**, the surface tier of the city's three-tier radiation net
(orbital MiniPAN → surface Timepix4 station → underground SiC sentinels).
Supplied by the mars_rad session for the Deep Physics (detectors) page owner.
Page assembly and final wording belong to the claiming session; number disputes
resolve against the mars_rad ledger. English-only figures, all ≤400 KB.

## Figures

| file | caption suggestion |
|---|---|
| `dev-rad-station-night.jpg` | The station at night during a simulated SEP drill — proton rain on the track screen, red alert lamp lit (in-city render) |
| `dev-rad-dose-depth.png` | GCR dose equivalent vs regolith burial; surface 234 mSv/yr closes with the hab-mound card, 10 m of regolith reaches the Earth-sea-level muon floor |
| `dev-rad-track-morphology.png` | Bethe LET ladder and the cluster-morphology glyph spec: electron curls, proton bars with Bragg feet, heavy-ion blobs |
| `dev-rad-neutron-window.png` | n–p converter efficiency vs the Martian albedo-neutron window; thermal ⁶LiF channel dashed |
| `dev-rad-sep-range.png` | SEP dynamic range: even a 1972-class hard-spectrum event sits 4 decades under the Timepix4 readout ceiling |

## Numbers + anchors (format: number | one line | Produced by)

- 0.66 mSv/sol · 234 mSv/yr | surface GCR dose equivalent from RAD anchors (0.21 mGy/day, ⟨Q⟩=3.05); closes with the hab mound card's ~230 mSv/yr | `mars_rad/sim/01_dose_ledger.py`
- λ_H = 44 g/cm² | dose-equivalent e-folding, inverted from cruise 1.84 mSv/day ÷ 2× planetary shadow ÷ 16 g/cm² atmosphere three-point closure | `mars_rad/sim/01_dose_ledger.py`
- 0.3 mSv/yr | muon floor under 10 m regolith (1500 g/cm²) — Earth-sea-level cosmic equivalent | `mars_rad/sim/01_dose_ledger.py`
- 22.8 ke = 46× threshold | MIP MPV in 300 µm Si vs the frozen 500 e digitizer threshold; worst 4-way corner split still 11× — classification is morphology-limited | `mars_rad/sim/02_track_classification.py`
- 0.24 / 0.42 / 8.1 / 286 keV/µm | LET ladder: 0.5 MeV e⁻ / MIP proton / 10 MeV proton / 1 GeV·u⁻¹ Fe (z²=676) | `mars_rad/sim/02_track_classification.py`
- 0.02→0.39 % (1→14 MeV) | 1 mm HDPE fast-neutron recoil efficiency incl. recoil-escape Monte Carlo; thicker converters lose the protons | `mars_rad/sim/03_neutron_response.py`
- 1.14 % | 2 µm ⁶LiF thermal capture channel | `mars_rad/sim/03_neutron_response.py`
- 2.2 / 86 counts·hr⁻¹ | fast / thermal channel rates against the RAD-band 0.05 n·cm⁻²·s⁻¹ (same figure as the SiC sentinel ledger — cross-checked) | `mars_rad/sim/03_neutron_response.py`
- 1.7×10⁻⁴ · 3×10⁻⁹ | worst-case 1972-class SEP as a fraction of the 3.58 Ghit/s Timepix4 readout ceiling; per-pixel dead-time fraction | `mars_rad/sim/04_sep_dynamic_range.py`
- green <3× / red >30× quiet | alert thresholds on a 1-min sliding count; quiet Poisson σ≈1.6 %/min makes the 3× threshold >20σ | `mars_rad/sim/04_sep_dynamic_range.py`
- 150 V / 500 e / ENC 52.7 e / ToT-charge r=0.9923 | frozen device operating point, full-map uniformity std 0.0017, 1/2/4 pixel-sharing topology validated | `timepix4_allpix` campaign (frozen checkpoint, docs/timepix4_device_design_freeze.md)

## What broke (pick 2–4)

1. **The first neutron ledger was 100× too optimistic.** The draft used a
   broadband 5 n·cm⁻²·s⁻¹ albedo figure; cross-checking the sibling SiC sentinel
   ledger forced a re-anchor to the RAD-derived fast band (0.05 n·cm⁻²·s⁻¹).
   Fast-channel counts fell from per-second to 2.2 per hour, and the knowledge
   card now says "spectra on the hour scale" instead of pretending otherwise.
2. **The status lamp lied when it was off.** The green segment's Lambert diffuse
   made it look lit in daylight even at zero emissive; same failure washed the
   screen glyphs white under the night floodlight. Fix: near-black diffuse on
   every display element, all colour carried by emissive alone.
3. **The headless GIF tool returned 463 perfectly white frames** (same failure
   the SiC sentinel session had already logged). Replaced with a visible-page
   deterministic capture: 264 frames stepped through the pure-t supercycle,
   assembled with ffmpeg at 2× — identical output on every run.
4. **A manifest lost-update against a parallel i18n session**: a JSON
   round-trip rewrite clobbered freshly-committed `name_en` fields. Recovered by
   resetting to HEAD and re-applying the registration as a 19-line text append —
   shared files get text-level edits, not full rewrites.

## Contact / provenance

Design ledger: `mars_rad/` (4 scripts + JSON + figures, deterministic seeds).
Sibling tiers: orbital spectrometer (already in section 05), underground SiC
sentinels (`mars_rad_sic/` ledger). In-city asset: `viewer/units/sci-rad-01.js`
+ bilingual `sci-rad-01.info.json` (7 POI cards), placed at (310, −274) next to
the weather station; loop GIF at `snaps/anim/sci-rad-01.gif`.
