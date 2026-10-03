"""md5 dos pixels (RGB(A) decodificado) de PNG e diferença entre dois conjuntos de stills."""
import sys, os, json, hashlib, glob
sys.dont_write_bytecode = True
import numpy as np
from PIL import Image

def px(caminho):
    with Image.open(caminho) as im:
        return np.asarray(im.convert("RGBA"))

def md5px(a):
    return hashlib.md5(a.tobytes()).hexdigest()

def compara(dir_a, dir_b, padrao="KitMotion-*.png"):
    res = []
    for fa in sorted(glob.glob(os.path.join(dir_a, padrao))):
        nome = os.path.basename(fa)
        fb = os.path.join(dir_b, nome)
        if not os.path.isfile(fb):
            res.append({"arquivo": nome, "falta": True}); continue
        a = px(fa).astype(np.int16); b = px(fb).astype(np.int16)
        d = np.abs(a - b)
        res.append({"arquivo": nome, "md5A": md5px(a.astype(np.uint8)), "md5B": md5px(b.astype(np.uint8)),
                    "igual": bool((d == 0).all()), "maximo": int(d.max()), "media": float(d.mean()),
                    "pxDiferentes": int((d.max(axis=2) > 0).sum()), "pxAcimaDe4": int((d.max(axis=2) > 4).sum())})
    return res

if __name__ == "__main__":
    r = compara(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "KitMotion-*.png")
    for x in r:
        if x.get("falta"): print("FALTA", x["arquivo"]); continue
        print("%-22s %s max %3d media %.5f px!=0 %7d px>4 %6d" % (x["arquivo"], "IGUAL " if x["igual"] else "DIFERE", x["maximo"], x["media"], x["pxDiferentes"], x["pxAcimaDe4"]))
    if len(sys.argv) > 4:
        sys.path.insert(0, "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/lib")
        import escrita
        escrita.grava_json(sys.argv[4], {"a": sys.argv[1], "b": sys.argv[2], "itens": r}, cria_pasta=True)
