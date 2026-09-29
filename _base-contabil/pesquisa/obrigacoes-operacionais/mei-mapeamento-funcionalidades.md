---
tipo: derivado
status: vivo
data: 2026-08-29
assunto: mei-mapeamento-funcionalidades
deriva_de: [mei-obrigacoes-operacionais]
tags: [mei, produto, funcionalidades, portal, dev]
---

# 🛠️ Primeiro mapeamento oficial — funcionalidades do portal pro cliente MEI

> Cruza [[mei-obrigacoes-operacionais]] (o que a lei exige) com cobertura real de API (InfoSimples confirmado 29/08 + API oficial gov.br/nfse). Cada linha: se já é indispensável (acordado) ou sugestão minha, com justificativa e de onde vem o dado.

## Tabela

| # | Funcionalidade | Classificação | Justificativa | Depende de |
|---|---|---|---|---|
| 1 | Calendário fiscal unificado (DAS-MEI dia 20, DASN-SIMEI 31/05, DAE dia 20 se empregado) | 🔴 Imprescindível | Espinha dorsal de "manter regular", sem isso não tem produto | **Interno** — datas fixas por lei, só codificar regra + feriado nacional |
| 2 | Emissor de NF via API oficial nfse.gov.br | 🔴 Imprescindível | Sem isso cliente não fatura B2B (obrigatório) | **Órgão externo** — API oficial NFS-e Nacional (mTLS + certificado ICP-Brasil, layout Swagger próprio). **InfoSimples NÃO cobre emissão**, só consulta nota já emitida por chave. Fica: ou credenciamento direto nosso, ou parceiro tipo Focus NFe/Nota Gateway que já fez essa integração |
| 3 | Relatório Mensal de Receitas Brutas digitalizado | 🔴 Imprescindível | É a obrigação em si + alimenta teto e DASN-SIMEI | **Interno** — formulário nosso. 💡 Automação possível: puxar do histórico de NF emitida (item 2) em vez de digitar |
| 4 | Monitor de teto com alerta proativo | 🔴 Imprescindível | Zero ferramenta oficial faz isso — é o diferencial mais forte que achamos | **Interno** — soma dos relatórios (item 3) vs regra legal, sem consulta externa |
| 5 | Assistente de DASN-SIMEI (monta a partir dos 12 relatórios) | 🔴 Imprescindível | Risco alto: multa + inaptidão de CNPJ em 90 dias | **Misto** — preencher é interno; **consultar se já foi entregue** é via InfoSimples (RF/Simples DASN-SIMEI, confirmado). **Transmitir a declaração nova não tem API** (nem InfoSimples nem oficial) — fica manual no portal, cliente confirma "enviei" no nosso sistema |
| 6 | Painel de guias/histórico de pagamento (DAS-MEI + FGTS) | 🔴 Imprescindível | Visibilidade básica que todo portal financeiro precisa | **Órgão externo, confirmado InfoSimples** — "Emissão de DAS de MEI" (RPA que loga no site RF e puxa boleto) + "FGTS/Guia de Arrecadação" (consulta FGTS Digital, exige cert. pkcs12 ou login CPF+senha do cliente) |
| 7 | Contador regressivo de inaptidão (90 dias) | 🟡 Sugestão | Baixo custo, alto valor preventivo | **Interno** — cálculo de data a partir do vencimento perdido |
| 8 | Calculadora "quanto posso retirar sem imposto" (8%/32%) | 🟡 Sugestão | Achado da rodada — evita erro tributário na retirada de lucro | **Interno** — fórmula fixa × receita, zero consulta externa |
| 9 | Alerta de reajuste anual do valor do DAS-MEI | 🟡 Sugestão | Baixo esforço, evita susto (valor muda com salário mínimo) | **Interno** — atualizamos a constante 1x/ano, sem consulta automática |
| 10 | Central de documentos (guarda 5 anos, XML/DANFE) | 🔴 Imprescindível | Obrigação legal de guarda + expectativa do cliente | **Misto** — guarda é infra nossa; documento original vem da API do item 2 |
| 11 | Consulta de situação cadastral do CNPJ/regularidade | 🟡 Sugestão | Útil, mas já pode estar coberta por integração existente do produto | **Órgão externo, confirmado InfoSimples** — RF/CNPJ, RF/Situação Fiscal |
| 12 | MEI-empregador — guia DAE (INSS 3%+FGTS 8%+IRRF) | 🟡 Sugestão | Cálculo simples, mas volume real de MEI com funcionário no V1 é incerto | **Interno** — regra fixa. Consulta da guia já gerada cai no item 6 (FGTS) |
| 13 | MEI-empregador — eventos eSocial (S-2200/S-1200/S-2299) | 🟡 Sugestão | Mesma incerteza de volume do item 12 | **Órgão externo, SEM cobertura hoje** — nem InfoSimples nem API oficial documentada (Dataprev descontinuou consulta eSocial). Fica manual (orientar cliente no portal Web MEI) até achar parceiro/API |
| 14 | MEI-empregador — férias/13º/exames | 🟡 Sugestão | Mesma incerteza de volume dos itens 12-13 | **Interno** — datas e cálculo são regra fixa (CLT), sem consulta externa |

## Achado novo (InfoSimples, 29/08)

Catálogo checado ponto a ponto (https://infosimples.com/consultas/). Quase tudo é **consulta (read-only)**, não emissão:

- **Confirma cobertura pronta**: CNPJ/situação fiscal, MEI/Simples Nacional cadastral, DASN-SIMEI (só status, não transmissão), DAS-MEI (RPA que puxa boleto), guia de parcelamento MEI, FGTS/Guia de Arrecadação (via FGTS Digital), NFS-e (consulta por chave de acesso).
- **Gap confirmado**: eSocial (Dataprev descontinuou consulta individual/lote) e emissão de NFS-e nova (InfoSimples só consulta, emitir exige integração direta com a API oficial gov.br/nfse ou parceiro tipo Focus NFe).
- Boa parte das consultas InfoSimples que envolvem RPA (DAS-MEI, FGTS) **exige credencial do próprio cliente** (CPF+senha gov.br, ou certificado digital pkcs12) — não é "puxar de graça sem o cliente", precisa ele autorizar/ceder acesso.

### URLs exatas dos produtos checados (pra não repesquisar)

| Produto | URL | Parâmetros de entrada |
|---|---|---|
| RF/Simples (Emissão de DAS de MEI) | infosimples.com/consultas/receita-federal-simples-das/ | `cnpj`, `data_pagamento`, `periodo` |
| RF/Simei/MEI — Emissão de Guia de Parcelamento | infosimples.com/consultas/receita-federal-simei-mei-eg/ | `cnpj`, `codigo_acesso`, `cpf`, `mes_ano` |
| RF/Simples (DASN-SIMEI) | infosimples.com/consultas/receita-federal-simples-dasn/ | `cnpj` |
| RF/SIMEI (Declaração Anual) | infosimples.com/consultas/receita-federal-simei-dasn/ | (produto irmão do acima, não abrimos a fundo) |
| RF/NFS-e (consulta por chave) | infosimples.com/consultas/receita-federal-nfse/ | `chave` |
| RF/NFS-e/Notas Emitidas | infosimples.com/consultas/receita-federal-nfse-emitidas/ | (não abrimos a fundo) |
| FGTS/Guia de Arrecadação | infosimples.com/consultas/fgts-guia/ | `login_cpf`, `login_senha`, `pagina`, `periodo`, `pkcs12_cert`, `pkcs12_pass`, `representado` |
| Caixa/Regularidade do Empregador (FGTS/CRF) | infosimples.com/consultas/caixa-regularidade/ | (não abrimos a fundo) |
| RF/Listagem de Períodos p/ Emissão de DAS | infosimples.com/consultas/receita-federal-listar-das/ | (não abrimos a fundo) |
| RF/PGFN/Lista de Devedores | infosimples.com/consultas/receita-federal-pgfn-devedores/ | (não abrimos a fundo, útil pra due-diligence, não MEI direto) |
| Dataprev/Qualificação cadastral (eSocial) | infosimples.com/consultas/dataprev-qualificacao/ | ⚠️ **descontinuado** pelo próprio portal eSocial |

Catálogo completo pra revisitar: https://infosimples.com/consultas/

## Princípios de design (herdados do resto do produto)

- **Nunca surpreender** — todo cálculo de teto/desenquadramento mostra o "porquê", não só o número (mesma doutrina do card verde/DAE do flow de abertura).
- **Monitoramento é o diferencial**, não a burocracia em si — o governo já tem PGMEI/eSocial/NFS-e nacional; nosso valor é a camada de alerta PROATIVO que não existe em lugar nenhum oficial.
- **API nacional de NFS-e é a peça central** do emissor — evita reinventar integração por prefeitura, já que MEI é 100% via sistema federal desde 2023.

## Aberto pra debate

1. Monitor de teto (item 4) — MVP (V1) ou fase 2? Diferencial forte, mas exige Relatório Mensal (item 3) já em uso com disciplina.
2. Módulo de folha MEI-empregador (itens 12-14) — quantos clientes reais teriam funcionário no V1? Sem API de eSocial, todo esforço de admissão/rescisão vira orientação manual — vale o esforço de UI se for minoria?
3. Emissor de NF (item 2) — como resolvemos: credenciamento direto nosso junto ao gov.br/nfse, ou contratar parceiro (Focus NFe/Nota Gateway) que já tem essa integração pronta? Decide custo e prazo de entrega do V1.
4. DASN-SIMEI (item 5) — aceitável que a transmissão fique manual (cliente faz no portal, só confirma no nosso app), ou vale investigar mais fundo se existe brecha de automação (procuração eletrônica e-CAC, por exemplo)?

## Links
- [[mei-obrigacoes-operacionais]] — fonte dos fatos.
- `app/src/lib/fiscal.ts` — onde esses cálculos (teto, CPP, DAS) eventualmente vivem no código.
