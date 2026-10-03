# Monta as telas do iPhone 3D a partir das capturas REAIS do app (marketing/telas-app), 1290x2796:
#   tela-splash.png   splash coral com o logo (inteira, como está)
#   tela-inicio.png   Início: rótulo, saudação e SÓ o card da guia do mês (sem o valor, que o contador de tela.ts desenha,
#                     e com o "Pagar agora" como esqueleto de carregamento) + barra de abas
#   tela-imposto.png  Imposto do mês: cabeçalho, valor, subtítulo e os botões da guia
# Cortes do reel.md da peça (14/10): card da empresa, "No resto, você está em dia", "Seu negócio",
# "Próximos vencimentos", "De onde vem esse valor" e "Como pagar" ficam fora.
# Valores nítidos desde 01/10, por decisão do Pedro: são fictícios, da empresa de exemplo do app (não é o valor
# da guia do MEI, que não se cita; F063).
# Em cima entra uma faixa de barra de status, pra nada ficar embaixo da Dynamic Island.
#   python monta_telas.py   (venv do corte-viral, que tem PIL e numpy)
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
# capturas do app atual (repo Legalizei @ ab68dbc, recapturadas em 02/10: fundo branco e "Imposto do mês" com
# cabeçalho 18 px e conteúdo 36 px mais abaixo); as de antes de 29/08 ficam em marketing/telas-app
SRC = r"C:\MKT-INSTA\Content Legalizai\marketing\telas-app-2026-10-02"
OUT = os.path.join(HERE, "assets", "telas")
os.makedirs(OUT, exist_ok=True)
W, H = 1290, 2796
BG = (255, 255, 255)  # fundo do app desde 29/08
INK = (27, 30, 36)
SORA = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Windows\Fonts\Sora-wght.ttf")
TOP = 132  # faixa da barra de status (o conteúdo desce isso)


def load(nome):
    return Image.open(os.path.join(SRC, nome)).convert("RGB")


def sora(size, peso):
    f = ImageFont.truetype(SORA, size)
    try:
        f.set_variation_by_axes([peso])
    except Exception:
        pass
    return f


def barra_status(img):
    # barra de status genérica: hora à esquerda, sinal, wi-fi e bateria à direita (sem marca)
    d = ImageDraw.Draw(img)
    d.text((132, 58), "9:41", font=sora(50, 600), fill=INK, anchor="lm")
    x, y = 1000, 58
    for i, h in enumerate((14, 20, 26, 32)):  # sinal
        d.rounded_rectangle((x + i * 15, y + 16 - h, x + i * 15 + 10, y + 16), radius=3, fill=INK)
    cx, cy = 1105, 74  # wi-fi
    for r, wdt in ((34, 7), (22, 7)):
        d.arc((cx - r, cy - r, cx + r, cy + r), start=225, end=315, fill=INK, width=wdt)
    d.ellipse((cx - 6, cy - 12, cx + 6, cy), fill=INK)
    bx, by = 1150, 42  # bateria
    d.rounded_rectangle((bx, by, bx + 72, by + 34), radius=10, outline=INK, width=4)
    d.rounded_rectangle((bx + 7, by + 7, bx + 58, by + 27), radius=5, fill=INK)
    d.rounded_rectangle((bx + 76, by + 11, bx + 81, by + 23), radius=2, fill=INK)


def desfoca(img, box, raio, apaga=0.0):
    # desfoque forte só na região (valor em reais, botão de pagar), colado com máscara de borda suave
    # pra não virar "caixa de censura"; `apaga` puxa pro fundo do card
    # a máscara chega a 100% ANTES da borda da caixa e só esfuma por fora; esfumando por dentro,
    # o topo e o pé dos algarismos vazavam do original e o valor ficava legível
    m = raio * 3
    x0, y0, x1, y1 = box[0] - m, box[1] - m, box[2] + m, box[3] + m
    reg = img.crop((x0, y0, x1, y1))
    # pixelar antes de desfocar: só o desfoque deixa o formato dos algarismos legível
    w, h = reg.size
    reg = reg.resize((max(1, w // 16), max(1, h // 16)), Image.BOX).resize((w, h), Image.BICUBIC)
    for _ in range(2):
        reg = reg.filter(ImageFilter.GaussianBlur(raio))
    if apaga > 0:
        cor = Image.new("RGB", reg.size, img.getpixel((x0 + 2, y0 + 2)))
        reg = Image.blend(reg, cor, apaga)
    f = raio  # folga da máscara pra fora da caixa
    mask = Image.new("L", reg.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((m - f, m - f, reg.size[0] - m + f, reg.size[1] - m + f), radius=raio, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(raio * 0.5))
    img.paste(reg, (x0, y0), mask)


def cola(dst, src, box, y_novo, mascara=None):
    reg = src.crop(box)
    dst.paste(reg, (box[0], y_novo), mascara)


def mascara_arredondada(w, h, r):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), radius=r, fill=255)
    return m


def barra_abas(dst, src, dy=0):
    # pílula da barra de abas (2575..2768) e botão NF-e (2484..2670), recortados por máscara arredondada
    px0, py0, px1, py1 = 48, 2574, 1243, 2764  # embaixo da pílula aparece o "Atalhos": cortar rente
    pil = src.crop((px0, py0, px1, py1))
    # sombra suave da pílula
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle((px0, py0 + 10 + dy, px1, py1 + 10 + dy), radius=(py1 - py0) // 2, fill=60)
    sh = sh.filter(ImageFilter.GaussianBlur(22))
    dst.paste(Image.new("RGB", (W, H), (150, 140, 130)), (0, 0), sh)
    dst.paste(pil, (px0, py0 + dy), mascara_arredondada(px1 - px0, py1 - py0, (py1 - py0) // 2))
    bx0, by0, bx1, by1 = 553, 2484, 738, 2671
    nf = src.crop((bx0, by0, bx1, by1))
    sh2 = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh2).rounded_rectangle((bx0, by0 + 14 + dy, bx1, by1 + 14 + dy), radius=48, fill=90)
    sh2 = sh2.filter(ImageFilter.GaussianBlur(18))
    dst.paste(Image.new("RGB", (W, H), (120, 60, 40)), (0, 0), sh2)
    dst.paste(nf, (bx0, by0 + dy), mascara_arredondada(bx1 - bx0, by1 - by0, 46))


# 1) splash (inteira)
load("splash.png").save(os.path.join(OUT, "tela-splash.png"))

# 2) Início: só o card da guia do mês, em duas versões. No "calcula" o "Pagar agora" fica desfocado
#    (a guia ainda está sendo calculada); no "só pagar" ele aparece nítido pra ser tocado. A troca fica
#    escondida no flip (auditoria de 01/10: o botão do clímax não pode aparecer 5 s antes).
src = load("inicio.png")
for nome, calcula in (("tela-inicio.png", True), ("tela-inicio-pagar.png", False)):
    work = src.copy()
    if calcula:
        # o valor sai da imagem: o contador de tela.ts escreve de R$ 0,00 a R$ 178,31 no "calcula"
        # (Sora 600 59px, x 125, linha de base 682 na tela montada; ajuste medido contra a captura)
        dr = ImageDraw.Draw(work)
        dr.rectangle((118, 752, 420, 828), fill=(254, 243, 238))
        # o "Pagar agora" vira esqueleto de carregamento, sem desfoque nenhum (o Pedro tirou os desfoques em 01/10);
        # o botão nítido só aparece escondido no flip, e o brilho que passa no esqueleto é desenhado em tela.ts
        dr.rectangle((112, 858, 526, 996), fill=(254, 243, 238))
        dr.rounded_rectangle((123, 867, 512, 986), radius=28, fill=(247, 228, 220))
    img = Image.new("RGB", (W, H), BG)
    barra_status(img)
    cola(img, work, (0, 70, W, 116), 70 + TOP)            # "Início"
    cola(img, work, (0, 178, W, 264), 178 + TOP)          # "Bom te ver, Ana"
    y_card = 288 + TOP                                    # o card sobe pro lugar do card da empresa (cortado)
    cola(img, work, (0, 548, W, 1042), y_card)
    barra_abas(img, src)
    img.save(os.path.join(OUT, nome))

# 3) Imposto do mês: cabeçalho, valor, subtítulo e os botões da guia
src = load("impostos_pagar.png")
work = src.copy()
img = Image.new("RGB", (W, H), BG)
barra_status(img)
cola(img, work, (0, 106, W, 159), 106 + TOP)          # "< Imposto do mês"
cola(img, work, (0, 236, W, 336), 236 + TOP)          # valor (R$ 178,31, fictício)
# "Imposto do mês · Junho de 2026" saiu: repetia o cabeçalho e o card (auditoria de 01/10)
cola(img, work, (0, 2428, W, 2756), 2428)             # botões: Baixar guia (PDF), Ver a guia, Enviar guia
img.save(os.path.join(OUT, "tela-imposto.png"))

# conferência: tira lado a lado em 1/3
fol = Image.new("RGB", (W * 3 // 3 + 860, H // 3), (40, 40, 40))
for i, n in enumerate(("tela-splash.png", "tela-inicio.png", "tela-imposto.png")):
    t = Image.open(os.path.join(OUT, n)).resize((W // 3, H // 3), Image.LANCZOS)
    fol.paste(t, (i * (W // 3 + 10), 0))
fol.save(os.path.join(HERE, "qa", "telas-montadas.jpg"), quality=88)
print("ok", OUT)
