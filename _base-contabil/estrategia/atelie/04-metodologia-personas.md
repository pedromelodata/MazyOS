---
tipo: verdade
status: vivo
data: 2026-08-05
assunto: metodologia-personas
tags: [pesquisa, personas, marketing]
---

# 👤 Personas — sistema (fonte única)

> **Esta é a FONTE ÚNICA de personas de marketing.** Orgânico, tráfego pago e criativos leem daqui. Nada de persona solta em outro doc.
>
> ⚠️ Diferente de `_arquivo/motor-testes/personas/*.json` — aquelas são **fixtures de QA de fluxo** (nível de letramento digital + gatilhos de estresse de UX), não personas de marketing. Servem de **seed** (traço de comportamento real observado), não de substituto. Achado já registrado pelo próprio vault: `HOME.md` 25º flow (05/08).

## Como o sistema funciona

Aqui **comprador = usuário** sempre (o dono do CNPJ que assina é quem usa o app todo dia) — diferente do template genérico de 3 camadas (que separa "quem paga" de "quem recebe"). Por isso:

- **Camada 1 — dorsais**: as personas permanentes, espinha do negócio.
- **Camada 2 (quem recebe/usa) — NÃO SE APLICA.** Pulada por decisão estrutural do produto, não por preguiça.
- **Camada 3 — matriz mestre**: cruza dorsal × ocasião/contexto × oferta × mensagem-âncora.

## Camada 0 — Governança (como o sistema cresce)

| Tipo | O que é | Vida | Onde mora |
|---|---|---|---|
| **Dorsal** | Persona canônica, base do negócio | Permanente (muda só via decisão registrada) | esta pasta, 1 arquivo por persona |
| **Volante** | Recorte ocasional/sazonal de uma dorsal | Temporária, tem janela de validade | `pesquisa/personas-de-mercado/volantes/<nome>.md` |

### Quando criar uma nova dorsal (precisa dos 3 critérios)
1. **Ocasião/segmento mal-coberto** pelas dorsais atuais.
2. **Volume sustentado** — recorre ao longo do ano, não é pico isolado.
3. **Economia própria fecha** — puxa oferta com CAC/ticket viável (checar contra [[economia-preco-cac]]).

## Camada 1 — Dorsais (fechadas 05/08 com dado real de mercado)

Enriquecidas com [[perfil-microempreendedor-mercado]] (pesquisa externa Gemini/Google Search). Arquivo completo por dorsal em `pesquisa/personas-de-mercado/`.

| Dorsal | Arquivo | Traço-chave | Status |
|---|---|---|---|
| **A — "Direto"** (32-42a, serviço intelectual) | [[persona-a-servico-intelectual]] | dev/consultor, alta familiaridade digital, canal Google Search + indicação | 🟢 fechada |
| **B — "Construindo"** (35-50a, serviço estético/manual) | [[persona-b-servico-estetico]] | transição MEI→ME por teto de faturamento, canal Instagram (83% do setor) | 🟢 fechada |
| **C — "Precisa de mão na mão"** (50+a, baixa familiaridade digital) | [[persona-c-baixa-familiaridade-digital]] | seed = fixture `cida`, 24,5% do universo nacional (bracket estrutural, não marginal) | 🟢 fechada |

Seeds de QA que alimentaram as dorsais: `reta`/`reta-direto` (dev freelancer) → Persona A · `cida` (61a, professora) → Persona C. **Migrante insatisfeito** (flow #2, quem já tem CNPJ e troca de contador) não virou dorsal própria — é **contexto/ocasião** que cruza as 3 dorsais na matriz mestre abaixo, não um segmento demográfico à parte.

### Volantes (recortes de campanha, 05/08)

9 volantes criadas em `pesquisa/personas-de-mercado/volantes/`, cada uma herdando a espinha de uma dorsal e ajustando só gatilho/mensagem/canal/objeção. Nenhuma é dorsal — todas 🟡 hipótese sem pesquisa dedicada, existem pra dar ângulo específico de campanha/CNAE quando a hora chegar, não pra rodar todas de uma vez.

| Volante | Dorsal-mãe | Gatilho específico |
|---|---|---|
| [[a1-dev-freelancer-recem-clt]] | A | contrato PJ na mão, prazo curto pra formalizar |
| [[a2-consultor-senior-migrando]] | A | contador atual falhou, veio via flow migrar |
| a3-designer-recebe-exterior | A | primeiro pagamento internacional — 🔴 gap de produto a confirmar |
| [[b1-cabeleireira]] | B | teto do MEI / precisa contratar |
| [[b2-esteticista]] | B | parceria B2B exige nota formal |
| [[b3-personal-trainer]] | B | academia exige CNPJ pra contratar |
| b4-nutricionista-pj | B | crescimento + profissão regulamentada — 🔴 gap de produto a confirmar |
| [[c1-professor-autonomo-aposentado]] | C | aluno/escola pede nota fiscal |
| c2-artesao-formalizando | C | oportunidade de venda exige CNPJ — 🔴 checar comércio×serviço |

> 3 volantes carregam ressalva de produto (🔴) — não ativar campanha nelas sem confirmar antes que o motor fiscal/escopo do MLP cobre o caso.

## Camada 3 — Matriz mestre

| Ocasião/contexto | Persona principal | Oferta | Mensagem-âncora | Canal prioritário |
|---|---|---|---|---|
| Virando PJ pela 1ª vez (atividade intelectual vedada ao MEI) | A — Direto | ME | "Resolve rápido, sem enrolação, sem pagar imposto a mais" | Google Search alta intenção |
| Batendo no teto do MEI, precisa virar ME | B — Construindo | ME (transição) | "Cresça sem perder o atendimento pessoal" | Instagram + indicação |
| Formalizando por exigência externa, insegura com tecnologia | C — Precisa de mão na mão | MEI/ME simples | "A gente explica cada passo, sem pressa" | WhatsApp/indicação familiar |
| Já tem CNPJ, contador atual falhou (qualquer das 3 dorsais) | A, B ou C via flow migrar | ME (via flow migrar) | "Troque sem dor de cabeça, sem perder nada" | indicação + Google Search |

> Lacuna aberta: nenhuma dorsal cobre ainda o perfil **MEI puro que nunca vai virar ME** (baixo ticket, alto volume, já flagrado como oferta mais frágil em [[economia-preco-cac]] §9) — decisão de tratá-lo como volante ou 4ª dorsal fica pra quando o V0 trouxer dado de volume real.

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
- Fixtures de QA (seed, não substituto): `_arquivo/motor-testes/personas/*.json`
