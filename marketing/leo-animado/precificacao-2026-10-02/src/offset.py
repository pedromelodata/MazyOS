import subprocess, numpy as np, json
SR = 16000
def load(p):
    raw = subprocess.run(["ffmpeg","-v","error","-i",p,"-f","f32le","-ac","1","-ar",str(SR),"-"],capture_output=True,check=True).stdout
    return np.frombuffer(raw,np.float32)
def env(x):  # envelope 10 ms, log
    hop=160; n=len(x)//hop
    e=np.sqrt(np.mean(x[:n*hop].reshape(n,hop)**2,1))+1e-6
    e=np.log(e); return (e-e.mean())/e.std()
res={}
for t in ("T1","T2","T3"):
    a=load(f"takes/{t}.mp4"); r=load(f"vo/ref-{t}.wav")
    ea, er = env(a), env(r)
    n=min(len(ea),len(er)); best=None
    for lag in range(-40,41):   # +-0,4 s em passos de 10 ms
        if lag>=0: c=np.corrcoef(ea[lag:n],er[:n-lag])[0,1]
        else: c=np.corrcoef(ea[:n+lag],er[-lag:n])[0,1]
        if best is None or c>best[1]: best=(lag,c)
    # correlação de forma de onda fina em torno do melhor lag
    lag_s=best[0]*0.01
    rms_a=np.sqrt(np.mean(a**2)); rms_r=np.sqrt(np.mean(r**2))
    res[t]=round(lag_s,3)
    print(t,"atraso do take (s):",lag_s,"corr envelope:",round(best[1],3),"rms take/ref:",round(rms_a/rms_r,2))
json.dump(res,open("takes/offsets_medidos.json","w"),indent=1)
