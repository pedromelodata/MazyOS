"""Partes comuns do Léo por peças, tudo do Meshy 7 Ultra (Pedro, 30/10/2026): parâmetros, importação, malha em
numpy, cor da textura por vértice, luz de estúdio e fotos.

Roda dentro do Blender (importado pelos scripts bl_vestir_*.py). Convenção de sempre: frente para -Y, esquerda do
Léo em +X, chão em z = 0, 0,98 m de altura.
"""
import json
import math
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Matrix, Vector

RAIZ = Path(__file__).resolve().parent.parent
bpy.context.preferences.filepaths.save_version = 0  # sem .blend1: o disco está apertado e os passos se refazem
DIR_VESTIR = RAIZ / "geracoes" / "vestir"
DIR_RENDER = RAIZ / "renders" / "vestir"


def params():
    """Lê o JSON de parâmetros (primeiro argumento depois do "--"); caminhos relativos partem da pasta leo-3d."""
    arq = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else RAIZ / "scripts" / "vestir-params.json"
    P = json.load(open(arq, encoding="utf-8"))
    for k, v in list(P.items()):
        if isinstance(v, str) and k.endswith(("_glb", "_png")):
            P[k] = str((RAIZ / v).resolve())
    DIR_VESTIR.mkdir(parents=True, exist_ok=True)
    DIR_RENDER.mkdir(parents=True, exist_ok=True)
    return P


def importar(glb, nome):
    """Importa um GLB, junta as malhas num objeto só, sem pai e com as transformações aplicadas."""
    antes = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=glb)
    novos = [o for o in bpy.data.objects if o not in antes]
    malhas = [o for o in novos if o.type == "MESH"]
    for o in malhas:
        mw = o.matrix_world.copy()
        o.parent = None
        o.data.transform(mw)
        o.matrix_world = Matrix.Identity(4)
    for o in novos:
        if o.type != "MESH":
            bpy.data.objects.remove(o)
    if len(malhas) > 1:
        with bpy.context.temp_override(active_object=malhas[0], selected_editable_objects=malhas):
            bpy.ops.object.join()
    ob = malhas[0]
    ob.name = ob.data.name = nome
    return ob


def coords(me):
    co = np.empty(len(me.vertices) * 3, np.float32)
    me.vertices.foreach_get("co", co)
    return co.reshape(-1, 3).astype(np.float64)


def gravar_coords(me, co):
    me.vertices.foreach_set("co", np.asarray(co, np.float32).ravel())
    me.update()


def normais(me):
    n = np.empty(len(me.vertices) * 3, np.float32)
    me.vertices.foreach_get("normal", n)
    return n.reshape(-1, 3).astype(np.float64)


def imagem_ligada(mat, teste):
    for n in mat.node_tree.nodes:
        if n.type == "TEX_IMAGE" and n.image and any(teste(l) for l in n.outputs["Color"].links):
            return n
    return None


def no_cor(mat):
    return imagem_ligada(mat, lambda l: l.to_socket.name == "Base Color")


def no_aspereza(mat):
    """Textura metal/aspereza do glTF: vai para um Separate Color (G = aspereza, B = metal)."""
    return imagem_ligada(mat, lambda l: l.to_node.type == "SEPARATE_COLOR")


def pixels(img):
    w, h = img.size
    a = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(a)
    return a.reshape(h, w, 4)


def amostra_por_vertice(ob, img):
    """Média da textura nos cantos (loops) de cada vértice, pelo UV ativo."""
    me = ob.data
    px = pixels(img)
    h, w = px.shape[:2]
    nl = len(me.loops)
    uv = np.empty(nl * 2, np.float32)
    me.uv_layers.active.data.foreach_get("uv", uv)
    uv = uv.reshape(-1, 2)
    lv = np.empty(nl, np.int64)
    me.loops.foreach_get("vertex_index", lv)
    ix = np.clip((uv[:, 0] % 1.0) * (w - 1), 0, w - 1).astype(np.int64)
    iy = np.clip((uv[:, 1] % 1.0) * (h - 1), 0, h - 1).astype(np.int64)
    soma = np.zeros((len(me.vertices), 4))
    np.add.at(soma, lv, px[iy, ix])
    cont = np.bincount(lv, minlength=len(me.vertices))
    return soma / np.maximum(cont, 1)[:, None]


def amostra_por_face(ob, img):
    """Textura no centro UV de cada face."""
    me = ob.data
    px = pixels(img)
    h, w = px.shape[:2]
    nf = len(me.polygons)
    uv = np.empty(len(me.loops) * 2, np.float32)
    me.uv_layers.active.data.foreach_get("uv", uv)
    uv = uv.reshape(-1, 2)
    ls = np.empty(nf, np.int64)
    lt = np.empty(nf, np.int64)
    me.polygons.foreach_get("loop_start", ls)
    me.polygons.foreach_get("loop_total", lt)
    uvf = np.add.reduceat(uv, ls) / lt[:, None]
    ix = np.clip((uvf[:, 0] % 1.0) * (w - 1), 0, w - 1).astype(np.int64)
    iy = np.clip((uvf[:, 1] % 1.0) * (h - 1), 0, h - 1).astype(np.int64)
    return px[iy, ix]


def dados_faces(me):
    nf = len(me.polygons)
    cen = np.empty(nf * 3, np.float32)
    me.polygons.foreach_get("center", cen)
    nor = np.empty(nf * 3, np.float32)
    me.polygons.foreach_get("normal", nor)
    area = np.empty(nf, np.float32)
    me.polygons.foreach_get("area", area)
    return cen.reshape(-1, 3).astype(np.float64), nor.reshape(-1, 3).astype(np.float64), area.astype(np.float64)


def separar_faces(ob, sel, nome):
    """Tira as faces marcadas em sel (bool por face) de ob e devolve um objeto novo com elas (mesmo material)."""
    import bmesh
    novo = ob.copy()
    novo.data = ob.data.copy()
    novo.name = novo.data.name = nome
    for c in ob.users_collection:
        c.objects.link(novo)
    for alvo, manter in ((ob, ~sel), (novo, sel)):
        bm = bmesh.new()
        bm.from_mesh(alvo.data)
        bm.faces.ensure_lookup_table()
        fora = [f for f, m in zip(bm.faces, manter) if not m]
        bmesh.ops.delete(bm, geom=fora, context="FACES")
        bm.to_mesh(alvo.data)
        bm.free()
        alvo.data.update()
    return novo


# ---------------------------------------------------------------- render
def preparar_render(cena, amostras=64):
    cena.render.engine = "CYCLES"
    cena.cycles.samples = amostras
    cena.cycles.use_denoising = True
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "OPTIX"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == "OPTIX"
    cena.cycles.device = "GPU"
    # Khronos PBR Neutral: mostra a cor da textura como ela é e segura os brilhos (lente, olho, metal)
    cena.view_settings.view_transform = "Khronos PBR Neutral"
    cena.view_settings.look = "None"
    cena.render.film_transparent = True
    cena.render.image_settings.file_format = "PNG"
    cena.render.image_settings.color_mode = "RGBA"


def luz_estudio(cena, hdri="interior.exr", forca_hdri=0.7):
    """HDRI de estúdio do próprio Blender (dá o que refletir na lente, no olho e no metal) + chave e recorte."""
    w = bpy.data.worlds.new("estudio")
    w.use_nodes = True
    nt = w.node_tree
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    pasta = Path(bpy.utils.system_resource("DATAFILES", path="studiolights/world"))
    env.image = bpy.data.images.load(str(pasta / hdri), check_existing=True)
    nt.links.new(env.outputs["Color"], nt.nodes["Background"].inputs["Color"])
    nt.nodes["Background"].inputs["Strength"].default_value = forca_hdri
    cena.world = w
    for nome, energia, tam, pos in (("chave", 120, 1.2, (1.4, -2.2, 2.2)), ("recorte", 90, 1.0, (-1.6, 1.8, 1.9)),
                                     ("preenche", 35, 2.0, (-2.4, -1.2, 0.9))):
        luz = bpy.data.objects.new(nome, bpy.data.lights.new(nome, "AREA"))
        luz.data.energy = energia
        luz.data.size = tam
        luz.location = pos
        luz.rotation_euler = (Vector((0, 0, 0.6)) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
        cena.collection.objects.link(luz)


def camera(cena):
    cam = bpy.data.objects.get("camera_vestir")
    if cam is None:
        cam = bpy.data.objects.new("camera_vestir", bpy.data.cameras.new("camera_vestir"))
        cena.collection.objects.link(cam)
    cena.camera = cam
    return cam


def foto(cena, caminho, pos, alvo, lente=85, res=(900, 900)):
    cam = camera(cena)
    cam.data.lens = lente
    cam.data.clip_start = 0.01
    cam.location = pos
    cam.rotation_euler = (Vector(alvo) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    cena.render.resolution_x, cena.render.resolution_y = res
    cena.render.filepath = str(caminho)
    bpy.ops.render.render(write_still=True)


def salvar_json(dados, caminho):
    json.dump(dados, open(caminho, "w", encoding="utf-8"), indent=1, ensure_ascii=False)


def girar_z(co, graus, centro=(0.0, 0.0)):
    a = math.radians(graus)
    c, s = math.cos(a), math.sin(a)
    x, y = co[:, 0] - centro[0], co[:, 1] - centro[1]
    out = co.copy()
    out[:, 0] = c * x - s * y + centro[0]
    out[:, 1] = s * x + c * y + centro[1]
    return out


def triangulos(me):
    """Índices dos triângulos da malha (usa a triangulação do próprio Blender)."""
    me.calc_loop_triangles()
    t = np.empty(len(me.loop_triangles) * 3, np.int64)
    me.loop_triangles.foreach_get("vertices", t)
    return t.reshape(-1, 3)


def secoes(co, tris, z):
    """Corte horizontal em z: devolve uma lista de laços (arrays Nx3 de pontos, sem ordem), um por contorno fechado.

    Cada ponto do corte fica numa aresta da malha; dois pontos do mesmo triângulo estão ligados. Os laços são as
    componentes ligadas dessas arestas.
    """
    zt = co[tris, 2] - z
    cruza = (zt.min(1) < 0) & (zt.max(1) >= 0)
    t = tris[cruza]
    zt = zt[cruza]
    pares = []
    for a, b in ((0, 1), (1, 2), (2, 0)):
        corta = (zt[:, a] < 0) != (zt[:, b] < 0)
        pares.append((corta, np.minimum(t[:, a], t[:, b]), np.maximum(t[:, a], t[:, b])))
    chaves = {}
    ligacoes = []
    for i in range(len(t)):
        ks = [(int(lo[i]), int(hi[i])) for corta, lo, hi in pares if corta[i]]
        if len(ks) == 2:
            ligacoes.append(ks)
            for k in ks:
                chaves.setdefault(k, len(chaves))
    pai = list(range(len(chaves)))

    def raiz(i):
        while pai[i] != i:
            pai[i] = pai[pai[i]]
            i = pai[i]
        return i

    for a, b in ligacoes:
        ra, rb = raiz(chaves[a]), raiz(chaves[b])
        if ra != rb:
            pai[ra] = rb
    grupos = {}
    for (i, j), idx in chaves.items():
        za, zb = co[i, 2] - z, co[j, 2] - z
        f = za / (za - zb) if za != zb else 0.5
        grupos.setdefault(raiz(idx), []).append(co[i] + (co[j] - co[i]) * f)
    return [np.array(g) for g in grupos.values()]


def casco_convexo(pts):
    """Fecho convexo em XY (cadeia monótona), em ordem anti-horária."""
    p = sorted(map(tuple, np.round(pts[:, :2], 6)))
    if len(p) < 3:
        return np.array(p)

    def cruz(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    baixo, cima = [], []
    for q in p:
        while len(baixo) >= 2 and cruz(baixo[-2], baixo[-1], q) <= 0:
            baixo.pop()
        baixo.append(q)
    for q in reversed(p):
        while len(cima) >= 2 and cruz(cima[-2], cima[-1], q) <= 0:
            cima.pop()
        cima.append(q)
    return np.array(baixo[:-1] + cima[:-1])


def perimetro_convexo(pts):
    """Perímetro do fecho convexo em XY (aproxima o contorno de uma seção sem precisar ordenar os pontos)."""
    p = sorted(map(tuple, np.round(pts[:, :2], 6)))
    if len(p) < 3:
        return 0.0

    def cruz(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    baixo, cima = [], []
    for q in p:
        while len(baixo) >= 2 and cruz(baixo[-2], baixo[-1], q) <= 0:
            baixo.pop()
        baixo.append(q)
    for q in reversed(p):
        while len(cima) >= 2 and cruz(cima[-2], cima[-1], q) <= 0:
            cima.pop()
        cima.append(q)
    casco = np.array(baixo[:-1] + cima[:-1])
    return float(np.linalg.norm(np.diff(np.vstack([casco, casco[:1]]), axis=0), axis=1).sum())


def perfil_radial(pts, centro, ang):
    """Raio por ângulo (em volta de centro, no plano XY) do fecho convexo de um laço de corte."""
    casco = casco_convexo(pts[:, :2])
    fech = np.vstack([casco, casco[:1]])
    dens = np.vstack([np.linspace(a, b, 20, endpoint=False) for a, b in zip(fech[:-1], fech[1:])])
    a_ = np.arctan2(dens[:, 1] - centro[1], dens[:, 0] - centro[0])
    r_ = np.hypot(dens[:, 0] - centro[0], dens[:, 1] - centro[1])
    o = np.argsort(a_)
    return np.interp(ang, a_[o], r_[o], period=2 * np.pi)
