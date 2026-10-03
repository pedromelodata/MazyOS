# dados/ — drop zone

Solte aqui qualquer arquivo que você quer que o MazyOS leia uma vez: CSV
de exportação do Google Ads, planilha de vendas, PDF de contrato,
transcrição de reunião, print de relatório.

Skills como `/analisar-dados` e `/relatorio-ads` leem direto dessa pasta.
Você arrasta o arquivo, chama o comando, recebe o resumo.

Não é arquivo final — é entrada. O que importa do que tá aqui vira
artefato em `_memoria/`, `marketing/` ou `saidas/`.

Quando você tiver MCPs de armazenamento conectados (Google Drive,
Notion), pode pedir pro Claude buscar os arquivos direto da fonte — sem
precisar baixar nada pra cá.

## Fontes vivas nesta pasta

- `legalizai-calendario-outubro-2026-v4-pre-lancamento.xlsx`: linha editorial V1 de outubro/2026 (calendário de feed e stories + Base Estratégica). É a fonte da pauta de outubro; aplicada em `_memoria/` e no `cronograma/` em 30/09/2026 (ADR da mesma data).
