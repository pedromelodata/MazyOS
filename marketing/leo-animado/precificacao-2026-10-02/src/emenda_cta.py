# Troca o CTA falado: narr-leo2.wav até a pausa antes do "Comenta" + CTA novo (voz do Léo) -> narr-leo3.wav.
# Também gera a fatia de referência do take novo do CTA (ref3-T4.mp3) e o takes.json com 4 takes.
import subprocess, json, math
import numpy as np
SR = 48000
def load(p):
    raw = subprocess.run(["ffmpeg","-v","error","-i",p,"-f","f32le","-ac","1","-ar",str(SR),"-"],capture_output=True,check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def save(x, p, codec=("-c:a","pcm_s24le")):
    subprocess.run(["ffmpeg","-y","-v","error","-f","f32le","-ar",str(SR),"-ac","1","-i","-",*codec,p], input=x.astype(np.float32).tobytes(), check=True)
def db_env(x):
    hop = 480; n = len(x)//hop
    return 20*np.log10(np.sqrt((x[:n*hop].reshape(n,hop)**2).mean(1))+1e-9), hop

W = json.load(open("words-leo2.json", encoding="utf-8"))
x = load("narr-leo2.wav")
# corte: meio do silêncio entre "ano" (69) e "Comenta" (70)
d, hop = db_env(x)
a, b = W[69]["e"], W[70]["s"]
lo, hi = int((a - 0.1) * SR / hop), int((b + 0.25) * SR / hop)
seg = d[lo:hi] < -40; best = (0, 0); k = 0
while k < len(seg):
    if seg[k]:
        j = k
        while j < len(seg) and seg[j]: j += 1
        if j - k > best[1] - best[0]: best = (k, j)
        k = j
    else: k += 1
sil_ini, sil_fim = (lo + best[0]) * hop / SR, (lo + best[1]) * hop / SR
cut = round((sil_ini + sil_fim) / 2, 3)
meia_pausa = cut - sil_ini
print(f"pausa antes do CTA: {sil_ini:.2f} a {sil_fim:.2f} s; corte em {cut:.3f} s")

# CTA novo: tira o silêncio da ponta, casa o volume com o CTA antigo
c = load("cta-dylan.wav")
dc, _ = db_env(c)
on = np.where(dc > -40)[0]; c0, c1 = on[0] * hop / SR, (on[-1] + 1) * hop / SR
c = c[int(c0 * SR):int(c1 * SR)]
old = x[int(W[70]["s"] * SR):]
rms = lambda v: np.sqrt(np.mean(v[np.abs(v) > 1e-3] ** 2))
c *= rms(old) / max(rms(c), 1e-9)
r = int(0.006 * SR); c[:r] *= np.linspace(0, 1, r); c[-r:] *= np.linspace(1, 0, r)

y = np.concatenate([x[:int(cut * SR)], np.zeros(int(meia_pausa * SR), np.float32), c, np.zeros(int(0.30 * SR), np.float32)])
save(y, "narr-leo3.wav")
T = len(y) / SR
print(f"narração nova: {T:.2f} s (antes {len(x)/SR:.2f} s)")

# fatia do take do CTA: do corte até o fim, com 0,15 s antes
PRE = 0.15
dur = math.ceil(PRE + (T - cut) + 0.5)
ref = np.zeros(int(dur * SR), np.float32); s4 = y[int(cut * SR):]
ref[int(PRE * SR):int(PRE * SR) + len(s4)] = s4
save(ref, "ref3-T4.mp3", ("-c:a", "libmp3lame", "-b:a", "192k"))
takes = json.load(open("takes2.json"))
takes[2]["fim"] = cut
takes.append({"take": "T4", "ini": cut, "fim": round(T, 3), "pre": PRE, "dur_pedida": dur, "pos_roll": round(dur - PRE - (T - cut), 3)})
json.dump(takes, open("takes.json", "w"), indent=1)
for t in takes: print(t)
