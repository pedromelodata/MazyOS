"""Telas reais do app (marketing/telas-app-2026-10-02) com os dados de exemplo trocados pro personagem do filme.

Só texto de exemplo muda; o layout é o da captura. Saída nesta pasta:
  tela-1-emitir.png            Emitir nota, "Repetir última nota" com o cliente TechFlow
  tela-2-emitir-preenchida.png o mesmo, depois do toque: valor preenchido e botão ativo
  tela-3-nota-emitida.png      Nota emitida, prestador com o nome do personagem
Uso (venv do corte-viral): python -I edita_telas.py
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
TELAS = "C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02"
SORA = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public-guia/Sora-wght.ttf"
NOME = "Rafael Lima Design"
CLIENTE = "TechFlow Software Ltda"


def fonte(tam, peso):
    f = ImageFont.truetype(SORA, tam)
    f.set_variation_by_axes([peso])
    return f


def calibra(texto, largura, peso):
    """Corpo da Sora em que o texto ocupa a largura medida na captura."""
    lo, hi = 8, 300
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if fonte(mid, peso).getlength(texto) <= largura:
            lo = mid
        else:
            hi = mid
    return lo


def apaga(im, box, cor=(255, 255, 255)):
    ImageDraw.Draw(im).rectangle(box, fill=cor)


def escreve(im, xy_topo, texto, tam, peso, cor):
    d = ImageDraw.Draw(im)
    f = fonte(tam, peso)
    # alinha pelo topo da tinta, como a medição da captura
    l, t, r, b = d.textbbox((0, 0), texto, font=f)
    d.text((xy_topo[0] - l, xy_topo[1] - t), texto, font=f, fill=cor)


# 1. Emitir nota: a linha "Padaria Pão Quente Ltda · R$ 500,00" (y 336 a 373, x 270 a 934, cinza 115,110,103)
em = Image.open(os.path.join(TELAS, "emitir.png")).convert("RGB")
tam = calibra("Padaria Pão Quente Ltda · R$ 500,00", 934 - 270, 500)
apaga(em, (262, 330, 1060, 380))
escreve(em, (270, 336), f"{CLIENTE} · R$ 1.200,00", tam, 500, (115, 110, 103))
em.save(os.path.join(AQUI, "tela-1-emitir.png"))
print("linha do cliente: corpo", tam)

# 2. Depois do toque em "Repetir última nota": valor preenchido (escuro) e botão "Revisar nota" ativo
e2 = em.copy()
a = np.asarray(e2).astype(int)
# o "R$" e o "0,00" da captura: separa pelas colunas vazias
faixa = (np.abs(a[1103:1193, 120:900] - 255).sum(axis=2) > 40).any(axis=0)
cols = np.where(faixa)[0] + 120
gaps = np.where(np.diff(cols) > 20)[0]
x_rs_fim = cols[gaps[0]] if len(gaps) else cols.max()
x_num = cols[gaps[0] + 1] if len(gaps) else cols.max()
alt_rs = None
rs = (np.abs(a[1103:1193, cols.min():x_rs_fim + 1] - 255).sum(axis=2) > 40).any(axis=1)
rs_y = np.where(rs)[0]
num = (np.abs(a[1103:1193, x_num:900] - 255).sum(axis=2) > 40)
num_y = np.where(num.any(axis=1))[0]
print("R$ x", cols.min(), x_rs_fim, "y", 1103 + rs_y.min(), 1103 + rs_y.max(), "| número x", x_num, "y", 1103 + num_y.min(), 1103 + num_y.max())
apaga(e2, (x_num - 6, 1095, 1200, 1200))
alt = num_y.max() - num_y.min() + 1
# acha o corpo em que "0,00" tem a altura da captura e escreve o valor no mesmo corpo, em tinta
lo, hi = 20, 300
while hi - lo > 1:
    mid = (lo + hi) // 2
    l, t, r, b = ImageDraw.Draw(e2).textbbox((0, 0), "0,00", font=fonte(mid, 700))
    if b - t <= alt:
        lo = mid
    else:
        hi = mid
escreve(e2, (x_num, 1103 + num_y.min()), "1.200,00", lo, 700, (27, 30, 36))
print("valor: corpo", lo)
# botão: troca o coral claro (desativado) pelo coral do botão ativo, mantendo o texto branco
b = np.asarray(e2).astype(np.float32)
y0, y1 = 2560, 2780
reg = b[y0:y1]
claro = np.array([241, 184, 169], dtype=np.float32)
ativo = np.array([221, 78, 39], dtype=np.float32)
branco = np.array([255, 255, 255], dtype=np.float32)
# mistura: quanto mais perto do coral claro, mais vira coral ativo; texto (mais claro) vira branco
dist_claro = np.abs(reg - claro).sum(axis=2)
mask = dist_claro < 40
t = np.clip((reg - claro) / (branco - claro + 1e-6), 0, 1).mean(axis=2, keepdims=True)
novo = ativo * (1 - t) + branco * t
reg_out = np.where((dist_claro < 200)[..., None] & (reg.sum(axis=2) > 500)[..., None], novo, reg)
b[y0:y1] = reg_out
e2 = Image.fromarray(np.clip(b, 0, 255).astype(np.uint8))
e2.save(os.path.join(AQUI, "tela-2-emitir-preenchida.png"))

# 3. Nota emitida: prestador (y 961 a 984 e 1006 a 1029) e o cartão "De" (y 1459 a 1491)
nd = Image.open(os.path.join(TELAS, "notas_detalhe.png")).convert("RGB")
tam_p = calibra("Ana Beatriz Ramos Desenv. de", 592 - 135, 600)
apaga(nd, (130, 955, 640, 1035))
escreve(nd, (135, 961), NOME, tam_p, 600, (51, 51, 51))
tam_de = calibra("Ana Beatriz Ramos ...", 639 - 123, 600)
apaga(nd, (118, 1452, 645, 1500))
escreve(nd, (123, 1459), NOME, tam_de, 600, (27, 30, 36))
nd.save(os.path.join(AQUI, "tela-3-nota-emitida.png"))
print("prestador", tam_p, "de", tam_de)
