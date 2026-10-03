"""Ajudante comum de escrita segura do kit de motion do Legalizaí (pacote K01).

Contrato: KIT/DESENHO.md, seção 4.12 (lista de intocáveis na seção 13).

Uso (sempre com python -B ou PYTHONDONTWRITEBYTECODE=1, pra não criar __pycache__):

    import sys
    sys.dont_write_bytecode = True
    sys.path.insert(0, "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/lib")
    import escrita
    escrita.grava_json(caminho, obj)

Regras:
- toda gravação vai primeiro pra um temporário na mesma pasta (prefixo .tmp-), com flush e os.fsync,
  e só então troca de lugar com os.replace; se der erro, o temporário é apagado;
- recusa destino que existe com st_nlink > 1 (hardlink) sem forca=True;
- recusa sempre destino protegido (seção 13 do DESENHO; FINAL/ só pelo liga e pelo move com permite_final=True);
- recusa pasta-mãe inexistente sem cria_pasta=True.
Todas as recusas levantam EscritaRecusada com a mensagem em português.

Linha de comando:
    python -B escrita.py --autoteste <pasta>     prova as recusas e a troca atômica numa pasta temporária
    python -B escrita.py --protegido <caminho>   diz se o caminho é protegido e por qual regra
    python -B escrita.py --livre                 espaço livre no C: em MB
"""
import hashlib
import json
import os
import shutil
import sys
import tempfile
import unicodedata

MB = 1024 * 1024

# Siglas do DESENHO.md
MKT = "C:/MKT-INSTA/Content Legalizai/marketing"
LEO = MKT + "/leo-animado"
KIT = LEO + "/_kit-motion"
PR = LEO + "/precificacao-2026-10-02"
RM = PR + "/remotion"
GP = LEO + "/guia-pronta-2026-10-14"
AB = LEO + "/abertura-mes-2026-10-01"
EXT = LEO + "/_assets-externos"
FINAL = MKT + "/final"
BASE = "C:/MKT-INSTA/Content Legalizai/_base-contabil"
MEM = "C:/Users/EDIT-ADMIN/.claude/projects/c--MKT-INSTA/memory"
VIDEOS = "C:/Users/EDIT-ADMIN/Videos"

ROTULO_FINAL = "FINAL/"


class DiscoInsuficiente(RuntimeError):
    """Espaço livre no C: abaixo do mínimo pedido."""


class EscritaRecusada(RuntimeError):
    """Escrita recusada pelas regras da seção 4.12."""


def _norm(caminho):
    """Caminho absoluto, com links e nomes curtos (8.3) resolvidos, barras normais e sem diferença de maiúsculas."""
    p = os.path.abspath(os.fspath(caminho))
    try:
        p = os.path.realpath(p)
    except OSError:
        pass
    if p.startswith("\\\\?\\"):
        p = p[4:]
    p = unicodedata.normalize("NFC", p).replace("\\", "/").rstrip("/")
    return p.casefold()


def _dentro(p, base):
    return p == base or p.startswith(base + "/")


# Regras de intocáveis (seção 13). Cada uma: (rótulo, tipo, caminho, exceções).
# tipo "pasta": o caminho e tudo abaixo dele; "arquivo": só o próprio arquivo;
# "prefixo": pastas logo abaixo do caminho cujo nome começa com o prefixo (com exceções por nome).
_REGRAS_FONTE = [
    ("RM/src/guia/", "pasta", RM + "/src/guia", ()),
    ("RM/src/abertura/", "pasta", RM + "/src/abertura", ()),
    ("RM/src/motion/", "pasta", RM + "/src/motion", ()),
    ("RM/src/parts/", "pasta", RM + "/src/parts", ()),
    ("RM/src/lib/", "pasta", RM + "/src/lib", ()),
    ("RM/src/data/", "pasta", RM + "/src/data", ()),
    ("RM/src/Motion.tsx", "arquivo", RM + "/src/Motion.tsx", ()),
    ("RM/src/Broll.tsx", "arquivo", RM + "/src/Broll.tsx", ()),
    ("RM/src/Leo.tsx", "arquivo", RM + "/src/Leo.tsx", ()),
    ("RM/src/Root.tsx (só o K06 acrescenta os dois registros, fora deste ajudante)", "arquivo", RM + "/src/Root.tsx", ()),
    ("RM/src/index.ts", "arquivo", RM + "/src/index.ts", ()),
    ("RM/stills.mjs", "arquivo", RM + "/stills.mjs", ()),
    ("RM/remotion.config.ts", "arquivo", RM + "/remotion.config.ts", ()),
    ("RM/package.json", "arquivo", RM + "/package.json", ()),
    ("RM/package-lock.json", "arquivo", RM + "/package-lock.json", ()),
    ("RM/tsconfig.json", "arquivo", RM + "/tsconfig.json", ()),
    ("RM/node_modules/", "pasta", RM + "/node_modules", ()),
    ("RM/bin/", "pasta", RM + "/bin", ()),
    ("RM/public*/ (menos RM/public-kit/)", "prefixo", RM + "/public", ("public-kit",)),
    ("PR/ (menos RM/src/kit/ e RM/public-kit/)", "pasta", PR, (RM + "/src/kit", RM + "/public-kit")),
    ("GP/", "pasta", GP, ()),
    ("AB/", "pasta", AB, ()),
    ("EXT/ (menos EXT/kit-2026-10/)", "pasta", EXT, (EXT + "/kit-2026-10",)),
    (ROTULO_FINAL, "pasta", FINAL, ()),
    ("marketing/telas-app*/", "prefixo", MKT + "/telas-app", ()),
    ("C:/Legalizei/", "pasta", "C:/Legalizei", ()),
    ("BASE/", "pasta", BASE, ()),
    ("MEM/", "pasta", MEM, ()),
    ("KIT/DESENHO.md", "arquivo", KIT + "/DESENHO.md", ()),
    ("KIT/scripts/capturar-telas.mjs", "arquivo", KIT + "/scripts/capturar-telas.mjs", ()),
    ("REF (_referencia.json)", "arquivo", KIT + "/pecas/guia-pronta-2026-10-14/_referencia.json", ()),
    ("REF (_referencia/)", "pasta", KIT + "/pecas/guia-pronta-2026-10-14/_referencia", ()),
    # Acréscimo do K01: Vídeos/ guarda o outro hardlink do V4 (seção 0); o kit só lê ali.
    ("Vídeos/ (outro hardlink do V4; só leitura)", "pasta", VIDEOS, ()),
]


def _prepara_regras():
    regras = []
    for rotulo, tipo, caminho, excecoes in _REGRAS_FONTE:
        if tipo == "prefixo":
            base, prefixo = os.path.split(caminho)
            regras.append((rotulo, tipo, _norm(base), prefixo.casefold(), tuple(e.casefold() for e in excecoes)))
        else:
            regras.append((rotulo, tipo, _norm(caminho), "", tuple(_norm(e) for e in excecoes)))
    return regras


_REGRAS = _prepara_regras()


def protegido_motivo(caminho):
    """Rótulo da regra da seção 13 que protege o caminho, ou None."""
    p = _norm(caminho)
    for rotulo, tipo, base, prefixo, excecoes in _REGRAS:
        if tipo == "arquivo":
            if p == base:
                return rotulo
        elif tipo == "pasta":
            if _dentro(p, base) and not any(_dentro(p, e) for e in excecoes):
                return rotulo
        elif tipo == "prefixo":
            if p.startswith(base + "/"):
                primeiro = p[len(base) + 1:].split("/", 1)[0]
                if primeiro.startswith(prefixo) and primeiro not in excecoes:
                    return rotulo
    return None


def protegido(caminho):
    """Verdadeiro pra qualquer caminho da lista de intocáveis da seção 13."""
    return protegido_motivo(caminho) is not None


def livre_mb(raiz="C:/"):
    """Espaço livre no volume, em MB."""
    return shutil.disk_usage(raiz).free / MB


def exige_disco(minimo_mb, motivo=""):
    """Levanta DiscoInsuficiente se o C: tiver menos que minimo_mb livres. Devolve o espaço livre."""
    livre = livre_mb()
    if livre < minimo_mb:
        raise DiscoInsuficiente(
            "disco insuficiente: %.0f MB livres no C:, %s pede pelo menos %.0f MB"
            % (livre, motivo or "a operação", minimo_mb))
    return livre


def _confere_disco(nbytes, motivo):
    # regra do ambiente: arquivo acima de 5 MB só com 400 MB livres (mais o próprio arquivo)
    if nbytes > 5 * MB:
        exige_disco(400 + nbytes / MB, motivo)


def md5(caminho, bloco=MB):
    h = hashlib.md5()
    with open(caminho, "rb") as f:
        while True:
            parte = f.read(bloco)
            if not parte:
                break
            h.update(parte)
    return h.hexdigest()


def _recusa(msg):
    raise EscritaRecusada(msg)


def _checa_protecao(caminho, permite_final=False):
    motivo = protegido_motivo(caminho)
    if motivo and not (motivo == ROTULO_FINAL and permite_final):
        _recusa("recusado: %s é caminho protegido (%s; DESENHO.md seção 13)" % (caminho, motivo))


def _checa_pasta(alvo, cria_pasta):
    pasta = os.path.dirname(alvo)
    if not os.path.isdir(pasta):
        if not cria_pasta:
            _recusa("recusado: a pasta %s não existe (use cria_pasta=True)" % pasta)
        _checa_protecao(pasta)
        os.makedirs(pasta, exist_ok=True)
    return pasta


def _checa_destino(caminho, forca=False, cria_pasta=False, permite_final=False):
    """Confere tudo que a seção 4.12 pede antes de gravar e devolve o caminho absoluto do destino."""
    alvo = os.path.abspath(os.fspath(caminho))
    _checa_protecao(alvo, permite_final)
    if os.path.lexists(alvo):
        if os.path.islink(alvo):
            _recusa("recusado: %s é link simbólico; grave num caminho novo" % alvo)
        if os.path.isdir(alvo):
            _recusa("recusado: %s é uma pasta" % alvo)
        n = os.stat(alvo).st_nlink
        if n > 1 and not forca:
            _recusa("recusado: %s é hardlink (st_nlink %d); grave num caminho novo" % (alvo, n))
    _checa_pasta(alvo, cria_pasta)
    return alvo


def _troca(caminho, escreve, forca, cria_pasta, permite_final=False):
    alvo = _checa_destino(caminho, forca, cria_pasta, permite_final)
    fd, tmp = tempfile.mkstemp(prefix=".tmp-", dir=os.path.dirname(alvo))
    try:
        with os.fdopen(fd, "wb") as f:
            escreve(f)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, alvo)
    except BaseException:
        try:
            os.remove(tmp)
        except OSError:
            pass
        raise
    return alvo


def grava_bytes(caminho, dados, forca=False, cria_pasta=False):
    """Grava bytes pelo temporário da mesma pasta e troca com os.replace. Devolve o caminho absoluto."""
    dados = bytes(dados)
    _confere_disco(len(dados), "gravar %s" % caminho)
    return _troca(caminho, lambda f: f.write(dados), forca, cria_pasta)


def grava_texto(caminho, texto, forca=False, cria_pasta=False):
    """Grava texto em UTF-8 com fim de linha \\n."""
    texto = texto.replace("\r\n", "\n").replace("\r", "\n")
    return grava_bytes(caminho, texto.encode("utf-8"), forca, cria_pasta)


def grava_json(caminho, obj, forca=False, cria_pasta=False):
    """Grava JSON com ensure_ascii=False, indent=2 e \\n no fim."""
    return grava_texto(caminho, json.dumps(obj, ensure_ascii=False, indent=2) + "\n", forca, cria_pasta)


def copia(origem, destino, forca=False, cria_pasta=False):
    """Cópia de conteúdo (nunca link), pelo mesmo caminho do temporário. Devolve o caminho absoluto do destino."""
    if not os.path.isfile(origem):
        _recusa("recusado: a origem %s não existe ou não é arquivo" % origem)
    _confere_disco(os.path.getsize(origem), "copiar %s" % origem)

    def escreve(f):
        with open(origem, "rb") as src:
            shutil.copyfileobj(src, f, MB)

    return _troca(destino, escreve, forca, cria_pasta)


def _info_liga(origem, destino):
    so, sd = os.stat(origem), os.stat(destino)
    return {"origem": os.path.abspath(origem), "destino": os.path.abspath(destino), "tamanho": sd.st_size,
            "st_ino": sd.st_ino, "st_nlink": sd.st_nlink, "_mesmo": (so.st_ino, so.st_dev) == (sd.st_ino, sd.st_dev),
            "_tamanhoOrigem": so.st_size}


def liga(origem, destino, permite_final=False, cria_pasta=False):
    """Hardlink (os.link). Idempotente quando o destino já é o mesmo inode; recusa destino que é outro arquivo.

    Confere tamanho igual e st_nlink >= 2 e devolve {origem, destino, tamanho, st_ino, st_nlink}.
    Destino dentro de FINAL/ só com permite_final=True (usado só pelo kit.py entregar).
    """
    if not os.path.isfile(origem):
        _recusa("recusado: a origem %s não existe ou não é arquivo" % origem)
    alvo = os.path.abspath(os.fspath(destino))
    _checa_protecao(alvo, permite_final)
    criado = False
    if os.path.lexists(alvo):
        if not (os.path.isfile(alvo) and os.path.samefile(origem, alvo)):
            _recusa("recusado: %s já existe e é outro arquivo" % alvo)
    else:
        _checa_pasta(alvo, cria_pasta)
        os.link(origem, alvo)
        criado = True
    info = _info_liga(origem, alvo)
    if not info["_mesmo"] or info["tamanho"] != info["_tamanhoOrigem"] or info["st_nlink"] < 2:
        if criado:
            os.remove(alvo)  # só o link que esta chamada acabou de criar
        _recusa("recusado: o hardlink %s não conferiu (tamanho %d contra %d, st_nlink %d)"
                % (alvo, info["tamanho"], info["_tamanhoOrigem"], info["st_nlink"]))
    return {k: v for k, v in info.items() if not k.startswith("_")}


def move(origem, destino, permite_final=False, cria_pasta=False):
    """os.replace no mesmo volume; recusa se o destino existe (nunca sobrescreve). Devolve o destino absoluto."""
    src = os.path.abspath(os.fspath(origem))
    alvo = os.path.abspath(os.fspath(destino))
    if not os.path.lexists(src):
        _recusa("recusado: a origem %s não existe" % src)
    _checa_protecao(src, permite_final)
    _checa_protecao(alvo, permite_final)
    if os.path.lexists(alvo):
        _recusa("recusado: %s já existe; o move nunca sobrescreve" % alvo)
    if os.path.splitdrive(src)[0].casefold() != os.path.splitdrive(alvo)[0].casefold():
        _recusa("recusado: %s e %s estão em volumes diferentes; o move é só no mesmo volume" % (src, alvo))
    _checa_pasta(alvo, cria_pasta)
    os.replace(src, alvo)
    return alvo


# Autoteste

def _le(caminho):
    with open(caminho, "rb") as f:
        return f.read().decode("utf-8")


def autoteste(pasta_base):
    """Prova as regras numa pasta temporária criada dentro de pasta_base. Devolve 0 se tudo passou."""
    resultados = []

    def ok(nome, cond, detalhe=""):
        resultados.append((nome, bool(cond)))
        print("%s  %s%s" % ("ok    " if cond else "FALHOU", nome, ("  [" + detalhe + "]") if detalhe else ""))

    if not os.path.isdir(pasta_base):
        print("a pasta %s não existe" % pasta_base)
        return 1
    raiz = tempfile.mkdtemp(prefix="autoteste-escrita-", dir=pasta_base)
    j = lambda *p: os.path.join(raiz, *p)  # noqa: E731
    sobras = lambda: [n for n in os.listdir(raiz) if n.startswith(".tmp-")]  # noqa: E731
    replace_real, mkstemp_real = os.replace, tempfile.mkstemp
    print("autoteste do escrita.py em %s" % raiz)
    try:
        # 1. troca atômica
        a = j("a.txt")
        grava_texto(a, "um\r\nlinha dois")
        ok("grava_texto grava UTF-8 com fim de linha \\n", open(a, "rb").read() == b"um\nlinha dois")
        ino1 = os.stat(a).st_ino
        grava_texto(a, "dois")
        ok("troca atômica: conteúdo novo e entrada trocada pelo os.replace (inode novo)",
           _le(a) == "dois" and os.stat(a).st_ino != ino1)
        ok("troca atômica: nenhum temporário .tmp- sobrou na pasta", not sobras())

        def falha(*args, **kw):
            raise OSError("falha simulada no os.replace")

        os.replace = falha
        try:
            grava_texto(a, "três")
            erro = None
        except OSError as e:
            erro = e
        finally:
            os.replace = replace_real
        ok("troca atômica: erro no os.replace deixa o original intacto e apaga o temporário",
           erro is not None and _le(a) == "dois" and not sobras(), str(erro))
        b = j("b.json")
        grava_json(b, {"chave": "ação", "n": [1, 2]})
        ok("grava_json: ensure_ascii False, indent 2 e \\n no fim",
           open(b, "rb").read() == '{\n  "chave": "ação",\n  "n": [\n    1,\n    2\n  ]\n}\n'.encode("utf-8"))

        # 2. recusa de hardlink
        orig, lig = j("orig.txt"), j("ligado.txt")
        grava_texto(orig, "original")
        os.link(orig, lig)
        try:
            grava_texto(lig, "por cima")
            msg = ""
        except EscritaRecusada as e:
            msg = str(e)
        ok("recusa gravar em hardlink sem forca", "é hardlink (st_nlink 2); grave num caminho novo" in msg, msg)
        ok("recusa de hardlink: os dois nomes continuam com o conteúdo original",
           _le(orig) == "original" and _le(lig) == "original" and os.stat(orig).st_nlink == 2)

        # 3. com forca, o os.replace troca só a entrada
        grava_texto(lig, "novo", forca=True)
        ok("com forca: o caminho ligado recebe o conteúdo novo", _le(lig) == "novo")
        ok("com forca: o original ligado não muda (o os.replace troca só a entrada)",
           _le(orig) == "original" and os.stat(orig).st_nlink == 1)

        # 4. caminho protegido, só pela função (nada é gravado nem aberto pra escrita)
        protegidos = [
            KIT + "/DESENHO.md", (KIT + "/DESENHO.MD").replace("/", "\\").upper(),
            KIT + "/scripts/capturar-telas.mjs",
            KIT + "/pecas/guia-pronta-2026-10-14/_referencia.json",
            KIT + "/pecas/guia-pronta-2026-10-14/_referencia/tela-inicio.png",
            GP + "/assets/telas/tela-inicio.png", AB + "/mix_abertura.py", PR + "/src/sfx.py",
            RM + "/src/guia/narracao.json", RM + "/src/Root.tsx", RM + "/stills.mjs", RM + "/package.json",
            RM + "/node_modules/gsap/package.json", RM + "/bin/ffmpeg.exe",
            RM + "/public-guia/3d/iphone.glb", RM + "/public/qualquer.png",
            EXT + "/musica-v2/04_house-one_francisco-alvear_mixkit-662_120bpm.mp3",
            FINAL + "/LEIA-ME.md", MKT + "/telas-app-2026-10-02/inicio.png", MKT + "/telas-app/inicio.png",
            "C:/Legalizei/legalizei/app/page.tsx", BASE + "/FATOS.md", MEM + "/MEMORY.md",
        ]
        livres = [
            KIT + "/catalogos/trilhas/base.json", KIT + "/lib/escrita.py",
            KIT + "/pecas/guia-pronta-2026-10-14/cenas.json", KIT + "/scripts/kit.py",
            RM + "/public-kit/3d/iphone.glb", RM + "/src/kit/nucleo/tipos.ts",
            EXT + "/kit-2026-10/musica/nova.mp3", j("qualquer.txt"),
        ]
        falsos_neg = [c for c in protegidos if not protegido(c)]
        falsos_pos = [c for c in livres if protegido(c)]
        ok("protegido(): os %d intocáveis de teste dão verdadeiro (maiúsculas e barras invertidas inclusive)"
           % len(protegidos), not falsos_neg, "; ".join(falsos_neg))
        ok("protegido(): os %d caminhos livres de teste dão falso" % len(livres), not falsos_pos,
           "; ".join(falsos_pos))

        def sentinela(*args, **kw):
            raise AssertionError("tentou criar temporário num caminho protegido")

        tempfile.mkstemp = sentinela
        try:
            recusas = []
            for c in (KIT + "/DESENHO.md", GP + "/assets/telas/tela-inicio.png", FINAL + "/_autoteste.mp4"):
                try:
                    grava_texto(c, "x")
                    recusas.append(False)
                except EscritaRecusada as e:
                    recusas.append("caminho protegido" in str(e))
            try:
                liga(orig, FINAL + "/_autoteste.txt")
                recusas.append(False)
            except EscritaRecusada as e:
                recusas.append("caminho protegido" in str(e))
        finally:
            tempfile.mkstemp = mkstemp_real
        ok("grava_texto e liga recusam caminho protegido antes de qualquer escrita", all(recusas))
        try:
            _checa_protecao(FINAL + "/_autoteste.mp4", permite_final=True)
            ok("FINAL/ passa só com permite_final=True (conferido só pela função)", True)
        except EscritaRecusada as e:
            ok("FINAL/ passa só com permite_final=True (conferido só pela função)", False, str(e))

        # 5. liga idempotente
        fonte = j("fonte.bin")
        grava_bytes(fonte, b"\x00\x01" * 1000)
        destino = j("sub", "ligado.bin")
        r1 = liga(fonte, destino, cria_pasta=True)
        ok("liga cria o hardlink e confere tamanho e st_nlink >= 2",
           r1["tamanho"] == 2000 and r1["st_nlink"] >= 2, "st_nlink %d" % r1["st_nlink"])
        r2 = liga(fonte, destino)
        ok("liga idempotente: mesmo inode, nada muda", r2["st_ino"] == r1["st_ino"] and r2["st_nlink"] == r1["st_nlink"])
        outro = j("outro.bin")
        grava_bytes(outro, b"x")
        try:
            liga(outro, destino)
            msg = ""
        except EscritaRecusada as e:
            msg = str(e)
        ok("liga recusa destino que é outro arquivo", "já existe e é outro arquivo" in msg, msg)

        # 6. move sem sobrescrever
        m1, m2, m3 = j("m1.txt"), j("m2.txt"), j("m3.txt")
        grava_texto(m1, "m1")
        grava_texto(m2, "m2")
        try:
            move(m1, m2)
            msg = ""
        except EscritaRecusada as e:
            msg = str(e)
        ok("move recusa destino existente e não mexe em nada",
           "nunca sobrescreve" in msg and _le(m1) == "m1" and _le(m2) == "m2", msg)
        move(m1, m3)
        ok("move pra caminho novo no mesmo volume", not os.path.exists(m1) and _le(m3) == "m1")

        # 7. pasta-mãe inexistente
        fundo = j("nao", "existe", "x.txt")
        try:
            grava_texto(fundo, "x")
            msg = ""
        except EscritaRecusada as e:
            msg = str(e)
        ok("recusa pasta-mãe inexistente sem cria_pasta", "não existe" in msg, msg)
        grava_texto(fundo, "x", cria_pasta=True)
        ok("com cria_pasta=True a pasta é criada", _le(fundo) == "x")

        # 8. cópia de conteúdo
        c = j("copia.bin")
        copia(fonte, c)
        ok("copia: mesmo conteúdo, outro inode e st_nlink 1",
           md5(c) == md5(fonte) and os.stat(c).st_ino != os.stat(fonte).st_ino and os.stat(c).st_nlink == 1)

        # 9. disco
        try:
            exige_disco(10 ** 12, "o autoteste")
            msg = ""
        except DiscoInsuficiente as e:
            msg = str(e)
        ok("exige_disco levanta DiscoInsuficiente acima do livre (%.0f MB livres)" % livre_mb(),
           msg.startswith("disco insuficiente"), msg)
    finally:
        os.replace, tempfile.mkstemp = replace_real, mkstemp_real
        shutil.rmtree(raiz, ignore_errors=True)  # só a pasta que o autoteste criou
    falhas = [n for n, c in resultados if not c]
    print("autoteste: %d de %d ok%s" % (len(resultados) - len(falhas), len(resultados),
                                        "" if not falhas else "; falharam: " + "; ".join(falhas)))
    return 0 if not falhas else 1


def _main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    if len(argv) >= 2 and argv[0] == "--autoteste":
        return autoteste(argv[1])
    if len(argv) >= 2 and argv[0] == "--protegido":
        for c in argv[1:]:
            motivo = protegido_motivo(c)
            print("%s: %s" % (c, ("protegido (" + motivo + ")") if motivo else "livre"))
        return 0
    if argv[:1] == ["--livre"]:
        print("%.0f MB livres no C:" % livre_mb())
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
