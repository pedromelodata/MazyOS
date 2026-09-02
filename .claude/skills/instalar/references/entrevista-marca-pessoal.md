# Entrevista de Marca Pessoal — Caminho B do /instalar

Conduzir **uma seção de cada vez**. Só avançar depois que o usuário responder a seção atual. Armazenar todas as respostas pra usar no preenchimento da memória (e no guia .docx, se pedido).

Abertura sugerida:

> "Vamos montar a base do seu Instagram juntos. Vou te fazer as perguntas uma seção de cada vez. Responde com calma, sem pressa. No final, tudo isso vira a memória do MazyOS — e, se quiser, um documento pra guardar. Pode ser?"

---

## SEÇÃO 01 — Nicho

**Pergunta:**
> "Pelo que você quer ser conhecido na internet? Quando alguém entrar no seu perfil, ela precisa entender rapidamente sobre o que você fala. Qual é o seu nicho?"

Exemplos se o usuário travar: Academia, Design, Marketing, Medicina, Finanças, Estudo, Humor, Relacionamento, Lifestyle, Negócios, Moda, Comida, Viagem.

**Campo:** `nicho`

---

## SEÇÃO 02 — Pilares de Conteúdo

**Pergunta:**
> "Agora me diz quais são os assuntos que você sempre vai falar. Esses são seus pilares de conteúdo. Escreve até 7 pilares — podem ser palavras soltas mesmo."

Exemplo: uma pessoa de academia pode ter como pilares — Treino, Alimentação, Rotina, Motivação, Erros na academia, Evolução física, Suplementação.

**Campo:** `pilares` (lista)

---

## SEÇÃO 03 — Marca Pessoal

**Pergunta:**
> "Agora vamos definir quem você é como marca. Me responde essas quatro coisas:
>
> 1. Quais são seus valores?
> 2. Que impacto você quer gerar nas pessoas?
> 3. Como você quer ser visto na internet?
> 4. Que tipo de conteúdo você nunca faria?"

**Campos:** `valores`, `impacto`, `como_quer_ser_visto`, `conteudo_nunca_faria`

---

## SEÇÃO 04 — Público

**Pergunta:**
> "Agora me fala sobre quem você quer alcançar. Responde essas perguntas:
>
> 1. Quem é o seu público?
> 2. Qual a idade média desse público?
> 3. Do que esse público trabalha ou se ocupa?
> 4. Quais problemas esse público enfrenta?
> 5. O que esse público quer conquistar?
> 6. O que facilitaria a vida deles?
> 7. Que tipo de conteúdo eles gostam de ver?"

**Campos:** `publico_descricao`, `publico_idade`, `publico_ocupacao`, `publico_problemas`, `publico_conquistas`, `publico_facilidades`, `publico_conteudo_preferido`

---

## SEÇÃO 05 — Bio

**Pergunta:**
> "Agora vamos montar sua bio. Ela precisa ser curta, direta, e explicar três coisas: o que você faz, pra quem, e seu diferencial.
>
> Usa essa estrutura como base se quiser:
> - Eu ajudo [público] a [resultado]
> - Sem [problema comum]
> - Usando [seu método ou diferencial]
>
> Como ficaria sua bio?"

**Campo:** `bio`

---

## SEÇÃO 06 — Mecanismo Único (Diferencial)

**Pergunta:**
> "Agora me ajuda a definir seu diferencial. Responde essas perguntas:
>
> 1. Você ajuda quem?
> 2. Essas pessoas querem o quê?
> 3. Sem precisar de quê?
> 4. Usando o quê?
> 5. Qual é o seu diferencial?
> 6. O que você acha que a maioria do seu nicho faz errado?"

Depois perguntar: *"Agora tenta resumir tudo isso numa frase simples. Tipo: 'Marketing para quem odeia aparecer'. Como seria a sua?"*

**Campos:** `mecanismo_ajudo`, `mecanismo_querem`, `mecanismo_sem`, `mecanismo_usando`, `mecanismo_diferencial`, `mecanismo_erro_comum`, `mecanismo_frase`

---

## SEÇÃO 07 — Identidade e Comunicação

**Pergunta:**
> "Como vai ser o seu conteúdo? Me conta:
>
> **Minha comunicação é:** (pode marcar mais de um)
> Engraçada / Séria / Professor / Motivacional / Opinião / Storytelling
>
> **Meu conteúdo vai ser:**
> Simples ou produzido? / Com ou sem identidade visual? / Aparecendo ou sem aparecer?
>
> **Suas cores e fonte** (se já tiver definido):
>
> **Seus 3 mandamentos de conteúdo** — as regras que você nunca vai quebrar no seu perfil:"

**Campos:** `comunicacao_estilo`, `conteudo_producao`, `cores`, `fonte`, `mandamentos` (lista de 3)

---

## SEÇÃO 08 — Formato de Conteúdo

**Pergunta:**
> "Em qual formato você vai se especializar? Escolhe um principal:
> Reels / Carrossel / Stories / Misto
>
> E qual é o estilo do seu conteúdo?
> Simples / Com identidade visual / Mais produzido / Rápido / Educativo / Opinião / Entretenimento"

**Campos:** `formato_principal`, `estilo_conteudo`

---

## SEÇÃO 09 — Linha de Produção

**Pergunta:**
> "Última seção. Vamos montar como você vai produzir conteúdo de forma consistente.
>
> 1. Quantas vezes por semana você vai postar?
> 2. Quais tipos de conteúdo você vai fazer? (Dicas, Erros, Rotina, Opinião, História, Antes e depois, Tutorial, Lista, Ferramentas, Bastidores)"

**Campos:** `frequencia_semanal`, `tipos_conteudo` (lista)

---

## Encerramento

> "Pronto! Você acabou de montar a base do seu Instagram. Agora vou gravar tudo isso na memória do MazyOS — a partir de agora, todo conteúdo que a gente criar aqui já sai com o seu posicionamento."

---

## Mapeamento campo → arquivo de memória

| Campos | Arquivo | Seção |
|---|---|---|
| `nicho`, `pilares` | `_memoria/empresa.md` | Nicho e pilares |
| `publico_*` (7 campos) | `_memoria/empresa.md` | Público |
| `bio`, `mecanismo_*` (7 campos) | `_memoria/empresa.md` | Bio e mecanismo único |
| `comunicacao_estilo`, `valores`, `como_quer_ser_visto`, `conteudo_nunca_faria`, `mandamentos` | `_memoria/preferencias.md` | Tom de voz, limites e mandamentos |
| `impacto`, `formato_principal`, `estilo_conteudo`, `conteudo_producao`, `frequencia_semanal`, `tipos_conteudo` | `_memoria/estrategia.md` | Formato e linha de produção |
| `cores`, `fonte` | `identidade/design-guide.md` | Cores e tipografia |

Preservar as respostas como o usuário deu. Seção pulada → "A definir".

---

## Estrutura do Guia de Marca Pessoal (.docx, opcional)

Gerar com a skill `docx` do Claude Code, salvar em `saidas/guia-marca-pessoal.docx`.

```
Capa:
  Título: "Guia de Marca Pessoal — [Nome do usuário se souber]"
  Subtítulo: "Seu mapa do Instagram"

Seções (Heading 1 para cada uma):

01. Meu Nicho
02. Meus Pilares de Conteúdo
03. Minha Marca Pessoal
    - Valores
    - Impacto que quero gerar
    - Como quero ser visto
    - O que nunca faria
04. Meu Público
    - Descrição / Idade média / Ocupação / Problemas
    - O que querem conquistar / O que facilitaria a vida deles
    - Tipo de conteúdo que gostam
05. Minha Bio
06. Meu Mecanismo Único
    - Ajudo quem / Querem o quê / Sem precisar de quê / Usando o quê
    - Meu diferencial / O que o nicho faz errado
    - Minha frase de posicionamento
07. Identidade e Comunicação
    - Estilo de comunicação / Produção de conteúdo
    - Cores e fonte / Meus 3 mandamentos
08. Formato de Conteúdo
    - Formato principal / Estilo
09. Linha de Produção
    - Frequência semanal / Tipos de conteúdo
```

**Estilo do documento:** fonte Arial; títulos (Heading 1) em azul escuro `#1F3864`; respostas em parágrafo normal, sem bold excessivo; página A4 com margens de 1 polegada.

Ao entregar:

> "Aqui está o seu guia. Salva esse arquivo — e se um dia quiser usar outra IA, é só colar o conteúdo dele que ela vai te conhecer. Aqui no MazyOS você não precisa: tudo isso já tá na memória."
