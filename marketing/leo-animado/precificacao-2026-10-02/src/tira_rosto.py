# Tira do rosto a cada 2 quadros num trecho, com a palavra da narração que soa em cada quadro.
import subprocess, numpy as np, json, sys
from PIL import Image, ImageDraw, ImageFont
take, ref_words, a, b, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
raw=subprocess.run(["ffmpeg","-v","error","-i",take,"-f","rawvideo","-pix_fmt","rgb24","-"],capture_output=True).stdout
F=np.frombuffer(raw,np.uint8).reshape(-1,1920,1080,3)
W=json.load(open(ref_words,encoding="utf-8"))
def word_at(t):
    for w in W:
        if w["s"]-0.02<=t<=w["e"]: return w["w"]
    return "·"
idx=list(range(int(a*30),int(b*30),2)); tw,th=170,190; cols=12
sh=Image.new("RGB",(cols*tw,((len(idx)+cols-1)//cols)*(th+36)),(30,30,30)); d=ImageDraw.Draw(sh)
f=ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf",15)
for k,i in enumerate(idx):
    face=Image.fromarray(F[i][600:1060,310:770]).resize((tw,th),Image.LANCZOS)
    x,y=(k%cols)*tw,(k//cols)*(th+36); sh.paste(face,(x,y+36))
    d.text((x+3,y+2),f"{i/30:.2f}s",fill=(200,200,200),font=f); d.text((x+3,y+18),word_at(i/30),fill=(255,220,120),font=f)
sh.save(out,quality=90)
