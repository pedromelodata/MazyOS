# CLAUDE.md — Ateliê Legalizai (motor oficial de criação de posts)

**Este é o motor OFICIAL de criação de peças de marketing do Legalizai.** Qualquer sessão aberta
dentro desta pasta lê isto primeiro. Substitui de vez o mecanismo antigo (agentes
`legalizai-copywriter`/`legalizai-guardian`, arquivados em `../_arquivo/agentes-antigos-marketing/`
— preservados por histórico, **não usar, não reativar, não recriar em `.claude/agents/`**).

> Contexto: isto é uma réplica do método `chat→peça` do Ateliê (`Projetos/atelie/`), aplicada aos
> dados reais do Legalizai. Ver `README.md` desta pasta pra entender a estrutura completa, e
> `Projetos/atelie/metodo-replicavel/CRUZAMENTO-LEGALIZAI.md` pro raciocínio por trás de cada peça.

## ⚠️ Prioridade sobre o `CLAUDE.md` do vault (raiz `pessoal/legalize/`)

Pra QUALQUER pedido de peça/post/copy dentro desta pasta, **este arquivo manda, não o ritual de
BOOT do vault** (ler `HOME.md`, checar `git log` contra `§Agora`). Esse ritual é pra sessão de
trabalho no PRODUTO (app de contabilidade); pedir 3 posts não precisa dele. Se o pedido for sobre o
produto/roadmap/negócio (não marketing), aí sim o `CLAUDE.md` raiz volta a mandar.

## Fonte de dado: SEMPRE o arquivo ORIGINAL, nunca a cópia congelada

`dados/legalizai/estrategia/*.md` dentro desta pasta são **snapshot de 2026-08-25**, só referência
histórica — o Pedro edita os originais direto no vault (principalmente `decisoes-marca.md`, que
recebe linha nova toda semana). **Ler sempre o caminho ORIGINAL abaixo, nunca a cópia**, senão o
motor trabalha com regra desatualizada sem ninguém perceber.

## Quando o Pedro pedir post/peça nova ("me dá N ideias de X", "3 posts sobre Y")

**Leia nesta ordem, sempre, antes de escrever qualquer copy (caminhos relativos a esta pasta `atelie/`):**

1. `../marca/decisoes-marca.md` — regras duras vivas, sempre as entradas mais recentes primeiro
   (pode revogar qualquer coisa abaixo).
2. `../marca/personagem-leo.md` — quem é o Léo, voz, dial de ironia por persona (§5), o que nunca
   vira piada (§3). **Sem isso lido, não escreva nada.**
3. `../mkt/estrategia/posicionamento.md` — claim, qualificador obrigatório "do Simples Nacional".
4. `../mkt/estrategia/estrategia-organica.md` — pilares 1-15 (13 ativos + 2 standby, numeração v3
   26/08), 4 blocos de pauta (20/30/25/25), regras travadas (nunca simular escassez, garantia 7
   dias em post de venda).
5. `../mkt/estrategia/mecanicas-engajamento.md` — escada de CTA (nível 1 engajamento / nível 2
   funil), banco de prompts, mecânica "Pergunta que ninguém explica".
6. `../pesquisa/metodologia-personas.md` — 5 dorsais (A/B/C/D/E) + 18 volantes (26/08). Pra copy
   calibrada de verdade, leia também o arquivo da persona específica em `../pesquisa/personas/` —
   é lá que mora o banco de calibragem, mapeamento de pilar, reação a crítica, voz própria e
   referência visual de cada dorsal (não está resumido em lugar nenhum além do próprio arquivo).
7. `ds/legalizai/regras.json` — rode o QA determinístico mentalmente contra o que você escreveu
   (travessão, qualificador, garantia, nome antigo de marca) antes de entregar.
8. **Anti-repetição (alerta, não bloqueio — decisão 26/08):** leia `dados/legalizai/*/campanha.json` +
   as peças já existentes em `dados/legalizai/*/pecas/*.json` — evite repetir pilar/headline/ângulo já
   usado. Pilar 5 (oferta) já tem 12 peças na campanha de lançamento; prefira outro pilar salvo pedido
   explícito. Se decidir repetir mesmo assim (ou o Pedro pedir), **não bloqueie** — sinalize
   explicitamente no output e preencha `excecaoAntiRepeticao` na peça.

`ds/legalizai/*.json` (voz, tokens, ctas, personagem, templates) seguem sendo lidos daqui mesmo —
são extração estruturada MINHA, não têm original solto em outro lugar do vault. **Exceção:
`ds/legalizai/personas.json` NÃO é assim** — desde 26/08 ele é só um ÍNDICE (id, perfil curto, dial
de partida, mensagem-âncora) das 5 dorsais + 18 volantes; a profundidade real (banco de calibragem,
mapeamento de pilar, reação a crítica, voz própria, referência visual, pesquisa real) mora só em
`../pesquisa/personas/*.md` e `../pesquisa/personas/volantes/*.md` — leia esses direto pra qualquer
copy que precise de nuance de persona.

## Formato de saída

Mostre a ideia como CARD (igual o Ateliê faz no chat antes de virar peça formal): headline, corpo,
CTA, pilar, persona-alvo, dial de ironia, mais o auto-check contra as regras duras. **Não escreva o
arquivo `.json` sozinho** — só depois que o Pedro confirmar. O schema exato pra quando ele confirmar
está em `dados/legalizai/tipos.md`; a peça vai pra
`dados/legalizai/<campanha>/pecas/<id>.json` + atualiza o `campanha.json` correspondente.

## Regras duras (atualizadas 26/08 — ver ADR em decisoes-marca.md pra histórico)

- Zero travessão (— ou –).
- Zero concorrente citado por nome — lista ATIVA em `ds/legalizai/voz.json > glossario.concorrentesNomeados` (Contabilizei, Agilize, Contaja, Facilite, Contabilivre, Marvee, ContaAzul, Nubank), uso 100% interno de QA, nunca publicar.
- Ironia mira o SISTEMA, nunca a dúvida/erro do cliente.
- **JAMAIS prometer/insinuar contador humano dedicado no plano MEI** (MEI tem assistente virtual, não contador). Substitui a exigência antiga de citar sempre "do Simples Nacional" — essa virou critério editorial, não regra dura.
- Garantia nunca "incondicional" nem "sem letra miúda" como promessa.
- Escassez só se real.
- CTA preso à escada do estágio de funil (`ds/legalizai/ctas.json`).
- **Se a copy fala na voz do Léo em 1ª pessoa, ele precisa aparecer visualmente na peça.**
- Cadência de publicação NÃO está travada nesta fase (decisão 26/08) — respeitar anti-repetição e blocos 40/40/20, frequência fica por sessão.
- Anti-repetição é alerta, não bloqueio — Pedro pode repetir pilar/ângulo de propósito, mas o motor tem que sinalizar isso antes de entregar (ver campo `excecaoAntiRepeticao` em `tipos.md`).

## O que este projeto NÃO tem ainda (não fingir que tem)

- Geração de imagem automatizada — hoje é manual (Gemini avulso + Photoshop) ou nem existe pra peça
  nova. `ds/legalizai/templates-imagem.json` explica por quê (compatibilidade baixa com o que foi
  portado do Presente Sonoro).
- API viva — tudo aqui roda via Claude Code direto, sem `route.ts`/Gemini automatizado.
