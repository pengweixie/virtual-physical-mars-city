# hab-bot-01 gait bake: walk / turn(march-in-place) / idle breathing sway.
# mujoco-bake pipeline: settle -> warmup full cycle -> record 2nd cycle.
# Mars gravity 3.71 (in XML). Exports JSON + JS snippet in three.js sign
# convention (js = -mj for all sagittal joints and pitch; see XML header table).
import json
import math
import os
import mujoco
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
m = mujoco.MjModel.from_xml_path(os.path.join(HERE, "hab_bot.xml"))
d = mujoco.MjData(m)

JN = ["hip_L", "hip_R", "knee_L", "knee_R", "ank_L", "ank_R",
      "sh_L", "sh_R", "elb_L", "elb_R"]
QADR = {n: m.joint(n).qposadr[0] for n in JN + ["root_y", "root_z", "root_pitch"]}
ACT = {n: m.actuator("a_" + n).id for n in JN}

# ---------------- command generators (targets in mj sign) ----------------
A_HIP, A_ARM = 0.34, 0.28

def leg_walk(p):
    """p in [0,1); p=0 heel strike (hip max fwd). stance 60% / swing 40%."""
    hip = A_HIP * math.cos(2 * math.pi * p)
    if p < 0.6:
        knee = -0.10 - 0.10 * math.sin(math.pi * p / 0.6)
    else:
        s = (p - 0.6) / 0.4
        knee = -0.10 - 0.90 * math.sin(math.pi * s)
    ankle = 0.10 * math.sin(2 * math.pi * p + 0.5)
    return hip, knee, ankle

def walk_cmd(t, T):
    ph = (t % T) / T
    pL, pR = ph, (ph + 0.5) % 1.0
    hL, kL, aL = leg_walk(pL)
    hR, kR, aR = leg_walk(pR)
    # arms counter-swing (arm fwd with opposite leg), elbows soft bend
    shL, shR = -A_ARM * math.cos(2 * math.pi * pL), -A_ARM * math.cos(2 * math.pi * pR)
    return {"hip_L": hL, "hip_R": hR, "knee_L": kL, "knee_R": kR,
            "ank_L": aL, "ank_R": aR, "sh_L": shL, "sh_R": shR,
            "elb_L": 0.45 + 0.10 * math.sin(2 * math.pi * pL),
            "elb_R": 0.45 + 0.10 * math.sin(2 * math.pi * pR)}

def lift(p):
    return math.sin(math.pi * p * 2) ** 2 if p < 0.5 else 0.0

def turn_cmd(t, T):
    """march in place (yaw applied kinematically at replay)."""
    ph = (t % T) / T
    pL, pR = ph, (ph + 0.5) % 1.0
    return {"hip_L": 0.20 * lift(pL), "hip_R": 0.20 * lift(pR),
            "knee_L": -0.06 - 0.50 * lift(pL), "knee_R": -0.06 - 0.50 * lift(pR),
            "ank_L": -0.05 * lift(pL), "ank_R": -0.05 * lift(pR),
            "sh_L": 0.08 * lift(pR), "sh_R": 0.08 * lift(pL),
            "elb_L": 0.42, "elb_R": 0.42}

def idle_cmd(t, T):
    s = math.sin(2 * math.pi * t / T)
    c = math.sin(2 * math.pi * t / T + 1.1)
    return {"hip_L": 0.020 * s, "hip_R": 0.020 * s,
            "knee_L": -0.075 + 0.030 * s, "knee_R": -0.075 + 0.030 * s,
            "ank_L": 0.012 * c, "ank_R": 0.012 * c,
            "sh_L": 0.05 * s, "sh_R": 0.05 * s,
            "elb_L": 0.40 + 0.04 * s, "elb_R": 0.40 + 0.04 * s}

def apply(cmd):
    for n, v in cmd.items():
        d.ctrl[ACT[n]] = v

# ---------------- bake one cycle ----------------
def bake(name, cmd_fn, T, dt_s):
    mujoco.mj_resetData(m, d)
    # settle 8 s at the cycle's t=0 pose (defines baselines; the pitch-spring
    # support has a slow settle that must not leak into the recorded lap)
    for _ in range(int(8.0 / m.opt.timestep)):
        apply(cmd_fn(0.0, T))
        mujoco.mj_step(m, d)
    z0 = d.qpos[QADR["root_z"]]
    # warmup 3 full cycles: converge onto the limit cycle before recording
    t0 = d.time
    while d.time - t0 < 3 * T:
        apply(cmd_fn((d.time - t0) % T, T))
        mujoco.mj_step(m, d)
    # record second cycle
    n = round(T / dt_s)
    ch = {k: [] for k in JN + ["pitch", "heave"]}
    y_start = d.qpos[QADR["root_y"]]
    t0 = d.time
    for i in range(n):
        t_target = i * dt_s
        while d.time - t0 < t_target - 1e-9:
            apply(cmd_fn(d.time - t0, T))
            mujoco.mj_step(m, d)
        for jn in JN:
            ch[jn].append(d.qpos[QADR[jn]])
        ch["pitch"].append(d.qpos[QADR["root_pitch"]])
        ch["heave"].append(d.qpos[QADR["root_z"]] - z0)
    # finish the lap to measure forward speed over exactly one cycle
    while d.time - t0 < T:
        apply(cmd_fn(d.time - t0, T))
        mujoco.mj_step(m, d)
    dist = d.qpos[QADR["root_y"]] - y_start
    speed = dist / T

    # ------- convert to js sign: all sagittal joints & pitch flip -------
    out = {}
    for k, v in ch.items():
        arr = [-x for x in v] if k != "heave" else list(v)
        out[k] = arr
    # pitch/heave: remove per-cycle mean — the static lean/sink is the
    # planarizing support's spring equilibrium (rig artifact), only the
    # dynamic bob is real robot motion worth replaying
    for k in ("pitch", "heave"):
        mean = sum(out[k]) / len(out[k])
        out[k] = [x - mean for x in out[k]]
    # loop-closure blend: contact events vary cycle-to-cycle, so the lap end
    # never lands exactly on its start; smoothstep the last 15% onto sample 0
    nb = max(2, int(0.15 * n))
    for k, arr in out.items():
        target = arr[0]
        for j in range(nb):
            s = (j + 1) / nb
            w = s * s * (3 - 2 * s)
            idx = n - nb + j
            arr[idx] = arr[idx] * (1 - w) + target * w

    # ------- acceptance metrics -------
    print(f"--- {name}: T={T}s n={n} fwd={dist:+.3f} m ({speed:+.3f} m/s)")
    worst_step, worst_ch = 0, ""
    for k, arr in out.items():
        mn, mx = min(arr), max(arr)
        loop = abs(arr[0] - arr[-1])  # first vs last sample (one dt apart of wrap)
        step = max(abs(arr[(i + 1) % n] - arr[i]) for i in range(n))
        if step > worst_step:
            worst_step, worst_ch = step, k
        print(f"    {k:7s} min {mn:+.3f} max {mx:+.3f} wrapstep {loop:.3f} maxstep {step:.3f}")
    print(f"    worst adjacent step: {worst_ch} {worst_step:.3f} rad "
          f"({'OK' if worst_step < 0.3 else 'TOO HARD — soften servo or slow targets'})")
    return {"T": T, "dt": dt_s, "speed": round(speed, 4), "channels": out}

cycles = {
    "walk": bake("walk", walk_cmd, 1.8, 0.06),
    "turn": bake("turn", turn_cmd, 1.2, 0.06),
    "idle": bake("idle", idle_cmd, 4.8, 0.12),
}

# ---------------- export ----------------
doc = {
    "asset": "hab-bot-01",
    "source": "sim/run_gait.py + sim/hab_bot.xml (MuJoCo, Mars g=3.71 m/s^2)",
    "sign_convention": "three.js: rotation.x, thigh-forward negative; heave in m",
    "cycles": {k: {**v, "channels": {ck: [round(x, 4) for x in cv]
                                     for ck, cv in v["channels"].items()}}
               for k, v in cycles.items()},
}
with open(os.path.join(HERE, "hab-bot-01.gait.json"), "w") as f:
    json.dump(doc, f, separators=(",", ":"))

# JS snippet (paste into hab-bot-01.js)
with open(os.path.join(HERE, "gait_snippet.js"), "w") as f:
    f.write("  // MuJoCo-baked gait cycles (sim/run_gait.py, Mars g=3.71).\n")
    f.write("  const GAIT = {\n")
    for k, v in cycles.items():
        f.write(f"    {k}: {{ T: {v['T']}, dt: {v['dt']}, speed: {v['speed']},\n")
        for ck, cv in v["channels"].items():
            f.write(f"      {ck}: [" + ",".join(f"{x:.3f}" for x in cv) + "],\n")
        f.write("    },\n")
    f.write("  };\n")
print("exported hab-bot-01.gait.json + gait_snippet.js")
