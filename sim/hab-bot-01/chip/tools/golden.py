# Golden model for lidar_fe.v - third independent implementation.
# Mirrors the RTL's integer arithmetic EXACTLY (bit-level), including:
#   - last bin (NBINS-1) excluded from peak search (gate-edge spec)
#   - first-max-wins argmax (strict >)
#   - frac256 = floor(256*|R-L| / (L+P+R)), sign from (R<L)
#   - walk LUT indexed by fired[9:5], result = bin*256 + frac - walk (mod 2^16)
# Emits stimulus + expected results as .mem files for the testbench.
import random
import sys

NCH, NBINS, CNTW = 15, 70, 12

WALK = [2, 6, 11, 16, 21, 27, 33, 39, 45, 52, 59, 66, 74, 82, 90, 99,
        108, 118, 128, 139, 150, 162, 175, 188, 202, 217, 232, 248,
        255, 255, 255, 255]


def model(stamps):
    """stamps: list of (ch, bin). Returns per-channel (range_q8, peak_cnt)."""
    hist = [[0] * NBINS for _ in range(NCH)]
    fired = [0] * NCH
    for ch, b in stamps:
        hist[ch][b] = (hist[ch][b] + 1) & ((1 << CNTW) - 1)
        fired[ch] = (fired[ch] + 1) & ((1 << CNTW) - 1)
    out = []
    for ch in range(NCH):
        best_cnt, best_bin = 0, 0
        for b in range(NBINS - 1):              # last bin excluded (RTL spec)
            if hist[ch][b] > best_cnt:
                best_cnt, best_bin = hist[ch][b], b
        left = hist[ch][best_bin - 1] if best_bin > 0 else 0
        right = hist[ch][best_bin + 1] if best_bin < NBINS - 1 else 0
        den = left + best_cnt + right
        diff = abs(right - left)
        frac = (diff * 256) // den if den else 0
        signed_frac = -frac if right < left else frac
        walk = WALK[(fired[ch] >> 5) & 31]
        rng = (best_bin * 256 + signed_frac - walk) & 0xFFFF
        out.append((rng, best_cnt))
    return out


SAT = (1 << 10) - 1          # the SRAM variant stores 10-bit saturating counters


def check_no_saturation(stamps):
    """The two RTL variants store counters at different widths (12-bit flops vs
    10-bit packed SRAM slots). They agree bit-for-bit only while no bin reaches
    1023. Any regenerated vector set must be re-checked here, or the SRAM
    variant will diverge for a reason that has nothing to do with a bug."""
    hist = {}
    for ch, b in stamps:
        hist[(ch, b)] = hist.get((ch, b), 0) + 1
    peak = max(hist.values())
    assert peak < SAT, f"vector saturates a 10-bit counter: peak {peak} >= {SAT}"
    return peak


def selftest():
    # known answer: single spike at bin 30, ch 0, 100 stamps
    st = [(0, 30)] * 100
    r = model(st)
    frac_exp = 0                                 # symmetric (L=R=0)
    walk_exp = WALK[100 >> 5]
    assert r[0][0] == (30 * 256 - walk_exp) & 0xFFFF, r[0]
    assert r[0][1] == 100
    # symmetry: mirrored neighbours flip the sign of frac
    a = model([(1, 40)] * 50 + [(1, 41)] * 20)
    b = model([(1, 40)] * 50 + [(1, 39)] * 20)
    fa = (a[1][0] - (40 * 256 - WALK[70 >> 5])) & 0xFFFF
    fb = ((40 * 256 - WALK[70 >> 5]) - b[1][0]) & 0xFFFF
    assert fa == fb != 0, (fa, fb)
    # knob: more stamps -> larger walk correction -> smaller range
    lo = model([(2, 35)] * 64)[2][0]
    hi = model([(2, 35)] * 640)[2][0]
    assert hi < lo, (lo, hi)
    print("golden selftest OK")


def emit(seed, path_prefix):
    random.seed(seed)
    stamps = []
    for ch in range(NCH):
        peak = random.randint(2, NBINS - 4)
        n_sig = random.randint(40, 600)
        for _ in range(n_sig):                   # triangular-ish pulse
            b = peak + random.choice([-1, 0, 0, 0, 1])
            stamps.append((ch, b))
        for _ in range(random.randint(0, 60)):   # dark counts
            stamps.append((ch, random.randint(0, NBINS - 1)))
    random.shuffle(stamps)
    with open(path_prefix + "_stim.mem", "w") as f:
        for ch, b in stamps:
            f.write(f"{(ch << 7) | b:03x}\n")
    peak = check_no_saturation(stamps)
    print(f"   peak bin count {peak} (10-bit saturation at {SAT}: clear)")
    with open(path_prefix + "_exp.mem", "w") as f:
        for rng, cnt in model(stamps):
            f.write(f"{(cnt << 16) | rng:07x}\n")
    print(f"emitted {len(stamps)} stamps -> {path_prefix}_stim/_exp.mem")


if __name__ == "__main__":
    selftest()
    emit(int(sys.argv[1]) if len(sys.argv) > 1 else 20260809,
         sys.argv[2] if len(sys.argv) > 2 else "tv")
