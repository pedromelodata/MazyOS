"""Léo por peças, tudo do Meshy 7 Ultra (Pedro, 30/10/2026: "tudo do Meshy"), passo 1: o corpo.

blender -b --python bl_vestir_corpo.py -- vestir-params.json

- importa corpo_glb de frente para -Y, com 0,98 m, os pés em z = 0 e o tronco no centro;
- acha os olhos pela textura de aspereza do Meshy (o olho é a parte brilhante da cabeça), acerta a guinada para a
  linha dos olhos ficar paralela a X, e acha as orelhas (mancha escura dos lados da cabeça);
- verniz (coat) onde a aspereza é baixa: olho e nariz molhados refletem o estúdio; brilho de pelo (sheen) leve;
- LEO_corpo_colisao: cópia leve (decimada) do queixo para baixo, para o tecido colidir sem pesar.
Sai: geracoes/vestir/1-corpo.blend, geracoes/vestir/corpo.json e renders/vestir/1-corpo-*.png.
"""
import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vestir_comum import (DIR_RENDER, DIR_VESTIR, amostra_por_vertice, coords, foto, girar_z, gravar_coords,  # noqa: E402
                          importar, luz_estudio, no_aspereza, no_cor, normais, params, preparar_render, salvar_json)

P = params()
H = P["altura"]
bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene
leo = bpy.data.collections.new("Leo")
fisica = bpy.data.collections.new("Leo_fisica")
cena.collection.children.link(leo)
cena.collection.children.link(fisica)

corpo = importar(P["corpo_glb"], "LEO_corpo")
for c in corpo.users_collection:
    c.objects.unlink(corpo)
leo.objects.link(corpo)
me = corpo.data

# ---------------------------------------------------------------- altura, chão e centro do tronco
co = girar_z(coords(me), P["corpo_rot"])
co[:, 2] -= co[:, 2].min()
co *= H / co[:, 2].max()


def centrar(co):
    fat = co[(co[:, 2] > 0.45 * H) & (co[:, 2] < 0.55 * H)]
    co[:, 0] -= (fat[:, 0].min() + fat[:, 0].max()) / 2
    co[:, 1] -= (fat[:, 1].min() + fat[:, 1].max()) / 2
    return co


co = centrar(co)

# ---------------------------------------------------------------- cor e aspereza da textura por vértice
mat = corpo.material_slots[0].material
cor = amostra_por_vertice(corpo, no_cor(mat).image)[:, :3]
rug = amostra_por_vertice(corpo, no_aspereza(mat).image)[:, 1]
val = cor.max(1)


def achar_olhos(co):
    """Olho = vértices brilhantes (aspereza baixa) na cabeça, de cada lado; esfera ajustada por mínimos quadrados."""
    cab = co[:, 2] > P["cabeca_z"] * H
    sel = cab & (rug < P["olho_aspereza_max"]) & (np.abs(co[:, 0]) > 0.012)
    res = {}
    for nome, s in (("E", 1), ("D", -1)):  # E = esquerda do Léo = +X
        pts = co[sel & (np.sign(co[:, 0]) == s)]
        c = np.median(pts, 0)
        for _ in range(4):
            perto = pts[np.linalg.norm(pts - c, axis=1) < P["olho_raio_busca"]]
            c = perto.mean(0)
        A = np.c_[2 * perto, np.ones(len(perto))]
        sol = np.linalg.lstsq(A, (perto ** 2).sum(1), rcond=None)[0]
        centro = sol[:3]
        res[nome] = {"centro_esfera": centro, "raio_esfera": math.sqrt(max(sol[3] + centro @ centro, 0)),
                     "frente": perto[np.argmin(perto[:, 1])], "centro_brilho": c, "n": int(len(perto)),
                     "largura": float(np.ptp(perto[:, 0])), "altura": float(np.ptp(perto[:, 2]))}
    return res


olhos = achar_olhos(co)
# guinada: a linha entre os olhos fica paralela a X (gira em volta do centro do tronco)
d = olhos["E"]["centro_brilho"] - olhos["D"]["centro_brilho"]
guinada = -math.degrees(math.atan2(d[1], d[0]))
if abs(guinada) > 0.2:
    co = centrar(girar_z(co, guinada))
    olhos = achar_olhos(co)
gravar_coords(me, co)
print("OLHOS guinada %.2f" % guinada, {k: (v["centro_brilho"].round(4).tolist(), v["n"]) for k, v in olhos.items()})

# orelhas: mancha escura dos lados da cabeça, com a normal para fora
nr = normais(me)
cab = co[:, 2] > P["cabeca_z"] * H
orelhas = {}
atras_olho = max(olhos["E"]["centro_brilho"][1], olhos["D"]["centro_brilho"][1]) + P["orelha_atras_olho"]
for nome, s in (("E", 1), ("D", -1)):
    # atrás da mancha do olho (que também é escura) e com a normal para fora; depois só o aglomerado principal
    m = cab & (val < P["orelha_val_max"]) & (co[:, 0] * s > P["orelha_x_min"]) & (nr[:, 0] * s > 0.4) & (co[:, 1] > atras_olho)
    pts = co[m]
    c = np.median(pts, 0)
    for _ in range(6):
        perto = pts[np.linalg.norm(pts - c, axis=1) < P["orelha_raio_busca"]]
        c = perto.mean(0)
    orelhas[nome] = {"centro": c, "min": np.percentile(perto, 2, 0), "max": np.percentile(perto, 98, 0), "n": int(len(perto))}
print("ORELHAS", {k: (v["centro"].round(4).tolist(), v["n"]) for k, v in orelhas.items()})

# ---------------------------------------------------------------- material: olho e nariz molhados, pelo com brilho
nt = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
sep = next(n for n in nt.nodes if n.type == "SEPARATE_COLOR")
faixa = nt.nodes.new("ShaderNodeMapRange")
faixa.clamp = True
faixa.inputs["From Min"].default_value, faixa.inputs["From Max"].default_value = P["verniz_aspereza"]
faixa.inputs["To Min"].default_value, faixa.inputs["To Max"].default_value = 1.0, 0.0
nt.links.new(sep.outputs["Green"], faixa.inputs["Value"])
nt.links.new(faixa.outputs["Result"], bsdf.inputs["Coat Weight"])
bsdf.inputs["Coat Roughness"].default_value = 0.03
bsdf.inputs["Coat IOR"].default_value = 1.4
bsdf.inputs["Sheen Weight"].default_value = P["pelo_sheen"]
bsdf.inputs["Sheen Roughness"].default_value = 0.45
mat.name = "LEO_corpo"

# ---------------------------------------------------------------- colisão leve para o tecido
# o GLB vem com os vértices separados nas costuras do UV: solda antes de decimar, senão a cópia leve racha
me_sold = me.copy()
bm = bmesh.new()
bm.from_mesh(me_sold)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
bm.to_mesh(me_sold)
bm.free()
tmp = bpy.data.objects.new("tmp_colisao", me_sold)
cena.collection.objects.link(tmp)
dec = tmp.modifiers.new("decimar", "DECIMATE")
dec.ratio = P["colisao_faces"] / len(me_sold.polygons)
dg = bpy.context.evaluated_depsgraph_get()
me_col = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
bpy.data.objects.remove(tmp)
bpy.data.meshes.remove(me_sold)
bm = bmesh.new()
bm.from_mesh(me_col)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().z > P["colisao_topo"] * H], context="FACES")
bm.to_mesh(me_col)
bm.free()
me_col.materials.clear()
for uv in list(me_col.uv_layers):
    me_col.uv_layers.remove(uv)
me_col.name = "LEO_corpo_colisao"
colisao = bpy.data.objects.new("LEO_corpo_colisao", me_col)
fisica.objects.link(colisao)
colisao.hide_render = True
colisao.display_type = "WIRE"
print("COLISAO faces", len(me_col.polygons))

me.shade_smooth()

# ---------------------------------------------------------------- medidas para os próximos passos
lista = lambda v: [round(float(x), 5) for x in v]  # noqa: E731
salvar_json({
    "altura": H, "guinada_graus": round(guinada, 3),
    "olhos": {k: {"centro_esfera": lista(v["centro_esfera"]), "raio_esfera": round(v["raio_esfera"], 5),
                  "frente": lista(v["frente"]), "centro_brilho": lista(v["centro_brilho"]), "n": v["n"],
                  "largura": round(v["largura"], 5), "altura": round(v["altura"], 5)} for k, v in olhos.items()},
    "orelhas": {k: {"centro": lista(v["centro"]), "min": lista(v["min"]), "max": lista(v["max"]), "n": v["n"]}
                for k, v in orelhas.items()},
    "topo_cabeca": round(float(co[:, 2].max()), 5),
}, DIR_VESTIR / "corpo.json")

bpy.ops.wm.save_as_mainfile(filepath=str(DIR_VESTIR / "1-corpo.blend"), compress=True)

# ---------------------------------------------------------------- fotos de conferência (marcas só nas fotos)
preparar_render(cena, P["amostras"])
luz_estudio(cena)
colisao.hide_viewport = True
foto(cena, DIR_RENDER / "1-corpo-frente.png", (0, -3.4, 0.52), (0, 0, 0.49), 60, (700, 1000))
foto(cena, DIR_RENDER / "1-corpo-lado.png", (3.4, 0, 0.52), (0, 0, 0.49), 60, (700, 1000))
foto(cena, DIR_RENDER / "1-corpo-rosto.png", (0.0, -0.8, 0.88), (0, 0, 0.865), 85, (900, 900))
foto(cena, DIR_RENDER / "1-corpo-maos.png", (0.25, -0.95, 0.5), (0, -0.05, 0.42), 85, (900, 900))
foto(cena, DIR_RENDER / "1-corpo-pes.png", (0.3, -1.0, 0.18), (0, -0.03, 0.05), 85, (900, 900))
marca = bpy.data.materials.new("marca")
marca.use_nodes = True
em = marca.node_tree.nodes.new("ShaderNodeEmission")
em.inputs["Color"].default_value = (0.1, 1.0, 0.2, 1)
marca.node_tree.links.new(em.outputs[0], marca.node_tree.nodes["Material Output"].inputs["Surface"])
for p in [olhos[k]["frente"] for k in olhos] + [orelhas[k]["centro"] for k in orelhas]:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.003, location=tuple(p))
    bpy.context.object.data.materials.append(marca)
foto(cena, DIR_RENDER / "1-corpo-marcas-frente.png", (0.0, -0.8, 0.88), (0, 0, 0.865), 85, (900, 900))
foto(cena, DIR_RENDER / "1-corpo-marcas-lado.png", (0.8, -0.1, 0.88), (0, -0.05, 0.865), 85, (900, 900))
print("VESTIR_CORPO ok")
