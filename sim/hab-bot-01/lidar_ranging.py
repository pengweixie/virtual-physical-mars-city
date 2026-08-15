# hab-bot-01 chest flash-LiDAR: how ACCURATE is the range, not just how many
# photons come back.
#
# The info card previously stopped at "5,500 photoelectrons, SNR 74". That is a
# detection budget, not a ranging budget — it says the echo is visible, not that
# the distance is right. This adds the part that was missing:
#   * SPADs are Geiger-mode: one microcell fires ONCE per pulse and is then dead.
#     Dumping 5,500 photons on a single detector does not give you 5,500 samples,
#     it gives you the arrival time of the FIRST one. That biases the estimate
#     early — classic pile-up / range walk.
#   * A SiPM pixel (many microcells) fixes this by spreading photons over cells,
#     but only until the cells saturate.
#   * Timing precision is set by SPAD jitter (SPTR), the laser pulse width, and
#     TDC quantization — not by photon count alone.
#   * Dark counts and background light inside the gate produce false ranges.
# Detector parameters inherit from the spad40_nir 905 nm project (PDE 40.3%).
import io
import json
import math
import os
import numpy as np
from scipy.special import ndtri

HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(20260808)
C = 2.998e8

# NOTE on pulse energy: the first cut of this design used 3 uJ/pulse and a
# 64-microcell SiPM, and the info card bragged about "5,500 photoelectrons,
# SNR 74". This Monte Carlo showed what that number actually means: 86 photons
# per microcell, every cell fired, photon count unknowable, walk correction
# impossible — the detector is not sensitive, it is BLINDED. A photon-counting
# receiver has to land in its linear regime (lambda well under 1 photon per cell
# per pulse), which means far LESS light, not more. Re-scaled below.
L = dict(
    wavelength_nm=905, E_pulse_uJ=0.060, n_beams=15, fov_deg=90.0,
    rate_hz=6.0, aperture_mm=10.0, optics_eff=0.80, PDE=0.403,
    pulse_fwhm_ns=1.5,            # 905 nm pulsed laser diode, short-pulse driver
    sptr_fwhm_ps=150.0,           # SPAD single-photon timing resolution
    tdc_lsb_ps=100.0,             # TDC quantization
    deadtime_ns=20.0,
    microcells=1024,              # SiPM microcells per detection direction
    dcr_per_cell_cps=253.0,       # spad40_nir room-temp B2B dark rate per cell
    gate_ns=140.0,                # range gate = 2*21 m / c, a bit past 20 m
    afterpulse=0.001,
)
ALBEDO = 0.30                      # printed-regolith wall, indoor
E_PHOTON = 6.626e-34 * C / (905e-9)


def photons_returned(R, albedo=ALBEDO):
    """Photoelectrons per pulse per beam from an extended Lambertian wall."""
    n_tx = L["E_pulse_uJ"] * 1e-6 / E_PHOTON          # photons per pulse
    per_beam = n_tx / L["n_beams"]
    A_rx = math.pi * (L["aperture_mm"] * 1e-3 / 2) ** 2
    # Lambertian: fraction rho*A/(pi*R^2) of the illuminated patch's flux
    frac = albedo * A_rx / (math.pi * R ** 2)
    return per_beam * frac * L["optics_eff"] * L["PDE"]


# ---------------------------------------------------------------------------
# Range-walk correction.
# A SiPM pixel's first-photon time is biased early by roughly E[min of n draws]
# from the pulse profile, and n grows as 1/R^2 — so the bias is range-dependent
# and reads up to a metre short. Real SiPM front ends undo this using the number
# of microcells that fired, which is a proxy for the photon count:
#     P(cell fires) = 1 - exp(-lambda)  ->  lambda_est = -ln(1 - n_fired/M)
# Then subtract the expected first-arrival offset for that lambda. When every
# cell fires (n_fired == M) lambda is unbounded and the correction dies: that is
# the pixel's saturation limit, and it sets the minimum usable range.
def _walk_table(lams, n_mc=20000):
    """E[min-arrival offset]/sigma_pulse vs per-cell mean photon count."""
    tab = []
    for lam in lams:
        n = rng.poisson(lam, size=n_mc)
        n = n[n > 0]
        if n.size == 0:
            tab.append(0.0)
            continue
        u = rng.beta(1.0, n)
        tab.append(float(np.mean(ndtri(np.clip(u, 1e-12, 1 - 1e-12)))))
    return np.array(tab)


WALK_LAM = np.concatenate([np.linspace(0.02, 2, 60), np.geomspace(2.1, 4000, 120)])
WALK_OFF = _walk_table(WALK_LAM)


def walk_correction(n_fired, M, sigma_pulse):
    """Seconds to ADD back to the first-arrival estimate. None if saturated."""
    if n_fired >= M:
        return None                       # every cell fired: photon count unknown
    frac = n_fired / M
    lam = -math.log(max(1e-9, 1.0 - frac))
    off = float(np.interp(lam, WALK_LAM, WALK_OFF))
    return -off * sigma_pulse             # WALK_OFF is negative -> add positive


def simulate_shot(R, albedo=ALBEDO, n_pulses=1, background_cps=0.0,
                  correct_walk=True):
    """One range measurement. Returns estimated range [m] or None (no detect)."""
    t_true = 2 * R / C                                    # s
    sigma_pulse = L["pulse_fwhm_ns"] * 1e-9 / 2.355
    sigma_jit = L["sptr_fwhm_ps"] * 1e-12 / 2.355
    gate = L["gate_ns"] * 1e-9
    n_pe = photons_returned(R, albedo)
    dark_rate = (L["dcr_per_cell_cps"] + background_cps) * L["microcells"]

    M = L["microcells"]
    ests = []
    for _ in range(n_pulses):
        # A microcell records only its FIRST photon (Geiger mode + dead time),
        # so what matters per cell is a minimum of arrivals, not their count.
        # Exact and O(M): the minimum of n iid N(mu,sig) draws equals
        # mu + sig*Phi^-1(U) with U ~ Beta(1,n); likewise the minimum of n
        # uniforms on the gate is gate*Beta(1,n). This keeps close-range shots
        # (millions of photons) as cheap as far ones.
        first = np.full(M, np.inf)
        n_sig = rng.poisson(n_pe / M, size=M)          # signal photons per cell
        hit = n_sig > 0
        if hit.any():
            u = rng.beta(1.0, n_sig[hit])
            first[hit] = t_true + sigma_pulse * ndtri(np.clip(u, 1e-12, 1 - 1e-12))
        n_dk = rng.poisson(dark_rate * gate / M, size=M)   # dark/background
        hd = n_dk > 0
        if hd.any():
            td = gate * rng.beta(1.0, n_dk[hd])
            first[hd] = np.minimum(first[hd], td)
        fired = np.isfinite(first)
        n_fired = int(fired.sum())
        if n_fired == 0:
            continue
        # --- per-cell timing jitter + TDC quantization ---
        ts = first[fired]
        ts = ts + rng.normal(0, sigma_jit, size=ts.size)
        lsb = L["tdc_lsb_ps"] * 1e-12
        ts = np.round(ts / lsb) * lsb
        ts = ts[(ts >= -20e-9) & (ts <= gate)]   # keep early (walk) hits: a real
        if ts.size == 0:                          # front end times them, then
            continue                              # corrects, rather than gating
        # --- estimator: histogram peak (matched to the pulse width), then
        #     centroid inside the winning bin pair. This is what a real TDC
        #     front end does, and it is what makes dark counts survivable. ---
        binw = 2e-9
        lo_e = -20e-9
        nb = int((gate - lo_e) / binw) + 1
        hist, edges = np.histogram(ts, bins=nb, range=(lo_e, lo_e + nb * binw))
        pk = int(np.argmax(hist))
        if hist[pk] < 2:                                  # no credible peak
            continue
        sel = ts[(ts >= edges[pk] - binw) & (ts < edges[pk + 1] + binw)]
        t_est = float(sel.mean())
        if correct_walk:
            corr = walk_correction(n_fired, M, sigma_pulse)
            if corr is None:
                saturated[0] += 1                         # pixel is blinded
                continue
            t_est += corr
        ests.append(t_est)
    if not ests:
        return None
    return C * float(np.mean(ests)) / 2


saturated = [0]        # counts shots where every microcell fired (walk unfixable)


def sweep(ranges, albedo=ALBEDO, n_trials=400, n_pulses=1, background_cps=0.0,
          correct_walk=True):
    rows = []
    for R in ranges:
        saturated[0] = 0
        vals = [simulate_shot(R, albedo, n_pulses, background_cps, correct_walk)
                for _ in range(n_trials)]
        sat = saturated[0] / (n_trials * n_pulses)
        got = np.array([v for v in vals if v is not None])
        det = len(got) / n_trials
        if got.size < 5:
            rows.append(dict(R=R, n_pe=round(photons_returned(R, albedo), 1),
                             detect=round(det, 3), bias=None, sigma=None,
                             outlier=None, saturated=round(sat, 3)))
            continue
        err = got - R
        # gross outliers = dark-count-driven false ranges (>1 m off)
        outlier = float(np.mean(np.abs(err) > 1.0))
        core = err[np.abs(err) <= 1.0]
        if core.size < 5:
            core = err
        rows.append(dict(R=R, n_pe=round(photons_returned(R, albedo), 1),
                         detect=round(det, 3),
                         bias=round(float(core.mean()) * 100, 2),      # cm
                         sigma=round(float(core.std()) * 100, 2),      # cm
                         outlier=round(outlier, 4), saturated=round(sat, 3)))
    return rows


def show(rows, title):
    print(title)
    print("   R[m]     N_pe   detect   bias[cm]  sigma[cm]  outliers  saturated")
    for r in rows:
        b = f"{r['bias']:+9.2f}" if r["bias"] is not None else "      n/a"
        s = f"{r['sigma']:10.2f}" if r["sigma"] is not None else "       n/a"
        o = f"{r['outlier']:9.4f}" if r["outlier"] is not None else "      n/a"
        print(f"  {r['R']:5.1f} {r['n_pe']:9.1f} {r['detect']:8.3f} {b} {s} {o}"
              f" {r['saturated']:10.3f}")


RANGES = [0.5, 1.0, 1.2, 2.5, 5.0, 10.0, 15.0, 20.0]
raw = sweep(RANGES, correct_walk=False)
show(raw, "=== A. RAW first-photon timing, NO walk correction (the naive design) ===")
print("  -> the bias IS the pile-up: every microcell fires on the pulse's leading")
print("     edge, so the mean first-arrival lands early and the range reads short.")

base = sweep(RANGES, correct_walk=True)
show(base, "\n=== B. WITH range-walk correction from microcell fired-count ===")

print("\n=== PILE-UP / SATURATION LIMIT ===")
print("  photons per microcell; once every cell fires the photon count is")
print("  unknowable and the walk correction has nothing to work from")
for R in [0.5, 1.0, 1.2, 2.0, 2.5, 5.0, 20.0]:
    n_pe = photons_returned(R)
    lam = n_pe / L["microcells"]
    p_all = (1 - math.exp(-lam)) ** L["microcells"]
    print(f"   R={R:5.1f} m  N_pe={n_pe:10.0f}  lambda={lam:9.1f} ph/cell  "
          f"P(all 64 fire)={p_all:.3f}  {'SATURATED' if p_all > 0.5 else ''}")
# where does saturation start?
lam_sat = -math.log(1 - 0.5 ** (1 / L["microcells"]))
R_sat = math.sqrt(photons_returned(1.0) / (lam_sat * L["microcells"]))
print(f"  -> saturation (50% of shots blind the pixel) sets in inside "
      f"R = {R_sat:.1f} m — the whole obstacle-avoidance band")

dark = sweep([1.2, 2.5, 5.0, 10.0, 15.0, 20.0], albedo=0.05)
show(dark, "\n=== DARK-ALBEDO CORNER (black rubber mat / open doorway, albedo 0.05) ===")

print("\n=== BACKGROUND LIGHT: indoor LED vs Mars surface daylight ===")
# LED lighting has almost no 905 nm content; sunlight does. Solar irradiance at
# Mars ~590 W/m2, spectral ~0.5 W/m2/nm at 905 nm, x albedo x filter bandwidth.
for label, bg_cps in [("undercity LED (negligible NIR)", 2e3),
                      ("Mars surface, 10 nm filter", 3.5e7)]:
    rows = sweep([10.0, 20.0], n_trials=300, background_cps=bg_cps)
    for r in rows:
        b = f"{r['bias']:+.2f}" if r["bias"] is not None else "n/a"
        s = f"{r['sigma']:.2f}" if r["sigma"] is not None else "n/a"
        print(f"   {label:32s} R={r['R']:4.1f} m  detect {r['detect']:.3f}  "
              f"bias {b} cm  sigma {s} cm  outliers {r['outlier']}")

print("\n=== MULTI-PULSE AVERAGING (6 Hz scan, N pulses per direction) ===")
for npul in [1, 4, 16]:
    rows = sweep([20.0], n_trials=250, n_pulses=npul)
    r = rows[0]
    print(f"   N={npul:2d} pulses -> sigma {r['sigma']} cm, outliers {r['outlier']}"
          f"  (scan rate would drop to {L['rate_hz']/npul:.1f} Hz)")

# ---- what the asset should actually inject ----
sig20 = next(r for r in base if r["R"] == 20.0)
sig2 = next(r for r in base if r["R"] == 2.5)
print("\n=== WHAT THE ASSET MODEL NEEDS ===")
fit_pts = [(r["R"], r["sigma"]) for r in base
           if r["sigma"] is not None and r["saturated"] < 0.5 and r["detect"] > 0.5]
fit = None
if len(fit_pts) >= 2:
    print(f"   usable band {fit_pts[0][0]}–{fit_pts[-1][0]} m: sigma "
          f"{fit_pts[0][1]:.2f} -> {fit_pts[-1][1]:.2f} cm")
    Rs = np.array([p[0] for p in fit_pts])
    Ss = np.array([p[1] for p in fit_pts])
    b, loga = np.polyfit(np.log(Rs), np.log(Ss), 1)
    fit = dict(a_cm=round(math.exp(loga), 4), b=round(float(b), 3))
    print(f"   power-law fit: sigma[cm] = {fit['a_cm']:.3f} * R^{fit['b']:.2f}")
else:
    print("   no usable band — receiver saturated or blind across the sweep")
sat_rows = [r for r in base if r["saturated"] > 0.5]
if sat_rows:
    print(f"   saturated (walk correction impossible) at R <= "
          f"{max(r['R'] for r in sat_rows)} m -> that band gives a reliable "
          f"'something is close' flag but NOT a trustworthy distance")

out = dict(params=L, albedo=ALBEDO, raw_no_correction=raw, single_pulse=base,
           dark_albedo=dark, sigma_fit=fit,
           notes="sigma/bias in cm; outlier = fraction of ranges >1 m off; "
                 "saturated = fraction of shots where all microcells fired")
with io.open(os.path.join(HERE, "lidar_ledger.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("\nwrote lidar_ledger.json")
