# O sufoco burocrático real, versão 4 (After Effects)

Reel de 09/10 (`reel_c261009`), montado no After Effects. A versão 3 (06/10/2026) trouxe a linha que desce e liga as cenas, num plano-sequência; a linha é fina (9 px), suave e leva só uma sombra. A versão 4 (07/10/2026) são quatro ajustes pedidos pelo Pedro em cima dela:

1. **O bilhete do "fim do dia" se parte.** Ele é desenhado numa pré-composição e picotado por doze máscaras, numa grade com os pontos internos tortos. O bilhete treme, os riscos do corte passam por cima e os pedaços estouram pra fora girando, caindo com gravidade.
2. **O símbolo de pausado.** No lugar das duas barrinhas, o play dentro de um círculo escuro, como o do YouTube.
3. **O celular do "construindo o Legalizaí".** Guias de construção mais fortes (linhas de projeto que cruzam o quadro, contorno duplo no sentido contrário, marcas nos cantos e um pulso quando fecha), giro de produto com desfoque de movimento junto com o avanço da câmera, luz atrás do aparelho, brilho passando no vidro e a **tela de home do app** (`assets/home.png`) no lugar da splash.
4. **O fecho sem risco sobrando.** A linha vira um cometa que desce do link da bio e entra no quadrado do logo; o visto branco é desenhado dentro dele, recortado na forma exata do visto (`assets/logo-sem-visto.png`).

Mesma narração, trilha e efeitos das versões 2 e 3.

## Arquivos
- `gera.mjs`: gera o `monta.jsx`, o script que monta o projeto inteiro no AE (o mundo vertical, a linha, as cenas, a legenda e o fecho). Os tempos saem de `assets/narracao.json` (a mesma voz da v2).
- `monta-e-renderiza.sh <saida.mp4> --so-monta`: gera o script e manda pro AE aberto. Monta o `SUFOCO-LINHA.aep` e grava o `monta.log`.
- `renderiza-blocos.sh <saida.mp4> 200`: renderiza pelo aerender em blocos de 200 quadros e junta. Com o projeto da v4 o render inteiro de uma vez passa em 35 s, então os blocos viraram reserva.
- `instrumenta.mjs <entrada.jsx> <saida.jsx> [a cada N]`: põe um marco de progresso em cada instrução do script montado, gravado na hora em `marcos.log`. É o jeito de achar onde o AE morre, porque o `monta.log` só é escrito no fim.
- `teste-pausado.mjs`: monta um `.jsx` mínimo com uma camada só, pra separar "a instrução é ruim" de "o projeto já está pesado".
- `capa.py <video> <capa.png>`: a capa, com o título da capa da v2.
- `saida/`: o vídeo entregue e a capa.

## Como fechar o vídeo
O AE não é a última etapa. O áudio sai do render a −15,9 LUFS (é o nível do `assets/mix-v2.wav`) e o arquivo sai com uns 23 MB. A entrega passa por uma codificação final:

```bash
ffmpeg -y -i saida/_bruto-ae.mp4 -i assets/mix-v2.wav -map 0:v -map 1:a \
  -c:v libx264 -profile:v high -level 5.0 -preset slow -crf 20 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=...:measured_TP=...:measured_LRA=...:measured_thresh=...:linear=true,aresample=48000" \
  -c:a aac -b:a 192k -movflags +faststart saida/SUFOCO-BUROCRATICO-motion-v4.mp4
```

Os `measured_*` saem de uma primeira passada do `loudnorm` com `print_format=json` em cima do wav. Resultado da v4: 744 quadros, 24,8 s, 3,8 MB, −14,2 LUFS, pico −1,7 dBFS, igual à v3.

## Armadilhas do AE nesta máquina
- **Montagem longa derruba o AE se cada operação virar um passo de desfazer.** A v4 morria sempre na mesma instrução, por volta da 980ª, sem erro e sem log, e a mesma instrução sozinha num projeto vazio passava lisa. O conserto está no `gera.mjs`: a montagem inteira vai dentro de um `app.beginUndoGroup("montagem")` e, a cada 150 instruções, entra um `app.purge(PurgeTarget.ALL_CACHES)`. Com isso as 1767 instruções passam e o projeto salva com 93 camadas. Na v3, com menos operações, não dava.
- **O `monta.log` só é escrito no fim**, então um travamento não deixa pista nenhuma. Quando o AE morrer, rodar o `instrumenta.mjs` e ler o `marcos.log`: a última linha é a instrução anterior à que matou.
- **O filtro "Arredondar cantos" (`ADBE Vector Filter - RoundCorners`) não entra por script.** O triângulo do play é desenhado já arredondado, pelo `poliArred(pontos, raio)` do gerador, que calcula os arcos em bezier.
- **Falha anterior trava a abertura.** Depois de um travamento, o AE abre com o aviso "Opções de reparo de falhas" e fica parado nele; nesse estado o `-r` não chega na instância e abre uma segunda. Pior: se alguém escolher "Iniciar no modo de segurança", o AE sobe sem o plug-in de scripts e responde "Não é possível executar o script. O plug-in de Script não está instalado." Antes de montar, conferir que existe **uma** instância e que o título da janela principal já é "Adobe After Effects 2026 - ...".
- O `AfterFX.exe -r` não roda script de caminho com espaço: o `monta-e-renderiza.sh` copia o script pro Temp.
- O painel da ponte (mcp-bridge-auto) não fica aberto rodando por `-r`, porque a janela flutuante fecha quando o script acaba. Os scripts vão direto por `-r`, com `app.beginSuppressDialogs()`: sem isso, um aviso do AE trava tudo esperando clique.
- No script, uma propriedade pega antes de adicionar outra no mesmo grupo fica inválida. Por isso os grupos são guardados como caminho (camada e índices) e buscados de novo a cada uso.
- Nas camadas de forma, o primeiro grupo da lista é desenhado na frente. O gerador cria de trás pra frente, e o `reordena` inverte no fim.
- O aerender acumulava memória e travava num render inteiro da v3 (no quadro 406, com 9 GB). Em blocos de 200 quadros, cada um num processo, roda limpo.
- O desfoque de movimento fica só nas cenas e na linha. As faixas de fundo e as íris ficam sem ele.
