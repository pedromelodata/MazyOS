"""Stills pelo stills.mjs do K06, com o vigia de disco (pacote K07). Contrato: KIT/DESENHO.md, seções 7.1 e 7.4.

Monta o JSON de trabalhos do RM/src/kit/render/stills.mjs (um bundle e um navegador; várias composições no mesmo
bundle: KitMotion com as props da peça, GuiaPronta e as outras sem props), espera a vez na trava de render (trava.py,
também entre sessões), roda com o vigia (limite 250 MB) e com TEMP, TMP e TMPDIR numa pasta própria em
<Temp>/kit-motion/, e no fim apaga só essa pasta (03/10: a limpeza por janela de tempo apagava o bundle de outra
sessão). Os PNG vão pra <peça>/provas/stills/<prefixo><Composição><sufixo>-<quadro>.png. Com o public-kit padrão,
liga antes os GLB da cena no public-kit (kit_modelos.liga, dentro da trava).
Lotes (pro K12): --lote N, --depois "<comando>" (recebe o manifesto do lote no último argumento) e --apaga.
"""
import sys

sys.dont_write_bytecode = True

import os  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
import trava  # noqa: E402
import vigia  # noqa: E402
from comum import escrita  # noqa: E402


def pasta_stills(peca):
    return peca.caminho("provas", "stills")


def prefixo(peca, comp, extra=""):
    return "%s%s%s-" % (extra, comp, peca.sufixo)


def png(peca, comp, quadro, extra=""):
    return comum.barra(os.path.join(pasta_stills(peca), "%s%04d.png" % (prefixo(peca, comp, extra), int(quadro))))


def quadros_auto(peca, props):
    """Um quadro por âncora de batida (do qc/quadros<sufixo>.json), mais o primeiro e o último."""
    if not os.path.isfile(peca.quadros):
        raise comum.ErroSaida("stills auto precisa do %s (rode kit.py qc antes)" % peca.quadros, 2)
    q = comum.le_json(peca.quadros)
    fps = props.get("fps", 30)
    total = props["quadros"]
    qs = {0, total - 1}
    for a in q.get("ancoras") or []:
        qs.add(min(total - 1, max(0, int(round(a["t"] * fps)))))
    return sorted(qs)


def config(peca, quadros, composicoes, extra="", lote=None, depois=None, apaga=False, public=None, props=None):
    props_abs = comum.barra(os.path.abspath(props or peca.props))
    trabalhos = []
    for comp in composicoes:
        trabalhos.append({
            "composicao": comp,
            "props": props_abs if comp == "KitMotion" else None,
            "quadros": [int(x) for x in quadros],
            "prefixo": prefixo(peca, comp, extra),
        })
    cfg = {
        "publicDir": comum.barra(os.path.abspath(public or comum.PUBLIC_KIT)),
        "saida": pasta_stills(peca),
        "trabalhos": trabalhos,
        "logs": peca.saida("stills-logs", ".json", "provas"),
        "limiteDiscoMb": comum.DISCO_STILLS_MB,
    }
    if lote:
        cfg["lote"] = {"tamanho": int(lote), "depois": depois or [], "apaga": bool(apaga)}
    return cfg


def stills(peca, quadros, composicoes, prefixo_extra="", simula=False, lote=None, depois=None, apaga=False, public=None,
           props=None, rotulo="stills"):
    """Roda o stills.mjs e devolve os PNG (na ordem das composições e dos quadros). rotulo: o comando que aparece na
    trava de render e no doutor (stills, previa, capa ou final)."""
    arq = peca.saida("stills-trabalhos", ".json", "provas")
    cmd = [comum.NODE, comum.STILLS_MJS, arq]
    saidas = [png(peca, c, q, prefixo_extra) for c in composicoes for q in quadros]
    if simula:
        print("$ (grava %s: %s nos quadros %s; public %s)" % (arq, ", ".join(composicoes),
                                                               ", ".join(str(q) for q in quadros),
                                                               public or comum.PUBLIC_KIT))
        with trava.render(peca, rotulo, simula=True):
            comum.roda(cmd, cwd=comum.RM, simula=True)
        return saidas
    if "KitMotion" in composicoes and not os.path.isfile(props or peca.props):
        raise comum.ErroSaida("o KitMotion precisa das props: %s (rode kit.py props)" % (props or peca.props), 2)
    cfg = config(peca, quadros, composicoes, prefixo_extra, lote, depois, apaga, public, props)
    with trava.render(peca, rotulo):
        escrita.exige_disco(comum.DISCO_STILLS_MB, "os stills")
        if public is None and "KitMotion" in composicoes and os.path.isfile(peca.cena):
            import kit_modelos
            kit_modelos.liga(peca)  # com a trava na mão: o bundle copia o public-kit agora
        os.makedirs(pasta_stills(peca), exist_ok=True)
        escrita.grava_json(arq, cfg, cria_pasta=True)
        with trava.temp_proprio(peca, rotulo) as tmp:
            print("$ " + comum.mostra(cmd, comum.RM) + "   (com o vigia de disco: limite %d MB; Temp próprio %s)"
                  % (comum.DISCO_STILLS_MB, tmp), flush=True)
            codigo, info = vigia.roda(cmd, cwd=comum.RM, limite_mb=comum.DISCO_STILLS_MB, env=trava.env_temp(tmp),
                                      temp_privado=tmp)
    if codigo != 0:
        raise comum.ErroSaida("stills.mjs saiu com código %d%s" % (codigo, " (disco)" if info.get("abortou") else ""))
    if not lote or not apaga:
        faltam = [p for p in saidas if not os.path.isfile(p)]
        if faltam:
            raise comum.ErroSaida("faltam %d still(s): %s" % (len(faltam), ", ".join(faltam[:4])))
    return saidas
