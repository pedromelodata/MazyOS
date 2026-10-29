"""Teste de olhos e óculos novos sobre um GLB gerado (os geradores fundem lente e olho numa mancha preta).

Uso:
    python olhos_teste.py geracoes/<arquivo>.glb [--rotacao -90]

Passos:
    1. Blender: importa, gira a frente para -Y, renderiza a cabeça de frente em câmera ortográfica.
    2. Python: acha as duas lentes (manchas escuras redondas) nesse render e converte para o mundo.
    3. Blender: abre o buraco da lente na malha, põe globo ocular (íris castanha, pupila, córnea)
       e lente de vidro nova; renderiza close e corpo; salva o .blend.

Sai em renders/olhos/<nome do GLB>/ (mapa.png, lentes.json, rosto_antes.png, rosto_depois.png,
frente_depois.png, perfil_depois.png) e o .blend em geracoes/<nome>-olhos.blend.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ambiente import BLENDER, GERACOES, RAIZ, RENDERS  # noqa: E402

LADO = 1024  # pixels do render ortográfico da cabeça

COMUM = r"""
import bpy, json, math, sys
from mathutils import Vector

def preparar(arq, rotacao):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=arq)
    ob = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
    for o in list(bpy.context.scene.objects):
        if o is not ob and o.type != "MESH":
            bpy.data.objects.remove(o)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    ob.rotation_mode = "XYZ"
    ob.rotation_euler.z += math.radians(rotacao)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    vs = [ob.matrix_world @ v.co for v in ob.data.vertices]
    mn = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
    mx = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
    ob.location = (-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z)
    bpy.ops.object.transform_apply(location=True)
    return ob, mx.z - mn.z

def cena(lado_x, lado_y, amostras):
    c = bpy.context.scene
    r = c.render
    r.engine = "CYCLES"
    c.cycles.samples = amostras
    c.cycles.use_denoising = True
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "OPTIX"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == "OPTIX"
    c.cycles.device = "GPU"
    r.resolution_x, r.resolution_y = lado_x, lado_y
    r.film_transparent = True
    c.view_settings.view_transform = "AgX"
    w = bpy.data.worlds.new("estudio")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.8, 0.8, 0.8, 1)
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.6
    c.world = w
    for nome, e, rot in (("chave", 4.0, (50, 0, 35)), ("recorte", 2.5, (60, 0, 200))):
        l = bpy.data.objects.new(nome, bpy.data.lights.new(nome, "SUN"))
        l.data.energy = e
        l.rotation_euler = [math.radians(a) for a in rot]
        c.collection.objects.link(l)
    cam = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
    c.collection.objects.link(cam)
    c.camera = cam
    return cam

def foto(cam, caminho, pos, alvo, lente=None, orto=None):
    cam.location = pos
    d = Vector(alvo) - Vector(pos)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    if orto:
        cam.data.type = "ORTHO"
        cam.data.ortho_scale = orto
    else:
        cam.data.type = "PERSP"
        cam.data.lens = lente
    bpy.context.scene.render.filepath = caminho
    bpy.ops.render.render(write_still=True)
"""

PASSO_A = COMUM + r"""
arq, saida, rotacao, lado = sys.argv[sys.argv.index("--") + 1:]
ob, altura = preparar(arq, float(rotacao))
cam = cena(int(lado), int(lado), 32)
# Cabeça: os 22% de cima da altura; centro em x = 0
vs = [v.co for v in ob.data.vertices if v.co.z > altura * 0.78]
zc = (min(v.z for v in vs) + max(v.z for v in vs)) / 2
larg = max(max(abs(v.x) for v in vs) * 2, max(v.z for v in vs) - min(v.z for v in vs)) * 1.1
frente_y = min(v.y for v in vs)
foto(cam, f"{saida}/mapa.png", (0, frente_y - 1.0, zc), (0, 0, zc), orto=larg)
foto(cam, f"{saida}/rosto_antes.png", (0, -altura * 1.15, altura * 0.88), (0, 0, altura * 0.86), lente=85)
json.dump({"zc": zc, "larg": larg, "altura": altura, "frente_y": frente_y}, open(f"{saida}/camera.json", "w"))
print("LEO_OLHOS_A ok")
"""

PASSO_C = COMUM + r"""
import bmesh
arq, saida, rotacao, blend = sys.argv[sys.argv.index("--") + 1:]
lentes = json.load(open(f"{saida}/lentes.json"))
ob, altura = preparar(arq, float(rotacao))
cam = cena(1024, 1024, 96)

dg = bpy.context.evaluated_depsgraph_get()
bm = bmesh.new()
bm.from_mesh(ob.data)
bm.faces.ensure_lookup_table()
apagar = set()
olhos = []
for L in lentes["lentes"]:
    x, z, r = L["x"], L["z"], L["r"]
    ok, hit, nrm, idx, _, _ = bpy.context.scene.ray_cast(dg, Vector((x, -5, z)), Vector((0, 1, 0)))
    y0 = hit.y if ok else lentes["frente_y"]
    # Buraco: tudo dentro do círculo da lente até uma profundidade de 0,9 r atrás da lente
    for f in bm.faces:
        c = f.calc_center_median()
        if (c.x - x) ** 2 + (c.z - z) ** 2 < (r * 0.86) ** 2 and c.y < y0 + r * 0.9:
            apagar.add(f)
    olhos.append((x, y0, z, r))
bmesh.ops.delete(bm, geom=list(apagar), context="FACES")
bm.to_mesh(ob.data)
bm.free()
print("faces apagadas", len(apagar))

def material_olho():
    m = bpy.data.materials.new("LEO_olho")
    m.use_nodes = True
    nt = m.node_tree
    n = nt.nodes
    bsdf = n["Principled BSDF"]
    coord = n.new("ShaderNodeTexCoord")
    sep = n.new("ShaderNodeSeparateXYZ")
    nt.links.new(coord.outputs["Object"], sep.inputs[0])
    # distância ao eixo -Y do olho (no espaço do objeto, raio 1): 0 no centro da pupila
    comb = n.new("ShaderNodeCombineXYZ")
    nt.links.new(sep.outputs["X"], comb.inputs["X"])
    nt.links.new(sep.outputs["Z"], comb.inputs["Z"])
    dist = n.new("ShaderNodeVectorMath")
    dist.operation = "LENGTH"
    nt.links.new(comb.outputs[0], dist.inputs[0])
    rampa = n.new("ShaderNodeValToRGB")
    e = rampa.color_ramp.elements
    e[0].position, e[0].color = 0.0, (0.008, 0.005, 0.004, 1)      # pupila
    e[1].position, e[1].color = 1.0, (0.010, 0.006, 0.005, 1)      # borda escura
    for pos, cor in ((0.30, (0.012, 0.007, 0.005, 1)), (0.34, (0.16, 0.075, 0.03, 1)),
                     (0.62, (0.30, 0.15, 0.06, 1)), (0.80, (0.10, 0.045, 0.02, 1)),
                     (0.86, (0.02, 0.012, 0.01, 1))):
        el = e.new(pos)
        el.color = cor
    nt.links.new(dist.outputs["Value"], rampa.inputs[0])
    nt.links.new(rampa.outputs[0], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.05
    bsdf.inputs["Coat Weight"].default_value = 1.0
    bsdf.inputs["Coat Roughness"].default_value = 0.02
    return m

def material_vidro():
    m = bpy.data.materials.new("LEO_lente")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (1, 1, 1, 1)
    b.inputs["Transmission Weight"].default_value = 1.0
    b.inputs["Roughness"].default_value = 0.0
    b.inputs["IOR"].default_value = 1.5
    return m

mo, mv = material_olho(), material_vidro()
for i, (x, y0, z, r) in enumerate(olhos):
    re = r * 0.80
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1, location=(x, y0 + re * 0.55, z))
    olho = bpy.context.object
    olho.name = f"LEO_olho_{'E' if x > 0 else 'D'}"
    olho.scale = (re, re, re)
    olho.rotation_euler = (math.radians(90), 0, 0)  # eixo local Z aponta para -Y (frente)
    bpy.ops.object.shade_smooth()
    olho.data.materials.append(mo)
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=r * 0.98, depth=r * 0.04, location=(x, y0 - r * 0.06, z))
    lente = bpy.context.object
    lente.name = f"LEO_lente_{'E' if x > 0 else 'D'}"
    lente.rotation_euler = (math.radians(90), 0, 0)
    lente.data.materials.append(mv)
    bpy.ops.object.shade_smooth()

foto(cam, f"{saida}/rosto_depois.png", (0, -altura * 1.15, altura * 0.88), (0, 0, altura * 0.86), lente=85)
foto(cam, f"{saida}/tres_quartos_depois.png", (altura * 0.8, -altura * 0.8, altura * 0.9), (0, 0, altura * 0.86), lente=85)
c = bpy.context.scene
c.render.resolution_x, c.render.resolution_y = 768, 1024
foto(cam, f"{saida}/frente_depois.png", (0, -altura * 3.4, altura * 0.55), (0, 0, altura * 0.5), lente=85)
bpy.ops.wm.save_as_mainfile(filepath=blend)
print("LEO_OLHOS_C ok")
"""


def blender(script, *args, log):
    r = subprocess.run([str(BLENDER), "-b", "--python-expr", script, "--", *map(str, args)],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    log.write_text(r.stdout + r.stderr, encoding="utf-8")
    return r.stdout


def achar_lentes(mapa, cam):
    """As lentes são as duas manchas escuras grandes da metade de cima do rosto, uma de cada lado."""
    from scipy import ndimage

    im = np.asarray(Image.open(mapa).convert("RGBA"), dtype=np.float32)
    luz = im[..., :3].mean(-1)
    escuro = (luz < 60) & (im[..., 3] > 200)
    escuro = ndimage.binary_opening(escuro, iterations=2)
    rot, n = ndimage.label(escuro)
    h, w = luz.shape
    cand = []
    for i in range(1, n + 1):
        ys, xs = np.nonzero(rot == i)
        if len(xs) < 200 or ys.mean() > h * 0.75:
            continue
        cand.append((len(xs), xs.mean(), ys.mean(), np.sqrt(len(xs) / np.pi)))
    esq = [c for c in cand if c[1] > w / 2]
    dir_ = [c for c in cand if c[1] <= w / 2]
    if not esq or not dir_:
        sys.exit(f"não achei as duas lentes ({len(cand)} manchas); ver {mapa}")
    px = cam["larg"] / w
    lentes = []
    for c in (max(esq), max(dir_)):
        _, cx, cy, rpx = c
        lentes.append({"x": (cx - w / 2) * px, "z": cam["zc"] + (h / 2 - cy) * px, "r": rpx * px * 1.05})
    return lentes


def main():
    p = argparse.ArgumentParser()
    p.add_argument("glb")
    p.add_argument("--rotacao", type=float, default=0)
    a = p.parse_args()
    glb = Path(a.glb)
    glb = glb if glb.is_absolute() else RAIZ / glb
    saida = RENDERS / "olhos" / glb.stem
    saida.mkdir(parents=True, exist_ok=True)
    if "LEO_OLHOS_A ok" not in blender(PASSO_A, glb, saida, a.rotacao, LADO, log=saida / "blender_a.log"):
        sys.exit(f"passo A falhou; ver {saida / 'blender_a.log'}")
    cam = json.loads((saida / "camera.json").read_text())
    lentes = achar_lentes(saida / "mapa.png", cam)
    (saida / "lentes.json").write_text(json.dumps({"lentes": lentes, "frente_y": cam["frente_y"]}, indent=2))
    print("lentes", lentes)
    blend = GERACOES / f"{glb.stem}-olhos.blend"
    if "LEO_OLHOS_C ok" not in blender(PASSO_C, glb, saida, a.rotacao, blend, log=saida / "blender_c.log"):
        sys.exit(f"passo C falhou; ver {saida / 'blender_c.log'}")
    print("pronto:", saida)


if __name__ == "__main__":
    main()
