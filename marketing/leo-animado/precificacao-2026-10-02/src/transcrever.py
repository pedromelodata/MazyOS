import sys, json
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]
m = WhisperModel("mobiuslabsgmbh/faster-whisper-large-v3-turbo", device="cpu", compute_type="int8")
segs, info = m.transcribe(src, language="pt", word_timestamps=True, beam_size=5, vad_filter=False,
    initial_prompt="Três sinais de que você já pode cobrar mais caro. MEI, app, Legalizaí.")
words = []
for s in segs:
    for w in s.words:
        words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 3)})
json.dump(words, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(" ".join(f"{x['w']}[{x['s']:.2f}-{x['e']:.2f}|{x['p']:.2f}]" for x in words))
