"""Proposta de capa (pacote K07). Contrato: KIT/DESENHO.md, seção 7.3.

- Fundo: um still do KitMotion no quadro escolhido (--quadro, ou capa.quadro das props; "auto" = 15 quadros depois do
  início da palavra-chave da primeira frase), feito pelo stills.mjs do K06 (com o vigia de disco) com as props sem a
  legenda (o título toma o lugar dela), ou um PNG pronto com --still (é assim que o teste do K07 roda, sem render).
- Título: --titulo ou capa.titulo, em Sora 800, 92 px (desce de 2 em 2 até 64 px se não couber em 3 linhas de
  900 px), tinta #1B1E24 sobre faixa creme #FAF8F5 a 92% com raio 40, centrada em y 420 (desce o mínimo pra a faixa
  ficar dentro da área 4:5); a palavra destaque (--destaque ou capa.destaque) em #DD4E27. Tudo dentro da área 4:5 do
  centro (y 285 a 1635), que é o que aparece na grade do perfil.
- Saídas: saida/capa<sufixo>.png (1080x1920) e saida/capa<sufixo>-grade.jpg (o recorte 4:5 reduzido pra 540x675),
  mais saida/capa<sufixo>.json com as medidas.
- Conferência: zero travessão, zero "APP EM CONSTRUÇÃO", "Legalizaí" com acento; aviso se o título tiver o nome da
  marca (o nome só aparece no fecho). A capa é proposta: o Pedro aprova junto da prévia.

Uso (sempre com python -B):
    python -B capa.py <peça> [--cena <arquivo>] [--quadro N] [--titulo "..."] [--destaque palavra] [--still <png>]
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import datetime  # noqa: E402
import io  # noqa: E402
import os  # noqa: E402
import re  # noqa: E402
import unicodedata  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
from comum import escrita  # noqa: E402

LARGURA, ALTURA = 1080, 1920
AREA_4X5 = (0, 285, 1080, 1635)  # x0, y0, x1, y1: o recorte 4:5 do centro (1080x1350)
TAM_MAX, TAM_MIN, PASSO = 92, 64, 2
LARGURA_LINHA = 900
MAX_LINHAS = 3
CENTRO_Y = 420
TINTA = (0x1B, 0x1E, 0x24)
DESTAQUE = (0xDD, 0x4E, 0x27)
CREME = (0xFA, 0xF8, 0xF5)
OPACIDADE = 0.92
RAIO = 40
PAD_X, PAD_Y = 44, 30
FOLGA_AREA = 0  # a faixa pode encostar na borda da área 4:5 (assim ela cobre a legenda do still, que fica em y 206 a 536)
LARGURA_FAIXA_MIN = 960  # a largura da caixa da legenda (x 60 a 1020): um still com legenda fica coberto
ENTRELINHA = 1.08


def _sem_acento(s):
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c)).casefold()


def confere_titulo(titulo):
    erros, avisos = [], []
    if comum.tem_travessao(titulo):
        erros.append("travessão no título (PROIBIDO P26)")
    if re.search(r"app\s+em\s+constru[cç][aã]o", titulo, re.I):
        erros.append("'APP EM CONSTRUÇÃO' no título (vetado)")
    if re.search(r"(?i)legalizai(?!í)", titulo):
        erros.append("'Legalizai' sem acento (escreva Legalizaí)")
    if "legaliza" in _sem_acento(titulo):
        avisos.append("o título tem o nome da marca: o nome só aparece no fecho")
    return erros, avisos


def fonte(tam):
    from PIL import ImageFont
    f = ImageFont.truetype(comum.SORA, tam)
    f.set_variation_by_axes([800])
    return f


def quebra(palavras, f, largura):
    linhas, atual = [], []
    for p in palavras:
        teste = " ".join(atual + [p])
        if atual and f.getlength(teste) > largura:
            linhas.append(atual)
            atual = [p]
        else:
            atual.append(p)
    if atual:
        linhas.append(atual)
    return linhas


def _e_destaque(palavra, destaque):
    if not destaque:
        return False
    limpa = lambda s: re.sub(r"[^\w]", "", _sem_acento(s))  # noqa: E731
    alvo = [limpa(x) for x in destaque.split()]
    return limpa(palavra) in alvo


def monta(still, titulo, destaque=None):
    from PIL import Image, ImageDraw
    fundo = Image.open(still).convert("RGB")
    if fundo.size != (LARGURA, ALTURA):
        fundo = fundo.resize((LARGURA, ALTURA), Image.LANCZOS)
    palavras = titulo.split()
    tam = TAM_MAX
    while True:
        f = fonte(tam)
        linhas = quebra(palavras, f, LARGURA_LINHA)
        if len(linhas) <= MAX_LINHAS or tam <= TAM_MIN:
            break
        tam -= PASSO
    lh = round(tam * ENTRELINHA)
    asc, desc = f.getmetrics()
    largura_txt = max(f.getlength(" ".join(ln)) for ln in linhas)
    alt_txt = lh * (len(linhas) - 1) + asc + desc
    fw = int(round(max(largura_txt + 2 * PAD_X, LARGURA_FAIXA_MIN)))
    fh = int(round(alt_txt + 2 * PAD_Y))
    cy = max(CENTRO_Y, AREA_4X5[1] + FOLGA_AREA + fh / 2.0)
    cy = min(cy, AREA_4X5[3] - FOLGA_AREA - fh / 2.0)
    fx0 = int(round(LARGURA / 2.0 - fw / 2.0))
    fy0 = int(round(cy - fh / 2.0))
    faixa = (fx0, fy0, fx0 + fw, fy0 + fh)
    camada = Image.new("RGBA", (LARGURA, ALTURA), (0, 0, 0, 0))
    d = ImageDraw.Draw(camada)
    d.rounded_rectangle(faixa, radius=RAIO, fill=CREME + (int(round(255 * OPACIDADE)),))
    img = Image.alpha_composite(fundo.convert("RGBA"), camada)
    d = ImageDraw.Draw(img)
    espaco = f.getlength(" ")
    y = fy0 + PAD_Y
    caixas_txt = []
    usou_destaque = False
    for ln in linhas:
        w = f.getlength(" ".join(ln))
        x = LARGURA / 2.0 - w / 2.0
        for i, p in enumerate(ln):
            cor = DESTAQUE if _e_destaque(p, destaque) else TINTA
            usou_destaque = usou_destaque or cor == DESTAQUE
            d.text((x, y), p, font=f, fill=cor + (255,))
            x += f.getlength(p) + (espaco if i < len(ln) - 1 else 0)
        caixas_txt.append((round(LARGURA / 2.0 - w / 2.0, 1), y, round(LARGURA / 2.0 + w / 2.0, 1), y + asc + desc))
        y += lh
    dentro = (faixa[0] >= AREA_4X5[0] and faixa[1] >= AREA_4X5[1] and faixa[2] <= AREA_4X5[2] and faixa[3] <= AREA_4X5[3])
    info = {"tamanhoFonte": tam, "linhas": [" ".join(ln) for ln in linhas], "faixa": list(faixa), "centroY": round(cy, 1),
            "caixasTexto": caixas_txt, "area4x5": list(AREA_4X5), "dentroDa4x5": dentro, "destaque": destaque,
            "destaqueAchado": usou_destaque, "coube": len(linhas) <= MAX_LINHAS}
    return img.convert("RGB"), info


def _png(img):
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return buf.getvalue()


def _jpg(img):
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=88)
    return buf.getvalue()


def quadro_auto(props):
    narr = props["narracao"]
    fr = narr["phrases"][0]
    return int(round(narr["words"][fr["key"]]["s"] * props.get("fps", 30))) + 15


def faz_still(peca, props, quadro):
    """Um still do KitMotion pelo stills.mjs do K06 (com o vigia de disco), sem a legenda: as props da capa são as da
    peça com narracao.phrases vazio (as palavras ficam, então as batidas presas a elas caem no mesmo lugar). O título da
    capa toma o lugar da legenda. O still espera a vez na trava de render (kit_stills). Devolve o caminho do PNG."""
    import kit_stills
    sem_legenda = dict(props)
    sem_legenda["narracao"] = dict(props["narracao"], phrases=[])
    arq = peca.saida("props-capa", ".json", "provas")
    escrita.grava_json(arq, sem_legenda, cria_pasta=True)
    pngs = kit_stills.stills(peca, [quadro], ["KitMotion"], prefixo_extra="capa-", props=arq, rotulo="capa")
    return pngs[0]


def capa(peca, quadro=None, titulo=None, destaque=None, still=None):
    props = peca.le_props()
    cp = props.get("capa") or {}
    titulo = (titulo or cp.get("titulo") or "").strip()
    if not titulo:
        raise comum.ErroSaida("sem título: passe --titulo ou preencha capa.titulo na cena", 2)
    if destaque is None:
        destaque = cp.get("destaque")
    erros, avisos = confere_titulo(titulo)
    if still:
        origem = comum.barra(os.path.abspath(still))
        if not os.path.isfile(origem):
            raise comum.ErroSaida("o still não existe: %s" % origem, 2)
        q = None
    else:
        q = quadro if quadro is not None else cp.get("quadro", "auto")
        if q in (None, "auto"):
            q = quadro_auto(props)
        q = int(q)
        origem = faz_still(peca, props, q)
    img, info = monta(origem, titulo, destaque)
    if destaque and not info["destaqueAchado"]:
        avisos.append("o destaque '%s' não está no título" % destaque)
    if not info["coube"]:
        avisos.append("o título não coube em 3 linhas nem com 64 px: encurte")
    if not info["dentroDa4x5"]:
        erros.append("a faixa do título sai da área 4:5 (y 285 a 1635)")
    saida_png = peca.saida("capa", ".png", "saida")
    saida_jpg = peca.saida("capa", "-grade.jpg", "saida")
    escrita.grava_bytes(saida_png, _png(img), cria_pasta=True)
    from PIL import Image
    grade = img.crop(AREA_4X5).resize((540, 675), Image.LANCZOS)
    escrita.grava_bytes(saida_jpg, _jpg(grade), cria_pasta=True)
    doc = {"versao": 1, "peca": props.get("peca"), "cena": peca.nome_cena, "titulo": titulo, "still": origem,
           "quadro": q, "png": saida_png, "grade": saida_jpg, "tamanho": [img.width, img.height],
           "tamanhoGrade": [grade.width, grade.height], **info, "erros": erros, "avisos": avisos,
           "feitoEm": datetime.datetime.now().isoformat(timespec="seconds"), "ok": not erros,
           "nota": "proposta de capa: o Pedro aprova junto da prévia"}
    escrita.grava_json(peca.saida("capa", ".json", "saida"), doc, cria_pasta=True)
    return doc


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="capa.py", description="Proposta de capa (K07, seção 7.3).")
    ap.add_argument("peca")
    ap.add_argument("--cena")
    ap.add_argument("--quadro", type=int)
    ap.add_argument("--titulo")
    ap.add_argument("--destaque")
    ap.add_argument("--still", help="PNG pronto (1080x1920) no lugar do still do KitMotion")
    a = ap.parse_args(argv)
    try:
        peca = comum.Peca(a.peca, a.cena)
        d = capa(peca, a.quadro, a.titulo, a.destaque, a.still)
    except (comum.ErroSaida, escrita.EscritaRecusada, escrita.DiscoInsuficiente) as e:
        print("erro: %s" % e)
        return getattr(e, "codigo", 1)
    print("capa: %s (%dx%d) e %s (%dx%d)" % (d["png"], d["tamanho"][0], d["tamanho"][1], d["grade"],
                                              d["tamanhoGrade"][0], d["tamanhoGrade"][1]))
    print("  título em %d px, %d linha(s): %s" % (d["tamanhoFonte"], len(d["linhas"]), " / ".join(d["linhas"])))
    print("  faixa %s (centro y %.0f), dentro da área 4:5: %s; destaque: %s"
          % (d["faixa"], d["centroY"], "sim" if d["dentroDa4x5"] else "NÃO", d["destaque"] or "nenhum"))
    for x in d["avisos"]:
        print("  aviso: %s" % x)
    for x in d["erros"]:
        print("  ERRO: %s" % x)
    return 0 if d["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
