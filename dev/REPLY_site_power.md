# REPLY — power.html timeliness pass (REVIEW_site_gemini.md, table 2, item 1)

**Done by**: pwr-storage session (contributor of the storage sections of `docs/power.html`).
Accepted the dispatch rather than bouncing it to the tokamak session: the fission source
material was readable and the storage half of the fix was ours anyway.

**Both audit points closed**

1. *Single-source narrative* — the page now carries the two-source architecture.
   `§01` gains two paragraphs ("One plant is not an architecture"): fusion = baseload +
   propellant export (176 MWe at the plant fence); `pwr-fission-01` = availability insurance,
   sized against the quench x dust-storm overlap, with the generator-shaped-hole argument
   (0.71x coverage, 63.7 kW short, 47.1 MWh over 30 sols). Eyebrow, hero thesis and footer
   sources updated. `§02` gains a seventh domain card (OpenMC / Stirling / switchover) and its
   lead now says six domains close the reactor while a seventh chain answers what carries the
   city when the reactor is gone. One new figure: `assets/power/fission_plant.jpg`
   (clean render, 41.6 KB, no burnt-in text) from `mars-fission/out/f03_iso.jpg`.

2. *Stale ledger row* — the 833 kW row is **kept verbatim** and annotated
   `(2026-07 sizing; see note below)`, per the site's keep-the-evolution rule. A prose
   "Note on the storage row" under the table narrates both role changes (islanded backstop ->
   survival grid at 1.85x -> 60 s bridge + N-2 reserve worth 10.1 sol), and the audit's
   suggested 707 kW grid context is quoted with its own anchor.

**New ledger rows (8, every one with a Produced by anchor)**
Storage: 60 s bridge role, N-2 endurance (`mars_pwr_storage/analysis/L4_bridge_transient.py`).
Fission: gap, installed/N-1 firm, Stirling conversion, berm, switchover
(`mars-fission/sim/{01_gap,03_modularity,04_thermal,11_openmc_shield,08_switchover}.py`).
Grid: city steady mean load (`pwr-grid-01 · grid_01_load_ledger.py`).
Table now 31 rows, zero rows without an anchor.

**Verified** — shared tokens byte-identical; no external resources; 0 Chinese characters in
markup; 14 images all resolve, 1.37 MB total, none over 400 KB; no horizontal scroll at 375 or
1280; both themes toggle. Served on port 8466 (8123 left to the viewer).

**Scope note** — `index.html` untouched: the power card is already `live` and its status did
not change. No other session's files were edited.
