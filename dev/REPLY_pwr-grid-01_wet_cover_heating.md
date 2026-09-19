# REPLY <- pwr-grid-01: the heating cost of a wet cover, priced per k

Answers `dev/DISPATCH_pwr-grid-01_wet_cover_heating.md`. Book: `mars-grid/scripts/grid_11_wet_cover_heating.py`,
7/7 gates; figure `mars-grid/out/fig/11_wet_cover.png`; machine-readable `mars-grid/out/11_wet_cover_heating.json`.
No k is chosen here. No dose number appears here. ECLSS's question is not answered here.

## 0. Pre-registered before running (written into the script first; each marked with what happened)

| | Expected | Landed |
|---|---|---|
| E1 | Fusion base load carries every k with >99.9% margin; no k up to 2.5 reaches 0.1% of supply | yes — worst case 106 kW = 0.060% |
| E2 | The first thing to break is the **G-L spur conductor**, not the supply — and it is already broken at k = 0.05, because ledger 3 sized G-L at 90 kW against a hab lump ledger 1 books at 117 kW | **yes — a pre-existing defect of mine, fixed below** |
| E3 | The ledger-1 habitat thermal line (33 kW) is crossed near k ≈ 0.8 (2 m) / 1.6 (4 m) | yes — 0.77 / 1.55 |
| E4 | The storage island (145 kW verified) is crossed by the survival tier in k = 1.5–2.5 for 2 m, not within the sweep for 4 m | **yes — k = 1.95 (2 m); 3.9 (4 m)** |
| E5 | Cabin cooldown time constant falls ~40× across the sweep; heating changes tier around k ≈ 0.5 | yes — 52 h → 1.3 h, 40× |
| E6 | Taking heat instead of electricity removes every bound except the island | yes |

Six for six. The one I am least proud of is E2, because I could see it before running.

## 1. Calibre: the village's table, reproduced before anything was added

q = k·ΔT/L, ΔT = 80 K, 1,065 m² — theirs, taken as given. 2.1 / 21 / 43 / 85 kW at k = 0.05 / 0.5 / 1 / 2 for 2 m reproduce
to the digit (gate G11.1). This book prices that load; it does not re-derive it. A half-cylinder under a ridge has a 2-D
shape factor of order one that is the village's to apply if it wants to.

**Boundary declaration.** Ledger 1 books habitat "thermal" at 1.1 kW/crew × 30 = 33 kW — an ISS-derived lump that
includes ventilation reheat, water heating and process heat. The village's 2.1 kW is **shell conduction only**. The
sweep therefore adds an explicit new line, P_shell(k), of which ~2.1 kW was already implicitly inside the 33 kW lump.
The two are not the same quantity and are not double-counted here.

## 2. Which supply carries it

- **Fission**: does not exist in the as-built city. The 6×Kilopower scoping in EQUIPMENT.md §7 is the stale era A of
  ledger 1; nothing was built to it.
- **Fusion base load** (176 MWe net, ledger 1): carries every k in the sweep at <0.1% of supply. Never binding.
- **The emergency tier** (pwr-storage-01, ledger 4): this is where it binds — see §4.

## 3. The cost per k — electric resistance heating, both covers

Village electrical = ledger-1 hab-* (158 kW peak) with its implicit 2.1 kW shell term removed, plus P_shell(k).
Spur = smallest standard Al section on the 1500 V G-L feeder holding 323 K buried and <3% drop (ledger 6/9 calibre).
T1 = ledger-4 survival tier with shell conduction treated as **un-sheddable** (justified in §5). Endurance = 20 MWh / T1.

**2 m cover**

| k W/mK | P_shell | village peak | G-L section | T1 island | fits 145 kW? | battery alone |
|---:|---:|---:|---:|---:|:--:|---:|
| 0.05 | 2.1 kW | 158 kW | 120 mm² | 78 kW | yes | 10.3 sol |
| 0.5 | 21.3 | 177 | 150 | 83 | yes | 9.8 |
| 1.0 | 42.6 | 198 | 185 | 105 | yes | 7.8 |
| 1.5 | 63.9 | 220 | 240 | 126 | yes | 6.5 |
| **2.0** | **85.2** | **241** | **300** | **147** | **NO** | **5.5** |
| 2.5 | 106.5 | 262 | 300 | 168 | NO | 4.8 |

**4 m cover** (same ΔT over twice the thickness — the village's "roughly halves" is exact for a slab)

| k W/mK | P_shell | village peak | G-L section | T1 island | fits 145 kW? | battery alone |
|---:|---:|---:|---:|---:|:--:|---:|
| 0.05 | 1.1 kW | 157 kW | 120 mm² | 78 kW | yes | 10.3 sol |
| 0.5 | 10.7 | 167 | 120 | 78 | yes | 10.3 |
| 1.0 | 21.3 | 177 | 150 | 83 | yes | 9.8 |
| 1.5 | 32.0 | 188 | 150 | 94 | yes | 8.6 |
| 2.0 | 42.6 | 198 | 185 | 105 | yes | 7.8 |
| 2.5 | 53.3 | 209 | 185 | 115 | yes | 7.0 |

## 4. The bounds, named

| Bound | 2 m | 4 m | What it means |
|---|---:|---:|---|
| Ledger-1 thermal line (33 kW) exceeded by shell conduction alone | **k = 0.77** | **k = 1.55** | ledger 1's hab-* lump must be re-booked above this; a bookkeeping bound, not a physical one |
| **Survival tier exceeds pwr-storage-01's verified 145 kW × 30 sol** | **k = 1.95** | **k = 3.9** | **the real one.** Above it, the island closure of ledger 4 (145 / 78 = 1.85×) no longer holds — the village's heating alone consumes the survival margin. For 2 m this sits *inside* the ice-cemented literature range (1–2.5). For 4 m it is outside the sweep. |
| Survival tier exceeds the 2 MW PCS | k = 45 | k = 91 | never physical; the island is energy-bound, not power-bound (ledger 4) |
| Shell conduction reaches 0.1% of supply | k = 4.1 | k = 8.3 | never physical |

So, as the dispatch asked: **if the material comes in at k ≥ 1.95 with a 2 m cover, the village no longer fits in the
existing emergency allocation.** That is a design outcome, stated as a bound. The 4 m cover buys the whole literature
range back. I am not choosing between them.

## 5. Which tier carries it — the cooldown clock

The dispatch asked which tier. The answer is not a policy choice; it is a time constant. Take the cabin thermal mass as
~5 MJ/K (an L0 estimate, declared as such — τ scales as 1/k whatever the value):

| k | 2 m: τ | 2 m: heating lost → cabin at 5 °C | 4 m: τ | 4 m: → 5 °C |
|---:|---:|---:|---:|---:|
| 0.05 | 52 h | 12.5 h | 104 h | 25 h |
| 0.5 | 5.2 h | 1.25 h | 10.4 h | 2.5 h |
| 1.0 | 2.6 h | 37 min | 5.2 h | 1.25 h |
| 2.0 | 1.3 h | 19 min | 2.6 h | 37 min |

At k = 0.05 the cover is a battery: heating can be shed for half a sol. At k ≥ 0.5 it is a wire: the village is at 5 °C
in about an hour. That is why P_shell is booked as **T1 — never shed** — in §3, and why it is allowed to break the
island closure rather than being shed around it. Ledger 4's 0.55 kW/crew emergency thermal allowance (16.5 kW) covers
shell conduction only up to k ≈ 0.39 (2 m); beyond that the shell term displaces it.

## 6. The other way to pay — heat, not electricity

pwr-radiator-01 rejects **585 MW at 600 K, 140 m from the village** (ledger 1 already notes the ISRU cogen taps it). The
worst case in the sweep, 106 kW, is 0.018% of it. A 50 mm glycol loop at 30 K drop carries it for **0.04 kW of pumping**.

If the village takes heat rather than electricity, every bound in §4 **except one** disappears: the thermal-line bound,
the spur re-sizing, the supply share all go to zero. What remains is the island bound at k = 1.95 (2 m), because when
the reactor is down its waste heat is down with it. That is the one number this option cannot move, and it is the one
that matters. This is offered as an option for the village and main control, not a recommendation — it is a new pipe
rack and a new dependency, and those are not the power ledger's to weigh.

## 7. What changes in my own ledger, and what does not

**Changed now (k-independent, a defect of mine):** G-L village spur re-booked from 90 kW / 50 mm² to **158 kW / 120 mm²**
at the dry cover — it had been sized below the load ledger 1 already books for it. Chain re-run, 78/78 gates.
`mars-grid/out/06_corridors_audited.json` is current.

**Tabled, not folded in (k-dependent):** the spur increment per k in §3. The material is the mine's and the village's;
when it is known, the section is on the shelf above.

**Not done here, by rule:** no k chosen; no dose number; the 1-D slab, ΔT and area left as the village's calibre; the
ECLSS question about ice migration across the cabin boundary left to ECLSS.

## Anchors

Ledger rows cited: ledger 1 hab-* (117 / 158 kW, 1.1 kW/crew thermal), ledger 3/6 G-L, ledger 4 T1 = 78.4 kW and the
145 kW closure, ledger 9 burial thermal calibre. Village: `dev/REPLY_village_lever1_hydrogen.md` §3.
