"""Notebook genérico (sem logo) feito no Blender 5.2, exportado em GLB. Pacote K09 do kit de motion do Legalizaí.

Uso (em segundo plano, sem salvar .blend):
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" --background --factory-startup \
        --python notebook.py -- <saida.glb> [--acabamento grafite|aluminio] [--abertura 110]

Em metros, com Y pra cima no GLB e a frente (tela e teclado) olhando pra +Z quando aberto:
- Notebook (raiz, na origem: centro da base, embaixo)
  - Base: 0,31 x 0,215 x 0,016 m, cantos arredondados (raio 12 mm) e bordas de 2 e 1,5 mm
    - Teclado (teclas baixas e escuras), Trackpad, Dobradica
  - Tampa: pivô no eixo da dobradiça (x), aberta a --abertura graus (padrão 110): no three.js, rotation.x = 0
    fecha e rotation.x = -abertura em radianos abre
    - Moldura (vidro preto) e Tela: plano 16:10 de 0,296 x 0,185 m, malha separada com UV de 0 a 1, u da esquerda
      pra direita e v = 1 no topo (como a Tela do celular): CanvasTexture de 2560 x 1600 com flipY = true
Materiais: Carcaca, Trackpad e Dobradica no acabamento escolhido (grafite fosco #3A3D44 ou alumínio claro
#D9D6D0), Teclas, Moldura e Tela. Até 20 mil triângulos e 1,5 MB.
"""
import datetime
import math
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bmesh  # noqa: E402
import bpy  # noqa: E402

import _comum as C  # noqa: E402

LARGURA, PROFUNDIDADE, ALTURA_BASE = 0.31, 0.215, 0.016
ESPESSURA_TAMPA = 0.0055
EIXO_Y = PROFUNDIDADE / 2 - 0.004      # eixo da dobradiça, 4 mm pra dentro da borda de trás
EIXO_Z = ALTURA_BASE + 0.0035          # 3,5 mm acima do tampo da base
TELA_L, TELA_A = 0.296, 0.185          # 16:10
TELA_TOPO = -(PROFUNDIDADE - 0.004) + 0.008   # borda de cima da tela, no espaço da tampa (8 mm de moldura)
TELA_Z = -0.003 - 0.0006               # 0,3 mm à frente da moldura

ACABAMENTOS = {
    "grafite": {"Carcaca": ("#3A3D44", 0.55, 0.25), "Trackpad": ("#34373E", 0.36, 0.2),
                "Dobradica": ("#2B2D32", 0.42, 0.5)},
    "aluminio": {"Carcaca": ("#D9D6D0", 0.38, 0.55), "Trackpad": ("#CFCBC4", 0.3, 0.5),
                 "Dobradica": ("#A9A59E", 0.35, 0.6)},
}


def materiais(acabamento):
    m = {nome: C.material(nome, cor, rugosidade=r, metalico=me) for nome, (cor, r, me) in ACABAMENTOS[acabamento].items()}
    m["Teclas"] = C.material("Teclas", "#1E2025", rugosidade=0.65)
    m["Moldura"] = C.material("Moldura", "#0E0F11", rugosidade=0.12)
    m["Tela"] = C.material("Tela", "#050608", rugosidade=0.25)
    return m


def com_material(ob, mat):
    ob.data.materials.append(mat)
    return ob


def teclado():
    """Teclas baixas (0,9 mm acima do tampo), 15 unidades de 18,2 mm de passo, seis fileiras."""
    u, folga = 0.0182, 0.0021
    fileiras = [
        ("f", [1] * 15),
        ("n", [1] * 13 + [2]),
        ("n", [1.5] + [1] * 12 + [1.5]),
        ("n", [1.75] + [1] * 11 + [2.25]),
        ("n", [2.25] + [1] * 10 + [2.75]),
        ("ult", [1, 1, 1, 1.5, 5, 1.5, 1, 1, 1, 1]),
    ]
    alt_f, alt_n = 0.0094, 0.0161
    y = 0.093  # borda de trás do teclado
    x0 = -15 * u / 2
    bm = bmesh.new()
    z0, h = ALTURA_BASE - 0.0002, 0.0011

    def tecla(cx, cy, larg, prof):
        C.adiciona_caixa(bm, larg, prof, h, 0.0016, 0.0, 0.0004, seg_canto=2, seg_borda=1,
                         desloca=(cx, cy, z0), suave=False)

    for tipo, larguras in fileiras:
        passo = 0.0115 if tipo == "f" else u
        prof = alt_f if tipo == "f" else alt_n
        cy = y - passo / 2
        x = x0
        for k, w in enumerate(larguras):
            cx = x + w * u / 2
            if tipo == "ult" and k >= 7:  # setas: esquerda e direita baixas, cima e baixo empilhadas
                meia = (prof - folga / 2) / 2
                if k == 8:
                    tecla(cx, cy + meia / 2 + folga / 4, w * u - folga, meia)
                tecla(cx, cy - meia / 2 - folga / 4, w * u - folga, meia)
            else:
                tecla(cx, cy, w * u - folga, prof)
            x += w * u
        y -= passo
    return C.bm_para_malha(bm, "Teclado")


def dobradica():
    bm = bmesh.new()
    r, meio, n = 0.0042, 0.125, 24
    aneis = []
    for x in (-meio, meio):
        aneis.append([bm.verts.new((x, EIXO_Y + r * math.cos(2 * math.pi * k / n), EIXO_Z + r * math.sin(2 * math.pi * k / n)))
                      for k in range(n)])
    a, b = aneis
    for k in range(n):
        f = bm.faces.new((a[k], b[k], b[(k + 1) % n], a[(k + 1) % n]))
        f.smooth = True
    for f in (bm.faces.new(list(reversed(a))), bm.faces.new(b)):
        for e in f.edges:
            e.smooth = False
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return C.bm_para_malha(bm, "Dobradica")


def tela():
    """Plano 16:10 no espaço da tampa, normal pra -Z local (pra frente quando aberto), UV de 0 a 1.

    No Blender o v cresce de cima pra baixo (v = 0 na borda longe da dobradiça), porque o exportador de glTF grava
    v' = 1 - v: no GLB a borda de cima fica com v = 1, como a Tela do celular (CanvasTexture com flipY = true).
    """
    bm = bmesh.new()
    x0, x1 = -TELA_L / 2, TELA_L / 2
    y_topo, y_base = TELA_TOPO, TELA_TOPO + TELA_A
    vs = [bm.verts.new((x0, y_base, TELA_Z)), bm.verts.new((x1, y_base, TELA_Z)),
          bm.verts.new((x1, y_topo, TELA_Z)), bm.verts.new((x0, y_topo, TELA_Z))]
    f = bm.faces.new(vs)
    f.normal_update()
    if f.normal.z > 0:
        f.normal_flip()
    uv = bm.loops.layers.uv.new("UVMap")
    for loop in f.loops:
        x, y = loop.vert.co.x, loop.vert.co.y
        loop[uv].uv = ((x - x0) / TELA_L, (y - y_topo) / TELA_A)
    return C.bm_para_malha(bm, "Tela")


def monta(acabamento, abertura):
    C.limpa_cena()
    mats = materiais(acabamento)
    raiz = C.vazio("Notebook")
    base = com_material(C.objeto("Base", C.caixa_arredondada("Base", LARGURA, PROFUNDIDADE, ALTURA_BASE, 0.012,
                                                             borda_baixo=0.002, borda_cima=0.0015, seg_canto=10,
                                                             seg_borda=4), raiz), mats["Carcaca"])
    com_material(C.objeto("Teclado", teclado(), base), mats["Teclas"])
    com_material(C.objeto("Trackpad", C.caixa_arredondada("Trackpad", 0.125, 0.075, 0.0004, 0.006, borda_cima=0.0002,
                                                         seg_canto=8, seg_borda=1,
                                                         desloca=(0.0, -0.06, ALTURA_BASE - 0.0002)), base),
                 mats["Trackpad"])
    com_material(C.objeto("Dobradica", dobradica(), base), mats["Dobradica"])
    meio_y = -(PROFUNDIDADE - 0.004) / 2 + 0.002
    tampa = com_material(C.objeto("Tampa", C.caixa_arredondada("Tampa", LARGURA, PROFUNDIDADE, ESPESSURA_TAMPA, 0.012,
                                                              borda_baixo=0.0012, borda_cima=0.002, seg_canto=10,
                                                              seg_borda=4, desloca=(0.0, meio_y, -0.003)),
                                  raiz, local=(0.0, EIXO_Y, EIXO_Z)), mats["Carcaca"])
    tampa.rotation_euler = (-math.radians(abertura), 0.0, 0.0)
    com_material(C.objeto("Moldura", C.caixa_arredondada("Moldura", LARGURA - 0.003, PROFUNDIDADE - 0.003, 0.0004,
                                                        0.0105, seg_canto=10, desloca=(0.0, meio_y, -0.0033),
                                                        suave=False), tampa), mats["Moldura"])
    com_material(C.objeto("Tela", tela(), tampa), mats["Tela"])
    bpy.context.view_layer.update()
    return raiz


def triangulos():
    dg = bpy.context.evaluated_depsgraph_get()
    total = 0
    for ob in bpy.data.objects:
        if ob.type == "MESH":
            me = ob.evaluated_get(dg).to_mesh()
            me.calc_loop_triangles()
            total += len(me.loop_triangles)
            ob.evaluated_get(dg).to_mesh_clear()
    return total


def principal():
    a = C.argumentos(["saida"], {"acabamento": "grafite", "abertura": 110.0})
    if a["acabamento"] not in ACABAMENTOS:
        raise SystemExit("acabamento desconhecido: %s (use grafite ou aluminio)" % a["acabamento"])
    monta(a["acabamento"], a["abertura"])
    tri = triangulos()
    print("K09_TRIANGULOS", tri)
    if tri > 20000:
        raise SystemExit("passou de 20 mil triângulos: %d" % tri)
    extras = {
        "titulo": "Notebook genérico (%s)" % a["acabamento"],
        "autor": "Legalizaí (modelo próprio, sem logo)",
        "licenca": "própria",
        "gerador": "KIT/modelos/blender/notebook.py",
        "parametros": {"acabamento": a["acabamento"], "abertura": a["abertura"]},
        "geradoEm": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "tela": "nó Tela, 16:10, UV de 0 a 1 com v = 1 no topo: CanvasTexture 2560 x 1600 com flipY true",
        "tampa": "nó Tampa com pivô na dobradiça: rotation.x = 0 fecha; -%.0f graus abre" % a["abertura"],
        "kit": "Legalizaí, kit de motion, pacote K09",
    }
    destino = C.exporta_glb(a["saida"], extras)
    tam = os.path.getsize(destino)
    if tam > 1.5 * 1024 * 1024:
        raise SystemExit("o GLB passou de 1,5 MB: %d bytes" % tam)


principal()
