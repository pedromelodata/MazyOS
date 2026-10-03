"""Whisper do kit de motion (pacote K03): faster-whisper, modelo small, sem initial_prompt.

Roda só no PYW (C:/Projects/Legalizei_Videos/marketing/filme/escalada/tools/.venv), sempre com python -B.
Opções fixas (DESENHO.md seção 8): modelo "small", device "cpu", compute_type "int8", language "pt",
word_timestamps True, beam_size 5 e nunca initial_prompt (o prompt força palavra que não foi dita).

O modelo small já está no cache (models--Systran--faster-whisper-small). Este módulo liga o modo offline do
Hugging Face e pede local_files_only: se o modelo não estiver no cache, ele para em vez de baixar (o medium
lotaria o disco).

Uso como módulo (alinha.py):  import transcreve; palavras = transcreve.transcreve(x16k)
Uso na linha de comando (corta_fecho.py chama assim):
    PYW -B transcreve.py <áudio> [--ate <s>]      imprime JSON {"duracao", "texto", "palavras": [{w, s, e, p}]}
"""
import argparse
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True
os.environ["HF_HUB_OFFLINE"] = "1"  # nunca baixar modelo
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

import numpy as np  # noqa: E402

MODELO = "small"
OPCOES_MODELO = {"device": "cpu", "compute_type": "int8"}
OPCOES = {"language": "pt", "word_timestamps": True, "beam_size": 5}  # sem initial_prompt, de propósito
SR_WHISPER = 16000
DESCRICAO = ("faster-whisper %s, modelo small, cpu, int8, language pt, word_timestamps, beam_size 5, "
             "sem initial_prompt")

_modelo = None


class ErroWhisper(RuntimeError):
    pass


def versao():
    try:
        import faster_whisper
        return faster_whisper.__version__
    except Exception:  # noqa: BLE001
        return "?"


def modelo():
    global _modelo
    if _modelo is None:
        try:
            from faster_whisper import WhisperModel
        except ImportError as e:
            raise ErroWhisper("faster-whisper não está neste Python; rode com o PYW: %s" % e)
        try:
            _modelo = WhisperModel(MODELO, local_files_only=True, **OPCOES_MODELO)
        except Exception as e:  # noqa: BLE001
            raise ErroWhisper("o modelo small não abriu do cache (o kit não baixa modelo nenhum): %s" % e)
    return _modelo


def carrega16(caminho, ate=None):
    """Áudio em float32 mono a 16 kHz pelo ffmpeg; com `ate`, só até esse segundo."""
    cmd = ["ffmpeg", "-v", "error", "-i", caminho, "-vn"]
    if ate is not None:
        cmd += ["-t", "%.3f" % ate]
    cmd += ["-f", "f32le", "-ac", "1", "-ar", str(SR_WHISPER), "-"]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise ErroWhisper("o ffmpeg não decodificou %s: %s" % (caminho, r.stderr.decode("utf-8", "replace").strip()))
    return np.frombuffer(r.stdout, np.float32).copy()


def transcreve(x16):
    """Palavras do whisper sobre um áudio float32 mono de 16 kHz: [{w, s, e, p}] (tempos em s, 3 casas)."""
    segs, _info = modelo().transcribe(np.asarray(x16, np.float32), **OPCOES)
    out = []
    for seg in segs:
        for w in seg.words or []:
            out.append({"w": w.word.strip(), "s": round(float(w.start), 3), "e": round(float(w.end), 3),
                        "p": round(float(w.probability), 3)})
    return out


def _main(argv):
    for f in (sys.stdout, sys.stderr):
        try:
            f.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    ap = argparse.ArgumentParser(description="Transcreve um áudio com o whisper small do kit (sem prompt).")
    ap.add_argument("audio")
    ap.add_argument("--ate", type=float, default=None, help="só até este segundo")
    a = ap.parse_args(argv)
    try:
        x = carrega16(a.audio, a.ate)
        palavras = transcreve(x)
    except ErroWhisper as e:
        print("erro: %s" % e, file=sys.stderr)
        return 1
    print(json.dumps({"duracao": round(len(x) / SR_WHISPER, 3), "whisper": DESCRICAO % versao(),
                      "texto": " ".join(p["w"] for p in palavras), "palavras": palavras}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
