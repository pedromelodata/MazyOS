"""Folha com todos os quadros de um trecho, recortados.

Uso: python -I folha_quadros.py VIDEO.mp4 SAIDA.jpg Q0 Q1 x0,y0,x1,y1 LARGURA [COLUNAS] [PASSO]
(recorte em fração do quadro; Q0 e Q1 inclusivos; o rótulo é o número do quadro e o tempo)
"""
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw

v, out, q0, q1 = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
x0, y0, x1, y1 = [float(t) for t in sys.argv[5].split(",")]
larg = int(sys.argv[6])
cols = int(sys.argv[7]) if len(sys.argv) > 7 else 8
passo = int(sys.argv[8]) if len(sys.argv) > 8 else 1
info = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                       "-of", "csv=p=0", v], capture_output=True, text=True).stdout.strip().split(",")
W, H = int(info[0]), int(info[1])
cx0, cy0, cx1, cy1 = int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H)
alt = int(larg * (cy1 - cy0) / (cx1 - cx0))
b = subprocess.run(["ffmpeg", "-v", "error", "-i", v, "-vf",
                    f"select='between(n\,{q0}\,{q1})*not(mod(n-{q0}\,{passo}))',crop={cx1 - cx0}:{cy1 - cy0}:{cx0}:{cy0},"
                    f"scale={larg}:{alt}:flags=lanczos", "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                   capture_output=True, check=True).stdout
F = np.frombuffer(b, np.uint8).reshape(-1, alt, larg, 3)
rows = (len(F) + cols - 1) // cols
s = Image.new("RGB", (cols * larg, rows * (alt + 14)), "white")
d = ImageDraw.Draw(s)
for i, f in enumerate(F):
    x, y = (i % cols) * larg, (i // cols) * (alt + 14)
    s.paste(Image.fromarray(f), (x, y + 14))
    q = q0 + i * passo
    d.text((x + 3, y + 1), f"q{q} {q / 24:.3f}s", fill="black")
s.save(out, quality=88)
print("ok", out, len(F), "quadros")
