<!-- gerado pelo workflow legalizai-6-criativos-v2 em 24/08/2026 -->
<!-- conceito produto-1 | veredito do guardian: aprovado com correcao -->

> **Correções aplicadas pelo guardian:**
> - MASCOTE: nenhuma ocorrencia. Zero corpo, rosto, pata, cauda, silhueta, sombra, reflexo ou icone. Zero planos de IA generativa na peca, logo zero risco de alucinar um animal. Confirmei que o PRE-mascote existe em 20-precomps.jsx linhas 112 a 123 e corrigi a instrucao de delecao, que apontava pro arquivo errado (10-estrutura.jsx). Uma instrucao de delecao que aponta pro arquivo errado e uma delecao que nao acontece.
> - ALMA: a peca nao virou motion design frio. 1a pessoa em 6 das 7 falas, instinto de vigia virando dois congelamentos e uma legenda que antecipa a voz nos dois pontos que importam, temperamento aliado em 'o limite e meu, nao seu', humor mirando a propria marca. Nada precisou ser devolvido.
> - AZUL (achado mais grave depois de abrir os assets): SEIS das sete telas de recusa sao dominadas por info-blue #3B82E0 (circulo grande + headline 'Seu caso pede uma pessoa') e a setima carrega crimson mais um botao coral-600. Os primeiros 10 segundos da peca tinham AZUL como cor de acento dominante, que e exatamente a cor proibida como marca, e o botao coral do painel_recusa competia com o unico acendimento autorizado do palco. Correcao: dessaturacao quente das sete (Hue/Saturation Master -100 + Photo Filter Warming 81 a 18%, Preserve Luminosity ON), com a oitava ficando em cor cheia. Isso FORTALECE o criativo: a oitava passa a ser a unica legivel E a unica colorida.
> - TRAVESSAO dentro de asset: confirmei no pixel que veredito_waitlist.png tem um travessao real no chip 'CNAE pretendido', entao o crop e obrigatorio mesmo. Mas descobri um segundo: veredito_descartado.png tem travessao no corpo ('Nao e erro seu ... e fora do nosso escopo'), e o roteiro colocava justamente essa tela no CONGELAMENTO, o plano mais segurado da peca. Correcao: o congelamento e o topo da pilha passam pra saida_cnpj-inapto, a unica das sete sem travessao, sem orgao nomeado, sem rotulo de plano e sem enquadramento de 'braco do escritorio tradicional'. Ordem das sete reescrita.
> - CROP errado por medicao: o rotulo 'CNAE pretendido' comeca em y aprox. 1954, entao o crop de 1950 deixava 4px de margem, nao os 29px que o roteiro afirmava. Correcao: crop em 1946.
> - BANDA DA MASCARA cortava o card: o roteiro pedia y 1100, mas o hairline inferior do card branco esta em y 1125 (medido no pixel, valor 227 222 215 = #E3DED7). Ficaria um caco de 25px de card branco flutuando no topo do enquadramento. Correcao: banda y 1136 a 1946, 1290x810, resultando em 1023x642 em quadro, centro (540,790).
> - MOTION fora da regua: o push da oitava era de 600ms, duracao que nao existe no sistema (150/250/400). Correcao: 400ms, que alias fica mais seco e mais vigia.
> - DUAS CORAIS SIMULTANEAS em 14,50: a respiracao 'a porta.' segurava 'porta' em coral ate 14,85 enquanto a tela acendia 'ainda' em 14,50, violando 'um foco coral por frame no palco'. Correcao: a legenda DEVOLVE o coral pra ink-900 nos mesmos 150ms em que a tela acende. O coral nao aparece, ele muda de lugar. Virou o melhor micro-momento da peca.
> - BLOCO DE LEGENDA COM 6 PALAVRAS: 'a parte importante e o ainda.' estourava o teto de 5. Correcao: duas respiracoes.
> - PULSO INFINITO: o Hook B pedia o contorno do slot vazio 'pulsando', que cai direto na proibicao 5.5.11. Correcao: trim path desenhando uma vez em 150ms e parando. Mesma leitura, regua intacta.
> - HOOK MUDO: a ancora entrava com fade, o que a deixaria abaixo de 60% de opacidade nos 6 primeiros frames. Correcao: 'nao' em opacidade 100 no frame 0, sem animacao de entrada. A peca abre ligada.
> - ANCORA FORA DA BANDA: 360px estoura o teto de 260px da palavra-veredito. Correcao: 260px, com ressalva registrada porque o checklist do bloco D tem leitura mais folgada (200 a 420).
> - TIPOGRAFIA INEXISTENTE NO SISTEMA: a frase promovida ao palco estava em 96 a 112px, tamanho que nao existe (legenda e 60, ancora e 200 a 420). Correcao: 'fingir que abre' fica na faixa de legenda em 60px e 'e pior.' vira ancora de 260px no palco. As duas juntas formam a frase, a legenda nunca abre buraco, e a ideia de 'a unica frase que so existe escrita' fica intacta.
> - ACENDIMENTO DO AI DESSINCRONIZADO: o roteiro punha o acendimento em 17,20 e a silaba tonica de 'ai' em 17,60, quebrando o par indivisivel travado no ADR. Correcao: acendimento em f528 (17,60), slot da frase em 16,75 a 17,68, tonica em 17,60. O hold do botao continua em 1,95s, acima do minimo de 1,8s.
> - TRES BURACOS DE RITMO acima de 1,2s (4,50 a 6,00, 12,20 a 13,55 e 15,60 a 16,20). Correcao: 'com capricho, inclusive.' virou duas respiracoes e 'a unica que nao fecha' virou duas. Auditoria evento a evento incluida: o maior intervalo agora e 1,05s.
> - BUMPER DE 6s ILEGAL: previa 4,6 segundos sem legenda queimada e sem hook em texto, quebrando duas regras duras. Correcao: quatro respiracoes cobrindo os 6 segundos inteiros mais a ancora no frame 0.
> - CORTE DE 15s AUTORIZAVA MATAR O ANTIDOTO: o proprio roteiro dizia que V3 ('O limite e meu, nao seu.') e o unico antidoto contra o espectador concluir que o produto nao e pra ele, e depois autorizava sacrificar V3 numa variante 'pra Persona A pura'. Sem ela, uma peca que exibe sete recusas passa a rir de quem assiste. Correcao: revogado. O A/B e no hook, nunca no antidoto.
> - ATALHO DE PRODUCAO MORTO: abri o vinheta-9x16-4k60-v2.mp4 e ele e 2160x3840 a 60fps sobre FUNDO ESCURO, com SOMBRA PROJETADA debaixo do simbolo e um CURSOR DE MAO AMARELO em quadro. Reusar os ultimos 2,5s dele quebraria a regua de sombra, a regua de cor e a emenda de loop do Reels (o end card desta peca tem que ser papel #FAF8F5 pra casar com o frame 1). Correcao: end card construido no AE, 4 a 6h, amortizado nos 6 criativos.
> - GEOMETRIA QUE NAO CABIA: a grade 4x2 com celulas de 216x468 daria 960px de altura num palco de 780px, e o empilhamento a 34% daria 951px e transbordaria pra faixa de legenda. Correcao: celulas 156x338, bloco 696x700 centrado em (540,790); empilhamento a 26%.
> - VALIDACOES QUE NAO VALIDAM: fase3-gera-legendas.py so faz print nas linhas 148 e 153, entao o build nao para em travessao nem em excesso de coral, so reclama. E a contagem de coral e por take (max 1), quando esta peca precisa de max 1 por respiracao. Correcao especificada no item 15 da lista de producao (raise SystemExit + contagem por linha).
> - BLOQUEIO DE DISCO OTIMISTA: medido agora, o volume C: tem 1,1 GB livres de 111 GB, nao 1,8 GB. O numero esta piorando. Correcao aplicada com nota de que liberar espaco e a primeira tarefa da producao, nao a ultima.
> - AFIRMACAO FALSA: 'ultimo frame igual ao frame 1, a emenda some'. O fundo e o mesmo, o conteudo nao. Correcao: redacao honesta, o beneficio real e nao piscar luminancia na emenda do loop.
> - LITIGADO E LIBERADO (nao mexi): coral na palavra 'nao' da respiracao R2. A regra 1.4 proibe coral em erro, prazo perdido, multa e vencimento. Aqui 'nao' e a palavra da propria marca sobre a propria recusa, e o Sistema 1 da regua autoriza uma palavra forte coral por respiracao como ritmo de leitura. Registrado pra nao ser reaberto.
> - VERIFICADO NO PIXEL E NO CODIGO: papel das telas reais bate exatamente #FAF8F5 e o hairline dos cards bate exatamente #E3DED7; linha 17 do 32-lettering.jsx tem mesmo o frame 4K hardcoded; GAP=36 esta hardcoded na linha 30 e nao vem de OPC; o recurso 'zonas' existe; rrect() existe na linha 29 do 20-precomps.jsx; sombra() e brilho() existem no 48-polimento.jsx e ficam desligados; os 4 stems de 'A Step Ahead' estao extraidos; marketing/audio/sfx/ realmente nao existe; Sora-wght.ttf esta la.
# Criativo 01 de 6 · Mote A (institucional) · "Sete telas pra dizer não"

**Formato** 9:16, 1080x1920, 30 fps, 600 frames, 20,00s · **Objetivo** cadastro na lista de espera · **Botão do Meta** `Cadastre-se`
**Mundo** papel do primeiro ao último frame · **Mascote em quadro** zero · **Planos de IA generativa** zero

---

## O conceito

O app tem oito telas cujo único trabalho é dizer não pra alguém. Sete recusam de vez. A oitava recusa e deixa a porta aberta, porque ela pede o contato da pessoa pra avisar quando o app abrir.

A peça mostra as sete, conta elas na frente do espectador, e entrega a oitava. O argumento inteiro cabe numa imagem: a mesma marca que escreveu sete recusas com capricho é a marca que escreveu a única que não fecha. E a palavra que separa as duas coisas é uma palavra que já está escrita dentro do produto, não escrita por mim pra este anúncio: `ainda`.

**Como a alma do Léo entra sem ele entrar:**

- **Voz em 1ª pessoa.** "Eu escrevi sete telas pra dizer não." "O limite é meu, não seu." "Eu te aviso quando abrir."
- **Instinto de vigia virando edição.** O plano congela duas vezes: quando a sétima recusa assenta, e quando a palavra acende. O corte antecipa: a legenda entra antes da voz nos dois pontos que importam, o hook e o CTA.
- **Temperamento.** O limite é assumido como nosso, nunca como falha de quem assiste.
- **Alvo do humor.** "Com capricho, inclusive." A marca ri de si mesma por ter caprichado em escrever recusa.

**A régua de cor da peça, em uma frase:** as sete recusas são monocromáticas quentes, a oitava chega em cor, e a única coral do palco é uma palavra dentro dela.

---

## Timeline

| Tempo · frames | Palco | Origem | Locução | Texto de tela | Som |
|---|---|---|---|---|---|
| **0,00 a 0,20**<br>f0 a f6 | **Hook mudo.** Papel `#FAF8F5` limpo. A palavra `não` já está em quadro no **frame 0, opacidade 100, sem animação de entrada**. Sora 800, **260px**, tracking -2%, ink-900 `#1B1E24`, centro óptico (540, 790), largura em quadro 459px. A peça abre ligada, ninguém espera um fade. | [AE] | mudo | **Âncora:** `não` · 260px · ink-900. Nunca coral: coral não marca negativa nesta marca. | Silêncio de 6 frames. O primeiro som da peça é físico, não musical. |
| **0,20 a 3,80**<br>f6 a f114 | **O empilhamento.** Sete telas reais do app entram uma por cima da outra, cadência de **18 frames**, cada uma com leve offset e rotação alternada de no máximo 2 graus. Escala **26%** (335x727 em quadro), pilha centrada em (540, 790), atrás da âncora. **Isto é um plano único e contínuo, não sete cortes:** as telas são elementos que acumulam, então a régua de 0,8s de plano mínimo não se aplica. Entrada de cada tela: 150ms ease-out, opacidade 0 a 100, scale 96 a 100. **As sete estão em monocromático quente** (ver item 9 da lista de produção). Contador `1 DE 7` sobe a cada tela. A âncora `não` sai em **3,00** em fade de 250ms, sem movimento. | [TELA APP] + [AE] | **1,20 a 3,80:** "Eu escrevi sete telas pra dizer não." | **Micro-label A** (x=72, baseline 288): `TELAS REAIS DO APP`<br>**Micro-label B** (x=72, baseline 336), troca por tela: `NOME REPROVADO` · `SEM PARCEIRO PRA ESSE CASO` · `REGIME QUE A GENTE NÃO CALCULA` · `MAIS DE DOIS SÓCIOS` · `SÓCIO MORANDO FORA` · `ATIVIDADE FORA DO ESCOPO` · `CNPJ QUE PRECISA REGULARIZAR`<br>**Contador:** chip raio 24, hairline 3px, `1 DE 7` a `7 DE 7`, Sora 700 40px ink-900, canto sup. dir. | Sete tapas de papel em escala ascendente, um por tela. Sete ticks de UI curtos, deslocados 2 frames de cada tapa. Trilha entra em bass + drums. |
| **3,80 a 4,07**<br>f114 a f122 | **O primeiro congelamento. Oito frames.** A sétima tela assenta e **tudo para**: pilha, contador, micro-labels, legenda. Nada se move. É o gesto do vigia, o bicho que fica em pé e trava. | [AE] | mudo | contador travado em `7 DE 7` | **Um click de "off" seco.** A trilha não para, o quadro que para. |
| **4,07 a 6,00**<br>f122 a f180 | Pilha em repouso com **push-in contínuo de 3%**, uma direção só. A tela do topo é `saida_cnpj-inapto`, a mais limpa de texto das sete. | [TELA APP] + [AE] | **4,30 a 5,45:** "Com capricho, inclusive." | legenda em duas respirações (R3 e R4) | Trilha ganha instruments em 5,20. |
| **6,00 a 6,40**<br>f180 a f192 | **O leque.** 400ms ease-out. A pilha se abre e assenta numa **grade 4x2**: oito células de **156x338**, gutter 24, bloco de 696x700 centrado em (540, 790), ocupando `x 192 a 888` e `y 440 a 1140`. **Sete células preenchidas, a oitava vazia.** O contorno do slot vazio se desenha por **trim path** em 150ms, uma vez só, hairline 3px `#E3DED7`, raio 24, e **fica parado**. Sem pulso, sem piscada. Escala de cada tela na grade: 12,1%. | [TELA APP] + [AE] | mudo | Micro-label A vira `SETE RECUSAS · UM SLOT VAZIO` | **Um whoosh de leque**, curto, seco. |
| **6,40 a 8,40**<br>f192 a f252 | Grade parada em posição A. O buraco fica visível por 2,00s inteiros, sem ninguém apontar pra ele. O espectador acha sozinho. | [TELA APP] + [AE] | **6,20 a 8,40:** "O limite é meu, não seu." | legenda R5 e R6 | Trilha cheia. |
| **8,40 a 9,20**<br>f252 a f276 | A grade **escurece pra 22% de opacidade** em 250ms, virando fundo. Nada mais entra ainda. | [TELA APP] + [AE] | **mudo, de propósito** | legenda R7 na faixa normal | **Riser grave**, longo, baixo. É o único riser da peça. |
| **9,20 a 10,00**<br>f276 a f300 | **A frase que só existe escrita.** A âncora `é pior.` entra em 400ms ease-out, y +48 a 0, scale 92 a 100, `wght` 300 a 700, tracking +2% a 0. Sora 700, **260px**, ink-900, centro óptico (540, 790), largura 783px. Lida junto com a legenda que está no rodapé, o quadro diz `fingir que abre é pior.` **Essa frase nunca é falada. A marca escreve em vez de dizer, porque foi escrevendo que ela recusou sete vezes.** | [AE] | **mudo** | **Âncora:** `é pior.` · 260px · ink-900, **sem coral** (o teto de coral do palco está reservado)<br>**Legenda em hold:** `fingir que abre` | Só o riser sustentando. Nenhum SFX. |
| **10,00 a 10,40**<br>f300 a f312 | **A oitava.** Três coisas em 400ms ease-out: a âncora sai em fade de 250ms, **as sete telas saem por whoosh** em stagger de 2 frames a partir das bordas, e a oitava entra **de dentro do slot vazio** crescendo até **escala 34%** (439x662 em quadro), centro (540, 790), com moldura raio 48 e hairline 3px `#E3DED7`. A grade volta a 100% no caminho de saída. | [FFMPEG] + [AE] | mudo | Micro-label B vira `A OITAVA`. Contador some em fade de 250ms em 10,00, travado em `7 DE 7`, **nunca chega a 8**. | Sete whooshes de saída em stagger. A oitava **não bate**: ela assenta, com um único tick macio. |
| **10,40 a 11,00**<br>f312 a f330 | Hold. A oitava sozinha em quadro, ainda pequena e ainda ilegível (corpo da UI em 16,3px). O espectador reconhece que é o mesmo app, não lê o que está escrito. | [FFMPEG] + [AE] | **10,50 a 11,98:** "Essa é a oitava." | legenda R8 | Trilha desce pra melody + bass. |
| **11,00 a 11,40**<br>f330 a f342 | **O push.** 400ms ease-out fazendo duas coisas ao mesmo tempo, no mesmo layer: a escala vai de 34% para **79,3%** e a máscara fecha dos limites totais do asset para a **banda do parágrafo** (asset `y 1136 a 1946`, 1290x810). A tela cresce e o enquadramento se fecha nela. Sem corte, sem dissolve. Ao fim: layer **1023x642** em quadro, centro (540, 790), `y 469 a 1111`, raio 48, hairline 3px `#E3DED7`. O corpo da UI aterrissa em **38,1px em quadro**, acima do piso de 30. Micro-labels A e B saem em fade de 250ms em 11,00. | [FFMPEG] + [AE] | mudo | O que fica legível em quadro, e é texto **real do produto**, não escrito por mim:<br>`A gente ainda não abre esse tipo sozinho, e não vamos fingir que abre. Quer ser avisado quando abrir?`<br>e abaixo os dois campos reais: `Seu nome` e `WhatsApp ou e-mail`. | Um único movimento de ar grave acompanhando o push, sem whoosh de transição. |
| **11,40 a 14,50**<br>f342 a f435 | **Hold com push-in contínuo de 3%**, uma direção. O quadro é uma folha do produto: a frase que recusa, e logo abaixo o formulário que pede o contato. **A recusa e o pedido no mesmo quadro é o argumento inteiro em uma imagem.** | [FFMPEG] + [AE] | **12,20 a 14,80:** "A única que não fecha a porta." | legenda em três respirações (R9, R10, R11), garantindo que nenhum trecho passe de 1,2s parado | Trilha desce pra melody sozinha em 13,55. |
| **14,50 a 14,77**<br>f435 a f443 | **O acendimento e o segundo congelamento.** Quatro coisas: o push-in **congela por 8 frames** (o mesmo gesto da sétima tela), a palavra `ainda` dentro da frase real do produto vira **coral-600 `#DD4E27`** em 150ms, a palavra `porta` da legenda **devolve o coral e vai pra ink-900** nos mesmos 150ms, e entra um tick. **O coral não aparece, ele muda de lugar:** sai da minha legenda e entra na frase do produto. Nada mais se move. É o único acendimento de coral no palco da peça inteira. | [AE] sobre [FFMPEG] | a locução ainda está correndo. O coral chega **9 frames antes** da última sílaba. É o corte que antecipa aplicado ao acendimento. | A palavra `ainda`, dentro de `A gente ainda não abre esse tipo sozinho`, em coral-600. Corpo 38,1px, exatamente o corpo do produto, **sem retipografar nada**. | **Tick seco, único, limpo.** Sem twinkle, sem riser. A trilha derruba tudo menos um pad. |
| **14,77 a 16,20**<br>f443 a f486 | Hold. O push-in retoma em 3%, mesma direção. A frase inteira do produto em quadro com uma palavra acesa dentro dela. | [FFMPEG] + [AE] | **14,85 a 16,50:** "A parte importante é o ainda." | **Legenda em duas respirações:** `a parte importante` e `é o ainda.` **Sem coral nenhum**, por regra de simultaneidade: o palco está aceso, então a ênfase de `ainda` na legenda é por peso, `wght` 800, em ink-900. A legenda escreve `ainda` em ink enquanto a tela acende `ainda` em coral. O olho junta as duas sozinho. | Pad só. Nenhum SFX. |
| **16,20 a 16,50**<br>f486 a f495 | A tela sai em fade de 250ms. Sobra papel `#FAF8F5` limpo e a legenda `é o ainda.`, que **não sai**: ela cobre o buraco de legenda até o end card. | [AE] | fim da fala em 16,50 | legenda em hold | Trilha derruba a última camada. |
| **16,50 a 16,80**<br>f495 a f504 | Papel. Legenda em hold. **Silêncio absoluto de 300ms** na versão base. | [AE] | silêncio na versão base | legenda em hold | **Nada. Zero.** É o melhor momento da peça e ele é feito de nada. |
| **16,80 a 17,20**<br>f504 a f516 | **End card.** Corte seco, mesmo papel, então o que o olho vê é o logo entrando: 400ms ease-out, y +48 a 0, scale 92 a 100, **sem zoom, sem bounce**. `legalizai-logo-horizontal.svg` em 560px de largura (altura 110), centro (540, 700). O "ai" está **coberto** por um solid ink-900 mascarado só nos glifos dele, opacidade 100. | [SVG] `identidade/logos/legalizai-logo-horizontal.svg` + [AE] | **SLOT opcional 16,75 a 17,68:** "Vai, legaliza aí." | Logo `Legalizai`. Nenhum outro texto além da legenda em hold. | POP de papel em 4 frames no f504. Trilha entra com o acorde de resolução. |
| **17,20 a 17,60**<br>f516 a f528 | Logo assentado. Legenda troca pra `entra na lista.`, **antecipando a voz em 0,8s**. Bookend do hook: a peça abriu com texto antes da fala e fecha com texto antes da fala. | [SVG] + [AE] | idem | legenda `entra na lista.` | Pad. |
| **17,60 a 17,75**<br>f528 a f533 | **O AI acende.** O solid ink que cobria o "ai" vai de 100 a 0 em 150ms, revelando o coral-500 `#F2643C` que já nasce no SVG master, e o `brand-glow` sobe junto atrás do wordmark, de 0 a 18% de opacidade, `radial-gradient(120% 80% at 15% 0%, coral-500 a 22%, transparent 60%)`. **É o único glow autorizado na leva inteira.** **Na versão com a frase, a sílaba tônica de "aí" cai exatamente em f528. Na versão sem a frase, o acendimento acontece no mesmo frame e nenhum keyframe muda.** | [SVG] + [AE] | tônica de "aí" em **17,60** | Wordmark com `ai` em coral-500. | **O sino da marca.** Um ding único, limpo, na frequência já usada no take 8 do escalada. |
| **17,80 a 18,05**<br>f534 a f541 | Linha de CTA entra em 250ms, y +32 a 0. Botão entra em 250ms com stagger de 4 frames. | [AE] | **18,00 a 19,90:** "Entra na lista. Eu te aviso." | **Linha de CTA:** `Eu te aviso quando abrir.` · Sora 600 · 48px · ink-900 · centrada · baseline y=900. Promessa de comportamento, nunca de resultado.<br>**Botão:** rótulo `Cadastre-se` · Sora 700 · **56px** · branco · fill **coral-600 `#DD4E27`** · raio 36 · altura 123 · largura 466 · centro (540, 1080), ou seja `x 307 a 773`, `y 1018 a 1141`. Os 56px são o que autoriza branco sobre coral-600 pela AA. | Click de UI seco no assentar do botão. Nada mais. |
| **18,05 a 20,00**<br>f541 a f600 | **Hold de 1,95s**, acima do mínimo de 1,8s. **Nada se move além da legenda queimada.** Nenhum pulso no CTA, nenhuma seta, nenhum botão respirando. | [AE] | fim da fala em 19,90 | legenda troca pra `eu te aviso.` em 18,95 e fica no último frame.<br>**Último frame f600:** o fundo é o mesmo papel `#FAF8F5` do frame 1, então o loop do Reels não pisca de luminância na emenda. O conteúdo troca, obviamente. | Cauda de trilha resolvendo. Sem fade pra preto, sem corte abrupto de áudio. |

---

## Legenda queimada

Texto corrido completo, do frame 3 ao frame 600, **sem buraco**. Corpo 60px Sora 600, line-height 1,25, tracking -1%, centrada em x=540, máximo 880px de largura, **máximo 5 palavras por bloco**. Mote A, então baseline única em **y=1440** e bloco de duas linhas em **1365 e 1440**, crescendo pra cima.

Entrada word by word: opacidade 0 a 100 e y +28 a 0 em 150ms ease-out, scale 92 a 100, stagger de 3 frames. Palavra forte: 250ms, y +40 a 0, scale 88 a 100, `wght` 400 a 700, coral-600 `#DD4E27` (tema papel). Saída de respiração em fade de 250ms sem movimento.

| # | Janela | Texto | Palavra que acende | Nota |
|---|---|---|---|---|
| R1 | 0,10 a 3,00 | `eu escrevi sete telas` | **sete** coral-600 | Entra 1,1s antes da voz. O texto antecipa a fala. 4 palavras. |
| R2 | 3,00 a 4,30 | `pra dizer não.` | **não** coral-600 | A âncora ink de 260px sai no mesmo frame em que esta palavra entra. O `não` gigante vira o `não` pequeno e colorido. 3 palavras. |
| R3 | 4,30 a 5,20 | `com capricho,` | **capricho** coral-600 | 2 palavras. |
| R4 | 5,20 a 6,20 | `inclusive.` | nenhuma | Beat seco separado. Segura o intervalo entre 4,30 e o leque em 6,00 abaixo de 1,2s. 1 palavra. |
| R5 | 6,20 a 7,15 | `o limite é meu,` | **meu** coral-600 | 4 palavras. |
| R6 | 7,15 a 8,40 | `não seu.` | **seu** coral-600 | O antídoto. Sem esta linha a peça vira "não é pra você". 2 palavras. |
| R7 | 8,40 a 10,25 | `fingir que abre` | nenhuma | **Fica em hold 1,85s.** Enquanto ela segura o rodapé, a âncora `é pior.` ocupa o palco. As duas juntas formam a frase. A legenda nunca abre buraco. 3 palavras. |
| R8 | 10,25 a 12,20 | `essa é a oitava.` | **oitava** coral-600 | 4 palavras. |
| R9 | 12,20 a 13,00 | `a única` | **única** coral-600 | 2 palavras. |
| R10 | 13,00 a 13,55 | `que não fecha` | nenhuma | 3 palavras. |
| R11 | 13,55 a 14,85 | `a porta.` | **porta** coral-600 **até f435, depois ink-900** | Em 14,50 esta palavra **devolve o coral** pra tela, em 150ms. É a única troca de cor de legenda da peça e ela é a regra de simultaneidade virando gesto. 2 palavras. |
| R12 | 14,85 a 15,60 | `a parte importante` | nenhuma | `importante` em `wght` 800 ink-900. 3 palavras. |
| R13 | 15,60 a 17,20 | `é o ainda.` | nenhuma | `ainda` em `wght` 800 ink-900. **Não sai em 16,20:** segura o quadro pelo silêncio e pela entrada do logo. 3 palavras. |
| R14 | 17,20 a 18,95 | `entra na lista.` | nenhuma | Antecipa a voz em 0,8s. Bookend do hook. Ink, porque o end card já tem AI e botão. 3 palavras. |
| R15 | 18,95 a 20,00 | `eu te aviso.` | nenhuma | Fica em quadro no último frame. 3 palavras. |

**Contagem de coral na legenda:** 8 acendimentos em 15 respirações, no máximo 1 por respiração. Isso é o Sistema 1 da régua (ritmo de leitura) e **não conta** no teto do palco.

**Asserts obrigatórios no `fase3-gera-legendas.py`:**
1. Se qualquer string do JSON contiver os code points `—` (em dash) ou `–` (en dash), o build **para** (`raise SystemExit`), não só imprime. **O código de hoje só faz `print`, isso precisa mudar.** Vale também pros micro-labels e pro nome do arquivo entregue.
2. A validação de coral hoje é "máximo 1 por take". Aqui a régua é **máximo 1 por respiração**, então o contador precisa ser reescrito por linha, e também virar `raise`.
3. R4, R7, R10, R12, R13, R14 e R15 têm `coral: null`. Assert explícito.

---

## End card

Fundo papel quente `#FAF8F5`, o mesmo do frame 1.

- **Logo:** `legalizai-logo-horizontal.svg`, 560px de largura, centro (540, 700). Entra em 400ms ease-out, y +48 a 0, scale 92 a 100. **Zero zoom no logo**, ele entra e assenta.
- **Acendimento:** o `ai` do wordmark vira coral-500 `#F2643C` em 150ms no **f528 (17,60s)**, com `brand-glow` subindo pra 18% atrás. O símbolo e os dois pingos dos i já são coral desde a entrada. **O lockup inteiro conta como um acendimento**, não três, e não conta no teto do palco.
- **Linha de CTA, texto exato:** `Eu te aviso quando abrir.` · Sora 600 · 48px · ink-900 `#1B1E24` · centrada · baseline y=900.
- **Botão, rótulo exato:** `Cadastre-se` · Sora 700 · 56px · branco · fill coral-600 `#DD4E27` · raio 36 · centro (540, 1080).
- **Botão do Meta no anúncio:** `Cadastre-se`.
- **Sem data, sem preço, sem rótulo de plano, sem super de condição.** Mote A não carrega nenhum dos quatro, e nenhum deles pode ser inventado aqui.
- **Slot opcional de 0,93s (16,75 a 17,68) pra frase falada `Vai, legaliza aí.`** Com a frase, a tônica de "aí" cai em 17,60 e casa frame a frame com o acendimento. Sem a frase, o slot é hold de logo com trilha, **o acendimento acontece no mesmo f528, e nenhum keyframe visual muda.** As duas versões saem do mesmo projeto sem retiming e sem reescrita.

---

## Copy do post no Meta

**Primary text**
```
O app ainda não abriu. Eu já escrevi sete telas cujo único trabalho é recusar alguém.
A oitava é a única que não fecha a porta.
Entra na lista de espera e eu te aviso quando abrir.
```

**Headline** (24 caracteres)
```
Sete telas pra dizer não
```

**Description**
```
Lista de espera aberta. Eu te aviso quando abrir.
```

Zero travessão, zero promessa de garantia, zero escassez fabricada, zero menção a preço, plano, prazo, cobertura geográfica ou concorrente. Nome exibido `Legalizai` com A.

**Nome do arquivo entregue:** `legalizai_criativo-01_mote-a_sete-telas_9x16_20s_v01.mp4`. Sem travessão, sem acento, sem espaço.

---

## Lista de produção

| # | Asset | Origem | Existe? | Como produzir |
|---|---|---|---|---|
| 1 | `painel_recusa.png` | [TELA APP] | Sim, verificado 1290x2796 | Tela 1 do empilhamento. Micro-label `NOME REPROVADO`. **Verificado:** a tela nomeia "Junta Comercial", carrega crimson e carrega um botão coral-600. Em quadro a 26% o corpo cai em 12,5px, e depois da dessaturação (item 9) **não sobra nem crimson nem coral**. Nunca é a tela do topo, nunca é a do congelamento. |
| 2 | `veredito_descartado.png` | [TELA APP] | Sim | Tela 2. **Verificado no pixel: esta tela contém um travessão real** no corpo, entre `Não é erro seu` e `é fora do nosso escopo` (o separador ali é um `—`, não reproduzido aqui de propósito). Por isso ela foi **tirada do congelamento** (onde o roteiro anterior a colocava) e enterrada na posição 2, coberta por cinco telas. A 26% a linha cai em 12,5px, muito abaixo do piso de 30. **Conferir por `see-frame` antes de renderizar.** |
| 3 | `saida_regime-nao-suportado.png` | [TELA APP] | Sim | Tela 3. Contém `Simples Nacional (ME) e MEI` no corpo. Ilegível a 26%, e o micro-label é neutro (`REGIME QUE A GENTE NÃO CALCULA`), porque **mote A não carrega rótulo de plano**. |
| 4 | `saida_socios.png` | [TELA APP] | Sim | Tela 4. **Verificado:** círculo e headline em info-blue `#3B82E0`. Depois da dessaturação isso vira cinza quente. **Proibido qualquer azul em correção de cor, scrim, fundo ou shape.** |
| 5 | `saida_exterior.png` | [TELA APP] | Sim | Tela 5. Também info-blue, também dessaturada. |
| 6 | `veredito_nao-atende.png` | [TELA APP] | Sim | Tela 6. Também info-blue. Contém `nosso escritório parceiro, resolve do jeito tradicional`, que é enquadramento que a marca não usa. Ilegível a 26%. |
| 7 | `saida_cnpj-inapto.png` | [TELA APP] | Sim | **Tela 7, a do topo e a do congelamento.** Escolhida porque é a única das sete **sem travessão, sem órgão nomeado, sem rótulo de plano e sem enquadramento de "braço do escritório"**. É a que fica mais tempo em quadro, então é a que precisa ser a mais limpa. |
| 8 | **`veredito_waitlist_seguro.png`** | [FFMPEG] | **NOVO**, de `marketing\telas-app\veredito_waitlist.png` | `ffmpeg -i veredito_waitlist.png -vf crop=1290:1946:0:0 veredito_waitlist_seguro.png`. **Este crop é obrigatório e não é estético.** Ele deleta fisicamente do asset o chip `CNAE pretendido`, cujo conteúdo real é o código `8650-0/02` seguido de um `—` e do rótulo `Atividade regulamentada`, **com travessão confirmado no pixel**, e junto vão o disclaimer, o link `Não é bem isso, refazer` e o botão cinza desabilitado. **Medido:** o rótulo `CNAE pretendido` começa em `y ≈ 1954`, então 1946 é o último corte seguro. O roteiro anterior pedia 1950, que deixava 4px de margem. **Conferir por `see-frame` que nenhum travessão sobrou em quadro antes de renderizar.** |
| 9 | **Dessaturação quente das sete recusas** | [AE] | **NOVO. Correção de marca.** | **Achado do guardian: seis das sete telas são dominadas por info-blue `#3B82E0` e a sétima carrega crimson mais um botão coral-600.** Sem tratamento, os primeiros 10 segundos da peça têm o azul como cor de acento dominante, que é exatamente a cor que a marca proíbe como marca, e o único coral do palco compete com um botão de UI. Correção: adjustment layer sobre as sete, com `ADBE HUE SATURATION` Master Saturation **-100** e `ADBE Photo Filter` Warming Filter (81) a **18%**, Preserve Luminosity ON. **A oitava fica em cor cheia.** Ganho dramatúrgico: a oitava não é só a única legível, ela é **a única colorida**. Verificação: `see-frame` no f114 e no f252, conferir que nenhum pixel da pilha tem `|B - R| > 8`. |
| 10 | Máscara animada e push da oitava | [AE] | NOVO | Um layer só. Máscara retangular raio 48 mais stroke hairline 3px `#E3DED7`. De 10,00 a 10,40 nos limites totais do asset em escala 26% subindo a 34%. De **11,00 a 11,40 (400ms ease-out)** a escala vai a 79,3% e a máscara fecha na banda `y 1136 a 1946` do asset. **Duas correções sobre o roteiro anterior:** (a) a duração era 600ms, que não existe na régua de 150/250/400, virou 400ms; (b) a banda começava em `y 1100`, e **o hairline inferior do card branco está em `y 1125`, medido no pixel** (`227 222 215` = `#E3DED7`), o que deixaria um caco de 25px de card flutuando no topo do enquadramento. Reciclar o helper `rrect()` de `marketing\filme\escalada\jsx\20-precomps.jsx` (linha 29). |
| 11 | **Acendimento do `ainda`** | [AE] | NOVO | O `53-lettering-t8-cores.jsx` repinta text layers do AE por critério ASCII e **não funciona em bitmap**. Mecanismo correto: solid coral-600 `#DD4E27` mascarado num retângulo em torno da palavra, com **track matte de luminância invertida** vindo de um duplicado do layer da tela. O coral aparece só onde o glifo é escuro, com antialiasing perfeito, e a palavra `ainda` do produto acende sem nada ser retipografado. Opacidade 0 a 100 em 5 frames. Coordenadas: **medir no `see-frame` depois do build**, porque o push mudou de 600ms pra 400ms. |
| 12 | Grade 4x2 com slot vazio | [AE] | NOVO | Oito células de 156x338 (razão 1290:2796), gutter 24, bloco 696x700 centrado em (540, 790). O slot vazio é um retângulo com hairline 3px `#E3DED7`, raio 24, **desenhado uma vez por trim path em 150ms e depois parado**. O roteiro anterior pedia o contorno "pulsando", o que é pulso infinito e cai na proibição 5.5.11. |
| 13 | Contador `1 DE 7` | [AE] | Adaptar · `marketing\filme\escalada\jsx\54-contador-fix.jsx` | Reciclar o texto keyframado e o `fmt()`. **Remover o Directional Blur** (length 26 na régua 4K), a régua vertical proíbe blur direcional. Envolver num chip raio 24 com hairline 3px. **O contador conta telas escritas, nunca vagas e nunca tempo, e ele para em `7 DE 7` e some.** Não é countdown nem contador de vaga. |
| 14 | Rig de lettering | [AE] | Sim, com 3 mudanças · `marketing\filme\escalada\jsx\32-lettering.jsx` | (a) trocar `var W = 3840, H = 2160` da **linha 17, verificada**, por leitura de `takeComp.width/height`; (b) `$.global.LETTERING_OPCOES = { W:1080, H:1920, FPS:30, tema:"papel", duasCores:true, tam:60, larguraMax:880, xc:540, y1:1440, y2a:1365, y2b:1440 }`; (c) `GAP` está **hardcoded em 36 na linha 30** e precisa virar opção, valor 11 aqui. Com `tema:"papel"` e `duasCores:true` o rig já resolve `CORAL_500 = [221,78,39]`, que é coral-600, o valor certo pro mundo papel. |
| 15 | Legendas com validação | [AE] | Sim, trocar dados · `marketing\filme\escalada\tools\fase3-gera-legendas.py` | Trocar o dicionário `LINHAS` e o `CORAL`. **Achado: as validações de hoje só fazem `print`, não param o build** (linhas 148 a 153). Trocar por `raise SystemExit`. E a contagem de coral hoje é por take (máx 1), aqui precisa ser **por respiração**. Ver os três asserts na seção de legenda. |
| 16 | Word sync da locução | [AE] | Sim · `fase1-processa.py` mais `.venv` com WhisperX | Rodar só o alinhamento word level. Um marker por palavra, snap 1/30s. **Todo keyframe de legenda referencia marker, nunca número solto.** |
| 17 | Template vertical base | [AE] | **NOVO** · `jsx\10-estrutura-9x16.jsx` e `jsx\20-precomps-9x16.jsx` | Portar de `10-estrutura.jsx` e `20-precomps.jsx`. `W=1080, H=1920`, 600 frames. `GUIA-safe` vira retângulo 936x1160 com as faixas mortas de topo (0 a 200) e rodapé (1520 a 1920) marcadas, mais o corredor de ícones do Instagram (`x 880 a 1080`, `y 1040 a 1780`). **Deletar o `PRE-mascote`, que está em `20-precomps.jsx` linhas 112 a 123 (verificado), não em `10-estrutura.jsx`.** Manter `proj.bitsPerChannel = 16`. Custo de 6 a 10h, uma vez só, serve os 6 criativos. |
| 18 | Tokens de cor | [AE] | Sim · `jsx\00-tokens.jsx` e `tools\gera-tokens.mjs` | Independe de resolução. Comp `_CONTROLE` com os Color Controls nomeados. **Nenhum hex digitado à mão em fill de layer.** |
| 19 | Grain anti-banding | [AE] | Sim · `PRE-grade-grain` em `jsx\20-precomps.jsx` | Adjustment 1080x1920, ADBE Noise 1,5%, sobre tudo. Obrigatório: o quadro é papel chapado em área grande e sem grain o H.264 faz banding. |
| 20 | Logo do end card | [SVG] | Sim · `identidade\logos\legalizai-logo-horizontal.svg` | Master tricolor, o `ai` já nasce coral. **Nunca usar o lockup de `legalizei-logo-app-fundo-solido.svg`**, o wordmark de dentro é o antigo. Acendimento por solid ink-900 mascarado nos glifos do `ai`, opacidade 100 a 0 em 150ms. |
| 21 | Botão `Cadastre-se` e linha de CTA | [AE] | **NOVO, do zero** | Retângulo raio 36, fill coral-600, rótulo Sora 700 56px branco. Reciclar `rrect()`. **4 a 6h.** **O atalho do roteiro anterior está morto:** `marketing\vinheta\out\vinheta-9x16-4k60-v2.mp4` foi aberto e conferido, e ele é **2160x3840 a 60fps sobre fundo escuro**, com **sombra projetada** debaixo do símbolo e um **cursor de mão amarelo** em quadro. Nada disso passa na régua desta leva, e o end card desta peça precisa ser papel `#FAF8F5` pra emendar com o frame 1 no loop do Reels. O end card é construído no AE e **serve os 6 criativos**, então as 4 a 6h amortizam. |
| 22 | Polimento | [AE] | Sim · `jsx\48-polimento.jsx` | Passe idempotente e reversível. **Usar só o `dotGrid()` se necessário e o controle de grain. Não aplicar `sombra()` nem `brilho()`** (linhas 25 e 34): esta peça não tem sombra decorativa e o único glow autorizado é o `brand-glow` do end card. |
| 23 | Locução | Áudio | **NOVO** | ElevenLabs Multilingual v2, guia de fraseado em `marketing\audio\Narração\narracao-elevenlabs-escalada.md` (verificado, existe). Gravar as 7 falas mais a frase opcional em takes separados. Plano B: Voiceover da Higgsfield a 1,35 créditos por trecho, o que gastaria cerca de 11 dos 96,62 créditos reservados aos criativos 2 a 6. Preferir ElevenLabs. |
| 24 | Trilha | Áudio | Sim, verificado · `marketing\filme\escalada\audio\Trilha\stems\A Step Ahead - Experia\` | Os 4 stems (BASS, DRUMS, INSTRUMENTS, MELODY) estão extraídos. Envelope por camada: bass e drums no empilhamento, mais instruments a partir de 5,20, cheio na grade, melody e bass a partir de 10,40, só melody a partir de 13,55, **mudo de 16,50 a 16,80**, acorde de resolução no end card. **Sem sidechain**, música 5,9 dB abaixo da voz, constante, por decisão do Pedro. |
| 25 | SFX | Áudio | **NOVO** · confirmado que `marketing\audio\sfx\` não existe | 24 eventos: 7 tapas de papel em escala ascendente, 7 ticks de UI, 1 click de "off" (congelamento da sétima), 1 whoosh de leque, 7 whooshes de saída, 1 riser grave, 1 tick macio da oitava assentando, 1 tick do acendimento, 1 POP de papel, 1 ding de marca, 1 click de botão. Reescrever o sintetizador em numpy (3 a 5h) ou baixar via `marketing\pipeline\sfx.mjs` (existe). |
| 26 | Higgsfield | [HIGGSFIELD] | **ZERO planos.** | Esta peça é tipografia, telas reais e SVG. Não há um único elemento que a IA pudesse fazer melhor, e a regra 1.12 proíbe justamente o miolo dela. **Custo de crédito: 0,00.** Os 96,62 créditos ficam inteiros pros criativos 2 a 6. |

---

## Render e entrega

`aerender` sempre com `-mfr OFF 100`. **Nunca saída direta de mp4 pelo AE**, o encoder H.264 do MediaCore está quebrado nesta máquina: sequência TIFF com alfa em chunks de 40 frames, ffmpeg converte e apaga incremental, depois concat. Validar cada bloco por `count_frames` **no mp4**, nunca contando TIFs. 600 frames em 1080x1920 é peça leve: 3,5 a 4,5 minutos de render mais 40s de mux.

**Bloqueio duro anterior a tudo, reconferido agora: o volume `C:` tem 1,1 GB livres de 111 GB, e não 1,8 GB como estava anotado. O alvo mínimo é 30 GB. Nada roda antes disso.** O número piorou desde a última medição, então liberar espaço é a primeira tarefa da produção, não a última.

---

## Notas de conformidade

1. **Coral no palco: um só na peça inteira**, a palavra `ainda`, item 2 da lista fechada (palavra veredito). O teto de uma peça de 20s é 3. Sobram 2 não usados de propósito. O botão e o AI do end card não contam.
2. **Coral nunca acende ao mesmo tempo em dois lugares.** Em 14,50 o coral **muda de lugar**: a legenda devolve `porta` pra ink-900 no exato frame em que a tela acende `ainda`. Um foco por frame, sempre.
3. **Zero azul em quadro.** As seis telas info-blue vão pra monocromático quente antes de entrarem. Isso não é estética, é a regra 1.3.
4. **Crimson na peça: zero.** A dessaturação também come o crimson do `painel_recusa`. **Recusa não é erro**, então nenhum micro-label meu é crimson e nenhum sinal de erro entra em quadro.
5. **Âmbar:** a oitava tela carrega um ícone e um headline em âmbar (`Ainda não, por enquanto`), que é estado real do produto dentro de tela real do produto, autorizado pela regra 1.17. Ele fica em quadro 1,0s a 34% (ilegível, 20,4px) e some quando a máscara fecha em 11,40. Nunca coexiste com o coral.
6. **As sete recusas são textura assumida.** Corpo da UI em 12,5px no empilhamento e 5,8px na grade, muito abaixo do piso de 30. É a rota autorizada pela regra 2.8: tela ilegível com micro-label nomeando o que ela é. **A oitava é a única legível, em 38,1px**, e é a única colorida. Essa dupla assimetria é a dramaturgia.
7. **Hook mudo de verdade.** A âncora `não` está em opacidade 100 no frame 0, sem entrada. A régua exige que nada fique abaixo de 60% nos primeiros 6 frames, e um fade de entrada quebraria isso. A peça abre ligada.
8. **O anel coral de 1 frame que o conceito original pedia foi substituído.** A regra 5.5.7 proíbe strobe, piscada e flash coral, e um anel de 1 frame é uma piscada. O gesto do snap virou **congelamento de 8 frames mais mudança de cor em 150ms mais tick**, duas vezes na peça, e é o gesto número 4 do vigia.
9. **Nada de dissolve.** O único movimento contínuo que reenquadra é o push da oitava, que é escala mais máscara no mesmo layer, não uma transição.
10. **Zero menção a** fidelidade, multa, certificado digital, taxa da Junta, DAE, TTRT, prazo de abertura, garantia, incondicional, letra miúda, pegadinha, preço, plano, data, cobertura geográfica, concorrente e claim esticado.
11. **A peça vende uma coisa só** (entrar na lista) com um CTA só (`Cadastre-se`).
12. **O alvo do humor é a marca.** "Com capricho, inclusive." é a marca rindo de ter caprichado em escrever recusa. "O limite é meu, não seu." é a marca assumindo a culpa. Nenhuma linha ri de quem assiste.

---

## Contagem de palavras faladas

| Fala | Texto exato | Palavras | Janela | Entrega |
|---|---|---|---|---|
| V1 | "Eu escrevi sete telas pra dizer não." | 7 | 1,20 a 3,80 | 2,7 p/s |
| V2 | "Com capricho, inclusive." | 3 | 4,30 a 5,45 | 2,6 p/s |
| V3 | "O limite é meu, não seu." | 6 | 6,20 a 8,40 | 2,7 p/s |
| V4 | "Essa é a oitava." | 4 | 10,50 a 11,98 | 2,7 p/s |
| V5 | "A única que não fecha a porta." | 7 | 12,20 a 14,80 | 2,7 p/s |
| V6 | "A parte importante é o ainda." | 5 | 14,85 a 16,50 | 3,0 p/s |
| V7 | "Entra na lista. Eu te aviso." | 6 | 18,00 a 19,90 | 3,2 p/s |
| **Base** | | **38** | 20,00s | **1,90 palavras por segundo** |
| V8 opcional | "Vai, legaliza aí." | 3 | 16,75 a 17,68 | 3,2 p/s |
| **Com a frase** | | **41** | 20,00s | **2,05 palavras por segundo** |

**Checagem contra a régua de 2,1:** as duas versões passam. A base fica 9,5% abaixo do teto e a versão com a frase fica 2,4% abaixo. A sobra de silêncio de fala **não foi gasta no hook nem no CTA**: ela está toda no quadro do meio, especificamente nos 1,85s de display mudo (8,40 a 10,25) e nos 300ms de silêncio antes do end card. A primeira fala entra em 1,20s, nunca em 0. **Nenhuma fala repete o que está em display:** a tela diz `não`, a voz diz quem escreveu; a tela diz `fingir que abre é pior`, a voz não diz nada.

**Auditoria de ritmo, evento a evento.** Nenhum intervalo da peça passa de 1,2s sem micro-evento. O maior é 1,05s (18,95 a 20,00). O segundo maior é 1,00s (5,20 a 6,00, resolvido por ter quebrado "com capricho, inclusive." em duas respirações) e 0,90s (18,05 a 18,95). O único trecho deliberadamente parado é o silêncio de 300ms antes do end card.

---

## Variação de corte

### Corte de 15,00s (450 frames), o principal

O argumento sobrevive inteiro porque nada da espinha sai: hook, contagem, congelamento, buraco, reversão, `ainda`, end card. O que sai é gordura de respiro.

| O que muda | De | Para | Ganho |
|---|---|---|---|
| Cadência do empilhamento | 18 frames por tela | **12 frames por tela** | 1,20s |
| **Sai a fala V2** e as respirações R3 e R4 | 1,90s | 0,90s | 1,00s |
| Grade fica menos tempo em pos A | 2,00s | **0,80s** | 1,20s |
| Hold do parágrafo com push-in | 3,10s | **2,10s** | 1,00s |
| Hold depois do acendimento | 1,43s | **0,90s** | 0,53s |
| End card | 3,20s | **2,60s**, hold de botão em 1,80s (o mínimo) | 0,60s |

**O que NÃO pode sair no corte de 15s:**
- **A fala V3 `O limite é meu, não seu.` e a respiração R6.** É o único antídoto contra o risco número 1: o espectador concluir em 4 segundos que o produto não é pra ele. **O roteiro anterior autorizava sacrificar V3 numa variante "pra Persona A pura". Isso está revogado.** Uma peça que mostra sete recusas sem dizer de quem é o limite é uma peça que ri de quem assiste, e isso reprova pelo canon do arquétipo. Se o teste indicar que o humor retém mais, o A/B é **no hook**, nunca no antídoto.
- Os 300ms de silêncio antes do end card.
- Os dois congelamentos de 8 frames.
- O slot vazio na grade, que é o mecanismo da reversão inteira.
- A dessaturação das sete.

As respirações R9, R10 e R11 **não fundem** no corte de 15s: fundidas dariam 7 palavras num bloco e o teto é 5. Só encurtam as janelas.

### Corte de 6,00s (180 frames), bumper de retargeting

Empilhamento das sete a 6 frames cada (0,00 a 1,40), congelamento de 8 frames, corte seco pro crop do parágrafo já em escala final (1,80 a 3,80), acendimento do `ainda` em 3,20, silêncio de 200ms, end card de 1,80s com logo, AI acendendo e botão. Zero locução.

**Correção obrigatória sobre o roteiro anterior:** ele previa "zero legenda queimada além de uma linha só em 4,60", o que deixaria 4,6 segundos de peça sem legenda e sem hook em texto. Isso quebra duas regras duras de uma vez (legenda do primeiro ao último quadro, e hook mudo legível no frame 1). O bumper passa a carregar:

| # | Janela | Texto | Coral |
|---|---|---|---|
| B1 | 0,00 a 1,80 | `sete telas pra dizer não.` | **sete** coral-600 |
| B2 | 1,80 a 3,20 | `essa é a oitava.` | **oitava** coral-600 |
| B3 | 3,20 a 4,20 | `a que não fecha a porta.` | nenhuma |
| B4 | 4,20 a 6,00 | `entra na lista.` | nenhuma |

A âncora `não` em 260px entra no frame 0 em opacidade 100 e sai em 1,40. É a variação mais barata de renderizar do lote, porque reusa todos os layers do master sem um único asset novo.

### Duas versões de hook pro mesmo corpo, e isso é o ativo estratégico da peça

Como tudo aqui é jsx mais JSON, trocar o hook custa minutos de render e não horas de autoria.

- **Hook A**, o da peça: `não` em 260px, ink-900, opacidade 100 no frame 0, com as sete telas acumulando por trás.
- **Hook B**: a grade 4x2 já montada no frame 0, sete preenchidas e uma vazia, com a legenda `sete telas pra dizer não.` por cima e o contorno do slot vazio **se desenhando uma vez em trim path de 150ms, e depois parado**. O roteiro anterior pedia esse contorno "pulsando", o que é pulso infinito e cai direto na proibição 5.5.11. Um trim path único entrega a mesma leitura ("falta uma") sem quebrar a régua.

Hook B entrega o buraco visualmente em vez de aritmeticamente, e serve pra medir se o público responde melhor a contagem ou a lacuna. Deixe o Meta decidir.

---

## Ressalvas e pendências

1. **Conteúdo ilegível dentro das telas reais.** Três das sete recusas carregam texto que a marca não usaria numa superfície nova: `veredito_descartado` tem um travessão, `saida_socios` e `veredito_nao-atende` enquadram a Legalizai como frente de um escritório tradicional, e `painel_recusa` nomeia a Junta Comercial. **Nada disso passa de 12,5px em quadro**, e a dessaturação remove todos os sinais de cor, mas o material está lá no pixel. Mitigado por ordenação (as piores enterradas, a mais limpa no topo e no congelamento) e por conferência obrigatória em `see-frame` antes do render. **Se o Pedro quiser risco zero, a alternativa é redesenhar sete cartões vetoriais no AE imitando a silhueta das telas, o que custa 3 a 4h e perde o argumento de "tela real do produto".** Recomendo manter as telas reais.
2. **Tamanho da âncora.** A régua tem duas leituras: a tabela 2.3 põe palavra veredito entre 200 e 260px, e o checklist do bloco D aceita âncora entre 200 e 420px. O roteiro anterior usava 360px. **Adotei 260px**, o teto da leitura mais restritiva, porque é a única que passa nas duas. Se o Pedro achar o hook pequeno em teste de celular, subir pra 300px é uma decisão dele, não minha.
3. **A frase `Vai, legaliza aí.` continua pendente de validação explícita do Pedro.** A peça funciona idêntica com e sem ela: mesmo projeto, mesmos keyframes, só o WAV de locução muda. O acendimento do AI está fixado em f528 nos dois casos.
4. **Sidechain.** O canon de vídeo do brand book pede trilha com sidechain; a nota de produção diz que o Pedro travou "sem sidechain, 5,9 dB abaixo da voz, constante". Segui a decisão do Pedro. Se essa decisão não estiver travada, ela precisa entrar no ADR.
5. **Bloqueio de disco.** 1,1 GB livres contra 30 GB de alvo. Nenhuma linha desta lista de produção pode começar antes disso.

---

## Auditoria do guardian

### Verificado e aprovado

- **Mascote:** zero ocorrência em quadro, em qualquer forma. Zero planos de IA generativa na peça, então zero risco de alucinar um animal. O `PRE-mascote` foi localizado em `20-precomps.jsx` linhas 112 a 123 e a lista de produção manda deletá-lo do template vertical.
- **Alma da marca presente sem o mascote:** 1ª pessoa em 6 das 7 falas e em 5 das 15 respirações; instinto de vigia em dois congelamentos, na varredura da grade e na legenda que antecipa a voz nos dois pontos que importam; temperamento aliado em "o limite é meu, não seu"; humor mirando a própria marca.
- **Travessão:** zero no roteiro, na locução, nas 15 respirações, nos micro-labels, no nome do arquivo e na copy do Meta. O único travessão do universo desta peça mora dentro de dois assets e ambos foram tratados (crop no oitavo, enterro e ilegibilidade no `veredito_descartado`).
- **Mote A limpo:** zero preço, zero rótulo de plano, zero super de condição, zero data, zero cobertura geográfica. Confere com a regra 1.21 (o mote A evita o tema) e por isso `saida_fora-bh.png` ficou de fora das sete de propósito.
- **Escassez:** nenhuma. O contador conta telas, para em `7 DE 7` e some. Nenhum countdown, relógio, barra ou contagem de vaga.
- **Concorrente:** zero nome, cor, logo, silhueta ou comparação implícita.
- **Garantia:** as palavras "garantia", "incondicional", "letra miúda", "pegadinha" e "surpresa" não existem na peça.
- **Claim não esticado:** nenhum "resolve sozinho", "nenhum humano", "totalmente automático". Ao contrário, a peça inteira admite limite.
- **Hook mudo:** carrega em texto grande no frame 0 e funciona com som desligado.
- **CTA na tela:** `entra na lista.` na legenda, `Eu te aviso quando abrir.` no end card e `Cadastre-se` no botão.
- **Sora em tudo**, `Sora-wght.ttf` confirmada em `marketing\filme\escalada\tools\`.
- **Higgsfield:** zero planos, 0,00 crédito. Muito abaixo do teto de 2 a 3 na leva inteira.
- **Coral em `não` na respiração R2:** litigado e **liberado**. A regra 1.4 proíbe coral em erro, prazo perdido, multa e vencimento. `não` aqui é a palavra da própria marca sobre a própria recusa, e o Sistema 1 da régua autoriza uma palavra forte coral por respiração como ritmo de leitura. Fica registrado pra não ser reaberto.
- **Cor da palavra forte:** o rig `32-lettering.jsx` com `tema:"papel"` e `duasCores:true` resolve o coral em `[221,78,39]`, que é coral-600, o valor correto pro mundo papel. Verificado no código, linhas 24 a 29.
- **Tokens no pixel:** o papel das telas reais foi medido e bate exatamente em `#FAF8F5`, e o hairline dos cards bate exatamente em `#E3DED7`. O mundo da peça e o mundo do produto são o mesmo mundo.

### Corrigido

1. **Seis das sete telas eram info-blue e a sétima carregava crimson mais um botão coral.** Os primeiros 10 segundos da peça tinham azul como cor de acento dominante, e o botão coral do `painel_recusa` competia com o único acendimento autorizado do palco. **Correção: dessaturação quente das sete, com a oitava ficando em cor cheia.** A correção não enfraquece o criativo, fortalece: a oitava passa a ser a única legível **e** a única colorida.
2. **O congelamento estava na tela errada.** O roteiro anterior segurava `veredito_descartado`, que é a única das sete com um travessão real no corpo. **Correção: o congelamento e o topo da pilha passam pra `saida_cnpj-inapto`**, a única sem travessão, sem órgão nomeado, sem rótulo de plano e sem enquadramento de "braço do escritório tradicional". A ordem das sete foi reescrita em função disso.
3. **A banda da máscara cortava o card.** O roteiro pedia `y 1100`; medido no pixel, o hairline inferior do card branco está em `y 1125`. Um caco de 25px de card ficaria flutuando no topo do enquadramento. **Correção: banda `y 1136 a 1946`, 1290x810, resultando em 1023x642 em quadro.**
4. **O push de 600ms não existe na régua de motion.** 150, 250 e 400 são as três durações do sistema e o checklist do bloco F reprova qualquer outra. **Correção: 400ms.** O gesto fica mais seco e mais vigia.
5. **O crop tinha 4px de margem, não 29px.** Medido: o rótulo `CNAE pretendido` começa em `y ≈ 1954`. **Correção: crop em 1946**, alinhado com a banda da máscara.
6. **Duas corais simultâneas em 14,50.** A respiração `a porta.` estava com `porta` em coral até 14,85 enquanto a tela acendia `ainda` em 14,50, violando "um foco coral por frame no palco". **Correção: a legenda devolve o coral pra ink-900 nos mesmos 150ms em que a tela acende.** O coral não aparece, ele muda de lugar. Virou o melhor micro-momento da peça.
7. **Um bloco de legenda com 6 palavras.** `a parte importante é o ainda.` estava num bloco só e o teto é 5. **Correção: duas respirações.**
8. **Contorno pulsando no Hook B.** Pulso infinito, proibição 5.5.11. **Correção: trim path desenhando uma vez em 150ms e parando.** Mesma leitura, régua intacta.
9. **A âncora entrava com fade.** O checklist exige que nada fique abaixo de 60% de opacidade nos 6 primeiros frames, e um fade de entrada quebraria isso. **Correção: `não` em opacidade 100 no frame 0, sem entrada.**
10. **Âncora fora da banda tipográfica.** 360px estoura o teto de 260 da palavra veredito. **Correção: 260px**, com a ressalva 2 registrada.
11. **A frase promovida ao palco estava em 96 a 112px, tamanho que não existe no sistema** (a legenda é 60, a âncora é 200 a 420). **Correção: `fingir que abre` fica na faixa de legenda em 60px e `é pior.` vira âncora de 260px no palco.** As duas juntas formam a frase, a legenda nunca abre buraco, e a ideia de "a única frase que só existe escrita" fica intacta.
12. **O acendimento do AI não casava com a sílaba tônica.** O roteiro punha o acendimento em 17,20 e a tônica de "aí" em 17,60. **Correção: acendimento em f528 (17,60), slot da frase em 16,75 a 17,68, tônica em 17,60.** O par indivisível do ADR volta a ser indivisível, e o hold do botão continua em 1,95s.
13. **O congelamento oscilava entre 8 e 10 frames.** **Correção: 8 frames nos dois lugares.**
14. **Três buracos de ritmo acima de 1,2s** (4,50 a 6,00, 12,20 a 13,55 e 15,60 a 16,20). **Correção: "com capricho, inclusive." virou duas respirações, `a única que não fecha` virou duas, e a auditoria evento a evento está na seção de contagem de palavras.**
15. **O bumper de 6s ficava 4,6 segundos sem legenda e sem hook em texto.** Quebrava duas regras duras. **Correção: quatro respirações cobrindo os 6 segundos inteiros e a âncora no frame 0.**
16. **O corte de 15s autorizava sacrificar a fala V3.** O próprio roteiro dizia que V3 é o único antídoto contra o risco de o espectador concluir que o produto não é pra ele. Sem ela, uma peça que exibe sete recusas passa a rir de quem assiste. **Correção: revogado. O A/B é no hook, nunca no antídoto.**
17. **O atalho do end card estava morto.** `vinheta-9x16-4k60-v2.mp4` foi aberto e conferido: 2160x3840 a 60fps, fundo escuro, sombra projetada debaixo do símbolo e um cursor de mão amarelo em quadro. Reusá-lo quebraria a régua de sombra, a régua de cor e a emenda de loop do Reels. **Correção: end card construído no AE sobre papel, 4 a 6h, amortizado nos 6 criativos.**
18. **A grade não cabia no palco.** 4 colunas de 216px por 2 linhas de 468px dão 960px de altura num palco de 780px. **Correção: células 156x338, bloco 696x700 centrado em (540, 790).** Mesma coisa no empilhamento, que a 34% dava 951px de altura e transbordava pra faixa de legenda: **correção pra 26%.**
19. **As validações do gerador de legendas não param o build.** `fase3-gera-legendas.py` só faz `print` nas linhas 148 e 153, e a contagem de coral é por take em vez de por respiração. **Correção especificada no item 15 da lista de produção.**
20. **O bloqueio de disco estava desatualizado e otimista.** Medido agora: 1,1 GB livres, não 1,8. **Correção aplicada, com a nota de que o número está piorando.**
21. **`PRE-mascote` estava atribuído ao arquivo errado.** Está em `20-precomps.jsx`, não em `10-estrutura.jsx`. **Correção na lista de produção**, porque uma instrução de deleção que aponta pro arquivo errado é uma deleção que não acontece.
22. **"Último frame igual ao frame 1" era falso.** O fundo é o mesmo, o conteúdo não. **Correção: redação honesta**, o benefício real é não piscar luminância na emenda do loop.