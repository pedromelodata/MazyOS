# Modelos baixados pelo K09 (02/10/2026)

Pacote K09 do kit de motion do Legalizaí. Sete downloads, um de cada vez, com o disco conferido antes de cada arquivo (parada abaixo de 400 MB livres) e limite de 15 MB por download, pelo `KIT/modelos/baixa.py`. No Poly Haven, cada arquivo teve o md5 conferido com o da API. Os arquivos baixados ficaram só numa pasta temporária e foram apagados depois da conversão; o que fica no kit é o GLB final em `_assets-externos/kit-2026-10/modelos-3d/`, catalogado em `KIT/catalogos/modelos/aquisicoes-2026-10.json`. O registro em JSON dos mesmos downloads está em `KIT/modelos/registros/downloads-2026-10-02.json`.

Licenças conferidas no dia: Poly Haven em https://polyhaven.com/license (CC0 em todos os modelos); Poly Pizza na página de cada modelo (campo de licença e link da Creative Commons).

| id | arquivo final | fonte | autor | licença | baixado (B) | GLB final (B) | md5 do GLB final |
|---|---|---|---|---|---|---|---|
| `glb-caixa-papelao` | `caixa-papelao_polyhaven_rahul-chaudhary.glb` | Poly Haven | Rahul Chaudhary | CC0 | 2.168.437 | 1.252.900 | `268c45fae898cf6fae9abb996813312e` |
| `glb-camera-fotografica` | `camera-fotografica_polyhaven_rajil-jose-macatangay.glb` | Poly Haven | Rajil Jose Macatangay | CC0 | 2.439.882 | 2.961.204 | `fbfdf8c3781fe97e0e09c1c2a9a9491b` |
| `glb-lampada` | `lampada_polyhaven_josh-dean.glb` | Poly Haven | Josh Dean | CC0 | 1.042.696 | 865.760 | `14681299408d131e2acd5982098909d9` |
| `glb-lupa` | `lupa_polyhaven_nazar-borodavka.glb` | Poly Haven | Nazar Borodavka | CC0 | 466.908 | 465.752 | `04f57108317a0aeaf5df02d7e7590d46` |
| `glb-caneca` | `caneca_polypizza_kenney.glb` | Poly Pizza | Kenney | CC0 | 15.440 | 16.100 | `c19edf2775b69daf1eaa91ea7dfaf2ef` |
| `glb-carteira` | `carteira_polypizza_poly-by-google.glb` | Poly Pizza | Poly by Google | CC BY 3.0 | 59.856 | 60.688 | `07732bcaa5f3cfb981f72979d86567ab` |
| `glb-pote-vidro` | `pote-vidro_polypizza_jarlan-perez.glb` | Poly Pizza | Jarlan Perez | CC BY 3.0 | 11.108 | 11.980 | `f41ccb823d2dc0939aaed5aa2f7d1bce` |

Total baixado: 6.204.327 bytes. Total dos sete GLB finais: 5.634.384 bytes.

## Cardboard Box 01 (`glb-caixa-papelao`)

- Página: https://polyhaven.com/a/cardboard_box_01
- API: https://api.polyhaven.com/files/cardboard_box_01 (resolução 1k, glTF com arquivos soltos)
- Autor: Rahul Chaudhary; publicado no Poly Haven em 2022-12-16
- Licença: CC0 (https://polyhaven.com/license)
- Crédito: Dispensa; cortesia Rahul Chaudhary, Poly Haven
- Crédito de legenda: não pede
- Baixado em: 2026-10-02T14:42:54-03:00
- Status no catálogo: liberado

| arquivo baixado | URL | bytes | md5 | md5 da API |
|---|---|---|---|---|
| `cardboard_box_01_1k.gltf` | https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/cardboard_box_01/cardboard_box_01_1k.gltf | 2.903 | `84572b118cc3640acdd9e978869bb3ee` | `84572b118cc3640acdd9e978869bb3ee` |
| `cardboard_box_01.bin` | https://dl.polyhaven.org/file/ph-assets/Models/gltf/4k/cardboard_box_01/cardboard_box_01.bin | 381.936 | `64bea3a77434981017b8a06da4ccb0df` | `64bea3a77434981017b8a06da4ccb0df` |
| `textures/cardboard_box_01_arm_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/cardboard_box_01/cardboard_box_01_arm_1k.jpg | 398.433 | `39ea452f95d71ec1362e47dff453c706` | `39ea452f95d71ec1362e47dff453c706` |
| `textures/cardboard_box_01_diff_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/cardboard_box_01/cardboard_box_01_diff_1k.jpg | 567.741 | `a306e586325d1759ba3225d2b6ad5121` | `a306e586325d1759ba3225d2b6ad5121` |
| `textures/cardboard_box_01_nor_gl_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/cardboard_box_01/cardboard_box_01_nor_gl_1k.jpg | 817.424 | `24768abd73f71cfdd7f5be92b18634a7` | `24768abd73f71cfdd7f5be92b18634a7` |

GLB final: `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d/caixa-papelao_polyhaven_rahul-chaudhary.glb` (1.252.900 bytes, md5 `268c45fae898cf6fae9abb996813312e`).

O que mudou: glTF de 1k empacotado em GLB único pelo Blender 5.2 (importado e exportado; as texturas JPEG entram sem reencode, menos as três editadas); o texto impresso (Keep Out of Reach of Children, no sharp instruments to open e uma linha menor) foi apagado das texturas de cor, normal e ARM; os dois pictogramas de manuseio ficaram; nós, malhas e materiais em português; geometria sem mudança.

Limpeza de texto e marca pelo `KIT/modelos/limpa_texturas.py` com `KIT/modelos/mapas/cardboard_box_01_limpeza.json` (regiões conferidas em miniatura, antes e depois).

Conversão: `KIT/modelos/blender/converte.py` com `KIT/modelos/mapas/caixa-papelao_polyhaven_rahul-chaudhary.json`.

## Camera 01 (`glb-camera-fotografica`)

- Página: https://polyhaven.com/a/Camera_01
- API: https://api.polyhaven.com/files/Camera_01 (resolução 1k, glTF com arquivos soltos)
- Autor: Rajil Jose Macatangay; publicado no Poly Haven em 2020-03-30
- Licença: CC0 (https://polyhaven.com/license)
- Crédito: Dispensa; cortesia Rajil Jose Macatangay, Poly Haven
- Crédito de legenda: não pede
- Atenção: CC0, mas o desenho é de uma câmera telemétrica clássica reconhecível: marca, modelo, números de série e toda gravação foram apagados das texturas; nunca citar marca na peça nem na legenda.
- Baixado em: 2026-10-02T14:43:05-03:00
- Status no catálogo: aceito-com-risco

| arquivo baixado | URL | bytes | md5 | md5 da API |
|---|---|---|---|---|
| `Camera_01_1k.gltf` | https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/Camera_01/Camera_01_1k.gltf | 9.886 | `c3fa6a2e13db2b6c6802725306089139` | `c3fa6a2e13db2b6c6802725306089139` |
| `Camera_01.bin` | https://dl.polyhaven.org/file/ph-assets/Models/gltf/8k/Camera_01/Camera_01.bin | 845.028 | `055c3af4c5dca45bfa4a3d9348563b88` | `055c3af4c5dca45bfa4a3d9348563b88` |
| `textures/Camera_01_body_arm_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/Camera_01/Camera_01_body_arm_1k.jpg | 228.449 | `1476ee36f1af6b22f2b509963b710f9a` | `1476ee36f1af6b22f2b509963b710f9a` |
| `textures/Camera_01_body_diff_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/Camera_01/Camera_01_body_diff_1k.jpg | 175.778 | `1ceb37036b60b4231c93d0cf383de3da` | `1ceb37036b60b4231c93d0cf383de3da` |
| `textures/Camera_01_body_nor_gl_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/Camera_01/Camera_01_body_nor_gl_1k.jpg | 271.892 | `51f1e690a469baddcbae1ee941a6acb4` | `51f1e690a469baddcbae1ee941a6acb4` |
| `textures/Camera_01_lens_body_arm_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/Camera_01/Camera_01_lens_body_arm_1k.jpg | 163.109 | `41a93d1239e491fc29349ff73d72436c` | `41a93d1239e491fc29349ff73d72436c` |
| `textures/Camera_01_lens_body_diff_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/Camera_01/Camera_01_lens_body_diff_1k.jpg | 106.198 | `45854840be875f1ea86cf8d830023922` | `45854840be875f1ea86cf8d830023922` |
| `textures/Camera_01_lens_body_nor_gl_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/Camera_01/Camera_01_lens_body_nor_gl_1k.jpg | 147.816 | `1098e1261b17084d081f32a6a05239de` | `1098e1261b17084d081f32a6a05239de` |
| `textures/Camera_01_strap_arm_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/Camera_01/Camera_01_strap_arm_1k.jpg | 159.433 | `c9421b18be3daa84224f8856ddfab5d7` | `c9421b18be3daa84224f8856ddfab5d7` |
| `textures/Camera_01_strap_diff_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/Camera_01/Camera_01_strap_diff_1k.jpg | 132.449 | `c8bf1a037fddbc8447ce491059a4e443` | `c8bf1a037fddbc8447ce491059a4e443` |
| `textures/Camera_01_strap_nor_gl_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/Camera_01/Camera_01_strap_nor_gl_1k.jpg | 199.844 | `5e35df574e5ec7ef76f34a803c7bd847` | `5e35df574e5ec7ef76f34a803c7bd847` |

GLB final: `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d/camera-fotografica_polyhaven_rajil-jose-macatangay.glb` (2.961.204 bytes, md5 `fbfdf8c3781fe97e0e09c1c2a9a9491b`).

O que mudou: glTF de 1k empacotado em GLB único pelo Blender 5.2 (importado e exportado; as texturas JPEG entram sem reencode, menos as seis editadas); marca, modelo, números de série, escalas, mostradores numerados, emblema e toda gravação legível foram apagados das texturas de cor, normal e ARM do corpo e da lente; a malha da câmera virou quatro nós (Corpo, CorpoLente, VidroLente e Baioneta, o anel de encaixe da lente) e a alça ficou no nó Alca; nós, malhas e materiais em português; geometria sem mudança.

Limpeza de texto e marca pelo `KIT/modelos/limpa_texturas.py` com `KIT/modelos/mapas/camera_01_limpeza.json` (regiões conferidas em miniatura, antes e depois).

Conversão: `KIT/modelos/blender/converte.py` com `KIT/modelos/mapas/camera-fotografica_polyhaven_rajil-jose-macatangay.json`.

## Lightbulb 01 (`glb-lampada`)

- Página: https://polyhaven.com/a/lightbulb_01
- API: https://api.polyhaven.com/files/lightbulb_01 (resolução 1k, glTF com arquivos soltos)
- Autor: Josh Dean; publicado no Poly Haven em 2022-11-28
- Licença: CC0 (https://polyhaven.com/license)
- Crédito: Dispensa; cortesia Josh Dean, Poly Haven
- Crédito de legenda: não pede
- Baixado em: 2026-10-02T14:42:42-03:00
- Status no catálogo: liberado

| arquivo baixado | URL | bytes | md5 | md5 da API |
|---|---|---|---|---|
| `lightbulb_01_1k.gltf` | https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/lightbulb_01/lightbulb_01_1k.gltf | 5.721 | `986746bdf4c993214512761ae5efb301` | `986746bdf4c993214512761ae5efb301` |
| `lightbulb_01.bin` | https://dl.polyhaven.org/file/ph-assets/Models/gltf/4k/lightbulb_01/lightbulb_01.bin | 114.776 | `e4db6889652c52d164e649b1101ebffd` | `e4db6889652c52d164e649b1101ebffd` |
| `textures/lightbulb_01_arm_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/lightbulb_01/lightbulb_01_arm_1k.jpg | 326.758 | `21b7d5796114fe012c9866da9e2cb041` | `21b7d5796114fe012c9866da9e2cb041` |
| `textures/lightbulb_01_diff_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/lightbulb_01/lightbulb_01_diff_1k.jpg | 310.075 | `754718705441e6924a6a8c72d0de88a6` | `754718705441e6924a6a8c72d0de88a6` |
| `textures/lightbulb_01_emissive_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/lightbulb_01/lightbulb_01_emissive_1k.jpg | 22.999 | `2ede5ca5a42ed8d1e510d35bcc535565` | `2ede5ca5a42ed8d1e510d35bcc535565` |
| `textures/lightbulb_01_nor_gl_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/lightbulb_01/lightbulb_01_nor_gl_1k.jpg | 262.367 | `42fa73f5c93d4d89fe6094a4127475c6` | `42fa73f5c93d4d89fe6094a4127475c6` |

GLB final: `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d/lampada_polyhaven_josh-dean.glb` (865.760 bytes, md5 `14681299408d131e2acd5982098909d9`).

O que mudou: glTF de 1k empacotado em GLB único pelo Blender 5.2 (importado e exportado; as texturas JPEG entram sem reencode, menos a de cor, editada); o texto impresso no vidro (potência, tensão, marca e tipo de luz) foi apagado da textura de cor; a malha virou dois nós (Vidro e Base); o vidro sai com alphaMode OPAQUE em vez de BLEND, porque a textura de cor é JPEG sem alfa (a transparência vem da transmissão, KHR_materials_transmission); nós, malhas e materiais em português; geometria sem mudança.

Limpeza de texto e marca pelo `KIT/modelos/limpa_texturas.py` com `KIT/modelos/mapas/lightbulb_01_limpeza.json` (regiões conferidas em miniatura, antes e depois).

Conversão: `KIT/modelos/blender/converte.py` com `KIT/modelos/mapas/lampada_polyhaven_josh-dean.json`.

## Magnifying Glass 01 (`glb-lupa`)

- Página: https://polyhaven.com/a/magnifying_glass_01
- API: https://api.polyhaven.com/files/magnifying_glass_01 (resolução 1k, glTF com arquivos soltos)
- Autor: Nazar Borodavka; publicado no Poly Haven em 2021-10-06
- Licença: CC0 (https://polyhaven.com/license)
- Crédito: Dispensa; cortesia Nazar Borodavka, Poly Haven
- Crédito de legenda: não pede
- Baixado em: 2026-10-02T14:40:13-03:00
- Status no catálogo: liberado

| arquivo baixado | URL | bytes | md5 | md5 da API |
|---|---|---|---|---|
| `magnifying_glass_01_1k.gltf` | https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/magnifying_glass_01/magnifying_glass_01_1k.gltf | 4.929 | `2ff0fc8378d69d10f6221c12fbb78237` | `2ff0fc8378d69d10f6221c12fbb78237` |
| `magnifying_glass_01.bin` | https://dl.polyhaven.org/file/ph-assets/Models/gltf/8k/magnifying_glass_01/magnifying_glass_01.bin | 182.032 | `26b09b8afbfef0965f85b08483afabef` | `26b09b8afbfef0965f85b08483afabef` |
| `textures/magnifying_glass_01_arm_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/magnifying_glass_01/magnifying_glass_01_arm_1k.jpg | 114.589 | `9470e410a7c6f15fe8af987a945fa66f` | `9470e410a7c6f15fe8af987a945fa66f` |
| `textures/magnifying_glass_01_diff_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/magnifying_glass_01/magnifying_glass_01_diff_1k.jpg | 55.904 | `7d1288b4ddb69d748011798c77115dd8` | `7d1288b4ddb69d748011798c77115dd8` |
| `textures/magnifying_glass_01_nor_gl_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/magnifying_glass_01/magnifying_glass_01_nor_gl_1k.jpg | 21.380 | `1f24457927a169fc6c196e2d0dcca73c` | `1f24457927a169fc6c196e2d0dcca73c` |
| `textures/magnifying_glass_01_rough_1k.jpg` | https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/magnifying_glass_01/magnifying_glass_01_rough_1k.jpg | 88.074 | `5d830df4581a1773072dc9add32a524b` | `5d830df4581a1773072dc9add32a524b` |

GLB final: `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d/lupa_polyhaven_nazar-borodavka.glb` (465.752 bytes, md5 `04f57108317a0aeaf5df02d7e7590d46`).

O que mudou: glTF de 1k empacotado em GLB único pelo Blender 5.2 (importado e exportado; as texturas JPEG entram sem reencode); a malha virou dois nós (Armacao e Lente); nós, malhas e materiais em português; geometria sem mudança.

Conversão: `KIT/modelos/blender/converte.py` com `KIT/modelos/mapas/lupa_polyhaven_nazar-borodavka.json`.

## Mug (`glb-caneca`)

- Página: https://poly.pizza/m/fis2ugeLbn
- Autor: Kenney
- Licença: CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Crédito: Dispensa; cortesia Kenney
- Crédito de legenda: não pede
- Baixado em: 2026-10-02T14:53:19-03:00
- Status no catálogo: liberado

| arquivo baixado | URL | bytes | md5 | md5 da API |
|---|---|---|---|---|
| `caneca.glb` | https://static.poly.pizza/5600ffdc-21d2-4e62-93e2-1b255738e43d.glb | 15.440 | `5fb859cfdeb25fca54aa2c5ec05e6b8e` | não informa |

GLB final: `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d/caneca_polypizza_kenney.glb` (16.100 bytes, md5 `c19edf2775b69daf1eaa91ea7dfaf2ef`).

O que mudou: nós, malhas e materiais renomeados em português; nó raiz Caneca com escala pra metros (0,095 m de altura) e base em y = 0 (o eixo do copo continua em x = 0 e z = 0); geometria e materiais sem mudança.

Conversão: `KIT/modelos/ajusta_glb.py` com `KIT/modelos/mapas/caneca_polypizza_kenney.json`.

## Wallet (`glb-carteira`)

- Página: https://poly.pizza/m/bN7GPQFma7_
- Autor: Poly by Google
- Licença: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)
- Crédito: 'Wallet' por Poly by Google (Poly Pizza, CC BY 3.0), modificado
- Crédito de legenda: `'Wallet' por Poly by Google (Poly Pizza, CC BY 3.0)`
- Atenção: o autor exigido pela CC BY 3.0 é 'Poly by Google' e cita Google: precisa de avaliação do Pedro antes de usar, porque a regra do kit é não citar marca na legenda.
- Baixado em: 2026-10-02T14:53:20-03:00
- Status no catálogo: liberado

| arquivo baixado | URL | bytes | md5 | md5 da API |
|---|---|---|---|---|
| `carteira.glb` | https://static.poly.pizza/bb633adb-57f0-4d6f-8752-436e0047c96d.glb | 59.856 | `c4d0a6e36075bcb6f5e785d1e63f5649` | não informa |

GLB final: `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d/carteira_polypizza_poly-by-google.glb` (60.688 bytes, md5 `07732bcaa5f3cfb981f72979d86567ab`).

O que mudou: nós, malhas e materiais renomeados em português; nó raiz Carteira com escala pra metros (0,11 m de largura) e translação que traz o modelo, que vinha longe da origem, pro centro, com a base em y = 0; geometria e material sem mudança.

Conversão: `KIT/modelos/ajusta_glb.py` com `KIT/modelos/mapas/carteira_polypizza_poly-by-google.json`.

## Glass Jar (`glb-pote-vidro`)

- Página: https://poly.pizza/m/8dGz3QaoAG-
- Autor: Jarlan Perez
- Licença: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)
- Crédito: 'Glass Jar' por Jarlan Perez (Poly Pizza, CC BY 3.0), modificado
- Crédito de legenda: `'Glass Jar' por Jarlan Perez (Poly Pizza, CC BY 3.0)`
- Baixado em: 2026-10-02T14:53:21-03:00
- Status no catálogo: liberado

| arquivo baixado | URL | bytes | md5 | md5 da API |
|---|---|---|---|---|
| `pote.glb` | https://static.poly.pizza/a84a089e-b363-4a1d-b17b-55d3b24af7dd.glb | 11.108 | `361a16b821d700731634cd04845b6dc3` | não informa |

GLB final: `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d/pote-vidro_polypizza_jarlan-perez.glb` (11.980 bytes, md5 `f41ccb823d2dc0939aaed5aa2f7d1bce`).

O que mudou: a malha única virou dois nós (Vidro e Tampa) e os materiais foram renomeados em português; nó raiz Pote com escala pra metros (0,14 m de altura), centrado em x e z, base em y = 0; geometria e materiais sem mudança.

Conversão: `KIT/modelos/ajusta_glb.py` com `KIT/modelos/mapas/pote-vidro_polypizza_jarlan-perez.json`.

# Modelos detalhados pra argila (05/10/2026)

Pedido do Pedro em 05/10: "as animações e os assets 3D melhores e mais detalhados", pro reel que compara a contabilidade tradicional (argila cinza) com o app. Sem Envato e sem compra: só licença livre. Seis GLB novos, todos sem textura (a cena pinta de argila pelo material), com as partes que animam em nós próprios e catalogados em `KIT/catalogos/modelos/aquisicoes-2026-10-05.json` (bloco render em `revisao-render-2026-10-05.json`). O registro em JSON dos downloads está em `KIT/modelos/registros/downloads-2026-10-05.json`.

Onde ficam: `_assets-externos/kit-2026-10/modelos-3d/`, cada GLB com a prova de licença ao lado (`<arquivo>.licenca.txt`: página, autor, licença, como foi baixado, md5 e, nos do Sketchfab, a resposta da API pública com a licença). A pasta `_assets-externos/modelos-3d/` é intocável pelo DESENHO (seção 13) e o `KIT/lib/escrita.py` recusa gravar lá.

| id | arquivo final | fonte | autor | licença | baixado (B) | GLB final (B) | md5 do GLB final |
|---|---|---|---|---|---|---|---|
| `glb-despertador-detalhado` | `despertador-detalhado_polyhaven_james-ray-cock.glb` | Poly Haven (o GLB do kit de 01/10) | James Ray Cock e Yann Kervran | CC0 | (sem download novo) | 257.748 | `43b3bd950ea8d2498088498bc2b58d9d` |
| `glb-ampulheta` | `ampulheta_sketchfab_kodie-russell.glb` | Sketchfab, cópia do Objaverse | Kodie Russell | CC BY 4.0 | 5.737.776 | 432.924 | `bbadfc493fc703d17493857bcbff034e` |
| `glb-telefone-disco` | `telefone-disco_sketchfab_pan-stasian.glb` | Sketchfab, cópia do Objaverse | pan.stasian | CC BY 4.0 | 4.868.780 | 368.076 | `3a05380f35efb67943a5cbc48d0b2b74` |
| `glb-pastas-az` | `pastas-az_sketchfab_janexx.glb` | Sketchfab, cópia do Objaverse | janexx | CC BY 4.0 | 3.529.036 | 217.152 | `c606de9c22aa070afcc28be2e5e1b6ce` |
| `glb-carimbo-detalhado` | `carimbo-detalhado_higgsfield_legalizai.glb` | Higgsfield (tripo_3d) | Legalizaí (gerado por IA) | própria | 863.548 | 561.744 | `4a2399a09892a05e89f2d4d868aacc3b` |
| `glb-dispensador-senha` | `dispensador-senha_higgsfield_legalizai.glb` | Higgsfield (tripo_3d) | Legalizaí (gerado por IA) | própria | 915.948 | 598.816 | `0a48bc8c069000e1b92952a1f28e4070` |

Todos passam pelo `KIT/modelos/blender/detalhados.py <modelo> <entrada> <saida.glb> --extras <extras.json>` (Blender 5.2 em segundo plano, gravação pelo `escrita.py`), que tira as texturas, separa e renomeia as partes, põe o pivô de cada parte que anima, leva pra metros com a base em y = 0 (o telefone tem a origem no centro do corpo) e grava os materiais por parte em tons de argila fria.

## Como o Sketchfab entrou sem conta

O Sketchfab pede login pra baixar. Os três CC BY saíram da cópia redistribuída no Objaverse (`allenai/objaverse` no Hugging Face, `glbs/<pasta>/<uid>.glb`), que guarda o GLB do próprio Sketchfab com a licença de cada modelo. A busca foi na API pública do Sketchfab (`/v3/search` com `downloadable=true` e licença `cc0` ou `by`), e a licença de cada escolhido foi conferida em `/v3/models/<uid>` no dia (CC Attribution, `creativecommons.org/licenses/by/4.0`). O índice do Objaverse (`object-paths.json.gz`, 19.803.736 bytes, metadado e não modelo) foi baixado uma vez pro scratchpad pra achar o caminho de cada uid e apagado no fim.

## Alarm Clock 01, preparado pra argila (`glb-despertador-detalhado`)

- Página: https://polyhaven.com/a/alarm_clock_01 (CC0, https://polyhaven.com/license)
- Origem: o GLB do kit de 01/10 (`_assets-externos/modelos-3d/relogio-despertador_polyhaven_alarm-clock-01.glb`, md5 `17f4832c355215d5e798a8a2fd5f7b37`), sem download novo
- O que mudou: sem textura; a malha do corpo (174 partes soltas) virou nós com nome por região: Corpo, Aro, Mostrador, Eixo, SinoEsquerdo, SinoDireito, Martelo, Alca e Pes; o vidro virou o nó Vidro; os três ponteiros têm a malha apontando pro 12, o pivô no centro do mostrador e a hora padrão 10:10:36 no nó, empilhados como num relógio de verdade (horas, minutos e segundos por cima); 12 marcas de hora acrescentadas em relevo de 0,3 mm (nó Marcas: o original tinha algarismos romanos na textura); UV de 0 a 1 no Mostrador pra um pintor de mostrador; pés em y = 0. 9.129 triângulos.

## Hour Glass (`glb-ampulheta`)

- Página: https://sketchfab.com/3d-models/cb0e7bf9c2c34681a1c46510298eca2e
- Autor: Kodie Russell (KodieRussell); publicado em 02/06/2019
- Licença: CC BY 4.0 (conferida na API do Sketchfab em 05/10)
- Crédito de legenda: `'Hour Glass' por Kodie Russell (Sketchfab, CC BY 4.0)`
- Baixado em: 2026-10-05T14:45:09-03:00, de `glbs/000-038/cb0e7bf9c2c34681a1c46510298eca2e.glb` (5.737.776 bytes, md5 `7a23f84ce7a55c126d8e490e5c214555`)
- O que mudou: sem textura; escala pra 0,18 m de altura (o arquivo tinha 0,273); nós Base, Topo, Colunas, Rolhas, Vidro, AreiaCima, AreiaBaixo e FioAreia; pivô das duas areias no pé e do fio no topo; geometria sem mudança (22.636 triângulos).

## Slightly used telephone (`glb-telefone-disco`)

- Página: https://sketchfab.com/3d-models/c0ec549c914545a8bb29620b70491afd
- Autor: pan.stasian (pan_stasian); publicado em 07/01/2021
- Licença: CC BY 4.0 (conferida na API do Sketchfab em 05/10)
- Crédito de legenda: `'Slightly used telephone' por pan.stasian (Sketchfab, CC BY 4.0)`
- Baixado em: 2026-10-05T14:45:12-03:00, de `glbs/000-158/c0ec549c914545a8bb29620b70491afd.glb` (4.868.780 bytes, md5 `cc824dc264e1b1b6e8668c02a1224ada`)
- O que mudou: sem textura (a plaquinha da frente era textura); escala com o fone de 0,21 m; nós Corpo, Metal, Mostrador, Pes, Fone, Fio e o disco de discar dentro do vazio DiscoEixo (inclinado 36,6 graus, o Disco gira em rotation.z); o fio espiral foi simplificado de 40.139 pra 6.421 triângulos (decimate); origem no centro do corpo com o fone, sem o fio. 15.751 triângulos.

## Several Folders (`glb-pastas-az`)

- Página: https://sketchfab.com/3d-models/1a493b49ef954985ab8057ca66c387d5
- Autor: janexx; publicado em 06/11/2020
- Licença: CC BY 4.0 (conferida na API do Sketchfab em 05/10)
- Crédito de legenda: `'Several Folders' por janexx (Sketchfab, CC BY 4.0)`
- Baixado em: 2026-10-05T14:48, de `glbs/000-150/1a493b49ef954985ab8057ca66c387d5.glb` (3.529.036 bytes, md5 `9890a67bb05ab42855937e350df0a233`)
- O que mudou: sem textura (as etiquetas Bills, House, TaxRecords e Work eram textura e saíram); escala com 0,32 m de altura; cinco nós Pasta1 a Pasta5 com pivô no pé; bisel de 1,5 mm nas arestas e sombreado suave. 5.304 triângulos.

## Carimbo e dispensador de senha (gerados no Higgsfield)

Nada com licença livre e bom o bastante: os carimbos do Sketchfab são de 1.000 triângulos ou escaneamentos de museu acima de 30 MB; dispensador de senha não existe. Os dois saíram do `generate_3d` do Higgsfield com o modelo `tripo_3d` (texto pra 3D, sem textura e sem PBR, `face_limit` 30.000, `auto_size`), 2,5 créditos cada (custo conferido com `get_cost` antes; 5 créditos no total). Prompt, negativo, job e md5 no `.licenca.txt` de cada um.

- Carimbo: job `1fa67fbb-1f2a-4967-8f50-c9e478826d27`; girado 90 graus pra o lado comprido do bloco ficar de frente; 0,085 m de altura; malha única de 28.826 triângulos.
- Dispensador de senha: job `98915ce7-a56b-4336-8100-8d7991fe2c71`; 0,30 m de altura; malha única de 29.550 triângulos. Experimental: sozinho lê como uma rosca em pé.

## Baixados e descartados (apagados do scratchpad)

| arquivo | autor | por que saiu |
|---|---|---|
| Hourglass (`a453e90d47b74260b5e5ccd5a965fe3e`) | lessart | 69.000 triângulos em 5 malhas, sem a areia separada |
| Calendar 2021 (Free) (`d94be1d2dde6490bab6cae3579088e88`) | pineapple-pine | as folhas numa malha só (32.044 triângulos) e espirais de 19.028: não dá pra virar folha |
| calendar (`49f40f6f098c41d6b004cad29ab1fa06`) | Lordies | bloco de destacar deitado, folhas numa malha só, texto em russo na textura |
| File_Folder_drawer (`91ef22553dc64200862059a588709336`) | xbassad | arquivo de aço de caixas simples e grande demais pra mesa |
