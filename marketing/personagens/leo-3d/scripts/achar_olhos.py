"""Acha os dois olhos no render ortográfico da cabeça (cabeca_frente.png do bl_medir.py, em cor pura).

Uso: python achar_olhos.py <cabeca_frente.png> [params.json]
Imprime olho_E e olho_D como [x_px, y_px, raio_px] e, com params.json, grava neles.
"olho_E" é o olho esquerdo do Léo, que fica na DIREITA da imagem (ele olha para a câmera).

1. Manchas escuras (luminância < 50) acima do nariz: olhos com a máscara escura em volta, e as orelhas.
2. Par simétrico mais perto do centro: os olhos (as orelhas ficam mais para fora).
3. Raio: só a íris, mais escura que a máscara (luminância < 28 dentro da mancha).
Calibrado em 30/10/2026 no corpo do Tripo: acha (660, 319) e (360, 319), raio da íris uns 58 px.
"""
import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

LIMIAR_MANCHA = 50
LIMIAR_IRIS = 28
AREA_MIN = 3000      # px; tira narinas, pintas e bigodes
ACIMA_DO_NARIZ = 0.42  # fração da altura do quadro


def achar(caminho):
    im = np.asarray(Image.open(caminho).convert("RGBA"), dtype=np.float32)
    luz = im[..., :3] @ np.array([0.299, 0.587, 0.114])
    alfa = im[..., 3] > 200
    h, w = luz.shape
    escuro = (luz < LIMIAR_MANCHA) & alfa
    escuro[int(h * ACIMA_DO_NARIZ):] = False
    escuro = ndimage.binary_opening(escuro, iterations=2)
    rot, n = ndimage.label(escuro)
    cand = []
    for i in range(1, n + 1):
        m = rot == i
        ys, xs = np.nonzero(m)
        if len(xs) < AREA_MIN:
            continue
        iris = m & (luz < LIMIAR_IRIS)
        cand.append({"x": xs.mean(), "y": ys.mean(), "area": len(xs),
                     "r": np.sqrt(max(iris.sum(), 1) / np.pi)})
    pares = []
    for a in cand:
        for b in cand:
            if not (a["x"] > w / 2 > b["x"]):
                continue
            erro = (abs((a["x"] - w / 2) - (w / 2 - b["x"])) + abs(a["y"] - b["y"])) / w
            if erro < 0.04 and a["x"] - b["x"] > 0.15 * w:
                pares.append((a["x"] - b["x"], a, b))
    if not pares:
        sys.exit(f"não achei os dois olhos em {caminho} ({len(cand)} manchas)")
    _, e, d = min(pares, key=lambda p: p[0])   # o par mais de dentro: olhos, não orelhas
    return [round(e["x"]), round(e["y"]), round(e["r"])], [round(d["x"]), round(d["y"]), round(d["r"])]


if __name__ == "__main__":
    e, d = achar(sys.argv[1])
    print("olho_E", e, "olho_D", d)
    if len(sys.argv) > 2:
        P = json.load(open(sys.argv[2], encoding="utf-8"))
        P["olho_E"], P["olho_D"] = e, d
        json.dump(P, open(sys.argv[2], "w", encoding="utf-8"), indent=1)
