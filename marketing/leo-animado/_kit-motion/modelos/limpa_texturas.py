"""Apaga texto e marca das texturas de um modelo baixado (pacote K09 do kit de motion do Legalizaí).

Roda no Python do corte-viral (numpy, cv2, PIL), sempre com -B.

Uso:
    python -B limpa_texturas.py <regioes.json> <pasta_das_texturas> <pasta_de_saida>

O JSON tem um conjunto por grupo de texturas que dividem o mesmo mapa UV:
    {"conjuntos": [{"nome": "...", "cor": "x_diff_1k.jpg", "normal": "x_nor_gl_1k.jpg", "arm": "x_arm_1k.jpg",
                    "regioes": [{"tipo": "faixa" | "traco", "ret": [x0, y0, x1, y1], "nota": "...", ...}]}]}
Tipos de região:
    circulo  "circulo": [cx, cy, raio]; o disco inteiro é preenchido com cv2.inpaint nos três mapas (mancha grande,
            como um emblema).
    faixa   cada linha do retângulo vira a mediana da própria linha, nos três mapas (some o texto e fica o perfil da
            faixa; serve em faixa que se repete na horizontal, como o anel de uma lente). Na cor e no ARM entra um
            ruído leve com o desvio da linha, pra não ficar liso demais.
    traco   máscara dos traços finos: pixel que destoa da mediana local (janela 'janela', padrão 15) mais que
            'limiar' (padrão 35) e com saturação abaixo de 'satMax' (padrão 70), na cor e no normal; a máscara é
            dilatada ('dilata', padrão 2) e os três mapas são preenchidos com cv2.inpaint (TELEA, raio 3).
As texturas limpas saem em JPEG qualidade 92, 4:4:4, na pasta de saída, com o mesmo nome, e as originais não mudam.
Imprime quantos pixels mudaram por região e por mapa.
"""
import io
import json
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import glb  # noqa: E402,F401  (põe KIT/lib no sys.path)
import escrita  # noqa: E402
import cv2  # noqa: E402
import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402


def _le(caminho):
    im = cv2.imread(caminho, cv2.IMREAD_COLOR)
    if im is None:
        raise SystemExit("não deu pra ler %s" % caminho)
    return im


def _grava_jpg(caminho, im):
    """JPEG qualidade 92 sem subamostragem de cor (4:4:4), que preserva o detalhe do mapa de normal."""
    buf = io.BytesIO()
    Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)).save(buf, "JPEG", quality=92, subsampling=0, optimize=True)
    escrita.grava_bytes(caminho, buf.getvalue(), cria_pasta=True)


def _faixa(im, ret, ruido, rng):
    x0, y0, x1, y1 = ret
    bloco = im[y0:y1, x0:x1].astype(np.float32)
    med = np.median(bloco, axis=1, keepdims=True)
    novo = np.repeat(med, x1 - x0, axis=1)
    if ruido:
        mad = np.median(np.abs(bloco - med), axis=1, keepdims=True) * 1.4826
        novo = novo + rng.normal(0.0, 1.0, novo.shape).astype(np.float32) * np.minimum(mad, 6.0) * 0.6
    novo = np.clip(np.rint(novo), 0, 255).astype(np.uint8)
    mudou = int(np.count_nonzero(np.any(novo != im[y0:y1, x0:x1], axis=2)))
    im[y0:y1, x0:x1] = novo
    return mudou


def _mascara_traco(cor, normal, ret, janela, limiar, sat_max, limiar_normal):
    x0, y0, x1, y1 = ret
    m = np.zeros(cor.shape[:2], np.uint8)
    lum = cv2.cvtColor(cor, cv2.COLOR_BGR2GRAY)
    med = cv2.medianBlur(lum, janela)
    sat = cor.max(axis=2).astype(np.int16) - cor.min(axis=2).astype(np.int16)
    dev = np.abs(lum.astype(np.int16) - med.astype(np.int16))
    sel = (dev > limiar) & (sat < sat_max)
    if normal is not None and limiar_normal:
        medn = cv2.medianBlur(normal, janela)
        devn = np.abs(normal.astype(np.int16) - medn.astype(np.int16)).max(axis=2)
        sel |= devn > limiar_normal
    m[y0:y1, x0:x1] = sel[y0:y1, x0:x1].astype(np.uint8) * 255
    return m


def limpa(spec_caminho, pasta, saida):
    with open(spec_caminho, encoding="utf-8") as f:
        spec = json.load(f)
    rng = np.random.default_rng(20261002)
    relato = []
    for cj in spec["conjuntos"]:
        mapas = {k: _le(os.path.join(pasta, cj[k])) for k in ("cor", "normal", "arm") if cj.get(k)}
        for r in cj["regioes"]:
            ret = [int(v) for v in r["ret"]] if "ret" in r else None
            if r["tipo"] == "faixa":
                for k, im in mapas.items():
                    n = _faixa(im, ret, ruido=(k != "normal"), rng=rng)
                    relato.append((cj["nome"], r.get("nota", ""), k, n))
            elif r["tipo"] == "traco":
                m = _mascara_traco(mapas["cor"], mapas.get("normal"), ret, int(r.get("janela", 15)),
                                   int(r.get("limiar", 35)), int(r.get("satMax", 70)), int(r.get("limiarNormal", 0)))
                d = int(r.get("dilata", 2))
                if d:
                    m = cv2.dilate(m, np.ones((3, 3), np.uint8), iterations=d)
                x0, y0, x1, y1 = ret
                recorte = np.zeros_like(m)
                recorte[y0:y1, x0:x1] = m[y0:y1, x0:x1]
                for k, im in mapas.items():
                    antes = im.copy()
                    mapas[k] = cv2.inpaint(im, recorte, 3, cv2.INPAINT_TELEA)
                    n = int(np.count_nonzero(np.any(mapas[k] != antes, axis=2)))
                    relato.append((cj["nome"], r.get("nota", ""), k, n))
            elif r["tipo"] == "circulo":
                cx, cy, raio = (int(v) for v in r["circulo"])
                m = np.zeros(mapas["cor"].shape[:2], np.uint8)
                cv2.circle(m, (cx, cy), raio, 255, -1)
                for k, im in mapas.items():
                    antes = im.copy()
                    mapas[k] = cv2.inpaint(im, m, 3, cv2.INPAINT_TELEA)
                    n = int(np.count_nonzero(np.any(mapas[k] != antes, axis=2)))
                    relato.append((cj["nome"], r.get("nota", ""), k, n))
            else:
                raise SystemExit("tipo de região desconhecido: %s" % r["tipo"])
        for k, im in mapas.items():
            _grava_jpg(os.path.join(saida, cj[k]), im)
    return relato


def _main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    if len(argv) != 3:
        print(__doc__)
        return 2
    for nome, nota, mapa, n in limpa(*argv):
        print("%-22s %-34s %-6s %6d pixels" % (nome, nota[:34], mapa, n))
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
