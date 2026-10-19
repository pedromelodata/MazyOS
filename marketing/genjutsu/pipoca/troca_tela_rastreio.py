"""Troca a tela de um celular que sai pela borda do quadro, seguindo o aparelho por ECC (afim) a partir do 1º quadro.

Quando a tela está cortada pela borda, a detecção por cor não fecha o quadrilátero. Aqui a tela é marcada uma vez no
1º quadro (os 4 cantos, os de baixo podem ficar fora da imagem: a altura sai da proporção do app) e o celular é
seguido quadro a quadro como objeto rígido.

Uso (venv do corte-viral):
  python -I troca_tela_rastreio.py ENTRADA.mp4 SAIDA.mp4 TELA.png "x,y x,y x,y x,y" X0,Y0,X1,Y1
  (cantos da tela no 1º quadro em tl tr br bl; X0..Y1: caixa do aparelho visível no 1º quadro, que vira o molde)
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

entrada, saida, tela_png = sys.argv[1], sys.argv[2], sys.argv[3]
q0 = np.array([[float(v) for v in p.split(",")] for p in sys.argv[4].split()], np.float32)
bx0, by0, bx1, by1 = map(int, sys.argv[5].split(","))
LE = "scale=in_color_matrix=bt709:in_range=tv:flags=accurate_rnd+full_chroma_int+bitexact,format=bgr24"
GRAVA = "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int+bitexact,format=yuv420p"
info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                  "stream=width,height,r_frame_rate", "-of", "json", entrada],
                                 capture_output=True, text=True, check=True).stdout)["streams"][0]
W, H = info["width"], info["height"]
num, den = map(int, info["r_frame_rate"].split("/"))
fps = num / den
bruto = subprocess.run(["ffmpeg", "-v", "error", "-i", entrada, "-vf", LE, "-f", "rawvideo", "-"],
                       capture_output=True, check=True).stdout
quadros = np.frombuffer(bruto, np.uint8).reshape(-1, H, W, 3)
ui = cv2.imread(tela_png)

# o celular se move quase só em translação (a câmera gira em volta do homem e o aparelho fica de frente pra lente):
# casa um molde do aparelho (a parte de cima, que nunca sai do quadro) com escala de 0,94 a 1,06 em volta da posição
# anterior. O ECC afim com máscara divergia aqui por causa do fundo que anda diferente (paralaxe)
cinza = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in quadros]
molde = cinza[0][by0:by1, bx0:bx1]
mh, mw = molde.shape
escalas = np.linspace(0.94, 1.06, 13)
quads, pos, esc = [q0], np.array([bx0, by0], np.float32), 1.0
for i in range(1, len(quadros)):
    melhor = (-2, None, None)
    for e in escalas * esc if i > 1 else escalas:
        e = float(np.clip(e, 0.85, 1.15))
        mt = cv2.resize(molde, (max(8, int(mw * e)), max(8, int(mh * e))), interpolation=cv2.INTER_AREA)
        sx0, sy0 = int(max(0, pos[0] - 40)), int(max(0, pos[1] - 40))
        sx1, sy1 = int(min(W, pos[0] + mt.shape[1] + 40)), int(min(H, pos[1] + mt.shape[0] + 40))
        busca = cinza[i][sy0:sy1, sx0:sx1]
        if busca.shape[0] < mt.shape[0] or busca.shape[1] < mt.shape[1]:
            continue
        r = cv2.matchTemplate(busca, mt, cv2.TM_CCOEFF_NORMED)
        _, v, _, loc = cv2.minMaxLoc(r)
        if v > melhor[0]:
            melhor = (v, np.array([sx0 + loc[0], sy0 + loc[1]], np.float32), e)
    if melhor[1] is not None:
        pos, esc = melhor[1], melhor[2]
    q = (q0 - np.array([bx0, by0], np.float32)) * esc + pos
    quads.append(q.astype(np.float32))
arr = np.array(quads)
lis = arr.copy()
for i in range(len(arr)):
    lis[i] = arr[max(0, i - 2):i + 3].mean(axis=0)
print(len(quadros), "quadros; tela no último:", lis[-1].round(1).tolist())

if "--quadros" in sys.argv:
    pasta = os.path.join(os.path.dirname(os.path.abspath(saida)), "_qc")
    os.makedirs(pasta, exist_ok=True)
    tiles = []
    for i in range(0, len(quadros), max(1, len(quadros) // 8)):
        v = quadros[i].copy()
        cv2.polylines(v, [lis[i].astype(np.int32)], True, (0, 255, 255), 2)
        tiles.append(cv2.resize(v, (320, 180)))
    cv2.imwrite(os.path.join(pasta, os.path.basename(saida) + "_rastreio.jpg"), np.hstack(tiles))
    sys.exit(0)

tmp = saida + ".video.mp4"
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps),
                      "-i", "-", "-vf", GRAVA, "-c:v", "libx264", "-preset", "slow", "-crf", "14",
                      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", tmp],
                     stdin=subprocess.PIPE)
for i, f in enumerate(quadros):
    q = lis[i].copy()
    c = q.mean(axis=0)
    q = c + (q - c) * 1.03
    larg = int(np.linalg.norm(q[1] - q[0]))
    alt = int(np.linalg.norm(q[3] - q[0]))
    pequena = cv2.resize(ui, (max(8, larg * 2), max(8, alt * 2)), interpolation=cv2.INTER_AREA)
    ph, pw = pequena.shape[:2]
    M = cv2.getPerspectiveTransform(np.array([[0, 0], [pw, 0], [pw, ph], [0, ph]], np.float32), q)
    tela = cv2.warpPerspective(pequena, M, (W, H), flags=cv2.INTER_AREA).astype(np.float32)
    mask = np.zeros((H, W), np.float32)
    cv2.fillConvexPoly(mask, q.astype(np.int32), 1.0)
    mask = cv2.GaussianBlur(mask, (0, 0), 0.8)
    tela = cv2.GaussianBlur(tela, (0, 0), 0.6)
    tela += np.random.default_rng(i).normal(0, 2.0, tela.shape[:2])[..., None]
    tela *= np.array([0.95, 0.96, 0.97], np.float32)
    out = f.astype(np.float32) * (1 - mask[..., None]) + tela * mask[..., None]
    p.stdin.write(np.clip(out, 0, 255).astype(np.uint8).tobytes())
p.stdin.close()
p.wait()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-i", entrada, "-map", "0:v", "-map", "1:a?", "-c:v", "copy",
                "-c:a", "copy", saida], check=True)
os.remove(tmp)
print("ok", saida)
