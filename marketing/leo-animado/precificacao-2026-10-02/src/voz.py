# Voz do Léo: clone Pedro-Legalizai alterado (F0 +2,5 st, formantes +1,25 st), pausas enxutas.
import subprocess, numpy as np, json, sys
SR = 48000
def run(cmd): subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
k = 2 ** (1.25 / 12)
# 1) mono + pitch com formante preservado (+1,25 st); 2) asetrate (+1,25 st em F0 e formantes), tempo compensado
run(["ffmpeg", "-y", "-i", "narr-pedro-raw.wav", "-ac", "1", "-af",
     f"rubberband=pitch={k:.6f}:formant=preserved:pitchq=quality:window=standard,"
     f"asetrate={SR*k:.3f},aresample={SR}:resampler=soxr,atempo={1/k:.6f},"
     "highpass=f=70,equalizer=f=3400:t=q:w=1.1:g=1.8,acompressor=threshold=-20dB:ratio=2.2:attack=8:release=120",
     "-ar", str(SR), "narr-leo-full.wav"])
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
x = load("narr-leo-full.wav")
# pausas: envelope RMS 10 ms
hop = 480; n = len(x) // hop
rms = np.sqrt(np.mean(x[:n*hop].reshape(n, hop) ** 2, 1) + 1e-12); db = 20*np.log10(rms)
sil = db < -40
runs = []; i = 0
while i < n:
    if sil[i]:
        j = i
        while j < n and sil[j]: j += 1
        runs.append((i, j)); i = j
    else: i += 1
MAXP = 0.36  # pausa máxima entre frases (s)
keep = np.ones(len(x), bool); cortes = []
for a, b in runs:
    dur = (b - a) * hop / SR
    if a == 0 or b >= n:  # silêncio de borda: deixa 0,12 s
        lim = 0.12
    else:
        lim = MAXP
    if dur > lim:
        excess = int((dur - lim) * SR)
        mid = (a * hop + b * hop) // 2
        s0 = mid - excess // 2
        keep[s0:s0 + excess] = False
        cortes.append((round(a*hop/SR, 3), round(dur, 3), round(excess/SR, 3)))
y = x[keep]
# micro-fades nas emendas (5 ms) pra não estalar
idx = np.where(np.diff(keep.astype(int)) != 0)[0]
y = y.astype(np.float32)
open_ = subprocess.run(["ffmpeg", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s24le", "narr-leo.wav"],
                       input=y.tobytes(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
json.dump(cortes, open("pausas-cortadas.json", "w"))
print("antes %.2fs depois %.2fs; cortes: %d" % (len(x)/SR, len(y)/SR, len(cortes)))
# F0 mediana (autocorrelação simples em trechos vozeados)
def f0(sig):
    fr = 2048; out = []
    for s in range(0, len(sig) - fr, 1024):
        w = sig[s:s+fr] * np.hanning(fr)
        if np.sqrt(np.mean(w**2)) < 0.02: continue
        ac = np.correlate(w, w, "full")[fr-1:]
        lo, hi = int(SR/400), int(SR/70)
        p = lo + np.argmax(ac[lo:hi])
        if ac[p] > 0.3 * ac[0]: out.append(SR / p)
    return np.median(out)
o = load("narr-pedro-raw.wav")
print("F0 mediana: pedro %.1f Hz -> leo %.1f Hz (%.2f st)" % (f0(o), f0(x), 12*np.log2(f0(x)/f0(o))))
