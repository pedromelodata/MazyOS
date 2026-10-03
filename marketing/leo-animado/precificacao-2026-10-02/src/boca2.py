# Abertura da boca x narração, pra takes de qualquer resolução/fps.
import subprocess, numpy as np, json, cv2, sys
from PIL import Image
take = sys.argv[1]; ref = sys.argv[2]
info = json.loads(subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height,r_frame_rate","-of","json",take],capture_output=True).stdout)["streams"][0]
w, h = info["width"], info["height"]; a,b = map(int, info["r_frame_rate"].split("/")); fps = a/b
raw = subprocess.run(["ffmpeg","-v","error","-i",take,"-f","rawvideo","-pix_fmt","gray","-"],capture_output=True,check=True).stdout
F = np.frombuffer(raw,np.uint8).reshape(-1,h,w)
k = w/720
hero = np.asarray(Image.open("hero/hero-1080.png").convert("L").resize((w,h),Image.LANCZOS))
ny, nx = int(545*k), int(347*k)
roi = hero[ny-int(60*k):ny+int(60*k), nx-int(60*k):nx+int(60*k)].astype(np.float32)
yy, xx = np.unravel_index(np.argmin(cv2.GaussianBlur(roi,(15,15),0)), roi.shape)
ny, nx = ny-int(60*k)+yy, nx-int(60*k)+xx
th, tw = int(28*k), int(40*k)
tpl = hero[ny-th:ny+th, nx-tw:nx+tw]
op=[]; conf=[]
for f in F:
    s=int(120*k); win=f[ny-s:ny+s, nx-s:nx+s]
    r=cv2.matchTemplate(win,tpl,cv2.TM_CCOEFF_NORMED); _,c,_,loc=cv2.minMaxLoc(r)
    cy,cx=ny-s+loc[1]+th, nx-s+loc[0]+tw; conf.append(c)
    m=f[cy+int(30*k):cy+int(95*k), cx-int(55*k):cx+int(55*k)].astype(np.float32)
    op.append(float((m<70).mean()))
op=np.array(op)
rawa=subprocess.run(["ffmpeg","-v","error","-i",ref,"-f","f32le","-ac","1","-ar","48000","-"],capture_output=True).stdout
x=np.frombuffer(rawa,np.float32); hop=int(48000/fps); n=len(x)//hop
env=np.sqrt((x[:n*hop].reshape(n,hop)**2).mean(1)); env=np.convolve(env,np.ones(3)/3,"same")
n=min(len(op),len(env)); A=(op[:n]-op[:n].mean())/op[:n].std(); best=None
for lag in range(-10,11):
    c=np.corrcoef(A[lag:n],env[:n-lag])[0,1] if lag>=0 else np.corrcoef(A[:n+lag],env[-lag:n])[0,1]
    if best is None or c>best[1]: best=(lag,c)
print(f"{take}: {w}x{h}@{fps:.0f} | boca x narração: lag {best[0]} quadros ({best[0]/fps*1000:.0f} ms) corr {best[1]:.2f} | rastreio conf min {min(conf):.2f}")
