"""Léo por peças, tudo do Meshy 7 Ultra: fotos finais do Léo vestido (estúdio claro, reflexo de verdade).

blender -b geracoes/vestir/5-fisica.blend --python bl_vestir_vitrine.py -- vestir-params.json

Quadro 1 (repouso), Cycles, luz de estúdio com HDRI do próprio Blender (dá o que refletir na lente, no olho e no
metal do óculos). Sai em renders/vestir/8-vitrine-*.png.
"""
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from vestir_comum import DIR_RENDER, foto, luz_estudio, params, preparar_render  # noqa: E402

P = params()
cena = bpy.context.scene
cena.frame_set(1)
preparar_render(cena, P["vitrine_amostras"])
luz_estudio(cena)
for o in bpy.data.objects:
    if o.name.startswith("LEO_corpo_col") or o.name in ("LEO_manequim", "LEO_camisa_sim", "LEO_gravata_sim"):
        o.hide_render = True
foto(cena, DIR_RENDER / "8-vitrine-heroi.png", (0.95, -2.3, 0.78), (0, 0, 0.55), 85, (1200, 1600))
foto(cena, DIR_RENDER / "8-vitrine-rosto.png", (0.18, -0.62, 0.9), (0, -0.05, 0.84), 85, (1200, 1200))
foto(cena, DIR_RENDER / "8-vitrine-costas.png", (-0.9, 2.1, 0.75), (0, 0, 0.55), 85, (1200, 1600))
print("VESTIR_VITRINE ok")
