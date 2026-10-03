# Fatias da narração v2 pros takes com gestos: corta no meio da pausa depois de "frente" (24) e "cresceu" (50).
import subprocess, numpy as np, json, math
SR = 48000
W = json.load(open("words-leo2.json", encoding="utf-8"))
raw = subprocess.run(["ffmpeg","-v","error","-i","narr-leo2.wav","-f","f32le","-ac","1","-ar",str(SR),"-"],capture_output=True,check=True).stdout
x = np.frombuffer(raw, np.float32); T = len(x) / SR
hop = 480; n = len(x) // hop
db = 20*np.log10(np.sqrt((x[:n*hop].reshape(n,hop)**2).mean(1))+1e-9)
def cut_after(i):
    a, b = W[i]["e"], W[i+1]["s"]
    # meio da maior região silenciosa entre o fim da palavra i e o começo da i+1 (com folga)
    lo, hi = int((a-0.1)*SR/hop), int((b+0.25)*SR/hop)
    seg = db[lo:hi] < -40
    best=(0,0); k=0
    while k < len(seg):
        if seg[k]:
            j=k
            while j<len(seg) and seg[j]: j+=1
            if j-k>best[1]-best[0]: best=(k,j)
            k=j
        else: k+=1
    return round((lo + (best[0]+best[1])/2) * hop / SR, 3)
c1, c2 = cut_after(24), cut_after(50)
PRE = 0.15
takes = [("T1", 0.0, c1), ("T2", c1, c2), ("T3", c2, T)]
meta = []
for nome, a, b in takes:
    dur = math.ceil(PRE + (b - a) + 0.55)
    seg = x[int(a*SR):int(b*SR)].copy(); r = int(0.008*SR); ramp = np.linspace(0,1,r,dtype=np.float32)
    seg[:r] *= ramp; seg[-r:] *= ramp[::-1]
    out = np.zeros(int(dur*SR), np.float32); out[int(PRE*SR):int(PRE*SR)+len(seg)] = seg
    subprocess.run(["ffmpeg","-y","-v","error","-f","f32le","-ar",str(SR),"-ac","1","-i","-","-c:a","libmp3lame","-b:a","192k",f"ref2-{nome}.mp3"],
                   input=out.tobytes(), check=True)
    meta.append({"take": nome, "ini": a, "fim": round(b,3), "pre": PRE, "dur_pedida": dur, "pos_roll": round(dur-PRE-(b-a),3)})
json.dump(meta, open("takes2.json","w"), indent=1)
for m in meta: print(m)
