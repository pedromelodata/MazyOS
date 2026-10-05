# Prova de colisão: 2026-10-05-tradicional-vs-legalizai-v2

Gerado em 2026-10-05T17:00:35.292Z pelo kit.py colisao (RM/src/kit/cli/colisao.mjs).

**Resultado: COM COLISÃO.** 0 par(es) de corpos se cruzando em 0 quadro(s); 1 invasão(ões) de faixa em 2 quadro(s); 2 toque(s) aparente(s) em 4 quadro(s).

## Parâmetros

- Quadros testados: 836 de 836 pedidos (q 0 a 835, passo 1; 30 fps; o vídeo tem 836 quadros).
- Tolerância: 0,6 mm (até aqui é encostar, não colidir).
- Pares permitidos pela cena: lupa x pilhaB.
- Faixa da legenda: conferida; fecho e link: conferidos.
- Toque aparente: folga na linha de visão abaixo de 40 mm com as silhuetas se cobrindo na tela conta.
- Tempo: 49,5 s no total (bundle 1 s, quadros 47,1 s, 56 ms por quadro com 3 aba(s); a prova em si, 5,5 ms por quadro em média, 42,3 ms no pior).

## Colisões 3D (corpo entrando em outro)

Nenhuma.

A profundidade é aproximada e por cima: a menor sobreposição das projeções dos vértices dos dois corpos nos eixos das caixas orientadas e nas normais do contato. Em peça côncava (pasta aberta, lupa, despertador) ela pode passar da real.

## Faixas 2D (corpo 3D na legenda, no fecho ou no link)

| corpo | zona | quadros | invasão máx. | pior quadro | retângulo do corpo no pior (px) |
|---|---|---|---|---|---|
| aparelho | fecho | q 745 a 746 (24,83 a 24,87 s) | 123 px | q 745 (24,83 s) | x 373 a 548, y 712 a 1065 |

Zonas: a faixa da legenda (props.legenda) enquanto alguma frase está na tela; o fecho ("Vai," e o logo) com ui.assina; a pílula do link com ui.link. A invasão é o menor lado do retângulo em comum, em px de 1080 x 1920.

## Toque aparente (um cobre o outro na tela quase encostando, sem contato 3D)

| corpos | quadros | folga mín. | pior quadro | na frente | onde (px) | área máx. em comum |
|---|---|---|---|---|---|---|
| carimbo x pilhaA | q 178 (5,93 s) | 25,24 mm | q 178 (5,93 s) | carimbo | 402, 1185 | 16784 px² |
| aparelho x moeda | q 463 a 465 (15,43 a 15,5 s) | 35,37 mm | q 463 (15,43 s) | moeda | 453, 1119 | 37776 px² |

De frente, a câmera não mostra a folga: a borda de um some atrás do outro e a junção lê como um entrando no outro. Conserto: afastar na tela (sem se cobrirem), afastar em profundidade além do limiar, ou encostar de verdade (com `encostaEm` ou `permitidos`, se o contato for de propósito).

Sobreposições com folga de 40 mm a 10 cm (camada, não contam; pra revisar a olho):

- carimbo x pilhaA: q 179 (5,97 s); q 183 (6,1 s); folga mínima nesses quadros 72,08 mm.
- aparelho x moeda: q 466 a 467 (15,53 a 15,57 s); folga mínima nesses quadros 41,19 mm.
- despP x pilhaA: q 62 a 63 (2,07 a 2,1 s); folga mínima nesses quadros 41,93 mm.
- aparelho x cartaoImposto: q 306 a 391 (10,2 a 13,03 s); folga mínima nesses quadros 42,66 mm.
- aparelho x placa1: q 441 (14,7 s); q 450 a 452 (15 a 15,07 s); q 517 a 538 (17,23 a 17,93 s); q 560 a 584 (18,67 a 19,47 s); folga mínima nesses quadros 43,85 mm.
- aparelho x placa2: q 442 (14,73 s); q 456 a 542 (15,2 a 18,07 s); q 556 a 584 (18,53 a 19,47 s); folga mínima nesses quadros 44,69 mm.
- aparelho x placa3: q 443 (14,77 s); q 451 a 542 (15,03 a 18,07 s); q 556 a 584 (18,53 a 19,47 s); folga mínima nesses quadros 44,98 mm.
- aparelho x placa4: q 462 a 530 (15,4 a 17,67 s); q 568 a 583 (18,93 a 19,43 s); folga mínima nesses quadros 45,48 mm.
- aparelho x cartaoNasceu: q 265 a 280 (8,83 a 9,33 s); folga mínima nesses quadros 46,22 mm.
- pastaA x pilhaA: q 143 a 231 (4,77 a 7,7 s); folga mínima nesses quadros 51,08 mm.
- carimbo x pastaA: q 143 a 194 (4,77 a 6,47 s); folga mínima nesses quadros 91,26 mm.

## Como ler e consertar

- Cada par vem com os intervalos de quadros, a profundidade máxima e o pior quadro; "onde" é o meio dos pontos de cruzamento visíveis, em px do quadro.
- Contato de propósito (cartão colado na tela, carimbo apoiado na pilha): `userData.encostaEm` no corpo, no quadro em que vale, ou `"colisao": {"permitidos": [["a", "b"]]}` na cena.
- `"colisao": {"tolerancia": 0.0006, "faixaLegenda": true, "faixaFecho": true, "aparente": 0.04}` na cena troca a tolerância e o limiar do toque aparente (metros; `false` desliga) e liga ou desliga as faixas.

