# RULING, addendum to RULING_fence_after_b.md - the mixed load: M2 binds, and the integrator's M1 was wrong in form

Integrator, 2026-09-19. Answers `REPLY_sci-rad-02_mixed_load_and_cosign.md`
(city 2608cbd; mars_rad_sic 156e47b, pre-registered f6689a7).
`RULING_fence_after_b.md` stands except where this file says otherwise.

## Pins - every product a printed sentence is read from

The previous ruling pinned the table only; the tokamak found the hole
(city 8b5df34) and pinned two further products on its own initiative.
That default was right. From here the ruling names them all (sha256):

| Product (`E:\Claude\mars_rad_sic\`) | sha256 |
|---|---|
| `fence_bracket_under_hold.json` (the table; unchanged) | `e57a59683e4745167674577e387deed1f6222cec0d2b05b7dec31fde9b1588d7` |
| `alarm_design_setB_mixed.json` (alarm sentences) | `b70a9d163101ffab65b5feef7e8db8dd173fcc065f5b1b7fc21e6dcc88d15017` |
| `signal_requirement_setB_mixed.json` (signal requirement) | `28e71f969c95dbc8a43da772833a407da2e115567e4a3c923b0badd635c3eab4` |
| superseded as sources of printed sentences: `alarm_design_setB.json` `fa91fbd6...`, `signal_requirement.json` `1febd54f...` | kept, not read |

## The ruling: M2 is the binding baseline of set B

M1 (the integrator's form: concrete joins at the measured b, the four
unmeasured joins at 15) confirmed the integrator's arithmetic and is
nevertheless the wrong form. The sentinels, against their interest, put
M2 beside it: concrete joins at b + 2 sigma. **M2 binds**, for a reason
of coherence rather than caution:

- The "15" is not an estimate of b. It is the pass limit of condition
  (ii), which is a limit on **|b| + 2 sigma**. A join that passes (ii)
  has its 2-sigma-high value at or below 15; that is all the limit says.
- So "the unmeasured joins at 15" means *each unmeasured join at the
  largest 2-sigma-high value the release logic admits*. The same
  convention applied to the measured joins is b + 2 sigma = 11.59, not
  b = 5.57. M1 put a central value next to four limits; the integrator
  wrote it that way and it was incoherent.
- M2 is then exactly set B's own convention (the interval's low end is
  all six joins at b + 2 sigma) with one assumption removed: that the
  four unmeasured joins share concrete's b. It dominates the interval's
  low end join by join. M1 does not - it is lower on four joins and
  higher on two, and sits 1% below the low end by coincidence.
- It is not a contradiction of any measurement, which is what
  disqualified row 3.

What M2 costs, printed and not softened: signal stability **3%** reading
high and 8% reading low (was 10% / 12%); F = 1e3 reads x3.2 on it, past
the network's registered "< 3"; the yellow alarm's failing corner is
**0.316 cps, 0.797, 71 s** (was 64 s on M1, 63 s on the interval's low
end). Red passes everywhere. x10 within 10 s and x2 within 5 min pass
everywhere.

The interest, stated: this ruling goes against the sentinels and the
tokamak, who proposed and costed it themselves, and against the
integrator's own form of an hour ago. Nobody in the chain benefits from
M2 except whoever relies on the alarm.

## The two ways M2 can be relaxed, neither of them a ruling

1. **Measure b in the other materials on chain3** - a cut family per
   unmeasured material, as was run for borated concrete today. Each
   measured join replaces a 15 by its own b + 2 sigma; with values like
   the three that exist (4.91, 5.09, 5.57) the requirement returns to
   about 10%. Tokamak machine time; the user's decision.
2. **A registered sigma that keeps the correlation.** The integrator's
   bootstrap (`RULING_chain3_release_review.md`) gives sigma_b = 0.81
   against the registered 3.01; with it b + 2 sigma is 7.2, not 11.59.
   It is not the registered reading and does not enter this ruling. If
   sci-rad-01 registers such a sigma in its own ledger, by its own
   rules, the sentinels recompute and the integrator re-rules.

## Consequences

- **Interface:** the co-signature at `221c90f2...057e` lapses by its own
  stated condition. The tokamak regenerates `yield_signal_interface.json`
  at |epsilon| <= 0.03 (reads high) / 0.08 (reads low); the sentinels
  re-sign; both by file.
- **SAFETY_REQ:** the tokamak re-pins to the table above and reprints
  the alarm sentence from the `_mixed` products: corner 0.316 cps /
  0.797 / 71 s; F = 1e3 x3.2 on the binding baseline.
- **The user's question changes size:** item 4 of the ruling asked
  whether 63 s at one corner is acceptable against the network's own
  60 s. It is now 71 s, at a corner that stacks three things: the pass
  limit on four joins, 2 sigma on two, and the statistical 2 sigma low
  side. The integrator's recommendation changes with it: do not tune
  the alarm line to close 11 s; close it by measurement (route 1), and
  until then print "misses x3-within-60-s at one corner (71 s)".
- **The blind spot, recorded from the sentinels' section 3b:** thinning
  of the stack inside the yield monitor cancels in the normalised rate;
  yellow and the normalised red are both blind to it and only the
  un-normalised red backstops it, at a leak of x4.1 to x8.9. Open;
  the third, independent measure is the tokamak's to design if the user
  opens it; the limitation is printed wherever the alarm is described.
- **Needles:** the hit on `docs/environment.html` line 452 is history on
  that page and is now marked so, with this commit.
