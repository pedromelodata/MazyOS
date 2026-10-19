# Áudio

Drop zone das trilhas e efeitos do vídeo. Conteúdo ignorado pelo git — a
licença é da assinatura, o arquivo não deve circular no repositório.

## Organização

- `trilha/` — faixas de música (Epidemic Sound, Artlist, Tunetank)
- `sfx/` — efeitos: whoosh de transição, click de UI, pop de card, riser
- `mix/` — saídas montadas por cena, geradas pelo pipeline

## Perfil da trilha desta peça

- Instrumental, sem vocal
- 110 a 120 BPM
- Duração mínima 20s (o corte final é 15s, sobra pra ajuste de fase)
- Virada clara por volta dos 10s, pro fecho da logo cair no lugar
- Textura eletrônica leve, otimista, sem épico e sem corporate genérico

## Manifesto do vídeo de 18s — o que o `mix.mjs` exige

O conteúdo desta pasta não vai pro git, então numa máquina nova ela chega vazia e
o `mix.mjs` quebra. Isto aqui é a lista exata pra repor.

**Trilha** (1 arquivo, nome tem que bater exatamente — está hardcoded no `mix.mjs`):

```
trilha/ES_Keep Your Focus on Me (Instrumental Version) - Basixx.mp3
```

Epidemic Sound, instrumental, 116 BPM. Precisa ter no mínimo 18,621 s.

**SFX** (13 arquivos únicos, 18 disparos na timeline). 12 deles são CC0 do
Freesound e o ID está no próprio nome (`-fs<ID>`), então dá pra rebaixar:

```powershell
node ..\pipeline\sfx-por-id.mjs     # precisa de FREESOUND_API_KEY no .env.local
```

| arquivo | ID Freesound |
|---|---|
| `sfx/impacto-1-fs535557.mp3` | 535557 |
| `sfx/impacto-3-fs81144.mp3` | 81144 |
| `sfx/pop-1-fs244654.mp3` | 244654 |
| `sfx/pop-2-fs850092.mp3` | 850092 |
| `sfx/riser-3-fs685256.mp3` | 685256 |
| `sfx/whoosh-1-fs60021.mp3` | 60021 |
| `sfx/whoosh-2-fs427823.mp3` | 427823 |
| `sfx/whoosh-2-fs60030.mp3` | 60030 |
| `sfx/success-4-fs380482.mp3` | 380482 |
| `sfx/success-5-fs351879.mp3` | 351879 |
| `sfx/click-2-fs582902.mp3` | 582902 |
| `sfx/confetti-1-fs26349.mp3` | 26349 |
| **`sfx/Click_mouse.mp3`** | **sem ID — cópia manual** |

### ⚠️ `Click_mouse.mp3` hoje é um SUBSTITUTO

O original não veio do Freesound, não tem ID e se perdeu na troca de máquina. É o
efeito mais usado da peça — 3 disparos, em 1,50 s / 7,86 s / 11,26 s.

O que está no lugar dele: **Freesound 448086, "Normal click" by Breviceps, CC0**,
0,048 s. Baixado em 10/08/2026 pra destravar a mixagem.

Se o original aparecer, é só sobrescrever `sfx/Click_mouse.mp3` e rodar o
`mix.mjs` de novo — nada mais muda. Enquanto não aparecer, **a mixagem no repo
não é bit a bit a que foi aprovada.**

> **Não rode o `sfx.mjs` pra repor.** Ele *busca* por palavra-chave e traz os
> melhores resultados do momento — sons diferentes, IDs diferentes. O `mix.mjs`
> referencia os arquivos pelo nome e quebraria. Pra repor, use `sfx-por-id.mjs`.

## Licença — conferir antes de publicar

Peça vai rodar em **Meta Ads**, ou seja, anúncio pago de uma marca. Isso é
uso comercial, não uso pessoal.

- **Epidemic Sound:** o plano Personal não cobre anúncio de marca. Precisa do
  plano comercial. Confirmar antes de subir a campanha.
- **ElevenLabs:** uso comercial de música gerada é item que varia por plano.
  Confirmar no plano contratado.
- **Freesound:** filtrar por CC0 evita obrigação de atribuição. CC-BY exige
  crédito, o que raramente cabe num anúncio.
