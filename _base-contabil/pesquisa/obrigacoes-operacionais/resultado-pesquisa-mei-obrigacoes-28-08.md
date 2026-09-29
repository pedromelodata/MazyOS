---
tipo: fato
status: vivo
data: 2026-08-28
assunto: resultado-pesquisa-mei-obrigacoes
fonte: Gemini Pro (Google Search), rodado pelo Pedro
tags: [pesquisa, mei, fiscal, trabalhista, fonte-externa]
---

# 📥 Resultado bruto — pesquisa Gemini sobre obrigações do MEI

> Arquivo original em `Downloads/Obrigações Fiscais MEI e ME.md` + `Downloads/Obrigatoriedade NFS-e Nacional MEI.md`. Copiado pra cá pra não depender de arquivo fora do repo. Cruzamento completo (o que confirma, corrige ou é novo vs a pesquisa própria em `pesquisa/obrigacoes-operacionais/mei-obrigacoes-operacionais.md`.

## Documento 1 — Obrigações Fiscais MEI e ME (relatório completo)

### 1. Obrigação contábil e guarda documental
MEI dispensado de escrituração formal (Livro Diário/Razão), sem chancela mensal de contador — LC 123/2006 + Resolução CGSN 140/2018. O mecanismo substitutivo é o **Relatório Mensal de Receitas Brutas**, obrigatório até dia 20 do mês seguinte, com as notas fiscais de compra/venda anexadas.

Guarda documental: prazo decadencial do CTN (Lei 5.172/1966), **5 anos** contados do exercício seguinte ao lançamento — vale pra XML/DANFE/DPS.

🆕 Achado extra: sem contabilidade regular, a distribuição de lucro isento de IRPF fica limitada aos percentuais de presunção do art. 15 da Lei 9.249/1995 — **8% (comércio/indústria/transporte de carga) ou 32% (serviço)** da receita bruta. Acima disso, sem contabilidade que prove lucro maior, o excedente vira rendimento tributável na pessoa física.

### 2. DAS-MEI
Composição: INSS 5% do salário mínimo (R$1.621 em 2026 → R$81,05) + ICMS R$1,00 (comércio/indústria) e/ou ISS R$5,00 (serviço) — Lei 8.212/1991 art.21 §2º II "a" + LC123 art.18-A §3º V.

Vencimento: dia 20 do mês seguinte. Se cair em fim de semana ou feriado bancário nacional, **prorroga pro próximo dia útil**, sem encargo (LC123 art.40; CGSN140 art.40).

Atraso: juros SELIC (do 1º dia do mês seguinte ao vencimento até o mês anterior ao pagamento) + 1% no mês do pagamento + multa de mora **0,33%/dia, teto 20%** do tributo devido.

### 3. Nota Fiscal
PF: dispensada, salvo pedido do cliente. PJ: obrigatória sempre — exceto se o próprio PJ comprador emitir NF de entrada, aí o MEI é dispensado também (LC123 art.26 §6º II; CGSN140 art.106 II "a").

**NFS-e nacional obrigatória desde 1º/09/2023** (Resolução CGSN 169/2022 + 172/2023, que alterou a data 3x: 01/2023 → 04/2023 → 09/2023 definitivo). Municípios proibidos de manter emissão local pro MEI a partir daí.

### 4. DASN-SIMEI
Prazo 31/05 do ano seguinte (CGSN140 art.109). Formulário pede: receita bruta total do ano anterior segregada entre ICMS×ISS (comércio×serviço) + confirmação binária de ter tido empregado. **Não confirma campo de split PF×PJ** — isso vive só no Relatório Mensal.

Multa: 2%/mês sobre tributos declarados, piso R$50 (R$25 se espontâneo antes de ação de ofício), teto 20% (Lei 8.981/95; IN RFB 2.119/2022).

🆕 Inaptidão do CNPJ após **90 dias** sem entregar obrigação acessória (IN RFB 2.119/2022, art.81 da Lei 9.430/96) — bloqueia emissão de NF, crédito, regularidade geral.

### 5. Teto e desenquadramento
R$81.000/ano (LC123 art.18-A), congelado desde 2018. Proporcional: R$6.750 × meses ativos (mês de abertura conta inteiro).

Regra dos 20% com números exatos: excesso até 20% = R$81.000,01 a R$97.200,00 → efeito só 1º/jan do ano seguinte, DAS complementar tributando só o excedente pelas alíquotas de ME. Excesso acima de R$97.200,01 → retroage (à abertura, se no mesmo ano; a 1º/jan, se ano subsequente), com juros e multa desde então.

PLP 108/2021 + PLP 186 (a numeração/ano variou entre 2024 e 2026 nas fontes) propõem R$130-140k — **não é lei**, ainda tramitando.

**Confirmado: não existe ferramenta oficial de monitoramento do teto.** É manual, sem alerta.

### 6. MEI-empregador
Limite 1 empregado, salário mínimo/piso de categoria (LC123 art.18-C). CPP 3% (LC123 art.18-C §1º, regulamentada pelo ADE CODAC 49/2009).

eSocial Módulo Simplificado (Web MEI), eventos: **S-2200** (admissão), **S-1200** (folha mensal), **S-2299** (rescisão). Login por código/senha foi abolido em abril/2023 — exige gov.br Prata/Ouro.

FGTS 8%, migrou pra **FGTS Digital em 1º/03/2024** (saiu do Conectividade Social/Caixa). DAE (guia única INSS+FGTS+IRRF) mudou de vencimento **dia 07 → dia 20 a partir da folha de março/2024** (Lei 14.438/2022). Guias rescisórias (multa 40% FGTS) também via FGTS Digital. S-2500 (reclamatórias trabalhistas) entra no FGTS Digital a partir de maio/2026.

13º: 30/11 (1ª) e 20/12 (2ª). Férias: aviso 30 dias antes (CLT art.135), pagamento até 2 dias antes c/ 1/3. Exame admissional: antes de começar (CLT art.168). Demissional: até 10 dias da rescisão (NR-07 subitem 7.5.11, dispensa se exame periódico recente válido).

SST: PGR dispensado (NR-01 subitem 1.8.1). PCMSO dispensado como documento, mas exame (admissional/periódico a cada 2 anos/demissional) continua obrigatório e o MEI paga (NR-01 1.8.6 + NR-07 7.7.1). CIPA dispensada (só 1 empregado).

### 7. O que muda no ME/Simples geral
CPP embutida no DAS pros Anexos I/II/III/V (guia única). Anexo IV: CPP separada, 20% sobre a folha, via DCTFWeb.

Sem teto de headcount — só teto de faturamento (Simples Nacional geral: R$4,8mi/ano, art.3º II; "ME" como rótulo específico dentro disso: até R$360k, art.3º I — dois rótulos, mesma mecânica de DAS/Anexo).

eSocial completo (Web Geral), não o simplificado — exige e-CNPJ ICP-Brasil ou procuração eletrônica e-CAC pro contador. Código de classificação tributária muda de "04" (MEI) pra "01/02/03" (Tabela 11 do Manual eSocial).

SST escalona por grau de risco (NR-04): grau 1/2 sem exposição real → Declaração de Inexistência de Riscos dispensa PGR/PCMSO formal. Grau 3/4 → laudo obrigatório, assinado por engenheiro/médico, eventos S-2210/S-2220/S-2240. CIPA: depende do quadro de contingente da NR-05 cruzado com grau de risco; empresas grau 1/2 pequenas ganham benefício de reunião bimestral (não mensal).

## Documento 2 — Obrigatoriedade NFS-e Nacional MEI (aprofundamento)

Linha do tempo da norma: Resolução CGSN 169/2022 (obrigou a partir de 01/2023) → CGSN 171/2022 (adiou pra 04/2023) → CGSN 172/2023 (data definitiva, **01/09/2023**).

⚠️ Achado de esclarecimento: em agosto/2026 há notícia de "prorrogação pra 01/11/2026" — **isso NÃO se aplica ao MEI**, é só pra ME/EPP (Resolução CGSN 191/2026, que revogou a 189/2026). MEI segue obrigado desde 2023.

Escopo: só serviço (ISS/LC116). Comércio/indústria continua NF-e/NFC-e estadual (SEFAZ), fora do sistema nacional. Atividade mista = usa os dois sistemas conforme a operação.

B2C (PF): facultativo. B2B (PJ): obrigatório sempre.

Onde emitir: Emissor Web (gov.br/nfse), App mobile, ou API REST (`POST /nfse`, `GET /nfse/{chaveAcesso}`) — **sem certificado digital exigido** (login gov.br Prata/Ouro ou usuário/senha validado por título de eleitor/IRPF).

Municípios proibidos de manter portal próprio pro MEI a partir de 01/09/2023 — podem manter só consulta de notas antigas.

Nomenclatura: sistema usa **DPS** (Declaração de Prestação de Serviço, o XML/formulário que o contribuinte envia) → processada pela Sefin Nacional → vira NFS-e definitiva. Código de serviço nacional é a **NBS**, substitui os códigos municipais.

**Belo Horizonte confirmado**: Portaria SMFA 042/2023 bloqueou o BHISS pro MEI desde 01/09/2023. Notas emitidas no nacional são espelhadas pra base da prefeitura via API, aparecem na DES municipal.

Penalidades municipais BH (Lei 5.641/1989, CTM): omissão de emissão R$100/documento (teto R$1.000/ação fiscal); ausência de exibição quando exigido 250 UFIR; preenchimento inexato R$303,29, fraudulento R$363,93.

Risco federal: cruzamento e-Financeira (movimentação bancária × NF emitida) pode gerar desenquadramento de ofício (LC123 art.29) se o volume bancário divergir muito do faturado; sonegação intencional é crime (Lei 8.137/90 art.1º V). **CRT 4** (Código de Regime Tributário) obrigatório no preenchimento — erro/omissão trava a nota.

DAS e DASN-SIMEI não mudam de mecânica com a NFS-e nacional — o sistema nacional só muda o CANAL de emissão, não o cálculo do imposto. O que muda de verdade é a capacidade da Receita de cruzar nota emitida × faturamento declarado, tornando a malha fina mais precisa.

## Links
- [[mei-obrigacoes-operacionais]] — doc fonte-verdade sintetizado a partir deste + pesquisa própria.
- [[estado-atual-obrigacoes-operacionais]]
