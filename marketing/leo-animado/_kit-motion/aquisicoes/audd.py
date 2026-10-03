"""Checagem de relançamento das trilhas na AudD, com fila por dia (pacote K08).

Contrato: KIT/DESENHO.md, seção 12 e Anexo A.1b. Licença em dia não basta: toda trilha grátis passa pela impressão
digital da AudD pra achar relançamento por terceiro com ISRC próprio (golpe tipo Arulo).

Como funciona:
- A fila fica em fila-audd.json (nesta pasta), com a data prevista de cada consulta. A cota anônima é de 10
  consultas por dia; a primeira consulta de cada dia serve de teste de cota (erro 901 = a cota acabou, talvez
  porque a sessão principal já gastou hoje): o lote para ali e o erro fica registrado.
- Cada consulta manda um recorte de 20 s, mono, 22,05 kHz, MP3 de 96 kbps, gerado pelo ffmpeg no stdout e enviado
  pelo curl (multipart pra https://api.audd.io/, return=apple_music,spotify; token opcional na variável de ambiente
  AUDD_TOKEN, passado pelo próprio curl sem aparecer na linha de comando). O recorte nunca é gravado em disco.
- Quando a AudD acha correspondência, a prévia da loja (Apple Music ou Spotify) é decodificada pelo ffmpeg direto
  da URL, em memória, e correlacionada com a faixa inteira (pedaços de 5 s, correlação normalizada pela FFT).
  Mesma gravação (correlação de 0,6 ou mais, com deslocamento coerente) de outro artista = relançamento por
  terceiro: a trilha vira reprovado, com artista, data e ISRC. Mesma gravação do próprio autor = duvidoso
  (distribuição dele, risco de Content ID). Correlação abaixo de 0,25 = correspondência não confirmada (conta como
  recorte limpo, a não ser que a mesma faixa apareça em dois recortes). Entre uma coisa e outra, ou sem prévia:
  duvidoso, e entra na fila uma nova consulta pro dia seguinte de plano.
- Cada resultado é acrescentado na 'verificacao' do item em KIT/catalogos/trilhas/verificacoes.json (sobreposição
  do catálogo). Status liberado só com 2 recortes limpos (inícios diferentes) e nenhum duvidoso.

Uso (sempre com python -B):
    python -B audd.py --monta-fila              monta ou completa a fila (idempotente)
    python -B audd.py --proximo-lote [n]        consome as próximas n consultas previstas até hoje (padrão 10)
    python -B audd.py --status                  mostra a fila e o que já foi feito hoje
    python -B audd.py --testa-recorte <consulta>  gera o recorte em memória e mostra o tamanho (não envia nada)
    python -B audd.py --reavalia                recalcula status e notas pelas verificações registradas (sem consultar)
Opções: --cota N (padrão 10; com token da AudD dá pra subir), --ate AAAA-MM-DD (adianta as consultas previstas até
essa data; útil com token), --hoje AAAA-MM-DD (só pra teste).
"""
import argparse
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import time
import unicodedata

import numpy as np

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(AQUI)
sys.path.insert(0, os.path.join(KIT, "lib"))
sys.path.insert(0, os.path.join(KIT, "catalogos"))
import escrita  # noqa: E402
import catalogo  # noqa: E402

FILA = os.path.join(AQUI, "fila-audd.json")
VERIF = os.path.join(KIT, "catalogos", "trilhas", "verificacoes.json")
API = "https://api.audd.io/"
COTA = 10
JANELA = 20.0
NOTA_403 = "página não conferida: Pixabay bloqueia robô (403); conferir no navegador ou com o Pedro"
EXT = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos"

# plano da seção 12 (dia 1 e o começo do dia 2), na ordem
PLANO_PIXABAY = [
    (1, "pixabay-03-summer-fashion", 20), (1, "pixabay-03-summer-fashion", 60),
    (1, "pixabay-04-party-dance", 46), (1, "pixabay-04-party-dance", 76),
    (1, "pixabay-05-afterglow", 51), (1, "pixabay-05-afterglow", 101),
    (1, "pixabay-02-space-dance", 30), (1, "pixabay-02-space-dance", 90),
    (1, "pixabay-06-turbo-funk-machine", 54), (1, "pixabay-01-match-out", 40),
    (2, "pixabay-06-turbo-funk-machine", 20), (2, "pixabay-01-match-out", 122),
]
DATAS = {1: "2026-10-02", 2: "2026-10-03", 3: "2026-10-04"}
PRIORIDADE = ["piano-documental", "tensao", "lo-fi", "pop-acustico", "groove-brasileiro"]


# utilitários

def agora():
    return datetime.datetime.now().astimezone()


def le_json(caminho, padrao):
    if not os.path.isfile(caminho):
        return padrao
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def norm(t):
    t = unicodedata.normalize("NFKD", t or "").encode("ascii", "ignore").decode("ascii").casefold()
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def virgula(v, casas=2):
    return ("%.*f" % (casas, v)).replace(".", ",")


def le_fila():
    return le_json(FILA, {
        "versao": 1,
        "descricao": "Fila de consultas da AudD do kit (K08). Cota anônima de 10 por dia; a primeira consulta do dia "
                     "é o teste de cota. Recorte de 20 s, mono, 22,05 kHz, MP3 de 96 kbps, nunca gravado.",
        "cotaDiaria": COTA,
        "recorte": {"duracao": JANELA, "canais": 1, "sr": 22050, "kbps": 96},
        "consultas": [],
        "historico": [],
    })


def grava_fila(fila):
    fila["atualizadoEm"] = agora().strftime("%Y-%m-%dT%H:%M:%S%z")
    escrita.grava_json(FILA, fila)


def le_verif():
    return le_json(VERIF, {"versao": 1, "camada": "verificacoes", "tipo": "trilhas",
                           "descricao": "Sobreposição do K08: resultados da AudD e trocas de status das trilhas. "
                                        "As listas 'verificacao' são concatenadas às do base e das aquisições.",
                           "itens": {}})


def grava_verif(v):
    v["atualizadoEm"] = agora().strftime("%Y-%m-%dT%H:%M:%S%z")
    escrita.grava_json(VERIF, v)


def itens_trilhas():
    r = catalogo.carrega("trilhas", estrito=False)
    return {it["id"]: it for it in r["itens"]}


# fila

def monta_fila():
    fila = le_fila()
    idx = itens_trilhas()
    existentes = {(c["item"], c["inicio"]) for c in fila["consultas"]}
    novos = 0

    def acrescenta(dia, item_id, inicio, motivo):
        nonlocal novos
        if (item_id, inicio) in existentes:
            return
        it = idx.get(item_id)
        if it is None:
            raise SystemExit("item fora do catálogo de trilhas: %s" % item_id)
        n_dia = sum(1 for c in fila["consultas"] if c["dia"] == dia) + 1
        fila["consultas"].append({
            "id": "d%d-%02d" % (dia, n_dia), "dia": dia, "dataPrevista": DATAS[dia], "item": item_id,
            "arquivo": it["arquivo"], "inicio": inicio, "estado": "pendente", "motivo": motivo, "tentativas": []})
        existentes.add((item_id, inicio))
        novos += 1

    for dia, item_id, ini in PLANO_PIXABAY:
        acrescenta(dia, item_id, ini, "plano da seção 12 (trilhas do Pixabay já baixadas)")
    # trilhas novas do K08: 2 recortes cada; até 4 no dia 2 e o resto no dia 3
    aquis = le_json(os.path.join(KIT, "catalogos", "trilhas", "aquisicoes-2026-10.json"), {"itens": []})["itens"]
    aquis = sorted(aquis, key=lambda t: PRIORIDADE.index(t.get("categoriaKit")) if t.get("categoriaKit") in PRIORIDADE
                   else 99)
    for n, t in enumerate(aquis):
        dia = 2 if n < 4 else 3
        recs = (t.get("medidas") or {}).get("recortesAudd") or [30, 70]
        for ini in recs[:2]:
            acrescenta(dia, t["id"], int(ini), "trilha nova do K08 (%s): 2 recortes no trecho cheio" % (
                t.get("categoriaKit") or "sem categoria"))
    grava_fila(fila)
    print("fila: %d consultas (%d novas)" % (len(fila["consultas"]), novos))
    return 0


def feitas_hoje(fila, hoje):
    """Consultas de hoje que gastaram cota (o erro 901 e o erro de rede não gastam)."""
    return [h for h in fila["historico"] if h["data"] == hoje and h.get("enviada") and h.get("cotaGasta", True)]


def status(hoje):
    fila = le_fila()
    print("hoje: %s | enviadas hoje: %d de %d" % (hoje, len(feitas_hoje(fila, hoje)), fila.get("cotaDiaria", COTA)))
    for c in fila["consultas"]:
        ult = c["tentativas"][-1] if c["tentativas"] else None
        print("%-6s %s %-42s %5ss %-9s %s" % (c["id"], c["dataPrevista"], c["item"], c["inicio"], c["estado"],
                                             (ult or {}).get("classe", "")))
    return 0


# recorte e consulta

def recorte(arquivo, inicio):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(inicio), "-t", str(JANELA), "-i", arquivo, "-vn", "-ac", "1",
           "-ar", "22050", "-c:a", "libmp3lame", "-b:a", "96k", "-f", "mp3", "pipe:1"]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0 or len(r.stdout) < 10000:
        raise RuntimeError("recorte falhou: %s" % r.stderr.decode("utf-8", "replace")[-300:])
    return r.stdout


def consulta_audd(dados):
    c = shutil.which("curl")
    cmd = [c, "-sS", "--max-time", "120", "-F", "file=@-;filename=recorte.mp3;type=audio/mpeg",
           "-F", "return=apple_music,spotify"]
    if os.environ.get("AUDD_TOKEN"):
        cmd += ["--variable", "%AUDD_TOKEN", "--expand-form-string", "api_token={{AUDD_TOKEN}}"]
    cmd.append(API)
    r = subprocess.run(cmd, input=dados, capture_output=True)
    if r.returncode != 0:
        return None, "curl falhou (%d): %s" % (r.returncode, r.stderr.decode("utf-8", "replace")[-300:])
    try:
        return json.loads(r.stdout.decode("utf-8", "replace")), None
    except ValueError:
        return None, "resposta não é JSON: %s" % r.stdout[:300]


# correlação com a prévia da loja (em memória)

def decodifica(fonte, sr=11025):
    cmd = ["ffmpeg", "-v", "error", "-i", fonte, "-vn", "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"]
    r = subprocess.run(cmd, capture_output=True, timeout=180)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.decode("utf-8", "replace")[-300:])
    return np.frombuffer(r.stdout, np.float32).astype(np.float64)


def correlaciona(previa, faixa, sr=11025, pedaco=5.0):
    """Correlação normalizada de pedaços de 5 s da prévia contra a faixa inteira. Devolve um resumo."""
    n = int(pedaco * sr)
    N = 1 << int(np.ceil(np.log2(len(faixa) + n)))
    X = np.fft.rfft(faixa, N)
    cs = np.concatenate([[0.0], np.cumsum(faixa ** 2)])
    resultados = []
    for k in range(0, len(previa) - n + 1, n):
        y = previa[k:k + n]
        ey = float(np.sum(y ** 2))
        if ey < 1e-6:
            continue
        c = np.fft.irfft(X * np.fft.rfft(y[::-1], N), N)[n - 1:len(faixa)]
        ex = cs[n:] - cs[:-n]
        m = min(len(c), len(ex))
        ncc = c[:m] / (np.sqrt(ex[:m] * ey) + 1e-12)
        j = int(np.argmax(ncc))
        resultados.append({"pedaco": round(k / sr, 1), "corr": round(float(ncc[j]), 3),
                           "naFaixa": round(j / sr, 2), "desloc": round(j / sr - k / sr, 2)})
    if not resultados:
        return None
    melhores = sorted(resultados, key=lambda r: -r["corr"])
    fortes = [r for r in resultados if r["corr"] >= 0.6]
    coerente = False
    if len(fortes) >= 2:
        d = [r["desloc"] for r in fortes]
        coerente = (max(d) - min(d)) <= 0.1
    return {"max": melhores[0]["corr"], "mediana": round(float(np.median([r["corr"] for r in resultados])), 3),
            "fortes": len(fortes), "coerente": coerente, "pedacos": resultados[:8]}


def previas(res):
    urls = []
    am = res.get("apple_music") or {}
    for p in am.get("previews") or []:
        if p.get("url"):
            urls.append(("apple_music", p["url"]))
    sp = res.get("spotify") or {}
    if sp.get("preview_url"):
        urls.append(("spotify", sp["preview_url"]))
    return urls


def isrc(res):
    am = res.get("apple_music") or {}
    sp = res.get("spotify") or {}
    return am.get("isrc") or (sp.get("external_ids") or {}).get("isrc")


def classifica(resp, item):
    if resp.get("status") == "error":
        e = resp.get("error") or {}
        return {"classe": "erro", "codigo": e.get("error_code"), "mensagem": e.get("error_message")}
    r = resp.get("result")
    if not r:
        return {"classe": "limpo", "resumo": "sem correspondência"}
    info = {"artista": r.get("artist"), "titulo": r.get("title"), "album": r.get("album"),
            "lancamento": r.get("release_date"), "selo": r.get("label"), "timecode": r.get("timecode"),
            "link": r.get("song_link"), "isrc": isrc(r)}
    autor = norm(item.get("autor"))
    artista = norm(r.get("artist"))
    proprio = bool(autor) and (autor in artista or artista in autor)
    corr, fonte_prev, erro_prev = None, None, None
    for fonte_prev, url in previas(r):
        try:
            prev = decodifica(url)
            faixa = decodifica(item["arquivo"])
            corr = correlaciona(prev, faixa)
            if corr:
                break
        except Exception as ex:  # noqa: BLE001
            erro_prev = str(ex)[-200:]
    info["previa"] = {"fonte": fonte_prev, "correlacao": corr, "erro": erro_prev}
    if corr is None:
        classe = "duvidoso"
        motivo = "correspondência sem prévia de loja pra correlacionar"
    elif (corr["fortes"] >= 2 and corr["coerente"]) or corr["max"] >= 0.8:
        classe = "mesma-gravacao-autor" if proprio else "mesma-gravacao-terceiro"
        motivo = "a prévia da loja é a mesma gravação (correlação máxima %s)" % virgula(corr["max"])
    elif corr["max"] < 0.25:
        classe = "nao-confirmada"
        motivo = "a prévia da loja não é esta gravação (correlação máxima %s)" % virgula(corr["max"])
    else:
        classe = "duvidoso"
        motivo = "correlação intermediária com a prévia (máxima %s)" % virgula(corr["max"])
    info["classe"] = classe
    info["resumo"] = "%s: '%s' de '%s'%s%s; %s" % (
        "correspondência", r.get("title"), r.get("artist"),
        (", lançada em %s" % r.get("release_date")) if r.get("release_date") else "",
        (", ISRC %s" % info["isrc"]) if info.get("isrc") else "", motivo)
    return info


# status do item pelas verificações

def reavalia_item(item_id, entradas, eh_pixabay):
    audd = [e for e in entradas if e.get("metodo") == "audd" and e.get("classe") not in (None, "erro")]
    terceiro = [e for e in audd if e["classe"] == "mesma-gravacao-terceiro"]
    autor = [e for e in audd if e["classe"] == "mesma-gravacao-autor"]
    duvid = [e for e in audd if e["classe"] == "duvidoso"]
    grupos = {}
    for e in audd:
        if e["classe"] in ("nao-confirmada", "duvidoso"):
            m = e.get("audd") or {}
            chave = m.get("isrc") or (norm(m.get("artista")) + "|" + norm(m.get("titulo")))
            grupos.setdefault(chave, set()).add(e["recortes"][0])
    repetidas = {k for k, v in grupos.items() if len(v) >= 2}
    limpos = set()
    for e in audd:
        if e["classe"] == "limpo":
            limpos.add(e["recortes"][0])
        elif e["classe"] == "nao-confirmada":
            m = e.get("audd") or {}
            chave = m.get("isrc") or (norm(m.get("artista")) + "|" + norm(m.get("titulo")))
            if chave not in repetidas:
                limpos.add(e["recortes"][0])
    erros = [e for e in entradas if e.get("metodo") == "audd" and e.get("classe") == "erro"]
    partes = []
    if terceiro:
        m = terceiro[0]["audd"]
        st = "reprovado"
        partes.append("relançada por terceiro: '%s' de '%s'%s%s (prévia da loja é a mesma gravação)" % (
            m.get("titulo"), m.get("artista"), (", %s" % m["lancamento"]) if m.get("lancamento") else "",
            (", ISRC %s" % m["isrc"]) if m.get("isrc") else ""))
    elif autor or duvid or repetidas:
        st = "sem-verificacao"
        if autor:
            m = autor[0]["audd"]
            partes.append("distribuída pelo próprio autor ('%s' de '%s'%s): risco de Content ID, decisão do Pedro" % (
                m.get("titulo"), m.get("artista"), (", ISRC %s" % m["isrc"]) if m.get("isrc") else ""))
        if duvid:
            partes.append("%d recorte(s) com resultado duvidoso: nova consulta na fila" % len(duvid))
        if repetidas:
            partes.append("a mesma correspondência apareceu em dois recortes: conferir antes de liberar")
    elif len(limpos) >= 2:
        st = "liberado"
        partes.append("AudD sem relançamento em %d recortes (%s s)" % (len(limpos), ", ".join(
            str(int(s)) for s in sorted(limpos))))
    else:
        st = "sem-verificacao"
        partes.append("AudD: %d de 2 recortes limpos até agora" % len(limpos))
    if erros and st == "sem-verificacao":
        partes.append("%d tentativa(s) com erro da AudD registradas" % len(erros))
    if eh_pixabay:
        partes.append(NOTA_403)
        if st == "liberado":
            partes.append("no dia de usar, reconferir o selo de Content ID na página")
    return st, "; ".join(partes)


def aplica_reavaliacao(verif, item_id, eh_pixabay):
    reg = verif["itens"].setdefault(item_id, {"verificacao": []})
    st, nota = reavalia_item(item_id, reg["verificacao"], eh_pixabay)
    reg["status"] = st
    reg["notaVerificacao"] = nota
    return st


def garante_nota_pixabay(verif, idx, hoje):
    for i, it in idx.items():
        if it.get("fonte") == "Pixabay" and it.get("tipo") == "trilha":
            reg = verif["itens"].setdefault(i, {"verificacao": []})
            if not any(e.get("metodo") == "pagina-pixabay" for e in reg["verificacao"]):
                reg["verificacao"].append({"data": hoje, "metodo": "pagina-pixabay", "recortes": None,
                                           "resultado": NOTA_403})
            aplica_reavaliacao(verif, i, True)


def reavalia_tudo(hoje):
    verif = le_verif()
    idx = itens_trilhas()
    garante_nota_pixabay(verif, idx, hoje)
    for i in list(verif["itens"]):
        if i in idx:
            aplica_reavaliacao(verif, i, idx[i].get("fonte") == "Pixabay")
    grava_verif(verif)
    for i, r in verif["itens"].items():
        print("%-42s %-16s %s" % (i, r.get("status"), r.get("notaVerificacao", "")[:110]))
    return 0


def proximo_dia_plano(hoje):
    d = datetime.date.fromisoformat(hoje) + datetime.timedelta(days=1)
    return max(d.isoformat(), DATAS[3])


def proximo_lote(n, hoje, cota, ate=None):
    fila = le_fila()
    verif = le_verif()
    idx = itens_trilhas()
    garante_nota_pixabay(verif, idx, hoje)
    enviadas = len(feitas_hoje(fila, hoje))
    if enviadas >= cota:
        print("PARADO: já foram %d consultas hoje (%s), a cota é %d" % (enviadas, hoje, cota))
        return 0
    limite = max(hoje, ate or hoje)
    pend = [c for c in fila["consultas"] if c["estado"] == "pendente" and c["dataPrevista"] <= limite]
    pend.sort(key=lambda c: (c["dataPrevista"], c["dia"], c["id"]))
    lote = pend[:max(0, min(n, cota - enviadas))]
    if not lote:
        print("nada previsto até %s na fila" % limite)
        grava_verif(verif)
        return 0
    print("lote de %d consulta(s); enviadas hoje antes deste lote: %d" % (len(lote), enviadas))
    for k, c in enumerate(lote):
        teste = (enviadas == 0 and k == 0)
        item = idx.get(c["item"])
        if item is None:
            print("item fora do catálogo: %s; pulei" % c["item"])
            continue
        t0 = agora()
        try:
            dados = recorte(c["arquivo"], c["inicio"])
        except RuntimeError as ex:
            print("recorte falhou em %s: %s" % (c["id"], ex))
            break
        resp, erro_rede = consulta_audd(dados)
        del dados  # o recorte nunca vai pro disco
        hora = t0.strftime("%H:%M:%S")
        if resp is None:
            tent = {"data": hoje, "hora": hora, "classe": "erro-rede", "mensagem": erro_rede, "teste": teste}
            c["tentativas"].append(tent)
            fila["historico"].append({"data": hoje, "hora": hora, "consulta": c["id"], "enviada": False,
                                      "cotaGasta": False, "resultado": "erro de rede: %s" % erro_rede})
            grava_fila(fila)
            print("%s: erro de rede (%s); parei o lote" % (c["id"], erro_rede))
            break
        info = classifica(resp, item)
        entrada = {"data": hoje, "metodo": "audd", "recortes": [c["inicio"]], "consulta": c["id"], "hora": hora,
                   "classe": info["classe"], "testeDeCota": teste}
        if info["classe"] == "erro":
            entrada["resultado"] = "erro %s da AudD: %s%s" % (
                info.get("codigo"), info.get("mensagem"),
                " (cota esgotada: talvez a sessão principal já tenha gasto a cota de hoje)" if info.get(
                    "codigo") == 901 else "")
            entrada["audd"] = {"codigo": info.get("codigo")}
        else:
            entrada["resultado"] = info.get("resumo", info["classe"])
            if info["classe"] != "limpo":
                entrada["audd"] = {k: v for k, v in info.items() if k not in ("classe", "resumo")}
        reg = verif["itens"].setdefault(c["item"], {"verificacao": []})
        reg["verificacao"].append(entrada)
        st = aplica_reavaliacao(verif, c["item"], item.get("fonte") == "Pixabay")
        c["tentativas"].append({"data": hoje, "hora": hora, "classe": info["classe"], "teste": teste,
                                "codigo": info.get("codigo")})
        fila["historico"].append({"data": hoje, "hora": hora, "consulta": c["id"], "enviada": True,
                                  "cotaGasta": not (info["classe"] == "erro" and info.get("codigo") == 901),
                                  "testeDeCota": teste, "resultado": entrada["resultado"]})
        if info["classe"] == "erro":
            grava_verif(verif)
            grava_fila(fila)
            print("%s (%s %ss): %s; parei o lote" % (c["id"], c["item"], c["inicio"], entrada["resultado"]))
            break
        c["estado"] = "feita"
        if info["classe"] == "duvidoso":
            outro = c["inicio"] + 30 if c["inicio"] + 30 + JANELA < float(item.get("duracao") or 0) - 5 else \
                max(5, c["inicio"] - 30)
            fila["consultas"].append({
                "id": "d3-%02d" % (len([x for x in fila["consultas"] if x["dia"] == 3]) + 1), "dia": 3,
                "dataPrevista": proximo_dia_plano(hoje), "item": c["item"], "arquivo": c["arquivo"],
                "inicio": int(outro), "estado": "pendente", "tentativas": [],
                "motivo": "nova consulta pro resultado duvidoso de %s" % c["id"]})
        grava_verif(verif)
        grava_fila(fila)
        print("%s (%s %ss): %s -> status %s" % (c["id"], c["item"], c["inicio"], entrada["resultado"], st))
        time.sleep(3)
    return 0


def testa_recorte(cid):
    fila = le_fila()
    c = next((x for x in fila["consultas"] if x["id"] == cid), None)
    if c is None:
        raise SystemExit("consulta não existe: %s" % cid)
    dados = recorte(c["arquivo"], c["inicio"])
    print("recorte de %s (%s a partir de %s s): %d bytes em memória, nada gravado" % (cid, c["item"], c["inicio"],
                                                                                        len(dados)))
    return 0


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(prog="audd.py", description="Fila e consultas da AudD (K08).")
    ap.add_argument("--monta-fila", action="store_true")
    ap.add_argument("--proximo-lote", nargs="?", const=10, type=int)
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--testa-recorte")
    ap.add_argument("--reavalia", action="store_true")
    ap.add_argument("--cota", type=int, default=COTA)
    ap.add_argument("--ate", help="adianta: inclui as consultas previstas até esta data (AAAA-MM-DD), útil com token")
    ap.add_argument("--hoje", help="data de hoje (AAAA-MM-DD); só pra teste")
    a = ap.parse_args(argv)
    hoje = a.hoje or datetime.date.today().isoformat()
    if a.monta_fila:
        return monta_fila()
    if a.proximo_lote is not None:
        return proximo_lote(a.proximo_lote, hoje, a.cota, a.ate)
    if a.status:
        return status(hoje)
    if a.testa_recorte:
        return testa_recorte(a.testa_recorte)
    if a.reavalia:
        return reavalia_tudo(hoje)
    ap.print_help()
    return 2


if __name__ == "__main__":
    sys.exit(main())
