# Roteiro: <título da proposta>

<!--
Modelo de roteiro de peça do kit de motion (KIT/voz/roteiro.modelo.md). O kit.py nova copia este arquivo pra
pecas/<peca>/roteiro.md. Preencha tudo, mostre ao Pedro e só gere a voz (TTS) depois do OK dele, batida por batida.
O alinha.py lê a seção "## Narração". O kit.py fatos confere as seções Narração e Batidas e trava o final com erro.
-->

## Antes de escrever

- **Fato só da base.** Número, prazo, regra ou preço só entra se estiver no `BASE/FATOS.md` (`C:/MKT-INSTA/Content Legalizai/_base-contabil/FATOS.md`) com status USAR, e nada do `PROIBIDO.md` entra. Valor fictício de tela (a empresa de exemplo do app) só entra declarado em `fatos.exemplos` da cena, com a origem. O `kit.py fatos` confere.
- **Nunca orientar a fazer sozinho.** Nada de ensinar o caminho dos sites do governo nem de mandar a pessoa resolver por conta própria. O caminho é sempre o app. No MEI, o app prepara e o titular só confirma (F071).
- **O nome só aparece no fecho.** O "Vai, Legalizaí" é fixo e entra sozinho no fim (`KIT/voz/fecho/`). Não escreva o nome na narração nem no título da capa.
- **1ª pessoa só com o Léo na tela.** Sem o Léo aparecendo, a fala é "a gente" ou impessoal.
- **Valor da guia do MEI, nunca (F063).** Diga que é guia fixa e que o app mostra o valor certo. Em peça de MEI, nenhum valor em reais ligado a guia ou DAS.
- **Pilar primeiro.** A peça entrega o que a descrição do pilar promete (linha editorial V1).
- **Texto limpo.** Zero travessão (nem o caractere, nem traço decorativo antes de texto), nenhum selo de construção na tela, "Legalizaí" sempre com acento.

## Título

<o título da proposta, o mesmo do reel.md; vira o nome da pasta final>

## Pilar

<número e nome do pilar, e o que a peça entrega dele>

## Público

<ME, MEI ou os dois> (vai também em `fatos.publico` da cena)

## Capa

- Título: <o título curto da capa, em até 3 linhas, sem o nome da marca>
- Destaque: <a palavra do título que fica coral>

## Narração

<!--
Uma frase da legenda por linha, na ordem em que é falada. Marque a palavra-chave de cada frase entre asteriscos,
uma por frase (por exemplo *pronta*,); sem marca, a chave é a última palavra da frase. O texto de cada palavra,
com acento e pontuação, é o que aparece na legenda. Não escreva o fecho: ele é fixo e entra sozinho.
Linhas que começam com > ficam fora da narração (servem de nota).
-->

Primeira frase da legenda com a *chave* marcada
Segunda frase com outra *chave* marcada

## Batidas

| palavra | batida | o que a imagem faz |
|---|---|---|
| <palavra (índice)> | <id da batida e o tempo, se não for o da palavra> | <o que a imagem faz nessa hora> |
