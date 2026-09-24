# Pipeline do vídeo Legalizai — como re-renderizar

Scripts copiados do scratchpad da sessão de produção (ago/2026). Rodam em
qualquer sessão com Node + ffmpeg + Playwright (chromium instalado).

## Setup (uma vez, em pasta de trabalho qualquer)

```powershell
npm i playwright three esbuild
npx playwright install chromium
```

## Arquivos

- `render18.mjs` — renderiza `marketing/final/src/final-18s.html` frame a frame.
  Uso: `node render18.mjs <fps> <scale>` → `30 1` = preview 1080p, `60 2` = master 4K.
  Os paths saem do `paths.mjs`, não precisa editar nada.
  Ele chama `window.__s4init()` (cena 3D) antes de capturar.
  `--sem-3d` esconde os canvases `#gl1`/`#gl2` do ato 4 e escreve em
  `frames-18-sem3d/` — é a base pra sobrepor o render do Blender. Sem esconder,
  os aparelhos do WebGL e os do Blender apareceriam fantasmando um sobre o outro.
- `s4scene.js` — FONTE da cena 3D do fecho (Three.js: dois iPhones PBR, órbita,
  crossfade lock screen → app). Depois de editar, rebundle:
  `npx esbuild s4scene.js --bundle --format=iife --minify --outfile="<repo>/marketing/final/src/s4-3d.js"`
- `screens-draw.js` — desenho das duas telas (lock e app) em canvas 2D. Importado
  pelo `s4scene.js` E pelo `screens.mjs`: é a fonte única da arte de tela, pra
  preview em WebGL e master no Blender não divergirem. Mexeu aqui, os dois mudam.
- `screens.mjs` — roda o `screens-draw.js` num Chromium headless e salva as telas
  em `../blender/tex/*.png`. Uso: `node screens.mjs 2` (2 = 2x, 1560x3376).
  Precisa de rede — a Sora vem do Google Fonts. Falha alto se ela não carregar,
  em vez de entregar textura com fonte de fallback.
- `mix.mjs` — mixagem de áudio (trilha + 18 SFX na grade de 116 BPM, loudnorm -14 LUFS)
  → `marketing/audio/mix/mix-18s.m4a`
- `sfx.mjs` — busca/baixa SFX CC0 do Freesound (chave em `..\.env`, formato
  `FREESOUND_API_KEY==<TAB>chave` — o parser aceita)
- `shoot-app.mjs` + `telas-catalogo.mjs` + `mockup.mjs` — captura das telas do app
  e geração do `marketing/mockup-filme.html`. **É a via atual** (ver abaixo).
- `shoot.mjs` + `routes.json` — ⚠️ **aposentado.** Capturava 27 telas de
  https://legalizeiapp-web.vercel.app a partir de uma lista congelada à mão.
  Mantido só como histórico; use o `shoot-app.mjs`.
- `trilha-bpm.mjs` — estima BPM de faixas por autocorrelação
- `probe3d.mjs` — frames de teste da cena 3D sem render completo

## Atualizar as telas do mockup

As telas saem do código real, não de uma lista mantida à mão. A ordem, os
rótulos e as notas vêm de `legalizei/app/src/lib/telas-flow.ts` — a mesma fonte
única que o app usa no `/mockup` e na `/apresentacao`. Tela nova no produto
entra aqui sozinha.

```powershell
# 1. sobe o app (deixa rodando numa janela)
cd C:\PedroProjects\legalizei\app
npm install          # só na primeira vez
npm run dev          # → localhost:3000

# 2. captura + gera o HTML (noutra janela)
cd C:\PedroProjects\Projects\Legalizei_Videos\marketing\pipeline
node shoot-app.mjs   # 73 telas em 1290x2796 → ../telas-app/
node mockup.mjs      # → ../mockup-filme.html
```

`shoot-app.mjs` escreve `telas-app/_manifesto.json` com o que de fato capturou;
o `mockup.mjs` só referencia o que está lá, então falha de captura vira aviso no
topo do HTML em vez de imagem quebrada. Flags: `--base` (outra URL) e `--so=nome`
(captura só as rotas que casam, útil pra reconferir uma tela).

⚠️ `ativa.png`, `home-campea.png` e `impostos-neutro.png` **não** estão no
catálogo do app e por isso não são recapturadas. As styleframes e o `final-18s`
dependem delas, então ficam paradas no disco de propósito. Não apagar.

## Encode (depois do render)

```powershell
ffmpeg -y -framerate 30 -i "frames-18\f%05d.png" -i "<repo>\marketing\audio\mix\mix-18s.m4a" `
  -c:v libx264 -pix_fmt yuv420p -crf 19 -preset medium -c:a copy -shortest `
  -movflags +faststart saida.mp4
```

Master 4K: `-framerate 60`, frames renderizados com `60 2`, `-crf 16 -preset slow`.

## Grade de tempo

BPM 116 (trilha: ES_Keep Your Focus on Me — Basixx, instrumental).
4 atos × 9 beats ≈ 18,62s. Cortes nos beats 9/18/27. Mudou a trilha →
mudar `const BPM` no final-18s.html e re-renderizar; a mixagem (mix.mjs)
tem os tempos dos SFX hardcoded em segundos — recalcular se o BPM mudar.
