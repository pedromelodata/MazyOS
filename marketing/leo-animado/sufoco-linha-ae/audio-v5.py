"""Áudio da versão 5: o mix da v2 com 6 s de funcionalidades inseridos depois do "construindo o Legalizaí".
  - voz: a mesma voz-final da v2, com 6 s de silêncio em 18,0 s (dentro da pausa entre "Legalizaí" e "Segue")
  - efeitos: os mesmos eventos; os de 17,9 s em diante andam 6 s; nas 4 trocas de tela, um swish e um brilho
  - trilha: a mesma (Let's Move, liberada pra esta peça), que agora só corre 6 s a mais: 6 s = 12 batidas a 120 BPM
Grava assets/audio-v5/ (voz, eventos e props) e roda o mixador do kit com a pasta da peça da v2, que é a que tem a
trilha liberada (a trava é pelo nome da pasta). Saída: assets/mix-v5.wav.
Uso: python -B audio-v5.py"""
import json
import os
import subprocess
import sys
import zlib

AQUI = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.normpath(os.path.join(AQUI, "..", "_kit-motion"))
PECA = os.path.join(KIT, "pecas", "2026-10-09-sufoco-burocratico-v2")
OUT = os.path.join(AQUI, "assets", "audio-v5")
T_INS, DELTA, CORTE_VOZ = 17.9, 6.0, 18.0
TROCAS = [18.035, 19.535, 21.035, 22.535]
os.makedirs(OUT, exist_ok=True)

# voz com o vão
voz_v2 = os.path.join(PECA, "voz", "voz-final.wav")
voz_v5 = os.path.join(OUT, "voz-final-v5.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", voz_v2, "-filter_complex",
                f"[0:a]atrim=0:{CORTE_VOZ},asetpts=PTS-STARTPTS[a];"
                f"[0:a]atrim={CORTE_VOZ},asetpts=PTS-STARTPTS[b];"
                f"anullsrc=r=48000:cl=mono,atrim=0:{DELTA}[s];"
                "[a][s][b]concat=n=3:v=0:a=1[o]", "-map", "[o]", "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", voz_v5],
               check=True)

# eventos
ev = json.load(open(os.path.join(PECA, "eventos.json"), encoding="utf-8"))
lista = []
for e in ev["eventos"]:
    e = dict(e)
    if e["t"] >= T_INS - 1e-6:
        e["t"] = round(e["t"] + DELTA, 4)
    lista.append(e)
for i, ts in enumerate(TROCAS):
    for som, args, ganho, dt in (("sint-s_swish", [0.3], -31, -0.24), ("sint-s_brilho", [0.45], -35, -0.02)):
        origem = f"v5-funcionalidade:{i + 1}:{som}"
        lista.append({"t": round(ts + dt, 4), "som": som, "ganhoDb": ganho, "args": args,
                      "semente": zlib.crc32(origem.encode("utf-8")), "origem": origem})
lista.sort(key=lambda e: e["t"])
for i, e in enumerate(lista):
    e["ordem"] = i
ev["eventos"] = lista
ev["duracao"] = round(ev.get("duracao", 24.8) + DELTA, 3)
json.dump(ev, open(os.path.join(OUT, "eventos-v5.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# props: a mesma peça, 6 s mais longa, com a voz nova
pr = json.load(open(os.path.join(PECA, "props.json"), encoding="utf-8"))
pr["duracao"] = round(pr["duracao"] + DELTA, 3)
pr["quadros"] = int(round(pr["duracao"] * pr["fps"]))
pr["voz"] = dict(pr["voz"], final=voz_v5)
json.dump(pr, open(os.path.join(OUT, "props-v5.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"voz {voz_v5}; {len(lista)} eventos; {pr['duracao']} s, {pr['quadros']} quadros")

# o mixador do kit
r = subprocess.run([sys.executable, "-B", os.path.join(KIT, "audio", "mixa.py"), PECA,
                    "--props", os.path.join(OUT, "props-v5.json"), "--eventos", os.path.join(OUT, "eventos-v5.json"),
                    "--saida", os.path.join(AQUI, "assets", "mix-v5.wav"), "--relatorio"], capture_output=True, text=True)
print(r.stdout[-2500:])
print(r.stderr[-2500:])
sys.exit(r.returncode)
