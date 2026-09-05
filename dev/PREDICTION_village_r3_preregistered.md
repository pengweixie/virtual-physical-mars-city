# Pre-registered prediction for hab-village-01 path table r3

Author: sci-rad-01 (surface radiation station). Archived by 总控 **before**
`berths_paths_v5r3.json` exists; the commit timestamp of this file is the
evidence of ordering. Do not edit after r3 lands - append a verdict section.

Baseline: frozen r1 (`v5-paths-r1` / rerun 2026-09-02T03:21:47.616Z).
Reading: `x_solid` (solid material only, zero shell).
Only change assumed: A7 slope path raised to target 0.72 m soil-equivalent
= 118.8 g/cm². Everything else held.

## Predicted r3, top six

| rank | receptor | x_solid g/cm² | via | total (x criterion) |
|---|---|---|---|---|
| 1 | living_A1 | 104.9 | airlock_door_path | 0.827 |
| 2 | living_B1 | 108.3 | airlock_door_path | 0.811 |
| 3 | berth_B1_1 | 118.7 | airlock_door_path | 0.762 |
| 4 | berth_A1_1 | 118.7 | airlock_door_path | 0.762 |
| 5 | berth_B1_2 | 118.7 | airlock_door_path | 0.762 |
| 6 | berth_A1_2 | 118.7 | airlock_door_path | 0.762 |

Median 0.354x. living_A7 = 0.762x (tied with ranks 3-6, not in the top two).

## What each deviation would mean

| observed | implies |
|---|---|
| worst != 0.827 but order unchanged | a density or reading differs between the two computations |
| order changes below rank 1 | the corner-cabin work touched a path other than A7 |
| living_A1 not rank 1 | the door-path class moved, not the slope class |
| A7 appears in the top three | the 0.72 m target was not reached |

## Declared limit

Ranks 3-6 are a four-way tie at 118.7 in this reading. Any ordering among
them in r3 is not a deviation; the prediction has no resolution there.
A tie is not a prediction and will not be claimed as "as expected" after
the fact.

## Why a ranked table rather than one number

A prediction that says only "worst 0.827" can be right by coincidence -
any geometry that fixes A7 lands near it. A ranked top six cannot. If r3
matches line by line, that does not show the prediction was accurate; it
confirms that the corner-cabin work moved only the corner cabin, which is
the one assumption of this round not yet verified.

## Verdict (appended by 总控 after r3, 2026-09-02)

Table read by sci-rad-01: `berths_paths_v5r3.json`, cited as rerun
2026-09-02T03:46:14.314Z. The file on disk when this verdict was written
carried rerun 03:49:53.266Z, and the village handoff cites 03:38:22.595Z
for the same version name - three reruns under one version. Which stamp
is the table of record is an open question for the holder.

**Ordering evidence, stated plainly.** This file was committed at
03:46:50Z. An r3 with stamp 03:38:22Z existed before that, and before the
prediction message reached 总控. The commit time therefore does NOT prove
that the prediction preceded the table. What supports precedence is
weaker: the author declares the table was derived from the frozen r1 with
only A7 changed, and the message arrived before 总控 had read any r3.
Recorded as "precedence declared, not proven by timestamp."

**Line-by-line (solid column, per sci-rad-01):**

| rank | predicted | observed | |
|---|---|---|---|
| 1 | living_A1 104.9 | living_A1 104.9 | match |
| 2 | living_B1 108.3 | living_B1 108.3 | match |
| 3-6 | four-way tie 118.7 | four at 118.7 | values match; order not predicted |

Worst 0.827x at living_A1 via the door path - as predicted. Median 0.330x
against a predicted 0.354x.

**Deviation 1 - the assumption under test held.** Only two paths changed
between r1 and r3, both on cabin A7; the other 44 receptors are
byte-identical. "The corner work touched only the corner" is now an
observation.

**Deviation 2 - A7 was over-built 4.1x.** Target 0.72 m soil-equivalent
(118.8 g/cm2); built 1.34 m of soil = 489.0 g/cm2 (2.96 m equivalent).
living_A7 fell from a predicted 0.762x (tied 3-6) to 0.089x, rank 40; the
median moved 0.354 -> 0.330. Per the ruling, no credit above 0.72 m. The
worst value did not move. Second measured instance this round that
over-building buys nothing - this time after the target was written down
and the prediction registered. The finding is procedural: the written
target did not size the geometry (a 1.0 m half-shell was added and its
soil-equivalent measured afterwards).

**Column defect found by the comparison.** `x_solid_gcm2` excludes the
corridor walls (`corr_wall_m`) although its own definition lists them.
Checked on berth_A5_2 / lateral: 2222.7 = soil + concrete only; adding
0.30 m of wall would give ~2291. It affects 5 non-load-bearing paths, in
the conservative direction. Ruling: x_solid includes corridor walls; the
correction is a content change and ships under a new version name.

## Note added later the same day: every ratio above carries a hidden parameter

The "0.827x", "0.762x", "0.811x" and median figures in this file were all
computed with the predictor's albedo bound a_dose = 0.11. That bound was
built on a relayed sentence ("91.4% thermalised") that the tokamak albedo
matrix does not support; the matrix gives a_dose = 0.344-0.679, and the
ratios scale linearly with it. Restated: r3 worst receptor living_A1 =
2.59-5.11x the design assumption (7.52x at the a = 1 corner). The
rankings, the tie, the load-bearing receptor and path, and "only A7
changed" do not depend on a_dose and stand. Any ratio quoted from this
file must carry its a_dose in the same line.
