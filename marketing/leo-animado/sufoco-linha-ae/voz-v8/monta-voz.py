"""Voz da versão 8: a narração inteira numa tomada só (clone do Pedro convertido pro Dylan), sem corte, sem emenda e
sem acelerar. O vídeo é que se ajusta a ela.
  - lê a tomada convertida e a análise dela (analisa.py: as palavras do roteiro com os tempos do whisper); palavra sem
    tempo (o whisper ouviu "para o" no lugar de "pro") ganha o tempo por interpolação entre as vizinhas;
  - casa a loudness da fala com a da narração aprovada da v2 (-29,7 LUFS), pro equilíbrio com a trilha ficar o mesmo;
  - grava assets/audio-v8/voz-v8.wav (a tomada inteira, do jeito que veio, só com o ganho);
  - grava assets/narracao-v8.json: as 14 frases (13 da legenda e o fecho) com as palavras no tempo novo;
  - grava assets/warp-v8.json: o mapa de tempo da v7 pro tempo novo. Cada palavra da v7 (as da v2 no tempo da v7, as
    das funcionalidades e as do fecho do kit) vai pro tempo da mesma palavra na tomada nova, com o fim de cada frase
    também; entre elas, linear. O gera.mjs passa todo tempo da montagem por esse mapa.
Uso: PYW -B voz-v8/monta-voz.py <tomada-dylan.wav>"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
PECA = os.path.normpath(os.path.join(AQUI, "..", ".."))
A = os.path.join(AQUI, "..", "assets")
KIT = os.path.normpath(os.path.join(AQUI, "..", "..", "_kit-motion"))
SR = 48000
DYLAN = sys.argv[1]
AN = json.load(open(os.path.splitext(DYLAN)[0] + ".analise.json", encoding="utf-8"))
ROT = json.load(open(os.path.join(AQUI, "roteiro.json"), encoding="utf-8"))["frases"]
FIM_V7, CAUDA = 44.8, None   # a v7 tem 44,8 s; a cauda depois do fecho fica igual


def le(p):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).copy()


def grava(p, x):
    with wave.open(p, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def lufs(x):
    t = os.path.join(AQUI, "_tmp_lufs.wav")
    grava(t, x)
    r = subprocess.run(["ffmpeg", "-v", "info", "-i", t, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    os.remove(t)
    return float([l for l in r.splitlines() if l.strip().startswith("I:")][-1].split()[1])


# ---- as palavras da tomada nova (as sem tempo por interpolação)
ws = AN["palavras"]
n = len(ws)
for i, w in enumerate(ws):
    if "s" in w:
        continue
    a = next(j for j in range(i - 1, -1, -1) if "s" in ws[j])
    b = next(j for j in range(i + 1, n) if "s" in ws[j])
    t0, t1 = ws[a]["e"], ws[b]["s"]
    k, m = i - a, b - a
    w["s"] = round(t0 + (t1 - t0) * (k - 0.5) / (m - 1) if m > 1 else t0, 3)
    w["e"] = round(t0 + (t1 - t0) * (k + 0.5) / (m - 1) if m > 1 else t1, 3)
    w["interpolado"] = True
for i in range(1, n):   # monotonia (o whisper às vezes repete o mesmo começo)
    if ws[i]["s"] <= ws[i - 1]["s"]:
        ws[i]["s"] = round(ws[i - 1]["s"] + 0.02, 3)
    ws[i]["e"] = max(ws[i]["e"], ws[i]["s"] + 0.05)
# as pausas medidas pelo som (analisa.py) mandam nas fronteiras: o whisper estica o fim de uma palavra pela pausa
# adentro ("mês." acabava onde o "A gente" começava). O fim vai pro começo do silêncio e o começo da seguinte, pro fim
for pz in AN["pausas"]:
    j = next((k for k in range(n) if ws[k]["s"] >= pz["de"] - 0.15), None)
    if j is None or j == 0 or ws[j - 1]["s"] >= pz["de"]:
        continue
    if ws[j - 1]["e"] > pz["de"] + 0.03:
        ws[j - 1]["e"] = round(pz["de"] + 0.03, 3)
    if ws[j]["s"] < pz["ate"] - 0.02:
        ws[j]["s"] = round(pz["ate"] - 0.02, 3)
        ws[j]["e"] = max(ws[j]["e"], ws[j]["s"] + 0.05)

# ---- a voz: a tomada inteira, com o ganho que casa a fala com a da v2
x = le(DYLAN)
v2 = le(os.path.join(KIT, "pecas", "2026-10-09-sufoco-burocratico-v2", "voz", "voz-final.wav"))
nivel_v2 = lufs(v2[: int(17.84 * SR)])
fim_fala = ws[-1]["e"]
nivel = lufs(x[: int((fim_fala + 0.1) * SR)])
ganho = 10 ** ((nivel_v2 - nivel) / 20)
x = x * ganho
pico = float(np.abs(x).max())
print(f"loudness da fala: v2 {nivel_v2:.1f} LUFS, tomada {nivel:.1f} LUFS, ganho {20 * np.log10(ganho):+.1f} dB; pico {20 * np.log10(pico):.1f} dBFS")

# ---- a duração: a cauda depois do "Legalizaí" fica a da v7 (o logo e a volta do loop)
n2 = json.load(open(os.path.join(A, "narracao.json"), encoding="utf-8"))
n6 = json.load(open(os.path.join(A, "narracao-v6-funcoes.json"), encoding="utf-8"))
fecho = json.load(open(os.path.join(KIT, "voz", "fecho", "fecho.json"), encoding="utf-8"))
T_INS, DELTA = n6["T_INS"], n6["DELTA"]
RT = lambda t: t + DELTA if t >= T_INS - 1e-4 else t
tF = RT(n2["tFecho"])   # o fecho do kit entra em tFecho: "Vai" e "Legalizaí" nos tempos do fecho.json
VAI7 = (tF + fecho["vai"][0], tF + fecho["vai"][1])
LEG7 = (tF + fecho["legalizai"][0], tF + fecho["legalizai"][1])
CAUDA = FIM_V7 - LEG7[1]
dur = round(round((fim_fala + CAUDA) * 30) / 30, 4)
if dur * SR > len(x):
    x = np.concatenate([x, np.zeros(int(dur * SR) - len(x), np.float32)])
x = x[: int(round(dur * SR))]
os.makedirs(os.path.join(A, "audio-v8"), exist_ok=True)
saida = os.path.join(A, "audio-v8", "voz-v8.wav")
grava(saida, x)

# ---- as palavras da v7, na mesma ordem do roteiro (13 frases + o fecho)
v7 = []
for p in n2["phrases"][:7]:
    v7 += [(n2["words"][i]["s"], n2["words"][i]["e"]) for i in p["w"]]
for p in n6["phrases"]:
    v7 += [(n6["words"][i]["s"], n6["words"][i]["e"]) for i in p["w"]]
v7 += [(RT(n2["words"][i]["s"]), RT(n2["words"][i]["e"])) for i in n2["phrases"][7]["w"]]
v7 += [VAI7, LEG7]
if len(v7) != n:
    sys.exit(f"o roteiro tem {n} palavras e a v7 {len(v7)}")

# ---- o mapa da v7 pro tempo novo. Âncoras: começo e fim de cada frase e as palavras que disparam animação (as do T do
# gera.mjs e as do W() do funcionalidades.mjs). Palavra a palavra não serve: duas palavras quase coladas na v7 e
# afastadas na voz nova davam trechos esticados 10x, e o celular 3D (sequência contínua) dava tranco ali.
EVENTOS = {0: ["tarde", "coisa", "simples."], 1: ["Chega", "trava."], 2: ["Liga", "cai"], 3: ["Vai", "fila."],
           4: ["No", "nada", "resolvido,"], 5: ["parada", "esperando."], 6: ["É", "construindo", "Legalizaí."],
           7: ["painel", "entender,", "entrou", "imposto", "mês."], 8: ["imposto", "calculado,", "guia", "pronta."],
           9: ["alíquota", "acompanhada", "todo", "mês."], 10: ["avisa", "prazo", "app."],
           11: ["prestador", "contador", "verdade", "folha", "declarações."], 12: ["Segue", "E", "clica", "link", "bio."],
           13: ["Vai,", "Legalizaí!"]}
FIM_EVENTO = {(0, "coisa"), (4, "resolvido,")}   # o T usa o fim dessas
pares = [(0.0, 0.0, 1)]
for i, w in enumerate(ws):
    ini_frase = i == 0 or ws[i - 1]["frase"] != w["frase"]
    fim_frase = i == n - 1 or ws[i + 1]["frase"] != w["frase"]
    if ini_frase or w["t"] in EVENTOS.get(w["frase"], []):
        pares.append((v7[i][0], w["s"], 1))
    if fim_frase or (w["frase"], w["t"]) in FIM_EVENTO:
        pares.append((v7[i][1], w["e"], 1))
pares.append((LEG7[1], ws[-1]["e"], 1))
pares.append((FIM_V7, dur, 1))
pares.sort()
a, b = [], []
for u, t, _ in pares:
    if a and (u <= a[-1] + 0.12 or t <= b[-1] + 0.06):
        continue   # par colado no anterior: some (o anterior já segura a região)
    a.append(u); b.append(t)
a, b = np.array(a), np.array(b)


def monotona(xs, ys):
    """interpolação cúbica monótona (Fritsch-Carlson): passa por todos os pares, sem voltar no tempo e sem tranco"""
    h = np.diff(xs); dlt = np.diff(ys) / h
    m = np.zeros(len(xs))
    m[0], m[-1] = dlt[0], dlt[-1]
    for k in range(1, len(xs) - 1):
        m[k] = 0 if dlt[k - 1] * dlt[k] <= 0 else 3 * (h[k - 1] + h[k]) / ((2 * h[k] + h[k - 1]) / dlt[k - 1] + (h[k] + 2 * h[k - 1]) / dlt[k])

    def f(x):
        x = np.asarray(x, float)
        k = np.clip(np.searchsorted(xs, x) - 1, 0, len(xs) - 2)
        t = (x - xs[k]) / h[k]
        h00, h10, h01, h11 = 2 * t**3 - 3 * t**2 + 1, t**3 - 2 * t**2 + t, -2 * t**3 + 3 * t**2, t**3 - t**2
        return h00 * ys[k] + h10 * h[k] * m[k] + h01 * ys[k + 1] + h11 * h[k] * m[k + 1]
    return f


W = monotona(a, b)
grade = np.round(np.arange(0, FIM_V7 + 1e-9, 0.02), 4)
tab = np.round(W(grade), 4)
incl = np.diff(tab) / np.diff(grade)
json.dump({"a": grade.tolist(), "b": tab.tolist(), "duracao": dur, "duracao_v7": FIM_V7,
           "ancoras": [[round(float(u), 3), round(float(t), 3)] for u, t in zip(a, b)],
           "nota": "a = tempo da v7, b = tempo da v8 (tabela a cada 0,02 s de uma cúbica monótona pelas âncoras); "
                   "linear entre os pontos da tabela, inclinação 1 fora dela"},
          open(os.path.join(A, "warp-v8.json"), "w", encoding="utf-8"))

# ---- a narração nova: palavras e frases (a chave é a palavra entre asteriscos)
words, phrases = [], []
for fi, f in enumerate(ROT):
    toks = f.split()
    idx = []
    for j, tok in enumerate(toks):
        w = ws[len(words)]
        words.append({"i": len(words), "t": tok.replace("*", ""), "s": w["s"], "e": w["e"]})
        idx.append(len(words) - 1)
    chave = [idx[j] for j, tok in enumerate(toks) if tok.startswith("*")]
    phrases.append({"w": idx, "key": chave[0] if chave else None, "s": words[idx[0]]["s"], "e": words[idx[-1]]["e"]})
for fi, p in enumerate(phrases):
    p["out"] = round(phrases[fi + 1]["s"] - 0.02, 3) if fi + 1 < len(phrases) else round(dur - 0.02, 3)
json.dump({"duracao": dur, "voz": os.path.relpath(saida, os.path.join(AQUI, "..")).replace("\\", "/"),
           "tomada": os.path.basename(DYLAN), "words": words, "phrases": phrases,
           "fecho": {"vai": words[phrases[-1]["w"][0]]["s"], "legalizai": [words[phrases[-1]["w"][1]]["s"], words[phrases[-1]["w"][1]]["e"]]}},
          open(os.path.join(A, "narracao-v8.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

print(f"duração: {dur:.3f} s (a v7 tem {FIM_V7}); {len(a)} âncoras; inclinação de {incl.min():.2f} a {incl.max():.2f} "
      f"(mediana {np.median(incl):.2f})")
fora = incl < 0.6
fora2 = incl > 1.7
for nome, msk in (("abaixo de 0,6", fora), ("acima de 1,7", fora2)):
    if msk.any():
        idx = np.where(msk)[0]
        blocos, ini = [], idx[0]
        for k in range(1, len(idx) + 1):
            if k == len(idx) or idx[k] != idx[k - 1] + 1:
                blocos.append((round(grade[ini], 2), round(grade[idx[k - 1] + 1], 2), round(float(incl[ini:idx[k - 1] + 1].min() if nome.startswith("abaixo") else incl[ini:idx[k - 1] + 1].max()), 2)))
                if k < len(idx):
                    ini = idx[k]
        print(f"trechos {nome} (v7 de, até, pior):", blocos)
for p in phrases:
    print(f"  {p['s']:6.2f} a {p['e']:6.2f}  {' '.join(words[i]['t'] for i in p['w'])}")
print("voz:", saida)
