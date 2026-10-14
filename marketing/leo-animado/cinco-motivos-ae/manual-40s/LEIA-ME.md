# Cinco motivos pra ter CNPJ, versão de 40 s (13 e 14/10/2026)

Pedido do Pedro: o vídeo em 40 s, com cortes e música. A que vale é a **v4 do prompt dele** (seção abaixo), em
`marketing/final/Cinco motivos pra ter CNPJ/CINCO-MOTIVOS-40s.mp4` (hardlink de `saida/CINCO-40S-prompt.mp4`).
Em `_versoes-anteriores`: a v1, a v2 e a v3 do prompt (`CINCO-MOTIVOS-40s-prompt-v1.mp4` a `-v3.mp4`), a colagem e o
take único.

## Prompt do Pedro, v4 (a que vale, 14/10)

Sobre a v3: "em vez de você colocar no app que está chegando, você coloca é, no dia 10 do 11... dia 10 de novembro,
certo? Então isso tem que estar bem bem explícito aí no vídeo como também as barras... a barra de progressão ela tem que
ser gradual, ela não tem que ser fixa de uma vez".

- **A data contraria a base:** o F008 diz "sem data nas notas" e manda falar "o app que tá chegando" (P11 barra data de
  lançamento). A data veio do Pedro; o FATOS precisa ser atualizado com ela.
- **Narração nova numa tomada só**, com o fim "entre na lista de espera do ép, que chega dia dez de novembro. Vai,
  Legalizaí!":
  - clone Pedro-Legalizai a 13 (a 12 deu 43 s e pulou o "Cinco:"; as outras a 13 variaram de 29 a 43 s ou trocaram
    palavra);
  - a conversão pro Dylan embolava o "CPF" do gancho ("CVF") quando o clone falava rápido. A tomada 5, com o "CPF" no
    ritmo da aprovada, convertida com 1 s de silêncio antes, deu o gancho limpo. Das três conversões dela, a `t5c`
    ficou melhor (`voz/dylan-t5c.wav`, 36,7 s);
  - `alinha-voz.py` casa a transcrição do whisper com o texto e interpola as palavras que ele não ouviu
    (`voz/dylan-t5c-alinhado.json`, lido pelo `prompt40.py`).
- **"do app, que chega dia 10 de novembro."** (preto): um bloco de calendário (NOVEMBRO) arranca as folhas 7, 8 e 9 e
  para no 10 quando o "dez" é dito; embaixo, "dia 10" e "de novembro." em coral. No fecho, embaixo da pílula LINK DA
  BIO, fica "O app chega dia **10/11**" até o fim.
- **Barra gradual:** "Fature de um real até o teto de oitenta e um mil por ano, exatamente seis mil setecentos e
  cinquenta por mês" virou uma cena só (eram duas). A barra é dividida em 12 meses e sobe um degrau de R$ 6.750 por mês,
  do "um real" ao fim do "mês" (3,5 s). O contador sobe de R$ 1 a R$ 81.000, a moeda rola na frente, "teto R$ 81 mil"
  marca a ponta e, no "exatamente", a etiqueta "R$ 6.750 por mês" acompanha o degrau (F051).
- As 12 barras da "guia é fixa" agora sobem uma de cada vez, e a linha nivela quando a última assenta.
- O celular 3D da nota foi rerenderizado nos tempos novos: a duração e a troca de tela saem do `prompt40.json`.
- 24 batidas. Som: `PYW -B mix-prompt40.py dylan-t5c.wav`.

## Prompt do Pedro, v3 (14/10, versão anterior)

Sobre a v2, mostrando o calendário de argila com cadeado: "ESSE ASSET não faz sentido nenhum, busque outra ideia e
adicione, coloque uma barra representando de 1 Real até 81000 por ano progressiva e animada".

- **"a guia é fixa."** (preto, piso em perspectiva): 12 barras de mês (J a D) sobem na mesma altura, uma atrás da outra,
  e no "fixa." uma linha branca nivela as pontas. Sem valor nenhum na tela (F063).
- **"Fature de um real até o teto de oitenta e um mil por ano,"** virou uma batida só, no papel (eram duas, papel e
  preto):
  - em cima, "Fature de" dá lugar a "até o teto de" no mesmo lugar (`fim` na linha);
  - a moeda de 1 entra pela esquerda girando e pousa na ponta da barra;
  - o contador aparece em R$ 1 no "um real" e sobe até R$ 81.000 enquanto a barra enche, do "até" ao "mil" (F051);
  - a moeda rola na frente do enchimento até bater na marca do teto, que acende em coral; "por ano," embaixo do
    contador; nas pontas da barra, "R$ 1" e "teto".
- O número do contador sai do quadro real: com o tempo das amostras do motion blur, os dígitos de amostras diferentes
  se misturavam e o contador ficava borrado.
- 25 batidas agora. O resto é a v2.

## Prompt do Pedro, v2 (13/10, versão anterior)

Sobre a v1: "Tiressa essa tela esquisita e coloque o celular mesmo em 3D e tire essas imagenzinhas aqui esquisitas" e
"toma mais liberdade criativa, não precisa apenas focar e ficar preso somente em nosso design system, pode usar outros
assets e outras coisas 3D sem problemas, não precisa ficar preso, seja criativo e apenas não perca a base!".

- **Saiu:** a tela chapada presa com fita crepe, os selos de gráfica (disco em quartos, "MEI", caixa de microtexto,
  "ME") e o código de barras, que é da mesma família.
- **Celular 3D de verdade** no "Você emite a nota e paga." (`src/cinco/Celular40Nota.tsx`, composição `Celular40Nota`):
  - o iPhone 17 Pro Max do BlenderKit; quadro cheio com alfa a 240 qps, public enxuto `public-cel40` (GLB, 2 telas e
    as fontes que o bundle pede);
  - `PYW -B mistura-sub.py <pasta> <saída> 8` junta 8 subquadros em 1 → `public-cinco-v9/cel40nota/`, 72 quadros. Com 4
    (120 qps), a entrada saía em 3 ou 4 cópias; os 8 primeiros quadros saíram de um render a 480 qps
    (`--frames=0-127`) com 16 subquadros;
  - entra da quina de baixo à direita girando, assenta girado 24 graus sobre o papel, com sombra, e escorrega devagar;
  - tela "Nota emitida" (`notas_detalhe`, de `telas-app-2026-10-02`); no "paga." gira e troca pra guia do imposto do
    mês (a "Suas guias" ficou de fora: diz "pagou por você", P21).
- **Números 1 a 5 em 3D:** Sora 800 extrudada em 26 camadas que escurecem com a profundidade, entrando girada e
  balançando, com um brilho correndo na face.
- **Assets novos do Higgsfield** (`nano_banana_pro` 1:1, 2 créditos cada; fundo tirado com `remove_background`, a
  moeda com máscara redonda), em `material/prompt3d/` (links em `public-cinco-v9/prompt3d/`):
  - a moeda de 1, que gira em 3D (face que encolhe com o giro e borda dourada em fatias) e pousa embaixo do "R$ 1";
  - o cofrinho coral no "recolhe INSS", com uma moeda caindo pela fenda;
  - a mão branca que chega da quina e aperta a pílula LINK DA BIO.
- O resto é a v1: mesma narração, mesmas 26 batidas, mesmas passagens e mesmo som.

## Prompt do Pedro, v1 (13/10, versão anterior)

Quinto pedido: um prompt de reel editorial de tipografia cinética (10 s, 12 batidas, papel e preto, vermelho, câmera que
não para) com "Use esse prompt para criar o vídeo no Remotion mas usando as nossas cores e assets nesse assunto do reel
que estamos fazendo" e, no meio, "Regere a narração para não ficar cortada e faça de uma vez só".

- **Narração nova numa tomada só** (`voz/`):
  - texto inteiro no clone Pedro-Legalizai (Higgsfield `seed_audio`, "app" escrito "ép", números por extenso);
  - duas tomadas: a 1 deu 48,3 s, a 2 (velocidade 12) deu 38,7 s e ficou;
  - convertida pro Dylan (`voice_change`, preset b847bc29) pelo vídeo preto de 360 x 640 com o áudio;
  - o whisper confere as 107 palavras (`voz/dylan-t2-tr.json`). O "Vai, Legalizaí!" já vem no fim, sem fecho separado.
  - Sem emenda e sem acelerar. Antes, a narração de 40 s era a antiga com os respiros e o começo do convite cortados.
- `python -B prompt40.py`: monta as 26 batidas pelos tempos das palavras e grava `src/cinco/prompt40.json`.
  - Cada palavra aparece 3 quadros antes de ser dita.
  - O texto é medido com a Sora de verdade; a linha que não cabe diminui.
  - Confere a margem (96, 240 e 360) depois do empurrão da câmera de cada batida.
- **Imagem no Remotion** (`src/cinco/Cinco40Prompt.tsx`, composição `Cinco40Prompt`, public `public-cinco-v9`):
  - **Marca no lugar da referência:** papel #FAF8F5 e preto com brilho se alternando; coral #F2643C no lugar do
    vermelho; Sora no lugar da Inter; palavra-chave em Sora 800 a 1,7x.
  - **Palavra:** entra em 3 quadros (40% de opacidade, 15 px de deslize, o coral acendendo do rosa), sem desfoque.
  - **Câmera:** empurra com ease-out exponencial em toda batida. No motivo 1 gira de 0 a 25 graus e vira corte pro
    calendário, que entra girado. Motion blur com 8 amostras e 200 graus.
  - **Passagens:** cintilação de exposição, corte seco, quadro preto, estouro branco, clarão branco, duas íris pretas
    (antes do "2" e antes do celular do motivo 5) e o estouro de luz que apaga o "6%".
  - **Peças:**
    - o gancho de argila, com o símbolo da marca voando de trás dele até "trabalho" (no lugar da borboleta);
    - o empresário sem rosto em meio-tom, com "no CPF?" na cabeça;
    - os números grandes com degradê coral e cópias desfocadas saindo pelos cantos; faixa cinza em S e em "(";
    - o piso em perspectiva no preto, com o calendário e o bolso girando pra nivelar;
    - o disco que estoura debaixo do "6%" e deixa um rubor;
    - o cartão cinza com tachinha ("R$ 10 mil" e "R$ 600 de imposto");
    - a tela do pró-labore presa com tachinha e a de emitir nota presa com fita crepe;
    - o iPhone 3D (cel17v7) com o imposto e com "Sua empresa nasceu";
    - a pílula LINK DA BIO, o eco do convite e o fecho do kit.
  - **Três camadas:** o fundo sem blur, o que se mexe com blur e as passagens sem blur.
- **Som:** `PYW -B mix-prompt40.py` põe a narração 0,1 s pra dentro e a House One (51,711 s) 17 LU abaixo. Depois,
  `bash junta-prompt40.sh` junta, recodifica com `-tune grain` e normaliza pra -14 LUFS → `saida/CINCO-40S-prompt.mp4`.
- **Render:** `npx remotion render Cinco40Prompt saida/prompt40-mudo.mp4 --public-dir=public-cinco-v9`, com os mesmos
  binários e o mesmo Chrome do `junta-40s.sh`. Leva uns 6 min.
- **Armadilhas:**
  - SVG com máscara e filtro (o meio-tom do busto) dentro do `HtmlInCanvasMotionBlur` saiu com faixas avermelhadas. Foi
    pra camada de fundo.
  - A linha que se recentrava a cada palavra arrastava o texto uns 100 px por quadro. Com o blur, a palavra chegava
    borrada por 3 quadros. Agora a linha fica no lugar da linha completa.

## Como foi feito

1. **Primeira tentativa, à mão pelo computer use (parada a pedido do Pedro):** 14 min e 33 chamadas, só chegou a criar o
   projeto e começar a importação (`CINCO-40S-MANUAL.aep`). Atalho de teclado e lote de ações voltavam "user
   interrupt"; só clique, digitação e rolagem passavam.
2. **O que vale: MCP do After Effects + Remotion.**
   - `python -B roteiro40.py`: calcula os cortes da narração (os respiros e o começo do convite, "Se você não quer se
     preocupar com toda a burocracia de abrir empresa"; a voz não acelera) e as 26 tomadas; grava `ROTEIRO.md` e
     `roteiro40.json`.
   - `node gera-40s.mjs`: escreve o `monta-40s.jsx`. Pelo MCP (`execute-script` com `$.evalFile` dele), o AE monta em uns
     9 s o projeto `CINCO-40S.aep`: narração em 11 trechos, fecho "Vai, Legalizaí", House One por baixo, fundos, textos
     com entrada em escala e motion blur, Brilho no destaque do fundo escuro, fita, pílula, telas do app e fecho.
   - Render pelo MCP (`render-aerender`): `saida/base-40s.mp4` (H.264 40 Mbps, uns 45 s) e `saida/som-40s.aif`.
   - Remotion: composição `Cinco40Celular` (`src/cinco/Cinco40Celular.tsx`, public `public-cinco-v9`), o iPhone 17 Pro
     Max 3D nas tomadas 19 e 22, com alfa (VP8, `--video-bitrate=40M --frames=843-1006`) em `saida/celular-40s.webm`.
   - `bash junta-40s.sh`: cola o celular na base e põe o som com loudnorm em duas passadas pra -14 LUFS.
3. **Ponte do MCP:** o painel `mcp-bridge-auto.jsx` abre sem clique por um `.jsx` rodado com `-r`:
   `app.executeCommand(app.findMenuCommandId("mcp-bridge-auto.jsx"))`.

## Colagem (13/10, versão anterior)

Quarto pedido do Pedro, com outra referência (pin "Animated motion ads": fundo claro, círculo tracejado com grade de
pontos, recorte por tópico, cantos de colagem, título numerado): "Faça a edição com base nessa inspiração".

- **Imagem no Remotion** (`src/cinco/Cinco40Colagem.tsx`, public `public-cinco-v9`), mesma narração e mesmos tempos
  (`estacoes40.json`). O som continua o do AE pelo MCP.
- **Palco:** círculo tracejado com a grade de pontos, girando devagar e pulsando em cada troca.
- **Recortes de argila** do Higgsfield (`nano_banana_pro` 1:1, 2 créditos cada, fundo tirado com `remove_background`):
  - um por motivo: gancho, calendário, bolso, praia, aperto de mão;
  - cantos: a mão com o cartão do CNPJ e as moedas com o celular.
  - Ficam em `material/recortes/` (links em `public-cinco-v9/recortes40/`).
  - O recorte novo entra deslizando da direita, girando, com overshoot. O velho sai crescendo. Tudo com motion blur.
- **Título numerado** no alto ("1." coral + "MEI"), digitando sem desfoque; a fala de cada tomada embaixo do círculo,
  sem repetir o título.
- **Telas do app** (pró-labore, emitir nota) entram em colagem na borda do círculo e o recorte desliza pro outro lado.
- **Fim:** no convite, setas varrem a tela até a pílula LINK DA BIO; depois vem o fecho "Vai, Legalizaí".
- **Render** (uns 70 s, mesmos binários) e `bash take40.sh saida/colagem40-mudo.mp4 saida/CINCO-40S-colagem.mp4`.
- A versão de take único foi pra `_versoes-anteriores` como `CINCO-MOTIVOS-40s-take-unico.mp4`.

## Um take só (13/10, versão anterior)

Terceiro pedido do Pedro: "não é para cortar a tela com a linha, e sim para o vídeo ser um take só e que tem uma linha
guiando cada parte do vídeo".

- **Imagem toda no Remotion** (`src/cinco/Cinco40Take.tsx`, public `public-cinco-v9`):
  - As 26 partes ficam num mundo de papel, uma embaixo da outra a cada 2500 px. As partes de fundo escuro viram cartões
    escuros dentro do mundo, com grão. A grade de pontos mostra a câmera andando.
  - A linha (a fita cinza da referência, 64 px, com a ponta coral) se desenha pela margem de cada parte e cruza em S no
    vão entre uma e outra, sem passar por texto. Termina encostando na pílula LINK DA BIO do fecho.
  - A câmera anda 70 px e fecha 3,5% enquanto a parte fala. Na viagem pra próxima, abre o zoom 20%, desvia pro lado da
    curva e inclina 2,5 graus, com motion blur (8 amostras, 200 graus).
- `python -B estacoes40.py`: mede cada texto com a fonte de verdade e grava `src/cinco/estacoes40.json`.
- Render: `npx remotion render src/index.ts Cinco40Take <saida/take40-mudo.mp4> --public-dir=public-cinco-v9 ...` (os
  mesmos binários do `junta-40s.sh`), uns 72 s.
- Som: o do AE pelo MCP (`saida/som-40s.aif`); `bash take40.sh` junta e normaliza pra -14 LUFS.

## Versão anterior: costura por linha e círculo (não vale mais)

Segundo pedido: "tá faltando uma conexão entre os takes" e "o vídeo precisa de movimento".

"Tá faltando uma conexão entre os takes... No vídeo não existe um corte seco, é praticamente uma linha conectando take e
os assets e efeitos vão sendo modelados" e "O vídeo precisa de movimento".

- **Nenhum corte seco:** cada fundo novo entra 9 quadros antes da fala da tomada, por um fosco (`Tn matte`, alfa):
  - linha grossa que cruza a tela e engorda até cobrir (L1 diagonal subindo, L2 diagonal descendo, L3 arco); a tomada
    que sai é empurrada 140 px na direção da linha, com motion blur;
  - círculo que nasce de dentro do foco da tomada que sai (o número, a palavra coral ou a pílula), que cresce 50%;
  - mesmo fundo (tomada 9 pra 10): o texto sobe e some, e a fita entra.
- **Câmera em toda tomada** (`Tn camera`, um nulo com tudo da cena preso): zoom de 8%, deriva e giro de 0,8 grau até o
  fim da tomada. O círculo nasce onde o foco está no fim da câmera.
- O iPhone do Remotion segue a mesma câmera e sai com a passagem (some em 4 quadros, antes do fundo novo cobrir).
- Quadros de conferência das passagens em `qc/folha-passagens.png` e `qc/final-costura.png`.

## O que deu trabalho

- A rampa radial escura do fundo fazia anéis (banda de 8 bits). Resolveu com Dispersão 16 na rampa, Ruído 4% nos fundos
  escuros e `-tune grain -crf 23` no x264 (com `-crf 18` o grão levava o arquivo a 104 MB).
- A fita passava por trás do texto: as três curvas foram redesenhadas por fora do texto.
- A luz coral atrás do celular virou anéis no alfa do VP8: saiu.
- O render da base pelo MCP caiu sem memória no quadro 695 com o Remotion rodando junto (disco quase cheio, pouca
  memória virtual): renderizar um de cada vez.
