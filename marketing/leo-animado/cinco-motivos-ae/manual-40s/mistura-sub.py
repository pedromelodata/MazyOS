"""Desfoque de movimento do celular 3D do reel de 40 s (13/10/2026): o Remotion renderiza o Celular40Nota a 240
quadros por segundo e aqui cada 8 subquadros viram 1 quadro de 30 (obturador de 360 graus). É o mistura-120-30.py do
sufoco-linha-ae com o número de subquadros como parâmetro: com 4, a entrada rápida do celular saía em 3 ou 4 cópias.
A média é feita com o alfa pré-multiplicado e desfeita no fim, senão a borda do aparelho escurece ou clareia.
Uso: PYW -B mistura-sub.py <pasta (element-NNN.png)> <pasta de saída (cel_NNNN.png)> [subquadros, padrão 8]"""
import glob
import os
import sys

import cv2
import numpy as np

ENT, SAI = sys.argv[1], sys.argv[2]
SUB = int(sys.argv[3]) if len(sys.argv) > 3 else 8
os.makedirs(SAI, exist_ok=True)
fs = sorted(glob.glob(os.path.join(ENT, "element-*.png")))
n = len(fs) // SUB
for k in range(n):
    acc = None
    for f in fs[SUB * k:SUB * k + SUB]:
        im = cv2.imread(f, cv2.IMREAD_UNCHANGED).astype(np.float32) / 255.0
        a = im[..., 3:4]
        pm = np.concatenate([im[..., :3] * a, a], axis=2)
        acc = pm if acc is None else acc + pm
    acc /= float(SUB)
    a = acc[..., 3:4]
    rgb = np.where(a > 1e-4, acc[..., :3] / np.maximum(a, 1e-4), 0.0)
    out = np.concatenate([rgb, a], axis=2)
    cv2.imwrite(os.path.join(SAI, f"cel_{k:04d}.png"), np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8))
print(f"{n} quadros de 30 fps a partir de {len(fs)} subquadros ({SUB} por quadro)")
