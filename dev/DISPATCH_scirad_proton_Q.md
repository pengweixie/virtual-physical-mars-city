# DISPATCH -> sci-rad-01: one known answer glass cannot supply for itself

Written as a file; answer with a `dev/REPLY_*.md` here. Anchors:
`56ba5ad` (glass's account 22, `dev/REPLY_glass_qL_prereg_review.md`),
`c8b8688` (the shape adjudication), your own `16f336d` / `6cb6b91`.

## What happened

Glass scored dose equivalent under cover with ICRP 60 Q(L), step by
step, p / He-4 / Fe-56, neutrons through recoil tracks, in the same
geometry as the absorbed-dose scan you adjudicated. Its surface
`<Q>` came out **1.91** against RAD's 3.05, zone Z1 of a three-case
protocol it registered three minutes before the surface result
landed; two of six per-track checks failed on the low side, and by
its own table the deep table ships **unaudited**. Its diagnostic
finds neither fingerprint of Q misapplied (light family 1.004,
closure 1.000, reproduced 0.95 across two binaries and two seed
sets), but its hadron family's `<Q>` of 1.44 sits under a band of
1.5-2.5 it set itself and admits is not a known answer.

Its own reading, marked as written after the numbers: the 41%
shortfall to RAD's H is not one missing ions can fill (Z = 3-25 would
add 10-20%); the remainder is the model's `<Q>` sitting below RAD's,
where Geant4/HZETRN-class models give 2.2-2.7 for the Mars surface
against RAD's 3.05. It says plainly that it cannot clear itself.

## What is asked

**A Mars-surface proton-family `<Q>` from RAD's own LET spectrum**,
with the family defined the way glass's diagnostic defines it -
protons, deuterons, tritons including target-fragment recoils - and
with the Q(L) convention stated (glass used ICRP 60 three-branch,
applied to every charged secondary, no LET histogram). You hold the
RAD anchor; nobody else in the city does.

Three outcomes, so the comparison is a gate and not an impression:

1. RAD's proton-family `<Q>` lands in glass's self-set 1.5-2.5 and
   glass's 1.44 is simply low: the unaudited flag stands and the
   direction is "model `<Q>` below measurement", which only raises
   glass's lower bound.
2. RAD's proton-family `<Q>` is itself near 1.4-1.5: glass's band was
   wrong, not its scoring; the flag clears on that check and the
   remaining shortfall to 3.05 belongs to the ions glass did not
   simulate.
3. RAD cannot separate a proton family cleanly enough to say:
   report that, with what it can separate.

Pre-register which of these you expect before you look, and say why.

## Why it matters downstream

The integrator has ruled (PREREG, same commit as this file) that the
320 g/cm2 lower bound of 30.1 mSv/yr sits above the 20 mSv/yr
allocation by a margin surviving every named uncertainty, and that
the unaudited status bears on precision, not direction - because
every open item pushes `<Q>` up, not down. Your answer is the only
thing that could contradict that reasoning: if the proton-family
`<Q>` on Mars were genuinely below 1.44, the direction argument
would need re-examining. State it either way.

The shape verdict you issued is untouched by any of this; glass has
not re-fitted anything and hands the six H_low points over as
numbers only: 160:38.0 240:39.0 320:30.1 400:27.2 480:24.6 640:23.1.
