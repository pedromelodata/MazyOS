"""Procura fala no som de um ou mais vídeos (whisper small, CPU), pra pegar fala inventada pelo modelo.

Uso: python -I fala_no_video.py VIDEO.mp4 [OUTRO.mp4 ...]
Imprime, por vídeo, os trechos que o whisper acha que são fala, com a probabilidade e o texto. Sem trecho = sem fala.
O whisper alucina em ruído ("Legendas por..."), então p_fala abaixo de 0,5 em som de foley costuma ser ruído;
na dúvida, olhar o espectrograma (fala tem harmônicas empilhadas que sobem e descem).
"""
import sys

sys.stdout.reconfigure(encoding="utf-8")
from faster_whisper import WhisperModel

m = WhisperModel("small", device="cpu", compute_type="int8", local_files_only=True)
for f in sys.argv[1:]:
    segs, info = m.transcribe(f, language="pt", vad_filter=True, beam_size=5)
    segs = list(segs)
    print(f"{f}: {len(segs)} trecho(s)")
    for s in segs:
        print(f"   {s.start:5.2f}-{s.end:5.2f} p_fala={1 - s.no_speech_prob:.2f} {s.text!r}")
