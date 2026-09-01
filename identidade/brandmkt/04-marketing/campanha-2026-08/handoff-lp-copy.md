---
tipo: campanha
status: pendente
data: 2026-08-20
tags: [marketing, campanhas, primeira-campanha, handoff, lp]
---

# Handoff — ajustes de copy na LP de captação (lista de espera)

> Handoff pra sessão de dev trabalhando na LP em produção (`legalizai.com.br`, formulário de lista de espera). Escopo é **só copy/texto + 1 campo novo no formulário**. **Não mexer em layout, grid, cores, espaçamento ou componentes visuais** — o pedido é o menor diff possível pra bater com a copy já validada da primeira campanha de tráfego.

## Contexto rápido

A LP está no ar captando leads pra lista de espera do lançamento do Legalizai. Em paralelo, fechamos a copy da primeira campanha de tráfego pago (Meta/Instagram) — 24 peças auditadas (estáticos + roteiros de vídeo). A LP atual tem **2 problemas de coerência ad↔LP** que precisam corrigir antes do tráfego apontar pra ela:

1. A LP oferece "1º mês grátis" — a oferta real, fechada com o sócio (Mauro) em 2026-08-20, é outra (ver item 3 abaixo).
2. A LP promete "contador de verdade desde o início" sem qualificador — isso é promessa falsa pra quem é MEI (MEI tem assistente virtual de contabilidade, não contador dedicado; só o plano ME/Simples Nacional tem contador CRC real). Regra de marca travada desde 17/08.

## O que mudar (find → replace)

| # | Onde | Texto atual | Texto novo |
|---|---|---|---|
| 1 | Subheadline do hero, abaixo do H1 | "Preço fechado, contador de verdade desde o início." | "Preço fechado, sem letra miúda. Contador de verdade do Simples Nacional desde o plano de entrada." |
| 2 | Subtítulo do card de oferta (acima do formulário) | "1º mês grátis pra quem entrar agora." | "MEI: R$19/mês nos 3 primeiros meses, depois R$49. ME/Simples Nacional: R$79/mês nos 3 primeiros meses, depois R$139. Vale até 31/12/2026 ou enquanto a lista estiver aberta." |
| 3 | Botão de envio do formulário | "Garantir minha oferta de lançamento" | "Garantir minha condição de lançamento" |
| 4 | Bloco da direita, texto sobre o escritório (acima ou perto de "Um escritório de contabilidade de verdade, em BH.") | "Um escritório de contabilidade de verdade, em BH." | "22 anos de contabilidade de verdade, em BH." |

## O que adicionar (1 mudança estrutural leve)

**Novo campo no formulário**, entre "WhatsApp com DDD" e "Cidade" (ou logo após "Cidade", onde encaixar com menos atrito de layout):

- Label: `Você é:`
- Tipo: seleção única (radio ou dropdown, o que já existir no design system do form — não criar componente novo)
- Opções:
  - `MEI`
  - `ME / Simples Nacional ou vou abrir uma empresa`

**Por quê:** sem isso a oferta não tem como ficar correta pro visitante — MEI e ME têm preços diferentes (item 2 acima), e sem esse campo a página fica obrigada a ou generalizar (perde precisão) ou prometer errado pra um dos dois grupos. Bônus: é dado de qualificação de lead que o negócio já queria captar.

**Se adicionar esse campo for mais trabalho/risco do que vale agora:** solução mínima alternativa é manter o texto do item 2 genérico o bastante pra não prometer número nenhum sem contexto — mas isso é pior (perde a comparação de preço que puxa conversão) e só deve ser usado se o campo novo não for viável nesta rodada.

## Nova linha de texto (adicionar, não substitui nada)

Entre o formulário e o botão de envio (ou logo abaixo do botão, onde couber sem alterar o grid):

> "O app ainda tá em construção. Quem entra agora garante essa condição pro lançamento oficial."

**Por quê:** a LP hoje lê como se o app já estivesse ativo (ex: "1º mês grátis pra quem entrar agora" soa a uso imediato). A mecânica real, travada com o sócio em 20/08, é **reserva de condição futura**, não desconto de uso imediato — é o eixo central de toda a copy da campanha (ads e vídeos), e a LP precisa dizer a mesma coisa pra não quebrar a promessa do anúncio.

## O que NÃO mexer

- Checkbox de consentimento (já está correto, já cita "lançamento")
- Header/logo, footer institucional (CNPJ, responsabilidade técnica, contador responsável) — já está correto e completo
- Bloco visual da direita (telas do app), exceto a linha de texto do item 4
- Layout, grid, cores, tipografia, espaçamento
- Campos existentes do formulário (nome, e-mail, WhatsApp, cidade) — só adicionar o campo novo, não alterar os que já existem

## Fonte das decisões (se precisar confirmar algo)

Vault do projeto (Obsidian), pasta `pessoal/legalize/`:
- `marca/decisoes-marca.md` — ADR de 2026-08-20 (preço MEI R$19→R$49, oferta ME R$79→R$139 exclusiva da campanha, validade 31/12/2026) e de 2026-08-17 (qualificador "do Simples Nacional" obrigatório)
- `mkt/campanhas/2026-08-primeira-campanha/brief.md` e `copy.md` — copy completa da campanha que essa LP precisa bater
