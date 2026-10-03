"""Prova de render dos modelos 3D do catálogo: kit.py prova-modelos (frente MODELOS NO RENDER, 03/10).

Cada modelo é montado pelo montaProps (RM/src/kit/cli/prova-modelos.mjs, numa peça de teste com um objeto só): sai
como sairia numa peça (escala, rotacaoBase, pivô, materiais, cores, sombra e o render.publicKit). O KitProvaModelo só
enquadra o objeto pela caixa, em duas vistas (de frente e 3/4), com a luz e o papel do guia. Por lote:
  1. monta as props (node prova-modelos.mjs; com --sem-decisao, o modelo de decisão pendente entra só na prova);
  2. liga no public-kit os GLB do lote (3d/biblioteca/<id>.glb) e a tela de teste do notebook;
  3. espera a vez na trava de render (também entre sessões), exige 400 MB livres e roda o stills.mjs com o vigia
     de disco e Temp próprio (apagado no fim);
  4. monta a folha de contato do lote (KIT/provas/modelos/render/lote-NN.jpg: cada modelo com as duas vistas, o
     status, se entra no render, o sHeroi e a diferença entre a caixa medida no navegador e a das props) e apaga os PNG;
  5. desliga os GLB que ligou (fica o que alguma peça usa).
Grava o resumo em KIT/provas/modelos/render/provas-render.json (mescla com o que já existe, por id) e, com
--grava-catalogo, o provaRender de cada modelo em KIT/catalogos/modelos/revisao-render.json (só esse campo).

Uso (sempre com python -B):
    python -B prova_modelos.py <id> [<id> ...] [--lote 8] [--sem-decisao] [--grava-catalogo] [--simula]
    python -B prova_modelos.py --todos [--lote 8] [--sem-decisao] [--grava-catalogo]
Código: 0 tudo certo; 1 erro de montagem ou de still; 2 uso errado; 3 sem disco ou sem a vez na trava.
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import datetime  # noqa: E402
import io  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
import time  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
import kit_modelos  # noqa: E402
import trava  # noqa: E402
import vigia  # noqa: E402
from comum import escrita  # noqa: E402
from kit_modelos import catalogo  # noqa: E402

PECA = "_prova-modelos"
SAIDA = comum.barra(os.path.join(comum.KIT, "provas", "modelos", "render"))
RESUMO = SAIDA + "/provas-render.json"
TRABALHO = SAIDA + "/_trabalho"  # props do lote, config do stills.mjs, PNG e log do navegador; sai no fim
CLI = comum.CLI + "/prova-modelos.mjs"
TELA_NOTEBOOK = SAIDA + "/tela-teste-notebook.png"
TELA_NOTEBOOK_PK = comum.PUBLIC_KIT + "/pecas/%s/telas/tela-teste-notebook.png" % PECA
DISCO_MB = 400
REVISAO = comum.barra(os.path.join(comum.KIT, "catalogos", "modelos", "revisao-render.json"))
FORA = ("proc-cena-guia",)  # cena inteira, não um objeto


def ids_todos():
    out = []
    for it in catalogo.carrega("modelos")["itens"]:
        if it["id"] in FORA or it.get("tipo") == "blend" or it.get("status") == "reprovado":
            continue
        r = it.get("render") if isinstance(it.get("render"), dict) else {}
        if r.get("tipoObjeto"):
            out.append(it["id"])
    return out


def fonte(tam, peso=600):
    from PIL import ImageFont
    f = ImageFont.truetype(comum.SORA, tam)
    try:
        f.set_variation_by_axes([peso])
    except Exception:  # noqa: BLE001
        pass
    return f


def tela_notebook():
    """Cartão de teste 2560 x 1600 pra conferir a orientação da tela do notebook (TOPO em cima, texto legível)."""
    if os.path.isfile(TELA_NOTEBOOK):
        return
    from PIL import Image, ImageDraw
    im = Image.new("RGB", (2560, 1600), (255, 255, 255))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 2560, 220], fill=(242, 100, 60))
    d.text((80, 40), "TOPO", font=fonte(150, 800), fill=(255, 255, 255))
    d.text((80, 760), "esquerda", font=fonte(96), fill=(27, 30, 36))
    d.text((1280, 820), "tela de teste", font=fonte(150, 800), fill=(27, 30, 36), anchor="mm")
    d.rectangle([0, 1480, 2560, 1600], fill=(241, 238, 233))
    buf = io.BytesIO()
    im.save(buf, "PNG")
    escrita.grava_bytes(TELA_NOTEBOOK, buf.getvalue(), cria_pasta=True)


def liga_lote(modelos, simula):
    """Liga os GLB do lote e a tela de teste; devolve os destinos que esta execução criou (pra desligar no fim)."""
    criados = []
    idx = catalogo.indice("modelos")
    for m in modelos:
        o = m.get("objeto") or {}
        rel = o.get("arquivo")
        if not rel:
            continue
        destino = comum.barra(os.path.join(comum.PUBLIC_KIT, *rel.split("/")))
        origem = idx[m["id"]]["arquivo"]
        if os.path.lexists(destino):
            if not (os.path.isfile(destino) and os.path.samefile(origem, destino)):
                raise comum.ErroSaida("%s existe e não é o GLB de %s: não mexi" % (destino, m["id"]))
            continue
        if simula:
            print("  ligaria %s -> %s" % (origem, destino))
            continue
        escrita.liga(origem, destino, cria_pasta=True)
        criados.append(destino)
    if any((m.get("objeto") or {}).get("tipo") == "aparelho" and "notebook" in m["id"] for m in modelos):
        if not simula:
            tela_notebook()
            if not os.path.lexists(TELA_NOTEBOOK_PK):
                escrita.liga(TELA_NOTEBOOK, TELA_NOTEBOOK_PK, cria_pasta=True)
                criados.append(TELA_NOTEBOOK_PK)
    return criados


def desliga_criados(criados):
    usos = kit_modelos._cenas_das_pecas(so_em_andamento=True)
    idx = catalogo.indice("modelos")
    por_destino = {}
    for it in idx.values():
        r = it.get("render") if isinstance(it.get("render"), dict) else {}
        if r.get("publicKit"):
            por_destino[comum.barra(os.path.join(comum.PUBLIC_KIT, *r["publicKit"].split("/")))] = it
    for d in criados:
        it = por_destino.get(d)
        if it and any(it["id"] in lista for lista in usos.values()):
            print("  ficou %s (uma peça usa)" % d)
            continue
        if os.path.isfile(d):
            os.remove(d)
    for pasta in (kit_modelos.PASTA, os.path.dirname(TELA_NOTEBOOK_PK), os.path.dirname(os.path.dirname(TELA_NOTEBOOK_PK))):
        try:
            if os.path.isdir(pasta) and not os.listdir(pasta):
                os.rmdir(pasta)
        except OSError:
            pass


def caixas_do_log(arq_logs):
    out, avisos = {}, {}
    if not os.path.isfile(arq_logs):
        return out, avisos
    doc = comum.le_json(arq_logs)
    for ln in doc.get("logs") or []:
        t = str(ln.get("texto") or "")
        if t.startswith("CAIXA_MEDIDA"):
            try:
                j = json.loads(t[len("CAIXA_MEDIDA"):].strip())
                out[j.get("modelo")] = j
            except ValueError:
                pass
        elif ln.get("tipo") in ("error", "warning") or "KIT_AVISO" in t:
            if "THREE.Clock" in t or "X4122" in t or "Texture marked for update but no image data" in t:
                continue  # avisos normais do three (README, Problemas; o último é o calendário clay antes da textura)
            avisos.setdefault("geral", []).append(t[:300])
    return out, avisos


def dif_mm(medida, props):
    if not medida or not props:
        return None
    return round(1000 * max(abs(a - b) for a, b in zip(medida["min"] + medida["max"], props["min"] + props["max"])), 2)


def folha(lote, modelos, pngs, destino):
    """Folha de contato do lote: 2 modelos por linha, cada um com a vista de frente e a 3/4 (recorte quadrado do
    centro do quadro, onde o KitProvaModelo enquadra o objeto) e uma faixa com id, status, entrada e números."""
    from PIL import Image, ImageDraw
    lado, faixa, cols = 360, 92, 2
    larg_cel = 2 * lado + 24
    linhas = (len(modelos) + cols - 1) // cols
    im = Image.new("RGB", (cols * larg_cel + 24, 70 + linhas * (lado + faixa + 16)), (255, 255, 255))
    d = ImageDraw.Draw(im)
    d.text((24, 18), "Lote %02d: modelos no render (KitProvaModelo, objeto montado pelo montaProps; de frente e 3/4)"
           % lote, font=fonte(26, 700), fill=(27, 30, 36))
    f1, f2 = fonte(20, 700), fonte(15, 500)
    for i, m in enumerate(modelos):
        x0 = 24 + (i % cols) * larg_cel
        y0 = 70 + (i // cols) * (lado + faixa + 16)
        for k, vista in enumerate(("frente", "3/4")):
            p = pngs.get((m["id"], vista))
            if p and os.path.isfile(p):
                q = Image.open(p).convert("RGB")
                w, h = q.size
                topo = (h - w) // 2
                q = q.crop((0, topo, w, topo + w)).resize((lado, lado), Image.LANCZOS)
                im.paste(q, (x0 + k * (lado + 4), y0))
            else:
                d.rectangle([x0 + k * (lado + 4), y0, x0 + k * (lado + 4) + lado, y0 + lado], outline=(203, 197, 188))
                d.text((x0 + k * (lado + 4) + 20, y0 + lado // 2), "sem still", font=f1, fill=(184, 61, 28))
        cor = (27, 30, 36) if m.get("ok") else (184, 61, 28)
        d.text((x0, y0 + lado + 6), m["id"], font=f1, fill=cor)
        d.text((x0, y0 + lado + 32), m.get("linha1", ""), font=f2, fill=(82, 78, 72))
        d.text((x0, y0 + lado + 54), m.get("linha2", ""), font=f2, fill=(82, 78, 72))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=85)
    escrita.grava_bytes(destino, buf.getvalue(), cria_pasta=True)
    return destino


def roda_lote(n, ids, a, resumo):
    trab = TRABALHO + "/lote-%02d.json" % n
    pasta_png = TRABALHO + "/png-%02d" % n
    print("\n== lote %02d: %s ==" % (n, ", ".join(ids)), flush=True)
    cmd = [comum.NODE, CLI, trab] + ids + (["--sem-decisao"] if a.sem_decisao else [])
    cod = comum.roda(cmd, cwd=comum.RM, simula=a.simula)
    if a.simula:
        return 0
    if not os.path.isfile(trab):
        raise comum.ErroSaida("o prova-modelos.mjs não gravou %s" % trab)
    doc = comum.le_json(trab)
    modelos = doc["modelos"]
    ok = [m for m in modelos if m["ok"]]
    falhas = 1 if cod != 0 else 0
    idx = catalogo.indice("modelos")
    trabalhos = []
    for m in ok:
        for t in m["trabalhos"]:
            trabalhos.append({"composicao": "KitProvaModelo", "props": t["props"], "quadros": [0],
                              "prefixo": "%s--%s-" % (m["id"], "frente" if t["vista"] == "frente" else "34")})
    pngs = {}
    criados = []
    try:
        with trava.render(PECA, "prova-modelos"):
            escrita.exige_disco(DISCO_MB, "a prova de modelos (lote %02d)" % n)
            criados = liga_lote(ok, a.simula)
            cfg = {"publicDir": comum.PUBLIC_KIT, "saida": pasta_png, "trabalhos": trabalhos,
                   "logs": pasta_png + "/logs.json", "limiteDiscoMb": comum.DISCO_STILLS_MB}
            escrita.grava_json(TRABALHO + "/stills-%02d.json" % n, cfg, cria_pasta=True)
            os.makedirs(pasta_png, exist_ok=True)
            with trava.temp_proprio(PECA, "prova-modelos") as tmp:
                c = [comum.NODE, comum.STILLS_MJS, TRABALHO + "/stills-%02d.json" % n]
                print("$ " + comum.mostra(c, comum.RM) + "   (vigia: limite %d MB; Temp próprio %s)"
                      % (comum.DISCO_STILLS_MB, tmp), flush=True)
                codigo, info = vigia.roda(c, cwd=comum.RM, limite_mb=comum.DISCO_STILLS_MB, env=trava.env_temp(tmp),
                                          temp_privado=tmp)
            if codigo != 0:
                falhas = 1
                print("ERRO: stills.mjs saiu com código %d" % codigo)
    finally:
        desliga_criados(criados)
    caixas, avisos_nav = caixas_do_log(pasta_png + "/logs.json")
    for m in modelos:
        for vista, pre in (("frente", "frente"), ("3/4", "34")):
            p = "%s/%s--%s-0000.png" % (pasta_png, m["id"], pre)
            if os.path.isfile(p):
                pngs[(m["id"], vista)] = p
    destino = SAIDA + "/%s-%02d.jpg" % (a.folha_nome, n)
    agora = datetime.date.today().isoformat()
    for pos, m in enumerate(modelos):
        it = idx.get(m["id"], {})
        entra, _motivo = catalogo.entra_no_render(it)
        cm = caixas.get(m["id"])
        dmm = dif_mm(cm, m.get("caixaProps"))
        r = it.get("render") if isinstance(it.get("render"), dict) else {}
        tam = cm.get("tamanho") if cm else None
        m["linha1"] = "%s | entra: %s%s" % (it.get("status"), entra, " | prova sem a decisão do Pedro" if m.get("semDecisao") else "")
        m["linha2"] = "%s | caixa %s m | medida x props %s" % (
            ("sHeroi %s" % r.get("sHeroi")) if r.get("sHeroi") else "procedural (%s)" % r.get("tipoObjeto")
            if not r.get("publicKit") else "sem sHeroi", " x ".join("%.3f" % v for v in tam) if tam else "?",
            ("%.2f mm" % dmm) if dmm is not None else "(sem caixa nas props)")
        if not ((m["id"], "frente") in pngs and (m["id"], "3/4") in pngs):
            falhas = 1
        resumo[m["id"]] = {
            "data": agora, "lote": n, "folha": destino, "posicao": pos + 1, "ok": bool(m["ok"]) and (m["id"], "frente") in pngs,
            "semDecisao": m.get("semDecisao", False), "erros": m.get("erros", []), "avisos": m.get("avisos", []),
            "arquivo": (m.get("objeto") or {}).get("arquivo"), "caixaProps": m.get("caixaProps"),
            "caixaMedida": {k: cm[k] for k in ("min", "max", "tamanho")} if cm else None, "difCaixaMm": dmm,
        }
    if avisos_nav.get("geral"):
        print("avisos do navegador no lote %02d: %s" % (n, " | ".join(sorted(set(avisos_nav["geral"])))[:1500]))
        for m in modelos:
            if m["id"] in resumo:
                resumo[m["id"]]["avisosNavegador"] = sorted(set(x for x in avisos_nav["geral"] if m["id"] in x))
    folha(n, modelos, pngs, destino)
    print("folha: %s" % destino)
    # disco: os PNG só servem pra folha (a pasta de trabalho sai no fim; --mantem guarda)
    if not a.mantem:
        for p in pngs.values():
            if os.path.isfile(p) and os.stat(p).st_nlink == 1:
                os.remove(p)
    return falhas


def grava_catalogo(resumo):
    doc = comum.le_json(REVISAO)
    itens = doc.setdefault("itens", {})
    for mid, r in sorted(resumo.items()):
        if not r.get("ok"):
            continue
        it = itens.setdefault(mid, {})
        it["provaRender"] = {
            "data": r["data"], "folha": r["folha"], "lote": r["lote"], "posicao": r["posicao"],
            "vistas": "de frente (0 grau, 8 de elevação) e 3/4 (34 graus, 14 de elevação)",
            "composicao": "KitProvaModelo, com o objeto montado pelo montaProps (RM/src/kit/cli/prova-modelos.mjs)",
            "difCaixaMm": r.get("difCaixaMm"), "semDecisao": bool(r.get("semDecisao")),
        }
    escrita.grava_json(REVISAO, doc)
    print("provaRender gravado em %s (%d modelo(s))" % (REVISAO, sum(1 for r in resumo.values() if r.get("ok"))))


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="prova_modelos.py", description=__doc__.split("\n")[0])
    ap.add_argument("ids", nargs="*", help="ids do catálogo de modelos")
    ap.add_argument("--todos", action="store_true", help="todos os GLB e procedurais que têm bloco render")
    ap.add_argument("--lote", type=int, default=8, help="modelos por lote (padrão 8; 2 stills por modelo)")
    ap.add_argument("--sem-decisao", action="store_true",
                    help="modelo de decisão pendente entra só na prova (o kit continua recusando numa peça)")
    ap.add_argument("--grava-catalogo", action="store_true", help="grava o provaRender no revisao-render.json")
    ap.add_argument("--simula", action="store_true")
    ap.add_argument("--mantem", action="store_true", help="guarda a pasta de trabalho (PNG, props e log do navegador)")
    ap.add_argument("--folha-nome", default="lote", help="começo do nome das folhas (padrão lote: lote-01.jpg...)")
    ap.add_argument("--espera", type=float, help="minutos de espera pela trava de render (padrão 40)")
    a = ap.parse_args(argv)
    if a.espera is not None:
        os.environ["KIT_TRAVA_ESPERA_MIN"] = str(a.espera)
    ids = ids_todos() if a.todos else a.ids
    if not ids:
        print("nada a provar: dê os ids ou --todos")
        return 2
    idx = catalogo.indice("modelos")
    fora = [i for i in ids if i not in idx]
    if fora:
        print("não estão no catálogo: %s" % ", ".join(fora))
        return 2
    resumo = comum.le_json(RESUMO).get("modelos", {}) if os.path.isfile(RESUMO) else {}
    inicio = time.time()
    falhas = 0
    try:
        for k in range(0, len(ids), max(1, a.lote)):
            falhas += roda_lote(k // max(1, a.lote) + 1, ids[k:k + max(1, a.lote)], a, resumo)
    except comum.ErroSaida as e:
        print("erro: %s" % e)
        return e.codigo
    except escrita.DiscoInsuficiente as e:
        print("erro: %s" % e)
        return 3
    if a.simula:
        return 0
    if not a.mantem and os.path.isdir(TRABALHO):
        import limpa
        limpa.apaga_arvore(TRABALHO)
    escrita.grava_json(RESUMO, {"versao": 1, "geradoEm": datetime.datetime.now().isoformat(timespec="seconds"),
                                "geradoPor": "KIT/scripts/prova_modelos.py (frente MODELOS NO RENDER)",
                                "modelos": resumo}, cria_pasta=True)
    if a.grava_catalogo:
        grava_catalogo(resumo)
    print("\nresumo: %s; %d lote(s); %.0f s; %s" % (RESUMO, (len(ids) + a.lote - 1) // a.lote, time.time() - inicio,
                                                  "tudo certo" if not falhas else "%d lote(s) com falha" % falhas))
    return 0 if not falhas else 1


if __name__ == "__main__":
    sys.exit(main())
