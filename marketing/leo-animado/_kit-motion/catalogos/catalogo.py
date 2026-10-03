"""Carregador dos catálogos do kit de motion do Legalizaí (pacote K01). Contrato: KIT/DESENHO.md, seções 1.6, 4.9 e 4.13.

Camadas, por tipo (trilhas, efeitos, modelos, telas, biblioteca2d, assets), na pasta KIT/catalogos/<tipo>/:
  1. base.json                  inventário (itens)
  2. aquisicoes-*.json          itens novos, em ordem alfabética do nome do arquivo (id repetido é erro)
  3. verificacoes.json, revisao-*.json (ordem alfabética) e provas.json
                                sobreposições {versao, camada, itens: {id: {campos}}}: mescla profunda só em itens
                                que já existem; as listas 'verificacao' e 'usos' são concatenadas.
biblioteca2d e assets são do K14: enquanto o base.json não existir, o catálogo vem vazio com aviso.

Uso na linha de comando (sempre com python -B):
  python -B catalogo.py exporta [--tipos trilhas,efeitos,modelos,telas] [--saida <arquivo>]
  python -B catalogo.py lista <tipo> [--status <s>] [--tipo <tipo do item>] [--categoria <c>] [--clima <c>]
  python -B catalogo.py mostra <id>
  python -B catalogo.py creditos <id> [<id> ...]
  python -B catalogo.py materiais <id>        (os nomes de material de um GLB, pra cores e materiais da cena)
  python -B catalogo.py referencia <peca> [--arquivo <json>] [--json]

Importável:
  carrega(tipo) -> {"tipo", "itens", "camadas", "avisos", "erros"}
  indice(tipo) -> {id: item};  acha(id) -> (tipo, item);  marca() -> dict
  creditos(ids) -> texto de legenda (regra da seção 4.9) ou None;  creditos_trechos(ids) -> [trechos]
  confere_referencia(peca, arquivo=None) -> {"peca", "arquivo", "ok", "itens", "avisos"}
  MARCAS_CREDITO, MARCAS, marca_em(texto): as marcas que nunca vão pro crédito da legenda (lista única do kit; pega
    também marca colada a número, hífen ou outra palavra: "iPhone15", "Apple-Watch", "AppleWatch", "CasioF91W")
  CONCORRENTES_NOMES, CONCORRENTES, CONCORRENTES_AMBIGUOS: nomes de concorrente (PROIBIDO P27; lista interna de QA)
  cc_by(nome), licenca_restrita(nome) -> 'NC' | 'ND' | None, licenca_sa(nome), cita_epidemic(item): leitura da
    licença ("CC Attribution" e "Atribuição" também são CC BY; NC e ND só no reprovado; SA é decisão do Pedro; a
    Epidemic pela fonte, url, licença, autor e arquivo, em todo tipo de item)
  decisao(item) -> (decisaoRisco estruturada ou None, problema);  decisao_vale(d, peca);  resumo_decisao(d)
  por_que_nao_vale(d, peca): o motivo, quando a decisão não vale pra peça (decisão de agente ou '*' em peça nova)
  confere_trilha(item, peca) -> (erros, avisos): a regra de trilha da peça (a mesma do montaProps e do mixa.py)
  origem_tela(arquivo, conjunto=None) -> (item do catálogo de telas ou None, via): a captura de origem de uma tela
  entra_no_render(item, peca=None) -> ('sim' | 'com aviso' | 'não', motivo): se o modelo entra numa peça (a regra do
    montaProps mais o que o render precisa); PUBLIC_FIXOS e PUBLIC_BIBLIOTECA: onde os GLB ficam no public-kit
"""
import argparse
import copy
import glob
import json
import os
import re
import sys

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(AQUI)
if os.path.join(KIT, "lib") not in sys.path:
    sys.path.insert(0, os.path.join(KIT, "lib"))
import escrita  # noqa: E402

TIPOS = ("trilhas", "efeitos", "modelos", "telas", "biblioteca2d", "assets")
TIPOS_K14 = ("biblioteca2d", "assets")
CONCATENA = ("verificacao", "usos")
STATUS = ("liberado", "aceito-com-risco", "sem-verificacao", "reprovado")
# CC BY: a sigla ("CC BY 4.0", "CC-BY") e o nome por extenso ("CC Attribution 4.0", o rótulo do Sketchfab; "Creative
# Commons Attribution"; "CC Atribuição"). "Atribuição" sozinha não conta: a licença do Pixabay diz "atribuição não é
# necessária".
CC_BY = re.compile(r"(?i)\bCC[\s-]?BY\b|\b(?:CC|creative[\s-]+commons)[\s-]+(?:attribution|atribui[cç][aã]o)\b")
DATA_ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")
# a peça da regressão (o reel de 14/10, já aprovado pelo Pedro); toda outra pasta é "peça nova" (o mesmo PECA_GUIA do
# nucleo/props.ts)
PECA_GUIA = "guia-pronta-2026-10-14"

# fatos.publico da cena (F063 por padrão, rodada 4, 03/10): "ME", "MEI" ou "todos" ("ambos" é o nome antigo de
# "todos"). Só "ME" afrouxa a trava do valor da guia: "MEI", "todos" e vazio são conferidos como MEI, a regra mais
# restrita (vazio também é erro: o público é obrigatório).
PUBLICOS = ("ME", "MEI", "todos", "ambos")


def publico_estrito(publico):
    """A peça é conferida como MEI (F063: nenhum valor de guia aparece): todo público que não é 'ME', vazio incluído."""
    return publico != "ME"


def rotulo_publico(publico):
    """Como o público aparece nas mensagens ('vazio' quando não foi declarado)."""
    return "vazio" if publico in (None, "") else str(publico)

# Marcas que nunca vão pro crédito da legenda (licenca.creditoLegenda de modelo e de asset). Lista única do kit: o
# valida.py, o confere.py, o gera_fontes.py e o montaProps (pelo "exporta", em regras.marcasCredito) usam esta.
# A fonte do crédito (Sketchfab, Poly Pizza, Khronos glTF Sample Assets) não é marca de produto e fica fora.
MARCAS_CREDITO = (
    "apple watch", "watch ultra", "apple", "iphone", "ipad", "macbook", "airpods", "mudmaster", "g-shock", "casio",
    "samsung", "galaxy", "nubank", "itaú", "itau", "bradesco", "banco do brasil", "pix", "google", "pixel", "android",
    "microsoft", "amazon", "kindle", "facebook", "instagram", "whatsapp", "youtube", "tiktok", "leica", "canon",
    "nikon", "sony", "fujifilm", "kodak", "polaroid", "gopro", "garmin", "nokia", "rolex", "swatch", "xiaomi",
    "motorola", "huawei", "mastercard", "visa", "santander", "post-it", "moleskine", "bic", "faber-castell",
    "coca-cola",
)


def _sem_acento(s):
    import unicodedata
    s = unicodedata.normalize("NFKD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c)).casefold()


def _padrao_marca(m):
    """'apple watch' casa 'apple watch', 'apple-watch' e 'applewatch'; 'post-it' casa 'post it', 'post-it' e 'postit'."""
    partes = [re.escape(p) for p in re.split(r"[\s-]+", _sem_acento(m)) if p]
    return r"[\s_-]?".join(partes)


# Sobre o texto sem acento e em minúscula. A borda é só de letra: dígito, hífen e sublinhado não protegem a marca
# ("iphone15", "iphone-15", "apple-watch", "g-shock_2"). Com acento, "itaú" e "itau" viram a mesma.
MARCAS = re.compile(r"(?<![a-z])(" + "|".join(_padrao_marca(m) for m in sorted(MARCAS_CREDITO, key=len, reverse=True))
                    + r")(?![a-z])")
_CAMEL = re.compile(r"(?<=[a-z0-9])(?=[A-Z])")

# Concorrentes (PROIBIDO P27; a lista do _memoria/preferencias.md, regra 2, mais a que o valida.py já usava). "agilize"
# e "facilite" também são verbo: na trava de fatos viram aviso, não erro.
CONCORRENTES_NOMES = ("contabilizei", "contabilizou", "agilize", "conube", "contabilivre", "qipu", "omie", "nibo",
                      "conta azul", "contaazul", "maismei", "contaja", "facilite", "marvee", "nubank")
CONCORRENTES_AMBIGUOS = ("agilize", "facilite")
CONCORRENTES = re.compile(r"(?i)\b(" + "|".join(re.escape(c) for c in CONCORRENTES_NOMES) + r")\b")


def marca_em(texto):
    """A primeira marca de MARCAS_CREDITO no texto (sem acento, em minúscula), ou None. Confere o texto como está e
    com as palavras coladas separadas pela maiúscula ("AppleWatch" vira "Apple Watch"; "CasioF91W", "Casio F91W"), pra
    pegar marca colada a número, hífen ou outra palavra."""
    texto = texto or ""
    for t in (texto, _CAMEL.sub(" ", texto)):
        m = MARCAS.search(_sem_acento(t))
        if m:
            return m.group(0)
    return None


# ---------- licença (a leitura que o valida.py, o confere.py e o montaProps usam) ----------
def _nome_licenca(lic):
    if isinstance(lic, dict):
        return str(lic.get("nome") or "")
    return str(lic or "")


def cc_by(nome):
    """A licença pede crédito CC BY ("CC BY", "CC-BY", "CC Attribution", "Creative Commons Attribution", "CC
    Atribuição")."""
    return bool(CC_BY.search(_nome_licenca(nome)))


def _fichas_licenca(nome):
    return re.findall(r"[a-z0-9]+", _sem_acento(_nome_licenca(nome)))


def licenca_restrita(nome):
    """'NC' (não comercial) ou 'ND' (sem derivações) quando a licença é CC com essas cláusulas, ou None. Nenhuma das
    duas serve conteúdo de marca: só no reprovado."""
    n = _sem_acento(_nome_licenca(nome))
    f = _fichas_licenca(nome)
    cc = "cc" in f or "creative commons" in n or cc_by(nome)
    if re.search(r"non[\s-]?commercial|nao[\s-]?comercial|\bby[\s-]nc\b", n) or (cc and "nc" in f):
        return "NC"
    if re.search(r"no[\s-]?deriv|sem[\s-]?deriva|\bby[\s-]nd\b", n) or (cc and "nd" in f):
        return "ND"
    return None


def licenca_sa(nome):
    """A licença é CC com compartilhamento pela mesma licença (SA, ShareAlike, CompartilhaIgual): decisão do Pedro."""
    n = _sem_acento(_nome_licenca(nome))
    f = _fichas_licenca(nome)
    cc = "cc" in f or "creative commons" in n or cc_by(nome)
    return bool(re.search(r"share[\s-]?alike|compartilha[\s-]?igual", n) or (cc and "sa" in f))


CAMPOS_EPIDEMIC = ("fonte", "url", "arquivo", "autor", "origem", "obtidoDe")


def cita_epidemic(it):
    """O item vem da Epidemic Sound pela fonte, pela url, pela licença (nome e url), pelo autor ou pelo arquivo, em
    qualquer tipo de item (não só pelo id 'epidemic-' das trilhas)."""
    it = it or {}
    textos = [str(it.get(k) or "") for k in CAMPOS_EPIDEMIC] + [str(it.get("id") or "")]
    lic = it.get("licenca")
    if isinstance(lic, dict):
        textos += [str(lic.get(k) or "") for k in ("nome", "url", "fonte", "credito")]
    else:
        textos.append(str(lic or ""))
    return any("epidemic" in t.casefold() for t in textos)


# ---------- decisão de risco (status aceito-com-risco, em qualquer tipo de item) ----------
# decisaoRisco = {quem, quando (AAAA-MM-DD), pecas [nomes de pasta de peça, ou "*"], texto, fonte?}; com o Pedro ainda
# sem decidir: {quem, quando null, pecas [], texto, pergunta, pendente: true} (o item fica fora do padrão).
# Quem libera peça nova (toda pasta que não é a do guia) é o Pedro, com a peça escrita pelo nome: decisão de agente
# (quem não é o Pedro) e "*" não valem pra peça nova (rodada 4, 03/10). Na peça do guia valem as decisões que já
# estavam registradas. Pedro liberando pra toda peça: o item vira "liberado", com a decisão dele em verificacao.
QUEM_DECIDE = re.compile(r"(?i)^\s*pedro\b")


def quem_decide(d):
    """A decisão é do Pedro (o campo quem começa com 'Pedro')."""
    return bool(d) and bool(QUEM_DECIDE.match(str(d.get("quem") or "")))

def decisao(it):
    """(decisão estruturada, None) ou (None, problema) pro decisaoRisco do item."""
    d = (it or {}).get("decisaoRisco")
    if d is None:
        return None, "sem decisaoRisco"
    if isinstance(d, str):
        return None, "decisaoRisco em texto livre (formato antigo); precisa ser {quem, quando, pecas, texto}"
    if not isinstance(d, dict):
        return None, "decisaoRisco inválida (%s)" % type(d).__name__
    faltam = [k for k in ("quem", "texto") if not (isinstance(d.get(k), str) and d[k].strip())]
    pecas = d.get("pecas")
    if not isinstance(pecas, list) or not all(isinstance(p, str) and p.strip() for p in pecas):
        faltam.append("pecas (lista de peças, '*' pra qualquer uma)")
    if d.get("pendente") is True:
        if not (isinstance(d.get("pergunta"), str) and d["pergunta"].strip()):
            faltam.append("pergunta (o que o Pedro precisa decidir)")
    else:
        if not (isinstance(d.get("quando"), str) and DATA_ISO.match(d["quando"])):
            faltam.append("quando (AAAA-MM-DD)")
        if isinstance(pecas, list) and not pecas:
            faltam.append("pecas (pelo menos uma; '*' pra qualquer peça)")
    if faltam:
        return None, "decisaoRisco incompleta: falta %s" % ", ".join(faltam)
    return d, None


def peca_de_teste(peca):
    """Peça de teste (nome da PASTA começando com '_'): o entregar recusa ela na pasta final de verdade."""
    return isinstance(peca, str) and peca.startswith("_")


def decisao_vale(d, peca):
    """A decisão libera o item na peça (o nome da PASTA, nunca o campo "peca" da cena). Na peça do guia, a decisão
    registrada vale pela lista (ou "*"). Em peça nova, só a decisão do Pedro com a peça escrita pelo nome: decisão de
    agente e "*" não valem."""
    if not d or d.get("pendente") is True or not isinstance(peca, str) or not peca:
        return False
    pecas = d.get("pecas") or []
    if peca == PECA_GUIA:
        return "*" in pecas or peca in pecas
    return quem_decide(d) and peca in pecas


def por_que_nao_vale(d, peca):
    """O motivo de a decisão não valer pra peça (texto curto pras mensagens), ou None quando vale."""
    if decisao_vale(d, peca):
        return None
    if not d:
        return "sem decisão"
    if d.get("pendente") is True:
        return "decisão do Pedro pendente"
    pecas = d.get("pecas") or []
    if peca in pecas and not quem_decide(d):
        return "a decisão é de agente (%s), não do Pedro: provisória, não vale pra peça nova" % d.get("quem")
    if "*" in pecas:
        return ("a decisão vale com '*' (%s): '*' não vale pra peça nova; só o Pedro, com a peça escrita pelo nome"
                % ("do Pedro" if quem_decide(d) else "de agente, provisória"))
    return "a peça %s não está na lista da decisão" % peca


def data_br(iso):
    return "%s/%s/%s" % (iso[8:10], iso[5:7], iso[0:4]) if isinstance(iso, str) and DATA_ISO.match(iso) else str(iso)


def resumo_decisao(d):
    """Uma linha com quem, quando, o que e onde vale (ou a pergunta pendente)."""
    if d.get("pendente") is True:
        return "decisão de %s pendente: %s" % (d["quem"], d.get("pergunta") or d["texto"])
    # '*' só vale na peça do guia (em peça nova, só a decisão do Pedro com a peça escrita: rodada 4)
    alcance = ", ".join(p if p != "*" else "'*' (só na peça do guia)" for p in d["pecas"])
    return "%s, %s: %s (vale em %s)" % (d["quem"], data_br(d["quando"]), d["texto"].rstrip(". "), alcance)


def origem_tela(arquivo, conjunto=None, idx=None):
    """(item do catálogo de telas, via) da tela de uma peça, com o mesmo critério do montaProps: pela receita (arquivo
    'pecas/<peça>/telas/<png>': a receita da peça com essa saída diz o conjunto e a captura) ou, sem receita, pelo nome
    do arquivo (as 4 montadas do guia e capturas usadas direto). (None, motivo) quando não acha."""
    idx = idx if idx is not None else indice("telas")
    arquivo = str(arquivo or "")
    m = re.match(r"^pecas/([^/]+)/telas/([^/]+)$", arquivo)
    if m:
        pasta = os.path.join(KIT, "pecas", m.group(1), "telas", "receitas")
        if os.path.isdir(pasta):
            for n in sorted(os.listdir(pasta)):
                if not n.lower().endswith(".json") or n.startswith("_"):
                    continue
                try:
                    r = _le_json(os.path.join(pasta, n))
                except (OSError, ValueError):
                    continue
                f = r.get("fonte") if isinstance(r, dict) else None
                if isinstance(f, dict) and r.get("saida") == m.group(2):
                    for it in idx.values():
                        if (it.get("tipo") == "captura" and it.get("conjunto") == f.get("conjunto")
                                and os.path.basename(str(it.get("arquivo") or "")) == f.get("arquivo")):
                            return it, "receita %s" % n
                    return None, "receita %s: a captura %s/%s não está no catálogo" % (n, f.get("conjunto"),
                                                                                       f.get("arquivo"))
    nome = os.path.basename(arquivo)
    achados = [it for it in idx.values() if os.path.basename(str(it.get("arquivo") or it.get("caminho") or "")) == nome]
    do_conjunto = [it for it in achados if conjunto and it.get("conjunto") == conjunto]
    if len(do_conjunto) == 1:
        return do_conjunto[0], "nome do arquivo"
    if len(achados) == 1:
        return achados[0], "nome do arquivo"
    return None, ("nome do arquivo ambíguo (%d itens no catálogo)" % len(achados)) if achados else \
        "sem receita e sem item com esse nome de arquivo"


# caminho de tela no public-kit: telas/<png> (as 4 montadas do guia) ou pecas/<peça>/telas/<png> (as da receita)
RX_CAMINHO_TELA = re.compile(r"^(?:pecas/[^/]+/)?telas/[^/]+$")


def srcs_de_camada(c, saida=None, caminho=""):
    """[(chave, src)] de toda string em campo 'src' de uma camada (a imagem e o selo da abertura; aninhado também)."""
    saida = [] if saida is None else saida
    if isinstance(c, dict):
        for k, v in c.items():
            if k == "src" and isinstance(v, str) and v.strip():
                saida.append(((caminho + "." + k).lstrip("."), v.strip()))
            else:
                srcs_de_camada(v, saida, caminho + "." + str(k))
    elif isinstance(c, list):
        for i, v in enumerate(c):
            srcs_de_camada(v, saida, "%s[%d]" % (caminho, i))
    return saida


def origem_src(src, idx=None):
    """(item do catálogo de telas ou None, via, é tela) da imagem de uma camada 2D. É tela quando o caminho é de tela
    (telas/<png> ou pecas/<peça>/telas/<png>) ou quando o nome do arquivo está no catálogo de telas; aí vale a mesma
    regra da tela do aparelho (origem achada, captura não reprovada e, em peça de MEI, servePecaMei)."""
    idx = idx if idx is not None else indice("telas")
    s = str(src or "").replace("\\", "/").lstrip("./")
    it, via = origem_tela(s, None, idx)
    eh_tela = it is not None or bool(RX_CAMINHO_TELA.match(s))
    return it, via, eh_tela


# ---------- modelo no render (frente MODELOS NO RENDER, 03/10) ----------
# GLB fixo do public-kit (hardlink permanente do public-guia) e a pasta dos GLB ligados por peça (kit.py modelos)
PUBLIC_FIXOS = ("3d/iphone.glb", "3d/watch.glb")
PUBLIC_BIBLIOTECA = "3d/biblioteca"
# tipos de objeto feitos em código (núcleo e extensões): não precisam de arquivo no public-kit. "argila" e
# "palco-argila" são da extensão comum (os objetos de argila do carrossel de 05/10 e o palco de argila, 03/10)
TIPOS_SEM_ARQUIVO = ("folha", "pilula", "comprovante", "calendario-clay", "argila", "palco-argila")


def entra_no_render(item, peca=None):
    """('sim' | 'com aviso' | 'não', motivo): se o modelo entra numa peça, pela mesma regra do montaProps (status,
    decisaoRisco e notaLicenca) mais o que o render precisa (bloco render; GLB com render.publicKit). Com a peça, o
    aceito-com-risco cuja decisão vale pra ela dá 'sim'."""
    it = item or {}
    tipo, st = it.get("tipo"), it.get("status")
    r = it.get("render") if isinstance(it.get("render"), dict) else None
    if tipo == "blend":
        return "não", "arquivo .blend: o three.js não carrega (a versão pro kit, quando existe, é um GLB próprio)"
    if st == "reprovado":
        return "não", "reprovado"
    if not r or not r.get("tipoObjeto"):
        return "não", "sem bloco render (cena inteira ou objeto sem ligação ao render)"
    if tipo == "glb" and not r.get("publicKit"):
        return "não", "GLB sem render.publicKit (o render não acha o arquivo)"
    if tipo == "procedural" and r.get("tipoObjeto") not in TIPOS_SEM_ARQUIVO:
        return "não", "procedural de tipo %s sem fábrica conhecida" % r.get("tipoObjeto")
    d, prob = decisao(it)
    restrita = licenca_restrita(it.get("licenca"))
    if restrita:
        return "não", "licença %s (%s): não serve conteúdo de marca" % (restrita, _nome_licenca(it.get("licenca")))
    if cita_epidemic(it):
        return "não", "Epidemic Sound: reprovado em tudo (plano gratuito do Pedro)"
    if st == "aceito-com-risco":
        if d is None:
            return "não", "aceito com risco sem decisaoRisco estruturada (%s)" % prob
        if d.get("pendente") is True:
            return "não", "fora do padrão até o Pedro decidir: %s" % (d.get("pergunta") or d.get("texto"))
        if peca and decisao_vale(d, peca):
            return "sim", "aceito com risco; vale pela decisão de %s" % resumo_decisao(d)
        if peca:
            return "com aviso", "aceito com risco: %s (%s); confirmar com o Pedro antes de postar" % (
                resumo_decisao(d), por_que_nao_vale(d, peca))
        return "com aviso", "aceito com risco: %s; em peça nova vale só a decisão do Pedro com a peça escrita: " \
                            "confirmar com o Pedro antes de postar" % resumo_decisao(d)
    if it.get("notaLicenca") and (d is None or d.get("pendente") is True):
        return "não", "nota de licença sem decisão registrada: %s" % it["notaLicenca"]
    if st == "sem-verificacao":
        return "com aviso", "licença sem verificação: conferir antes de postar"
    if st == "liberado":
        return "sim", "liberado"
    return "não", "status fora do enum: %r" % st


def confere_trilha(item, peca):
    """(erros, avisos) da trilha de uma peça. peca é o nome da PASTA da peça (nunca o campo "peca" da cena: copiar a
    cena de outra peça não leva a decisão dela). Só entra trilha (não prévia) liberada, ou aceito-com-risco com a
    decisaoRisco do catálogo valendo pra peça (decisao_vale: em peça nova, só a do Pedro com a peça escrita). Sem
    verificação nunca entra. Peça de teste (pasta com '_') passa com aviso quando existe decisão registrada pra outra
    peça: o entregar recusa peça de teste na pasta final."""
    erros, avisos = [], []
    tid = str((item or {}).get("id"))
    st = (item or {}).get("status")
    tipo = (item or {}).get("tipo") or "trilha"
    epidemic = tid.startswith("epidemic-") or cita_epidemic(item)
    restrita = licenca_restrita((item or {}).get("licenca"))
    if tipo != "trilha":
        erros.append("%s é %s, não trilha: prévia de audição tem a narração da peça de 14/10 e nunca vai como trilha "
                     "de cena" % (tid, "prévia de audição" if tipo == "previa" else tipo))
    if st == "reprovado" or epidemic:
        erros.append("trilha reprovada: %s%s" % (tid, " (Epidemic: plano gratuito do Pedro, não cobre conteúdo de "
                                                     "marca)" if epidemic else ""))
    elif restrita:
        erros.append("trilha %s com licença %s (%s): não serve conteúdo de marca" % (
            tid, restrita, _nome_licenca((item or {}).get("licenca"))))
    elif st == "sem-verificacao":
        erros.append("trilha %s está \"sem-verificacao\": sem os 2 recortes limpos na AudD a trilha não entra (texto "
                     "em trilha.decisaoRisco da cena não libera)" % tid)
    elif st == "aceito-com-risco":
        d, prob = decisao(item)
        if d is None:
            erros.append("trilha %s está \"aceito-com-risco\" e o catálogo não tem decisaoRisco estruturada (%s)"
                         % (tid, prob))
        elif d.get("pendente") is True:
            erros.append("trilha %s fora do padrão: %s" % (tid, resumo_decisao(d)))
        elif decisao_vale(d, peca):
            avisos.append("trilha %s está \"aceito-com-risco\": vale pela decisão de %s" % (tid, resumo_decisao(d)))
        elif peca_de_teste(peca):
            avisos.append("trilha %s está \"aceito-com-risco\" e a decisão (%s) não cobre a peça %s: passa só por ser "
                          "peça de teste, que o entregar recusa na pasta final" % (tid, resumo_decisao(d), peca))
        else:
            erros.append("trilha %s está \"aceito-com-risco\" e a decisão do catálogo (%s) não vale pra peça %s (%s): "
                         "só com decisão nova do Pedro, com a peça escrita pelo nome, registrada no catálogo "
                         "(decisaoRisco numa sobreposição revisao-*.json de catalogos/trilhas/); texto em "
                         "trilha.decisaoRisco da cena não basta"
                         % (tid, resumo_decisao(d), peca, por_que_nao_vale(d, peca) or "a decisão não é do Pedro"))
    elif st != "liberado":
        erros.append("trilha %s com status fora do enum: %r" % (tid, st))
    return erros, avisos


class ErroCatalogo(Exception):
    """Catálogo inconsistente (id repetido, sobreposição de id inexistente, JSON inválido)."""


def _le_json(caminho):
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def mescla(base, sobre):
    """Mescla profunda: dicionários campo a campo; 'verificacao' e 'usos' concatenadas; o resto é trocado."""
    out = copy.deepcopy(base)
    for k, v in sobre.items():
        if k in CONCATENA and isinstance(v, list):
            out[k] = list(out.get(k) or []) + copy.deepcopy(v)
        elif isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = mescla(out[k], v)
        else:
            out[k] = copy.deepcopy(v)
    return out


def arquivos_camadas(tipo):
    """Caminhos das camadas de um tipo, na ordem de aplicação: (base, [aquisições], [sobreposições])."""
    pasta = os.path.join(AQUI, tipo)
    base = os.path.join(pasta, "base.json")
    aquis = sorted(glob.glob(os.path.join(pasta, "aquisicoes-*.json")))
    sobre = [os.path.join(pasta, "verificacoes.json")] + sorted(glob.glob(os.path.join(pasta, "revisao-*.json"))) + \
        [os.path.join(pasta, "provas.json")]
    return base, aquis, [s for s in sobre if os.path.isfile(s)]


def _itens_da_camada(doc):
    itens = doc.get("itens")
    if isinstance(itens, dict):
        return [dict(v, id=k) for k, v in itens.items()]
    return itens if isinstance(itens, list) else None


def carrega(tipo, estrito=True):
    """Junta as camadas de um tipo. Com estrito=True levanta ErroCatalogo se houver erro."""
    if tipo not in TIPOS:
        raise ErroCatalogo("tipo desconhecido: %s (tipos: %s)" % (tipo, ", ".join(TIPOS)))
    res = {"tipo": tipo, "itens": [], "camadas": [], "avisos": [], "erros": []}
    base, aquis, sobres = arquivos_camadas(tipo)
    if not os.path.isfile(base):
        if tipo in TIPOS_K14:
            res["avisos"].append("%s: base.json ausente (pacote K14 ainda não rodou): catálogo vazio" % tipo)
        else:
            res["erros"].append("%s: base.json ausente" % tipo)
        if estrito and res["erros"]:
            raise ErroCatalogo("\n".join(res["erros"]))
        return res
    porid, ordem, origem = {}, [], {}
    for caminho in [base] + aquis:
        try:
            doc = _le_json(caminho)
        except (OSError, ValueError) as e:
            res["erros"].append("%s: não deu pra ler o JSON (%s)" % (caminho, e))
            continue
        itens = _itens_da_camada(doc)
        if itens is None:
            res["erros"].append("%s: falta a lista 'itens'" % caminho)
            continue
        for it in itens:
            i = it.get("id") if isinstance(it, dict) else None
            if not i:
                res["erros"].append("%s: item sem id" % caminho)
                continue
            if i in porid:
                res["erros"].append("%s: id repetido entre camadas: %s (já está em %s)" % (tipo, i, origem[i]))
                continue
            porid[i] = copy.deepcopy(it)
            ordem.append(i)
            origem[i] = os.path.basename(caminho)
        res["camadas"].append({"arquivo": caminho, "camada": doc.get("camada"), "itens": len(itens)})
    for caminho in sobres:
        try:
            doc = _le_json(caminho)
        except (OSError, ValueError) as e:
            res["erros"].append("%s: não deu pra ler o JSON (%s)" % (caminho, e))
            continue
        itens = doc.get("itens")
        if not isinstance(itens, dict):
            res["erros"].append("%s: a sobreposição precisa de 'itens' como {id: {campos}}" % caminho)
            continue
        for i, campos in itens.items():
            if i not in porid:
                res["erros"].append("%s: sobreposição de id inexistente: %s" % (caminho, i))
                continue
            if not isinstance(campos, dict):
                res["erros"].append("%s: os campos de %s não são um objeto" % (caminho, i))
                continue
            if "id" in campos and campos["id"] != i:
                res["erros"].append("%s: a sobreposição não pode trocar o id de %s" % (caminho, i))
                continue
            porid[i] = mescla(porid[i], campos)
        res["camadas"].append({"arquivo": caminho, "camada": doc.get("camada"), "itens": len(itens),
                               "sobreposicao": True})
    res["itens"] = [porid[i] for i in ordem]
    if estrito and res["erros"]:
        raise ErroCatalogo("\n".join(res["erros"]))
    return res


def indice(tipo):
    return {it["id"]: it for it in carrega(tipo)["itens"]}


def acha(i):
    """(tipo, item) do id em qualquer catálogo, ou (None, None)."""
    for tipo in TIPOS:
        for it in carrega(tipo)["itens"]:
            if it["id"] == i:
                return tipo, it
    return None, None


def marca():
    return _le_json(os.path.join(AQUI, "marca.json"))


def _junta(trechos):
    if len(trechos) == 1:
        return trechos[0]
    return ", ".join(trechos[:-1]) + " e " + trechos[-1]


def _grupos_credito(ids, idx=None):
    idx = idx if idx is not None else indice("modelos")
    grupos = []
    for i in ids:
        it = idx.get(i)
        if it is None:
            raise ErroCatalogo("id desconhecido no catálogo de modelos: %s" % i)
        lic = it.get("licenca") or {}
        cl = lic.get("creditoLegenda")
        if not cl:
            if CC_BY.search(lic.get("nome") or ""):
                d, _p = decisao(it)
                if d and d.get("pendente") is True:
                    raise ErroCatalogo("%s: fora do padrão, sem crédito de legenda possível (%s)" % (i, resumo_decisao(d)))
                raise ErroCatalogo("%s: licença CC BY sem licenca.creditoLegenda" % i)
            continue
        achou = marca_em(" ".join(str(cl.get(k) or "") for k in ("trecho", "fonte", "licenca")))
        if achou:
            raise ErroCatalogo("%s: licenca.creditoLegenda cita marca (%s); o crédito da legenda nunca cita marca" % (i, achou))
        chave = (cl["fonte"], cl["licenca"])
        g = next((g for g in grupos if g[0] == chave), None)
        if g is None:
            g = (chave, [])
            grupos.append(g)
        if cl["trecho"] not in g[1]:
            g[1].append(cl["trecho"])
    return grupos


def creditos_trechos(ids, idx=None):
    """Trechos de licenca.creditoLegenda dos modelos citados, na ordem, sem repetição."""
    return [t for _chave, ts in _grupos_credito(ids, idx) for t in ts]


def creditos(ids, idx=None):
    """Texto de legenda pela regra da seção 4.9, só com licenca.creditoLegenda (nunca licenca.credito)."""
    grupos = _grupos_credito(ids, idx)
    if not grupos:
        return None
    total = sum(len(ts) for _c, ts in grupos)
    partes = ["%s (%s, %s)" % (_junta(ts), f, lic) for (f, lic), ts in grupos]
    return "Modelos 3D: " + "; ".join(partes) + (", modificado" if total == 1 else ", modificados")


def confere_referencia(peca, arquivo=None):
    """Confere o registro congelado (seção 4.13): tamanho e md5 iguais; st_ino diferente com o mesmo md5 vira aviso;
    st_nlink não conta; as cópias de _referencia/ são conferidas pelo md5."""
    caminho = arquivo or os.path.join(KIT, "pecas", peca, "_referencia.json")
    ref = _le_json(caminho)
    pasta = os.path.dirname(os.path.abspath(caminho))
    itens, avisos, ok = [], [], True
    for a in ref.get("arquivos", []):
        r = {"id": a["id"], "caminho": a["caminho"], "estado": "igual", "detalhes": []}
        p = a["caminho"]
        if not os.path.isfile(p):
            r["estado"] = "ausente"
            r["detalhes"].append("o arquivo não existe")
        else:
            st = os.stat(p)
            h = escrita.md5(p)
            r["st_nlink"] = st.st_nlink
            if st.st_size != a["tamanho"]:
                r["estado"] = "mudou"
                r["detalhes"].append("tamanho %d, registrado %d" % (st.st_size, a["tamanho"]))
            if h != a["md5"]:
                r["estado"] = "mudou"
                r["detalhes"].append("md5 %s, registrado %s" % (h, a["md5"]))
            if r["estado"] == "igual" and a.get("st_ino") is not None and st.st_ino != a["st_ino"]:
                r["estado"] = "regravado-mesmo-conteudo"
                msg = "%s: regravado com o mesmo conteúdo (st_ino %d, registrado %d)" % (a["id"], st.st_ino,
                                                                                         a["st_ino"])
                r["detalhes"].append(msg)
                avisos.append(msg)
        if a.get("copia"):
            cp = os.path.join(pasta, a["copia"])
            if not os.path.isfile(cp):
                r["estado"] = "mudou"
                r["detalhes"].append("a cópia %s não existe" % a["copia"])
            else:
                hc = escrita.md5(cp)
                igual = hc == a["md5"] and os.path.getsize(cp) == a["tamanho"]
                r["copia"] = {"caminho": cp, "md5": hc, "igual": igual}
                if not igual:
                    r["estado"] = "mudou"
                    r["detalhes"].append("a cópia %s difere do registro (md5 %s)" % (a["copia"], hc))
        if r["estado"] in ("mudou", "ausente"):
            ok = False
        itens.append(r)
    return {"peca": peca, "arquivo": caminho, "ok": ok, "itens": itens, "avisos": avisos}


def exporta(tipos=None, com_marca=True):
    tipos = tipos or list(TIPOS)
    out = {"versao": 1, "gerador": "KIT/catalogos/catalogo.py exporta", "tipos": {},
           "regras": {"marcasCredito": list(MARCAS_CREDITO), "concorrentes": list(CONCORRENTES_NOMES)}}
    for t in tipos:
        r = carrega(t)
        out["tipos"][t] = {"itens": r["itens"], "camadas": [c["arquivo"] for c in r["camadas"]],
                           "avisos": r["avisos"]}
    if com_marca:
        out["marca"] = marca()
    return out


# Linha de comando

def _escreve(texto):
    sys.stdout.write(texto)
    if not texto.endswith("\n"):
        sys.stdout.write("\n")


def _cmd_exporta(a):
    tipos = [t.strip() for t in a.tipos.split(",") if t.strip()] if a.tipos else None
    for t in tipos or []:
        if t not in TIPOS:
            raise ErroCatalogo("tipo desconhecido: %s" % t)
    obj = exporta(tipos, com_marca=not a.sem_marca)
    if a.saida:
        escrita.grava_json(a.saida, obj, cria_pasta=True)
        print("gravado: %s" % a.saida, file=sys.stderr)
    else:
        _escreve(json.dumps(obj, ensure_ascii=False, indent=2))
    return 0


def _cmd_lista(a):
    r = carrega(a.tipo)
    n = 0
    for it in r["itens"]:
        if a.status and it.get("status") != a.status:
            continue
        if a.tipo_item and (it.get("tipo") or "") != a.tipo_item:
            continue
        cat = it.get("categoria") or it.get("tipo")
        if a.categoria and (cat or "").casefold() != a.categoria.casefold():
            continue
        if a.clima and a.clima.casefold() not in [c.casefold() for c in it.get("clima") or []]:
            continue
        nome = it.get("titulo") or it.get("nome") or it.get("tipoInventario") or it.get("estilo") or ""
        print("%-44s %-17s %-14s %s" % (it["id"], it.get("status", ""), cat or "", nome))
        n += 1
    for av in r["avisos"]:
        print("aviso: " + av, file=sys.stderr)
    print("%d itens" % n, file=sys.stderr)
    return 0


def _cmd_mostra(a):
    tipo, it = acha(a.id)
    if it is None:
        print("id não encontrado em nenhum catálogo: %s" % a.id, file=sys.stderr)
        return 1
    _escreve(json.dumps({"catalogo": tipo, "item": it}, ensure_ascii=False, indent=2))
    return 0


def materiais_glb(caminho):
    """[(material, cor base sRGB ou None, tem textura)] de um GLB, pelo chunk JSON (sem carregar a malha)."""
    import struct
    with open(caminho, "rb") as f:
        cab = f.read(20)
        n = struct.unpack_from("<I", cab, 12)[0]
        doc = json.loads(f.read(n).decode("utf-8"))
    out = []
    for m in doc.get("materials", []):
        pbr = m.get("pbrMetallicRoughness") or {}
        bc = pbr.get("baseColorFactor")
        cor = None
        if bc:
            lin = [max(0.0, min(1.0, float(v))) for v in bc[:3]]
            srgb = [12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055 for v in lin]
            cor = "#%02X%02X%02X" % tuple(int(round(v * 255)) for v in srgb)
        out.append((m.get("name"), cor, "baseColorTexture" in pbr))
    return out


def _cmd_materiais(a):
    tipo, it = acha(a.id)
    if it is None or tipo != "modelos" or it.get("tipo") != "glb":
        print("não é um GLB do catálogo de modelos: %s" % a.id, file=sys.stderr)
        return 1
    r = it.get("render") if isinstance(it.get("render"), dict) else {}
    cores, ajustes = r.get("cores") or {}, r.get("materiais") or {}
    print("materiais de %s (%s):" % (a.id, it["arquivo"]))
    for nome, cor, tex in materiais_glb(it["arquivo"]):
        extra = []
        if nome in cores:
            extra.append("cores do catálogo: %s" % cores[nome])
        if nome in ajustes:
            extra.append("materiais do catálogo: %s" % json.dumps(ajustes[nome], ensure_ascii=False))
        print("  %-28s cor %-8s %s%s" % (repr(nome), cor or "-", "com textura" if tex else "sem textura",
                                        ("; " + "; ".join(extra)) if extra else ""))
    return 0


def _cmd_creditos(a):
    texto = creditos(a.ids)
    if texto is None:
        print("nenhum dos itens pede crédito na legenda", file=sys.stderr)
        return 0
    _escreve(texto)
    return 0


def _cmd_referencia(a):
    r = confere_referencia(a.peca, a.arquivo)
    if a.json:
        _escreve(json.dumps(r, ensure_ascii=False, indent=2))
    else:
        for it in r["itens"]:
            rotulo = {"igual": "igual", "regravado-mesmo-conteudo": "AVISO", "mudou": "MUDOU",
                      "ausente": "AUSENTE"}[it["estado"]]
            extra = (" (" + "; ".join(it["detalhes"]) + ")") if it["detalhes"] else ""
            cop = " + cópia igual" if it.get("copia", {}).get("igual") else ""
            print("%-8s %-18s %s%s%s" % (rotulo, it["id"], it["caminho"], cop, extra))
        print("referência %s: %s" % (a.peca, "nada mudou" if r["ok"] else "MUDOU (ver acima)"))
    return 0 if r["ok"] else 1


def main(argv=None):
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    p = argparse.ArgumentParser(prog="catalogo.py", description="Catálogos do kit de motion (camadas mescladas).")
    sub = p.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("exporta", help="JSON mesclado no stdout, com a marca junto")
    e.add_argument("--tipos", help="lista separada por vírgula (padrão: todos)")
    e.add_argument("--saida", help="grava num arquivo (pelo escrita.py) em vez do stdout")
    e.add_argument("--sem-marca", action="store_true")
    li = sub.add_parser("lista", help="lista os itens de um tipo")
    li.add_argument("tipo", choices=TIPOS)
    li.add_argument("--status", choices=STATUS)
    li.add_argument("--tipo", dest="tipo_item", help="só o tipo do item (ex.: trilha, sem as prévias de audição)")
    li.add_argument("--categoria")
    li.add_argument("--clima")
    m = sub.add_parser("mostra", help="mostra um item mesclado")
    m.add_argument("id")
    mt = sub.add_parser("materiais", help="nomes de material de um GLB (pra cores e materiais da cena)")
    mt.add_argument("id")
    c = sub.add_parser("creditos", help="texto de legenda dos modelos (licenca.creditoLegenda)")
    c.add_argument("ids", nargs="+")
    r = sub.add_parser("referencia", help="confere o registro congelado da peça (_referencia.json)")
    r.add_argument("peca")
    r.add_argument("--arquivo", help="outro _referencia.json")
    r.add_argument("--json", action="store_true")
    a = p.parse_args(argv)
    try:
        return {"exporta": _cmd_exporta, "lista": _cmd_lista, "mostra": _cmd_mostra, "creditos": _cmd_creditos,
                "referencia": _cmd_referencia, "materiais": _cmd_materiais}[a.cmd](a)
    except ErroCatalogo as err:
        print("erro de catálogo: %s" % err, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
