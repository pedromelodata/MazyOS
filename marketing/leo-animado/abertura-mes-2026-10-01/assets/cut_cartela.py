# Recorta os 3 objetos clay da cartela (comprovante, pasta, lua). O fundo creme é liso (desvio ~1),
# então o fundo é o que está a menos de LIM do creme E ligado à borda; buracos internos são preenchidos.
import numpy as np, cv2
from PIL import Image
LIM = float(__import__("sys").argv[1]) if len(__import__("sys").argv) > 1 else 5.0
im = np.array(Image.open("cartela-clay.png").convert("RGB")).astype(np.float32)
H, W, _ = im.shape
borda = np.concatenate([im[:8].reshape(-1, 3), im[-8:].reshape(-1, 3), im[:, :8].reshape(-1, 3), im[:, -8:].reshape(-1, 3)])
bg = np.median(borda, 0)
d = np.sqrt(((im - bg) ** 2).sum(2))
seed = (d < LIM).astype(np.uint8)
n, lab = cv2.connectedComponents(seed, connectivity=4)
toca = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
fundo = np.isin(lab, list(toca))
obj = (~fundo).astype(np.uint8)
# preenche buracos: o que não é objeto e não toca a borda vira objeto
n2, lab2 = cv2.connectedComponents(1 - obj, connectivity=4)
toca2 = set(np.unique(np.concatenate([lab2[0], lab2[-1], lab2[:, 0], lab2[:, -1]]))) - {0}
obj = (~np.isin(lab2, list(toca2))).astype(np.uint8)
obj = cv2.morphologyEx(obj, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
# borda suave: alfa pela distância de cor numa faixa de 2 px em volta do contorno
dil = cv2.dilate(obj, np.ones((5, 5), np.uint8)); ero = cv2.erode(obj, np.ones((5, 5), np.uint8))
faixa = (dil > 0) & (ero == 0)
a = obj.astype(np.float32)
a[faixa] = np.clip((d[faixa] - 1.5) / (LIM + 4 - 1.5), 0, 1)
a = cv2.GaussianBlur(a, (3, 3), 0.7)
cols = (obj > 0).any(0); xs = np.where(cols)[0]
groups = []; s = p = xs[0]
for x in xs[1:]:
    if x - p > 40: groups.append((s, p)); s = x
    p = x
groups.append((s, p)); groups = [g for g in groups if g[1] - g[0] > 100]
print("grupos x:", groups)
for (x0, x1), nome in zip(groups, ["comprovante", "pasta", "lua"]):
    sub = obj[:, x0:x1 + 1]; ys = np.where(sub.any(1))[0]; m = 20
    Y0, Y1, X0, X1 = max(0, ys[0] - m), min(H, ys[-1] + m + 1), max(0, x0 - m), min(W, x1 + m + 1)
    out = np.dstack([im[Y0:Y1, X0:X1].astype(np.uint8), (a[Y0:Y1, X0:X1] * 255).astype(np.uint8)])
    Image.fromarray(out, "RGBA").save(f"{nome}.png"); print(nome, out.shape)
