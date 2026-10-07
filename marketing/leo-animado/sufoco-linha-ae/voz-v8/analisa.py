"""Confere uma tomada inteira da narração da v8 contra o roteiro (voz-v8/roteiro.json):
  - transcreve com o whisper do kit (small, sem prompt) e alinha palavra a palavra com o roteiro;
  - aponta palavra que falta, sobra ou foi trocada (o whisper às vezes grafa diferente: isso aparece como troca);
  - mede, pelo som (-40 dB em janelas de 10 ms), as pausas de 250 ms ou mais e diz onde caem: entre frases (normal),
    numa vírgula (normal até 0,7 s) ou no meio da frase (trava);
  - grava <tomada>.analise.json com as palavras do roteiro e os tempos (início e fim) de cada uma.
Uso: PYW -B voz-v8/analisa.py <tomada.wav> [mais tomadas]"""
import difflib
import json
import os
import re
import subprocess
import sys
import unicodedata

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
KIT_VOZ = os.path.normpath(os.path.join(AQUI, "..", "..", "_kit-motion", "voz"))
sys.path.insert(0, KIT_VOZ)
import transcreve  # noqa: E402

SR = 48000
ROT = json.load(open(os.path.join(AQUI, "roteiro.json"), encoding="utf-8"))["frases"]


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    w = re.sub(r"[^a-z0-9]", "", w)
    return {"para": "pra", "esta": "ta", "ep": "app", "legalizai": "legalizai"}.get(w, w)


def le(p, sr):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).copy()


def silencios(x, lim=-40, minimo=0.25):
    n = len(x) // 480
    db = np.array([20 * np.log10(np.sqrt(np.mean(x[i * 480:(i + 1) * 480] ** 2)) + 1e-9) for i in range(n)])
    out, i = [], 0
    while i < n:
        if db[i] < lim:
            j = i
            while j < n and db[j] < lim:
                j += 1
            if (j - i) / 100 >= minimo:
                out.append((i / 100, j / 100))
            i = j
        else:
            i += 1
    return out


def analisa(wav):
    x48 = le(wav, SR)
    x16 = le(wav, 16000)
    pal = transcreve.transcreve(x16)
    # o whisper ouve "Legalizaí" como "Legalize aí": junta as duas numa palavra só
    junta = []
    for w in pal:
        if junta and norm(junta[-1]["w"]) == "legalize" and norm(w["w"]) == "ai":
            junta[-1] = dict(junta[-1], w="Legalizaí" + w["w"][-1:] if w["w"][-1:] in ",.!?" else "Legalizaí", e=w["e"])
        else:
            junta.append(dict(w))
    pal = junta
    # o roteiro, palavra a palavra, com a frase e se termina em pontuação
    rot = []
    for fi, f in enumerate(ROT):
        for w in f.replace("*", "").split():
            rot.append({"t": w, "frase": fi, "pont": w[-1] in ",.!?"})
    a = [norm(w["t"]) for w in rot]
    b = [norm(w["w"]) for w in pal]
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    problemas = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                rot[i1 + k]["s"], rot[i1 + k]["e"] = pal[j1 + k]["s"], pal[j1 + k]["e"]
        else:
            problemas.append(f"{op}: roteiro [{' '.join(w['t'] for w in rot[i1:i2])}] / ouvido [{' '.join(w['w'] for w in pal[j1:j2])}]")
            # troca 1 a 1: aceita o tempo (grafia diferente do whisper)
            if op == "replace" and i2 - i1 == j2 - j1:
                for k in range(i2 - i1):
                    rot[i1 + k]["s"], rot[i1 + k]["e"] = pal[j1 + k]["s"], pal[j1 + k]["e"]
    # palavra repetida em sequência no que foi ouvido (gaguejo)
    for k in range(1, len(b)):
        if b[k] == b[k - 1] and b[k] not in ("a",):
            problemas.append(f"repetida: {pal[k]['w']} em {pal[k]['s']:.2f} s")
    # pausas pelo som, classificadas
    fala_ini = next((w["s"] for w in rot if "s" in w), 0)
    fala_fim = max((w["e"] for w in rot if "e" in w), default=len(x48) / SR)
    pausas = []
    for s0, s1 in silencios(x48):
        if s1 <= fala_ini or s0 >= fala_fim:
            continue
        antes = [w for w in rot if "e" in w and w["e"] <= s0 + 0.15]
        depois = [w for w in rot if "s" in w and w["s"] >= s1 - 0.15]
        if not antes or not depois:
            continue
        wa, wd = antes[-1], depois[0]
        if wa["frase"] != wd["frase"] or wa["t"].endswith((".", "!", "?")):
            tipo = "entre frases"
        elif wa["pont"]:
            tipo = "vírgula" if s1 - s0 <= 0.7 else "VÍRGULA LONGA"
        else:
            tipo = "TRAVA"
        pausas.append({"de": s0, "ate": s1, "dur": round(s1 - s0, 2), "depois_de": wa["t"], "antes_de": wd["t"], "tipo": tipo})
    sem_tempo = [w["t"] for w in rot if "s" not in w]
    res = {"tomada": os.path.basename(wav), "duracao": round(len(x48) / SR, 3), "fala": [round(fala_ini, 2), round(fala_fim, 2)],
           "problemas": problemas, "sem_tempo": sem_tempo, "pausas": pausas, "palavras": rot, "ouvido": " ".join(w["w"] for w in pal)}
    json.dump(res, open(os.path.splitext(wav)[0] + ".analise.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"== {res['tomada']}: {res['duracao']:.2f} s, fala de {fala_ini:.2f} a {fala_fim:.2f} s")
    print("   ouvido:", res["ouvido"])
    for p in problemas:
        print("   !", p)
    if sem_tempo:
        print("   sem tempo:", sem_tempo)
    for p in pausas:
        if p["tipo"] != "entre frases":
            print(f"   {p['tipo']}: {p['dur']:.2f} s entre '{p['depois_de']}' e '{p['antes_de']}' ({p['de']:.2f} s)")
    ef = [p["dur"] for p in pausas if p["tipo"] == "entre frases"]
    if ef:
        print(f"   pausas entre frases: {len(ef)}, de {min(ef):.2f} a {max(ef):.2f} s")


for w in sys.argv[1:]:
    analisa(w)
