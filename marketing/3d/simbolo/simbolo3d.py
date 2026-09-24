# Vinheta "O Check" — símbolo 3D da Legalizai em Blender + Cycles.
#
# O símbolo (quadrado arredondado coral, proporção exata do simbolo.svg:
# raio 32.84/211.09) cai como um carimbo, assenta com squash discreto, o check
# se desenha na face (sequência de texturas gerada por check-frames.mjs) e o
# conjunto desliza pro lockup enquanto a câmera faz dolly-in — a MESMA s(t) que
# a base HTML aplica como scale, pra wordmark casar pixel a pixel.
#
# Timing: TUDO vem de ../timing.json (fonte única com o HTML). Nada de grade
# própria aqui.
#
# Uso (o `--` separa os args do Blender dos nossos):
#   blender --background --python simbolo3d.py -- --aspect 16x9 --fps 30 \
#       --samples 64 --res 1280 720 --anim 0 139          (piloto)
#   blender --background --python simbolo3d.py -- --aspect 16x9 --fps 60 \
#       --samples 128 --anim 0 278                        (master 4K)
#
# Saída: out-<aspecto>/simbolo_####.png (RGBA + sombra do catcher no alpha)

import bpy, bmesh, math, sys, os, json, argparse
from mathutils import Vector

AQUI = os.path.dirname(os.path.abspath(__file__))
VIN = os.path.dirname(AQUI)
TEXCHECK = os.path.join(AQUI, 'tex-check')

with open(os.path.join(VIN, 'timing.json'), encoding='utf8') as f:
    T = json.load(f)

BEAT = 60000.0 / T['bpm']
DUR = BEAT * T['beats']
EV = T['events']
# #F2643C — em LINEAR, não sRGB: os sockets de cor do Principled esperam
# linear. Passar (0.949, 0.392, 0.235) direto renderiza salmão lavado
# (~249,168,135) — foi o bug da primeira calibração. Com o albedo linear e
# iluminação unitária, o round-trip devolve exatamente R242 G100 B60.
CORAL = (0.888, 0.127, 0.045)


def ms(b):
    return BEAT * b


def arg_parse():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument('--aspect', choices=['16x9', '9x16'], default='16x9')
    p.add_argument('--fps', type=int, default=30)
    p.add_argument('--samples', type=int, default=128)
    p.add_argument('--res', nargs=2, type=int, default=None)
    p.add_argument('--frame', type=int, default=None)
    p.add_argument('--anim', nargs=2, type=int, metavar=('INI', 'FIM'))
    p.add_argument('--only-blend', action='store_true')
    # calibração de luz: o coral com view transform Standard estoura fácil —
    # ajustar em frame único medindo o pixel antes de rodar o lote
    p.add_argument('--watts', nargs=3, type=float, default=[31.0, 11.0, 3.0],
                   metavar=('KEY', 'RIM', 'FILL'))
    return p.parse_args(argv)


# --------------------------------------------------------------- easings
def clamp(v, a=0.0, b=1.0):
    return min(b, max(a, v))


def norm(t, a, b):
    return clamp((t - a) / (b - a))


def out_expo(x):
    x = clamp(x)
    return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)


def in_cubic(x):
    return clamp(x) ** 3


def lerp_pontos(u, pontos):
    """Interpolação linear por uma lista [(t_ms, valor), ...] ordenada."""
    if u <= pontos[0][0]:
        return pontos[0][1]
    for (t0, v0), (t1, v1) in zip(pontos, pontos[1:]):
        if u <= t1:
            return v0 + (v1 - v0) * (u - t0) / (t1 - t0)
    return pontos[-1][1]


# ---------------------------------------------------- dolly compartilhado
def s_dolly(t):
    """MESMA fórmula do vinheta-base.html — mudou lá, muda aqui via timing.json.
    Janela FIXA até endBeat: esticar o fecho não muda a curva nem invalida
    frames 3D já renderizados."""
    td = BEAT * T['dolly']['endBeat']
    return 1 + T['dolly']['amp'] * (0.5 - 0.5 * math.cos(math.pi * clamp(t / td)))


# ------------------------------------------------------------------ material
# (padrões versão-prova copiados de marketing/blender/phones.py)
def set_in(node, nome, valor):
    if nome in node.inputs:
        node.inputs[nome].default_value = valor
        return True
    return False


def principled(nt, cor, rough, coat=0.0, coat_rough=0.1, emis=None, emis_f=0.0,
               spec=0.2):
    """spec baixo de propósito: as softboxes grandes refletem BRANCO na face e
    poluem G/B — medido no frame de calibração, metade do sinal era especular
    e o coral lia pêssego dessaturado. Difuso carrega a cor; espec só tempera."""
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    set_in(b, 'Base Color', (*cor, 1.0))
    set_in(b, 'Metallic', 0.0)
    set_in(b, 'Roughness', rough)
    set_in(b, 'IOR', 1.45)
    if not set_in(b, 'Specular IOR Level', spec):
        set_in(b, 'Specular', spec)
    if not set_in(b, 'Coat Weight', coat):
        set_in(b, 'Clearcoat', coat)
    if not set_in(b, 'Coat Roughness', coat_rough):
        set_in(b, 'Clearcoat Roughness', coat_rough)
    if emis:
        set_in(b, 'Emission Color', (*emis, 1.0))
        set_in(b, 'Emission Strength', emis_f)
    return b


def mat_corpo():
    """Corpo mantém um resto de coat (0.3) — vira o brilho de aresta no bevel,
    área pequena que não desloca a cor lida da face."""
    m = bpy.data.materials.new('coral_corpo')
    if m.node_tree is None:
        m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    set_in(bsdf, 'Base Color', (*CORAL, 1.0))
    set_in(bsdf, 'Metallic', 0.0)
    set_in(bsdf, 'Roughness', 0.34)
    set_in(bsdf, 'IOR', 1.45)
    if not set_in(bsdf, 'Specular IOR Level', 0.3):
        set_in(bsdf, 'Specular', 0.3)
    if not set_in(bsdf, 'Coat Weight', 0.3):
        set_in(bsdf, 'Clearcoat', 0.3)
    if not set_in(bsdf, 'Coat Roughness', 0.12):
        set_in(bsdf, 'Clearcoat Roughness', 0.12)
    return m


def mat_face(total_frames):
    """Coral satin com o check branco entrando pelo alpha da sequência de
    texturas (check-frames.mjs). Image Sequence com auto refresh — e laço de
    render com frame_set, que força a troca da textura frame a frame."""
    m = bpy.data.materials.new('coral_face')
    if m.node_tree is None:
        m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (420, 0)

    primeiro = os.path.join(TEXCHECK, 'check_0001.png')
    if not os.path.exists(primeiro):
        raise RuntimeError(f'sequência do check ausente: {primeiro} — rode check-frames.mjs antes')
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(primeiro)
    tex.image.source = 'SEQUENCE'
    tex.image.colorspace_settings.name = 'sRGB'
    tex.extension = 'EXTEND'
    tex.location = (-620, 0)
    iu = tex.image_user
    iu.frame_duration = total_frames
    iu.frame_start = 0          # frame 0 da cena mostra check_0001
    iu.frame_offset = 0
    iu.use_auto_refresh = True

    coral = principled(nt, CORAL, 0.42, coat=0.06, coat_rough=0.25)
    coral.location = (-300, 160)
    branco = principled(nt, (0.83, 0.83, 0.83), 0.38,
                        emis=(1.0, 1.0, 1.0), emis_f=0.20)
    branco.location = (-300, -160)

    mix = nt.nodes.new('ShaderNodeMixShader')
    mix.location = (120, 0)
    nt.links.new(tex.outputs['Alpha'], mix.inputs['Fac'])
    nt.links.new(coral.outputs['BSDF'], mix.inputs[1])
    nt.links.new(branco.outputs['BSDF'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    return m


# ------------------------------------------------------------------ geometria
# (pts_rrect / obj_de_bmesh / suavizar / slab_rrect / plano_rrect: phones.py)
def pts_rrect(w, h, r, seg=12):
    cx, cy = w / 2 - r, h / 2 - r
    pts = []
    for ox, oy, a0 in ((cx, cy, 0), (-cx, cy, 90), (-cx, -cy, 180), (cx, -cy, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((ox + r * math.cos(a), oy + r * math.sin(a)))
    return pts


def obj_de_bmesh(bm, nome, mat):
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nome, me)
    ob.data.materials.append(mat)
    bpy.context.collection.objects.link(ob)
    return ob


def suavizar(ob, angulo=32.0):
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(angulo))
    except (AttributeError, TypeError, RuntimeError):
        bpy.ops.object.shade_smooth()


def slab_rrect(nome, w, h, d, r, mat, seg=16, bevel=0.004, bevel_seg=8):
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, -d / 2)) for x, y in pts_rrect(w, h, r, seg)]
    face = bm.faces.new(vs)
    ret = bmesh.ops.extrude_face_region(bm, geom=[face])
    topo = [e for e in ret['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=topo, vec=(0, 0, d))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = obj_de_bmesh(bm, nome, mat)
    if bevel > 0:
        b = ob.modifiers.new('rim', 'BEVEL')
        b.width, b.segments = bevel, bevel_seg
        b.limit_method, b.angle_limit = 'ANGLE', math.radians(40)
        b.harden_normals = True
    suavizar(ob)
    return ob


def plano_rrect(nome, w, h, r, mat, seg=16):
    bm = bmesh.new()
    pts = pts_rrect(w, h, r, seg)
    vs = [bm.verts.new((x, y, 0)) for x, y in pts]
    bm.faces.new(vs)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    uv = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        for l in f.loops:
            co = l.vert.co
            l[uv].uv = ((co.x + w / 2) / w, (co.y + h / 2) / h)
    return obj_de_bmesh(bm, nome, mat)


def monta_simbolo(total_frames):
    """Empty raiz com o slab coral + face texturizada. O slab nasce no plano XY
    (profundidade em Z); a raiz gira +90° em X, então a face (local +Z) aponta
    pra câmera (-Y do mundo) e o local +Y vira o 'pra cima' do mundo."""
    S = T['symbol']
    raiz = bpy.data.objects.new('simbolo', None)
    raiz.empty_display_size = 0.1
    bpy.context.collection.objects.link(raiz)
    raiz.rotation_euler = (math.radians(90), 0, 0)

    corpo = slab_rrect('simbolo_corpo', S['sizeM'], S['sizeM'], S['depthM'],
                       S['cornerRM'], mat_corpo(), seg=16, bevel=S['bevelM'], bevel_seg=8)
    inset = 2 * S['bevelM']
    face = plano_rrect('simbolo_face', S['sizeM'] - inset, S['sizeM'] - inset,
                       S['cornerRM'] - S['bevelM'], mat_face(total_frames), seg=16)
    face.location = (0, 0, S['depthM'] / 2 + 0.0002)
    for o in (corpo, face):
        o.parent = raiz
    return raiz


def chao():
    """Shadow catcher: a sombra de contato viaja no alpha do PNG e compõe
    sobre o fundo HTML — é o que vende o peso do carimbo.

    O material é ESCURO de propósito: com o default branco, o chão rebatia a
    key na face e somava ~100/255 de branco em G/B — o coral lia salmão
    (medido na calibração). O estúdio da composição é ink-900 mesmo; catcher
    escuro pega a mesma sombra sem devolver luz."""
    bm = bmesh.new()
    v = [bm.verts.new(p) for p in ((-6, -6, 0), (6, -6, 0), (6, 6, 0), (-6, 6, 0))]
    bm.faces.new(v)
    m = bpy.data.materials.new('chao')
    if m.node_tree is None:
        m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    set_in(bsdf, 'Base Color', (0.045, 0.050, 0.060, 1.0))
    set_in(bsdf, 'Roughness', 0.9)
    if not set_in(bsdf, 'Specular IOR Level', 0.1):
        set_in(bsdf, 'Specular', 0.1)
    ob = obj_de_bmesh(bm, 'chao', m)
    ob.is_shadow_catcher = True
    return ob


# --------------------------------------------------------------------- cena
def limpa():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for bloco in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for it in list(bloco):
            bloco.remove(it)


def luzes(watts):
    """Área grande + potência baixa (lição do phones.py: luz forte estoura e o
    material vira plástico). Primeiro chute de 40/22/6 W LAVOU o coral em
    pêssego — com view transform Standard o realce estoura cedo. Calibrar
    sempre em frame único (--frame + --watts) medindo o pixel da face contra
    #F2643C antes de rodar o lote."""
    alvo = Vector((0, 0, T['symbol']['restZM']))

    def area(nome, loc, tam, forca, cor):
        d = bpy.data.lights.new(nome, 'AREA')
        d.shape, d.energy, d.color = 'RECTANGLE', forca, cor
        d.size, d.size_y = tam
        o = bpy.data.objects.new(nome, d)
        o.location = loc
        o.rotation_euler = (alvo - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        bpy.context.collection.objects.link(o)
        return o

    area('key',  (0.75, -0.90, 0.95), (0.9, 1.2), watts[0], (1.0, 0.99, 0.97))
    area('rim',  (-0.90, 0.70, 0.50), (0.7, 1.0), watts[1], (1.0, 0.72, 0.58))
    area('fill', (0.60, -1.10, -0.02), (1.2, 1.2), watts[2], (0.86, 0.90, 1.0))

    mundo = bpy.data.worlds.new('mundo')
    if mundo.node_tree is None:
        mundo.use_nodes = True
    mundo.node_tree.nodes['Background'].inputs['Color'].default_value = (0.010, 0.011, 0.013, 1)
    mundo.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
    bpy.context.scene.world = mundo


def camera():
    d = bpy.data.cameras.new('cam')
    # FOV vertical 30° — mesma câmera do phones.py; sem DOF (assunto frontal).
    d.sensor_fit, d.sensor_height = 'VERTICAL', 36.0
    d.lens = 18.0 / math.tan(math.radians(15.0))
    d.dof.use_dof = False
    o = bpy.data.objects.new('cam', d)
    o.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.collection.objects.link(o)
    bpy.context.scene.camera = o
    return o


def anima(raiz, cam, aspect, fps, total):
    """Keyframe por frame, tudo derivado de funções de t — determinístico e
    idêntico em qualquer fps. Interpolação linear (com key em todo frame o
    Bezier não acrescenta nada e o motion blur interpola no subframe)."""
    S, L, SH = T['symbol'], T['layout'][aspect], T['shake']
    dist = T['camera']['dist'][aspect]
    t_imp = ms(EV['impacto'])

    # squash & recover do assentamento (ms depois do impacto)
    P_SZ = [(0, 1.0), (25, 0.985), (70, 1.004), (140, 1.0)]
    P_SXY = [(0, 1.0), (25, 1.008), (70, 0.998), (140, 1.0)]

    for f in range(total):
        t = f / fps * 1000.0

        # ---- símbolo: queda com gravidade -> assenta -> desliza pro lockup
        p_drop = in_cubic(norm(t, ms(EV['entrada']), t_imp))
        z = S['dropZM'] - (S['dropZM'] - S['restZM']) * p_drop
        g = out_expo(norm(t, ms(EV['glideIni']), ms(EV['glideFim'])))
        x = L['symXLockM'] * g
        z = z + (L['symZLockM'] - S['restZM']) * g
        esc = 1 + (L['scaleLock'] - 1) * g
        u = t - t_imp
        sz = lerp_pontos(u, P_SZ) if u >= 0 else 1.0
        sxy = lerp_pontos(u, P_SXY) if u >= 0 else 1.0

        # SAÍDA: depois das letras, o símbolo despenca pra fora do quadro
        # (gravidade inCubic + tombamento leve pra frente) — o filme começa
        # na tela limpa que sobra.
        pf = in_cubic(norm(t, ms(EV['symFallIni']),
                           ms(EV['symFallIni']) + T['fall']['simboloDurMs']))
        # squash escala pela origem (centro): multiplicar z por sz mantém a
        # BASE plantada no chão durante a compressão — sem isso o símbolo
        # flutua ~3mm por um instante e a sombra de contato descola.
        raiz.location = (x, 0, z * sz - pf * 1.05)
        raiz.rotation_euler = (math.radians(90 + 16 * pf), 0, 0)
        # local Y da raiz é o vertical do mundo (raiz girada 90° em X)
        raiz.scale = (sxy * esc, sz * esc, sxy * esc)
        raiz.keyframe_insert('location', frame=f)
        raiz.keyframe_insert('rotation_euler', frame=f)
        raiz.keyframe_insert('scale', frame=f)

        # ---- câmera: dolly compartilhado + shake decaindo no impacto
        s = s_dolly(t)
        shk = zshk = 0.0
        if u > 0:
            dec = math.exp(-(u / 1000.0) / SH['tauS'])
            fase = 2 * math.pi * SH['freqHz'] * u / 1000.0
            shk = SH['ampM'] * math.sin(fase) * dec
            zshk = 0.6 * SH['ampM'] * math.cos(fase + 0.9) * dec
        cam.location = (shk, -dist / s, S['restZM'] + zshk)
        cam.keyframe_insert('location', frame=f)

    for ob in (raiz, cam):
        ad = ob.animation_data
        if ad and ad.action and hasattr(ad.action, 'fcurves'):
            for fc in ad.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'LINEAR'


def render_cfg(samples, res, fps):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.seed = 0                      # determinismo bit a bit
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.fps = fps
    sc.render.film_transparent = True
    sc.render.use_motion_blur = True        # a queda estroboscoparia sem
    sc.render.motion_blur_shutter = 0.5
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    # compressão alta: RGBA 4K quase todo transparente encolhe ~3x (o render é
    # GPU-bound, o custo de CPU do zlib não aparece); disco é o recurso raro
    sc.render.image_settings.compression = 60
    # Standard, não AgX — regra do vault (blender/README.md): AgX dessatura e o
    # coral #F2643C 'lava'. O preço é highlight que estoura fácil; por isso as
    # luzes acima são fracas.
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'

    prefs = bpy.context.preferences.addons.get('cycles')
    usou_gpu = False
    if prefs:
        cp = prefs.preferences
        for tipo in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI', 'METAL'):
            try:
                cp.compute_device_type = tipo
            except TypeError:
                continue
            cp.get_devices()
            devs = [d for d in cp.devices if d.type == tipo]
            if devs:
                for d in cp.devices:
                    d.use = (d.type == tipo)
                sc.cycles.device = 'GPU'
                usou_gpu = True
                print(f'[vinheta] GPU: {tipo} — {", ".join(d.name for d in devs)}')
                break
    if not usou_gpu:
        sc.cycles.device = 'CPU'
        print('[vinheta] sem GPU compatível — render em CPU')


def main():
    a = arg_parse()
    total = round(DUR / 1000.0 * a.fps)
    res = a.res or ([3840, 2160] if a.aspect == '16x9' else [2160, 3840])
    out_dir = os.path.join(AQUI, f'out-{a.aspect}')

    # fail-loud: a sequência do check tem que ter sido gerada NO MESMO fps
    n_check = len([f for f in os.listdir(TEXCHECK)]) if os.path.isdir(TEXCHECK) else 0
    if n_check < total:
        raise RuntimeError(
            f'tex-check tem {n_check} frames, preciso de {total} '
            f'(fps={a.fps}) — rode: node check-frames.mjs {a.fps}')

    limpa()
    raiz = monta_simbolo(total)
    chao()
    luzes(a.watts)
    cam = camera()
    anima(raiz, cam, a.aspect, a.fps, total)

    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 0, total - 1
    render_cfg(a.samples, res, a.fps)

    os.makedirs(out_dir, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(AQUI, f'simbolo-{a.aspect}.blend'))
    if a.only_blend:
        print('[vinheta] só .blend, sem render')
        return

    # Laço com frame_set + write_still, NÃO render(animation=True) — lição
    # comprovada do phones.py: a textura em sequência (auto refresh) e qualquer
    # avaliação dependente de frame atualizam de forma confiável no frame_set.
    if a.anim:
        quadros = range(a.anim[0], min(a.anim[1], total - 1) + 1)
    elif a.frame is not None:
        quadros = [a.frame]
    else:
        quadros = range(total)
    for i, f in enumerate(quadros):
        sc.frame_set(f)
        sc.render.filepath = os.path.join(out_dir, f'simbolo_{f:04d}.png')
        bpy.ops.render.render(write_still=True)
        if i % 20 == 0:
            print(f'[vinheta] frame {f} ({i + 1}/{len(quadros)})')
    print('[vinheta] pronto ->', out_dir)


main()
