"""Pós do carrossel de 05/10 (Contabilidade tradicional e Legalizaí), revisão v3.

Uso (venv do corte-viral, sempre com -B):
    python -B pos.py --reduz ENTRADA SAIDA   (chamado pelo stills-carrossel.mjs a cada quadro)
    python -B pos.py                         (QA, folha de contato, prévia a 390 pt e recortes dos palcos)

--reduz: a PNG do render em scale 2 (2160 x 2700) vira 1080 x 1350 com Lanczos, em RGB (sem alfa) e com o perfil
sRGB embutido.

Sem argumento:
1. Confere as 7 PNG de png/ (1080 x 1350, RGB, sRGB embutido).
2. QA: papel da faixa do texto em #FAF8F5 (+-2), coral do "Legalizaí" da capa perto de #F2643C, L* dos painéis
   da vitrine, zero travessão e meia-risca no código, nenhum "MEI" no texto das telas, "Legalizaí" com acento,
   objetos dentro do seu lado (Tradicional entre x 95 e 485; Legalizaí entre 595 e 985) e aparelho travado
   (tolerância de 15 px da caixa da capa à tela 5).
3. Grava folha.jpg (7 miniaturas), previa-390.jpg (as 7 telas na largura de um celular de 390 pt) e
   recortes/palco-N.jpg (cada palco a 100 %). É isso que se revisa, não as PNG em tamanho cheio.
Sai com código 1 se algum QA falhar.
"""
import io
import json
import os
import re
import sys

from PIL import Image, ImageCms, ImageDraw, ImageFont

sys.dont_write_bytecode = True

PECA = os.path.dirname(os.path.abspath(__file__))
PNG = os.path.join(PECA, "png")
SRC = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/carrossel-2026-10-05"
SORA = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public-guia/Sora-wght.ttf"
NOMES = ["01-capa.png", "02-abrir-a-empresa.png", "03-a-guia-do-mes.png", "04-caso-fora-do-padrao.png",
         "05-o-que-voce-paga.png", "06-antes-de-assinar.png", "07-fecho.png"]
PAPEL = (250, 248, 245)
CORAL = (242, 100, 60)
FONE = (648, 560, 947, 1161)
ICC = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()


def grava_rgb(im, destino):
    rgb = im.convert("RGB")
    buf = io.BytesIO()
    rgb.save(buf, format="PNG", icc_profile=ICC, optimize=True)
    tmp = destino + ".tmp"
    with open(tmp, "wb") as f:
        f.write(buf.getvalue())
    os.replace(tmp, destino)
    return rgb


def reduz(entrada, saida):
    with Image.open(entrada) as im:
        im.load()
        tam_entrada = im.size
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA")
        if im.size != (1080, 1350):
            # o fundo é opaco; achata o alfa no papel antes de reduzir (nada de franja escura)
            if im.mode == "RGBA":
                base = Image.new("RGBA", im.size, PAPEL + (255,))
                base.alpha_composite(im)
                im = base
            im = im.convert("RGB").resize((1080, 1350), Image.LANCZOS)
        grava_rgb(im, saida)
    print("reduzido %s (%dx%d) -> %s (1080x1350)" % (os.path.basename(entrada), tam_entrada[0], tam_entrada[1], os.path.basename(saida)))


if len(sys.argv) >= 2 and sys.argv[1] == "--reduz":
    reduz(sys.argv[2], sys.argv[3])
    sys.exit(0)

falhas = []


def ok(cond, msg):
    print(("ok    " if cond else "FALHA ") + msg)
    if not cond:
        falhas.append(msg)


def fonte(tam, peso):
    try:
        f = ImageFont.truetype(SORA, tam)
        f.set_variation_by_axes([peso])
        return f
    except Exception:
        return ImageFont.load_default()


def lab_l(rgb):
    def lin(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    y = 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])
    return 116 * (y ** (1 / 3) if y > 0.008856 else (7.787 * y + 16 / 116)) - 16


def media(im, x, y, r=4):
    reg = im.crop((x - r, y - r, x + r + 1, y + r + 1))
    n = (2 * r + 1) ** 2
    return tuple(sum(c) / float(n) for c in zip(*reg.getdata()))


imagens = []
for n in NOMES:
    p = os.path.join(PNG, n)
    if not os.path.isfile(p):
        ok(False, "%s não existe" % n)
        imagens.append(None)
        continue
    with Image.open(p) as im:
        im.load()
        modo = im.mode
        tem_icc = bool(im.info.get("icc_profile"))
        rgb = im.convert("RGB")
    if modo != "RGB" or not tem_icc or rgb.size != (1080, 1350):
        rgb = grava_rgb(rgb.resize((1080, 1350), Image.LANCZOS) if rgb.size != (1080, 1350) else rgb, p)
    with Image.open(p) as conf:
        ok(conf.size == (1080, 1350) and conf.mode == "RGB" and bool(conf.info.get("icc_profile")),
           "%s em 1080x1350, RGB, sRGB embutido" % n)
    imagens.append(rgb)

# papel na faixa do texto (fora de letra; x 1040 fica além da margem de 1008)
PONTOS_PAPEL = {0: [(1040, 150), (1040, 480)], 6: [(1040, 150), (1040, 888)]}
for i, im in enumerate(imagens):
    if im is None:
        continue
    for (x, y) in PONTOS_PAPEL.get(i, [(1040, 150), (1040, 440)]):
        px = media(im, x, y)
        dif = max(abs(px[k] - PAPEL[k]) for k in range(3))
        ok(dif <= 2.0, "tela %d: papel em (%d, %d) = (%.1f, %.1f, %.1f), diferença %.1f" % (i, x, y, px[0], px[1], px[2], dif))

# painéis da vitrine: L* do frio perto de 83 (borda esquerda, longe de objeto) e do quente perto de 96
for i, im in enumerate(imagens[:6]):
    if im is None:
        continue
    yy = 720 if i else 760
    lf = lab_l(media(im, 92, yy))
    lq = lab_l(media(im, 990, yy))
    ok(78 <= lf <= 88, "tela %d: painel frio L* %.1f em (92, %d)" % (i, lf, yy))
    ok(90 <= lq <= 99, "tela %d: painel quente L* %.1f em (990, %d)" % (i, lq, yy))

# coral do "Legalizaí" do título da capa (3ª linha: y de 288 a 386)
if imagens[0] is not None:
    reg = imagens[0].crop((72, 292, 640, 382))
    corais = [c for c in reg.getdata() if c[0] > 215 and 70 < c[1] < 130 and 30 < c[2] < 95]
    if corais:
        corais.sort(key=lambda c: (c[0], c[1], c[2]))
        med = corais[len(corais) // 2]
        dif = max(abs(med[k] - CORAL[k]) for k in range(3))
        ok(dif <= 6, "capa: coral do título = %s (mediana de %d px), diferença %d" % (str(med), len(corais), dif))
    else:
        ok(False, "capa: não achei o coral do 'Legalizaí' no título")

# zero travessão e meia-risca no código e nos textos do carrossel
for raiz, _, arqs in os.walk(SRC):
    for a in arqs:
        if a.endswith((".ts", ".tsx")):
            t = open(os.path.join(raiz, a), encoding="utf-8").read()
            ok("\u2014" not in t and "\u2013" not in t and "\u2212" not in t, "sem travessão, meia-risca nem sinal de menos em %s" % a)
dados = open(os.path.join(SRC, "dados.ts"), encoding="utf-8").read()
textos = " ".join(re.findall(r'"([^"]*)"', dados))
ok(not re.search(r"\bMEI\b", textos), "nenhum 'MEI' no texto das telas")
ok("Legalizai" not in textos.replace("Legalizaí", ""), "'Legalizaí' sempre com acento no texto das telas")
tex = open(os.path.join(SRC, "cena", "texturas.ts"), encoding="utf-8").read()
ok(not re.search(r"\bMEI\b", " ".join(re.findall(r'"([^"]*)"', tex))), "nenhum 'MEI' nas texturas")

# QA da cena (caixas dos objetos), se o render gravou
DIREITA = ("iphone", "placa", "sino", "moeda", "cartao", "contrato")
qa = os.path.join(PECA, "qa-cena.json")
if os.path.isfile(qa):
    cenas = json.load(open(qa, encoding="utf-8"))
    for c in cenas:
        t = c.get("tela")
        for it in c.get("itens", []):
            x0, y0, x1, y1 = it["caixa"]
            nome = it["nome"]
            if t == 6:
                ok(x0 >= 95 and x1 <= 985, "tela 6: %s dentro do painel (x %d a %d)" % (nome, x0, x1))
            elif nome.startswith(DIREITA):
                ok(x0 >= 595 and x1 <= 985, "tela %d: %s no lado Legalizaí (x %d a %d)" % (t, nome, x0, x1))
            else:
                ok(x0 >= 95 and x1 <= 485, "tela %d: %s no lado Tradicional (x %d a %d)" % (t, nome, x0, x1))
            if nome == "iphone" and t != 6:
                dif = max(abs(a - b) for a, b in zip((x0, y0, x1, y1), FONE))
                ok(dif <= 15, "tela %d: aparelho travado (caixa %s, desvio %d px)" % (t, it["caixa"], dif))
            if not nome.startswith(("placa", "sino", "moeda", "cartao", "contrato")):
                ok(it["chao"] >= -0.0005, "tela %d: %s não atravessa o chão (%.4f m)" % (t, nome, it["chao"]))

# folha de contato
mini_w, mini_h, gap = 270, 338, 12
larg = 4 * mini_w + 5 * gap
alt = 2 * (mini_h + 26) + 3 * gap
folha = Image.new("RGB", (larg, alt), (36, 37, 41))
d = ImageDraw.Draw(folha)
rot = fonte(15, 600)
for i, im in enumerate(imagens):
    x = gap + (i % 4) * (mini_w + gap)
    y = gap + (i // 4) * (mini_h + 26 + gap)
    if im is not None:
        folha.paste(im.resize((mini_w, mini_h), Image.LANCZOS), (x, y))
    d.text((x, y + mini_h + 5), NOMES[i], font=rot, fill=(225, 225, 225))
folha.save(os.path.join(PECA, "folha.jpg"), quality=88)
print("folha.jpg gravada (%dx%d)" % folha.size)

# prévia na largura de um celular (390 pt): o tamanho em que o texto vai ser lido no feed
pw, ph = 390, int(round(390 * 1350 / 1080))
prev = Image.new("RGB", (4 * pw + 5 * gap, 2 * ph + 3 * gap), (36, 37, 41))
for i, im in enumerate(imagens):
    if im is None:
        continue
    prev.paste(im.resize((pw, ph), Image.LANCZOS), (gap + (i % 4) * (pw + gap), gap + (i // 4) * (ph + gap)))
prev.save(os.path.join(PECA, "previa-390.jpg"), quality=90)
print("previa-390.jpg gravada (%dx%d)" % prev.size)

# recortes dos palcos a 100 %
os.makedirs(os.path.join(PECA, "recortes"), exist_ok=True)
for i, im in enumerate(imagens):
    if im is None:
        continue
    caixa = (60, 200, 1020, 885) if i == 6 else (60, 450, 1020, 1225)
    im.crop(caixa).save(os.path.join(PECA, "recortes", "palco-%d.jpg" % i), quality=92)
print("recortes/palco-N.jpg gravados")

if falhas:
    print("\n%d falha(s) de QA" % len(falhas))
    sys.exit(1)
print("\nQA ok")
