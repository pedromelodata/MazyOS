# Brand book Legalizai

> Consolidado em 20/08/2026 a partir do ADR de marca (`referencia/decisoes-marca.md`),
> paleta v1 (`referencia/paleta-cores.md`), design guide (`design-guide.md`), SPEC do filme
> e canon do mascote. **Documento DERIVADO**: em conflito, vale o vault do produto
> (repo `legalizei`) e o Storybook. Versão visual compartilhável:
> https://claude.ai/code/artifact/dbdbf943-28b7-4989-830b-447ffa40d9fd

## 1. A marca

- **Nome exibido: Legalizai** (com A). Rebrand travado 03/08/2026. "Legalizei" não se usa
  mais em superfície nova. Domínio segue `legalizei.app` (ativo pago).
- **Claim:** "A única contabilidade 100% digital de verdade" (marketing, não operação).
- **Posicionamento:** digital pura, nativa digital + escritório 20+ anos BH/MG.
  Nunca "braço do escritório tradicional".
- **Arquétipo: Aliado leve e vitorioso.** Cliente é o herói; a marca carrega o chato.
  Anti-guru, anti-cross-sell, sem citar concorrente.
- **Entidade:** Legalize Digital LTDA · CNPJ 41.569.345/0001-48 · BH/MG.

## 2. Tom de voz

- "Você" e "a gente". Sério no motor, leve na fala. "Você cuida do negócio, a gente
  cuida da papelada."
- Traduzir jargão fiscal pra fala humana (glossário: vault `marca/copy/`).
- Honestidade antes do toque: nada finge ser grátis; erro explica e resolve.
- Registro por dorsal (personalidade fixa): A direto · B parceria · C paciência.
- Checagem de toda copy: soa Sábio distante ou Aliado?
- **REGRA DURA: zero travessão** (em/en dash) em qualquer copy pública.

## 3. Cor (2 cores lideram, resto é estado)

| Papel | Hex | Regra |
|---|---|---|
| Marca (coral-500) | `#F2643C` | SÓ logo/wordmark. Nunca fill de botão |
| Ação (coral-600) | `#DD4E27` | Fill de botão. Hover ESCURECE pro 700 `#B83D1C` |
| Fundo página | `#FAF8F5` | Papel quente, nunca branco puro |
| Card | `#FFFFFF` | Superfície sobre o papel + hairline `#E3DED7` |
| Texto | `#1B1E24` ink-900 | Secundário `#524E48`, terciário `#736E67` |
| Em dia | `#17A06A` | Estado, nunca decoração |
| Vence em breve | `#F5A524` | idem |
| Vencido/erro | `#E03E43` | SEMPRE com ícone + texto (forma, não só matiz) |
| Dica | `#3B82E0` | Uso mínimo. AZUL NUNCA É MARCA |

AA: branco sobre coral-600 = 4,04:1 → só texto GRANDE (≥18,66px bold). Botão pequeno
nasce no 700. Escala completa coral 50-900 e ink em `referencia/paleta-cores.md`.

## 4. Tipografia

**Sora em TUDO** (travado 12/07): display 32/1.15/700 · h1 26/1.2/700 · h2 20/1.3/600 ·
corpo 16/1.5/400 · legenda 14/1.4 · micro 12/1.4/500. Descartadas: Fraunces, Bricolage,
Space Grotesk, Schibsted, Instrument Serif.

## 5. Logo

- Símbolo: quadrado coral, check vazado sangrado no canto sup-dir. 3 pontos de coral
  (ícone + pingos dos i). Wordmark Sora estilizada ink com "ai" coral.
- Régua: ícone 1,4× capitular · gap 1× haste do L · **raio 0,27× lado → origem do
  radius-12 do sistema**.
- Arquivos em `identidade/logos/`: `legalizai-logo-horizontal.svg` (master),
  `legalizai-logo-negativa-clara/escura.svg` (dark).
  ⚠️ `legalizei-logo-app-fundo-solido.svg`: usar SÓ o quadrado (wordmark interno é antigo).

## 6. Superfície e componentes

- Metáfora de papel: papel + card branco + hairline. **Sem sombra** (só sheet/modal).
- Raios: card 16 · input/botão 12 · chip 8 · sheet 24 · pill 999.
- Espaço: base 4 · lateral 24 · seção 32. Mobile-first container 480.
- Botões: coral-600 texto branco grande bold (hover 700) · CTA escuro ink-900 ·
  secundário transparente + borda forte. Foco: anel coral 2px offset 2.
- Motion: 150/250/400ms, ease-out, sem bounce, respeitar reduced-motion.
- Tema escuro (tokens prontos): página `#15171C` · card `#1F2228` · texto `#F4F1EC` ·
  hairline `#2E313A` · coral de ação sobe pro 500.

## 7. O que NUNCA fazer

1. Travessão em copy pública.
2. Azul como marca.
3. Coral como erro (erro = crimson + ícone + texto).
4. Coral-500 como fill de botão.
5. Hex cru numa peça (peça pede papel semântico).
6. Ink-400 `#A19B92` como texto de leitura (só placeholder/disabled).
7. Texto/logo de IA generativa em vídeo (tudo tipográfico nasce no AE).

## 8. Mascote (canon)

Suricato realista: pelo creme/tan, cabeça acinzentada com face branca, óculos redondos
de aro fino, gravata borboleta grafite, polo coral piqué com símbolo + wordmark
"Legalizai" bordados no peito esquerdo. Sorriso caloroso, postura ereta, cauda visível.

- **Papel narrativo:** o Aliado em pessoa. Dono do fecho "Vai, legaliza aí"
  (o "ai" acende em coral na sílaba tônica).
- **Pipeline:** imagem-herói define o LOOK · kit 3D Blender define o MOVIMENTO
  (`marketing/mascote/kit/`, actions walk/idle/wave/celebrate/reach) · take final
  fotorreal via Higgsfield motion_control (Kling) com a imagem-herói.
- **Asset A-pose (base 3D):** `marketing/mascote/source/higgsfield/suri-apose-legalizai.png`.
- Licenças e proveniência: `marketing/mascote/LICENCAS.md`.

## 9. Motion e vídeo

Arco dos filmes: dark `#15171C` no problema → virada pra papel + coral na solução.
Lettering Sora word-by-word sync; legendas com 1 palavra forte coral por frase, cores
alternadas, animação viva. Trilha por último com sidechain; hit final no check do suricato.

## 10. Fontes da verdade

| Assunto | Onde |
|---|---|
| Componentes renderizados | Storybook do app (`legalizei/app`, :6006) |
| Tokens | `legalizei/globals.css` (canônico) · `identidade/tokens.css` (espelho) |
| ADR de marca | `identidade/referencia/decisoes-marca.md` |
| Paleta | `identidade/referencia/paleta-cores.md` |
| Extrato marketing | `identidade/design-guide.md` |
| Copy/glossário | vault `marca/copy/` |
| Mascote | `marketing/mascote/` |
| Filme | `marketing/filme/escalada/SPEC.md` |
