# Roteiro: O app fazendo a guia do mês, sem site do governo

Peça de 14/10/2026 (reel da guia, motion 3D). Roteiro remontado em 02/10/2026 pelo `KIT/voz/pasta_guia.py`
a partir das 50 palavras da narração aprovada (`RM/src/guia/narracao.json`, conferida pelo md5 do REF). É o
roteiro que o `alinha.py` usa na regressão do kit. O texto de cada palavra é o da legenda aprovada.

## Título

O app fazendo a guia do mês, sem site do governo

## Pilar

17, Facilidade do app: a tela do app fazendo o trabalho (demonstração vale mais que promessa).

## Público

ME. Declarado em 03/10/2026 (rodada 4 do kit) nas três cenas da peça (`fatos.publico` "ME"), pelo que a própria
cena já registrava: o valor que aparece na tela é fictício (empresa de exemplo do app, uma ME do Simples, declarado
em `fatos.exemplos` da cena) e não é guia de MEI (F063). Até 02/10 o público ficava vazio e a regressão esperava o
aviso de público vazio; desde a rodada 4 o público é obrigatório e vazio é conferido como MEI, a regra mais
restrita, que recusaria a folha DAS com R$ 178,31, o contador e as telas com valor.

Decisão a confirmar com o Pedro: se o reel de 14/10 também fala com MEI, o público vira "todos" e a cena do guia
não passa mais na trava (folha DAS, contador e telas com valor). O vídeo entregue (V4) não muda.

## Capa

- Título: O app fazendo a guia do mês
- Destaque: guia

## Narração

<!-- Uma frase da legenda por linha; a palavra-chave entre asteriscos. -->

Veja como vai ser ter a *guia* do mês
*sem* entrar no site do governo.
O *sistema* calcula o imposto e emite a guia.
Ela aparece *pronta*, com o dia que vence.
A sua parte é *só* pagar.
Isso é uma prévia *real* do que estamos construindo.
Chegando em *breve*.

## Batidas

| palavra | batida | o que a imagem faz |
|---|---|---|
| Veja (0) | gancho-giro-varredura, em 0 s | o aparelho gira e assenta com mola, a câmera aproxima devagar e uma varredura de luz passa na lateral |
| sem (9) | nao-de-cabeca, 0,02 s antes da palavra | o aparelho balança a cabeça num "não" de personagem |
| pausa depois de "governo." | mergulho-abre-app, em 3,6 s | a câmera mergulha na tela e o app abre |
| sistema (16) e calcula (17) | card-contador | o card acende em coral, o valor conta até o número fictício da cena e o brilho passa no esqueleto do botão |
| e emite (20 e 21) | empurrar-tela, em 5,7 s | a tela do imposto entra pela direita e a anterior recua |
| a guia (22 e 23) até pronta (26) | objeto-sai-da-tela, nasce em 6,08 s e assenta 0,05 s antes de "pronta," | a guia de papel nasce na tela, voa, assenta de frente e sai pela esquerda |
| com o dia que vence (27 a 31) | relogio-notificacao, em 7,8 s | o relógio entra com o aviso do app no mostrador, vibra duas vezes e sai |
| A sua parte (32 a 34) | flip-troca-escondida, em 8,98 s | o aparelho dá uma volta no ar e a tela troca escondida no verso |
| só pagar (36 e 37) | toque-botao, na palavra 37 | pulso no "só", toque e aperto no "pagar", e o botão mostra o retorno do app |
| prévia real (41 e 42) | recuo-camera, em 10,95 s, com a varredura 0,1 s antes de "real" | a câmera recua, a luz varre o aparelho e ele gira devagar mostrando a tela |
| Chegando em breve (47 a 49) e o fecho | fecho-simbolo e link-bio | o app fecha no splash, o aparelho encolhe até o símbolo do logo, entra "Vai," com o logo e o "aí" acende quando é falado; a pílula do LINK DA BIO entra junto |
| fim do vídeo | volta-loop, 0,95 s antes do fim | o aparelho nasce do símbolo e volta pra pose do quadro 0 (loop) |
