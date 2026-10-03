# Carrossel 05/10 · Contabilidade tradicional e Legalizaí · especificação de direção de arte (v3)

- Peça: `reel_93834bb1` do cronograma (campo `carrossel`), feed de 05/10/2026, pilar 3 (Nossa origem: o escritório Legalize, 22 anos em BH, virando app), bloco Afeto, tipo conexão, persona transversal.
- Pedido do Pedro: "Crie um carrossel assim: Contabilidade Tradicional Vs Legalizaí", com o texto colado (capa "Contabilidade tradicional e Legalizaí: o que muda pra você?").
- Entrega: 7 PNG 1080x1350 (4:5), RGB com sRGB embutido, sem transparência, em `png/`.
- Estado em 02/10, 19h53: **renderizado**. As 7 PNG, `folha.jpg`, `previa-390.jpg` (as telas na largura de um celular de 390 pt), `recortes/palco-N.jpg` (cada palco a 100 %) e `qa-cena.json` estão na pasta. QA do `pos.py` sem falha.

---

## 0. O que mudou na v3 (revisões de design e de regras de 02/10)

| ponto da revisão | o que foi feito |
|---|---|
| sem render | render real em scale 2 (2160 x 2700) e redução Lanczos pra 1080 x 1350 no `pos.py`, quadro a quadro |
| texto do palco ilegível | recortes da própria tela aprovada em cartões que flutuam na frente da metade de baixo do aparelho (telas 1 a 3); cartões, contrato e textos do palco com 24 px ou mais no quadro; "R$ 178,31" com uns 34 px |
| metade de baixo das telas em branco | os cartões flutuantes ocupam o vão branco sem cobrir interface |
| tela 4 fraca | aparelho com o splash e os dois cartões saindo da tela, em alturas diferentes; "Serviço" em coral-50 com borda coral e o símbolo, "Taxa do governo" em #F1EEE9 com o prédio em tinta e borda #CBC5BC; rótulos de 95 px no canvas de 900; o cartão da Taxa cobre o logo do splash |
| tela 4 afirmava "total único" (regras) | o Tradicional virou envelope aberto de três quartos, com a aba em V à vista e duas folhas de documento, sem barra de total e sem valor |
| Tradicional não descolava do fundo | vitrine em dois painéis arredondados (raio 24, borda fina): o frio em L* 83, o quente em coral-50 com halo; argila das superfícies grandes em frio-500; luz recalibrada (ver 2.5) |
| sem sombra entre objetos | sombras-blob no carimbo sobre a pilha e na caneta sobre a folha; `receiveShadow` nas superfícies de apoio; o que flutua sai do passe de contato e ganha sombra-blob própria, maior e mais clara conforme a altura (0,12 a 0,18) |
| herói mudando de lugar | aparelho travado da capa à tela 5 na caixa 648, 560, 947, 1161 (desvio medido de 2 px), mesma câmera (cy 880, 3750 px/m), halo igual (0,40; 0,45 nas telas com cartão claro) |
| tela 3 carregada | saiu a calculadora; lupa em pé, 25 % menor, encostada na pilha; do lado Legalizaí, a lupa não cabia sem cobrir a tela com o aparelho travado, então entrou o sinal de pessoa sem rosto numa moeda coral, que sai da tela sobre a área vazia, sem cobrir interface |
| tela 2 desequilibrada | despertador de 0,09 m, envelope recuado, cartão de pagar flutuando, sino a 70 % com 30 px de folga da margem |
| cinta da capa | removida |
| documentos em esqueleto | formulários com cabeçalho em bloco, campos em caixa com rótulo e valor em barra, linha de assinatura; sem número |
| leque do contrato | 4 páginas, recuos de 11 a 30 mm, giros de 5° a 7,5° alternando o lado; páginas de trás sem repetir o título |
| coral de destaque com 2,97:1 | destaques do apoio em coral-600 #DD4E27 (3,81:1); o #F2643C fica no "Legalizaí" de 100 px da capa e nos objetos |
| tag PLANO ME quebrando o ritmo | "PLANO ME" dentro da pílula LEGALIZAÍ da tela 3 ("LEGALIZAÍ · PLANO ME", um elemento só); título e palco não mexem |
| quebra do apoio da tela 4 | 571, 661 e 755 px |
| respiro lateral | objetos entre x 95 e 485 (Tradicional) e 595 e 985 (Legalizaí), conferido no QA |
| sombra dos cartões | fora do passe de contato, sombra-blob própria e sombra retangular atrás |
| dois contadores | contador do rodapé removido; fica só o símbolo |
| sombra do "Comenta aí" | removida (design guide: sem sombra em carrossel) |
| pasta do fecho | inclinada 17°, apoiada na quina do aparelho, menor, com as folhas mais altas e a da frente com o cabeçalho "Contrato social" (o mesmo documento que abre a lista da tela de Documentos); conjunto centrado em x 544 |
| luz coral do splash na prancheta | a RectAreaLight saiu; recorte da prancheta sem coral |
| serrilhado | render em 2x com MSAA e Lanczos; pilhas em 3 a 4 maços com o fio das folhas pintado na lateral |
| capa com "vs" (regras) | capa com o texto colado: "Contabilidade / tradicional e / Legalizaí:" e o apoio "o que muda pra você?"; o disco "vs" do cabeçalho saiu. A comparação continua na vitrine em dois painéis |

---

## 1. Conceito: "o mesmo cuidado, outro meio"

Cada tela é uma vitrine em dois painéis, com a mesma luz e a mesma câmera em todas.

- **Esquerda, Tradicional:** painel frio (L* 83) com objetos 3D de argila fria e fosca (papel em maços, pasta, carimbo, despertador, envelope, prancheta, caneta, lupa). Sempre arrumados, com dignidade de peça de arquivo. Nada feio, bagunçado ou em vermelho, nenhum X. É o passado bem cuidado, não o vilão (checklist do cronograma: "Nenhuma frase ou imagem opõe o Mauro ou o escritório ao app", "Nenhuma crítica a contador").
- **Direita, Legalizaí:** painel quente com halo coral; o iPhone 3D de verdade, parado no mesmo lugar da capa à tela 5, com a tela do app; e o que importa da tela sai dela em cartões flutuantes legíveis.
- **Rimas visuais:** carimbo e papelada → "Sua empresa nasceu."; despertador → sino coral e "Pagar agora"; lupa sobre a papelada → sinal de pessoa saindo da tela (gente de verdade continua) e "Apuração do Simples · Entregue" (a rotina com o sistema); envelope com documentos → serviço e taxa separados; contrato na prancheta → contrato inteiro saindo da tela, com a assinatura em branco.
- **Arco do pilar 3:** a capa apresenta os dois painéis; o fecho tem um painel só, quente, com a pasta do escritório apoiada no celular que mostra "Os papéis da sua empresa" (o "Contrato social" no papel e no app).

---

## 2. Sistema

### 2.1 Grade
| item | valor |
|---|---|
| quadro | 1080 x 1350 |
| margem lateral | 72 px (texto entre x 72 e 1008) |
| margem de cima | 88 px (capa 92) |
| vitrine (telas 1 a 5) | painel esquerdo 72, 458, 528, 1212; direito 552, 458, 1008, 1212; raio 24; vão de 24 px no meio |
| vitrine da capa | 72, 500, 528, 1196 e 552, 500, 1008, 1196 |
| painel do fecho | 72, 212, 1008, 872 (um só) |
| aparelho | caixa 648, 560, 947, 1161, igual da capa à tela 5 |
| objetos | Tradicional entre x 95 e 485; Legalizaí entre 595 e 985 |
| rodapé | símbolo de 36 px em (72, 1250); sem contador (o Instagram já mostra o "2/7") |

### 2.2 Tipografia (Sora variável, peso máximo 800)
| papel | estilo | cor |
|---|---|---|
| título da capa | 800, 100 px, entrelinha 98, -0,035em, 3 linhas | `#1B1E24`; "Legalizaí" em `#F2643C`, dois-pontos em tinta |
| apoio da capa | 600, 48 px | `#524E48` |
| título das telas 1 a 5 | 800, 76 px, entrelinha 78, -0,03em | `#1B1E24` |
| apoio das telas 1 a 5 | 500, 38 px, entrelinha 51, quebras fixas | `#524E48`; uma expressão de destaque em 700 `#DD4E27` |
| pergunta do fecho | 800, 88 px | `#1B1E24` |
| frase do fecho | 500, 38 px | `#524E48`; "mesmo cuidado" em 700 `#1B1E24` |
| pílulas da vitrine | 700, 26 px, caixa alta, .14em | TRADICIONAL `#4B5159` sobre `#EEF1F4` com borda `#B9C0C8`; LEGALIZAÍ `#B83D1C` sobre branco com borda `#F2643C` |

### 2.3 Cores
Marca: papel `#FAF8F5`, tinta `#1B1E24` / `#524E48` / `#736E67`, hairline `#E3DED7`, coral `#F2643C`, coral-600 `#DD4E27` (destaque do apoio e fill do CTA), coral-700 `#B83D1C`, coral-50 `#FEF3EE`, coral-100 `#FBDDD1`.
Vitrine: frio `#C9CFD6` com luz `#D3D8DE` e borda `#B9C0C8`; quente `#FEF3EE` com halo `#FBDDD1` e borda `#F1D5C8`.
Argila: papel `#F3F5F7`, frio-200 `#D5D9DE`, frio-400 `#AEB4BB`, frio-500 `#8D939B` (pasta, prancheta, corpo do despertador, base do carimbo), frio-700 `#5D636B` (caneta, borracha, ponteiros); lupa `#2E3138`. Coral nunca entra no lado Tradicional.

### 2.4 Componentes de interface (DOM)
- **Pílulas da vitrine:** no canto de cima à esquerda de cada painel (x do painel + 26, centro em y 500). Na tela 3: "LEGALIZAÍ · PLANO ME" numa pílula só (o ponto em coral, "PLANO ME" em tinta).
- **Rodapé das telas 1 a 5:** só o símbolo.
- **Capa:** pílula escura "Arrasta pro lado" com chevron sem haste, sem logo (o splash já mostra).
- **Fecho:** "Comenta aí" (fill `#DD4E27`, branco 800 34 px, ícone de balão, sem sombra) e logo horizontal de 188 px em (72, 1240).
- **Zero travessão:** nenhum traço colado antes de texto; réguas só dentro dos documentos, numa linha própria.

### 2.5 Palco 3D
- **Câmera:** PerspectiveCamera manual, elevação de 12°, distância de 0,93 m, alvo a 0,075 m do chão, `setViewOffset(1080, 2*cy, 0, 0, 1080, 1350)`; cy 880 e 3750 px/m da capa à tela 5; fecho em cy 555 e 3600 px/m.
- **Luz (`luz.ts`, calibrada em 4 variantes):** NeutralToneMapping com exposição 0,78; RoomEnvironment com intensidade 0,6; chave `#FFF6EE` 1,45 de (-0,45; 0,65; 0,55) com sombra VSM; recorte `#FFE9DC` 1,25 de (0,5; 0,25; -0,4); hemisférica 0,32. Resultado medido: argila frio-500 em L* 62 a 65, papel em L* 93 com o fio das folhas à vista, coral do sino entre (235, 87, 47) e (242, 101, 67). A luz de antes (1,4 / 1,1 / 1,0) estourava o papel em L* 98 e a argila frio-500 em L* 89. Fundo, telas do app e texto não têm tone mapping e não mudam.
- **Sombras:** contato (técnica do webgl_shadow_contact, plano de 0,6 x 0,4 m) e VSM da chave no chão a 0,10, as duas presas aos painéis por máscara em espaço de tela (nada vaza pro papel nem cruza o vão). Sombras-blob locais: carimbo na pilha (0,45), caneta na folha (0,78), e no chão de tudo o que flutua.
- **Fundo:** quadro em NDC sem tone mapping; painéis por SDF de retângulo arredondado com borda de 1,5 px; luz suave no painel frio; halo coral no quente; brilho do splash no chão só na capa; vinheta de 3 % e grão de 0,6 %.
- **Materiais:** argila MeshPhysical (rugosidade 0,82, sheen 0,25); laterais dos maços com textura de fio; coral com clearcoat (base `#E2532B`); faces dos recortes do app sem luz e sem tone mapping (cores exatas da tela); corpo das placas na cor do card.
- **Render:** `stills-carrossel.mjs` (bundle sem cache do webpack, `gl: angle`, chrome-headless-shell 1243, `binariesDirectory` absoluto, scale 2) e redução no `pos.py --reduz`; a PNG grande é apagada na hora. Bundle e perfis do Chrome apagados no fim.

---

## 3. Telas do app (montadas pelo `monta.py`)

Receitas em `telas/receitas/` (sem mudança nesta versão; md5 conferidos pelo `prepara.ps1`):
| saída | status da revisão | onde entra | md5 |
|---|---|---|---|
| `tela-splash.png` | liberado | capa, tela 4 e tela 5 | `28d46a9939f3c9d7837cadf36d225e05` |
| `tela-home-dia1.png` | aceito com risco (só ME) | tela 1 | `69978f352c73569e74eeb143e200a888` |
| `tela-inicio-pagar.png` | aceito com risco (só ME) | tela 2 | `eb8596dee4c5487d9b2c5111937d1a6a` |
| `tela-declaracoes.png` | aceito com risco (só ME) | tela 3 | `b377dcbeb8e5fddc355933d4a7aeb70f` |
| `tela-documentos.png` | aceito com risco (só ME) | fecho | `528d157da59fd55831f4ac92270b87c6` |

**Recortes flutuantes (mesmos pixels da tela montada, coordenadas em px da captura 1290 x 2796):**
- Tela 1: card escuro, x 72 a 906; faixas y 209 a 362 (título "Sua empresa nasceu.") e 497 a 844 (CNPJ de exemplo e "Cartão CNPJ"); o subtítulo fica de fora. Escala de 0,45 no quadro.
- Tela 2: card "Vence dia 20 · Seu imposto de junho · R$ 178,31 · Pagar agora", x 72 a 720, y 424 a 910 (a parte vazia da direita fica de fora). Escala de 0,57.
- Tela 3: do card do mês, o título "Apuração do Simples" (x 272 a 772, y 858 a 922) e o selo "Entregue" (x 104 a 345, y 1092 a 1182), alinhados na margem do card; ícone, descrição e "Comprovante" ficam de fora pra o texto caber legível (escala de 0,64).
- As bordas que o card tem são refeitas no contorno do recorte; fora dele, transparente.

Não entram: contrato e termo (404); plano, pagamento e migrar com preço; assinatura; telas com o Léo.

---

## 4. As 7 telas

### Quadro 0 · Capa · `01-capa.png`
- Título `Contabilidade | tradicional e | Legalizaí:` e apoio `o que muda pra você?` (texto colado do Pedro e do cronograma).
- Esquerda: pilha em 4 maços com formulário no topo, carimbo em pé com sombra-blob, despertador de 0,062 m na frente. Direita: aparelho com o splash e o brilho coral no chão. Rodapé: "Arrasta pro lado".

### Quadro 1 · Abrir a empresa · `02-abrir-a-empresa.png`
- Apoio com destaque "celular ou computador". Regras: F036 (vale pra ME); o gov.br só como a conta do titular (P38); "Ativa desde hoje" é estado de exemplo (P01).
- Esquerda: pasta frio-500 em pé atrás da pilha, carimbo na pilha. Direita: aparelho com a home-dia1 e o cartão "Sua empresa nasceu." flutuando.

### Quadro 2 · A guia do mês · `03-a-guia-do-mes.png`
- Última linha "Você só paga." em 700, com "só paga" em coral-600. Regras: F040; "Vence dia 20" é F077; R$ 178,31 é guia de ME fictícia, nítida por decisão do Pedro (01/10), não é DAS de MEI (F063).
- Esquerda: despertador de 0,09 m (10:10) com o envelope de documento recuado atrás. Direita: aparelho com o Início, o cartão de pagar flutuando (a ação "só paga" na tela) e o sino coral a 70 % no canto.

### Quadro 3 · Quando o caso foge do padrão · `04-caso-fora-do-padrao.png`
- Pílula "LEGALIZAÍ · PLANO ME". Regras: F042, F013, F094; a lupa não fica sobre a tela do app (F042, P21); nenhum rosto de contador (P35: a moeda leva um sinal de pessoa sem rosto, ilustração).
- Esquerda: pilha com formulário e a lupa em pé encostada. Direita: aparelho com Declarações, a moeda com o sinal de pessoa sobre a área vazia da tela e o cartão "Apuração do Simples · Entregue".

### Quadro 4 · O que você paga · `05-o-que-voce-paga.png`
- Apoio: `O que é serviço fica separado | do que é taxa do governo. Você vê | pra onde vai cada parte antes de pagar.` Regra: F020 (os cartões ilustram só serviço e taxa separados, sem valor, sem botão e sem descrever a tela de pagamento).
- Esquerda: envelope aberto de três quartos com duas folhas "Documento" (sem total). Direita: aparelho com o splash e os cartões "Taxa do governo" (mais alto, atrás) e "Serviço" (mais baixo, na frente), separados.

### Quadro 5 · Antes de assinar · `06-antes-de-assinar.png`
- Destaque "contrato inteiro". Regras: F045 (vale pra MEI e ME); o contrato é documento desenhado, não tela do app.
- Esquerda: prancheta frio-500 com contrato genérico (Contratante, Data, Contratada, Objeto, Assinatura) e caneta com sombra. Direita: aparelho com o splash e 4 páginas em leque; a da frente com "Contrato / de prestação de serviços", "Contratada Legalizaí", "CNPJ" e "Registro no CRC" (valores em barra de esqueleto, P36) e a assinatura em branco.

### Quadro 6 · Fecho · `07-fecho.png`
- Frase no topo, pergunta "E você, prefere | resolver como?", "Comenta aí" e o logo. Regra: F008 (o app que tá chegando; nada de baixar).
- Painel quente único: aparelho com Documentos e a pasta apoiada na quina, com a folha "Contrato social" à vista.

---

## 5. Objetos procedurais (three.js, argila, sem licença de terceiro)
Pilha em maços (RoundedBox com fio na lateral), pasta, carimbo, caneta, despertador, envelope de documento, envelope aberto, prancheta, lupa, sino, moeda, placas de recorte, cartões e páginas do contrato: todos em `objetos/`. Só o iPhone (polyman Studio, CC BY 4.0) pede crédito.

---

## 6. Técnica
- Entry próprio `remotion/src/carrossel-2026-10-05/index.ts` (não toca no Root.tsx nem no src/index.ts), composição "Carrossel" 1080 x 1350, 7 quadros; a luz vem nas props (`luz.ts`).
- Public próprio `remotion/public-carrossel/`, só hardlinks (`prepara.ps1`).
- Render: `node stills-carrossel.mjs [quadros]` de dentro da pasta remotion; depois `python -B pos.py` (venv do corte-viral) pro QA, a folha, a prévia a 390 pt e os recortes.
- Disco: o script aborta abaixo de 400 MB; a rodada usa uns 60 MB no pico e devolve tudo menos as PNG (uns 6 MB).

---

## 7. Reuso no vídeo (próxima etapa do pedido)
Cada tela está numa função própria (`cenas/montagem.ts`) e os cartões flutuantes já são objetos separados: no vídeo eles podem sair da tela do aparelho em movimento (o card de pagar subindo, os cartões de serviço e taxa se separando, as páginas do contrato abrindo em leque, a pasta vindo encostar no celular).

---

## 8. Riscos e pendências
1. **Legenda (etapa da legenda, no cronograma):** incluir antes das hashtags "Modelos 3D: celular por polyman Studio (Sketchfab, CC BY 4.0), modificado"; trocar por "E quando o caso foge do padrão, no plano ME, quem olha é um contador com registro no CRC."; deixar uma pergunta só, a do fecho ("E você, prefere resolver como?"); não chamar as telas de "tela real do app" (são do protótipo Next.js @ab68dbc).
2. **Fontes da peça no cronograma:** acrescentar "F077 · 07 §2 e §5" ("Vence dia 20" no cartão da tela 2), "F094 · 07 §2 e §3" e "F148 · POS L55".
3. **Capa:** segue o texto colado ("e"). Se o Pedro quiser o "vs" escrito, é trocar uma palavra no `dados.ts`.
4. **CNPJ e CRC no contrato:** em esqueleto (P36). Número real só com o OK do Pedro e entrada no FATOS.
5. **Receitas das telas:** continuam "rascunho, aguardando aprovação do Pedro"; o recorte da tela 3 deixa de fora ícone e descrição do card e alinha o título com o selo.
6. **Telas do protótipo:** não são do app Flutter.
7. **Moeda com sinal de pessoa (tela 3):** é a saída que a revisão previu quando a lupa não cabe do lado Legalizaí com o aparelho travado. Vale o Pedro bater o olho.

## 9. Fontes do conteúdo
- F036 · `02` §1 (tela 1).
- F040 · `07` §3 (tela 2); F077 · `07` §2 e §5 ("Vence dia 20").
- F042 · `07` §3, F013 · `01` §2 e F094 · `07` §2 e §3 (tela 3).
- F020 · `02` §4 (tela 4).
- F045 · `04` (tela 5).
- F008 · `01` §5 (fecho).
- F148 · POS L55 (pilar 3; sem citar na arte).

Revisão das telas: `_kit-motion/catalogos/telas/revisao-2026-10-02.json`.
