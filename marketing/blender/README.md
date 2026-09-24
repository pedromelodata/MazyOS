# Fecho em 3D — versão Blender

Os dois aparelhos do ato 4, remodelados em Blender + Cycles. Substituem o WebGL
de `s4scene.js` no render final: vidro de verdade na lente, coat na carcaça,
sombra e reflexo resolvidos por path tracing.

O 3D em tempo real (`s4scene.js`) **continua valendo** — é ele que roda no
`final-18s.html` pra preview rápido. O Blender entra só no master.

## Por que as telas não são desenhadas aqui

As duas telas (lock e app) vêm de `pipeline/screens-draw.js`, o mesmo módulo que
alimenta a cena Three.js. `pipeline/screens.mjs` roda esse código num Chromium
headless e salva em `tex/`. Ou seja: preview e master usam a **mesma** arte de
tela — mexeu no desenho, os dois mudam juntos.

```powershell
node ..\pipeline\screens.mjs 2      # 2 = 2x (1560x3376). Precisa de rede: Sora vem do Google Fonts
```

O script falha alto se a Sora não carregar, em vez de renderizar com fonte de
fallback e entregar textura com métrica errada.

## Render

```powershell
$bl = 'C:\PedroProjects\tools\blender-5.2.0-windows-x64\blender.exe'

& $bl --background --python phones.py -- --frame 0                  # um frame
& $bl --background --python phones.py -- --anim 0 139 --samples 128  # ato 4 inteiro
& $bl --background --python phones.py -- --only-blend                # só o .blend, pra abrir na GUI
```

Saída em `out/fecho_####.png`, RGBA com fundo transparente — pra compor por cima
do vídeo sem precisar de chroma.

Detecta OptiX/CUDA/HIP automaticamente e cai pra CPU se não achar. Nesta máquina
roda em OptiX na RTX 3060: ~9 s por frame a 128 samples, 1080x1920.

## Encode / composição

O PNG já tem alpha, então dá pra sobrepor direto no ffmpeg:

```powershell
ffmpeg -y -i base.mp4 -framerate 30 -i "out\fecho_%04d.png" `
  -filter_complex "[0:v][1:v]overlay=shortest=1" -c:a copy fecho.mp4
```

## O que casa com o s4scene.js (não desencostar)

| | valor | onde |
|---|---|---|
| proporção do corpo | 0.74 : 1.54 : 0.082 → 70,6 × 146,6 × 8,25 mm | `P_W/P_H/P_D` |
| FOV vertical | 30° | `camera()` |
| distância da câmera | 5.1 (three) × `ESC` | `camera()` |
| pose dos aparelhos | portada de `__s4render` | `POSE` / `de_three()` |
| loop da órbita | 13 s | `LOOP_S` |
| crossfade lock → app | começa em 2350 ms, dura 800 ms | `anima_crossfade()` |

`ESC = P_H / 1.54` converte as unidades do three pra metros. Os eixos remapeiam
`blender(x, y, z) = three(x, -z, y)` — three é Y-up e a câmera olha por +Z; aqui
é Z-up e a câmera está em -Y.

## Armadilhas já pagas (não repetir)

- **Não trocar o laço de render por `render(animation=True)`.** A fita é
  deformada por handler de `frame_change_pre`; no render de animação o Blender
  avalia a cena com a malha defasada e sobra um pedaço de fita solto no quadro.
  O mesmo frame renderizado sozinho sai limpo. Por isso `phones.py` renderiza em
  laço com `frame_set` + `write_still`.
- **Testar "os frames diferem entre si" não prova nada.** Isso só mostra que a
  animação não congelou. O teste que pega o bug acima é comparar um frame vindo
  do lote com o MESMO frame renderizado sozinho.
- **Na composição, usar `tpad` e não `setpts`.** `tpad=start=419` prepende
  frames transparentes por contagem; `setpts=PTS+419/30/TB` faz aritmética de
  timestamp e desalinhava a sequência.
- **Verificar o quadro inteiro, não recorte.** A lasca de fita solta ficava
  abaixo do aparelho e passou batido em duas checagens que recortavam só a
  região da tela.
- **Simple Deform não serve pra dobrar um plano chato.** Testado nos três eixos:
  em X e Y o `z` não sai do zero, e no Z ele entorta a malha dentro do próprio
  plano. Por isso o enrolamento é calculado em `instala_peel`.
- `PEEL_DEBUG=1` liga um dump por frame com a frente, o raio do rolo e o
  bounding box da malha deformada — foi o que localizou os dois bugs.

## Decisões que parecem estranhas mas são de propósito

- **View transform `Standard`, não AgX.** Esse render é composto sobre um vídeo
  já colorido nos hex da marca. AgX dessatura o realce e o coral `#F2643C` da
  tela chegaria alaranjado-pálido, brigando com o resto do filme. O custo é
  highlight que estoura fácil — por isso as áreas de luz são de potência baixa
  (5,5 W / 4 W / 1,4 W). Se clarear as luzes, a carcaça escura vira plástico
  branco: já aconteceu.
- **Tela é emissão pura**, sem difusa. Tela de celular emite luz, não reflete.
- **Íris da lente afundada dentro do vidro.** Se ela passar do topo do anel, a
  lente vira uma bolinha saltada.
- **Bevel por ângulo, não por peso.** Os segmentos do canto arredondado formam
  ângulos rasos e passam batido; só as arestas de 90° do perímetro filetam.

## Gerados, não versionados

`out/` e `phones.blend` saem do script — `.gitignore` cobre os dois. `tex/` vai
pro repo: é arte aprovada e a regeneração depende de rede.
