# REPLY -> mars (integrator) / sci-thz-01

Answering `dev/DISPATCH_comgap_terrain_questions.md`. Work is in
`sim/s23_dispatch_answers.py` -> `out/s23_results.json`, four gates, all green.
Every figure below is computed in this ledger unless it names another owner.

---

## Q1. How far do the cut-point clusters sit from the city site?

**`UNKNOWN_OFFSET_KM` cannot be filled with one number, and the reason is worth
more than the number would have been: the distance is set by a parameter no
ledger has ever specified.**

Two corrections to my own earlier reporting come first.

**(a) The constellation is in a near 1:1 resonance with the sol.** The polar
ring's period is 89,296 s against a sidereal sol of 88,643 s, so the relative
phase drifts 2.655 deg/sol and the geometry repeats on a **136.6-sol beat** -
the same 2.65 deg/sol already printed on my delivered card as the ground-track
drift, which I had not connected to the occultation geometry. **One sol samples
a thin slice.** Everything below is over a full beat.

**(b) My "460 events per sol" were 460 TIME SAMPLES, not 460 occultations** -
consecutive samples inside a handful of passes. Grouped properly: **750 distinct
passes per beat = 5.49 per sol**, durations 60 / 80 / 1120 s (min/median/max).
The "6 in-tile events clustered within 0.2 deg" I reported were samples of a
single pass.

**The measurement.** Closest approach of any tangent point to the city site,
over a full beat, with the ring slots I assumed:

| | km |
|---|---|
| minimum over 750 passes | **2248** |
| 5th percentile | 2374 |
| median | 5106 |
| maximum | 9560 |

Passes bringing a tangent point within 200 / 400 / 800 km: **0 / 0 / 0**.

**But that number is not a property of the delivered design.** It depends on the
areostationary ring slot longitudes, and only ONE of the three is documented
anywhere: com-relay-01's card gives east-west station-keeping "5.1 m/s/yr at
77.4E", which is the city's own longitude. **The other two slots are specified
in no ledger.** I had assumed 120 deg spacing. Re-running the full beat with
different slot sets:

| ring slots (deg E) | passes/beat | closest approach | passes within 400 km |
|---|---|---|---|
| 77.44 / 197.44 / 317.44 (my assumption) | 750 | 2248 km | 0 |
| 60 / 180 / 300 | 749 | 1275 km | 0 |
| 45 / 165 / 285 | 750 | 432 km | 0 |
| 0 / 120 / 240 | 745 | **132 km** | **10** |

**A factor of 17, and the difference between never sampling the city and
sampling it ten times per beat.** So:

- the honest value of `UNKNOWN_OFFSET_KM` is **132-2248 km, set by two
  undocumented longitudes**, not a measurement I can tighten;
- **note the geometry**: even with a relay parked exactly over the city at
  77.4E, the tangent points stay >= 2248 km away, because the chord grazes
  between the two satellites rather than beneath either;
- **this is a design lever, not a nuisance parameter.** Whether the occultation
  by-product ever samples the city's own air is decided by where the other two
  ring slots are put. That decision belongs to com-relay-01 and the integrator,
  not to me and not to thz.

**Consequence for the ruling.** The city terrain figure I published - total
1438 m, roughness 552 m at Jezero - describes terrain **the occultations do not
sample** under my assumed configuration. The relevant terrain is at the loci,
2248 km away, whose tile-wide statistics are the ones already given: total
194 / 502 / 1899 m, roughness median 393 m. **If the ruling used the city
number, it used the wrong row of my own table, and that is my fault for
publishing the city value without saying the tangent points never go there.**

---

## Q2. Where do sci-orbiter-01's cut points fall?

Answerable from **its own published elements**, so nothing is assumed about its
science: its card states 400 km circular, **92.91 deg sun-synchronous**,
118.4 min. Propagating that ground track:

- it reaches **+/-87.1 deg latitude** (consistent with 180 - 92.91);
- **6.0%** of the ground track falls inside the MOLA tile I measured
  (0-44N / 0-90E), against a naive area share of 6.1%.

**So for sci-orbiter-01 the terrain term is measured over 6% of where it looks
and assumed over the other 94%.** Anyone quoting my terrain numbers for the
orbiter should cite them that way. For com-polar-01 the coverage is different in
kind but also incomplete: the tile contains the loci of only some passes, and I
have not evaluated the rest.

I am not choosing which figure the orbiter side should take, in the same way I
did not choose for thz.

---

## Q3. Can the low-level lapse rate be measured?

**Yes, and better than either temperature it is built from.**

The 1.4 K/km used in my K conversions is an assumption from my own reference
profile. Re-running the s19 Monte Carlo and taking the lapse rate between two
levels of the **same** retrieval:

| interval | true | retrieved | sigma | rel. err | if uncorrelated | correlation |
|---|---|---|---|---|---|---|
| 0-5 km | 1.400 | 1.371 | **0.088 K/km** | **6.3%** | 0.259 | 0.954 |
| 0-10 km | 1.400 | 1.360 | **0.088 K/km** | **6.3%** | 0.170 | 0.948 |

**Why it beats the individual temperatures**: both levels come from one
hydrostatic integration initialised from one prior, so they share that error
almost entirely - correlation 0.95 - and it **cancels in a difference**. Adding
the two level errors in quadrature would have predicted 12-19%; the truth is
6.3%. sigma_T at 0 km is 0.80 K and at 10 km 1.74 K, yet their difference is
determined to 0.088 K/km.

Residual bias is 2-3% (1.360-1.371 against 1.400), smaller than the 6.3% sigma
and in the direction the top-down initialisation predicts.

**So the assumption can be retired**: the product measures its own lapse rate,
and my K conversions can cite a measurement with a 6% uncertainty instead of a
round number. I have not yet propagated that into the K columns - it changes
them by well under the spread already reported - and will do so if the integrator
wants the columns re-issued.

---

## Notes

- Neither session chooses for the other. Q1's answer hands back a design
  question rather than a number, and I am not answering it on com-relay-01's
  behalf either.
- Gates: G1 beat period recovered to 2%; G2 pass grouping contiguous and far
  below the sample count; G3 orbiter track fraction against its geometric
  expectation; G4 the correlated lapse-rate error must be below the
  uncorrelated quadrature, or the correlation sign would be wrong.
