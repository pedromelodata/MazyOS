"""Ferramentas de GLB do pacote K09 (kit de motion do Legalizaí), em Python puro.

Sem numpy e sem PIL: roda no Python do corte-viral e no Python do Blender 5.2.
Contrato: KIT/DESENHO.md, seções 4.9, 4.12 e 12.

Importável (sempre com sys.dont_write_bytecode = True antes do import):
    le(caminho) -> (gltf, binario)              chunk JSON e chunk BIN do .glb
    monta(gltf, binario) -> bytes               GLB versão 2, chunks alinhados em 4 bytes
    grava(caminho, gltf, binario, forca=False)  grava pelo KIT/lib/escrita.py (temporário e os.replace)
    renomeia(gltf, nos=None, malhas=None, materiais=None) -> {"nos": n, "malhas": n, "materiais": n}
    poe_extras(gltf, extras)                    junta extras em asset.extras
    problemas(gltf) -> [texto]                  extensão obrigatória, Draco, meshopt, Basis, uri externa
    imagens(gltf, binario) -> [(i, nome, mime, bytes)]
    acessor(gltf, binario, i) -> [tupla]        lê um acessor (float, ou inteiro normalizado)
    empacota_gltf(caminho_gltf) -> (gltf, binario)   embute .bin e imagens de um .gltf solto (sem reencode)

Linha de comando:
    python -B glb.py info <arquivo.glb>
    python -B glb.py problemas <arquivo.glb>
"""
import json
import os
import struct
import sys

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(AQUI)
if not os.path.isfile(os.path.join(KIT, "lib", "escrita.py")):
    KIT = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion"
_LIB = os.path.join(KIT, "lib")
if _LIB not in sys.path:
    sys.path.insert(0, _LIB)
import escrita  # noqa: E402

MAGIA = b"glTF"
CHUNK_JSON = 0x4E4F534A
CHUNK_BIN = 0x004E4942
EXT_PROIBIDAS = ("KHR_draco_mesh_compression", "EXT_meshopt_compression", "KHR_meshopt_compression",
                 "KHR_texture_basisu", "EXT_texture_webp", "KHR_mesh_quantization")


def _de_bytes(dados):
    if len(dados) < 20 or dados[:4] != MAGIA:
        raise ValueError("não é GLB (assinatura %r)" % dados[:4])
    versao, total = struct.unpack_from("<II", dados, 4)
    if versao != 2:
        raise ValueError("GLB versão %d (só a 2 é aceita)" % versao)
    if total != len(dados):
        raise ValueError("tamanho do cabeçalho %d diferente do arquivo %d" % (total, len(dados)))
    pos, gltf, binario = 12, None, None
    while pos < total:
        tam, tipo = struct.unpack_from("<II", dados, pos)
        corpo = dados[pos + 8:pos + 8 + tam]
        if tipo == CHUNK_JSON and gltf is None:
            gltf = json.loads(corpo.decode("utf-8"))
        elif tipo == CHUNK_BIN and binario is None:
            binario = bytes(corpo)
        pos += 8 + tam
    if gltf is None:
        raise ValueError("GLB sem chunk JSON")
    return gltf, binario


def le(caminho):
    """(gltf, binario) de um arquivo .glb."""
    with open(caminho, "rb") as f:
        return _de_bytes(f.read())


def _alinha(dados, preenche):
    falta = (-len(dados)) % 4
    return dados + preenche * falta


def monta(gltf, binario):
    """Bytes do GLB versão 2 (JSON preenchido com espaço, BIN com zero)."""
    j = _alinha(json.dumps(gltf, ensure_ascii=False, separators=(",", ":")).encode("utf-8"), b" ")
    partes = [struct.pack("<II", len(j), CHUNK_JSON), j]
    if binario:
        b = _alinha(bytes(binario), b"\x00")
        partes += [struct.pack("<II", len(b), CHUNK_BIN), b]
    corpo = b"".join(partes)
    return struct.pack("<4sII", MAGIA, 2, 12 + len(corpo)) + corpo


def grava(caminho, gltf, binario, forca=False, cria_pasta=False):
    """Grava o GLB pelo escrita.py (temporário na mesma pasta e os.replace; recusa hardlink e caminho protegido)."""
    if gltf.get("buffers"):
        b0 = gltf["buffers"][0]
        b0.pop("uri", None)
        b0["byteLength"] = len(binario or b"")
    return escrita.grava_bytes(caminho, monta(gltf, binario), forca=forca, cria_pasta=cria_pasta)


def renomeia(gltf, nos=None, malhas=None, materiais=None):
    """Troca nomes de nós, malhas e materiais pelos mapas {antigo: novo}. Devolve quantos trocou."""
    cont = {"nos": 0, "malhas": 0, "materiais": 0}
    for chave, mapa, rotulo in (("nodes", nos, "nos"), ("meshes", malhas, "malhas"), ("materials", materiais, "materiais")):
        if not mapa:
            continue
        for item in gltf.get(chave, []):
            antigo = item.get("name")
            if antigo in mapa:
                item["name"] = mapa[antigo]
                cont[rotulo] += 1
    return cont


def poe_extras(gltf, extras):
    asset = gltf.setdefault("asset", {"version": "2.0"})
    ex = asset.setdefault("extras", {})
    ex.update(extras)
    return asset


def problemas(gltf):
    """Lista o que fere a regra do K09: extensão obrigatória, compressão, Basis, WebP e arquivo externo."""
    out = []
    req = gltf.get("extensionsRequired") or []
    if req:
        out.append("extensões obrigatórias: %s" % ", ".join(req))
    usadas = gltf.get("extensionsUsed") or []
    for e in usadas:
        if e in EXT_PROIBIDAS:
            out.append("extensão proibida no kit: %s" % e)
    for i, b in enumerate(gltf.get("buffers", [])):
        if "uri" in b:
            out.append("buffer %d aponta pra arquivo externo: %s" % (i, b["uri"][:60]))
    for i, im in enumerate(gltf.get("images", [])):
        if "uri" in im:
            out.append("imagem %d aponta pra arquivo externo: %s" % (i, im["uri"][:60]))
        if im.get("mimeType") not in (None, "image/jpeg", "image/png"):
            out.append("imagem %d em formato %s" % (i, im.get("mimeType")))
    return out


def _vista(gltf, binario, iv):
    bv = gltf["bufferViews"][iv]
    ini = bv.get("byteOffset", 0)
    return binario[ini:ini + bv["byteLength"]], bv.get("byteStride")


def imagens(gltf, binario):
    """[(índice, nome, mime, bytes)] das imagens embutidas."""
    out = []
    for i, im in enumerate(gltf.get("images", [])):
        if "bufferView" not in im:
            out.append((i, im.get("name"), im.get("mimeType"), None))
            continue
        dados, _ = _vista(gltf, binario, im["bufferView"])
        out.append((i, im.get("name"), im.get("mimeType"), bytes(dados)))
    return out


_COMP = {5120: ("b", 1, 127.0), 5121: ("B", 1, 255.0), 5122: ("h", 2, 32767.0), 5123: ("H", 2, 65535.0),
         5125: ("I", 4, None), 5126: ("f", 4, None)}
_NCOMP = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def acessor(gltf, binario, i):
    """Valores de um acessor como lista de tuplas (inteiro normalizado vira float). Sem esparsos."""
    a = gltf["accessors"][i]
    if "sparse" in a:
        raise ValueError("acessor %d esparso: não suportado aqui" % i)
    fmt, tam, norm = _COMP[a["componentType"]]
    n = _NCOMP[a["type"]]
    dados, passo = _vista(gltf, binario, a["bufferView"])
    passo = passo or tam * n
    base = a.get("byteOffset", 0)
    out = []
    for k in range(a["count"]):
        v = struct.unpack_from("<%d%s" % (n, fmt), dados, base + k * passo)
        if a.get("normalized") and norm:
            v = tuple(max(x / norm, -1.0) for x in v)
        out.append(v)
    return out


def empacota_gltf(caminho_gltf):
    """Embute o .bin e as imagens de um .gltf solto num buffer único, sem reencodar nada."""
    pasta = os.path.dirname(os.path.abspath(caminho_gltf))
    with open(caminho_gltf, encoding="utf-8") as f:
        gltf = json.load(f)
    if len(gltf.get("buffers", [])) != 1:
        raise ValueError("só sei empacotar .gltf com um buffer")
    with open(os.path.join(pasta, gltf["buffers"][0]["uri"]), "rb") as f:
        binario = bytearray(f.read())
    vistas = gltf.setdefault("bufferViews", [])
    for im in gltf.get("images", []):
        uri = im.pop("uri", None)
        if uri is None:
            continue
        with open(os.path.join(pasta, uri.replace("%20", " ")), "rb") as f:
            dados = f.read()
        while len(binario) % 4:
            binario.append(0)
        vistas.append({"buffer": 0, "byteOffset": len(binario), "byteLength": len(dados)})
        binario.extend(dados)
        im["bufferView"] = len(vistas) - 1
        im.setdefault("mimeType", "image/png" if uri.lower().endswith(".png") else "image/jpeg")
    gltf["buffers"][0] = {"byteLength": len(binario)}
    return gltf, bytes(binario)


def resumo(caminho):
    gltf, binario = le(caminho)
    malhas = gltf.get("meshes", [])
    tri = 0
    for m in malhas:
        for p in m.get("primitives", []):
            if "indices" in p:
                tri += gltf["accessors"][p["indices"]]["count"] // 3
            else:
                tri += gltf["accessors"][p["attributes"]["POSITION"]]["count"] // 3
    return {
        "arquivo": caminho, "tamanho": os.path.getsize(caminho), "md5": escrita.md5(caminho),
        "nos": [n.get("name") for n in gltf.get("nodes", [])],
        "malhas": [m.get("name") for m in malhas],
        "materiais": [m.get("name") for m in gltf.get("materials", [])],
        "imagens": [(i, n, mime, len(b) if b else None) for i, n, mime, b in imagens(gltf, binario or b"")],
        "triangulos": tri,
        "extensoesUsadas": gltf.get("extensionsUsed", []),
        "extensoesObrigatorias": gltf.get("extensionsRequired", []),
        "animacoes": [a.get("name") for a in gltf.get("animations", [])],
        "asset": gltf.get("asset", {}),
        "problemas": problemas(gltf),
    }


def _main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    if len(argv) == 2 and argv[0] in ("info", "problemas"):
        r = resumo(argv[1])
        if argv[0] == "problemas":
            print("\n".join(r["problemas"]) or "nenhum problema")
            return 1 if r["problemas"] else 0
        print(json.dumps(r, ensure_ascii=False, indent=2))
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
