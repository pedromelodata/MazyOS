# Assets importados do vault Legalizei_Videos

Importado em 04/09/2026 de `C:\Projects\Legalizei_Videos`. Esse repo passa a ter
o kit completo de marca + os assets 3D e de motion do filme institucional, pra
alimentar carrossel, reel e criativo de anuncio sem depender do vault de video.

**Regra de verdade:** em conflito, vale o vault do produto (repo `legalizei`) e o
Storybook. Os documentos daqui sao derivados.

---

## Design system, branding e identidade — `identidade/`

| Arquivo | O que e |
|---|---|
| `design-system-completo.md` | Documento mestre consolidado (marca, tom, logo, cor, tipo, componentes) |
| `brand-book.md` | Versao curta e compartilhavel do brand book |
| `design-guide.md` | Guia de estilo aplicado ao conteudo (esse ja era do repo) |
| `design-system.html` | Storybook estatico da marca, abre no navegador |
| `tokens.css` | Tokens canonicos (cor, espaco, raio, sombra, tipo) |
| `gerar-design-system.mjs` | Script que regera o `design-system.html` |
| `referencia/decisoes-marca.md` | ADR: por que cada decisao de marca foi tomada |
| `referencia/paleta-cores.md` | Paleta v1 com papeis de cada cor |
| `referencia/design-system.md` | Spec de componentes |
| `referencia/globals.css` | CSS global do produto, fonte dos tokens |
| `logos/` | Logos master do rebrand **Legalizai** (horizontal, negativas, app, check negativo) |
| `branding-legado/` | Marca **Legalizei** pre-rebrand (03/08/2026). Nao usar em superficie nova |
| `brandmkt/` | Estrategia: personas, ICP, mercado, campanhas (ja existia) |

**Cores que lideram:** marca `#F2643C` (so logo) · acao `#DD4E27` (fill de botao) ·
papel `#FAF8F5` · card `#FFFFFF` · texto `#1B1E24`.
**Regra dura:** zero travessao em copy publica.

---

## Celulares 3D — `marketing/3d/`

```
3d/celulares/
  iphone-b-preparado.blend   modelo principal, materiais prontos (vidro, coat)
  scripts/still-t2-iphone.py still em retrato, fundo transparente
  scripts/spin-iphone.py     turntable terminando em pose exata
  scripts/bancada-look.py    estudio de luz base
  scripts/prepara-b.py       preparacao do modelo
  renders/                   stills prontos (iphone-t2, t5, t7-splash) + tela-coral-lisa
  spin-t2/  spin-t5/         sequencias PNG com alpha, prontas pra compor
3d/mascote/    suricato-rigged.blend + takes renderizados
3d/simbolo/    simbolo-16x9.blend, simbolo-9x16.blend, simbolo3d.py (vinheta)
3d/modelo-3d/  Untitled.blend (modelo generico)
```

`marketing/blender/phones.py` renderiza os dois aparelhos do ato 4 em Cycles,
saida RGBA transparente. A tela vem de `pipeline/screens-draw.js` (mesma arte do
preview em tempo real), rasterizada por `pipeline/screens.mjs` pra `blender/tex/`.

```powershell
& $blender --background --python marketing\blender\phones.py -- --frame 0
& $blender --background marketing\3d\celulares\iphone-b-preparado.blend --python marketing\3d\celulares\scripts\still-t2-iphone.py -- saida.png
```

---

## Motion

| Pasta | O que tem |
|---|---|
| `telas-app/` | **80 telas do app em PNG chapado**, sem mockup. Materia-prima de post |
| `telas-filme/` | 5 telas tratadas pro filme (splash, welcome, entrada, gate, atende) |
| `styleframes/` | sf1-sf3 PNG + fonte HTML/CSS |
| `animatic/` | animatic 9x16 mp4 + fonte HTML |
| `vinheta/` | vinheta 9x16 4K60 e 16x9 + fonte Blender/HTML + scripts de compose e mix |
| `final/` | masters do filme 18s e 15s (9x16 4K e preview) + roteiro de narracao |
| `campanhas/` | criativos de video 2026-08-24 (roteiros, referencia, build jsx) |
| `escalada/` | filme Escalada: `SPEC.md`, `data/`, `jsx/`, `ae/` (v102 + v102A, os 2 ultimos), `audio/` |
| `audio/` | narracoes ElevenLabs, roteiros, trilha e SFX do institucional |
| `pipeline/` | scripts Node do pipeline (shoot, render18, mix, sfx, mockup, telas-catalogo) |

O `pipeline/paths.mjs` resolve tudo a partir da raiz do repo, entao os scripts
rodam daqui sem reapontar caminho.

---

## O que ficou de fora, de proposito

- `escalada/tools/.venv` (2,3 GB de pacote Python reinstalavel)
- ~100 versoes antigas de `.aep` (ficaram as duas ultimas, v102 e v102A)
- frames de QC e render intermediario do mascote e da cena
- pastas de render vazias

Tudo isso continua no vault original em `C:\Projects\Legalizei_Videos`.

---

## Git

O remote desse clone e `pedromelodata/MazyOS` (repo do **produto**). Os binarios
pesados estao no `.gitignore`: ficam na maquina, nao sobem. Vai pro repo so o
texto — md, css, svg e js.
