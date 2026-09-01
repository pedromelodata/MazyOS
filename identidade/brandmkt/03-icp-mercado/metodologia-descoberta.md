---
tipo: derivado
status: vivo
data: 2026-08-05
assunto: metodologia-descoberta
deriva_de: [BASE-ESTRATEGICA]
tags: [pesquisa, metodologia, produto]
---

# 🔍 Metodologia de descoberta — 2 lentes

> Não é framework novo — é o que já rodamos (`BASE-ESTRATEGICA.md` §6 + `CHECKLIST-IMERSAO-30-DIAS.md`) organizado em 2 lentes que se completam.

## Lente 1 — mercado/comportamento

**Foco:** contexto, tendências digitais, comportamento do público.
**Onde já roda:** Camada 1 do §6 — desk research leve (teardown concorrentes, pricing, sizing) → [[legalize-tabela-cnae-contabilizei-extraida]], `mercado-bh-regional.md`, `pesquisa/concorrentes/`.

## Lente 2 — descoberta de produto (Marty Cagan, 4 riscos)

**Foco:** validar hipótese com rigor antes de construir.

| Risco | Pergunta | Onde mitigamos |
|---|---|---|
| **Valor** | Cliente vai comprar/usar? | Funil de 2 estágios mês 2 (S5-S7): pesquisa fria (CPL R$5-25) → retargeting landing com preço → % intenção-de-pagar |
| **Usabilidade** | Cliente consegue usar? | Shadowing S3: acompanhar rotina de 3-5 clientes ICP ponta a ponta (como emitem NF, pagam DAS, onde travam) |
| **Viabilidade** | Negócio funciona financeiramente? | `economia-preco-cac.md` (margem/CAC-alvo) + pricing rascunhado S3, fechado S7 |
| **Factibilidade** | Dá pra construir com o que se tem? | Spike sênior S7 (1 sem, R$3k): sandbox Focus NFe BH/Contagem + arquitetura preliminar |

Camada 2 do §6 (discovery profundo) = onde os 4 riscos são atacados juntos, pós-SIM da sociedade.

---

## Fluxo integrado real (nosso, não genérico)

```
MÊS 1 — imersão PRA DENTRO (operação Legalize)
S1 Raio-X operação → S2 Compliance/automação → S3 Carteira+shadowing → S4 Síntese+spec v1
        ↓
MÊS 2 — imersão PRA FORA (mercado, funil de 2 estágios)
S5-S6 Pesquisa fria (volume, CPL) → S7 Intenção quente + spike técnico → S8 GATE
        ↓
GATE 3 CORES (ver [[validacao-ideia]] quando travado)
🟢 Verde → V1 dia 1 do mês 3
🟡 Amarelo → 1 ciclo de correção (2-3 sem, ~R$3-5k extra), 2x amarelo = vermelho
🔴 Vermelho → NO-GO, ~R$122k de build economizados
```

**Regra do processo:** cada semana destrava a seguinte. Mês 1 inteiro destrava mês 2. Mês 2 destrava o build.

## Por que 2 lentes juntas

- Só mercado/comportamento: forte em estratégia, fraco em validar se o produto de fato resolve.
- Só descoberta de produto: forte em rigor, cego pra nuance de mercado local (BH/MG, regime tributário, concorrência regional).
- Juntas: desk research barato primeiro (Camada 1, grátis) filtra o óbvio antes de gastar os 2 meses caros de discovery profundo (Camada 2).

---

## Cross-refs

- Fonte primária: `BASE-ESTRATEGICA.md` §6, `execucao/CHECKLIST-IMERSAO-30-DIAS.md`
- Economia: [[economia-preco-cac]]
- Benchmarking: `pesquisa/concorrentes/`
- Validação go/no-go: pendente — próximo slot
