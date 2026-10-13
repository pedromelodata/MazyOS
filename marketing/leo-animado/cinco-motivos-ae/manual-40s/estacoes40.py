"""Estações do take único (13/10/2026): cada tomada do roteiro40.json vira uma parte do mundo que a câmera percorre,
com a linha guiando de uma parte pra outra. Mede a largura de cada texto com a fonte de verdade (Sora 800 e DM Serif
Italic) e diminui o tamanho do que não cabe: 888 px no papel, 780 dentro do cartão escuro, a coluna da esquerda até o
celular. Grava src/cinco/estacoes40.json no Remotion, o grão dos cartões e as telas no public-cinco-v9.
Uso: python -B estacoes40.py"""
import json, os, random
from PIL import Image, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
RM = os.path.normpath(os.path.join(AQUI, "..", "..", "precificacao-2026-10-02", "remotion"))
PUB = os.path.join(RM, "public-cinco-v9")
R = json.load(open(os.path.join(AQUI, "roteiro40.json"), encoding="utf-8"))

sora = os.path.join(PUB, "Sora-wght.ttf")
serif = os.path.join(PUB, "fontes", "DMSerifDisplay-Italic.ttf")
_cache = {}


def largura(txt, fonte, px, track):
    k = (fonte, px)
    if k not in _cache:
        f = ImageFont.truetype(sora if fonte == "sora" else serif, px)
        if fonte == "sora":
            f.set_variation_by_axes([800])
        _cache[k] = f
    return _cache[k].getlength(txt) + max(0, len(txt) - 1) * track * px


# a coluna da esquerda nas partes com o celular (o corpo do celular vai de x 618 a 900)
COLUNA = {19: {"4": 330, "o app": 330, "calcula.": 330}, 22: {"é com a": 300, "gente,": 300}}
estacoes = []
for t in R["tomadas"]:
    cartao = t["fundo"].startswith("tinta")
    e = {"n": t["n"], "de": t["de"], "ate": t["ate"], "cartao": cartao, "textos": [], "imagens": [], "celular": None, "pilula": None, "fecho": False}
    ordem = 0
    for tx, fo, px, cor, x, y in t["camadas"]:
        if tx == "FITA":
            continue
        if tx == "FECHO":
            e["fecho"] = True
            continue
        if tx.startswith("IMG"):
            arq = tx.split(" ")[1]
            if arq.startswith("13-") or arq.startswith("14-"):
                e["celular"] = {"i0": 0 if arq.startswith("13-") else 168, "x": 760, "y": 900}
            else:
                esc = int(tx.split("escala ")[1].split("%")[0]) / 100
                giro = int(tx.split("giro ")[1].split(",")[0]) if "giro" in tx else 0
                e["imagens"].append({"src": "telas40/" + arq, "w": round(1290 * esc), "h": round(2796 * esc), "x": x or 540, "y": y, "giro": giro})
            ordem += 1
            continue
        if tx.startswith("PILULA"):
            e["pilula"] = {"x": 540, "y": 1030, "w": 620, "h": 150, "de": t["de"] + 3}
            ordem += 1
            continue
        fonte = "sora" if fo == "Sora" else "serif"
        track = 0.04 if tx == "LINK DA BIO" else (-0.015 if fonte == "sora" else 0)
        xx = COLUNA.get(t["n"], {}).get(tx, x or 540)
        if xx < 540:
            esq = 140 if cartao else 96
            maxw = 2 * min(xx - esq, 590 - xx)
        elif tx == "LINK DA BIO":
            maxw = 540
        else:
            maxw = 780 if cartao else 888
        w = largura(tx, fonte, px, track)
        pxf = px if w <= maxw else int(px * maxw / w)
        cor_final = {"coral": "#F2643C", "branco": "#FFFFFF", "tinta": "#15171C"}.get(cor, "#FAF8F5" if cartao else "#15171C")
        yy = 1030 if tx == "LINK DA BIO" else y
        e["textos"].append({"tx": tx, "fonte": fonte, "px": pxf, "cor": cor_final, "x": xx, "y": yy, "track": track,
                            "de": t["de"] + (0 if ordem == 0 else 3), "destaque": cor == "coral", "brilho": cor == "coral" and cartao,
                            "w": round(largura(tx, fonte, pxf, track))})
        ordem += 1
    estacoes.append(e)

json.dump({"fps": R["fps"], "total": R["total"], "fecho": R["fecho"], "estacoes": estacoes},
          open(os.path.join(RM, "src", "cinco", "estacoes40.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# grão dos cartões escuros (o degradê escuro faz banda no x264 sem ele)
random.seed(40)
im = Image.new("L", (256, 256))
im.putdata([random.randint(0, 255) for _ in range(256 * 256)])
im.convert("RGB").save(os.path.join(PUB, "ruido40.png"))

os.makedirs(os.path.join(PUB, "telas40"), exist_ok=True)
for arq in ["11-tela-emitir-nota.png", "12-tela-pro-labore.png"]:
    dst = os.path.join(PUB, "telas40", arq)
    if not os.path.exists(dst):
        os.link(os.path.join(AQUI, "material", arq), dst)

ajustados = [(e["n"], t["tx"], t["px"]) for e in estacoes for t in e["textos"]]
print(len(estacoes), "estações;", sum(1 for e in estacoes if e["cartao"]), "com cartão escuro")
print("Vai, mede", round(largura("Vai,", "sora", 106, -0.035)), "px")
print("textos:", ajustados)
