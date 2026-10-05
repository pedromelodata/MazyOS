"""Prepara os modelos 3D detalhados pra argila (pedido do Pedro em 05/10/2026: "assets 3D melhores e mais detalhados").

Cada modelo sai como GLB único, em metros, Y pra cima e frente pra +Z, sem textura nenhuma (a cena pinta de argila
pelo material), com as partes que animam em nós próprios, nomes em português e pivô de cada parte onde ela gira.
Os materiais já vêm em tons frios de argila (família frio do carrossel de 05/10) e com nome por parte, pra a cena
trocar cor e rugosidade por nome (catálogo + cena, "*" vale pra todos).

Uso (em segundo plano, sem salvar .blend):
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" --background --factory-startup \
        --python detalhados.py -- <modelo> <entrada.glb> <saida.glb> [--extras <extras.json>]

Modelos: despertador, ampulheta, telefone, pastas, carimbo, senha. O --extras é o asset.extras do GLB (título, autor,
licença, fonte, página e mudanças). Imprime "DET_PARTE {json}" de cada nó e "DET_RESUMO {json}" no fim (triângulos,
caixa em coordenadas do glTF, pivôs). Saída gravada pelo KIT/lib/escrita.py (via _comum.exporta_glb), com 400 MB
livres conferidos antes.
"""
import json
import math
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bmesh  # noqa: E402
import bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

import _comum as C  # noqa: E402

# tons de argila fria (KIT/catalogos/marca.json e a ESPEC do carrossel de 05/10, família frio)
FRIO50, FRIO100, FRIO200, FRIO300 = "#F1F3F5", "#E6E9ED", "#D5D9DE", "#C9CED5"
FRIO400, FRIO500, FRIO700, FRIO_TEXTO = "#AEB4BB", "#8D939B", "#5D636B", "#4B5159"


# ---------------------------------------------------------------- utilidades
def gl(v):
    """ponto do Blender (Z pra cima) em coordenadas do glTF (Y pra cima, frente +Z)"""
    return (v[0], v[2], -v[1])


def bl(x, y, z):
    """ponto do glTF no Blender"""
    return Vector((x, -z, y))


def importa(caminho):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(caminho))


def nome_util(ob):
    """nome que diz o que a malha é (no Sketchfab o nome bom fica no vazio pai: 'leg_1_GEO' > 'defaultMaterial.002')"""
    n = ob.name
    p = ob.parent
    while p is not None and (n.startswith("defaultMaterial") or n.startswith("Object_") or n.endswith("_0")):
        n = p.name
        p = p.parent
    return n


def assa():
    """aplica a transformação de mundo em cada malha (dados próprios), tira os pais e apaga os vazios"""
    nomes = {ob.name: nome_util(ob) for ob in bpy.data.objects if ob.type == "MESH"}
    for ob in bpy.data.objects:
        if ob.type == "MESH" and ob.data.users > 1:
            ob.data = ob.data.copy()
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    for ob in list(bpy.data.objects):
        if ob.type != "MESH":
            bpy.data.objects.remove(ob, do_unlink=True)
    malhas = [o for o in bpy.data.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="SELECT")
    bpy.context.view_layer.objects.active = malhas[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return {o.name: nomes.get(o.name, o.name) for o in malhas}


def seleciona(obs, ativo=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = ativo or obs[0]


def junta(obs, nome):
    obs = [o for o in obs if o is not None]
    if not obs:
        raise SystemExit("nada pra juntar em %s" % nome)
    if len(obs) > 1:
        seleciona(obs, obs[0])
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active if len(obs) > 1 else obs[0]
    ob.name = nome
    ob.data.name = nome
    return ob


def separa(ob, tipo):
    """separa por 'LOOSE' ou 'MATERIAL'; devolve os objetos (o original incluso)"""
    seleciona([ob])
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type=tipo)
    bpy.ops.object.mode_set(mode="OBJECT")
    return list(bpy.context.selected_objects)


def atualiza():
    """o matrix_world só vale depois do update do view layer (sem isso, location e rotação novas se perdem)"""
    bpy.context.view_layer.update()


def caixa(obs):
    atualiza()
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for o in obs:
        for v in o.data.vertices:
            p = o.matrix_world @ v.co
            lo = Vector(map(min, lo, p))
            hi = Vector(map(max, hi, p))
    return lo, hi


def centro_gl(ob):
    lo, hi = caixa([ob])
    return gl((lo + hi) / 2), [hi[0] - lo[0], hi[2] - lo[2], hi[1] - lo[1]]


def tris(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def origem(ob, p):
    """põe a origem do objeto no ponto p (Blender, mundo), sem mexer na malha no mundo"""
    atualiza()
    mw = ob.matrix_world.copy()
    local = mw.inverted() @ p
    ob.data.transform(Matrix.Translation(-local))
    ob.matrix_world = mw @ Matrix.Translation(local)


def material(nome, hexa, rug=0.82, metal=0.0, alfa=1.0, dupla=False):
    m = bpy.data.materials.get(nome)
    if m is not None:
        return m
    m = C.material(nome, hexa, rugosidade=rug, metalico=metal)
    m.use_backface_culling = not dupla
    if alfa < 1.0:
        bsdf = m.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Alpha"].default_value = alfa
        for atributo, valor in (("surface_render_method", "BLENDED"), ("blend_method", "BLEND")):
            try:
                setattr(m, atributo, valor)
            except (AttributeError, TypeError):
                pass
    return m


def pinta(ob, mat):
    ob.data.materials.clear()
    ob.data.materials.append(mat)
    for p in ob.data.polygons:
        p.material_index = 0


def sem_uv(ob):
    while ob.data.uv_layers:
        ob.data.uv_layers.remove(ob.data.uv_layers[0])


def limpa_orfaos():
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.textures):
        for it in list(col):
            if it.users == 0:
                col.remove(it)
    for im in list(bpy.data.images):
        bpy.data.images.remove(im)


def escala_e_move(obs, fator, desloca):
    """escala tudo em volta da origem do mundo e move (Blender); malhas sem pai"""
    m = Matrix.Translation(desloca) @ Matrix.Scale(fator, 4)
    atualiza()
    for o in obs:
        o.matrix_world = m @ o.matrix_world
    seleciona(obs)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


def decima(ob, razao):
    mod = ob.modifiers.new("decima", "DECIMATE")
    mod.ratio = razao
    seleciona([ob])
    bpy.ops.object.modifier_apply(modifier=mod.name)


def bisel(ob, largura, segmentos=2, angulo=40):
    mod = ob.modifiers.new("bisel", "BEVEL")
    mod.width = largura
    mod.segments = segmentos
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(angulo)
    mod.harden_normals = False
    seleciona([ob])
    bpy.ops.object.modifier_apply(modifier=mod.name)


def suaviza(ob, angulo=35):
    seleciona([ob])
    try:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    except Exception:  # noqa: BLE001
        pass
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(angulo))
    except (AttributeError, RuntimeError, TypeError):
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angulo))
    for mod in list(ob.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)


def vazio(nome, pai=None, local=(0.0, 0.0, 0.0)):
    return C.vazio(nome, pai, local)


def pendura(filho, pai):
    atualiza()
    mw = filho.matrix_world.copy()
    filho.parent = pai
    filho.matrix_world = mw


def relata(raiz):
    out = []
    for o in [raiz] + list(raiz.children_recursive):
        item = {"no": o.name, "tipo": o.type, "pai": o.parent.name if o.parent else None,
                "origemGl": [round(x, 5) for x in gl(o.matrix_world.translation)]}
        if o.type == "MESH":
            c, t = centro_gl(o)
            item.update({"tri": tris(o), "centroGl": [round(x, 5) for x in c], "tamGl": [round(x, 5) for x in t],
                         "materiais": [s.material.name for s in o.material_slots if s.material]})
        print("DET_PARTE " + json.dumps(item, ensure_ascii=False))
        out.append(item)
    return out


# ---------------------------------------------------------------- despertador (Poly Haven alarm_clock_01, CC0)
def ponteiro_para_cima(ob, centro_b, alvo_graus, nome):
    """gira a malha do ponteiro em volta do eixo do mostrador (Y do Blender) até a ponta apontar pro 12, põe a
    origem no centro do mostrador e deixa o nó girado pro horário pedido (graus, sentido horário a partir do 12).
    No glTF/three.js: rotation.z = 0 aponta pro 12; sentido horário = rotation.z negativo."""
    atualiza()
    mw = ob.matrix_world.copy()
    pts = [mw @ v.co for v in ob.data.vertices]
    ponta = max(pts, key=lambda p: (p.x - centro_b.x) ** 2 + (p.z - centro_b.z) ** 2)
    phi = math.atan2(ponta.x - centro_b.x, ponta.z - centro_b.z)  # horário a partir do 12, visto de frente
    comp = math.hypot(ponta.x - centro_b.x, ponta.z - centro_b.z)
    ob.data.transform(mw)
    ob.matrix_world = Matrix.Identity(4)
    ob.data.transform(Matrix.Translation(-centro_b))
    ob.data.transform(Matrix.Rotation(-phi, 4, "Y"))  # rotação +Y do Blender = sentido horário visto de frente
    ob.location = centro_b
    ob.rotation_mode = "XYZ"
    ob.rotation_euler = (0.0, math.radians(alvo_graus), 0.0)
    ob.name = nome
    ob.data.name = nome
    return comp, math.degrees(phi)


def marcas_do_mostrador(centro_b, z_frente_b, r_fora, nome):
    """12 marcas de hora em relevo (as de 12, 3, 6 e 9 maiores), 0,3 mm acima do mostrador"""
    bm = bmesh.new()
    for k in range(12):
        grande = k % 3 == 0
        comp = 0.0085 if grande else 0.0055
        larg = 0.0026 if grande else 0.0016
        alt = 0.0003
        ang = math.radians(30 * k)
        r_meio = r_fora - comp / 2
        cx = centro_b.x + r_meio * math.sin(ang)
        cz = centro_b.z + r_meio * math.cos(ang)
        rot = Matrix.Rotation(ang, 4, "Y")
        caixa_m = bmesh.ops.create_cube(bm, size=1.0)
        vs = caixa_m["verts"]
        bmesh.ops.scale(bm, vec=Vector((larg, alt, comp)), verts=vs)
        bmesh.ops.transform(bm, matrix=rot, verts=vs)
        bmesh.ops.translate(bm, vec=Vector((cx, z_frente_b - alt / 2, cz)), verts=vs)
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nome, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def uv_plano(ob, centro_b, raio):
    """UV de 0 a 1 projetada de frente (u da esquerda pra direita, v = 1 em cima), pra um pintor de mostrador"""
    me = ob.data
    uv = me.uv_layers.new(name="UVMap")
    for loop in me.loops:
        p = ob.matrix_world @ me.vertices[loop.vertex_index].co
        uv.data[loop.index].uv = (0.5 + (p.x - centro_b.x) / (2 * raio), 0.5 + (p.z - centro_b.z) / (2 * raio))


def despertador(a):
    assa()
    corpo = bpy.data.objects["alarm_clock_01"]
    ponteiros = {"houd_hand": None, "minute_hand": None, "second_hand": None}
    for n in ponteiros:
        ponteiros[n] = bpy.data.objects[n]
    vidro, resto = None, []
    for o in separa(corpo, "MATERIAL"):
        mats = [s.material.name for s in o.material_slots if s.material]
        usados = {o.material_slots[p.material_index].material.name for p in o.data.polygons}
        if usados == {"alarm_clock_01_Glass"}:
            vidro = o
        else:
            resto.append(o)
        del mats
    partes = []
    for o in resto:
        partes += separa(o, "LOOSE")
    grupos = {k: [] for k in ("Corpo", "Aro", "Mostrador", "Eixo", "SinoEsquerdo", "SinoDireito", "Martelo", "Alca", "Pes")}
    for o in partes:
        (x, y, z), t = centro_gl(o)
        if t[2] < 0.0006 and t[0] > 0.1 and abs(z - 0.024) < 0.003:
            g = "Mostrador"
        elif math.hypot(x, y - 0.0646) < 0.004 and z > 0.02 and max(t) < 0.012:
            g = "Eixo"
        elif y > 0.148:
            g = "Alca"
        elif y > 0.115 and abs(x) <= 0.012:
            g = "Martelo"
        elif y > 0.115:
            g = "SinoEsquerdo" if x < 0 else "SinoDireito"
        elif y < 0.015:
            g = "Pes"
        elif z > 0.025 and max(t[0], t[1]) > 0.05:
            g = "Aro"
        else:
            g = "Corpo"
        grupos[g].append(o)
    obs = {}
    for g, lista in grupos.items():
        if not lista:
            raise SystemExit("despertador: grupo vazio %s" % g)
        obs[g] = junta(lista, g)
    obs["Vidro"] = junta([vidro], "Vidro")
    # mostrador: centro e frente
    lo, hi = caixa([obs["Mostrador"]])
    centro_b = (lo + hi) / 2
    z_frente_b = lo.y  # frente do glTF (+Z) é -Y no Blender: a face do mostrador fica no menor y
    raio = max(hi.x - lo.x, hi.z - lo.z) / 2
    # ponteiros pro 12, pivô no centro, 10:10:36 por padrão
    comp = {}
    for orig, nome, graus in (("houd_hand", "PonteiroHoras", 305.0), ("minute_hand", "PonteiroMinutos", 60.0),
                              ("second_hand", "PonteiroSegundos", 216.0)):
        comp[nome] = ponteiro_para_cima(ponteiros[orig], centro_b, graus, nome)
    # empilha os ponteiros de frente pro mostrador como num relógio de verdade: marcas (0,3 mm), horas, minutos e
    # segundos por cima (no original o dos segundos ficava rente ao mostrador e as marcas furariam ele)
    atualiza()
    z_mostrador = -z_frente_b  # frente do mostrador no glTF
    proximo = z_mostrador + 0.0004
    for nome in ("PonteiroHoras", "PonteiroMinutos", "PonteiroSegundos"):
        p = bpy.data.objects[nome]
        zs = [-(p.matrix_world @ v.co).y for v in p.data.vertices]
        dz = proximo - min(zs)
        p.data.transform(Matrix.Translation(Vector((0.0, -dz, 0.0))))
        proximo = max(zs) + dz + 0.0002
        atualiza()
    # frente dos ponteiros: as marcas ficam atrás deles
    atualiza()
    frente_ponteiros = min(min((p.matrix_world @ v.co).y for v in p.data.vertices) for p in
                           (bpy.data.objects[n] for n in ("PonteiroHoras", "PonteiroMinutos", "PonteiroSegundos")))
    r_fora = min(raio * 0.86, comp["PonteiroMinutos"][0] * 1.02)
    obs["Marcas"] = marcas_do_mostrador(centro_b, z_frente_b, r_fora, "Marcas")
    uv_plano(obs["Mostrador"], centro_b, raio)
    # materiais (tons frios; a cena troca por nome)
    mats = {
        "Corpo": material("Corpo", FRIO300), "Aro": material("Aro", FRIO200, rug=0.6),
        "Mostrador": material("Mostrador", FRIO50, dupla=True), "Marcas": material("Marcas", FRIO700),
        "Eixo": material("Eixo", FRIO700), "Ponteiros": material("Ponteiros", FRIO_TEXTO, dupla=True),
        "PonteiroSegundos": material("PonteiroSegundos", FRIO500, dupla=True),
        "Sinos": material("Sinos", FRIO200, rug=0.6), "Martelo": material("Martelo", FRIO400),
        "Alca": material("Alca", FRIO400, rug=0.6), "Pes": material("Pes", FRIO400),
        "Vidro": material("Vidro", "#FFFFFF", rug=0.05, alfa=0.12, dupla=True),
    }
    for g in ("Corpo", "Aro", "Mostrador", "Marcas", "Eixo", "Martelo", "Alca", "Pes", "Vidro"):
        pinta(obs[g], mats[g])
    pinta(obs["SinoEsquerdo"], mats["Sinos"])
    pinta(obs["SinoDireito"], mats["Sinos"])
    pinta(bpy.data.objects["PonteiroHoras"], mats["Ponteiros"])
    pinta(bpy.data.objects["PonteiroMinutos"], mats["Ponteiros"])
    pinta(bpy.data.objects["PonteiroSegundos"], mats["PonteiroSegundos"])
    for o in bpy.data.objects:
        if o.type == "MESH" and o.name != "Mostrador":
            sem_uv(o)
    # pivôs das partes que animam: sinos no centro de cada sino, martelo no pé (entre os sinos), alça no meio
    for g in ("SinoEsquerdo", "SinoDireito", "Alca"):
        lo2, hi2 = caixa([obs[g]])
        origem(obs[g], (lo2 + hi2) / 2)
    lo2, hi2 = caixa([obs["Martelo"]])
    origem(obs["Martelo"], Vector(((lo2.x + hi2.x) / 2, (lo2.y + hi2.y) / 2, lo2.z)))
    # base no zero do glTF (pés em y = 0), centro em x e z
    malhas = [o for o in bpy.data.objects if o.type == "MESH"]
    lo, hi = caixa(malhas)
    desloca = Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))
    atualiza()
    for o in malhas:
        o.matrix_world = Matrix.Translation(desloca) @ o.matrix_world
    fixos = [o for o in malhas if o.name in ("Corpo", "Aro", "Mostrador", "Eixo", "Marcas", "Pes", "Vidro")]
    seleciona(fixos)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    raiz = vazio("Despertador")
    for o in malhas:
        pendura(o, raiz)
    centro_novo = centro_b + desloca
    return raiz, {"mostradorCentroGl": [round(v, 5) for v in gl(centro_novo)], "mostradorRaio": round(raio, 5),
                  "frentePonteirosGl": round(-(frente_ponteiros + desloca.y), 5),
                  "ponteiros": {k: {"comprimento": round(v[0], 5), "anguloOriginal": round(v[1] % 360, 2)}
                                for k, v in comp.items()},
                  "horaPadrao": "10:10:36", "marcasRaioFora": round(r_fora, 5)}


# ---------------------------------------------------------------- ampulheta (Sketchfab, Kodie Russell, CC BY 4.0)
def ampulheta(a, altura=0.18):
    nomes = assa()
    por = {}
    for o in list(bpy.data.objects):
        por.setdefault(nomes.get(o.name, o.name), []).append(o)

    def pega(*chaves):
        out = []
        for k, v in por.items():
            if any(k.startswith(c) for c in chaves):
                out += v
        if not out:
            raise SystemExit("ampulheta: não achei %s (há: %s)" % (chaves, sorted(por)))
        return out

    obs = {
        "Base": junta(pega("wood_base"), "Base"), "Topo": junta(pega("hour_glass:wood_top"), "Topo"),
        "Colunas": junta(pega("leg_1", "leg_2", "leg_3"), "Colunas"),
        "Rolhas": junta(pega("top_cork", "bottom_cork"), "Rolhas"), "Vidro": junta(pega("glass_GEO"), "Vidro"),
        "AreiaCima": junta(pega("top_sand"), "AreiaCima"), "AreiaBaixo": junta(pega("bottom_sand"), "AreiaBaixo"),
        "FioAreia": junta(pega("sand_trail"), "FioAreia"),
    }
    malhas = list(obs.values())
    lo, hi = caixa(malhas)
    fator = altura / (hi.z - lo.z)
    escala_e_move(malhas, fator, Vector((0, 0, 0)))
    lo, hi = caixa(malhas)
    desloca = Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))
    atualiza()
    for o in malhas:
        o.matrix_world = Matrix.Translation(desloca) @ o.matrix_world
    seleciona(malhas)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    mats = {"Madeira": material("Madeira", FRIO300), "Rolha": material("Rolha", FRIO400),
            "Vidro": material("Vidro", "#FFFFFF", rug=0.05, alfa=0.15, dupla=True), "Areia": material("Areia", FRIO500)}
    for g in ("Base", "Topo", "Colunas"):
        pinta(obs[g], mats["Madeira"])
    pinta(obs["Rolhas"], mats["Rolha"])
    pinta(obs["Vidro"], mats["Vidro"])
    for g in ("AreiaCima", "AreiaBaixo", "FioAreia"):
        pinta(obs[g], mats["Areia"])
    for o in malhas:
        sem_uv(o)
    # pivôs: areia de cima e de baixo no pé (escala em y esvazia em direção ao gargalo e enche de baixo pra cima);
    # fio de areia no topo (escala em y encurta pra cima)
    for g, onde in (("AreiaCima", "pe"), ("AreiaBaixo", "pe"), ("FioAreia", "topo")):
        l2, h2 = caixa([obs[g]])
        origem(obs[g], Vector(((l2.x + h2.x) / 2, (l2.y + h2.y) / 2, l2.z if onde == "pe" else h2.z)))
    raiz = vazio("Ampulheta")
    for o in malhas:
        pendura(o, raiz)
    return raiz, {"fatorEscala": round(fator, 6), "altura": altura}


# ---------------------------------------------------------------- telefone (Sketchfab, pan.stasian, CC BY 4.0)
def normal_do_plano(ob):
    import numpy as np
    pts = np.array([list(ob.matrix_world @ v.co) for v in ob.data.vertices])
    c = pts.mean(axis=0)
    _, _, vt = np.linalg.svd(pts - c, full_matrices=False)
    n = Vector(vt[2].tolist()).normalized()
    if n.y > 0:  # a face do disco olha pra frente (-Y no Blender)
        n = -n
    return n


def telefone(a, comprimento_fone=0.21, razao_fio=0.16):
    nomes = assa()
    por = {}
    for o in list(bpy.data.objects):
        por.setdefault(nomes.get(o.name, o.name), []).append(o)
    print("DET_NOMES", sorted((k, [o.name for o in v]) for k, v in por.items()))

    def pega(chave, mat=None):
        out = []
        for k, v in por.items():
            if chave in k:
                for o in v:
                    usados = {o.material_slots[p.material_index].material.name for p in o.data.polygons}
                    if mat is None or mat in usados:
                        out.append(o)
        if not out:
            raise SystemExit("telefone: não achei %s/%s (há: %s)" % (chave, mat, sorted(por)))
        return out

    obs = {
        "Corpo": junta(pega("holder", "pink"), "Corpo"),
        "Metal": junta(pega("holder", "gold"), "Metal"),
        "Mostrador": junta(pega("holder", "white_plastic") + pega("holder", "Dial"), "Mostrador"),
        "Pes": junta(pega("legs"), "Pes"),
        "Disco": junta(pega("disc"), "Disco"),
        "Fone": junta(pega("telephone"), "Fone"),
        "Fio": junta(pega("wire"), "Fio"),
    }
    tri_fio_antes = tris(obs["Fio"])
    decima(obs["Fio"], razao_fio)
    malhas = list(obs.values())
    lo, hi = caixa([obs["Fone"]])
    fator = comprimento_fone / (hi.x - lo.x)
    escala_e_move(malhas, fator, Vector((0, 0, 0)))
    # origem do arquivo: centro da caixa do corpo com o fone (sem o fio), pra pivo "origem"
    lo, hi = caixa([obs[k] for k in ("Corpo", "Metal", "Mostrador", "Pes", "Disco", "Fone")])
    desloca = -(lo + hi) / 2
    atualiza()
    for o in malhas:
        o.matrix_world = Matrix.Translation(desloca) @ o.matrix_world
    seleciona(malhas)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    pe_y_gl = (lo.z + desloca.z)
    mats = {"Corpo": material("Corpo", FRIO300), "Metal": material("Metal", FRIO200, rug=0.5),
            "Mostrador": material("Mostrador", FRIO50), "Pes": material("Pes", FRIO500),
            "Disco": material("Disco", FRIO200, rug=0.5), "Fone": material("Fone", FRIO300),
            "Fio": material("Fio", FRIO400)}
    for g, o in obs.items():
        pinta(o, mats[g])
        sem_uv(o)
    # disco: pivô no centro, eixo de giro = normal do disco. Fica sob o vazio DiscoEixo (inclinado); o Disco tem
    # rotação zero dentro dele, então rotation.z do Disco gira em volta do eixo do disco
    n = normal_do_plano(obs["Disco"])
    l2, h2 = caixa([obs["Disco"]])
    c = (l2 + h2) / 2
    q = Vector((0.0, -1.0, 0.0)).rotation_difference(n)
    eixo = vazio("DiscoEixo")
    eixo.location = c
    eixo.rotation_mode = "QUATERNION"
    eixo.rotation_quaternion = q
    bpy.context.view_layer.update()
    m_eixo = eixo.matrix_world.copy()
    obs["Disco"].data.transform(m_eixo.inverted())
    obs["Disco"].parent = eixo
    obs["Disco"].matrix_parent_inverse = Matrix.Identity(4)
    obs["Disco"].matrix_basis = Matrix.Identity(4)
    inclinacao = math.degrees(Vector((0.0, -1.0, 0.0)).angle(n))
    # fone: pivô no centro da caixa dele
    l3, h3 = caixa([obs["Fone"]])
    origem(obs["Fone"], (l3 + h3) / 2)
    raiz = vazio("Telefone")
    for o in [obs[k] for k in ("Corpo", "Metal", "Mostrador", "Pes", "Fone", "Fio")] + [eixo]:
        pendura(o, raiz)
    return raiz, {"fatorEscala": round(fator, 6), "disco": {"centroGl": [round(v, 5) for v in gl(c)],
                  "normalGl": [round(v, 5) for v in gl(n)], "inclinacaoGraus": round(inclinacao, 2)},
                  "foneCentroGl": [round(v, 5) for v in gl((l3 + h3) / 2)], "peYGl": round(pe_y_gl, 5),
                  "fioTriangulos": {"antes": tri_fio_antes, "depois": tris(obs["Fio"])}}


# ---------------------------------------------------------------- pastas AZ (Sketchfab, janexx, CC BY 4.0)
def pastas(a, altura=0.32):
    nomes = assa()
    grupos = {}
    for o in list(bpy.data.objects):
        n = nomes.get(o.name, o.name)
        chave = n.split("folder_LP_")[-1].split("_")[0] if "folder_LP_" in n else n
        grupos.setdefault(chave, []).append(o)
    obs = [junta(v, "tmp_" + k) for k, v in grupos.items()]
    lo, hi = caixa(obs)
    alturas = []
    for o in obs:
        l2, h2 = caixa([o])
        alturas.append(h2.z - l2.z)
    fator = altura / max(alturas)
    escala_e_move(obs, fator, Vector((0, 0, 0)))
    lo, hi = caixa(obs)
    desloca = Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))
    atualiza()
    for o in obs:
        o.matrix_world = Matrix.Translation(desloca) @ o.matrix_world
    seleciona(obs)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    obs.sort(key=lambda o: caixa([o])[0].x)
    mat = material("Pasta", FRIO300)
    finais = []
    for i, o in enumerate(obs, 1):
        o.name = "Pasta%d" % i
        o.data.name = o.name
        pinta(o, mat)
        sem_uv(o)
        seleciona([o])
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
        bisel(o, 0.0015, 2, 40)
        suaviza(o, 35)
        l2, h2 = caixa([o])
        origem(o, Vector(((l2.x + h2.x) / 2, (l2.y + h2.y) / 2, l2.z)))
        finais.append(o)
    raiz = vazio("PastasAZ")
    for o in finais:
        pendura(o, raiz)
    return raiz, {"fatorEscala": round(fator, 6), "altura": altura}


# ---------------------------------------------------------------- carimbo e senha (Higgsfield, tripo_3d, próprios)
def malha_unica(a, raiz_nome, parte_nome, mat_nome, cor, medida, eixo_medida, gira_y=0.0):
    assa()
    ob = junta([o for o in bpy.data.objects if o.type == "MESH"], parte_nome)
    if gira_y:
        ob.matrix_world = Matrix.Rotation(math.radians(gira_y), 4, "Z") @ ob.matrix_world
        seleciona([ob])
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    lo, hi = caixa([ob])
    k = {"x": 0, "y": 2, "z": 1}[eixo_medida]  # eixo do glTF no Blender
    fator = medida / (hi[k] - lo[k])
    escala_e_move([ob], fator, Vector((0, 0, 0)))
    lo, hi = caixa([ob])
    desloca = Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))
    atualiza()
    ob.matrix_world = Matrix.Translation(desloca) @ ob.matrix_world
    seleciona([ob])
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    pinta(ob, material(mat_nome, cor))
    sem_uv(ob)
    raiz = vazio(raiz_nome)
    pendura(ob, raiz)
    return raiz, {"fatorEscala": round(fator, 6)}


def carimbo(a):
    return malha_unica(a, "Carimbo", "Corpo", "Corpo", FRIO300, 0.085, "y", gira_y=90.0)


def senha(a):
    return malha_unica(a, "DispensadorSenha", "Corpo", "Corpo", FRIO300, 0.30, "y")


MODELOS = {"despertador": despertador, "ampulheta": ampulheta, "telefone": telefone, "pastas": pastas,
           "carimbo": carimbo, "senha": senha}


def principal():
    a = C.argumentos(["modelo", "entrada", "saida"], {"extras": None})
    if a["modelo"] not in MODELOS:
        raise SystemExit("modelo desconhecido: %s (há: %s)" % (a["modelo"], ", ".join(MODELOS)))
    importa(a["entrada"])
    raiz, info = MODELOS[a["modelo"]](a)
    limpa_orfaos()
    bpy.context.view_layer.update()
    partes = relata(raiz)
    malhas = [o for o in raiz.children_recursive if o.type == "MESH"]
    lo, hi = caixa(malhas)
    resumo = {"modelo": a["modelo"], "triangulos": sum(tris(o) for o in malhas),
              "caixaGl": {"min": [round(v, 5) for v in (lo.x, lo.z, -hi.y)], "max": [round(v, 5) for v in (hi.x, hi.z, -lo.y)],
                          "tamanho": [round(v, 5) for v in (hi.x - lo.x, hi.z - lo.z, hi.y - lo.y)]},
              "info": info, "nos": len(partes)}
    print("DET_RESUMO " + json.dumps(resumo, ensure_ascii=False))
    extras = {}
    if a["extras"]:
        with open(a["extras"], encoding="utf-8") as f:
            extras = json.load(f)
    C.exporta_glb(a["saida"], extras, aplica_modificadores=True, cores_vertice="NONE", animacoes=False)


principal()
