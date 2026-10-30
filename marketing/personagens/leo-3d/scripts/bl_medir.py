"""Roda dentro do Blender: importa o corpo, põe de frente para -Y no chão e mede o que a montagem precisa.

blender -b --python bl_medir.py -- <glb> <saida> <rotacao>
Sai em <saida>: medidas_corpo.json, cabeca_frente.png e cabeca_lado.png (ortográficas, com escala no json)
e corpo_base.blend (corpo já girado e apoiado, ponto de partida da montagem).
"""
import json
import math
import sys

import bpy
from mathutils import Vector

glb, saida, rotacao = sys.argv[sys.argv.index("--") + 1:]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
ob = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
for o in list(bpy.context.scene.objects):
    if o is not ob:
        bpy.data.objects.remove(o)
ob.name = "LEO_corpo"
ob.parent = None
bpy.context.view_layer.objects.active = ob
ob.select_set(True)
ob.rotation_mode = "XYZ"
ob.rotation_euler.z += math.radians(float(rotacao))
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
co = [v.co.copy() for v in ob.data.vertices]
mn = Vector((min(v.x for v in co), min(v.y for v in co), min(v.z for v in co)))
mx = Vector((max(v.x for v in co), max(v.y for v in co), max(v.z for v in co)))
ob.data.transform(__import__("mathutils").Matrix.Translation((-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z)))
ob.data.update()
co = [v.co.copy() for v in ob.data.vertices]
H = max(v.z for v in co)

# Perfil por fatias de altura: largura em x, frente (y mínimo) e trás
fatias = []
n = 120
for i in range(n):
    z0, z1 = H * i / n, H * (i + 1) / n
    vs = [v for v in co if z0 <= v.z < z1]
    if not vs:
        continue
    xs = sorted(v.x for v in vs)
    fatias.append({"z": (z0 + z1) / 2, "xmin": xs[0], "xmax": xs[-1],
                   "ymin": min(v.y for v in vs), "ymax": max(v.y for v in vs),
                   "xs": [round(x, 4) for x in xs[:: max(1, len(xs) // 400)]]})

# Renders ortográficos da cabeça (30% de cima)
c = bpy.context.scene
c.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE"
c.render.resolution_x = c.render.resolution_y = 1024
c.render.film_transparent = True
c.view_settings.view_transform = "Standard"
w = bpy.data.worlds.new("w")
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[1].default_value = 1.0
c.world = w
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
c.collection.objects.link(cam)
c.camera = cam
cam.data.type = "ORTHO"
cab = [v for v in co if v.z > H * 0.70]
zc = (min(v.z for v in cab) + H) / 2
esc = (H - min(v.z for v in cab)) * 1.15
cam.data.ortho_scale = esc
cam.location = (0, -5, zc)
cam.rotation_euler = (math.radians(90), 0, 0)
c.render.filepath = f"{saida}/cabeca_frente.png"
bpy.ops.render.render(write_still=True)
cam.location = (5, 0, zc)
cam.rotation_euler = (math.radians(90), 0, math.radians(90))
c.render.filepath = f"{saida}/cabeca_lado.png"
bpy.ops.render.render(write_still=True)

json.dump({"altura": H, "zc": zc, "escala_orto": esc, "lado_px": 1024, "fatias": fatias},
          open(f"{saida}/medidas_corpo.json", "w"))
bpy.data.objects.remove(cam)
bpy.ops.wm.save_as_mainfile(filepath=f"{saida}/corpo_base.blend")
print("LEO_MEDIR ok", H)
