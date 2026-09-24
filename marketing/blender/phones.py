# Recria os dois aparelhos do fecho (ato 4) em Blender + Cycles.
#
# Substitui o WebGL de s4scene.js por render físico: vidro real na lente,
# coat na carcaça, sombra e reflexo corretos. As telas usam as MESMAS texturas
# do 3D em tempo real — geradas por pipeline/screens.mjs a partir de
# screens-draw.js — então o fecho não briga com o resto do vídeo.
#
# Uso (o `--` separa os args do Blender dos nossos):
#   blender --background --python phones.py -- --frame 0
#   blender --background --python phones.py -- --anim 0 139 --samples 256
#   blender --background --python phones.py -- --only-blend      (só salva o .blend)
#
# Saída: out/fecho_####.png (RGBA, fundo transparente) e phones.blend

import bpy, bmesh, math, sys, os, argparse
from mathutils import Vector

AQUI = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(AQUI, 'tex')
OUT = os.path.join(AQUI, 'out')

# ---------------------------------------------------------------- parâmetros
# Proporção real do aparelho (iPhone 15 Pro, em metros). A cena Three.js usa
# 0.74 x 1.54 x 0.082 — a mesma razão, só que sem escala física. Aqui vale a
# escala real: Cycles resolve luz e profundidade de campo em unidades reais.
P_W, P_H, P_D = 0.0706, 0.1466, 0.00825
P_R = 0.0100                 # raio do canto do corpo
BORDA = 0.0032               # moldura entre a borda e a área de tela
LOOP_S = 13.0                # mesmo loop de órbita do s4scene.js
FPS = 30

CORAL = (0.949, 0.392, 0.235)   # #F2643C

# Pose portada de s4scene.js, pra manter o enquadramento que já foi aprovado.
# Three.js é Y-up com o corpo medindo 1.54 de altura; aqui é Z-up em metros.
#   escala:  ESC = P_H / 1.54
#   eixos:   blender(x, y, z) = three(x, -z, y)
# A câmera fica em -Y olhando pra +Y, então three +Z (na direção do observador)
# vira blender -Y. Daí o 'tela' (three z=+0.30, mais perto) ficar em y negativo
# e o 'costas' (three z=-0.42, mais longe) em y positivo.
ESC = P_H / 1.54


def de_three(x, y, z):
    return (x * ESC, -z * ESC, y * ESC)


POSE = {
    # rotação: three (rx, ry, rz) -> blender (90°+rx, -rz, ry). O +90° em X põe a
    # tela de frente pra câmera; o ry=158° do original é o que vira o aparelho
    # da esquerda de costas.
    'costas': dict(loc=de_three(-0.56, 0.42, -0.42), rot=(92.9, -21.8, 158.2)),
    'tela':   dict(loc=de_three(0.26, 0.46, 0.30),  rot=(91.7, 6.9, -9.2)),
}


def arg_parse():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument('--frame', type=int, default=0)
    p.add_argument('--anim', nargs=2, type=int, metavar=('INI', 'FIM'))
    p.add_argument('--samples', type=int, default=192)
    p.add_argument('--res', nargs=2, type=int, default=[1080, 1920])
    p.add_argument('--only-blend', action='store_true')
    return p.parse_args(argv)


# ------------------------------------------------------------------ material
def set_in(node, nome, valor):
    """Escreve num socket só se ele existir — os nomes do Principled mudam
    entre versões e um KeyError aqui derrubaria o build inteiro."""
    if nome in node.inputs:
        node.inputs[nome].default_value = valor
        return True
    return False


def mat_pbr(nome, cor, metallic=0.0, roughness=0.5, coat=0.0, coat_rough=0.1,
            emission=None, emission_forca=0.0, ior=1.45):
    m = bpy.data.materials.new(nome)
    if m.node_tree is None:      # na 5.x já vem com nós; use_nodes sai na 6.0
        m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    set_in(bsdf, 'Base Color', (*cor, 1.0))
    set_in(bsdf, 'Metallic', metallic)
    set_in(bsdf, 'Roughness', roughness)
    set_in(bsdf, 'IOR', ior)
    # Blender 4.x/5.x: "Coat Weight". Versões antigas: "Clearcoat".
    if not set_in(bsdf, 'Coat Weight', coat):
        set_in(bsdf, 'Clearcoat', coat)
    if not set_in(bsdf, 'Coat Roughness', coat_rough):
        set_in(bsdf, 'Clearcoat Roughness', coat_rough)
    if emission:
        set_in(bsdf, 'Emission Color', (*emission, 1.0))
        set_in(bsdf, 'Emission Strength', emission_forca)
    return m


def _tex_tela(nt, png, forca):
    """Nó de imagem + emissão. Tela de celular emite luz, não reflete — é o que
    faz ela 'acender' no render. Força 1.0 entrega a textura na cor exata em que
    foi desenhada (com view transform Standard); acima disso o coral desbota."""
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(png)
    tex.image.colorspace_settings.name = 'sRGB'
    tex.extension = 'EXTEND'
    tex.location = (-620, 0)
    emis = nt.nodes.new('ShaderNodeEmission')
    emis.inputs['Strength'].default_value = forca
    emis.location = (-320, 60)
    nt.links.new(tex.outputs['Color'], emis.inputs['Color'])
    return tex, emis


def _recorta_alpha(nt, tex, shader, out):
    """Usa o alpha da própria textura pra vazar os cantos arredondados — o
    canvas já desenha com roundClip, então não precisa de máscara extra."""
    transp = nt.nodes.new('ShaderNodeBsdfTransparent')
    mix = nt.nodes.new('ShaderNodeMixShader')
    transp.location, mix.location = (-320, -220), (120, 0)
    nt.links.new(tex.outputs['Alpha'], mix.inputs['Fac'])
    nt.links.new(transp.outputs['BSDF'], mix.inputs[1])
    nt.links.new(shader, mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])


def _novo_mat(nome):
    m = bpy.data.materials.new(nome)
    if m.node_tree is None:
        m.use_nodes = True
    m.node_tree.nodes.clear()
    out = m.node_tree.nodes.new('ShaderNodeOutputMaterial')
    out.location = (360, 0)
    return m, m.node_tree, out


def mat_tela(nome, png, forca=1.0):
    """Tela normal: a que fica embaixo e é revelada quando a fita sai."""
    m, nt, out = _novo_mat(nome)
    tex, emis = _tex_tela(nt, png, forca)
    _recorta_alpha(nt, tex, emis.outputs['Emission'], out)
    return m


def mat_fita(nome, png, forca=1.0):
    """A camada que descola. Frente é a lock screen acesa; verso é o lado
    'colante', cinza fosco. Sem tratar o verso, ao enrolar a fita mostraria a
    própria tela espelhada e o efeito perderia a leitura de fita sendo puxada."""
    m, nt, out = _novo_mat(nome)
    tex, emis = _tex_tela(nt, png, forca)

    verso = nt.nodes.new('ShaderNodeBsdfDiffuse')
    verso.inputs['Color'].default_value = (0.15, 0.16, 0.18, 1.0)
    verso.inputs['Roughness'].default_value = 0.85
    verso.location = (-320, -80)

    geo = nt.nodes.new('ShaderNodeNewGeometry')
    geo.location = (-620, -300)
    lados = nt.nodes.new('ShaderNodeMixShader')
    lados.location = (-100, 0)
    nt.links.new(geo.outputs['Backfacing'], lados.inputs['Fac'])
    nt.links.new(emis.outputs['Emission'], lados.inputs[1])
    nt.links.new(verso.outputs['BSDF'], lados.inputs[2])

    _recorta_alpha(nt, tex, lados.outputs['Shader'], out)
    return m


# Rolo em espiral de Arquimedes: o raio cresce conforme recebe fita, como
# acontece de verdade. R_NUCLEO é onde a ponta começa a enrolar e ESP_FITA é o
# quanto o rolo engorda por volta — com estes valores ele termina com ~7,8 mm,
# umas 4,7 voltas.
R_NUCLEO = 0.0016
ESP_FITA = 0.0013
INCLINA = 0.28          # rad — frente de descolamento na diagonal, não reta


def instala_peel(fita, ini_ms=2350, dur_ms=1500):
    """Descola a lock screen feito fita, revelando a tela do app por baixo.

    Por que não é Simple Deform: testei os três eixos e ele não tira um plano
    chato do próprio plano (z fica zerado em X e Y; no Z ele entorta a malha
    dentro do plano). Então a curvatura é calculada aqui, vértice a vértice, e
    aplicada num handler de frame — o Blender chama isso a cada frame, tanto no
    render de animação quanto no frame_set de um frame só.

    A frente do descolamento é uma reta (inclinada em INCLINA, porque fita
    ninguém puxa reto) que varre a tela. O que está atrás continua colado e
    plano; o que já passou enrola no rolo.

    O rolo é uma espiral de Arquimedes de raio crescente, não um cilindro fixo.
    Isso importa: com raio fixo era preciso limitar o ângulo, e o rolo saturava
    depois de ~30% da tela — daí em diante todos os vértices caíam no mesmo
    ponto e ele parecia congelado no meio da animação. Com a espiral, cada volta
    engrossa o rolo em ESP_FITA e ele cresce até o fim, como fita de verdade.

    A conta: conservando a área da seção, raio externo
        R = raiz(R_NUCLEO² + L·ESP/pi)      para L de fita já solta.
    Com b = ESP/2pi, o comprimento de arco até o ângulo th vale R·th − b·th²/2;
    invertendo, th = (R − raiz(R² − 2·b·d)) para d de arco a partir da frente.
    A fita na frente é a camada de FORA (foi a última a enrolar) e o miolo é a
    ponta que soltou primeiro — por isso o raio decresce com th.
    """
    me = fita.data
    for p in me.polygons:
        p.use_smooth = True
    base = [v.co.copy() for v in me.vertices]

    ca, sa = math.cos(INCLINA), math.sin(INCLINA)
    yr = [(-c.x * sa + c.y * ca) for c in base]
    yr_min, yr_max = min(yr), max(yr)
    # sobra no fim pra frente sair de vez da tela em vez de parar na borda
    margem = (yr_max - yr_min) * 0.10

    f0 = round(ini_ms / 1000 * FPS)
    f1 = round((ini_ms + dur_ms) / 1000 * FPS)

    # *_ porque render_pre entrega (scene, depsgraph) e frame_change_pre só (scene)
    def deforma(cena, *_):
        f = cena.frame_current
        if f <= f0:
            p = 0.0
        elif f >= f1:
            p = 1.0
        else:
            p = (f - f0) / (f1 - f0)
            p = p * p * (3 - 2 * p)   # custa a soltar, acelera, desacelera

        # De baixo pra cima, e não o contrário: puxando pra baixo o rolinho
        # termina na borda inferior do aparelho, que é exatamente onde começa o
        # bloco de texto do ato — e a fita passaria por cima de "Contador de
        # verdade". Subindo, ela se afasta do texto e sai pelo topo.
        frente = yr_min + (yr_max - yr_min + margem) * p
        solto = max(0.0, frente - yr_min)                  # comprimento já enrolado
        r_out = math.sqrt(R_NUCLEO ** 2 + solto * ESP_FITA / math.pi)
        b = ESP_FITA / (2 * math.pi)

        for i, c in enumerate(base):
            xr = c.x * ca + c.y * sa
            d = frente - yr[i]
            if d <= 0:                       # ainda colado na tela
                me.vertices[i].co = c
                continue
            disc = r_out * r_out - 2 * b * d
            th = (r_out - math.sqrt(disc)) / b if disc > 0 else r_out / b
            r = max(R_NUCLEO * 0.55, r_out - b * th)       # piso: não colapsa no centro
            # centro do rolo fica a r_out acima da frente, tangente à tela
            yr2 = frente - r * math.sin(th)
            me.vertices[i].co = (
                xr * ca - yr2 * sa,
                xr * sa + yr2 * ca,
                r_out - r * math.cos(th),
            )
        me.update()

        if os.environ.get('PEEL_DEBUG'):
            dy = [v.co.y for v in me.vertices]
            dz = [v.co.z for v in me.vertices]
            planos = sum(1 for i in range(len(base)) if (frente - yr[i]) <= 0)
            baixo = sum(1 for v in me.vertices if v.co.y < -0.055)
            print(f'[peel] f={f} p={p:.3f} frente={frente:+.5f} r_out={r_out * 1000:.2f}mm '
                  f'planos={planos}/{len(base)} y_def=[{min(dy):+.4f},{max(dy):+.4f}] '
                  f'z_def=[{min(dz):+.4f},{max(dz):+.4f}] verts_ainda_embaixo={baixo}')

    bpy.app.handlers.frame_change_pre.append(deforma)
    bpy.app.handlers.render_pre.append(deforma)

    # depois de descolada a fita some, pra não ficar rolinho pairando na tela
    for f, v in ((f0 - 1, False), (f1 + 3, False), (f1 + 4, True)):
        fita.hide_render = v
        fita.keyframe_insert('hide_render', frame=f)
    fita.hide_render = False


# ------------------------------------------------------------------ geometria
def pts_rrect(w, h, r, seg=12):
    """Contorno de retângulo arredondado, sentido anti-horário."""
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
    """Sombreado suave só onde a curvatura é suave. Na 4.1 o `use_auto_smooth`
    saiu e virou o operador shade_auto_smooth — sem ele as faces planas do
    corpo sombreiam como se fossem curvas e o aparelho perde o corte reto."""
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(angulo))
    except (AttributeError, TypeError, RuntimeError):
        bpy.ops.object.shade_smooth()


def slab_rrect(nome, w, h, d, r, mat, seg=12, bevel=0.0012, bevel_seg=6):
    """Bloco de retângulo arredondado, com a aresta de topo/base filetada.
    O bevel usa limite por ÂNGULO: os segmentos do canto arredondado formam
    ângulos rasos e passam batido; só as arestas de 90° do perímetro pegam."""
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


def plano_rrect(nome, w, h, r, mat, seg=12):
    """Face plana arredondada, com UV projetada de cima (pra textura da tela)."""
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


def grade_plana(nome, w, h, nx, ny, mat):
    """Retângulo em grade fina, com UV projetada de cima.

    A fita precisa de MUITOS segmentos ao longo da altura: o Simple Deform curva
    interpolando vértice a vértice, e com poucos anéis o rolinho sai facetado,
    parecendo papel dobrado em vez de fita enrolando. Os cantos arredondados
    saem do alpha da textura, não da malha — por isso aqui é retângulo puro.
    """
    bm = bmesh.new()
    vs = [[bm.verts.new((-w / 2 + w * i / nx, -h / 2 + h * j / ny, 0))
           for j in range(ny + 1)] for i in range(nx + 1)]
    for i in range(nx):
        for j in range(ny):
            bm.faces.new((vs[i][j], vs[i + 1][j], vs[i + 1][j + 1], vs[i][j + 1]))
    uv = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        for l in f.loops:
            co = l.vert.co
            l[uv].uv = ((co.x + w / 2) / w, (co.y + h / 2) / h)
    return obj_de_bmesh(bm, nome, mat)


def modulo_camera(mats):
    """Módulo de câmera da traseira: base arredondada, 3 lentes (anel metálico,
    vidro, íris) e o flash."""
    peca = []
    lado = 0.0300
    base = slab_rrect('cam_base', lado, lado, 0.0034, 0.0130, mats['cam'], seg=10, bevel=0.0008)
    peca.append(base)

    for i, (lx, ly) in enumerate(((-0.0068, 0.0068), (-0.0068, -0.0068), (0.0068, 0.0))):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.0052, minor_radius=0.0011, major_segments=48, minor_segments=16,
            location=(lx, ly, 0.0020))
        anel = bpy.context.object
        anel.name = f'lente_anel_{i}'
        anel.data.materials.append(mats['anel'])
        peca.append(anel)

        bpy.ops.mesh.primitive_cylinder_add(radius=0.0044, depth=0.0016, vertices=64,
                                            location=(lx, ly, 0.0022))
        vidro = bpy.context.object
        vidro.name = f'lente_vidro_{i}'
        vidro.data.materials.append(mats['vidro'])
        peca.append(vidro)

        # íris afundada DENTRO do vidro — se ela passar do topo do anel, a lente
        # vira uma bolinha saltada em vez de uma câmera
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.0014, segments=32, ring_count=16,
                                             location=(lx, ly, 0.0012))
        iris = bpy.context.object
        iris.name = f'lente_iris_{i}'
        iris.data.materials.append(mats['iris'])
        peca.append(iris)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.0017, depth=0.0012, vertices=32,
                                        location=(0.0068, 0.0105, 0.0020))
    flash = bpy.context.object
    flash.name = 'flash'
    flash.data.materials.append(mats['flash'])
    peca.append(flash)

    for o in peca:
        suavizar(o)
    return peca


def monta_aparelho(nome, com_tela, mats):
    """Devolve um Empty com o aparelho inteiro parenteado nele — assim a pose
    e a órbita animam um objeto só."""
    raiz = bpy.data.objects.new(f'{nome}', None)
    raiz.empty_display_size = 0.05
    bpy.context.collection.objects.link(raiz)

    partes = []
    peel = None      # (objeto da fita, modificador) — só existe no aparelho com tela
    corpo = slab_rrect(f'{nome}_corpo', P_W, P_H, P_D, P_R, mats['corpo'], seg=16, bevel=0.0014)
    partes.append(corpo)

    # botões: volume (2) e ação na esquerda, power na direita
    for i, (y, alt) in enumerate(((0.0400, 0.0096), (0.0258, 0.0124), (0.0114, 0.0124))):
        b = slab_rrect(f'{nome}_btn_e{i}', 0.0012, alt, 0.0048, 0.0006, mats['botao'],
                       seg=4, bevel=0.0002)
        b.location = (-P_W / 2 - 0.0004, y, 0)
        partes.append(b)
    pwr = slab_rrect(f'{nome}_btn_pwr', 0.0012, 0.0152, 0.0048, 0.0006, mats['botao'],
                     seg=4, bevel=0.0002)
    pwr.location = (P_W / 2 + 0.0004, 0.0238, 0)
    partes.append(pwr)

    if com_tela:
        lw, lh = P_W - 2 * BORDA, P_H - 2 * BORDA
        # embaixo, sempre ligada: a tela do app, que a fita revela
        tela = plano_rrect(f'{nome}_tela', lw, lh, P_R - BORDA * 0.7, mats['tela_app'], seg=16)
        tela.location = (0, 0, P_D / 2 + 0.00012)
        partes.append(tela)

        # por cima: a lock screen como fita a ser descolada
        fita = grade_plana(f'{nome}_fita', lw, lh, 14, 220, mats['tela_fita'])
        fita.location = (0, 0, P_D / 2 + 0.00034)
        partes.append(fita)
        peel = fita
    else:
        # traseira em vidro fosco + módulo de câmera no canto superior esquerdo
        costas = plano_rrect(f'{nome}_costas', P_W - 0.0016, P_H - 0.0016,
                             P_R - 0.0008, mats['vidro_costas'], seg=16)
        costas.location = (0, 0, -P_D / 2 - 0.00012)
        costas.rotation_euler = (math.pi, 0, 0)
        partes.append(costas)

        for o in modulo_camera(mats):
            o.location = (o.location.x - 0.0175, o.location.y + 0.0480,
                          -P_D / 2 - o.location.z - 0.0016)
            o.rotation_euler = (math.pi, 0, 0)
            partes.append(o)

    for o in partes:
        o.parent = raiz
    return raiz, peel


# --------------------------------------------------------------------- cena
def limpa():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for bloco in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for it in list(bloco):
            bloco.remove(it)


def materiais():
    m = {
        # carcaça: titânio escuro. Metálico alto + coat é o que dá o brilho
        # "caro" sem virar espelho.
        'corpo':        mat_pbr('corpo', (0.090, 0.098, 0.113), 0.90, 0.30, coat=0.85, coat_rough=0.16),
        'botao':        mat_pbr('botao', (0.172, 0.184, 0.212), 0.95, 0.28),
        'vidro_costas': mat_pbr('vidro_costas', (0.105, 0.113, 0.130), 0.55, 0.22, coat=1.0, coat_rough=0.06),
        'cam':          mat_pbr('cam', (0.113, 0.125, 0.149), 0.85, 0.34, coat=0.6, coat_rough=0.12),
        'anel':         mat_pbr('anel', (0.239, 0.255, 0.282), 1.00, 0.18),
        'vidro':        mat_pbr('vidro_lente', (0.039, 0.063, 0.094), 0.10, 0.03, coat=1.0, coat_rough=0.02, ior=1.52),
        'iris':         mat_pbr('iris', (0.078, 0.188, 0.290), 0.30, 0.06, coat=1.0, coat_rough=0.04),
        'flash':        mat_pbr('flash', (0.949, 0.925, 0.847), 0.0, 0.45,
                                emission=(1.0, 0.96, 0.86), emission_forca=1.2),
    }
    # embaixo a tela do app (o destino); por cima a lock screen, que é a fita
    m['tela_app'] = mat_tela('tela_app', os.path.join(TEX, 'tela-app.png'))
    m['tela_fita'] = mat_fita('tela_fita', os.path.join(TEX, 'tela-lock.png'))
    return m


def luzes():
    """Key branca alta à direita + rim coral atrás à esquerda — a mesma leitura
    da cena Three.js (key 0xffffff, rim 0xffe9d6), agora com área real."""
    def area(nome, loc, rot, tam, forca, cor):
        d = bpy.data.lights.new(nome, 'AREA')
        d.shape, d.size, d.energy, d.color = 'RECTANGLE', tam[0], forca, cor
        d.size_y = tam[1]
        o = bpy.data.objects.new(nome, d)
        o.location, o.rotation_euler = loc, [math.radians(a) for a in rot]
        bpy.context.collection.objects.link(o)
        return o

    # Potências em watts, calibradas pra distância real (~0,4 m). Área grande e
    # potência baixa: é a fonte suave que faz o metal escuro ler como metal e
    # não como plástico branco estourado.
    area('key',  (0.30, -0.32, 0.36), (48, 0, 40),   (0.34, 0.48), 5.5, (1.0, 0.99, 0.97))
    area('rim',  (-0.36, 0.28, 0.22), (72, 0, -140), (0.30, 0.40), 4.0, (1.0, 0.86, 0.74))
    # preenchimento frio fraco pra separar a silhueta do fundo escuro
    area('fill', (-0.24, -0.36, -0.12), (110, 0, -30), (0.45, 0.45), 1.4, (0.86, 0.90, 1.0))

    mundo = bpy.data.worlds.new('mundo')
    if mundo.node_tree is None:
        mundo.use_nodes = True
    mundo.node_tree.nodes['Background'].inputs['Color'].default_value = (0.020, 0.022, 0.027, 1)
    mundo.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.55
    bpy.context.scene.world = mundo


def camera(res):
    d = bpy.data.cameras.new('cam')
    # FOV vertical de 30°, igual ao PerspectiveCamera(30, ...) do s4scene.js
    d.sensor_fit, d.sensor_height = 'VERTICAL', 36.0
    d.lens = 18.0 / math.tan(math.radians(15.0))
    d.dof.use_dof = True
    d.dof.aperture_fstop = 4.0
    o = bpy.data.objects.new('cam', d)
    # three: cam em (0, 0, 5.1) olhando pra origem -> blender (0, -5.1*ESC, 0)
    o.location = (0.0, -5.1 * ESC, 0.0)
    o.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.collection.objects.link(o)
    bpy.context.scene.camera = o
    return o


def fcurves_de(ob):
    """As curvas de animação de um objeto. Na 4.4 as ações ganharam slots e
    `action.fcurves` sumiu — agora as curvas moram no channelbag do slot."""
    ad = ob.animation_data
    if not ad or not ad.action:
        return []
    act = ad.action
    if hasattr(act, 'fcurves'):                 # até a 4.3
        return act.fcurves
    slot = getattr(ad, 'action_slot', None)
    for camada in act.layers:
        for faixa in camada.strips:
            cb = faixa.channelbag(slot) if slot else None
            if cb:
                return cb.fcurves
    return []


def out_expo(x):
    """Mesma curva do s4scene.js — desaceleração forte no fim."""
    x = max(0.0, min(1.0, x))
    return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)


def orbita(raiz, fase, atraso_ms, dur_ms, empurra_x, gira_z, amp_pos=0.0028, amp_rot=6.0):
    """Entrada + balanço, portados do __s4render.

    Entrada: o aparelho começa `empurra_x` (em unidades do three) fora do quadro
    e desliza até a pose, em outExpo. Sem isso ele nasce parado no lugar e
    aparece por cima do wipe coral, que ainda está cobrindo a tela no início do
    ato. Não precisa keyframe de visibilidade: o empurrão já joga o aparelho
    fora do campo da câmera.

    Balanço: seno em loop perfeito no período LOOP_S, como no original.
    """
    base_l, base_r = Vector(raiz.location), list(raiz.rotation_euler)
    total = int(LOOP_S * FPS)
    # keys a cada frame durante a entrada (movimento rápido), a cada 5 depois
    fim_entrada = int((atraso_ms + dur_ms) / 1000 * FPS) + 2
    quadros = sorted(set(list(range(0, fim_entrada + 1)) + list(range(0, total + 1, 5))))

    for f in quadros:
        e = out_expo((f / FPS * 1000 - atraso_ms) / dur_ms)
        t = 2 * math.pi * f / total
        raiz.location = base_l + Vector((
            amp_pos * math.sin(t + fase) + (1 - e) * empurra_x * ESC,
            0.0,
            amp_pos * 0.6 * math.sin(t + fase + math.pi / 2)))
        raiz.rotation_euler = (
            base_r[0] + math.radians(amp_rot * 0.35) * math.sin(2 * t + fase),
            base_r[1] + math.radians(amp_rot) * math.sin(t + fase),
            base_r[2] + math.radians(amp_rot * 0.4) * math.sin(t + fase + 1.2) + (1 - e) * gira_z)
        raiz.keyframe_insert('location', frame=f)
        raiz.keyframe_insert('rotation_euler', frame=f)

    for fc in fcurves_de(raiz):
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
    raiz.location, raiz.rotation_euler = base_l, base_r


def render_cfg(samples, res):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = True          # alpha, pra compor sobre o vídeo
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.compression = 15
    # Standard, não AgX: esse render vai ser composto sobre um vídeo já
    # colorido no hex da marca. AgX dessatura o realce e o coral #F2643C da tela
    # chegaria alaranjado-pálido, brigando com o resto do filme. Standard entrega
    # a textura na cor exata — o preço é highlight que estoura fácil, e é por
    # isso que as luzes acima são de potência baixa.
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'

    # GPU se houver; senão CPU. Sem isso o Cycles fica em CPU por padrão.
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
                print(f'[fecho] GPU: {tipo} — {", ".join(d.name for d in devs)}')
                break
    if not usou_gpu:
        sc.cycles.device = 'CPU'
        print('[fecho] sem GPU compatível — render em CPU')


def main():
    a = arg_parse()
    limpa()
    mats = materiais()

    costas, _ = monta_aparelho('costas', False, mats)
    costas.location = POSE['costas']['loc']
    costas.rotation_euler = [math.radians(v) for v in POSE['costas']['rot']]

    tela, peel = monta_aparelho('tela', True, mats)
    tela.location = POSE['tela']['loc']
    tela.rotation_euler = [math.radians(v) for v in POSE['tela']['rot']]

    luzes()
    cam = camera(a.res)
    cam.data.dof.focus_object = tela

    # Entrada portada do __s4render (valores em unidades/radianos do three):
    #   ph1: e1 = outExpo((l-100)/1300), x -= (1-e1)*1.7, rotY += (1-e1)*0.6
    #   ph2: e2 = outExpo((l-300)/1350), x += (1-e2)*1.7, rotY -= (1-e2)*0.55
    # three rotY -> blender rotZ, daí o giro entrar no eixo Z.
    orbita(costas, 2.0, atraso_ms=100, dur_ms=1300, empurra_x=-1.7, gira_z=0.60)
    orbita(tela,   5.0, atraso_ms=300, dur_ms=1350, empurra_x=1.7,  gira_z=-0.55)
    instala_peel(peel)

    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 0, int(LOOP_S * FPS)
    sc.render.fps = FPS
    render_cfg(a.samples, a.res)

    os.makedirs(OUT, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(AQUI, 'phones.blend'))
    if a.only_blend:
        print('[fecho] só .blend, sem render')
        return

    # Laço com frame_set + write_still, e NÃO render(animation=True).
    # A fita é deformada por handler de frame_change; no render de animação o
    # Blender avaliava a cena com a malha defasada e sobrava um pedaço de fita
    # solto no quadro — o mesmo frame renderizado sozinho saía limpo. frame_set
    # força a atualização antes de cada captura, que é o caminho comprovado.
    quadros = range(a.anim[0], a.anim[1] + 1) if a.anim else [a.frame]
    for i, f in enumerate(quadros):
        sc.frame_set(f)
        sc.render.filepath = os.path.join(OUT, f'fecho_{f:04d}.png')
        bpy.ops.render.render(write_still=True)
        if i % 20 == 0:
            print(f'[fecho] frame {f} ({i + 1}/{len(quadros)})')
    print('[fecho] pronto ->', OUT)


main()
