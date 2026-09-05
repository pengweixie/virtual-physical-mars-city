# REPLY - mars-swir repository initialised (DISPATCH_repo_init)

**Dossier:** `E:\Claude\mars-swir` (sci-swir-01 design book)
**First commit:** `85c6b3ec0c131c0bc4e19a175cb26644b1048910` (short `85c6b3e`)
**Message:** `First commit: sci-swir-01 design dossier, 134 files, no remote`
**Date:** 2026-09-05

## Done as dispatched

1. Local only: `git init`, no remote configured, nothing pushed (`git remote -v` is empty).
2. Byte-exact: `core.autocrlf false` (local config) and `.gitattributes` = `* -text`.
   Verified after commit: `README.md` and `sim/13_tcad_dark_analysis.py` are md5-identical in
   worktree and in HEAD. 113 of the 134 files carry CRLF as written on Windows; they are stored
   as-is, not normalised - which is the point of the rule.
3. `.gitignore` written before the first commit: `__pycache__/`, `*.pyc`; solver binaries
   `*.tdr` `*.mph` `*.sav` and Sentaurus mesh files (none copied down from the VM - the dossier
   holds only the 10 KB text `.plt` result tables and the decks); `data/` (per-session-permission
   downloads, MOLA-tile precedent - none exist here today); OS thumbs. No credentials exist in
   the dossier; the VM key lives in `%USERPROFILE%\.ssh`, outside it.
4. Static checks run before the commit: `py_compile` on all 15 `sim/*.py` (OK); all 15
   `out/*.json` plus `viewer/units/sci-swir-01.info.json` parse (OK); `validate_unit.mjs` on
   the delivered module all PASS (1 expected WARN - the false-colour screen is MeshBasic);
   `viewer/units/sci-swir-01.js` and `.info.json` md5-identical to the copies in the mars
   repository at this moment (`e2af01ee` / `17285bdc`).
5. Identity: local `user.name`/`user.email` set (`mars-swir session` / the user's address).

## What is in the first commit (134 files, 13,994 lines)

`DESIGN.md` (852 lines, 15 accounts over six rounds), `README.md` anchor index, `sim/01..15`
account scripts with `out/*.json` products, `tcad/` (Sentaurus decks `.cmd`/`.par`/`.tcl`,
runner and watcher `.sh`, 44 `.plt` result tables, 3 field-profile `.csv`, logs, and
`logs/iface_section_reference.txt` - the `sdevice -P` dump that fixed Step B), `viewer/units/`
(module + bilingual card), `shots/` (21 jpg, largest 68 KB), `_preview.html`.

## From here

Numbers in sci-swir-01 cards can now cite `mars-swir@<hash>` for the design-book side alongside
the mars-repository card commit. The camera card's account-13 numbers (Ea 0.541 eV, halving
5.95 K at 233 K, 53x deep-cooling) already carry their validity bounds in the same `sim` entry
(account 15); `85c6b3e` is the first anchor those bounds can be cited from. Citers take hashes
from commits, never from this note.

Produced by: sci-swir-01 session (mars-swir).
