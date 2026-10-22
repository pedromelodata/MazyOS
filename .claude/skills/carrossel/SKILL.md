---
name: carrossel
description: >
  Cria carrosséis e posts visuais pra Instagram, TikTok, LinkedIn com a identidade visual da marca.
  Fluxo completo: gancho (banco com 500 opções em references/ganchos.md) → texto slide a slide →
  HTML estilizado → PNG 1080x1350 via Playwright → legenda pronta no final.
  Suporta carrossel texto puro, carrossel com foto IA (gerada via OpenAI) e post único.
  Use quando o usuário pedir "carrossel", "post", "conteúdo pro instagram", "criar imagem",
  "gerar foto", "post educativo", "gancho pra carrossel", "reciclar carrossel", ou /carrossel.
  Segue a estratégia principal do Legalizaí (pilar, gatilho emocional e gatilho psicológico, bloco e
  motivo; references/estrategia.md) e o visual do design-guide (Sora até 800, coral e papel quente).
---

# /carrossel — Carrossel e posts visuais

Skill central de criação de conteúdo visual. Pega um tema → escolhe o gancho → escreve o texto → entrega HTMLs estilizados + PNGs prontos pra postar + legenda no padrão da marca.

## Dependências

- **Identidade visual:** `identidade/design-guide.md` — LER ANTES de criar qualquer visual
- **Estratégia principal:** `marketing/estrategia/ESTRATEGIA-PRINCIPAL.md` e o resumo `references/estrategia.md` (desta skill). LER ANTES do Passo 1 (seção "Estratégia principal" abaixo)
- **Contexto do negócio:** `_memoria/empresa.md`
- **Tom de voz:** `_memoria/preferencias.md`
- **Banco de ganchos:** `references/ganchos.md` — 500 ganchos categorizados, usar no Passo 2
- **Neste workspace, antes do banco genérico:** `.claude/skills/reels-leo/references/ganchos.md` (ganchos já adaptados ao Legalizaí, com pilar, tipo e o fato que entrega; Listas em Vídeo e Curiosidades servem de capa) e `.claude/skills/reels-leo/references/ctas.md` (CTA do slide final e da legenda, na escada do tipo)
- **Playwright:** pra renderizar HTML em PNG (`npx playwright screenshot` ou via `render.js`)
- **OpenAI API (opcional):** pra gerar fotos realistas — só se o cliente tiver chave configurada
- **Outputs vão em:** `marketing/conteudo/<tipo>-<tema>-<YYYY-MM-DD>/`

## Base contábil (obrigatório neste workspace)

Carrossel com número inventado vira multa. Antes do Passo 1:

- Rode `node scripts/sincronizar-base-contabil.mjs`. Se ele avisar que algo mudou no vault, pare e avise o Pedro: `_base-contabil/FATOS.md` precisa de revisão antes da peça.
- Leia inteiros `_base-contabil/FATOS.md` e `_base-contabil/PROIBIDO.md`.
- Todo número, data, prazo, preço, percentual, regra de órgão ou afirmação legal (capa, slide, bloco de oferta, legenda) cita o id do fato em Fontes, no molde `F077 · 07-OBRIGACOES-MENSAIS §5`. As Fontes vão no `texto.md`, nunca no slide publicado.
- O que não está em FATOS.md não é dito: tira o número ("o app mostra o valor certo") ou deixa o assunto pra outra peça, e avisa o Pedro. Fato marcado CONFLITO ou NÃO USAR fica fora, e a linha "Cuidado" de cada fato vale como regra.
- PROIBIDO.md vence esta skill, a memória e o banco de ganchos (preço antigo, "sem letra miúda", prazo de abertura, contador no MEI, economia de imposto).
- Voz do Léo: `_base-contabil/leo/00-SOUL-personalidade.md` e `personagem-leo.md`. Tema de multa, dívida, prazo vencido ou golpe é sério, sem piada.
- Antes de entregar o texto (CHECKPOINT do Passo 3), passe no gate de saída da skill `reels-leo` (§13).

## Estratégia principal (obrigatório neste workspace, antes do Passo 1)

Fonte: `marketing/estrategia/ESTRATEGIA-PRINCIPAL.md` (Pedro, 21/10/2026: "deve ser seguido de forma 100%"). O resumo pro feed estático está em `references/estrategia.md`; o da reels-leo (`.claude/skills/reels-leo/references/estrategia.md`) traz o cuidado de copy de cada pilar, ângulo e gatilho. As regras de copy não mudam a estratégia: valem na hora de escrever o texto.

1. **Ideia do calendário é usada como está** (Pedro, 21/10/2026). Se a ideia vem do calendário da semana (`_base-contabil/estrategia/AAAA-MM-DD-calendario-editorial-semana-*.md`, linhas "Feed · carrossel" e "Feed · imagem única"), a ideia, o formato, o pilar e o motivo (a "defesa") entram EXATAMENTE como estão: nada de tirar, descartar ou reescrever. A skill escreve os slides e a legenda em volta dela. Bateu numa regra de copy (P11, P09...)? A ideia fica, o trecho vai marcado PENDENTE no `texto.md` e você avisa o conflito pro Pedro decidir, sem inventar a troca. A P39 não é pendência: vale em tudo (Pedro, 22/10/2026; seção 0 da estratégia).
2. **Três escolhas e um motivo.** Todo carrossel nasce de um pilar × um gatilho emocional × um gatilho psicológico. O `texto.md` abre com o bloco ESTRATÉGIA (molde no §10 do resumo): os três, o bloco (Afeto 20%, Educação 30%, Diferencial 25%, Conversão 25%), a persona, o Léo, o gancho da capa e o MOTIVO (por que o post existe, em uma ou duas frases). Sem motivo, a peça não está pronta e não passa do Passo 3.
3. **Pilares:** 13 ativos; os guardados (6, 7, 14 e 15) não entram como pauta. No 8, os 9 ângulos giram e nenhum concorrente aparece. Pilar 3 (Nossa origem): a origem do Legalizaí e de quem constrói o produto novo (Pedro, 22/10/2026), com a P39 valendo.
4. **Léo e persona**, como o calendário usa: Léo fora dos pilares 1 e 3 (voz do Pedro ou da empresa), forte nos 2, 4, 5 e 16, só no gancho nos demais, e em 1ª pessoa só com o Léo visível na arte (P29). Dial de ironia pela persona (A e E alto, B médio, D baixo, C zero). A ironia mira o sistema, nunca o cliente.
5. **Convite em 2 níveis.** Nível 1 no corpo (salvar, depois mandar ou compartilhar, depois comentar); nível 2 no fim da legenda e na bio, pelo estágio do funil (hoje, a lista de espera pelo link da bio). O último slide leva o convite do nível que a peça pede. **Post de atração não leva convite de venda**: nem no último slide, nem na legenda.
6. **Anti-repetição** antes de entregar: compare pilar, ângulo e gancho da capa com as peças recentes (onde olhar: §7 do resumo). Repetiu? Outro pilar ou ângulo. De propósito? Diga e registre a exceção com o motivo. Alerta, não bloqueio.
7. **Continuidade:** a caixinha "Pergunta que ninguém explica" é quinzenal, e a resposta sai como carrossel "Traduzindo o contabilês" na semana seguinte (de 3 a 5 dúvidas anônimas, uma por slide). Os outros formatos especiais ("O app em X segundos" e o simulador, só como apoio) são de vídeo.
8. **O app chega dia 10/11/2026** (Pedro, 14/10/2026): diga a data, nunca "baixe agora". WhatsApp não entra como canal da Legalizaí por enquanto.
9. **Legenda:** vale o molde da reels-leo §10 (curta, sem hashtag, um emoji por linha, CTA no começo e no fim, falando com "você" sem recontar os slides), por cima da estrutura de 5 partes da seção de legenda abaixo. O bloco de oferta só entra em peça de venda, e nunca com telefone ou DM com palavra-chave (F009, P12).

---

## Tipos de conteúdo

Ao receber um pedido, identificar qual tipo se encaixa:

### 1. CARROSSEL TEXTO PURO
- **Quando usar:** posts educacionais, dicas, listas, explicações
- **Formato:** 1080x1350 (4:5) — sempre
- **Estilo:** tipografia clean, cores da marca alternadas, sem fotos

### 2. CARROSSEL COM FOTO
- **Quando usar:** apresentação visual, conteúdo aspiracional, capa com personagem
- **Formato:** 1080x1350 (4:5)
- **Estilo:** foto como capa com gradient overlay + slides internos no padrão alternado
- **Foto:** pode ser IA (gerada por OpenAI) ou real (passada pelo usuário)

### 3. POST ÚNICO
- **Quando usar:** frase de impacto, dado/estatística, depoimento, bastidores
- **Formato:** 1080x1350
- **Estilo:** varia conforme o conteúdo (citação, número grande, foto com overlay)

Se o tipo não estiver claro, perguntar:
> "Que tipo de conteúdo? (1) carrossel texto, (2) carrossel com foto, (3) post único"

---

## Visual do Legalizaí: carrossel bem bonitinho (vale por cima do "Estilo visual base")

Pedido do Pedro: carrossel "bem bonitinho". A fonte é `identidade/design-guide.md`, e esta seção resume o que ele manda. O "Estilo visual base" logo abaixo (Inter, peso 900, fundos alternados, logo no topo) é o padrão genérico do MazyOS: neste workspace, onde o design-guide disser outra coisa, vale o design-guide. Cor e fonte, só as do design-guide.

**Tipografia**
- Fonte única **Sora** em tudo (título, corpo, eyebrow, contador), com o import do design-guide. Nada de Inter nem de segunda família.
- **Peso máximo 800** (a Sora não tem 900).
- Escala no 1080x1350: capa de 76 a 92 px, peso 800, line-height 1.02, letter-spacing -0.03em · H2 de 54 a 64 px, peso 700, -0.025em · corpo de 26 a 30 px, peso 400 a 500, line-height 1.5 · eyebrow de 15 a 17 px, peso 700, CAIXA ALTA, 0.22em, coral · contador de página 15 px, peso 500, 0.18em, cor muted.

**Hierarquia**
- Em cada slide, o título manda; o eyebrow é pequeno e espaçado; o corpo apoia.
- Uma palavra forte em coral por frase de destaque.
- Número no início do título, em coral, com o trecho-chave destacado (estilo v2).

**Paleta** (2 cores: coral é marca e ação, ink é estrutura; o resto é estado)
- Fundo papel quente `#FAF8F5`, nunca branco puro de página. Card branco `#FFFFFF`. Superfície alternada `#F1EEE9`.
- Slide escuro, quando houver: página `#15171C`, card `#1F2228`, superfície `#282B32`. Os gradientes do design-guide são só pra slide escuro e capa.
- Coral de marca `#F2643C`. Botão no claro: coral-600 `#DD4E27` ou coral-700 `#B83D1C`; no escuro, coral `#F2643C`. Tint `#FEF3EE`.
- Texto: ink `#1B1E24` no claro, `#F4F1EC` no escuro. Secundário: `#524E48` no claro, `#BDB8B0` no escuro.
- Borda hairline 1 px `#E3DED7` no claro, `#2E313A` no escuro; forte `#CBC5BC`. Sem sombra.
- Success `#17A06A`, warning `#F5A524` e erro `#E03E43` só pra estado, nunca enfeite.
- Nunca: azul como marca, coral como erro, `#A19B92` como texto de leitura, coral `#F2643C` como fill de botão no fundo claro, mais de uma cor de destaque na peça.

**Estilo vigente (v2 híbrido, validado no carrossel "5 sinais")**
- Fundo creme em todos os slides (vale por cima do "alternar escuro, claro e destaque" do Estilo visual base).
- Ilustrações 3D clay (coral, creme e ink), geradas por IA sem texto, em círculos ou tiles arredondados.
- Caixinha de dica com lâmpada. Quarto de círculo coral no canto.
- **Tag ME / MEI** no canto superior esquerdo de todo carrossel e post: pill com fundo `#FEF3EE`, borda 1.5px `#F2643C`, texto `#B83D1C`, 17 px, peso 700, letter-spacing .16em, radius 999, padding 12x26. Por isso o logo vai no rodapé esquerdo, com a tagline "Contabilidade Digital" (por cima do "logo top-left" do Estilo visual base).
- Pill "Arrasta pro lado" na capa. End card de conversão com botão coral.
- Raio: 16 px nos cards, 12 px em botões e chips, 24 px em superfícies grandes, 999 nas pills.
- Logo: `identidade/logos/legalizai-logo-horizontal.svg` no claro, `identidade/logos/legalizai-logo-negativa-clara.svg` no escuro, de 140 a 200 px de largura.

**Régua e vistos**
- Régua fina coral (3 a 4 px de altura, 60 a 80 px de largura) entre kicker e título, sempre numa linha própria. Nunca colada antes de um texto na mesma linha: lê como travessão (P26).
- Todo visto (check) é o símbolo da marca, `identidade/logos/simbolo.svg` (o design-guide lista o símbolo como selo), nunca um visto genérico. O ícone fica inteiro: nada cortado, nada atrás de outro elemento (Pedro, 07/10/2026).

**Margem de segurança** (design-guide, Pedro, 09/10/2026)
- Nada de texto, card, ícone, ilustração ou aparelho encostando na borda. Fundo, partícula e brilho podem ir até a borda.
- No 1080x1350, o padding de 70 a 100 px do Estilo visual base é o mínimo nas laterais, e nada encosta em cima nem embaixo.
- Na versão 9:16 (1080x1920, só quando pedida): 96 px das laterais, 240 px do topo e 360 px da base.

**Poucas palavras, uma ideia por slide**
- Capa: o gancho do banco (Passo 2), intocável e curto. Pode ganhar uma linha de apoio e a pill "Arrasta pro lado".
- Um slide, uma ideia: um título curto e, no máximo, um parágrafo de apoio de até 3 linhas, com no máximo um número-chave (com id; o preço é a exceção da reels-leo §1).
- Último slide: o convite do nível que a peça pede (Estratégia principal, item 5).
- Nada de texto dentro de imagem gerada por IA: toda tipografia nasce no HTML.

**Conferência visual de cada PNG, antes de mostrar**
- A Sora carregou (o texto não caiu pra fonte padrão) e nenhum peso passa de 800.
- Nada encosta na borda. Uma cor de destaque só. Nenhuma régua colada em texto. Nenhum travessão.
- Os vistos são o símbolo inteiro. A tag ME / MEI está no canto superior esquerdo.
- Cada slide se lê numa olhada: título, no máximo um parágrafo, no máximo um número.

## Estilo visual base

O MazyOS tem um estilo próprio — editorial, calmo, premium. Sem clip-art, sem emoji decorativo, sem gradiente arco-íris, sem template genérico de IA. `identidade/design-guide.md` sobrescreve esses padrões; quando o design-guide for vago ou estiver em branco, usar o que tá aqui (não parar pra pedir `/instalar` — o `/carrossel` funciona com defaults bons).

### Tipografia padrão

- **Fonte:** Inter (Google Fonts), pesos 400/500/600/700/800/900
- **Título de capa:** 90-100px, weight 900, line-height 0.98, letter-spacing **-0.04em**
- **H2 (slides internos):** 60-72px, weight 800, line-height 1.04, letter-spacing **-0.035em**
- **Corpo:** 20-24px, weight 500, line-height 1.5
- **Eyebrow/kicker:** 13-16px, weight 700-800, **UPPERCASE**, letter-spacing **0.22-0.32em**, cor de destaque
- **Page counter (canto sup. dir.):** 14-16px, weight 500-600, letter-spacing 0.18em, cor muted
- **Meta/handle (@):** 15-18px, weight 600

Regra do tipo: títulos grandes com kerning **apertado** (-0.035em), eyebrows pequenos com kerning **aberto** (0.22em+). Esse contraste é o coração do estilo.

### Cores padrão (quando design-guide for vago)

Paleta sóbria: fundo dark + off-white + **UMA** cor de destaque. Nunca quatro cores brigando.

- Fundo escuro: `#0E1116` ou `#1A1A1A`
- Fundo claro alternativo: `#F5ECD7` (cream) ou `#FAFAF7`
- Texto sobre escuro: `#FAFAF7`
- Texto sobre claro: `#1A1A1A` (h2) e `#444` (corpo)
- Destaque: cor da marca (uma só)

### Elementos visuais recorrentes

- **Régua fina** (3-4px de altura, 60-80px de largura, cor de destaque) entre kicker e h2 ou como divisor
- **Logo top-left + page counter top-right** em todos os slides
- **Border-top 1px** `rgba(255,255,255,0.12)` separando rodapé do conteúdo (em slides escuros)
- **Stamps circulares** (200x200, border 3px translúcida, rotate -10deg) pra selos/datas/dados
- **Tags/pills** uppercase, padding generoso, kerning 0.2em, pra rotular categoria do slide
- Padding base: 70-100px nas laterais

### Layouts nomeados

Vocabulário de layout — cada slide tem um nome. Variar entre eles pra criar ritmo:

- **CAPA** — eyebrow + gancho como título grande + linha de apoio opcional + @handle. Fundo: foto com gradient overlay (`rgba(12,10,9,0.55)` → `rgba(12,10,9,0.85)`) OU sólido (escuro/claro/destaque)
- **SOLO** — split horizontal: foto à esquerda 50% + texto à direita 50% (kicker + h2 + régua + parágrafo)
- **DUO** — texto em cima (kicker + h2 + régua + p) + 2 fotos lado a lado embaixo (ou 1 foto larga)
- **NÚMERO** — numeral gigante (200-320px, weight 800, cor de destaque) como elemento gráfico + h2 + parágrafo de apoio
- **CITAÇÃO** — aspas grandes em watermark + frase em h2 + atribuição
- **CTA FINAL** — fundo na cor de destaque, logo centralizado, headline curta, botão/CTA, telefone/@handle

**Ritmo de slide a slide:** alternar fundo escuro ↔ claro ↔ destaque. Nunca dois slides seguidos com o mesmo fundo.

---

## Padrão do carrossel

**Estrutura base (6 a 10 slides — ajustar pela profundidade do tema):**
- **Slide 1:** layout `CAPA` — o gancho escolhido no Passo 2, **sem alterar nenhuma palavra**
- **Slides internos:** usar 2-3 layouts diferentes entre `SOLO` / `DUO` / `NÚMERO` / `CITAÇÃO`
- **Slide final:** layout `CTA FINAL` — alinhado ao objetivo definido no Passo 1

Antes de criar HTML: ler `identidade/design-guide.md`. Se estiver em branco, usar o "Estilo visual base" acima como default.

### Sequência de capas no feed (planejamento de grade)

Antes de definir a capa, considerar a **última capa publicada** pra alternar:
- claro → próxima é foto/escuro
- foto/escuro → próxima é cor da marca
- cor da marca → próxima é claro
- nunca duas capas iguais em sequência

Se o usuário não souber qual foi a última, perguntar.

### Regras de escrita (regra crítica)

Seguir `_memoria/preferencias.md` sempre. Além disso, em todo slide:

- **Um conceito central por slide** — pode ter múltiplos parágrafos pra desenvolvê-lo
- **Cada parágrafo tem no máximo 3 linhas** — sem exceção
- **Progressão lógica:** cada slide abre o próximo naturalmente, criando vontade de arrastar
- **Linguagem topo de funil:** qualquer pessoa do nicho precisa entender; profundidade sim, jargão não
- **Sem listas com bullets** nos slides — se precisar enumerar, escrever em linha corrida
- **Sem travessões**, nem hífen solto entre espaços (" - ") no lugar deles
- **Colaborador, nunca "funcionário"** (Pedro, 22/10/2026), na mesma concordância: "Até 2 colaboradores", "Se você tem colaborador", "a colaboradora". Vale em capa, slide, arte e legenda; a conferência do Ateliê barra
- **Sem estruturas de oposição semântica** ("não é X, é Y")
- **Sem expressões com cara de IA:** "mergulhar", "navegar", "no mundo de hoje", "em um mundo onde", "nesse cenário"
- Frases naturais, sem corporativês. O público real raramente fala "ticket médio", "performance", "B2B". Falar como ele fala.

### Legenda — sempre gerar junto

Ao terminar de renderizar os PNGs, gerar **automaticamente** a legenda do post e salvar em `legenda.md` na mesma pasta. **Não esperar o usuário pedir.** Estrutura padrão:

1. Hook (pergunta ou afirmação — pode ecoar o gancho da capa)
2. Contexto (1-2 frases sobre o conteúdo)
3. CTA pra arrastar ("Arraste pro lado e confere")
4. CTA do objetivo (a mesma ação definida no Passo 1: seguir, salvar, DM, link da bio)
5. Bloco de oferta (diferenciais da empresa, contato)

Sem hashtag, e a legenda curta e assertiva, com um emoji no começo de cada linha (Pedro, 06/10/2026).

---

## Workflow

### Passo 1 — Entender e planejar

1. Ler `_memoria/preferencias.md` e `_memoria/empresa.md`
2. Ler `identidade/design-guide.md` pra cores, fontes e logo
3. Identificar o tipo de conteúdo (1, 2 ou 3)
4. Definir o tema e o ângulo
5. Coletar o que a memória não responder (perguntar só o que faltar, em lista simples):
   - **Tema ou ideia central** — o que esse carrossel vai abordar?
   - **Objetivo da CTA final** — o que a pessoa deve fazer depois de ler? (salvar, seguir, DM com palavra-chave, link na bio)
   - **Tom** — se `preferencias.md` já define, usar direto sem perguntar

### Passo 2: Gancho

**Regra do Pedro (09/10/2026):** a capa sempre usa um gancho do banco, adaptado ao assunto. Primeiro a
curadoria da `reels-leo` (`.claude/skills/reels-leo/references/ganchos.md`, códigos G); fora dela, os
500 de carrossel deste `references/ganchos.md` ou o banco inteiro numerado em
`.claude/skills/reels-leo/references/banco-1000-ganchos.md`. Gancho inventado fora do banco não sai, e
o carrossel anota de onde veio ("G68", "banco 29").

O gancho é o título da capa e decide se o resto será lido. Perguntar:

> "Você já tem o gancho desse carrossel ou quer sugestões do banco?"

**Se já tem:** usar exatamente como fornecido, sem alterar nenhuma palavra.

**Se quer sugestões:** consultar `references/ganchos.md`, filtrar por alinhamento com nicho, tema e tom, e apresentar **3 opções numeradas** com os marcadores (`[tema]`, `[área]`, `[resultado]`...) já adaptados ao contexto real. Se nenhuma agradar, oferecer mais 3 diferentes. Repetir até confirmar uma.

O gancho escolhido é **intocável** — vira o título da capa palavra por palavra. Pode ganhar uma linha de apoio abaixo, mas o gancho não muda.

### Passo 3 — Texto

Escrever o conteúdo seguindo as "Regras de escrita" acima:

**Pra carrossel (6-10 slides):**
- Slide 1 (Capa): o gancho, intocável + linha de apoio opcional
- Slides internos: um conceito por slide, progressão que puxa o arraste
- Slide final: CTA direta e específica, alinhada ao objetivo do Passo 1 — uma instrução clara de ação, com reforço emocional antes se fizer sentido

**Pra post único:**
- Frase principal em destaque
- Contexto de apoio (se necessário)
- CTA sutil

Apresentar o texto neste formato antes de qualquer visual:

```
📌 SLIDE 1 — CAPA
[gancho]

📌 SLIDE 2
[conteúdo]

...

📌 SLIDE N — CTA
[chamada para ação]
```

**CHECKPOINT:** Mostrar o texto completo. Esperar aprovação antes do visual.

### Passo 4 — Gerar fotos (se tipo 2)

Só se o usuário pediu carrossel com foto IA.

1. Montar prompt em inglês (a API funciona melhor em inglês)
2. Padrão genérico de prompt:

```
Professional [TIPO] photography of [ASSUNTO],
[DETALHES], [AMBIENTE/CONTEXTO],
[ESTILO DE LUZ] lighting, shallow depth of field,
shot from [ÂNGULO], [ESTILO/ESTÉTICA],
editorial quality
```

3. Gerar via script (se `scripts/gerar-imagem.js` existir):
```bash
node --env-file=.env scripts/gerar-imagem.js "PROMPT" "marketing/conteudo/<pasta>/foto-<nome>.png"
```

Se não tiver o script ainda, instruir o usuário a configurar `OPENAI_API_KEY` no `.env` e criar o script (ou usar outra ferramenta de geração de imagem).

4. Mostrar a foto pro usuário antes de continuar.

**CHECKPOINT:** Foto aprovada → seguir. Se não, ajustar prompt e regenerar.

### Passo 5 — Criar visuais (HTML + PNG)

1. Criar **um único `carrossel.html`** com TODOS os slides como `<div class="slide">` dentro do mesmo arquivo. Inline CSS, Google Fonts como única dependência externa. Aplicar:
   - Cores e tipografia de `identidade/design-guide.md`
   - Mínimo 2 layouts diferentes (não repetir o mesmo em todos os slides)
   - Logo top-left + slide-counter top-right em todos os slides
   - Slide final: logo + CTA, fundo na cor principal

   **Pra incluir foto IA no HTML:**
   ```html
   <div class="slide" style="
     background-image: linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.7)), url('foto-xxx.png');
     background-size: cover;
     background-position: center;
   ">
     <div class="content">
       <h2>Texto sobre a foto</h2>
     </div>
   </div>
   ```

2. Criar `render.js` na mesma pasta — script Node com Playwright que abre o HTML e tira screenshot de cada `.slide` em 1080x1350. Pode reutilizar `node_modules` de uma pasta anterior (não precisa rodar `npm install` toda vez):
```bash
NODE_PATH="<pasta-com-node_modules>/node_modules" node render.js
```

3. Mostrar slide 1, 2 e o CTA final renderizados. Se aprovado, mostrar os intermediários.

### Passo 6 — Salvar e organizar

```
marketing/conteudo/<tipo>-<tema>-<YYYY-MM-DD>/
  texto.md              ← texto aprovado + legenda
  foto-<nome>.png       ← fotos geradas por IA (se houver)
  carrossel.html
  render.js
  instagram/
    slide-01.png → slide-NN.png
  tiktok/ (se pedido — formato 9:16)
    slide-01.png → ...
  legenda.md            ← legenda Insta+FB
  legenda-linkedin.md   ← (se pedido, mais formal)
```

### Passo 7 — Conexão com blog (opcional)

Depois de criar o conteúdo visual, perguntar:

> "Esse conteúdo dá pra virar artigo no blog também. Quer que eu crie a versão blog pra SEO?"

Se sim, chamar `/publicar-tema` com o mesmo tema.

---

## Regras

- Sempre ler `identidade/design-guide.md` antes de criar qualquer visual
- Gancho escolhido é intocável — nunca reescrever, nem "melhorar"
- Sem gancho definido → sempre oferecer 3 opções do `references/ganchos.md` antes de escrever
- Carrossel: 1080x1350 (4:5 retrato) — sempre. TikTok/Reels: 1080x1920 (9:16) — só quando pedido explicitamente
- Linguagem segue `_memoria/preferencias.md` + "Regras de escrita" desta skill estritamente
- Sempre considerar a sequência de capa no feed antes de definir capa nova
- Sempre gerar legenda automaticamente ao final, salvando em `legenda.md`
- Fotos IA: sempre pedir aprovação antes de usar no carrossel
- Fotos IA: prompts em inglês
- Fotos IA: nunca gerar fotos de pessoas/rostos identificáveis
- HTMLs: um único arquivo `carrossel.html` com todos os slides + `render.js` na mesma pasta. Inline CSS
- Render: reutilizar `node_modules` quando possível (não rodar `npm install` em cada pasta)
- Não repetir layout entre slides — usar variação visual

---

## Referências

- `references/ganchos.md` — Banco com 500 ganchos pra carrosséis, organizados por categoria (Listas, Storytelling, Curiosidades, Afirmações Ousadas, Polêmicas, Tutoriais, Comparativos, Motivação, Resultados, Perguntas, Dicas Rápidas). Consultar sempre que o usuário não tiver gancho definido. Filtrar por nicho, tema e tom antes de sugerir.
- `references/estrategia.md`: a estratégia principal no feed estático (calendário usado como está, pilar, gatilhos, bloco e motivo, persona e Léo, convite em 2 níveis slide a slide, anti-repetição, o "Traduzindo o contabilês" e o molde do bloco ESTRATÉGIA do `texto.md`).
