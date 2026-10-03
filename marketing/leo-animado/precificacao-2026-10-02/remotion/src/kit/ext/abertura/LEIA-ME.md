# Extensão "abertura" do kit de motion (`RM/src/kit/ext/abertura/`)

Dono: K10. Contrato: `KIT/DESENHO.md`, seções 1 (decisões 7, 10 e 15), 4.3, 4.10 e 5 ("Família 2D da abertura"). A família de
movimento da peça "Abertura do mês" (01/10) virou batidas e camadas do kit, sem mexer no núcleo e sem editar `src/abertura`
(só importa de lá). Os números padrão de cada batida são os do `RM/src/abertura/Abertura.tsx` (linhas 53 a 175) e os sons são
os do `AB/mix_abertura.py`, nos mesmos instantes relativos (perfil v2).

| arquivo | o que é |
|---|---|
| `batidas.ts` | as 11 batidas 2D (puras: sem React, sem DOM, sem Remotion, sem SplitText) e os metadados das 6 camadas |
| `render.tsx` | as camadas `texto`, `imagem`, `selo`, `marcaTexto`, `pecas` e `cta`, e o objeto `calendario-clay` |

Não há `midia.json` nem mídia própria em `RM/public-kit/ext/abertura/`: as camadas são vetoriais e as imagens vêm do public
(`src`). Os 15 mapas do calendário clay ficam na RAIZ do `RM/public-kit` (`clay-{beige,coral,cream}_{albedo,ao,height,normal,roughness}.png`,
hardlinks do `RM/public-abertura/`), com os nomes planos que a fábrica gerada pede.

## Como funciona

- Cada camada declara o que mostra na cena (`props.camadas`); o estado do quadro mora em `st.canais[id]`. As batidas animam esses
  números na timeline mestre do kit; o `render.tsx` só lê. Nada é medido no DOM: o texto vem em linhas explícitas.
- As camadas são desenhadas por cima da cena 3D, da legenda e do fecho, na ordem de `camadas` da cena.
- O "palco" da abertura (o `.stage`, com origem em 50% 58%) é o canal `st.canais.palco = {s, x, y}`. O `soco` e a tremida do
  `carimbo` animam esse canal; as camadas `imagem`, `selo` e `pecas` e o objeto `calendario-clay` seguem o palco (a camada pode
  desligar com `"palco": false`); `texto` e `cta` ficam fora, como na abertura. O id `palco` é reservado.
- Entrada de camada usa `fromTo` com render imediato (como os `fromTo` da abertura): antes do instante, a camada já está no
  "de" (escondida). Saída e visibilidade usam `set` e `to`, que voltam certo quando o quadro anda pra trás.
- Nada de efeito colateral no import: nenhuma ease nova, nada de `gsap.defaults`, e o gancho `globalThis.__img2threeTexLoad`
  NUNCA é trocado. O `render.tsx` só importa o `src/abertura/img2three.ts` (o mesmo módulo da Abertura) e, ao criar o
  calendário, faz `setImg2ThreeRerender(() => advance(performance.now()))`, como o `Calendar3D.tsx`, pra textura não sair preta.

## Camadas

| tipo | parâmetros (padrão) | canais (`st.canais[id]`) |
|---|---|---|
| `texto` | `linhas` (lista de linhas; `*palavra*` ou `*duas palavras*` saem na cor de destaque), `top` 205, `altura` 420, `esquerda` 70, `largura` 940, `tamanho` 100, `peso` 800, `cor` #1B1E24, `corDestaque` #DD4E27, `entrelinha` 1,04, `espacamento` -0,035em | `vis` (padrão 1), `w<i>` entrada da palavra i (1 no lugar), `l<j>` saída da linha j (0 no lugar) |
| `imagem` | `src` (caminho no public), `x` 540, `y` 960 (centro), `largura` 520, `sombra` true, `origemAchata` "50% 100%", `palco` true | `op`, `x`, `y` (px), `s`, `rot` (graus), `sx`, `sy` |
| `selo` | `x` 540, `y` 1100 (centro), `tamanho` 175, `icone` "check" (ou "simbolo", o símbolo da marca, ou null), `src` (imagem no lugar do vetor), `cor` #F2643C, `corAro` #DD4E27, `palco` true | os da imagem, mais `sombraOp`, `sombraS`, `anel`, `anelVis` |
| `marcaTexto` | `texto` (id da camada texto), `palavra` (índice na camada), `ate` (última palavra, na mesma linha), `cor` #F2643C, `espessura` 9, `opacidade` 0,85 | `p` (traço de 0 a 1) |
| `pecas` | `x` 540, `y` 870, `n` 10, `raio` [120, 55], `subida` 30, `giro` 160, `cores` (coral, coral-200, coral-600, areia), `palco` true | `vis`, `v` (voo), `f` (sumiço), `cx`, `cy` |
| `cta` | `texto`, `x` 540, `y` 1450 (topo), `largura` 600, `tamanho` 40, `icone` "comentario" (ou null) | `op`, `x`, `y`, `s` |

O `marcaTexto` é desenhado pela camada `texto`, ATRÁS das palavras e dentro da caixa delas: o traço nunca fica antes da palavra
na mesma linha (zero travessão visual). As palavras contam a partir de 0 na camada inteira (linha 1 e depois linha 2).

## Batidas

| id | o que faz | parâmetros principais (padrão da abertura) | âncoras e sons (perfil v2) |
|---|---|---|---|
| `texto-entra` | palavras sobem da máscara da linha | `camada`, `t` 3,1, `dur` 0,42, `ease` lgEntra, `intervalo` 0,055, `yPercent` 115, `rotacao` 4, `aparece` -0,01 | nenhum |
| `texto-sai` | linhas sobem e somem com desfoque | `camada`, `t` 2,72, `dur` 0,24, `ease` lgSai, `intervalo` 0,03 | `sint-s_whoosh [0.3, 500, 6000]` inicio-0,04 -32 |
| `soco` | o palco cresce 1 + amt e volta com mola | `palco`, `t` 1,0, `amt` 0,018, `sobe` 0,07 power2.out, `volta` 0,45 elastic.out(1, 0.45) | nenhum |
| `estouro` | dez peças em leque que somem | `camada` (pecas), `t` 1,02, `x`/`y` (null = os da camada), `voo` 0,55 power3.out, `some` +0,32 0,25 power1.in | `sint-s_burst [9, 0.3]` inicio+0,02 -29 |
| `carimbo` | selo cai, achata e volta com mola; anel; tremida; papel afunda (opcional) | `selo`, `t` 4,5 (o impacto), `queda` -0,45, `desce` -0,15, `achata` {sx 1,18, sy 0,82}, `mola`, `anel`, `papel` null, `estouro` null, `tremida` 0,32 s | `sint-s_swish [0.24]` queda -34; `sint-s_thump [150, 60, 0.3]` impacto -19; `sint-s_clack` impacto -22; `sint-s_burst [8, 0.25]` impacto+0,03 -30 |
| `marca-texto` | traço desenhado atrás da palavra | `camada` (marcaTexto), `t` 6,55, `dur` 0,4, `ease` power2.inOut | `sint-s_swish [0.3]` inicio -31 |
| `entra-em-arco` | entra de baixo em arco | `alvo` (camada imagem, selo ou cta, ou objeto 3D), `t` 3,0, `de` {op 0, y 760, x 120, rot -22, s 0,6}, `para` {op 1, y 0, x 0, rot -4, s 1}, `dur` 0,6, `ease` lgPousa, `objeto.de` (diferença de pose pro 3D) | `sint-s_whoosh [0.4, 400, 6000]` inicio-0,02 -29; `sint-s_papel [0.3]` inicio+0,1 -30 |
| `guarda-na-pasta` | a pasta entra; o elemento levanta, mergulha e some; a pasta achata e volta | `elemento`, `pasta` (imagens), `t` 7,45 (a pasta entra), `levanta` +0,30, `mergulha` +0,55, `some` +0,88, `achata` +0,87, `mola` +0,94, `soco` 0,012 | `sint-s_pop [700, 300, 0.14, 26]` pasta+0,02 -26; `sint-s_whoosh [0.32, 500, 6000]` mergulho-0,05 -30; `sint-s_pop [300, 140, 0.18, 18]` pouso -22; `sint-s_thump [110, 50, 0.22]` pouso -29 |
| `cta-pop` | entra com back.out(2.4) e pulsa 1,2 s depois | `camada`, `t` 16,3, `entra`, `pulso` {desloc 1,2, s 1,06, dur 0,12} ou null | `sint-s_bubble` inicio -24; `sint-s_pop [1300, 700, 0.08, 45]` pulso -31 |
| `virada-de-pagina` | calendário clay: antecipação, virada, a página some, achatamento e mola, giro curto | `objeto`, `t` 1,0, `antecipacao` -0,4, `virada` 0,5 power3.out, `some` +0,3, `estica`, `mola` +0,12, `giro` 0,22, `estouro` null, `soco` 0,025 | `sint-s_riser [0.45, 420, 1250]` inicio-0,45 -31; `sint-s_whoosh [0.34, 700, 8000]` inicio-0,02 -27; `sint-s_papel [0.28]` inicio+0,02 -27; `sint-s_burst [9, 0.3]` inicio+0,04 -29; `sint-s_thump [120, 55, 0.25]` inicio -27 |
| `marca-dia` | calendário clay: anel coral em volta do dia, etiqueta, pulso com mola | `objeto`, `t` 10,0, `marca` 0,45 back.out(2.2), `pulso`, `estouro` null, `soco` 0,015 | `sint-s_check` inicio -24; `sint-s_burst [9, 0.3]` inicio+0,03 -30 |

O som do estouro já está na `virada-de-pagina`, na `marca-dia` e no `carimbo`: pra soltar as peças junto delas, use o parâmetro
`estouro` da própria batida (`{"camada": "<id das pecas>", "desloc": 0.02}`), e não a batida `estouro` separada (o som sairia
dobrado). Todos os tempos aceitam o `Tempo` do kit (segundo, `{palavra}`, `{fecho}`, `{fim}`, `{marca}`).

## Objeto `calendario-clay`

O calendário clay do img2threejs (`createClayCalendarModel` e `setPageFlip` de `src/abertura`), montado como o `build()` do
`Calendar3D.tsx`: a página da frente vira na dobradiça e revela a página do mês novo, com o anel e a etiqueta.

- Na cena: `{"id": "calendario", "modelo": "proc-calendario-clay-img2threejs", "pose": {...}}`. O catálogo (camada `provas.json`)
  já dá `tipoObjeto "calendario-clay"`, `escala 0.12` (1 unidade do modelo = 12 cm) e `sombra 0.5`. A pose 3/4 da abertura é
  `{"rx": 0.38, "ry": 0.56}`; a flutuação lenta vem de `"flutuacao": {"amp": 0.0014, "freq": 2.1, "fase": 0}`.
- `conteudo`: `mes` (1 a 12: a página revelada; a da frente é o mês anterior, rótulos em pt-BR JAN, FEV, MAR, ABR, MAI, JUN, JUL,
  AGO, SET, OUT, NOV, DEZ), `de` e `para` (trocam os rótulos), `corDe` #1B1E24, `corPara` #DD4E27, `etiqueta` "dia 20" (null
  tira; o texto sai numa CanvasTexture em Sora 800 e encolhe pra caber), `corEtiqueta` #DD4E27, `corAnel` #E8603C, `balanco`
  0,02 (balanço lento de ry; no modo periódico a frequência fecha o loop) e `estado` (canais de partida).
- Canais em `st.canais[id do objeto]`: `virada` 0, `pagina` 1, `marca` 0, `pulso` 0, `sx` 1, `sy` 1, `giro` 0.
- A `marca-dia` acende o anel na página revelada: use depois da `virada-de-pagina` (ou com `conteudo.estado.virada` 1).
- Texturas: os 15 mapas planos na raiz do public (o `RM/public-kit` já tem; um public temporário precisa ter também).

## Exemplo (trecho de `cenas.json`)

```json
"objetos": [{"id": "calendario", "modelo": "proc-calendario-clay-img2threejs", "pose": {"y": -0.03, "rx": 0.38, "ry": 0.56},
             "conteudo": {"mes": 10}, "flutuacao": {"amp": 0.0014, "freq": 2.1, "fase": 0}}],
"camadas": [
  {"id": "t1", "tipo": "texto", "linhas": ["Mês novo,", "*hábito novo.*"], "tamanho": 124, "estado": {"vis": 1}},
  {"id": "bz1", "tipo": "pecas", "x": 540, "y": 840},
  {"id": "cta", "tipo": "cta", "texto": "Conta pra gente aqui", "y": 1560}
],
"batidas": [
  {"id": "virada-de-pagina", "params": {"objeto": "calendario", "t": 1.0, "estouro": {"camada": "bz1", "desloc": 0.02}}},
  {"id": "texto-sai", "params": {"camada": "t1", "t": 2.3}},
  {"id": "cta-pop", "params": {"camada": "cta", "t": {"palavra": 10}}}
]
```

A cena completa da demonstração (calendário com virada e marca-dia, texto que sai e entra com marca-texto, carimbo com o
símbolo da marca e o CTA) está em `KIT/provas/modelos/demo-abertura/` (`cenas.json`, `props.json`, `eventos.json`, os 8 stills
em `stills/` e a `folha-demo.jpg`).

## Prova no navegador das 11 batidas (03/10)

A demo acima usa 7 das 11 batidas. As 11, com as 6 camadas e o calendário clay, foram desenhadas num navegador no
ato 2 da peça de prova da biblioteca 2D, `KIT/pecas/_2026-10-03-prova-2d/` (19,6 a 28,6 s; folha
`provas/folha-3-abertura-fecho.jpg`, recortes em `provas/recortes-abertura-fecho.jpg`, registro em
`provas/prova-navegador.json`): entra-em-arco no calendário (objeto 3D) e no símbolo (camada imagem), texto-entra,
marca-texto, virada-de-pagina com estouro, marca-dia, soco avulso, texto-sai, estouro avulso, guarda-na-pasta,
carimbo com papel e estouro, e cta-pop com pulso. O bundle tinha as 3 extensões, e a `AberturaMes` (public-abertura,
quadros 0, 60, 150, 300 e 450) saiu com o md5 dos pixels igual à linha de base do K06.

**guarda-na-pasta: onde pôr a pasta.** O levanta (+150, -30) e o mergulho (+175, +210, escala 0,42) são
deslocamentos a partir da posição do elemento (os números da `Abertura.tsx`), e a pasta é desenhada por cima dele.
Ponha a pasta embaixo e à direita, com o topo abaixo do elemento levantado e o ponto do mergulho dentro dela: na
prova, elemento em (650, 1250) com 150 px e pasta em (800, 1530) com 220 px. Nas duas primeiras rodadas o movimento
se perdeu: com a pasta longe, o mergulho caiu fora dela; com a pasta (uma imagem alta) por cima do elemento, o
levanta e o mergulho ficaram escondidos atrás dela.

## Conferir depois de mexer

1. `npx tsc --noEmit -p src/kit/tsconfig.json` (cwd `RM`): zero erro.
2. `node src/kit/cli/batidas.mjs`: a extensão aparece ligada, com as 11 batidas e as 6 camadas.
3. `python -B KIT/scripts/kit.py props <demo>` e `kit.py eventos <demo>` (a pasta da demo por caminho absoluto): zero erro e os
   sons da tabela acima.
4. Stills da demo (`kit.py stills <demo> --quadros ... --composicoes KitMotion`) e os da `AberturaMes` com o `public-abertura`
   contra a linha de base do K06 (`KIT/provas/render/linha-de-base/`): diferença 0.
5. Busca de U+2014 e U+2013 nesta pasta: zero.
