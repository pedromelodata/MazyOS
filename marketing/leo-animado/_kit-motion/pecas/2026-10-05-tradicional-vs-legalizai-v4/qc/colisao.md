# Prova de colisão: 2026-10-05-tradicional-vs-legalizai-v4

Gerado em 2026-10-05T20:05:47.382Z pelo kit.py colisao (RM/src/kit/cli/colisao.mjs).

**Resultado: COM COLISÃO.** 0 par(es) de corpos se cruzando em 0 quadro(s); 1 invasão(ões) de faixa em 2 quadro(s); 4 toque(s) aparente(s) em 9 quadro(s).

## Parâmetros

- Quadros testados: 953 de 953 pedidos (q 0 a 952, passo 1; 30 fps; o vídeo tem 953 quadros).
- Tolerância: 0,6 mm (até aqui é encostar, não colidir).
- Pares permitidos pela cena: lupa x pilhaB.
- Faixa da legenda: conferida; fecho e link: conferidos.
- Toque aparente: folga na linha de visão abaixo de 40 mm com as silhuetas se cobrindo na tela conta.
- Tempo: 62,3 s no total (bundle 1,1 s, quadros 59,8 s, 63 ms por quadro com 3 aba(s); a prova em si, 6,1 ms por quadro em média, 52,7 ms no pior).

## Colisões 3D (corpo entrando em outro)

Nenhuma.

A profundidade é aproximada e por cima: a menor sobreposição das projeções dos vértices dos dois corpos nos eixos das caixas orientadas e nas normais do contato. Em peça côncava (pasta aberta, lupa, despertador) ela pode passar da real.

## Faixas 2D (corpo 3D na legenda, no fecho ou no link)

| corpo | zona | quadros | invasão máx. | pior quadro | retângulo do corpo no pior (px) |
|---|---|---|---|---|---|
| aparelho | fecho | q 862 a 863 (28,73 a 28,77 s) | 123 px | q 862 (28,73 s) | x 362 a 558, y 696 a 1089 |

Zonas: a faixa da legenda (props.legenda) enquanto alguma frase está na tela; o fecho ("Vai," e o logo) com ui.assina; a pílula do link com ui.link. A invasão é o menor lado do retângulo em comum, em px de 1080 x 1920.

## Toque aparente (um cobre o outro na tela quase encostando, sem contato 3D)

| corpos | quadros | folga mín. | pior quadro | na frente | onde (px) | área máx. em comum |
|---|---|---|---|---|---|---|
| placa3 x placa4 | q 584 a 586 (19,47 a 19,53 s) | 0,79 mm | q 586 (19,53 s) | placa3 | 816, 1619 | 1232 px² |
| placa2 x placa3 | q 583 a 584 (19,43 a 19,47 s) | 2,39 mm | q 584 (19,47 s) | placa2 | 653, 1528 | 528 px² |
| carimbo x pilhaA | q 173 (5,77 s); q 193 (6,43 s) | 11,13 mm | q 193 (6,43 s) | carimbo | 431, 1201 | 80080 px² |
| aparelho x moeda | q 607 a 609 (20,23 a 20,3 s) | 34,91 mm | q 607 (20,23 s) | moeda | 500, 1173 | 48304 px² |

De frente, a câmera não mostra a folga: a borda de um some atrás do outro e a junção lê como um entrando no outro. Conserto: afastar na tela (sem se cobrirem), afastar em profundidade além do limiar, ou encostar de verdade (com `encostaEm` ou `permitidos`, se o contato for de propósito).

Sobreposições com folga de 40 mm a 10 cm (camada, não contam; pra revisar a olho):

- carimbo x pilhaA: q 174 (5,8 s); q 206 a 246 (6,87 a 8,2 s); folga mínima nesses quadros 43,3 mm.
- aparelho x moeda: q 610 a 612 (20,33 a 20,4 s); folga mínima nesses quadros 43,3 mm.
- aparelho x placa1: q 591 a 594 (19,7 a 19,8 s); q 641 a 643 (21,37 a 21,43 s); q 645 a 648 (21,5 a 21,6 s); q 707 a 708 (23,57 a 23,6 s); folga mínima nesses quadros 42,82 mm.
- aparelho x placa2: q 596 a 623 (19,87 a 20,77 s); q 647 a 650 (21,57 a 21,67 s); q 708 (23,6 s); folga mínima nesses quadros 44,11 mm.
- aparelho x placa3: q 648 a 651 (21,6 a 21,7 s); folga mínima nesses quadros 44,36 mm.
- aparelho x cartaoImposto: q 438 a 527 (14,6 a 17,57 s); folga mínima nesses quadros 45,58 mm.
- pastaA x pilhaA: q 0 a 222 (0 a 7,4 s); q 937 a 952 (31,23 a 31,73 s); folga mínima nesses quadros 54,3 mm.
- pastaC x telefoneT: q 710 a 741 (23,67 a 24,7 s); folga mínima nesses quadros 71,18 mm.
- carimbo x pastaA: q 195 a 197 (6,5 a 6,57 s); folga mínima nesses quadros 97,88 mm.
- calendario x relogioT: q 248 (8,27 s); folga mínima nesses quadros 99,84 mm.

## Como ler e consertar

- Cada par vem com os intervalos de quadros, a profundidade máxima e o pior quadro; "onde" é o meio dos pontos de cruzamento visíveis, em px do quadro.
- Contato de propósito (cartão colado na tela, carimbo apoiado na pilha): `userData.encostaEm` no corpo, no quadro em que vale, ou `"colisao": {"permitidos": [["a", "b"]]}` na cena.
- `"colisao": {"tolerancia": 0.0006, "faixaLegenda": true, "faixaFecho": true, "aparente": 0.04}` na cena troca a tolerância e o limiar do toque aparente (metros; `false` desliga) e liga ou desliga as faixas.

