"""Compara o ritmo de cada frase de uma tomada (voz-v8/<tomada>.analise.json) com o da v7 (narracao.json da v2 no
tempo da v7 + narracao-v6-funcoes.json): início, duração da frase e a pausa antes dela.
Uso: PYW -B voz-v8/ritmo.py <tomada.analise.json> [mais]"""
import json, os, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(AQUI, "..", "assets")
n2 = json.load(open(os.path.join(A, "narracao.json"), encoding="utf-8"))
n6 = json.load(open(os.path.join(A, "narracao-v6-funcoes.json"), encoding="utf-8"))
RT = lambda t: t + n6["DELTA"] if t >= n6["T_INS"] - 1e-4 else t
v7 = []
for p in n2["phrases"][:7]:
    v7.append((n2["words"][p["w"][0]]["s"], n2["words"][p["w"][-1]]["e"]))
for p in n6["phrases"]:
    v7.append((n6["words"][p["w"][0]]["s"], n6["words"][p["w"][-1]]["e"]))
p8 = n2["phrases"][7]
v7.append((RT(n2["words"][p8["w"][0]]["s"]), RT(n2["words"][p8["w"][-1]]["e"])))
v7.append((RT(n2["tFecho"]) + 0.01, RT(n2["tFecho"]) + 1.22))   # fecho do kit: vai 0,01 s, legalizai até 1,22 s

for arq in sys.argv[1:]:
    an = json.load(open(arq, encoding="utf-8"))
    ws = an["palavras"]
    print(f"== {an['tomada']}")
    print(f"{'frase':>5} {'v7 ini':>7} {'dur':>5} {'pausa':>5} | {'nova ini':>8} {'dur':>5} {'pausa':>5} | razão")
    ant7 = antn = None
    tot7 = totn = 0
    for fi in range(len(v7)):
        fw = [w for w in ws if w["frase"] == fi and "s" in w]
        if not fw:
            print(f"{fi + 1:>5} sem tempo"); continue
        s, e = fw[0]["s"], fw[-1]["e"]
        s7, e7 = v7[fi]
        pa7 = s7 - ant7 if ant7 is not None else 0
        pan = s - antn if antn is not None else 0
        print(f"{fi + 1:>5} {s7:7.2f} {e7 - s7:5.2f} {pa7:5.2f} | {s:8.2f} {e - s:5.2f} {pan:5.2f} | {(e - s) / (e7 - s7):.2f}")
        ant7, antn = e7, e
        tot7 += e7 - s7; totn += e - s
    print(f"fala: v7 {tot7:.2f} s, nova {totn:.2f} s (razão {totn / tot7:.2f}); fim da fala: v7 {v7[-1][1]:.2f}, nova {antn:.2f}")
