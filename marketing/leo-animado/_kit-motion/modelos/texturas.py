"""Texturas próprias dos modelos do pacote K09 (kit de motion do Legalizaí), desenhadas no PIL.

Roda no Python do corte-viral (PIL e numpy), sempre com -B. Os scripts de Blender chamam este arquivo.

Uso:
    python -B texturas.py check <saida.png>     face do símbolo: quadrado coral #F2643C com o check branco completo
                                                (o último quadro da sequência tex-check, refeito do path do simbolo.svg)
    python -B texturas.py cedula <saida.jpg>    atlas da cédula genérica (frente em cima, verso embaixo)

Cédula: desenhada num atlas de 2048 x 2048, cada face com 2048 x 951 (proporção 0,14 x 0,065 m), a frente nas
linhas 36 a 986 e o verso nas linhas 1060 a 2010, e reduzida pra 1024 x 1024 no fim (traço mais grosso no desenho
pra aguentar a redução). Só ornamento na paleta da marca (coral, creme e tinta): guilhoché, rosetas, faixa de
segurança e moldura. Nada da cédula real: sem número, sem número de série, sem 'R$', sem brasão, sem retrato e sem
texto. Desenho determinístico (semente fixa).
"""
import io
import math
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import glb  # noqa: E402,F401  (põe KIT/lib no sys.path)
import escrita  # noqa: E402
import numpy as np  # noqa: E402
from PIL import Image, ImageDraw, ImageFilter  # noqa: E402

CORAL = "#F2643C"
BRANCO = "#FFFFFF"
VIEWBOX = 211.09
# path do check, igual ao identidade/logos/simbolo.svg e ao marketing/vinheta/check-frames.mjs
CHECK_SVG = ("M211.09,32.95l-105.47,105.47-33.6-33.6c-13.22-13.22-34.65-13.22-47.87,0h0s60.8,60.8,60.8,60.8"
             "c11.41,11.41,29.92,11.41,41.33,0l84.81-84.81v-47.87Z")

ATLAS = 2048
FACE_H = 951
TOPO_FRENTE = 36
TOPO_VERSO = 1060

PALETA = {
    "coral50": "#FEF3EE", "coral100": "#FBDDD1", "coral200": "#F8C3B0", "coral300": "#F5A184",
    "coral400": "#F47F58", "coral500": "#F2643C", "coral600": "#DD4E27", "coral700": "#B83D1C",
    "coral800": "#8C2F16", "creme": "#FAF8F5", "creme2": "#F1EEE9", "tinta": "#24262C", "tinta2": "#524E48",
}


def rgb(hexa):
    h = hexa.lstrip("#")
    return tuple(int(h[k:k + 2], 16) for k in (0, 2, 4))


def _lin(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def _srgb(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055) * 255.0


# Path do check

def _cubica(p0, p1, p2, p3, n=48):
    out = []
    for k in range(1, n + 1):
        t = k / n
        a = (1 - t) ** 3
        b = 3 * (1 - t) ** 2 * t
        c = 3 * (1 - t) * t ** 2
        d = t ** 3
        out.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return out


def _numeros(texto):
    import re
    return [float(v) for v in re.findall(r"-?\d*\.?\d+(?:e-?\d+)?", texto)]


def poligono_check():
    """Polígono do check em coordenadas do viewBox (0 a 211,09), com as curvas achatadas."""
    import re
    pts = []
    atual = (0.0, 0.0)
    ultimo_ctrl = None
    for cmd, args in re.findall(r"([MmLlHhVvCcSsZz])([^MmLlHhVvCcSsZz]*)", CHECK_SVG):
        v = _numeros(args)
        if cmd == "M":
            atual = (v[0], v[1])
            pts.append(atual)
            ultimo_ctrl = None
        elif cmd == "l":
            for k in range(0, len(v), 2):
                atual = (atual[0] + v[k], atual[1] + v[k + 1])
                pts.append(atual)
            ultimo_ctrl = None
        elif cmd == "h":
            for x in v:
                atual = (atual[0] + x, atual[1])
                pts.append(atual)
            ultimo_ctrl = None
        elif cmd == "v":
            for y in v:
                atual = (atual[0], atual[1] + y)
                pts.append(atual)
            ultimo_ctrl = None
        elif cmd == "c":
            for k in range(0, len(v), 6):
                c1 = (atual[0] + v[k], atual[1] + v[k + 1])
                c2 = (atual[0] + v[k + 2], atual[1] + v[k + 3])
                fim = (atual[0] + v[k + 4], atual[1] + v[k + 5])
                pts.extend(_cubica(atual, c1, c2, fim))
                ultimo_ctrl, atual = c2, fim
        elif cmd == "s":
            for k in range(0, len(v), 4):
                c1 = (2 * atual[0] - ultimo_ctrl[0], 2 * atual[1] - ultimo_ctrl[1]) if ultimo_ctrl else atual
                c2 = (atual[0] + v[k], atual[1] + v[k + 1])
                fim = (atual[0] + v[k + 2], atual[1] + v[k + 3])
                pts.extend(_cubica(atual, c1, c2, fim))
                ultimo_ctrl, atual = c2, fim
        elif cmd in "Zz":
            break
        else:
            raise SystemExit("comando de path não suportado: %s" % cmd)
    return pts


def textura_check(lado=2048, super_amostra=4):
    """Face do símbolo: coral com o check branco; borda do check misturada em linear (como o Mix Shader do .blend)."""
    s = lado * super_amostra
    k = s / VIEWBOX
    m = Image.new("L", (s, s), 0)
    ImageDraw.Draw(m).polygon([(x * k, y * k) for x, y in poligono_check()], fill=255)
    a = np.asarray(m.resize((lado, lado), Image.BOX), dtype=np.float64)[..., None] / 255.0
    cor = _lin(np.array(rgb(CORAL), dtype=np.float64))
    branco = _lin(np.array(rgb(BRANCO), dtype=np.float64))
    lin = cor * (1 - a) + branco * a
    out = np.rint(_srgb(lin)).astype(np.uint8)
    return Image.fromarray(out, "RGB")


# Cédula genérica

ESPESSURA = 1.0  # multiplica a largura dos traços (sobe quando o atlas final é reduzido)


def _w(largura, escala):
    return max(1, int(round(largura * escala * ESPESSURA)))


def _mistura(a, b, t):
    ca, cb = rgb(a), rgb(b)
    return tuple(int(round(ca[k] * (1 - t) + cb[k] * t)) for k in range(3))


def _fundo(w, h, c0, c1, c2):
    """Gradiente horizontal em três cores."""
    x = np.linspace(0, 1, w)[None, :, None]
    a, b, c = (np.array(rgb(v), dtype=np.float64) for v in (c0, c1, c2))
    meio = np.where(x < 0.5, a + (b - a) * (x / 0.5), b + (c - b) * ((x - 0.5) / 0.5))
    return np.repeat(meio, h, axis=0)


def _ondas(d, w, h, n, amp, comp, cor, larg, fase=0.0, y0=0.0, y1=None, passo_x=6):
    y1 = h if y1 is None else y1
    for i in range(n):
        base = y0 + (y1 - y0) * (i + 0.5) / n
        ph = fase + i * 0.55
        pts = [(x, base + amp * math.sin(2 * math.pi * x / comp + ph)) for x in range(-passo_x, w + passo_x, passo_x)]
        d.line(pts, fill=cor, width=larg)


def _roseta(d, cx, cy, r_ext, r_int, petalas, copias, cor, larg, passos=900):
    """Roseta de guilhoché: curvas r(t) = média + amplitude * cos(petalas * t), giradas."""
    media = (r_ext + r_int) / 2
    ampl = (r_ext - r_int) / 2
    for c in range(copias):
        giro = 2 * math.pi * c / (copias * petalas)
        pts = []
        for k in range(passos + 1):
            t = 2 * math.pi * k / passos
            r = media + ampl * math.cos(petalas * t)
            pts.append((cx + r * math.cos(t + giro), cy + r * math.sin(t + giro)))
        d.line(pts, fill=cor, width=larg)


def _aneis(d, cx, cy, r0, r1, n, cor, larg):
    for i in range(n):
        r = r0 + (r1 - r0) * i / max(1, n - 1)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=cor, width=larg)


def _corda(d, x0, y0, x1, y1, amp, comp, cor_a, cor_b, larg, vertical=False):
    """Trança de duas senoides defasadas ao longo de um segmento horizontal ou vertical."""
    comprimento = (y1 - y0) if vertical else (x1 - x0)
    for cor, fase in ((cor_a, 0.0), (cor_b, math.pi)):
        pts = []
        for s in range(0, int(comprimento) + 4, 4):
            o = amp * math.sin(2 * math.pi * s / comp + fase)
            pts.append((x0 + o, y0 + s) if vertical else (x0 + s, y0 + o))
        d.line(pts, fill=cor, width=larg)


def _moldura(d, w, h, m, cor_linha, cor_a, cor_b, esc):
    for k, larg in ((0, 3), (int(14 * esc), 2), (int(46 * esc), 2), (int(58 * esc), 3)):
        d.rectangle((m + k, m + k, w - 1 - m - k, h - 1 - m - k), outline=cor_linha, width=_w(larg, esc))
    meio = m + int(30 * esc)
    amp, comp = 9 * esc, 38 * esc
    _corda(d, m + 20 * esc, meio, w - m - 20 * esc, meio, amp, comp, cor_a, cor_b, _w(2, esc))
    _corda(d, m + 20 * esc, h - 1 - meio, w - m - 20 * esc, h - 1 - meio, amp, comp, cor_a, cor_b, _w(2, esc))
    _corda(d, meio, m + 20 * esc, meio, h - m - 20 * esc, amp, comp, cor_a, cor_b, int(2 * esc), vertical=True)
    _corda(d, w - 1 - meio, m + 20 * esc, w - 1 - meio, h - m - 20 * esc, amp, comp, cor_a, cor_b, _w(2, esc),
           vertical=True)


def _papel(im, semente, forca=5.0):
    rng = np.random.default_rng(semente)
    a = np.asarray(im, dtype=np.float64)
    grao = rng.normal(0.0, 1.0, a.shape[:2])
    grao = np.asarray(Image.fromarray(np.uint8(np.clip(grao * 40 + 128, 0, 255))).filter(ImageFilter.GaussianBlur(0.8)),
                      dtype=np.float64) - 128
    a = a + grao[..., None] * (forca / 40.0)
    return Image.fromarray(np.uint8(np.clip(np.rint(a), 0, 255)), "RGB")


def face_cedula(frente, w=2048, h=FACE_H, esc_desenho=2):
    """Uma face da cédula (frente creme, verso coral), desenhada em escala 2 e reduzida."""
    W, H = w * esc_desenho, h * esc_desenho
    e = esc_desenho
    if frente:
        base = _fundo(W, H, PALETA["coral100"], PALETA["creme"], PALETA["coral50"])
        linha_fundo, linha_moldura = PALETA["coral200"], PALETA["coral600"]
        corda_a, corda_b = PALETA["coral500"], PALETA["tinta2"]
        roseta_a, roseta_b, anel = PALETA["coral500"], PALETA["coral700"], PALETA["tinta2"]
    else:
        base = _fundo(W, H, PALETA["coral400"], PALETA["coral500"], PALETA["coral600"])
        linha_fundo, linha_moldura = PALETA["coral300"], PALETA["creme"]
        corda_a, corda_b = PALETA["creme"], PALETA["coral800"]
        roseta_a, roseta_b, anel = PALETA["creme"], PALETA["coral100"], PALETA["coral800"]
    im = Image.fromarray(np.uint8(base), "RGB")
    d = ImageDraw.Draw(im)
    # guilhoché de fundo: duas famílias de ondas cruzadas
    _ondas(d, W, H, 44, 16 * e, 300 * e, linha_fundo, _w(1.2, e), fase=0.0)
    _ondas(d, W, H, 44, 16 * e, 300 * e, linha_fundo, _w(1.2, e), fase=math.pi)
    m = int(26 * e)
    _moldura(d, W, H, m, linha_moldura, corda_a, corda_b, e)
    cy = H / 2
    if frente:
        # medalhão à esquerda, marca d'água à direita e faixa de segurança
        cx = W * 0.25
        d.ellipse((cx - 300 * e, cy - 300 * e, cx + 300 * e, cy + 300 * e), fill=_mistura(PALETA["creme"],
                                                                                          PALETA["coral100"], 0.35))
        _roseta(d, cx, cy, 290 * e, 150 * e, 12, 9, roseta_a, _w(1.6, e))
        _roseta(d, cx, cy, 150 * e, 70 * e, 9, 7, roseta_b, _w(1.4, e))
        _aneis(d, cx, cy, 300 * e, 312 * e, 3, anel, _w(1.2, e))
        _aneis(d, cx, cy, 40 * e, 66 * e, 4, roseta_b, _w(1.2, e))
        wx = W * 0.79
        d.ellipse((wx - 250 * e, cy - 250 * e, wx + 250 * e, cy + 250 * e), fill=_mistura(PALETA["creme"],
                                                                                          PALETA["coral50"], 0.6))
        _aneis(d, wx, cy, 90 * e, 250 * e, 15, PALETA["coral200"], _w(1.0, e))
        _roseta(d, wx, cy, 86 * e, 40 * e, 7, 6, PALETA["coral300"], _w(1.2, e))
        fx = int(W * 0.585)
        d.rectangle((fx, m + 60 * e, fx + 22 * e, H - m - 60 * e), fill=PALETA["coral600"])
        for y in range(int(m + 70 * e), int(H - m - 70 * e), int(34 * e)):
            d.polygon([(fx + 11 * e, y), (fx + 19 * e, y + 9 * e), (fx + 11 * e, y + 18 * e), (fx + 3 * e, y + 9 * e)],
                      fill=PALETA["creme"])
        # microlinhas em zigue-zague no rodapé
        for k in range(4):
            yb = H - m - 120 * e + k * 9 * e
            pts = [(x, yb + (4 * e if (x // (10 * e)) % 2 else 0)) for x in range(int(W * 0.36), int(W * 0.56), 5 * e)]
            d.line(pts, fill=PALETA["tinta2"], width=_w(0.8, e))
        for x, y in ((W * 0.07, H * 0.17), (W * 0.93, H * 0.17), (W * 0.07, H * 0.83), (W * 0.93, H * 0.83)):
            _roseta(d, x, y, 52 * e, 24 * e, 8, 5, PALETA["coral500"], _w(1.2, e))
    else:
        # roseta central grande, duas laterais e faixas de ondas verticais
        cx = W * 0.5
        _aneis(d, cx, cy, 330 * e, 344 * e, 2, anel, _w(1.4, e))
        _roseta(d, cx, cy, 320 * e, 170 * e, 14, 10, roseta_a, _w(1.6, e))
        _roseta(d, cx, cy, 170 * e, 80 * e, 10, 8, roseta_b, _w(1.4, e))
        _aneis(d, cx, cy, 30 * e, 72 * e, 5, roseta_a, _w(1.2, e))
        for lx in (W * 0.16, W * 0.84):
            _roseta(d, lx, cy, 170 * e, 80 * e, 9, 6, roseta_a, _w(1.3, e))
            _aneis(d, lx, cy, 176 * e, 184 * e, 2, anel, _w(1.2, e))
        for x0 in (W * 0.27, W * 0.68):
            for k in range(7):
                xb = x0 + k * 13 * e
                pts = [(xb + 6 * e * math.sin(2 * math.pi * y / (90 * e) + k * 0.6), y)
                       for y in range(int(m + 70 * e), int(H - m - 70 * e), 6)]
                d.line(pts, fill=PALETA["coral200"], width=_w(1.1, e))
    im = im.resize((w, h), Image.LANCZOS)
    return _papel(im, 7 if frente else 11, forca=4.0 if frente else 5.0)


def atlas_cedula(lado=1024):
    """Atlas desenhado em 2048 e reduzido pra 'lado' (as UVs são normalizadas, o layout vale em qualquer lado)."""
    global ESPESSURA
    ESPESSURA = 2048.0 / lado * 0.8 if lado < 2048 else 1.0
    frente = face_cedula(True)
    verso = face_cedula(False)
    a = Image.new("RGB", (ATLAS, ATLAS))
    # margens com a cor da borda de cada face (sem sangrar no mipmap)
    a.paste(frente.getpixel((2, 2)), (0, 0, ATLAS, ATLAS // 2))
    a.paste(verso.getpixel((2, 2)), (0, ATLAS // 2, ATLAS, ATLAS))
    a.paste(frente, (0, TOPO_FRENTE))
    a.paste(verso, (0, TOPO_VERSO))
    if lado != ATLAS:
        a = a.resize((lado, lado), Image.LANCZOS)
    return a


def _grava(im, caminho, formato):
    buf = io.BytesIO()
    if formato == "PNG":
        im.save(buf, "PNG", optimize=True)
    else:
        im.save(buf, "JPEG", quality=90, subsampling=0, optimize=True)
    escrita.grava_bytes(caminho, buf.getvalue(), cria_pasta=True)
    return len(buf.getvalue())


def _main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    if len(argv) != 2 or argv[0] not in ("check", "cedula"):
        print(__doc__)
        return 2
    if argv[0] == "check":
        n = _grava(textura_check(), argv[1], "PNG")
    else:
        n = _grava(atlas_cedula(), argv[1], "JPEG")
    print("K09_TEXTURA %s %d bytes" % (argv[1], n))
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
