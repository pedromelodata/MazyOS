"""Etapa 3 do Léo oficial (Meshy 7 Ultra, peça única): classifica cada face e mostra o resultado em cores.

blender -b geracoes/leo-oficial-meshy7.blend --python bl_classificar.py -- <saida_dir>

Classes (gravadas no atributo de face "parte", inteiro):
    0 corpo   1 camisa   2 gravata   3 óculos   4 bigode   5 garra
Critérios:
    - cor da textura no centro UV de cada face (HSV), posição (altura relativa, lado, frente)
    - espessura local (raio pela normal invertida até a outra face): óculos e bigodes são fios finos
Saídas: classes.png (render em cores falsas: frente, lado, 3/4, close da cabeça) e classes.json (contagens).
"""
import json
import math
import sys

import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

saida = sys.argv[sys.argv.index("--") + 1]
ob = bpy.data.objects["LEO_meshy7"]
me = ob.data
H = 0.98
nf = len(me.polygons)

# ---------------------------------------------------------------- cor da textura por face
mat = ob.material_slots[0].material
tex = next(n for n in mat.node_tree.nodes if n.type == "TEX_IMAGE" and n.image and any(l.to_socket.name == "Base Color" for l in n.outputs["Color"].links))
img = tex.image
w, h = img.size
px = np.empty(w * h * 4, dtype=np.float32)
img.pixels.foreach_get(px)
px = px.reshape(h, w, 4)[..., :3]
uvl = me.uv_layers.active.data
uv = np.empty(len(uvl) * 2, dtype=np.float32)
uvl.foreach_get("uv", uv)
uv = uv.reshape(-1, 2)
ls = np.empty(nf, dtype=np.int64)
lt = np.empty(nf, dtype=np.int64)
me.polygons.foreach_get("loop_start", ls)
me.polygons.foreach_get("loop_total", lt)
uvf = np.add.reduceat(uv, ls) / lt[:, None]
ix = np.clip((uvf[:, 0] % 1.0) * (w - 1), 0, w - 1).astype(np.int64)
iy = np.clip((uvf[:, 1] % 1.0) * (h - 1), 0, h - 1).astype(np.int64)
rgb = px[iy, ix]
mx_ = rgb.max(1)
mn_ = rgb.min(1)
val = mx_
sat = np.where(mx_ > 1e-6, (mx_ - mn_) / np.maximum(mx_, 1e-6), 0)
r, g, b = rgb[:, 0], rgb[:, 1], rgb[:, 2]
hue = np.zeros(nf)
d = np.maximum(mx_ - mn_, 1e-6)
m_r = (mx_ == r)
m_g = (mx_ == g) & ~m_r
m_b = ~m_r & ~m_g
hue[m_r] = ((g - b)[m_r] / d[m_r]) % 6
hue[m_g] = ((b - r)[m_g] / d[m_g]) + 2
hue[m_b] = ((r - g)[m_b] / d[m_b]) + 4
hue = hue / 6.0

# ---------------------------------------------------------------- posição e espessura
cen = np.empty(nf * 3, dtype=np.float32)
me.polygons.foreach_get("center", cen)
cen = cen.reshape(-1, 3)
nor = np.empty(nf * 3, dtype=np.float32)
me.polygons.foreach_get("normal", nor)
nor = nor.reshape(-1, 3)
zr = cen[:, 2] / H

# espessura só onde interessa (cabeça e mãos); o resto fica "grosso"
bvh = BVHTree.FromObject(ob, bpy.context.evaluated_depsgraph_get())
esp = np.full(nf, 1.0, dtype=np.float32)
alvo = np.nonzero((zr > 0.70) | ((zr > 0.28) & (zr < 0.55) & (np.abs(cen[:, 0]) > 0.09)))[0]
for i in alvo:
    c = Vector(cen[i])
    n = Vector(nor[i])
    hit = bvh.ray_cast(c - n * 1e-5, -n, 0.05)
    if hit[0] is not None:
        esp[i] = hit[3]
print("espessura medida em", len(alvo), "faces")

# ---------------------------------------------------------------- regras
parte = np.zeros(nf, dtype=np.int32)
coral = (hue < 0.075) & (sat > 0.30) & (val > 0.45) & (zr > 0.30) & (zr < 0.80)
branco = (sat < 0.18) & (val > 0.75) & (zr > 0.45) & (zr < 0.75) & (cen[:, 1] < -0.02)
parte[coral] = 1
parte[branco & (np.abs(cen[:, 0]) < 0.12)] = 1           # o selo, no peito
escuro = (val < 0.22) & (sat < 0.45)
gravata = escuro & (zr > 0.66) & (zr < 0.80) & (np.abs(cen[:, 0]) < 0.08) & (cen[:, 1] < -0.02)
parte[gravata] = 2
fino = esp < 0.004
oculos = fino & (zr > 0.78) & (val < 0.35)
parte[oculos] = 3
bigode = (esp < 0.003) & (zr > 0.74) & (zr < 0.90) & (val > 0.45) & (sat < 0.30)
parte[bigode] = 4
garra = escuro & (((zr > 0.25) & (zr < 0.45) & (np.abs(cen[:, 0]) > 0.10)) | (zr < 0.04))
parte[garra & (parte == 0)] = 5

at = me.attributes.get("parte") or me.attributes.new("parte", "INT", "FACE")
at.data.foreach_set("value", parte)
nomes = ["corpo", "camisa", "gravata", "oculos", "bigode", "garra"]
cont = {nomes[i]: int((parte == i).sum()) for i in range(6)}
print("classes", cont)
json.dump(cont, open(f"{saida}/classes.json", "w"), indent=1)

# ---------------------------------------------------------------- render em cores falsas (cor por canto de face)
cores = np.array([(0.55, 0.45, 0.35, 1), (0.95, 0.35, 0.2, 1), (0.1, 0.3, 0.95, 1), (0.95, 0.9, 0.05, 1),
                  (0.1, 0.95, 0.2, 1), (0.9, 0.05, 0.6, 1)], dtype=np.float32)
ca = me.color_attributes.new("classes_cor", "BYTE_COLOR", "CORNER")
loop_face = np.repeat(np.arange(nf), lt)
ca.data.foreach_set("color", cores[parte[loop_face]].ravel())
me.color_attributes.active_color = ca
c = bpy.context.scene
c.render.engine = "BLENDER_WORKBENCH"
c.display.shading.light = "STUDIO"
c.display.shading.color_type = "VERTEX"
c.render.film_transparent = False
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
c.collection.objects.link(cam)
c.camera = cam
fotos = []
for nome, pos, alvo_, lente, rx, ry in (("c_frente", (0, -3.2, 0.5), (0, 0, 0.49), 60, 600, 900),
                                         ("c_lado", (3.2, 0, 0.5), (0, 0, 0.49), 60, 600, 900),
                                         ("c_cabeca", (0.55, -0.85, 0.86), (0, -0.03, 0.84), 85, 900, 900),
                                         ("c_mao", (0.6, -0.9, 0.35), (0.17, -0.02, 0.36), 85, 900, 900)):
    cam.data.lens = lente
    cam.location = pos
    cam.rotation_euler = (Vector(alvo_) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    c.render.resolution_x, c.render.resolution_y = rx, ry
    c.render.filepath = f"{saida}/{nome}.png"
    bpy.ops.render.render(write_still=True)
print("CLASSIFICAR ok")
