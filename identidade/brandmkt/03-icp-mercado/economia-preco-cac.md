---
tipo: original
status: vivo
data: 2026-08-05
assunto: economia-preco
tags: [pesquisa, preco, cac, economia]
---

# 💰 Economia — margem, CAC, breakeven

> Fonte única de números econômicos do produto. Outros docs citam este, não recopiam valor. **Anti-guru: valor + fonte + confiança; 🔴 quando não tem dado, nunca chute.**

⚠️ **Doc PARCIAL, atualizado 18/08.** Honorário contábil (Mauro) e mão de obra de atendimento já entraram no cálculo (§1, §6) — não são mais pendência. **Ainda fora:** taxa de transação Asaas e imposto sobre faturamento próprio. Toda margem/CAC aqui segue sendo **teto**, nunca meta de escala. Supera a decisão de 16/07 ([[legalize-preco-deferido-custo-real]]) e a régua de CAC de 05/08 (§9, superada por §6).

---

## 1. Estrutura de custos do produto (mensal, por cliente)

| Item | Valor | Fonte | Conf. |
|---|---:|---|---|
| API (integrações órgãos/consultas) | R$ 10,00/mês | simbólico, decisão Pedro 05/08 | 🟡 placeholder |
| Sistemas (fiscal/gestão) | R$ 5,00/mês | simbólico, decisão Pedro 05/08 | 🟡 placeholder |
| Honorário contábil CRC (Mauro) | 1 salário mínimo = R$1.621,00/mês, **custo fixo** (não por cliente) | respondido 18/08 — diluído em 300 clientes = R$5,40/cliente | 🟢 travado · ⚠️ premissa "custo fixo" não confirmada nessas palavras |
| Atendente contábil (mão de obra) | R$ 3.500,00/mês, cobre **30 a 40 usuários** → R$87,50–116,67/cliente | levantado 18/08 | 🟢 valor do salário · 🔴 razão 1:30–40 estimada de cabeça, variável mais frágil da conta |
| **Custo técnico conhecido/unidade** | **R$ 15,00/mês** | soma API+sistema (honorário e atendente entram só no §6, não aqui — são custo de operação, não custo técnico) | 🟡 parcial |

### Taxas de transação
| Forma de pagamento | Taxa | Fonte | Conf. |
|---|---|---|---|
| Asaas (Pix/cartão/boleto) | — | sem dado levantado ainda | 🔴 pendente |

### Impostos
Regime tributário da Legalize Digital (CNPJ que fatura o cliente final) — % sobre faturamento não levantado. 🔴 pendente.

---

## 2. Preço de venda por oferta

| Oferta | Preço | Histórico | Conf. |
|---|---:|---|---|
| **ME** | **R$ 139,00/mês** | revisado de R$ 195,00 → R$ 139,00 em 05/08/2026 (decisão Pedro) | 🟢 travado |
| **MEI** | R$ 49,90/mês | placeholder desde 16/07 ([[legalize-preco-deferido-custo-real]]), não revisado nesta sessão | 🟡 placeholder |

---

## 3. Margem PARCIAL (só custo técnico — NÃO é margem líquida)

| | ME (R$139,00) | MEI (R$49,90) |
|---|---:|---:|
| Receita bruta | R$ 139,00 | R$ 49,90 |
| (−) Custo técnico (API+sistema) | R$ 15,00 | R$ 15,00 |
| **= Sobra técnica** | **R$ 124,00** | **R$ 34,90** |
| **% sobre receita** | 89,2% | 69,9% |

⚠️ **Isso não é lucro líquido.** Falta honorário contábil (o maior custo variável de um negócio de contabilidade), taxa de transação Asaas e imposto sobre faturamento próprio. Todo cálculo abaixo herda esse teto inflado — usar como **teto teórico**, nunca como CAC-alvo definitivo pra escalar ads de verdade.

> 🟢 **Certificado digital = R$209,00, valor real (confirmado 18/08).** Confirma a ponta baixa da faixa R$209–229 levantada com a Izabela em 09/07. **Não entra na tabela acima** porque ela é mensal e o certificado é anual: ele custa **R$209 por cliente/ano**, não por mês. Somando os dois custos, a margem bruta de 12 meses cai pra **R$1.279,00 (ME)** e **R$209,80 (MEI)** — conta completa em [[2026-08-17-margem-x-custo-de-trafego]] §2 e [[2026-08-18-custos-margem-decisao]] §2. **No MEI o certificado sozinho come 34,9% da receita anual do cliente.**

---

## 4. Budget disponível (referência)

Já travado em `BASE-ESTRATEGICA.md` §13, não recalculado aqui — citar, não recopiar: V0 R$3.500/mês (teste), V1 R$5.000/mês.

---

## 5. Ponto de equilíbrio preliminar (parcial, otimista)

Fórmula: vendas p/ empatar = budget ÷ sobra técnica.

| Cenário budget | Vendas ME/mês p/ empatar | Vendas MEI/mês p/ empatar |
|---|---:|---:|
| R$ 3.500/mês (V0) | ~28 | ~101 |
| R$ 5.000/mês (V1) | ~41 | ~144 |

---

## 6. CAC-alvo — régua travada 18/08, substitui a regra dos 3 do §9

> 🔄 **Mudança de fórmula, não só de número.** Até 17/08 o CAC-alvo era "sobra técnica × 0,33" (ver §9, mantido abaixo como histórico). A régua de 18/08 é outra: **CAC-alvo = R$30 a R$100 por cliente, custo ÚNICO, medido contra o LTV de 12 meses** (prazo da fidelidade) — não mais um % fixo da sobra. Fonte: [[2026-08-18-custos-margem-decisao]] §3, ADR em [[decisoes-marca]] (18/08).

### Margem líquida de mão de obra (12 meses) — a conta completa

| | ME (R$139) | MEI (R$49,90, assistente virtual) |
|---|---:|---:|
| Receita 12m | R$ 1.668,00 | R$ 598,80 |
| (−) certificado digital (R$209/ano) | R$ 209,00 | R$ 209,00 |
| (−) técnico (R$15 × 12) | R$ 180,00 | R$ 180,00 |
| **= margem bruta 12m (sem mão de obra)** | **R$ 1.279,00 (76,7%)** | **R$ 209,80 (35,0%)** |

| Razão atendente:usuário | ME — sobra pra mão de obra/cliente | LTV 12m resultante | Conf. |
|---|---:|---:|---|
| sem atendente (só honorário CRC diluído) | — | R$ 1.279,00 | 🟢 |
| 1:63 (margem-alvo 33%) | R$ 44,17/mês → | R$ 547,49 | 🟡 |
| 1:40 | R$ 13,68/mês → | R$ 164,16 | 🟡 |
| 1:35 (**breakeven**) | R$ 0,00 | ~R$ 0 | 🔴 fio de navalha |
| 1:30 | −R$ 15,49/mês | negativo | 🔴 |

MEI: **não suporta atendente humano** — só empataria em 1:290. É por isso que MEI segue com assistente virtual (decisão 17/08), não escolha de conveniência.

### CAC-alvo contra LTV 12m, na régua nova

| Plano | LTV 12m | CAC R$30 (% LTV) | CAC R$100 (% LTV) | Payback a R$100 |
|---|---:|---:|---:|---:|
| **ME, sem mão de obra** | R$ 1.279,00 | 2,3% | 7,8% | 0,9 mês |
| **ME, atendente 1:63** | R$ 547,49 | 5,5% | 18,3% | 2,2 meses |
| ME, atendente 1:40 | R$ 164,16 | 18,3% | 60,9% | 7,3 meses |
| **MEI, assistente virtual** | R$ 209,80 | 14,3% | 47,7% | 5,7 meses |
| MEI, com atendente humano | negativo | — | — | nunca fecha |

**Leitura:** ME fecha com folga em qualquer cenário até 1:63. MEI fecha, mas só enquanto continuar sem atendimento humano dedicado. **A razão usuário:atendente é a variável de maior alavancagem do negócio** — move o CAC-alvo do ME de 60,9% pra 18,3% do LTV, mais que qualquer ajuste de mídia.

⚠️ **O que a régua pressupõe:** com CPC de mercado R$2–8, um CAC de R$30–100 exige que 2% a 8% dos cliques virem cliente pagante. É meta, não medição — o V0 existe pra descobrir o número real.

> ✅ **17/08 — MEI deixa de carregar honorário contábil.** Contador CRC só a partir do ME/Simples (R$139); MEI tem assistente virtual. Base legal: MEI é o único regime dispensado de contador (sem escrituração obrigatória, DASN-SIMEI autodeclaratória).
>
> ✅ **18/08 — decisão de 05/08 revertida: MEI deixa de estar barrado do tráfego pago por aritmética.** Com a régua nova ele consome 14,3–47,7% do LTV e paga em 1,7–5,7 meses — dentro da fidelidade. Split proposto na reunião: 30% MEI / 70% ME. Ver [[estrutura-funil-trafego]] (precisa do mesmo update).
>
> 🔴 **Pendência que ainda pode inverter tudo:** custo unitário real do assistente virtual (tokens+infra) não foi medido. E a razão 1:30–40 é estimativa de cabeça — descobrir a real vale mais que qualquer negociação de preço.

---

## 7. Leituras estratégicas

- **Preço ME caiu 28,7%** (R$195 → R$139) — sai da faixa Contabilizei (R$195) e chega perto da Contaja (R$137, entrada mais barata do mercado mapeado). Reposiciona a régua de preço pra baixo, mais perto do challenger barato que do líder.
- **MEI a R$49,90** segue ~2,8x mais barato que ME. Era a oferta que **primeiro ia quebrar** quando o honorário real entrasse na conta — a decisão de 17/08 (assistente virtual) tirou o honorário dessa linha, e a régua de 18/08 confirma por aritmética que ele fecha conta, condicionado a nunca ter atendente humano dedicado.
- **O gargalo mudou de lugar.** Não é mais custo de mídia nem honorário contábil (R$5,40/cliente, ruído): é a **razão usuário:atendente**. Entre 1:40 e 1:63, o mesmo CAC de R$100 sai de 60,9% pra 18,3% do LTV — nada em mídia chega perto desse impacto.
- **Pendências que ainda podem inverter a conta:** razão real usuário:atendente (Pedro+Mauro) · custo do assistente virtual MEI (teste técnico) · taxa Asaas e imposto sobre faturamento próprio (ainda não levantados, §1) · negociação do certificado (hoje R$209, pesa 34,9% da receita anual do MEI).

---

## 9. Correção — CAC-alvo precisa ser sobre LTV, não margem de 1 mês 🔴 (histórico, superado por §6)

> ⚠️ **Este §9 é a correção de 05/08 (regra dos 3, 33% do LTV). A régua de 18/08 no §6 substitui a fórmula inteira** (CAC-alvo virou faixa fixa R$30-100, não % da sobra). Mantido abaixo só como histórico de como chegamos lá — não usar os números desta seção pra decisão nova.

> Adicionado 05/08 após pesquisa externa ([[perfil-microempreendedor-mercado]]). O §6 original calculou CAC-alvo sobre a sobra técnica de **1 mês só** — resultado (R$40,92 ME / R$11,52 MEI) fica **abaixo até do custo de 1 lead** no mercado real (CPL SaaS B2B Brasil: R$80-400 mediana). Contabilidade é assinatura recorrente — CAC precisa ser comparado contra **LTV** (valor ao longo da retenção), não 1 mensalidade.

### Recálculo com horizonte de retenção

| Horizonte | LTV técnico ME (sobra×meses) | CAC-alvo (33%) ME | LTV técnico MEI | CAC-alvo (33%) MEI |
|---|---:|---:|---:|---:|
| 1 mês (original, §6) | R$124,00 | R$40,92 | R$34,90 | R$11,52 |
| 12 meses (fidelidade mínima MEI travada) | R$1.488,00 | R$491,04 | R$418,80 | R$138,20 |
| 24 meses | R$2.976,00 | R$982,08 | R$837,60 | R$276,41 |

### Confronto com benchmark de mercado real ([[perfil-microempreendedor-mercado]] §4)

- CAC típico do nicho contábil BR: **R$500-4.000** (5% conversão lead→cliente) — [[PESQUISA-MERCADO]] §M
- CAC SMB internacional (proxy): R$1.500-7.300
- CPL SaaS B2B Brasil: R$80-400 mediana (R$15-50 só em Google Search de alta intenção)

**Leitura honesta:** mesmo com horizonte de 24 meses, nosso CAC-alvo técnico (R$982 ME) fica na ponta baixa do CAC típico de mercado (R$500-4.000) — e isso é **antes** de subtrair honorário contábil real, taxa Asaas e imposto (ainda 🔴 pendentes, §1). Quando esses entrarem, a sobra técnica cai e o CAC-alvo aperta mais.

### Implicação estratégica

1. **Canais caros (Meta/Google de topo, CPL R$200-400) provavelmente não fecham a conta** com a margem atual — só se a conversão lead→cliente for bem acima da média do setor (2,5-5%) ou o horizonte de retenção for longo (24m+).
2. **Canais baratos ganham peso estrutural, não só ganham "quando der":** Google Search de alta intenção (CPL R$15-50), orgânico/SEO, indicação (WhatsApp, [[insights-estrategicos]] achado nº1 sobre confiança) — esses viram prioridade, não plano B.
3. **MEI (CAC-alvo R$138-276 mesmo em 24m) segue sendo a oferta mais frágil** — reforça o alerta já registrado em [[insights-estrategicos]] achado 6.
4. Isso não muda o preço travado (R$139,00 ME) — muda **onde investir o budget de aquisição**. Ver quando [[metodologia-descoberta]]/V0 rodar o teste real de tráfego.

---

## Resumo executivo (atualizado 18/08)

| Indicador | Valor | Conf. |
|---|---|---|
| Preço ME | R$ 139,00/mês | 🟢 |
| Preço MEI | R$ 49,90/mês | 🟡 |
| Certificado digital | R$ 209,00/ano/cliente | 🟢 |
| Honorário contábil CRC | R$ 1.621,00/mês fixo (R$5,40/cliente diluído em 300) | 🟢 |
| Atendente contábil | R$ 3.500,00/mês p/ 30–40 usuários (R$87,50–116,67/cliente) | 🟢 valor · 🔴 razão de atendimento |
| Margem bruta 12m ME (sem mão de obra) | R$ 1.279,00 (76,7%) | 🟢 |
| Margem bruta 12m MEI (sem mão de obra) | R$ 209,80 (35,0%) | 🟢 |
| Breakeven ME (usuário:atendente) | 1:35 | 🔴 razão real não medida |
| Razão p/ margem-alvo 33% (ME) | 1:63 | 🔴 razão real não medida |
| **CAC-alvo (régua 18/08)** | **R$ 30 a R$ 100, custo único, vs LTV 12m** | 🟢 travado — ver §6 |
| CAC-alvo ME a 33% do LTV s/ mão de obra (histórico, §9) | R$ 982,08 (24m) | superado por §6 |
| CAC-alvo MEI a 33% do LTV s/ mão de obra (histórico, §9) | R$ 276,41 (24m) | superado por §6 |
| Taxa Asaas | não levantada | 🔴 pendente |
| Imposto s/ faturamento próprio | não levantado | 🔴 pendente |
