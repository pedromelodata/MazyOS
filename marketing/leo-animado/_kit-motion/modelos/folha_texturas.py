"""Folha de contato reduzida das texturas (pra conferir logo e texto sem abrir imagem em tamanho cheio).

Pacote K09 do kit de motion do Legalizaí. Roda no Python do corte-viral (PIL), sempre com -B.

Uso:
    python -B folha_texturas.py <saida.jpg> <arquivo.glb | imagem.jpg | imagem.png> [...] [--lado 300]
        [--recorte imagem x0 y0 x1 y1]

Cada imagem vira uma miniatura de --lado pixels (padrão 300) com o nome embaixo. Num GLB, entram as imagens
embutidas. --recorte acrescenta um recorte (em pixels da imagem original) ampliado no mesmo lado. A folha sai em
JPEG pequeno e é gravada pelo KIT/lib/escrita.py.
"""
import io
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import glb  # noqa: E402
import escrita  # noqa: E402
from PIL import Image, ImageDraw  # noqa: E402


def _imagens(caminhos):
    for c in caminhos:
        if c.lower().endswith(".glb"):
            g, b = glb.le(c)
            for i, nome, mime, dados in glb.imagens(g, b):
                if dados:
                    yield "%s #%d %s" % (os.path.basename(c), i, nome or ""), Image.open(io.BytesIO(dados))
        else:
            yield os.path.basename(c), Image.open(c)


def folha(saida, caminhos, lado=300, recortes=()):
    itens = []
    for rotulo, im in _imagens(caminhos):
        im.load()
        itens.append((rotulo + " (%dx%d)" % im.size, im))
    for nome, x0, y0, x1, y1 in recortes:
        im = Image.open(nome)
        itens.append(("recorte %s [%d,%d,%d,%d]" % (os.path.basename(nome), x0, y0, x1, y1), im.crop((x0, y0, x1, y1))))
    colunas = min(4, max(1, len(itens)))
    linhas = (len(itens) + colunas - 1) // colunas
    alto = lado + 16
    f = Image.new("RGB", (colunas * lado, linhas * alto), (255, 255, 255))
    d = ImageDraw.Draw(f)
    for k, (rotulo, im) in enumerate(itens):
        im = im.convert("RGBA")
        fundo = Image.new("RGBA", im.size, (128, 128, 128, 255))
        fundo.alpha_composite(im)
        mini = fundo.convert("RGB")
        mini.thumbnail((lado, lado), Image.LANCZOS)
        x, y = (k % colunas) * lado, (k // colunas) * alto
        f.paste(mini, (x, y))
        d.text((x + 3, y + lado + 2), rotulo[:48], fill=(0, 0, 0))
    buf = io.BytesIO()
    f.save(buf, "JPEG", quality=78)
    escrita.grava_bytes(saida, buf.getvalue(), cria_pasta=True)
    return f.size, len(buf.getvalue())


def _main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    if len(argv) < 2:
        print(__doc__)
        return 2
    lado, recortes, arquivos = 300, [], []
    i = 1
    while i < len(argv):
        if argv[i] == "--lado":
            lado = int(argv[i + 1])
            i += 2
        elif argv[i] == "--recorte":
            recortes.append((argv[i + 1],) + tuple(int(v) for v in argv[i + 2:i + 6]))
            i += 6
        else:
            arquivos.append(argv[i])
            i += 1
    tam, nbytes = folha(argv[0], arquivos, lado, recortes)
    print("folha %s: %dx%d, %d bytes" % (argv[0], tam[0], tam[1], nbytes))
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
