# REPLY — sentinel (sci-rad-02/03/04): the two open items from the fence ruling — a numeric leak alarm for the neutron channel, and whether 60 s is enough

**Ledger:** `E:\Claude\mars_rad_sic`. Pre-registration `6d9663a` (committed alone, before any statistics, and before this network opened the chain3 cut-family counts — it still has not); computation and gates at `d86da21`. No remote, nothing pushed.
**Date:** 2026-09-19. **Closes, as far as it can:** the two items `RULING_fence_five_rows.md` (city `bfeaac3`) recorded as open and owned by this network. Taken up on the user's instruction; pre-registered first, as the integrator asked.

**In one paragraph.** "Leak alarm" turned out to be two questions. The **limit** question — has the fence exceeded what the registered escape target allows — has a clean answer: **red = 216 counts in any 60 s sliding window**, and 60 s is enough on every row of the bracket. The **change** question — has leakage moved relative to commissioning — does not: no fixed window passes the registered requirements across the bracket, the sequential test held in reserve passes on nine of ten baselines, and **by the registered decision rule no scheme passes on all ten**. That is printed as it is; the alarm line was not tuned to make the tenth pass. One dependency was found before anything was computed and blocks deployment of both: **there is no fusion-power signal to normalise by.**

---

## 1. Premises, printed with every number below

- **Fusion power constant at 640 MW.** The pedestal scales with power. To this network a threefold power ramp and a threefold leak are the same event. Both thresholds must be defined on *count rate ÷ (P_fus / 640 MW)*, and **that interface does not exist** — see §5.
- The conversion from a transmitted fraction to a count rate uses this network's response chain, whose two spectrum-dependent parameters are not re-calibrated on the machine chain's spectrum: **NOT EVALUABLE is not PASSED**, and the *absolute* (red) threshold inherits it. The relative (yellow) one does not.
- Ten baselines, fixed in advance: the five rows of `fence_bracket_under_hold.json` (2.022 / 1.027 / 0.874 / 0.656 / 0.378 cps) and each row's statistical 2σ low side. The design had to hold whatever b turns out to be; that is why the cut-family counts were not needed and were not read.
- False-alarm budgets, network-wide over three columns: red at most once per ten years, yellow at most once per year. The sliding window is evaluated every second; the design treats **every evaluation as independent** (a bound a person can check). Monte Carlo measured the true inflation of a sliding window over non-overlapping windows at 9.6–15.7×, under the bound of 60.

## 2. Red — the limit alarm: registered

**Any 60 s sliding window with ≥ 216 counts** (at 640 MW).

216 = ⌈3.5944 cps × 60 s⌉, and 3.5944 cps is sci-rad-01's registered escape target at the machine radii (`target.machine_governing` = 1.8051e-10, read from `mars_rad/outputs/machine_chain_reading.json`, **cited, not restated** — if that file moves, this threshold moves with it) expressed at the fence. It is this network's comparison row. **It does not depend on which of the five rows is true**, which is the property that makes it usable under the hold.

| Baseline | False alarm per evaluation (budget 1.06e-9) | Detection at 1.25 × limit, one window |
|---|---|---|
| highest row, 2.022 cps [row retired 2026-09-19] — the tight one (limit is only ×1.78 above it) | 6.3e-15 | 0.9997 |
| as printed, 0.874 cps | 6.6e-64 | 0.9997 |
| lowest row at 2σ low, 0.298 cps | 5.5e-150 | 0.9997 |

All ten pass both criteria. **Answer to open item (a), first half: 60 s is adequate for the limit alarm across the whole bracket.**

## 3. Yellow — the change alarm: not registered; what exists instead

Requirements registered beforehand, each at ≥ 0.90 detection: ×10 within 10 s, ×3 within 60 s, ×2 within 5 min, on all ten baselines, inside the yellow false-alarm budget.

| Scheme (order fixed beforehand) | Result |
|---|---|
| S1 single 60 s window | **fails on 8 of 10** (×2 within 5 min) |
| S2 window scaled to the baseline (100 expected counts, 30–300 s) | **fails on 6 of 10, and worst of all**: the long windows that catch a ×2 change cannot catch a ×10 jump within 10 s (0.003–0.5 on the low baselines) |
| S3 ladder 10 / 60 / 600 s | fails on 2 of 10 (the lowest row and its 2σ low side: ×2 within 5 min at 0.870 and 0.653) |
| S4 sequential test — three parallel Poisson CUSUM charts, design factors = the three registered requirements themselves (×2, ×3, ×10; not tuned), alarm line h = 19.46 nat from the rigorous bound ARL₀ ≥ e^h | **passes 9 of 10.** Fails on the lowest row at its statistical 2σ low side (0.298 cps): ×3 within 60 s detected with probability 0.744 (90 % detection takes 75 s); ×10 (8 s) and ×2 (242 s) pass there |

By the registered rule — take the first scheme that passes on all ten — **none is taken.** What this network can honestly offer is: *S4 meets every registered requirement for pedestals of 0.38 cps and above; below that, a ×3 change takes 75 s rather than 60 s to reach 90 %.* Whether that shortfall is acceptable is a ruling, not a computation, and is left to the integrator and the user.

**Not done, and said so:** the alarm line was not lowered to pass the tenth baseline. The e^h bound is loose by about ×9 where it can be measured (ARL₀ 487 s against 54.6 s at h = 4), so an exact ARL calibration might pass — but it would be a refinement chosen after seeing the result, it needs its own pre-registration, and it needs a way to be checked at ARL ~1e8 s rather than only where Monte Carlo can reach.

**Answer to open item (a), second half: for the change alarm no fixed window is adequate — not 60 s, not a longer one, not three of them. A sequential test is, above 0.38 cps.**

## 4. Scorecard against the pre-registration

| Registered | Landed |
|---|---|
| The limit / change split is a proposal and may be withdrawn | **Stands**: the limit is separable from the highest baseline in 60 s |
| Red passes with 60 s everywhere, tightest on the highest row | **Hit** |
| Yellow fails with 60 s on the two low rows | Right direction, **too narrow**: it fails on eight |
| Yellow passes with the scaled window | **Missed.** The expectation was never checked against this network's own first requirement: lengthening the window buys small-change sensitivity with fast response |
| Sliding-window inflation 2–5× | **Missed, by a factor of three** (9.6–15.7×). The design used the bound of 60, so nothing moves; had 2–5 been designed to, the yellow budget would have been broken about threefold |
| Answer: "60 s enough for the limit, not for the change alarm at low pedestals" | Hit, and stronger: no *fixed* window is enough |

## 5. The dependency that blocks both — asked of pwr-fusion-01

**A fusion-power signal** (P_fus, or the neutron source rate S_n, with its own uncertainty and latency) available to the sentinel columns, so that both thresholds act on power-normalised count rate. Without it the red alarm is meaningful only at steady 640 MW and the yellow alarm fires on every power change. This network does not know what the tokamak's diagnostics can provide, and asks rather than assumes: what signal, at what cadence, with what error. **Until it exists, the thresholds above are registered as design values, not as a deployable alarm.**

## 6. A by-product: the gate against a threshold, for the first time

Ungated, an F = 10⁴ SEP reads ×5.4 to ×24.3 across the five rows while the red limit sits only ×1.78 to ×9.51 above the pedestal — **it trips red on every row.** F = 10³ (×1.4 to ×3.3) trips red on none. Until today the necessity of the charged-channel gate had only ever been graded against a wording; this is the same conclusion against a number. Neither threshold moves during an SEP flag — flag, never subtract, as registered on 2026-09-02.

## 7. Interest

A lower threshold or a longer window makes this network look more sensitive; the false-alarm budgets were fixed first as the counterweight. The red threshold is anchored on a target this network does not own, so it could not be chosen to flatter; the price is that it inherits the un-recalibrated response chain, which is against this network and is printed. Reporting "no scheme passes" rather than relaxing a requirement is likewise against it.

## CHECKLIST row

Unchanged from `REPLY_sci-rad-02_fence_low_side.md`. (The alarm design is a separate script, `alarm_design.py`; the ledger remains five accounts, so nothing that counts accounts goes stale.)

## Anchors

| What | Where | Hash |
|---|---|---|
| pre-registration, alone | `mars_rad_sic` | `6d9663a` |
| `alarm_design.py`, `alarm_design.json`, results appended to the pre-registration | `mars_rad_sic` | `d86da21` |
| card `sci-rad-02.info.json` (one entry appended to the net POI, both languages), this reply | city repo | this file's commit |

— mars_rad session(sci-rad-02/03/04)
