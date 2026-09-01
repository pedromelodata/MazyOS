---
tipo: original
status: vivo
data: 2026-08-05
assunto: funil-conversao
deriva_de: [trafego-pago-contabilidade-mercado, estrutura-funil-trafego]
tags: [pesquisa, marketing, trafego-pago]
---

# 🔁 Funil de conversão

## Jornada completa do cliente

```
[Descoberta] → [Interesse] → [Consideração] → [Momento decisivo] → [Compra] → [Entrega] → [Compartilhamento] → [Recompra/Upsell]
```

> 🔄 **Corrigido 18/08 — o parágrafo abaixo (versão de 05/08) foi derrubado por Pedro na reunião.** *"A gente não quer que a pessoa chame no WhatsApp. A gente quer que ela tire a dúvida o suficiente pra baixar o aplicativo e pagar."* **O WhatsApp é apoio, não destino:** existe pra desbloquear quem travou, não pra ser o palco da decisão. **O fundo do funil não é o download, é o pagamento** — baixar sem pagar é custo, não conversão. Ver correção completa abaixo (Etapa 2 e Etapa 4) e [[2026-08-12-estrategia-mkt-para-validacao]] bloco 9.
>
> ~~**Momento decisivo = a conversa com humano no WhatsApp**, não uma etapa de trial/prévia. Confirmado pelo padrão do nicho ([[trafego-pago-contabilidade-mercado]] §3): a dúvida específica ("vocês fazem folha de 1 funcionário no plano de R$139?") é resolvida em tempo real, e é ali que a decisão de fato acontece — não na landing page.~~ (superado)

### 🔄 O momento decisivo, corrigido — depende da altura do funil

| Altura | Onde a objeção morre |
|---|---|
| Topo | Instagram orgânico, conteúdo educativo |
| Meio | blog, página do simulador de Fator R, glossário |
| **Fundo A** | **landing page de venda**, pra quem ainda considera |
| **Fundo B** | **download direto + pagamento**, pra quem já decidiu |

**Consequência de mídia:** duas campanhas de fundo separadas, não uma. A de LP recolhe objeção que as etapas anteriores não mataram; a de download fala com quem já está pronto. WhatsApp segue existindo, mas como ferramenta de desbloqueio pontual — cada conversa que ele absorve é uma conversa que o conteúdo deveria ter resolvido antes.

---

## Etapa 1 — Descoberta

### Canais de entrada
- Meta Ads geo BH (Persona A, B — [[estrutura-funil-trafego]])
- Instagram orgânico ([[estrategia-organica]])
- Indicação/boca-a-boca (Persona C, forte em B também)
- Google Search alta intenção (V1)

### Métricas-chave
- CPM geo BH: R$18-35 (Meta) — [[trafego-pago-contabilidade-mercado]] §1
- CTR — sem benchmark próprio ainda, medir no V0

---

## Etapa 2 — Interesse

### O que precisa acontecer
- 🔄 **Corrigido 18/08.** Ad **não leva mais direto pro WhatsApp** por padrão — leva pra landing page de venda (quem ainda considera) ou direto pro app/download (quem já decidiu), conforme a altura do funil (ver correção no topo do doc). WhatsApp fica disponível como apoio pra quem trava, não como destino do clique
- Proposta de valor clara: preço fechado + humano de verdade (contador CRC a partir do plano ME/Simples; no MEI, assistente virtual de contabilidade)

### Métrica-chave
- CPL: R$40-80 (estimativa nicho contábil) — [[trafego-pago-contabilidade-mercado]] §1
- Taxa de abertura da mensagem: 98% (WhatsApp, benchmark B2B geral)

---

## Etapa 3 — Consideração

### Pontos críticos
- Quebra de objeção específica em tempo real (Fator R, cobertura de folha, prazo)

### Fricções a remover
- Nada de formulário longo — a conversa via WhatsApp já é o fluxo
- Humano responde rápido (a promessa "atendimento no primeiro minuto" é a arma contra a commoditização dos líderes — [[trafego-pago-contabilidade-mercado]] §4)

### Métrica-chave
- Taxa de resposta → conversa qualificada

---

## Etapa 4 — Momento decisivo

### O que determina a conversão aqui
- 🔄 **Corrigido 18/08.** Não é mais "a conversa de WhatsApp" — é a **landing page de venda** (Fundo A, quem ainda considera) ou o **próprio download+pagamento** (Fundo B, quem já decidiu). O fundo do funil é o pagamento, não o download sozinho — baixar sem pagar é custo, não conversão
- Prova de humano real (nome, CRC) — responde à ferida "vocês têm contador de verdade?" ([[insights-estrategicos]] achado 1)
- Garantia 7 dias, **sem o adjetivo "incondicional"** — corrigido 18/08 por pesquisa jurídica (CDC art.30 vinculação de oferta): custos irreversíveis (certificado, taxas públicas) são descontados no estorno, não devolvidos junto

### Métricas-chave
- **Taxa de conversão lead→cliente-alvo:** 🔄 base de cálculo mudou 18/08. O "~10,8% ME / ~30% MEI irreal" citava um funil **consultivo** (lead→contato→qualificação→proposta→fechamento, equipe comercial), que não é o nosso — nosso funil não tem etapa de lead (anúncio→app→pagamento). CAC-alvo agora é medido direto contra LTV 12m (R$30–100), não por essa taxa — ver [[economia-preco-cac]] §6 e [[estrutura-funil-trafego]]
  - MEI: deixou de estar excluído do tráfego pago por aritmética (18/08) — ver [[estrutura-funil-trafego]]
- Ciclo de venda: 15-45 dias (padrão B2B financeiro) · exceção: abertura urgente (contrato na mão, volante [[a1-dev-freelancer-recem-clt]]) pode fechar em dias

---

## Etapa 5 — Compra

### Checkout ideal
- Assinatura via cartão/PIX, sem cadastro redundante
- Garantia 7 dias visível no momento da assinatura (já é feature real do produto)

### Métricas-chave
- Taxa de abandono de checkout — medir no V0
- Ticket médio: R$139 (ME) predominante nos segmentos ativos de tráfego pago

---

## Etapa 6 — Entrega

### Experiência ideal
- Onboarding guiado (certificado digital, documentos, CNPJ) já mapeado no flow interno do produto
- Confirmação clara e celebrativa ("Legalizai Story Book! 🎉") no marco de conquista

### Por que importa
Entrega memorável = matéria-prima pro pilar 6 (prova/reação) do orgânico, uma vez que existir base real de clientes.

---

## Etapa 7 — Compartilhamento

### Loops possíveis
1. Indicação dentro de comunidade profissional (forte pra Persona B — salões, esteticistas se indicam entre si)
2. Indicação entre freelancers/devs (Persona A — comunidades coesas, [[perfil-microempreendedor-mercado]] §4)

### Como incentivar
- Programa de indicação com benefício claro (a definir — não travado ainda)
- Mecânica de engajamento orgânica ([[mecanicas-engajamento]]) alimenta esse loop mesmo pré-cliente

### Métrica-chave
- Taxa de referral — medir só após base real existir

---

## Etapa 8 — Recompra / Upsell

Não é recompra clássica (é assinatura contínua). O evento equivalente é a **transição MEI→ME** (upsell natural, gatilho = teto de faturamento R$81k/ano) — ocasião de maior valor já mapeada em [[PESQUISA-MERCADO]] §D.

### Métrica-chave
- Taxa de upsell MEI→ME
- Churn/retenção mensal — sem dado ainda, V0 não mede isso (mede intenção, não retenção real)

---

## Funil completo — números-alvo (parcial, falta dado próprio)

> 🔄 **Tabela corrigida 18/08** — a métrica-farol deixou de ser "conversa→cliente" (base consultiva) e virou **clique→pagante** direto, medido contra a régua de CAC (R$30–100 vs LTV 12m). Ver [[economia-preco-cac]] §6.

| Etapa | Métrica | Meta inicial | Fonte |
|---|---|---:|---|
| Descoberta → Interesse (LP ou app) | CPL | R$40-80 | [[trafego-pago-contabilidade-mercado]] (estimativa nicho) |
| Clique → conversa qualificada (quando passa por WhatsApp de apoio) | taxa de resposta | sem benchmark próprio | medir no V0 |
| **Clique → cliente pagante (ME)** | conversão | 2–8% (implícito na régua CAC R$30–100 c/ CPC R$2–8) | [[economia-preco-cac]] §6 |
| **Clique → cliente pagante (MEI)** | conversão | mesma faixa — **deixou de estar barrado**, condicionado a seguir sem atendente humano | [[estrutura-funil-trafego]] |
| Ciclo de venda | tempo | 15-45 dias (exceção: urgência) | [[trafego-pago-contabilidade-mercado]] §3 |

### Conversão fim-a-fim
Ainda não estimável com confiança — depende do V0 rodar. Os números acima são teto/piso de referência pra calibrar o gate empírico ([[validacao-ideia]]), não meta fechada.

## Cross-refs

- Estrutura de budget/segmento: [[estrutura-funil-trafego]] · Campanha real: [[frente-1-captacao-meta-bh]]
- Arquétipo/tom-base (a "proposta de valor clara" da Etapa 2 e a "resposta humana" da Etapa 4 seguem o registro Aliado, não vendem tecnologia): [[posicionamento]] §Arquétipos
