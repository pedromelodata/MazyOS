---
tipo: original
status: vivo
data: 2026-08-05
assunto: estrutura-funil-trafego
deriva_de: [trafego-pago-contabilidade-mercado, economia-preco-cac, metodologia-personas]
tags: [pesquisa, marketing, trafego-pago]
---

# 💸 Tráfego pago — estrutura de funil de budget

> Consome [[metodologia-personas]] (quem) + [[economia-preco-cac]] (quanto pode pagar) + [[trafego-pago-contabilidade-mercado]] (benchmark do nicho). Specs evergreen — cronograma de execução de campanha específica fica em `pesquisa/frente-1-captacao-meta-bh.md` e futuras.

## Budget real

**R$3.500/mês (V0, teste)** → **R$5.000/mês (V1)**, já travado em `BASE-ESTRATEGICA.md` §13. Breakeven/ROAS-alvo ainda dependem do gate empírico (§13, thresholds não travados — ver [[validacao-ideia]]).

### Decisão de concentração (05/08, baseada em [[trafego-pago-contabilidade-mercado]] §2)

Meta mínimo real R$800-2.000/mês · Google mínimo real R$1.500-3.000/mês. Rodar os dois ao mesmo tempo com R$3.500/mês deixa ambos abaixo do volume que a fase de aprendizado dos algoritmos precisa (Meta pede ~50 eventos de conversão/7 dias por conjunto). **Decisão: concentrar o V0 inteiro em Meta Ads** (melhor conversão B2B do nicho — 4,68% vs 3,46% Google — e CPM menor com geo local BH R$18-35). Google Search entra no V1, quando o budget (R$5.000/mês) sustenta os dois minimamente.

## Frentes

| Frente | Budget V0 | Objetivo | Onde |
|---|---:|---|---|
| **1 — Reconhecimento** | orgânico, sem verba paga na V0 | topo de funil via Instagram ([[estrategia-organica]]) | orgânico |
| **2 — Captação** | R$3.500/mês (100% Meta) | fundo de funil, ad→WhatsApp, geo BH | Meta Ads |
| **3 — Parcerias** | permuta/indicação, sem cash dedicado ainda | CAC efetivo baixo via indicação em comunidades profissionais (forte pra Persona B) | orgânico + relação |

## Segmentos (Frente 2) × personas × oferta

| Seg | Persona | Oferta | % budget | Racional |
|---|---|---|---:|---|
| S-1 | A — Direto (intelectual) | ME | 45% | maior conversão esperada (alta intenção, decide rápido), CAC-alvo mais folgado (régua 18/08: R$30–100 vs LTV 12m, consome só 2,3–7,8% sem mão de obra — [[economia-preco-cac]] §6) |
| S-2 | B — Construindo (estético) | ME (transição MEI→ME) | 40% | maior volume de mercado (setor beleza = 83% presença Instagram), mas resistência de preço maior |
| S-3 | C — Precisa de mão na mão | — | 0% | **não roda tráfego pago frio** — decide por indicação/confiança pessoal, não por ad; alcançar via orgânico/indicação (ver [[metodologia-personas]]) |
| S-MEI | qualquer, upsell/entrada | MEI | 30% do budget total (split 30/70 acordado 18/08) | 🔄 ver abaixo — deixou de estar barrado |

### 🔄 MEI passa a rodar tráfego pago frio — revertido em 18/08

> A versão original deste bloco (05/08) barrava o MEI com base num cálculo que comparava nosso funil com o de uma operação **consultiva** (30% de conversão lead→cliente necessária, "irreal"). Esse cálculo estava errado de raiz: nosso funil não tem etapa de lead trabalhado (é anúncio → app → pagamento), então a taxa consultiva nunca deveria ter sido a régua.

Com a régua correta ([[economia-preco-cac]] §6, CAC-alvo R$30–100 contra LTV de 12 meses): **o MEI consome 14,3% a 47,7% do LTV e paga em 1,7 a 5,7 meses** — dentro da fidelidade. Fonte: [[2026-08-18-custos-margem-decisao]] §3/§5, ADR em [[decisoes-marca]] (18/08).

⚠️ **Condição que sustenta isso inteira:** só fecha **enquanto o MEI não tiver atendente humano dedicado** — com atendente a margem do MEI é negativa e nenhum CAC fecha (empataria só em 1:290). A viabilidade do MEI em mídia paga depende 100% da operação continuar com assistente virtual, não contador/atendente de carne e osso.

**Split proposto na reunião de 18/08:** 30% do budget pra MEI / 70% pra ME.

## Apoio

- [[funil-conversao]] — jornada completa + números-alvo por etapa
- [[posicionamento]] §Arquétipos — todo criativo/copy dos segmentos S-1/S-2 segue o arquétipo Aliado/Parceiro (registro por dorsal em [[metodologia-personas]] §Tom de voz), não só a régua de budget/CAC deste doc
- **Canais (decisão viva, 05/08):**
  - ✅ **Meta Ads** — prioridade 1, geo BH, objetivo "Mensagens" (WhatsApp), não "Conversão de Formulário"
  - 🟡 **Google Search** — só alta intenção ("contador online BH", "abrir empresa MG"), entra no V1
  - ❌ **TikTok** — descartado (budget mínimo R$2.000-4.500 alto pra fase, demografia jovem incompatível com idade média 40,8 anos do público)
  - ❌ **LinkedIn** — descartado por ora (CPC/CPM proibitivo pro ticket baixo, penetração só 6% no público geral); revisar só se Persona A justificar com dado real do V0
- Calendário editorial sazonal — mora em doc separado quando o volume justificar

## Regras travadas

- **Objetivo de campanha = "Mensagens" (WhatsApp), não formulário** — mais barato pra sair da fase de aprendizado. ⚠️ **Tensão aberta desde 18/08:** o fundo de funil mudou (WhatsApp virou apoio pra desbloquear objeção, não mais o destino/momento decisivo — ver [[funil-conversao]] Etapa 2/4). Se o objetivo do anúncio continua sendo "Mensagens" ou passa a apontar pra LP/download direto é decisão ainda não travada explicitamente
- **Budget líquido considera o repasse tributário Meta de 12,15%** (jan/2026) — R$1.000 nominal = R$878,50 de mídia efetiva
- **Geo restrito a BH/região metropolitana** — CPM menor (R$18-35 vs R$30-60 nacional) + evita leilão contra players nacionais bem financiados
- **Não esperar infraestrutura de tracking perfeita pra rodar** — objetivo de mensagem/clique se pixel/CAPI não estiver pronto
- **Nunca escalar budget >20%/semana** num conjunto
- **Elemento de risco zero** (garantia 7 dias, CDC art.49) é hook no ad; termos completos ficam no site

## Divisão de budget entre conjuntos

🔄 **3 segmentos ativos agora, não 2** (MEI liberado 18/08, ver acima). R$3.500/mês × 70% ME (S-1+S-2) ÷ 2 ≈ R$41/dia por segmento ME + R$3.500 × 30% MEI ≈ R$32/dia pro conjunto MEI — abaixo do piso confortável de conjunto (~R$50-58/dia). Reavaliar divisão quando o V1 (R$5.000/mês) permitir folga real entre 3 conjuntos saudáveis; até lá, considerar rodar MEI só quando o ME estiver estabilizado, não os 3 desde o dia 1.
