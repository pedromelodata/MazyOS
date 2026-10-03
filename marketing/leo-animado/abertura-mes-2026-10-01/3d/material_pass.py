# Passada de material (img2threejs): mapas sem emenda e grão de clay único, com cor por material.
#  - Os mapas do clay creme (extração de confiança 0,79, recorte limpo) viram tileáveis por espelhamento
#    (normal map com os canais X/Y invertidos nas metades espelhadas), o que tira a costura do verso.
#  - Bege e coral: os recortes deles pegaram bordas de botão/argola e geraram listras. O albedo deles passa a
#    ser o grão do creme normalizado em luminância e tingido com a cor dominante da receita extraída do
#    próprio componente (colorMaterialRecipe); rugosidade/normal/altura/AO vêm do creme (mesmo clay).
# Os originais ficam em pbr/<mat>/orig/ pra rastreabilidade.
import json, shutil, pathlib
import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).parent
PBR = HERE / "pbr"
CH = ["albedo", "roughness", "height", "normal", "ao"]


def tileable(a, normal=False):
    h, w = a.shape[:2]
    q = np.array(Image.fromarray(a).resize((w // 2, h // 2), Image.LANCZOS)).astype(np.float32)
    fx = q[:, ::-1].copy(); fy = q[::-1, :].copy(); fxy = q[::-1, ::-1].copy()
    if normal:  # espelhar inverte a componente da normal no eixo espelhado
        fx[..., 0] = 255 - fx[..., 0]
        fy[..., 1] = 255 - fy[..., 1]
        fxy[..., 0] = 255 - fxy[..., 0]; fxy[..., 1] = 255 - fxy[..., 1]
    top = np.concatenate([q, fx], 1); bot = np.concatenate([fy, fxy], 1)
    return np.clip(np.concatenate([top, bot], 0), 0, 255).astype(np.uint8)


def load(mat, ch):
    return np.array(Image.open(PBR / mat / f"{mat}_{ch}.png").convert("RGB"))


for mat in ["clay-cream", "clay-beige", "clay-coral"]:
    o = PBR / mat / "orig"
    o.mkdir(exist_ok=True)
    for ch in CH:
        src = PBR / mat / f"{mat}_{ch}.png"
        if not (o / src.name).exists():
            shutil.copy2(src, o / src.name)

cream = {ch: tileable(np.array(Image.open(PBR / "clay-cream" / "orig" / f"clay-cream_{ch}.png").convert("RGB")), ch == "normal") for ch in CH}
for ch in CH:
    Image.fromarray(cream[ch]).save(PBR / "clay-cream" / f"clay-cream_{ch}.png")

spec = json.load(open(HERE / "object-sculpt-spec.json", encoding="utf-8"))
recipe = {}
for c in spec["componentTree"]:
    m = c["material"]
    if m in ("clay-beige", "clay-coral") and m not in recipe and c["id"] != "stud-r2c3" or (m == "clay-coral" and c["id"].startswith("ring")):
        rgba = c["colorMaterialRecipe"]["dominantAlbedo"]
        recipe[m] = [int(v) for v in rgba[5:-1].split(",")[:3]]
lum = cream["albedo"].astype(np.float32).mean(2)
grain = lum / lum.mean()
for mat in ["clay-beige", "clay-coral"]:
    if mat == "clay-beige":  # contraste botão/corpo medido na referência (R, G, B)
        alb = np.clip(cream["albedo"].astype(np.float32) * np.array([0.927, 0.869, 0.799], np.float32), 0, 255).astype(np.uint8)
    else:
        col = np.array(recipe[mat], np.float32)
        alb = np.clip(grain[..., None] * col[None, None, :], 0, 255).astype(np.uint8)
    Image.fromarray(alb).save(PBR / mat / f"{mat}_albedo.png")
    for ch in ["roughness", "height", "normal", "ao"]:
        Image.fromarray(cream[ch]).save(PBR / mat / f"{mat}_{ch}.png")
    print(mat, "cor", recipe[mat], "albedo médio", alb.reshape(-1, 3).mean(0).round(1))

for m in spec["materials"]:
    m["localOverrides"] = [o for o in m.get("localOverrides", []) if not o.get("id", "").endswith("-tileable-grain")]
    m["localOverrides"].append({
        "id": f"{m['id']}-tileable-grain", "type": "material-map-evidence", "evidenceRefs": ["full-object"],
        "notes": ("material-pass: maps made tileable by mirroring (removes the repeat seam); "
                  + ("albedo = cream clay grain (beige: scaled by the stud/body ratio 0.927,0.869,0.799 measured on the reference; coral: tinted with the component's extracted dominantAlbedo; roughness/normal/height/AO shared "
                     "with the cream clay evidence because the original crops striped on edges (originals kept in pbr/<mat>/orig)."
                     if m["id"] != "clay-cream" else "cream evidence kept (confidence 0.79)."))})
json.dump(spec, open(HERE / "object-sculpt-spec.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("material ok")
