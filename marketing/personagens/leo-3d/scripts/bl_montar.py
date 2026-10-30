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
    bsdf.inputs["Roughness"].default_value = P.get("olho_aspereza", 0.25)
    bsdf.inputs["Coat Weight"].default_value = P.get("olho_verniz", 1.0)
    bsdf.inputs["Coat Roughness"].default_value = P.get("olho_verniz_aspereza", 0.0)
    bsdf.inputs["Specular IOR Level"].default_value = P.get("olho_especular", 0.5)
    return m


# ---------------------------------------------------------------- forma da cabeça
# perfil medido na silhueta de frente: largura da folha / largura do 3D, por altura a partir do topo
perfil = sorted(P.get("cabeca_perfil", []))


def fator_cabeca(z):
    if not perfil:
        return 1.0
    f = (H - z) / H
    if f <= perfil[0][0]:
        return perfil[0][1]
    for (f0, s0), (f1, s1) in zip(perfil, perfil[1:]):
        if f0 <= f <= f1:
            return s0 + (s1 - s0) * (f - f0) / (f1 - f0)
    return 1.0


if perfil and not P.get("cabeca_ja_aplicada"):  # a malha quad da Etapa 3 já vem com a cabeça no perfil
    cab = [v.co for v in corpo.data.vertices if v.co.z > H * (1 - perfil[-1][0])]
    yc = (min(v.y for v in cab) + max(v.y for v in cab)) / 2
    for v in corpo.data.vertices:
        k = fator_cabeca(v.co.z)
        if k != 1.0:
            v.co.x *= k
            v.co.y = yc + (v.co.y - yc) * (1 + (k - 1) * P["cabeca_prof"])
    corpo.data.update()

# ---------------------------------------------------------------- cor do pelo
for slot in corpo.material_slots:
    nt = slot.material.node_tree
    tex = next((n for n in nt.nodes if n.type == "TEX_IMAGE" and any(l.to_socket.name == "Base Color" for l in n.outputs["Color"].links)), None)
    if tex:
        hsv = nt.nodes.new("ShaderNodeHueSaturation")
        hsv.inputs["Saturation"].default_value = P["pelo_saturacao"]
        hsv.inputs["Value"].default_value = P["pelo_valor"]
        hsv.inputs["Hue"].default_value = P["pelo_matiz"]
        destino = [l.to_socket for l in tex.outputs["Color"].links if l.to_socket.name == "Base Color"][0]
        nt.links.new(tex.outputs["Color"], hsv.inputs["Color"])
        nt.links.new(hsv.outputs["Color"], destino)

if P.get("acessorios") == "v3":
    # ------------------------------------------------------------ olhos v3 (30/10, "olhos esbugalhados")
    # globo encaixado: a esfera passa pela borda do buraco e só uma calota baixa fica à frente da pele
    olhos = []
    for lado, (px, py, rpx) in (("E", P["olho_E"]), ("D", P["olho_D"])):
        x, z, s = px_mundo(px, py)
        x *= fator_cabeca(z)
        r = rpx * s * fator_cabeca(z) ** 0.5
        rf = r * P["furo"]
        anel = [frente_em(x + rf * math.cos(2 * math.pi * i / 16), z + rf * math.sin(2 * math.pi * i / 16)) for i in range(16)]
        anel = [a for a in anel if a is not None]
        olhos.append({"lado": lado, "x": x, "z": z, "r": r, "rf": rf, "y": frente_em(x, z),
                      "y_borda": sum(anel) / len(anel)})
    bm = bmesh.new()
    bm.from_mesh(corpo.data)
    apagar = []
    for f in bm.faces:
        c = f.calc_center_median()
        for o in olhos:
            if (c.x - o["x"]) ** 2 + (c.z - o["z"]) ** 2 < o["rf"] ** 2 and c.y < o["y_borda"] + o["rf"] * 0.9:
                apagar.append(f)
                break
    bmesh.ops.delete(bm, geom=apagar, context="FACES")
    for o in olhos:
        borda = [v for v in bm.verts if v.is_boundary and (v.co.x - o["x"]) ** 2 + (v.co.z - o["z"]) ** 2 < (o["rf"] * 1.6) ** 2]
        for v in borda:
            d = Vector((v.co.x - o["x"], 0, v.co.z - o["z"]))
            if d.length > 1e-6:
                d = d.normalized() * o["rf"]
                v.co.x, v.co.z = o["x"] + d.x, o["z"] + d.z
    bm.to_mesh(corpo.data)
    bm.free()
    mo = material_olho()
    for o in olhos:
        rf = o["rf"]
        h = rf * P["olho_calota"]                 # altura da calota à frente da borda
        R = (rf * rf + h * h) / (2 * h)           # esfera que passa pela borda com essa calota
        me = bpy.data.meshes.new(f"olho_{o['lado']}")
        b = bmesh.new()
        bmesh.ops.create_uvsphere(b, u_segments=64, v_segments=32, radius=1.0)
        b.to_mesh(me)
        b.free()
        ob = novo_obj(f"LEO_olho_{o['lado']}", me)
        ob.scale = (R, R, R)
        ob.rotation_euler = (math.radians(90), 0, 0)       # eixo local Z para a frente (-Y)
        ob.location = (o["x"], o["y_borda"] - h + R, o["z"])
        me.materials.append(mo)
        suave(ob)
        o["R"] = R

    # ------------------------------------------------------------ óculos v3: armação RÍGIDA e simétrica
    # aros circulares planos; a abertura (toe) e a inclinação (pantoscópica) saem de uma busca que deixa a
    # armação o mais perto possível do rosto sem tocar em nenhum ponto
    metal = mat("LEO_metal_oculos", (0.02, 0.02, 0.022), 0.3, 1.0)
    vidro = mat("LEO_lente", (1, 1, 1), 0.03, 0.0, **{"Alpha": P.get("lente_alfa", 0.06), "Specular IOR Level": P.get("lente_brilho", 0.3)})
    if hasattr(vidro, "surface_render_method"):
        vidro.surface_render_method = "BLENDED"          # sem o chuvisco da transparência no viewport
    E_, D_ = (olhos[0], olhos[1]) if olhos[0]["x"] > 0 else (olhos[1], olhos[0])
    xe = (E_["x"] - D_["x"]) / 2
    xc = (E_["x"] + D_["x"]) / 2
    zg = (E_["z"] + D_["z"]) / 2
    Rr = xe * P["aro_raio"]
    t = H * P["aro_espessura"]
    folga = H * P["folga_rosto"]

    def girar(p, sx, th, ph):
        a, b_ = math.radians(th) * sx, math.radians(ph)
        x1, y1 = p.x * math.cos(a) - p.y * math.sin(a), p.x * math.sin(a) + p.y * math.cos(a)
        z1 = p.z
        y2, z2 = y1 * math.cos(b_) - z1 * math.sin(b_), y1 * math.sin(b_) + z1 * math.cos(b_)
        return Vector((x1, y2, z2))

    dzg = 0.0

    def aro_local(sx, ang, th, ph, raio=None):
        rr = Rr if raio is None else raio
        p = girar(Vector((rr * math.cos(ang), 0, rr * math.sin(ang))), sx, th, ph)
        return Vector((xc + sx * xe, 0, zg + dzg)) + p

    frentes_olho = [(o["x"], o["z"], o["y_borda"] - o["rf"] * P["olho_calota"]) for o in olhos]

    def avaliar(th, ph):
        amostras = []
        for sx in (1, -1):
            for i in range(48):
                a = 2 * math.pi * i / 48
                amostras.append((aro_local(sx, a, th, ph), True))
                for k in (0.4, 0.75):
                    amostras.append((aro_local(sx, a, th, ph, Rr * k), False))
        lim, aros = 1e9, []
        for (ox, oz, oy) in frentes_olho:          # a lente passa à frente do olho, com folga
            for sx in (1, -1):
                c_ = Vector((xc + sx * xe, 0, zg + dzg))
                if abs(ox - c_.x) < Rr:
                    n_l = girar(Vector((0, 1, 0)), sx, th, ph)          # normal do plano da lente
                    y_pl = -(n_l.x * (ox - c_.x) + n_l.z * (oz - c_.z)) / n_l.y
                    lim = min(lim, oy - folga - y_pl)
        for pt, eh_aro in amostras:
            fy = frente_em(pt.x, pt.z)
            if fy is None:
                continue
            lim = min(lim, fy - folga - pt.y)
            if eh_aro:
                aros.append((fy, pt))
        if not aros:
            return None
        gap = sum(fy - folga - (pt.y + lim) for fy, pt in aros) / len(aros)
        return gap, lim

    melhor = None
    rf_olho = max(o["rf"] for o in olhos)
    for esc in P["aro_raios_busca"]:
        Rr = xe * esc
        if Rr < rf_olho * 1.15:                # o aro tem de contornar o olho
            continue
        for dz_ in (-0.12, -0.06, 0.0, 0.06, 0.12):
            dzg = dz_ * Rr
            for th in range(0, 33, 3):
                for ph in range(0, 13, 3):
                    r_ = avaliar(th, ph)
                    if not r_:
                        continue
                    nota = r_[0] + H * P["aro_peso_tamanho"] * abs(esc - P["aro_raio"])
                    if melhor is None or nota < melhor[0]:
                        melhor = (nota, r_[1], th, ph, esc, dzg, r_[0])
    _, y0, th, ph, esc, dzg, gap = melhor
    Rr = xe * esc
    print("óculos: aro", round(esc, 2), "x meia distância dos olhos, altura", round(dzg / H, 4), "abertura", th,
          "graus, inclinação", ph, "graus, folga média", round(gap / H, 4))

    def P_(sx, ang, raio=None):
        q = aro_local(sx, ang, th, ph, raio)
        return Vector((q.x, q.y + y0, q.z))

    seg = 96
    pecas_oculos = []
    for sx, lado in ((1, "E"), (-1, "D")):
        cu = bpy.data.curves.new(f"aro_{lado}", "CURVE")
        cu.dimensions = "3D"
        sp = cu.splines.new("POLY")
        sp.points.add(seg - 1)
        for i, pt in enumerate(sp.points):
            pt.co = (*P_(sx, 2 * math.pi * i / seg), 1)
        sp.use_cyclic_u = True
        cu.bevel_depth = t
        cu.bevel_resolution = 4
        pecas_oculos.append(novo_obj(f"aro_{lado}", cu))
        lm = bpy.data.meshes.new(f"lente_{lado}")
        b = bmesh.new()
        recuo = girar(Vector((0, t * 0.35, 0)), sx, th, ph)
        c0 = b.verts.new(P_(sx, 0, 0.0) + recuo)
        borda = [b.verts.new(P_(sx, 2 * math.pi * i / seg, Rr * 0.995) + recuo) for i in range(seg)]
        for i in range(seg):
            b.faces.new((c0, borda[i], borda[(i + 1) % seg]))
        b.to_mesh(lm)
        b.free()
        lente = novo_obj(f"LEO_lente_{lado}", lm)
        lm.materials.append(vidro)
        suave(lente)

    # ponte: arco entre os aros, por cima do focinho
    ang_p = math.radians(P["ponte_angulo"])
    ini = P_(-1, ang_p)                    # lado de dentro do aro do lado -x
    fim = P_(1, math.pi - ang_p)           # lado de dentro do aro do lado +x
    z_m = zg + Rr * P["ponte_altura"]
    fy_m = frente_em(xc, z_m)
    y_m = min(ini.y, fim.y, (fy_m if fy_m is not None else ini.y) - folga)
    cu = bpy.data.curves.new("ponte", "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(2)
    for bp, c_ in zip(sp.bezier_points, (ini, Vector((xc, y_m, z_m)), fim)):
        bp.co = c_
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    cu.bevel_depth = t * 0.85
    cu.bevel_resolution = 4
    pecas_oculos.append(novo_obj("ponte", cu))

    # hastes: retas, da dobradiça (lado de fora do aro) até a orelha, afastadas da cabeça
    ang_h = math.radians(P["haste_angulo"])
    for sx, lado in ((1, "E"), (-1, "D")):
        dob = P_(sx, ang_h if sx > 0 else math.pi - ang_h)
        dob2 = dob + Vector((sx * H * 0.004, H * 0.008, 0))
        z_t = dob2.z
        faixa = [v.co for v in corpo.data.vertices if abs(v.co.z - z_t) < H * 0.035 and v.co.x * sx > 0]
        x_max = max(abs(v.x) for v in faixa)
        orelha = [v for v in faixa if abs(v.x) > x_max * 0.9]
        y_orelha = sum(v.y for v in orelha) / len(orelha)          # a haste termina na frente da orelha
        r_orelha = (max(v.y for v in orelha) - min(v.y for v in orelha)) / 2
        y_fim = y_orelha - r_orelha * 0.6
        larg = 0.0
        for i in range(21):
            y = dob2.y + (y_fim - dob2.y) * i / 20
            xs = lado_em(y, z_t, sx)
            if xs is not None:
                larg = max(larg, abs(xs))
        x_t = max(larg + H * P["folga_cabeca"], abs(dob2.x))
        y_orelha = y_fim
        pts = [dob, dob2,
               Vector((sx * x_t, dob2.y + (y_orelha - dob2.y) * 0.3, z_t)),
               Vector((sx * x_t, y_orelha, z_t - H * 0.003)),
               Vector((sx * x_t * 0.985, y_orelha + H * 0.016, z_t - H * 0.028))]
        cu = bpy.data.curves.new(f"haste_{lado}", "CURVE")
        cu.dimensions = "3D"
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)
        for pt, v in zip(sp.points, pts):
            pt.co = (*v, 1)
        cu.bevel_depth = t * 0.75
        cu.bevel_resolution = 3
        pecas_oculos.append(novo_obj(f"haste_{lado}", cu))
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
else:
    olhos = []
    for lado, (px, py, rpx) in (("E", P["olho_E"]), ("D", P["olho_D"])):
        x, z, s = px_mundo(px, py)
        x *= fator_cabeca(z)
        re = rpx * s * fator_cabeca(z) ** 0.5
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
    # borda do buraco em círculo: na malha quad o recorte sai em degraus
    for o in olhos:
        rf = o["r"] * P["furo"]
        borda = [v for v in bm.verts if v.is_boundary and (v.co.x - o["x"]) ** 2 + (v.co.z - o["z"]) ** 2 < (rf * 1.6) ** 2]
        for v in borda:
            d = Vector((v.co.x - o["x"], 0, v.co.z - o["z"]))
            if d.length > 1e-6:
                d = d.normalized() * rf
                v.co.x, v.co.z = o["x"] + d.x, o["z"] + d.z
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
    vidro = mat("LEO_lente", (1, 1, 1), 0.0, 0.0, **{"Alpha": P.get("lente_alfa", 0.08), "Specular IOR Level": P.get("lente_brilho", 0.5)})  # lente quase invisível, só o brilho
    xe = abs(olhos[0]["x"] - olhos[1]["x"]) / 2
    Rr = xe * P["aro_raio"]          # raio do aro em relação à meia distância entre os olhos
    t = H * P["aro_espessura"]
    zg = sum(o["z"] for o in olhos) / 2
    # aros colados ao rosto: cada ponto do aro fica logo à frente da pele naquele ponto (como óculos apoiados),
    # e o anel é suavizado para não fazer quinas; o plano-base fica junto dos olhos, não da ponta do focinho
    yg = min(o["y"] for o in olhos) - H * P["aro_frente_olho"]
    seg = 96
    aneis = {}
    for o in olhos:
        sx = 1 if o["x"] > 0 else -1
        ys = []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            y = frente_em(sx * xe + Rr * math.cos(a), zg + Rr * math.sin(a))
            ys.append(min(yg, y - H * P["folga_rosto"]) if y is not None else yg)
        for _ in range(P["aro_suaviza"]):
            ys = [min(ys[i], (ys[i - 1] + ys[i] + ys[(i + 1) % seg]) / 3) for i in range(seg)]
        aneis[sx] = [Vector((sx * xe + Rr * math.cos(2 * math.pi * i / seg), ys[i], zg + Rr * math.sin(2 * math.pi * i / seg))) for i in range(seg)]
    pecas_oculos = []
    for o in olhos:
        sx = 1 if o["x"] > 0 else -1
        cu = bpy.data.curves.new(f"aro_{o['lado']}", "CURVE")
        cu.dimensions = "3D"
        sp = cu.splines.new("POLY")
        sp.points.add(seg - 1)
        for p_, v in zip(sp.points, aneis[sx]):
            p_.co = (*v, 1)
        sp.use_cyclic_u = True
        cu.bevel_depth = t
        cu.bevel_resolution = 4
        pecas_oculos.append(novo_obj(f"aro_{o['lado']}", cu))
        # lente: leque a partir do centro, acompanhando o aro
        lm = bpy.data.meshes.new(f"lente_{o['lado']}")
        b = bmesh.new()
        c = b.verts.new(Vector((sx * xe, sum(v.y for v in aneis[sx]) / seg, zg)))
        borda = [b.verts.new(v + Vector((0, t * 0.3, 0))) for v in aneis[sx]]
        for i in range(seg):
            b.faces.new((c, borda[i], borda[(i + 1) % seg]))
        b.to_mesh(lm)
        b.free()
        lente = novo_obj(f"LEO_lente_{o['lado']}", lm)
        lm.materials.append(vidro)
        suave(lente)

    # ponte: arco por cima do focinho, sem encostar
    ymeio = frente_em(0, zg + Rr * 0.2)
    yp = min(yg, (ymeio if ymeio is not None else yg) - H * P["folga_rosto"])
    cu = bpy.data.curves.new("ponte", "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(2)
    ini = min(aneis[-1], key=lambda v: -v.x + abs(v.z - zg - Rr * 0.1))
    fim = min(aneis[1], key=lambda v: v.x + abs(v.z - zg - Rr * 0.1))
    for bp, co in zip(sp.bezier_points, (tuple(ini), (0, min(yp, ini.y, fim.y), zg + Rr * 0.2), tuple(fim))):
        bp.co = co
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    cu.bevel_depth = t * 0.8
    cu.bevel_resolution = 4
    pecas_oculos.append(novo_obj("ponte", cu))

    # hastes: do lado de fora do aro até a orelha, sempre afastadas da cabeça
    for sx in (1, -1):
        pts = [min(aneis[sx], key=lambda v: -sx * v.x + abs(v.z - zg - Rr * 0.2)).copy()]
        xcab = None
        passos = 14
        y_fim = yg + (P["haste_comprimento"] * H)
        for i in range(1, passos + 1):
            y = pts[0].y + (y_fim - pts[0].y) * i / passos
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

# ---------------------------------------------------------------- peças geradas à parte (GLB)
def importar(glb, nome, rot):
    antes = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=glb)
    novos = [o for o in bpy.data.objects if o not in antes]
    malhas = [o for o in novos if o.type == "MESH"]
    for o in novos:
        if o.type != "MESH":
            bpy.data.objects.remove(o)
    bpy.ops.object.select_all(action="DESELECT")
    for o in malhas:
        o.select_set(True)
    bpy.context.view_layer.objects.active = malhas[0]
    if len(malhas) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.parent = None
    ob.name = nome
    ob.rotation_mode = "XYZ"
    ob.rotation_euler.z += math.radians(rot)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return ob


def caixa(ob):
    vs = [v.co for v in ob.data.vertices]
    return (Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs))),
            Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs))))


def encaixar(ob, alvo_min, alvo_max):
    mn, mx = caixa(ob)
    esc = Vector(((alvo_max.x - alvo_min.x) / (mx.x - mn.x), (alvo_max.y - alvo_min.y) / (mx.y - mn.y),
                  (alvo_max.z - alvo_min.z) / (mx.z - mn.z)))
    for v in ob.data.vertices:
        v.co = Vector(((v.co.x - mn.x) * esc.x + alvo_min.x, (v.co.y - mn.y) * esc.y + alvo_min.y,
                       (v.co.z - mn.z) * esc.z + alvo_min.z))
    ob.data.update()


def empurrar_para_fora(ob, folga):
    """Vértices da peça que caíram dentro do corpo vão para a superfície, com folga."""
    dg = bpy.context.evaluated_depsgraph_get()
    cev = corpo.evaluated_get(dg)
    n = 0
    for v in ob.data.vertices:
        ok, loc, nrm, _ = cev.closest_point_on_mesh(v.co)
        if ok and (v.co - loc).dot(nrm) < folga:
            v.co = loc + nrm * folga
            n += 1
    ob.data.update()
    return n


camisa_glb = P.get("camisa_glb")
if camisa_glb and P.get("encaixe") == "v2":
    # ------------------------------------------------------------ camisa e gravata, versão 2 (30/10, pedido do Pedro)
    # o pescoço fica com a largura natural e a GOLA abre até ele; o corpo por baixo da camisa é escondido
    # (modificador Mask, desligável na cena da barriga), não amassado; a gravata senta na frente da gola
    from mathutils.bvhtree import BVHTree
    z_barra, z_gola, z_manga = H * P["barra"], H * P["gola"], H * P["manga"]
    folga = H * P["camisa_folga"]
    camisa = importar(camisa_glb, "LEO_camisa", P["camisa_rot"])
    sl = [v.co for v in corpo.data.vertices if z_manga <= v.co.z <= z_gola]
    sb = [v.co for v in corpo.data.vertices if z_barra <= v.co.z <= z_gola]
    alvo_min = Vector((min(v.x for v in sl) - folga * P["camisa_larg"], min(v.y for v in sb) - folga * P["camisa_prof"], z_barra))
    alvo_max = Vector((max(v.x for v in sl) + folga * P["camisa_larg"], max(v.y for v in sb) + folga * P["camisa_prof"], H * P["gola_topo"]))
    encaixar(camisa, alvo_min, alvo_max)

    # gola: abre (escala radial em volta do eixo do pescoço) só onde o tecido entra no corpo, sem mudar a espessura
    z1g = H * P["gola_topo"] + H * 0.01
    z0g = H * (P["gola_topo"] - P["gola_altura"])
    # eixo do pescoço: centro da fatia mais estreita do corpo entre o ombro e o queixo
    melhor = None
    for i in range(41):
        zz = H * (0.68 + 0.14 * i / 40)
        fx = limites_tronco(zz, H / 400)
        if fx and (melhor is None or fx[1] - fx[0] < melhor[1]):
            melhor = (zz, fx[1] - fx[0], fx)
    z_pesc = melhor[0]
    fat = [v.co for v in corpo.data.vertices if abs(v.co.z - z_pesc) < H / 200 and melhor[2][0] <= v.co.x <= melhor[2][1]]
    nc = Vector(((min(v.x for v in fat) + max(v.x for v in fat)) / 2, (min(v.y for v in fat) + max(v.y for v in fat)) / 2, 0))
    NB = 48

    def bin_ang(co):
        return int((math.atan2(co.y - nc.y, co.x - nc.x) + math.pi) / (2 * math.pi) * NB) % NB

    dg = bpy.context.evaluated_depsgraph_get()
    cev = corpo.evaluated_get(dg)
    k = [1.0] * NB
    for v in camisa.data.vertices:
        if z0g <= v.co.z <= z1g:
            ok, loc, nrm, _ = cev.closest_point_on_mesh(v.co)
            if ok:
                d = (v.co - loc).dot(nrm)
                if d < folga:                     # tecido dentro do pescoço (ou colado demais)
                    r = max((Vector((v.co.x, v.co.y, 0)) - nc).length, 1e-4)
                    b = bin_ang(v.co)
                    k[b] = max(k[b], min((r + folga - d) / r, P["gola_k_max"]))
    for _ in range(4):
        k = [max(k[i], (k[i - 1] + k[i] + k[(i + 1) % NB]) / 3) for i in range(NB)]
    queda = H * P["gola_queda"]
    for v in camisa.data.vertices:
        if z0g - queda <= v.co.z <= z1g + H * 0.03:
            w_ = 1.0 if v.co.z >= z0g else 1 - (z0g - v.co.z) / queda
            f_ = k[bin_ang(v.co)] ** w_
            if f_ > 1.0:
                v.co.x = nc.x + (v.co.x - nc.x) * f_
                v.co.y = nc.y + (v.co.y - nc.y) * f_
    camisa.data.update()
    print("gola: abertura máxima", round(max(k), 3), "pescoço mais estreito em", round(z_pesc / H, 3), "largura", round(melhor[1], 4))
    suave(camisa)

    # pescoço dentro da gola: só a parte que a gola cobre é afinada até caber (fica escondida pela gola);
    # acima da borda da gola o pescoço volta à largura natural em poucos milímetros
    if P.get("pescoco_dentro_gola"):
        r_in = [1e9] * NB
        for v in camisa.data.vertices:
            if z0g <= v.co.z <= z1g:
                b = bin_ang(v.co)
                r_in[b] = min(r_in[b], (Vector((v.co.x, v.co.y, 0)) - nc).length)
        for _ in range(3):
            r_in = [min(r_in[i], (r_in[i - 1] + r_in[i] + r_in[(i + 1) % NB]) / 3) for i in range(NB)]
        z_topo_gola = max(v.co.z for v in camisa.data.vertices)
        trans = H * P["pescoco_transicao"]
        n_ap = 0
        for v in corpo.data.vertices:
            if z0g - H * 0.005 <= v.co.z <= z_topo_gola + trans:
                d = Vector((v.co.x - nc.x, v.co.y - nc.y, 0))
                # a frente do pescoço fica livre: ela preenche o decote em V, embaixo da gravata
                if d.length > 1e-6 and math.degrees(math.acos(max(-1.0, min(1.0, -d.y / d.length)))) < P.get("pescoco_frente_livre_graus", 0):
                    continue
                lim = r_in[bin_ang(v.co)] - folga
                if lim <= 0 or d.length <= lim:
                    continue
                peso = 1.0 if v.co.z <= z_topo_gola else 1 - (v.co.z - z_topo_gola) / trans
                alvo = lim + (d.length - lim) * (1 - peso)
                d2 = d.normalized() * alvo
                v.co.x, v.co.y = nc.x + d2.x, nc.y + d2.y
                n_ap += 1
        corpo.data.update()
        print("pescoço: afinado só dentro da gola,", n_ap, "vértices")

    # gravata: na frente da gola, abaixo da borda de cima, com a largura da folha (0,40 da cabeça com orelhas)
    gl = importar(P["gravata_glb"], "LEO_gravata", P["gravata_rot"])
    zb = H * (P["gola_topo"] - P["gravata_abaixo_gola"])
    cab = [v.co for v in corpo.data.vertices if v.co.z > H * 0.8]
    larg_g = (max(v.x for v in cab) - min(v.x for v in cab)) * P["gravata_larg_cabeca"]
    ys_f = sorted(v.co.y for v in camisa.data.vertices
                  if abs(v.co.x - nc.x) < H * 0.012 and abs(v.co.z - zb) < H * 0.012 and v.co.y < nc.y)
    yb = frente_em(nc.x, zb)
    cand = ([ys_f[len(ys_f) // 2]] if ys_f else []) + ([yb] if yb is not None else [])
    y_frente = min(cand) if cand else nc.y - H * 0.05
    mn, mx = caixa(gl)
    kg = larg_g / (mx.x - mn.x)
    centro = Vector((nc.x, y_frente - (mx.y - mn.y) * kg * 0.5 + H * P.get("gravata_encosta", 0.0), zb))
    for v in gl.data.vertices:
        v.co = (v.co - (mn + mx) / 2) * kg + centro
    gl.data.update()
    bm_g = bmesh.new()
    bm_g.from_mesh(gl.data)
    atras = centro.y + (mx.y - mn.y) * kg * P.get("gravata_corte_atras", 0.2)
    bmesh.ops.delete(bm_g, geom=[v for v in bm_g.verts if v.co.y > atras], context="VERTS")
    bm_g.to_mesh(gl.data)
    bm_g.free()
    suave(gl)
    print("gravata: largura", round(larg_g, 4), "z", round(zb / H, 3))

    # corpo por baixo da camisa: escondido por um modificador Mask (desligável na cena da barriga), não amassado.
    # Três regras, validadas na rodada 18 com o Pedro olhando:
    #   1. a pele cuja normal acerta a camisa por dentro (até 5% da altura) está coberta;
    #   2. a pele dentro do contorno do TRONCO da camisa (fatias sem manga), com 3 mm de margem, está coberta;
    #   3. ilhas soltas de pele que sobram visíveis na faixa da camisa somem.
    from collections import defaultdict
    dg = bpy.context.evaluated_depsgraph_get()
    arv = BVHTree.FromObject(camisa, dg)
    cv = [camisa.matrix_world @ v.co for v in camisa.data.vertices]
    zc0, zc1 = min(v.z for v in cv), max(v.z for v in cv)
    cobre = set()
    z_teto_mascara = z0g if P.get("pescoco_dentro_gola") else zc1 + H * 0.01
    for v in corpo.data.vertices:
        if not (zc0 - H * 0.02 <= v.co.z <= z_teto_mascara):
            continue
        n_ = v.normal
        hit = arv.ray_cast(v.co + n_ * H * 1e-4, n_, H * P["cobre_dist"])
        if hit[0] is not None and hit[1].dot(n_) > 0:
            cobre.add(v.index)
    dzf = H / 150
    fat = defaultdict(list)
    for v in cv:
        fat[int((v.z - zc0) / dzf)].append((v.x, v.y))
    larg = {k: max(p[0] for p in pts) - min(p[0] for p in pts) for k, pts in fat.items() if len(pts) > 10}
    ks = sorted(larg)
    base = sorted(larg[k] for k in ks[: len(ks) // 2])[len(ks) // 4]
    sem_manga = {k for k in ks if larg[k] < base * 1.12}

    def casco(pts):
        pts = sorted(set((round(x, 5), round(y, 5)) for x, y in pts))
        def cruz(o, a, b):
            return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
        lo, hi = [], []
        for p in pts:
            while len(lo) >= 2 and cruz(lo[-2], lo[-1], p) <= 0:
                lo.pop()
            lo.append(p)
        for p in reversed(pts):
            while len(hi) >= 2 and cruz(hi[-2], hi[-1], p) <= 0:
                hi.pop()
            hi.append(p)
        return lo[:-1] + hi[:-1]

    def dist_dentro(c, x, y):
        d = 1e9
        for i in range(len(c)):
            a, b = c[i], c[(i + 1) % len(c)]
            ex, ey = b[0] - a[0], b[1] - a[1]
            L = math.hypot(ex, ey) or 1e-9
            d = min(d, (ex * (y - a[1]) - ey * (x - a[0])) / L)
        return d

    cascos = {k: casco(fat[k]) for k in sem_manga}
    for v in corpo.data.vertices:
        if zc0 <= v.co.z <= min(zc1, z_teto_mascara):
            c = cascos.get(int((v.co.z - zc0) / dzf))
            if c and len(c) >= 3 and dist_dentro(c, v.co.x, v.co.y) > -H * P["mascara_margem"]:
                cobre.add(v.index)
    me_c = corpo.data
    vis = [p for p in me_c.polygons if not any(i in cobre for i in p.vertices)]
    af = defaultdict(list)
    for p in vis:
        for k in p.edge_keys:
            af[k].append(p.index)
    viz = defaultdict(set)
    for fs in af.values():
        for a in fs:
            for b in fs:
                if a != b:
                    viz[a].add(b)
    visto, comps = set(), []
    for p in vis:
        if p.index in visto:
            continue
        pilha, comp = [p.index], []
        visto.add(p.index)
        while pilha:
            f = pilha.pop()
            comp.append(f)
            for n in viz[f]:
                if n not in visto:
                    visto.add(n)
                    pilha.append(n)
        comps.append(comp)
    comps.sort(key=len, reverse=True)
    ilhas = 0
    for c in comps[1:]:
        if len(c) < 400 and min(me_c.polygons[f].center.z for f in c) > zc0 - H * 0.02:
            for f in c:
                cobre.update(me_c.polygons[f].vertices)
            ilhas += 1
    g = corpo.vertex_groups.new(name="sob_camisa")
    g.add(list(cobre), 1.0, "REPLACE")
    mk = corpo.modifiers.new("esconde_sob_camisa", "MASK")
    mk.vertex_group = "sob_camisa"
    mk.invert_vertex_group = True
    print("corpo: escondidos", len(cobre), "ilhas", ilhas)


elif camisa_glb:
    z_barra, z_gola, z_manga = H * P["barra"], H * P["gola"], H * P["manga"]
    camisa = importar(camisa_glb, "LEO_camisa", P["camisa_rot"])
    zs = [v.co.z for v in corpo.data.vertices]
    # caixa do tronco com braços na altura dos ombros, e profundidade na barriga
    sl = [v.co for v in corpo.data.vertices if z_manga <= v.co.z <= z_gola]
    sb = [v.co for v in corpo.data.vertices if z_barra <= v.co.z <= z_gola]
    folga = H * P["camisa_folga"]
    alvo_min = Vector((min(v.x for v in sl) - folga * P["camisa_larg"], min(v.y for v in sb) - folga * P["camisa_prof"], z_barra))
    alvo_max = Vector((max(v.x for v in sl) + folga * P["camisa_larg"], max(v.y for v in sb) + folga * P["camisa_prof"], H * P["gola_topo"]))
    encaixar(camisa, alvo_min, alvo_max)
    if P.get("empurrar") == "corpo":
        # a camisa gerada fica intacta; quem recua é o corpo, só onde ele atravessa o tecido
        dg = bpy.context.evaluated_depsgraph_get()
        cam_ev = camisa.evaluated_get(dg)
        alcance = H * P["corpo_alcance"]
        idx = []
        for v in corpo.data.vertices:
            if not (z_barra - H * 0.01 <= v.co.z <= H * (P["gola_topo"] - P["corpo_margem_gola"])):
                continue
            ok, loc, nrm, _ = cam_ev.closest_point_on_mesh(v.co)
            if not ok:
                continue
            d = (v.co - loc).dot(nrm)
            # nos ombros e na gola o pelo fica mais longe do tecido; abaixo da manga, perto, para não puxar os braços
            lim = H * P["corpo_alcance_ombro"] if v.co.z > z_manga else alcance
            if -folga < d < lim:
                v.co = loc - nrm * folga
                idx.append(v.index)
        corpo.data.update()
        print("corpo: vértices recuados", len(idx))
        # pescoço dentro da gola: aperta em direção ao centro do pescoço, sem esticar a textura
        z0g, z1g = H * (P["gola_topo"] - P["gola_altura"]), H * P["gola_topo"] + H * 0.006
        cam_v = [camisa.matrix_world @ v.co for v in camisa.data.vertices]
        neck = [v for v in corpo.data.vertices if z0g <= v.co.z <= z1g + H * 0.03]
        nc = Vector((sum(v.co.x for v in neck) / len(neck), sum(v.co.y for v in neck) / len(neck), 0))
        anel_gola = [Vector((v.x - nc.x, v.y - nc.y, 0)).length for v in cam_v if z0g <= v.z <= z1g]
        r_in = min(anel_gola) - folga if anel_gola else None
        n2 = 0
        if r_in:
            for v in corpo.data.vertices:
                if z0g - H * 0.01 <= v.co.z <= z1g + H * P["pescoco_transicao"]:
                    d = Vector((v.co.x - nc.x, v.co.y - nc.y, 0))
                    # acima da gola o aperto some aos poucos
                    peso = 1.0 if v.co.z <= z1g else 1 - (v.co.z - z1g) / (H * P["pescoco_transicao"])
                    lim_r = r_in + (d.length - r_in) * (1 - peso)
                    if d.length > lim_r:
                        d2 = d.normalized() * lim_r
                        v.co.x, v.co.y = nc.x + d2.x, nc.y + d2.y
                        n2 += 1
            corpo.data.update()
        print("pescoço: vértices apertados", n2, "raio", r_in)
        g = corpo.vertex_groups.new(name="sob_camisa")
        g.add(idx, 1.0, "REPLACE")
    # empurra, alisa só a área empurrada (o relevo do pelo marca a camisa) e empurra de novo, mais fino
    for rodada, (fator, iters) in enumerate(() if P.get("empurrar") == "corpo" else ((1.0, P["camisa_alisa_empurrado"]), (0.6, 6))):
        dg = bpy.context.evaluated_depsgraph_get()
        cev = corpo.evaluated_get(dg)
        grupo = camisa.vertex_groups.get("empurrados") or camisa.vertex_groups.new(name="empurrados")
        idx = []
        for v in camisa.data.vertices:
            ok, loc, nrm, _ = cev.closest_point_on_mesh(v.co)
            if ok and (v.co - loc).dot(nrm) < folga:
                v.co = loc + nrm * folga
                idx.append(v.index)
        camisa.data.update()
        print("camisa: vértices empurrados", rodada, len(idx))
        if not idx:
            break
        grupo.add(idx, 1.0, "REPLACE")
        sm = camisa.modifiers.new("alisa_empurrado", "SMOOTH")
        sm.factor, sm.iterations, sm.vertex_group = fator, iters, "empurrados"
        bpy.context.view_layer.objects.active = camisa
        bpy.ops.object.modifier_apply(modifier="alisa_empurrado")
    suave(camisa)
    gl = importar(P["gravata_glb"], "LEO_gravata", P["gravata_rot"])
    fxg = None
    dz0 = H / 200
    zb = H * P["gravata_z"]
    xs_p = sorted(v.co.x for v in corpo.data.vertices if abs(v.co.z - zb) < dz0)
    larg_p = (xs_p[-1] - xs_p[0]) * P["gravata"]
    mn, mx = caixa(gl)
    k = larg_p / (mx.x - mn.x)
    yf = frente_em(0, zb)
    alvo_min = Vector((-larg_p / 2, 0, 0))
    centro = Vector((0, (yf if yf is not None else -0.2) - (mx.y - mn.y) * k * 0.5 - H * 0.004, zb))
    for v in gl.data.vertices:
        v.co = (v.co - (mn + mx) / 2) * k + centro
    gl.data.update()
    suave(gl)

if not camisa_glb:
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
cena.view_settings.view_transform = P.get("transformada", "AgX")
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
