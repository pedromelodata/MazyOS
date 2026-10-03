# Modelos 3D do kit (pacote K09)

Modelos que faltavam pras peças de outubro: dois procedurais feitos no Blender (notebook genérico com tela, em dois acabamentos, e cédula genérica), o símbolo 3D da marca em GLB e sete downloads CC0 ou CC BY. Todos estão catalogados em `KIT/catalogos/modelos/aquisicoes-2026-10.json` (caixa, orientação, escala, malhas, triângulos, md5 e crédito de legenda). Contrato: `KIT/DESENHO.md`, seções 4.9, 4.12, 12 e 13.

Os GLB ficam em `_assets-externos/kit-2026-10/modelos-3d/` (11 arquivos, 7.098.444 bytes; o maior tem 2,8 MB). Não copie esses arquivos: o catálogo aponta pro original, e quando um GLB precisar estar no public do Remotion entra por hardlink (`escrita.liga`).

## O que tem nesta pasta

| caminho | o que faz |
|---|---|
| `blender/notebook.py` | notebook genérico, sem logo (Blender 5.2) |
| `blender/cedula.py` | cédula genérica de dupla face (Blender 5.2, textura do `texturas.py`) |
| `blender/simbolo.py` | símbolo da marca, do `marketing/3d/simbolo/simbolo-9x16.blend` aberto só pra leitura |
| `blender/converte.py` | glTF baixado (arquivos soltos) vira GLB único pelo Blender, com nós em português |
| `blender/confere.py` | importa GLB no Blender em segundo plano e relata nós, triângulos, materiais e caixa |
| `blender/_comum.py` | funções dos scripts de Blender (cena limpa, cor em linear, caixa arredondada, exportação segura) |
| `texturas.py` | texturas próprias no PIL: o check da face do símbolo e o atlas da cédula |
| `baixa.py` | download de um modelo por vez, com disco, limite de 15 MB e md5 da API conferidos |
| `limpa_texturas.py` | apaga texto e marca das texturas (cor, normal e ARM) por regiões |
| `ajusta_glb.py` | ajusta GLB pronto só pelo JSON: nomes, separação de partes e nó raiz com escala pra metros |
| `folha_texturas.py` | folha de contato reduzida das texturas (conferência sem abrir imagem em tamanho cheio) |
| `glb.py` | leitura e gravação de GLB em Python puro (roda no Blender e no Python do corte-viral) |
| `cataloga.py` | gera a camada de aquisições do catálogo, medindo tudo no disco e validando no esquema |
| `confere_k09.py` | conferência completa do pacote (67 itens em 02/10) |
| `mapas/` | mapa de cada conversão (nomes, partes, escala, extras de crédito) e regiões de limpeza das texturas |
| `registros/downloads-2026-10-02.json` | registro dos downloads (URL, bytes e md5 de cada arquivo) |
| `baixados.md` | fonte, página, licença, autor, data, md5, tamanho e o que mudou em cada download |

## Os 11 modelos

Todos em metros, com Y pra cima e escala 1 no catálogo (quando o arquivo original vinha em outra unidade, o nó raiz já leva a escala). Nós e materiais com nome em português. Sem Draco, sem meshopt e sem extensão obrigatória; texturas JPEG ou PNG embutidas.

| id | arquivo | nós principais | tamanho real (m) | triângulos | licença | status |
|---|---|---|---|---|---|---|
| `glb-notebook-grafite` | `notebook-grafite_legalizai_proprio.glb` | Notebook > Base (Teclado, Trackpad, Dobradica), Tampa (Moldura, Tela) | 0,31 x 0,219 x 0,286 aberto | 7.602 | própria | liberado |
| `glb-notebook-aluminio` | `notebook-aluminio_legalizai_proprio.glb` | os mesmos | os mesmos | 7.602 | própria | liberado |
| `glb-cedula-generica` | `cedula_legalizai_proprio.glb` | Cedula > Papel | 0,14 x 0,065 | 1.344 | própria | liberado |
| `glb-simbolo-legalizai` | `simbolo_legalizai_proprio.glb` | Simbolo > SimboloCorpo, SimboloFace | 0,36 x 0,36 x 0,045 | 2.510 | própria | liberado |
| `glb-caixa-papelao` | `caixa-papelao_polyhaven_rahul-chaudhary.glb` | CaixaPapelao > Caixa | 0,39 x 0,34 x 0,52 | 16.952 | CC0 | liberado |
| `glb-camera-fotografica` | `camera-fotografica_polyhaven_rajil-jose-macatangay.glb` | CameraFotografica > Corpo, CorpoLente, VidroLente, Baioneta, Alca | corpo 0,147 x 0,078 x 0,039 | 26.987 | CC0 | aceito-com-risco |
| `glb-lampada` | `lampada_polyhaven_josh-dean.glb` | Lampada > Vidro, Base | 0,06 x 0,10 | 4.372 | CC0 | liberado |
| `glb-lupa` | `lupa_polyhaven_nazar-borodavka.glb` | Lupa > Armacao, Lente | 0,13 x 0,27 | 7.240 | CC0 | liberado |
| `glb-caneca` | `caneca_polypizza_kenney.glb` | Caneca > Corpo | 0,12 x 0,095 x 0,10 | 232 | CC0 | liberado |
| `glb-carteira` | `carteira_polypizza_poly-by-google.glb` | Carteira > Corpo | 0,11 x 0,013 x 0,077 | 988 | CC BY 3.0 | liberado (ver crédito) |
| `glb-pote-vidro` | `pote-vidro_polypizza_jarlan-perez.glb` | Pote > Vidro, Tampa | 0,091 x 0,14 | 304 | CC BY 3.0 | liberado |

Nome dos arquivos: `objeto_fonte_autor.glb` nos baixados; nos próprios, `objeto_legalizai_proprio.glb`, no padrão do nome pedido pro símbolo.

### Notebook

- Base de 0,31 x 0,215 x 0,016 m com cantos arredondados (raio de 12 mm) e borda arredondada; teclado discreto (teclas de 0,9 mm acima do tampo, seis fileiras), trackpad e dobradiça.
- Tampa com pivô no eixo da dobradiça (nó `Tampa`): no three.js, `rotation.x = 0` fecha e `rotation.x = -1,919862` (110 graus, o padrão) abre. Outro ângulo de fábrica: `--abertura`.
- Tela: malha separada `Tela`, filha da `Tampa`, plano 16:10 de 0,296 x 0,185 m, 0,3 mm à frente da moldura. A UV vai de 0 a 1, com u da esquerda pra direita e v = 1 na borda de cima, igual à do celular: use `CanvasTexture` de 2560 x 1600 com `flipY = true`, `colorSpace = SRGBColorSpace` e material sem tone mapping. Conferido no GLB (`confere_k09.py`): a borda de cima no mundo, com a tampa aberta, tem v = 1.
- Acabamentos: grafite fosco #3A3D44 e alumínio claro #D9D6D0 (`--acabamento`); materiais `Carcaca`, `Trackpad`, `Dobradica`, `Teclas`, `Moldura` e `Tela`, todos de uma face só.

### Cédula

- 0,14 x 0,065 m, levemente curva (as pontas recuam 4 mm, `--curva`), dupla face: frente creme e verso coral, desenhadas no PIL pelo `texturas.py` na paleta da marca. Só ornamento: guilhoché, rosetas, faixa de segurança e moldura.
- Nada da cédula real: sem número, sem número de série, sem "R$", sem brasão, sem retrato e sem texto.
- Duas folhas a 0,12 mm uma da outra, com material de uma face só (sem briga de profundidade); o verso fica de pé quando a nota gira no eixo vertical. Atlas JPEG de 1024 x 1024 embutido (desenhado em 2048 e reduzido).

### Símbolo da marca

- Só `simbolo_corpo` e `simbolo_face` do `simbolo-9x16.blend` (sem câmera, luzes, chão e ações), com os modificadores do corpo aplicados. O `.blend` é aberto só pra leitura e o script confere o md5 antes e depois (`34a9188501af8a14eafe6b651d083c84`; nenhum `.blend1`).
- Corpo com o coral #F2643C exato, convertido de sRGB pra linear no `baseColorFactor` (0,887923; 0,127438; 0,045186).
- A face do `.blend` usava a sequência `tex-check/check_####.png`, que não existe no disco (é gerada pelo `marketing/vinheta/check-frames.mjs`). O último quadro dela é o check completo: o `texturas.py` refaz esse quadro a partir do path do `simbolo.svg` (o mesmo do `check-frames.mjs`), coral #F2643C com o check branco, e ele entra como textura sRGB (PNG de 2048).
- Tamanho real de 0,36 m, centro na origem, face pra +Z. Uso: fecho "Vai, Legalizaí" e assinatura (`render.sombra 0.5`).

## Como gerar de novo

Sempre em segundo plano, sem salvar `.blend`, com 400 MB livres no C: (os scripts conferem e param antes). Blender: `"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe"`; Python: o do corte-viral, com `-B`.

```
blender --background --factory-startup --python KIT/modelos/blender/notebook.py -- <saida.glb> [--acabamento grafite|aluminio] [--abertura 110]
blender --background --factory-startup --python KIT/modelos/blender/cedula.py -- <saida.glb> [--curva 0.004]
blender --background --factory-startup --python KIT/modelos/blender/simbolo.py -- <saida.glb> [--blend <caminho>]
```

Downloads (o caminho completo de cada um está no `baixados.md`):

```
python -B KIT/modelos/baixa.py polyhaven <id> <pasta> [--res 1k]
python -B KIT/modelos/baixa.py arquivo <url> <pasta/arquivo.glb>
python -B KIT/modelos/limpa_texturas.py KIT/modelos/mapas/<id>_limpeza.json <pasta>/textures <pasta>/limpas
blender --background --factory-startup --python KIT/modelos/blender/converte.py -- <pasta>/<id>_1k.gltf <saida.glb> --mapa KIT/modelos/mapas/<nome>.json
python -B KIT/modelos/ajusta_glb.py <baixado.glb> <saida.glb> --mapa KIT/modelos/mapas/<nome>.json
python -B KIT/modelos/cataloga.py
python -B KIT/modelos/confere_k09.py
```

A gravação passa sempre pelo `KIT/lib/escrita.py` (temporário na mesma pasta e `os.replace`; recusa hardlink e caminho protegido). Os GLB do Blender saem primeiro numa pasta temporária `k09-*` do Temp, que o próprio script apaga.

## Crédito de legenda

Só os CC BY pedem crédito, e a legenda usa `licenca.creditoLegenda` (`catalogo.py creditos <ids>`). Com a carteira e o pote juntos sai: "Modelos 3D: 'Wallet' por Poly by Google e 'Glass Jar' por Jarlan Perez (Poly Pizza, CC BY 3.0), modificados". O autor exigido da carteira é "Poly by Google", que cita Google: avaliar com o Pedro antes de usar a carteira numa peça. Os CC0 e os próprios não pedem crédito.

## Cuidados

- Câmera: o desenho é de uma câmera telemétrica clássica reconhecível. Marca, modelo, números de série, escalas, mostradores numerados, um emblema e pictogramas foram apagados das texturas de cor, normal e ARM; nunca citar marca na peça nem na legenda. Por isso o status é aceito-com-risco.
- Lâmpada, lupa e câmera usam `KHR_materials_transmission` no vidro (passe extra no three.js). O pote usa vidro em `alphaMode BLEND` e não tem normais (sombreado chapado).
- A caixa é realista e gasta (tampo rasgado). O texto impresso foi apagado; ficaram dois pictogramas de manuseio, sem texto.
- A caneca do Kenney é estilizada (octogonal, com aros, mais pra caneca de chope); a cor sai dos materiais `Corpo` e `Faixas`, fáceis de retingir.
- Conferência de texto e marca: em folha de miniaturas (`folha_texturas.py`), nunca abrindo textura em tamanho cheio.
- Render de prova de cada modelo é do K10 (`modelos/provas.json`); a sombra 0,8 do notebook é palpite até a prova.
- Desde 03/10 (frente MODELOS NO RENDER), modelo novo só entra numa peça com o bloco `render` numa sobreposição do catálogo (`KIT/catalogos/modelos/revisao-render.json` ou um `revisao-*.json` novo: `publicKit` `3d/biblioteca/<id>.glb`, `rotacaoBase` com a frente pra +Z, `pivo` "centro", escala, cor de marca por `cores` ou `materiais`, `sombra` e `sHeroi`) e com a prova de render (`kit.py prova-modelos <id> --grava-catalogo`, folha de contato em `KIT/provas/modelos/render/`). Vidro com transmissão e sem textura sai bem; vidro com a textura do corpo sai preto (a lâmpada: `materiais.Vidro.semMapa` e `transmissao` 0); malha sem normais ganha `normaisSuaves`. O passo a passo está no `KIT/README.md`, seção "Um modelo 3D".
