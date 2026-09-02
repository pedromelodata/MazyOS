---
name: carrossel
description: >
  Cria carrosséis e posts visuais pra Instagram, TikTok, LinkedIn com a identidade visual da marca.
  Fluxo completo: gancho (banco com 500 opções em references/ganchos.md) → texto slide a slide →
  HTML estilizado → PNG 1080x1350 via Playwright → legenda pronta no final.
  Suporta carrossel texto puro, carrossel com foto IA (gerada via OpenAI) e post único.
  Use quando o usuário pedir "carrossel", "post", "conteúdo pro instagram", "criar imagem",
  "gerar foto", "post educativo", "gancho pra carrossel", "reciclar carrossel", ou /carrossel.
---

# /carrossel — Carrossel e posts visuais

Skill central de criação de conteúdo visual. Pega um tema → escolhe o gancho → escreve o texto → entrega HTMLs estilizados + PNGs prontos pra postar + legenda no padrão da marca.

## Dependências

- **Identidade visual:** `identidade/design-guide.md` — LER ANTES de criar qualquer visual
- **Contexto do negócio:** `_memoria/empresa.md`
- **Tom de voz:** `_memoria/preferencias.md`
- **Banco de ganchos:** `references/ganchos.md` — 500 ganchos categorizados, usar no Passo 2
- **Playwright:** pra renderizar HTML em PNG (`npx playwright screenshot` ou via `render.js`)
- **OpenAI API (opcional):** pra gerar fotos realistas — só se o cliente tiver chave configurada
- **Outputs vão em:** `marketing/conteudo/<tipo>-<tema>-<YYYY-MM-DD>/`

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
- **Sem travessões**
- **Sem estruturas de oposição semântica** ("não é X, é Y")
- **Sem expressões com cara de IA:** "mergulhar", "navegar", "no mundo de hoje", "em um mundo onde", "nesse cenário"
- Frases naturais, sem corporativês. O público real raramente fala "ticket médio", "performance", "B2B". Falar como ele fala.

### Legenda — sempre gerar junto

Ao terminar de renderizar os PNGs, gerar **automaticamente** a legenda do post e salvar em `legenda.md` na mesma pasta. **Não esperar o usuário pedir.** Estrutura padrão:

1. Hook (pergunta ou afirmação — pode ecoar o gancho da capa)
2. Contexto (1-2 frases sobre o conteúdo)
3. CTA pra arrastar ("Arraste pro lado e confere")
4. CTA do objetivo (a mesma ação definida no Passo 1: seguir, salvar, DM, link na bio)
5. Bloco de oferta (diferenciais da empresa, contato)
6. Hashtags (10-15 — público + nicho + local se aplicável)

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

### Passo 2 — Gancho

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
