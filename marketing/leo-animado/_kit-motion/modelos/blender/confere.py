"""Confere GLB no Blender 5.2: importa cada arquivo numa cena vazia e relata o que entrou.

Pacote K09 do kit de motion do Legalizaí. Uso (em segundo plano, sem salvar .blend):
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" --background --factory-startup \
        --python confere.py -- <arquivo.glb> [<arquivo.glb> ...]

Pra cada arquivo imprime uma linha "K09_CONFERE {json}" com: erro de importação (ou null), objetos (nome, tipo,
pai), triângulos por malha e no total, materiais, imagens (nome, tamanho, se veio embutida), caixa no mundo em
coordenadas do glTF (Y pra cima, metros) e a faixa de UV de cada malha. Sai com código 1 se algum falhar.
"""
import json
import os
import sys

sys.dont_write_bytecode = True
import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402


def _caixa_mundo(obs):
    lo = [float("inf")] * 3
    hi = [float("-inf")] * 3
    for ob in obs:
        if ob.type != "MESH":
            continue
        for c in ob.bound_box:
            p = ob.matrix_world @ Vector(c)
            q = (p.x, p.z, -p.y)  # Blender (Z pra cima) para glTF (Y pra cima)
            for k in range(3):
                lo[k] = min(lo[k], q[k])
                hi[k] = max(hi[k], q[k])
    if lo[0] == float("inf"):
        return None
    return {"min": [round(v, 6) for v in lo], "max": [round(v, 6) for v in hi],
            "tamanho": [round(b - a, 6) for a, b in zip(lo, hi)]}


def confere(caminho):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    r = {"arquivo": caminho, "erro": None}
    try:
        res = bpy.ops.import_scene.gltf(filepath=os.path.abspath(caminho))
        if "FINISHED" not in res:
            r["erro"] = "importação devolveu %s" % (res,)
    except Exception as e:  # noqa: BLE001
        r["erro"] = "%s: %s" % (type(e).__name__, e)
        return r
    dg = bpy.context.evaluated_depsgraph_get()
    objs, total = [], 0
    for ob in bpy.data.objects:
        item = {"nome": ob.name, "tipo": ob.type, "pai": ob.parent.name if ob.parent else None}
        if ob.type == "MESH":
            ev = ob.evaluated_get(dg)
            me = ev.to_mesh()
            me.calc_loop_triangles()
            item["triangulos"] = len(me.loop_triangles)
            total += item["triangulos"]
            item["materiais"] = [s.material.name for s in ob.material_slots if s.material]
            if me.uv_layers:
                uv = me.uv_layers[0].data
                us = [d.uv[0] for d in uv]
                vs = [d.uv[1] for d in uv]
                item["uv"] = [round(min(us), 6), round(max(us), 6), round(min(vs), 6), round(max(vs), 6)]
            ev.to_mesh_clear()
        objs.append(item)
    r["objetos"] = objs
    r["triangulos"] = total
    r["materiais"] = sorted(m.name for m in bpy.data.materials)
    r["imagens"] = [{"nome": im.name, "tamanho": list(im.size), "embutida": im.packed_file is not None}
                    for im in bpy.data.images]
    r["caixa"] = _caixa_mundo(bpy.data.objects)
    return r


def principal():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if not argv:
        raise SystemExit("uso: blender --background --factory-startup --python confere.py -- <arquivo.glb> [...]")
    falhas = 0
    for caminho in argv:
        r = confere(caminho)
        if r["erro"]:
            falhas += 1
        print("K09_CONFERE " + json.dumps(r, ensure_ascii=False))
    sys.stdout.flush()
    if falhas:
        sys.exit(1)


principal()
