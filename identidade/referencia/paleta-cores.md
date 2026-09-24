---
tipo: verdade
status: vivo
data: 2026-07-10
assunto: cor-primitivos
etapa: paleta
tags: [marca, design, cor, tokens]
---

# 🎨 Paleta de cor — Legalizei (tokens v1)

> Sistema de 2 cores disciplinado (lição da pesquisa): **coral = marca + ação**, **ink = seriedade/estrutura**. Neutros quentes + semânticos funcionais. Decisão de território em [[referencias]]; cor líder travada em [[decisoes-marca]] (Direção A, coral #F2643C). Estes hex são **v1 pra debate** — viram tokens finais no Design System.

## 🟠 Coral — marca / ação primária
| Stop | Hex | Uso |
|---|---|---|
| 50 | `#FEF3EE` | fundo tint (cards, destaques suaves) |
| 100 | `#FBDDD1` | tint, hover de superfície |
| 200 | `#F8C3B0` | bordas suaves, chips |
| 300 | `#F5A184` | ilustração, estados leves |
| 400 | `#F47F58` | acento claro |
| **500** | **`#F2643C`** | **★ cor de marca** (wordmark, logo, identidade) |
| 600 | `#DD4E27` | **fill de botão** (contraste AA com texto branco) + hover |
| 700 | `#B83D1C` | texto/ícone sobre tint coral claro |
| 800 | `#8C2F16` | texto em cima de fundo coral |
| 900 | `#5C1F0F` | profundidade máxima |

## ⚫ Ink / neutros — texto, estrutura, base séria
| Stop | Hex | Uso |
|---|---|---|
| White | `#FFFFFF` | superfície de card |
| 50 | `#FAF8F5` | fundo de página (papel quente) |
| 100 | `#F1EEE9` | superfície alternada |
| 200 | `#E3DED7` | borda hairline |
| 300 | `#CBC5BC` | borda forte, divisor |
| 400 | `#A19B92` | texto muted / placeholder |
| 500 | `#736E67` | texto terciário |
| 600 | `#524E48` | texto secundário |
| 700 | `#34363C` | — |
| 800 | `#24262C` | superfície escura |
| **900** | **`#1B1E24`** | **★ ink** — texto primário + CTA escuro ("séria no motor") |

## 🚦 Semânticos (funcionais — estado do CNPJ)
| Papel | 50 (tint) | 500 (base) | 700 (texto) |
|---|---|---|---|
| **Em dia** (success) | `#E7F6EF` | `#17A06A` | `#0B5E40` |
| **Vence em breve** (warning) | `#FDF3E1` | `#F5A524` | `#98600A` |
| **Vencido** (danger) | `#FCEBEB` | `#E03E43` | `#971F25` |
| Dica (info — uso mínimo) | `#EBF2FC` | `#3B82E0` | `#2360B8` |

## ⚠️ Regras do sistema (importante)
- **Coral nunca é erro.** Coral = marca + ação positiva. Erro = vermelho-crimson (`#E03E43`), sempre com ícone + texto (nunca cor sozinha) — coral e vermelho são hues vizinhos, então a distinção vem de forma+ícone, não só matiz.
- **Texto branco sobre coral:** usar **coral-600 (`#DD4E27`)** como fill de botão pra bater contraste AA. O coral-500 é a cor de identidade (wordmark/logo), não o fill de texto pequeno.
- **Azul é banido como marca** (decisão de território). O info-blue aqui é só funcional (dica/link de sistema), uso mínimo — nunca vira acento de marca.
- **2 cores lideram:** coral + ink. Verdes/vermelhos/âmbar são só estado, não decoração.
- **Fundo é papel quente** (`#FAF8F5`), não branco puro — reforça o "humano/acolhedor".

## Próximo
Símbolo/wordmark (direção "Legalizei = consegui") + tipografia, depois Design System (tokens finais + componentes).

## Links
- [[conceito-marca]] · [[referencias]] · [[decisoes-marca]] · [[_sintese-paginas-publicas]] · [[HOME]]
