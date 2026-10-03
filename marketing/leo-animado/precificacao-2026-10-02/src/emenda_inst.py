# Narração das versões sem o Léo: narr-leo3.wav com a frase do app em voz institucional
# ("a gente fica de olho") no lugar de "eu fico de olho" -> narr-inst.wav
import subprocess, json
import numpy as np
SR = 48000
def load(p):
    raw = subprocess.run(["ffmpeg","-v","error","-i",p,"-f","f32le","-ac","1","-ar",str(SR),"-"],capture_output=True,check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def env(x):
    hop = 480; n = len(x)//hop
    return 20*np.log10(np.sqrt((x[:n*hop].reshape(n,hop)**2).mean(1))+1e-9), hop
def meio_da_pausa(x, W, i):
    d, hop = env(x); a, b = W[i]["e"], W[i+1]["s"]
    lo, hi = int((a-0.1)*SR/hop), int((b+0.25)*SR/hop)
    seg = d[lo:hi] < -40; best=(0,0); k=0
    while k < len(seg):
        if seg[k]:
            j=k
            while j<len(seg) and seg[j]: j+=1
            if j-k > best[1]-best[0]: best=(k,j)
            k=j
        else: k+=1
    s0, s1 = (lo+best[0])*hop/SR, (lo+best[1])*hop/SR
    return s0, s1
W = json.load(open("words-leo3.json", encoding="utf-8"))
x = load("narr-leo3.wav")
a0, a1 = meio_da_pausa(x, W, 50)   # depois de "cresceu"
b0, b1 = meio_da_pausa(x, W, 69)   # antes de "Comenta"
ca, cb = (a0 + a1) / 2, (b0 + b1) / 2
print(f"troca de {ca:.2f} a {cb:.2f} s")
c = load("app-inst-dylan.wav")
d, hop = env(c); on = np.where(d > -40)[0]
c = c[on[0]*hop: (on[-1]+1)*hop]
old = x[int(W[51]["s"]*SR):int(W[69]["e"]*SR)]
rms = lambda v: np.sqrt(np.mean(v[np.abs(v) > 1e-3]**2))
c *= rms(old) / max(rms(c), 1e-9)
r = int(0.006*SR); c[:r] *= np.linspace(0,1,r); c[-r:] *= np.linspace(1,0,r)
y = np.concatenate([x[:int(ca*SR)], np.zeros(int((a1-ca)*SR), np.float32), c,
                    np.zeros(int((cb-b0)*SR), np.float32), x[int(cb*SR):]])
subprocess.run(["ffmpeg","-y","-v","error","-f","f32le","-ar",str(SR),"-ac","1","-i","-","-c:a","pcm_s24le","narr-inst.wav"],
               input=y.astype(np.float32).tobytes(), check=True)
print(f"narr-inst.wav: {len(y)/SR:.2f} s (Léo: {len(x)/SR:.2f} s)")
