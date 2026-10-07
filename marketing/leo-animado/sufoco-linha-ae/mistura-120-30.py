"""Desfoque de movimento do celular 3D: o Remotion renderiza a 120 quadros por segundo e aqui cada 4 subquadros
viram 1 quadro de 30 (obturador de 360 graus). A média é feita com o alfa pré-multiplicado e desfeita no fim,
senão a borda do aparelho escurece ou clareia contra o fundo.
Uso: python mistura-120-30.py <pasta 120 fps (element-NNNN.png)> <pasta de saída (cel_NNNN.png)>"""
import glob
import os
import sys

import cv2
import numpy as np

ENT, SAI = sys.argv[1], sys.argv[2]
os.makedirs(SAI, exist_ok=True)
fs = sorted(glob.glob(os.path.join(ENT, "element-*.png")))
n = len(fs) // 4
for k in range(n):
    acc = None
    for f in fs[4 * k:4 * k + 4]:
        im = cv2.imread(f, cv2.IMREAD_UNCHANGED).astype(np.float32) / 255.0
        a = im[..., 3:4]
        pm = np.concatenate([im[..., :3] * a, a], axis=2)
        acc = pm if acc is None else acc + pm
    acc /= 4.0
    a = acc[..., 3:4]
    rgb = np.where(a > 1e-4, acc[..., :3] / np.maximum(a, 1e-4), 0.0)
    out = np.concatenate([rgb, a], axis=2)
    cv2.imwrite(os.path.join(SAI, f"cel_{k:04d}.png"), np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8))
print(f"{n} quadros de 30 fps a partir de {len(fs)} de 120")
