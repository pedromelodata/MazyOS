"""Quadro-chave com a tela real do app: cola a tela no celular de tela verde de UMA imagem e tira todo o verde.

Serve pra gerar o vídeo direto com a tela do app (o modelo recebe o quadro inicial e o final já com a tela certa),
em vez de compor a tela no vídeo inteiro depois.

- cantos da tela pelo menor retângulo que cobre o verde (recupera o canto que o dedo cobre)
- a tela do app entra 1,5% maior que esse retângulo, então nenhuma beirada verde sobra
- o dedo na frente da tela fica (não é verde); o verde que vazou na borda do dedo e do aro sai
- opcional: um botão apertado (o retângulo escurece)

Uso (venv do corte-viral):
  python -I quadro_com_tela.py VERDE.png TELA.png SAIDA.png [--toque=x0,y0,x1,y1]
  (o retângulo do toque em fração da tela do app)
"""
import sys

import cv2
import numpy as np

verde_png, tela_png, saida = sys.argv[1], sys.argv[2], sys.argv[3]
toque = None
for a in sys.argv[4:]:
    if a.startswith("--toque="):
        toque = [float(v) for v in a[8:].split(",")]

im = cv2.imread(verde_png).astype(np.float32)
H, W = im.shape[:2]
ui = cv2.imread(tela_png)
uh, uw = ui.shape[:2]
if toque:
    x0, y0, x1, y1 = toque
    ui = ui.copy()
    ui[int(y0 * uh):int(y1 * uh), int(x0 * uw):int(x1 * uw)] = (
        ui[int(y0 * uh):int(y1 * uh), int(x0 * uw):int(x1 * uw)].astype(np.float32) * 0.86).astype(np.uint8)

b, g, r = im[..., 0], im[..., 1], im[..., 2]
exc = g - np.maximum(r, b)
duro = ((exc > 38) & (g > 90)).astype(np.uint8)
duro = cv2.morphologyEx(duro, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(duro)
k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
pts = np.column_stack(np.where(lab == k))[:, ::-1].astype(np.float32)
ret = cv2.minAreaRect(cv2.convexHull(pts))
q = cv2.boxPoints(ret).astype(np.float32)
# ordem tl, tr, br, bl com o topo da tela pra cima
c = q.mean(axis=0)
q = q[np.argsort(np.arctan2(q[:, 1] - c[1], q[:, 0] - c[0]))]
q = np.roll(q, -int(np.argmin(q.sum(axis=1))), axis=0)
larg = (np.linalg.norm(q[1] - q[0]) + np.linalg.norm(q[2] - q[3])) / 2
alt = (np.linalg.norm(q[3] - q[0]) + np.linalg.norm(q[2] - q[1])) / 2
print("tela verde:", q.round(1).tolist(), "| proporção", round(larg / alt, 4), "(app", round(uw / uh, 4), ")")

q2 = c + (q - c) * 1.015
pad_w, pad_h = int(round(uw * 0.01)), int(round(uh * 0.01))
ui_p = cv2.copyMakeBorder(ui, pad_h, pad_h, pad_w, pad_w, cv2.BORDER_REPLICATE)
ph, pw = ui_p.shape[:2]
# reduz por área antes do warp (o texto pequeno não some)
alvo_w, alvo_h = int(larg * 1.05) * 2, int(alt * 1.05) * 2
ui_p = cv2.resize(ui_p, (alvo_w, alvo_h), interpolation=cv2.INTER_AREA)
ph, pw = ui_p.shape[:2]
M = cv2.getPerspectiveTransform(np.array([[0, 0], [pw, 0], [pw, ph], [0, ph]], np.float32), q2)
tela = cv2.warpPerspective(ui_p, M, (W, H), flags=cv2.INTER_AREA).astype(np.float32)
tela = cv2.GaussianBlur(tela, (0, 0), 0.7)
tela += np.random.default_rng(7).normal(0, 2.2, tela.shape[:2])[..., None]
tela *= np.array([0.90, 0.93, 0.95], np.float32)

# alfa: verde forte = 1; borda macia
alfa = np.clip((exc - 12) / 40, 0, 1)
alfa = cv2.GaussianBlur(alfa, (0, 0), 1.0)
dentro = np.zeros((H, W), np.float32)
cv2.fillConvexPoly(dentro, q2.astype(np.int32), 1.0)
alfa = alfa * cv2.GaussianBlur(cv2.dilate(dentro, np.ones((15, 15), np.uint8)), (0, 0), 2)

# tira o verde que vazou: na pele o verde fica a uns 45% do caminho entre o azul e o vermelho
anel = cv2.dilate((alfa > 0.01).astype(np.uint8), np.ones((61, 61), np.uint8)).astype(bool)
# fora da pele, o verde vai pra média de vermelho e azul: com a luz fria da TV na borda do dedo, levar pro maior dos
# dois (o azul) deixava um contorno ciano
neutro = (r + b) / 2 + 2
pele = b + 0.45 * (r - b) + 3
teto = np.where((r > b + 15) & (np.maximum(np.maximum(r, g), b) > 60), np.maximum(pele, (r + b) / 2 + 4), neutro)
g2 = np.where(anel & (g > teto), teto, g)
limpo = im.copy()
limpo[..., 1] = g2
out = limpo * (1 - alfa[..., None]) + tela * alfa[..., None]
out = np.clip(out, 0, 255).astype(np.uint8)
cv2.imwrite(saida, out)
o = out.astype(np.int16)
sobra = int(((o[..., 1] - np.maximum(o[..., 0], o[..., 2]) > 25) & (o[..., 1] > 80)).sum())
print("ok", saida, "| pixels ainda esverdeados:", sobra)
