# Léo recortado na linha do tempo global -> remotion/public/leo.webm (VP9 com alfa, 30 fps).
#   python prep_leo.py
import os, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
import numpy as np
sys.argv = [sys.argv[0]]
import render            # leitor de takes, mapeamento de tempo e normalização do fundo
import matte
import timeline

W, H, FPS = 1080, 1920, timeline.FPS
N = int(round(timeline.DUR * FPS))
OUT = render.P("remotion", "public", "leo")  # sequência WebP com alfa (o Remotion lê com <Img>)

def make(k):
    t = k / FPS
    fr = render.normalize_bg(render.leo_frame(t))
    if fr.shape[1] != W:
        import cv2
        fr = cv2.resize(fr, (W, H), interpolation=cv2.INTER_LANCZOS4)
    rgb, a = matte.matte(fr)
    from PIL import Image
    Image.fromarray(np.dstack([rgb, a]), "RGBA").save(os.path.join(OUT, f"{k:04d}.webp"), "WEBP", quality=88, method=3)
    return k

def main():
    import shutil
    shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT, exist_ok=True)
    for tk in render.TAKES: render.take_reader(tk["take"])  # carrega (e corrige piscadas) antes das threads
    t0 = time.time()
    with ThreadPoolExecutor(8) as ex:
        for k in ex.map(make, range(N)):
            if k % 90 == 0: print(f"{k}/{N} {time.time() - t0:.0f}s", flush=True)
    print("ok", OUT, f"{N} quadros")

if __name__ == "__main__":
    main()
