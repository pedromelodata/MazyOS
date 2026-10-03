"""Gera a camada de aquisições do catálogo de modelos: KIT/catalogos/modelos/aquisicoes-2026-10.json (pacote K09).

Roda no Python do corte-viral, sempre com -B:
    python -B cataloga.py [--saida <arquivo.json>]

Os dados de cada modelo (fonte, licença, crédito, orientação, render e notas) estão em ITENS, abaixo. Caixa, caixa
do arquivo, contagens, triângulos, extensões, md5 e tamanho são lidos do disco (KIT/catalogos/bbox_glb.py e
KIT/lib/escrita.py). O documento é validado contra KIT/catalogos/esquemas/modelos.schema.json antes de gravar, e a
gravação passa pelo escrita.py. Contrato: KIT/DESENHO.md, seção 4.9.
"""
import argparse
import datetime
import json
import os
import sys

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import glb  # noqa: E402  (põe KIT/lib no sys.path)
import escrita  # noqa: E402

sys.path.insert(0, os.path.join(glb.KIT, "catalogos"))
import bbox_glb  # noqa: E402
from jsonschema import Draft202012Validator  # noqa: E402

EXT = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d"
SAIDA = os.path.join(glb.KIT, "catalogos", "modelos", "aquisicoes-2026-10.json")
ESQUEMA = os.path.join(glb.KIT, "catalogos", "esquemas", "modelos.schema.json")
PI2 = 1.5707963267948966

LIC_PROPRIA = {"nome": "próprio", "url": None, "creditoObrigatorio": False, "credito": "Não se aplica",
               "creditoLegenda": None, "texto": "própria (Legalizaí)"}


def lic_polyhaven(autor):
    return {"nome": "CC0", "url": "https://polyhaven.com/license", "creditoObrigatorio": False,
            "credito": "Dispensa; cortesia %s, Poly Haven" % autor, "creditoLegenda": None,
            "texto": "CC0 (Poly Haven; página de licença conferida em 02/10)"}


def lic_ccby3(titulo, autor):
    return {"nome": "CC BY 3.0", "url": "https://creativecommons.org/licenses/by/3.0/", "creditoObrigatorio": True,
            "credito": "'%s' por %s (Poly Pizza, CC BY 3.0), modificado" % (titulo, autor),
            "creditoLegenda": {"trecho": "'%s' por %s" % (titulo, autor), "fonte": "Poly Pizza", "licenca": "CC BY 3.0"},
            "texto": "CC BY 3.0 (conferida no Poly Pizza em 02/10)"}


def ph(ident):
    return ("https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/%s/%s_1k.gltf (mais o .bin e as texturas de 1k, "
            "um arquivo por vez, md5 conferido com a API do Poly Haven)" % (ident, ident))


NOTEBOOK_NOTAS = (
    "Sem logo. Tampa com pivô na dobradiça (nó Tampa): rotation.x = 0 fecha e -1,919862 rad (110 graus, o padrão) "
    "abre. Tela 16:10 de 0,296 x 0,185 m em malha separada, UV de 0 a 1 com v = 1 no topo, como o celular: "
    "CanvasTexture de 2560 x 1600 com flipY = true e colorSpace sRGB, material sem tone mapping. Materiais "
    "Carcaca, Trackpad, Dobradica, Teclas, Moldura e Tela, todos de uma face só. Pedem: 09/10 (site que trava), "
    "12/10 (tela sendo ajustada e notebook fechado no fecho), 19 e 26/10 (mesa de cima com celular, notebook e "
    "café) e 30/10. Sombra 0,8 é palpite: calibrar na prova do K10.")

ITENS = [
    {"id": "glb-notebook-grafite", "arquivo": "notebook-grafite_legalizai_proprio.glb", "fonte": "próprio",
     "autor": "Legalizaí (modelo próprio)", "titulo": "Notebook genérico (grafite)", "url": None,
     "obtidoDe": "KIT/modelos/blender/notebook.py --acabamento grafite (Blender 5.2, em segundo plano, sem .blend)",
     "licenca": LIC_PROPRIA, "status": "liberado",
     "dimensoes": "base 0,31 x 0,215 x 0,016 m; tampa de 5,5 mm; aberto a 110 graus ocupa 0,31 x 0,219 x 0,286 m",
     "orientacao": {"frente": "+Z (tela e teclado; a tampa abre pra trás)", "cima": "+Y", "rotacaoPraCamera": [0, 0, 0]},
     "malhas": {"tela": "Tela", "moldura": "Moldura", "outras": ["Base", "Tampa", "Teclado", "Trackpad", "Dobradica"]},
     "render": {"tipoObjeto": "aparelho", "rotacaoBase": [0, 0, 0], "escala": 1, "malhaTela": "Tela",
                "telaPx": [2560, 1600], "flipY": True, "sombra": 0.8},
     "notas": NOTEBOOK_NOTAS + " Acabamento grafite fosco #3A3D44."},
    {"id": "glb-notebook-aluminio", "arquivo": "notebook-aluminio_legalizai_proprio.glb", "fonte": "próprio",
     "autor": "Legalizaí (modelo próprio)", "titulo": "Notebook genérico (alumínio)", "url": None,
     "obtidoDe": "KIT/modelos/blender/notebook.py --acabamento aluminio (Blender 5.2, em segundo plano, sem .blend)",
     "licenca": LIC_PROPRIA, "status": "liberado",
     "dimensoes": "base 0,31 x 0,215 x 0,016 m; tampa de 5,5 mm; aberto a 110 graus ocupa 0,31 x 0,219 x 0,286 m",
     "orientacao": {"frente": "+Z (tela e teclado; a tampa abre pra trás)", "cima": "+Y", "rotacaoPraCamera": [0, 0, 0]},
     "malhas": {"tela": "Tela", "moldura": "Moldura", "outras": ["Base", "Tampa", "Teclado", "Trackpad", "Dobradica"]},
     "render": {"tipoObjeto": "aparelho", "rotacaoBase": [0, 0, 0], "escala": 1, "malhaTela": "Tela",
                "telaPx": [2560, 1600], "flipY": True, "sombra": 0.8},
     "notas": NOTEBOOK_NOTAS + " Acabamento alumínio claro #D9D6D0."},
    {"id": "glb-cedula-generica", "arquivo": "cedula_legalizai_proprio.glb", "fonte": "próprio",
     "autor": "Legalizaí (modelo próprio)", "titulo": "Cédula genérica", "url": None,
     "obtidoDe": "KIT/modelos/blender/cedula.py (Blender 5.2), com a textura do KIT/modelos/texturas.py (PIL)",
     "licenca": LIC_PROPRIA, "status": "liberado", "dimensoes": "0,14 x 0,065 m, pontas 4 mm pra trás",
     "orientacao": {"frente": "+Z (frente creme; o verso coral olha pra -Z)", "cima": "+Y", "rotacaoPraCamera": [0, 0, 0]},
     "malhas": {"outras": ["Papel"]},
     "render": {"tipoObjeto": "glb", "rotacaoBase": [0, 0, 0], "escala": 1},
     "notas": ("Nota genérica levemente curva e de dupla face: frente creme e verso coral, desenhadas no PIL na paleta "
               "da marca (coral, creme e tinta), só ornamento (guilhoché, rosetas, faixa de segurança e moldura). Nada "
               "da cédula real: sem número, sem número de série, sem 'R$', sem brasão, sem retrato e sem texto. Duas "
               "folhas a 0,12 mm com material de uma face só (sem briga de profundidade); o verso fica de pé quando a "
               "nota gira em torno do eixo vertical. Atlas JPEG de 1024 x 1024 embutido. Pedido: 26/10.")},
    {"id": "glb-simbolo-legalizai", "arquivo": "simbolo_legalizai_proprio.glb", "fonte": "próprio",
     "autor": "Legalizaí (marca própria)", "titulo": "Símbolo da marca Legalizaí (3D)", "url": None,
     "obtidoDe": ("KIT/modelos/blender/simbolo.py, a partir do marketing/3d/simbolo/simbolo-9x16.blend (md5 "
                  "34a9188501af8a14eafe6b651d083c84, aberto só pra leitura)"),
     "licenca": LIC_PROPRIA, "status": "liberado", "dimensoes": "0,36 x 0,36 x 0,045 m (tamanho real da vinheta)",
     "orientacao": {"frente": "+Z (face com o check)", "cima": "+Y", "rotacaoPraCamera": [0, 0, 0]},
     "malhas": {"outras": ["SimboloCorpo", "SimboloFace"]},
     "render": {"tipoObjeto": "glb", "rotacaoBase": [0, 0, 0], "escala": 1, "sombra": 0.5},
     "notas": ("Só simbolo_corpo e simbolo_face do .blend da vinheta (nós Simbolo, SimboloCorpo e SimboloFace), sem "
               "câmera, luzes, chão e ações; o md5 do .blend não mudou e não nasceu .blend1. Corpo com o coral "
               "#F2643C exato no baseColorFactor (linear 0,887923; 0,127438; 0,045186). A face usava a sequência "
               "tex-check/check_####.png, que não existe no disco: o último quadro (check completo) foi refeito no PIL "
               "a partir do path do simbolo.svg e entrou como textura sRGB (coral e check branco). Centro na origem, "
               "face pra +Z. Clearcoat 0,3 no corpo e 0,06 na face, como na vinheta. Uso: fecho 'Vai, Legalizaí' e "
               "assinatura.")},
    {"id": "glb-caixa-papelao", "arquivo": "caixa-papelao_polyhaven_rahul-chaudhary.glb", "fonte": "Poly Haven",
     "fonteId": "cardboard_box_01", "autor": "Rahul Chaudhary", "titulo": "Cardboard Box 01",
     "url": "https://polyhaven.com/a/cardboard_box_01", "obtidoDe": ph("cardboard_box_01"), "baixadoEm": "2026-10-02",
     "licenca": lic_polyhaven("Rahul Chaudhary"), "status": "liberado",
     "orientacao": {"frente": None, "cima": "+Y (base em y = 0)", "rotacaoPraCamera": None},
     "malhas": {"outras": ["Caixa"]},
     "render": {"tipoObjeto": "glb", "rotacaoBase": [0, 0, 0], "escala": 1},
     "notas": ("Caixa realista e gasta (tampo rasgado, fita em volta), 0,39 x 0,34 x 0,52 m. O texto impresso (Keep "
               "Out of Reach of Children, no sharp instruments to open e uma linha menor) foi apagado das texturas de "
               "cor, normal e ARM; ficaram os dois pictogramas de manuseio (este lado pra cima e manter seco), sem "
               "texto. Texturas de 1k. Pedido: 23/10.")},
    {"id": "glb-camera-fotografica", "arquivo": "camera-fotografica_polyhaven_rajil-jose-macatangay.glb",
     "fonte": "Poly Haven", "fonteId": "Camera_01", "autor": "Rajil Jose Macatangay", "titulo": "Camera 01",
     "url": "https://polyhaven.com/a/Camera_01", "obtidoDe": ph("Camera_01"), "baixadoEm": "2026-10-02",
     "licenca": lic_polyhaven("Rajil Jose Macatangay"), "status": "aceito-com-risco",
     "orientacao": {"frente": "+Z (lente)", "cima": "+Y (base em y = 0)", "rotacaoPraCamera": [0, 0, 0]},
     "malhas": {"outras": ["Corpo", "CorpoLente", "VidroLente", "Baioneta", "Alca"]},
     "render": {"tipoObjeto": "glb", "rotacaoBase": [0, 0, 0], "escala": 1},
     "notaLicenca": ("CC0, mas o desenho é de uma câmera telemétrica clássica reconhecível: marca, modelo, números de "
                     "série e toda gravação foram apagados das texturas; nunca citar marca na peça nem na legenda"),
     "notas": ("Câmera de filme com alça. Apagado das texturas de cor, normal e ARM do corpo e da lente: marca, modelo, "
               "números de série, escalas da lente, mostradores numerados, um emblema e pictogramas. Lente pra +Z; o "
               "corpo mede 0,147 x 0,078 x 0,039 m. A alça (nó Alca) fica deitada à frente e à esquerda e dá pra "
               "esconder no three.js; Baioneta é o anel de encaixe da lente. VidroLente com "
               "KHR_materials_transmission (passe extra no three.js). Pedido: 30/10.")},
    {"id": "glb-lampada", "arquivo": "lampada_polyhaven_josh-dean.glb", "fonte": "Poly Haven",
     "fonteId": "lightbulb_01", "autor": "Josh Dean", "titulo": "Lightbulb 01",
     "url": "https://polyhaven.com/a/lightbulb_01", "obtidoDe": ph("lightbulb_01"), "baixadoEm": "2026-10-02",
     "licenca": lic_polyhaven("Josh Dean"), "status": "liberado",
     "orientacao": {"frente": None, "cima": "+Y (rosca embaixo, até y = -0,017)", "rotacaoPraCamera": None},
     "malhas": {"outras": ["Vidro", "Base"]},
     "render": {"tipoObjeto": "glb", "rotacaoBase": [0, 0, 0], "escala": 1},
     "notas": ("Lâmpada incandescente, 0,06 x 0,10 m. O texto impresso no vidro (potência, tensão, marca e tipo de luz) "
               "foi apagado da textura de cor. Vidro com transmissão e IOR (passe extra no three.js) e alphaMode OPAQUE, "
               "porque a textura de cor é JPEG sem alfa; filamento emissivo com KHR_materials_emissive_strength 10. "
               "Sem pedido com data (lacuna BAIXA do inventário).")},
    {"id": "glb-lupa", "arquivo": "lupa_polyhaven_nazar-borodavka.glb", "fonte": "Poly Haven",
     "fonteId": "magnifying_glass_01", "autor": "Nazar Borodavka", "titulo": "Magnifying Glass 01",
     "url": "https://polyhaven.com/a/magnifying_glass_01", "obtidoDe": ph("magnifying_glass_01"),
     "baixadoEm": "2026-10-02", "licenca": lic_polyhaven("Nazar Borodavka"), "status": "liberado",
     "orientacao": {"frente": "+Z (lente de frente; vale -Z também)", "cima": "+Y (cabo embaixo)",
                    "rotacaoPraCamera": [0, 0, 0]},
     "malhas": {"outras": ["Armacao", "Lente"]},
     "render": {"tipoObjeto": "glb", "rotacaoBase": [0, 0, 0], "escala": 1},
     "notas": ("Lupa de mão em pé, 0,13 x 0,27 m: Armacao (aro e cabo) e Lente (KHR_materials_transmission, passe extra "
               "no three.js). Sem texto nas texturas. Sem pedido com data (lacuna BAIXA do inventário).")},
    {"id": "glb-caneca", "arquivo": "caneca_polypizza_kenney.glb", "fonte": "Poly Pizza", "fonteId": "fis2ugeLbn",
     "autor": "Kenney", "titulo": "Mug", "url": "https://poly.pizza/m/fis2ugeLbn",
     "obtidoDe": "https://static.poly.pizza/5600ffdc-21d2-4e62-93e2-1b255738e43d.glb", "baixadoEm": "2026-10-02",
     "licenca": {"nome": "CC0", "url": "https://creativecommons.org/publicdomain/zero/1.0/", "creditoObrigatorio": False,
                 "credito": "Dispensa; cortesia Kenney", "creditoLegenda": None,
                 "texto": "CC0 1.0 (conferida no Poly Pizza em 02/10)"},
     "status": "liberado",
     "orientacao": {"frente": "alça em +X", "cima": "+Y (base em y = 0)", "rotacaoPraCamera": [0, 0, 0]},
     "malhas": {"outras": ["Corpo"]},
     "render": {"tipoObjeto": "glb", "rotacaoBase": [0, 0, 0], "escala": 1},
     "notas": ("Caneca low-poly estilizada (corpo octogonal com dois aros, lembra caneca de chope), cores chapadas nos "
               "materiais Corpo e Faixas, fáceis de retingir pra paleta. O nó raiz Caneca leva a escala pra 0,095 m de "
               "altura (0,12 m com a alça). Pedido: 26/10 (café).")},
    {"id": "glb-carteira", "arquivo": "carteira_polypizza_poly-by-google.glb", "fonte": "Poly Pizza",
     "fonteId": "bN7GPQFma7_", "autor": "Poly by Google", "titulo": "Wallet", "url": "https://poly.pizza/m/bN7GPQFma7_",
     "obtidoDe": "https://static.poly.pizza/bb633adb-57f0-4d6f-8752-436e0047c96d.glb", "baixadoEm": "2026-10-02",
     "licenca": lic_ccby3("Wallet", "Poly by Google"), "status": "liberado",
     "orientacao": {"frente": "deitada: a face de cima olha pra +Y", "cima": "+Y",
                    "rotacaoPraCamera": [PI2, 0, 0]},
     "malhas": {"outras": ["Corpo"]},
     "render": {"tipoObjeto": "glb", "rotacaoBase": [0, 0, 0], "escala": 1},
     "notaLicenca": ("o autor exigido pela CC BY 3.0 é 'Poly by Google' e cita Google: precisa de avaliação do Pedro "
                     "antes de usar, porque a regra do kit é não citar marca na legenda"),
     "notas": ("Carteira de couro low-poly, deitada, 0,11 x 0,077 x 0,013 m. O arquivo original vinha em unidade "
               "enorme e longe da origem: o nó raiz Carteira tem escala 1,881e-7 e uma translação que centraliza e "
               "assenta a base em y = 0. Material Couro, cor chapada. Pedido: 26/10.")},
    {"id": "glb-pote-vidro", "arquivo": "pote-vidro_polypizza_jarlan-perez.glb", "fonte": "Poly Pizza",
     "fonteId": "8dGz3QaoAG-", "autor": "Jarlan Perez", "titulo": "Glass Jar", "url": "https://poly.pizza/m/8dGz3QaoAG-",
     "obtidoDe": "https://static.poly.pizza/a84a089e-b363-4a1d-b17b-55d3b24af7dd.glb", "baixadoEm": "2026-10-02",
     "licenca": lic_ccby3("Glass Jar", "Jarlan Perez"), "status": "liberado",
     "orientacao": {"frente": None, "cima": "+Y (tampa em cima, base em y = 0)", "rotacaoPraCamera": None},
     "malhas": {"outras": ["Vidro", "Tampa"]},
     "render": {"tipoObjeto": "glb", "rotacaoBase": [0, 0, 0], "escala": 1},
     "notas": ("Pote de vidro low-poly com tampa, 0,091 x 0,14 m depois da escala do nó raiz Pote. O arquivo não tem "
               "normais (o three.js usa sombreado chapado); vidro em alphaMode BLEND com opacidade 0,4 e dupla face. "
               "Pedido: 26/10 (dois potes: instanciar duas vezes).")},
]


def _br(n, casas=0):
    s = ("{:,.%df}" % casas).format(n)
    return s.replace(",", "X").replace(".", ",").replace("X", ".")


def mede(item):
    caminho = EXT + "/" + item["arquivo"]
    inf = bbox_glb.info(caminho)
    cx = bbox_glb.caixa(caminho, 1.0)
    caixa = dict(cx, escala=1, unidade="m")
    tam = os.path.getsize(caminho)
    t = cx["tamanho"]
    out = dict(item)
    out.update({
        "tipo": "glb", "arquivo": caminho, "unidade": "m", "escala": 1, "caixa": caixa, "caixaArquivo": cx,
        "animacoes": inf["animacoes"], "extensoesGltf": inf["extensoesGltf"], "temEsqueleto": inf["temEsqueleto"],
        "contagem": {"nos": inf["nos"], "malhas": inf["malhas"], "materiais": inf["materiais"],
                     "imagens": inf["imagens"]},
        "triangulos": inf["triangulos"], "md5": escrita.md5(caminho), "tamanho": tam, "prova": None, "usos": [],
        "dados": ("%s B; %d nós, %d malhas, %d materiais, %d imagens embutidas; %s triângulos; caixa %s x %s x %s m "
                  "(Y pra cima); nós: %s" % (_br(tam), inf["nos"], inf["malhas"], inf["materiais"], inf["imagens"],
                                            _br(inf["triangulos"]), _br(t[0], 3), _br(t[1], 3), _br(t[2], 3),
                                            ", ".join(inf["nomesNos"]))),
    })
    out["render"] = dict(item["render"])
    if inf["extensoesObrigatorias"]:
        raise SystemExit("%s tem extensão obrigatória: %s" % (item["id"], inf["extensoesObrigatorias"]))
    return out


def principal(argv=None):
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    p = argparse.ArgumentParser(prog="cataloga.py")
    p.add_argument("--saida", default=SAIDA)
    a = p.parse_args(argv)
    doc = {
        "versao": 1, "camada": "aquisicoes", "tipo": "modelos",
        "geradoEm": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "geradoPor": "K09 (KIT/modelos/cataloga.py, com caixa, contagens, md5 e tamanho lidos do disco)",
        "fontes": ["KIT/DESENHO.md (revisão 2), seções 4.9 e 12 e Anexo A.3b",
                   "KIT/modelos/LEIA-ME.md e KIT/modelos/baixados.md",
                   "caixas pelo KIT/catalogos/bbox_glb.py (chunk JSON dos GLB)"],
        "itens": [mede(it) for it in ITENS],
    }
    with open(ESQUEMA, encoding="utf-8") as f:
        esquema = json.load(f)
    erros = sorted(Draft202012Validator(esquema).iter_errors(doc), key=lambda e: list(e.absolute_path))
    if erros:
        for e in erros[:20]:
            print("ESQUEMA: %s: %s" % ("/".join(str(x) for x in e.absolute_path), e.message[:200]))
        return 1
    escrita.grava_json(a.saida, doc)
    total = sum(it["tamanho"] for it in doc["itens"])
    print("gravado %s: %d itens, %s bytes de GLB" % (a.saida, len(doc["itens"]), _br(total)))
    for it in doc["itens"]:
        t = it["caixa"]["tamanho"]
        print("  %-24s %9d B %6d tri  %.3f x %.3f x %.3f m  %s" % (it["id"], it["tamanho"], it["triangulos"], t[0], t[1],
                                                                   t[2], it["status"]))
    return 0


if __name__ == "__main__":
    sys.exit(principal())
