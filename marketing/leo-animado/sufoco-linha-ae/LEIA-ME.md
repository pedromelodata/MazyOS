# O sufoco burocrático real, versão 5 (After Effects com celular 3D)

Reel de 09/10 (`reel_c261009`), montado no After Effects, **30,8 s**.

## Versão 5 (07/10/2026): celular 3D e as funcionalidades
Pedido do Pedro: "o modelo do celular precisa ser 3D"; "está faltando uma construção"; depois do "construindo o Legalizaí", "algumas funcionalidades, sem ser emissão de nota", e só então o fecho.

- **O celular 3D.** O AE desta máquina não renderiza modelo 3D, então o iPhone do kit (polyman Studio, CC BY 4.0, modificado) é feito em three.js no Remotion e entra no AE como sequência PNG com alfa.
  - Cena: `precificacao-2026-10-02/remotion/src/sufoco/CelularSufoco.tsx`, composição `CelularSufoco` (1600x2400, 2x do tamanho no AE), public enxuto `public-sufoco/` (fora do git, como todo `public*`). Pra refazer o public: `3d/iphone.glb` por hardlink do `public-kit`, `Sora-wght.ttf` do `public-guia`, e em `telas/` o `assets/home.png` desta pasta mais `inicio`, `impostos_aliquotas`, `pro-labore` e `mais_em-dia` de `marketing/telas-app-2026-10-02/`.
  - Render: `npx remotion render src/index.ts CelularSufoco <pasta> --sequence --image-format=png --public-dir=public-sufoco --binaries-directory=<caminho ABSOLUTO do bin> --browser-executable=<chrome-headless-shell> --gl=angle --concurrency=4` (uns 5 min, 1104 quadros, ~500 MB) e depois `python mistura-120-30.py <pasta> assets/celular-3d`.
  - Renderiza a 120 fps; o `mistura-120-30.py` junta cada 4 subquadros em 1 de 30, com o alfa pré-multiplicado. É o desfoque de movimento dos giros.
  - Saída em `assets/celular-3d/cel_NNNN.png` (276 quadros, 15,55 a 24,75 s do vídeo, já no tempo novo; fica fora do git, refaz pelo Remotion).
  - A construção: as peças do modelo são separadas pela profundidade (frente, corpo, trás). A moldura cresce, o vidro de trás encaixa e a tela pousa pela frente, travando em 16,2 s exatamente no contorno que a linha desenha. Depois a tela acende, os blocos se montam no tempo dos "pops" do mix, a home acende e o aparelho gira.
  - As trocas de tela: vira 55 graus, troca no pico escondida por um brilho que atravessa o vidro e volta passando um pouco.
- **As funcionalidades.** Seis segundos inseridos em 17,9 s, sem fala, sobre a trilha. São 12 batidas a 120 BPM, então a música segue no compasso. Uma tela a cada três batidas (18,035; 19,535; 21,035; 22,535 s), cada uma com o nome no lugar da legenda:
  1. Painel fácil de entender (Início);
  2. Alíquota acompanhada (alíquota efetiva e Fator R, F087);
  3. Folha e pró-labore em dia (pró-labore; no plano ME o contador cuida da folha, F101/F102);
  4. Obrigações do mês à vista (Tudo em dia).
  - Fora: a emissão de nota (pedido do Pedro) e o cadastro de funcionário (no app só existe no plano MEI, e a peça é ME).
  - Nas telas das funcionalidades a base esmaece em branco: a barra de abas, com o botão de nota, não aparece.
- **Como o tempo foi aberto.** A montagem inteira continua escrita no tempo da v4. No JSX, `RT(t)` empurra 6 s todo tempo a partir de 17,9 s, e passa por ele tudo que marca tempo (`kf`, `kfd`, `camada`, entradas e saídas das legendas, a cor do fundo, a volta do loop). O que é do tempo novo (os nomes das funcionalidades) vai com `SEM_RT = true`. Dois casos que atravessavam o corte foram tratados à mão: a linha que sai do celular termina em 17,89 s, e a legenda do "construindo" sai em 17,87 s.
- **O áudio.** `audio-v5.py` monta a voz da v2 com 6 s de silêncio em 18,0 s (dentro da pausa entre "Legalizaí" e "Segue"). Os efeitos de 17,9 s em diante andam 6 s, e cada troca de tela ganha um swish e um brilho. O script roda o mixador do kit com a pasta da peça da v2, que é a que tem a trilha liberada. Saída: `assets/mix-v5.wav` (30,8 s exatos).
- **A legenda do post leva o crédito do modelo:** "Modelo 3D: celular por polyman Studio (Sketchfab, CC BY 4.0), modificado".

## Versões 3 e 4
A versão 3 (06/10/2026) trouxe a linha que desce e liga as cenas, num plano-sequência; a linha é fina (9 px), suave e leva só uma sombra. A versão 4 (07/10/2026) são quatro ajustes pedidos pelo Pedro em cima dela:

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
O AE não é a última etapa. O áudio sai do render no nível do mix (`assets/mix-v5.wav`, −15,5 LUFS; na v4 era o `mix-v2.wav`, −15,9) e o arquivo sai pesado (23 MB na v4). A entrega passa por uma codificação final:

```bash
ffmpeg -y -i saida/_bruto-ae.mp4 -i assets/mix-v5.wav -map 0:v -map 1:a \
  -c:v libx264 -profile:v high -level 5.0 -preset slow -crf 20 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=...:measured_TP=...:measured_LRA=...:measured_thresh=...:linear=true,aresample=48000" \
  -c:a aac -b:a 192k -movflags +faststart saida/SUFOCO-BUROCRATICO-motion-v4.mp4
```

Os `measured_*` saem de uma primeira passada do `loudnorm` com `print_format=json` em cima do wav. Resultado da v5: 924 quadros, 30,8 s, 6,4 MB, −14,0 LUFS, pico −2,4 dBFS; o coral do fundo mede igual ao da v4. Da v4: 744 quadros, 24,8 s, 3,8 MB, −14,2 LUFS, pico −1,7 dBFS.

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
