# Extensão "tradicional-vs-legalizai" do kit de motion (`RM/src/kit/ext/tradicional-vs-legalizai/`)

Reel 9:16 de 05/10/2026 "Contabilidade tradicional vs Legalizaí", a versão animada do carrossel do mesmo dia. Contrato: `KIT/DESENHO.md`, seções 4.3 e 4.10. Roteiro e decupagem aprovados: `KIT/pecas/2026-10-05-tradicional-vs-legalizai/ROTEIRO.md`. Cena: `KIT/pecas/2026-10-05-tradicional-vs-legalizai/cenas.json`.

Nada do núcleo (`nucleo/`, `batidas/`, `render/`) nem do carrossel foi editado: a extensão só importa. Os objetos de argila, os materiais, as texturas, a sombra de contato e a luz calibrada vêm de `src/carrossel-2026-10-05/`.

| arquivo | o que é |
|---|---|
| `batidas.ts` | as 22 batidas da peça (puras: sem React, sem DOM, sem Remotion) e os metadados da camada 2D |
| `comum.ts` | o que as batidas e o render dividem: canais, peças do palco, câmera de repouso, vitrines e a curva `kitPousa5` (pouso que passa só 4,5%) |
| `render.tsx` | o objeto `palco-tvl` e a camada `pilula-comenta` |
| `palco/vitrines.ts` | as duas vitrines do carrossel presas ao mundo (quadro em NDC no passe opaco, logo depois do papel do kit) e a máscara das sombras |
| `palco/luz.ts` | a luz do carrossel na cena do kit (chave com sombra VSM, recorte, hemisférica, ambiente 0,6, exposição 0,78) e a varredura fria |
| `palco/pecas.ts` | a argila do lado Tradicional com os planos de recorte da vitrine (chão e paredes) |
| `palco/cartoes.ts` | os cartões que saem da tela, a face pintada do cartão do imposto, as placas de documento, a moeda, o sino e as faíscas |

## O palco (`palco-tvl`)

Um objeto só da cena. Na cena ele usa o modelo `proc-cena-guia` do catálogo (cena procedural, licença própria) com `"tipo": "palco-tvl"`: o `montaProps` exige um modelo do catálogo, e o catálogo não tem item pra objeto de extensão.

- **Vitrines.** As âncoras ficam no mundo (`comum.ts`, `VITRINE_PADRAO`): as bordas laterais no plano z = 0, o topo no fundo (z -0,07) e a base no chão da frente (z 0,06). A cada quadro elas são projetadas pela câmera do quadro (com a deriva) e viram os dois painéis arredondados do carrossel (raio 24, borda de 1,5 px, vinheta de 3% e grão). O painel anda com a câmera e não descola dos objetos.
- **Luz.** O `Cena3DKit` não tem luz por cena. O palco ajusta a luz do kit antes de cada render (`scene.onBeforeRender`, que roda antes de o three juntar as luzes): apaga a direcional da frente do kit (a chave é a do palco, com sombra VSM), põe a de trás como o recorte do carrossel e deixa a hemisférica com 0,32, o ambiente da cena com 0,6 e a exposição com 0,78. Os números vêm do `luz.ts` do carrossel (`conteudo.luz` troca).
- **Sombras.** Sombra de contato do carrossel (`SombraContato`) num chão em `MESA`, rodada logo antes de o plano dela ser desenhado (como o `Reflector` do three); sombra suave da chave num chão invisível só embaixo da vitrine fria (na fusão ele se estende); sombras-blob pra tudo que flutua. Todas presas aos painéis pela máscara (`mascaraVitrine`).
- **Argila.** Os materiais das peças frias são cópias, uma por peça, com três planos de recorte: o chão e as duas paredes da vitrine fria. As paredes passam pelo olho da câmera e pela borda desenhada do painel e são refeitas a cada quadro. Assim, o que sai pela esquerda some exatamente na borda, em qualquer profundidade, e nada passa pro lado do aparelho antes da fusão. Nas trocas, nada atravessa o chão: a peça encolhe e cresce no próprio pé (canal `enc`; o pivô é `opcoes.pivo`, que na lupa é a ponta do cabo).
- **Folha carimbada.** O formulário de cima da `pilhaA` (`opcoes.voaPara`, `opcoes.marca`) sai do maço e fica num grupo próprio. Com `voa` 0 ele segue a pilha. De 0 a 1, voa por uma Bézier até a vaga dentro da pasta e fica de pé antes de descer. Com 1, segue a pasta e desce junto com as folhas dela. A marca do carimbo (canal `marca`) fica no formulário, na pegada da borracha, em tinta fria.
- **Pasta.** A frente gira na dobradiça (canal `abre`: 1 inclina 0,24 rad pra frente, 0 fecha). É o mesmo modelo, sem troca.
- **Cartões.** O cartão (`CartaoTela`) nasce com o recorte exato da vaga: `opcoes.regiao` em px da tela montada, `raio` e `raioBaixo` (a linha de lista tem o de baixo reto).
  - Com `prende` 1 ele fica colado na vaga, pela pose do aparelho no quadro e com a flutuação; com `prende` 0 fica no pouso.
  - O pouso é `opcoes.pouso` em px da câmera de repouso: centro e largura do cartão compacto.
  - O canal `larg` vai da largura da vaga (0) à compacta (1, `opcoes.compacto` e `raioCompacto`). Ele corta só a sobra da direita, e o corpo é refeito pra cada largura.
  - A sombra de trás só aparece fora da vaga (1 - `prende`).
- **Fecho.** Peça com `painel` 1 fica presa ao painel: mesmo centro (`ex`, `ey`, no plano da peça e pela câmera do quadro), mesma escala, e `alfa` na opacidade.
- O aparelho do kit e a guia DAS (`proc-folha-das`) continuam objetos do kit. Na cena, os dois vão com `sombra 0` (a sombra deles é a do palco).

### Canais (`st.canais`)

- `palco`: `fusao`, `aquece`, `escala`, `ex`, `ey`, `alfa`, `halo`, `brilho`, `brilhoNeutro`, `varre`, `varreI`, `fio`, `fioA`.
- `p:<peça>`: `x`, `y`, `z`, `rx`, `ry`, `rz` (deslocamentos sobre a pose de repouso), `s`, `sy`, `vis`, `enc` (escala da troca), `painel` e `alfa` (fecho). Canais de cada tipo:
  - pilha: `tremor`, `marca`, `voa`;
  - carimbo: `sobe`, `achata`;
  - pasta: `folhas`, `abre`;
  - cartões: `prende`, `arco`, `achata`, `larg`;
  - cartão do imposto: `brilho`, `conta`, `calc`, `mostraValor`, `revela`, `brilhoBotao`, `pulso`, `toque`, `verif`, `anel`, `afunda`;
  - placa: `prende`, `salto`, `entregue`;
  - moeda: `k`, `giro`, `brilho`;
  - faísca: `k`.
- Peças:
  - frias: `pilhaA` (com o `carimbo`), `despP`, `pastaA` (começa aberta: `inicial.abre` 1), `despG` (com o ponteiro dos segundos), `envelope`, `pilhaB`, `lupa`, `pastaC` (folha "Contrato social");
  - cartões: `cartaoNasceu`, `cartaoImposto`, `cartaoContrato` (a linha dos Documentos);
  - fileira: `placa1` a `placa4`, em leque (`fileira.dz`, papel creme; a `placa3` tem a pílula "Entregue");
  - `moeda`, `sino`, `faisca1`, `faisca2`.

  A cena troca poses e opções por `conteudo.pecas.<id>`.

## Batidas

| id | o que faz | âncoras e sons (perfil v2) |
|---|---|---|
| `vitrine-luz` | varredura de luz fria sobre a argila (luz de área e faixa no painel) | `sint-s_brilho [dur]` inicio+0,02 -38 |
| `vitrine-fio` | fio de luz descendo pelo vão | `sint-s_swish [0.13]` inicio -37 |
| `aceno` | ida e volta curta num eixo do objeto (relativa à pose do momento) | nenhum |
| `pose-objeto` | objeto do kit vai pra uma pose | nenhum |
| `palco-luz` | halo, brilho no chão e o tom do brilho | nenhum |
| `exibe-objeto` | troca de peça na vitrine fria: o que sai encolhe no pé (kitEncolhe), o que entra cresce no pé depois (`sobe.desloc`) e assenta (kitPousa5); nada atravessa o chão | `sint-s_whoosh [0.3, 500, 6000]` inicio -34; `sint-s_thump [110, 50, 0.22]` pouso -30 |
| `carimba` | carimbo sobe, carimba, achata e volta com mola; folhas tremem; a marca aparece no formulário (`marca`); com `sai`, o carimbo sobe e encolhe | `sint-s_swish [0.24]` sobe -34; `sint-s_thump [150, 60, 0.3]` impacto -22; `mixkit-2995` impacto -28 (sincronia) |
| `pasta-leva` | a folha carimbada voa da pilha pra pasta aberta, as folhas descem, a frente fecha girando (0,18 s) e a pasta sai pela parede da esquerda | `mixkit-1105` entra -30 (sincronia); `sint-s_thump [120, 55, 0.16]` fecha -34; `mixkit-1530` desliza -31 (sincronia) |
| `cartao-sai-da-tela` | o cartão nasce com o recorte exato da vaga, descola (tela vazia no mesmo quadro), cresce e fica compacto só no voo (`compacta`), pousa com achatamento; na volta chega na caixa da vaga e a tela cheia volta no mesmo quadro | `mixkit-3005` sai -27; `sint-s_thump [120, 55, 0.25]` pousa -30; `sint-s_pop [900, 420, 0.1, 34]` pousa -31 |
| `cartao-contador` | o cartão do imposto acende, o valor conta e o brilho passa no esqueleto | `sint-s_chime [1975.5, 0.6]` brilho+0,02 -35; `sint-s_conta` contador |
| `sino-toca` | o sino salta, balança três vezes e sai | `sint-s_pop [1300, 700, 0.08, 45]` salto -31; `mixkit-766` balanco -27 |
| `toque-cartao` | esqueleto vira "Pagar agora", pulso, toque, aperto, empurrão de câmera e "Código copiado" | `sint-s_tick [2900]` so -38; `mixkit-1109` toque-0,01 -22; `mixkit-2867` toque+0,12 -26 |
| `fileira-fora-do-padrao` | a fileira de placas sai da tela já formada e uma placa salta | `sint-s_bubble` x3 inicio -30 a -32; `sint-s_pop [500, 900, 0.12, 30]` salto -28 |
| `peca-move` | movimento secundário de uma peça (a lupa) | nenhum |
| `moeda-pessoa` | a moeda sai da tela por cima da fileira, gira no ar e pousa chegando com velocidade (kitChega, o giro termina junto); no `encosta` dá um pulinho (`para`) até a placa, que volta com pouso (kitPousa5, o som no assentar) e a pílula "Entregue"; brilho com faíscas | `mixkit-2641` rola -30; `sint-s_chime [2093, 0.35]` e `sint-s_thump [120, 55, 0.2]` pouso; `sint-s_swish [0.2]` encosta -36; `mixkit-1120` assenta -30; `sint-s_brilho [0.5]` brilho -38 (a cena de 05/10 tira o chime) |
| `volta-pra-tela` | placas e moeda voltam pra tela | `sint-s_swish [0.24]` inicio+0,02 -36 |
| `funde-vitrines` | o vão fecha, a fria esquenta, as duas viram uma; a pasta encosta no aparelho | `sint-s_whoosh [0.6, 300, 5000]` inicio -30; `sint-s_thump [110, 50, 0.22]` encosta -29 |
| `aproxima` | só câmera: aproxima devagar | `sint-s_riser [0.5, 420, 1250]` riser -32 |
| `pasta-endireita` | a pasta fica em pé ao lado do aparelho | `sint-s_thump [110, 50, 0.18]` pousa -33 |
| `palco-fecha` | o painel encolhe até o símbolo do logo e some; as peças pedidas ficam presas a ele (`painel` 1: mesmo centro, mesma escala e `alfa` junto) | nenhum |
| `vitrine-palco` | volta do loop: as vitrines crescem do centro, o conjunto da capa cresce no pé (`enc`), todo canal volta pro quadro 0 (com o `conteudo.estado` da cena) | nenhum |
| `pilula-comenta` | a pílula "Comenta aí" com o balão entra embaixo do logo e sai com ele | `pixabay-316482` inicio -28 (sem verificação no catálogo) |

Todos os tempos aceitam o `Tempo` do kit. Os parâmetros padrão estão em `batidas.ts`; a cena só manda o que muda.

## Camada `pilula-comenta`

A pílula do fecho do carrossel: fill `#DD4E27`, Sora 800 branca e o ícone de balão em contorno branco antes do texto. Parâmetros: `texto`, `top` (968), `tamanho` (36), `cor`. Canal `k` (0 fora, 1 no lugar). O `LinkBio` do kit só desenha texto; a peça usa esta camada no lugar da `link-bio`.

## Conferir depois de mexer

1. `npx tsc --noEmit -p src/kit/tsconfig.json` (cwd `RM`): zero erro.
2. `kit.py props`, `kit.py eventos`, `kit.py fatos` e `kit.py qc` da peça: zero erro e sem invasão da legenda.
3. Stills (`kit.py stills <peça> --quadros ...`) e a folha.
4. Zero U+2014 e U+2013 nesta pasta.
