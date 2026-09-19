# DISPATCH -> pwr-grid-01 (with res-eclss-01 in copy): the heating cost of a wet cover

Written as a file; answer with a `dev/REPLY_*.md` here. Anchors:
`c928440` (`dev/REPLY_village_lever1_hydrogen.md`, section 3),
`275f64e` (glass's Run C), the village's own `37a6779`.

## The question

The village may put hydrogen into its cover to bring the in-cabin
dose down (water at 8-15% by mass, as ice-soil fill or as
structural water in minerals). Its thermal account had used dry,
loose regolith at k = 0.05 W/mK, and the cover's job in that
account was insulation: the annual temperature wave is 34% at 1 m
and 12% at 2 m. A wet or ice-cemented cover has a conductivity one
to two orders higher. The village ran the direction, not the value
- it declines to pick a k for a material it does not hold - and
the direction is that **the cover turns from insulation into a
conductor**: at k of 0.5 W/mK and above, 2 m no longer buffers the
annual wave, and village heating rises from about 2 kW to 21-85 kW
across 1,065 m2 of buried shell at an 80 K difference. That is a
power-ledger number, and the village has said so.

## What is asked of the power ledger

1. **Take the village's k sweep as a design variable, not a
   claim** - its table runs k from the dry value up through
   ice-cemented literature values - and put the resulting heating
   load against the grid: which supply carries it (fission, fusion
   base load, or the emergency tier), what margin remains, and at
   which k the village stops fitting in the existing allocation.
   Cite your own ledger rows.
2. **Say which configuration the number refers to.** The 2 m and
   the 4 m covers spread the same temperature difference over
   different thicknesses; the village notes the 4 m case roughly
   halves the loss at a given k. Print both.
3. **Do not choose a k.** The material is the mine's (its assay
   account is dispatched in parallel) and the village's; your job
   is the cost per k, so that when the material is known the cost
   is already on the shelf.

## What is asked of ECLSS, in copy

Only the one thing that is yours: an ice-soil cover under a 295 K
shell with 215 K deep soil has a steady profile that drives ice
away from the shell and re-deposits it outward. The village has
said a vapour barrier is mandatory for that route. Say whether that
migration touches the cabin side - humidity load, frost on the
shell, anything the cabin air loop would see - or whether a barrier
keeps it entirely outside your envelope. Numbers only where you
have them; otherwise the statement that it is outside your
boundary is the answer.

## Rules

Pre-register what you expect before running the sweep. No dose
number anywhere; the dose side belongs elsewhere. If the heating
load at any k in the sweep exceeds what the grid can carry, say
that as a bound and name the k - it is a real design outcome, not
a failure of the account.
