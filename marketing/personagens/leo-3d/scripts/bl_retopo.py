"""Etapa 3, passo 1 e 5: malha de animação do corpo do Léo (quads uniformes) e bake da malha da IA para ela.

blender -b <montagem>/corpo_base.blend --python bl_retopo.py -- <params.json> <saida_dir> <faces|malha_quad.glb> <blend_saida>

Com um .glb no lugar de <faces>, usa essa malha quad pronta (o QuadriFlow do Blender 5.2 recusa
qualquer malha, até a do macaco de exemplo: remesh quad da Meshy pelo Higgsfield, 30/10/2026).

1. aplica a mesma forma de cabeça da montagem (params "cabeca_perfil"), sem furos de olho
2. remesh por voxel (fecha a malha, que o QuadriFlow exige) e QuadriFlow com o número de faces pedido
3. UV automática (Smart UV) e bake 4K de cor (difusa, sem luz) e normal da malha da IA para a nova
4. renders de prova (textura e wireframe) em <saida_dir>
A malha da IA fica no .blend como LEO_corpo_alta (fonte de novos bakes), escondida no render.
"""
import json
import math
import os
import sys
import time

import bmesh
import bpy
from mathutils import Vector

params_arq, saida, faces, blend_saida = sys.argv[sys.argv.index("--") + 1:]
P = json.load(open(params_arq, encoding="utf-8"))
quad_glb = faces if faces.lower().endswith(".glb") else None
faces = 0 if quad_glb else int(faces)
alta = bpy.data.objects["LEO_corpo"]
alta.name = "LEO_corpo_alta"
co = [v.co for v in alta.data.vertices]
H = max(v.z for v in co)
t0 = time.time()

# ---------------------------------------------------------------- cabeça como na montagem
perfil = sorted(P.get("cabeca_perfil", []))


def fator_cabeca(z):
    f = (H - z) / H
    if not perfil or f > perfil[-1][0]:
        return 1.0
    if f <= perfil[0][0]:
        return perfil[0][1]
    for (f0, s0), (f1, s1) in zip(perfil, perfil[1:]):
        if f0 <= f <= f1:
            return s0 + (s1 - s0) * (f - f0) / (f1 - f0)
    return 1.0


if perfil:
    cab = [v.co for v in alta.data.vertices if v.co.z > H * (1 - perfil[-1][0])]
    yc = (min(v.y for v in cab) + max(v.y for v in cab)) / 2
    for v in alta.data.vertices:
        k = fator_cabeca(v.co.z)
        if k != 1.0:
            v.co.x *= k
            v.co.y = yc + (v.co.y - yc) * (1 + (k - 1) * P["cabeca_prof"])
    alta.data.update()

# ---------------------------------------------------------------- malha nova
if quad_glb:
    antes = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=quad_glb)
    novos = [o for o in bpy.data.objects if o not in antes]
    nova = [o for o in novos if o.type == "MESH"][0]
    for o in novos:
        if o is not nova:
            bpy.data.objects.remove(o)
    nova.parent = None
    nova.name = "LEO_corpo"
    bpy.ops.object.select_all(action="DESELECT")
    nova.select_set(True)
    bpy.context.view_layer.objects.active = nova
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # a Meshy pode recentrar ou reescalar: volta para a caixa da malha da IA
    def caixa(vs):
        return (Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs))),
                Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs))))
    amn, amx = caixa([v.co for v in alta.data.vertices])
    nmn, nmx = caixa([v.co for v in nova.data.vertices])
    k = (amx.z - amn.z) / (nmx.z - nmn.z)
    for v in nova.data.vertices:
        v.co = (v.co - (nmn + nmx) / 2) * k + (amn + amx) / 2
    nova.data.update()
    nova.data.materials.clear()
    for uv in list(nova.data.uv_layers):
        nova.data.uv_layers.remove(uv)
    print("quad importada:", len(nova.data.polygons), "faces")
else:
    nova = alta.copy()
    nova.data = alta.data.copy()
    nova.name = "LEO_corpo"
    bpy.context.scene.collection.objects.link(nova)
    nova.data.materials.clear()
    bpy.ops.object.select_all(action="DESELECT")
    nova.select_set(True)
    bpy.context.view_layer.objects.active = nova
    r = nova.modifiers.new("voxel", "REMESH")
    r.mode = "VOXEL"
    r.voxel_size = H * 0.0022
    r.use_smooth_shade = True
    bpy.ops.object.modifier_apply(modifier="voxel")
    print("voxel:", len(nova.data.polygons), "faces", round(time.time() - t0), "s")
    # limpeza para o QuadriFlow: só a maior ilha, sem arestas não-manifold, buracos fechados, normais coerentes
    bm = bmesh.new()
    bm.from_mesh(nova.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=H * 1e-5)
    ilhas, visto = [], set()
    bm.faces.ensure_lookup_table()
    for f in bm.faces:
        if f.index in visto:
            continue
        pilha, ilha = [f], []
        visto.add(f.index)
        while pilha:
            g = pilha.pop()
            ilha.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h.index not in visto:
                        visto.add(h.index)
                        pilha.append(h)
        ilhas.append(ilha)
    maior = max(ilhas, key=len)
    bmesh.ops.delete(bm, geom=[f for il in ilhas if il is not maior for f in il], context="FACES")
    for _ in range(3):
        ruins = [v for v in bm.verts if not v.is_manifold]
        if not ruins:
            break
        bmesh.ops.delete(bm, geom=ruins, context="VERTS")
        bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary], sides=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(nova.data)
    bm.free()
    print("limpeza: ilhas", len(ilhas), "faces", len(nova.data.polygons))
    res = bpy.ops.object.quadriflow_remesh(target_faces=faces, use_mesh_symmetry=False, use_preserve_sharp=False,
                                           use_preserve_boundary=False, smooth_normals=True, seed=7)
    print("quadriflow:", res, len(nova.data.polygons), "faces", round(time.time() - t0), "s")
tris = sum(1 for p in nova.data.polygons if len(p.vertices) == 3)
ngons = sum(1 for p in nova.data.polygons if len(p.vertices) > 4)
for p in nova.data.polygons:
    p.use_smooth = True

# ---------------------------------------------------------------- UV
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.003)
bpy.ops.object.mode_set(mode="OBJECT")

# ---------------------------------------------------------------- bake
os.makedirs(P["texturas_dir"], exist_ok=True)
cena = bpy.context.scene
cena.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "OPTIX"
cena.cycles.device = "GPU"
cena.cycles.samples = 8
lado = P.get("bake_lado", 4096)
mat = bpy.data.materials.new("LEO_corpo_bake")
mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
imgs = {}
for nome, cor in (("cor", "sRGB"), ("normal", "Non-Color")):
    im = bpy.data.images.new(f"corpo_{nome}_{lado}", lado, lado, alpha=False)
    im.colorspace_settings.name = cor
    imgs[nome] = im
nova.data.materials.append(mat)
alvo = nt.nodes.new("ShaderNodeTexImage")
nt.nodes.active = alvo
bake = cena.render.bake
bake.use_selected_to_active = True
bake.cage_extrusion = H * 0.012
bake.max_ray_distance = H * 0.03
bake.margin = 8
bpy.ops.object.select_all(action="DESELECT")
alta.select_set(True)
nova.select_set(True)
bpy.context.view_layer.objects.active = nova
for nome in ("cor", "normal"):
    alvo.image = imgs[nome]
    if nome == "cor":
        bake.use_pass_direct = bake.use_pass_indirect = False
        bake.use_pass_color = True
        bpy.ops.object.bake(type="DIFFUSE")
    else:
        bpy.ops.object.bake(type="NORMAL", normal_space="TANGENT")
    caminho = f"{P['texturas_dir']}/corpo_{nome}_{lado}.png"
    imgs[nome].filepath_raw = caminho
    imgs[nome].file_format = "PNG"
    imgs[nome].save()
    print("bake", nome, round(time.time() - t0), "s")

# material final da malha nova: cor (com o mesmo ajuste de saturação da montagem) + normal
nt.nodes.remove(alvo)
tc = nt.nodes.new("ShaderNodeTexImage")
tc.image = imgs["cor"]
hsv = nt.nodes.new("ShaderNodeHueSaturation")
hsv.inputs["Saturation"].default_value = P["pelo_saturacao"]
hsv.inputs["Value"].default_value = P["pelo_valor"]
hsv.inputs["Hue"].default_value = P["pelo_matiz"]
nt.links.new(tc.outputs["Color"], hsv.inputs["Color"])
nt.links.new(hsv.outputs["Color"], bsdf.inputs["Base Color"])
tn = nt.nodes.new("ShaderNodeTexImage")
tn.image = imgs["normal"]
nm = nt.nodes.new("ShaderNodeNormalMap")
nt.links.new(tn.outputs["Color"], nm.inputs["Color"])
nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
bsdf.inputs["Roughness"].default_value = 0.75
alta.hide_render = True
alta.hide_set(True)

# ---------------------------------------------------------------- renders de prova
cena.cycles.samples = 48
cena.cycles.use_denoising = True
cena.render.film_transparent = True
cena.view_settings.view_transform = P.get("transformada", "Standard")
w = bpy.data.worlds.new("estudio")
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.8, 0.8, 0.8, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.6
cena.world = w
for nome, e, rot in (("chave", 4.0, (50, 0, 35)), ("recorte", 2.5, (60, 0, 200))):
    l = bpy.data.objects.new(nome, bpy.data.lights.new(nome, "SUN"))
    l.data.energy = e
    l.rotation_euler = [math.radians(a) for a in rot]
    cena.collection.objects.link(l)
cam = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
cena.collection.objects.link(cam)
cena.camera = cam
cam.data.lens = 85


def foto(nome, ang, z_alvo, dist, z_cam, rx, ry):
    a = math.radians(ang)
    cam.location = (dist * math.sin(a), -dist * math.cos(a), z_cam)
    cam.rotation_euler = (Vector((0, 0, z_alvo)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    cena.render.resolution_x, cena.render.resolution_y = rx, ry
    cena.render.filepath = f"{saida}/{nome}.png"
    bpy.ops.render.render(write_still=True)


foto("quad_frente", 0, H * 0.5, H * 3.4, H * 0.55, 768, 1024)
foto("quad_34", 45, H * 0.5, H * 3.4, H * 0.55, 768, 1024)
foto("quad_rosto", 20, H * 0.84, H * 1.0, H * 0.86, 1024, 1024)
# wireframe: cópia com modificador, cor lisa
fio = nova.copy()
fio.data = nova.data
cena.collection.objects.link(fio)
wm = fio.modifiers.new("fio", "WIREFRAME")
wm.thickness = H * 0.0007
wm.use_replace = True
mf = bpy.data.materials.new("fio")
mf.use_nodes = True
mf.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.02, 0.02, 0.02, 1)
fio.data = nova.data.copy()
fio.data.materials.clear()
fio.data.materials.append(mf)
mb = bpy.data.materials.new("base_cinza")
mb.use_nodes = True
mb.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.7, 0.7, 0.7, 1)
nova.data.materials.append(mb)
mat_idx = len(nova.data.materials) - 1
for p in nova.data.polygons:
    p.material_index = mat_idx
fio.location.y -= H * 0.0005
foto("quad_fio_frente", 0, H * 0.5, H * 3.4, H * 0.55, 768, 1024)
foto("quad_fio_rosto", 20, H * 0.84, H * 1.0, H * 0.86, 1024, 1024)
for p in nova.data.polygons:
    p.material_index = 0
nova.data.materials.pop(index=mat_idx)
bpy.data.objects.remove(fio)

json.dump({"faces": len(nova.data.polygons), "vertices": len(nova.data.vertices), "triangulos": tris,
           "ngons": ngons, "segundos": round(time.time() - t0)}, open(f"{saida}/retopo.json", "w"), indent=2)
bpy.ops.wm.save_as_mainfile(filepath=blend_saida)
print("LEO_RETOPO ok")
