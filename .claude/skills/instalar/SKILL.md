---
name: instalar
description: >
  Instala o MazyOS no negócio do usuário. Primeiro pergunta se é empresa ou marca pessoal
  e segue a entrevista certa pra cada caminho: empresa (negócio, tom de voz, foco, identidade
  visual) ou marca pessoal (nicho, pilares, público, bio, mecanismo único, linha de produção —
  ver `references/entrevista-marca-pessoal.md`). Preenche `_memoria/empresa.md`,
  `_memoria/preferencias.md`, `_memoria/estrategia.md`, `identidade/design-guide.md` e adapta
  o `CLAUDE.md` conforme o perfil. Use quando o usuário acabou de clonar o repositório e quer
  instalar o sistema, ou quando pedir explicitamente "rodar /instalar", "instalar o MazyOS",
  "primeiro setup".
---

# /instalar — Instalação inicial do MazyOS

Esse é o primeiro comando que o usuário roda depois de clonar o repositório. Não pode falhar e não pode soar burocrático. Trata como conversa de descoberta — pergunta uma coisa por vez, escuta de verdade, não enfileira tudo. O objetivo é o sistema sair daqui sabendo quem é o negócio (ou quem é a pessoa), como fala, e onde tá o atrito do dia a dia.

## Pré-checagem

### 1. Nome da pasta

Conferir o nome da pasta atual (`basename "$(pwd)"`). Se for `mazyos`, `MazyOS`, `MazyOS-main`, `mazyos-main` ou variação genérica:

> "Notei que a pasta atual ainda tem nome genérico ('<nome-atual>'). O ideal é a pasta ter o nome do seu negócio, não 'MazyOS'. Quando terminarmos o setup, te lembro de renomear (é rápido — fechar VS Code, renomear a pasta no Finder/Explorer, abrir de novo). Bora seguir?"

Registrar mentalmente o nome atual pra usar na fase de renomear.

### 2. Arquivos de contexto

Conferir se algum arquivo de memória já está preenchido (não é placeholder):
- `_memoria/empresa.md`
- `_memoria/preferencias.md`
- `_memoria/estrategia.md`
- `identidade/design-guide.md`

Se algum já tiver conteúdo real, perguntar:
> "Já tem algum contexto preenchido aqui. Quer que eu sobrescreva (recomeçar do zero) ou complemente o que falta?"

Se for setup limpo, seguir direto.

---

## Fase 1 — Empresa ou marca pessoal?

**Primeira pergunta do setup, antes de qualquer outra:**

> "Antes de tudo: o MazyOS vai rodar o quê?
>
> 1. **Uma empresa** — negócio com clientes, produtos ou serviços
> 2. **Uma marca pessoal** — você, crescendo como criador(a) no Instagram"

A resposta decide o caminho da entrevista:

- **Empresa** → seguir o **Caminho A** abaixo
- **Marca pessoal** → seguir o **Caminho B** abaixo

Se o usuário disser "os dois" (solopreneur que mistura), seguir o Caminho A com perfil solopreneur e, ao final, oferecer complementar com as seções de posicionamento do Caminho B que fizerem falta (nicho, pilares, bio).

---

# CAMINHO A — Empresa

## Fase A2 — Escolha do perfil

Perguntar qual perfil mais combina com o negócio:

1. **Solopreneur / criador solo** — uma pessoa só, mistura de marca pessoal e negócio
2. **Freelancer** — atende clientes, organiza por projeto/cliente
3. **Agência / consultoria** — equipe pequena entregando pra vários clientes
4. **Empresa** — empresa estabelecida com setores (marketing, comercial, financeiro, etc.)

A resposta determina qual template de `CLAUDE.md` aplicar (ver `templates/perfis/`).

## Fase A3 — Entrevista

Fazer essas perguntas em ordem, esperando a resposta de cada uma antes de seguir. Se vier resposta vaga, repetir uma vez pedindo concretude. Não insistir mais que isso — registrar o que vier.

**Sobre o negócio:**
1. "Como você chama o que você faz? (nome da empresa, ou seu nome se for marca pessoal)"
2. "O que sua empresa entrega, em uma frase do jeito que você falaria pro vizinho?"
3. "Quem te paga? (perfil de cliente real — descreve em uma ou duas frases, sem persona genérica)"
4. "Você toca sozinho ou tem equipe? Se tem, quantos e cada um fazendo o quê?"

**Sobre voz:**
5. "Me cola um exemplo da tua escrita — uma legenda do Insta, um email pra cliente, qualquer coisa real e recente. Assim eu calibro o jeito de escrever sem precisar adivinhar."
6. "O que te dá ranço quando alguém escreve assim? (ex: 'vamos juntos!', emoji em email formal, 'caro cliente', jargão de guru, 'alavancar', 'sinergia')"

**Sobre foco:**
7. "Qual o gargalo do teu negócio hoje? O que tá segurando ele de crescer?"
8. "Se eu pudesse tirar UMA coisa que você repete toda semana das tuas costas, qual seria?"

**Sobre identidade visual:**
9. "Tem identidade visual definida ou tá no zero? Se tem, me passa as cores principais e a fonte."
10. "Tem logo? Se sim, joga o arquivo em `identidade/logo.png` (ou `.svg`) e me confirma."

## Fase A4 — Preenchimento dos arquivos

### `_memoria/empresa.md`
Preencher com base nas perguntas 1-4. Manter formato simples — nome, o que faz, perfil de cliente, equipe.

### `_memoria/preferencias.md`
Preencher com base nas perguntas 5-6. Estrutura:
- **Tom de voz:** derivar do exemplo de escrita real da pergunta 5 (descrever em 2-3 frases o jeito de escrever, com referência ao exemplo)
- **O que evitar:** lista direta da resposta 6
- **Estilo geral:** síntese do que combina e o que destoa

### `_memoria/estrategia.md`
Preencher com base nas perguntas 7-8. Estrutura:
- **Gargalo atual:** [resposta da 7]
- **Pra tirar das costas:** [resposta da 8] — registrar como candidata a virar skill via `/mapear-rotinas`
- **Próximas prioridades:** derivar do gargalo (o que ataca o gargalo direto)

### `identidade/design-guide.md`
Se o usuário forneceu cores/fontes/logo (perguntas 9-10), preencher os campos correspondentes. Se não, deixar como está e avisar:
> "Deixei o `identidade/design-guide.md` em branco. Sempre que você definir uma identidade visual, edita lá — as skills de carrossel, proposta e slide leem esse arquivo antes de criar qualquer visual."

### `CLAUDE.md`
Pegar o template correspondente ao perfil escolhido na Fase A2 (`templates/perfis/claude-md-<perfil>.md`), adaptar com o nome do negócio e estrutura de pastas mencionada nas respostas, e sobrescrever o `CLAUDE.md` da raiz.

Depois seguir pras **Fases finais** (compartilhadas).

---

# CAMINHO B — Marca pessoal

## Fase B2 — Entrevista de marca pessoal

Conduzir a entrevista completa de `references/entrevista-marca-pessoal.md` — 9 seções, **uma seção por vez**, esperando a resposta de cada uma antes de seguir:

01. Nicho
02. Pilares de conteúdo
03. Marca pessoal (valores, impacto, como quer ser visto, o que nunca faria)
04. Público
05. Bio
06. Mecanismo único (diferencial)
07. Identidade e comunicação
08. Formato de conteúdo
09. Linha de produção

Regras da entrevista (valem pra todas as seções):
- Nunca fazer todas as perguntas de uma vez — sempre uma seção por vez
- Se o usuário travar, dar exemplos práticos sem pressionar
- Resposta muito curta ou vaga → um follow-up simples pra aprofundar, sem insistir mais que isso
- Preservar as respostas como o usuário deu — não reescrever nem "melhorar"
- Seção pulada ou "não sei" → registrar como "A definir"

## Fase B3 — Preenchimento dos arquivos

Mapear as respostas pros arquivos de memória (o mapeamento detalhado por campo está no final de `references/entrevista-marca-pessoal.md`):

### `_memoria/empresa.md`
Posicionamento da marca: nicho, pilares de conteúdo, público (as 7 respostas), bio, mecanismo único e frase de posicionamento. É o "quem sou eu como marca" que todas as skills leem.

### `_memoria/preferencias.md`
- **Tom de voz:** estilo de comunicação escolhido (engraçada / séria / professor / motivacional / opinião / storytelling)
- **Valores e limites:** valores, como quer ser visto, e o que NUNCA faria como conteúdo
- **Os 3 mandamentos:** as regras que o perfil nunca quebra

### `_memoria/estrategia.md`
- **Formato principal:** reels / carrossel / stories / misto + estilo de conteúdo
- **Linha de produção:** frequência semanal + tipos de conteúdo escolhidos
- **Impacto que quer gerar:** vira o norte das prioridades

### `identidade/design-guide.md`
Cores e fonte informados na seção 07. Se estiver no zero, deixar em branco e avisar (igual ao Caminho A).

### `CLAUDE.md`
Aplicar o template **solopreneur** (`templates/perfis/claude-md-solopreneur.md`), adaptado com o nome da pessoa/marca.

## Fase B4 — Guia de Marca Pessoal (opcional)

Depois de preencher a memória, oferecer:

> "Tua marca pessoal agora vive na memória do MazyOS — todas as skills já vão criar conteúdo com esse posicionamento. Quer que eu gere também o **Guia de Marca Pessoal em .docx**? É um documento com tudo organizado, que você pode guardar ou colar em qualquer outra IA."

Se sim, gerar o `.docx` seguindo a estrutura descrita em `references/entrevista-marca-pessoal.md` (usando a skill `docx` do Claude Code) e salvar em `saidas/guia-marca-pessoal.docx`.

Depois seguir pras **Fases finais**.

---

# Fases finais (os dois caminhos)

## Resumo

Mostrar pro usuário o que foi configurado:

```
✓ Caminho: [empresa — perfil X | marca pessoal]
✓ Contexto: _memoria/empresa.md
✓ Tom de voz: _memoria/preferencias.md
✓ Foco atual: _memoria/estrategia.md
✓ Marca: identidade/design-guide.md  [preenchida | em branco — preencher depois]
✓ CLAUDE.md adaptado
```

## Renomear pasta (se necessário)

Se a pasta atual ainda tem nome genérico (detectado na Pré-checagem), gerar slug do nome do negócio ou da pessoa:
- minúsculas
- sem acentos
- espaços viram hífen
- caracteres especiais removidos

Ex: "Acme Empresa Ltda" → `acme-empresa-ltda`

Mostrar:

> "Última coisa: a pasta ainda tá com nome genérico ('<nome-atual>').
> Pra ter cara do seu negócio, recomendo renomear pra '<slug>'.
>
> Como fazer:
> 1. Fecha o VS Code
> 2. Renomeia a pasta no Finder (Mac) ou Explorer (Windows) — ou no
>    terminal fora dela: `mv <nome-atual> <slug>`
> 3. Abre o VS Code de novo na pasta renomeada
>
> Se preferir outro nome, me fala que eu ajusto a sugestão."

Se a pasta já tem nome próprio (não genérico), pular essa fase.

## Próximos passos

Pro **Caminho A**:

> "Pronto. O MazyOS já te conhece.
>
> No começo de cada sessão de trabalho, roda `/abrir` — eu carrego tudo
> que combinamos aqui antes da primeira frase. Quando quiser fazer um
> carrossel, plano de SEO, campanha ou qualquer outra coisa, é só
> chamar a skill que cabe.
>
> Você mencionou que repete '<resposta da pergunta 8>' toda semana.
> Quando quiser tirar isso das costas de vez, roda `/mapear-rotinas`
> que eu transformo em skill própria."

Pro **Caminho B**:

> "Pronto. O MazyOS já sabe quem você é como marca.
>
> No começo de cada sessão, roda `/abrir`. Pra criar conteúdo:
> `/reels` monta gancho + legenda pro teu formato principal, e
> `/carrossel` cria carrossel completo com a tua identidade.
> Os dois já vão usar teu nicho, teus pilares e tua CTA sem você
> precisar repetir nada."

Se o usuário quiser publicar o trabalho no GitHub, mencionar `/salvar`.

---

## Regras

- Não inventar dados — se a resposta for vaga, registrar do jeito que veio (ou deixar placeholder claro)
- Não escrever "este arquivo será preenchido pelo /instalar" nos arquivos finais — esse aviso só existe nos placeholders, sai depois do /instalar
- O setup deve durar 5-10 minutos no máximo. Se o usuário estiver enrolando numa pergunta, registra o que tem e segue
- Não fazer perguntas extras além das listadas sem motivo claro
- A pergunta empresa × marca pessoal é sempre a primeira — ela define tudo que vem depois
