<!-- gerado pela rodada corretiva em 24/08/2026 -->
<!-- conceito objetos-3 | veredito do guardian: aprovado com correcao -->

> **Correções aplicadas pelo guardian:**
> - ACHADO GRAVE (Bloco C, hook) · O hook nasce em Sora 600 64px, e o manual de magnetismo exige corpo minimo de 96px no frame 1 para leitura em miniatura. E exatamente o defeito que o juri de performance nomeou nesta peca por nome: 'objetos-3 pede pra ler jargao de ME em corpo pequeno'. Corrigido sem tocar a ideia: o texto dos papeis vira fit-to-box no conjunto {96, 88, 80, 72, 64}, e a P1 passa a ser a pergunta mais curta do jogo (`anexo III ou V?`, 15 caracteres, uma linha), travada em 96px por assert de build. Os papeis 2 a 5 seguem em 64px, porque so o de cima e legivel e nenhum deles e frame 1.
> - ACHADO (Bloco C) · O frame 1 tinha 7 palavras (5 da pergunta mais 2 do micro-label) contra o teto de 6 do manual. Com a pergunta encurtada para 4 palavras, o frame 1 fecha em 6 cravado.
> - ACHADO GEOMETRICO · O teto de 24 caracteres por linha do Gate 1 estoura a caixa do papel: 24 caracteres a 64px em Sora 600 medem cerca de 845px contra 816px uteis (880 menos 32 de padding de cada lado). Teto baixado para 22 caracteres, as cinco perguntas requebradas linha a linha, e assert de largura medida no build.
> - ACHADO CRITICO (Bloco E, cor) · O roteiro manda `duasCores:true` e trocar os dicionarios LINHAS e CORAL, e manda 'manter os asserts como estao'. Li o rig na maquina: `32-lettering.jsx` linha 195 a 202 cai na PALAVRA DE PESO quando nenhuma palavra vem flagada como coral, e a linha 220 pinta ela de CORAL_500. E `fase3-gera-legendas.py` linha 138 marca peso=True na ultima palavra de TODA respiracao. Resultado real do render: 11 palavras coral empilhadas por cima dos tiques e do R$79, quebrando 'um foco coral por frame' em quase toda a peca. Pior: o validador (`if ncoral > 1`, linha 147) conta a FLAG do JSON, nao o que o rig pinta, entao ele daria PASSA FALSO. Corrigido com a flag `forteSemCor` (uma linha: CORAL_500 = TEXTO_DARK) e assert novo que reprova o build se a flag nao estiver ligada.
> - ACHADO DE MECANISMO · Item 5 promete 'Drop Shadow 135 graus, distancia 40, suavidade 48, opacidade 38%, cor do _CONTROLE' reusando `sombra()` do 48-polimento.jsx. A funcao real e `sombra(ly, opac255, dist, soft)`: nao tem parametro de angulo nem de cor, e so escreve as propriedades 0002, 0004 e 0005. Corrigido: item reescrito como 'JA EXISTE, precisa de 2 linhas novas' (ADBE Drop Shadow-0001 para cor e -0003 para direcao).
> - ACHADO DE DIRECAO · O angulo da sombra dos papeis estava travado em 135 graus enquanto a varredura de luz anima de 138 para 132. Duas fontes de luz na mesma mesa. Corrigido: um unico controle `luz-angulo` no _CONTROLE dirige a varredura e as cinco sombras por expressao.
> - ACHADO (Bloco G, justificativa falsa) · Item 5 afirma que 'a regua 1.9 autoriza' a sombra de objeto. Reli a regua 1.9: a unica excecao que ela autoriza e o brand-glow do AI. A sombra fica, porque sem ela nao existe mesa nem o beat do freeze, mas ela foi reclassificada honestamente como luz de cena tridimensional (nao separacao de UI), proibida em qualquer texto, e promovida a decisao explicita do Pedro no Gate 6. Nao decidi isso sozinho.
> - ACHADO (Bloco F, raio) · Papeis de pergunta e folha da oferta estavam em raio 24, que e raio de chip. Em frame de 1080 o raio de card e 48 (regua 1.10). Ambos corrigidos para 48. O card de preco ja estava certo.
> - ACHADO (Bloco D, tamanho) · O rotulo `ME · SIMPLES NACIONAL` e os micro-labels `NOS 3 PRIMEIROS MESES` e `DEPOIS DISSO` estavam em 32px. A regua 2.3 e explicita: qualquer coisa que VENDE algo (preco, rotulo, prazo, CTA) fica em 40px ou mais. Os tres subiram para 40px, e o layout interno da folha de preco foi reancorado por causa disso.
> - ACHADO DE TIMING · A locucao 7 terminava em 17,800, que e o mesmo frame do corte do end card (f534). Isso mata os 300ms de silencio que o proprio roteiro declara e contradiz o envelope da trilha, que corta em f525. Blocos 6 e 7 reancorados: locucao 6 em 13,600 a 15,167 e locucao 7 em 15,467 a 17,500, com 300ms de silencio real antes do corte e 5,9 silabas por segundo no pior caso.
> - ACHADO (Bloco C, micro-evento) · O freeze de f168 a f212 sao 45 frames, ou 1,50s absolutamente parados, contra o teto de 1,2s sem micro-evento. O roteiro declarava 1,20s sem mostrar onde estava o evento. Corrigido sem tocar o freeze: a legenda `chega outra.` sai em fade de 250ms em f195, o unico gesto permitido em quadro congelado. Maior janela imovel real: 0,90s.
> - ACHADO GEOMETRICO · A pilha nao cabia. Com offset de 70px e rotacao de ate 8 graus, o canto mais baixo da P5 cai em y=931 e atravessa a regua de perigo em y=890, e o canto mais alto da P1 invade a faixa de micro-label. Corrigido com numeros: offset de 62px, centros em y 490 / 552 / 614 / 676 / 738, rotacoes +3 / -5 / +6 / -4 / +2 graus, P5 travada em no maximo 2 graus por ser a legivel. Canto mais baixo em y=858, folga de 32px ate a regua. Assert de caixa girada, nao de caixa reta.
> - ACHADO (Bloco F, motion) · A variacao curta mandava 'saida para 6f' para caber o stagger. 6 frames sao 200ms, que nao existe na regua 150/250/400. Corrigido: saida fica em 250ms (8 frames) sempre, e quem cede e o stagger, que vai para 13 frames. Tique de 5f mais saida de 8f dao 13f, que e exatamente o stagger, com zero sobreposicao de acendimento.
> - ACHADO ARITMETICO GRAVE · A variacao de 15,0s atropelava a regua de 2,1 palavras por segundo e nao fechava de jeito nenhum. O bloco de audio obrigatorio do mote C (rotulo, os tres membros da mecanica de reserva e o slot da frase de fecho) mede 7,20s continuos; somado a 65 frames minimos de desempilhar, 24 de freeze, 41 de hook e a folha da oferta, ele nao cabe em 450 frames. Corrigido: a variacao alternativa passa a ser de 17,00s (510 frames), com 34 palavras a 2,0 por segundo, saindo do audio apenas as locucoes 2 e 5, que sobrevivem em legenda queimada e em display de 74px na tela.
> - ACHADO DE TIPOGRAFIA · A quebra da folha da oferta estava solta. `CONTADOR DE VERDADE` numa linha mede cerca de 956px contra 824 uteis. Quebra travada em CONTADOR / DE VERDADE DO / SIMPLES NACIONAL, e a linha mais larga passa a ser `SIMPLES NACIONAL` com 805px, que e o numero do assert que o roteiro ja carregava. O `DO` fica colado no fim da linha 2 para o qualificador do Simples Nacional nunca se separar.
> - CORRECAO DE INVENTARIO · Item 21 dizia '13 SFX sintetizados' e listava 19 arquivos em 11 familias. Numero corrigido, porque quem orça o dia de som le esse numero.
> - CORRECAO · A headline `Suas perguntas passam a ter dono.` tem 33 caracteres, nao 32.
> - ACHADO DE ENTREGA · Item 20 manda recortar os ultimos 2,5s de `vinheta-9x16-4k60-v2.mp4` para o end card. O arquivo existe, mas e 4K a 60 fps e ninguem verificou qual wordmark esta dentro dele. Se for o antigo 'Legalizei', a peca reprova na regua 1.18 por um asset reciclado. Adicionado gate de verificacao de wordmark e conform declarado de 60 para 30 fps antes de qualquer reuso, com rota de fallback pelo SVG.
> - DEFESA PREVENTIVA · A regua de perigo e um traco neutro em texto terciario dark. Ficou escrito no roteiro que ela nunca vira ambar nem crimson em nenhuma versao, porque cor de estado so marca estado do CNPJ (regua 1.17), e um elemento chamado 'perigo' e o convite mais obvio da leva para alguem pintar de vermelho no ultimo dia.
> - VERIFICADO E LIBERADO, nao mexi · Mascote: zero em todo frame, nenhum objeto com forma de bicho, nenhuma sombra que possa ler como animal, nenhum plano de IA que possa alucinar um. A peca nao melhora com o suricato e nao precisa dele. Blur direcional: zero, e o roteiro ja proibia explicitamente e ja excluia o 54-contador-fix.jsx, que de fato carrega ADBE Motion Blur embutido (linha 61). Precos 79 e 139 corretos, nenhum 99, nenhum outro valor monetario em quadro. A decisao de descartar a tela do app (item 25) foi mantida intacta: ela evita o R$ 178,31 da tela de obrigacoes, evita uma auditoria de crop e evita um acendimento de coral nativo de UI. Rotulo na tela e no audio, no mesmo quadro do preco. Qualificador do Simples Nacional colado em contador de verdade, na tela e na voz. Zero mapa, zero palavra Brasil, zero sugestao de cobertura nacional. Zero termo contratual. Zero concorrente e zero interface de terceiro. Zero countdown e zero contagem de vaga. Data por extenso com os dois limites unidos por 'o que vier primeiro'. Alvo do humor e a pratica do setor de deixar cliente no vacuo, nunca a duvida de quem assiste. Higgsfield: um still opcional, sem texto, sem personagem, com fallback em AE pronto, e a peca fecha gastando zero credito. Todos os caminhos de asset citados existem na maquina, inclusive os stems separados de Light Years.
﻿<!-- gerado pelo workflow legalizai-6-criativos-v2 | conceito objetos-3 (corretiva) -->
<!-- veredito do guardian: aprovado com correcao -->

> **Correções aplicadas pelo guardian (resumo).** Hook subiu de 64px para 96px no frame 1 e a P1 virou a pergunta mais curta do jogo, porque o júri de performance reprovou esta peça por nome nesse ponto exato. Teto de caractere por linha caiu de 24 para 22, que é o que cabe na caixa do papel. A legenda queimada ganhou a flag `forteSemCor`, senão o rig pinta 11 palavras coral sozinho e o validador dá passa falso. `sombra()` não tem parâmetro de ângulo nem de cor, e o item de produção foi reescrito. Geometria da pilha refeita com números, porque com os anteriores a P5 atravessava a régua de perigo. Locuções 6 e 7 reancoradas para devolver os 300ms de silêncio antes do end card. Rótulo e micro-labels de prazo subiram de 32px para 40px. Raio de papel e de folha subiu de 24 para 48. A variação curta virou 17,0s, porque em 15,0s a aritmética de fala do mote C não fecha. Detalhe item a item na seção **Auditoria do guardian**, no fim do documento.

---

## CRIATIVO 9 :: A PILHA

| Campo | Valor |
|---|---|
| **Mote** | C · Plano ME · Simples Nacional |
| **Tom** | Híbrido. Sóbrio no ato escuro, seco na virada, uma única piada física de 8 frames. |
| **Persona alvo** | B (parceria, quer sentir que tem alguém junto) |
| **Duração** | 21,00s exatos · 630 frames. Variação alternativa de 17,00s · 510 frames. |
| **Formato** | 9:16 · 1080x1920 · 30,000 fps · master H.264 CRF 16 · áudio 48 kHz dual mono, -14 LUFS / -1,5 dBTP |
| **Lente** | Objetos. Câmera cenital sobre a mesa, absolutamente imóvel nos 630 frames. Zero corte de enquadramento. |
| **Pilar de funil** | Fundo de funil de aquisição. Conversão direta pra cadastro na lista de espera, público frio e morno. |
| **CTA em tela** | `Entra na lista. Eu aviso quando abrir.` |
| **Botão do Meta** | `Cadastre-se` |
| **Capa (thumbnail)** | **Frame 470 (15,667s)**: card de preço assentado, `R$79` e `R$139` do mesmo corpo, rótulo `ME · SIMPLES NACIONAL` colado no topo, super de condição em quadro. Nunca o frame 0 (64px de pergunta não lê em grid), nunca o end card. |
| **Acendimentos de coral no palco** | **2 de 3** (teto de peça de 20 a 30s). Acendimento 1: os cinco tiques coral-600 do desempilhar, f213 a f290, nunca dois no mesmo frame. Acendimento 2: o algarismo `R$79` em coral-600, f399 a f533. Zero coral na legenda queimada. Zero tela real do app em quadro, portanto zero coral nativo de UI. O botão coral-600 e o `AI` coral-500 do end card não contam no teto, por canon. |
| **Planos [HIGGSFIELD]** | Zero por padrão. Um still de textura de mesa é opcional (2 a 4 créditos) e tem fallback em AE pronto. Custo previsto em créditos: **0,00**. |

---

**A ideia em uma frase.**

Cinco perguntas legítimas de quem tem ME caem uma por cima da outra numa mesa escura até a pilha quase encostar numa linha, e aí, sem ninguém entrar em quadro, elas saem de volta uma a uma, cada uma com um tique coral, até a mesa ficar limpa.

---

**Por que para o dedo.**

O frame 1 não é uma tese, é um objeto e uma ameaça. Uma mesa escura vista de cima, luz rasante entrando pela esquerda, um único papel branco com uma pergunta de quatro palavras em 96px, e uma linha fina atravessando o quadro inteiro 400 pixels abaixo dele. A linha não é explicada em lugar nenhum, e é ela que abre o buraco: existe um limite, o papel está longe dele, e o contador no canto superior esquerdo já avisa que isto é a `PERGUNTA 1`. Ordinal é promessa de sequência. Ninguém rola de um `1`.

Os 4,2 segundos seguintes são o loop mecânico se fechando: cada papel novo empurra a pilha na direção da linha, acelerando de um papel a cada 1,87s para um a cada 0,80s, e o contador sobe junto. A retenção aqui não é argumento, é física, e ela funciona com o som desligado e em qualquer tamanho de tela, porque o que se lê é a distância diminuindo, não o texto.

Aí vem o beat mais caro da peça e o mais raro no feed: **nada acontece**. A pilha para a 32 pixels da linha, o som inteiro corta, e por 1,5 segundo o quadro fica imóvel com uma sombra longa e torta ocupando meio quadro. Silêncio absoluto de 300ms num Reel é o recurso de atenção mais barato que existe e quase ninguém usa, porque parece erro. Aqui ele é promessa: a pilha está obviamente prestes a fazer alguma coisa.

E o payoff é uma recompensa física de graça. As cinco perguntas saem de cima pra baixo, cada uma com um tique coral desenhado no canto e um tick no som subindo um semitom por vez, para o ouvido contar junto. Ver uma pilha sumir é satisfação corporal, não intelectual, e ela chega **antes** de qualquer argumento verbal. Só depois de a mesa estar limpa é que a oferta entra, e ela entra numa mesa que a própria peça acabou de esvaziar.

---

**Onde mora a alma da marca.**

A câmera fica em pé sobre a mesa e não se mexe uma única vez em 630 frames. Não é economia de orçamento, é o bicho parado, observando, sem intervir, e é a única peça da leva que faz isso do primeiro ao último frame. O congelamento de 45 frames com o áudio inteiro caindo, no ponto de maior tensão, é o comportamento mais característico do vigia traduzido em gramática de edição, e aqui ele é o centro da peça, não um enfeite.

A primeira pessoa está queimada em corpo grande três vezes, sempre com a marca como sujeito: `eu já mandei pergunta que não voltou.`, `eu não deixo pergunta sem dono.` e `eu guardo o preço no seu nome.` A primeira delas é a que segura a peça de pé, porque coloca a marca **do mesmo lado** de quem assiste, admitindo ter passado pela mesma coisa, em vez de apontar o problema de fora. É o temperamento de aliado dito em quatro segundos e sem nenhuma cara de espanto.

O alvo do humor é a prática do setor de deixar cliente no vácuo, nunca a dúvida de quem assiste. As cinco perguntas são dúvidas competentes de quem tem ME e passaram por gate factual antes do build: nenhuma delas é ingênua, nenhuma delas expõe quem pergunta. E a única piada da peça, o quarto papel escorregando porque a pilha já está torta demais, é uma piada de objeto e de timing, com 8 frames de duração, cujo alvo é a pilha.

---

**Roteiro quadro a quadro.**

Arquitetura de comps: existe uma precomp `PALCO-9x16` (mesa, régua de perigo, cinco papéis, tiques, folha da oferta, card de preço, varredura de luz, grain) e por cima dela, na MASTER e nunca dentro do palco, vivem `LETTERING` (legenda queimada), `CONTADOR-PARTES` e `SUPER-CONDICAO`. Legenda, contador e super nunca escalam e nunca se movem por causa de nada que aconteça no palco. Cor sempre lida do null `CORES` da comp `_CONTROLE`, que por sua vez lê o `tokens.json`. **Nenhum hex digitado na comp, em lugar nenhum.**

**Zonas verticais desta peça (canon 9:16):** faixa morta topo 0 a 200 · micro-label 200 a 360 · palco 360 a 1140 · respiro 1140 a 1220 (fica vazio, sem exceção) · legenda 1220 a 1400 · super 1400 a 1520 · faixa morta rodapé 1520 a 1920. Margem lateral 72px, área útil `x 72 a 1008`. Corredor de ícones do Instagram (`x 880 a 1080`, `y 1040 a 1780`) livre de elemento significativo.

| Tempo | Imagem (o que se vê) | Origem | Áudio e voz | Texto de destaque na tela | Som e trilha |
|---|---|---|---|---|---|
| **0,000 a 1,367** · f0 a f41 · *a linha* | Frame congelado. Mesa escura vista de cima: gradiente `ink-hero` (`160deg, #2A2E37 0%, #15171C 62%, #202433 100%`) com luz rasante entrando pela esquerda. **Régua de perigo:** shape de dois pontos, stroke 3px `text-tertiary-dark #8E8981`, de `x=72` a `x=1008`, em `y=890`, em quadro desde o frame 0, sem explicação. **Papel 1:** `PRE-papel-pergunta`, 880x210, **raio 48**, fill `#FFFFFF`, hairline `#E3DED7` de 3px, centro em **(540, 490)**, rotação **+3 graus**, com sombra física projetada (ver notas de direção). O canto mais alto dele fica em y=362, dentro do palco. **Varredura de luz:** mancha elíptica de feather alto varrendo devagar, com o ângulo de luz indo de 138 para 132 graus ao longo de f0 a f167. É o único movimento contínuo do ato escuro e o substituto declarado do push-in. **Micro-evento em f10:** a sombra do papel se alonga 3% em 150ms ease-out, e é só isso. Grain 1,5%. **Sem legenda queimada e sem super:** o hook não se legenda duas vezes, e o super entra no 2º quadro. | **[AE]** | Sem voz. A primeira palavra só entra em 1,400. | `anexo III ou V?` · Sora 600, **96px**, `text-primary #1B1E24`, uma linha, centrado no papel.<br><br>`PERGUNTA 1` · Sora 500 CAPS, 32px, tracking +8%, `#8E8981`, `x=72`, **baseline y=320**.<br><br>**Total no frame 1: 6 palavras.** | **Primeiro som é papel, nunca voz.** `sfx_papel_assenta_a` em 0,333s (f10), 220 Hz, seco, sem cauda, -18 dBFS. `sfx_sala_tom` (room tone) por baixo, contínuo, -34 dBFS. Trilha: só o stem `BASS` de "Light Years", a -22 dB relativos. |
| **1,400 a 5,600** · f42 a f167 · *a pilha cresce* | Quatro papéis caem por cima, **cada um cobrindo cerca de dois terços do anterior**, com offset de 62px pra baixo e rotação alternada: **P2 em f56** (centro y=552, -5 graus), **P3 em f92** (614, +6 graus), **P4 em f120** (676, -4 graus), **P5 em f150** (738, +2 graus). Intervalos de 56 / 36 / 28 / 30 frames: a pilha **acelera** de um papel a cada 1,87s para um a cada 0,80s. Cada queda é entrada de 400ms ease-out em Y mais 150ms de assentamento residual. **A piada, em f132 a f140:** o P4 **escorrega** 26px pra baixo e gira 2 graus a mais, porque a pilha já está torta demais pra segurar ele. 8 frames, e é o único humor da peça. Em f156 a pilha para de crescer e o canto mais baixo da P5 fica **a 32 pixels da régua de perigo**. A câmera não se move. A varredura de luz continua. | **[AE]** | 1,400 a 3,600 — "Eu já mandei pergunta que não voltou."<br><br>4,000 a 5,567 — "Toda semana chega outra." | Contador troca por **hard swap de 1 frame** e escala 88 a 100 em 5 frames: `PERGUNTA 2` em f68, `PERGUNTA 3` em f104, `PERGUNTA 4` em f132, `PERGUNTA 5` em f162. Sempre `x=72`, baseline 320. **Sem blur direcional, sem slot machine, sem curva exponencial.**<br><br>**Super de condição entra em f42** (fade 250ms) e **não sai mais até f629**. Sora 400, 30px, `#8E8981` (troca pra `#736E67` em f399), `x=72`, baselines **1420 / 1460 / 1500**:<br>`Condição garantida pra quem entra na lista.`<br>`Vale até 31 de dezembro de 2026, ou enquanto a lista`<br>`estiver aberta, o que vier primeiro.` | `sfx_papel_assenta_b` a `_e` em f68, f104, f132 e f162, **descendo de 220 para 178 Hz conforme a pilha engrossa** (o ouvido percebe a massa aumentando). `sfx_papel_escorrega` em f132. Trilha: o `BASS` sobe de -22 para -18 dB em f56 e sustenta. Voz sempre 5,9 dB acima da trilha, constante, sem sidechain. |
| **5,600 a 7,100** · f168 a f212 · *o freeze* | **Tudo para.** A varredura de luz congela em f168 e não volta. A pilha fica imóvel, torta, com a sombra longa atravessando meio quadro, a 32 pixels da régua. Nenhum papel, nenhuma câmera, nenhum brilho. **Único gesto do beat inteiro:** em f195 a legenda `chega outra.` sai em fade de 250ms, sem movimento, e o quadro fica com a mesa sozinha por 0,33s antes do payoff. Maior janela absolutamente imóvel: **0,90s**. | **[AE]** | Silêncio. Sem fala em 45 frames. | Contador segura `PERGUNTA 5`. Super continua. | **Áudio inteiro a zero em f168.** Silêncio absoluto de f168 a f177 (**300ms**, trilha inclusive). De f177 a f212, só `sfx_sala_tom` a -34 dBFS, sozinho. É o silêncio que faz o freeze existir, e ele não encolhe em versão nenhuma. |
| **7,100 a 10,067** · f213 a f302 · *o desempilhar* | De cima pra baixo. Em **f213, f229, f245, f261 e f277** (stagger de 16 frames), cada papel recebe no canto inferior direito um **tique coral-600 `#DD4E27` desenhado por trim path em 150ms** e, terminado o tique, **desliza pra fora pela direita em 250ms ease-out**, com a borda cruzando `x=1080` no frame 5 de 8, de modo que a desaceleração acontece fora de quadro. Vida do coral por papel: 13 frames, contra 16 de stagger, ou seja **3 frames de folga e zero sobreposição de acendimento**. O último papel sai em f290 e a mesa fica limpa de f290 a f302. A câmera continua parada e a régua de perigo continua lá. | **[AE]** | 7,300 a 9,300 — "Eu não deixo pergunta sem dono." | Contador vira `RESPONDIDAS · 1` em f218 e sobe pra `· 2` em f234, `· 3` em f250, `· 4` em f266 e `· 5` em f282. **Sempre ascendente, nunca regressivo**, e o separador é `·`. | `sfx_tique_1` a `_5` nos cinco acendimentos, **subindo um semitom cada**, pro ouvido contar sem olhar. `sfx_folha_desliza` em cada saída, 250ms, fricção de papel na madeira. Trilha: o stem `INSTRUMENTS` entra em f213, pad sustentado, sem bateria. |
| **10,100 a 13,267** · f303 a f398 · *a oferta* | **f303:** a régua de perigo **se retrai** por `Trim Paths End` de 100 a 0 em 250ms ease-out, da direita para a esquerda. Não é Linear Wipe (o wipe deixa a espessura irregular na saída). **f303 a f315:** entra pela esquerda uma **folha única**, 936x460, **raio 48**, `#FFFFFF`, hairline 3px, de `x=-936` a `x=72` em 400ms ease-out, parando em `y 560 a 1020` (centro óptico do bloco em y=790). **f345:** o micro-label entra em 150ms. **f375:** o contador `RESPONDIDAS · 5` sai em fade de 250ms, entregando o palco pra oferta. Mesa vazia atrás, câmera parada. | **[AE]** | 10,700 a 13,233 — "Contador de verdade do Simples Nacional." | `CONTADOR`<br>`DE VERDADE DO`<br>`SIMPLES NACIONAL`<br>Sora 700, **74px**, CAPS, `#1B1E24`, alinhado à esquerda dentro da folha, baselines locais 130 / 215 / 300. **A quebra é travada:** o `DO` fica no fim da linha 2 pra o qualificador nunca se separar, e `CONTADOR DE VERDADE` numa linha só não cabe.<br><br>`JÁ NO PLANO DE ENTRADA` · Sora 500 CAPS, 32px, tracking +8%, `#736E67`, baseline local 372.<br><br>**Tudo em ink: a folha não gasta acendimento.** | `sfx_regua_retrai` em f303, fricção curta descendente. `sfx_folha_entra` em f303, 400ms, casado com o movimento. `sfx_folha_assenta` em f315. Trilha sustenta o pad. |
| **13,300 a 17,767** · f399 a f533 · *o preço* | **CORTE SECO.** O mundo vira papel: fundo `surface-page #FAF8F5`, o mesmo valor do end card. **Grain sobe pra 2% por 8 frames** (f399 a f407), que é anti-banding na única troca de área grande da peça. O super troca de `#8E8981` pra `#736E67` no mesmo frame, e o tema da legenda troca de dark pra papel. **f399 a f407 (250ms):** o card de preço assenta, 936x780, **raio 48**, `#FFFFFF`, hairline 3px, ocupando **y 360 a 1140** (a faixa de palco inteira, exata), com opacidade 0 a 100, y +32 a 0 e escala 96 a 100. Hold absolutamente parado de f407 a f533, **4,20s**. Câmera parada. | **[AE]** | 13,600 a 15,167 — "Plano ME, Simples Nacional."<br><br>15,467 a 17,500 — "O app não abriu. Ninguém paga hoje."<br><br>**17,500 a 17,800: silêncio.** | `ME · SIMPLES NACIONAL` · Sora 500 CAPS, **40px**, tracking +8%, `#1B1E24`, `x=128`, baseline **y=456**.<br><br>`R$79` · Sora 700, **260px**, tracking -2%, **coral-600 `#DD4E27`**, `x=128`, baseline **y=744**. *(acendimento 2 de 2)*<br><br>`NOS 3 PRIMEIROS MESES` · Sora 500 CAPS, **40px**, `#736E67`, baseline **y=804**.<br><br>`R$139` · Sora 700, **260px, idêntico**, `#1B1E24`, **zero coral**, `x=128`, baseline **y=1020**.<br><br>`DEPOIS DISSO` · Sora 500 CAPS, **40px**, `#736E67`, baseline **y=1080**.<br><br>Super de condição segue no rodapé. | `sfx_corte_papel` em f399, estalo seco de 4 frames, sem cauda. `sfx_preco_assenta` em f407. Trilha: **camada cheia** a partir de f399 (bass, instruments e melody), e **corte seco em f525**. De f525 a f534, silêncio. |
| **17,800 a 21,000** · f534 a f629 · *end card* | **CORTE SECO em f534.** O card de preço sai por corte, nunca por fade, e o fundo papel `#FAF8F5` permanece, então a emenda é invisível. **f538 a f550 (400ms, ease-out):** o wordmark entra, opacidade 0 a 100, y +48 a 0, escala 92 a 100, largura 620px, centro do lockup em (540, 740). **O logo entra e assenta, não cresce: zero zoom.** **f545 a f553 (250ms):** entra a linha de CTA. **f548 a f556 (250ms):** entra o botão, **assentado em f556 e parado em quadro por 2,43s cheios**. **f570 (150ms):** o `AI` acende em coral-500 `#F2643C` com o `gradient-brand-glow` subindo junto, o único glow autorizado da leva. **f596 a f604:** a legenda sai em fade. **Fecha em papel, nunca em fade pra preto.** | **[AE]** + **[SVG]** `identidade/logos/legalizai-logo-horizontal.svg` | 18,000 a 19,867 — "Eu guardo o preço no seu nome."<br><br>19,933 a 21,000 — "Vai, legaliza aí." *(slot opcional)*<br><br>**Sem a frase (versão B):** o slot vira hold do logo. Zero retiming, zero reescrita, o `AI` acende no mesmo f570. | **Wordmark** `Legalizai`, 620px de largura, centro em (540, 740). `Legaliz` em `#1B1E24`, **`ai` em coral-500**.<br><br>**Linha de CTA:** `Entra na lista. Eu aviso quando abrir.` Sora 600, **44px**, `#1B1E24`, centralizada, baseline **910**.<br><br>**Botão:** `Cadastre-se` · Sora 700, **56px**, `#FFFFFF` sobre fill coral-600 `#DD4E27`, caixa 560x132, **raio 36**, centro em x=540, `y 1000 a 1132`. (56px é o mínimo que faz branco sobre coral-600 bater AA.)<br><br>**Super de condição** continua, 30px, baselines 1420 / 1460 / 1500. | `sfx_ai_chime` em f570: o twinkle curto da marca, o mesmo evento da vinheta e do take 8 do escalada. Trilha: **uma nota sustentada** entrando em f534 e resolvendo em f620. Sem cauda de reverb depois de f629. |

---

**As cinco perguntas, papel a papel.**

O texto é **fit-to-box**: o build escolhe o maior corpo do conjunto `{96, 88, 80, 72, 64}` que faça toda linha caber em **816px úteis** (papel de 880 menos 32px de padding de cada lado), com piso de 64px. **Teto de 22 caracteres por linha e 2 linhas por papel.**

```
P1   anexo III ou V?                    1 linha  · 15 car ·  96px  · centro (540, 490) · +3 graus
P2   pró-labore de quanto,              2 linhas · 21 car ·  64px  · centro (540, 552) · -5 graus
     sem pagar INSS demais?                       22 car
P3   nota pra fora daqui                2 linhas · 19 car ·  64px  · centro (540, 614) · +6 graus
     muda onde pago ISS?                          19 car
P4   se eu não faturar,                 2 linhas · 18 car ·  64px  · centro (540, 676) · -4 graus
     declaro mesmo assim?                         20 car
P5   distribuição de lucro              2 linhas · 21 car ·  64px  · centro (540, 738) · +2 graus
     paga imposto?                                13 car
```

**Por que a P1 é a mais curta:** ela é o frame 1, e o frame 1 tem piso de 96px pra ler em miniatura e teto de 6 palavras. `anexo III ou V?` são 4 palavras e resolve em 96px com folga. Nenhuma das outras resolve, e nenhuma das outras precisa: elas entram depois do frame 1 e só a de cima é legível de cada vez.

**Por que a P5 é a de rotação mínima:** ela fica sozinha em quadro por 1,5 segundo inteiro durante o freeze, então é a mais lida da peça, e é a que menos pode estar torta.

**Asserts obrigatórios do item 4 da lista de produção:**
1. Se a P1 não resolver em **96px**, o build falha. O hook depende disso.
2. Se qualquer linha medida passar de **816px**, o build falha.
3. Se o canto mais baixo da **caixa girada** da P5 passar de **y=880**, o build falha. Com os números acima ele cai em **y=858**, deixando **32px** de folga até a régua, e essa folga é a mecânica inteira da peça.
4. Se a caixa girada de qualquer papel sair de `x 72 a 1008`, o build falha. Pior caso é a P3 a +6 graus, que ocupa `x 91 a 989`.
5. Se qualquer string contiver `\u2014` ou `\u2013`, o build falha.

---

**Legenda queimada.**

Sora 600, **60px**, tracking -1%, line-height 1,25 (75px), centralizada em `x=540`, largura máxima 880px, **máximo 2 linhas e 5 palavras por bloco**. **Última baseline em y=1320**, primeira baseline de bloco de 2 linhas em y=1245. O bloco cresce pra cima. Tema `dark` até f398 (texto `#F4F1EC`) e `papel` de f399 em diante (texto `#1B1E24`).

Word-by-word: opacidade 0 a 100, y +28 a 0, escala 92 a 100 em **150ms ease-out** no onset da palavra, stagger de 70ms. Palavra forte: **250ms**, y +40 a 0, escala 88 a 100, `Sora-Bold` (700) no lugar do `Sora-SemiBold` (600). Saída de respiração em fade de 250ms, **sem movimento**. **Rotação alternada de ±4 graus desligada** (o tom é sóbrio e a peça já tem cinco objetos tortos em quadro). Modo `apple` desligado. Sem motion blur, sem overshoot, sem bounce, sem stroke, sem caixa preta.

**Nenhuma palavra em coral nesta peça.** A ênfase é feita por **peso**, que é o que o rig já faz de verdade na linha 218 do `32-lettering.jsx`. Motivo: o palco está com coral aceso em 225 dos 630 frames (os tiques e o `R$79`), e a regra de um foco coral por frame mataria a maioria das palavras fortes de qualquer jeito. Duas ou três palavras coral em onze respirações leem como acidente, não como sistema. **Isso exige a flag `forteSemCor` ligada**, senão o rig pinta a palavra de peso de coral sozinho (ver o achado no fim do documento).

```
1,400 a 2,500   eu já mandei pergunta       peso: mandei
2,500 a 3,600   que não voltou.             peso: voltou
4,000 a 5,567   toda semana chega outra.    peso: outra     (segura no freeze, sai em 6,500)
7,300 a 8,300   eu não deixo                peso: deixo
8,300 a 9,300   pergunta sem dono.          peso: dono
13,600 a 14,367 plano ME,                   peso: ME        (bloco de 2 linhas)
14,367 a 15,167 Simples Nacional.           peso: Nacional
15,467 a 16,500 o app não abriu.            peso: abriu
16,500 a 17,500 ninguém paga hoje.          peso: hoje
18,000 a 19,000 eu guardo o preço           peso: guardo
19,000 a 19,867 no seu nome.                peso: nome      (fade de saída 19,867 a 20,133)
19,933 a 21,000 vai, legaliza aí.           peso: aí        (só na versão COM o fecho falado)
```

**Janelas sem legenda, todas intencionais e documentadas:**
- **0,000 a 1,400** (hook): o hook é display de 96px. Legendar ele duas vezes destrói o hook.
- **6,500 a 7,300** (fim do freeze): o quadro precisa ficar vazio pra o desempilhar valer.
- **9,300 a 13,600** (desempilhar final e oferta inteira): aqui a folha de 74px é o texto legível em quadro, e legendar por baixo o que já está escrito em corpo grande é ruído.
- **20,133 a 21,000** na versão sem o fecho falado: nela o wordmark, a linha de CTA e o botão são o texto legível.

**Em nenhum momento da peça o quadro fica sem texto legível.**

---

**End card.**

Fundo `#FAF8F5`, o mesmo valor do beat de preço, então o corte de f534 não tem emenda visível.

```
Corte seco em f534 (17,800)

Wordmark:        Legalizai                                    f538 a f550 (400ms)
                 (Legaliz em #1B1E24 · ai em coral-500 #F2643C, acendendo em f570)
                 largura 620px, centro em (540, 740)

Linha de CTA:    Entra na lista. Eu aviso quando abrir.        f545 a f553 (250ms)
                 Sora 600 · 44px · #1B1E24 · centralizada · baseline y=910

Botão:           Cadastre-se                                   f548 a f556 (250ms)
                 Sora 700 · 56px · #FFFFFF sobre coral-600 #DD4E27
                 caixa 560 x 132 · raio 36 · centro x=540 · y 1000 a 1132
                 assentado em f556, parado em quadro por 2,43s

Super:           Condição garantida pra quem entra na lista.
                 Vale até 31 de dezembro de 2026, ou enquanto a lista
                 estiver aberta, o que vier primeiro.
                 Sora 400 · 30px · #736E67 · x=72 · baselines 1420 / 1460 / 1500

Locução:         "Eu guardo o preço no seu nome."   18,000 a 19,867  (obrigatória)
Fala (opcional): "Vai, legaliza aí."                19,933 a 21,000
```

Botão do Meta na campanha: **`Cadastre-se`**.

---

**Copy do post no Meta.**

**Primary text**
```
Plano ME, Simples Nacional. R$79 por mês nos 3 primeiros meses, R$139 depois. O app ainda não abriu e ninguém paga nada hoje: você só entra na lista e o preço fica guardado no seu nome.

Toda semana chega outra pergunta. Eu não deixo pergunta sem dono.

Condição garantida pra quem entra na lista. Vale até 31 de dezembro de 2026, ou enquanto a lista estiver aberta, o que vier primeiro.
```

**Headline** (33 caracteres)
```
Suas perguntas passam a ter dono.
```

**Description**
```
ME e Simples Nacional. R$79 nos 3 primeiros meses, R$139 depois.
```

---

**Lista de produção.**

| # | Asset | Origem | Estado | Como produzir |
|---|---|---|---|---|
| 1 | Comp `MASTER-1080x1920-30`, 630 frames, 16bpc, `GUIA-safe` 936x1320 (`x 72 a 1008`, `y 200 a 1520`) | [AE] | **NOVO · TEMPLATE REUTILIZÁVEL** | Fork de `c:\Projects\Legalizei_Videos\marketing\filme\escalada\jsx\10-estrutura.jsx`. Trocar `W=3840,H=2160` por 1080x1920, substituir a tabela `TAKES` pelos 7 beats deste roteiro, reescrever o `GUIA-safe`. Manter `findItem/removeItem/findOrCreateFolder` (linhas 26, 32 e 36). **Mesmo arquivo que o criativo 3 pede; produzir uma vez para a leva.** |
| 2 | Comp `_CONTROLE` com Color Controls nomeados | [AE] | **JÁ EXISTE** · `...\escalada\jsx\00-tokens.jsx` | Roda direto. Precisa de 4 controles novos nesta peça: `mesa-escura` (lê `ink-hero`), `regua-perigo` (lê `text-tertiary-dark`), `sombra-mesa` (lê `ink-900`) e **`luz-angulo`** (Angle Control, 138 a 132 graus). **Nenhum deles com hex digitado à mão: todos leem do `tokens.json`.** |
| 3 | `data/tokens.json` | [AE] | **JÁ EXISTE** · `...\escalada\tools\gera-tokens.mjs` | Trocar `filme.master` por `{w:1080,h:1920,dur:630}` e reescrever o bloco `lettering` com a régua 9:16. Nenhum hex digitado à mão em lugar nenhum. |
| 4 | `PRE-papel-pergunta` **880x210, raio 48**, `#FFFFFF`, hairline `#E3DED7` 3px, slot de texto Sora 600 **fit-to-box em {96,88,80,72,64}**, 1 ou 2 linhas, padding 32px | [AE] | **NOVO · TEMPLATE REUTILIZÁVEL** | `rrect()` da linha 29 de `...\escalada\jsx\20-precomps.jsx` resolve o retângulo com fill, stroke e raio. Cinco instâncias data-driven a partir de um JSON de perguntas, com `cy` e `rot` como **campos, não constantes**. **Os cinco asserts estão na seção "As cinco perguntas".** |
| 5 | Sombra física dos papéis | [AE] | **JÁ EXISTE, precisa de 2 linhas novas** · `...\escalada\jsx\48-polimento.jsx`, função `sombra()` | A função real é `sombra(ly, opac255, dist, soft)` e escreve só `ADBE Drop Shadow-0002`, `-0004` e `-0005`. **Ela não tem ângulo nem cor.** Adicionar `-0001` (cor, lida de `sombra-mesa`) e `-0003` (direção, com expressão apontando pro `luz-angulo` do `_CONTROLE`). Valores: distância 40, suavidade 48, opacidade 38%. **É luz de cena tridimensional, não separação de UI, e por isso é decisão do Pedro no Gate 6.** Nunca em texto. `brilho()` fica desligado na peça inteira; o `brand-glow` do `AI` é gradiente, não `brilho()`. |
| 6 | Régua de perigo: shape layer, stroke 3px `#8E8981`, `x 72 a 1008`, `y 890`, com trim path para a retração em f303 | [AE] | **NOVO** | Um path de dois pontos. A retração é `Trim Paths End` de 100 a 0 em 250ms ease-out, da direita para a esquerda. **Não é Linear Wipe** (o wipe deixa a espessura irregular na saída). **A régua nunca vira âmbar nem crimson, em versão nenhuma:** cor de estado só marca estado do CNPJ. |
| 7 | Varredura de luz: mancha elíptica de feather alto, com o ângulo lido do `luz-angulo` (138 para 132 graus), f0 a f167 | [AE] | **JÁ EXISTE conceito** · `...\escalada\jsx\48-polimento.jsx` + técnica `mancha()` dos takes (linha 106 do `41-take-t1.jsx`) | É o único movimento contínuo do ato escuro e o substituto declarado do push-in. **Congela em f168 junto com o som**, e não volta. O mesmo `luz-angulo` dirige as cinco sombras: uma mesa, uma luz. |
| 8 | `PRE-tique`: check coral-600 desenhado por trim path em **150ms** | [AE] | **NOVO · TEMPLATE REUTILIZÁVEL** | Mesmo gesto do check do logo. Cinco instâncias com offset de 16 frames. **Assert:** se a soma de tique (5f) mais saída (8f) alcançar o stagger, o build falha. Com 16f de stagger sobram 3 frames de folga. |
| 9 | Saída coreografada dos 5 papéis | [AE] | **JÁ EXISTE conceito** · `...\escalada\jsx\50-master.jsx`, `sai()` na linha 30 | **Não usar `easeSaida()` (linha 20).** O comentário do próprio arquivo diz "começa devagar e ACELERA saindo", e ease-in isolado só é permitido em objeto caindo por gravidade na virada. Aqui é 250ms ease-out com a borda cruzando `x=1080` no frame 5 de 8, então a desaceleração acontece fora de quadro. |
| 10 | Folha da oferta **936x460, raio 48**, com 3 linhas em Sora 700 74px CAPS | [AE] | **NOVO** | Reusa o mesmo `rrect()`. Entrada horizontal de `x=-936` a `x=72` em 400ms ease-out. **Quebra travada:** `CONTADOR` / `DE VERDADE DO` / `SIMPLES NACIONAL`. **Assert de largura:** `SIMPLES NACIONAL` a 74px mede ~805px e o útil interno é 824px. `CONTADOR DE VERDADE` numa linha só mede ~956px e **não cabe**, por isso a quebra é dado travado e não escolha de layout. Se a fonte resolver diferente, o build falha em vez de estourar a folha. |
| 11 | Folha de preço **936x780, raio 48**, com rótulo, dois preços a 260px e dois micro-labels | [AE] | **NOVO · TEMPLATE REUTILIZÁVEL** | Text layers simples sobre `rrect()`. Rótulo e micro-labels em **40px, não 32px**: eles vendem plano e prazo, e a régua 2.3 põe piso de 40px em tudo que vende. **Dois asserts:** (a) se os dois `fontSize` de preço divergirem, o build falha; (b) se `R$139` a 260px passar de `x=952`, o build falha (ele mede ~801px a partir de `x=128`, terminando em 929). **Por que 260 e não 300:** a régua 2.5 calcula a âncora pra caber no contêiner, e aqui o contêiner é a folha (824px úteis), não o quadro. 260 está acima do piso de 240. |
| 12 | Contador de partes: `PERGUNTA N` e depois `RESPONDIDAS · N` | [AE] | **NOVO, simples** | Text layer com hard swap de 1 frame e escala 88 a 100 em 5f. **Sem Directional Blur, sem slot machine, sem curva exponencial.** Blur direcional é proibição de motion e foi o achado transversal nº 1 do júri. **Não usar `54-contador-fix.jsx` aqui:** verifiquei o arquivo, ele adiciona `ADBE Motion Blur` na linha 61. A contagem é sempre **ascendente**, nunca regressiva, pra não ler como countdown. |
| 13 | Super de condição, 30px, 3 linhas, baselines 1420 / 1460 / 1500, com troca de cor `#8E8981` para `#736E67` no corte de f399 | [AE] | **NOVO · TEMPLATE REUTILIZÁVEL, compartilhado com todas as peças B e C da leva** | Objeto único parametrizado por `tamanho`, `linhas`, `baselines` e `tema`. **Nesta peça não há versão promovida:** aumentar a letra miúda é o gesto exclusivo do criativo 3. |
| 14 | Legenda queimada word-by-word, **sem coral**, troca de tema dark para papel em f399 | [AE] | **JÁ EXISTE, e é mais que 3 linhas** · `...\escalada\jsx\32-lettering.jsx` | Linha 17: trocar `var W=3840,H=2160` por leitura de `takeComp.width/height`. `$.global.LETTERING_OPCOES = {W:1080,H:1920,FPS:30,duasCores:true,forteSemCor:true,tam:60,larguraMax:880,xc:540,y1:1320,y2a:1245,y2b:1320,GAP:11}`, com `tema` alternando `"dark"` até f398 e `"papel"` de f399. **`forteSemCor` é flag NOVA, de uma linha** (`CORAL_500 = TEXTO_DARK` logo depois da linha 25), e sem ela o rig pinta a palavra de peso de coral sozinho. **E também os valores de animação, que hoje são todos de 4K:** `durAnim` 6f/12f vira 5f/8f, `dy` 56/80 vira 28/40, escalas 90 e 84 viram 92 e 88, **rotação alternada de ±4 graus desligada**. Modo `apple` desligado. |
| 15 | Validação de legenda e geração do `31-legendas-data.jsx` | [AE] | **JÁ EXISTE, precisa de um assert novo** · `...\escalada\tools\fase3-gera-legendas.py` | Trocar os dicionários `LINHAS` e `CORAL`. Manter os asserts de travessão (linha 153) e de teto de coral (linha 147). **Adicionar dois asserts:** (a) 5 palavras e 2 linhas por bloco; (b) **se `forteSemCor` não estiver ligado no `LETTERING_OPCOES`, o build falha**, porque o assert de coral existente conta a flag do JSON e não o que o rig pinta, e sozinho ele daria passa falso. É o único ponto do pipeline que checa regra de marca automaticamente, e ele estava cego pra este caso. |
| 16 | Word-sync da locução | [FFMPEG] + Python | **JÁ EXISTE** · `...\escalada\tools\fase1-processa.py` + `.venv` com WhisperX | Usar só a parte de alinhamento word-level. Snap de todo onset para 1/30s. Os blocos de legenda sem locução na versão de 17s são autorados em grade fixa, não alinhados. |
| 17 | Passe de acabamento, grain 1,5% (2% nos 8 frames do corte de f399) | [AE] | **JÁ EXISTE** · `...\escalada\jsx\48-polimento.jsx` + `PRE-grade-grain` | Rodar só o grain. A subida temporária para 2% é anti-banding na troca de área grande, que é o único lugar onde a peça muda o quadro inteiro de uma vez. |
| 18 | Helper de propriedade de efeito em AE português | [AE] | **JÁ EXISTE** · `...\escalada\jsx\52-fumaca-t7.jsx`, função `fxProp()` (linha 17) | Copiar para o utilitário da leva. Recursivo, imune a matchName contra nome pt-BR. Necessário pro item 5, que agora escreve propriedades por índice. |
| 19 | Lockup e acendimento do `AI` | **[SVG]** | **JÁ EXISTE** · `c:\Projects\Legalizei_Videos\identidade\logos\legalizai-logo-horizontal.svg` + mecanismo em `...\escalada\jsx\53-lettering-t8-cores.jsx` | Fundo é papel, então é o master horizontal tricolor. **Nunca o `legalizei-logo-app-fundo-solido.svg`**, cujo wordmark interno é o antigo "Legalizei". O `53-` repinta por critério ASCII, imune a acento. |
| 20 | End card completo | [AE] ou [FFMPEG] | **NOVO sobre JÁ EXISTE · TEMPLATE REUTILIZÁVEL** · `c:\Projects\Legalizei_Videos\marketing\vinheta\out\vinheta-9x16-4k60-v2.mp4` | Rota rápida: recortar os últimos 2,5s da vinheta e compor botão, linhas de CTA e super por cima no AE. Cerca de 1h contra 4 a 6h do zero. **Duas verificações antes de usar:** (a) confirmar em quadro que o wordmark de dentro da vinheta é **Legalizai com A**, e não o antigo, senão a peça reprova na régua 1.18 por um asset reciclado; (b) conform declarado de **60 para 30 fps** e de 4K para 1080, sem frame blend. **Fallback:** montar o end card do SVG, que é o que os outros itens já fazem. **Idêntico ao das outras 5 peças.** |
| 21 | **19 arquivos de SFX sintetizados, em 11 famílias** | [FFMPEG] + numpy | **NOVO** (técnica documentada, código perdido) | `sfx_sala_tom` · `sfx_papel_assenta_a` a `_e` (5 timbres descendo de 220 a 178 Hz conforme a pilha engrossa) · `sfx_papel_escorrega` · `sfx_tique_1` a `_5` (subindo 1 semitom cada, pro ouvido contar) · `sfx_folha_desliza` · `sfx_regua_retrai` · `sfx_folha_entra` · `sfx_folha_assenta` · `sfx_corte_papel` · `sfx_preco_assenta` · `sfx_ai_chime`. Reescrever o sintetizador numpy do escalada. **Guardar em `marketing\audio\sfx\` versionado desta vez, não no scratchpad** (a pasta ainda não existe). Os cinco ticks e os cinco papéis são a maior biblioteca de SFX da leva e servem qualquer peça de objeto. |
| 22 | Trilha em stems | [FFMPEG] | **JÁ EXISTE, verificado** · `...\escalada\audio\Trilha\stems\Light Years - Out To The World\` | Envelope por camada: bass do f0 a -22, sobe a -18 em f56, **tudo corta em f168**, silêncio absoluto f168 a f177, room tone sozinho até f212, instruments em f213, camada cheia em f399, corte seco em f525, nota de resolução em f534 morrendo em f620. |
| 23 | Locução, 41 palavras de corpo | ElevenLabs | **NOVO** | Guia de fraseado em `c:\Projects\Legalizei_Videos\marketing\audio\Narração\narracao-elevenlabs-escalada.md`. Registro sóbrio, sem sorriso na voz, uma ideia por respiração. Plano B verificado: Voiceover da Higgsfield a 1,35 créditos por trecho. |
| 24 | Textura da mesa | **[HIGGSFIELD]** | **OPCIONAL, 2 a 4 créditos** | Um still Nano Banana Pro de madeira escura com luz rasante, usado a 22% de opacidade sobre o gradiente `ink-hero`. Prompt negativo obrigatório: `no text, no letters, no numbers, no typography, no logo, no face, no animal, no hands, no paper`. Guardar com o prompt e a proveniência ao lado. **Fallback [AE] pronto e suficiente:** Fractal Noise em modo overlay a 8% mais o `ink-hero` mais grain. **A peça fecha sem gastar um crédito, e é assim que ela nasce.** |
| 25 | Tela do app | **[TELA APP]** | **DESCARTADO, com motivo** | O conceito listava `marketing\telas-app\avisos.png` como plano opcional de 1,2s. Fora por três razões: custaria um acendimento de coral nativo da UI (que o júri disse que ninguém estava contando), abriria uma auditoria de crop numa leva onde dois crops já reprovaram peças (o travessão do campo de CNAE e o R$ 178,31 da tela de obrigações), e quebraria a unidade do mundo de mesa e papel. O criativo 3 já cobre a prova de produto real no mesmo mote com uma tela auditada. |
| 26 | Mux final | [FFMPEG] | **JÁ EXISTE** · pipeline `mux-final` do escalada | `aerender` para sequência TIFF em chunks de 40 frames, ffmpeg incremental, concat. **Nunca saída direta de mp4 pelo AE** (encoder H.264 do MediaCore quebrado nesta máquina). `aerender` sempre com `-mfr OFF 100`. Loudnorm 2-pass a -14 LUFS e -1,5 dBTP, dual-mono 48 kHz. Validar por `count_frames` no mp4, nunca contando TIFs. |

**Não usados desta leva, e por quê:** `...\jsx\54-contador-fix.jsx` (carrega `ADBE Motion Blur` embutido na linha 61, e o contador desta peça é hard swap), `...\jsx\46-mapa-dados.jsx` (peça de mote C não tem mapa, por regra dura), `...\jsx\50-master.jsx` `easeSaida()` (acelera na saída), `...\jsx\56-dof-t8.jsx` (nada sai de foco nesta peça), todos os `40-49-take-*.jsx` (são conceito, servem só como catálogo de técnica, e é de lá que sai o `mancha()`).

**Pré-requisito de máquina:** 1,8 GB livres em C: reprova o render. Alvo mínimo de 30 GB antes do primeiro `aerender`. Recuperável rápido: `...\escalada\tools\.venv` (2,3 GB, recriável depois do word-sync), os `.aep` antigos do escalada fora do git, `marketing\mascote\renders` (946 MB, mascote está fora desta leva).

---

**Contagem de palavras faladas.**

| Bloco | Janela | Fala | Palavras | Sílabas | Sílabas/s |
|---|---|---|---|---|---|
| 1 | 1,400 a 3,600 | "Eu já mandei pergunta que não voltou." | 7 | 11 | 5,0 |
| 2 | 4,000 a 5,567 | "Toda semana chega outra." | 4 | 9 | 5,7 |
| 3 | 5,600 a 7,100 | *(freeze, sem fala)* | 0 | 0 | 0 |
| 4 | 7,300 a 9,300 | "Eu não deixo pergunta sem dono." | 6 | 10 | 5,0 |
| 5 | 10,700 a 13,233 | "Contador de verdade do Simples Nacional." | 6 | 14 | 5,5 |
| 6 | **13,600 a 15,167** | "Plano ME, Simples Nacional." | 4 | 9 | 5,7 |
| 7 | **15,467 a 17,500** | "O app não abriu. Ninguém paga hoje." | 7 | 12 | **5,9** |
| — | **17,500 a 17,800** | *(300ms de silêncio antes do corte do end card)* | 0 | 0 | 0 |
| 8 | 18,000 a 19,867 | "Eu guardo o preço no seu nome." | 7 | 11 | 5,9 |
| **Corpo** | | | **41** | **76** | |
| Slot | 19,933 a 21,000 | "Vai, legaliza aí." | 3 | 7 | 6,6 |
| **Total** | | | **44** | **83** | |

**Checagem contra a régua de 2,1 palavras por segundo:**
- Com a frase de fecho opcional: 44 ÷ 21,0s = **2,095 palavras por segundo.** Passa, cravado no teto.
- Sem ela: 41 ÷ 21,0s = **1,95 palavras por segundo.** Passa.
- **Checagem de sílabas por segundo, que é a que o TTS quebra:** nenhuma respiração passa de **5,9** no corpo. Fala normal em português brasileiro roda de 5,5 a 6,5, e leitura sóbria de anúncio roda de 4,5 a 5,5. O único bloco acima disso é o slot opcional, a 6,6, que é uma frase curta e cantada e não é leitura.
- Tempo com voz de fato: **13,77s de fala em 21,0s de peça**, ou seja **34% de silêncio**. A sobra foi gasta exatamente onde a régua manda: no meio. O freeze de 1,5s e os 3,0s do desempilhar somam 4,5 segundos sem uma única palavra, e eles são o material da peça, não folga.
- **O hook e o CTA não perderam nada:** o hook não tem fala nenhuma (o primeiro som é papel em f10, a primeira palavra só entra em 1,400s) e o end card tem duas locuções, uma obrigatória e uma opcional.

---

**Variação de corte, versão de 17,0s (510 frames).**

Mesmo hook, mesma mecânica, mesmo payoff. O que sai é paciência e duas locuções, não argumento. **Não é uma versão de 15,0s, e o motivo é aritmético, não estético:** o bloco de áudio obrigatório do mote C (rótulo, os três membros da mecânica de reserva e o slot da frase de fecho, com as respirações entre eles) mede **7,20s contínuos**, e ele só pode começar no quadro do preço. Somado aos 65 frames mínimos do desempilhar, aos 24 do freeze, aos 41 do hook e à folha da oferta, isso não cabe em 450 frames sem cortar rótulo ou mecânica, que são exatamente as duas coisas que não podem sair.

| Beat | 21s (f) | **17s (f)** | O que muda |
|---|---|---|---|
| A linha | f0 a f41 | **f0 a f41** | **Intocado.** É o ativo da peça e o motivo da reescrita. |
| A pilha cresce | f42 a f167 | **f42 a f137** | Os 5 papéis continuam (o contador precisa chegar a 5), mas as quedas apertam: P2 em f52, P3 em f78, P4 em f100, P5 em f118. Intervalos de 52 / 26 / 22 / 18 frames, ainda acelerando. **Sai a locução 2** (`Toda semana chega outra.`), que migra para o primary text do post. **A locução 1 fica.** A piada do P4 escorregando **fica**: custa 8 frames e é o único humor da peça. |
| O freeze | f168 a f212 | **f138 a f161** | Encolhe de 45 para 24 frames, ou **0,80s**, ainda muito acima do limiar em que o freeze é percebido. O silêncio absoluto de 300ms **não encolhe**, porque ele é o evento. A saída da legenda passa pra f150. |
| O desempilhar | f213 a f302 | **f162 a f230** | Stagger de 16 para **13 frames**. Tique de 5f mais saída de **250ms (8f)** dão 13f, exatamente o stagger, com zero sobreposição de acendimento. **A saída nunca vira 6 frames:** 200ms não existe na régua de motion. Cinco ticks no som, intactos. |
| A oferta | f303 a f398 | **f231 a f278** | Hold cai de 2,77s para **1,60s**, acima do mínimo de 1,2s de âncora não-preço. **Sai a locução 5**, e a folha de 74px carrega o claim sozinha em quadro, em silêncio, o que aliás fica melhor. |
| O preço | f399 a f533 | **f279 a f404** | Hold de **4,20s**, igual ao da versão longa. Locuções 6 e 7 ficam **integrais**: rótulo e mecânica de reserva não são cortáveis. Locução 6 em 9,600 a 11,167, locução 7 em 11,167 a 13,200, e os 300ms de silêncio antes do end card ficam. |
| End card | f534 a f629 | **f405 a f509** | 3,50s. Botão assentado em f427 e parado por **2,73s**, acima do mínimo de 1,80s. `AI` acende em f441. Locução 8 (13,700 a 15,567) e o slot de 1,067s (15,633 a 16,700) **permanecem intocados**. |
| **Total** | **630** | **510** | |

**Contagem de fala da versão de 17s:** 31 palavras de corpo mais 3 do slot, ou **34 ÷ 17,0s = 2,0 palavras por segundo.** Passa com folga.

**Consequência de cor na versão curta:** a peça cai na faixa de 15 a 20s, onde o teto é **2 acendimentos no palco**. Ela continua com exatamente 2 (os tiques e o `R$79`), então passa sem nenhuma alteração. Foi por isso que a virada ficou em corte seco desde o começo.

**O que NÃO pode sair em nenhuma versão:** a régua de perigo e a folga de 32px, o contador de partes, o silêncio absoluto de 300ms, os cinco tiques, os dois preços juntos e do mesmo corpo, o rótulo `ME · SIMPLES NACIONAL`, o qualificador `DO SIMPLES NACIONAL` colado em `CONTADOR DE VERDADE`, o super de condição, a data por extenso, o botão `Cadastre-se`, a locução `Eu guardo o preço no seu nome.` e o slot da frase de fecho.

**Custo de produzir as duas:** troca de JSON de tempos, recorte de timeline e re-render. Cerca de 40 minutos, e entrega ao Meta duas variantes do mesmo argumento.

---

**Notas de direção que valem pra peça inteira.**

- **Zero movimento de câmera nos 630 frames.** Nenhum push-in, nenhum pan, nenhuma rotação, nenhum reenquadramento. A régua de retenção pede push-in de 3 a 4% em qualquer plano acima de 2 segundos, e esta peça compra o oposto de propósito: a câmera imóvel é o vigia. O substituto anti-imagem-parada é a varredura de luz, que roda contínua de f0 a f167 e congela junto com o som. **É posição de direção, não esquecimento, e está no Gate 3.**
- **Uma mesa, uma luz.** O ângulo da sombra dos cinco papéis e o ângulo da varredura leem o mesmo `luz-angulo` do `_CONTROLE`. Se um dia alguém mudar a luz, as cinco sombras mudam junto, e não existe a possibilidade de a cena ter duas fontes.
- **Sombra é luz de cena, nunca separação de UI, e nunca em texto.** Ela existe porque isto é uma mesa vista de cima com luz rasante, e é ela que faz o beat do freeze existir. Não é a sombra decorativa que a régua 1.9 proíbe, mas também não é uma exceção que a régua conceda, e por isso ela é decisão explícita do Pedro no Gate 6.
- **Teto de micro-evento respeitado.** Maior janela sem micro-evento: **0,90s**, dentro do freeze, entre f168 e f195. Segunda maior: 0,83s no hold do end card, que é a exceção documentada da leva inteira, porque o canon exige simultaneamente hold mínimo de 1,80s no botão e proíbe pulso, respiração ou seta piscando no CTA. Um end card assentado é obrigatoriamente parado.
- **Nenhuma interface de terceiro, nenhum balão de conversa, nenhum visto, nenhuma notificação.** As perguntas são papel numa mesa. Esse é o antídoto de execução (não de intenção) contra o risco de a peça ler como alfinetada em concorrente, e ele é regra dura aqui: se um dia alguém sugerir "e se fosse um print de conversa", a resposta é não.
- **As cinco perguntas passam por gate factual antes de qualquer linha de ExtendScript.** Pergunta tecnicamente errada em 64px é erro factual em corpo grande, e pergunta ingênua expõe quem assiste e reprova a peça no teste do arquétipo.
- **O contador é ascendente sempre.** `PERGUNTA 1` a `5` e depois `RESPONDIDAS · 1` a `· 5`. Nada nesta peça conta pra trás, e nada nesta peça mede tempo.
- **A régua de perigo é um traço neutro.** Nunca âmbar, nunca crimson, nunca coral, em versão nenhuma e em nenhum passe de cor. Cor de estado nesta marca só marca estado do CNPJ.
- **O `AI` acende em f570, desacoplado da fala de propósito.** A locução 8 é obrigatória e independente, então a mecânica de reserva no áudio não depende da frase pendente, e o acendimento visual acontece no mesmo frame com ou sem ela. Zero retiming entre as duas versões.

---

**Gates de validação humana.**

Nada de ExtendScript antes destes seis. Os dois primeiros são bloqueio duro.

**1. GATE FACTUAL E DE TOM · Mauro. As cinco perguntas. Bloqueia o build.**
Elas ficam em quadro em Sora 600, e uma delas por 1,5 segundo inteiro durante o freeze. Uma pergunta tecnicamente errada é erro factual em corpo grande; uma pergunta ingênua expõe quem assiste e reprova a peça no teste do arquétipo. **Pergunta exata para o Mauro:** *para um ME optante pelo Simples Nacional em Belo Horizonte, prestador de serviço, estas cinco dúvidas são (a) tecnicamente corretas como formuladas e (b) dúvidas que um cliente competente de fato manda, e não dúvidas de quem nunca leu nada?*
```
1. anexo III ou V?
2. pró-labore de quanto, sem pagar INSS demais?
3. nota pra fora daqui muda onde pago ISS?
4. se eu não faturar, declaro mesmo assim?
5. distribuição de lucro paga imposto?
```
Se qualquer uma cair, a substituição é troca de string pura no JSON do item 4: mesmo corpo, mesma caixa, mesmo `cy`, mesmo `rot`, zero retiming. **Teto de 22 caracteres por linha e 2 linhas por papel**, e a substituta da P1 precisa caber em **uma linha de 15 caracteres**, senão o hook perde os 96px.

**2. GATE DE CLAIM · Mauro ou Larissa. A oferta central. Bloqueia o build.**
A peça afirma, em 74px e em voz: `CONTADOR DE VERDADE DO SIMPLES NACIONAL · JÁ NO PLANO DE ENTRADA`. **Pergunta exata:** *no plano ME a R$79 nos 3 primeiros meses e R$139 depois, o cliente fala com um contador humano com CRC, e isso vale no plano de entrada e não só num plano superior?* Se a resposta for qualquer coisa diferente de um sim limpo, a folha da oferta muda de texto e o beat 5 é reescrito, e nada mais na peça precisa mudar.

**3. GATE DE DIREÇÃO · Pedro. Câmera absolutamente parada, sem push-in.**
Esta peça tem zero movimento de câmera em 630 frames, de propósito: a câmera imóvel é o vigia, e é a alma declarada do conceito. O substituto anti-imagem-parada é a varredura de luz. É uma posição de direção, não um esquecimento, e o Pedro precisa comprá-la antes do build. Se ele preferir a régua, o conserto é 3% de escala na comp do palco de f0 a f167 e de f213 a f302, e a peça perde a coisa que a distingue das outras cinco.

**4. GATE DE LEVA · Pedro. A emenda do loop.**
O manual pede que o último frame e o primeiro tenham o mesmo valor de fundo, para o Reels reiniciar sem costura. **Esta peça fecha em papel `#FAF8F5` e abre em mesa escura `#15171C`.** Comprei o arco dark para papel, que é canon de marca, em vez da emenda invisível. A leva não fica descoberta: o criativo 3 abre e fecha em papel e entrega o loop limpo. Se o Pedro quiser a emenda aqui também, a única saída é abrir a peça em papel, o que custa o arco inteiro. **Não decidi isso sozinho.**

**5. GATE HERDADO · Pedro. Vale para os 6 criativos, não só para este.**
(a) **A data por extenso está na tela do f42 ao f629 e não está na voz.** Falar `Vale até 31 de dezembro de 2026, ou enquanto a lista estiver aberta, o que vier primeiro.` custa cerca de 41 sílabas, ou seja cerca de 7,5 segundos, e a regra 1.26 proíbe dizer um dos dois limites sem o outro. Não cabe em 21s sem matar o freeze. Mesma ressalva aberta no criativo 3, mesma decisão pendente. (b) **"Vai, legaliza aí." continua sem validação explícita.** A peça foi construída para fechar idêntica com e sem: o slot de 1,067s vira hold do logo, e a locução 8 é obrigatória e independente, então a mecânica de reserva no áudio não depende da frase pendente. O acendimento do `AI` em f570 é desacoplado da fala de propósito. (c) **O still de textura do Higgsfield (2 a 4 créditos) é opcional** e tem fallback em AE. Autorizar ou negar antes do build, para não parar o render no meio.

**6. GATE DE SOMBRA · Pedro. Novo, aberto pelo guardian.**
A peça usa Drop Shadow nos cinco papéis e é ela que faz a mesa existir e o beat do freeze funcionar. **A régua 1.9 não autoriza isso.** A leitura que eu defendo é que a régua fala de sombra como substituto de separação de UI sobre papel, e aqui a sombra é luz de uma cena tridimensional, da mesma família da luz rasante. Mas eu não invento autorização de canon. **Pergunta exata para o Pedro:** *sombra projetada de objeto físico numa cena de mesa com luz rasante está dentro da régua, ou a leva inteira é sem sombra?* Se a resposta for "sem sombra", a peça continua de pé por luminância (papel branco sobre mesa escura separa sozinho), mas o beat do freeze perde a imagem que ele foi escrito para ter, e o Gate 3 precisa ser reavaliado junto.

**7. GATE DE MÁQUINA · antes do primeiro `aerender`.**
1,8 GB livres em C: reprovam qualquer render de sequência. Alvo mínimo de 30 GB. Isso não é desta peça, é da leva, e é o item que o júri de marca disse que ninguém enfrentou.

---

**Ressalvas e pendências.**

1. **Hook de mote C continua sendo o ponto mais frágil da leva, mesmo corrigido.** A P1 agora resolve em 96px com 4 palavras e a régua de perigo dá ao frame 1 uma leitura gráfica que sobrevive em grid. Ainda assim, `anexo III ou V?` é jargão, e jargão só para o dedo de quem já tem ME. Isso é aceito de propósito: a peça é de fundo de funil e o jargão é qualificação de público, não acidente. **Se o Meta entregar CPM alto e CTR baixo, a variante de hook a testar é abrir com a pilha já formada e a régua a 32px**, trocando o buraco de "que pergunta é essa?" para "o que acontece quando ela encostar?". Custo: um in-point e um re-render.
2. **A data por extenso vive só na tela.** Ressalva herdada, idêntica à do criativo 3, registrada no Gate 5(a). Não é escolha desta peça e não tem conserto dentro de 21s.
3. **A sombra dos papéis está fora do texto literal da régua 1.9.** Registrada no Gate 6. A peça foi escrita assumindo que ela fica, e existe rota de fallback sem ela.
4. **O `AI` acende 1,5s antes da palavra "aí" na versão com a frase falada.** É consequência direta da exigência de a peça rodar idêntica com e sem o fecho, e o desacoplamento é deliberado. Se o Pedro validar a frase em definitivo, mover o acendimento pra f615 custa um keyframe, e aí a peça deixa de ser idêntica nas duas versões.
5. **A versão curta é de 17,0s e não de 15,0s.** Se a mesa exigir 15,0s cravados, a única saída honesta é cortar a locução 4 e aceitar que a alma da peça no áudio fica reduzida a rótulo e mecânica, com a primeira pessoa vivendo só na legenda queimada. Eu não fiz esse corte, porque ele troca a coisa que distingue a peça por 2 segundos de duração.
6. **A legenda queimada não tem uma única palavra coral.** É desvio consciente da direção do Pedro de 14/08, com o motivo na seção de legenda. Se ele quiser coral, a troca é remover a flag `forteSemCor` **e** baixar o `R$79` para ink, porque as duas coisas não coexistem sob a regra de um foco coral por frame. Não dá pra ter as duas.

---

**Auditoria do guardian.**

Verificação item a item contra o checklist do canon, com o pressuposto de que a peça tinha um problema. Tinha vários.

**Bloco A, reprovação imediata: passa, com um achado de mecanismo corrigido.**
Mascote: zero em todo frame, nenhuma sombra com forma de bicho, nenhum plano de IA capaz de alucinar um (o prompt do item 24 carrega `no animal`). A peça não melhora com o suricato: ela é de objeto puro e nunca precisou dele. Concorrente: zero, e a proibição de qualquer UI de terceiro virou nota de direção permanente. Preços 79 e 139 corretos, nenhum 99, nenhum outro valor monetário em quadro, e o descarte da tela do app (item 25) foi mantido justamente porque ele evita o R$ 178,31 da tela de obrigações. Os dois preços juntos, mesmo corpo de 260px, com assert de divergência. Rótulo na tela e no áudio, no mesmo quadro do preço. Qualificador `DO SIMPLES NACIONAL` colado, e a quebra de linha da folha foi travada pra ele nunca se separar. Mecânica de reserva completa nos três membros, na tela e no áudio. Zero termo contratual, zero garantia, zero claim esticado, zero cobertura nacional, zero mapa, zero palavra Brasil. **Achado corrigido:** o rótulo de plano e os micro-labels de prazo estavam em 32px, e a régua 2.3 põe piso de 40px em tudo que vende. Subiram, e o layout interno da folha foi reancorado.

**Bloco B, prazo e escassez: passa com a ressalva herdada.**
Nenhum countdown, nenhum relógio, nenhuma contagem de vaga. O contador de partes foi checado especificamente por isso: ele é ascendente e conta objetos, não tempo, e ficou escrito no roteiro que ele nunca vira regressivo. Os dois limites sempre juntos, unidos por "o que vier primeiro", data por extenso. A ressalva de a data não estar na voz é herdada e está no Gate 5(a).

**Bloco C, hook e retenção: dois achados graves, corrigidos.**
O hook estava em 64px contra o piso de 96px do manual, que é exatamente a crítica que o júri de performance fez a esta peça pelo nome. Corrigido com fit-to-box e com a P1 virando a pergunta mais curta do jogo, travada por assert. O frame 1 tinha 7 palavras contra o teto de 6, e agora tem 6 cravado. **Terceiro achado:** o freeze de 45 frames não tinha micro-evento nenhum e o roteiro declarava 1,20s sem mostrar onde. Corrigido com a saída da legenda em f195, que é o único gesto possível dentro de um quadro congelado, e a maior janela imóvel real ficou em 0,90s. Ritmo de fala em 2,095 palavras por segundo, cravado no teto.

**Bloco D, legenda e tipografia: três achados, corrigidos.**
Teto de 24 caracteres por linha estourava a caixa do papel por cerca de 30px, e caiu pra 22 com as cinco perguntas requebradas. A quebra da folha da oferta estava solta, e `CONTADOR DE VERDADE` numa linha mede ~956px contra 824 úteis: travada em três linhas com `DO` no fim da segunda. Rótulo e micro-labels a 32px, corrigidos pra 40px. Baselines de legenda em 1245 e 1320, super em 1420, 1460 e 1500, micro-label em 320, tudo dentro da safe area, nada no corredor de ícones do Instagram, nada abaixo de 30px em quadro.

**Bloco E, cor: um achado crítico, corrigido.**
O roteiro mandava `duasCores:true`, trocar os dicionários e "manter os asserts como estão". Li o rig na máquina: `32-lettering.jsx` linha 195 a 202 cai na palavra de peso quando nenhuma vem flagada, e a linha 220 pinta ela de `CORAL_500`; `fase3-gera-legendas.py` linha 138 marca peso na última palavra de toda respiração. O render real teria 11 palavras coral empilhadas em cima dos tiques e do `R$79`, e o validador da linha 147 teria dado passa falso porque ele conta a flag do JSON, não o pixel. Corrigido com a flag `forteSemCor` e um assert novo que reprova o build se ela não estiver ligada. Acendimentos de palco: 2 de 3, declarados na ficha, nunca simultâneos, com 3 frames de folga entre tiques e sem nenhum coral nativo de UI, porque não há tela de app em quadro. Zero azul, zero coral em estado negativo, ink-400 em lugar nenhum, nenhum hex digitado na comp.

**Bloco F, motion e construção: quatro achados, corrigidos.**
Blur direcional: zero, e o roteiro já excluía o `54-contador-fix.jsx` pelo motivo certo, o que confirmei abrindo o arquivo (linha 61, `ADBE Motion Blur`). Saída de papel em 6 frames na versão curta é 200ms e não existe na régua: virou 250ms com stagger de 13 frames. Raio 24 em papel e folha é raio de chip: virou 48. Ângulo de sombra em 135 divergia da varredura em 138 a 132: unificado num controle só. Durações todas em 150, 250 e 400ms, ease-out em tudo, zero bounce, zero overshoot, zero glow além do `brand-glow`, hairline em 3px, grain em 1,5% com subida pra 2% na única troca de área grande.

**Bloco G, marca, origem e entrega: três achados, corrigidos.**
A função `sombra()` do `48-polimento.jsx` não tem parâmetro de ângulo nem de cor, e o roteiro prometia os dois: item reescrito com as duas propriedades que faltam. A vinheta reciclada no end card é 4K a 60 fps e ninguém verificou qual wordmark está dentro dela: virou gate de verificação, porque um "Legalizei" reciclado reprova a peça sozinho. A citação da régua 1.9 como autorização de sombra é falsa, e virou o Gate 6 em vez de uma frase confortável. Cada plano marcado com origem, Higgsfield em um still opcional com fallback e custo previsto de zero crédito, nenhuma foto de banco de imagem, um CTA só, alvo do humor na prática do setor.

**Aritmética, fora do checklist mas reprovaria na mesa de som.**
A locução 7 terminava no mesmo frame do corte do end card, matando os 300ms de silêncio que o próprio roteiro declara e contradizendo o envelope da trilha, que corta em f525: blocos 6 e 7 reancorados. E a variação de 15,0s não fecha: o bloco de áudio obrigatório do mote C mede 7,20s contínuos e não cabe em 450 frames junto com o desempilhar, o freeze e o hook, e a versão como estava rodaria a 2,67 palavras por segundo contra o teto de 2,1. Virou 17,0s a 2,0 palavras por segundo. Também corrigi a contagem de SFX (13 declarados contra 19 arquivos listados) e a contagem da headline (32 contra 33 caracteres), porque são os números que alguém vai orçar e alguém vai colar no Gerenciador.

**Verificado na máquina, existe de verdade:** `10-estrutura.jsx` (com `findItem` na 26, `removeItem` na 32 e `findOrCreateFolder` na 36), `00-tokens.jsx`, `20-precomps.jsx` (com `rrect()` na 29), `32-lettering.jsx` (com o hardcode de 4K na 17 e a queda pra palavra de peso na 195), `48-polimento.jsx` (com `sombra()` na 25 e `brilho()` na 34), `50-master.jsx` (com `easeSaida()` na 20 e `sai()` na 30), `52-fumaca-t7.jsx` (com `fxProp()` na 17), `53-lettering-t8-cores.jsx`, `54-contador-fix.jsx`, `gera-tokens.mjs`, `fase1-processa.py` com `.venv`, `fase3-gera-legendas.py` (com os asserts nas linhas 147 e 153), `legalizai-logo-horizontal.svg`, `vinheta-9x16-4k60-v2.mp4`, o guia de fraseado do ElevenLabs e os stems separados de "Light Years" em `audio/Trilha/stems/Light Years - Out To The World/`. **Nenhum asset fantasma na lista de produção.** A pasta `marketing\audio\sfx\` ainda não existe e precisa ser criada versionada, como o item 21 manda.

**Veredito: aprovado com correção.** A ideia não foi tocada. O que mudou foi corpo de fonte no hook, quebra de linha, geometria da pilha, uma flag que impedia o render de sair errado, duas propriedades de efeito que não existiam, o ancoramento de duas locuções, a duração da versão curta e a honestidade de duas justificativas.