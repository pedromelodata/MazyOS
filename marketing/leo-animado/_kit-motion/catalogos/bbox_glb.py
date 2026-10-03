"""Caixa (bounding box) de um GLB pelo chunk JSON, sem bibliotecas novas (pacote K01).

Lê o cabeçalho e o chunk JSON do .glb (o chunk binário não é lido), percorre a cena padrão aplicando a matrix
ou o TRS de cada nó e combina o min e o max dos acessores POSITION de cada primitiva: os 8 cantos da caixa de
cada primitiva passam pela matriz do nó, como no Box3.setFromObject do three.js. Malha com esqueleto entra pela
matriz do nó (pose de ligação aproximada).

Uso:
    python -B bbox_glb.py <arquivo.glb> [--escala s] [--json]

Importável:
    caixa(caminho, escala=1.0) -> {"min": [x, y, z], "max": [x, y, z], "tamanho": [x, y, z]}
    info(caminho) -> contagens (nós, malhas, materiais, imagens, triângulos), animações, extensões e nomes
"""
import json
import struct
import sys

IDENT = (1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0)  # coluna a coluna (glTF)


def le_json_glb(caminho):
    """Devolve o dicionário do chunk JSON do GLB."""
    with open(caminho, "rb") as f:
        cab = f.read(12)
        if len(cab) < 12:
            raise ValueError("%s: arquivo curto demais pra ser GLB" % caminho)
        magia, versao, _total = struct.unpack("<4sII", cab)
        if magia != b"glTF":
            raise ValueError("%s: não é GLB (assinatura %r)" % (caminho, magia))
        if versao != 2:
            raise ValueError("%s: GLB versão %d (só a 2 é aceita)" % (caminho, versao))
        tam, tipo = struct.unpack("<I4s", f.read(8))
        if tipo != b"JSON":
            raise ValueError("%s: o primeiro chunk não é JSON" % caminho)
        return json.loads(f.read(tam).decode("utf-8"))


def _mul(a, b):
    """Produto a * b de matrizes 4x4 guardadas coluna a coluna."""
    m = [0.0] * 16
    for c in range(4):
        for r in range(4):
            m[c * 4 + r] = (a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1]
                            + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3])
    return m


def _trs(t, q, s):
    x, y, z, w = q
    xx, yy, zz = x * x, y * y, z * z
    xy, xz, yz = x * y, x * z, y * z
    wx, wy, wz = w * x, w * y, w * z
    r00, r01, r02 = 1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy)
    r10, r11, r12 = 2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx)
    r20, r21, r22 = 2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy)
    sx, sy, sz = s
    return [r00 * sx, r10 * sx, r20 * sx, 0.0,
            r01 * sy, r11 * sy, r21 * sy, 0.0,
            r02 * sz, r12 * sz, r22 * sz, 0.0,
            t[0], t[1], t[2], 1.0]


def _local(no):
    if "matrix" in no:
        return [float(v) for v in no["matrix"]]
    return _trs(no.get("translation", (0, 0, 0)), no.get("rotation", (0, 0, 0, 1)), no.get("scale", (1, 1, 1)))


def _aplica(m, p):
    x, y, z = p
    return (m[0] * x + m[4] * y + m[8] * z + m[12],
            m[1] * x + m[5] * y + m[9] * z + m[13],
            m[2] * x + m[6] * y + m[10] * z + m[14])


_NORMALIZA = {5120: lambda v: max(v / 127.0, -1.0), 5121: lambda v: v / 255.0,
              5122: lambda v: max(v / 32767.0, -1.0), 5123: lambda v: v / 65535.0}


def _min_max(acessor):
    if "min" not in acessor or "max" not in acessor:
        raise ValueError("acessor POSITION sem min e max (o glTF exige os dois)")
    mn, mx = list(acessor["min"]), list(acessor["max"])
    if acessor.get("normalized") and acessor.get("componentType") in _NORMALIZA:
        f = _NORMALIZA[acessor["componentType"]]
        mn, mx = [f(v) for v in mn], [f(v) for v in mx]
    return mn, mx


def _raizes(g):
    cenas = g.get("scenes") or []
    if cenas:
        return list(cenas[g.get("scene", 0)].get("nodes", []))
    filhos = {c for no in g.get("nodes", []) for c in no.get("children", [])}
    return [i for i in range(len(g.get("nodes", []))) if i not in filhos]


def _percorre(g):
    """Gera (índice do nó, matriz do mundo) pra cada nó da cena padrão."""
    nos = g.get("nodes", [])
    pilha = [(i, IDENT) for i in reversed(_raizes(g))]
    vistos = set()
    while pilha:
        i, pai = pilha.pop()
        if i in vistos:
            continue
        vistos.add(i)
        mundo = _mul(pai, _local(nos[i]))
        yield i, mundo
        for c in reversed(nos[i].get("children", [])):
            pilha.append((c, mundo))


def caixa_bruta(g):
    """Caixa nas unidades do arquivo, ou None se a cena não tiver malha."""
    lo, hi = [float("inf")] * 3, [float("-inf")] * 3
    acessores, malhas, nos = g.get("accessors", []), g.get("meshes", []), g.get("nodes", [])
    achou = False
    for i, m in _percorre(g):
        if "mesh" not in nos[i]:
            continue
        for prim in malhas[nos[i]["mesh"]].get("primitives", []):
            ip = prim.get("attributes", {}).get("POSITION")
            if ip is None:
                continue
            mn, mx = _min_max(acessores[ip])
            for cx in (mn[0], mx[0]):
                for cy in (mn[1], mx[1]):
                    for cz in (mn[2], mx[2]):
                        p = _aplica(m, (cx, cy, cz))
                        for k in range(3):
                            lo[k] = min(lo[k], p[k])
                            hi[k] = max(hi[k], p[k])
                        achou = True
    return (lo, hi) if achou else None


def caixa(caminho, escala=1.0):
    """Caixa {min, max, tamanho} em unidades do arquivo multiplicadas pela escala (metros com a escala sugerida)."""
    g = le_json_glb(caminho)
    cb = caixa_bruta(g)
    if cb is None:
        raise ValueError("%s: a cena padrão não tem malha com POSITION" % caminho)
    s = float(escala)
    lo = [round(v * s, 6) for v in cb[0]]
    hi = [round(v * s, 6) for v in cb[1]]
    if s < 0:
        lo, hi = [min(a, b) for a, b in zip(lo, hi)], [max(a, b) for a, b in zip(lo, hi)]
    return {"min": lo, "max": hi, "tamanho": [round(b - a, 6) for a, b in zip(lo, hi)]}


def _triangulos_prim(g, prim):
    acessores = g.get("accessors", [])
    modo = prim.get("mode", 4)
    if "indices" in prim:
        n = acessores[prim["indices"]]["count"]
    else:
        ip = prim.get("attributes", {}).get("POSITION")
        n = acessores[ip]["count"] if ip is not None else 0
    if modo == 4:
        return n // 3
    if modo in (5, 6):
        return max(0, n - 2)
    return 0


def info(caminho):
    """Contagens e nomes tirados do chunk JSON."""
    g = le_json_glb(caminho)
    malhas = g.get("meshes", [])
    tri_malha = [sum(_triangulos_prim(g, p) for p in m.get("primitives", [])) for m in malhas]
    nos = g.get("nodes", [])
    instancias = [nos[i]["mesh"] for i, _m in _percorre(g) if "mesh" in nos[i]]
    asset = g.get("asset", {})
    return {
        "nos": len(nos),
        "malhas": len(malhas),
        "materiais": len(g.get("materials", [])),
        "imagens": len(g.get("images", [])),
        "texturas": len(g.get("textures", [])),
        "triangulos": sum(tri_malha),
        "triangulosNaCena": sum(tri_malha[i] for i in instancias),
        "animacoes": [a.get("name", "") for a in g.get("animations", [])],
        "extensoesGltf": list(g.get("extensionsUsed", [])),
        "extensoesObrigatorias": list(g.get("extensionsRequired", [])),
        "temEsqueleto": bool(g.get("skins")),
        "nomesNos": [n.get("name") for n in nos if n.get("name")],
        "nomesMateriais": [m.get("name") for m in g.get("materials", []) if m.get("name")],
        "asset": {k: asset[k] for k in ("generator", "version", "copyright", "extras") if k in asset},
    }


def _main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    if not argv or argv[0].startswith("-"):
        print(__doc__)
        return 2
    caminho, escala, como_json = argv[0], 1.0, False
    i = 1
    while i < len(argv):
        if argv[i] == "--escala" and i + 1 < len(argv):
            escala = float(argv[i + 1].replace(",", "."))
            i += 2
        elif argv[i] == "--json":
            como_json = True
            i += 1
        else:
            print("opção desconhecida: %s" % argv[i])
            return 2
    cx = caixa(caminho, escala)
    if como_json:
        print(json.dumps({"arquivo": caminho, "escala": escala, "caixa": cx, "info": info(caminho)},
                         ensure_ascii=False, indent=2))
    else:
        t = cx["tamanho"]
        print("caixa (escala %g): min %s max %s" % (escala, cx["min"], cx["max"]))
        print("tamanho: %.4f x %.4f x %.4f" % (t[0], t[1], t[2]))
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
