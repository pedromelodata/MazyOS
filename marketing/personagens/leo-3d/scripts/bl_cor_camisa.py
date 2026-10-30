"""Leva a cor da camisa de um GLB para a de outro, mexendo só no coral (gravata preta e selo branco ficam).

blender -b --python bl_cor_camisa.py -- <glb_origem> <glb_cor_alvo> <png_saida>

Em Lab, canal por canal, a distribuição do coral da origem é casada com a do alvo (quantis), então os claros e
as sombras também batem; a máscara é suave (pela saturação e pelo matiz), então o tecido e as bordas continuam
os da origem.
Pedido do Pedro, 30/10/2026: "quero a blusa do Meshy, mas com a cor do Tripo".
"""
import sys

import bpy
import numpy as np

orig, alvo, saida = sys.argv[sys.argv.index("--") + 1:]


def textura(glb):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb)
    o = [x for x in bpy.data.objects if x.type == "MESH"][0]
    for s in o.material_slots:
        for n in s.material.node_tree.nodes:
            if n.type == "TEX_IMAGE" and n.image and any(l.to_socket.name == "Base Color" for l in n.outputs["Color"].links):
                im = n.image
                w, h = im.size
                px = np.empty(w * h * 4, dtype=np.float32)
                im.pixels.foreach_get(px)
                return px.reshape(h, w, 4), (w, h)
    raise SystemExit("sem textura de cor em " + glb)


def srgb_lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def lin_srgb(c):
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.maximum(c, 0), 1 / 2.4) - 0.055)


M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
BRANCO = np.array([0.95047, 1.0, 1.08883])


def para_lab(rgb):
    xyz = srgb_lin(rgb) @ M.T / BRANCO
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def de_lab(lab):
    fy = (lab[..., 0] + 16) / 116
    fx = fy + lab[..., 1] / 500
    fz = fy - lab[..., 2] / 200
    f = np.stack([fx, fy, fz], -1)
    xyz = np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787) * BRANCO
    return np.clip(lin_srgb(xyz @ np.linalg.inv(M).T), 0, 1)


def peso_coral(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    d = np.maximum(mx - mn, 1e-6)
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    eh_hue = np.clip(1 - np.abs(((hue + 0.5) % 1) - 0.5 - 0.035) / 0.06, 0, 1)   # em volta de 0,035 (coral)
    return np.clip((sat - 0.12) / 0.15, 0, 1) * np.clip((mx - 0.15) / 0.15, 0, 1) * eh_hue


pa, tam = textura(alvo)
ra = pa[..., :3]
wa = peso_coral(ra)
lab_a = para_lab(ra[wa > 0.8])
med_a = np.median(lab_a, 0)

po, tam_o = textura(orig)
ro = po[..., :3]
wo = peso_coral(ro)
lab_o_todo = para_lab(ro)
med_o = np.median(lab_o_todo[wo > 0.8], 0)
# casamento de distribuição (quantis) em cada canal Lab, dentro do coral: as sombras e os claros também batem
novo = lab_o_todo.copy()
q = np.linspace(0, 100, 257)
for k in range(3):
    fonte = np.percentile(lab_o_todo[..., k][wo > 0.8], q)
    destino = np.percentile(lab_a[:, k], q)
    novo[..., k] = np.interp(lab_o_todo[..., k], fonte, destino)
rgb_novo = de_lab(novo)
mix = wo[..., None]
saida_rgb = ro * (1 - mix) + rgb_novo * mix
img = bpy.data.images.new("camisa_cor", tam_o[0], tam_o[1], alpha=True)
img.pixels.foreach_set(np.dstack([saida_rgb, po[..., 3:4]]).astype(np.float32).ravel())
img.filepath_raw = saida
img.file_format = "PNG"
img.save()
conf = para_lab(saida_rgb[wo > 0.8])
print("COR alvo Lab", np.round(med_a, 1), "origem", np.round(med_o, 1), "resultado", np.round(np.median(conf, 0), 1))
print("COR_CAMISA ok")
