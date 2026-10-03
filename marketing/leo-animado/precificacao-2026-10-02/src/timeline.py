# Linha do tempo única da v2: palavras (whisper refinado pelas pausas), frases da legenda estilo Apple,
# layouts do Léo e eventos. Grava remotion/src/data/timeline.json e é importada pelo mix2.py.
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
FPS = 30
NARR = os.environ.get("LEO_NARR", P("vo", "narr-leo3.wav"))
WORDS_JSON = os.environ.get("LEO_WORDS", P("vo", "words-leo3.json"))

SCRIPT = ("Três sinais de que você já pode cobrar mais caro Um seus clientes nunca reclamam do preço "
          "Dois sua agenda vive cheia meses à frente Três você cobra o mesmo valor de dois anos atrás "
          "Bateu dois Tá na hora de reajustar Cobrar mais é o seu negócio dizendo que cresceu "
          "E no app que tá chegando eu fico de olho no teto do MEI de 81 mil por ano "
          "Comenta aqui quais desses sinais você tem").split()

def load_audio(path, sr=48000):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)

def silences(x, sr=48000, thr=-40, mind=0.08):
    hop = 480; n = len(x) // hop
    db = 20 * np.log10(np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, 1)) + 1e-9)
    s = db < thr; out = []; i = 0
    while i < n:
        if s[i]:
            j = i
            while j < n and s[j]: j += 1
            if (j - i) * hop / sr >= mind: out.append((i * hop / sr, j * hop / sr))
            i = j
        else: i += 1
    return out

def words():
    ws = json.load(open(WORDS_JSON, encoding="utf-8"))
    assert len(ws) == len(SCRIPT), f"whisper deu {len(ws)} palavras, roteiro tem {len(SCRIPT)}"
    x = load_audio(NARR)
    sil = silences(x)
    for w in ws:
        for a, b in sil:
            if a - 0.01 <= w["s"] < b - 0.02: w["s"] = b
    for i in range(len(ws) - 1):
        ws[i]["e"] = max(ws[i]["e"], ws[i]["s"] + 0.05)
    return ws, len(x) / 48000

WORDS, NARR_DUR = words()
T = lambda i: WORDS[i]["s"]
NARR_END = WORDS[-1]["e"]
END_T0 = NARR_END + 0.15
DUR = END_T0 + 0.35  # sem cartão final: o vídeo emenda no começo (loop)

# texto exibido por palavra (legenda): minúsculas naturais, sem ponto final
SHOW = {0: "3", 10: "Um:", 11: "seus", 23: "à", 17: "Dois:", 18: "sua", 25: "Três:", 26: "você", 36: "dois?", 66: "81", 76: "tem?", 71: "aqui:", 53: "app"}
def show(i):
    if i in SHOW: return SHOW[i]
    w = WORDS[i]["w"].strip().rstrip(".")
    return w

# frases da legenda (palavras, palavra-chave em coral)
PHRASES = [
    dict(w=list(range(2, 10)), key=9, title=True),         # (título "3 sinais" à parte)
    dict(w=list(range(10, 17)), key=13),
    dict(w=list(range(17, 25)), key=21),
    dict(w=list(range(25, 35)), key=29),
    dict(w=[35, 36], key=36),
    dict(w=list(range(37, 42)), key=41),
    dict(w=list(range(42, 51)), key=50),
    dict(w=list(range(51, 65)), key=60),
    dict(w=list(range(65, 70)), key=66),
    dict(w=list(range(70, 77)), key=76),
]

# layouts do Léo: (tempo em que está no lugar, nome)
LAYOUTS = [
    (0.0, "HOOK"), (T(10), "RIGHT"), (T(17), "LEFT"), (T(25), "RIGHT"), (T(35), "CENTER"),
    (T(42), "CLOSE"), (T(51), "RIGHT"), (T(70), "CENTER"),
]
PUNCH = [9, 13, 21, 29, 36, 41, 50, 60, 66, 76]

def export():
    out = {
        "fps": FPS, "dur": round(DUR, 3), "frames": int(round(DUR * FPS)), "endT0": round(END_T0, 3),
        "words": [{"i": i, "t": show(i), "s": round(w["s"], 3), "e": round(w["e"], 3)} for i, w in enumerate(WORDS)],
        "phrases": [{"w": p["w"], "key": p["key"], "title": p.get("title", False),
                     "s": round(T(p["w"][0]), 3), "e": round(WORDS[p["w"][-1]]["e"], 3)} for p in PHRASES],
        "layouts": [{"t": round(t, 3), "name": n} for t, n in LAYOUTS],
        "punch": [round(T(i), 3) for i in PUNCH],
    }
    # fim de cada frase = começo da próxima (a legenda fica até a próxima entrar)
    for k in range(len(out["phrases"]) - 1):
        out["phrases"][k]["out"] = out["phrases"][k + 1]["s"]
    out["phrases"][-1]["out"] = round(DUR + 1, 3)  # CTA fica até o último quadro (loop)
    dst = P("remotion", "src", "data", "timeline.json")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    json.dump(out, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return dst

if __name__ == "__main__":
    print(export(), f"DUR={DUR:.2f}s")
