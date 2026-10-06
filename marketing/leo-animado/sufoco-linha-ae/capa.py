# Capa do reel de 09/10, versão 3 (After Effects): o quadro de 3,0 s (o relógio com a tarde coral e a linha
# abraçando o relógio) com o título da capa da v2 em cima. Mesmo título e destaque da v2.
# Uso: python capa.py <video.mp4> <capa.png>
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont

VIDEO, SAIDA = sys.argv[1], sys.argv[2]
FONTE = r"C:\Users\EDIT-ADMIN\AppData\Local\Microsoft\Windows\Fonts\Sora-wght.ttf"
PAPEL, INK, CORAL6 = (250, 248, 245), (27, 30, 36), (221, 78, 39)

quadro = SAIDA + ".quadro.png"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "3.0", "-i", VIDEO, "-frames:v", "1", quadro], check=True)
im = Image.open(quadro).convert("RGB")
d = ImageDraw.Draw(im)
# apaga a legenda do quadro: papel no alto, com uma borda suave até a linha aparecer
for y in range(0, 700):
    a = 1.0 if y < 640 else 1 - (y - 640) / 60
    if a <= 0:
        break
    linha = im.crop((0, y, 1080, y + 1))
    papel = Image.new("RGB", (1080, 1), PAPEL)
    im.paste(Image.blend(linha, papel, a), (0, y))
fonte = ImageFont.truetype(FONTE, 92)
fonte.set_variation_by_axes([800])
linhas = [[("A ", INK), ("tarde inteira", CORAL6), (" pra", INK)], [("resolver uma coisa", INK)], [("simples", INK)]]
y = 335
for partes in linhas:
    larg = sum(d.textlength(t, font=fonte) for t, _ in partes)
    x = (1080 - larg) / 2
    for t, c in partes:
        d.text((x, y), t, font=fonte, fill=c)
        x += d.textlength(t, font=fonte)
    y += 100
im.save(SAIDA)
grade = im.crop((0, 285, 1080, 1635)).resize((540, 675), Image.LANCZOS)
grade.save(SAIDA.replace(".png", "-grade.jpg"), quality=92)
print(SAIDA)
