"""Troca a tela que o modelo desenhou num celular (texto embaralhado) pela tela real do app, quadro a quadro.

Pra celular parado ou andando devagar no quadro, com tela clara dentro do aro preto:
- acha a tela como o maior pedaço "não escuro" dentro de uma janela em volta da posição anterior
  (o aro preto separa a tela do fundo claro)
- cantos pelo casco simplificado até 4 pontos, suavizados no tempo
- a tela do app entra por perspectiva, com a mesma maciez e o mesmo grão da imagem

Uso (venv do corte-viral):
  python -I troca_tela_celular.py ENTRADA.mp4 SAIDA.mp4 TELA.png X0,Y0,X1,Y1
  (X0,Y0,X1,Y1: caixa aproximada da tela no primeiro quadro)
  --cortado-embaixo   celular que sai pela borda de baixo: a altura da tela vem da proporção da tela do app
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

entrada, saida, tela_png = sys.argv[1], sys.argv[2], sys.argv[3]
x0, y0, x1, y1 = map(int, sys.argv[4].split(","))
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
uh, uw = ui.shape[:2]


def ordena(q):
    c = q.mean(axis=0)
    q = q[np.argsort(np.arctan2(q[:, 1] - c[1], q[:, 0] - c[0]))]
    k = int(np.argmin(q.sum(axis=1)))
    return np.roll(q, -k, axis=0)


def acha_tela(f, caixa):
    a0, b0, a1, b1 = caixa
    pad = 40
    a0, b0 = max(0, a0 - pad), max(0, b0 - pad)
    a1, b1 = min(W, a1 + pad), min(H, b1 + pad)
    janela = f[b0:b1, a0:a1].astype(np.int16)
    nao_escuro = (janela.max(axis=2) > 95).astype(np.uint8)
    nao_escuro = cv2.morphologyEx(nao_escuro, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(nao_escuro)
    if n < 2:
        return None
    # o pedaço mais perto do centro da caixa anterior e com área parecida
    cx, cy = (caixa[0] + caixa[2]) / 2 - a0, (caixa[1] + caixa[3]) / 2 - b0
    area_ant = (caixa[2] - caixa[0]) * (caixa[3] - caixa[1])
    melhor, nota = None, 1e18
    for k in range(1, n):
        ar = st[k, cv2.CC_STAT_AREA]
        if ar < 0.3 * area_ant or ar > 2.5 * area_ant:
            continue
        d = (cen[k][0] - cx) ** 2 + (cen[k][1] - cy) ** 2 + abs(ar - area_ant) * 0.5
        if d < nota:
            melhor, nota = k, d
    if melhor is None:
        return None
    pts = np.column_stack(np.where(lab == melhor))[:, ::-1].astype(np.float32) + np.array([a0, b0], np.float32)
    casco = cv2.convexHull(pts)
    peri = cv2.arcLength(casco, True)
    for eps in np.linspace(0.01, 0.12, 23):
        ap = cv2.approxPolyDP(casco, eps * peri, True)
        if len(ap) <= 4:
            break
    if len(ap) != 4:
        r = cv2.minAreaRect(casco)
        ap = cv2.boxPoints(r)[:, None, :]
    return ordena(ap[:, 0, :].astype(np.float32))


CORTADO = "--cortado-embaixo" in sys.argv
PROP = uw / uh


def completa_embaixo(q):
    """Celular saindo pela borda de baixo: os cantos de baixo achados estão na borda da imagem. Mantém os de cima e as
    direções das laterais e estica cada lateral até a altura que a proporção da tela do app pede."""
    tl, tr, br, bl = q
    larg = np.linalg.norm(tr - tl)
    alt = larg / PROP
    de = (bl - tl) / max(1e-6, np.linalg.norm(bl - tl))
    dd = (br - tr) / max(1e-6, np.linalg.norm(br - tr))
    return np.array([tl, tr, tr + dd * alt, tl + de * alt], np.float32)


cs, caixa = [], (x0, y0, x1, y1)
for f in quadros:
    q = acha_tela(f, caixa)
    if q is not None and CORTADO:
        caixa_vis = (int(q[:, 0].min()), int(q[:, 1].min()), int(q[:, 0].max()), int(q[:, 1].max()))
        q = completa_embaixo(q)
        cs.append(q)
        caixa = caixa_vis
        continue
    if q is None:
        q = cs[-1] if cs else None
    cs.append(q)
    if q is not None:
        caixa = (int(q[:, 0].min()), int(q[:, 1].min()), int(q[:, 0].max()), int(q[:, 1].max()))
arr = np.array(cs, dtype=np.float32)
lis = arr.copy()
for i in range(len(arr)):
    lis[i] = arr[max(0, i - 2):i + 3].mean(axis=0)
print(len(quadros), "quadros; tela no 1º quadro:", lis[0].round(1).tolist(), "no último:", lis[-1].round(1).tolist())

if "--quadros" in sys.argv:
    pasta = os.path.join(os.path.dirname(os.path.abspath(saida)), "_qc")
    os.makedirs(pasta, exist_ok=True)
    tiles = []
    for i in range(0, len(quadros), max(1, len(quadros) // 8)):
        v = quadros[i].copy()
        cv2.polylines(v, [lis[i].astype(np.int32)], True, (0, 255, 255), 2)
        c = lis[i].mean(axis=0).astype(int)
        v = v[max(0, c[1] - 220):c[1] + 220, max(0, c[0] - 200):c[0] + 200]
        tiles.append(cv2.resize(v, (300, 330)))
    cv2.imwrite(os.path.join(pasta, os.path.basename(saida) + "_tela.jpg"), np.hstack(tiles))
    sys.exit(0)

src = np.array([[0, 0], [uw, 0], [uw, uh], [0, uh]], np.float32)
tmp = saida + ".video.mp4"
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps),
                      "-i", "-", "-vf", GRAVA, "-c:v", "libx264", "-preset", "slow", "-crf", "14",
                      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", tmp],
                     stdin=subprocess.PIPE)
for i, f in enumerate(quadros):
    # a tela achada fica um pouco pra dentro do vidro (canto arredondado e a beirada do desenho antigo): cresce 4% na
    # largura e 4% na altura, e a borda de baixo desce mais 2%, onde o modelo desenhou um botão que vazava
    q = lis[i].copy()
    c = q.mean(axis=0)
    if CORTADO:
        # cresce só pros lados e pra cima (a tela achada fica pra dentro do canto arredondado do vidro)
        topo = (q[0] + q[1]) / 2
        q = topo + (q - topo) * np.array([1.06, 1.0], np.float32)
        q[0] -= (q[3] - q[0]) * 0.012
        q[1] -= (q[2] - q[1]) * 0.012
    else:
        q = c + (q - c) * np.array([1.06, 1.04], np.float32)
        alt_ = np.linalg.norm(q[3] - q[0])
        q[2, 1] += 0.02 * alt_
        q[3, 1] += 0.02 * alt_
    M = cv2.getPerspectiveTransform(src, q)
    # a tela do app reduzida direto pro tamanho final perde o texto; reduz por área antes do warp
    larg = int(np.linalg.norm(q[1] - q[0]))
    alt = int(np.linalg.norm(q[3] - q[0]))
    pequena = cv2.resize(ui, (max(8, larg * 2), max(8, alt * 2)), interpolation=cv2.INTER_AREA)
    M = cv2.getPerspectiveTransform(np.array([[0, 0], [pequena.shape[1], 0], [pequena.shape[1], pequena.shape[0]],
                                              [0, pequena.shape[0]]], np.float32), q)
    warp = cv2.warpPerspective(pequena, M, (W, H), flags=cv2.INTER_AREA).astype(np.float32)
    mask = np.zeros((H, W), np.float32)
    cv2.fillConvexPoly(mask, q.astype(np.int32), 1.0)
    mask = cv2.GaussianBlur(mask, (0, 0), 0.8)
    warp = cv2.GaussianBlur(warp, (0, 0), 0.6)
    warp += np.random.default_rng(i).normal(0, 2.0, warp.shape[:2])[..., None]
    warp *= np.array([0.94, 0.95, 0.96], np.float32)
    out = f.astype(np.float32) * (1 - mask[..., None]) + warp * mask[..., None]
    p.stdin.write(np.clip(out, 0, 255).astype(np.uint8).tobytes())
p.stdin.close()
p.wait()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-i", entrada, "-map", "0:v", "-map", "1:a?", "-c:v", "copy",
                "-c:a", "copy", saida], check=True)
os.remove(tmp)
print("ok", saida)
