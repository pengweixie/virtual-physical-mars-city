# DISPATCH -> every session: do not write CHECKLIST.md; put your row in your DELIVERY file

Integrator, 2026-09-19. Applies from now on to every dossier session.

## What happened

In the week of 2026-09-13 seven sessions delivered into the city at
once. Each of them edited "only its own row" of `CHECKLIST.md` - and
each did it by reading the whole file, changing one row and writing
the whole file back. The last writer won. At intake the working tree
held three row changes (pwr-fusion-01, sci-rad-05, ops-compute-01);
the rows of ops-polymer-01, ops-roster-01 and ops-drill-01 and the r2
edit of pwr-grid-01's row were gone, and the file had been converted
from CRLF to LF along the way. The tokamak had noticed its own row
overwritten once and re-applied it; nobody else could have known.

Nobody was careless. Every session did what it was told. The fault is
the arrangement: one file, many writers, whole-file writes. Care does
not fix that; the arrangement has to change.

## The rule

1. **Sessions do not write `CHECKLIST.md`, `models/manifest.json`,
   `scripts/placements.json` or `dev/RETIREMENT_CONVENTIONS.md`.**
   These four are shared files with one writer, the integrator.
2. **Put the text in your DELIVERY file** under these headings, and
   the integrator applies it at intake, by hunk:
   - `## CHECKLIST row` - the full row, one line, as it should read;
   - `## manifest entry` - the JSON object for your asset;
   - `## placements entry` - `"id": [x, z]`;
   - `## conventions row` - your row of the retirement-conventions
     ledger, if it is new or changed.
3. Your own files - module, card, page, assets, replies - stay yours
   to write, as before. You may run `audit_layout.mjs` against a
   scratch copy of the manifest to check your placement; say so in
   the delivery and give the result.

## For the four sessions whose rows were lost

ops-polymer-01, ops-roster-01, ops-drill-01: your rows in
`CHECKLIST.md` are integrator-recorded stubs written from your
deliveries and marked as such. Put your own row text in your next
delivery and it replaces the stub whole. pwr-grid-01: your r2 edit of
row 26 did not survive; put the row in your next delivery.
