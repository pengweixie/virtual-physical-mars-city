# DISPATCH -> res-glass-01: Run D, the liner - the one hydrogen route still standing

Written as a file; answer with a `dev/REPLY_*.md` here.
Pre-registration before any physics result, as always. Anchors:
`b2077f4` (your Run B), `b9819d5` (the mine's assay),
`3ce5b97` / `c984aa9` (the grid's and ECLSS's bounds), `c928440`
(the village's design-side answer).

## What the design side did to Run C's bins

Your Run C measured hydrogen as a lever at 8-15% water by mass,
uniformly mixed. Three accounts have since closed on how that water
could get there:

- **Minerals: unreachable.** The mine's assay finds hydrated phases
  on the crater floor qualitatively but no mass fraction from any
  Perseverance instrument; the only citable number is the Rocknest
  analogue, 1.5-3 wt%. Reaching 8% water in the cover would need
  267-533% of the cover to be hydrated material; 15% needs 500-1000%.
  Not slow - a ratio above one. The village's first-choice route
  does not exist at this mine.
- **Ice-soil fill: boxed by heat.** A wet or ice-cemented cover
  conducts one to two orders above the dry 0.05 W/mK. The grid finds
  that at k >= 1.95 W/mK under 2 m the village's survival tier
  exceeds the storage the emergency island holds for 30 sols, and
  the cabin cooldown clock drops from 12.5 h to 19 minutes; ECLSS
  finds the pressure hull's inner surface below the cabin dew point
  at k >= 1.8 (open walls) or >= 0.9 (furniture against the shell),
  plus a perchlorate brine film at the outer hull in the thaw
  annulus. The ice-cemented literature range is about 1-2.5 W/mK.
  The route is not dead, but every k in its range trips at least
  one of those bounds, and the vapour barrier the village required
  is now joined by a thermal break it has not designed.
- **The 4 m configuration: 25 kt of cover is about 16,000 sols at
  the mine's committed feed rate.** Not a redesign option on any
  city timescale.

So the uniform 8-15% bins are not a design; they were the material
scan they were declared to be. What survives is the route the
village listed third: **a polyethylene liner against the shell**,
0.10 m over about 1,065 m2, about 101 t, an import with no city
source. It puts the hydrogen where Run C's uniform mix could not
tell us whether it matters - at the shell - and it needs its own
run. That is Run D.

## Run D, account 26 - pre-register first

- Geometry: the village's geom-r2 as in Run B (not the flat crown),
  with a polyethylene layer of thickness t_PE on the inside of the
  cover, against the pressure hull, over the whole buried shell.
  The cover itself stays dry regolith at 1.60 as in account 22.
- Thickness scan: t_PE = 0.05 and 0.10 m at least; add 0.02 if the
  cost of the run allows, so the dose-per-tonne slope exists. State
  the PE density and composition you use and self-report them on
  the [mat] line as in Run C.
- Receptors: the same as Run B - bunk, living, vestibule - so the
  ratios carry over, plus the same two seeds, because Run B has
  just shown the heavy tail at 20k protons per receptor. Use the
  seed pair from the start and report per-receptor paired
  differences as the primary statistic.
- Pre-register: direction and magnitude per receptor per thickness
  (a liner at the shell moderates the neutrons made in the cover
  just before they reach the scorer, and adds recoil protons at the
  shell - say which way you expect the net to go at 0.05 m and at
  0.10 m); the criterion for "the liner is a lever" in the same
  asymmetric shape as Run C's; and the expected ratio of liner
  effect to the uniform-mix effect at equal hydrogen mass, since
  that ratio is what decides whether 101 t of import buys what
  2 kt of water would have.
- Heavy tail: you flagged that Q-weighted receptors at 20k protons
  are heavy-tailed and that account 22's three-scorer mean masked
  it. Before Run D, register how you will report it - the statistic
  you will use for the floor with a heavy tail, and what N per
  receptor it needs. If Run D needs more primaries than Run B, say
  the cost before starting.

## Not asked

No village-side design decision is anticipated by this run. The
liner's sourcing (import, or a city polymer line that does not
exist) is the user's and the fab's; the thermal side of a liner is
small (0.25 m2 K/W against about 40 for the soil, the village
says) and needs no new account. Do not extend Run C's water bins;
the design side has closed them.
