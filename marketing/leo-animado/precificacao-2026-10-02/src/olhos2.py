# Piscadela = um olho perde a semelhança com o olho aberto do herói e o outro não.
import subprocess, numpy as np, cv2, sys, json
from PIL import Image
def frames(p):
    raw=subprocess.run(["ffmpeg","-v","error","-i",p,"-f","rawvideo","-pix_fmt","gray","-"],capture_output=True,check=True).stdout
    return np.frombuffer(raw,np.uint8).reshape(-1,1920,1080)
hero=np.asarray(Image.open("hero/hero-1080.png").convert("L"))
EYES={"E":(437,713),"D":(636,706)}; r=30
tpls={k:hero[y-r:y+r,x-r:x+r] for k,(x,y) in EYES.items()}
res={}
for t in sys.argv[1:]:
    F=frames(f"takes/{t}.mp4"); S={"E":[],"D":[]}
    for f in F:
        for k,(x,y) in EYES.items():
            s=70; win=f[y-r-s:y+r+s, x-r-s:x+r+s]
            m=cv2.matchTemplate(win,tpls[k],cv2.TM_CCOEFF_NORMED); S[k].append(float(m.max()))
    E=np.array(S["E"]); D=np.array(S["D"])
    thr_lo, thr_hi = 0.55, 0.70
    wink=((E<thr_lo)&(D>thr_hi))|((D<thr_lo)&(E>thr_hi)); both=(E<thr_lo)&(D<thr_lo)
    def runs(m):
        out=[];i=0
        while i<len(m):
            if m[i]:
                j=i
                while j<len(m) and m[j]: j+=1
                if j-i>=2: out.append((round(i/30,2),j-i))
                i=j
            else: i+=1
        return out
    res[t]={"wink":runs(wink),"both":runs(both)}
    print(f"{t}: piscadelas (1 olho): {runs(wink)} | piscadas (2 olhos): {runs(both)} | semelhança mediana E {np.median(E):.2f} D {np.median(D):.2f}")
json.dump(res,open("takes/olhos.json","w"))
