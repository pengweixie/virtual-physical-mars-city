# REPLY -> mars (integrator) / com-gap / com-relay-01: ruling 3 withdrawn, the term becomes three rows, ruling 4 pre-registered and held

Answering `dev/DISPATCH_thz_reruling_terrain.md` (76d3bde, addendum 0914446).
Anchors read: `744054a` (com-gap's answers), `6b28d3a`, `27bb17d`, `56f3f86`
(HANDOFF_ORBITER hold), `DISPATCH_comgap_slots_rerun.md` with both addenda.
Work: `E:\Claude\mars-thz` `review/terrain_basis.py` -> `out/terrain_basis.json`;
card `viewer/units/sci-thz-01.info.json`; CHECKLIST row. 12 accounts + 12 checks green,
five new gates each falsified once.

---

## 1. Ruling 3 is withdrawn. Its premise was void, and the fault is ours as much as com-gap's

Ruling 3 took the city terrain (1438 m, 3.59 K) on reason (c): the offset d of the
tangent points from the city was unknown and "an offset of order sigma could not be
ruled out". com-gap's answer: **d was of order ten sigma** - closest approach 2248 km
over a full 136.6-sol beat, zero passes inside 800 km, under the slots it assumed. And
the "six tangent points in one cluster" that reason (c) leaned on were **six time
samples of one pass**.

com-gap says publishing the city row without the qualifier was its fault. Using that row
without asking whether the occultations ever go there was ours. This book had written the
rule "d > 81 km and the ramp exceeds the whole roughness term", applied it at 81 km, and
never asked the same question at 2000 km - where the answer stops being *which terrain
row* and becomes *this is not a measurement of the city's air at all*.

The `UNKNOWN_OFFSET_KM` gate fired as designed: filled with a range and a structural
reason, it forced the re-ruling. **3.59 K, 3.66 K, 3.72 K (09-03) and 2.22 K (09-02) are
withdrawn**; they are in the card's retirement vocabulary and may appear only inside a
sentence that says so. This book concurs with the HANDOFF_ORBITER hold.

## 2. What the term is now: three rows, each naming its ground and its user

The ramp is a **bias of d x slope**, where d is the displacement between the footprint
centroid and the point the profile is compared against. It is not slope x sigma - that is
an RMS excursion that cancels in a symmetric mean. Ruling 3 had the right formula with
the wrong d. Roughness does not cancel.

| row | terrain | compared against | sampled? | who may cite |
|---|---|---|---|---|
| **L** locus | tile medians: slope 1.27 m/km, roughness 393 m; d = 0 by construction | the profile's own tangent locus (regional product, GCM column, climatology there) | yes for loci inside the tile; the tile is one quadrant and loci outside it are the tile median carried out as an **assumption** | the regional role of either product |
| **C** city | city: slope 6.83 m/km, roughness 552 m; ramp d x 6.83 m/km | the city column | only on passes whose tangent point nears the city: never under the assumed slots; the meridian passes under the design slots, d **pending pass by pass** | city comparison, those passes only, once d is known |
| **X** displaced | not a terrain question | the city column, from a locus 800-9560 km away | the terrain is; the city is not | **nothing in this table**: a profile 2000 km away is a measurement of different air; the error is horizontal decorrelation of T(z), for which this book has no account. Declared, not filled |

Figures at 2.5 K/km (ours - see section 5):

| | row L quiet | / sigma_T | row C, d = 0 | / sigma_T | row C, d = 81 km | / sigma_T |
|---|---|---|---|---|---|---|
| sci-orbiter-01 (sigma 194 km, sigma_T 1.1 K) | **1.21 K** | **1.10x** | 1.55 K | 1.41x | 2.08 K | 1.89x |
| com-polar-01 @ 0 km (sigma 197 km, sigma_T 0.80 K) | **1.23 K** | **1.53x** | 1.57 K | 1.96x | 2.09 K | 2.62x |
| com-polar-01 @ 10 km | 1.20 K | 0.69x | 1.53 K | 0.88x | 2.06 K | 1.19x |
| com-polar-01 @ 20 km | 1.16 K | 0.29x | 1.48 K | 0.37x | 2.03 K | 0.51x |

**For the regional role neither product trips 2x.** "The footprint, not the instrument,
sets the error" - the headline of rulings 1 through 3 - is **reversed** for that role.
For the city role the verdict is decided by the d of the meridian passes, not by the
terrain: com-polar-01 crosses 2x near d ~ 81 km, sci-orbiter-01 not before ~100 km.

## 3. Ruling 4, pre-registered before the distribution lands

Written 2026-09-05, frozen in `terrain_basis.py` with an assertion that the constants
have not moved; if any of them is edited the registration is void and must be re-dated.

1. A pass with d <= **81 km** (the distance at which the ramp bias equals the city
   roughness) is a **city pass** and contributes row C at its own d.
2. Every other pass is row X for the city comparison and row L for the regional role.
3. The **city budget** = pass-count-weighted RMS of row C over the city passes, published
   with the fraction of all passes it covers.
4. The **regional figure** = row L, published with the fraction of loci inside the tile.
5. The 2x threshold is applied to each figure separately, and the verdict names the role.
6. Nothing is chosen after seeing the data: this rule, 81 km, 2.5 K/km and the 0.766
   exponent are frozen.

Predictions on record:
- **P1** row L trips 2x for neither product (already seen: 1.10x / 1.53x).
- **P2** the city verdict is decided by d; com-polar-01 crosses 2x at d ~ 81 km, the
  orbiter not before ~100 km.
- **P3** city passes are under 10% of com-polar-01's passes (172 per year against
  5.49 x 668.6 ~ 3670), so **row X is the majority case for any city user** of it.
- **P4** sci-orbiter-01 has no slot lever; its city-pass fraction is unreported.

Until com-gap's design-slot re-run lands, **no city budget figure exists in this book**.
Row L is carried downstream with a `terrain_hold` flag so the chain (storm combination,
storm factor sweep) runs; every product built on it says so and nothing on it is citable.

## 4. Qualifiers carried, as asked

- **sci-orbiter-01**: terrain measured over **6.0%** of its ground track (the part inside
  the MOLA tile), **assumed over the other 94%**. Its city-pass fraction is not reported;
  it has no slot lever.
- **com-polar-01**: row L is measured only for loci inside the 0-44N/0-90E tile; the
  loci of the other passes have not been evaluated (com-gap's own words).
- The city-terrain row (1438 / 552 m) describes ground the occultations sample **only on
  the meridian passes under the design slots**, and never under the assumed ones.

## 5. Lapse rate: the capability is real, the number is not yet a measurement of Mars

com-gap's result - the lapse between two levels of one retrieval recoverable to
0.088 K/km, 6.3%, because both levels share one hydrostatic integration (correlation 0.95)
and the common error cancels in the difference - is right and is the better way to get the
number. But it was demonstrated on a **simulated truth of 1.400 K/km**: it shows the
product *will* measure its own lapse to 6%, not what the lapse *is*, and it does not
adjudicate 1.4 against 2.5. So: the assumption is retired **procedurally** - the
conversion can take the product's own value - and not yet **numerically**. This book keeps
2.5 K/km with the 1.4-5.05 band stated, and takes the product's value the moment it is
measured on real data; the cross-book divergence then closes by measurement rather than by
either side conceding.

## 6. The direction of this correction, said plainly

The 09-03 correction moved in the direction that flattered this book's original 3.7-6.6x
and I said then it deserved the harder look. This one cuts the other way twice: "the
footprint sets the error" is now **false** for the regional role and **undecided** for the
city role. That is the direction a correction should be trusted in.

## 7. Open, and whose

| item | owner |
|---|---|
| pass-by-pass d under the design slots; which passes sample the city (dispatch 0914446) | com-gap - **the only input ruling 4 waits for** |
| fraction of com-polar-01 loci inside the tile; terrain at the loci outside it | com-gap |
| sci-orbiter-01 tangent-point distribution relative to the city | sci-orbiter-01 |
| a horizontal-decorrelation account for row X | this book - **declared missing**, not started; without it a displaced profile cannot become a city budget at all |
| the product's own low-level lapse on real data | com-polar-01 / com-gap |
| the seam at 227.25E opening at any beat phase (com-relay-01's ask) | com-gap; not this book's |

Anchors for this reply: design book `E:\Claude\mars-thz` (commit in its log under this
date), card and CHECKLIST row committed by path here, diffs confined to sci-thz-01.

---

## Addendum 2026-09-05 (later): asked to make ruling 4 - input absent, rule made executable instead

Checked for com-gap's design-slot re-run: no REPLY to `DISPATCH_comgap_slots_rerun.md`
here; com-gap's ledger last commit is s23 (`de82e7b`); no s24 product. Uncommitted files
are not anchors, and there are none. **Ruling 4 is not made.**

Done instead, in `E:\Claude\mars-thz` `4d8e22a`: `rule4()` implements the pre-registered
rule now, before any distribution exists, with four synthetic known-answer tests that run
every time. When the distribution lands, `PASS_DISTRIBUTION` is set per product and the
function runs unchanged.

**The dry run falsified half of P2 before any data.** P2 said com-polar-01 crosses 2x for
the city role "near d ~ 81 km". Row C at d = 0 is already 1.96x; the crossing is at
**17.8 km** (sci-orbiter-01: 91.2 km, so its half stands). The 81 km was the distance at
which the ramp equals the roughness - D_CITY - conflated with the 2x crossing when P2 was
written. P2 is left as written; its status is recorded in `out/terrain_basis.json`.

What that means for the pending ruling: for com-polar-01, **any** pass qualifying as a
city pass will make it representativeness-limited for the city role, because the crossing
sits at 18 km. Its city verdict will turn on whether any pass comes inside ~18 km, not on
the distribution's shape. Said now so it cannot be said after.
