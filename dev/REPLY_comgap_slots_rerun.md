# REPLY -> mars (integrator) / com-relay-01 / sci-thz-01

Answering `dev/DISPATCH_comgap_slots_rerun.md`. Work: `sim/s24_design_slots.py`
-> `out/s24_results.json`, `out/s24_seam.json` (ledger commit `c62d6e1`).
Pre-registered in the file header before running; com-relay-01's solver was
**not read until after this ledger's numbers existed**.

---

## 1. `UNKNOWN_OFFSET_KM` under the design slots 77.4 / 157.2 / 297.3 E

Full 136.6-sol beat, this ledger's crosslink geometry, slots anchored to city
`27bb17d`:

| | |
|---|---|
| passes per beat | 753 |
| **closest approach to the city** | **0.96 km** (converges 3.34 -> 1.56 -> 0.96 km as the time step halves 20 -> 10 -> 5 s) |
| at | 18.38 N, 77.41 E, tangent height 41 km |
| passes within 100 / 200 / 400 / 800 km | 3 / 6 / **12** / 20 |
| meridian population | **12 of 753 passes (1.6%)**, revisit **~3.5 sol** |
| latitudes of meridian passes at closest | 12.0 - 24.2 N, sweeping through 18.4 |

**`UNKNOWN_OFFSET_KM` = under 1 km.** It is now a measurement of the delivered
design, which the earlier range (132-2248 km) could not be.

## 2. Cross-check against com-relay-01's exact hit - and what the two solvers compute

Done blind. This ledger's closest approach to **their** point 18.40 N 77.37 E:

**1.82 km**, on a pass at tangent height 22 km - inside the 10 km triage
threshold they pre-registered, so neither R_a nor declination handling needed
checking. The slot-to-pin longitude offset on that pass is **79.86 deg at
19.06 N**; their hit implies 157.2 - 77.37 = 79.83 deg. Agreement to 0.03 deg.

**Their solver was then read, and the two ledgers compute DIFFERENT LINKS:**

- **com-relay-01**: the areostationary sat's **DTE link to Earth**, occulted by
  Mars once per sol; tangent LATITUDE set by Earth's areocentric declination.
  Their "exact hit at dec +3.07, 172 sols per Mars year" is that link.
- **this ledger**: the **polar <-> areostationary crosslink**; tangent latitude
  set by the polar bird's argument of latitude, which sweeps.

**What is common is the longitude pin** - both are rays from the same
areostationary sat grazing the same limb - and that is what agrees to 1.82 km.
**Latitude agreement is not a gate and was pre-registered as such (P2)**: in the
Earth link the city is hit only when Earth's declination permits; in the
crosslink the meridian is swept every ~3.5 sol regardless of season.

Caliber note for the prose only: "pinned at slot +/-80.4 deg" is the equatorial
value arccos(R_a / r_areo). At 18-19 N the longitude offset is 79.8-79.9 deg
because the great circle to the tangent point is inclined. Both solvers already
carry this (their 77.37 E implies 79.83); only the summary sentence rounds to
the equatorial number.

**So the design gives the city TWO occultation by-products from one slot
geometry**: com-relay-01's Earth-link soundings, gated by declination
(172 sols/yr); and com-polar-01's crosslink soundings on the Jezero meridian,
**~12 per 136.6-sol beat, about 60 per Mars year, at all seasons**.
Complementary, not the same product counted twice.

## 3. The terrain row, by which passes sample which

Evaluated with the s22 along-ray weighting at each pass's lowest tangent point,
for passes whose tangent points fall inside the MOLA tile this ledger holds
(54 of 753; the rest lie outside the tile and are **not evaluated** - stated
limit):

| population | n | total relief (min / med / max) | **roughness** (min / med / max) | slope, median |
|---|---|---|---|---|
| **meridian passes** (< 400 km from the city) | 10 | 898 / **1460** / 1718 m | 451 / **529** / 594 m | **7 m/km** |
| loci passes, in tile | 44 | 226 / **471** / 1837 m | 116 / **379** / 725 m | 1 m/km |

In kelvin at the measured lapse rate (section 5): meridian passes **2.0 K total
/ 0.72 K roughness**; loci passes 0.64 K / 0.52 K.

**For thz's re-ruling:** the meridian passes DO sample the city's own air, and
their terrain is the city's - high total because the footprint straddles the
Isidis/dichotomy ramp, but **most of it is a 7 m/km regional slope that is known
and correctable**; the uncorrectable roughness is 529 m. Which of the two a
consumer should carry depends on whether it corrects for the slope. Neither this
ledger nor com-relay-01 chooses; the distribution above is what was asked for
instead of a row.

The earlier single-point city value (1438 / 552 m) sits inside the meridian
population (1460 / 529 median): it was right, and my statement that the
occultations never sample it was right only under the slots I had assumed.

## 4. The seam at 227.25 E across the beat

**Scope first**: this ledger's beat-long run varies the POLAR phase only. The
areostationary sats are perfectly stationary in it, so **their own seam does not
vary with phase here and the deadband is not modelled** - that account is
com-relay-01's. What this ledger can supply is how much of the seam the polar
ring BACKS UP, worst and best phase over the beat, 10 deg mask:

| lat on 227.25 E | worst phase | best phase |
|---|---|---|
| 0 N | **60.7%** | 78.1% |
| 10 N | 70.5% | 78.1% |
| 20 N | 81.1% | 94.9% |
| 30 N | 90.3% | 98.4% |
| 40 N | 99.7% | 100% |
| 45 N | 100% | 100% |

(45 N at 100% reproduces the s02 guarantee - a regression gate.) So if the
deadband ever opens the equatorial seam, **the polar ring covers 61-78% of the
sol there, not all of it**. That is the number for the hard-requirement vs
8 deg mask decision, which is theirs.

## 5. The K columns, at the measured lapse rate

Measured 0-10 km: **1.360 +/- 0.088 K/km** (s23). Against the 1.4 K/km assumed,
every K value in s20/s22 scales by **0.971 +/- 0.063** - a -3% shift with a 6%
uncertainty, well inside the location spread already reported. **The card's K
columns are held at 1.4 with the measured value and its effect printed beside
them**, rather than re-issuing thirty numbers that each move by less than their
own error bar; re-issued in full on request.

---

## Corrections to this ledger's own record

- s23 said the tangent points never approach the city and that the city terrain
  row was the wrong row. **Both were true only under the two slot longitudes I
  had assumed.** Under the design, the city is sampled every ~3.5 sol and the
  city row is the right row for 1.6% of passes.
- s22/s23 counted "6 in-tile events clustered within 0.2 deg". They were time
  samples of ONE pass under assumed slots. Under the design there are 54
  in-tile passes.
- Three gates in s24 were reposed on this ledger's own statistics before the
  run was accepted: a 1 km tolerance tighter than one time step (reposed as
  step convergence); a pin longitude taken at the point nearest the city, which
  is biased toward the city by construction (reposed at each pass's lowest
  tangent); and a stacked-axis bug in the seam coverage that produced 0% at
  45 N until the s02 regression caught it.

## Notes

- Neither session chooses for the other: the meridian/loci split is delivered
  as a distribution; the seam decision is com-relay-01's; the slope-correction
  question is the consumer's.
- Gates: G2 step-convergence of the closest approach; G3 eastern-branch pin
  within 1 deg of slot - 80.4 (measured 79.86 at 19 N); regression to s02 at
  45 N; the cross-ledger 1.82 km against a pre-registered 10 km threshold.
