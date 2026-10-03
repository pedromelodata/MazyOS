"""Validador dos catálogos do kit de motion do Legalizaí (pacote K01). Contrato: KIT/DESENHO.md, seções 4.9 e 4.13.

Valida o catálogo mesclado (catalogo.py) contra os esquemas de catalogos/esquemas/ e confere:
- cada camada contra o esquema (base e aquisições pelo esquema do tipo; sobreposições por $defs/sobreposicao);
- arquivos citados existem, com tamanho e md5 iguais aos do catálogo;
- ids únicos entre camadas e entre catálogos; status no enum;
- todo item que vem da Epidemic (pelo id, pela fonte, pela url, pela licença, pelo autor ou pelo arquivo, em qualquer
  tipo de item) reprovado; trilha liberada com pelo menos um registro de verificação;
- licença NC (não comercial) ou ND (sem derivações) só no reprovado; licença SA (compartilha igual) fora do reprovado
  vira aviso até ter decisão do Pedro;
- todo item aceito-com-risco, de qualquer tipo, com decisaoRisco estruturada {quem, quando, pecas, texto} (ou
  {quem, pecas [], texto, pergunta, pendente: true} enquanto o Pedro não decide); decisão pendente só em item
  aceito-com-risco; peça citada em decisaoRisco.pecas que não existe em KIT/pecas vira aviso; decisão de agente ou
  com '*' vira aviso (não vale pra peça nova: só a do Pedro com a peça escrita);
- licença CC BY ("CC BY", "CC Attribution", "Creative Commons Attribution", "CC Atribuição") com
  licenca.creditoLegenda, sem marca (catalogo.marca_em, com a lista catalogo.MARCAS_CREDITO: Apple, iPhone, Google,
  Casio, Samsung, Nubank, Pix, GoPro, Post-it e as outras, também coladas a número ou hífen); CC BY sem
  creditoLegenda só com decisão pendente (o item fica fora do padrão); modelo com notaLicenca só com decisaoRisco;
- caixa em todo GLB; prévia com o status da trilha de origem; duplicata com o mesmo md5 do item principal;
- bloco render dos modelos (frente MODELOS NO RENDER, 03/10): render.publicKit fixo (3d/iphone.glb, 3d/watch.glb) ou
  3d/biblioteca/<id>.glb; pivo; cores e materiais com nomes que existem no GLB e campos válidos; sHeroi; a folha da
  prova de render existe; GLB fora do reprovado sem render.publicKit vira aviso;
- zero travessão, meia-risca e os outros traços longos (U+2012, U+2013, U+2014, U+2015, U+2212, U+2E3A, U+2E3B,
  U+FE31, U+FE32, U+FE58) nos arquivos de catalogos/ e lib/, inclusive citações;
- 'Legalizai' sem acento só em id, caminho, URL ou citação (objeto com citacao: true, como o notaApp);
- notaApp sem emoji e sem nome de concorrente (catalogo.CONCORRENTES);
- módulo e função de cada sintetizado (pela árvore do Python, sem importar); o KIT/audio/sfx_kit.py ausente (K05)
  é aviso até existir;
- marca.json contra o esquema, com o LINK DA BIO padrão em #DD4E27;
- pecas/*/_referencia.json contra o esquema referencia; pecas/*/cenas*.json contra o esquema cenas (aviso, ou
  erro com --cenas-estrito).

Uso: python -B valida.py [--rapido] [--cenas-estrito] [--json]
Sai com código 1 se houver erro; os avisos são impressos sempre.
"""
import argparse
import ast
import glob
import json
import os
import re
import sys

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(AQUI)
for p in (AQUI, os.path.join(KIT, "lib")):
    if p not in sys.path:
        sys.path.insert(0, p)
import catalogo  # noqa: E402
import escrita  # noqa: E402
from jsonschema import Draft202012Validator  # noqa: E402

ESQUEMAS = os.path.join(AQUI, "esquemas")
SFX_KIT = os.path.join(KIT, "audio", "sfx_kit.py")
MARCAS = catalogo.MARCAS  # lista única do kit (catalogo.MARCAS_CREDITO)
CONCORRENTES = catalogo.CONCORRENTES  # lista única do kit (catalogo.CONCORRENTES_NOMES)
# travessão, meia-risca e os outros traços longos (o sinal de menos lê como meia-risca)
TRACOS = ((0x2012, "traço numérico (U+2012)"), (0x2013, "meia-risca (U+2013)"), (0x2014, "travessão (U+2014)"),
          (0x2015, "barra horizontal (U+2015)"), (0x2212, "sinal de menos (U+2212)"), (0x2E3A, "travessão duplo (U+2E3A)"),
          (0x2E3B, "travessão triplo (U+2E3B)"), (0xFE31, "travessão vertical (U+FE31)"),
          (0xFE32, "meia-risca vertical (U+FE32)"), (0xFE58, "travessão pequeno (U+FE58)"))
EMOJI = re.compile("[%s-%s%s-%s%s-%s%s%s%s]" % tuple(chr(c) for c in (0x1F000, 0x1FAFF, 0x2600, 0x27BF, 0x2B00, 0x2BFF, 0xFE0F, 0x200D, 0x20E3)))
LEGALIZAI = re.compile(r"(?i)legalizai")
CHAVES_CAMINHO = {"id", "arquivo", "caminho", "url", "urlArquivo", "urlSemMarca", "receita", "modulo", "publicKit",
                  "previaDe", "duplicataDe", "origem", "fonteMontagem", "hardlinks", "outrosArquivos", "manifesto",
                  "pasta", "arquivoFinal", "caminhoInventario", "obtidoDe", "base", "acesa", "logoBase", "logoAcesa",
                  "sobre", "paginas404", "fontes", "desenho", "pecas", "peca"}
SEPARA = " \t\n'\"()[]{},;"


class Relato:
    def __init__(self):
        self.erros, self.avisos, self.info = [], [], []

    def erro(self, msg):
        self.erros.append(msg)

    def aviso(self, msg):
        self.avisos.append(msg)


_MD5 = {}


def _md5(p):
    st = os.stat(p)
    k = (os.path.abspath(p), st.st_size, st.st_mtime_ns)
    if k not in _MD5:
        _MD5[k] = escrita.md5(p)
    return _MD5[k]


def _le(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def _validador(esquema, defn=None):
    if defn is None:
        return Draft202012Validator(esquema)
    return Draft202012Validator({"$schema": esquema.get("$schema"), "$defs": esquema.get("$defs", {}),
                                 "$ref": "#/$defs/" + defn})


def _erros_esquema(validador, obj, rotulo, limite=15):
    out = []
    for e in sorted(validador.iter_errors(obj), key=lambda e: [str(x) for x in e.absolute_path]):
        caminho = "/".join(str(x) for x in e.absolute_path)
        out.append("%s: %s: %s" % (rotulo, caminho or "(raiz)", e.message[:240]))
        if len(out) >= limite:
            out.append("%s: (mais erros de esquema omitidos)" % rotulo)
            break
    return out


def carrega_esquemas(rel):
    esq = {}
    for p in sorted(glob.glob(os.path.join(ESQUEMAS, "*.schema.json"))):
        nome = os.path.basename(p)[:-len(".schema.json")]
        try:
            s = _le(p)
            Draft202012Validator.check_schema(s)
            esq[nome] = s
        except Exception as e:  # noqa: BLE001
            rel.erro("esquema %s inválido: %s" % (p, e))
    for nome in ("trilhas", "efeitos", "modelos", "telas", "marca", "cenas", "biblioteca2d", "assets", "referencia"):
        if nome not in esq:
            rel.erro("falta o esquema %s.schema.json" % nome)
    return esq


def _token_caminho(s, a, b):
    antes = s[a - 1] if a > 0 else " "
    depois = s[b] if b < len(s) else " "
    if depois == chr(0x301):
        return True  # 'Legalizaí' decomposto
    if antes in "-_./\\" or depois in "-_./\\" or antes.isalnum() or depois.isalnum():
        return True
    ini = max(s.rfind(c, 0, a) for c in SEPARA) + 1
    fins = [k for k in (s.find(c, b) for c in SEPARA) if k >= 0]
    tok = s[ini:min(fins) if fins else len(s)]
    return "/" in tok or "\\" in tok


def confere_legalizai(rel, rotulo, obj, caminho="", em_citacao=False, chave=None):
    if isinstance(obj, dict):
        cit = em_citacao or obj.get("citacao") is True
        for k, v in obj.items():
            confere_legalizai(rel, rotulo, v, caminho + "/" + str(k), cit, k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            confere_legalizai(rel, rotulo, v, caminho + "/" + str(i), em_citacao, chave)
    elif isinstance(obj, str):
        if em_citacao or chave in CHAVES_CAMINHO or (chave or "").endswith(("Id", "Url")):
            return
        for m in LEGALIZAI.finditer(obj):
            if _token_caminho(obj, m.start(), m.end()):
                continue
            trecho = obj[max(0, m.start() - 30):m.end() + 30].replace("\n", " ")
            rel.erro("%s%s: 'Legalizai' sem acento fora de id, caminho, URL ou citação: ...%s..." % (rotulo, caminho,
                                                                                                   trecho))


def confere_tracos(rel):
    pastas = [AQUI, os.path.join(KIT, "lib")]
    n = 0
    for pasta in pastas:
        for p in glob.glob(os.path.join(pasta, "**", "*"), recursive=True):
            if not os.path.isfile(p) or os.path.splitext(p)[1].lower() not in (".json", ".md", ".py", ".txt"):
                continue
            if "__pycache__" in p.replace("\\", "/").split("/"):
                rel.erro("pasta __pycache__ criada: %s (rode sempre com python -B)" % os.path.dirname(p))
                continue
            try:
                texto = open(p, encoding="utf-8").read()
            except (OSError, UnicodeDecodeError) as e:
                rel.erro("%s: não deu pra ler como UTF-8 (%s)" % (p, e))
                continue
            n += 1
            for cod, nome in TRACOS:
                ch = chr(cod)
                k = texto.count(ch)
                if k:
                    i = texto.find(ch)
                    rel.erro("%s: %d %s, o primeiro em: ...%s..." % (p, k, nome, texto[max(0, i - 40):i + 40]))
    rel.info.append("travessão, meia-risca e os outros traços longos conferidos em %d arquivos de catalogos/ e lib/" % n)


def _funcoes(modulo, cache={}):  # noqa: B006
    if modulo not in cache:
        arvore = ast.parse(open(modulo, encoding="utf-8").read(), modulo)
        fs = {}
        for no in arvore.body:
            if isinstance(no, ast.FunctionDef):
                nomes = [a.arg for a in no.args.posonlyargs + no.args.args]
                pads = []
                for d in no.args.defaults:
                    try:
                        pads.append(ast.literal_eval(d))
                    except ValueError:
                        pads.append("?")
                fs[no.name] = (nomes, [None] * (len(nomes) - len(pads)) + pads)
        cache[modulo] = fs
    return cache[modulo]


def _mesmo(a, b):
    return os.path.normcase(os.path.abspath(a)) == os.path.normcase(os.path.abspath(b))


def confere_sintetizados(rel, itens):
    for it in itens:
        if it.get("tipo") != "sintetizado":
            continue
        s = it.get("sintese") or {}
        mod, fn = s.get("modulo"), s.get("funcao")
        rot = "efeitos/%s" % it["id"]
        if not mod or not os.path.isfile(mod):
            if mod and _mesmo(mod, SFX_KIT):
                rel.aviso("%s: módulo ausente %s (o K05 ainda não entregou o sfx_kit.py)" % (rot, mod))
            else:
                rel.erro("%s: módulo do sintetizado não existe: %s" % (rot, mod))
            continue
        try:
            fs = _funcoes(mod)
        except SyntaxError as e:
            rel.erro("%s: não deu pra ler o módulo %s (%s)" % (rot, mod, e))
            continue
        if fn not in fs:
            rel.erro("%s: a função %s não existe em %s" % (rot, fn, mod))
            continue
        nomes, pads = fs[fn]
        args, padrao = s.get("args"), s.get("argsPadrao")
        if args is None:
            rel.aviso("%s: argumentos não declarados no catálogo (a função %s existe em %s)" % (rot, fn, mod))
            continue
        if nomes[:len(args)] != list(args):
            rel.erro("%s: argumentos %s não batem com a função %s%s" % (rot, args, fn, tuple(nomes)))
        elif padrao is not None and list(padrao) != pads[:len(args)]:
            rel.erro("%s: argsPadrao %s não batem com os padrões da função (%s)" % (rot, padrao, pads[:len(args)]))


def confere_arquivos(rel, tipo, itens, rapido):
    for it in itens:
        rot = "%s/%s" % (tipo, it["id"])
        arq = it.get("arquivo")
        if isinstance(arq, str):
            if not os.path.exists(arq):
                rel.erro("%s: o arquivo não existe: %s" % (rot, arq))
            elif os.path.isfile(arq):
                if isinstance(it.get("tamanho"), int) and os.path.getsize(arq) != it["tamanho"]:
                    rel.erro("%s: tamanho %d no disco, %d no catálogo" % (rot, os.path.getsize(arq), it["tamanho"]))
                if it.get("md5") and not rapido and _md5(arq) != it["md5"]:
                    rel.erro("%s: md5 %s no disco, %s no catálogo" % (rot, _md5(arq), it["md5"]))
        for chave in ("hardlinks", "outrosArquivos"):
            for p in it.get(chave) or []:
                if not os.path.exists(p):
                    rel.aviso("%s: %s não existe: %s" % (rot, chave, p))
        rec = it.get("receita")
        if isinstance(rec, str) and not os.path.exists(rec):
            rel.aviso("%s: a receita ainda não existe: %s (K04)" % (rot, rec))


def confere_regras(rel, cats, esq):
    tr = cats.get("trilhas", {}).get("itens", [])
    por_tr = {t["id"]: t for t in tr}
    for t in tr:
        rot = "trilhas/%s" % t["id"]
        if t.get("status") == "liberado" and not t.get("verificacao"):
            rel.erro("%s: trilha liberada sem registro de verificação" % rot)
        if t.get("tipo") == "previa":
            o = por_tr.get(t.get("previaDe"))
            if o is None:
                rel.erro("%s: previaDe aponta pra trilha inexistente: %s" % (rot, t.get("previaDe")))
            elif o.get("status") != t.get("status"):
                rel.erro("%s: a prévia tem de ter o status da trilha de origem (%s)" % (rot, o.get("status")))
        ids_pontos = [p["id"] for p in t.get("pontos") or []]
        for j in t.get("janelas") or []:
            if j.get("ponto") and j["ponto"] not in ids_pontos:
                rel.erro("%s: a janela %s aponta pra ponto inexistente %s" % (rot, j.get("nome"), j["ponto"]))
    ef = cats.get("efeitos", {}).get("itens", [])
    por_ef = {e["id"]: e for e in ef}
    for e in ef:
        d = e.get("duplicataDe")
        if d:
            o = por_ef.get(d)
            if o is None:
                rel.erro("efeitos/%s: duplicataDe aponta pra item inexistente %s" % (e["id"], d))
            elif o.get("md5") != e.get("md5"):
                rel.erro("efeitos/%s: duplicata com md5 diferente do item principal %s" % (e["id"], d))
    confere_sintetizados(rel, ef)
    # Epidemic pela fonte (não só pelo id nem só pela licença) e licença NC, ND ou SA, em todo tipo de item
    for tipo, cat in cats.items():
        for e in cat.get("itens", []):
            rot = "%s/%s" % (tipo, e.get("id"))
            if catalogo.cita_epidemic(e) and e.get("status") != "reprovado":
                rel.erro("%s: a licença cita a Epidemic (fonte, url, licença, autor ou arquivo) e o status é %r: Epidemic "
                         "é reprovado em tudo (plano gratuito do Pedro, decisão de 02/10)" % (rot, e.get("status")))
            lic = e.get("licenca")
            restrita = catalogo.licenca_restrita(lic)
            if restrita and e.get("status") != "reprovado":
                rel.erro("%s: licença %s (%s) e o status é %r: não comercial ou sem derivações não serve conteúdo de "
                         "marca, fica reprovado" % (rot, restrita, catalogo._nome_licenca(lic), e.get("status")))
            elif catalogo.licenca_sa(lic) and e.get("status") != "reprovado":
                d, _p = catalogo.decisao(e)
                if not (d and catalogo.quem_decide(d) and d.get("pendente") is not True):
                    rel.aviso("%s: licença SA (%s), compartilha pela mesma licença: decisão do Pedro antes de usar"
                              % (rot, catalogo._nome_licenca(lic)))
    for tipo in ("modelos", "assets"):
        for m in cats.get(tipo, {}).get("itens", []):
            rot = "%s/%s" % (tipo, m["id"])
            lic = m.get("licenca") or {}
            if not isinstance(lic, dict):
                lic = {"nome": str(lic)}
            cl = lic.get("creditoLegenda")
            if catalogo.cc_by(lic):
                if not isinstance(cl, dict) or not all(cl.get(k) for k in ("trecho", "fonte", "licenca")):
                    d, _p = catalogo.decisao(m)
                    if d and d.get("pendente") is True and m.get("status") == "aceito-com-risco":
                        rel.aviso("%s: CC BY sem crédito de legenda possível sem marca: fora do padrão até o Pedro "
                                  "decidir (%s)" % (rot, catalogo.resumo_decisao(d)))
                    else:
                        rel.erro("%s: licença CC BY sem licenca.creditoLegenda {trecho, fonte, licenca}" % rot)
            if m.get("notaLicenca") and catalogo.decisao(m)[0] is None:
                rel.erro("%s: notaLicenca sem decisaoRisco registrada (quem decide, quando e em que peça vale, ou a "
                         "pergunta pendente pro Pedro)" % rot)
            if isinstance(cl, dict):
                for k in ("trecho", "fonte", "licenca"):
                    achou = catalogo.marca_em(cl.get(k) or "")
                    if achou:
                        rel.erro("%s: creditoLegenda.%s cita marca (%s)" % (rot, k, achou))
            if tipo == "modelos" and m.get("tipo") == "glb":
                cx = m.get("caixa")
                if not (isinstance(cx, dict) and all(isinstance(cx.get(k), list) and len(cx[k]) == 3
                                                     for k in ("min", "max", "tamanho"))):
                    rel.erro("%s: GLB sem caixa {min, max, tamanho}" % rot)
    for t in cats.get("telas", {}).get("itens", []):
        na = t.get("notaApp")
        if isinstance(na, dict):
            texto = na.get("texto") or ""
            if EMOJI.search(texto):
                rel.erro("telas/%s: notaApp com emoji" % t["id"])
            if CONCORRENTES.search(texto):
                rel.erro("telas/%s: notaApp cita concorrente pelo nome" % t["id"])
    pecas_kit = {os.path.basename(p) for p in glob.glob(os.path.join(KIT, "pecas", "*")) if os.path.isdir(p)}
    provisorias = {}
    for cat in cats.values():
        for it in cat.get("itens", []):
            rot = "%s/%s" % (cat["tipo"], it.get("id"))
            if it.get("status") not in catalogo.STATUS:
                rel.erro("%s: status fora do enum: %r" % (rot, it.get("status")))
            d, prob = catalogo.decisao(it)
            if it.get("status") == "aceito-com-risco":
                if d is None:
                    rel.erro("%s: aceito-com-risco sem decisaoRisco estruturada (%s)" % (rot, prob))
            elif d is not None and d.get("pendente") is True:
                rel.erro("%s: decisão pendente do Pedro num item %r (a pendência só existe em aceito-com-risco)"
                         % (rot, it.get("status")))
            if d is not None:
                for p in d["pecas"]:
                    if p != "*" and p not in pecas_kit:
                        rel.aviso("%s: decisaoRisco.pecas cita a peça %s, que não existe em KIT/pecas" % (rot, p))
                if it.get("status") == "aceito-com-risco" and d.get("pendente") is not True and (
                        "*" in d["pecas"] or not catalogo.quem_decide(d)):
                    chave = (d.get("quem"), "*" in d["pecas"])
                    provisorias.setdefault(chave, []).append(rot)
    for (quem, estrela), rots in sorted(provisorias.items(), key=lambda x: str(x[0])):
        rel.aviso("%d decisão(ões) de risco %s%s (%s): não valem pra peça nova, só na peça do guia; em peça nova o kit "
                  "avisa pra confirmar com o Pedro (trilha, recusa). Exemplos: %s" % (
                      len(rots), "de agente" if not catalogo.QUEM_DECIDE.match(str(quem or "")) else "do Pedro",
                      " com '*'" if estrela else "", quem, ", ".join(rots[:4]) + (" e outras" if len(rots) > 4 else "")))


HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
CAMPOS_MATERIAL = {"cor": "cor", "rugosidade": "numero", "metalico": "numero", "envMap": "numero", "opacidade": "numero",
                   "transparente": "bool", "transmissao": "numero", "semMapa": "bool", "semLuz": "bool",
                   "emissivo": "cor", "intensidadeEmissiva": "numero", "dupla": "bool", "normaisSuaves": "bool",
                   "matiz": "matiz"}
_MATS_GLB = {}


def _materiais_glb(caminho):
    """Os nomes de material do GLB (pelo chunk JSON), com cache."""
    if caminho not in _MATS_GLB:
        import struct
        try:
            with open(caminho, "rb") as f:
                cab = f.read(20)
                n = struct.unpack_from("<I", cab, 12)[0]
                doc = json.loads(f.read(n).decode("utf-8"))
            _MATS_GLB[caminho] = {m.get("name") for m in doc.get("materials", [])}
        except (OSError, ValueError, struct.error):
            _MATS_GLB[caminho] = None
    return _MATS_GLB[caminho]


def confere_render_modelos(rel, itens):
    """Bloco render dos modelos (frente MODELOS NO RENDER, 03/10): o caminho no public-kit (fixo ou 3d/biblioteca/<id>.glb),
    o pivô, as cores e os materiais (nomes que existem no GLB, campos e valores) e o sHeroi; GLB que poderia entrar e
    não tem render.publicKit vira aviso; a folha da prova de render tem de existir."""
    sem_render = []
    for m in itens:
        r = m.get("render") if isinstance(m.get("render"), dict) else None
        rot = "modelos/%s" % m["id"]
        if m.get("tipo") == "glb" and m.get("status") != "reprovado" and not (r and r.get("publicKit")):
            sem_render.append(m["id"])
        if not r:
            continue
        pk = r.get("publicKit")
        if pk is not None:
            certo = "%s/%s.glb" % (catalogo.PUBLIC_BIBLIOTECA, m["id"])
            if pk not in catalogo.PUBLIC_FIXOS and pk != certo:
                rel.erro("%s: render.publicKit %r fora do padrão (fixo: %s; biblioteca: %s)"
                         % (rot, pk, ", ".join(catalogo.PUBLIC_FIXOS), certo))
            if m.get("tipo") != "glb":
                rel.erro("%s: render.publicKit em item que não é GLB" % rot)
        pv = r.get("pivo")
        if pv is not None and pv not in ("centro", "base", "origem") and not (
                isinstance(pv, list) and len(pv) == 3 and all(isinstance(v, (int, float)) for v in pv)):
            rel.erro("%s: render.pivo %r inválido (\"centro\", \"base\", \"origem\" ou [x, y, z] em metros)" % (rot, pv))
        sh = r.get("sHeroi")
        if sh is not None and not (isinstance(sh, (int, float)) and sh > 0):
            rel.erro("%s: render.sHeroi precisa ser número > 0" % rot)
        mats = _materiais_glb(m["arquivo"]) if m.get("tipo") == "glb" and isinstance(m.get("arquivo"), str) else None
        for nome, cor in (r.get("cores") or {}).items():
            if not (isinstance(cor, str) and HEX.match(cor)):
                rel.erro("%s: render.cores.%s precisa ser cor #RRGGBB" % (rot, nome))
            if mats is not None and nome not in mats:
                rel.erro("%s: render.cores cita o material %r, que não existe no GLB" % (rot, nome))
        for nome, aj in (r.get("materiais") or {}).items():
            if mats is not None and nome != "*" and nome not in mats:
                rel.erro("%s: render.materiais cita o material %r, que não existe no GLB" % (rot, nome))
            if not isinstance(aj, dict):
                rel.erro("%s: render.materiais.%s precisa ser objeto" % (rot, nome))
                continue
            for k, v in aj.items():
                tipo = CAMPOS_MATERIAL.get(k)
                ok = (tipo == "numero" and isinstance(v, (int, float)) and not isinstance(v, bool) and v >= 0) or \
                     (tipo == "cor" and isinstance(v, str) and HEX.match(v)) or (tipo == "bool" and isinstance(v, bool)) or \
                     (tipo == "matiz" and isinstance(v, list) and 0 < len(v) <= 4 and all(
                         isinstance(t, dict) and HEX.match(str(t.get("de"))) and HEX.match(str(t.get("para"))) for t in v))
                if not ok:
                    rel.erro("%s: render.materiais.%s.%s inválido (%r)" % (rot, nome, k, v))
        pr = m.get("provaRender")
        if isinstance(pr, dict) and pr.get("folha") and not os.path.isfile(pr["folha"]):
            rel.aviso("%s: a folha da prova de render não existe: %s" % (rot, pr["folha"]))
    if sem_render:
        rel.aviso("modelos: %d GLB sem render.publicKit (não entram numa peça): %s" % (len(sem_render),
                                                                                       ", ".join(sem_render)))


def confere_marca(rel, esq):
    p = os.path.join(AQUI, "marca.json")
    if not os.path.isfile(p):
        rel.erro("marca.json ausente")
        return
    m = _le(p)
    if "marca" in esq:
        rel.erros.extend(_erros_esquema(_validador(esq["marca"]), m, "marca.json"))
    cor = ((m.get("componentes") or {}).get("link") or {}).get("cor")
    if cor != "#DD4E27":
        rel.erro("marca.json: o LINK DA BIO padrão tem de ser #DD4E27 (coral-600), está %r" % cor)
    confere_legalizai(rel, "marca.json", m)
    p_sora = (m.get("fonte") or {}).get("arquivo")
    if p_sora and os.path.isfile(p_sora) and _md5(p_sora) != m["fonte"].get("md5"):
        rel.erro("marca.json: md5 da Sora não bate com o arquivo")


def confere_pecas(rel, esq, cenas_estrito):
    for p in sorted(glob.glob(os.path.join(KIT, "pecas", "*", "_referencia.json"))):
        if "referencia" in esq:
            rel.erros.extend(_erros_esquema(_validador(esq["referencia"]), _le(p), p))
    for p in sorted(glob.glob(os.path.join(KIT, "pecas", "*", "cenas*.json"))):
        if "cenas" not in esq:
            break
        if os.path.basename(os.path.dirname(p)) == "_modelo":
            rel.info.append("modelo de cena ignorado (tem campos pra preencher): %s" % p)
            continue
        try:
            doc = _le(p)
        except (OSError, ValueError) as e:
            (rel.erro if cenas_estrito else rel.aviso)("%s: JSON inválido (%s)" % (p, e))
            continue
        for msg in _erros_esquema(_validador(esq["cenas"]), doc, p):
            (rel.erro if cenas_estrito else rel.aviso)("cena fora do esquema: " + msg)


def valida(rapido=False, cenas_estrito=False):
    rel = Relato()
    esq = carrega_esquemas(rel)
    cats = {}
    vistos = {}
    for tipo in catalogo.TIPOS:
        r = catalogo.carrega(tipo, estrito=False)
        rel.erros.extend(r["erros"])
        rel.avisos.extend(r["avisos"])
        cats[tipo] = r
        e = esq.get(tipo)
        base, aquis, sobres = catalogo.arquivos_camadas(tipo)
        for p in [base] + aquis:
            if not os.path.isfile(p):
                continue
            try:
                doc = _le(p)
            except (OSError, ValueError):
                continue
            if e:
                rel.erros.extend(_erros_esquema(_validador(e), doc, os.path.relpath(p, AQUI)))
            confere_legalizai(rel, os.path.relpath(p, AQUI), doc)
        for p in sobres:
            try:
                doc = _le(p)
            except (OSError, ValueError):
                continue
            if e:
                rel.erros.extend(_erros_esquema(_validador(e, "sobreposicao"), doc, os.path.relpath(p, AQUI)))
            confere_legalizai(rel, os.path.relpath(p, AQUI), doc)
        if e and sobres:
            vi = _validador(e, "item")
            for it in r["itens"]:
                rel.erros.extend(_erros_esquema(vi, it, "%s/%s (mesclado)" % (tipo, it.get("id")), limite=5))
        for it in r["itens"]:
            i = it.get("id")
            if i in vistos and vistos[i] != tipo:
                rel.erro("id repetido entre catálogos: %s (%s e %s)" % (i, vistos[i], tipo))
            vistos.setdefault(i, tipo)
        confere_arquivos(rel, tipo, r["itens"], rapido)
        rel.info.append("%s: %d itens (%s)" % (tipo, len(r["itens"]),
                                                ", ".join(os.path.basename(c["arquivo"]) for c in r["camadas"])
                                                or "sem camadas"))
    confere_regras(rel, cats, esq)
    confere_render_modelos(rel, cats.get("modelos", {}).get("itens", []))
    confere_marca(rel, esq)
    confere_pecas(rel, esq, cenas_estrito)
    confere_tracos(rel)
    return rel


def main(argv=None):
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    p = argparse.ArgumentParser(prog="valida.py", description="Valida os catálogos do kit de motion.")
    p.add_argument("--rapido", action="store_true", help="confere só o tamanho dos arquivos (sem md5)")
    p.add_argument("--cenas-estrito", action="store_true", help="cena fora do esquema vira erro")
    p.add_argument("--json", action="store_true", help="saída em JSON")
    a = p.parse_args(argv)
    rel = valida(a.rapido, a.cenas_estrito)
    if a.json:
        print(json.dumps({"erros": rel.erros, "avisos": rel.avisos, "info": rel.info}, ensure_ascii=False, indent=2))
    else:
        print("valida.py: catálogos do kit de motion")
        for linha in rel.info:
            print("  " + linha)
        print("AVISOS (%d):" % len(rel.avisos))
        for linha in rel.avisos:
            print("  - " + linha)
        print("ERROS (%d):" % len(rel.erros))
        for linha in rel.erros:
            print("  - " + linha)
        print("resultado: %d erros, %d avisos" % (len(rel.erros), len(rel.avisos)))
    return 1 if rel.erros else 0


if __name__ == "__main__":
    sys.exit(main())
