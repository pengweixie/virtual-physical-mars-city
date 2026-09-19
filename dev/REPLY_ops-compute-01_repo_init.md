# REPLY — mars-bigram repository initialised (DISPATCH_repo_init)

**Dossier:** `E:\Claude\mars-bigram` (MB-1 / ops-compute-01 design book)
**First commit:** `4ae2dcaf457faa0ff3f345f98f04312751333503` (short `4ae2dca`)
**Message:** `first commit, 130 files, no remote`
**Date:** 2026-09-06

## Done as dispatched

1. Local only: `git init`, `git remote -v` empty, nothing pushed.
2. Byte-exact: `core.autocrlf false` (local config) and `.gitattributes` = `* -text`. Verified after the
   commit: `README.md`, `rtl/mb1_top.v`, `pcb/README.md` md5-identical in worktree and in HEAD;
   27 of the 130 files carry CRLF and are stored as written.
3. `.gitignore` written before the commit: `.claude/` (session state), `__pycache__/`, `*.pyc`;
   Vivado/xsim intermediates (`*.jou`, root `*.log`, `.Xil/`, `xsim.dir/`, `*.wdb`, `.runs/`, `.cache/`,
   `*.xpr`, `*.dcp`); compiled simulator images `build/*.vvp`; archives except the PCB fab Gerber zips;
   credential-shaped names (`.env`, `*.pem`, `*.key`, `*token*`, `*secret*`). Kept deliberately, by the
   city rule that the free-tool sky130 flow may stay in full: `asic/pnr/out/mb1_top.gds` (27.6 MB),
   `mb1_top.def` (11.0 MB), the vendored OpenRAM macro GDS/LEF/LIB, the sky130 HD liberty copy, and
   `fpga/arty_build/mb1_arty.bit` (2.2 MB). No credentials exist in the dossier (grep for
   password/api key/secret hits only the ignore file itself).
4. Static checks before the commit: `py_compile` on all 20 `.py` (OK); all 25 `.json` parse (OK);
   `iverilog -g2012` compiles the 7 RTL files + `tb/tb_mb1.sv` (OK, timescale warnings only).
5. Re-runs made before the commit so the dossier's verification claims have log products rather than
   README prose: `ledger/logs/iverilog_tb_mb1.log` (ALL TESTS PASSED, `$finish` 1134185000 ps),
   `ledger/logs/xsim_tb_mb1.log` (ALL TESTS PASSED, `$finish` 1134185 ns — the two simulators still
   agree to the picosecond), `ledger/logs/iverilog_tb_cdf_sram_equiv.log` (11069 read checks, 0 mismatches).
6. Identity: local `user.name` = `ops-compute-01 session (mars-bigram)`, `user.email` = the user's address.

## From here

Numbers in the ops-compute-01 cards and on docs/compute.html can cite `mars-bigram@<hash>` for the
dossier side alongside the mars card commit. `4ae2dca` is the anchor for every pre-existing product
(RTL, reports, GDS, PCB files); the six ledgers of this round land as later commits and are cited by
their own hashes in DELIVERY_ops-compute-01_r1.md. Citers take hashes from commits, never from this note.

Produced by: ops-compute-01 session (mars-bigram).
