"""Junta os três trechos do take 3 (gerados com a tela real nos quadros-chave e a tela real por cima) num take só.

S1: o dedo sobe e aperta "Repetir última nota" (tela 1).  S2: o valor já preenchido, o dedo desce e aperta
"Revisar nota" (tela 2).  S3: o dedo sai do botão e só então aparece a nota emitida (tela 3), como no app, que age
quando o dedo solta.
Cada trecho termina segurando o toque; essa espera é comprimida em 5 quadros, e o corte pro trecho seguinte cai no
mesmo gesto, então a tela troca na hora do toque, como no app.

Uso (venv do corte-viral):  python -I junta_t3.py SAIDA.mp4 [VELOCIDADE]
"""
import os
import subprocess
import sys

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
saida = sys.argv[1]
VEL = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
W, H, FPS = 1440, 2560, 24
LE = "scale=in_color_matrix=bt709:in_range=tv:flags=accurate_rnd+full_chroma_int+bitexact,format=bgr24"
GRAVA = "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int+bitexact,format=yuv420p"


def quadros(nome):
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(AQUI, nome), "-vf", LE, "-f", "rawvideo", "-"],
                       capture_output=True, check=True).stdout
    return np.frombuffer(b, np.uint8).reshape(-1, H, W, 3)


S1, S2, S3 = quadros("S1-tela.mp4"), quadros("S2-tela.mp4"), quadros("S3-tela.mp4")


def faixa(a, b, vel):
    """Índices de a até b (b fora), andando vel quadros por quadro de saída."""
    n = max(1, int(round((b - a) / vel)))
    return [int(round(a + k * vel)) for k in range(n)]


# (trecho, índices, início do áudio no trecho, fim do áudio, velocidade do áudio)
plano = [
    (S1, faixa(4, 25, VEL), 4 / FPS, 25 / FPS, VEL, "S1-tela.mp4"),
    (S1, [int(round(x)) for x in np.linspace(25, 106, 6)[1:]], None, None, None, "S1-tela.mp4"),
    (S2, faixa(0, 72, 1.3 * VEL), 0, 72 / FPS, 1.3 * VEL, "S2-tela.mp4"),
    (S2, [int(round(x)) for x in np.linspace(72, 157, 6)[1:]], None, None, None, "S2-tela.mp4"),
    # S3 começa com o dedo ainda no botão (a tela segue a 2, apertada) e troca pra nota emitida quando o dedo sai
    (S3, faixa(30, 130, VEL), 30 / FPS, 130 / FPS, VEL, "S3-tela.mp4"),
]

tmp = saida + ".video.mp4"
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
                      "-i", "-", "-vf", GRAVA, "-c:v", "libx264", "-preset", "slow", "-crf", "14",
                      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", tmp],
                     stdin=subprocess.PIPE)
total = 0
for trecho, idx, *_ in plano:
    for i in idx:
        p.stdin.write(trecho[min(i, len(trecho) - 1)].tobytes())
        total += 1
p.stdin.close()
p.wait()

# som: cada pedaço no mesmo tempo da imagem; a espera comprimida fica com o fim do pedaço anterior em silêncio curto
entradas, filtros, rot = [], [], []
for k, (trecho, idx, a0, a1, av, nome) in enumerate(plano):
    entradas += ["-i", os.path.join(AQUI, nome)]
    d = len(idx) / FPS
    if a0 is None:
        filtros.append(f"anullsrc=r=48000:cl=stereo,atrim=duration={d:.5f}[a{k}]")
    else:
        tempo = f",atempo={av:.5f}" if abs(av - 1) > 1e-3 else ""
        filtros.append(f"[{k + 1}:a]atrim=start={a0:.5f}:end={a1:.5f},asetpts=PTS-STARTPTS,aresample=48000,"
                       f"aformat=channel_layouts=stereo{tempo},apad,atrim=duration={d:.5f},"
                       f"afade=t=in:d=0.01,afade=t=out:st={max(0, d - 0.01):.5f}:d=0.01[a{k}]")
    rot.append(f"[a{k}]")
filtros.append("".join(rot) + f"concat=n={len(plano)}:v=0:a=1[a]")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp] + entradas + [
    "-filter_complex", ";".join(filtros),
    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", saida], check=True)
os.remove(tmp)
print("ok", saida, total, "quadros", round(total / FPS, 2), "s")
