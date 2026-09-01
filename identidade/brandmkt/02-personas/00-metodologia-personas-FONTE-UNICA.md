---
tipo: original
status: vivo
data: 2026-08-05
assunto: metodologia-personas
tags: [pesquisa, personas, marketing]
---

# 👤 Personas — sistema (fonte única)

> **Esta é a FONTE ÚNICA de personas de marketing.** Orgânico, tráfego pago e criativos leem daqui. Nada de persona solta em outro doc.
>
> ⚠️ Diferente de `execucao/motor-testes/personas/*.json` — aquelas são **fixtures de QA de fluxo** (nível de letramento digital + gatilhos de estresse de UX), não personas de marketing. Servem de **seed** (traço de comportamento real observado), não de substituto. Achado já registrado pelo próprio vault: `HOME.md` 25º flow (05/08).

## Como o sistema funciona

Aqui **comprador = usuário** sempre (o dono do CNPJ que assina é quem usa o app todo dia) — diferente do template genérico de 3 camadas (que separa "quem paga" de "quem recebe"). Por isso:

- **Camada 1 — dorsais**: as personas permanentes, espinha do negócio.
- **Camada 2 (quem recebe/usa) — NÃO SE APLICA.** Pulada por decisão estrutural do produto, não por preguiça.
- **Camada 3 — matriz mestre**: cruza dorsal × ocasião/contexto × oferta × mensagem-âncora.

## Camada 0 — Governança (como o sistema cresce)

| Tipo | O que é | Vida | Onde mora |
|---|---|---|---|
| **Dorsal** | Persona canônica, base do negócio | Permanente (muda só via decisão registrada) | esta pasta, 1 arquivo por persona |
| **Volante** | Recorte ocasional/sazonal de uma dorsal | Temporária, tem janela de validade | `pesquisa/personas/volantes/<nome>.md` |

### Quando criar uma nova dorsal (precisa dos 3 critérios)
1. **Ocasião/segmento mal-coberto** pelas dorsais atuais.
2. **Volume sustentado** — recorre ao longo do ano, não é pico isolado.
3. **Economia própria fecha** — puxa oferta com CAC/ticket viável (checar contra [[economia-preco-cac]]).

## Camada 1 — Dorsais (fechadas 05/08 com dado real de mercado; D e E criadas 26/08)

Enriquecidas com [[perfil-microempreendedor-mercado]] (pesquisa externa Gemini/Google Search). Arquivo completo por dorsal em `pesquisa/personas/`.

| Dorsal | Arquivo | Traço-chave | Status |
|---|---|---|---|
| **A — "Direto"** (32-42a, serviço intelectual) | [[persona-a-servico-intelectual]] | dev/consultor, alta familiaridade digital, canal Google Search + indicação | 🟢 fechada |
| **B — "Construindo"** (35-50a, serviço estético/manual) | [[persona-b-servico-estetico]] | transição MEI→ME por teto de faturamento, canal Instagram (83% do setor) | 🟢 fechada |
| **C — "Precisa de mão na mão"** (50+a, baixa familiaridade digital) | [[persona-c-baixa-familiaridade-digital]] | seed = fixture `cida`, 24,5% do universo nacional (bracket estrutural, não marginal) | 🟢 fechada |
| **D — "MEI de vida toda"** (qualquer idade, MEI permanente por escolha) | [[persona-d-mei-puro-permanente]] | não é transição, é modelo de vida — nunca pretende virar ME | 🟡 criada por decisão direta (Pedro, 26/08), **não** pelos 3 critérios de governança abaixo (volume real ainda não veio do V0) — exceção deliberada, registrada como tal |
| **E — "Começa Certo"** (22-31a, formaliza cedo, sem CLT antes) | [[persona-e-jovem-cnpj]] | nunca passou pela CLT, entra PJ direto na entrada de carreira | 🔴 **2ª exceção de governança** — nasceu volante (`a4-jovem-cnpj-servico-intelectual`, sob a Persona A) e foi **promovida a dorsal** por pedido direto do Pedro no mesmo dia. Contraria o dado agregado (idade média 40,8a, `perfil-microempreendedor-mercado.md`) — confiança mais baixa que a Dorsal D, que ao menos não contradiz um dado explícito |

Seeds de QA que alimentaram as dorsais: `reta`/`reta-direto` (dev freelancer) → Persona A · `cida` (61a, professora) → Persona C. **Migrante insatisfeito** (flow #2, quem já tem CNPJ e troca de contador) não virou dorsal própria — é **contexto/ocasião** que cruza as dorsais na matriz mestre abaixo, não um segmento demográfico à parte. Isso agora também é pilar de conteúdo dedicado (`estrategia-organica.md` pilar 10, "Migração/troca de contador", 🆕 26/08).

### Doutrina de enriquecimento — personas como "vivas", não só perfil de mkt (🆕 26/08)

Pedro: quer que as personas sejam tratadas como vivas, não só ferramenta de segmentação — mesmo objetivo do `personagem-leo.md`, sem virarem o Léo. Primeira frente aberta: **banco de calibragem antes/depois** (mesmo formato do `personagem-leo.md` §9), sendo adicionado **dentro do arquivo de cada DORSAL** (não aqui, não no doc de tracking) — `persona-a/b/c/d/e`, já feito nas 5. **Volantes herdam o banco de calibragem da mãe** (mesma lógica de herança do dial de ironia abaixo) — não duplicam banco próprio, só ajustam o gatilho específico já documentado em cada arquivo de volante. Próximas frentes (ordem sugerida, ainda não feitas): mapeamento de pilar com razão, reação a crítica/ataque, referência visual fixa — trabalho contínuo, persona por persona.

### Doutrina do dial de ironia por volante (🆕 26/08)

**Antes:** volante herdava 100% o registro/dial da dorsal-mãe, sem ajuste. Pedro classificou isso como "um limitador monstruoso" (26/08). **Agora:** o dial de ironia da dorsal-mãe é PONTO DE PARTIDA, ajustável por volante quando o gatilho específico for agudo/ansioso — mesma doutrina já aplicada ao Léo (`personagem-leo.md` §5, "não trava, é sugestão de encaixe"). Exemplo prático: `a1-dev-freelancer-recem-clt` herda dial alto da Persona A, mas o gatilho dela (prazo de contrato apertado, ansiedade aguda) pede dial mais baixo que o padrão da dorsal — ansiedade aguda não combina com piada, mesmo em quem normalmente aguenta ironia.

### Volantes (recortes de campanha, 05/08; +12 criadas 26/08; 2 removidas + 1 simplificada + 1 promovida a dorsal 26/08 — 18 no total)

18 volantes em `pesquisa/personas/volantes/`, cada uma herdando a espinha de uma dorsal e ajustando gatilho/mensagem/canal/objeção/dial (ver doutrina acima). Nenhuma é dorsal. **`a4-jovem-cnpj-servico-intelectual` saiu desta lista — foi promovida a Dorsal E** (ver Camada 1 acima), arquivo antigo deletado.

**Validação final de Pedro (26/08):** **todas as 19 volantes restantes aprovadas pra uso** (ainda sem pesquisa de mercado dedicada — a aprovação é de uso estratégico, não vira dado validado do dia pra noite). 2 volantes **removidas** e 1 **simplificada**, a partir da auditoria de CNAE feita nesta mesma rodada:

- **`b4-nutricionista-pj` — REMOVIDA.** Era regulamentada (conselho CRN), fora do V1 de serviço-liso — Pedro decidiu cortar em vez de manter como gap.
- **`c2-artesao-formalizando` — REMOVIDA.** Era ambíguo comércio×serviço (depende de vender peça pronta ou fazer sob encomenda) — Pedro decidiu cortar em vez de desambiguar.
- **`a3-designer-recebe-exterior` — SIMPLIFICADA pra `a3-designer`.** O ângulo de recebimento internacional virava gap de produto sem solução clara; Pedro pediu pra trocar por uma versão genérica de designer freelancer, mesmo CNAE, sem esse ângulo específico. Arquivo renomeado.

**Achado da auditoria que NÃO gerou remoção** (Pedro manteve, "restante todos aprovados"): `b3-personal-trainer` tem a mesma categoria de gap que a `b4` removida (regulamentada, conselho CREF, tier "tato") — mantida aprovada mesmo assim, registrado aqui pra não fingir que o gap sumiu sozinho. `b2-esteticista` é serviço real, tier "verificar-licenciamento" (alvará municipal, não conselho) — não é comércio, aprovada.

| Volante | Dorsal-mãe | Gatilho específico | CNAE de referência | Status |
|---|---|---|---|---|
| [[a1-dev-freelancer-recem-clt]] | A | contrato PJ na mão, prazo curto pra formalizar | 6201-5/01, 6202-3/00, 6204-0/00 | 🟢 aprovada |
| [[a2-consultor-senior-migrando]] | A | contador atual falhou, veio via flow migrar | 7020-4/00 | 🟢 aprovada |
| [[a3-designer]] | A | portfólio cresceu, cliente maior exige CNPJ | 6201-5/02, 7410-2/03 | 🟢 aprovada (simplificada) |
| [[a5-fotografo-eventos]] | A | contratado pra evento único, precisa nota rápida | 7420-0/04 (filmagem de festas e eventos) | 🟢 aprovada |
| [[a6-tradutor-freelancer]] | A | clientes internacionais via plataforma | 7490-1/01 (tradução/interpretação) | 🟢 aprovada |
| [[a7-dublador-locutor]] | A | job avulso, estúdio exige CNPJ pra fechar contrato | 5912-0/01 (dublagem) | 🟢 aprovada |
| [[a8-professora-idiomas-online]] | A | aula 100% online, plataforma exige CNPJ pro repasse | 8593-7/00 (ensino de idiomas) | 🟢 aprovada |
| [[b1-cabeleireira]] | B | teto do MEI / precisa contratar | 9602-5/01 | 🟢 aprovada |
| [[b2-esteticista]] | B | parceria B2B exige nota formal | 9602-5/02 — tier verificar-licenciamento | 🟢 aprovada |
| [[b3-personal-trainer]] | B | academia exige CNPJ pra contratar | 9313-1/00 — regulamentada CREF, tier tato | 🟢 aprovada |
| [[b5-produtor-eventos]] | B | organiza festas/feiras, cresce e contrata equipe temporária | 8230-0/01 (organização de feiras/festas) | 🟢 aprovada |
| [[b6-professora-danca-estudio]] | B | estúdio de dança cresceu, bateu teto do MEI | 8592-9/01 (ensino de dança) | 🟢 aprovada |
| [[c1-professor-autonomo-aposentado]] | C | aluno/escola pede nota fiscal | 8599-6/04 (aproximado) | 🟢 aprovada |
| [[c3-mecanico-oficina]] | C | oficina de bairro, cliente pede nota, baixa familiaridade digital | 4520-0/01 (manutenção mecânica de veículos) | 🟢 aprovada |
| [[c4-tecnico-conserto-eletronicos]] | C | conserta celular/eletrônico de bairro | 9521-5/00 (reparação de eletroeletrônicos) | 🟢 aprovada |
| [[d1-chaveiro]] | D | MEI de vida toda, ticket baixo, nunca pretende crescer | 9529-1/02 (chaveiros) | 🟢 aprovada |
| [[d2-sapateiro-reparo-calcados]] | D | mesma lógica de permanência, conserto de calçados/bolsas | 9529-1/01 | 🟢 aprovada |
| [[d3-teleatendente-freelancer]] | D | atende de casa, bico recorrente, baixo ticket | 8220-2/00 (teleatendimento) | 🟢 aprovada |

Fonte das 11 volantes de reparo/eventos/administrativo: `pesquisa/cnae-matriz/cnae-liso-servico.md` (103 CNAEs "liso" confirmados) — mineradas das seções J/M/N/P/R/S ainda não usadas em nenhuma persona.

**Enriquecimento com pesquisa real (26/08) 🆕:** as 18 volantes ganharam seção "Pesquisa real (Google Search, 26/08)" dentro do próprio arquivo, com dado de idade/gênero/renda/canal/reclamação/vocabulário/ambiente citado com fonte (Sebrae/RAIS, ABRATES, ABEOC, Sindirepa-MG, CREF, Contabilizei etc.). Fonte-mãe: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (pesquisa Google Search grounding rodada pelo Pedro, prompt em `pesquisa/prompt-pesquisa-volantes-google-search.md`). Continua sem validação de campo direta do Pedro — status geral rebaixado pra 🟡 "hipótese enriquecida com pesquisa real" nas fichas individuais (aprovação de USO de 26/08 permanece valendo, é uso estratégico ≠ dado validado). Achados que corrigem suposição anterior: gênero antes não travado ou genérico em vários volantes agora veio **fortemente definido por fonte real** — ex. `b1-cabeleireira` 83,7% feminino, `d1-chaveiro` 74,5% masculino, `c3-mecanico-oficina` esmagadora maioria masculina, `d3-teleatendente-freelancer` e `a8-professora-idiomas-online` predominantemente femininas. Detalhe completo em cada `.md` individual, não duplicado aqui.

## Camada 3 — Matriz mestre

| Ocasião/contexto | Persona principal | Oferta | Mensagem-âncora | Canal prioritário |
|---|---|---|---|---|
| Virando PJ pela 1ª vez (atividade intelectual vedada ao MEI) | A — Direto | ME | "Resolve rápido, sem enrolação, sem pagar imposto a mais" | Google Search alta intenção |
| Batendo no teto do MEI, precisa virar ME | B — Construindo | ME (transição) | "Cresça sem perder o atendimento pessoal" | Instagram + indicação |
| Formalizando por exigência externa, insegura com tecnologia | C — Precisa de mão na mão | MEI/ME simples | "A gente explica cada passo, sem pressa" | WhatsApp/indicação familiar |
| Já tem CNPJ, contador atual falhou (qualquer das dorsais) | A, B, C ou D via flow migrar | ME (via flow migrar) | "Troque sem dor de cabeça, sem perder nada" | indicação + Google Search |
| MEI que nunca pretende virar ME, simplicidade é a escolha | D — MEI de vida toda | MEI | "Simples de verdade, sem crescer virar dor de cabeça" | WhatsApp/indicação |
| Jovem formalizando cedo, sem passar por CLT longa | E — Começa Certo | ME | "Já começa certo, sem passar pelo aperto que todo mundo passa depois" | Instagram/comunidades tech |

> **Lacuna fechada 26/08:** o perfil **MEI puro que nunca vai virar ME** virou Dorsal D (`persona-d-mei-puro-permanente.md`), decisão direta do Pedro ("é importantíssima"), antecipando o gatilho de dado real do V0 que a governança original pedia — exceção deliberada, não é violação silenciosa da regra (ver nota na Camada 1).

## Tom de voz por dorsal (herda o arquétipo, não troca de personalidade)

> 🆕 06/08 — achado do Pedro: o arquétipo de marca (**Aliado leve/vitorioso** + **Parceiro de confiança**, [[posicionamento]] §Arquétipos) nunca tinha sido citado aqui, apesar das mensagens-âncora da matriz acima já seguirem ele por instinto. Registrado agora pra virar critério checável, não sorte.
>
> Mesma doutrina do produto (UX-48, `trilha-unica-ux48`): **densidade/registro muda por dorsal, a marca nunca muda quem é**. Nenhuma dorsal recebe um arquétipo diferente — todas ouvem o mesmo Aliado, só em registro diferente:

| Dorsal | Registro (mesmo Aliado, volume diferente) | Prova já na matriz/persona |
|---|---|---|
| **A — Direto** | Eficiente, sem enrolação — o aliado que anda rápido porque sabe que ela já sabe o que faz | "Resolve rápido, sem enrolação, sem pagar imposto a mais" (mensagem-âncora acima); tom "direto, sem jargão contábil" já descrito em [[persona-a-servico-intelectual]] |
| **B — Construindo** | Parceria/crescimento — o aliado que comemora ela crescer, não trata como upsell | "Cresça sem perder o atendimento pessoal"; "tom acolhedor sem infantilizar" já descrito em [[persona-b-servico-estetico]] |
| **C — Precisa de mão na mão** | Paciência reforçada — o mesmo aliado, dose mais alta de "eu fico do seu lado" | "A gente explica cada passo, sem pressa"; objeção principal já é literalmente medo de ficar sem aliado ("vou travar sozinha") |

**Regra de checagem:** copy nova pra qualquer dorsal responde "isso soa Sábio distante (contabilês, autoridade fria) ou Aliado (resolve, cuida, fala de igual pra igual)?" antes de publicar. Se soar Sábio distante, reescreve — é exatamente o espaço que a Contabilizei ocupa (ver [[posicionamento]] Categoria mental).

## Quem NÃO é público (anti-persona)

- **Comércio inteiro — nenhum, nem o leve.** Varejo, loja, revenda, qualquer atividade de mercadoria fica fora do V1 (decisão 15/07, [[cnae-comercio-standby]]). Não é só "comércio pesado". Saída = contato especial → Legalize Digital tradicional.
- Empresas fora do nicho serviço/Simples (indústria, construção, transporte, agro, Lucro Real) — fora do escopo fiscal do produto
- Lucro Presumido — bloqueado no fluxo (`/saida/regime-nao-suportado`), motor fiscal diferente, sem pesquisa dedicada ainda
- Comprador só-preço sem fit de valor — quem quer o Contaja de R$137 com à la carte, não o "preço fechado" do Legalizai

## JTBD consolidado (hipótese, a validar)

> *"Quando estou com medo de errar com o fisco e pagar imposto a mais, quero uma contabilidade que fale a minha língua e resolva o chato sem eu precisar entender de contabilidade, pra eu poder tocar meu negócio em paz."*

Fonte: `marca/conceito/conceito-marca.md` §2-3 (propósito + "pra quem").

## Cross-refs

- Arquétipo/tom-base: [[posicionamento]] §Arquétipos de marca
- Pilares orgânicos: [[estrategia-organica]] · [[mecanicas-engajamento]]
- Estrutura de tráfego: [[estrutura-funil-trafego]] · [[frente-1-captacao-meta-bh]]
- Economia: [[economia-preco-cac]]
- Fixtures de QA (seed, não substituto): `execucao/motor-testes/personas/*.json`
