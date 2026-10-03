"""Cédula genérica (nada da cédula real) feita no Blender 5.2, exportada em GLB. Pacote K09 do kit de motion do Legalizaí.

Uso (em segundo plano, sem salvar .blend):
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" --background --factory-startup \
        --python cedula.py -- <saida.glb> [--curva 0.004]

A textura é desenhada no PIL pelo KIT/modelos/texturas.py (Python do corte-viral, chamado daqui), na paleta da
marca: frente creme e verso coral, só ornamento (guilhoché, rosetas, faixa de segurança e moldura), sem número,
sem número de série, sem 'R$', sem brasão e sem texto. Fica embutida no GLB (JPEG, atlas de 1024 x 1024).

Geometria em metros, Y pra cima no GLB, frente olhando pra +Z:
- Cedula (raiz, centro da nota na origem)
  - Papel: 0,14 x 0,065 m, duas folhas a 0,12 mm uma da outra (frente pra +Z, verso pra -Z), material de uma face
    só (sem briga de profundidade); levemente curva no comprimento (as pontas recuam --curva metros, padrão 4 mm);
    o verso fica de pé quando a nota gira em torno do eixo vertical.
"""
import datetime
import os
import shutil
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bmesh  # noqa: E402
import bpy  # noqa: E402

import _comum as C  # noqa: E402

LARGURA, ALTURA = 0.14, 0.065
FOLGA = 0.00006  # meia distância entre as folhas
SEG_X, SEG_Z = 28, 12
# layout do atlas (mesmo do texturas.py): frente nas linhas 36 a 986 e verso nas linhas 1060 a 2010 de 2048
ATLAS, FACE_H, TOPO_FRENTE, TOPO_VERSO = 2048.0, 951.0, 36.0, 1060.0


def _v(linha):
    """Linha da imagem (0 no topo) pra v do Blender (0 embaixo); o exportador grava v' = 1 - v no GLB."""
    return 1.0 - linha / ATLAS


def papel(curva):
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    for lado, desloca in (("frente", -FOLGA), ("verso", FOLGA)):
        topo = TOPO_FRENTE if lado == "frente" else TOPO_VERSO
        grade = []
        for j in range(SEG_Z + 1):
            z = -ALTURA / 2 + ALTURA * j / SEG_Z
            linha = []
            for i in range(SEG_X + 1):
                x = -LARGURA / 2 + LARGURA * i / SEG_X
                y = curva * (2 * x / LARGURA) ** 2 + desloca  # Blender: -Y é a frente
                linha.append(bm.verts.new((x, y, z)))
            grade.append(linha)
        for j in range(SEG_Z):
            for i in range(SEG_X):
                q = [grade[j][i], grade[j][i + 1], grade[j + 1][i + 1], grade[j + 1][i]]
                if lado == "verso":
                    q.reverse()
                f = bm.faces.new(q)
                f.smooth = True
                for loop in f.loops:
                    x, z = loop.vert.co.x, loop.vert.co.z
                    u = (x + LARGURA / 2) / LARGURA if lado == "frente" else (LARGURA / 2 - x) / LARGURA
                    t = (z + ALTURA / 2) / ALTURA  # 0 embaixo, 1 em cima
                    loop[uv].uv = (u, _v(topo + FACE_H) + t * (_v(topo) - _v(topo + FACE_H)))
    return C.bm_para_malha(bm, "Papel")


def textura(pasta):
    caminho = os.path.join(pasta, "cedula.jpg")
    script = os.path.join(C.MODELOS, "texturas.py")
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
    r = subprocess.run([C.PY, "-B", script, "cedula", caminho], capture_output=True, text=True, env=env)
    print(r.stdout.strip())
    if r.returncode != 0 or not os.path.isfile(caminho):
        raise SystemExit("falha ao desenhar a textura: %s" % r.stderr[-800:])
    return caminho


def principal():
    a = C.argumentos(["saida"], {"curva": 0.004})
    C.limpa_cena()
    pasta = tempfile.mkdtemp(prefix="k09-cedula-")
    try:
        mat, _ = C.material_textura("Cedula", textura(pasta), rugosidade=0.82)
        raiz = C.vazio("Cedula")
        ob = C.objeto("Papel", papel(a["curva"]), raiz)
        ob.data.materials.append(mat)
        extras = {
            "titulo": "Cédula genérica",
            "autor": "Legalizaí (modelo próprio)",
            "licenca": "própria",
            "gerador": "KIT/modelos/blender/cedula.py (textura do KIT/modelos/texturas.py, PIL)",
            "parametros": {"curva": a["curva"]},
            "geradoEm": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
            "conteudo": "só ornamento na paleta da marca; sem número, sem número de série, sem R$, sem brasão e sem texto",
            "kit": "Legalizaí, kit de motion, pacote K09",
        }
        C.exporta_glb(a["saida"], extras)
    finally:
        shutil.rmtree(pasta, ignore_errors=True)  # só a pasta temporária criada aqui


principal()
