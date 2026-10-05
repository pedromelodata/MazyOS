"""Script único de saída do kit de motion do Legalizaí (pacote K07). Contrato: KIT/DESENHO.md, seção 7 (e 2, 4.10).

Uso (sempre com python -B):
    PY -B KIT/scripts/kit.py <comando> [peça] [opções]

<peça> é o nome da pasta em KIT/pecas (ou um caminho absoluto). Opções comuns:
    --cena <arquivo>  usa outra cena da peça; as saídas ganham o sufixo do nome dela: cenas-kit.json grava
                      props-kit.json, eventos-kit.json, qc/quadros-kit.json, qc/legenda-kit.json, qc/fatos-kit.json,
                      audio/mix-kit.wav, saida/<peça>-kit-mudo.mp4, saida/<peça>-kit.mp4, saida/capa-kit.png...
                      (cenas.json não tem sufixo)
    --simula          mostra os comandos, na ordem, sem rodar nada
    --espera <min>    (render, stills, previa, capa, final) quanto esperar pela trava de render (padrão 40 min)

Trava de render (trava.py, 03/10): render e stills (também os da prévia, da capa e do final) rodam um por vez na
máquina, também entre sessões. Quem chega espera a vez e mostra quem está na frente; cada execução usa um Temp
próprio em <Temp>/kit-motion/ e apaga só ele no fim. O doutor mostra quem está renderizando; kit.py limpa <peça>
apaga só as sobras da peça.

Portões (portao.py, rodada 4): o render, a junção e a entrega exigem a trava de fatos ok das props de hoje; a entrega,
também o relatório do confere ok do mesmo mp4. Sem opção de ignorar; só peça de teste (pasta com '_') passa com
aviso. A peça é o nome da PASTA: cena ou props com "peca" de outra pasta são recusadas.

PY = C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe (PIL, numpy, cv2, jsonschema)
PYW = C:/Projects/Legalizei_Videos/marketing/filme/escalada/tools/.venv/Scripts/python.exe (faster-whisper; só voz-alinha
e a fala do confere). Toda escrita passa pelo KIT/lib/escrita.py (Python) ou RM/src/kit/lib/escrita.mjs (Node).
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import contextlib  # noqa: E402
import datetime  # noqa: E402
import glob  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
import re  # noqa: E402
import time  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
import kit_ext  # noqa: E402
import kit_modelos  # noqa: E402
import kit_stills  # noqa: E402
import limpa  # noqa: E402
import portao  # noqa: E402
import trava  # noqa: E402
import vigia  # noqa: E402
from comum import escrita  # noqa: E402

SCRIPTS = comum.KIT + "/scripts"
VOZ = comum.KIT + "/voz"
INICIO = time.time()


# ---------- ajudantes ----------
def py(script, *args):
    return [comum.PY, "-B", script if os.path.isabs(script) else SCRIPTS + "/" + script] + [str(a) for a in args]


def node(cli, *args):
    return [comum.NODE, comum.CLI + "/" + cli] + [str(a) for a in args]


def roda(cmd, a, cwd=None, texto=None):
    return comum.roda(cmd, cwd=cwd, simula=a.simula, texto=texto)


def etapa(nome):
    print("\n== %s ==" % nome, flush=True)


def peca_de(a, exige=True):
    return comum.Peca(a.peca, getattr(a, "cena", None), exige=exige)


def cena_args(p):
    return ["--cena", p.cena] if p.nome_cena != "cenas.json" else []


# ---------- comandos ----------
def c_doutor(a):
    args = []
    if a.referencia:
        args += ["--referencia", a.referencia]
    if a.rapido:
        args.append("--rapido")
    return roda(py("ambiente.py", *args), a)


RX_NOME_PECA = re.compile(r"^_?(\d{4}-\d{2}-\d{2})-[a-z0-9-]+$")


def data_valida(texto):
    """AAAA-MM-DD e uma data que existe."""
    if not isinstance(texto, str) or not re.match(r"^\d{4}-\d{2}-\d{2}$", texto):
        return False
    try:
        datetime.date.fromisoformat(texto)
        return True
    except ValueError:
        return False


def c_nova(a):
    p = peca_de(a, exige=False)
    if os.path.exists(p.pasta):
        raise comum.ErroSaida("a peça já existe: %s (o kit.py nova nunca grava por cima)" % p.pasta, 2)
    m = RX_NOME_PECA.match(p.nome)
    if not m:
        print("aviso: o nome %s não segue AAAA-MM-DD-slug (peça de teste: _AAAA-MM-DD-slug; minúsculas, sem acento)"
              % p.nome)
    data = m.group(1) if m and data_valida(m.group(1)) else None
    if m and not data:
        print("aviso: %s não é uma data que existe" % m.group(1))
    modelo = comum.PECAS + "/_modelo/cenas.json"
    with open(modelo, encoding="utf-8") as f:
        cena = f.read()
    # só os campos: peca e o caminho das telas (telas.*.arquivo); o texto de ajuda do modelo fica como está
    nome_json = json.dumps(p.nome, ensure_ascii=False)[1:-1]
    cena = cena.replace('"peca": "AAAA-MM-DD-slug"', '"peca": "%s"' % nome_json, 1)
    cena = cena.replace('"pecas/AAAA-MM-DD-slug/', '"pecas/%s/' % nome_json)
    if data:
        cena = cena.replace('"dataPost": "AAAA-MM-DD"', '"dataPost": "%s"' % data, 1)
    planos = [("cenas.json", "de pecas/_modelo/cenas.json (peca e telas.*.arquivo com %s; dataPost %s)"
               % (p.nome, data or "AAAA-MM-DD, a preencher")),
              ("roteiro.md", "de voz/roteiro.modelo.md"),
              ("telas/receitas/_modelo.json", "de telas/receitas/_modelo.json"), ("voz/", "pasta da voz (vazia)")]
    for rel, de in planos:
        print("%s %s  %s" % ("criaria" if a.simula else "cria", p.caminho(rel), de))
    if a.simula:
        return 0
    escrita.grava_texto(p.caminho("cenas.json"), cena, cria_pasta=True)
    escrita.copia(VOZ + "/roteiro.modelo.md", p.caminho("roteiro.md"))
    escrita.copia(comum.KIT + "/telas/receitas/_modelo.json", p.caminho("telas", "receitas", "_modelo.json"),
                  cria_pasta=True)
    os.makedirs(p.caminho("voz"), exist_ok=True)
    print("peça nova em %s" % p.pasta)
    if data:
        print("  dataPost: %s (do nome da pasta)" % data)
    else:
        print("  dataPost: AAAA-MM-DD; troque pela data do post na cena (o kit.py props recusa como está)")
    print("  falta na cena: titulo (com o dataPost, vira a pasta FINAL/<dataPost> <titulo>/), fatos (o público é "
          "obrigatório: \"ME\", \"MEI\" ou \"todos\"; vazio o kit recusa e confere como MEI) e capa; e o roteiro.md, que "
          "o Pedro aprova antes da voz")
    return 0


def c_palavras(a):
    p = peca_de(a)
    cena = p.le_cena()
    rel = cena.get("narracao") or "voz/narracao.json"
    caminho = rel if os.path.isabs(rel) else p.caminho(rel)
    if not os.path.isfile(caminho):
        raise comum.ErroSaida("a narração não existe: %s (rode kit.py voz-alinha %s)" % (caminho, a.peca), 2)
    n = comum.le_json(caminho)
    chaves = {fr["key"]: k for k, fr in enumerate(n["phrases"])}
    frase_de = {}
    for k, fr in enumerate(n["phrases"]):
        for i in fr["w"]:
            frase_de[i] = k
    print("narração: %s (tFecho %s, duração %s)" % (caminho, n.get("tFecho", "?"), n.get("duracao", "?")))
    print("  i       s       e  frase  palavra")
    for w in n["words"]:
        marca = "  <- chave da frase %d" % chaves[w["i"]] if w["i"] in chaves else ""
        print("%3d %7.3f %7.3f  %5s  %s%s" % (w["i"], w["s"], w["e"], frase_de.get(w["i"], "?"), w["t"], marca))
    return 0


def c_batidas(a):
    return roda(node("batidas.mjs", *(["--json"] if a.json else [])), a, cwd=comum.RM)


def c_trilhas(a):
    # só o tipo trilha: as prévias de audição têm a narração da peça de 14/10 e nunca vão como trilha de cena
    args = ["lista", "trilhas", "--tipo", "trilha"]
    if a.status:
        args += ["--status", a.status]
    if a.clima:
        args += ["--clima", a.clima]
    return roda(py(comum.KIT + "/catalogos/catalogo.py", *args), a)


def liga_telas(p, simula=False):
    pngs = sorted(glob.glob(os.path.join(p.pasta, "telas", "*.png")))
    if not pngs:
        raise comum.ErroSaida("nenhuma PNG em %s/telas (rode kit.py telas sem --so-liga)" % p.pasta, 2)
    destino = comum.PUBLIC_KIT + "/pecas/%s/telas" % p.nome
    feitos = []
    for png in pngs:
        d = destino + "/" + os.path.basename(png)
        if os.path.lexists(d):
            if os.path.isfile(d) and os.path.samefile(png, d):
                feitos.append((d, "já ligada", os.stat(d).st_nlink))
                continue
            st = os.stat(d)
            if st.st_nlink > 1:
                raise comum.ErroSaida("%s existe, é outro arquivo e tem outro hardlink (st_nlink %d): não mexi"
                                      % (d, st.st_nlink))
            # link velho de uma versão anterior da tela (a PNG da peça foi regravada): religa
            if simula:
                feitos.append((d, "religaria", st.st_nlink))
                continue
            os.remove(d)
            info = escrita.liga(png, d)
            feitos.append((d, "religada", info["st_nlink"]))
            continue
        if simula:
            feitos.append((d, "ligaria", 0))
            continue
        info = escrita.liga(png, d, cria_pasta=True)
        feitos.append((d, "ligada", info["st_nlink"]))
    for d, estado, nl in feitos:
        print("  %-10s %s%s" % (estado, d, (" (st_nlink %d)" % nl) if nl else ""))
    # tela sem origem no catálogo (sem receita da peça e sem nome de captura do catálogo) não entra em peça nenhuma: o
    # props, o fatos e o confere recusam (rodada 4); aqui só o aviso, pra não esperar até o props
    if comum.KIT + "/catalogos" not in sys.path:
        sys.path.insert(0, comum.KIT + "/catalogos")
    import catalogo
    idx = catalogo.indice("telas")
    for png in pngs:
        it, via = catalogo.origem_tela("pecas/%s/telas/%s" % (p.nome, os.path.basename(png)), None, idx)
        if it is None:
            print("  AVISO: %s sem origem no catálogo de telas (%s): a cena que usar essa tela é recusada"
                  % (os.path.basename(png), via))
    return feitos


def desliga_telas(p, simula=False):
    """Tira do RM/public-kit/pecas/<peça>/ os links das telas da peça (a PNG da peça fica). Apaga só o que é o mesmo
    arquivo de uma PNG de <peça>/telas/ ou link velho dela (mesmo nome, st_nlink 1); o resto fica, com aviso."""
    pasta_pk = comum.PUBLIC_KIT + "/pecas/%s" % p.nome
    destino = pasta_pk + "/telas"
    print("$ (desliga as telas de %s em %s)" % (p.nome, destino))
    if not os.path.isdir(destino):
        print("  nada ligado: %s não existe" % destino)
        return {"desligadas": [], "ficaram": [], "bytes": 0}
    pngs = {os.path.basename(x).casefold(): x for x in glob.glob(os.path.join(p.pasta, "telas", "*.png"))}
    res = {"desligadas": [], "ficaram": [], "bytes": 0}
    for n in sorted(os.listdir(destino)):
        d = destino + "/" + n
        st = os.lstat(d)
        if not os.path.isfile(d) or os.path.islink(d):
            res["ficaram"].append((d, "não é arquivo comum"))
            continue
        origem = pngs.get(n.casefold())
        mesmo = origem is not None and os.path.samefile(origem, d)
        velho = origem is not None and not mesmo and st.st_nlink == 1
        if mesmo or velho:
            if not simula:
                os.remove(d)
            # o link não libera disco (a PNG da peça fica); o link velho libera
            res["desligadas"].append((d, "link da PNG da peça" if mesmo else "link velho (PNG regravada), %d bytes"
                                      % st.st_size))
            if velho:
                res["bytes"] += st.st_size
        else:
            res["ficaram"].append((d, "outro arquivo (st_nlink %d): não mexi" % st.st_nlink))
    if not simula:
        for pasta in (destino, pasta_pk):
            try:
                os.rmdir(pasta)  # só sai se ficou vazia
            except OSError:
                pass
    for d, motivo in res["desligadas"]:
        print("  %s %s (%s)" % ("desligaria" if simula else "desligada", d, motivo))
    for d, motivo in res["ficaram"]:
        print("  ficou %s (%s)" % (d, motivo))
    return res


def c_telas(a):
    p = peca_de(a)
    if a.desliga:
        if a.so_liga:
            raise comum.ErroSaida("--desliga e --so-liga juntos não fazem sentido", 2)
        r = desliga_telas(p, a.simula)
        print("%d link(s) %s; as PNG de %s/telas ficam (kit.py telas %s --so-liga liga de novo)"
              % (len(r["desligadas"]), "a desligar" if a.simula else "desligado(s)", p.pasta, p.nome))
        return 0 if not r["ficaram"] else 1
    if not a.so_liga:
        rec = p.caminho("telas", "receitas")
        if not os.path.isdir(rec):
            raise comum.ErroSaida("não há receitas em %s (copie de KIT/telas/receitas/_modelo.json)" % rec, 2)
        cmd = py(comum.KIT + "/telas/monta.py", rec, "--saida", p.caminho("telas"), "--qa")
        if a.forca:
            cmd.append("--forca")
        # o público da cena vai pro monta.py: fora do "ME" (MEI, todos ou vazio), captura que não serve MEI é recusada
        # (F063 por padrão, rodada 4)
        publico = ((p.le_cena() if os.path.isfile(p.cena) else {}).get("fatos") or {}).get("publico")
        cmd += ["--publico", publico if publico in ("ME", "MEI", "todos", "ambos") else "vazio"]
        cod = roda(cmd, a)
        if cod != 0:
            return cod
    else:
        print("--so-liga: só liga as PNG que já existem (não remonta)")
    print("$ (liga as PNG de %s/telas em %s/pecas/%s/telas)" % (p.pasta, comum.PUBLIC_KIT, p.nome))
    liga_telas(p, a.simula)
    return 0


def c_modelos(a):
    p = peca_de(a)
    if a.desliga:
        r = kit_modelos.desliga(p, a.simula)
        print("%d link(s) de modelo %s; %d ficaram" % (len(r["desligados"]), "a desligar" if a.simula else
                                                       "desligado(s)", len(r["ficaram"])))
        return 0
    ids = kit_modelos.lista(p)
    if not ids:
        print("a cena não tem objetos")
        return 0
    if a.so_lista:
        return 0
    r = kit_modelos.liga(p, simula=a.simula)
    if not (r["ligados"] or r["jaLigados"]):
        print("nenhum GLB a ligar (procedurais e objetos de extensão não têm arquivo)")
    return 1 if r["fora"] else 0


def c_prova_modelos(a):
    args = list(a.ids)
    if a.todos:
        args.append("--todos")
    if a.lote:
        args += ["--lote", str(a.lote)]
    for op in ("sem_decisao", "grava_catalogo", "simula", "mantem"):
        if getattr(a, op, False):
            args.append("--" + op.replace("_", "-"))
    if getattr(a, "espera", None) is not None:
        args += ["--espera", str(a.espera)]
    return comum.roda(py("prova_modelos.py", *args))


def c_voz_prepara(a):
    p = peca_de(a)
    args = [p.pasta]
    if a.wav:
        args += ["--wav", a.wav]
    if a.forca:
        args.append("--forca")
    return roda([comum.PY, "-B", VOZ + "/prepara.py"] + args, a)


def c_voz_recebe(a):
    p = peca_de(a)
    args = [p.pasta, a.arquivo]
    if a.ref:
        args += ["--ref", a.ref]
    if a.forca:
        args.append("--forca")
    return roda([comum.PY, "-B", VOZ + "/recebe.py"] + args, a)


def c_voz_alinha(a):
    p = peca_de(a)
    args = [p.pasta] + cena_args(p)
    for op in ("wav", "saida", "gap"):
        v = getattr(a, op)
        if v is not None:
            args += ["--" + op, str(v)]
    if a.forca:
        args.append("--forca")
    if a.sem_refino:
        args.append("--sem-refino")
    return roda([comum.PYW, "-B", VOZ + "/alinha.py"] + args, a)


def c_voz_monta(a):
    p = peca_de(a)
    args = [p.pasta] + cena_args(p)
    if a.forca:
        args.append("--forca")
    return roda([comum.PY, "-B", VOZ + "/monta.py"] + args, a)


def c_props(a):
    p = peca_de(a)
    # os GLB da biblioteca entram no public-kit só quando a peça usa (kit_modelos): o props.mjs confere se existem
    if os.path.isfile(p.cena):
        kit_modelos.liga(p, simula=a.simula)
    return roda(node("props.mjs", p.pasta, *cena_args(p)), a, cwd=comum.RM)


def c_eventos(a):
    p = peca_de(a)
    return roda(node("eventos.mjs", p.pasta, *cena_args(p)), a, cwd=comum.RM)


def c_fatos(a):
    p = peca_de(a)
    args = [p.pasta] + cena_args(p)
    if getattr(a, "roteiro", None):
        args += ["--roteiro", a.roteiro]
    return roda(py("fatos.py", *args), a)


def c_qc(a):
    p = peca_de(a)
    cod = roda(node("quadros.mjs", p.pasta, *cena_args(p)), a, cwd=comum.RM)
    if cod != 0:
        return cod
    args = [p.pasta] + cena_args(p)
    for op, nome in (("margem", "--margem"), ("margem_transicao", "--margem-transicao")):
        v = getattr(a, op, None)
        if v is not None:
            args += [nome, str(v)]
    return roda(py("qc_legenda.py", *args), a)


def c_mix(a):
    p = peca_de(a)
    cmd = [comum.PY, "-B", comum.KIT + "/audio/mixa.py", p.pasta, "--props", os.path.basename(p.props),
           "--eventos", os.path.basename(p.eventos), "--saida", "audio/mix%s.wav" % p.sufixo, "--relatorio"]
    if getattr(a, "stems", False):
        cmd.append("--stems")
    return roda(cmd, a)


def _quadros(a, p):
    q = (a.quadros or "auto").strip()
    if q != "auto":
        return [int(x) for x in q.split(",") if x.strip()]
    if a.simula and not (os.path.isfile(p.props) and os.path.isfile(p.quadros)):
        return ["auto"]
    return kit_stills.quadros_auto(p, p.le_props())


def c_stills(a):
    p = peca_de(a)
    quadros = _quadros(a, p)
    comps = [c.strip() for c in (a.composicoes or "KitMotion").split(",") if c.strip()]
    depois = comum.divide(a.depois) if a.depois else None
    if a.simula and quadros == ["auto"]:
        print("(stills auto: um quadro por âncora de batida do qc/quadros%s.json, mais o primeiro e o último)" % p.sufixo)
        quadros = [0]
    pngs = kit_stills.stills(p, quadros, comps, simula=a.simula, lote=a.lote, depois=depois, apaga=a.apaga,
                             public=a.public, rotulo="stills")
    if not a.simula:
        print("%d still(s) em %s" % (len(pngs), kit_stills.pasta_stills(p)))
    return 0


def c_previa(a):
    p = peca_de(a)
    passos = [("props", c_props), ("eventos", c_eventos), ("fatos", c_fatos), ("qc", c_qc), ("mix", c_mix)]
    para = {"props", "eventos", "mix"}
    for nome, fn in passos:
        etapa(nome)
        cod = fn(a)
        if cod != 0 and nome in para:
            print("ERRO na etapa %s (código %d): a prévia parou" % (nome, cod))
            return cod
        if cod != 0:
            print("AVISO: a etapa %s acusou problema (código %d); a prévia segue, o final para" % (nome, cod))
    etapa("stills auto")
    a.quadros, a.composicoes, a.lote, a.depois, a.apaga, a.public = "auto", "KitMotion", None, None, False, None
    quadros = _quadros(a, p)
    if a.simula and quadros == ["auto"]:
        quadros = [0]
    pngs = kit_stills.stills(p, quadros, ["KitMotion"], simula=a.simula, rotulo="previa")
    etapa("folha da prévia")
    saida = p.saida("previa", ".jpg", "provas")
    cod = roda(py("folha.py", "--pngs", *pngs, saida), a)
    if cod == 0 and not a.simula and not a.mantem_stills:
        # disco: os PNG da prévia (um por âncora, uns 1,3 MB cada) só servem pra folha
        apagados = 0
        for png in pngs:
            if os.path.isfile(png) and os.stat(png).st_nlink == 1:
                os.remove(png)
                apagados += 1
        print("prévia: %d PNG apagados depois da folha (--mantem-stills guarda)" % apagados)
    elif a.simula and not a.mantem_stills:
        print("$ (apaga os PNG da prévia depois da folha; --mantem-stills guarda)")
    return cod


def c_capa(a):
    p = peca_de(a)
    args = [p.pasta] + cena_args(p)
    for op in ("quadro", "titulo", "destaque", "still"):
        v = getattr(a, op, None)
        if v is not None:
            args += ["--" + op, str(v)]
    return roda(py("capa.py", *args), a)


def comando_render(p, trecho=None):
    """O comando exato da seção 7.4 (sem opção de thread); com trecho, --frames=a-b."""
    props = p.props
    if trecho:
        a_, b_ = trecho
        saida = comum.barra(os.path.join(p.pasta, "saida", "%s%s-trecho-%d-%d-mudo.mp4" % (p.nome, p.sufixo, a_, b_)))
    else:
        saida = p.mudo()
    args = [comum.NPX, "remotion", "render", "src/index.ts", "KitMotion", saida, "--props=" + props,
            "--public-dir=public-kit", "--binaries-directory=" + comum.BIN, "--browser-executable=" + comum.CHROME,
            "--gl=angle", "--concurrency=3", "--crf=15", "--x264-preset=slow", "--muted", "--color-space=bt709"]
    texto = ('npx remotion render src/index.ts KitMotion "%s" --props="%s" --public-dir=public-kit '
             '--binaries-directory="%s" --browser-executable="%s" --gl=angle --concurrency=3 --crf=15 '
             '--x264-preset=slow --muted --color-space=bt709' % (saida, props, comum.BIN, comum.CHROME))
    if trecho:
        args.append("--frames=%d-%d" % trecho)
        texto += " --frames=%d-%d" % trecho
    return args, texto, saida


def _trecho(txt, fps, total):
    if not txt:
        return None
    m = re.match(r"^\s*([\d.,]+)(q?)\s*:\s*([\d.,]+)(q?)\s*$", txt)
    if not m:
        raise comum.ErroSaida("--trecho de:ate em segundos (9.0:10.5) ou em quadros (270q:314q)", 2)
    a_ = float(m.group(1).replace(",", "."))
    b_ = float(m.group(3).replace(",", "."))
    qa = int(a_) if m.group(2) else int(round(a_ * fps))
    qb = int(b_) if m.group(4) else int(round(b_ * fps)) - 1
    qa, qb = max(0, qa), min(total - 1, qb)
    if qb < qa:
        raise comum.ErroSaida("trecho vazio: %s" % txt, 2)
    return qa, qb


def c_render(a):
    p = peca_de(a)
    props = p.le_props() if os.path.isfile(p.props) else None
    if props is None and not a.simula:
        raise comum.ErroSaida("as props não existem: %s (rode kit.py props)" % p.props, 2)
    fps, total = (props or {}).get("fps", 30), (props or {}).get("quadros", 0)
    trecho = _trecho(getattr(a, "trecho", None), fps, total or 10 ** 9)
    args, texto, saida = comando_render(p, trecho)
    # portão (rodada 4, 03/10): o render exige a trava de fatos ok das props de hoje, sem opção de ignorar (peça de
    # teste, pasta com '_', passa com aviso)
    probs = portao.problemas_fatos(p) if (props is not None or not a.simula) else []
    if a.simula and props is None:
        print("(portão: ainda sem props; o render exige a trava de fatos ok das props de hoje)")
    elif a.simula:
        if probs and not p.teste:
            print("(sem --simula, o render é recusado: %s)" % "; ".join(probs))
        elif probs:
            print("(peça de teste: o render segue com aviso: %s)" % "; ".join(probs))
        else:
            print("(portão: a trava de fatos está ok pras props de hoje)")
    else:
        portao.exige(p, "o render", probs)
    if a.simula:
        print("$ (cwd %s) %s" % (comum.RM, texto))
        print("  (antes: a vez na trava de render, também entre sessões, e disco >= %d MB; durante: vigia.py com "
              "KIT_LIMITE_DISCO_MB, padrão %d MB, e Temp próprio em %s/; depois: apaga só esse Temp)"
              % (comum.DISCO_RENDER_MB, comum.LIMITE_VIGIA_MB, trava.PASTA))
        return 0
    if escrita.protegido(saida):
        raise comum.ErroSaida("a saída do render é caminho protegido: %s" % saida, 2)
    if os.path.exists(saida) and os.stat(saida).st_nlink > 1:
        raise comum.ErroSaida("recusado: %s é hardlink (st_nlink %d); o render gravaria no lugar"
                              % (saida, os.stat(saida).st_nlink))
    os.makedirs(os.path.dirname(saida), exist_ok=True)
    with trava.render(p, "render"):
        escrita.exige_disco(comum.DISCO_RENDER_MB, "o render")
        kit_modelos.liga(p)  # com a trava na mão: o bundle copia o public-kit agora
        inicio = time.time()
        print("$ (cwd %s) %s" % (comum.RM, texto), flush=True)
        with trava.temp_proprio(p, "render") as tmp:
            print("  Temp próprio: %s" % tmp, flush=True)
            codigo, info = vigia.roda(args, cwd=comum.RM, saida=saida, env=trava.env_temp(tmp), temp_privado=tmp)
    if codigo != 0:
        return codigo
    if not os.path.isfile(saida):
        raise comum.ErroSaida("o render terminou sem gravar %s" % saida)
    print("mudo: %s (%d bytes); fluxo de vídeo md5 %s; %.0f s; disco mínimo %.0f MB"
          % (saida, os.path.getsize(saida), comum.md5_fluxo_video(saida), time.time() - inicio, info.get("minimo_mb") or 0))
    return 0


def c_juncao(a):
    p = peca_de(a)
    args = [p.pasta] + cena_args(p)
    for op in ("mudo", "mix", "saida"):
        v = getattr(a, op, None)
        if v:
            args += ["--" + op, v]
    return roda(py("juncao.py", *args), a)


def c_confere(a):
    p = peca_de(a)
    args = [p.pasta] + cena_args(p)
    if getattr(a, "video", None):
        args += ["--video", a.video]
    if getattr(a, "stills", None):
        args += ["--stills"] + list(a.stills)
    if getattr(a, "matriz", None):
        args += ["--matriz", a.matriz]
    if getattr(a, "sem_whisper", False):
        args.append("--sem-whisper")
    return roda(py("confere.py", *args), a)


def c_colisao(a):
    """Prova de colisão (05/10): node RM/src/kit/cli/colisao.mjs na vez da trava de render, com o vigia de disco e Temp
    próprio (apagado no fim). Grava qc/colisao<sufixo>.json e .md (ou em --saida); código 1 com colisão."""
    p = peca_de(a)
    args = [p.pasta] + cena_args(p)
    for op in ("de", "ate", "passo", "saida", "concorrencia"):
        v = getattr(a, op, None)
        if v is not None:
            args += ["--" + op, str(v)]
    cmd = node("colisao.mjs", *args)
    destino = a.saida or p.caminho("qc")
    if a.simula:
        with trava.render(p, "colisao", simula=True):
            comum.roda(cmd, cwd=comum.RM, simula=True)
        print("  (com o vigia de disco: limite %d MB; Temp próprio em %s/, apagado no fim; grava %s/colisao%s.json e "
              ".md; código 1 com colisão ou invasão de faixa)" % (comum.DISCO_STILLS_MB, trava.PASTA, destino, p.sufixo))
        return 0
    if not os.path.isfile(p.props):
        raise comum.ErroSaida("as props não existem: %s (rode kit.py props %s)" % (p.props, a.peca), 2)
    p.le_props()  # recusa props de outra pasta
    with trava.render(p, "colisao"):
        escrita.exige_disco(comum.DISCO_STILLS_MB, "a prova de colisão")
        if os.path.isfile(p.cena):
            kit_modelos.liga(p)  # com a trava na mão: o bundle copia o public-kit agora
        inicio = time.time()
        with trava.temp_proprio(p, "colisao") as tmp:
            print("$ " + comum.mostra(cmd, comum.RM) + "   (com o vigia de disco: limite %d MB; Temp próprio %s)"
                  % (comum.DISCO_STILLS_MB, tmp), flush=True)
            codigo, info = vigia.roda(cmd, cwd=comum.RM, limite_mb=comum.DISCO_STILLS_MB, env=trava.env_temp(tmp),
                                      temp_privado=tmp)
    print("prova de colisão: %.0f s; disco mínimo %.0f MB" % (time.time() - inicio, info.get("minimo_mb") or 0))
    return codigo


def quadros_final(props):
    """6 quadros: o primeiro, 20%, 40%, 60%, 80% e o último."""
    total = props["quadros"]
    return sorted(set([0, total - 1] + [int(round(total * f)) for f in (0.2, 0.4, 0.6, 0.8)]))


def c_final(a):
    p = peca_de(a)
    inicio = time.time()
    seq = [("props", c_props), ("eventos", c_eventos), ("fatos (trava de conteúdo: para com erro, sem opção de "
                                                         "ignorar)", c_fatos), ("qc", c_qc), ("mix", c_mix)]
    for nome, fn in seq:
        etapa(nome)
        cod = fn(a)
        if cod != 0:
            if nome == "qc" and a.ignora_qc:
                print("AVISO: o qc acusou invasão da legenda; seguindo por causa de --ignora-qc")
                continue
            print("ERRO: a etapa %s falhou (código %d): o final parou" % (nome.split(" ")[0], cod))
            return cod
    # uma vez só na trava de render pros stills e o render (outra sessão não entra no meio)
    with (trava.render(p, "final") if not a.simula else contextlib.nullcontext()):
        etapa("stills de 6 quadros")
        if a.simula and not os.path.isfile(p.props):
            qs = ["0", "20%", "40%", "60%", "80%", "último"]
            print("$ (stills.mjs com o KitMotion nos quadros %s)" % ", ".join(qs))
            kit_stills.stills(p, [0], ["KitMotion"], simula=True, rotulo="final")
        else:
            kit_stills.stills(p, quadros_final(p.le_props()), ["KitMotion"], simula=a.simula, rotulo="final")
        etapa("render (seção 7.4, com o vigia de disco)")
        a.trecho = None
        cod = c_render(a)
    if cod != 0:
        return cod
    etapa("junção")
    a.mudo, a.mix, a.saida = None, None, None
    cod = c_juncao(a)
    if cod != 0:
        return cod
    etapa("conferência")
    a.video, a.stills, a.matriz, a.sem_whisper = None, None, None, False
    cod = c_confere(a)
    etapa("limpa")
    if a.simula:
        print("$ (limpa: o Temp próprio de cada etapa já sai apagado; aqui, só sobras desta peça de execução que "
              "acabou; nada de outra sessão)")
    else:
        lim = trava.limpa_sobras(p.nome)
        print("limpa: Temp próprio apagado em cada etapa; %d sobra(s) antiga(s) desta peça apagada(s) (%.1f MB); "
              "%.0f s no total" % (len(lim["apagadas"]), lim["bytes"] / 1048576, time.time() - inicio))
    if cod != 0:
        print("a conferência acusou problema: veja saida/relatorio%s.md" % p.sufixo)
    return cod


def c_entregar(a):
    p = peca_de(a)
    args = [p.pasta] + cena_args(p)
    for op, nome in (("raiz_final", "--raiz-final"), ("videos", "--videos"), ("nome", "--nome"), ("arquivo", "--arquivo")):
        v = getattr(a, op, None)
        if v:
            args += [nome, v]
    if a.simula:
        args.append("--simula")
    return comum.roda(py("entregar.py", *args))


def c_ext_liga(a):
    kit_ext.liga(a.nome, a.midia, a.simula)
    return 0


def c_ext_desliga(a):
    r = kit_ext.desliga(a.nome, a.midia, a.simula)
    return 0 if not r["ficaram"] else 1


def _mb(n):
    return n / 1048576.0


def _finais_entregues(p):
    """Os mp4 de saida/ (menos mudo e trecho) que têm hardlink fora da peça (entregues no FINAL ou na raiz falsa)."""
    out = []
    for f in sorted(glob.glob(os.path.join(p.pasta, "saida", "*.mp4"))):
        n = os.path.basename(f)
        if n.endswith("-mudo.mp4"):
            continue
        out.append((comum.barra(f), os.stat(f).st_nlink))
    return out


def limpa_entregue(p, simula=False):
    """Depois da entrega: os PNG de provas/stills, os mudos de saida/ e os links das telas no public-kit. Só arquivo com
    st_nlink 1 (nunca um hardlink). Devolve os bytes liberados."""
    finais = _finais_entregues(p)
    entregue = any(nl >= 2 for _f, nl in finais)
    teste = p.nome.startswith("_")
    if not entregue and not teste:
        msg = ("o final de %s ainda não foi entregue (nenhum mp4 de saida/ com hardlink fora da peça): rode kit.py "
               "entregar antes" % p.nome)
        if not simula:
            raise comum.ErroSaida(msg + "; --simula mostra o que sairia", 2)
        print("AVISO: %s; sem --simula, o kit recusa" % msg)
    verbo = "apagaria" if simula else "apagou"
    liberado = 0
    alvos = sorted(glob.glob(os.path.join(p.pasta, "provas", "stills", "*.png")))
    alvos += sorted(glob.glob(os.path.join(p.pasta, "saida", "*-mudo.mp4")))
    for f in alvos:
        st = os.stat(f)
        rel = comum.barra(os.path.relpath(f, p.pasta))
        if st.st_nlink > 1:
            print("  ficou %s (hardlink, st_nlink %d)" % (rel, st.st_nlink))
            continue
        if not simula:
            os.remove(f)
        liberado += st.st_size
        print("  %s %s (%.1f MB)" % (verbo, rel, _mb(st.st_size)))
    r = desliga_telas(p, simula)
    liberado += r["bytes"]
    print("$ (desliga os modelos 3D de %s em %s)" % (p.nome, kit_modelos.PASTA))
    try:
        kit_modelos.desliga(p, simula)
    except comum.ErroSaida as e:
        print("  AVISO: %s (kit.py modelos %s --desliga depois)" % (e, p.nome))
    fica = [(comum.barra(os.path.relpath(f, p.pasta)), nl) for f, nl in finais]
    for rel in ("audio/mix%s.wav" % p.sufixo, "saida/relatorio%s.md" % p.sufixo, "saida/folha%s.jpg" % p.sufixo,
                "saida/capa%s.png" % p.sufixo, "saida/creditos%s.txt" % p.sufixo):
        if os.path.isfile(p.caminho(rel)):
            fica.append((rel, os.stat(p.caminho(rel)).st_nlink))
    if fica:
        print("  ficam: %s" % ", ".join("%s%s" % (rel, " (st_nlink %d)" % nl if nl > 1 else "") for rel, nl in fica))
    return liberado


def limpa_peca(p, a):
    simula = a.simula
    verbo = "apagaria" if simula else "apagou"
    print("sobras da peça %s" % p.nome)
    r = trava.limpa_sobras(p.nome, simula=simula)
    for s in r["apagadas"]:
        print("  Temp: %s %s (%s; o PID %s já terminou; %.1f MB)" % (verbo, s["pasta"], s["comando"], s["pid"], s["mb"]))
    for s in r["ficaram"]:
        print("  Temp: ficou %s (%s; o PID %s ainda está rodando)" % (s["pasta"], s["comando"], s["pid"]))
    for s in r["falhas"]:
        print("  Temp: NÃO apagou %s (%s): tente de novo daqui a pouco" % (s["pasta"], s["erro"]))
    if not (r["apagadas"] or r["ficaram"] or r["falhas"]):
        print("  Temp: nenhuma pasta própria desta peça em %s" % trava.PASTA)
    total = r["bytes"]
    if a.entregue:
        total += limpa_entregue(p, simula)
    print("%s %.1f MB" % ("liberaria" if simula else "liberou", _mb(total)))
    return 1 if r["falhas"] else 0


def c_limpa(a):
    if a.peca:
        return limpa_peca(comum.Peca(a.peca, getattr(a, "cena", None), exige=False), a)
    if a.entregue:
        raise comum.ErroSaida("--entregue vai com a peça: kit.py limpa <peça> --entregue", 2)
    if not a.tudo and not a.desde:
        print("Uso: kit.py limpa <peça> (só as sobras da peça; --entregue depois da entrega) ou kit.py limpa --tudo "
              "(todas, só sem render rodando). Estado agora:")
        for nivel, nome, msg in trava.resumo():
            print("  [%s] %s: %s" % (nivel, nome, msg))
        return 0
    e = trava.estado()
    rodando = [g for g in (e["renders"] or []) if not g["orfao"]]
    if trava.ocupada(e) or rodando or e["renders"] is None:
        motivo = []
        if trava.ocupada(e):
            motivo.append("a trava de render está com %s" % trava.descreve_info(e["trava"] or e["info"]))
        motivo += [trava.descreve_render(g) for g in rodando]
        if e["renders"] is None:
            motivo.append("não consegui ler os processos")
        raise comum.ErroSaida("nada foi apagado: %s. A limpeza geral só roda sem render rodando, em nenhuma sessão "
                              "(kit.py limpa <peça> apaga só as sobras da sua peça)" % "; ".join(motivo), 3)
    args = []
    if a.tudo:
        args.append("--tudo")
    if a.desde:
        args += ["--desde", a.desde]
    if a.simula:
        args.append("--simula")
    cod = comum.roda(py("limpa.py", *args))
    if a.tudo:
        r = trava.limpa_sobras(None, simula=a.simula)
        print("Temp próprio: %s %d pasta(s) de execução que já acabou (%.1f MB) em %s"
              % ("apagaria" if a.simula else "apagou", len(r["apagadas"]), _mb(r["bytes"]), trava.PASTA))
        if r["falhas"]:
            cod = 1
    return cod


def c_audd(a):
    return roda([comum.PY, "-B", comum.KIT + "/aquisicoes/audd.py", "--proximo-lote"], a)


# ---------- linha de comando ----------
COMANDOS = [
    ("doutor", c_doutor, "confere ffmpeg 9, node 26, RM/bin, chrome, Sora, os dois venvs, hardlinks do public-kit, mídia "
                         "de extensão ligada, catálogos, referências congeladas, o disco e quem está renderizando "
                         "(a trava de render, os renders rodando e as sobras de Temp por peça)"),
    ("nova", c_nova, "cria pecas/<peça>/ com cenas.json, roteiro.md e telas/receitas/ dos modelos"),
    ("palavras", c_palavras, "lista as palavras da narração com índice e tempo"),
    ("batidas", c_batidas, "lista as batidas e as camadas do núcleo e das extensões, com padrões e sons"),
    ("trilhas", c_trilhas, "lista as trilhas do catálogo"),
    ("telas", c_telas, "monta as telas pelas receitas e liga em RM/public-kit/pecas/<peça>/telas/ (--so-liga só liga; "
                       "--desliga tira os links da peça do public-kit)"),
    ("modelos", c_modelos, "lista os modelos 3D da cena (status, se entram no render) e liga os GLB em "
                           "RM/public-kit/3d/biblioteca/ (o props, os stills e o render ligam sozinhos); --desliga tira "
                           "os links da peça"),
    ("prova-modelos", c_prova_modelos, "still de prova de modelos do catálogo (KitProvaModelo com o objeto montado "
                                       "pelo montaProps, de frente e 3/4), em lotes, com uma folha de contato por lote "
                                       "em KIT/provas/modelos/render/"),
    ("voz-prepara", c_voz_prepara, "grava voz/para-voz.mp4 pro voice_change (K03)"),
    ("voz-recebe", c_voz_recebe, "extrai voz/narr-dylan.wav do vídeo devolvido e confere o atraso (K03)"),
    ("voz-alinha", c_voz_alinha, "whisper small sem prompt e alinhamento com o roteiro: voz/narracao.json (K03, no PYW)"),
    ("voz-monta", c_voz_monta, "põe o fecho fixo em tFecho e grava o voz.final da cena (K03)"),
    ("props", c_props, "node RM/src/kit/cli/props.mjs: grava props<sufixo>.json (erros param tudo)"),
    ("eventos", c_eventos, "node RM/src/kit/cli/eventos.mjs: grava eventos<sufixo>.json"),
    ("fatos", c_fatos, "trava de conteúdo contra o FATOS e o PROIBIDO (seção 7.2)"),
    ("qc", c_qc, "quadros.mjs grava qc/quadros<sufixo>.json; qc_legenda.py grava qc/legenda<sufixo>.json"),
    ("mix", c_mix, "KIT/audio/mixa.py grava audio/mix<sufixo>.wav"),
    ("stills", c_stills, "stills.mjs com as composições pedidas no mesmo bundle (auto = âncoras, primeiro e último)"),
    ("previa", c_previa, "props, eventos, fatos, qc, mix, stills auto e a folha provas/previa<sufixo>.jpg"),
    ("capa", c_capa, "proposta de capa com o título na área 4:5 (seção 7.3)"),
    ("render", c_render, "render mudo com o comando da seção 7.4, na vez da trava de render, com vigia de disco e "
                         "Temp próprio (apagado no fim); exige a trava de fatos ok das props de hoje"),
    ("juncao", c_juncao, "junta o mudo e o mix com a loudness corrigida (seção 7.6), com o áudio do tamanho exato do "
                         "vídeo (--saida pra outro nome); exige a trava de fatos ok"),
    ("confere", c_confere, "conferência do final: formato, som, cor, fala, legenda, loop, texto, licenças, créditos e folha"),
    ("colisao", c_colisao, "prova de colisão quadro a quadro (colisao.mjs, na vez da trava de render): objeto 3D entrando "
                           "em outro e objeto 3D na faixa da legenda, no fecho ou no link; grava qc/colisao<sufixo>.json "
                           "e .md (ou em --saida) e sai com código 1 se houver colisão"),
    ("final", c_final, "props, eventos, fatos (para com erro), qc, mix, stills de 6 quadros, render, junção, confere, limpa"),
    ("entregar", c_entregar, "liga o final na pasta da proposta e move a versão anterior (seção 7.5); exige a trava de "
                             "fatos ok e o relatório do confere ok do mesmo mp4"),
    ("ext-liga", c_ext_liga, "liga no public-kit a mídia de uma extensão pelo midia.json dela"),
    ("ext-desliga", c_ext_desliga, "desliga a mídia da extensão (só apaga link com o inode da origem)"),
    ("limpa", c_limpa, "com a peça, apaga só as sobras dela: Temp de execução que já acabou e, com --entregue, os "
                       "stills, o mudo e os links das telas e dos modelos 3D depois da entrega; --tudo apaga as de "
                       "todas, só sem render rodando"),
    ("audd", c_audd, "chama KIT/aquisicoes/audd.py --proximo-lote (K08)"),
]


def monta_parser():
    comum_p = argparse.ArgumentParser(add_help=False)
    comum_p.add_argument("--simula", action="store_true", help="mostra os comandos sem rodar")
    com_peca = argparse.ArgumentParser(add_help=False, parents=[comum_p])
    com_peca.add_argument("peca", help="nome da pasta em KIT/pecas (ou caminho absoluto)")
    com_peca.add_argument("--cena", help="outra cena da peça; as saídas ganham o sufixo do nome dela")
    ap = argparse.ArgumentParser(prog="kit.py", description="Script único de saída do kit de motion (K07, seção 7). "
                                 "Uso: PY -B KIT/scripts/kit.py <comando> [peça] [--cena <arquivo>] [--simula] [opções]; "
                                 "kit.py <comando> --help mostra as opções do comando.")
    sub = ap.add_subparsers(dest="comando", metavar="<comando>", required=True)
    ajuda = {n: h for n, _f, h in COMANDOS}
    fn = {n: f for n, f, _h in COMANDOS}

    def novo(nome, peca=True):
        p = sub.add_parser(nome, parents=[com_peca if peca else comum_p], help=ajuda[nome], description=ajuda[nome])
        p.set_defaults(fn=fn[nome])
        return p

    p = novo("doutor", peca=False)
    p.add_argument("--referencia", help="outro _referencia.json (pro teste)")
    p.add_argument("--rapido", action="store_true", help="pula o valida.py e o import do faster-whisper")
    novo("nova")
    novo("palavras")
    p = novo("batidas", peca=False)
    p.add_argument("--json", action="store_true")
    p = novo("trilhas", peca=False)
    p.add_argument("--status")
    p.add_argument("--clima")
    p = novo("telas")
    p.add_argument("--so-liga", action="store_true", help="só liga as PNG que já existem, sem remontar")
    p.add_argument("--desliga", action="store_true",
                   help="tira os links da peça de RM/public-kit/pecas/<peça>/ (as PNG da peça ficam)")
    p.add_argument("--forca", action="store_true", help="repassa --forca ao monta.py (PNG já ligada com conteúdo novo)")
    p = novo("modelos")
    p.add_argument("--desliga", action="store_true",
                   help="tira os links dos GLB da peça de RM/public-kit/3d/biblioteca/ (fica o que outra peça usa)")
    p.add_argument("--so-lista", action="store_true", help="só mostra os modelos da cena, sem ligar")
    p = novo("prova-modelos", peca=False)
    p.add_argument("ids", nargs="*", help="ids do catálogo de modelos")
    p.add_argument("--todos", action="store_true", help="todos os GLB e procedurais com bloco render")
    p.add_argument("--lote", type=int, help="modelos por lote (padrão 8)")
    p.add_argument("--sem-decisao", action="store_true", help="modelo de decisão pendente entra só na prova")
    p.add_argument("--grava-catalogo", action="store_true", help="grava o provaRender no revisao-render.json")
    p.add_argument("--mantem", action="store_true", help="guarda a pasta de trabalho (PNG e log do navegador)")
    p.add_argument("--espera", type=float, help="minutos de espera pela trava de render (padrão 40)")
    p = novo("voz-prepara")
    p.add_argument("--wav")
    p.add_argument("--forca", action="store_true")
    p = novo("voz-recebe")
    p.add_argument("arquivo", help="vídeo (ou áudio) devolvido pelo voice_change")
    p.add_argument("--ref")
    p.add_argument("--forca", action="store_true")
    p = novo("voz-alinha")
    p.add_argument("--wav")
    p.add_argument("--saida")
    p.add_argument("--gap", type=float)
    p.add_argument("--forca", action="store_true")
    p.add_argument("--sem-refino", action="store_true")
    p = novo("voz-monta")
    p.add_argument("--forca", action="store_true")
    novo("props")
    novo("eventos")
    p = novo("fatos")
    p.add_argument("--roteiro", help="outro roteiro (padrão roteiro.md ou voz/roteiro.md)")
    p = novo("qc")
    p.add_argument("--margem", type=float, help="margem com a frase cheia (padrão calibrado no guia)")
    p.add_argument("--margem-transicao", type=float, help="margem com a frase entrando ou saindo")
    p = novo("mix")
    p.add_argument("--stems", action="store_true")
    p = novo("stills")
    p.add_argument("--espera", type=float, help="minutos de espera pela trava de render (padrão 40)")
    p.add_argument("--quadros", help="a,b,c ou auto (padrão auto)")
    p.add_argument("--composicoes", help="KitMotion,GuiaPronta,... no mesmo bundle (padrão KitMotion)")
    p.add_argument("--lote", type=int, help="quadros por lote (com --apaga, os PNG de cada lote são apagados)")
    p.add_argument("--depois", help="comando rodado depois de cada lote (recebe o manifesto do lote)")
    p.add_argument("--apaga", action="store_true")
    p.add_argument("--public", help="outro public (padrão RM/public-kit)")
    p = novo("previa")
    p.add_argument("--espera", type=float, help="minutos de espera pela trava de render (padrão 40)")
    p.add_argument("--roteiro")
    p.add_argument("--mantem-stills", action="store_true", help="guarda os PNG da prévia (padrão: apaga depois da folha)")
    p = novo("capa")
    p.add_argument("--espera", type=float, help="minutos de espera pela trava de render (padrão 40)")
    p.add_argument("--quadro", type=int)
    p.add_argument("--titulo")
    p.add_argument("--destaque")
    p.add_argument("--still", help="PNG pronto no lugar do still do KitMotion")
    p = novo("render")
    p.add_argument("--espera", type=float, help="minutos de espera pela trava de render (padrão 40)")
    p.add_argument("--trecho", help="de:ate em segundos (9.0:10.5) ou quadros (270q:314q): --frames=a-b")
    p = novo("juncao")
    p.add_argument("--mudo", help="mudo de fora da peça (sem copiar nem ligar)")
    p.add_argument("--mix")
    p.add_argument("--saida", help="outro destino do final (padrão saida/<peça><sufixo>.mp4), como NOME-motion.mp4")
    p = novo("confere")
    p.add_argument("--video")
    p.add_argument("--stills", nargs="+")
    p.add_argument("--matriz", choices=sorted(comum.MATRIZES))
    p.add_argument("--sem-whisper", action="store_true")
    p = novo("colisao")
    p.add_argument("--espera", type=float, help="minutos de espera pela trava de render (padrão 40)")
    p.add_argument("--de", help="segundo inicial (padrão 0)")
    p.add_argument("--ate", help="segundo final, inclusive (padrão o fim)")
    p.add_argument("--passo", type=int, help="testa 1 quadro a cada N (padrão 1: todos)")
    p.add_argument("--saida", help="pasta dos relatórios colisao<sufixo>.json e .md (padrão <peça>/qc)")
    p.add_argument("--concorrencia", type=int, help="abas do navegador (padrão 3)")
    p = novo("final")
    p.add_argument("--espera", type=float, help="minutos de espera pela trava de render (padrão 40)")
    p.add_argument("--ignora-qc", action="store_true", help="segue mesmo com invasão da legenda (os fatos nunca)")
    p.add_argument("--roteiro")
    p = novo("entregar")
    p.add_argument("--raiz-final", help="raiz falsa (testes); padrão FINAL")
    p.add_argument("--videos", help="onde procurar a outra ocorrência da versão anterior (padrão Vídeos/)")
    p.add_argument("--nome", help="nome do arquivo na pasta da proposta (o padrão das pastas do FINAL: NOME-motion.mp4)")
    p.add_argument("--arquivo", help="o mp4 a entregar (padrão saida/<peça><sufixo>.mp4); o relatório do confere tem de "
                                     "ser dele")
    for nome in ("ext-liga", "ext-desliga"):
        p = novo(nome, peca=False)
        p.add_argument("nome", help="nome da extensão (RM/src/kit/ext/<nome>/midia.json)")
        p.add_argument("--midia", help="outro midia.json (pro teste)")
    p = novo("limpa", peca=False)
    p.add_argument("peca", nargs="?", help="a peça: só as sobras dela (nome em KIT/pecas ou caminho absoluto)")
    p.add_argument("--cena", help="outra cena da peça (o sufixo dos arquivos)")
    p.add_argument("--entregue", action="store_true",
                   help="com a peça, depois da entrega: apaga provas/stills/*.png e saida/*-mudo.mp4 e desliga as "
                        "telas e os modelos 3D")
    p.add_argument("--tudo", action="store_true", help="sem peça: todas as sobras, só sem render rodando")
    p.add_argument("--desde", help="sem peça: pastas da raiz do Temp desde (segundos desde a época, ou -<N>min)")
    novo("audd", peca=False)
    return ap


def main(argv=None):
    comum.utf8()
    ap = monta_parser()
    a = ap.parse_args(argv)
    if getattr(a, "espera", None) is not None:
        os.environ["KIT_TRAVA_ESPERA_MIN"] = str(a.espera)  # vale pra este processo e pros filhos (a capa.py)
    try:
        return a.fn(a) or 0
    except comum.ErroSaida as e:
        print("erro: %s" % e)
        return e.codigo
    except (escrita.EscritaRecusada, escrita.DiscoInsuficiente) as e:
        print("erro: %s" % e)
        return 1


if __name__ == "__main__":
    sys.exit(main())
