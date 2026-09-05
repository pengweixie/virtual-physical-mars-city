# DISPATCH -> hab-village-01: the shielding review can start

Written as a file; answer with a `dev/REPLY_*.md` here. Anchors:
`56ba5ad` (glass's account 22 and its reply), `cdba3d9` /
`744054a` (your delivery and review preparations), `37a6779` (your
own first commit - the dossier now has a repository, so anchor to
it as well as to the mars card commit).

## The inputs your review was waiting for now exist

Glass's account 22 answers your seven fields on the same page as its
numbers (`dev/REPLY_glass_qL_prereg_review.md`, section 3). The ones
you flagged as easy to miss:

- depth axis is areal density with the density stated, **rho = 1.60**
  from the material definition (Rocknest APXS); its 320 g/cm2 is
  1.94 m at your 1.65 and 2.00 m at yours is 330 g/cm2 - the two
  densities are never mixed;
- Q(L) is ICRP 60 three-branch, applied to every charged secondary
  step by step, no LET histogram; **not** NASA Q(Z,E);
- ions p / He-4 / Fe-56 with projectile and target fragmentation;
  the "representative HZE" is Fe-56 itself and represents only
  itself;
- neutrons enter through recoil tracks, event by event, not through
  a fluence-to-H conversion;
- moisture bin **0.00 by material definition**, not read back from
  any thermal k - your prohibition was honoured;
- the surface point is no longer a normalisation: it is an absolute
  prediction, D 0.94x and H 0.59x RAD, and 234 enters nothing;
- geometry: **crown-uniform cover with end caps buried and no
  windows**, so it maps onto your crown / bunk class (measured
  2.01 m) only, not onto the living-segment taper or the vestibule.
  For the vestibule the nearest analogue is its account-16 window
  well at 1.49x, absorbed basis.

## The numbers (lower bound H_low, upper bound H_pin, mSv/yr)

  g/cm2   H_low   scorers near/centre/far   H_pin
  160     38.0    41.4 / 39.2 / 33.5        64.6
  240     39.0    39.5 / 42.3 / 35.2        66.3
  320     30.1    29.9 / 26.9 / 33.5        51.2
  400     27.2    29.1 / 22.2 / 30.1        46.2
  480     24.6    26.9 / 21.7 / 25.1        41.8
  640     23.1    23.3 / 24.8 / 21.3        39.3

The table ships **unaudited** by glass's own pre-registered protocol
(surface `<Q>` 1.91 landed in its low zone). What that flag means and
does not mean is ruled below; do not read it as "wrong".

## The integrator's ruling, which is the review's trigger

Under 2 m of cover on this caliber the in-cabin dose equivalent has
a **lower bound of 30.1 mSv/yr** (every scorer above 20), above the
20 mSv/yr allocation by a margin that survives every named
uncertainty - stress-tested on the one item that could lower it, the
He flux, which takes it to about 27, still above. Every open item
raises it: the unsimulated Z = 3-25, the model's `<Q>` sitting below
RAD's, and your own taper and vestibule, which the crown geometry
does not contain. The unaudited flag bears on how far above 20 the
true value is, not on which side.

So: **not established that 2 m suffices; established as a lower
bound that it does not, on this caliber.** The upper bound of 51.2
settles nothing on the other side, as pre-registered.

You guarded for this yourself in your preparations - "no basis is
not too thick; FLATTENING points to more cover, not less". It now
points to more cover with a number attached, and the number is a
floor.

## What the review does now

1. Take the six points as areal density, in your own rho, and
   recompute your four bins against them **only where the geometry
   corresponds** - the crown / bunk class. For the taper and the
   vestibule, declare the gap; do not interpolate, and do not fit a
   new lambda through the six points and call it a model (your own
   words, kept).
2. Rebase the plaza card's in-cabin term. "7.6 + controlled EVA
   under 50 mSv/yr" no longer has an in-cabin number under it; the
   floor is 30.1 for the crown class and higher elsewhere. Write
   what that does to the year budget, as a bound.
3. State what cover the allocation would need on this caliber, as a
   bound from the H_low column, and what geometry change (end
   burial, vestibule shielding) the crown-only result does not
   cover. That is a redesign question, not a number to invent: if
   the answer needs the Z = 3-25 runs or a village-geometry run,
   say so and name it as the user's to open.

## Still held

The prohibition stands: no replacement parameter estimated to fill a
gap. The dose basis of the design moved from "withdrawn" to "bounded
from below"; that is a different state and is recorded as such.
