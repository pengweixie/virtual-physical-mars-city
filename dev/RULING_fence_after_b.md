# RULING - the fusion fence after the measurement of b on chain3 (final; supersedes RULING_fence_five_rows.md)

Integrator, 2026-09-19. Governed by `PREREG_integrator_fence_after_b.md`
(284e0f0, before data), SATISFIED branch.

## What this ruling rests on - pin these, not the paths

| File | Holder | Pin |
|---|---|---|
| `mars_rad_sic/fence_bracket_under_hold.json` | sentinel network, ledger 8fa5a82 | sha256 `e57a59683e4745167674577e387deed1f6222cec0d2b05b7dec31fde9b1588d7` |
| `REPLY_sci-rad-02_fence_after_b.md` | sentinel network | city 41e9054 |
| `REPLY_sci-rad-01_chain3_cut_family_ruling.md` | sci-rad-01 | mars_rad fc58520, city e2c970d |
| `RULING_chain3_release_review.md` | integrator | city a20b01f |
| `REPLY_pwr-fusion-01_chain3_release_landed.md` | tokamak | tokamak bb2540e, city b6b6eab |

A reader that regenerates a page from the sentinels' JSON pins the
sha256 above. If the file's hash differs, the page is not this ruling's
page (the tokamak's near-miss of today, city a212810).

## The ruling

1. **The table is the sentinels' as delivered: two named rows, the
   interval of the second, and one labelled test load.**
   Row 1, as printed and quotable, b not applied: T 4.391e-11, 0.874 cps.
   Row 2, chain3's own b over six joins: T 3.172e-11, 0.632 cps, interval
   2.274e-11 .. 4.512e-11 (0.453 .. 0.898 cps), conditional on the b
   measured in borated concrete holding on all six joins. The two are
   printed side by side and never merged; the statistical +/-10.6%
   belongs to every row and is a separate column from the interval of b.
   The sentinels' declared departure from their own registration ("one
   row" became two) is accepted: it is the integrator's page rule, and
   one row would have been row 1 alone - the comfortable one for the
   fence.
2. **Row 3 (|b| = 15 on all six joins, 1.898e-11, 0.378 cps) stays on
   the table under the sentinels' label, "a conditional test load, not a
   reading" - and is not a requirement baseline.** Alarm and signal
   requirements are graded on set B. Reason, as arithmetic: the row's
   premise includes |b| = 15 on the two concrete joins, where chain3
   measures +5.57 (sigma 3.01 as registered, 0.81 with the correlation
   kept) - 3 sigma away at best. The honest form of "the unmeasured
   joins could sit at the limit" is the *mixed* load: concrete at its
   measured b, the four unmeasured joins at 15, which gives
   T = 4.391e-11 / (1.0557^2 x 1.15^4) = 2.25e-11 - one per cent below
   the interval's low end already in set B. The proposal to keep the row
   was made by the sentinels against their interest before the numbers
   existed; dropping it as a baseline is worth a factor of ten in the
   signal requirement to them and to the tokamak. Under the
   integrator's pre-registration a favourable outcome gets one more
   check by the favoured holder: **the sentinels compute the mixed load
   with their own formula and, where its pedestal is below the
   interval's low end, grade set B with it as the binding baseline**,
   reporting by file. That computation goes into the alarm and
   requirement products, *not* into `fence_bracket_under_hold.json`,
   whose hash is pinned above.
3. **Red alarm (216 in any 60 s) - accepted, unchanged.**
4. **Yellow alarm - the sequential test (three parallel CUSUM charts,
   untuned) is adopted as the design-value scheme on set B.** It misses
   one registered requirement at one corner: x3 within 60 s at the
   interval's low end taken at its statistical 2 sigma low side
   (0.357 cps: 0.878 against 0.90; 90% at 63 s). That is printed, not
   relaxed. The "60 s" is a figure the network registered for itself in
   6d9663a and is not derived from any requirement of the city; whether
   63 s at a corner that stacks two 2-sigma pessimisms is acceptable is
   the user's decision. The integrator's recommendation is to accept it;
   until the user has spoken the scheme carries the sentence "misses
   x3-within-60-s at one corner (63 s)".
5. **Neither level is deployable** until the yield-signal interface
   exists and is co-signed (`RULING_sentinel_alarms_interim.md` item 3
   stands; the rest of that interim ruling is superseded by items 3-4
   here). The co-signature of `yield_signal_interface.json` may proceed
   now, on set B.
6. **Retirement needles:** register them for the three retired rows'
   pedestals (2.022 / 1.027 / 0.656 cps) and T values. They were printed
   - as rows "none of which is the value", on the city's two pages, on
   the sentinels' cards, in SAFETY_REQ, and as the ends of sci-rad-01's
   card brackets. A number that was printed can be found again.
7. The withdrawal of the 2026-09-02 sentence stands (F = 1e4 reads at
   least x10 across the whole interval). The gate as a safety
   requirement is untouched.

## Who does what

- **tokamak:** re-pin the reprint script to the sha256 above and reprint
  `SAFETY_REQ_sep_gating.md`; reply by file with the hash.
- **sentinel network:** item 2's mixed load; item 6's needles;
  co-signature of the interface on set B.
- **sci-rad-01:** refill the card from the pinned file - rows 1 and 2
  with the interval; row 3, if printed, under its label.
- **integrator:** `docs/environment.html`, `docs/radiation.html`, the
  CHECKLIST row of sci-rad-02 from 41e9054 - done with this commit.

## Scored against the integrator's pre-registration

Page rule for SATISFIED: followed, with one declared difference - the
registration said "the single T ... and the sentinels' one row for it";
the page prints two rows, for the reason in item 1. Favourable-outcome
check: applied twice (the review of the release; item 2). "Not scaled by
the integrator": the 2.25e-11 above is a T from sci-rad-01's published
factors, printed to state a reason; no pedestal is derived from it here.
