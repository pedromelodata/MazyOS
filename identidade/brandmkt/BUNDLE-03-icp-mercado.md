

<!-- ============================================================ -->
# ARQUIVO: 03-icp-mercado/mercado-bh-regional.md
<!-- ============================================================ -->

---
tipo: derivado
status: vivo
data: 2026-07-09
assunto: mercado-bh
deriva_de: [PESQUISA-MERCADO]
tags: [pesquisa, bh, sizing]
---

# 📍 Mercado regional — Belo Horizonte (sizing do piloto)

> De ~16 mi de empresas no nosso perfil no Brasil, quantas em BH? Dado regional pra defender o piloto. **Anti-guru: valor + fonte + confiança; estimativas com faixa, não número seco.**

## Números de base (empresas ativas em BH)
| Dado | Valor | Fonte | Conf. |
|---|---|---|---|
| **Ativas em BH (oficial)** | **388.073** = 18% de MG | REDESIM / Prefeitura BH, jan/2023 | Alta (datado 2023) |
| Ativas em BH (bases comerciais) | **~460 mil – 545 mil** | Econodata / EmpresAqui / cnpj.biz, 2026 | Média (metodologias variam) |
| BH % do Brasil | ~2,56% do total nacional | base comercial 2026 | Média |
| **MEI em BH** | **~260 mil** | Prefeitura BH / SEBRAE | Média |
| **% microempresas** (sentido amplo) | ~86% | Prefeitura BH | Média |
| Tempo de abertura em BH | **11 h** (vs 22 h Brasil, 14 h SP) | REDESIM/Prefeitura BH | Alta |
| Atividades top BH | salão/beleza, varejo vestuário (**comércio, fora do V1**), apoio administrativo, treinamento | Prefeitura BH | Alta |

## Recorte pro NOSSO perfil (estimativa)
> ⚠️ Precisão fina = puxar da base aberta da Receita (CNPJ) filtrando município=BH + CNAE do nosso perfil + Simples. Abaixo = estimativa defensável por faixa.

- **BH é capital = pesado em serviço/comércio, quase sem indústria/agro** → o % endereçável tende ao TOPO da faixa nacional (60–75%), ou acima. Das atividades-top de BH, **3 das 4 são nosso perfil** (beleza, apoio administrativo, treinamento). A 4ª, **varejo de vestuário, é comércio e está FORA do V1** — ver ressalva abaixo.
- **Perfil amplo (serviço+comércio leve, inclui MEI):** ~450 mil × ~70% ≈ **~300–400 mil empresas.** ⚠️ Este degrau **inclui comércio** e por isso **não é nosso mercado**; fica aqui só como passo da conta.
- **⚠️ Nosso ICP é ME, NÃO MEI** (o líder ignora MEI; ver [[cnae-cobertura]]). Tirando os ~260 mil MEI → não-MEI ≈ 150–265 mil. Recorte serviço Simples ≈ **~100–175 mil empresas ICP em BH.** Conf. baixa-média (estimativa).

> ⚠️ **A faixa 100–175 mil desceu por um degrau que continha comércio** (o de ~70%), então o **teto dela é otimista**. Com comércio inteiro fora do V1 ([[cnae-comercio-standby]]), o número honesto mora **na metade de baixo da faixa**. Não recalculei pra um número novo de propósito: sairia estimativa em cima de estimativa, e a régua anti-guru manda **usar o piso ~100 mil** até a pendência abaixo virar dado. **O argumento não depende disso:** mesmo a 100 mil, 0,1% = 100 clientes, múltiplo da meta de 25–30 fundadores.
- **Fluxo:** BH é a **3ª capital em aberturas** do país + abertura mais rápida (11h) → funil de novos clientes constante.

## 🔑 Leitura estratégica
1. **Regionalizar NÃO encolhe a oportunidade — sobra mercado.** Meta do MVP = 25–30 clientes fundadores em 3 meses, depois escalar. BH sozinha tem **~100–175 mil empresas no ICP** + fluxo contínuo de aberturas. O funil não seca nem regionalizado.
2. **BH valida a escolha por 2 lados:** tamanho (centenas de milhares no perfil) E facilidade (abertura em 11h/dia-pro-outro — casa com o que a Izabela disse, [[2026-07-09-conversa-izabela]]). Não é só "começar pequeno", é "começar no lugar mais fácil E grande o suficiente".
3. **0,1% do ICP de BH ≈ 100–175 clientes** — já múltiplo da meta de fundadores.

## Pendência
- [ ] Puxar dado preciso da **base aberta da Receita (CNPJ)** ou **JUCEMG**: município BH + CNAE do perfil + Simples + porte ME. Vira número cravado (hoje é estimativa). Candidato a tarefa técnica (Pedro Dev já lida com dados CNPJ).
  - **Subiu de prioridade (17/08):** com comércio fora do V1, a faixa atual carrega comércio no meio da conta. O filtro do puxão deve ser **só os CNAEs de serviço** (Anexos III/IV/V), cruzável com [[cnae-liso-servico]] — é o que troca a faixa estimada por um número.

## Links
- [[PESQUISA-MERCADO]] · [[cnae-cobertura]] · [[cnae-matriz-governo]] · [[2026-07-09-conversa-izabela]] · [[HOME]]


<!-- ============================================================ -->
# ARQUIVO: 03-icp-mercado/perfil-microempreendedor-mercado.md
<!-- ============================================================ -->

---
tipo: derivado
status: vivo
data: 2026-08-05
assunto: perfil-microempreendedor
origem: Gemini (Google Search grounding), pesquisa encomendada 2026-08-05
tags: [pesquisa, mercado, personas, demografia]
---

# 📊 Perfil do microempreendedor de serviço — Brasil e BH/MG

> Pesquisa externa rodada no Gemini (Google Search), colada em `c:\Users\pedro\Downloads\Pesquisa Perfil Microempreendedor Belo Horizonte.md` e arquivada aqui na íntegra. Fonte + data + confiança em cada dado, conforme regra anti-guru do vault. Usada pra fechar [[metodologia-personas]] (slot 9) e corrigir [[economia-preco-cac]] (benchmark de CAC real).

## 1. Demografia

| Dado | Valor | Fonte | Data | Conf. |
|---|---|---|---|---|
| Total MEIs ativos (Brasil) | 14,6 milhões | IBGE | 2022/2023 | Alta |
| Faixa etária predominante | 30-39 anos (29,9%) | IBGE | 2022/2023 | Alta |
| Idade média | **40,8 anos** (mulheres 41,1 · homens 40,6) | IBGE | 2022/2023 | Alta |
| Gênero (nacional) | 53,6% homens / 46,4% mulheres | IBGE | 2022/2023 | Alta |
| Ensino superior completo (pequenos negócios) | 24% (subiu de 15% em <10 anos) | Sebrae | Set/2025 | Média-alta |
| Renda familiar média MEI | R$5.542/mês | Sebrae, Atlas Pequenos Negócios | 2024/2025 | Média |
| Diferença de receita por gênero | mulheres faturam 19% menos (controlado por CNAE) | Banco Central | Fev/2025 | Alta |
| MEIs em BH | 227.733 (42% do parque empresarial local) | Sebrae/Observatório + RFB | até 2025 | Alta |
| MEs em BH | 205.341 (37,9% do parque local) | Sebrae/Observatório + RFB | até 2025 | Alta |
| Setor dominante em BH | Serviços (55%+ dos atendidos Sebrae) | Sebrae/Observatório | até 2025 | Alta |

**Leitura crítica:** idade média 40,8 anos — **não é público jovem/hustle**. Decisão de abrir empresa vem depois de 10+ anos de mercado formal. Comunicação deve ancorar em pragmatismo/segurança, não disrupção. BH tem proporção quase 1:1 MEI:ME — sinal de ecossistema maduro que gradua organicamente (motor de demanda pra transição MEI→ME, nosso momento de maior valor já mapeado em [[PESQUISA-MERCADO]] §D).

## 2. Comportamento digital

| Dado | Valor | Fonte | Data | Conf. |
|---|---|---|---|---|
| Usa smartphone na gestão diária | 99,1% | Sebrae/PR | 2024/2025 | Alta |
| Presença no Instagram | 64% geral · **83% no setor beleza** · 79% criativos · 72% educação/estética | Sebrae (ASN) | Dez/2023 | Alta |
| Presença no Facebook | 41% | Sebrae | Dez/2023 | Alta |
| Presença no LinkedIn / TikTok | 6% / 3% | Sebrae | Dez/2023 | Alta |
| WhatsApp como canal de vendas | 72-74% | Sebrae | 2023-2025 | Alta |
| WhatsApp Business (adoção) | 59% mulheres / 56% homens | Sebrae/PR | 2024/2025 | Alta |
| PIX (aceitação) | 84% | ABDI/Sebrae | 2024 | Alta |
| Uso de IA generativa (ChatGPT etc.) | 48-49% | Sebrae/ABDI | 2024/2025 | Média (autodeclarado) |
| Pesquisa preço/fornecedor online com frequência | 38,5% | Sebrae/PR | 2024/2025 | Alta |

**Leitura crítica:** WhatsApp não é canal de suporte secundário — é infraestrutura central de venda desse público (72-74%, acima de site próprio 17%). Produto precisa integrar WhatsApp de verdade (envio de guia, suporte), não só ter um botão de contato. Instagram domina descoberta visual, sobretudo em nicho estética/beleza (83%) — reforça a leitura já feita em `_sintese-paginas-publicas.md` sobre peso do Instagram no setor.

## 3. Dores e motivação de compra

- **Gatilho de desenquadramento MEI:** até 20% acima do teto (R$97.200/ano) = conversão automática em janeiro seguinte + guia adicional. Acima de 20% = desenquadramento **retroativo a janeiro**, recálculo com juros e multa — crise de compliance que empurra pra contratação de emergência. (Sebrae, alta confiança)
- **Penalidade DASN-SIMEI atrasada:** 2%/mês sobre faturamento total, teto 20%. (Sebrae, alta)
- **Paradoxo preço × humano:** mercado aceita pagar prêmio substancial por atendimento humano dedicado — Contabilizei cobra ~R$280 (self-service) vs ~R$515 (analista dedicado via WhatsApp), quase 2× o preço só pela camada humana. **Confirma direto nossa aposta de "humano no plano de entrada" — o mercado já paga por isso, só que hoje só no tier caro.** (fonte Contabilizei, média confiança)
- **Objeção central:** desumanização/impessoalidade em assunto fiscal — "posso confiar num robô com meu imposto?"
- **Troca de contador:** tecnicamente simples (só exige balanços + folha dos últimos 12 meses), mas percebida como "perturbação catastrófica" — atrito é psicológico, não técnico.
- **Tempo de abertura institucional:** 18-24h (BR); gargalo real é o "tempo de consideração" cognitivo do empreendedor antes de agir, não a burocracia em si.

## 4. Canais de aquisição e CAC — ⚠️ ACHADO CRÍTICO

| Métrica | Valor | Fonte | Data | Conf. |
|---|---:|---|---|---|
| CPL SaaS B2B Brasil (mediana) | **R$80–400** | Vectaris Marketing | 2025 | Média |
| CPL Google Search alta intenção (BR) | R$15–50 | Growth System | 2025 | Média |
| Taxa de conversão lead→cliente | 2,5% (software) / 3,1% (consultoria) | EBRG | 2025 | Alta |
| Impacto do WhatsApp na conversão | +24% (2,52%→3,12%) | EBRG | 2025 | Alta |
| CAC SMB (proxy internacional) | US$299–1.461 (~R$1.500-7.300) | Incuca/RevOps | 2024/2025 | Alta p/ EUA, média p/ BR |
| LTV:CAC saudável | ≥3:1 | consenso RevOps | 2024-2026 | Alta |
| CAC payback saudável | &lt;12 meses (mediana setor ~16m) | Incuca/Benchmarkit | 2024-2026 | Alta |

### 🔴 Choque com nosso CAC-alvo calculado

[[economia-preco-cac]] calculou CAC-alvo **R$40,92 (ME)** e **R$11,52 (MEI)** com a regra dos 3 sobre a margem de **1 mês**. Esse número está **abaixo até do CPL de 1 lead** (R$80-400 mediana BR) — ou seja, pelo cálculo mensal puro, **nem daria pra pagar por 1 lead**, muito menos por 1 cliente convertido. Ver correção aplicada em [[economia-preco-cac]] §9.

## 5. Lacunas (o que a pesquisa não achou)

- Volume de busca absoluto de termos como "abrir empresa"/"contador online" (precisa de Keyword Planner/Ahrefs, fora do escopo de busca aberta)
- Tempo psicológico entre "decidi abrir empresa" e "abri de fato" (não documentado)
- CAC proprietário de concorrentes diretos (Contabilizei etc.) — sigilo de VC, não publicado
- Faturamento diferencial de BH especificamente (só tem dado nacional: R$5.542/mês)

## Links
- [[metodologia-personas]] · [[economia-preco-cac]] · [[validacao-ideia]] · [[PESQUISA-MERCADO]]


<!-- ============================================================ -->
# ARQUIVO: 03-icp-mercado/PESQUISA-MERCADO.md
<!-- ============================================================ -->

---
tipo: verdade
status: vivo
data: 2026-07-16
assunto: mercado
---
# Pesquisa de Mercado — Legalize Digital (Camada 1, desk research)

> Escopo: **SOMENTE BRASIL**. Data da coleta: **2026-06-21**. Fontes oficiais (Mapa de Empresas/MEMP, IBGE, Receita Federal, Congresso) + sites dos concorrentes.
> Cada dado: valor + fonte + confiança. Dados de marketing (clientes autodeclarados) = confiança média por natureza.

---

## A. Painel de mercado BR (tamanho do bolo)

| Número | Valor | Fonte | Conf. |
|---|---|---|---|
| Empresas ATIVAS no Brasil | **24,21 milhões** | Mapa de Empresas, 2º quad/2025 | Alta |
| — MEI | **12,66 mi (52,3%)** | idem | Alta |
| — Empresário Individual (não-MEI) | 3,25 mi | idem | Alta |
| — Sociedade Ltda | 7,96 mi | idem | Alta |
| — S.A. | 0,21 mi | idem | Alta |
| Empresas abertas em 2024 | **4,25 mi** | Mapa de Empresas (ano fechado) | Alta |
| Saldo 2024 (abertas − fechadas) | **+1,82 mi** | idem | Alta |
| Média de aberturas/mês (2º quad/2025) | **~417 mil/mês** | derivado do boletim | Alta |
| Optantes do Simples Nacional | **~23,4 mi** | Receita Federal, dez/2024 | Alta |
| — MEI (SIMEI) | **16 mi** | idem | Alta |
| — ME/EPP + demais (por subtração) | **~7,4 mi** | derivado | Média |

**Limites legais (vigentes 2024–2026):** MEI ≤ R$81 mil/ano · ME ≤ R$360 mil/ano · EPP R$360 mil–R$4,8 mi/ano. (LC 123/2006)

**Leitura:** ~7,4 mi de ME/EPP no Simples = o **mercado pagante realista** de contabilidade online (ticket R$137–700/mês). Fluxo contínuo de ~417 mil aberturas/mês = funil de novos clientes que nunca seca. **Não precisamos de milhões — 0,1% de 7,4 mi = 7.400 clientes.**

---

## B. Tabela mestra de concorrentes — posicionamento & tração

| Player | Posicionamento | Diferencial ALEGADO | Tração / capital | Conf. |
|---|---|---|---|---|
| **Contabilizei** | "A maior contabilidade online do BR" | Escala, abertura grátis (plano anual), tudo remoto | **+50 mil clientes** · SoftBank R$320 mi (2021) · **Warburg Pincus ~R$700 mi por fatia minoritária, virou maior acionista (out/2024)** | Alta (funding) / Média (clientes) |
| **Agilize** | "Você cuida da empresa, a gente da contabilidade" | "1ª contabilidade web do BR", **mensalidade FIXA** (não escala por faturamento), Fator R auto, multibenefícios | "+50 mil empreendedores" · **R$60 mi em 2024 (AXA IM, L4/B3, Stone)** | Alta (funding) / Média (clientes) |
| **Facilite** | "Crescer com economia e segurança" | "TouchTech" (tech + contador dedicado), OpenFinance, integrações e-commerce | +5.000 clientes (autodeclarado, sem funding público) | Média |
| **Contaja** | "Troque de contador e abra empresa fácil" | Melhor custo-benefício, contador no WhatsApp, 5.570 municípios, abertura 72h | ~850 clientes (2021) · R$1,2 mi via CapTable, valuation R$12 mi (early-stage) | Média (defasado) |
| **Marvee** | "Transforme a gestão financeira" | **BPO Financeiro + contabilidade all-in-one**, software próprio, modelo de franquia | +700 empresas · R$1 mi · 25 franquias, meta 1.000 clientes até dez/2025 | Média |

**Outros (blog Facilite):** Tactus (e-commerce/youtubers), Meu Contador Online, ContSimples, Contabilivre (+2.000), Qipu, Conube (serviços/TI/freelancers), Conta Azul (plataforma p/ escritórios migrarem). *Nibo e Osayk NÃO constam nesse artigo.*

---

## C. Preços & pacotes (perfil-padrão: PJ serviço, Simples, sem funcionários)

| Player | Entrada/mês | Modelo | Certificado | Conta PJ | Folha | MEI? |
|---|---|---|---|---|---|---|
| **Contaja** | a partir de **R$137** | escala por faturamento | divergente | grátis | inclusa (2–3) | **Sim, R$49,90** |
| **Contabilizei** | **R$139** Básico / **R$195** Padrão (c/ certificado) | escala (R$139→R$762 teto) | só Padrão+ | só Padrão+ | à parte / inclusa no Experts | **Não** |
| **Facilite** | **R$199,90** Blue | piso + ajuste por contato | à parte | Cora opcional | R$50/func. | **Não** |
| **Agilize** | **R$259** Basic (c/ −20%) | **fixa** | **incluso** | conexão bancária | até 3 inclusos | **Não** (só migração) |
| **Marvee** | **sob consulta** | personalizado (foco >R$30k/mês) | oferecido | Cora grátis | inclusa | **Não** |

**Tiers premium (contador dedicado):** Contabilizei Experts R$369→869 · Agilize Unique R$450 / Unique Plus R$700 · Facilite Black R$1.249,90.

**Add-ons avulsos (ex. Contabilizei, conf. alta):** reemissão guia R$15,90 · CND R$35,90 · alteração folha R$98,90/mês · alteração contratual R$1.199 · encerramento R$1.356–1.999. (Modelo padrão do setor: plano barato de entrada + sangria em avulsos.)

---

## D. Mapa de lacunas (porta de entrada)

1. **Opacidade de preço.** 4 de 5 usam "a partir de" + ajustam no simulador/comercial. Só Agilize tem preço fixo transparente. → **Transparência radical de preço** é diferencial real e barato de entregar.
2. **UX travada do líder.** Queixa do próprio Pedro (cliente Contabilizei) + reputação geral. → **Experiência/clareza** como cunha.
3. **MEI mal servido pelos premium.** Contabilizei, Agilize, Facilite e Marvee **não** atendem MEI de verdade (ou só como funil de upsell). Só Contaja tem plano MEI. Mas MEI paga pouco — é on-ramp, não lucro. → decisão estratégica: usar MEI como porta ou ignorar.
4. **A transição MEI→ME** (o caso do próprio Pedro) é o ponto que todos disputam — e o de maior valor. Momento "deixar de ser MEI".
5. **Concorrentes são digitais sem lastro profundo de expertise/compliance.** Todos jovens (maioria pós-2013), remotos. A Legalize (22 anos) nos dá **base de conhecimento + compliance + apoio operacional** que esses players construíram do zero queimando capital. ⚠️ NÃO vendemos o escritório físico como reforço do digital — o produto é digital puro. Os 22 anos viram **ativo de campanha lá na frente**, não posicionamento agora.
6. **BPO financeiro (modelo Marvee)** funciona pra empresas de serviço >R$30k/mês (agências, infoprodutores) — segmento mais rico, upsell natural. Legalize tem expertise pra isso.

---

## E. Leitura de pricing + impacto do teto MEI

**Faixa de mercado (serviço PJ Simples):** entrada cluster **R$137–259**; premium com contador dedicado **R$369–700+**; MEI ~R$49,90.
- Plano do Pedro (Contabilizei Padrão R$195) está no meio da faixa.
- Modelos: **escala por faturamento** (Contabilizei/Contaja/Facilite) vs **fixa** (Agilize). Transparência/previsibilidade = espaço aberto.

**Teto do MEI — estado real (jun/2026):**
- **VIGENTE hoje: R$81 mil/ano (R$6.750/mês). NÃO mudou.** Congelado desde 2018.
- **PLP 108/2021** (mais avançado): propõe **R$130 mil/ano** (relator pode subir a ~R$134 mil), +2 empregados, reajuste automático. Urgência aprovada na Câmara 17/jun/2026; voto previsto **julho/2026**. Ainda **não é lei.**
- **PLP 60/2025:** propõe **R$140 mil/ano** (mais atrás, no Senado).
- ⚠️ **Comunicar sempre como "proposta", nunca "novo teto já vigente".**

**Implicação estratégica do teto:** se o teto subir p/ R$130k, mais gente **fica MEI por mais tempo** → enfraquece o gatilho "vire ME" (a conversão mais lucrativa do setor) E aumenta a base MEI que um dia precisa de mais serviço. Faca de dois gumes — a precificação e a segmentação têm que prever os dois cenários (com e sem aprovação).

---

## F. Implicações pros 3 cenários da fase 0

- **A cunha não é bater a Contabilizei em feature.** É: (a) produto digital-native com melhor UX, (b) transparência de preço, (c) nicho de serviço no Simples (fronteira de automação), (d) onboarding simples.
- **Validação = mercado FRIO** (tráfego pago + assinaturas reais), nicho apertado (serviço PJ Simples; geo BH/MG no tráfego). NÃO é concierge nem usa a carteira/escritório físico da Legalize.
- **Papel da Legalize = base de conhecimento + compliance + apoio operacional no início das vendas** (back-end). Nunca reforço físico vendido ao cliente. Os 22 anos = ativo de campanha futuro.
- **Em 5 meses = MVP digital em teste real** (V1 no ar, captando por tráfego pago).
- **Fork sobre a "pessoa extra" do cenário intermediário:** o dado sugere que o moat inicial é **confiança + operação + posicionamento**, não tech. Logo, no começo, uma pessoa de **growth/ops** (aquisição + onboarding da base Legalize) pode valer mais que dev sênior — A NÃO SER que a tese seja construir automação proprietária como moat desde já. É decisão a debater, não fechada.

---

## G. Correções factuais importantes (pra não errar na frente do Mauro)

1. **"1 milhão de assinantes da Contabilizei" → NÃO confere.** Dado público é **"+50 mil clientes"** (repetido desde 2022; provável maior hoje, mas longe de 1 mi). **Não usar 1 mi na reunião.** Conf. Média-Alta.
2. **"Contabilizei foi vendida por milhões pra grupo estrangeiro" → parcial.** Warburg Pincus (fundo dos EUA) comprou **fatia minoritária** (~R$700 mi / US$125 mi) e virou **maior acionista** em out/2024. Não foi venda total. Antes, SoftBank liderou R$320 mi (2021). Conf. Alta.
3. **Fundação 2013 → confere.** Conf. Alta.
4. **Mercado real:** o setor inteiro de contabilidade online ainda é pequeno frente ao bolo — Contabilizei (líder) ~50k de ~7,4 mi ME/EPP pagantes. **Penetração baixa = espaço enorme**, não mercado saturado.

---

## H. Lacunas de pesquisa (o que ficou + importância)

| Lacuna | Importância | Como fechar |
|---|---|---|
| Preço travado por faturamento + desconto anual dos concorrentes | Alta (só na fase de precificar o NOSSO produto) | Rodar simuladores no Chrome (Contaja/Contabilizei/Facilite); Marvee só comercial |
| Custo por funcionário adicional (folha) — Contabilizei/Agilize não publicam | Alta (p/ precificação) | Simulador/comercial |
| Nº de clientes atualizado da Contabilizei (2025/26) | Média | Release/imprensa recente |
| Split oficial exato ME vs EPP no Simples | Média | Consulta interativa RF (exige navegador) |
| Boletim Mapa de Empresas 3º quad/2025 (ano 2025 fechado) | Média | Não publicado até jun/2026; reconsultar |
| Tração recente Contaja/Marvee (2024–26) | Baixa-Média | Pouca cobertura de imprensa |
| Texto final do PLP 108/2021 (R$130 vs R$134 mil) | Média | Só após voto (julho/2026) |

---

## I. Unit economics da Contabilizei (estimativa — NÃO oficial)

> Reverse-engineering com faixas. Números reais são sigilosos. Serve pra calibrar expectativa.

- **ARPU ≠ R$195.** Preço escala por faturamento (Básico R$139→762), tiers caros (Experts R$369–869) + avulsos (alteração contratual R$1.199, encerramento ~R$1.999, folha, certificado). **ARPU blendado estimado ~R$250–400/mês.**
- **Receita estimada:** 50k × R$300 × 12 ≈ **R$180 mi/ano**; base provável >50k em 2024 → **~R$200–290 mi**.
- **Deal Warburg (out/2024):** R$700 mi por fatia minoritária (virou maior acionista) → fatia ~20–35% → **valuation implícito ~R$2–3,5 bi** → **~12–17x receita**. Múltiplo de líder de categoria; paga o futuro, não o presente. **Fecha.**
- **1.200 colaboradores** × ~R$8k custo cheio ≈ **R$115 mi/ano só de pessoal (~57% da receita)** + marketing pesado → **opera no zero/queimando**. Normal: cresce com dinheiro de investidor, não com lucro.
- **Margem "exorbitante" = TESE, não realidade atual.** É híbrido (software + 1.200 humanos), não SaaS puro de 80%.
- **Implicação Legalize:** já temos os contadores (Legalize). A Contabilizei queimou capital de VC montando a camada humana que nós já temos pronta → potencial de margem boa com **muito menos queima de capital**. Argumento pro Mauro: *"eles gastaram bilhões montando o que a gente já tem."*

**Clientes alegados (autodeclarados, datas/definições diferentes, não auditados):** Contabilizei +50k · Agilize +50k (suspeito — provável acumulado) · Facilite +5.000 · Contabilivre +2.000 · Marvee +700 · Contaja ~850 (2021). Líder tem ~50k de ~7,4 mi pagantes; 2º–5º somados não passam de ~60k → **mercado pulverizado e mal penetrado**.

---

## J. Cobertura de CNAE da Contabilizei — o filtro real (jun/2026)

> ⚠️ A "Tabela CNAE" pública (PDF que o Pedro salvou) **NÃO é** filtro de elegibilidade — é tabela de referência/SEO (CNAE→Anexo→Fator R→alíquota) que marca quase tudo "Atende". O filtro real está nas páginas de **suporte**.

- **Atende:** Simples Nacional + Lucro Presumido (até ~R$ 4,8 mi). Anexos **I** (comércio), **III/IV/V** (serviços). **NÃO faz Lucro Real.** Indústria (Anexo II) fora.
- **NÃO atende:** indústria/fábricas, construção civil, material de construção/móveis, gráficas, farmácias, transporte, hospedagem, segurança, instituições financeiras, terceirização de mão de obra (Anexo IV), rural, cooperativas/cartórios/condomínios, ONGs/igrejas. Restaurante/bar = sinal misto (não confirmado).
- **Atende com condições:** atividades reguladas (médico, dentista, advogado, eng/arq, corretor) — exige responsável técnico/conselho; OAB não mistura atividades; reguladas não podem ser EI.
- **🔑 INSIGHT-CHAVE:** o recorte de CNAE = **fronteira da automação + proteção de margem.** Cortam tudo que quebra o software ou exige contador sênior: ICMS-ST/IPI (mercadoria), folha pesada/risco trabalhista (Anexo IV), Lucro Real. Sweet spot **deles** = **serviço + comércio leve no Simples/LP** (apuração quase determinística, folha mínima). **O nosso V1 é só a metade de serviço** — comércio leve fica fora até depois do V1. Profissionais liberais (médico/advogado) = alto LTV, baixo conflito fiscal = dinheiro premium. Tabela pública = SEO/aquisição, não triagem.
- **Implicação p/ Legalize:** nosso nicho deve espelhar a fronteira deles — serviço PJ no Simples (Anexo III/V, Fator R), **evitar mercadoria/indústria/folha pesada**. É onde a automação é viável e a margem existe.
- Fontes: contabilizei.com.br/contabilidade-online/cnae/ · suporte.contabilizei.com.br (Atividades não atendidas; Atividades Regulamentadas). Conf. alta (suporte), média (landings JS não extraíveis).

---

## K. O concorrente real = status quo + o custo do jeito velho 🔑

> **Tese (Pedro): o concorrente não é a Contabilizei — é a planilha, o caderno, a inércia e o dinheiro perdido fazendo do jeito velho. VALIDADA** (teoria + exemplos BR + dado SEBRAE).

- **Teoria:** Christensen — "competir contra o não-consumo" + Jobs-to-be-Done (status quo/planilha = concorrente do "job"). Conf. alta.
- **Exemplos BR:** ContaAzul ("abandone a planilha"), Nubank (contra o status quo bancário), GuiaBolso ("adeus às planilhas"), Conta Simples (contra planilha/caderno). Conf. alta.

**Dado que crava (SEBRAE Hábitos Financeiros, jan/2026):**
- Controle financeiro: **30% planilha · 25% caderno · 20% app/sistema · 13% contador · 10% nada** → **~55% manual, só 20% digital.**
- **61% pagam a empresa com a conta pessoal**; **50% controle precário.** Conf. alta.

**A sangria (custo do jeito velho — munição de dor):**
- Atraso de imposto: multa **0,33%/dia, teto 20% + Selic** (Lei 9.430). Ex: DAS R$1.500, 21 dias ≈ +7,9%. Conf. alta.
- **Exclusão do Simples por dívida:** 2024 = 1,8 mi negócios / R$26,7 bi; 2026 = 1,1 mi / R$12,9 bi (RF). Conf. alta.
- Obrigações acessórias: 1,5 mi PJ em risco de CNPJ inapto (RF jan/2026); 6 mi com pendências. Conf. alta.
- Enquadramento errado: Fator R = ~10 pp (Anexo III 6% vs V 15,5%). "67% pagam a mais / até 40%" = escritório contábil, **conf. BAIXA**.
- Conformidade: **1.501 h/ano** p/ pagar imposto (Banco Mundial 2021, ranking descontinuado — datar); custo de acompanhar legislação R$181 bi/ano, peso **5,82% do PIB** p/ empresas menores (IBPT 2021, média).
- Mortalidade PME: ~60% fecham em 5 anos (MEI 29%, ME 21,6%, EPP 17%). Causas: capital de giro 51%, carga tributária 34% (Causa Mortis, edições antigas — média).

**Uso no deck:** beat "contra quem competimos de verdade" = status quo (planilha/caderno/inércia) + sangria. Agita a dor ANTES da oportunidade. Diretos = lente secundária.
**Nuance nicho ME:** ME é obrigado a ter contador → inimigo preciso = "contador/ferramenta travada + erro humano + dinheiro perdido", não DIY puro. Dado planilha/caderno = comportamento amplo de gestão manual.
Fontes: Receita Federal, SEBRAE (Hábitos Financeiros 2025/26; Sobrevivência; Causa Mortis), Lei 9.430/96, IBPT, Banco Mundial, HBS/Christensen.

---

## L. LP atual do Mauro (legalizedigital.com.br) + distribuição setorial

**LP do Mauro (esboço engavetado) — conf. alta:**
- 3 planos: **Starter/MEI R$99,90** (1 colab) · **Standard R$399,90** "mais vendido" (3 colab) · **Premium Plus R$699,90** (7 colab).
- ⚠️ **Features idênticas nos 3** — só muda nº de colaboradores na folha. Sem lógica de tiering por escopo.
- Entregáveis: contabilidade completa, folha, pró-labore, balanço/DRE anual ou livro caixa, consultoria jurídica, atendimento sistema/WhatsApp/telefone 08–18h.
- Metodologia: 3 passos (cadastra + paga 1º mês → migração de docs → pronto).
- **CTA = WhatsApp (BH, 31). Sem self-service.** Clone simplificado da Contabilizei, conversão manual.
- Leitura: prova a intenção, mas é esboço sem embasamento (preço sem lógica, sem produto). Ponto de partida, não crítica.

**Distribuição setorial (Mapa de Empresas, 2º quad/2025) — conf. alta no agregado:**
- Estoque de ativas: **Serviços 53,6% + Comércio 28,6% = 82,2%.** Indústria+construção+demais ≈ 17,8%.
- (Atenção: aberturas NOVAS têm split diferente — serviços 37,6% + comércio 32,9%. Pra mercado endereçável use o ESTOQUE = 82%.)
- **Perfil endereçável DO LÍDER** (serviço + comércio leve no Simples, menos exclusões da Contabilizei) = teto 82%, faixa estimada ~60–75% (estimativa, conf. média).
- **⚠️ O nosso é menor:** o V1 corta comércio inteiro (decisão 15/07), então nosso endereçável parte dos **53,6% de serviço**, não dos 82%. Os 28,6% de comércio ficam em [[cnae-comercio-standby]] pra depois. Não confundir os dois números — o de 82% mede o mercado do concorrente, não o nosso.
- Split exato ME×EPP e optantes-Simples-por-setor = não publicado.
Fontes: legalizedigital.com.br · gov.br Mapa de Empresas 2º quad/2025 · suporte.contabilizei.com.br.

---

## M. Benchmark de custo de build MVP (deep research Gemini, 2026-07-07)

> Fonte: relatório "Orçamento MVP SaaS Contábil" (Gemini Pro deep research, escopo BR 2025/2026, nosso MVP exato: onboarding + NFS-e via API + DAS + dashboard, BH/Contagem). Arquivo em Downloads; números-chave abaixo.

**Custo total MVP 5 meses (build + mídia + infra):**

| Modalidade | Total 5 meses | Conf. |
|---|---|---|
| Software house BR | **R$90k–184k** | Alta |
| Squad própria CLT (sênior+jr+UX pleno) | **R$173,6k–305,6k** | Média |
| PJ (sênior+jr, SEM designer) | **R$125k–216,5k** | Alta |

**Cruzamento com Cenário B (R$169k, COM validação gateada + salário Pedro):**
- Nosso total fica ABAIXO do piso da squad CLT de mercado e no meio da faixa software house — **incluindo** 2 meses de validação e o PM/growth/design (Pedro), que nenhuma faixa de mercado inclui. Sem o salário do Pedro (R$60k/5m), o build efetivo é ~R$109k = abaixo do piso PJ. **R$169k é defensável e barato.** Conf. alta.
- ⚠️ **Tensão real: sênior.** Mercado 2026: sênior CLT nominal R$12,45–20,95k (carregado R$19,9–33,5k); PJ R$17–27k. Nosso orçamento (R$9k bruto / ~R$11,5k carregado) está ABAIXO do piso. Saídas: (a) sênior PJ meio-período ~R$8,5–13,5k/mês, (b) pleno forte + Pedro/IA supervisão, (c) subir banda e comer contingência. Decidir no fim do V0 (spike). Conf. alta.
- Júnior R$4k: piso de mercado, ok porque é cedido pela Legalize. Tráfego fee R$1,5k = piso de mercado (mitigado: Pedro supervisiona). Infra R$2k/mês: folgado (mercado R$250–800). Mídia R$5k/mês: dentro do mínimo recomendado (R$3–8k). Conf. alta.

**Números que preenchem os placeholders do gate (§13 da base):**
- CPL contábil/B2B: Meta R$25–80 · Google R$50–200. CAC típico R$500–4.000 (5% conversão lead→cliente). Budget mínimo de teste 30–60 dias: R$3–8k/mês só de mídia. Conf. alta.
- Implicação: no ticket R$139–195, CAC R$1.000 = payback 5–7 meses → gate deve medir CPL qualificado (≤R$80 Meta) + intenção de pagar, não CAC direto.

**Esteira de mercado valida nosso prazo:** discovery 2–4 sem → design 2–4 → build 8–12 → beta 2–4 → launch 1–2 = **3–6 meses**. Contabilizei: fundação→primeiros 100 clientes ≈ 4–6 meses (2013/14). Nosso 5 meses (V0+V1) = dentro da faixa. Conf. alta.
**Erro clássico que estoura orçamento (validou nosso build-vs-buy):** construir integração própria contra webservices de prefeitura em vez de API terceira (Focus NFe R$89,90–113,90/mês, cobre BH; eNotas R$137–347). Certificado A1: R$149,90–274,90/ano. Conf. alta.

---

## Fontes principais
- Mapa de Empresas / MEMP — boletim 2º quad/2025 e 3º quad/2024 (gov.br/empresas-e-negocios)
- IBGE — Demografia das Empresas (ref. 2022)
- Receita Federal — Simples Nacional (notas dez/2024, jan/2025)
- Câmara dos Deputados (PLP 108/2021) · Senado (PLP 60/2025)
- Sites: contabilizei.com.br, contaja.com.br, marvee.com.br, facilite.co, agilize.com.br
- Imprensa de negócios: InfoMoney, Exame, Startups.com.br (funding)


<!-- ============================================================ -->
# ARQUIVO: 03-icp-mercado/validacao-ideia.md
<!-- ============================================================ -->

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


<!-- ============================================================ -->
# ARQUIVO: 03-icp-mercado/economia-preco-cac.md
<!-- ============================================================ -->

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


<!-- ============================================================ -->
# ARQUIVO: 03-icp-mercado/concorrentes/matriz-comparativa.md
<!-- ============================================================ -->

---
tipo: derivado
status: vivo
data: 2026-08-05
assunto: matriz-comparativa
deriva_de: [_sintese-paginas-publicas, PESQUISA-MERCADO, referencias]
tags: [pesquisa, concorrente, matriz]
---

# 📊 Matriz comparativa de concorrentes

> Remontagem do dado já coletado (`_sintese-paginas-publicas.md`, `PESQUISA-MERCADO.md` §B/C, `referencias.md`) no formato de matriz + quadrante.

## Players mapeados

| Player | Origem | Tipo | Preço entrada | Prazo/entrega | Diferencial de modelo |
|---|---|---|---:|---|---|
| **Legalizai Story Book** | BH/MG (Legalize Digital, 22 anos) | Direto | R$139 ME · R$49,90 MEI | abertura digital, meta &lt;72h | preço fechado sem asterisco + humano no plano de entrada + hiperlocal BH |
| Contabilizei | Nacional (SP, 2013) | Direto | R$139–195 (escala p/ faturamento) | — | maior escala, SEO dominante, margem real em corretagem |
| Agilize | Nacional | Direto | R$259 (fixo, 20% off permanente) | — | único preço fixo (por volume, não faturamento) |
| Contaja | MG (CRC MG) | Direto | R$137 Simples · R$49,90 MEI | abertura 72h alegada | piso de preço do setor, à la carte agressivo |
| Facilite | Nacional + Estônia | Direto | R$199,90 | — | wedge nicho Airbnb/temporada, venda consultiva |
| Contabilivre | SP-interior | Direto | R$209 (gated) | — | device de marca "#livre", tudo formulário |
| Marvee | SC (Blumenau) | Indireto | sob consulta (ticket alto) | — | BPO financeiro, escala por franquia |
| Planilha/caderno/contador tradicional | — | Indireto | R$0 direto, custo oculto (multa/retrabalho) | — | status quo — o concorrente real segundo [[PESQUISA-MERCADO]] §K |
| ContaAzul / Nubank | Nacional | Aspiracional | — | — | referência de craft/UX — "abandone a planilha", não disputa o mesmo orçamento |

> **Direto** = resolve o mesmo job (contabilidade digital pra ME/MEI Simples), mesma categoria. **Indireto** = mesmo job, categoria diferente (BPO consultivo, ou nem categoria — é inércia/manual). **Aspiracional** = referência de execução/craft, não concorre pelo orçamento do cliente.

## Posicionamento no "quadrante mágico"

Legalizai Story Book ocupa espaço combinando **3 variáveis** que nenhum concorrente direto atende juntas:

- **Preço fechado sem asterisco** — todos os 5 diretos usam "a partir de", simulador gated, ou ajuste pós-contato. Nenhum crava número final na tela.
- **Humano no plano de ENTRADA** — em todos os 5, contador/gerente nomeado só aparece no tier caro (R$359–700). Legalizai propõe isso **desde o primeiro plano do Simples Nacional (R$139)**. No MEI (R$49,90) a camada é assistente virtual, não contador dedicado (decisão 17/08) — o que não afeta a comparação, porque a briga é em plano de Simples e o líder nem atende MEI.
- **Hiperlocal BH operacional** — Contaja já é MG (CRC), mas nenhum trata ISS-BH/alvará PBH/Junta MG como produto; é onde a Legalize (22 anos de operação local) tem vantagem estrutural que nenhum digital-native nacional replica rápido.

## Dimensões de comparação

### 1. Preço e transparência
Cluster de entrada R$137–259/mês. Contaja crava o piso, Agilize o teto de entrada. **Todos** têm opacidade em algum ponto (Contaja esconde custo real no FAQ; Facilite/Contabilivre gatekeepam com form/call; Agilize tem "fixo" com asterisco de regime). Legalizai Story Book: preço na tela = preço da fatura, sem exceção.

### 2. Humano no plano de entrada
Zero dos 5 diretos oferece contador nomeado no tier barato — é sempre upsell (R$359+ Contabilizei, R$450+ Agilize, R$359 Contabilivre, R$1.249,90 Facilite Black). Achado nº1 do FAQ deles: "vocês têm contador DE VERDADE?" é a pergunta mais repetida — ferida de confiança da categoria inteira.

### 3. Custo de saída
Só Contaja e Contabilivre publicam preço de baixa/migração (Contaja: baixa R$1.359, migração MEI→ME R$1.399). Nenhum precifica saída na vitrine — é sempre descoberto depois. Brecha de confiança aberta pra qualquer um que declarar isso de cara.

### 4. Craft/acabamento
Epidêmico quebrado: Facilite "0+ Clientes · 0+ NPS", Agilize "+0 anos" (JS não disparou), Contaja cookie banner tapando conteúdo + seção "na mídia" vazia, Contabilivre azul-Bootstrap genérico. Numa categoria de dinheiro, isso vaza credibilidade — polish impecável é diferenciação quase de graça.

## Fonte dos dados

- `pesquisa/concorrentes/*/paginas-publicas.md` e `*/marca.md` (Playwright, capturas 2026-07-09)
- `pesquisa/concorrentes/_sintese-paginas-publicas.md`
- `pesquisa/PESQUISA-MERCADO.md` §B/C (tabela mestra + preços)
- `marca/referencias/referencias.md` (mapa de cor/tipografia/arquétipo)

## Links
- [[insights-estrategicos]] · [[_sintese-paginas-publicas]] · [[PESQUISA-MERCADO]] · [[referencias]]


<!-- ============================================================ -->
# ARQUIVO: 03-icp-mercado/concorrentes/insights-estrategicos.md
<!-- ============================================================ -->

---
tipo: derivado
status: vivo
data: 2026-08-05
assunto: insights-estrategicos
deriva_de: [_sintese-paginas-publicas, PESQUISA-MERCADO]
tags: [pesquisa, concorrente, insights]
---

# 🎯 Insights estratégicos do benchmarking

> Remontagem dos achados já em `_sintese-paginas-publicas.md` §5 padrões + `PESQUISA-MERCADO.md` §D, no formato insight→ação.

## Os insights que mudam o jogo

### 1. Humano é upsell em 100% dos concorrentes diretos
Contador/gerente nomeado só aparece no tier caro (Contabilizei R$395, Agilize R$450, Contabilivre R$359, Facilite Silver+). A pergunta mais repetida nos FAQs deles é "vocês têm contador DE VERDADE?" — a ferida de confiança nº1 da categoria.

**Ação:** contato humano real desde o plano de entrada. Não é feature, é resposta direta à ansiedade nº1 do cliente — a marca precisa gritar isso (foto real, nome, CRC visível).

---

### 2. Transparência de preço é sempre semi
"A partir de", ajuste pós-contato, formulário gated (Facilite, Contabilivre), asterisco de regime até na Agilize (único com número fixo, mas só dentro do Simples).

**Ação:** preço fechado de verdade — "o valor da tela é o valor da fatura, sem asterisco". Ninguém no mercado mapeado faz isso puro.

---

### 3. Custo de saída é escondido por todos
Contaja: baixa R$1.359, migração MEI→ME R$1.399. Nenhum precifica saída na vitrine — barato pra entrar, caro pra sair.

**Ação:** declarar custo de saída de cara é fosso de confiança que ninguém ousa abrir. Baixo custo de implementar (é só honestidade), alto retorno de percepção.

---

### 4. "Grátis" é CAC disfarçado, não generosidade
Abertura grátis em quase todos = isca pra recorrência. Contabilizei vai além: subsidia mensalidade pra vender corretagem (saúde PJ, banco, benefícios) — a margem real não está no R$/mês.

**Ação:** não brigar em R$/mês onde o líder ganha noutro lugar (ele pode queimar margem porque monetiza em outro produto). Ganhar em confiança + experiência, não em corrida de fundo de preço.

---

### 5. Craft quebrado é epidêmico
Facilite "0+ Clientes · 0+ NPS", Agilize "+0 anos" (JS travado), Contaja cookie banner tapando tabela, Contabilivre visual genérico de template. Numa categoria de dinheiro, isso vaza credibilidade.

**Ação:** craft impecável é diferenciação quase de graça — nenhum concorrente investe nisso hoje.

---

### 6. MEI é mal servido pelos premium
Contabilizei, Agilize, Facilite, Marvee não atendem MEI de verdade (ou só como funil de upsell). Só Contaja tem plano MEI publicado. Mas MEI paga pouco — é on-ramp, não lucro, e a transição MEI→ME é o momento de maior valor disputado por todos.

**Ação:** decisão já travada em [[legalize-escopo-mei-lucro-presumido-aberto]] — MEI entra, inclusive no fluxo Migrar. Mas atenção: [[economia-preco-cac]] mostra que o plano MEI (R$49,90) já é apertado só com custo técnico — monitorar de perto quando honorário real entrar na conta.

---

## Riscos identificados

### Risco 1 — Teto do MEI pode subir (PLP 108/2021, R$130-134 mil/ano)
Se aprovado, mais gente fica MEI por mais tempo → enfraquece o gatilho "vire ME" (conversão mais lucrativa do setor) e aumenta a base MEI que eventualmente precisa de mais serviço. Faca de dois gumes.
→ **Defesa:** precificação e segmentação precisam prever os dois cenários (com e sem aprovação); comunicar sempre como "proposta", nunca "já vigente" — vale ainda em ago/2026, votação prevista jul/2026 não confirmada.

### Risco 2 — Mercado pulverizado mas com líder bem financiado
Contabilizei tem SoftBank (R$320mi, 2021) + Warburg Pincus (~R$700mi, maior acionista, 2024) — pode queimar caixa por muito mais tempo que qualquer entrante bootstrapped.
→ **Defesa:** não competir em volume de mídia/SEO contra o líder. Competir em nicho hiperlocal (BH/MG) + humano de entrada, onde o capital dele não compra vantagem automática.

### Risco 3 — Categoria já ensinou o cliente a desconfiar de "online = sem humano"
Achado nº1 do FAQ é evidência: a ansiedade é estrutural, não específica de um concorrente.
→ **Defesa:** prova de humano real (nome, foto, CRC) tem que aparecer cedo na jornada, não só como resposta de FAQ.

---

## Benchmarks de mercado (referência externa)

| Métrica | Valor | Fonte |
|---|---:|---|
| CPL contábil/B2B — Meta | R$25–80 | Gemini deep research, 2026-07-07 |
| CPL contábil/B2B — Google | R$50–200 | idem |
| CAC típico (5% conversão lead→cliente) | R$500–4.000 | idem |
| Budget mínimo de teste (30-60 dias) | R$3-8k/mês só mídia | idem |
| Payback no ticket R$139-195 com CAC R$1.000 | 5-7 meses | idem, cruzado com [[economia-preco-cac]] |
| Mercado ME/EPP Simples pagante (Brasil) | ~7,4 milhões | Receita Federal, dez/2024 |
| Penetração do líder (Contabilizei) | ~50 mil de 7,4 mi (~0,7%) | [[PESQUISA-MERCADO]] §A/I |

> Penetração baixa = espaço aberto, não mercado saturado — mesmo com líder bem financiado.

## Links
- [[matriz-comparativa]] · [[_sintese-paginas-publicas]] · [[PESQUISA-MERCADO]] · [[economia-preco-cac]] · [[legalize-escopo-mei-lucro-presumido-aberto]]


<!-- ============================================================ -->
# ARQUIVO: 03-icp-mercado/cnae-escopo/taxonomia-pills-n4.md
<!-- ============================================================ -->

---
tipo: derivado
status: vivo
data: 2026-08-28
assunto: taxonomia-pills-n4
deriva_de: [cnae-liso-servico]
tags: [cnae, ux, n4, pills]
---

# 🏷️ Taxonomia de pills do N4 — v2 (87 CNAEs certeza)

> Substitui a v1 de 16/07 (`_arquivo/taxonomia-pills-n4.md`, 9 categorias, 124 CNAEs herdados da Contabilizei, não ratificados). Esta versão agrupa os **CNAEs "atendemos com certeza"** de [[cnae-liso-servico]] (fonte primária, 27/08) em categorias que um leigo reconhece.
>
> 🔄 **28/08:** eram 90/15 categorias. Investigação do eixo de registro setorial ([[cnae-liso-servico]] §"Saíram na correção") tirou `5232-0/00` (agenciamento marítimo, confirmado exige registro federal) e pendurou `3831-9/99`/`3832-7/00` fora da certeza (indício não confirmado). Como os 2 únicos CNAEs da categoria "Recuperação de materiais" eram exatamente esses, a categoria inteira SOME. **87 certeza, 14 categorias.**
>
> ⚠️ **Curada manualmente em conversa (Pedro + Claude, 27/08), não gerada por script** — diferente da v1, que saía de `taxonomia-pills.js`. Se o dataset mudar, esta nota precisa de revisão manual, não só re-rodar um gerador.

## As 14 categorias

| # | Categoria | CNAEs | Exemplo (1ª pessoa) |
|---|---|---|---|
| 1 | Tecnologia e software | 8 | "Desenvolvo sites, apps ou sistemas sob encomenda" |
| 2 | Design | 4* | "Crio design gráfico, de interiores ou de produto" |
| 3 | Foto, vídeo e áudio | 8 | "Fotografo, filmo e edito vídeo ou áudio" |
| 4 | Marketing e publicidade | 6 | "Cuido de redes sociais e faço publicidade pra clientes" |
| 5 | Edição e mídia | 6 | "Edito livros, jornais ou revistas" |
| 6 | Consultoria, pesquisa e tradução | 5 | "Faço consultoria, pesquisa ou tradução pra empresas" |
| 7 | Ensino e cursos | 9 | "Dou aula de idioma, música, dança ou curso profissionalizante" |
| 8 | Arte, cultura e patrimônio | 8 | "Produzo teatro, música, ou represento artista e atleta" |
| 9 | Eventos e entretenimento | 4 | "Organizo eventos, festas ou casas de jogos" |
| 10 | Apoio administrativo | 8 | "Faço serviços de escritório, cobrança e teleatendimento" |
| 11 | Aluguel de equipamentos | 8 | "Alugo equipamentos, móveis ou objetos" |
| 12 | Reparos e manutenção | 10 | "Conserto computador, celular, bicicleta ou relógio" |
| 13 | Salão e beleza | 1 | "Trabalho com cabelo, manicure e pedicure" |
| 14 | Hospedagem | 2 | "Tenho albergue ou pensão" |
| | **87 slots** (87 CNAEs + 1 duplicata − 1 sem pill) | |

*Design conta 4 pela duplicata proposital de `6201-5/02` (Web design) — aparece em Tecnologia **e** Design.

## Composição (CNAE por categoria)

### 1. Tecnologia e software (8)
`6201-5/01` · `6201-5/02` · `6202-3/00` · `6203-1/00` · `6204-0/00` · `6209-1/00` · `6311-9/00` · `6319-4/00`

### 2. Design (4, com duplicata)
`6201-5/02` (dup) · `7410-2/02` · `7410-2/03` · `7410-2/99`

### 3. Foto, vídeo e áudio (8)
`7420-0/01` · `7420-0/03` · `7420-0/04` · `7420-0/05` · `5911-1/02` · `5912-0/01` · `5912-0/02` · `5920-1/00`

### 4. Marketing e publicidade (6)
`7311-4/00` · `7312-2/00` · `7319-0/02` · `7319-0/03` · `7319-0/04` · `7320-3/00`

### 5. Edição e mídia (6)
`5811-5/00` · `5812-3/01` · `5812-3/02` · `5813-1/00` · `5819-1/00` · `6391-7/00`

### 6. Consultoria, pesquisa e tradução (5)
`7210-0/00` · `7220-7/00` · `7490-1/01` · `7490-1/04` · `7490-1/99`

### 7. Ensino e cursos (9)
`8591-1/00` · `8592-9/01` · `8592-9/02` · `8592-9/03` · `8592-9/99` · `8593-7/00` · `8599-6/03` · `8599-6/04` · `8599-6/05`

### 8. Arte, cultura e patrimônio (8)
`9001-9/01` · `9001-9/02` · `9001-9/03` · `9001-9/04` · `9002-7/01` · `9002-7/02` · `9102-3/02` · `7490-1/05`

### 9. Eventos e entretenimento (4)
`9319-1/01` · `9329-8/03` · `9329-8/04` · `8230-0/01`

### 10. Apoio administrativo (8)
`8211-3/00` · `8219-9/01` · `8219-9/99` · `8220-2/00` · `8291-1/00` · `8292-0/00` · `8299-7/03` · `8299-7/07`

### 11. Aluguel de equipamentos (8)
`7721-7/00` · `7722-5/00` · `7723-3/00` · `7729-2/01` · `7729-2/02` · `7729-2/03` · `7729-2/99` · `7733-1/00`

### 12. Reparos e manutenção (10)
`9511-8/00` · `9512-6/00` · `9521-5/00` · `9529-1/01` · `9529-1/02` · `9529-1/03` · `9529-1/04` · `9529-1/05` · `9529-1/06` · `9529-1/99`

### 13. Salão e beleza (1)
`9602-5/01`

### 14. Hospedagem (2)
`5590-6/01` · `5590-6/03`

## Fora de pill, achados só pelo textarea (1)
`9609-2/02` (agências matrimoniais/matchmaking) — continua nos 87 atendidos, mas não justifica pill própria: nicho demais e sem categoria vizinha honesta. Mesma doutrina "pill estreita, não valida" (17/07) — a pessoa ainda descreve no textarea, é lá que a IA cruza.

> 🔴 **Agenciamento marítimo (era 5232-0/00) SAIU DE VEZ, não é mais "fora de pill" — é "não atende".** Confirmado 28/08: exige habilitação federal (Receita Federal, Siscomex/RADAR aduaneiro). Ver [[cnae-liso-servico]].
>
> 🟡 **Recuperação de metal e de plástico (eram 2 CNAEs da divisão 38) também saíram**, mas por motivo diferente: pendentes, não descartados. Indício de exigência de CTF/APP (IBAMA), não confirmado. Por isso a categoria "Recuperação de materiais" inteira sumiu da lista acima — reaparece se a pesquisa confirmar "não exige" pros dois.

## O que mudou vs a v1 (16/07, arquivada)

1. **Categorias caíram de 9 pra 15** — a v1 tinha "sacos" (Eventos/Cultura/Esporte e Limpeza/Manutenção/Reparos, nomeados como tal na própria nota v1) que misturavam atividades sem identidade comum. A v2 quebra mais fino.
2. **"Conserto de veículos" (funilaria/mecânica) SOME.** Não existe CNAE de oficina automotiva nos 90 certeza — cai em `verificar-licenciamento` (risco médio/alto), não é `liso`. A lista antiga prometia algo que a base de hoje não sustenta.
3. **"Manutenção de máquinas" (industrial) SOME** pelo mesmo motivo (divisão 33, `verificar-licenciamento` no roadmap de [[cnae-liso-servico]]).
4. **"Conserto de eletrônicos" sobrevive**, fundido dentro de "Reparos e manutenção".
5. Achado no debate (27/08): categoria "Agenciamento" inicial forçava 3 CNAEs sem relação (marítimo · esportivo/cultural · matrimonial) só pela palavra em comum. Corrigido: agenciamento esportivo/cultural foi pra "Arte, cultura e patrimônio" (combina); marítimo e matrimonial saíram de pill (ver seção acima).
6. **"Cerimonialista de casamento" não é "agência matrimonial"** — são profissões diferentes (matchmaking × organização do evento). Cerimonialista já tem casa: `8230-0/01`, dentro de "Eventos e entretenimento".
7. **28/08 — categoria "Recuperação de materiais" SOME.** O eixo de registro setorial (`cnae-verifica-atende.js`) achou que os 2 CNAEs dessa categoria nunca tiveram essa checagem específica rodada neles. Investigado: `3831-9/99`/`3832-7/00` seguem pendentes (indício de CTF/APP IBAMA, não confirmado), e `5232-0/00` (marítimo, que já estava fora de pill) confirmou exigência real e foi descartado de vez. 15→14 categorias.

## Próximo passo (não feito ainda)
Se a pesquisa confirmar "não exige registro setorial" pros 2 pendentes, a categoria "Recuperação de materiais" volta (2 CNAEs, mesma composição de antes) — atualizar `PILLS` em `app/src/components/gate-telas.tsx` nesse momento.

## Links
- [[cnae-liso-servico]] · [[fundamentos-cnae]] · [[cnae-matriz-governo]]
