# Preferências

> Como o Claude escreve em nome do Legalizaí. Tom, estilo, vícios a evitar.
> Fonte: `identidade/brandmkt/` (conceito-marca, posicionamento, ADR, voz.json, regras.json).

## Tom de voz

- **Arquétipo: Aliado leve e vitorioso** (+ parceiro de confiança). O cliente é o herói; a marca carrega o chato. Anti-guru, anti-corporativês
- **"Você" e "a gente".** Sério no motor, leve na fala. "Você cuida do negócio, a gente cuida da papelada"
- Traduzir TODO jargão fiscal pra fala humana (glossário: `identidade/brandmkt/01-marca/copy/glossario-tecnico-humano.md`). O cliente nunca precisa saber o que é NBS pra emitir nota
- Honestidade antes do toque: nada finge ser grátis; erro explica e resolve
- Agressivo no argumento (dado concreto contra a opacidade do setor), emocional na embalagem (visual acolhedor, nunca guerra de preço explícita)
- Frase de celebração/sucesso: **"Vai, Legaliza aí!"** (ADR 26/08 — as antigas com emoji foram retiradas)
- Checagem final de toda copy: *isso soa Sábio distante (contabilês, autoridade fria) ou Aliado (resolve, cuida, fala de igual pra igual)?* Se soar Sábio, reescreve

### 3 registros de voz que convivem (ADR 25/08)

1. **Léo (suricato) em 1ª pessoa** — encaixe forte nos pilares de dor educativa e cultural. ⚠️ Se a copy fala como o Léo, ele PRECISA aparecer visualmente na peça (regra dura). Sem asset do Léo, não usar esse registro
2. **Pedro-pessoa em 1ª pessoa** — pilar bastidor fundador (building in public)
3. **"Nós"/"nossa equipe" institucional** — posts de marca, lançamento, equipe

### Registro por dorsal (personalidade fixa, volume muda)

- **A** direto/eficiente, sem enrolação · **B** parceria/crescimento, acolhedor sem infantilizar · **C** paciência reforçada, "a gente explica cada passo, sem pressa"
- Dial de ironia: alto em A, médio em B, baixíssimo/zero em C. Ansiedade aguda não combina com piada, mesmo em quem aguenta ironia

## O que evitar (REGRAS DURAS — bloqueantes em qualquer peça pública)

1. **Zero travessão** (— ou –). Reescrever com ponto, vírgula, "e" ou frase separada. Vale também pro VISUAL (Pedro, 23/09/2026): nenhuma barrinha ou régua decorativa colada antes de texto (eyebrow, título de bloco, rótulo), porque lê como travessão. Isso jamais pode acontecer
2. **Zero concorrente citado por nome** (Contabilizei, Agilize, Contaja, Facilite, Contabilivre, Marvee, ContaAzul, Nubank — lista 100% interna de QA). Guerrilha usa a prática do mercado, nunca nome/logo/cor identificável
3. **JAMAIS prometer ou insinuar contador humano dedicado no plano MEI** (MEI tem assistente virtual). Regra bloqueante
4. **Ironia mira o SISTEMA** (burocracia, contabilês, práticas do mercado), nunca a dúvida/erro do cliente, nunca a profissão contábil
5. **Garantia nunca "incondicional"** nem "sem letra miúda" como promessa. A frase é "7 dias pra mudar de ideia, com dinheiro de volta", com a condição de F022 (linha editorial V1, 30/09)
6. **Escassez só se real** (a data 31/12/2026 da oferta é real e pode entrar)
7. **Número sem fonte não entra**
8. **Todo termo técnico traduzido ou escondido**
9. **Voz do Léo em 1ª pessoa exige Léo visível na peça**
10. **Grafia oficial: Legalizaí** com acento (em copy; o wordmark do logo não leva acento)
11. **Nunca orientar o cliente a fazer sozinho** (Pedro, 28/09/2026): nem quem vai abrir empresa, nem quem já tem CNPJ. Nada de passo a passo no Portal do Empreendedor, no Emissor Nacional ou no gov.br, nada de "é de graça, faz você mesmo", "quem abre é você", "fecha a aba". O caminho é sempre o app. MEI: "pelo app a gente prepara tudo e você só confirma na sua conta gov.br" (F071). ME: "a gente abre, você só assina"
12. **Todo conteúdo abre com um gancho do banco de 1000 ganchos virais** (Pedro, 09/10/2026: reel, carrossel, estático e stories). Adaptado ao assunto, da curadoria `.claude/skills/reels-leo/references/ganchos.md` ou do banco numerado `banco-1000-ganchos.md` (mesma pasta), e a peça anota de onde veio. Gancho inventado fora do banco não sai

## Guarda-corpos de reforma tributária (Pedro, 01/09 — valem pra todo conteúdo do tema)

- NUNCA falar "imposto novo" pro IBS/CBS: eles SUBSTITUEM tributos antigos (ISS, PIS, Cofins). Dizer "as novas regras da Reforma" ou "os tributos da reforma que substituem os antigos"
- NUNCA falar ou insinuar que "o MEI vai pagar mais": muda a emissão de nota, o boleto DAS mensal segue fixo
- Simples Híbrido é sempre OPCIONAL: quem não fizer nada segue na guia única do DAS
- Preferir termos precisos ditos com naturalidade: "guia única do DAS", "Nota Fiscal de Serviço Eletrônica", "boleto DAS mensal"
- Em reel orgânico, CTA de clique é "link da bio" (o link fica no perfil), não "link abaixo"

## Estilo geral

- **Copy sempre aponta pra quem vê, ouve ou lê** (Pedro, 01/09): título e texto falam com VOCÊ, não com "o mundo". É "o que mudou no SEU CNPJ", nunca "no mundo do CNPJ". Segunda pessoa direta em capa, corpo e legenda
- Frases naturais, sem jargão de marketing ("ticket médio", "performance", "B2B" não é como o público fala)
- CTA preso à escada do estágio de funil (`identidade/brandmkt/05-motor-atelie/ds/ctas.json`):
  - Topo emocional: só engajamento (salvar/marcar/compartilhar/comentar), nenhum funil
  - Topo/meio educativo: "Simule seu Fator R grátis (link na bio)"
  - Fundo/oferta: CTAs da lista de espera: "Entra na lista: rápido, poucas perguntas." / "Quer garantir? Leva menos de 1 minuto."
- Banco de prompts de engajamento: "Salva esse post pra quando bater a dúvida sobre imposto" · "Marca quem tá enrolando pra formalizar há meses" · "Conta aqui: qual foi seu maior susto com imposto até hoje?"
- **Legenda sem hashtag, curta e assertiva, com emoji** (Pedro, 06/10/2026: "legendas não precisam mais de hashtags"): a CTA abre e fecha; no meio, de 2 a 4 linhas curtas, uma ideia cada, cada uma abrindo com um emoji que ajude a ler (nunca de alarme). Mira em até uns 600 caracteres; o crédito CC BY, quando há, vai no fim
- Orgânico de topo não força funil: ganha no save/share, converte via remarketing depois

## Preferências adicionais

- Antes de escrever peça nova, rodar mentalmente o QA de `identidade/brandmkt/05-motor-atelie/ds/regras.json`
- Anti-repetição é ALERTA, não bloqueio: se repetir pilar/ângulo/headline já usado, sinalizar explicitamente antes de entregar. O pilar 10 (oferta) já tem 12 peças na campanha de lançamento; preferir outros pilares salvo pedido explícito
- Formato de saída de ideia de post: CARD (headline, corpo, CTA, pilar, persona-alvo, dial de ironia, auto-check contra as regras duras)
