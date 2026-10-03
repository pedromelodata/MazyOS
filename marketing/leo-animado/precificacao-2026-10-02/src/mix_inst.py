# Mix das versões sem o Léo: narração institucional (narr-inst.wav) + trilha que abaixa sob a voz + efeitos.
#   python mix_inst.py motion  -> remotion/public-motion/mix-motion.wav
#   python mix_inst.py broll   -> remotion/public-broll/mix-broll.wav   (efeitos só nos cortes e acentos)
# Tempos: remotion/src/data/timeline-inst.json (gerado pelo timeline_inst.py). -14 LUFS, pico -1,5 dBTP.
import json, os, subprocess, sys
import numpy as np
from sfx import (SR, Track, db, s_bubble, s_burst, s_check, s_chime, s_clack, s_pop, s_riser, s_ring, s_roll,
                 s_swish, s_thump, s_tick, s_whoosh)

MODE = sys.argv[1] if len(sys.argv) > 1 else "motion"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
REPO = os.path.abspath(os.path.join(ROOT, "..", "..", ".."))
TL = json.load(open(P("remotion", "src", "data", "timeline-inst.json"), encoding="utf-8"))
M = TL["marks"]; W = [w["s"] for w in TL["words"]]
DUR, END_T0 = TL["dur"], TL["endT0"]
tr = Track(DUR); place = tr.place

# fronteiras de cena (iguais a remotion/src/lib/tli.ts)
B = [M["um"] - .12, M["dois"] - .12, M["tres2"] - .12, M["bateu"] - .12, M["cobrar"] - .12, M["app"] - .3, M["comenta"] - .12]

def load(path, start=0.0, dur=None):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-i", path]
    if dur: cmd += ["-t", f"{dur:.3f}"]
    cmd += ["-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()

if MODE == "motion":
    # transições (mesmos tipos e durações do Motion.tsx)
    D = [0.5, 0.44, 0.46, 0.44, 0.42, 0.46, 0.52]
    K = ["iris", "push", "zoom", "slideUp", "wipeUp", "zoom", "iris"]
    for b, d, k in zip(B, D, K):
        st = b - d / 2 - 0.08
        if k in ("push", "slideUp"): place(s_whoosh(d + 0.2, 400, 6000), st, -27)
        elif k == "zoom": place(s_whoosh(d + 0.25, 250, 4500), st, -26); place(s_thump(110, 50, 0.3), b + 0.05, -26)
        elif k == "iris": place(s_whoosh(d + 0.2, 600, 8000), st, -29); place(s_pop(700, 300, 0.14, 24), b, -27)
        else: place(s_whoosh(d + 0.2, 300, 5000), st, -27)
    # gancho
    place(s_thump(), 0.0, -17)
    place(s_pop(700, 220, 0.16, 20), M["tres"] - 0.01, -21)
    place(s_pop(1100, 420), M["sinais"], -27)
    place(s_chime(2093.0, 0.6), M["sinais"] + 0.02, -33)
    place(s_thump(120, 60, 0.25), M["caro"], -22)
    # sinal 1
    place(s_pop(620, 240, 0.16, 22), B[0] + 0.02, -25)
    for k in ("seus", "clientes", "nunca"): place(s_bubble(), M[k] - 0.04, -26)
    # sinal 2
    place(s_pop(620, 240, 0.16, 22), B[1] + 0.02, -26)
    place(s_bubble(), M["sua"] - 0.05, -29)
    place(s_roll(12, 0.5), M["agenda"] - 0.05, -30)
    place(s_thump(150, 60, 0.3), M["cheia"] + 0.12, -20); place(s_tick(1800), M["cheia"] + 0.12, -26)
    for k in ("meses", "frente"): place(s_pop(800, 380, 0.1, 34), M[k] - 0.06, -27)
    # sinal 3
    place(s_swish(0.3), B[2] + 0.04, -30); place(s_swish(0.24), B[2] + 0.4, -35); place(s_swish(0.2), M["cobra"] - 0.05, -35)
    place(s_whoosh(0.22, 900, 7000), M["mesmo"] - 0.02, -34); place(s_clack(), M["mesmo"] + 0.18, -21)
    place(s_pop(900, 400, 0.1, 34), M["doisanos"] - 0.06, -28)
    for k in ("anos", "atras"): place(s_tick(2900), M[k] - 0.05, -24)
    # bateu dois / hora de reajustar
    place(s_pop(620, 240, 0.16, 22), B[3] + 0.02, -27)
    for k in range(3): place(s_bubble(), B[3] + 0.1 + 0.07 * k, -32)
    place(s_check(), M["doisq"], -24); place(s_pop(1800, 900, 0.08, 45), M["doisq"] + 0.1, -29)
    place(s_pop(900, 300, 0.14, 26), M["ta"] - 0.08, -26)
    place(s_ring(0.7), M["hora"] - 0.02, -28)
    place(s_riser(0.45, 500, 1500), M["reajustar"] - 0.45, -28)
    place(s_thump(130, 55, 0.3), M["reajustar"], -21)
    place(s_pop(1300, 600, 0.09, 40), M["reajustar"] + 0.25, -26)
    # cresceu
    place(s_pop(620, 240, 0.16, 22), B[4] + 0.08, -26)
    place(s_pop(1000, 420), M["cobrar"] + 0.2, -26)
    place(s_riser(0.55, 420, 1300), M["cresceu"] - 0.3, -30)
    place(s_burst(10, 0.35), M["cresceu"] - 0.02, -25)
    place(s_chime(1568.0, 1.0), M["cresceu"], -31)
    place(s_thump(130, 55, 0.3), M["cresceu"], -23)
    # app + teto
    place(s_pop(900, 400, 0.12, 30), B[5] + 0.06, -28)
    place(s_whoosh(0.42, 350, 6000), M["app"] - 0.2, -27)
    place(s_whoosh(0.4, 500, 6000), M["olho"] - 0.42, -34)
    place(s_pop(1000, 420), M["olho"] - 0.06, -25)
    place(s_tick(2400), 19.95 + 0.11, -34)
    place(s_pop(800, 360, 0.12, 30), M["teto"] - 0.06, -26)
    place(s_riser(0.9, 300, 900), M["teto"] + 0.05, -34)
    place(s_pop(1000, 420), M["n81"] - 0.04, -24)
    # CTA
    place(s_pop(620, 240, 0.16, 22), M["comenta"] - 0.06, -24)
    for k in range(3): place(s_bubble(), M["quais"] + 0.14 * k, -27)
    place(s_pop(1100, 500, 0.1, 34), M["voce2"] - 0.1, -29)
    for k in range(3): place(s_pop(500, 1200, 0.12, 25), M["tem"] + 0.08 * k, -31)
    # fim: íris coral volta pro começo
    place(s_whoosh(0.45, 500, 7000), END_T0 - 0.08, -28)
    place(s_chime(1318.5, 1.1), END_T0 + 0.15, -25)
    place(s_chime(1975.5, 0.9), END_T0 + 0.22, -33)
    out = P("remotion", "public-motion", "mix-motion.wav")
else:
    # b-roll: cortes secos com chicote leve; acentos só nas viradas de sinal e no fecho
    CUTS = json.load(open(P("remotion", "src", "data", "broll-cuts.json"), encoding="utf-8"))
    for c, kd in zip(CUTS["bounds"], CUTS["kind"]):
        if kd == "flash": place(s_thump(150, 60, 0.28), c, -24); place(s_tick(2200), c, -30)
        else: place(s_whoosh(0.34, 500, 7000), c - 0.22, -31)
        if kd == "zoomBlur": place(s_thump(110, 50, 0.3), c + 0.04, -28)
    place(s_thump(), 0.0, -18)
    place(s_pop(700, 220, 0.16, 20), M["tres"] - 0.01, -23)
    place(s_thump(120, 60, 0.25), M["caro"], -23)
    for k in ("um", "dois", "tres2"): place(s_pop(620, 240, 0.16, 22), M[k] - 0.08, -24)
    place(s_check(), M["doisq"], -26)
    place(s_riser(0.45, 500, 1500), M["reajustar"] - 0.45, -30)
    place(s_thump(130, 55, 0.3), M["reajustar"], -23)
    place(s_riser(0.55, 420, 1300), M["cresceu"] - 0.3, -31)
    place(s_thump(130, 55, 0.3), M["cresceu"], -24)
    place(s_chime(1568.0, 1.0), M["cresceu"], -33)
    place(s_whoosh(0.42, 350, 6000), M["app"] - 0.2, -27)
    place(s_pop(1000, 420), M["n81"] - 0.04, -25)
    place(s_whoosh(0.5, 300, 5000), M["comenta"] - 0.34, -33)            # desfoque abrindo no CTA
    for k in range(3): place(s_bubble(), M["quais"] + 0.14 * k, -28)
    place(s_whoosh(0.4, 500, 7000), END_T0 - 0.08, -29)                  # chicote de volta pro gancho
    place(s_chime(1318.5, 1.1), END_T0 + 0.15, -26)
    place(s_chime(1975.5, 0.9), END_T0 + 0.22, -34)
    out = P("remotion", "public-broll", "mix-broll.wav")

N = tr.N
vo = load(P("vo", "narr-inst.wav"))
voice = np.zeros(N, np.float32); voice[: min(N, len(vo))] = vo[:N]
# trilha: mesma entrada da versão do Léo (virada em 10,36 s; groove cai no "sinais")
mus = load(os.path.join(REPO, "marketing", "escalada", "audio", "Trilha", "ES_Palmy Sway - G Mills.mp3"), 10.36, DUR + 0.2)[:N]
mus = np.pad(mus, (0, N - len(mus)))
hop = 240; nfr = N // hop
ve = np.sqrt((voice[: nfr * hop].reshape(nfr, hop) ** 2).mean(1))
act = (20 * np.log10(ve + 1e-9) > -42).astype(np.float32)
g = np.zeros_like(act); cur = 0.0
for k in range(nfr):
    tgt = act[k]; tc = 0.06 if tgt > cur else 0.32
    cur += (tgt - cur) * (1 - np.exp(-hop / SR / tc)); g[k] = cur
duck = db(-9.0 * np.repeat(g, hop)); duck = np.pad(duck, (0, N - len(duck)), constant_values=duck[-1])
tf = np.arange(N) / SR
gain = np.full(N, db(-19.0 if MODE == "broll" else -20.0), np.float32) * np.clip(tf / 0.05, 0, 1)
gain *= np.where(tf > END_T0, db(3.0 * np.clip((tf - END_T0) / 0.3, 0, 1)), 1.0)
gain *= np.clip((DUR - tf) / 0.9, 0, 1) ** 1.3
mix = voice * db(-1.0) + mus * gain * duck + tr.x

os.makedirs(os.path.dirname(out), exist_ok=True)
tmp = P("out", f"_mix_{MODE}_raw.wav"); os.makedirs(P("out"), exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_f32le", tmp],
               input=mix.astype(np.float32).tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
js = json.loads(m[m.rfind("{"): m.rfind("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
      f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", out], check=True)
os.remove(tmp)
print(f"mix {MODE} ok:", out, "entrada I=%s" % js["input_i"])
