# Separa peças pra animar: selo coral do comprovante (e papel sem selo, com inpaint) e as 2 estrelas da lua.
import numpy as np, cv2
from PIL import Image
def save(arr, nome): Image.fromarray(arr, "RGBA").save(nome); print(nome, arr.shape)

# --- selo do comprovante
c = np.array(Image.open("comprovante.png")); rgb = c[..., :3].astype(np.int32); a = c[..., 3]
hsv = cv2.cvtColor(c[..., :3], cv2.COLOR_RGB2HSV).astype(np.int32)
coral = (a > 128) & (hsv[..., 1] > 90) & ((hsv[..., 0] < 14) | (hsv[..., 0] > 170)) & (hsv[..., 2] > 120)
n, lab, st, cen = cv2.connectedComponentsWithStats(coral.astype(np.uint8))
k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); cx, cy = cen[k]
selo = (lab == k).astype(np.uint8)
# preenche o check branco por dentro e engorda 3 px pra pegar a sombra da borda
n2, lab2 = cv2.connectedComponents(1 - selo)
fora = lab2[0, 0]; selo = (lab2 != fora).astype(np.uint8)
selo = cv2.dilate(selo, np.ones((7, 7), np.uint8))
x, y, w, h = cv2.boundingRect(selo); m = 6
x0, y0, x1, y1 = x - m, y - m, x + w + m, y + h + m
alfa = cv2.GaussianBlur(selo.astype(np.float32), (5, 5), 1.2) * (a / 255.0)
sp = np.dstack([c[y0:y1, x0:x1, :3], (alfa[y0:y1, x0:x1] * 255).astype(np.uint8)])
save(sp, "selo.png")
# papel sem o selo: inpaint na área (engordada)
mask = cv2.dilate(selo, np.ones((13, 13), np.uint8)) * 255
limpo = cv2.inpaint(c[..., :3], mask, 9, cv2.INPAINT_TELEA)
save(np.dstack([limpo, a]), "comprovante-sem-selo.png")
print("selo centro no comprovante:", round(cx), round(cy), "bbox", x0, y0, x1 - x0, y1 - y0)

# --- estrelas da lua
l = np.array(Image.open("lua.png")); a = l[..., 3]
n, lab, st, cen = cv2.connectedComponentsWithStats((a > 100).astype(np.uint8))
ordem = np.argsort(-st[1:, cv2.CC_STAT_AREA]) + 1
lua_k, estrelas = ordem[0], ordem[1:3]
base = l.copy(); base[..., 3] = np.where(cv2.dilate((lab == lua_k).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0, a, 0)
save(base, "lua-sem-estrelas.png")
for i, k in enumerate(sorted(estrelas, key=lambda k: cen[k][1])):
    x, y, w, h = st[k][:4]; m = 8
    s = l[y - m:y + h + m, x - m:x + w + m].copy()
    keep = cv2.dilate((lab[y - m:y + h + m, x - m:x + w + m] == k).astype(np.uint8), np.ones((9, 9), np.uint8))
    s[..., 3] = s[..., 3] * keep
    save(s, f"estrela{i + 1}.png"); print(f"estrela{i + 1} centro na lua:", round(cen[k][0]), round(cen[k][1]))
