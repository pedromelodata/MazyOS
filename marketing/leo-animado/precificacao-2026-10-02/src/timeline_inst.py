# Linha do tempo das versões SEM o Léo (b-roll e motion): narração institucional ("a gente fica de olho"),
# frases da legenda estilo Apple e marcas de tempo com nome. -> remotion/src/data/timeline-inst.json
import json, os
import numpy as np
from timeline import load_audio, silences, P, FPS

NARR = P("vo", "narr-inst.wav")
WORDS_JSON = P("vo", "words-inst.json")
SCRIPT = ("Três sinais de que você já pode cobrar mais caro Um seus clientes nunca reclamam do preço "
          "Dois sua agenda vive cheia meses à frente Três você cobra o mesmo valor de dois anos atrás "
          "Bateu dois Tá na hora de reajustar Cobrar mais é o seu negócio dizendo que cresceu "
          "E no app que tá chegando a gente fica de olho no teto do MEI de 81 mil por ano "
          "Comenta aqui quais desses sinais você tem").split()

ws = json.load(open(WORDS_JSON, encoding="utf-8"))
assert len(ws) == len(SCRIPT), f"whisper deu {len(ws)} palavras, roteiro tem {len(SCRIPT)}"
x = load_audio(NARR)
for w in ws:
    for a, b in silences(x):
        if a - 0.01 <= w["s"] < b - 0.02: w["s"] = b
for i in range(len(ws) - 1):
    ws[i]["e"] = max(ws[i]["e"], ws[i]["s"] + 0.05)
T = lambda i: ws[i]["s"]
END_T0 = ws[-1]["e"] + 0.15
DUR = END_T0 + 0.35

SHOW = {0: "3", 10: "Um:", 11: "seus", 23: "à", 17: "Dois:", 18: "sua", 25: "Três:", 26: "você", 36: "dois?", 67: "81", 72: "aqui:", 77: "tem?", 53: "app"}
show = lambda i: SHOW.get(i, ws[i]["w"].strip().rstrip("."))
PHRASES = [
    dict(w=list(range(0, 10)), key=9, title=True),
    dict(w=list(range(10, 17)), key=13),
    dict(w=list(range(17, 25)), key=21),
    dict(w=list(range(25, 35)), key=29),
    dict(w=[35, 36], key=36),
    dict(w=list(range(37, 42)), key=41),
    dict(w=list(range(42, 51)), key=50),
    dict(w=list(range(51, 66)), key=61),
    dict(w=list(range(66, 71)), key=67),
    dict(w=list(range(71, 78)), key=77),
]
MARK = {"tres": 0, "sinais": 1, "caro": 9, "um": 10, "seus": 11, "clientes": 12, "nunca": 13, "preco": 16, "sua": 18, "vive": 20, "hora": 39, "e": 51, "voce2": 76,
        "dois": 17, "agenda": 19, "cheia": 21, "meses": 22, "frente": 24, "tres2": 25, "cobra": 27, "mesmo": 29,
        "doisanos": 32, "anos": 33, "atras": 34, "bateu": 35, "doisq": 36, "ta": 37, "reajustar": 41,
        "cobrar": 42, "negocio": 47, "cresceu": 50, "app": 53, "chegando": 56, "gente": 58, "olho": 61,
        "teto": 63, "mei": 65, "n81": 67, "ano": 70, "comenta": 71, "quais": 73, "sinaisq": 75, "tem": 77}

out = {
    "fps": FPS, "dur": round(DUR, 3), "frames": int(round(DUR * FPS)), "endT0": round(END_T0, 3),
    "words": [{"i": i, "t": show(i), "s": round(w["s"], 3), "e": round(w["e"], 3)} for i, w in enumerate(ws)],
    "phrases": [{"w": p["w"], "key": p["key"], "title": p.get("title", False),
                 "s": round(T(p["w"][0]), 3), "e": round(ws[p["w"][-1]]["e"], 3)} for p in PHRASES],
    "marks": {k: round(T(i), 3) for k, i in MARK.items()},
}
for k in range(len(out["phrases"]) - 1):
    out["phrases"][k]["out"] = out["phrases"][k + 1]["s"]
out["phrases"][-1]["out"] = round(DUR + 1, 3)
dst = P("remotion", "src", "data", "timeline-inst.json")
json.dump(out, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(dst, f"DUR={DUR:.2f}s")
