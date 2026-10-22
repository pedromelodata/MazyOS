---
name: stories-leo
description: >
  Stories do Legalizaí, de engajamento e de vendas, numa skill só: a fusão das skills "stories que
  engajam" e "stories que vendem" com a voz do Léo e do Pedro e as regras duras do Legalizaí. Faz a
  ideia de stories do dia do cronograma (uma por dia, conversando com a peça de feed do dia, na
  proporção do mês dos blocos da estratégia e com teto de vendas por semana) e, no chat, caixinha de
  perguntas de 1 quadro ou sequência de 3 a 6 quadros com enquete, teste, caixinha ou link. Poucas
  palavras por quadro. Venda como consequência do contexto, prova só com fato de
  _base-contabil/FATOS.md, nunca depoimento inventado. Use quando pedirem stories, story, caixinha,
  caixa de perguntas, enquete, quiz, stories de venda, stories de engajamento, stories do dia,
  sequência de stories ou "o que postar nos stories hoje".
---

# stories-leo

Stories é conversa. A pessoa toca pra frente em meio segundo, então cada quadro diz uma
coisa só, com poucas palavras, do jeito que se fala. A cabeça é a mesma dos reels: a do Léo, que avisa
antes, ri do sistema e nunca da pessoa, e não fala número que não leu na base.

Esta skill junta as duas que o Pedro mandou: **stories que engajam** (aproximar, gerar conversa) e
**stories que vendem** (levar pra lista de espera sem parecer anúncio).

## Antes de escrever

- A base vale igual aos reels: o passo 0 da skill `reels-leo` (§0) inteiro. Leia `_base-contabil/FATOS.md`
  e `_base-contabil/PROIBIDO.md`. Número, data, preço e regra só com id de FATOS, e o id vai só em Fontes.
- Linguagem e voz: `reels-leo` §1 (gente de verdade tem que entender), §2 (como o Léo pensa) e §3
  (quem fala). As regras duras de `reels-leo` §4 valem todas.
- Apoio: `reels-leo/references/ganchos.md` (a frase do quadro 1, sempre do banco, pela regra do Pedro de
  09/10/2026; fora da curadoria, `reels-leo/references/banco-1000-ganchos.md`), `reels-leo/references/ctas.md` (o
  último quadro) e `reels-leo/references/broll.md` (o visual e as telas do app que podem aparecer).
- Estratégia: `_base-contabil/estrategia/estrategia-organica.md` e `mecanicas-engajamento.md`. De
  `mecanicas-engajamento.md` vale só o que está na tabela de mecânicas do §7. A escada de CTA, o banco de
  prompts e o script de DM de lá foram substituídos pelo `ctas.md` (F009, F021, F022, P09).
- Memória: onde `_memoria/` discordar da base, vale a base. A tabela de pilares de
  `_memoria/estrategia.md` é a v3 (6 e 7 ativos, sem 16 e 17): vale a v4. A CTA "Simule seu Fator R
  grátis" de `preferencias.md` morreu (F009). R$ 19 e R$ 79 morreram (F006).
- `cronograma/data` é dado vivo: esta skill só lê.

## 1. Os dois objetivos

Bloco e objetivo são coisas separadas. O bloco diz de que assunto é o stories (a conta do mês, §7). O
objetivo diz o que ele pede pra pessoa fazer.

| Objetivo (campo `objetivo`) | Pra quê | Onde cai | Fecha com |
|---|---|---|---|
| **engajamento** | a pessoa responde, vota, pergunta e se vê no que a gente fala | qualquer bloco ativo: Afeto (1, 2, 3), Educação (4, 5, 16), Diferencial (8, 9, 17), Conversão (10, 11, 12, 13) | um sticker de interação ou o sticker que compartilha o post do feed. Sem link |
| **vendas** | a pessoa entra na lista de espera | dia de peça de Conversão do 10, 11 ou 12; na semana sem peça de Conversão, 1 dia de peça do 8 ou do 17 (§7) | o sticker de link pra lista de espera. A data 31/12/2026 só quando a sequência fala da promoção, e aí com os dois valores e a fidelidade (F002, F004, F005, F023). Sem preço, fecha com F007: "Entrar na lista não cobra nada e não te compromete." |

Os pilares 6, 7, 14 e 15 estão em standby e não entram.

**O que vale nos dois, vindo das duas skills:**

1. **Contexto antes de tudo.** O quadro 1 começa numa cena que a pessoa reconhece. Nunca "sobre o que
   vamos conversar hoje?". Na venda, o quadro 1 nunca fala do produto.
2. **Só o que é verdade.** O assunto vem da peça de feed do dia, de um fato de FATOS ou de um bastidor
   real do Pedro (marcado "confirmar antes de gravar"). Nada inventado.
3. **A venda é consequência.** O app entra como o próximo passo óbvio do que já foi mostrado. A pessoa
   é a heroína; o app é a ferramenta.
4. **Prova só com fato.** A base não tem depoimento de cliente e o pilar de prova está em standby. Prova
   é fato, cada um com o seu limite:
   - F043: o cálculo conferido 46 vezes contra guia real. **Só ME** (é o cálculo do DAS da ME).
   - F045: contrato, CNPJ e CRC antes de pagar.
   - F044: o governo não avisa o teto do MEI, e a gente monitora. **Sempre com o teto, R$ 81 mil por
     ano (F051).**
   - F130: o processo real que mudou de recusado pra aprovado. Fale de ME.
   - F148 é NÃO USAR desde 21/10/2026: o Mauro, o escritório e os 22 anos nunca entram (P39).

   Nunca "uma cliente me disse", nunca print inventado, nunca "tanta gente já entrou na lista".
5. **CTA específica, no último quadro**, do degrau certo (`ctas.md`).

## 2. Formatos

### A. Caixinha de perguntas (1 quadro)

Entregue **3 opções**, cada uma com um ângulo:

1. **Pessoal:** o Pedro ou o Léo abre com algo real e pede a pergunta.
2. **Do tema:** a dúvida do assunto do dia, com um recorte que puxa pergunta específica.
3. **Provocativa, mirando o sistema:** a burocracia é o alvo, nunca a pessoa.

Cada opção: contexto antes da pergunta, até 15 palavras, e o aviso de que a pergunta pode virar conteúdo
sem nome ("sem nome, pode virar vídeo") numa linha pequena, fora da contagem. Depois das três, uma nota
curta com a lógica de cada uma.

### B. Sequência

**Engajamento (3 a 5 quadros)**

1. **Abertura com contexto real:** começa no meio da cena, abre e não fecha o pensamento.
2. **Aprofundamento ou virada:** o fato (com id) ou o que aconteceu, em tom de conversa.
3. **Conexão com quem assiste:** o foco sai da gente e vai pra pessoa ("se você trabalha por conta...").
4. *(opcional)* **Mais uma camada:** outro exemplo ou a virada que muda o jeito de ver.
5. *(opcional)* **Interação:** enquete, teste ou caixinha, específica ao que foi dito. Sem interação, o
   último quadro fecha o pensamento ou compartilha o post do dia.

**Vendas (3 a 6 quadros; 6 é o limite do app)**

- **Sem preço, curta:** (1) a cena ou a dor que a pessoa reconhece, sem produto · (2) a prova ou o
  insight, com fato · (3) o app como próximo passo e a CTA com link.
- **Sem preço, longa:** (1) a cena, sem produto · (2) o aprofundamento, com fato · (3) a prova, com fato ·
  (4) o app que tá chegando, com um diferencial só · (5) a CTA, com o link.
- **Com preço:** (1) a cena, sem produto · (2) o app que tá chegando, com um diferencial só · (3) os dois
  valores · (4) a frase da promoção (F005), num quadro só dela · (5) a fidelidade e a CTA, com o link.
- **Os 7 dias** (§6) entram num quadro só deles, antes do último. No MEI, até o Pedro decidir a forma
  da condição, ficam de fora e a exceção vai nas notas do dia.

## 3. Stickers

Um sticker por quadro. No máximo 2 stickers de interação por sequência.

| Sticker | Pra quê | Regra |
|---|---|---|
| **Enquete** | Verdade ou Mito (pilar 5), "Qual dessas você já viveu?" (pilar 2), "Você sabia?" (Diferencial) | duas opções curtas; a resposta vem no quadro seguinte ou no stories do dia seguinte, com fato |
| **Teste** (quiz) | a pergunta com o fato do dia (pilar 5 ou 16) | um número só na tela, o certo, com id; as outras opções sem número, nunca um número antigo ou em conflito. Ex.: "Quanto o MEI pode faturar?" / "Até R$ 81 mil por ano" / "Não tem limite" / "É por mês, não por ano" (F051) |
| **Caixinha** | "Pergunta que ninguém explica" (pilares 4 e 16) | aviso de que pode virar conteúdo sem nome. Resposta é regra geral, nunca o caso da pessoa (P13, P19). Nunca pedir CPF, senha ou documento (P34). Multa e dívida com tom sério. Nunca expor situação irregular de ninguém |
| **Contagem regressiva** | só data real de FATOS, e só quando o Pedro liberar a mecânica (§7) | o fim da promoção, 31/12/2026 (F005), numa sequência de vendas que fala da promoção, com os dois valores e a fidelidade; a DASN-SIMEI de 31/05 (F065), como informativo sazonal do 16, fechando em "a gente avisa quando a data chega" (sem dizer que o app transmite a declaração). Nunca contagem do dia 20 (pilar 6 em standby), nunca de abertura (P01), nunca de "vagas" (P09) |
| **Link** | só vendas | só a lista de espera, `https://www.legalizai.com.br/em-breve` (F009). Texto do sticker: "Entrar na lista". Nunca outro link, nunca simulador |
| **Compartilhar o post** | fecho do stories que retoma uma peça do feed | leva salvamento e compartilhamento pro feed, que é o que a estratégia mede (salvar, depois mandar, depois comentar) |

## 4. Poucas palavras por quadro

- **Até 15 palavras escritas por quadro** (o ideal é perto de 8). Uma ideia por quadro.
- Se o Pedro ou o Léo fala no vídeo, o texto escrito é uma frase de apoio ou nada.
- Sem lista, sem marcador, sem parágrafo. No máximo um número por quadro, com id em Fontes.
- **O preço é a única exceção:** o valor promocional e o cheio vão juntos no mesmo quadro; a frase da
  promoção (F005) vai inteira no quadro seguinte, sozinha; a fidelidade vai no quadro do link. Se não
  couber assim, a sequência sai sem preço.
- Frase de gente, curta. Sem "espero que tenha ajudado", "não perca essa oportunidade", "produto
  incrível". Sem "não é X, é Y". Sem metáfora que precisa ser decodificada (reels-leo §1).
- Zero travessão, nem barrinha decorativa antes de texto, nem hífen solto entre espaços no lugar dele.
  "Legalizaí" com acento. Sem emoji decorativo.
- **Colaborador, nunca "funcionário"** (Pedro, 22/10/2026: "sempre que falar de funcionário, nunca diga
  funcionário, e sim colaborador"). No tema, no quadro, na enquete e na CTA, na mesma concordância: "Se
  você tem colaborador", "Até 2 colaboradores", "a colaboradora". A conferência do Ateliê barra.

## 5. Quem fala

- **Pedro na câmera frontal:** bastidor, opinião, o app sendo construído (pilares 1 e 3, este com "a
  gente"). Só fato real; o que depende de memória dele vai marcado "confirmar antes de gravar". Só
  quando a gravação já existe ou cabe no dia; senão, texto em fundo da marca.
- **Léo:** 1ª pessoa só com o Léo no quadro (asset L17 do `broll.md`), e só quando o asset já existe.
  Forte em 2, 4, 5, 13 (só com fato do produto) e 16; em 8, 10, 11, 12 e 17 ele só abre ou fecha; fora
  de 1 e 3.
- **"A gente":** oferta e condição comercial. Quadro com preço, data, fidelidade ou 7 dias tem visual da
  marca (fundo papel quente, o número em coral), nunca o Pedro dizendo a condição.
- **Contador:** só em stories de ME (P06), sem nome. O Mauro nunca aparece (P39).
- Humor segue o dial da `reels-leo` §2. Multa, dívida, prazo vencido e golpe: sem piada.

## 6. Vendas nos stories: o que não muda

- **Nunca ensina a fazer sozinho** (P38). O app faz, avisa ou prepara. MEI: a frase de P38, no futuro
  ("No app que tá chegando, a gente prepara tudo. Você só confirma no seu gov.br."). ME: "a gente abre a
  sua empresa, você só assina" (F129). De F071 só entra que a confirmação é na conta gov.br do próprio
  titular; "gratuito", "Portal do Empreendedor" e "único canal oficial" nunca entram (P38, P10). F071 e
  F129 só vão em Fontes se a frase de P38 estiver no quadro.
- **O app é o que tá chegando** (F008): nada de "baixe", "já disponível", nem "pelo app" no presente,
  como se já desse pra usar. Tela do app só a aprovada no `broll.md`, com o selo APP EM CONSTRUÇÃO.
- **Preço só como está em FATOS, grupo A:** MEI R$ 29 por mês nos 3 primeiros meses, depois R$ 49
  (F001, F002); ME R$ 99 por mês nos 3 primeiros meses, depois R$ 139 (F003, F004); a frase inteira da
  promoção (F005) e a fidelidade de 12 meses (F023) sempre que o preço aparece. Falou "promoção", os
  valores vêm junto. A exceção de números do §4 vale só pro preço.
- **Janela promocional ligada até 31/12/2026** (estratégia v4): as sequências de vendas alternam com
  preço e sem preço, sempre com os dois valores, a frase de F005 e a fidelidade quando há preço. É a
  mesma régua dos reels (`reels-leo` §6).
- **Os 7 dias em toda sequência de vendas**, com a condição (F021, F022), num quadro só deles. Na ME:
  "7 dias pra mudar de ideia: antes de autorizar o envio pra Junta, volta tudo." No MEI, a forma da
  condição está com o Pedro (F022 fala do envio pra Junta, que o MEI não tem): até ele decidir, a
  sequência de MEI sai sem os 7 dias e a exceção vai nas notas do dia. Nunca os 7 dias sem a condição.
- **A única urgência é a real:** "a promoção vale até 31/12/2026, e quem garante é quem entra na lista de
  espera" (F005). Nada de "últimas vagas", "só hoje", "vagas de fundador" (P09).
- **A lista de espera** não cobra nada, não compromete e avisa quando o app abrir (F007). Quem entra é a
  própria pessoa: nunca "te coloquei na lista".
- MEI nunca com contador (P06). Taxa da Junta é só da ME (F018). Um diferencial por sequência de venda.
- **DM fica fora** até o Pedro aprovar uma rotina de resposta (`ctas.md`).

## 7. O stories diário do cronograma

Todo dia do cronograma ganha uma ideia de stories. Ela conversa com a peça de feed do dia e respeita a
proporção do mês. (A estratégia v4 dizia "stories quando houver algo real pra mostrar, não força
diário"; o pedido do Pedro de 28/09/2026 é ter a ideia todo dia. Por isso ela pode ser ocultada.)

Com 3 posts por semana, 4 dos 7 dias não têm peça de feed. O stories mais comum é o do dia sem peça,
então ele tem que ser barato de fazer: o gargalo do time é a edição.

### Proporção do mês (blocos)

- Os stories visíveis do mês seguem a pauta da estratégia: **Afeto 20%, Educação 30%, Diferencial 25%,
  Conversão 25%**, com folga de um stories por bloco. Num mês de 31 dias: 6 de Afeto, 9 de Educação, 8
  de Diferencial e 8 de Conversão, mais ou menos um.
- A conta é do mês, igual à pauta do feed. Em duas semanas não fecha: numa quinzena sem peça de
  Conversão no feed (como 05 a 16/10), não há peça de Conversão pra retomar.
- O stories conta pelo bloco da peça que ele retoma (a do dia, ou a do dia sem peça, abaixo).

### Teto de vendas (objetivo)

| | Enquanto a promoção vale (até 31/12/2026) | Depois de 31/12/2026 |
|---|---:|---:|
| Stories de vendas por semana | até 2 | até 1 |

- Nunca em dois dias seguidos. Semana com 0 ou 1 também vale.
- Cai no dia de peça de Conversão do 10, 11 ou 12. Na semana sem peça de Conversão no feed, pode cair 1
  no dia de peça do 8 ou do 17, com o pilar da peça e a CTA da lista (e conta no bloco Diferencial).
- Nunca no dia de peça do 9 (a prova é a pessoa real) nem do 13 (a base não descreve o que o app confere
  na documentação).
- Stories do 11, 12 ou 13 que não é o dia da venda sai como engajamento (enquete, teste).

### Como o stories conversa com a peça do dia

| Peça de feed do dia | Stories do dia |
|---|---|
| Afeto (1, 2, 3) | engajamento: enquete leve do mesmo assunto ("qual dessas você já viveu?") ou bastidor do Pedro, se a gravação já existe |
| Educação (4, 5, 16) | engajamento: Verdade ou Mito no dia de peça do 5; teste com o fato do dia no 16; caixinha sobre a dor do dia no 4 |
| Diferencial (8, 9, 17) | engajamento com prova: o fato ou a tela aprovada da peça, com uma enquete ("você sabia?"). Na semana sem peça de Conversão, 1 dia do 8 ou do 17 pode ser de vendas |
| Conversão (10, 11, 12, 13) | vendas no 10, 11 ou 12, dentro do teto; fora dele, e sempre no 13, engajamento (enquete, teste) |
| **Dia sem peça** | retoma uma peça de feed recente, com o mesmo bloco e outro ângulo: por padrão a da véspera; se um bloco está atrás na conta do mês, a mais recente desse bloco. Fecha com o sticker que compartilha o post. Visual padrão: texto curto em fundo da marca ou uma enquete. Pedro na câmera e Léo (L17) só quando a gravação ou o asset já existem. O Verdade ou Mito da semana pode cair num dia sem peça que retoma uma peça de Educação |

O stories repete o assunto da peça, nunca o texto dela: outro ângulo, outra entrada.

### As mecânicas de `mecanicas-engajamento.md`

Todas estão **em teste**: lá elas são "propostas, nenhuma travada", com a nota de não rodar todas ao
mesmo tempo. Rodam no máximo 2 de cada vez, hoje a caixinha e o Verdade ou Mito, medindo o número de
respostas por rodada (mecanicas, §Métricas). A próxima entra quando o Pedro validar.

| Mecânica | Pilar | Cadência no stories | Situação |
|---|---|---|---|
| Pergunta que ninguém explica (caixinha) | 4 e 16 (o 7 está em standby) | quinzenal | **em teste, rodando.** A resposta sai como peça de Educação na semana seguinte, regra geral e sem nome, nunca como repost da resposta de quem perguntou |
| Verdade ou Mito | 5 | semanal, num dia sem peça que retoma Educação ou no dia de peça do 5; nunca forçado num dia de peça do 16 | **em teste, rodando** |
| Quantos dias faltam (contagem regressiva) | 10 (fim da promoção) e 16 (DASN-SIMEI, 31/05) | nas últimas semanas antes de 31/12/2026; e perto de 31/05 | em teste, espera o ok do Pedro. Só data real; a versão mensal do dia 20 fica fora (pilar 6 em standby) |
| Recebe no CPF ainda? (enquete) | 4 e 10 | bimestral | em teste, espera o ok do Pedro. A própria mecânica pede fora da janela de promoção: entra depois de 31/12/2026, ou antes com o ok dele |
| Checklist: sua empresa tá em dia? | 13 | não usar | a base não descreve o que o app confere na documentação, e quem marca "não" vira caso de regularização, que a gente não faz (F033, P07) |
| Pergunta pro contador de verdade | 9 | não é do stories diário | é reel ou live mensal, só de ME (P06), só regra geral (P19) |
| Resposta por DM com simulador de Fator R | | não usar | o simulador não é link que existe (F009). DM fica fora até o Pedro aprovar uma rotina de resposta |

### Mostrar ou ocultar no sistema

A ideia do dia é sugestão. No cronograma, o interruptor "Stories do dia" mostra ou esconde todos os
stories de uma vez, e a escolha fica no navegador de cada pessoa. Um dia que não vai ao ar a equipe
edita ou marca pelo status (Ideia, Pronto, Publicado). A skill sempre entrega a ideia completa e não
decide isso. A proporção do mês e o teto de vendas são conferidos com todos os dias do mês.

### O formato da ideia do dia

Casa com os campos do stories do dia no cronograma: `data`, `objetivo` ("engajamento" ou "vendas"),
`pilar`, `bloco`, `tema`, `pecaDoDia`, `quadros` (de 1 a 6, cada um com `texto`, `visual` e
`interacao`), `cta`, `fontes` e `notas` (quem grava é `cronograma/server/aplicar-stories.mjs`, com o
servidor parado; a skill não grava).

```
STORIES DO DIA · [data]
objetivo: engajamento | vendas
bloco e pilar: [bloco] · [pilar]
conversa com: [a peça de feed do dia] | sem peça (retoma: [a peça])
mecânica: sequência | caixinha | Verdade ou Mito | teste
ideia: uma linha, do jeito que se fala

QUADRO 1
texto: exatamente o que aparece escrito (até 15 palavras)
visual: fundo, foto, vídeo curto ou take do broll.md (código)
interacao: enquete, teste, caixinha, link, compartilhar o post, ou vazio

QUADRO 2 ...

NOTAS: o que a equipe precisa saber (ex.: a exceção dos 7 dias no MEI)

FONTES
F0xx · arquivo §seção (uma linha por fato; sem número, "sem número")

LÓGICA: uma ou duas linhas sobre por que a sequência foi montada assim
```

## 8. No chat

Uma pergunta por vez, só o que faltar:

1. É engajamento ou vendas? Caixinha de 1 quadro ou sequência?
2. Qual o assunto: a peça de feed do dia, um fato, um bastidor real? Na venda, é MEI ou ME?
3. Quem aparece: o Pedro, o Léo (tem asset pra esse stories?) ou só texto?
4. Na venda: com preço ou sem? (com preço, a regra do §6 manda)

Depois, entregue no formato do §7. Se a pessoa quiser mudar um quadro, refaça só aquele quadro.

## 9. Gate

Rode o gate de saída da `reels-leo` (§13) e mais estes:

- [ ] Até 15 palavras escritas por quadro, uma ideia, um sticker no máximo.
- [ ] Na venda, o quadro 1 não fala do produto, e a prova é fato com id, dentro do limite dele (§1).
- [ ] Vendas dentro do teto da semana, nunca em dia seguido, nunca em dia de peça do 9 ou do 13.
- [ ] Link só da lista de espera; contagem regressiva só de data real e só com a mecânica liberada.
- [ ] Preço com os dois valores, a frase de F005 e a fidelidade, com visual da marca, ou nenhum preço.
- [ ] Vendas: os 7 dias com a condição num quadro, ou a exceção do MEI nas notas.
- [ ] Caixinha com o aviso de que pode virar conteúdo sem nome; nenhuma resposta sobre o caso de alguém.
- [ ] Nenhum pilar em standby, nenhuma mecânica fora das que estão rodando.
- [ ] O mês fecha na proporção de blocos do §7.

## 10. Exemplos

### Engajamento · Verdade ou Mito (pilar 5, dia de peça de mito)

```
STORIES DO DIA · exemplo
objetivo: engajamento
bloco e pilar: Educação · 5 mitos
conversa com: peça de feed sobre mitos de abrir empresa
mecânica: Verdade ou Mito
ideia: nome sujo impede de abrir CNPJ?

QUADRO 1
texto: Verdade ou mito: nome sujo impede de abrir CNPJ?
visual: Léo (L17) de braços cruzados, fundo papel quente
interacao: enquete "Verdade / Mito"

QUADRO 2
texto: Mito. SPC e Serasa não impedem de abrir CNPJ.
visual: Léo (L17)
interacao:

QUADRO 3
texto: O que trava é pendência do CPF na Receita ou na Justiça Eleitoral.
visual: Léo (L17), expressão atenta
interacao:

QUADRO 4
texto: CPF em dia? No app que tá chegando, a gente prepara a abertura com você.
visual: tela de abertura do app de teste (L01), selo APP EM CONSTRUÇÃO
interacao: caixinha "Qual outro mito você já ouviu?"

FONTES
F135 · 03-REGRAS-DOS-ORGAOS §3
F008 · 01-PLANOS-E-OFERTAS §5

LÓGICA: a enquete abre a conversa, a resposta vem com o fato inteiro e o último quadro devolve a vez pra
pessoa com a caixinha, que alimenta a próxima rodada.
```

### Vendas · MEI com preço (pilar 10, dia de peça de Conversão)

```
STORIES DO DIA · exemplo
objetivo: vendas
bloco e pilar: Conversão · 10 oferta
conversa com: peça de feed de oferta do MEI
mecânica: sequência
ideia: quem quer virar MEI e não sabe por onde começar

QUADRO 1
texto: Tá pensando em virar MEI e não sabe por onde começar?
visual: Pedro na câmera frontal (em peça de MEI, sem cidade no texto nem no cenário, F027)
interacao: enquete "Sim / Já sou MEI"

QUADRO 2
texto: No app que tá chegando, a gente prepara tudo. Você só confirma no seu gov.br.
visual: tela de abertura do app de teste (L01), selo APP EM CONSTRUÇÃO
interacao:

QUADRO 3
texto: MEI: R$ 29 por mês nos 3 primeiros meses. Depois, R$ 49.
visual: fundo papel quente, o número em coral
interacao:

QUADRO 4
texto: A promoção vale até 31/12/2026, e quem garante é quem entra na lista de espera.
visual: fundo papel quente, a data em coral
interacao:

QUADRO 5
texto: Fidelidade de 12 meses. Entrar na lista não cobra nada.
visual: fundo papel quente
interacao: link "Entrar na lista" (https://www.legalizai.com.br/em-breve)

NOTAS: os 7 dias ficam de fora desta sequência até o Pedro decidir a forma da condição no MEI (F022
fala do envio pra Junta, que o MEI não tem).

FONTES
F071 · pesquisa/abertura-mei/abertura-mei-processo.md §1 e §2 (só: a confirmação é na conta gov.br do próprio titular; frase de PROIBIDO P38)
F008 · 01-PLANOS-E-OFERTAS §5
F001 · 01-PLANOS-E-OFERTAS §1
F002 · 01-PLANOS-E-OFERTAS §1 e §5
F005 · 01-PLANOS-E-OFERTAS §5
F023 · 10-CONTRATO-GARANTIA-CANCELAMENTO §3
F007 · 01-PLANOS-E-OFERTAS §5
F009 · 01-PLANOS-E-OFERTAS §5

LÓGICA: o quadro 1 é a cena, sem produto e sem a enquete do CPF (essa mecânica espera o fim da
promoção); o 2 é o único diferencial da sequência (a gente prepara, você confirma); o 3, o 4 e o 5
trazem o preço inteiro, a frase da promoção e a fidelidade, com visual da marca, e só então o link.
```

### Caixinha · 3 opções (pilares 4 e 16)

1. **Pessoal (Pedro):** "Tô construindo o app em cima de dúvidas reais. Qual é a sua sobre CNPJ?"
2. **Do tema:** "Qual dúvida de MEI ou ME ninguém te explicou direito?"
3. **Provocativa, mirando o sistema:** "Qual papel da sua empresa você nunca entendeu pra que serve?"

Nas três, a linha pequena embaixo: "Sem nome, pode virar vídeo."

Lógica: a 1 aproxima pelo bastidor e funciona melhor com o Pedro na câmera; a 2 pega a dúvida técnica e
alimenta o pilar 16; a 3 puxa a irritação com a burocracia, que é o tom do Léo, e rende peça do pilar 4.
