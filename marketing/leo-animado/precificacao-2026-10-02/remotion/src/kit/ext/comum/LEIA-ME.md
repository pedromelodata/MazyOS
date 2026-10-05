# Extensão "comum" do kit de motion (`RM/src/kit/ext/comum/`)

O que serve pra qualquer peça e veio da peça de 05/10/2026 ("Contabilidade tradicional vs Legalizaí"): o palco de argila (vitrines, luz do carrossel, peças de argila, cartões que saem da tela, fileira de placas, moeda, sino), 27 batidas, a camada 2D "pilula-comenta" e os objetos de argila do carrossel de 05/10 soltos na cena. Contrato: `KIT/DESENHO.md`, seções 4.3 e 4.10. Levada pro kit em 03/10/2026; a peça de 05/10 continua renderizando com este código (provas no fim).

Os objetos de argila são os do carrossel (`RM/src/carrossel-2026-10-05/objetos/`), só importados por `objetos/argila.ts`: o carrossel não muda.

| arquivo | o que é |
|---|---|
| `batidas.ts` | as 27 batidas (puras: sem React, sem DOM, sem Remotion) e os metadados das camadas `pilula-comenta` e `divisor-vs` |
| `render.tsx` | os objetos `palco-argila` e `argila` e as camadas `pilula-comenta` e `divisor-vs` (o raio da tela dividida) |
| `palco/modelo.ts` | puro: tipos, canais, curvas (`kitPousa5`, `kitEncolhe`, `kitChega`), o registro dos tipos de palco e as contas de câmera e de tela |
| `palco/fabrica.ts` | a fábrica do palco (render), a mesma pra todo tipo de palco registrado |
| `palco/vitrines.ts` | as duas vitrines presas ao mundo (quadro em NDC no passe opaco, logo depois do papel do kit) e a máscara das sombras |
| `palco/luz.ts` | a luz do carrossel na cena do kit (chave com sombra VSM, recorte, hemisférica, ambiente 0,6, exposição 0,78) e a varredura fria |
| `palco/pecas.ts` | as peças frias (argila) com os planos de recorte da vitrine (chão e paredes) |
| `palco/cartoes.ts` | os cartões recortados da tela, a face pintada do cartão do imposto, as placas, a moeda, o sino e as faíscas |
| `objetos/argila.ts` | os construtores do carrossel (o único lugar que importa `objetos/`), a pasta com dobradiça, o tremor da pilha, o ponteiro dos segundos e a fábrica do objeto solto `argila` |

## O palco de argila

Um objeto da cena. O tipo genérico é `palco-argila` (item `proc-palco-argila` do catálogo de modelos): nenhuma peça padrão, a cena declara todas.

```json
{ "id": "palco", "modelo": "proc-palco-argila", "pose": {}, "sombra": 0,
  "conteudo": {
    "aparelho": "aparelho",
    "pecas": {
      "pilha1":   { "tipo": "pilha", "lado": "frio", "x": -0.066, "z": -0.012, "ry": 0.12, "altura": 0.056, "visivel": true,
                    "opcoes": { "macos": [0.013, 0.012, 0.014, 0.012], "semente": 11, "voaPara": "pasta1", "marca": true } },
      "carimbo1": { "tipo": "carimbo", "lado": "frio", "pai": "pilha1", "x": 0.006, "z": 0.004, "ry": 0.13, "altura": 0.13, "visivel": true },
      "pasta1":   { "tipo": "pasta", "lado": "frio", "x": -0.074, "z": -0.074, "rx": -0.05, "ry": 0.16, "s": 0.85, "altura": 0.11,
                    "visivel": false, "opcoes": { "folhas": 3 }, "inicial": { "abre": 1 } },
      "sino1":    { "tipo": "sino", "lado": "quente", "rz": 0.3, "s": 0.7, "visivel": false, "opcoes": { "pouso": { "px": 922, "py": 800, "z": 0.03 } } }
    }
  } }
```

Exemplo completo: `KIT/pecas/_2026-10-03-prova-comum/cenas.json` (folha em `provas/folha-palco.jpg` da peça e em `KIT/provas/modelos/render/palco-argila.jpg`).

- **Aparelho e sombra.** O aparelho do kit e a guia DAS vão com `"sombra": 0`: a sombra deles é a do palco (contato do carrossel e chave VSM). Pose do palco zerada.
- **Câmera.** As vitrines e os pousos em px foram medidos com a câmera do carrossel: `{"x": 0, "y": 0.21939, "z": 0.88298, "tx": 0, "ty": 0.0317, "tz": 0, "fov": 28}` (vitrines de x 72 a 1008, aparelho de uns 330 px em x 780). Com outra câmera, troque `conteudo.camRepouso`.
- **`conteudo`:** `aparelho` (o id do aparelho de onde saem cartões, placas e moeda; padrão `"aparelho"`; `null` pra palco sem aparelho), `vitrine` (medidas das vitrines, `{borda, vao, yTopo, zFundo, zFrente, raio, yAncora}`; `null` tira as vitrines e deixa a luz, o chão e as peças), `luz` (`{exposicao, ambiente, chave, recorte, hemisferio}`; `null` deixa a luz do kit), `pecas`, `fileira` (`{px, py, z, larguraPx, passoPx, dz}` da fileira de placas), `camRepouso` e `estado` (canais do quadro 0 por id, que a volta do loop também usa). Ponha em `conteudo.textos` todo texto que aparece no palco (formulários, cartões): é o que a trava de fatos e a de travessão conferem.
- **Peça (`pecas.<id>`):** `tipo`, `lado` (`frio`: argila com o recorte da vitrine fria; `quente`: sai da tela ou nasce no lugar), a pose de repouso no mundo (`x`, `y`, `z`, `rx`, `ry`, `rz`, `s`; nas frias, `y` 0 é o chão), `altura` (as trocas encolhem a peça no pé), `visivel` (no quadro 0), `pai` (peça presa a outra, como o carimbo na pilha; a pose é local), `opcoes` e `inicial` (canais do quadro 0 fora do padrão do tipo).
- **Tipos frios:** `pilha` (`macos`, `semente`, `voaPara` = id da pasta que recebe a folha de cima, `marca` = a marca do carimbo nessa folha), `carimbo`, `pasta` (`folhas`, `docFrente` = a folha "Contrato social", `abreRad`), `despertador` (`tamanho`, `segundos`), `calendario` (calendário de mesa de argila, de 05/10: `dia` da folha da frente e `folhas`), `envelope`, `envelope-aberto`, `lupa` (`pivo` = o ponto que fica parado na troca, na lupa a ponta do cabo `[0, -0.094, 0]`), `caneta`, `prancheta`.
- **Tipos quentes:** `cartao-app` e `cartao-imposto` (o recorte exato da vaga da tela: `tela`, `regiao {x, y, w, h}` em px da tela montada, `raio`, `raioBaixo`, `compacto` e `raioCompacto` (a largura do voo), `corCorpo`, `borda`, `bordaSo` ("voo" ou "sempre"), `pouso {px, py, z, larguraPx}` em px da câmera de repouso; no do imposto, `valor` (o número que o contador conta, declarado em `fatos.exemplos`; numa peça conferida como MEI, com público MEI, todos ou vazio, o cartão do imposto com valor é recusado pelo F063, inclusive o das peças padrão de um tipo de palco, como o `palco-tvl`), `rotulo`, `retorno`, `corBotao` e, quando a tela não é a de 05/10, `valorEm {x, y, fonte, cor}`, `botaoEm {x, y, w, h, r}` e `fundoCard`), `placa` (`ordem` na fileira, `entregue` = a pílula "Entregue", `u` e `v` = de onde sai na tela), `moeda` (`pouso {px, py, z}`, `origem {u, v}` na tela), `sino` (`pouso {px, py, z}`), `faisca` (`cor`, `desloc`, `tamanho`; segue a moeda).
- **Canais** (`st.canais`): `palco` (`fusao`, `aquece`, `escala`, `ex`, `ey`, `alfa`, `halo`, `brilho`, `brilhoNeutro`, `varre`, `varreI`, `fio`, `fioA`) e `p:<peça>` (`x`, `y`, `z`, `rx`, `ry`, `rz` sobre a pose de repouso, `s`, `sy`, `vis`, `enc`, `painel`, `alfa` e os do tipo: pilha `tremor`, `marca`, `voa`; carimbo `sobe`, `achata`; pasta `folhas`, `abre`; despertador `corre` (voltas do ponteiro dos minutos; o das horas anda 1/12 disso); calendario `vira` (quantas folhas já viraram: de 0 a `folhas`); cartões `prende`, `arco`, `achata`, `larg` e, no do imposto, `brilho`, `conta`, `calc`, `mostraValor`, `revela`, `brilhoBotao`, `pulso`, `toque`, `verif`, `anel`, `afunda`; placa `prende`, `salto`, `entregue`; moeda `k`, `giro`, `brilho`; faísca `k`).

### Um lado de cada vez, com contato (acréscimos de 05/10/2026)

Vieram da versão 2 da peça de 05/10 (`KIT/pecas/2026-10-05-tradicional-vs-legalizai-v2/`, ROTEIRO lá). O Pedro pediu os dois lados alternando na tela inteira, em vez de lado a lado, e nada atravessando nada. Todos os campos são opcionais e, sem eles, o palco sai como antes: as props e os eventos da peça de 05/10 (v1) refeitos com este código têm o mesmo md5.

- **Vitrines largas** (`conteudo.vitrine`): `borda` e `vao` maiores fazem cada vitrine cobrir o quadro inteiro. A v2 usa borda 0,27, vão 0,003, `yTopo` 0,6 e `zFrente` 0,5, e a câmera desliza entre x -0,1365 e 0,1365. O vão só aparece durante a troca.
  - `luzFria {x, raio}`: centro e raio da luz suave atrás da argila. Padrão x -0,056 e raio 0,078.
  - `varre {de, ate}`: caminho em x da luz de varredura fria. Padrão -0,14 a 0,01.
  - `cores`: frio, frioLuz, frioBorda, quente, quenteBorda e halo, por cima dos tokens do carrossel.
- **Sombra de contato maior** (`conteudo.sombraContato {largura, profundidade, x}`): padrão 0,42 por 0,32, centrada em x 0. A v2 usa 0,62 por 0,42.
- **Pouso no mundo** (`opcoes.pousoMundo {x, y, z, largura}` em cartões, moeda e sino): no lugar do pouso em px da câmera de repouso. Com o y certo, a peça fica em pé no chão. A conta está no `cena-v2.js` da peça, na pasta `provas/`.
- **No chão, com sombra de verdade** (`opcoes.sombraContato: true` em cartões, moeda e sino): a peça entra na sombra de contato do palco e projeta a da luz chave. Fica sem blob e, no cartão, sem a sombra falsa de trás, que é a do flutuar.
- **Fileira no mundo** (`conteudo.fileira.mundo {x, z, passo, largura, dz, noChao}`): placas em pé no chão, como dominós, com sombra. A que salta faz um arco e cai em pé à frente da fila, sem girar no ar.
- **Sino apoiado** (`opcoes.noChao: true` no sino): o balanço gira em volta do ponto do aro que encosta no chão, do lado pra onde ele tomba. Ele balança apoiado, sem atravessar o chão.
- **Prova de colisão**: cada peça marca `userData.corpo` com o id dela. Cartão, placa e moeda marcam `userData.encostaEm` (o aparelho) enquanto ainda saem da tela, e esse é o único contato aceito. A sombra falsa de trás dos cartões fica fora (`userData.semColisao`). Comando: `kit.py colisao <peça>`.

### Tipo de palco de uma peça

Uma extensão de peça registra o tipo dela com as peças padrão, pelo `registraPalco` do `palco/modelo.ts`, e liga a fábrica no `render.tsx` dela. É o caso da peça de 05/10: `ext/tradicional-vs-legalizai/comum.ts` registra `palco-tvl` com as 20 peças do reel, e a cena da peça usa `"tipo": "palco-tvl"`. As batidas acham o palco pelo id (`palco`, padrão `"palco"`) entre os objetos de tipo registrado. O registro mora num nome próprio do `globalThis` (`__kitComumPalcos`), porque em Node cada extensão é empacotada sozinha e as duas precisam ver os mesmos tipos; nenhum tipo é trocado depois de registrado.

## Objetos de argila soltos (tipo `argila`)

Os 11 objetos do carrossel também entram como objeto comum da cena, um item por forma no catálogo de modelos (`KIT/catalogos/modelos/aquisicoes-ext-comum.json`): `proc-argila-pilha`, `proc-argila-carimbo`, `proc-argila-pasta`, `proc-argila-despertador`, `proc-argila-envelope`, `proc-argila-envelope-aberto`, `proc-argila-lupa`, `proc-argila-caneta`, `proc-argila-prancheta`, `proc-argila-moeda` e `proc-argila-sino`. Tamanho real em metros, pivô no centro da caixa (em pé no papel: `y = -0,0905 + metade de caixa.tamanho[1]`), `sHeroi` no catálogo, opções em `conteudo.opcoes` (as mesmas das peças frias) e o quadro 0 dos canais em `conteudo.estado`.

- **Luz.** Sem palco, a luz é a do kit e a argila sai bem mais clara que no carrossel (folha `KIT/provas/modelos/render/argila-01.jpg`). Pra luz do carrossel, ponha na cena um palco sem vitrine, sem aparelho e sem peça, que só instala a luz e a sombra de contato, e deixe os objetos com `"sombra": 0`:

```json
{ "id": "luz", "modelo": "proc-palco-argila", "pose": {}, "sombra": 0, "conteudo": { "aparelho": null, "vitrine": null, "pecas": {} } }
```

  Exemplo: `KIT/pecas/_2026-10-03-prova-comum/cenas-soltos.json` (folha `KIT/provas/modelos/render/argila-luz-carrossel.jpg`).
- **Canais** (`st.canais[id]`, pela batida `objeto-canal`): pilha `tremor`; carimbo `sobe` (m) e `achata`; pasta `abre` e `folhas`; moeda `giro` (voltas em y); sino `balanco` (rad em z). A pose anda pelas batidas de objeto do kit (`pose-objeto`, `aceno`).

## Batidas

Os ids e os números padrão são os da peça de 05/10 (regra do kit: os padrões são os do vídeo de onde a batida veio). Numa peça nova, mande os ids das suas peças (`peca`, `pilha`, `cartao`, `placas`...) e os seus tempos; todo tempo aceita o `Tempo` do kit (segundos, `{palavra}`, `{fecho}`, `{fim}`, `{desloc}`). Os sons são eventos do perfil v2 (o mix e o `eventos.json` saem deles) e todos estão no catálogo de efeitos; os de carimba, cartao-sai-da-tela, sino-toca, fileira-fora-do-padrao e moeda-pessoa são os do final de 05/10, depois da revisão de áudio. Som novo só com aviso ao Pedro.

| id | o que faz | âncoras | sons padrão (perfil v2) | parâmetros |
|---|---|---|---|---|
| `vitrine-luz` | varredura de luz fria na vitrine fria e na argila | inicio | `sint-s_brilho [dur]` inicio+0,02 -38 | palco, t, dur, ease |
| `vitrine-fio` | fio de luz descendo pelo vão entre as vitrines | inicio | `sint-s_swish [0.13]` inicio -37 | palco, t, dur, ease, some |
| `aceno` | ida e volta curta num eixo de qualquer objeto do kit | inicio | nenhum | alvo, t, eixo, amp, ida, volta |
| `pose-objeto` | objeto do kit vai pra uma pose (valores absolutos ou "+=") | inicio | nenhum | alvo, t, para, dur, ease |
| `palco-luz` | halo coral, brilho do splash no chão e o tom dele | inicio | nenhum | palco, t, para, dur, ease |
| `exibe-objeto` | troca de peças na vitrine fria: o que sai encolhe no pé, o que entra cresce no pé depois | inicio, pouso | `sint-s_whoosh [0.3, 500, 6000]` inicio -34; `sint-s_thump [110, 50, 0.22]` pouso -30 | palco, t, saem, entram, desce, sobe, escalona |
| `carimba` | o carimbo sobe, carimba (t = impacto), achata e volta; as folhas tremem e a marca aparece; com `sai`, o carimbo sobe e encolhe | sobe, impacto, sai | `sint-s_swish [0.24]` sobe -34; `sint-s_thump [150, 60, 0.3]` impacto -22; `mixkit-2995` impacto-0,009 -28 com o recorte do clique forte (receita `truque-2995-clique-forte`) | palco, peca, pilha, t, sobe, desce, achata, mola, tremor, marca, sai |
| `pasta-leva` | a folha de cima da pilha voa pra pasta aberta, as folhas descem, a frente fecha e a pasta sai pela esquerda | inicio, entra, fecha, desliza | `mixkit-1105` entra -30 (sincronia); `sint-s_thump [120, 55, 0.16]` fecha -34; `mixkit-1530` desliza -31 (sincronia) | palco, peca, pilha, t, voa, folhas, fecha, sai |
| `cartao-sai-da-tela` | o cartão (o recorte exato da vaga) descola, voa (compacto só no voo) e pousa na frente do aparelho; com `volta`, volta pra vaga | sai, pousa, volta | `mixkit-3005` sai-0,03 -29 (sincronia); `sint-s_thump [120, 55, 0.25]` pousa -30; `sint-s_pop [900, 420, 0.1, 34]` pousa -31 | palco, cartao, aparelho, sai, pousa, ease, arco, telaVazia, compacta, achata, volta |
| `cartao-contador` | o cartão do imposto acende, o valor conta e o brilho passa no esqueleto do botão | brilho, contador | `sint-s_chime [1975.5, 0.6]` brilho+0,02 -35; `sint-s_conta` contador | palco, cartao, brilho, contador, varreduras, apaga |
| `sino-toca` | o sino salta, balança três vezes e sai | salto, balanco, sai | `sint-s_pop [1300, 700, 0.08, 45]` salto -31; `mixkit-766` balanco -30 (sincronia) | palco, peca, t, salto, balanco, sai |
| `toque-cartao` | o esqueleto vira o botão, pulso no "só", toque e aperto no "paga", empurrão de câmera e o retorno do app (sem verde, sem "pago") | revela, so, toque | `sint-s_tick [2900]` so -38; `mixkit-1109` toque-0,01 -22; `mixkit-2867` toque+0,12 -26 (transpor "trilha") | palco, cartao, palavra, revela, pulso, afunda, toque, verif, anel, camera |
| `fileira-fora-do-padrao` | as placas saem da tela já em fileira; uma salta pra fora | inicio, salto | `sint-s_bubble` inicio -42, +0,03 -43, +0,06 -44; `sint-s_pop [500, 900, 0.12, 30]` salto -28 | palco, placas, sai, salto |
| `peca-move` | movimento secundário de uma peça (deslocamentos sobre o repouso) | inicio | nenhum | palco, peca, t, para, dur, ease |
| `moeda-pessoa` | a moeda sai da tela, gira no ar e pousa; dá um pulinho até a placa, que volta pra fileira com a pílula "Entregue"; brilho com faíscas | rola, pouso, encosta, assenta, brilho | `mixkit-2641` rola -30 (sincronia); `sint-s_thump [120, 55, 0.2]` pouso -32; `sint-s_swish [0.2]` encosta -36; `mixkit-1120` assenta -30 (sincronia); `sint-s_brilho [0.5]` brilho -38 | palco, moeda, placas, placa, faiscas, rola, pousa, giro, encosta, onda, brilho |
| `volta-pra-tela` | placas e moeda voltam pra tela | inicio | `sint-s_swish [0.24]` inicio+0,02 -36 | palco, placas, moeda, t, dur, escalona, ease |
| `funde-vitrines` | o vão fecha, a fria esquenta, as duas viram um painel; aparelho e pasta vêm pro meio | inicio, encosta | `sint-s_whoosh [0.6, 300, 5000]` inicio -30; `sint-s_thump [110, 50, 0.22]` encosta -29 | palco, t, dur, ease, aparelho, pasta |
| `aproxima` | só câmera: aproxima devagar; o riser acaba onde pedir | inicio, riser | `sint-s_riser [0.5, 420, 1250]` riser -32 | t, para, dur, ease, riser |
| `pasta-endireita` | uma peça se endireita no lugar (a pasta em pé ao lado do aparelho) | inicio, pousa | `sint-s_thump [110, 50, 0.18]` pousa -33 | palco, peca, t, para, dur, ease |
| `palco-fecha` | o painel encolhe até o ponto do símbolo do logo e some; as peças pedidas vão presas a ele | inicio | nenhum | palco, t, dur, ease, centro, pecas |
| `vitrine-palco` | volta do loop: as vitrines crescem do centro e todo canal volta pro quadro 0 | inicio, pouso | nenhum | palco, t, cresce, entram, sobe |
| `pilula-comenta` | a pílula coral "Comenta aí" com o balão entra embaixo do logo e sai com ele (camada 2D) | inicio, sai | `pixabay-316482` inicio -28 (sem verificação no catálogo: conferir antes de postar) | camada, t, dur, ease, sai |
| `objeto-canal` | anima um canal próprio de um objeto solto (argila: abre, folhas, tremor, sobe, achata, giro, balanco; GLB: os canais do `conteudo.nos`) | inicio | nenhum | objeto, t, canal, de, para, dur, ease |
| `tela-canal` (05/10) | anima um canal da tela do aparelho que os extras da tela desenham: `brilhoCard` (contorno coral do card do extra `brilhoCard`), `toque` (círculo do extra `toqueCirculo`), `calc` (varredura), `pulso`, `conta`, `luz` | inicio | nenhum | alvo, t, canal, de, para, dur, ease |
| `troca-lado` (05/10) | a câmera desliza pra outra pose (o outro lado), com desfoque de movimento horizontal no pico da velocidade (canal `camera.borrao`, que o KitMotion aplica só no 3D: a legenda fica nítida) | inicio, meio | `sint-s_whoosh ["$dur", 350, 6500]` inicio+0,02 -31 | t, para, dur (0,5), ease (power4.inOut), borrao (26 px) |
| `tela-dividida` (05/10) | duas câmeras num quadro só, separadas por uma linha (canal `divisao`): entra com a linha varrendo da borda (ou já dividida) e sai com a linha varrendo até a borda do lado da câmera 2, enquanto a principal recentraliza (seção "Tela dividida na diagonal") | inicio, entra, sai, fim | `sint-s_whoosh ["$dur", 350, 6500]` entra+0,02 -31; `sint-s_whoosh ["$durSai", 350, 6500]` sai+0,02 -31 | t, dur, ease, ang, px, py, lado, cam2, camera, camera2, sai, margem |
| `divisor-raio` (05/10) | anima a camada `divisor-vs`: o raio desce de cima pra baixo, clarão, estouro de faíscas e o pop do VS no impacto; na saída, o VS some e o raio apaga | inicio, impacto, vs, sai | `sint-s_swish [0.12]` inicio -33; `sint-s_thump [160, 48, 0.36]` impacto -22; `sint-s_burst [12, 0.32]` impacto+0,01 -31; `sint-s_brilho [0.6]` impacto+0,03 -37 | camada, t, raio, clarao, estouro, vs, sai |

A `peca-move` ganhou em 05/10 o `de`, canais gravados no t antes do movimento. Ele serve pra trocar a natureza-morta de um lado enquanto a câmera está no outro (`de {vis: 1, enc: 1}` aparece, `de {vis: 0}` some). Ganhou também as `chaves`: quadros-chave `{canal: valor, dur, ease}` no lugar do `para`, como a queda do sino com `bounce.out` e o carimbo que sobe, vai pro lado e pousa. Com `para` vazio e sem `chaves`, ela não anima nada.

Os parâmetros padrão inteiros e os sons saem do `kit.py batidas`. Cuidados que as batidas já conferem: o carimbo só sai depois do impacto; a pasta não sai antes de fechar (aviso); o pouso do cartão vem depois da saída; a placa salta depois de a fileira assentar (aviso); o cartão sai de um aparelho (erro se o palco não tem).

## Versão 3 da peça de 05/10: espera, CNAE e modelos detalhados (05/10/2026)

Vieram da versão 3 da peça de 05/10 (`KIT/pecas/2026-10-05-tradicional-vs-legalizai-v3/`, cena gerada por `provas/cena-v3.js`, ROTEIRO lá). Sem estes campos, nada muda nas peças que já existem.

- **Calendário de mesa** (peça fria `calendario`): cavalete de argila com as folhas presas nos aros; o canal `vira` passa as folhas por cima, uma por unidade, e o dia da folha da frente sobe (`opcoes.dia`, `opcoes.folhas`). Na peça, quatro folhas viram do 8 ao 12 no "espera pra ser atendido", com o `mixkit-1105` (página) em cada uma. A folha que vira sobe acima do calendário: num close, confira a faixa da legenda (`kit.py colisao`).
- **Ponteiros correndo** (canal `corre` do despertador de argila): `corre` 1 é uma volta do ponteiro dos minutos.
- **Partes de um GLB que animam** (`conteudo.nos` do objeto da cena): `{"<canal>": [{"no": "<nome do nó>", "prop": "rz", "por": -6.2832}]}`. Cada canal (`st.canais[id]`, que a `objeto-canal` anima) soma valor x `por` à pose do arquivo: `rx`, `ry`, `rz` em rad, `x`, `y`, `z` em m no espaço do pai, `sx`, `sy`, `sz` ou `s` multiplicando a escala (1 + valor x `por`). A `objeto-canal` confere se o canal existe. Na peça:
  - o despertador detalhado (`glb-despertador-detalhado`) com `corre` (PonteiroMinutos -6,2832, PonteiroHoras -0,5236, PonteiroSegundos -18,85) e `toca` (Martelo 0,32, com a `objeto-canal` alternando entre 1 e -1 a cada 0,034 s e o `sint-s_ring`);
  - o telefone de disco (`glb-telefone-disco`) com `disca` (Disco -2,5).
  Nomes dos nós no `KIT/modelos/LEIA-ME.md`, seção "Modelos detalhados pra argila".
- **Destacar um card da tela** (`tela-canal`): o extra `{"tipo": "brilhoCard", "regiao": "<região>"}` na tela e a `tela-canal` com `canal: "brilhoCard"`, de 0 a 1 (acende) e de volta (apaga). O toque numa tela sem botão é o extra `toqueCirculo` (região com o centro em x, y) e o canal `toque` de 0 a 1 em uns 0,5 s.
- **Modelo detalhado em vitrine**: entra como objeto solto da cena (não peça do palco), com `"sombra": 0` e o material de argila no `"*"` (`{"cor": "#9AA0A8", "rugosidade": 0.8, "metalico": 0, "envMap": 0.3, "semMapa": true}` na fria). Some e volta pela `pose-objeto` (`vis`), fora de quadro. A prova de colisão trata o objeto inteiro como um corpo (o id dele).

## Tela dividida na diagonal, com o raio e o VS (05/10/2026)

Pedido do Pedro em 05/10: "coloque a tela dividida na diagonal para definir o embate". Duas câmeras num quadro só, separadas por uma linha: a principal (`st.cam`) de um lado e a câmera 2 do outro, cada uma com a vitrine dela (a fria na do Tradicional, a quente na do Legalizaí). Por cima do 3D e por baixo da legenda, o raio na mesma linha e o "VS". Prova e modelo: a peça de teste `KIT/pecas/_teste-divisao/` (a v2 da peça de 05/10 com a abertura refeita; cena gerada por `provas/cena-teste.js`; folhas `provas/folha-divisao.png` e `provas/folha-divisao-detalhes.png`, feitas pelo `provas/folha.py`).

### Como funciona

- **Canal `st.canais.divisao`**: `k` (0 desliga, e o quadro sai exatamente como antes), `ang` (graus), `px` e `py` (um ponto da linha, em px de 1080x1920), `lado` (1 ou -1: de que lado fica a câmera 2) e a câmera 2 (`x`, `y`, `z`, `tx`, `ty`, `tz`, `fov`). Quem anima é a batida `tela-dividida`.
- **A linha** (conta em `RM/src/kit/render/divisao.ts`, a mesma pro 3D, pra camada e pras batidas): o ângulo é medido da horizontal, no sentido anti-horário de quem olha a tela. 90 é vertical; 79,38 é a diagonal "/" de (720, 0) a (360, 1920). `"lado": "direita"` põe a câmera 2 à direita de quem anda na linha de baixo pra cima (numa linha deitada, ângulo 0, embaixo).
- **O render** (`RM/src/kit/render/TelaDividida.tsx`): o Cena3DKit monta o componente só nas composições com a batida `tela-dividida` (fixo por composição, como o borrão da `troca-lado`). Um `useFrame` de prioridade 1 assume o desenho: com `k` 0 ele só chama o mesmo `gl.render(scene, camera)` do R3F. Com a divisão ligada, a câmera 2 (com a mesma deriva de mão da principal) desenha num render target do tamanho do drawing buffer, com MSAA 4x, a principal desenha na tela e um quadro por cima compõe a câmera 2 do lado dela da linha, com 1,5 px de borda suave. O render target leva a marca `isXRRenderTarget` (a dos alvos do WebXR no three) e o formato RGBA8: assim o three aplica o tone mapping e a saída sRGB como na tela, e a mistura das sombras, da vitrine e da poeira sai igual nas duas metades. O papel do kit é preso à câmera: a câmera 2 ganha um papel igual só no passe dela.
- **Vitrines por câmera** (`palco/fabrica.ts`, `porCamera`): os painéis, o halo, o brilho no chão, a luz fria, a varredura, o fio e os planos de recorte da argila fria são refeitos com a câmera que desenha, no `onBeforeRender` da malha das vitrines. O `pinta` continua fazendo a mesma conta com a câmera do estado, porque o mapa de sombra da luz chave (VSM, com `clipShadows`) corta a argila com os planos antes de qualquer malha desenhar, e a prova de colisão lê os planos logo depois do `pinta`; a tela dividida chama a mesma conta antes de cada passe (`userData.kitPorCamera`). A vista é a inversa direta da `matrixWorld` da câmera (a `matrixWorldInverse` do three r186 tira a escala, pelo glTF, e muda o último bit): com a mesma câmera, os números são os do `matrizesCamera`, bit a bit (provado em 20 mil câmeras sorteadas).
- **A camada fica entre o 3D e a legenda**: o componente da `divisor-vs` declara `sobLegenda`, e o KitMotion desenha essas camadas logo depois do canvas. A cena pode trocar com `"sobLegenda": true` ou `false` em qualquer camada. Sem nenhuma camada assim, a árvore do KitMotion é a de antes.

### Batida `tela-dividida`

| parâmetro | padrão | o que é |
|---|---|---|
| `t` | 0 | início da entrada |
| `dur`, `ease` | 0, power3.out | a entrada: a linha varre da borda do lado da câmera 2 até o lugar (a metade dela cresce); com `dur` 0 a tela já está dividida em `t` |
| `ang`, `px`, `py` | 79,38, 540, 960 | a linha (a "/" de (720, 0) a (360, 1920)) |
| `lado` | "direita" | de que lado da linha fica a câmera 2 ("direita" ou "esquerda") |
| `cam2` | {} | a câmera 2 (`x`, `y`, `z`, `tx`, `ty`, `tz`, `fov`); o que faltar vem da câmera inicial da cena |
| `camera` | null | `{para}`: a pose da câmera principal durante a divisão (vai até ela na entrada, com a mesma curva) |
| `camera2` | null | `{desloc, para, dur, ease}`: movimento da câmera 2 durante a divisão (a aproximação lenta; padrão 1,8 s, power1.inOut) |
| `sai` | `{t: {desloc: 4.4}, dur: 0.5, ease: "power3.inOut", camera: null}` | a saída: a linha varre até a borda do lado da câmera 2 e a metade principal toma o quadro; `camera.para` recentraliza a principal no mesmo tempo; no fim, `k` 0. `null` deixa a tela dividida até o fim |
| `margem` | 90 | px além da borda quando a linha está fora do quadro (cobre o brilho do raio) |

Âncoras `inicio`, `entra` (só com `dur` maior que 0), `sai` e `fim`. Sons: `sint-s_whoosh ["$dur", 350, 6500]` entra+0,02 -31 e `sint-s_whoosh ["$durSai", 350, 6500]` sai+0,02 -31.

```json
{ "id": "tela-dividida", "params": {
  "t": 0, "dur": 0, "ang": 79.3803, "px": 540, "py": 960, "lado": "direita",
  "cam2": { "x": 0.06, "y": 0.16, "z": 0.975, "tx": 0.06, "ty": 0.036, "tz": 0, "fov": 30 },
  "camera2": { "desloc": 0, "para": { "z": 0.945 }, "dur": 4.3, "ease": "power1.inOut" },
  "sai": { "t": 4.4, "dur": 0.55, "ease": "power3.inOut",
           "camera": { "para": { "x": -0.1365, "y": 0.135, "z": 0.64, "tx": -0.1365, "ty": 0.02, "tz": 0, "fov": 30 } } } } }
```

Na prova, a câmera principal (a da cena, `"camera"`) fica em `{x: -0.094, y: 0.1, z: 0.85, tx: -0.094, ty: -0.02, fov: 30}`. Entrada com varredura (variante `cenas-entrada.json` da prova): `"t": 0.2, "dur": 0.6, "camera": {"para": {...a pose da divisão...}}`, com a cena começando na câmera de repouso do lado principal.

### Batida `divisor-raio`

| parâmetro | padrão | o que é |
|---|---|---|
| `camada` | "divisor" | o id da camada `divisor-vs` |
| `t` | `{palavra: 2, desloc: -0.05}` | o raio começa a descer (na peça de 05/10, logo antes do "versus") |
| `raio` | `{dur: 0.1, ease: "power1.in"}` | a entrada do raio de cima pra baixo; o impacto é `t + dur` |
| `clarao` | `{sobe: 0.04, desce: 0.5, ease: "power3.out"}` | o clarão no VS, a partir do impacto (`null` desliga) |
| `estouro` | `{dur: 1.1}` | as faíscas do impacto vivem até `dur` (`null` desliga) |
| `vs` | `{desloc: 0, dur: 0.6, ease: "elastic.out(1, 0.5)"}` | o pop do VS com mola curta (passa uns 18% e assenta), a partir do impacto |
| `sai` | `{t: {desloc: 2.5}, dur: 0.5, ease: "power2.in", vs: {dur: 0.16, ease: "back.in(1.7)"}}` | o raio apaga enquanto varre (`sai`), e o VS some no começo da saída, com antecipação (`sai.vs`) |

Âncoras `inicio`, `impacto`, `vs` e `sai`. Sons: `sint-s_swish [0.12]` inicio -33; `sint-s_thump [160, 48, 0.36]` impacto -22; `sint-s_burst [12, 0.32]` impacto+0,01 -31; `sint-s_brilho [0.6]` impacto+0,03 -37 (todos sintetizados, liberados no catálogo).

```json
{ "id": "divisor-raio", "params": { "camada": "divisor", "t": { "palavra": 2, "desloc": -0.05 }, "sai": { "t": 4.4, "dur": 0.5, "ease": "power2.in" } } }
```

### Camada `divisor-vs`

O raio: miolo branco (`miolo`, 5 px) com dois filamentos finos, o brilho coral em três camadas desfocadas (larga, média e o fio coral-600 colado no miolo), o tremor elétrico (ruído com semente pelo quadro, `tremor` em px) e as faíscas (as do impacto e as que pingam da linha acesa: semente, velocidade, arrasto, gravidade, rastro que afina e cor que esfria do branco pro coral). O "VS" senta no ponto da linha mais perto de (`vsX`, `vsY`), em Sora 800, branco, com contorno fino tinta, brilho coral e uma sombra leve. Segue a linha do canal `divisao`; sem a divisão, usa `ang`, `px` e `py` da camada. Nada de neon azul, vermelho ou dourado: só papel, tinta e os corais da marca.

```json
"camadas": [ { "id": "divisor", "tipo": "divisor-vs", "estado": {}, "texto": "VS", "tamanho": 160, "vsX": 540, "vsY": 975, "semente": 7 } ]
```

Parâmetros: `texto` ("VS"), `tamanho` (170), `vsX` e `vsY` (540, 960), `ang`, `px` e `py` (sem a divisão), `semente` (7), `tremor` (2,4), `miolo` (5), `faiscas` (1; 0 desliga as que pingam). Canais: `raio`, `clarao`, `estouro` e `estouroDur`, `vs` e `sai` (a batida `divisor-raio` anima todos).

### Como compor (o que a prova ensinou)

- **Cada assunto no meio da sua metade.** Na "/" de (720, 0) a (360, 1920), a metade da esquerda é larga em cima e estreita embaixo, e a da direita, o contrário. Na prova: a pilha com o carimbo em x uns 235 (o meio da metade naquela altura), o aparelho em x uns 820, com 50 e 110 px de folga até a linha, o VS no meio sem encostar em nenhum dos dois e as bordas das vitrines fora do quadro. As duas câmeras ficaram mais longe que as de repouso (z 0,85 e 0,975); as poses estão no `cena-teste.js` e saíram de uma busca numérica pela projeção do kit (as caixas da argila e do aparelho contra a linha, o VS e as bordas das vitrines).
- **O despertador da capa não cabe**: na frente da pilha, ele fica na parte estreita da metade e cruza a linha em qualquer câmera razoável. Na prova a abertura é a pilha com o carimbo; a pasta cresce no pé no "muda" (`exibe-objeto`).
- **Nada some fora de quadro**: os dois lados estão sempre à vista, então a troca de natureza-morta que a v2 fazia com a câmera do outro lado precisa de uma batida visível.
- **Batida que move a `st.cam` move a câmera principal**: o `gancho-giro-varredura` vai com `"camera": null` (a aproximação da metade do aparelho é o `camera2` da `tela-dividida`).

### Limites

- **A prova de colisão e o `kit.py qc` só olham a câmera principal.** O cruzamento de corpos em 3D não depende de câmera e continua valendo. As faixas (legenda, fecho e link) e o toque aparente são medidos pela câmera principal: o que aparece só na metade da câmera 2 não é conferido, e o que a principal vê atrás da metade da câmera 2 conta como se aparecesse. Na prova, de 0 a 5 s: zero em tudo (o aparelho fica fora do quadro da câmera principal). Confira a metade da câmera 2 nos stills.
- **O `palco-fecha`** prende as peças ao painel pela câmera principal (não é pra usar com a tela dividida ligada).
- **Custo**: dois passes por quadro (e a sombra de contato e o mapa da luz chave em cada um). Nos stills da prova, 1,37 s por quadro com a divisão ligada contra 1,06 s sem ela (quadros 141 e 150); com o raio, as faíscas e o clarão, de 1,4 a 2,1 s.

## Camada `pilula-comenta`

A pílula do fecho do carrossel: fill `#DD4E27`, Sora 800 branca e o ícone de balão em contorno branco antes do texto. Parâmetros: `texto` (padrão "Comenta aí"), `top` (968), `tamanho` (36), `cor`. Canal `k` (0 fora, 1 no lugar). O `LinkBio` do kit só desenha texto; quem usa esta camada tira a `link-bio`.

## Provas (03/10/2026)

- **A peça de 05/10 com este código.** Timeline inteira, quadro a quadro, igual à da extensão original (827 quadros, 295.239 números, 0 diferença) e os 65 eventos de som iguais; `props.json`, `eventos.json` e `qc/quadros.json` refeitos com md5 igual ao da peça; stills de 26 quadros em 11 rodadas: em todos, pelo menos uma rodada sai igual, pixel a pixel, a uma rodada do código original (a variação que sobra, de 1 a 6 níveis em uns 4.000 px do chão embaixo do aparelho e do corpo dele, o código original também tem). Detalhes: `KIT/pecas/2026-10-05-tradicional-vs-legalizai/provas/kit-comum/`.
- **Palco genérico.** A mesma peça com `proc-palco-argila` e as 20 peças declaradas na cena dá a mesma timeline e os mesmos eventos, e os stills caem nas mesmas variantes.
- **Linha de base.** Stills da GuiaPronta (0, 245, 478) e da AberturaMes (0, 60, 150, 300, 450) com as 4 extensões no bundle iguais, pixel a pixel, à linha de base do K06.
- **Objetos soltos.** Os 11 itens `proc-argila-*` no KitProvaModelo (`KIT/provas/modelos/render/argila-01.jpg`, caixa medida igual à do catálogo, 0,00 mm) e no KitMotion com a luz do carrossel (`argila-luz-carrossel.jpg`).
- `npx tsc --noEmit -p src/kit/tsconfig.json`: zero erro.
- **Tela dividida (05/10/2026).** Com a divisão desligada nada muda: `props.json` e `eventos.json` da v1 e da v2 da peça de 05/10 refeitos (numa cópia com o mesmo nome de pasta) com o md5 de antes; stills A/B (o mesmo código, com e sem a tela dividida, em duas cópias congeladas do `src`, 3 rodadas de cada) da v2 e da v1 (quadros 0, 300, 480 e 700), da guia pelo KitMotion (0, 245 e 478), da prova 2D (650, 780, 900 e 990), da GuiaPronta e da AberturaMes: os 23 stills com uma variante igual, pixel a pixel, dos dois lados (a variação que sobra entre rodadas é a de sempre: 1 nível, em até 1.270 px do chão, nos quadros 480 e 700), e a GuiaPronta e a AberturaMes iguais à linha de base. A conta das vitrines pela câmera que desenha bate com a do `matrizesCamera` bit a bit em 20 mil câmeras sorteadas. A peça `KIT/pecas/_teste-divisao/` é a prova visual (folhas em `provas/`).

## Conferir depois de mexer

A peça de 05/10 depende deste código: qualquer mudança aqui muda o vídeo dela.

1. `npx tsc --noEmit -p src/kit/tsconfig.json` (cwd `RM`): zero erro.
2. `kit.py batidas`: a extensão "comum" ligada, com as 27 batidas, e nenhum aviso de nome repetido.
3. A peça de 05/10: `kit.py props`, `kit.py eventos` e `kit.py qc` numa cópia da pasta (caminho absoluto), com md5 igual ao da peça; e stills dos quadros de `provas/kit-comum/` contra as variantes registradas lá.
4. Os stills da `GuiaPronta` e da `AberturaMes` contra a linha de base (`KIT/provas/render/linha-de-base/`).
5. Zero U+2014, U+2013 e os outros traços longos nesta pasta.
