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

## O que deu trabalho

- A rampa radial escura do fundo fazia anéis (banda de 8 bits). Resolveu com Dispersão 16 na rampa, Ruído 4% nos fundos
  escuros e `-tune grain -crf 23` no x264 (com `-crf 18` o grão levava o arquivo a 104 MB).
- A fita passava por trás do texto: as três curvas foram redesenhadas por fora do texto.
- A luz coral atrás do celular virou anéis no alfa do VP8: saiu.
