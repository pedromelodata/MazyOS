# O sufoco burocrático real, versão 8 (After Effects, celular 3D, narração numa tomada só)

Reel de 09/10 (`reel_c261009`), montado no After Effects, **43,2 s**.

## Versão 8 (07/10/2026): a narração inteira numa tomada só
Pedido do Pedro: "Pode gerar a narração de tudo e colocar no vídeo final, lembrando que deve ser uma gravação só, sem travas ou engasgo."

- **A voz** (`voz-v8/`). As 13 frases e o "Vai, Legalizaí!" saíram numa tomada só do TTS (clone `Pedro-Legalizai`, seed_audio, "app" escrito "ép"). A tomada foi convertida inteira pro Dylan, sem corte, sem emenda e sem acelerar.
  - **Três tomadas, ficou a 2.** A 1 corria demais e tinha um "se" a mais no começo. A 3 travava 0,47 s no meio do "É por isso que a gente". A 2 tem o ritmo da v7 (razão 1,05).
  - **O conferidor** é o `voz-v8/analisa.py`. Ele roda o whisper do kit, alinha palavra por palavra com o `voz-v8/roteiro.json` e mede as pausas pelo som, separando "entre frases", "vírgula" e "TRAVA".
  - **Na voz convertida, o whisper ouviu "nada é resolvido".** Isolando o trecho, em três janelas, ele ouve "nada resolvido". Era o whisper, não a voz.
  - **O `voz-v8/monta-voz.py`** faz três coisas:
    - casa o nível da fala com a narração da v2 (−29,7 LUFS) e grava `assets/audio-v8/voz-v8.wav`;
    - grava `assets/narracao-v8.json`, com as palavras no tempo novo. As fronteiras entre frases saem das pausas medidas pelo som, porque o whisper esticava o fim da palavra pela pausa adentro;
    - grava o mapa de tempo `assets/warp-v8.json`.
- **O vídeo se ajusta à voz sem refazer as cenas.** A montagem continua escrita no tempo da v7, e o mapa leva cada tempo da v7 pro tempo da voz nova. No JSX, o `RT` faz as duas coisas, então tudo que passava por ele acompanha: chaves, entradas e saídas, a cor da faixa e a volta do loop.
  - **As âncoras do mapa** são o começo e o fim de cada frase e as palavras que disparam animação (as do `T` do `gera.mjs` e as do `W()` do `funcionalidades.mjs`). Entre elas, uma cúbica monótona. A tabela tem um ponto a cada 0,02 s, e a inclinação vai de 0,45 a 2,3 (mediana 0,94).
  - **Palavra a palavra não serve.** Duas palavras quase coladas na v7 e afastadas na voz nova davam trechos esticados 10x, e o celular 3D dava tranco ali.
  - **O celular 3D não foi renderizado de novo.** A sequência da v7 anda pelo mesmo mapa, com remapeamento de tempo no AE (uma chave linear a cada 1/15 s).
  - **A legenda é montada direto no tempo da voz nova**, com `SEM_WARP`. O "anoitece" e a saída do "construindo" são convertidos pelo `RTn` do gerador.
  - **O áudio.** O `audio-v8.py` leva os efeitos da v2 e os das funcionalidades pelo mesmo mapa e mixa com a trilha do tamanho novo (`assets/mix-v8.wav`, 139 eventos).
- **A legenda ficou com até 4 palavras por bloco.** Com a fala mais rápida, o corte chegou a juntar "e sua empresa parada esperando." num bloco de 5. Agora 5 é proibido.
  - O corte também não parte "link da bio", "prestador de serviço" e "contador de verdade". Antes saía "E clica no link / da bio.".
  - São 32 blocos.
- **A capa** é o quadro de 3,0 s da v7 levado pro tempo novo (2,68 s). O de 3,0 s da v8 cai no meio do movimento da câmera.
- **Resultado:** 1295 quadros, 43,2 s, 8,0 MB, −14,0 LUFS, pico −2,7 dBFS. Conferido quadro a quadro: cada evento de cena na palavra, as 32 legendas e a montagem do 3D no "construindo".

## Versão 7 (07/10/2026): sem WhatsApp, "prestador de serviço", legenda em blocos, voz-guia
Pedido do Pedro: "A narração eu vou fazer, mas não vamos falar ainda que avisaremos no Whatsapp. Na outra tela troque microempresa para 'Quem é prestador de serviço'. Nas legendas deixe apenas aparecendo 3 a 4 palavras e nas palavras ênfase troque o tipo de fonte para uma mais diferente e personalizada."

- **As duas falas que mudaram:**
  - 4: "A gente avisa cada prazo no app." A cena dos avisos perdeu a mensagem do WhatsApp; ficaram o sino, o prazo circulado e a notificação do app, com o grupo centrado de novo.
  - 5: "E, pra quem é prestador de serviço, um contador de verdade cuida da folha e das declarações." A pílula da cena virou "Prestador de serviço" (430 px de largura).
  - **Atenção ao P06.** A Legalizaí só atende serviço (F030), então "prestador de serviço" inclui o MEI. O PROIBIDO P06, regra bloqueante, barra insinuar contador no MEI. A frase ficou como o Pedro pediu e o aviso foi pra ele. A troca sugerida: "pra quem é prestador de serviço **no plano ME**".
- **A voz é guia.** O Pedro vai gravar a narração inteira, e o vídeo se ajusta ao tempo da gravação dele. O roteiro pra gravar está em `roteiro-narracao-v7.md`, e a gravação vai em `voz-pedro/`.
  - Até lá, as falas 4 e 5 são tomadas novas do mesmo clone convertido pro Dylan (`voz-v6/falas/dylan-45v7.wav`, a tomada C do `voz-v6.py`). A fala 4 saiu de uma tomada com o buraco depois do "A" encurtado, e a 5 com a pausa depois do "verdade" encurtada.
  - **O que mudou no `voz-v6.py`:**
    - O começo de cada fala é refinado pelo som (−60 dB). O "S" do "Sua" fica entre −60 e −41 dB e sumia com −40.
    - O fim pede 150 ms de silêncio. Com 80 ms, o estalo do "p" do "app" ficava de fora.
    - As marcas da tomada C corrigem o "E" da fala 5, que o whisper começava 1 s antes.
    - A folga até o compasso se espalha pelas pausas, até 1,05 s. Sem o WhatsApp, sobrava quase 1 s de silêncio antes do "Segue a gente".
  - O vão continua em 20 s e o vídeo em 44,8 s.
- **A legenda** (`legenda()` do `gera.mjs` e `blocos.mjs`).
  - **Blocos.** Só 3 a 4 palavras por vez, numa linha. O `blocos.mjs` corta cada fala em blocos de 2 a 5 palavras (o ideal é 3 ou 4). São 33 blocos no vídeo. As regras do corte:
    - corta depois da pontuação, nunca no meio dela;
    - evita terminar bloco em palavra fraca ("e", "de", "um"...), que é dita no fim e mal acende;
    - olha o tempo da fala: evita bloco com menos de 0,55 s na tela (na fala rápida, "que a gente" ficava 0,26 s) e a ênfase fechando um bloco que troca logo depois dela.
  - **Os tempos** saem do `legendaDaFrase()` do `blocos.mjs`, o mesmo cálculo que a conferência usa.
    - Cada bloco é uma camada de texto. Entra com a primeira palavra dele; o anterior sai em 0,06 s logo antes, sem os dois juntos na tela.
    - Quando a ênfase fecha o bloco, a troca espera 0,3 s depois dela. O último bloco fica até a fala seguinte.
    - As palavras acendem quando são ditas, como antes.
  - **A ênfase.** A palavra-chave de cada frase vem na **DM Serif Display Italic** (Google Fonts, licença OFL, em `assets/fontes/`, instalada pro usuário), em 96 px contra 72 px da Sora Bold, na cor da chave. É a exceção à "Sora em tudo" do guia, pedida pelo Pedro.
    - **O pulo.** Quando ela é dita, salta 12 px e cresce até 106%, em 0,26 s. Com 124% e com 112%, encostava na palavra vizinha.
    - **Os espaços dos lados** entram na fonte da ênfase, com entreletra 140. O itálico inclina pra esquerda e colava na palavra anterior.
    - A troca de fonte é por trecho, dentro da mesma camada (`TextDocument.characterRange`, AE 24.3 em diante; o `enfase()` do JSX).
    - **Não converter o CharacterRange em texto** (`"" + cr`): no AE 26.3 isso derruba o script, sem erro.
  - **Posição.** A âncora fica no meio da linha de base (y 408), então os blocos com e sem ênfase ficam na mesma base. Bloco mais largo que 940 px encolhe. Cada palavra anima em volta do meio dela (agrupamento por palavra).
- **O 3D foi renderizado de novo** com a agenda nova: as trocas de tela seguem os tempos das falas, 2784 quadros a 120 fps, uns 12 min.
- **Resultado:** 1344 quadros, 44,8 s, 8,5 MB, −14,0 LUFS, pico −1,7 dBFS. O mix (`audio-v6.py`) perdeu o efeito da mensagem do WhatsApp: 139 eventos.

## Versão 6 (07/10/2026): as funcionalidades narradas, com assets
Pedido do Pedro: "faltou narração e mais detalhamento das atividades e funcionalidades do App; cada detalhamento, além de aparecer só o celular, deve conter assets, motions representativos da funcionalidade. Capriche!"

- **As falas novas** (checadas no FATOS e no PROIBIDO). Ficaram de fora: Fator R (P15), "a gente paga a guia" (P21), número sem fato (P36). "Plano ME" virou "pra quem é microempresa": na voz convertida o "ME" virava "M".
  1. "Um painel fácil de entender, com quanto entrou e o imposto do mês."
  2. "O imposto vem calculado, e a guia chega pronta."
  3. "Sua alíquota é acompanhada todo mês."
  4. "A gente avisa cada prazo, no app e no WhatsApp."
  5. "E, pra quem é microempresa, um contador de verdade cuida da folha e das declarações."
- **A voz** (`voz-v6/`, `voz-v6.py`). Seguiu o fluxo do kit: TTS no clone `Pedro-Legalizai`, depois voice_change pro Dylan (preset `b847bc29-...`) e o whisper pra achar as palavras.
  - As falas 2 e 4 vêm da primeira tomada, com as cinco seguidas. As 1, 3 e 5 foram regravadas uma a uma: na primeira tomada o "ME" perdia o "é" e a "alíquota" virava "alíquata".
  - Regravar tudo separado deixou as falas 2 e 4 hesitantes, por isso elas ficaram da primeira tomada.
  - O `voz-v6.py` corta cada fala na pausa e põe uma depois da outra com 0,86 s entre elas, sem acelerar. Casa a loudness com a voz da v2 e grava `assets/audio-v6/voz-final-v6.wav` e `assets/narracao-v6-funcoes.json`, com palavras e frases no tempo do vídeo. O vão fica em 20 s, 10 compassos.
- **As cenas** (`funcionalidades.mjs`, chamado pelo `gera.mjs` com `SEM_RT`).
  - **Composição.** Uma cena por fala. O celular 3D vai pra um lado, alternando, e os assets ficam do outro, num nulo por cena que desce e amplia o grupo. Cada ação cai na palavra da fala.
  - **A linha.** Sai do celular só depois que ele chega no lado e contorna o cartão principal.
  - **As legendas.** As cinco falas usam o mesmo construtor das outras (`legenda()`), palavra a palavra.
  - **O que some.** A luz, os brilhos e a linha que ficam presos ao centro do celular somem durante o trecho e voltam no fim, quando o celular retorna ao centro.
  - **Saídas.** O módulo grava os sons das ações (`assets/audio-v6/sfx-funcoes.json`) e a agenda do 3D (`remotion/src/sufoco/agenda-v6.json`).
- **O 3D** (`CelularSufoco.tsx`) lê a agenda. Em cada cena, a tela do app é trocada no pico de um giro e o aparelho assenta virado 14 graus pros assets. As telas são estas:
  - Início;
  - a guia do mês (`impostos_pagar`);
  - a alíquota, esmaecida logo abaixo do cartão da alíquota efetiva, pra não mostrar o Fator R;
  - Impostos, com uma notificação descendo no topo: "A guia do mês vence em breve.";
  - Tudo em dia.
  - Ficaram de fora a tela de Avisos (mostra Fator R e notas) e Suas guias (diz "pagou por você").
- **O mix** (`audio-v6.py`) junta a voz montada, os efeitos da v2 andando 20 s e os das cenas. A trilha corre 20 s a mais e sai em `assets/mix-v6.wav`.

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
- `capa.py <video> <capa.png> [tempo]`: a capa, com o título da capa da v2, no quadro de 3,0 s da v7 levado pro tempo novo. A da v8 é `saida/capa-v8.png`, ligada por hardlink na pasta final (`capa-do-reel.png`).
- `blocos.mjs`: o corte da legenda em blocos e os tempos de cada bloco (v7; v8 com no máximo 4 palavras e as expressões coladas).
- `roteiro-narracao-v7.md`: o texto da narração. Na v8 ela foi gerada numa tomada só; se o Pedro gravar a dele, a voz entra pelo mesmo caminho do `voz-v8/` (analisa, monta-voz, mapa).
- `voz-v8/`: a narração da v8. Tem o `roteiro.json`, o `analisa.py`, o `prepara.py`, o `ritmo.py` e o `monta-voz.py`, a tomada escolhida convertida (`dylan-t2.wav`) e as análises.
- `audio-v8.py`: o mix da v8, com os efeitos levados pelo mapa.
- `assets/warp-v8.json`: o mapa de tempo da v7 pra v8. `assets/narracao-v8.json`: as palavras e frases da voz nova.
- `saida/`: os vídeos entregues de cada versão (`SUFOCO-BUROCRATICO-motion-v8.mp4` é o atual, ligado na pasta final) e as capas (`capa-v8.png` é a atual).

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
