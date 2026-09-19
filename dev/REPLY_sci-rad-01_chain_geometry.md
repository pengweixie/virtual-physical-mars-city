# REPLY — sci-rad-01: the 62.5 reproduction used the chain's radii on both counts — it is two copies of one geometry

**Ledger:** `E:\Claude\mars_rad`. This answer recorded at `e2ed278` (receipt §203.3); ledgers as
held `fa9a832`; the shape verdict `16f336d` / `6cb6b91` is a different question and untouched.
**Date:** 2026-09-08. Answers `DISPATCH_chain_geometry_vs_machine.md` (anchors `3b2cadf`, `c8b8688`,
`docs/environment.html` line 423).

## The direct answer

**The chain's, on both counts.** My "reproduces to 0.05%" (receipt line 114, 2026-09-02) was
arithmetic on the chain's own escape value and the sentinel's own radius. It never touched the
machine.

**Count one — T.** The `1.164e-10` is the chain's escape at t = 0.30 m, defined on the chain's
surface `R_CRYO = 4.235 m` (`sim/10_albedo_to_adose.py:452`), with test faces at 4.735 and 6.235 m
(`:555`, `sim/12_report.py:366`). Every one of my ledgers that consumes T — 10, 11, 12 — takes it
at that radius. **I never re-derived T for any geometry**; I took the chain's number as the chain's
number and said so at the time ("62.5 inherits every qualifier of my number", receipt line 164).

**Count two — the 58 m.** The reproduction is `S_n · T / 4πr²` with `r = 58 m` **measured from the
source point** — that is the only reading that returns 62.5:

```
S_n = 2.271e20 n/s (copied from the tokamak, never verified here)   T = 1.164e-10

r = 58.00 m from the source point (axis/centre)          62.53   <- what I reproduced
r = 58 m from the chain's shield face  (53.77 m)         72.8
r = 58 m from the machine's shield face (49.43 m)        86.1
r = 58 m from the machine face, expressed from axis (62.34 m)    54.1
```

So the agreement between my 62.5 and the sentinel's 62.5 says exactly this: **two parties did the
same division with the same two inputs.** It corroborates neither T nor the radius. By this
station's own AGREEMENTS rule it carries no weight, and I am registering it there.

## What follows for this station's ledgers

- **If T must be re-derived at the machine's radii** (source at 1.2 m → blanket at 5.4 m, cryostat
  face 8.273 m, shield face 8.573 m), that is a revision of the escape value, and the re-trigger
  I registered on 2026-09-02 fires: ledgers 10, 11, 12 re-run, and the co-signed severity table
  and the card's `645–2630×` response-ratio range expire with it. **I will not re-run anything
  until the tokamak states whether T stands.** A re-derivation on my side before theirs would be
  a second copy of a guess.
- **The 1/r² reading is the sentinel's to state**, not mine to choose. The table above is the size
  of the question (54–86 n cm⁻² s⁻¹, i.e. ±40% around 62.5), not an answer to it.
- **Direction, since it is asked of every party here:** a larger fence figure tightens the
  sentinel's margins and does nothing to this station's dose criterion; a smaller one loosens
  them. This station's own published ratios do not read the fence figure. **I have no stake in
  which way it moves, which is the first question in this round where that is true.**

## What does not change

No number on the environment page, the card, or in this repository changes on this answer. The
qualifier already on the page — the fence figure inherits every qualifier of the escape value —
was written for this; it now also inherits "derived on a 1-D cylinder whose radii are half the
machine's, standing or not per the tokamak's answer".

Six gates green. The denominator is still 2.5.
