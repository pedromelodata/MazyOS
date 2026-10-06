# Prova de colisão: 2026-10-09-sufoco-burocratico

Gerado em 2026-10-06T14:25:01.428Z pelo kit.py colisao (RM/src/kit/cli/colisao.mjs).

**Resultado: COM COLISÃO.** 0 par(es) de corpos se cruzando em 0 quadro(s); 1 invasão(ões) de faixa em 1 quadro(s); 0 toque(s) aparente(s) em 0 quadro(s).

## Parâmetros

- Quadros testados: 744 de 744 pedidos (q 0 a 743, passo 1; 30 fps; o vídeo tem 744 quadros).
- Tolerância: 0,6 mm (até aqui é encostar, não colidir).
- Pares permitidos pela cena: nenhum.
- Faixa da legenda: conferida; fecho e link: conferidos.
- Toque aparente: folga na linha de visão abaixo de 40 mm com as silhuetas se cobrindo na tela conta.
- Tempo: 52,9 s no total (bundle 1,1 s, quadros 50,7 s, 68 ms por quadro com 3 aba(s); a prova em si, 7,7 ms por quadro em média, 50,9 ms no pior).

## Colisões 3D (corpo entrando em outro)

Nenhuma.

A profundidade é aproximada e por cima: a menor sobreposição das projeções dos vértices dos dois corpos nos eixos das caixas orientadas e nas normais do contato. Em peça côncava (pasta aberta, lupa, despertador) ela pode passar da real.

## Faixas 2D (corpo 3D na legenda, no fecho ou no link)

| corpo | zona | quadros | invasão máx. | pior quadro | retângulo do corpo no pior (px) |
|---|---|---|---|---|---|
| aparelho | fecho | q 653 (21,77 s) | 126 px | q 653 (21,77 s) | x 371 a 525, y 720 a 1030 |

Zonas: a faixa da legenda (props.legenda) enquanto alguma frase está na tela; o fecho ("Vai," e o logo) com ui.assina; a pílula do link com ui.link. A invasão é o menor lado do retângulo em comum, em px de 1080 x 1920.

## Toque aparente (um cobre o outro na tela quase encostando, sem contato 3D)

Nenhum.

Sobreposições com folga de 40 mm a 10 cm (camada, não contam; pra revisar a olho):

- notebookT x telefoneT: q 0 a 447 (0 a 14,9 s); q 726 a 743 (24,2 a 24,77 s); folga mínima nesses quadros 68,75 mm.

## Como ler e consertar

- Cada par vem com os intervalos de quadros, a profundidade máxima e o pior quadro; "onde" é o meio dos pontos de cruzamento visíveis, em px do quadro.
- Contato de propósito (cartão colado na tela, carimbo apoiado na pilha): `userData.encostaEm` no corpo, no quadro em que vale, ou `"colisao": {"permitidos": [["a", "b"]]}` na cena.
- `"colisao": {"tolerancia": 0.0006, "faixaLegenda": true, "faixaFecho": true, "aparente": 0.04}` na cena troca a tolerância e o limiar do toque aparente (metros; `false` desliga) e liga ou desliga as faixas.

