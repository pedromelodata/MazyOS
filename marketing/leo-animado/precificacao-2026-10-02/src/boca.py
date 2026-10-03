# Mede abertura da boca por quadro (rastreando o focinho) e compara com os envelopes de áudio.
import subprocess, numpy as np, json, cv2, sys
from PIL import Image
def frames(p):
    raw = subprocess.run(["ffmpeg","-v","error","-i",p,"-f","rawvideo","-pix_fmt","gray","-"],capture_output=True,check=True).stdout
    return np.frombuffer(raw,np.uint8).reshape(-1,1280,720)
def aenv(p, fps=24):
    raw = subprocess.run(["ffmpeg","-v","error","-i",p,"-f","f32le","-ac","1","-ar","48000","-"],capture_output=True,check=True).stdout
    x = np.frombuffer(raw,np.float32); hop = 48000//fps; n=len(x)//hop
    return np.sqrt(np.mean(x[:n*hop].reshape(n,hop)**2,1))
hero = np.asarray(Image.open("hero/hero-1080.png").convert("L").resize((720,1280),Image.LANCZOS))
# focinho no herói: procura a região mais escura no terço central do rosto
roi = hero[480:640, 280:440].astype(np.float32)
yy, xx = np.unravel_index(np.argmin(cv2.GaussianBlur(roi,(15,15),0)), roi.shape)
ny, nx = 480+yy, 280+xx
tpl = hero[ny-28:ny+28, nx-40:nx+40]
print("focinho no herói:", nx, ny)
out = {}
for t in ("T1","T2","T3"):
    F = frames(f"takes/{t}.mp4")
    op = []; pos=[]
    for f in F:
        sy0, sx0 = ny-120, nx-120
        win = f[sy0:ny+120, sx0:nx+120]
        r = cv2.matchTemplate(win, tpl, cv2.TM_CCOEFF_NORMED)
        _, conf, _, loc = cv2.minMaxLoc(r)
        cy, cx = sy0+loc[1]+28, sx0+loc[0]+40
        pos.append((cx,cy,conf))
        m = f[cy+30:cy+95, cx-55:cx+55].astype(np.float32)
        op.append(float((m < 70).mean()))
    op = np.array(op)
    ref = aenv(f"vo/ref-{t}.wav"); tak = aenv(f"takes/{t}-audio.wav")
    def best(sig):
        n=min(len(op),len(sig)); a=(op[:n]-op[:n].mean())/op[:n].std(); res=None
        for lag in range(-8,9):
            if lag>=0: c=np.corrcoef(a[lag:n], sig[:n-lag])[0,1]
            else: c=np.corrcoef(a[:n+lag], sig[-lag:n])[0,1]
            if res is None or c>res[1]: res=(lag,c)
        return res
    s = lambda v: np.convolve(v, np.ones(3)/3, "same")
    br, bt = best(s(ref)), best(s(tak))
    confs = np.array([p[2] for p in pos])
    print(f"{t}: boca x narração nossa: lag {br[0]} quadros corr {br[1]:.2f} | boca x áudio do take: lag {bt[0]} corr {bt[1]:.2f} | rastreio conf min {confs.min():.2f} med {np.median(confs):.2f}")
    out[t] = {"lag_ref_q": int(br[0]), "corr_ref": round(float(br[1]),3), "corr_take": round(float(bt[1]),3),
              "open": [round(v,4) for v in op], "pos": [[int(a),int(b)] for a,b,_ in pos]}
json.dump(out, open("takes/boca.json","w"))
