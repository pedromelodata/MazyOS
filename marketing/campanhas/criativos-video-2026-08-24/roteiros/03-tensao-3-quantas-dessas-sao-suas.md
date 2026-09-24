<!-- gerado pelo workflow legalizai-6-criativos-v2 em 24/08/2026 -->
<!-- conceito tensao-3 | veredito do guardian: aprovado com correcao -->

> **Correções aplicadas pelo guardian:**
> - CORAL ESTOURADO (grave). A peca tinha QUATRO acendimentos de coral no palco (chip `Ver a guia` do card 12, ancora `UMA.`, pill da tela do app, `R$79`) e o teto de uma peca de 20 a 30s e TRES. Conserto: a ancora `UMA.` vira ink `#1B1E24`. Isso nao enfraquece nada, fortalece: o veredito dito em tinta preta e mais sobrio, e libera a legenda daquele beat pra acender `SUA` em coral-600, que e a palavra que carrega o sentido. Sobram exatamente 3 acendimentos, e dois deles sao o MESMO objeto (o chip `Ver a guia` na coluna e depois no print real), o que vira argumento em vez de dispersao.
> - COLISAO DE CORAL (grave). A palavra forte `VENCE` acendia em coral na legenda entre 8,0 e 9,13s, mas o card 12 com o chip coral ja entra no palco em f244 (8,13s). Dois focos corais no mesmo frame, proibido. Conserto: a palavra forte migra pro bloco anterior e vira `OLHO` (`eu fico de OLHO`), que sai de quadro em f232, antes do chip aparecer. Bonus: `olho` e a palavra mais suricato do roteiro inteiro.
> - AA QUEBRADA NO CHIP DO CARD 12 (grave). `Ver a guia` em Sora 700 40px branco sobre coral-600 viola a regra 1.6 (branco sobre coral-600 so a partir de 56px em 1080x1920). Conserto: fill vira coral-700 `#B83D1C`, rotulo continua branco 40px. Regra atendida sem mexer no gesto.
> - ANCORA ESTOURA A CAIXA (grave). `UMA.` em Sora 700 a 400px mede cerca de 1004px (2,51em) e a area util e 936px. Alem disso 400px esta na banda de NUMERO (300 a 420), e palavra-veredito e 200 a 260. Conserto: 260px, largura 673px, baseline y=881. Efeito colateral bom: o fallback do gate factual (`DUAS.`, 3,03em = 788px) tambem cabe em 260px, entao trocar a ancora virou troca de string pura, sem tocar em tamanho nem em baseline.
> - TELA DO APP ILEGIVEL (grave, medido). O roteiro dizia que a 58% o corpo da UI cai em 30,7px. Medi o PNG real (`marketing/telas-app/obrigacoes.png`, 1290x2796): o corpo do app tem 32px no arquivo, nao 48 (o print foi renderizado com fator 2,0, nao 3,0). A 58% o corpo cai em 18,6px, muito abaixo do piso absoluto de 30px. Conserto: em vez da tela inteira, recorte de UM componente (o card `DAS de junho`, x 354 a 1000, y 1041 a 1379 do PNG) ampliado a 144,9% pra preencher os 936px uteis. Corpo da UI em quadro: 46,4px, acima do alvo de 44px da regra 2.8. Bonus: o corte em x=1000 deixa o disco coral do icone (x 1026) fora de quadro, o que resolve metade do problema de coral acima.
> - CAPA APONTANDO PRO FRAME ERRADO. A ficha dizia capa = frame 285 e chamava esse frame de `a ancora UMA. no palco`, mas no roteiro original a ancora so entrava em f292. Frame 285 e o freeze do card 12. Conserto: capa = frame 330, com a ancora ja assentada.
> - LOCUCAO QUE NAO CABE NA JANELA. Contei silabas por respiracao: bloco 4 rodava a 7,4 silabas/s e bloco 6 a 7,3 (fala normal em portugues e 5,5 a 6,5; leitura sobria e 4,5 a 5,5). O TTS ia estourar tres janelas. Conserto: re-corte dos beats (payoff 2,867 para 2,400s, prova 1,967 para 2,200s, preco 4,467 para 4,800s, total intocado em 660 frames) e novas janelas. Todas as oito respiracoes agora ficam entre 3,9 e 6,6 silabas/s. O silencio da coluna, que e o material da peca, foi preservado integralmente: 6,13s de fala em 7,97s de coluna, igual ao original.
> - MECANICA DE RESERVA INCOMPLETA NO AUDIO. A regra 1.27 exige que motes B e C digam na tela E no audio as tres coisas: o app nao abriu, ninguem paga hoje, o valor fica guardado. O audio original tinha as duas primeiras e faltava a terceira (`eu guardo o preco` so existia como texto no end card). Conserto: locucao 8 nova e OBRIGATORIA no end card, `Eu guardo o preco.`, em 19,367 a 20,433s, separada e independente do slot opcional do `Vai, legaliza ai.`. Custo zero de palavras: saiu `Quem aperta e voce.` (4 palavras redundantes) e entrou essa (4 palavras). Total continua 46.
> - EASE-IN PROIBIDO NA SAIDA DO CARD. O card 12 saia pra esquerda com `easeSaida()`, que acelera na saida. A regra 5.2 so permite ease-in num lugar: objeto caindo por gravidade na virada. Conserto: corte seco de f359 pra f360... corrigido pra corte seco no fim do snap (f287 para f288). Alem de resolver a regra, e mais barato, e mais coerente com o `corte que antecipa` que a propria peca declara como comportamento de vigia, e elimina o item 15 da lista de producao.
> - ANEL DE 1 FRAME E FLASH. Um anel que nasce e morre em 1 frame nao e uma duracao do sistema (150/250/400) e le como strobe, proibido pela regra 5.5. Conserto: 5 frames (150ms, motion-micro), escala 100 a 118, opacidade 55 a 0, ease-out, na cor do proprio chip.
> - DESACELERACAO FORA DA REGUA. A trava da coluna era de 6 frames (200ms), duracao que nao existe no sistema. Conserto: 5 frames (150ms, motion-micro), f265 a f270, chegada com velocidade 0 e influencia 66%.
> - ARITMETICA DA COLUNA NAO FECHA. O roteiro dizia velocidade 12,4 px/frame, pitch de 270px e `um carimbo a cada 20 frames exatos`. 270/12,4 = 21,8 frames, nao 20. Conserto: velocidade 13,3 px/frame (399 px/s), carimbo a cada 20,3 frames (0,68s, bem abaixo do teto de 1,2s), e a posicao inicial do null passa a ser DERIVADA por script a partir de tres ancoras, com assert que falha alto se precisar de mais que 40px de folga.
> - CARD 12 NAO COMPORTA O CHIP. Os 12 cards eram todos 230px de altura, mas o card 12 tem um elemento a mais (o chip de acao). No app real esse card tem 339px contra 219px dos outros. Conserto: card 12 com 350px de altura, e o gap entre o centro do card 11 e o do card 12 passa a ser 330px (nao 270). O card mais alto tambem le como `esse aqui tem mais coisa dentro`, que e exatamente o ponto.
> - O EVENTO DO f11 ERA IMPOSSIVEL. `o card sobe 24px e a borda superior de um segundo card aparece por baixo dele`: com pitch de 270px e a mascara em y=1140, o card 2 estava 150px abaixo da borda. 24px nao revelavam nada. Conserto: o card 1 nasce com topo em y=1000 (90px cortados pela mascara, o corte fica legivel), o primeiro passo em f11 e de 60px em 150ms, e a borda do card 2 cruza y=1140 em f21. O micro-evento continua em f11 (teto e f12) e a leitura `virou coluna` chega em f21.
> - CARD FORA DA ESPINHA. Os cards eram 900px de largura (x 90 a 990) enquanto o chip contador terminava em x=1008 e todo o texto comeca em x=72. Duas espinhas no mesmo quadro. Conserto: card 936px, x 72 a 1008, uma espinha so.
> - BLOCO DE LEGENDA COM 6 PALAVRAS. `o dinheiro sai / da sua conta.` e `eu nao pago / no seu lugar.` tinham 6 palavras cada e o teto e 5. Conserto: quatro blocos de 3 palavras, uma linha cada, baseline y=1320.
> - `nada a fazer` TANGENCIA CLAIM PROIBIDO. O subtitulo do card 8 (`A gente entrega, nada a fazer`) e a forma exata que a regra 1.20 proibe (`voce nao faz nada`). Conserto: o card 8 repete o subtitulo do card 1 sem adorno. A repeticao literal e melhor: e uma obrigacao mensal voltando, e isso e o argumento.
> - NOMENCLATURA INCONSISTENTE DA GUIA. O card 9 dizia `Guia de junho` e o card 12 dizia `DAS de junho`, dois nomes pro mesmo objeto, e `Em preparacao pela gente` (card 11) e portugues torto. Conserto: cards 9 e 12 viram `Guia do Simples` (a gente apura e calcula em 15/07, voce paga em 20/07: mesmo objeto, dois momentos, que e a tese da peca em duas linhas), e o card 11 vira `A gente esta preparando`.
> - ORDEM CRONOLOGICA QUEBRADA. Cards 11 e 12 estavam ambos em 20/07 e a coluna e cronologica. Conserto: card 10 em 17/07, card 11 em 18/07, card 12 em 20/07.
> - COBERTURA DO VALOR MAL ESPECIFICADA. Um card `#1F2228` com raio 24 colado DENTRO de um fill chapado do mesmo tom cria quatro cantos arredondados visiveis contra o plano. Conserto: retangulo chapado, sem raio e sem borda, cobrindo a faixa inteira da linha de valor (x 354 a 1000, y 1152 a 1218 do PNG), e `a pagar` retipografado em Sora 400 46px `#BDB8B0` na posicao original.
> - GUIA DE SAFE AREA ERRADA. `GUIA-safe` 864x1440 centrado em y=840 nao e a safe area da regua nenhuma. Conserto: 936x1320, x 72 a 1008, y 200 a 1520, centro y=860.
> - BLOCO DE CONDICAO INVADINDO A UI DO INSTAGRAM. Promovido a 40px no end card, o bloco chegava a x=987 nas baselines 1080/1134/1188, dentro do corredor de icones (x 880 a 1080, y 1040 a 1780). Conserto: 36px em 4 linhas (baselines 1020/1068/1116/1164), nenhuma linha passando de x=858. Continua sendo promocao (30 para 36), entao a ideia de `aumentar a letra miuda` sobrevive.
> - PRECOS ENCOSTANDO NO CORREDOR. Com `R$139` em baseline 1060, o rodape dos algarismos entrava no corredor de icones. Conserto: bloco inteiro subiu (rotulo 460, R$79 720, super 780, R$139 1030, super 1090). Os algarismos terminam em y=1030, dez pixels acima do corredor, e o centro optico do bloco cai em 775.
> - LISTA DE PRODUCAO SUBESTIMAVA O RIG DE LETTERING. O item 12 dizia `3 linhas de mudanca`. Abri o `32-lettering.jsx`: alem do `W=3840,H=2160` da linha 17, os valores de animacao sao todos de 4K e todos fora da regua 9:16 (corrida 6 frames = 200ms com y+56 e rotacao alternada de 4 graus; forte 12 frames = 400ms com y+80; GAP=36). 200ms nao e uma duracao do sistema. Conserto: item 12 reescrito com a lista real (durAnim 5f/8f, dy 28/40, escala 92 e 88, rotacao desligada porque o tom e sobrio, GAP 11).
> - CONTAGEM DE SFX ERRADA. Dizia `14 SFX sintetizados` e listava 6. Conserto: 7 nomeados, um por evento real.
> - LOCUCAO 4 DUPLICAVA A LOCUCAO 5. `O dinheiro sai da sua conta. Quem aperta e voce.` seguido de `Eu nao pago no seu lugar.` diz a mesma coisa tres vezes em 16 palavras. Conserto: `Quem aperta e voce.` sai do audio e da legenda. A ideia sobrevive intacta no micro-label `ESSA E SUA . AS OUTRAS ONZE SAO MINHAS` e na locucao 5, que e a admissao e o gesto mais Leo da peca.
> - LINE-HEIGHT DO HOOK CONTRADIZIA AS BASELINES. O texto dizia 0,95em e as baselines (540/690/840) davam 1,0em. Conserto: 540/683/826, passo de 143px.
> - COPY DO META. `O boleto quem paga e voce` virou `A guia quem paga e voce` (o objeto da peca e uma guia, nao um boleto, e a coluna inteira chama de guia).
> - VARIACAO DE 15s RE-CORTADA. Os frames e a velocidade da versao curta herdavam a aritmetica errada. Conserto: novo corte de 450 frames com as mesmas correcoes, velocidade 14,2 px/frame e micro-label do payoff em `AS OUTRAS SETE SAO MINHAS`.
## CRIATIVO 3 :: Quantas Dessas São Suas

| Campo | Valor |
|---|---|
| **Mote** | C · ME / Simples Nacional |
| **Tom** | Sóbrio. Zero piada. Aliado sério. |
| **Persona alvo** | B (parceria), com alcance na A |
| **Duração** | 22,000s · 660 frames |
| **Formato** | 9:16 · 1080x1920 · 30 fps · master H.264, sem 4K |
| **Pilar de funil** | Consideração. Entra quente, prova o trabalho, entrega preço. |
| **CTA** | `Cadastre-se` |
| **Botão do Meta** | `Cadastre-se` |
| **Capa da peça** | frame 330 (a âncora `UMA.` já assentada no palco), nunca o end card |
| **Origem dos planos** | 100% [AE] + 1 plano [TELA APP] + 1 [SVG]. Zero Higgsfield, zero créditos. |

---

**A ideia em uma frase.**

Doze obrigações reais sobem pela tela com um contador travado em zero, e quando ele finalmente mexe, mexe uma vez só, no único item onde o dinheiro sai da conta do cliente.

---

**Por que para o dedo.**

O hook não é uma frase, é uma **pergunta com um contador ao lado que já está respondendo**. O frame 1 é estático e completo: a pergunta em três linhas de 150px, um card escuro cortado pela borda de baixo (que diz sozinho "tem mais embaixo") e o chip `SUAS · 0` no canto. O buraco é óbvio e é numérico: se o contador está em zero e a coluna já começou, quantas vão ser? O espectador não precisa de som nem de contexto para saber que existe uma resposta chegando, e o formato dela (um número) já está declarado.

A retenção é contagem visível com resposta retida, e ela é honesta: o contador fica em zero por **oito segundos inteiros** enquanto onze cards passam carimbando estado. Ninguém sai antes do número mexer, porque sair é perder a única informação que a peça prometeu. O risco desse dispositivo é a coluna virar papel de parede, e é por isso que ela tem um carimbo a cada 20 frames, push-in contínuo de 4% e uma legenda em primeira pessoa que muda a cada dois cards. Quando o número mexe, ele mexe com trava seca, e a peça compra os 12 segundos seguintes com a escada 79 e 139.

---

**Onde mora a alma da marca.**

A primeira pessoa carrega a coluna inteira e fica queimada na tela, não só falada: `eu entrego a declaração.`, `eu preparo a de julho.`, `eu fico de olho no que vence.`. A câmera é o vigia literalmente: a rolagem contínua é a varredura de horizonte, o travamento seco em 5 frames com anel coral e freeze de 10 frames é o bicho subindo nas patas traseiras, e o corte antecipa a fala (o snap cai no frame 270 e a última sílaba de "vence" só aterrissa no frame 274, quatro frames depois, em cima do quadro já congelado; o mesmo gesto se repete no corte para a prova em f360, com a fala entrando em f364). O calendário é o objeto físico da peça do começo ao fim. **Não há alvo de humor porque não há humor**: o argumento é operacional e a piada seria ruído. O que substitui a graça é a admissão, que é o gesto mais Léo que existe sem o Léo: `eu não pago no seu lugar.` A marca diz onde o trabalho dela acaba antes de alguém perguntar. E fecha assumindo a única coisa que ela pode garantir hoje: `eu guardo o preço.`

O suricato não aparece em nenhum frame, em nenhuma forma. A peça não fica melhor com ele, e não existiria diferente sem ele: o que faz o trabalho aqui é o corte, a trava e a voz.

---

**Roteiro quadro a quadro.**

Grade: papel `#FAF8F5` do frame 0 ao 659. Cards `#1F2228` com hairline `#2E313A` 3px, raio 48. Palco mascarado em `y 360 a 1140`, corte duro embaixo, fade de 40px em cima. Margem lateral 72px, área útil `x 72 a 1008`. Grain 1,5% em adjustment sobre tudo. Projeto em 16bpc. Nenhum hex desta tabela é digitado à mão numa layer: tudo vem do `tokens.json` via os Color Controls da comp `_CONTROLE`.

| Tempo | Imagem (o que se vê) | Origem | Áudio e voz | Texto de destaque na tela | Som e trilha |
|---|---|---|---|---|---|
| **0,000 a 0,967**<br>f0 a f29<br>*HOOK* | Frame 1 **estático e 100% opaco**, sem fade de entrada. Papel `#FAF8F5`. Pergunta em 3 linhas alinhadas à esquerda em `x=72`, baselines 540 / 683 / 826 (line-height 0,95em = 143px). Abaixo, um card escuro de 936x230 (raio 48, hairline `#2E313A` 3px) com topo em `y=1000`, portanto **cortado em 90px pela máscara do palco em y=1140**. Dentro do card: data à esquerda em `x=32` do card, título em Sora 600 44px `#F4F1EC`, subtítulo Sora 400 32px `#BDB8B0`. Canto sup. esq.: micro-label em 2 linhas. Canto sup. dir.: chip contador pill (raio 999, `y 262 a 330`, fill `#F1EEE9`, hairline `#E3DED7` 3px, borda direita em `x=1008`). **Zero coral no frame 1.** No **f11** a coluna dá o primeiro passo de 60px em 150ms ease-out; em **f21** a borda superior do card 2 cruza `y=1140` e o quadro vira coluna. | [AE] | silêncio | Sora 700 150px `#1B1E24`, tracking -2%:<br>`QUANTAS`<br>`DESSAS`<br>`SÃO SUAS?`<br><br>Micro-label Sora 500 32px CAPS tracking +8% `#736E67`, x=72, baselines 272 / 320:<br>`OBRIGAÇÕES COM PRAZO`<br>`JUNHO E JULHO DE 2026`<br><br>Chip Sora 500 32px CAPS +8% `#1B1E24`, baseline 307:<br>`SUAS · 0`<br><br>Card 1: `15/06` · `Declaração mensal` · `A gente entrega` + check `#17A06A` | **f11:** primeiro som da peça é físico, não palavra. `sfx_card_tick_a.wav`, tick de UI seco, 60ms, corpo em 1,2 kHz. Trilha: `A Step Ahead` stem **bass** entra em f0 a -20 dBFS, sem drums ainda. |
| **1,000 a 8,967**<br>f30 a f269<br>*A COLUNA* | A pergunta sai em fade 250ms (f30 a f37), **sem movimento**. A coluna corre em velocidade constante de **13,3 px/frame (399 px/s)** de f16 a f265, pitch de 270px entre os cards 1 a 11 (230 de altura + 40 de gap). Onze cards atravessam o palco de baixo para cima, entrando pela borda dura em `y=1140` e desaparecendo no fade de topo em `y=360 a 400`. **Cada card carimba o próprio estado em 150ms** quando o centro dele cruza `y=750`: ou um disco verde `#17A06A` de 76px com check branco, ou um spinner de arco aberto 3px `#8E8981` girando 1 volta em 24 frames (800ms), em loop. **Um carimbo a cada 20,3 frames (0,68s)**, sempre abaixo do teto de 1,2s sem micro-evento. **Push-in contínuo:** escala da comp da coluna 100 a 104 de f30 a f269, uma direção só. Micro-label e chip contador ficam fixos, sem se mexer, e o chip **não muda de número**. O card 12 tem **350px de altura** (ele carrega um elemento a mais), então o gap entre o centro do card 11 e o do card 12 é de 330px, e ele começa a aparecer na borda do palco em f228. | [AE] | **1,600 a 3,300:** "Eu entrego a declaração."<br><br>**4,000 a 5,900:** "Eu preparo a de julho."<br><br>**6,600 a 9,133:** "Eu fico de olho no que vence."<br>*(uma respiração só, com suspensão antes de "vence"; o onset de "vence" cai em 8,867 para a última sílaba aterrissar em f274)* | Os 12 cards, em ordem cronológica (título Sora 600 44px `#F4F1EC` · subtítulo Sora 400 32px `#BDB8B0` · data Sora 500 32px `#8E8981`):<br>`15/06 · Declaração mensal · A gente entrega` ✔<br>`20/06 · Pró-labore de junho · A gente calcula` ✔<br>`25/06 · Conferência das notas · A gente revisa` ✔<br>`30/06 · Escrituração de junho · A gente faz` ✔<br>`30/06 · Fechamento do mês · A gente fecha` ✔<br>`05/07 · ISS de junho · A gente apura` ✔<br>`10/07 · Retenções do mês · A gente confere` ✔<br>`15/07 · Declaração mensal · A gente entrega` ✔<br>`15/07 · Guia do Simples · A gente apura e calcula` ✔<br>`17/07 · Pró-labore de julho · A gente calcula` ✔<br>`18/07 · Declaração do mês · A gente está preparando` ⟳<br><br>**Super de condição entra em f30** e fica até f569. | 11 ticks de UI, um por carimbo, alternando 2 timbres (`sfx_card_tick_a`, `sfx_card_tick_b`) para não virar metrônomo. Trilha: stem **drums** entra em f30, **bass** sobe para -16 dBFS. Nenhum stem de melodia ainda: a peça está em tensão, não em resolução. |
| **9,000 a 9,600**<br>f270 a f287<br>*O SNAP* | **f265 a f270:** desaceleração de 399 px/s a zero em **5 frames (150ms, motion-micro)**, ease-out puro, chegada com velocidade 0 e influência 66%. A coluna **trava seca** com o 12º card (350px de altura) centrado no palco em `y=750`. Esse card é o único que tem um chip de ação: pill **coral-700 `#B83D1C`** com `Ver a guia` em Sora 700 40px branco (coral-700 e não 600 porque o rótulo branco fica abaixo de 56px). **f270 a f275:** um anel de 3px na cor do próprio chip nasce da borda dele e expande de 100 para 118% com opacidade 55 a 0, em **150ms ease-out**. Nasce do chip e morre no chip, então é o mesmo acendimento, não um segundo. **f270 a f280:** freeze absoluto, zero movimento, push-in parado. **f270:** o chip contador troca `SUAS · 0` por `SUAS · 1` em **hard swap de 1 frame**, com escala 88 a 100 em 5 frames. **Sem Directional Blur, sem motion blur, sem slot machine, sem flash.** | [AE] | a última sílaba de "vence" aterrissa em **f274**, quatro frames depois do travamento, por cima do quadro já congelado | Card 12: `20/07` · `Guia do Simples` · `A pagar` + chip coral-700 `Ver a guia`<br><br>Chip contador vira `SUAS · 1` | **f270:** `sfx_snap_sub.wav`, impacto grave com sub em 55 Hz, 400ms, cauda curta. Trilha **cai para bass sozinho** em 2 frames e fica assim 10 frames. Drums voltam em f281. |
| **9,600 a 12,000**<br>f288 a f359<br>*O PAYOFF* | **Corte seco em f288.** O card 12, a coluna e a máscara do palco somem no corte, sem transição. **f292 a f304:** a âncora entra sozinha em 400ms: opacidade 0 a 100, y +48 a 0, escala 92 a 100, eixo `wght` da Sora 300 a 700, tracking +2% a 0. Centro óptico do bloco em `y=790`. **f304 a f309:** micro-label colado abaixo, 150ms. Push-in de 3% de f296 a f359. Hold da âncora assentada: f304 a f359, **1,83s** (mínimo 1,2s). Fundo papel limpo, nada mais em quadro além do chip `SUAS · 1` que permanece. **A âncora é ink, não coral:** o palco fica sem acendimento neste beat, e é por isso que a legenda pode acender `SUA`. | [AE] | **9,733 a 11,733:** "O dinheiro sai da sua conta." | Âncora Sora 700 **260px** `#1B1E24` ink, tracking -2%, x=72, baseline y=881 (largura 673px)<br><br>Micro-label Sora 500 32px CAPS +8% `#736E67`, x=72, baseline y=948:<br>`ESSA É SUA · AS OUTRAS ONZE SÃO MINHAS` | `sfx_anchor_settle.wav`: pop grave curto de assentamento, 120ms, sem reverb. Trilha: stem **instruments** entra em f296. |
| **12,000 a 14,200**<br>f360 a f425<br>*A PROVA* | Corte seco em f360, quatro frames antes da fala (mesmo gesto de vigia do snap). Entra a tela real do app como **recorte de componente único**, não como tela inteira: recorte do PNG em `x 354 a 1000, y 1041 a 1379` (o card `DAS de junho` sem a coluna do ícone), **escala 144,9%**, resultando em 936x490 em quadro, posicionado `x 72 a 1008`, `y 502 a 992`, centro óptico em `y=747`. A 144,9% o corpo da UI do app (32px no PNG) cai em **46,4px em quadro**, acima do alvo de 44px da régua. Máscara de raio 48 no bloco (os cantos esquerdos vêm do próprio card; os direitos são cortados em fill chapado). Hairline `#2E313A` 3px por fora. Entrada em 400ms (escala 96 a 100, opacidade 0 a 100). Push-in de 3% durante o beat. **Cobertura obrigatória:** um retângulo chapado `#1F2228`, **sem raio e sem borda**, cobre a faixa inteira da linha de valor (`x 354 a 1000, y 1152 a 1218` do PNG, ou seja `x 72 a 1008, y 663 a 758` em quadro), e a palavra `a pagar` é retipografada por cima em Sora 400 **46px** `#BDB8B0`, alinhada ao padding do card em `x=146`, baseline `y=719`. Nenhum valor monetário fora dos quatro da campanha entra em quadro. **Único coral do frame:** a pill `Ver a guia` do próprio app, que é literalmente o mesmo objeto do acendimento do snap, reencontrado no produto real. | **[TELA APP]**<br>`marketing/telas-app/obrigacoes.png`<br>(1290x2796)<br>+ [AE] para a cobertura | **12,133 a 13,867:** "Eu não pago no seu lugar." | Micro-label Sora 500 32px CAPS +8% `#736E67`, x=72, baseline y=320:<br>`TELA DO APP · OBRIGAÇÕES DE JULHO`<br><br>Chip contador segue em `SUAS · 1` até f425 | `sfx_screen_in.wav`: whoosh curto e seco, 180ms, sem cauda metálica. Trilha mantém bass + drums + instruments. |
| **14,200 a 19,000**<br>f426 a f569<br>*O PREÇO* | Corte seco para papel limpo. Micro-label e chip contador saem. **Os dois preços entram JUNTOS em f426**, mesma duração de 400ms, mesmo tamanho, stagger zero. Nada de revelar o segundo depois. Bloco todo alinhado à esquerda em `x=72`, mesma espinha do hook. Push-in de 3% ao longo do beat. Hold total de 4,800s (mínimo exigido: 1,5s). O `R$139` a 300px ocupa 924px e termina em `x=996`, dentro dos 1008, e os algarismos terminam em `y=1030`, dez pixels acima do corredor de ícones do Instagram. **f561 a f569:** 300ms de silêncio total, imagem parada. | [AE] | **14,600 a 16,200:** "Plano ME, Simples Nacional."<br><br>**16,567 a 18,700:** "O app não abriu. Ninguém paga hoje."<br><br>**18,700 a 19,000:** silêncio | Rótulo Sora 500 **44px** CAPS +8% `#1B1E24`, x=72, baseline y=460:<br>`ME · SIMPLES NACIONAL`<br><br>Sora 700 **300px** `#DD4E27` coral-600, x=72, baseline y=720:<br>`R$79`<br>Sora 500 32px CAPS +8% `#736E67`, baseline y=780:<br>`NOS 3 PRIMEIROS MESES`<br><br>Sora 700 **300px** `#1B1E24` ink, x=72, baseline y=1030:<br>`R$139`<br>Sora 500 32px CAPS +8% `#736E67`, baseline y=1090:<br>`DEPOIS` | `sfx_price_set.wav`: dois toques de assentamento simultâneos, 90ms, uma oitava de diferença. Trilha sobe a camada cheia em f426 e **corta seco em f561**, deixando 300ms de silêncio antes do end card. |
| **19,000 a 22,000**<br>f570 a f659<br>*END CARD* | Papel `#FAF8F5` em POP de 4 frames (corte, nunca dissolve). Lockup entra em 400ms (f570 a f582), escala 96 a 100, y +24 a 0, **sem zoom**: entra e assenta. Botão entra em 400ms (f578 a f590). **f594 a f599:** o `AI` do wordmark acende em coral-500 `#F2643C` em 150ms, com o `--gradient-brand-glow` subindo junto. É o único glow autorizado da peça. Botão coral-600 em `x 72 a 612`, `y 830 a 950`, raio 36. Super de condição **promovido de 30px para 36px** e reflowado em 4 linhas dentro do palco, substituindo a versão de rodapé: a marca aumenta a letra miúda em vez de diminuir. As 4 linhas entram escalonadas em f600 / f612 / f624, 250ms cada, o que mantém micro-evento até f632 mesmo na variante sem a fala de fecho. **Slot de 1,067s (f620 a f652)** reservado para a fala opcional. Sem a fala, o slot vira hold do logo, sem retiming e sem reescrita. Hold do botão: f590 a f659, **2,3s** (mínimo 1,8s). | [AE] + **[SVG]**<br>`identidade/logos/legalizai-logo-horizontal.svg` | **19,367 a 20,433 (obrigatória):** "Eu guardo o preço."<br><br>**20,667 a 21,733 (slot opcional):** "Vai, legaliza aí."<br><br>*(a peça fecha igual sem a segunda)* | Lockup centrado, largura 620, centro y=560<br><br>Sora 600 **56px** `#1B1E24`, x=72, baselines 700 / 764:<br>`Entra na lista.`<br>`Eu guardo o preço.`<br><br>Botão: fill coral-600 `#DD4E27`, rótulo Sora 700 **56px** branco, centrado, baseline y=910:<br>`Cadastre-se`<br><br>Sora 400 **36px** `#736E67`, x=72, baselines 1020 / 1068 / 1116 / 1164:<br>`Condição garantida pra quem entra na lista.`<br>`Vale até 31 de dezembro de 2026,`<br>`ou enquanto a lista estiver aberta,`<br>`o que vier primeiro.` | **f594:** `sfx_ai_chime.wav`, twinkle curto de 200ms, sem cauda longa, no acendimento do AI. Trilha: acorde de resolução entrando em f570 e sustentando até f659, fade de 12 frames no fim. **Sem fade para preto:** o último frame é papel `#FAF8F5`, igual ao primeiro, para o loop do Reels emendar invisível. |

---

**Onde o coral acende, e onde não acende.**

Peça de 22s, teto de **3 acendimentos no palco**. Os três, na ordem:

| # | Onde | Cor | Papel na lista fechada |
|---|---|---|---|
| 1 | Chip `Ver a guia` do card 12, no snap, mais o anel de eco de 5 frames que nasce e morre nele | coral-700 `#B83D1C` (o rótulo branco fica abaixo de 56px) | **o objeto que a metáfora resolve** |
| 2 | A pill `Ver a guia` dentro do print real do app | coral do produto | **o mesmo objeto do acendimento 1**, reencontrado no produto real, e não um quarto foco |
| 3 | `R$79` no beat do preço | coral-600 `#DD4E27` | **o algarismo do preço de reserva** |
| fora do teto | Botão `Cadastre-se` do end card | coral-600 | fill de ação |
| fora do teto | O `AI` do wordmark no fecho | coral-500 `#F2643C` | logo |

**A âncora `UMA.` é ink de propósito.** Ela seria o quarto acendimento e estouraria o teto. Em ink `#1B1E24` a 260px ela lê como fato dito em voz baixa, que é o tom declarado da peça, e libera o único frame em que a legenda pode acender no meio da segunda metade.

**Um foco coral por frame, verificado respiração a respiração:**

| Respiração | Palco | Legenda |
|---|---|---|
| 1,600 a 3,300 | sem coral | coral: `DECLARAÇÃO` |
| 4,000 a 5,900 | sem coral | coral: `JULHO` |
| 6,600 a 7,733 | sem coral (o chip do card 12 só cruza a máscara em f244 = 8,133s) | coral: `OLHO` |
| 7,800 a 9,133 | chip coral do card 12 entrando | ink |
| 9,733 a 11,733 | sem coral (âncora em ink) | coral: `SUA` |
| 12,133 a 13,867 | pill coral do print | ink |
| 14,600 a 18,700 | `R$79` coral | ink |
| 19,367 a 21,733 | `AI` coral e botão | ink |

Onde o coral **não** acende, e a peça não tenta: nenhum estado negativo (não existe nenhum), nenhum rótulo de plano, nenhum super de condição, nenhum flash de transição, nenhum fundo cheio.

---

**Legenda queimada.**

Sora 600, 60px, line-height 1,25 (75px), tracking -1%, centralizada em `x=540`, largura máxima 880px, máximo 2 linhas e 5 palavras por bloco. Baselines de mote C (com super de condição): **1 linha em y=1320 · 2 linhas em y=1245 e y=1320**, bloco crescendo para cima. Entrada word-by-word: opacidade 0 a 100, y +28 a 0, escala 92 a 100 em **150ms (5 frames)** ease-out no onset da palavra. Stagger de 60 a 90ms. Palavra forte: **250ms (8 frames)**, y +40 a 0, escala 88 a 100, eixo `wght` 400 a 700. Saída de bloco: fade 250ms sem movimento. **Rotação alternada desligada** nesta peça: o tom é sóbrio.

Do frame 0 ao 37 **a pergunta do hook é o texto queimado do quadro**. **Nenhum frame da peça fica sem texto queimado**, porque o super de condição entra em f30 e permanece até f569, e o end card carrega texto de f570 a f659. Os intervalos entre blocos de legenda são pausas de respiração da locução, não buracos de legendagem.

Modo duas cores, tema papel: texto `#1B1E24`, palavra forte **coral-600 `#DD4E27`** em Bold.

```
[1,600 a 3,300]   eu entrego a
                  DECLARAÇÃO.                  ← coral: declaração

[4,000 a 5,900]   eu preparo
                  a de JULHO.                  ← coral: julho

[6,600 a 7,733]   eu fico de OLHO              ← coral: olho

[7,800 a 9,133]   no que vence.                ← ink (chip coral já no palco)

[9,733 a 10,700]  o dinheiro sai               ← ink
[10,700 a 11,733] da SUA conta.                ← coral: sua (âncora em ink no palco)

[12,133 a 12,933] eu não pago                  ← ink
[12,933 a 13,867] no seu lugar.                  (pill coral no print do app)

[14,600 a 15,400] plano ME,                    ← ink
[15,400 a 16,200] Simples Nacional.              (R$79 aceso no palco)

[16,567 a 17,600] o app não abriu.             ← ink
[17,600 a 18,700] ninguém paga hoje.           ← ink

[19,367 a 20,433] eu guardo o preço.           ← ink (o AI do wordmark é o coral do frame)

[20,667 a 21,733] vai, legaliza aí.            ← ink (slot opcional)
```

**Por que o coral migra da legenda para o palco.** Da respiração 4 em diante existe quase sempre um acendimento no palco (o chip do card 12, a pill do print, o `R$79`, o `AI`), então a legenda entra em ink nesses frames. A única exceção é a respiração do payoff, onde a âncora é ink de propósito e a palavra `SUA` acende. Quatro palavras corais no total: `declaração`, `julho`, `olho`, `sua`.

---

**End card.**

```
                    [ lockup Legalizai ]
              legalizai-logo-horizontal.svg
           largura 620 · centro y=560 · o "AI" acende
              em coral-500 #F2643C nos frames 594 a 599


  Entra na lista.                              Sora 600 · 56px · #1B1E24
  Eu guardo o preço.                           baselines 700 e 764


  ┌──────────────────────────────┐             fill coral-600 #DD4E27
  │        Cadastre-se           │             raio 36 · x 72 a 612 · y 830 a 950
  └──────────────────────────────┘             Sora 700 · 56px · branco · baseline 910


  Condição garantida pra quem entra na lista.  Sora 400 · 36px · #736E67
  Vale até 31 de dezembro de 2026,             baselines 1020 / 1068 / 1116 / 1164
  ou enquanto a lista estiver aberta,          nenhuma linha passa de x=858, então
  o que vier primeiro.                         o bloco fica fora do corredor de
                                               ícones do Instagram (x 880 a 1080)
```

**Fala obrigatória do end card (f581 a f613):** "Eu guardo o preço."
**Fala opcional (slot de 1,067s, f620 a f652):** "Vai, legaliza aí."
**Botão do Meta:** `Cadastre-se`.
**Sem a fala opcional:** o slot vira hold do logo. Zero retiming, zero reescrita, o end card fecha idêntico. As três entradas escalonadas do bloco de condição (f600, f612, f624) garantem micro-evento até f632 mesmo nessa variante.

---

**Copy do post no Meta.**

**Primary text**
```
Todo mês tem uma fila de obrigações com prazo. Eu entrego a declaração, calculo a guia e fico de olho no que vence. A guia quem paga é você, porque o dinheiro sai da sua conta.

Plano ME, Simples Nacional: R$79 por mês nos 3 primeiros meses, R$139 depois. O app ainda não abriu e ninguém paga nada hoje. Você só entra na lista e o preço fica guardado no seu nome.

Condição garantida pra quem entra na lista. Vale até 31 de dezembro de 2026, ou enquanto a lista estiver aberta, o que vier primeiro.
```

**Headline** (27 caracteres)
```
Onze são minhas. Uma é sua.
```

**Description**
```
ME e Simples Nacional. R$79 nos 3 primeiros meses, R$139 depois.
```

---

**Lista de produção.**

| # | Asset | Origem | Estado | Como produzir |
|---|---|---|---|---|
| 1 | Comp `MASTER-1080x1920-30`, 660 frames, 16bpc, guia `GUIA-safe` **936x1320** (`x 72 a 1008`, `y 200 a 1520`, centro y=860) | [AE] | **NOVO** | Fork de `marketing/filme/escalada/jsx/10-estrutura.jsx`. Trocar `W=3840,H=2160` por 1080x1920, substituir a tabela `TAKES` pelos 7 beats deste roteiro, reescrever o `GUIA-safe`. Manter `findItem/removeItem/findOrCreateFolder` intactos. |
| 2 | Comp `_CONTROLE` com os Color Controls nomeados | [AE] | **JÁ EXISTE** · `marketing/filme/escalada/jsx/00-tokens.jsx` | Roda direto, independe de resolução. Precisa de 4 controles novos: `verde-check`, `spinner-dark`, `superficie-alt`, `coral-700`. |
| 3 | `data/tokens.json` | [AE] | **JÁ EXISTE** · `marketing/filme/escalada/tools/gera-tokens.mjs` | Trocar `filme.master` por `{w:1080,h:1920,dur:660}` e reescrever o bloco `lettering` com a régua 9:16. Nenhum hex é digitado à mão em lugar nenhum da peça. |
| 4 | `PRE-card-obrigacao` **936x230** (e a variante **936x350** do card 12), raio 48, hairline `#2E313A` 3px, com slots de data, título, subtítulo, ícone de estado e chip de ação | [AE] | **JÁ EXISTE reproporcionar** · `jsx/20-precomps.jsx`, função `rrect()` e `PRE-card` (hoje 1160x680) | Reproporcionar. O `rrect()` já resolve retângulo com fill, stroke e raio. Instanciar 12 vezes por data-driven a partir de um JSON de coluna. A altura é campo do JSON, não constante. |
| 5 | Coluna rolante: null `CTRL-ROLAGEM` com posição Y linear e trava de 5 frames, mais máscara do palco `y 360 a 1140` (corte duro embaixo, fade 40px em cima) | [AE] | **NOVO** | Três keyframes: f16 (início da constante), f265 (fim da constante, 13,3 px/frame), f270 (parado, velocidade 0, influência de chegada 66%). **A posição é derivada, não digitada:** o script ancora o keyframe de f270 no valor que deixa o card 12 com centro em `y=750`, e resolve f16 e f265 para trás a partir de (10 × 270) + 330 = 3030px de distância acumulada. **Assert obrigatório:** se o card 1 não fechar com o topo entre `y=960` e `y=1040` no f16, o build falha alto em vez de renderizar. Os 12 cards parentados. Push-in via escala da precomp da coluna. |
| 6 | Chip contador `SUAS · N`, pill 999, sem Directional Blur | [AE] | **JÁ EXISTE ajustar** · `jsx/54-contador-fix.jsx` e `PRE-contador` de `jsx/20-precomps.jsx` | **Remover o Directional Blur inteiro**, não reduzir de 26 para 8: a régua de motion proíbe blur direcional e o contador só dá um passo (0 para 1). Fica hard swap de 1 frame com escala 88 a 100 em 5 frames. A expressão de milhar pt-BR não é necessária aqui. |
| 7 | Ícone de estado: disco verde `#17A06A` 76px com check branco, e spinner de arco aberto 3px `#8E8981` | [AE] | **NOVO** | Shape layer + trim path para o check (mesmo gesto do check do logo). Spinner: elipse com `Trim Paths` start 0 end 25% e rotação de 1 volta em **24 frames**, loop. Cores lidas do `_CONTROLE`, nunca hex cru. **O spinner nunca é âmbar:** âmbar é "vence em breve", e aqui o estado é "em preparação". |
| 8 | Chip de ação `Ver a guia`, pill **coral-700 `#B83D1C`**, e o anel de eco de 5 frames | [AE] | **NOVO** | Fill em coral-700 porque o rótulo branco fica em 40px, abaixo do piso de 56px do coral-600. Anel: duplicata do chip com escala 100 a 118 e opacidade 55 a 0 em **5 frames (150ms) ease-out**, na cor do fill. **Precisa nascer e morrer no chip**, senão vira um acendimento a mais e estoura o teto. |
| 9 | Tela do app: recorte do card `DAS de junho` em `x 354 a 1000, y 1041 a 1379`, a **144,9%**, com a linha de valor coberta | **[TELA APP]** | **JÁ EXISTE tratamento NOVO** · `marketing/telas-app/obrigacoes.png` (1290x2796) | Importar via `jsx/30-imports.jsx` (helper `importa()` idempotente). **Medido no arquivo real:** o corpo da UI tem 32px no PNG (o print foi renderizado com fator 2,0, não 3,0), então 144,9% entrega 46,4px em quadro, acima do alvo de 44px. O corte em `x=1000` deixa o disco coral do ícone (que começa em `x=1026`) fora de quadro. Retângulo chapado `#1F2228` **sem raio e sem borda** cobre `x 354 a 1000, y 1152 a 1218` do PNG, e `a pagar` é retipografado em Sora 400 46px `#BDB8B0` em `x=146`, baseline `y=719`. Máscara de raio 48 no bloco inteiro, hairline `#2E313A` 3px por fora. |
| 10 | Bloco de preço empilhado, dois valores a 300px, mesmo tamanho, entrada simultânea | [AE] | **NOVO** | Text layers simples. **Assert no script: se os dois `fontSize` divergirem, o build falha alto.** |
| 11 | Super de condição: versão de rodapé 30px em 3 linhas (baselines 1420 / 1460 / 1500) e versão promovida a 36px em 4 linhas no end card (baselines 1020 / 1068 / 1116 / 1164) | [AE] | **NOVO, compartilhado com o criativo de MEI** | Objeto único parametrizado por `tamanho`, `linhas` e `baselines`. Vira asset da leva. **A quebra em 4 linhas no end card não é estética:** a 36px em 3 linhas o bloco chegava a `x=987` e entrava no corredor de ícones do Instagram. |
| 12 | Legenda queimada word-by-word, modo duas cores, tema papel | [AE] | **JÁ EXISTE, e é mais que 3 linhas** · `jsx/32-lettering.jsx` | Linha 17: trocar `var W=3840,H=2160` por leitura de `takeComp.width/height`. Novo `$.global.LETTERING_OPCOES`: `{W:1080,H:1920,tema:"papel",duasCores:true,tam:60,larguraMax:880,xc:540,y1:1320,y2a:1245,y2b:1320,GAP:11}`. **E também os valores de animação, que hoje são todos de 4K e todos fora da régua 9:16:** `durAnim` de 6f/12f (200ms e 400ms; 200ms nem existe no sistema) vai para 5f/8f; `dy` de 56/80 vai para 28/40; escalas 90 e 84 vão para 92 e 88; a **rotação alternada de ±4 graus é desligada** porque o tom é sóbrio. O modo `apple` fica desligado nesta peça pelo mesmo motivo. |
| 13 | Validação de legenda (travessão, teto de coral) e geração do `31-legendas-data.jsx` | [AE] | **JÁ EXISTE** · `marketing/filme/escalada/tools/fase3-gera-legendas.py` | Trocar o dicionário `LINHAS` e o `CORAL`. **As validações de travessão e de contagem de coral ficam como estão.** É o único ponto do pipeline que checa regra de marca sozinho. Adicionar um assert de teto de 5 palavras e 2 linhas por bloco. |
| 14 | Word-sync da locução | [FFMPEG] + Python | **JÁ EXISTE** · `marketing/filme/escalada/tools/fase1-processa.py` + `.venv` com WhisperX | Peça de bloco único, então usar só a parte de alinhamento word-level. Snap de todo onset para 1/30s. |
| 15 | Bloco de preço, âncora e print entrando com a régua de 400ms | [AE] | **JÁ EXISTE conceito** · `jsx/50-master.jsx`, função `entra()` | A saída do card 12 foi **removida**: virou corte seco. `easeSaida()` acelera na saída, e ease-in isolado só é permitido no objeto que cai por gravidade na virada, que não existe aqui. |
| 16 | Passe de acabamento, grain 1,5%, sem sombra | [AE] | **JÁ EXISTE** · `jsx/48-polimento.jsx` e `PRE-grade-grain` de `jsx/20-precomps.jsx` | Rodar só o grain e o `dotGrid()` se necessário. **Desligar `sombra()` e `brilho()`**, exceto o `brand-glow` do AI nos frames 594 a 599. |
| 17 | Helper para achar propriedade de efeito em AE português | [AE] | **JÁ EXISTE** · `jsx/52-fumaca-t7.jsx`, função `fxProp()` | Copiar para o utilitário da leva. Resolve o problema de matchName vs nome pt-BR, recursivo. |
| 18 | Lockup e acendimento do AI | **[SVG]** | **JÁ EXISTE** · `identidade/logos/legalizai-logo-horizontal.svg` + mecanismo em `jsx/53-lettering-t8-cores.jsx` | Fundo é papel, então é o master horizontal (tricolor, o "ai" já nasce coral). **Nunca o `legalizei-logo-app-fundo-solido.svg`**, cujo wordmark interno é o antigo. O `53-` repinta text layer em precomp por critério ASCII, imune a acento. |
| 19 | End card | [AE] ou [FFMPEG] | **NOVO sobre JÁ EXISTE** · `marketing/vinheta/out/vinheta-9x16-4k60-v2.mp4` | Rota rápida: recortar os últimos 2,5s da vinheta (que já tem o acendimento em 9:16) e compor botão, linha de CTA e bloco de condição por cima no AE. Cerca de 1h contra 4 a 6h de construção do zero. |
| 20 | 7 SFX sintetizados | [FFMPEG] + numpy | **NOVO** (técnica documentada, código perdido) | `sfx_card_tick_a` e `sfx_card_tick_b` (tick de UI 60ms, timbres alternados), `sfx_snap_sub` (impacto grave com sub 55 Hz), `sfx_anchor_settle`, `sfx_screen_in`, `sfx_price_set`, `sfx_ai_chime`. Reescrever o sintetizador numpy do escalada. Guardar em `marketing/audio/sfx/` versionado desta vez, não no scratchpad. |
| 21 | Trilha em stems | [FFMPEG] | **JÁ EXISTE, caminhos verificados** · `marketing/filme/escalada/audio/Trilha/stems/A Step Ahead - Experia/` | Os quatro stems existem no disco: `ES_A Step Ahead STEMS BASS`, `DRUMS`, `INSTRUMENTS`, `MELODY`. Envelope por camada: bass do f0, drums do f30, instruments do f296, camada cheia f426, corte seco f561, resolução f570. Ver ressalva 5 sobre sidechain. |
| 22 | Locução, 46 palavras | ElevenLabs | **NOVO** | Guia de fraseado em `marketing/audio/Narração/narracao-elevenlabs-escalada.md`: uma ideia por respiração, palavra de peso no fim. Registro sóbrio, sem sorriso na voz. Plano B verificado: Voiceover da Higgsfield a 1,35 créditos por trecho. |
| 23 | Mux final | [FFMPEG] | **JÁ EXISTE** · pipeline `mux-final` do escalada | aerender para sequência TIFF em chunks de 40 frames, ffmpeg incremental, concat. **Nunca saída direta de mp4 pelo AE** (encoder H.264 do MediaCore quebrado nesta máquina). `aerender` sempre com `-mfr OFF 100`. Loudnorm 2-pass a -14 LUFS e -1,5 dBTP, dual-mono 48 kHz. Validar por `count_frames` no mp4, nunca contando TIFs. |
| 24 | Higgsfield | **[HIGGSFIELD]** | **NÃO SE APLICA** | Zero planos, zero créditos. A peça é tipografia, card e tela real. |

**Pré-requisito de máquina:** 1,8 GB livres em C: reprova o render. Alvo mínimo de 30 GB antes do primeiro `aerender`. Recuperável rápido: `.venv` do WhisperX (2,3 GB, recriável depois do word-sync), os `.aep` antigos do escalada fora do git, `marketing/mascote/renders` (946 MB, mascote está fora desta leva).

---

**GATE FACTUAL, resolver antes da primeira linha de ExtendScript.**

A âncora `UMA.` é uma afirmação verificável, e a peça inteira depende dela. O que consegui verificar no repositório: a tela `obrigacoes.png` lista quatro itens para julho de 2026, e **dois** deles dependem do cliente (`DAS de junho · a pagar` e `Emitir notas de julho · Conforme você faturar`).

**Como o roteiro resolve isso sem mentir:** o micro-label do frame 1 declara o recorte (`OBRIGAÇÕES COM PRAZO`), e emitir nota não é obrigação com prazo, é consequência de faturar, o que a própria tela do app diz na letra (`Conforme você faturar`). Por isso o recorte da tela no beat de 12,0s pega só o card do `DAS de junho`: não para esconder, mas porque o card de emitir notas não pertence ao conjunto que a peça está contando. A coluna mostra 12 cards auditáveis e o micro-label do payoff diz `AS OUTRAS ONZE SÃO MINHAS`, número que o espectador pode conferir na tela.

**Pergunta exata para a validação fiscal (Larissa / Mauro):** *para um ME optante pelo Simples Nacional em Belo Horizonte, sem folha, ao longo de junho e julho de 2026, quais obrigações com prazo existem, e em quais delas a ação final é do cliente e não da contabilidade?* Os cards 6 (`ISS de junho`) e 7 (`Retenções do mês`) são os dois que mais dependem dessa confirmação.

**Fallback pronto, se a resposta honesta for dois.** Agora é troca de string pura, sem tocar em tamanho, baseline, motion ou timing:
- Âncora: `DUAS.` em Sora 700 a **260px** (3,03em = 788px, cabe nos 936 igual ao `UMA.`), ink `#1B1E24`, mesmo baseline `y=881`.
- Micro-label: `ESSAS SÃO SUAS · AS OUTRAS DEZ SÃO MINHAS`.
- Chip contador: `SUAS · 0` vira `SUAS · 2` no mesmo frame 270.
- Coluna: 12 cards viram 10 "minhas" mais 2 "suas", e o segundo card seu (`Emitir notas do mês · Conforme você faturar`) entra colado no primeiro, dentro do mesmo freeze, com a mesma altura de 350px.
- Locução 4 muda para: "Esse dinheiro sai da sua conta." (mesma contagem de sílabas, sem retiming).

---

**Contagem de palavras faladas.**

| Bloco | Janela | Fala | Palavras | Sílabas | Sílabas/s |
|---|---|---|---|---|---|
| 1 | 1,600 a 3,300 | "Eu entrego a declaração." | 4 | 9 | 5,3 |
| 2 | 4,000 a 5,900 | "Eu preparo a de julho." | 5 | 8 | 4,2 |
| 3 | 6,600 a 9,133 | "Eu fico de olho no que vence." | 7 | 10 | 3,9 |
| 4 | 9,733 a 11,733 | "O dinheiro sai da sua conta." | 6 | 10 | 5,0 |
| 5 | 12,133 a 13,867 | "Eu não pago no seu lugar." | 6 | 8 | 4,6 |
| 6 | 14,600 a 16,200 | "Plano ME, Simples Nacional." | 4 | 9 | 5,6 |
| 7 | 16,567 a 18,700 | "O app não abriu. Ninguém paga hoje." | 7 | 12 | 5,6 |
| 8 | 19,367 a 20,433 | "Eu guardo o preço." | 4 | 6 | 5,6 |
| **Corpo** | | | **43** | **72** | |
| Slot | 20,667 a 21,733 | "Vai, legaliza aí." | 3 | 7 | 6,6 |
| **Total** | | | **46** | **79** | |

**Checagem contra a régua de 2,1 palavras por segundo:**
- Com a frase de fecho opcional: 46 ÷ 22,0s = **2,09 palavras por segundo.** Passa.
- Sem ela: 43 ÷ 22,0s = **1,95 palavras por segundo.** Passa.
- **Checagem que faltava no roteiro anterior, e que reprovava três blocos:** nenhuma respiração passa de 6,6 sílabas por segundo, e o corpo inteiro fica entre 3,9 e 5,6. Fala normal em português brasileiro roda de 5,5 a 6,5 sílabas por segundo, e leitura sóbria de anúncio roda de 4,5 a 5,5. O corte anterior punha três blocos em 7,3 e 7,4 sílabas por segundo, o que o TTS não entrega sem soar apressado, que é o oposto do tom declarado.
- Tempo com voz de fato: 14,67s de fala em 22,0s de peça sem o slot, ou seja 33% de silêncio. **O silêncio da coluna, que é o material da peça, ficou intacto:** 6,13s de fala em 7,97s de coluna, exatamente como no corte anterior. O tempo extra saiu do payoff, da prova e do preço, que eram os beats sobrecarregados. **A folga foi gasta no meio, nunca no hook nem no CTA**, como manda a régua.

---

**Variação de corte, versão de 15,0s (450 frames).**

Mesmo argumento, mesmo hook, mesmo payoff. O que sai é a prova e metade da paciência.

| Beat | 22s (f) | **15s (f)** | O que muda |
|---|---|---|---|
| Hook | f0 a f29 | **f0 a f29** | Intocado. É o ativo. |
| A coluna | f30 a f269 | **f30 a f179** | 12 cards viram **8** (saem os cards 3, 5, 6 e 10: `Conferência das notas`, `Fechamento do mês`, `ISS de junho` e `Pró-labore de julho`). Velocidade sobe de 13,3 para **14,2 px/frame (426 px/s)**, carimbo a cada 19 frames. Micro-label do payoff vira `AS OUTRAS SETE SÃO MINHAS`. Legenda perde a respiração 2 (`eu preparo a de julho.`). |
| O snap | f270 a f287 | **f180 a f197** | Intocado. Trava de 5 frames, anel de 5 frames, freeze e contador exatamente iguais. |
| O payoff | f288 a f359 | **f198 a f257** | Hold da âncora cai de 1,83 para 1,43s, ainda acima do mínimo de 1,2s. Locução 4 integral, só com menos ar depois. |
| **A prova (tela do app)** | f360 a f425 | **cortada** | **Sai inteira.** É o beat mais caro em tempo e o menos carregado de argumento: ele confirma que o app existe, mas a coluna já fez isso. Junto sai a locução 5 (`eu não pago no seu lugar.`), que migra para o primary text do post. **Consequência de cor:** com o print fora, sobram 2 acendimentos no palco (chip do card 12 e `R$79`), abaixo do teto de 2 da faixa de 15 a 20s. |
| O preço | f426 a f569 | **f258 a f374** | Hold cai para 3,9s, ainda 2,6 vezes o mínimo de 1,5s. Locuções 6 e 7 ficam **integrais**, porque rótulo e mecânica de reserva não são cortáveis. |
| End card | f570 a f659 | **f375 a f449** | Cauda do hold do logo encurta em 15 frames. A locução 8 (`Eu guardo o preço.`) e o slot de 1,067s da fala opcional **permanecem intocados**. Bloco de condição a 36px em 4 linhas permanece. |
| **Total** | **660** | **450** | |

**Fallback do gate factual na versão de 15s:** âncora `DUAS.`, micro-label `AS OUTRAS SEIS SÃO MINHAS`, 8 cards viram 6 "minhas" mais 2 "suas".

**O que NÃO pode sair em nenhuma versão:** o contador em zero, o travamento seco, os dois preços juntos e do mesmo tamanho, o rótulo `ME · SIMPLES NACIONAL`, o super de condição, a data por extenso, o botão `Cadastre-se`, a locução `Eu guardo o preço.` e o slot da frase de fecho.

**Custo de produzir as duas:** a versão de 15s é uma troca de JSON de coluna, um recorte de timeline e um re-render. Cerca de 40 minutos, e entrega ao Meta duas variantes do mesmo argumento para decidir sozinho qual retém.

---

## Ressalvas e pendências

Cinco pontos que não têm conserto dentro desta peça sem matar a ideia, e um que é decisão de leva, não de peça. Todos ficam registrados aqui em vez de serem escondidos.

**1. A data por extenso está na tela, mas não está na voz.**
O brief (§6) e a régua (Bloco B) pedem a data "na voz e na tela". A peça carrega a condição inteira em texto do frame 30 ao 659, ou seja 21 dos 22 segundos, muito acima de qualquer hold mínimo. Mas ninguém fala. Medi o custo de falar: `Vale até 31 de dezembro de 2026, ou enquanto a lista estiver aberta, o que vier primeiro.` tem 41 sílabas, o que a 5,5 sílabas por segundo dá **7,5 segundos**. Não existe esse espaço numa peça de 22s sem destruir a coluna, que é o dispositivo de retenção. E a regra 1.26 proíbe falar um dos dois limites sem o outro, então não dá para encurtar. **Duas saídas, decisão do Pedro, e ela vale para os 6 criativos da leva, não só para este:** (a) aceitar que a data vive em texto de tela nas peças de 22s ou menos, que é como qualquer anúncio de performance trata letra de condição; ou (b) o end card cresce de 3,0s para 8,0s e a peça vira 27,0s, o que muda a classe do criativo de Reel de performance para vídeo de consideração. Não decidi isso sozinho.

**2. O gate factual das 12 obrigações continua aberto.**
A âncora `UMA.` é uma afirmação verificável e a peça inteira depende dela. O fallback está pronto e agora custa uma troca de string, mas **nenhum frame deve ser renderizado antes da resposta da Larissa ou do Mauro** à pergunta da seção do gate. Os cards 6 (`ISS de junho`) e 7 (`Retenções do mês`) são os dois de maior risco.

**3. A pill `Ver a guia` dentro do print do app fica em branco sobre coral abaixo de 56px.**
Em quadro ela cai em cerca de 46px, e a regra 1.6 exige 56px para branco sobre coral-600. A minha leitura, e ela é discutível: essa regra governa a tipografia que a **peça escreve**, não a UI de um produto capturada em print, que é prova e não composição. Se o Pedro discordar, o conserto é cortar o recorte acima da pill (`y 1041 a 1240` do PNG em vez de `1041 a 1379`), o que também remove o único coral daquele beat e libera a âncora `UMA.` para voltar a ser coral. Não fiz isso porque o recorte ficaria cortando um card no meio e a pill é o que prova que o cliente é quem aperta. **Item separado, para o vault do produto e não para este render:** a pill do app tem rótulo de 16px, abaixo do piso de 18,66px bold da regra AA do coral-600. Isso é dívida do componente, não desta peça.

**4. Dois preços a 300px são duas âncoras no mesmo frame.**
A régua 2.3 diz "máximo 1 âncora por peça em quadro ao mesmo tempo", e a regra do preço (Bloco A) diz "os dois preços aparecem juntos, do mesmo tamanho". Conflito direto. Resolvi a favor do preço, porque é regra de reprovação imediata e a outra é diretriz de composição. Na prática o par empilhado lê como **um** bloco de preço, não como duas âncoras competindo, e os 300px estão na parte baixa da banda justamente por isso.

**5. "Sem sidechain" precisa de confirmação.**
O roteiro anterior atribuía ao Pedro a decisão de mixar sem sidechain, com a música 5,9 dB abaixo da voz de forma constante. Não achei essa decisão em lugar nenhum, e o `SPEC.md` do escalada diz o contrário na linha 195: *"Slot de trilha com sidechaincompress keyado pela narração já montado"*. Mantive "sem sidechain" no roteiro porque é uma decisão de mix, não de marca, e não custa nada trocar depois (é re-rodar só o script de áudio, sem re-render de vídeo). Mas fica marcado como não verificado.

**6. "Vai, legaliza aí." continua pendente de validação explícita do Pedro.**
A peça foi construída para fechar idêntica com e sem ela. O slot de 1,067s vira hold do logo, sem retiming e sem reescrita, e a locução 8 (`Eu guardo o preço.`) é obrigatória e independente, então a mecânica de reserva no áudio não depende da frase pendente. O acendimento visual do `AI` acontece em f594, desacoplado da fala, exatamente para que a metade visual do par não fique refém da metade falada.

**7. Correção que a régua da leva deveria absorver.**
A regra 2.8 assume que os prints do app têm o corpo em 48px (fator 3,0 sobre 16 CSS px). Medi o `obrigacoes.png` e o corpo tem **32px** (fator 2,0). Todos os cálculos de escala de tela do app nos outros 5 criativos estão errados pelo mesmo fator de 1,5, e qualquer peça que use "58%" ou "0,536" vai entregar UI abaixo do piso de 30px. Isso precisa subir para a régua antes de o próximo roteiro ser escrito.

---

## Auditoria do guardian

**Bloco A · Reprovação imediata**

| Item | Estado |
|---|---|
| Travessão em roteiro, locução, legenda, super, micro-label, nome de arquivo e copy do Meta | **PASSA.** Zero ocorrências de `—` e `–`. Separador é `·`, ponto, vírgula ou "e". O assert de travessão do `fase3-gera-legendas.py` fica ligado. |
| Mascote em qualquer forma | **PASSA.** Nenhum corpo, rosto, pata, cauda, silhueta, sombra com forma de bicho, reflexo, versão estilizada ou ícone. Zero planos de IA, então zero risco de alucinar um animal. |
| A peça funciona sem o mascote | **PASSA.** O que carrega é o corte, a trava e a voz em 1ª pessoa. Adicionar o Léo não mudaria uma linha da estrutura. |
| Concorrente | **PASSA.** Nenhum nome, cor, logo, tipografia, layout ou comparação implícita. A única UI em quadro é a própria. |
| Preço não vive só no áudio | **PASSA.** `R$79` e `R$139` em quadro de f426 a f569, 4,800s. |
| Rótulo de plano na tela e no áudio, no mesmo quadro do preço | **PASSA.** `ME · SIMPLES NACIONAL` em 44px na baseline 460, mesmo quadro dos dois preços, e falado em 14,600. |
| Preço correto | **PASSA.** R$79 e R$139. Nenhum R$99, nenhum R$195, nenhum R$49,90. **Corrigido:** o `R$ 178,31` do print real do app é coberto por retângulo chapado e a palavra `a pagar` é retipografada. |
| Os dois preços juntos, do mesmo tamanho | **PASSA.** Entrada simultânea em f426, stagger zero, 300px os dois, assert de `fontSize` no build. |
| Mecânica de reserva explícita | **CORRIGIDO.** O áudio dizia que o app não abriu e que ninguém paga hoje, mas **não dizia que o valor fica guardado**. Locução 8 nova e obrigatória no end card: "Eu guardo o preço." Na tela, as três partes existem em legenda queimada e no destaque do end card. |
| Qualificador "do Simples Nacional" | **PASSA por ausência.** A peça não cita contador nem CRC em nenhum momento, então a regra não é acionada. O rótulo `ME · SIMPLES NACIONAL` já carrega o termo colado. |
| MEI não promete humano | **N/A.** Peça de ME. |
| Cobertura geográfica | **PASSA.** A peça não menciona geografia, não mostra mapa e não diz "de qualquer lugar". Mote C não pode sugerir cobertura nacional, e não sugere. |
| Termo contratual | **PASSA.** Zero menção a fidelidade, multa, certificado digital, taxa da Junta, DAE, TTRT ou prazo de abertura. |
| Promessa de garantia | **PASSA.** As palavras "incondicional", "sem letra miúda", "sem pegadinha" e "sem surpresa" não aparecem. "Condição garantida" é a redação literal que o brief §6 trava para o super, e o brief vence a régua derivada. |
| Claim não esticado | **CORRIGIDO.** O subtítulo do card 8 dizia `A gente entrega, nada a fazer`, que é a forma exata do proibido "você não faz nada". Virou repetição limpa do card 1. |

**Bloco B · Prazo, escassez e data**

Escassez real apenas: **passa**, zero countdown, relógio ou contador de vagas. O chip `SUAS · N` conta obrigações do espectador e sobe de 0 para 1; contador de escassez conta para baixo, este conta para cima, e o rótulo é `SUAS`, não `VAGAS`. Os dois limites vêm sempre juntos e unidos por "o que vier primeiro": **passa**. Data por extenso na tela: **passa**. Data na voz: **ressalva 1**. Super de condição a partir do 2º quadro e até o fim: **passa** (f30 a f569 na versão de rodapé, f600 a f659 na versão promovida). Prazo não vive só no áudio: **passa**, ele nem está no áudio.

**Bloco C · Hook e retenção**

Hook mudo em texto grande, 100% opaco no frame 1: **passa**. Primeiro micro-evento até o frame 12: **corrigido**, o evento de f11 era geometricamente impossível (o card 2 estava 150px abaixo da máscara e a subida era de 24px) e virou um passo de 60px, com a borda do card 2 cruzando em f21. Nenhum trecho de mais de 1,2s sem micro-evento: **corrigido**, o carimbo da coluna estava especificado a cada 20 frames com uma velocidade que dava 21,8, e agora fecha em 20,3; e o end card ganhou as entradas escalonadas do bloco de condição para não ficar 1,5s parado na variante sem a fala. CTA na tela: **passa**. Ritmo de fala: **corrigido**, ver a tabela de sílabas.

**Bloco D · Legenda e tipografia**

Legenda do primeiro ao último quadro: **passa, com o mecanismo declarado** (super de condição de f30 a f569 e end card de f570 a f659 garantem que nenhum frame fica sem texto queimado). Legenda diferente do destaque: **passa**. Sora em tudo: **passa**. Tamanhos: **corrigidos**, a âncora estava em 400px, fora da banda de palavra-veredito (200 a 260) e estourando os 936px de largura útil; virou 260px. Safe area: **corrigida** em dois pontos, o bloco de condição de 40px invadia o corredor de ícones do Instagram e os preços encostavam nele. Baseline da legenda: **passa**, 1320 e 1245/1320, mote C. Máximo 2 linhas e 5 palavras: **corrigido**, dois blocos tinham 6 palavras e viraram quatro blocos de 3. Tela do app legível ou assumidamente ilegível: **corrigido, e este era o achado mais caro** (ver correção 5 e ressalva 7). Separador `·`: **passa**.

**Bloco E · Cor**

Coral-500 só em logo e wordmark: **passa**, ele só aparece no `AI` do fecho. Fill de ação em coral-600, ou coral-700 quando o rótulo branco fica abaixo de 56px: **corrigido**, o chip `Ver a guia` do card 12 tinha rótulo branco de 40px sobre coral-600 e virou coral-700. Lista fechada e teto de acendimentos: **corrigido**, eram 4 e o teto é 3. Um foco coral por frame: **corrigido**, a palavra `VENCE` acendia em cima do chip coral do card 12. Coral não é erro: **passa**, a peça não tem estado negativo. Zero azul de marca: **passa**, o único azul possível seria dentro do print do app, e o recorte escolhido não tem nenhum. Fundo papel quente e texto `#F4F1EC` no dark: **passa**. Ink-400 não é texto de leitura: **passa**, o `#8E8981` do spinner é traço gráfico e as datas dos cards usam o terciário dark. Estado selecionado sólido: **N/A**, a peça não tem seleção. Cores de estado só marcam estado: **passa**, verde só em "feito" e o spinner nunca é âmbar. Nenhum hex cru: **passa**, tudo vem do `tokens.json` e do `_CONTROLE`, e a lista de produção pede 4 controles novos.

**Bloco F · Motion e construção**

Durações 150 / 250 / 400ms: **corrigido em três lugares** (o anel de 1 frame, que além de fora da régua lia como flash proibido; a desaceleração de 6 frames; e os valores internos do `32-lettering.jsx`, que rodam a 200ms e 400ms com deslocamentos de 4K). Easing sempre ease-out: **corrigido**, a saída do card 12 usava `easeSaida()`, que acelera na saída, e virou corte seco. Zero bounce, overshoot em texto, spring e motion blur em texto: **passa**. Zero sombra, stroke e caixa preta: **passa**. Zero glow exceto o `brand-glow` do `AI`: **passa**, e o item 16 da lista de produção manda desligar `sombra()` e `brilho()` explicitamente. Cortes secos: **passa**, e agora são um a mais, porque a saída deslizante virou corte. Raios corretos: **passa**, card 48, botão 36, chip pill 999, e a cobertura do print virou retângulo sem raio porque raio dentro de fill chapado cria canto visível. Hairline 3px: **passa**. Grain 1,5%: **passa**.

**Bloco G · Marca, origem e entrega**

Wordmark "Legalizai": **passa**, nenhuma ocorrência de "Legalizei" em quadro. Logo correto: **passa**, `legalizai-logo-horizontal.svg` no papel, e a lista de produção proíbe explicitamente o `legalizei-logo-app-fundo-solido.svg`. End card padrão da leva: **passa**. A peça funciona com e sem "Vai, legaliza aí.": **passa**, e ficou mais robusta depois que a mecânica de reserva ganhou uma locução própria e obrigatória. Zero texto ou logo de IA generativa: **passa**, todo elemento tipográfico nasce no AE. Origem marcada em cada plano: **passa**. Planos de Higgsfield: **zero**, então zero créditos gastos e zero risco de glifo alucinado. Nenhuma foto de banco de imagem: **passa**. Anti-cross-sell: **passa**, a peça não menciona MEI, serviço avulso, blog nem indicação, e tem um CTA só. Alvo do humor: **passa por ausência de humor**, e a pergunta do hook não ridiculariza ninguém porque a resposta que ela entrega (`UMA.`) é favorável a quem assiste. Teste final da voz: **passa**, as oito falas soam Aliado, não Sábio distante, e três delas ("eu fico de olho", "eu não pago no seu lugar", "eu guardo o preço") são exatamente os três canais pelos quais a alma do Léo entra sem o Léo em quadro.

**Verificações feitas no disco, não assumidas**

`marketing/telas-app/obrigacoes.png` medido pixel a pixel (card `DAS de junho` em `x 354 a 1169, y 1041 a 1379`; corpo da UI em 32px; disco coral do ícone em `x 1026 a 1121`; linha de valor em `y 1167 a 1201`). Stems de `A Step Ahead` conferidos em `Trilha/stems/A Step Ahead - Experia/` (bass, drums, instruments, melody, todos presentes). `vinheta-9x16-4k60-v2.mp4` presente. `narracao-elevenlabs-escalada.md` presente. `32-lettering.jsx` aberto: o `W=3840,H=2160` da linha 17 confirmado, e os valores de animação de 4K confirmados nas linhas 251 a 271. `legalizai-logo-horizontal.svg` presente. Todos os jsx e tools citados na lista de produção existem. `SPEC.md` linha 195 confirma o slot de sidechain já montado, o que abre a ressalva 5.
