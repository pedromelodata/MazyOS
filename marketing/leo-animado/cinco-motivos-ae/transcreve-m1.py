"""Transcreve uma tomada da fala nova do motivo 1 (faster-whisper small, como o tr1/tr2) e mostra as palavras com tempo."""
import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8", local_files_only=True)
segs, info = m.transcribe(sys.argv[1], language="pt", word_timestamps=True, beam_size=5)
ws = []
for s in segs:
    for w in s.words:
        ws.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 3)})
print(" ".join(x["w"] for x in ws))
print(" | ".join(f'{x["w"]} {x["s"]}-{x["e"]} p{x["p"]}' for x in ws))
if len(sys.argv) > 2:
    json.dump(ws, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
