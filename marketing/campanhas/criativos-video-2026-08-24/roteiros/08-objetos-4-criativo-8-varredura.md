<!-- gerado pela rodada corretiva em 24/08/2026 -->
<!-- conceito objetos-4 | veredito do guardian: aprovado com correcao -->

> **Correções aplicadas pelo guardian:**
> - Orcamento de coral subcontado: o roteiro declarava 1 acendimento de um teto de 2. Sao 2 (anel em f0 a f50 e de novo em f267 a f365). Mesmo objeto, duas janelas, e acendimento se conta por janela. Tabela reescrita, contagem final 2 de 2, no limite exato.
> - VIOLACAO REAL consertada: coexistencia de dois focos coral por 6 frames. A palavra forte coral 'antes' de B4 ainda estaria em quadro de f267 a f273, exatamente enquanto o anel se desenha em coral. A saida de B4 foi antecipada para f259 e zera exatamente em f267, com B5 entrando em f265 pra faixa nao ficar vazia.
> - VIOLACAO REAL consertada: buraco de texto queimado no end card. A CTA 1 entrava so em 14,05, deixando 15 frames com o logo sozinho. Agora B7 sai em fade de 250ms atravessando o corte (f405 a f413) na faixa y 1440, vazia no mote A, e a CTA 1 entra em f411. Texto queimado nos 480 frames.
> - Mes vencido em quadro: julho de 2026 ja passou na data de veiculacao, e a peca promete antecipacao sobre ele. O mes virou o parametro MES_ALVO, o ano saiu de quadro, e o micro-label do freeze passou de 'JULHO · 2026' para 'AINDA NAO MARCADO'. O resto virou bloqueio duro no gate 10 com tres saidas costeadas.
> - Sobreposicao de duas camadas de texto no hook: a ancora display saia de 1,40 a 1,67 e a legenda entrava em 1,60, 7 frames com display e legenda juntos. B1 e a fala L1 passaram para f50, o frame exato em que a ancora termina de sair.
> - Velocidade da varredura de volta nao fechava com a distancia: 304 px/s em 1,20s da 365px, nao os 456px de um pitch. Corrigido para 380 px/s, 69% da velocidade da ida.
> - Cadencia da varredura de ida internamente contraditoria: dizia 536 px/s, 'um pitch a cada 0,85s' e 'micro-evento a cada 25 frames' ao mesmo tempo. Cadencia travada em 25 frames exatos, velocidade derivada 547,2 px/s, chegadas recalculadas em frame inteiro (f67, f92, f117, f142, f167).
> - Oito eventos visuais fora de frame inteiro a 30fps (1,65 / 12,05 / 12,17 / 13,94 / 14,05 / 14,12 / 14,25 / 15,05). Todos snapados. O 1,65 estava errado tambem por token: 250ms sao 8 frames, entao 1,40 mais 250ms da 1,67.
> - Aritmetica do respiro: prometia 3 frames de quadro limpo mas sobrava 1. A saida da ancora display 2 foi para f256 a f264, entregando os 3 frames (f264, f265, f266).
> - Contagem de palavras do frame 1: 'eu não pulo mês.' tem 4 palavras, nao 5. Corrigido para 4 de ancora mais o micro-label, 5 unidades legiveis, dentro do teto de 6.
> - Motion blur sem declaracao, num roteiro em que blur direcional e achado transversal que reprova no build. Nota nova declarando que e motion blur nativo de comp com shutter 180 na camada de shape, que nao existe nenhum efeito de blur no projeto, e que o 48-polimento.jsx ganha um assert que varre matchName e falha alto se achar 'Blur'.
> - Nome de token errado: #CBC5BC estava chamado de 'ink'. No canon ele e borda forte. Cor e uso corretos, nome errado em roteiro vira hex errado em comp. Corrigido em todas as ocorrencias.
> - Micro-label estourando a largura util: 'TELA DO APP · CALENDARIO DE OBRIGACOES' da cerca de 927px contra 936px uteis. Trocado por 'TELA DO APP · OBRIGACOES DO MES', cerca de 756px, que ainda ecoa o cabecalho da propria tela.
> - Plano 3 passou a ter 2,00s com o colapso incorporado, e a regua manda push-in acima de 2s. Acrescentado push-in de 3% de f306 a f342, congelando no colapso.
> - Cobertura de micro-evento no hold de 1,30s da tela real nao estava demonstrada. Demonstrada no roteiro: maior vao de 15 frames contra o teto de 36.
> - Split artificial do end card em 'parte 1' e 'parte 2', com fronteira em 14,05 que nem frame inteiro era. Unificado num plano 5 de 2,50s, que e o que o manual pede pro fecho.
> - Numeros de disco desatualizados no gate 1: dizia 1,8 GB livres e 49 .aep somando 450 MB. Medido agora: 478 MB livres de 111 GB, 990 .aep somando 703 MB. Conclusao nova, a faxina do repo nao resolve o gate.
> - Corte curto de 12,20s estava sem declaracao de banda. Ele esta abaixo dos 15 a 18s do mote A. Declarado como ativo de teste, nao substituto do master, e as contas refeitas em frames redondos (366 frames, 114 removidos).
> - Creditos de IA declarados como '0 por padrao'. 'Por padrao' abre porta. Corrigido para 0 absoluto, e a linha de textura Higgsfield reclassificada de 'opcional' para fora do roteiro.
> - Gates 6, 7 e 10 estavam fracos. O gate 6 era escolha aberta entre peso e cor quando cor reprova a peca, virou confirmacao. O gate 7 ganhou a pergunta do mes. O gate 10 saiu de 'template ou hardcoded' e virou bloqueio duro.
## CRIATIVO 8 :: VARREDURA

| Campo | Valor |
|---|---|
| **Mote** | A · institucional. Sem preço, sem rótulo de plano, sem super de condição, sem data |
| **Tom** | Sóbrio. Zero piada em quadro |
| **Persona** | C (paciência, insegura com burocracia). Serve A e B sem reescrita |
| **Duração** | 16,00s exatos · 480 frames · dentro da banda do mote A (15 a 18s) |
| **Formato** | 9:16 · 1080x1920 · 30 fps · master H.264 via sequência TIFF mais ffmpeg |
| **Pilar de funil** | Topo. Prova de comportamento, não de resultado |
| **CTA em tela** | `Entra na lista de espera.` mais `O prazo fica comigo.` |
| **Botão do Meta** | `Cadastre-se` |
| **Planos** | 5 (take contínuo de 8,90s, dois planos de apoio, tela real, end card de 2,50s) |
| **Créditos de IA gastos** | **0.** Nenhum plano `[HIGGSFIELD]` existe no roteiro |
| **Acendimentos de coral no palco** | **2 de um teto de 2** (ver seção Orçamento de coral) |
| **Papel na leva** | **PILOTO DO TEMPLATE 9:16.** Nasce aqui o GUIA-safe, o bloco de super de condição (construído e desligado), o end card padrão e o switch de baseline do lettering |

---

**A ideia em uma frase.**

A câmera varre doze meses de calendário de papel, trava seca no único mês que ainda não foi marcado, desenha o anel, e as folhas se dobram numa só até virar a tela real do app.

---

**Por que para o dedo.**

O hook não pede leitura, pede reflexo. O frame 1 é uma tira de folhas de calendário cortada pelas duas bordas do quadro, o que declara que ela continua pros dois lados e cria uma pergunta sem texto: quanto disso tem? Dentro dela, um único dia com anel coral, e por cima, deitada, a frase `eu não pulo mês.` em 160px. São **4 palavras** de âncora display mais o micro-label `CALENDÁRIO`, ou seja **5 unidades legíveis** no frame congelado, dentro do teto de 6 do manual. E o buraco é limpo: uma promessa em primeira pessoa só faz sentido se existir um mês que alguém pularia, e a peça não diz qual. Congelado no grid do perfil, na miniatura ou no print que alguém manda pro sócio, esse frame continua sendo um cartaz que se explica sozinho.

A retenção é mecânica, não argumentativa. Movimento contínuo que trava seco é reflexo óptico, não decisão de assistir: o olho persegue a tira, a expectativa de destino nasce em menos de meio segundo e só é paga cinco segundos depois. Quando a varredura trava, abre o segundo loop na hora, porque a folha em que ela parou é a única sem anel, e a pessoa fica pra ver o que acontece com ela. Entre os dois loops não existe um trecho de 36 frames sem micro-evento: cada folha que cruza a mira do centro produz um snap de peso e um tick, a cada **25 frames exatos**. E por baixo de tudo roda o loop de formato: o último frame do end card e o primeiro frame do hook têm o mesmo papel `#FAF8F5`, então quem chega ao fim já está no começo de novo e o Reels ganha uma segunda visualização de graça. Nenhuma peça do vault faz isso, todas terminam em fade pra preto.

---

**Onde mora a alma da marca.**

A primeira pessoa não é citada, ela é queimada duas vezes em corpo de display, e a primeira delas está no frame 1: `eu não pulo mês.` em Sora 700 160px no centro óptico y 790, e depois `eu não deixo passar.` no segundo 6,93, em cima da folha travada. Nenhuma das duas depende de áudio pra existir. A câmera age como vigia na própria gramática, sem metáfora citada: ela varre o horizonte (a tira deslizando 4,90s), congela (parada seca de 6 frames mais freeze de 10 frames com o áudio caindo junto), e corrige antes do problema acontecer (o anel coral se desenhando em 400ms em volta de um dia que ainda não chegou). O objeto que a marca manipula, o anel, nunca marca perigo: ele nasce coral no hook como coisa já feita, apaga pra borda forte quando o mês passa, e volta a acender uma única vez quando a marca faz o trabalho em quadro. Não existe piada nesta peça, e isso é deliberado: essa é a peça séria da leva, ela carrega a promessa de comportamento sozinha, e o único alvo possível de ironia aqui seria a dúvida de quem assiste, o que a marca proíbe. Onde as outras peças riem da prática do setor, esta cala e olha.

Os seis itens da gramática do vigia estão todos presentes, e o mínimo exigido eram dois: voz em 1ª pessoa queimada, o snap, a varredura de horizonte, o congelamento, o corte que antecipa (a imagem para 4 frames antes da última sílaba de L3) e o calendário vigiado como objeto físico.

---

**Convenção de tempo deste roteiro.** O número de frame governa, o segundo é a leitura arredondada dele. Todo evento **visual** cai em frame inteiro a 30 fps. As entradas de legenda e as janelas de fala nascem sample-accurate do WhisperX e snapam pro frame mais próximo no build.

---

**Roteiro quadro a quadro.**

| Tempo | Imagem (o que se vê) | Origem | Áudio e voz | Texto de destaque na tela | Som e trilha |
|---|---|---|---|---|---|
| **0,00 a 1,40** (f0 a f42) · PLANO 1 começa | Fundo papel `#FAF8F5` em todo o quadro. Atravessando o palco na horizontal, a **tira de 12 folhas de calendário**: folha de 400x540 raio 48, superfície `#FFFFFF`, hairline `#E3DED7` 3px, pitch de 456px, centro vertical da tira em **y 640**, cortada pelas duas bordas do quadro. Cada folha traz uma faixa de cabeçalho em superfície alternada `#F1EEE9` com o nome do mês em Sora 700 40px `#1B1E24` e uma grade de 7x5 células vazias 42x38 raio 24 em `#F1EEE9`. Folha centrada é **JANEIRO**. Hairline vertical `GUIA-mira` 3px borda forte `#CBC5BC` em x 540, de y 380 a y 900. Na célula da **linha 1, coluna 4** de JANEIRO (centro exato x 540, y 527), o **anel coral-600 `#DD4E27`**, elipse 74x66, stroke 7px, line cap redondo. Zero movimento na tira. Push-in contínuo de 4% começa em f0 e roda até f267. **Micro-evento no f11 (0,37):** o anel pulsa uma vez, stroke 7 para 10 para 7, 150ms ease-out, sem escala e sem bounce | **[AE]** | Silêncio de voz. A locução só entra em 1,67 | **Micro-label** x 72, baseline y 320, Sora 500 32px CAPS tracking mais 8%, `#736E67`: `CALENDÁRIO`<br><br>**Âncora display A2**, 2 linhas, Sora 700 **160px**, tracking menos 2%, line-height 0,95em (152px), centralizada em x 540, cor `#1B1E24`, baselines **y 714** e **y 866** (centro óptico y 790), **opacidade 100 desde o f0**:<br>`eu não pulo`<br>`mês.` | **Primeiro som é evento físico, nunca voz:** tick seco de relógio de parede em f0, curto, sem cauda. Em f11 um pip filtrado curtíssimo no pulso do anel. Trilha ausente até f42 |
| **1,40 a 6,30** (f42 a f189) · a varredura | A tira desliza pra **esquerda** em velocidade constante de **547,2 px/s**, que é exatamente um pitch de 456px a cada **25 frames (0,833s)**, então as folhas dos meses seguintes chegam pela direita e a travessia do quadro leva 1,97s. De f42 a f50 (250ms) o anel de JANEIRO **converte de coral-600 para borda forte `#CBC5BC` stroke 3px**, que é o estado de mês já marcado: essa é a única aula que a peça dá, e ela dura 250ms. Todas as folhas que chegam já trazem o anel em borda forte hairline. A âncora display sai em **fade de 250ms de f42 a f50**, sem deslocamento. Cada folha que cruza a mira: o anel dela vai de 3px para 6px e volta em **150ms**, o cabeçalho do mês faz `wght` 500 para 700 para 500 em 150ms. Chegadas centradas em **f67 (2,23) FEV · f92 (3,07) MAR · f117 (3,90) ABR · f142 (4,73) MAI · f167 (5,57) JUN**. Push-in de 4% continua. **Motion blur nativo de comp ligado somente no precomp da tira**, shutter 180 graus, e desligado em toda camada tipográfica. Nenhum efeito de blur existe no projeto (ver Nota de motion blur) | **[AE]** | 1,67 a 3,02 · "Eu fico de olho."<br><br>3,35 a 4,70 · "Você cuida do negócio."<br><br>5,05 a 6,63 · "Eu passo pelos doze." | **Micro-label** segue `CALENDÁRIO`<br><br>**Legenda queimada** entra em f50, texto diferente do display, Sora 600 60px, tracking menos 1%, centralizada em x 540, **baseline única y 1440** (régua de mote A), 1 linha por bloco, palavra de apoio de até 3 letras em `#524E48`:<br>B1 `eu fico de olho.` forte **olho** coral-600<br>B2 `você cuida do negócio.` forte **negócio** coral-600<br>B3 `eu passo pelos doze.` forte **doze** coral-600 | Whoosh contínuo de papel entra em f42, baixo, sem pico. Trilha entra em f42 com **stem de instruments** apenas, 5,9 dB abaixo da voz, constante, sem sidechain. Tick curto e seco a cada cruzamento de mira (f67, f92, f117, f142, f167), 6 dB abaixo do tick de abertura |
| **6,30 a 6,93** (f189 a f208) · o snap | **Parada seca de 6 frames:** a desaceleração começa em **f189** e a tira para com o **mês-alvo** centrado em **f195 (6,50)**, em ease-out sem overshoot. A rampa é integrada pra trás a partir do frame de parada por expressão, nunca keyframada à mão, e é isso que garante que a mira caia no centro exato da célula. O intervalo JUN para mês-alvo é de 28 frames por causa da frenagem, e é o único acima de 25. A célula linha 1 coluna 4 do mês-alvo está **nua**, sem anel nenhum, exatamente em cima da mira. **Freeze de 10 frames** de f195 a f205: o push-in também congela, nada se move em quadro. Em f205 o freeze solta e o push-in volta. Não existe flash coral, não existe anel de 1 frame, não existe piscada: **a ausência é o evento** | **[AE]** | A voz atravessa a parada: "...pelos doze." termina em **6,63 (f199)**, com a imagem já parada desde **f195**. São **4 frames** de antecipação, dentro da banda de 3 a 5 do manual. Esse é o corte que antecipa, aplicado a um movimento em vez de a um corte. De f199 a f208 **silêncio total de 300ms** | **Micro-label** troca em f205, com bump de `wght` 500 para 700 para 500 em 150ms: `AINDA NÃO MARCADO`<br><br>B3 permanece em quadro | Em f195 o whoosh e a trilha **cortam secos** no mesmo frame, mais um clack único e seco de papel encostando. De f199 a f208 silêncio absoluto, sem room tone |
| **6,93 a 8,53** (f208 a f256) | Quadro parado na folha do mês-alvo com a célula nua sob a mira. Push-in de 4% seguindo. A âncora display 2 entra em **400ms** (opacidade 0 para 100, y mais 48 para 0, escala 92 para 100, `wght` 300 para 700, tracking mais 2% para 0, ease-out), deitada por cima das linhas 3 a 5 da grade, deixando a linha 1 e o anel ausente visíveis acima dela | **[AE]** | 7,20 a 8,45 · "Esse aqui eu vi antes." | **Âncora display A2**, 2 linhas, Sora 700 **155px**, line-height 0,95em (147px), `#1B1E24`, baselines **y 716** e **y 863**:<br>`eu não deixo`<br>`passar.`<br><br>**Legenda** B4 entra em f215: `esse aqui eu vi antes.` forte **antes** coral-600 | Trilha volta em f208 com **stem de bass apenas**, muito baixa. Nenhum SFX até f267 |
| **8,53 a 8,90** (f256 a f267) · respiro | A âncora display 2 sai em **fade de 250ms de f256 a f264**, sem deslocamento. **3 frames de palco limpo** (f264, f265, f266) antes do corte | **[AE]** | Silêncio de voz | B4 começa a sair em fade de 250ms em **f259**, terminando exatamente em **f267**, o frame do corte. B5 entra em **f265**, sobrepondo B4 por 2 frames, então a faixa de legenda não fica vazia | Respiro. Trilha em bass, baixa |
| **8,90 a 10,20** (f267 a f306) · PLANO 2 · **CORTE push-in** | Corte seco pra enquadramento fechado: a mesma folha do mês-alvo a **190%**, célula nua posicionada em x 540 y 700, cabeçalho do mês visível no alto do palco. A mira segue em x 540 em espaço de tela. **O anel coral-600 `#DD4E27` se desenha sozinho** em volta da célula por **trim path, 400ms ease-out (f267 a f279)**, stroke 13px em quadro, line cap redondo, começo às 12 horas, sentido horário, sem overshoot. De f279 a f284 o anel **assenta** com um settle de peso de 150ms. Hold parado de f284 a f306. Plano de 1,30s, abaixo de 2s, então sem push-in | **[AE]** | 8,95 a 9,90 · "Então eu marco." | **Micro-label** segue `AINDA NÃO MARCADO`<br><br>**Legenda** B5 de f265: `então eu marco.` forte **marco** em **`#1B1E24` com `wght` 700, NÃO coral**, porque o anel está aceso no palco e vale um foco coral por frame | Traço de tinta subindo durante os 400ms do desenho, resolvendo num toque grave e curto de assentar em f279. Trilha soma o **stem de melody** em f279 com swell de mais 2,6 dB |
| **10,20 a 11,40** (f306 a f342) · PLANO 3 · **CORTE de volta ao aberto** | Corte seco pro enquadramento original. Mês-alvo centrado, agora com o anel coral aceso. A varredura **recomeça a 380 px/s**, 69% da velocidade da ida, e avança exatamente um pitch de 456px em 36 frames: o mês seguinte chega centrado em **f342**. Motion blur nativo segue só no precomp da tira. Push-in de 3% de f306 a f342, congelando no colapso | **[AE]** | 10,35 a 11,30 · "Sem pular nenhum." | **Legenda** B6 entra em f309: `sem pular nenhum.` forte **nenhum** em `#1B1E24` `wght` 700, **não coral** (anel ainda aceso) | Whoosh de papel volta, mais grave e mais lento que o da primeira varredura. Um tick em f342 |
| **11,40 a 12,20** (f342 a f366) · o colapso (ainda plano 3) | **f342 a f354 (400ms, ease-out):** as 12 folhas convergem em x 540 com stagger de 2 frames de fora pra dentro, e as 11 que não são a folha do mês-alvo caem a opacidade 0 nos últimos 5 frames de cada uma, deixando só a folha do mês-alvo com o anel coral. **f354 a f366 (400ms, ease-out):** essa folha se transforma no card final, largura 400 para **936**, altura 540 para **562**, raio 48 mantido, superfície `#FFFFFF`, hairline `#E3DED7` 3px, centro óptico y 790. O anel coral sai em fade de 150ms de **f360 a f365**. Em f366 o card está branco e vazio. `GUIA-mira` sai em fade de 250ms de f342 a f350 | **[AE]** | Silêncio de voz | **Legenda** B6 segue em quadro | Folhas compactando: um empilhar curto de páginas, 4 acentos em stagger. **Grain sobe pra 2% durante o colapso, obrigatório**, porque área grande em movimento faz banding em H.264 |
| **12,20 a 13,50** (f366 a f405) · PLANO 4 · **CORTE casado** | Corte seco no mesmo retângulo e no mesmo raio: entra o **crop da tela real do app**, 936x562 em quadro, centro x 540, centro óptico y 790, ou seja y 509 a 1071. São dois cards escuros do calendário de obrigações, `Emitir notas de julho / Conforme você faturar` e `Declaração de julho / Em preparação pela gente`, o segundo com o ícone de **anel** em borda forte, que rima com o anel que a peça acabou de desenhar. Sem moldura de aparelho, sem sombra, sem glow. Hold parado de 1,30s, sem push-in. **Cobertura de micro-evento durante o hold:** bump do micro-label em f366, B7 word-by-word de f373 a f382, e a partir de f397 a saída de B7 e o decaimento da trilha. O maior vão sem micro-evento é de **15 frames**, contra o teto de 36 | **[TELA APP]**<br>`c:/Projects/Legalizei_Videos/marketing/telas-app/obrigacoes.png` (1290x2796)<br>**crop x 354, y 1406, largura 816, altura 490**<br>ffmpeg: `crop=816:490:354:1406`<br>escala em quadro **1,147x**<br>**Auditado por pixel nesta revisão. Ver gate 7 e Ressalva 1** | 12,50 a 13,25 · "Esse é o combinado."<br><br>13,25 a 13,50 · **silêncio de 250ms antes do end card** | **Micro-label** troca em f366 com bump de 150ms: `TELA DO APP · OBRIGAÇÕES DO MÊS`<br><br>**Legenda** B7 entra em f373: `esse é o combinado.` forte **combinado** coral-600 (o palco está sem coral desde f365) | Um assentar suave de UI no frame do corte. Trilha sustenta com bass mais melody e começa a decair em f397. Silêncio total de f397 a f405 |
| **13,50 a 16,00** (f405 a f480) · PLANO 5 · end card, 2,50s | **Corte seco.** Papel `#FAF8F5` entra em **POP de 4 frames (f405 a f409)**, nunca dissolve. Logo `legalizai-logo-horizontal.svg` largura 620px, centro x 540, centro y 620, entrando em **400ms (f405 a f417)** (opacidade 0 para 100, y mais 48 para 0, escala 92 para 100, ease-out). CTA linha 1 entra em **f411** (250ms, opacidade e y mais 32 para 0). CTA linha 2 entra em **f414** (250ms). Em **f417 (13,90) o "ai" do wordmark acende** de `#1B1E24` para **coral-500 `#F2643C`** em 150ms (f417 a f422), com o `--gradient-brand-glow` subindo junto. Esse é o único glow autorizado na peça. **Botão entra em f426 (14,20)** (250ms, opacidade 0 para 100, escala 96 para 100, sem bounce): 500x132, **raio 36**, fill **coral-600 `#DD4E27`**, centro x 540, centro y 1050, ou seja y 984 a 1116, e x 290 a 790, fora do corredor de ícones do Instagram. Hold do botão **1,80s exatos**. Último frame em papel `#FAF8F5`, idêntico ao fundo do frame 1, o que fecha o loop. **Nunca usar o lockup de `legalizei-logo-app-fundo-solido.svg`. Sem zoom no logo, sem pulso no botão, sem seta piscando, sem fade pra preto** | **[SVG]** mais **[AE]** | **Slot de 0,80s em f429 a f453 (14,30 a 15,10)** para a fala opcional "Vai, legaliza aí." Se o Pedro não validar a fala, **o slot vira hold do logo, sem retiming e sem reescrita** | **B7 sai em fade de 250ms de f405 a f413**, na faixa y 1440, que no end card de mote A está vazia. É isso que garante texto queimado em todos os 480 frames.<br><br>**CTA 1**, Sora 600 **56px**, `#1B1E24`, centralizada, baseline **y 850**:<br>`Entra na lista de espera.`<br><br>**CTA 2**, Sora 600 **48px**, `#524E48`, centralizada, baseline **y 920**:<br>`O prazo fica comigo.`<br><br>**Rótulo do botão**, Sora 700 **56px**, `#FFFFFF`, centralizado, baseline **y 1070**:<br>`Cadastre-se` | Impacto grave único e curto no POP do papel. Sino da marca (twinkle curto) no acendimento do "ai" em f417. Trilha resolve num acorde final que sustenta até f480 e corta seco no último frame, sem fade de áudio longo. Toque suave no assentar do botão em f426 |

**Nota de plano.** O plano 1 dura 8,90s, acima do teto de 3s do manual de magnetismo. Isso é deliberado e é a tese da peça: o argumento inteiro é um movimento de câmera, e cortar ele destrói o argumento. A mitigação está medida: a cadência de micro-evento dentro do plano 1 é de **25 frames exatos** (as chegadas de folha), mais apertada que qualquer ritmo de corte da leva, e a legenda word-by-word roda sem parar por cima. Os planos 2 a 5 têm 1,30s, 2,00s, 1,30s e 2,50s, todos dentro da régua, e o de 2,50s é o end card, que é a exceção prevista. Isso precisa de OK explícito (ver gate 4).

**Nota de motion blur.** O que roda no `PRE-tira-12` é o **motion blur nativo da composição** do After Effects, com shutter de 180 graus, ligado no switch da camada de shape. Ele **não é** o efeito `ADBE Motion Blur`, nem Directional Blur, nem CC Force Motion Blur, nem nenhum blur de zoom ou de lente. **Nenhum efeito de blur existe em nenhuma camada deste projeto**, e o `48-polimento.jsx` carrega um assert que percorre o projeto e falha alto se encontrar qualquer `matchName` de efeito contendo `Blur`. Blur direcional está na lista de proibições de motion e é achado transversal que reprova no build, então ele é checado por script e não pelo olho. Motion blur também está desligado em toda camada tipográfica, sem exceção.

---

**Orçamento de coral.**

Peça de 16s, então o teto de palco é **2 acendimentos**, não 3.

| # | Acendimento | Frames · segundos | Papel na lista fechada | Conta no teto? |
|---|---|---|---|---|
| 1 | **Anel coral-600 `#DD4E27`, janela do hook** | f0 a f50 · 0,00 a 1,67, na folha de JANEIRO, com pulso de 150ms em f11 | Item 3 da lista fechada: o objeto que a metáfora resolve | **SIM. 1 de 2** |
| 2 | **Anel coral-600 `#DD4E27`, janela do payoff** | f267 a f365 · 8,90 a 12,17, desenhado no mês-alvo e sustentado até o colapso | Item 3, **mesmo objeto**, segundo acendimento. O limite do item 3 é de 1 objeto por peça, e ele é respeitado: existe um único objeto coral na peça inteira | **SIM. 2 de 2** |
| a | **"ai" do wordmark**, coral-500 `#F2643C` | f417 a f480 | Item 6. O lockup inteiro conta como um, não três | **NÃO conta** |
| b | **Fill do botão**, coral-600 `#DD4E27` | f426 a f480 | Item 5. Coexiste com o "ai" por construção, única exceção autorizada de simultaneidade | **NÃO conta** |
| c | **Coral nativo da UI dentro da tela real** | f366 a f405 | **ZERO.** Auditado numericamente, não no olho | **NÃO existe** |
| d | **Anel coral da onda de papel** | nunca | O palco desta peça é papel `#FAF8F5` do primeiro ao último frame e não existe virada dark para papel, logo não existe onda e não existe anel de onda. Os únicos elementos escuros da peça são os dois cards dentro do crop da tela real, que são conteúdo de UI, não virada de mundo | **NÃO existe** |

**Contagem final de palco: 2 acendimentos de um teto de 2, no limite exato.** Eles são o mesmo objeto em duas janelas que **nunca coexistem**: entre f50 e f267 não há um único pixel de coral no palco. A contagem por janela, e não por objeto, é deliberada: um auditor conta acendimento, não conta intenção, e declarar 1 aqui seria subcontagem. Consequência de produção: **esta peça não tem folga de coral. Qualquer acendimento novo no palco reprova.**

**Auditoria numérica do coral nativo da tela real.** O crop `crop=816:490:354:1406` de `obrigacoes.png` foi varrido pixel a pixel, com Pillow, nesta revisão: **0 pixels coral, 0 pixels verdes, 0 pixels azuis** em 399.840 pixels (critérios: coral `r>140 e r-g>45 e r-b>55`; verde `g>110 e g-r>35 e g-b>25`; azul `b>120 e b-r>40 e b-g>25`). O conteúdo do crop foi lido visualmente e confirmado: dois cards escuros, quatro linhas de texto, **zero travessão, zero valor monetário**. As bordas dos cards na imagem cheia foram medidas por varredura de linha: card `Emitir notas` de y 1416 a 1632, card `Declaração` de y 1668 a 1887, ou seja o crop de y 1406 a 1896 tem 10px de folga em cima e 9px embaixo. Ficam **fora** do crop, com folga medida: o valor `R$ 178,31 · a pagar` dentro do card `DAS de junho` (y 1041 a 1380, ou seja 26px acima da borda superior do crop), o botão coral `Ver a guia` (dentro do mesmo card), a pill coral do dia 16 (y 420 a 530), os dois pontos coral do calendário, o check verde do card `Declaração mensal` (y 786 a 1005) e o botão coral `NF-e` da tab bar (y 2494 a 2664).

**Simultaneidade, frame a frame.**
- f0 a f50: anel aceso. Nenhuma legenda em quadro, a âncora display é ink. **Um foco.**
- f50 a f267: **zero coral no palco.** As palavras fortes de B1, B2, B3 e B4 são coral-600. A primeira delas, `olho`, acende em f56, seis frames depois de o anel virar borda forte em f50. **Um foco.**
- f259 a f267: B4 sai em fade de 250ms e chega a opacidade zero **exatamente no f267**, o frame em que o anel começa a se desenhar. Essa saída é a única do roteiro que não começa na entrada do bloco seguinte, e ela existe por causa desta regra. **Zero frame com dois focos coral.**
- f267 a f365: anel aceso. As palavras fortes de **B5 e B6 são ink `#1B1E24` com `wght` 700**, nunca coral. **Um foco.**
- f365 a f405: palco sem coral. A palavra forte de B7 volta a ser coral-600. **Um foco.**
- f405 a f413: B7 sai em fade, ainda com a palavra coral visível em baixa opacidade. O "ai" só acende em f417 e o botão em f426. **Zero sobreposição.**
- f417 a f480: end card, exceção autorizada.

**Decisão declarada contra o conceito original.** O conceito pedia que "cada folha que cruza o centro óptico acende o próprio anel". Isso foi **recusado**: em regime, um auditor conta aquilo como 5 acendimentos e a peça reprova. A troca foi por um micro-evento de peso, não de cor (anel de 3px para 6px e `wght` do cabeçalho 500 para 700), que entrega a mesma cadência de reflexo com custo zero de coral. A versão farol fica registrada como alternativa no gate 6.

**Decisão declarada contra o manual.** O manual manda que todo snap termine com "um anel coral de 1 frame". Aqui isso foi **recusado**, porque o anel é o objeto de payoff desta peça, o teto já está no limite exato de 2, e um anel de 1 frame seria um terceiro acendimento. O snap de f195 é feito de parada seca, freeze, corte de áudio e **ausência**.

---

**Legenda queimada.**

Texto corrido completo, quebrado em linhas de leitura. Sora 600, 60px, tracking menos 1%, line-height 1,25, centralizada em x 540, **baseline única y 1440** (régua de mote A, sem super de condição). Todos os blocos cabem em 1 linha, largura máxima calculada de 686px contra o teto de 880px, no bloco mais longo (`esse aqui eu vi antes.`). Entrada word-by-word: opacidade 0 para 100 em 150ms, y mais 28 para 0, escala 92 para 100, ease-out, stagger de 2 frames entre palavras. Palavra forte: 250ms, y mais 40 para 0, escala 88 para 100, `wght` 400 para 700.

**Convenção de saída, declarada.** A saída de cada bloco é um fade de 250ms sem deslocamento, e ela **começa no frame de entrada do bloco seguinte**, então os dois coexistem por 8 frames e a faixa de legenda nunca fica vazia. **Duas exceções, ambas por regra de coral:** B4 começa a sair em f259, antes da entrada de B5, pra zerar em f267; e B7 começa a sair em f405, o frame do corte do end card, atravessando o corte na faixa y 1440.

```
eu fico de OLHO.
você cuida do NEGÓCIO.
eu passo pelos DOZE.
esse aqui eu vi ANTES.
então eu MARCO.
sem pular NENHUM.
esse é o COMBINADO.
```

| Bloco | Entra | Sai (fim do fade) | Palavra que acende | Cor |
|---|---|---|---|---|
| B1 | f50 · 1,67 | f107 | **olho** | coral-600 `#DD4E27` |
| B2 | f99 · 3,30 | f159 | **negócio** | coral-600 `#DD4E27` |
| B3 | f151 · 5,03 | f223 | **doze** | coral-600 `#DD4E27` |
| B4 | f215 · 7,17 | **f267** (saída antecipada, começa em f259) | **antes** | coral-600 `#DD4E27` |
| B5 | f265 · 8,83 | f317 | **marco** | `#1B1E24` `wght` 700, anel aceso no palco |
| B6 | f309 · 10,30 | f381 | **nenhum** | `#1B1E24` `wght` 700, anel aceso no palco |
| B7 | f373 · 12,43 | **f413** (saída começa em f405, no corte) | **combinado** | coral-600 `#DD4E27` |

Palavras de apoio de até 3 letras (`eu`, `de`, `do`, `é`, `o`, `vi`, `sem`) entram em `#524E48`, conforme o rig.

**Cobertura de texto queimado, sem buraco.** De f0 a f50 o texto queimado do quadro é a âncora display `eu não pulo mês.`, que sai em fade exatamente quando B1 entra. De f50 a f413 a legenda corrida cobre tudo, com as saídas sobrepondo as entradas. A partir de f411 entram as duas linhas de CTA, que se sobrepõem à saída de B7 por 2 frames. De f411 a f480 o texto queimado são as duas linhas de CTA e o rótulo do botão. **Em nenhum dos 480 frames a tela fica sem texto queimado**, e em nenhum frame a legenda corrida repete o que a âncora display está dizendo.

**Por que a legenda entra em f50 e não no segundo 3.** O manual manda que a legenda queimada só entre a partir do segundo 3 quando o hook já é uma âncora display, pra não legendar o hook duas vezes. O brief manda legenda queimada do primeiro ao último quadro. Em conflito, vale o brief. A resolução é que a **âncora display É o texto queimado** de f0 a f50, e a legenda corrida assume no frame exato em que a âncora termina de sair. Zero sobreposição, zero buraco, e o hook nunca é dito duas vezes ao mesmo tempo.

---

**End card.**

Fundo papel quente `#FAF8F5`, entrando em POP de 4 frames.

```
[ logo Legalizai, 620px, centro y 620, com o "ai" acendendo em coral-500 ]

Entra na lista de espera.
O prazo fica comigo.

[ botão coral-600, 500x132, raio 36 ]
Cadastre-se
```

| Elemento | Spec |
|---|---|
| Logo | `identidade/logos/legalizai-logo-horizontal.svg`, 620px de largura, centro x 540 y 620, entrada de 400ms ease-out em f405 |
| Acendimento | o "ai" vai de `#1B1E24` para coral-500 `#F2643C` em 150ms a partir de f417 (13,90), com `--gradient-brand-glow` |
| CTA linha 1 | `Entra na lista de espera.` Sora 600 56px `#1B1E24` baseline y 850, entra em f411 |
| CTA linha 2 | `O prazo fica comigo.` Sora 600 48px `#524E48` baseline y 920, entra em f414 |
| Botão | 500x132, raio 36, fill coral-600 `#DD4E27`, centro x 540 y 1050, entra em f426 |
| Rótulo do botão | `Cadastre-se` Sora 700 **56px** `#FFFFFF` baseline y 1070. O 56px é o piso que faz branco sobre coral-600 passar AA em 1080x1920 |
| Botão do Meta | `Cadastre-se` |
| Hold | botão em quadro por 1,80s exatos (f426 a f480) |
| Slot da fala | f429 a f453, 0,80s. Com a fala "Vai, legaliza aí." a peça funciona. Sem ela, o slot vira hold do logo, **sem retiming e sem reescrita** |
| Loop | último frame em `#FAF8F5`, mesmo valor de fundo do frame 1 |

Mote A: **sem preço, sem rótulo de plano, sem super de condição, sem data**. O rodapé y 1400 a 1520 fica vazio nesta peça de propósito, e é exatamente por isso que a baseline da legenda pode morar em y 1440. O bloco de super existe construído e desligado no template.

---

**Copy do post no Meta.**

**Primary text** (3 linhas)
```
Eu não pulo mês.
Enquanto você toca a empresa, eu fico de olho no calendário de obrigações.
Entra na lista de espera da Legalizai.
```

**Headline** (25 caracteres)
```
Eu fico de olho no prazo.
```

**Description**
```
Contabilidade digital com 22 anos de escritório atrás.
```

**Botão:** `Cadastre-se`

Sem preço, sem plano, sem data, sem promessa de resultado, sem travessão, sem concorrente, um CTA só.

---

**Lista de produção.**

| Asset | Origem | Existe? | Como produzir | Template? |
|---|---|---|---|---|
| `10-estrutura-9x16.jsx` · MASTER 1080x1920 480f 30fps, `GUIA-safe` como retângulo 864x1440 centrado em y 840, guias de zona em y 200 / 360 / 1140 / 1220 / 1400 / 1520 e margens laterais em x 72 e x 1008, pastas 01-COMPS a 04-AUDIO | [AE] | **NOVO** | Porte de `marketing/filme/escalada/jsx/10-estrutura.jsx` (verificado, existe). Trocar `W`/`H` para 1080/1920, substituir a tabela `TAKES` pela grade de 5 planos, e reescrever o `GUIA-safe` (hoje ele é 90% central, que é régua de 16:9 e não serve pro Reels) | **TEMPLATE. Serve as 6** |
| `00-tokens.jsx` mais `tools/gera-tokens.mjs` · comp `_CONTROLE` com os Color Controls nomeados | [AE] | **JÁ EXISTE**, ambos verificados em `marketing/filme/escalada/jsx/00-tokens.jsx` e `marketing/filme/escalada/tools/gera-tokens.mjs` | Reuso 100% direto, independe de resolução. Só trocar o bloco `filme.master` para `{ w:1080, h:1920, dur:16 }` no mjs. **Nenhum hex digitado à mão na comp** | **TEMPLATE** |
| `20-precomps-9x16.jsx` · `PRE-card` 936x562 raio 48, `PRE-grade-grain` 1080x1920 com ADBE Noise em 2%, projeto em 16bpc | [AE] | **NOVO**, porte | De `jsx/20-precomps.jsx` (verificado). Reescalar dimensões, **deletar o `PRE-mascote`**, manter `proj.bitsPerChannel = 16` e o helper `rrect()` | **TEMPLATE** |
| `PRE-folha-mes` · folha 400x540 raio 48, superfície `#FFFFFF`, hairline `#E3DED7` 3px, faixa de cabeçalho `#F1EEE9` com mês em Sora 700 40px, grade 7x5 de células 42x38 raio 24 em `#F1EEE9`, **sem números de dia e sem ano** | [AE] | **NOVO**, mas com rig de origem | **Reciclar o `T2V-calendario` de `jsx/42-take-t2.jsx`** (verificado): ele já tem grade por Repeater duplo (X e Y), argolas de fichário, corpo com hairline e cabeçalho. **Duas mudanças obrigatórias:** o cabeçalho lá é coral-600 e aqui tem que virar `#F1EEE9` com texto ink, e o highlight de dia lá é coral-600 e aqui vira o `PRE-anel`. Células vazias de propósito: número de dia em 22px cairia abaixo do piso de 30px e ainda traria risco de data errada em quadro. **O ano nunca entra na folha** | específico |
| `PRE-tira-12` · 12 folhas por Repeater, deslocamento por expressão de velocidade constante de 547,2 px/s com parada em ease-out integrada pra trás a partir do frame f195, motion blur **nativo de comp** ligado só nesta camada, shutter 180 | [AE] | **NOVO** | Mesma técnica do campo de milhares de ícones dos takes 3 e 4 do escalada: 1 shape layer com Repeater, nunca 1 layer por folha. Parâmetro exposto: **`MES_ALVO`** (índice 0 a 11), que define qual folha para na mira e quais seis a precedem | **TEMPLATE parcial.** É o rig genérico de varredura de horizonte (H11 do manual), reutilizável por qualquer peça que precise de fileira que varre |
| `PRE-anel` · elipse 74x66, stroke coral-600 `#DD4E27` 7px, line cap redondo, desenho por trim path em 400ms ease-out, estado de pulso de 150ms, estado borda forte `#CBC5BC` 3px | [AE] | **NOVO**, com rig de origem | **Reciclar o padrão de `jsx/46-take-t6.jsx`** (verificado): `ADBE Vector Filter - Trim` com `Trim End` keyframado 0 para 100 e `easeK`, mais `Trim Start` atrasado pra saída. Elipse pelo helper `elipse()` de `jsx/52-fumaca-t7.jsx` (verificado, bezier k=0,5523) | específico |
| `GUIA-mira` · hairline vertical 3px borda forte `#CBC5BC` em x 540, de y 380 a y 900 | [AE] | **NOVO**, trivial | Shape layer. É o que faz o snap de f195 aterrissar num ponto exato e não por ali | específico |
| `32-lettering.jsx` parametrizado pra 9:16 | [AE] | **JÁ EXISTE**, verificado | Três mudanças: (a) trocar `var W = 3840, H = 2160` da linha 17 por leitura de `takeComp.width/height`; (b) novo bloco de opções; (c) `GAP` de 36 para 11. Bloco desta peça: `{ W:1080, H:1920, FPS:30, tema:"papel", duasCores:true, tam:60, larguraMax:880, xc:540, y1:1440, y2a:1365, y2b:1440 }`. **Motes B e C trocam `y1` para 1320 e `y2a/y2b` para 1245/1320**, e esse switch nasce aqui | **TEMPLATE. Serve as 6** |
| `fase3-gera-legendas.py` · casa texto de exibição com tokens do WhisperX, marca `peso` e `coral`, **valida travessão e valida contagem de coral por bloco** | [python] | **JÁ EXISTE**, verificado | Só trocar os dicionários `LINHAS` e `CORAL`. **As duas validações ficam como estão, são regra de marca.** Este é o único ponto do pipeline que checa marca automaticamente, e ele é o gate de travessão da leva inteira | **TEMPLATE. Serve as 6** |
| `fase1-processa.py` · WhisperX word-level, corte sample-accurate dos takes, montagem da narração-timeline | [python] | **JÁ EXISTE**, verificado, mais venv em `tools/.venv` | Trocar `FILME_DUR` para 16,0, `RESPIRO` pelos 7 blocos e `ANCORAS_FIM` pelas palavras finais de cada bloco | **TEMPLATE. Serve as 6** |
| `33-super-condicao.jsx` · 3 linhas, Sora 400 30px, `#736E67`, alinhado à esquerda em x 72, largura máx 936, baselines 1420 / 1460 / 1500, entrando a partir do 2o quadro em 250ms e ficando até o fim | [AE] | **NOVO** | **Construído e validado nesta peça, e entregue DESLIGADO**, porque mote A não tem super de condição. O texto que ele vai carregar nas peças B e C: `Condição garantida pra quem entra na lista. Vale até 31 de dezembro de 2026, ou enquanto a lista estiver aberta, o que vier primeiro.` Validar aqui o wrap em 3 linhas e a legibilidade em rodapé antes de qualquer peça de preço depender dele | **TEMPLATE. Serve B e C** |
| `35-endcard.jsx` · papel POP em 4f, logo 620px, acendimento do "ai" em 150ms com `brand-glow`, 2 linhas de CTA, botão 500x132 raio 36 coral-600 com rótulo 56px, slot de 0,80s | [AE] mais [SVG] | **NOVO** | O acendimento do "ai" sai de **`jsx/53-lettering-t8-cores.jsx`** (verificado), que percorre precomp recursivamente e repinta por critério ASCII, imune a acento e encoding. Alternativa medida: recortar os últimos 2 a 3s de `marketing/vinheta/out/vinheta-9x16-4k60-v2.mp4` (verificado, existe), que **já é 9:16 e já tem o acendimento**, e sobrepor botão e CTA no AE. Isso derruba o custo de 4 a 6h pra cerca de 1h | **TEMPLATE. Serve as 6** |
| Micro-label rig · Sora 500 32px CAPS tracking mais 8% `#736E67`, x 72 baseline y 320, separador `·` | [AE] | **NOVO**, trivial | Helper `texto()` de `jsx/47-take-t7.jsx` (verificado, linha 44) já aceita fonte, tamanho, cor, x, y, tracking e justificação. **Teto de largura:** o label mais longo desta peça é `TELA DO APP · OBRIGAÇÕES DO MÊS`, 31 caracteres, cerca de 756px contra os 936px úteis | **TEMPLATE. Serve as 6** |
| Logo master | [SVG] | **JÁ EXISTE**, verificado em `identidade/logos/legalizai-logo-horizontal.svg` | Fundo claro, tricolor, o "ai" já nasce coral. **Proibido usar `legalizei-logo-app-fundo-solido.svg`**, o wordmark interno dele é o antigo | **TEMPLATE** |
| Tela real do app | [TELA APP] | **JÁ EXISTE**, verificado, `marketing/telas-app/obrigacoes.png`, 1290x2796 | Crop **x 354, y 1406, largura 816, altura 490** (`crop=816:490:354:1406`), colocado em quadro a **1,147x**, ou seja 936x562. Títulos de card ficam em **46px** em quadro, acima do piso de leitura de 44px. Linhas secundárias ficam em **39px**, acima do piso absoluto de 30px, e são declaradas como textura, não como leitura. O crop é **declarado por coordenada e auditado por pixel**, nunca feito no olho. **Ver Ressalva 1: o mês desta tela é julho de 2026** | específico |
| `48-polimento.jsx` · grain, o `rmPolimento()` pra reverter, e o **assert de blur** | [AE] | **JÁ EXISTE**, verificado | Reuso direto. **Grain em 2% é obrigatório nesta peça**, porque a varredura e o colapso movem área grande e fazem banding em H.264. **Não usar `sombra()` nem `brilho()`**: a peça não tem sombra decorativa e o único glow permitido é o do "ai". **Acrescentar o assert:** varrer todas as camadas de todas as comps e falhar alto se algum `matchName` de efeito contiver `Blur` | **TEMPLATE. Serve as 6** |
| Trilha | [áudio] | **JÁ EXISTE**, verificado, stems em `escalada/audio/Trilha/stems/A Step Ahead - Experia/` com BASS, DRUMS, INSTRUMENTS e MELODY separados | Envelope por camada: instruments de f42 a f195, corte seco no snap, bass de f208, soma melody com swell de mais 2,6 dB em f279, resolve em f397. **Sem sidechain**, música 5,9 dB abaixo da voz, constante, decisão do Pedro | **TEMPLATE de arquitetura** |
| SFX · tick de relógio, pip, whoosh de papel contínuo, tick de cruzamento, clack de parada, traço de tinta, assentar grave, empilhar de páginas, assentar de UI, impacto do POP, sino do "ai", toque do botão | [AE] / [FFMPEG] | **NÃO EXISTE.** Verificado: `marketing/audio/` só tem `Narração`, `README.md` e um md de reunião. Não há pasta `sfx/`. O sintetizador em numpy que fez os 95 SFX do escalada viveu no scratchpad e sumiu | Reescrever o sintetizador em numpy (3 a 5h), ou baixar do Freesound com `marketing/pipeline/sfx.mjs` (verificado, existe). **Primeiro som da peça tem que ser físico, nunca voz** | **TEMPLATE. Serve as 6** |
| Locução | [áudio] | **NÃO EXISTE** | ElevenLabs Multilingual v2, guia de fraseado em `marketing/audio/Narração/`. **Não há chave de API no repo**, depende do Pedro. Plano B verificado: Voiceover da Higgsfield a 1,35 créditos por trecho, 7 trechos custam 9,45 créditos. 27 palavras, uma ideia por respiração, palavra de peso no fim | por peça |
| Textura de papel | [HIGGSFIELD] | **FORA DO ROTEIRO** | **Não existe plano `[HIGGSFIELD]` nesta peça.** O orçamento de IA dela é zero e isso não é uma opção default, é a especificação. Se algum dia alguém quiser textura, ela entra como **still** no Nano Banana Pro a 2 a 4 créditos (nunca vídeo Seedance a 45), macro de fibra de papel com luz rasante, prompt com negativo obrigatório `no text, no letters, no numbers, no typography, no logo, no face, no animal`, aplicada a 6% em multiply, e isso vira uma revisão de roteiro, não uma decisão de build. Fallback em [AE] a custo zero: grain em 2% mais `mancha()` de `jsx/47-take-t7.jsx` com wiggle de posição | não usado |
| Master e entrega | [FFMPEG] | **JÁ EXISTE** o caminho provado | aerender em **sequência TIFF com alfa em chunks de 40 frames**, nunca saída direta de mp4 (o encoder H.264 do MediaCore está quebrado nesta máquina), sempre com `-mfr OFF 100`. ffmpeg concat, loudnorm 2-pass a **-14 LUFS / -1,5 dBTP**, dual mono 48 kHz. Validar por `count_frames` no MP4, nunca contando TIFs. **Teste de judder obrigatório antes do build**, ver gate 5 | **TEMPLATE. Serve as 6** |

---

**Contagem de palavras faladas.**

| Linha | Janela | Palavras |
|---|---|---|
| L1 "Eu fico de olho." | 1,67 a 3,02 | 4 |
| L2 "Você cuida do negócio." | 3,35 a 4,70 | 4 |
| L3 "Eu passo pelos doze." | 5,05 a 6,63 | 4 |
| L4 "Esse aqui eu vi antes." | 7,20 a 8,45 | 5 |
| L5 "Então eu marco." | 8,95 a 9,90 | 3 |
| L6 "Sem pular nenhum." | 10,35 a 11,30 | 3 |
| L7 "Esse é o combinado." | 12,50 a 13,25 | 4 |
| **Subtotal sem a fala pendente** | | **27** |
| L8 opcional "Vai, legaliza aí." | 14,30 a 15,10 | 3 |
| **Total com a fala pendente** | | **30** |

**Checagem contra a régua.** Teto conservador do vault: 2,1 palavras por segundo, ou **33,6 palavras** em 16,00s.
- Sem a fala pendente: 27 / 16,00 = **1,69 palavra por segundo**. Folga de 6,6 palavras.
- Com a fala pendente: 30 / 16,00 = **1,88 palavra por segundo**. Folga de 3,6 palavras.

**Onde a folga foi gasta.** Nos dois buracos de fala do meio: 6,63 a 7,20 (o silêncio de 300ms mais a entrada da âncora display 2) e 8,45 a 8,95 (o respiro, o corte fechado e o começo do desenho do anel). **Nada da folga foi gasto no hook** (a voz só entra em 1,67, depois de o evento visual já ter acontecido) **nem no CTA** (o end card tem 2,50s pra 3 palavras opcionais). Densidade real por janela falada: 27 palavras em 10,13s de janela útil, ou 2,67 por segundo, que é entrega normal de locução de anúncio.

---

**Variação de corte.**

**Corte curto: 12,20s (366 frames).** O argumento sobrevive inteiro porque a espinha é varre, trava, corrige, e nenhuma das três sai. **Atenção: 12,20s está abaixo da banda de 15 a 18s do mote A. Este corte é ativo de teste de hook e de custo por resultado, não substituto do master.** Ver Ressalva 3.

Os nove segmentos do master, em segundos: hook 1,40 · varredura 4,90 · parada e freeze 0,63 · display 2 mais legenda 1,60 · respiro 0,37 · plano 2 do anel 1,30 · plano 3 da volta mais colapso 2,00 · tela real 1,30 · end card 2,50. Soma 16,00.

O que sai, exatamente, num total de 114 frames (3,80s):
1. **75 frames (2,50s) da varredura de ida.** Ela passa de 4,90s para 2,40s: a tira começa três meses depois e três folhas cruzam a mira em vez de cinco. **A velocidade continua idêntica em 547,2 px/s e a cadência continua em 25 frames, então nenhum reteste de judder é necessário.**
2. **O bloco de legenda B3 `eu passo pelos doze.` e a linha falada L3 inteira.** São 4 das 27 palavras.
3. **36 frames (1,20s) do plano 3, a varredura de volta.** Ela desaparece por inteiro, e com ela o bloco B6 `sem pular nenhum.` e a linha L6, mais 3 palavras. O colapso passa a começar direto do plano 2: corte de volta ao aberto e colapso imediato no mesmo frame.
4. **3 frames (0,10s) do hold da tela real**, que cai de 1,30s para 1,20s, exatamente no piso do canon.

O que **não** sai, em nenhuma hipótese: os 1,40s de hook congelado, os 0,63s de parada seca mais freeze, os 0,30s de silêncio, os 0,40s do desenho do anel dentro do plano 2, os 1,20s de tela real e os 2,50s de end card.

Nova conta: 1,40 mais 2,40 mais 0,63 mais 1,60 mais 0,37 mais 1,30 mais 0,80 mais 1,20 mais 2,50 é igual a **12,20s**, ou 366 frames redondos. Palavras faladas: 20, ou **1,64 por segundo**; com a fala pendente, 23, ou 1,89 por segundo. As duas versões continuam abaixo da régua de 2,1.

**Hook alternativo, de graça.** O maior ativo de tirar o mascote é poder rodar a mesma peça em dois hooks e deixar o Meta decidir. Aqui isso custa **um corte, zero render novo**: a versão B começa em f195, no frame travado do mês-alvo com a célula nua e `eu não deixo passar.` em display, e enxerta a varredura de ida como flashback de 2,0s logo depois. Mesmos assets, mesma locução remontada, mesmo end card.

---

**Gates de validação humana.**

| # | Gate | Quem | Por que trava o AE |
|---|---|---|---|
| 1 | **Disco. Medido nesta revisão, e está pior do que o roteiro dizia.** O volume único C: tem **478 MB livres de 111 GB**, não 1,8 GB. Uma sequência TIFF de 480 frames em 1080x1920 pede até 4,0 GB, e o cache do AE em `%LOCALAPPDATA%\Temp\Adobe` já chegou a 11 GB e matou render por disco cheio. **Alvo mínimo: 30 GB livres.** Recuperável rápido, medido agora: `escalada/tools/.venv` **2,3 GB** (recriável), `escalada/ae/` **703 MB** em **990 arquivos .aep**, `marketing/mascote/renders` **946 MB** (o mascote está fora desta leva). Somando os três dá cerca de **3,9 GB**, ou seja **limpar tudo isso ainda deixa a máquina a mais de 25 GB do alvo.** Este gate não se resolve com faxina no repo, precisa de decisão do Pedro sobre disco externo, limpeza de sistema ou volume novo | Pedro | **Bloqueio duro. Nada roda antes disso, e a folga é muito menor do que se imaginava** |
| 2 | **Styleframe antes de ExtendScript.** Aprovar três frames congelados: o f0 (hook), o f198 (o snap, no meio do freeze), e o f450 (end card). O CHANGELOG do escalada registra 104 versões em 8 dias, e a maior parte é ajuste fino do Pedro, não erro técnico. Isso se mata com styleframe aprovado antes, não com ferramenta | Pedro | É o item mais caro da peça se pular |
| 3 | **A voz em primeira pessoa como voz da marca.** As duas âncoras display são `eu não pulo mês.` e `eu não deixo passar.` Sem o suricato, essa primeira pessoa perde o dono e passa a ser a marca falando. Precisa de OK explícito de que a marca fala assim, em corpo de 155 a 160px, sem personagem carregando a simpatia | Pedro | Se cair, a peça perde a alma e vira motion design de banco |
| 4 | **O plano de 8,90s.** O manual de magnetismo põe teto de 3s por plano. O plano 1 desta peça tem 8,90s, deliberadamente, porque o argumento é o movimento. A mitigação está medida (micro-evento a cada 25 frames exatos). Precisa de OK, porque é desvio consciente de regra escrita | Pedro | Se cair, a peça precisa de 3 cortes novos e vira outra peça |
| 5 | **Teste de judder, antes do build e não depois do render.** A tira anda a 547,2 px/s e atravessa o quadro em 1,97s. Isso é exatamente o regime que faz judder em H.264 a 30fps. Protocolo: montar 2,0s de teste só com `PRE-tira-12`, renderizar no bitrate final, e olhar. Se der judder: o motion blur nativo já está ligado na camada gráfica, então a alavanca seguinte é baixar a velocidade pra 456 px/s, o que leva a cadência de 25 para 30 frames e alonga a varredura em 25 frames (0,83s), levando a peça a 16,83s, que continua dentro da banda de 15 a 18s do mote A | Pedro | É o único risco técnico que reprova a peça depois de pronta |
| 6 | **O anel durante a varredura: peso ou cor?** A versão entregue usa micro-evento de **peso** (anel de 3px para 6px), gastando zero coral. A versão do conceito original usa **cor** (cada folha acendendo o próprio anel por 5 frames). A segunda é mais bonita e custa 5 acendimentos num teto de 2 que **já está no limite exato**. Recomendação: manter a de peso | Pedro | Se escolher cor, a peça reprova por orçamento de coral. Não é uma escolha aberta, é uma confirmação |
| 7 | **O crop da tela real, e o mês dentro dele.** O crop está auditado por pixel nesta revisão (zero coral, zero verde, zero azul, zero valor monetário, zero travessão) e o conteúdo foi lido: `Emitir notas de julho / Conforme você faturar` e `Declaração de julho / Em preparação pela gente`. Duas confirmações são do produto, não do vídeo: (a) essa é copy corrente, e mostrar essa tela numa campanha de lista de espera **não insinua que o app já está no ar**; (b) **a tela é de julho de 2026, que já passou** na data de veiculação, e a peça precisa de uma das três saídas da Ressalva 1 | Mauro e Pedro | Regra dura: crop feito no olho reprova a peça. E mês vencido em quadro é erro factual do mesmo grau |
| 8 | **`O prazo fica comigo.` como CTA.** É promessa de **comportamento**, não de resultado, que é o único tipo de promessa que a marca pode fazer antes do app existir. Confirmar que ela não colide com o texto da LP da lista de espera, que ainda é pendência aberta número 2 do brief | Mauro e Pedro | Se a LP não entregar a mesma mecânica, a peça promete o que o funil não cumpre |
| 9 | **A fala "Vai, legaliza aí."** Continua sendo pendência aberta do Pedro, e o ADR de 13/08 trava frase falada e visual como par indivisível. A peça já está construída pra funcionar **com e sem**, no mesmo timing, mas o slot de 0,80s precisa de decisão antes de a locução ser gerada | Pedro | Depois da locução gravada, mudar isso custa nova sessão de TTS e novo word-sync |
| 10 | **O mês-alvo. Bloqueio duro, não é mais uma pergunta de template.** O roteiro parametriza o mês em `MES_ALVO` e tira o ano de quadro, mas isso não fecha sozinho: a peça diz `eu não deixo passar.` e "esse aqui eu vi antes" sobre um mês, e **essa promessa não pode cair num mês que já passou**. A única tela real de obrigações do acervo é julho de 2026. Escolher uma das três saídas da Ressalva 1 antes de qualquer render | Pedro e Mauro | Se sair errado, a peça anuncia que a marca marca prazo com quase dois meses de atraso, e isso destrói exatamente o argumento que ela veio fazer |

---

**Ressalvas e pendências.**

**Ressalva 1. O mês-alvo e o mês da tela real não fecham com a data de veiculação. Não tem conserto dentro do roteiro.**

O achado: a peça inteira é uma promessa de antecipação. O anel se desenha em volta de um dia que ainda não chegou, a fala diz "esse aqui eu vi antes" e "então eu marco". Isso só é verdade se o mês congelado estiver **à frente** de quem assiste. A única tela real de calendário de obrigações do acervo é **julho de 2026**, que já passou na data de hoje, 24 de agosto de 2026, e vai estar ainda mais atrás quando a campanha for ao ar. A versão anterior deste roteiro tratava isso como uma pergunta de template ("mês trocável ou travado?") e não como o erro factual que é.

O que foi corrigido aqui, e é o máximo que o roteiro pode fazer sozinho: o mês virou o parâmetro **`MES_ALVO`** no `PRE-tira-12`, **o ano saiu de quadro** (a folha não traz ano e o micro-label do freeze passou de `JULHO · 2026` para `AINDA NÃO MARCADO`), e a varredura passa a rodar os seis meses que precedem o mês-alvo, seja ele qual for. Com isso o palco deixa de datar a própria promessa.

O que **não** tem conserto dentro do roteiro é a tela real. As três saídas, todas de custo conhecido, e a escolha é do gate 10:

1. **Re-renderizar `obrigacoes.png` para o mês-alvo.** É uma tela de design do produto, o custo é do time de produto e não do vídeo, e resolve tudo: palco e tela passam a falar do mesmo mês futuro. **Esta é a saída recomendada.**
2. **Aceitar julho como convenção de mockup.** O micro-label `TELA DO APP · OBRIGAÇÕES DO MÊS` já declara o crop como screenshot de produto e não como continuação do palco, e mockup com dado arbitrário é convenção corrente. Custo zero, risco residual: quem pausar lê um mês vencido a dois segundos de uma promessa de antecipação.
3. **Trocar o crop pelo par mês-agnóstico. Auditado nesta revisão e REPROVADO por outro motivo.** O crop `crop=816:392:354:640` (em quadro 936x450 a 1,147x) pega o cabeçalho `Obrigações do mês` mais o card `Declaração mensal / A gente entrega, nada a fazer`, com 0 pixels coral e 0 pixels azuis em 319.872 pixels, zero travessão e zero valor monetário. Ele é mês-agnóstico e é tecnicamente limpo. **Mas a linha `nada a fazer` colide com a regra 1.20 do canon**, que proíbe dizer, escrever ou insinuar "você não faz nada", e ela entraria em quadro num card de 936px por 1,30s numa superfície de marketing. Fica registrado com as coordenadas prontas justamente pra que ninguém o descubra depois e o mande pro build achando que resolveu. **Se for usado, precisa de liberação explícita do Mauro contra a regra 1.20**, e o morph do colapso muda de 936x562 para 936x450.

**Ressalva 2. O orçamento de coral está no limite exato, sem folga nenhuma.**

A contagem honesta é **2 acendimentos de palco num teto de 2**, e não 1 como a versão anterior declarava. As duas janelas são do mesmo objeto e nunca coexistem, o que satisfaz o item 3 da lista fechada (1 objeto por peça), mas um auditor conta acendimento e não conta intenção. Consequência prática para o build: **qualquer coral novo no palco reprova a peça.** Isso inclui, e alguém vai tentar: acender o anel das folhas que cruzam a mira, acender a mira, acender o cabeçalho do mês travado, pôr um flash coral no snap, e trocar a palavra forte de B5 ou B6 de ink para coral. O gate 6 existe pra fechar essa porta antes de ela ser aberta.

**Ressalva 3. O corte curto de 12,20s está fora da banda de duração do mote A.**

A banda do mote institucional é 15 a 18s, porque a peça não tem preço pra segurar e precisa de espaço pra prova respirar. O corte de 12,20s é entregue como **ativo de teste** (teste de hook, teste de custo por resultado, teste de retenção relativa), não como substituto do master. Se o Meta mostrar que o curto ganha, isso é um dado que muda o brief, e a mudança de banda precisa passar pelo Pedro antes de virar entrega.

**Ressalva 4. Gate 1 ficou muito mais duro do que a versão anterior supunha.**

O roteiro dizia 1,8 GB livres. A medida feita nesta revisão dá **478 MB livres de 111 GB**, e a recuperação rápida disponível no repo (`.venv` 2,3 GB, `escalada/ae/` 703 MB em 990 arquivos `.aep`, `mascote/renders` 946 MB) soma cerca de 3,9 GB. Mesmo apagando os três, a máquina fica a mais de 25 GB do alvo de 30 GB. **Isso não é faxina, é decisão de infraestrutura**, e ela bloqueia a leva inteira, não só esta peça.

**Ressalva 5. A locução não tem caminho técnico fechado.**

Não há chave de API do ElevenLabs no repo, e o plano B (Voiceover da Higgsfield, 9,45 créditos para os 7 trechos) consome cerca de 10% do saldo total de 96,62 créditos da leva de 6 peças. Depende do Pedro, e depende antes do gate 9, porque a decisão sobre "Vai, legaliza aí." muda o número de trechos.

---

**Auditoria do guardian.**

Premissa da auditoria: esta peça tem um problema e eu vou achar. Os achados abaixo saíram de leitura item a item contra os 23 pontos do briefing de auditoria, mais verificação de arquivo e de pixel na máquina.

**O que foi verificado na máquina, não presumido.**
- `marketing/telas-app/obrigacoes.png` existe, 1290x2796. O crop `crop=816:490:354:1406` foi varrido com Pillow: **0 coral, 0 verde, 0 azul** em 399.840 pixels. O conteúdo foi lido visualmente: dois cards escuros, quatro linhas, **zero travessão, zero valor monetário**. As bordas reais dos cards foram medidas por varredura de linha (card 3: y 1416 a 1632; card 4: y 1668 a 1887), confirmando 10px de folga em cima e 9px embaixo. O `R$ 178,31 · a pagar` vive no card `DAS de junho`, y 1041 a 1380, fora do crop, e usa `·` e não travessão.
- Crop alternativo mês-agnóstico `crop=816:392:354:640` também auditado: 0 coral, 0 azul, 7.057 pixels verdes (o check de "feito", uso canônico). Reprovado por outro motivo, ver Ressalva 1.
- Existem: `legalizai-logo-horizontal.svg`, `vinheta-9x16-4k60-v2.mp4`, `jsx/00-tokens.jsx`, `10-estrutura.jsx`, `20-precomps.jsx`, `32-lettering.jsx`, `42-take-t2.jsx`, `46-take-t6.jsx`, `47-take-t7.jsx`, `48-polimento.jsx`, `52-fumaca-t7.jsx`, `53-lettering-t8-cores.jsx`, `tools/gera-tokens.mjs`, `fase1-processa.py`, `fase3-gera-legendas.py`, `pipeline/sfx.mjs`, e os stems BASS, DRUMS, INSTRUMENTS e MELODY de "A Step Ahead".
- **Não** existe `marketing/audio/sfx/`. Confirmado.
- Disco: **478 MB livres de 111 GB**, não 1,8 GB. `.venv` 2,3 GB, `escalada/ae/` 703 MB em 990 `.aep`, `mascote/renders` 946 MB.

**Passou limpo, sem correção.**
- **Mascote.** Zero suricato em qualquer forma. Nenhum corpo, rosto, pata, cauda, silhueta, sombra, reflexo, versão estilizada, boneco, avatar ou ícone. O `PRE-mascote` é explicitamente deletado no porte dos precomps. Nenhum plano de IA que pudesse alucinar um bicho, porque não há plano de IA.
- **Alma.** Não virou motion design frio. Primeira pessoa **queimada em corpo de display duas vezes** (`eu não pulo mês.` no frame 1 e `eu não deixo passar.` em f208), mais sete blocos de legenda em primeira pessoa, todos independentes de áudio. Os **seis** itens da gramática do vigia estão presentes, e o mínimo exigido eram dois.
- **Travessão.** Nenhum em locução, legenda, âncora, micro-label, CTA, rótulo de botão, copy do Meta ou dentro do crop de tela real. Separadores são `·`, ponto e vírgula.
- **Valor monetário.** Zero em quadro, inclusive dentro do crop, auditado por pixel e por leitura.
- **Preço, rótulo de plano, mecânica de reserva, qualificador do Simples Nacional, cobertura nacional, mapa, palavra Brasil, data, escassez, countdown, contagem de vaga.** Nada disso existe, e é assim que mote A tem que ser.
- **Concorrente, garantia, "incondicional", "sem letra miúda", claim esticado, termo contratual.** Ausentes.
- **Humor.** Não existe piada, o que é a decisão certa pra peça sóbria de persona C. Zero risco de rir de quem assiste.
- **Fonte, paleta, raios, sombra, glow, bounce.** Sora em tudo, todos os hexes dentro do canon, raios 48 / 36 / 24, hairline 3px, nenhuma sombra decorativa, glow só no "ai", zero bounce e zero overshoot.
- **Higgsfield.** Zero planos, zero créditos. A peça não só sobrevive sem, ela nunca dependeu.
- **"Vai, legaliza aí."** A peça funciona com e sem, no mesmo timing, sem retiming e sem reescrita.
- **Duração e ritmo de fala.** 16,00s dentro da banda de 15 a 18s do mote A. 27 palavras, 1,69 por segundo, contra o teto de 2,1. A sobra caiu no meio, nunca no hook nem no CTA.
- **Safe area, corredor do Instagram, baselines, tamanhos.** Micro-label 32px em y 320, âncora 155 a 160px com centro óptico em y 790, legenda 60px em baseline y 1440 (régua de mote A), rótulo de botão 56px, botão em x 290 a 790 e y 984 a 1116, fora do corredor de ícones. Nada abaixo de 30px.
- **Corte que antecipa.** A imagem para em f195 e a última sílaba de L3 cai em f199: 4 frames de antecipação, dentro da banda de 3 a 5.

**Corrigido, item por item.**

1. **Orçamento de coral subcontado.** A versão anterior declarava "1 acendimento de um teto de 2". São **2**: o anel acende em f0 a f50 e de novo em f267 a f365. É o mesmo objeto, o que satisfaz o limite de 1 objeto por peça do item 3, mas acendimento se conta por janela. A tabela foi reescrita, a contagem final passou a 2 de 2, e a Ressalva 2 registra que a peça não tem mais folga nenhuma de coral.
2. **Coexistência de dois focos coral em 6 frames.** A palavra forte `antes` de B4 é coral, e com a convenção de saída antiga ela ainda estaria em quadro de f267 a f273, exatamente enquanto o anel se desenha em coral. Corrigido: a saída de B4 foi antecipada para f259 e termina **exatamente em f267**, o frame do corte. B5 entra em f265 pra faixa de legenda não ficar vazia. Zero frame com dois focos.
3. **Mês vencido em quadro.** Ver Ressalva 1 e gate 10. Corrigido o que dava: mês virou parâmetro `MES_ALVO`, ano saiu de quadro, micro-label do freeze passou de `JULHO · 2026` para `AINDA NÃO MARCADO`. O resto é decisão humana com três saídas costeadas.
4. **Buraco de texto queimado no end card.** A versão anterior dizia que de 13,50 a 16,00 o texto queimado eram as linhas de CTA, mas a CTA 1 só entrava em 14,05, deixando 15 frames com o logo sozinho. Corrigido: B7 sai em fade de 250ms atravessando o corte (f405 a f413) na faixa y 1440, que no mote A está vazia, e a CTA 1 entra em f411, sobrepondo. Texto queimado em **todos os 480 frames**, sem inventar curva de entrada nova.
5. **Sobreposição de duas camadas de texto no hook.** A âncora display saía de 1,40 a 1,67 e a legenda B1 entrava em 1,60, deixando 7 frames com display e legenda juntos, o que o manual proíbe. Corrigido: B1 e a fala L1 entram em **f50**, o frame exato em que a âncora termina de sair e o anel termina de virar borda forte. Zero sobreposição, zero buraco, e a subseção "Por que a legenda entra em f50" declara o conflito manual contra brief e a resolução.
6. **Velocidade da varredura de volta não fechava com a distância.** A versão anterior dizia 304 px/s avançando um pitch de 456px em 1,20s. Isso dá 365px, não 456px. Corrigido para **380 px/s**, que é 456 dividido por 1,20 exato, e é 69% da velocidade da ida, não 57%.
7. **Cadência da varredura de ida internamente contraditória.** A versão anterior dizia 536 px/s, "um pitch a cada 0,85s" e "micro-evento a cada 25 frames" ao mesmo tempo. 0,85s são 25,5 frames. Corrigido travando a cadência em **25 frames exatos** e derivando a velocidade: **547,2 px/s**. Todas as chegadas foram recalculadas em frame inteiro (f67, f92, f117, f142, f167), a travessia do quadro passou de 2,01s para 1,97s, e o gate 5 e o corte curto foram atualizados com os números novos.
8. **Eventos visuais fora de frame inteiro.** Estavam em 1,65 / 12,05 / 12,17 / 13,94 / 14,05 / 14,12 / 14,25 / 15,05, nenhum deles múltiplo de 1/30s. E 1,65 estava errado por outro motivo: 250ms a 30fps são 8 frames, então 1,40 mais 250ms dá 1,67, não 1,65. Todos foram snapados e o roteiro passou a governar por frame, com o segundo como leitura arredondada.
9. **Aritmética do respiro.** A versão anterior prometia "3 frames de quadro limpo antes do corte", mas com o fade começando em 8,60 sobrava 1 frame. Corrigido: a saída da âncora display 2 foi para f256 a f264, entregando os 3 frames de palco limpo (f264, f265, f266) que o roteiro já reivindicava.
10. **Contagem de palavras do frame 1.** A versão anterior dizia "5 palavras legíveis". `eu não pulo mês.` tem **4**. Corrigido para 4 palavras de âncora mais o micro-label, ou 5 unidades legíveis, ainda dentro do teto de 6.
11. **Motion blur sem declaração.** Blur direcional é achado transversal que reprova no build, e o roteiro dizia só "motion blur ligado". Corrigido com a Nota de motion blur: é motion blur **nativo de comp** com shutter 180 na camada de shape, **não** é efeito, nenhum efeito de blur existe no projeto, e o `48-polimento.jsx` ganha um assert que varre `matchName` e falha alto se achar `Blur`. Checagem por script, não pelo olho.
12. **Nome de token errado.** `#CBC5BC` estava chamado de "ink". No canon ele é **borda forte**. A cor está certa e o uso está certo (contorno de marca gasta, divisor), só o nome estava errado, e nome errado em roteiro vira hex errado em comp. Corrigido em todas as ocorrências.
13. **Micro-label estourando a largura útil.** `TELA DO APP · CALENDÁRIO DE OBRIGAÇÕES` tem 38 caracteres, cerca de 927px em Sora 500 32px CAPS com tracking mais 8%, contra 936px úteis. Margem de 9px é margem de erro de kerning. Corrigido para `TELA DO APP · OBRIGAÇÕES DO MÊS`, 31 caracteres e cerca de 756px, que ainda ecoa o cabeçalho da própria tela.
14. **Plano 3 acima de 2s sem push-in.** Com o colapso incorporado, o plano 3 tem 2,00s, e a régua manda push-in de 3 a 4% em qualquer plano acima de 2 segundos. Corrigido: push-in de 3% de f306 a f342, congelando no colapso pra não brigar com a convergência das folhas.
15. **Cobertura de micro-evento no hold da tela real não estava demonstrada.** O hold é de 1,30s e o teto do canon é 1,2s sem micro-evento. Corrigido com a demonstração no roteiro: bump do micro-label em f366, B7 word-by-word de f373 a f382, saída de B7 e decaimento de trilha a partir de f397, maior vão de **15 frames** contra o teto de 36.
16. **Split artificial do end card.** Estava dividido em duas linhas de tabela ("parte 1" e "parte 2") com a fronteira em 14,05, que nem frame inteiro era. Unificado num plano 5 de 2,50s, que é exatamente o que o manual pede pro fecho.
17. **Números de disco desatualizados no gate 1.** A versão anterior dizia 1,8 GB livres e "47 dos 49 .aep antigos, cerca de 450 MB". A medida real é 478 MB livres, 990 arquivos `.aep` somando 703 MB. Corrigido no gate 1 e registrado na Ressalva 4, com a conclusão nova: a faxina do repo **não** resolve o gate.
18. **Corte curto sem banda declarada.** 12,20s está abaixo da banda de 15 a 18s do mote A e o roteiro não dizia isso. Corrigido no texto da variação e registrado na Ressalva 3 como ativo de teste, não substituto. As contas do corte foram refeitas em frames redondos (366 frames, 114 frames removidos).
19. **Créditos de IA declarados como "0 por padrão".** "Por padrão" abre porta. Corrigido para **0** absoluto, com a linha da textura na lista de produção reclassificada de "opcional" para **fora do roteiro**: se alguém quiser, é revisão de roteiro, não decisão de build.
20. **Gates 6, 7 e 10 fracos demais.** O gate 6 era uma escolha aberta entre peso e cor, quando cor reprova a peça: virou confirmação, não escolha. O gate 7 ganhou a pergunta do mês. O gate 10 saiu de "template ou hardcoded" e virou bloqueio duro com as três saídas costeadas.

**O que eu procurei e não achei.** Mascote em qualquer forma. Travessão. Blur direcional. Valor monetário fora dos quatro preços. Preço errado. Rótulo de plano ausente. Promessa de contador no mote B. Qualificador do Simples Nacional. Mapa, Brasil ou cobertura nacional. Mecânica de reserva ausente. Data em barras, countdown, contagem de vaga. Preço, rótulo, prazo ou CTA vivendo só no áudio. Hook que não funciona mudo. Piada mirando quem assiste. Cor fora do canon, fonte fora da Sora, sombra decorativa, bounce, motion fora de 150 / 250 / 400. Texto ou logo vindo de IA. Concorrente. Promessa de garantia. Peça que quebra sem "Vai, legaliza aí." Mote A com preço, rótulo, super ou data. Duração fora da banda no master.

**Veredito: aprovado com correção.** A ideia não foi tocada. O que mudou foi contagem, aritmética, alinhamento de frame, nomenclatura de token e honestidade de declaração, mais dois consertos que eram violação de verdade (a coexistência de coral em f267 a f273 e o buraco de texto queimado no end card). O único achado sem conserto dentro do roteiro é o mês da tela real, e ele saiu daqui como bloqueio duro com três saídas costeadas, em vez de sair como pergunta de template.