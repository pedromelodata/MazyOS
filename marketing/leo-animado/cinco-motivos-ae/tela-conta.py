"""Troca "Faturou R$ 4.200" por "Faturou R$ 2.971,83" na tela impostos_pagar (6% de 2.971,83 = 178,31, o valor da tela)."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ent, sai, fonte, prova = sys.argv[1:5]
im = Image.open(ent).convert("RGB")
a = np.asarray(im).astype(int)
# a linha fica no cartão "De onde vem esse valor", por volta de y 640
reg = a[600:690, 90:1200]
fundo = np.median(reg.reshape(-1, 3), axis=0)
esc = (np.abs(reg - fundo).sum(axis=2) > 60)
ys, xs = np.nonzero(esc)
y0, y1, x0, x1 = ys.min() + 600, ys.max() + 600, xs.min() + 90, xs.max() + 90
print("linha:", x0, y0, x1, y1, "fundo", fundo)
cor = tuple(int(c) for c in a[y0:y1 + 1, x0:x1 + 1].reshape(-1, 3)[np.argmin(a[y0:y1 + 1, x0:x1 + 1].reshape(-1, 3).sum(axis=1))])
print("cor do texto", cor)
velho = "Faturou R$ 4.200 · 6% do Simples."
novo = "Faturou R$ 2.971,83 · 6% do Simples."
melhor = None
for peso in (380, 400, 420):
    for tam in np.arange(30, 46, 0.5):
        f = ImageFont.truetype(fonte, int(round(tam * 4)) / 4 if False else int(round(tam)))
        try:
            f.set_variation_by_axes([peso])
        except Exception:
            pass
        bb = f.getbbox(velho)
        w, h = bb[2] - bb[0], bb[3] - bb[1]
        err = abs(w - (x1 - x0 + 1)) + abs(h - (y1 - y0 + 1))
        if melhor is None or err < melhor[0]:
            melhor = (err, peso, int(round(tam)), bb)
err, peso, tam, bb = melhor
print("fonte casada: peso", peso, "tamanho", tam, "erro", err)
f = ImageFont.truetype(fonte, tam)
f.set_variation_by_axes([peso])
d = ImageDraw.Draw(im)
d.rectangle([x0 - 4, y0 - 6, x1 + 4, y1 + 6], fill=tuple(int(c) for c in fundo))
d.text((x0 - bb[0], y0 - bb[1]), novo, font=f, fill=cor)
im.save(sai)
im.crop((60, 520, 1230, 760)).save(prova)
# prova: o texto velho redesenhado por cima do original (pra ver se a fonte casa)
im2 = Image.open(ent).convert("RGB")
d2 = ImageDraw.Draw(im2)
d2.text((x0 - bb[0], y0 - bb[1]), velho, font=f, fill=(255, 0, 0))
im2.crop((60, 580, 1230, 700)).save(prova.replace(".png", "-sobreposto.png"))
