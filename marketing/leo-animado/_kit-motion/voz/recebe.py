"""Recebe o vídeo devolvido pelo voice_change e extrai a voz Dylan. Pacote K03, DESENHO.md seções 2 e 8.

Uso (no PY, sempre com -B):
    python -B recebe.py <pasta da peça> <arquivo devolvido> [--ref voz/narr-pedro-raw.wav] [--forca]

Extrai <pasta>/voz/narr-dylan.wav (48 kHz, mono, 16 bits; mesma extração do narr-dylan.wav do guia:
ffmpeg -ac 1 -ar 48000 em s16) e mede o atraso contra a voz que foi pro voice_change (--ref, padrão
voz/narr-pedro-raw.wav) pela correlação dos envelopes RMS de 10 ms (passo de 1 ms, em dB com piso de -80 dB,
pico interpolado), buscando em ±300 ms.
Se o atraso passar de 5 ms, desloca a voz extraída (corta o começo ou põe zeros, mantendo o comprimento) e
mede de novo. Grava pelo KIT/lib/escrita.py; não sobrescreve sem --forca e nunca grava em hardlink.
"""
import argparse
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np  # noqa: E402

import comum  # noqa: E402
from comum import ErroVoz, escrita, fmt, relativo  # noqa: E402

BUSCA_S = 0.300
LIMITE_MS = 5.0


def desloca(x, atraso_ms, sr=comum.SR):
    """Tira o atraso: positivo corta o começo e completa o fim com zeros; negativo faz o contrário."""
    n = int(round(atraso_ms * sr / 1000.0))
    if n == 0:
        return x.copy()
    if n > 0:
        return np.concatenate([x[n:], np.zeros(n, x.dtype)])
    return np.concatenate([np.zeros(-n, x.dtype), x[:len(x) + n]])


def recebe(pasta, devolvido, ref_rel, forca):
    pasta = os.path.abspath(pasta)
    if not os.path.isdir(pasta):
        raise ErroVoz("a pasta da peça %s não existe" % pasta)
    devolvido = os.path.abspath(devolvido)
    if not os.path.isfile(devolvido):
        raise ErroVoz("o arquivo devolvido %s não existe" % devolvido)
    ref = comum.na_pasta(pasta, ref_rel)
    if not os.path.isfile(ref):
        raise ErroVoz("a voz de referência %s não existe (passe --ref com a voz que foi pro voice_change)" % ref)
    destino = comum.confere_destino(os.path.join(pasta, "voz", "narr-dylan.wav"), forca)

    voz = comum.carrega_s16(devolvido)
    if len(voz) == 0:
        raise ErroVoz("o arquivo devolvido %s não tem áudio" % devolvido)
    x_ref = comum.carrega(ref)
    atraso, corr = comum.mede_atraso(voz.astype(np.float32) / 32768.0, x_ref, busca=BUSCA_S)
    if abs(atraso) > BUSCA_S * 1000 - 1:
        raise ErroVoz("o atraso bateu no limite da busca (%s ms): confira se o arquivo devolvido é desta voz"
                      % fmt(atraso, 1))
    deslocado = abs(atraso) > LIMITE_MS
    atraso_depois, corr_depois = atraso, corr
    if deslocado:
        voz = desloca(voz, atraso)
        atraso_depois, corr_depois = comum.mede_atraso(voz.astype(np.float32) / 32768.0, x_ref, busca=BUSCA_S)
    if not os.path.isdir(os.path.dirname(destino)):
        os.makedirs(os.path.dirname(destino))
    escrita.grava_bytes(destino, comum.wav_bytes(voz))
    return {"destino": destino, "devolvido": devolvido, "ref": ref, "dur": len(voz) / comum.SR,
            "dur_ref": len(x_ref) / comum.SR, "atraso": atraso, "corr": corr, "deslocado": deslocado,
            "atraso_depois": atraso_depois, "corr_depois": corr_depois, "md5": escrita.md5(destino)}


def _main(argv):
    comum.utf8()
    ap = argparse.ArgumentParser(description="Extrai voz/narr-dylan.wav do vídeo devolvido e confere o atraso.")
    ap.add_argument("pasta", help="pasta da peça (KIT/pecas/<peca>)")
    ap.add_argument("devolvido", help="vídeo (ou áudio) devolvido pelo voice_change")
    ap.add_argument("--ref", default="voz/narr-pedro-raw.wav",
                    help="voz que foi pro voice_change (padrão voz/narr-pedro-raw.wav)")
    ap.add_argument("--forca", action="store_true", help="regrava um voz/narr-dylan.wav que já existe")
    a = ap.parse_args(argv)
    try:
        r = recebe(a.pasta, a.devolvido, a.ref, a.forca)
    except (ErroVoz, escrita.EscritaRecusada, escrita.DiscoInsuficiente) as e:
        print("erro: %s" % e, file=sys.stderr)
        return 1
    pasta = os.path.abspath(a.pasta)
    print("ok: %s (48 kHz, mono, 16 bits; md5 %s)" % (relativo(pasta, r["destino"]), r["md5"]))
    print("  duração: %s s (a voz de referência tem %s s)" % (fmt(r["dur"], 3), fmt(r["dur_ref"], 3)))
    print("  atraso medido contra %s: %s ms (correlação dos envelopes %s)"
          % (relativo(pasta, r["ref"]), fmt(r["atraso"], 1), fmt(r["corr"], 4)))
    if r["deslocado"]:
        print("  passou de %s ms: a voz foi deslocada; atraso depois: %s ms (correlação %s)"
              % (fmt(LIMITE_MS, 0), fmt(r["atraso_depois"], 1), fmt(r["corr_depois"], 4)))
    else:
        print("  dentro de %s ms: nada deslocado" % fmt(LIMITE_MS, 0))
    print('Passo seguinte: "%s" -B "%s" "%s"' % (comum.PYW, comum.barra(os.path.join(comum.VOZ, "alinha.py")),
                                                comum.barra(pasta)))
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
