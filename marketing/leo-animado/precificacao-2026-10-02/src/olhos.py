# Detector de piscadela: abertura de cada olho (fração de pixels claros dentro da lente), rastreando o focinho.
import subprocess, numpy as np, cv2, sys, json
from PIL import Image
def frames(p):
    raw=subprocess.run(["ffmpeg","-v","error","-i",p,"-f","rawvideo","-pix_fmt","gray","-"],capture_output=True,check=True).stdout
    return np.frombuffer(raw,np.uint8).reshape(-1,1920,1080)
hero=np.asarray(Image.open("hero/hero-1080.png").convert("L"))
# focinho (ponto mais escuro na região central do rosto do herói)
reg=cv2.GaussianBlur(hero[760:960,420:660].astype(np.float32),(21,21),0)
yy,xx=np.unravel_index(np.argmin(reg),reg.shape); NY,NX=760+yy,420+xx
tpl=hero[NY-40:NY+40,NX-60:NX+60]
res={}
for t in sys.argv[1:]:
    F=frames(f"takes/{t}.mp4"); L=[];R=[]
    for f in F:
        s=160; win=f[NY-s:NY+s,NX-s:NX+s]
        r=cv2.matchTemplate(win,tpl,cv2.TM_CCOEFF_NORMED); _,_,_,loc=cv2.minMaxLoc(r)
        cy,cx=NY-s+loc[1]+40, NX-s+loc[0]+60
        for arr,dx in ((L,-108),(R,108)):
            ex,ey=cx+dx,cy-112
            roi=f[ey-34:ey+34, ex-40:ex+40]
            arr.append(float((roi>150).mean()))
    L=np.array(L);R=np.array(R); mL,mR=np.median(L),np.median(R)
    wl=(L<0.4*mL)&(R>0.6*mR); wr=(R<0.4*mR)&(L>0.6*mL); bl=(L<0.4*mL)&(R<0.4*mR)
    def runs(m):
        out=[];i=0
        while i<len(m):
            if m[i]:
                j=i
                while j<len(m) and m[j]: j+=1
                out.append((round(i/30,2),j-i)); i=j
            else: i+=1
        return out
    res[t]={"wink_L":runs(wl),"wink_R":runs(wr),"blink":runs(bl)}
    print(t,"piscadelas olho esq:",runs(wl),"| olho dir:",runs(wr),"| piscadas duplas:",runs(bl), f"| med abertura {mL:.3f}/{mR:.3f}")
json.dump(res,open("takes/olhos.json","w"))
