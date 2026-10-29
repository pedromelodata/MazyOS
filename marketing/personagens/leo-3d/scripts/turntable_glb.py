"""Etapa 2 do PLANO.md: turntable e close de rosto de um GLB gerado, para a folha de contato do bake-off.

Uso (o Blender roda em background, sem janela):
    python turntable_glb.py geracoes/<arquivo>.glb [--vistas 8] [--amostras 64]

Sai em renders/turntable/<nome do GLB>/:
    giro_00.png ... giro_07.png   volta inteira, câmera na altura do peito, 0 grau = frente
    rosto.png                     close da cabeça, de frente
    contato.png                   giro + rosto lado a lado com as vistas da folha (entradas/vistas/)
    medidas.json                  faces, vértices, altura, objetos e materiais do GLB

Frente do GLB: os geradores entregam o personagem olhando para -Y (padrão glTF convertido pelo Blender).
Se o turntable sair de costas no giro_00, rodar de novo com --frente-y-positivo.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ambiente import BLENDER, ENTRADAS, RAIZ, RENDERS  # noqa: E402

# Roda dentro do Blender. Recebe os argumentos depois do "--".
CENA = r"""
import bpy, json, math, sys
from mathutils import Vector

arq, saida, vistas, amostras, frente_pos = sys.argv[sys.argv.index("--") + 1:]
vistas, amostras, frente_pos = int(vistas), int(amostras), frente_pos == "1"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=arq)
malhas = [o for o in bpy.context.scene.objects if o.type == "MESH"]

# Junta tudo num pai vazio, apoia no chão (z = 0) e centra em x, y
pai = bpy.data.objects.new("LEO_gerado", None)
bpy.context.scene.collection.objects.link(pai)
for o in bpy.context.scene.objects:
    if o.parent is None and o is not pai:
        o.parent = pai
bpy.context.view_layer.update()
pts = [o.matrix_world @ Vector(c) for o in malhas for c in o.bound_box]
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
altura = mx.z - mn.z
pai.location = (-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z)
if frente_pos:
    pai.rotation_euler.z = math.pi

cena = bpy.context.scene
r = cena.render
r.engine = "CYCLES"
cena.cycles.samples = amostras
cena.cycles.use_denoising = True
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "OPTIX"
cena.cycles.device = "GPU"
r.resolution_x, r.resolution_y = 768, 1024
r.film_transparent = True
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"
cena.view_settings.view_transform = "AgX"

# Luz neutra de estúdio: o que importa aqui é forma e cor, não o Luz Coral
mundo = bpy.data.worlds.new("estudio")
mundo.use_nodes = True
mundo.node_tree.nodes["Background"].inputs[0].default_value = (0.8, 0.8, 0.8, 1)
mundo.node_tree.nodes["Background"].inputs[1].default_value = 0.6
cena.world = mundo
for nome, energia, rot in (("chave", 4.0, (50, 0, 35)), ("recorte", 2.5, (60, 0, 200))):
    luz = bpy.data.objects.new(nome, bpy.data.lights.new(nome, "SUN"))
    luz.data.energy = energia
    luz.rotation_euler = [math.radians(a) for a in rot]
    cena.collection.objects.link(luz)

cam = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
cam.data.lens = 85
cena.collection.objects.link(cam)
cena.camera = cam
alvo = bpy.data.objects.new("alvo", None)
cena.collection.objects.link(alvo)
mira = cam.constraints.new("TRACK_TO")
mira.target = alvo

def foto(caminho, angulo, z_alvo, dist, z_cam):
    a = math.radians(angulo)
    alvo.location = (0, 0, z_alvo)
    cam.location = (dist * math.sin(a), -dist * math.cos(a), z_cam)
    r.filepath = caminho
    bpy.ops.render.render(write_still=True)

dist = altura * 3.4
for i in range(vistas):
    foto(f"{saida}/giro_{i:02d}.png", 360 * i / vistas, altura * 0.5, dist, altura * 0.55)
r.resolution_x, r.resolution_y = 1024, 1024
foto(f"{saida}/rosto.png", 0, altura * 0.86, altura * 1.15, altura * 0.88)

faces = sum(len(o.data.polygons) for o in malhas)
verts = sum(len(o.data.vertices) for o in malhas)
mats = sorted({s.material.name for o in malhas for s in o.material_slots if s.material})
json.dump({"arquivo": arq, "objetos": len(malhas), "faces": faces, "vertices": verts,
           "altura_m": round(altura, 4), "materiais": mats}, open(f"{saida}/medidas.json", "w"), indent=2)
print("LEO_TURNTABLE ok", faces, "faces")
"""


def contato(pasta, vistas):
    """Folha de contato: linha 1 com as vistas da folha aprovada, linha 2 com o giro do GLB e o rosto."""
    from PIL import Image

    alt = 512
    def abrir(p):
        im = Image.open(p).convert("RGBA")
        im = im.resize((round(im.width * alt / im.height), alt), Image.LANCZOS)
        fundo = Image.new("RGBA", im.size, (236, 236, 236, 255))
        fundo.alpha_composite(im)
        return fundo.convert("RGB")
    ref = [abrir(ENTRADAS / "vistas" / f"vista-{n}.png") for n in ("frente", "esquerda", "costas", "direita")]
    passo = vistas // 4
    giro = [abrir(pasta / f"giro_{i * passo:02d}.png") for i in range(4)] + [abrir(pasta / "rosto.png")]
    linhas = [ref, giro]
    larg = max(sum(im.width for im in l) for l in linhas)
    folha = Image.new("RGB", (larg, alt * 2), (236, 236, 236))
    for y, linha in enumerate(linhas):
        x = 0
        for im in linha:
            folha.paste(im, (x, y * alt))
            x += im.width
    folha.save(pasta / "contato.png", optimize=True)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("glb")
    p.add_argument("--vistas", type=int, default=8)
    p.add_argument("--amostras", type=int, default=64)
    p.add_argument("--frente-y-positivo", action="store_true")
    a = p.parse_args()
    glb = Path(a.glb)
    glb = glb if glb.is_absolute() else RAIZ / glb
    saida = RENDERS / "turntable" / glb.stem
    saida.mkdir(parents=True, exist_ok=True)
    cmd = [str(BLENDER), "-b", "--python-expr", CENA, "--", str(glb), str(saida),
           str(a.vistas), str(a.amostras), "1" if a.frente_y_positivo else "0"]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    (saida / "blender.log").write_text(r.stdout + r.stderr, encoding="utf-8")
    if "LEO_TURNTABLE ok" not in r.stdout:
        sys.exit(f"Blender falhou (código {r.returncode}); ver {saida / 'blender.log'}")
    contato(saida, a.vistas)
    print(json.loads((saida / "medidas.json").read_text(encoding="utf-8")))
    print(f"pronto: {saida / 'contato.png'}")


if __name__ == "__main__":
    main()
