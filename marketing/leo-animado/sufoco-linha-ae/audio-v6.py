"""Áudio da versão 6: o mix da v2 com as cinco falas das funcionalidades depois do "construindo o Legalizaí".
  - voz: a montada pelo voz-v6.py (a da v2 com as falas novas no vão de 20 s)
  - efeitos: os eventos da v2, os de 17,9 s em diante andando 20 s, mais os das cenas novas (sfx-funcoes.json, gravado
    pelo gera.mjs no tempo de cada ação)
  - trilha: a mesma (Let's Move, liberada pra esta peça), que corre 20 s a mais: 20 s = 40 batidas a 120 BPM
Grava assets/audio-v6/ (eventos e props) e roda o mixador do kit com a pasta da peça da v2, que é a que tem a
trilha liberada (a trava é pelo nome da pasta). Saída: assets/mix-v6.wav.
Uso: python -B audio-v6.py"""
import json
import os
import subprocess
import sys
import zlib

AQUI = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.normpath(os.path.join(AQUI, "..", "_kit-motion"))
PECA = os.path.join(KIT, "pecas", "2026-10-09-sufoco-burocratico-v2")
OUT = os.path.join(AQUI, "assets", "audio-v6")
N6 = json.load(open(os.path.join(AQUI, "assets", "narracao-v6-funcoes.json"), encoding="utf-8"))
T_INS, DELTA = N6["T_INS"], N6["DELTA"]
os.makedirs(OUT, exist_ok=True)

# a voz já vem montada pelo voz-v6.py
voz_v5 = os.path.join(AQUI, "assets", "audio-v6", "voz-final-v6.wav")

# eventos
ev = json.load(open(os.path.join(PECA, "eventos.json"), encoding="utf-8"))
lista = []
for e in ev["eventos"]:
    e = dict(e)
    if e["t"] >= T_INS - 1e-6:
        e["t"] = round(e["t"] + DELTA, 4)
    lista.append(e)
for k, e in enumerate(json.load(open(os.path.join(OUT, "sfx-funcoes.json"), encoding="utf-8"))):
    origem = f"v6-funcionalidades:{k}:{e['som']}"
    lista.append({"t": e["t"], "som": e["som"], "ganhoDb": e["ganhoDb"], "args": e["args"],
                  "semente": zlib.crc32(origem.encode("utf-8")), "origem": origem})
lista.sort(key=lambda e: e["t"])
for i, e in enumerate(lista):
    e["ordem"] = i
ev["eventos"] = lista
ev["duracao"] = round(ev.get("duracao", 24.8) + DELTA, 3)
json.dump(ev, open(os.path.join(OUT, "eventos-v6.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# props: a mesma peça, 6 s mais longa, com a voz nova
pr = json.load(open(os.path.join(PECA, "props.json"), encoding="utf-8"))
pr["duracao"] = round(pr["duracao"] + DELTA, 3)
pr["quadros"] = int(round(pr["duracao"] * pr["fps"]))
pr["voz"] = dict(pr["voz"], final=voz_v5)
json.dump(pr, open(os.path.join(OUT, "props-v6.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"voz {voz_v5}; {len(lista)} eventos; {pr['duracao']} s, {pr['quadros']} quadros")

# o mixador do kit
r = subprocess.run([sys.executable, "-B", os.path.join(KIT, "audio", "mixa.py"), PECA,
                    "--props", os.path.join(OUT, "props-v6.json"), "--eventos", os.path.join(OUT, "eventos-v6.json"),
                    "--saida", os.path.join(AQUI, "assets", "mix-v6.wav"), "--relatorio"], capture_output=True, text=True)
print(r.stdout[-2500:])
print(r.stderr[-2500:])
sys.exit(r.returncode)
