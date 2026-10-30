"""Léo por peças, tudo do Meshy 7 Ultra: teste da física de tecido (o puxão na barra da camisa).

blender -b geracoes/vestir/5-fisica.blend --python bl_vestir_puxao.py -- vestir-params.json

O vazio LEO_puxa_camisa sobe e vem para a frente entre os quadros puxa_de e puxa_ate e fica lá; o resto da camisa vem
junto pela simulação (gravidade, colisão com o manequim, ombros e gola presos). A máscara dinâmica do corpo refaz a
conta a cada quadro, então a barriga aparece onde a camisa sai de cima. Mede, quadro a quadro, quanto o tecido anda e o maior
estiramento das arestas (assentou ou explodiu?) e fotografa alguns quadros. Não salva o .blend (o arquivo oficial
fica em repouso).
Sai: renders/vestir/6-puxao-*.png e geracoes/vestir/puxao.json.
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
vazio = bpy.data.objects["LEO_puxa_camisa"]
t0 = time.time()

de, ate, fim = P["puxa_de"], P["puxa_ate"], P["puxa_fim"]
base = vazio.location.copy()
vazio.keyframe_insert("location", frame=1)
vazio.keyframe_insert("location", frame=de)
vazio.location = base + Vector(P["puxa_movimento"])
vazio.keyframe_insert("location", frame=ate)
vazio.keyframe_insert("location", frame=fim)
tec = sim.modifiers["Tecido"]
tec.point_cache.frame_end = fim
cena.frame_start, cena.frame_end = 1, fim

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
    foto(cena, DIR_RENDER / f"6-puxao-{f:03d}.png", (0.55, -1.45, 0.5), (0, 0, 0.5), 85, (700, 800))


anterior = sco.copy()
quadros = []
estados = {}
fotos = sorted(set(P["puxa_fotos"]))
for f in range(1, fim + 1):
    cena.frame_set(f)
    agora = np.array([v.co[:] for v in sim.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices])
    passo = np.linalg.norm(agora - anterior, axis=1)
    est = np.linalg.norm(agora[ar[:, 0]] - agora[ar[:, 1]], axis=1) / np.maximum(L0, 1e-9)
    quadros.append({"quadro": f, "passo_mediana": float(np.median(passo)), "passo_max": float(passo.max()),
                    "estira_p99": float(np.percentile(est, 99)), "estira_max": float(est.max())})
    anterior = agora
    if f in fotos:
        estados[f] = agora.copy()
        fotografar(f)  # na hora: voltar depois de simular tudo nem sempre acha o cache do tecido
    if f % 10 == 0 or f == 1:
        print("QUADRO %3d passo mediana %.5f máx %.4f | estira p99 %.3f máx %.3f" % (
            f, np.median(passo), passo.max(), np.percentile(est, 99), est.max()))
pior = max(quadros, key=lambda q: q["estira_max"])
relato = {"quadros": quadros, "pior_quadro": pior, "segundos": round(time.time() - t0, 1)}
json.dump(relato, open(DIR_VESTIR / "puxao.json", "w"), indent=1)
print("PUXAO pior estiramento %.3f no quadro %d (p99 %.3f); %.0f s" % (pior["estira_max"], pior["quadro"], pior["estira_p99"], time.time() - t0))

print("VESTIR_PUXAO ok")
