"""Símbolo 3D da marca em GLB, exportado do simbolo-9x16.blend da vinheta. Pacote K09 do kit de motion do Legalizaí.

Uso (em segundo plano; o .blend é aberto só pra leitura e NUNCA é salvo, então não nasce .blend1):
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" --background --factory-startup \
        --python simbolo.py -- <saida.glb> [--blend <caminho do .blend>]

O que sai (metros, Y pra cima, a face olhando pra +Z, centro do símbolo na origem, tamanho real 0,36 m):
- Simbolo (raiz)
  - SimboloCorpo: o corpo coral com o chanfro e o sombreado do .blend (modificadores aplicados na exportação),
    material CoralCorpo com o coral #F2643C exato (convertido de sRGB pra linear no baseColorFactor)
  - SimboloFace: a face com o check completo, que no .blend é uma sequência de quadros (tex-check/check_####.png)
    que não existe no disco; o último quadro (check inteiro) é refeito pelo KIT/modelos/texturas.py a partir do
    path do simbolo.svg (o mesmo do check-frames.mjs) e embutido como textura sRGB (coral #F2643C e check branco)
Câmera, luzes, chão e ações ficam fora. O md5 do .blend é conferido antes e depois.
"""
import datetime
import hashlib
import os
import shutil
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
from mathutils import Matrix  # noqa: E402

import _comum as C  # noqa: E402

BLEND = "C:/MKT-INSTA/Content Legalizai/marketing/3d/simbolo/simbolo-9x16.blend"
FICAM = {"simbolo": "Simbolo", "simbolo_corpo": "SimboloCorpo", "simbolo_face": "SimboloFace"}


def _md5(caminho):
    h = hashlib.md5()
    with open(caminho, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def textura_check(pasta):
    caminho = os.path.join(pasta, "check.png")
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
    r = subprocess.run([C.PY, "-B", os.path.join(C.MODELOS, "texturas.py"), "check", caminho], capture_output=True,
                       text=True, env=env)
    print(r.stdout.strip())
    if r.returncode != 0 or not os.path.isfile(caminho):
        raise SystemExit("falha ao desenhar o check: %s" % r.stderr[-800:])
    return caminho


def prepara(pasta):
    for ob in list(bpy.data.objects):
        if ob.name not in FICAM:
            bpy.data.objects.remove(ob, do_unlink=True)
    for ob in bpy.data.objects:
        ob.animation_data_clear()
    for ac in list(bpy.data.actions):
        bpy.data.actions.remove(ac)
    raiz = bpy.data.objects["simbolo"]
    gira = Matrix.Rotation(1.5707963267948966, 4, "X")  # a face (+Z local) passa a olhar pra -Y (frente do Blender)
    for nome in ("simbolo_corpo", "simbolo_face"):
        ob = bpy.data.objects[nome]
        if ob.data.users > 1:
            ob.data = ob.data.copy()
        ob.data.transform(gira @ ob.matrix_local)
        ob.matrix_parent_inverse = Matrix.Identity(4)
        ob.matrix_basis = Matrix.Identity(4)
    raiz.matrix_basis = Matrix.Identity(4)
    corpo, face = bpy.data.objects["simbolo_corpo"], bpy.data.objects["simbolo_face"]
    # corpo: o coral do .blend é (0,888; 0,127; 0,045), arredondado; aqui vai o #F2643C exato em linear
    mat = corpo.material_slots[0].material
    mat.name = "CoralCorpo"
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = C.linear("#F2643C")
    mat.use_backface_culling = True
    # face: troca o Mix Shader com a sequência ausente por um material com a textura do check completo
    velho = face.material_slots[0].material
    nova, _ = C.material_textura("FaceCheck", textura_check(pasta), rugosidade=0.4, revestimento=0.06, especular=0.2)
    face.data.materials.clear()
    face.data.materials.append(nova)
    bpy.data.materials.remove(velho)
    for img in list(bpy.data.images):
        if img.source == "SEQUENCE":
            bpy.data.images.remove(img)
    for antigo, novo in FICAM.items():
        ob = bpy.data.objects[antigo]
        ob.name = novo
        if ob.type == "MESH":
            ob.data.name = novo
    bpy.context.view_layer.update()


def principal():
    a = C.argumentos(["saida"], {"blend": BLEND})
    blend = os.path.abspath(a["blend"])
    irmao = blend + "1"
    md5_antes = _md5(blend)
    tinha_blend1 = os.path.exists(irmao)
    bpy.ops.wm.open_mainfile(filepath=blend, load_ui=False, use_scripts=False)  # só leitura: nunca salvar
    pasta = tempfile.mkdtemp(prefix="k09-simbolo-")
    try:
        prepara(pasta)
        for ob in bpy.data.objects:
            print("K09_OBJ", ob.name, ob.type, "pai", ob.parent.name if ob.parent else None,
                  "mats", [s.material.name for s in ob.material_slots if s.material])
        extras = {
            "titulo": "Símbolo da marca Legalizaí (3D)",
            "autor": "Legalizaí (marca própria)",
            "licenca": "própria",
            "origem": "marketing/3d/simbolo/simbolo-9x16.blend (md5 %s), aberto só pra leitura" % md5_antes,
            "gerador": "KIT/modelos/blender/simbolo.py (check do KIT/modelos/texturas.py)",
            "geradoEm": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
            "cor": "corpo #F2643C (linear no baseColorFactor); face com textura sRGB coral e check branco",
            "kit": "Legalizaí, kit de motion, pacote K09",
        }
        C.exporta_glb(a["saida"], extras, aplica_modificadores=True)
    finally:
        shutil.rmtree(pasta, ignore_errors=True)  # só a pasta temporária criada aqui
    md5_depois = _md5(blend)
    novo_blend1 = os.path.exists(irmao) and not tinha_blend1
    print("K09_BLEND md5 antes %s depois %s; .blend1 novo: %s" % (md5_antes, md5_depois, novo_blend1))
    if md5_antes != md5_depois or novo_blend1:
        raise SystemExit("o .blend mudou ou ganhou .blend1: pare e confira")


principal()
