# Voice for hab-bot-01: what it actually requires, priced before building.
#
# Voice is NEW capability (the excavation seal stands) - but the sealed ledgers
# immediately constrain it in four places:
#   * acoustics: the foyer is a hard-walled hall; how bad is the reverb, and
#     where is the critical distance relative to the greeting distance?
#   * ego-noise: the robot's own harmonic drives sing; can it hear over itself?
#   * compute split: voice is NOT in the safety loop, so the latency criterion
#     sends almost all of it to the city - the mirror image of the reflex layer.
#   * power: ~1 W of audio hardware, and the battery was JUST sized to the EOL
#     line with 1.2% margin. Does voice fit? (No. That is the point of margins.)
import io
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# ===========================================================================
# 1. FOYER ACOUSTICS
# ===========================================================================
print("=== 1. FOYER ACOUSTICS (hard printed-regolith walls) ===")
Lx, Lz, H = 12.0, 20.0, 7.0            # net hall, mean height under the vault
V = Lx * Lz * H
S = 2 * (Lx * Lz + Lx * H + Lz * H)
ALPHA = 0.12                            # printed regolith + steel, few absorbers
A = S * ALPHA
RT60 = 0.161 * V / A
r_c = 0.057 * math.sqrt(V / RT60)
print(f"   hall {Lx:.0f}x{Lz:.0f}x{H:.0f} m: V={V:.0f} m3, S={S:.0f} m2, "
      f"mean absorption {ALPHA}")
print(f"   Sabine RT60 = 0.161*V/(S*a) = {RT60:.1f} s   <- church-like, very live")
print(f"   critical distance r_c = 0.057*sqrt(V/RT60) = {r_c:.2f} m")
print(f"   greeting stop distance = 1.60 m -> the conversation partner stands")
print(f"   AT the direct/reverberant boundary. Inside r_c the direct field wins;")
print(f"   a step further back and the 2.4 s tail dominates. Beamforming and")
print(f"   dereverberation are not polish here - they are the difference between")
print(f"   an ASR that works at 1.6 m and one that only works at 0.5 m.")

# ===========================================================================
# 2. EGO-NOISE - can it hear over its own gearboxes?
# ===========================================================================
print("\n=== 2. EGO-NOISE ===")
# The noise source is the gear MESH, so it scales with mechanical power moving
# through the teeth - NOT with electrical dissipation. A standing robot's 11.5 W
# hold is almost entirely copper loss, and copper is silent; the gears barely
# turn. (The first draft billed acoustic noise off ELECTRICAL power and
# concluded the robot could not hear speech even while standing - wrong physics,
# caught on self-review: heat is silent, motion is loud.)
ETA_AC = 1e-5                           # gear-mesh mech power -> radiated sound
mic_rows = []
for label, p_mesh in (("walking (gear throughput ~40 W)", 40.0),
                      ("standing/PFL (micro-corrections ~0.5 W)", 0.5)):
    p_ac = p_mesh * ETA_AC
    Lw = 10 * math.log10(p_ac / 1e-12)
    # head mics ~0.5 m from the hip gearboxes, near field + body shielding ~ -8 dB
    Lp_mic = Lw - 11 - 20 * math.log10(0.5) - 8
    mic_rows.append((label, Lp_mic))
    print(f"   {label:40s} Lw {Lw:4.0f} dB  at head mics ~{Lp_mic:.0f} dB SPL")
speech_at_mic = 65 - 20 * math.log10(1.6)     # talker 65 dB @1 m, at 1.6 m
snr_walk = speech_at_mic - mic_rows[0][1]
snr_stand = speech_at_mic - mic_rows[1][1]
print(f"   talker at 1.6 m arrives at ~{speech_at_mic:.0f} dB SPL")
print(f"   -> walking: SNR {snr_walk:+.0f} dB (beamforming cannot rescue that);")
print(f"      standing: SNR {snr_stand:+.0f} dB, comfortable.")
print(f"   POLICY that falls out: converse while stationary. Which is free -")
print(f"   conversation already happens in the PFL state, where the robot")
print(f"   stands still by definition. The modes were already aligned.")

# ===========================================================================
# 3. COMPUTE SPLIT - by the latency criterion, voice goes to the city
# ===========================================================================
print("\n=== 3. COMPUTE SPLIT (latency criterion, voice is not safety) ===")
rows = [
    ("wake word + VAD", "local, always-on", 30, "privacy: raw audio never leaves"),
    ("beamform + dereverb", "local DSP", 150, "must run at the mics"),
    ("streaming ASR", "city", 3000, "turn latency budget ~300 ms >> 189 ms RTT"),
    ("dialogue / intent (LLM)", "city", 5e4, "already in the compute ledger"),
    ("TTS", "city, audio streamed", 500, "canned phrases cached locally"),
]
for name, where, mops, note in rows:
    print(f"   {name:24s} {where:22s} {mops:8.0f} MOPS   {note}")
print("   uplink: 16 kHz x 16 bit = 32 KB/s, <1% of the radio budget")
print("   LINK-LOSS DEGRADATION (house contract): ~20 canned intents stay local")
print("   ('where is the charger', 'follow me', 'call the clinic') with cached")
print("   audio - the exact mirror of the baked-patrol fallback.")

# ===========================================================================
# 4. POWER - and the EOL margin it just broke
# ===========================================================================
print("\n=== 4. POWER: +1 W, AND THE MARGIN IT BREAKS ===")
audio = dict(mics_codec=0.25, dsp_beamform=0.40, speaker_avg=0.30, amp_idle=0.05)
P_VOICE = sum(audio.values())
print(f"   audio hardware: {audio} -> +{P_VOICE:.1f} W continuous")
P_SHIFT_OLD, SHIFT_H, FADE = 73.1, 4.0, 0.80
P_SHIFT_NEW = P_SHIFT_OLD + P_VOICE
E_NEW = P_SHIFT_NEW * SHIFT_H
for cap in (370, 380):
    eol = cap * FADE
    margin = (eol - E_NEW) / E_NEW * 100
    print(f"   {cap} Wh pack: EOL {eol:.0f} Wh vs needed {E_NEW:.0f} Wh -> "
          f"margin {margin:+.1f}%{'  <-- NEGATIVE, voice does not fit' if margin < 0 else '  OK'}")
print("   -> the pack moves 370 -> 380 Wh (fourth change, fourth distinct reason:")
print("      actuators up, electronics down, EOL sizing, and now a new subsystem).")
print("      This is what margins are FOR - the ledger catches the creep on day")
print("      one instead of as a mystery shift-shortfall a year in.")

# ===========================================================================
# 5. THE MARS FOOTNOTE
# ===========================================================================
print("\n=== 5. WHY VOICE IS INDOOR-ONLY, LIKE EVERYTHING ELSE ===")
print("   the undercity is pressurized; acoustics are Earth-normal. On the Mars")
print("   surface (~600 Pa CO2) sound couples ~20 dB weaker and CO2 strongly")
print("   absorbs high frequencies - speech is unintelligible beyond a few")
print("   metres. The LiDAR ledger already proved this robot cannot work")
print("   outdoors (daylight background); the voice ledger proves it again.")

out = dict(
    acoustics=dict(V_m3=round(V), S_m2=round(S), alpha=ALPHA,
                   RT60_s=round(RT60, 2), critical_distance_m=round(r_c, 2),
                   greet_distance_m=1.60),
    ego_noise=dict(eta_acoustic=ETA_AC, source="gear-mesh mechanical power",
                   walking_dB_at_mic=round(mic_rows[0][1]),
                   standing_dB_at_mic=round(mic_rows[1][1]),
                   speech_dB_at_mic=round(speech_at_mic),
                   snr_walking_dB=round(snr_walk), snr_standing_dB=round(snr_stand),
                   policy="converse while stationary (= the PFL state)"),
    split=[dict(task=n, where=w, mops=m, note=x) for n, w, m, x in rows],
    power=dict(audio_W=audio, total_W=round(P_VOICE, 2),
               shift_mean_W=round(P_SHIFT_NEW, 1),
               pack_old=370, pack_new=380,
               eol_margin_370=round((370*FADE-E_NEW)/E_NEW, 3),
               eol_margin_380=round((380*FADE-E_NEW)/E_NEW, 3)))
with io.open(os.path.join(HERE, "voice_ledger.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("\nwrote voice_ledger.json")
