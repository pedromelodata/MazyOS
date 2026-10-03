"""Doutor do kit de motion: confere o ambiente antes de render (pacote K07). Contrato: KIT/DESENHO.md, seção 7.1.

Confere: ffmpeg e ffprobe 9, node 26, RM/bin (caminho absoluto, ffmpeg e ffprobe), chrome-headless-shell, Sora,
os dois venvs (PY com PIL, numpy, cv2 e jsonschema; PYW com faster-whisper e o modelo small no cache), os
hardlinks do public-kit (st_nlink e tamanho), mídia de extensão ligada (avisa: desligar depois do render), os
catálogos (valida.py do K01), as referências congeladas (catalogo.py referencia <peca> pra cada
pecas/*/_referencia.json; o que mudou sai em vermelho), o disco (aviso abaixo de 500 MB; render bloqueado abaixo
de 400 MB e stills abaixo de 250 MB), sobras de render na raiz do Temp e quem está renderizando (trava.py): a trava
de render (livre ou com quem, desde quando), os renders do Remotion rodando agora (do kit ou de fora dele) e as
pastas de Temp próprio esquecidas, por peça. Esses itens nunca são vermelhos: render rodando é motivo pra esperar.

Uso (sempre com python -B):
    python -B ambiente.py [--referencia <_referencia.json>] [--rapido] [--json]
      --referencia  confere só este registro (outro arquivo, pro teste) no lugar dos pecas/*/_referencia.json
      --rapido      pula o valida.py e o import do faster-whisper
Código de saída: 0 sem vermelho; 1 com algum item vermelho (referência mudou, ferramenta faltando, catálogo com erro).
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import glob  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
import re  # noqa: E402
import subprocess  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
import limpa  # noqa: E402
from comum import escrita  # noqa: E402

VERMELHO = "\x1b[31m"
AMARELO = "\x1b[33m"
FIM = "\x1b[0m"
COR = sys.stdout.isatty()

# arquivos fixos do public-kit (K06) e a origem deles no public-guia (hardlinks, mesmo inode)
FIXOS_PUBLIC_KIT = [
    "Sora-wght.ttf", "marca/logo-horizontal.svg", "marca/logo-ai-tinta.svg", "marca/logo-negativa-clara.svg",
    "marca/simbolo.svg", "3d/iphone.glb", "3d/watch.glb", "telas/tela-splash.png", "telas/tela-inicio.png",
    "telas/tela-inicio-pagar.png", "telas/tela-imposto.png",
]
SEM_LINK_OK = {"pecas/LEIA-ME.txt", "ext/LEIA-ME.txt"}


class Relatorio:
    def __init__(self):
        self.itens = []

    def add(self, nivel, nome, msg):
        self.itens.append({"nivel": nivel, "nome": nome, "mensagem": msg})
        rot = {"ok": "ok      ", "aviso": "AVISO   ", "vermelho": "VERMELHO", "info": "info    "}[nivel]
        linha = "[%s] %-26s %s" % (rot, nome, msg)
        if COR and nivel == "vermelho":
            linha = VERMELHO + linha + FIM
        elif COR and nivel == "aviso":
            linha = AMARELO + linha + FIM
        print(linha, flush=True)

    @property
    def vermelhos(self):
        return [i for i in self.itens if i["nivel"] == "vermelho"]


def _versao(cmd, rx):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60)
    except (OSError, subprocess.TimeoutExpired) as e:
        return None, str(e)
    txt = (r.stdout or "") + (r.stderr or "")
    m = re.search(rx, txt)
    return (m.group(1) if m else None), txt.strip().splitlines()[0] if txt.strip() else ""


def confere_ferramentas(rel):
    for nome in ("ffmpeg", "ffprobe"):
        v, linha = _versao([nome, "-version"], r"version (\d+)[.\d]*")
        if v is None:
            rel.add("vermelho", nome, "não achei no PATH (%s)" % linha)
        elif v != "9":
            rel.add("aviso", nome, "versão %s (o kit foi medido com a 9, gyan full): %s" % (v, linha))
        else:
            rel.add("ok", nome, linha)
    v, linha = _versao(["node", "--version"], r"v(\d+)\.")
    if v is None:
        rel.add("vermelho", "node", "não achei no PATH")
    elif v != "26":
        rel.add("aviso", "node", "versão %s (o kit foi medido com a 26.7)" % linha)
    else:
        rel.add("ok", "node", linha)
    faltam = [n for n in ("ffmpeg.exe", "ffprobe.exe") if not os.path.isfile(os.path.join(comum.BIN, n))]
    if faltam:
        rel.add("vermelho", "RM/bin", "falta %s em %s (o Remotion usa esses binários)" % (", ".join(faltam), comum.BIN))
    else:
        nl = [os.stat(os.path.join(comum.BIN, n)).st_nlink for n in ("ffmpeg.exe", "ffprobe.exe")]
        rel.add("ok", "RM/bin", "%s (absoluto; ffmpeg e ffprobe com st_nlink %s; sempre --binaries-directory absoluto)"
                % (comum.BIN, "/".join(map(str, nl))))
    if os.path.isfile(comum.CHROME):
        rel.add("ok", "chrome-headless-shell", comum.CHROME)
    else:
        rel.add("vermelho", "chrome-headless-shell", "não existe: %s" % comum.CHROME)
    if os.path.isfile(comum.SORA):
        st = os.stat(comum.SORA)
        rel.add("ok" if st.st_nlink >= 2 else "aviso", "Sora", "%s (%d bytes, st_nlink %d)" % (comum.SORA, st.st_size,
                                                                                            st.st_nlink))
    else:
        rel.add("vermelho", "Sora", "não existe: %s" % comum.SORA)


def confere_venvs(rel, rapido):
    r = subprocess.run([comum.PY, "-B", "-c", "import PIL, numpy, cv2, jsonschema, sys; "
                        "print(sys.version.split()[0], PIL.__version__, numpy.__version__, cv2.__version__)"],
                       capture_output=True, text=True, env=comum.env_python())
    if r.returncode != 0:
        rel.add("vermelho", "venv PY", "%s não importou PIL/numpy/cv2/jsonschema: %s" % (comum.PY, r.stderr.strip()[-300:]))
    else:
        v = r.stdout.split()
        rel.add("ok", "venv PY", "Python %s, PIL %s, numpy %s, cv2 %s" % tuple(v[:4]))
    if not os.path.isfile(comum.PYW):
        rel.add("vermelho", "venv PYW", "não existe: %s" % comum.PYW)
    elif rapido:
        rel.add("info", "venv PYW", "%s (import do faster-whisper pulado com --rapido)" % comum.PYW)
    else:
        r = subprocess.run([comum.PYW, "-B", "-c", "import faster_whisper; print(faster_whisper.__version__)"],
                           capture_output=True, text=True, env=comum.env_python())
        if r.returncode != 0:
            rel.add("vermelho", "venv PYW", "faster-whisper não importou: %s" % r.stderr.strip()[-300:])
        else:
            rel.add("ok", "venv PYW", "faster-whisper %s" % r.stdout.strip())
    if os.path.isdir(comum.MODELO_WHISPER):
        rel.add("ok", "whisper small", "no cache (%s); nunca baixar outro modelo" % comum.MODELO_WHISPER)
    else:
        rel.add("vermelho", "whisper small", "o modelo small não está no cache: %s" % comum.MODELO_WHISPER)


def _ext_ligadas():
    """Mídia de extensão ligada no public-kit (pelo midia.json de cada extensão)."""
    ligadas = []
    pasta_ext = os.path.join(comum.RM, "src", "kit", "ext")
    for mj in sorted(glob.glob(os.path.join(pasta_ext, "*", "midia.json"))):
        nome = os.path.basename(os.path.dirname(mj))
        try:
            import kit_ext
            pares = kit_ext.pares(comum.le_json(mj))
        except Exception as e:  # noqa: BLE001
            ligadas.append((nome, -1, "midia.json ilegível: %s" % e))
            continue
        n = sum(1 for o, d in pares if os.path.isfile(d) and os.path.isfile(o) and os.path.samefile(o, d))
        if n:
            ligadas.append((nome, n, ""))
    return ligadas


def confere_public_kit(rel):
    pk = comum.PUBLIC_KIT
    if not os.path.isdir(pk):
        rel.add("vermelho", "public-kit", "não existe: %s" % pk)
        return
    ruins = []
    total = 0
    tamanho = 0
    for raiz, _dirs, arqs in os.walk(pk):
        for n in arqs:
            p = os.path.join(raiz, n)
            relp = comum.barra(os.path.relpath(p, pk))
            st = os.stat(p)
            total += 1
            tamanho += st.st_size
            if relp in SEM_LINK_OK:
                continue
            if st.st_nlink < 2:
                ruins.append("%s (st_nlink %d)" % (relp, st.st_nlink))
    for f in FIXOS_PUBLIC_KIT:
        p = os.path.join(pk, f)
        o = os.path.join(comum.RM, "public-guia", f.replace("telas/", "telas/"))
        if not os.path.isfile(p):
            ruins.append("%s não existe" % f)
        elif os.path.isfile(o) and not os.path.samefile(o, p):
            ruins.append("%s não é o mesmo arquivo do public-guia" % f)
        elif os.path.isfile(o) and os.path.getsize(o) != os.path.getsize(p):
            ruins.append("%s com tamanho diferente do public-guia" % f)
    if ruins:
        rel.add("aviso", "public-kit", "%d arquivo(s) fora da regra (hardlink): %s" % (len(ruins), "; ".join(ruins[:8])))
    else:
        rel.add("ok", "public-kit", "%d arquivos, %.1f MB, todos hardlink (menos os LEIA-ME); os %d fixos são os do "
                "public-guia" % (total, tamanho / 1048576, len(FIXOS_PUBLIC_KIT)))
    if tamanho > 40 * 1048576:
        rel.add("aviso", "public-kit tamanho", "%.1f MB: o bundler copia o public inteiro pro Temp a cada render"
                % (tamanho / 1048576))
    for nome, n, erro in _ext_ligadas():
        if n < 0:
            rel.add("aviso", "ext %s" % nome, erro)
        else:
            rel.add("aviso", "ext %s" % nome, "%d arquivo(s) de mídia ligado(s) no public-kit: desligar depois do "
                    "render (kit.py ext-desliga %s)" % (n, nome))
    # GLB da biblioteca ligados por peça em public-kit/3d/biblioteca (frente MODELOS NO RENDER, 03/10)
    try:
        import kit_modelos
        lig = kit_modelos.ligados()
    except Exception as e:  # noqa: BLE001
        rel.add("aviso", "modelos ligados", "não deu pra ler public-kit/3d/biblioteca: %s" % e)
        return
    if not lig:
        rel.add("ok", "modelos ligados", "nenhum GLB da biblioteca no public-kit (entram por peça: kit.py modelos, "
                "props, stills e render ligam; o celular e o relógio do guia são fixos)")
        return
    mb = sum(x["mb"] for x in lig)
    lista = "; ".join("%s (%.1f MB%s)" % (x["id"] or x["rel"], x["mb"], (", cena de " + ", ".join(x["pecas"]))
                                          if x["pecas"] else "") for x in lig[:10])
    rel.add("aviso", "modelos ligados", "%d GLB em public-kit/3d/biblioteca (%.1f MB, vão no bundle de todo render): %s; "
            "desligar depois (kit.py modelos <peça> --desliga, ou limpa <peça> --entregue)" % (len(lig), mb, lista))
    estranhos = [x["rel"] for x in lig if not x["mesmoArquivo"]]
    if estranhos:
        rel.add("aviso", "modelos ligados", "%d arquivo(s) em 3d/biblioteca que não são o GLB do catálogo (outro inode "
                "ou id desconhecido): %s" % (len(estranhos), ", ".join(estranhos[:6])))


def confere_catalogos(rel, rapido):
    if rapido:
        rel.add("info", "catálogos", "valida.py pulado com --rapido")
        return
    r = subprocess.run([comum.PY, "-B", os.path.join(comum.KIT, "catalogos", "valida.py"), "--json"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", env=comum.env_python())
    try:
        j = json.loads(r.stdout)
        erros, avisos = j.get("erros", []), j.get("avisos", [])
    except (ValueError, AttributeError):
        erros, avisos = (["valida.py não devolveu JSON (código %d)" % r.returncode] if r.returncode else []), []
    if erros:
        rel.add("vermelho", "catálogos", "valida.py: %d erro(s): %s" % (len(erros), "; ".join(map(str, erros[:5]))))
    else:
        rel.add("ok", "catálogos", "valida.py: 0 erro, %d aviso(s)" % len(avisos))


def confere_referencias(rel, referencia=None):
    if referencia:
        regs = [(os.path.basename(os.path.dirname(os.path.abspath(referencia))) or "teste", os.path.abspath(referencia))]
    else:
        regs = [(os.path.basename(os.path.dirname(p)), p) for p in sorted(glob.glob(os.path.join(comum.PECAS, "*",
                                                                                                "_referencia.json")))]
    if not regs:
        rel.add("info", "referências", "nenhum pecas/*/_referencia.json")
    for peca, arq in regs:
        cmd = [comum.PY, "-B", os.path.join(comum.KIT, "catalogos", "catalogo.py"), "referencia", peca, "--json"]
        if referencia:
            cmd += ["--arquivo", arq]
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", env=comum.env_python())
        try:
            j = json.loads(r.stdout)
        except ValueError:
            rel.add("vermelho", "referência %s" % peca, "catalogo.py referencia falhou (código %d): %s"
                    % (r.returncode, (r.stderr or r.stdout).strip()[-300:]))
            continue
        mudou = [i for i in j["itens"] if i["estado"] in ("mudou", "ausente")]
        if mudou:
            det = "; ".join("%s %s (%s)" % (i["id"], i["estado"].upper(), "; ".join(i["detalhes"])) for i in mudou)
            rel.add("vermelho", "referência %s" % peca, "MUDOU: %s [%s]" % (det, arq))
        else:
            extra = (" (avisos: %s)" % "; ".join(j["avisos"])) if j.get("avisos") else ""
            rel.add("ok", "referência %s" % peca, "%d arquivos iguais ao registro congelado%s" % (len(j["itens"]), extra))


def confere_disco(rel):
    livre = escrita.livre_mb()
    if livre < comum.DISCO_STILLS_MB:
        rel.add("vermelho", "disco", "%.0f MB livres: render e stills bloqueados (render pede 400 MB, stills 250 MB)" % livre)
    elif livre < comum.DISCO_RENDER_MB:
        rel.add("aviso", "disco", "%.0f MB livres: render bloqueado (pede 400 MB); stills liberados" % livre)
    elif livre < comum.DISCO_AVISO_MB:
        rel.add("aviso", "disco", "%.0f MB livres (abaixo de 500 MB): render liberado, um de cada vez" % livre)
    else:
        rel.add("ok", "disco", "%.0f MB livres" % livre)
    sobras = limpa.candidatas(tudo=True)
    if sobras:
        mb = sum(limpa._tamanho(p) for p in sobras) / 1048576
        rel.add("aviso", "Temp", "%d pasta(s) de render na raiz do Temp (%.1f MB), de render fora do kit ou de antes da "
                "trava: kit.py limpa --tudo (o kit recusa se houver render rodando)" % (len(sobras), mb))
    else:
        rel.add("ok", "Temp", "nenhuma sobra de render na raiz do Temp (%s)" % comum.temp())


def confere_render(rel):
    """Quem está renderizando: a trava de render do kit, os renders do Remotion rodando e as sobras de Temp próprio."""
    try:
        import trava
        for nivel, nome, msg in trava.resumo():
            rel.add(nivel, nome, msg)
    except Exception as e:  # noqa: BLE001
        rel.add("aviso", "trava de render", "não consegui conferir (%s: %s)" % (type(e).__name__, e))


def doutor(referencia=None, rapido=False):
    rel = Relatorio()
    confere_ferramentas(rel)
    confere_venvs(rel, rapido)
    confere_public_kit(rel)
    confere_catalogos(rel, rapido)
    confere_referencias(rel, referencia)
    confere_disco(rel)
    confere_render(rel)
    v = rel.vermelhos
    print("\ndoutor: %d item(ns), %d vermelho(s), %d aviso(s)" % (len(rel.itens), len(v),
                                                                  sum(1 for i in rel.itens if i["nivel"] == "aviso")))
    return rel


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="ambiente.py", description="Doutor do kit de motion (K07).")
    ap.add_argument("--referencia", help="outro _referencia.json (pro teste)")
    ap.add_argument("--rapido", action="store_true")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    rel = doutor(a.referencia, a.rapido)
    if a.json:
        print(json.dumps({"itens": rel.itens, "vermelhos": len(rel.vermelhos)}, ensure_ascii=False, indent=2))
    return 1 if rel.vermelhos else 0


if __name__ == "__main__":
    sys.exit(main())
