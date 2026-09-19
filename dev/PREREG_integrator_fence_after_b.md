# PREREG - integrator: what the chain3 measurement of b will do to the city's pages and the ruling

Integrator, 2026-09-19. Written and committed before any count from the
chain3 cut-segment family has been reported to anyone (tokamak pre-run
notice, city 1f2b104; no result file exists in `dev/` at this commit;
the integrator has not read the tokamak's or sci-rad-01's working
directories for it and will not). Companion to the sentinel network's
`PREREG_fence_after_b_measurement_20260919.md` (mars_rad_sic d01551d),
which the integrator has not read beyond the summary in its message.

## What the integrator decides, and what it does not

The verdict on condition (ii) is sci-rad-01's (`evaluate_ii`, 1c2da11).
The table is the sentinel network's. The integrator decides only what
the city's pages print and whether `RULING_fence_five_rows.md` is
superseded. The rule for that, fixed now:

| sci-rad-01's verdict on chain3 | Pages (`environment.html` tier/prose/row, `radiation.html` fence item) | Ruling |
|---|---|---|
| SATISFIED | print the single T sci-rad-01 rules quotable and the sentinels' one row for it, with statistical error and the propagated error of b listed separately, never merged; the five rows move to a dated "before the measurement" sentence, kept | superseded by a new ruling file; the old one is kept and gains a forward pointer |
| NOT SATISFIED | the fence figures come off the tier and the spec strip entirely and are replaced by "no quotable figure on this chain"; the table row keeps the five rows marked void with the date | superseded likewise |
| not evaluable / indeterminate | five rows unchanged, one sentence added saying the measurement was made and why it did not decide | stands |

In every case: the integrator does not scale, interpolate or re-derive
any pedestal itself; it prints what the sentinels' JSON gives after
sci-rad-01's verdict is in a file, in that order, and not before both
exist. "0.30 m meets the target" is re-read from sci-rad-01's product,
not assumed to survive.

## Both halves of the reading rule

- If the result is **favourable to anyone's margins** (b < 0 favours the
  sentinels; b > 0 and SATISFIED collapses the table toward the low rows
  but removes the hold, which favours the tokamak's delivery), the
  integrator asks the favoured holder for one additional check before
  the page changes, and says which check in the ruling.
- The withdrawn 2026-09-02 sentence does not return on any outcome
  without a new registration by the sentinels.
- A result that lands where everyone expects gets the same audit as one
  that does not: the integrator will ask sci-rad-01 for the ancestor
  counts and Kish N_eff behind sigma_b before accepting SATISFIED, since
  the chain2 bound was loose by 3.5x and nobody knew until the parent
  index existed.

## An expectation that can fail

The integrator expects: same sign as chain2 (b > 0), magnitude 3-8
pp/join, SATISFIED, the table collapsing to a T between rows 4 and 3
(3.3e-11 to 4.4e-11 before any correction is applied, lower after). It
holds this weakly: the only evidence is one chain in another geometry,
and the deep probes on chain3 already fell together in a way the
shallow ones did not. If the expectation fails, that is recorded as a
miss and not explained until the event counts behind it are on the page.

## Interest

The integrator printed a single number as the fence this morning and
had to take it back. It has a stake in the table collapsing to one row,
because that would make this morning's page look nearly right. That is
the outcome to distrust most.
