# DISPATCH - six decisions by the user, 2026-09-20, as given to the integrator

Integrator. The user answered the integrator's six open questions in the
integrator's session. The words are quoted as typed; the integrator
adds nothing to them. A session that needs the user's word in its own
session before spending machine time should ask there - this file is a
record of what was said to the integrator, not an authorisation issued
by it.

| # | Question as put to the user | The user's answer, verbatim |
|---|---|---|
| 1 | 移位算例跑不跑(决定单点产额监测器这条路通不通) | 「跑」 |
| 2 | 其余四种材料跑切段族,约 4 小时(M2 的 3% 要求能放宽回约 10%,71 秒那个角也一起关掉) | 「okay」 |
| 3 | 要不要开一路「不经过包层的视线」的设计 | 「开」 |
| 4 | 在上面几件有结果之前,71 秒能不能先接受 | 「能」 |
| 5 | v1.4.1 发不发 | 「发」 |
| 6 | 村子内衬 Run D 要不要补种子 | 「补」 |

## To pwr-fusion-01 (tokamak) - items 1, 2, 3

Order, by the integrator: **1 first** (it decides whether a single-point
monitor is a path at all; your pre-registration 1a1425a already holds
the expectation +1..+3% for 5 cm outward), **then 2**, **3 in parallel
as design work** (it needs no VM time until it has a geometry).

- **Item 1, displaced plasma.** Pre-registration exists. Before the
  run, add what the result *forces*: under M2 the reads-high budget left
  for position is 1.0%; write down now which outcome means "one monitor
  suffices", which means "needs a second point / averaging", which
  means "this path is closed". Both directions of displacement if the
  machine time allows - inward reads low, which is the false-alarm side
  and has its own budget (8%).
- **Item 2, cut families in the four unmeasured materials.** Same design
  as today's concrete family (five cuts against one slab, default seed,
  parent index, driver committed before launch, counts to nobody until
  sci-rad-01 has said whether it registers anything further). The
  reading is sci-rad-01's, per material. Trace ancestors to the event
  id. State beforehand, per material, whether the reference slab is
  expected to be starved - a starved board decides nothing and costs the
  same. After the readings: the sentinels recompute the mixed load with
  each measured join at its own b + 2 sigma (their formula, a new
  `_mixed` product, the table file untouched), and the integrator
  re-rules with new pins.
- **Item 3, a line of sight that bypasses the blanket.** Open it as its
  own account, pre-registered before numbers, requirement read from the
  sentinels' products. The questions the integrator asks first: what it
  is independent of (it must not share the stack's transmission, or it
  cures nothing); what it costs the shield (a sight line is a duct, and
  your delivery says "no duct streaming" - the streaming through it is
  part of this account, not someone else's); whether your transport can
  compute it at all, and if not, what can. sci-rad-01 and the sentinels
  answer questions put to them by file.

## To the sentinel network - item 4

The user accepts, for now, that the yellow alarm misses
x3-within-60-s at one corner (71 s on the binding baseline M2). It
stays printed as a miss; it is accepted, not relaxed, and "for now"
ends when item 2's readings land. Your transient reservation (lag plus
static bias) is separate and stays yours.

## To res-glass-01 (glass) - item 6

Run D (the polymer liner in the village cabin, -6.8% +/- 5.3%,
unresolved at three seeds): add seeds. Pre-register first how many and
what difference you would call resolved, in both directions; paired
differences against the same-seed unlined runs, as before. Reply by
DELIVERY file.

## Item 5

The integrator releases v1.4.1.
