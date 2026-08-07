# Virtual-Physical Mars City

*A Mars city digital twin closing the loop: real HiRISE terrain → WebXR city →
simulation-backed engineering → a real chip running the city's AI.*

![Mars city panorama](docs/assets/hero.png)

Starting from real NASA HiRISE terrain (Jezero Crater, 1 m/px), this project
builds a Mars city digital twin in the browser: **34 placed facilities, seven
walk-in interiors, 190+ bilingual knowledge cards each backed by simulation**,
a live Perseverance mission layer, and day/night driven by true Martian solar
time — plus a compute center that closes the **real world → digital twin → AI
→ silicon** loop: a character-level bigram language model runs live on the big
screen, and the same algorithm exists as a real chip (full sky130 GDS flow +
a fabbed PCB) seated in the rack beside it.

## ⭐ The website — start here

**<https://pengweixie.github.io/virtual-physical-mars-city/>**

The heart of this release. Seventeen district pages, each telling one part of
the build as an engineering story: what it is, how the mechanism works, a
ledger table tracing **every number on the page to the simulation run that
produced it**, and an honest *What broke* section. English, offline-complete,
no external resources.

| District | One line |
|---|---|
| [Power](https://pengweixie.github.io/virtual-physical-mars-city/power.html) | Tokamak fusion (390 MWe), the 429 m radiator field, the storage farm |
| [Rockets](https://pengweixie.github.io/virtual-physical-mars-city/rockets.html) | Starship + CZ-10B with net-catch recovery — a launch every sol |
| [Science](https://pengweixie.github.io/virtual-physical-mars-city/science.html) | SPAD lidar, the observatory, and their shared single-photon lineage |
| [Comms](https://pengweixie.github.io/virtual-physical-mars-city/comms.html) | 3+1 areostationary relays and a 12 m deep-space ground station |
| [Deep Physics](https://pengweixie.github.io/virtual-physical-mars-city/detectors.html) | The dark-matter experiment, the CMB station at Sun–Mars L2, MiniPAN |
| [Resources](https://pengweixie.github.io/virtual-physical-mars-city/resources.html) | Ice well → Sabatier plant → the mine robot that digs by sight |
| [Compute & Silicon](https://pengweixie.github.io/virtual-physical-mars-city/compute.html) | The bigram model on screen and the MB-1 chip in the rack |
| [Quantum](https://pengweixie.github.io/virtual-physical-mars-city/quantum.html) | A 20-qubit transmon machine in service mode, fridge fully exposed |
| [Chip Fab](https://pengweixie.github.io/virtual-physical-mars-city/fab.html) | One cleanroom, three process lines, 21 simulation rounds |
| [Undercity](https://pengweixie.github.io/virtual-physical-mars-city/undercity.html) | Foyer, quarter, clinic and lounge under 30 m of rock |
| [Perception & Robots](https://pengweixie.github.io/virtual-physical-mars-city/perception.html) | Robots that navigate by sight; a MuJoCo-baked humanoid gait |
| [The Spectrum Net](https://pengweixie.github.io/virtual-physical-mars-city/spectrum.html) | Six observatories in one sol — 15 decades of wavelength |
| [Gravitational Waves](https://pengweixie.github.io/virtual-physical-mars-city/gravity.html) | TT-1: a three-satellite laser interferometer, exhibited 1:1 |
| [Environment Watch](https://pengweixie.github.io/virtual-physical-mars-city/environment.html) | One storm read at three depths — weather mast to deep-lab silence |
| [Flight Ops](https://pengweixie.github.io/virtual-physical-mars-city/flight.html) | The coaxial scout helicopter and its electro-thermal battery ledger |
| [The Town](https://pengweixie.github.io/virtual-physical-mars-city/town.html) | The densification pass: village, depot, crop tunnels, pipe corridors |
| [The Origin](https://pengweixie.github.io/virtual-physical-mars-city/origin.html) | The notebook page the whole city traces back to |

## Quick start (the 3-D city itself)

```
python -m http.server 8123        # from the repo root
# open http://localhost:8123/viewer/
```

On Windows, double-click `start-mars-vr.bat` (auto-ingests new models, refreshes
Perseverance mission data, starts the server, opens the browser). three.js is
bundled (MIT). A WebXR-capable browser can hit Enter VR for immersive mode.

Keys: `WASD` move · `F` fly · `V` inspect a facility (with action buttons,
e.g. Launch) · `M` orbit view · `E` enter interiors through their doors
(`U` jumps straight to the undercity) · `P` teleport to Perseverance ·
bottom-right slider scrubs Martian time. The corner button switches the UI
between English and Chinese.

## What's new in v1.0.0

- **The website**: all 17 district pages live, with per-page ledgers and
  *What broke* sections — the documentation is the product.
- **The spectrum net**: thermal-IR (VOx, NETD 47.3 mK), solar-blind UV
  (TCAD-grown AlGaN), a 183 GHz water-vapor radiometer, an InGaAs SWIR camera,
  a 160 m low-frequency radio array listening where Earth is deaf, and a
  seismic station that uses the daily 14:00 launch as a repeating active source.
- **The town**: a 16-cabin earth-sheltered village on one pressure domain
  (234 → 6.2 mSv/yr under 2 m of regolith; 14 airlocks become 2), a logistics
  depot, pink-glowing crop tunnels, a real road network and three elevated
  pipe corridors — guarded by a layout auditor that treats every road and
  pipe as a protected corridor.
- **The fab, complete**: furnace, LPCVD and CMP joined the floor; a 104 s
  full-wafer choreography runs the line end to end; 8 lithography +
  13 process simulation rounds close the unit-process ledger.
- **TT-1 gravitational-wave exhibit**, the three-tier radiation net, the
  weather station, and the scout helicopter.

## Posters

| | |
|---|---|
| ![The spectrum net](snaps/spectrum-poster.png) | ![The cleanroom](snaps/fab-poster.png) |
| ![Twin rockets](snaps/rockets-poster.png) | ![The radiation net](snaps/radnet-poster.png) |
| ![Gravitational waves](snaps/gwave-poster.png) | ![Weather station](snaps/weather-poster.png) |
| ![Helicopter](snaps/heli-poster.png) | ![Science duo](snaps/science-poster.png) |
| ![Comm chain](snaps/comms-poster.png) | ![Detector trio](snaps/detectors-poster.png) |
| ![Resources and compute](snaps/resources-poster.png) | ![Tokamak](snaps/tokamak-poster.png) |
| ![Regolith mine](snaps/mine-poster.png) | ![TES and the CMB station](snaps/tes-poster.png) |

## In motion

| | |
|---|---|
| ![CZ-10B launch](snaps/anim/veh-rocket-02.gif)<br>CZ-10B: launch → staging → net catch (time-compressed) | ![Village at nightfall](snaps/anim/hab-village-01.gif)<br>Nightfall over the village: windows light up one by one |
| ![Helicopter loop](snaps/anim/veh-heli-01.gif)<br>The scout helicopter's 80 s baked flight loop | ![Fab EMO drill](snaps/anim/ops-fab-01-emo.gif)<br>Fab: emergency stop freezes the floor, then production resumes |
| ![Radiation station](snaps/anim/sci-rad-01.gif)<br>The particle camera: quiet sol → SEP storm → recovery | ![Mine robot](snaps/anim/res-mine-01.gif)<br>The mine robot digging by sight (CIS vision, 5 Hz) |
| ![Humanoid patrol](snaps/anim/hab-bot-01.gif)<br>The humanoid on patrol, chest lidar fanning | ![Deep lab event](snaps/anim/sci-deeplab-01.gif)<br>Deep lab: an event lights the PMT array |

## The origin

The whole city traces back to a single notebook page (July 19, 2026):
Worlds A & B — build a world, rebuild the world inside it, hunt for the
source-code cracks, and ask which side is real.

![The idea, as a seven-panel comic](idea/manga-en.png)

[中文版 / Chinese version](idea/manga-cn.png)

## Layout

- `viewer/` — the engine (main.js) + 40+ procedural asset modules + knowledge-card info.json
- `docs/` — the website (served by GitHub Pages)
- `scripts/` — data pipelines (HiRISE download / terrain processing / mission
  updates / model ingestion) + rocket dynamics sims + layout-audit and
  contract-validation tools
- `models/` — GLB assets and the manifest
- `data/processed/` — finished terrain (raw HiRISE re-fetched on demand by `scripts/download_data.py`)
- `snaps/` — posters and captures (HTML sources included, re-renderable)
- `extras/tof-pet/` — PET shell model + GATE→MLEM reconstruction chain + the robot-patient scan
- Collaboration contracts and progress: `MODELS.md` · `CHECKLIST.md` ·
  `STATUS.md` · `SENSOR_SPEC.md` · `EQUIPMENT.md` (in Chinese — they are the
  working documents of the build)

The city was built by many AI sessions working in parallel: a lead session
maintains the engine and the contracts (MODELS.md), design sessions deliver
asset modules, knowledge cards and district pages against those contracts, and
tooling keeps quality honest (SAT overlap + corridor audit, contract
validation, in-engine verification).

## Scope boundaries (deliberate)

1. **Commercial-tool simulations (Sentaurus TCAD / COMSOL / ANSYS HFSS, etc.)**:
   only the final Python plotting scripts and exported data are included — no
   commercial project/model files. Outputs of free/open toolchains (Blender,
   EasyEDA, Geant4/GATE, CASToR, Yosys/OpenROAD, ...) are included as-is.
2. **TOF-PET**: only the shell model, the reconstruction algorithms and the
   robot-patient scan. Detector and front-end electronics design are out of scope.
3. **Dark-matter experiment & MiniPAN**: their Monte-Carlo / simulation source
   code lives in separate projects and is not in this repository — the city
   carries only 3-D asset modules and result images.

## Data sources & credits

- Terrain: NASA/JPL/University of Arizona — HiRISE DTM & orthoimage
- Mission data: NASA Mars 2020 (Perseverance) public API, refreshed at launch
- Martian time: our own implementation of the Allison & McEwen (2000) ephemeris

## License

Code: MIT · assets/documentation: CC BY 4.0 — see [LICENSE](LICENSE).
Third-party components in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
