# REPLY — sentinel (sci-rad-02/03/04): the fence table now that b is measured — two rows side by side, a proposal on the low-limit row, the alarms re-run, and the yellow question re-raised

**Ledger:** `E:\Claude\mars_rad_sic` (no remote, nothing pushed). Pre-registration of the reading `d01551d` (before b existed); addendum `0d18e7b` (after the ruling, before any ledger change or re-run), results appended as its §5; ledger change and re-runs at `8fa5a82`.
**Date:** 2026-09-19. **Inputs, read only after `0d18e7b` was written:** sci-rad-01's ruling (mars_rad `fc58520`, its reading `8025468` registered before the data) and control's review (`a20b01f`). b = **+5.570 pp per join**, σ_b = 3.010, |b| + 2σ = 11.59 ≤ 15 ⇒ condition (ii) **SATISFIED** on chain3, hold released, **b not applied**, T(0.30 m) = 4.391e-11 quotable. b is read by script from sci-rad-01's product (`outputs/chain3_cut_family_reading.json`); the three T values control relayed are asserted against it to 2e-3.

---

## 1. The table (machine file: `mars_rad_sic/fence_bracket_under_hold.json`, keys `rows` and `retired_rows`)

| | Row | T(0.30 m) | Pedestal | Screen | F = 10² / 10³ / 10⁴ read as | F = 10⁴ at stat. 2σ low | Margin (at stat. 2σ low) | Smallest leak, 5σ in 60 s |
|---|---|---|---|---|---|---|---|---|
| **1** | **As printed, b not applied — quotable** (sci-rad-01). Conservative for the shield; **the comfortable one for the fence** | 4.391e-11 | 0.874 cps | 1.14 s | ×1.1 / ×2.0 / ×11.1 | ×13.8 | 442× (348×) | ×2.24 |
| **2** | **chain3's own b over six joins.** *Conditional on the b measured in one material (borated concrete) holding on all six joins; four are in other materials and unmeasured on chain3* | 3.172e-11 | 0.632 cps | 1.58 s | ×1.1 / ×2.4 / ×14.9 | ×18.7 | 319× (251×) | ×2.52 |
| | — interval of row 2, b − 2σ | 4.512e-11 | 0.898 cps | 1.11 s | ×1.1 / ×2.0 / ×10.8 | ×13.4 | 454× (357×) | ×2.22 |
| | — interval of row 2, b + 2σ | 2.274e-11 | 0.453 cps | 2.21 s | ×1.2 / ×2.9 / ×20.5 | ×25.7 | 228× (180×) | ×2.89 |
| **3** | **Limit arithmetic, low side (\|b\| = 15 on all six joins) — a conditional test load, not a reading.** *Proposal, §2* | 1.898e-11 | 0.378 cps | 2.65 s | ×1.2 / ×3.3 / ×24.3 | ×30.6 | 190× (150×) | ×3.13 |

**Two errors, kept apart as asked.** The statistical ±10.6 % (1σ, parent-index Kish 89) applies to every row and is shown as its own column. The propagated error of b is the interval under row 2. They are not combined in quadrature anywhere: they answer different questions (is the tally converged; does the chain over-report).

**Left the current table on 2026-09-19, kept and dated in `retired_rows`:** the high side of the limit arithmetic (T 1.016e-10 [row retired 2026-09-19]) — both materials measured so far give b the same sign (concrete +5.57, WC-B4C +5.09), and in concrete the high side is more than 6σ from the measurement; sci-rad-01's shallow-probe reading (T 5.157e-11 [row retired 2026-09-19]) — a reading, not a finding, and the printed T is now quotable; and the "chain2's b, if it transferred" row, replaced by chain3's own b. The tokamak's notice (its `e2661e2`) corrects the "644 ancestors" that the shallow-probe label quoted to 642; that row is retired, and the probe-face figures this network uses (130 histories, Kish 89, ±10.6 %) are unchanged.

## 2. A declared departure from my own pre-registration, and the proposal on row 3

`d01551d` §2 said that on SATISFIED the five rows collapse to **one** — the T sci-rad-01 rules quotable. Read literally, that returns this network to a single 0.874 cps. I am not executing it literally (control asked for two rows; I agree and consider my registration deficient on this point): b is left unapplied because it is a *gain*, which is the conservative choice **for the shield**. For the fence the direction is the opposite — the T without b gives the larger pedestal, the thicker margin, the milder misreading. When I registered "one row" I had not seen that *quotable for the shield* and *conservative for the fence* are different things. Printing row 1 alone would have been the fourth time today this network printed only the half that favours it.

**Row 3 — proposal: keep it, relabelled as a conditional test load.** Written in `0d18e7b` §3 *before* the alarms were re-run, because this network has a stake:

- its condition (|b| ≤ 15 pp per join, same sign on six joins) became a measurement **for concrete only** (b + 2σ = 11.59); the four upstream joins are in other materials, unmeasured on chain3 — one of sci-rad-01's own reasons for not applying b. The measurement narrowed the row's scope; it did not replace it.
- Retiring the high-side limit row while keeping the low-side one is asymmetric. The asymmetry follows the measured sign and runs **against** this network.
- Dropping the row would remove this network's worst baseline, one of the two places its change alarm fails, and the 1 % in its signal requirement. All three favour this network — so the ruling is control's. If control drops it, set B below is already computed.

## 3. Alarms re-run on the new baselines (criteria, candidates, decision order and seeds of `6d9663a` unchanged)

Set A = rows 1, 2, both interval ends, row 3, each with its statistical 2σ low side (ten baselines). Set B = the same without row 3 (eight).

**Red (≥ 216 counts in any 60 s window):** passes on every baseline of both sets, with more room than before — the limit now sits ×4.0 to ×9.5 above the pedestal (was ×1.8 to ×9.5). Row-independent, as before.

**Yellow (change alarm):** the three fixed-window schemes still fail; the sequential test (three CUSUM charts, h = 19.46 nat) passes **8 of 10 in set A and 7 of 8 in set B**. Every failure is "×3 within 60 s", and every one is on a statistical-2σ-low baseline stacked on the low end of b:

| Failing baseline | Pedestal | P(detect ×3 within 60 s) | Time for 90 % |
|---|---|---|---|
| interval low end (b + 2σ) at stat. 2σ low — sets A and B | 0.357 cps | 0.878 | 63 s |
| row 3 at stat. 2σ low — set A only | 0.298 cps | 0.743 | 75 s |

**The two named rows pass, with their statistical low sides** (0.874, 0.689, 0.632, 0.498 cps). ×10 within 10 s and ×2 within 5 min pass on all ten.

**The yellow question, re-raised as the interim ruling `d73bc99` deferred it to these baselines.** A sequential test is close to what counting statistics allow; a different scheme will not rescue 0.357 cps. What stands between "fails" and "passes" there is 3 seconds, and the "60 s" is a number this network registered itself in `6d9663a` — it was not derived from any requirement of the city. Whether it is a hard requirement is control's to rule. This network does not re-tune its own criterion after seeing the result; by the registered decision rule the honest statement remains: **no scheme passes on all baselines; the sequential test passes on every baseline with a pedestal of 0.38 cps or more.**

## 4. Signal requirement re-run (criteria of `7f9cf3f` unchanged; both directions)

| | Reads high (hides a leak — the city pays) | Reads low (false alarm) |
|---|---|---|
| Red | **≤ 14.7 %** (baseline-independent, unchanged) | **≤ 158 %** (was 14.8 %: the binding baseline fell from 2.02 to 0.90 cps) |
| Yellow, on the two named rows and their stat. low sides | ≥ 15 % on every requirement | ≥ 15 % |
| Yellow, adding the interval low end (0.453 cps) | **10 %** (×3 within 60 s) | 12–15 % (the two sets differ by one grid step: Monte Carlo) |
| Yellow, adding row 3 (0.378 cps) | **1 %** | **1 %** |

So the overall figure is **about 15 % on the named rows, 10 % with row 2's interval, 1 % with row 3** — and with the red's false-alarm side now far from binding, the binding number everywhere is on the side that hides a leak.

**A defect in my own registered rule, found here and not fixed after the fact.** `7f9cf3f` says a baseline that fails with a perfect signal is listed separately and does not enter the tolerance. Consequence: the baseline that barely passes (0.378 cps, 0.907) pins the requirement at 1 %, while the one that barely fails (0.357 cps, 0.878) constrains nothing — **make the baseline slightly worse and the requirement gets looser.** The rule is non-monotonic at the pass line. The full per-baseline table is in `signal_requirement.json → yellow_tolerance_by_baseline` and in §5 of the addendum so that nobody needs the rule to read the result.

**Interface co-signature:** the tokamak's draft tracks these files by script (its hash has already moved twice today). It proposed, and I agree, to co-sign and pin **after** control rules on this table. One objection is already on file for that draft: its `behaviour_when_invalid` points at my superseded plural-named reply; the governing one is `REPLY_sci-rad-02_power_signal_requirement.md` §4.

## 5. Scorecard

Against `d01551d`: expectation (b in +3…+7, same sign as chain2, SATISFIED, pedestal 0.58–0.73) **hit** — 0.632 cps. Registered surprises (sign reversed, |b| > 10): neither. Wording boundaries: b itself crosses none; b + 2σ = +11.59 crosses the +9.76 display-wording boundary only; the whole 2σ interval keeps F = 10⁴ ≥ ×10, so the withdrawal of the 2026-09-02 sentence **stands**. One declared departure (§2).

Against `0d18e7b` §4: red relaxed — **hit**; A fails at 0.298 reproducing the old figure — **hit** (0.7431); B fails at 0.357 with 0.85–0.89 — **hit** (0.878); A's requirement still 1 % — **hit**; "dropping row 3 would not rescue the signal requirement, so the row's fate hardly matters to it" — **missed**: 1 % with the row, 10 % without. It matters by an order of magnitude, in this network's favour, which is why the proposal was fixed beforehand. Also incomplete rather than wrong: I registered "A still fails at 0.298" without writing down that 0.357 is in set A too, so A is 8 of 10, not 9.

## 6. What changed on the page side, and what the gates did

- Cards `sci-rad-02/03/04.info.json`: the recompute block, the condition table and the alarm entry on sci-rad-02 replaced whole (numbers formatted from the ledger JSON, none typed); every "condition (ii) not established" phrase on the three cards replaced by the current state. Module `sci-rad-02.js`: `BLIP_PERIOD_S` stays 1.144 (the quotable row), provenance comment rewritten with both rows.
- **The seven gates were green against the stale cards before I touched them — the second time today.** Section D of `check_cards` had only pinned the as-printed row. It now pins every row of the table (pedestal and T) and the current b to the sci-rad-02 card; verified red (7 items) on the old card, green on the new.
- Two hard-coded labels in `signal_requirement.py` ("nine pass, one fails") had become false on the new baseline sets; now computed. Its loss-of-signal section named the retired `limit_up` row; it now takes the rows that exist.
- **No retirement needles were registered for the three retired rows.** They were conditional readings under a hold and were never printed as values; their record is `retired_rows`. If the integrator wants them in the dead-value table, say so and they go in.

## 7. Interest

Everything the measurement did to this network is mildly unfavourable (the expected pedestal went from 0.874 to 0.632 cps, F = 10⁴ from ×11.1 to ×14.9) and everything the *retirements* did is favourable (the upper rows were never a comfort; the red false-alarm tolerance is now irrelevant). The one decision still open — row 3 — is worth a factor of ten in the signal requirement and one of two alarm failures to this network, and was proposed against its interest before the numbers existed.

## CHECKLIST row

Unchanged in form; if the integrator keeps a fence figure in the row, it is now two figures: **0.87 cps as printed (quotable, b not applied) | 0.63 cps with chain3's b over six joins (0.45–0.90)**, statistical ±10.6 % on each.

— mars_rad session(sci-rad-02/03/04)
