"""Compara narrações alinhadas contra uma narração de referência. Pacote K03, DESENHO.md seções 4.7 e 11.

Uso (no PY, sempre com -B):
    python -B compara.py --pasta <pasta da peça> --ref voz/narracao.json
        --rodada "Dylan (kit)=voz/narracao-kit.json" [--rodada "Pedro=<arquivo>" ...]
        [--entregue "Dylan (kit)"] [--limite-mediana 0.04] [--limite-maximo 0.15]
        [--tfecho 15.0] [--tolerancia-tfecho 0.05] [--notas <arquivo.md>] --saida voz/comparacao.md [--forca]

Grava (pelo KIT/lib/escrita.py) um relatório com: o resumo de cada rodada (estrutura igual à referência, mediana
e máximo do desvio de início e de fim, tFecho), a verificação da rodada entregue pelos limites, as palavras
acima do limite com o início acústico medido no áudio da rodada (primeira subida acima de -50 dB depois do
ponto mais baixo do trecho, envelope de 10 ms a cada 1 ms), as notas (arquivo opcional), a tabela palavra por
palavra e a das frases. O áudio de cada rodada é o campo "audio" da narração (relativo à pasta da peça).
"""
import argparse
import datetime
import os
import statistics
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np  # noqa: E402

import comum  # noqa: E402
from comum import ErroVoz, escrita, fmt, relativo  # noqa: E402

SUBIDA_DB = -50.0


def estrutura(n, ref):
    return (len(n["words"]) == len(ref["words"]) and len(n["phrases"]) == len(ref["phrases"])
            and [w["t"] for w in n["words"]] == [w["t"] for w in ref["words"]]
            and [p["w"] for p in n["phrases"]] == [p["w"] for p in ref["phrases"]]
            and [p["key"] for p in n["phrases"]] == [p["key"] for p in ref["phrases"]])


def subida(db, t_a, t_b):
    """Primeira subida acima de -50 dB depois do quadro mais baixo de [t_a - 0,05, t_b]; procura até t_b + 0,15."""
    a = max(0, int((t_a - 0.05) * 1000))
    b = min(len(db), int((t_b + 0.15) * 1000))
    fim_baixo = min(len(db), int(t_b * 1000) + 1)
    if fim_baixo <= a:
        return None
    k0 = a + int(np.argmin(db[a:fim_baixo]))
    for k in range(k0, b):
        if db[k] > SUBIDA_DB:
            return (k + 5) / 1000.0
    return None


def compara(pasta, ref_rel, rodadas, entregue, lim_med, lim_max, t_fecho, tol, notas, saida, forca):
    pasta = os.path.abspath(pasta)
    destino = comum.confere_destino(comum.na_pasta(pasta, saida), forca)
    ref_caminho = comum.na_pasta(pasta, ref_rel)
    ref = comum.le_json(ref_caminho)
    nomes = [n for n, _ in rodadas]
    if entregue and entregue not in nomes:
        raise ErroVoz("a rodada entregue %r não está entre as rodadas" % entregue)
    dados, audios = {}, {}
    for nome, rel in rodadas:
        c = comum.na_pasta(pasta, rel)
        n = comum.le_json(c)
        dados[nome] = {"caminho": c, "narr": n}
        audios[nome] = comum.na_pasta(pasta, n.get("audio")) if n.get("audio") else None

    res = {}
    for nome in nomes:
        n = dados[nome]["narr"]
        ok_estr = estrutura(n, ref)
        ds = [abs(a["s"] - b["s"]) for a, b in zip(n["words"], ref["words"])]
        de = [abs(a["e"] - b["e"]) for a, b in zip(n["words"], ref["words"])]
        res[nome] = {"estrutura": ok_estr, "ds": ds, "de": de, "medS": statistics.median(ds), "maxS": max(ds),
                     "medE": statistics.median(de), "maxE": max(de), "tFecho": n.get("tFecho"),
                     "acima04": sum(d > lim_med for d in ds), "acimaMax": [i for i, d in enumerate(ds) if d > lim_max]}

    L = ["# Comparação do alinhamento contra a referência: %s" % os.path.basename(pasta), ""]
    L.append("Gerado pelo `KIT/voz/compara.py` em %s. Referência: `%s` (md5 %s, %d palavras, %d frases)."
             % (datetime.datetime.now().strftime("%d/%m/%Y %H:%M"), relativo(pasta, ref_caminho),
                escrita.md5(ref_caminho), len(ref["words"]), len(ref["phrases"])))
    L.append("")
    L.append("## Rodadas")
    L.append("")
    L.append("| rodada | narração | áudio transcrito |")
    L.append("|---|---|---|")
    for nome in nomes:
        L.append("| %s | `%s` | `%s` |" % (nome, relativo(pasta, dados[nome]["caminho"]),
                                         relativo(pasta, audios[nome]) if audios[nome] else "?"))
    L.append("")
    L.append("## Resumo contra a referência (desvios em segundos)")
    L.append("")
    L.append("| rodada | mesmas palavras, frases, índices e chaves | início: mediana | início: máximo | "
             "acima de %s | acima de %s | fim: mediana | fim: máximo | tFecho |" % (fmt(lim_med), fmt(lim_max)))
    L.append("|---|---|---|---|---|---|---|---|---|")
    for nome in nomes:
        r = res[nome]
        L.append("| %s | %s | %s | %s | %d | %d | %s | %s | %s |" % (
            nome, "sim" if r["estrutura"] else "NÃO", fmt(r["medS"], 3), fmt(r["maxS"], 3), r["acima04"],
            len(r["acimaMax"]), fmt(r["medE"], 3), fmt(r["maxE"], 3), fmt(r["tFecho"])))
    if entregue:
        r = res[entregue]
        criterios = [
            ("50 palavras e 7 frases, com os mesmos índices e palavras-chave da referência", r["estrutura"],
             "%d palavras, %d frases" % (len(dados[entregue]["narr"]["words"]), len(dados[entregue]["narr"]["phrases"]))),
            ("mediana do desvio de início até %s s" % fmt(lim_med), r["medS"] <= lim_med + 1e-9, fmt(r["medS"], 3) + " s"),
            ("máximo do desvio de início até %s s" % fmt(lim_max), r["maxS"] <= lim_max + 1e-9,
             fmt(r["maxS"], 3) + " s" + (" (palavras %s)" % ", ".join("%d '%s'" % (i, ref["words"][i]["t"])
                                                                      for i in r["acimaMax"]) if r["acimaMax"] else "")),
        ]
        if t_fecho is not None:
            tf = r["tFecho"]
            criterios.append(("tFecho = %s ± %s s" % (fmt(t_fecho), fmt(tol)),
                              isinstance(tf, (int, float)) and abs(tf - t_fecho) <= tol + 1e-9, fmt(tf) + " s"))
        L.append("")
        L.append("## Verificação da rodada entregue: %s" % entregue)
        L.append("")
        L.append("| critério | medido | passou |")
        L.append("|---|---|---|")
        for c, ok, med in criterios:
            L.append("| %s | %s | %s |" % (c, med, "sim" if ok else "NÃO"))
    acima = sorted({i for nome in nomes for i in res[nome]["acimaMax"]})
    if acima:
        envs = {}  # um envelope por áudio (rodadas com o mesmo áudio dividem a coluna)
        for nome in nomes:
            au = audios[nome]
            if au and os.path.isfile(au) and au not in envs:
                envs[au] = comum.envelope_db(comum.carrega(au))
        L.append("")
        L.append("## Palavras acima de %s s em alguma rodada, com o início acústico" % fmt(lim_max))
        L.append("")
        L.append("Início acústico: primeira subida acima de %s dB depois do ponto mais baixo do trecho que vai do "
                 "menor ao maior início (referência e rodadas), no envelope RMS de 10 ms a cada 1 ms de cada áudio."
                 % fmt(SUBIDA_DB, 0))
        L.append("")
        L.append("| i | palavra | referência | " + " | ".join(nomes) + " | "
                 + " | ".join("acústico em `%s`" % relativo(pasta, au) for au in envs) + " |")
        L.append("|---|---|---|" + "---|" * (len(nomes) + len(envs)))
        for i in acima:
            inicios = [ref["words"][i]["s"]] + [dados[nome]["narr"]["words"][i]["s"] for nome in nomes]
            cel = [fmt(dados[nome]["narr"]["words"][i]["s"], 3) for nome in nomes]
            for au, db in envs.items():
                ac = subida(db, min(inicios), max(inicios))
                cel.append(fmt(ac, 3) if ac is not None else "?")
            L.append("| %d | %s | %s | %s |" % (i, ref["words"][i]["t"], fmt(ref["words"][i]["s"], 3), " | ".join(cel)))
    if notas:
        with open(notas, "r", encoding="utf-8") as f:
            L.append("")
            L.append(f.read().rstrip("\n"))
    L.append("")
    L.append("## Palavra por palavra (início, em segundos; Δ = rodada menos referência)")
    L.append("")
    L.append("| i | palavra | referência | " + " | ".join("%s | Δ" % n for n in nomes) + " |")
    L.append("|---|---|---|" + "---|---|" * len(nomes))
    for i, w in enumerate(ref["words"]):
        cel = []
        for nome in nomes:
            s = dados[nome]["narr"]["words"][i]["s"]
            d = s - w["s"]
            cel.append("%s | %s%s" % (fmt(s), "+" if d > 0.0005 else "", fmt(d) if abs(d) > 0.0005 else "0"))
        L.append("| %d | %s | %s | %s |" % (i, w["t"], fmt(w["s"]), " | ".join(cel)))
    L.append("")
    L.append("## Frases (início, fim e out)")
    L.append("")
    L.append("| frase | chave | referência | " + " | ".join(nomes) + " |")
    L.append("|---|---|---|" + "---|" * len(nomes))
    for k, p in enumerate(ref["phrases"]):
        cel = []
        for nome in nomes:
            q = dados[nome]["narr"]["phrases"][k]
            cel.append("%s a %s, out %s" % (fmt(q["s"]), fmt(q["e"]), fmt(q["out"])))
        L.append("| %d | %d (%s) | %s a %s, out %s | %s |" % (k, p["key"], ref["words"][p["key"]]["t"], fmt(p["s"]),
                                                             fmt(p["e"]), fmt(p["out"]), " | ".join(cel)))
    L.append("")
    escrita.grava_texto(destino, "\n".join(L))
    return destino, res


def _main(argv):
    comum.utf8()
    ap = argparse.ArgumentParser(description="Compara narrações alinhadas contra uma referência.")
    ap.add_argument("--pasta", required=True)
    ap.add_argument("--ref", required=True)
    ap.add_argument("--rodada", action="append", required=True, help='"nome=arquivo.json" (repita)')
    ap.add_argument("--entregue", default=None)
    ap.add_argument("--limite-mediana", type=float, default=0.04)
    ap.add_argument("--limite-maximo", type=float, default=0.15)
    ap.add_argument("--tfecho", type=float, default=None)
    ap.add_argument("--tolerancia-tfecho", type=float, default=0.05)
    ap.add_argument("--notas", default=None, help="arquivo .md com notas pra entrar no relatório")
    ap.add_argument("--saida", required=True)
    ap.add_argument("--forca", action="store_true")
    a = ap.parse_args(argv)
    rodadas = []
    for r in a.rodada:
        if "=" not in r:
            print("erro: --rodada precisa ser nome=arquivo", file=sys.stderr)
            return 2
        nome, arq = r.split("=", 1)
        rodadas.append((nome.strip(), arq.strip()))
    try:
        destino, res = compara(a.pasta, a.ref, rodadas, a.entregue, a.limite_mediana, a.limite_maximo, a.tfecho,
                               a.tolerancia_tfecho, a.notas, a.saida, a.forca)
    except (ErroVoz, escrita.EscritaRecusada, escrita.DiscoInsuficiente, OSError, ValueError) as e:
        print("erro: %s" % e, file=sys.stderr)
        return 1
    print("ok: %s" % relativo(os.path.abspath(a.pasta), destino))
    for nome, r in res.items():
        print("  %-18s estrutura %s, início mediana %s máx %s, fim máx %s, tFecho %s" % (
            nome, "igual" if r["estrutura"] else "DIFERENTE", fmt(r["medS"], 3), fmt(r["maxS"], 3), fmt(r["maxE"], 3),
            fmt(r["tFecho"])))
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
