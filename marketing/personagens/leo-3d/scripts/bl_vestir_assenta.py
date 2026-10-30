"""Léo por peças, tudo do Meshy 7 Ultra, passo 4: o pelo coberto pela camisa some (repouso limpo).

blender -b geracoes/vestir/3-camisa.blend --python bl_vestir_assenta.py -- vestir-params.json

A camisa fica exatamente como saiu do encaixe (gola, botões, selo e gravata limpos). O pelo do corpo que fica por
baixo dela, ou que fura o tecido, entra no grupo "sob_camisa" e um modificador Mask esconde (nada se deforma: empurrar
cada vértice do pelo pela própria normal rasga os tufos). A máscara é dinâmica, em Geometry Nodes (vestir_comum.
mascara_dinamica): a cada quadro ela refaz os raios contra a camisa já deformada, então quando a camisa sobe a
barriga aparece sozinha. Este passo grava no corpo a normal lisa ("normal_lisa") e o que tem que aparecer mesmo
coberto ("mantem"). Para cada vértice do corpo, um raio vindo de fora, na
normal lisa do corpo (a da cópia leve LEO_corpo_colisao no ponto mais perto), testa:
    - coberto: o raio entra no tecido antes de chegar ao vértice;
    - furando: o vértice está fora, mas a face de fora da camisa está logo abaixo dele (até pelo_fura_max).
Acima da borda de cima da gola nada some (o pelo do pescoço cai por cima dela). O pelo coberto só some se nenhum
raio dele escapa da camisa (perto da barra, dos punhos e da gola ele aparece pela
abertura, então fica, e a barra não mostra um vazio por baixo). Na cena em que a camisa sobe e a barriga aparece, é só desligar o Mask.
Sai: geracoes/vestir/4-vestido.blend, geracoes/vestir/assenta.json e renders/vestir/4-vestido-*.png.
"""
import json
import sys
import time
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vestir_comum import (DIR_RENDER, DIR_VESTIR, coords, foto, luz_estudio, mascara_dinamica, normais,  # noqa: E402
                          params, preparar_render)

P = params()
cena = bpy.context.scene
corpo = bpy.data.objects["LEO_corpo"]
cam = bpy.data.objects["LEO_camisa"]
colisao = bpy.data.objects["LEO_corpo_colisao"]
t0 = time.time()
dg = bpy.context.evaluated_depsgraph_get()
bvh = BVHTree.FromObject(cam, dg)
bvh_lisa = BVHTree.FromObject(colisao, dg)

cco = coords(cam.data)
me = corpo.data
co = coords(me)
lo, hi = cco.min(0) - 0.02, cco.max(0) + 0.02
cand = np.nonzero(np.all((co >= lo) & (co <= hi), axis=1))[0]
R0 = P["pelo_raio_fora"]
H_ = json.load(open(DIR_VESTIR / "corpo.json", encoding="utf-8"))["altura"]
esconde = np.zeros(len(co), bool)
mantem = np.zeros(len(co), bool)  # tem que aparecer mesmo com a camisa em cima (vale para a máscara dinâmica)
normal_lisa = normais(me)
motivo = {"furando": 0, "coberto_escondido": 0, "coberto_visivel": 0, "acima_da_gola": 0}
# borda de cima da gola, por ângulo em volta do pescoço: o pelo acima dela nunca some (o pelo do pescoço cai por cima
# da gola; esconder ali abre um vão entre o pescoço e a gola)
cx_n, cy_n = json.load(open(DIR_VESTIR / "camisa.json", encoding="utf-8"))["pescoco_centro"]
NB = 72
perto = (np.hypot(cco[:, 0] - cx_n, cco[:, 1] - cy_n) < P["gola_raio_busca"]) & (cco[:, 2] > P["gola_abre_de"] * 0.98)
ang_c = np.arctan2(cco[perto, 1] - cy_n, cco[perto, 0] - cx_n)
bin_c = ((ang_c + np.pi) / (2 * np.pi) * NB).astype(int) % NB
z_topo_gola = np.full(NB, -np.inf)
np.maximum.at(z_topo_gola, bin_c, cco[perto, 2])
z_topo_gola = np.where(np.isfinite(z_topo_gola), z_topo_gola, np.nanmax(np.where(np.isfinite(z_topo_gola), z_topo_gola, np.nan)))
z_topo_gola = np.maximum(z_topo_gola, np.roll(z_topo_gola, 1))  # sem buraco entre setores vizinhos
# direções para o teste de visibilidade: a normal e um leque em volta dela, até quase rente à pele


def leque(n):
    a = n.orthogonal().normalized()
    b = n.cross(a)
    out = [n]
    for ang in np.linspace(0, 2 * np.pi, 8, endpoint=False):
        for incl in (0.6, 1.6, 4.0, 12.0):  # até quase rente à pele: a fresta entre a gola e o pescoço aparece de cima
            out.append((n + incl * (float(np.cos(ang)) * a + float(np.sin(ang)) * b)).normalized())
    return out


for i in cand:
    p = Vector(co[i])
    q, nq, _, _ = bvh_lisa.find_nearest(p)
    if q is None:
        continue
    normal_lisa[i] = nq
    ang_v = np.arctan2(co[i, 1] - cy_n, co[i, 0] - cx_n)
    if co[i, 2] > z_topo_gola[int((ang_v + np.pi) / (2 * np.pi) * NB) % NB] - P["gola_margem"]:
        motivo["acima_da_gola"] += 1
        mantem[i] = True
        continue
    d = -nq
    origem = p + nq * R0
    h = bvh.ray_cast(origem, d, R0 + P["pelo_fura_max"])
    if h[0] is None or h[1].dot(d) >= 0:
        continue  # nada da camisa na frente nem logo abaixo, ou o raio pega a camisa por dentro
    # ombro e cava (longe da barra, dos punhos e da gola): a fresta da costura da manga deixaria passar fio de pelo;
    # ali o que está coberto ou furando some sempre
    no_ombro = co[i, 2] > P["ombro_z"] * H_ and abs(co[i, 0]) > P["ombro_x"]
    if h[3] > R0:
        if no_ombro or -h[1].dot(d) >= P["fura_alinhamento"]:
            esconde[i] = True  # fura o tecido: a face de fora da camisa está logo abaixo do pelo, do mesmo lado
            motivo["furando"] += 1
        else:
            motivo["furando_na_beirada"] = motivo.get("furando_na_beirada", 0) + 1
            mantem[i] = True
        continue
    # coberto: some só se nenhum raio sai da camisa (perto da barra, do punho e da gola o pelo aparece pela abertura)
    visivel = False
    for dd in ([] if no_ombro else leque(nq)):
        if bvh.ray_cast(p + dd * 1e-4, dd, 1.0)[0] is None:
            visivel = True
            break
    if visivel:
        motivo["coberto_visivel"] += 1
        mantem[i] = P["mantem_visivel_pela_abertura"]
    else:
        esconde[i] = True
        motivo["coberto_escondido"] += 1

# mesmo destino nos vértices repetidos das costuras do UV (o GLB vem com eles separados): não abre fresta
chave = np.round(co / 1e-6).astype(np.int64)
_, grupo = np.unique(chave, axis=0, return_inverse=True)
grupo = grupo.ravel()
g_esc = np.zeros(grupo.max() + 1, bool)
np.logical_or.at(g_esc, grupo, esconde)
esconde = g_esc[grupo]
g_man = np.zeros(grupo.max() + 1, bool)
np.logical_or.at(g_man, grupo, mantem)
mantem = g_man[grupo] & ~esconde

vg = corpo.vertex_groups.get("sob_camisa") or corpo.vertex_groups.new(name="sob_camisa")
idx = np.nonzero(esconde)[0].tolist()
vg.add(idx, 1.0, "REPLACE")
# a máscara é dinâmica (Geometry Nodes, refaz a conta a cada quadro): na cena em que a camisa sobe, a barriga
# aparece sozinha. O grupo "sob_camisa" fica como registro do repouso.
for nome, tipo, dados, campo in (("normal_lisa", "FLOAT_VECTOR", normal_lisa, "vector"),
                                 ("mantem", "FLOAT", mantem.astype(np.float32), "value")):
    at = me.attributes.get(nome) or me.attributes.new(nome, tipo, "POINT")
    at.data.foreach_set(campo, np.asarray(dados, np.float32).ravel())
velho = corpo.modifiers.get("Esconde_sob_camisa")
if velho:
    corpo.modifiers.remove(velho)
mascara_dinamica(corpo, cam, cobre=R0, fura=P["pelo_fura_max"], alinha=P["fura_alinhamento"])
relato = {"vertices_avaliados": int(len(cand)), "escondidos": int(esconde.sum()), **motivo,
          "segundos": round(time.time() - t0, 1)}
print("ASSENTA", relato)
json.dump(relato, open(DIR_VESTIR / "assenta.json", "w"), indent=1)
bpy.ops.wm.save_as_mainfile(filepath=str(DIR_VESTIR / "4-vestido.blend"), compress=True)

preparar_render(cena, P["amostras"])
luz_estudio(cena)
for o in bpy.data.objects:
    if o.name.startswith("LEO_corpo_col") or o.name in ("LEO_manequim", "LEO_camisa_sim"):
        o.hide_render = True
foto(cena, DIR_RENDER / "4-vestido-frente.png", (0, -2.2, 0.6), (0, 0, 0.56), 85, (800, 1000))
foto(cena, DIR_RENDER / "4-vestido-34.png", (1.4, -1.6, 0.75), (0, 0, 0.6), 85, (800, 1000))
foto(cena, DIR_RENDER / "4-vestido-lado.png", (2.2, 0, 0.6), (0, 0, 0.56), 85, (800, 1000))
foto(cena, DIR_RENDER / "4-vestido-costas.png", (0, 2.2, 0.6), (0, 0, 0.56), 85, (800, 1000))
foto(cena, DIR_RENDER / "4-vestido-ombro.png", (0.55, -0.5, 0.85), (0.12, -0.02, 0.66), 85, (800, 800))
foto(cena, DIR_RENDER / "4-vestido-gola.png", (0.0, -0.75, 0.8), (0, -0.04, 0.72), 85, (800, 800))
foto(cena, DIR_RENDER / "4-vestido-ombro-tras.png", (0.5, 0.55, 0.85), (0.12, 0.03, 0.66), 85, (800, 800))
foto(cena, DIR_RENDER / "4-vestido-barra.png", (0.35, -0.7, 0.28), (0, -0.02, 0.38), 85, (800, 800))
print("VESTIR_ASSENTA ok")
