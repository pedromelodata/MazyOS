"""Voz da versão 6: as cinco falas das funcionalidades (tomada nova, clone do Pedro convertido pro Dylan, igual ao
resto do reel) encaixadas na voz aprovada da v2, entre o "Legalizaí" e o "Segue a gente".
  - corta cada frase nas pausas, pelos tempos do whisper refinados pelo silêncio (-40 dB);
  - a 1ª frase entra em INICIO (tempo do vídeo novo) e cada próxima PAUSA s depois do fim da anterior;
  - a voz da v2 de CORTE_VOZ em diante anda DELTA s (o "Segue a gente" cai em 18,62 + DELTA);
  - casa a loudness da fala nova com a da narração da v2;
  - grava a voz final e o JSON com as palavras e frases novas no tempo do vídeo (lido pelo gera.mjs e pelo 3D).
Uso: python -B voz-v6.py"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
VOZ = os.path.join(AQUI, "voz-v6")
PECA = os.path.normpath(os.path.join(AQUI, "..", "_kit-motion", "pecas", "2026-10-09-sufoco-burocratico-v2"))
SR = 48000
T_INS, CORTE_VOZ = 17.9, 18.0
INICIO, PAUSA, FOLGA_FIM = 18.25, 0.86, 0.17   # pausa como a da narração da v2 (0,65 a 1,05 s)
PAUSA_MAX = 1.05

# as falas como aparecem na legenda (a palavra-chave entre asteriscos)
FRASES = [
    "Um *painel* fácil de entender, com quanto entrou e o imposto do mês.",
    "O imposto vem calculado, e a guia chega *pronta.*",
    "Sua *alíquota* é acompanhada todo mês.",
    "A gente avisa cada *prazo* no app.",                 # v7: sem o WhatsApp, a pedido do Pedro
    "E, pra quem é prestador de serviço, um *contador* de verdade cuida da folha e das declarações.",   # v7
]


def le_wav(p):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).copy()


def grava_wav(p, x):
    x = np.clip(x, -1, 1)
    with wave.open(p, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def lufs(x):
    t = os.path.join(VOZ, "_tmp_lufs.wav")
    grava_wav(t, x)
    r = subprocess.run(["ffmpeg", "-v", "info", "-i", t, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    os.remove(t)
    return float([l for l in r.splitlines() if l.strip().startswith("I:")][-1].split()[1])


def env_db(x, t0, t1):
    a, b = int(t0 * SR), int(t1 * SR)
    seg = x[a:b]
    if len(seg) == 0:
        return -120.0
    return 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)


def fim_acustico(x, t, limite):
    """anda de 10 em 10 ms depois de t até a fala cair abaixo de -40 dB por 150 ms (com 80 ms, o estalo do "p" do
    "app", que vem depois do silêncio da oclusão, ficava de fora)"""
    q = t
    while q < limite:
        if all(env_db(x, q + k * 0.01, q + (k + 1) * 0.01) < -40 for k in range(15)):
            return q
        q += 0.01
    return limite


def ini_acustico(x, t, limite):
    """anda de 10 em 10 ms a partir de t até a fala passar de -60 dB por 30 ms (o começo pode estar no silêncio, ver
    as marcas da tomada C). -60 e não -40: o "S" do "Sua" fica entre -60 e -41 dB e sumia"""
    q = t
    while q < limite:
        if all(env_db(x, q + k * 0.01, q + (k + 1) * 0.01) >= -60 for k in range(3)):
            return q
        q += 0.01
    return t


# ---- as tomadas convertidas: A = a primeira (as 5 falas seguidas), B = as falas 1, 3 e 5 regravadas uma a uma
# (na A o "ME" perdia o "é" e a "alíquota" virava "alíquata"; na fala 2 a A flui melhor que a regravação);
# C = as falas 4 e 5 da v7 (sem o WhatsApp; "prestador de serviço"), juntas num arquivo só (falas/marcas-45v7.json)
FONTES = {"A": ("narr-dylan.wav", "transcricao-dylan.json"), "B": ("falas/dylan-135.wav", "falas/tr-dylan-135.json"),
          "C": ("falas/dylan-45v7.wav", "falas/tr-dylan-45v7.json", "falas/marcas-45v7.json")}
ESCOLHA = [("B", 0), ("A", 13), ("B", 13), ("C", 0), ("C", 7)]   # (tomada, índice da 1ª palavra)
aud, trs = {}, {}
for k, (wav, js, *marcas) in FONTES.items():
    aud[k] = le_wav(os.path.join(VOZ, wav))
    trs[k] = json.load(open(os.path.join(VOZ, js), encoding="utf-8-sig"))["palavras"]
    # depois do silêncio entre duas falas, o whisper começa a 1ª palavra da fala seguinte dentro do silêncio (na
    # tomada C, o "E" da fala 5 começava no fim do "app"): a palavra que atravessa o começo marcado começa nele
    for m in (json.load(open(os.path.join(VOZ, marcas[0]), encoding="utf-8"))["falas"] if marcas else []):
        for w in trs[k]:
            if w["s"] < m["ini"] - 0.05 < w["e"]:
                w["s"] = m["ini"]
rot = [[p.replace("*", "") for p in f.split()] for f in FRASES]
chaves = [[j for j, p in enumerate(f.split()) if p.startswith("*")][0] for f in FRASES]
frases = []
for fi, (k, i0) in enumerate(ESCOLHA):
    ws = trs[k]
    pal = ws[i0:i0 + len(rot[fi])]
    if len(pal) != len(rot[fi]):
        sys.exit(f"fala {fi + 1}: faltam palavras na tomada {k}")
    x = aud[k]
    j = i0 + len(pal)
    prox = ini_acustico(x, ws[j]["s"], ws[j]["e"] + 0.2) if j < len(ws) else len(x) / SR
    ant = ws[i0 - 1]["e"] if i0 > 0 else 0.0
    s = ini_acustico(x, pal[0]["s"], pal[0]["e"] + 0.2)
    e = fim_acustico(x, pal[-1]["e"] - 0.05, prox - 0.02)
    # (na tomada A o "S" do "Sua" vem colado no "pronta". Cortar no vale entre os dois, em 7,87 s, fez o whisper
    # ouvir "pronto"; com o corte em 8,00 s, como na v6, ele ouve "pronta". Fica o de 8,00 s.)
    if s > pal[0]["s"] + 0.05:   # a 1ª palavra começava no silêncio: o tempo dela no vídeo anda junto
        pal = [dict(pal[0], s=s)] + pal[1:]
    frases.append({"fonte": k, "pal": pal, "s": s, "e": e, "prox": prox, "ant": ant})
    print(f"fala {fi + 1} da tomada {k}: {s:.2f} a {e:.2f} s ({' '.join(w['w'] for w in pal)})")

# ---- a voz da v2 e o nível
v2 = le_wav(os.path.join(PECA, "voz", "voz-final.wav"))
nivel_v2 = lufs(v2[: int(17.84 * SR)])
ganhos = {}
for k in aud:
    trechos = [aud[k][int(f["s"] * SR):int(f["e"] * SR)] for f in frases if f["fonte"] == k]
    nv_ = lufs(np.concatenate(trechos))
    ganhos[k] = 10 ** ((nivel_v2 - nv_) / 20)
    print(f"loudness da fala: v2 {nivel_v2:.1f} LUFS, tomada {k} {nv_:.1f} LUFS, ganho {20 * np.log10(ganhos[k]):+.1f} dB")

# ---- os tempos no vídeo novo
fim0 = INICIO + sum(f["e"] - f["s"] for f in frases) + PAUSA * (len(frases) - 1)
DELTA = 2.0 * np.ceil((fim0 + FOLGA_FIM - T_INS) / 2.0)   # múltiplo de um compasso (2 s a 120 BPM)
# o que sobra até o compasso se espalha pelas pausas, até a maior pausa da narração da v2 (na v7, sem o WhatsApp,
# sobrava quase 1 s de silêncio antes do "Segue a gente")
pausa = min(PAUSA_MAX, PAUSA + (T_INS + DELTA - FOLGA_FIM - fim0) / (len(frases) - 1))
t = INICIO
for f in frases:
    f["t0"] = t
    t = t + (f["e"] - f["s"]) + pausa
fim_falas = frases[-1]["t0"] + frases[-1]["e"] - frases[-1]["s"]
print(f"falas de {INICIO:.2f} a {fim_falas:.2f} s, pausa de {pausa:.2f} s; DELTA = {DELTA:.0f} s "
      f"(o vídeo fica com {24.8 + DELTA:.1f} s)")

# ---- monta a voz
tot = int(round((24.8 + DELTA) * SR))
voz = np.zeros(tot, np.float32)
a = int(CORTE_VOZ * SR)
voz[:a] = v2[:a]
resto = v2[a:]
b = a + int(DELTA * SR)
voz[b:b + len(resto)] = resto[: tot - b]
fade = int(0.008 * SR)
for f in frases:
    c0 = max(f["ant"] + 0.02, f["s"] - 0.06)
    c1 = min(f["e"] + 0.12, f["prox"] - 0.02)
    seg = aud[f["fonte"]][int(c0 * SR):int(c1 * SR)].copy() * ganhos[f["fonte"]]
    seg[:fade] *= np.linspace(0, 1, fade)
    seg[-fade:] *= np.linspace(1, 0, fade)
    p = int(round((f["t0"] - (f["s"] - c0)) * SR))
    voz[p:p + len(seg)] += seg
os.makedirs(os.path.join(AQUI, "assets", "audio-v6"), exist_ok=True)
saida = os.path.join(AQUI, "assets", "audio-v6", "voz-final-v6.wav")
grava_wav(saida, voz)

# ---- as palavras e frases novas no tempo do vídeo
words, phrases = [], []
for fi, f in enumerate(frases):
    desloc = f["t0"] - f["s"]
    idx = []
    for j, w in enumerate(f["pal"]):
        words.append({"i": len(words), "t": FRASES[fi].replace("*", "").split()[j], "s": round(w["s"] + desloc, 3), "e": round(w["e"] + desloc, 3)})
        idx.append(len(words) - 1)
    phrases.append({"w": idx, "key": idx[chaves[fi]], "s": round(f["t0"], 3), "e": round(f["t0"] + f["e"] - f["s"], 3)})
for fi, p in enumerate(phrases):
    p["out"] = round(phrases[fi + 1]["s"] - 0.02, 3) if fi + 1 < len(phrases) else round(T_INS + DELTA - 0.03, 3)
narr = {"T_INS": T_INS, "DELTA": float(DELTA), "corteVoz": CORTE_VOZ, "duracao": round(24.8 + DELTA, 3),
        "voz": os.path.relpath(saida, AQUI).replace("\\", "/"), "words": words, "phrases": phrases,
        "frases": [f.replace("*", "") for f in FRASES]}
json.dump(narr, open(os.path.join(AQUI, "assets", "narracao-v6-funcoes.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for p, f in zip(phrases, FRASES):
    print(f"  {p['s']:6.2f} a {p['e']:6.2f}  {f}")
print("voz:", saida)
