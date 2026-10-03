"""Alinha a narração com o roteiro pelo whisper small, sem prompt. Pacote K03, DESENHO.md seções 4.7 e 8.

Uso (no PYW, o venv do faster-whisper, sempre com -B):
    python -B alinha.py <pasta> [--cena cenas.json] [--wav <arquivo>] [--gap 0.44]
                        [--saida voz/narracao.json] [--forca] [--sem-refino]

O que faz:
- transcreve o voz.arquivo da cena (padrão voz/narr-dylan.wav, o áudio que vai pro vídeo) ou o --wav, com o
  faster-whisper small (cpu, int8, language pt, word_timestamps, beam_size 5, sem initial_prompt);
- lê o roteiro (<pasta>/roteiro.md ou, se não existir, <pasta>/voz/roteiro.md), seção "## Narração": uma frase
  por linha, palavra-chave marcada com *asterisco* (sem marca, a chave é a última palavra da frase);
- alinha as palavras com o difflib, comparando sem caixa, sem acento e sem pontuação; palavra do roteiro sem par
  ganha tempo interpolado e uma marca; o texto exibido é a palavra do roteiro, com acento e pontuação;
- refina o início pelo silêncio como o PR/src/timeline.py (abaixo de -40 dB por 80 ms ou mais: começo que cai
  dentro de uma pausa vai pro fim dela), menos na primeira palavra e sem passar do começo (do whisper) da
  palavra seguinte; depois garante e >= s + 0,05;
- mede o fim da última palavra numa segunda passada do whisper quando há áudio demais depois dela (ver abaixo);
- tFecho = fim da última palavra + gap (0,44), arredondado a 0,01; duracao = tFecho + 3,0;
- frases = as linhas do roteiro; out = início da próxima frase menos 0,02 (a última: tFecho menos 0,02);
- grava a narração no formato da seção 4.7 ({tFecho, duracao, roteiro, audio, fps, words, phrases}) e o
  relatório alinhamento.md (alinhamento-<sufixo>.md quando a saída tem sufixo, na pasta da saída).

Regras de gravação: se a saída (ou o relatório) já existir, para antes do whisper e pede --saida ou --forca;
nunca grava em caminho com st_nlink > 1 nem em caminho protegido; nunca regrava um arquivo com o md5 da
narração de referência do guia (de548fb7...), nem com --forca. Tudo passa pelo KIT/lib/escrita.py.

Primeira palavra: o refino não mexe nela. A legenda da primeira frase entra no quadro 0 (gancho e emenda do
loop), como no guia aprovado, onde o "Veja" fica em 0,0 apesar dos 0,34 s de silêncio no começo do áudio.

Fim da última palavra (o tFecho depende dele): o whisper estica ou corta a última palavra conforme o que vem
depois. No guia, com o fecho embutido logo depois, ele corta o "breve" em 14,18 s; sem o fecho, dá 14,56 s; com
3 s de zeros, 14,64 s. Por isso, quando há fala depois do roteiro (como o fecho embutido) ou mais de 0,78 s de
áudio depois do fim acústico da última palavra, o alinha.py transcreve de novo só até o ponto padrão (o começo
dessa fala, ou o fim acústico mais 0,78 s, o que vier antes; sempre pelo menos 0,2 s depois do começo da última
palavra) e usa o fim que o whisper dá ali, se ele achar a mesma palavra no mesmo lugar (até 0,15 s). Os 0,78 s
são a pausa do guia aprovado entre o fim acústico do "breve" (14,23 s) e o fecho (15,01 s).
"""
import argparse
import datetime
import difflib
import os
import re
import sys
import unicodedata

sys.dont_write_bytecode = True
os.environ["HF_HUB_OFFLINE"] = "1"  # o whisper nunca baixa modelo
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import comum  # noqa: E402
import transcreve  # noqa: E402
from comum import ErroVoz, escrita, fmt, relativo  # noqa: E402

GAP_PADRAO = 0.44
PAUSA_PADRAO_S = 0.78   # pausa do guia aprovado entre o fim acústico do "breve" e o fecho
MARGEM_SEGUNDA_S = 0.05  # corte a menos disso do fim do áudio não precisa de segunda passada
DUR_DEPOIS_FECHO = 3.0


# Roteiro

def normaliza(t):
    """Sem caixa, sem acento e sem pontuação: só letras e números."""
    t = unicodedata.normalize("NFD", str(t).lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^0-9a-z]+", "", t)


def acha_roteiro(pasta):
    for rel in ("roteiro.md", os.path.join("voz", "roteiro.md")):
        p = os.path.join(pasta, rel)
        if os.path.isfile(p):
            return p
    raise ErroVoz("roteiro não encontrado: nem %s/roteiro.md nem %s/voz/roteiro.md"
                  % (comum.barra(pasta), comum.barra(pasta)))


def le_roteiro(caminho):
    """Frases da seção '## Narração': [{linha, tokens: [{texto, norm, chave}]}]."""
    with open(caminho, "r", encoding="utf-8") as f:
        linhas = f.read().splitlines()
    frases, dentro, achou, comentario, cerca = [], False, False, False, False
    for n, ln in enumerate(linhas, 1):
        s = ln.strip()
        if cerca:
            if s.startswith("```"):
                cerca = False
            continue
        if comentario:
            if "-->" in s:
                comentario = False
            continue
        if s.startswith("<!--"):
            if "-->" not in s:
                comentario = True
            continue
        if re.match(r"^#{1,2}\s", s):
            dentro = normaliza(s.lstrip("#")).startswith("narracao")
            achou = achou or dentro
            continue
        if not dentro:
            continue
        if s.startswith("```"):
            cerca = True
            continue
        if not s or s.startswith(("#", ">", "|")):
            continue
        if s.startswith("- "):
            s = s[2:].strip()
        tokens = []
        for tok in s.split():
            texto = tok.replace("*", "")
            norm = normaliza(texto)
            if not norm:
                if tokens:
                    tokens[-1]["texto"] += texto  # pontuação solta fica com a palavra anterior
                continue
            tokens.append({"texto": texto, "norm": norm, "chave": "*" in tok})
        if tokens:
            frases.append({"linha": n, "tokens": tokens})
    if not achou:
        raise ErroVoz("o roteiro %s não tem a seção '## Narração'" % caminho)
    if not frases:
        raise ErroVoz("a seção Narração do roteiro %s está vazia" % caminho)
    return frases


# Alinhamento

def reparte(normas, t0, t1):
    """Reparte [t0, t1] entre as palavras, proporcional ao número de letras."""
    tot = sum(max(1, len(r)) for r in normas)
    out, acc = [], 0
    for r in normas:
        a = t0 + (t1 - t0) * acc / tot
        acc += max(1, len(r))
        out.append((a, t0 + (t1 - t0) * acc / tot))
    return out


def por_letras(normas, ws, j0):
    """O whisper juntou ou separou palavras (mesmas letras): tempo de cada palavra pelas letras."""
    letras = []
    for j, w in enumerate(ws):
        L = max(1, len(w["norm"]))
        for k in range(len(w["norm"])):
            letras.append((w["s"] + (w["e"] - w["s"]) * k / L, w["s"] + (w["e"] - w["s"]) * (k + 1) / L, j0 + j))
    out, pos = [], 0
    for r in normas:
        a, b = letras[pos], letras[pos + len(r) - 1]
        out.append((a[0], b[1], sorted({letras[p][2] for p in range(pos, pos + len(r))})))
        pos += len(r)
    return out


def alinha_palavras(normas, wh):
    """Casa as palavras do roteiro (normalizadas) com as do whisper. Devolve uma entrada por palavra do roteiro."""
    sm = difflib.SequenceMatcher(None, normas, [w["norm"] for w in wh], autojunk=False)
    res = [None] * len(normas)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                w = wh[j1 + k]
                res[i1 + k] = {"js": [j1 + k], "s": w["s"], "e": w["e"], "como": "igual"}
        elif tag == "replace":
            rr, ww = normas[i1:i2], wh[j1:j2]
            if "".join(rr) == "".join(w["norm"] for w in ww):
                for k, (s, e, js) in enumerate(por_letras(rr, ww, j1)):
                    res[i1 + k] = {"js": js, "s": s, "e": e, "como": "letras"}
            elif i2 - i1 == j2 - j1:
                for k in range(i2 - i1):
                    w = wh[j1 + k]
                    res[i1 + k] = {"js": [j1 + k], "s": w["s"], "e": w["e"], "como": "outra"}
            else:
                for k, (s, e) in enumerate(reparte(rr, ww[0]["s"], ww[-1]["e"])):
                    res[i1 + k] = {"js": list(range(j1, j2)), "s": s, "e": e, "como": "repartida"}
    n, i = len(normas), 0
    while i < n:
        if res[i] is not None:
            i += 1
            continue
        j = i
        while j < n and res[j] is None:
            j += 1
        t0 = res[i - 1]["e"] if i > 0 else 0.0
        if j < n:
            t1 = res[j]["s"]
        else:
            t1 = max([w["e"] for w in wh] + [t0 + 0.3 * (j - i)])
        t1 = max(t1, t0)
        for k, (s, e) in enumerate(reparte(normas[i:j], t0, t1)):
            res[i + k] = {"js": [], "s": s, "e": e, "como": "interpolada"}
        i = j
    return res


def descreve_como(r, wh):
    txt = " ".join(wh[j]["w"] for j in r["js"])
    if r["como"] == "igual":
        return ""
    if r["como"] == "letras":
        return "o whisper juntou ou separou ('%s'): tempo pelas letras" % txt
    if r["como"] == "outra":
        return "o whisper ouviu '%s'" % txt
    if r["como"] == "repartida":
        return "trecho diferente no whisper ('%s'): tempo repartido" % txt
    return "sem par no whisper: tempo interpolado"


def com_norma(ws):
    for w in ws:
        w["norm"] = normaliza(w["w"])
    return [w for w in ws if w["norm"]]


# Principal

def alinha(pasta, cena_nome=None, wav_arg=None, gap=GAP_PADRAO, saida_arg="voz/narracao.json", forca=False,
           refino=True, log=print):
    t_ini = datetime.datetime.now()
    pasta = os.path.abspath(pasta)
    if not os.path.isdir(pasta):
        raise ErroVoz("a pasta da peça %s não existe" % pasta)
    cena, cena_caminho = comum.le_cena(pasta, cena_nome)
    voz = comum.voz_da_cena(cena)
    wav = comum.na_pasta(pasta, wav_arg or voz["arquivo"])
    if not os.path.isfile(wav):
        raise ErroVoz("o áudio %s não existe" % wav)
    fps = int((cena or {}).get("fps") or 30)

    saida = comum.na_pasta(pasta, saida_arg)
    base = os.path.splitext(os.path.basename(saida))[0]
    if base == "narracao":
        sufixo = ""
    elif base.startswith("narracao-"):
        sufixo = base[len("narracao"):]
    else:
        sufixo = "-" + base
    relatorio = os.path.join(os.path.dirname(saida), "alinhamento%s.md" % sufixo)
    dica = "escolha outra saída com --saida (por exemplo voz/narracao-nova.json) ou regrave com --forca"
    comum.confere_destino(saida, forca, dica)
    if os.path.isfile(saida) and escrita.md5(saida) == comum.MD5_NARRACAO_REF:
        raise ErroVoz("recusado: %s é a cópia da narração de referência do guia (md5 do REF); nem com --forca: "
                      "grave noutra --saida" % comum.barra(saida))
    comum.confere_destino(relatorio, forca, dica)
    if not os.path.isdir(os.path.dirname(saida)):
        raise ErroVoz("a pasta da saída %s não existe" % comum.barra(os.path.dirname(saida)))

    roteiro = acha_roteiro(pasta)
    frases = le_roteiro(roteiro)
    tokens = [t for f in frases for t in f["tokens"]]
    normas = [t["norm"] for t in tokens]
    n = len(tokens)

    x48 = comum.carrega(wav, comum.SR)
    x16 = comum.carrega(wav, transcreve.SR_WHISPER)
    dur = len(x48) / comum.SR
    log("whisper small (sem prompt) sobre %s (%s s)..." % (relativo(pasta, wav), fmt(dur, 3)))
    wh = com_norma(transcreve.transcreve(x16))
    if not wh:
        raise ErroVoz("o whisper não ouviu nenhuma palavra em %s" % wav)
    res = alinha_palavras(normas, wh)

    s = [r["s"] for r in res]
    e = [r["e"] for r in res]
    marcas = [[descreve_como(r, wh)] if r["como"] != "igual" else [] for r in res]
    sil = comum.silencios(x48)

    # refino do início pelo silêncio (regra do timeline.py), menos na primeira palavra; o início refinado não
    # passa do começo (do whisper) da palavra seguinte: quando duas palavras caem na mesma pausa, só a de depois
    # vai pro fim dela (no guia, o "que" e o "estamos" caem no fechamento do "k" e acenderiam juntos)
    if refino:
        s_whisper = list(s)
        for i in range(n):
            s0 = s_whisper[i]
            novo = s0
            usados = []
            for a, b in sil:
                if a - 0.01 <= novo < b - 0.02:
                    novo = b
                    usados.append((a, b))
            if novo == s0:
                continue
            pausas = ", ".join("%s a %s" % (fmt(a), fmt(b)) for a, b in usados)
            if i == 0:
                marcas[i].append("primeira palavra: começo do whisper mantido (o refino levaria a %s; pausa %s)"
                                 % (fmt(novo), pausas))
                continue
            if i + 1 < n and novo >= s_whisper[i + 1]:
                marcas[i].append("começo do whisper mantido: o refino levaria a %s, depois do começo da palavra "
                                 "seguinte (%s; pausa %s)" % (fmt(novo), fmt(s_whisper[i + 1]), pausas))
                continue
            s[i] = novo
            marcas[i].append("início refinado pelo silêncio (whisper %s; pausa %s)" % (fmt(s0), pausas))
    for i in range(1, n):
        if s[i] < s[i - 1]:
            marcas[i].append("início igualado ao da palavra anterior (%s)" % fmt(s[i - 1]))
            s[i] = s[i - 1]

    # fala do whisper depois da última palavra do roteiro (por exemplo o fecho embutido)
    usados_j = [j for r in res for j in r["js"]]
    ult_j = max(usados_j) if usados_j else -1
    depois = list(range(ult_j + 1, len(wh)))

    # fim da última palavra: segunda passada quando sobra áudio demais depois dela
    segunda = None
    fim_acustico = next((a for a, b in sil if a > s[-1]), None)
    opcoes = []
    inicio_seguinte = None
    if depois:
        w0 = wh[depois[0]]
        cands = [b for a, b in sil if a >= s[-1] and b <= w0["s"] + 0.02]
        inicio_seguinte = max(cands) if cands else w0["s"]
        opcoes.append((inicio_seguinte, "começo da fala depois do roteiro"))
    if fim_acustico is not None:
        opcoes.append((fim_acustico + PAUSA_PADRAO_S, "fim acústico da última palavra (%s) mais %s s"
                       % (fmt(fim_acustico), fmt(PAUSA_PADRAO_S))))
    if opcoes:
        corte, motivo = min(opcoes)
        if s[-1] + 0.2 < corte < dur - MARGEM_SEGUNDA_S:
            log("segunda passada até %s s (%s)..." % (fmt(corte), motivo))
            wh2 = com_norma(transcreve.transcreve(x16[:int(round(corte * transcreve.SR_WHISPER))]))
            res2 = alinha_palavras(normas, wh2) if wh2 else None
            r2 = res2[-1] if res2 else None
            valida = (r2 is not None and r2["como"] in ("igual", "letras", "outra")
                      and abs(r2["s"] - res[-1]["s"]) <= 0.15 and r2["e"] > s[-1])
            segunda = {"corte": corte, "motivo": motivo, "valida": valida,
                       "e1": e[-1], "e2": r2["e"] if r2 else None,
                       "palavras": " ".join(w["w"] for w in wh2[-4:]) if wh2 else ""}
            if valida:
                marcas[-1].append("fim da segunda passada (áudio até %s s, %s); a primeira passada dava %s"
                                  % (fmt(corte), motivo, fmt(e[-1])))
                e[-1] = r2["e"]
            else:
                marcas[-1].append("a segunda passada (até %s s) não confirmou a última palavra; ficou o fim da "
                                  "primeira" % fmt(corte))
    for i in range(n):
        if e[i] < s[i] + 0.05:
            marcas[i].append("fim esticado pra início + 0,05 (era %s)" % fmt(e[i]))
            e[i] = s[i] + 0.05

    t_fecho = round(e[-1] + gap, 2)
    duracao = round(t_fecho + DUR_DEPOIS_FECHO, 2)

    words = [{"i": i, "t": tokens[i]["texto"], "s": round(s[i], 3), "e": round(e[i], 3)} for i in range(n)]
    phrases, k0, avisos = [], 0, []
    for f in frases:
        idx = list(range(k0, k0 + len(f["tokens"])))
        k0 += len(f["tokens"])
        chaves = [idx[j] for j, t in enumerate(f["tokens"]) if t["chave"]]
        if len(chaves) > 1:
            avisos.append("linha %d do roteiro com %d palavras marcadas: vale a primeira" % (f["linha"], len(chaves)))
        key = chaves[0] if chaves else idx[-1]
        phrases.append({"w": idx, "key": key, "title": False, "s": words[idx[0]]["s"], "e": words[idx[-1]]["e"]})
    for k in range(len(phrases)):
        prox = phrases[k + 1]["s"] if k + 1 < len(phrases) else t_fecho
        phrases[k]["out"] = round(prox - 0.02, 3)

    narr = {"tFecho": t_fecho, "duracao": duracao, "roteiro": relativo(pasta, roteiro), "audio": relativo(pasta, wav),
            "fps": fps, "words": words, "phrases": phrases}

    # relatório
    agora = datetime.datetime.now()
    L = []
    L.append("# Alinhamento da narração: %s" % os.path.basename(pasta))
    L.append("")
    L.append("Gerado pelo `KIT/voz/alinha.py` em %s (%s s de relógio)." %
             (agora.strftime("%d/%m/%Y %H:%M"), fmt((agora - t_ini).total_seconds(), 0)))
    L.append("")
    L.append("- Áudio transcrito: `%s` (%s s)%s" % (relativo(pasta, wav), fmt(dur, 3),
                                                     "" if wav_arg else ", o voz.arquivo da cena"))
    L.append("- Cena: `%s`" % (relativo(pasta, cena_caminho) if cena_caminho else "nenhuma (padrões do kit)"))
    L.append("- Roteiro: `%s` (%d frases, %d palavras)" % (relativo(pasta, roteiro), len(frases), n))
    L.append("- Whisper: %s" % (transcreve.DESCRICAO % transcreve.versao()))
    if refino:
        L.append("- Refino do início: silêncio abaixo de %s dB por %s ms ou mais (%d pausas), como no "
                 "`PR/src/timeline.py`; a primeira palavra fica como o whisper deu"
                 % (fmt(comum.SIL_LIMIAR_DB, 0), fmt(comum.SIL_MINIMO_S * 1000, 0), len(sil)))
    else:
        L.append("- Refino do início: desligado (--sem-refino); só para comparação")
    if segunda:
        L.append("- Fim da última palavra: segunda passada do whisper até %s s (%s): %s"
                 % (fmt(segunda["corte"]), segunda["motivo"],
                    ("fim %s no lugar de %s" % (fmt(segunda["e2"]), fmt(segunda["e1"]))) if segunda["valida"]
                    else "não confirmou; ficou o fim da primeira passada"))
    else:
        L.append("- Fim da última palavra: da primeira passada (não sobra áudio demais depois dela)")
    L.append("- tFecho: %s + %s = %s s; duração %s s" % (fmt(e[-1], 3), fmt(gap), fmt(t_fecho), fmt(duracao)))
    if inicio_seguinte is not None:
        L.append("- Fala depois do roteiro começa em %s s (ela não entra na narração; com o fecho embutido, é ele)"
                 % fmt(inicio_seguinte))
    L.append("- Saída: `%s`" % relativo(pasta, saida))
    n_marcas = sum(1 for m in marcas if m)
    L.append("- Palavras com marca: %d de %d; sem par no whisper: %d"
             % (n_marcas, n, sum(1 for r in res if r["como"] == "interpolada")))
    for a in avisos:
        L.append("- Aviso: %s" % a)
    L.append("")
    L.append("## Palavras")
    L.append("")
    L.append("| i | palavra | whisper | prob. | início | fim | marca |")
    L.append("|---|---|---|---|---|---|---|")
    for i in range(n):
        r = res[i]
        txt = " ".join(wh[j]["w"] for j in r["js"]) if r["como"] != "interpolada" else ""
        ps = [wh[j]["p"] for j in r["js"]] if r["como"] != "interpolada" else []
        L.append("| %d | %s | %s | %s | %s | %s | %s |" % (
            i, tokens[i]["texto"] + (" (chave)" if any(p["key"] == i for p in phrases) else ""),
            txt, fmt(min(ps)) if ps else "", fmt(s[i]), fmt(e[i]), "; ".join(marcas[i])))
    L.append("")
    L.append("## Frases")
    L.append("")
    L.append("| frase | palavras | chave | início | fim | out |")
    L.append("|---|---|---|---|---|---|")
    for k, p in enumerate(phrases):
        L.append("| %d | %d a %d | %d (%s) | %s | %s | %s |" % (k, p["w"][0], p["w"][-1], p["key"],
                                                              words[p["key"]]["t"], fmt(p["s"]), fmt(p["e"]),
                                                              fmt(p["out"])))
    if depois:
        L.append("")
        L.append("## Fala do whisper depois do roteiro (fica fora da narração)")
        L.append("")
        L.append("| whisper | prob. | início | fim |")
        L.append("|---|---|---|---|")
        for j in depois:
            L.append("| %s | %s | %s | %s |" % (wh[j]["w"], fmt(wh[j]["p"]), fmt(wh[j]["s"]), fmt(wh[j]["e"])))
    L.append("")
    L.append("## Pausas do áudio (abaixo de %s dB por %s ms ou mais)" % (fmt(comum.SIL_LIMIAR_DB, 0),
                                                                       fmt(comum.SIL_MINIMO_S * 1000, 0)))
    L.append("")
    L.append(", ".join("%s a %s" % (fmt(a), fmt(b)) for a, b in sil) or "nenhuma")
    L.append("")

    escrita.grava_json(saida, narr)
    escrita.grava_texto(relatorio, "\n".join(L))
    return {"saida": saida, "relatorio": relatorio, "narr": narr, "marcas": n_marcas, "segunda": segunda,
            "avisos": avisos, "depois": [wh[j]["w"] for j in depois]}


def _main(argv):
    comum.utf8()
    ap = argparse.ArgumentParser(description="Alinha a narração com o roteiro (whisper small, sem prompt).")
    ap.add_argument("pasta", help="pasta da peça (KIT/pecas/<peca>)")
    ap.add_argument("--cena", default=None, help="cena da peça (padrão cenas.json, se existir)")
    ap.add_argument("--wav", default=None, help="áudio a transcrever no lugar do voz.arquivo da cena")
    ap.add_argument("--gap", type=float, default=GAP_PADRAO, help="tFecho = fim da última palavra + gap (0,44)")
    ap.add_argument("--saida", default="voz/narracao.json", help="narração gravada (padrão voz/narracao.json)")
    ap.add_argument("--forca", action="store_true", help="regrava uma saída que já existe (nunca hardlink)")
    ap.add_argument("--sem-refino", action="store_true", help="não refina o início pelo silêncio (só comparação)")
    a = ap.parse_args(argv)
    try:
        r = alinha(a.pasta, a.cena, a.wav, a.gap, a.saida, a.forca, not a.sem_refino)
    except (ErroVoz, transcreve.ErroWhisper, escrita.EscritaRecusada, escrita.DiscoInsuficiente) as e:
        print("erro: %s" % e, file=sys.stderr)
        return 1
    pasta = os.path.abspath(a.pasta)
    nr = r["narr"]
    print("ok: %s e %s" % (relativo(pasta, r["saida"]), relativo(pasta, r["relatorio"])))
    print("  %d palavras, %d frases, chaves %s" % (len(nr["words"]), len(nr["phrases"]),
                                                   ", ".join(str(p["key"]) for p in nr["phrases"])))
    print("  tFecho %s s, duração %s s, %d palavras com marca" % (fmt(nr["tFecho"]), fmt(nr["duracao"]),
                                                                 r["marcas"]))
    if r["depois"]:
        print("  fala depois do roteiro (fora da narração): %s" % " ".join(r["depois"]))
    for av in r["avisos"]:
        print("  aviso: %s" % av)
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
