# Design System Legalizai — documento completo

> Consolidado em 01/09/2026 a partir de: `identidade/brand-book.md`, `identidade/design-guide.md`,
> `identidade/referencia/design-system.md`, `identidade/referencia/paleta-cores.md`,
> `identidade/referencia/decisoes-marca.md` (ADR), `identidade/tokens.css` e
> `legalizei-branding/identidade-visual.md`.
>
> **Documento DERIVADO.** Em caso de conflito, a verdade é: o vault do produto (repo `legalizei`),
> o Storybook (`legalizei/app`, porta :6006) e o `legalizei/globals.css` (tokens canônicos).

---

## 1. A marca

| | |
|---|---|
| **Nome exibido** | **Legalizai** (com A no fim). Rebrand travado em 03/08/2026. "Legalizei" não se usa mais em superfície nova |
| **Domínio** | `legalizei.app` (ativo pago, continua com "ei") |
| **Claim** | "A única contabilidade 100% digital de verdade" (claim de marketing, não de operação) |
| **Posicionamento** | Digital pura, nativa digital + escritório 20+ anos BH/MG. Nunca "braço do escritório tradicional" |
| **Arquétipo** | **Aliado leve e vitorioso.** O cliente é o herói; a marca carrega o chato. Anti-guru, anti-cross-sell, sem citar concorrente |
| **Entidade legal** | Legalize Digital LTDA · CNPJ 41.569.345/0001-48 · Belo Horizonte/MG |

## 2. Tom de voz

- **"Você" e "a gente".** Sério no motor, leve na fala. "Você cuida do negócio, a gente cuida da papelada."
- Traduzir jargão fiscal pra fala humana (glossário no vault, `marca/copy/`).
- Honestidade antes do toque: nada finge ser grátis; erro explica e resolve.
- Registro por dorsal (personalidade fixa, registro muda): **A** direto/eficiente · **B** parceria/crescimento · **C** paciência reforçada.
- Checagem de toda copy: *isso soa Sábio distante ou Aliado?*
- 🔒 **REGRA DURA: zero travessão** (em/en dash) em qualquer copy pública. Reescrever com ponto, vírgula, "e" ou frase separada. Vale pra LinkedIn, IG, LP, gate, wizard, deck, bio, legenda de carrossel.

---

## 3. Logo

![Logo horizontal Legalizai](logos/legalizai-logo-horizontal.svg)

**Anatomia do símbolo:** quadrado coral com check **vazado e sangrado** no canto superior direito.
**Wordmark:** Sora estilizada, "Legaliz" em ink + "ai" em coral. **3 pontos de coral** no lockup
(símbolo + pingos dos dois "i") — exceção consciente à regra "1 coral por lockup".

**Régua do lockup (travada 12/07, verificada no SVG):**
- Ícone = **1,4×** a altura da capitular, centrado na faixa capitular
- Gap ícone↔wordmark = **1× a haste do L**
- Raio do símbolo ≈ **0,27 × lado** → é a origem do `radius-md: 12` do sistema (num ícone de 44px, 0,27× ≈ 12). **O logo governa a régua do sistema.**

### Arquivos

**`identidade/logos/` (master atual, rebrand Legalizai):**

| Arquivo | Uso |
|---|---|
| `legalizai-logo-horizontal.svg` | **Master.** Fundo claro. Check branco sólido, wordmark certo ("Legaliz" ink + "ai" coral) |
| `legalizai-logo-negativa-clara.svg` | Fundo escuro |
| `legalizai-logo-negativa-escura.svg` | Fundo escuro |
| `legalizei-logo-app-fundo-solido.svg` | ⚠️ Usar **só o quadrado** (ícone de app/favicon: quadrado coral sólido + check branco por cima). O wordmark interno é o ANTIGO "Legalizei" — nunca usar o lockup completo |
| `legalizei-logo-horizontal.svg` · `legalizei-logo-horizontal-check-negativo.svg` | Legado pré-rebrand, não usar em superfície nova |

**`legalizei-branding/` (kit do produto):**

| Arquivo | Uso |
|---|---|
| `logo-horizontal.svg` | Logo completa fundo claro |
| `simbolo.svg` | Só o símbolo (quadrado + check), pra favicon/ícone de app |
| `logo-fundo-escuro.svg` | Variante mono branca pra fundo escuro (login etc.) |

### As 3 variantes no código (`apps/web/src/components/logo.tsx`)

- **`padrao`** — "Legaliz" ink, "ai" + símbolo coral, check branco. Fundo claro.
- **`escura`** — tudo branco; check em knockout (o furo mostra o fundo escuro).
- **`negativa`** — tudo branco, símbolo é quadrado sólido + check coral endereçável por cima (permite o wipe animado da splash).

**Onde usar:** slide final de carrossel (CTA), header de propostas, vinheta, slides.
**Tamanho sugerido em HTML:** largura entre 120 e 200px.

---

## 4. Cor

> Sistema disciplinado de **2 cores**: **coral = marca + ação**, **ink = seriedade/estrutura**.
> O resto é estado funcional, nunca decoração. Fundo é **papel quente**, não branco puro.

### 🟠 Coral — marca / ação primária

| Stop | Hex | Uso |
|---|---|---|
| 50 | `#FEF3EE` | fundo tint (cards, destaques suaves) |
| 100 | `#FBDDD1` | tint, hover de superfície |
| 200 | `#F8C3B0` | bordas suaves, chips |
| 300 | `#F5A184` | ilustração, estados leves |
| 400 | `#F47F58` | acento claro |
| **500** | **`#F2643C`** | ★ **cor de MARCA** (logo/wordmark/identidade). Nunca fill de botão |
| **600** | **`#DD4E27`** | **fill de botão** (AA só em texto grande) |
| 700 | `#B83D1C` | hover · fill de botão pequeno · texto sobre tint coral |
| 800 | `#8C2F16` | texto sobre fundo coral |
| 900 | `#5C1F0F` | profundidade máxima |

### ⚫ Ink / neutros — texto, estrutura

| Stop | Hex | Uso |
|---|---|---|
| White | `#FFFFFF` | superfície de card |
| 50 | `#FAF8F5` | **fundo de página (papel quente, nunca branco puro)** |
| 100 | `#F1EEE9` | superfície alternada |
| 200 | `#E3DED7` | borda hairline |
| 300 | `#CBC5BC` | borda forte, divisor |
| 400 | `#A19B92` | ⚠️ **só placeholder/disabled.** Nunca texto de leitura (falha AA) |
| 500 | `#736E67` | texto terciário |
| 600 | `#524E48` | texto secundário |
| 700 | `#34363C` | — |
| 800 | `#24262C` | superfície escura |
| **900** | **`#1B1E24`** | ★ **ink** — texto primário + CTA escuro ("séria no motor") |

### 🚦 Semânticos (funcionais — estado do CNPJ, nunca decoração)

| Papel | Tint (50) | Base (500) | Texto (700) |
|---|---|---|---|
| **Em dia** (success) | `#E7F6EF` | `#17A06A` | `#0B5E40` |
| **Vence em breve** (warning) | `#FDF3E1` | `#F5A524` | `#98600A` |
| **Vencido** (danger) | `#FCEBEB` | `#E03E43` | `#971F25` |
| Dica (info — uso mínimo) | `#EBF2FC` | `#3B82E0` | `#2360B8` |

### Regras de cor (travadas)

1. **Coral nunca é erro.** Erro = crimson `#E03E43` **sempre com ícone + texto** (coral e vermelho são hues vizinhos; a distinção vem de forma, não de matiz).
2. **Coral-500 nunca é fill de botão.** É cor de identidade.
3. **AA do coral-600:** branco sobre `#DD4E27` = 4,04:1 → passa AA **só em texto grande** (≥18,66px bold ou ≥24px). Botão pequeno nasce no **700**.
4. **Hover ESCURECE** (600 → 700), nunca clareia pra 500.
5. **Azul é banido como marca.** O info-blue é só funcional, uso mínimo.
6. **Fundo é papel quente** `#FAF8F5`, nunca branco puro. Branco é card.

---

## 5. Tipografia

**Sora em TUDO** (display, títulos, corpo, UI — travado 12/07). Não é só o wordmark.
Descartadas: Fraunces, Bricolage Grotesque, Space Grotesk, Schibsted Grotesk, Instrument Serif.

Google Fonts: `https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap`

| Token | px / line-height / peso | Uso |
|---|---|---|
| `text-display` | 32 / 1.15 / 700 | o número grande, veredito |
| `text-h1` | 26 / 1.2 / 700 | título de tela |
| `text-h2` | 20 / 1.3 / 600 | título de bloco |
| `text-body` | **16** / 1.5 / 400 | corpo padrão (decisão Pedro 16/07; escala em `rem`, fonte ampliável é requisito) |
| `text-body-strong` | 16 / 1.5 / 600 | ênfase no corpo |
| `text-caption` | 14 / 1.4 / 400 | apoio, legenda |
| `text-micro` | 12 / 1.4 / 500 | carimbo, meta |

---

## 6. Tokens semânticos

> 🔒 **A tela nunca escolhe uma cor. Ela pede um PAPEL.** Hex cru numa peça é bug, não estilo.
> Espelho em CSS puro: `identidade/tokens.css` (pra HTMLs soltos de vídeo/marketing).

### Superfície
| Token | → primitivo |
|---|---|
| `surface-page` | ink-50 `#FAF8F5` (papel quente) |
| `surface-card` | white `#FFFFFF` |
| `surface-alt` | ink-100 `#F1EEE9` |
| `surface-dark` | ink-800 `#24262C` |
| `surface-tint-brand` | coral-50 `#FEF3EE` |

### Borda
| Token | → primitivo |
|---|---|
| `border-hairline` | ink-200 `#E3DED7` |
| `border-strong` | ink-300 `#CBC5BC` |
| `border-focus` | coral-600 `#DD4E27` (anel 2px, offset 2px, sempre visível) |

### Texto
| Token | → primitivo | Regra |
|---|---|---|
| `text-primary` | ink-900 | |
| `text-secondary` | ink-600 | |
| `text-tertiary` | ink-500 | |
| `text-muted` | ink-400 | ⚠️ só placeholder/disabled |
| `text-on-brand` | white | só sobre `action-primary`, ≥18,66px bold |
| `text-on-dark` | white | |

### Ação
| Token | → primitivo | Regra |
|---|---|---|
| `action-primary` | coral-600 | fill de botão grande |
| `action-primary-sm` | coral-700 | botão pequeno |
| `action-primary-hover` | coral-700 | hover escurece |
| `action-dark` | ink-900 | CTA escuro |
| `action-secondary` | transparente + `border-strong` | botão secundário |

### Marca
| Token | → primitivo | Regra |
|---|---|---|
| `brand` | coral-500 | ⚠️ SÓ logo/wordmark/identidade |

**Estado selecionado** (travado 30/07): coral **SÓLIDO** com texto branco (`action-primary` + `text-on-brand`), não tint.

---

## 7. Superfície, forma e espaço

**Metáfora de papel:** fundo papel quente + card branco por cima + borda hairline.
**Sem sombra por padrão** — a separação vem da borda. `elevation-overlay` só pra sheet/modal.

### Raio (derivado do logo: símbolo tem raio ≈ 0,27 × lado)
| Token | px | Uso |
|---|---|---|
| `radius-sm` | 8 | chip, badge |
| `radius-md` | **12** | input, botão (= o raio do símbolo) |
| `radius-lg` | 16 | card |
| `radius-xl` | 24 | sheet, modal |
| `radius-full` | 999 | pill, avatar |

### Espaçamento (base 4)
| Token | px | Uso |
|---|---|---|
| `space-1` | 4 | colagem (ícone↔label) |
| `space-2` | 8 | interno de chip/badge |
| `space-3` | 12 | interno de input |
| `space-4` | 16 | interno de card · gap de lista |
| `space-5` | **24** | **padding lateral da página** · gap entre blocos |
| `space-6` | 32 | separação de seção |
| `space-7` | 48 | respiro de bloco grande |
| `space-8` | 64 | topo/rodapé de tela |

### Container
- **Mobile-first:** `max-width: 480px` (mobile) · 560px (tablet+), centrado.
- Altura sem scroll onde couber: `100dvh` + `min-h-0`.
- **CTA colado no rodapé** não é gosto, é thumb zone — princípio de toda tela com ação primária.
- Uma densidade só (sem compact/comfortable).

### Botões
- **Primário:** fill coral-600, texto branco, grande e bold (hover 700). Pequeno nasce no 700.
- **CTA escuro:** fill ink-900 ("séria no motor").
- **Secundário:** transparente + borda forte.
- **Foco:** anel coral 2px, offset 2px, sempre visível.

### Motion
| Token | ms | Uso |
|---|---|---|
| `motion-micro` | 150 | hover, toggle, foco |
| `motion-default` | 250 | transição de tela, revelar campo |
| `motion-enter` | 400 | entrada de conteúdo, Lottie |

Easing padrão: `ease-out`, sem bounce. **Sempre respeitar `prefers-reduced-motion`.**

---

## 8. Tema escuro

Tokens prontos (promovidos 31/07 do CRM; no app mobile disponível mas desligado).
Em vídeo, é o que serve pros fundos escuros — usar o bloco `[data-theme="dark"]` do `tokens.css`, nunca inventar tons.

| Papel | Hex |
|---|---|
| Página | `#15171C` |
| Card | `#1F2228` |
| Superfície alternada | `#282B32` |
| Texto primário | `#F4F1EC` |
| Texto secundário | `#BDB8B0` |
| Hairline | `#2E313A` |
| Ação | **coral sobe pro 500** `#F2643C` (o 600 fica pesado no escuro) |
| Foco | coral-400 `#F47F58` |

### Gradientes (⚠️ não são token no app — cada tela declara inline; usar os valores do `tokens.css`)

```css
--gradient-ink-hero: linear-gradient(160deg, #2A2E37 0%, #15171C 62%, #202433 100%);
--gradient-scrim: linear-gradient(to top, rgba(21,23,28,.94) 4%, rgba(21,23,28,.55) 46%, rgba(42,46,55,.10) 100%);
--gradient-metal: linear-gradient(150deg, #3a3d44 0%, #16181d 45%, #2b2e35 100%);
--gradient-brand-glow: radial-gradient(120% 80% at 15% 0%, color-mix(in srgb, var(--brand) 22%, transparent), transparent 60%);
```

---

## 9. O que NUNCA fazer

1. **Travessão em copy pública.**
2. **Azul como marca.**
3. **Coral como erro** (erro = crimson + ícone + texto).
4. **Coral-500 como fill de botão.**
5. **Hex cru numa peça** (peça pede papel semântico, ex. `--text-primary`).
6. **Ink-400 `#A19B92` como texto de leitura** (só placeholder/disabled).
7. **Texto/logo de IA generativa em vídeo** (tudo tipográfico nasce no After Effects).

---

## 10. Mascote (canon)

Suricato realista: pelo creme/tan, cabeça acinzentada com face branca, óculos redondos de aro
fino, gravata borboleta grafite, polo coral piqué com símbolo + wordmark "Legalizai" bordados
no peito esquerdo. Sorriso caloroso, postura ereta, cauda visível.

- **Papel narrativo:** o Aliado em pessoa. Dono do fecho **"Vai, legaliza aí"** (o "ai" acende em coral na sílaba tônica).
- **Pipeline:** imagem-herói define o LOOK · kit 3D Blender define o MOVIMENTO (`marketing/mascote/kit/`, actions walk/idle/wave/celebrate/reach) · take final fotorreal via Higgsfield motion_control (Kling) com a imagem-herói.
- **Asset A-pose (base 3D):** `marketing/mascote/source/higgsfield/suri-apose-legalizai.png`.
- Licenças e proveniência: `marketing/mascote/LICENCAS.md`.

---

## 11. Motion e vídeo (marketing)

- **Arco dos filmes:** dark `#15171C` no problema → virada pra papel + coral na solução.
- **Lettering:** Sora word-by-word em sync com a narração.
- **Legendas:** 1 palavra forte em coral por frase, cores alternadas, animação viva.
- **Trilha:** por último, com sidechain; hit final no check do suricato.

---

## 12. Fontes da verdade

| Assunto | Onde |
|---|---|
| Componentes renderizados | Storybook do app (`legalizei/app`, :6006) |
| Tokens | `legalizei/globals.css` (canônico) · `identidade/tokens.css` (espelho pra vídeo/marketing) |
| ADR de marca (log de decisões) | `identidade/referencia/decisoes-marca.md` |
| Paleta (primitivos) | `identidade/referencia/paleta-cores.md` |
| Fundação do DS (shells, ritmo, arquétipos, governança) | `identidade/referencia/design-system.md` |
| Extrato marketing | `identidade/design-guide.md` |
| Brand book resumido | `identidade/brand-book.md` |
| Versão visual offline | `identidade/design-system.html` (autocontida, tema claro/escuro) |
| Copy/glossário | vault `marca/copy/` |
| Mascote | `marketing/mascote/` |
| Filme | `marketing/filme/escalada/SPEC.md` |
