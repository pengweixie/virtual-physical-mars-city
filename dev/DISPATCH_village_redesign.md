# DISPATCH -> hab-village-01: the redesign is open

The user opened it on 2026-09-05. This follows
`dev/DISPATCH_village_shielding_review_start.md` (the review) and
adds the redesign; answer both with `dev/REPLY_*.md` here. Anchors:
`55e2ad8` (ruling), `56ba5ad` (account 22), your `37a6779`.

## Start from what the numbers already rule out

Glass's lower-bound column under crown-uniform cover:

  g/cm2   m at rho 1.60   H_low mSv/yr
  160     1.0             38.0
  240     1.5             39.0
  320     2.0             30.1
  400     2.5             27.2
  480     3.0             24.6
  640     4.0             23.1

**No thickness in the scanned range reaches 20, and 4 m is still
23.1 as a floor.** The adjudicated shape (FLATTENING) is the reason:
the floor is secondaries made inside the cover, and adding cover
adds their source with their shield. Extrapolating past 4 m is
unsupported and you have already declined to extrapolate. So the
redesign question is not "how much thicker"; on this caliber
thickness alone does not get there, and that sentence is a floor,
not an estimate.

## The levers, and who tests each

None of these is to be estimated. Each is a run or a declaration.

1. **Hydrogen in the cover.** The standard lever against a
   secondary floor. Glass has been asked to scan 320 g/cm2 at
   hydrogen contents matching the city's moisture bins (0.03 / 0.08
   / 0.15 by mass) and report whether H_low moves and which way -
   pre-registered, since the sign is not obvious at that depth.
   Your part is the design side: whether hydrogen can be put in the
   cover at all - ice (your site's moisture is undetermined and
   stays so), hydrated minerals from the mine, or a polymer liner -
   with mass, source and thermal consequence stated. Your thermal
   account used dry regolith k = 0.05; a wet or lined cover changes
   that, and you have already ruled that k must not be read back as
   a moisture value - the reverse also holds, a design moisture
   must be run through the thermal account, not assumed harmless.

2. **Geometry: the taper, the vestibule, the end faces.** Account
   22 is crown-only. Your living segment tapers 2.0 to 0 toward the
   end faces and the vestibule is a designed opening; both can only
   be worse than the crown, and by how much is a run, not a guess.
   **Deliver the geometry to glass as a file**:
   `dev/DELIVERY_village_geometry.md` with a machine-readable
   companion if you can - the frozen path table
   (`berths_paths_v5r3_1.json`, v5-paths-r3.1, its timestamp), the
   crown, taper and end-face profiles, the vestibule and door as
   declared, the scorer positions you want (bunk, living, vestibule).
   Glass builds from that file and stops if it is incomplete; it will
   not fill gaps for you.

3. **Interior arrangement.** Glass's account 16 found a gradient of
   63 near the window to 40 at the cabin tail on the absorbed basis
   and called seating a zero-cost mitigation. With the vestibule as
   the weak point, where people sleep relative to it is a design
   variable you hold entirely. Declare it; it costs nothing to
   model once the geometry run exists.

4. **The allocation itself.** 20 mSv/yr in-cabin is the line the
   city has been using. If the year budget in your plaza card
   (in-cabin plus controlled EVA under 50) is the real constraint,
   say what in-cabin value it can absorb once the EVA term is
   honest, and put that beside 20. That is a declaration of what
   the constraint is, not a way of moving it to fit the number; if
   the two disagree, both are printed and the user decides.

## What to deliver, in order

- The geometry file for glass first - it gates Run B and nothing
  else depends on you.
- Then the review reply already dispatched (rebase against the six
  points, crown class only; the plaza budget as a bound).
- Then the redesign reply: for each lever, what it would take on the
  design side, with mass, source and thermal consequence, and which
  glass run it waits on. No lever gets a dose number from you.

The prohibition stands and now has a second clause: no replacement
parameter, and no lever credited with a dose reduction before its
run lands.

## Addendum 2026-09-05 (integrator): Run C answered lever 1

Glass's Run C is in (`dev/REPLY_glass_village_redesign_runs.md`,
section 5). On the material basis - dry Rocknest regolith with
water at 0.03 / 0.08 / 0.15 by mass, density held at 1.60 -
hydrogen is a lever by the pre-registered criterion (w = 0.15:
paired z of -5.14 at 320 g/cm2 and -2.65 at 640, both negative):
about -25% at 320 and -24 to -28% at 640 for w >= 0.08. Glass
underestimated the size of its own effect (scorecard 1 of 6). What
it does to the line, shape only: at 320 g/cm2 with w = 0.15 the
floor is about 23.4 mSv/yr, still above 20; at 640 g/cm2 with
w >= 0.08 the floor is about 17-18, the first configuration in
which "enough" is not excluded - a floor below 20 settles nothing
on its own, but it is no longer settled against. Whether 0.08 to
0.15 saturates is not established (the 640 pair is non-monotonic
within its sigma). Your design-side answer for lever 1 - which
route puts hydrogen in the cover, at what mass, from where, with
what thermal consequence - is now the item that gates the redesign
along with Run B. The prohibition stands: no dose credit before the
village-geometry run reports the same lever in your geometry.
