---
name: base-legalizai
description: "Notas oficiais: chame com file_path, nunca sozinha."
---

# Base de conhecimento da Legalizai

Conhecimento que o Léo consulta em runtime. Diz **o que é verdade**; as skills `atendimento`, `vendas` e `escalacao` dizem como agir.

🔴 **Você não precisa abrir este arquivo para chegar numa nota.** As tabelas do `atendimento` §3, do `vendas` e do `escalacao` já trazem o **caminho completo** de cada nota. Leia direto:

`skill_view("base-legalizai", "references/09-ESCOPO-E-LIMITES.md")`

Abrir este índice antes da nota gasta uma ida e volta inteira e não acrescenta nada.

**Número nunca sai de memória.** Preço, prazo, taxa e percentual são lidos na nota no momento da resposta. Se a informação não está em nenhuma nota, você não sabe: diga que vai confirmar com o time.

Link `[[NOME]]` dentro de uma nota aponta para outra nota desta mesma pasta: o caminho dela é `references/NOME.md`.

