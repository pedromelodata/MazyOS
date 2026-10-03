"""Telas do app por receita JSON (pacote K04 do kit de motion do Legalizaí).

Generaliza o GP/monta_telas.py de 02/10 11:30 (SRC = telas-app-2026-10-02, fundo 255,255,255) com a
mesma semântica, passo a passo. Contrato: KIT/DESENHO.md, seções 4.8 (receita e regioes.json),
4.12 (escrita segura) e 9 (telas). Manual: KIT/telas/LEIA-ME.md.

Uso (sempre com -B, no venv do corte-viral, que tem PIL e numpy):

    python -B monta.py <receita.json | pasta de receitas> [...] --saida <pasta> [--qa] [--anota]
                       [--compara <pasta>]... [--forca] [--publico ME|MEI|todos|ambos|vazio]

    --saida     pasta das PNG, do regioes.json e do qa.jpg. Recusa GP/, RM/public-guia/ e todo
                caminho protegido da seção 13 do DESENHO.
    --publico   o fatos.publico da cena (o kit.py telas passa; "vazio" quando a cena não declarou).
                Fora do ME (MEI, todos ou vazio: a regra mais restrita, F063 por padrão), captura com
                servePecaMei diferente de true é recusada (tela que mostra valor de guia ou é só de ME).

Catálogo (KIT/catalogos, telas): a captura de cada receita é achada pelo conjunto e pelo nome do
arquivo. Captura fora do catálogo e captura reprovada são recusadas (código 2), em qualquer peça. Captura aceito-com-risco: se a área que fica
visível na tela final (colas, barra de abas e recorte, menos o que o preparo apaga) cobre um
bloco de 4x4 px de um corte com regra (P.. ou F..), sai um aviso com o corte e a regra.
    --qa        grava <saida>/qa.jpg: as telas lado a lado em 1/3, como a folha do monta_telas.py.
    --anota     grava <saida>/<tela>.anota.jpg: a fonte com as caixas da receita ao lado da tela
                montada (preparo em vermelho, colas em verde, recorte em azul, regiões em laranja).
    --compara   confere cada PNG montada contra a de mesmo nome na pasta dada (numpy, as duas em RGB).
                Pode repetir. Sai com código 1 se alguma diferir ou faltar.
    --forca     grava por cima de PNG que virou hardlink (o os.replace troca só a entrada da saída e o
                outro nome fica com o conteúdo antigo: religue depois). Só com ordem explícita.

Pasta de receitas: entram os *.json que não começam com "_" (o _modelo.json fica fora), na ordem do
campo "ordem" e depois do nome do arquivo.

Saída: <saida>/<receita.saida> (PNG), <saida>/regioes.json (as regiões de todas as receitas, já no
sistema da tela montada) e, com --qa, <saida>/qa.jpg. Arquivo que já existe com os mesmos bytes não é
regravado: rodar de novo não quebra o hardlink que o kit.py telas faz no public-kit.

Nada de desfoque (o Pedro vetou em 01/10): o que não pode aparecer vira esqueleto, é apagado ou fica
fora do corte. O único GaussianBlur daqui é a sombra da barra de abas, copiada do original pra a tela
sair igual pixel a pixel; ela não esconde conteúdo nenhum.

Códigos de saída: 0 tudo certo; 1 alguma comparação falhou; 2 receita inválida, uso errado ou escrita
recusada.
"""
import argparse
import hashlib
import io
import json
import os
import sys

sys.dont_write_bytecode = True

from PIL import Image, ImageDraw, ImageFilter, ImageFont  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(AQUI)
if not os.path.isfile(os.path.join(KIT, "lib", "escrita.py")):  # rodando de uma cópia fora do kit
    KIT = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion"
sys.path.insert(0, os.path.join(KIT, "lib"))
import escrita  # noqa: E402

# Conjuntos de capturas (DESENHO, siglas TELAS0210 e TELAS09)
CONJUNTOS = {
    "2026-10-02": "C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02",
    "2026-09": "C:/MKT-INSTA/Content Legalizai/marketing/telas-app",
}
FUNDO_CONJUNTO = {"2026-10-02": "#FFFFFF", "2026-09": "#FAF8F5"}
CONJUNTO_HISTORICO = {"2026-09"}  # fundo papel, capturado antes de 29/08: só histórico
# capturas que são a página de erro do servidor de captura (md5 medido em 02/10: /painel, /termo e
# mais 7 rotas; lista no catálogo de telas, conjuntos.2026-10-02.paginas404)
PAGINAS_ERRO = {"e26d634e3f17067c83748e0ad7ec4d84": "página 404 do servidor de captura (02/10)"}
# travessão, meia-risca e os outros traços longos (o sinal de menos lê como meia-risca): nunca em texto da tela
TRACOS = tuple(chr(c) for c in (0x2012, 0x2013, 0x2014, 0x2015, 0x2212, 0x2E3A, 0x2E3B, 0xFE31, 0xFE32, 0xFE58))
LADO_BLOCO = 4  # px: um corte com regra conta como visível quando um bloco de 4x4 px dele fica na tela final

SORA = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Windows\Fonts\Sora-wght.ttf")
SORA_MD5 = "67f16b0da16db1b4f219ae35e78d0abd"
INK = (27, 30, 36)  # #1B1E24
TAMANHO_PADRAO = (1290, 2796)
# barra de abas do app nas capturas 1290x2796 (medida no inicio.png, igual nos dois conjuntos)
PILULA_ABAS = (48, 2574, 1243, 2764)
BOTAO_ABAS = (553, 2484, 738, 2671)

PROTEGIDAS_SAIDA = (("GP/", escrita.GP), ("RM/public-guia/", escrita.RM + "/public-guia"))
CAMPOS_REGIAO = ("x", "y", "w", "h", "r", "fonte", "cor")  # o tipo Regiao do K02 (nucleo/tipos.ts)
META_REGIAO = {"sistema", "desc", "nota", "medido", "centroReal", "conjuntoMedido", "medidoEm", "origem"}
CHAVES_RECEITA = {
    "saida", "fonte", "modo", "fundo", "tamanho", "barraStatus", "preparo", "cola", "barraAbas", "recorte",
    "regioes", "ordem", "id", "historico", "status", "notas", "nota", "motivo", "conjuntoUsado", "peca",
    "titulo", "cortes", "usos", "versao", "origem", "pendencias", "data", "alternativas", "medidas",
}
OPS = {
    "retangulo": {"caixa", "cor"},
    "esqueleto": {"caixa", "cor", "raio"},
    "apaga": {"caixa", "amostra"},
    "texto": {"xy", "texto", "peso", "tamanho", "cor", "ancora"},
}
OPS_OBRIGATORIOS = {
    "retangulo": {"caixa", "cor"},
    "esqueleto": {"caixa", "cor"},
    "apaga": {"caixa", "amostra"},
    "texto": {"xy", "texto", "peso", "tamanho", "cor"},
}

_avisos = []


class ErroReceita(Exception):
    """Receita inválida (mensagem em português, com o arquivo e o campo)."""


def aviso(msg):
    _avisos.append(msg)
    print("aviso: " + msg)


# ---------------------------------------------------------------------------------------------
# Leitura e validação da receita

def _sem_comentarios(obj):
    """Tira as chaves que começam com "_" (comentários) em qualquer nível; numa lista, some o item que
    só tinha comentário."""
    if isinstance(obj, dict):
        return {k: _sem_comentarios(v) for k, v in obj.items() if not (isinstance(k, str) and k.startswith("_"))}
    if isinstance(obj, list):
        saida = []
        for v in obj:
            if isinstance(v, dict) and v and all(isinstance(k, str) and k.startswith("_") for k in v):
                continue
            saida.append(_sem_comentarios(v))
        return saida
    return obj


def _int(v):
    return isinstance(v, int) and not isinstance(v, bool)


def _num(v):
    return (isinstance(v, (int, float))) and not isinstance(v, bool)


def _cor(valor, onde):
    if isinstance(valor, str) and len(valor) == 7 and valor.startswith("#"):
        try:
            return tuple(int(valor[i:i + 2], 16) for i in (1, 3, 5))
        except ValueError:
            pass
    if isinstance(valor, (list, tuple)) and len(valor) == 3 and all(_int(v) and 0 <= v <= 255 for v in valor):
        return tuple(valor)
    raise ErroReceita('%s: cor inválida %r (use "#RRGGBB")' % (onde, valor))


def _caixa(valor, onde, limites=None):
    if not (isinstance(valor, list) and len(valor) == 4 and all(_int(v) for v in valor)):
        raise ErroReceita("%s: a caixa tem de ser [x0, y0, x1, y1] em px inteiros (veio %r)" % (onde, valor))
    x0, y0, x1, y1 = valor
    if x1 <= x0 or y1 <= y0:
        raise ErroReceita("%s: caixa %r com o fim antes do começo" % (onde, valor))
    if limites is not None:
        w, h = limites
        if x0 < 0 or y0 < 0 or x1 > w or y1 > h:
            raise ErroReceita("%s: caixa %r sai da imagem de %dx%d" % (onde, valor, w, h))
    return tuple(valor)


def _ponto(valor, onde, limites):
    if not (isinstance(valor, list) and len(valor) == 2 and all(_int(v) for v in valor)):
        raise ErroReceita("%s: o ponto tem de ser [x, y] em px inteiros (veio %r)" % (onde, valor))
    x, y = valor
    if not (0 <= x < limites[0] and 0 <= y < limites[1]):
        raise ErroReceita("%s: ponto %r fora da imagem de %dx%d" % (onde, valor, limites[0], limites[1]))
    return tuple(valor)


def md5_arquivo(caminho):
    return escrita.md5(caminho)


def le_receita(caminho):
    """Lê, valida e normaliza uma receita. Levanta ErroReceita com o motivo."""
    nome = os.path.basename(caminho)
    try:
        with open(caminho, "r", encoding="utf-8") as f:
            bruto = json.load(f)
    except (OSError, ValueError) as e:
        raise ErroReceita("%s: não deu pra ler o JSON (%s)" % (nome, e))
    if not isinstance(bruto, dict):
        raise ErroReceita("%s: a receita tem de ser um objeto JSON" % nome)
    d = _sem_comentarios(bruto)
    for k in d:
        if k not in CHAVES_RECEITA:
            aviso("%s: campo desconhecido %r (ignorado; comentário começa com _)" % (nome, k))

    rec = {"arquivo": os.path.abspath(caminho), "nome": nome, "bruto": bruto}
    saida = d.get("saida")
    if not (isinstance(saida, str) and saida.lower().endswith(".png") and os.path.basename(saida) == saida
            and "/" not in saida and "\\" not in saida):
        raise ErroReceita('%s: "saida" tem de ser só o nome de um .png (veio %r)' % (nome, saida))
    rec["saida"] = saida

    fonte = d.get("fonte")
    if not (isinstance(fonte, dict) and fonte.get("conjunto") in CONJUNTOS and isinstance(fonte.get("arquivo"), str)):
        raise ErroReceita('%s: "fonte" tem de ser {"conjunto": %s, "arquivo": "<nome>.png"}'
                          % (nome, " ou ".join('"%s"' % c for c in CONJUNTOS)))
    conj, arq = fonte["conjunto"], fonte["arquivo"]
    if os.path.basename(arq) != arq:
        raise ErroReceita('%s: "fonte.arquivo" é só o nome do arquivo dentro do conjunto (veio %r)' % (nome, arq))
    fcam = os.path.join(CONJUNTOS[conj], arq).replace("\\", "/")
    if not os.path.isfile(fcam):
        raise ErroReceita("%s: a captura %s não existe no conjunto %s" % (nome, arq, conj))
    m = md5_arquivo(fcam)
    if m in PAGINAS_ERRO:
        raise ErroReceita("%s: a captura %s do conjunto %s é a %s (md5 %s); use outra tela ou outro conjunto"
                          % (nome, arq, conj, PAGINAS_ERRO[m], m))
    with Image.open(fcam) as im:
        tam_fonte = im.size
    rec.update(conjunto=conj, fonte_arquivo=arq, fonte_caminho=fcam, fonte_md5=m, tamanho_fonte=tam_fonte)

    historico = bool(d.get("historico", False))
    rec["historico"] = historico
    if conj in CONJUNTO_HISTORICO and not historico:
        aviso("%s: conjunto %s (fundo papel, antes de 29/08) sem \"historico\": true; é só histórico"
              % (nome, conj))
    rec["ordem"] = d.get("ordem")

    modo = d.get("modo", "composta")
    if modo not in ("composta", "inteira"):
        raise ErroReceita('%s: "modo" é "composta" (padrão) ou "inteira" (veio %r)' % (nome, modo))
    rec["modo"] = modo

    tamanho = d.get("tamanho", list(TAMANHO_PADRAO))
    if not (isinstance(tamanho, list) and len(tamanho) == 2 and all(_int(v) and v > 0 for v in tamanho)):
        raise ErroReceita('%s: "tamanho" tem de ser [largura, altura] em px (veio %r)' % (nome, tamanho))
    rec["tamanho"] = tuple(tamanho)
    if "fundo" in d:
        rec["fundo"] = _cor(d["fundo"], nome + ": fundo")
    elif modo == "composta":
        raise ErroReceita('%s: falta "fundo" (o conjunto %s usa %s)' % (nome, conj, FUNDO_CONJUNTO[conj]))
    else:
        rec["fundo"] = None
    if modo == "composta" and rec["fundo"] != _cor(FUNDO_CONJUNTO[conj], "fundo do conjunto"):
        aviso("%s: fundo %s diferente do fundo do conjunto %s (%s)"
              % (nome, d.get("fundo"), conj, FUNDO_CONJUNTO[conj]))

    # preparo (na cópia da fonte; o fim da caixa entra no desenho)
    preparo = d.get("preparo") or []
    if not isinstance(preparo, list):
        raise ErroReceita('%s: "preparo" tem de ser uma lista de passos' % nome)
    passos = []
    for i, op in enumerate(preparo):
        onde = "%s: preparo[%d]" % (nome, i)
        if not isinstance(op, dict) or op.get("op") not in OPS:
            raise ErroReceita("%s: passo desconhecido %r (use %s)" % (onde, op.get("op") if isinstance(op, dict) else op,
                                                                       ", ".join(sorted(OPS))))
        tipo = op["op"]
        faltam = OPS_OBRIGATORIOS[tipo] - set(op)
        if faltam:
            raise ErroReceita("%s (%s): faltam %s" % (onde, tipo, ", ".join(sorted(faltam))))
        sobra = set(op) - OPS[tipo] - {"op", "desc", "nota", "regra", "motivo"}
        if sobra:
            aviso("%s (%s): campos ignorados: %s" % (onde, tipo, ", ".join(sorted(sobra))))
        p = {"op": tipo}
        if tipo in ("retangulo", "esqueleto", "apaga"):
            p["caixa"] = _caixa(op["caixa"], onde, tam_fonte)
        if tipo in ("retangulo", "esqueleto", "texto"):
            p["cor"] = _cor(op["cor"], onde)
        if tipo == "esqueleto":
            x0, y0, x1, y1 = p["caixa"]
            raio = op.get("raio", min(x1 - x0, y1 - y0) // 2)
            if not (_num(raio) and raio >= 0):
                raise ErroReceita("%s: raio inválido %r" % (onde, raio))
            p["raio"] = raio
        if tipo == "apaga":
            p["amostra"] = _ponto(op["amostra"], onde + " amostra", tam_fonte)
        if tipo == "texto":
            p["xy"] = tuple(op["xy"]) if isinstance(op["xy"], list) and len(op["xy"]) == 2 and all(_num(v) for v in op["xy"]) else None
            if p["xy"] is None:
                raise ErroReceita("%s: xy tem de ser [x, y]" % onde)
            if not isinstance(op["texto"], str):
                raise ErroReceita("%s: texto tem de ser string" % onde)
            if any(ch in op["texto"] for ch in TRACOS):
                raise ErroReceita("%s: travessão, meia-risca ou outro traço longo no texto (P26)" % onde)
            p["texto"] = op["texto"]
            if not (_int(op["peso"]) and 100 <= op["peso"] <= 800):
                raise ErroReceita("%s: peso da Sora vai de 100 a 800 (veio %r)" % (onde, op["peso"]))
            if not (_int(op["tamanho"]) and op["tamanho"] > 0):
                raise ErroReceita("%s: tamanho em px inteiro (veio %r)" % (onde, op["tamanho"]))
            p["peso"], p["tamanho"] = op["peso"], op["tamanho"]
            p["ancora"] = op.get("ancora", "la")
            if not (isinstance(p["ancora"], str) and len(p["ancora"]) == 2):
                raise ErroReceita("%s: âncora do PIL com 2 letras, ex. \"ls\" ou \"lm\" (veio %r)" % (onde, p["ancora"]))
        passos.append(p)
    rec["preparo"] = passos

    # barra de status, colas e barra de abas (só no modo composta)
    bs = d.get("barraStatus")
    colas = d.get("cola") or []
    ba = d.get("barraAbas")
    if modo == "inteira" and (bs or colas or ba):
        raise ErroReceita('%s: no modo "inteira" não entram barraStatus, cola nem barraAbas' % nome)
    rec["barra_status"] = None
    if bs:
        if not isinstance(bs, dict):
            raise ErroReceita('%s: "barraStatus" tem de ser {"hora": "9:41", "faixa": 132}' % nome)
        hora = bs.get("hora", "9:41")
        faixa = bs.get("faixa", 132)
        if not isinstance(hora, str) or not (_int(faixa) and faixa >= 0):
            raise ErroReceita("%s: barraStatus com hora (texto) e faixa (px inteiro)" % nome)
        rec["barra_status"] = {"hora": hora, "faixa": faixa, "cor": _cor(bs.get("cor", "#1B1E24"), nome + ": barraStatus.cor")}
    if not isinstance(colas, list):
        raise ErroReceita('%s: "cola" tem de ser uma lista' % nome)
    rec["colas"] = []
    W, H = rec["tamanho"]
    for i, c in enumerate(colas):
        onde = "%s: cola[%d]" % (nome, i)
        if not isinstance(c, dict) or "caixa" not in c or not _int(c.get("y")):
            raise ErroReceita('%s: cada cola é {"caixa": [x0, y0, x1, y1], "y": <destino>}' % onde)
        cx = _caixa(c["caixa"], onde, tam_fonte)
        x = c.get("x", cx[0])
        if not _int(x):
            raise ErroReceita("%s: x de destino tem de ser inteiro" % onde)
        if c["y"] < 0 or x < 0 or c["y"] + (cx[3] - cx[1]) > H or x + (cx[2] - cx[0]) > W:
            aviso("%s: a cola passa da borda da tela de %dx%d (o PIL corta)" % (onde, W, H))
        if rec["barra_status"] and c["y"] < rec["barra_status"]["faixa"]:
            aviso("%s: a cola começa em y %d, dentro da faixa da barra de status (%d)"
                  % (onde, c["y"], rec["barra_status"]["faixa"]))
        rec["colas"].append({"caixa": cx, "x": x, "y": c["y"]})
    rec["barra_abas"] = None
    if ba:
        if not isinstance(ba, dict):
            raise ErroReceita('%s: "barraAbas" tem de ser {"dy": 0, "fonte": "sem-preparo"}' % nome)
        dy = ba.get("dy", 0)
        qual = ba.get("fonte", "sem-preparo")
        if not _int(dy) or qual not in ("sem-preparo", "preparada"):
            raise ErroReceita('%s: barraAbas com dy inteiro e fonte "sem-preparo" ou "preparada"' % nome)
        rec["barra_abas"] = {
            "dy": dy, "fonte": qual,
            "pilula": _caixa(ba["pilula"], nome + ": barraAbas.pilula", tam_fonte) if "pilula" in ba else PILULA_ABAS,
            "botao": _caixa(ba["botao"], nome + ": barraAbas.botao", tam_fonte) if "botao" in ba else BOTAO_ABAS,
        }

    rec["recorte"] = None
    if d.get("recorte") is not None:
        lim = tam_fonte if modo == "inteira" else rec["tamanho"]
        rec["recorte"] = _caixa(d["recorte"], nome + ": recorte", lim)

    # regiões
    regs = d.get("regioes") or {}
    if not isinstance(regs, dict):
        raise ErroReceita('%s: "regioes" tem de ser um objeto {nome: região}' % nome)
    rec["regioes"] = {}
    for rn, r in regs.items():
        onde = "%s: regioes.%s" % (nome, rn)
        if not isinstance(r, dict):
            raise ErroReceita("%s: a região tem de ser um objeto" % onde)
        if r.get("sistema") not in ("fonte", "destino"):
            raise ErroReceita('%s: falta "sistema": "fonte" (coordenada da captura, levada pela cola) '
                              'ou "destino" (coordenada da tela final)' % onde)
        if not (_num(r.get("x")) and _num(r.get("y"))):
            raise ErroReceita("%s: x e y numéricos são obrigatórios" % onde)
        for k in ("w", "h", "r"):
            if k in r and not (_num(r[k]) and r[k] >= 0):
                raise ErroReceita("%s: %s inválido %r" % (onde, k, r[k]))
        if "cor" in r:
            _cor(r["cor"], onde)
        if "fonte" in r and not isinstance(r["fonte"], str):
            raise ErroReceita("%s: fonte é o texto CSS da fonte, ex. \"600 59px Sora\"" % onde)
        sobra = set(r) - set(CAMPOS_REGIAO) - META_REGIAO
        if sobra:
            aviso("%s: campos que não vão pro regioes.json: %s" % (onde, ", ".join(sorted(sobra))))
        rec["regioes"][rn] = r
    return rec


def junta_receitas(entradas):
    """Expande pastas (os *.json que não começam com "_", por "ordem" e nome) e lê tudo."""
    caminhos = []
    for e in entradas:
        if os.path.isdir(e):
            lote = []
            for n in sorted(os.listdir(e)):
                if n.lower().endswith(".json") and not n.startswith("_"):
                    lote.append(os.path.join(e, n))
            if not lote:
                raise ErroReceita("a pasta %s não tem receita (*.json fora os que começam com _)" % e)
            lidas = [le_receita(c) for c in lote]
            lidas.sort(key=lambda r: (r["ordem"] is None, r["ordem"] if _num(r["ordem"]) else 0, r["nome"]))
            caminhos.extend(lidas)
        elif os.path.isfile(e):
            caminhos.append(le_receita(e))
        else:
            raise ErroReceita("receita não encontrada: %s" % e)
    vistos = {}
    for r in caminhos:
        if r["saida"].lower() in vistos:
            raise ErroReceita("duas receitas gravam %s: %s e %s" % (r["saida"], vistos[r["saida"].lower()], r["nome"]))
        vistos[r["saida"].lower()] = r["nome"]
    return caminhos


# ---------------------------------------------------------------------------------------------
# Catálogo: status da captura, servePecaMei e os cortes com regra (frente TRAVAS DE REGRA, 03/10)

_cat = {}


def captura_do_catalogo(conjunto, arquivo):
    """O item do catálogo de telas (KIT/catalogos) da captura, pelo conjunto e pelo nome do arquivo, ou None."""
    if "idx" not in _cat:
        pasta = os.path.join(KIT, "catalogos")
        if pasta not in sys.path:
            sys.path.insert(0, pasta)
        import catalogo  # noqa: E402 (só aqui: o desenho das telas não depende do catálogo)
        _cat["idx"] = catalogo.indice("telas")
    for it in _cat["idx"].values():
        if (it.get("tipo") == "captura" and it.get("conjunto") == conjunto
                and os.path.basename(str(it.get("arquivo") or "")) == arquivo):
            return it
    return None


def mascara_visivel(rec):
    """Máscara (numpy bool, no tamanho da captura) do que da captura fica visível na tela final: as colas e a barra
    de abas (dentro da tela e do recorte), menos o que o preparo apaga (retângulo, esqueleto e apaga; o fim da caixa
    entra, como no ImageDraw). A barra de abas tirada da fonte sem preparo não perde nada. No modo inteira, a captura
    inteira (ou o recorte, que é em px da captura), menos o preparo. Cola que outra cobre depois conta como visível
    (a conta é conservadora)."""
    import numpy as np
    W, H = rec["tamanho_fonte"]
    vis = np.zeros((H, W), dtype=bool)
    apagado = np.zeros((H, W), dtype=bool)
    for p in rec["preparo"]:
        if p["op"] in ("retangulo", "esqueleto", "apaga"):
            x0, y0, x1, y1 = p["caixa"]
            apagado[max(0, y0):min(H, y1 + 1), max(0, x0):min(W, x1 + 1)] = True
    if rec["modo"] == "inteira":
        x0, y0, x1, y1 = rec["recorte"] or (0, 0, W, H)
        vis[max(0, y0):min(H, y1), max(0, x0):min(W, x1)] = True
        return vis & ~apagado
    TW, TH = rec["tamanho"]
    rx0, ry0, rx1, ry1 = rec["recorte"] or (0, 0, TW, TH)
    jx0, jy0, jx1, jy1 = max(0, rx0), max(0, ry0), min(TW, rx1), min(TH, ry1)  # janela da tela final
    partes = [(c, True) for c in rec["colas"]]
    ba = rec["barra_abas"]
    if ba:
        for cx in (ba["pilula"], ba["botao"]):
            partes.append(({"caixa": cx, "x": cx[0], "y": cx[1] + ba["dy"]}, ba["fonte"] == "preparada"))
    for c, preparada in partes:
        cx0, cy0, cx1, cy1 = c["caixa"]
        # a cola vai de (x, y) a (x + w, y + h) no destino; a parte dentro da janela volta pra coordenada da captura
        dx0, dy0 = max(jx0, c["x"]), max(jy0, c["y"])
        dx1, dy1 = min(jx1, c["x"] + (cx1 - cx0)), min(jy1, c["y"] + (cy1 - cy0))
        if dx1 <= dx0 or dy1 <= dy0:
            continue
        sx0, sy0 = cx0 + (dx0 - c["x"]), cy0 + (dy0 - c["y"])
        sx1, sy1 = cx0 + (dx1 - c["x"]), cy0 + (dy1 - c["y"])
        trecho = np.zeros((H, W), dtype=bool)
        trecho[max(0, sy0):min(H, sy1), max(0, sx0):min(W, sx1)] = True
        vis |= (trecho & ~apagado) if preparada else trecho
    return vis


def bloco_visivel(vis, caixa, lado=LADO_BLOCO):
    """(px visíveis, se há um bloco lado x lado inteiro visível) dentro da caixa [x0, y0, x1, y1] da captura."""
    import numpy as np
    H, W = vis.shape
    x0, y0, x1, y1 = (int(v) for v in caixa)
    sub = vis[max(0, y0):min(H, y1), max(0, x0):min(W, x1)]
    n = int(sub.sum())
    if n == 0 or sub.shape[0] < lado or sub.shape[1] < lado:
        return n, False
    s = np.pad(sub.astype(np.int32).cumsum(0).cumsum(1), ((1, 0), (1, 0)))
    blocos = s[lado:, lado:] - s[:-lado, lado:] - s[lado:, :-lado] + s[:-lado, :-lado]
    return n, bool((blocos == lado * lado).any())


def publico_estrito(publico):
    """Público conferido como MEI (F063 por padrão, rodada 4): tudo menos "ME", inclusive "todos" e vazio. Sem o
    --publico (o monta.py rodado à mão, como o testa_guia.py), o público não é conferido aqui: o kit.py telas sempre
    passa o da cena, e o montaProps confere de novo."""
    return publico is not None and publico != "ME"


def confere_catalogo(rec, publico=None):
    """Confere a captura da receita no catálogo de telas. Levanta ErroReceita com captura fora do catálogo (em qualquer
    peça: tela sem origem não entra), com captura reprovada e, com o público conferido como MEI (MEI, todos ou vazio),
    com captura que não serve MEI (servePecaMei diferente de true). Captura aceito-com-risco: aviso pra cada corte com
    regra que a área visível cobre. Devolve {id, status, servePecaMei, cortesVisiveis}."""
    it = captura_do_catalogo(rec["conjunto"], rec["fonte_arquivo"])
    nome = rec["nome"]
    if it is None:
        raise ErroReceita("%s: a captura %s (conjunto %s) não está no catálogo de telas: tela sem origem no catálogo não "
                          "entra em peça nenhuma (status, cortes e servePecaMei sem conferir)"
                          % (nome, rec["fonte_arquivo"], rec["conjunto"]))
    info = {"id": it["id"], "status": it.get("status"), "servePecaMei": it.get("servePecaMei"), "cortesVisiveis": []}
    if it.get("status") == "reprovado":
        raise ErroReceita("%s: a captura %s está reprovada no catálogo (%s); use outra tela"
                          % (nome, it["id"], it.get("resumo") or it.get("motivo") or "ver KIT/telas-revisao/REVISAO.md"))
    if publico_estrito(publico) and it.get("servePecaMei") is not True:
        raise ErroReceita("%s: peça %s e a captura %s não serve peça de MEI (servePecaMei %s, público %s%s): pode "
                          "mostrar valor de guia ou ser só de ME (F063)%s"
                          % (nome, "de MEI" if publico == "MEI" else "conferida como MEI (público %s)" % publico,
                             it["id"], it.get("servePecaMei"), it.get("publico"),
                             ("; " + it["resumo"]) if it.get("resumo") else "",
                             "; declare o fatos.publico da cena (\"ME\", \"MEI\" ou \"todos\"): vazio é conferido como MEI"
                             if publico == "vazio" else ""))
    if it.get("status") == "aceito-com-risco":
        com_regra = [c for c in it.get("cortes") or [] if c.get("regra") and isinstance(c.get("caixa"), list)]
        if com_regra:
            vis = mascara_visivel(rec)
            for c in com_regra:
                n, bloco = bloco_visivel(vis, c["caixa"])
                if bloco:
                    info["cortesVisiveis"].append({"caixa": c["caixa"], "regra": c["regra"], "px": n})
                    aviso("%s: a área visível cruza um corte com regra da captura %s (caixa %s, regra %s, %d px "
                          "visíveis): %s" % (nome, it["id"], c["caixa"], c["regra"], n, c.get("motivo") or ""))
    return info


# ---------------------------------------------------------------------------------------------
# Desenho (igual ao GP/monta_telas.py; os números são os dele)

_sora_conferida = []


def sora(tamanho, peso):
    if not _sora_conferida:
        if not os.path.isfile(SORA):
            raise ErroReceita("a Sora não está em %s" % SORA)
        if md5_arquivo(SORA) != SORA_MD5:
            aviso("a Sora em %s tem md5 diferente do inventário (%s)" % (SORA, SORA_MD5))
        _sora_conferida.append(True)
    f = ImageFont.truetype(SORA, tamanho)
    try:
        f.set_variation_by_axes([peso])
    except Exception as e:  # o original também segue sem o eixo; aqui avisa
        aviso("set_variation_by_axes([%r]) falhou: %s" % (peso, e))
    return f


def barra_status(img, hora="9:41", cor=INK):
    """Barra de status genérica, sem marca: hora à esquerda, sinal, wi-fi e bateria à direita."""
    d = ImageDraw.Draw(img)
    d.text((132, 58), hora, font=sora(50, 600), fill=cor, anchor="lm")
    x, y = 1000, 58
    for i, h in enumerate((14, 20, 26, 32)):  # sinal
        d.rounded_rectangle((x + i * 15, y + 16 - h, x + i * 15 + 10, y + 16), radius=3, fill=cor)
    cx, cy = 1105, 74  # wi-fi
    for r, wdt in ((34, 7), (22, 7)):
        d.arc((cx - r, cy - r, cx + r, cy + r), start=225, end=315, fill=cor, width=wdt)
    d.ellipse((cx - 6, cy - 12, cx + 6, cy), fill=cor)
    bx, by = 1150, 42  # bateria
    d.rounded_rectangle((bx, by, bx + 72, by + 34), radius=10, outline=cor, width=4)
    d.rounded_rectangle((bx + 7, by + 7, bx + 58, by + 27), radius=5, fill=cor)
    d.rounded_rectangle((bx + 76, by + 11, bx + 81, by + 23), radius=2, fill=cor)


def mascara_arredondada(w, h, r):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), radius=r, fill=255)
    return m


def barra_abas(dst, src, dy=0, pilula=PILULA_ABAS, botao=BOTAO_ABAS):
    """Pílula da barra de abas e botão NF-e recortados da fonte, com máscara arredondada e sombra.
    A sombra é o único GaussianBlur do kit de telas: vem do original e não esconde conteúdo."""
    W, H = dst.size
    px0, py0, px1, py1 = pilula
    pil = src.crop((px0, py0, px1, py1))
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle((px0, py0 + 10 + dy, px1, py1 + 10 + dy), radius=(py1 - py0) // 2, fill=60)
    sh = sh.filter(ImageFilter.GaussianBlur(22))
    dst.paste(Image.new("RGB", (W, H), (150, 140, 130)), (0, 0), sh)
    dst.paste(pil, (px0, py0 + dy), mascara_arredondada(px1 - px0, py1 - py0, (py1 - py0) // 2))
    bx0, by0, bx1, by1 = botao
    nf = src.crop((bx0, by0, bx1, by1))
    sh2 = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh2).rounded_rectangle((bx0, by0 + 14 + dy, bx1, by1 + 14 + dy), radius=48, fill=90)
    sh2 = sh2.filter(ImageFilter.GaussianBlur(18))
    dst.paste(Image.new("RGB", (W, H), (120, 60, 40)), (0, 0), sh2)
    dst.paste(nf, (bx0, by0 + dy), mascara_arredondada(bx1 - bx0, by1 - by0, 46))


def prepara(img, passos):
    """Passos do preparo, em ordem, na cópia da fonte (a caixa vai direto pro ImageDraw: o fim entra)."""
    d = ImageDraw.Draw(img)
    for p in passos:
        if p["op"] == "retangulo":
            d.rectangle(p["caixa"], fill=p["cor"])
        elif p["op"] == "esqueleto":
            d.rounded_rectangle(p["caixa"], radius=p["raio"], fill=p["cor"])
        elif p["op"] == "apaga":
            # a cor vem da cópia em preparo, no estado deste passo
            d.rectangle(p["caixa"], fill=img.getpixel(p["amostra"]))
        elif p["op"] == "texto":
            d.text(p["xy"], p["texto"], font=sora(p["tamanho"], p["peso"]), fill=p["cor"], anchor=p["ancora"])


def monta(rec):
    """Devolve (fonte, montada antes do recorte, final). Nada é gravado aqui."""
    fonte = Image.open(rec["fonte_caminho"]).convert("RGB")
    work = fonte.copy()
    if rec["preparo"]:
        prepara(work, rec["preparo"])
    if rec["modo"] == "inteira":
        img = work  # a fonte inteira, gravada de novo (como a splash)
    else:
        img = Image.new("RGB", rec["tamanho"], rec["fundo"])
        if rec["barra_status"]:
            bs = rec["barra_status"]
            barra_status(img, bs["hora"], bs["cor"])  # antes das colas
        for c in rec["colas"]:
            img.paste(work.crop(c["caixa"]), (c["x"], c["y"]))  # o fim da caixa fica fora
        if rec["barra_abas"]:
            ba = rec["barra_abas"]
            barra_abas(img, fonte if ba["fonte"] == "sem-preparo" else work, ba["dy"], ba["pilula"], ba["botao"])
    montada = img
    final = img.crop(rec["recorte"]) if rec["recorte"] else img
    return fonte, montada, final


def png_bytes(img):
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ---------------------------------------------------------------------------------------------
# Regiões

def _todas_colas(rec):
    """Colas na ordem em que são coladas (a barra de abas entra por último)."""
    lista = list(rec["colas"])
    ba = rec["barra_abas"]
    if ba:
        for cx in (ba["pilula"], ba["botao"]):
            lista.append({"caixa": cx, "x": cx[0], "y": cx[1] + ba["dy"]})
    return lista


def _contem(cx, x, y, w, h):
    x0, y0, x1, y1 = cx
    if w is None or h is None:
        return x0 <= x < x1 and y0 <= y < y1
    return x0 <= x and y0 <= y and x + w <= x1 and y + h <= y1


def regioes_da_receita(rec, tamanho_final):
    """Regiões no sistema da tela final: as de "fonte" vão pela cola que as contém (a última colada
    vence) e depois pelo recorte; as de "destino" passam direto."""
    saida = {}
    for nome, r in rec["regioes"].items():
        x, y = r["x"], r["y"]
        if r["sistema"] == "fonte":
            if rec["modo"] == "composta":
                alvo = None
                for c in reversed(_todas_colas(rec)):
                    if _contem(c["caixa"], x, y, r.get("w"), r.get("h")):
                        alvo = c
                        break
                if alvo is None:
                    raise ErroReceita("%s: a região %s (sistema fonte, x %s, y %s) não está dentro de nenhuma cola"
                                      % (rec["nome"], nome, x, y))
                x, y = x - alvo["caixa"][0] + alvo["x"], y - alvo["caixa"][1] + alvo["y"]
            if rec["recorte"]:
                x, y = x - rec["recorte"][0], y - rec["recorte"][1]
        reg = {"x": x, "y": y}
        for k in CAMPOS_REGIAO[2:]:
            if k in r:
                reg[k] = r[k]
        W, H = tamanho_final
        fim_x = x + (reg.get("w") or 0)
        fim_y = y + (reg.get("h") or 0)
        if x < 0 or y < 0 or fim_x > W or fim_y > H:
            aviso("%s: a região %s (%s, %s) sai da tela final de %dx%d" % (rec["nome"], nome, x, y, W, H))
        saida[nome] = reg
    return saida


def junta_regioes(lista):
    """[(receita, {nome: região})] -> {nome: região}. Mesmo nome com valor igual fica uma vez só."""
    todas, dono = {}, {}
    for rec, regs in lista:
        for nome, reg in regs.items():
            if nome in todas:
                if todas[nome] != reg:
                    raise ErroReceita("a região %s aparece em %s e em %s com valores diferentes (%r e %r); "
                                      "dê outro nome a uma delas" % (nome, dono[nome], rec["nome"], todas[nome], reg))
                continue
            todas[nome] = reg
            dono[nome] = rec["nome"]
    return todas


# ---------------------------------------------------------------------------------------------
# Folhas de conferência

def folha_qa(imagens):
    """Tira lado a lado em 1/3, fundo (40, 40, 40), 10 px entre as telas, JPEG qualidade 88."""
    esc = [im.resize((max(1, im.width // 3), max(1, im.height // 3)), Image.LANCZOS) for im in imagens]
    larg = sum(e.width for e in esc) + 10 * (len(esc) - 1)
    alt = max(e.height for e in esc)
    fol = Image.new("RGB", (larg, alt), (40, 40, 40))
    x = 0
    for e in esc:
        fol.paste(e, (x, 0))
        x += e.width + 10
    buf = io.BytesIO()
    fol.save(buf, format="JPEG", quality=88)
    return buf.getvalue()


def _fonte_rotulo(tam=15):
    try:
        f = ImageFont.truetype(SORA, tam)
        f.set_variation_by_axes([600])
        return f
    except Exception:
        return ImageFont.load_default()


def folha_anotada(rec, fonte, montada, final, regs, escala=4, qualidade=80):
    """Fonte com as caixas da receita, a tela montada e (com recorte) o resultado, em 1/escala.
    A tela final parcial (até 1000 px de altura) sai em 1/2, pra as regiões ficarem legíveis; as regiões
    levam um número, e a legenda fica embaixo."""
    def reduz(im, e=escala):
        return im.resize((max(1, im.width // e), max(1, im.height // e)), Image.LANCZOS)

    def ret(d, cx, cor, larg=2):
        d.rectangle(tuple(v // escala for v in cx), outline=cor, width=larg)

    rot = _fonte_rotulo()
    paineis = []
    a = reduz(fonte)
    da = ImageDraw.Draw(a)
    for p in rec["preparo"]:
        if "caixa" in p:
            ret(da, p["caixa"], (230, 40, 40))
        else:
            x, y = p["xy"]
            da.ellipse((x // escala - 4, y // escala - 4, x // escala + 4, y // escala + 4), outline=(230, 40, 40), width=2)
    if rec["modo"] == "composta":
        for c in rec["colas"]:
            ret(da, c["caixa"], (20, 150, 60))
            rotulo = "vai pra y %d" % c["y"]
            larg_rot = da.textlength(rotulo, font=rot) if hasattr(da, "textlength") else 90
            da.text((c["caixa"][2] // escala - larg_rot - 4, c["caixa"][1] // escala + 2), rotulo, font=rot, fill=(20, 120, 50))
    elif rec["recorte"]:
        ret(da, rec["recorte"], (40, 90, 220), 3)
    paineis.append(("fonte %s (%s)" % (rec["fonte_arquivo"], rec["conjunto"]), a))
    b = reduz(montada)
    if rec["modo"] == "composta" and rec["recorte"]:
        ret(ImageDraw.Draw(b), rec["recorte"], (40, 90, 220), 3)
        paineis.append(("montada", b))
    ef = 2 if final.height <= 1000 else escala
    c = reduz(final, ef)
    dc = ImageDraw.Draw(c)
    legenda = []
    for i, (nome, r) in enumerate(regs.items(), 1):
        x, y = int(r["x"] // ef), int(r["y"] // ef)
        if "w" in r and "h" in r:
            dc.rectangle((x, y, x + int(r["w"] // ef), y + int(r["h"] // ef)), outline=(240, 140, 20), width=2)
            dim = ", %s x %s" % (r["w"], r["h"])
        else:
            dc.line((x - 6, y, x + 6, y), fill=(240, 140, 20), width=2)
            dc.line((x, y - 6, x, y + 6), fill=(240, 140, 20), width=2)
            dim = " (ponto)"
        dc.text((x + 3, y + 1), str(i), font=rot, fill=(200, 90, 0))
        legenda.append("%d  %s: x %s, y %s%s" % (i, nome, r["x"], r["y"], dim))
    paineis.append(("final %s (%dx%d, em 1/%d)" % (rec["saida"], final.width, final.height, ef), c))
    medidor = ImageDraw.Draw(Image.new("L", (1, 1)))
    titulos = []
    for titulo, im in paineis:  # título que não cabe na largura do painel quebra no " ("
        cabe = not hasattr(medidor, "textlength") or medidor.textlength(titulo, font=rot) <= im.width
        titulos.append([titulo] if cabe or " (" not in titulo else [titulo.split(" (", 1)[0], "(" + titulo.split(" (", 1)[1]])
    topo = 8 + 20 * max(len(t) for t in titulos)
    larg = sum(p[1].width for p in paineis) + 16 * (len(paineis) + 1)
    alt = max(p[1].height for p in paineis) + topo + 16 + 20 * len(legenda)
    fol = Image.new("RGB", (larg, alt), (40, 40, 40))
    df = ImageDraw.Draw(fol)
    x = 16
    for (titulo, im), linhas in zip(paineis, titulos):
        for k, linha in enumerate(linhas):
            df.text((x, 5 + 20 * k), linha, font=rot, fill=(235, 235, 235))
        fol.paste(im, (x, topo))
        x += im.width + 16
    y = topo + max(p[1].height for p in paineis) + 8
    for linha in legenda:
        df.text((16, y), linha, font=rot, fill=(240, 170, 80))
        y += 20
    buf = io.BytesIO()
    fol.save(buf, format="JPEG", quality=qualidade)
    return buf.getvalue()


# ---------------------------------------------------------------------------------------------
# Comparação

def compara(img, caminho):
    """('igual' | 'falta' | 'tamanho' | 'diferente', detalhe). Abre as duas em RGB."""
    import numpy as np
    if not os.path.isfile(caminho):
        return "falta", caminho
    with Image.open(caminho) as o:
        outra = o.convert("RGB")
    if outra.size != img.size:
        return "tamanho", "%dx%d contra %dx%d" % (img.width, img.height, outra.width, outra.height)
    a, b = np.asarray(img), np.asarray(outra)
    if np.array_equal(a, b):
        return "igual", None
    dif = np.abs(a.astype(int) - b.astype(int))
    return "diferente", "%d pixels diferentes, diferença máxima %d" % (int((dif.max(axis=2) > 0).sum()), int(dif.max()))


# ---------------------------------------------------------------------------------------------
# Gravação

def _norm(p):
    return os.path.normcase(os.path.realpath(os.path.abspath(p))).replace("\\", "/").rstrip("/")


def confere_saida(pasta):
    """Recusa a saída em GP/, em RM/public-guia/ e em qualquer caminho protegido da seção 13."""
    alvo = _norm(pasta)
    for rot, base in PROTEGIDAS_SAIDA:
        b = _norm(base)
        if alvo == b or alvo.startswith(b + "/"):
            raise escrita.EscritaRecusada("recusado: a saída %s fica em %s (só leitura; as telas de lá são hardlink)"
                                          % (pasta, rot))
    motivo = escrita.protegido_motivo(os.path.join(pasta, "tela.png"))
    if motivo:
        raise escrita.EscritaRecusada("recusado: a saída %s é caminho protegido (%s; DESENHO.md seção 13)" % (pasta, motivo))


def _ja_igual(caminho, dados):
    if os.path.isfile(caminho) and os.path.getsize(caminho) == len(dados):
        with open(caminho, "rb") as f:
            return f.read() == dados
    return False


def grava_se_mudou(caminho, dados, forca=False):
    """Grava pelo escrita.py; se o arquivo já tem exatamente esses bytes, não mexe (preserva hardlink)."""
    if _ja_igual(caminho, dados):
        return "igual, mantido"
    escrita.grava_bytes(caminho, dados, forca=forca, cria_pasta=True)
    return "gravado"


def monta_receitas(entradas, saida, qa=False, anota=False, comparas=(), forca=False, grava=True, publico=None):
    """Monta todas as receitas. Devolve {telas: [...], regioes: {...}, falhas: n, receitas: [...]}.

    Monta e confere tudo antes de gravar o primeiro arquivo: receita com erro não deixa saída pela
    metade. grava=False só monta e compara (nada vai pro disco); é o que o testa_guia.py usa.
    publico: o fatos.publico da cena; fora do "ME" (MEI, todos ou vazio), só captura com servePecaMei true
    (confere_catalogo)."""
    receitas = junta_receitas(entradas)
    for rec in receitas:
        rec["catalogo"] = confere_catalogo(rec, publico)  # antes de montar: receita recusada não grava nada
    if grava:
        confere_saida(saida)
    resultado = {"telas": [], "regioes": {}, "falhas": 0}
    finais, por_receita, arquivos = [], [], []
    for rec in receitas:
        if rec["historico"]:
            print("nota: %s é receita histórica (conjunto %s); não testável contra as montadas atuais"
                  % (rec["nome"], rec["conjunto"]))
        fonte, montada, final = monta(rec)
        regs = regioes_da_receita(rec, final.size)
        dados = png_bytes(final)
        item = {"receita": rec["nome"], "saida": rec["saida"], "conjunto": rec["conjunto"],
                "fonte": rec["fonte_arquivo"], "tamanho": list(final.size), "bytes": len(dados),
                "md5": hashlib.md5(dados).hexdigest(), "regioes": list(regs), "comparacoes": [],
                "catalogo": rec.get("catalogo")}
        if grava:
            arquivos.append((item, os.path.join(saida, rec["saida"]), dados))
            if anota:
                nome_anota = os.path.splitext(rec["saida"])[0] + ".anota.jpg"
                arquivos.append((None, os.path.join(saida, nome_anota), folha_anotada(rec, fonte, montada, final, regs)))
        for pasta in comparas:
            estado, det = compara(final, os.path.join(pasta, rec["saida"]))
            item["comparacoes"].append({"pasta": pasta, "estado": estado, "detalhe": det})
            if estado != "igual":
                resultado["falhas"] += 1
        resultado["telas"].append(item)
        finais.append(final)
        por_receita.append((rec, regs))
    resultado["regioes"] = junta_regioes(por_receita)
    resultado["receitas"] = receitas
    if not grava:
        return resultado
    texto = json.dumps(resultado["regioes"], ensure_ascii=False, indent=2) + "\n"
    arquivos.append(("regioes", os.path.join(saida, "regioes.json"), texto.encode("utf-8")))
    if qa:
        arquivos.append(("qa", os.path.join(saida, "qa.jpg"), folha_qa(finais)))
    # antes de gravar o primeiro: nenhum destino que mudou pode ser hardlink (sem --forca)
    for _, caminho, dados in arquivos:
        if not forca and os.path.isfile(caminho) and os.stat(caminho).st_nlink > 1 and not _ja_igual(caminho, dados):
            raise escrita.EscritaRecusada("recusado: %s é hardlink (st_nlink %d) e o conteúdo mudou; nada foi gravado "
                                          "(com --forca troca só a entrada desta pasta; religue o outro nome depois)"
                                          % (caminho, os.stat(caminho).st_nlink))
    for dono, caminho, dados in arquivos:
        estado = grava_se_mudou(caminho, dados, forca)
        if isinstance(dono, dict):
            dono["gravacao"] = estado
        elif dono == "regioes":
            resultado["regioesGravacao"] = estado
        elif dono == "qa":
            resultado["qaGravacao"] = estado
    return resultado


def _main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(prog="monta.py", description="Telas do app por receita JSON (K04).")
    ap.add_argument("receitas", nargs="+", help="receitas .json ou pastas de receitas")
    ap.add_argument("--saida", required=True, help="pasta das PNG, do regioes.json e do qa.jpg")
    ap.add_argument("--qa", action="store_true", help="grava <saida>/qa.jpg (tira em 1/3)")
    ap.add_argument("--anota", action="store_true", help="grava <saida>/<tela>.anota.jpg")
    ap.add_argument("--compara", action="append", default=[], help="pasta com PNG de mesmo nome pra conferir")
    ap.add_argument("--forca", action="store_true", help="grava por cima de hardlink (só com ordem explícita)")
    ap.add_argument("--publico", choices=("ME", "MEI", "todos", "ambos", "vazio"),
                    help="fatos.publico da cena (vazio: a cena não declarou): fora do ME, só captura com servePecaMei "
                         "true (F063 por padrão)")
    a = ap.parse_args(argv)
    saida = os.path.abspath(a.saida)
    try:
        res = monta_receitas(a.receitas, saida, qa=a.qa, anota=a.anota, comparas=a.compara, forca=a.forca,
                             publico=a.publico)
    except (ErroReceita, escrita.EscritaRecusada, escrita.DiscoInsuficiente) as e:
        print("erro: %s" % e)
        return 2
    for t in res["telas"]:
        print("%-24s %-24s %4dx%-4d %7d B  md5 %s  %s" % (t["receita"], t["saida"], t["tamanho"][0], t["tamanho"][1],
                                                         t["bytes"], t["md5"], t.get("gravacao", "")))
        for c in t["comparacoes"]:
            print("    %-9s contra %s%s" % (c["estado"], c["pasta"], (" (" + c["detalhe"] + ")") if c["detalhe"] else ""))
    print("regioes.json: %d regiões (%s), %s" % (len(res["regioes"]), ", ".join(res["regioes"]), res.get("regioesGravacao")))
    if a.qa:
        print("qa.jpg: %s" % res.get("qaGravacao"))
    if _avisos:
        print("%d aviso(s)" % len(_avisos))
    if res["falhas"]:
        print("FALHOU: %d comparação(ões) diferente(s) ou faltando" % res["falhas"])
        return 1
    print("ok: %d tela(s) em %s" % (len(res["telas"]), saida))
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
