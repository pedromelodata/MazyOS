"""Junta PNGs (com alfa) lado a lado sobre fundo claro, com título em cima de cada um (Python do sistema, com PIL).

python prancha.py <saida.png> <a.png> <b.png> ... [--titulos "A|B|C"] [--alt 600] [--colunas 4]
"""
import argparse

from PIL import Image, ImageDraw, ImageFont


def main():
    a = argparse.ArgumentParser()
    a.add_argument("saida")
    a.add_argument("imagens", nargs="+")
    a.add_argument("--titulos", default="")
    a.add_argument("--alt", type=int, default=600)
    a.add_argument("--colunas", type=int, default=0)
    p = a.parse_args()
    fundo = (236, 236, 236)
    ims = []
    for arq in p.imagens:
        im = Image.open(arq).convert("RGBA")
        im = im.resize((round(im.width * p.alt / im.height), p.alt), Image.LANCZOS)
        f = Image.new("RGBA", im.size, fundo + (255,))
        f.alpha_composite(im)
        ims.append(f.convert("RGB"))
    titulos = p.titulos.split("|") if p.titulos else []
    col = p.colunas or len(ims)
    linhas = [ims[i:i + col] for i in range(0, len(ims), col)]
    topo = 40 if titulos else 0
    larg = max(sum(i.width for i in l) for l in linhas)
    folha = Image.new("RGB", (larg, len(linhas) * (p.alt + topo)), fundo)
    d = ImageDraw.Draw(folha)
    fonte = ImageFont.truetype("arial.ttf", 24)
    k = 0
    for li, linha in enumerate(linhas):
        x = 0
        for im in linha:
            y = li * (p.alt + topo)
            folha.paste(im, (x, y + topo))
            if k < len(titulos):
                d.text((x + 12, y + 8), titulos[k], fill=(20, 20, 20), font=fonte)
            x += im.width
            k += 1
    folha.save(p.saida, optimize=True)
    print("prancha:", p.saida)


if __name__ == "__main__":
    main()
