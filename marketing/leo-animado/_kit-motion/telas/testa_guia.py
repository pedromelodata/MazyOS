"""Teste das telas do guia pelo kit (pacote K04). Não grava nada.

Uso (venv do corte-viral):
    python -B testa_guia.py [--pasta <pasta montada>] [--sem-rascunhos]

Confere:
1. receitas: as 4 do guia (receitas/guia-{splash,inicio,inicio-pagar,imposto}.json) apontam pro
   conjunto 2026-10-02 com fundo #FFFFFF e não são históricas; as 4 guia-v3-* são do conjunto 2026-09,
   fundo #FAF8F5, com "historico": true e a nota de que não dá pra testar;
2. telas: as 4 montadas em memória são iguais pixel a pixel (numpy, as duas em RGB) às de
   GP/assets/telas/ e às cópias do REF (pecas/guia-pronta-2026-10-14/_referencia/), e o md5 dos bytes
   é o do _referencia.json;
3. regiões: iguais às constantes da seção 4.8 do DESENHO e às regiões da cenas.json do guia (K02);
4. pasta montada (padrão pecas/guia-pronta-2026-10-14/telas/): as 4 PNG iguais às de GP e às do REF,
   o regioes.json igual às constantes, as receitas/ iguais às do kit e o qa.jpg presente;
5. indício (não reprova): as guia-v3-* dão os tamanhos em bytes que o inventário de 01/10 registrou
   pras montadas antigas;
6. rascunhos (receitas/rascunhos/*.json): montam sem erro, em memória, e cada um diz o status, o
   conjunto e o motivo.

Sai com 0 quando 1 a 4 e 6 passam.
"""
import argparse
import hashlib
import json
import os
import sys

sys.dont_write_bytecode = True

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import monta  # noqa: E402

KIT = monta.KIT
RECEITAS = os.path.join(AQUI, "receitas")
GP_TELAS = monta.escrita.GP + "/assets/telas"
PECA = KIT + "/pecas/guia-pronta-2026-10-14"
REF_JSON = PECA + "/_referencia.json"
REF_PASTA = PECA + "/_referencia"
CENAS = PECA + "/cenas.json"
GUIA = ["guia-splash.json", "guia-inicio.json", "guia-inicio-pagar.json", "guia-imposto.json"]
GUIA_V3 = ["guia-v3-splash.json", "guia-v3-inicio.json", "guia-v3-inicio-pagar.json", "guia-v3-imposto.json"]
NOTA_V3 = "não testável: as montadas antigas foram regravadas em 02/10 às 11:30"
# constantes da seção 4.8 do DESENHO (as do tela.ts)
ESPERADO = {
    "card": {"x": 72, "y": 424, "w": 1146, "h": 486, "r": 46},
    "valor": {"x": 125, "y": 682, "fonte": "600 59px Sora", "cor": "#1B1E24"},
    "esqueleto": {"x": 123, "y": 739, "w": 389, "h": 119, "r": 28},
    "botaoPagar": {"x": 123, "y": 739, "w": 389, "h": 119, "r": 28},
    "botaoVer": {"x": 270, "y": 2676},
}
COLAS_V3_IMPOSTO = [[0, 88, 1290, 141, 220], [0, 200, 1290, 300, 332], [0, 2428, 1290, 2756, 2428]]
TAMANHOS_V3_INVENTARIO = {"tela-splash.png": 28967, "tela-inicio.png": 93140,
                          "tela-inicio-pagar.png": 108805, "tela-imposto.png": 51187}

falhas = []


def item(ok, texto, reprova=True):
    print("%s  %s" % ("ok    " if ok else ("FALHOU" if reprova else "aviso "), texto))
    if not ok and reprova:
        falhas.append(texto)


def md5_bytes(b):
    return hashlib.md5(b).hexdigest()


def le_json(caminho):
    with open(caminho, "r", encoding="utf-8") as f:
        return json.load(f)


def _main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(prog="testa_guia.py")
    ap.add_argument("--pasta", default=PECA + "/telas", help="pasta montada a conferir (padrão: a do guia no kit)")
    ap.add_argument("--sem-rascunhos", action="store_true")
    a = ap.parse_args(argv)

    print("1. receitas")
    for n in GUIA:
        d = le_json(os.path.join(RECEITAS, n))
        item(d["fonte"]["conjunto"] == "2026-10-02" and d.get("fundo") == "#FFFFFF" and not d.get("historico"),
             "%s: conjunto %s, fundo %s, historico %s" % (n, d["fonte"]["conjunto"], d.get("fundo"), d.get("historico", False)))
    for n in GUIA_V3:
        d = le_json(os.path.join(RECEITAS, n))
        ok = (d["fonte"]["conjunto"] == "2026-09" and d.get("fundo") == "#FAF8F5" and d.get("historico") is True
              and d.get("nota") == NOTA_V3)
        if n == "guia-v3-imposto.json":
            colas = [c["caixa"] + [c["y"]] for c in d["cola"]]
            ok = ok and colas == COLAS_V3_IMPOSTO
        item(ok, "%s: conjunto %s, fundo %s, historico %s, nota de não testável%s"
             % (n, d["fonte"]["conjunto"], d.get("fundo"), d.get("historico"), ", colas antigas do Imposto" if "imposto" in n else ""))

    print("2. telas (montadas em memória)")
    ref = le_json(REF_JSON)
    md5_ref = {os.path.basename(x["caminho"]): x["md5"] for x in ref["arquivos"] if x["id"].startswith("tela-")}
    res = monta.monta_receitas([os.path.join(RECEITAS, n) for n in GUIA], None, comparas=[GP_TELAS, REF_PASTA], grava=False)
    for t in res["telas"]:
        for c in t["comparacoes"]:
            item(c["estado"] == "igual", "%s %s contra %s%s" % (t["saida"], c["estado"], c["pasta"],
                                                              (" (" + c["detalhe"] + ")") if c["detalhe"] else ""))
        item(t["md5"] == md5_ref.get(t["saida"]), "%s: md5 dos bytes %s (REF %s)" % (t["saida"], t["md5"], md5_ref.get(t["saida"])))

    print("3. regiões")
    item(res["regioes"] == ESPERADO, "regiões montadas = constantes da seção 4.8: %s" % json.dumps(res["regioes"], ensure_ascii=False))
    if os.path.isfile(CENAS):
        inline = le_json(CENAS).get("regioes")
        if isinstance(inline, dict):
            inline = {k: v for k, v in inline.items() if not k.startswith("_")}
            item(res["regioes"] == inline, "regiões montadas = regiões da cenas.json do guia (K02)")

    print("4. pasta montada: %s" % a.pasta)
    if not os.path.isdir(a.pasta):
        item(False, "a pasta não existe")
    else:
        from PIL import Image
        for t in res["telas"]:
            cam = os.path.join(a.pasta, t["saida"])
            if not os.path.isfile(cam):
                item(False, "%s não existe" % cam)
                continue
            with Image.open(cam) as im:
                img = im.convert("RGB")
            for pasta in (GP_TELAS, REF_PASTA):
                estado, det = monta.compara(img, os.path.join(pasta, t["saida"]))
                item(estado == "igual", "%s da pasta %s contra %s%s" % (t["saida"], estado, pasta, (" (" + det + ")") if det else ""))
            st = os.stat(cam)
            item(monta.md5_arquivo(cam) == md5_ref.get(t["saida"]),
                 "%s: md5 do arquivo igual ao do REF (st_nlink %d)" % (t["saida"], st.st_nlink))
        rj = os.path.join(a.pasta, "regioes.json")
        item(os.path.isfile(rj) and le_json(rj) == ESPERADO, "regioes.json da pasta = constantes da seção 4.8")
        rec_pasta = os.path.join(a.pasta, "receitas")
        for n in GUIA:
            cp = os.path.join(rec_pasta, n)
            item(os.path.isfile(cp) and monta.md5_arquivo(cp) == monta.md5_arquivo(os.path.join(RECEITAS, n)),
                 "receitas/%s igual à do kit" % n)
        extras = sorted(set(os.listdir(rec_pasta)) - set(GUIA)) if os.path.isdir(rec_pasta) else []
        item(os.path.isdir(rec_pasta) and not extras,
             "receitas/ só com as 4 do guia%s" % (": sobra " + ", ".join(extras) if extras else ""))
        item(os.path.isfile(os.path.join(a.pasta, "qa.jpg")), "qa.jpg presente")

    print("5. indício: guia-v3-* contra os tamanhos do inventário de 01/10 (não reprova)")
    v3 = monta.monta_receitas([os.path.join(RECEITAS, n) for n in GUIA_V3], None, grava=False)
    for t in v3["telas"]:
        esp = TAMANHOS_V3_INVENTARIO[t["saida"]]
        item(t["bytes"] == esp, "%s (v3): %d bytes, inventário %d" % (t["saida"], t["bytes"], esp), reprova=False)

    if not a.sem_rascunhos:
        print("6. rascunhos")
        pasta_r = os.path.join(RECEITAS, "rascunhos")
        nomes = sorted(n for n in os.listdir(pasta_r) if n.endswith(".json")) if os.path.isdir(pasta_r) else []
        item(len(nomes) >= 3, "%d rascunho(s) em receitas/rascunhos" % len(nomes))
        for n in nomes:
            cam = os.path.join(pasta_r, n)
            d = le_json(cam)
            try:
                r = monta.monta_receitas([cam], None, grava=False)
                t = r["telas"][0]
                ok = bool(d.get("status")) and bool(d.get("motivo")) and d["fonte"]["conjunto"] in monta.CONJUNTOS
                if d["fonte"]["conjunto"] == "2026-09":
                    ok = ok and d.get("nota") == "conjunto antigo, fundo papel: só histórico, refazer quando houver captura"
                item(ok, "%s: monta %dx%d no conjunto %s, %d região(ões), status '%s'"
                     % (n, t["tamanho"][0], t["tamanho"][1], t["conjunto"], len(r["regioes"]), d.get("status")))
            except (monta.ErroReceita, OSError) as e:
                item(False, "%s: %s" % (n, e))

    print("resultado: %s" % ("tudo certo" if not falhas else "%d falha(s)" % len(falhas)))
    return 0 if not falhas else 1


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
