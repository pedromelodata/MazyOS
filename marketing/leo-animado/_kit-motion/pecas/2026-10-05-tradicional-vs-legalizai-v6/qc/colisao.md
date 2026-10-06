# Prova de colisão: 2026-10-05-tradicional-vs-legalizai-v6

Gerado em 2026-10-06T15:36:05.068Z pelo kit.py colisao (RM/src/kit/cli/colisao.mjs).

**Resultado: COM COLISÃO.** 0 par(es) de corpos se cruzando em 0 quadro(s); 1 invasão(ões) de faixa em 2 quadro(s); 3 toque(s) aparente(s) em 7 quadro(s).

## Parâmetros

- Quadros testados: 1037 de 1037 pedidos (q 0 a 1036, passo 1; 30 fps; o vídeo tem 1037 quadros).
- Tolerância: 0,6 mm (até aqui é encostar, não colidir).
- Pares permitidos pela cena: lupa x pilhaB.
- Faixa da legenda: conferida; fecho e link: conferidos.
- Toque aparente: folga na linha de visão abaixo de 40 mm com as silhuetas se cobrindo na tela conta.
- Tempo: 60,5 s no total (bundle 1,1 s, quadros 57,6 s, 56 ms por quadro com 3 aba(s); a prova em si, 5,8 ms por quadro em média, 49,1 ms no pior).

## Colisões 3D (corpo entrando em outro)

Nenhuma.

A profundidade é aproximada e por cima: a menor sobreposição das projeções dos vértices dos dois corpos nos eixos das caixas orientadas e nas normais do contato. Em peça côncava (pasta aberta, lupa, despertador) ela pode passar da real.

## Faixas 2D (corpo 3D na legenda, no fecho ou no link)

| corpo | zona | quadros | invasão máx. | pior quadro | retângulo do corpo no pior (px) |
|---|---|---|---|---|---|
| aparelho | fecho | q 946 a 947 (31,53 a 31,57 s) | 123 px | q 946 (31,53 s) | x 368 a 553, y 708 a 1081 |

Zonas: a faixa da legenda (props.legenda) enquanto alguma frase está na tela; o fecho ("Vai," e o logo) com ui.assina; a pílula do link com ui.link. A invasão é o menor lado do retângulo em comum, em px de 1080 x 1920.

## Toque aparente (um cobre o outro na tela quase encostando, sem contato 3D)

| corpos | quadros | folga mín. | pior quadro | na frente | onde (px) | área máx. em comum |
|---|---|---|---|---|---|---|
| placa3 x placa4 | q 655 a 658 (21,83 a 21,93 s) | 0,89 mm | q 658 (21,93 s) | placa3 | 816, 1627 | 1312 px² |
| placa2 x placa3 | q 655 a 656 (21,83 a 21,87 s) | 2,43 mm | q 656 (21,87 s) | placa2 | 653, 1528 | 576 px² |
| aparelho x moeda | q 680 a 682 (22,67 a 22,73 s) | 34,36 mm | q 680 (22,67 s) | moeda | 509, 1164 | 47456 px² |

De frente, a câmera não mostra a folga: a borda de um some atrás do outro e a junção lê como um entrando no outro. Conserto: afastar na tela (sem se cobrirem), afastar em profundidade além do limiar, ou encostar de verdade (com `encostaEm` ou `permitidos`, se o contato for de propósito).

Sobreposições com folga de 40 mm a 10 cm (camada, não contam; pra revisar a olho):

- aparelho x moeda: q 683 a 685 (22,77 a 22,83 s); folga mínima nesses quadros 41,85 mm.
- aparelho x placa1: q 658 a 665 (21,93 a 22,17 s); q 704 a 706 (23,47 a 23,53 s); q 708 a 711 (23,6 a 23,7 s); q 764 (25,47 s); folga mínima nesses quadros 42,85 mm.
- aparelho x placa2: q 659 a 677 (21,97 a 22,57 s); q 710 a 713 (23,67 a 23,77 s); q 764 (25,47 s); folga mínima nesses quadros 44,16 mm.
- aparelho x placa3: q 660 (22 s); q 712 a 714 (23,73 a 23,8 s); folga mínima nesses quadros 44,41 mm.
- carimbo x pilhaA: q 169 (5,63 s); q 198 a 231 (6,6 a 7,7 s); folga mínima nesses quadros 44,87 mm.
- aparelho x cartaoImposto: q 470 a 605 (15,67 a 20,17 s); folga mínima nesses quadros 45,66 mm.
- pastaA x pilhaA: q 0 a 226 (0 a 7,53 s); q 1021 a 1036 (34,03 a 34,53 s); folga mínima nesses quadros 54,3 mm.
- pastaC x telefoneT: q 766 a 868 (25,53 a 28,93 s); folga mínima nesses quadros 71,31 mm.
- carimbo x pastaA: q 187 a 189 (6,23 a 6,3 s); folga mínima nesses quadros 97,84 mm.

## Como ler e consertar

- Cada par vem com os intervalos de quadros, a profundidade máxima e o pior quadro; "onde" é o meio dos pontos de cruzamento visíveis, em px do quadro.
- Contato de propósito (cartão colado na tela, carimbo apoiado na pilha): `userData.encostaEm` no corpo, no quadro em que vale, ou `"colisao": {"permitidos": [["a", "b"]]}` na cena.
- `"colisao": {"tolerancia": 0.0006, "faixaLegenda": true, "faixaFecho": true, "aparente": 0.04}` na cena troca a tolerância e o limiar do toque aparente (metros; `false` desliga) e liga ou desliga as faixas.

