# Mix do Reel do Léo: narração + trilha (abaixa sob a voz) + efeitos sintetizados nos tempos do render.
#   python mix.py  -> out/mix.wav (48 kHz, -14 LUFS, pico -1,5 dBTP)
import os, subprocess, json
import numpy as np
from render import T, SEQ, TR, END_T0, DUR, P, REPO

SR = 48000
N = int(round(DUR * SR))
rng = np.random.default_rng(7)

def load(path, start=0.0, dur=None, sr=SR):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-i", path]
    if dur: cmd += ["-t", f"{dur:.3f}"]
    cmd += ["-f", "f32le", "-ac", "1", "-ar", str(sr), "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()

db = lambda g: 10 ** (g / 20)
tt = lambda d: np.arange(int(d * SR)) / SR

def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    w = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * w, len(x)).astype(np.float32)

def fade_in(y, ms=2):
    n = max(1, int(ms / 1000 * SR)); y[:n] *= np.linspace(0, 1, n); return y

# ---- efeitos
def s_pop(f0=950, f1=330, d=0.10, k=36):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 45)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * k)
    return fade_in(y.astype(np.float32))

def s_bubble():
    return s_pop(1500, 720, 0.08, 45)

def s_tick(f=3300):
    t = tt(0.035)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 260) + 0.35 * rng.standard_normal(len(t)) * np.exp(-t * 600)
    return fade_in(y.astype(np.float32), 0.5)

def s_chime(f=1318.5, d=0.9):
    t = tt(d)
    y = (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) + 0.18 * np.sin(2 * np.pi * 3 * f * t)) * np.exp(-t * 5.5)
    return fade_in(y.astype(np.float32), 4) * 0.6

def s_check():
    a = s_chime(1046.5, 0.5); b = s_chime(1568.0, 0.6)
    y = np.zeros(int(0.7 * SR), np.float32); y[:len(a)] += a
    o = int(0.075 * SR); y[o:o + len(b)] += b[: len(y) - o]
    return y * 0.8

def s_whoosh(d=0.38, lo=500, hi=6000):
    n = int(d * SR); x = rng.standard_normal(n).astype(np.float32)
    a = band(x, lo, hi * 0.35); b = band(x, lo * 2.5, hi)
    k = np.linspace(0, 1, n) ** 1.3
    y = a * (1 - k) + b * k
    env = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return (y * env / (np.abs(y).max() + 1e-9)).astype(np.float32)

def s_riser(d=0.8, f0=380, f1=1150):
    t = tt(d); f = f0 + (f1 - f0) * (t / d) ** 1.6
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / d) ** 1.5 * np.exp(-np.maximum(0, t - d * 0.85) * 40)
    nz = band(rng.standard_normal(len(t)).astype(np.float32), 1500, 7000) * (t / d) ** 2 * 0.25
    return fade_in((y * 0.55 + nz).astype(np.float32), 10)

def s_roll(n=10, span=0.5):
    y = np.zeros(int((span + 0.06) * SR), np.float32)
    for k in range(n):
        o = int(k * span / n * SR); tk = s_tick(2600 + 90 * k) * (0.6 + 0.4 * k / n)
        y[o:o + len(tk)] += tk[: len(y) - o]
    return y

def place(buf, sig, t, gain_db):
    i = int(round(t * SR))
    if i >= len(buf): return
    j = min(len(buf), i + len(sig)); buf[i:j] += sig[: j - i] * db(gain_db)

fx = np.zeros(N, np.float32)
pk = lambda y: y / (np.abs(y).max() + 1e-9)
# gancho
place(fx, pk(s_whoosh(0.30)), 0.0, -30)
place(fx, pk(s_pop(700, 220, 0.16, 20)), T(0) - 0.01, -20)
place(fx, pk(s_pop(1100, 420)), T(1), -26)
place(fx, pk(s_pop(900, 300)), T(9), -23)
# badges dos sinais
for i in (10, 17, 25):
    place(fx, pk(s_pop(620, 260, 0.14, 24)), T(i) - 0.05, -21)
    place(fx, pk(s_chime(1760, 0.5)), T(i) - 0.02, -33)
# sinal 1: balões + chip
for i in (11, 12, 13):
    place(fx, pk(s_bubble()), T(i) - 0.02, -25)
place(fx, pk(s_pop(1300, 600, 0.09, 40)), T(16) - 0.02, -24)
# sinal 2: agenda
place(fx, pk(s_whoosh(0.28, 700, 7000)), T(19) - 0.16, -32)
place(fx, pk(s_roll(12, 0.48)), T(21) - 0.05, -30)
for i in (22, 24):
    place(fx, pk(s_pop(800, 380, 0.1, 34)), T(i) - 0.04, -26)
# sinal 3: etiqueta + anos
place(fx, pk(s_whoosh(0.30, 400, 5000)), T(27) - 0.14, -30)
for i in (32, 33, 34):
    place(fx, pk(s_tick(2900)), T(i) - 0.04, -24)
# bateu dois: bolinhas + checks + seta
for k in range(3):
    place(fx, pk(s_bubble()), T(35) + 0.05 * k, -30)
place(fx, pk(s_check()), T(36), -24)
place(fx, pk(s_riser(0.45, 500, 1400)), T(41) - 0.06, -30)
# cresceu
place(fx, pk(s_riser(0.55, 420, 1300)), T(50) - 0.05, -29)
# app + teto
place(fx, pk(s_whoosh(0.42, 350, 6000)), T(52) - 0.14, -26)
place(fx, pk(s_tick(2200)), T(60) - 0.02, -26)
place(fx, pk(s_riser(0.9, 300, 900)), T(62) - 0.03, -33)
place(fx, pk(s_pop(1000, 420)), T(66) - 0.04, -24)
# CTA
place(fx, pk(s_pop(900, 320)), T(70) - 0.04, -24)
for k in range(3):
    place(fx, pk(s_bubble()), T(74) + 0.09 * k, -27)
# trocas de layout: whoosh bem baixo
for ts, name in SEQ[1:]:
    place(fx, pk(s_whoosh(TR + 0.05, 300, 4500)), ts - TR, -36)
# cartão final
place(fx, pk(s_chime(1318.5, 1.2)), END_T0 + 0.22, -24)
place(fx, pk(s_chime(1975.5, 1.0)), END_T0 + 0.30, -32)

# ---- narração
vo = load(P("vo", "narr-leo.wav"))
voice = np.zeros(N, np.float32); voice[: min(N, len(vo))] = vo[:N]

# ---- trilha: começa na virada de bateria (10,36 s), groove entra no "SINAIS"
trilha = os.path.join(REPO, "marketing", "escalada", "audio", "Trilha", "ES_Palmy Sway - G Mills.mp3")
mus = load(trilha, 10.36, DUR + 0.2)[:N]
mus = np.pad(mus, (0, N - len(mus)))
# ducking: envelope da voz (ataque 60 ms, soltura 320 ms)
hop = 240; nfr = N // hop
ve = np.sqrt((voice[: nfr * hop].reshape(nfr, hop) ** 2).mean(1))
act = (20 * np.log10(ve + 1e-9) > -42).astype(np.float32)
g = np.zeros_like(act); cur = 0.0
for k in range(nfr):
    tgt = act[k]; tc = 0.06 if tgt > cur else 0.32
    cur += (tgt - cur) * (1 - np.exp(-hop / SR / tc)); g[k] = cur
duck = db(-9.0 * np.repeat(g, hop))
duck = np.pad(duck, (0, N - len(duck)), constant_values=duck[-1])
mus_gain = np.full(N, db(-21.0), np.float32)
tfull = np.arange(N) / SR
mus_gain *= np.clip(tfull / 0.06, 0, 1)                            # sem clique no início
mus_gain *= np.where(tfull > END_T0, db(4.0 * np.clip((tfull - END_T0) / 0.4, 0, 1)), 1.0)  # sobe no cartão
fade_out = np.clip((DUR - tfull) / 1.5, 0, 1) ** 1.5
mus = mus * mus_gain * duck * fade_out

mix = voice * db(-1.0) + mus + fx
os.makedirs(P("out"), exist_ok=True)
tmp = P("out", "_mix_raw.wav")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_f32le", tmp],
               input=mix.astype(np.float32).tobytes(), check=True)
# loudnorm em duas passadas
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
js = json.loads(m[m.rfind("{"): m.rfind("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
      f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s24le", P("out", "mix.wav")], check=True)
os.remove(tmp)
print("mix ok:", P("out", "mix.wav"), "entrada I=%s TP=%s" % (js["input_i"], js["input_tp"]))
