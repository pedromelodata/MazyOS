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
| `blender/detalhados.py` | prepara os modelos detalhados pra argila de 05/10 (despertador, ampulheta, telefone, pastas, carimbo, senha): sem textura, partes com nome e pivô, metros |
| `cataloga_detalhados.py` | gera a camada `aquisicoes-2026-10-05.json` dos modelos detalhados (mesma medição do `cataloga.py`) |
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
| `registros/downloads-2026-10-05.json` | o mesmo pros modelos detalhados de 05/10 (os usados e os descartados) |
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

## Modelos detalhados pra argila (05/10/2026)

Pedido do Pedro em 05/10 ("as animações e os assets 3D melhores e mais detalhados"), pro reel que compara a contabilidade tradicional (argila cinza) com o app. Seis GLB sem textura nenhuma: a cena pinta de argila pelo material (`"materiais": {"*": {...}}`), e os materiais já vêm em tons de argila fria e com nome por parte. As partes que animam são nós próprios, com o pivô onde giram. Catálogo: `KIT/catalogos/modelos/aquisicoes-2026-10-05.json` (campo `partes` de cada item: o que gira, onde e como) e o bloco render em `revisao-render-2026-10-05.json`. Os GLB ficam em `_assets-externos/kit-2026-10/modelos-3d/`, cada um com a prova de licença ao lado (`<arquivo>.licenca.txt`); a pasta `_assets-externos/modelos-3d/` é intocável (DESENHO, seção 13). Fonte, download e mudanças de cada um: `baixados.md`, seção de 05/10.

| id | nós | tamanho real (m) | triângulos | licença | crédito |
|---|---|---|---|---|---|
| `glb-despertador-detalhado` | Despertador > Corpo, Aro, Mostrador, Marcas, Eixo, PonteiroHoras, PonteiroMinutos, PonteiroSegundos, SinoEsquerdo, SinoDireito, Martelo, Alca, Pes, Vidro | 0,132 x 0,174 x 0,067 | 9.129 | CC0 (Poly Haven) | não |
| `glb-ampulheta` | Ampulheta > Base, Topo, Colunas, Rolhas, Vidro, AreiaCima, AreiaBaixo, FioAreia | 0,080 x 0,180 x 0,080 | 22.636 | CC BY 4.0 (Sketchfab) | 'Hour Glass' por Kodie Russell |
| `glb-telefone-disco` | Telefone > Corpo, Metal, Mostrador, Pes, Fone, Fio, DiscoEixo > Disco | 0,325 x 0,165 x 0,144 (com o fio; o corpo com o fone tem 0,21) | 15.751 | CC BY 4.0 (Sketchfab) | 'Slightly used telephone' por pan.stasian |
| `glb-pastas-az` | PastasAZ > Pasta1 a Pasta5 | 0,349 x 0,32 x 0,26 | 5.304 | CC BY 4.0 (Sketchfab) | 'Several Folders' por janexx |
| `glb-carimbo-detalhado` | Carimbo > Corpo | 0,051 x 0,085 x 0,036 | 28.826 | própria (Higgsfield, tripo_3d) | não |
| `glb-dispensador-senha` | DispensadorSenha > Corpo | 0,258 x 0,30 x 0,181 | 29.550 | própria (Higgsfield, tripo_3d) | não |

Todos com Y pra cima, frente pra +Z, base em y = 0 e pivô "centro" no catálogo, menos o telefone (pivô "origem": a origem do arquivo é o centro do corpo com o fone, sem o fio espiral, e os pés ficam em y = -0,0804). Tudo está liberado e entra no render (prova de 05/10).

**Partes que animam** (no three.js, o nó tem o nome do Blender; rotação em radianos):

- Despertador: os três ponteiros têm o pivô no centro do mostrador e giram em `rotation.z` (0 aponta pro 12; o sentido horário é negativo): horas `-2*pi*((h % 12) + min/60)/12`, minutos `-2*pi*min/60`, segundos `-2*pi*s/60`. No arquivo eles marcam 10:10:36. Os sinos têm o pivô no centro de cada um (tremor em `rotation.z`) e o martelo no pé, entre os sinos (vai e volta em `rotation.z`). O Mostrador tem UV de 0 a 1 (v = 1 em cima) pra um pintor de mostrador, se a peça quiser números.
- Ampulheta: `AreiaCima` com o pivô no gargalo (`scale.y` de 1 a 0 esvazia), `AreiaBaixo` com o pivô no pé (`scale.y` de 0 a 1 enche) e `FioAreia` com o pivô no topo (o fio que cai). Virar a ampulheta é girar o objeto inteiro.
- Telefone: `Fone` com o pivô no centro dele (levantar com `position.y`); o `Disco` de discar fica dentro do vazio `DiscoEixo`, inclinado 36,6 graus, e gira em `rotation.z` em volta do próprio eixo. O `Fio` é estático: com o fone levantado ele não acompanha.
- Pastas AZ: cada pasta com o pivô no meio do pé (cair em dominó é `rotation.z`).
- Carimbo e dispensador: malha única (carimbar é mexer o objeto inteiro).

**Argila.** Com a cena pintando tudo (`"*"`), o que o catálogo ajusta por nome continua por cima: no despertador, ponteiros, marcas e eixo escuros, mostrador claro e vidro transparente; na ampulheta, vidro transparente e areia mais escura; no telefone, o anel do disco claro.

**Tamanho no mundo de argila.** Na peça de 05/10 a pilha de A4 de argila mede 0,074 x 0,105 m (A4 a 0,353). Com `pose.s` 0,353 os modelos ficam do tamanho real ao lado dela: despertador 0,046 x 0,061 m, ampulheta 0,028 x 0,064, telefone 0,074 de largura de corpo (0,115 com o fio) e 0,058 de altura, pastas 0,123 x 0,113, carimbo 0,018 x 0,030, dispensador 0,091 x 0,106. As peças de argila de código são maiores que o real (o carimbo de argila tem 0,064 de altura, uns 2,1 vezes): pra casar com elas, suba o `s` na mesma proporção.

**Provas (05/10).** `KIT/provas/modelos/render/detalhados-01.jpg` (o `kit.py prova-modelos` normal, com o `--folha-nome detalhados`), `detalhados-argila-01.jpg` (a mesma prova com a cena pintando de argila: `{"*": {cor #D9DDE2, rugosidade 0,82, metalico 0, envMap 0,3, semMapa}}`) e `detalhados-argila-luz-carrossel.jpg` (os seis em argila no KitMotion, com a luz do carrossel, no tamanho real ao lado da pilha de A4: peça de teste `KIT/pecas/_prova-modelos-detalhados/`, que serve de exemplo de cena). A caixa medida no navegador bateu com a das props (0,00 mm) nos seis.

**Como gerar de novo** (Blender 5.2 em segundo plano; o extras é o JSON do `asset.extras` com título, autor, licença, página e mudanças):

```
blender --background --factory-startup --python KIT/modelos/blender/detalhados.py -- despertador <relogio-despertador_polyhaven_alarm-clock-01.glb> <saida.glb> --extras <extras.json>
blender ... -- ampulheta|telefone|pastas|carimbo|senha <baixado.glb> <saida.glb> --extras <extras.json>
python -B KIT/modelos/cataloga_detalhados.py
python -B KIT/catalogos/valida.py
python -B KIT/scripts/prova_modelos.py <ids> --folha-nome detalhados --grava-catalogo
```

**Cuidados.**

- Os três CC BY saíram da cópia do Objaverse (o Sketchfab pede login); a licença foi conferida na API pública do Sketchfab e está guardada no `.licenca.txt`. Crédito na legenda pelo `catalogo.py creditos <ids>`, sem marca.
- Carimbo e dispensador foram gerados por IA no Higgsfield (`tripo_3d`, 2,5 créditos cada): malha única e superfície de escultura, sem as partes separadas. O dispensador é experimental: sozinho lê como uma rosca em pé e pede contexto (legenda ou a fita com número).
- Calendário de mesa com folhas separadas não existe com licença livre: os do Sketchfab têm as folhas numa malha só. Fica pro procedural.
- O fio do telefone desce uns 5 mm abaixo dos pés (fica rente ao chão, escondido pelo papel).
