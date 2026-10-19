"""Monta o filme da Pipoca, em 15 s e em 10 s, a partir dos takes de takes/entrega/.

Corte seco entre os planos, sem música (só o foley dos próprios takes) e sem legenda (o Pedro põe depois).
Sai em 1080x1920, 24 fps, BT.709, com o som normalizado pelo loudnorm (perto de -18 LUFS, pico de -1,5 dBTP).

Uso (venv do corte-viral):
  python -I monta.py 15 SAIDA.mp4
  python -I monta.py 10 SAIDA.mp4
"""
import json
import os
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
ENTREGA = os.path.join(AQUI, "takes", "entrega")
FPS = 24

# (take, quadro de entrada, quadro de saída): o quadro de saída não entra
CORTES = {
    "15": [
        ("T1.mp4", 10, 66),    # escreve, larga a caneta na folha e a mão descansa
        ("T2.mp4", 66, 140),   # ela chega com a pipoca e pousa a mão sobre a dele
        ("T3.mp4", 0, 132),    # "Repetir última nota", o valor entra, "Revisar nota", solta e sai a nota emitida (q104)
        ("T4.mp4", 37, 91),    # ele larga o celular com a nota emitida e pega a mão dela
        ("T5.mp4", 6, 50),     # os dois vão pra sala
    ],
    "10": [
        ("T1.mp4", 40, 76),
        ("T2.mp4", 104, 140),
        ("T3r.mp4", 6, 98),    # o mesmo take 3, 1,45x mais rápido (nota emitida a partir do q75)
        ("T4.mp4", 59, 91),
        ("T5.mp4", 6, 50),
    ],
}
for v, cs in CORTES.items():
    assert sum(b - a for _, a, b in cs) == int(v) * 24, (v, sum(b - a for _, a, b in cs))

versao, saida = sys.argv[1], sys.argv[2]
cortes = CORTES[versao]

entradas, filtros, rotulos = [], [], []
for i, (f, a, b) in enumerate(cortes):
    entradas += ["-i", os.path.join(ENTREGA, f)]
    t0, t1 = a / FPS, b / FPS
    filtros.append(
        f"[{i}:v]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS,"
        "scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int:in_color_matrix=bt709:out_color_matrix=bt709:"
        f"in_range=tv:out_range=tv,format=yuv420p,setsar=1,fps={FPS}[v{i}]")
    d = t1 - t0
    filtros.append(
        f"[{i}:a]atrim=start={t0:.5f}:end={t1:.5f},asetpts=PTS-STARTPTS,aresample=48000,"
        f"aformat=channel_layouts=stereo,afade=t=in:d=0.015,afade=t=out:st={d - 0.015:.5f}:d=0.015[a{i}]")
    rotulos.append(f"[v{i}][a{i}]")
filtros.append("".join(rotulos) + f"concat=n={len(cortes)}:v=1:a=1[v][acru]")
dur = sum((b - a) / FPS for _, a, b in cortes)
print("versão", versao, "duração", round(dur, 3), "s")

# Som: o foley dos takes é quase silêncio de sala com estalos de toque, caneta e passo batendo perto de 0 dBFS. O
# loudnorm em duas passadas pede linear, não consegue (o pico estouraria) e cai no modo dinâmico, que sobe o foley e
# segura os estalos sem achatar: o filme fica perto de -18 LUFS. Testado e descartado: compressor e limitador antes
# (ffmpeg e numpy) e ganho fixo preso no pico (sai a -29 LUFS).
grafo = ";".join(filtros + ["[acru]loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json[a]", "[v]nullsink"])
p = subprocess.run(["ffmpeg", "-hide_banner", "-y"] + entradas + ["-filter_complex", grafo, "-map", "[a]", "-f", "null", "-"],
                   capture_output=True, text=True)
m = json.loads(p.stderr[p.stderr.rfind("{"):p.stderr.rfind("}") + 1])
print("medido: I", m["input_i"], "TP", m["input_tp"], "LRA", m["input_lra"])
ln = (f"loudnorm=I=-15:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
      f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
grafo = ";".join(filtros + [f"[acru]{ln},aresample=48000[a]"])
subprocess.run(["ffmpeg", "-v", "error", "-y"] + entradas + [
    "-filter_complex", grafo, "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", saida], check=True)
print("ok", saida)
