"""Funções comuns dos scripts de voz do kit de motion do Legalizaí (pacote K03).

Contrato: KIT/DESENHO.md, seções 4.7, 4.12 e 8. Roda nos dois ambientes Python do kit: no PY (corte-viral,
numpy) e no PYW (faster-whisper, numpy). Sempre com python -B: este módulo também desliga o bytecode.

Nada aqui grava arquivo direto: toda gravação passa pelo KIT/lib/escrita.py (troca atômica com os.replace,
recusa de hardlink e de caminho protegido).
"""
import io
import json
import os
import re
import subprocess
import sys
import wave

sys.dont_write_bytecode = True

import numpy as np  # noqa: E402

VOZ = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(VOZ)
LIB = os.path.join(KIT, "lib")
if LIB not in sys.path:
    sys.path.insert(0, LIB)
import escrita  # noqa: E402

SR = 48000
PY = escrita.PY
PYW = "C:/Projects/Legalizei_Videos/marketing/filme/escalada/tools/.venv/Scripts/python.exe"
GP = escrita.GP
RM = escrita.RM
FECHO_DIR = os.path.join(VOZ, "fecho")
FECHO_PADRAO = "vai-legalizai-dylan"
PRESET_DYLAN = "b847bc29-f184-583a-8ad9-d1f1e16d1a60"
MD5_NARRACAO_REF = "de548fb7302f40fe57156dae9581d467"  # RM/src/guia/narracao.json no REF (seção 4.13)
MD5_NARR_DYLAN_REF = "c8cf873c8d264d0178e3411315c299ae"  # GP/vo/narr-dylan.wav no REF

# Padrões da voz quando a cena não diz (os mesmos do montaProps, seção 4.4)
VOZ_PADRAO = {"arquivo": "voz/narr-dylan.wav", "fecho": "asset", "final": "voz/voz-final.wav"}

# Silêncio do refino (PR/src/timeline.py): abaixo de -40 dB por 80 ms ou mais, em quadros de 10 ms
SIL_LIMIAR_DB = -40.0
SIL_MINIMO_S = 0.08


class ErroVoz(RuntimeError):
    """Erro de uso ou de dado dos scripts de voz (a mensagem já está em português)."""


def utf8():
    for f in (sys.stdout, sys.stderr):
        try:
            f.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass


def fmt(x, casas=2):
    """Número no formato do texto em português (vírgula decimal)."""
    if x is None:
        return ""
    return ("%.*f" % (casas, x)).replace(".", ",")


def barra(p):
    return os.path.normpath(p).replace("\\", "/")


def na_pasta(pasta, p):
    """Caminho da cena ou da linha de comando: absoluto fica como está; relativo é relativo à pasta da peça."""
    if p is None:
        return None
    return os.path.normpath(p if os.path.isabs(p) else os.path.join(pasta, p))


def relativo(pasta, p):
    """Caminho pra mostrar e gravar: relativo à pasta da peça quando está dentro dela, senão absoluto."""
    pa, pp = os.path.abspath(pasta), os.path.abspath(p)
    try:
        r = os.path.relpath(pp, pa)
    except ValueError:
        return barra(pp)
    if r.startswith(".."):
        return barra(pp)
    return barra(r)


def le_json(caminho):
    with open(caminho, "r", encoding="utf-8") as f:
        return json.load(f)


def le_cena(pasta, nome=None):
    """Lê a cena da peça. Sem --cena, usa cenas.json se existir (sem ela, os padrões). Devolve (cena, caminho)."""
    explicita = nome is not None
    caminho = na_pasta(pasta, nome or "cenas.json")
    if not os.path.isfile(caminho):
        if explicita:
            raise ErroVoz("a cena %s não existe" % caminho)
        return None, None
    try:
        return le_json(caminho), caminho
    except ValueError as e:
        raise ErroVoz("a cena %s não é JSON válido: %s" % (caminho, e))


def voz_da_cena(cena):
    """Campo voz da cena mesclado com os padrões. Com fecho 'asset' e final vazio, o final padrão."""
    v = dict(VOZ_PADRAO)
    if cena and isinstance(cena.get("voz"), dict):
        for k in ("arquivo", "fecho", "final"):
            if k in cena["voz"]:
                v[k] = cena["voz"][k]
    if v.get("fecho") not in ("embutido", "asset"):
        raise ErroVoz("voz.fecho da cena tem de ser 'embutido' ou 'asset' (veio %r)" % v.get("fecho"))
    if v["fecho"] == "asset" and not v.get("final"):
        v["final"] = VOZ_PADRAO["final"]
    return v


def confere_destino(caminho, forca=False, dica="use --forca pra regravar"):
    """Confere o destino antes do trabalho pesado: protegido e hardlink sempre recusam; existente pede --forca."""
    alvo = os.path.abspath(caminho)
    motivo = escrita.protegido_motivo(alvo)
    if motivo:
        raise ErroVoz("recusado: %s é caminho protegido (%s; DESENHO.md seção 13)" % (barra(alvo), motivo))
    if os.path.lexists(alvo):
        if os.path.isdir(alvo):
            raise ErroVoz("recusado: %s é uma pasta" % barra(alvo))
        n = os.stat(alvo).st_nlink
        if n > 1:
            raise ErroVoz("recusado: %s é hardlink (st_nlink %d); grave num caminho novo" % (barra(alvo), n))
        if not forca:
            raise ErroVoz("%s já existe; %s" % (barra(alvo), dica))
    return alvo


# Áudio

def sonda(caminho):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "stream=index,codec_type,codec_name,sample_rate,channels,width,height,r_frame_rate,"
                        "pix_fmt,duration,bit_rate:format=duration", "-of", "json", caminho],
                       capture_output=True)
    if r.returncode != 0:
        raise ErroVoz("o ffprobe não leu %s: %s" % (caminho, r.stderr.decode("utf-8", "replace").strip()))
    return json.loads(r.stdout.decode("utf-8"))


def carrega(caminho, sr=SR):
    """Áudio em float32 mono no sr pedido, pelo ffmpeg (mesma decodificação do PR/src/timeline.py)."""
    if not os.path.isfile(caminho):
        raise ErroVoz("o áudio %s não existe" % caminho)
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", caminho, "-vn", "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
                       capture_output=True)
    if r.returncode != 0:
        raise ErroVoz("o ffmpeg não decodificou %s: %s" % (caminho, r.stderr.decode("utf-8", "replace").strip()))
    return np.frombuffer(r.stdout, np.float32).copy()


def carrega_s16(caminho, sr=SR):
    """Áudio em int16 mono no sr pedido, pelo ffmpeg (-ac 1 -ar sr, s16le): a extração do narr-dylan.wav do guia."""
    if not os.path.isfile(caminho):
        raise ErroVoz("o arquivo %s não existe" % caminho)
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", caminho, "-vn", "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"],
                       capture_output=True)
    if r.returncode != 0:
        raise ErroVoz("o ffmpeg não decodificou %s: %s" % (caminho, r.stderr.decode("utf-8", "replace").strip()))
    return np.frombuffer(r.stdout, np.int16).copy()


def le_wav16(caminho):
    """WAV PCM 16 bits lido sem conversão nenhuma: (sr, canais, amostras int16 com forma (n, canais))."""
    with wave.open(caminho, "rb") as w:
        if w.getsampwidth() != 2 or w.getcomptype() != "NONE":
            raise ErroVoz("%s não é WAV PCM de 16 bits" % caminho)
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        x = np.frombuffer(w.readframes(n), np.int16).copy()
    return sr, ch, x.reshape(-1, ch)


def para_int16(x):
    """float (escala 1,0) pra int16 como o ffmpeg faz (x vezes 32768, arredondado e limitado). Devolve (y, estouros)."""
    y = np.round(np.asarray(x, np.float64) * 32768.0)
    estouros = int(np.count_nonzero((y > 32767) | (y < -32768)))
    return np.clip(y, -32768, 32767).astype(np.int16), estouros


def wav_bytes(amostras, sr=SR):
    """WAV mono de 16 bits em memória (pra gravar pelo escrita.grava_bytes)."""
    a = np.asarray(amostras)
    if a.dtype != np.int16:
        raise ErroVoz("wav_bytes espera int16")
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(a.astype("<i2").tobytes())
    return buf.getvalue()


def silencios(x, sr=SR, limiar=SIL_LIMIAR_DB, minimo=SIL_MINIMO_S):
    """Trechos de silêncio, exatamente como o silences() do PR/src/timeline.py (quadros de 10 ms, dBFS do RMS)."""
    hop = int(round(0.010 * sr))
    n = len(x) // hop
    if n == 0:
        return []
    x = np.asarray(x, np.float32)  # float32, como o load_audio do timeline.py
    db = 20 * np.log10(np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, 1)) + 1e-9)
    s = db < limiar
    out = []
    i = 0
    while i < n:
        if s[i]:
            j = i
            while j < n and s[j]:
                j += 1
            if (j - i) * hop / sr >= minimo:
                out.append((round(i * hop / sr, 3), round(j * hop / sr, 3)))
            i = j
        else:
            i += 1
    return out


def envelope_rms(x, sr=SR, janela=0.010, passo=0.001):
    """RMS em janelas de `janela` s a cada `passo` s (a amostra k cobre [k*passo, k*passo + janela))."""
    jan = int(round(janela * sr))
    h = int(round(passo * sr))
    x = np.asarray(x, np.float64)
    if len(x) < jan:
        return np.zeros(0)
    c = np.concatenate([[0.0], np.cumsum(x * x)])
    n = (len(x) - jan) // h + 1
    i = np.arange(n) * h
    return np.sqrt(np.maximum((c[i + jan] - c[i]) / jan, 0.0))


def envelope_db(x, sr=SR, janela=0.010, passo=0.001):
    return 20 * np.log10(envelope_rms(x, sr, janela, passo) + 1e-9)


def pearson(a, b):
    a = np.asarray(a, np.float64)
    b = np.asarray(b, np.float64)
    n = min(len(a), len(b))
    if n < 2:
        return 0.0
    a = a[:n] - a[:n].mean()
    b = b[:n] - b[:n].mean()
    d = np.sqrt((a * a).sum() * (b * b).sum())
    return float((a * b).sum() / d) if d > 0 else 0.0


def lufs(x, sr=SR):
    """Loudness integrada (BS.1770, com as comportas) pelo loudnorm do ffmpeg, com 2 casas. None se não der."""
    x = np.asarray(x, np.float32)
    if len(x) < int(0.4 * sr):
        return None
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-",
                        "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                       input=x.tobytes(), capture_output=True)
    m = re.search(r'"input_i"\s*:\s*"([^"]+)"', r.stderr.decode("utf-8", "replace"))
    if not m:
        return None
    try:
        v = float(m.group(1))
    except ValueError:
        return None
    return v if np.isfinite(v) else None


PISO_ENVELOPE_DB = -80.0


def mede_atraso(conv, ref, sr=SR, busca=0.300):
    """Atraso de `conv` contra `ref` pela correlação dos envelopes RMS de 10 ms (passo de 1 ms), em ±busca.

    O envelope vai em dB com piso de -80 dB: pesa a fala e as pausas por igual. O envelope linear é puxado pelas
    vogais fortes, onde o timbre da voz convertida muda a forma do envelope (no guia: linear +1,7 ms, em dB
    +0,0 ms, contra o mesmo arquivo). O pico ganha interpolação parabólica (precisão abaixo de 1 ms).
    Positivo: conv está atrasado (a mesma fala sai depois). Devolve (atraso_ms, correlação no pico).
    """
    a = np.maximum(20 * np.log10(envelope_rms(ref, sr) + 1e-12), PISO_ENVELOPE_DB)
    b = np.maximum(20 * np.log10(envelope_rms(conv, sr) + 1e-12), PISO_ENVELOPE_DB)
    n = min(len(a), len(b))
    a, b = a[:n], b[:n]
    L = int(round(busca * 1000))
    cs = np.zeros(2 * L + 1)
    for k, lag in enumerate(range(-L, L + 1)):
        if lag >= 0:
            cs[k] = pearson(a[:n - lag], b[lag:n])
        else:
            cs[k] = pearson(a[-lag:n], b[:n + lag])
    k = int(np.argmax(cs))
    frac = 0.0
    if 0 < k < len(cs) - 1:
        den = cs[k - 1] - 2 * cs[k] + cs[k + 1]
        if den < 0:
            frac = 0.5 * (cs[k - 1] - cs[k + 1]) / den
    return (k - L) + frac, float(cs[k])
