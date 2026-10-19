"""Folha de quadros em tempos escolhidos, de um ou mais vídeos.

Uso: python -I folha_tempos.py SAIDA.jpg COLUNAS LARGURA "video.mp4:t1,t2,t3" ["outro.mp4:t1,t2"] [--recorte=x0,y0,x1,y1]
O recorte é em fração do quadro (0 a 1) e vale pra todos.
"""
import io
import os
import subprocess
import sys

from PIL import Image, ImageDraw

saida, cols, larg = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
rec = None
itens = []
for a in sys.argv[4:]:
    if a.startswith("--recorte="):
        rec = [float(x) for x in a.split("=", 1)[1].split(",")]
        continue
    v, ts = a.rsplit(":", 1)
    itens += [(v, float(t)) for t in ts.split(",")]
ims = []
for v, t in itens:
    r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", v, "-frames:v", "1", "-f", "image2pipe",
                        "-vcodec", "png", "-"], capture_output=True)
    if not r.stdout:
        print("falhou", v, t, r.stderr.decode(errors="replace")[:300])
        continue
    im = Image.open(io.BytesIO(r.stdout)).convert("RGB")
    if rec:
        W, H = im.size
        im = im.crop((int(rec[0] * W), int(rec[1] * H), int(rec[2] * W), int(rec[3] * H)))
    im = im.resize((larg, int(larg * im.height / im.width)), Image.LANCZOS)
    ImageDraw.Draw(im).text((6, 4), f"{os.path.basename(v)} {t:.2f}s", fill=(255, 0, 0))
    ims.append(im)
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
s = Image.new("RGB", (w * cols, h * rows), "white")
for i, im in enumerate(ims):
    s.paste(im, ((i % cols) * w, (i // cols) * h))
s.save(saida, quality=86)
print("ok", saida, len(ims), "quadros")
