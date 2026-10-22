# Telas da nota fiscal (protótipo do app, 19/10/2026)

O fluxo da nota fiscal do plano ME, capturado do protótipo do repositório do Legalize no commit 98cc962e. O app foi rodado numa cópia separada, sem o banco do ensaio, e a nota é de exemplo. Resolução 1290x2796 (iPhone a 3x).

- Persona fictícia P03, Rafael (filmagem de eventos), com CNPJ fictício 33.333.333/0001-33.
- Cliente fictícia Mariana Rocha Duarte, pessoa física. Na tela 5 aparece o CPF fictício dela.
- A persona padrão do protótipo (P0) tem os dados reais da empresa do Pedro e não deve ir pra peça.
- Os botões de teste do protótipo (🧪) e o selo do Next foram escondidos na captura.

1. Início, com o atalho "Emitir nota" e o botão central (+).
2. Início com o botão central aberto: "Emitir nota fiscal".
3. Emitir nota vazia: pra quem é, qual o valor, o que foi feito, onde e qual serviço.
4. A mesma tela preenchida: cliente, R$ 2.500,00 e o serviço.
5. "Confira antes de emitir", com o botão "Emitir nota de R$ 2.500,00".
6. O check: "Nota nº 000010 emitida".
7. A nota emitida, com Baixar PDF, Enviar ao cliente e Baixar XML.

Pra recapturar: o script está no scratchpad da sessão de 19/10 (`telas-nfe/captura.mjs`), rodando com o protótipo isolado na porta 3005.
