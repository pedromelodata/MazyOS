# LEGALIZAI — identidade visual (D19)

Wordmark oficial: **Legalizai** (não "Legalizei" — "ai" final em coral).

## Arquivos nesta pasta

- `logo-horizontal.svg` — logo completa, fundo claro (wordmark ink + "ai" coral + símbolo).
- `simbolo.svg` — só o símbolo (quadrado coral com check), pra favicon/ícone de app.
- `logo-fundo-escuro.svg` — variante mono branca, pra fundo escuro (telas de login etc).

## Cores

**Coral** (marca/ação):
`50 #FEF3EE · 100 #FBDDD1 · 200 #F8C3B0 · 300 #F5A184 · 400 #F47F58 · 500 #F2643C (marca) · 600 #DD4E27 (fill de botão, AA) · 700 #B83D1C · 800 #8C2F16 · 900 #5C1F0F`

**Ink** (texto/estrutura):
`white #FFFFFF · 50 #FAF8F5 (fundo de página, "papel quente") · 100 #F1EEE9 · 200 #E3DED7 · 300 #CBC5BC · 400 #A19B92 · 500 #736E67 · 600 #524E48 · 700 #34363C · 800 #24262C · 900 #1B1E24 (texto primário)`

Semânticos (só estado do CNPJ/sistema, nunca decoração):
- success `#17A06A` · warning `#F5A524` · danger `#E03E43` · info `#3B82E0`

## 5 regras (não quebrar)

1. **Coral nunca é erro** — erro = danger, sempre com ícone + texto, nunca cor sozinha.
2. Botão fill = **coral-600** (contraste AA); coral-500 é só identidade/marca, não fill de texto pequeno.
3. Fundo de página = **ink-50** (`#FAF8F5`), nunca branco puro; card = branco.
4. **Azul banido como marca** — info é só funcional, uso mínimo.
5. Fonte única: **Sora** (400 corpo · 500 labels · 600 títulos/botões · 700 display). Sem fonte secundária.

Google Fonts: `https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap`

## Onde isso vive no código (fonte da verdade — não duplicar hex)

- `packages/ui/src/tokens.ts` — tokens canônicos (web/mobile compartilhado).
- `packages/ui/tailwind-preset.cjs` — preset Tailwind/NativeWind.
- `apps/web/src/components/logo.tsx` — componente da logo (SVG inline, 3 variantes: padrao/escura/negativa).
- `apps/mobile/src/components/Logo.tsx` — mesmo logo, motor react-native-svg.
- `apps/crm/DESIGN.md` + `apps/crm/src/App.css` — adaptação pra desktop denso do CRM.

## Raciocínio das 3 variantes da logo (do comentário do componente)

- `padrao` — "Legaliz" ink, "ai" + símbolo coral, check branco. Fundo claro.
- `escura` — tudo branco; check em knockout (furo mostra o fundo escuro). Fundo escuro (ex.: tela de login).
- `negativa` — tudo branco, símbolo é quadrado sólido + check coral endereçável por cima (pro wipe animado da splash funcionar).
