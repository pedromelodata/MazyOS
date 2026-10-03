"""Monta a voz final com o fecho fixo "Vai, Legalizaí" em tFecho. Pacote K03, DESENHO.md seções 2 e 8.

Uso (no PY, sempre com -B):
    python -B monta.py <pasta da peça> [--cena cenas.json] [--forca]

Lê a cena (padrão cenas.json da pasta):
- voz.fecho "embutido": a gravação já tem o fecho (o guia); só relata, não grava nada;
- voz.fecho "asset": grava o voz.final da cena (padrão voz/voz-final.wav, relativo à pasta da peça; pode ser
  fora de voz/, como o audio/voz-final-kit.wav da regressão) = voz.arquivo + KIT/voz/fecho/<asset>.wav colado
  em tFecho. tFecho e duração vêm da cena quando são número, senão da narração da cena (voz/narracao.json).
  Ganho do fecho = LUFS da fala da narração nova menos o refNarracaoLufs do fecho.json (a fala é medida de 0
  até o fim da última palavra mais 0,04 s, a mesma janela do refNarracaoLufs do guia, que vai até 14,6 s).
  Comprimento = duração da cena; 48 kHz, mono, 16 bits.
Grava pelo KIT/lib/escrita.py; não sobrescreve sem --forca e nunca grava em hardlink.
"""
import argparse
import math
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np  # noqa: E402

import comum  # noqa: E402
from comum import ErroVoz, escrita, fmt, relativo  # noqa: E402

GANHO_AVISO_DB = 6.0
GANHO_MAX_DB = 12.0
JANELA_DEPOIS_ULTIMA = 0.04


def carrega_voz16(caminho):
    """Voz em int16 mono 48 kHz: WAV desse formato é lido sem conversão; o resto passa pelo ffmpeg."""
    try:
        sr, ch, x = comum.le_wav16(caminho)
        if sr == comum.SR and ch == 1:
            return x[:, 0].copy()
    except Exception:  # noqa: BLE001  (não é WAV PCM de 16 bits: o ffmpeg decodifica)
        pass
    return comum.carrega_s16(caminho)


def le_fecho(asset):
    caminho_json = os.path.join(comum.FECHO_DIR, "fecho.json")
    if not os.path.isfile(caminho_json):
        raise ErroVoz("falta o %s (rode voz/fecho/corta_fecho.py)" % comum.barra(caminho_json))
    fj = comum.le_json(caminho_json)
    if fj.get("id") != asset:
        raise ErroVoz("a cena pede o fecho %r e o fecho.json é do %r" % (asset, fj.get("id")))
    wav = os.path.join(comum.FECHO_DIR, fj.get("arquivo") or (asset + ".wav"))
    if not os.path.isfile(wav):
        raise ErroVoz("falta o áudio do fecho %s" % comum.barra(wav))
    return fj, wav


def monta(pasta, cena_nome=None, forca=False):
    pasta = os.path.abspath(pasta)
    if not os.path.isdir(pasta):
        raise ErroVoz("a pasta da peça %s não existe" % pasta)
    cena, cena_caminho = comum.le_cena(pasta, cena_nome)
    voz = comum.voz_da_cena(cena)
    arquivo = comum.na_pasta(pasta, voz["arquivo"])
    r = {"cena": cena_caminho, "voz": voz, "arquivo": arquivo, "avisos": []}
    if voz["fecho"] == "embutido":
        r["modo"] = "embutido"
        r["dur"] = len(carrega_voz16(arquivo)) / comum.SR if os.path.isfile(arquivo) else None
        return r

    cena = cena or {}
    narr_caminho = comum.na_pasta(pasta, cena.get("narracao") or "voz/narracao.json")
    if not os.path.isfile(narr_caminho):
        raise ErroVoz("falta a narração %s (rode o alinha.py)" % comum.barra(narr_caminho))
    narr = comum.le_json(narr_caminho)
    palavras = narr.get("words") or []
    if not palavras:
        raise ErroVoz("a narração %s não tem palavras" % comum.barra(narr_caminho))
    if isinstance(cena.get("tFecho"), (int, float)):
        t_fecho, origem_t = float(cena["tFecho"]), "cena"
    elif isinstance(narr.get("tFecho"), (int, float)):
        t_fecho, origem_t = float(narr["tFecho"]), "narração"
    else:
        t_fecho, origem_t = round(palavras[-1]["e"] + 0.44, 2), "fim da última palavra + 0,44"
    if isinstance(cena.get("duracao"), (int, float)):
        duracao, origem_d = float(cena["duracao"]), "cena"
    elif isinstance(narr.get("duracao"), (int, float)):
        duracao, origem_d = float(narr["duracao"]), "narração"
    else:
        duracao, origem_d = round(t_fecho + 3.0, 2), "tFecho + 3,0"

    destino = comum.confere_destino(comum.na_pasta(pasta, voz["final"]), forca)
    if not os.path.isfile(arquivo):
        raise ErroVoz("a voz %s não existe" % comum.barra(arquivo))
    v16 = carrega_voz16(arquivo)
    N = int(round(duracao * comum.SR))
    saida = np.zeros(N, np.float64)
    m = min(N, len(v16))
    saida[:m] = v16[:m] / 32768.0
    if len(v16) > N:
        r["avisos"].append("a voz tem %s s e passa da duração (%s s): o fim foi cortado"
                           % (fmt(len(v16) / comum.SR, 3), fmt(duracao)))

    fecho_cena = cena.get("fecho", {}) if "fecho" in cena else {}
    r.update({"modo": "asset", "narracao": narr_caminho, "tFecho": t_fecho, "origemT": origem_t,
              "duracao": duracao, "origemD": origem_d, "destino": destino})
    if fecho_cena is None:
        r["fecho"] = None
        r["avisos"].append("a cena desligou o fecho (fecho null): o voz-final é só a narração")
    else:
        asset = (fecho_cena or {}).get("asset") or comum.FECHO_PADRAO
        fj, fecho_wav = le_fecho(asset)
        f16 = carrega_voz16(fecho_wav)
        fim_fala = min(len(v16) / comum.SR, palavras[-1]["e"] + JANELA_DEPOIS_ULTIMA)
        lufs_nova = comum.lufs(v16[:int(round(fim_fala * comum.SR))].astype(np.float32) / 32768.0)
        ref = fj.get("refNarracaoLufs")
        if lufs_nova is None or not isinstance(ref, (int, float)):
            ganho_db = 0.0
            r["avisos"].append("não deu pra medir a loudness da fala; fecho com ganho 0 dB")
        else:
            ganho_db = lufs_nova - ref
        if abs(ganho_db) > GANHO_AVISO_DB:
            r["avisos"].append("ganho do fecho de %s dB: a narração nova está longe do nível do guia; confira de ouvido"
                               % fmt(ganho_db, 2))
        ganho_db = max(-GANHO_MAX_DB, min(GANHO_MAX_DB, ganho_db))
        i0 = int(round(t_fecho * comum.SR))
        if i0 >= N:
            raise ErroVoz("tFecho (%s s) cai depois do fim (%s s)" % (fmt(t_fecho), fmt(duracao)))
        # som da voz onde o fecho entra (fecho embutido com a cena dizendo asset?)
        trecho = v16[i0:i0 + len(f16)].astype(np.float64) / 32768.0
        if len(trecho):
            nivel = 20 * math.log10(np.sqrt(np.mean(trecho ** 2)) + 1e-9)
            if nivel > -45:
                r["avisos"].append("a voz tem som onde o fecho entra (%s dB de %s a %s s): fecho embutido com a "
                                   "cena dizendo asset?" % (fmt(nivel, 1), fmt(t_fecho), fmt(t_fecho + len(f16) / comum.SR)))
        k = min(len(f16), N - i0)
        if k < len(f16):
            r["avisos"].append("o fecho passa do fim do vídeo: %s s cortados" % fmt((len(f16) - k) / comum.SR, 3))
        g = 10 ** (ganho_db / 20.0)
        saida[i0:i0 + k] += g * f16[:k] / 32768.0
        r.update({"fecho": fj, "fechoWav": fecho_wav, "lufsNova": lufs_nova, "refLufs": ref, "ganhoDb": ganho_db,
                  "fimFala": fim_fala, "inicioFecho": i0 / comum.SR})
    y, estouros = comum.para_int16(saida)
    if estouros:
        r["avisos"].append("%d amostras estouraram e foram limitadas" % estouros)
    if not os.path.isdir(os.path.dirname(destino)):
        os.makedirs(os.path.dirname(destino))
    escrita.grava_bytes(destino, comum.wav_bytes(y))
    r["pico"] = float(np.abs(y).max()) / 32768.0
    r["md5"] = escrita.md5(destino)
    return r


def _main(argv):
    comum.utf8()
    ap = argparse.ArgumentParser(description="Grava o voz.final da cena: a voz mais o fecho fixo em tFecho.")
    ap.add_argument("pasta", help="pasta da peça (KIT/pecas/<peca>)")
    ap.add_argument("--cena", default=None, help="cena da peça (padrão cenas.json)")
    ap.add_argument("--forca", action="store_true", help="regrava um voz.final que já existe (nunca hardlink)")
    a = ap.parse_args(argv)
    try:
        r = monta(a.pasta, a.cena, a.forca)
    except (ErroVoz, escrita.EscritaRecusada, escrita.DiscoInsuficiente) as e:
        print("erro: %s" % e, file=sys.stderr)
        return 1
    pasta = os.path.abspath(a.pasta)
    if r["modo"] == "embutido":
        print("nada a montar: a cena diz voz.fecho 'embutido' (a gravação já tem o fecho)")
        print("  voz: %s%s; o mix usa ela direto" % (relativo(pasta, r["arquivo"]),
                                                    (", %s s" % fmt(r["dur"], 3)) if r["dur"] else " (não existe)"))
        return 0
    print("ok: %s (48 kHz, mono, 16 bits; %s s; md5 %s)" % (relativo(pasta, r["destino"]), fmt(r["duracao"], 3),
                                                            r["md5"]))
    print("  voz: %s; tFecho %s s (%s); duração %s s (%s)" % (relativo(pasta, r["arquivo"]), fmt(r["tFecho"]),
                                                              r["origemT"], fmt(r["duracao"]), r["origemD"]))
    if r.get("fecho"):
        print("  fecho: %s em %s s, ganho %s dB (fala da narração %s LUFS até %s s; referência do fecho %s LUFS)"
              % (relativo(pasta, r["fechoWav"]), fmt(r["inicioFecho"], 3), fmt(r["ganhoDb"], 2),
                 fmt(r["lufsNova"], 2), fmt(r["fimFala"]), fmt(r["refLufs"], 2)))
    print("  pico %s dBFS" % fmt(20 * math.log10(r["pico"] + 1e-12), 1))
    for av in r["avisos"]:
        print("  aviso: %s" % av)
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
