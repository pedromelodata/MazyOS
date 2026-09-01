---
tipo: derivado
status: vivo
data: 2026-08-13
assunto: pitch-investidor
deriva_de: [roteiro-escalada-mercado]
tags: [marca, copy, video, narracao, tts, elevenlabs]
---

# 🎧 Narração ElevenLabs — Multilingual v2

> Adaptação de [[roteiro-escalada-mercado]] (**v4**) pro modelo **ElevenLabs Multilingual v2**. Texto pronto pra colar.
>
> **Marcação por pontuação**, que é o que funciona em qualquer caixa de texto do ElevenLabs: vírgula, ponto, reticência, travessão e quebra de linha. Sem tag XML, sem colchete.
>
> ⚠️ Se uma palavra mudar no roteiro-fonte, muda aqui também, nunca o contrário.

---

## v4 · a respiração mudou tudo

Frase longa lida em bloco vira **informação**, não impacto. Foi o defeito que o Pedro pegou em *"Vinte e dois anos de contabilidade de verdade por baixo"*, que entregava um ativo de 22 anos com entonação de etiqueta.

Regra nova, aplicada nas três: **uma ideia por respiração**. Na prática, pro TTS, isso significa três coisas:

1. **Quebra de linha é a ferramenta principal.** Cada linha do texto abaixo é uma respiração. O modelo respeita isso melhor do que qualquer tag.
2. **A palavra de peso vai no fim, com pausa antes.** *"Menos de uma... em cada cem"* bate mais do que a mesma frase corrida.
3. **Lista vira staccato.** `Caderno.` numa linha só, em vez de `planilha, caderno` corrido. Vírgula corre, ponto pesa.

**Não junte as linhas ao colar.** A quebra é instrução de ritmo, não formatação.

### 🔴 Achado do primeiro teste real: ironia não se pede, se escreve

O Pedro gerou a Escada e o trecho *"Planilha. Caderno."* saiu **seco, como lista de compras**, sem a provocação que a cena pede.

Não é defeito da voz nem da config. É que **nada no texto pedia desdém**: staccato dá peso, não sarcasmo. TTS não faz ironia por conta própria, e locutor humano faz por sorte.

**A correção é semântica, não de pontuação:**

| Antes (sai seco) | Agora (julga sozinho) |
|---|---|
| "Planilha. Caderno." | "O resto **ainda** é planilha. / Caderno." |
| "Planilha. / Caderno. / Um contador..." (Loops) | "**Ainda estão** na planilha. / No caderno. / Num contador..." |

O "ainda" carrega o julgamento com qualquer voz, em qualquer take, e ainda reforça a tese da peça (mercado parado no tempo). **Regra geral: se o sentido depende do tom, ele não está no roteiro.**

**Se quiser testar variações de entonação por cima disso**, gere só este trecho nas 3 formas e compare:

```
E o resto?
O resto ainda é planilha.
Caderno.
E um contador que olha a empresa... uma vez por ano.
```

```
E o resto?
Planilha?
Caderno?
E um contador que olha a empresa uma vez por ano.
```

```
E o resto?
O resto ainda é planilha...
Caderno...
E um contador que olha a empresa... uma vez por ano.
```

A primeira é a do roteiro, e a mais segura. A segunda troca desdém por **incredulidade** (a interrogação levanta a melodia, mas com voz errada vira dúvida genuína). A terceira **arrasta** o desdém com reticências, e é a que mais depende da voz escolhida.

---

## Por que pontuação em vez de `<break time>`

Dois recursos que **este modelo não tem**:

- **Audio tags** (`[confident]`, `[serious]`): só o Eleven v3. No v2 ele **fala o colchete em voz alta**.
- **`<break time="1.0s" />`**: funciona na API e em parte das interfaces, mas não em todas. Onde não funciona, ou some, ou vira texto falado, e o take vai fora.

### Teste de 10 segundos pra saber o que a tua caixa aceita

```
Zero vírgula sete por cento. <break time="1.5s" /> Menos de uma em cada cem.
```

| O que acontece | Conclusão |
|---|---|
| pausa longa de verdade | tua caixa aceita break: pode usar o **apêndice** no fim |
| a voz fala "break time" | não aceita: usa os textos principais |
| passa direto | ignora a tag: usa os textos principais |

### A gramática de pausa usada nos textos

| Sinal | Efeito na voz | Uso aqui |
|---|---|---|
| `,` | respiro curto | dentro da frase |
| `.` | pausa normal | separando ideias, e entre itens de lista |
| `...` | suspensão, pausa longa e macia | antes da palavra que carrega o peso |
| ` — ` (travessão entre espaços) | pausa marcada, mais seca | isolando aposto |
| quebra de linha | uma respiração nova | **a marcação principal**: cada linha é uma frase falada |
| linha em branco | maior pausa que o modelo dá sozinho | entre blocos da escalada |

⚠️ **O travessão aqui é instrução de máquina, não copy.** A regra de marca que o proíbe vale pro texto que alguém **lê**. Não deixe vazar de volta pro roteiro-fonte.

Ressalva de uso: reticência demais deixa a voz **hesitante**, que é o oposto de um pitch. Nos textos abaixo ela aparece só onde a suspensão é proposital, sempre antes da palavra de peso.

---

## Configuração recomendada (os 5 controles do teu print)

| Controle | Está em | **Sugestão** | Por quê |
|---|---|---|---|
| **Velocidade** | 1x | **0,9x** | um tico mais lenta dá gravidade. Se aparecer artefato metálico, volta pra 1x e resolve o ritmo na edição |
| **Estabilidade** | 50% | **45%** | sem tags, a variação de emoção vem daqui. Abaixo de 35% oscila entre blocos |
| **Similaridade** | 75% | **75%**, sem mexer | acima de 85% ele copia junto os defeitos da amostra |
| **Estilo exagerado** | 0% | **0%**, só sobe se vier chapado | estilo alto no v2 puxa a entonação de volta pro idioma de origem da voz. Teto de 15% |
| **Reforço de alto-falante** | ligado | **manter ligado** | fidelidade à voz escolhida, sem custo perceptível |

### 🔴 O maior risco não é config, é a voz

As 5 vozes do print (**Brittney, Ashwin, Jessica, Erin, Jennifer**) são de **língua inglesa**. O v2 fala português com elas, mas o sotaque vaza onde dói: *Belo Horizonte*, *milhões*, *vírgula*, *contabilidade*. Numa peça pra investidor brasileiro, isso custa credibilidade antes do primeiro número.

Abra **"Exibir mais"** e filtre a Voice Library por **português brasileiro** antes de gastar teste. Se testar as 5 mesmo assim, compare pelo **bloco do meio**, nunca pela abertura: sotaque some em frase curta e aparece em frase longa.

### Regras de geração

1. **Corpo numa tirada só.** Picotar por frase faz cada pedaço voltar ao tom neutro.
2. **Fecho em take separado.**
3. **Pausa longa é edição.** O texto entrega o ritmo; o silêncio dramático você monta na timeline.
4. **Nada de CAPS.** O v2 pode soletrar ou gritar.
5. Sem tags, **a escalada nasce no mix**: trilha subindo, corte acelerando, nível da voz abrindo a cada bloco.

---

# Proposta 1 · A ESCADA · ~97s

```
Agora, enquanto você assiste isso... alguém no Brasil está abrindo uma empresa.

Ela não sabe qual imposto vai pagar.
Não sabe se escolheu o código certo.
E vai descobrir isso um ano depois. Quando não dá mais pra corrigir.

E não é uma pessoa.

São sete milhões e quatrocentas mil empresas no Simples Nacional... vivendo exatamente assim.

Sabe quanto o maior aplicativo contábil do país atende disso?

Zero vírgula sete por cento.
Menos de uma... em cada cem.

E o resto?
O resto ainda é planilha.
Caderno.
E um contador que olha a empresa... uma vez por ano.

Vamos começar por Belo Horizonte.
A terceira capital que mais abre empresa no país. Onde uma empresa nasce em onze horas.
Se funcionar no lugar mais rápido do Brasil... funciona em qualquer lugar.

Por baixo de tudo isso... vinte e dois anos de contabilidade de verdade.
Por cima... um produto novo.

E estamos prontos.
Prontos para ser o maior aplicativo contábil do Brasil.
```

---

# Proposta 2 · LOOPS ABERTOS · ~102s

As pausas depois das perguntas **são o gancho da peça** e são grandes demais pra confiar na pontuação. Gere em **4 blocos** e monte os silêncios na edição.

**Bloco 1**
```
Uma pergunta.
Quantas empresas brasileiras vivem hoje no Simples Nacional?
```

**Bloco 2**
```
Sete milhões e quatrocentas mil.

Outra pergunta.
Quanto disso o maior aplicativo contábil do país atende?
```

**Bloco 3**
```
Zero vírgula sete por cento.
Menos de uma... em cada cem.

Então onde estão as outras noventa e nove?
```

**Bloco 4**
```
Ainda estão na planilha.
No caderno.
Num contador que olha a empresa... uma vez por ano.
Gente pagando imposto a mais... sem nunca saber.

A gente está construindo o contrário disso.
Preço fechado.
Contador de verdade desde o primeiro plano.
E um app que olha o seu número todo mês. Não uma vez por ano.

E onde vamos começar?
Por Belo Horizonte. Onde uma empresa abre em onze horas... e existem mais de cem mil empresas no nosso perfil.

E por que parar aqui?

A gente não vai parar.
Estamos prontos para ser o maior aplicativo contábil do Brasil.
```

> Se preferir manter a prosódia numa geração só, cole os 4 blocos seguidos e **abra o silêncio na edição**. Fica melhor que confiar na pontuação pra segurar 1 segundo.

---

# Proposta 3 · A ONDA · ~105s

```
Belo Horizonte abre uma empresa em onze horas.
É a abertura mais rápida do Brasil.
Na terceira capital que mais abre empresa no país.

E a gente não vai começar aqui porque é pequeno.
Vai começar... porque é o campo de prova mais rápido que existe.

Se o produto aguentar a cidade que mais acelera... ele aguenta o país.

E o país... são sete milhões e quatrocentas mil empresas no Simples Nacional.

Com o maior aplicativo contábil do Brasil atendendo... zero vírgula sete por cento delas.

Esse mercado não está consolidado.
Ele ainda está por ser servido.

Primeiro... Belo Horizonte.
Depois... Minas.
Depois... o Brasil inteiro.

Mesmo motor. Mesmo preço fechado. Mesmo contador de verdade atrás.
E por baixo de tudo... vinte e dois anos de contabilidade real.

Não vai ser uma contabilidade de bairro querendo crescer.
Vai ser um produto nacional que escolheu onde nascer.
E estamos prontos para ser o maior aplicativo contábil do Brasil.
```

---

# O fecho: gerar à parte, 3 versões

```
Vai, legaliza aí.
```

```
Vai! Legaliza aí.
```

```
Vai... legaliza aí!
```

**Critério de escolha:** o peso tem que cair no **aí**, que é onde o **AI do wordmark acende em coral**. Se a voz apoiar em "legaliza" e largar o final, o take não serve, por melhor que soe o resto. A terceira versão costuma jogar mais peso pro fim.

⚠️ Candidata séria a **voz humana**, gravada por você. São 2 segundos, é a assinatura da marca, e é onde sotaque de voz importada estraga tudo.

---

## Se algum trecho sair errado na escuta

| Sintoma | O que tentar |
|---|---|
| Sotaque forte em "Belo Horizonte" | trocar a voz antes de qualquer outra coisa. Se insistir, testar `Bélo Orizonti` **só nesse trecho** |
| Voz hesitante demais | tirar uma ou duas reticências. Elas suspendem, mas em excesso soam insegurança |
| As linhas saem coladas, sem respiração | conferir se a quebra de linha sobreviveu ao colar. Se a caixa achatar tudo num parágrafo, trocar cada quebra por ponto final |
| Travessão virando pausa longa demais | trocar por vírgula e recuperar a pausa no corte |
| "Zero vírgula sete por cento" arrastado | gerar `Zero vírgula sete.` e `Por cento.` separados e juntar na edição |
| Números soando como algarismo | conferir se está tudo por extenso no texto colado |
| Take chapado, sem escalada | baixar Estabilidade pra 40%, e só depois considerar subir Estilo pra 10% |
| Take oscilando de tom entre blocos | subir Estabilidade pra 55% e construir a escalada no mix |

## Checklist

- [ ] Rodar o **teste de 10 segundos** e anotar se a caixa aceita `<break>`
- [ ] Conferir se as **quebras de linha** sobreviveram ao colar
- [ ] Procurar voz **PT-BR nativa** em "Exibir mais" antes de usar as 5 do topo
- [ ] Testar vozes com o **bloco do meio**, não com a abertura
- [ ] Config: velocidade 0,9x · estabilidade 45% · similaridade 75% · estilo 0% · reforço ligado
- [ ] Gerar o corpo numa tirada (ou os 4 blocos, na Loops)
- [ ] Gerar as 3 versões do fecho em separado
- [ ] Conferir na escuta: "sete milhões e quatrocentas mil", "zero vírgula sete por cento", "onze horas", "vinte e dois anos", "cem mil", "Belo Horizonte"
- [ ] Anotar a config do take aprovado na tabela abaixo

## Registro dos testes

| Data | Proposta | Voz | Vel. | Estab. | Simil. | Estilo | Aceita break? | Veredito |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

---

## Apêndice · versão com `<break time>`

**Só use se o teste de 10 segundos confirmar suporte.** Mesmo texto da v4, com a respiração cronometrada em vez de quebra de linha.

**Escada**
```
Agora, enquanto você assiste isso, <break time="0.5s" /> alguém no Brasil está abrindo uma empresa. <break time="0.8s" /> Ela não sabe qual imposto vai pagar. <break time="0.4s" /> Não sabe se escolheu o código certo. <break time="0.4s" /> E vai descobrir isso um ano depois. Quando não dá mais pra corrigir. <break time="1.0s" /> E não é uma pessoa. <break time="0.8s" /> São sete milhões e quatrocentas mil empresas no Simples Nacional, <break time="0.4s" /> vivendo exatamente assim. <break time="0.9s" /> Sabe quanto o maior aplicativo contábil do país atende disso? <break time="0.9s" /> Zero vírgula sete por cento. <break time="0.6s" /> Menos de uma <break time="0.4s" /> em cada cem. <break time="1.0s" /> E o resto? <break time="0.5s" /> O resto ainda é planilha. <break time="0.4s" /> Caderno. <break time="0.4s" /> E um contador que olha a empresa <break time="0.4s" /> uma vez por ano. <break time="0.9s" /> Vamos começar por Belo Horizonte. <break time="0.5s" /> A terceira capital que mais abre empresa no país. Onde uma empresa nasce em onze horas. <break time="0.6s" /> Se funcionar no lugar mais rápido do Brasil, <break time="0.4s" /> funciona em qualquer lugar. <break time="0.9s" /> Por baixo de tudo isso, <break time="0.5s" /> vinte e dois anos de contabilidade de verdade. <break time="0.6s" /> Por cima, <break time="0.4s" /> um produto novo. <break time="0.9s" /> E estamos prontos. <break time="0.6s" /> Prontos para ser o maior aplicativo contábil do Brasil.
```

**Loops**
```
Uma pergunta. <break time="0.5s" /> Quantas empresas brasileiras vivem hoje no Simples Nacional? <break time="1.2s" /> Sete milhões e quatrocentas mil. <break time="1.2s" /> Outra pergunta. <break time="0.5s" /> Quanto disso o maior aplicativo contábil do país atende? <break time="1.2s" /> Zero vírgula sete por cento. <break time="0.6s" /> Menos de uma <break time="0.4s" /> em cada cem. <break time="1.2s" /> Então onde estão as outras noventa e nove? <break time="1.2s" /> Ainda estão na planilha. <break time="0.5s" /> No caderno. <break time="0.5s" /> Num contador que olha a empresa <break time="0.4s" /> uma vez por ano. <break time="0.6s" /> Gente pagando imposto a mais, <break time="0.5s" /> sem nunca saber. <break time="1.0s" /> A gente está construindo o contrário disso. <break time="0.6s" /> Preço fechado. <break time="0.5s" /> Contador de verdade desde o primeiro plano. <break time="0.5s" /> E um app que olha o seu número todo mês. Não uma vez por ano. <break time="1.0s" /> E onde vamos começar? <break time="0.6s" /> Por Belo Horizonte. Onde uma empresa abre em onze horas <break time="0.4s" /> e existem mais de cem mil empresas no nosso perfil. <break time="1.0s" /> E por que parar aqui? <break time="1.0s" /> A gente não vai parar. <break time="0.6s" /> Estamos prontos para ser o maior aplicativo contábil do Brasil.
```

**Onda**
```
Belo Horizonte abre uma empresa em onze horas. <break time="0.6s" /> É a abertura mais rápida do Brasil. <break time="0.6s" /> Na terceira capital que mais abre empresa no país. <break time="0.9s" /> E a gente não vai começar aqui porque é pequeno. <break time="0.6s" /> Vai começar <break time="0.4s" /> porque é o campo de prova mais rápido que existe. <break time="0.9s" /> Se o produto aguentar a cidade que mais acelera, <break time="0.5s" /> ele aguenta o país. <break time="1.0s" /> E o país <break time="0.4s" /> são sete milhões e quatrocentas mil empresas no Simples Nacional. <break time="0.9s" /> Com o maior aplicativo contábil do Brasil atendendo <break time="0.5s" /> zero vírgula sete por cento delas. <break time="1.0s" /> Esse mercado não está consolidado. <break time="0.5s" /> Ele ainda está por ser servido. <break time="0.9s" /> Primeiro <break time="0.4s" /> Belo Horizonte. <break time="0.6s" /> Depois <break time="0.4s" /> Minas. <break time="0.6s" /> Depois <break time="0.4s" /> o Brasil inteiro. <break time="0.9s" /> Mesmo motor. Mesmo preço fechado. Mesmo contador de verdade atrás. <break time="0.6s" /> E por baixo de tudo, <break time="0.5s" /> vinte e dois anos de contabilidade real. <break time="0.9s" /> Não vai ser uma contabilidade de bairro querendo crescer. <break time="0.6s" /> Vai ser um produto nacional que escolheu onde nascer. <break time="0.6s" /> E estamos prontos para ser o maior aplicativo contábil do Brasil.
```

## Links
[[roteiro-escalada-mercado]] · [[roteiro-teaser-investidor]] · [[decisoes-marca]] · [[HOME]]
