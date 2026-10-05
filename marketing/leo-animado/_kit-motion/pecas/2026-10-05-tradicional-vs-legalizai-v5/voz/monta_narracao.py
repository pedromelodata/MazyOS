"""narração da v5 (a v4 com mais dois ajustes do Pedro, 05/10 à noite): o "CRC" soletrado, "cê, erre, cê", com as
três letras separadas (s8-virg; o "cêerrecê" junto da v4 embolava), e "O mesmo cuidado, mas agora no ép que tá
chegando." (s9-mas-b). O que veio da v4:
- "app" se diz "ép" (só na voz; a legenda continua "app"): as duas frases com app são TTS novo escrito "ép"
  (s4-ep e s9-ep-b; a "no app que tá chegando" da v3 vinha da leitura da v1 e saía "áp");
- "CNAE" vira "atividade": "com a atividade certa";
- a fala do contador com menos pausas: TTS sem vírgula e com "cêerrecê" junto (s8-junto), sem acelerar, e as pausas
  internas limitadas a 0,12 s.
As outras frases são as mesmas da v3 (leitura da v1 e TTS da v3). Nível casado pela loudness da v1, pausa de 0,40 s
entre as frases."""
import json
import re
import subprocess
import wave

import numpy as np

SR = 48000
PAUSA = 0.40


def le(p, atempo=None):
    af = ["aresample=48000"] + ([f"atempo={atempo}"] if atempo else [])
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-af", ",".join(af), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def grava(p, x):
    y = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(p, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(y.tobytes())


def lufs(x):
    grava("_lufs.wav", x)
    out = subprocess.run(["ffmpeg", "-v", "info", "-nostats", "-i", "_lufs.wav", "-af", "ebur128=framelog=quiet", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])


def env(x, win=0.01):
    n = int(SR * win)
    k = len(x) // n
    return 20 * np.log10(np.sqrt(np.mean(x[: k * n].reshape(k, n) ** 2, axis=1) + 1e-12))


def apara(x, limiar=-45.0, borda=0.06):
    """tira o silêncio de fora (deixa 60 ms de cada lado)"""
    e = env(x)
    on = np.where(e > limiar)[0]
    i0 = max(0, int((on[0] * 0.01 - borda) * SR))
    i1 = min(len(x), int(((on[-1] + 1) * 0.01 + borda) * SR))
    return x[i0:i1]


def encurta_pausas(x, limiar=-45.0, maxp=0.24, minimo=0.30):
    """pausa interna de mais de 'minimo' s (abaixo do limiar) fica com 'maxp' s: metade logo depois da fala e metade
    logo antes da fala seguinte; o miolo da pausa sai"""
    e = env(x)
    quieto = e < limiar
    n = len(quieto)
    tira = []
    i = 0
    while i < n:
        if quieto[i]:
            j = i
            while j < n and quieto[j]:
                j += 1
            if (j - i) * 0.01 > minimo and i > 0 and j < n:
                tira.append((int((i * 0.01 + maxp / 2) * SR), int((j * 0.01 - maxp / 2) * SR)))
            i = j
        else:
            i += 1
    partes = []
    pos = 0
    for a, b in tira:
        partes.append(x[pos:a])
        pos = b
    partes.append(x[pos:])
    return np.concatenate(partes)


v1 = le("v1-narr-pedro-ed.wav")
corte = lambda a, b: v1[int(a * SR) : int(b * SR)]
velhas = {
    "S1": corte(0.0, 3.40),
    "S2": corte(3.55, 4.80),
    "S5S6": corte(9.30, 13.05),
    "S7": corte(13.15, 14.20),
}
ref = lufs(np.concatenate([apara(velhas[k]) for k in velhas]))
novas = {}
# (nome, arquivo, atempo, pausa máxima, pausa mínima que é encurtada)
for nome, arq, at, maxp, minimo in (("S3", "s3.wav", 1.08, 0.24, 0.30), ("S4", "s4-ep.wav", 1.08, 0.24, 0.30), ("S8", "s8-virg.wav", 1.08, 0.14, 0.15),
                                    ("S9", "s9-mas-b.wav", 1.08, 0.24, 0.30), ("S10", "s10a.wav", 1.08, 0.30, 0.30)):
    x = le(arq, atempo=at)
    x = apara(x)
    x = encurta_pausas(x, maxp=maxp, minimo=minimo)
    g = ref - lufs(x)
    novas[nome] = x * (10 ** (g / 20))
    print(f"{nome}: {len(x) / SR:.2f} s, ganho {g:+.2f} dB")
ordem = ["S1", "S2", "S3", "S4", "S5S6", "S7", "S8", "S9", "S10"]
pedacos = []
mapa = []
t = 0.0
for i, nome in enumerate(ordem):
    x = apara(velhas[nome]) if nome in velhas else novas[nome]
    f = int(0.005 * SR)
    x = x.copy()
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    if i:
        pedacos.append(np.zeros(int(PAUSA * SR), dtype=np.float32))
        t += PAUSA
    mapa.append({"frase": nome, "de": round(t, 3), "ate": round(t + len(x) / SR, 3), "origem": "v1 aprovada" if nome in velhas else "TTS novo"})
    pedacos.append(x)
    t += len(x) / SR
pedacos.append(np.zeros(int(0.3 * SR), dtype=np.float32))
y = np.concatenate(pedacos)
pico = float(np.abs(y).max())
if pico > 0.98:
    y *= 0.98 / pico
grava("narr-pedro-v5.wav", y)
json.dump({"referenciaLufs": ref, "pausa": PAUSA, "frases": mapa}, open("narr-pedro-v5.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"narr-pedro-v5.wav: {len(y) / SR:.2f} s, pico {min(pico, 0.98):.3f}, referência {ref:.2f} LUFS")
for m in mapa:
    print(f"  {m['frase']:5s} {m['de']:6.2f} a {m['ate']:6.2f}  ({m['origem']})")
import os

os.remove("_lufs.wav")
