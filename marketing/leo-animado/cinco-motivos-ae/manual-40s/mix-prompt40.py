"""Mix do reel de 40 s pelo prompt do Pedro (13/10/2026): a narração nova numa tomada só ("Regere a narração para não
ficar cortada e faça de uma vez só": clone Pedro-Legalizai -> Dylan, voz/dylan-t2.wav, já com o "Vai, Legalizaí!" no
fim), 0,1 s pra dentro, e a trilha liberada House One (Mixkit 662) da janela verificada (51,711 s), 17 LU abaixo da
voz, com entrada e saída suaves. Sem efeito sonoro (regra do Pedro). A normalização pra -14 LUFS é no junta-prompt40.sh.
Saída: saida/som-prompt40.wav (48 kHz, estéreo, 16 bits), 40 s.
Uso: PYW -B mix-prompt40.py [voz em voz/, padrão dylan-t2.wav]   (14/10: a narração com a data é a voz/dylan-t5.wav)"""
import os
import subprocess
import sys
import wave

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
EXT = os.path.join(AQUI, "..", "..", "_assets-externos", "musica-v2")
SR, DUR, OFF = 48000, 40.0, 0.1


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


db = lambda g: 10 ** (g / 20)
n = int(SR * DUR)
voz = np.zeros(n, np.float32)
narr = carrega(os.path.join(AQUI, "voz", sys.argv[1] if len(sys.argv) > 1 else "dylan-t2.wav"))
i = int(round(OFF * SR))
m = min(len(narr), n - i)
voz[i:i + m] = narr[:m]
L_narr = lufs(narr)

tri = carrega(os.path.join(EXT, "04_house-one_francisco-alvear_mixkit-662_120bpm.mp3"), 51.711, DUR)
tri = np.pad(tri, (0, max(0, n - len(tri))))[:n]
env = np.ones(n, np.float32)
# a trilha some do fim da voz até os 40 s (no mínimo 1,2 s de saída)
fi, fo0 = int(0.6 * SR), int(min(38.7, OFF + len(narr) / SR) * SR)
env[:fi] = np.linspace(0, 1, fi)
env[fo0:] = np.linspace(1, 0, n - fo0)
L_tri = lufs(tri[: int(20 * SR)])
tri = tri * env * db((L_narr - 17.0) - L_tri)

mix = voz + tri
pico = float(np.max(np.abs(mix)))
if pico > 0.97:
    mix *= 0.97 / pico
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open(os.path.join(AQUI, "saida", "som-prompt40.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(np.repeat(pcm[:, None], 2, axis=1).tobytes())
print(f"som-prompt40.wav: {DUR} s; narração {L_narr:.1f} LUFS ({len(narr) / SR:.2f} s, termina em {OFF + len(narr) / SR:.2f} s), trilha {L_tri:.1f} -> {L_narr - 17:.1f}; pico {pico:.2f}")
