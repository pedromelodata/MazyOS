"""folha de contato dos stills do kit: folha.py <pasta dos stills> <saida.jpg> [largura] [colunas] [recorte y0,y1]"""
import sys, os, re
from PIL import Image, ImageDraw, ImageFont

pasta, saida = sys.argv[1], sys.argv[2]
larg = int(sys.argv[3]) if len(sys.argv) > 3 else 240
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 8
corte = tuple(int(v) for v in sys.argv[5].split(",")) if len(sys.argv) > 5 else None
fps = 30
arqs = sorted(f for f in os.listdir(pasta) if re.match(r"KitMotion-\d+\.png$", f))
ims = []
for f in arqs:
    q = int(re.findall(r"\d+", f)[0])
    im = Image.open(os.path.join(pasta, f)).convert("RGB")
    if corte:
        im = im.crop((0, corte[0], im.width, corte[1]))
    h = round(im.height * larg / im.width)
    im = im.resize((larg, h), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    try:
        fnt = ImageFont.truetype("arial.ttf", 16)
    except Exception:
        fnt = ImageFont.load_default()
    rot = f"q{q} {q / fps:.2f}s"
    d.rectangle((0, 0, 8 + 9 * len(rot), 22), fill=(0, 0, 0))
    d.text((4, 2), rot, fill=(255, 80, 80), font=fnt)
    ims.append(im)
if not ims:
    sys.exit("nenhum still")
w, h = ims[0].size
lin = (len(ims) + cols - 1) // cols
folha = Image.new("RGB", (cols * (w + 4), lin * (h + 4)), (0, 0, 0))
for i, im in enumerate(ims):
    folha.paste(im, ((i % cols) * (w + 4), (i // cols) * (h + 4)))
folha.save(saida, quality=88)
print(saida, folha.size, len(ims), "stills")
