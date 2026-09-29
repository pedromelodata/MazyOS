---
tipo: verdade
status: vivo
data: 2026-07-15
assunto: numeros-fiscais
tags: [fiscal, simples-nacional, fator-r, cnae, bh, compliance, pesquisa]
---

# 🔬 Pesquisa fiscal — Simples · ME serviço · BH/MG (2026)

> Pesquisa aterrada em fontes OFICIAIS (deep-research + verificação adversarial, 3 votos/claim). Escopo travado: **Simples Nacional · Microempresa · atividade de SERVIÇO · Belo Horizonte/MG · 2026**. Regra anti-guru: cada achado tem fonte + confiança. **Double-check humano = Larissa (fiscal).** Companheira de [[blocos-fluxo-abertura]] · [[spec-telas-entrada-b1-b2]] · [[cnae-atendidos-e-nao-atendidos]] · [[plano-padrao-195-referencia]].
>
> 🧭 **COMO LER:** as seções abaixo são um **log append-only** de 3 rodadas (rodada 1 = A–G · rodada 2 = D núcleo + J/K/L/M · rodada 3 = H·I·D-resíduo). **Para usar no flow, vá direto ao [[#✅ CONSOLIDADO — fonte-verdade fiscal (usar no flow)|bloco CONSOLIDADO no fim]]** — ele funde as 3 rodadas + o cruzamento com 2 pesquisas Gemini, com cada fato marcado 🟢 travado / 🟡 fila-Larissa.
>
> ✅ **Bloco D (valores fiscais) — RESOLVIDO** na rodada 2 (núcleo) + rodada 3 (INSS pró-labore + alíquotas). O aviso antigo de "não coberto" na seção D abaixo ficou só como histórico.

## 🆕 Rodada 4 (2026-07-19) — verificação em fonte primária

> 8 pendências fechadas. Detalhe e crítica em [[2026-07-19-veredito-a3-e-pesquisa-fiscal-primaria]].

| Item | Antes | Agora | Fonte |
|---|---|---|---|
| **CPP recolhida no DAS entra no numerador do Fator R?** | 🟡 fila-Larissa (item B) | 🟢 **SIM** | SC COSIT 17/2021 (sijut2.receita.fazenda.gov.br) |
| **FS12 caixa × RBT12 competência** | 🟡 "verificar" | 🟢 confirmado | idem |
| **Fator R em empresa nova** | ausente | 🟢 1º mês ×12; depois média aritmética ×12 | Res. CGSN 140/2018 art. 26 |
| **Anexo III faixa 2** | não ratificado | 🟢 **11,20%**, deduzir **R$ 9.360** | LC 123 Anexo III |
| **Anexo V faixa 2** | ausente | 🟢 **18,00%**, deduzir **R$ 4.500** | LC 123 Anexo V |
| **Teto ME** | "menção não confirmada" | 🟢 **R$ 360.000/ano** (acima → EPP até R$4,8mi) | LC 123 art. 3º |
| **Prazo de opção pelo Simples** | ausente | 🟢 30 dias da última inscrição, **teto 60 dias** do CNPJ | Res. CGSN 140/2018 art. 6º |
| **Taxa JUCEMG (constituição LTDA)** | 🔴 divergência aberta desde 09/07 | 🟢 **R$ 268,51 (ME)** · EPP R$275,24 · demais R$280,61 · personalizado R$429,61 | [Tabela de Preços JUCEMG](https://jucemg.mg.gov.br/pagina/52/tabela-de-precos) + RP 02/2025 |

**⚠️ O R$288 morreu.** Era o número que a gente mais repetia (veio da Izabela) e o
menos verificado. Contrato **padrão** está congelado desde 2018; a revisão de
setembro subiu **só o personalizado**, como incentivo à automação.

**Impacto no produto:** com a CPP no numerador, o **pró-labore ótimo fica MENOR** e
mais alcançável → muda o número que o N18 recomenda.

### 🆕 Novos, ainda 🟡
- **Lei 15.270/2025** — fim da isenção total de lucros: **10% retidos acima de
  R$ 50 mil/mês** por PF. **Não atinge o nosso ICP** (teto R$30k/mês), mas vira
  guarda-corpo. ⚠️ artigos citados ("3º-A", "6º-A") **não verificados**.
- **Portaria SMFA 75/2025 (PBH)** — BHISS/DES-BH extinto, NFS-e só pelo Emissor
  Nacional com certificado digital. Se confirmar, **derruba** o passo "NFS-e via
  DES-BH" da Izabela e muda o custo de entrada. 🟡 fonte secundária.
- **TFLF** — pesquisa diz R$168,48, edital em abril, vence 10/05, sem pro-rata.
  **Conflita com o caso real do Pedro** (chegou ~dia 40, 4 dias pra pagar, ~R$161).
  Provavelmente são **dois eventos** distintos. Fato datado ganha.

### ⚠️ Não confie na nota de confiança do relatório de origem
Ele deu **100%** a linhas citando **blog de contabilidade** (tabelas dos anexos,
IRRF R$5k, lucros 10%, TFLF), quebrando a regra pedida. Os itens marcados 🟢 acima
são os que têm norma + URL oficial; o resto ficou 🟡 de propósito.

---

## Veredito de topo
Produto viável. A maior parte do enquadramento é **modelável deterministicamente**. Só **1 condicional é fatal** (sócio no exterior). A pesquisa **derruba 3 suposições** (ver §Refutados).

---

## A) Fator R / Anexo III × V — é determinístico por CNAE?
**Achado (🟢 alta):** NÃO é 100% determinístico por CNAE para atividade sujeita a Fator R. Regra: folha dos últimos 12 meses ≥ **28%** da receita bruta 12m → **Anexo III**; abaixo → **Anexo V**. Recalcula **a cada apuração** (janela móvel de 12 meses).
- Base: LC 123/2006 art. 18 §5º-J/K/M · Res. CGSN 140/2018 art. 25-26 · Manual PGDAS-D (limiar 0,28 verbatim). Estável desde LC 155/2016.
- **Pré-classificação PARCIAL possível:** o Manual separa em 3 grupos → (1) **não sujeitas ao Fator R = sempre Anexo III**; (2) **sujeitas ao Fator R = III ou V por cálculo**; (3) **Anexo IV permanente**. No app: filtra por CNAE os grupos "sempre III" e "Anexo IV"; só o grupo Fator-R o motor calcula em runtime.
- **Não existe CNAE de serviço "sempre Anexo V"** — V é só *resultado* do cálculo (<28%), nunca classificação fixa por atividade.
- Fontes: [planalto LC 123](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm) · [Res. CGSN 140/2018](https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=92278&visao=compilado) · [Manual PGDAS-D](https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/manual_pgdas-d_2018_v4.pdf)

## B) "Anexos diferentes" (segregação de receita)
**Achado (🟢 alta):** a lei obriga considerar **destacadamente** a receita por atividade — revenda→Anexo I, industrialização→II, serviço→III/IV/V. É esse mecanismo que faz um mesmo negócio ter receita em anexos distintos. LC 123/2006 art. 18 §4º + Res. CGSN 140/2018 art. 25 §1º.
- **Impacto no recorte:** só pesa em empresa **mista** (serviço + comércio). Serviço puro → sem essa mistura.
- **Dado da nossa matriz:** dos **460 CNAEs atendidos hoje, 200 são Anexo I (comércio) e 260 são serviço (III/IV/V\*)** (fonte: `cnae-matriz.csv`, contagem local). Ou seja, a lista atual **não é só serviço** — tem 43% comércio. Isso **contradiz o modelo operacional "só serviço" (13/07)** → decisão pendente: cortar comércio? Ver [[cnae-atendidos-e-nao-atendidos]].

## C) Contabilizei — plano de entrada
**Achado (🟢 alta):** o "~R$195" é o plano **Padrão** (Simples). Lucro Presumido começa em R$239. Faixa ideal **até R$25 mil/mês**. **NÃO é o mais barato: Básico = R$139.** Fonte: [contabilizei/quanto-custa](https://www.contabilizei.com.br/quanto-custa-contabilizei/) · [tabela-planos.pdf](https://www.contabilizei.com.br/assets/pdf/tabela-planos.pdf).
- Nosso "1 plano igual ao 195" = o Padrão, não o piso. Existe régua mais barata (139) se quisermos posicionar abaixo.

## D) Valores fiscais vigentes — ⚠️ NÃO COBERTO
Busca caiu no meio (erro de conexão). **Sem claim verificado** para: salário mínimo 2026, teto INSS, alíquota INSS pró-labore, faixa/tabela IRRF, alíquotas iniciais DAS Anexo III e V, sublimite estadual MG. **Re-rodar dedicado.** (Menção *en passant* não confirmada: sublimite MG ~R$3,6 mi; teto Simples 2026 R$4,8 mi / ME até R$360 mil/ano.)

## E) Passo a passo oficial — abrir ME serviço em BH
**Achado (🟢 alta):** processo digital **integrado, 7 etapas** via JUCEMG/Redesim: (1) Consultar Viabilidade → (2) DBE (Coletor Nacional/Receita) → (3) Módulo Integrador → (4) pagar DAE → (5) Registro Digital (assinatura) → (6) enviar → (7) obter documento registrado.
- **Entrega de uma vez:** registro na Junta + **CNPJ + inscrição municipal + Alvará de Localização** (e Inscrição Estadual se a atividade exigir).
- **Prazo: até 1 dia útil** para serviço de **baixo risco** (BH: 95% dos alvarás = "ALF Imediato", sem vistoria; tempo médio caiu p/ 8h em fev/2025).
- **Certificado digital ICP-Brasil** = pré-requisito das assinaturas (etapa 5).
- **Médio/alto risco** ("ALF Mediante Requerimento", ~5%) ou licenciamento sanitário/ambiental/bombeiros → 15-45 dias (fora do happy path).
- Fontes: [JUCEMG](https://jucemg.mg.gov.br/servicos/14/ABRIR+UMA+EMPRESA) · [Portal MG](https://www.mg.gov.br/servico/solicitar-abertura-de-uma-empresa) · [PBH Alvará](https://prefeitura.pbh.gov.br/empreendedor/abrir-minha-empresa/alvara-localizacao-funcionamento)

## F) Condicionais societárias — quais mordem no recorte?
**Achado (🟢 alta):**
- **Sócio residente/domiciliado no exterior = ÚNICO fatal.** LC 123/2006 art. 17, II impede a opção pelo Simples (a empresa até existe como ME/EPP, mas cai em Lucro Presumido/Real — fora do produto). LC 214/2025 reforçou. → **bloquear + rota humana.**
- **Regime de bens do casamento:** só bloqueia se **ambos os cônjuges na MESMA sociedade**, casados em comunhão universal OU separação obrigatória (art. 977 CC + DREI Ofício 300/2023 + STJ AgInt REsp 1.721.600). Um cônjuge sozinho com terceiro = livre. **Peso prático baixo.**
- **Sócio-CLT, SLU × LTDA, integralização com imóvel** → NÃO desenquadram do Simples.
- Fonte: [DREI Ofício 300/2023](https://www.gov.br/empresas-e-negocios/pt-br/drei/legislacao/oficios-circulares/arquivos/oficio-circular-sei-no-300-2023-mdic.pdf) · LC 123 art. 17.

## G) Obrigações e documentos mensais (ME serviço Simples, sem empregado)
**Achado (🟢 alta):**
- **PGDAS-D (declaração) + DAS (guia) mensais**, até **dia 20** do mês seguinte (prorroga p/ dia útil posterior se dia 20 sem expediente). Res. CGSN 140 art. 40 + LC 123 art. 21.
- **NFS-e de BH migrou para o Emissor Nacional:** ME/EPP do Simples que recolhe ISS via DAS desde **01/11/2025**, rollout total **01/01/2026** (Portaria SMFA 75/2025). O BHISS Digital segue pra DES/AIDF/guias; a **emissão de NFS-e** vai pro Emissor Nacional.
- **Divisão de tarefa:** **NFS-e = usuário emite sozinho** (portal Emissor Nacional). **DAS/PGDAS-D = contador/motor** (exige Fator R + segregação de receita). ⚠️ DAS é federal → **automatizável via API oficial** (Serpro Integra Contador / Integra-SN gera PGDAS-D + DAS); confirmar credencial/procuração eletrônica.
- Fontes: [Manual PGDAS-D](https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/manual_pgdas-d_2018_v4.pdf) · [PBH adesão NFS-e Nacional](https://prefeitura.pbh.gov.br/noticias/belo-horizonte-adere-ao-emissor-nacional-de-nota-fiscal-de-servico-eletronica) · [BHISS](https://prefeitura.pbh.gov.br/fazenda/bhiss)

---

## ❌ Refutados (0-3) — NÃO entram no produto
1. Que o **§5º-D listaria atividades "sempre Anexo III"** (software, laboratório, academia…). Não hardcodar sem mapear §5º-B/C artigo por artigo.
2. Que a **NFS-e "substituiu a DES"** em BH. DES e NFS-e **coexistem** no BHISS.
3. Que os **preços da Contabilizei são exclusivos do Simples**. A mesma grade existe pro Lucro Presumido (R$239). Simples e Lucro Presumido são **regimes distintos**; a Contabilizei (empresa) atende os dois.

## ⚠️ Caveats
- **Sensibilidade temporal:** cronograma NFS-e Emissor Nacional BH atinge rollout total 01/01/2026 (hoje 15/07/2026, já vigente — confirmar sem prorrogação). Res. CGSN sofre emendas frequentes (183/2025, 189/2026); limiar Fator R (28%) e estrutura de anexos permanecem, mas revalidar composição exata da folha.
- **Fontes fracas pontuais:** bloco F citou JUCESC (SC, não MG) como fonte primária de "sócio exterior" — texto legal robusto, mas confirmar direto no planalto. Fetch do planalto falhou (ECONNRESET) em vários momentos; LC 123 confirmada por espelhos oficiais.

## 🔴 Pendências para double-check (Larissa)
1. **Bloco D inteiro** (valores fiscais 2026) — furou, re-rodar.
2. **Lista exata de CNAEs** "sempre III" × "Fator-R" × "Anexo IV" — mapear §5º-B/§5º-C contra `cnae-matriz.csv` (hipótese fácil do §5º-D foi refutada). **Tarefa de cruzamento de dados, factível internamente.**
3. **Fator R para empresa com <12 meses** (janela móvel incompleta) — regra de proporcionalização da Res. CGSN 140 não detalhada. **Relevante: toda empresa nova (nossa cobaia inclusa) começa assim.**
4. **DEFIS anual + eSocial sem movimento** para ME sem empregado — periodicidade e quem transmite não plenamente verificados.

## 💡 Implicações para o motor / spec
- Anexo vira **3 grupos filtráveis** (não `*` aberto) → simplifica B2·2.8 e a matriz CNAE.
- "Anexos diferentes" **encolhe** se cortarmos comércio (decisão pendente: 200 comércio × 260 serviço).
- **Regime de bens despriorizado** (peso baixo).
- **Sócio no exterior = único 🔴 fatal** → guarda-corpo confirmado.
- **B4 (constituição)** ganha o passo-a-passo oficial de BH pronto pra virar schema (happy path baixo risco).

---

# 🔬 Rodada 2 (blocos D re-rodado + H·I·J·K·L·M) — 2026-07-15

## D) Valores fiscais 2026 — núcleo CONFIRMADO (🟢 alta)
| Item | Valor 2026 | Fonte |
|---|---|---|
| Salário mínimo (= piso INSS) | **R$ 1.621,00** | Decreto 12.797/2025 · [INSS gov.br](https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal) |
| Teto INSS | **R$ 8.475,55** (reajuste INPC 3,9%) | [INSS gov.br](https://www.gov.br/inss/pt-br/assuntos/com-reajuste-de-3-9-teto-do-inss-chega-a-r-8-475-55-em-2026) |
| Tabela IRRF | 7,5% (R$2.428,81–2.826,65) · 15% (até 3.751,05) · 22,5% (até 4.664,68) · 27,5% (acima). **Redutor Lei 15.270/2025 isenta na prática até ~R$5.000/mês** | [Receita/tabelas 2026](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026) |
| Sublimite Simples MG | **R$ 3.600.000** (todos os estados; NÃO há reduzido pra MG). Limite geral Simples R$4,8M; ME até R$360 mil/ano | Portaria CGSN 54/2025 · [Portal Simples](https://www8.receita.fazenda.gov.br/simplesnacional/noticias/NoticiaCompleta.aspx?id=94c10cc2-7eb5-4ef0-bfb2-5479e72caff8) |

## K) Automação de DAS — VIÁVEL e mapeada (🟢 alta)
- **API oficial Serpro Integra Contador → "Integra PGDAS-D"**: serviços reais **`TRANSDECLARACAO11`** (entregar PGDAS-D) e **`GERARDAS12`** (gerar DAS) + consultar declaração/extrato. Em produção desde 2022. Requer **certificado + credenciamento Serpro**. [Doc Serpro](https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/pt/sistemas/pgdasd/)
- **Procuração eletrônica e-CAC**: delegação granular de serviços ao escritório (opção "todos" cobre futuros); em 2025 o procurador precisa aceitar em "Minhas Autorizações de Acesso". [Serviço gov.br](https://www.gov.br/pt-br/servicos/cadastrar-ou-cancelar-procuracao-para-acesso-ao-e-cac)
- **Concretiza o passo "ativação fiscal" (B4.5):** certificado → procuração e-CAC → integração Serpro que emite DAS/PGDAS-D sozinho. DEFIS anual sai do mesmo módulo.

## J) Risco + Alvará BH — happy path sólido (🟢 alta)
- Classificação: **dispensada / baixo / alto** risco (Decreto municipal 17.245/19 + Lei Liberdade Econômica).
- **Baixo risco (ex: escritório) = ALF IMEDIATO**: 100% eletrônico, sem vistoria, validade 5 anos, ~**96% dos alvarás**. Alto risco/poluente → requerimento. [PBH](https://prefeitura.pbh.gov.br/noticias/prefeitura-de-bh-simplifica-obtencao-de-alvara-de-localizacao-e-funcionamento)
- Caveat: vertical **sanitária (GVISA)** tem "médio risco" à parte (serviço puro normalmente não cai nela).

## M) Viabilidade de nome (JUCEMG) — sem API aberta (🟢 alta)
- Consulta **gratuita, web, login CPF+senha, até 2 dias úteis**; verifica nome + endereço + CNAE + natureza de forma integrada. Precisa **2 opções de nome**, sem "ME/EPP" na consulta. Validade do resultado 6 meses.
- **NÃO é API aberta** → não dá pra checar nome programaticamente por esse canal (é portal autenticado). Impacta o design da **tela 2.7**: ou manda pro portal, ou usa a etapa de Viabilidade do próprio processo de registro (etapa 1 do bloco E).
- Nome: princípios **veracidade + novidade** (CC art.34 · IN DREI/MEMP 1/2025); proteção por UF; reprova idêntico/semelhante na mesma UF. [JUCEMG](https://jucemg.mg.gov.br/servicos/16/CONSULTAR+VIABILIDADE)

## L) Custos de abertura — parcial (🟡 média)
- Tabela de preços JUCEMG **2026 vigente** (atualizada 05/01/2026, RP 02/2025). ME contrato padrão ~**R$268,51** (corroborante, não claim isolada). [JUCEMG tabela](https://www.jucemg.mg.gov.br/tabela_de_precos.html)
- ⚠️ Valores exatos das **taxas municipais BH** + **faixa e-CNPJ** NÃO confirmados.

## ❌ Refutados rodada 2 (não usar)
1. **INSS pró-labore "11% + 20%"** (0-3) — formulação errada; **re-pesquisar a alíquota correta**.
2. **IRRF "isento até R$2.428,80"** (1-2) — em 2026 o **redutor da Lei 15.270/2025** isenta na prática até **~R$5.000/mês**. (Boa notícia: pró-labore mínimo não paga IRRF.)
3. **Alvará BH "mediante requerimento" como padrão** (0-3) — o padrão de baixo risco é **imediato/automático**.

## 🔴 LACUNAS que sobraram (double-check Larissa / 3ª rodada)
- **Bloco H (Fator R 1º ano) — ZERO claims.** Como a Res. CGSN 140/2018 trata empresa recém-aberta sem 12m de folha (proporcionalização)? Composição exata da folha (pró-labore + CPP + FGTS + 13º). **Crítico: toda empresa nova nossa começa assim.**
- **Bloco I (migração de contador) — ZERO claims.** Passo a passo, procuração, DAS/obrigações em aberto, prazos. **Crítico pro flow MIGRAR.**
- **D residual:** alíquota correta de INSS sobre pró-labore + alíquotas iniciais DAS Anexo III (6%?) e V (15,5%?).

---

# 🔬 Rodada 3 (H · I · D-resíduo) + cruzamento Gemini — 2026-07-15

> deep-research 3ª rodada (103 agentes, 22 claims confirmados / 3 refutados, verificação adversarial 3 votos) **cruzada** contra 2 relatórios Gemini das mesmas perguntas (doc "Contabilidade Simples Nacional BH" = blocos A–G · doc "Pesquisa Tributária BH" = H·I·J·K·L·M). Objetivo: fechar H·I·D-resíduo e resolver a refutação histórica do D.

## H) Fator R no 1º ano + migração — núcleo FECHADO (🟢 alta)
| Fato | Regra | Fonte | Confiança |
|---|---|---|---|
| Fórmula | **FS12 ÷ RBT12r** = folha 12 meses anteriores ÷ receita bruta 12 meses anteriores (interno+export); **não inclui o mês corrente** | CGSN 140/18 art. 26 · LC 123 art. 18 §24 | 🟢 |
| Limiar | **≥28% → Anexo III** (começa 6%) · **<28% → Anexo V** (começa 15,5%) | LC 123 §5º-J / §5º-M | 🟢 |
| Recém-aberta (<13 meses) | **ANUALIZAÇÃO**: mesmos critérios do art. 22 (receita em início de atividade), "no que couber" | CGSN 140/18 art. 26 §4º | 🟢 |
| Mês de início | FS>0 e receita=0 → r=**0,28** · FS=0 e receita>0 → r=**0,01** · ambos>0 → **FS÷receita** | CGSN 140/18 art. 26 §6º I-III | 🟢 |
| Migração (12+ meses) | usa **histórico REAL** dos 12 meses, sem proporcionalizar; troca de contador não zera nada (CNPJ continua) | CGSN 140/18 art. 26 | 🟢 |
| Composição folha (numerador) | ENTRAM: salários + pró-labore + 13º + **CPP e FGTS efetivamente recolhidos**. FORA: aluguéis, distribuição de lucros, estagiário, MEI, INSS retido do segurado | LC 123 art. 18 §24 · CGSN 140/18 art. 26 §§1º-2º | 🟢 |

**Cruzamento Gemini (H):** converge em tudo acima. Gemini traz tabela de composição idêntica (inclui INSS-retido-do-segurado como **excluído**, que a nossa também implica).

## I) Migração de contador — Gemini TAPA nosso buraco (🟢 alta, 2 citações a verificar)
Nossa 3ª rodada voltou rasa (só a procuração e-CAC). O Gemini entregou o operacional:
| Peça do processo | O que é | Fonte (Gemini) |
|---|---|---|
| **Distrato** | rescisão do contrato antigo; **define a data de corte** (competência final do contador anterior) | CFC (norma de transferência) |
| **TTRT Eletrônico CRC-MG** | Termo de Transferência de Responsabilidade Técnica; novo contador abre no portal CRC-MG, o antigo valida | CRC-MG |
| **DBE Evento 232** "Alteração do Contabilista" | via Coletor Redesim; **atualiza RFB + Sefaz-MG + PBH de uma vez**; assinado com e-CNPJ da empresa | Redesim / RFB |
| **Procuração e-CAC** | revoga a antiga + emite nova ao novo escritório; gov.br Prata/Ouro ou e-CNPJ; validade 5 anos; "restringir processos digitais? → **NÃO**" | gov.br/RFB |
| **Obrigações do período anterior** | PGDAS-D/DEFIS/eSocial de fatos geradores no período do contador antigo **ficam com ele**, salvo cláusula expressa no distrato | CFC |
| **Acervo** (XML, guias, senhas, bases) | **pertence à empresa**; reter por inadimplência = anti-ético (processo no CRC) | CFC / Cód. Ética |

⚠️ **Verificar antes de codar:** (a) o **nº da resolução CFC** — Gemini escreve "1.590/2020" mas a própria lista de refs dele cita CFC 987/2003 e 1493/2015 → pode ser citação trocada; (b) o **código "Evento 232"** contra o Coletor Redesim oficial. → fila-Larissa/fonte primária.

🔴 **GAP achado 06/08 (Pedro, revisando `/apresentacao`):** nem esta pesquisa nem o Gemini cobrem o **certificado digital** — TTRT move responsabilidade TÉCNICA, não o certificado (são artefatos diferentes), e a automação (item K, Serpro Integra Contador) exige certificado credenciado com a gente independente do TTRT estar resolvido. Não sabemos se o certificado costuma ser retido pelo contador antigo (mesmo bucket ético do "Acervo" acima) ou fica sempre com a empresa/legal-rep. Aplicado como hipótese-de-produto sem essa confirmação: `MigrarDiagnosticoView` agora pergunta "tem certificado?" pros 2 regimes (antes só MEI) e reaproveita/emite conforme a resposta. 🟡 fila-Larissa: como o antigo contador costuma tratar o certificado na prática.

## D-resíduo) INSS pró-labore + alíquotas — refutação do D RESOLVIDA (🟢 alta)
| Fato | Regra | Fonte | Confiança |
|---|---|---|---|
| INSS pró-labore | **11% DIRETO** sobre a retirada (NÃO 11%×20%); sócio = contribuinte individual; empresa retém+recolhe | Lei 8.212/91 art. 21 + Lei 10.666/03 art. 4º | 🟢 |
| Teto / piso | base entre **R$1.621** (mín) e **R$8.475,55** (teto 2026) → **máx R$932,31/mês** | gov.br/INSS 2026 | 🟢 |
| CPP patronal 20% | **DENTRO do DAS** nos Anexos I/II/III/**V**; recolhida à parte **só no Anexo IV**. **MVP (III/V) = SEM 20% separado** | LC 123 art. 13 VI · gov.br/RFB (Anexo IV) | 🟢 |
| Anexo III inicial | **6,00%** (1ª faixa até R$180k/12m) | LC 123 Anexo III (Planalto) | 🟢 |
| Anexo V inicial | **15,50%** (1ª faixa até R$180k/12m) | LC 123 Anexo V (Planalto) | 🟢 |

**Cruzamento Gemini (D):** **convergência 100%.** A refutação histórica (formulação "11%+20%" da rodada 2) está **resolvida** — as duas pesquisas cravam **11% direto** + CPP embutida no DAS. Fim da controvérsia do D.

## 🆕 Achado NOVO do Gemini (nenhuma rodada nossa pegou) — incorporar + verificar
- **FS12 = regime de CAIXA · RBT12 = regime de competência** (Solução de Consulta COSIT 17/2021). Atrasar o pagamento do pró-labore **tira o valor do numerador no mês** → derruba o Fator R < 28% → joga pro Anexo V de repente. **Impacto direto no simulador do B2 + alerta ao usuário.** → 🟡 verificar COSIT 17/2021.

## ❌ Refutados rodada 3 (não usar)
1. **Folha do Fator R sem 13º / definição frouxa do §24** (1-2, fonte comprasnet) — a definição boa é a do Planalto/CGSN (13º ENTRA).
2. **"Média aritmética acumulada × 12" para os meses 2–12** (1-2) — ver nota de tensão no consolidado (provável convergência matemática, mas frase/fonte não fecharam).

## 🟡 Tensões Gemini × nós (as 2 que vão pra Larissa)
1. **Mecânica exata dos meses 2–12 (recém-aberta):** nós refutamos "média×12" (1-2); Gemini crava 100%. **Não é contradição dura:** média×12 no numerador ÷ média×12 no denominador → o ×12 **cancela** → mesma razão que soma-acumulada/soma-acumulada. Dão o mesmo número. Larissa confirma o texto do art. 26 §§5º-6º.
2. **CPP embutida no DAS entra no numerador?** Gemini diz que sim ("compõe a memória de cálculo" mesmo nos Anexos III/V). Leitura estrita do §24 (nossa) = só "**CPP efetivamente recolhida**"; numa ME sem funcionário a CPP não é recolhida à parte → **numerador ≈ só o pró-labore**. Muda o simulador do B2. Larissa decide.

---

# ✅ CONSOLIDADO — fonte-verdade fiscal (usar no flow)

> Isto é o que alimenta o motor de testes e o flow entrada→B4. Cada linha 🟢 = travado (pode codar) · 🟡 = fila-Larissa (não hardcodar sem ela). Verificado nas 3 rodadas + cruzado com 2 pesquisas Gemini. Sem contradição dura entre as fontes; onde divergem é completude ou redação, não fato oposto.

### 🟢 TRAVADO — pode entrar no produto
| # | Fato | Valor / regra | Onde no flow |
|---|---|---|---|
| 1 | Enquadramento por CNAE | 3 grupos: **sempre Anexo III** · **sujeito a Fator R (III↔V)** · **Anexo IV**. Não existe serviço "sempre V" | B1 roteamento · B2 |
| 2 | Fator R fórmula | folha 12m ÷ receita bruta 12m; **≥28% → III (6%)** · **<28% → V (15,5%)** | B2 simulador |
| 3 | Fator R recém-aberta | **anualização** (art. 22 no que couber); **mês 1** = folha do mês ÷ receita do mês (casos-borda 0,28 / 0,01) | B2 · B4.5 (1º DAS) |
| 4 | Fator R migração | histórico REAL 12 meses | flow #2 MIGRAR |
| 5 | Composição folha | pró-labore + salários + 13º + CPP/FGTS **recolhidos**; fora lucro/aluguel/MEI/estagiário/INSS-retido | B2 simulador |
| 6 | INSS pró-labore | **11% direto**; base R$1.621–8.475,55; **máx R$932,31/mês** | B2 · pró-labore |
| 7 | CPP 20% | dentro do DAS (III/V) → **sem guia separada** no MVP | B2 · custo mensal |
| 8 | Alíquotas iniciais DAS | **Anexo III 6,00%** · **Anexo V 15,50%** (até R$180k/12m) | B2 simulador |
| 9 | Valores 2026 | mín **R$1.621** · teto INSS **R$8.475,55** · IRRF isento na prática até **~R$5.000/mês** (Lei 15.270/2025) · sublimite MG **R$3,6M** · ME até R$360k/ano | B2 · avisos |
| 10 | Abertura BH | Redesim/Minas Fácil, baixo risco = **ALF imediato ~1 dia**, sem vistoria (~96%); JUCEMG LTDA padrão **R$268,51** / EI R$134,26 | B4 constituição |
| 11 | Obrigações mensais | **PGDAS-D + DAS até dia 20**; NFS-e = usuário emite (Emissor Nacional); DAS = motor (API Serpro `TRANSDECLARACAO11`+`GERARDAS12`) | B4.5 ativação · portal |
| 12 | DEFIS | anual, até 31/03 do ano seguinte | portal |
| 13 | Sócio no exterior | **único 🔴 fatal** → bloqueia opção Simples (LC 123 art. 17 II) | B1 guarda-corpo |
| 14 | Migração — passo oficial | Distrato → TTRT CRC-MG → **DBE Evento 232** (atualiza RFB+Sefaz+PBH) → procuração e-CAC nova; obrigações do período antigo ficam com o contador anterior | flow #2 MIGRAR |
| 15 | Procuração e-CAC | delegação de serviços (opção "todos" cobre futuros); procurador aceita em "Minhas Autorizações"; "restringir processos digitais? → NÃO" | B4.5 · ativação |

### 🟡 FILA-LARISSA — não hardcodar sem confirmação
| # | Ponto | Por quê |
|---|---|---|
| A | **Mecânica exata Fator R meses 2–12** | nós refutamos "média×12" (1-2); Gemini crava 100%. Provável convergência matemática (×12 cancela), mas confirmar art. 26 §§5º-6º |
| B | **CPP-no-DAS entra no numerador do Fator R?** | Gemini sim / leitura estrita §24 não. Muda o simulador do B2 (numerador = só pró-labore vs pró-labore+CPP) |
| C | **FS12 regime de caixa** (COSIT 17/2021) | achado novo; se confirmado, atrasar pró-labore derruba o Fator R no mês → alerta no B2 |
| D | **Nº resolução CFC** da transferência (1.590/2020?) + **código Evento 232** | possível citação trocada do Gemini; verificar em fonte primária antes de escrever no flow MIGRAR |
| E | **Lista exata CNAE** "sempre III" × "Fator-R" × "IV" | mapear §5º-B/§5º-C contra `cnae-matriz.csv` (tarefa interna, factível) |
| F | **DEFIS + eSocial sem movimento** p/ ME sem empregado | periodicidade e quem transmite não plenamente verificados |
| G | **Taxas municipais BH exatas** + faixa e-CNPJ | valores de custo de abertura só parciais |

### Implicações diretas no flow (entrada→B4)
- **B2 (enquadramento/IACA):** simulador Fator R usa fatos #2–#8; **depende de A+B+C** pra ficar exato → marcar como "estimativa" até Larissa.
- **B4 (constituição):** happy path de BH (#10) pronto pra virar schema.
- **B4.5 (ativação fiscal):** #11+#15 → certificado → procuração e-CAC → API Serpro emite DAS sozinho.
- **Flow #2 (MIGRAR):** #14 é o esqueleto; **depende de D** (citações CFC/Evento 232).

## Links
