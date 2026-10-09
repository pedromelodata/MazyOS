# Identidade visual — Legalizaí

> Como a marca aparece em tudo que o MazyOS gera.
> As skills de conteúdo, carrossel e post leem esse arquivo antes de criar qualquer visual.
> Fonte completa: `identidade/design-system-completo.md` + pacote `identidade/brandmkt/`.
> Em caso de conflito, o ADR (`identidade/brandmkt/01-marca/decisoes-marca.md`, entradas mais recentes) manda.

---

## Grafia da marca

**"Legalizaí"** com acento agudo em toda copy pública (ADR 25/08). O wordmark do logo não leva acento (é desenho, não texto). "Legalizei" não se usa mais em superfície nova.

---

## Cores

Sistema disciplinado de **2 cores**: coral = marca + ação, ink = seriedade/estrutura. O resto é estado funcional, nunca decoração.

- **Fundo principal (claro):** papel quente `#FAF8F5` — NUNCA branco puro (branco `#FFFFFF` é card)
- **Fundo alternativo / cards:** branco `#FFFFFF` sobre o papel, ou superfície alternada `#F1EEE9`
- **Fundo escuro (tema dark / slides escuros):** página `#15171C` · card `#1F2228` · superfície alternada `#282B32`
- **Cor de marca:** coral `#F2643C` (coral-500) — logo, wordmark, destaques de identidade. Nunca fill de botão em fundo claro
- **Cor de ação / CTA (fundo claro):** coral-600 `#DD4E27` (botão grande) · coral-700 `#B83D1C` (botão pequeno, hover)
- **Cor de ação no escuro:** coral sobe pro 500 `#F2643C` (o 600 fica pesado no escuro)
- **Tint de marca (fundos suaves):** coral-50 `#FEF3EE`
- **Texto principal:** ink `#1B1E24` (sobre claro) · `#F4F1EC` (sobre escuro)
- **Texto secundário:** `#524E48` (sobre claro) · `#BDB8B0` (sobre escuro)
- **Bordas:** hairline `#E3DED7` · forte `#CBC5BC` · hairline no escuro `#2E313A`
- **Semânticos (só estado, nunca decoração):** success `#17A06A` · warning `#F5A524` · danger/erro `#E03E43` (erro SEMPRE com ícone + texto, nunca coral)
- **Cores proibidas:** azul como marca (banido — é a cor do setor). Coral como erro. `#A19B92` (ink-400) como texto de leitura

### Gradientes (pra slides escuros / heros)

```css
--gradient-ink-hero: linear-gradient(160deg, #2A2E37 0%, #15171C 62%, #202433 100%);
--gradient-scrim: linear-gradient(to top, rgba(21,23,28,.94) 4%, rgba(21,23,28,.55) 46%, rgba(42,46,55,.10) 100%);
--gradient-brand-glow: radial-gradient(120% 80% at 15% 0%, rgba(242,100,60,.22), transparent 60%);
```

---

## Tipografia

- **Fonte única: Sora** (Google Fonts) em TUDO — títulos, corpo, UI, eyebrow. Nada de segunda família.
- Import: `https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap`
- **Peso do título:** 700-800 (Sora não tem 900 — não usar o default 900 da skill de carrossel)
- Escala de referência pra carrossel 1080x1350:
  - Título de capa: 76-92px, weight 800, line-height 1.02, letter-spacing -0.03em
  - H2 slides internos: 54-64px, weight 700, letter-spacing -0.025em
  - Corpo: 26-30px, weight 400-500, line-height 1.5
  - Eyebrow/kicker: 15-17px, weight 700, UPPERCASE, letter-spacing 0.22em, cor coral
  - Page counter: 15px, weight 500, letter-spacing 0.18em, cor muted

---

## Estilo geral

**Metáfora de papel:** fundo papel quente + card branco por cima + borda hairline. **Sem sombra por padrão** — a separação vem da borda. Editorial, calmo, acolhedor + confiável + moderno. Nem banco engomado, nem startup infantil. "Leve na cara, séria no motor."

Arco visual das peças (herdado dos filmes): dark `#15171C` no problema → virada pra papel quente + coral na solução.

---

## Elementos-chave

- Bordas: hairline 1px `#E3DED7` (claro) / `#2E313A` (escuro), sem sombra
- Border-radius dos cards: 16px (cards) · 12px (botões/inputs/chips maiores) · 24px (superfícies grandes) — raio deriva do logo (símbolo tem raio ≈ 0,27 × lado)
- Botões/CTA: fill coral-600 (`#DD4E27`) texto branco bold, ou CTA escuro fill ink `#1B1E24`; pill radius 999 pra tags
- Sombras: NÃO usar (só overlay de modal, irrelevante em carrossel)
- Régua fina coral (3-4px × 60-80px) entre kicker e título, sempre numa linha própria. NUNCA colada antes de um texto na mesma linha (lê como travessão; proibido, Pedro 23/09/2026)
- 1 palavra forte em coral por frase de destaque (padrão das legendas de vídeo)
- **Margem de segurança (Pedro, 09/10/2026: "uma margem para os elementos, letras e etc não baterem as bordas"):** nada de texto, legenda, card, aparelho ou ícone encostando na borda. No vídeo 1080x1920, tudo fica a pelo menos 96 px das laterais, 240 px do topo e 360 px da base (onde entram o texto e os botões do Instagram). Fundo, partícula e brilho podem ir até a borda. Peça que entra voando entra de fora do quadro e para dentro da área segura
- **Tag de assinatura "ME / MEI"** no canto superior esquerdo de TODO carrossel e post (decisão Pedro 01/09/2026): pill com fundo tint `#FEF3EE`, borda 1.5px coral `#F2643C`, texto coral-700 `#B83D1C`, 17px weight 700, letter-spacing .16em, radius 999, padding 12x26
- Estilo de peça vigente (v2 híbrido, validado no carrossel "5 sinais"): fundo creme em todos os slides, ilustrações 3D clay (coral/creme/ink, geradas por IA SEM texto) em círculos ou tiles arredondados, número coral no início do título com trecho-chave destacado, caixinha de dica com lâmpada, quarto de círculo coral no canto, logo + tagline "Contabilidade Digital" no rodapé esquerdo, pill "Arrasta pro lado" na capa, end card de conversão com botão coral

---

## O que NUNCA fazer

1. Travessão (— ou –) em qualquer copy pública. Reescrever com ponto, vírgula, "e" ou frase separada
2. Azul como cor de marca
3. Coral como cor de erro (erro = crimson `#E03E43` + ícone + texto)
4. Coral-500 `#F2643C` como fill de botão em fundo claro (é cor de identidade; ação é o 600/700)
5. Fundo branco puro de página (fundo é papel quente `#FAF8F5`)
6. `#A19B92` como texto de leitura (só placeholder/disabled)
7. Texto/logo gerado por IA generativa em imagem (tudo tipográfico nasce no HTML/design)
8. Mais de UMA cor de destaque brigando na mesma peça

---

## Logo

- **Arquivo (fundo claro):** `identidade/logos/legalizai-logo-horizontal.svg` — master. "Legaliz" ink + "ai" coral, símbolo coral com check vazado
- **Versão pra fundo escuro:** `identidade/logos/legalizai-logo-negativa-clara.svg` (toda branca)
- **Versão escura sobre fundo claro-alternativo:** `identidade/logos/legalizai-logo-negativa-escura.svg` (toda ink)
- **Só o símbolo (quadrado coral + check):** `identidade/logos/simbolo.svg` — favicon, avatar, selo, page marker
- **Onde usar:** slide final do carrossel (CTA), header de propostas, slides de apresentação
- **Tamanho sugerido:** largura entre 140-200px nos HTMLs de carrossel

---

## Observações adicionais

- Handle Instagram: @legalizai.app (confirmado pelo Pedro em 22/09/2026; "@legalizai-story-book.app" em docs do brandmkt é artefato de find/replace)
- Mascote Léo (suricato): se a copy fala na 1ª pessoa do Léo, ele PRECISA aparecer visualmente na peça. Como o MazyOS ainda não tem asset de imagem do Léo, evitar voz do Léo em carrossel por enquanto — usar voz institucional "nós" ou voz do Pedro (pilar bastidor)
- Fotos com humanos (IA): fotorrealistas, características brasileiras (foco sudeste), diversidade de idade/gênero/tom de pele, nunca contexto de comércio/varejo. Nunca gerar rosto que represente "o contador" (regra: contador real ou ilustração)
