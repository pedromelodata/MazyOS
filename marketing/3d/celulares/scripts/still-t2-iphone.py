# Still do iPhone pro T2 do filme Escalada: retrato, fundo TRANSPARENTE,
# ângulo quase frontal (cards do AE colam na tela sem briga de perspectiva),
# estúdio derivado do bancada-look.py (não mexe em materiais).
#
#   blender --background cena\iphone-b-preparado.blend --python cena\still-t2-iphone.py -- <saida.png>
import bpy, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
SAIDA = argv[0]

# tela do aparelho: TODA textura de arquivo vira a imagem passada em --tela
# (default: coral liso sem logo — direção Pedro 17/08). Também cobre caminhos
# quebrados herdados do PC antigo.
TELA = argv[1] if len(argv) > 1 else r'C:\Projects\Legalizei_Videos\marketing\filme\escalada\assets\tela-coral-lisa.png'
for img in bpy.data.images:
    if img.source == 'FILE':
        if img.name.startswith('base_'):
            continue  # mapas do corpo (Normal/Roughness/Alpha etc): nao mexer
        print('[t2] textura', img.name, '->', TELA)
        img.filepath = TELA
        img.reload()

mins = Vector((1e9,) * 3); maxs = Vector((-1e9,) * 3)
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        mins = Vector(map(min, mins, w)); maxs = Vector(map(max, maxs, w))
centro = (mins + maxs) / 2
tam = max((maxs - mins).length, 1e-4)

mundo = bpy.data.worlds.new('mundo_t2')
if mundo.node_tree is None:
    mundo.use_nodes = True
mundo.node_tree.nodes['Background'].inputs['Color'].default_value = (0.9, 0.89, 0.87, 1)
mundo.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.25
bpy.context.scene.world = mundo

esc = tam / 0.42
AZ = float(argv[2]) if len(argv) > 2 else 14  # azimute (graus); menor = mais frontal
EL_DEG = float(argv[3]) if len(argv) > 3 else 5

def area(nome, loc, tam_l, forca, cor):
    d = bpy.data.lights.new(nome, 'AREA')
    d.shape, d.energy, d.color = 'RECTANGLE', forca, cor
    d.size, d.size_y = tam_l
    o = bpy.data.objects.new(nome, d)
    o.location = loc
    o.rotation_euler = (centro - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.collection.objects.link(o)
    return o

az = math.radians(AZ)
def pos(dx, dy, dz):
    cx = math.cos(az); sx = math.sin(az)
    return centro + Vector((dx * cx + dy * sx, dx * sx - dy * cx, dz))
area('key',  pos(0.30 * esc, -0.36 * esc, 0.38 * esc), (0.36 * esc, 0.48 * esc), 3.5 * esc * esc, (1.0, 0.99, 0.97))
area('rim',  pos(-0.36 * esc, 0.30 * esc, 0.20 * esc), (0.28 * esc, 0.40 * esc), 1.8 * esc * esc, (0.95, 0.95, 1.0))
area('fill', pos(0.24 * esc, -0.44 * esc, -0.05 * esc), (0.48 * esc, 0.48 * esc), 0.6 * esc * esc, (0.86, 0.90, 1.0))

cam_d = bpy.data.cameras.new('cam_t2')
cam_d.sensor_fit, cam_d.sensor_height = 'VERTICAL', 36.0
cam_d.lens = 18.0 / math.tan(math.radians(15.0))
cam = bpy.data.objects.new('cam_t2', cam_d)
bpy.context.scene.collection.objects.link(cam)
bpy.context.scene.camera = cam

dist = tam * 1.9  # aparelho inteiro com folga no retrato
el = math.radians(EL_DEG)
p = centro + Vector((dist * math.cos(el) * math.sin(az),
                     -dist * math.cos(el) * math.cos(az),
                     dist * math.sin(el)))
cam.location = p
cam.rotation_euler = (centro - p).to_track_quat('-Z', 'Y').to_euler()

sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.samples = 96
sc.cycles.use_denoising = False  # OIDN sem RAM com o AE aberto
sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 1600, 2400
sc.render.film_transparent = True
sc.view_settings.view_transform = 'Standard'
sc.view_settings.look = 'None'
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.render.filepath = SAIDA
bpy.ops.render.render(write_still=True)
print('[t2] render ->', SAIDA)
