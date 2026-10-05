"""capa da versão 2 em duas vitrines (a grade do carrossel de 05/10): o Tradicional (quadro 30) à esquerda e o
Legalizaí (quadro 125) à direita, cada um recortado do próprio quadro do vídeo, sobre o papel. O título entra depois,
pelo capa.py do kit (--still)."""
import sys
from PIL import Image, ImageDraw, ImageFilter

pasta, saida = sys.argv[1], sys.argv[2]
W, H = 1080, 1920
PAPEL = (250, 248, 245)
ESQ = (72, 700, 528, 1560)  # abaixo da faixa do título do capa.py (y 285 a 660), como a capa da v1
DIR = (552, 700, 1008, 1560)
RAIO = 24


def painel(quadro: str, caixa, escala: float, centro):
    """recorta do quadro (já escalado) a área do painel, centrada no ponto pedido (px do quadro original)"""
    im = Image.open(f"{pasta}/KitMotion-{quadro}.png").convert("RGB")
    im = im.resize((round(im.width * escala), round(im.height * escala)), Image.LANCZOS)
    w, h = caixa[2] - caixa[0], caixa[3] - caixa[1]
    cx, cy = round(centro[0] * escala), round(centro[1] * escala)
    x0 = max(0, min(im.width - w, cx - w // 2))
    y0 = max(0, min(im.height - h, cy - h // 2))
    rec = im.crop((x0, y0, x0 + w, y0 + h))
    # a legenda do vídeo (y até 560 no quadro original) não entra na capa: o fundo liso da vitrine se estende pra
    # cima a partir da primeira linha limpa
    corte = max(0, round(560 * escala) - y0)
    if corte > 0:
        linha = rec.crop((0, corte, w, corte + 1))
        for y in range(corte):
            rec.paste(linha, (0, y))
    return rec


def mascara(w, h, r):
    m = Image.new("L", (w * 4, h * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), r * 4, fill=255)
    return m.resize((w, h), Image.LANCZOS)


capa = Image.new("RGB", (W, H), PAPEL)
# sombra suave dos painéis no papel (a do carrossel: bem leve)
sombra = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(sombra)
for c in (ESQ, DIR):
    d.rounded_rectangle((c[0], c[1] + 10, c[2], c[3] + 14), RAIO, fill=36)
sombra = sombra.filter(ImageFilter.GaussianBlur(18))
capa.paste((214, 205, 192), (0, 0), sombra)
# Tradicional: a pilha com o carimbo e o despertador (o conjunto fica em x 300 a 1000 e y 700 a 1700 no quadro 30)
t = painel("0030", ESQ, 0.5, (515, 1290))
capa.paste(t, ESQ[:2], mascara(t.width, t.height, RAIO))
# Legalizaí: o aparelho no splash, de frente (quadro 125)
l = painel("0125", DIR, 0.64, (540, 1110))
capa.paste(l, DIR[:2], mascara(l.width, l.height, RAIO))
# borda fina de cada vitrine (as do carrossel: fria #B9C0C8, quente #F1D5C8)
d2 = ImageDraw.Draw(capa)
d2.rounded_rectangle(ESQ, RAIO, outline=(185, 192, 200), width=2)
d2.rounded_rectangle(DIR, RAIO, outline=(241, 213, 200), width=2)
capa.save(saida)
print(saida, capa.size)
