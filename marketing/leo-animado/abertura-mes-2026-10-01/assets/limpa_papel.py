# Papel sem o selo: superfície quadrática ajustada só em pixels de papel ao redor (exclui barras bege,
# código de barras e selo), mais grão fino no nível do papel. Borda do preenchimento esfumada.
import numpy as np, cv2
from PIL import Image
c = np.array(Image.open("comprovante.png")); rgb = c[..., :3].astype(np.float32); a = c[..., 3]
s = np.array(Image.open("selo.png"))[..., 3] > 30
x0, y0 = 370, 655
mask = np.zeros(a.shape, np.uint8); mask[y0:y0 + s.shape[0], x0:x0 + s.shape[1]][s] = 1
mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
mask &= (a > 250).astype(np.uint8)
anel = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (121, 121))) & (1 - mask) & (a > 250)
hsv = cv2.cvtColor(c[..., :3], cv2.COLOR_RGB2HSV)
papel = anel.astype(bool) & (hsv[..., 2] > 205) & (hsv[..., 1] < 40)
ys, xs = np.where(papel)
X = np.stack([np.ones_like(xs), xs, ys, xs * xs, ys * ys, xs * ys], 1).astype(np.float64)
H, W = a.shape; yy, xx = np.mgrid[0:H, 0:W]
Xa = np.stack([np.ones_like(xx), xx, yy, xx * xx, yy * yy, xx * yy], -1).astype(np.float64)
surf = np.zeros_like(rgb)
for ch in range(3):
    coef, *_ = np.linalg.lstsq(X, rgb[ys, xs, ch].astype(np.float64), rcond=None)
    surf[..., ch] = Xa @ coef
# grão: desvio do papel real em passa-alta
hp = rgb - cv2.GaussianBlur(rgb, (0, 0), 3)
sd = 1.4826 * np.median(np.abs(hp[papel] - np.median(hp[papel], 0)), 0)
rng = np.random.default_rng(3)
g = cv2.GaussianBlur(rng.standard_normal((H, W)).astype(np.float32), (0, 0), 1.2)
g = g / g.std()
fill = surf + g[..., None] * sd[None, None, :]
w = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 5)[..., None]
out = rgb * (1 - w) + fill * w
Image.fromarray(np.dstack([np.clip(out, 0, 255).astype(np.uint8), a]), "RGBA").save("comprovante-sem-selo.png")
print("pixels de papel usados:", len(xs), "grão sd", sd.round(2))
