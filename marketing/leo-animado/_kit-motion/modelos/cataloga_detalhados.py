"""Gera a camada de aquisições dos modelos detalhados pra argila: KIT/catalogos/modelos/aquisicoes-2026-10-05.json.

Pedido do Pedro em 05/10/2026 ("as animações e os assets 3D melhores e mais detalhados"). Mesmo formato e mesma
medição do cataloga.py do K09 (caixa, contagens, triângulos, extensões, md5 e tamanho lidos do disco pelo
KIT/catalogos/bbox_glb.py e pelo KIT/lib/escrita.py), validado contra KIT/catalogos/esquemas/modelos.schema.json antes
de gravar. Os GLB saem do KIT/modelos/blender/detalhados.py e ficam em _assets-externos/kit-2026-10/modelos-3d/, junto
da licença de cada um (<arquivo>.licenca.txt). O bloco render de cada um está na sobreposição
KIT/catalogos/modelos/revisao-render-2026-10-05.json.

Roda no Python do corte-viral, sempre com -B:
    python -B cataloga_detalhados.py [--saida <arquivo.json>]
"""
import argparse
import datetime
import json
import os
import sys

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import cataloga  # noqa: E402  (mede() e as licenças prontas)
import escrita  # noqa: E402  (o cataloga já pôs KIT/lib no sys.path)
from jsonschema import Draft202012Validator  # noqa: E402

SAIDA = os.path.join(cataloga.glb.KIT, "catalogos", "modelos", "aquisicoes-2026-10-05.json")
OBJAVERSE = "https://huggingface.co/datasets/allenai/objaverse/resolve/main/"


def lic_sketchfab(titulo, autor):
    return {"nome": "CC BY 4.0", "url": "https://creativecommons.org/licenses/by/4.0/", "creditoObrigatorio": True,
            "credito": "'%s' por %s (Sketchfab, CC BY 4.0), modificado" % (titulo, autor),
            "creditoLegenda": {"trecho": "'%s' por %s" % (titulo, autor), "fonte": "Sketchfab", "licenca": "CC BY 4.0"},
            "texto": "CC BY 4.0 (CC Attribution, conferida na API pública do Sketchfab em 05/10; prova no .licenca.txt "
                     "ao lado do GLB)"}


LIC_IA = {"nome": "próprio", "url": None, "creditoObrigatorio": False, "credito": "Não se aplica",
          "creditoLegenda": None,
          "texto": "própria (gerado no Higgsfield com a conta do Legalizaí, modelo tripo_3d; job e prompt no .licenca.txt "
                   "ao lado do GLB)"}

RENDER = {"tipoObjeto": "glb", "rotacaoBase": [0, 0, 0], "escala": 1}
ARGILA = ("Sem textura: os materiais já vêm em tons de argila fria (família frio do carrossel de 05/10) e com nome "
          "por parte, pra a cena trocar cor e rugosidade por nome ('*' pinta todos).")

ITENS = [
    {"id": "glb-despertador-detalhado", "arquivo": "despertador-detalhado_polyhaven_james-ray-cock.glb",
     "fonte": "Poly Haven", "fonteId": "alarm_clock_01", "autor": "James Ray Cock e Yann Kervran",
     "titulo": "Alarm Clock 01 (preparado pra argila)", "url": "https://polyhaven.com/a/alarm_clock_01",
     "obtidoDe": ("o GLB do kit de 01/10 (glb-despertador, _assets-externos/modelos-3d/relogio-despertador_polyhaven_"
                  "alarm-clock-01.glb, md5 17f4832c355215d5e798a8a2fd5f7b37), sem download novo, preparado pelo "
                  "KIT/modelos/blender/detalhados.py despertador"),
     "baixadoEm": "2026-10-01", "licenca": dict(cataloga.lic_polyhaven("James Ray Cock e Yann Kervran"),
                                               texto="CC0 (Poly Haven; licença conferida em 05/10)"),
     "status": "liberado",
     "dimensoes": "0,132 x 0,174 x 0,067 m (largura, altura, profundidade), pés em y = 0",
     "orientacao": {"frente": "+Z (mostrador)", "cima": "+Y (pés em y = 0)", "rotacaoPraCamera": [0, 0, 0]},
     "malhas": {"outras": ["Corpo", "Aro", "Mostrador", "Marcas", "Eixo", "PonteiroHoras", "PonteiroMinutos",
                           "PonteiroSegundos", "SinoEsquerdo", "SinoDireito", "Martelo", "Alca", "Pes", "Vidro"]},
     "partes": {
         "PonteiroHoras": "pivô no centro do mostrador, no ponto (0; 0,06583; 0,0149) do arquivo; gira em rotation.z: "
                          "0 aponta pro 12 e o sentido horário é negativo, rotation.z = -2*pi*((h % 12) + min/60)/12; "
                          "padrão 10:10 (-5,32325)",
         "PonteiroMinutos": "mesmo pivô; rotation.z = -2*pi*min/60; padrão -1,0472 (10 minutos)",
         "PonteiroSegundos": "mesmo pivô, por cima dos outros dois; rotation.z = -2*pi*s/60; padrão -3,76991 (36 s)",
         "SinoEsquerdo": "pivô no centro do sino (-0,0298; 0,12694; -0,00295): tremor em rotation.z de uns 0,1 rad",
         "SinoDireito": "pivô no centro do sino (0,0298; 0,12694; -0,00295): tremor em rotation.z",
         "Martelo": "pivô no pé do martelo, entre os sinos (0,00086; 0,12996; 0,00328): vai e volta em rotation.z",
         "Alca": "pivô no meio da alça (0; 0,15756; -0,00297)",
         "Mostrador": "disco plano com UV de 0 a 1 (u da esquerda pra direita, v = 1 em cima), pronto pra um pintor de "
                      "mostrador (render.texturaMalha) se a peça quiser números",
         "Vidro": "o vidro da frente, material Vidro transparente (alphaMode BLEND, opacidade 0,12)",
         "fixas": "Corpo, Aro, Marcas (12 marcas de hora em relevo de 0,3 mm), Eixo, Pes e Vidro ficam com a origem no "
                  "zero do arquivo"},
     "render": dict(RENDER),
     "notas": ("Despertador de campainha dupla do Poly Haven (CC0), o mesmo do glb-despertador, refeito pra argila: sem "
               "textura, com as partes separadas (sinos, martelo, alça, pés, aro, mostrador, eixo, vidro) e os três "
               "ponteiros com pivô no centro, apontando pro 12 na malha e girados pra 10:10:36 no nó. As 12 marcas de "
               "hora são geometria acrescentada (o original tinha algarismos romanos na textura). " + ARGILA +
               " O catálogo deixa ponteiros, marcas e eixo escuros, o mostrador claro e o vidro transparente; a cena "
               "vence campo a campo.")},
    {"id": "glb-ampulheta", "arquivo": "ampulheta_sketchfab_kodie-russell.glb", "fonte": "Sketchfab",
     "fonteId": "cb0e7bf9c2c34681a1c46510298eca2e", "autor": "Kodie Russell", "titulo": "Hour Glass",
     "url": "https://sketchfab.com/3d-models/cb0e7bf9c2c34681a1c46510298eca2e",
     "obtidoDe": OBJAVERSE + "glbs/000-038/cb0e7bf9c2c34681a1c46510298eca2e.glb (cópia CC BY do Objaverse; o Sketchfab "
                             "pede login pra baixar)",
     "baixadoEm": "2026-10-05", "licenca": lic_sketchfab("Hour Glass", "Kodie Russell"), "status": "liberado",
     "dimensoes": "0,080 x 0,180 x 0,080 m (largura, altura, profundidade), base em y = 0",
     "orientacao": {"frente": "+Z (simétrica: três colunas)", "cima": "+Y (base em y = 0)",
                    "rotacaoPraCamera": [0, 0, 0]},
     "malhas": {"outras": ["Base", "Topo", "Colunas", "Rolhas", "Vidro", "AreiaCima", "AreiaBaixo", "FioAreia"]},
     "partes": {
         "AreiaCima": "pivô no pé da areia de cima, no gargalo (y 0,0896): scale.y de 1 a 0 esvazia em direção ao gargalo",
         "AreiaBaixo": "pivô no pé da areia de baixo (y 0,02337): scale.y de 0 a 1 enche de baixo pra cima",
         "FioAreia": "o fio de areia caindo, pivô no topo (y 0,09126): scale.y 0 some, 1 escorre",
         "Vidro": "material Vidro transparente (opacidade 0,15)",
         "fixas": "Base, Topo, Colunas (três colunas torneadas) e Rolhas com a origem no zero do arquivo; virar a "
                  "ampulheta é girar o objeto inteiro (pivô centro do catálogo)"},
     "render": dict(RENDER),
     "notas": ("Ampulheta de madeira com três colunas torneadas, discos em cima e embaixo e a areia em três malhas "
               "(cima, baixo e o fio que cai), boa pra mostrar o tempo passando. " + ARGILA)},
    {"id": "glb-telefone-disco", "arquivo": "telefone-disco_sketchfab_pan-stasian.glb", "fonte": "Sketchfab",
     "fonteId": "c0ec549c914545a8bb29620b70491afd", "autor": "pan.stasian", "titulo": "Slightly used telephone",
     "url": "https://sketchfab.com/3d-models/c0ec549c914545a8bb29620b70491afd",
     "obtidoDe": OBJAVERSE + "glbs/000-158/c0ec549c914545a8bb29620b70491afd.glb (cópia CC BY do Objaverse; o Sketchfab "
                             "pede login pra baixar)",
     "baixadoEm": "2026-10-05", "licenca": lic_sketchfab("Slightly used telephone", "pan.stasian"),
     "status": "liberado",
     "dimensoes": ("corpo com o fone: 0,21 x 0,165 x 0,14 m; com o fio espiral, que sai pela esquerda: 0,325 x 0,165 x "
                   "0,144 m; origem no centro do corpo (sem o fio), pés em y = -0,0804"),
     "orientacao": {"frente": "+Z (disco de discar)", "cima": "+Y", "rotacaoPraCamera": [0, 0, 0]},
     "malhas": {"outras": ["Corpo", "Metal", "Mostrador", "Pes", "Fone", "Fio", "DiscoEixo", "Disco"]},
     "partes": {
         "Fone": "o fone no gancho, pivô no centro dele (0; 0,0395; 0): levantar com position.y e inclinar em rotation.z "
                 "ou rotation.x",
         "DiscoEixo": "vazio no centro do disco (-0,00034; -0,02327; 0,04676), inclinado 36,6 graus pra trás: não mexer",
         "Disco": "filho do DiscoEixo, com rotação zero: rotation.z gira o disco de discar em volta do eixo dele "
                  "(discar: vai até uns -2,5 rad e volta)",
         "Fio": "fio espiral do fone até o corpo, estático (simplificado de 40.139 pra 6.421 triângulos); com o fone "
                "levantado ele não acompanha. Desce uns 5 mm abaixo dos pés (fica rente ao chão)",
         "fixas": "Corpo, Metal (plaquinha da frente), Mostrador (anel numerado sem números) e Pes"},
     "render": dict(RENDER),
     "notas": ("Telefone de mesa de disco, do jeito clássico: fone no gancho, disco de discar com os furos e fio "
               "espiral. Desenho genérico, sem marca (a plaquinha da frente era só textura e saiu). " + ARGILA)},
    {"id": "glb-pastas-az", "arquivo": "pastas-az_sketchfab_janexx.glb", "fonte": "Sketchfab",
     "fonteId": "1a493b49ef954985ab8057ca66c387d5", "autor": "janexx", "titulo": "Several Folders",
     "url": "https://sketchfab.com/3d-models/1a493b49ef954985ab8057ca66c387d5",
     "obtidoDe": OBJAVERSE + "glbs/000-150/1a493b49ef954985ab8057ca66c387d5.glb (cópia CC BY do Objaverse; o Sketchfab "
                             "pede login pra baixar)",
     "baixadoEm": "2026-10-05", "licenca": lic_sketchfab("Several Folders", "janexx"), "status": "liberado",
     "dimensoes": "fileira de 0,349 x 0,32 x 0,26 m; cada pasta tem 0,062 x 0,315 x 0,26 m (a quinta, inclinada, 0,105 de largura)",
     "orientacao": {"frente": "+Z (lombadas com o furo de puxar)", "cima": "+Y (base em y = 0)",
                    "rotacaoPraCamera": [0, 0, 0]},
     "malhas": {"outras": ["Pasta1", "Pasta2", "Pasta3", "Pasta4", "Pasta5"]},
     "partes": {"Pasta1": "pivô no meio do pé da pasta: cair em dominó é rotation.z; tirar da fileira é position",
                "Pasta5": "a última, inclinada encostada na quarta; mesmo pivô no pé",
                "fixas": "nenhuma: as cinco são nós próprios (Pasta1 a Pasta5, da esquerda pra direita)"},
     "render": dict(RENDER),
     "notas": ("Cinco pastas AZ (registradoras) em fileira, a última inclinada. Desenho simples (1.061 triângulos por "
               "pasta, lombada com o furo de puxar), com bisel de 1,5 mm acrescentado nas arestas pra a argila pegar "
               "luz. As etiquetas eram textura e saíram. " + ARGILA)},
    {"id": "glb-carimbo-detalhado", "arquivo": "carimbo-detalhado_higgsfield_legalizai.glb",
     "fonte": "Higgsfield (gerado por IA, tripo_3d)", "fonteId": "1fa67fbb-1f2a-4967-8f50-c9e478826d27",
     "autor": "Legalizaí (gerado no Higgsfield)", "titulo": "Carimbo de borracha (gerado por IA)", "url": None,
     "obtidoDe": ("Higgsfield, generate_3d com o modelo tripo_3d (texto pra 3D, sem textura), job "
                  "1fa67fbb-1f2a-4967-8f50-c9e478826d27, 2,5 créditos; prompt no .licenca.txt"),
     "baixadoEm": "2026-10-05", "licenca": dict(LIC_IA), "status": "liberado",
     "dimensoes": "0,051 x 0,085 x 0,036 m (largura, altura, profundidade), base em y = 0",
     "orientacao": {"frente": "+Z (lado comprido do bloco pra câmera)", "cima": "+Y (borracha em y = 0)",
                    "rotacaoPraCamera": [0, 0, 0]},
     "malhas": {"outras": ["Corpo"]},
     "partes": {"Corpo": "malha única (cabo torneado com pomo, bloco com frisos e a borracha embaixo); carimbar é "
                         "mexer o objeto inteiro (subir, descer, achatar em scale.y)"},
     "render": dict(RENDER),
     "notas": ("Carimbo de borracha clássico gerado por IA: cabo torneado com pomo, pescoço fino e bloco retangular "
               "com frisos na borda e a borracha embaixo. Malha única de 28.826 triângulos, sem texto. " + ARGILA)},
    {"id": "glb-dispensador-senha", "arquivo": "dispensador-senha_higgsfield_legalizai.glb",
     "fonte": "Higgsfield (gerado por IA, tripo_3d)", "fonteId": "98915ce7-a56b-4336-8100-8d7991fe2c71",
     "autor": "Legalizaí (gerado no Higgsfield)", "titulo": "Dispensador de senha (gerado por IA)", "url": None,
     "obtidoDe": ("Higgsfield, generate_3d com o modelo tripo_3d (texto pra 3D, sem textura), job "
                  "98915ce7-a56b-4336-8100-8d7991fe2c71, 2,5 créditos; prompt no .licenca.txt"),
     "baixadoEm": "2026-10-05", "licenca": dict(LIC_IA), "status": "liberado",
     "dimensoes": "0,258 x 0,30 x 0,181 m (largura, altura, profundidade), base em y = 0",
     "orientacao": {"frente": "+Z (fita de senhas saindo embaixo do anel)", "cima": "+Y (base em y = 0)",
                    "rotacaoPraCamera": [0, 0, 0]},
     "malhas": {"outras": ["Corpo"]},
     "partes": {"Corpo": "malha única (anel em pé num poste curto, base redonda e a fita de senhas saindo)"},
     "render": dict(RENDER),
     "notas": ("Experimental: dispensador de senha de balcão ('pegue sua senha') gerado por IA, um anel grosso em pé "
               "num poste com base redonda e a fita de senhas saindo pela frente. Sozinho ele lê como uma rosca: pede "
               "contexto (legenda ou a fita com número). Malha única de 29.550 triângulos, sem texto. " + ARGILA)},
]


def principal(argv=None):
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    p = argparse.ArgumentParser(prog="cataloga_detalhados.py")
    p.add_argument("--saida", default=SAIDA)
    a = p.parse_args(argv)
    cataloga.EXT = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d"
    doc = {
        "versao": 1, "camada": "aquisicoes", "tipo": "modelos",
        "geradoEm": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "geradoPor": ("modelos detalhados pra argila (05/10/2026): KIT/modelos/cataloga_detalhados.py, com caixa, "
                      "contagens, md5 e tamanho lidos do disco"),
        "fontes": ["KIT/modelos/LEIA-ME.md (seção Modelos detalhados pra argila) e KIT/modelos/baixados.md",
                   "GLB feitos pelo KIT/modelos/blender/detalhados.py; licença de cada um no .licenca.txt ao lado",
                   "caixas pelo KIT/catalogos/bbox_glb.py (chunk JSON dos GLB)"],
        "itens": [cataloga.mede(it) for it in ITENS],
    }
    with open(cataloga.ESQUEMA, encoding="utf-8") as f:
        esquema = json.load(f)
    erros = sorted(Draft202012Validator(esquema).iter_errors(doc), key=lambda e: list(e.absolute_path))
    if erros:
        for e in erros[:20]:
            print("ESQUEMA: %s: %s" % ("/".join(str(x) for x in e.absolute_path), e.message[:200]))
        return 1
    escrita.grava_json(a.saida, doc)
    for it in doc["itens"]:
        t = it["caixa"]["tamanho"]
        print("%-28s %6d tri  %s x %s x %s m  %s" % (it["id"], it["triangulos"], t[0], t[1], t[2], it["md5"]))
    print("gravado %s (%d itens)" % (a.saida, len(doc["itens"])))
    return 0


if __name__ == "__main__":
    sys.exit(principal())
