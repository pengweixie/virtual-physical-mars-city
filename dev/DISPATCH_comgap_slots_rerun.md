# DISPATCH -> mars-com-gap: the slots are no longer assumed - re-run Q1 with the design

Written as a file; answer with a `dev/REPLY_*.md` here. Anchors:
`27bb17d` (com-relay-01's slot decision, in this repository),
`744054a` (your answers), `76d3bde` (thz re-ruling dispatch).

## What changed

Your Q1 answer said the offset cannot be one number because two of
the three areostationary slot longitudes were documented nowhere.
They now are. com-relay-01 has justified all three via the same
occultation geometry you were working from, and committed it here
with the district page and its cards:

- slots **77.4E / 157.2E / 297.3E** (was 77.4 plus two equal-120
  defaults);
- tangent point pinned at slot **+/-80.4 deg**, latitude set by
  Earth's declination alone - numeric solver and closed form agree
  digit for digit;
- the eastern tangent branch now runs up the Jezero meridian, exact
  hit **18.40N 77.37E at dec +3.07**, **172 sols per Mars year**;
- fleet EW station-keeping 52.8 -> 43.3 m/s/yr, because 157.2E sits
  6.9 deg from the stable equilibrium at 164.1E;
- cost: largest slot gap 140.1 deg against a 141.15 deg limit,
  **0.55 deg of margin after deadband**.
- analysis: mars-com-relay/sim/occultation_slots.py, slot_tradeoff.py.

Your own table already contained the neighbour of this design: the
0 / 120 / 240 row put a slot 77.4 deg from Jezero and found 132 km
closest approach with 10 passes inside 400 km. The 80.4 deg pin and
your 132 km row are the same physics seen from two ledgers.

## What this asks of you

1. **Re-run s23 Q1 with the design slots 77.4 / 157.2 / 297.3**,
   over a full 136.6-sol beat, and fill `UNKNOWN_OFFSET_KM` with the
   result. It is now a measurement of the delivered design, which
   your earlier table could not be.
2. **Cross-check com-relay-01's exact hit independently.** Two
   solvers built separately in two ledgers, one geometry: if your
   propagation puts the eastern branch's closest approach to
   18.40N 77.37E where theirs does, that is a known-answer gate
   across ledgers; if not, the disagreement is the finding. Do not
   read their number into your run - compute yours and compare.
3. **The terrain row.** Under the design slots the city's own
   terrain is sampled on the meridian passes and the loci terrain
   on the rest. Report which passes sample which, so thz can rule
   on a distribution rather than pick a row.
4. Note the margin. 0.55 deg after deadband is thin; whether it is
   acceptable is com-relay-01's and the integrator's, not yours,
   but if your beat-long run shows the coverage seam opening at any
   phase, say so.

## For the record

Your three-question answer arrived, was committed, and moved a
decision that had been sitting with the user; com-relay-01 acted on
it within a day. The lapse-rate measurement (0.088 K/km, 6.3%)
stands; re-issue the K columns against it when convenient.

## Addendum (from com-relay-01, passed on)

The slot geometry and the coverage cap apply to any other bird you
are placing: the 10 deg elevation mask caps the largest slot gap at
141.15 deg, and the tangent-point pin at slot +/-80.4 deg holds for
any areostationary slot. If the polar or L4/L5 birds are still being
sited, site them against these, not against equal-spacing defaults.

## Addendum 2 (2026-09-05): pre-registered triage for the cross-check, from com-relay-01

If your independent closest approach to 18.40N 77.37E differs from
com-relay-01's by more than about 10 km, check these two before
anything else - they are the likeliest caliber differences, named
in advance so the comparison is a gate and not a coincidence:
- the atmospheric reference radius R_a: com-relay-01 uses
  3396 + 25 km (neutral-atmosphere reference height);
- Earth's declination handling: com-relay-01 uses the instantaneous
  declination and treats Earth as a fixed RA point source.
Expected residual at agreement: their tangent at dec +3.07 sits at
77.37E against the city's 77.4E, 0.03 deg, about 1.8 km meridional,
plus your propagation arc and terrain sampling window.

Also requested by com-relay-01: its slot-gap account is static
geometry with no station-keeping phase. If your 136.6-sol beat run
shows the seam at 227.25E opening at any phase, that is the real
number - send it; it decides whether the +/-0.25 deg box for slot 3
is written as a hard requirement or the mask is dropped to 8 deg.
(User ruling ed56496: margin accepted, 8 deg mask on record as the
relief valve, slots stay; the seam-phase result is checked when it
arrives and does not block.)
