# Extensão `precificacao` do kit de motion (biblioteca 2D do reel de 02/10)

Dono: K14. Contrato: `KIT/DESENHO.md`, seções 1 (decisões 7, 10 e 15), 4.9, 4.10, 4.11 e 5 ("Família 2D da
precificação"). Catálogo: `KIT/catalogos/biblioteca2d/base.json`. Guia pra quem não programa:
`KIT/biblioteca2d/LEIA-ME.md` (com os exemplos).

Põe no kit a biblioteca 2D já aprovada e publicada no reel de 02/10 ("3 sinais de que você já pode cobrar mais
caro"), **só importando**: os componentes de `RM/src/motion/kit.tsx`, as transições do `RM/src/Motion.tsx` e os
cortes do `RM/src/Broll.tsx`. Os originais não mudam (md5 conferido antes e depois).

| arquivo | o que é |
|---|---|
| `batidas.ts` | puro (sem React, Remotion e DOM): as 7 batidas `p2d-*`, os metadados das camadas (`camadas`) e a conferência da cena |
| `render.tsx` | as camadas: os 23 componentes do `kit.tsx` (`p2d-<Nome>`), `p2d-grupo` e `p2d-legenda` |
| `transicoes.ts` | puro: as 5 transições do `Scene` e a câmera (`Camera`) do `Motion.tsx`, portadas com os mesmos números |
| `cortes.ts` | puro: o `trOf` do `Broll.tsx` (whipL, whipUp, zoomBlur, flash), o clarão do flash e a volta do loop |
| `curvas.ts` | puro: `mola`, `tremida` e `entrada` (o `spring`, o `shake` e o `inn` do `kit.tsx`) |
| `midia.json` | a mídia que os componentes buscam em caminho fixo do public (ícones, clay e splash) |
| `testes/` | as provas em Node, sem render (seção "Testes") |

A prova no navegador (stills de todas as camadas e batidas, 03/10) fica na peça de teste
`KIT/pecas/_2026-10-03-prova-2d/` (seção "Prova no navegador").

O bundle do Remotion acha a extensão pelo `require.context` do `RM/src/kit/render/ext.ts` (K06); a CLI do K07 acha
por busca de arquivos e empacota o `batidas.ts` isolado. Extensão com erro de execução fica desligada
(`EXT_ERRO`) e só a cena que pedir algo dela falha.

## Camadas

Toda camada é um item de `camadas` na `cenas.json`: `{id, tipo, estado, ...params}`. Os params são as props do
componente original; o movimento vem de `st.canais[id]` (as batidas animam; o render só lê).

Params de posição, comuns a todas as camadas de componente (o `At` do `kit.tsx` posiciona todas):
`x`, `y` (centro em px, padrão 540 e 960), `s` (escala), `rot` (graus), `origem` (padrão "50% 50%"), `blur`,
`z` (camada solta; padrão 150), `grupo` (id do `p2d-grupo` que a desenha), `flutua` `{amp, freq, fase, eixo}`
(balanço senoidal em y, x ou rot; no modo periódico a frequência fecha o loop, como a camada ambiente) e, no Rays,
`giro` (graus por segundo).

Canais de posição (somados aos params): `x`, `y` (px), `s` (multiplica a escala da camada), `rot` (graus), `op` e
`blur`. Mola e tremida em x, y, s e rot ganham um canal só delas (`s~1`, `x~2`...), que o render soma: duas molas
seguidas se somam, como no original (`sc = card.sc * (1 + spring(...))`, `rot = -4 + spring(...)`).

| tipo | componente do kit.tsx | params (props) | canais próprios | mídia |
|---|---|---|---|---|
| `p2d-At` | At, com uma caixa de texto dentro | texto, tamanho, peso, cor, fundo, raio, padding, espacamento, altura, sombra, sombraTexto, largura, quebra | | |
| `p2d-Bg` | Bg | kind (paper, dark, coral) | só op | |
| `p2d-Numeral` | Numeral | n, size, color, outline | | |
| `p2d-Sticker` | Sticker | icon (calendario, campanha, growth, lampada, metricas), d, pad, ring | | icons/ |
| `p2d-ClayCard` | ClayCard | seq (cadastro, calculo), size | frame (0 a 120) | clay/ |
| `p2d-Bubble` | Bubble | text, side (l, r), w | | |
| `p2d-Calendar` | Calendar | month, dur (padrão 0,5) | acende (0 a 1 cobre dur + 0,14 s) | |
| `p2d-Stamp` | Stamp | text | | |
| `p2d-HangTag` | HangTag | hole | | |
| `p2d-Padlock` | Padlock | | shut (0 a 1) | |
| `p2d-YearOdo` | YearOdo | | digit (4 a 6) | |
| `p2d-Check` | Check | size | on (0 a 1) | |
| `p2d-NumDot` | NumDot | n, size, filled | cheio (acima de 0 = cheia) | |
| `p2d-AlarmClock` | AlarmClock | | spin (horas; 10,25 = 10h15), ring | |
| `p2d-BigArrow` | BigArrow | w | | |
| `p2d-Rays` | Rays | n, len, color, a1, a2, giro | | |
| `p2d-Confetti` | Confetti | cols, n, power | voo (0 a 1 cobre os 1,6 s) | |
| `p2d-Phone` | Phone | w | | splash.png |
| `p2d-Eye` | Eye | w | open (0 a 1), look (-1 a 1) | |
| `p2d-TetoCard` | TetoCard | | fill, val (0 a 1) | icons/metricas.webp |
| `p2d-CommentIcon` | CommentIcon | w | (os pontinhos andam com o tempo) | |
| `p2d-Pill` | Pill | texto, bg, color, size, border | | |
| `p2d-Sparkle` | Sparkle | color, pulso {base, amp, freq, fase} | | |
| `p2d-grupo` | (do kit) | fundo (paper, dark, coral ou null), origem (padrão "50% 58%"), z | vis, op, x, y, s, rot, entra, sai, corteEntra, corteSai, clarao | |
| `p2d-legenda` | (do kit; a LegendaApple do K06) | top, altura, tamanho, modo, modos (um por frase), pula, esquerda, largura, fecho (true desenha o fecho e o LINK DA BIO), z (padrão 200) | op | |

Os de `src/parts` (AppleCaptions, Backdrop, Captions, Cards e LeoLayer) são acoplados à timeline do reel de 02/10
(`lib/tl`) e não viram camada: ficam no catálogo como referência de código. A legenda do kit é a do K06.

## Elementos do reel de 09/10 (`sufoco.tsx`, 06/10/2026)

O Pedro pediu, na peça de 09/10 ("O sufoco burocrático real"), "anime melhor e exemplifique em animação cada parte da narração, uma a uma". Pra isso entraram 11 elementos nativos do kit, na mesma linguagem do `kit.tsx` (papel, tinta, corais, sombra SH, Sora 800). Ficam em `sufoco.tsx` (componentes puros) e são registrados pela lista `COMPONENTES_SUFOCO` do `batidas.ts`. Os 23 do `kit.tsx` e os testes deles não mudam. Todo texto que aparece é param da camada, porque é assim que a trava de fatos e a de travessão leem. Peça que usa: `KIT/pecas/2026-10-09-sufoco-burocratico-v2/` (cena gerada por `provas/cena.js`).

| tipo | o que aparece | params | canais próprios |
|---|---|---|---|
| `p2d-RelogioTarde` | relógio de parede sem números; a fatia coral cobre de `de` a `ate`, com o solzinho na borda; o ponteiro dos segundos anda sozinho | de, ate, d | hora (13,5 = 13h30), fatia (0 a 1) |
| `p2d-Bilhete` | bilhete coral claro com fita, caixinha e duas linhas | w | marca (0 a 1: o visto; pra tentar e não marcar, suba e volte) |
| `p2d-Navegador` | janela de site genérica: barra, anel de carregando, esqueleto da página | w | carrega, gira (voltas do anel; parado, congela), trava (rachaduras e o alerta), falha (glitch nas faixas) |
| `p2d-Cursor` | seta (a ponta em x, y) ou círculo de toque | modo (`seta` ou `toque`) | aperta, onda |
| `p2d-Telefone` | fone coral com as ondas e a pílula de chamando | w | toca, vibra, cai (queda com quique e a linha partida) |
| `p2d-Fila` | fila de n pessoas até a porta; você em coral, com olhos | n, passo, w | anda (0 a 1, já com a curva de chegada), suspira |
| `p2d-Entardecer` | céu de tela cheia com sol, cidade e estrelas (ponha em 540, 960) | | sol, noite, luzes |
| `p2d-Empresa` | lojinha com toldo coral e engrenagens no telhado | w | gira (voltas), luz, pausa (a placa na porta) |
| `p2d-Ampulheta` | ampulheta com areia coral | w | vira, areia |
| `p2d-Construcao` | celular em montagem: contorno, blocos da tela e a splash do app (precisa do ext-liga) | w | molde, blocos (0 a 8), liga |
| `p2d-Perfil` | cartão de perfil sem @: avatar com o visto, nome, botão e o link da bio | nome, botao, botaoFeito, linkTexto, w | segue, link |

Cuidados que a peça de 09/10 ensinou:
- **Ocorrência de palavra.** Na cena, o `iw` compara sem acento: o "É" da virada conta como "e", e "Chega no site" tem o primeiro "no". Por isso o "No" de "No fim do dia" é o segundo e o "E" de "E clica" é o terceiro. Errar a ocorrência põe uma transição segundos antes, e o grupo da frente aparece por cima das cenas anteriores.
- **Nada encosta.** O fone cai até 150 px e a pílula fica mais embaixo. A ampulheta fica fora da lojinha, com folga, e o relógio com o bilhete também.
- **Confete nas cores da marca.** A cena passa `cols` (corais e branco): o padrão do `kit.tsx` tem tinta, que vira sujeira no papel.
- **Fundo coral em tela cheia.** A codificação puxa o coral 2 a 3 níveis pra baixo, e por isso a checagem de cor do `confere.py` compara com o still passado pela mesma codificação (`KIT/PENDENCIAS.md`, peça de 09/10).

## A linha que desce (`linha.tsx`, reel de 05/10, versão 7, 06/10/2026)

Pedido do Pedro: "uma linha que desça de cima para baixo e, conforme ela vai descendo, os motions vão acontecendo, de uma forma que tudo fique conectado nessa linha... ela só não pode ser sem graça". A camada `p2d-LinhaDescendo` desenha um mundo vertical inteiro (1080 de largura, uns 9.000 px de altura), e a câmera o percorre sem corte, como um plano-sequência. Ponha em x 540 e y 960. Peça que usa: `KIT/pecas/2026-10-05-tradicional-vs-legalizai-v7/` (cena gerada por `provas/cena.js`).

**Como funciona:**
- **O traçado é calculado uma vez, em JS puro.** A função `monta()` usa `reta`, `curva` (Bézier cúbica), `arco` e `espiral`, com um ponto a cada 5 px e o comprimento de arco tabelado.
  - Cada trecho tem estilo: `coral` (três traços: o brilho, o corpo e o reflexo), `tinta` (a mão treme de leve) ou `rota` (pontilhado).
  - As marcas (`marca("q0")` e afins) dão nome aos pontos.
- **A ponta e a câmera saem dos params:**
  - `chaves` são `[marca, t, deslocamento?]`; repetir a marca segura a ponta;
  - `camera` são pares `[t, y do topo do quadro no mundo]`;
  - as duas passam por uma interpolação monótona (Fritsch-Carlson), sem passar do ponto e sem tranco.
- **Os gatilhos das cenas são `tempos`,** com as palavras da voz presas na cena. `passoT(marca)` acha o tempo em que a ponta passa por uma marca, e por isso o carimbo, os passos e o coração batem quando a linha chega neles.
- **As camadas, de baixo pra cima:** o fundo (papel, trama de pontos que anda com a câmera e manchas coral com paralaxe), as cenas de baixo, as telas do app (Img), a linha, as cenas de cima, a ponta e o degradê que apaga o mundo atrás da legenda.
- **No fecho**, o mundo some e só a linha fica, desenhando o visto no lugar do símbolo do logo (`VISTO_FECHO`, medido no fecho do kit, com a câmera em `CAM_FECHO`).
- **No fim**, uma fusão de 0,4 s volta pro quadro 0, e o loop emenda.

**Cuidados que a v7 ensinou:**
- **A linha não atravessa cartão nem botão.** Ela sublinha, contorna ou passa por fora. Na guia, a barra do cálculo enche dentro do cartão enquanto a linha corre por baixo dele. O sino fica dentro do cartão, no canto livre.
- **O brilho do coral tem 34 px**, e a folga visível é a distância menos uns 17 px. A linha fica a uns 60 px das coisas.
- **Pra quina de um visto ou o começo do gancho do "?" ler,** a linha chega subindo. Chegando na mesma direção, a quina some, e chegando ao contrário, faz bico.
- **O toque sai logo depois do aperto** (`tSai` uns 0,12 s depois), pra não cobrir o texto novo do botão.
- **O visto ao lado do texto** precisa de uns 25 px de folga.

### p2d-grupo: cena 2D

Junta as camadas que têm `"grupo": "<id dele>"` (só camadas `p2d-*` entram em grupo; grupo dentro de grupo vale).
Estrutura, igual ao `Scene` e à `Camera` do `Motion.tsx`: invólucro (estilo da transição e zIndex) com o fundo
(`Bg`, se houver) e o conteúdo; o conteúdo leva o estilo do corte (sem o desfoque, como os elementos do `Broll.tsx`)
e a câmera (escala `s` mais as molas, rotação, deslocamento mais as tremidas, origem 50% 58%); por cima, o clarão
branco do flash. `vis` abaixo de 0,5 esconde o grupo inteiro.

Ordem de pintura: `p2d-Bg` solto no z 0; grupos no z 10 + 2 pela ordem entre os grupos da lista (liste na ordem em
que aparecem: a cena que entra fica por cima da que sai); na saída em zoom o grupo vai pro 100 (como o original);
camadas soltas no z 150; `p2d-legenda` no z 200. As camadas 2D ficam por cima da legenda, do fecho e da cena 3D do
KitMotion (é como o K06 desenha as camadas de extensão).

Grupo com `z` acima de 200 fica por cima da `p2d-legenda` e do fecho. A receita da íris do fim usa z 300 de
propósito: ela fecha o vídeo e cobre tudo. Grupo que tem de ficar embaixo da legenda (o fundo do fecho, por exemplo)
usa o z padrão. Na prova de 03/10, com o grupo do fecho no z 300, a legenda e o "Vai, Legalizaí" sumiram.

### p2d-legenda

O KitMotion desenha as camadas de extensão por cima da legenda e do fecho. Com um fundo 2D cobrindo a tela (Bg ou
grupos com fundo), a legenda do kit fica escondida: a `p2d-legenda` desenha a mesma legenda (a `LegendaApple` do
K06, com as mesmas props) por cima, com modo por frase (`modos`: a legenda muda de cor com o fundo, como o `CAP` do
`Motion.tsx`) e, com `fecho: true`, o fecho e o LINK DA BIO. Sem fundo cheio, não use: a legenda sairia duas vezes.

## Batidas

| id | o que faz | padrão | sons padrão (PR/src/mix_inst.py) |
|---|---|---|---|
| `p2d-entra` | pop de entrada (o `inn`): escala de s0 a 1 com back.out(1.8), opacidade em 30% da duração; `de` dá deslocamentos de partida (x, y, rot, blur) que voltam a 0 com `easeDe` | dur 0,34, s0 0,4, opFracao 0,3, easeDe power2.out | `sint-s_pop [620, 240, 0.16, 22]` no início, -25 dB (o pop de entrada das cenas) |
| `p2d-sai` | saída como o `leave` do `lib/tl` (1 - outCubic): vai até `para` | dur 0,26, power2.out, para {op: 0} | nenhum (o mix_inst.py não tem som de saída de elemento) |
| `p2d-mola` | mola amortecida que parte de 0 (o `spring`) num canal: x, y, s e rot ganham canal próprio somado; canal próprio (como o `ring`) vai direto | amp 0,1, f 2,6, amort 6,5, dur ln(1000)/amort | nenhum (no mix_inst.py o soco não tem som próprio; o baque do "caro" é `sint-s_thump [120, 60, 0.25]`, passe em params.sons) |
| `p2d-treme` | tremida amortecida (o `shake`) em x e y por 0,6 s | x {amp 14, semente 0}, y {amp 9,8, semente 1} (a primeira tremida da câmera) | `sint-s_thump [130, 55, 0.3]` no início, -21 dB (o baque do "reajustar") |
| `p2d-canal` | tween de qualquer canal da camada (frame, acende, shut, digit, on, spin, voo, open, look, fill, val, x, y, s, rot, op, blur) | de null (o valor do momento), para 1, dur 0,3, power2.out | nenhum |
| `p2d-transicao` | transição entre dois grupos centrada em t: iris (ox, oy), push, zoom, slideUp, wipeUp | dur do TR: iris 0,5, push 0,44, zoom 0,46, slideUp 0,44, wipeUp 0,42; ox 540, oy 730 | whoosh d + 0,2 (zoom: d + 0,25) 0,08 s antes da janela: iris [.., 600, 8000] -29 e pop [700, 300, 0.14, 24] -27 na borda; push e slideUp [.., 400, 6000] -27; zoom [.., 250, 4500] -26 e thump [110, 50, 0.3] -26 0,05 s depois; wipeUp [.., 300, 5000] -27 |
| `p2d-corte` | corte entre dois grupos centrado em t: whipL, whipUp, zoomBlur, flash, loop | dur do broll-cuts.json: 0,3 (flash 0,24; loop 0,35) | flash: thump [150, 60, 0.28] -24 e tick [2200] -30 na borda; whipL, whipUp e zoomBlur: whoosh [0.34, 500, 7000] -31 0,22 s antes; zoomBlur mais thump [110, 50, 0.3] -28 0,04 s depois; loop: whoosh [0.4, 500, 7000] -29 0,08 s antes e os sinos [1318.5, 1.1] -26 e [1975.5, 0.9] -34 |

`t` de toda batida é um Tempo do kit (`{palavra: i, desloc}`, `{fecho: n}`, `{fim: n}`, `{marca}` ou segundos). Os
sons seguem as regras do núcleo: `semSom: true` cala, `sons: [...]` troca a lista, `perfilSom` troca o perfil.

Na transição e no corte, a cena que entra aparece no começo da janela (no flash, na borda) e a que sai some no fim
(no flash, na borda). O progresso vai de 0 a 1 em linha reta na linha do tempo (canais `entra`, `sai`,
`corteEntra`, `corteSai`), e o render chama as funções portadas com esse progresso.

### Estado de partida

O GSAP só mexe no canal quando o tween começa. O valor antes do primeiro evento de cada canal é o "de" desse
evento NO TEMPO (uma entrada começa escondida; um grupo que entra por transição fica invisível antes), senão o do
`estado` da cena, senão o de repouso. Todo `fromTo` das batidas usa `immediateRender: false`, então a ordem das
batidas na cena não muda o resultado (provado com a ordem invertida).

### Conferência da cena (na primeira batida p2d)

Erro: grupo que não existe ou em círculo, ícone ou sequência clay que não existe, fundo ou modo de legenda que não
existe, Numeral sem `n`, texto vazio em Bubble, Stamp, Pill, At e Calendar, carimbo com "pago", "paga" ou
"quitado", confete com alguma palavra "pagar" (e família) entre 0,5 s antes e o fim do voo, canal que a camada
não tem, transição ou corte fora do vídeo, "de" igual a "para". Aviso: Numeral fora de 1 a 9, TetoCard (o valor
escrito no componente), Phone (protótipo), mais de um Eye, mídia da extensão (ext-liga).

## Cuidados

- `Confetti` nunca na batida de pagar (o app não confirma pagamento). A batida recusa.
- `TetoCard` e `Numeral` só com número do FATOS. O TetoCard tem "R$ 81 mil por ano" escrito no componente (F051,
  teto do MEI): a trava de fatos não lê esse texto; use só em peça que fala do teto do MEI.
- `Stamp` sem "pago" (nem "quitado"). A batida recusa e a trava de fatos também.
- `Phone` usa `splash.png` do conjunto atual (a `tela-splash.png` do `public-guia`, ligada pelo ext-liga). As telas
  são do protótipo Next.js: não chamar de tela real do app.
- Nunca o selo APP EM CONSTRUÇÃO (o `Motion.tsx` e o `Broll.tsx` têm; aqui não existe).
- O @ do perfil, escrito sem acento, é recusado pelo montaProps em texto visível: use o LINK DA BIO do fecho.
- `Eye` usa o id de recorte fixo "olho": um olho por quadro.
- Camada solta fica por cima da legenda do kit: não a ponha na faixa da legenda (top 206 a 536 por padrão).
- `Numeral` com `outline`: o contorno mostra a emenda interna dos glifos da Sora variável (no 2 e no 3, visto nos
  stills de 03/10). É o mesmo desenho do reel de 02/10 (`Numeral n={3} outline` do `Motion.tsx`); o cheio sai limpo.
- `Sticker` com `ring` coral-700 em fundo coral quase não aparece: o aro só se vê em fundo papel ou escuro.
- Params de CSS da camada (`origem`, `padding`, `espacamento`, `sombra`, `sombraTexto`, `border`) não são texto: a
  trava de fatos não os lê desde 03/10 (antes, a origem "50% 6%" virava percentual sem fato e travava o final).

## Mídia: ext-liga e ext-desliga

Os componentes originais buscam arquivos em caminho fixo do public: `icons/<nome>.webp` (Sticker e TetoCard),
`clay/<seq>/NNN.jpg` (ClayCard) e `splash.png` (Phone). O `midia.json` (formato da seção 4.10) liga, por hardlink
no `RM/public-kit`: os 5 ícones de `RM/public/icons`, os 242 quadros de `RM/public/clay` (cadastro e calculo, cerca
de 7 MB) e a `RM/public-guia/telas/tela-splash.png` como `splash.png`. Nada é copiado.

```
PY -B KIT/scripts/kit.py ext-liga precificacao      # antes de stills ou render que usem essas camadas
PY -B KIT/scripts/kit.py ext-desliga precificacao   # logo depois (o bundle copia o public-kit a cada render)
```

O `ext-desliga` só apaga link com o inode da origem e tira as pastas que ficaram vazias. Provado: 248 links entram
(st_nlink 3 ou 4, tamanho e inode da origem) e o public-kit volta à listagem de antes.

Provado também com stills (03/10): com a mídia ligada, a peça de prova e os 3 exemplos desenharam os 5 ícones, os
quadros clay, o medidor do teto e a splash; depois do `ext-desliga`, o public-kit voltou aos mesmos 41 arquivos
(caminho, tamanho e inode). Registro: `KIT/biblioteca2d/provas/midia-ext-liga-navegador.json`.

Sem a mídia, o quadro que mostra uma dessas camadas quebra: o `Img` do Remotion tenta de novo (1 s e 2 s) e cancela
o quadro ("Error loading image with src: .../icons/campanha.webp", medido em 03/10 no quadro 272 da prova). Quadro
em que elas não aparecem sai igual sem a mídia (o 14 da prova deu o mesmo md5): antes de a linha do tempo existir, o
KitMotion desenha uma vez com os valores de repouso, com todos os grupos e elementos visíveis, e as imagens são
pedidas nessa passada; o log mostra "EncodingError: The source image cannot be decoded", e a camada some antes da
captura. No render, que passa por todos os quadros, ligue a mídia sempre que a cena tiver `p2d-Sticker`,
`p2d-ClayCard`, `p2d-TetoCard` ou `p2d-Phone`.

## Diferenças conhecidas contra o original

- O kit avança a linha do tempo em `t + 1e-4` (o seek do K06) e o GSAP arredonda os valores a 6 casas: o estado
  bate com as fórmulas do original até 1e-6 (molas e progressos) e 1e-3 px (tremida). As funções portadas, essas
  sim, são iguais ao original bit a bit.
- No `Broll.tsx` os elementos de todas as cenas ficam numa faixa acima de todos os vídeos; no kit cada grupo leva o
  fundo e os elementos juntos (durante o corte, os elementos da cena que sai ficam sob o fundo da que entra).
- No original a legenda fica no z 200, acima das cenas; no kit isso é a `p2d-legenda`.

## Testes (sem render)

Rodar de `RM` com `node src/kit/ext/precificacao/testes/<arquivo> [--saida <relatorio.json absoluto>]`:

| teste | prova |
|---|---|
| `equivalencia-2d.mjs` | transições (Scene), câmera (Camera), íris do fim, cortes (trOf), clarão do flash, volta do loop e as curvas (spring, shake, inn) contra os originais, empacotados em memória com um plugin que só acrescenta `export { ... }` ao texto (o arquivo em disco não muda) e o calço mínimo do Remotion: 200 instantes por tipo, diferença até 1e-9, textos iguais |
| `batidas-2d.mjs` | as batidas na linha do tempo do kit contra as fórmulas, quadro a quadro; ordem invertida; sons; as recusas e os avisos |
| `render-2d.mjs` | as 25 camadas desenhadas em HTML (react-dom/server) em 22 quadros: vitrine com os 23 componentes e a mídia certa, grupos, transição, flash, legenda e câmera |
| `empacota.mjs` | `render.tsx` empacotado como o bundle veria (browser, jsx automatic) e `batidas.ts` puro (browser e node); nenhum efeito colateral no import; exports da seção 4.10 |

Com `K14_RASCUNHO=<pasta>` os testes leem os arquivos da extensão dessa pasta (pra testar antes de instalar).

## Prova no navegador (03/10)

Os testes acima não abrem navegador. Em 03/10 (frente BIBLIOTECA 2D NO NAVEGADOR) as camadas e as batidas foram
desenhadas no Chrome do render (chrome-headless-shell 1243, `--gl=angle`), pelo `stills.mjs` do K06, com as 3
extensões no bundle (abertura, precificacao e tradicional-vs-legalizai) e a mídia ligada só durante a execução.

**A peça de prova:** `KIT/pecas/_2026-10-03-prova-2d/` (peça de teste: não entregar e não apagar, é a prova). Uma
cena só do KitMotion, de 33,4 s, em três atos:

| ato | tempo | o que desenha |
|---|---|---|
| 1. precificação | 0 a 19,6 s | os 23 componentes em 11 grupos (um grupo dentro de outro, um grupo sem fundo por cima do `p2d-Bg` solto, uma camada solta no z 150); as 7 batidas: `p2d-entra` com `de` em x, y, rot e blur, `p2d-sai`, `p2d-mola` em s e rot (soco de câmera) e no canal próprio `ring`, `p2d-treme`, `p2d-canal` em cheio, acende, on, shut, digit, fill, val, spin, open, look, voo, frame, s e op; as 5 transições e os 5 cortes; a `p2d-legenda` com a cor por frase (light, coral e dark) |
| 2. abertura | 19,6 a 28,6 s | as 6 camadas e as 11 batidas da extensão abertura, com o calendário clay (`RM/src/kit/ext/abertura/LEIA-ME.md`) |
| 3. fecho | 28,6 a 33,4 s | íris pra um grupo de papel, a `p2d-legenda` com `fecho: true` desenhando "Vai, Legalizaí" e o LINK DA BIO por cima do fundo 2D, e a íris do fim (grupo coral no z 300) cobrindo tudo |

A narração é sintética (`voz/narracao.json`, sem voz): cada frase da legenda diz o que o trecho prova. O aparelho da
cena fica invisível o tempo todo; ele só existe pro `fecho-simbolo` animar a assinatura.

Em `provas/` da peça:

- `folha-1-precificacao.jpg`, `folha-2-precificacao.jpg` e `folha-3-abertura-fecho.jpg`: os 60 stills, cada um com o
  quadro, o tempo e o que mostra;
- `recortes-componentes-1.jpg`, `recortes-componentes-2.jpg` e `recortes-abertura-fecho.jpg`: detalhes em tamanho
  cheio;
- `prova-navegador.json`: o md5 dos pixels de cada still, o md5 dos arquivos das 3 extensões no bundle, o log do
  navegador, o determinismo e o que quebrou.

Os 3 exemplos de `KIT/biblioteca2d/exemplos/` ganharam still no mesmo bundle: `KIT/provas/modelos/demo-2d/`
(`folha-exemplos.jpg`, um still por exemplo e o `demo-2d.json`).

**Resultado.**

- 73 stills sem erro (60 da prova, 8 dos exemplos e 5 da regressão) e mais 5 da `AberturaMes`: nenhum `EXT_ERRO`,
  `EXT_AVISO` ou erro de página no log. Props, eventos (84), qc (sem invasão de legenda) e fatos (0 erro) da prova
  passam.
- Regressão com as 3 extensões no bundle: `GuiaPronta` 0, 245 e 478 e `KitMotion` com as props do guia 245 e 478
  (no public-kit) e `AberturaMes` 0, 60, 150, 300 e 450 (no public-abertura) com o md5 dos pixels igual à linha de base
  do K06 (10 de 10; o quadro 0 do `GuiaPronta` tem duas variantes na própria linha de base e saiu uma em cada rodada).
- Determinismo: entre duas rodadas, 48 dos 60 stills da prova repetiram o md5. Os outros 12: 11 são da abertura, cujo
  layout mudou entre as rodadas, e o quadro 180, o meio da transição zoom, que em 5 renders deu 4 md5 com diferença
  máxima de 1 nível de cor (o desfoque grande com opacidade varia na rasterização do Chrome). Os quadros 120, 300 e
  456, renderizados 3 vezes, repetiram o md5.

**O que quebrou e o conserto.**

1. A trava de fatos lia o CSS da camada como texto: a `origem` "50% 6%" da `p2d-HangTag` virou percentual sem fato
   (erro, final travado). Conserto no `KIT/scripts/fatos.py`: `origem`, `origemAchata`, `padding`, `espacamento`,
   `sombra`, `sombraTexto` e `border` ficam fora (`ESTILO_CAMADA`); o `testa_regras.py` segue com 74 de 74.
2. A `p2d-legenda` e o fecho sumiram com o grupo do fim no z 300 (a seção "p2d-grupo: cena 2D" tem a regra).
3. Na abertura, com a pasta fora do lugar, o levanta e o mergulho do `guarda-na-pasta` caíram fora dela ou
   ficaram escondidos atrás dela (regra no LEIA-ME da abertura).

Os três ficaram na cena final, consertados (o fecho por cima do papel no z padrão; a pasta embaixo e à direita).

**Pra refazer** (com 400 MB livres; os stills esperam a vez na trava de render):

```
PY -B KIT/scripts/kit.py props _2026-10-03-prova-2d          (e eventos, qc e fatos)
PY -B KIT/scripts/kit.py ext-liga precificacao
PY -B KIT/scripts/kit.py stills _2026-10-03-prova-2d --quadros 33,85,152,213,272,330,385,480,506,552,637,803,945
PY -B KIT/scripts/kit.py ext-desliga precificacao
```

Os quadros e o que cada um mostra estão no `prova-navegador.json`. Os PNG ficam em `provas/stills/` da peça (uns 1,5
MB cada): olhe e apague. Pra mudar a prova, edite o `cenas.json` da peça e rode o `props` de novo antes dos stills.

## Regras

- A extensão não edita nada fora da pasta dela; só importa de `src/motion`, `src/lib`, do núcleo e do render do kit.
- Sem efeito colateral no import: nenhuma ease registrada, nenhum padrão do gsap trocado, nenhum plugin, nenhum
  gancho global (as curvas da mola e da tremida entram como função de ease do próprio tween).
- Erro de sintaxe ou de import aqui derruba o bundle de todas as composições: rode `testes/empacota.mjs` e o tsc
  (`npx tsc --noEmit -p src/kit/tsconfig.json`) antes de mexer.
- Texto em português do Brasil, sem travessão, e "Legalizaí" com acento em texto visível.
