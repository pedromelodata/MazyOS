"""Léo por peças, tudo do Meshy 7 Ultra: teste da física de tecido (o Léo dá um pulo).

blender -b geracoes/vestir/5-fisica.blend --python bl_vestir_pulo.py -- vestir-params.json

O vazio LEO_raiz (que leva o Léo inteiro, até o rig existir) sobe e desce pelas chaves de pulo_chaves; a barra da
camisa e as asas da gravata ficam para trás e balançam pela simulação. Mede, quadro a quadro, quanto o tecido anda e
o maior estiramento das arestas, na camisa e na gravata, e fotografa alguns quadros. Não salva o .blend.
Sai: renders/vestir/7-pulo-*.png e geracoes/vestir/pulo.json.
"""
import json
import sys
import time
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vestir_comum import DIR_RENDER, DIR_VESTIR, coords, foto, luz_estudio, params, preparar_render  # noqa: E402

P = params()
cena = bpy.context.scene
sim = bpy.data.objects["LEO_camisa_sim"]
t0 = time.time()

raiz = bpy.data.objects["LEO_raiz"]
for quadro, altura in P["pulo_chaves"]:
    raiz.location = (0.0, 0.0, altura)
    raiz.keyframe_insert("location", frame=quadro)
for fc in raiz.animation_data.action.fcurves if hasattr(raiz.animation_data.action, "fcurves") else []:
    for kp in fc.keyframe_points:
        kp.interpolation = "SINE"
fim = P["pulo_chaves"][-1][0]
for nome in ("LEO_camisa_sim", "LEO_gravata_sim"):
    bpy.data.objects[nome].modifiers["Tecido"].point_cache.frame_end = fim
cena.frame_start, cena.frame_end = 1, fim
gsim = bpy.data.objects["LEO_gravata_sim"]
gco0 = coords(gsim.data)
sme = sim.data
sco = coords(sme)
ar = np.empty(len(sme.edges) * 2, np.int64)
sme.edges.foreach_get("vertices", ar)
ar = ar.reshape(-1, 2)
L0 = np.linalg.norm(sco[ar[:, 0]] - sco[ar[:, 1]], axis=1)
preparar_render(cena, P["amostras"])
luz_estudio(cena)
for o in bpy.data.objects:
    if o.name.startswith("LEO_corpo_col") or o.name in ("LEO_manequim", "LEO_camisa_sim"):
        o.hide_render = True


def fotografar(f):
    foto(cena, DIR_RENDER / f"7-pulo-{f:03d}.png", (0.75, -1.9, 0.62), (0, 0, 0.56), 85, (700, 900))


anterior = sco.copy()
quadros = []
estados = {}
fotos = sorted(set(P["pulo_fotos"]))
for f in range(1, fim + 1):
    cena.frame_set(f)
    agora = np.array([v.co[:] for v in sim.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices])
    passo = np.linalg.norm(agora - anterior, axis=1)
    est = np.linalg.norm(agora[ar[:, 0]] - agora[ar[:, 1]], axis=1) / np.maximum(L0, 1e-9)
    # a gravata, no espaço da camisa (tira o movimento do pulo): o quanto as asas balançam
    g = np.array([v.co[:] for v in gsim.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices])
    g_mundo = np.array([gsim.matrix_world @ Vector(v) for v in g])
    sobe = raiz.matrix_world.translation.z
    quadros.append({"quadro": f, "passo_mediana": float(np.median(passo)), "passo_max": float(passo.max()),
                    "estira_p99": float(np.percentile(est, 99)), "estira_max": float(est.max()),
                    "gravata_desvio_max": float(np.linalg.norm(g_mundo - (gco0 + [0, 0, sobe]), axis=1).max())})
    anterior = agora
    if f in fotos:
        estados[f] = agora.copy()
        fotografar(f)  # na hora: voltar depois de simular tudo nem sempre acha o cache do tecido
    if f % 10 == 0 or f == 1:
        print("QUADRO %3d passo mediana %.5f máx %.4f | estira p99 %.3f máx %.3f | gravata desvio %.4f" % (
            f, np.median(passo), passo.max(), np.percentile(est, 99), est.max(), quadros[-1]["gravata_desvio_max"]))
pior = max(quadros, key=lambda q: q["estira_max"])
relato = {"quadros": quadros, "pior_quadro": pior, "segundos": round(time.time() - t0, 1)}
json.dump(relato, open(DIR_VESTIR / "pulo.json", "w"), indent=1)
print("PULO pior estiramento %.3f no quadro %d (p99 %.3f); %.0f s" % (pior["estira_max"], pior["quadro"], pior["estira_p99"], time.time() - t0))

print("VESTIR_PULO ok")
