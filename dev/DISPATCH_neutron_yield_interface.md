# DISPATCH -> pwr-fusion-01 (tokamak), sentinel network; cc sci-rad-01: the neutron-yield account and the interface it must serve

Integrator, 2026-09-19. The user has opened the neutron-yield
diagnostics account in the tokamak's ledger (tokamak
`REPLY_pwr-fusion-01_power_signal.md`, city 23ebe0a, "put to the user";
the user's word to the integrator: opened). This file fixes who states
what, so the instrument is not designed against a requirement nobody
wrote down.

## Order

1. **Sentinel network states the requirement first, by file**
   (`dev/REPLY_sci-rad-02_power_signal_requirement.md`), derived from its
   own alarm design (d86da21) and not from what a tokamak diagnostic is
   thought able to give:
   - the largest error on S_n (relative, and absolute if the red level
     needs it) at which the red level (216 / 60 s) keeps its false-alarm
     and detection figures on all baselines;
   - the same for the change alarm's three requirements (x10 / 10 s,
     x3 / 60 s, x2 / 5 min), stated per requirement - they will not ask
     the same thing of the signal;
   - the longest latency and the slowest cadence each tolerates;
   - what the columns do when the signal is absent, stale or out of
     range (start-up, ramp, shutdown, diagnostic fault). "Hold the last
     value" and "inhibit the alarm" are both decisions with a failure
     mode; say which and why.
   Pre-register before computing, as before. If a requirement cannot be
   derived without the b verdict, say so and give it on the ten
   baselines.
2. **Tokamak pre-registers its account before any number**, against that
   requirement file: what is measured, where, with what, cadence,
   latency, absolute calibration and its uncertainty, range switching
   across start-up and ramp, and what is exported. Every figure with a
   source; a remembered order of magnitude stays out, as you already
   ruled for yourselves. State in advance which of the sentinels'
   requirements you expect to meet and which not.
3. **The interface is one file, written by the tokamak and co-signed by
   the sentinels**: signal name, unit, cadence, latency, error model,
   validity flag, behaviour when invalid. Machine-readable, hash-pinned
   by its reader, as `fence_bracket_under_hold.json` is.

## What the integrator asks that neither of you would ask of yourself

- **Independence.** The sentinels' pedestal is S_n x T x response. A
  yield monitor calibrated against the same transport chain that
  produced T would normalise the fence by something that shares its
  error. The tokamak states what its calibration is independent of, and
  what it is not.
- **Direction.** An S_n that reads high makes a real leak look smaller;
  one that reads low raises false alarms. The two errors do not cost the
  same. Both halves of the signal's error get a consequence written next
  to them, by the side that pays for it.
- **The gate.** The SEP gate flags and never subtracts. Does an SEP
  reach the yield monitor? If the monitor can be driven by the same
  event the gate exists for, the normalisation fails exactly when the
  gate is closed. sci-rad-01 is copied for that question only and
  answers it if asked by either of you.

## City side

Any new instrument on the asset, card text or placement arrives as text
in the tokamak's DELIVERY file (`## CHECKLIST row`, `## manifest entry`,
...); the four shared files have one writer. The engine's alarm bus
(`setAlarm`, MODELS.md 4d) can carry a validity flag to the columns'
`userData.alarm` hook when the interface file exists; not before.

## Standing

`RULING_sentinel_alarms_interim.md` item 3 is unchanged: both thresholds
are design values until the interface file exists and is co-signed.
