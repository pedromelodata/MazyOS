"""Léo por peças, tudo do Meshy 7 Ultra, passo 4b: a simulação de tecido da camisa.

blender -b geracoes/vestir/4-tecido-pre.blend --python bl_vestir_simular.py -- vestir-params.json

- colisão com LEO_manequim (forma lisa do corpo: tronco em anéis e braços em cápsulas até a manga). O corpo começa encolhido para dentro
  (chave de forma "encolhido", recuo pela normal maior que a pior entrada da camisa) e cresce até o tamanho real nos
  primeiros quadros, sem gravidade: é ele que empurra o tecido para fora, pela física, sem amassar a malha; depois a
  gravidade liga e o tecido assenta nos ombros e na barriga;
- massa por vértice pequena: a malha de simulação tem uns 6 mil vértices; com a massa padrão do Blender (0,3 kg por
  vértice) a camisa pesaria quase 2 toneladas e atravessaria o corpo;
- mede quanto o tecido anda a cada quadro (assentou ou explodiu?) e o maior estiramento das arestas;
- o assentado vira a forma de partida da malha de simulação; o modificador de tecido fica pronto para animar
  (desligado na vista e no render até a hora de animar: o repouso já está na malha).
Sai: geracoes/vestir/4-tecido.blend, geracoes/vestir/simulacao.json e renders/vestir/4-tecido-*.png.
"""
import json
import sys
import time
from pathlib import Path

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vestir_comum import DIR_RENDER, DIR_VESTIR, coords, foto, gravar_coords, luz_estudio, params, preparar_render  # noqa: E402

P = params()
M = json.load(open(DIR_VESTIR / "corpo.json", encoding="utf-8"))
H = M["altura"]
cena = bpy.context.scene
sim = bpy.data.objects["LEO_camisa_sim"]
col_tec = bpy.data.objects["LEO_manequim"]
alvo_d = P["tecido_espessura"] + P["tecido_folga"]
t0 = time.time()
sme = sim.data
sco = coords(sme)
arestas = np.empty(len(sme.edges) * 2, np.int64)
sme.edges.foreach_get("vertices", arestas)
arestas = arestas.reshape(-1, 2)
L0 = np.linalg.norm(sco[arestas[:, 0]] - sco[arestas[:, 1]], axis=1)

# gola presa (opcional): faixa de cima, peso caindo até zero em pino_altura
z_topo = sco[:, 2].max()
pino = sim.vertex_groups.get("pino") or sim.vertex_groups.new(name="pino")
if P["pino_altura"] > 0:
    pesos = np.clip(1 - (z_topo - sco[:, 2]) / (P["pino_altura"] * H), 0, 1) ** 2
    for i, w in enumerate(pesos):
        if w > 0.01:
            pino.add([i], float(w), "REPLACE")

# corpo encolhido no começo (opcional; com o relaxamento do preparo o tecido já parte fora do corpo)
from mathutils import Vector  # noqa: E402
from mathutils.bvhtree import BVHTree  # noqa: E402
bvh_c = BVHTree.FromObject(col_tec, bpy.context.evaluated_depsgraph_get())
pior = 0.0
for p in sco:
    q, n, _, _ = bvh_c.find_nearest(Vector(p))
    if q is not None:
        pior = max(pior, alvo_d - (Vector(p) - q).dot(n))
cresce = P["tecido_cresce_quadros"]
cme = col_tec.data
sk = None
recuo = 0.0
if cresce > 0:
    recuo = pior + P["encolhe_margem"]
    if cme.shape_keys is None:
        col_tec.shape_key_add(name="Basis")
    sk = cme.shape_keys.key_blocks.get("encolhido") or col_tec.shape_key_add(name="encolhido")
    cco = coords(cme)
    cn = np.empty(len(cme.vertices) * 3, np.float32)
    cme.vertices.foreach_get("normal", cn)
    sk.data.foreach_set("co", (cco - cn.reshape(-1, 3) * recuo).astype(np.float32).ravel())
    sk.value = 1.0
    sk.keyframe_insert("value", frame=1)
    sk.value = 0.0
    sk.keyframe_insert("value", frame=1 + cresce)
print("ENCOLHE corpo recua %.4f (pior entrada %.4f) e cresce em %d quadros" % (recuo, pior, cresce))

for o in (bpy.data.objects["LEO_corpo_colisao"], col_tec):
    for m in list(o.modifiers):
        if m.type == "COLLISION":
            o.modifiers.remove(m)
col_tec.modifiers.new("Colisao", "COLLISION")
col_tec.collision.thickness_outer = P["colisao_espessura"]
col_tec.collision.cloth_friction = P["tecido_atrito"]
col_tec.collision.use_culling = False

AJUSTES = {"quality": P["tecido_qualidade"], "mass": P["tecido_massa"], "tension_stiffness": P["tecido_tracao"],
           "compression_stiffness": P["tecido_tracao"], "shear_stiffness": P["tecido_cisalha"],
           "bending_stiffness": P["tecido_dobra"], "air_damping": P["tecido_ar"], "vertex_group_mass": "pino",
           "pin_stiffness": 1.0}


def tecido_novo():
    t = sim.modifiers.new("Tecido", "CLOTH")
    for k, v in AJUSTES.items():
        setattr(t.settings, k, v)
    c = t.collision_settings
    c.use_collision = True
    c.distance_min = alvo_d
    c.collision_quality = P["tecido_colisao_qualidade"]
    c.use_self_collision = P["tecido_auto_colisao"]
    c.self_distance_min = 0.003
    return t


for m in list(sim.modifiers):
    sim.modifiers.remove(m)
tec = tecido_novo()
# sem gravidade enquanto o corpo cresce (senão a camisa despenca antes de ter onde apoiar)
ew = tec.settings.effector_weights
ew.gravity = 0.0
ew.keyframe_insert("gravity", frame=1 + cresce)
ew.gravity = 1.0
ew.keyframe_insert("gravity", frame=1 + cresce + P["tecido_gravidade_rampa"])
print("PARTIDA pior entrada %.4f (alvo %.4f)" % (pior, alvo_d))
tec.point_cache.frame_start = 1
tec.point_cache.frame_end = P["tecido_quadros"]
cena.frame_start, cena.frame_end = 1, P["tecido_quadros"]
anterior = sco.copy()
agora = sco.copy()
quadros = []
for f in range(1, P["tecido_quadros"] + 1):
    cena.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    agora = np.array([v.co[:] for v in sim.evaluated_get(dg).data.vertices])
    passo = np.linalg.norm(agora - anterior, axis=1)
    est = np.linalg.norm(agora[arestas[:, 0]] - agora[arestas[:, 1]], axis=1) / np.maximum(L0, 1e-9)
    quadros.append({"quadro": f, "passo_mediana": float(np.median(passo)), "passo_max": float(passo.max()),
                    "estira_max": float(est.max()), "estira_p99": float(np.percentile(est, 99))})
    anterior = agora
    if f % 5 == 0 or f == 1:
        print("QUADRO %3d passo mediana %.5f máx %.4f | estira p99 %.3f máx %.3f" % (
            f, np.median(passo), passo.max(), np.percentile(est, 99), est.max()))
mov = np.linalg.norm(agora - sco, axis=1)
print("TECIDO total: mediana %.4f máx %.4f em %.0f s" % (np.median(mov), mov.max(), time.time() - t0))

sim.modifiers.remove(tec)
gravar_coords(sme, agora)
if sk is not None:
    cme.shape_keys.animation_data_clear()
    sk.value = 0.0
tec = tecido_novo()
tec.show_viewport = tec.show_render = False  # ligado na hora de animar; o repouso já está na malha
cena.frame_set(1)
json.dump({"quadros": quadros, "mov_mediana": float(np.median(mov)), "mov_max": float(mov.max()), "ajustes": AJUSTES},
          open(DIR_VESTIR / "simulacao.json", "w"), indent=1)
bpy.ops.wm.save_as_mainfile(filepath=str(DIR_VESTIR / "4-tecido.blend"), compress=True)

preparar_render(cena, P["amostras"])
luz_estudio(cena)
for o in (bpy.data.objects["LEO_corpo_colisao"], col_tec, sim):
    o.hide_viewport = True
foto(cena, DIR_RENDER / "4-tecido-frente.png", (0, -2.2, 0.6), (0, 0, 0.56), 85, (800, 1000))
foto(cena, DIR_RENDER / "4-tecido-34.png", (1.4, -1.6, 0.75), (0, 0, 0.6), 85, (800, 1000))
foto(cena, DIR_RENDER / "4-tecido-lado.png", (2.2, 0, 0.6), (0, 0, 0.56), 85, (800, 1000))
foto(cena, DIR_RENDER / "4-tecido-costas.png", (0, 2.2, 0.6), (0, 0, 0.56), 85, (800, 1000))
print("VESTIR_SIMULAR ok")
