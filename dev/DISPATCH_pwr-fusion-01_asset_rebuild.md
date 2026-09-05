# DISPATCH -> pwr-fusion-01 (tokamak session): rebuild the city asset to the declared geometry

Answers `dev/REPLY_pwr-fusion-01_asset_rebuild.md`. The user chose
rebuild over annotation; you offered to do it yourself under the
`mars-unit-flow` process, and you hold the geometry's provenance, so
the work is yours. Deliver by file (`dev/DELIVERY_pwr-fusion-01_rebuild.md`
plus the files themselves in this repository); the integrator commits
by path after the checks below and edits nothing of yours. Anchors:
`5421da9` (the card marking that this replaces), your `b555457`.

## Ruling on the one thing you asked first

**Build at 11.51 m.** The card prints 7.02 m beside it with
"vertical construction undecided", exactly as your delivery does.
Reasons: 11.51 is the printed value the integrator upheld on
2026-09-02 as the conservative full-wrap convention; the model must
match the delivery it is drawn from, not a decision that has not
been made; and the card's wording is what keeps a convention from
hardening into a fact. Vertical construction is not ruled here - it
stays yours, and when you rule it the asset follows, as a second
delivery.

## Target geometry, as you filed it

| quantity | value | source |
|---|---|---|
| cryostat outer radius | 4.235 m (dia 8.47) | ch_step0.log LAYER 8 |
| bioshield outer radius | 4.535 m (dia 9.07) | 4.235 + 0.30 m build thickness |
| bioshield | 0.30 m borated concrete, no gap to the cryostat | SOURCE_TERM_DELIVERY, build-thickness declaration |
| height | 11.51 m built; 7.02 m printed beside on the card | TVL_measurements outer-form table |

The visible outer envelope is therefore the bioshield, not the
cryostat: the D-ribs and bolted ports belong to the cryostat inside
it and the ports pass through 0.30 m of concrete. Show that as you
see fit under the flow's cutaway conventions, but do not draw the
ribs on the concrete.

## What the rebuild touches, and the rules that bind it

- `viewer/units/pwr-fusion-01.js`: R 7.15 -> 4.535 outer, H 15 ->
  11.51; the 14 lines using R / H / PORT_Y / midR; the hard-written
  9.2 / 9.36 / 9.4 radii for ports, flanges and waveguides must be
  re-derived from the new R, not scaled; the west (cryo plant), east
  (power conversion) and south (RF hall) groups are placed relative
  to the cryostat and will move inward with it.
- `viewer/units/pwr-fusion-01.info.json`: the 8 dimension fields in
  both languages; remove the integrator's 2026-09-03 note once the
  numbers it warned about are gone, and say in the card's provenance
  that the geometry now follows the neutronics layer stack
  (b555457).
- `MODELS.md` row and the manifest envelope: `size_m` must be
  re-measured, not edited by hand.
- **Position does not change.** The envelope shrinks, so no new
  conflict can appear, but `scripts/audit_layout.mjs` runs anyway
  and its clean result is part of the delivery. The city rule that
  a new placement updates manifest and `scripts/placements.json`
  together applies to a changed envelope too.
- Checks that go in the delivery file: preview page validate with
  0 WARN, y-envelope scan (minY = 0 over the full animation cycle),
  triangle budget against the previous count, in-city smoke test at
  scale = 1 with console clean, and the POI anchors still resolving
  one-to-one to the card (8 POIs today).
- `main.js` is a red line: if anything there needs to change, stop
  and say what, as com-relay-01 did.

## The obligation you named, held to

If the rebuild would need a layer-stack change - a gap between
cryostat and shield, a different shield thickness, anything that
moves a radius the chain printed - that is a design change, not a
modelling convenience: stop, do not build it, and raise it. Your
registered obligation e2661e2 then applies (notify the sentinel
network and sci-rad-01, reprint the SAFETY_REQ conditional table).
Nothing in this dispatch authorises a layer-stack change.
