# MANUAL DE MAGNETISMO. Campanha Legalizai waitlist, 6 criativos Reels 9:16

---

# PARTE 1. O que o material já produzido revela

## 1.1 O que eu abri de fato

| Material | Caminho | Estado |
|---|---|---|
| Filme institucional master com som | `c:/Projects/Legalizei_Videos/marketing/filme/escalada/previews/escalada_v104_com-som.mp4` | 1920x1080, 30fps, 81,0s, H.264 + AAC. Existe e está fechado |
| SPEC do filme | `c:/Projects/Legalizei_Videos/marketing/filme/escalada/SPEC.md` | 225 linhas, executável, com sistema de lettering fechado |
| Styleframes | `c:/Projects/Legalizei_Videos/marketing/styleframes/sf1.png`, `sf2.png`, `sf3.png` | 3 frames 9:16, dois de conteúdo e um de end card |
| Peça 9:16 existente | `c:/Projects/Legalizei_Videos/marketing/final/9x16/legalizai-15s-9x16-1080-preview.mp4` | 1080x1920, 60fps, 15,0s. Mais um master 4K mudo ao lado |
| Peças 16:9 de 18s | `c:/Projects/Legalizei_Videos/marketing/final/legalizai-18s-v12-com-som.mp4` e `v14` | duas rotas, "com-render" e "sem-render" |
| Vinheta | `c:/Projects/Legalizei_Videos/marketing/vinheta/out/vinheta-9x16-4k60.mp4` + `README.md` | 18 beats a 116 BPM, 9,31s, 4K60 |
| Referências do Pedro | `c:/Projects/Legalizei_Videos/insp/` | 3 webp de suricato, 1 mp4 de suricato e `vídeos/Vídeo de app institucional.mp4` |
| Telas reais | `c:/Projects/Legalizei_Videos/marketing/telas-app/` | 81 arquivos, 1290x2796, mais 5 travadas em `marketing/telas-filme/` |
| Rigs reutilizáveis | `c:/Projects/Legalizei_Videos/marketing/filme/escalada/jsx/` | 22 scripts jsx idempotentes, de `00-tokens.jsx` a `56-dof-t8.jsx` |

## 1.2 O que o filme "escalada" revela sobre o padrão de qualidade

Vi o filme inteiro em duas folhas de contato de 9 frames cada. O que ele mostra:

**A tipografia é o cenário, não a legenda do cenário.** Os planos mais fortes são números sozinhos: `7.400.000` em coral no meio de um campo de milhares de ícones, `0,7%` gigante ao lado de um cluster minúsculo, `4.600`, `5`, `22`. Em nenhum deles a imagem ilustra o número. O número **é** a imagem. Esse é o ativo mais transferível que existe para esta campanha, porque preço também é número.

**Uma palavra coral por respiração, e ela cai no fim da frase.** Nos frames que amostrei: "empresa.", "certo.", "assim.", "disso?", "cem.", "Caderno.", "Horizonte.". O coral não decora, ele marca o veredito da frase. A direção de lettering v2 que o Pedro travou em 14/08 (palavra forte coral por frase, cores alternadas, animação viva) está aplicada e funciona.

**O arco de cor é lei, e ele é bonito.** Dark `#15171C` no problema, virada para papel `#FAF8F5`, e depois um bloco de coral chapado inteiro (o take de Belo Horizonte, com o mapa de MG em branco recortado sobre coral). Essa terceira zona, o coral chapado ocupando 100% do quadro, é o momento mais bonito do filme e não está documentada como sistema em lugar nenhum. É um recurso subaproveitado.

**Zero sombra decorativa, hairline em tudo, ease-out sem bounce.** O iPhone é uma moldura de linha fina com tela coral chapada. Os cards brancos saem da tela sem drop shadow. Isso dá o ar de produto, não de anúncio.

**Densidade com hierarquia.** O take das obrigações e o take do "22" empilham muito elemento e ainda assim se leem, porque sempre há exatamente três níveis: eyebrow micro em CAPS, âncora display, corpo. Nunca quatro.

**Honestidade visível.** Micro-labels de fonte de dado (Receita Federal, dezembro de 2024; REDESIM) aparecem colados aos números. Isso não é detalhe de compliance, é parte do charme da marca.

## 1.3 O que o material revela sobre o gosto do Pedro

Isso é o mais útil, porque é evidência e não opinião.

**Ele gosta de aparelho em 3D com luz de estúdio.** A referência que ele salvou em `insp/vídeos/Vídeo de app institucional.mp4` é literalmente um template comercial de After Effects chamado "Phone Mockups": fundo cinza escuro em degradê, iPhone flutuando, câmera orbitando devagar, cards e gráficos saindo da tela. Ele não guardou referência de flat design, não guardou referência de meme, não guardou referência de UGC. Ele guardou aparelho, luz e câmera lenta.

**Ele gosta de sincronia musical milimétrica.** A vinheta é construída em beats, não em segundos: 18 beats a 116 BPM, o símbolo caindo como carimbo no drop, a mão clicando na palavra "DIGITAL" cravada no beat 13, o palco rasgando no beat 15. Um README inteiro de arquitetura para 9,31 segundos.

**Ele itera até doer no fecho de marca.** No diretório de previews existem 22 versões do take 8 (de `t8_versaoA_balao_v078.mp4` até `v102`) para resolver 2,6 segundos de logo. O fecho é sagrado.

**Ele não aceita coral lavado.** O README da vinheta traz a regra "View transform Standard, não AgX, porque AgX lava o coral", e "luz forte estoura o coral em plástico: cortar a key, nunca saturar". O coral cheio e correto é inegociável.

**O layout mestre dele já existe e está no 9:16 de 15s.** Logo no topo esquerdo, eyebrow em CAPS coral com tracking largo ("BELO HORIZONTE · MG"), display de duas linhas com uma palavra em coral ("Abrir CNPJ **é assim.**"), subtítulo de duas linhas em ink secundário, e o telefone entrando em três quartos com cards flutuando por cima. Esse é o grid que ele considera bonito. Vale herdar a hierarquia e quebrar o ritmo.

## 1.4 O que este material NÃO tem, e que a campanha precisa

Aqui está o diagnóstico duro da Parte 1.

1. **Nenhuma peça de performance foi feita ainda.** Tudo que existe é institucional: abre devagar, apresenta, explica, conclui. O 9:16 de 15 segundos gasta cerca de 7 segundos em uma mensagem só, com o telefone entrando em fade. Isso não é gancho, é abertura de apresentação.
2. **O corte mais rápido do vault é de cerca de 1,2s, e ele é exceção.** A média do escalada é muito mais lenta. Reels de performance vive em 1,2 a 1,8s por plano.
3. **Preço nunca foi tipografado.** Não existe um único frame no vault com um valor em reais como âncora. É território virgem, e é justamente o miolo dos motes B e C.
4. **Nada foi projetado para o mudo de verdade.** A legenda queimada existe, mas é transcrição da narração. O argumento não anda sem a voz. No Meta, o argumento tem que andar sem a voz.
5. **Zero humor visual.** Nem uma piada em 81 segundos. Com o mascote fora, o humor precisa nascer em tipografia e em edição, e não existe precedente disso no vault.
6. **Nenhum loop.** As peças terminam em fade out. Reels reinicia sozinho, e um fade para preto queima a segunda visualização.

## 1.5 Duas armadilhas concretas nas telas do app

Achei duas coisas que precisam entrar no manual como regra, não como observação.

**Armadilha: as telas reais mostram preços que não são os desta campanha.** `marketing/telas-app/plano.png` traz "R$ 195/mês, plano único" e "Grátis" no honorário de abertura. Colocar essa tela crua em um criativo de "R$19 no plano MEI" é contradição factual em quadro, e alguém vai pausar e ler. Toda tela usada precisa de crop, de retela ou de recorte que elimine valor conflitante.

**Ouro: a tela da waitlist já existe e é o hook.** `marketing/telas-app/veredito_waitlist.png` diz, com todas as letras, "Ainda não, por enquanto", "A gente ainda não abre esse tipo sozinho, e não vamos fingir que abre", e traz o botão "Me avisa quando abrir". Um app que se recusa. É o ativo mais magnético do repositório inteiro e ninguém usou ele em vídeo.

**Ouro 2: o instinto de vigia já está renderizado em UI.** `marketing/telas-app/obrigacoes.png` é o calendário de julho de 2026 com as obrigações vigiadas, uma delas em coral com "Ver a guia". E `mais_em-dia.png` diz "Tudo em dia. Nenhuma pendência" e "6 meses seguidos sem nenhum atraso". A alma do Léo, sem o Léo, está literalmente desenhada nessas duas telas.

---

# PARTE 2. O MANUAL DE MAGNETISMO

## 2.0 A gramática do vigia. Como o Léo entra sem entrar

Não é tema, é regra de execução. Toda peça desta leva usa no mínimo **dois** dos seis itens abaixo. Sem isso, a peça é bonita e não é da marca.

1. **A voz em primeira pessoa fica QUEIMADA na tela, não só falada.** "eu guardo", "eu fico de olho", "eu já caí nessa". Se a primeira pessoa só existe no áudio, ela não existe, porque o Meta roda mudo. Pelo menos uma frase em primeira pessoa aparece em corpo de display por peça.
2. **O snap.** Todo movimento contínuo termina em parada seca de 6 frames, com um anel coral de 1 frame e um tick no som. É o suricato subindo nas patas traseiras, virado gramática de câmera.
3. **A varredura de horizonte.** Um pan lateral rápido por peça (12 meses, 100 ícones, uma fileira de cards), terminando em um único elemento aceso em coral.
4. **O congelamento.** Um freeze de 8 a 10 frames no ponto de maior tensão, com o áudio caindo junto. Congelar é o comportamento mais característico do bicho.
5. **O corte que antecipa.** Cortar de 3 a 5 frames antes da última sílaba da fala. Quem corta antes está avisando o bando, não acompanhando.
6. **O calendário vigiado.** Prazo como objeto físico em quadro, pelo menos uma vez por peça.

E o alvo do humor não muda: **a marca ri de si mesma ou da prática do setor, nunca de quem assiste, nunca da dúvida da pessoa.**

---

## 2.1 Anatomia do hook de 3 segundos que funciona mudo e sem personagem

### A física do problema

- **O hook não são 3 segundos, é o frame 1.** O feed decide no quadro estático que aparece antes do autoplay engatar. Se o primeiro frame precisa de movimento para significar alguma coisa, você já perdeu.
- **90 frames comportam 2 eventos, não 4.** Um evento de entrada e um evento de virada. Um terceiro evento vira ruído.
- **Máximo de 6 palavras no primeiro frame**, corpo mínimo de 96px em 1080x1920 para leitura em miniatura.
- **O hook precisa de um buraco.** Um número sem contexto, uma pergunta sem resposta, um objeto sem explicação. Informação completa no frame 1 é permissão para rolar.
- **Zona útil vertical:** de y=260 a y=1480 em 1920. Acima disso mora o nome do perfil, abaixo mora a legenda do post e o botão `Cadastre-se`.
- **Se tiver som, o primeiro som é um evento físico** (carimbo, papel, tick), nunca a primeira palavra. Voz humana no frame 1 é sinal de anúncio.

### As 14 mecânicas

**H1. Âncora nua (o número sozinho no papel)**
Em quadro: `R$19` ocupando cerca de 70% da largura, Sora 700, coral, sobre papel quente. Nada mais. No frame 45 entra por baixo, em corpo pequeno, `por 3 meses. Depois R$49.`
Mote: **B**. Por que para o dedo: preço legível é a informação mais escassa do feed de serviço, e a autocorreção imediata é o oposto do que anúncio faz. Origem: **[AE]**.

**H2. A contagem que anda pro lado errado**
Em quadro: contador rolando de `19` para `49`, subindo, e a peça não esconde. A legenda queimada entra: `eu podia ter escondido isso.`
Motes: **B** e **C**. Por que para o dedo: número em movimento é irresistível por reflexo, e a direção "errada" (um anúncio mostrando o preço subir) quebra o script inteiro da categoria. Origem: **[AE]**, o `PRE-contador` com expressão de formato pt-BR já existe em `jsx/54-contador-fix.jsx`.

**H3. Texto que se corrige sozinho**
Em quadro: a frase é digitada, `contador de verdade pra todo mundo`, e é riscada em quadro por um trim path coral, sendo reescrita como `contador de verdade do Simples Nacional, no plano ME.`
Mote: **C** (e serve **B** na negativa honesta, dizendo que no MEI é assistente virtual). Por que para o dedo: ver alguém se corrigir em público é comportamento humano dentro de um anúncio, coisa que não existe no feed. Origem: **[AE]**.
Regra dura: a versão riscada **não pode restar legível** como promessa. Rasura cheia, opacidade final da linha antiga abaixo de 25%.

**H4. Objeto errado no lugar errado**
Em quadro: um calendário de papel com um post-it escrito `IMPOSTO` grudado em doze meses seguidos. Luz rasante, macro, textura real.
Motes: **A** e **C**. Por que para o dedo: é uma imagem física no meio de um feed de interface. Dissonância de material chama a fóvea antes de qualquer texto. Origem: **[HIGGSFIELD]** para a textura de papel e luz, **[AE]** para toda a tipografia por cima. Um dos 3 planos de IA do orçamento.

**H5. Pergunta com resposta adiada**
Em quadro: `Quanto custa contador pra MEI?` em display. No frame 60, a resposta começa a aparecer e é encoberta por um card que desliza na frente. A resposta chega no segundo 6.
Motes: **B** e **C**. Por que para o dedo: abre um loop e a pessoa fica pelo fechamento. Origem: **[AE]**.
Regra: o adiamento nunca passa de 4 segundos. Acima disso, vira enrolação e a pessoa sai antes do payload.

**H6. Confissão em primeira pessoa**
Em quadro: apenas texto, corpo de display, sobre papel: `eu já caí numa letra miúda.` Sem imagem, sem ícone, sem nada.
Mote: **A**. Por que para o dedo: é a única frase do feed que admite erro, e é o canal mais direto para a alma do Léo entrar sem o bicho. A ausência de imagem é o que dá o peso.

**H7. Contradição visual (o número impossível)**
Em quadro: `R$ 0,00` gigante em coral, e a linha `é o que você paga hoje.`
Motes: **B** e **C**. Por que para o dedo: zero em anúncio de serviço parece pegadinha, e o cérebro para para descobrir onde está a pegadinha. O payload honesto (o app não lançou, ninguém cobra hoje, o valor fica guardado) é a resolução. Origem: **[AE]**.
Regra dura: `R$ 0,00` **nunca fica sozinho mais de 1,5s** sem a linha que explica. Sem isso a peça finge ser grátis, o que a marca proíbe.

**H8. A tela que faz o que ninguém espera**
Em quadro: a tela real do app abre e diz `Ainda não, por enquanto`, com o botão `Me avisa quando abrir`. Um dedo (só o cursor, não o mascote) não chega a tocar. A tela nega sozinha.
Motes: **A** e **B**. Por que para o dedo: toda tela de app em anúncio promete. Essa recusa. Recusa é o comportamento mais raro do feed inteiro. Origem: **[TELA APP]** `veredito_waitlist.png`, real, já existe em 1290x2796.

**H9. Quebra de expectativa de formato**
Em quadro: a peça abre parecendo outra coisa. Uma notificação de sistema neutra, uma tela de calendário do celular, um cursor piscando num campo vazio. No frame 45 a moldura cai e vira a peça.
Motes: **A** e **C**. Por que para o dedo: o cérebro processa como conteúdo antes de classificar como anúncio, e essa fração de segundo é o hook inteiro. Origem: **[AE]**.
Regra dura número 10 da marca: qualquer interface de terceiro tem que ser **genérica**, sem logo, sem cor e sem tipografia de concorrente. Notificação em ink neutro, sem ícone reconhecível.

**H10. O snap de vigia**
Em quadro: a câmera desliza por um calendário de doze meses e **trava seca** num dia. Anel coral de 1 frame, tick no som, freeze de 8 frames.
Motes: **A** e **C**. Por que para o dedo: movimento contínuo que trava é um reflexo óptico, não uma decisão de assistir. E é a tradução literal do instinto do suricato em linguagem de câmera. Origem: **[AE]** mais **[TELA APP]** `obrigacoes.png`.

**H11. Varredura de horizonte**
Em quadro: pan lateral rápido por uma fileira de 100 ícones, terminando em um único aceso em coral, com o número parando ao lado.
Motes: **A** e **C**. Por que para o dedo: cria expectativa de destino em 0,4s e entrega em 1,2s. Origem: **[AE]**, o rig de campo de ícones dos takes 3 e 4 do escalada já existe (Repeater mais CC RepeTile, 3 LODs) e roda em 9:16 sem reconstrução.

**H12. O jargão executado ao pé da letra**
Em quadro: `Prezado cliente, vimos por meio desta` aparece grande, em tipografia de ofício, cresce, e a folha é **amassada** em quadro até virar bola.
Mote: **C**. Por que para o dedo: destruir um documento é catártico e a imagem é tátil. A piada é da prática do setor, não de quem assiste, então passa na regra. Origem: **[HIGGSFIELD]** para o papel amassando (sem texto legível no plano de IA, o texto entra depois em **[AE]** por track simples ou por corte).

**H13. Prova em vez de promessa (o 22 se construindo)**
Em quadro: pastas e protocolos empilhando em timelapse e montando um `22` gigante em coral, com micro-label `anos de escritório contábil em Belo Horizonte`.
Mote: **A**. Por que para o dedo: construção acelerada é hipnótica, e 22 é um número que ninguém finge. É o único hook desta lista que fica **melhor** sem o mascote, porque o argumento é documental e o bicho tirava a seriedade. Origem: **[AE]**.

**H14. A etiqueta pendurada no vazio**
Em quadro: um espaço vazio, e dentro dele uma etiqueta de preço com `R$19` já pendurada, balançando de leve. Nada mais.
Mote: **B**. Por que para o dedo: incompletude. O cérebro quer preencher o vazio e fica para descobrir do que é aquele preço. Origem: **[AE]**, 3D paramétrico simples com sombra real (essa é uma das poucas sombras liberadas, porque é física, não decoração).

### Checagem de aceite do hook (5 perguntas, todas têm que dar sim)

1. Se eu congelar o frame 1 e mostrar para alguém por 1 segundo, sem som, ele entende que tem alguma coisa faltando?
2. Tem 6 palavras ou menos no frame 1?
3. O buraco (a pergunta aberta) fecha antes do segundo 8?
4. O hook cabe entre y=260 e y=1480?
5. A peça sobrevive se eu apagar a trilha inteira?

---

## 2.2 A vantagem escondida de não ter personagem

Cinco coisas que uma peça puramente tipográfica faz e uma peça com mascote não faz.

**1. Velocidade de leitura.** Rosto sequestra a fóvea. Havendo um rosto no quadro, a primeira fixação vai nele e o texto é lido em segundo lugar, sempre. Sem o bicho, a primeira fixação cai direto no número. São cerca de 0,4 a 0,5 segundo de ganho, e num hook de 3 segundos isso é aproximadamente 15% do orçamento. Na prática: cabe **preço mais condição** no mesmo frame em que antes só cabia o preço.

**2. Densidade de informação por segundo.** Um plano com mascote sustenta uma ideia, porque o personagem precisa de tempo de atuação para existir. Um plano tipográfico sustenta três níveis simultâneos que o olho lê em ordem sem precisar de corte: eyebrow, âncora, micro-label. Seis planos entregam o que precisaria de doze. Numa peça de 15 segundos isso é a diferença entre dizer uma coisa e dizer três.

**3. Custo de iteração, e portanto capacidade real de teste.** O fecho com o suricato consumiu 22 versões renderizadas para resolver 2,6 segundos. Peça tipográfica é jsx mais JSON: trocar `R$19` por outra âncora, ou trocar o hook inteiro mantendo o corpo, é editar dado e re-renderizar em minutos, em 1080x1920 na CPU. Isso permite entregar **cada peça em dois hooks diferentes** e deixar o Meta decidir. Nenhuma peça com personagem permite isso dentro do prazo. Este item, sozinho, vale mais para performance do que qualquer ideia criativa da lista anterior.

**4. Seriedade de preço.** Preço ao lado de um bicho de desenho lê como brincadeira. Preço em Sora 700 sobre papel quente lê como contrato. Esta campanha não vende um app, ela vende uma **reserva de preço**: a pessoa está confiando que um valor combinado hoje vai valer no lançamento. Registro sóbrio aqui é ativo comercial, não preferência estética. E vale dobrado para a Persona C, que se assusta com ironia e é justamente quem mais cai no MEI.

**5. Sobrevive ao frame congelado.** Miniatura no grid do perfil, autoplay que trava em conexão ruim, print que alguém manda para o sócio no WhatsApp, primeiro frame antes do vídeo engatar. Em todos esses casos a peça vira uma imagem parada. Um mascote no meio de um piscar de olho vira uma imagem constrangedora; uma âncora tipográfica vira um cartaz. Como bônus, some junto o risco de alucinação de glifo da IA generativa (regra dura número 9), o risco de quebra de canon (óculos, gravata, polo) e a dependência de aprovação de asset.

---

## 2.3 O problema específico: o produto ainda não existe

Seis estratégias honestas para transformar "ainda não lançou" de fraqueza em gancho.

**1. O objeto de desejo não é o app, é o preço guardado.** Preço guardado existe hoje, o app não. "Eu não tô te vendendo um aplicativo. Eu tô guardando um preço pra você." Isso é literalmente verdade, é a mecânica de reserva que o brief exige explicitar nos motes B e C, e é tangível em motion: uma etiqueta, um card com um valor e um cadeado, um número que congela e fica. Todo o desenho da peça B passa a girar em torno de um objeto que **guarda**, não de um app que **funciona**.

**2. O "ainda não" vira política da casa, não desculpa.** A tela `veredito_waitlist.png` já diz "A gente ainda não abre esse tipo sozinho, e não vamos fingir que abre". Um produto que se recusa a atender é a prova de caráter mais barata que existe, e é impossível de copiar sem coragem. Vender a recusa é mais forte do que vender a promessa.

**3. Quando o futuro não pode ser provado, prova-se o passado.** 22 anos de escritório contábil real em Belo Horizonte, CNPJ, endereço, histórico. Prova em vez de promessa. Este é o único caminho do mote A e é o mais defensável dos seis.

**4. Mostrar o processo em vez do resultado.** Bastidor honesto: a tela em wireframe ao lado da tela final, a grade de construção aparecendo por baixo do layout, o número de versão em micro-label. Construção em público é conteúdo, gera fidelidade, e resolve o problema de não ter print de resultado. Cuidado único: não pode virar "a gente é amador", então o acabamento do bastidor tem que ser tão bom quanto o do produto.

**5. Datar a honestidade em vez de fabricar urgência.** Sem countdown, sem contagem de vaga, sem "só hoje". Os dois limites reais são verdadeiros e sempre unidos por "o que vier primeiro": **31 de dezembro de 2026**, por extenso, e o fechamento da lista. Encenar isso como regra da casa dita em voz calma é mais persuasivo do que qualquer relógio, porque o espectador já está imunizado contra relógio.

**6. Trocar promessa de resultado por promessa de comportamento.** A marca não pode prometer "seu imposto vai cair" nem "seu CNPJ vai ficar em dia", porque o produto não rodou. Pode prometer **"eu vou ficar de olho no prazo"**. Comportamento é verificável no dia 1, não depende de resultado, e é exatamente a alma do vigia. Regra desta leva: **todo CTA promete vigilância, nunca economia.**

---

## 2.4 Retenção: o que faz alguém assistir 20 segundos de anúncio de contabilidade

Oito dispositivos, cada um com aplicação nesta marca.

**R1. Loop de pergunta aberto cedo e fechado tarde.**
Aplicado: segundo 2, `Quanto custa contador pra MEI?`. Segundo 4 a 12, o corpo do argumento roda com a resposta encoberta por um card. Segundo 13, o card sai e o `R$19` aparece. Regra: abrir antes do segundo 3, fechar antes do segundo 15.

**R2. Escada de números.**
Aplicado: `19` no segundo 2, `3` (meses) no segundo 6, `49` no segundo 9, `R$0,00` no segundo 12, `31 de dezembro de 2026` no segundo 16. O cérebro segue série numérica quase involuntariamente, e cada número novo reinicia o relógio de atenção.

**R3. Contagem visível de partes.**
Aplicado: `3 coisas que eu não vou fazer com o seu CNPJ`, com um contador discreto `1/3`, `2/3`, `3/3` num canto. A pessoa fica pelo 3. Funciona especialmente bem no mote A, onde não há preço para segurar.

**R4. Micro-evento a cada 45 frames.**
Aplicado: a regra já existe no SPEC do escalada, no take 5 ("nunca mais de 1,5s sem micro-evento"). Aqui vira lei da leva inteira. Micro-evento é um post-it que cai, um chip que muda de estado, uma palavra que troca de peso na Sora variável, um anel coral. Custa quase nada e é o que impede a sensação de peça parada.

**R5. Push-in contínuo lento.**
Aplicado: 3 a 4% de escala ao longo de qualquer plano acima de 2 segundos. É subliminar, ninguém percebe, e mata a leitura de "imagem congelada". Já provado no take 5.

**R6. O corte que antecipa.**
Aplicado: cortar de 3 a 5 frames antes da última sílaba. O espectador é levado, não acompanha. Isso é a gramática do vigia funcionando como dispositivo de retenção, não como enfeite conceitual.

**R7. Recompensa pequena e gratuita no meio.**
Aplicado: um evento cômico curto que não faz parte do argumento. O carimbo que erra o alvo e se corrige sozinho. O post-it que cai da tela. A palavra que engorda quando é dita mais alto. Reforço variável: quem já foi recompensado uma vez fica esperando a próxima.

**R8. O sino da marca no fim.**
Aplicado: o check se desenhando e o `AI` do wordmark acendendo em coral na sílaba tônica. Já está construído na vinheta e no take 8. Numa campanha de seis peças, isso vira um evento esperado: quem viu a peça 1 assiste a peça 2 até o fim para ouvir e ver o sino de novo. É o único ativo de retenção que **melhora** conforme a campanha roda.

**Nota transversal:** a legenda queimada word-by-word já é, sozinha, um dispositivo de retenção. O olho persegue palavra que aparece. Por isso ela nunca some, nem no meio do plano mais bonito.

---

## 2.5 O erro dos 12 roteiros existentes

São roteiros corretos. Corretos é o problema.

### Os seis erros estruturais

**E1. São argumentos, não ganchos.** Todos abrem apresentando uma tese: "Eu sou novo. A contabilidade atrás de mim não é". Tese é o segundo 8, não o segundo 0. Nenhum dos seis ângulos tem um **primeiro frame** projetado. Eles têm uma primeira frase.

**E2. A frase de abertura só significa lida inteira.** São frases com sujeito, oração subordinada e vírgula. No mudo, exigem 2 a 3 segundos de leitura antes de qualquer sentido, e nesse ponto o hook já acabou. A regra do brief ("hook nos 3 primeiros segundos que funciona mudo") está escrita e não está cumprida por nenhum deles.

**E3. A imagem legenda a fala.** Léo com lupa ilustra "letra miúda". Léo encolhe os ombros ilustra a dúvida. Isso é rádio com figura. Anúncio que retém faz o contrário: a **imagem levanta a pergunta** e a fala responde. Em nenhum dos seis a imagem carrega informação que a fala não tenha.

**E4. O mascote era o entretenimento inteiro.** Tirando o suricato, o que sobra é um deck. Toda a simpatia, todo o timing cômico e toda a personalidade estavam no bicho executando a fala, não na estrutura do roteiro. Nenhum deles tem uma piada que sobreviva à ausência dele.

**E5. Risco zero.** Foram auditados, calibrados, aprovados. Nenhum ofende, nenhum surpreende, nenhum constrange. Anúncio que não corre risco nenhum não dá motivo para ser assistido. O único que corre risco é o B-COM, e o risco dele está mal pago (ver abaixo).

**E6. Doze peças, um único ritmo.** Todas do mesmo tamanho, mesma cadência, mesma arquitetura de três atos. Nenhuma de 6 segundos, nenhuma de 25, nenhuma que seja só um plano. Uma campanha de performance precisa de variância de formato, não só de variância de argumento.

**E7 (transversal).** A primeira pessoa do Léo era falada, com o dono visual em quadro. Sem o bicho, a primeira pessoa continua válida (virou voz de marca), mas **perde o dono**. Se ela não estiver queimada na tela em corpo grande, ela não existe no mudo, e aí a peça perde a única coisa que a tornava dessa marca.

### O que sobra de cada ângulo quando você tira o suricato

**A-SOB. "Eu sou novo. A contabilidade atrás de mim não é: 22 anos em BH."**
O problema: a melhor coisa dele, as pastas de processo montando um `22` gigante em coral, está no **final**. A abertura é uma declaração de identidade, e identidade de marca não interessa a ninguém no segundo zero.
O que sobra: quase tudo, e melhor. É o único dos seis que **melhora** sem o mascote, porque o argumento é documental e o bicho tirava seriedade da prova. Conserto: inverta. Abra com o `22` se construindo (H13) e diga a frase por cima. Aproveitamento alto.

**A-COM. "Eu já caí numa letra miúda. Uma vez."**
O problema: a piada era o Léo com a lupa e a entrega de ator no "uma vez". Sem ele, sobra um contrato desenrolando, que é o clichê visual mais gasto da categoria inteira, e uma frase cujo humor dependia de timing de atuação.
O que sobra: a confissão em texto, que é forte, e absolutamente nada além disso. Conserto: reconstruir como peça 100% tipográfica de confissão (H6), sem contrato nenhum em quadro. Se o contrato entrar, descarte a peça. Aproveitamento baixo.

**B-SOB. "R$19 nos 3 primeiros meses, depois R$49, sem novidade escondida."**
O problema: é honesto e é chato. "Card girando com os dois números do mesmo tamanho" é design de tabela de preço, e tabela de preço não é gancho, é destino. Pior: "sem novidade escondida" é uma **negação**, e negação exige que o espectador primeiro imagine a novidade escondida para depois valorizar a ausência dela. Isso é trabalho demais para 3 segundos.
O que sobra: o melhor ativo da campanha inteira, o preço, mal embalado. Conserto: transformar a ausência de pegadinha em **evento**. Mostre a pegadinha aparecendo em quadro e sendo apagada (H3), ou mostre o preço subindo na cara do espectador (H2). O que não pode é anunciar honestidade; honestidade tem que acontecer em quadro. Aproveitamento alto, com reconstrução total do hook.

**B-COM. "Tô te oferecendo o preço de um app que nem abriu. Era pra soar estranho."**
O problema: é o mais inteligente e o mais arriscado dos seis, e o risco **não está pago**. A frase reconhece a estranheza e não a resolve dentro do hook, e no Reels a pessoa sai exatamente na estranheza. Além disso o andaime vazio é um conceito que precisa ser **explicado** para ser lido, e conceito explicado é conceito morto em vídeo curto.
O que sobra: a etiqueta `R$19` pendurada no vazio, que é uma imagem de primeiro frame excelente e autoexplicativa (H14). Conserto: jogue fora o andaime, fique com a etiqueta, e resolva a estranheza em até 4 segundos com a mecânica de reserva. Aproveitamento médio, com poda pesada.

**C-SOB. "Contador de verdade do Simples Nacional já no plano de entrada."**
O problema: exige que o espectador já saiba que a categoria cobra caro por atendimento humano. É um argumento de comparação **sem o termo de comparação**, e a marca não pode citar concorrente. Sem esse conhecimento prévio, a frase não diz nada. E a escada de 3 planos com ícone de pessoa é, de novo, uma pricing page animada.
O erro mais grave está enterrado: a abertura alternativa listada no fim ("mensagens no vácuo, visto acumulando") é dez vezes melhor que a principal e está classificada como alternativa. Isso é falha de hierarquia, não de ideia.
O que sobra: o "visto" acumulando é o hook. É silencioso, é universal, dói, e funciona mudo. O resto vira corpo. Conserto: promova a alternativa a principal e aposente a escada. Aproveitamento médio-alto, com inversão de hierarquia.

**C-COM. "Ninguém vai te mandar 'prezado cliente, vimos por meio desta'."**
O problema: a peça inteira depende de o espectador reconhecer aquilo como jargão e achar graça. Quem não reconhece, não entende. E ironia alta assusta a Persona C, que é exatamente quem mais cai no ME e no Simples Nacional. Público errado para o tom escolhido, o que o próprio brief avisa no parágrafo das personas e o roteiro ignorou.
O que sobra: a carta timbrada amassada. É uma imagem física, tátil e catártica, e vale mais como plano de 1,5 segundo dentro de outra peça do que como conceito de peça inteira (H12). Conserto: rebaixar de peça a plano. Aproveitamento baixo como peça, alto como ativo.

### Uma correção de execução que vale para os doze

O **super de condição** foi tratado como obrigação de compliance, escondido no rodapé em corpo pequeno. Ele é o oposto disso: é a prova viva do posicionamento de honestidade. Mantenha a regra do brief (rodapé, corpo pequeno, a partir do segundo quadro) em todas as peças, e em **uma** das seis acrescente um beat de 1,5 segundo no meio onde a mesma condição é dita em corpo grande, como argumento. Uma marca que aumenta a letra miúda em vez de diminuir é uma marca que ninguém esquece.

---

## 2.6 Formato: as regras de Reels 9:16 desta leva

### Comp e escala tipográfica

Master **1080x1920 @ 30fps**. Não subir para 4K: renderiza em CPU, a entrega do Meta é 1080, e a velocidade de re-render é o ativo estratégico desta campanha (ver 2.2, item 3). Mezanino ProRes só na peça vencedora, se for pedido.

A escala do SPEC do escalada está em px de 4K 16:9 e **não pode ser convertida por regra de três**, senão a legenda queimada nasce ilegível. Escala nova, fechada, para 1080x1920:

| Papel | Spec | Uso |
|---|---|---|
| **A. Número-herói** | Sora 700, tracking -2%, 240 a 320px | Quando é o único elemento do quadro. Máximo 1 por peça |
| **A2. Âncora display** | Sora 700, 150 a 190px, máximo 2 linhas | Hook com palavra coral. Centro óptico em y ≈ 780 |
| **B. Legenda queimada** | Sora 600, 64 a 72px, máximo 2 linhas de 900px | Baseline entre y=1240 e y=1400 |
| **C. Micro-label** | Sora 500, 32px, CAPS, tracking +8% | Contexto e fonte de dado. Separador `·`, nunca travessão |
| **D. Super de condição** | Sora 500, 26 a 28px, ink-700 `#524E48`, 2 linhas | Rodapé em y ≈ 1430 a 1470. **Nunca abaixo de y=1480** |

**Zonas seguras:** y=0 a 240 é comido pelo header do perfil. y=1500 a 1920 é comido pela legenda do post e pelo botão `Cadastre-se`. Todo conteúdo, inclusive o super de condição, vive entre **y=260 e y=1480**. Isso é diferente do filme e é o erro mais comum ao derivar 16:9 para 9:16.

### Duração

| Mote | Faixa | Por quê |
|---|---|---|
| **A. Institucional** | 15 a 18s | Precisa espaço para a prova (22 anos) respirar, e não tem preço para segurar |
| **B. MEI** | 12 a 15s | Preço simples não precisa de tempo. Peça curta converte melhor e a Persona C não se cansa |
| **C. ME / Simples Nacional** | 18 a 22s | Carrega rótulo, qualificador "do Simples Nacional" e dois preços. Precisa de espaço para não atropelar |

Regra: **nenhuma peça passa de 20 segundos sem um loop de pergunta aberto no segundo 3 e fechado até o segundo 15.** Sem o loop, corte para 15.

### Ritmo de plano

- Média alvo: **1,4s por plano**. Nenhum plano acima de 3s, com uma exceção: o end card.
- Hook: **2 planos em 3 segundos**, não mais.
- Miolo: planos de 1,2 a 1,8s.
- Fecho: **um plano de 2,5s**. End card precisa respirar, senão a peça termina parecendo spam.
- Nenhum quadro sem micro-evento por mais de 45 frames (R4).

### Corte

Corte seco por padrão. **Zero transição de software.** As únicas transições permitidas nesta leva são as três que já existem no vault e são de marca:

1. A onda circular de papel `#FAF8F5` com anel coral engolindo o dark (a virada do take 5).
2. O mergulho ou push-in que vira o plano seguinte.
3. O wipe por máscara (o reveal do wordmark).

Cortar de 3 a 5 frames antes da última sílaba (R6). Nunca cortar no silêncio depois da frase: isso entrega o controle do ritmo ao espectador.

### Legenda queimada

- Obrigatória do frame 1 ao último, como manda o brief.
- Word-by-word: opacidade 0 para 100 mais y de +12 para 0 em **150ms ease-out** no onset da palavra. O deslocamento é metade do usado em 4K; herdar os 24px do filme faz o texto pular em 9:16.
- Máximo 2 linhas, máximo 5 palavras por linha.
- **Uma palavra coral por respiração**, na palavra que carrega o veredito, com cores alternadas entre respirações. Direção v2 do Pedro, travada em 14/08.
- Sem motion blur no texto. Sem overshoot. Sem bounce.
- **Nunca legendar o hook duas vezes.** Se o hook já é uma âncora display, a legenda queimada só entra a partir do segundo 3. Duas camadas de texto dizendo a mesma coisa no frame 1 destroem o hook.

### Som

Projetar para **mudo**, recompensar quem tem **som**. Duas camadas:

- **Camada 1 (mudo):** tudo compreensível. Preço, rótulo de plano, prazo e CTA existem em tela. Regra do brief, sem exceção.
- **Camada 2 (som):** um SFX por evento de tipografia. Snap, carimbo, papel, tick de calendário, o assentar de um card. O vocabulário do desenho de som do escalada v104 é a base.

Regras:
- **O primeiro som da peça é um evento físico, nunca a primeira palavra.**
- Trilha entra por último, com sidechain keyado pela locução (mesma arquitetura do `mux-final` do escalada).
- Loudness **-14 LUFS, -1,5 dBTP**, dual mono 48kHz. Padrão já provado, não mexer.
- **Silêncio de 200 a 300ms imediatamente antes do end card.** Silêncio é o recurso de atenção mais barato que existe e ninguém usa no Reels. No escalada isso já foi feito (2,2s de preto e silêncio antes do take 8) e é o melhor momento do filme.

### A primeira frase falada

- Entra em **1,2s**, nunca em 0. O primeiro segundo é do evento visual e do primeiro som.
- **Máximo 7 palavras.**
- **Em primeira pessoa.**
- **Nunca repete o que está escrito em display.** A tela diz o número, a voz diz a consequência.
  - Mote B: tela `R$19`, voz "por três meses. Depois quarenta e nove, sem susto."
  - Mote A: tela `22`, voz "eu sou novo. A conta atrás de mim não é."
  - Mote C: tela `visto`, voz "eu não sumo depois que você assina."
- **Proibido abrir com:** saudação, "você sabia", o nome da marca, uma pergunta retórica genérica, ou qualquer frase que comece com "se você".
- Régua de fala de 2,1 palavras por segundo. A sobra que aparecer (2 a 4s por peça) vai para o quadro do meio, **nunca** para o hook nem para o CTA.

### End card e loop

- 2,5 segundos, igual nas seis: papel quente, logo entrando com o `AI` acendendo em coral, linha de CTA, botão `Cadastre-se`.
- Construir com um **slot de 0,8s** para a frase falada "Vai, legaliza aí". Com a frase, a peça funciona. Sem a frase (pendência aberta do Pedro), o slot vira hold do logo, sem retiming e sem reescrita. Isso é obrigatório: as seis peças precisam funcionar nas duas versões.
- **Fechar em papel, não em fade para preto.** O último frame do end card e o primeiro frame do hook devem ter o mesmo valor de fundo. O Reels reinicia sozinho, e papel para papel esconde a emenda e ganha uma segunda visualização de graça.
- **Capa da peça:** o frame do número-herói, nunca o end card.

### Orçamento de Higgsfield para a leva inteira

96,62 créditos. Reserve para no máximo **3 planos de textura**, gerados uma única vez e reaproveitados como fundo em mais de uma peça:

1. Papel com luz rasante, macro, sem texto (serve mote A e mote C).
2. Papel amassando, sem texto legível (H12, mote C).
3. Poeira de arquivo em contraluz (mote A, textura de "22 anos").

Nenhum plano de IA pode conter texto legível, logo, rosto humano identificável ou qualquer coisa que precise estar factualmente correta. Guardar em `marketing/filme/.../assets/textura/` com o prompt e a proveniência ao lado. Se o crédito acabar antes, as três substituições em **[AE]** são: gradiente de papel com grain a 2%, deformação de mesh sobre um PNG de papel, e um campo de partículas em contraluz.

---

## 2.7 Checklist de aceite, por peça

Uma peça só é entregue se as doze linhas derem sim.

1. O frame 1 comunica sozinho, sem som e sem contexto.
2. Seis palavras ou menos no frame 1.
3. Preço, rótulo de plano, prazo e CTA existem **em tela**, não só na voz.
4. Rótulo `MEI` ou `ME` mais `Simples Nacional` aparece na tela **e** no áudio (motes B e C).
5. Super de condição a partir do segundo quadro, rodapé, dentro da zona segura (acima de y=1480).
6. Data por extenso, "31 de dezembro de 2026". Nunca em barras.
7. Zero travessão em qualquer texto falado ou de tela.
8. Coral só onde a lista fechada permite. Erro nunca é coral, é crimson `#E03E43` com ícone e texto.
9. Nenhum quadro sem micro-evento por mais de 45 frames.
10. **Nenhum suricato.** Corpo, rosto, pata, cauda, silhueta, sombra, reflexo, ícone, boneco ou versão estilizada.
11. Nenhum texto ou logo vindo de IA. Planos **[HIGGSFIELD]** são textura pura e somam no máximo 3 na leva inteira.
12. A peça funciona **com e sem** a frase falada "Vai, legaliza aí", sem retiming e sem reescrita.

E o teste final, que não é regra e é o que importa: **congele o frame 1, congele o frame do meio e congele o último frame. Se os três, lado a lado e sem som, já contam a história inteira, a peça está pronta para o Meta.**