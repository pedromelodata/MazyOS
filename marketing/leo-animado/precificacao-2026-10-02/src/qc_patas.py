# Tira das patas a cada N quadros (região do peito/mãos, largura inteira) pra contar dedos no take inteiro.
#   python qc_patas.py takes/T1.mp4 qa/T1-patas.jpg [passo=3]
import subprocess, json, sys
import numpy as np
from PIL import Image, ImageDraw

take, out = sys.argv[1], sys.argv[2]
step = int(sys.argv[3]) if len(sys.argv) > 3 else 3
info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                  "stream=width,height,r_frame_rate", "-of", "json", take], capture_output=True).stdout)["streams"][0]
w, h = info["width"], info["height"]
a, b = map(int, info["r_frame_rate"].split("/")); fps = a / b
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", take, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
y0, y1 = int(h * 0.50), int(h * 0.92)          # faixa onde as patas gesticulam
idx = list(range(0, len(F), step))
tw = 300; th = int(tw * (y1 - y0) / w); cols = 8
sheet = Image.new("RGB", (cols * tw, ((len(idx) + cols - 1) // cols) * (th + 18)), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for k, i in enumerate(idx):
    im = Image.fromarray(F[i][y0:y1]).resize((tw, th), Image.LANCZOS)
    x, y = (k % cols) * tw, (k // cols) * (th + 18)
    sheet.paste(im, (x, y + 18)); d.text((x + 4, y + 3), f"{i / fps:.2f}s q{i}", fill=(255, 255, 255))
sheet.save(out, quality=88)
print(out, len(F), "quadros")
