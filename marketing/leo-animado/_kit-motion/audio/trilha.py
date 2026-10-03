"""Trilha da peça: janela, loudness da janela, ganho automático e transposição (pacote K05).

Contrato: KIT/DESENHO.md, seções 4.5 (campo trilha da cena), 4.9 (catálogo de trilhas) e 6.

Importável:
  janela(trilha, momento, ponto=None)   mStart = ponto.t - momento, em 6 casas (erro se negativo ou se passar do
                                        fim do arquivo); trilha é o id do catálogo ou o item; ponto é o id do ponto
                                        (sem ponto: o da primeira janela do catálogo, ou o único ponto da trilha)
  lufs_janela(arquivo, mStart, dur)     loudness integrada (LUFS) do trecho [mStart, mStart + dur] pelo ebur128 do
                                        ffmpeg, nos canais originais do arquivo (como as medidas do catálogo)
  ganho_auto(lufs)                      -22,1 menos o LUFS da janela, em 1 casa
  transposicao(trilha)                  semitons de trilha.tom.transporVerificado (0 quando não há)

Linha de comando (sempre com python -B):
  python -B trilha.py janela <id> <momento> [--ponto <id>] [--dur 18]
  python -B trilha.py lufs <id ou arquivo> <mStart> <dur>
  python -B trilha.py transposicao <id>

Calibração do ganho automático: o catálogo mediu as janelas em 17 s (o tamanho das prévias de audição). Com 17 s,
lufs_janela dá -13,1 na Talent in the Air (mStart 5,448) e -15,4 na House One (mStart 51,711), e o ganho_auto dá
-9,0 e -6,7, os ganhos usados na v2/v4 e na v3. Com a duração da peça (18 s no guia) a medida muda pouco (-13,0).
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
import re  # noqa: E402
import subprocess  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
KIT_PADRAO = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion"
KIT = os.path.dirname(AQUI) if os.path.isfile(os.path.join(os.path.dirname(AQUI), "catalogos", "catalogo.py")) \
    else KIT_PADRAO

ALVO_GANHO = -22.1        # ganho_auto = ALVO_GANHO - LUFS da janela
JANELA_CATALOGO = 17.0    # duração com que o catálogo mediu as janelas (as prévias têm 17 s)
SILENCIO_LUFS = -60.0     # abaixo disso a janela é silêncio e o ganho automático não vale


class ErroTrilha(Exception):
    """Trilha, ponto ou janela que não dá pra usar."""


def br(x, casas=2, sinal=False):
    """Número com vírgula decimal, pras mensagens em português."""
    return ((("%+." if sinal else "%.") + str(casas) + "f") % x).replace(".", ",")


def _catalogo():
    pasta = os.path.join(KIT, "catalogos")
    if pasta not in sys.path:
        sys.path.insert(0, pasta)
    import catalogo
    return catalogo


def item_trilha(trilha):
    """O item do catálogo de trilhas (aceita o id ou o próprio item)."""
    if isinstance(trilha, dict):
        return trilha
    idx = _catalogo().indice("trilhas")
    if trilha not in idx:
        raise ErroTrilha("trilha não está no catálogo: %s" % trilha)
    return idx[trilha]


def acha_ponto(item, ponto=None):
    """O ponto da trilha ({id, t, tipo, desc}). Sem ponto: o da primeira janela, ou o único ponto."""
    pontos = [p for p in (item.get("pontos") or []) if isinstance(p, dict)]
    if isinstance(ponto, dict):
        return ponto
    if ponto is None:
        janelas = [j for j in (item.get("janelas") or []) if isinstance(j, dict)]
        if janelas and janelas[0].get("ponto"):
            ponto = janelas[0]["ponto"]
        elif len(pontos) == 1:
            return pontos[0]
        else:
            raise ErroTrilha("a trilha %s tem %d pontos e nenhuma janela com ponto; diga qual ponto usar (%s)"
                             % (item.get("id"), len(pontos), ", ".join(str(p.get("id")) for p in pontos)))
    for p in pontos:
        if p.get("id") == ponto:
            return p
    raise ErroTrilha("o ponto %s não existe na trilha %s (pontos: %s)"
                     % (ponto, item.get("id"), ", ".join(str(p.get("id")) for p in pontos) or "nenhum"))


def duracao_arquivo(item):
    """Duração do arquivo da trilha, em segundos (do catálogo, ou pelo ffprobe)."""
    d = item.get("duracao")
    if isinstance(d, (int, float)) and d > 0:
        return float(d)
    return sonda_duracao(item.get("arquivo"))


def sonda_duracao(arquivo):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                        "default=noprint_wrappers=1:nokey=1", arquivo], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        raise ErroTrilha("não deu pra medir a duração de %s: %s" % (arquivo, r.stderr.strip()[-300:]))


def janela(trilha, momento, ponto=None):
    """mStart = ponto.t - momento (em 6 casas): o ponto da música cai no segundo `momento` do vídeo."""
    item = item_trilha(trilha)
    momento = float(momento)
    if momento < 0:
        raise ErroTrilha("momento negativo: %s s" % br(momento, 3))
    p = acha_ponto(item, ponto)
    if not isinstance(p.get("t"), (int, float)):
        raise ErroTrilha("o ponto %s da trilha %s não tem tempo" % (p.get("id"), item.get("id")))
    m = round(float(p["t"]) - momento, 6)
    if m < 0:
        raise ErroTrilha("mStart negativo (%s s): o ponto %s (%s s) cai antes do começo da música com o momento "
                         "%s s" % (br(m, 3), p.get("id"), br(p["t"], 3), br(momento, 3)))
    fim = duracao_arquivo(item)
    if m >= fim:
        raise ErroTrilha("mStart %s s passa do fim do arquivo da trilha %s (%s s)" % (br(m, 3), item.get("id"), br(fim, 3)))
    return m + 0.0


def mede_janela(arquivo, mStart, dur):
    """{I, LRA, picoDbtp} do trecho [mStart, mStart + dur] pelo ebur128 do ffmpeg (canais originais do arquivo)."""
    if not os.path.isfile(arquivo):
        raise ErroTrilha("arquivo da trilha não existe: %s" % arquivo)
    af = "atrim=start=%.6f:duration=%.6f,ebur128=peak=true" % (float(mStart), float(dur))
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", arquivo, "-af", af, "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise ErroTrilha("o ffmpeg não mediu %s: %s" % (arquivo, r.stderr.strip()[-400:]))
    resumo = r.stderr[r.stderr.rfind("Summary:"):] if "Summary:" in r.stderr else r.stderr
    num = r"(-?inf|-?\d+(?:\.\d+)?)"
    mi = re.findall(r"I:\s+" + num + r" LUFS", resumo)
    ml = re.findall(r"LRA:\s+" + num + r" LU", resumo)
    mp = re.findall(r"Peak:\s+" + num + r" dBFS", resumo)
    if not mi:
        raise ErroTrilha("o ebur128 não devolveu a loudness integrada de %s" % arquivo)
    conv = lambda s: float(s.replace("inf", "Infinity"))  # noqa: E731
    return {"I": conv(mi[-1]), "LRA": conv(ml[-1]) if ml else None, "picoDbtp": conv(mp[-1]) if mp else None,
            "mStart": float(mStart), "dur": float(dur)}


def lufs_janela(arquivo, mStart, dur):
    """Loudness integrada (LUFS) do trecho [mStart, mStart + dur]."""
    return mede_janela(arquivo, mStart, dur)["I"]


def ganho_auto(lufs):
    """Ganho da trilha pela loudness da janela: -22,1 menos o LUFS (Talent B: -13,1 dá -9,0)."""
    lufs = float(lufs)
    if lufs < SILENCIO_LUFS:
        raise ErroTrilha("janela em silêncio (%s LUFS): o ganho automático não vale" % br(lufs, 1))
    return round(ALVO_GANHO - lufs, 1)


def transposicao(trilha, estrito=False):
    """Semitons verificados pra efeito tonal com esta trilha (tom.transporVerificado); 0 quando não há."""
    item = item_trilha(trilha)
    tom = item.get("tom") if isinstance(item.get("tom"), dict) else {}
    n = tom.get("transporVerificado")
    if isinstance(n, bool) or not isinstance(n, (int, float)):
        if estrito:
            raise ErroTrilha("a transposição da trilha %s não foi verificada (tom: %s)"
                             % (item.get("id"), tom.get("texto")))
        return 0
    return int(n) if float(n).is_integer() else float(n)


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass
    ap = argparse.ArgumentParser(description="Janela, loudness e transposição da trilha (pacote K05).")
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("janela", help="mStart pelo ponto da trilha, loudness da janela e ganho automático")
    a.add_argument("id")
    a.add_argument("momento", type=float, help="segundo do vídeo em que o ponto da música deve cair")
    a.add_argument("--ponto", default=None)
    a.add_argument("--dur", type=float, default=JANELA_CATALOGO, help="duração da janela medida (padrão 17 s)")
    b = sub.add_parser("lufs", help="loudness de um trecho")
    b.add_argument("trilha", help="id do catálogo ou caminho do arquivo")
    b.add_argument("mStart", type=float)
    b.add_argument("dur", type=float)
    c = sub.add_parser("transposicao", help="semitons verificados da trilha")
    c.add_argument("id")
    args = ap.parse_args(argv)
    try:
        if args.cmd == "janela":
            item = item_trilha(args.id)
            p = acha_ponto(item, args.ponto)
            m = janela(item, args.momento, p)
            med = mede_janela(item["arquivo"], m, args.dur)
            fim = duracao_arquivo(item)
            out = {"trilha": item["id"], "ponto": p.get("id"), "pontoT": p.get("t"), "momento": args.momento,
                   "mStart": m, "janela": [m, round(m + args.dur, 6)], "lufs": med["I"], "lra": med["LRA"],
                   "picoDbtp": med["picoDbtp"], "ganhoAuto": ganho_auto(med["I"]),
                   "transporVerificado": transposicao(item), "status": item.get("status")}
            if m + args.dur > fim:
                out["aviso"] = "a música acaba antes do fim da janela (%s s)" % br(fim, 3)
        elif args.cmd == "lufs":
            arq = args.trilha if os.path.isfile(args.trilha) else item_trilha(args.trilha)["arquivo"]
            out = mede_janela(arq, args.mStart, args.dur)
            out["ganhoAuto"] = ganho_auto(out["I"])
        else:
            item = item_trilha(args.id)
            n = (item.get("tom") or {}).get("transporVerificado")
            out = {"trilha": item["id"], "transporVerificado": transposicao(item),
                   "verificado": isinstance(n, (int, float)) and not isinstance(n, bool),
                   "tom": (item.get("tom") or {}).get("texto")}
            if not out["verificado"]:
                out["aviso"] = "transposição não verificada: efeito tonal entra no tom original (0); confira de ouvido"
    except ErroTrilha as e:
        print("erro: %s" % e)
        return 2
    print(json.dumps(out, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
