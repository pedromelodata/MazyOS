# Extensão "comum" do kit de motion (`RM/src/kit/ext/comum/`)

O que serve pra qualquer peça e veio da peça de 05/10/2026 ("Contabilidade tradicional vs Legalizaí"): o palco de argila (vitrines, luz do carrossel, peças de argila, cartões que saem da tela, fileira de placas, moeda, sino), 23 batidas, a camada 2D "pilula-comenta" e os objetos de argila do carrossel de 05/10 soltos na cena. Contrato: `KIT/DESENHO.md`, seções 4.3 e 4.10. Levada pro kit em 03/10/2026; a peça de 05/10 continua renderizando com este código (provas no fim).

Os objetos de argila são os do carrossel (`RM/src/carrossel-2026-10-05/objetos/`), só importados por `objetos/argila.ts`: o carrossel não muda.

| arquivo | o que é |
|---|---|
| `batidas.ts` | as 23 batidas (puras: sem React, sem DOM, sem Remotion) e os metadados da camada `pilula-comenta` |
| `render.tsx` | os objetos `palco-argila` e `argila` e a camada `pilula-comenta` |
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
- **Tipos frios:** `pilha` (`macos`, `semente`, `voaPara` = id da pasta que recebe a folha de cima, `marca` = a marca do carimbo nessa folha), `carimbo`, `pasta` (`folhas`, `docFrente` = a folha "Contrato social", `abreRad`), `despertador` (`tamanho`, `segundos`), `envelope`, `envelope-aberto`, `lupa` (`pivo` = o ponto que fica parado na troca, na lupa a ponta do cabo `[0, -0.094, 0]`), `caneta`, `prancheta`.
- **Tipos quentes:** `cartao-app` e `cartao-imposto` (o recorte exato da vaga da tela: `tela`, `regiao {x, y, w, h}` em px da tela montada, `raio`, `raioBaixo`, `compacto` e `raioCompacto` (a largura do voo), `corCorpo`, `borda`, `bordaSo` ("voo" ou "sempre"), `pouso {px, py, z, larguraPx}` em px da câmera de repouso; no do imposto, `valor` (o número que o contador conta, declarado em `fatos.exemplos`; numa peça conferida como MEI, com público MEI, todos ou vazio, o cartão do imposto com valor é recusado pelo F063, inclusive o das peças padrão de um tipo de palco, como o `palco-tvl`), `rotulo`, `retorno`, `corBotao` e, quando a tela não é a de 05/10, `valorEm {x, y, fonte, cor}`, `botaoEm {x, y, w, h, r}` e `fundoCard`), `placa` (`ordem` na fileira, `entregue` = a pílula "Entregue", `u` e `v` = de onde sai na tela), `moeda` (`pouso {px, py, z}`, `origem {u, v}` na tela), `sino` (`pouso {px, py, z}`), `faisca` (`cor`, `desloc`, `tamanho`; segue a moeda).
- **Canais** (`st.canais`): `palco` (`fusao`, `aquece`, `escala`, `ex`, `ey`, `alfa`, `halo`, `brilho`, `brilhoNeutro`, `varre`, `varreI`, `fio`, `fioA`) e `p:<peça>` (`x`, `y`, `z`, `rx`, `ry`, `rz` sobre a pose de repouso, `s`, `sy`, `vis`, `enc`, `painel`, `alfa` e os do tipo: pilha `tremor`, `marca`, `voa`; carimbo `sobe`, `achata`; pasta `folhas`, `abre`; cartões `prende`, `arco`, `achata`, `larg` e, no do imposto, `brilho`, `conta`, `calc`, `mostraValor`, `revela`, `brilhoBotao`, `pulso`, `toque`, `verif`, `anel`, `afunda`; placa `prende`, `salto`, `entregue`; moeda `k`, `giro`, `brilho`; faísca `k`).

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
| `objeto-canal` | anima um canal próprio de um objeto solto (argila: abre, folhas, tremor, sobe, achata, giro, balanco) | inicio | nenhum | objeto, t, canal, de, para, dur, ease |

Os parâmetros padrão inteiros e os sons saem do `kit.py batidas`. Cuidados que as batidas já conferem: o carimbo só sai depois do impacto; a pasta não sai antes de fechar (aviso); o pouso do cartão vem depois da saída; a placa salta depois de a fileira assentar (aviso); o cartão sai de um aparelho (erro se o palco não tem).

## Camada `pilula-comenta`

A pílula do fecho do carrossel: fill `#DD4E27`, Sora 800 branca e o ícone de balão em contorno branco antes do texto. Parâmetros: `texto` (padrão "Comenta aí"), `top` (968), `tamanho` (36), `cor`. Canal `k` (0 fora, 1 no lugar). O `LinkBio` do kit só desenha texto; quem usa esta camada tira a `link-bio`.

## Provas (03/10/2026)

- **A peça de 05/10 com este código.** Timeline inteira, quadro a quadro, igual à da extensão original (827 quadros, 295.239 números, 0 diferença) e os 65 eventos de som iguais; `props.json`, `eventos.json` e `qc/quadros.json` refeitos com md5 igual ao da peça; stills de 26 quadros em 11 rodadas: em todos, pelo menos uma rodada sai igual, pixel a pixel, a uma rodada do código original (a variação que sobra, de 1 a 6 níveis em uns 4.000 px do chão embaixo do aparelho e do corpo dele, o código original também tem). Detalhes: `KIT/pecas/2026-10-05-tradicional-vs-legalizai/provas/kit-comum/`.
- **Palco genérico.** A mesma peça com `proc-palco-argila` e as 20 peças declaradas na cena dá a mesma timeline e os mesmos eventos, e os stills caem nas mesmas variantes.
- **Linha de base.** Stills da GuiaPronta (0, 245, 478) e da AberturaMes (0, 60, 150, 300, 450) com as 4 extensões no bundle iguais, pixel a pixel, à linha de base do K06.
- **Objetos soltos.** Os 11 itens `proc-argila-*` no KitProvaModelo (`KIT/provas/modelos/render/argila-01.jpg`, caixa medida igual à do catálogo, 0,00 mm) e no KitMotion com a luz do carrossel (`argila-luz-carrossel.jpg`).
- `npx tsc --noEmit -p src/kit/tsconfig.json`: zero erro.

## Conferir depois de mexer

A peça de 05/10 depende deste código: qualquer mudança aqui muda o vídeo dela.

1. `npx tsc --noEmit -p src/kit/tsconfig.json` (cwd `RM`): zero erro.
2. `kit.py batidas`: a extensão "comum" ligada, com as 23 batidas, e nenhum aviso de nome repetido.
3. A peça de 05/10: `kit.py props`, `kit.py eventos` e `kit.py qc` numa cópia da pasta (caminho absoluto), com md5 igual ao da peça; e stills dos quadros de `provas/kit-comum/` contra as variantes registradas lá.
4. Os stills da `GuiaPronta` e da `AberturaMes` contra a linha de base (`KIT/provas/render/linha-de-base/`).
5. Zero U+2014, U+2013 e os outros traços longos nesta pasta.
