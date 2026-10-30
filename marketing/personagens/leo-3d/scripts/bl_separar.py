"""Etapa 3 do Léo oficial (Meshy 7 Ultra): separa a peça única em objetos.

blender -b geracoes/leo-oficial-meshy7.blend --python bl_separar.py -- <saida_dir> <blend_saida>

Sai no .blend:
    LEO_corpo     pele e pelo (sem camisa, gravata, óculos e bigodes; garras com material próprio)
    LEO_camisa    a polo com o selo (casca aberta no pescoço, nas mangas e na barra)
    LEO_gravata   a gravata-borboleta
Óculos e bigodes da IA são apagados: voltam refeitos por script (bl_acessorios.py), limpos e simétricos.
Os furinhos onde eles encostavam na pele são fechados; as aberturas grandes (pescoço, braços, quadril) ficam,
escondidas pela camisa, até o tronco de baixo ser feito.
Classificação: cor da textura (HSV) + posição + espessura local, depois maioria entre vizinhas (2 passadas)
e, na camisa e na gravata, só a maior ilha conectada.
"""
import json
import math
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

saida, blend_saida = sys.argv[sys.argv.index("--") + 1:]
ob = bpy.data.objects["LEO_meshy7"]
me = ob.data
H = 0.98

# ---------------------------------------------------------------- solda (o glTF separa os vértices nas costuras de UV)
bm = bmesh.new()
bm.from_mesh(me)
antes = len(bm.verts)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=H * 2e-6)
bm.to_mesh(me)
bm.free()
print("solda:", antes, "->", len(me.vertices))
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
mx_, mn_ = rgb.max(1), rgb.min(1)
val = mx_
sat = np.where(mx_ > 1e-6, (mx_ - mn_) / np.maximum(mx_, 1e-6), 0)
r, g, b = rgb[:, 0], rgb[:, 1], rgb[:, 2]
d = np.maximum(mx_ - mn_, 1e-6)
hue = np.where(mx_ == r, ((g - b) / d) % 6, np.where(mx_ == g, (b - r) / d + 2, (r - g) / d + 4)) / 6.0

# ---------------------------------------------------------------- posição, normal e espessura
cen = np.empty(nf * 3, dtype=np.float32)
me.polygons.foreach_get("center", cen)
cen = cen.reshape(-1, 3)
nor = np.empty(nf * 3, dtype=np.float32)
me.polygons.foreach_get("normal", nor)
nor = nor.reshape(-1, 3)
zr = cen[:, 2] / H
bvh = BVHTree.FromObject(ob, bpy.context.evaluated_depsgraph_get())
esp = np.full(nf, 1.0, dtype=np.float32)
for i in np.nonzero(zr > 0.72)[0]:
    n = Vector(nor[i])
    hit = bvh.ray_cast(Vector(cen[i]) - n * 1e-5, -n, 0.05)
    if hit[0] is not None:
        esp[i] = hit[3]

# ---------------------------------------------------------------- regras
CORPO, CAMISA, GRAVATA, OCULOS, BIGODE, GARRA = range(6)
parte = np.zeros(nf, dtype=np.int32)
coral = ((hue < 0.058) | (hue > 0.97)) & (sat > 0.35) & (val > 0.55) & (zr > 0.30) & (zr < 0.80)
selo = (sat < 0.18) & (val > 0.75) & (zr > 0.45) & (zr < 0.75) & (cen[:, 1] < -0.02) & (np.abs(cen[:, 0]) < 0.12)
parte[coral | selo] = CAMISA
escuro = (val < 0.25) & (sat < 0.5)
parte[escuro & (zr > 0.66) & (zr < 0.80) & (np.abs(cen[:, 0]) < 0.08) & (cen[:, 1] < -0.02)] = GRAVATA
parte[(esp < 0.007) & (zr > 0.78) & (val < 0.6) & ~((sat < 0.3) & (val > 0.45))] = OCULOS
parte[(esp < 0.003) & (zr > 0.74) & (zr < 0.90) & (val > 0.45) & (sat < 0.30)] = BIGODE
garra = escuro & (((zr > 0.25) & (zr < 0.45) & (np.abs(cen[:, 0]) > 0.10)) | (zr < 0.04))
parte[garra & (parte == CORPO)] = GARRA

# ---------------------------------------------------------------- vizinhança por aresta (para a maioria e as ilhas)
le = np.empty(len(me.loops), dtype=np.int64)
me.loops.foreach_get("edge_index", le)
lf = np.repeat(np.arange(nf), lt)
ordem = np.argsort(le, kind="stable")
le_s, lf_s = le[ordem], lf[ordem]
pares = le_s[1:] == le_s[:-1]
fa, fb = lf_s[:-1][pares], lf_s[1:][pares]          # pares de faces que dividem uma aresta

def maioria(parte, classes, passadas):
    for _ in range(passadas):
        for c in classes:
            sim = (parte == c).astype(np.int32)
            viz_sim = np.bincount(fa, weights=sim[fb], minlength=nf) + np.bincount(fb, weights=sim[fa], minlength=nf)
            viz_tot = np.bincount(fa, minlength=nf) + np.bincount(fb, minlength=nf)
            # vira c quem tem 2/3 das vizinhas c; deixa de ser c quem tem menos de 1/3
            ganha = (sim == 0) & (viz_sim >= viz_tot * 0.67) & (parte != OCULOS) & (parte != BIGODE)
            perde = (sim == 1) & (viz_sim < viz_tot * 0.34)
            parte = parte.copy()
            parte[ganha] = c
            parte[perde] = CORPO
    return parte

parte = maioria(parte, (CAMISA, GRAVATA, OCULOS), 2)

# óculos: tudo o que é fino no plano da frente dos aros (altura dos olhos) e as hastes finas dos lados
# (a orelha é bem mais grossa: 5% mais fino dela fica em 6,3 mm; aro e haste ficam abaixo de 5,5 mm)
frente_aros = (esp < 0.007) & (zr > 0.845) & (cen[:, 1] < -0.15)
hastes = (esp < 0.0055) & (zr > 0.85) & (zr < 0.915) & (cen[:, 1] >= -0.15) & (np.abs(cen[:, 0]) > 0.06)
parte[(frente_aros | hastes) & (parte == CORPO)] = OCULOS
parte[(esp < 0.003) & (zr > 0.78) & (zr < 0.86) & (cen[:, 1] < -0.15) & (val > 0.55) & (sat < 0.2) & (parte == CORPO)] = BIGODE

def crescer(parte, c, candidato, limite=400):
    """Espalha a classe c pelas faces vizinhas candidatas (a barra e a gola na sombra são coral escuro)."""
    for _ in range(limite):
        eh = parte == c
        viz = np.zeros(nf, dtype=bool)
        viz[fa[eh[fb]]] = True
        viz[fb[eh[fa]]] = True
        novo = viz & candidato & (parte == CORPO)
        if not novo.any():
            break
        parte = parte.copy()
        parte[novo] = c
    return parte

coral_sombra = ((hue < 0.05) | (hue > 0.96)) & (sat > 0.33) & (val > 0.12) & (zr > 0.28) & (zr < 0.79)
parte = crescer(parte, CAMISA, coral_sombra)
# barra e gola: dobras na sombra, com o coral puxando para o marrom
faixas = ((zr > 0.28) & (zr < 0.40)) | ((zr > 0.66) & (zr < 0.80))
coral_dobra = faixas & ((hue < 0.065) | (hue > 0.95)) & (sat > 0.28) & (val > 0.08)
parte = crescer(parte, CAMISA, coral_dobra)
# cabeça: tudo o que é fino é resto de óculos ou de bigode (a orelha é mais grossa; perto dela, limiar menor)
zona_orelha = (np.abs(cen[:, 0]) > 0.075) & (cen[:, 1] > -0.06) & (zr > 0.84) & (zr < 0.96)
resto_fino = (zr > 0.80) & np.where(zona_orelha, esp < 0.0045, esp < 0.0055)
parte[resto_fino & (parte == CORPO)] = OCULOS
parte = crescer(parte, GRAVATA, (val < 0.33) & (zr > 0.64) & (zr < 0.82) & (np.abs(cen[:, 0]) < 0.1), 60)

def ilhas(parte, c):
    """Rótulo de ilha para cada face da classe c (union-find em numpy)."""
    idx = np.nonzero(parte == c)[0]
    pai = np.arange(nf)
    m = (parte[fa] == c) & (parte[fb] == c)
    a_, b_ = fa[m], fb[m]
    for _ in range(64):
        ra, rb = pai[a_], pai[b_]
        menor = np.minimum(ra, rb)
        np.minimum.at(pai, a_, menor)
        np.minimum.at(pai, b_, menor)
        pai = pai[pai]
        if np.all(pai[a_] == pai[b_]):
            break
    return idx, pai[idx]

for c, minimo in ((CAMISA, 0.5), (GRAVATA, 0.5)):
    idx, rot = ilhas(parte, c)
    if len(idx):
        rot_u, cont = np.unique(rot, return_counts=True)
        grandes = rot_u[cont >= cont.max() * minimo]
        fora = idx[~np.isin(rot, grandes)]
        parte[fora] = CORPO
nomes = ["corpo", "camisa", "gravata", "oculos", "bigode", "garra"]
cont = {nomes[i]: int((parte == i).sum()) for i in range(6)}
print("classes", cont)
at = me.attributes.get("parte") or me.attributes.new("parte", "INT", "FACE")
at.data.foreach_set("value", parte)

# ---------------------------------------------------------------- separa em objetos
def extrair(classe, nome):
    novo = ob.copy()
    novo.data = me.copy()
    novo.name = nome
    novo.data.name = nome
    bpy.context.scene.collection.objects.link(novo)
    bm_ = bmesh.new()
    bm_.from_mesh(novo.data)
    bm_.faces.ensure_lookup_table()
    pa = bm_.faces.layers.int.get("parte")
    bmesh.ops.delete(bm_, geom=[f for f in bm_.faces if f[pa] != classe], context="FACES")
    bm_.to_mesh(novo.data)
    bm_.free()
    return novo

camisa = extrair(CAMISA, "LEO_camisa")
gravata = extrair(GRAVATA, "LEO_gravata")

bm = bmesh.new()
bm.from_mesh(me)
bm.faces.ensure_lookup_table()
pa = bm.faces.layers.int.get("parte")
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f[pa] in (CAMISA, GRAVATA, OCULOS, BIGODE)], context="FACES")
# fecha só os furinhos (onde óculos e bigodes encostavam); as aberturas grandes ficam
bm.edges.ensure_lookup_table()
borda = [e for e in bm.edges if e.is_boundary]
visto, loops = set(), []
for e in borda:
    if e.index in visto:
        continue
    pilha, comp = [e], []
    visto.add(e.index)
    while pilha:
        x = pilha.pop()
        comp.append(x)
        for v in x.verts:
            for y in v.link_edges:
                if y.is_boundary and y.index not in visto:
                    visto.add(y.index)
                    pilha.append(y)
    loops.append(comp)
pequenos = [l for l in loops if sum(e.calc_length() for e in l) < H * 0.06]
for l in pequenos:
    bmesh.ops.holes_fill(bm, edges=l, sides=0)
print("bordas:", len(loops), "fechadas:", len(pequenos), "abertas:", [round(sum(e.calc_length() for e in l), 3) for l in loops if l not in pequenos])
bm.to_mesh(me)
bm.free()
ob.name = "LEO_corpo"
me.name = "LEO_corpo"

# garras: material próprio, escuro e brilhante (some o branco e o laranja das pontas)
mg = bpy.data.materials.new("LEO_garra")
mg.use_nodes = True
bg = mg.node_tree.nodes["Principled BSDF"]
bg.inputs["Base Color"].default_value = (0.018, 0.013, 0.011, 1)
bg.inputs["Roughness"].default_value = 0.32
bg.inputs["Coat Weight"].default_value = 0.4
me.materials.append(mg)
ig = len(me.materials) - 1
pa_ = me.attributes["parte"]
vals = np.empty(len(me.polygons), dtype=np.int32)
pa_.data.foreach_get("value", vals)
mi = np.zeros(len(me.polygons), dtype=np.int32)
mi[vals == GARRA] = ig
me.polygons.foreach_set("material_index", mi)
for o in (ob, camisa, gravata):
    for p in o.data.polygons:
        p.use_smooth = True
json.dump(cont, open(f"{saida}/separar.json", "w"), indent=1)
bpy.ops.wm.save_as_mainfile(filepath=blend_saida)
print("SEPARAR ok")
