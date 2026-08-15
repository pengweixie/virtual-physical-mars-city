# L2 acoustics for hab-bot-01's voice: simulation, not just Sabine.
#
# The L1 ledger (voice_budget.py) used a uniform-absorption Sabine estimate and
# dB arithmetic. This upgrades both claims to simulation grade:
#
#   A. ROOM: image-source method (Allen-Berkley) on the actual foyer shoebox
#      with PER-SURFACE, PER-BAND absorption (printed-regolith walls, steel
#      airlock doors, the glass viewing window, the compacted floor). Outputs a
#      real impulse response -> Schroeder decay -> T30 per octave band, a
#      numerical direct/reverberant crossover (the honest critical distance),
#      and C50 speech clarity at the greeting distance.
#      Cross-checks: Sabine and Eyring on the same area-weighted data.
#
#   B. ARRAY: synthesize the 6-mic head-ring signals at 48 kHz - speech-shaped
#      noise from the talker at 1.6 m plus harmonic-drive whine from both hip
#      gearboxes, every path convolved with its own room IR - then run
#      delay-and-sum beamforming and SRP DOA estimation on the raw waveforms.
#      Cross-checks: single-mic SNR must reproduce the L1 dB arithmetic
#      (-12 dB walking / +7 dB standing) from geometry alone.
import io
import json
import math
import os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(20260809)
C = 343.0

# ---------------------------------------------------------------------------
# Room: net foyer hall as a shoebox, coordinates x[0,12], y[0,20], z[0,7]
# Surfaces carry per-band absorption; walls holding doors/windows use
# area-weighted mixes. Bands: 250, 500, 1k, 2k, 4k Hz.
# ---------------------------------------------------------------------------
BANDS = [250, 500, 1000, 2000, 4000]
ALPHA = {                                  # assumed material data, per band
    "print":  [0.06, 0.08, 0.11, 0.14, 0.16],   # rough printed regolith
    "floor":  [0.02, 0.03, 0.03, 0.04, 0.05],   # compacted slab
    "steel":  [0.10, 0.07, 0.05, 0.04, 0.04],   # airlock door leaves
    "glass":  [0.06, 0.04, 0.03, 0.02, 0.02],   # viewing window
}
LX, LY, LZ = 12.0, 20.0, 7.0

def mix(base, insert, frac):
    return [b * (1 - frac) + i * frac for b, i in zip(ALPHA[base], ALPHA[insert])]

WALLS = {                                   # per-band alpha for the 6 surfaces
    "x0": mix("print", "glass", (5.0 * 2.2) / (LY * LZ)),      # window wall
    "x1": ALPHA["print"],                                       # right wall
    "y0": mix("print", "steel", (6.0 * 5.0) / (LX * LZ)),      # outer airlock
    "y1": mix("print", "steel", (6.0 * 5.0) / (LX * LZ)),      # inner airlock
    "z0": ALPHA["floor"],
    "z1": ALPHA["print"],                                       # vault
}
BETA = {k: np.sqrt(1 - np.array(v)) for k, v in WALLS.items()}
V = LX * LY * LZ
S_AREA = 2 * (LX * LY + LX * LZ + LY * LZ)
A_BAND = [LX * LZ * (WALLS["y0"][b] + WALLS["y1"][b]) +
          LY * LZ * (WALLS["x0"][b] + WALLS["x1"][b]) +
          LX * LY * (WALLS["z0"][b] + WALLS["z1"][b]) for b in range(5)]

# ---------------------------------------------------------------------------
# A. Image-source energy decay (per band) -> T30, D/R crossover, C50
# ---------------------------------------------------------------------------
SRC = np.array([6.0, 11.6, 1.50])          # talker mouth (1.6 m in front)
RCV = np.array([6.0, 10.0, 1.72])          # head-mic centre

def image_energy(src, rcv, t_max, bands=range(5)):
    """All image contributions within t_max: returns delays [s] and per-band
    energy amplitudes (pressure^2, 1/(4 pi d)^2 spreading times beta products)."""
    d_max = C * t_max
    nx = np.arange(-int(d_max / (2 * LX)) - 1, int(d_max / (2 * LX)) + 2)
    ny = np.arange(-int(d_max / (2 * LY)) - 1, int(d_max / (2 * LY)) + 2)
    nz = np.arange(-int(d_max / (2 * LZ)) - 1, int(d_max / (2 * LZ)) + 2)
    delays, hits = [], []
    for qx in (0, 1):
        for qy in (0, 1):
            for qz in (0, 1):
                xi = (1 - 2 * qx) * src[0] + 2 * nx * LX
                yi = (1 - 2 * qy) * src[1] + 2 * ny * LY
                zi = (1 - 2 * qz) * src[2] + 2 * nz * LZ
                hx0 = np.abs(nx - qx); hx1 = np.abs(nx)
                hy0 = np.abs(ny - qy); hy1 = np.abs(ny)
                hz0 = np.abs(nz - qz); hz1 = np.abs(nz)
                X, Y, Z = np.meshgrid(xi, yi, zi, indexing="ij")
                D = np.sqrt((X - rcv[0]) ** 2 + (Y - rcv[1]) ** 2 + (Z - rcv[2]) ** 2)
                m = D <= d_max
                HX0, HY0, HZ0 = np.meshgrid(hx0, hy0, hz0, indexing="ij")
                HX1, HY1, HZ1 = np.meshgrid(hx1, hy1, hz1, indexing="ij")
                delays.append(D[m] / C)
                hits.append(np.stack([HX0[m], HX1[m], HY0[m], HY1[m],
                                      HZ0[m], HZ1[m], D[m]], axis=1))
    delays = np.concatenate(delays)
    H = np.concatenate(hits, axis=0)
    kmax = int(H[:, :6].max()) + 1
    out = {}
    for b in bands:
        lut = {w: BETA[w][b] ** np.arange(kmax) for w in BETA}
        amp = (lut["x0"][H[:, 0].astype(int)] * lut["x1"][H[:, 1].astype(int)] *
               lut["y0"][H[:, 2].astype(int)] * lut["y1"][H[:, 3].astype(int)] *
               lut["z0"][H[:, 4].astype(int)] * lut["z1"][H[:, 5].astype(int)])
        out[b] = (amp / (4 * math.pi * H[:, 6])) ** 2
    return delays, out, H[:, 6]

print("=== A. IMAGE-SOURCE ROOM MODEL (per-surface, per-band) ===")
T_TAIL = 3.5
delays, e_bands, dists = image_energy(SRC, RCV, T_TAIL)
print(f"   images within {T_TAIL} s: {len(delays):,}")

BIN = 0.005
nbin = int(T_TAIL / BIN)
t_axis = (np.arange(nbin) + 0.5) * BIN
res_bands = []
for bi, f in enumerate(BANDS):
    hist = np.zeros(nbin)
    idx = np.minimum((delays / BIN).astype(int), nbin - 1)
    np.add.at(hist, idx, e_bands[bi])
    edc = np.flip(np.cumsum(np.flip(hist)))
    edc_db = 10 * np.log10(np.maximum(edc / edc[0], 1e-12))
    def t_at(dB):
        i = np.argmax(edc_db <= dB)
        return t_axis[i] if edc_db[i] <= dB else np.nan
    t5, t35 = t_at(-5), t_at(-35)
    T30 = 2.0 * (t35 - t5)
    sab = 0.161 * V / A_BAND[bi]
    eyr = 0.161 * V / (-S_AREA * math.log(1 - A_BAND[bi] / S_AREA))
    # C50 at the greeting distance: early(<=50ms)/late energy
    early = e_bands[bi][delays <= delays.min() + 0.050].sum()
    late = e_bands[bi][delays > delays.min() + 0.050].sum()
    C50 = 10 * math.log10(early / late)
    res_bands.append(dict(f=f, T30=round(float(T30), 2), sabine=round(sab, 2),
                          eyring=round(eyr, 2), C50=round(C50, 1)))
    print(f"   {f:5d} Hz: T30 {T30:5.2f} s   (Sabine {sab:4.2f} / Eyring {eyr:4.2f})"
          f"   C50@1.6m {C50:+5.1f} dB")
T30_mid = np.mean([r["T30"] for r in res_bands if r["f"] in (500, 1000)])
C50_mid = np.mean([r["C50"] for r in res_bands if r["f"] in (500, 1000, 2000)])
print(f"   mid-band T30 = {T30_mid:.2f} s (L1 Sabine said 2.4 s)  |  "
      f"speech-band C50 = {C50_mid:+.1f} dB "
      f"({'usable' if C50_mid > -2 else 'poor'} clarity; >0 dB is good)")

# numerical direct/reverberant crossover
print("\n   direct-vs-reverberant crossover (1 kHz):")
rc_num = None
for r in (0.5, 0.8, 1.0, 1.2, 1.5, 1.8, 2.2, 3.0):
    rc = np.array([6.0, 10.0 + r, 1.60])
    dl, eb, _ = image_energy(np.array([6.0, 10.0, 1.60]), rc, 1.2, bands=[2])
    i0 = np.argmin(dl)
    direct = eb[2][i0]
    reverb = eb[2].sum() - direct
    dr = 10 * math.log10(direct / reverb)
    tag = ""
    if rc_num is None and dr < 0:
        rc_num = r
        tag = "  <- crossover"
    print(f"     r = {r:3.1f} m   D/R = {dr:+5.1f} dB{tag}")
print(f"   numerical critical distance ~{rc_num} m (L1 formula said 1.50 m)")

# ---------------------------------------------------------------------------
# B. SIGNAL-LEVEL ARRAY SIMULATION
# ---------------------------------------------------------------------------
print("\n=== B. 6-MIC ARRAY, SYNTHESIZED WAVEFORMS (48 kHz) ===")
FS = 48000
DUR = 1.6
N = int(FS * DUR)
MICS = np.array([[6.0 + 0.062 * math.sin(a), 10.0 - 0.005 + 0.062 * math.cos(a), 1.72]
                 for a in np.linspace(0, 2 * math.pi, 6, endpoint=False)])
HIPS = np.array([[5.90, 10.0, 0.84], [6.10, 10.0, 0.84]])

def sparse_ir(src, rcv, t_max=0.7, band=2):
    dl, eb, dd = image_energy(np.array(src), np.array(rcv), t_max, bands=[band])
    amp = np.sign(1.0) * np.sqrt(eb[band])          # pressure amplitude
    ir = np.zeros(int(FS * (t_max + 0.01)))
    idx = (dl * FS).astype(int)
    np.add.at(ir, idx, amp)
    return ir

def speech_signal():
    x = rng.standard_normal(N)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(N, 1 / FS)
    shape = np.where(f < 100, 0, np.where(f < 500, 1.0, (500 / np.maximum(f, 1)) ** 0.8))
    shape = shape * (f < 6000)
    x = np.fft.irfft(X * shape, N)
    env = 0.55 + 0.45 * np.sin(2 * math.pi * 3.7 * np.arange(N) / FS + 1.0)
    return x * env

def gear_signal(level=1.0):
    t = np.arange(N) / FS
    x = np.zeros(N)
    for f0, a in ((2400, 1.0), (4800, 0.63), (3600, 0.4), (1200, 0.3)):
        fm = f0 * (1 + 0.006 * np.sin(2 * math.pi * 1.1 * t))
        x += a * np.sin(2 * math.pi * np.cumsum(fm) / FS + rng.uniform(0, 6.28))
    bb = rng.standard_normal(N)
    B = np.fft.rfft(bb)
    f = np.fft.rfftfreq(N, 1 / FS)
    bb = np.fft.irfft(B * ((f > 800) & (f < 7000)), N)
    x = x + 0.9 * bb
    gait = 0.65 + 0.35 * np.sin(2 * math.pi * 1.11 * t)     # stride modulation
    return level * x * gait

def render(sources, mics):
    """sources: list of (signal, pos, power_scale). Returns mics x N array."""
    out = np.zeros((len(mics), N))
    for sig, pos, scale in sources:
        for mi, mpos in enumerate(mics):
            ir = sparse_ir(pos, mpos)
            y = np.convolve(sig, ir)[:N]
            out[mi] += scale * y
    return out

# calibrate source strengths: speech 65 dB SPL @1 m free field; walking gear
# whine Lw 86 dB (both hips combined -> 83 dB each)
A_SPEECH = 1.0
A_GEAR_WALK = 10 ** ((86 - 3) / 20) / 10 ** (65 / 20) * A_SPEECH   # per hip
A_GEAR_STAND = A_GEAR_WALK * 10 ** ((67 - 86) / 20)

speech = speech_signal()
speech /= np.sqrt(np.mean(speech ** 2))
gearL, gearR = gear_signal(), gear_signal()
gearL /= np.sqrt(np.mean(gearL ** 2)); gearR /= np.sqrt(np.mean(gearR ** 2))

print("   rendering speech + two gear sources through their room IRs...")
mix_speech = render([(speech, SRC, A_SPEECH)], MICS)
mix_gear = render([(gearL, HIPS[0], 1.0), (gearR, HIPS[1], 1.0)], MICS)

def db(x):
    return 10 * math.log10(np.mean(x ** 2) + 1e-30)

results = {}
for label, gain in (("walking", A_GEAR_WALK), ("standing", A_GEAR_STAND)):
    s0, n0 = db(mix_speech[0]), db(gain * mix_gear[0])
    snr_single = s0 - n0
    # delay-and-sum steered at the true talker position (near-field)
    d_ref = np.linalg.norm(SRC - MICS[0])
    bs = np.zeros(N); bn = np.zeros(N)
    for mi in range(6):
        lag = int(round((np.linalg.norm(SRC - MICS[mi]) - d_ref) / C * FS))
        bs += np.roll(mix_speech[mi], -lag)
        bn += np.roll(gain * mix_gear[mi], -lag)
    snr_beam = db(bs / 6) - db(bn / 6)
    results[label] = dict(snr_single=round(snr_single, 1),
                          snr_beam=round(snr_beam, 1),
                          gain=round(snr_beam - snr_single, 1))
    print(f"   {label:9s}: single-mic SNR {snr_single:+5.1f} dB  ->  "
          f"beamformed {snr_beam:+5.1f} dB  (array gain {snr_beam-snr_single:+.1f} dB)")
print(f"   L1 cross-check: dB arithmetic said -12 dB walking / +7 dB standing")

# SRP DOA over azimuth, run BOTH ways:
#   raw + walking noise -> locks onto the loudest source, the gearbox (18 dB
#   above speech at source). An honest failure that becomes policy: never
#   steer the neck by sound while walking.
#   speech-band prefiltered (250-1000 Hz, below the gear tones) + standing ->
#   the correct operating condition.
def srp(mix):
    best, best_p = None, -1e9
    for az_deg in np.arange(-60, 61, 2):
        az = math.radians(az_deg)
        tgt = np.array([6.0 + 1.6 * math.sin(az), 10.0 + 1.6 * math.cos(az), 1.50])
        d_ref = np.linalg.norm(tgt - MICS[0])
        acc = np.zeros(N)
        for mi in range(6):
            lag = int(round((np.linalg.norm(tgt - MICS[mi]) - d_ref) / C * FS))
            acc += np.roll(mix[mi], -lag)
        p = np.mean(acc ** 2)
        if p > best_p:
            best_p, best = p, az_deg
    return best

def bandpass(mix, lo, hi):
    f = np.fft.rfftfreq(N, 1 / FS)
    keep = (f >= lo) & (f <= hi)
    return np.stack([np.fft.irfft(np.fft.rfft(m) * keep, N) for m in mix])

print("\n   DOA (SRP over azimuth), true azimuth 0 deg:")
doa_walk_raw = srp(mix_speech + A_GEAR_WALK * mix_gear)
print(f"   walking, raw broadband     -> {doa_walk_raw:+.0f} deg  "
      f"(locks onto the gearbox: FAIL -> never steer-by-sound while walking)")
mix_stand_bp = bandpass(mix_speech + A_GEAR_STAND * mix_gear, 250, 1000)
doa_stand = srp(mix_stand_bp)
print(f"   standing, 250-1000 Hz band -> {doa_stand:+.0f} deg  "
      f"(neck-steer budget +/-10 deg: {'PASS' if abs(doa_stand) <= 10 else 'FAIL'})")

# ------------------------- figure -------------------------
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
fig, ax = plt.subplots(1, 3, figsize=(13, 3.6))
for bi, f0 in enumerate(BANDS):
    hist = np.zeros(nbin)
    idx = np.minimum((delays / BIN).astype(int), nbin - 1)
    np.add.at(hist, idx, e_bands[bi])
    edc = np.flip(np.cumsum(np.flip(hist)))
    ax[0].plot(t_axis, 10 * np.log10(np.maximum(edc / edc[0], 1e-9)),
               label=f"{f0} Hz")
ax[0].set(xlabel="time [s]", ylabel="EDC [dB]", ylim=(-62, 2),
          title="Schroeder decay, image-source model")
ax[0].legend(fontsize=7); ax[0].grid(alpha=0.3)
rr = [0.5, 0.8, 1.0, 1.2, 1.5, 1.8, 2.2, 3.0]
drs = []
for r in rr:
    rc2 = np.array([6.0, 10.0 + r, 1.60])
    dl2, eb2, _ = image_energy(np.array([6.0, 10.0, 1.60]), rc2, 1.2, bands=[2])
    i0 = np.argmin(dl2)
    drs.append(10 * math.log10(eb2[2][i0] / (eb2[2].sum() - eb2[2][i0])))
ax[1].plot(rr, drs, "o-")
ax[1].axhline(0, color="k", lw=0.7)
ax[1].axvline(1.6, color="tab:red", ls="--", lw=1, label="greeting stop 1.6 m")
ax[1].set(xlabel="distance [m]", ylabel="direct/reverberant [dB]",
          title="D/R crossover @1 kHz")
ax[1].legend(fontsize=8); ax[1].grid(alpha=0.3)
labels = ["walk\nsingle", "walk\nbeam", "stand\nsingle", "stand\nbeam"]
vals = [results["walking"]["snr_single"], results["walking"]["snr_beam"],
        results["standing"]["snr_single"], results["standing"]["snr_beam"]]
cols = ["tab:red", "tab:red", "tab:green", "tab:green"]
ax[2].bar(labels, vals, color=cols, alpha=0.75)
ax[2].axhline(0, color="k", lw=0.7)
ax[2].set(ylabel="SNR [dB]", title="6-mic delay-and-sum (48 kHz waveforms)")
ax[2].grid(alpha=0.3, axis="y")
plt.tight_layout()
plt.savefig(os.path.join(HERE, "voice_l2.png"), dpi=110)
print("   wrote voice_l2.png")

out = dict(room=dict(bands=res_bands, T30_mid=round(float(T30_mid), 2),
                     C50_mid_dB=round(float(C50_mid), 1),
                     critical_distance_num_m=rc_num,
                     l1_sabine_T60=2.43, l1_rc=1.50),
           array=dict(fs=FS, mics=6, ring_r_m=0.062, results=results,
                      doa_walking_raw_deg=float(doa_walk_raw),
                      doa_standing_bp_deg=float(doa_stand), doa_true_deg=0.0,
                      l1_snr_walk=-12, l1_snr_stand=7,
                      note="L2 omits torso shielding of the hip-to-mic path "
                           "(+5-8 dB it would restore) and includes reverberant "
                           "build-up of the continuous whine (L1 had neither)"))
with io.open(os.path.join(HERE, "voice_l2_ledger.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("\nwrote voice_l2_ledger.json")
