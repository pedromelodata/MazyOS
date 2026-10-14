"""Alinha a transcrição do whisper de uma tomada com o texto da narração (14/10/2026). O whisper às vezes junta ou quebra
palavra ("R" "$" "1"), troca grafia ("dois" ou "2") ou deixa de ouvir uma palavra numa tomada boa (o "Vai" da tomada 5);
aqui cada palavra esperada recebe o tempo da palavra que casou com ela, e a que não casou ganha o tempo interpolado
entre as vizinhas. Sai uma lista do mesmo tamanho do texto, que o prompt40.py usa.
Uso: python -B alinha-voz.py <transcrição.json> <saída.json>"""
import difflib
import json
import re
import sys

TEXTO = ("ainda recebe pelo seu trabalho no cpf cinco motivos pra ter cnpj um no mei a guia é fixa fature de um real até o "
         "teto de oitenta_e_um mil por ano exatamente seis_mil setecentos_e_cinquenta por mês dois numa microempresa que "
         "começa em seis por_cento de dez mil uns seiscentos de imposto e uns nove mil_e_quatrocentos no bolso três na "
         "microempresa seu salário de dono recolhe inss pra sua aposentadoria quatro o app calcula você emite a nota e "
         "paga cinco a abertura é com a gente sem honorário clique no link da bio e entre na lista de espera do app que "
         "chega dia dez de novembro vai legalizaí aí").split()
# forma escrita de cada palavra falada (como o whisper costuma escrever) e as variações que ele usa
ESC = {"cinco": "5", "um": "1", "oitenta_e_um": "81", "seis_mil": "6", "setecentos_e_cinquenta": "750", "dois": "2",
       "seis": "6", "por_cento": "%", "dez": "10", "seiscentos": "600", "nove": "9", "mil_e_quatrocentos": "400", "três": "3",
       "quatro": "4", "pra": "para", "fature": "fatura", "legalizaí": "legaliza"}
VAR = {"000": "mil", "cinco": "5", "um": "1", "dois": "2", "três": "3", "quatro": "4", "dez": "10", "legalize": "legaliza",
       "legalizaí": "legaliza", "pra": "para", "fature": "fatura", "cvf": "cpf", "cvh": "cpf", "cvs": "cpf", "web": "app",
       "etcalcula": "app", "ép": "app", "onorário": "honorário", "recole": "recolhe", "meio": "mei", "$1": "1"}
nrm = lambda s: re.sub(r"[.,?!:]", "", s.lower())
canon_texto = lambda t: ESC.get(t, t)
canon_ouvido = lambda t: VAR.get(t, t)


def chave(t):
    return canon_ouvido(t)


W = json.load(open(sys.argv[1], encoding="utf-8"))
# o "R" e o "$" que o whisper separa do número saem (não são palavra falada à parte)
W = [w for w in W if nrm(w["w"]) not in ("r", "$", "r$")]
ws = [canon_ouvido(nrm(w["w"])) for w in W]
es = [canon_texto(t) for t in TEXTO]
sm = difflib.SequenceMatcher(a=es, b=ws, autojunk=False)
casa = {}
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        casa[a + k] = b + k
# os trechos que não casaram palavra a palavra: distribui na ordem, se tiverem o mesmo tamanho
for tag, a0, a1, b0, b1 in sm.get_opcodes():
    if tag == "replace" and (a1 - a0) == (b1 - b0):
        for k in range(a1 - a0):
            casa[a0 + k] = b0 + k
out = []
for i, t in enumerate(TEXTO):
    if i in casa:
        w = W[casa[i]]
        out.append({"w": t, "s": w["s"], "e": w["e"], "p": w.get("p", 0), "ouvido": w["w"]})
    else:
        out.append(None)
# interpola as que faltaram entre a anterior e a próxima casadas
for i, o in enumerate(out):
    if o is not None:
        continue
    j0 = max([j for j in range(i) if out[j] is not None], default=None)
    j1 = min([j for j in range(i + 1, len(out)) if out[j] is not None], default=None)
    s0 = out[j0]["e"] if j0 is not None else 0.0
    s1 = out[j1]["s"] if j1 is not None else s0 + 0.4
    falt = [k for k in range((j0 if j0 is not None else -1) + 1, j1 if j1 is not None else len(out))]
    pos = falt.index(i)
    d = (s1 - s0) / len(falt)
    out[i] = {"w": TEXTO[i], "s": round(s0 + d * pos, 3), "e": round(s0 + d * (pos + 1), 3), "p": 0, "ouvido": None}
json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
falt = [(i, o["w"]) for i, o in enumerate(out) if o["ouvido"] is None]
dif = [(i, o["w"], o["ouvido"]) for i, o in enumerate(out) if o["ouvido"] is not None and canon_ouvido(nrm(o["ouvido"])) != canon_texto(o["w"])]
print(len(out), "palavras; interpoladas:", falt, "; ouvidas diferente:", dif)
