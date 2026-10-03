# Reações do Léo (sem fala) pra versão com o Léo: janelas de boca fechada dos takes do reel de 02/10
# (medidas em takes/boca.json + revisão visual), recortadas com o mesmo matte e a mesma correção de olhos.
#   python prep_leo_reacoes.py  -> remotion/public-abertura/leo/<take>/<quadro>.webp (720x1280 RGBA)
import os, sys, shutil
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image

SRC = r"C:\MKT-INSTA\Content Legalizai\marketing\leo-animado\precificacao-2026-10-02\src"
sys.path.insert(0, SRC)
sys.argv = [sys.argv[0]]
import render  # leitor dos takes (com olhos_fix) e normalização do fundo
import matte

OUT = r"C:\MKT-INSTA\Content Legalizai\marketing\leo-animado\precificacao-2026-10-02\remotion\public-abertura\leo"
# take: (primeiro quadro, último quadro) inclusive, a 30 fps
JANELAS = {"T1": (221, 299), "T2": (205, 269), "T3": (150, 269), "T4": (85, 119)}


def main():
    shutil.rmtree(OUT, ignore_errors=True)
    jobs = []
    for tk, (a, b) in JANELAS.items():
        rd = render.take_reader(tk)
        os.makedirs(os.path.join(OUT, tk), exist_ok=True)
        jobs += [(tk, rd, k) for k in range(a, b + 1)]

    def make(job):
        tk, rd, k = job
        fr = render.normalize_bg(rd.frames[min(k, len(rd.frames) - 1)])
        rgb, al = matte.matte(fr)
        Image.fromarray(np.dstack([rgb, al]), "RGBA").save(os.path.join(OUT, tk, f"{k:03d}.webp"), "WEBP", quality=88, method=3)
        return 1

    with ThreadPoolExecutor(8) as ex:
        n = sum(ex.map(make, jobs))
    print("ok", n, "quadros em", OUT)


if __name__ == "__main__":
    main()
