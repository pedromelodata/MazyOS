"""Reel "Cinco motivos pra ter CNPJ", 40 s, no estilo do prompt que o Pedro colou (13/10/2026): "Use esse prompt para
criar o vídeo no Remotion mas usando as nossas cores e assets" e "Regere a narração para não ficar cortada e faça de
uma vez só". Lê a narração nova numa tomada só (voz/dylan-t2-tr.json), mede o texto com a Sora de verdade e grava
src/cinco/prompt40.json no Remotion: as 26 batidas, o quadro de cada palavra (aparece 3 quadros antes de ser dita),
a posição de cada palavra na linha (a linha se recentra quando entra palavra nova) e o lugar de cada peça.
Confere a margem (96 dos lados, 240 em cima, 360 embaixo) depois do empurrão da câmera de cada batida.
Uso: python -B prompt40.py"""
import json, math, os, re
from PIL import ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
RM = os.path.normpath(os.path.join(AQUI, "..", "..", "precificacao-2026-10-02", "remotion"))
PUB = os.path.join(RM, "public-cinco-v9")
FPS, OFF, TOTAL = 30, 0.1, 1200
VOZ = os.environ.get("VOZ40", "dylan-t5c-alinhado.json")
W = json.load(open(os.path.join(AQUI, "voz", VOZ), encoding="utf-8"))
# o whisper escreve número ou palavra conforme a tomada ("dois" ou "2", "uns" ou "1" no "uns seiscentos"): "a|b" aceita os dois
ESP = ("ainda recebe pelo seu trabalho no cpf 5|cinco motivos para|pra ter cnpj 1|um no mei a guia é fixa fatura|fature de 1|um "
       "real até o teto de 81 mil por ano exatamente 6 750 por mês dois|2 numa microempresa que começa em 6 % de 10 000 "
       "uns|1 600 de imposto e uns 9 400 no bolso 3|três na microempresa seu salário de dono recolhe inss para|pra sua "
       "aposentadoria 4|quatro o app calcula você emite a nota e paga 5|cinco a abertura é com a gente sem honorário clique "
       "no link da bio e entre na lista de espera do app que chega dia 10|dez de novembro vai legalize|legaliza|legalizaí aí").split()
nrm = lambda s: re.sub(r"[.,?!:]", "", s.lower())
# TOLERA40="6" deixa passar uma palavra que o whisper errou numa tomada só pra testar a montagem (o tempo é o mesmo)
_tol = set(int(x) for x in os.environ.get("TOLERA40", "").split(",") if x)
_dif = [(i, nrm(w["w"]), e) for i, (w, e) in enumerate(zip(W, ESP)) if nrm(w["w"]) not in e.split("|") and i not in _tol]
# a transcrição alinhada (alinha-voz.py) já sai com uma entrada por palavra do texto, na ordem
if VOZ.endswith("-alinhado.json"):
    assert len(W) == len(ESP), (len(W), len(ESP))
else:
    assert len(W) == len(ESP) and not _dif, _dif
fr = lambda i: int(round((W[i]["s"] + OFF) * FPS))

# ---------- medida do texto ----------
FONTE = {"sora": os.path.join(PUB, "Sora-wght.ttf"), "serif": os.path.join(PUB, "fontes", "DMSerifDisplay-Italic.ttf")}
_c = {}


def larg(t, nome, px, peso, track):
    k = (nome, peso)
    if k not in _c:
        f = ImageFont.truetype(FONTE[nome], 200)
        if nome == "sora":
            f.set_variation_by_axes([peso])
        _c[k] = f
    # o letter-spacing do CSS entra depois de cada letra, até a última
    return _c[k].getlength(t) * px / 200 + len(t) * track * px


# estilo: fonte, peso, tamanho base, tracking. "set" é a palavra de apoio, "key" a palavra-chave em coral (1,7x)
EST = {"set": ("sora", 600, 92, -0.02), "key": ("sora", 800, 156, -0.05), "small": ("sora", 600, 50, 0.0),
       "charcoal": ("sora", 500, 76, -0.02)}
CAP, DESC = 0.73, 0.22  # altura da maiúscula e da perna da Sora, em em
SIMB = 0.62  # o símbolo da marca no fim da linha, em fração do tamanho da palavra-chave


def mede(toks, s):
    ws = []
    for t, i, e in toks:
        if e == "simbolo":
            ws.append(SIMB * EST["key"][2] * s)
        else:
            fo, pe, px, tr = EST[e]
            ws.append(larg(t, fo, px * s, pe, tr))
    gap = 0.27 * EST["set"][2] * s
    return ws, gap, sum(ws) + gap * (len(ws) - 1)


def bloco(linhas, maxw, de, cx=540, yc=None, y0=None, y1=None):
    """linhas: [[(texto, índice da palavra na narração, estilo)]]. Cada linha diminui sozinha até caber em maxw."""
    L = []
    for toks in linhas:
        s = 1.0
        ws, gap, tot = mede(toks, s)
        if tot > maxw:
            s = maxw / tot
            ws, gap, tot = mede(toks, s)
        tam = max((EST[e][2] * s for t, i, e in toks if e != "simbolo"), default=EST["key"][2] * s)
        L.append((toks, s, ws, gap, tot, tam))
    b = [0.0]
    for j in range(1, len(L)):
        b.append(b[-1] + CAP * L[j][5] + 0.25 * L[j - 1][5] + 8)
    topo, base = b[0] - CAP * L[0][5], b[-1] + DESC * L[-1][5]
    if yc is not None:
        d = yc - (topo + base) / 2
    elif y0 is not None:
        d = y0 - topo
    else:
        d = y1 - base
    out = []
    for j, (toks, s, ws, gap, tot, tam) in enumerate(L):
        pal, x = [], 0.0
        for (t, i, e), w in zip(toks, ws):
            fo, pe, px, tr = EST["key" if e == "simbolo" else e]
            a = max(de, fr(i) - 3)
            pal.append({"t": t, "e": e, "px": round(px * s, 1), "w": round(w, 1), "x": round(x, 1), "a": a})
            x += w + gap
        cheg = []
        for a in sorted(set(p["a"] for p in pal)):
            k = [p for p in pal if p["a"] <= a]
            wk = k[-1]["x"] + k[-1]["w"]
            cheg.append([a, round(cx - wk / 2, 1)])
        out.append({"b": round(b[j] + d, 1), "pal": pal, "cheg": cheg, "w": round(tot, 1), "cx": cx})
    return out, (topo + d, base + d)


def maxw_cam(s1, piv=(540, 960), cx=540, folga=0):
    lo, hi = piv[0] + (96 - piv[0]) / s1, piv[0] + (984 - piv[0]) / s1
    return 2 * min(cx - lo, hi - cx) - folga


AVISOS = []


def confere(n, nome, caixa, cam):
    """caixa (x0, y0, x1, y1) antes da câmera; avisa se sai da margem no fim do empurrão"""
    s1, (px, py) = cam["s1"], (cam["px"], cam["py"])
    x0, y0, x1, y1 = [(v - p) * s1 + p for v, p in zip(caixa, (px, py, px, py))]
    if x0 < 95 or x1 > 985 or y0 < 239 or y1 > 1561:
        AVISOS.append("batida %d %s fora da margem: %d %d %d %d" % (n, nome, x0, y0, x1, y1))


def caixa_linhas(linhas):
    x0 = min(l["cheg"][-1][1] for l in linhas)
    x1 = max(l["cheg"][-1][1] + l["w"] for l in linhas)
    y0 = min(l["b"] - CAP * max(p["px"] for p in l["pal"]) for l in linhas)
    y1 = max(l["b"] + DESC * max(p["px"] for p in l["pal"]) for l in linhas)
    return (x0, y0, x1, y1)


# caixa visível de cada recorte (o PNG de 2048 tem margem transparente) e do celular (PNG de 1600 x 2400)
RECORTE = {"gancho": (390, 271, 1679, 1881), "calendario": (420, 336, 1660, 1676), "bolso": (582, 256, 1551, 1735),
           "praia": (289, 238, 1706, 1825)}


def caixa_img(nome, cx, cy, tam):
    x0, y0, x1, y1 = RECORTE[nome]
    k = tam / 2048
    return (cx - tam / 2 + x0 * k, cy - tam / 2 + y0 * k, cx - tam / 2 + x1 * k, cy - tam / 2 + y1 * k)


def caixa_cel(cx, cy, wd):
    hd = 1.5 * wd
    return (cx - wd / 2 + 0.249 * wd, cy - hd / 2 + 0.143 * hd, cx - wd / 2 + 0.751 * wd, cy - hd / 2 + 0.857 * hd)


def tok(*xs):
    return list(xs)


S, K = "set", "key"
# ---------- as batidas ----------
# cada uma: tipo, fundo, primeira palavra (o índice que abre a batida), câmera e o resto
B = []


def batida(tipo, fundo, i0, **kw):
    kw.update({"tipo": tipo, "fundo": fundo, "i0": i0})
    B.append(kw)


batida("abre", "papel", 0, saida="flicker", linhas=[[("Ainda", 0, S), ("recebe", 1, S)], [("pelo", 2, S), ("seu", 3, S)],
                                                  [("trabalho", 4, K), ("", 4, "simbolo")]])
batida("cabeca", "preto", 5, linhas=[[("no", 5, "charcoal")], [("CPF?", 6, K)]])
batida("palavra", "preto", 7, saida="preto", linhas=[[("Cinco", 7, K)]])
batida("palavra", "preto", 8, linhas=[[("motivos", 8, S), ("pra", 9, S), ("ter", 10, S)], [("CNPJ.", 11, K)]])
batida("icone", "papel", 12, entrada="branco", saida="giro", num="1", linhas=[[("no", 13, S), ("MEI,", 14, K)]])
# 14/10: o calendário com cadeado saiu ("ESSE ASSET não faz sentido nenhum"): 12 barras de mês na mesma altura
batida("guia", "preto", 15, entrada=None, saida="branco",
       linhas=[[("a", 15, S), ("guia", 16, S), ("é", 17, S)]], embaixo=[[("fixa.", 18, K)]])
# a barra do faturamento: "coloque uma barra representando de 1 Real até 81000 por ano progressiva e animada"
# 14/10, "a barra de progressão ela tem que ser gradual": a barra junta com o "exatamente R$ 6.750 por mês" e sobe
# um degrau de R$ 6.750 por mês, 12 degraus até o teto de R$ 81 mil (a fala de "um real" a "81 mil" passa em 1 s)
batida("barra", "papel", 19, entrada="branco", saida="iris",
       linhas=[[("Fature", 19, S), ("de", 20, S)]], linhas2=[[("até", 23, S), ("o", 24, S), ("teto", 25, S), ("de", 26, S)]],
       linhas3=[[("exatamente", 31, S)]],
       embaixo=[[("por", 29, S), ("ano,", 30, S)]], embaixo2=[[("por", 34, S), ("mês.", 35, S)]])
batida("numero", "preto", 36, num="2", linhas=[[("numa", 37, S)], [("microempresa", 38, K)]])
batida("script", "papel", 39, saida="bloom", linhas=[[("que", 39, S), ("começa", 40, S), ("em", 41, S)]], script=("6%", 42))
batida("cartao", "papel", 45, titulo="R$ 10 mil", rows=[("moedas", "R$ 600 de imposto", 48)])
batida("rola", "preto", 53, prop="bolso", linhas=[[("R$ 9.400", 53, K)]], embaixo=[[("no", 55, S), ("bolso.", 56, K)]])
batida("icone", "papel", 57, num="3", linhas=[[("na", 58, S)], [("microempresa,", 59, K)]])
batida("tela-pin", "papel", 60, prop="telas40/12-tela-pro-labore.png", linhas=[[("seu", 60, S), ("salário", 61, S)], [("de", 62, S), ("dono", 63, K)]])
batida("cofrinho", "preto", 64, saida=None, linhas=[[("recolhe", 64, S)], [("INSS", 65, K)]])
batida("icone", "papel", 66, entrada="branco", prop="praia", linhas=[[("pra", 66, S), ("sua", 67, S)], [("aposentadoria.", 68, K)]])
batida("numero", "preto", 69, num="4", saida="preto", linhas=[])
batida("celular", "preto", 70, cel=20, linhas=[[("o", 70, S), ("app", 71, S)], [("calcula.", 72, K)]])
batida("cel3d", "papel", 73, saida="branco",
       linhas=[[("Você", 73, S), ("emite", 74, S), ("a", 75, S), ("nota", 76, S)], [("e", 77, S), ("paga.", 78, K)]])
batida("icone", "papel", 79, entrada="branco", saida="iris", num="5", linhas=[[("a", 80, S), ("abertura", 81, K)]])
batida("celular", "preto", 82, cel=175, linhas=[[("é", 82, S), ("com", 83, S), ("a", 84, S)], [("gente,", 85, K)]],
       embaixo=[[("sem", 86, S), ("honorário.", 87, K)]])
batida("pilula", "papel", 88, linhas=[[("Clique", 88, S), ("no", 89, S)]], pil=90)
batida("eco", "preto", 93, saida="preto", linhas=[[("e", 93, S), ("entre", 94, S), ("na", 95, S)], [("lista", 96, K), ("de", 97, K), ("espera", 98, K)]])
# 14/10: "do app, que chega dia 10 de novembro" bem explícito (Pedro), com o calendário virando as folhas até o 10
batida("data", "preto", 99, linhas=[[("do", 99, S), ("app,", 100, S), ("que", 101, S), ("chega", 102, S)]],
       embaixo=[[("dia", 103, S), ("10", 104, K)], [("de", 105, K), ("novembro.", 106, K)]])
batida("fecho", "papel", 107, ai=109)

# começo e fim: a batida começa 3 quadros antes da primeira palavra e acaba onde a próxima começa
for j, b in enumerate(B):
    b["de"] = 0 if j == 0 else fr(b["i0"]) - 3
for j, b in enumerate(B):
    b["ate"] = B[j + 1]["de"] if j + 1 < len(B) else TOTAL
    b["n"] = j + 1

CAM = {"abre": (1.18, 4.3), "cabeca": (1.32, 10), "palavra": (1.08, 2), "eco": (1.06, 2), "icone": (1.12, 4.3),
       "rola": (1.10, 8), "cartao": (1.06, 2), "script": (1.04, 2), "tela-pin": (1.08, 4.3), "celular": (1.12, 8),
       "cel3d": (1.06, 3), "moeda": (1.08, 3), "guia": (1.10, 8), "barra": (1.05, 2), "data": (1.08, 4), "cofrinho": (1.10, 8), "pilula": (1.08, 3), "numero": (1.15, 8), "fecho": (1.04, 2)}

saida = []
for b in B:
    n, tipo, de = b["n"], b["tipo"], b["de"]
    s1, k = CAM[tipo]
    piv = (540, 960)
    if tipo == "cabeca":
        piv = (540, 700)
    if tipo == "celular" and b.get("embaixo"):
        s1 = 1.08
    cam = {"s1": s1, "k": k, "px": piv[0], "py": piv[1]}
    o = {"n": n, "tipo": tipo, "fundo": b["fundo"], "de": de, "ate": b["ate"], "cam": cam,
         "saida": b.get("saida"), "entrada": b.get("entrada")}
    mw = maxw_cam(s1, piv)
    if tipo == "abre":
        o["linhas"], cx = bloco(b["linhas"], mw - 10, de, y0=430)
        l2 = o["linhas"][-1]
        sim = l2["pal"][1]
        tam = sim["w"]
        xs = l2["cheg"][-1][1] + sim["x"] + tam / 2
        ys = l2["b"] - CAP * l2["pal"][0]["px"] / 2
        o["voo"] = {"p0": [380, 1060], "p1": [1000, 900], "p2": [round(xs, 1), round(ys, 1)], "a0": 5, "a1": l2["pal"][0]["a"] + 6, "tam": round(tam, 1)}
        o["prop"] = {"src": "recortes40/gancho.png", "x": 385, "y": 1130, "tam": 700, "rot": -10}
        o["grade"] = [330, 560]
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        confere(n, "recorte", caixa_img("gancho", 385, 1130, 700), cam)
        confere(n, "simbolo", (xs - tam / 2, ys - tam / 2, xs + tam / 2, ys + tam / 2), cam)
    elif tipo == "cabeca":
        o["cabeca"] = {"x": 540, "y": 700, "r": 250}
        o["linhas"], cx = bloco(b["linhas"], 400, de, yc=700)
        confere(n, "cabeça", (540 - 320, 700 - 320, 540 + 320, 700 + 320), cam)
    elif tipo in ("palavra", "eco"):
        mwx = mw - 20
        o["linhas"], cx = bloco(b["linhas"], mwx, de, yc=960 if tipo == "eco" or not b.get("conta") else 900)
        if b.get("conta"):
            o["conta"], c2 = bloco(b["conta"], mwx, de, y0=cx[1] + 46)
            confere(n, "conta", caixa_linhas(o["conta"]), cam)
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        if b.get("saida") == "iris":
            o["iris"] = [540, 960]
    elif tipo == "icone":
        if b.get("num"):
            # o número grande no lugar do ícone 3D brilhante: Sora 800 a 600 px, com o degradê coral e sombra
            npx = 600
            nw = larg(b["num"], "sora", npx, 800, -0.05)
            base = 1330
            o["num"] = {"t": b["num"], "px": npx, "x": round(540 - nw / 2, 1), "b": base, "a": fr(b["i0"]) - 3, "w": round(nw, 1)}
            topo_num = base - CAP * npx
            o["linhas"], cx = bloco(b["linhas"], mw - 20, de, y1=topo_num - 70)
            confere(n, "número", (540 - nw / 2, topo_num, 540 + nw / 2, base), cam)
            if b.get("saida") == "iris":
                o["iris"] = [540, round(base - CAP * npx / 2)]
        else:
            o["prop"] = {"src": "recortes40/%s.png" % b["prop"], "x": 540, "y": 1150, "tam": 620, "rot": 0}
            cb = caixa_img(b["prop"], 540, 1150, 620)
            o["linhas"], cx = bloco(b["linhas"], mw - 20, de, y1=cb[1] - 50)
            confere(n, "recorte", cb, cam)
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        o["faixa"] = "S"
    elif tipo == "rola":
        o["prop"] = {"src": "recortes40/%s.png" % b["prop"], "x": 540, "y": 960, "tam": 620, "rot": 0}
        o["linhas"], c1 = bloco(b["linhas"], mw - 20, de, y1=960 - 300 - 40)
        o["embaixo"], c2 = bloco(b["embaixo"], mw - 20, de, y0=960 + 300 + 30)
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        confere(n, "embaixo", caixa_linhas(o["embaixo"]), cam)
    elif tipo == "guia":
        # a guia do MEI é a mesma todo mês: 12 barras de mês na mesma altura e, no "fixa.", a linha que nivela as
        # pontas (sem valor nenhum na tela, F063)
        nm, bw, gap, base, h = 12, 46, 16, 1110, 250
        tot = nm * bw + (nm - 1) * gap
        x0 = 540 - tot / 2
        st, dur = 1.2, 8
        o["meses"] = {"n": nm, "x0": round(x0, 1), "w": bw, "gap": gap, "base": base, "h": h, "a": de, "st": st, "dur": dur,
                      "la": round(de + (nm - 1) * st + dur + 1), "rotulos": "JFMAMJJASOND"}
        o["linhas"], c1 = bloco(b["linhas"], mw - 20, de, y1=base - h - 80)
        o["embaixo"], c2 = bloco(b["embaixo"], mw - 20, de, y0=base + 90)
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        confere(n, "embaixo", caixa_linhas(o["embaixo"]), cam)
        confere(n, "barras", (x0 - 24, base - h - 30, x0 + tot + 24, base + 50), cam)
    elif tipo == "barra":
        # a barra do faturamento do MEI (F051: teto de R$ 81.000 por ano, média de R$ 6.750 por mês). O contador aparece
        # em R$ 1 no "um real"; a barra, dividida em 12 meses, sobe um degrau por mês até o teto, do "um real" ao fim do
        # "mês", com a moeda de 1 rolando na frente; a etiqueta "R$ 6.750 por mês" acompanha o degrau no "exatamente"
        fA, fE = fr(23) - 3, fr(31) - 3
        la, c1 = bloco(b["linhas"], mw - 20, de, y0=440)
        for l in la:
            l["fim"] = fA
        lb, c1b = bloco(b["linhas2"], mw - 20, de, y0=440)
        for l in lb:
            l["fim"] = fE
        lc, c1c = bloco(b["linhas3"], mw - 20, de, y0=440)
        o["linhas"] = la + lb + lc
        cpx = 150
        while larg("R$ 81.000", "sora", cpx, 800, -0.05) > mw - 20:
            cpx -= 4
        cb = round(max(c1[1], c1b[1], c1c[1]) + 70 + CAP * cpx)
        ea, c2 = bloco(b["embaixo"], mw - 20, de, y0=cb + 46)
        for l in ea:
            l["fim"] = fr(34) - 3
        eb, c2b = bloco(b["embaixo2"], mw - 20, de, y0=cb + 46)
        o["embaixo"] = ea + eb
        bx, bwid, bh, d = 150, 780, 96, 144
        by = round(max(c2[1], c2b[1]) + 70 + d + 70 + bh / 2)
        fimMes = int(round((W[35]["e"] + OFF) * FPS))
        o["barra"] = {"x": bx, "w": bwid, "y": by, "h": bh, "d": d, "moeda": "prompt3d/moeda.png", "ma": fr(21) - 3 - 8,
                      "va": fr(21) - 3, "f0": fr(21) - 3, "f1": fimMes, "meses": 12, "ta": fr(27) - 3, "et": fr(32) - 3,
                      "cpx": cpx, "cb": cb, "marcas": []}
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        confere(n, "contador", (540 - larg("R$ 81.000", "sora", cpx, 800, -0.05) / 2, cb - CAP * cpx, 540 + larg("R$ 81.000", "sora", cpx, 800, -0.05) / 2, cb), cam)
        confere(n, "embaixo", caixa_linhas(o["embaixo"]), cam)
        confere(n, "barra", (bx, by - bh / 2 - d - 70 - 60, bx + bwid, by + bh / 2 + 90), cam)
    elif tipo == "cartao":
        # cartão cinza fosco preso com tachinha: título branco, divisória e as linhas com ícone preto
        rows = []
        for ic, t, i in b["rows"]:
            rows.append({"icone": ic, "t": t, "a": fr(i) - 3, "px": 56})
        o["cartao"] = {"x": 540, "y": 960, "w": 760, "h": 520, "tpx": 150, "titulo": b["titulo"], "ta": fr(b["i0"]) - 3, "rows": rows}
        o["linhas"] = []
        o["faixa"] = "arco"
        tw = larg(b["titulo"], "sora", 150, 800, -0.04)
        rw = max(64 + 18 + larg(r["t"], "sora", 56, 600, 0) for r in rows)
        if max(tw, rw) > 760 - 2 * 56:
            AVISOS.append("batida %d: cartão estreito (%d %d)" % (n, tw, rw))
        confere(n, "cartão", (540 - 380, 960 - 260, 540 + 380, 960 + 260), cam)
    elif tipo == "script":
        t, i = b["script"]
        spx = 470
        sw = larg(t, "serif", spx, 400, 0)
        base = 1150
        o["script"] = {"t": t, "px": spx, "w": round(sw, 1), "x": round(540 - sw / 2, 1), "b": base, "a": fr(i) - 3}
        o["linhas"], cx = bloco(b["linhas"], mw - 20, de, y1=base - 0.66 * spx - 70)
        o["disco"] = [540, base + 40]
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        confere(n, "script", (540 - sw / 2, base - 0.66 * spx, 540 + sw / 2, base), cam)
    elif tipo == "tela-pin":
        tw, th = 360, 360 * 2796 / 1290
        o["tela"] = {"src": b["prop"], "x": 540, "y": 1100, "w": tw, "h": round(th), "rot": -3}
        o["linhas"], cx = bloco(b["linhas"], mw - 20, de, y1=1100 - th / 2 - 70)
        o["faixa"] = "arco"
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        confere(n, "tela", (540 - tw / 2 - 25, 1100 - th / 2 - 30, 540 + tw / 2 + 25, 1100 + th / 2 + 20), cam)
    elif tipo == "numero":
        npx = 560 if not b["linhas"] else 480
        nw = larg(b["num"], "sora", npx, 800, -0.05)
        if b["linhas"]:
            base = 960
            o["linhas"], cx = bloco(b["linhas"], mw - 20, de, y0=base + 110)
            confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        else:
            base = 960 + CAP * npx / 2
            o["linhas"] = []
        o["num"] = {"t": b["num"], "px": npx, "x": round(540 - nw / 2, 1), "b": round(base, 1), "a": fr(b["i0"]) - 3, "w": round(nw, 1)}
        confere(n, "número", (540 - nw / 2, base - CAP * npx, 540 + nw / 2, base), cam)
    elif tipo == "celular":
        if b.get("embaixo"):
            wd, cy = 600, 1000
        else:
            wd, cy = 700, 1110
        cb = caixa_cel(540, cy, wd)
        o["cel"] = {"x": 540, "y": cy, "w": wd, "i0": b["cel"]}
        o["linhas"], cx = bloco(b["linhas"], mw - 20, de, y1=cb[1] - 60)
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        confere(n, "celular", cb, cam)
        if b.get("embaixo"):
            o["embaixo"], c2 = bloco(b["embaixo"], mw - 20, de, y0=cb[3] + 60)
            confere(n, "embaixo", caixa_linhas(o["embaixo"]), cam)
    elif tipo == "cel3d":
        # o iPhone 3D de verdade (Celular40Nota.tsx, quadro cheio com alfa) no lugar da tela chapada com fita
        o["linhas"], cx = bloco(b["linhas"], mw - 20, de, y0=330)
        o["seq"] = {"pasta": "cel40nota", "n": b["ate"] - de}
        o["troca"] = fr(78) - 3
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        # caixa do celular girado 24 graus (centro em 600, 1110; 353 x 737 px)
        r = math.radians(24)
        cs = [(x * math.cos(r) - y * math.sin(r), x * math.sin(r) + y * math.cos(r)) for x in (-176, 176) for y in (-368, 368)]
        confere(n, "celular", (600 + min(c[0] for c in cs), 1110 + min(c[1] for c in cs), 600 + max(c[0] for c in cs), 1110 + max(c[1] for c in cs)), cam)
        if cx[1] + 50 > 1110 + min(c[1] for c in cs):
            AVISOS.append("batida %d: texto encosta no celular" % n)
    elif tipo == "moeda":
        # a moeda de 1 (Higgsfield, recorte redondo) gira em 3D e pousa embaixo do "R$ 1"
        o["linhas"], cx = bloco(b["linhas"], mw - 20, de, y0=430)
        d = 440
        o["moeda"] = {"src": "prompt3d/moeda.png", "x": 540, "y": round(cx[1] + 70 + d / 2), "d": d, "a": fr(21) - 3 - 8}
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        confere(n, "moeda", (540 - d / 2, o["moeda"]["y"] - d / 2, 540 + d / 2, o["moeda"]["y"] + d / 2), cam)
    elif tipo == "cofrinho":
        # o cofrinho coral (Higgsfield) cai do alto, e uma moeda entra pela fenda no "INSS"
        o["linhas"], cx = bloco(b["linhas"], mw - 20, de, y0=400)
        tam = 640
        cy = round(cx[1] + 40 + tam / 2)
        o["cofrinho"] = {"src": "prompt3d/cofrinho.png", "x": 540, "y": cy, "tam": tam, "moeda": "prompt3d/moeda.png", "a": fr(65) - 3}
        k = tam / 2048
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        confere(n, "cofrinho", (540 - tam / 2 + 240 * k, cy - tam / 2 + 331 * k, 540 - tam / 2 + 1805 * k, cy - tam / 2 + 1809 * k), cam)
    elif tipo == "pilula":
        o["linhas"], cx = bloco(b["linhas"], mw - 20, de, y1=1040 - 90 - 70)
        o["pilula"] = {"x": 540, "y": 1040, "w": 680, "h": 180, "a": fr(b["pil"]) - 3}
        # a mão branca (Higgsfield) chega da quina de baixo à direita e aperta a pílula embaixo do "BIO"
        mt = 300
        o["mao"] = {"src": "prompt3d/mao-clique.png", "tam": mt, "ponta": [700, 1122], "pf": [0.188, 0.183], "a": fr(b["pil"]) - 3 + 1}
        confere(n, "mão", (700 - 0.188 * mt, 1122 - 0.183 * mt, 700 + 0.812 * mt, 1122 + 0.817 * mt), cam)
        o["grade"] = [760, 600]
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        confere(n, "pílula", (540 - 340, 1040 - 90, 540 + 340, 1040 + 90), cam)
    elif tipo == "data":
        # o bloco de calendário (NOVEMBRO em cima) arranca as folhas 7, 8 e 9 e para no 10 quando o "dez" aparece
        a10 = fr(104) - 3
        cw, ch, cy = 440, 500, 860
        o["cal"] = {"x": 540, "y": cy, "w": cw, "h": ch, "mes": "NOVEMBRO", "dias": [7, 8, 9, 10], "tr": [a10 - 6, a10 - 3, a10]}
        o["linhas"], c1 = bloco(b["linhas"], mw - 20, de, y1=cy - ch / 2 - 26 - 70)
        o["embaixo"], c2 = bloco(b["embaixo"], mw - 20, de, y0=cy + ch / 2 + 70)
        confere(n, "texto", caixa_linhas(o["linhas"]), cam)
        confere(n, "embaixo", caixa_linhas(o["embaixo"]), cam)
        confere(n, "calendário", (540 - cw / 2, cy - ch / 2 - 26, 540 + cw / 2, cy + ch / 2 + 14), cam)
    elif tipo == "fecho":
        o["ai"] = fr(b["ai"])
        o["tp"] = fr(b["ai"]) + 5
        # a data no último quadro também (Pedro: "no final... bem bem explícito")
        o["dataFim"] = {"t": "O app chega dia 10/11", "a": fr(b["ai"]) + 11}
        o["linhas"] = []
    saida.append(o)

json.dump({"fps": FPS, "total": TOTAL, "off": OFF, "batidas": saida},
          open(os.path.join(RM, "src", "cinco", "prompt40.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for o in saida:
    tx = " / ".join(" ".join(p["t"] for p in l["pal"] if p["t"]) for l in o.get("linhas", []) + o.get("embaixo", []))
    px = sorted(set(p["px"] for l in o.get("linhas", []) + o.get("embaixo", []) for p in l["pal"]))
    print("%2d %-8s %-6s %4d-%4d %-6s %-6s %s %s" % (o["n"], o["tipo"], o["fundo"], o["de"], o["ate"], o.get("entrada") or "", o.get("saida") or "", tx, px))
print("\n".join(AVISOS) or "margens ok")
