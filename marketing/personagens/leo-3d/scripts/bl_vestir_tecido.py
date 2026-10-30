"""Léo por peças, tudo do Meshy 7 Ultra, passo 4: preparo da física de tecido da camisa (a gravata vai presa na gola).

blender -b geracoes/vestir/3-camisa.blend --python bl_vestir_tecido.py -- vestir-params.json

- a camisa gerada é um sólido fechado (casca de fora, casca de dentro e as bordas), com 1 a 1,4 cm de espessura:
  fica só a casca de fora (de cada par de faces dos dois lados do tecido, a mais longe do corpo) e a espessura vem
  de um Solidify
  (tecido_espessura), que acompanha qualquer dobra sem a camada de dentro furar a de fora;
- LEO_camisa_sim: a casca de fora refeita em quads uniformes no Instant Meshes (malha leve, só para a física);
- LEO_camisa (alta) e LEO_gravata seguem a de simulação por Surface Deform;
- LEO_manequim: forma lisa de colisão feita das medidas do corpo (tronco em anéis, braços em cápsulas até a manga);
- a de simulação assenta no manequim por um relaxamento de restrições (gravidade, saída do manequim e comprimento
  das arestas): parte sem ponto dentro e sem triângulo esmagado.
A simulação em si fica em bl_vestir_simular.py (roda sobre o arquivo salvo aqui, para acertar os parâmetros rápido).
Sai: geracoes/vestir/4-tecido-pre.blend e geracoes/vestir/tecido.json.
"""
import json
import subprocess
import sys
import time
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vestir_comum import (DIR_VESTIR, casco_convexo, coords, dados_faces, gravar_coords, normais,  # noqa: E402
                          params, perimetro_convexo, secoes, triangulos)

P = params()
M = json.load(open(DIR_VESTIR / "corpo.json", encoding="utf-8"))
H = M["altura"]
cena = bpy.context.scene
cam = bpy.data.objects["LEO_camisa"]
grav = bpy.data.objects["LEO_gravata"]
colisao = bpy.data.objects["LEO_corpo_colisao"]
fisica = bpy.data.collections["Leo_fisica"]
IM = Path.home() / ".leo3d" / "instant-meshes" / "Instant Meshes.exe"
relato = {}
t0 = time.time()


def marca(o_que):
    print("TEMPO %-28s %6.1f s" % (o_que, time.time() - t0))

# ---------------------------------------------------------------- manequim de colisão: tronco em anéis + braços em cápsulas
# Jeito de produção: o tecido apoia numa forma lisa feita das medidas do corpo (sem o relevo do pelo, que enruga o
# tecido, e sem o braço grudado na barriga, onde não cabe tecido: abaixo da manga o tecido passa por baixo do braço).
# No rig, cada peça do manequim vai presa ao osso dela. O relaxamento usa a mesma forma em conta (distância
# assinada) e a colisão do Blender usa a malha LEO_manequim.
cco = coords(colisao.data)
ctri = triangulos(colisao.data)
NA = 64
ANG = np.linspace(-np.pi, np.pi, NA, endpoint=False)
passo_z = P["manequim_passo"] * H
z_baixo, z_alto = P["manequim_de"] * H, P["manequim_ate"] * H
zs = np.arange(z_baixo, z_alto + 1e-9, passo_z)
R = np.full((len(zs), NA), np.nan)
CX = np.full(len(zs), np.nan)
CY = np.full(len(zs), np.nan)
for k, z in enumerate(zs):
    ls = [l for l in secoes(cco, ctri, z) if len(l) > 30 and l[:, 0].min() < 0 < l[:, 0].max()]
    if not ls:
        continue
    l = max(ls, key=perimetro_convexo)
    if np.ptp(l[:, 0]) >= P["tronco_largura_max"]:
        continue  # braço grudado no laço: essa altura sai da interpolação
    casco = casco_convexo(l[:, :2])
    cx, cy = (casco[:, 0].max() + casco[:, 0].min()) / 2, (casco[:, 1].max() + casco[:, 1].min()) / 2
    # contorno denso do casco -> raio por ângulo (o casco é estrelado em volta do centro)
    fech = np.vstack([casco, casco[:1]])
    dens = np.vstack([np.linspace(a, b, 20, endpoint=False) for a, b in zip(fech[:-1], fech[1:])])
    a_ = np.arctan2(dens[:, 1] - cy, dens[:, 0] - cx)
    r_ = np.hypot(dens[:, 0] - cx, dens[:, 1] - cy)
    o = np.argsort(a_)
    R[k] = np.interp(ANG, a_[o], r_[o], period=2 * np.pi)
    CX[k], CY[k] = cx, cy
ok = ~np.isnan(CX)
for j in range(NA):
    R[:, j] = np.interp(zs, zs[ok], R[ok, j])
CX = np.interp(zs, zs[ok], CX[ok])
CY = np.interp(zs, zs[ok], CY[ok])
for _ in range(P["manequim_alisa"]):  # tira o serrilhado das seções, em altura e em ângulo
    R[1:-1] = 0.25 * R[:-2] + 0.5 * R[1:-1] + 0.25 * R[2:]
    R = 0.25 * np.roll(R, 1, 1) + 0.5 * R + 0.25 * np.roll(R, -1, 1)
R *= P["manequim_escala"]
relato["manequim_alturas"] = [int(ok.sum()), len(zs)]

capsulas = []
for sgn in (1, -1):
    pts, raios = [], []
    for zrel in np.arange(P["braco_de"], P["braco_corte"], 0.005):
        ls = [l for l in secoes(cco, ctri, zrel * H) if len(l) > 30 and l[:, 0].mean() * sgn > 0.1]
        if ls:
            l = max(ls, key=perimetro_convexo)
            pts.append(l.mean(0))
            raios.append(perimetro_convexo(l) / (2 * np.pi))
    pts = np.array(pts)
    rc = float(np.median(raios)) * P["braco_raio_fator"]
    # embaixo: o centro do braço solto mais perto da manga; em cima: o ombro, no lado do tronco naquela altura e no
    # meio da profundidade (a reta do braço esticada para cima vai para trás do ombro, então não serve)
    fundo = pts[np.argmin(np.abs(pts[:, 2] - P["braco_capsula_ate"] * H))]
    zo = P["ombro_capsula"] * H
    lo = [l for l in secoes(cco, ctri, zo) if len(l) > 30 and l[:, 0].min() < 0 < l[:, 0].max()]
    lo = max(lo, key=perimetro_convexo)
    x_lado = lo[:, 0].max() if sgn > 0 else lo[:, 0].min()
    topo = np.array([x_lado - sgn * rc, (lo[:, 1].max() + lo[:, 1].min()) / 2, zo])
    capsulas.append((topo, fundo, rc))
relato["capsulas"] = [[a.round(4).tolist(), b.round(4).tolist(), round(r, 4)] for a, b, r in capsulas]
print("MANEQUIM tronco: %d alturas medidas de %d; cápsulas" % (ok.sum(), len(zs)), relato["capsulas"])


def distancia(p):
    """Distância assinada até o manequim (negativa dentro) e a direção de saída, para cada ponto."""
    n = len(p)
    d = np.full(n, np.inf)
    g = np.zeros((n, 3))
    # tronco: raio por ângulo, interpolado entre os anéis
    f = (p[:, 2] - z_baixo) / passo_z
    dentro_z = (f >= 0) & (f <= len(zs) - 1)
    i0 = np.clip(np.floor(f).astype(int), 0, len(zs) - 2)
    t = np.clip(f - i0, 0, 1)
    cx = CX[i0] * (1 - t) + CX[i0 + 1] * t
    cy = CY[i0] * (1 - t) + CY[i0 + 1] * t
    ang = np.arctan2(p[:, 1] - cy, p[:, 0] - cx)
    rho = np.hypot(p[:, 0] - cx, p[:, 1] - cy)
    fa = (ang + np.pi) / (2 * np.pi) * NA
    j0 = np.floor(fa).astype(int) % NA
    j1 = (j0 + 1) % NA
    s = fa - np.floor(fa)
    r = (R[i0, j0] * (1 - s) + R[i0, j1] * s) * (1 - t) + (R[i0 + 1, j0] * (1 - s) + R[i0 + 1, j1] * s) * t
    dt = np.where(dentro_z, rho - r, np.inf)
    usa = dt < d
    d[usa] = dt[usa]
    g[usa] = np.c_[np.cos(ang), np.sin(ang), np.zeros(n)][usa]
    # braços: cápsulas
    for a, b, rc in capsulas:
        ab = b - a
        tt = np.clip(((p - a) @ ab) / (ab @ ab), 0, 1)
        q = a + tt[:, None] * ab
        v = p - q
        nv_ = np.linalg.norm(v, axis=1)
        dc = nv_ - rc
        usa = dc < d
        d[usa] = dc[usa]
        g[usa] = v[usa] / np.maximum(nv_[usa], 1e-9)[:, None]
    return d, g


# malha do manequim (para a colisão do Blender na hora de animar)
vs, fs = [], []
for k, z in enumerate(zs):
    for j, a in enumerate(ANG):
        vs.append((CX[k] + R[k, j] * np.cos(a), CY[k] + R[k, j] * np.sin(a), z))
for k in range(len(zs) - 1):
    for j in range(NA):
        a_, b_ = k * NA + j, k * NA + (j + 1) % NA
        fs.append((a_, b_, b_ + NA, a_ + NA))
for k, inverte in ((0, True), (len(zs) - 1, False)):
    centro = len(vs)
    vs.append((CX[k], CY[k], zs[k]))
    for j in range(NA):
        f_ = (k * NA + j, k * NA + (j + 1) % NA, centro)
        fs.append(f_[::-1] if inverte else f_)
for a, b, rc in capsulas:
    eixo = (b - a) / np.linalg.norm(b - a)
    u = np.cross(eixo, [0, 1, 0])
    u /= np.linalg.norm(u)
    w = np.cross(eixo, u)
    # perfil: meia esfera em cima, cilindro, meia esfera embaixo (anéis de 24 pontos)
    perfil_c = [(a - eixo * rc * np.cos(x), rc * np.sin(x)) for x in np.linspace(0, np.pi / 2, 5)[1:]]
    perfil_c += [(a + (b - a) * t, rc) for t in np.linspace(0, 1, 8)[1:-1]]
    perfil_c += [(b + eixo * rc * np.cos(x), rc * np.sin(x)) for x in np.linspace(np.pi / 2, 0, 5)[:-1]]
    base = len(vs)
    for centro_c, rr in perfil_c:
        for th in np.linspace(0, 2 * np.pi, 24, endpoint=False):
            vs.append(tuple(centro_c + rr * (np.cos(th) * u + np.sin(th) * w)))
    nr = len(perfil_c)
    for k in range(nr - 1):
        for j in range(24):
            a_, b_ = base + k * 24 + j, base + k * 24 + (j + 1) % 24
            fs.append((a_, b_, b_ + 24, a_ + 24))
    for k, ponta in ((0, a - eixo * rc), (nr - 1, b + eixo * rc)):
        idx = len(vs)
        vs.append(tuple(ponta))
        for j in range(24):
            fs.append((base + k * 24 + j, base + k * 24 + (j + 1) % 24, idx))
me_m = bpy.data.meshes.new("LEO_manequim")
me_m.from_pydata([tuple(map(float, v)) for v in vs], [], fs)
bm = bmesh.new()
bm.from_mesh(me_m)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(me_m)
bm.free()
manequim = bpy.data.objects.new("LEO_manequim", me_m)
fisica.objects.link(manequim)
manequim.hide_render = True
manequim.display_type = "WIRE"
marca("manequim")

# ---------------------------------------------------------------- casca de fora: a mais longe do manequim do par
# Cada face tem um par do outro lado do tecido (raio pela normal invertida, a uns 1 a 1,4 cm). Das duas, a de fora
# é a mais longe do corpo. Vale também na manga (o braço está dentro dela) e na gola dobrada; a face de dentro vista
# pela barra (que um teste de visibilidade daria como "de fora") cai certo. Borda do tecido (sem par perto) fica.
me = cam.data
cen, nor, _ = dados_faces(me)
nf = len(cen)
bvh_cam = BVHTree.FromObject(cam, bpy.context.evaluated_depsgraph_get())
pares = np.full((nf, 3), np.nan)
for i in range(nf):
    c = Vector(cen[i])
    n = Vector(nor[i])
    h = bvh_cam.ray_cast(c - n * 1e-5, -n, P["casca_par_max"])
    if h[0] is not None and h[1].dot(n) < 0:  # o par: a outra face do tecido (o raio sai do material por ela)
        pares[i] = h[0][:]
tem_par = ~np.isnan(pares[:, 0])
fora = np.ones(nf, bool)
# distância ao manequim (tronco em anéis e braços em cápsulas): abaixo da manga o braço fica por fora da camisa, e a
# distância ao corpo inteiro enganaria a comparação ali
fora[tem_par] = distancia(cen[tem_par])[0] >= distancia(pares[tem_par])[0]
# limpeza: maioria entre as faces vizinhas (por vértice), duas passadas
assert all(p.loop_total == 3 for p in me.polygons), "a camisa gerada devia ser só de triângulos"
tri_v = np.empty(len(me.loops), np.int64)
me.loops.foreach_get("vertex_index", tri_v)
tri_v = tri_v.reshape(-1, 3)
nv = len(me.vertices)
for _ in range(2):
    soma = np.bincount(tri_v.ravel(), weights=np.repeat(fora.astype(float), 3), minlength=nv)
    cont = np.bincount(tri_v.ravel(), minlength=nv)
    frac_v = soma / np.maximum(cont, 1)
    fora = frac_v[tri_v].mean(1) > 0.5
espessuras_geradas = []
for i in np.random.default_rng(0).choice(np.nonzero(fora)[0], min(2000, int(fora.sum())), replace=False):
    h = bvh_cam.ray_cast(Vector(cen[i]) - Vector(nor[i]) * 1e-5, -Vector(nor[i]), 0.05)
    if h[0] is not None:
        espessuras_geradas.append(h[3])
relato["faces_fora"] = int(fora.sum())
relato["faces_dentro"] = int((~fora).sum())
print("CASCA fora", relato["faces_fora"], "dentro", relato["faces_dentro"])
marca("casca de fora")

# ---------------------------------------------------------------- a camisa alta fica só com a casca de fora
# A casca de dentro gerada (1 a 1,4 cm para dentro) fura a de fora quando o tecido dobra. Roupa 3D se faz com uma
# camada e espessura por Solidify, que acompanha a de fora em qualquer dobra: é o que fica aqui.
bm = bmesh.new()
bm.from_mesh(me)
bm.faces.ensure_lookup_table()
bmesh.ops.delete(bm, geom=[bm.faces[i] for i in np.nonzero(~fora)[0]], context="FACES")
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
bm.to_mesh(me)
bm.free()
if me.has_custom_normals:
    with bpy.context.temp_override(object=cam, active_object=cam):
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
me.shade_smooth()
nv = len(me.vertices)
relato["espessura_gerada_m"] = round(float(np.median(espessuras_geradas)), 4) if espessuras_geradas else None
print("CASCA a camisa alta ficou com", len(me.polygons), "faces (só a de fora)")


def espalhar(campo, ar, n, vezes, fixos=None):
    cont = np.bincount(ar.ravel(), minlength=n)
    for _ in range(vezes):
        soma = np.zeros_like(campo)
        for k in range(campo.shape[1]):
            soma[:, k] = np.bincount(ar[:, 0], weights=campo[ar[:, 1], k], minlength=n) + \
                np.bincount(ar[:, 1], weights=campo[ar[:, 0], k], minlength=n)
        novo = 0.5 * campo + 0.5 * soma / np.maximum(cont, 1)[:, None]
        if fixos is not None:
            novo[fixos] = campo[fixos]
        campo = novo
    return campo


# ---------------------------------------------------------------- malha de simulação: casca de fora em quads
tmp_dir = DIR_VESTIR / "tmp"
tmp_dir.mkdir(exist_ok=True)
casca = cam.copy()  # a camisa alta já é só a casca de fora
casca.data = me.copy()
casca.modifiers.clear()
cena.collection.objects.link(casca)
for o in cena.objects:
    o.select_set(o is casca)
bpy.context.view_layer.objects.active = casca
entrada, saida = tmp_dir / "casca.obj", tmp_dir / "casca_quads.obj"
bpy.ops.wm.obj_export(filepath=str(entrada), export_selected_objects=True, forward_axis="Y", up_axis="Z",
                      export_materials=False, export_uv=False, export_normals=False, apply_modifiers=False)
# o -f do Instant Meshes conta vértices de campo: a malha sai com umas 4 vezes isso em quads
r = subprocess.run([str(IM), "-o", str(saida), "-f", str(P["sim_faces"] // 4), "-d", "-b", "-S", "2", "-r", "4", "-p", "4",
                    str(entrada)], capture_output=True, text=True)
if not saida.exists():
    raise SystemExit("Instant Meshes falhou: " + r.stdout[-500:] + r.stderr[-500:])
bpy.data.objects.remove(casca)
antes = set(bpy.data.objects)
bpy.ops.wm.obj_import(filepath=str(saida), forward_axis="Y", up_axis="Z")
sim = [o for o in bpy.data.objects if o not in antes][0]
sim.name = sim.data.name = "LEO_camisa_sim"
for c in sim.users_collection:
    c.objects.unlink(sim)
fisica.objects.link(sim)
sim.hide_render = True
bm = bmesh.new()
bm.from_mesh(sim.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)


def limpar(bm):
    """O Surface Deform recusa aresta com mais de duas faces; ponto solto cai com a gravidade: os dois saem."""
    tiradas = 0
    for _ in range(6):
        ruins = {f for e in bm.edges if len(e.link_faces) > 2 for f in e.link_faces}
        if not ruins:
            break
        tiradas += len(ruins)
        bmesh.ops.delete(bm, geom=list(ruins), context="FACES")
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    return tiradas


ruins = limpar(bm)
# o Surface Deform também recusa polígono côncavo, e os quads do Instant Meshes saem tortos aqui e ali: triângulos.
# Triângulo agulha ou aresta de comprimento quase zero faz a simulação explodir: colapsa o que é curto demais,
# vira as diagonais para abrir os ângulos e relaxa os vértices no plano da superfície (a forma não muda).
bmesh.ops.dissolve_degenerate(bm, dist=P["sim_aresta_min"], edges=bm.edges[:])
bmesh.ops.triangulate(bm, faces=bm.faces[:])
for _ in range(3):
    bmesh.ops.beautify_fill(bm, faces=bm.faces[:], edges=bm.edges[:])
    bmesh.ops.dissolve_degenerate(bm, dist=P["sim_aresta_min"], edges=bm.edges[:])
ruins += limpar(bm)
bm.verts.ensure_lookup_table()
borda = np.array([v.is_boundary for v in bm.verts])
for _ in range(P["sim_relaxa"]):
    bm.normal_update()
    pos = np.array([v.co[:] for v in bm.verts])
    nrm = np.array([v.normal[:] for v in bm.verts])
    media = np.array([np.mean([e.other_vert(v).co[:] for e in v.link_edges], 0) if v.link_edges else v.co[:] for v in bm.verts])
    d = media - pos
    d -= nrm * (d * nrm).sum(1)[:, None]  # só no plano tangente
    d[borda] = 0
    for v, x in zip(bm.verts, pos + 0.5 * d):
        v.co = x
for _ in range(2):
    bmesh.ops.beautify_fill(bm, faces=bm.faces[:], edges=bm.edges[:])
ruins += limpar(bm)
comp = np.array([e.calc_length() for e in bm.edges])
relato["sim_aresta_mm"] = [round(float(x) * 1000, 2) for x in np.percentile(comp, [0, 1, 50, 99, 100])]
# só a maior ilha (pedaços soltos não têm onde se apoiar)
bm.verts.ensure_lookup_table()
visto, ilhas = set(), []
for v in bm.verts:
    if v.index in visto:
        continue
    pilha, ilha = [v], []
    visto.add(v.index)
    while pilha:
        a = pilha.pop()
        ilha.append(a)
        for e in a.link_edges:
            b = e.other_vert(a)
            if b.index not in visto:
                visto.add(b.index)
                pilha.append(b)
    ilhas.append(ilha)
ilhas.sort(key=len)
for ilha in ilhas[:-1]:
    bmesh.ops.delete(bm, geom=ilha, context="VERTS")
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(sim.data)
bm.free()
relato["sim_tirado"] = {"faces_aresta_ruim": ruins, "ilhas_soltas": len(ilhas) - 1}
relato["sim_faces"] = len(sim.data.polygons)
print("SIM faces", relato["sim_faces"], "vértices", len(sim.data.vertices), "arestas mm (mín, p1, mediana, p99, máx)", relato["sim_aresta_mm"])


# ---------------------------------------------------------------- a camisa alta e a gravata seguem a de simulação
def amarrar(ob, alvo, nome="Segue_tecido"):
    md = ob.modifiers.new(nome, "SURFACE_DEFORM")
    md.target = alvo
    with bpy.context.temp_override(object=ob, active_object=ob):
        bpy.ops.object.surfacedeform_bind(modifier=md.name)
    bpy.context.view_layer.update()
    ob.evaluated_get(bpy.context.evaluated_depsgraph_get())
    return md


md_cam = amarrar(cam, sim)
md_grav = amarrar(grav, sim)
sol = cam.modifiers.new("Espessura", "SOLIDIFY")
sol.thickness = P["tecido_espessura"]
sol.offset = -1.0
sol.use_even_offset = False  # espessura uniforme faz espinho em vértice de borda; aqui não precisa
relato["amarrado"] = [md_cam.is_bound, md_grav.is_bound]
print("AMARRA camisa", md_cam.is_bound, "gravata", md_grav.is_bound)
marca("malha de simulação e amarra")
if not (md_cam.is_bound and md_grav.is_bound):
    raise SystemExit("Surface Deform não amarrou (ver os avisos do Blender acima)")

# ---------------------------------------------------------------- relaxamento: o tecido assenta no manequim
# Como um tecido sem tempo (dinâmica por posições): a cada passada um pouco de gravidade, quem está dentro sai pela
# direção de saída do manequim e cada aresta volta para o comprimento de repouso. Sai sem ponto dentro e sem
# triângulo esmagado, e a simulação do Blender parte em paz daí.
sme = sim.data
sco = coords(sme)
sar = np.empty(len(sme.edges) * 2, np.int64)
sme.edges.foreach_get("vertices", sar)
sar = sar.reshape(-1, 2)
alvo_d = P["tecido_espessura"] + P["tecido_folga"]
L0 = np.linalg.norm(sco[sar[:, 0]] - sco[sar[:, 1]], axis=1)
cont = np.bincount(sar.ravel(), minlength=len(sco)).astype(float)
d0, _ = distancia(sco)
relato["partida_pior_entrada"] = float(max(0.0, alvo_d - d0.min()))
for rodada in range(P["relaxa_rodadas"]):
    if rodada >= P["relaxa_gravidade_de"]:
        sco[:, 2] -= P["relaxa_gravidade"]
    d_, g_ = distancia(sco)
    falta = np.clip(alvo_d - d_, 0, None)
    sco = sco + g_ * falta[:, None]
    for _ in range(P["relaxa_arestas"]):
        dv = sco[sar[:, 1]] - sco[sar[:, 0]]
        L = np.linalg.norm(dv, axis=1)
        corr = ((L - L0) / np.maximum(L, 1e-9))[:, None] * dv * 0.5
        delta = np.zeros_like(sco)
        np.add.at(delta, sar[:, 0], corr)
        np.add.at(delta, sar[:, 1], -corr)
        sco = sco + delta / np.maximum(cont, 1)[:, None] * P["relaxa_rigidez"]
d_, g_ = distancia(sco)
falta = np.clip(alvo_d - d_, 0, None)
sco = sco + g_ * falta[:, None]
dv = sco[sar[:, 1]] - sco[sar[:, 0]]
estira = np.linalg.norm(dv, axis=1) / L0
relato["relaxa_estira"] = [round(float(x), 3) for x in np.percentile(estira, [1, 50, 99])]
relato["relaxa_pior_entrada"] = float(falta.max())
print("RELAXA partida pior entrada %.4f | fim: estiramento (p1, mediana, p99) %s, pior entrada %.4f" % (
    relato["partida_pior_entrada"], relato["relaxa_estira"], falta.max()))
marca("relaxamento")
gravar_coords(sme, sco)

json.dump(relato, open(DIR_VESTIR / "tecido.json", "w"), indent=1)
bpy.ops.wm.save_as_mainfile(filepath=str(DIR_VESTIR / "4-tecido-pre.blend"), compress=True)
print("VESTIR_TECIDO_PRE ok")
