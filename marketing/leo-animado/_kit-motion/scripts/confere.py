"""Conferência do final (pacote K07). Contrato: KIT/DESENHO.md, seção 7.7. Grava saida/relatorio<sufixo>.md e .json.

- formato: 1080x1920 (o das props), fps e quadros certos, yuv420p, color_space bt709, color_range tv, áudio AAC 48 kHz
  estéreo;
- som: I = -14,0 +- 0,2 LUFS, pico real <= -1,5 dBTP, LRA (ebur128);
- cor: pra cada still de provas/stills/ (KitMotion<sufixo>-NNNN.png; --stills troca), o quadro NNNN do mp4 decodificado
  com scale=in_color_matrix=bt709:in_range=tv:out_range=full,format=rgb24; diferença média por canal < 2 (memória de
  01/10). --matriz bt601-cheia decodifica com a matriz errada (só pra provar que a conferência pega o erro de cor);
- fala: faster-whisper small (KIT/voz/transcreve.py no PYW, sem initial_prompt) sobre o áudio do final; palavras da
  narração achadas >= 95%, mediana do desvio de início <= 0,08 s, o fecho reconhecido (vale "Bye" no lugar de "Vai" e
  "legaliza aí"). Achada = a mesma palavra (sem acento e pontuação) na sequência alinhada, ou a troca 1 por 1 no mesmo
  lugar com o início a até 0,15 s (o whisper ouve "parece" no lugar de "aparece"); as trocas saem listadas à parte;
- legenda: zero quadro com aparelho invadindo a legenda (qc/legenda<sufixo>.json);
- loop: quadro 0 contra o último (diferença média da imagem) e o estado da timeline no quadro 0 igual ao de t =
  duração no qc/quadros<sufixo>.json (com o modo periódico, a camada ambiente também emenda);
- texto: zero travessão e zero "APP EM CONSTRUÇÃO" nas props; o resultado do qc/fatos<sufixo>.json (zero erro);
- créditos: saida/creditos<sufixo>.txt com o creditoLegenda das props (regra da seção 4.9), nunca o licenca.credito,
  sem marca nenhuma (a lista catalogo.MARCAS_CREDITO);
- licenças: a regra do montaProps repetida no fim, com o catálogo de hoje e pelo nome da PASTA da peça (nunca pelo
  campo "peca"): trilha só liberada, ou aceito-com-risco com a decisaoRisco do catálogo valendo pra peça
  (catalogo.confere_trilha: em peça nova, só a decisão do Pedro com a peça escrita); modelo sem reprovação, sem
  decisão pendente e sem licença NC ou ND; tela (e imagem de camada 2D que é tela) sem origem no catálogo ou de
  captura reprovada nunca; público obrigatório e, fora do "ME", a peça conferida como MEI (F063): tela que serve MEI,
  folha e comprovante com mostraValor false, sem contador de valor e sem cartão do imposto com valor; decisão de risco
  que não vale pra peça (de agente, ou com '*') vira aviso pra confirmar com o Pedro;
- folha: quadros a cada 0,5 s com o tempo escrito (folha.py) em saida/folha<sufixo>.jpg.
O relatório grava o md5 do mp4 conferido e o das props: o entregar só leva o mp4 que o confere aprovou.

Uso (sempre com python -B):
    python -B confere.py <peça> [--cena <arquivo>] [--video <mp4>] [--stills <png ou pasta> ...]
                         [--matriz bt709-tv|bt601-cheia] [--sem-whisper]
Código de saída: 0 tudo passou; 1 alguma conferência falhou.
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import datetime  # noqa: E402
import difflib  # noqa: E402
import glob  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
import re  # noqa: E402
import statistics  # noqa: E402
import subprocess  # noqa: E402
import unicodedata  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
import folha  # noqa: E402
from comum import escrita  # noqa: E402

if comum.KIT + "/catalogos" not in sys.path:
    sys.path.insert(0, comum.KIT + "/catalogos")
import catalogo  # noqa: E402

TRANSCREVE = comum.KIT + "/voz/transcreve.py"
MARCAS_PROIBIDAS = catalogo.MARCAS_CREDITO  # lista única do kit (Apple, iPhone, Google, Casio, Samsung, Pix e as outras)
RX_QUADRO = re.compile(r"(\d+)\.png$", re.I)


def _norm(s):
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c)).casefold()
    return re.sub(r"[^\w]+", " ", s).strip()


class Conf:
    def __init__(self):
        self.itens = []

    def add(self, nome, ok, medido, limite, detalhe=None):
        self.itens.append({"nome": nome, "ok": bool(ok), "medido": medido, "limite": limite, "detalhe": detalhe})
        print("[%s] %-20s %s  (limite: %s)" % ("ok" if ok else "FALHA", nome, medido, limite), flush=True)

    @property
    def ok(self):
        return all(i["ok"] for i in self.itens)


def confere_formato(c, video, props):
    s = comum.sonda(video)
    v = [x for x in s["streams"] if x.get("codec_type") == "video"]
    a = [x for x in s["streams"] if x.get("codec_type") == "audio"]
    if not v:
        c.add("formato", False, "sem fluxo de vídeo", "1 vídeo")
        return s
    v = v[0]
    num, den = map(int, v.get("r_frame_rate", "0/1").split("/"))
    fps = num / den if den else 0
    nq = int(v.get("nb_frames") or 0)
    med = {"tamanho": "%sx%s" % (v.get("width"), v.get("height")), "fps": round(fps, 3), "quadros": nq,
           "pix_fmt": v.get("pix_fmt"), "color_space": v.get("color_space"), "color_range": v.get("color_range"),
           "audio": ("%s %s Hz %s canais" % (a[0].get("codec_name"), a[0].get("sample_rate"), a[0].get("channels")))
           if a else "nenhum"}
    ok = (v.get("width") == props.get("largura", 1080) and v.get("height") == props.get("altura", 1920)
          and abs(fps - props.get("fps", 30)) < 1e-6 and nq == props.get("quadros") and v.get("pix_fmt") == "yuv420p"
          and v.get("color_space") == "bt709" and v.get("color_range") == "tv" and bool(a)
          and a[0].get("codec_name") == "aac" and str(a[0].get("sample_rate")) == "48000" and a[0].get("channels") == 2)
    c.add("formato", ok, med, "%dx%d, %d fps, %d quadros, yuv420p, bt709 tv, AAC 48 kHz estéreo"
          % (props.get("largura", 1080), props.get("altura", 1920), props.get("fps", 30), props.get("quadros")))
    return s


def confere_som(c, video):
    m = comum.loudness(video)
    ok = m["I"] is not None and abs(m["I"] - (-14.0)) <= 0.2 and m["TP"] is not None and m["TP"] <= -1.5
    c.add("som", ok, "I %.1f LUFS, pico real %.1f dBTP, LRA %.1f LU" % (m["I"], m["TP"], m["LRA"]),
          "I -14,0 +- 0,2 LUFS; pico real <= -1,5 dBTP", m)
    return m


def lista_stills(peca, stills):
    if stills:
        out = []
        for s in stills:
            if os.path.isdir(s):
                out += sorted(glob.glob(os.path.join(s, "*.png")))
            else:
                out.append(s)
        return out
    pasta = peca.caminho("provas", "stills")
    return sorted(glob.glob(os.path.join(pasta, "KitMotion%s-[0-9][0-9][0-9][0-9].png" % peca.sufixo)))


def _ida_e_volta(png, pasta):
    """O still passado pela mesma codificação do render (H.264 yuv420p, bt709 faixa tv, crf 15) e decodificado pela
    matriz certa (bt709-tv). A própria codificação puxa o coral saturado de tela cheia 2 a 3 níveis pra baixo (peça de
    09/10, versão 2: o fundo #DD4E27 sai 219, 76, 37 mesmo com o quadro em PNG); comparado com essa referência, o
    desvio da codificação sai da conta e sobra o que é diferença de imagem. A matriz errada continua sendo pega: o
    vídeo é decodificado pela matriz pedida e a referência sempre pela certa."""
    import numpy as np
    mp4 = os.path.join(pasta, "ida-e-volta.mp4")
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", png, "-vf",
                        "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-crf", "15",
                        "-preset", "slow", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                        "-color_range", "tv", "-frames:v", "1", mp4], capture_output=True)
    if r.returncode != 0:
        raise comum.ErroSaida("não codifiquei a referência de %s: %s" % (png, r.stderr.decode("utf-8", "replace")[-300:]))
    return comum.quadro_rgb(mp4, 0, "bt709-tv").astype(np.int16)


def confere_cor(c, video, pngs, matriz="bt709-tv"):
    import tempfile
    import numpy as np
    from PIL import Image
    medidas = []
    with tempfile.TemporaryDirectory(prefix="kit-cor-") as pasta:
        for p in pngs:
            m = RX_QUADRO.search(os.path.basename(p))
            if not m:
                continue
            q = int(m.group(1))
            ref = np.asarray(Image.open(p).convert("RGB"), dtype=np.int16)
            qd = comum.quadro_rgb(video, q, matriz, ref.shape[1], ref.shape[0]).astype(np.int16)
            iv = _ida_e_volta(p, pasta)
            d = np.abs(qd - iv)
            medidas.append({"still": comum.barra(p), "quadro": q, "media": round(float(d.mean()), 4), "maximo": int(d.max()),
                            "mediaContraPng": round(float(np.abs(qd - ref).mean()), 4)})
    if not medidas:
        c.add("cor", False, "nenhum still (provas/stills/KitMotion<sufixo>-NNNN.png ou --stills)", "média < 2 por quadro")
        return medidas
    pior = max(medidas, key=lambda x: x["media"])
    ok = all(x["media"] < 2 for x in medidas)
    c.add("cor", ok, "%d still(s); pior média %.4f no quadro %d contra o still pela mesma codificação (matriz %s; contra o PNG "
          "cru: %.4f)" % (len(medidas), pior["media"], pior["quadro"], matriz, pior["mediaContraPng"]),
          "média < 2 (contra o still passado pela codificação do render)", medidas)
    return medidas


def transcreve(video):
    r = subprocess.run([comum.PYW, "-B", TRANSCREVE, video], capture_output=True, text=True, encoding="utf-8",
                       errors="replace", env=comum.env_python(), timeout=900)
    if r.returncode != 0:
        raise comum.ErroSaida("whisper falhou: %s" % (r.stderr or r.stdout).strip()[-500:])
    linhas = [ln for ln in r.stdout.splitlines() if ln.strip().startswith("{")]
    return json.loads(linhas[-1])


def confere_fala(c, video, props):
    w = transcreve(video)
    narr = props["narracao"]["words"]
    a = [_norm(x["t"]) for x in narr]
    b_pal = [x for x in w["palavras"] if _norm(x["w"])]
    b = [_norm(x["w"]) for x in b_pal]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    pares, trocadas = [], []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            pares += [(i1 + k, j1 + k) for k in range(i2 - i1)]
        elif tag == "replace" and (i2 - i1) == (j2 - j1):
            # troca 1 por 1 no mesmo lugar (o whisper ouviu outra grafia: "parece" no lugar de "aparece"): conta como
            # achada se o início bate (até 0,15 s); fica registrada à parte
            for k in range(i2 - i1):
                i, j = i1 + k, j1 + k
                if abs(b_pal[j]["s"] - narr[i]["s"]) <= 0.15:
                    pares.append((i, j))
                    trocadas.append({"narracao": narr[i]["t"], "whisper": b_pal[j]["w"], "s": narr[i]["s"],
                                     "sWhisper": b_pal[j]["s"]})
    pares.sort()
    achadas = len(pares)
    iguais = achadas - len(trocadas)
    desvios = [abs(b_pal[j]["s"] - narr[i]["s"]) for i, j in pares]
    mediana = statistics.median(desvios) if desvios else None
    tf = props.get("tFecho")
    ref = tf if tf is not None else (narr[-1]["e"] + 0.44)
    # o fecho: as palavras do whisper a partir de 0,3 s antes do tFecho e também as que vêm depois da última palavra
    # da narração achada (acréscimo de 05/10, v4 da peça de 05/10: o whisper pode marcar o começo do "Vai" colado no
    # fim da última palavra, antes da janela de tempo, e o fecho ouvido inteiro dava "NÃO achado")
    j_ult = max((j for i, j in pares if i == len(narr) - 1), default=None)
    fim = " ".join(_norm(x["w"]) for k, x in enumerate(b_pal) if x["s"] >= ref - 0.3 or (j_ult is not None and k > j_ult))
    fecho = bool(re.search(r"\b(vai|bye|bai|vae)\b.*\blegaliz", fim) or "legaliza ai" in fim)
    cobertura = achadas / float(len(narr)) if narr else 0
    ok = cobertura >= 0.95 and mediana is not None and mediana <= 0.08 and fecho
    troca_txt = ", ".join("%s/%s" % (x["narracao"], x["whisper"]) for x in trocadas)
    c.add("fala", ok, "%d de %d palavras (%.0f%%: %d iguais e %d no lugar certo com outra grafia%s), mediana do desvio "
          "%.3f s, fecho %s ('%s')"
          % (achadas, len(narr), 100 * cobertura, iguais, len(trocadas), (": " + troca_txt) if trocadas else "",
             mediana if mediana is not None else -1, "ok" if fecho else "NÃO achado", fim[:60]),
          ">= 95%, mediana <= 0,08 s, fecho reconhecido",
          {"whisper": w.get("whisper"), "texto": w.get("texto"), "iguais": iguais, "trocadas": trocadas,
           "faltaram": [narr[i]["t"] for i in range(len(narr)) if i not in {p[0] for p in pares}]})
    return w


def confere_legenda(c, peca):
    if not os.path.isfile(peca.legenda):
        c.add("legenda", False, "falta %s (rode kit.py qc)" % os.path.basename(peca.legenda), "zero invasão")
        return None
    d = comum.le_json(peca.legenda)
    n = len(d.get("quadrosComInvasao") or [])
    m = d.get("margens") or {}
    c.add("legenda", n == 0, "%d quadro(s) com invasão (margens %s px cheia e %s px na transição; %d em alerta)"
          % (n, m.get("cheiaPx"), m.get("transicaoPx"), len(d.get("quadrosPerto") or [])), "zero quadro com invasão")
    return d


def _dif_pose(a, b):
    return max(abs(float(a[k]) - float(b[k])) for k in a if k in b and isinstance(a[k], (int, float)))


def confere_loop(c, peca, video, props):
    import numpy as np
    total = props["quadros"]
    q0 = comum.quadro_rgb(video, 0).astype(np.int16)
    qn = comum.quadro_rgb(video, total - 1).astype(np.int16)
    media = float(np.abs(q0 - qn).mean())
    det = {"imagemQuadro0ContraUltimo": round(media, 3)}
    if not os.path.isfile(peca.quadros):
        c.add("loop", False, "falta %s (rode kit.py qc)" % os.path.basename(peca.quadros), "estado igual")
        return det
    q = comum.le_json(peca.quadros)
    e0 = q["quadros"][0].get("estado")
    ef = q["tFim"].get("estado")
    if not e0 or not ef:
        c.add("loop", False, "o quadros.json não tem o estado do quadro 0 e do tFim (rode kit.py qc de novo)", "estado igual")
        return det
    difs = {"camera": _dif_pose(e0["cam"], ef["cam"])}
    for oid in e0["obj"]:
        a, b = e0["obj"][oid], ef["obj"].get(oid)
        if b is None:
            continue
        if a.get("vis", 1) <= 0.001 and b.get("vis", 1) <= 0.001:
            continue  # invisível nos dois: não conta
        difs[oid] = _dif_pose(a, b)
    est = max(difs.values())
    amb0, ambf = q.get("amb0") or {}, q["tFim"].get("amb") or {}
    amb = 0.0
    if amb0 and ambf:
        amb = max(abs(amb0["cam"]["x"] - ambf["cam"]["x"]), abs(amb0["cam"]["y"] - ambf["cam"]["y"]),
                  *[max(abs(amb0["objetos"][k]["y"] - ambf["objetos"][k]["y"]), abs(amb0["objetos"][k]["rz"] - ambf["objetos"][k]["rz"]))
                    for k in amb0.get("objetos", {}) if k in ambf.get("objetos", {})] or [0.0])
    periodico = bool(q.get("periodico"))
    ok = est <= 1e-5 and (amb <= 1e-9 if periodico else True)
    det.update({"estadoMaxDif": est, "porObjeto": difs, "ambienteMaxDif": amb, "periodico": periodico})
    msg = "estado t=0 contra t=duração: %.2e; camada ambiente: %.2e (%s); imagem q0 contra q%d: média %.3f" % (
        est, amb, "periódico" if periodico else "sem o modo periódico: não emenda, só registro", total - 1, media)
    c.add("loop", ok, msg, "estado <= 1e-5; ambiente <= 1e-9 com o modo periódico", det)
    return det


def _textos(x, out):
    if isinstance(x, str):
        out.append(x)
    elif isinstance(x, list):
        for v in x:
            _textos(v, out)
    elif isinstance(x, dict):
        for v in x.values():
            _textos(v, out)


def confere_texto(c, peca, props):
    ts = []
    _textos(props, ts)
    trav = [t for t in ts if comum.tem_travessao(t)]
    selo = [t for t in ts if re.search(r"(?i)app\s+em\s+constru[cç][aã]o", t)]
    fatos = comum.le_json(peca.fatos) if os.path.isfile(peca.fatos) else None
    nerr = len(fatos["erros"]) if fatos else None
    ok = not trav and not selo and fatos is not None and nerr == 0
    c.add("texto", ok, "%d travessão, %d 'APP EM CONSTRUÇÃO' nas props; fatos: %s"
          % (len(trav), len(selo), ("%d erro(s), %d aviso(s)" % (nerr, len(fatos["avisos"]))) if fatos else
             "NÃO rodado (kit.py fatos)"), "zero, zero e zero erro de fatos")
    return fatos


def confere_creditos(c, peca, props):
    cred = props.get("creditoLegenda")
    texto = cred if cred else "(nenhum modelo usado pede crédito na legenda)"
    saida = peca.saida("creditos", ".txt", "saida")
    escrita.grava_texto(saida, texto + "\n", cria_pasta=True)
    marca = catalogo.marca_em(cred or "")
    c.add("créditos", not marca, "%s: \"%s\"%s" % (os.path.basename(saida), texto,
                                                   (" (cita marca: %s)" % marca) if marca else ""),
          "o creditoLegenda das props, sem marca", {"arquivo": saida, "texto": texto, "marca": marca})
    return saida, texto


def confere_licencas(c, props, peca=None):
    """A regra de licença do montaProps repetida no fim, com o catálogo de hoje (o catálogo pode ter mudado depois das
    props): trilha, modelos, crédito sem marca, origem das telas e das imagens de camada que são tela, e a trava do
    F063 (público obrigatório; fora do "ME", conferida como MEI). peca é o nome da PASTA (sem ela, o campo das props,
    só pra teste)."""
    erros, avisos = [], []
    try:
        idx = {t: catalogo.indice(t) for t in ("trilhas", "modelos", "telas")}
    except catalogo.ErroCatalogo as e:
        c.add("licenças", False, "catálogo com erro: %s" % e, "catálogo legível (rode catalogos/valida.py)")
        return {"erros": [str(e)], "avisos": []}
    peca = peca or props.get("peca")
    t = props.get("trilha") or {}
    if t.get("id"):
        it = idx["trilhas"].get(t["id"])
        if it is None:
            erros.append("trilha fora do catálogo: %s" % t["id"])
        else:
            e, a = catalogo.confere_trilha(it, peca)
            erros += e
            avisos += a
    publico = (props.get("fatos") or {}).get("publico")
    estrito = catalogo.publico_estrito(publico)
    if publico in (None, ""):
        erros.append("fatos.publico vazio: declare ME, MEI ou todos (conferida como MEI até lá)")
    elif publico not in catalogo.PUBLICOS:
        erros.append("fatos.publico inválido (%r): use ME, MEI ou todos" % (publico,))
    rot = "peça %s" % ("de MEI" if publico == "MEI" else "conferida como MEI (público %s)" % catalogo.rotulo_publico(
        publico))
    vistos = set()
    for o in props.get("objetos") or []:
        mid = o.get("modelo")
        m = idx["modelos"].get(mid)
        if m is None:
            erros.append("modelo fora do catálogo: %s" % mid)
            continue
        if mid not in vistos:
            vistos.add(mid)
            d, prob = catalogo.decisao(m)
            restrita = catalogo.licenca_restrita(m.get("licenca"))
            if m.get("status") == "reprovado":
                erros.append("modelo reprovado: %s" % mid)
            elif restrita or catalogo.cita_epidemic(m):
                erros.append("modelo %s: %s" % (mid, ("licença %s não serve conteúdo de marca" % restrita) if restrita
                                                 else "Epidemic é reprovado em tudo"))
            elif m.get("status") == "aceito-com-risco":
                if d is None:
                    erros.append("modelo %s aceito com risco sem decisaoRisco estruturada (%s)" % (mid, prob))
                elif d.get("pendente") is True:
                    erros.append("modelo %s fora do padrão: %s" % (mid, catalogo.resumo_decisao(d)))
                elif not catalogo.decisao_vale(d, peca):
                    avisos.append("modelo %s aceito com risco e a decisão (%s) não cobre esta peça (%s): confirmar com o "
                                  "Pedro antes de postar" % (mid, catalogo.resumo_decisao(d),
                                                             catalogo.por_que_nao_vale(d, peca)))
        if estrito and o.get("tipo") in ("folha", "comprovante") and \
                (o.get("conteudo") or {}).get("mostraValor") is not False:
            erros.append("objeto %s (%s): %s com o valor da guia à mostra (F063: conteudo.mostraValor false)"
                         % (o.get("id"), o.get("tipo"), rot))
        pecas = (o.get("conteudo") or {}).get("pecas") if isinstance(o.get("conteudo"), dict) else None
        if estrito and isinstance(pecas, dict):
            for pid, pc in pecas.items():
                op = (pc or {}).get("opcoes") if isinstance(pc, dict) else None
                if isinstance(pc, dict) and pc.get("tipo") == "cartao-imposto" and isinstance(op, dict) and (
                        isinstance(op.get("valor"), (int, float)) or isinstance(op.get("valorTexto"), str)):
                    erros.append("palco %s, cartão do imposto %s: %s com o valor da guia (F063)" % (o.get("id"), pid, rot))
    marca = catalogo.marca_em(props.get("creditoLegenda") or "")
    if marca:
        erros.append("o crédito da legenda cita marca (%s)" % marca)
    provisorias = []
    telas = [("tela %s" % k, tela.get("arquivo"), tela.get("conjunto"), tela.get("extras") or [])
             for k, tela in (props.get("telas") or {}).items()]
    for cam in props.get("camadas") or []:
        for campo, src in catalogo.srcs_de_camada(cam):
            telas.append(("camada %s (%s %s)" % (cam.get("id"), campo, src), src, None, []))
    for onde, arquivo, conjunto, extras in telas:
        if onde.startswith("camada"):
            it, via, eh_tela = catalogo.origem_src(arquivo, idx["telas"])
            if not eh_tela:
                continue
        else:
            it, via = catalogo.origem_tela(arquivo, conjunto, idx["telas"])
        if it is None:
            erros.append("%s: sem origem no catálogo de telas (%s)" % (onde, via))
            continue
        if it.get("status") == "reprovado":
            erros.append("%s: a captura de origem %s está reprovada" % (onde, it["id"]))
        if estrito and it.get("servePecaMei") is not True:
            erros.append("%s: %s e a captura de origem %s não serve peça de MEI (F063)" % (onde, rot, it["id"]))
        if it.get("status") == "aceito-com-risco":
            d, _p = catalogo.decisao(it)
            if not catalogo.decisao_vale(d, peca):
                provisorias.append(it["id"])
        if estrito and any(isinstance(ex, dict) and ex.get("tipo") == "contador" for ex in extras):
            erros.append("%s: contador de valor (sempre em R$) numa %s (F063)" % (onde, rot))
    if provisorias:
        avisos.append("telas de captura aceitas com risco sem decisão do Pedro pra esta peça (%s): as decisões do "
                      "catálogo são de agente ou com '*', provisórias; confirmar com o Pedro antes de postar"
                      % ", ".join(sorted(set(provisorias))))
    c.add("licenças", not erros, "%d erro(s), %d aviso(s)%s" % (len(erros), len(avisos),
                                                               (": " + "; ".join(erros)) if erros else ""),
          "trilha liberada ou com decisão do catálogo que vale pra peça (pela pasta); modelo sem reprovação, decisão "
          "pendente nem licença NC ou ND; crédito sem marca; tela com origem no catálogo e não reprovada; público "
          "declarado e o F063 fora do ME", {"erros": erros, "avisos": avisos})
    return {"erros": erros, "avisos": avisos}


def relatorio_md(peca, props, c, extra):
    L = ["# Conferência: %s%s" % (peca.nome, (" (cena %s)" % peca.nome_cena) if peca.sufixo else ""), "",
         "Gerado pelo KIT/scripts/confere.py em %s. Final: `%s`." % (extra["feitoEm"], extra["video"]), "",
         "| conferência | resultado | medido | limite |", "|---|---|---|---|"]
    for i in c.itens:
        med = i["medido"] if isinstance(i["medido"], str) else json.dumps(i["medido"], ensure_ascii=False)
        L.append("| %s | %s | %s | %s |" % (i["nome"], "ok" if i["ok"] else "FALHOU", med.replace("|", "/"),
                                           str(i["limite"]).replace("|", "/")))
    L += ["", "Resultado: %s." % ("tudo passou" if c.ok else "FALHOU (ver a tabela)"), ""]
    fatos = extra.get("fatos")
    L += ["## Fatos (trava de conteúdo)", ""]
    if fatos:
        L.append("%d erro(s), %d aviso(s), %d número(s) conferido(s)." % (len(fatos["erros"]), len(fatos["avisos"]),
                                                                      len(fatos["numeros"])))
        for e in fatos["erros"]:
            L.append("- ERRO: %s (%s)" % (e["mensagem"], e["onde"]))
        for a in fatos["avisos"]:
            L.append("- aviso: %s (%s)" % (a["mensagem"], a["onde"]))
    else:
        L.append("Não rodado.")
    lic = extra.get("licencas") or {}
    L += ["", "## Licenças (catálogo de hoje)", ""]
    L += ["- ERRO: %s" % e for e in lic.get("erros") or []] + ["- aviso: %s" % a for a in lic.get("avisos") or []] \
        or ["- nenhum erro nem aviso"]
    L += ["", "## Avisos das props (montaProps)", ""]
    L += ["- %s" % a for a in props.get("avisos") or []] or ["- nenhum"]
    L += ["", "## Crédito pra legenda do post", "", extra["creditos"], "",
          "Folha de contato: `%s`." % extra.get("folha", "não gerada"), ""]
    return "\n".join(L)


def confere(peca, video=None, stills=None, matriz="bt709-tv", sem_whisper=False):
    props = peca.le_props()
    video = comum.barra(os.path.abspath(video)) if video else peca.final()
    if not os.path.isfile(video):
        raise comum.ErroSaida("o final não existe: %s (rode kit.py juncao)" % video, 2)
    c = Conf()
    extra = {"feitoEm": datetime.datetime.now().isoformat(timespec="seconds"), "video": video}
    confere_formato(c, video, props)
    confere_som(c, video)
    extra["stills"] = confere_cor(c, video, lista_stills(peca, stills), matriz)
    if sem_whisper:
        c.add("fala", False, "pulada (--sem-whisper)", "whisper small acha as palavras e o fecho")
    else:
        confere_fala(c, video, props)
    confere_legenda(c, peca)
    confere_loop(c, peca, video, props)
    extra["fatos"] = confere_texto(c, peca, props)
    _saida, extra["creditos"] = confere_creditos(c, peca, props)
    extra["licencas"] = confere_licencas(c, props, peca.nome)
    fl = folha.folha_video(video, peca.saida("folha", ".jpg", "saida"), 0.5)
    extra["folha"] = fl["saida"]
    c.add("folha", os.path.isfile(fl["saida"]), "%s (%d quadros, %d bytes)" % (os.path.basename(fl["saida"]),
                                                                              len(fl["quadros"]), fl["bytes"]),
          "quadros a cada 0,5 s com o tempo")
    # o md5 do mp4 e das props: o entregar só leva o mp4 que este relatório aprovou (portao.py)
    doc = {"versao": 2, "peca": peca.nome, "cena": peca.nome_cena, "video": video, "md5Video": escrita.md5(video),
           "props": peca.props, "propsMd5": escrita.md5(peca.props), "matriz": matriz,
           "feitoEm": extra["feitoEm"], "itens": c.itens, "ok": c.ok, "folha": extra["folha"],
           "creditos": extra["creditos"]}
    escrita.grava_json(peca.saida("relatorio", ".json", "saida"), doc, cria_pasta=True)
    escrita.grava_texto(peca.saida("relatorio", ".md", "saida"), relatorio_md(peca, props, c, extra), cria_pasta=True)
    return doc


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="confere.py", description="Conferência do final (K07, seção 7.7).")
    ap.add_argument("peca")
    ap.add_argument("--cena")
    ap.add_argument("--video", help="outro mp4 (padrão saida/<peça><sufixo>.mp4)")
    ap.add_argument("--stills", nargs="+", help="stills PNG (ou pastas) no lugar de provas/stills/")
    ap.add_argument("--matriz", default="bt709-tv", choices=sorted(comum.MATRIZES), help="só a prova usa bt601-cheia")
    ap.add_argument("--sem-whisper", action="store_true")
    a = ap.parse_args(argv)
    try:
        peca = comum.Peca(a.peca, a.cena)
        d = confere(peca, a.video, a.stills, a.matriz, a.sem_whisper)
    except (comum.ErroSaida, escrita.EscritaRecusada) as e:
        print("erro: %s" % e)
        return getattr(e, "codigo", 1)
    print("relatório: %s" % peca.saida("relatorio", ".md", "saida"))
    print("resultado: %s" % ("tudo passou" if d["ok"] else "FALHOU"))
    return 0 if d["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
