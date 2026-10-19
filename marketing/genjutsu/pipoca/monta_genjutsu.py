"""Monta os filmes da Pipoca feitos sobre os vídeos de banco (Genjutsu/edição + MiniMax H3), em 16:9.

Ordem pedida pelo Pedro em 19/10: ele estressado trabalhando; ela chega com a pipoca e toca nele; só então ele pega o
celular que estava deitado na mesa; corte pro close dele tocando em "Revisar nota" com o valor já preenchido; o dedo
solta e aparece o check de nota emitida; volta pro plano aberto e ele sai com ela. "Esse tá perfeito, só aumentar mais
o tempo dele saindo e deixando a cadeira sozinha": a saída roda sempre na velocidade normal, e o tempo que sobra no
fim vira cadeira vazia.

Cada pedaço é (arquivo, início, fim, velocidade). O fim é acertado pra cair num quadro inteiro, e a velocidade acelera
sem mudar o tom do som (atempo). O que sobra até a duração pedida vira a espera da cadeira vazia: o último quadro segue
com o mesmo movimento de câmera (medido nos últimos quadros), uma aproximação bem lenta e grão.

Som: o de cada pedaço, sem a fala inventada que o modelo pôs na boca dela no A1 (MUDO), com um ambiente contínuo por
baixo do filme inteiro (o ar da sala, tirado da tela de nota e sem os tons de zumbido), pra não ter buraco de silêncio
nos cortes nem na espera. No fim, ganho linear até -16 LUFS e limitador só nos picos.

Uso (venv do corte-viral):  python -I monta_genjutsu.py v1|v2 10|15 SAIDA.mp4
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
video, dur_txt, saida = sys.argv[1], sys.argv[2], sys.argv[3]
DUR = float(dur_txt)
FPS, SR = 24, 48000
W, H = 1920, 1080

PLANOS = {
    "v1": {
        # estresse (mão na testa, punho, volta a escrever) / ela chega, toca, ele sorri e pega o celular /
        # o dedo vem e aperta "Revisar nota" / solta e aparece a nota emitida / ele levanta, pega a mão dela e saem
        # nos closes o botão fica apertado só com o dedo nele (I-S1b do quadro 23, I-S2 até o 14) e a nota emitida
        # só aparece com o dedo já fora do celular (I-S2 do quadro 19): o check fica 0,7 s no de 10 e 1 s no de 15
        "10": [("v1b/A1.mp4", 1.30, 3.45, 1.65), ("v1b/A1.mp4", 3.45, 6.80, 1.35),
               ("insert/I-S1b-tela.mp4", 0.55, 1.10, 1.0), ("insert/I-S2-tela.mp4", 0.45, 1.45, 1.0),
               ("v1b/C1.mp4", 2.80, 6.58, 1.0)],
        "15": [("v1b/A1.mp4", 0.60, 3.45, 1.0), ("v1b/A1.mp4", 3.45, 7.30, 1.0),
               ("insert/I-S1b-tela.mp4", 0.10, 1.20, 1.0), ("insert/I-S2-tela.mp4", 0.30, 1.75, 1.0),
               ("v1b/C1.mp4", 2.50, 6.58, 1.0)],
    },
    "v2": {
        # no A2 o corte pro close cai na mão indo até a mesa (até o quadro 163): do 164 em diante ele já segura um
        # celular e outro continua deitado na mesa, erro do modelo. Nos closes o dedo encosta no botão no quadro 64
        # do J-S1, solta no 30 do J-S2 e a nota emitida entra no 31, com o dedo já fora do celular
        "10": [("oi2/A2.mp4", 1.25, 4.40, 1.6), ("oi2/A2.mp4", 4.40, 6.75, 1.25),
               ("oi2/insert/J-S1-tela.mp4", 2.45, 2.95, 1.0), ("oi2/insert/J-S2-tela.mp4", 0.85, 2.00, 1.0),
               ("oi2/V2-saida.mp4", 2.40, 6.58, 1.0)],
        "15": [("oi2/A2.mp4", 0.40, 4.40, 1.0), ("oi2/A2.mp4", 4.40, 6.75, 1.0),
               ("oi2/insert/J-S1-tela.mp4", 1.90, 3.00, 1.0), ("oi2/insert/J-S2-tela.mp4", 0.80, 2.20, 1.0),
               ("oi2/V2-saida.mp4", 1.90, 6.58, 1.0)],
    },
}
ULTIMO_QUADRO = {"oi2/A2.mp4": 163}
# trechos de som tirados, no tempo do arquivo: a fala sem sentido que o H3 gerou pra ela no A1
MUDO = {"v1b/A1.mp4": [(4.30, 5.95)]}
# de onde sai o ar da sala do filme todo (arquivo, início, fim)
CAMA = {"v1": ("insert/I-S2-tela.mp4", 0.2, 6.4), "v2": ("oi2/insert/J-S2-tela.mp4", 0.2, 6.4)}
CAMA_GANHO_DB = -3.0

pedacos = []
for f, t0, t1, v in PLANOS[video][dur_txt]:
    n = int(round((t1 - t0) * FPS / v))
    t1 = t0 + n * v / FPS
    q0, q1 = int(np.ceil(t0 * FPS - 1e-6)), int(np.ceil(t1 * FPS - 1e-6)) - 1
    assert q1 <= ULTIMO_QUADRO.get(f, 10 ** 6), (f, q1)
    pedacos.append((f, t0, t1, v, n))
n_corpo = sum(p[4] for p in pedacos)
n_total = int(round(DUR * FPS))
n_seg = n_total - n_corpo
assert n_seg >= 0, f"os pedaços passam da duração em {-n_seg} quadros"
pos = 0
for f, t0, t1, v, n in pedacos:
    print(f"{pos / FPS:6.2f} a {(pos + n) / FPS:6.2f} s  {f}: {t0:.3f} a {t1:.3f} s (quadros {int(np.ceil(t0 * FPS - 1e-6))} "
          f"a {int(np.ceil(t1 * FPS - 1e-6)) - 1}), {v:.2f}x, {n} quadros")
    pos += n
print(f"{pos / FPS:6.2f} a {n_total / FPS:6.2f} s  cadeira vazia segurando mais {n_seg / FPS:.2f} s")

# imagem do corpo
ESC = "scale=1920:1080:flags=lanczos+accurate_rnd+full_chroma_int:in_color_matrix=bt709:out_color_matrix=bt709:in_range=tv:out_range=tv"
entradas, filtros, rot = [], [], []
for i, (f, t0, t1, v, n) in enumerate(pedacos):
    entradas += ["-i", os.path.join(AQUI, f)]
    filtros.append(f"[{i}:v]trim=start={t0:.5f}:end={t1:.5f},setpts=(PTS-STARTPTS)/{v:.5f},fps={FPS},{ESC},"
                   f"format=yuv420p,setsar=1,tpad=stop_mode=clone:stop=4,trim=end_frame={n}[v{i}]")
    rot.append(f"[v{i}]")
filtros.append("".join(rot) + f"concat=n={len(pedacos)}:v=1:a=0[v]")
tmp = saida + ".corpo.mov"
subprocess.run(["ffmpeg", "-v", "error", "-y"] + entradas + ["-filter_complex", ";".join(filtros), "-map", "[v]",
                "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-pix_fmt", "yuv420p",
                "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", tmp],
               check=True)

# a cadeira vazia: os últimos quadros dão a velocidade da câmera; o último quadro segue com ela e aproxima devagar
LEQ = "scale=in_color_matrix=bt709:in_range=tv:flags=accurate_rnd+full_chroma_int+bitexact,format=bgr24"
GRAVA = "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int+bitexact,format=yuv420p"
info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
                                  "stream=nb_read_frames", "-of", "json", tmp], capture_output=True, text=True).stdout)
assert int(info["streams"][0]["nb_read_frames"]) == n_corpo, info
tmp2 = saida + ".cauda.mp4"
if n_seg:
    b = subprocess.run(["ffmpeg", "-v", "error", "-sseof", "-0.5", "-i", tmp, "-vf", LEQ, "-f", "rawvideo", "-"],
                       capture_output=True, check=True).stdout
    ult = np.frombuffer(b, np.uint8).reshape(-1, H, W, 3)
    g0 = cv2.cvtColor(ult[0], cv2.COLOR_BGR2GRAY).astype(np.float32)
    g1 = cv2.cvtColor(ult[-1], cv2.COLOR_BGR2GRAY).astype(np.float32)
    (dx, dy), _ = cv2.phaseCorrelate(g0, g1)
    vx = float(np.clip(dx / max(1, len(ult) - 1), -3, 3))
    vy = float(np.clip(dy / max(1, len(ult) - 1), -3, 3))
    print(f"câmera no fim: {vx:.2f}, {vy:.2f} px por quadro")
    base = ult[-1]
    zoom = 0.012 * n_seg / FPS
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                          "-r", str(FPS), "-i", "-", "-vf", GRAVA, "-c:v", "libx264", "-preset", "slow", "-crf", "12",
                          "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
                          tmp2], stdin=subprocess.PIPE)
    for k in range(1, n_seg + 1):
        # a velocidade da câmera cai suave até parar; a aproximação começa parada e cresce devagar
        t = k / n_seg
        andou = k - 0.5 * k * k / n_seg
        s = 1.0 + zoom * t * t * (3 - 2 * t)
        M = np.float32([[s, 0, (1 - s) * W / 2 - vx * andou], [0, s, (1 - s) * H / 2 - vy * andou]])
        q = cv2.warpAffine(base, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT).astype(np.float32)
        q += np.random.default_rng(k).normal(0, 1.6, q.shape[:2])[..., None]
        p.stdin.write(np.clip(q, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    assert p.wait() == 0


# som
def le_audio(arq, t0, t1, filtro=""):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{t0:.5f}", "-t", f"{t1 - t0:.5f}", "-i", os.path.join(AQUI, arq), "-vn"]
    if filtro:
        cmd += ["-af", filtro]
    r = subprocess.run(cmd + ["-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).reshape(-1, 2).copy()


def rampa(n, sobe=True):
    r = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n))
    return r if sobe else r[::-1]


partes, ini = [], 0
for f, t0, t1, v, n in pedacos:
    alvo = int(round(n / FPS * SR))
    tempo, resto = [], v
    while resto > 2.0:
        tempo.append("atempo=2.0")
        resto /= 2.0
    if abs(resto - 1) > 1e-4:
        tempo.append(f"atempo={resto:.6f}")
    a = le_audio(f, t0, t1, ",".join(tempo))
    a = np.pad(a, ((0, max(0, alvo - len(a))), (0, 0)))[:alvo]
    # trechos mudos, levados pro tempo do filme
    for m0, m1 in MUDO.get(f, []):
        s0, s1 = (max(m0, t0) - t0) / v, (min(m1, t1) - t0) / v
        if s1 <= s0:
            continue
        r = int(0.08 * SR)
        g = np.ones(len(a), np.float32)
        i0, i1 = int(s0 * SR), int(s1 * SR)
        g[i0:i1] = 0
        a0, a1 = max(0, i0 - r), min(len(a), i1 + r)
        g[a0:i0] = rampa(i0 - a0, False)
        g[i1:a1] = rampa(a1 - i1, True)
        a *= g[:, None]
        print(f"som tirado de {f} entre {m0:.2f} e {m1:.2f} s (no filme, {ini + s0:.2f} a {ini + s1:.2f} s)")
    k = int(0.012 * SR)
    a[:k] *= rampa(k)[:, None]
    a[-k:] *= rampa(k, False)[:, None]
    partes.append(a)
    ini += n / FPS
corpo = np.concatenate(partes)
n_amostras = int(round(n_total / FPS * SR))
mix = np.pad(corpo, ((0, n_amostras - len(corpo)), (0, 0)))

# o ar da sala: ruído com o mesmo timbre do ambiente da tela de nota, sem os picos de zumbido e sem emenda de loop
c_arq, c0, c1 = CAMA[video]
ref = le_audio(c_arq, c0, c1).mean(axis=1)
nf = 4096
quadros = np.array([ref[i:i + nf] * np.hanning(nf) for i in range(0, len(ref) - nf, nf // 2)])
psd = (np.abs(np.fft.rfft(quadros, axis=1)) ** 2).mean(0)
ld = 10 * np.log10(psd + 1e-20)
lis = np.array([np.median(ld[max(0, i - 24):i + 25]) for i in range(len(ld))])
hz = np.fft.rfftfreq(nf, 1 / SR)
lis[hz < 40] -= 30
lis[hz > 9000] -= 20
amp_ref = np.sqrt(10 ** (lis / 10))
rng = np.random.default_rng(7)
cama = np.zeros((n_amostras, 2), np.float32)
hz_long = np.fft.rfftfreq(n_amostras, 1 / SR)
amp = np.interp(hz_long, hz, amp_ref)
for c in range(2):
    ruido = np.fft.irfft(np.fft.rfft(rng.normal(0, 1, n_amostras)) * amp, n_amostras)
    cama[:, c] = ruido / (np.sqrt(np.mean(ruido ** 2)) + 1e-12)
alvo_rms = np.sqrt(np.mean(ref ** 2)) * 10 ** (CAMA_GANHO_DB / 20)
cama *= alvo_rms
print(f"ar da sala a {20 * np.log10(alvo_rms + 1e-12):.1f} dBFS, tirado de {c_arq}")
mix += cama
# entra e sai suave nas pontas do filme
k = int(0.25 * SR)
mix[:k] *= rampa(k)[:, None]
k = int(0.6 * SR)
mix[-k:] *= rampa(k, False)[:, None]

wav = saida + ".som.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_f32le", wav],
               input=mix.astype(np.float32).tobytes(), check=True)
med = subprocess.run(["ffmpeg", "-hide_banner", "-i", wav, "-af", "lowpass=f=9000,ebur128=peak=true", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
lin = [x for x in med.splitlines() if x.strip().startswith("I:")]
I = float(lin[-1].split()[1])
ganho = -16.0 - I
print(f"som do filme a {I:.1f} LUFS, ganho de {ganho:+.1f} dB")
AF = (f"lowpass=f=9000,volume={ganho:.2f}dB,alimiter=limit=0.79:level=disabled:attack=2:release=60:latency=1,"
      f"aresample={SR}")

# junta corpo, cauda e som
entradas = ["-i", tmp] + (["-i", tmp2] if n_seg else []) + ["-i", wav]
vf = "[0:v][1:v]concat=n=2:v=1:a=0[v]" if n_seg else "[0:v]null[v]"
ia = 2 if n_seg else 1
subprocess.run(["ffmpeg", "-v", "error", "-y"] + entradas + ["-filter_complex", f"{vf};[{ia}:a]{AF}[a]",
                "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
                "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
                "-c:a", "aac", "-b:a", "192k", "-t", f"{DUR:.4f}", "-movflags", "+faststart", saida], check=True)
for x in (tmp, tmp2, wav):
    if os.path.exists(x):
        os.remove(x)
print("ok", saida)
