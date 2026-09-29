---
tipo: verdade
status: vivo
data: 2026-08-28
assunto: mei-obrigacoes-operacionais
deriva_de: [resultado-pesquisa-mei-obrigacoes-28-08]
tags: [mei, fiscal, trabalhista, obrigacoes, fonte-primaria]
---

# 🟢 Obrigações operacionais do MEI — fonte-verdade (27-28/08)

> Cruzamento de 2 rodadas: pesquisa própria (WebSearch/WebFetch, 3 frentes) + pesquisa Gemini Pro ([[resultado-pesquisa-mei-obrigacoes-28-08]]). Cada fato aqui já passou pelas duas fontes concordando, ou está marcado onde só uma confirmou. Primeira etapa de "obrigações pós-constituição" — ME/Simples Nacional geral vem depois, reaproveitando a seção 6 abaixo.

## 1. Obrigação contábil

- 🟢 MEI dispensado de escrituração contábil formal (Livro Diário/Razão), sem chancela de contador. **CGSN 140/2018, art.106 §1º** + LC 123/2006.
- 🟢 O substituto é o **Relatório Mensal de Receitas Brutas** — preenchimento manual, obrigatório todo mês, mesmo prazo do DAS (dia 20). Não existe "livro-caixa" formal específico pro MEI (isso é regra de ME/EPP geral, art.26 §2º/27 LC123 — MEI é regime à parte).
- 🟢 Guarda de documento fiscal (NF emitida/recebida, XML/DANFE/DPS): **5 anos**, contados do exercício seguinte ao lançamento (CTN, Lei 5.172/1966).
- 🟡 Distribuição de lucro isento de IRPF sem contabilidade regular fica limitada a **8% (comércio/indústria/transporte)** ou **32% (serviço)** da receita bruta — Lei 9.249/1995 art.15. Acima disso vira rendimento tributável na PF. Confirmado só pela pesquisa Gemini, não cruzado pela própria — 🟡 confiança média-alta.

## 2. DAS-MEI (guia mensal)

- 🟢 Composição (2026, salário mínimo R$1.621): INSS **R$81,05** (5% do mínimo) + ICMS **R$1,00** (comércio/indústria) e/ou ISS **R$5,00** (serviço). MEI de serviço puro = **R$86,05/mês**. Fonte: Lei 8.212/91 art.21 §2º II "a" + LC123 art.18-A §3º V.
- 🟢 Vencimento: **dia 20** do mês seguinte. Cai em fim de semana/feriado bancário nacional → **prorroga pro próximo dia útil**, sem encargo. LC123 art.40 + CGSN140 art.40.
- 🟢 Atraso: SELIC (do dia seguinte ao vencimento até o mês anterior ao pagamento) + 1% no mês do pagamento + multa de mora **0,33%/dia, teto 20%** do tributo.

## 3. Emissão de Nota Fiscal

- 🟢 PF: dispensada, salvo pedido do cliente. PJ: **sempre obrigatória** — exceto se o PJ comprador emitir NF de entrada por conta própria (LC123 art.26 §6º II; CGSN140 art.106 II "a").
- 🟢🎯 **NFS-e Nacional obrigatória desde 1º/09/2023** (Resolução CGSN 169/2022, ajustada por 171/2022 e definida por 172/2023). Municípios **proibidos** de manter emissão local pro MEI — só consulta de nota antiga.
- 🟢 **BH confirmado**: Portaria SMFA 042/2023 bloqueou o BHISS pro MEI em 01/09/2023.
- 🟢 **Sem certificado digital exigido** — login gov.br (Prata/Ouro) ou usuário/senha (título de eleitor/IRPF).
- 🟢 **API REST oficial disponível** (`POST /nfse`, `GET /nfse/{chaveAcesso}`) — integração direta possível, sem depender de sistema municipal.
- 🟢 Mecânica: contribuinte envia **DPS** (Declaração de Prestação de Serviço) → Sefin Nacional valida → gera **NFS-e** definitiva. Código de serviço é **NBS** (nacional, substitui código municipal). **CRT 4** obrigatório no preenchimento.
- 🟡 Comércio/indústria continua fora (NF-e/NFC-e via SEFAZ estadual) — não é nosso caso (serviço puro), mas relevante se algum cliente tiver atividade mista.
- 🟡 Penalidade municipal BH por não emitir: R$100/documento (teto R$1.000/ação fiscal) — Lei 5.641/1989. Confiança média (achado só pela pesquisa Gemini, não cruzado).

## 4. DASN-SIMEI (declaração anual)

- 🟢 Prazo: **31 de maio** do ano seguinte. CGSN140 art.109.
- 🟢 Formulário: faturamento bruto total do ano anterior, segregado **ICMS × ISS** (comércio × serviço) + confirmação binária de ter tido empregado. **Não há campo de split PF×PJ** — isso vive só no Relatório Mensal (item 1).
- 🟢 Multa: **2% ao mês sobre os tributos declarados**, piso **R$50** (reduzido a **R$25** se entrega espontânea antes de qualquer ação de ofício), teto **20%**. Lei 8.981/1995 + IN RFB 2.119/2022.
- 🟢🎯 **Inaptidão do CNPJ após 90 dias** sem entregar obrigação acessória (IN RFB 2.119/2022, art.81 c/ Lei 9.430/96 art.38 I) — bloqueia emissão de NF, crédito, regularidade geral.

## 5. Teto de faturamento e desenquadramento

- 🟢 Teto **R$81.000/ano** (LC123 art.18-A), congelado desde 2018 (LC155/2016 elevou de R$60k pra R$81k).
- 🟢 PLP em tramitação propondo R$130-140k — **não é lei**, não usar como valor vigente.
- 🟢 Proporcional se abre no meio do ano: **R$6.750 × meses ativos** (mês de abertura conta inteiro, mesmo se abriu no último dia).
- 🟢 Regra dos 20%, com faixas exatas:
  - **Excesso até 20%** (R$81.000,01 a R$97.200,00): efeito só a partir de **1º de janeiro do ano seguinte**. DAS complementar cobra só o excedente, pelas alíquotas de ME, **sem juros/multa**.
  - **Excesso acima de 20%** (acima de R$97.200,01): desenquadramento **retroativo** — à data de abertura (se no próprio ano) ou a 1º/jan (se ano subsequente). Recalcula tudo como ME, **com juros e multa**.
  - LC123 art.18-A §7º I/II.
- 🟢🎯 **Não existe ferramenta oficial de monitoramento.** É manual, sem alerta de proximidade do teto. Confirmado nas duas rodadas de pesquisa — este é o gap de mercado que sustenta a feature de monitoramento (ver doc de funcionalidades).

## 6. MEI-empregador (o único funcionário permitido)

- 🟢 Limite: **1 empregado**, salário mínimo ou piso da categoria. LC123 art.18-C.
- 🟢 CPP **reduzida a 3%** sobre a folha (vs 20% do regime geral). LC123 art.18-C §1º, regulamentada por ADE CODAC 49/2009.
- 🟢 eSocial **Módulo Simplificado (Web MEI)**. Eventos: **S-2200** (admissão), **S-1200** (folha mensal), **S-2299** (rescisão/desligamento).
- 🟢 Login: código/senha **abolido em abril/2023** — exige conta gov.br nível **Prata ou Ouro**.
- 🟢 FGTS 8%, migrou pro **FGTS Digital em 1º/03/2024** (saiu da Caixa/Conectividade Social).
- 🟢 Guia única (**DAE**): INSS 3% + FGTS 8% + IRRF (se houver). Vencimento mudou de **dia 07 pra dia 20 a partir da folha de março/2024** (Lei 14.438/2022).
- 🟡 Guia rescisória (multa 40% FGTS) também via FGTS Digital. S-2500 (reclamatórias trabalhistas) entra no FGTS Digital a partir de **maio/2026**.
- 🟢 13º salário: 1ª parcela até **30/11**, 2ª até **20/12**.
- 🟢 Férias: aviso mínimo **30 dias** antes (CLT art.135), pagamento até 2 dias antes do início, com 1/3 constitucional.
- 🟢 Exame admissional: **antes** do início do trabalho (CLT art.168).
- 🟢 Exame demissional: até **10 dias** da rescisão (NR-07 subitem 7.5.11) — dispensa se exame periódico recente ainda válido.
- 🟢 SST: **PGR dispensado** (NR-01 subitem 1.8.1). **PCMSO dispensado como documento**, mas exame (admissional/periódico a cada 2 anos/demissional) continua obrigatório e o **MEI paga** (NR-01 1.8.6 + NR-07 7.7.1). **CIPA dispensada** (só 1 empregado).

## 7. Base compartilhada — o que muda no ME/Simples geral (múltiplos empregados)

> Pesquisado agora, reaproveitado quando entrarmos na fase ME/Simples Nacional.

- 🟢 CPP no ME **embutida no DAS** pros Anexos **I, II, III e V** — guia única, sem GPS/DARF separado.
- 🟢 Anexo **IV**: CPP **separada**, alíquota cheia **20%** sobre a folha, via **DCTFWeb/DARF**.
- 🟢 Fator R decide entre Anexo III e V, **não muda** a mecânica de CPP entre eles (os dois têm CPP embutida) — só o Anexo IV é diferente nesse ponto.
- 🟢 **Sem teto de headcount** — só teto de faturamento. Dentro do Simples Nacional geral: **R$4,8 milhões/ano** (LC123 art.3º II). "ME" como rótulo específico (não confundir com "MEI"): até **R$360.000/ano** (LC123 art.3º I) — **mas é só nomenclatura de faixa**, a mecânica de DAS/Anexo/Fator R é idêntica pra ME e EPP, sem obrigação adicional ao cruzar R$360k.
- 🟢 eSocial completo (**Web Geral**), não o simplificado — exige e-CNPJ ICP-Brasil ou procuração eletrônica e-CAC pro contador. Código de classificação tributária muda de "04" (MEI) pra "01/02/03" (Tabela 11 do Manual eSocial).
- 🟡 SST escalona por **grau de risco (NR-04)**: grau 1/2 sem exposição real → Declaração de Inexistência de Riscos dispensa PGR/PCMSO formal. Grau 3/4 → laudo obrigatório (engenheiro/médico), eventos S-2210/S-2220/S-2240. **CIPA**: depende do quadro de contingente da NR-05 cruzado com grau de risco — mecanismo confirmado, mas **a tabela numérica exata de headcount por grau de risco não foi lida linha a linha** (NR-05, Quadro I) — 🟡 pendência pra quando formos construir a feature de SST do ME.

## Pendências pra próxima rodada (não bloqueiam)

1. Tabela exata NR-05 (headcount × grau de risco → obrigatoriedade de CIPA).
2. Confirmar se o custo de exame periódico (a cada 2 anos) do MEI-empregador tem algum teto de valor de referência (pra estimar custo no produto).
3. Confirmar mecanismo exato de como a Receita cruza e-Financeira × NFS-e emitida pra disparar desenquadramento de ofício (LC123 art.29) — relevante pra saber se vale alertar o cliente sobre esse risco específico.

## Links
- [[resultado-pesquisa-mei-obrigacoes-28-08]] — fonte externa arquivada.
- [[mei-mapeamento-funcionalidades]] — o que isso vira de produto.
- [[estado-atual-obrigacoes-operacionais]]
- `app/src/lib/fiscal.ts` — motor que vai consumir esses dados quando virarem produto.
