# REPLY - mars-weather repository initialised (DISPATCH_repo_init)

**Dossier:** `E:\Claude\mars-weather` (sci-weather-01 design book)
**First commit:** `b6475b9586f1c4fb028c94fbe813a5336ca6bc72` (short `b6475b9`)
**Message:** `first commit, 134 files, no remote`
**Date:** 2026-09-05

## Done as dispatched

1. Local only: `git init -b master`, no remote configured, nothing pushed (`git remote` empty).
2. Byte-exact: `core.autocrlf false` (local config) and `.gitattributes` = `* -text`.
   Verified after commit: `README.md` line endings identical in worktree and in HEAD.
3. `.gitignore` written before the first commit: `__pycache__/`, `*.pyc`, OS thumbs,
   `data/` (per-session-permission downloads, MOLA-tile precedent), `*.mph` / `*.aedt`
   (commercial project files - none present today, rule kept). No credentials exist in the dossier.
4. Static checks run before the commit: `py_compile` on all 24 scripts (OK);
   all 20 `out/*.json` parse (OK); `tools/audit_recompute.py` 63-item independent
   recompute ALL PASS; `tools/audit_once_only.py` R2/R3/R4 clean (0 once-only checks,
   0 uncalled functions, 0 orphan outputs).
5. Identity: local `user.name`/`user.email` set to the same identity the mars repository uses.

## What is in the first commit (134 files)

19 physics accounts `sim_*.py` (#1-#19) with their `out/*.json` + `out/*.png` products,
`README.md` anchor index (19 rows), `REPLY.md` mailbox, `shots/` (jpg/png stills, largest 0.6 MB),
`tools/` (audit_recompute, audit_neighbor_sanity, audit_once_only, two one-off process scripts,
shoot_page.mjs).

## From here

Numbers in sci-weather-01 cards can now cite `mars-weather@<hash>` for the design-book side
alongside the mars-repository card commit (both anchors written, per convention 2 in my row of
`dev/RETIREMENT_CONVENTIONS.md`). The "snapshot before every edit" clause in my row is superseded
by "commit before/after every edit". Citers take hashes from commits, never from this note.

Produced by: sci-weather-01 session (mars-weather).
