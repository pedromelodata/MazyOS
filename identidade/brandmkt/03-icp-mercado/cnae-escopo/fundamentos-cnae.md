---
tipo: derivado
status: vivo
data: 2026-08-27
assunto: fundamentos-cnae
deriva_de: [lc123-art18-anexos-taxativo, resultado-pesquisa-fundamentos-cnae-27-08]
tags: [pesquisa, cnae, fiscal, simples-nacional, mei]
---

# 🧭 CNAE — o que é, e por que decide o imposto

> 🟢 **Confiança: ratificado em fonte primária** (LC 123/2006, Res. CGSN 140/2018, Res. CGSIM 51/2019, Art. 966 CC, Soluções de Consulta Cosit) via [[resultado-pesquisa-fundamentos-cnae-27-08]] em 27/08. V1 tinha 2 hipóteses marcadas 🔑 — ambas confirmadas, ver seção 2 abaixo.

## O que é

**CNAE** = Classificação Nacional de Atividades Econômicas. Código oficial (IBGE, em conjunto com Receita Federal e outros órgãos via CONCLA) que declara **o que a empresa faz de fato**. Todo CNPJ tem 1 CNAE principal (a atividade que mais gera receita/é a razão de existir da empresa) e pode ter vários CNAEs secundários (outras atividades que ela também exerce).

## Estrutura hierárquica

Do mais genérico pro mais específico:

| Nível | Formato | Exemplo |
|---|---|---|
| Seção | 1 letra | J · Informação e Comunicação |
| Divisão | 2 dígitos | 62 |
| Grupo | 3 dígitos | 620 |
| Classe | 4 dígitos + dígito verificador | 6201-5 |
| **Subclasse** | +2 dígitos | **6201-5/02** |

É a **subclasse** (código completo com `-X/YZ`) que vai no cartão CNPJ — é esse nível que a gente trabalha na `cnae-matriz/`.

## Por que o CNAE decide o imposto (4 efeitos reais)

### 1. Anexo do Simples Nacional (III ou V)
Base legal: Art. 18 da LC 123/2006 (o extinto Anexo VI foi revogado pela LC 155/2016 e fundido no mecanismo atual). Três blocos:

- **§ 5º-B** = lista fechada, **SEMPRE Anexo III**, nunca entra Fator R. Ex.: creches, agências de viagem, academias, instalação/manutenção/reparação, **contabilidade** (inciso XIV — exceção deliberada do legislador, mesmo sendo atividade intelectual).
- **§ 5º-D / § 5º-I** = lista de atividades **sujeitas ao Fator R** (migram III↔V conforme folha/receita). Ex.: fisioterapia, arquitetura, medicina, odontologia, psicologia, engenharia, consultoria/gestão, jornalismo, publicidade, **software** (SC Cosit 59/2022 e 31/2022). Cláusula de varredura no inciso XII: "outras atividades de natureza intelectual" pega análogas não nominadas.
- 🔑 **Não existe lista oficial de atividades SEMPRE Anexo V.** Confirmado: desde a LC 155/2016, Anexo V não é mais destino fixo — é a penalidade condicional pra quem não bate 28% de Fator R. Toda atividade Fator R tem, por definição, porta aberta pro III.

Regra de migração: **§ 5º-J** (folha/receita ≥28% → III) e **§ 5º-M** (<28% → V).

### 2. Elegibilidade ao MEI
🟢 **Confirmado (era hipótese 🔑 no V1): é filtro JURÍDICO separado, não "Simples ME com teto de faturamento menor".**

- Lista oficial fechada: **Anexo XI da Resolução CGSN 140/2018**. Portal do Empreendedor só espelha essa lista, não cria regra própria.
- Base da exclusão: **Art. 100 Res. CGSN 140/2018 c/c Art. 966, parágrafo único, do Código Civil**. O CC exclui do conceito de "empresário" quem exerce profissão intelectual, científica, literária ou artística — e o MEI é definido como empresário individual monocrático (Art. 966 caput). Logo, atividade intelectual/técnica/regulamentada fica de fora do MEI **mesmo que sirva perfeitamente pro Simples ME**.
- Exemplo mais importante pro produto: **contabilidade (6920-6/01) é Anexo III privilegiado no Simples ME, mas é VEDADA ao MEI.** Regra geral prática: se o CNAE é atividade intelectual/técnica/regulamentada (dev sob encomenda, advocacia, medicina, engenharia, arquitetura, odontologia, contabilidade, consultoria em gestão, fisioterapia, veterinária), não oferecer MEI como caminho.

### 3. Risco municipal (baixo/médio/alto)
Base: **Lei 13.874/2019 (Liberdade Econômica)**, Art. 3º §1º II, operacionalizada pela **Resolução CGSIM 51/2019** (+ 57/2020, 59/2020). Lista positiva de CNAEs "Nível de Risco I" no Anexo I dessa resolução — dispensa vistoria/alvará prévio. Se o município não regulamentar (ou regulamentar divergente), vale a tabela federal por padrão.

**Endereço residencial como "Ponto de Referência"** exige as DUAS condições juntas: (1) CNAE em Nível de Risco I, (2) atividade exercida na residência **sem recepção de público**. Conecta com a decisão já travada sobre Estabelecimento Fixo (`marca/decisoes-marca.md` 26/08).

### 4. Comércio × Serviço
O MVP hoje só atende serviço; CNAEs de comércio ficam de fora por decisão de escopo (não por limitação do CNAE em si).

## Fórmula do Fator R (detalhe técnico, ratificado)

**Fator R = Folha de Salários (12 meses, regime de CAIXA) / Receita Bruta (12 meses, regime de COMPETÊNCIA)**

- Numerador: salários CLT + pró-labore (se declarado no IRPF) + CPP + FGTS, só o **efetivamente pago** (SC Cosit 17/2019 — provisão/eSocial sem pagamento não conta). Sem teto pelo salário de contribuição INSS (SC Cosit 24/2020). Exclui aluguéis e distribuição de lucros/dividendos.
- Denominador: receita pelo fato gerador (faturamento), não pelo caixa.
- **Assimetria caixa×competência**: pico de faturamento pesa o denominador na hora; aumento de folha só pesa o numerador quando o pagamento sai. Risco de queda pro Anexo V em empresa que fatura mais rápido do que paga.
- Empresa nova (<13 meses): anualiza (média mensal × 12).
- Recálculo **mensal**, janela móvel de 12 meses.
- 🔑 **Confirmado: não existe margem de segurança oficial nos 28%** — é limiar binário e seco na lei. Buffer de 30-32% usado no mercado é prática prudencial, não regra. **Decisão de produto em aberto:** que buffer o simulador usa como alerta preventivo (28% travado é o corte legal; se o produto quiser avisar "risco" antes da borda, precisa escolher um número — não vem da lei).

## O que ainda está em aberto

- ✅ **Lista COMPLETA do Anexo XI CGSN140 (MEI) — feita 27/08.** 351 dos 1332 CNAEs permitem MEI, já na matriz (`mei_permitido`/`mei_ocupacoes`/`mei_iss_fixo_das`/`mei_icms_fixo_das`). Ver `cnae-matriz-governo.md` §2a.
- ✅ **Lista COMPLETA do Anexo I da Res. CGSIM 51/2019 (Nível de Risco I) — feita 27/08.** 284 dos 1332 CNAEs mapeados como baixo risco (2 itens da resolução ficaram órfãos por código CNAE desatualizado — documentado, não é bloqueante). Já na matriz (`risco_baixo_cgsim`/`risco_cgsim_desc_oficial`). Ver `cnae-matriz-governo.md` §2b.
- Buffer de segurança do Fator R pro simulador (ver acima) — decisão de produto, não de pesquisa.
- Esta pesquisa não cobriu o **§ 5º-C (Anexo IV, CPP fora do DAS — advocacia, construção, limpeza/vigilância)**, que o motor `cnae-fiscalmente-otimo.md` já usa (Grupo C). Não é contradição, é escopo que a pesquisa não pediu — vale rodada futura se o produto for expandir aí.

## Cross-refs

- [[resultado-pesquisa-fundamentos-cnae-27-08]] — resultado completo da pesquisa que ratificou esta nota.
- [[prompt-pesquisa-fundamentos-cnae-anexos-mei]] — prompt original.
- `execucao/cnae-fiscalmente-otimo.md` — motor que recomenda o CNAE mais barato; cruzado com esta pesquisa, **sem contradição** (ver seção final do resultado).
- `pesquisa/fiscal-simples-bh-2026.md` — bloco fiscal consolidado atual, fonte-verdade do flow até aqui.
