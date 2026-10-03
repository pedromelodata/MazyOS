import subprocess, numpy as np, json
SR = 48000
raw = subprocess.run(["ffmpeg","-v","error","-i","narr-leo.wav","-f","f32le","-ac","1","-ar",str(SR),"-"],capture_output=True,check=True).stdout
x = np.frombuffer(raw,np.float32)
T = len(x)/SR
PRE = 0.15
takes = [  # (inicio, fim) na linha do tempo da narração, cortes no meio das pausas; duração pedida
    ("T1", 0.0, 9.00, 10),
    ("T2", 9.00, 17.65, 10),
    ("T3", 17.65, T, 9),
]
meta = []
for nome, a, b, dur in takes:
    seg = x[int(a*SR):int(b*SR)].copy()
    n8 = int(0.008*SR); ramp = np.linspace(0,1,n8,dtype=np.float32)
    seg[:n8] *= ramp; seg[-n8:] *= ramp[::-1]
    total = int(dur*SR)
    out = np.zeros(total, np.float32)
    out[int(PRE*SR):int(PRE*SR)+len(seg)] = seg
    subprocess.run(["ffmpeg","-y","-f","f32le","-ar",str(SR),"-ac","1","-i","-","-c:a","pcm_s16le",f"ref-{nome}.wav"],
                   input=out.tobytes(),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
    meta.append({"take":nome,"ini":a,"fim":round(b,3),"pre":PRE,"dur_pedida":dur,"pos_roll":round(dur-PRE-(b-a),3)})
json.dump(meta,open("takes.json","w"),indent=1)
for m in meta: print(m)
