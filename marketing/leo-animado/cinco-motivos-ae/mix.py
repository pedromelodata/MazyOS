"""Mix do reel "Cinco motivos pra ter CNPJ" (09/10/2026): narração do Dylan (tomada 1, 0,25 s pra dentro), o fecho
fixo do kit ("Vai, Legalizaí", 40,9 s), a trilha liberada House One (Mixkit 662) por baixo e os efeitos liberados do
catálogo (whoosh 1490 nas trocas de cena, clique 2568 nos cartões do motivo 4 e nos toques do link da bio, verificado 2867 no símbolo da marca).
Saída: audio/mix.wav (48 kHz, estéreo, 16 bits), do tamanho do vídeo. A normalização pra -14 LUFS é na codificação.
Uso: PYW -B mix.py"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
EXT = os.path.join(AQUI, "..", "_assets-externos", "musica-v2")
SR, DUR, OFF = 48000, 43.3, 0.25


def carrega(caminho, ini=0.0, dur=None):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(ini), "-i", caminho]
    if dur:
        cmd += ["-t", str(dur)]
    cmd += ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).copy()


def lufs(x):
    p = subprocess.run(["ffmpeg", "-v", "info", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", "ebur128", "-f", "null", "-"],
                       input=x.astype(np.float32).tobytes(), capture_output=True)
    linhas = [l for l in p.stderr.decode("utf-8", "replace").splitlines() if l.strip().startswith("I:")]
    return float(linhas[-1].split()[1])


def db(g):
    return 10 ** (g / 20)


n = int(SR * DUR)
voz = np.zeros(n, np.float32)
efx = np.zeros(n, np.float32)


def poe(dst, x, t, ganho=1.0):
    i = int(round(t * SR))
    if i >= len(dst):
        return
    m = min(len(x), len(dst) - i)
    dst[i:i + m] += x[:m] * ganho


narr = carrega(os.path.join(AQUI, "voz", "voz-dylan.wav"))
fecho = carrega(os.path.join(AQUI, "..", "_kit-motion", "voz", "fecho", "vai-legalizai-dylan.wav"))
L_narr, L_fecho = lufs(narr), lufs(fecho)
poe(voz, narr, OFF)
poe(voz, fecho, 40.9, db(L_narr - L_fecho))

# trilha: House One, da janela já verificada (51,711 s), bem por baixo da voz, com entrada e saída suaves
tri = carrega(os.path.join(EXT, "04_house-one_francisco-alvear_mixkit-662_120bpm.mp3"), 51.711, DUR)
tri = np.pad(tri, (0, max(0, n - len(tri))))[:n]
env = np.ones(n, np.float32)
fi, fo0 = int(0.6 * SR), int(41.9 * SR)
env[:fi] = np.linspace(0, 1, fi)
env[fo0:] = np.linspace(1, 0, n - fo0)
L_tri = lufs(tri[: int(20 * SR)])
tri = tri * env * db((L_narr - 17.0) - L_tri)

SFX = os.path.join(EXT, "sfx")
whoosh = carrega(os.path.join(SFX, "flip_fast-whoosh-transition_mixkit-1490.wav"))
clique = carrega(os.path.join(SFX, "clique_cool-interface-click-tone_mixkit-2568.wav"))
visto = carrega(os.path.join(SFX, "verificado_confirmation-tone_mixkit-2867.wav"))
T = json.load(open(os.path.join(AQUI, "legenda-tempos.json"), encoding="utf-8"))
W = T["words"]


def S(txt, k=1):
    c = 0
    for w in W:
        if w["t"].strip(".,:?!").lower() == txt.lower():
            c += 1
            if c == k:
                return w["s"]
    raise SystemExit("palavra " + txt)


for t in [3.07, 5.5, 10.45, 18.78, 25.2, 29.93, 33.35, 35.62, 40.4]:
    poe(efx, whoosh, t, db(-9))
# sem o clique na entrada dos números dos motivos (Pedro, v4: "tire esse efeito sonoro fino toda vez que aparece um número")
for t in [S("calcula") - 0.1, S("nota") - 0.12, S("paga") - 0.12, S("clique"), S("bio")]:
    poe(efx, clique, t, db(-8))
for t in [S("bolso") - 0.05, S("aposentadoria") + 0.1, S("gente") - 0.06, S("espera") - 0.05, 41.84]:
    poe(efx, visto, t, db(-11))

mix = voz + tri + efx
pico = float(np.max(np.abs(mix)))
if pico > 0.97:
    mix *= 0.97 / pico
os.makedirs(os.path.join(AQUI, "audio"), exist_ok=True)
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open(os.path.join(AQUI, "audio", "mix.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(np.repeat(pcm[:, None], 2, axis=1).tobytes())
print(f"mix.wav: {DUR} s; narração {L_narr:.1f} LUFS, fecho {L_fecho:.1f} (ajustado), trilha {L_tri:.1f} -> {L_narr - 17:.1f}; pico {pico:.2f}")
