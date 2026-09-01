

<!-- ============================================================ -->
# ARQUIVO: 02-personas/00-metodologia-personas-FONTE-UNICA.md
<!-- ============================================================ -->

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


<!-- ============================================================ -->
# ARQUIVO: 02-personas/persona-a-servico-intelectual.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-05
assunto: persona-a
tags: [pesquisa, personas, marketing]
---

# Persona A — "Direto", 32-42 anos · "o freelancer que virou PJ"

> *"Já sei o que eu faço, só preciso que a burocracia não me atrase."*

| Dimensão | Valor | Fonte/Conf. |
|---|---|---|
| Idade | 32-42 (dentro do bracket dominante nacional 30-39, 29,9%) | IBGE — [[perfil-microempreendedor-mercado]] 🟢 |
| Renda | acima da média MEI (R$5.542/mês); serviço intelectual puxa faixa alta | Sebrae, estimativa 🟡 |
| Local | BH/MG (geo do MLP) | decisão de produto 🟢 |
| Canal principal | Google Search (alta intenção, "abrir empresa PJ", "contador pra dev") + indicação de outros freelancers | [[perfil-microempreendedor-mercado]] §2/§4 🟡 |
| Oferta provável | ME (Anexo III/V, muitas dessas atividades são vedadas ao MEI por natureza intelectual) | [[perfil-microempreendedor-mercado]] §3 🟢 |
| % volume / receita | hipótese 35-40% do volume — validar com dado real do V0 | 🔴 hipótese |
| Volume esperado | alto — segmento em crescimento (pejotização de serviço intelectual) | Sebrae 🟡 |

## Negócio

- **LTV-hipótese:** alta — uma vez satisfeito, baixa propensão a trocar de novo (atrito de troca é psicológico, não técnico); forte propensão a indicar dentro de círculos de freelancers/devs
- **Gatilho de recompra:** não aplicável (é assinatura contínua) — gatilho de upsell é crescimento de faturamento (Fator R, transição MEI→ME)
- **Indicação:** alto — comunidades de freelancers/devs são coesas, boca-a-boca digital forte ([[perfil-microempreendedor-mercado]] §4)

## Ads (canal pago)

- **Interesses-semente:** freelancer, trabalho remoto, PJ, ferramentas de produtividade, comunidades de dev/design/consultoria
- **Lookalike-semente:** base de clientes ME intelectual assim que houver volume
- **Gatilho-momento:** no momento de virar PJ pela 1ª vez (não pode ser MEI, atividade intelectual vedada) OU quando o contador atual não entende a dinâmica de freelancer digital
- **Exclusões:** quem já tem contabilidade satisfatória e não está em momento de troca; CLT sem intenção de abrir empresa

## Orgânico (pilares afins)

Educativo (Fator R, "quanto você tá pagando a mais"), utilidade prática (simulador aberto), bastidor de produto (mostrar que quem constrói entende de tech) — pendente de [[metodologia-descoberta]] orgânica

## Criativo / visual

Sem persona/avatar fixo definido ainda — tom direto, sem jargão contábil, referência visual = interface do próprio app (screenshot honesto > stock photo)

## Tom de voz (como a MARCA/Léo fala COM ela — calibração, não voz dela)

Herda o arquétipo **Aliado/Parceiro de confiança** ([[posicionamento]] §Arquétipos) — não muda de personalidade, só de registro: **eficiente, sem enrolação**, porque ela já sabe o que faz e só quer que a burocracia não atrase (ver citação no topo). Fala de igual pra igual (é parceira técnica, não aluna): prova competência (Fator R, Anexo certo) na cara, nunca esconde atrás de "fale com um especialista" — isso soaria Sábio distante, o espaço que a Contabilizei ocupa. Detalhe completo: [[metodologia-personas]] §Tom de voz por dorsal.

## Voz própria — como ELA fala 🆕 (26/08)

> ⚠️ Distinção importante (correção do Pedro, 26/08): a seção acima é o tom da EMPRESA/Léo calibrado pra ela. Esta aqui é a voz DELA MESMA — como fala, escreve, comenta, independente da marca. A empresa responde no tom dela, mas o tom dela existe por si.

- **Registro:** direto, frases curtas, sem enrolação — inclusive fora do trabalho. Usa termo técnico/gíria de tech mesmo em contexto pessoal ("isso não escala", "bug no sistema", "workaround").
- **Escrita:** informal mas precisa — abrevia (vc, pq, tb) sem exagerar em emoji; pontuação funcional, não decorativa.
- **O que ela realmente diria/digitaria:** "Isso funciona ou não funciona, me fala logo." · "Já testei X e Y, não rolou. O que vocês fazem diferente?" · "Manda a documentação que eu leio."
- **Tom emocional:** contido — raramente mostra frustração explícita; quando mostra, é seca e cortante, nunca dramática ou longa.

## Objeção principal

**"Contabilidade online não vai entender minha operação (freelas variados, clientes internacionais, etc)"** → contorno: mostrar profundidade fiscal real (Fator R, Anexo correto) na cara, não escondida atrás de "fale com especialista"

### Objeções secundárias 🆕 (26/08)

1. **"E se eu precisar trocar de Anexo no meio do ano, o sistema percebe sozinho ou eu descubro só na declaração?"** — medo de erro silencioso/falta de proatividade do sistema.
2. **"Automatizado é sinônimo de robô — se travar, tem humano que entende de tech, ou só um script respondendo?"** — ceticismo típico de dev sobre "automação" vendida como mágica.
3. **"Já testei apps de contabilidade que prometem muito e entregam pouco — o que muda aqui de verdade?"** — fadiga de ferramenta genérica de SaaS.
4. **"Recebo de fontes variadas (cliente PJ, plataforma internacional) — o app rastreia tudo isso certo?"** — complexidade real de fluxo de caixa múltiplo.
5. **"Se eu crescer rápido e precisar trocar de Anexo/regime, tem custo escondido pra essa transição?"** — medo de custo de transição não anunciado.

## Jornada

1. Decide virar PJ (evento: primeiro contrato grande, ou saída de CLT) ou fica insatisfeito com contador atual
2. Pesquisa no Google ("abrir empresa PJ dev", "MEI vs ME") ou pergunta em comunidade/grupo
3. Compara 2-3 opções — decide por transparência de preço + prova de competência técnica
4. Assina, self-service até onde der, humano quando precisar
5. Vira fonte de indicação se a experiência for boa

## Jobs absorvidos

Não quer "aprender contabilidade" — quer terceirizar completamente e ter certeza de que não está pagando imposto a mais (Fator R é a dor concreta mais citada, ver [[legalize-cobaia-cnpj-pedro]])

## Banco de calibragem antes/depois 🆕 (26/08, v2 enriquecido — 1 par por pilar relevante)

> Mesmo espírito do `personagem-leo.md` §9 — calibragem de registro, não fórmula de substituição mecânica. Organizado por pilar de conteúdo (`estrategia-organica.md` §Camada 1, numeração v3) pra cobrir alcance real, não só situações soltas.

| Pilar | Situação | Genérico (sem persona) | Versão Persona A | Por que funciona |
|---|---|---|---|---|
| 2 — Cultural/leve | Confusão MEI×conceito de "empresa" | "Sabia que muita gente confunde MEI com ME?" | "MEI virou sinônimo de 'ter empresa', só que não é. Isso já devia estar na primeira aula de 'como virar PJ'." | Prova um ponto de forma leve, mira a falta de educação do setor, não a pessoa. |
| 4 — Dor educativa | MEI × ME | "MEI e ME têm regras tributárias diferentes, é importante entender qual se aplica ao seu caso." | "Sua atividade intelectual não pode ser MEI, ponto final. ME, Anexo certo, resolvido." | Direto, sem rodeio — responde a pergunta que ela faria antes dela precisar perguntar. |
| 5 — Mitos | "MEI é sempre mais barato/melhor pra começar" | "Existe um mito de que MEI paga menos imposto sempre." | "MEI não é sempre mais barato. Pra atividade intelectual, MEI nem é opção legal — o mito de 'todo mundo começa MEI' te atrasa, não te protege." | Desmonta crença específica que essa audiência (freelancer/dev) ouve o tempo todo. |
| 6 — Calendário fiscal | Prazo do DAS | "Não esqueça de pagar o DAS até o dia 20." | "DAS vence dia 20. Já calculei, já separei, você só recebe a confirmação. Sem planilha, sem lembrete de calendário." | Fala com quem já automatiza tudo (dev) — oferece automação real como linguagem nativa. |
| 7 — Educação fiscal/enquadramento | Fator R | "O Fator R pode reduzir sua alíquota de imposto." | "Fator R errado é dinheiro saindo do seu bolso sem aviso nenhum. A gente calcula certo todo mês, não só na abertura." | Prova competência técnica na cara — nunca esconde atrás de 'fale com um especialista'. |
| 8 — Diferencial | Preço | "Nosso plano tem o melhor custo-benefício do mercado." | "R$139, sem 'a partir de'. Você já deve ter visto esse tipo de letra miúda por aí, aqui não tem." | Fala de igual pra igual — assume que ela já pesquisou concorrência, não explica o óbvio. |
| 10 — Oferta | Fidelidade/cancelamento | "Assine agora e comece a usar." | "Sem fidelidade-surpresa. Cancela quando quiser, sem multa escondida no contrato." | Responde à objeção de quem já foi pego de surpresa em contrato de SaaS/serviço antes. |
| 11 — Migração | Troca de contador | "Troque de contador facilmente conosco." | "Seu contador atual te deixou no vácuo? Eu trago seus dados pra cá sem você perder histórico nenhum." | Nomeia a dor concreta ("vácuo") que essa persona relata sobre contador tradicional. |
| 12 — Gestão do dinheiro do dono | Pró-labore | "Calcule seu pró-labore facilmente pelo app." | "Pró-labore certo, calculado automático. Você não precisa saber a fórmula, só ver o número certo todo mês." | Mesma lógica do Fator R — automação como valor central pra persona técnica. |
| 13 — Documentação em dia | CND/certidões | "Mantenha sua empresa em dia com a documentação." | "CND vencida trava até proposta de cliente grande. Eu confiro isso toda semana, você só recebe alerta se faltar algo." | Liga direto a uma consequência prática que ela se importa (perder contrato). |
| — Onboarding (transversal) | Cadastro inicial | "Preencha o formulário abaixo para começar." | "3 perguntas. Dá pra preencher entre um commit e outro." | Fala a língua do dia a dia dela sem forçar gíria. |

## Mapeamento de pilar — onde ela se conecta 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §11 — não é regra travada, é encaixe natural. Numeração de pilar v3 (`estrategia-organica.md`).

| # | Pilar | Encaixe | Por quê |
|---|---|---|---|
| 1 | Bastidor fundador | 🟡 Médio | Se identifica com "quem constrói", mas não é gancho principal — ela quer resultado, não a jornada de outro fundador |
| 2 | Cultural/leve | 🟢 Forte | Capta ironia rápido, gosta de acerto técnico com humor |
| 3 | Nossa origem | 🟡 Médio | Soma como prova de solidez, mas ela busca eficiência antes de tradição |
| 4 | Dor educativa | 🟢 Forte | Quer entender o "porquê" técnico, gosta de ver profundidade exposta |
| 5 | Mitos/crenças erradas | 🟢 Forte | Perfil analítico responde bem a correção técnica precisa |
| 6 | Calendário fiscal | 🟡 Médio | Já é organizada — prazo gera menos ansiedade nela que nas outras dorsais |
| 7 | Educação fiscal/enquadramento | 🟢 Forte | Fator R é a dor concreta mais citada por esta persona ([[legalize-cobaia-cnpj-pedro]]) |
| 8 | Diferencial vs mercado | 🟢 Forte | Pesquisa e compara ativamente, quer dado concreto na cara |
| 9 | Bastidor/processo | 🟡 Médio | Prova tangencial — ela confia mais em profundidade fiscal exposta (pilar 7) que em ver o processo |
| 10 | Oferta/conversão | 🟡 Médio | Responde bem a oferta clara, mas é decisão racional, não gancho emocional |
| 11 | Migração/troca de contador | 🟢 Forte | Gatilho documentado do volante `a2` — contador atual falhou é dor real desta dorsal |
| 12 | Gestão do dinheiro do dono | 🟢 Forte | Automação/número certo fala direto com o perfil técnico |
| 13 | Documentação em dia | 🟡 Médio | Relevante, mas ela confia que "resolve" sem precisar de reforço emocional |
| 14 | Prova/reação (standby) | 🟡 Médio | Ajuda na comparação racional quando reativado |
| 15 | Participativo (standby) | 🟡 Médio | Comunidades de freelancer são coesas, mas não é prioridade |
| Momentâneo | Lançamento/promoção | 🟢 Forte | Early-adopter, gosta de novidade/vaga fundador |

## Reação a crítica/ataque 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §10 — calibra como a marca responde quando o comentário vem de alguém com este perfil. Regra geral do Léo continua valendo (medo real → vigilante entra, ironia sai); aqui é o ajuste fino por persona.

| Tipo de comentário | Marca NÃO faz (pra este perfil) | Marca faz |
|---|---|---|
| "Isso é golpe, vão sumir com meu dinheiro" | Tratar com condescendência ou ficar só na prova fria | Prova concreta e direta (CNPJ, CRC, contrato) sem alongar — ela quer fato, não acalento longo |
| "Vocês vão entender minha operação (freela com cliente internacional, etc)?" | Resposta genérica tipo "sim, atendemos todo tipo de empresa" | Mostra profundidade técnica real (Fator R, Anexo, caso específico) na resposta pública — prova competência ali mesmo |
| "Não serve pro meu caso" (ex: Lucro Presumido) | Empurrar venda ou inventar que serve | Confirma o limite com transparência técnica, sem rodeio |
| Troll/hate sem argumento | Entrar em debate longo ou ironizar de volta com deboche | Resposta curta, direta, sem se abaixar ao nível — eficiência até na moderação |
| Crítica de concorrente disfarçada | Citar concorrente por nome | Fala do problema genérico do mercado com dado concreto, nunca nome |

## Referência visual fixa 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §12. Segue o brief de humano-IA travado (`decisoes-marca.md` 26/08, item 10): fotorrealista, diversidade ampla (idade 18+, tom de pele, gênero), etnia travada em características brasileiras (sudeste). Prompt otimizado pra teste no nano banana (Gemini image) — gere, compare com a tabela abaixo, valide se casa.

| Atributo | Definição |
|---|---|
| Idade aparente | 30-42 anos |
| Vestuário | Casual-tech: camiseta lisa boa ou moletom leve, nunca traje formal/terno |
| Ambiente | Home office ou coworking — notebook aberto com código ou dashboard financeiro, mesa organizada |
| Expressão | Confiante, focada, leve satisfação de quem já resolveu o problema |
| Diversidade dentro da dorsal | Gênero e tom de pele variam livremente; etnia brasileira, sudeste |

**Prompt (nano banana / Gemini image):**
```
Photorealistic medium shot of a Brazilian tech professional (any gender), early-to-mid 30s,
Southeast Brazilian features, sitting at a home office desk with a laptop showing code or a
financial dashboard. Casual smart-casual outfit (plain t-shirt or light sweater, no suit),
confident and relaxed expression, natural window light, shallow depth of field, subtle coral
(#F2643C) accent object in frame (mug, notebook cover). Warm but neutral color grade, no drop
shadows, clean flat lighting, photorealistic. 4:5 vertical aspect ratio. No text, no captions,
no logos, no watermarks.
```

## Pesquisa real agregada (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads, pesquisa Google Search grounding) — GRUPO A (Serviço Intelectual e Criativo), síntese dos 7 volantes que compõem esta dorsal (`a1` a `a8`, exceto `a4`/promovida a Dorsal E).

| Critério | Dado agregado real | Nota |
|---|---|---|
| Idade real | Faixa bem mais larga do que o número único sugere: 20-35 (designer), 22-45 (fotógrafo), 25-35 (dev), 25-45 (dublador), 25-50 (professora idiomas), 30-50+ (tradutor), 40-60 (consultor sênior) | A tabela desta persona trava 32-42 (bracket dominante IBGE) — real é que o "centro de massa" bate, mas a dispersão por sub-nicho é maior do que uma dorsal única implica |
| Gênero | NÃO homogêneo — masculino forte em dev e consultor sênior; equilibrado em designer e dublador; feminino forte em tradutor (ABRATES) e professora de idiomas | Diferente de B/C/D, esta dorsal não tem um gênero predominante único — varia por sub-nicho, o que já está refletido em cada volante individual |
| Renda real | R$3.000 (designer início) a R$40.000+ (consultor sênior); dev remoto pro exterior passa de R$25.000; câmbio (dólar/euro) eleva renda de tradutor/dev exportador | Confirma o "acima da média MEI" já travado na tabela, mas mostra que a variância interna é enorme — não é uma faixa estreita |
| Canais reais | LinkedIn é o único canal universal do grupo (B2B/networking); resto é hiperfragmentado por nicho: GitHub/Discord (dev), Behance/Dribbble (designer), ProZ (tradutor), Voice123/Bodalgo (dublador), Instagram/TikTok (professora idiomas) | WhatsApp aparece em todos como canal operacional, mesmo quando não é canal de captação |
| Reclamação real documentada (agregada) | **Fator R é a dor estrutural nº1 do grupo inteiro** — confirmada nos 7 sub-perfis, sempre em torno de "pró-labore mínimo de 28% pra não cair no Anexo V (15,5%)". Segunda dor recorrente: exportação de serviço (isenção de ISS, *invoices*, comprovação via *swift* bancário) mal compreendida por contador genérico | Bate direto com o que já era hipótese desta persona (`## Jobs absorvidos` acima) — agora com fonte cruzada em 7 profissões distintas, não só 1 |
| Vocabulário real | Nenhum vocabulário comum entre sub-nichos (deploy/commit ≠ briefing/mockup ≠ source/target) — o que é comum é o registro (técnico, específico, sem generalidade) | Confirma a "Voz própria" já registrada (direta, gíria técnica) como padrão do grupo, não só do volante `a1` |
| Ambiente real | *Home office* ergonômico de alto investimento é o padrão transversal do grupo inteiro (múltiplos monitores, cadeiras/mesas, isolamento acústico), mesmo quando o nicho específico varia | Alinhado à referência visual já travada acima |

**Achado que reforça a tese central da dorsal** (Conclusão Macro-Sistêmica #1 do relatório): *"O contador da próxima década deixará de ser um 'emissor de guias DARF' para transformar-se em um estrategista focado em assegurar a permanência de seus clientes nos anexos tributários mais econômicos (Anexo III)."* — isso é praticamente a tese de posicionamento da Legalizaí pra esta dorsal, agora com fonte externa.

## Cross-refs

- Voz/arquétipo: [[posicionamento]] §Arquétipos · [[personagem-leo]] §5 (dial de ironia alto pra esta dorsal)
- Sistema de personas: [[metodologia-personas]]


<!-- ============================================================ -->
# ARQUIVO: 02-personas/persona-b-servico-estetico.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-05
assunto: persona-b
tags: [pesquisa, personas, marketing]
---

# Persona B — "Construindo", 35-50 anos · "a profissional de serviço que cresceu do MEI"

> *"Cresci demais pro MEI, mas não quero perder o jeito pessoal que sempre tive com meus clientes."*

| Dimensão | Valor | Fonte/Conf. |
|---|---|---|
| Idade | 35-50 (bracket 40-49 = 25,5% + parte do 50+ 24,5% nacional) | IBGE — [[perfil-microempreendedor-mercado]] 🟢 |
| Renda | próxima à média MEI/ME (R$5.542/mês MEI; setor beleza tende à faixa mais baixa do espectro, mulheres faturam 19% menos controlado por CNAE) | Sebrae/BC — [[perfil-microempreendedor-mercado]] 🟡 |
| Local | BH/MG | decisão de produto 🟢 |
| Canal principal | **Instagram** (83% de presença no setor beleza, o maior de qualquer nicho mapeado) + WhatsApp Business pra venda | Sebrae — [[perfil-microempreendedor-mercado]] §2 🟢 |
| Oferta provável | MEI→ME na transição por desenquadramento (teto R$81k/ano) | [[perfil-microempreendedor-mercado]] §3 🟢 |
| % volume / receita | hipótese 30-35% do volume — beleza sozinha é 9% de todos os MEIs do Brasil (~1,3mi) | Sebrae, estimativa nacional 🟡 |
| Volume esperado | alto e recorrente — setor com maior presença social e maior necessidade de transição MEI→ME por sucesso do próprio negócio | 🟡 |

## Negócio

- **LTV-hipótese:** média-alta se o atendimento humano for real — esse segmento historicamente troca mais de fornecedor quando se sente "só mais um número"
- **Gatilho de recompra:** não aplicável (assinatura) — upsell natural é a própria transição MEI→ME (gatilho de crescimento do negócio)
- **Indicação:** alto potencial — comunidade de profissionais de beleza/estética é hiperconectada em grupos de WhatsApp/Instagram

## Ads (canal pago)

- **Interesses-semente:** salão de beleza, estética, empreendedorismo feminino, MEI, gestão de agenda/financeiro pra autônomos
- **Lookalike-semente:** base de clientes MEI→ME transição
- **Gatilho-momento:** próximo do teto MEI (R$81k/ano ≈ R$6.750/mês) — sinal de alto valor de intenção, worth priorizar segmentação por proximidade do teto quando houver dado
- **Exclusões:** MEI muito abaixo do teto sem sinal de crescimento (baixa urgência)

## Orgânico (pilares afins)

Prova social/depoimento (peso alto pro nicho — decisão de compra por confiança visual), pilar "momento de virar ME" (educativo direto), formato Reels/Stories (onde 83% desse público está)

## Criativo / visual

Imagem humana real (evitar stock corporativo — acerto da Facilite identificado em [[matriz-comparativa]]), tom acolhedor sem infantilizar

## Tom de voz (como a MARCA/Léo fala COM ela — calibração, não voz dela)

Herda o arquétipo **Aliado/Parceiro de confiança** ([[posicionamento]] §Arquétipos) — registro de **parceria/crescimento**: comemora ela crescer (transição MEI→ME), nunca trata isso como upsell empurrado. Acolhedor sem infantilizar (a objeção dela é virar "só mais um número" — o oposto de acolhedor-de-cima). Detalhe completo: [[metodologia-personas]] §Tom de voz por dorsal.

## Voz própria — como ELA fala 🆕 (26/08)

> ⚠️ Distinção do Pedro (26/08): isto é a voz DELA, independente da marca — a seção acima é como a empresa calibra a fala PRA ela.

- **Registro:** caloroso, conversa como entre colegas de profissão/amigas — compartilha sentimento junto com a pergunta prática.
- **Escrita:** usa emojis com frequência (♥️, 🙏, ✨), exclamações, reticências pra suavizar incerteza ("então... eu não sei se..."), "gente" como interjeição comum.
- **O que ela realmente diria/digitaria:** "Gente, será que dá certo pra mim? Tô com medo de mudar e dar errado 😥" · "Amei o atendimento, super atenciosa a menina que me atendeu!" · "Alguém já usou? Conta como foi 🙏"
- **Tom emocional:** expressivo — mistura dúvida prática com sentimento genuíno, não separa as duas coisas.

## Objeção principal

**"Vou virar só mais um número, vou perder o atendimento pessoal que sempre tive"** → contorno: humano no plano de entrada é resposta direta — não é upsell como nos concorrentes ([[insights-estrategicos]] achado nº1)

### Objeções secundárias 🆕 (26/08)

1. **"Já fui enganada por 'consultoria' que prometeu resolver tudo e sumiu — como sei que aqui é diferente?"** — desconfiança acumulada de experiência ruim anterior.
2. **"Meu movimento varia muito (alta e baixa temporada) — o sistema entende isso ou vai me cobrar igual sempre?"** — realidade de receita sazonal do setor.
3. **"Não tenho tempo de aprender app novo no meio da correria do salão — vou ter que 'estudar' pra usar isso?"** — baixa tolerância a fricção de onboarding.
4. **"Se eu contratar minha primeira funcionária, isso não vira uma bola de neve de burocracia que eu não dou conta?"** — medo de que crescer gere mais complexidade, não menos.
5. **"Todo mundo fala que ia ser 'humano' e depois vira central de atendimento robotizada — é isso que vai acontecer aqui também?"** — ceticismo específico sobre a promessa central do produto.

## Jornada

1. Bate no teto do MEI (faturamento se aproxima ou passa R$81k/ano) — dor concreta e datada (desenquadramento retroativo se passar 20%)
2. Descobre via Instagram/indicação de outra profissional que passou pelo mesmo
3. Pesquisa preço, mas decide por confiança (prova social, tom humano)
4. Assina via WhatsApp/app simples — baixa tolerância a formulário longo
5. Se bem atendida, indica dentro da própria comunidade profissional

## Jobs absorvidos

Não quer virar "empresária que entende de imposto" — quer continuar focada no cliente dela sem ser pega de surpresa pelo Simples/desenquadramento

## Banco de calibragem antes/depois 🆕 (26/08, v2 enriquecido — 1 par por pilar relevante)

> Mesmo espírito do `personagem-leo.md` §9. Organizado por pilar de conteúdo (`estrategia-organica.md` §Camada 1, numeração v3).

| Pilar | Situação | Genérico (sem persona) | Versão Persona B | Por que funciona |
|---|---|---|---|---|
| 2 — Cultural/leve | Preconceito de "isso é coisa de empresa grande" | "Você sabia que muitos negócios de beleza atrasam a formalização?" | "Salão que vive de boca a boca também precisa de CNPJ em dia — quem disse que só empresa 'grande' precisa se cuidar?" | Ironiza leve o preconceito, sem atacar quem atrasou por causa dele. |
| 4 — Dor educativa | Teto do MEI | "Você atingiu o limite de faturamento do MEI e precisa migrar para ME." | "Seu negócio cresceu, e isso é ótimo. Bora ajustar o CNPJ pra acompanhar, sem perder o jeito que você já tem com suas clientes." | Celebra o crescimento antes de tratar da burocracia — nunca trata a transição como problema. |
| 5 — Mitos | "Contratar é caro e complicado" | "Contratar funcionário é caro e trabalhoso." | "Contratar não precisa ser um parto. A folha a gente monta, você só avisa quem entrou — o mito de que é complicado é o que mais atrasa quem merece crescer." | Desmonta o mito que trava exatamente a decisão que gera o teto do MEI. |
| 6 — Calendário fiscal | Prazo do DAS | "Não esqueça de pagar o DAS." | "Enquanto você atende sua última cliente do dia, eu já separei o DAS do mês. Chega prontinho." | Vigilância que acontece no fundo, sem ela precisar parar o que faz. |
| 7 — Educação fiscal/enquadramento | Anexo com venda de produto | "Seu enquadramento tributário pode variar conforme o Anexo." | "Salão cai num Anexo, mas se você também vende produto, a conta muda. Eu confiro isso pra sua realidade, não pro CNAE genérico." | Reconhece a complexidade real do setor (serviço + venda) sem jargão. |
| 8 — Diferencial | Preço | "Nosso plano cabe no seu orçamento." | "Sei que você tá acostumada a pagar pouco (ou nada) por isso. Aqui o preço é fechado, e o que você ganha é nunca mais ficar no vácuo." | Reconhece a resistência de preço real da dorsal sem se desculpar por ela. |
| 10 — Oferta | Medo de reajuste | "Assine e comece agora." | "Sem letra miúda, sem mensalidade que sobe do nada mês que vem. O preço que combinamos hoje continua sendo o de amanhã." | Fala à desconfiança de contrato que ela já levou antes. |
| 11 — Migração | Contador que só cobra | "Troque de contador facilmente conosco." | "Se seu contador de hoje só liga pra cobrar e nunca pra ajudar, dá pra trocar sem perder nada do que você já construiu." | Nomeia a experiência ruim específica, ligada à objeção "vou virar número". |
| 12 — Gestão do dinheiro do dono | Pró-labore | "Calcule seu pró-labore facilmente pelo app." | "Seu pró-labore sai certo todo mês, sem você fazer conta no fim de semana que era pra ser seu descanso." | Reconhece a sobrecarga de quem cuida de tudo sozinha. |
| 13 — Documentação em dia | Alvará | "Mantenha sua empresa em dia com a documentação." | "Alvará vencido pode fechar seu salão numa fiscalização. Eu aviso antes disso virar problema." | Consequência concreta e temida (fechar o negócio físico). |
| — Onboarding (transversal) | Cadastro inicial | "Complete seu cadastro." | "Poucas perguntas, no seu tempo, entre um cliente e outro." | Reconhece a rotina corrida dela, sem pedir foco que ela não tem sobrando. |

## Mapeamento de pilar — onde ela se conecta 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §11 — não é regra travada, é encaixe natural. Numeração de pilar v3 (`estrategia-organica.md`).

| # | Pilar | Encaixe | Por quê |
|---|---|---|---|
| 1 | Bastidor fundador | ❌ Fraco | Se identifica mais com histórias de outras profissionais de beleza que com o fundador tech |
| 2 | Cultural/leve | 🟡 Médio | Aprecia leveza, mas responde mais a calor humano que a ironia técnica |
| 3 | Nossa origem | 🟢 Forte | "22 anos de experiência real" é prova de solidez que evita a sensação de "app frio" |
| 4 | Dor educativa | 🟢 Forte | Susto de imposto é gatilho real e recorrente no setor dela |
| 5 | Mitos/crenças erradas | 🟡 Médio | Funciona, mas ela responde mais a prova social que a correção técnica fria |
| 6 | Calendário fiscal | 🟢 Forte | Ocupada com clientes o dia todo — vigilância de prazo é alívio real |
| 7 | Educação fiscal/enquadramento | 🟡 Médio | Relevante (Anexo com venda de produto), mas não é hook primário |
| 8 | Diferencial vs mercado | 🟢 Forte | "Humano no plano de entrada" é literalmente a objeção central dela |
| 9 | Bastidor/processo | 🟢 Forte | Quer ver que tem gente de verdade — contraponto direto ao medo de "virar número" |
| 10 | Oferta/conversão | 🟡 Médio | Responde bem, mas com mais calor emocional que racionalidade |
| 11 | Migração/troca de contador | 🟢 Forte | "Contador que só cobra" é dor documentada nesta dorsal |
| 12 | Gestão do dinheiro do dono | 🟡 Médio | Relevante, mas secundário ao core dela (atendimento ao cliente) |
| 13 | Documentação em dia | 🟢 Forte | Alvará fechar o salão é medo concreto e alto |
| 14 | Prova/reação (standby) | 🟢 Forte | Setor de beleza decide muito por prova social/depoimento — canal mais forte pra esta dorsal quando reativado |
| 15 | Participativo (standby) | 🟡 Médio | Instagram é canal dela, mas não é prioridade de conteúdo |
| Momentâneo | Lançamento/promoção | 🟡 Médio | Menos early-adopter que A — decide por confiança/prova, não por novidade |

## Reação a crítica/ataque 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §10. Regra geral do Léo continua valendo (medo real → vigilante entra, ironia sai); aqui é o ajuste fino por persona.

| Tipo de comentário | Marca NÃO faz (pra este perfil) | Marca faz |
|---|---|---|
| "Isso é golpe, vão sumir com meu dinheiro" | Só mandar prova fria sem acolher o medo primeiro | Reconhece o medo ("entendo a preocupação, é seu dinheiro"), depois mostra prova — calor antes do fato |
| "Vou virar só mais um número" | Resposta corporativa genérica | Reafirma que tem gente de verdade, com nome, cuidando — sem soar script |
| "Não serve pro meu caso" | Empurrar venda mesmo assim | Confirma o limite com gentileza, oferece indicação se possível |
| Troll/hate sem argumento | Ignorar publicamente (ela lê isso como fragilidade da marca) | Resposta breve e educada, sem embarcar, mantendo o tom acolhedor mesmo com quem ataca |
| Crítica de concorrente disfarçada | Citar concorrente por nome | Fala do problema do mercado sem apontar, mantendo o clima de comunidade que ela valoriza |

## Referência visual fixa 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §12. Segue o brief de humano-IA travado (`decisoes-marca.md` 26/08, item 10): fotorrealista, diversidade ampla, etnia travada em características brasileiras (sudeste). Prompt otimizado pra teste no nano banana (Gemini image).

| Atributo | Definição |
|---|---|
| Idade aparente | 35-50 anos |
| Vestuário | Avental ou uniforme de trabalho do setor estética/beleza, cores neutras com possível detalhe coral |
| Ambiente | Salão/estúdio próprio — espelho, produtos organizados, cadeira de atendimento ao fundo |
| Expressão | Acolhedora, sorriso genuíno, mãos em ação como se estivesse atendendo |
| Diversidade dentro da dorsal | Predominância feminina (dado real do setor), mas sem travar — etnia brasileira, sudeste |

**Prompt (nano banana / Gemini image):**
```
Photorealistic medium shot of a Brazilian small business owner in the beauty/wellness sector,
mid-40s, Southeast Brazilian features, working inside her own salon or studio — mirror, styling
tools and products softly visible in the background. Professional work apron or uniform, warm
genuine smile, hands mid-action as if attending a client, natural indoor light. Subtle coral
(#F2643C) accent visible in the environment. Warm but neutral color grade, no drop shadows,
clean flat lighting, photorealistic. 4:5 vertical aspect ratio. No text, no captions, no logos,
no watermarks.
```

## Pesquisa real agregada (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads) — GRUPO B (Serviço Estético, Manual e de Bem-Estar), síntese dos 5 volantes desta dorsal (`b1`, `b2`, `b3`, `b5`, `b6`).

| Critério | Dado agregado real | Nota |
|---|---|---|
| Idade real | 20-50 dependendo do sub-nicho (dança 20-40, personal trainer 22-40, esteticista 25-45, produtor de eventos 30-50) | Coerente com a faixa 35-50 já travada, mas mostra que o grupo puxa mais jovem do que o número sugere em alguns sub-nichos |
| Gênero | **Fortemente feminino no núcleo do setor**: cabeleireira 83,7% (Observatório Sebrae RAIS 2025), esteticista 88,4% (idem). Exceções dentro da própria dorsal: personal trainer com leve predomínio masculino, produtor de eventos equilibrado (feminino em cerimonial, masculino em montagem técnica) | Confirma com número real o "predominância feminina" que já estava na referência visual — mas mostra que 2 dos 5 volantes fogem do padrão, vale registrar como nuance, não regra fechada |
| Renda real | Padrão que se repete no grupo inteiro: renda **formal reportada é baixa** (R$1.600-1.900/mês, dado de empregada CLT do setor), mas a **dona do negócio** (MEI/ME) fatura bem mais — R$2.500 a R$15.000 dependendo do nicho e clientela | Achado importante: os números "oficiais" do setor (RAIS) subestimam a renda real de quem é dona, não empregada — vale não confundir os dois ao falar de renda desta persona |
| Canais reais | Instagram + WhatsApp são universais no grupo inteiro (antes-depois visual, portfólio, agendamento) — já bate 100% com o que a tabela desta persona já tinha (83% de presença Instagram no setor) | Confirmado, sem surpresa |
| Reclamação real documentada (agregada) | Estrutural: **o teto do MEI é estourado por motivo de sucesso**, não de desorganização — parceria (Lei do Salão Parceiro mal implementada por contador de bairro), sazonalidade extrema (festival de fim de ano de professora de dança), ou desenquadramento forçado (personal trainer classificado como "atividade intelectual regulamentada" mesmo popular no MEI) | Bate com a jornada já descrita ("bate no teto do MEI"), mas mostra que o MOTIVO do estouro varia — vale ter 3 ângulos de conteúdo diferentes, não só "você cresceu" genérico |
| Vocabulário real | Específico por sub-nicho (progressiva/cutilagem vs protocolo/anamnese vs shape/hipertrofia vs rider técnico/backstage) — nenhum termo comum, exceto o registro caloroso já capturado em "Voz própria" | — |
| Ambiente real | Espaço físico próprio é constante no grupo (salão, estúdio, clínica) — reforça a referência visual já travada (ambiente de salão/estúdio) | Confirmado |

**Achado que reforça a tese de diferencial desta dorsal** (Conclusão Macro-Sistêmica #2 do relatório): a Lei do Salão Parceiro (Lei 13.352/2016) é chamada de "oportunidade subaproveitada" — o setor de beleza cresceu 17,9% em aberturas (235.708 CNPJs em 2025), mas a base contábil de bairro não domina a lei, gerando risco trabalhista real pras donas de salão. Isso é um ângulo de diferencial forte e citável (pilar 8) que esta dorsal específica valoriza.

## Cross-refs

- Voz/arquétipo: [[posicionamento]] §Arquétipos · [[personagem-leo]] §5 (dial de ironia médio pra esta dorsal)
- Sistema de personas: [[metodologia-personas]]


<!-- ============================================================ -->
# ARQUIVO: 02-personas/persona-c-baixa-familiaridade-digital.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-05
assunto: persona-c
tags: [pesquisa, personas, marketing]
---

# Persona C — "Precisa de mão na mão", 50+ anos · "quem não cresceu com celular"

> *"Não confio em fazer isso sozinha no aplicativo. Se travar, quero saber que tem alguém do outro lado."*

| Dimensão | Valor | Fonte/Conf. |
|---|---|---|
| Idade | 50+ (24,5% dos MEIs nacionais — 4º maior bracket, nada marginal) | IBGE — [[perfil-microempreendedor-mercado]] 🟢 |
| Renda | próxima à média MEI (R$5.542/mês) ou abaixo | Sebrae 🟡 |
| Local | BH/MG | decisão de produto 🟢 |
| Canal principal | WhatsApp (pessoal, não necessariamente Business) — baixa presença em Instagram/redes; indicação de familiares | inferência sobre [[perfil-microempreendedor-mercado]] §2, seed = fixture `cida` 🟡 |
| Oferta provável | MEI (mais provável) ou ME simples, atividade tradicional (aulas particulares, serviço manual, consultoria informal) | seed fixture `cida` 🟡 |
| % volume / receita | hipótese 20-25% do volume — coerente com o bracket etário nacional | 🟡 |
| Volume esperado | sustentado, não é pico — bracket 50+ é estrutural, não temporário | IBGE 🟢 |

## Negócio

- **LTV-hipótese:** potencialmente alta — uma vez que confia e se acostuma, baixa propensão a trocar (inércia + confiança construída), mas exige investimento maior de onboarding assistido
- **Gatilho de recompra:** não aplicável — retenção vem de não gerar nenhum susto
- **Indicação:** média — indica pra círculo próximo (família, colegas de profissão) quando confia, mas não é voz pública/digital

## Ads (canal pago)

- **Interesses-semente:** aposentadoria + renda extra, aulas particulares, serviços informais que viraram formais
- **Lookalike-semente:** cedo demais — volume baixo, esperar dado real
- **Gatilho-momento:** pressão externa (cliente pede nota fiscal, exigência de formalização) mais do que ambição de crescer
- **Exclusões:** campanhas com linguagem "startup"/"disrupção" — desconecta esse público (ver leitura demográfica em [[perfil-microempreendedor-mercado]] §1: "imigrantes digitais, não nativos")

## Orgânico (pilares afins)

Depoimento em vídeo simples e real (não produção sofisticada), conteúdo que resolve dúvida concreta ("o que é DAS", "preciso mesmo de contador?") em linguagem sem jargão

## Criativo / visual

Fonte grande, contraste alto, sem elementos decorativos que confundam — mesma diretriz já aplicada no design do app pra essa persona (ver `execucao/motor-testes/personas/cida.json`: "estressa com fonte pequena, termo técnico, formulário longo sem salvar")

## Tom de voz (como a MARCA/Léo fala COM ela — calibração, não voz dela)

Herda o arquétipo **Aliado/Parceiro de confiança** ([[posicionamento]] §Arquétipos) — mesmo aliado das outras dorsais, registro de **paciência reforçada**: "eu fico do seu lado" em dose mais alta, porque a objeção dela É literalmente medo de ficar sem aliado no meio do caminho ("vou travar sozinha"). Zero linguagem "startup/disrupção" (já excluída em Ads acima) — isso soa Sábio distante pra quem se descreve como imigrante digital, não nativo. Detalhe completo: [[metodologia-personas]] §Tom de voz por dorsal.

## Voz própria — como ELE/ELA fala 🆕 (26/08)

> ⚠️ Distinção do Pedro (26/08): isto é a voz própria, independente da marca — a seção acima é como a empresa calibra a fala PRA esta persona. **Nota de gênero (26/08):** achado de campo do Pedro (contato direto via escritório de 22 anos) — a maioria real deste perfil é masculina, mesmo o seed original (`cida`) sendo mulher. Ver `Referência visual fixa` abaixo, já corrigida.

- **Registro:** formal-educado (trata com "senhor(a)", "por gentileza"), frases mais longas e cuidadosas.
- **Escrita:** pontuação tradicional, pouco ou nenhum emoji, às vezes CAIXA ALTA sem querer (sinal de baixa familiaridade com teclado/celular), digita devagar.
- **O que realmente diria/digitaria:** "Bom dia, gostaria de saber se preciso fazer algo hoje ou se está tudo certo." · "Não entendi muito bem essa parte, pode me explicar de novo por favor?" · "Desculpa incomodar de novo."
- **Tom emocional:** contido, evita parecer "incomodando" — pede desculpa antes de perguntar, mesmo quando a dúvida é legítima e comum.

## Objeção principal

**"Vou travar sozinho(a) e não vou ter quem me ajude"** → contorno: modo assistido + humano de verdade acessível (não chatbot) — reforça o mesmo diferencial estrutural das outras personas, aqui em dose mais alta

### Objeções secundárias 🆕 (26/08)

1. **"Meu filho/filha que mexe com essas coisas de app pra mim — e se ele não puder me ajudar num dia que eu precisar?"** — dependência de intermediário digital, medo de ficar sem ele.
2. **"Já ouvi falar de golpe de gente se passando por contador pelo WhatsApp — como sei que é vocês mesmo quem tá falando comigo?"** — desconfiança de golpe, real e documentada no setor.
3. **"Tenho vergonha de perguntar coisa 'básica' — vou ser tratado(a) com paciência mesmo perguntando de novo?"** — medo de julgamento, não da resposta em si.
4. **"Se eu errar alguma coisa sem querer, vou ser multado(a) sem nem saber o que fiz de errado?"** — medo de punição por erro involuntário.
5. **"Não confio em colocar meus dados bancários/pessoais num aplicativo — é seguro mesmo?"** — desconfiança geral de app com dado sensível, mais forte nesta dorsal que nas outras.

## Referência visual fixa — nota de correção 🆕 (26/08)

Achado de campo do Pedro: a maioria real deste perfil é **masculina** (não seguir o seed `cida`, que era mulher, como padrão de imagem). Tabela e prompt abaixo já corrigidos.

## Jornada

1. Alguém pede nota fiscal ou recebe orientação de formalizar (evento externo, não ambição própria)
2. Pergunta pra filha/filho ou pesquisa devagar, sem pressa, muitas vezes travando no meio
3. Decide por confiança pessoal (indicação de alguém próximo) mais do que por comparação racional de preço
4. Precisa de acompanhamento ativo no onboarding — não é self-service puro
5. Se bem atendida, vira cliente de longuíssimo prazo, baixíssimo churn

## Jobs absorvidos

Não quer "aprender a usar um app" — quer alguém em quem confiar pra cuidar disso e avisar quando algo precisa ser feito, sem ela ter que caçar informação

## Banco de calibragem antes/depois 🆕 (26/08, v2 enriquecido — 1 par por pilar relevante)

> Mesmo espírito do `personagem-leo.md` §9. Organizado por pilar de conteúdo (`estrategia-organica.md` §Camada 1, numeração v3). Dial de ironia baixíssimo/zero nesta dorsal — nenhum par abaixo usa piada, mesmo nos pilares "de humor" pra outras personas.

| Pilar | Situação | Genérico (sem persona) | Versão Persona C | Por que funciona |
|---|---|---|---|---|
| 2 — Cultural/leve | Normalizar a dúvida (sem piada) | "Você sabia que muita gente tem dúvida sobre imposto?" | "Ninguém nasce sabendo essas coisas. Você não é a única com dúvida, e tá tudo bem perguntar de novo quantas vezes precisar." | Acolhimento no lugar de humor — dial zero, mesma função social do pilar sem ironia. |
| 4 — Dor educativa | Explicando o DAS | "O DAS é o Documento de Arrecadação do Simples Nacional, gerado mensalmente." | "É o boleto do mês. Chega, você paga, pronto. Eu aviso antes de vencer." | Nomeia o jargão só o suficiente pra nunca mais precisar usá-lo. |
| 5 — Mitos | "Empresa pequena não precisa se preocupar" | "Tem gente que acha que empresa pequena não precisa se preocupar com imposto." | "Empresa pequena também tem prazo e guia pra pagar, sim. Mas relaxa: eu que fico de olho nisso, você não precisa decorar nada." | Corrige a crença sem alarmar — reforça que ela não carrega o peso sozinha. |
| 6 — Calendário fiscal | Prazo do DAS | "Não perca o prazo do DAS." | "Todo mês, no tempo certo, eu aviso antes de vencer. Você não precisa marcar em lugar nenhum." | Remove qualquer exigência de organização própria dela. |
| 7 — Educação fiscal/enquadramento | Fator R / Anexo | "Seu enquadramento tributário está sujeito ao Fator R." | "Isso aqui é só o nome de uma conta que eu já fiz. Você não precisa entender a fórmula, só saber que tá certo." | Traduz sem soar como estar explicando pra criança — tira o peso de "precisar saber". |
| 8 — Diferencial | Atendimento humano | "Nosso atendimento é diferenciado." | "Tem gente de verdade do outro lado, sempre que você precisar. Não é robô, não é fila de espera." | Nomeia o medo dela (ficar sem humano) como o próprio diferencial. |
| 10 — Oferta | Decisão sem pressa | "Assine e comece a usar." | "Sem pressa pra decidir. Quando você quiser começar, eu explico cada passo com você do lado." | Remove pressão de decisão rápida, o gatilho de ansiedade dela. |
| 11 — Migração | Trocar de contador | "Troque de contador facilmente." | "Se você quiser trocar, eu cuido de tudo com calma, sem você ter que entender o processo todo sozinha." | Tranquiliza sobre a complexidade percebida da troca. |
| 12 — Gestão do dinheiro do dono | Pró-labore | "Calcule seu pró-labore." | "O valor que você tira pra você todo mês, eu calculo certinho. Você só recebe o número pronto." | Remove qualquer exigência de cálculo próprio. |
| 13 — Documentação em dia | Alvará/certidões | "Mantenha documentação em dia." | "Alvará, certificado, essas coisas... eu confiro tudo isso pra você. Se faltar algo, eu aviso com tempo de sobra." | Reforça vigilância + "tempo de sobra" — nunca em cima da hora. |
| — Onboarding (transversal) | Cadastro inicial | "Complete seu cadastro preenchendo os campos obrigatórios." | "Vamos com calma, um passo de cada vez. Não precisa terminar tudo hoje." | Remove a pressão de completar rápido. |

## Mapeamento de pilar — onde ela se conecta 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §11 — não é regra travada, é encaixe natural. Numeração de pilar v3 (`estrategia-organica.md`).

| # | Pilar | Encaixe | Por quê |
|---|---|---|---|
| 1 | Bastidor fundador | ❌ Fraco | Não se conecta com "construir em público" — conceito distante da realidade dela |
| 2 | Cultural/leve | ❌ Fraco | Dial zero — humor pode confundir ou soar como estar rindo dela mesmo mirando o sistema |
| 3 | Nossa origem | 🟢 Forte | "22 anos" é exatamente o tipo de prova de solidez que ela precisa pra confiar (contraponto ao medo de golpe) |
| 4 | Dor educativa | 🟢 Forte | Precisa entender o básico — sem jargão, sem ironia |
| 5 | Mitos/crenças erradas | 🟡 Médio | Útil, mas precisa de cuidado extra pra não soar como correção/vergonha |
| 6 | Calendário fiscal | 🟢 Forte | Vigilância de prazo é alívio direto pro medo de "esquecer algo importante" |
| 7 | Educação fiscal/enquadramento | 🟡 Médio | Relevante, mas exige simplificação extrema |
| 8 | Diferencial vs mercado | 🟢 Forte | "Gente de verdade, não robô" resolve o medo central dela |
| 9 | Bastidor/processo | 🟢 Forte | Ver o contador real trabalhando é a prova concreta que ela precisa |
| 10 | Oferta/conversão | 🟡 Médio | Decide devagar — oferta direta pode soar como pressão, ruim pro perfil dela |
| 11 | Migração/troca de contador | 🟡 Médio | Menos comum ela já ter tido contador formal — mais provável ser primeira formalização |
| 12 | Gestão do dinheiro do dono | 🟡 Médio | Relevante, mas não é hook emocional forte |
| 13 | Documentação em dia | 🟢 Forte | "Eu confiro" é exatamente a vigilância que ela busca |
| 14 | Prova/reação (standby) | 🟢 Forte | Decide por confiança pessoal/indicação — prova social bate muito bem quando reativado |
| 15 | Participativo (standby) | ❌ Fraco | Não é voz pública/digital (indicação é pro círculo próximo, não redes) |
| Momentâneo | Lançamento/promoção | ❌ Fraco | Não responde a urgência/novidade — "vaga limitada" pode até assustar em vez de atrair |

## Reação a crítica/ataque 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §10. Esta é a dorsal mais sensível — nenhuma resposta usa ironia, mesmo com troll.

| Tipo de comentário | Marca NÃO faz (pra este perfil) | Marca faz |
|---|---|---|
| "Isso é golpe, vão sumir com meu dinheiro" | Qualquer coisa que soe apressada ou automática | Reconhece o medo com muita calma, oferece canal humano direto (WhatsApp/ligação), não só resposta no comentário |
| "Vou travar sozinha e não vou ter quem me ajude" | Resposta que pareça script ou pressa | Reafirma presença constante, sem prazo: "eu tô aqui, do seu lado" |
| "Não serve pro meu caso" | Insistir ou complicar a explicação do porquê | Confirma com simplicidade, sem fazer ela sentir que perguntou errado |
| Troll/hate sem argumento | Qualquer resposta seca — pode ser mal-lida por quem lê como ela | Resposta muito educada e calorosa mesmo pro troll, nunca seca |
| Crítica de concorrente disfarçada | Nomear ninguém, nem "brigar" | Fala com calma do que a Legalizaí oferece, sem contrapor agressivamente |

## Referência visual fixa 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §12. Segue o brief de humano-IA travado (`decisoes-marca.md` 26/08, item 10): fotorrealista, diversidade ampla, etnia travada em características brasileiras (sudeste). Prompt otimizado pra teste no nano banana (Gemini image).

| Atributo | Definição |
|---|---|
| Idade aparente | 50-65 anos |
| Vestuário | Roupa simples do dia a dia, condizente com o ofício (avental de trabalho manual ou traje casual de quem dá aula) |
| Ambiente | Oficina de bairro modesta ou espaço de trabalho em casa — ferramentas, objetos simples, iluminação doméstica quente |
| Expressão | Serena, atenta, sem pressa |
| Diversidade dentro da dorsal | **Predominantemente masculino** (achado de campo do Pedro, 26/08 — corrige a suposição anterior de "variado"), mas não exclusivo; etnia brasileira, sudeste |

**Prompt (nano banana / Gemini image):**
```
Photorealistic medium shot of a Brazilian small business owner in their late 50s, predominantly
male (but not exclusively — occasional variation acceptable), Southeast Brazilian features,
working in a modest neighborhood workshop or home-based service setting (simple tools, plain
furniture, warm domestic lighting). Simple everyday work clothes, calm and attentive expression,
unhurried body language, natural light. Subtle coral (#F2643C) accent object nearby. Warm but
neutral color grade, no drop shadows, clean flat lighting, photorealistic. 4:5 vertical aspect
ratio. No text, no captions, no logos, no watermarks.
```

## Pesquisa real agregada (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads) — GRUPO C (Ofício Tradicional e Baixa Familiaridade Digital), síntese dos 3 volantes desta dorsal (`c1`, `c3`, `c4`).

| Critério | Dado agregado real | Nota |
|---|---|---|
| Idade real | 25-65+ dependendo do sub-nicho (técnico de eletrônicos 25-45, mecânico 35-55, professor aposentado 50-65+) | O bracket 50+ travado na tabela desta persona bate bem com professor autônomo, mas mecânico/técnico puxam mais jovem — a dorsal cobre um espectro mais largo que só "aposentado" |
| Gênero | **Split real, não homogêneo**: mecânico e técnico de eletrônicos são fortemente masculinos (Sindirepa-MG confirma "esmagadora maioria" no mecânico); professor autônomo aposentado é feminino (feminização histórica do magistério) | Isso é um dado importante pra correção do Pedro (26/08): a correção pra "predominantemente masculino" bate bem com 2 dos 3 volantes (mecânico, técnico), mas o professor autônomo é o outlier feminino dentro da própria dorsal — vale registrar como nuance por sub-nicho, não regra fechada de 100% |
| Renda real | R$1.000-3.500 (professor, renda extra atrelada ao ano letivo) até R$4.000-20.000 (mecânico, forte dependência de escala/capital de giro) | Faixa mais ampla do que "próxima à média MEI ou abaixo" sugere — mecânico foge do padrão de renda baixa da dorsal |
| Canais reais | WhatsApp é universal nos 3; Google Maps forte no mecânico; grupos de Facebook no técnico (troca de componente); quase zero vídeo/Reels no professor | Confirma "baixa presença em Instagram/redes" já travado, com uma exceção parcial (mecânico usa Google Maps ativamente, que é digital mas não é rede social) |
| Reclamação real documentada (agregada) | A dor estrutural do grupo, segundo a própria pesquisa: **"o violento distanciamento cognitivo entre a digitalização do Estado (e-Social, NFe) e a cultura verbal, empírica e analógica do prestador de serviços mais antigo"** — cada sub-nicho tem seu medo específico: professor teme que o MEI afete a aposentadoria/pensão do INSS; mecânico teme o cruzamento de ICMS-ST (peças) com ISS (mão de obra) na mesma nota; técnico teme a burocracia de origem de peça ("sucata" sem NF de entrada) | Essa frase da pesquisa é praticamente uma citação pronta pra copy do pilar 4 (dor educativa) desta dorsal — nomeia o medo central sem soar condescendente |
| Vocabulário real | Específico por sub-nicho, sem sobreposição (retífica/B.O. vs reballing/placa-mãe vs "fixar o conteúdo"/didática) | — |
| Ambiente real | Consistente: espaço físico modesto e analógico (galpão de graxa, bancada de solda, mesa doméstica com apostilas) | Confirma a referência visual já travada (oficina de bairro modesta) |

**Nota de coerência com a correção de gênero do Pedro:** a pesquisa real dá suporte parcial à correção "predominantemente masculino" (2 de 3 volantes batem), mas não é unânime — o professor autônomo aposentado é uma exceção documentada dentro da própria dorsal. Isso não invalida a correção de campo do Pedro (que fala do padrão geral que ele vê no escritório), só registra que a dorsal não é 100% homogênea em gênero, igual à Persona A.

## Cross-refs

- Voz/arquétipo: [[posicionamento]] §Arquétipos · [[personagem-leo]] §5 (dial de ironia baixíssimo/zero pra esta dorsal, ponto mais sensível)
- Sistema de personas: [[metodologia-personas]]


<!-- ============================================================ -->
# ARQUIVO: 02-personas/persona-d-mei-puro-permanente.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: persona-d
tags: [pesquisa, personas, marketing]
confianca: 🟡 criada por decisão direta (Pedro), não pelos 3 critérios de governança padrão — ver nota
---

# Persona D — "MEI de vida toda", 30-50 anos · "o pequeno que quer continuar pequeno"

> *"Não quero crescer a ponto de virar dor de cabeça. Quero continuar simples, do jeito que já é."*

⚠️ **Nota de honestidade sobre esta dorsal:** as outras 3 (A/B/C) foram criadas seguindo os 3 critérios de governança (`metodologia-personas.md` §Camada 0: ocasião mal-coberta + volume sustentado + economia fecha), validadas com dado real Sebrae/IBGE. Esta aqui foi criada por **decisão direta do Pedro em 26/08** ("é importantíssima"), **antecipando** o gatilho original que previa esperar dado de volume do V0. Não é violação silenciosa — é exceção registrada. Nenhum número de renda/idade abaixo tem fonte de mercado dedicada; são inferência a partir do próprio conceito da persona, marcados 🔴 até validar.

| Dimensão | Valor | Fonte/Conf. |
|---|---|---|
| Idade | **30-50 anos** (travado 26/08 — antes estava aberto demais e a imagem-teste saiu "meia idade" por acidente, sem ser decisão real) | 🔴 inferência do Pedro a partir das características da persona, sem fonte de mercado dedicada |
| Renda | provável abaixo da média MEI (R$5.542/mês) — é quem escolhe ficar pequeno, não quem ainda não cresceu | 🔴 inferência, sem fonte dedicada |
| Local | BH/MG (geo do MLP) | decisão de produto 🟢 |
| Canal principal | WhatsApp/indicação — baixo investimento em presença digital própria | 🔴 inferência por analogia com Persona C |
| Oferta provável | MEI, permanente | por definição da persona |
| % volume / receita | já flagrado como "oferta mais frágil" (ticket baixo exige CAC muito baixo pra fechar conta) | 🔴 referência qualitativa, sem % dedicado |
| Volume esperado | desconhecido — é exatamente o dado que o V0 traria e que esta dorsal está antecipando sem ter | 🔴 |

## O que diferencia esta persona das outras 3

O eixo central NÃO é demográfico — é um eixo de **intenção de porte de negócio**. Persona B está EM transição (MEI→ME por crescimento). Persona D nunca pretende fazer essa transição — simplicidade é a escolha, não uma fase. Pode se sobrepor com C (baixa familiaridade digital) na prática, mas o eixo que define D é a INTENÇÃO de permanência, não o nível de conforto com tecnologia. (A idade 30-50, travada 26/08, é só referência visual/de comunicação — não é o que estrutura a persona, ao contrário de A/B/C onde idade é eixo real.)

## Negócio

- **LTV-hipótese:** potencialmente alta em volume de clientes (é o segmento mais numeroso do universo MEI), mas ticket baixo — exige CAC muito enxuto pra fechar conta (`economia-preco-cac.md` já sinaliza fragilidade de oferta nesse perfil)
- **Gatilho de recompra:** não aplicável — retenção vem de nunca sentir que "não vale o preço pro que eu preciso"
- **Indicação:** média — círculo próximo, não é voz pública/digital

## Objeção principal

**"Eu já pago pouco ou nada hoje, por que pagaria R$49 por mês?"** → contorno: simplicidade real tem valor mesmo em ticket baixo — o argumento não é upsell de crescimento (não interessa a esta persona), é "nunca mais pensar nisso de novo"

### Objeções secundárias 🆕 (26/08)

1. **"Se eu não crescer nunca, esse serviço não vai ficar tentando me empurrar plano maior com o tempo?"** — medo de upsell disfarçado, mesmo com a promessa de "nunca empurrar".
2. **"Já contratei coisa 'barata' que depois veio com taxa escondida — tem certeza que não vai subir de repente?"** — desconfiança acumulada de oferta de entrada com pegadinha.
3. **"Meu negócio é bem pequeno mesmo, será que vale a pena ter contabilidade formal ou é exagero pro meu caso?"** — dúvida sobre a própria necessidade, não sobre o produto.
4. **"Não tenho tempo nem paciência pra ficar mandando documento e respondendo pergunta toda hora — isso vai dar trabalho pra mim?"** — medo de fricção operacional recorrente.
5. **"Se eu cancelar depois de um tempo, vou perder alguma coisa ou fico irregular de novo?"** — medo da saída, não só da entrada.

## Tom de voz (como a MARCA/Léo fala COM ela — calibração, não voz dela)

Herda o arquétipo **Aliado/Parceiro de confiança** (`posicionamento.md` §Arquétipos) — registro de **aceitação sem pressão**: nunca empurra crescimento, celebra a escolha de ficar simples. Se soar "por que você não cresce?", está errado — essa pergunta pertence à Persona B, não a esta.

## Voz própria — como ELA fala 🆕 (26/08)

> ⚠️ Distinção do Pedro (26/08): isto é a voz própria dela, independente da marca — a seção acima é como a empresa calibra a fala PRA ela.

- **Registro:** econômico, direto ao ponto, sem rodeio nem formalidade — quer resolver rápido e sair.
- **Escrita:** mensagens curtas, às vezes só a pergunta, sem saudação nem despedida.
- **O que realmente diria/digitaria:** "Isso aumenta o preço depois?" · "Só isso mesmo que eu preciso fazer?" · "Ok, valeu."
- **Tom emocional:** neutro/pragmático — impaciência leve com qualquer coisa que pareça complicar algo que ela considera simples.

## Jornada

1. Já é MEI, já formalizou por algum motivo (exigência externa ou escolha própria)
2. Nunca considerou virar ME — não é objetivo, é não-tema
3. Decide trocar de contabilidade só se a atual gerar dor real (susto, prazo perdido) ou custar mais que o valor percebido
4. Baixíssima tolerância a complexidade — se o onboarding parecer trabalhoso, desiste

## Jobs absorvidos

Não quer "crescer o negócio" — quer que a parte chata (imposto, prazo) suma da cabeça pelo menor custo possível, sem nunca ter que pensar em virar "empresa de verdade".

## Banco de calibragem antes/depois 🆕 (26/08, v2 enriquecido — 1 par por pilar relevante)

> Mesmo espírito do `personagem-leo.md` §9. Organizado por pilar de conteúdo (`estrategia-organica.md` §Camada 1, numeração v3). Vários pilares (7, 12) não se aplicam ao MEI do mesmo jeito que às outras dorsais — adaptados, nunca forçados.

| Pilar | Situação | Genérico (sem persona) | Versão Persona D | Por que funciona |
|---|---|---|---|---|
| 2 — Cultural/leve | Negócio pequeno "não conta" | "Tem gente que acha que MEI não precisa se preocupar com nada." | "MEI pequeno também tem guia pra pagar — só que ninguém fala disso porque não é 'glamouroso' falar de negócio pequeno. Eu falo." | Valida o tamanho do negócio dela em vez de tratar como menos importante. |
| 4 — Dor educativa | Obrigação mensal do MEI | "MEI tem obrigações fiscais mensais." | "Seu MEI tem, sim, um boleto por mês. Só isso. Eu cuido, você nem sente." | Reduz a complexidade percebida ao que ela realmente é: mínima. |
| 5 — Mitos | "Não compensa contabilidade pra MEI pequeno" | "Tem gente que acha que MEI de baixo faturamento não compensa contabilidade." | "Não é sobre 'compensar'. É sobre nunca mais pensar nisso pelo preço de um cafézinho por dia." | Reposiciona o valor: não é ROI de crescimento, é paz de espírito barata. |
| 6 — Calendário fiscal | DASN-SIMEI anual | "Não esqueça o DASN-SIMEI anual." | "Uma vez por ano, uma declaração. Eu preencho, você só confirma." | Menor fricção possível, sem surpresa de novidade. |
| 7 — Educação fiscal/enquadramento | Adaptado (MEI não tem Fator R) | "Seu enquadramento pode mudar se você crescer." | "Você não pretende crescer, e tá ótimo assim. Isso não muda nada no que eu faço por você." | Reforça o pilar central da persona: nunca empurrar crescimento. |
| 8 — Diferencial | Preço | "Nosso plano é o mais barato do mercado." | "Não é sobre ser o mais barato. É sobre você nunca mais abrir o app do banco assustada por causa de imposto." | Compete em tranquilidade, não em preço — mais alinhado ao que ela valoriza. |
| 10 — Oferta | Por que pagar mensalidade | "Nosso serviço oferece o melhor valor agregado do mercado." | "Você já paga pouco hoje. A ideia não é você pagar mais, é você nunca mais pensar nisso." | Ataca a objeção real: por que pagar algo a mais por algo que já resolve sozinha. |
| 11 — Migração | Quem nunca teve contador | "Troque de contador facilmente." | "Se hoje você não paga nada por isso e tá tudo errado sem saber, trocar agora é mais barato que descobrir depois." | Fala a quem nunca teve contador, não a quem já tem um ruim — perfil mais realista pra D. |
| 12 — Gestão do dinheiro do dono | Adaptado (sem pró-labore formal) | "Saiba quanto você pode retirar do seu negócio." | "Você já sabe quanto sobra pra você no fim do mês. Eu só confirmo que tá dentro da lei, sem comer seu lucro com imposto a mais." | Fala a língua de quem já administra informalmente, sem impor conceito novo. |
| 13 — Documentação em dia | Esquecimento normalizado | "Mantenha documentação em dia." | "Alvará, certidão... eu confiro. Você só some da lista de quem 'esqueceu' de novo." | Reduz o constrangimento — esquecer é normal, ela não é falha. |
| — Onboarding (transversal) | Cadastro inicial | "Complete seu cadastro em poucos passos." | "3 perguntas, resolve, esquece. Não tem parte 2." | Reforça a promessa de simplicidade definitiva, sem letra miúda de complexidade futura. |

## Mapeamento de pilar — onde ela se conecta 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §11 — não é regra travada, é encaixe natural. Numeração de pilar v3 (`estrategia-organica.md`).

| # | Pilar | Encaixe | Por quê |
|---|---|---|---|
| 1 | Bastidor fundador | ❌ Fraco | Sem conexão com a narrativa de "construir em público" |
| 2 | Cultural/leve | 🟡 Médio | Validação leve de que negócio pequeno importa, sem ironia pesada |
| 3 | Nossa origem | 🟡 Médio | Solidez importa, mas ela não pesquisa a fundo — menos crítico que pra B |
| 4 | Dor educativa | 🟢 Forte | Reduzir a complexidade percebida é o hook central dela |
| 5 | Mitos/crenças erradas | 🟢 Forte | "Não compensa contabilidade pra MEI pequeno" é o mito que trava a decisão dela |
| 6 | Calendário fiscal | 🟢 Forte | Simplicidade de "1x por ano" é exatamente o que ela quer ouvir |
| 7 | Educação fiscal/enquadramento | ❌ Fraco | Não se aplica bem ao MEI puro — adaptado, mas não é hook natural |
| 8 | Diferencial vs mercado | 🟡 Médio | Não compara muito — decide por confiança/preço direto, não por comparação |
| 9 | Bastidor/processo | 🟡 Médio | Menos crítico que pra B/C — ela quer resolver, não necessariamente ver o processo |
| 10 | Oferta/conversão | 🟢 Forte | "Nunca mais pensar nisso pelo preço de um café" é o gancho mais forte dela |
| 11 | Migração/troca de contador | 🟡 Médio | Mais comum ela nunca ter tido contador antes (perfil adaptado, não o migrante clássico) |
| 12 | Gestão do dinheiro do dono | ❌ Fraco | Conceito de pró-labore formal não ressoa — ela já sabe "quanto sobra" informalmente |
| 13 | Documentação em dia | 🟡 Médio | Relevante, mas menos ansiogênico que pra B (nem sempre tem loja física fiscalizável) |
| 14 | Prova/reação (standby) | 🟡 Médio | Ajuda, mas não é decisivo pro perfil dela |
| 15 | Participativo (standby) | ❌ Fraco | Baixo investimento digital, não é voz pública |
| Momentâneo | Lançamento/promoção | ❌ Fraco | Preço-sensível — "vaga fundador" não fala com ela, ela quer é não pagar mais |

## Reação a crítica/ataque 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §10. Esta dorsal quer resposta rápida e direta — textão é fricção, não conforto.

| Tipo de comentário | Marca NÃO faz (pra este perfil) | Marca faz |
|---|---|---|
| "Isso é golpe, vão sumir com meu dinheiro" | Resposta longa e formal | Prova rápida e direta, sem se alongar — ela não quer ler um textão |
| "Por que pagar por algo que já resolvo sozinha (ou nem faço)" | Defender com comparação de mercado | Reposiciona simplicidade como o valor, em poucas palavras |
| "Não serve pro meu caso" | Insistir tentando vender mesmo assim | Confirma rápido, sem fricção |
| Troll/hate sem argumento | Ignorar ou se alongar explicando | Resposta mínima, encerra rápido |
| Crítica de concorrente disfarçada | Nomear concorrente | Resposta curta sobre o que a Legalizaí oferece, sem comparação longa |

## Referência visual fixa 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §12. Segue o brief de humano-IA travado (`decisoes-marca.md` 26/08, item 10): fotorrealista, diversidade ampla, etnia travada em características brasileiras (sudeste). Prompt otimizado pra teste no nano banana (Gemini image).

| Atributo | Definição |
|---|---|
| Idade aparente | **30-50 anos** (travado 26/08 — antes estava aberta demais, 30-60, e saiu "meia idade" por acidente na primeira geração) |
| Vestuário | Uniforme simples de ofício de rua/bairro (avental, colete de trabalho) |
| Ambiente | Pequeno ponto de trabalho de rua ou banca (ex: chaveiro, conserto de calçados), modesto mas funcional |
| Expressão | Tranquila, satisfeita com a simplicidade do próprio negócio |
| Diversidade dentro da dorsal | Gênero variado (explícito no prompt), etnia brasileira, sudeste |

**Prompt (nano banana / Gemini image):**
```
Photorealistic medium shot of a Brazilian micro-entrepreneur (any gender), age 30-50, Southeast
Brazilian features, working at a small street-level shop or stand (locksmith stall, shoe repair
bench, or similar small service setup). Simple work apron, calm and content expression, natural
outdoor or storefront light. Subtle coral (#F2643C) accent visible nearby. Warm but neutral
color grade, no drop shadows, clean flat lighting, photorealistic. 4:5 vertical aspect ratio.
No text, no captions, no logos, no watermarks.
```

## Pesquisa real agregada (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads) — GRUPO D (MEI Permanente, Ticket Baixo, Ponto de Rua/Bairro), síntese dos 3 volantes desta dorsal (`d1`, `d2`, `d3`).

| Critério | Dado agregado real | Nota |
|---|---|---|
| Idade real | 25-65+ dependendo do sub-nicho (teleatendente 25-45, chaveiro 35-60, sapateiro 45-65+ tradicional / 30-45 franquia) | A faixa 30-50 travada nesta persona é uma média razoável, mas o grupo real tem cauda mais velha (sapateiro tradicional) e mais jovem (teleatendente) do que o intervalo sugere |
| Gênero | Split real por sub-nicho: chaveiro fortemente masculino (74,5%, Sebrae RAIS 2025); sapateiro polarizado (masculino no reparo pesado tradicional, feminino 64,8% em acabamento/atendimento de franquia); teleatendente fortemente feminino (mães buscando home office total) | A tabela desta persona trava "gênero variado, explícito no prompt" — o dado real confirma que "variado" é a descrição certa PRA DORSAL, mas cada volante individual tem um gênero real bem definido, o que já está refletido nos arquivos de volante |
| Renda real | Baixa e concentrada: R$1.500-4.500 na maioria (chaveiro dono R$2.400-4.500, sapateiro bairro R$1.500-2.500) — só foge do padrão o teleatendente bilíngue, que pode triplicar cobrando em dólar (R$1.500-4.000+ até 3x) | Confirma "renda provável abaixo da média MEI" já travado, com uma única exceção clara (teleatendente internacional) |
| Canais reais | Google Meu Negócio/Maps (chaveiro — "chaveiro perto de mim"), fachada física + WhatsApp com foto (sapateiro), Workana/99freelas/Instagram (teleatendente) | Mais digital do que a hipótese original sugeria (WhatsApp/indicação) — o chaveiro em particular depende ativamente de busca geolocalizada |
| Reclamação real documentada (agregada) | Constante no grupo: **o custo fixo do DAS-MEI (~R$75/mês) corrói a margem de um ticket já baixo** — literal no chaveiro. Sapateiro tem dor adicional de não conseguir contratar CLT (jovens rejeitam o ofício, gargalo trabalhista pra quem quer expandir). Teleatendente teme Fator R e que contratante recuse por medo de "pejotização irregular" (MPT) | A dor do ticket-baixo-vs-custo-fixo é exatamente a objeção principal já registrada acima ("já pago pouco ou nada, por que pagaria R$49") — agora com dado real (R$75/mês do DAS) sustentando a percepção |
| Vocabulário real | Específico por sub-nicho ("miolo da fechadura"/mixa vs "meia sola"/sovela vs task/follow-up/SLA) | — |
| Ambiente real | Ponto de rua/bairro modesto e minúsculo (quiosque de chaveiro, banca de sapateiro) OU home office simples (teleatendente) — confirma a referência visual já travada | — |

**Achado mais importante desta rodada — valida parcialmente a própria existência da dorsal:** a pesquisa cita que **93% das novas empresas abertas no setor de chaveiros em 2025 foram MEI** (não migraram pra ME) e que investimento inicial do ofício é baixíssimo (a partir de R$500). Isso é evidência real de que "MEI de vida toda, sem intenção de crescer" É um padrão de mercado de fato — não só uma aposta de nicho do Pedro. Reduz (não elimina) a confiança 🔴 original desta dorsal, que foi criada por decisão direta sem os 3 critérios de governança padrão (ver nota de honestidade no topo do arquivo). Ainda não é validação completa (não há % de volume/receita), mas é o primeiro dado de mercado real que aponta na direção certa.

## Cross-refs

- Dorsais irmãs: [[persona-a-servico-intelectual]] · [[persona-b-servico-estetico]] · [[persona-c-baixa-familiaridade-digital]] · [[persona-e-jovem-cnpj]]
- Pilar de conteúdo mais afim: [[estrategia-organica]] pilar 10 (oferta, numeração v3) com ângulo de simplicidade, não crescimento
- Fonte da fragilidade de oferta: [[economia-preco-cac]]


<!-- ============================================================ -->
# ARQUIVO: 02-personas/persona-e-jovem-cnpj.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: persona-e
tags: [pesquisa, personas, marketing]
confianca: 🔴 criada por decisão direta (Pedro), 2ª promoção — nasceu volante de A (26/08), promovida a dorsal no mesmo dia. Nenhum dado de mercado dedicado.
---

# Persona E — "Começa Certo", 22-31 anos · "quem nunca passou pela CLT"

> *"Nunca trabalhei de carteira assinada. Já entrei direto como PJ."*

⚠️ **Nota de honestidade sobre esta dorsal:** promovida de volante (`a4-jovem-cnpj-servico-intelectual`, criada mais cedo hoje sob a Persona A) pra dorsal própria, por pedido direto do Pedro. Isso é a **2ª exceção de governança do dia** (a 1ª foi a Dorsal D) — os 3 critérios normais (ocasião mal-coberta + volume sustentado + economia fecha) não foram checados com dado real. Continua valendo o alerta já registrado quando isso era volante: `perfil-microempreendedor-mercado.md` diz explicitamente que a idade média do mercado é 40,8 anos, "não é público jovem/hustle" — esta dorsal contraria esse dado agregado. Números abaixo sem fonte dedicada ficam marcados 🔴.

| Dimensão | Valor | Fonte/Conf. |
|---|---|---|
| Idade | 22-31 | 🔴 aposta de nicho, não bracket do IBGE mapeado |
| Renda | provável média-alta pro perfil intelectual jovem | 🔴 sem fonte dedicada |
| Local | BH/MG (geo do MLP) | decisão de produto 🟢 |
| Canal principal | Instagram + comunidades tech/criativas (bootcamp, dev júnior) | 🔴 inferência, sem dado |
| Oferta provável | ME (mesma vedação de MEI pra atividade intelectual da Persona A) | 🟢 herda regra fiscal real |
| % volume / receita | desconhecido | 🔴 |
| Volume esperado | nicho, não mainstream — é exatamente o oposto do que o dado agregado sugere | 🔴 |

## Negócio

- **LTV-hipótese:** alta — relação de longo prazo desde o início da carreira, mesma lógica da Persona A mas começando mais cedo
- **Gatilho de recompra:** não aplicável (assinatura contínua)
- **Indicação:** alto potencial — comunidades tech/criativas júnior são conectadas e ativas online

## Ads (canal pago)

- **Interesses-semente:** devs júnior, bootcamps de programação/design, comunidades de primeiro emprego tech
- **Lookalike-semente:** cedo demais — sem base própria ainda
- **Gatilho-momento:** primeiro contrato PJ logo na entrada de carreira, sem CLT antes
- **Exclusões:** quem já trabalhou anos de CLT antes de virar PJ — esse é o território da Persona A tradicional, não desta

## Orgânico (pilares afins)

Educativo (pilar 4/7 — dor educativa e educação fiscal, mas em tom mais informal), bastidor (pilar 1 — identifica com quem constrói cedo), cultural/leve (pilar 2 — tolera e talvez espere humor de marca mais que a média)

## Criativo/visual

Contexto de trabalho jovem/remoto — tela de código, coworking, mesa de casa — nunca traje formal/executivo. Léo pode aparecer com mais frequência aqui (dial de ironia alto, geração tolera bem).

## Tom de voz (como a MARCA/Léo fala COM ela — calibração, não voz dela)

Herda o arquétipo **Aliado/Parceiro de confiança** (`posicionamento.md` §Arquétipos) — registro de **cúmplice de quem tá começando**: mais informal que a Persona A tradicional, tolera (talvez espere) mais ironia/humor de marca. Diferença chave: não fala como quem "já passou por isso e trocou de contador" (isso é A), fala como quem "nunca passou pelo processo tradicional, então precisa do caminho todo explicado sem pressupor vocabulário".

## Voz própria — como ELA fala 🆕 (26/08)

> ⚠️ Distinção do Pedro (26/08): isto é a voz própria dela, independente da marca — a seção acima é como a empresa calibra a fala PRA ela.

- **Registro:** informal, gírias de internet/tech, abreviações extremas, referências de cultura pop/meme.
- **Escrita:** emojis variados, pontuação solta, "kkkk" pra suavizar, pergunta sem contexto assumindo que a marca vai entender.
- **O que realmente diria/digitaria:** "gente socorro não faço ideia de como isso funciona kkkk" · "é tipo assinatura né, cancela quando quiser?" · "alguém mais aqui é PJ recém formado se sentindo perdido tipo eu 😭"
- **Tom emocional:** espontâneo, brincalhão mesmo em dúvida real — baixa barreira de vulnerabilidade pública (posta dúvida abertamente, sem constrangimento).

## Objeção principal

**"Não tenho experiência de 'antes' pra comparar, nem sei direito o que perguntar"** → contorno: mostrar o caminho completo desde o início, nunca pressupor que ela já sabe o vocabulário básico (diferente da Persona A, que já sabe comparar Anexo/Fator R)

### Objeções secundárias 🆕 (26/08)

1. **"Todo mundo fala de MEI como o começo óbvio — por que vocês tão me dizendo que não posso?"** — confusão gerada por senso comum incorreto e amplamente repetido.
2. **"Meus amigos ainda recebem por CPF e tá tudo bem com eles — por que eu preciso me preocupar com isso agora?"** — comparação social, acha que o risco é exagerado.
3. **"Se eu errar no começo por inexperiência mesmo, vou ser punida como se fosse malícia?"** — medo de punição desproporcional por erro genuíno de principiante.
4. **"É tudo pelo celular mesmo? Não vou ter que aprender um sistema chato de empresa grande?"** — expectativa de simplicidade nativa-digital, medo de fricção corporativa.
5. **"Quanto isso realmente vai me custar no fim das contas — tem algum custo escondido que só descubro depois de cliente?"** — desconfiança de pricing enganoso, comum em serviços digitais de assinatura.

## Jornada

1. Sai da faculdade/bootcamp e já entra direto como PJ (sem CLT no meio)
2. Pesquisa via redes sociais/comunidades online, não necessariamente Google Search de alta intenção
3. Decide rápido, sem processo longo de comparação (menos paciência pra pesquisa exaustiva)
4. Onboarding precisa ser 100% digital, zero fricção — desistência rápida se travar
5. Se a experiência for boa, vira voz pública ativa (posta sobre a experiência, efeito multiplicador em comunidade)

## Jobs absorvidos

Não quer "aprender a linguagem de adulto-do-mercado-de-trabalho" antes de conseguir abrir empresa — quer o mínimo necessário pra não errar, sem se sentir mal por não ter experiência prévia de CLT/mercado formal.

## Banco de calibragem antes/depois 🆕 (26/08, v2 enriquecido — 1 par por pilar relevante)

> Mesmo espírito do `personagem-leo.md` §9. Organizado por pilar de conteúdo (`estrategia-organica.md` §Camada 1, numeração v3). Dial de ironia alto (herdado de A) — tolera humor mais que qualquer outra dorsal.

| Pilar | Situação | Genérico (sem persona) | Versão Persona E | Por que funciona |
|---|---|---|---|---|
| 2 — Cultural/leve | Lacuna educacional do "kit dev" | "Muita gente não sabe que atividade intelectual não pode ser MEI." | "Ninguém te falou isso no bootcamp, né? Atividade intelectual não é MEI. Bizarro isso não vir no kit de boas-vindas de dev." | Ironia leve sobre a lacuna educacional — dial alto, tolerado por essa geração. |
| 4 — Dor educativa | Primeira vez ouvindo sobre Anexo | "Seu enquadramento tributário depende da atividade exercida." | "Ninguém te ensinou isso na faculdade, eu sei. Anexo é só a 'prateleira' de imposto que sua atividade cai. Eu te encaixo na certa." | Reconhece que ela não teve a experiência prévia (CLT) pra já saber isso. |
| 5 — Mitos | "Só formaliza quando já ganha bem" | "Tem gente que acha que só precisa se formalizar quando já tá ganhando muito." | "Esperar 'ganhar bem' pra abrir CNPJ é o motivo de trocentos freelancer pagar imposto de pessoa física, que é pior. Quanto antes, menos dor." | Desmonta o mito específico que atrasa a formalização precoce. |
| 6 — Calendário fiscal | DAS mensal | "Não esqueça do DAS." | "DAS todo mês, no automático, que nem assinatura de streaming que você nem lembra que paga — só que essa te poupa dinheiro, não gasta." | Analogia com o universo dela (assinaturas digitais). |
| 7 — Educação fiscal/enquadramento | Fator R / Anexo (repete o gancho do pilar 4 com outro ângulo) | "O Fator R pode alterar sua alíquota." | "Fator R é tipo aquele achievement escondido que ninguém te conta como destravar. Eu já sei o caminho." | Metáfora de game/tech, fala a língua dela sem forçar. |
| 8 — Diferencial | Moderno × sólido | "Nosso app é o mais moderno do mercado." | "Não é sobre ser bonito. É sobre ter gente de carne e osso com 22 anos de prática por trás de um app que parece ter nascido ontem." | Contrasta modernidade com solidez — atrativo pra quem valoriza os dois. |
| 10 — Oferta | Cadastro sem burocracia | "Assine agora." | "Cadastro pelo celular, sem burocracia de formulário grandão. Se não gostar, cancela igual cancelaria qualquer assinatura." | Linguagem de consumo digital nativo dela. |
| 11 — Migração | Recebendo por CPF, sabe que devia ter CNPJ | "Migre facilmente pra nossa plataforma." | "Se você tá recebendo por CPF ainda e sabe que devia ter CNPJ, começar agora evita imposto retroativo que ninguém quer descobrir depois." | Fala a um cenário real dela — informal, mas ciente do risco. |
| 12 — Gestão do dinheiro do dono | Primeiro pró-labore da vida | "Calcule seu pró-labore." | "Primeira vez tirando um 'salário' de você mesma? Eu calculo certo, sem você ter que aprender contabilidade pra isso." | Reconhece que é a primeira experiência dela com o conceito. |
| 13 — Documentação em dia | Certidão pedida por cliente grande | "Mantenha documentação em dia." | "Contrato de cliente grande pode pedir certidão que você nem sabia que existia. Eu já deixo isso pronto, antes de você precisar correr atrás." | Previne a surpresa no momento exato de crescimento de carreira. |
| — Onboarding (transversal) | Cadastro inicial | "Acesse o painel e complete seu cadastro." | "Tudo pelo celular, do jeito que você já faz tudo. Sem ligação, sem papel." | Celular primeiro, nunca telefone/papel como padrão. |

## Mapeamento de pilar — onde ela se conecta 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §11 — não é regra travada, é encaixe natural. Numeração de pilar v3 (`estrategia-organica.md`).

| # | Pilar | Encaixe | Por quê |
|---|---|---|---|
| 1 | Bastidor fundador | 🟢 Forte | Identificação forte com "quem constrói" — mesma geração, mesma linguagem de builder |
| 2 | Cultural/leve | 🟢 Forte | Dial alto (herdado de A) — tolera e aprecia humor de marca |
| 3 | Nossa origem | 🟡 Médio | "22 anos" é menos relevante pra quem não tem ponto de comparação com o "antes" tradicional |
| 4 | Dor educativa | 🟢 Forte | Realmente não sabe o básico — é o hook mais honesto pra esta dorsal |
| 5 | Mitos/crenças erradas | 🟢 Forte | Desmontar "só formaliza quando ganha bem" é crítico pro perfil dela |
| 6 | Calendário fiscal | 🟡 Médio | Relevante, mas mais preventivo que aliviador — ainda não tem histórico de "já vivi isso" |
| 7 | Educação fiscal/enquadramento | 🟢 Forte | Primeira vez ouvindo — é onde ela mais precisa e mais aprecia clareza |
| 8 | Diferencial vs mercado | 🟡 Médio | Sem "concorrente anterior" pra comparar — pilares 4/7 importam mais que este |
| 9 | Bastidor/processo | 🟡 Médio | Relevante, mas secundário |
| 10 | Oferta/conversão | 🟢 Forte | Decide rápido, sem processo longo de comparação (documentado na jornada) |
| 11 | Migração/troca de contador | ❌ Fraco | Ela não teve contador antes — é o oposto do perfil de migração |
| 12 | Gestão do dinheiro do dono | 🟢 Forte | Primeira experiência de pró-labore — novidade genuína, hook único |
| 13 | Documentação em dia | 🟡 Médio | Relevante quando cresce (cliente grande pedindo certidão), mas não é dia-1 |
| 14 | Prova/reação (standby) | 🟡 Médio | Relevante, mas não decisivo pro perfil dela |
| 15 | Participativo (standby) | 🟢 Forte | Geração ativa em comunidade — fonte mais provável de UGC quando reativado |
| Momentâneo | Lançamento/promoção | 🟢 Forte | Early-adopter nata, gosta de novidade/vaga fundador |

## Reação a crítica/ataque 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §10. Dial alto — tolera humor até na resposta, mas cuidado nunca vira julgamento da inexperiência dela.

| Tipo de comentário | Marca NÃO faz (pra este perfil) | Marca faz |
|---|---|---|
| "Isso é golpe, vão sumir com meu dinheiro" | Resposta seca ou institucional demais | Prova rápida com tom próximo: "bora, manda DM que te mostro tudo — CNPJ, contrato, CRC do contador" |
| "Não sei nem o que perguntar" (insegurança pública) | Assumir que ela sabe o vocabulário | Convida a perguntar sem julgamento, explica termo a termo se precisar |
| "Não serve pro meu caso" | Fingir que serve | Confirma o limite com transparência, sugere alternativa se souber |
| Troll/hate sem argumento | Se rebaixar ou ignorar friamente | Resposta curta e espirituosa, sem se rebaixar — toque de humor é permitido aqui (dial alto) |
| Crítica de concorrente disfarçada | Nomear concorrente | Fala do problema geral do mercado, com um toque de humor de marca — esta audiência aprecia |

## Referência visual fixa 🆕 (26/08)

> Mesmo espírito do `personagem-leo.md` §12. Segue o brief de humano-IA travado (`decisoes-marca.md` 26/08, item 10): fotorrealista, diversidade ampla, etnia travada em características brasileiras (sudeste). Prompt otimizado pra teste no nano banana (Gemini image).

| Atributo | Definição |
|---|---|
| Idade aparente | 22-30 anos |
| Vestuário | Streetwear casual, moderno, sem qualquer traço formal |
| Ambiente | Coworking moderno ou home office jovem — notebook, fones no pescoço, decoração minimalista com plantas |
| Expressão | Animada, confiante, energia jovem |
| Diversidade dentro da dorsal | Gênero variado (explícito no prompt — faltava na v1, corrigido 26/08), etnia brasileira, sudeste |

**Prompt (nano banana / Gemini image):**
```
Photorealistic medium shot of a young Brazilian freelancer/entrepreneur (any gender), mid-20s,
Southeast Brazilian features, working in a modern co-working space or young home office setup —
laptop, headphones resting around the neck, minimalist decor with plants. Casual
streetwear-inspired outfit, confident and upbeat expression, natural bright light. Subtle coral
(#F2643C) accent object in frame. Warm but neutral color grade, no drop shadows, clean flat
lighting, photorealistic. 4:5 vertical aspect ratio. No text, no captions, no logos, no
watermarks.
```

## Pesquisa real agregada (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads) — **honestidade primeiro:** esta pesquisa mapeou 18 profissões/volantes específicos, e nenhuma delas foi desenhada pra validar especificamente esta dorsal (que é definida por um eixo de EXPERIÊNCIA — "nunca passou por CLT" — não por profissão). Não existe seção dedicada a "Persona E" no relatório. O que existe é sobreposição PARCIAL de idade com as pontas mais jovens do GRUPO A (mesmo eixo intelectual, dorsal-irmã mais próxima):

| Critério | Sobreposição parcial encontrada | Limite honesto |
|---|---|---|
| Idade | Designer freelancer: 20-35. Dev freelancer recém-CLT: 25-35. Ambos batem com a faixa 22-31 travada aqui | Mas nenhum dos dois é definido pela ausência de CLT — o dev, inclusive, tem "recém-saído de CLT" no próprio nome, o oposto exato do eixo desta persona |
| Renda | Designer início: R$3.000-8.000. Dev pleno: ~R$7.800 | Consistente com "renda média-alta pro perfil intelectual jovem" já hipotetizado, mas não prova o eixo específico |
| Canais | Instagram/comunidades já aparecem nos volantes jovens de A (designer via Behance/Instagram) | Parcial — não cobre bootcamp/comunidade de primeiro-emprego, que é o canal específico hipotetizado aqui |

**Conclusão honesta:** a pesquisa NÃO resolve a contradição de dado já registrada (`perfil-microempreendedor-mercado.md` diz idade média de mercado é 40,8 anos, "não é público jovem/hustle") nem valida o eixo central desta dorsal (nunca ter passado por CLT). Confiança continua 🔴, sem upgrade. Se Pedro quiser validar esta dorsal de verdade, precisaria de uma pesquisa dedicada (ex: perfil de quem abre CNPJ intelectual com 0 anos de carteira assinada, não recém-formado em geral) — diferente da pesquisa já feita, que foi desenhada por profissão/CNAE, não por trajetória de carreira.

## Cross-refs

- Dorsais irmãs: [[persona-a-servico-intelectual]] (parentesco mais próximo, mesmo eixo intelectual) · [[persona-b-servico-estetico]] · [[persona-c-baixa-familiaridade-digital]] · [[persona-d-mei-puro-permanente]]
- Contradição de dado a resolver: [[perfil-microempreendedor-mercado]]
- Histórico: nasceu volante `a4-jovem-cnpj-servico-intelectual`, promovida a dorsal 26/08
