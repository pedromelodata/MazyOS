# Bancada de look do filme: renderiza o iphone-b-preparado.blend no estúdio
# padrão (luz acompanha o plano) — frente e costas, CPU por padrão (a GPU
# costuma estar ocupada com masters).
#
#   blender --background cena\iphone-b-preparado.blend --python cena\bancada-look.py -- <prefixo_saida> [gpu]
#
# NÃO mexe em materiais: o preparado já tem display calibrado (emissão 1,12)
# e titânio escuro — este script só ilumina, enquadra e fotografa.
import bpy, math, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
PREFIXO = argv[0]
USA_GPU = len(argv) > 1 and argv[1] == 'gpu'

mins = Vector((1e9,) * 3); maxs = Vector((-1e9,) * 3)
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        mins = Vector(map(min, mins, w)); maxs = Vector(map(max, maxs, w))
centro = (mins + maxs) / 2
tam = max((maxs - mins).length, 1e-4)

mundo = bpy.data.worlds.new('mundo_bancada')
if mundo.node_tree is None:
    mundo.use_nodes = True
mundo.node_tree.nodes['Background'].inputs['Color'].default_value = (0.010, 0.011, 0.013, 1)
mundo.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
bpy.context.scene.world = mundo

esc = tam / 0.42
LUZES = []

def area(nome, loc, tam_l, forca, cor):
    d = bpy.data.lights.new(nome, 'AREA')
    d.shape, d.energy, d.color = 'RECTANGLE', forca, cor
    d.size, d.size_y = tam_l
    o = bpy.data.objects.new(nome, d)
    o.location = loc
    o.rotation_euler = (centro - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.collection.objects.link(o)
    return o

def monta_luzes(azim_deg):
    global LUZES
    for o in LUZES:
        bpy.data.objects.remove(o, do_unlink=True)
    LUZES = []
    az = math.radians(azim_deg)
    def pos(dx, dy, dz):
        cx = math.cos(az); sx = math.sin(az)
        return centro + Vector((dx * cx + dy * sx, dx * sx - dy * cx, dz))
    LUZES.append(area('key',  pos(0.30 * esc, -0.36 * esc, 0.38 * esc), (0.36 * esc, 0.48 * esc), 3.5 * esc * esc, (1.0, 0.99, 0.97)))
    LUZES.append(area('rim',  pos(-0.36 * esc, 0.30 * esc, 0.20 * esc), (0.28 * esc, 0.40 * esc), 1.5 * esc * esc, (0.95, 0.95, 1.0)))
    LUZES.append(area('fill', pos(0.24 * esc, -0.44 * esc, -0.05 * esc), (0.48 * esc, 0.48 * esc), 0.5 * esc * esc, (0.86, 0.90, 1.0)))

cam_d = bpy.data.cameras.new('cam_bancada')
cam_d.sensor_fit, cam_d.sensor_height = 'VERTICAL', 36.0
cam_d.lens = 18.0 / math.tan(math.radians(15.0))
cam = bpy.data.objects.new('cam_bancada', cam_d)
bpy.context.scene.collection.objects.link(cam)
bpy.context.scene.camera = cam

def enquadra(azim_deg, elev_deg):
    dist = tam * 2.1
    az, el = math.radians(azim_deg), math.radians(elev_deg)
    pos = centro + Vector((dist * math.cos(el) * math.sin(az),
                           -dist * math.cos(el) * math.cos(az),
                           dist * math.sin(el)))
    cam.location = pos
    cam.rotation_euler = (centro - pos).to_track_quat('-Z', 'Y').to_euler()

sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.samples = 64
sc.cycles.use_denoising = True
sc.cycles.device = 'GPU' if USA_GPU else 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 960, 540
sc.view_settings.view_transform = 'Standard'
sc.view_settings.look = 'None'
sc.render.image_settings.file_format = 'PNG'

for nome, az, el in (('frente', 24, 8), ('costas', 204, 10)):
    monta_luzes(az)
    enquadra(az, el)
    sc.render.filepath = f'{PREFIXO}-{nome}.png'
    bpy.ops.render.render(write_still=True)
    print('[bancada] render', nome, '->', sc.render.filepath)
