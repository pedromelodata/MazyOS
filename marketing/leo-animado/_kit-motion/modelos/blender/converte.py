"""Converte um modelo baixado (glTF com arquivos soltos, ou GLB) em GLB único do kit, pelo Blender 5.2.

Pacote K09 do kit de motion do Legalizaí. Contrato: KIT/DESENHO.md, seções 4.9, 4.12 e 12.

Uso (em segundo plano, sem salvar .blend):
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" --background --factory-startup \
        --python converte.py -- <entrada.gltf|.glb> <saida.glb> --mapa <mapa.json>

O mapa (JSON) diz o que muda:
    raiz                nome do nó raiz novo (vazio na origem, pai de todos os objetos de cima)
    separaPorMaterial   objetos que viram um objeto por material
    objetosPorMaterial  {material original: nome novo} pros objetos de um material só (depois da separação)
    objetos             {nome original: nome novo} pros outros objetos
    materiais           {nome original: nome novo}
    imagens             {arquivo da textura: caminho da versão editada, absoluto ou relativo à pasta da
                        entrada} (por exemplo, texto apagado pelo KIT/modelos/limpa_texturas.py)
    semAlfaDaTextura    materiais (nome novo) em que o alfa vindo de textura sem canal alfa (JPEG) é desligado:
                        sem isso o exportador cria um PNG RGBA que duplica a textura de cor
    animacoes           true pra manter animação (padrão false)
    coresVertice        "MATERIAL" (padrão) ou "NONE"
    extras              vai pro asset.extras do GLB (título, autor, licença, fonte, mudanças)
O nome da malha segue o do objeto. Saída gravada pelo KIT/lib/escrita.py, com 400 MB livres conferidos antes.
"""
import json
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402

import _comum as C  # noqa: E402


def separa_por_material(ob):
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="MATERIAL")
    bpy.ops.object.mode_set(mode="OBJECT")
    return [o for o in bpy.context.selected_objects]


def materiais_usados(ob):
    usados = sorted({p.material_index for p in ob.data.polygons})
    return [ob.material_slots[i].material for i in usados if i < len(ob.material_slots)]


def principal():
    a = C.argumentos(["entrada", "saida"], {"mapa": None})
    if not a["mapa"]:
        raise SystemExit("falta --mapa <mapa.json>")
    with open(a["mapa"], encoding="utf-8") as f:
        mapa = json.load(f)
    C.limpa_cena()
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(a["entrada"]), import_pack_images=False)
    print("K09_IMPORTADO", [(o.name, o.type, o.data.name if o.data else None) for o in bpy.data.objects])

    for nome in mapa.get("separaPorMaterial", []):
        ob = bpy.data.objects.get(nome)
        if ob is None:
            raise SystemExit("objeto pra separar não existe: %s" % nome)
        separa_por_material(ob)

    por_mat = mapa.get("objetosPorMaterial", {})
    por_nome = mapa.get("objetos", {})
    renomear = []
    for ob in list(bpy.data.objects):
        novo = por_nome.get(ob.name)
        if novo is None and ob.type == "MESH":
            mats = materiais_usados(ob)
            if len(mats) == 1 and mats[0] is not None and mats[0].name in por_mat:
                novo = por_mat[mats[0].name]
        if novo:
            renomear.append((ob, novo))
    for ob, novo in renomear:  # dois passos, pra nome novo não colidir com nome antigo
        ob.name = "_k09_" + novo
    for ob, novo in renomear:
        ob.name = novo
        if ob.data is not None and ob.type == "MESH":
            if ob.data.users > 1:
                ob.data = ob.data.copy()
            ob.data.name = novo
    for antigo, novo in mapa.get("materiais", {}).items():
        m = bpy.data.materials.get(antigo)
        if m is None:
            raise SystemExit("material do mapa não existe: %s" % antigo)
        m.name = novo
    for nome_mat in mapa.get("semAlfaDaTextura", []):
        m = bpy.data.materials.get(nome_mat)
        if m is None or not m.use_nodes:
            raise SystemExit("material de semAlfaDaTextura não existe: %s" % nome_mat)
        for no in m.node_tree.nodes:
            if no.type == "BSDF_PRINCIPLED":
                for link in list(no.inputs["Alpha"].links):
                    if link.from_node.type == "TEX_IMAGE":
                        m.node_tree.links.remove(link)
                no.inputs["Alpha"].default_value = 1.0
        print("K09_SEM_ALFA", nome_mat)
    for arquivo_img, caminho in mapa.get("imagens", {}).items():
        achadas = [i for i in bpy.data.images
                   if os.path.basename(bpy.path.abspath(i.filepath)).lower() == arquivo_img.lower()]
        if len(achadas) != 1:
            raise SystemExit("imagem do mapa não achada (ou repetida): %s (há: %s)" %
                             (arquivo_img, [os.path.basename(i.filepath) for i in bpy.data.images]))
        novo = caminho if os.path.isabs(caminho) else os.path.join(os.path.dirname(os.path.abspath(a["entrada"])), caminho)
        if not os.path.isfile(novo):
            raise SystemExit("textura editada não existe: %s" % novo)
        achadas[0].filepath = novo
        achadas[0].reload()
        print("K09_TEXTURA_TROCADA", arquivo_img, novo)

    if mapa.get("raiz"):
        topo = [o for o in bpy.data.objects if o.parent is None]
        raiz = C.vazio(mapa["raiz"])
        bpy.context.view_layer.update()
        for o in topo:
            mw = o.matrix_world.copy()
            o.parent = raiz
            o.matrix_world = mw
    sem_nome = [o.name for o in bpy.data.objects if o.name not in set(por_nome.values()) | set(por_mat.values())
                and o.name != mapa.get("raiz")]
    if sem_nome:
        print("K09_AVISO objetos sem nome novo no mapa:", sem_nome)
    for o in bpy.data.objects:
        print("K09_OBJ", o.name, o.type, "pai", o.parent.name if o.parent else None,
              "mats", [s.material.name for s in o.material_slots if s.material])
    C.exporta_glb(a["saida"], mapa.get("extras", {}), aplica_modificadores=False,
                  cores_vertice=mapa.get("coresVertice", "MATERIAL"), animacoes=bool(mapa.get("animacoes")))


principal()
