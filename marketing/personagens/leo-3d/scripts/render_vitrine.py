"""Vitrine de um GLB gerado: os mesmos ângulos dos prints do Hi 3D (lado, rosto, pernas, costas), fundo escuro.

Uso: python render_vitrine.py geracoes/<arquivo>.glb [--rotacao 0] [--saturacao 1.25]
Sai em renders/vitrine/<nome>/ (lado.png, rosto.png, pernas.png, costas.png e vitrine.png com os quatro).
O modelo é posto com 0,98 m de altura (a escala do Léo) e a frente para -Y.
"""
import argparse
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ambiente import BLENDER, RAIZ, RENDERS  # noqa: E402

CENA = r"""
import bpy, math, sys
from mathutils import Vector, Matrix
glb, saida, rot, sat = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
ms = [o for o in bpy.context.scene.objects if o.type == "MESH"]
for o in list(bpy.context.scene.objects):
    if o.type != "MESH":
        bpy.data.objects.remove(o)
bpy.ops.object.select_all(action="DESELECT")
for o in ms:
    o.select_set(True)
bpy.context.view_layer.objects.active = ms[0]
if len(ms) > 1:
    bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
ob.parent = None
ob.rotation_mode = "XYZ"
ob.rotation_euler.z += math.radians(float(rot))
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
vs = [v.co for v in ob.data.vertices]
mn = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
mx = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
k = 0.98 / (mx.z - mn.z)
ob.data.transform(Matrix.Translation((-(mn.x + mx.x) / 2 * k, -(mn.y + mx.y) / 2 * k, -mn.z * k)) @ Matrix.Scale(k, 4))
ob.data.update()
for s in ob.material_slots:
    nt = s.material.node_tree
    tex = next((n for n in nt.nodes if n.type == "TEX_IMAGE" and any(l.to_socket.name == "Base Color" for l in n.outputs["Color"].links)), None)
    if tex:
        hsv = nt.nodes.new("ShaderNodeHueSaturation")
        hsv.inputs["Saturation"].default_value = float(sat)
        dest = [l.to_socket for l in tex.outputs["Color"].links if l.to_socket.name == "Base Color"][0]
        nt.links.new(tex.outputs["Color"], hsv.inputs["Color"])
        nt.links.new(hsv.outputs["Color"], dest)
for p in ob.data.polygons:
    p.use_smooth = True
c = bpy.context.scene
c.render.engine = "CYCLES"
c.cycles.samples = 64
c.cycles.use_denoising = True
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "OPTIX"
c.cycles.device = "GPU"
c.view_settings.view_transform = "AgX"
c.view_settings.look = "None"
w = bpy.data.worlds.new("w")
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.035, 0.037, 0.04, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 1.0
c.world = w
for nome, e, rot_ in (("chave", 3.5, (55, 0, 30)), ("preenche", 1.2, (70, 0, -60)), ("recorte", 3.0, (60, 0, 190))):
    l = bpy.data.objects.new(nome, bpy.data.lights.new(nome, "SUN"))
    l.data.energy = e
    l.data.angle = math.radians(8)
    l.rotation_euler = [math.radians(a) for a in rot_]
    c.collection.objects.link(l)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
c.collection.objects.link(cam)
c.camera = cam
def foto(nome, pos, alvo, lente, rx, ry):
    cam.data.lens = lente
    cam.location = pos
    cam.rotation_euler = (Vector(alvo) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    c.render.resolution_x, c.render.resolution_y = rx, ry
    c.render.filepath = f"{saida}/{nome}.png"
    bpy.ops.render.render(write_still=True)
foto("lado", (2.6, -0.15, 0.55), (0, 0, 0.5), 60, 720, 760)
foto("rosto", (0.0, -1.05, 0.83), (0, 0, 0.8), 85, 720, 720)
foto("pernas", (0.25, -1.3, 0.55), (0, 0, 0.25), 60, 720, 720)
foto("costas", (0.0, 1.6, 0.35), (0, 0, 0.25), 60, 720, 720)
print("VITRINE ok")
"""


def main():
    a = argparse.ArgumentParser()
    a.add_argument("glb")
    a.add_argument("--rotacao", type=float, default=0)
    a.add_argument("--saturacao", type=float, default=1.25)
    p = a.parse_args()
    glb = Path(p.glb)
    glb = glb if glb.is_absolute() else RAIZ / glb
    saida = RENDERS / "vitrine" / glb.stem
    saida.mkdir(parents=True, exist_ok=True)
    r = subprocess.run([str(BLENDER), "-b", "--python-expr", CENA, "--", str(glb), str(saida), str(p.rotacao), str(p.saturacao)],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    (saida / "blender.log").write_text(r.stdout + r.stderr, encoding="utf-8")
    if "VITRINE ok" not in r.stdout:
        sys.exit(f"falhou; ver {saida / 'blender.log'}")
    from PIL import Image
    ims = [Image.open(saida / f"{n}.png").convert("RGB") for n in ("lado", "rosto", "pernas", "costas")]
    alt = 600
    ims = [im.resize((round(im.width * alt / im.height), alt)) for im in ims]
    folha = Image.new("RGB", (sum(im.width for im in ims), alt), (20, 20, 22))
    x = 0
    for im in ims:
        folha.paste(im, (x, 0))
        x += im.width
    folha.save(saida / "vitrine.png", optimize=True)
    print("pronto:", saida / "vitrine.png")


if __name__ == "__main__":
    main()
