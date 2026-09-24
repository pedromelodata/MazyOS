# Vinheta "O Check" — Legalizai

Logo ident de **18 beats @ 116 BPM = 9,31s** (mesma grade do vídeo de 18s — a
vinheta emenda em qualquer peça com o corte caindo no beat). Master 16:9
3840×2160 60fps + 9:16 2160×3840, **256 samples**, entrega H.264 CRF14
veryslow + mezanino ProRes 422 HQ/PCM (`--mezanino`).

**Conceito (v7 aprovada):** estúdio escuro com gradiente coral suave; o
símbolo 3D (proporção exata do `simbolo.svg`) cai como um carimbo e assenta no
DROP da trilha (WHAT! — Basixx, stems instrumentais entrando no impacto); o
check branco se desenha; a wordmark se revela e o lockup segura até b9.
**Fecho de transição:** letras despencam de trás pra frente (b9), o check cai
(b9,6), o slogan "CONTABILIDADE DIGITAL DE VERDADE" surge letra a letra
(b10,1), a **mão emoji clica no DIGITAL cravada no b13** (Click_mouse na mix)
e o clique pinta a palavra de coral D→L; o **palco do filme rasga do centro no
b15** (polígono irregular de 72 vértices + tira coral desfocada) levando a
frase junto; b18 = palco limpo onde o filme começa. Dolly em **janela fixa até
b9** — esticar o fecho não invalida os frames 3D.

## Arquitetura (rota híbrida, padrão do 18s v14 "com-render")

- **`timing.json` — fonte única.** BPM, eventos em beats, dolly, câmera,
  layout por aspecto. HTML e Blender leem o MESMO arquivo; a fórmula do dolly
  (`s(t) = 1 + amp·(0,5 − 0,5·cos(π·t/DUR))`) existe nos dois lados de
  propósito — mudou em um, mude no outro (ou melhor: não mude a fórmula, mude
  o `timing.json`).
- **`src/vinheta-base.html`** — base 2D: fundo, halo, grain, vinheta óptica e
  wordmark (paths verbatim do `logo-fundo-escuro.svg`, sem o símbolo).
  Arquitetura `__render(t)`/`__dur`. Falha alto sem `window.__TIMING`.
- **`render-base.mjs`** — captura Playwright (playwright vem do node_modules
  do `../pipeline` via createRequire — sem dependência própria).
- **`check-frames.mjs`** — o check se desenhando, frame a frame, canvas → PNG
  2048² (path verbatim do `simbolo.svg`; wipe em 2 half-planes rotacionados).
- **`blender/simbolo3d.py`** — cena Cycles: slab coral (materiais/luzes na
  linhagem do `../blender/phones.py`), face com Image Sequence do check,
  chão shadow catcher, câmera vfov 30° com dolly + shake decaindo no impacto.
  **View transform Standard** (regra do vault: AgX lava o coral).
  Laço `frame_set` + `write_still` — NUNCA `render(animation=True)`.
- **`compose.mjs`** — overlay (scale2ref) + áudio + encode CRF 16 slow.
- **`mix-vinheta.mjs`** — trilha 116 BPM + SFX na grade, loudnorm -14 LUFS.
  Variantes: standalone (fade 350ms) e `--preroll` (só SFX, corte seco).

## Comandos

```powershell
# 1. sequência do check (fps deve casar com o render 3D)
node check-frames.mjs 30

# 2. base 2D (aspecto, fps, deviceScaleFactor: 1=1080p, 2=4K)
node render-base.mjs 16x9 30 1

# 3. símbolo 3D — piloto (~15-20 min na RTX 3060)
& "C:\Program Files\Blender Foundation\Blender 5.5\blender.exe" --background `
  --python blender\simbolo3d.py -- --aspect 16x9 --fps 30 --samples 64 --res 1280 720

# 4. áudio + composição
node mix-vinheta.mjs
node compose.mjs 16x9 30 --tag piloto

# MASTER 16:9 (overnight: check/base em 60fps@2x, Blender 4K 128 samples)
node check-frames.mjs 60
node render-base.mjs 16x9 60 2
& "...\blender.exe" --background --python blender\simbolo3d.py -- --aspect 16x9 --fps 60 --samples 128
node compose.mjs 16x9 60 --tag 4k60
```

## Armadilhas herdadas (pagas no 18s — não repetir)

- View transform **Standard**, não AgX (`../blender/README.md`).
- Luz forte estoura o coral em plástico: **cortar a key**, nunca saturar.
- Laço de render manual com `frame_set` (textura em sequência atualiza
  confiável; `animation=True` avaliava a cena defasada).
- Composição de range parcial: `tpad`, **nunca** `setpts`.
- Nada de `Math.random` em camada nenhuma — render é frame a frame.
- A Sora não entra aqui (wordmark é path vetorial), então não há dependência
  de rede no render da vinheta.
