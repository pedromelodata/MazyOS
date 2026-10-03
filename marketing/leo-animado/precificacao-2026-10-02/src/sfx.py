# Efeitos sintetizados (numpy) dos mixes: os mesmos timbres do mix2.py + campainha, trava e chicote.
import numpy as np

SR = 48000
rng = np.random.default_rng(11)

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

def s_ring(d=0.7, f=2350):
    # campainha de despertador: martelo alternando entre dois sinos (~26 batidas/s)
    t = tt(d); y = np.zeros(len(t), np.float32)
    step = int(SR / 26)
    for k, o in enumerate(range(0, len(t) - 1, step)):
        ff = f if k % 2 == 0 else f * 1.19
        n = min(len(t) - o, int(0.09 * SR)); tk = np.arange(n) / SR
        y[o:o + n] += (np.sin(2 * np.pi * ff * tk) + 0.4 * np.sin(2 * np.pi * ff * 2.7 * tk)) * np.exp(-tk * 38)
    return fade_in(y * np.exp(-t * 2.2).astype(np.float32), 2)

def s_clack():
    # trava fechando: estalo metálico curto + corpo grave
    a = s_tick(4200) * 1.0; b = s_thump(260, 120, 0.12) * 0.6
    y = np.zeros(int(0.14 * SR), np.float32); y[:len(a)] += a; y[:len(b)] += b[: len(y)]
    return y

def s_swish(d=0.26):
    return s_whoosh(d, 900, 9000)

class Track:
    def __init__(self, dur):
        self.N = int(round(dur * SR)); self.x = np.zeros(self.N, np.float32)
    def place(self, sig, t, gain_db):
        i = int(round(t * SR))
        if i >= self.N: return
        if i < 0: sig = sig[-i:]; i = 0
        j = min(self.N, i + len(sig)); self.x[i:j] += pk(sig)[: j - i] * db(gain_db)
