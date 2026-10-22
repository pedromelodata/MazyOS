# Telas da 5.2, Declarações entregues (20/10/2026)

Telas da funcionalidade 5.2 (Declarações entregues: DEFIS, DCTF, SPED) com o visual atual do app, pros stories de 23/10 (faltam 18).

Capturadas do protótipo do repositório Legalizei (commit ce04ce32, puxado em 20/10), numa cópia isolada, com a persona fictícia P03 (Rafael Teixeira Lima, CNPJ fictício 33.333.333/0001-33). Uma trava recusa qualquer tela com dado da empresa real.

A data do ensaio foi avançada pra 31/10/2026. Com a data padrão do protótipo (06/10), as declarações de setembro ainda aparecem como "A entregar". Em 31/10 as três aparecem como "Entregue", com o botão "Recibo", que é o que o Q3 diz.

## Arquivos

| Arquivo | O que mostra | Uso |
|---|---|---|
| `1 Declarações, setembro entregue (tela inteira).png` | A tela inteira: título, subtítulo, as três declarações de setembro entregues e o começo de "Já na fila · outubro" | Referência ou celular 3D. No stories, prefira o recorte 2: o subtítulo ("O que a gente entrega ao governo por você. Você não preenche nada.") repete o texto do Q3 |
| `2 Recorte pro stories, setembro entregue (3 declarações).png` | "Todo mês · setembro de 2026" e os três cartões com "Entregue em 12/10/2026" e "Recibo" | **Q3 do 23/10.** Já está em `stories-contagem-lancamento/telas/` com o nome do dia |
| `3 Recorte curto, setembro entregue (2 declarações).png` | Só os dois primeiros cartões (pró-labore informado ao governo e declaração mensal do Simples) | Se quiser o quadro mais leve, sem o cartão do INSS e do imposto de renda do pró-labore |
| `4 Recorte opcional, anuais de 2025 entregues.png` | Informe de rendimentos de 2025 e declaração anual do Simples de 2025, os dois entregues | Opcional, pro "outra todo ano" do Q2 |

## Cuidados

- **Tela fiscal:** fala de pró-labore, de imposto de renda e de declaração do Simples. Vai pra peça com o seu ok, como as outras telas fiscais.
- **Valores e datas:** o "R$ 15.000,00" e as datas são da persona fictícia e podem ficar nítidos.
- **Prazo da DCTFWeb:** os recortes 2 e 3 não mostram o prazo da DCTFWeb (só "Entregue em"), então ficam fora da divergência entre o app (último dia útil do mês seguinte) e a base (F101, dia 15). A tela inteira também não mostra esse prazo pra setembro.
- **"Recibo" e "comprovante":** o botão da tela diz "Recibo" e o Q3 diz "comprovante". O sentido é o mesmo; se quiser a imagem e o texto iguais, o Q3 vira "Em breve no plano ME: o contador entrega, você só vê o recibo."
- **Fora dos recortes:** "Já na fila · outubro" (prazos de novembro), "Tirou lucro em outubro?", "Meses anteriores" (que abre "Agosto De 2026", com o "De" maiúsculo), a declaração anual de 2026 (com a frase sobre o formato de 2027) e o cartão "Livro caixa ou escrituração completa?" (com o 32%).
- **O botão "Recibo"** não abre nada no protótipo. Não existe tela do recibo pra mostrar.

## Como recapturar

Os scripts estão no scratchpad desta sessão (`telas-declaracoes/captura.mjs` e `recortar.py`). Eles rodam contra a cópia isolada na porta 3005, trocam pra P03 antes de tudo e avançam a data do ensaio pelo campo de data do painel de teste.
