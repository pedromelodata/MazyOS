"""Ajusta um GLB pronto (Poly Pizza) só pelo chunk JSON, sem tocar na geometria nem nas texturas.

Pacote K09 do kit de motion do Legalizaí. Roda no Python do corte-viral, sempre com -B.

Uso:
    python -B ajusta_glb.py <entrada.glb> <saida.glb> --mapa <mapa.json>

O mapa (JSON) diz o que muda:
    separaPrimitivas  {nó original: {nome do filho: [índices das primitivas]}}: as primitivas da malha do nó viram
                      malhas e nós filhos com nome próprio (por exemplo vidro e tampa separados)
    nos, malhas, materiais   {nome original: nome novo}
    raiz              nome do nó raiz (o nó de cima vira a raiz se não tiver malha nem transformação; senão entra um
                      nó novo acima dele)
    tamanhoReal       {"eixo": "x" | "y" | "z", "metros": m}: escala uniforme no nó raiz pra o tamanho real
    alinha            {"x": "centro", "y": "base", "z": "centro"}: translação no nó raiz (base = mínimo no zero)
    extras            vai pro asset.extras (título, autor, licença, fonte, mudanças)
Confere a regra do kit (sem extensão obrigatória, sem Draco e sem arquivo externo) e grava a saída pelo
KIT/lib/escrita.py. Imprime a caixa final em metros.
"""
import json
import os
import sys

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import glb  # noqa: E402  (põe KIT/lib no sys.path)
import escrita  # noqa: E402

sys.path.insert(0, os.path.join(glb.KIT, "catalogos"))
import bbox_glb  # noqa: E402

EIXO = {"x": 0, "y": 1, "z": 2}


def _acha_no(gltf, nome):
    for i, n in enumerate(gltf.get("nodes", [])):
        if n.get("name") == nome:
            return i
    raise SystemExit("nó não encontrado: %s (há: %s)" % (nome, [n.get("name") for n in gltf.get("nodes", [])]))


def separa_primitivas(gltf, nome_no, grupos):
    i = _acha_no(gltf, nome_no)
    no = gltf["nodes"][i]
    m = no.pop("mesh")
    prims = gltf["meshes"][m]["primitives"]
    usados = sorted(k for ks in grupos.values() for k in ks)
    if usados != list(range(len(prims))):
        raise SystemExit("os grupos de %s têm de cobrir as primitivas 0 a %d uma vez só" % (nome_no, len(prims) - 1))
    filhos = []
    for k, (nome, ks) in enumerate(grupos.items()):
        malha = {"name": nome, "primitives": [prims[j] for j in ks]}
        if k == 0:
            gltf["meshes"][m] = malha
            idx = m
        else:
            gltf["meshes"].append(malha)
            idx = len(gltf["meshes"]) - 1
        gltf["nodes"].append({"name": nome, "mesh": idx})
        filhos.append(len(gltf["nodes"]) - 1)
    no["children"] = list(no.get("children", [])) + filhos


def _sem_transformacao(no):
    return not any(k in no for k in ("matrix", "translation", "rotation", "scale"))


def poe_raiz(gltf, nome, escala, translacao):
    cena = gltf["scenes"][gltf.get("scene", 0)]
    topo = list(cena["nodes"])
    if len(topo) == 1 and "mesh" not in gltf["nodes"][topo[0]] and _sem_transformacao(gltf["nodes"][topo[0]]):
        r = topo[0]
        gltf["nodes"][r]["name"] = nome
    else:
        gltf["nodes"].append({"name": nome, "children": topo})
        r = len(gltf["nodes"]) - 1
        cena["nodes"] = [r]
    no = gltf["nodes"][r]
    if escala != 1.0:
        no["scale"] = [escala, escala, escala]
    if any(abs(v) > 0 for v in translacao):
        no["translation"] = list(translacao)
    return r


def ajusta(entrada, saida, mapa):
    gltf, binario = glb.le(entrada)
    for nome_no, grupos in mapa.get("separaPrimitivas", {}).items():
        separa_primitivas(gltf, nome_no, grupos)
    glb.renomeia(gltf, mapa.get("nos"), mapa.get("malhas"), mapa.get("materiais"))
    escala, trans = 1.0, [0.0, 0.0, 0.0]
    lo, hi = bbox_glb.caixa_bruta(gltf)
    if mapa.get("tamanhoReal"):
        e = EIXO[mapa["tamanhoReal"]["eixo"]]
        escala = float(mapa["tamanhoReal"]["metros"]) / (hi[e] - lo[e])
    for eixo, modo in (mapa.get("alinha") or {}).items():
        e = EIXO[eixo]
        if modo == "centro":
            trans[e] = -escala * (lo[e] + hi[e]) / 2.0
        elif modo == "base":
            trans[e] = -escala * lo[e]
        else:
            raise SystemExit("alinhamento desconhecido: %s" % modo)
    if mapa.get("raiz"):
        poe_raiz(gltf, mapa["raiz"], escala, [round(v, 9) + 0.0 for v in trans])
    elif escala != 1.0 or any(trans):
        raise SystemExit("tamanhoReal e alinha pedem um nó raiz (campo raiz)")
    glb.poe_extras(gltf, mapa.get("extras", {}))
    prob = glb.problemas(gltf)
    if prob:
        raise SystemExit("GLB fora da regra do kit: %s" % "; ".join(prob))
    escrita.exige_disco(400, "gravar %s" % saida)
    destino = glb.grava(saida, gltf, binario, cria_pasta=True)
    return destino, escala, trans


def _main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    if len(argv) != 4 or argv[2] != "--mapa":
        print(__doc__)
        return 2
    with open(argv[3], encoding="utf-8") as f:
        mapa = json.load(f)
    destino, escala, trans = ajusta(argv[0], argv[1], mapa)
    cx = bbox_glb.caixa(destino)
    print("gravado %s (%d bytes); escala %.9g, translação %s" % (destino, os.path.getsize(destino), escala,
                                                                [round(v, 6) for v in trans]))
    print("caixa em metros: min %s max %s tamanho %s" % (cx["min"], cx["max"], cx["tamanho"]))
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
