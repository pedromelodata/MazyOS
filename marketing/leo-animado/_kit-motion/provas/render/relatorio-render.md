# K06: prova do render do kit (KitMotion, KitProvaModelo, stills e public-kit)

Medido em 02/10/2026 pelo K06 (rodada 2). Contrato: `KIT/DESENHO.md`, revisão 2, seções 1, 3, 4.2 a 4.5, 4.9 a 4.12, 5, 7.4, 11 e 13. Tudo aqui saiu dos JSON da execução (scripts e saídas no scratchpad do K06); os PNG grandes foram apagados no fim, ficam só os 6 stills do guia, as miniaturas e esta folha.

## Resumo

- KitMotion (props do guia, geradas pelo props-guia.mjs do K02) contra GuiaPronta no mesmo bundle (public-kit), 54 quadros, 2 abas de cada: 53 quadros idênticos pixel a pixel a uma aba do GuiaPronta (md5 dos pixels) e o quadro 111 também idêntico no reteste com 4 abas de cada.
- O GuiaPronta original não é determinístico: entre duas abas do mesmo bundle, 6 dos 54 quadros mudam em poucos pixels (até 20 níveis), nas teclas laterais do celular. O KitMotion reproduz exatamente as mesmas variantes (seção 3).
- Os 3 stills do KitMotion nos quadros 0, 245 e 478 (stills-guia/) são, byte a byte, os mesmos PNG da linha de base do GuiaPronta tirada antes do kit existir no bundle.
- GuiaPronta contra o V4: média por quadro entre 0,7940 e 1,8858 (limite: menor que 2 em todos).
- As composições antigas não mudaram: depois do kit no bundle, as 5 da AberturaMes saíram iguais à linha de base nas 3 abas de cada quadro, e as do GuiaPronta também (no quadro 0, 2 das 3 abas iguais; a terceira é a outra variante do próprio original, 3 pixels com máximo 2). getCompositions lista exatamente as 10 ids.
- KitProvaModelo: celular, calendário de mesa em pt-BR, pílula "dia 20" e comprovante (com valor e com esqueleto) bem enquadrados, sem marca de terceiro e sem verde; flipY medido do calendário: false (com true a página sai de cabeça pra baixo).
- tsc: 0 erro no tsconfig do kit e 0 erro no da raiz (que agora checa os 25 arquivos de src/kit/render pelo Root.tsx); a linha de base (tsc-base.txt) era 0.
- Disco no fim: 471 MB livres; nenhuma pasta de render sobrou no Temp; os PNG grandes do scratchpad e o public temporário foram apagados.

## 1. Root.tsx e as 10 composições

- Cópia guardada antes da edição: `KIT/provas/render/Root.tsx.orig` (escrita.copia do escrita.py), md5 `f7203a36d37a590266800764eff91d45`, igual ao Root.tsx de antes (st_nlink 1, 2.101 bytes, 8 composições).
- O diff só acrescenta 3 linhas de import (KitMotion; KitProvaModelo e PROPS_PROVA_PADRAO; PROPS_GUIA e calculaMetadadosKit) e 2 `<Composition>`: `KitMotion` (fps 30, 1080x1920, durationInFrames 540, defaultProps = props-guia.json, calculateMetadata pelas props) e `KitProvaModelo` (1 quadro, 1080x1920, defaultProps com o celular do guia). Nenhuma linha das composições antigas mudou (`diff Root.tsx.orig Root.tsx`: só linhas `>`).
- getCompositions (Node API, um bundle rspack): 10 ids, exatamente LeoPrecificacao, MotionPrecificacao, BrollPrecificacao, AberturaMesLeo, AberturaMes, GuiaPronta, TesteIphone, CalendarioReview, KitMotion, KitProvaModelo.

## 2. Linha de base das composições antigas (antes e depois do kit no bundle)

Antes de mexer no Root.tsx (bundle ainda sem o kit), o stills.mjs tirou GuiaPronta (public-guia) nos quadros 0, 245 e 478 e AberturaMes (public-abertura) nos quadros 0, 60, 150, 300 e 450. Os md5 (do arquivo e dos pixels) e as miniaturas estão em `linha-de-base/antes.json` e `linha-de-base/miniaturas/`. Depois de tudo pronto, os mesmos stills com o bundle novo, 3 abas de cada (o GuiaPronta não é determinístico em alguns quadros, seção 3), em `linha-de-base/depois.json`.

| still | md5 dos pixels antes | depois (amostra 1) | máx | média | amostras depois iguais à linha de base |
|---|---|---|---:|---:|:---:|
| AberturaMes-0000.png | `5d01f8ea9be4` | `5d01f8ea9be4` | 0 | 0,000000 | 3 de 3 |
| AberturaMes-0060.png | `3f27e235dbdf` | `3f27e235dbdf` | 0 | 0,000000 | 3 de 3 |
| AberturaMes-0150.png | `2243771ccc5f` | `2243771ccc5f` | 0 | 0,000000 | 3 de 3 |
| AberturaMes-0300.png | `87c222cd7841` | `87c222cd7841` | 0 | 0,000000 | 3 de 3 |
| AberturaMes-0450.png | `b235609e725c` | `b235609e725c` | 0 | 0,000000 | 3 de 3 |
| GuiaPronta-0000.png | `8ff3b936d813` | `10294b729577` | 2 | 0,000002 | 2 de 3 |
| GuiaPronta-0245.png | `d1b1f2564278` | `d1b1f2564278` | 0 | 0,000000 | 3 de 3 |
| GuiaPronta-0478.png | `d3a41dc9c8e3` | `d3a41dc9c8e3` | 0 | 0,000000 | 3 de 3 |

## 3. KitMotion (props do guia) contra GuiaPronta, no mesmo bundle (public-kit), 54 quadros

Método: um bundle (rspack, como o remotion.config.ts) e um navegador, public-kit; cada still abre uma aba nova. Por quadro: 2 abas do GuiaPronta (sem props) e 2 do KitMotion (props-guia.json), em lotes de 5 quadros (20 PNG por lote), comparados e apagados antes do próximo lote pelo `compara.py lote`. Vale o melhor par kit contra GuiaPronta; a variação do GuiaPronta entre as duas abas também é medida.

Por que o melhor par: o GuiaPronta original muda de aba pra aba em poucos pixels. O GLTFLoader monta cada material do celular quando as texturas dele terminam de decodificar (createImageBitmap, assíncrono e em paralelo); o three desenha os opacos na ordem do id do material; e as teclas laterais do celular têm faces coplanares (z-fighting). Então a ordem de desenho, e com ela alguns pixels das teclas, muda de aba pra aba no próprio original (primeiro visto no quadro 0: 3 pixels, máximo 2; no quadro 2: máximo 6; em 8 abas, as duas variantes do quadro 0 apareceram nas duas composições). Não dá pra corrigir no kit sem mexer no original (intocável): o kit carrega os modelos do mesmo jeito e reproduz as mesmas variantes.

Reteste do quadro 111 (4 abas do GuiaPronta e 4 do KitMotion, no mesmo bundle): variantes 69a692cd (G1 K1 K3), 17cb5eaf (G2 G3 G4 K2 K4); idêntico: sim; melhor par: máximo 0 e média 0,000000; pior par GuiaPronta contra GuiaPronta: máximo 9.

Resultado: 53 de 54 quadros com o KitMotion igual, pixel a pixel, a uma aba do GuiaPronta (md5 dos pixels) na rodada de 2 abas; o que faltava (quadro 111: as 2 abas do kit numa variante e as 2 do GuiaPronta na outra, máximo 9) também ficou idêntico no reteste com 4 abas de cada. Resultado final: 54 de 54 idênticos (meta 0 atingida). Limite aceito era máximo até 2 e média até 0,05.

| quadro | kit = GuiaPronta (pixels) | kit x GuiaPronta, melhor par: máx | média | % px > 2 | variantes kit / guia | GuiaPronta x GuiaPronta (abas): máx | GuiaPronta x V4: média | máx |
|---:|:---:|---:|---:|---:|:---:|---:|---:|---:|
| 0 | sim | 0 | 0,000000 | 0,0000 | 1 / 2 | 2 | 1,6364 | 102 |
| 12 | sim | 0 | 0,000000 | 0,0000 | 2 / 1 | 0 | 1,5960 | 86 |
| 24 | sim | 0 | 0,000000 | 0,0000 | 2 / 2 | 19 | 1,6098 | 94 |
| 56 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,5803 | 94 |
| 63 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,6032 | 87 |
| 105 | sim | 0 | 0,000000 | 0,0000 | 2 / 1 | 0 | 1,6292 | 91 |
| 110 | sim | 0 | 0,000000 | 0,0000 | 2 / 1 | 0 | 1,6295 | 92 |
| 111 | não | 9 | 0,000012 | 0,0001 | 1 / 1 | 0 | 1,5764 | 92 |
| 118 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,1479 | 73 |
| 124 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,0434 | 63 |
| 127 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,0831 | 63 |
| 135 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,1684 | 79 |
| 150 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,1827 | 79 |
| 165 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,2163 | 79 |
| 171 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,1955 | 79 |
| 172 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,1863 | 79 |
| 183 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,2952 | 79 |
| 185 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,4835 | 87 |
| 200 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,5183 | 78 |
| 216 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,5563 | 71 |
| 230 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,5727 | 75 |
| 234 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,5853 | 78 |
| 241 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,8858 | 82 |
| 246 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,7533 | 78 |
| 262 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,7512 | 76 |
| 269 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,7409 | 79 |
| 276 | sim | 0 | 0,000000 | 0,0000 | 2 / 2 | 17 | 1,3654 | 81 |
| 279 | sim | 0 | 0,000000 | 0,0000 | 2 / 1 | 0 | 1,5135 | 45 |
| 281 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,5605 | 56 |
| 284 | sim | 0 | 0,000000 | 0,0000 | 2 / 1 | 0 | 1,5723 | 77 |
| 290 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,3199 | 74 |
| 300 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 0,7976 | 56 |
| 302 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 0,8023 | 63 |
| 306 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 0,8236 | 65 |
| 309 | sim | 0 | 0,000000 | 0,0000 | 2 / 1 | 0 | 0,8232 | 67 |
| 312 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 0,8226 | 66 |
| 316 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 0,8538 | 68 |
| 330 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 0,7940 | 57 |
| 345 | sim | 0 | 0,000000 | 0,0000 | 1 / 2 | 15 | 1,4264 | 74 |
| 360 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,4303 | 79 |
| 375 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,4246 | 80 |
| 404 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,4836 | 73 |
| 418 | sim | 0 | 0,000000 | 0,0000 | 2 / 2 | 20 | 1,5970 | 88 |
| 438 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,6235 | 84 |
| 448 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,5759 | 99 |
| 450 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,4990 | 24 |
| 452 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,5294 | 66 |
| 470 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,5908 | 82 |
| 478 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,5892 | 81 |
| 490 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,5995 | 81 |
| 510 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,5832 | 83 |
| 512 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,5820 | 78 |
| 525 | sim | 0 | 0,000000 | 0,0000 | 1 / 1 | 0 | 1,6058 | 91 |
| 539 | sim | 0 | 0,000000 | 0,0000 | 2 / 1 | 0 | 1,6136 | 82 |

## 4. GuiaPronta (still PNG) contra o V4 (h264 crf 15, yuv420p)

Quadro do V4 decodificado em memória com `scale=in_color_matrix=bt709:in_range=tv:out_range=full,format=rgb24` (nada gravado). Média da diferença absoluta por quadro: mínima 0,7940, máxima 1,8858 (limite: menor que 2 em todos). A diferença é do codec (h264 crf 15, yuv420p, faixa tv) e do grão por quadro do fundo; o máximo por pixel fica entre 24 e 102 nas bordas e no coral. Todos os 54 quadros passam.

## 5. KitProvaModelo (public temporário de hardlinks no scratchpad)

Public temporário no scratchpad, só com hardlinks (Sora, os 4 SVG da marca, `3d/glb-video-iphone.glb`, `3d/glb-calendario-mesa.glb` e as telas do guia), apagado no fim. Nenhum GLB novo entrou no public-kit.
Stills reduzidos pra 360x640 em `prova-modelo/` (e a folha `prova-modelo/folha-provas.jpg`).
flipY medido do glb-calendario-mesa: false (com true a página sai invertida). Também medido: a frente da página vai de v 0,337 a 1 na UV e mede 23 x 12,81 unidades do arquivo (proporção 1,795); o PintorCalendarioMesa já usa isso como padrão.
Primeira versão destes stills (descartada): a caixa medida incluía a sombra retangular do papel (o comprovante saía pequeno no quadro) e a página do calendário usava multiplicador branco (o coral saía salmão). Corrigido no código do K06 (sombra marcada com userData.ignoraCaixa; texturaMalha com o multiplicador #EEE7DD da folha do guia) e refeito.
Log do navegador da prova: nenhum erro, nenhum KIT_AVISO e nenhum EXT_. Disco: 431 MB antes, 420 MB depois; o Temp ficou limpo (bundle e perfil do Chrome desta execução apagados).

| still | caixa medida (m): mín | máx | tamanho | inspeção |
|---|---|---|---|---|
| glb-video-iphone (ângulo -20°, elevação 8°) | [-0.038857, -0.079771, -0.006161] | [0.038855, 0.079772, 0.0073] | [0.077712, 0.159543, 0.013461] | tela da splash do app de pé e com o logo da Legalizaí no lugar certo (flipY true do catálogo); vidro e moldura sem logo de terceiro; caixa igual à do catálogo levada pro rig, mais o vidro (z 0,0073) |
| glb-calendario-mesa, texturaMalha flipY false (escala 0,0087) | [0, 0, -0.08952] | [0.2001, 0.13581, 0.001651] | [0.2001, 0.13581, 0.091171] | página certa: "Outubro" no cabeçalho coral, iniciais D S T Q Q S S, 1º de outubro de 2026 na quinta, 20 em destaque coral, "passa pro próximo dia útil" embaixo; argolas tingidas de tinta e o suporte em #F1EEE9; caixa igual à do catálogo |
| glb-calendario-mesa, texturaMalha flipY true | [0, 0, -0.08952] | [0.2001, 0.13581, 0.001651] | [0.2001, 0.13581, 0.091171] | errado: a página sai de cabeça pra baixo (o "Outubro" invertido no pé da página). O flipY certo é false, a convenção do glTF |
| proc-pilula-dia20 (conteudo.texto "dia 20") | [-0.033601, -0.0146, -0.0046] | [0.033601, 0.0146, 0.0048] | [0.067202, 0.0292, 0.0094] | "dia 20" em branco Sora 800 na pílula coral, de pé; a caixa medida passa 0,2 mm da frente da forma (a etiqueta fica em z 0,0048, a forma vai até 0,0046) |
| proc-comprovante (dados padrão) | [-0.03, -0.055, -0.006599] | [0.03, 0.055, 0.002999] | [0.06, 0.11, 0.009597] | "Comprovante de pagamento", a linha do documento, razão social, CNPJ, período, vencimento, número do documento, R$ 178,31 em destaque, autenticação inventada e linha digitável com barras decorativas; sem banco, brasão, carimbo ou verde; caixa igual à do papel (0,06 x 0,11 com a curva) |
| proc-comprovante (mostraValor false) | [-0.03, -0.055, -0.006599] | [0.03, 0.055, 0.002999] | [0.06, 0.11, 0.009597] | igual ao anterior, com o valor trocado por esqueleto (peça de MEI, F063) |

## 6. TypeScript, public-kit, Temp, disco e REF

- Reconferência depois do último ajuste do código (a marca userData.ignoraCaixa na sombra do papel e o multiplicador da texturaMalha): KitMotion nos quadros 135, 245 (com a guia de papel na tela) e 478, renderizado de novo às 19:15, saiu igual pixel a pixel aos stills-guia/ (diferença 0 nos 3).
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit -p src/kit/tsconfig.json` deu 0 erro (código 0), também depois da última mudança; `--noEmit -p .` da raiz deu 0 erro (código 0), igual à linha de base `src/kit/testes/tsc-base.txt` (0).
- public-kit: 11 hardlinks do public-guia, todos com o mesmo inode e o mesmo tamanho da origem (Sora-wght.ttf 111.400 B; marca/logo-horizontal.svg 5.608, logo-ai-tinta.svg 5.608, logo-negativa-clara.svg 5.297, simbolo.svg 370; 3d/iphone.glb 3.937.968; 3d/watch.glb 7.482.820; telas/tela-splash.png 28.535, tela-inicio.png 92.859, tela-inicio-pagar.png 108.488, tela-imposto.png 51.169), st_nlink de 3 a 7, mais pecas/LEIA-ME.txt e ext/LEIA-ME.txt (texto pedido no pacote, st_nlink 1). Nenhum áudio (o mix-guia.wav do public-guia ficou de fora) e nenhum GLB além de iphone.glb e watch.glb.
- stills.mjs, recusas e guardas conferidas sem render: sem argumento sai com código 2; publicDir relativo, código 2; saída em caminho protegido (GP/), código 2; com KIT_LIMITE_DISCO_MB=100000 a guarda para antes do bundle, com código 3, e limpa o Temp. Em todas as execuções de verdade o stills.mjs apagou o próprio bundle (remotion-webpack-bundle-*) e o próprio perfil do Chrome (puppeteer_dev_chrome_profile-*), com nova tentativa quando o Chrome ainda segura a pasta. Também apaguei um perfil velho do Chrome que sobrou do render do V4 (11:31, 8 KB).
- Extensões: com src/kit/ext/ só com o LEIA-ME.md, o ext.ts devolveu a lista vazia sem nenhum EXT_AVISO ou EXT_ERRO no log do navegador (o require.context funcionou no rspack; o gera-ext.mjs não foi preciso).
- REF: `catalogo.py referencia guia-pronta-2026-10-14` deu "nada mudou" (código 0) no fim (os hardlinks só sobem o st_nlink, como a seção 4.13 prevê).
- Travessão (U+2014) e meia-risca (U+2013): 0 em 36 arquivos de texto do K06 (src/kit/render, src/kit/ext/LEIA-ME.md, public-kit/*.txt e KIT/provas/render), busca por bytes. Nenhum __pycache__ nem .tmp- sobrando.
- Disco: a comparação principal começou com 406 MB livres, desceu a 301 MB no pior momento (bundle, cópia do public-kit, perfil do Chrome e os 20 PNG do lote) e terminou com 396 MB. Cada execução só começou com 400 MB ou mais (escrita.exige_disco); a fila esperou cerca de 2 h 20 min por isso, com o C: entre 365 e 410 MB por causa das outras sessões. No fim: 471 MB livres.
- Observação: o st_nlink de Sora-wght.ttf, iphone.glb, logo-horizontal.svg e simbolo.svg subiu 1 durante a tarde por hardlink de outro processo (não do K06; o public temporário do K06 já foi apagado).

## 7. Desvios do contrato

- Critério da comparação KitMotion x GuiaPronta: o GuiaPronta original não é determinístico (seção 3). Em vez de 1 still de cada composição por quadro, foram 2 abas de cada, e vale o melhor par; a variação do GuiaPronta entre abas fica registrada ao lado. Pra caber no disco, os lotes ficaram com 5 quadros (20 PNG por lote, o mesmo que 10 quadros com 1 still de cada). O quadro 111, sem par igual com 2 abas, foi refeito com 4 abas de cada e ficou idêntico.
- Linha de base depois: 3 abas por quadro (e não 1), pelo mesmo motivo.
- stills.mjs usa o rspack (como o remotion.config.ts do render pela linha de comando) e o bundle sem cache (enableCaching false: nada gravado em node_modules). Campos opcionais a mais no JSON de trabalhos: saida por trabalho, foraDoLote, lote {tamanho, depois, apaga}, listaComposicoes, logs e limiteDiscoMb; props pode ser objeto ou caminho de .json. O log do navegador é agrupado por mensagem (a AberturaMes repete o mesmo aviso do three 32 mil vezes).
- Relógio: os 2 anéis de vibração do Cena3D.tsx ficam no rig, sempre invisíveis. No guia eles nunca aparecem, mas entram na caixa (Box3.setFromObject) que dimensiona a sombra de contato do relógio; sem eles a sombra sairia menor que a do original.
- Fecho e LinkBio: as medidas fixas do Guia.tsx (caixa e brilho do logo, padding e raio da pílula) escalam com props.fecho.layout.larguraLogo / 590 e props.fecho.link.tamanho / 34; nos valores do guia dá exatamente o mesmo CSS.
- Varredura: além do caso em pé (props.ambiente.varredura), o caso deitado do original (aparelho com rx > 1) continua com as constantes do Cena3D.tsx. O RectAreaLightUniformsLib.init só roda se ninguém iniciou antes (o init do three não é idempotente).
- PintorTelaKit: o contador formata R$ com ponto de milhar (no guia, 178,31, sai igual ao toFixed do original); o extra botao aceita `fundo` opcional (padrão o rgb(254,243,238) do original) e usa o `retorno` do extra (no guia, o mesmo "Código copiado" do estado).
- Pílula: texto longo encolhe a fonte pra caber na etiqueta (o "dia 20" cabe em 150 px e sai igual à texturaDia20).
- Comprovante (PintorComprovante): campos Razão Social, CNPJ, Período de Apuração, Data de Vencimento, Número do Documento, Valor Total do Documento (ou esqueleto com mostraValor false), Autenticação inventada e a linha digitável do DAS com barras decorativas. Nada de "Valor pago" (regra da palavra "pago"), nada de banco, brasão, carimbo ou verde.
- Calendário de mesa: a frente da página fica em v 0,337 a 1 da UV (de 0 a 0,314 é a borda de cima) e mede 23 x 12,81 no arquivo; o PintorCalendarioMesa desenha nessa proporção (1,795) e espreme na horizontal, sem distorção no modelo. A troca do mapa é só na primitiva que já tinha textura (a malha tem 3 primitivas). A textura pintada é multiplicada por #EEE7DD (o mesmo da folha do guia; texturaMalha.cor troca), porque com branco o coral saía salmão.
- KitProvaModelo: props {objeto, angulo, elevacao, margem, telas, regioes, rotulo}. A caixa medida (CAIXA_MEDIDA) é a das malhas visíveis, pelos vértices, sem a sombra retangular do papel (marcada com userData.ignoraCaixa, que não muda nada no KitMotion); o enquadramento usa a esfera dessa caixa.
- public-kit: os dois LEIA-ME.txt são os únicos arquivos que não são hardlink (são texto pedido no pacote).

## 8. Pendências

- K12: o GuiaPronta original não é determinístico (o GLTFLoader cria os materiais do celular na ordem em que as texturas terminam de decodificar, e o three desenha os opacos pela ordem do id do material; as teclas laterais têm faces coplanares). Em 6 dos 54 quadros (0, 24, 111, 276, 345 e 418), e também no quadro 2 (teste à parte), abas do mesmo bundle diferem em poucos pixels, até 20 níveis. Um render novo, do original ou do kit, pode não repetir o md5 do fluxo do V4 só por isso: o passo 8 da rodada 1 vai depender do critério de PSNR e SSIM. Nos stills, comparar com mais de uma aba (como o compara.py lote faz).
- Catálogo (K01, ou o K10 no provas.json): gravar no glb-calendario-mesa o flipY medido (false) e, nos params da texturaMalha, a região da frente (v 0,337 a 1, proporção 1,795), que hoje são o padrão do pintor. A caixa medida da pílula vai 0,2 mm além da forma na frente (a etiqueta em z 0,0048); a do catálogo calculada pelo K02 para em 0,0046.
- K07: o stills.mjs aceita lote com comando depois (é assim que a prova do K06 compara e apaga cada lote); o kit.py stills pode usar isso pra folha de prévia sem lotar o disco.
- Disco: o C: ficou entre 365 e 410 MB livres por mais de 2 h (outras sessões gravando); cada render do K12 e do K10 vai esperar a mesma janela de 400 MB.

