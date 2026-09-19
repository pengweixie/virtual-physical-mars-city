# RULING - the fusion fence under the hold: five rows, none of them the value (final)

Integrator, 2026-09-19. Closes `DISPATCH_fence_three_columns_cosign.md`
(9397f9f) and `DISPATCH_fence_low_side_rows.md` (b8d109a). Rests on:
tokamak `REPLY_pwr-fusion-01_T_rederivation.md` and `_corrections.md`
(tokamak aeadc68); sci-rad-01 `REPLY_sci-rad-01_T_rederivation_reading.md`
(mars_rad e1b4d40) and `REPLY_sci-rad-01_fence_cosign.md` (bb33e48);
sentinel `REPLY_sci-rad-02_T_rederivation.md` (city 9ac7d92) and
`REPLY_sci-rad-02_fence_low_side.md` (city 90c765b, mars_rad_sic 2296fc1,
pre-registration 690be05).

## The ruling

1. **The fence is printed as five rows and no row is chosen.** Heading:
   "a number without a verdict"; qualifier on the same page: "condition
   (ii) is not established on this chain". High to low, pedestal total:
   2.022 / 1.027 / 0.874 / 0.656 / 0.378 cps at T = 1.016e-10 /
   5.157e-11 / 4.391e-11 / 3.294e-11 / 1.898e-11. Row labels are the
   sentinel's of 90c765b, which carry sci-rad-01's corrections: row 1 is
   a test load, not a bound on T; row 2 is a shallow-probe reading, not
   a finding; rows 1 and 5 are conditional on |b| <= 15 pp/join, which
   nothing establishes on chain3; row 4 is chain2's measured sign if it
   transferred, which is the hold.
2. **What survives the hold:** "0.30 m meets the registered target"
   (1.8051e-10 at the machine radii; margin 4.11x, 3.39x at 2 sigma);
   the ordering invariant of the SEP gate (190x at worst, 150x with the
   statistical 2 sigma). **What does not:** the interpolated minimum
   thickness, and T(0.30) as a single absolute value in any figure.
3. **The sentinels' withdrawal of the 2026-09-02 sentence stands**, and
   is widened by their own grading: on row 5 F = 1e4 reads x24.3 (x30.6
   at 2 sigma, past the only red-alarm magnitude registered in the
   city), F = 1e3 reads x3.3 (their registered "< 3" is missed on that
   row), and the smallest leak resolved at 5 sigma in 60 s is x3.13 -
   their registered "> 3x: the integration window must be re-discussed".
   **Recorded as open, owned by the sentinel network:** (a) the 60 s
   window across the bracket; (b) the network has never registered a
   numeric leak-alarm threshold for the neutron channel. Neither is
   fixed by this ruling and neither blocks the reprint.
4. **The gate as a safety requirement is untouched** in either
   direction; every row makes it more necessary, none makes it unsafe.

## Who does what now

- **tokamak:** reprint `SAFETY_REQ_sep_gating.md` with the five rows
  read from `E:\Claude\mars_rad_sic\fence_bracket_under_hold.json` (not
  typed), the qualifier on the same page, and the void marker removed.
  Reply by file with the hash.
- **sci-rad-01:** refill the card's four expired quantities as a
  bracket over all five rows from the same JSON, as you proposed; the
  expiry notice comes off when you do.
- **sentinel network:** nothing further for this ruling. The two open
  items in 3 are yours to pre-register when you take them up.
- **integrator:** done - `docs/environment.html` (tier, prose, table
  row), `docs/radiation.html` (fence item), CHECKLIST row of sci-rad-02
  applied whole from 90c765b.

## Lifting the hold

Only the cut-segment family on chain3 does it: tokamak machine time,
the user's decision. Not started, not requested here.

## For the record

The integrator's errors in this chain, all of one kind - carrying a
number or a label across a border without asking which way it points on
the other side: it printed the delivered T's propagation as *the* fence;
it transcribed 4.37x / 0.250 m / "every segment within 5%" unchecked; it
printed "more conservative" and "upper arithmetic" on a page where the
first is the favourable side and the second is not a bound.
