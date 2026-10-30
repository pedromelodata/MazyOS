"""Léo por peças, tudo do Meshy 7 Ultra, passo 2: os óculos do Meshy no rosto do corpo do Meshy.

blender -b geracoes/vestir/1-corpo.blend --python bl_vestir_oculos.py -- vestir-params.json

- a armação é a do GLB; a lente gerada é uma bolha de uns 2 cm para a frente e as plaquetas batem no focinho, então
  as duas saem (faces claras dentro do aro e perto da ponte) e entra uma lente fina de verdade, de menisco, no aro;
- escala pela distância entre os olhos (centro das lentes = centro dos olhos) e acha a altura, a inclinação e o
  avanço que deixam a armação o mais perto do rosto sem encostar (raios na direção +Y até a pele, atravessando o
  que é fino, como o bigode);
- hastes: cada uma gira na dobradiça e encurta até terminar na frente da orelha, rente à cabeça, sem atravessar
  nada; a ponta curva encolhe e desce encostada na cabeça (Pedro, 30/10: "haste atravessando a orelha");
- materiais: metal escuro polido e vidro com antirreflexo (película fina) que não faz sombra no olho. Tudo filho
  do vazio LEO_oculos (o pivô fica no centro das lentes).
Sai: geracoes/vestir/2-oculos.blend, geracoes/vestir/oculos.json e renders/vestir/2-oculos-*.png.
"""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vestir_comum import (DIR_RENDER, DIR_VESTIR, amostra_por_face, coords, dados_faces, foto, gravar_coords,  # noqa: E402
                          importar, luz_estudio, no_cor, params, preparar_render)

P = params()
M = json.load(open(DIR_VESTIR / "corpo.json", encoding="utf-8"))
cena = bpy.context.scene
corpo = bpy.data.objects["LEO_corpo"]
leo = bpy.data.collections["Leo"]
dg = bpy.context.evaluated_depsgraph_get()
bvh = BVHTree.FromObject(corpo, dg)
olho_E, olho_D = (np.array(M["olhos"][k]["centro_brilho"]) for k in ("E", "D"))
frente_olho_y = min(M["olhos"][k]["frente"][1] for k in ("E", "D"))

# ---------------------------------------------------------------- importa, tira a lente gerada e as plaquetas
oc = importar(P["oculos_glb"], "LEO_oculos_armacao")
for c in oc.users_collection:
    c.objects.unlink(oc)
leo.objects.link(oc)
me = oc.data
cen, _, area = dados_faces(me)
rgb = amostra_por_face(oc, no_cor(oc.material_slots[0].material).image)[:, :3]
clara = rgb.max(1) > 0.5
y_frente = cen[:, 1].min()
x_dobra = np.abs(cen[:, 0]).max()
frente_f = cen[:, 1] < y_frente + P["oculos_frente_faixa"]
aros = []
tirar = np.zeros(len(cen), bool)
for s in (1, -1):
    lado = np.sign(cen[:, 0]) == s
    m = clara & lado & frente_f
    c = (cen[m] * area[m, None]).sum(0) / area[m].sum()
    r = np.sqrt(((cen[:, [0, 2]] - c[[0, 2]]) ** 2).sum(1))
    rmax = np.percentile(r[m], 99)
    fio = ~clara & lado & frente_f & (r > 0.8 * rmax) & (r < 1.5 * rmax)
    r_int = np.percentile(r[fio], 3)
    aros.append((np.array([c[0], np.median(cen[fio, 1]), c[2]]), r_int))
    tirar |= clara & lado & frente_f & ((r < r_int * 1.04) | (np.abs(cen[:, 0]) < P["ponte_meia_largura"] * x_dobra))
    # braços das plaquetas: metal que sai do aro para trás, embaixo da ponte
    tirar |= lado & (np.abs(cen[:, 0]) < P["ponte_meia_largura"] * x_dobra) & (cen[:, 2] < 0)         & (cen[:, 1] > aros[-1][0][1] + P["braco_plaqueta_atras"])
bm = bmesh.new()
bm.from_mesh(me)
bm.faces.ensure_lookup_table()
bmesh.ops.delete(bm, geom=[bm.faces[i] for i in np.nonzero(tirar)[0]], context="FACES")
bm.to_mesh(me)
bm.free()
co = coords(me)
nv = len(co)
lentes_c = np.array([a[0] for a in aros])  # [E (+X), D (-X)]
dist_lentes = np.linalg.norm(lentes_c[0][[0, 2]] - lentes_c[1][[0, 2]])
centro_raw = lentes_c.mean(0)
print("OCULOS aros", [(a[0].round(4).tolist(), round(float(a[1]), 4)) for a in aros], "faces tiradas", int(tirar.sum()))


def lente_nova(c, R):
    """Lente de menisco (frente convexa, trás côncava), fechada, no plano do aro; unidades do GLB."""
    K, J = 14, 96
    sag, esp = P["lente_curva"] * R, P["lente_espessura"] * R
    rs = R * np.arange(1, K + 1) / K
    ang = np.linspace(0, 2 * np.pi, J, endpoint=False)

    def superficie(dy):
        pts = [(c[0], c[1] + dy - sag, c[2])]
        for r in rs:
            yy = c[1] + dy - sag * (1 - (r / R) ** 2)
            pts += [(c[0] + r * math.cos(a), yy, c[2] + r * math.sin(a)) for a in ang]
        return pts

    vs = superficie(-esp / 2) + superficie(esp / 2)
    n = len(vs) // 2
    fs = []
    for base in (0, n):
        fs += [(base, base + 1 + j, base + 1 + (j + 1) % J) for j in range(J)]
        for k in range(K - 1):
            for j in range(J):
                a_, b_ = base + 1 + k * J + j, base + 1 + k * J + (j + 1) % J
                fs.append((a_, a_ + J, b_ + J, b_))
    ult = 1 + (K - 1) * J
    fs += [(ult + j, ult + (j + 1) % J, n + ult + (j + 1) % J, n + ult + j) for j in range(J)]
    return np.array(vs), fs


lente_v, lente_f = [], []
for c, r_int in aros:
    v, f = lente_nova(c, r_int * P["lente_no_aro"])
    desloc = sum(len(x) for x in lente_v)
    lente_f += [tuple(i + desloc for i in face) for face in f]
    lente_v.append(v)
lente_v = np.vstack(lente_v)

# hastes: tudo atrás da dobradiça; a curva começa onde a haste passa a descer
x_dobra = np.abs(co[:, 0]).max()
haste_v = (co[:, 1] > y_frente + P["oculos_dobradica_atras"]) & (np.abs(co[:, 0]) > 0.5 * x_dobra)


def inicio_curva(sinal):
    v = co[haste_v & (np.sign(co[:, 0]) == sinal)]
    ys = np.linspace(v[:, 1].min(), v[:, 1].max(), 60)
    topo = np.array([v[(v[:, 1] >= a) & (v[:, 1] < b), 2].max() if ((v[:, 1] >= a) & (v[:, 1] < b)).any() else np.nan
                     for a, b in zip(ys[:-1], ys[1:])])
    ref = np.nanmedian(topo[:15])
    caiu = np.nonzero(topo < ref - P["oculos_curva_queda"] * (topo.max() - topo.min()))[0]
    return ys[caiu[0]] if len(caiu) else ys[-1]


curva_y = {s: inicio_curva(s) for s in (1, -1)}
dobra_y = {s: co[haste_v & (np.sign(co[:, 0]) == s), 1].min() for s in (1, -1)}
print("HASTES dobradiça y", {s: round(v, 3) for s, v in dobra_y.items()}, "curva y", {s: round(v, 3) for s, v in curva_y.items()})

# ---------------------------------------------------------------- escala, altura, inclinação e avanço da frente
esc = np.linalg.norm((olho_E - olho_D)[[0, 2]]) / dist_lentes * P["oculos_escala"]
meio = (olho_E + olho_D) / 2
todos_raw = np.vstack([co, lente_v])  # armação e, no fim, as lentes novas
local = (todos_raw - centro_raw) * esc
frente_v = np.nonzero(~haste_v)[0]
rng = np.random.default_rng(1)
amostra = np.concatenate([rng.choice(frente_v, min(len(frente_v), P["oculos_amostra"]), replace=False),
                          np.arange(nv, len(todos_raw))])


def rot_x(graus):
    a = math.radians(graus)
    return np.array([[1, 0, 0], [0, math.cos(a), -math.sin(a)], [0, math.sin(a), math.cos(a)]])


def pele(p, d, alcance=0.6):
    """Distância até a pele na direção d, atravessando o que é fino (bigode: entra e sai em poucos milímetros)."""
    p = Vector(p)
    total = 0.0
    for _ in range(30):
        h = bvh.ray_cast(p, d, alcance - total)
        if h[0] is None:
            return None
        total += h[3]
        sai = bvh.ray_cast(h[0] + d * 1e-5, d, P["fino"])
        if sai[0] is None:
            return total
        total += sai[3] + 1e-5
        p = sai[0] + d * 1e-5
    return None


Y0 = frente_olho_y - 0.35  # bem na frente do focinho: nenhum ponto começa dentro da cabeça


def avaliar(dz, incl):
    """Põe a frente com a lente na altura do olho + dz e inclinação incl; avança até faltar a folga para a pele."""
    pts = local[amostra] @ rot_x(incl).T + [meio[0], Y0, meio[2] + dz]
    passo, trava = np.inf, None
    for i, p in enumerate(pts):
        d = pele(p, Vector((0, 1, 0)))
        if d is not None and d < passo:
            passo, trava = d, amostra[i]
    y = Y0 + passo - P["oculos_folga"]
    avaliar.trava = trava
    lente_y = y  # o centro das lentes fica no plano y (origem local)
    return y, frente_olho_y - lente_y


melhor = None
for dz in P["oculos_dz_busca"]:
    for incl in P["oculos_incl_busca"]:
        y, vao = avaliar(dz, incl)
        nota = vao + P["oculos_peso_dz"] * abs(dz)
        if melhor is None or nota < melhor[0]:
            melhor = (nota, dz, incl, y, vao)
_, dz, incl, y_lente, vao = melhor
avaliar(dz, incl)
t = avaliar.trava
print("FRENTE escala %.4f dz %.4f inclinacao %d vao lente-olho %.4f" % (esc, dz, incl, vao),
      "| encosta no vértice", int(t), "(GLB", todos_raw[t].round(3).tolist(), "lente" if t >= nv else "armação", ")")
Rf = rot_x(incl)
pos = np.array([meio[0], y_lente, meio[2] + dz])
mundo = local @ Rf.T + pos

# ---------------------------------------------------------------- hastes: dobradiça -> frente da orelha, rente à cabeça
def raio_lateral(sinal, y, z):
    hit = bvh.ray_cast(Vector((sinal * 0.5, y, z)), Vector((-sinal, 0, 0)), 1.0)
    return hit[0].x if hit[0] is not None else None


orelhas = {1: M["orelhas"]["E"], -1: M["orelhas"]["D"]}
for s in (1, -1):
    idx = np.nonzero(haste_v & (np.sign(co[:, 0]) == s))[0]
    raw = co[idx]
    # pivô da dobradiça (no mundo) e direção original do trecho reto
    piv_raw = np.array([raw[:, 0].mean(), dobra_y[s], np.median(raw[raw[:, 1] < dobra_y[s] + 0.05, 2])])
    fim_raw = np.array([np.median(raw[np.abs(raw[:, 1] - curva_y[s]) < 0.03, 0]), curva_y[s],
                        np.median(raw[np.abs(raw[:, 1] - curva_y[s]) < 0.03, 2])])
    piv = (piv_raw - centro_raw) * esc @ Rf.T + pos
    fim = (fim_raw - centro_raw) * esc @ Rf.T + pos
    # fim novo: na frente da orelha (onde o escuro dela começa), na altura da dobradiça, rente à cabeça
    o = orelhas[s]
    y_alvo = o["min"][1] - P["haste_antes_orelha"]
    z_alvo = piv[2] + P["haste_desce"]
    x_pele = raio_lateral(s, y_alvo, z_alvo)
    alvo = np.array([x_pele + s * P["haste_folga"], y_alvo, z_alvo])
    # a reta não pode entrar na cabeça no caminho: empurra o fim para fora até passar
    for _ in range(40):
        ok = True
        for t in np.linspace(0.05, 1.0, 24):
            p = piv + (alvo - piv) * t
            xs = raio_lateral(s, p[1], p[2])
            if xs is not None and (p[0] - xs) * s < P["haste_folga"]:
                ok = False
                break
        if ok:
            break
        alvo[0] += s * 0.0015
    a = Vector(fim - piv)
    b = Vector(alvo - piv)
    q = a.rotation_difference(b)
    R = np.array(q.to_matrix())
    f = b.length / a.length
    # cada vértice: posição no mundo antes do ajuste, com o trecho reto encurtado e a curva encolhida
    w = (raw - centro_raw) * esc @ Rf.T + pos
    eixo = (fim - piv) / np.linalg.norm(fim - piv)
    u = (w - piv) @ eixo
    L = np.linalg.norm(fim - piv)
    reto = u <= L
    nova = np.empty_like(w)
    nova[reto] = piv + (w[reto] - piv - np.outer(u[reto], eixo)) + np.outer(u[reto] * f, eixo)
    curva = ~reto
    nova[curva] = fim + (w[curva] - fim) * P["haste_ponta_escala"] + eixo * L * (f - 1)
    nova = (nova - piv) @ R.T + piv
    # ponta: encosta na cabeça (desloca em x, crescendo do início ao fim da curva)
    if curva.any():
        ponta = nova[curva]
        prog = np.clip((ponta - nova[reto][np.argmax(u[reto])]) @ (R @ eixo), 0, None)
        prog = prog / max(prog.max(), 1e-6)
        gaps = []
        for p in ponta[prog > 0.8]:
            xs = raio_lateral(s, p[1], p[2])
            if xs is not None:
                gaps.append((p[0] - xs) * s)
        if gaps:
            delta = np.median(gaps) - P["haste_folga"]
            nova[curva, 0] -= s * delta * prog
    mundo[idx] = nova
    print("HASTE", s, "pivô", piv.round(4).tolist(), "alvo", alvo.round(4).tolist(), "encurta %.2f" % f)

gravar_coords(me, mundo[:nv])
me_l = bpy.data.meshes.new("LEO_oculos_lentes")
me_l.from_pydata(mundo[nv:].tolist(), [], lente_f)
bm = bmesh.new()
bm.from_mesh(me_l)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(me_l)
bm.free()
lentes = bpy.data.objects.new("LEO_oculos_lentes", me_l)
leo.objects.link(lentes)


def principled(nome, **v):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    for k, x in v.items():
        b.inputs[k].default_value = x
    return m


metal = principled("LEO_oculos_metal", **{"Base Color": (*P["oculos_metal_cor"], 1), "Metallic": 1.0,
                                          "Roughness": P["oculos_metal_aspereza"]})
vidro = principled("LEO_oculos_vidro", **{"Base Color": (1, 1, 1, 1), "Roughness": 0.0, "IOR": 1.5,
                                          "Transmission Weight": 1.0, "Thin Film Thickness": P["lente_pelicula_nm"],
                                          "Thin Film IOR": 1.38})
for ob, m in ((oc, metal), (lentes, vidro)):
    ob.data.materials.clear()
    ob.data.materials.append(m)
    ob.data.shade_smooth()
lentes.visible_shadow = False  # a lente não escurece o olho (o Cycles trata vidro como opaco na sombra)

raiz = bpy.data.objects.new("LEO_oculos", None)
leo.objects.link(raiz)
raiz.empty_display_type = "ARROWS"
raiz.empty_display_size = 0.03
raiz.location = Vector(pos)
for ob in (oc, lentes):
    ob.parent = raiz
    ob.matrix_parent_inverse = Matrix.Translation(-Vector(pos))

json.dump({"escala": esc, "dz": dz, "inclinacao": incl, "vao_lente_olho": vao, "pos": pos.tolist()},
          open(DIR_VESTIR / "oculos.json", "w"), indent=1)
bpy.ops.wm.save_as_mainfile(filepath=str(DIR_VESTIR / "2-oculos.blend"), compress=True)

# ---------------------------------------------------------------- fotos
preparar_render(cena, P["amostras"])
luz_estudio(cena)
bpy.data.objects["LEO_corpo_colisao"].hide_viewport = True
z = meio[2]
foto(cena, DIR_RENDER / "2-oculos-frente.png", (0.0, -0.8, z + 0.01), (0, 0, z - 0.01), 85, (900, 900))
foto(cena, DIR_RENDER / "2-oculos-34.png", (0.55, -0.6, z + 0.05), (0, -0.05, z - 0.01), 85, (900, 900))
foto(cena, DIR_RENDER / "2-oculos-lado-E.png", (0.8, -0.08, z + 0.01), (0, -0.06, z), 85, (900, 900))
foto(cena, DIR_RENDER / "2-oculos-lado-D.png", (-0.8, -0.08, z + 0.01), (0, -0.06, z), 85, (900, 900))
foto(cena, DIR_RENDER / "2-oculos-cima.png", (0.0, -0.12, z + 0.7), (0, -0.05, z), 85, (900, 900))
print("VESTIR_OCULOS ok")
