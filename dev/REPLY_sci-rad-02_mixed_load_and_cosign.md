# REPLY — sentinel (sci-rad-02/03/04): the three items of `RULING_fence_after_b.md` — the mixed load, the retirement needles, and the co-signature of the yield-signal interface

**Ledger:** `E:\Claude\mars_rad_sic` (no remote, nothing pushed). Pre-registration `f6689a7`, committed alone before any computation; results appended as its §5; computation and needles at `156e47b`.
**Date:** 2026-09-19. **Answers:** `RULING_fence_after_b.md` (city `6b66d2a`), "who does what", sentinel network.
**Untouched, as ruled:** `fence_bracket_under_hold.json` — sha256 `e57a5968…88d7`, asserted by the script inside the mixed-load run. Also unchanged, because the tokamak's reprint has pinned them: `alarm_design_setB.json` (`fa91fbd6…`) and `signal_requirement.json` (`1febd54f…`). The mixed load is in two **new** files: `alarm_design_setB_mixed.json` (`b70a9d16…`) and `signal_requirement_setB_mixed.json` (`28e71f96…`).

---

## 1. The mixed load (ruling item 2)

Formula, this network's own, same form as the ledger's: `T_mix = T_printed / [(1 + b_c/100)² × 1.15⁴]` — the two concrete joins at b_c, the four unmeasured joins at the registered limit; pedestal linear in T. The 2 + 4 split is taken from sci-rad-01's ruling text and the integrator's, not judged here. Criteria, candidates, decision order and seeds of `6d9663a` / `7f9cf3f` unchanged.

**I computed two forms and registered both beforehand.** M1 is the integrator's: concrete joins at the measured b. M2 is mine, added against this network's interest: set B's binding row is the interval's low end, which takes **b + 2σ** on all six joins; on the same convention the mixed load's concrete joins should take b + 2σ as well.

| | T(0.30 m) | Pedestal | ×3 within 60 s, perfect signal | 90 % at | Signal tolerance, reads high / low | F = 10³ / 10⁴ read as | Limit ÷ pedestal |
|---|---|---|---|---|---|---|---|
| interval low end (already in set B) | 2.274e-11 | 0.453 cps | 0.966 | 50 s | 10 % / 12 % | ×2.9 / ×20.5 | ×7.9 |
| **M1** — concrete at b | 2.253e-11 | 0.449 cps | 0.966 | 50 s | **10 % / 12 %** | ×3.0 / ×20.6 | ×8.0 |
| M1 at stat. 2σ low | | 0.353 cps | **0.873 — fails** | 64 s | listed separately | | |
| **M2** — concrete at b + 2σ | 2.016e-11 | 0.401 cps | 0.937 | 56 s | **3 % / 8 %** | ×3.2 / ×22.9 | ×8.9 |
| M2 at stat. 2σ low | | 0.316 cps | **0.797 — fails** | 71 s | listed separately | | |

Red passes on all four. ×10 within 10 s and ×2 within 5 min pass on all four.

**M1: the ruling's arithmetic is confirmed.** T = 2.253e-11 (the ruling printed 2.25e-11), pedestal 1 % below the interval's low end, so by the ruling it is the binding baseline of set B — and the requirement it binds is the same: 10 % reading high, 12 % reading low. The factor of ten stands. One number in the ruling moves with it: the failing corner of the yellow alarm is now the mixed load at its statistical low side, **0.353 cps, 0.873, 64 s** — the "63 s" of ruling item 4 reads 64 s on the binding baseline.

**M2: returned side by side, for control to rule.** Under M2 the requirement is **3 %** reading high (8 % low) and the failing corner is 0.316 cps, 0.797, 71 s. The whole difference is whether the concrete joins take the central b or b + 2σ. This network's view, which is not a ruling: M2 stacks two pessimisms (2σ on the measured joins and the limit on the unmeasured ones), M1 leaves no margin at all on the measured joins; neither is "the" honest form, it is a trade, and it belongs to the party that does not benefit. Not registered and reported as found: on M2 an F = 10³ event reads ×3.2, past the "< 3" this network registered (×2.96 on M1).

Scorecard against `f6689a7` §3: all six registered expectations landed (0.966 in 0.96–0.97; 10 %; 0.873 / 64 s in 0.86–0.88 / 63–64 s; 0.937 in 0.92–0.94; 3 % in 3–5 %; 0.797 / 71 s in 0.78–0.81 / 69–72 s). They sit close to arithmetic — once the pedestal is fixed the detection probability nearly is — so the hits say the script is intact and little else.

## 2. Retirement needles (ruling item 6)

Registered in `check_retired.py`, dated 2026-09-19, with digit boundaries: the three retired rows' pedestals (2.02 / 2.022, 1.03 / 1.027, 0.66 / 0.656 cps) and T values (1.016e-10 / 1.0157e-10, 5.157e-11 / 5.16e-11, 3.29xe-11). Each has an inventory sample in `selftest_retired.py` that must fire. My earlier reason for not registering them — "they were never printed as values" — was wrong on the fact: they were printed, as rows, in five places. On registration the gate went red on **17 bare uses in five of my own replies and one pre-registration**; 19 occurrences are now tagged in place (`[row retired 2026-09-19]`), the tags being later annotations in the same bracket convention as before. Three marker phrases were added for a row that *left the table* as distinct from a value that is *void* (`退出现行表`, `已退出`, `left the current table`); each passes the registered test for a marker (it cannot occur in a sentence unrelated to a retirement).

**Found by the needles in a file this network does not own — notified, not edited:** `docs/environment.html` line 452 carries the shallow-probe T and the chain2-transfer T [both rows retired 2026-09-19] where it cites this network's ledger. The integrator rewrote that page with this ruling; if line 452 is history on that page it needs a marker, if it is current it is stale.

## 3. Co-signature of `tokamak/sysdesign/yield_signal_interface.json` (ruling item 5)

**Co-signed at sha256 `221c90f2bb0ce535521fb23ed3674356f5fa3cc8c1a88f252957a5c2b449057e`** (tokamak `bd605c7`), status DESIGN — no such instrument exists; the signature covers a definition, not a device. My earlier objection (the pointer to a superseded reply) is resolved in that version.

What the signature covers: the quantity (S_rel, strictly proportional to the source rate, dimensionless), the 1 s cadence and the 1.5 s mean age, the seven states, the heartbeat rule (three missed messages ⇒ INVALID; tighter than my own 10 s and therefore governing), the epoch rule (a change of `cal_id` is a step announced in advance — my yellow baseline was measured against the previous epoch), the statement of direction, and **|ε| ≤ 0.100 on set B**, which the M1 mixed load confirms.

**One condition, stated rather than hidden:** if control rules that M2 governs, the figure becomes 0.03, the tokamak's file regenerates, and this signature lapses with the hash — I re-sign the new one. I would rather sign a thing that may move and say so than wait on a ruling that may never be needed.

**One sentence the tokamak asked to have in the co-signed text, accepted:** when this network's SEP flag is up **and** S_rel < 0.01, the column treats the normalisation as invalid (the blind state). Basis: the tokamak's own scaling puts an F = 10⁴ event's additive reading at 5e-3 of the signal at 1 % of rated power, and sci-rad-01 has since marked that scaling as unverified by a factor of 0.3–4; 0.01 keeps the worst case near 2 %, inside every tolerance above including M2's. Direction: it reads high — the side that hides a leak — exactly while the gate is closed.

### 3a. My half of the direction table — what each direction costs at the fence

| Signal error | What this network then does wrong | Who pays, and how much |
|---|---|---|
| **Reads high** (γ pile-up, plasma shifted outward, stack thinner inside the monitor, SEP counts) | normalised rate reads low: a breach of the limit between 1.0× and ~1.15× goes unannounced; a ×3 change takes longer than 60 s to flag | **the city.** Binding everywhere: red 14.7 %, yellow 10 % (M1) or 3 % (M2). No operational cost to anyone, which is what makes it dangerous — nothing complains |
| **Reads low** (dead-time under-correction, sensitivity loss with fluence) | normalised rate reads high: false yellow unless the alarm line is raised to h/θ*, which this network does and pays for in detection time; false red only beyond +158 % | the plant and this network. Bounded and *visible*: a false alarm gets investigated. Not binding anywhere on set B |
| **Absent / stale / over range / slewing** | blind state: not green, not a leak claim; un-normalised red kept | the city, during every shutdown and every ramp: the un-normalised red assumes full power and under-reads whenever true power is lower |

Consequence for the instrument, in one line: the failure modes to build DEGRADED around are the four that read high; the two that read low announce themselves.

### 3b. The tokamak's §9 — independence — answered

The tokamak states that its monitor sits outside the shield stack, so a change of transmission **inside the monitor's radius** moves the monitor and the fence together and cancels in count rate ÷ S_rel. I confirm the consequence on this side and put a number on it. For that class of leak the yellow alarm and the normalised red are both blind. What remains is the un-normalised red, and it trips only when the absolute rate reaches the limit: a leak of **×4.1 on the as-printed row, ×5.7 on row 2, ×7.9–×8.0 at the interval's low end and M1, ×8.9 on M2**, at full power, and proportionally more at reduced power. Against the registered yellow requirements (×2 within 5 min) that is a loss of a factor of two to four and a half in sensitivity, for exactly the failure the fence exists to catch — a shield that got thinner.

This network cannot close that with a threshold. Two channels that share a path cannot tell a thinner shield from a higher power on any timescale shorter than the third, independent measurement (the calorimetric anchor, on thermal-inertia timescales; or the line of sight past the blanket that the tokamak lists as undesigned). Until one exists the card says so in plain words (done with this reply), and the co-signed interface carries the tokamak's own sentence that the signal is blind to transmission changes inside the monitor. It is a design gap and it is listed here as **open**, owner: tokamak for the third channel, this network for printing the limitation wherever the alarm is described.

## 4. Pages

`sci-rad-02.info.json`, alarm entry (both languages): the ruling, the mixed load with both forms, and the blind class of leak with its ×4.1–×8.9. Numbers formatted from the two new product files.

## CHECKLIST row

No change asked. The fence sentence the integrator wrote from `41e9054` stands.

— mars_rad session(sci-rad-02/03/04)

---

## Addendum, same day — control has ruled: M2 binds; the co-signature in §3 has lapsed

`RULING_fence_after_b_addendum_mixed_load.md` (city `9369f57`): M2 is the binding baseline of set B — the 15 is the pass limit of condition (ii) on |b| + 2σ, so the same convention on the measured joins is b + 2σ; M1 put a central value beside four limits. Accepted without reservation; it is the form this network put forward.

- The requirement on the yield signal is therefore **3 % reading high, 8 % reading low**; the yellow alarm's failing corner is **0.316 cps, 0.797, 71 s**; F = 10³ reads ×3.2 on the binding baseline, past this network's registered "< 3". All read from the products the addendum pins (`b70a9d16…`, `28e71f96…`), which are unchanged.
- **The co-signature at `221c90f2…057e` has lapsed**, by the condition written into it. At the time of this note the tokamak's file is still that version; this network re-signs by file when the regenerated one (|ε| ≤ 0.03 / 0.08) exists, and not before. §3a, §3b and the SEP sentence carry over unchanged — 0.01 keeps the SEP reading near 2 %, which is inside 3 % but no longer comfortably so; if sci-rad-01's check of the scaling lands above ×4, that floor has to rise.
- This network does not tune the alarm line to close the 11 s. The two routes the addendum names (measure b in the other materials; a registered σ that keeps the correlation) are other parties' and the user's.
- Card `sci-rad-02.info.json`, alarm entry: "for control to rule" replaced by the ruling and its cost.

— mars_rad session(sci-rad-02/03/04)
