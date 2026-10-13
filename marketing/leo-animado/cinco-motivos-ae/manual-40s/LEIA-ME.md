# Cinco motivos pra ter CNPJ, versão de 40 s (13/10/2026)

Pedido do Pedro: o vídeo em 40 s, com cortes e música, no estilo do pin "Motion inspiration - Frames" (corte seco a
cada 1 a 2 s, fundo papel e fundo escuro se alternando, tipografia bold com uma palavra em coral, fita curva, tela do
app). Entregue em `marketing/final/Cinco motivos pra ter CNPJ/CINCO-MOTIVOS-40s.mp4` (hardlink de
`saida/CINCO-40S.mp4`): 40,0 s, 1200 quadros, -14,8 LUFS, 10,9 MB.

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

## Colagem (a que vale, 13/10)

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
