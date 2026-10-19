"""Lado a lado, bruto e com a tela colada, recortado em volta do celular, pra ver emenda e faixa sobrando na borda.

Uso: python -I borda_tela.py BRUTO.mp4 TELA.mp4 QUADRO x0,y0,x1,y1 SAIDA.png [ESCALA]
"""
import subprocess
import sys

import numpy as np
from PIL import Image


def quadro(v, n):
    info = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                           "-of", "csv=p=0", v], capture_output=True, text=True).stdout.strip().split(",")
    W, H = int(info[0]), int(info[1])
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", v, "-vf", f"select=eq(n\,{n})", "-fps_mode", "passthrough",
                        "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return np.frombuffer(b, np.uint8).reshape(H, W, 3)


bruto, tela, n = sys.argv[1], sys.argv[2], int(sys.argv[3])
x0, y0, x1, y1 = [int(v) for v in sys.argv[4].split(",")]
esc = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0
a, b = quadro(bruto, n)[y0:y1, x0:x1], quadro(tela, n)[y0:y1, x0:x1]
w, h = int((x1 - x0) * esc), int((y1 - y0) * esc)
ia = Image.fromarray(a).resize((w, h), Image.LANCZOS)
ib = Image.fromarray(b).resize((w, h), Image.LANCZOS)
s = Image.new("RGB", (w * 2 + 8, h), "white")
s.paste(ia, (0, 0))
s.paste(ib, (w + 8, 0))
s.save(sys.argv[5])
print("ok", sys.argv[5])
