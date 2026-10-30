"""Roda dentro do Blender: veste o corpo do Léo com peças separadas (rodada 1, blocagem).

blender -b <saida>/corpo_base.blend --python bl_montar.py -- <saida> <params.json>

Peças (cada uma um objeto, para animar e trocar):
    LEO_olho_E / LEO_olho_D   globo ocular castanho no lugar do olho do gerador
    LEO_oculos                aro, ponte e hastes por fora da cabeça; LEO_lente_E/D de vidro
    LEO_gravata               gravata-borboleta preta no pescoço
    LEO_camisa                polo coral feita a partir do tronco (solidify + afastamento), com gola
    LEO_selo                  selo branco com check no peito esquerdo do Léo (+X)
Convenção: frente para -Y, esquerda do Léo em +X, chão em z = 0.
"""
import json
import math
import sys

import bmesh
import bpy
from mathutils import Vector

saida, params_arq = sys.argv[sys.argv.index("--") + 1:]
P = json.load(open(params_arq, encoding="utf-8"))
M = json.load(open(f"{saida}/medidas_corpo.json"))
H = M["altura"]
corpo = bpy.data.objects["LEO_corpo"]
cena = bpy.context.scene
col = cena.collection


def px_mundo(px, py):
    s = M["escala_orto"] / M["lado_px"]
    return (px - M["lado_px"] / 2) * s, M["zc"] + (M["lado_px"] / 2 - py) * s, s


def raio(origem, direcao):
    dg = bpy.context.evaluated_depsgraph_get()
    ok, hit, nrm, *_ = corpo.evaluated_get(dg).ray_cast(Vector(origem), Vector(direcao))
    return hit if ok else None


def frente_em(x, z):
    h = raio((x, -5, z), (0, 1, 0))
    return h.y if h else None


def lado_em(y, z, sinal):
    h = raio((sinal * 5, y, z), (-sinal, 0, 0))
    return h.x if h else None


def mat(nome, cor, rough, metal=0.0, **extra):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*cor, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    for k, v in extra.items():
        b.inputs[k].default_value = v
    return m


def novo_obj(nome, dados):
    o = bpy.data.objects.new(nome, dados)
    col.objects.link(o)
    return o


def suave(o):
    for p in o.data.polygons:
        p.use_smooth = True


# ---------------------------------------------------------------- olhos
def material_olho():
    m = bpy.data.materials.new("LEO_olho")
    m.use_nodes = True
    nt, n = m.node_tree, m.node_tree.nodes
    bsdf = n["Principled BSDF"]
    coord = n.new("ShaderNodeTexCoord")
    sep = n.new("ShaderNodeSeparateXYZ")
    nt.links.new(coord.outputs["Object"], sep.inputs[0])
    comb = n.new("ShaderNodeCombineXYZ")  # distância ao eixo local Z (que aponta para a frente)
    nt.links.new(sep.outputs["X"], comb.inputs["X"])
    nt.links.new(sep.outputs["Y"], comb.inputs["Y"])
    dist = n.new("ShaderNodeVectorMath")
    dist.operation = "LENGTH"
    nt.links.new(comb.outputs[0], dist.inputs[0])
    rampa = n.new("ShaderNodeValToRGB")
    e = rampa.color_ramp.elements
    e[0].position, e[0].color = 0.0, (0.004, 0.003, 0.002, 1)
    e[1].position, e[1].color = 1.0, (0.012, 0.008, 0.006, 1)
    for pos, cor in P["olho_rampa"]:
        e.new(pos).color = (*cor, 1)
    for el in list(e)[2:]:
        pass
    nt.links.new(dist.outputs["Value"], rampa.inputs[0])
    nt.links.new(rampa.outputs[0], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.25
    bsdf.inputs["Coat Weight"].default_value = 1.0
    bsdf.inputs["Coat Roughness"].default_value = 0.0
    return m


olhos = []
for lado, (px, py, rpx) in (("E", P["olho_E"]), ("D", P["olho_D"])):
    x, z, s = px_mundo(px, py)
    re = rpx * s
    ys = frente_em(x, z)
    olhos.append({"lado": lado, "x": x, "z": z, "r": re, "y": ys})

bm = bmesh.new()
bm.from_mesh(corpo.data)
apagar = []
for f in bm.faces:
    c = f.calc_center_median()
    for o in olhos:
        if (c.x - o["x"]) ** 2 + (c.z - o["z"]) ** 2 < (o["r"] * P["furo"]) ** 2 and c.y < o["y"] + o["r"] * 0.9:
            apagar.append(f)
            break
bmesh.ops.delete(bm, geom=apagar, context="FACES")
bm.to_mesh(corpo.data)
bm.free()

mo = material_olho()
for o in olhos:
    R = o["r"] * P["globo"]
    me = bpy.data.meshes.new(f"olho_{o['lado']}")
    b = bmesh.new()
    bmesh.ops.create_uvsphere(b, u_segments=64, v_segments=32, radius=1.0)
    b.to_mesh(me)
    b.free()
    ob = novo_obj(f"LEO_olho_{o['lado']}", me)
    ob.scale = (R, R, R)
    # eixo local Z para a frente (-Y), um pouco aberto para fora como no desenho
    ob.rotation_euler = (math.radians(90), 0, math.radians(P["olho_abre_graus"]) * (1 if o["lado"] == "E" else -1))
    ob.location = (o["x"], o["y"] + R * P["olho_recuo"], o["z"])
    me.materials.append(mo)
    suave(ob)

# ---------------------------------------------------------------- óculos
metal = mat("LEO_metal_oculos", (0.02, 0.02, 0.022), 0.3, 1.0)
vidro = mat("LEO_lente", (1, 1, 1), 0.0, 0.0, **{"Transmission Weight": 1.0, "IOR": 1.5})
xe = abs(olhos[0]["x"] - olhos[1]["x"]) / 2
Rr = xe * P["aro_raio"]          # raio do aro em relação à meia distância entre os olhos
t = H * P["aro_espessura"]
zg = sum(o["z"] for o in olhos) / 2
# plano dos aros: à frente do ponto mais avançado do rosto dentro do aro, com folga
ys_aro = []
for o in olhos:
    for i in range(24):
        a = 2 * math.pi * i / 24
        for k in (0.3, 0.6, 0.95):
            y = frente_em(o["x"] + Rr * k * math.cos(a), zg + Rr * k * math.sin(a))
            if y is not None:
                ys_aro.append(y)
# plano dos aros: à frente do anel inteiro (bochecha, sobrancelha e lateral do focinho), como óculos apoiados no nariz
anel = []
for o in olhos:
    for i in range(48):
        a = 2 * math.pi * i / 48
        for k in (0.9, 1.0, 1.08):
            y = frente_em(o["x"] + Rr * k * math.cos(a), zg + Rr * k * math.sin(a))
            if y is not None:
                anel.append(y)
yg = min(anel) - H * P["folga_rosto"]
pecas_oculos = []
for o in olhos:
    sx = 1 if o["x"] > 0 else -1
    me = bpy.data.meshes.new("aro")
    b = bmesh.new()
    seg = 96
    for i in range(seg):  # aro como curva fechada: guardo os pontos para o bevel
        pass
    b.free()
    cu = bpy.data.curves.new(f"aro_{o['lado']}", "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("POLY")
    sp.points.add(seg - 1)
    for i in range(seg):
        a = 2 * math.pi * i / seg
        sp.points[i].co = (sx * xe + Rr * math.cos(a), yg, zg + Rr * math.sin(a), 1)
    sp.use_cyclic_u = True
    cu.bevel_depth = t
    cu.bevel_resolution = 4
    pecas_oculos.append(novo_obj(f"aro_{o['lado']}", cu))
    lm = bpy.data.meshes.new(f"lente_{o['lado']}")
    b = bmesh.new()
    bmesh.ops.create_circle(b, cap_ends=True, segments=96, radius=Rr * 0.99)
    b.to_mesh(lm)
    b.free()
    lente = novo_obj(f"LEO_lente_{o['lado']}", lm)
    lente.rotation_euler = (math.radians(90), 0, 0)
    lente.location = (sx * xe, yg + t * 0.2, zg)
    lm.materials.append(vidro)

# ponte: arco por cima do focinho, sem encostar
ymeio = frente_em(0, zg + Rr * 0.2)
yp = min(yg, (ymeio if ymeio is not None else yg) - H * P["folga_rosto"])
cu = bpy.data.curves.new("ponte", "CURVE")
cu.dimensions = "3D"
sp = cu.splines.new("BEZIER")
sp.bezier_points.add(2)
for bp, co in zip(sp.bezier_points, ((-(xe - Rr), yg, zg + Rr * 0.1), (0, yp, zg + Rr * 0.2), (xe - Rr, yg, zg + Rr * 0.1))):
    bp.co = co
    bp.handle_left_type = bp.handle_right_type = "AUTO"
cu.bevel_depth = t * 0.8
cu.bevel_resolution = 4
pecas_oculos.append(novo_obj("ponte", cu))

# hastes: do lado de fora do aro até a orelha, sempre afastadas da cabeça
for sx in (1, -1):
    pts = [Vector((sx * (xe + Rr), yg, zg + Rr * 0.2))]
    xcab = None
    passos = 14
    y_fim = yg + (P["haste_comprimento"] * H)
    for i in range(1, passos + 1):
        y = yg + (y_fim - yg) * i / passos
        xs = lado_em(y, zg + Rr * 0.2, sx)
        if xs is None:
            continue
        if xcab is None:
            xcab = abs(xs)
        if abs(xs) > xcab * 1.25:  # chegou na orelha
            break
        x = xs + sx * H * P["folga_cabeca"]
        if abs(x) < abs(pts[-1].x) - H * 0.002:
            x = pts[-1].x
        pts.append(Vector((x, y, zg + Rr * 0.2)))
    ult = pts[-1]
    pts.append(Vector((ult.x, ult.y + H * 0.012, ult.z - H * 0.02)))  # ponta curva atrás da orelha
    cu = bpy.data.curves.new("haste", "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, v in zip(sp.points, pts):
        p.co = (*v, 1)
    cu.bevel_depth = t * 0.75
    cu.bevel_resolution = 3
    pecas_oculos.append(novo_obj(f"haste_{'E' if sx > 0 else 'D'}", cu))

bpy.ops.object.select_all(action="DESELECT")
for o in pecas_oculos:
    o.select_set(True)
bpy.context.view_layer.objects.active = pecas_oculos[0]
bpy.ops.object.convert(target="MESH")
bpy.ops.object.join()
oculos = bpy.context.view_layer.objects.active
oculos.name = "LEO_oculos"
oculos.data.materials.clear()
oculos.data.materials.append(metal)
suave(oculos)

# ---------------------------------------------------------------- tronco: fatias e separação dos braços
co = [v.co for v in corpo.data.vertices]
def limites_tronco(z, dz):
    """Faixa em x do tronco na altura z: o grupo central de vértices, separado dos braços por um vão."""
    xs = sorted(v.x for v in co if abs(v.z - z) < dz)
    if not xs:
        return None
    vao = H * 0.004
    grupos, ini = [], xs[0]
    for a, b2 in zip(xs, xs[1:]):
        if b2 - a > vao:
            grupos.append((ini, a))
            ini = b2
    grupos.append((ini, xs[-1]))
    for g in grupos:
        if g[0] <= 0 <= g[1]:
            return g
    return min(grupos, key=lambda g: abs((g[0] + g[1]) / 2))

z_barra, z_gola, z_manga = H * P["barra"], H * P["gola"], H * P["manga"]
faixas = {}
dz = H / 200
z = z_barra
while z <= z_gola + dz:
    faixas[round(z / dz)] = limites_tronco(z, dz)
    z += dz

# ---------------------------------------------------------------- camisa
bm = bmesh.new()
bm.from_mesh(corpo.data)
manter = set()
for f in bm.faces:
    c = f.calc_center_median()
    if not (z_barra <= c.z <= z_gola):
        continue
    fx = faixas.get(round(c.z / dz))
    no_tronco = fx is not None and fx[0] - H * 0.002 <= c.x <= fx[1] + H * 0.002
    if no_tronco or c.z >= z_manga:
        manter.add(f)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f not in manter], context="FACES")
me = bpy.data.meshes.new("camisa")
bm.to_mesh(me)
bm.free()
camisa = novo_obj("LEO_camisa", me)
# mantém só o pedaço maior (tira ilhas soltas de dedo ou cauda)
bpy.ops.object.select_all(action="DESELECT")
camisa.select_set(True)
bpy.context.view_layer.objects.active = camisa
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="DESELECT")
bpy.ops.object.mode_set(mode="OBJECT")
bm = bmesh.new()
bm.from_mesh(me)
# a malha do gerador vem com vértices duplicados (cada triângulo solto): solda antes de achar as ilhas
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=H * 1e-5)
bm.faces.ensure_lookup_table()
ilhas, visto = [], set()
for f in bm.faces:
    if f.index in visto:
        continue
    pilha, ilha = [f], []
    visto.add(f.index)
    while pilha:
        g = pilha.pop()
        ilha.append(g)
        for e in g.edges:
            for h in e.link_faces:
                if h.index not in visto:
                    visto.add(h.index)
                    pilha.append(h)
    ilhas.append(ilha)
maior = max(ilhas, key=len)
bmesh.ops.delete(bm, geom=[f for il in ilhas if il is not maior for f in il], context="FACES")
bm.to_mesh(me)
bm.free()
# remesh para tirar o relevo do pelo, depois afasta do corpo e dá espessura
aplicar = ["alisa", "afasta"]
if P["camisa_voxel"] > 0:  # remesh só funciona com a peça fechada; na superfície aberta ela se despedaça
    r = camisa.modifiers.new("remesh", "REMESH")
    r.mode = "VOXEL"
    r.voxel_size = H * P["camisa_voxel"]
    aplicar.insert(0, "remesh")
sm = camisa.modifiers.new("alisa", "SMOOTH")
sm.factor, sm.iterations = 1.0, P["camisa_alisa"]
dp = camisa.modifiers.new("afasta", "DISPLACE")
dp.direction = "NORMAL"
dp.mid_level = 0.0
dp.strength = H * P["camisa_folga"]
so = camisa.modifiers.new("espessura", "SOLIDIFY")
so.thickness = H * 0.003
so.offset = 1.0
for m in aplicar:
    bpy.context.view_layer.objects.active = camisa
    bpy.ops.object.modifier_apply(modifier=m)
# (remesh depois da espessura abriu furos com voxel de 3,5 mm; fica para a retopologia da Etapa 3)
coral = mat("LEO_camisa", P["coral"], 0.85, 0.0, **{"Sheen Weight": 0.6})
me.materials.append(coral)
suave(camisa)

# gola: faixa dobrada em volta do pescoço, na altura da gola
fx = limites_tronco(z_gola, dz)
cx = (fx[0] + fx[1]) / 2 if fx else 0
pescoco = [(lado_em(y, z_gola, 1), y) for y in [yy / 40 * 0.3 - 0.25 for yy in range(41)]]
seg = 64
gola_pts = []
yf = frente_em(0, z_gola)
yt = raio((0, 5, z_gola), (0, -1, 0))
yt = yt.y if yt else yf + H * 0.12
rx = (abs(fx[1] - fx[0]) / 2 if fx else H * 0.08) + H * P["camisa_folga"] * 2.5
ry = (yt - yf) / 2 + H * P["camisa_folga"] * 2.5
ym = (yt + yf) / 2
cu = bpy.data.curves.new("gola", "CURVE")
cu.dimensions = "3D"
sp = cu.splines.new("POLY")
sp.points.add(seg - 1)
for i in range(seg):
    a = 2 * math.pi * i / seg
    sp.points[i].co = (cx + rx * math.cos(a), ym + ry * math.sin(a), z_gola + H * 0.004 * (1 + math.sin(a)), 1)
sp.use_cyclic_u = True
cu.bevel_depth = H * 0.012
cu.bevel_resolution = 2
gola = novo_obj("LEO_gola", cu)
bpy.ops.object.select_all(action="DESELECT")
gola.select_set(True)
bpy.context.view_layer.objects.active = gola
bpy.ops.object.convert(target="MESH")
gola.scale = (1, 1, 0.55)
bpy.ops.object.transform_apply(scale=True)
gola.data.materials.append(coral)
suave(gola)

# ---------------------------------------------------------------- gravata-borboleta
yf_g = frente_em(0, z_gola + H * 0.006)
L = abs(fx[1] - fx[0]) if fx else H * 0.15
gm = mat("LEO_gravata", (0.012, 0.012, 0.014), 0.35, 0.0, **{"Sheen Weight": 0.3})
partes = []
for sx in (1, -1):
    me = bpy.data.meshes.new("laco")
    b = bmesh.new()
    bmesh.ops.create_uvsphere(b, u_segments=32, v_segments=16, radius=1.0)
    for v in b.verts:  # afina para o nó: lóbulo em forma de gota
        k = (v.co.x * sx + 1) / 2
        v.co.z *= 0.25 + 0.75 * k ** 0.7
        v.co.y *= 0.35 + 0.65 * k
    b.to_mesh(me)
    b.free()
    o = novo_obj("laco", me)
    o.scale = (L * P["gravata"] * 0.5, L * P["gravata"] * 0.10, L * P["gravata"] * 0.30)
    o.location = (sx * L * P["gravata"] * 0.48, yf_g - L * P["gravata"] * 0.12, z_gola + H * 0.006)
    partes.append(o)
me = bpy.data.meshes.new("no")
b = bmesh.new()
bmesh.ops.create_uvsphere(b, u_segments=24, v_segments=12, radius=1.0)
b.to_mesh(me)
b.free()
o = novo_obj("no", me)
o.scale = (L * P["gravata"] * 0.13, L * P["gravata"] * 0.15, L * P["gravata"] * 0.17)
o.location = (0, yf_g - L * P["gravata"] * 0.2, z_gola + H * 0.006)
partes.append(o)
bpy.ops.object.select_all(action="DESELECT")
for o in partes:
    o.select_set(True)
bpy.context.view_layer.objects.active = partes[0]
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
bpy.ops.object.join()
gravata = bpy.context.view_layer.objects.active
gravata.name = "LEO_gravata"
gravata.data.materials.clear()
gravata.data.materials.append(gm)
suave(gravata)

# ---------------------------------------------------------------- selo no peito esquerdo (+X)
zs = H * P["selo_z"]
fxs = limites_tronco(zs, dz)
meia = (fxs[1] - fxs[0]) / 2 if fxs else H * 0.08
xs_ = (fxs[0] + fxs[1]) / 2 + meia * P["selo_x"] if fxs else H * 0.03
lado_selo = meia * 2 * P["selo_tamanho"]
dg = bpy.context.evaluated_depsgraph_get()
ok, hit, nrm, *_ = camisa.evaluated_get(dg).ray_cast(Vector((xs_, -5, zs)), Vector((0, 1, 0)))
img = bpy.data.images.load(P["selo_imagem"])
sm_ = bpy.data.materials.new("LEO_selo")
sm_.use_nodes = True
tex = sm_.node_tree.nodes.new("ShaderNodeTexImage")
tex.image = img
bs = sm_.node_tree.nodes["Principled BSDF"]
sm_.node_tree.links.new(tex.outputs["Color"], bs.inputs["Base Color"])
bs.inputs["Roughness"].default_value = 0.7
bpy.ops.mesh.primitive_plane_add(size=lado_selo, location=(xs_, (hit.y if ok else -0.2) - H * 0.0015, zs))
selo = bpy.context.object
selo.name = "LEO_selo"
selo.rotation_euler = (math.radians(90), 0, 0)
if ok:
    selo.rotation_euler = nrm.to_track_quat("-Z", "Y").to_euler()
selo.data.materials.append(sm_)

# ---------------------------------------------------------------- renders de conferência
cena.render.engine = "CYCLES"
cena.cycles.samples = P["amostras"]
cena.cycles.use_denoising = True
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "OPTIX"
cena.cycles.device = "GPU"
cena.render.film_transparent = True
cena.view_settings.view_transform = "AgX"
w = bpy.data.worlds.new("estudio")
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.8, 0.8, 0.8, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.6
cena.world = w
for nome, e, rot in (("chave", 4.0, (50, 0, 35)), ("recorte", 2.5, (60, 0, 200))):
    l = bpy.data.objects.new(nome, bpy.data.lights.new(nome, "SUN"))
    l.data.energy = e
    l.rotation_euler = [math.radians(a) for a in rot]
    col.objects.link(l)
cam = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
col.objects.link(cam)
cena.camera = cam
cam.data.lens = 85


def foto(nome, angulo, z_alvo, dist, z_cam, rx, ry):
    a = math.radians(angulo)
    cam.location = (dist * math.sin(a), -dist * math.cos(a), z_cam)
    d = Vector((0, 0, z_alvo)) - cam.location
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    cena.render.resolution_x, cena.render.resolution_y = rx, ry
    cena.render.filepath = f"{saida}/{nome}.png"
    bpy.ops.render.render(write_still=True)


for nome, ang in (("frente", 0), ("tres_quartos", 45), ("lado", 90), ("costas", 180)):
    foto(nome, ang, H * 0.5, H * 3.4, H * 0.55, 768, 1024)
foto("rosto", 0, H * 0.84, H * 1.0, H * 0.86, 1024, 1024)
foto("rosto_34", 40, H * 0.84, H * 1.0, H * 0.86, 1024, 1024)
bpy.ops.wm.save_as_mainfile(filepath=P["blend_saida"])
print("LEO_MONTAR ok")
