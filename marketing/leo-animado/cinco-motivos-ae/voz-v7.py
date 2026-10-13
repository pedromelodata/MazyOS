"""Narração da v7 do "Cinco motivos" (09/10/2026): a fala do motivo 1 ganha o faturamento do MEI (F051), a pedido do Pedro.
"Um: no MEI, a guia é fixa." fica da narração aprovada (voz/voz-dylan.wav): na voz nova, a conversão pro Dylan embolou
o "é fixa" (o whisper ouviu "FX"). A frase nova "Fature de um real até o teto de oitenta e um mil por ano, exatamente seis
mil setecentos e cinquenta por mês." (o Pedro trocou "uma média" por "exatamente") vem da tomada B do clone
(voz/f2-tomadaB.wav), convertida pro Dylan (voice_change, voz/f2-dylan.wav). Os tempos das palavras saem do whisper da
voz convertida (voz/f2-dylan-tr.json). Tudo o que vem depois do motivo 1 anda DESLOCA segundos (um número
inteiro de quadros a 30 fps), e as pausas ficam como as da narração aprovada.
Grava voz/voz-dylan-v7.wav e tempos-v7.json (palavras e frases da legenda, no formato do legenda-tempos.json, com o
deslocamento). Uso: python -B voz-v7.py"""
import json
import os
import subprocess
import wave

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
SR, OFF = 48000, 0.25
X = 8.20       # corte na narração aprovada: no silêncio entre "fixa," (acaba em 8,02) e o "fature" antigo (8,46)
B_ANT = 10.30  # volta pra narração aprovada: no silêncio antes do "Dois" (10,57)
PRE = 0.24     # silêncio antes do "f" do "Fature" (com os 0,18 s depois do "fixa,", a pausa fica igual à antiga, 0,42 s)
CAUDA = 0.32   # silêncio depois do "mês." antes de voltar (0,32 + 0,27 até o "Dois" = 0,59 s, a pausa antiga)
FIM_VELHA = 40.24  # a narração aprovada termina com um estalo de 16 ms (40,355 s) antes do fecho: corta antes, com fade
NB = " "  # "1 real" e "81 mil" ficam num bloco só da legenda


def le(nome):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(AQUI, "voz", nome), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                        capture_output=True, check=True).stdout, np.float32).copy()


def lufs(x):
    p = subprocess.run(["ffmpeg", "-v", "info", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", "ebur128", "-f", "null", "-"],
                       input=x.astype(np.float32).tobytes(), capture_output=True)
    return float([l for l in p.stderr.decode("utf-8", "replace").splitlines() if l.strip().startswith("I:")][-1].split()[1])


velha, nova0 = le("voz-dylan.wav"), le("f2-dylan.wav")
# começo e fim da fala na frase nova pelo envelope (quadros de 10 ms acima de -45 dB)
q = int(0.01 * SR)
env = np.array([20 * np.log10(np.sqrt(np.mean(nova0[i:i + q] ** 2)) + 1e-9) for i in range(0, len(nova0) - q, q)])
fala = np.flatnonzero(env > -45)
ONSET, FIM_FALA0 = fala[0] * 0.01, (fala[-1] + 1) * 0.01
# o "f" é fraco: recua até o envelope cair abaixo de -60 dB
k = fala[0]
while k > 0 and env[k - 1] > -60:
    k -= 1
ONSET = k * 0.01
pad = max(0.0, PRE - ONSET)
nova = np.concatenate([np.zeros(int(round(pad * SR)), np.float32), nova0])
Y = ONSET + pad - PRE
FIM_FALA = FIM_FALA0 + pad
# deslocamento num número inteiro de quadros: acerta a cauda
L0 = (FIM_FALA + CAUDA) - Y
D0 = L0 - (B_ANT - X)
DESLOCA = round(D0 * 30) / 30
fim_novo = FIM_FALA + CAUDA + (DESLOCA - D0)
trecho = nova[int(round(Y * SR)):int(round(fim_novo * SR))].copy()
# volume da frase nova casado com a fala antiga do motivo 1 (5,43 a 9,98 na narração aprovada)
g_db = lufs(velha[int(5.43 * SR):int(9.98 * SR)]) - lufs(nova[int((Y + PRE) * SR):int(FIM_FALA * SR)])
trecho *= 10 ** (g_db / 20)
cf = int(0.012 * SR)
a, b = velha[:int(round(X * SR))].copy(), velha[int(round(B_ANT * SR)):int(round(FIM_VELHA * SR))].copy()
r = np.linspace(1, 0, cf)
trecho[:cf] *= r[::-1]
trecho[-cf:] *= r
a[-cf:] *= r
b[:cf] *= r[::-1]
b[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
b = np.concatenate([b, np.zeros(int(round((len(velha) / SR - FIM_VELHA) * SR)), np.float32)])
y = np.concatenate([a, trecho, b])
pk = float(np.abs(y).max())
with wave.open(os.path.join(AQUI, "voz", "voz-dylan-v7.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
print(f"frase nova: fala de {ONSET:.2f} a {FIM_FALA0:.2f} s em f2-dylan.wav (+{pad:.2f} s de silêncio na frente)")
print(f"voz-dylan-v7.wav: {len(y) / SR:.3f} s (antes {len(velha) / SR:.3f}); deslocamento {DESLOCA:.4f} s = {round(DESLOCA * 30)} quadros; ganho da frase nova {g_db:+.2f} dB; pico {pk:.2f}")

# ---------- os tempos da legenda ----------
T = json.load(open(os.path.join(AQUI, "legenda-tempos.json"), encoding="utf-8"))
W, P = T["words"], T["phrases"]
words, phrases = [], []


ESPERADO = ["Fature", "de", "1" + NB + "real", "até", "o", "teto", "de", "81" + NB + "mil", "por", "ano,", "exatamente", "6.750", "por", "mês."]


def juntar(tr):
    """Casa as palavras do whisper com as da legenda: "R" e "$" soltos somem (o começo passa pro número), e "1 real",
    "81 mil" e "6.750" (o whisper parte em "6" e ".750") viram um item cada. Confere cada item contra o esperado."""
    toks, pend = [], None
    for w in tr:
        n = w["w"].strip().lower().replace("r$", "").replace("$", "").strip(".,:;!?")
        if n in ("r", ""):
            pend = w["s"] if pend is None else pend
            continue
        toks.append([n, pend if pend is not None else w["s"]])
        pend = None
    out, i = [], 0
    for alvo in ESPERADO:
        n, s0 = toks[i]
        i += 1
        if alvo == "1" + NB + "real":
            assert n in ("1", "um"), (alvo, n)
            if i < len(toks) and toks[i][0] == "real":
                i += 1
        elif alvo == "81" + NB + "mil":
            assert n == "81", (alvo, n)
            if i < len(toks) and toks[i][0] == "mil":
                i += 1
        elif alvo == "6.750":
            assert n.startswith("6"), (alvo, n)
            if i < len(toks) and toks[i][0] == "750":
                i += 1
        else:
            esp = alvo.lower().strip(".,:;!?")
            assert n == esp or (esp == "fature" and n in ("fatura", "faturi")), (alvo, n)
        out.append((alvo, s0))
    return out


def frase(lista, chave, fim):
    idx = []
    for k, (t, s) in enumerate(lista):
        e = lista[k + 1][1] if k + 1 < len(lista) else fim
        idx.append(len(words))
        words.append({"t": t, "s": round(s, 3), "e": round(e, 3)})
    key = idx[[t for t, _ in lista].index(chave)]
    phrases.append({"w": idx, "key": key, "s": words[idx[0]]["s"], "fim": round(fim, 3)})


for k, p in enumerate(P):
    ws = [(W[i]["t"], W[i]["s"]) for i in p["w"]]
    if k < 2:
        frase(ws, W[p["key"]]["t"], p["fim"])
    elif k == 2:
        # motivo 1, primeira frase: da narração aprovada, até o "fixa"
        um = ws[:7]
        um[6] = ("fixa.", um[6][1])
        frase(um, "fixa.", 8.02 + OFF)
        # segunda frase: a nova, com os tempos do whisper na voz convertida (f2-dylan-tr.json), tempo de f2-dylan.wav
        base = X - Y + pad + OFF
        tr = json.load(open(os.path.join(AQUI, "voz", "f2-dylan-tr.json"), encoding="utf-8"))
        nov = juntar(tr)
        nov[0] = ("Fature", max(nov[0][1], ONSET))
        frase([(t, base + s) for t, s in nov], "81" + NB + "mil", base + FIM_FALA0 + 0.05)
    else:
        frase([(t, s + DESLOCA) for t, s in ws], W[p["key"]]["t"], p["fim"] + DESLOCA)
CORRIGE = [  # (palavra, começo aproximado no tempo atual, começo novo, fim novo ou None)
    ("exatamente", 11.94, None, 12.52), ("6.750", 12.20, 12.62, 14.79), ("por", 13.92, 15.03, None), ("mês.", 15.12, 15.18, 15.42),
    ("Dois:", 15.81, 16.00, None), ("6%,", 18.39, None, 19.30), ("de", 19.11, 19.71, None), ("de", 20.95, 21.20, None),
    ("9.400", 22.19, None, 23.47), ("no", 23.07, 23.50, None), ("Três:", 24.35, 24.78, None), ("Quatro:", 31.01, 31.29, None),
]
for t, s0, ns, ne in CORRIGE:
    k = min((i for i, w in enumerate(words) if w["t"] == t), key=lambda i: abs(words[i]["s"] - s0))
    assert abs(words[k]["s"] - s0) < 0.15, (t, s0, words[k]["s"])
    if ns is not None:
        words[k]["s"] = ns
        if k > 0 and words[k - 1]["e"] > ns - 0.001 or (k > 0 and abs(words[k - 1]["e"] - s0) < 0.02):
            words[k - 1]["e"] = min(words[k - 1]["e"], ns) if words[k - 1]["e"] < ns else ns
    if ne is not None:
        words[k]["e"] = ne
for p in phrases:
    p["s"] = words[p["w"][0]]["s"]
for k, p in enumerate(phrases):
    p["out"] = round(words[phrases[k + 1]["w"][0]]["s"] - 0.02, 3) if k + 1 < len(phrases) else round(40.55 + DESLOCA, 3)
json.dump({"words": words, "phrases": phrases, "desloca": DESLOCA}, open(os.path.join(AQUI, "tempos-v7.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("tempos-v7.json:", len(words), "palavras,", len(phrases), "frases")
for p in phrases[:5]:
    print(" ", round(p["s"], 2), " ".join(words[i]["t"] for i in p["w"]), "| chave:", words[p["key"]]["t"], "| fim", p["fim"], "| sai", p["out"])
