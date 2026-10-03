"""Conferência dos modelos do pacote K09 (kit de motion do Legalizaí). Roda no Python do corte-viral, com -B:
    python -B confere_k09.py

Confere, e imprime "ok" ou "FALHOU" em cada linha:
1. os GLB de _assets-externos/kit-2026-10/modelos-3d: quantos são, total (até 18 MB) e maior arquivo (até 8 MB);
2. cada GLB: sem extensão obrigatória, sem Draco ou meshopt, tudo embutido; caixa, md5 e tamanho iguais aos da
   camada KIT/catalogos/modelos/aquisicoes-2026-10.json (caixa refeita pelo bbox_glb.py);
3. cada GLB importa no Blender 5.2 em segundo plano sem erro (blender/confere.py) e com os nós esperados;
4. notebooks: nós Base, Tampa e Tela; UV da Tela de 0 a 1, v = 1 na borda de cima e u = 0 na esquerda (no mundo,
   com a tampa aberta); até 20 mil triângulos e 1,5 MB;
5. símbolo: nós Simbolo, SimboloCorpo e SimboloFace; cor do corpo equivalente a #F2643C (tolerância de 2 por canal
   depois da conversão pra sRGB); check branco e fundo coral na textura da face; 0,36 m; o simbolo-9x16.blend com o
   md5 34a9188501af8a14eafe6b651d083c84 e sem .blend1;
6. Temp sem pastas blender_* e k09-* deixadas pelas rodadas (as criadas por esta conferência são apagadas aqui);
7. zero travessão (U+2014) e meia-risca (U+2013) em KIT/modelos, na camada do catálogo e no JSON dos GLB;
8. nenhum __pycache__ no kit.
Sai com código 1 se algo falhar.
"""
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import glb  # noqa: E402
import escrita  # noqa: E402

sys.path.insert(0, os.path.join(glb.KIT, "catalogos"))
import bbox_glb  # noqa: E402

EXT = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d"
CAMADA = os.path.join(glb.KIT, "catalogos", "modelos", "aquisicoes-2026-10.json")
BLENDER = "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe"
BLEND = "C:/MKT-INSTA/Content Legalizai/marketing/3d/simbolo/simbolo-9x16.blend"
BLEND_MD5 = "34a9188501af8a14eafe6b651d083c84"
CORAL = (242, 100, 60)
MB = 1024 * 1024
resultado = []


def ok(nome, cond, detalhe=""):
    resultado.append(bool(cond))
    print("%s  %s%s" % ("ok    " if cond else "FALHOU", nome, ("  [" + detalhe + "]") if detalhe else ""))


def _srgb(c):
    c = min(max(c, 0.0), 1.0)
    return round((c * 12.92 if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055) * 255)


def _temp_k09():
    t = tempfile.gettempdir()
    return {p for p in glob.glob(os.path.join(t, "blender_*")) + glob.glob(os.path.join(t, "k09-*")) if os.path.isdir(p)}


def confere_arquivos(camada):
    arquivos = sorted(glob.glob(EXT + "/*.glb"))
    total = sum(os.path.getsize(a) for a in arquivos)
    maior = max(arquivos, key=os.path.getsize)
    ok("%d GLB na pasta (esperado %d, um por item da camada)" % (len(arquivos), len(camada)),
       len(arquivos) == len(camada))
    ok("total %d bytes (%.2f MB) dentro de 18 MB" % (total, total / MB), total <= 18 * MB)
    ok("maior arquivo %s com %.2f MB, até 8 MB" % (os.path.basename(maior), os.path.getsize(maior) / MB),
       os.path.getsize(maior) <= 8 * MB)
    por_arquivo = {it["arquivo"]: it for it in camada}
    for a in arquivos:
        it = por_arquivo.get(a.replace("\\", "/"))
        nome = os.path.basename(a)
        if it is None:
            ok("%s está na camada do catálogo" % nome, False)
            continue
        g, _b = glb.le(a)
        prob = glb.problemas(g)
        ok("%s sem extensão obrigatória, sem compressão e tudo embutido" % nome, not prob, "; ".join(prob))
        cx = bbox_glb.caixa(a, it.get("escala") or 1)
        igual = all(abs(x - y) <= 1e-6 for k in ("min", "max", "tamanho") for x, y in zip(cx[k], it["caixa"][k]))
        ok("%s caixa igual à do catálogo %s" % (nome, cx["tamanho"]), igual)
        ok("%s md5 e tamanho iguais aos do catálogo" % nome,
           escrita.md5(a) == it["md5"] and os.path.getsize(a) == it["tamanho"])
    return arquivos


def confere_blender(arquivos, camada):
    antes = _temp_k09()
    r = subprocess.run([BLENDER, "--background", "--factory-startup", "--python",
                        os.path.join(AQUI, "blender", "confere.py"), "--"] + arquivos,
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    linhas = [json.loads(l[len("K09_CONFERE "):]) for l in r.stdout.splitlines() if l.startswith("K09_CONFERE ")]
    ok("Blender importou os %d GLB (código %d)" % (len(linhas), r.returncode), r.returncode == 0 and
       len(linhas) == len(arquivos))
    por_arquivo = {it["arquivo"]: it for it in camada}
    for d in linhas:
        it = por_arquivo[os.path.abspath(d["arquivo"]).replace("\\", "/")]
        nos = {o["nome"] for o in d.get("objetos", [])}
        esperados = set(it["malhas"].get("outras", [])) | {v for k, v in it["malhas"].items()
                                                           if k != "outras" and isinstance(v, str)}
        ok("%s importa sem erro no Blender, com os nós %s" % (os.path.basename(d["arquivo"]), sorted(esperados)),
           d["erro"] is None and esperados <= nos, d["erro"] or "faltam %s" % sorted(esperados - nos))
    novos = _temp_k09() - antes
    for p in novos:
        if os.path.basename(p).startswith(("blender_", "k09-")):
            shutil.rmtree(p, ignore_errors=True)  # só as pastas que esta rodada do Blender deixou
    ok("Temp sem pastas blender_* e k09-* (antes da conferência: %d; deixadas por ela e apagadas: %d)" %
       (len(antes), len(novos)), not antes and not (_temp_k09() - antes))


def _mundo(g):
    return {i: m for i, m in bbox_glb._percorre(g)}


def confere_notebook(caminho):
    nome = os.path.basename(caminho)
    g, b = glb.le(caminho)
    nomes = [n.get("name") for n in g["nodes"]]
    ok("%s tem os nós Base, Tampa e Tela" % nome, all(x in nomes for x in ("Base", "Tampa", "Tela")))
    it = nomes.index("Tela")
    tampa = nomes.index("Tampa")
    ok("%s: a Tela é filha da Tampa e a Tampa tem pivô na dobradiça (rotação em X)" % nome,
       it in g["nodes"][tampa].get("children", []) and abs(g["nodes"][tampa]["rotation"][1]) < 1e-9)
    p = g["meshes"][g["nodes"][it]["mesh"]]["primitives"][0]
    pos = glb.acessor(g, b, p["attributes"]["POSITION"])
    uv = glb.acessor(g, b, p["attributes"]["TEXCOORD_0"])
    m = _mundo(g)[it]
    w = [bbox_glb._aplica(m, q) for q in pos]
    us, vs = [t[0] for t in uv], [t[1] for t in uv]
    ok("%s: UV da Tela vai de 0 a 1 (u %.4f a %.4f, v %.4f a %.4f)" % (nome, min(us), max(us), min(vs), max(vs)),
       abs(min(us)) < 1e-6 and abs(max(us) - 1) < 1e-6 and abs(min(vs)) < 1e-6 and abs(max(vs) - 1) < 1e-6)
    ymax = max(q[1] for q in w)
    topo = [t[1] for q, t in zip(w, uv) if abs(q[1] - ymax) < 1e-6]
    xmin = min(q[0] for q in w)
    esq = [t[0] for q, t in zip(w, uv) if abs(q[0] - xmin) < 1e-6]
    ok("%s: v = 1 na borda de cima da tela (y no mundo %.4f) e u = 0 na esquerda" % (nome, ymax),
       topo and all(abs(v - 1) < 1e-6 for v in topo) and esq and all(abs(u) < 1e-6 for u in esq))
    tri = bbox_glb.info(caminho)["triangulos"]
    ok("%s: %d triângulos (até 20 mil) e %d bytes (até 1,5 MB)" % (nome, tri, os.path.getsize(caminho)),
       tri <= 20000 and os.path.getsize(caminho) <= 1.5 * MB)


def confere_simbolo(caminho):
    import io
    from PIL import Image
    import texturas
    nome = os.path.basename(caminho)
    g, b = glb.le(caminho)
    nomes = [n.get("name") for n in g["nodes"]]
    ok("%s tem os nós Simbolo, SimboloCorpo e SimboloFace" % nome,
       all(x in nomes for x in ("Simbolo", "SimboloCorpo", "SimboloFace")))
    corpo = g["nodes"][nomes.index("SimboloCorpo")]
    mat = g["materials"][g["meshes"][corpo["mesh"]]["primitives"][0]["material"]]
    fator = mat["pbrMetallicRoughness"]["baseColorFactor"]
    srgb = tuple(_srgb(c) for c in fator[:3])
    ok("%s: cor do corpo %s em sRGB contra #F2643C %s (tolerância 2)" % (nome, srgb, CORAL),
       all(abs(a - c) <= 2 for a, c in zip(srgb, CORAL)))
    face = g["nodes"][nomes.index("SimboloFace")]
    mface = g["materials"][g["meshes"][face["mesh"]]["primitives"][0]["material"]]
    idx = g["textures"][mface["pbrMetallicRoughness"]["baseColorTexture"]["index"]]["source"]
    _i, _n, _mime, dados = glb.imagens(g, b)[idx]
    im = Image.open(io.BytesIO(dados)).convert("RGB")
    lado = im.size[0]
    k = lado / texturas.VIEWBOX
    dentro = [(170, 98), (150, 120), (60, 115)]   # no meio dos braços do check (coordenadas do simbolo.svg)
    fora = [(40, 40), (40, 180), (180, 180), (110, 20)]
    px_dentro = [im.getpixel((int(x * k), int(y * k))) for x, y in dentro]
    px_fora = [im.getpixel((int(x * k), int(y * k))) for x, y in fora]
    ok("%s: check branco na textura da face %s" % (nome, px_dentro), all(min(p) >= 253 for p in px_dentro))
    ok("%s: fundo coral na textura da face %s" % (nome, px_fora),
       all(all(abs(a - c) <= 2 for a, c in zip(p, CORAL)) for p in px_fora))
    cx = bbox_glb.caixa(caminho)
    ok("%s: tamanho real %s m (0,36 x 0,36)" % (nome, cx["tamanho"]),
       abs(cx["tamanho"][0] - 0.36) < 1e-4 and abs(cx["tamanho"][1] - 0.36) < 1e-4)
    md5 = escrita.md5(BLEND)
    ok("simbolo-9x16.blend continua com o md5 %s e sem .blend1" % md5,
       md5 == BLEND_MD5 and not os.path.exists(BLEND + "1"))


def confere_textos():
    arquivos = [p for p in glob.glob(os.path.join(glb.KIT, "modelos", "**", "*"), recursive=True) if os.path.isfile(p)]
    arquivos.append(CAMADA)
    ruins = []
    for p in arquivos:
        texto = open(p, encoding="utf-8").read()
        if chr(0x2014) in texto or chr(0x2013) in texto:
            ruins.append(p)
    for a in glob.glob(EXT + "/*.glb"):
        g, _b = glb.le(a)
        t = json.dumps(g, ensure_ascii=False)
        if chr(0x2014) in t or chr(0x2013) in t:
            ruins.append(a)
    ok("zero travessão e meia-risca em %d arquivos do K09 e no JSON dos GLB" % len(arquivos), not ruins,
       "; ".join(ruins))
    caches = [p for p in glob.glob(os.path.join(glb.KIT, "**", "__pycache__"), recursive=True)]
    caches += glob.glob(EXT + "/**/__pycache__", recursive=True)
    ok("nenhum __pycache__ no kit", not caches, "; ".join(caches))


def principal():
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    with open(CAMADA, encoding="utf-8") as f:
        camada = json.load(f)["itens"]
    print("conferência do K09: %d itens na camada, %.0f MB livres no C:" % (len(camada), escrita.livre_mb()))
    escrita.exige_disco(400, "a conferência do K09")
    arquivos = confere_arquivos(camada)
    confere_blender(arquivos, camada)
    for a in arquivos:
        if os.path.basename(a).startswith("notebook-"):
            confere_notebook(a)
    confere_simbolo(EXT + "/simbolo_legalizai_proprio.glb")
    confere_textos()
    falhas = resultado.count(False)
    print("resultado: %d de %d ok%s" % (len(resultado) - falhas, len(resultado), "" if not falhas else ", %d falhas" % falhas))
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(principal())
