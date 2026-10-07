"""Áudio da versão 8: a narração inteira numa tomada só (voz-v8/monta-voz.py) com a trilha e os efeitos.
  - voz: assets/audio-v8/voz-v8.wav, a tomada inteira, sem corte;
  - efeitos: os da v2 (no tempo antigo, levados pro tempo da v7 pelo RT) e os das cenas das funcionalidades
    (sfx-funcoes.json, no tempo da v7), todos levados pro tempo da voz nova pelo mapa assets/warp-v8.json, o mesmo que
    o gera.mjs usa no AE;
  - trilha: a mesma (Let's Move, liberada pra esta peça), do tamanho do vídeo novo.
Roda o mixador do kit com a pasta da peça da v2, que é a que tem a trilha liberada (a trava é pelo nome da pasta).
Saída: assets/mix-v8.wav.
Uso: python -B audio-v8.py"""
import json
import os
import subprocess
import sys
import zlib

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.normpath(os.path.join(AQUI, "..", "_kit-motion"))
PECA = os.path.join(KIT, "pecas", "2026-10-09-sufoco-burocratico-v2")
A = os.path.join(AQUI, "assets")
OUT = os.path.join(A, "audio-v8")
N6 = json.load(open(os.path.join(A, "narracao-v6-funcoes.json"), encoding="utf-8"))
WP = json.load(open(os.path.join(A, "warp-v8.json"), encoding="utf-8"))
T_INS, DELTA = N6["T_INS"], N6["DELTA"]
WA, WB = np.array(WP["a"]), np.array(WP["b"])
os.makedirs(OUT, exist_ok=True)


def warp(u):
    if u <= WA[0]:
        return WB[0] + (u - WA[0])
    if u >= WA[-1]:
        return WB[-1] + (u - WA[-1])
    return float(np.interp(u, WA, WB))


RT = lambda t: t + DELTA if t >= T_INS - 1e-6 else t
voz = os.path.join(OUT, "voz-v8.wav")

# eventos: os da v2 (tempo antigo) e os das funcionalidades (tempo da v7), todos pro tempo novo
ev = json.load(open(os.path.join(PECA, "eventos.json"), encoding="utf-8"))
lista = []
for e in ev["eventos"]:
    e = dict(e)
    e["t"] = round(warp(RT(e["t"])), 4)
    lista.append(e)
for k, e in enumerate(json.load(open(os.path.join(A, "audio-v6", "sfx-funcoes.json"), encoding="utf-8"))):
    origem = f"v6-funcionalidades:{k}:{e['som']}"
    lista.append({"t": round(warp(e["t"]), 4), "som": e["som"], "ganhoDb": e["ganhoDb"], "args": e["args"],
                  "semente": zlib.crc32(origem.encode("utf-8")), "origem": origem})
lista = [e for e in lista if e["t"] < WP["duracao"] - 0.05]
lista.sort(key=lambda e: e["t"])
for i, e in enumerate(lista):
    e["ordem"] = i
ev["eventos"] = lista
ev["duracao"] = WP["duracao"]
json.dump(ev, open(os.path.join(OUT, "eventos-v8.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# props: a mesma peça, do tamanho da voz nova
pr = json.load(open(os.path.join(PECA, "props.json"), encoding="utf-8"))
pr["duracao"] = WP["duracao"]
pr["quadros"] = int(round(pr["duracao"] * pr["fps"]))
pr["voz"] = dict(pr["voz"], final=voz)
json.dump(pr, open(os.path.join(OUT, "props-v8.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"voz {voz}; {len(lista)} eventos; {pr['duracao']} s, {pr['quadros']} quadros")

r = subprocess.run([sys.executable, "-B", os.path.join(KIT, "audio", "mixa.py"), PECA,
                    "--props", os.path.join(OUT, "props-v8.json"), "--eventos", os.path.join(OUT, "eventos-v8.json"),
                    "--saida", os.path.join(A, "mix-v8.wav"), "--relatorio"], capture_output=True, text=True)
print(r.stdout[-2500:])
print(r.stderr[-2500:])
sys.exit(r.returncode)
