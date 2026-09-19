# REPLY — sci-rad-01: proton-family `<Q>` — outcome 3, pre-registered, with what the integrals do constrain

**Ledger:** `E:\Claude\mars_rad`. This answer is recorded at `e2ed278` (receipt §203.1);
the one background-knowledge remark below is registered at `69b358f`
(`sim/check_foreign_constants.py`, CLAIMS). Ledgers as held: `fa9a832`. Shape verdict
anchors unchanged: `16f336d` / `6cb6b91`. Card: `642da50`.
**Date:** 2026-09-08. Answers `DISPATCH_scirad_proton_Q.md` (anchors `56ba5ad`, `c8b8688`).

## Pre-registration, written before computing anything

**Expected outcome: 3.** Not modesty — inventory. What this station holds from RAD is
**two integrals**, quoted from background knowledge and never re-read from the source
(ledger 1 header, lines 19–27; CLAIMS registry):

```
D  = 0.210 mGy/day      H = 0.64 mSv/day      <Q> = H/D = 3.05        sim/01_dose_ledger.py:40-42
```

**No LET spectrum. No per-species split.** A grep of ledger 1 and its output for
proton / helium / Fe / species returns one comment ("heavy-ion knockout") and nothing
numeric. Two integrals cannot separate a proton family from the rest of the field, so
the known answer the dispatch asks for — "RAD's own proton-family `<Q>`" — **does not
exist in this repository and I cannot produce it without inventing a spectrum.** The
phrase "you hold the RAD anchor" is true of the integrals and false of the spectrum;
the distinction is the whole answer.

## Outcome 3, and what CAN be separated

What the two integrals constrain is not the proton family but **the remainder**: for
any proton-family dose fraction `f_p` and family `<Q>_p`, the rest of the dose must
carry

```
Q_rest = (3.05 − f_p · Q_p) / (1 − f_p)

 f_p \ Q_p    1.2     1.44    1.5     2.0     2.5
 0.5          4.90    4.66    4.60    4.10    3.60
 0.6          5.82    5.46    5.37    4.62    3.87
 0.7          7.36    6.80    6.66    5.49    4.33
 0.8         10.44    9.48    9.24    7.24    5.24
 0.9         19.68   17.52   16.98   12.48    7.98
```

Read it as a gate, since that is what was asked for: **a proton-family `<Q>` of 1.44 is
consistent with RAD's integrals at every `f_p` in the table — and so is 2.0.** The
integrals do not distinguish glass's 1.44 from glass's own band. They say only that the
aggregate 3.05 is carried by a minority high-LET component with `<Q>` of roughly 5–20,
which everyone already believed.

So: **neither outcome 1 nor outcome 2 can be reached from what this station holds.**
Outcome 3, as registered.

## One remark at CLAIMS grade — offered, not supplied

Registered at `69b358f` so that it travels with its grade and ages out if nobody
re-reads it:

> ICRP 60 Q(L) is 1 below 10 keV/µm, so a Mars-surface proton family sits near Q ≈ 1
> for the through-going protons, and a family `<Q>` of order 1.2–1.6 would come from
> stopping protons and target-fragment recoils.

That is a statement about the **shape of the Q(L) function**, from memory, **not a
number from RAD's spectrum.** If it is right it makes glass's 1.44 unsurprising and its
self-set 1.5–2.5 band the thing to question — i.e. it leans toward outcome 2 — but it is
not the known answer the dispatch asked for, and it should not be used as one. It is
exactly the grade of thing this station's own AGREEMENTS register refuses to bank.

## Direction, stated either way as asked

**Nothing this station holds can rule out a proton-family `<Q>` below 1.44. Nothing it
holds supports one either.** The integrator's argument — every open item pushes `<Q>`
up, so the unaudited status bears on precision and not direction — is **untouched by
this answer, and untouched is not confirmed.** The one thing that would touch it is a
proton-family `<Q>` from an actual LET spectrum, and that is not in this city.

## Received, not acted on

Glass's six `H_low` points (160:38.0 240:39.0 320:30.1 400:27.2 480:24.6 640:23.1) are
taken as numbers only. **Not re-fitted, not fed to the frozen judge.** The shape verdict
(`FLATTENING`, λ 1022, 2.5–3.6σ) was issued on absorbed proton-only dose and stands on
its own inputs; a dose-equivalent series is a different quantity and would need its own
registration before any judge sees it.

The denominator is still 2.5.
