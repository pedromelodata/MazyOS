"""Funções comuns dos scripts de Blender do pacote K09 (kit de motion do Legalizaí).

Roda só dentro do Blender 5.2 (bpy). Os scripts que importam este módulo põem a pasta dele no sys.path e ligam
sys.dont_write_bytecode antes do import, pra não criar __pycache__.

- argumentos(): lê o que vem depois de "--" na linha de comando do Blender;
- limpa_cena(): apaga tudo da cena de fábrica (cubo, luz, câmera e dados órfãos);
- linear(hex): cor sRGB "#RRGGBB" convertida pra linear (é o que o Blender e o baseColorFactor do glTF usam);
- material(...): Principled BSDF simples;
- contorno(...), adiciona_caixa(...), caixa_arredondada(...): retângulo de cantos arredondados e caixa com
  borda arredondada (bmesh);
- exporta_glb(saida, extras): exporta GLB sem Draco, sem câmera, luz nem animação, pra um temporário fora da pasta
  final; acrescenta asset.extras e grava a saída pelo KIT/lib/escrita.py (temporário na mesma pasta e os.replace,
  recusa hardlink e caminho protegido), depois de conferir 400 MB livres no C:.
"""
import math
import os
import shutil
import sys
import tempfile

import bmesh
import bpy

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
MODELOS = os.path.dirname(AQUI)
if MODELOS not in sys.path:
    sys.path.insert(0, MODELOS)
import glb  # noqa: E402  (também põe KIT/lib no sys.path)
import escrita  # noqa: E402

PY = os.environ.get("K09_PY", "C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe")
MINIMO_MB = 400


def argumentos(posicionais, opcoes):
    """Lê sys.argv depois de '--'. posicionais: lista de nomes; opcoes: {nome: padrão} (--nome valor)."""
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    saida = dict(opcoes)
    pos = []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a.startswith("--"):
            nome = a[2:].replace("-", "_")
            if nome not in opcoes:
                raise SystemExit("opção desconhecida: %s (opções: %s)" % (a, ", ".join("--" + k for k in opcoes)))
            if i + 1 >= len(argv):
                raise SystemExit("falta o valor de %s" % a)
            saida[nome] = type(opcoes[nome])(argv[i + 1]) if opcoes[nome] is not None else argv[i + 1]
            i += 2
        else:
            pos.append(a)
            i += 1
    if len(pos) < len(posicionais):
        raise SystemExit("uso: blender --background --factory-startup --python <script> -- %s" %
                         " ".join("<%s>" % p for p in posicionais))
    for nome, valor in zip(posicionais, pos):
        saida[nome] = valor
    return saida


def limpa_cena():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for colecao in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights, bpy.data.images,
                    bpy.data.actions, bpy.data.curves):
        for item in list(colecao):
            if item.users == 0:
                colecao.remove(item)


def _canal_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _canal_srgb(c):
    c = min(max(c, 0.0), 1.0)
    return c * 12.92 if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def linear(hexa):
    """'#RRGGBB' (sRGB) -> (r, g, b, 1) linear."""
    h = hexa.lstrip("#")
    return tuple(_canal_linear(int(h[k:k + 2], 16) / 255.0) for k in (0, 2, 4)) + (1.0,)


def srgb255(cor_linear):
    return tuple(round(_canal_srgb(c) * 255) for c in cor_linear[:3])


def material(nome, hexa, rugosidade=0.5, metalico=0.0, revestimento=0.0, especular=0.5):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = linear(hexa)
    bsdf.inputs["Roughness"].default_value = rugosidade
    bsdf.inputs["Metallic"].default_value = metalico
    bsdf.inputs["Coat Weight"].default_value = revestimento
    bsdf.inputs["Specular IOR Level"].default_value = especular
    m.diffuse_color = linear(hexa)
    m.use_backface_culling = True  # malha fechada: no glTF sai doubleSided false
    return m


def material_textura(nome, caminho_imagem, rugosidade=0.5, metalico=0.0, revestimento=0.0, especular=0.5):
    """Principled com a imagem (sRGB, empacotada no .blend em memória) ligada na Base Color."""
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    nos = m.node_tree.nodes
    bsdf = nos.get("Principled BSDF")
    img = bpy.data.images.load(caminho_imagem, check_existing=False)
    img.colorspace_settings.name = "sRGB"
    img.pack()
    tex = nos.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Linear"
    m.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rugosidade
    bsdf.inputs["Metallic"].default_value = metalico
    bsdf.inputs["Coat Weight"].default_value = revestimento
    bsdf.inputs["Specular IOR Level"].default_value = especular
    m.use_backface_culling = True
    return m, img


def objeto(nome, malha, pai=None, local=(0.0, 0.0, 0.0)):
    ob = bpy.data.objects.new(nome, malha)
    bpy.context.scene.collection.objects.link(ob)
    if pai is not None:
        ob.parent = pai
    ob.location = local
    return ob


def vazio(nome, pai=None, local=(0.0, 0.0, 0.0)):
    return objeto(nome, None, pai, local)


def contorno(largura, profundidade, raio, segmentos):
    """Pontos (x, y) de um retângulo de cantos arredondados, centrado, anti-horário visto de +Z."""
    hx, hy = largura / 2.0, profundidade / 2.0
    r = max(min(raio, hx, hy), 1e-6)
    pts = []
    for cx, cy, a0 in ((hx - r, hy - r, 0), (-hx + r, hy - r, 90), (-hx + r, -hy + r, 180), (hx - r, -hy + r, 270)):
        for k in range(segmentos + 1):
            a = math.radians(a0 + 90.0 * k / segmentos)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def _perfil(altura, borda_baixo, borda_cima, seg_borda):
    """[(recuo, z)] de baixo pra cima, com quarto de círculo nas bordas de baixo e de cima."""
    p = []
    if borda_baixo > 0:
        for k in range(seg_borda + 1):
            a = math.radians(90.0 * k / seg_borda)
            p.append((borda_baixo * (1 - math.sin(a)), borda_baixo * (1 - math.cos(a))))
    else:
        p.append((0.0, 0.0))
    if borda_cima > 0:
        for k in range(seg_borda + 1):
            a = math.radians(90.0 * k / seg_borda)
            p.append((borda_cima * (1 - math.cos(a)), altura - borda_cima + borda_cima * math.sin(a)))
    else:
        p.append((0.0, altura))
    return p


def adiciona_caixa(bm, largura, profundidade, altura, raio, borda_baixo=0.0, borda_cima=0.0, seg_canto=8,
                   seg_borda=3, desloca=(0.0, 0.0, 0.0), suave=True, indice_material=0):
    """Acrescenta ao bmesh uma caixa de cantos arredondados em planta e borda arredondada em cima e embaixo.

    z vai de 0 a altura (mais o deslocamento). As tampas de cima e de baixo têm as arestas marcadas como vivas,
    pra o sombreado suave não entortar a face plana.
    """
    aneis = []
    for recuo, z in _perfil(altura, borda_baixo, borda_cima, seg_borda):
        pts = contorno(largura - 2 * recuo, profundidade - 2 * recuo, raio - recuo, seg_canto)
        aneis.append([bm.verts.new((x + desloca[0], y + desloca[1], z + desloca[2])) for x, y in pts])
    n = len(aneis[0])
    for a, b in zip(aneis[:-1], aneis[1:]):
        for k in range(n):
            f = bm.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]))
            f.smooth = suave
            f.material_index = indice_material
    for f in (bm.faces.new(list(reversed(aneis[0]))), bm.faces.new(aneis[-1])):
        f.smooth = suave
        f.material_index = indice_material
        for e in f.edges:
            e.smooth = False


def caixa_arredondada(nome, largura, profundidade, altura, raio, borda_baixo=0.0, borda_cima=0.0,
                      seg_canto=8, seg_borda=3, desloca=(0.0, 0.0, 0.0), suave=True):
    """Malha com uma caixa só (ver adiciona_caixa)."""
    bm = bmesh.new()
    adiciona_caixa(bm, largura, profundidade, altura, raio, borda_baixo, borda_cima, seg_canto, seg_borda,
                   desloca, suave)
    return bm_para_malha(bm, nome)


def bm_para_malha(bm, nome):
    malha = bpy.data.meshes.new(nome)
    bm.to_mesh(malha)
    bm.free()
    return malha


def exporta_glb(saida, extras, aplica_modificadores=True, cores_vertice="NONE", animacoes=False):
    """Exporta a cena pra GLB num temporário, acrescenta asset.extras e grava a saída pelo escrita.py."""
    escrita.exige_disco(MINIMO_MB, "exportar %s" % saida)
    pasta_tmp = tempfile.mkdtemp(prefix="k09-exporta-")
    try:
        tmp = os.path.join(pasta_tmp, "saida.glb")
        bpy.ops.export_scene.gltf(
            filepath=tmp, check_existing=False, export_format="GLB", export_yup=True,
            export_apply=aplica_modificadores, export_animations=animacoes, export_cameras=False,
            export_lights=False, export_draco_mesh_compression_enable=False,
            export_meshopt_compression_enable=False, export_image_format="AUTO", export_materials="EXPORT",
            export_texcoords=True, export_normals=True, export_tangents=False, export_vertex_color=cores_vertice,
            export_extras=False, use_selection=False, export_use_gltfpack=False)
        gltf, binario = glb.le(tmp)
        glb.poe_extras(gltf, extras)
        prob = glb.problemas(gltf)
        if prob:
            raise SystemExit("GLB fora da regra do kit: %s" % "; ".join(prob))
        destino = glb.grava(saida, gltf, binario, cria_pasta=True)
    finally:
        shutil.rmtree(pasta_tmp, ignore_errors=True)  # só a pasta que esta função criou
    print("K09_GRAVADO %s %d bytes" % (destino, os.path.getsize(destino)))
    return destino
