# Prova de colisão: 2026-10-05-tradicional-vs-legalizai-v3

Gerado em 2026-10-05T18:57:38.374Z pelo kit.py colisao (RM/src/kit/cli/colisao.mjs).

**Resultado: COM COLISÃO.** 0 par(es) de corpos se cruzando em 0 quadro(s); 1 invasão(ões) de faixa em 1 quadro(s); 4 toque(s) aparente(s) em 10 quadro(s).

## Parâmetros

- Quadros testados: 998 de 998 pedidos (q 0 a 997, passo 1; 30 fps; o vídeo tem 998 quadros).
- Tolerância: 0,6 mm (até aqui é encostar, não colidir).
- Pares permitidos pela cena: lupa x pilhaB.
- Faixa da legenda: conferida; fecho e link: conferidos.
- Toque aparente: folga na linha de visão abaixo de 40 mm com as silhuetas se cobrindo na tela conta.
- Tempo: 62 s no total (bundle 1 s, quadros 59,6 s, 60 ms por quadro com 3 aba(s); a prova em si, 6,1 ms por quadro em média, 43,5 ms no pior).

## Colisões 3D (corpo entrando em outro)

Nenhuma.

A profundidade é aproximada e por cima: a menor sobreposição das projeções dos vértices dos dois corpos nos eixos das caixas orientadas e nas normais do contato. Em peça côncava (pasta aberta, lupa, despertador) ela pode passar da real.

## Faixas 2D (corpo 3D na legenda, no fecho ou no link)

| corpo | zona | quadros | invasão máx. | pior quadro | retângulo do corpo no pior (px) |
|---|---|---|---|---|---|
| aparelho | fecho | q 907 (30,23 s) | 128 px | q 907 (30,23 s) | x 369 a 513, y 714 a 1005 |

Zonas: a faixa da legenda (props.legenda) enquanto alguma frase está na tela; o fecho ("Vai," e o logo) com ui.assina; a pílula do link com ui.link. A invasão é o menor lado do retângulo em comum, em px de 1080 x 1920.

## Toque aparente (um cobre o outro na tela quase encostando, sem contato 3D)

| corpos | quadros | folga mín. | pior quadro | na frente | onde (px) | área máx. em comum |
|---|---|---|---|---|---|---|
| placa3 x placa4 | q 586 a 588 (19,53 a 19,6 s) | 1,01 mm | q 588 (19,6 s) | placa3 | 809, 1585 | 1280 px² |
| placa2 x placa3 | q 585 a 586 (19,5 a 19,53 s) | 3,13 mm | q 586 (19,53 s) | placa2 | 643, 1494 | 576 px² |
| carimbo x pilhaA | q 173 (5,77 s); q 193 (6,43 s) | 11,13 mm | q 193 (6,43 s) | carimbo | 431, 1201 | 80064 px² |
| aparelho x moeda | q 620 a 623 (20,67 a 20,77 s) | 34,83 mm | q 620 (20,67 s) | moeda | 501, 1168 | 48256 px² |

De frente, a câmera não mostra a folga: a borda de um some atrás do outro e a junção lê como um entrando no outro. Conserto: afastar na tela (sem se cobrirem), afastar em profundidade além do limiar, ou encostar de verdade (com `encostaEm` ou `permitidos`, se o contato for de propósito).

Sobreposições com folga de 40 mm a 10 cm (camada, não contam; pra revisar a olho):

- carimbo x pilhaA: q 174 (5,8 s); q 206 a 246 (6,87 a 8,2 s); folga mínima nesses quadros 43,32 mm.
- aparelho x moeda: q 624 a 626 (20,8 a 20,87 s); folga mínima nesses quadros 46,38 mm.
- aparelho x placa1: q 598 a 601 (19,93 a 20,03 s); q 661 a 663 (22,03 a 22,1 s); q 665 a 669 (22,17 a 22,3 s); q 743 a 744 (24,77 a 24,8 s); folga mínima nesses quadros 42,76 mm.
- aparelho x placa2: q 623 a 652 (20,77 a 21,73 s); q 667 a 670 (22,23 a 22,33 s); q 743 a 744 (24,77 a 24,8 s); folga mínima nesses quadros 43,69 mm.
- aparelho x placa3: q 668 a 671 (22,27 a 22,37 s); folga mínima nesses quadros 44,36 mm.
- aparelho x cartaoImposto: q 444 a 533 (14,8 a 17,77 s); folga mínima nesses quadros 45,64 mm.
- pastaA x pilhaA: q 0 a 236 (0 a 7,87 s); q 981 a 997 (32,7 a 33,23 s); folga mínima nesses quadros 54,25 mm.
- pastaC x telefoneT: q 745 a 775 (24,83 a 25,83 s); folga mínima nesses quadros 71,27 mm.
- carimbo x pastaA: q 195 a 197 (6,5 a 6,57 s); folga mínima nesses quadros 97,88 mm.

## Como ler e consertar

- Cada par vem com os intervalos de quadros, a profundidade máxima e o pior quadro; "onde" é o meio dos pontos de cruzamento visíveis, em px do quadro.
- Contato de propósito (cartão colado na tela, carimbo apoiado na pilha): `userData.encostaEm` no corpo, no quadro em que vale, ou `"colisao": {"permitidos": [["a", "b"]]}` na cena.
- `"colisao": {"tolerancia": 0.0006, "faixaLegenda": true, "faixaFecho": true, "aparente": 0.04}` na cena troca a tolerância e o limiar do toque aparente (metros; `false` desliga) e liga ou desliga as faixas.

