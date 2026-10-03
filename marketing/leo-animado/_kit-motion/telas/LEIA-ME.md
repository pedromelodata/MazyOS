# telas: telas do app por receita (pacote K04)

O `monta.py` monta as telas que vão na tela do celular 3D (e em cartela ou slide) a partir das capturas do app, por uma receita JSON. Ele generaliza o `GP/monta_telas.py` de 02/10 11:30 com a mesma semântica, passo a passo: as 4 telas do reel da guia (14/10) saem iguais pixel a pixel, e até byte a byte, às de `GP/assets/telas/`. Contrato: `KIT/DESENHO.md`, seções 4.8, 4.12 e 9.

## O que tem aqui

| caminho | o que é |
|---|---|
| `monta.py` | monta as telas pelas receitas, grava as PNG, o `regioes.json` e as folhas de conferência |
| `testa_guia.py` | a prova do K04: refaz as 4 telas do guia em memória e confere contra o GP, o REF e as constantes (não grava nada) |
| `receitas/guia-*.json` | as 4 telas do guia, conjunto 2026-10-02, fundo #FFFFFF (as que valem) |
| `receitas/guia-v3-*.json` | as mesmas telas na versão de 01/10 (conjunto antigo, papel): só histórico |
| `receitas/_modelo.json` | modelo comentado pra receita nova |
| `receitas/rascunhos/` | rascunhos das peças de outubro (09, 23 e 30/10), com as folhas em `qa/` |

## Como rodar

Sempre no venv do corte-viral e sempre com `-B` (nada de `__pycache__`):

```
PY=C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe
$PY -B KIT/telas/monta.py <receita.json | pasta de receitas> [...] --saida <pasta> [--qa] [--anota] [--compara <pasta>]... [--forca] [--publico ME|MEI|todos|ambos|vazio]
$PY -B KIT/telas/testa_guia.py
```

- `--publico`: o `fatos.publico` da cena (o `kit.py telas` passa sozinho, e passa `vazio` quando a cena não declarou). Fora do `ME` (com `MEI`, `todos`, o antigo `ambos` ou `vazio`: F063 por padrão, rodada 4, 03/10), receita de captura com `servePecaMei` diferente de true é recusada (tela que mostra valor de guia ou que é só de ME). Sem `--publico` (o `monta.py` rodado à mão, como no `testa_guia.py`), o público não é conferido aqui; o `kit.py props` confere de novo.
- Catálogo (antes de montar, e nada é gravado se uma receita cair): a captura de cada receita é achada no catálogo de telas pelo conjunto e pelo nome do arquivo. Captura fora do catálogo (desde a rodada 4, em qualquer peça: tela sem origem não entra) e captura `reprovado` são recusadas (código 2). Captura `aceito-com-risco`: se a área que fica visível na tela final (as colas, a barra de abas e o recorte, menos o que o preparo apaga) cobre um bloco de 4x4 px de um corte com regra (P.. ou F..), sai um aviso com o corte e a regra; conserto: apagar ou cortar o trecho. Captura fora do catálogo vira aviso (em peça de MEI, erro).

- `--saida`: pasta das PNG, do `regioes.json` e do `qa.jpg`. O `monta.py` recusa `GP/`, `RM/public-guia/` e todo caminho protegido da seção 13 do DESENHO.
- `--qa`: grava `<saida>/qa.jpg`, as telas lado a lado em 1/3 (fundo cinza, 10 px entre elas), como a folha do `monta_telas.py`.
- `--anota`: grava `<saida>/<tela>.anota.jpg` com a captura e as caixas da receita (preparo em vermelho, colas em verde com o y de destino, recorte em azul) ao lado da tela pronta, com as regiões numeradas e a legenda. É a folha pra conferir uma receita nova.
- `--compara <pasta>`: confere cada PNG montada contra a de mesmo nome na pasta (numpy, as duas abertas em RGB). Pode repetir. Sai com código 1 se alguma diferir ou faltar.
- `--forca`: grava por cima de PNG que virou hardlink. Só com ordem explícita (ver "Escrita segura").
- Pasta de receitas: entram os `*.json` que não começam com `_` (o `_modelo.json` fica fora), na ordem do campo `ordem` e depois do nome. Duas receitas com a mesma `saida` na mesma rodada dão erro.
- Códigos de saída: 0 tudo certo; 1 comparação diferente ou faltando; 2 receita inválida, uso errado ou escrita recusada.

Exemplo, as telas do guia de novo na pasta da peça, conferidas contra o GP e o REF:

```
$PY -B KIT/telas/monta.py KIT/pecas/guia-pronta-2026-10-14/telas/receitas --saida KIT/pecas/guia-pronta-2026-10-14/telas --qa \
    --compara "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14/assets/telas" \
    --compara KIT/pecas/guia-pronta-2026-10-14/_referencia
```

## O que o monta.py faz, em ordem

1. Abre a captura (`fonte.conjunto` + `fonte.arquivo`) e converte pra RGB. Recusa a página 404 da captura (md5 `e26d634e3f17067c83748e0ad7ec4d84`), a captura fora do catálogo, a reprovada e, fora do `--publico ME`, a que não serve MEI.
2. Aplica o `preparo` numa cópia da fonte, em ordem, nas coordenadas da captura.
3. Modo `composta` (o padrão): cria a tela nova com `tamanho` e `fundo`; desenha a `barraStatus`; cola as faixas da fonte preparada (`cola`); cola a `barraAbas`, tirada da fonte SEM preparo. Modo `inteira`: a tela é a própria fonte preparada (como a splash), sem tela nova, barra de status, colas nem abas.
4. Aplica o `recorte`, se houver.
5. Calcula as regiões e grava a PNG, o `regioes.json` (todas as receitas da rodada) e, com `--qa`, o `qa.jpg`.

## Semântica das caixas

Toda caixa é `[x0, y0, x1, y1]` em px. Igual ao `monta_telas.py`:

| onde | vai pra | o fim (x1, y1) |
|---|---|---|
| `preparo` (`retangulo`, `esqueleto`, `apaga`) | `ImageDraw` direto, na cópia da fonte | **entra** no desenho |
| `cola.caixa` | `Image.crop` da fonte preparada, colada em `(caixa.x0, y)` (ou `(x, y)` se a cola tiver `x`) | fica **fora** |
| `recorte` | `Image.crop` da tela montada (no modo `inteira`, da fonte preparada) | fica **fora** |
| `barraAbas.pilula` e `.botao` | `Image.crop` da fonte sem preparo, com máscara arredondada | fica **fora** |

Uma faixa que não está em nenhuma cola fica fora da tela: é assim que se corta um bloco. Pra tirar um bloco do meio e subir o de baixo, cole o de baixo num `y` menor (no Início do guia, o card sai de `[0, 548, 1290, 1042]` e vai pra `y 420`, no lugar do card da empresa).

A barra de status é desenhada antes das colas, numa faixa de 132 px (`faixa`): por isso o conteúdo do topo desce 132 px (`'Início'` sai de y 70 e vai pra 202). Cola que começa dentro da faixa dá aviso.

## Campos da receita

| campo | obrigatório | o que é |
|---|---|---|
| `saida` | sim | nome do `.png` (só o nome) |
| `fonte` | sim | `{"conjunto": "2026-10-02" ou "2026-09", "arquivo": "<captura>.png"}` |
| `modo` | não | `"composta"` (padrão) ou `"inteira"` |
| `fundo` | no modo composta | `#FFFFFF` no conjunto 2026-10-02, `#FAF8F5` no 2026-09 (fundo diferente do conjunto dá aviso) |
| `tamanho` | não | tela nova, padrão `[1290, 2796]` (a tela do iPhone 3D do kit) |
| `barraStatus` | não | `{"hora": "9:41", "faixa": 132, "cor": "#1B1E24"}`: hora em Sora 600 50 px em (132, 58), sinal em x 1000 a 1055, wi-fi centrado em (1105, 74), bateria em x 1150 a 1231, y 42 a 76, sem marca |
| `preparo` | não | lista de passos (abaixo) |
| `cola` | não | `[{"caixa": [...], "y": <destino>, "x"?: <destino>}]` |
| `barraAbas` | não | `{"dy": 0, "fonte": "sem-preparo"}`: pílula x 48 a 1243, y 2574 a 2764, raio 95, sombra 22; botão NF-e x 553 a 738, y 2484 a 2671, raio 46, sombra 18. `"fonte": "preparada"` usa a cópia preparada; `pilula` e `botao` trocam as caixas |
| `recorte` | não | `[x0, y0, x1, y1]` pra tela parcial |
| `regioes` | não | `{nome: região}` (abaixo) |
| `cortes` | não (pede-se) | `[{"caixa", "motivo", "regra"}]`: o que ficou fora e por quê |
| `ordem`, `id`, `status`, `historico`, `nota`, `notas`, `motivo`, `peca`, `origem`, `medidas` | não | registro; o `monta.py` não usa (só `ordem`, pra ordenar a pasta, e `historico`, pra avisar) |

Chave que começa com `_` é comentário em qualquer nível (`_ajuda`, `_alternativas`); item de lista que só tem comentário some.

## Passos do preparo

| passo | campos | o que faz |
|---|---|---|
| `retangulo` | `caixa`, `cor` | retângulo cheio (`ImageDraw.rectangle`) |
| `esqueleto` | `caixa`, `cor`, `raio` (sem raio vira pílula) | retângulo arredondado (`rounded_rectangle`): o esqueleto de carregamento no lugar do que não pode aparecer |
| `apaga` | `caixa`, `amostra: [x, y]` | retângulo na cor lida no ponto `amostra` da cópia em preparo, no estado daquele passo (use um ponto do fundo perto da caixa) |
| `texto` | `xy`, `texto`, `peso` (100 a 800), `tamanho` (px), `cor`, `ancora` (padrão `la`) | texto na Sora variável (`%LOCALAPPDATA%/Microsoft/Windows/Fonts/Sora-wght.ttf` com `set_variation_by_axes([peso])`). O `monta.py` recusa travessão e meia-risca |

Cor sempre em `"#RRGGBB"`. Cores que já deram certo: tint do card `#FEF3EE`; esqueleto sobre o tint `#F7E4DC` (o do guia); esqueleto sobre branco ou papel `#F1EEE9` (ink-100), sempre depois de um `apaga` um pouco maior que o texto, pra ponta de letra nenhuma sobrar nos cantos arredondados.

## Regiões e regioes.json

As regiões são o que as batidas e os extras da cena usam (`brilhoCard`, `contador`, `varredura`, `botao`, `toqueCirculo`). Cada região tem `x`, `y` e, se for caixa, `w`, `h` e `r`; texto leva `fonte` (CSS, ex. `"600 59px Sora"`) e `cor`. O campo `sistema` é obrigatório:

- `"fonte"`: px da captura. A região vai pela cola que a contém inteira (a última colada vence; a barra de abas conta como cola) e depois pelo recorte: `y_final = y - caixa.y0 + y_destino - recorte.y0` (o mesmo vale pro x). No modo `inteira` só o recorte desloca. Região de `"fonte"` fora de toda cola é erro.
- `"destino"`: px da tela final (depois do recorte). Passa direto.

O `regioes.json` junta as regiões de todas as receitas da rodada, já no sistema da tela final: `{ "<nome>": {x, y, w?, h?, r?, fonte?, cor?} }`, o tipo `Regiao` do K02 (`RM/src/kit/nucleo/tipos.ts`). `sistema`, `desc`, `nota`, `medido` e `centroReal` ficam só na receita. Mesmo nome em duas receitas da mesma rodada só com o mesmo valor (o `card` do guia aparece no Início e no Início pagar); valor diferente é erro. Em peça com várias telas, use prefixo no nome (`emitirCampoValor`, `transfPassoAtual`).

Convenção de `w` e `h` do esqueleto, herdada do guia: `w = x1 - x0` e `h = y1 - y0` da caixa do preparo (o `[123, 867, 512, 986]` do guia vira `{x 123, y 739, w 389, h 119}`).

## Regras de conteúdo

- **Sem desfoque.** O Pedro vetou o desfoque em 01/10. O que não pode aparecer vira esqueleto, é apagado ou fica fora da cola ou do recorte. O único `GaussianBlur` do `monta.py` é a sombra da barra de abas, copiada do original pra a tela sair igual; ela não esconde conteúdo.
- **Corte por regra P e F.** Cada bloco que sai entra em `cortes` com a regra do `BASE/PROIBIDO.md` (P..) ou do `BASE/FATOS.md` (F..), ou `null` quando é só enquadramento. Os que mais aparecem: promessa de avisar ou "segue sozinho" (P12); WhatsApp e link fora dos três (F009, P11); faturamento e alíquota (P13, P14, P04, P15); travessão na tela (P26); nome de sistema do governo cru (F143, P24); prazo e contador antigo na troca (F142); cidade em peça de MEI (F027).
- **Valor de exemplo aparece nítido.** Os valores da empresa fictícia do protótipo (R$ 178,31, "Bom te ver, Ana") são de exemplo e o Pedro liberou nítidos em 01/10 (memória `feedback-valores-ficticios-nitidos`). Um valor que aparece pode ganhar motion (o contador do guia).
- **Valor real de DAS do MEI nunca aparece** (F063): nem na tela, nem na fala, nem na legenda. Tela de exemplo de MEI que mostre a guia do MEI: perguntar antes. Peça de MEI só usa captura com `servePecaMei` true: as telas do guia (Início, Início com o pagar e Imposto do mês) mostram o valor de exemplo da guia e o kit recusa (`monta.py --publico MEI`, `montaProps` e `kit.py fatos`).
- **Não é o app Flutter.** As capturas dos dois conjuntos (2026-09 e 2026-10-02) são do protótipo Next.js do repo Legalizei, não do app de verdade (Flutter desde 14/09). Chamar de "tela real" ou "prévia real" depende do Pedro.
- Sem selo APP EM CONSTRUÇÃO (vetado em 01/10). Zero travessão, inclusive em texto novo. Texto novo só com fato do `BASE/FATOS.md`, e tela nenhuma ensina a fazer sozinho (portal, gov.br, emissor): o caminho é sempre o app.

## Conjuntos de capturas

| conjunto | pasta | fundo | uso |
|---|---|---|---|
| `2026-10-02` | `marketing/telas-app-2026-10-02` | #FFFFFF | o atual: 88 rotas do protótipo no repo Legalizei @ab68dbc, capturadas em 02/10 |
| `2026-09` | `marketing/telas-app` | #FAF8F5 (papel) | antes de 29/08: só histórico (marque `"historico": true`) |

No conjunto 2026-10-02, nove capturas são a mesma página 404 do servidor (md5 `e26d634e3f17067c83748e0ad7ec4d84`): `contrato`, `mei_saida_ja-tem-cnpj`, `mei_saida_servidor`, `painel`, `saida_exterior`, `saida_fora-bh`, `saida_socio-pj`, `saida_socios` e `termo`. O `monta.py` recusa essas. Antes de usar uma captura, confira por miniatura (nunca abra dezenas de PNG em tamanho cheio).

Medidas do inventário antigo (Anexo A.4 do DESENHO) valem pro conjunto antigo. No novo, meça de novo: o Início, o Emitir e os botões do Imposto do mês não mudaram de lugar; o cabeçalho do Imposto do mês desceu 18 px e o conteúdo 36 px; a linha do tempo da transferência desceu 72 px.

## As telas do guia (14/10)

| receita | fonte | preparo | colas | abas |
|---|---|---|---|---|
| `guia-splash.json` | `splash.png` | nenhum | modo inteira | não |
| `guia-inicio.json` | `inicio.png` | retângulos `[118,752,420,828]` e `[112,858,526,996]` #FEF3EE; esqueleto `[123,867,512,986]` raio 28 #F7E4DC | `[0,70,1290,116]` em 202; `[0,178,1290,264]` em 310; `[0,548,1290,1042]` em 420 | `dy 0` |
| `guia-inicio-pagar.json` | `inicio.png` | nenhum | as mesmas | `dy 0` |
| `guia-imposto.json` | `impostos_pagar.png` | nenhum | `[0,106,1290,159]` em 238; `[0,236,1290,336]` em 368; `[0,2428,1290,2756]` em 2428 | não |

Todas no conjunto 2026-10-02, fundo #FFFFFF, barra de status em todas menos a splash. Saem iguais pixel a pixel às de `GP/assets/telas/` e às cópias do REF, com o mesmo md5 (o `testa_guia.py` prova). As regiões dão exatamente: `card {72, 424, 1146, 486, r 46}`, `valor {x 125, y 682, "600 59px Sora", #1B1E24}`, `esqueleto` e `botaoPagar {123, 739, 389, 119, r 28}` e `botaoVer {x 270, y 2676}`.

O `botaoVer` é o valor legado do `tela.ts` e fica assim pra a regressão sair igual ao V4. O centro real do botão "Ver a guia", medido em 02/10 nos dois conjuntos, é **(352; 2675,5)** (botão em x 72 a 632, y 2604 a 2747); está anotado como `centroReal` na `guia-imposto.json`. Em receita nova, use o centro real.

As `guia-v3-*.json` são a versão de 01/10 (conjunto 2026-09, fundo #FAF8F5; no Imposto, `[0,88,1290,141]` em 220 e `[0,200,1290,300]` em 332), com `"historico": true` e a nota "não testável: as montadas antigas foram regravadas em 02/10 às 11:30". Indício de que estão certas: elas dão exatamente os tamanhos em bytes que o inventário de 01/10 registrou pras montadas antigas (28.967, 93.140, 108.805 e 51.187).

## Rascunhos de outubro

Em `receitas/rascunhos/`, cada um com `status` "rascunho, aguardando aprovação do Pedro", o conjunto usado e o motivo (`motivo`), e a folha anotada em `rascunhos/qa/`:

| rascunho | peça | conjunto | saída |
|---|---|---|---|
| `painel-linha-do-tempo-0910.json` | 09/10, "O sufoco burocrático" | 2026-09 (a `/painel` deu 404 no novo): "conjunto antigo, fundo papel: só histórico, refazer quando houver captura" | recorte x 60 a 1230, y 1110 a 1575 (1170x465); linha azul vira esqueleto |
| `transferencia-2310.json` | 23/10, "Contador sumiu?", slide 3 | 2026-10-02 | recorte y 1312 a 1902 (o y 1240 a 1830 antigo, mais 72 px); "Atualizando no Redesim" e a linha azul viram esqueleto; linha vertical fechada nas pontas |
| `emitir-3010.json` | 30/10, Emissor Nacional (MEI) | 2026-10-02 | tela cheia: título, três primeiras bolhas e o campo de valor; bolhas com nome apagadas; "Repetir última nota", data e "O serviço" fora |

A `emitir.png` é da ME de exemplo: falta uma captura da emissão no modo MEI.

## Escrita segura

- Tudo é gravado pelo `KIT/lib/escrita.py` (temporário na mesma pasta e `os.replace`).
- Arquivo que já existe com os mesmos bytes não é regravado ("igual, mantido"). Assim, rodar de novo não quebra o hardlink que o `kit.py telas` faz em `RM/public-kit/pecas/<peca>/telas/`.
- Se o conteúdo mudou e a PNG já é hardlink (st_nlink > 1), o `escrita.py` recusa. Com `--forca`, o `os.replace` troca só a entrada da pasta de saída: o outro nome (no public-kit) fica com o conteúdo antigo e precisa ser religado. Só com ordem explícita.
- `GP/assets/telas/` é hardlink de `RM/public-guia/telas/`: pode ler, nunca gravar. O `monta.py` recusa as duas pastas como saída.

## Pra quem integra (K07, K12)

- `kit.py telas <peca>`: `python -B KIT/telas/monta.py KIT/pecas/<peca>/telas/receitas --saida KIT/pecas/<peca>/telas --qa`, e depois liga as PNG em `RM/public-kit/pecas/<peca>/telas/`.
- Uso como módulo: `monta.monta_receitas(entradas, saida, qa=False, anota=False, comparas=(), forca=False, grava=True)` devolve `{telas, regioes, falhas, receitas}`; com `grava=False` só monta e compara, sem tocar no disco (é o que o `testa_guia.py` faz).
- A pasta do guia (`KIT/pecas/guia-pronta-2026-10-14/telas/`) tem as 4 PNG, `receitas/` (cópia das 4 receitas do guia), `regioes.json` e `qa.jpg`.
