# Mix da v2 (Remotion): narração + trilha que abaixa sob a voz + efeitos nos tempos do timeline.py.
#   python mix2.py  -> remotion/public/mix.wav (48 kHz, -14 LUFS, pico -1,5 dBTP)
import json, os, subprocess
import numpy as np
import timeline as TLm
from timeline import T, P, NARR, END_T0, DUR, LAYOUTS

SR = 48000
N = int(round(DUR * SR))
rng = np.random.default_rng(11)
REPO = os.path.abspath(os.path.join(P(), "..", "..", ".."))

def load(path, start=0.0, dur=None):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-i", path]
    if dur: cmd += ["-t", f"{dur:.3f}"]
    cmd += ["-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()

db = lambda g: 10 ** (g / 20)
tt = lambda d: np.arange(int(d * SR)) / SR
pk = lambda y: (y / (np.abs(y).max() + 1e-9)).astype(np.float32)

def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    w = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * w, len(x)).astype(np.float32)

def fade_in(y, ms=2):
    n = max(1, int(ms / 1000 * SR)); y[:n] *= np.linspace(0, 1, n); return y

def s_pop(f0=950, f1=330, d=0.10, k=36):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 45)
    return fade_in((np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * k)).astype(np.float32))

def s_bubble(): return s_pop(1500, 720, 0.08, 45)

def s_tick(f=3300):
    t = tt(0.035)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 260) + 0.35 * rng.standard_normal(len(t)) * np.exp(-t * 600)
    return fade_in(y.astype(np.float32), 0.5)

def s_chime(f=1318.5, d=0.9):
    t = tt(d)
    y = (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) + 0.18 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 5.5)
    return fade_in(y.astype(np.float32), 4)

def s_check():
    a = s_chime(1046.5, 0.5); b = s_chime(1568.0, 0.6)
    y = np.zeros(int(0.7 * SR), np.float32); y[:len(a)] += a
    o = int(0.075 * SR); y[o:o + len(b)] += b[: len(y) - o]
    return y

def s_whoosh(d=0.38, lo=500, hi=6000):
    n = int(d * SR); x = rng.standard_normal(n).astype(np.float32)
    a = band(x, lo, hi * 0.35); b = band(x, lo * 2.5, hi)
    k = np.linspace(0, 1, n) ** 1.3
    env = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return (a * (1 - k) + b * k) * env

def s_riser(d=0.8, f0=380, f1=1150):
    t = tt(d); f = f0 + (f1 - f0) * (t / d) ** 1.6
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / d) ** 1.5 * np.exp(-np.maximum(0, t - d * 0.85) * 40)
    nz = band(rng.standard_normal(len(t)).astype(np.float32), 1500, 7000) * (t / d) ** 2 * 0.25
    return fade_in((y * 0.55 + nz).astype(np.float32), 10)

def s_thump(f0=140, f1=55, d=0.32):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 30)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)
    # corpo audível em celular: harmônico + clique
    y += 0.35 * np.sin(4 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16)
    y[: int(0.004 * SR)] += 0.4 * rng.standard_normal(int(0.004 * SR))
    return fade_in(y.astype(np.float32), 1)

def s_roll(n=12, span=0.5):
    y = np.zeros(int((span + 0.06) * SR), np.float32)
    for k in range(n):
        o = int(k * span / n * SR); tk = s_tick(2600 + 90 * k) * (0.6 + 0.4 * k / n)
        y[o:o + len(tk)] += tk[: len(y) - o]
    return y

def s_burst(n=9, span=0.35):
    y = np.zeros(int((span + 0.12) * SR), np.float32)
    for k in range(n):
        o = int(rng.uniform(0, span) * SR); b = s_pop(rng.uniform(1300, 2300), rng.uniform(600, 900), 0.07, 50) * rng.uniform(0.4, 1)
        y[o:o + len(b)] += b[: len(y) - o]
    return y

fx = np.zeros(N, np.float32)
def place(sig, t, gain_db):
    i = int(round(t * SR))
    if i >= N: return
    i = max(i, 0); j = min(N, i + len(sig)); fx[i:j] += pk(sig)[: j - i] * db(gain_db)

# abertura: pancada + "3"
place(s_thump(), 0.0, -17)
place(s_pop(700, 220, 0.16, 20), T(0) - 0.01, -21)
place(s_pop(1100, 420), T(1), -27)
place(s_thump(120, 60, 0.25), T(9), -22)                       # tremida no "caro"
# numerais gigantes
for i in (10, 17, 25):
    place(s_whoosh(0.34, 400, 5000), T(i) - 0.30, -29)
    place(s_pop(620, 240, 0.16, 22), T(i) - 0.10, -21)
# sinal 1
for i in (11, 12, 13): place(s_bubble(), T(i) - 0.02, -26)
place(s_pop(1300, 600, 0.09, 40), T(16) - 0.02, -25)
# sinal 2
place(s_whoosh(0.28, 700, 7000), T(19) - 0.16, -32)
place(s_roll(12, 0.48), T(21) - 0.05, -30)
for i in (22, 24): place(s_pop(800, 380, 0.1, 34), T(i) - 0.04, -27)
# sinal 3
place(s_whoosh(0.30, 400, 5000), T(27) - 0.14, -30)
for i in (32, 33, 34): place(s_tick(2900), T(i) - 0.04, -24)
# bateu dois / reajustar
for k in range(3): place(s_bubble(), T(35) + 0.05 * k, -30)
place(s_check(), T(36), -24)
place(s_riser(0.5, 500, 1500), T(41) - 0.12, -28)
place(s_thump(130, 55, 0.3), T(41), -22)
# cresceu: raios + confete
place(s_whoosh(0.45, 300, 5000), T(42) - 0.35, -30)
place(s_riser(0.55, 420, 1300), T(50) - 0.30, -30)
place(s_burst(10, 0.35), T(50) - 0.02, -25)
place(s_chime(1568.0, 1.0), T(50), -31)
place(s_thump(130, 55, 0.3), T(50), -23)
# app + teto
place(s_whoosh(0.42, 350, 6000), T(52) - 0.14, -27)
place(s_pop(1000, 420), T(60) - 0.06, -25)
place(s_riser(0.9, 300, 900), T(62) - 0.03, -34)
place(s_pop(1000, 420), T(66) - 0.04, -24)
# CTA
place(s_thump(120, 55, 0.28), T(70) - 0.3, -24)
for k in range(3): place(s_bubble(), T(74) + 0.09 * k, -27)
# trocas de layout
for ts, name in LAYOUTS[1:]:
    place(s_whoosh(0.45, 300, 4500), ts - 0.4, -36)
# fim: marca
place(s_chime(1318.5, 1.1), END_T0 + 0.15, -25)
place(s_chime(1975.5, 0.9), END_T0 + 0.22, -33)

# narração
vo = load(NARR)
voice = np.zeros(N, np.float32); voice[: min(N, len(vo))] = vo[:N]
# trilha: virada de bateria em 10,36 s; groove cai no "sinais"
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
gain = np.full(N, db(-20.0), np.float32) * np.clip(tf / 0.05, 0, 1)
gain *= np.where(tf > END_T0, db(3.0 * np.clip((tf - END_T0) / 0.3, 0, 1)), 1.0)
gain *= np.clip((DUR - tf) / 0.9, 0, 1) ** 1.3
mix = voice * db(-1.0) + mus * gain * duck + fx

out = P("remotion", "public", "mix.wav")
tmp = P("out", "_mix2_raw.wav"); os.makedirs(P("out"), exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_f32le", tmp],
               input=mix.astype(np.float32).tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
js = json.loads(m[m.rfind("{"): m.rfind("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
      f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", out], check=True)
os.remove(tmp)
print("mix2 ok:", out, "entrada I=%s" % js["input_i"])
