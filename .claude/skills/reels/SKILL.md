---
name: reels
description: >
  Cria conteúdo pra Reels curtos no Instagram: gancho (texto de tela) + legenda com CTA
  personalizada, no tom da marca. Usa banco de ganchos em references/ganchos-reels.md.
  Use quando o usuário pedir "reel", "reel curto", "vídeo curto", "gancho para reel",
  "legenda para reel", "criar reel", "conteúdo para reel", ou /reels.
  Não usar pra carrosséis (usar /carrossel), stories ou roteiros longos.
---

# /reels — Reels curtos

Cada reel curto tem dois componentes que essa skill entrega juntos:

**1. Gancho** — texto curto que aparece na tela nos primeiros segundos do vídeo. Direto, impactante, e sempre terminando com uma chamada pra legenda: "continua na legenda", "lê a legenda", "detalhes na legenda".

**2. Legenda** — desenvolvimento do que o gancho prometeu. Parágrafos curtos (máximo 3 linhas cada), quebras de linha deliberadas, nunca ultrapassando 2.200 caracteres (limite do Instagram).

Estrutura obrigatória da legenda:

```
[CTA de objetivo do criador]

[Desenvolvimento sobre o gancho]

[CTA final — pode repetir a de cima ou variar]
```

A CTA de objetivo pode ser direcionada a: seguidor, venda, consulta, link na bio, direct, salvamento do post. O criador define o objetivo — a skill só precisa saber qual é.

## Dependências

- **Contexto do negócio:** `_memoria/empresa.md` — nicho e posicionamento saem daqui
- **Tom de voz:** `_memoria/preferencias.md` — LER ANTES de escrever qualquer linha
- **Foco atual:** `_memoria/estrategia.md` — se já define objetivo de conteúdo, propor a CTA a partir dele
- **Banco de ganchos:** `references/ganchos-reels.md`
- **Outputs vão em:** `marketing/conteudo/reel-<tema>-<YYYY-MM-DD>/reel.md`

---

## Fluxo obrigatório — seguir esta ordem sempre

### Etapa 1 — Tema e origem do gancho

Ler os arquivos de `_memoria/` primeiro. Depois fazer estas duas perguntas na mesma mensagem:

**A — Tema:** sobre o que é o reel? Quanto mais contexto, melhor o gancho e a legenda.

**B — Origem do gancho:** já tem um gancho definido ou quer sugestões do banco?

- **"Já tenho"** → usar exatamente como fornecido, sem alterar nenhuma palavra. Ir pra Etapa 3.
- **"Quero sugestões"** → Etapa 2.

### Etapa 2 — Sugerir ganchos do banco

Com base no tema, selecionar **3 ganchos** de `references/ganchos-reels.md` que melhor se encaixem — adaptando os marcadores `[tema]`, `[área]`, `[resultado]`, `[tempo]` ao contexto real do negócio.

Apresentar as 3 opções numeradas e perguntar qual agrada. Se nenhuma, oferecer mais 3 diferentes. Repetir até confirmar. Só avançar depois da confirmação.

### Etapa 3 — CTA personalizada

Perguntar qual é o objetivo principal desse reel e qual CTA usar. Essa informação abre e fecha a legenda — precisa refletir a ação que o criador quer do seguidor. Se `_memoria/estrategia.md` já aponta um objetivo, propor a CTA pronta e só pedir confirmação.

Exemplos pra orientar:
- Seguidor: "Me segue para mais conteúdos como esse"
- Venda: "Acessa o link na bio para garantir o seu"
- Consulta: "Manda 'CONSULTA' aqui no direct"
- Engajamento: "Comenta aqui embaixo se você já passou por isso"

### Etapa 4 — Gerar o conteúdo completo

Entregar neste formato:

```
**GANCHO (texto de tela)**
[gancho — direto, curto, terminando com chamada pra legenda]

---

**LEGENDA**

[CTA de objetivo]

[Desenvolvimento — parágrafos de no máximo 3 linhas, quebras deliberadas]

[CTA final — mesma da abertura ou variação]
```

O desenvolvimento deve aprofundar o que o gancho prometeu. Objetivo, uma ideia por parágrafo.

Depois de aprovado, salvar em `marketing/conteudo/reel-<tema>-<YYYY-MM-DD>/reel.md` com gancho + legenda + tema + CTA registrados.

---

## Regras de escrita

- Seguir `_memoria/preferencias.md` estritamente
- Parágrafos de no máximo 3 linhas, uma ideia por parágrafo
- Quebras de linha entre parágrafos
- Linguagem direta, como alguém explicando pra um amigo
- Sem travessões
- Sem estruturas de oposição semântica ("não é X, é Y")
- Sem expressões com cara de IA: "mergulhar", "navegar", "no mundo de hoje", "em um mundo onde", "nesse cenário"
- SEO keywords integradas naturalmente ao texto, nunca listadas separadamente
- Total da legenda: respeitar o limite de 2.200 caracteres do Instagram
- Gancho escolhido é intocável — nunca reescrever nem "melhorar"

---

## Exemplo de entrega completa

**Tema:** ansiedade em mães de primeira viagem
**Gancho escolhido:** "Se você está em [situação], esse vídeo é para você"
**CTA do criador:** "Me segue aqui para mais conteúdos sobre saúde mental materna"

---

**GANCHO (texto de tela)**
Se você é mãe de primeira viagem e sente que está falhando, esse vídeo é pra você.
Continua na legenda.

---

**LEGENDA**

Me segue aqui para mais conteúdos sobre saúde mental materna.

A ansiedade no primeiro ano de maternidade tem nome, tem explicação e tem saída.

Ela aparece porque o seu sistema nervoso está processando uma mudança enorme de identidade.
Você passou a noite acordada, amamentou, cuidou.
E ainda assim a sensação é de que não fez o suficiente.

Isso tem a ver com como o cérebro de mães recém-chegadas processa ameaça.
Cada choro vira alerta máximo.
Cada dúvida vira prova de incompetência.

Só que isso é adaptação, não falha.
E adaptação leva tempo.

Se você identificou isso em você, me chama aqui no direct com a palavra CONVERSA.
Vou te explicar os próximos passos.

---

## Conexão com as outras skills

- Tema rendeu bem em reel → sugerir versão carrossel via `/carrossel` (e vice-versa)
- Se o usuário pedir o vídeo em si (roteiro longo, edição), isso está fora dessa skill — ela entrega gancho + legenda
