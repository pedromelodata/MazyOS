# Tira piscadas em excesso dos takes: nos quadros da piscada, cola o olho aberto de um quadro anterior,
# alinhado pelo focinho, com máscara circular suave dentro da lente e cor casada pelo anel em volta.
import os
import numpy as np, cv2
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_hero = np.asarray(Image.open(os.path.join(ROOT, "hero", "hero-1080.png")).convert("L"))
_reg = cv2.GaussianBlur(_hero[760:960, 420:660].astype(np.float32), (21, 21), 0)
_yy, _xx = np.unravel_index(np.argmin(_reg), _reg.shape)
NY, NX = 760 + _yy, 420 + _xx                      # focinho no herói
TPL = _hero[NY - 40:NY + 40, NX - 60:NX + 60]
EYES = [(437 - NX, 713 - NY), (636 - NX, 706 - NY)]  # olho esq/dir relativos ao focinho
R, FE = 46, 14                                       # raio da máscara e feather (px, take 1080x1920)

# piscadas a remover por take: (segundo local do take, nº de quadros), medidas com olhos3.py (takes v2, 720p)
REMOVER = {
    "T1": [(1.10, 4), (6.43, 2), (6.77, 2), (7.33, 4)],
}
# geometria dos takes v2 (720x1280, frame-herói com as patas): focinho e olhos relativos a ele
V2 = dict(nose=(359, 539), eyes=[(-68, -73), (67, -74)], R=31, FE=9)

def _nose(gray):
    s = 160 if gray.shape[1] > 720 else 100
    win = gray[NY - s:NY + s, NX - s:NX + s]
    r = cv2.matchTemplate(win, TPL, cv2.TM_CCOEFF_NORMED)
    _, _, _, loc = cv2.minMaxLoc(r)
    return NX - s + loc[0] + TPL.shape[1] // 2, NY - s + loc[1] + TPL.shape[0] // 2

def _mask(size):
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32) - (size - 1) / 2
    d = np.sqrt(xx ** 2 + yy ** 2)
    m = np.clip((R - d) / FE + 0.5, 0, 1)
    return (m * m * (3 - 2 * m))[..., None]

def fix(name, frames, fps=30.0):
    ev = REMOVER.get(name, [])
    if not ev: return frames
    global NX, NY, TPL, EYES, R, FE
    if frames.shape[2] == 720:  # takes v2: geometria própria, molde do focinho tirado do próprio take
        g = cv2.cvtColor(np.ascontiguousarray(frames[2]), cv2.COLOR_RGB2GRAY)
        x0, y0 = V2["nose"]
        reg = cv2.GaussianBlur(g[y0 - 50:y0 + 50, x0 - 60:x0 + 60].astype(np.float32), (15, 15), 0)
        yy, xx = np.unravel_index(np.argmin(reg), reg.shape)
        NY, NX = y0 - 50 + yy, x0 - 60 + xx
        TPL = g[NY - 27:NY + 27, NX - 40:NX + 40]
        EYES, R, FE = V2["eyes"], V2["R"], V2["FE"]
    out = np.array(frames)  # cópia gravável
    size = 2 * (R + FE)
    M = _mask(size)
    ring_in, ring_out = R + 2, R + FE + 10
    yy, xx = np.mgrid[0:size + 20, 0:size + 20].astype(np.float32) - (size + 19) / 2
    dd = np.sqrt(xx ** 2 + yy ** 2); RING = (dd > ring_in) & (dd < ring_out)
    for sec, n in ev:
        s = int(round(sec * fps)); k0 = max(0, s - 2)
        g0 = cv2.cvtColor(np.ascontiguousarray(frames[k0]), cv2.COLOR_RGB2GRAY)
        n0 = _nose(g0)
        for i in range(max(0, s - 1), min(len(frames), s + n + 1)):
            w = 0.5 if (i == s - 1 or i == s + n) else 1.0  # entra e sai em meia-força
            gi = cv2.cvtColor(np.ascontiguousarray(frames[i]), cv2.COLOR_RGB2GRAY)
            ni = _nose(gi)
            for ox, oy in EYES:
                sx, sy = n0[0] + ox, n0[1] + oy
                dx, dy = ni[0] + ox, ni[1] + oy
                h = size // 2
                src = frames[k0][sy - h:sy + h, sx - h:sx + h].astype(np.float32)
                dst = out[i][dy - h:dy + h, dx - h:dx + h].astype(np.float32)
                # casa cor pelo anel em volta (fora da máscara)
                h2 = (size + 20) // 2
                srcr = frames[k0][sy - h2:sy + h2, sx - h2:sx + h2].astype(np.float32)
                dstr = frames[i][dy - h2:dy + h2, dx - h2:dx + h2].astype(np.float32)
                off = dstr[RING].mean(0) - srcr[RING].mean(0)
                blend = dst * (1 - M * w) + (src + off) * (M * w)
                out[i][dy - h:dy + h, dx - h:dx + h] = np.clip(blend, 0, 255).astype(np.uint8)
    return out
