"""Léo por peças, tudo do Meshy 7 Ultra, passo 3: a camisa do Meshy, com a cor do Tripo, vestida no corpo do Meshy.

blender -b geracoes/vestir/2-oculos.blend --python bl_vestir_camisa.py -- vestir-params.json

- importa camisa_glb, solda e troca a textura de cor pela camisa_cor_png (Pedro, 30/10: "a blusa do Meshy com a
  cor do Tripo");
- tira a gravata (faces escuras na frente da gola) para virar peça própria, LEO_gravata;
- encaixe: a camisa gerada é estreita para este corpo (barriga de uns 28 cm de largura), então a escala na largura e
  na profundidade é maior que na altura (com limite de deformação, o resto o tecido estica na simulação); a barra
  fica na altura da folha, a gola é alinhada ao pescoço (cisalhamento suave só na parte de cima) e as mangas giram
  no ombro até a direção do braço;
- a gravata volta à proporção dela (escala igual nos três eixos) e senta na frente da gola.
Sai: geracoes/vestir/3-camisa.blend, geracoes/vestir/camisa.json e renders/vestir/3-camisa-*.png.
"""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vestir_comum import (DIR_RENDER, DIR_VESTIR, amostra_por_face, coords, dados_faces, foto, gravar_coords,  # noqa: E402
                          importar, luz_estudio, no_cor, params, perfil_radial, perimetro_convexo, preparar_render,
                          secoes, separar_faces, triangulos)

P = params()
M = json.load(open(DIR_VESTIR / "corpo.json", encoding="utf-8"))
H = M["altura"]
cena = bpy.context.scene
leo = bpy.data.collections["Leo"]
colisao = bpy.data.objects["LEO_corpo_colisao"]


def suave(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- camisa: importa, solda e troca a cor
cam = importar(P["camisa_glb"], "LEO_camisa")
for c in cam.users_collection:
    c.objects.unlink(cam)
leo.objects.link(cam)
bm = bmesh.new()
bm.from_mesh(cam.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bm.to_mesh(cam.data)
bm.free()
mat = cam.material_slots[0].material
mat.name = "LEO_camisa"
no = no_cor(mat)
velha = no.image
no.image = bpy.data.images.load(P["camisa_cor_png"])
no.image.name = "LEO_camisa_cor"
bpy.data.images.remove(velha)

# ---------------------------------------------------------------- gravata: faces escuras na frente da gola
cen, _, _ = dados_faces(cam.data)
val = amostra_por_face(cam, no.image)[:, :3].max(1)
z0, z1 = cen[:, 2].min(), cen[:, 2].max()
zr = (cen[:, 2] - z0) / (z1 - z0)
grav = (val < P["gravata_val_max"]) & (zr > 0.6) & (cen[:, 1] < 0) & (np.abs(cen[:, 0]) < 0.4 * np.abs(cen[:, 0]).max())
gravata = separar_faces(cam, grav, "LEO_gravata")
print("GRAVATA faces", int(grav.sum()))

# ---------------------------------------------------------------- medidas: camisa (bruta) e corpo
co = coords(cam.data)
tri = triangulos(cam.data)
z0, z1 = co[:, 2].min(), co[:, 2].max()
alt_cam = z1 - z0


def tronco_interno(z):
    """Laço interno do tronco da camisa em z: o de menor perímetro entre os que passam por x = 0."""
    ls = [l for l in secoes(co, tri, z) if len(l) > 20 and l[:, 0].min() < 0 < l[:, 0].max()]
    return min(ls, key=perimetro_convexo) if ls else None


meds = []
for t in np.linspace(0.08, 0.45, 10):
    l = tronco_interno(z0 + t * alt_cam)
    if l is not None:
        meds.append((l[:, 0].max() - l[:, 0].min(), l[:, 1].max() - l[:, 1].min(), l[:, 0].mean(), (l[:, 1].max() + l[:, 1].min()) / 2))
meds = np.array(meds)
larg_in, prof_in, cx_in, cy_in = np.median(meds, 0)
gola = [l for l in secoes(co, tri, z0 + P["camisa_gola_medida"] * alt_cam) if len(l) > 20]
gola = max(gola, key=perimetro_convexo)
cx_g, cy_g = (gola[:, 0].max() + gola[:, 0].min()) / 2, (gola[:, 1].max() + gola[:, 1].min()) / 2
print("CAMISA bruta altura %.3f tronco interno %.3f x %.3f centro (%.3f, %.3f) gola centro (%.3f, %.3f)"
      % (alt_cam, larg_in, prof_in, cx_in, cy_in, cx_g, cy_g))

cc = coords(colisao.data)
ct = triangulos(colisao.data)


def tronco_corpo(z):
    ls = [l for l in secoes(cc, ct, z) if len(l) > 30 and l[:, 0].min() < 0 < l[:, 0].max()]
    return max(ls, key=perimetro_convexo) if ls else None


corpo_m = []
for zrel in np.arange(P["barra"], P["axila"], 0.01):
    l = tronco_corpo(zrel * H)
    if l is not None:
        corpo_m.append((zrel, l[:, 0].min(), l[:, 0].max(), l[:, 1].min(), l[:, 1].max()))
corpo_m = np.array(corpo_m)
larg_corpo = (corpo_m[:, 2] - corpo_m[:, 1]).max()
prof_corpo = (corpo_m[:, 4] - corpo_m[:, 3]).max()
cy_corpo = np.median((corpo_m[:, 4] + corpo_m[:, 3]) / 2)
pesc = tronco_corpo(P["pescoco"] * H)
cx_n, cy_n = (pesc[:, 0].max() + pesc[:, 0].min()) / 2, (pesc[:, 1].max() + pesc[:, 1].min()) / 2
print("CORPO tronco %.3f x %.3f (centro y %.3f) pescoço centro (%.3f, %.3f) largura %.3f"
      % (larg_corpo, prof_corpo, cy_corpo, cx_n, cy_n, pesc[:, 0].max() - pesc[:, 0].min()))

# ---------------------------------------------------------------- escalas e encaixe do tronco
folga = P["camisa_folga"]
sz = (P["gola_topo"] - P["barra"]) * H / alt_cam
sx = (larg_corpo + 2 * folga) / larg_in * (1 - P["camisa_estica"])
sy = (prof_corpo + 2 * folga) / prof_in * (1 - P["camisa_estica"])
sx = min(sx, sz * P["camisa_deforma_max"][0])
sy = min(sy, sz * P["camisa_deforma_max"][1])
print("ESCALAS x %.4f y %.4f z %.4f (largura/altura %.2f, profundidade/altura %.2f)" % (sx, sy, sz, sx / sz, sy / sz))


def encaixar(v):
    out = np.empty_like(v)
    out[:, 0] = (v[:, 0] - cx_in) * sx
    out[:, 1] = (v[:, 1] - cy_in) * sy + cy_corpo
    out[:, 2] = (v[:, 2] - z0) * sz + P["barra"] * H
    # gola no pescoço: a parte de cima desliza até o centro da gola cair no centro do pescoço
    t = (v[:, 2] - z0) / alt_cam
    w = suave(t, P["cisalha_de"], P["cisalha_ate"])
    out[:, 0] += w * (cx_n - (cx_g - cx_in) * sx)
    out[:, 1] += w * (cy_n - ((cy_g - cy_in) * sy + cy_corpo))
    return out


co_f = encaixar(co)
gco = coords(gravata.data)
gco_f = encaixar(gco)

# ---------------------------------------------------------------- mangas: giram no ombro até a direção do braço
def eixo_braco(sinal):
    """Eixo do braço: reta pelos centros dos laços em que o braço já está separado do tronco (abaixo da axila)."""
    soltos = []
    for zrel in np.arange(P["braco_de"], P["braco_ate"], 0.005):
        ls = [l for l in secoes(cc, ct, zrel * H) if len(l) > 30 and l[:, 0].mean() * sinal > 0.1]
        if ls:
            l = max(ls, key=perimetro_convexo)
            soltos.append((l.mean(0), perimetro_convexo(l) / (2 * math.pi)))
    pts = np.array([c for c, _ in soltos])
    c = pts.mean(0)
    d = np.linalg.svd(pts - c)[2][0]
    return c, (d if d[2] < 0 else -d), float(np.median([r for _, r in soltos]))


# ---------------------------------------------------------------- gola: abre em volta do pescoço
# A gola gerada fica mais estreita que o pescoço deste corpo: em cada altura da gola e em cada direção, o laço de
# dentro da camisa abre até ficar gola_folga para fora do pescoço (só abre, nunca fecha), suave em altura e ângulo.
NA_G = 48
ANG_G = np.linspace(-np.pi, np.pi, NA_G, endpoint=False)
tri_c = triangulos(cam.data)
z_gola = np.arange(P["gola_abre_de"] * H, co_f[:, 2].max(), 0.003)
K = np.ones((len(z_gola), NA_G))
for k_, z in enumerate(z_gola):
    lp = tronco_corpo(z)
    lc = [l for l in secoes(co_f, tri_c, z) if len(l) > 20]
    if lp is None or not lc:
        continue
    centro = ((lp[:, 0].max() + lp[:, 0].min()) / 2, (lp[:, 1].max() + lp[:, 1].min()) / 2)
    dentro = [l for l in lc if l[:, 0].min() < centro[0] < l[:, 0].max() and l[:, 1].min() < centro[1] < l[:, 1].max()]
    if not dentro:
        continue
    l_in = min(dentro, key=perimetro_convexo)
    r_p = perfil_radial(lp, centro, ANG_G)
    r_c = perfil_radial(l_in, centro, ANG_G)
    K[k_] = np.clip((r_p + P["gola_folga"]) / np.maximum(r_c, 1e-6), 1.0, P["gola_abre_max"])
for _ in range(4):
    K[1:-1] = 0.25 * K[:-2] + 0.5 * K[1:-1] + 0.25 * K[2:]
    K = 0.25 * np.roll(K, 1, 1) + 0.5 * K + 0.25 * np.roll(K, -1, 1)
for arr in (co_f, gco_f):
    dx, dy = arr[:, 0] - cx_n, arr[:, 1] - cy_n
    a_v = np.arctan2(dy, dx)
    fz = np.clip((arr[:, 2] - z_gola[0]) / 0.003, 0, len(z_gola) - 1)
    i0 = np.clip(np.floor(fz).astype(int), 0, len(z_gola) - 2)
    tz = fz - i0
    fa = (a_v + np.pi) / (2 * np.pi) * NA_G
    j0 = np.floor(fa).astype(int) % NA_G
    j1 = (j0 + 1) % NA_G
    sa = fa - np.floor(fa)
    k_v = (K[i0, j0] * (1 - sa) + K[i0, j1] * sa) * (1 - tz) + (K[i0 + 1, j0] * (1 - sa) + K[i0 + 1, j1] * sa) * tz
    k_v = np.where(arr[:, 2] >= z_gola[0], k_v, 1.0)
    arr[:, 0] = cx_n + dx * k_v
    arr[:, 1] = cy_n + dy * k_v
print("GOLA abre até %.2fx (média %.2fx onde abriu)" % (K.max(), K[K > 1.001].mean() if (K > 1.001).any() else 1.0))

arestas = np.empty(len(cam.data.edges) * 2, np.int64)
cam.data.edges.foreach_get("vertices", arestas)
arestas = arestas.reshape(-1, 2)
nv = len(co_f)


def espalhar(w, vezes):
    """Suaviza um campo por vértice pelas arestas da malha (a transição da manga para o tronco fica macia)."""
    cont = np.bincount(arestas.ravel(), minlength=nv)
    for _ in range(vezes):
        soma = np.bincount(arestas[:, 0], weights=w[arestas[:, 1]], minlength=nv) +             np.bincount(arestas[:, 1], weights=w[arestas[:, 0]], minlength=nv)
        w = 0.5 * w + 0.5 * soma / np.maximum(cont, 1)
    return w


alt_f = (co_f[:, 2] - P["barra"] * H) / (sz * alt_cam)
parede = np.percentile(np.abs(co_f[(alt_f > 0.2) & (alt_f < 0.45), 0]), 99)
for s in (1, -1):
    c_b, d_b, r_b = eixo_braco(s)
    manga = (co_f[:, 0] * s > parede) & (alt_f > 0.3)
    ext = co_f[manga, 0] * s
    ponta = co_f[manga][ext > np.percentile(ext, 90)].mean(0)  # centro do punho da manga
    raiz = np.array([s * parede, np.median(co_f[manga, 1]), co_f[manga, 2].max() - P["ombro_abaixo_topo"] * H])
    # o centro do punho vai para o eixo do braço, na mesma altura: a manga gira no ombro e desliza o que faltar
    alvo = c_b + d_b * (ponta[2] - c_b[2]) / d_b[2]
    if P["manga_so_plano_frontal"]:
        alvo[1] = ponta[1]  # desce no plano da frente; torcer para a frente abre uma fresta atrás da cava
    q = Vector(ponta - raiz).rotation_difference(Vector(alvo - raiz))
    R = np.array(q.to_matrix())
    resto = alvo - ((ponta - raiz) @ R.T + raiz)
    w = espalhar(manga.astype(float), P["manga_suaviza"])
    gir = (co_f - raiz) @ R.T + raiz + resto
    co_f += (gir - co_f) * w[:, None]
    print("MANGA", s, "raiz", raiz.round(3).tolist(), "punho", ponta.round(3).tolist(), "-> eixo do braço", alvo.round(3).tolist(),
          "raio braço %.3f" % r_b, "gira %.1f graus" % math.degrees(q.angle))

gravar_coords(cam.data, co_f)

# ---------------------------------------------------------------- gravata: proporção dela, na frente da gola
gc = gco_f.mean(0)
k = np.array([sz / sx, sz / sy, 1.0])
gco_f = (gco_f - gc) * k + gc
larg_cab = M["orelhas"]["E"]["centro"][0] - M["orelhas"]["D"]["centro"][0]
alvo_larg = P["gravata_larg_cabeca"] * larg_cab
gco_f = (gco_f - gc) * (alvo_larg / np.ptp(gco_f[:, 0])) + gc
gravar_coords(gravata.data, gco_f)
print("GRAVATA largura %.3f (cabeça %.3f)" % (np.ptp(gco_f[:, 0]), larg_cab))

for o in (cam, gravata):
    o.data.shade_smooth()

json.dump({"escala": [sx, sy, sz], "corpo_tronco": [larg_corpo, prof_corpo], "pescoco_centro": [cx_n, cy_n]},
          open(DIR_VESTIR / "camisa.json", "w"), indent=1)
bpy.ops.wm.save_as_mainfile(filepath=str(DIR_VESTIR / "3-camisa.blend"), compress=True)

# ---------------------------------------------------------------- fotos
preparar_render(cena, P["amostras"])
luz_estudio(cena)
colisao.hide_viewport = True
foto(cena, DIR_RENDER / "3-camisa-frente.png", (0, -2.2, 0.6), (0, 0, 0.56), 85, (800, 1000))
foto(cena, DIR_RENDER / "3-camisa-lado.png", (2.2, 0, 0.6), (0, 0, 0.56), 85, (800, 1000))
foto(cena, DIR_RENDER / "3-camisa-costas.png", (0, 2.2, 0.6), (0, 0, 0.56), 85, (800, 1000))
foto(cena, DIR_RENDER / "3-camisa-34.png", (1.4, -1.6, 0.75), (0, 0, 0.6), 85, (800, 1000))
print("VESTIR_CAMISA ok")
