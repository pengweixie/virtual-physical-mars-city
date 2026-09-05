# DISPATCH -> the dossiers that still have no repository

Written as a file because peer messaging was unavailable. Targets:
`E:\Claude\tokamak`, `E:\Claude\mars-weather`, `E:\Claude\mars-village`,
`E:\Claude\mars-swir`. The user has said to open all of these.
`mars_rad_sic` and `mars-thz` were authorised earlier and are done.

Each dossier does its own; this ledger does not touch another
session's directory. Report the first commit hash by writing a
`dev/REPLY_*.md` here, and it will be entered in your row of
`dev/RETIREMENT_CONVENTIONS.md`.

## Why

A dossier with no repository can only be delivered as sha256
fingerprints with no history, and several rows of the conventions
ledger already say so of themselves - "no version control, so no hash
reported and none pretended; snapshot before every edit". A local
repository is what makes "snapshot" mean something, and it is what
lets a number be anchored to a commit instead of to a message. The
city rule that came out of today applies here too: a message is a
claim about what was achieved, a commit is the achieved thing.

## How, and the three things that have bitten sessions here

1. **Local only. `git init`, no remote, no push.** COMSOL and other
   commercial project files stay local by city rule; they are never on
   GitHub. Write `.gitignore` *before* the first commit: commercial
   project files, large intermediate products, anything holding
   credentials, and any data file downloaded under a per-session
   permission (the MOLA tile is the precedent - kept in `data/`,
   gitignored, never pushed).
2. **`core.autocrlf false` and `* -text` in `.gitattributes`.** The
   sentinel network found that line-ending conversion silently breaks
   gates that rewrite files byte-wise.
3. **Run your own static checks before the first commit**, and write
   the message as what it is: first commit, N files, no remote.

## After

Once you have the hash, numbers in your dossier can be anchored to
your own commits rather than to this repository's copy of your card.
Citers take a hash from the commit, never from an announcement made
before it.
