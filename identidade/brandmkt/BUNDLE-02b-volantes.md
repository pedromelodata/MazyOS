

<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/_template-volante.md
<!-- ============================================================ -->

---
tipo: template
status: draft
---

# Volante — [Nome]

> Herda a espinha de [[persona-X]]. Recorte ocasional/sazonal de contexto — NÃO é dorsal nova. Tem janela de validade; se virar permanente e sustentada, vira candidata a promoção (ver critérios em [[metodologia-personas]]).

| Campo | Valor |
|---|---|
| Dorsal-mãe | |
| Janela de validade | [aberta / até quando] |
| Ocasião/gatilho específico | |

## O que muda vs a dorsal-mãe
- **Gatilho específico:**
- **Mensagem-âncora:**
- **Canal específico (se diferente da dorsal):**
- **Objeção específica (se diferente):**

## O que NÃO muda (herdado da dorsal)
Idade/renda/comportamento digital base, LTV-hipótese geral — ver a dorsal-mãe.

## Status
🟡 hipótese sem pesquisa dedicada — herda confiança da dorsal-mãe, ajustada por lógica de contexto. Promove a dorsal própria só com os 3 critérios (segmento mal-coberto + volume sustentado + economia fecha).


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/a1-dev-freelancer-recem-clt.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-05
assunto: volante-a1
tags: [pesquisa, personas, volante]
---

# Volante — Dev/consultor recém-saído da CLT

> *"Já fechei o contrato, só falta o CNPJ. Quanto tempo isso demora?"*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-a-servico-intelectual]] |
| Janela de validade | aberta (contexto recorrente, não sazonal) |
| Ocasião/gatilho específico | acabou de sair de CLT (rescisão recente) e já tem 1º contrato PJ na mão, com prazo do cliente pra formalizar |

## O que muda vs a dorsal-mãe
- **Gatilho específico:** urgência de prazo — cliente já aprovou, só falta CNPJ. Ansiedade principal é velocidade ("quanto tempo demora de verdade"), não preço
- **Mensagem-âncora:** "CNPJ pronto rápido, sem perder o contrato"
- **Canal específico:** Google Search "abrir CNPJ rápido/urgente", comunidades de indicação de RH que orienta pejotização
- **Objeção específica:** medo de fazer pejotização errada (elo mal resolvido com o vínculo CLT anterior) — dúvida jurídica além da fiscal, cuidado pra não prometer o que é responsabilidade de outro profissional (trabalhista)

## O que NÃO muda (herdado da dorsal)
Idade 32-42, renda, alta familiaridade digital, LTV-hipótese alta — ver [[persona-a-servico-intelectual]].

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads, pesquisa com Google Search grounding).

| Critério | Dado real |
|---|---|
| Idade real | 25-35 (⚠️ mais jovem que os 32-42 herdados da dorsal A — nuance real, não contradição forte) |
| Gênero | Majoritariamente masculino (Pesquisa Salarial Código Fonte 2025) |
| Renda real | Pleno R$7.840 · Sênior R$15.635 · média PJ nacional R$13.344 · remoto exterior R$25.000+ |
| Canais reais | LinkedIn, GitHub, Discord, Reddit (r/brdev), StackOverflow |
| Reclamação real documentada | Frustração com a obrigatoriedade de retirar pró-labore pra atingir 28% do Fator R (evitar Anexo V); dúvidas sobre isenção ISS/PIS/COFINS em exportação de serviço |
| Vocabulário real | Deploy, Commit, Refatorar, Sprint, Bug, Tech Lead, Stack, Daily, "PJtinha" |
| Ambiente real | Home office ergonômico: múltiplos monitores (ultrawide), cadeira high-end, teclado mecânico, LED suave, isolamento acústico pra calls |

## Status
🟡 hipótese enriquecida com pesquisa real (26/08) — ainda sem validação de campo direta do Pedro.


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/a2-consultor-senior-migrando.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-05
assunto: volante-a2
tags: [pesquisa, personas, volante]
---

# Volante — Consultor sênior migrando de contador

> *"Já fui mal atendido antes. Não quero promessa, quero ver funcionando."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-a-servico-intelectual]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | já tem CNPJ, veio de escritório tradicional ou contador solo insatisfeito — usa o flow #2 (migrar), não o de abertura |

## O que muda vs a dorsal-mãe
- **Gatilho específico:** contador atual sumiu, demorou resposta, ou cometeu erro que custou dinheiro (multa, Fator R mal calculado)
- **Mensagem-âncora:** "Troque sem perder nada, sem embaraço" — ver garantia de devolução do flow #2 ([[legalize-flow-2-migrar-construido]])
- **Canal específico:** indicação direta + Google Search "trocar de contador"
- **Objeção específica:** ceticismo alto — já foi decepcionado antes, exige prova concreta (não aceita só promessa de marketing)

## O que NÃO muda (herdado da dorsal)
Idade 32-42 (pode estender um pouco pra cima, perfil mais sênior), alta familiaridade digital, indicação forte — ver [[persona-a-servico-intelectual]].

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 40-60 |
| Gênero | Historicamente masculino, paridade crescente e acelerada em gestão |
| Renda real | R$15.000-40.000+/mês, precificado por hora ou success fee |
| Canais reais | LinkedIn (central B2B), e-mail corporativo, WhatsApp com stakeholders |
| Reclamação real documentada | Risco de exclusão do Simples por sublimite (R$3,6mi municipal/estadual, R$4,8mi federal); Fator R; transição Simples↔Lucro Presumido sem perder rentabilidade |
| Vocabulário real | Assessment, Bottom-line, M&A, Due Diligence, Turnaround, Sinergia, Core business, KPIs, EBITDA |
| Ambiente real | Coworkings executivos de alto padrão (em BH: Savassi/Lourdes), salas envidraçadas, home office minimalista com livros de negócio |

## Status
🟡 hipótese enriquecida com pesquisa real (26/08) — ainda sem validação de campo direta do Pedro.


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/a3-designer.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: volante-a3
tags: [pesquisa, personas, volante]
---

# Volante — Designer freelancer (web/produto)

> *"Trabalho com cliente direto, sem agência no meio. Preciso de CNPJ que aguente contrato sério."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-a-servico-intelectual]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | freelancer de web design/design de produto que cresceu de bico pra fluxo constante de clientes diretos, precisa de CNPJ pra fechar contrato maior |

## O que muda vs a dorsal-mãe

- **Gatilho específico:** portfólio cresceu, cliente maior exige CNPJ pra fechar
- **Mensagem-âncora:** "CNPJ que aguenta contrato de verdade, sem enrolação"
- **Canal específico:** Instagram/behance (portfólio visual), indicação entre designers
- **Objeção específica:** receio de que a contabilidade não entenda a variação de projeto (uns meses cheios, outros fracos)

## O que NÃO muda (herdado da dorsal)

Alta familiaridade digital — ver [[persona-a-servico-intelectual]].

## CNAE de referência

6201-5/02 (Web design), 7410-2/03 (Design de produto) — confirmados no serviço-liso (103).

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 20-35 |
| Gênero | Equilibrado — leve prevalência masculina em UI/UX, feminina em design editorial/social media |
| Renda real | R$3.000-8.000/mês, variação abrupta entre fee mensal e projeto fechado |
| Canais reais | Behance, Dribbble (portfólio internacional), Instagram (captação local), WhatsApp |
| Reclamação real documentada | Revolta por não poder ser MEI legalmente (atividade removida do rol permitido); custo fixo de ME (honorário, certificado digital, taxa de prefeitura) pesa sobre faturamento instável — leva alguns a usar CNAE divergente (ex: Promotor de Vendas) de forma irregular |
| Vocabulário real | Briefing, Refação, Vetorizar, Mockup, Grid, Sangria, Call, Asset, Job, Layout |
| Ambiente real | Monitores de alta fidelidade de cor (IPS/Apple display), mesa digitalizadora ou iPad, decoração pop culture/minimalista |

## Status

🟢 aprovada por Pedro (26/08) — simplificada nesta rodada: a versão anterior (`a3-designer-recebe-exterior`) tinha um ângulo específico de recebimento internacional que virou gap de produto sem solução clara; Pedro pediu pra trocar por uma versão genérica de designer, sem esse ângulo. Enriquecida com pesquisa real no mesmo dia.


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/a5-fotografo-eventos.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: volante-a5
tags: [pesquisa, personas, volante]
---

# Volante — Fotógrafo/filmmaker de eventos

> *"Fechei o casamento do mês que vem. Preciso de nota fiscal, e rápido."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-a-servico-intelectual]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | contratado pra evento único (casamento, festa, formatura) com prazo curto, cliente/buffet exige nota fiscal pra fechar |

## O que muda vs a dorsal-mãe

- **Gatilho específico:** urgência de prazo ligada a UM evento marcado, não fluxo contínuo de contrato
- **Mensagem-âncora:** "CNPJ pronto a tempo do seu próximo evento"
- **Canal específico:** Instagram (portfólio visual), indicação entre fotógrafos/produtoras de evento
- **Objeção específica:** sazonalidade de renda (picos em alta temporada de casamento) — preocupação de pagar mensalidade fixa em mês fraco

## O que NÃO muda (herdado da dorsal)

Alta familiaridade digital, LTV-hipótese alta — ver [[persona-a-servico-intelectual]].

## CNAE de referência

7420-0/04 (Filmagem de festas e eventos) — confirmado no serviço-liso (103).

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 22-45 |
| Gênero | Masculino dominante em filmmaking; equilíbrio tendendo feminino em fotografia social (casamento, família) |
| Renda real | R$4.000-15.000+/mês, severamente sazonal (maio-dezembro concentra receita) |
| Canais reais | Instagram (vitrine indispensável), WhatsApp, Pinterest (referência), Vimeo/YouTube (portfólio) |
| Reclamação real documentada | Teto do MEI (R$6.750/mês) insuficiente pra contrato de audiovisual de alto padrão; impossibilidade de deduzir depreciação de equipamento importado no Simples Nacional |
| Vocabulário real | Job, Diária, Making of, "Foco cravado", Golden hour, Color grading, RAW, Tripé, Gimbal |
| Ambiente real | Bifásico: fim de semana em salões/igrejas/feiras agitadas; dia útil em home office escurecido, monitores calibrados, HDs externos organizados |

## Status

🟡 hipótese enriquecida com pesquisa real (26/08) — ainda sem validação de campo direta do Pedro.


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/a6-tradutor-freelancer.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: volante-a6
tags: [pesquisa, personas, volante]
---

# Volante — Tradutor/intérprete freelancer

> *"Trabalho pra cliente de fora o tempo todo. Preciso que a nota saia certa, sem virar dor de cabeça."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-a-servico-intelectual]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | trabalha via plataforma internacional (tradução técnica/literária/legendagem), recebe em moeda estrangeira com frequência |

## O que muda vs a dorsal-mãe

- **Gatilho específico:** recorrência de recebimento internacional (não é evento único como `a3-designer-recebe-exterior`, é fluxo contínuo)
- **Mensagem-âncora:** "Recebe de fora, resolve por aqui, sem imposto errado"
- **Canal específico:** comunidades de tradutores (grupos fechados, indicação entre pares)
- **Objeção específica:** mesma família da `a3` — precisa confirmar que o produto trata recebimento internacional corretamente antes de prometer

## O que NÃO muda (herdado da dorsal)

Alta familiaridade digital — ver [[persona-a-servico-intelectual]].

## CNAE de referência

7490-1/01 (Serviços de tradução, interpretação e similares) — confirmado no serviço-liso (103).

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 30-50+ |
| Gênero | **Feminino** — predominância massiva e documentada em profissões linguísticas/tradutórias (Pesquisa de Perfil ABRATES) |
| Renda real | R$3.000-10.000+/mês, flutua com câmbio (Dólar/Euro) |
| Canais reais | ProZ (plataforma global), LinkedIn, grupos fechados de Facebook de tradutores, e-mail |
| Reclamação real documentada | Ignorância de contador não-especializado sobre emissão de nota pra tomador fora do Brasil (invoices); insegurança sobre isenção de ISS em serviço exportado e documentação de swift bancário |
| Vocabulário real | Source, Target, Lauda, CAT Tool, Trados, MTPE, Glossário, "revisão cruzada", Deadline |
| Ambiente real | Home office muito silencioso, prateleiras de dicionários técnicos físicos, 2+ monitores grandes (texto fonte + software de tradução) |

## Status

🟡 hipótese enriquecida com pesquisa real (26/08) — gênero corrigido pra feminino (achado documentado, não estava definido antes). Compartilha a mesma ressalva de produto da `a3-designer` original (recebimento internacional).


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/a7-dublador-locutor.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: volante-a7
tags: [pesquisa, personas, volante]
---

# Volante — Dublador/locutor freelancer

> *"O estúdio só fecha contrato com CNPJ. Preciso resolver isso antes da próxima gravação."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-a-servico-intelectual]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | fechou job avulso de dublagem/locução, estúdio/produtora exige CNPJ pra contratar |

## O que muda vs a dorsal-mãe

- **Gatilho específico:** exigência direta do contratante (não é decisão espontânea, é condição pra fechar o job)
- **Mensagem-âncora:** "CNPJ pronto antes do próximo job fechar"
- **Canal específico:** indicação entre dubladores/locutores, grupos de trabalho da categoria
- **Objeção específica:** renda irregular por job — mesma preocupação de sazonalidade da `a5-fotografo-eventos`

## O que NÃO muda (herdado da dorsal)

Alta familiaridade digital — ver [[persona-a-servico-intelectual]].

## CNAE de referência

5912-0/01 (Serviços de dublagem) — confirmado no serviço-liso (103).

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 25-50 (versatilidade vocal permite carreira longa) |
| Gênero | Equilibrado — demanda flutua por tipo de voz |
| Renda real | R$2.000-12.000+/mês, por projeto/cachê |
| Canais reais | Voice123, Bodalgo (plataformas de casting de voz), Instagram, Discord/Clubhouse, WhatsApp |
| Reclamação real documentada | Agências resistem a contratar como PJ (medo de vínculo), forçam Recibo de Pagamento Autônomo (RPA) — desconto de até 11-20% INSS + até 27,5% IRRF na fonte, devastando a margem |
| Vocabulário real | Cabine, "Varejo/Varejão" (locução de oferta agressiva), Coloquial/Natural, "Limpar áudio", Sibilância, Take, Loc/Off |
| Ambiente real | Home studio técnico: cabine acústica isolada (espuma/lã de rocha), microfone condensador, interface de áudio, pop filter, DAW |

## Status

🟡 hipótese enriquecida com pesquisa real (26/08) — ainda sem validação de campo direta do Pedro.


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/a8-professora-idiomas-online.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: volante-a8
tags: [pesquisa, personas, volante]
---

# Volante — Professora de idiomas online

> *"Dou aula pelo computador pro mundo inteiro. A plataforma só repassa se eu tiver CNPJ."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-a-servico-intelectual]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | dá aula de idioma 100% online (plataforma de ensino ou alunos particulares via videochamada), plataforma exige CNPJ pro repasse |

## O que muda vs a dorsal-mãe

- **Gatilho específico:** exigência de plataforma (não decisão espontânea), parecido com `a7-dublador-locutor` mas no contexto de educação
- **Mensagem-âncora:** "Recebe certo da plataforma, sem imposto a mais"
- **Canal específico:** Instagram/TikTok (professoras de idioma têm presença forte em conteúdo educativo), comunidades de professores online
- **Objeção específica:** renda variável por número de alunos/aulas no mês

## O que NÃO muda (herdado da dorsal)

Alta familiaridade digital — ver [[persona-a-servico-intelectual]]. Distinta de `c1-professor-autonomo-aposentado`: aqui o perfil é mais jovem, 100% online, sem o eixo de baixa familiaridade digital.

## CNAE de referência

8593-7/00 (Ensino de idiomas) — confirmado no serviço-liso (103).

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 25-45 |
| Gênero | **Feminino** — histórico pedagógico focado em humanidades/letras no Brasil |
| Renda real | R$3.000-10.000+/mês; infoprodutos escalam além do limite de horas-aula |
| Canais reais | Instagram (Reels de dicas), TikTok, WhatsApp, Zoom/Google Meet |
| Reclamação real documentada | Incerteza crônica sobre CNAE (ensino técnico × idiomas × desenvolvimento pessoal); burocracia de separar faturamento de e-book/curso (regras de ICMS/isenção) do faturamento de aula particular (ISS municipal) |
| Vocabulário real | Trial class, Input, Listening, Tutor, Fluency, Nativo, Lançamento, "aluno ticket alto" |
| Ambiente real | Home office otimizado pra câmera: bookcases estéticas, ring light, quadro branco, headset/microfone de lapela |

## Status

🟡 hipótese enriquecida com pesquisa real (26/08) — gênero corrigido pra feminino (achado documentado).


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/b1-cabeleireira.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-05
assunto: volante-b1
tags: [pesquisa, personas, volante]
---

# Volante — Cabeleireira/salão

> *"Cresci, preciso contratar, mas não quero virar 'empresa grande' e perder o jeito com minhas clientes."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-b-servico-estetico]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | bateu no teto do MEI OU precisa contratar mais de 1 funcionária (limite do MEI) |

## O que muda vs a dorsal-mãe
- **Gatilho específico:** momento de contratar (MEI só permite 1 funcionário) ou teto de faturamento — sinal de crescimento do próprio salão
- **Mensagem-âncora:** "Cresça sem perder o jeito com suas clientes"
- **Canal específico:** Instagram Reels, indicação entre salões/cabeleireiras da mesma região
- **Objeção específica:** habituada a pagar pouco ou nada por contabilidade (informal); resistência de preço mais alta que a média da dorsal

## O que NÃO muda (herdado da dorsal)
Idade 35-50, canal Instagram dominante (83% do setor beleza), transição MEI→ME por teto — ver [[persona-b-servico-estetico]].

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | Distribuída 20-50, estabiliza na maturidade |
| Gênero | **Feminino 83,7%** da base formal (Observatório SEBRAE RAIS 2025) |
| Renda real | Formal média R$1.637; dona de salão R$2.500-6.000 |
| Canais reais | WhatsApp (central de agendamento absoluto), Instagram (portfólio) |
| Reclamação real documentada | Complexidade de implementar a Lei do Salão Parceiro (13.352/2016) — muitos contadores não fazem homologação sindical, deixando o salão exposto a trabalhista; teto do MEI estourado rápido ao repassar cota de parceiras |
| Vocabulário real | Progressiva, Cutilagem, "Esmaltação em gel", "Loiro platinado", "Morena iluminada", Fidelizar, Selagem, Raiz |
| Ambiente real | Loja térrea, espelhos com iluminação embutida branca/neutra, lavatórios, poltronas, carrinho de esmaltes, ring lights |

## Status
🟡 hipótese enriquecida com pesquisa real (26/08) — ainda sem validação de campo direta do Pedro (mas já validada por Pedro pra USO, ver `metodologia-personas.md`).


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/b2-esteticista.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-05
assunto: volante-b2
tags: [pesquisa, personas, volante]
---

# Volante — Esteticista/clínica de estética

> *"Preciso emitir nota certa pras parcerias que fecho com clínicas e academias."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-b-servico-estetico]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | recebendo mais via cartão/parcerias B2B (clínicas, academias) que exigem nota fiscal formal, não só cliente final |

## O que muda vs a dorsal-mãe
- **Gatilho específico:** necessidade de nota fiscal formal pra parcerias corporate, não só atendimento de balcão
- **Mensagem-âncora:** "Nota fiscal certa, sem trabalho extra"
- **Canal específico:** Instagram + indicação entre esteticistas/clínicas
- **Objeção específica:** menor que a de cabeleireira — já lida com formalização em algum grau por causa das parcerias

## O que NÃO muda (herdado da dorsal)
Idade 35-50, canal Instagram, transição por crescimento — ver [[persona-b-servico-estetico]].

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 25-45 |
| Gênero | **Feminino 88,4%** do setor ampliado de beleza/tratamentos (Observatório SEBRAE RAIS 2025) |
| Renda real | Formal R$1.827; dona de estúdio R$4.000-15.000 (margens altas de procedimento) |
| Canais reais | Instagram (essencial pra antes/depois), TikTok, WhatsApp |
| Reclamação real documentada | Angústia com burocracia da Vigilância Sanitária municipal (alvará, laudo de equipamento); dúvida sobre limite MEI (ex: limpeza de pele) × procedimento invasivo que exige Responsabilidade Técnica |
| Vocabulário real | Protocolo, Anamnese, Radiofrequência, Criolipólise, Dermo, "home care", Microagulhamento, Flacidez, Drenagem |
| Ambiente real | Estúdio clean, macas com papel lençol descartável, armários MDF, aparelho de ultrassom/laser, jaleco/scrubs |

## Status
🟡 hipótese enriquecida com pesquisa real (26/08) — ainda sem validação de campo direta do Pedro (já aprovada por Pedro pra USO, ver `metodologia-personas.md`).


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/b3-personal-trainer.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-05
assunto: volante-b3
tags: [pesquisa, personas, volante]
---

# Volante — Personal trainer

> *"Entre um treino e outro eu não tenho tempo pra burocracia."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-b-servico-estetico]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | academia/estúdio exige CNPJ pra contratar como PJ, em vez de autônomo informal |

## O que muda vs a dorsal-mãe
- **Gatilho específico:** exigência contratual externa (academia/estúdio pede CNPJ), não decisão espontânea de crescer
- **Mensagem-âncora:** "Vire PJ sem perder tempo de treino" — velocidade e simplicidade acima de tudo
- **Canal específico:** Instagram + WhatsApp por indicação de alunos/colegas de profissão
- **Objeção específica:** acha que não vai ter tempo/paciência pra lidar com papelada entre atendimentos — precisa de prova de que é rápido de verdade

## O que NÃO muda (herdado da dorsal)
Idade 35-50, canal Instagram, resistência inicial de preço — ver [[persona-b-servico-estetico]].

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 22-40 |
| Gênero | Leve predomínio masculino, mulheres ganhando espaço rápido em musculação/funcional |
| Renda real | R$3.000-12.000+/mês; retenção PF pode chegar a 27,5% via IRPF + INSS |
| Canais reais | Instagram (persona "fitness"), TikTok, WhatsApp |
| Reclamação real documentada | **Maior fonte de ira do grupo B inteiro**: desenquadramento punitivo do MEI pela Receita Federal (considerado profissão intelectual regulamentada via CREF); Fator R (28% de folha) ou mordida de IRPF se não formalizar |
| Vocabulário real | Shape, "Falha concêntrica", Hipertrofia, Periodização, Cardio, Bi-set, PR (Personal Record), Drop-set |
| Ambiente real | Academia: espelhos grandes, máquinas metálicas, anilhas emborrachadas, roupa dry-fit, tripé de celular |

## Status
🟡 hipótese enriquecida com pesquisa real (26/08) — confirma e aprofunda o gap de regulamentação já registrado (CREF, tier "tato"). Já aprovada por Pedro pra USO, ver `metodologia-personas.md`.


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/b5-produtor-eventos.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: volante-b5
tags: [pesquisa, personas, volante]
---

# Volante — Produtora/produtor de eventos

> *"Cresci de organizar festinha de amigo pra fechar feira e congresso. Preciso contratar gente e não sei nem por onde começar com nota fiscal disso."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-b-servico-estetico]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | negócio de organização de eventos cresceu, bateu teto do MEI e/ou precisa contratar equipe temporária pra eventos maiores |

## O que muda vs a dorsal-mãe

- **Gatilho específico:** crescimento de escala de evento (de pequeno pra feira/congresso), não é sobre estética/beleza mas o mesmo eixo de "cresci, preciso virar ME"
- **Mensagem-âncora:** "Cresça de porte de evento sem perder o controle do financeiro"
- **Canal específico:** Instagram (portfólio de eventos), indicação entre fornecedores do setor
- **Objeção específica:** contratação temporária/sazonal de equipe complica a folha — dúvida se o produto lida bem com isso

## O que NÃO muda (herdado da dorsal)

Transição MEI→ME por teto de faturamento, canal Instagram — ver [[persona-b-servico-estetico]].

## CNAE de referência

8230-0/01 (Serviços de organização de feiras, congressos, exposições e festas) — confirmado no serviço-liso (103).

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 30-50 |
| Gênero | Equilibrado — predominância feminina em cerimonial/logística, masculina em montagem técnica |
| Renda real | R$5.000-20.000+/mês, fragmentada e sazonal (setor de eventos movimenta R$813,5bi/ano no Brasil) |
| Canais reais | E-mail, WhatsApp intenso com fornecedores, LinkedIn, Instagram |
| Reclamação real documentada | Guerra fiscal do ISS — quando o evento é em município diferente do prestador/tomador, prefeituras exigem retenção no local da prestação, gerando bitributação e multa; alta burocracia de prestação de contas |
| Vocabulário real | "Rider técnico", Backstage, Borderô, A&B (Alimentos e Bebidas), Staff, Credenciamento, "Run of show", "Passagem de som" |
| Ambiente real | Trânsito entre home office administrativo e feiras/pavilhões (ex: Expominas em BH), palco escuro, cabos multivias, rádio HT |

## Status

🟡 hipótese enriquecida com pesquisa real (26/08) — ainda sem validação de campo direta do Pedro.


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/b6-professora-danca-estudio.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: volante-b6
tags: [pesquisa, personas, volante]
---

# Volante — Professora de dança com estúdio próprio

> *"Meu estúdio lotou. Preciso contratar mais uma professora, mas não quero virar 'empresa grande' e perder o clima da turma."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-b-servico-estetico]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | estúdio de dança/estética cresceu, bateu teto do MEI ao contratar mais de 1 professora/funcionária |

## O que muda vs a dorsal-mãe

- **Gatilho específico:** mesma lógica de `b1-cabeleireira` (teto do MEI por contratação), aplicada a estúdio de dança/atividade física em vez de salão de beleza
- **Mensagem-âncora:** "Cresça sem perder o clima da sua turma"
- **Canal específico:** Instagram Reels (aulas/coreografias), indicação entre alunas
- **Objeção específica:** igual `b1` — habituada a informalidade, resistência de preço mais alta

## O que NÃO muda (herdado da dorsal)

Idade 35-50, canal Instagram dominante, transição MEI→ME por teto — ver [[persona-b-servico-estetico]].

## CNAE de referência

8592-9/01 (Ensino de dança) — confirmado no serviço-liso (103).

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 20-40 |
| Gênero | Feminino |
| Renda real | R$2.000-6.000/mês, acumulado com múltiplas jornadas (aulas + eventos) |
| Canais reais | Instagram/TikTok (vídeos de coreografia), WhatsApp com alunos |
| Reclamação real documentada | Sazonalidade agressiva — teto do MEI estourado em dezembro por venda de ingresso/figurino/patrocínio de festival de fim de ano, gerando desenquadramento compulsório inesperado |
| Vocabulário real | "Oito" (contagem), Tempo, Marcação, Plié, Ponta, Coreo, "Limpar o movimento", Aquecimento |
| Ambiente real | Estúdio de piso de madeira flutuante, paredes espelhadas, caixa de som Bluetooth, barra de apoio |

## Status

🟡 hipótese enriquecida com pesquisa real (26/08) — ainda sem validação de campo direta do Pedro.


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/c1-professor-autonomo-aposentado.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-05
assunto: volante-c1
tags: [pesquisa, personas, volante]
---

# Volante — Professor(a) autônomo aposentado

> *"Será que vale a pena formalizar por tão pouco dinheiro?"*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-c-baixa-familiaridade-digital]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | aposentado(a) dando aula particular/reforço pra complementar renda; aluno ou escola pede nota fiscal (seed direto = fixture `cida`) |

## O que muda vs a dorsal-mãe
- **Gatilho específico:** exigência externa pontual (pai de aluno ou escola pede nota), não ambição de crescer o "negócio"
- **Mensagem-âncora:** "A gente cuida de tudo, você só dá aula"
- **Canal específico:** indicação familiar, WhatsApp — sem presença relevante em redes sociais
- **Objeção específica:** dúvida sobre se vale a pena o custo/esforço pra um volume pequeno de renda — precisa de resposta honesta sobre quando NÃO compensa formalizar

## O que NÃO muda (herdado da dorsal)
Idade 50+, baixa familiaridade digital, precisa de modo assistido — ver [[persona-c-baixa-familiaridade-digital]].

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 50-65+ |
| Gênero | Feminino |
| Renda real | R$1.000-3.500/mês, renda extra atrelada ao calendário do ano letivo |
| Canais reais | WhatsApp direto com pais, quase zero vídeo/Reels |
| Reclamação real documentada | Pânico de que o MEI interfira ou suspenda aposentadoria do INSS, especialmente pensão por invalidez |
| Vocabulário real | "Fixar o conteúdo", "Dificuldade na matéria", Caderno, Didática, "Reforço escolar", "Prova final" |
| Ambiente real | Mesa de jantar/escritório doméstico adaptado, apostilas impressas, livros didáticos físicos |

## Status
🟡 hipótese enriquecida com pesquisa real (26/08) — seed forte (fixture `cida` é praticamente este caso); ainda sem validação de campo direta do Pedro.


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/c3-mecanico-oficina.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: volante-c3
tags: [pesquisa, personas, volante]
---

# Volante — Mecânico de oficina de bairro

> *"Conserto carro há 20 anos. Cliente novo tá pedindo nota, e eu nunca mexi com isso."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-c-baixa-familiaridade-digital]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | oficina de bairro, cliente (às vezes empresa de frota) exige nota fiscal, dono nunca formalizou por não ver necessidade até agora |

## O que muda vs a dorsal-mãe

- **Gatilho específico:** pressão externa de cliente específico, igual à doutrina geral da dorsal C (formaliza por exigência, não ambição)
- **Mensagem-âncora:** "A gente explica cada passo, sem pressa — você continua no carro, a gente cuida do resto"
- **Canal específico:** WhatsApp, indicação de outros donos de oficina
- **Objeção específica:** desconfiança de "burocracia que não entendo" mais forte que a média da dorsal — trabalho manual, pouco tempo de tela

## O que NÃO muda (herdado da dorsal)

50+ anos (plausível, mas não exclusivo), baixa familiaridade digital, canal WhatsApp — ver [[persona-c-baixa-familiaridade-digital]].

## CNAE de referência

4520-0/01 (Serviços de manutenção e reparação mecânica de veículos automotores) — confirmado no serviço-liso (103).

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 35-55 |
| Gênero | **Masculino**, esmagadora maioria em MG (Sindirepa-MG) |
| Renda real | R$4.000-20.000/mês; consultoria de gestão eleva receita em até 40% |
| Canais reais | WhatsApp (áudio/foto/vídeo de orçamento), Google Maps |
| Reclamação real documentada | "Pesadelo" da Substituição Tributária (ST) de ICMS em peças + ISS de mão de obra no mesmo serviço; sem controle de estoque perde até 40% de margem |
| Vocabulário real | Retífica, "B.O.", "Dar um talento", "Chicote elétrico", Scanner, "Orçamento sem compromisso", Fundiu |
| Ambiente real | Galpão com piso de graxa, elevador automotivo, bancada de chaves, cheiro de óleo, motor desmontado |

## Status

🟡 hipótese enriquecida com pesquisa real (26/08) — ainda sem validação de campo direta do Pedro.


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/c4-tecnico-conserto-eletronicos.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: volante-c4
tags: [pesquisa, personas, volante]
---

# Volante — Técnico de conserto de eletrônicos/celular

> *"Arrumo celular, TV, essas coisas. Um cliente pediu nota e eu travei."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-c-baixa-familiaridade-digital]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | conserta eletrônicos/celulares de bairro, cliente pede nota fiscal, mesma lógica de `c3-mecanico-oficina` num ofício diferente |

## O que muda vs a dorsal-mãe

- **Gatilho específico:** igual `c3` — pressão externa de cliente específico
- **Mensagem-âncora:** "A gente explica cada passo, sem pressa"
- **Canal específico:** WhatsApp, indicação de bairro
- **Objeção específica:** igual `c3` — desconfiança de burocracia

## O que NÃO muda (herdado da dorsal)

Baixa familiaridade digital, canal WhatsApp — ver [[persona-c-baixa-familiaridade-digital]].

## CNAE de referência

9521-5/00 (Reparação e manutenção de equipamentos eletroeletrônicos de uso pessoal e doméstico) — confirmado no serviço-liso (103).

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 25-45 |
| Gênero | Masculino |
| Renda real | R$2.500-7.000/mês, margem subsidiada por revenda de película/capa |
| Canais reais | Grupos de Facebook (troca de componente), WhatsApp, vitrine presencial |
| Reclamação real documentada | Burocracia de origem de peça (compra aparelho quebrado como "sucata" sem NF de entrada); estoque de peça "paralela" importada sem NFe |
| Vocabulário real | Reballing, "Placa-mãe", "Tela paralela", Curto, "Banho químico", Oxidação, Touch, "Aparelho morto" |
| Ambiente real | Bancada com tapete antiestático, microscópio trinocular, estação de solda ar quente, pinça de precisão, gaveteiro acrílico |

## Status

🟡 hipótese enriquecida com pesquisa real (26/08) — ainda sem validação de campo direta do Pedro.


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/d1-chaveiro.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: volante-d1
tags: [pesquisa, personas, volante]
---

# Volante — Chaveiro

> *"Faço chave e conserto fechadura. Não penso em virar empresa grande, só quero resolver o imposto sem gastar tempo com isso."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-d-mei-puro-permanente]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | MEI de ticket baixo e recorrente, sem intenção nem cenário de crescer pra ME |

## O que muda vs a dorsal-mãe

- **Gatilho específico:** nenhum evento especial — é o exemplo mais puro da Dorsal D (simplicidade permanente, não fase de transição)
- **Mensagem-âncora:** "Simples de verdade, sem crescer virar dor de cabeça"
- **Canal específico:** WhatsApp/indicação de bairro
- **Objeção específica:** preço-sensibilidade alta — "já pago pouco/nada hoje, por que pagaria?"

## O que NÃO muda (herdado da dorsal)

Ticket baixo, intenção de permanência, canal de baixo investimento digital — ver [[persona-d-mei-puro-permanente]].

## CNAE de referência

9529-1/02 (Chaveiros) — confirmado no serviço-liso (103).

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 35-60 |
| Gênero | **Masculino 74,5%** (Observatório SEBRAE RAIS 2025) |
| Renda real | Empregado formal R$1.885; dono MEI R$2.400-4.500 |
| Canais reais | Google Meu Negócio/Maps, WhatsApp |
| Reclamação real documentada | Distância entre pagamento em espécie e exigência do Fisco (R$75/mês DAS-MEI corrói margem); 93% das novas empresas do setor em 2025 foram MEI |
| Vocabulário real | "Miolo da fechadura", "Chave tetra", Segredo, "Canivete", Codificada, Mixa, "Dar um passe" |
| Ambiente real | Quiosque metálico minúsculo, parede coberta de matrizes de chave, barulho de esmeril |

## Status

🟡 hipótese enriquecida com pesquisa real (26/08) — ainda sem validação de campo direta do Pedro.


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/d2-sapateiro-reparo-calcados.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: volante-d2
tags: [pesquisa, personas, volante]
---

# Volante — Sapateiro / reparo de calçados e bolsas

> *"Conserto sapato e bolsa há anos. Não penso em crescer, só quero ficar em dia sem enrolação."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-d-mei-puro-permanente]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | mesma lógica de `d1-chaveiro` — MEI de ticket baixo, permanente por escolha |

## O que muda vs a dorsal-mãe

- **Gatilho específico:** igual `d1`, ofício diferente
- **Mensagem-âncora:** "Simples de verdade, sem crescer virar dor de cabeça"
- **Canal específico:** WhatsApp/indicação de bairro
- **Objeção específica:** igual `d1` — preço-sensibilidade alta

## O que NÃO muda (herdado da dorsal)

Ver [[persona-d-mei-puro-permanente]].

## CNAE de referência

9529-1/01 (Reparação de calçados, de bolsas e artigos de viagem) — confirmado no serviço-liso (103).

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 45-65+ (bairro tradicional) / 30-45 (franquia) |
| Gênero | Masculino predominante em reparo pesado; feminino 64,8% em acabamento/atendimento |
| Renda real | Modelo bairro R$1.500-2.500; franquia — conserto é 60% da receita |
| Canais reais | Fachada física + WhatsApp (foto de sola gasta); Instagram só em restauro de grife/sneaker |
| Reclamação real documentada | Dificuldade de contratar CLT (jovens rejeitam o ofício); salário do setor R$1.759-1.921; gargalo trabalhista pra quem expande |
| Vocabulário real | "Meia sola", "Solado vulcanizado", "Costura de vira", Palmilha, "Cola de sapateiro", Sovela, "Dar um brilho" |
| Ambiente real | Polarizado: sapataria de bairro tradicional vs franquia de shopping |

## Status

🟡 hipótese enriquecida com pesquisa real (26/08) — ainda sem validação de campo direta do Pedro.


<!-- ============================================================ -->
# ARQUIVO: 02-personas/volantes/d3-teleatendente-freelancer.md
<!-- ============================================================ -->

---
tipo: original
status: vivo
data: 2026-08-26
assunto: volante-d3
tags: [pesquisa, personas, volante]
---

# Volante — Teleatendente/atendimento remoto freelancer

> *"Atendo de casa, é um bico que já virou renda fixa. Não sei nem se preciso de CNPJ pra isso."*

| Campo | Valor |
|---|---|
| Dorsal-mãe | [[persona-d-mei-puro-permanente]] |
| Janela de validade | aberta |
| Ocasião/gatilho específico | presta serviço de teleatendimento/atendimento remoto recorrente pra empresa contratante, que passa a exigir CNPJ formal |

## O que muda vs a dorsal-mãe

- **Gatilho específico:** exigência do contratante (parecido com `a7`/`a8`), mas em ticket baixo e sem intenção de crescer — encaixe direto na Dorsal D
- **Mensagem-âncora:** "Resolve o CNPJ, continua no bico do jeito que já é"
- **Canal específico:** WhatsApp, grupos de trabalho remoto/home office
- **Objeção específica:** dúvida se vale a pena formalizar pra uma renda que considera "só um bico"

## O que NÃO muda (herdado da dorsal)

Ver [[persona-d-mei-puro-permanente]].

## CNAE de referência

8220-2/00 (Atividades de teleatendimento) — confirmado no serviço-liso (103).

## Pesquisa real (Google Search, 26/08) 🆕

Fonte: `Pesquisa Perfis Microempreendedores Belo Horizonte.md` (Downloads).

| Critério | Dado real |
|---|---|
| Idade real | 25-45 |
| Gênero | **Feminino** — mães buscando home office total |
| Renda real | R$1.500-4.000+/mês; bilíngue em dólar pode triplicar |
| Canais reais | Workana, 99freelas, Instagram, Slack/Trello/Asana/Drive, WhatsApp corporativo |
| Reclamação real documentada | Pavor de que CNAE de apoio empresarial caia no Fator R (Anexo III/V); contratantes recusam RPA/sem-CNPJ por medo de "pejotização irregular" (MPT) |
| Vocabulário real | Task, "Follow-up", Inbox, "BPO Financeiro", Prospect/Lead, "Gestão de agenda", Dashboard, SLA |
| Ambiente real | Home office camaleônico/improvisado, laptop+internet estável, planner físico sobre teclado, dashboard Zendesk/CRM |

## Status

🟡 hipótese enriquecida com pesquisa real (26/08) — ainda sem validação de campo direta do Pedro.
