# Gera deploy/cronograma.ico a partir do símbolo da marca (quadrado coral + check).
# Desenha em 1024px e reduz, porque o PIL não lê SVG.
from PIL import Image, ImageDraw
from pathlib import Path

L = 1024
img = Image.new("RGBA", (L, L), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
raio = int(L * 32.84 / 211.09)
d.rounded_rectangle([0, 0, L - 1, L - 1], radius=raio, fill=(242, 100, 60, 255))
# check: mesma geometria do simbolo.svg (viewBox 211.09), traço grosso com pontas redondas
k = L / 211.09
pontos = [(24.15 * k, 104.82 * k), (84.95 * k, 165.62 * k), (211.09 * k, 39.48 * k)]
esp = int(38 * k)
d.line(pontos, fill=(255, 255, 255, 255), width=esp, joint="curve")
for x, y in pontos[:2]:
    d.ellipse([x - esp / 2, y - esp / 2, x + esp / 2, y + esp / 2], fill=(255, 255, 255, 255))
# o check vaza pela borda direita no logo: recorta no quadrado
mascara = Image.new("L", (L, L), 0)
ImageDraw.Draw(mascara).rounded_rectangle([0, 0, L - 1, L - 1], radius=raio, fill=255)
img.putalpha(mascara)
destino = Path(__file__).with_name("cronograma.ico")
img.save(destino, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
img.resize((256, 256), Image.LANCZOS).save(Path(__file__).with_name("cronograma.png"))
print(destino)
