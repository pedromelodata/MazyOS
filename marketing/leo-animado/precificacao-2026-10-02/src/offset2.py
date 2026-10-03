# Atraso exato do take (o áudio dele é a própria referência): correlação cruzada da forma de onda.
import subprocess, numpy as np, json, sys, os
SR=16000
def load(p):
    raw=subprocess.run(["ffmpeg","-v","error","-i",p,"-f","f32le","-ac","1","-ar",str(SR),"-"],capture_output=True,check=True).stdout
    return np.frombuffer(raw,np.float32)
out = json.load(open("takes/offsets.json")) if os.path.exists("takes/offsets.json") else {}
for t in sys.argv[1:]:
    a=load(f"takes/{t}.mp4"); r=load(f"vo/ref3-{t}.mp3" if t=="T4" else f"vo/ref2-{t}.mp3")
    n=1<<int(np.ceil(np.log2(len(a)+len(r))))
    c=np.fft.irfft(np.fft.rfft(a,n)*np.conj(np.fft.rfft(r,n)),n)
    lag=int(np.argmax(c)); lag = lag-n if lag>n//2 else lag
    peak=c.max()/(np.linalg.norm(a)*np.linalg.norm(r)+1e-9)
    out[t]=round(lag/SR,4)
    print(f"{t}: áudio do take atrasado {lag/SR*1000:.1f} ms em relação à referência (pico normalizado {peak:.2f})")
json.dump(out,open("takes/offsets.json","w"),indent=1)
