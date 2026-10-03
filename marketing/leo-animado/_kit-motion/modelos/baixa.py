"""Download dos modelos escolhidos do pacote K09 (kit de motion do Legalizaí), um de cada vez.

Contrato: KIT/DESENHO.md, seção 12 (orçamento: até 18 MB de modelos, nenhum download acima de 15 MB, um download
por vez, parar abaixo de 400 MB livres no C:).

Uso (sempre com python -B):
    python -B baixa.py polyhaven <id> <pasta> [--res 1k]    gltf + bin + texturas da API do Poly Haven
    python -B baixa.py arquivo <url> <pasta/arquivo>          um arquivo só (GLB do Poly Pizza)

Antes de cada arquivo confere o disco (400 MB livres mais o tamanho) e o limite de 15 MB por download; no Poly
Haven confere o md5 de cada arquivo contra o da API. Grava os arquivos pelo KIT/lib/escrita.py (temporário e
os.replace) e imprime um registro JSON {fonte, id, pagina, api, data, arquivos [{url, caminho, tamanho, md5,
md5Api}], total} pro baixados.md.
"""
import datetime
import hashlib
import json
import os
import sys
import urllib.request

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(AQUI)
if not os.path.isfile(os.path.join(KIT, "lib", "escrita.py")):
    KIT = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion"
sys.path.insert(0, os.path.join(KIT, "lib"))
import escrita  # noqa: E402

AGENTE = "legalizai-kit-motion-k09/1.0 (download unico, sem robo em massa)"
LIMITE_DOWNLOAD = 15 * 1024 * 1024
MINIMO_MB = 400


def _abre(url, tempo=60):
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    return urllib.request.urlopen(req, timeout=tempo)


def _json(url):
    with _abre(url) as r:
        return json.loads(r.read().decode("utf-8"))


def _confere_antes(tamanho, rotulo):
    if tamanho is not None and tamanho > LIMITE_DOWNLOAD:
        raise SystemExit("recusado: %s tem %d bytes, acima do limite de 15 MB por download" % (rotulo, tamanho))
    escrita.exige_disco(MINIMO_MB + (tamanho or 0) / escrita.MB, "baixar %s" % rotulo)


def baixa_um(url, destino, tamanho_esperado=None, md5_esperado=None):
    """Baixa um arquivo pra memória (limite de 15 MB), confere tamanho e md5 e grava pelo escrita.py."""
    _confere_antes(tamanho_esperado, url)
    with _abre(url, 120) as r:
        tam_cab = r.headers.get("Content-Length")
        if tam_cab is not None and int(tam_cab) > LIMITE_DOWNLOAD:
            raise SystemExit("recusado: %s anuncia %s bytes, acima de 15 MB" % (url, tam_cab))
        dados = r.read(LIMITE_DOWNLOAD + 1)
    if len(dados) > LIMITE_DOWNLOAD:
        raise SystemExit("recusado: %s passou de 15 MB" % url)
    h = hashlib.md5(dados).hexdigest()
    if tamanho_esperado is not None and len(dados) != tamanho_esperado:
        raise SystemExit("tamanho diferente em %s: %d contra %d da API" % (url, len(dados), tamanho_esperado))
    if md5_esperado and h != md5_esperado:
        raise SystemExit("md5 diferente em %s: %s contra %s da API" % (url, h, md5_esperado))
    escrita.grava_bytes(destino, dados, cria_pasta=True)
    return {"url": url, "caminho": os.path.abspath(destino).replace("\\", "/"), "tamanho": len(dados), "md5": h,
            "md5Api": md5_esperado}


def polyhaven(ident, pasta, res="1k"):
    info = _json("https://api.polyhaven.com/info/%s" % ident)
    arquivos = _json("https://api.polyhaven.com/files/%s" % ident)
    g = arquivos["gltf"][res]["gltf"]
    lista = [(g["url"], os.path.basename(g["url"]), g["size"], g.get("md5"))]
    for rel, v in sorted(g.get("include", {}).items()):
        lista.append((v["url"], rel, v["size"], v.get("md5")))
    total = sum(x[2] for x in lista)
    _confere_antes(total, "%s (%s, total)" % (ident, res))
    feitos = []
    for url, rel, tam, h in lista:  # um arquivo por vez, com o disco conferido antes de cada um
        feitos.append(baixa_um(url, os.path.join(pasta, rel), tam, h))
    autores = info.get("authors") or {}
    return {
        "fonte": "Poly Haven", "id": ident, "resolucao": res, "pagina": "https://polyhaven.com/a/%s" % ident,
        "api": "https://api.polyhaven.com/files/%s" % ident, "titulo": info.get("name"),
        "autores": autores, "licenca": "CC0 1.0 (https://polyhaven.com/license)",
        "publicadoEm": datetime.datetime.fromtimestamp(info.get("date_published", 0), datetime.timezone.utc)
        .strftime("%Y-%m-%d"),
        "dimensoesMm": info.get("dimensions"), "polycount": info.get("polycount"),
        "data": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "arquivos": feitos, "total": sum(f["tamanho"] for f in feitos),
    }


def arquivo(url, destino):
    with _abre(url) as r:
        tam = r.headers.get("Content-Length")
    feito = baixa_um(url, destino, int(tam) if tam is not None else None)
    return {"fonte": "url", "data": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
            "arquivos": [feito], "total": feito["tamanho"]}


def _main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    if len(argv) >= 3 and argv[0] == "polyhaven":
        res = argv[argv.index("--res") + 1] if "--res" in argv else "1k"
        r = polyhaven(argv[1], argv[2], res)
    elif len(argv) == 3 and argv[0] == "arquivo":
        r = arquivo(argv[1], argv[2])
    else:
        print(__doc__)
        return 2
    print(json.dumps(r, ensure_ascii=False, indent=2))
    print("disco livre depois: %.0f MB" % escrita.livre_mb(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
