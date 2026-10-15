"""Acertos de pós num take gerado, sem mexer no áudio.

cor   o modelo muda a cor no começo do take quando o quadro inicial e o final vêm de gradações
      diferentes. Mede duas âncoras (uma região escura e uma clara que ficam na imagem o take
      inteiro), calcula por canal a reta que leva cada quadro à cor dos quadros de referência e
      aplica só até o quadro --ate (depois disso o take já está na cor certa).
push  aproximação digital lenta (a câmera continua chegando perto) com âncora num ponto da
      imagem; serve pra tirar da borda o que não pode aparecer. As chaves são quadro:escala;
      entre chaves a curva é cúbica e sem tranco (velocidade contínua).

Uso (venv do corte-viral):
  python -I pos_take.py cor ENTRADA SAIDA --escuro 100:550,800:1400 --claro 2300:2540,900:1400 --ref 55:75 --ate 75
  python -I pos_take.py push ENTRADA SAIDA --ancora 0.35,1.0 --chaves 0:1.0,58:1.07,157:1.085
"""
import argparse
import json
import os
import subprocess

import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("modo", choices=["cor", "push"])
ap.add_argument("entrada")
ap.add_argument("saida")
ap.add_argument("--escuro")
ap.add_argument("--claro")
ap.add_argument("--ref")
ap.add_argument("--ate", type=int)
ap.add_argument("--ancora", default="0.5,1.0")
ap.add_argument("--chaves")
a = ap.parse_args()

# leitura e gravação com a matriz BT.709 explícita e conversão exata: o take do modelo vem sem
# etiqueta de cor, os players leem vídeo HD assim como BT.709, e a conversão padrão do ffmpeg
# escurece e puxa a cor uns 2 a 4 pontos
LE = "scale=in_color_matrix=bt709:in_range=tv:flags=accurate_rnd+full_chroma_int+bitexact,format=bgr24"
GRAVA = "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int+bitexact,format=yuv420p"
info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                  "stream=width,height,r_frame_rate", "-of", "json", a.entrada],
                                 capture_output=True, text=True, check=True).stdout)["streams"][0]
W, H = info["width"], info["height"]
num, den = map(int, info["r_frame_rate"].split("/"))
fps = num / den
bruto = subprocess.run(["ffmpeg", "-v", "error", "-i", a.entrada, "-vf", LE, "-f", "rawvideo", "-"],
                       capture_output=True, check=True).stdout
quadros = list(np.frombuffer(bruto, np.uint8).reshape(-1, H, W, 3))
n = len(quadros)


def regiao(txt):
    ys, xs = txt.split(",")
    y0, y1 = map(int, ys.split(":"))
    x0, x1 = map(int, xs.split(":"))
    return y0, y1, x0, x1


def media(f, r):
    y0, y1, x0, x1 = r
    return f[y0:y1, x0:x1].reshape(-1, 3).astype(np.float64).mean(0)


def suaviza(v, janela=9):
    out = v.copy()
    h = janela // 2
    for i in range(len(v)):
        out[i] = v[max(0, i - h):min(len(v), i + h + 1)].mean(0)
    return out


if a.modo == "cor":
    re_, rc = regiao(a.escuro), regiao(a.claro)
    r0, r1 = map(int, a.ref.split(":"))
    E = np.array([media(f, re_) for f in quadros])
    C = np.array([media(f, rc) for f in quadros])
    Et, Ct = E[r0:r1].mean(0), C[r0:r1].mean(0)
    ganho = (Ct - Et) / (C - E)
    desvio = Et - ganho * E
    ganho, desvio = suaviza(ganho), suaviza(desvio)
    # chega na identidade sem degrau nos 12 quadros antes de --ate
    for i in range(n):
        if i >= a.ate:
            ganho[i], desvio[i] = 1.0, 0.0
        elif i > a.ate - 12:
            k = (a.ate - i) / 12
            k = k * k * (3 - 2 * k)
            ganho[i] = 1 + (ganho[i] - 1) * k
            desvio[i] = desvio[i] * k
    print("quadro 0: ganho BGR", ganho[0].round(3), "desvio", desvio[0].round(1))

    def trata(i, f):
        return np.clip(f.astype(np.float32) * ganho[i].astype(np.float32) + desvio[i].astype(np.float32), 0, 255).astype(np.uint8)

else:
    ax, ay = map(float, a.ancora.split(","))
    cx, cy = ax * W, ay * H
    ch = sorted((int(q), float(s)) for q, s in (c.split(":") for c in a.chaves.split(",")))
    qs = np.array([q for q, _ in ch], dtype=np.float64)
    ss = np.array([s for _, s in ch])
    # tangentes: zero nas pontas, média das inclinações vizinhas no meio (Hermite cúbica)
    inc = np.diff(ss) / np.diff(qs)
    tg = np.zeros(len(ss))
    for k in range(1, len(ss) - 1):
        tg[k] = 0.0 if inc[k - 1] * inc[k] <= 0 else min(inc[k - 1], inc[k])
    escala = np.empty(n)
    for i in range(n):
        if i <= qs[0]:
            escala[i] = ss[0]
            continue
        if i >= qs[-1]:
            escala[i] = ss[-1]
            continue
        k = int(np.searchsorted(qs, i, side="right") - 1)
        h = qs[k + 1] - qs[k]
        t = (i - qs[k]) / h
        h00, h10, h01, h11 = 2 * t**3 - 3 * t**2 + 1, t**3 - 2 * t**2 + t, -2 * t**3 + 3 * t**2, t**3 - t**2
        escala[i] = h00 * ss[k] + h10 * h * tg[k] + h01 * ss[k + 1] + h11 * h * tg[k + 1]
    print("escala: quadro 0", round(escala[0], 4), "| meio", round(escala[n // 2], 4), "| fim", round(escala[-1], 4))

    def trata(i, f):
        s = escala[i]
        M = np.array([[s, 0, cx * (1 - s)], [0, s, cy * (1 - s)]], dtype=np.float32)
        return cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)


tmp = a.saida + ".video.mp4"
proc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps),
                         "-i", "-", "-vf", GRAVA, "-c:v", "libx264", "-preset", "slow", "-crf", "14",
                         "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", tmp],
                        stdin=subprocess.PIPE)
for i, f in enumerate(quadros):
    proc.stdin.write(trata(i, f).tobytes())
proc.stdin.close()
proc.wait()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-i", a.entrada, "-map", "0:v", "-map", "1:a?", "-c:v", "copy", "-c:a", "copy", a.saida], check=True)
os.remove(tmp)
print("ok", a.saida)
