---
tipo: derivado
status: vivo
data: 2026-08-05
assunto: validacao-ideia
deriva_de: [BASE-ESTRATEGICA, PESQUISA-MERCADO, matriz-comparativa, economia-preco-cac]
tags: [pesquisa, validacao, gate]
---

# ✅ Validação de ideia — go/no-go

> Checklist de validação por **pesquisa secundária** (o que já sabemos hoje, sem gastar em teste). Diferente do gate empírico do V0 (§13 `BASE-ESTRATEGICA.md`), que mede dado PRIMÁRIO (tráfego real) e ainda tem números em aberto — ver final deste doc.

## Checklist go/no-go

| Critério | Pergunta | Resposta | Sinal |
|---|---|---|---|
| Mercado existe | Demanda comprovada em algum lugar? | ~7,4 mi ME/EPP Simples pagantes no Brasil; líder atinge só ~50k (0,7% de penetração); ~417 mil aberturas/mês contínuas | 🟢 |
| Brecha real | Existe gap não atendido no mercado-alvo? | 3 variáveis que nenhum concorrente atende juntas: preço fechado sem asterisco + humano no plano de entrada + hiperlocal BH — [[matriz-comparativa]] | 🟢 |
| Ticket viável | Preço sustenta CAC de aquisição? | 🔄 **régua trocada 18/08.** CAC-alvo agora é R$30–100, custo único, vs LTV de 12 meses (não mais % da sobra técnica) — [[economia-preco-cac]] §6. Com mão de obra na conta (atendente R$3.500/mês), o ME fecha com folga até 1:63 usuários/atendente; MEI fecha só sem atendente humano. O que decide não é mais o CAC, é a **razão usuário:atendente**, ainda não medida | 🔴 (motivo mudou 18/08 — antes era CAC alto de mercado, agora é razão de atendimento não medida) |
| Concorrência batível | Dá pra competir sem queimar caixa? | Legalize (22 anos) já tem contador/compliance prontos — ativo que o líder queimou capital de VC pra montar do zero (SoftBank R$320mi + Warburg ~R$700mi). Não precisamos comprar o que já existe | 🟢 |
| Canal de aquisição | Canal claro e com custo previsível? | Candidato definido, mas **canais caros (Meta/Google topo) provavelmente não fecham a conta** na margem atual — prioridade estrutural precisa ir pra Google Search de alta intenção (CPL R$15-50), orgânico/SEO e indicação (WhatsApp domina 72-74% das vendas desse público, [[perfil-microempreendedor-mercado]] §2) | 🟡 (mais claro, mas mais restrito que antes) |
| Produção viável | MVP construível no prazo/recurso disponível? | Orçamento travado R$186k/5 meses (piso R$175k · teto R$200k), dentro da faixa de mercado, build-vs-buy definido (Focus NFe, certificado A1 — não construir NF/banco do zero) — `BASE-ESTRATEGICA.md` §13 | 🟢 |
| Ticket de teste | Cabe numa tese de MVP barato/rápido de validar? | V0 = R$40-46k, 2 meses, **sem software** (smoke test de tráfego) — gate antes de qualquer build grande | 🟢 |

**4/7 verde · 2/7 amarelo · 1/7 vermelho** (rebaixado 05/08 após [[perfil-microempreendedor-mercado]] — ver §9 de [[economia-preco-cac]]).

## Brecha de mercado

Legalizai Story Book cruza **3 variáveis** que nenhum dos 5 concorrentes diretos atende ao mesmo tempo: (1) preço fechado sem asterisco — todos usam "a partir de", simulador gated ou ajuste pós-contato; (2) humano no plano de ENTRADA — nos 5, contador nomeado só aparece no tier caro (R$359-700); (3) hiperlocal BH operacional — nenhum trata ISS-BH/alvará PBH/Junta MG como produto, mesmo a Contaja (MG) tratando como origem, não operação. Detalhe completo em [[matriz-comparativa]].

## Riscos principais

1. **Teto do MEI pode subir** (PLP 108/2021, R$130-134 mil/ano, voto ainda não confirmado em ago/2026) → defesa: precificação prevê os 2 cenários; MEI já é margem apertada mesmo sem essa mudança (ver [[economia-preco-cac]]).
2. **Líder bem financiado** (Contabilizei: SoftBank + Warburg ~R$1 bi combinado) pode sustentar queima de caixa por muito mais tempo → defesa: não competir em volume de mídia/SEO, competir em nicho hiperlocal + humano de entrada, onde capital não compra vantagem automática.
3. **Ferida de confiança estrutural da categoria** ("vocês têm contador DE VERDADE?" é a pergunta nº1 em todos os FAQs concorrentes) → defesa: prova de humano real (nome, foto, CRC) precisa aparecer cedo na jornada, não só em resposta de FAQ.

## Veredito

```
🟡 GO COM RESSALVA FORTE — 4/7 verde · 2/7 amarelo · 1/7 vermelho
Mercado grande e brecha real seguem sólidos. Mas o achado de 05/08 muda o
peso da ressalva: com custo técnico simbólico e SEM honorário contábil real,
o CAC-alvo (mesmo em LTV de 24 meses) já fica na ponta baixa do CAC típico
de mercado (R$500-4.000). Isso não derruba a ideia — derruba a estratégia
de canal: tráfego pago caro de topo de funil pode não fechar conta na
margem atual. V0 precisa testar canais baratos (Search de alta intenção,
orgânico, indicação) ANTES de validar com Meta/Google de topo.
```

**Gate 1 — decisão:** aprovado em 2026-07-07 (reunião Pedro+Mauro, negócio fechado). Execução condicionada ao gate empírico do V0.

---

## Gate empírico do V0 (pendente — dado primário, não desta pesquisa)

Distinto do checklist acima. Mede tráfego real, não pesquisa secundária. Framework já existe em `BASE-ESTRATEGICA.md` §13, mas os **números ainda não estão travados**:

| Critério | Threshold | Status |
|---|---|---|
| Custo por resposta qualificada (instant form) | < R$X | 🔴 X não definido |
| % opt-in na lista de espera | > Y% | 🔴 Y não definido |
| Intenção de pagamento na landing quente (retargeting c/ preço) | > Z% | 🔴 Z não definido |
| De M ligações, confirmam dor + topam preço | ≥ K | 🔴 M/K não definidos |
| Spike técnico confirma viabilidade | sim/não | 🔴 ainda não rodado |

Regra do checklist de imersão: **"calibrar no mês 1, acordar com Mauro ANTES do teste"** — ainda não aconteceu. Veredito de 3 cores já definido (🟢 GO V1 · 🟡 1 ciclo de correção, 2-3 sem · 2× amarelo = 🔴 NO-GO, economiza ~R$122k de build).

## Cross-refs

- [[matriz-comparativa]] (dados) · [[economia-preco-cac]] (ticket/CAC) · `BASE-ESTRATEGICA.md` §13 (gate empírico) · `execucao/CHECKLIST-IMERSAO-30-DIAS.md` (execução semana a semana)
