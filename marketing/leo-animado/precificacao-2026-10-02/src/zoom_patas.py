# Amplia a faixa das patas em quadros escolhidos (resolução total, 2x) pra contar dedos.
import subprocess, sys, numpy as np
from PIL import Image, ImageDraw
take, out = sys.argv[1], sys.argv[2]; qs = [int(q) for q in sys.argv[3].split(",")]
raw = subprocess.run(["ffmpeg","-v","error","-i",take,"-f","rawvideo","-pix_fmt","rgb24","-"],capture_output=True).stdout
F = np.frombuffer(raw,np.uint8).reshape(-1,1280,720,3)
tiles=[]
for q in qs:
    fr = F[min(q,len(F)-1)][640:1080]            # faixa das mãos
    im = Image.fromarray(fr).resize((720*2//2*1, 440), Image.LANCZOS)
    d = ImageDraw.Draw(im); d.rectangle((0,0,70,22), fill=(0,0,0)); d.text((4,4), f"q{q}", fill=(255,255,255))
    tiles.append(im)
cols=2; W,H=tiles[0].size
sheet=Image.new("RGB",(cols*W,((len(tiles)+cols-1)//cols)*H),(30,30,30))
for k,t in enumerate(tiles): sheet.paste(t,((k%cols)*W,(k//cols)*H))
sheet.save(out,quality=92); print(out)
