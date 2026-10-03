"""Checagem de legenda: aparelho invadindo a legenda (pacote K07). Contrato: KIT/DESENHO.md, seções 7.7 e 7.8.

Pra cada quadro, as linhas da frase ativa são calculadas como o CSS da legenda Apple (LegendaApple do K06, o
AppleCaptions do reel de 02/10): Sora 700 no tamanho da legenda, letter-spacing -0,025 em por caractere, palavra
como inline-block com margem direita de 0,24 em, largura 960 (esquerda 60), quebra gulosa, linha de 1,1 em,
bloco centrado na caixa top/altura, e o deslocamento vertical da entrada e da saída. A largura de cada palavra é
medida com o PIL (ImageFont.truetype e set_variation_by_axes([700])).
O polígono do aparelho vem do qc/quadros<sufixo>.json (os 8 cantos da caixa do catálogo com pose, flutuação e câmera
com deriva, projetados; o polígono é o fecho convexo deles).
Folga = a distância assinada entre a borda do polígono e o retângulo da linha (positiva: a borda passa por fora;
negativa: a borda corta o retângulo, e o número é o quanto ela entra). Linha inteira por cima da tela (dentro do
polígono, longe da borda) não é invasão.
Invasão = folga abaixo da margem. A margem foi calibrada no guia, que foi aprovado (seção 7.8: o guia tem que passar);
os 8 px do contrato reprovavam o guia. Medido no guia (02/10, props da cena do guia): com a frase inteira visível
(opacidade da frase >= 0,9) a borda do aparelho entra no máximo 4,76 px na 2ª linha da frase 5 (quadro 359, 11,97 s);
com a frase entrando (opacidade 0,21, ainda borrada) entra 24,66 px (quadro 331). As margens ficam nesses números
menos 1 px de tolerância (o PIL deste venv mede sem kerning): MARGEM_CHEIA -6 px e MARGEM_TRANSICAO -26 px.
Os 8 px do contrato viram alerta (lista "perto", não bloqueia).
Quebra de linha a menos de 2% da largura é marcada como incerta, e a outra quebra possível também é conferida.

Uso (sempre com python -B):
    python -B qc_legenda.py <peça> [--cena <arquivo>] [--margem -6] [--margem-transicao -26] [--alerta 8]
                            [--tipos aparelho]
Grava qc/legenda<sufixo>.json. Código de saída: 0 sem invasão, 1 com invasão, 2 erro de uso.
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import datetime  # noqa: E402
import math  # noqa: E402
import os  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
from comum import escrita  # noqa: E402

MARGEM_CONTRATO = 8.0  # seção 7.8; reprovava o guia aprovado: virou o nível de alerta
MARGEM_CHEIA = -6.0  # frase com opacidade >= OPACIDADE_CHEIA (guia: folga mínima real -4,76 px, quadro 359)
MARGEM_TRANSICAO = -26.0  # frase entrando ou saindo (guia: -24,66 px, quadro 331, opacidade 0,21)
OPACIDADE_CHEIA = 0.9
CALIBRACAO = {
    "peca": "guia-pronta-2026-10-14 (cena cenas.json, via a cópia KIT/pecas/_teste-saida)",
    "medidoEm": "2026-10-02",
    "folgaMinimaCheia": {"folgaPx": -4.76, "quadro": 359, "t": 11.97, "frase": 5, "linha": 1, "opacidade": 1.0},
    "folgaMinimaTransicao": {"folgaPx": -24.66, "quadro": 331, "t": 11.03, "frase": 5, "linha": 1, "opacidade": 0.206},
    "regra": "margem = folga mínima real do guia arredondada pra baixo, menos 1 px de tolerância (PIL sem kerning)",
}
INCERTA_FRACAO = 0.02
PADRAO_LEGENDA = {"top": 292, "altura": 330, "tamanho": 74, "esquerda": 60, "largura": 960}  # os padrões do componente


# ---------- layout da legenda (o CSS do LegendaApple) ----------
class Layout:
    def __init__(self, legenda):
        from PIL import ImageFont
        self.tamanho = float(legenda.get("tamanho", PADRAO_LEGENDA["tamanho"]))
        self.esquerda = float(legenda.get("esquerda", PADRAO_LEGENDA["esquerda"]) or PADRAO_LEGENDA["esquerda"])
        self.largura = float(legenda.get("largura", PADRAO_LEGENDA["largura"]) or PADRAO_LEGENDA["largura"])
        self.top = float(legenda.get("top", PADRAO_LEGENDA["top"]))
        self.altura = float(legenda.get("altura", PADRAO_LEGENDA["altura"]))
        self.lh = 1.1 * self.tamanho
        self.ls = -0.025 * self.tamanho
        self.mr = 0.24 * self.tamanho
        self.fonte = ImageFont.truetype(comum.SORA, int(round(self.tamanho)))
        self.fonte.set_variation_by_axes([700])
        self._cache = {}

    def palavra(self, texto):
        if texto not in self._cache:
            self._cache[texto] = self.fonte.getlength(texto) + len(texto) * self.ls
        return self._cache[texto]

    def quebra(self, palavras, forcar=None):
        """Quebra gulosa. forcar: {índice: True (quebra antes) | False (não quebra)} pra a alternativa incerta."""
        forcar = forcar or {}
        linhas, atual, w = [], [], 0.0
        incertas = []
        for i, p in enumerate(palavras):
            pw = self.palavra(p)
            caixa = pw + self.mr
            if atual:
                sobra = w + caixa - self.largura
                cabe = sobra <= 0.5
                if abs(sobra) < INCERTA_FRACAO * self.largura:
                    incertas.append({"antes": i, "palavra": p, "sobraPx": round(sobra, 1)})
                if i in forcar:
                    cabe = not forcar[i]
                if not cabe:
                    linhas.append(atual)
                    atual, w = [], 0.0
            atual.append(i)
            w += caixa
        if atual:
            linhas.append(atual)
        return linhas, incertas

    def retangulos(self, palavras, linhas):
        n = len(linhas)
        y0 = self.top + (self.altura - n * self.lh) / 2.0
        out = []
        for k, ln in enumerate(linhas):
            larguras = [self.palavra(palavras[i]) for i in ln]
            caixa = sum(larguras) + self.mr * len(ln)
            x0 = self.esquerda + (self.largura - caixa) / 2.0
            x1 = x0 + sum(larguras) + self.mr * (len(ln) - 1)
            out.append({"texto": " ".join(palavras[i] for i in ln), "x0": x0, "y0": y0 + k * self.lh, "x1": x1,
                        "y1": y0 + (k + 1) * self.lh, "largura": caixa})
        return out


def out_cubic(t):
    t = min(1.0, max(0.0, t))
    return 1 - (1 - t) ** 3


def estado_frase(fr, t):
    """(visível, opacidade, deslocamento vertical) como o LegendaApple."""
    tin = -0.3 if fr.get("title") else fr["s"] - 0.1
    tout = fr["out"] - 0.26
    if t < tin or t > tout + 0.15:
        return False, 0.0, 0.0
    kin = out_cubic((t - tin) / 0.18)
    kout = 0.0 if t < tout else out_cubic((t - tout) / 0.14)
    return True, kin * (1 - kout), (1 - kin) * 18 - kout * 22


# ---------- geometria ----------
def fecho_convexo(pts):
    pts = sorted(set((float(x), float(y)) for x, y in pts))
    if len(pts) <= 2:
        return pts

    def cruz(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    baixo, cima = [], []
    for p in pts:
        while len(baixo) >= 2 and cruz(baixo[-2], baixo[-1], p) <= 0:
            baixo.pop()
        baixo.append(p)
    for p in reversed(pts):
        while len(cima) >= 2 and cruz(cima[-2], cima[-1], p) <= 0:
            cima.pop()
        cima.append(p)
    return baixo[:-1] + cima[:-1]


def dentro_convexo(poli, p):
    n = len(poli)
    if n < 3:
        return False
    sinal = 0
    for i in range(n):
        a, b = poli[i], poli[(i + 1) % n]
        c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
        if c != 0:
            s = 1 if c > 0 else -1
            if sinal == 0:
                sinal = s
            elif s != sinal:
                return False
    return True


def recorta(a, b, r):
    """Liang-Barsky: o pedaço do segmento ab dentro do retângulo r=(x0,y0,x1,y1), ou None."""
    x0, y0, x1, y1 = r
    dx, dy = b[0] - a[0], b[1] - a[1]
    t0, t1 = 0.0, 1.0
    for p, q in ((-dx, a[0] - x0), (dx, x1 - a[0]), (-dy, a[1] - y0), (dy, y1 - a[1])):
        if p == 0:
            if q < 0:
                return None
        else:
            t = q / p
            if p < 0:
                if t > t1:
                    return None
                t0 = max(t0, t)
            else:
                if t < t0:
                    return None
                t1 = min(t1, t)
    return (a[0] + t0 * dx, a[1] + t0 * dy), (a[0] + t1 * dx, a[1] + t1 * dy)


def dist_ponto_seg(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    l2 = dx * dx + dy * dy
    t = 0.0 if l2 == 0 else max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2))
    return math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))


def dist_ponto_ret(p, r):
    x0, y0, x1, y1 = r
    dx = max(x0 - p[0], 0.0, p[0] - x1)
    dy = max(y0 - p[1], 0.0, p[1] - y1)
    return math.hypot(dx, dy)


def folga(poli, r):
    """Folga assinada entre a borda do polígono e o retângulo: + distância (sem tocar), - profundidade (cortando).
    Devolve (folga, relação: 'fora' | 'dentro' | 'cruza')."""
    n = len(poli)
    cantos = [(r[0], r[1]), (r[2], r[1]), (r[2], r[3]), (r[0], r[3])]
    profundidade = None
    for i in range(n):
        a, b = poli[i], poli[(i + 1) % n]
        pedaco = recorta(a, b, r)
        if pedaco:
            # profundidade: o quanto a borda entra no retângulo (amostrada no pedaço de dentro)
            for k in range(21):
                u = k / 20.0
                q = (pedaco[0][0] + u * (pedaco[1][0] - pedaco[0][0]), pedaco[0][1] + u * (pedaco[1][1] - pedaco[0][1]))
                d = min(q[0] - r[0], r[2] - q[0], q[1] - r[1], r[3] - q[1])
                profundidade = d if profundidade is None else max(profundidade, d)
    if profundidade is not None:
        return -max(0.0, profundidade), "cruza"
    d = float("inf")
    for i in range(n):
        a, b = poli[i], poli[(i + 1) % n]
        d = min(d, dist_ponto_ret(a, r), dist_ponto_ret(b, r))
        for c in cantos:
            d = min(d, dist_ponto_seg(c, a, b))
    centro = ((r[0] + r[2]) / 2.0, (r[1] + r[3]) / 2.0)
    return d, ("dentro" if dentro_convexo(poli, centro) else "fora")


# ---------- checagem ----------
def checa(props, quadros, margem=MARGEM_CHEIA, margem_transicao=MARGEM_TRANSICAO, alerta=MARGEM_CONTRATO,
          tipos=("aparelho",)):
    lay = Layout(props.get("legenda") or {})
    narr = props["narracao"]
    palavras_todas = [w["t"] for w in narr["words"]]
    frases = []
    for n, fr in enumerate(narr["phrases"]):
        pal = [palavras_todas[i] for i in fr["w"]]
        linhas, incertas = lay.quebra(pal)
        alternativas = [linhas]
        for inc in incertas:
            alt, _ = lay.quebra(pal, {inc["antes"]: not any(inc["antes"] == ln[0] for ln in linhas)})
            if alt != linhas and alt not in alternativas:
                alternativas.append(alt)
        frases.append({"n": n, "frase": fr, "palavras": pal, "layouts": [lay.retangulos(pal, ls) for ls in alternativas],
                       "incertas": incertas})
    ids = [o["id"] for o in quadros["objetos"] if o.get("tipo") in tipos]
    fps = quadros["fps"]
    invasoes, pertos, incertos_q = [], [], []
    minimos = {}
    rel_cont = {"fora": 0, "dentro": 0, "cruza": 0}
    com_legenda = 0
    pior = {"cheia": None, "transicao": None}
    for f in quadros["quadros"]:
        q, t = f["q"], f["q"] / fps
        polis = []
        for oid in ids:
            o = f["obj"].get(oid)
            if not o or not o.get("visivel") or not o.get("cantos"):
                continue
            if o.get("atras"):
                incertos_q.append({"q": q, "objeto": oid, "motivo": "canto atrás da câmera"})
                continue
            polis.append((oid, fecho_convexo(o["cantos"])))
        ativo = False
        for fr in frases:
            vis, op, dy = estado_frase(fr["frase"], t)
            if not vis or op <= 0:
                continue
            ativo = True
            fase = "cheia" if op >= OPACIDADE_CHEIA else "transicao"
            lim = margem if fase == "cheia" else margem_transicao
            for li_layout, layout in enumerate(fr["layouts"]):
                for k, ln in enumerate(layout):
                    r = (ln["x0"], ln["y0"] + dy, ln["x1"], ln["y1"] + dy)
                    for oid, poli in polis:
                        fg, relacao = folga(poli, r)
                        rel_cont[relacao] += 1
                        item = {"q": q, "t": round(t, 3), "frase": fr["n"], "linha": k, "texto": ln["texto"],
                                "objeto": oid, "folga": round(fg, 2), "relacao": relacao, "opacidade": round(op, 3),
                                "fase": fase, "layoutAlternativo": li_layout > 0}
                        chave = (fr["n"], k, oid, fase)
                        if chave not in minimos or fg < minimos[chave]["folga"]:
                            minimos[chave] = item
                        if pior[fase] is None or fg < pior[fase]["folga"]:
                            pior[fase] = item
                        if fg < lim:
                            invasoes.append(dict(item, margem=lim))
                        elif fg < alerta:
                            pertos.append(dict(item, margem=lim))
        if ativo:
            com_legenda += 1
    return {
        "layout": {"fonte": comum.SORA, "peso": 700, "tamanho": lay.tamanho, "letterSpacingPx": lay.ls,
                   "margemPalavraPx": lay.mr, "linhaPx": lay.lh,
                   "caixa": {"esquerda": lay.esquerda, "top": lay.top, "largura": lay.largura, "altura": lay.altura},
                   "medida": "PIL getlength (sem kerning: o PIL deste venv não tem raqm)"},
        "frases": [{"n": fr["n"], "texto": " ".join(fr["palavras"]),
                    "linhas": [{k: (round(v, 1) if isinstance(v, float) else v) for k, v in ln.items()}
                               for ln in fr["layouts"][0]],
                    "incertas": fr["incertas"], "alternativas": len(fr["layouts"]) - 1} for fr in frases],
        "objetosConferidos": ids,
        "quadrosComLegenda": com_legenda,
        "relacoes": rel_cont,
        "invasoes": invasoes,
        "quadrosComInvasao": sorted(set(i["q"] for i in invasoes)),
        "perto": pertos,
        "quadrosPerto": sorted(set(i["q"] for i in pertos)),
        "folgaMinima": pior,
        "minimosPorLinha": sorted(minimos.values(), key=lambda m: m["folga"]),
        "incertos": incertos_q,
    }


def roda(peca, margem=MARGEM_CHEIA, margem_transicao=MARGEM_TRANSICAO, alerta=MARGEM_CONTRATO, tipos=("aparelho",)):
    props = peca.le_props()
    if not os.path.isfile(peca.quadros):
        raise comum.ErroSaida("falta %s (rode kit.py qc, que roda o quadros.mjs antes)" % peca.quadros, 2)
    quadros = comum.le_json(peca.quadros)
    r = checa(props, quadros, margem, margem_transicao, alerta, tuple(tipos))
    doc = {
        "versao": 1, "peca": props.get("peca"), "cena": peca.nome_cena, "props": os.path.basename(peca.props),
        "quadros": os.path.basename(peca.quadros), "feitoEm": datetime.datetime.now().isoformat(timespec="seconds"),
        "margens": {"cheiaPx": margem, "transicaoPx": margem_transicao, "alertaPx": alerta,
                    "opacidadeCheia": OPACIDADE_CHEIA, "contratoPx": MARGEM_CONTRATO, "calibracao": CALIBRACAO},
        "criterio": ("folga = distância assinada entre a borda do polígono do aparelho (fecho convexo dos 8 cantos "
                     "projetados) e o retângulo de uma linha da frase visível (negativa quando a borda corta a linha). "
                     "Invasão: folga abaixo de %.1f px com a frase cheia (opacidade >= %.1f) ou de %.1f px com a frase "
                     "entrando ou saindo. Abaixo de %.1f px (a margem do contrato) vira alerta, sem bloquear. Linha "
                     "inteira sobre a tela, longe da borda, não conta."
                     % (margem, OPACIDADE_CHEIA, margem_transicao, alerta)),
        **r,
        "ok": not r["invasoes"],
    }
    escrita.grava_json(peca.legenda, doc, cria_pasta=True)
    return doc


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="qc_legenda.py", description="Aparelho invadindo a legenda (K07, seção 7.8).")
    ap.add_argument("peca")
    ap.add_argument("--cena")
    ap.add_argument("--margem", type=float, default=MARGEM_CHEIA, help="margem com a frase cheia (padrão -6, calibrada)")
    ap.add_argument("--margem-transicao", type=float, default=MARGEM_TRANSICAO,
                    help="margem com a frase entrando ou saindo (padrão -26, calibrada)")
    ap.add_argument("--alerta", type=float, default=MARGEM_CONTRATO, help="abaixo disso vira alerta (padrão 8)")
    ap.add_argument("--tipos", default="aparelho", help="tipos de objeto conferidos (padrão aparelho)")
    a = ap.parse_args(argv)
    try:
        peca = comum.Peca(a.peca, a.cena)
        doc = roda(peca, a.margem, a.margem_transicao, a.alerta, [t.strip() for t in a.tipos.split(",") if t.strip()])
    except (comum.ErroSaida, escrita.EscritaRecusada) as e:
        print("erro: %s" % e)
        return getattr(e, "codigo", 2)
    print("legenda: %d quadros com legenda; relações linha x aparelho: %s" % (doc["quadrosComLegenda"], doc["relacoes"]))
    for fr in doc["frases"]:
        marca = ""
        if fr["incertas"]:
            marca = " (quebra incerta: %s)" % ", ".join("antes de '%s' %+.1f px" % (i["palavra"], i["sobraPx"])
                                                        for i in fr["incertas"])
        print("  frase %d: %s%s" % (fr["n"], " / ".join(ln["texto"] for ln in fr["linhas"]), marca))
    for fase, rot in (("cheia", "frase cheia"), ("transicao", "frase entrando ou saindo")):
        fm = doc["folgaMinima"][fase]
        if fm:
            print("folga mínima (%s): %.2f px (%s) no quadro %d (t %.2f s, opacidade %.2f), frase %d linha %d, %s" % (
                rot, fm["folga"], fm["relacao"], fm["q"], fm["t"], fm["opacidade"], fm["frase"], fm["linha"],
                fm["objeto"]))
    if doc["perto"]:
        print("alerta: %d linha(s) em %d quadro(s) com folga abaixo de %.1f px (não bloqueia)"
              % (len(doc["perto"]), len(doc["quadrosPerto"]), a.alerta))
    if doc["invasoes"]:
        print("INVASÃO: %d linha(s) em %d quadro(s) (margens %.1f px cheia e %.1f px na transição): %s" % (
            len(doc["invasoes"]), len(doc["quadrosComInvasao"]), a.margem, a.margem_transicao,
            ", ".join(str(q) for q in doc["quadrosComInvasao"][:30])))
    else:
        print("sem invasão (margens %.1f px cheia e %.1f px na transição, calibradas no guia)"
              % (a.margem, a.margem_transicao))
    print("gravado: %s" % peca.legenda)
    return 0 if doc["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
