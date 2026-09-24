# Spin do iPhone pras transições do filme Escalada (T2 e T5):
# renderiza N frames de turntable (uma volta completa de azimute) TERMINANDO
# na pose exata do still estático do take (az_end/el), com tela e alpha iguais
# ao still-t2-iphone.py. Estúdio idêntico ao bancada-look (luz acompanha az_end).
#
#   blender --background cena\iphone-b-preparado.blend --python cena\spin-iphone.py -- <pasta_saida> <tela.png> <az_end> <el> <n_frames> <sentido>
#   sentido: 1 = giro horário, -1 = anti-horário
import bpy, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
PASTA = argv[0]
TELA = argv[1]
AZ_END = float(argv[2])
EL_DEG = float(argv[3])
N = int(argv[4])
SENTIDO = int(argv[5])

for img in bpy.data.images:
    if img.source == 'FILE':
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

mundo = bpy.data.worlds.new('mundo_spin')
if mundo.node_tree is None:
    mundo.use_nodes = True
mundo.node_tree.nodes['Background'].inputs['Color'].default_value = (0.9, 0.89, 0.87, 1)
mundo.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.25
bpy.context.scene.world = mundo

esc = tam / 0.42
azf = math.radians(AZ_END)

def area(nome, loc, tam_l, forca, cor):
    d = bpy.data.lights.new(nome, 'AREA')
    d.shape, d.energy, d.color = 'RECTANGLE', forca, cor
    d.size, d.size_y = tam_l
    o = bpy.data.objects.new(nome, d)
    o.location = loc
    o.rotation_euler = (centro - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.collection.objects.link(o)
    return o

def pos(dx, dy, dz):
    cx = math.cos(azf); sx = math.sin(azf)
    return centro + Vector((dx * cx + dy * sx, dx * sx - dy * cx, dz))
area('key',  pos(0.30 * esc, -0.36 * esc, 0.38 * esc), (0.36 * esc, 0.48 * esc), 3.5 * esc * esc, (1.0, 0.99, 0.97))
area('rim',  pos(-0.36 * esc, 0.30 * esc, 0.20 * esc), (0.28 * esc, 0.40 * esc), 1.8 * esc * esc, (0.95, 0.95, 1.0))
area('fill', pos(0.24 * esc, -0.44 * esc, -0.05 * esc), (0.48 * esc, 0.48 * esc), 0.6 * esc * esc, (0.86, 0.90, 1.0))

cam_d = bpy.data.cameras.new('cam_spin')
cam_d.sensor_fit, cam_d.sensor_height = 'VERTICAL', 36.0
cam_d.lens = 18.0 / math.tan(math.radians(15.0))
cam = bpy.data.objects.new('cam_spin', cam_d)
bpy.context.scene.collection.objects.link(cam)
bpy.context.scene.camera = cam

sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.samples = 48
sc.cycles.use_denoising = True
sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 1600, 2400
sc.render.film_transparent = True
sc.view_settings.view_transform = 'Standard'
sc.view_settings.look = 'None'
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'

os.makedirs(PASTA, exist_ok=True)
dist = tam * 1.9
el = math.radians(EL_DEG)

for f in range(N):
    frac = (f + 1) / N  # termina EXATO no az_end
    az = math.radians(AZ_END - SENTIDO * 360.0 * (1.0 - frac))
    p = centro + Vector((dist * math.cos(el) * math.sin(az),
                         -dist * math.cos(el) * math.cos(az),
                         dist * math.sin(el)))
    cam.location = p
    cam.rotation_euler = (centro - p).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(PASTA, 'spin_%04d.png' % f)
    bpy.ops.render.render(write_still=True)
    print('[spin]', f + 1, '/', N)
print('[spin] concluido ->', PASTA)
