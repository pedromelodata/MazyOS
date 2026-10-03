# Versão b-roll: corta cada clipe no trecho que casa com a fala e grava sequência JPEG 1080x1920 a 30 fps
# (o Chromium do render não decodifica H.264) em remotion/public-broll/v/<cena>/NNN.jpg.
# Também grava remotion/src/data/broll-cuts.json (janelas das cenas e tempos dos cortes, lido pelo Broll.tsx e pelo mix_inst.py).
import json, math, os, shutil, subprocess
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
TL = json.load(open(P("remotion", "src", "data", "timeline-inst.json"), encoding="utf-8"))
M, DUR = TL["marks"], TL["dur"]
FPS = 30

# fronteiras de cena (iguais a remotion/src/lib/tli.ts) e duração da transição em cada uma
B = [M["um"] - .12, M["dois"] - .12, M["tres2"] - .12, M["bateu"] - .12, M["cobrar"] - .12, M["app"] - .3]
D = [0.3, 0.3, 0.3, 0.24, 0.3, 0.34]
KIND = ["whipL", "zoomBlur", "whipUp", "flash", "whipL", "zoomBlur"]
# (cena, clipe, início no clipe, filtro de enquadramento 9:16). Rosto só de costas ou fora de quadro.
SEG = [
    ("hook", "b1-gancho.mp4", 3.0, "crop=1080:1920:0:64"),
    ("s1", "b2-clientes.mp4", 0.6, "scale=1080:1920"),
    ("s2", "b3-agenda.mp4", 1.0, "scale=1080:1920"),
    ("s3", "b4-tempo.mp4", 4.0, "scale=-2:1920,crop=1080:1920:(iw-1080)/2:0"),
    ("s4", "b5-reajuste.mp4", 2.0, "scale=1080:1920"),
    ("s5", "b6-cresceu.mp4", 8.8, "crop=864:1536:108:384,scale=1080:1920"),
    ("s6", "b7-comenta.mp4", 0.0, "scale=1080:1920"),   # app (desfocado) + CTA (nítido): mesmo clipe
]
GRADE = "eq=contrast=1.03:saturation=0.94:gamma=0.98"

segs = []
for k, (sid, clip, src_in, vf) in enumerate(SEG):
    t0 = 0.0 if k == 0 else B[k - 1] - D[k - 1] / 2
    t1 = DUR if k == len(SEG) - 1 else B[k] + D[k] / 2
    n = int(math.ceil((t1 - t0) * FPS)) + 2
    segs.append({"id": sid, "clip": clip, "src": src_in, "t0": round(t0, 3), "t1": round(t1, 3), "n": n, "vf": vf})

def extract(s):
    out = P("remotion", "public-broll", "v", s["id"])
    shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
    dur = s["n"] / FPS + 0.2
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{s['src']:.3f}", "-i", P("broll", s["clip"]), "-t", f"{dur:.3f}",
                    "-vf", f"{s['vf']},fps={FPS},{GRADE},format=yuvj420p", "-frames:v", str(s["n"]), "-q:v", "3",
                    "-start_number", "0", os.path.join(out, "%03d.jpg")], check=True)
    got = len(os.listdir(out))
    assert got == s["n"], f"{s['id']}: {got} de {s['n']} quadros"
    return s["id"], got

with ThreadPoolExecutor(4) as ex:
    for sid, got in ex.map(extract, segs): print(sid, got, "quadros")

cuts = {"segments": [{k: s[k] for k in ("id", "t0", "t1", "n")} for s in segs],
        "bounds": [round(b, 3) for b in B], "d": D, "kind": KIND, "whoosh": [round(b, 3) for b in B]}
json.dump(cuts, open(P("remotion", "src", "data", "broll-cuts.json"), "w", encoding="utf-8"), indent=1)
print("broll-cuts.json ok")
