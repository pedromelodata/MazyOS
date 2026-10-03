import sys, numpy as np, cv2, json
from PIL import Image, ImageDraw
sys.argv=[sys.argv[0]]
import render
res={}
for name in ("T1","T2","T3"):
    rd=render.take_reader(name); F=rd.frames
    hero=np.asarray(Image.open(render.P("hero","hero-1080.png")).convert("L"))
    EY={"E":(437,713),"D":(636,706)}; r=30
    S={k:[] for k in EY}
    for f in F:
        g=cv2.cvtColor(np.ascontiguousarray(f),cv2.COLOR_RGB2GRAY)
        for k,(x,y) in EY.items():
            s=70; m=cv2.matchTemplate(g[y-r-s:y+r+s,x-r-s:x+r+s],hero[y-r:y+r,x-r:x+r],cv2.TM_CCOEFF_NORMED); S[k].append(m.max())
    E,D=np.array(S["E"]),np.array(S["D"]); both=(E<0.55)&(D<0.55)
    ev=[];i=0
    while i<len(both):
        if both[i]:
            j=i
            while j<len(both) and both[j]: j+=1
            if j-i>=2: ev.append((round(i/30,2),j-i))
            i=j
        else: i+=1
    print(name,"piscadas restantes:",ev)
# tira do T3 em volta de duas piscadas removidas
F=render.take_reader("T3").frames
idx=list(range(int(1.05*30),int(1.55*30)))+list(range(int(3.35*30),int(3.95*30)))
tw,th=150,170; cols=16
sh=Image.new("RGB",(cols*tw,((len(idx)+cols-1)//cols)*(th+16)),(30,30,30)); d=ImageDraw.Draw(sh)
for k,i in enumerate(idx):
    x,y=(k%cols)*tw,(k//cols)*(th+16)
    sh.paste(Image.fromarray(F[i][600:1060,310:770]).resize((tw,th),Image.LANCZOS),(x,y+16)); d.text((x+3,y+2),f"{i/30:.2f}",fill=(255,255,255))
sh.save(render.P("qa","T3-olhos-corrigidos.jpg"),quality=90)
