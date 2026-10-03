"""Folha de contato antes x depois: por quadro, o still de antes, o de depois e o mapa da diferença (x40), em miniatura,
com o número do quadro e a diferença máxima. Uso: folha_par.py <dir_antes> <dir_depois> <saida.jpg> q1,q2,... [rotulo]"""
import os, sys
sys.dont_write_bytecode = True
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/lib")
import escrita, io

da, dd, saida = sys.argv[1], sys.argv[2], sys.argv[3]
qs = [int(x) for x in sys.argv[4].split(",")]
rot = sys.argv[5] if len(sys.argv) > 5 else ""
W, H = 216, 384
try:
    fonte = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 15)
except OSError:
    fonte = ImageFont.load_default()
linhas = []
for q in qs:
    a = Image.open(os.path.join(da, "KitMotion-%04d.png" % q)).convert("RGB")
    d = Image.open(os.path.join(dd, "KitMotion-%04d.png" % q)).convert("RGB")
    an, dn = np.asarray(a).astype(int), np.asarray(d).astype(int)
    m = np.abs(an - dn).max(axis=2)
    mapa = Image.fromarray(np.clip(m * 40, 0, 255).astype(np.uint8)).convert("RGB")
    lin = Image.new("RGB", (W * 3 + 8, H + 22), "white")
    for i, im in enumerate((a, d, mapa)):
        lin.paste(im.resize((W, H), Image.LANCZOS), (i * (W + 4), 22))
    dr = ImageDraw.Draw(lin)
    dr.text((4, 3), "quadro %d   antes | depois | diferença x40 (máx %d, %d px)" % (q, m.max(), int((m > 0).sum())), fill="black", font=fonte)
    linhas.append(lin)
cols = 3
lw, lh = linhas[0].size
nl = (len(linhas) + cols - 1) // cols
folha = Image.new("RGB", (cols * (lw + 10), nl * (lh + 10) + (30 if rot else 0)), "white")
if rot:
    ImageDraw.Draw(folha).text((6, 6), rot, fill="black", font=fonte)
for i, lin in enumerate(linhas):
    folha.paste(lin, ((i % cols) * (lw + 10), (30 if rot else 0) + (i // cols) * (lh + 10)))
buf = io.BytesIO()
folha.save(buf, "JPEG", quality=82)
escrita.grava_bytes(saida, buf.getvalue(), cria_pasta=True)
print(saida, folha.size, len(buf.getvalue()))
