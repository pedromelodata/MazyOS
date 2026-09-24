<!-- gerado pelo workflow legalizai-6-criativos-v2 em 24/08/2026 -->
<!-- conceito tensao-2 | veredito do guardian: aprovado com correcao -->

> **Correções aplicadas pelo guardian:**
> - GRAVE · Recorte A expunha `CNAE 8650-0/02` em anuncio pago. Abri o PNG real (`marketing/telas-app/veredito_waitlist.png`) e conferi: o codigo esta literal na tela. 8650-0/02 e uma atividade especifica e resolvivel (nutricao), entao o roteiro transformava um "ainda nao" categorico numa exclusao publica e verificavel de uma profissao inteira, sem aprovacao do Pedro, e amarrava a peca a um fato que muda no dia em que a esteira suportar atividade regulamentada. A regra 1.22 ainda fecha a lista de numeros autorizados em quadro. CONSERTO: recorte A encolhido de `crop=1200:740:45:396` para `crop=1200:390:45:560`, terminando no divisor do card e sangrando na base. Sobra `Atividade regulamentada` mais `Sua area precisa de responsavel tecnico registrado no conselho.`, que e a prova inteira, em forma categorica. A ideia nao perde nada: fica mais forte, porque o espectador nao consegue mais checar "sou eu?" e passa a ler politica de produto.
> - GRAVE · O mesmo recorte A carregava o titulo `Ainda nao, por enquanto` em ambar escuro e ficava a 15px do disco ambar com relogio. E o veredito NEGATIVO renderizado em laranja quente, em quadro por 3s, logo antes do unico acendimento coral da peca. Em 1080 comprimido por H.264, laranja quente e coral sao o mesmo hue pro olho, e a regra 1.4 e dura: coral e vizinhanca quente nunca marcam negativa. CONSERTO: o novo recorte ja exclui titulo e disco. Ambar e coral nao coexistem em nenhum frame da peca.
> - Travessao literal dentro do documento do roteiro. A linha da lista de producao que descrevia o campo a excluir grafava o em dash de verdade. A regra 1.1 vale pro roteiro entregue, nao so pro que vai em quadro. CONSERTO: trocado pelo codepoint `—` mais a palavra, que e alias exatamente o que o assert do item 6 precisa consumir.
> - Bloco de legenda queimada com 8 palavras. `essa frase e do PRODUTO, nao do anuncio.` era um bloco so. A regra 2.3 e o bloco D do checklist travam maximo 5 palavras por bloco. CONSERTO: partido em dois blocos de 1 linha, `essa frase e do PRODUTO,` e `nao do anuncio.`, ambos em ink porque `ainda` esta aceso no palco nessa janela.
> - `GUIA-safe` especificado como 864x1440 centrado em y=840 contradizia a safe area do canon: liberava y=120 e y=1560, os dois em zona morta do Reels, e estreitava a lateral pra 108 em vez dos 72 do sistema. Um guia errado erra as seis pecas da leva, nao so esta. CONSERTO: `GUIA-safe` 936x1320, x de 72 a 1008, y de 200 a 1520, centro em y=860.
> - Botao `Cadastre-se` abaixo do piso de hold. No build original ele entrava em 18,55 e a peca acabava em 20,00: 1,45s em quadro. O roteiro se defendia citando 2,80s "contando desde a entrada do logo", mas a regra 5.4 mede o hold do botao, nao do bloco. Numa peca de lead-gen o unico elemento de conversao ficava abaixo do minimo. CONSERTO: end card reconstruido. Botao entra em 17,70 e assenta em 17,97, ficando 2,03s legivel e parado, e 2,30s em quadro. O acendimento do `AI` passa a coexistir com o botao, o que a lista fechada do coral autoriza explicitamente no end card.
> - Quatro blocos fora da grade de frames. 13,85 cai em f415,5; a faixa 15,30 a 17,20 declarava 43 frames pra 1,45s; 17,75 cai em f532,5; e a saida em fade do espelho 1 (13,60 mais 250ms) estourava 3 frames alem do proprio corte. CONSERTO: timeline inteira re-snapada, todo limite em frame inteiro, soma fechando exatamente 600 frames.
> - O `modo apple` do rig esta fora da regua de motion, e o roteiro herdou isso sem perceber. Li o `32-lettering.jsx` real: Scale 3D 122 para 100 em 600ms, Opacity em 280ms, Text Blur 42 para 0 em 500ms, saida em 80ms. Nenhuma dessas quatro duracoes existe na regua 150/250/400, e a tabela 5.3 nao tem coluna de blur pra elemento nenhum. O roteiro escrevia "280ms" e "blur 24 para 0 em 400ms", ambos off-regua, e "Scale 3D 108 para 100", que entra por cima do alvo quando a tabela do canon so tem entrada por baixo. CONSERTO: apple parametrizado pra leva via `OPC.reguaLeva` (Scale 92 para 100 em 400ms, Opacity 0 para 100 em 250ms, saida em fade de 250ms sem movimento, blur removido), preservando a curva apple 28/92 que a regra 5.2 autoriza em ancora.
> - Display de frase rodava em dois tamanhos (76px e 80px) e nenhum dos dois existe na tabela de papeis do canon. CONSERTO: normalizado num unico papel, declarado no roteiro como `papel A-bis · display de frase, Sora 600, 76px`. Fica como ressalva formal: quem manda na regua precisa abencoar ou rejeitar o papel novo, porque as outras cinco pecas da leva vao pedir ele na primeira frase que nao couber em legenda.
> - Hook em 135px desperdicava a caixa. A regra 2.5 dimensiona pra caber em 936px, e `EU RECUSEI` em Sora 700 com tracking -2% cabe em 145px. CONSERTO: hook sobe pra 145px, `RECUSEI` ganha `wght` 800 enquanto `EU` e `ESSE CLIENTE` ficam em 700, e recalculei baselines (703 / 841 / 979) e a geometria da regua de revisor (x=317 a 993, y=728).
> - Baselines dos blocos de display estavam tratando baseline como centro optico. CONSERTO: recalculadas pela altura de capitular (0,70em). Espelho 1 em 773 e 860; espelho 2 em 817 (uma linha, centro optico real em 790); veredito e frase do produto em 686 / 773 / 860 / 947.
> - Pre-requisito de disco desatualizado e subestimado. O roteiro dizia 1,8 GB livres. Checado agora: 1,1 GB livres de 111 GB, volume em 100%. CONSERTO: numero real no documento e o pre-requisito promovido a bloqueante de abertura do AE.
> - Ambiguidade perigosa na pendencia do Pedro. "o slot inteiro vira hold do logo" podia ser lido como o acendimento do `AI` sumindo junto com a voz, e o acendimento e obrigatorio no end card em qualquer cenario. CONSERTO: escrito explicitamente que o acendimento e o `ding-check` ficam nos dois casos, no mesmo frame f552; o que sai e so a locucao.
> - Adicionado um snap de atencao de 3% em 150ms no f77, cravado na entrada de `eu olhei`. Nao e conserto de erro, e devolucao de alma: era o unico bloco de 3s da peca em que a camera nao se comportava como vigia, e o gesto custa um par de keyframes.
> - Claim de performance sem lastro. "e o que faz quem viu um criativo ficar ate o fim do proximo" afirma resultado sobre uma leva que ainda nao rodou. CONSERTO: reescrito como intencao declarada de assinatura sonora, nao como fato.
> - Contagem de palavras faladas re-medida na grade nova (corpo em 3,20 p/s) e o corte regua re-calculado com honestidade: ele leva a 2,53 p/s, nao aos 2,08 que o roteiro original prometia. Chegar em 2,10 exige matar uma respiracao inteira, e isso esta registrado como ressalva em vez de virar promessa falsa.
## CRIATIVO 6 :: Eu Recusei Esse Cliente

| | |
|---|---|
| **Mote** | A · institucional (sem preço, sem rótulo de plano, sem super de condição, sem data) |
| **Tom** | Híbrido. Sóbrio no motor, a única piada é a marca rindo de si mesma no fecho do argumento |
| **Persona** | B (quer sentir que tem alguém junto), com alcance na A |
| **Duração** | 20,00s · 600 frames |
| **Formato** | 9:16 · 1080x1920 · 30 fps · master H.264 via sequência TIFF em chunks e ffmpeg |
| **Pilar de funil** | Topo de funil com captura direta. Constrói caráter e converte em lead na mesma peça |
| **CTA em tela** | `entra na lista de espera` + botão `Cadastre-se` |
| **Botão do Meta** | `Cadastre-se` |
| **Créditos Higgsfield** | Zero. A peça é 100% tipografia e tela real de produto |
| **Versão** | v002 · auditada e corrigida pelo guardian em 24/08/2026 |

---

**A ideia em uma frase.**
A marca reconstitui a vez em que o próprio produto disse "ainda não" para um cliente, e no último terço vira o espelho: hoje quem está do lado de fora da porta, esperando, é ela.

---

**Por que para o dedo.**

O hook é uma confissão sem imagem. Frame 1 é papel quente inteiro com três palavras em caixa alta a 145px e nada mais: nenhum produto, nenhuma cor, nenhum objeto. No feed, onde tudo é imagem tentando vender, um cartaz de texto que diz `EU RECUSEI ESSE CLIENTE` é dissonância pura, e o buraco que ele abre é grande demais para ser ignorado: por que uma empresa que está pedindo cadastro anuncia que recusou alguém? Isso funciona congelado, funciona em miniatura no grid e funciona sem uma nota de som. O micro-evento chega no frame 10, quando uma régua de 3px se desenha por baixo de `RECUSEI` num trim path de 150ms, como marca de revisor.

A retenção é um loop de veredito. A peça entrega a consequência primeiro e esconde a causa, então o espectador fica pelo processo, e o processo é uma reconstituição que anda quase em tempo real com o corte caindo sempre antes da última sílaba. No segundo 6,90 tudo trava por 18 frames com 300ms de silêncio digital exatamente no ponto onde a resposta ainda não chegou. Aos 7,50 o primeiro loop fecha com uma reversão (a recusa não fechou a porta, guardou o nome) e imediatamente abre o segundo, que é o espelho, e esse fecha aos 17,00 com a marca admitindo que hoje ela é a que está esperando.

O risco declarado pelos júris é real: quem sai aos 6 segundos leva "eles não abrem a minha atividade". A mitigação está no build e é barata: **aos 5,40** a palavra `ainda` acende em coral-600 e ganha a mesma régua de revisor do hook, então mesmo quem sai cedo sai com `ainda`, não com `não`. Na v002 essa mitigação chega **0,40s mais cedo** que no build original, e o recorte da tela deixou de nomear uma atividade específica, o que tira do ar a leitura "não é pra você" e devolve a leitura "é política do produto".

---

**Onde mora a alma da marca.**

A primeira pessoa domina o quadro do frame 1 ao 509 sem nenhum dono visual, que é exatamente o pedido do Pedro: a persona sem o corpo. As frases que carregam ela são `EU RECUSEI ESSE CLIENTE` no hook, `eu guardei o nome dele.` na reversão e `eu prefiro te dizer ainda não do que te vender um sim que eu não cumpro.` no veredito, e as três estão em display grande, não só na voz, porque o Meta roda mudo.

A câmera age como vigia em três lugares: no **snap de atenção de 3% no f77**, cravado na palavra `olhei`, que é o bicho levantando a cabeça; no **congelamento de 18 frames aos 6,90**, que é o bicho que trava antes de avisar o bando; e no **corte que antecipa**, com cada emenda caindo antes da última sílaba, de modo que o espectador é levado e não acompanha.

O alvo do humor é a própria marca e só ela: a Legalizai faz piada com o fato de estar hoje na mesma fila que ela inventou, e o cliente recusado é tratado com respeito do começo ao fim, nunca como caso perdido, nunca como quem errou. Em nenhum frame a peça ri de quem assiste nem da dúvida de quem assiste.

---

## Roteiro quadro a quadro

Fundo é papel quente `#FAF8F5` do frame 0 ao 599, sem uma única exceção. Não existe fade para preto, não existe dissolve, e o último frame casa com o primeiro para o Reels reiniciar sem emenda. Grain de 1,5% em adjustment layer sobre a comp inteira (`PRE-grade-grain`), projeto em 16bpc.

**Grade de blocos (600 frames, soma exata):**

| Bloco | Janela | Frames | Duração |
|---|---|---|---|
| Hook | 0,00 a 0,80 | f0 a f23 | 0,80 |
| Transição | 0,80 a 1,20 | f24 a f35 | 0,40 |
| Recorte A | 1,20 a 4,20 | f36 a f125 | 3,00 |
| Frase do produto | 4,20 a 5,40 | f126 a f161 | 1,20 |
| Acendimento de `ainda` | 5,40 a 6,90 | f162 a f206 | 1,50 |
| Congelamento | 6,90 a 7,50 | f207 a f224 | 0,60 |
| Reversão (recorte B) | 7,50 a 8,10 | f225 a f242 | 0,60 |
| Display do nome guardado | 8,10 a 10,70 | f243 a f320 | 2,60 |
| Espelho, respiração 1 | 10,70 a 13,10 | f321 a f392 | 2,40 |
| Espelho, respiração 2 | 13,10 a 14,90 | f393 a f446 | 1,80 |
| Veredito | 14,90 a 17,00 | f447 a f509 | 2,10 |
| End card | 17,00 a 20,00 | f510 a f599 | 3,00 |

---

| Tempo | Imagem (o que se vê) | Origem | Áudio e voz | Texto de destaque na tela | Som e trilha |
|---|---|---|---|---|---|
| **0,00 a 0,80**<br>f0 a f23 | Papel quente no quadro inteiro. Bloco de três linhas centradas, baselines em y=703, 841 e 979, centro óptico do bloco em y=790. Zero movimento, zero coral, zero imagem. O bloco está 100% opaco já no frame 0 (o feed decide no quadro estático, então nada de fade de entrada). Régua de revisor de 3px em ink-900 se desenha da esquerda para a direita por baixo de `RECUSEI`, **x=317 a x=993, y=728**, trim path de 150ms (f10 a f15) ease-out. Depois, 8 frames de hold absoluto. É o primeiro dos três usos do device na peça. Micro-label no canto superior esquerdo, x=72, baseline y=320. | [AE] | Silêncio. Nem room tone. | **`EU RECUSEI`**<br>**`ESSE`**<br>**`CLIENTE`**<br>Sora · **145px** · line-height 0,95 (138px) · tracking -2% · ink-900 `#1B1E24` · centralizado em xc=540 · largura da linha 1 = 906px<br>**`EU` e `ESSE CLIENTE` em `wght` 700 · `RECUSEI` em `wght` 800**<br><br>`TELA DO APP · VEREDITO`<br>Sora 500 · 32px · CAPS · tracking +8% · texto terciário `#736E67`<br><br>A régua não é hairline de card, é rasura tipográfica, por isso ink-900 e não `#E3DED7`. | O silêncio absoluto no frame 0 é intencional. O primeiro som chega em f10 e é físico: **SFX `tick-caneta`**, seco, 40ms, sem cauda. Nunca uma palavra. |
| **0,80 a 1,20**<br>f24 a f35 | Corte de camada, não de plano. O bloco do hook sai em fade de 250ms sem nenhum movimento (100 para 0 de opacidade, f24 a f32). Ao mesmo tempo, o recorte A entra de baixo em 400ms ease-out: y de +48 para 0, escala de 92 para 100 (f24 a f36). Micro-label do topo permanece. O fundo nunca troca, então isto não é dissolve de plano. | [TELA APP]<br>`marketing/telas-app/`<br>`veredito_waitlist.png`<br>+ [AE] | **`"ele veio abrir empresa comigo."`**<br>entra em 1,00 (f30) | O micro-label `TELA DO APP · VEREDITO` continua em y=320. Ele está atribuindo a fonte do que vem em quadro, e é isso que valida o rótulo desde o frame 1. | **SFX `papel-desliza`** em f24, 260ms, com corpo grave curto. Entra a cama de trilha: só o stem `INSTRUMENTS` de *A Step Ahead*, 22 dB abaixo da voz, sem drums, sem bass. |
| **1,20 a 4,20**<br>f36 a f125 | O recorte A assenta em f36 e roda com push-in contínuo de 2% até 4,20, uma direção só, sem keyframe visível. Em quadro, **só isto**: a borda superior do card branco, o título `Atividade regulamentada`, as duas linhas `Sua área precisa de responsável técnico registrado no conselho.`, e o divisor. O card **sangra na base**, igual como já sangra na largura, o que lê como recorte de detalhe deliberado e não como erro. Corpo do card em quadro: **47,6px**, acima do piso de 44.<br><br>**f77 (2,57): snap de atenção.** O recorte salta +3% em 150ms ease-out e trava. É o vigia levantando a cabeça, e cai exatamente na entrada de `eu olhei`. | [TELA APP] + [AE] | **`"ele veio abrir empresa comigo."`**<br>1,00 a 2,55<br><br>**`"eu olhei a atividade dele."`**<br>2,60 a 4,15 (a fala atravessa o corte de 4,20, que é o corte que antecipa) | Nenhum destaque em AE. Todo o texto do palco aqui é a tela real, e é isso que dá a prova. A legenda queimada roda na sua faixa (ver seção Legenda queimada) e é ela que sustenta o fluxo de micro-eventos deste bloco, palavra a palavra. | **SFX `assenta-card`** em f36, click abafado de 90ms.<br>**SFX `snap-atencao`** em f77: sopro de ar de 90ms, muito baixo, sem transiente duro.<br>Trilha em cama, sem evento. |
| **4,20 a 5,40**<br>f126 a f161 | Corte seco. O recorte A sai de quadro para baixo em 250ms com ease de saída acelerada e o palco fica limpo por 4 frames (f126 a f129). A frase do produto entra **redigitada em Sora**, alinhada à esquerda em x=72, quatro linhas, baselines 686, 773, 860 e 947. Entra em modo apple **na régua da leva**, por linha: Scale 3D 92 para 100 em 400ms, opacidade 0 para 100 em 250ms, **sem blur**, curva apple (entrada com influência 28%, chegada com influência 92%), stagger de 90ms entre linhas (f130 / f133 / f136 / f139; última assenta em 4,90). Micro-label do topo troca em corte para a atribuição. | [AE] | **`"essa frase é do produto,`**<br>**`não do anúncio."`**<br>4,35 a 6,80 | `a gente `**`ainda`**` não abre`<br>`esse tipo sozinho,`<br>`e não vamos fingir`<br>`que abre.`<br>**Papel A-bis · display de frase** · Sora 600 · 76px · line-height 1,15 (87px) · alinhado à esquerda em x=72 · ink-900 `#1B1E24` · linha mais larga 869px<br><br>`TELA DO APP · TEXTO ORIGINAL`<br>Sora 500 · 32px · CAPS · tracking +8% · `#736E67` | **SFX `digita`**: 4 ticks de teclado muito baixos, um por linha, em f130 / f133 / f136 / f139. Trilha sem mudança. |
| **5,40 a 6,90**<br>f162 a f206 | **O único acendimento de coral do palco na peça inteira.** A palavra `ainda` da linha 1 muda de ink-900 para coral-600 `#DD4E27` em 150ms (f162 a f167) e o eixo `wght` sobe de 600 para 700 no mesmo intervalo. Em **f168 a f173**, régua de revisor de 3px ink-900 se desenha por baixo dela em 150ms, **x=388 a x=586, y=711** (segundo uso do device). Hold de 1,00s com push-in contínuo de 2%, então o quadro está parado mas nunca morto, e a legenda queimada segue rodando por cima. | [AE] | Continuação de **`"essa frase é do produto, não do anúncio."`** até 6,80 | Mesmo bloco, com `ainda` agora em coral-600 `#DD4E27` em `wght` 700. Régua ink-900 3px por baixo, largura exata da palavra. | **SFX `snap-coral`** em f162: clique curto de 60ms com um sopro de ar de 120ms atrás. É o snap de atenção do vigia. Trilha segura. |
| **6,90 a 7,50**<br>f207 a f224 | **O congelamento.** 18 frames sem um único pixel se mexendo. Push-in desligado, texto travado, grain congelado no mesmo campo. É o único trecho da peça sem micro-evento, e ele é intencional: chega 0,10s depois da última sílaba, então o silêncio lê como a resposta que não veio, e não como buraco de edição. | [AE] | Nada. | Mesmo bloco, travado. | **Silêncio digital absoluto de 7,00 a 7,30 (f210 a f219)**, todas as camadas em zero, inclusive a cama de trilha. Antes e depois, cauda natural. |
| **7,50 a 8,10**<br>f225 a f242 | **A reversão.** Corte seco. Entra o segundo recorte da mesma tela, agora a região do formulário, de baixo em 400ms ease-out (f225 a f237), y de +48 para 0, escala de 92 para 100. Sangra na largura (x 0 a 1080), topo em y=400, base em y=846. Em quadro: `Seu nome` com o campo, `WhatsApp ou e-mail` com o campo. **Fora de quadro obrigatoriamente:** o campo `CNAE pretendido` (contém o `—` literal no print) e o botão desabilitado. | [TELA APP]<br>`veredito_waitlist.png`<br>+ [AE] | **`"não é não."`**<br>7,75 a 8,50 | Nenhum destaque ainda. O micro-label do topo volta para `TELA DO APP · VEREDITO`, e é ele que impede a leitura errada de que este formulário é o da campanha. Ele é do produto. | **SFX `papel-desliza`** em f225, mesma amostra do f24 para amarrar a rima. Trilha volta 2,6 dB abaixo do que estava antes do silêncio. |
| **8,10 a 10,70**<br>f243 a f320 | O display da marca entra por cima, abaixo do recorte, duas linhas centradas, baselines y=990 e y=1074. Linha 1 entra em 8,10 (f243), linha 2 em 8,80 (f264), cada uma em 250ms ease-out com y de +32 para 0; o bloco assenta em 9,07. Em **f297 (9,90)**, régua de revisor de 3px ink-900 se desenha por baixo de `o nome dele.` em 150ms, **x=521 a x=995, y=1099**: terceiro e último uso do device, fechando a trilogia hook / ainda / nome. Display legível e parado por 1,63s. | [AE] + [TELA APP] | **`"é ainda não."`**<br>8,80 a 10,00 | `eu não fechei a porta.`<br>`eu guardei o nome dele.`<br>Papel A-bis · Sora 700 · 76px · line-height 1,10 (84px) · centralizado em xc=540 · ink-900 `#1B1E24` · largura máx. das duas linhas 909px | **SFX `tick-caneta`** em f297, mesma amostra do f10. Trilha em cama. |
| **10,70 a 13,10**<br>f321 a f392 | **O espelho.** Corte seco para papel limpo, palco totalmente vazio por 6 frames (f321 a f326). Aos 10,90 (f327) entra a linha 1 em modo apple, e aos 11,17 (f335) a linha 2; o bloco assenta em 11,44 e fica **1,20s parado**. Sai em fade de 250ms a partir de 12,64 (f379), completo em f387, sem movimento. Daqui até 17,00 não existe segunda camada de texto em quadro: o display é, ao mesmo tempo, o destaque e a legenda queimada. | [AE] | **Mudo.** A voz não volta até o slot do end card. | `hoje quem está do outro`<br>`lado dessa tela sou eu.`<br>Papel A-bis · Sora 600 · 76px · line-height 1,15 (87px) · centralizado · baselines y=773 e y=860 · ink-900 `#1B1E24` · `eu` em `wght` 700 · **zero coral** | **SFX `pop-papel`** em f321, 4 frames, com um sub grave curto. Entram os stems `MELODY` mais `INSTRUMENTS`, ainda sem drums. A peça não usa drums em nenhum momento. |
| **13,10 a 14,90**<br>f393 a f446 | Segunda respiração, uma linha só, **baseline y=817**, o que põe o centro óptico da linha exatamente em y=790. Entra em modo apple em 13,13 (f394), assenta em 13,40, fica **1,20s parado**, sai em fade de 250ms a partir de 14,60 (f438), completo em f446. É a linha mais factual da peça e por isso é a que fica sozinha no centro. | [AE] | Mudo. | `o app ainda não abriu.`<br>Papel A-bis · Sora 600 · 76px · centralizado · ink-900 · `abriu` em `wght` 700 · zero coral · 869px de largura | Trilha sustenta. Nenhum SFX: a linha é factual e não merece efeito. |
| **14,90 a 17,00**<br>f447 a f509 | **O veredito.** Caixa de 4 linhas reservada desde o início para não haver reflow. As linhas 1 e 2 entram em 14,97 (f449) e as linhas 3 e 4 em 15,50 (f465), ambas em modo apple de 250ms; o bloco assenta em 15,77 e fica **1,23s parado**. Baselines y=686, 773, 860 e 947. Push-in contínuo de 3% de 14,97 até 17,00, uma direção só. Em 16,70 a trilha começa a cair. | [AE] | Mudo. | `eu prefiro te dizer`<br>`ainda não`<br>`do que te vender um sim`<br>`que eu não cumpro.`<br>Papel A-bis · Sora 600 · 76px · line-height 1,15 · centralizado · ink-900 `#1B1E24` · `ainda não` e `cumpro` em `wght` 700 · **zero coral** · linha mais larga 909px | Swell de +2,6 dB em 14,97. Fade de trilha de 300ms começando em 16,70 (f501), terminando em silêncio absoluto em 17,00. |
| **17,00 a 18,10**<br>f510 a f542 | **End card, bloco padrão da leva.** POP de papel em 4 frames (corte, não dissolve). O lockup entra em 400ms ease-out (f510 a f522), y de +48 para 0, escala de 92 para 100, e assenta em 17,40. Não cresce, não gira, não estica. Largura 560px, centrado, centro vertical em y=700.<br>Em **17,50 (f525)** entra a linha de CTA em 250ms, baseline y=900.<br>Em **17,70 (f531)** entra o botão em 250ms, retângulo de 520x132 centrado em xc=540, topo y=960, raio 36; assenta em 17,97.<br>**Botão em quadro 2,30s, legível e parado 2,03s**, acima do piso de 1,8s. | [SVG]<br>`identidade/logos/`<br>`legalizai-logo-horizontal.svg`<br>+ [AE] | Silêncio herdado do 16,70. | Wordmark `Legalizai` no estado de repouso, com o `ai` na cor do arquivo master.<br><br>`entra na lista de espera`<br>Sora 600 · 44px · texto secundário `#524E48` · centralizado<br><br>**`Cadastre-se`**<br>Sora 700 · 56px · branco `#FFFFFF` · fill coral-600 `#DD4E27` · raio 36 · sem sombra, sem pulso, sem seta | **SFX `pop-papel`** em f510 e **`carimbo`** em f522, grave e curto, quando o lockup assenta. **SFX `clique-ui`** em f539 quando o botão assenta. Trilha volta só como nota longa sustentada. |
| **18,10 a 18,90**<br>f543 a f567 | **Slot de 0,8s (24 frames).** O `AI` do wordmark acende em coral-500 `#F2643C` em 150ms em **18,40 (f552)**, com o `--gradient-brand-glow` subindo junto no mesmo intervalo. É o único glow autorizado na peça. O botão e a linha de CTA já estão em quadro e continuam: a lista fechada do coral autoriza explicitamente `AI` e botão coexistindo no end card.<br>**Se a frase falada não for validada pelo Pedro: só a locução sai. O acendimento em f552 e o `ding-check` FICAM, no mesmo frame, sem retiming e sem reescrita de nada.** | [AE] + [SVG] | **`"Vai, legaliza aí."`**<br>18,15 a 18,85, com o acendimento cravado na sílaba tônica do `aí` em 18,40 | Wordmark com o `AI` aceso em coral-500 `#F2643C`. Botão e CTA inalterados. | **SFX `ding-check`** em f552, o sino da marca. É a assinatura sonora que a leva vai compartilhar entre as seis peças. |
| **18,90 a 20,00**<br>f568 a f599 | Hold limpo do end card com o botão em quadro. Nada entra, nada sai, nada pulsa. Esta imobilidade é exigida pela régua do hold do botão e sobrepõe a regra dos 1,2s sem micro-evento, por decisão explícita (ver Ressalvas). Último frame é papel quente idêntico ao frame 0, para o loop do Reels não mostrar emenda. | [AE] | Silêncio depois de 18,85. | Mesmo quadro: lockup com `AI` aceso, linha de CTA e botão `Cadastre-se`. | Cauda de trilha até 19,70 (f591) e silêncio nos últimos 9 frames. |

---

## Legenda queimada

Faixa de mote A: bloco de uma linha ancora a baseline em **y=1440**; bloco de duas linhas usa **y=1365 e y=1440**, e cresce para cima. Sora 600, 60px, line-height 1,25 (75px), tracking -1%, centralizado em xc=540, largura máxima 880px, **máximo 2 linhas e 5 palavras por bloco**. Word-by-word: opacidade 0 para 100 e y de +28 para 0 em 150ms ease-out no onset da palavra, escala 92 para 100, stagger de 70ms. Palavra forte: 250ms, y de +40 para 0, escala 88 para 100, `wght` de 400 para 700. Saída da respiração em fade de 250ms sem movimento.

Modo **duas cores** no tema papel: texto normal ink-900 `#1B1E24`, palavra forte coral-600 `#DD4E27`.

**0,00 a 0,80 · sem legenda.** O hook já é display e legendar ele duas vezes destrói o gancho. O requisito de "texto do primeiro ao último quadro" está cumprido pelo próprio display.

```
1,00 a 2,55
ele veio abrir
empresa COMIGO.                    → comigo em coral-600 #DD4E27
                                     (5 palavras, 2 linhas)

2,60 a 4,15
eu olhei a ATIVIDADE dele.         → atividade em coral-600 #DD4E27
                                     (5 palavras, 1 linha, 780px)

4,35 a 5,55
essa frase é do PRODUTO,           → produto em INK-900 Sora 700, SEM coral
                                     (5 palavras, 1 linha, 749px)

5,60 a 6,80
não do anúncio.                    → sem coral, peso apenas
                                     (3 palavras, 1 linha)

  Os dois blocos acima ficam em ink porque o palco está com "ainda" aceso
  nessa janela, e a regra é um foco coral por frame no palco.

7,75 a 8,50
não é NÃO.                         → sem coral em nenhuma palavra. O segundo "não"
                                     leva só peso (wght 700). Pintar "não" de coral
                                     seria coral marcando negativa, o que a marca proíbe

8,80 a 10,00
é AINDA não.                       → ainda em coral-600 #DD4E27
                                     (rima direta com o acendimento do palco aos 5,40,
                                      e os dois nunca coexistem num mesmo frame)
```

**10,70 a 17,00 · a legenda sobe e vira o display.** Nesse trecho a voz cala e o texto do palco assume a função da legenda queimada, no papel A-bis (Sora 600, 76px), em modo apple por respiração em vez de word-by-word, porque sem voz não existe onset de palavra e a entrada por frase lê como escrito e não como falado. Não existe segunda camada de texto competindo. Zero coral nas três respirações, só peso:

```
10,90 a 12,90    hoje quem está do outro
                 lado dessa tela sou EU.        → eu em wght 700, ink-900

13,13 a 14,87    o app ainda não ABRIU.         → abriu em wght 700, ink-900

14,97 a 17,00    eu prefiro te dizer
                 AINDA NÃO
                 do que te vender um sim
                 que eu não CUMPRO.             → ainda não e cumpro em wght 700, ink-900
```

**17,00 a 20,00 · end card**, sem legenda corrida. O texto em quadro é a linha de CTA e o rótulo do botão.

**Contagem de acendimentos de coral no palco: 1** (a palavra `ainda` aos 5,40). O teto para peça de 20s é 3. O fill do botão e o `AI` do wordmark não contam. Os corais da legenda queimada são o Sistema 1 e também não contam.

---

## End card

Bloco idêntico às outras cinco peças da leva. Duração total em quadro nesta peça: 3,00s (17,00 a 20,00), sendo 0,50s de head-hold e os 2,50s do bloco compartilhado, para o bloco continuar sendo o mesmo arquivo nas seis.

- **Fundo:** papel quente `#FAF8F5`. Mesmo valor do frame 0, para o loop do Reels não mostrar emenda.
- **Lockup:** `identidade/logos/legalizai-logo-horizontal.svg`, largura 560px, centrado em xc=540, centro vertical y=700. Entra em 17,00 e assenta em 17,40.
- **Linha de CTA, texto exato:** `entra na lista de espera` · Sora 600 · 44px · texto secundário `#524E48` · baseline y=900. Entra em 17,50.
- **Botão, rótulo exato:** `Cadastre-se` · Sora 700 · 56px · branco `#FFFFFF` sobre fill coral-600 `#DD4E27` · caixa 520x132 · topo y=960 · raio 36 · rótulo com baseline y=1044. Entra em 17,70, assenta em 17,97. **Legível e parado por 2,03s.** Sem sombra, sem contorno, sem pulso infinito, sem seta piscando.
  - O rótulo em 56px é o piso exato para branco sobre coral-600 (4,04:1). Se por qualquer motivo ele cair abaixo de 56px, o fill obrigatoriamente vira coral-700 `#B83D1C`.
- **Acendimento:** o `AI` do wordmark sobe para coral-500 `#F2643C` em 150ms em 18,40 (f552), com `--gradient-brand-glow` do `tokens.css` entrando junto.
- **Frase falada, no slot de 0,8s (18,10 a 18,90):** `Vai, legaliza aí.` **Sem a validação do Pedro, sai só a locução: o acendimento do `AI` e o `ding-check` permanecem em f552.** A peça fecha nos dois casos com o mesmo timing, o mesmo acendimento e a mesma duração.
- **Mote A: nada de preço, nada de rótulo de plano, nada de super de condição, nada de data.**
- **Capa da peça no grid:** frame 15 (a régua de revisor já desenhada sob `RECUSEI`), nunca o end card.

---

## Copy do post no Meta

**Primary text**
```
Uma vez o nosso próprio app disse ainda não para um cliente.
Ele não fechou a porta, guardou o nome.
Hoje quem está do outro lado dessa tela é a gente, porque o app ainda não abriu.
```

**Headline** (23 caracteres)
```
Eu recusei esse cliente
```

**Description**
```
Entra na lista de espera da Legalizai.
```

Checado: zero travessão, zero preço, zero rótulo de plano, zero data, zero promessa de garantia, zero menção a concorrente, zero cross-sell, zero CNAE, um CTA só.

**Nome do arquivo entregue:** `legalizai_c6_eu-recusei-esse-cliente_9x16_1080x1920_v002.mp4`

---

## Lista de produção

| # | Asset | Origem | Existe? Caminho real | Como produzir · o que reciclar |
|---|---|---|---|---|
| 1 | Template 9:16 1080x1920 30fps, 600 frames, **`GUIA-safe` 936x1320, x de 72 a 1008, y de 200 a 1520, centro em y=860** | [AE] | **NOVO**, compartilhado com as 6 peças | Portar `marketing/filme/escalada/jsx/10-estrutura.jsx` trocando `W=3840, H=2160` por `W=1080, H=1920` e substituindo a tabela `TAKES` pela grade de blocos desta peça. Helpers `findItem()`, `removeItem()` e `findOrCreateFolder()` migram intactos. **O guia NÃO é 864x1440: esse valor liberava as duas zonas mortas do Reels e estreitava a lateral. O guia certo é a área útil do canon.** |
| 2 | Comp `_CONTROLE` com os Color Controls nomeados | [AE] | **JÁ EXISTE** · `marketing/filme/escalada/jsx/00-tokens.jsx` | Roda como está, é independente de resolução. Nenhum hex é digitado à mão em lugar nenhum da peça |
| 3 | `tokens.json` (papel, coral-500, coral-600, ink-900, ink-600, ink-500, hairline, motion 150/250/400) | [AE] | **JÁ EXISTE** · `marketing/filme/escalada/data/tokens.json`, gerado por `tools/gera-tokens.mjs` a partir de `identidade/tokens.css` | Regerar trocando o bloco `filme.master` para `{w:1080, h:1920}` e a régua `lettering` para a desta leva |
| 4 | **Recorte A · o card de veredito** | [TELA APP] | Fonte **JÁ EXISTE** e foi aberta e conferida · `marketing/telas-app/veredito_waitlist.png` (1290x2796). **Recorte é NOVO** | Retângulo nativo **x=45, y=560, w=1200, h=390**. Em quadro: escala 0,90, resultado **1080x351**, sangra na largura e na base, topo y=614, base y=965, centro óptico y=790. Corpo do card em quadro **47,6px**, acima do piso de 44.<br>**Entra:** borda superior do card, `Atividade regulamentada`, as duas linhas `Sua área precisa de responsável técnico registrado no conselho.`, e o divisor.<br>**Fica fora obrigatoriamente:** o wordmark do topo · o disco âmbar com relógio · **o título âmbar `Ainda não, por enquanto`** · **todo o bloco `Sua atividade na Receita / CNAE 8650-0/02`** · o parágrafo `A gente ainda não abre esse tipo sozinho...` · o formulário inteiro · o campo `CNAE pretendido` · o link `Não é bem isso, refazer` · o botão desabilitado.<br>Cortar com ffmpeg `crop=1200:390:45:560` e salvar em `marketing/filme/c6-recusei/assets/tela/recorte-A-veredito.png` |
| 5 | **Recorte B · região do formulário** | [TELA APP] | Fonte **JÁ EXISTE**, mesmo PNG. **Recorte é NOVO** | Retângulo nativo **x=45, y=1424, w=1200, h=496**. Em quadro: escala 0,90, resultado 1080x446, sangra na largura, topo y=400, base y=846. Entra: `Seu nome` com campo e `WhatsApp ou e-mail` com campo. **Fica fora obrigatoriamente:** o campo `CNAE pretendido` (60px nativos de folga) e o botão desabilitado. `crop=1200:496:45:1424`, salvar como `recorte-B-formulario.png` |
| 6 | Assert de travessão e de CNAE nos dois recortes | [FFMPEG] | **NOVO** | Antes do build, rodar OCR (ou conferência visual por `see-frame`) nos dois PNGs recortados e **falhar alto** se aparecer `—`, `–` ou a string `8650`. O PNG original contém um travessão real no campo `CNAE pretendido` (`8650-0/02 [travessão] Atividade regulamentada`) e o código CNAE aparece em dois lugares, então isso não é zelo, é o furo específico deste asset |
| 7 | Redigitação em Sora da frase do produto (4 linhas a 76px) | [AE] | **NOVO** | Nunca depender do upscale de um PNG de UI para texto que precisa ser lido. Text layers nativos, alinhados à esquerda em x=72, baselines 686 / 773 / 860 / 947. Com o recorte A encolhido, **esta redigitação passou a ser o único veredito verbal da peça**, o que concentra o payload em vez de duplicá-lo |
| 8 | Acendimento da palavra `ainda` em coral-600 | [AE] | **JÁ EXISTE** · `marketing/filme/escalada/jsx/53-lettering-t8-cores.jsx` | Percorre precomp recursivamente e repinta text layer por critério ASCII, imune a acento e encoding. `ainda` não tem acento, então o match é direto. É o mesmo mecanismo que faz o `ai` acender no take 8 do escalada |
| 9 | Rig de legenda queimada word-by-word, modo duas cores | [AE] | **JÁ EXISTE** · `marketing/filme/escalada/jsx/32-lettering.jsx` | Três mudanças: (a) trocar `var W = 3840, H = 2160` da linha 17 por leitura de `takeComp.width/height`; (b) `$.global.LETTERING_OPCOES = { W:1080, H:1920, FPS:30, tema:"papel", duasCores:true, tam:60, larguraMax:880, xc:540, y1:1440, y2a:1365, y2b:1440 }`; (c) `GAP` de 36 para 11 |
| 9-B | **Modo apple na régua da leva** | [AE] | **JÁ EXISTE mas FORA DA RÉGUA** · mesmo arquivo, bloco `OPC.modo === "apple"` | O rig hoje faz Scale 122→100 em **600ms**, Opacity em **280ms**, **Text Blur 42→0 em 500ms** e saída em **80ms**. Nenhuma dessas quatro durações está na régua 150/250/400, e a tabela de motion do canon não tem coluna de blur para elemento nenhum. Adicionar flag `OPC.reguaLeva = true` que troca para: **Scale 3D 92→100 em 400ms · Opacity 0→100 em 250ms · sem blur · saída em fade de 250ms sem movimento**. A curva apple (`KeyframeEase(0,28)` na entrada e `(0,92)` na chegada) fica intacta, porque a régua 5.2 autoriza ela explicitamente em âncora e objeto-herói |
| 10 | Régua de revisor 3px, três usos | [AE] | **NOVO**, trivial | Shape layer retangular 3px ink-900 `#1B1E24` com Trim Path `End` de 0 a 100 em 150ms ease-out. Reusa a técnica do trim path do check da vinheta. Usos: **f10 sob `RECUSEI` (x=317 a 993, y=728)** · **f168 sob `ainda` (x=388 a 586, y=711)** · **f297 sob `o nome dele.` (x=521 a 995, y=1099)** |
| 11 | Congelamento de 6,90 a 7,50 | [AE] | **NOVO**, trivial | Nenhum keyframe na janela f207 a f224. Grain congelado no mesmo campo (desligar a evolução do Noise nesses 18 frames), senão o grain denuncia que a imagem não parou |
| 12 | Snap de atenção em f77 | [AE] | **NOVO**, trivial | Escala do recorte A: +3% em 150ms ease-out sobre o push-in contínuo de 2%. Um par de keyframes. É o gesto de vigia do bloco e cai cravado na entrada de `eu olhei` |
| 13 | Grain 1,5% anti-banding | [AE] | **JÁ EXISTE** · `PRE-grade-grain` em `marketing/filme/escalada/jsx/20-precomps.jsx` | Reescalar a comp de 3840x2160 para 1080x1920. Obrigatório: a peça é área grande de papel chapado em 8 bits com H.264, que é o pior caso de banding |
| 14 | Passe de polimento idempotente | [AE] | **JÁ EXISTE** · `marketing/filme/escalada/jsx/48-polimento.jsx` | Usar só `temFx()` e `rmPolimento()`. **Não** aplicar `sombra()` nem `brilho()` nesta peça: a régua proíbe sombra decorativa e glow, com a única exceção do `brand-glow` do end card |
| 15 | Lockup do end card | [SVG] | **JÁ EXISTE** · `identidade/logos/legalizai-logo-horizontal.svg` | Import nativo de SVG no AE 26. **Nunca usar `legalizei-logo-app-fundo-solido.svg`, cujo wordmark interno é o antigo "Legalizei"** |
| 16 | End card completo (papel, logo assentando, `AI` acendendo, CTA, botão) | [AE] | **NOVO sobre JÁ EXISTE** · alternativa: `marketing/vinheta/out/vinheta-9x16-4k60-v2.mp4` | Caminho recomendado: construir no AE, porque o botão e a linha de CTA precisam nascer tipográficos e a peça é papel do frame 0 ao 599, então não há vantagem em recortar a vinheta (que é 60fps e 4K e traria conform). Caminho barato, se o prazo apertar: recortar os últimos 2,5s da vinheta com ffmpeg, conformar para 30fps e 1080x1920, e sobrepor CTA e botão no AE |
| 17 | Locução ElevenLabs, 24 palavras mais 3 do slot | Áudio | **NOVO** | Guia de fraseado em `marketing/audio/Narração/narracao-elevenlabs-escalada.md`. Uma ideia por respiração, palavra de peso no fim. Registro sóbrio, sem sorriso na voz nas três primeiras respirações. Não há chave de API no repo; o plano B verificado é o Voiceover da Higgsfield a 1,35 créditos por trecho |
| 18 | Word-sync das legendas | Python | **JÁ EXISTE** · `marketing/filme/escalada/tools/fase1-processa.py` | WhisperX word-level no venv 3.12. Marker por palavra, keyframe referenciando marker, nunca número solto |
| 19 | Geração e validação das legendas | Python | **JÁ EXISTE** · `marketing/filme/escalada/tools/fase3-gera-legendas.py` | Trocar o dicionário `LINHAS` e o `CORAL` pelos desta peça. **Manter intactas** as validações de travessão e de contagem máxima de coral (linhas 140 e 153): são regra de marca e são o único gate automático de marca do pipeline. **Adicionar** um assert de máximo 5 palavras por bloco, que é a regra que este roteiro violou na primeira versão. Emite `jsx/31-legendas-data.jsx` |
| 20 | Biblioteca de SFX (12 eventos) | Áudio | **NOVO** · o sintetizador em numpy do escalada v104 viveu no scratchpad e sumiu | Reescrever o sintetizador ou baixar do Freesound com `marketing/pipeline/sfx.mjs` (**existe**, 4019 bytes). Eventos: `tick-caneta` (x2) · `papel-desliza` (x2) · `assenta-card` · `digita` (4 ticks) · `snap-atencao` · `snap-coral` · `pop-papel` (x2) · `carimbo` · `ding-check` · `clique-ui` |
| 21 | Trilha | Áudio | **JÁ EXISTE e conferido** · `marketing/filme/escalada/audio/Trilha/stems/A Step Ahead - Experia/` (5 arquivos: full, BASS, DRUMS, INSTRUMENTS, MELODY) | Usar **só** os stems `INSTRUMENTS` e `MELODY`. **Sem drums e sem bass na peça inteira**: percussão empurra e esta peça é confissão. Envelope: cama a partir de 0,80 · silêncio digital absoluto de 7,00 a 7,30 · volta 2,6 dB abaixo em 7,30 · `MELODY` entra em 10,70 · swell de +2,6 dB em 14,97 · fade de 300ms de 16,70 a 17,00 · nota longa no end card · cauda até 19,70. Sem sidechain, música 5,9 dB abaixo da voz e constante, conforme a decisão do Pedro no v104 |
| 22 | Mux final | [FFMPEG] | **JÁ EXISTE** (receita do escalada) | aerender com `-mfr OFF 100` para sequência TIFF com alfa em chunks de 40 frames, ffmpeg converte e apaga incremental, concat, mux, loudnorm 2-pass a -14 LUFS e -1,5 dBTP, dual mono 48 kHz. **Nunca saída direta de mp4 pelo AE**, o encoder H.264 do MediaCore está quebrado nesta máquina. Validar cada bloco por `count_frames` no MP4, nunca contando TIFs |
| 23 | Higgsfield | [HIGGSFIELD] | **NÃO SE APLICA** | Zero planos, zero créditos. O fato de a peça não gastar um único crédito dos 96,62 restantes é parte do argumento dela: ela é feita só de tipografia e do produto real, e libera a cota inteira para as outras cinco peças da leva |

**PRÉ-REQUISITO BLOQUEANTE DE MÁQUINA (número real, checado em 24/08/2026):** o volume `C:` tem **1,1 GB livres de 111 GB e está em 100% de uso**, não os 1,8 GB que a v001 declarava. Uma passada de 600 frames em TIFF RGBA de 1080x1920 pede cerca de 5,0 GB brutos; o pipeline em chunks reduz o pico para uns 350 MB, mas o cache do AE em `%LOCALAPPDATA%\Temp\Adobe` já matou render por disco cheio antes, e 1,1 GB não dá folga nem para o cache de disco padrão do AE. **Liberar pelo menos 20 GB antes de abrir o AE, não durante.** Sem isso, não iniciar o build.

---

## Contagem de palavras faladas

| Respiração | Janela | Duração | Texto | Palavras | Palavras/s |
|---|---|---|---|---|---|
| L1a | 1,00 a 2,55 | 1,55s | `ele veio abrir empresa comigo.` | 5 | 3,23 |
| L1b | 2,60 a 4,15 | 1,55s | `eu olhei a atividade dele.` | 5 | 3,23 |
| L2 | 4,35 a 6,80 | 2,45s | `essa frase é do produto, não do anúncio.` | 8 | 3,27 |
| L3a | 7,75 a 8,50 | 0,75s | `não é não.` | 3 | 4,00 |
| L3b | 8,80 a 10,00 | 1,20s | `é ainda não.` | 3 | 2,50 |
| **Corpo** | | **7,50s falados** | | **24** | **3,20** |
| Slot | 18,15 a 18,85 | 0,70s | `Vai, legaliza aí.` | 3 | 4,29 |
| **Total** | | **8,20s falados** | | **27** | **3,29** |

**Checagem contra a régua de 2,1 palavras por segundo.** Em 8,20s de fala a régua conservadora comporta **17 palavras**. O roteiro tem **27** e roda a **3,29 p/s**. Isso está acima da banda que o próprio brief reconhece como locução de anúncio real (2,5 a 3,0), e a razão é estrutural: **6,30s da peça (10,70 a 17,00) são deliberadamente mudos**, o que concentra toda a fala em menos de metade do tempo de tela.

Duas leituras que valem registrar antes de gravar:

- **Densidade sobre a peça inteira:** 27 palavras em 20,00s de runtime dá **1,35 palavras por segundo de peça**, bem abaixo da média do vault. A peça não é falante, ela é concentrada.
- **Onde a régua realmente aperta:** L3a (`não é não.`, 4,00 p/s) e o slot da tagline (4,29 p/s). Os dois são frases curtas de marca com pausa interna e não se leem como corrida. O aperto real está em L2, a 3,27 p/s numa frase de argumento.

**Corte régua, se o Pedro pedir cadência mais lenta.** Sai `dele` de L1a (`ele veio abrir empresa comigo.` vira `ele veio abrir comigo.`), sai `dele` de L1b (`eu olhei a atividade.`) e sai `, não do anúncio` de L2 (o micro-label `TELA DO APP · TEXTO ORIGINAL` já faz essa atribuição mudamente). Resultado: **19 palavras no corpo em 7,50s, 2,53 p/s**, sem tocar em um único keyframe de imagem.

**Nota honesta que a v001 não fazia:** esse corte leva a **2,53 p/s, não a 2,10.** Chegar de fato em 2,10 exige alargar as janelas em cerca de 0,90s, e essa folga só existe se o espelho perder uma respiração inteira. `não é não. é ainda não.` não se corta em nenhuma hipótese: é frase de produto, existe literalmente dentro do app e é o eixo do argumento.

---

## Variação de corte

### Corte de 15s (450 frames), o mais provável de rodar em teste A/B

Nada da estrutura muda: o hook, o snap de atenção, o congelamento, o acendimento de `ainda`, a reversão, o espelho e o end card continuam todos na peça. O que sai é hold e uma respiração de cada ponta.

| Bloco | 20s | 15s | O que sai exatamente |
|---|---|---|---|
| Hook | 0,80 | 0,70 | 3 frames de hold depois da régua de revisor |
| Transição | 0,40 | 0,40 | igual |
| Recorte A | 3,00 | 1,70 | Sai a respiração `eu olhei a atividade dele.` inteira, voz e legenda. Sobra `ele veio abrir empresa comigo.`, o push-in cai de 2% para 1,5% e o snap de atenção migra para f60 |
| Frase do produto | 1,20 | 1,20 | igual, e é a única coisa que não se toca |
| Acendimento de `ainda` | 1,50 | 0,80 | O hold depois do acendimento cai de 1,00s para 0,30s. O acendimento e a régua de revisor ficam |
| Congelamento | 0,60 | 0,40 | 12 frames em vez de 18, silêncio digital de 200ms em vez de 300ms |
| Reversão | 0,60 | 0,60 | igual |
| Display do nome | 2,60 | 1,80 | Sai a linha `eu não fechei a porta.`. Fica só `eu guardei o nome dele.`, que é a linha que fecha o loop, com a régua de revisor por baixo dela |
| Espelho, respiração 1 | 2,40 | 1,60 | Vira uma linha só: `hoje quem espera sou eu.` (sai `do outro lado dessa tela`) |
| Espelho, respiração 2 | 1,80 | 1,50 | Hold no mínimo de 1,20s, entrada 0,10s mais cedo |
| Veredito | 2,10 | 1,80 | As duas ondas encostam: onda 2 entra 0,30s depois da onda 1 em vez de 0,53s. As quatro linhas ficam |
| End card | 3,00 | 2,50 | Sai o head-hold. **Regeometrizar:** logo entra em 0,00 e assenta em 0,40 · CTA entra em 0,33 · **botão entra em 0,43 e assenta em 0,70, ficando 1,80s legível**, exatamente no piso · slot de 0,90 a 1,70 · acendimento em 1,20 |
| **Total** | **20,00** | **15,00** | |

Custo real do corte: o espelho perde a imagem literal da tela (`do outro lado dessa tela`), que é a parte mais bonita do payoff, e o argumento passa a depender do espectador ter registrado o recorte B poucos segundos antes. Em compensação, a reversão chega **1,10s mais cedo**, o que ataca de frente o risco que os júris apontaram. **O end card de 15s fica no piso exato do hold do botão, sem folga nenhuma: qualquer aperto adicional reprova a peça.**

### Corte de 12s, o piso absoluto

Só se o teste mostrar queda brutal antes dos 8s. Sai o bloco inteiro da frase do produto redigitada (4,20 a 6,90) e o congelamento vai colado ao fim do recorte A. A peça vira hook, evidência, reversão, espelho e end card. **Custo:** some a única palavra coral do palco e some a prova de que a frase é do produto e não do anúncio, que é justamente o que sustenta a honestidade da peça. **Com o recorte A encolhido na v002, esse corte fica ainda pior**, porque a redigitação passou a ser o único veredito verbal em quadro. Não recomendo, e registro como o corte que eu não faria.

### Decisão a tomar antes do render, não depois do teste

O risco declarado pelos júris (quem sai aos 6 segundos leva "eles não abrem a minha atividade") tem quatro mitigações já embutidas no build de 20s, e as quatro são de graça:

1. **`ainda` acende em coral-600 aos 5,40** e é a única cor do palco na peça inteira, então é a palavra que o olho leva embora. Na v002 isso acontece 0,40s mais cedo que na v001.
2. **A régua de revisor por baixo de `ainda`** em f168, que é o mesmo device do hook, marca essa palavra como o veredito da frase.
3. **O micro-label troca para `TELA DO APP · TEXTO ORIGINAL` aos 4,20**, deixando mudo e explícito que a recusa é política do produto e não uma resposta a quem está assistindo.
4. **O recorte A não nomeia mais nenhuma atividade.** A recusa em quadro passou a ser categórica (`Atividade regulamentada`), não nominativa. O espectador não consegue mais checar "sou eu?", e a peça deixou de excluir publicamente uma profissão inteira.

Se mesmo assim o Pedro quiser antecipar a reposição, a versão de 15s já faz isso estruturalmente, e ela é a que eu levaria para o teste primeiro.

---

## Ressalvas e pendências

Cinco pontos que não têm conserto dentro do meu escopo e que precisam de decisão de quem manda na régua ou do Pedro. Nenhum deles impede o build; todos precisam estar na mesa antes do render.

**R1 · Papel novo criado: `A-bis · display de frase`, Sora 600, 76px.**
A tabela de papéis do canon tem âncora (200 a 420px), legenda corrida (60px), micro-label (32px), super (30px) e rótulo de CTA (mínimo 56px). **76px não existe nela.** A v001 rodava em 76px e 80px sem declarar isso; eu normalizei num valor só e passei a nomear o papel. A justificativa é que mote A não tem âncora numérica e o payload da peça é prosa: uma frase de 16 palavras em 60px viraria um bloco de legenda muito acima do teto de 5 palavras, e em 200px não caberia na largura. Os pisos do canon estão todos respeitados (30px absoluto, 40px para qualquer coisa que venda). **Ação: o dono da régua abençoa ou rejeita o papel A-bis. As outras cinco peças da leva vão pedir ele na primeira frase que não couber em legenda, então a decisão vale para a leva inteira, não só para esta peça.**

**R2 · O hook fica abaixo do piso de 240px do papel A.**
`EU RECUSEI` em Sora 700 com tracking -2% cabe em 936px a 149px, e eu travei em 145px por margem de segurança. A regra 2.5 do canon reprova âncora abaixo do piso de 240px, com o exemplo explícito de `7,4 MILHÕES` a 144px. **A minha leitura é que o piso de 240px foi escrito para o número-herói, e o hook aqui é uma frase falada em display, não uma âncora numérica.** Forçar 240px quebraria `EU RECUSEI ESSE CLIENTE` em cinco linhas e mataria o cartaz, que é o mecanismo de retenção inteiro da peça. **Ação: confirmar que o piso de 240px não se aplica a frase em display, ou o hook precisa ser reescrito em três palavras curtas.**

**R3 · O hold final do end card viola a regra dos 1,2s sem micro-evento, por decisão.**
De f552 (acendimento do `AI`) a f599 são 1,57s sem nenhum evento. A régua 5.4 diz "nunca mais de 1,2s sem micro-evento", e a régua 5.4 também diz "hold do end card com o botão: mínimo 1,8s". **As duas se contradizem no end card, e eu deixei o hold do botão ganhar**, porque numa peça de lead-gen o botão é o único elemento de conversão e a alternativa (colocar algo se mexendo junto do CTA) cai direto na proibição de "pulso infinito no CTA, seta piscando, botão respirando". **Ação: nenhuma, a menos que o dono da régua discorde da ordem de precedência. Registrado para não ser reaberto peça a peça.**

**R4 · O `modo apple` do rig precisa de código antes do build.**
O `32-lettering.jsx` hoje entrega apple com durações de 600 / 280 / 500 / 80 ms e um Text Blur de 42px, e nada disso está na régua desta leva. Eu especifiquei a flag `OPC.reguaLeva` no item 9-B, mas **ela ainda não existe no arquivo**. Sem ela, o build sai fora da régua de motion e a peça reprova no bloco F do checklist. **Rota de reversão, se o Pedro quiser de volta o look do escalada:** blur de **12 para 0 em 250ms**, nunca os 42 em 500ms que estão no rig hoje. **Ação: escrever a flag antes de rodar o lettering, ou o Pedro autoriza a exceção por escrito.**

**R5 · Ritmo de fala acima da régua conservadora, e o corte régua não fecha nos 2,1.**
O corpo roda a 3,20 p/s e o corte régua leva a 2,53 p/s, não aos 2,08 que a v001 prometia. A v001 chegava em 2,08 porque media 8,65s de fala; com a grade re-snapada a fala ocupa 8,20s, e a mesma poda dá um número pior. **Chegar de fato em 2,10 exige matar uma respiração inteira, e a única cortável é L1b (`eu olhei a atividade dele.`), que é justamente o gesto de vigia do bloco e o alvo do snap de atenção em f77.** Eu não corto ela por conta própria. **Ação: o Pedro escolhe entre aceitar 3,20 p/s (que é o que uma locução de anúncio real faz), aceitar 2,53 com o corte régua, ou perder o gesto de vigia para chegar em 2,10.**

**Pendência herdada, não resolvida aqui:** `Vai, legaliza aí.` continua dependendo da validação explícita do Pedro (ADR de 13/08). A peça funciona nos dois casos com o mesmo timing, e a v002 deixou de ser ambígua sobre o que acontece se ela cair: **sai só a locução, o acendimento do `AI` e o `ding-check` ficam em f552.**

---

## Auditoria do guardian

### O que foi verificado na máquina, não assumido

- `marketing/telas-app/veredito_waitlist.png` **aberto e lido pixel a pixel**. É onde estão os dois achados graves.
- `marketing/filme/escalada/jsx/32-lettering.jsx` **lido**, inclusive o bloco `OPC.modo === "apple"` (linhas 71 a 190). É de onde saiu o achado de motion.
- `marketing/filme/escalada/tools/fase3-gera-legendas.py` **lido**: as validações de travessão (linha 153) e de contagem de coral (linhas 64 e 140) existem e funcionam.
- `identidade/logos/` · os três SVG citados existem, e o `legalizei-logo-app-fundo-solido.svg` (proibido) também, o que torna a advertência necessária.
- `marketing/filme/escalada/audio/Trilha/stems/A Step Ahead - Experia/` · os 5 arquivos existem, incluindo `INSTRUMENTS` e `MELODY`.
- `marketing/pipeline/sfx.mjs` · existe, 4019 bytes.
- `marketing/vinheta/out/vinheta-9x16-4k60-v2.mp4` · existe.
- `marketing/audio/Narração/narracao-elevenlabs-escalada.md` · existe.
- **Espaço em disco: 1,1 GB livres de 111 GB, 100% de uso.** O roteiro dizia 1,8 GB.

### Bloco A · Reprovação imediata

| Item | Estado |
|---|---|
| Zero travessão em locução, legenda, super, micro-label, nome de arquivo e legenda do post | **CORRIGIDO.** Havia um em dash literal no corpo do documento (lista de produção). Trocado pelo codepoint. Separador de micro-label é `·` nos três usos |
| O suricato não aparece em nenhum frame | **PASSA.** A peça é papel quente, tipografia Sora, dois recortes de tela real e um SVG de logo. Zero corpo, rosto, pata, cauda, silhueta, sombra com forma de bicho, reflexo, versão estilizada ou ícone. Nenhum plano de IA que pudesse alucinar um animal, porque não há plano de IA |
| A peça funciona sem o mascote | **PASSA, e é a mais forte da leva nesse quesito.** Adicionar o Léo aqui pioraria: a peça é uma confissão em primeira pessoa e um rosto simpático amoleceria a confissão |
| A alma da marca sobreviveu (não virou motion design frio) | **PASSA.** Primeira pessoa em display grande em três momentos (`EU RECUSEI ESSE CLIENTE`, `eu guardei o nome dele.`, `eu prefiro te dizer ainda não...`). Vigia como comportamento de câmera em três lugares (snap f77, congelamento f207, corte que antecipa). Temperamento de aliado do começo ao fim. **Nenhum banco poderia assinar esta peça**, porque nenhum banco admite ter recusado alguém |
| Concorrente | **PASSA.** Zero nome, cor, logo, tipografia, layout ou comparação implícita |
| Preço não vive só no áudio | **N/A.** Mote A não tem preço em lugar nenhum, nem falado, nem em tela |
| Rótulo de plano na tela e no áudio | **N/A e correto.** Mote A não tem rótulo. Verificado que nenhum recorte de tela carrega rótulo de plano acidentalmente |
| Preço correto (19/49 MEI · 79/139 ME · nunca 99) | **PASSA por ausência.** Zero valor monetário na peça |
| Os dois preços juntos e do mesmo tamanho | **N/A** |
| Mecânica de reserva explícita | **N/A para mote A.** A peça ainda assim diz `o app ainda não abriu.` em display, o que é a metade honesta da mecânica e reforça o argumento |
| Qualificador "do Simples Nacional" | **N/A.** A peça não menciona contador, CRC nem Simples Nacional |
| MEI não promete humano | **N/A.** Zero menção a contador, atendimento humano ou pessoa dedicada |
| Cobertura geográfica | **PASSA.** Zero mapa, zero "de qualquer lugar", zero menção a cidade |
| Nenhum termo contratual | **PASSA.** Zero fidelidade, multa, certificado digital, taxa da Junta, DAE, TTRT ou prazo de abertura |
| Nenhuma promessa de garantia | **PASSA.** As palavras "garantia", "incondicional", "sem letra miúda", "sem pegadinha" e "sem surpresa" não aparecem. O eixo da peça é o oposto: ela admite um limite |
| Claim não esticado | **PASSA.** Zero "nenhum humano", "totalmente automático", "resolve sozinho", "você não faz nada". A peça literalmente diz `a gente ainda não abre esse tipo sozinho`, que é o antônimo de esticar o claim |
| **Números não autorizados em quadro** | **CORRIGIDO.** `CNAE 8650-0/02` estava em quadro por 3,1s num anúncio pago. Removido pelo recorte novo |

### Bloco B · Prazo, escassez e data

| Item | Estado |
|---|---|
| Escassez real apenas | **PASSA.** Zero countdown, relógio, contagem regressiva, contador de vagas, "restam X", "só hoje", barra enchendo. **Achado adjacente corrigido:** o disco âmbar com ícone de relógio da tela real estava a 15px da borda do recorte A. O recorte novo afasta ele em 179px, então nem por acidente entra um relógio em quadro |
| Os dois limites sempre juntos | **N/A.** Mote A não cita prazo |
| Data por extenso | **N/A.** Mote A não tem data. Verificado que nenhum recorte carrega data |
| Super de condição presente | **N/A e correto.** Mote A não tem super, e a faixa de 1400 a 1520 fica vazia a peça inteira, o que é por que a legenda pode usar a baseline 1440 |
| Prazo não vive só no áudio | **N/A** |

### Bloco C · Hook e retenção

| Item | Estado |
|---|---|
| Hook mudo, texto grande, legível no frame 1 | **PASSA e melhorado.** 100% de opacidade em f0, sem fade de entrada. Subiu de 135px para **145px**, o máximo que cabe em 936px |
| Primeiro micro-evento até o frame 12 | **PASSA.** Régua de revisor começa em f10 |
| Nenhum trecho de mais de 1,2s sem micro-evento | **PASSA, com uma exceção declarada.** Verificado bloco a bloco: nos trechos com voz a legenda word-by-word entrega evento a cada 0,3s; nos trechos mudos os holds foram travados em 1,20s exatos. As duas paradas longas são intencionais e declaradas: o congelamento de 18 frames (que é a ideia da peça) e o hold final do end card (ver R3) |
| CTA na tela | **PASSA.** `entra na lista de espera` mais botão `Cadastre-se` |
| Ritmo de fala | **NÃO PASSA na régua conservadora.** 3,20 p/s no corpo. Registrado em R5 com o corte pronto e o número honesto |

### Bloco D · Legenda e tipografia

| Item | Estado |
|---|---|
| Legenda queimada do primeiro ao último quadro, sem buraco | **PASSA.** De 0,00 a 0,80 o display é o texto; de 1,00 a 10,00 a legenda corrida; de 10,70 a 17,00 o display assume; de 17,00 a 20,00 o CTA e o botão |
| Legenda diferente do destaque | **PASSA.** 60px centralizado na faixa de 1440 contra 76px no palco. Nunca coexistem no mesmo frame nos blocos mudos |
| Sora em tudo | **PASSA.** Nenhuma outra fonte. `Sora-wght.ttf` instalada, eixo `wght` usado em 700 e 800 |
| Tamanhos dentro da tabela | **CORRIGIDO em parte.** Legenda 60 · micro-label 32 · CTA 56 · hook 145 · **display 76 (papel novo, ver R1)**. Nada abaixo de 30px em quadro. O menor texto que vende algo é o rótulo do botão, em 56px |
| Safe area | **CORRIGIDO.** O `GUIA-safe` especificado (864x1440 em y=840) liberava y=120 e y=1560, os dois em zona morta. Trocado por 936x1320 de y=200 a y=1520. Conferido que nada legível cruza esses limites e que nada significativo cai no corredor de ícones do Instagram (x 880 a 1080, y 1040 a 1780): a régua de revisor mais à direita termina em x=995 mas em y=1099, e o display centralizado nunca encosta na coluna de ações |
| Baseline da legenda correta (1440 para mote A) | **PASSA.** 1440 para uma linha, 1365 e 1440 para duas, crescendo para cima |
| Máximo 2 linhas e 5 palavras por bloco, largura 880px | **CORRIGIDO.** O bloco `essa frase é do PRODUTO, não do anúncio.` tinha 8 palavras. Partido em dois. Todos os blocos re-medidos: o mais largo é 780px |
| Tela do app legível ou assumidamente ilegível | **PASSA.** Os dois recortes ampliam a UI e o corpo do card cai em 47,6px em quadro, acima do piso de 44. Nenhuma tela inteira em quadro |
| Separador de micro-label é `·` | **PASSA** nos três micro-labels |

### Bloco E · Cor

| Item | Estado |
|---|---|
| Coral-500 só em logo e wordmark | **PASSA.** O único coral-500 é o `AI` do wordmark em f552 |
| Fill de ação é coral-600 | **PASSA.** Botão em `#DD4E27` com rótulo branco em 56px, exatamente no piso de AA |
| Lista fechada e teto de acendimentos | **PASSA com folga.** 1 acendimento no palco (`ainda` aos 5,40) contra um teto de 3. Botão e wordmark não contam |
| Um foco coral por frame no palco | **PASSA e reforçado.** Os dois blocos de legenda que rodam sob o `ainda` aceso foram travados em ink de propósito, e o motivo está escrito no roteiro para ninguém "consertar" isso depois |
| Coral não é erro | **CORRIGIDO, e este era o segundo achado grave.** O recorte A original punha o veredito negativo `Ainda não, por enquanto` em âmbar escuro em quadro por 3,1s, colado num disco âmbar de relógio, e 3,3s antes do único acendimento coral. Em 1080 comprimido, laranja quente e coral são o mesmo hue. Removido pelo recorte novo. **Âmbar e coral não coexistem em nenhum frame da peça** |
| Zero azul de marca | **PASSA.** Verificado no PNG: os dois recortes não contêm um pixel de info-blue. Zero grade azulado, luz azul, gradiente ou gráfico |
| Fundo papel quente, texto no dark em `#F4F1EC` | **PASSA.** `#FAF8F5` do f0 ao f599, sem uma exceção. A peça nunca vai para o mundo escuro, o que é coerente com uma confissão |
| Ink-400 não é texto de leitura | **PASSA.** Os únicos ink-400 em quadro são os placeholders `Como a gente te chama` e `(31) 90000-0000` dentro do recorte B, que é exatamente o uso que o canon autoriza (placeholder de UI dentro de uma tela do app) |
| Estado selecionado é coral sólido | **N/A.** A peça não mostra escolha |
| Cores de estado só marcam estado | **CORRIGIDO** junto com o âmbar |
| Nenhum hex cru digitado à mão | **PASSA por construção.** Tudo vem do `tokens.json` e da comp `_CONTROLE` |

### Bloco F · Motion e construção

| Item | Estado |
|---|---|
| Durações 150 / 250 / 400ms snapadas em 5 / 8 / 12 frames | **CORRIGIDO.** O `modo apple` do rig entrega 600 / 280 / 500 / 80ms, e o roteiro herdou "280ms" e "blur 24 em 400ms". Reparametrizado no item 9-B. Ver R4: **isso é código que ainda precisa ser escrito** |
| Easing ease-out em tudo | **PASSA.** A curva apple (28% na entrada, 92% na chegada) é autorizada em âncora pela régua 5.2, e o display é papel A-bis. A única saída acelerada é a do recorte A caindo de quadro, que é objeto físico |
| Zero bounce, overshoot em texto, spring, motion blur em texto | **CORRIGIDO.** Havia `Scale 3D 108 para 100`, que entra por cima do alvo quando a tabela do canon só tem entrada por baixo. Trocado por 92 para 100. Blur removido |
| Zero sombra decorativa, stroke, caixa preta atrás da legenda | **PASSA.** O passe de polimento roda sem `sombra()` e sem `brilho()`, e isso está escrito no item 14. A peça é papel sobre papel, então nem scrim é preciso |
| Zero glow, exceto o `brand-glow` | **PASSA.** Um único uso, em f552 |
| Cortes secos | **PASSA.** Zero dissolve de plano. As trocas de camada com fade estão no comportamento autorizado de "saída de frase em fade de 250ms sem movimento", e o fundo nunca troca |
| Raios corretos | **PASSA.** Botão em 36, que é o `radius-12` do sistema multiplicado por 3 |
| Hairline em 3px | **PASSA.** As três réguas de revisor são 3px |
| Grain 1,5% a 2% | **PASSA.** 1,5% em adjustment sobre a comp inteira, com a evolução travada nos 18 frames do congelamento |
| **Frames inteiros e soma fechando** | **CORRIGIDO.** Quatro limites caíam em meio frame e uma saída de fade estourava o próprio corte. Grade inteira re-snapada, soma de 600 conferida bloco a bloco |

### Bloco G · Marca, origem e entrega

| Item | Estado |
|---|---|
| Wordmark é "Legalizai", com A | **PASSA.** No SVG master e no wordmark do topo da tela real (conferido no PNG). Zero ocorrência de "Legalizei" em quadro, e os dois recortes cortam o wordmark da tela fora de qualquer jeito |
| Logo correto | **PASSA.** `legalizai-logo-horizontal.svg`. O `legalizei-logo-app-fundo-solido.svg` está explicitamente proibido no item 15 |
| End card padrão da leva | **CORRIGIDO na geometria.** Papel quente, logo entrando, `AI` acendendo, linha de CTA e botão. O botão passou de 1,45s para **2,03s legível** |
| A peça funciona com e sem "Vai, legaliza aí." | **PASSA, e a ambiguidade foi removida.** Sai só a locução; o acendimento e o `ding-check` ficam em f552 |
| Zero texto ou logo de IA generativa | **PASSA.** Todo elemento tipográfico nasce no AE. As duas únicas imagens são recortes de PNG do próprio produto |
| Origem marcada em cada plano | **PASSA.** `[AE]`, `[TELA APP]`, `[SVG]` e `[FFMPEG]` em todas as linhas |
| Planos de Higgsfield dentro do teto | **PASSA com zero.** A peça não gasta um crédito dos 96,62, o que libera a cota inteira para as outras cinco |
| Nenhuma foto de banco de imagem | **PASSA.** Zero fotografia de qualquer tipo |
| Anti-cross-sell, um CTA só | **PASSA.** Zero menção a MEI, ME, serviço avulso, blog, indicação ou app irmão. Um CTA |
| Alvo do humor | **PASSA, e é o melhor da leva nesse item.** A piada é a marca estar hoje na fila que ela mesma inventou. O cliente recusado é tratado com respeito do primeiro ao último frame. Em nenhum momento a peça ri de quem assiste nem da dúvida de quem assiste |
| Teste da voz: Sábio distante ou Aliado? | **PASSA nas seis falas.** `eu olhei a atividade dele.` e `eu prefiro te dizer ainda não do que te vender um sim que eu não cumpro.` são Aliado puro. Nenhuma fala tem jargão fiscal, linguagem de cartório ou tom de guru |

### Achados que sobreviveram como ressalva, não como correção

R1 (papel A-bis em 76px), R2 (hook abaixo do piso do papel A), R3 (hold final do end card contra a regra dos 1,2s), R4 (flag `OPC.reguaLeva` ainda não escrita no rig) e R5 (ritmo de fala acima da régua). Nenhum deles tinha conserto sem matar a ideia, e os cinco estão detalhados na seção **Ressalvas e pendências** com a ação e o dono da decisão.

### Veredito

**Aprovado com correção.** A peça é criativamente a mais forte da leva no que o Pedro pediu: ela prova que a alma do Léo sobrevive sem o corpo dele, porque a primeira pessoa e o instinto de vigia carregam a coisa inteira sem nenhum dono visual. Os dois achados graves não estavam no texto do roteiro, estavam no **asset**: o recorte proposto da tela real punha um CNAE nominado e um veredito negativo em laranja quente num anúncio pago. Os dois morreram com um retângulo mais apertado, e a peça saiu mais forte do conserto do que entrou.