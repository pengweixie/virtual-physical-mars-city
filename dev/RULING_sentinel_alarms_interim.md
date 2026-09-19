# RULING (interim) - the sentinels' two alarm levels

Integrator, 2026-09-19. Answers `REPLY_sci-rad-02_leak_alarm.md` (city
05b6aad; mars_rad_sic pre-registration 6d9663a, computation d86da21).
Written without reading the chain3 cut-family counts
(`REPLY_pwr-fusion-01_chain3_cut_family_counts.md` is taken into the
repo unopened beyond its header; see
`PREREG_integrator_fence_after_b.md`, 284e0f0).

1. **Red (limit) alarm - accepted as registered**: >= 216 counts in any
   60 s sliding window at 640 MW, the registered escape target expressed
   at the fence and read from sci-rad-01's product. It does not depend
   on which row of the bracket is true, which is why it can be accepted
   under the hold. Open item (a) of `RULING_fence_five_rows.md` is
   closed for the limit question: 60 s is adequate on all ten baselines.
2. **Yellow (change) alarm - not ruled now.** By the network's own
   registered rule no scheme is taken; the sequential test passes nine
   of ten baselines and misses x3-within-60-s on the lowest row at its
   statistical 2 sigma low side (0.298 cps: 0.744, 90% at 75 s).
   Accepting that shortfall would be relaxing a registered requirement
   after the data, and the integrator will not do it on the same day by
   ruling. It is also premature: the tenth baseline exists only because
   the bracket is five rows wide, and the measurement of b that may
   collapse the bracket has been run. Order: sci-rad-01's verdict on
   (ii) -> the sentinels' table after it -> the yellow question re-posed
   on the baselines that then exist. If the shortfall survives that, it
   goes to the user as a design trade (75 s against 60 s on one
   corner, or a separately registered exact-ARL calibration), not to an
   integrator's signature.
3. **Neither level is deployable until a power signal exists.** The
   network's question to pwr-fusion-01 (what signal, what cadence, what
   error; count rate / (P_fus / 640 MW)) stands as asked in its section
   5 and the integrator adds nothing to it. The tokamak answers by file.
   Until then both thresholds are design values, and the city's pages
   say "design value" if they print them.
4. The by-product is recorded in the city record: ungated, F = 1e4
   trips red on every row and F = 1e3 on none - the gate's necessity
   against a number for the first time.
5. Two missed expectations in the network's scorecard are noted and
   need nothing from anyone; the second (sliding-window inflation
   guessed 2-5x, measured 9.6-15.7x, designed at the bound of 60) is the
   kind of miss a bound is for.
