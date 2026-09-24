# Prepara o Modelo B (iPhone 17 Pro Max do Blendkit) pro filme:
#  - titânio/painéis escurecidos pro tom da referência (Envato phone-mockup)
#  - display reconstruído: textura sRGB -> emissão 1.12 (compensa o vidro;
#    matiz medida exata, receita do vault)
#  - de pé, centrado na origem, salvo como cena-base + still de verificação
#
#   blender --background <assetB.blend> --python prepara-b.py -- <tela.png> <out_dir>
import bpy, math, sys
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
TELA = argv[0]
OUT = argv[1]

# ---- escurecer: qualquer Principled claro que não seja lente/vidro/tela
ESCUROS = {
    '17ProMax_color':  (0.055, 0.060, 0.070),   # moldura de titânio
    '17ProMax_color2': (0.055, 0.060, 0.070),
    '17ProMax_color3': (0.045, 0.048, 0.056),
    '17ProMax_21':     (0.070, 0.074, 0.084),   # painel do módulo de câmera
    '17ProMax_22':     (0.060, 0.064, 0.074),
    '17ProMax_G':      (0.050, 0.053, 0.062),
    '17ProMax_2222':   (0.048, 0.051, 0.060),   # vidro traseiro (mantém normal/rough maps)
    '17ProMax_Logo':   (0.120, 0.126, 0.140),   # maçã levemente mais clara que o fundo
}
for m in bpy.data.materials:
    if m.name in ESCUROS and m.node_tree:
        b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if b:
            b.inputs['Base Color'].default_value = (*ESCUROS[m.name], 1.0)
            print('[prep] escurecido:', m.name)

# ---- display: emissão pura calibrada (1.12 compensa a absorção do vidro)
for m in bpy.data.materials:
    if m.node_tree and 'screen' in m.name.lower():
        nt = m.node_tree
        nt.nodes.clear()
        out = nt.nodes.new('ShaderNodeOutputMaterial')
        tex = nt.nodes.new('ShaderNodeTexImage')
        tex.image = bpy.data.images.load(TELA)
        tex.image.colorspace_settings.name = 'sRGB'
        tex.extension = 'EXTEND'
        emis = nt.nodes.new('ShaderNodeEmission')
        emis.inputs['Strength'].default_value = 1.12
        nt.links.new(tex.outputs['Color'], emis.inputs['Color'])
        nt.links.new(emis.outputs['Emission'], out.inputs['Surface'])
        print('[prep] display calibrado em', m.name)

# ---- de pé e centrado na origem (base no chão z=0)
def bbox():
    mins = Vector((1e9,) * 3); maxs = Vector((-1e9,) * 3)
    for o in bpy.data.objects:
        if o.type != 'MESH':
            continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            mins = Vector(map(min, mins, w)); maxs = Vector(map(max, maxs, w))
    return mins, maxs

mins, maxs = bbox()
ext = maxs - mins
if ext.z < ext.x and ext.z < ext.y:
    piv = (mins + maxs) / 2
    rot = Matrix.Rotation(math.radians(90), 4, 'X')
    for o in bpy.data.objects:
        if o.parent is None and o.type in {'MESH', 'EMPTY'}:
            o.matrix_world = Matrix.Translation(piv) @ rot @ Matrix.Translation(-piv) @ o.matrix_world
    bpy.context.view_layer.update()
    mins, maxs = bbox()
centro = (mins + maxs) / 2
# frente do aparelho (display) deve olhar pra -Y (câmera do rig fica em -Y):
# no modelo B a frente fica a +Y depois de levantar — gira 180° em Z
piv = centro.copy()
rotz = Matrix.Rotation(math.radians(180), 4, 'Z')
for o in bpy.data.objects:
    if o.parent is None and o.type in {'MESH', 'EMPTY'}:
        o.matrix_world = Matrix.Translation(piv) @ rotz @ Matrix.Translation(-piv) @ o.matrix_world
bpy.context.view_layer.update()
mins, maxs = bbox()
desloc = Vector((-(mins.x + maxs.x) / 2, -(mins.y + maxs.y) / 2, -mins.z))
for o in bpy.data.objects:
    if o.parent is None and o.type in {'MESH', 'EMPTY'}:
        o.matrix_world = Matrix.Translation(desloc) @ o.matrix_world
bpy.context.view_layer.update()
print('[prep] aparelho de pé, frente pra -Y, base em z=0')

import os
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'iphone-b-preparado.blend'))
print('[prep] salvo:', os.path.join(OUT, 'iphone-b-preparado.blend'))
