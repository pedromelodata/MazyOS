import subprocess, numpy as np, sys, json
from PIL import Image, ImageDraw
take, out, step = sys.argv[1], sys.argv[2], float(sys.argv[3])
info=json.loads(subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height,r_frame_rate","-of","json",take],capture_output=True).stdout)["streams"][0]
w,h=info["width"],info["height"]; a,b=map(int,info["r_frame_rate"].split("/")); fps=a/b
raw=subprocess.run(["ffmpeg","-v","error","-i",take,"-f","rawvideo","-pix_fmt","rgb24","-"],capture_output=True).stdout
F=np.frombuffer(raw,np.uint8).reshape(-1,h,w,3)
idx=[int(round(t*fps)) for t in np.arange(0,len(F)/fps,step)]
tw,th=216,384; cols=10
sheet=Image.new("RGB",(cols*tw,((len(idx)+cols-1)//cols)*(th+20)),(30,30,30)); d=ImageDraw.Draw(sheet)
for k,i in enumerate(idx):
    im=Image.fromarray(F[min(i,len(F)-1)]).resize((tw,th),Image.LANCZOS); x,y=(k%cols)*tw,(k//cols)*(th+20)
    sheet.paste(im,(x,y+20)); d.text((x+4,y+3),f"{i/fps:.1f}s",fill=(255,255,255))
sheet.save(out,quality=88); print(out, len(F),"quadros")
