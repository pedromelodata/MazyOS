# O sufoco burocrático real, versão 3 (After Effects)

Reel de 09/10 (`reel_c261009`), montado no After Effects em 06/10/2026 a pedido do Pedro: uma linha que desce e liga as cenas, num plano-sequência. A linha é fina (9 px), suave e leva só uma sombra.

## Arquivos
- `gera.mjs`: gera o `monta.jsx`, o script que monta o projeto inteiro no AE (o mundo vertical, a linha, as cenas, a legenda e o fecho). Os tempos saem de `assets/narracao.json` (a mesma voz da v2).
- `monta-e-renderiza.sh <saida.mp4> --so-monta`: gera o script e manda pro AE aberto. Monta o `SUFOCO-LINHA.aep` e grava o `monta.log`.
- `renderiza-blocos.sh <saida.mp4> 200`: renderiza pelo aerender em blocos de 200 quadros e junta.
- `capa.py <video> <capa.png>`: a capa, com o título da capa da v2.
- `saida/`: o vídeo entregue (com o áudio do final da v2, a -14 LUFS) e a capa.

## Armadilhas do AE nesta máquina
- O `AfterFX.exe -r` não roda script de caminho com espaço: o `monta-e-renderiza.sh` copia o script pro Temp.
- O painel da ponte (mcp-bridge-auto) não fica aberto rodando por `-r`, porque a janela flutuante fecha quando o script acaba. Os scripts vão direto por `-r`, com `app.beginSuppressDialogs()`: sem isso, um aviso do AE trava tudo esperando clique.
- No script, uma propriedade pega antes de adicionar outra no mesmo grupo fica inválida. Por isso os grupos são guardados como caminho (camada e índices) e buscados de novo a cada uso.
- Nas camadas de forma, o primeiro grupo da lista é desenhado na frente. O gerador cria de trás pra frente, e o `reordena` inverte no fim.
- O aerender acumula memória e trava num render inteiro (no quadro 406, com 9 GB). Em blocos de 200 quadros, cada um num processo, roda limpo.
- O desfoque de movimento fica só nas cenas e na linha. As faixas de fundo e as íris ficam sem ele.
