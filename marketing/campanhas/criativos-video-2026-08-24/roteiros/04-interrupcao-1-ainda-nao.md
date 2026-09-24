<!-- gerado pelo workflow legalizai-6-criativos-v2 em 24/08/2026 -->
<!-- conceito interrupcao-1 | veredito do guardian: aprovado com correcao -->

> **Correções aplicadas pelo guardian:**
> - CROP DO BLOCO 6 ESTAVA ERRADO, VERIFICADO NA IMAGEM. O roteiro manda cortar `obrigacoes.png` em `x 16 a 930`. Abri o PNG: a linha da semana ocupa de x=73 (pill 14) a x=1216 (pill 20), e o corte em 930 cai entre o pill de Sex (termina em 877) e o de Sab (comeca em 927). Ou seja: a semana entrava em quadro decepada na sexta, com Sab e Dom cortados fora. Isso nao le como recorte, le como bug de render. Corrigido para `x 6 a 920`, que fecha exatamente no vao entre Sex e Sab: entra a semana util inteira, Seg a Sex, com os pills 14 a 18, o 16 coral e o ponto de prazo sob o 15. A escala 1,181 (= 2,20x exatos) fica intacta porque 920 menos 6 da os mesmos 914px de largura de origem.
> - RELOGIO EM QUADRO NO BLOCO 2. O crop `y 30 a 570` de `veredito_waitlist.png` colocava o disco ambar com o icone de relogio como o maior objeto da faixa. A checagem de escassez do canon lista literalmente 'relogio' entre o que e proibido, e a regra 1.17 diz que ambar so marca 'vence em breve'. Corrigido para `y 380 a 920`: sai o relogio, entra o titulo 'Ainda nao, por enquanto' com o topo do card 'Atividade regulamentada'. Ganho colateral: o titulo, que e a virada de sentido do hook, passa a ser o elemento dominante da faixa em vez de disputar com um disco ambar, e o corpo da UI sobe de 40px para bem acima do piso. A prova de que e o app real migra para o micro label, que vira `TELA REAL DO APP · LEGALIZAI`.
> - TERCEIRO ACENDIMENTO DE CORAL NAO CONTADO. O roteiro declara 'dois acendimentos, fica exatamente no teto', mas esquece o anel coral-600 de 12px na borda de ataque da onda do bloco 4. Sao tres. Pior: esse anel percorre 2900px em 1000ms, e o canon proibe coral em qualquer coisa que se mexa rapido, alem de proibir flash coral de transicao. Corrigido: a borda de ataque da onda vira `#CBC5BC` (borda forte do papel) de 12px. A onda continua identica, o anti banding continua, e o `ainda` reacendendo em coral-600 tres frames depois vira o unico coral do mundo papel, que e mais forte do que era.
> - ANEL DE 1 FRAME NO FREEZE E PISCADA. Um stroke coral aceso e apagado em 1 frame nao le como anel, le como flash, e flash esta na lista de proibidos. Corrigido para 5 frames cheios (f366 a f371, os 150ms de motion micro) com saida em 8 frames (250ms). Consequencia em cadeia: o acendimento de `abriu` na legenda saiu de f372 para f382, para nao dividir frame com o anel. Agora existe de fato um foco coral por frame no palco.
> - BLOCO DE LEGENDA COM 7 PALAVRAS. `eu recuso o que / nao faco BEM.` quebra o teto de 5 palavras por bloco. Dividido em dois blocos: `eu recuso` em f162 e `o que nao faco BEM.` em f186. Ficou mais seco e mais no ritmo do Reel.
> - ANCORA DO BLOCO 6 INVADIA A COLUNA DE ICONES DO INSTAGRAM. `de olho` em Sora 700 a 250px, flush left em x=72, mede cerca de 905px, ou seja termina em x=977, com baseline 1150. O corredor de acoes do Instagram e x 880 a 1080, y 1040 a 1780. A cauda de 'olho' ficava debaixo dos botoes de curtir e comentar. Alem disso a pilha de tres linhas (120 / 250 / 120) violava o maximo de duas linhas da legenda que ela assumia. Corrigido: a ancora vira uma palavra veredito unica, `de olho`, em 200px (dentro da banda 200 a 260 do canon), baseline y=1000, largura cerca de 724px, terminando em x=796, livre do corredor e livre do y 1040. A frase inteira volta para a legenda queimada corrida em dois blocos, `eu fico de olho` e `no PRAZO.`, na baseline 1440 do mote A. O eco da mesma palavra em dois corpos e o mesmo dispositivo que a peca ja usa com `ainda`, entao e conceito, nao repeticao.
> - SORA MEDIUM QUEBRA O AERENDER, E O PROPRIO ROTEIRO DIZ ISSO. O item 22 da lista de producao avisa que so Regular, SemiBold e Bold resolvem no text engine e que o Medium cai em serifa. Mesmo assim os dois micro labels estavam especificados em Sora 500. Corrigido para Sora 600, com nota de que o 500 exato so volta pelo eixo `wght` da variable depois do smoke test de aerender.
> - DIRECTIONAL BLUR ESTA NA LISTA DE PROIBIDOS. O canon proibe 'blur de zoom, blur direcional' sem ressalva, e a tira de varredura usava Directional Blur vertical de 40px. Trocado por motion blur nativo do AE com shutter 180 na camada da tira. O resultado na tela e o mesmo, inclusive o efeito de esfumacar o coral nativo das telas, mas agora e borrao fisico de objeto em movimento e nao um efeito da lista negra. Nenhuma camada de tipografia da peca carrega blur.
> - LIFT DE 6% ESTOURAVA O PAPEL QUENTE PARA BRANCO PURO. A faixa do bloco 2 levava Levels com lift de 6% na luminancia. O fundo dessas telas e `#FAF8F5`, que e 250,248,245. Mais 6% clipa nos tres canais e vira `#FFFFFF`, exatamente o que a regra 1.7 proibe. Lift removido. Contra o `#15171C` a faixa ja explode sozinha, e a hairline de 3px faz a separacao.
> - CITACAO DE AUTORIDADE INEXISTENTE. O roteiro justifica a ausencia de legenda queimada no bloco 1 citando 'Manual de Magnetismo §2.6'. Varri o repositorio: esse documento nao existe. Citacao removida. A ausencia de legenda no bloco 1 continua, agora justificada pelo dispositivo que a propria peca ja usa (a ancora assume a legenda quando nao ha fala) e registrada como ressalva explicita que precisa do OK do Pedro, porque a checagem do canon e binaria nesse ponto.
> - MES FABRICADO POR CIMA DE UMA TELA REAL. O item 3 mandava cobrir o titulo do mes do card congelado com um text layer escrito `Setembro 2026`, apoiado numa conta de qual dia 14 de 2026 cai numa segunda. Isso e (a) inventar conteudo dentro de uma tela apresentada como real, (b) colocar uma data em quadro numa peca de mote A, e (c) criar uma dependencia de calendario que quebra se a veiculacao mudar de mes. E o proprio roteiro, no item 2, ja tinha proibido o mes em quadro. Resolvido sem retipar nada: o card da tira passa a ser 720 x 400 vindo do crop `y 296 a 1013`, que fica abaixo do titulo do mes (termina em y=274) e acima do `R$ 178,31` (comeca em y=1160). Verifiquei os dois na imagem. Bonus: essa janela contem a faixa de dias do bloco 6, entao o push in vira um zoom literal no topo do card congelado, com continuidade perfeita.
> - TELA DE CERTIFICADO DIGITAL NA TIRA. `mais_certificado.png` tem 'Certificado digital' como titulo e 'e-CNPJ A1 · valido ate 12/12/2027' no card. Certificado digital esta na lista de termos contratuais proibidos nestes criativos. Removida da whitelist. A tira cai de 11 para 10 telas, o passo vira 440px e a velocidade 120px por frame. Ninguem percebe uma tela a menos numa varredura de 1,1s, e o risco sai de graca.
> - LINHA DE CTA DO END CARD ABAIXO DA REGUA. Estava em 44px, e a legenda corrida do sistema e 60px. Subida para Sora 600 em 60px, `#524E48`, baselines 965 e 1040, com as duas linhas entrando em blocos separados (f521 e f531) para cada bloco respeitar o teto de 5 palavras. Largura conferida: 'eu te aviso quando abrir.' da cerca de 795px, dentro dos 880.
> - REGUA DE CITACAO FORA DA MARGEM. A hairline vertical do bloco 3 estava em x=48, e a area util comeca em x=72. Regua movida para x=72 e o texto da citacao indentado para x=120. A morfose do bloco 4 nao sofre: `ainda` ja nao estava na mesma coluna do frame 1 dentro da citacao de qualquer jeito.
> - DURACOES QUE NAO FECHAVAM EM FRAME. `f274 a f278` sao 4 frames, nao os 150ms declarados; virou f274 a f279. `freeze de 8 frames (f366 a f374)` sao 9 frames; virou f366 a f373. Corrigido tambem o build do end card, que com o botao entrando em f535 e a linha de CTA a 44px deixava um buraco de 21 frames sem legenda entre f505 e f521. Novo build: logo f513, CTA1 f521, CTA2 f531, botao f541, ignicao do `AI` em f546 intacta. Hold do botao vai para 1,967s, acima do piso de 1,8s, e a ignicao continua no mesmo frame nas duas versoes da peca.
> - GATE DE DISCO DESATUALIZADO E OTIMISTA. O roteiro declara 1,8 GB livres. Medi agora: 1,1 GB em 111 GB, 100% de uso. Numero corrigido e o gate mantido em 30 GB, com a nota de que a situacao piorou desde a escrita.
> - VARIACAO DE CORTE E BUMPER QUEBRAVAM O PISO DE HOLD DO CTA. A versao curta terminava com o botao em 1,45s e o conserto proposto so devolvia 1,82s por conta do 44px que nao existe mais. Regrade para 12,800s (384 frames) com o end card em 2,600s, o que devolve 1,80s cravados. O bumper subiu de 6,000s para 6,400s pela mesma razao.
> - Zero travessao verificado caractere a caractere no roteiro inteiro, na locucao, nas legendas, nos micro labels, nos nomes de arquivo e na copy do Meta. O unico travessao do universo desta peca e o do campo 'CNAE pretendido' da tela real, em y=2097, e confirmei na imagem que ele fica 1177px abaixo do novo corte.
> - Mascote: varri as 10 telas da tira, as duas telas de destaque e o end card com contact sheets dos crops exatos que entram em quadro. Nenhum animal, nenhuma silhueta, nenhum icone dele. A unica ilustracao que existe em quadro e um aviao de papel em `entrada.png`. A peca nao tem um unico plano de IA generativa, entao nao ha risco de alucinar bicho.
## CRIATIVO 4 · Ainda não.

| Campo | Valor |
|---|---|
| **Mote** | **A · Institucional.** Sem preço, sem rótulo de plano, sem super de condição, sem data. |
| **Tom** | Híbrido. Sóbrio no motor, com uma auto ironia no meio (a marca admitindo em público o que não faz). |
| **Persona alvo** | **B** (parceria, quer sentir que tem alguém junto). Segura a **C** porque o registro é sério e a piada nunca é da pessoa. |
| **Duração** | **20,000s · 600 frames @ 30,000fps** |
| **Formato** | 9:16 · **1080 x 1920** · 30fps · master H.264 CRF16 + áudio 48kHz |
| **Pilar de funil** | **Topo.** Interrupção e construção de confiança. Não carrega oferta, carrega caráter. |
| **CTA na tela** | `entra na lista.` / `eu te aviso quando abrir.` |
| **Botão do Meta** | `Cadastre-se` |
| **Origens usadas** | [AE] · [TELA APP] · [SVG] · [FFMPEG]. **Zero [HIGGSFIELD].** Custo de crédito: 0,00. |

---

**A ideia em uma frase.**

O anúncio abre dizendo "ainda não" na cara de quem assiste, revela no segundo 3 que essas duas palavras são de uma tela de verdade do produto recusando um cliente, e termina descobrindo que o mesmo "ainda não" vale pra própria marca, que por isso só promete a única coisa que ela pode cumprir no dia 1: ficar de olho no prazo.

---

**Por que para o dedo.**

O frame 1 é um retângulo escuro num feed claro, com duas palavras e um ponto ocupando um quarto da altura. Isso é um buraco visual antes de ser uma mensagem. E a mensagem, quando chega, é uma recusa sem alvo declarado: o cérebro não consegue resolver quem está dizendo não pra quem, e recusa é a coisa mais rara do feed inteiro, onde tudo promete. Não tem pergunta retórica, não tem saudação, não tem logo, não tem imagem. Tem menos informação do que o mínimo necessário pra classificar, e é exatamente por isso que não dá pra rolar em cima.

A retenção não é um loop de pergunta, é um loop de significado: as mesmas duas palavras trocam de dono duas vezes. No segundo 0 elas são dirigidas a quem assiste. No segundo 3 se descobre que quem foi recusado foi um cliente real, dentro do produto. No segundo 9 se descobre que elas valem pra própria marca. Quem sai antes do segundo 9 sai com a leitura errada, e a peça sinaliza isso o tempo todo sem explicar. O reforço mecânico é o segundo 12: uma tira vertical de telas reais varrendo de baixo pra cima e travando seca num freeze de 8 frames, que é reflexo óptico, não decisão de assistir. Custo honesto: abrir no dark queima o loop automático do Reels que as outras peças da leva ganham de graça. Isso está orçado no fim deste documento, com o conserto pronto se o Pedro quiser.

---

**Onde mora a alma da marca.**

A primeira pessoa está queimada em corpo grande três vezes, nunca só na voz: `eu recuso` seguido de `o que não faço bem.` nas legendas do bloco 3, `vale pra mim também.` colada nas duas palavras da virada, e `de olho` como âncora de 200px no penúltimo bloco, com `eu fico de olho` e `no prazo.` correndo na legenda por baixo. A câmera age como vigia em estado puro no bloco 5: varredura vertical rápida por dez telas terminando em parada seca com freeze de 8 frames e anel coral de 150ms, que é literalmente o bicho que corre, para em pé e trava o olhar, sem o bicho. O calendário vigiado aparece como objeto, ampliado 2,20x, e é o último quadro antes do end card. O alvo do humor é a marca admitindo em público que tem coisa que ela não faz e que ela mesma ainda não abriu, ou seja, ri de si mesma. O cliente continua herói porque quem é protegido da promessa falsa é ele. E o compromisso final é comportamental, não de resultado: vigilância, que é verificável no dia 1 de um produto que ainda não existe.

---

**Roteiro quadro a quadro.**

Grade travada em frames. Fundo dark `#15171C` com gradiente `ink-hero` nos blocos 1 a 4, papel `#FAF8F5` nos blocos 5 a 7. Margem lateral 72px. Grain 1,8% em adjustment layer no projeto inteiro, 16bpc.

| Tempo | Imagem (o que se vê) | Origem | Áudio e voz | Texto de destaque na tela | Som e trilha |
|---|---|---|---|---|---|
| **0,000 a 2,600**<br>f0 a f77 | Quadro cheio no dark, gradiente `ink-hero` (160deg, `#2A2E37` a `#15171C` a `#202433`). Nada mais em quadro: sem logo, sem label, sem legenda, sem imagem. Bloco de duas palavras empilhado, flush left em **x=72**, line height 0,95. Baseline linha 1 em **y=761**, baseline linha 2 em **y=999**, centro óptico do bloco em **y=790**. As duas palavras estão em 100% de opacidade no frame 0 (nada abaixo de 60% nos 6 primeiros frames). **f9:** o ponto final entra sozinho, 150ms, opacidade 0 a 100 e escala 88 a 100, ease out. **f30:** tracking do bloco relaxa de +1% para 0 em 250ms. **f45:** eixo `wght` de `ainda` sobe 700 para 800 em 150ms (só se o smoke test da variable passar; senão fica em 700). Push in contínuo de 100 para 103% ao longo dos 78 frames, uma direção só. | **[AE]** | silêncio de voz. Nenhuma palavra até 3,100. | `ainda`<br>Sora 700, **250px**, tracking -2%, **coral-500 `#F2643C`**<br><br>`não.`<br>Sora 700, **250px**, tracking -2%, **`#F4F1EC`** | **f9:** `tick_recusa`, tick seco de 1,2kHz com corpo em 90Hz, decay 140ms, sem cauda. É o primeiro som da peça e é evento físico, nunca palavra. Trilha **muda**. |
| **2,600 a 5,200**<br>f78 a f155 | **Corte seco.** As duas palavras somem no corte, sem fade. Entra uma **faixa clara sangrada de borda a borda**: o crop da tela real de recusa. Crop verificado na imagem: `veredito_waitlist.png`, **x 0 a 1290, y 380 a 920**, escala **0,837** (o mesmo fator de 1080 sobre 1290), resultado **1080 x 452**, posicionada em **y 400 a 852**. Em quadro: o título do veredito `Ainda não, por enquanto` e o topo do card `Atividade regulamentada`, cortando na régua divisória do card. **Sem relógio, sem disco âmbar, sem valor monetário, sem travessão.** Hairline `#2E313A` de 3px só nas bordas superior e inferior. **Sem correção de luminância:** contra o `#15171C` a faixa já lê como iluminada, e qualquer lift estoura o papel quente `#FAF8F5` para branco puro. Entrada: y +180 para 0, opacidade 0 para 100, escala 96 para 100, **400ms** ease out. Push in de 3% ao longo do bloco. | **[TELA APP]**<br>`marketing/telas-app/veredito_waitlist.png`<br>+ **[AE]** | **3,100 a 4,530**<br>"essa tela existe." | **Micro label**, x=72, baseline **y=320**:<br>`TELA REAL DO APP · LEGALIZAI`<br>Sora 600, 32px, CAPS, tracking +8%, `#8E8981`<br><br>*(o texto grande do quadro é o da própria tela, na tipografia do produto)* | **f78:** `card_land`, papel assentando, 220ms, sem reverb. **f78:** entra o stem `bass` da trilha, 22% do nível final. **f140:** micro tick de 60ms no assentar do ponto da legenda. |
| **5,200 a 8,600**<br>f156 a f257 | **Corte seco.** A faixa some no corte. Dark limpo. A frase inteira da própria tela monta em 5 linhas, flush left em **x=120**, com uma **régua vertical hairline `#2E313A` de 3px em x=72** que se desenha de cima pra baixo em 250ms (marca de citação, sem aspas, dentro da margem). Baselines **696 / 797 / 898 / 999 / 1100** (pitch 101). As palavras entram word by word, 150ms cada, opacidade 0 a 100 + y +28 a 0 + escala 92 a 100, **stagger de 70ms**, ease out. A palavra `ainda` entra **já em coral**, é a única coisa acesa numa frase cinza, e é literalmente a mesma palavra do frame 1. Push in de 3%. | **[AE]** | **5,400 a 8,730**<br>"eu recuso o que não faço bem."<br><br>Corte pro bloco 4 em f258, **4 frames antes** da última sílaba de "bem". | **Citação do produto** (papel F, ver Lista de produção), Sora 400, **84px**, `#BDB8B0`:<br>`a gente ainda não`<br>`abre esse tipo`<br>`sozinho.`<br>`e não vamos fingir`<br>`que abre.`<br><br>Dentro dela, em Sora 700: **`ainda`** em **coral-500 `#F2643C`** e **`não`** em **`#F4F1EC`** | **f156:** `quote_type`, 5 micro ticks de 40ms, um por linha, escalando 900Hz a 1,4kHz. **f156:** entra o stem `drums` em -12dB. Voz 5,9dB acima da música, constante, **sem sidechain**. |
| **8,600 a 10,800**<br>f258 a f323 | **A VIRADA.** f258: a citação sai em **fade de 250ms sem movimento** (regra de saída de frase), exceto `ainda` e `não`, que **escalam de 84px para 250px** e vão pra posição exata do frame 1 (x=72, baselines 761 e 999) em **400ms**, curva apple (influência 28 na saída, 92 na chegada), sem overshoot. O espectador vê o primeiro frame de novo. **f274 a f279:** `ainda` **apaga**, coral-500 vira `#F4F1EC` em 150ms. **f276 a f306:** a **onda circular de papel** `#FAF8F5` sobe de baixo pra cima e engole o dark. Círculo vetorial (nunca Radial Wipe), centro em (540, 2400), raio 0 a 2900px, 1000ms ease out, com **borda de ataque em `#CBC5BC` (borda forte do papel) de 12px**. Único dissolve autorizado da leva. Grain sobe pra 2,0% durante os 30 frames. Toda a tipografia existe em duas cópias, a de paleta papel matteada pelo círculo da onda, então o texto troca de cor conforme a onda passa por ele. **f311 a f316:** `ainda` **reacende** em **coral-600 `#DD4E27`**, 150ms, e vira o único coral do mundo papel. | **[AE]**<br>(porta o `45-take-t5.jsx`) | **9,000 a 10,900**<br>"vale pra mim também."<br><br>Corte pro bloco 5 em f324, **3 frames antes** da última sílaba. | `ainda`<br>Sora 700, 250px, x=72, baseline 761. **coral-500** até f274, `#F4F1EC` de f279 a f311, **coral-600** de f316 em diante.<br><br>`não.`<br>Sora 700, 250px, baseline 999. `#F4F1EC` no dark, **`#1B1E24`** depois da onda. | **f276 a f306:** `wave_swell`, ruído filtrado subindo com sub em 45Hz, 1000ms. **f306:** impacto grave curto quando a borda limpa o topo. Trilha faz swell de +2,6dB e vira pro naipe cheio (entra `melody`) em f306. |
| **10,800 a 13,400**<br>f324 a f401 | **Papel `#FAF8F5`.** f324: `ainda / não.` sai em fade de 250ms, sem movimento. **f333:** entra a **tira vertical**. Coluna única de **10 cards** de telas reais, cada card **720 x 400** (crop `x 0 a 1290, y 296 a 1013` de cada PNG, escala 0,558), card branco `#FFFFFF`, raio 48, hairline `#E3DED7` de 3px, pitch de 440px, centrada em x=540 (card de x 180 a 900, fora do corredor de ícones). A coluna sobe **3960px em 33 frames, velocidade constante (120px por frame)**, com **motion blur nativo do AE, shutter 180**, que também esfumaça qualquer coral nativo das telas e impede que ele leia como alerta. Nenhuma camada de tipografia carrega blur em nenhum ponto da peça. **f366: PARADA SECA.** Motion blur desliga. **Anel coral-600 `#DD4E27` de 8px** contornando o card parado, cheio de **f366 a f371 (150ms)** e saindo em fade até **f379 (250ms)**. **Freeze de 8 frames (f366 a f373).** O card que trava é `obrigacoes.png`. **f386:** começa o push in de 2% que atravessa o corte pro bloco 6. | **[TELA APP]** (10 telas, whitelist verificada na Lista de produção)<br>+ **[AE]** | **sem voz.** É o silêncio de propósito: o quadro do meio é onde a sobra de fala foi gasta. | **Legenda queimada** (papel), baseline y=1440:<br>`o app ainda não abriu.`<br>Sora 600, 60px, centralizada, `#1B1E24`, com **`abriu`** entrando em ink em f372 e **acendendo em coral-600 em f382**, depois do anel apagar, pra nunca dividir frame com ele. | **f333 a f366:** `whoosh_varredura`, ruído band pass com pitch subindo, 1100ms. **f366:** `impacto_freeze`, thump de 55Hz com decay de 180ms + tick agudo de 1 frame. **f366 a f373:** trilha inteira **duca 9dB** durante o freeze e volta. |
| **13,400 a 17,000**<br>f402 a f509 | **f402 a f414:** o card parado **aproxima**, 400ms, curva apple. Escala de 0,558 pra **1,181**, que é **exatamente 2,20x** a régua de "tela inteira em 1500px de altura". Reenquadra na **faixa de dias**, que já vive dentro do card congelado: crop `obrigacoes.png` **x 6 a 920, y 296 a 600**, resultado **1080 x 359 sangrado de borda a borda**, posicionado em **y 400 a 759** (a mesma faixa vertical do bloco 2, e isso rima). Em quadro, verificado na imagem: a linha **Seg a Sex**, os pills **14 a 18** com o **16 em coral nativo do app** (fill sólido, texto branco, numeral em cerca de 99px, dentro da AA), e o **ponto de prazo sob o 15**. Hairline `#E3DED7` de 3px nas bordas superior e inferior da faixa. **Nenhum título de mês e nenhum valor monetário entram em quadro:** o `Julho 2026` termina em y=274, 22px acima do corte, e o `R$ 178,31` mora em y=1160, 560px abaixo dele. Push in de 3% até o fim do bloco. | **[TELA APP]**<br>`marketing/telas-app/obrigacoes.png`<br>+ **[AE]** | **13,850 a 16,710**<br>"eu fico de olho no prazo."<br><br>**16,710 a 17,000: silêncio de 290ms.** | **Micro label**, x=72, baseline **y=320**:<br>`CALENDÁRIO DE OBRIGAÇÕES`<br>Sora 600, 32px, CAPS, +8%, `#736E67`<br><br>**Âncora**, palavra veredito única, flush left x=72:<br>**`de olho`** Sora 700, **200px**, `#1B1E24`, baseline **y=1000** (largura cerca de 724px, termina em x=796, livre do corredor de ícones do Instagram). Entra em f440, 400ms, sobre a sílaba tônica de "olho". | **f402:** `snap_lente`, click curto de foco, 90ms. SFX de tick de calendário de 50ms em cada onset de palavra da legenda. Trilha em suspensão, sem percussão, só `instruments` e `melody`. **f501: MUDO TOTAL.** |
| **17,000 a 20,000**<br>f510 a f599 | **END CARD.** f510: corte seco, faixa e tipografia somem, papel `#FAF8F5` limpo por 3 frames. **f513:** o lockup entra, 400ms, opacidade 0 a 100 + y +48 a 0 + escala 92 a 100, ease out. Largura 640px, centrado em x=540, centro óptico do lockup em **y=760**. Entra com o `ai` repintado em `#1B1E24`. **f521:** primeira linha de CTA entra, 250ms. **f531:** segunda linha de CTA entra, 250ms. **f541:** botão entra, 250ms (escala 96 a 100, y +32 a 0). Botão **620 x 140**, raio 36, fill **coral-600 `#DD4E27`**, centrado, y 1110 a 1250. **f546:** o **`AI` acende em coral-500 `#F2643C`** em 150ms, com `--gradient-brand-glow` subindo junto até 40%. **f570:** o glow assenta de 40% pra 26% em 250ms, uma vez só, sem pulso. Hold do botão em quadro: **1,967s**. Último frame em papel, **sem fade pro preto**. | **[SVG]**<br>`identidade/logos/legalizai-logo-horizontal.svg`<br>+ **[AE]** | **Slot de 0,800s: f525 a f549.**<br>Com a frase: "Vai, legaliza aí.", com a tônica de "aí" em **f546**.<br>Sem a frase: o slot vira hold do logo. **A ignição do `AI` fica em f546 nas duas versões**, então não existe retiming. | **Linha de CTA**, centralizada, Sora 600, **60px**, `#524E48`, baselines 965 e 1040:<br>`entra na lista.` (f521)<br>`eu te aviso quando abrir.` (f531)<br><br>**Rótulo do botão:**<br>`Cadastre-se`<br>Sora 700, **56px**, `#FFFFFF` sobre coral-600 (56px é o piso que faz o par bater AA) | **f510:** `pop_papel`, pop macio de 120ms. **f546:** `sino_marca`, um toque único e curto no acendimento do `AI`. É o sino que repete nas 6 peças da leva. Trilha resolve e sustenta até f599, sem fade out. Master **-14 LUFS, -1,5 dBTP**, dual mono 48kHz. |

---

**Legenda queimada.**

Sistema: Sora 600, **60px**, line height 1,25 (75px), tracking -1%, centralizada, máximo 2 linhas de 880px, máximo 5 palavras por bloco. **Última baseline y=1440**, primeira baseline de bloco de 2 linhas y=1365 (régua de mote A, sem super de condição). Bloco cresce pra cima. Modo `duasCores` ligado: só texto e palavra forte, sem terceira cor. Onsets de palavra vêm do WhisperX sobre a locução, snapados em 1/30s, nunca número solto.

**Bloco 1 (f0 a f77): a âncora assume a legenda.** Não existe fala em quadro pra legendar, e o hook já é âncora display em 250px, 100% legível com o som desligado desde o frame 0. Legendar a mesma palavra duas vezes destrói o hook. É o mesmo dispositivo que a peça usa no bloco 6 e no end card. **Isso é uma exceção declarada à checagem "legenda do primeiro ao último quadro" e está registrada nas Ressalvas, aguardando OK do Pedro.** Da f78 em diante ela roda sem buraco maior que 11 frames até o último frame.

```
[f93]    essa tela EXISTE.
         (1 linha · fundo dark · "existe" em coral-500 #F2643C)

[f162]   eu recuso
         (1 linha · fundo dark · sem palavra forte, é o setup)

[f186]   o que não faço BEM.
         (1 linha · fundo dark · "bem" em #F4F1EC Bold, SEM cor)

[f270]   vale pra mim TAMBÉM.
         (1 linha · atravessa a onda e troca de paleta no meio
          da frase · "também" em #1B1E24 Bold, SEM cor)

[f336]   o app ainda não ABRIU.
         (1 linha · fundo papel · sem voz, onsets à mão em
          f336 f342 f348 f356 f372 · "abriu" entra em ink e
          acende em coral-600 #DD4E27 em f382, depois do anel)

[f416]   eu fico de olho
         (1 linha · papel · #1B1E24 · sem palavra forte, porque
          "de olho" já vai virar âncora de 200px em f440)

[f462]   no PRAZO.
         (1 linha · papel · "prazo" em #1B1E24 Bold, SEM cor,
          porque o pill coral nativo do app já é o foco do quadro)

[f521]   entra na lista.
[f531]   eu te aviso quando abrir.
         (dois blocos separados no tempo, ambos permanecem em
          quadro · Sora 600, 60px, centralizada, #524E48 · sem coral)
```

**Por que "bem", "também" e "prazo" não acendem.** Regra de simultaneidade: um foco coral por frame no palco. No bloco 3 e no 4 a palavra `ainda` está acesa em corpo de 84px e 250px. No bloco 6 o pill `16` do app está em coral nativo, ampliado 2,20x. Nesses três casos a palavra forte da legenda fica em peso, não em cor. É uma perda de ritmo assumida, e é a decisão certa: quem manda no quadro é o palco.

**Acendimentos de coral no palco:** dois, contados de novo do zero. **(1)** a palavra `ainda`, palavra veredito da peça, que nasce coral-500 no dark, apaga na onda e reacende em coral-600 no mundo papel. **(2)** o anel do freeze, 150ms cheios mais 250ms de saída. **A borda de ataque da onda NÃO é mais coral**, virou `#CBC5BC`, justamente porque um anel coral atravessando 2900px em 1000ms seria coral em movimento rápido, que o canon proíbe, e seria um terceiro acendimento não orçado. O `AI` e o fill do botão do end card não contam. O pill `16` e os pontos de prazo dentro do crop do calendário são UI nativa do produto, não acendimento nosso.

---

**End card.**

```
[SVG]  legalizai-logo-horizontal.svg  ·  640px de largura
       centro óptico do lockup em y=760
       "ai" entra em #1B1E24 e acende em coral-500 #F2643C no f546

[AE]   entra na lista.               (entra em f521)
       eu te aviso quando abrir.     (entra em f531)
       Sora 600 · 60px · #524E48 · centralizado · baselines 965 e 1040

[AE]   BOTÃO  620 x 140 · raio 36 · fill coral-600 #DD4E27 · y 1110 a 1250
       entra em f541 · hold de 1,967s
       Cadastre-se
       Sora 700 · 56px · #FFFFFF · centralizado
```

Fundo papel quente `#FAF8F5`. Sem sombra, sem stroke, sem glow, com a única exceção do `--gradient-brand-glow` atrás do `AI`. Frase falada opcional "Vai, legaliza aí." no slot de f525 a f549. **A peça funciona idêntica com e sem ela, sem retiming e sem reescrita**, porque a ignição do `AI` está travada em f546 nos dois casos e o slot silencioso vira hold com o CTA e o botão entrando dentro dele.

---

**Copy do post no Meta.**

**Primary text**
```
Tem empresa que a gente ainda não abre sozinho. Em vez de fingir que abre, o app fala isso na cara.
E o ainda não vale pra mim também. O app não abriu, e eu não vou fingir que abriu.
Entra na lista. Eu fico de olho no prazo.
```

**Headline** (24 caracteres)
```
Eu fico de olho no prazo
```

**Description**
```
Lista de espera da Legalizai. Contabilidade digital, com 22 anos de escritório contábil em Belo Horizonte atrás.
```

Zero travessão. Zero preço. Zero rótulo de plano. Zero data. Zero concorrente. Zero promessa de resultado.

---

**Lista de produção.**

| # | Asset | Origem | Estado | Como produzir |
|---|---|---|---|---|
| 1 | **Crop da tela de recusa** | [TELA APP] | **JÁ EXISTE** · `marketing/telas-app/veredito_waitlist.png` | Crop `x 0 a 1290, y 380 a 920`, escala 0,837, resultado 1080 x 452. **VERIFICADO NA IMAGEM:** em quadro entram o título `Ainda não, por enquanto` (glifos em y 433 a 482) e o topo do card `Atividade regulamentada` (borda em y 591, título em y 678, corpo em y 766 e 835), cortando na régua divisória em y 923. **Fora de quadro:** o disco âmbar com relógio (y 203 a 378), que sai por causa da checagem de escassez e da regra de cor de estado; e o travessão real da tela, que está no campo `CNAE pretendido` em y 2097, ou seja 1177px abaixo do corte. Não existe valor monetário nessa tela. **Nenhuma correção de luminância:** o papel quente `#FAF8F5` é o ponto de branco final, e qualquer lift clipa em `#FFFFFF`. |
| 2 | **Faixa de dias do calendário** | [TELA APP] | **JÁ EXISTE** · `marketing/telas-app/obrigacoes.png` | Crop `x 6 a 920, y 296 a 600`, 914 x 304, escala 1,181 (= 2,20x exatos), resultado 1080 x 359. **VERIFICADO NA IMAGEM, e este é o conserto do erro mais grave do roteiro anterior:** a linha da semana ocupa de x=73 (pill do 14) a x=1216 (pill do 20), e o corte original em x=930 caía **dentro da semana**, entre o pill de Sex (termina em x=877) e o de Sáb (começa em x=927), decepando Sáb e Dom. O corte novo em x=920 fecha no vão, e o que entra é a **semana útil inteira, Seg a Sex**, que é o registro certo pra prazo. Em quadro: rótulos de dia (42px na origem, 50px em quadro), pills 14 a 18, o 16 em coral sólido com numeral branco de 99px, e o ponto de prazo sob o 15 (x 302, y 559). Fora de quadro: `Julho 2026` (termina em y 274) e `R$ 178,31` (começa em y 1160). |
| 3 | **Card do freeze (bloco 5)** | [TELA APP] | **JÁ EXISTE** · o mesmo `obrigacoes.png` | Crop `x 0 a 1290, y 296 a 1013` a 0,558, resultado 720 x 400. **Nenhum retype, nenhum text layer por cima, nenhuma data inventada.** A janela nasce 22px abaixo do fim do título do mês e 147px acima do início do `R$ 178,31`, os dois medidos na imagem. Em quadro: a linha Seg a Dom com os pills, o painel `Obrigações do mês` e o card `Declaração mensal · A gente entrega, nada a fazer` com o check verde `#17A06A` (que é estado "feito", uso canônico). **Bônus estrutural:** essa janela contém a faixa do item 2, então o push in do bloco 6 é literalmente um zoom no terço superior do card congelado, com continuidade perfeita e zero corte de reenquadramento. |
| 4 | **Whitelist da tira de varredura (10 telas)** | [TELA APP] | **JÁ EXISTEM** · todas em `marketing/telas-app/` | Ordem de passagem, de baixo pra cima: `entrada.png` · `gate.png` · `veredito_atende.png` · `dossie_nome.png` · `painel.png` · `home-dia1.png` · `mais_declaracoes.png` · `mais_em-dia.png` · `avisos.png` · `obrigacoes.png`. **Regra dura da tira: todo card é o crop `x 0 a 1290, y 296 a 1013` da tela, a 0,558, resultando 720 x 400.** Pitch 440px, deslocamento total 3960px em 33 frames (120px por frame). **QC já rodado por mim em contact sheet dos crops exatos:** nenhum `R$` em quadro em nenhuma das dez, nenhum animal, nenhuma silhueta, nenhuma ilustração de mascote (a única ilustração existente é um avião de papel em `entrada.png`). Refazer o contact sheet antes do build se a whitelist mudar. |
| 5 | **Telas excluídas e o porquê** | [TELA APP] | n/a | `splash.png` **fora**, porque é coral cheio e numa varredura vira flash coral de transição, que o canon proíbe duas vezes (flash e fill acima de 35% do quadro). `mais_certificado.png` **fora**, porque o título da tela é `Certificado digital` e o card diz `e-CNPJ A1 · válido até 12/12/2027`: certificado digital está na lista de termos contratuais proibidos nestes criativos, e mesmo ilegível a 120px por frame não vale o risco. `mais_documentos.png` **fora**, porque exibe `Contrato social` e `Certificado da condição de MEI/ME`, ou seja termo contratual e rótulo de plano numa peça de mote A. Fora também: `plano`, `mais_plano`, `revisar`, `pagamento`, `migrar_plano`, `termo`, `contrato`, `notas`, `emitir`, `impostos*`, `pro-labore`, `mais_relatorios`, `mais_servicos` (valor monetário ou termo contratual). `veredito_waitlist` fora da tira porque já é o bloco 2. |
| 6 | **Template de estrutura 9:16** | [AE] | **NOVO** · deriva de `marketing/filme/escalada/jsx/10-estrutura.jsx` | `10-estrutura-9x16.jsx`: W=1080, H=1920, 600 frames, comps `B1` a `B7` aninhadas nas fronteiras f0/f78/f156/f258/f324/f402/f510. `GUIA-safe` vira retângulo **864 x 1440 centrado em y=840**, mais um segundo guia do corredor de ícones do Instagram (`x 880 a 1080, y 1040 a 1780`). Helpers `findItem/removeItem/findOrCreateFolder` migram sem tocar. 6 a 10h, uma vez só, e serve as 6 peças. |
| 7 | **Tokens e `_CONTROLE`** | [AE] | **JÁ EXISTE, 100% direto** · `jsx/00-tokens.jsx` + `tools/gera-tokens.mjs` | O `00-tokens.jsx` independe de resolução. No `gera-tokens.mjs` trocar só `filme.master` para `{w:1080,h:1920,dur:600}` e reescrever o bloco `lettering`. **Nenhum hex digitado à mão na comp:** tudo lê os Color Controls nomeados do `_CONTROLE`, inclusive o `#CBC5BC` novo da borda da onda. |
| 8 | **Rig de lettering word by word** | [AE] | **JÁ EXISTE, precisa de 3 linhas** · `jsx/32-lettering.jsx` | Linha 17 está com `var W = 3840, H = 2160, FPS = 30;` hardcoded. Trocar por leitura de `takeComp.width / takeComp.height`, movendo o lookup do comp pra antes. Bloco desta peça:<br>`$.global.LETTERING_OPCOES = { W:1080, H:1920, FPS:30, tema:"dark", duasCores:true, tam:60, larguraMax:880, xc:540, y1:1440, y2a:1365, y2b:1440, gap:11 };`<br>Nos blocos 5 a 7 o `tema` vira `"papel"`. O resto do rig roda sem tocar. |
| 9 | **Papel novo: "F · Citação do produto"** | [AE] | **NOVO** · 1h | Sora 400 (Regular), **84px**, `#BDB8B0`, flush left **x=120**, line height 1,20, com palavras marcadas em Sora 700 (`ainda` coral-500, `não` `#F4F1EC`). Régua vertical hairline `#2E313A` de 3px em **x=72**, dentro da margem. Fica deliberadamente entre a legenda (60px) e a âncora (200px+) pra o olho ler como um terceiro falante, o produto. Régua de largura conferida: a linha mais longa é `a gente ainda não`, cerca de 743px, dentro dos 936. Acrescentar ao sistema de lettering da leva. |
| 10 | **Onda circular de papel** | [AE] | **JÁ EXISTE como conceito** · `jsx/45-take-t5.jsx` (a virada do T5) | Porte pra 9:16: círculo shape vetorial (**nunca** Radial Wipe, por causa de banding), centro (540, 2400), raio 0 a 2900px em 1000ms ease out, **borda de ataque em `#CBC5BC` de 12px, NÃO em coral** (o `45-take-t5.jsx` original usa `CORAL600` na mancha da virada; aqui isso vira borda forte de papel, porque coral em movimento rápido lê como alerta e estouraria o teto de acendimentos). Grain subindo pra 2,0% durante os 30 frames, projeto em 16bpc. |
| 11 | **Duplicata de paleta matteada pela onda** | [AE] | **NOVO** · 1h | Toda camada de tipografia do bloco 4 existe em duas cópias, uma na paleta dark e outra na paleta papel, com o **círculo da onda como alpha matte** na cópia papel. É o que faz a legenda e a âncora trocarem de cor no meio da frase, conforme a onda passa por elas. |
| 12 | **Tira de varredura com blur físico** | [AE] | **NOVO, mas trivial** | **Nada de Directional Blur:** o efeito está na lista de proibidos do canon. Usar **motion blur nativo do AE, shutter angle 180**, ligado na camada da precomp da tira e no switch de motion blur da comp. A 120px por frame o borrão físico é maior que os 40px do efeito e não é um efeito da lista negra. Ele também cumpre a função de esfumaçar o coral nativo das telas. Motion blur desliga no f366, junto com a parada. |
| 13 | **Freeze com anel coral** | [AE] | **JÁ EXISTE como conceito** · o freeze do T2 do escalada | Stroke coral-600 de 8px acompanhando o retângulo arredondado do card (720 x 400, raio 48), **cheio de f366 a f371 (150ms) e saindo em fade até f379 (250ms)**. Nunca 1 frame: 1 frame lê como piscada, e piscada é proibida. Helper `rrect()` do `20-precomps.jsx` faz o retângulo. |
| 14 | **Repintura do `ai` do wordmark** | [AE] | **JÁ EXISTE, direto** · `jsx/53-lettering-t8-cores.jsx` | Percorre precomp recursivamente e repinta por critério ASCII, imune a acento e encoding. Aqui: entra com o `ai` em `#1B1E24` e reverte pro coral nativo `#f2643c` do SVG no f546. |
| 15 | **Logo master** | [SVG] | **JÁ EXISTE** · `identidade/logos/legalizai-logo-horizontal.svg` | viewBox 659,73 x 130, tricolor, `ai` já nasce coral. É o único que permite o acendimento sem recortar path. **Nunca usar o lockup de `legalizei-logo-app-fundo-solido.svg`**, cujo wordmark interno é o antigo. |
| 16 | **End card, rota barata** | [FFMPEG] + [AE] | **JÁ EXISTE** · `marketing/vinheta/out/vinheta-9x16-4k60-v2.mp4` | Recortar os últimos 2,5s, conformar 2160x3840@60 para 1080x1920@30 (decimação 2:1 limpa, sem judder), e montar a linha de CTA e o botão por cima em AE. **Cerca de 1h.** Rota recomendada pra o piloto. |
| 17 | **End card, rota canônica** | [AE] | **NOVO** · 4 a 6h, uma vez só | Construir no AE em 1080x1920@30 pra as 6 peças compartilharem o mesmo objeto, com o mesmo hold de 1,967s e a mesma ignição em f546. Recomendado depois que o Pedro aprovar o piloto. |
| 18 | **Locução** | [NOVO] | **NOVO** · depende do Pedro | ElevenLabs Multilingual v2, **23 palavras** com o fecho, 20 sem. Guia de fraseado em `marketing/audio/Narração/narracao-elevenlabs-escalada.md`: uma ideia por respiração, palavra de peso no fim. **Não há chave de API no repo.** Plano B verificado: Voiceover da Higgsfield a 1,35 créditos por trecho, ou seja 5 trechos custam 6,75 dos 96,62 créditos. |
| 19 | **Word sync** | [AE] | **JÁ EXISTE, direto** · `tools/fase1-processa.py` + `tools/fase3-gera-legendas.py` | O `fase1` roda WhisperX e emite os onsets. O `fase3` casa o texto de exibição com os tokens, marca `peso` e `coral`, **valida travessão e valida contagem de coral por bloco**, e emite `31-legendas-data.jsx`. As duas validações ficam como estão, são regra de marca. **Acrescentar uma terceira: reprovar bloco com mais de 5 palavras**, que é a validação que teria pegado o `eu recuso o que não faço bem.` numa linha só. Só trocar o dicionário `LINHAS` e o `CORAL`. |
| 20 | **SFX (8 peças)** | [NOVO] | **NOVO** · 3 a 5h | `tick_recusa` · `card_land` · `quote_type` (5 ticks) · `wave_swell` · `whoosh_varredura` · `impacto_freeze` · `pop_papel` · `sino_marca`. Sintetizar em numpy, mesma técnica dos 95 SFX do v104 (o script original viveu no scratchpad e sumiu, a técnica está documentada no CHANGELOG). Alternativa: `marketing/pipeline/sfx.mjs` baixando do Freesound. |
| 21 | **Trilha** | **JÁ EXISTE** | `marketing/filme/escalada/audio/Trilha/ES_A Step Ahead - Experia.zip` (**com stems**, e a pasta `audio/Trilha/stems` já existe) | Envelope por camada, sem sidechain (decisão do Pedro): música 5,9dB abaixo da voz, constante, com swell pontual de +2,6dB na onda. `bass` entra em f78, `drums` em f156, `melody` em f306. Duck de 9dB por 8 frames no freeze. **Mudo total de f501 a f509.** |
| 22 | **Fonte** | **JÁ EXISTE** | Sora variable registrada em HKLM (não está em `C:\Windows\Fonts`, está registrada por usuário; confirmar antes do build) | **Só Regular, SemiBold e Bold resolvem no text engine. O Medium (500) cai em serifa e quebra o aerender.** Por isso **os dois micro labels desta peça estão em Sora 600**, não em Sora 500 como manda a tabela do canon, e o 800 do hook só entra pelo eixo `wght` da variable **depois de um smoke test de aerender**. Se o smoke test passar, o micro label pode voltar pro `wght` 500 exato pelo eixo. Se falhar, entrega em 700 com tracking -2%, sem reescrever nada. Se o AE cair em fallback, o build tem que falhar alto, não renderizar. |
| 23 | **Render** | n/a | **BLOQUEIO ABERTO E PIOR DO QUE O DECLARADO** | 600 frames em 1080x1920. Estimativa a partir dos 383 logs reais do escalada: **4 a 7 minutos** de aerender pra esta peça. Obrigatório: `-mfr OFF 100`, saída em **sequência TIFF com alfa em chunks de 40 frames** e ffmpeg convertendo e apagando incremental (o encoder H.264 do MediaCore está quebrado nesta máquina), validação por `count_frames` no MP4 e nunca contando TIFs. **Gate zero: medi o disco agora e são 1,1 GB livres em 111 GB, 100% de uso, não os 1,8 GB do roteiro anterior. Nada roda até chegar em 30 GB.** |

---

**Contagem de palavras faladas.**

| Bloco | Fala | Palavras | Duração a 2,1 p/s | Janela alocada | In / Out |
|---|---|---|---|---|---|
| 1 | (silêncio) | 0 | 0,000s | 2,600s | f0 a f77 |
| 2 | "essa tela existe." | **3** | 1,429s | 2,600s | 3,100 a 4,530 |
| 3 | "eu recuso o que não faço bem." | **7** | 3,333s | 3,400s | 5,400 a 8,730 |
| 4 | "vale pra mim também." | **4** | 1,905s | 2,200s | 9,000 a 10,900 |
| 5 | (silêncio deliberado) | 0 | 0,000s | 2,600s | sem voz |
| 6 | "eu fico de olho no prazo." | **6** | 2,857s | 3,600s | 13,850 a 16,710 |
| 7 | "Vai, legaliza aí." (opcional) | **3** | slot fixo de 0,800s | 3,000s | 17,500 a 18,300 |
| | **Corpo (blocos 2 a 6)** | **20** | **9,524s** | | |
| | **Total com o fecho** | **23** | | | |

**Checagem contra a régua.** O corpo tem 20 palavras faladas em 9,524s de fala pura, ou seja exatamente **2,10 palavras por segundo**, a régua conservadora, por construção. A janela de voz vai de 3,100 a 16,710, que são **13,610s**, e a taxa média incluindo as pausas é de **1,47 palavra por segundo**. Sobra de **4,086s**. Toda ela foi gasta no quadro do meio: os 2,600s mudos do bloco 5 (a varredura e o freeze, que são visuais puros e não precisam de voz) e os 290ms de silêncio antes do end card. **Nada da sobra foi gasto no hook nem no CTA**, conforme a régua manda. A divisão da legenda do bloco 3 em dois blocos não muda nada da fala, só do lettering.

Recado pra locução: 5 respirações, cada uma com a palavra de peso no fim ("existe", "bem", "também", "abriu", "prazo"). Nenhuma frase começa com saudação, com o nome da marca, com "você sabia" ou com "se você". A primeira palavra falada da peça entra em 3,100, ou seja **93 frames depois do primeiro som**, que é físico.

---

**Variação de corte.**

**Versão curta · 12,800s (384 frames).** Pra teste A/B contra a de 20s no mesmo conjunto de anúncio.

| O que sai | Quanto economiza | O que se perde |
|---|---|---|
| **O bloco 3 inteiro** (a citação de 5 linhas do produto retipada em AE) e a fala "eu recuso o que não faço bem." | **3,400s** | A auto acusação da marca, que é o alvo do humor. O argumento sobrevive porque o crop do bloco 2 já mostra o produto recusando com as palavras dele. Perde caráter, não perde clareza. |
| **600ms do bloco 1** (hook de 2,600 pra 2,000) | 0,600s | Nada, se o micro evento do ponto continuar em f9. O hook fica mais seco. |
| **800ms do bloco 2** (a cauda de hold depois de "essa tela existe.") | 0,800s | Só respiro. |
| **1,000s da varredura** (bloco 5 de 2,600 pra 1,600, tira de 10 cards pra 7) | 1,000s | Nada de argumento. O freeze e o anel ficam intactos com os mesmos 150ms mais 250ms, que é o que segura o olho. |
| **1,000s do bloco 6** (a âncora entra 400ms antes e o hold no fim encurta) | 1,000s | Só respiro. O silêncio de 290ms antes do end card **fica**, é inegociável. |
| **400ms do end card** (3,000 pra 2,600) | 0,400s | Nada. O end card comprimido tem 78 frames e o botão entra em +24, o que devolve **1,80s cravados** de hold, exatamente o piso. Logo em +3, CTA1 em +8, CTA2 em +16, botão em +24, ignição do `AI` em +32. **A ignição continua sendo o mesmo evento relativo, então a versão com e sem a frase falada continua não precisando de retiming.** |

Nova grade: **2,000 · 1,800 · 0 · 2,200 · 1,600 · 2,600 · 2,600 = 12,800s.** Fala: 13 palavras em 6,190s de fala pura, dentro de uma janela de 8,4s. Continua em 2,1 palavras por segundo.

**Bumper de 6,400s (192 frames), opcional.** Só o hook e a virada, sem end card completo: bloco 1 (2,000s) + bloco 4 comprimido (2,000s, com a onda em 700ms, ou seja 21 frames exatos) + logo, CTA e botão (2,400s, que é o mínimo pra o botão manter 1,80s de hold). Fala única: "vale pra mim também." Serve pra retargeting de quem já viu a peça longa e pra dar variância de formato ao conjunto.

---

**Ressalvas e pendências.**

Seis pontos que não têm conserto sem custo, ou que dependem de decisão que não é minha. Estão aqui na cara, não escondidos no meio do documento.

1. **Legenda queimada ausente no bloco 1 (f0 a f77).** A checagem de marca é binária: legenda do primeiro ao último quadro, sem buraco. Aqui a âncora display de 250px assume esse papel, porque não existe fala nenhuma nesses 2,6s e legendar em 60px a mesma palavra que já está em 250px mataria o hook. É o mesmo dispositivo que a peça usa no bloco 6 e no end card, então é consistente internamente. **Isso precisa de OK explícito do Pedro.** Registro também que o roteiro anterior justificava isso citando um "Manual de Magnetismo §2.6": varri o repositório inteiro e **esse documento não existe**. A citação foi removida.

2. **Durações macro fora da régua 150 / 250 / 400.** A onda de papel roda 1000ms (30 frames exatos) e a varredura roda 1100ms (33 frames exatos). A régua do sistema cobre motion de elemento, não transição de cena, e os dois valores são múltiplos exatos de 1/30s, mas a checagem de motion é binária e diz "nenhuma duração fora da régua". Se o Pedro quiser régua literal, a onda cai pra 800ms (24 frames) e a varredura pra 1000ms (30 frames), custando 5 frames no bloco 4 e 3 no bloco 5, que saem do hold e não do argumento.

3. **A LP.** A linha de CTA promete `eu te aviso quando abrir.` Essa é a pendência aberta número 2 do brief: a landing page da lista de espera precisa cumprir exatamente essa mecânica, avisar quando abrir, antes da peça ir ao ar. É promessa de comportamento, que é a única classe de promessa que esta campanha pode fazer, mas ela ainda é uma promessa. E aqui ela é mais dura que nas outras peças, porque é a única coisa que a peça promete.

4. **O loop do Reels.** A peça abre no dark e fecha no papel, então o reinício automático do Reels tem uma emenda visível. Isso é o preço do hook, e o hook vale o preço. **Se o Pedro quiser o loop:** trocar os últimos 8 frames do end card (f592 a f599) por um corte seco pro quadro dark do frame 1, com `ainda / não.` em 250px, sem CTA. Custa 8 frames de hold do botão (sobra 1,70s, abaixo do piso de 1,8s), então esse conserto só entra junto com a compressão de entrada descrita na versão curta. Não fiz por padrão porque a lei de hold do CTA é mais cara de quebrar do que o loop.

5. **Micro label em Sora 600 em vez de Sora 500.** A tabela de lettering do canon manda Sora 500 no micro label, mas o Medium não resolve no text engine desta máquina e derruba o aerender. Fica em 600 até o smoke test da variable passar. Se passar, volta pro 500 exato pelo eixo `wght` sem tocar em mais nada.

6. **Gate de disco.** 1,1 GB livres em 111 GB, 100% de uso, medido hoje. O roteiro anterior declarava 1,8 GB. Nada renderiza antes de 30 GB livres, e a situação está piorando, não melhorando.

---

**Auditoria do guardian.**

Verificado item a item contra a régua de marca, o brief da campanha, o ADR e os assets reais na máquina. **Verdicto: aprovado com correção.** A ideia central sobreviveu inteira. Nenhum corte foi feito pra ficar seguro.

**O que passou limpo, sem tocar.**

- **Mascote: zero.** Nenhum corpo, rosto, pata, cauda, silhueta, sombra, reflexo, boneco ou ícone dele em nenhum frame. Não confiei no roteiro: montei contact sheets dos crops exatos das doze telas que entram em quadro e olhei um por um. A única ilustração existente é um avião de papel em `entrada.png`. E a peça não tem um único plano de IA generativa, então não há como alucinar um bicho.
- **A peça funciona sem o mascote.** Ela não passa a existir com ele, ela piora: a admissão de falha em 1ª pessoa é mais forte sem um rosto simpático amortecendo.
- **A alma está lá, e não é motion design frio.** 1ª pessoa queimada em corpo grande três vezes, admissão de falha própria, instinto de vigia virado comportamento de edição (a varredura, a parada seca, o calendário vigiado), alvo do humor na própria marca, cliente como herói.
- **Travessão: zero.** Verificado caractere a caractere em roteiro, locução, legendas, micro labels, super, nomes de arquivo e copy do Meta. O único travessão do universo desta peça vive no campo `CNAE pretendido` da tela real, em y=2097, e confirmei na imagem que ele fica 1177px abaixo do corte.
- **Mote A limpo:** sem preço, sem rótulo de plano, sem super de condição, sem data, sem cobertura geográfica, sem termo contratual, sem garantia, sem escassez, sem countdown, sem contador de vaga.
- **`ainda` em coral é autorizado por nome:** a lista fechada do canon cita literalmente `ainda` como exemplo de palavra veredito. E a peça acende o `ainda`, não o `não`, ou seja o coral marca o "por enquanto", não a recusa. Isso é exatamente certo e não foi tocado.
- **Concorrente: zero.** Nenhum nome, cor, logo, tipografia, layout ou comparação implícita.
- **Higgsfield: zero planos, custo 0,00 crédito.** A peça inteira é [AE], [TELA APP], [SVG] e [FFMPEG], com origem marcada em todos os planos.
- **A peça funciona idêntica com e sem "Vai, legaliza aí."**, sem retiming e sem reescrita, em todas as três versões (20s, 12,8s e bumper).
- **CTA na tela**, botão `Cadastre-se`, hold acima do piso, um CTA só, uma coisa vendida só.
- **Aritmética de frames conferida:** 78 + 78 + 102 + 66 + 78 + 108 + 90 = 600. Fecha.
- **Todos os assets citados existem:** as doze telas, os seis jsx portados, o SVG master, o zip da trilha com stems, a vinheta 9:16, o ffmpeg. Conferido no disco.

**O que foi corrigido, em ordem de gravidade.**

1. **Crop do bloco 6 decepava a semana.** `x 16 a 930` cortava entre Sex e Sáb. Corrigido pra `x 6 a 920`, semana útil inteira, mesma escala 2,20x.
2. **Relógio âmbar em quadro no bloco 2.** Crop mudou pra `y 380 a 920`. Sai o relógio, entra o título `Ainda não, por enquanto`, que é a virada de sentido do hook, agora dominante.
3. **Terceiro acendimento de coral não contado** (o anel da onda), que ainda por cima era coral em movimento rápido. Borda de ataque virou `#CBC5BC`.
4. **Anel do freeze em 1 frame** lia como piscada. Virou 150ms cheios mais 250ms de saída, com o acendimento de `abriu` deslocado pra f382 pra não dividir frame.
5. **Bloco de legenda com 7 palavras.** Dividido em dois.
6. **Âncora do bloco 6 invadia o corredor de ícones do Instagram** e tinha três linhas onde o teto é duas. Virou palavra veredito única em 200px, com a frase inteira voltando pra legenda corrida.
7. **Sora 500 nos micro labels**, contra o aviso do próprio roteiro de que Medium quebra o aerender. Virou 600.
8. **Directional Blur**, que está na lista de proibidos. Virou motion blur nativo com shutter 180.
9. **Lift de 6%** estourava o papel quente pra branco puro. Removido.
10. **Citação de autoridade inexistente** ("Manual de Magnetismo"). Removida e substituída por ressalva honesta.
11. **Mês fabricado por cima de tela real.** Eliminado por reenquadramento, com ganho de continuidade.
12. **Tela de certificado digital e tela de contrato social na tira.** Removidas, tira de 11 pra 10.
13. **Linha de CTA em 44px** abaixo da régua e com buraco de 21 frames na legenda. Subida pra 60px, build do end card retimado, hold do botão em 1,967s.
14. **Régua de citação em x=48**, fora da margem. Movida pra x=72.
15. **Durações que não fechavam em frame** (f274 a f278, freeze de 8 frames em 9 frames). Snapadas.
16. **Gate de disco desatualizado.** 1,1 GB, não 1,8 GB.
17. **Versão curta e bumper quebravam o piso de hold do CTA.** Regradas pra 12,800s e 6,400s.