---
name: reels-leo
description: >
  Construtor de reels curtos do Legalizaí. Ajuda nas três decisões do reel, nesta ordem: gancho
  (3 opções do banco curado em references/ganchos.md), CTA do objetivo (references/ctas.md) e
  narração, que sai do gancho escolhido e fecha na CTA escolhida. Pensa com a cabeça do Léo, o
  suricato-sentinela da marca, e segue as regras duras do Legalizaí. Todo número, prazo, preço e
  regra sai da base contábil (_base-contabil/FATOS.md, com id de fato) e passa pelo PROIBIDO.md.
  Linguagem de gente e pouca coisa na tela. Entrega roteiro em BLOCOS (gancho, beats, CTA, cada
  um com fala, em cena, b-roll de references/broll.md e, só se ajudar, na tela) + legenda de até
  2.200 caracteres (CTA de objetivo, desenvolvimento, CTA final). Use quando pedirem reel, roteiro,
  gancho, hook, narração, CTA, legenda, b-roll, "reescreve esse reel", "ideia de reel", "roteiro do
  Léo", "fala do Léo", cronograma de reels ou Banco de Ideias. Vale também pro carrossel e o
  estático do cronograma. Neste workspace substitui a /reels e a reels-curtos: o fluxo delas está
  no §7 e o banco genérico de ganchos foi trocado pelo banco curado (se alguma delas for carregada
  junto, vale esta).
---

# reels-leo

Um reel do Legalizaí tem uma cabeça só: **a do Léo**. Mesmo quando quem fala é o Pedro, o
time ou "a gente", o texto pensa como ele: vigia o prazo antes, ri do sistema, nunca da pessoa.
E o Léo não chuta: número que ele não leu na base, ele não fala.

Esta skill é o **construtor de reels curtos**. Ela te ajuda nas três decisões que fazem o reel,
nesta ordem: **gancho, CTA e narração**. A narração sai do gancho escolhido e fecha na CTA
escolhida. B-roll, tela e legenda servem a essas três.

**Antes de escrever, leia:**

- `_memoria/*.md`. Onde a memória discordar da base, vale a base. As divergências conhecidas: o
  preço de promoção R$ 19 e R$ 79 que ainda aparece em `empresa.md` e `estrategia.md` morreu (F006);
  a tabela de pilares de `_memoria/estrategia.md` é a v3 (6 e 7 ativos, sem 16 e 17), e vale a v4
  do §5; a CTA "Simule seu Fator R grátis" de `preferencias.md` morreu, porque o simulador não é
  link que existe (F009).
- `_base-contabil/FATOS.md` e `_base-contabil/PROIBIDO.md`, inteiros (passo 0).
- `references/ganchos.md`: os ganchos do banco de 1000 e do Construtor, adaptados ao nicho, por
  categoria, pilar e tipo, com o fato que entrega cada um.
- `references/banco-1000-ganchos.md`: o banco original de 1000, numerado. **Regra do Pedro
  (09/10/2026): todo reel abre com um gancho do banco** (o código G da curadoria ou o número do
  banco original, adaptado ao assunto). Gancho inventado fora do banco não sai.
- `references/ctas.md`: as CTAs por objetivo, na escada de cada tipo.
- `references/broll.md`: os 100 takes auditados e os takes próprios do Legalizaí, por momento do
  reel e por pilar.
- Pra formatos, `cronograma/data/biblioteca.json` (ignore o campo `referencia`; nunca cite de onde
  o formato veio). Os temas de `cronograma/data/estilos.json` são pista de assunto, não fonte de
  número, e as CTAs de lá só valem se passarem no `ctas.md`. `cronograma/data` é dado vivo: esta
  skill só lê, nunca grava ali.

## Estratégia principal (vale em toda peça, junto com o §0)

Fonte: `marketing/estrategia/ESTRATEGIA-PRINCIPAL.md` (Pedro, 21/10/2026: "deve ser seguido de forma
100%"). O resumo pra usar na peça, com os nomes exatos de pilares, ângulos, gatilhos e personas, está em
`references/estrategia.md`. Leia os dois antes do §7. As regras de copy não mudam a estratégia: valem
na hora de escrever o texto.

1. **Ideia do calendário é usada como está** (Pedro, 21/10/2026). Se a ideia vem do calendário da
   semana (`_base-contabil/estrategia/AAAA-MM-DD-calendario-editorial-semana-*.md`), a ideia, o
   formato, o pilar e o motivo (a "defesa") entram EXATAMENTE como estão: nada de tirar, descartar ou
   reescrever. A skill escreve o texto da peça em volta dela. Bateu numa regra de copy (P11,
   P09...)? A ideia fica, o trecho vai marcado PENDENTE e você avisa o conflito pro Pedro decidir, sem
   inventar a troca. A P39 não é pendência: vale em tudo (Pedro, 22/10/2026; seção 0 da estratégia).
2. **Três escolhas e um motivo.** Todo reel nasce de um pilar × um gatilho emocional × um gatilho
   psicológico. A entrega abre com o bloco ESTRATÉGIA (molde no §15 do resumo): os três, o bloco (Afeto
   20%, Educação 30%, Diferencial 25%, Conversão 25%), a persona, o Léo e o MOTIVO (por que o post
   existe, em uma ou duas frases). Sem motivo, a peça não está pronta.
3. **Pilares:** 13 ativos; os guardados (6, 7, 14 e 15) não entram como pauta. No 8, os 9 ângulos giram,
   e nenhum concorrente aparece. Pilar 3 (Nossa origem): a origem do Legalizaí e de quem constrói o
   produto novo (Pedro, 22/10/2026), com a P39 valendo.
4. **Léo e persona**, como o calendário usa: Léo fora dos pilares 1 e 3 (voz do Pedro ou da empresa),
   forte nos 2, 4, 5 e 16, só no gancho nos demais. Dial de ironia pela persona (A e E alto, B médio, D
   baixo, C zero). A ironia mira o sistema, nunca o cliente.
5. **Convite em 2 níveis.** Nível 1 no corpo (salvar, depois mandar ou compartilhar, depois comentar);
   nível 2 no fim da legenda e na bio, pelo estágio do funil. Post de atração não leva convite de venda.
6. **Anti-repetição** antes de entregar: compare pilar, ângulo e gancho com as peças recentes (onde
   olhar: §11 do resumo). Repetiu? Outro pilar ou ângulo. De propósito? Diga e registre a exceção com
   o motivo. Alerta, não bloqueio.
7. **Continuidade:** a caixinha "Pergunta que ninguém explica" é quinzenal (caixinha numa semana,
   "Traduzindo o contabilês" na seguinte). Formatos especiais: "O app em X segundos", "Traduzindo o
   contabilês" e o simulador só como apoio.
8. **O app chega dia 10/11/2026** (Pedro, 14/10/2026): diga a data, por cima do "o app que tá chegando"
   da regra 8 do §4. WhatsApp não entra como canal da Legalizaí por enquanto: o aviso é "no app".

## Campanha de lançamento (vigente desde 26/10/2026)

Pedro, 26/10/2026: todo vídeo e toda peça estática seguem o mote do lançamento e a unidade visual "Luz Coral" até ele
avisar outro mote. O resumo (as 4 camadas, as fases, as 6 regras do mote, o que fica fora, persona e Léo) está no §0 de
`references/estrategia.md`; a imagem e o take (blocos de prompt, motor de vídeo, conferência), na seção da Luz Coral
de `references/broll.md`. As fontes mandam: `_base-contabil/lancamento/` e `_base-contabil/video-ia/`.

- **As frases, palavra por palavra:** mote-mãe "100% digital. E 100% humana." · promessa
  "A gente devolve o seu tempo." · promocional "A parte chata muda de dono." (na contagem, de 28/10 a 09/11:
  "Dia 10/11, a parte chata muda de dono.") · fecho "Vai, legaliza aí." (com vírgula).
- **No reel:** o gancho continua saindo do banco (§8) e a última fala continua sendo a CTA (Etapa 3). O vídeo fecha numa
  camada do mote e em "Vai, legaliza aí.", com o logo entrando e o "ai" do logo acendendo em coral; o nome não é falado
  antes (ADR 13/08). O promocional com convite da lista só em peça de Conversão. No vídeo emocional, o mote vem em dois
  tempos ("100% digital." no toque do celular, "E 100% humana." na volta pra quem ama), com gente sem rosto e o Léo só
  no último quadro.
- **As 6 regras do mote** já estão no §4; o que soma: sem emoji na tela e no vídeo; "primeira", "única", "melhor" e
  "mais barata" fora; no MEI, quem cuida é o Léo (assistente virtual). O pilar "História" do mote ("22 anos") e a ideia
  "Do outro lado" ficam fora (P39).
- **Em cena e b-roll na Luz Coral:** um humor por cena (hora chata na dor, hora devolvida na solução e no fecho), um
  objeto coral por quadro, só os 4 planos (MESA, MÃO, OMBRO, ENTRADA), um gesto por take, criança gerada por IA nunca
  (P35). Take de IA segue o motor de vídeo, e os quadros-chave e a prévia vão pro Pedro antes de gastar crédito no take
  final.

---

## 0. Base contábil: obrigatório, antes de uma linha de roteiro

Roteiro com número inventado vira multa. A base é `_base-contabil/`, cópia do vault do produto
(a mesma base que o Léo do WhatsApp consulta com cliente real).

1. **Sincronize.** Fora do app do cronograma, rode `node scripts/sincronizar-base-contabil.mjs`
   (ou confira no `_base-contabil/README.md` que a sincronização é de hoje). Se o script disser que
   algum arquivo mudou, ou que o FATOS.md foi conferido contra outro commit, pare e avise o Pedro:
   FATOS.md precisa de revisão antes da peça. No app do cronograma a base já chega no contexto.
2. **Leia inteiros** `_base-contabil/FATOS.md` e `_base-contabil/PROIBIDO.md`.
3. **Escolha os fatos antes do gancho.** Anote os ids (F0xx) que a peça vai usar. A tese nasce dos
   fatos; nunca o contrário.
4. **Todo número, data, prazo, preço, percentual, regra de órgão ou afirmação legal** (na fala, na
   tela, na legenda, no slide, na capa) cita o id em Fontes, no molde `F077 · 07-OBRIGACOES-MENSAIS §5`.
   O id vai só em Fontes, nunca no texto publicado.
5. **Não está em FATOS.md? Não é dito.** As saídas são as do Léo do WhatsApp: tira o número ("o app
   mostra o valor certo", "confirma com a gente") ou deixa o assunto pra outra peça e avisa o Pedro do
   buraco. Nada de "por volta de", "geralmente", "em média" pra tapar fato que falta. Dado de mercado
   (Sebrae, Receita, pesquisa) também só se estiver em FATOS.md.
6. **CONFLITO e NÃO USAR ficam fora**, e nunca vão em Fontes. A linha "Cuidado" de cada fato vale
   como regra dura.
7. **A base vence a memória.** Se `_memoria/`, `estilos.json`, a ideia do banco ou uma peça antiga
   trouxer número diferente de FATOS.md (preço de promoção antigo, valor da guia do MEI, prazo de
   abertura), vale FATOS.md e você avisa a divergência. As conhecidas estão em
   `_base-contabil/DIVERGENCIAS.md`.
8. **Conteúdo é regra geral, nunca caso.** Nada de valor de imposto do caso de alguém, conta nova com
   número inventado, enquadramento de CNAE específico ou "essa profissão pode ser MEI" fora das duas
   listas de F057 (PROIBIDO P13, P16, P19).

## 1. Gente de verdade tem que entender (linguagem e tela)

Pedido do Pedro, 28/09/2026: nada de asterisco, letra miúda e afins, porque as pessoas não se
conectam com isso e não entendem. No lugar, a coisa dita como a pessoa diria: **"O que te escondem
na hora de abrir empresa"**.

**Diga a coisa, não o apelido dela.** Gancho, título, fala e legenda nomeiam o assunto com as
palavras de quem assiste. Se a pessoa precisa decodificar, ela passa o dedo.

| Em vez de | Escreva |
|---|---|
| "O asterisco do 'a partir de'" | "O preço que muda depois que você conta o seu caso" |
| "Letra miúda" como título ou gancho | "O que te escondem na hora de abrir empresa" |
| "Custo de saída escondido" | "Quanto custa se você quiser cancelar" (com F023 e F025) |
| "Desburocratização", "jornada", "fricção", "onboarding" | "a papelada fica com a gente", "o caminho no app", "o que trava", "abrir a empresa" |
| "Obrigação acessória" crua | "papel que o governo pede só pra confirmar imposto que você já pagou" (F094) |
| "Hiperlocal" | "a gente é de BH" (em peça de ME; em peça de MEI, sem cidade, F027) |
| "Vitrine", "tier", "ticket", "funil", "lead", "performance" | nunca na peça |

O preço do Legalizaí também muda depois de 3 meses (F002, F004). A ironia mira o preço que a pessoa
só descobre depois de pedir orçamento, nunca o preço que sobe com o tempo.

- **Teste do vizinho:** leia o gancho em voz alta pra alguém que não é do ramo. Precisou explicar?
  Reescreve.
- Frase curta, uma ideia por frase. Verbo no lugar de substantivo ("a gente abre a sua empresa",
  nunca "a abertura é realizada").
- A ironia do Léo contra o preço que muda depois que você conta o seu caso e a taxa que aparece no
  fim continua. O que muda é a palavra: a coisa concreta ("a taxa que só aparece no fim") no lugar
  do apelido ("a letra miúda").

**Pouca coisa na tela.**

- Texto de tela só no gancho (até 7 palavras, pode ser em CAIXA ALTA) e, no máximo, **um
  número-chave por bloco** (R$ 281,08; dia 20; 31/12/2026), sempre com id em Fontes.
- **O preço é a única exceção:** o valor promocional e o cheio vão juntos no mesmo bloco (na fala e,
  se entrar, na tela), e a frase da promoção e a fidelidade vão no bloco seguinte. Se não couber em 2
  blocos, a peça sai sem preço.
- Sem lista na tela, sem parágrafo, sem repetir a fala, sem selo extra. O que pode ficar fixo: a tag
  ME/MEI e, quando a tela do app aparece, o selo APP EM CONSTRUÇÃO.
- Legenda queimada (a transcrição da fala) é da edição e não conta como texto de tela. Mesmo assim,
  poucas palavras por vez.
- Reel sem narração (só b-roll e texto): o gancho de tela pode fechar com "continua na legenda", e o
  vídeo inteiro leva no máximo 3 frases curtas na tela.

## 2. Como o Léo pensa

A voz vem de duas fontes do vault, copiadas em `_base-contabil/leo/`: `00-SOUL-personalidade.md`
(como ele soa) e `personagem-leo.md` (quem ele é). Leia as duas antes de escrever fala do Léo. O
resumo abaixo não substitui.

- **Vigilante + astuto, fundidos.** Vigilante sozinho vira alarmista; astuto sozinho vira
  deboche; sem os dois vira FAQ. Junto: "eu já vi essa armadilha, relaxa, eu cuido". Ele avisa ANTES
  e já traz a saída.
- **Toda piada prova um ponto:** "isso podia ser simples e não é por escolha do sistema".
  Piada que não prova isso, corta.
- **Ele está do lado de fora do jargão, junto com você.** Não é o contador explicando pro
  leigo: é o cliente esperto zoando a sigla. Tic bom: "Em suricato: ..." (de vez em quando, nunca
  como estrutura) / "Sem contabilês: ..." (no máximo uma vez por peça, só com jargão de verdade).
  Tic morto: "traduzindo pra gente de verdade".
- **Alarme não, rotina.** "Dia 20 vence. Eu já calculei e te avisei." Aviso é confiança, não cobrança.
  O Léo calcula, emite a guia e avisa; **quem paga a guia é você** (F040). Nunca "eu já paguei".
- **Fala em primeira pessoa como quem executa**, só pra funcionalidade que está na base: "eu calculo",
  "eu emito a guia", "eu fico de olho no teto". Nunca "o Léo vai verificar".
- **Adulto, resolvido, curto.** Nada de fofinho, nada de Sábio distante, nada de guru. Frase curta
  é o Léo em estado puro.
- Tics que valem: "Ói, deixa eu te contar uma que ninguém conta." · "Fica esperto que eu já
  fiquei." (só com prazo de verdade, com id) · "Já caí num preço que mudou depois do orçamento. Foi a
  última vez." (a piada dele contra ele mesmo, só no meio da fala, nunca no gancho) · assinatura "De
  olho, sempre, Léo". Fecho de ação e de celebração: **"Vai, legaliza aí."**, com vírgula (o fecho do mote,
  ADR 25/10; no lançamento ele fica no lugar do "Vai, Legaliza aí!"). Nunca dois fechos na mesma peça.

**O que ele ironiza:** sigla que intimida, preço que muda depois que você conta o seu caso, taxa que
só aparece no fim, formulário de fachada, burocracia por inércia, papel que confirma outro papel, fila
de órgão.
**O que nunca vira piada:** a dúvida ou o erro de quem assiste, multa e dinheiro perdido,
a profissão contábil (o contador CRC é diferencial nosso), concorrente, caso fiscal de alguém.
Teste de cada frase: **ri DO sistema ou DA pessoa?**

### Quando o Léo fica sério

Regra de ouro do vault (`00-DIRETRIZES-SEGURANCA.md` §3, `SOUL` Humor, `personagem-leo.md` §3 e §10):
**medo real ou dúvida real, a ironia sai e a vigilância entra.**

- **Temas que desligam o humor por completo:** multa, prazo vencido, guia atrasada, dívida, golpe
  (ou medo de golpe), dinheiro perdido, estouro do teto, "não sei o que fazer", doença, maternidade,
  demissão. A peça inteira fica séria, não só uma frase.
- **Como ele soa sério:** direto, frase curta, primeira pessoa, sem piada, sem adjetivo de susto. O
  fato com id, o que acontece de verdade e a saída concreta. Informar, nunca tutelar, nunca assustar
  (PROIBIDO P23). Aqui a fala pode ser um pouco mais longa: medo pede espaço.
- **Exemplo de forma:** "Passou do teto do MEI, de R$ 81 mil por ano? Respira. Se passou até 20%, a
  mudança só vale a partir de janeiro, e você paga uma guia a mais só sobre o que passou, sem juros
  nem multa. Se passou mais que isso, tudo é recalculado como ME desde o começo do ano, ou desde a
  abertura, com juros e multa. É por isso que eu fico de olho no teto." (Fontes: F051, F054, F055,
  F044.)
- **Dado técnico** (Fator R, pró-labore, declaração) sai sério, sem ironia por cima do número.
- **Público C** (50+, pouca intimidade digital): troca graça por presença, "tô aqui, sem pressa".
- **Sério continua sendo o Léo:** vigilante, do lado da pessoa, com a saída pronta. Nunca frio, nunca
  sermão, nunca "você devia ter feito".

**Dial de ironia por público:** A (dev, consultor) alto · B (beleza, manual) médio, calor
antes da graça · C (50+, pouca intimidade digital) zero, troca graça por presença ("tô aqui,
sem pressa") · tema sensível (acima) sem piada. Humor é o padrão em tema leve (duas em cada três
falas, nunca no mesmo lugar), não enfeite colado.

## 3. Quem fala no vídeo

| Voz | Quando | Regra |
|---|---|---|
| **Léo em 1ª pessoa** | forte em 2 cultural, 4 dor, 5 mitos, 13 documentação e 16 dicas. Nos pilares 8, 10, 11, 12 e 17 ele só abre o gancho e fecha com "Vai, legaliza aí."; o corpo é institucional. No 9, pode abrir o gancho, e quem sustenta é a pessoa real. Fora de 1 e 3 (`personagem-leo.md` §11) | **O Léo PRECISA aparecer na tela** (ADR 26/08). Sem asset do Léo pra essa peça, não use a voz dele: vira Pedro ou "a gente". Personagem sempre gerado com a imagem de referência dele. **No 13, o Léo só fala do que está na base** (certificado incluso no ME, F013; MEI emite nota sem certificado, F012, F124): a base ainda não descreve o que o app confere na documentação, então nada de "eu confiro isso pra você" |
| **Pedro em 1ª pessoa** | bastidor fundador, app em construção, opinião | Só fato real. Léo não aparece nem é citado (trilhas não se cruzam) |
| **Time** | diálogo, bastidor (Pedro Melo, Pedro Maia, Pedro Puntel, Thiago e Natanael) | Nunca como "quem vai cuidar do seu MEI". O Mauro, o escritório Legalize e os 22 anos nunca aparecem (P39) |
| **"A gente" institucional** | marca, origem, oferta, lista de espera | Corpo com condição comercial é institucional; o fecho pode ser do Léo, com ele visível |

Quando não é o Léo falando, a **atitude** é dele: avisa antes, traz a saída, ironiza o sistema.
Na entrega, sempre sugira o encaixe: "cabe o Léo aqui" ou "não encaixa". Quem decide é o Pedro.

## 4. Regras duras (bloqueiam a peça)

A lista completa, com fonte, está em `_base-contabil/PROIBIDO.md`. As que mais derrubam reel:

1. **Zero travessão** (traço longo ou médio) em fala, tela, legenda e visual. Nada de barrinha colada antes de texto, nem hífen solto entre espaços (" - ") no lugar do travessão.
2. **Zero concorrente** por nome, logo, cor ou frase reconhecível. Critica a prática, não a empresa.
3. **MEI nunca com contador humano.** MEI tem assistente virtual (F011). Contador com CRC é do plano
   ME. Não insinuar ("alguém vai te atender") nem por imagem.
4. **Número só com id de FATOS.md** (passo 0). Sem id, sai. Não arredondar.
5. **Ironia mira o sistema.** Nunca o cliente, nunca a profissão contábil.
6. **"Legalizaí"** com acento. Handle @legalizai.app.
7. **CTA de clique = "link da bio"**, nunca "link abaixo" nem "link na bio" escrito de outro jeito.
8. App em construção: "o app que tá chegando", selo APP EM CONSTRUÇÃO e dados de exemplo nas
   telas. Nunca "baixa agora" (F008). O app mostra a guia; quem paga é você, no seu banco.
9. **Preço, promoção, validade e garantia só como está em FATOS.md, grupo A** (F001 a F025): os
   dois valores do plano (o promocional e o cheio) sempre juntos (MEI R$ 29 nos 3 primeiros meses,
   depois R$ 49; ME R$ 99 nos 3 primeiros meses, depois R$ 139), a frase da promoção inteira ("a
   promoção vale até 31/12/2026, e quem garante é quem entra na lista de espera", F005), e **a
   fidelidade de 12 meses sempre que a peça diz preço** (F023). **Toda peça de vendas leva os 7 dias
   pra mudar de ideia, com a condição (F021, F022), na fala, na legenda ou no último quadro.** Na ME:
   "Você tem 7 dias pra mudar de ideia, com dinheiro de volta se desistir antes de autorizar o envio
   pra Junta." No MEI, a forma da condição ainda não está decidida (F022 fala do envio pra Junta, que
   o MEI não tem): até o Pedro decidir, a peça de MEI sai sem os 7 dias e a exceção vai anotada nas
   notas da peça. Multa quando o assunto for sair (F025). Nunca "incondicional", "sem letra miúda",
   nem "grátis" ou "sem custo" pra abertura, com ou sem asterisco (P05, P10): diga "abertura sem
   honorário" (F015) e, no ME, a taxa da Junta junto (F018). R$ 19 e R$ 79 morreram (F006): se o
   pedido trouxer outro preço, não escreva número e sinalize.
10. **Nunca prometa prazo de abertura** (dias, horas, "na hora", "rápido"), aprovação garantida ou
    resultado (PROIBIDO P01 a P03). Nunca prometa economia de imposto (P04).
11. **Escopo real** (F026 a F033): sede em BH, só serviço, MEI e ME no Simples, Anexos III e V, 1 a 4
    sócios, abertura ou migração. Regularização e baixa de CNPJ não. **"MEI em qualquer cidade" e
    "MEI só em BH" estão em conflito (F027): não diga nenhuma das duas. Em peça de MEI, não fale de
    cidade.**
12. Reforma: IBS/CBS **substituem** tributos antigos (nunca "imposto novo"); nunca "MEI vai
    pagar mais". Simples Híbrido: só o guarda-corpo de P31 (é opcional, nunca obrigatório). F110 está
    NÃO USAR: nenhum detalhe dele entra na peça e ele nunca vai em Fontes.
13. Fator R: no máximo uma peça no plano inteiro, e só pra atividade que ele decide (F084). O ângulo
    vigente é facilidade, não economia.
14. **Nunca ensinar a fazer sozinho** (Pedro, 28/09/2026; PROIBIDO P38). A peça não manda ninguém pro
    Portal do Empreendedor, Emissor Nacional ou gov.br sem o app. Todo tema educativo fecha no app: o
    app faz, avisa ou prepara. MEI: "pelo app a gente prepara tudo e você só confirma na sua conta
    gov.br" (a frase de P38). ME: "a gente abre a sua empresa, você só assina" (F129). De F071 só entra
    que a confirmação é feita na conta gov.br do próprio titular; "gratuito", "Portal do Empreendedor"
    e "único canal oficial" nunca entram (P38, P10). Nunca "quem abre é você", "é de graça, faz você
    mesmo", "fecha a aba".
15. **Linguagem de gente** (§1): nada de metáfora que exige decodificar, nada de jargão de marketing,
    nada de "não é X, é Y", nada de cara de texto de IA.
16. **Pouca coisa na tela** (§1): texto de tela só no gancho e, no máximo, um número-chave por bloco
    (o preço é a exceção do §1).
17. **Colaborador, nunca "funcionário"** (Pedro, 22/10/2026: "sempre que falar de funcionário, nunca
    diga funcionário, e sim colaborador"). Em fala, tela, legenda, ideia e tema, na mesma concordância:
    "Até 2 colaboradores", "Se você tem colaborador", "quem tem colaborador", "a colaboradora". A
    conferência do Ateliê barra.

## 5. Pilares da estratégia

A pauta segue `_base-contabil/estrategia/estrategia-organica.md` (v4, 01/09). Todo reel nasce de um
pilar ativo e de um tipo.

| Bloco | % da pauta | Pilares ativos | Tipos que mais servem | Voz que encaixa |
|---|---:|---|---|---|
| Afeto/Marca | 20% | 1 bastidor fundador · 2 cultural (piada leve com a burocracia) · 3 nossa origem | conexão, viralização | 1 e 3: Pedro ou "a gente" · 2: Léo forte |
| Educação/Dor | 30% | 4 dor da burocracia · 5 mitos · 16 dicas e informativos | ensino, viralização, conselho | Léo forte nos três |
| Diferencial/Confiança | 25% | 8 diferencial · 9 bastidor e processo (contador CRC real, só ME) · 17 o app fazendo o trabalho | ensino, conexão, vendas | 8 e 17: Léo abre e fecha, corpo institucional · 9: Léo pode abrir, quem sustenta é a pessoa real |
| Conversão/Produto | 25% | 10 oferta · 11 troca de contador · 12 dinheiro do dono · 13 documentação em dia | vendas, ensino, conselho (13: só ensino) | 10, 11 e 12: corpo institucional, Léo abre e fecha · 13: Léo forte, só com fato do produto |

- **Standby, não usar:** 6 (calendário fiscal), 7 (educação fiscal), 14 (prova e reação), 15
  (participativo). Prazo fiscal só entra como informativo sazonal dentro do 16 (DASN-SIMEI em maio,
  virada de ano); do dia 20, um informativo avulso por trimestre, nunca série. Fator R segue a regra 13.
- **Pilar 5:** os mitos de burocracia vêm na frente dos fiscais (estratégia v4).
- **Pilar 16:** o núcleo é tocar o negócio (preço do serviço, separar o dinheiro da empresa do seu,
  primeiro cliente, sócio, rotina de dono), sem contabilês. O fiscal pontual entra no máximo em 1 a
  cada 4 peças do 16, traduzido e sem protagonismo.
- **Pilar 13:** só tipo ensino, até a base descrever o que o app confere na documentação. Avise o
  Pedro desse buraco quando o 13 aparecer na agenda.
- **Pilar 10:** as 12 peças da primeira campanha já usaram vários ângulos; antes de escrever, olhe
  quais e varie. É alerta de repetição, não trava do pilar: a janela promocional está ligada (§6).
- **Ângulos da estratégia que a base proíbe:** "sem letra miúda" (P05), "CNPJ pronto rápido" (P01),
  simulador de Fator R (F009), "migração e baixa sem custo" (P07), "contador que some" (P22), "vagas
  fundador" (P09). Continuam fora, mesmo que apareçam na estratégia, na memória ou num tema.

## 6. Os cinco tipos e a escada de CTA

| Tipo | Serve pra | CTA (uma só por peça) |
|---|---|---|
| **viralizacao** | ser salvo e mandado por quem nunca ouviu falar da gente | salvar, mandar, marcar, comentar. **Sem link** |
| **conexao** | fazer o dono de MEI/ME se sentir visto | comentar, mandar, seguir. Sem venda |
| **ensino** | explicar uma regra real e útil, sem susto | salvar pra quando precisar ou mandar pra alguém; no máximo "segue pra mais" |
| **conselho** | uma decisão de gente adulta: o que fazer antes do aperto | salvar ou mandar. O app aparece na narração (regra 14); o link fica pra vendas |
| **vendas** | virar lista de espera | "Entra na lista de espera pelo link da bio. Não cobra nada e não te compromete." |

As frases prontas de cada degrau, e as que saíram do banco e por quê, estão em `references/ctas.md`.

- **Teto de vendas.** Peças com CTA de link (tipo vendas) somam no máximo 30% das peças do mês
  enquanto a promoção vale (até 31/12/2026) e 20% depois. No bloco Diferencial, vendas no máximo 1 a
  cada 3 peças do bloco. (Estratégia v4: "até 30% da pauta na janela" e cap de 20% fora dela;
  `mecanicas-engajamento.md`: fechar todo post com venda queima o topo de funil.)
- **Preço.** Janela promocional ligada até 31/12/2026 (estratégia v4): as peças de vendas alternam
  com preço e sem preço, sempre com os dois valores, a frase de F005 e a fidelidade quando há preço
  (regra 9).
- **7 dias.** Toda peça de vendas leva os 7 dias pra mudar de ideia, com a condição (regra 9).
- Um diferencial por peça de vendas. Diferencial também é fato: só os que estão em FATOS (ex.: F011,
  F013, F015, F020, F040, F043, F044, F045).

## 7. O Construtor: gancho, CTA, narração

No chat, uma etapa por mensagem. Se a peça vem do cronograma com tema, tipo e pilar, não pergunte o
que já veio: confirme e siga.

**Etapa 1 · Tema.** Numa mensagem só, pergunte: (A) sobre o que é o reel e pra quem (MEI, ME ou os
dois), e (B) se a pessoa já tem um gancho ou quer sugestões do banco. Com o tema, escolha os fatos
(passo 0.3), o pilar ativo e o tipo. Tipo vendas: confira o teto do mês (§6).

**Etapa 2 · Gancho.** Traga **3 opções** de `references/ganchos.md`, de categorias diferentes quando
der, que sirvam ao tipo e ao pilar da peça. Adapte ao tema (preencha os colchetes com o assunto real)
e mostre, em cada opção, a categoria e o fato que entrega o que o gancho promete. Gancho que pede
número: o número é lido em FATOS agora, nunca de memória. Nenhuma agradou? Mais 3, diferentes. Só
avance com uma confirmada.
Se a pessoa trouxe o gancho dela, ele vale como veio, a não ser que quebre regra dura ou o §1: aí
diga qual regra e proponha a menor troca possível. Quem decide é o Pedro.

**Etapa 3 · CTA.** Proponha a CTA pronta, do degrau do tipo, tirada de `references/ctas.md`, e peça
só a confirmação. Ela abre e fecha a legenda e é a última frase da narração.

**Etapa 4 · Narração.** Ela sai do gancho e fecha na CTA:

1. **Gancho (0 a 3s):** o gancho escolhido, dito como veio.
2. **A promessa cumprida (1 a 3 beats):** o que o gancho prometeu, um fato por beat, com id.
3. **A virada pro app (regra 14):** em peça educativa (ensino, conselho, viralização com fato), o
   fato termina no que o app faz, avisa ou prepara (F040, F036, F129; no MEI, a frase de P38: "pelo
   app a gente prepara tudo e você só confirma na sua conta gov.br"). De F071 só entra que a
   confirmação é feita na conta gov.br do próprio titular; "gratuito", "Portal do Empreendedor" e
   "único canal oficial" nunca entram (P38, P10). Em conexão e cultural, a virada pode ficar só na CTA.
4. **CTA:** a frase da Etapa 3, palavra por palavra, por último.

Ritmo de fala: cerca de 2,1 palavras por segundo. Reel curto fica entre 15 e 40 segundos (de 30 a 85
palavras). **Teste do par:** leia o gancho e a última frase juntos. Se o fim não responde o começo,
reescreva o meio.

**Etapa 5 · B-roll e tela.** Escolha os takes em `references/broll.md` pelo momento de cada bloco
(gancho, prova, respiro, CTA) e pelo pilar. Anote o código do take no bloco. Tela segue o §1.

**Etapa 6 · Legenda** (§10) e **Etapa 7 · Gate** (§13). Passou, entrega.

**Formato assinatura do pilar 17: "O app fazendo [tarefa]"** (adaptado do "O app em X segundos" da
estratégia v4). Uma tela aprovada do `broll.md` (L01, L04 a L07), uma tarefa chata resolvida, sem
narração técnica e **sem número de segundos**: não há fato de tempo em FATOS, e tempo perto de
abertura vira P01. Ex.: "Nota fiscal pelo celular: pra quem é e quanto é. Pronto." (F041, L07).

## 8. Gancho (0 a 3s)

- **Sempre do banco** (Pedro, 09/10/2026): o gancho sai da curadoria (`references/ganchos.md`) ou do
  banco original numerado (`references/banco-1000-ganchos.md`), adaptado ao assunto, e a peça anota
  de onde veio ("G46", "banco 954"). Fora da curadoria, ele passa nas 4 condições de "Gancho que não
  está aqui". Gancho que o Pedro trouxer vale como veio.
- É uma frase que alguém diria em voz alta. Até 12 palavras faladas; na tela, até 7.
- Promete só o que o vídeo entrega. Pergunta ou fato concreto vence adjetivo.
- Curiosidade, fato e prova só com fato de FATOS.md, e o fato vai em Fontes.
- Mira o sistema, nunca o erro da pessoa.
- Gancho que fala do mercado ("te escondem", "ninguém te mostra") não acusa ninguém no corpo: o
  corpo mostra o que o app mostra, com fato (F018, F020, F045), sem dizer o que os outros fazem ou
  escondem (P36, P22).

| Não | Sim |
|---|---|
| "O asterisco que ninguém lê" | "O que te escondem na hora de abrir empresa" |
| "Você está fazendo seu MEI errado" (ri da pessoa) | "O governo não te avisa quando o MEI passa do limite." (F044, F051; o valor do teto vem no primeiro beat) |
| "Abra seu CNPJ em 24h" (P01) | "Dá pra abrir empresa sem papel e sem ir a cartório." (F036) |
| "Letra miúda da contabilidade" | "O que você precisa ver antes de assinar com uma contabilidade" (F045, F023) |

## 9. Formato do roteiro: BLOCOS

```
GANCHO (0 a 3s)
fala: o gancho escolhido, do jeito que se fala
em cena: o que a câmera vê e o que a pessoa faz
b-roll: código do take em references/broll.md (opcional)
na tela: o gancho em até 7 palavras (opcional)

BEAT 1 (3 a 10s)
fala / em cena / b-roll
na tela: no máximo um número-chave (opcional)

BEAT 2 ... (um beat = uma ideia, um fato)

CTA (últimos 3 a 5s)
fala: a CTA escolhida, palavra por palavra
em cena / b-roll
na tela: só "LINK DA BIO", e só em vendas (opcional)

FONTES
F0xx · arquivo §seção (uma linha por fato usado; sem número na peça, "sem número")
```

**Texto na tela é opcional.** Só entra quando ajuda quem assiste sem som ou crava a palavra
ou o número que importa (dia 20, 31/12/2026, "link da bio"), sempre com id em Fontes. Não repete a
fala inteira. Legenda queimada palavra a palavra é da edição, não do roteiro.

Carrossel/estático do cronograma: mesmo formato, com `tempo` = "Slide 1", "Slide 2"...
e a fala = o texto do slide. A capa é o gancho; cada slide leva uma ideia e, no máximo, um número-chave
(o preço é a exceção do §1). Carrossel de lista: um slide por item (título, explicação curta, visual próprio), nunca a
lista num slide só (Pedro, 26/10/2026; skill `carrossel`, references/estrategia.md §11).

## 10. Legenda (curta, assertiva, com emoji e sem hashtag)

Pedido do Pedro, 06/10/2026: "legendas não precisam mais de hashtags"; a legenda é menor e mais
assertiva, com emojis.

```
[CTA de objetivo, 1 linha, com emoji]

[desenvolvimento: 2 a 4 linhas curtas, uma ideia cada, cada uma abrindo com um emoji]

[CTA final, igual ou variação, com emoji]
```

- **Cabe numa tela de celular:** mire em até uns 600 caracteres, sem contar o crédito de modelo 3D.
  Quando há crédito CC BY, ele vai no fim, sem marca.
- **Emoji:** um no começo da linha, que ajude a ler (📲 ✅ 🧾 👀 🚀). Nunca emoji de alarme ou susto
  (🚨 ❗), pela P23.
- **Sem hashtag.**
- O desenvolvimento entrega o que o gancho prometeu: uma ideia por linha, direto, com a linguagem de
  quem explica pra um amigo.
- As palavras que o público procura (abrir MEI, abrir empresa em BH, nota fiscal, CNPJ) entram no
  texto do jeito que se fala, nunca em lista.
- A legenda obedece o passo 0 igual à fala: número na legenda também cita id.
- Peça de vendas: se os 7 dias não couberam na fala, eles entram na legenda, com a condição (regra 9).

## 11. Como escrever

- Fala de gente: "tá", "pra", "a gente". Frases curtas. Lê em voz alta: se tropeçar, reescreve.
- Aponta pra VOCÊ: "o seu CNPJ", nunca "o mundo do CNPJ".
- Todo termo técnico traduzido na mesma frase (DAS = boleto do mês / guia do mês). Glossário em
  `_base-contabil/marca/glossario-tecnico-humano.md`.
- **Sem oposição semântica** ("não é X, é Y", "o problema não é você, é..."). Diga o positivo direto.
- Sem cara de IA: "mergulhar", "navegar", "no mundo de hoje", "em um mundo onde", "nesse cenário",
  "desvendar", "jornada".
- Sem travessão. Sem emoji na fala (na legenda, sim: um por linha, §10). Sem hashtag.
- Checagem final: soa **Aliado** (resolve, fala de igual pra igual) ou **Sábio distante**? Se Sábio, reescreve.

## 12. Auto-check antes de entregar

- [ ] Quem fala? Se é o Léo, ele aparece na tela, e o pilar deixa ele falar ali (§3)?
- [ ] O pilar está ativo? O tipo e a CTA batem com a escada?
- [ ] Tipo vendas: a peça estoura o teto de vendas do mês (30% na janela, 20% depois; 1 a cada 3 no
  Diferencial)? Pilar 13 nunca é vendas.
- [ ] Tipo vendas: os 7 dias com a condição estão na fala, na legenda ou no último quadro (ou a
  exceção do MEI está nas notas)?
- [ ] O gancho veio do banco (código G ou número do banco de 1000, anotado na peça) e a narração
  fecha na CTA escolhida?
- [ ] Alguma frase ri da pessoa ou da profissão? Algum concorrente reconhecível? Algum "ninguém
  mostra" que acusa o mercado sem fato?
- [ ] Tema pesado (multa, dívida, prazo vencido, golpe)? O humor saiu da peça inteira?
- [ ] MEI + humano em algum lugar (fala, tela, imagem, b-roll)? MEI + cidade?
- [ ] Cada número, data, preço e regra tem id de FATOS.md em Fontes? Algum fato CONFLITO ou NÃO USAR?
- [ ] Peça educativa fecha no app, sem ensinar a fazer sozinho?
- [ ] Alguma metáfora que precisa ser decodificada? Algum jargão de marketing?
- [ ] Texto de tela só no gancho e, no máximo, um número por bloco (o preço é a exceção)?
- [ ] Uma CTA só, do degrau certo do tipo? "link da bio"?
- [ ] Travessão (ou hífen solto no lugar dele) em qualquer campo? "Legalizaí" com acento?
- [ ] "Funcionário" em algum campo? Vira colaborador, na mesma concordância (regra 17).
- [ ] Anti-repetição: mesma tese ou formato perto na agenda? Sinalize, não bloqueie.
- [ ] Estratégia principal: o bloco ESTRATÉGIA tem pilar, os dois gatilhos, bloco, persona, Léo e
  motivo? A ideia do calendário saiu intacta, com os conflitos avisados? O convite está no nível certo?

## 13. Gate de saída (o último passo, nada sai sem passar)

Adaptado do `12-GATE-DE-SAIDA.md` e do checklist de verdade do atendimento do Léo. Se um item falhar,
a peça volta, não sai "quase certa".

**Verdade**
1. Cada número, data, prazo, preço, percentual e afirmação legal tem id de fato em Fontes, e o id
   diz exatamente aquilo (confira o texto do fato, não só o assunto).
2. Nenhum fato CONFLITO ou NÃO USAR, nem em Fontes. Nenhuma frase contraria a linha "Cuidado" do fato
   usado.
3. Nenhuma promessa da lista de PROIBIDO: prazo de abertura, aprovação, resultado, economia de
   imposto, "sem letra miúda", contador no MEI, serviço que o produto não faz, download, link fora
   dos três (F009), passo a passo pra fazer sozinho (P38).
4. Nenhum trabalho do sistema devolvido pra pessoa ("você soma", "você escolhe o anexo") e nenhum
   trabalho da pessoa assumido pela gente ("eu paguei sua guia") (F040).
5. Negativa sobre contrato, preço, prazo ou produto ("não tem fidelidade", "não tem multa") só se o
   fato disser; de cabeça, nunca (F023, F025).
6. Peça de vendas: preço só com os dois valores, a frase de F005 e a fidelidade (F023); os 7 dias com
   a condição (F021, F022) na fala, na legenda ou no último quadro; no MEI, a exceção anotada nas
   notas da peça até o Pedro decidir.

**Quando a peça fala de quem a gente NÃO atende** (comércio, EPP, Lucro Presumido, fora de BH,
5 sócios ou mais, regularização)
7. Diz o que a gente cuida, com a palavra **serviço** ("hoje eu cuido de empresa de serviço").
8. Recusa por porte mostra o número do teto (teto do MEI F051, teto do ME F082).
9. Não começa com "atendo sim, mas...", não pesca atividade de serviço que a pessoa não citou e não
   inventa exceção.
10. Não promete data pra quando vai atender. Deixa a porta aberta: seguir o perfil pra saber quando
    chegar.
11. Se existe saída dentro do produto, ela vem com preço e condição na mesma peça (fora de BH no ME:
    endereço fiscal, F016). Em peça de MEI, nada de cidade (F027).

**Marca**
12. Zero travessão, "Legalizaí" com acento, nenhum concorrente, Léo visível se ele fala, CTA
    "link da bio", o id de fato não aparece no texto publicado, colaborador e nunca "funcionário".
13. Uma pessoa que não é do ramo entende o gancho de primeira, e a tela tem só o gancho e, no
    máximo, um número por bloco (o preço é a exceção do §1).

Passou nos 13: entrega com o bloco FONTES preenchido, os códigos de b-roll e a sugestão de encaixe do
Léo. Falhou em algum: diga qual, corrija e rode o gate de novo.

## 14. Exemplo de entrega completa

**Tema:** o que aparece antes de pagar quando alguém abre uma ME em BH pelo app. **Pilar:** 8
(diferencial) · **Tipo:** vendas (a peça de vendas do bloco Diferencial no mês, §6) · **Público:**
quem vai abrir ME em BH · **Voz:** Pedro na câmera, falando como "a gente". **Diferencial da peça:**
tudo aparece antes de pagar (F020, F045).

**Etapa 2, as 3 opções:** (1) "O que te escondem na hora de abrir empresa" (Abertura com Gancho
Direto; entrega com F018, F023, F045) · (2) "Quanto você acha que custa abrir uma ME em BH?"
(Perguntas Que Prendem; F018, F015) · (3) "O que você precisa ver antes de assinar com uma
contabilidade" (Polêmicas e Opiniões; F045, F023). **Escolhida:** 1.
**CTA (vendas):** "Entra na lista de espera pelo link da bio."

```
GANCHO (0 a 3s)
fala: O que te escondem na hora de abrir empresa.
em cena: Pedro no escritório em BH, plano médio, olhando pra câmera
b-roll: B100
na tela: O QUE TE ESCONDEM AO ABRIR EMPRESA

BEAT 1 (3 a 13s)
fala: Abrir ME em BH tem a taxa da Junta: R$ 281,08. Ela vai inteira pro Estado.
em cena: pilha de papel na mesa, nada legível
b-roll: L14
na tela: R$ 281,08

BEAT 2 (13 a 19s)
fala: No app, ela aparece separada do plano. E só é cobrada quando a checagem do nome e do endereço volta aprovada.
em cena: Pedro de volta na câmera

BEAT 3 (19 a 26s)
fala: O plano tem fidelidade de 12 meses. A gente te conta isso logo no começo.
em cena: Pedro na câmera, mesmo plano
na tela: 12 MESES

BEAT 4 (26 a 36s)
fala: E antes de pagar, você lê o contrato inteiro no app. A gente abre a sua empresa, você só assina.
em cena: a pilha sai do quadro e fica só o celular, tela apagada
b-roll: L15, com o corte em B091

CTA (36 a 40s)
fala: Entra na lista de espera pelo link da bio.
em cena: Pedro na câmera, sorriso curto
na tela: LINK DA BIO

FONTES
F018 · 03-REGRAS-DOS-ORGAOS §2
F020 · 02-PRODUTO-E-USABILIDADE §4
F023 · 10-CONTRATO-GARANTIA-CANCELAMENTO §3
F021 · 10-CONTRATO-GARANTIA-CANCELAMENTO §1
F022 · 10-CONTRATO-GARANTIA-CANCELAMENTO §1 e §2
F045 · 04-QUEBRA-OBJECOES (Topo de funil, "Isso é golpe?")
F129 · pesquisa/fiscal-simples-bh-2026 E (frase de PROIBIDO P38)
F036 · 02-PRODUTO-E-USABILIDADE §1
F007 · 01-PLANOS-E-OFERTAS §5
F008 · 01-PLANOS-E-OFERTAS §5
```

**Legenda**

> 📲 Entra na lista de espera pelo link da bio. Não cobra nada e não te compromete.
>
> 🧾 Na ME, a taxa da Junta de Minas é de R$ 281,08: vai inteira pro Estado, aparece separada na
> tela e só é cobrada quando a checagem do nome e do endereço volta aprovada.
> 📄 O plano tem fidelidade de 12 meses, contada a partir da emissão do CNPJ.
> ↩️ Você tem 7 dias pra mudar de ideia, com dinheiro de volta se desistir antes de autorizar o envio
> pra Junta.
> 🔎 Antes de pagar, o app mostra o CNPJ da Legalizaí, o registro do contador no CRC e o contrato
> inteiro.
>
> 🚀 Entrar na lista não cobra nada e não te compromete. Link da bio.

**Encaixe do Léo:** não encaixa. O corpo tem condição comercial, então fica institucional.

**Por que o exemplo não mostra a tela do app:** as capturas atuais de pagamento e de contrato
(`plano.png`, `pagamento.png`, `contrato.png`) mostram valores que não estão em FATOS e frases
proibidas (ver `references/broll.md`, L02 e L03). Quando o Pedro refizer essas capturas, L02 entra no
beat 1 e L03 no beat 4.
