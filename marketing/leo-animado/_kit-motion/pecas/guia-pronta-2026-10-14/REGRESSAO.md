# Regressão do reel da guia pelo kit (K12)

Pacote K12 do kit de motion do Legalizaí (rodada 2 da construção). Contrato: `KIT/DESENHO.md` (revisão 2), seções 0, 4.5, 4.13, 6, 7, 11 e 13, com as decisões do orquestrador pra rodada 2:

- "verso" conferido contra o cruzamento medido na timeline original, 9,3182 ± 0,001 s (o power3 do GSAP é quártico);
- tolerância de tempo nos argumentos do `sint-s_processa` ([4,32; 5,5] contra [4,3; 5,5]);
- eventos da `cenas-kit.json` com |dt| até 0,08 s;
- `voz/narracao-kit.json` do guia regravada sem o refino (máximo 0,06 s contra a referência).

Medido em 02/10/2026, das 22:08 às 22:35, só com os comandos do kit (`PY -B KIT/scripts/kit.py`) e os scripts de teste dos pacotes. As comparações são do `provas/mede.py` deste pacote: ele só lê e compara, e grava pelo `KIT/lib/escrita.py`. O V4 foi lido do caminho dele, sem cópia.

Siglas como no DESENHO: `KIT`, `RM`, `GP`, `V4`, `MUDO4`, `REF`, `PY` e `PYW`. `P` = `KIT/pecas/guia-pronta-2026-10-14`.

> **Nota de 03/10/2026 (rodada 4 do kit).** Desde a rodada 4, `fatos.publico` é obrigatório e vazio é conferido como MEI (F063 por padrão). As três cenas da peça passaram a declarar `"publico": "ME"`, pelo que a cena já dizia do valor de exemplo (empresa de exemplo do app, "não é guia de MEI"); a decisão fica pra confirmar com o Pedro (`voz/roteiro.md`, seção Público). Com isso, o `kit.py fatos` do guia (`cenas.json` e `cenas-kit.json`) sai com 0 erro e 6 avisos: some o de público vazio e entram os 2 do "entrar no site do governo" negado na mesma oração (a regra nova do portal, que rebaixa a negação pra aviso), além dos 2 de "site do governo" e dos 2 do R$ 178,31 de exemplo. As props das três cenas foram refeitas pelo `kit.py props` (só o público e os avisos mudam), e o mix continua igual bit a bit (540 quadros dão 864.000 amostras, nas duas contas). O resto deste registro é o de 02/10.

## Veredito

| parte | resultado |
|---|---|
| Pré-condição | passou: REF sem diferença, doutor sem vermelho, 612 MB livres |
| Rodada 1 (identidade, `cenas.json`) | passou em todas as camadas. O fluxo de vídeo não repetiu o md5 do V4 (`054b3c2d...` contra `6ddbb29b...`) e passou pelo critério alternativo da seção 11: PSNR médio 54,58 dB, mínimo por quadro 47,62 dB e SSIM médio 0,999428. O próprio GuiaPronta não é determinístico entre abas (medido de novo aqui); não é defeito do kit |
| Rodada 2 (`cenas-kit.json`, o caminho de peça nova) | passou em todos os limites próprios, inclusive em toda a conferência da seção 7.7 no `kit.py final` |
| Periódico em 22 s | a camada ambiente fecha (3,4e-17) e a emenda do loop é do tamanho de um passo normal. O `kit.py qc` acusou 1 quadro de invasão da legenda (quadro 331, na transição, 2,16 px além da margem): fora do limite "zero erro", explicado na seção de falhas (K07) |
| Fim | REF sem diferença (22:33 e 22:38); Temp sem pasta deste pacote; disco final de 543 MB (22:38). Os finais foram apagados às 22:34, com 430 MB livres; o md5 deles está registrado |

## Pré-condição

| item | medido | limite | passou |
|---|---|---|---|
| REF (`catalogo.py referencia guia-pronta-2026-10-14`) | "nada mudou", 11 arquivos iguais (22:08 e de novo às 22:33) | sem diferença | sim |
| `kit.py doutor` | 14 itens, 0 vermelho, 1 aviso (2 pastas `remotion-v4.0.531-assets*` de outra sessão no Temp, de 19:41) | 0 vermelho | sim |
| disco | 612 MB livres | 400 MB ou mais | sim |

## Rodada 1: identidade (`cenas.json`)

| camada | medido | limite | passou | pacote |
|---|---|---|---|---|
| 2. Estado (`node RM/src/kit/testes/equivalencia.mjs`) | 540 quadros e 52 campos (28.080 comparações) em ordem, embaralhado e embaralhado com timelines novas: 0 desvio, maior diferença 0. Verso: 9,318186 s, igual ao cruzamento medido na timeline original (9,318186 s); de frente nos quadros 278 a 282 | 1e-9; verso 9,3182 ± 0,001 s | sim | K02 |
| 3. Eventos (`kit.py props` e `kit.py eventos`) | 35 eventos, 0 diferença contra a tabela da seção 6 (lida do próprio DESENHO) e 0 contra `KIT/audio/_regressao/eventos-guia-v2.json`: ordem, t em 6 casas, som, args, ganho, filtro e inverte (transpor 0 = ausente). Props com 0 erro e os 6 avisos esperados | iguais | sim | K02, K05 |
| 4. Fatos (`kit.py fatos`) | 0 erro e 4 avisos: público vazio, "site do governo" no roteiro e na narração e R$ 178,31 declarado como exemplo. "dia 20" achado no FATOS (F060, F062, F068, F073, F077, F092 e F103) | 0 erro | sim | K07 |
| 5. Mix (`kit.py mix`) | `audio/mix.wav` com md5 `80dd068e3dde76d25812766e54cf7d18`, o do `GP/audio/mix-guia.wav`: 864.000 amostras por canal, 0 amostra diferente, máximo 0 LSB | 1 LSB | sim | K05 |
| 6. Telas | as 4 de `P/telas/` iguais pixel a pixel e em md5 às de `GP/assets/telas/` e às de `_referencia/`. O `KIT/telas/testa_guia.py` do K04 refez as 4 em memória: "tudo certo". `regioes.json` igual às constantes da seção 4.8 | iguais | sim | K04 |
| 7. Stills (`kit.py stills`, GuiaPronta e KitMotion no mesmo bundle, public-kit, os 54 quadros, lotes de 10 com os PNG apagados) | 1ª passada, uma aba de cada: 50 de 54 idênticos; 525 e 539 com máximo 2 (média 0,000001); 24 com máximo 24 e 345 com máximo 15 (médias 0,000012 e 0,000023). Reamostragem desses 4, com 3 abas de cada composição (3 execuções do `kit.py stills`): os 4 idênticos a uma aba do GuiaPronta (melhor par, máximo 0). Final: 54 de 54 idênticos | máximo 2 e média 0,05 por quadro; meta 0 | sim (meta atingida pelo melhor par) | K06 |
| 7. Linha de base, GuiaPronta contra o V4 (quadro decodificado com `in_color_matrix=bt709:in_range=tv`) | médias de 0,7940 (quadro 330) a 1,8858 (quadro 241); máximo por quadro de 24 a 102 | média abaixo de 2 em todos | sim | |
| 8. Vídeo (`kit.py render`, 2ª tentativa, 48 s) | fluxo `054b3c2da52cdc97cc21d22022ee06a6`, diferente de `6ddbb29b1b005e7b209b040924ed1f17`. Contra o V4: PSNR médio 54,58 dB (y 53,13), mínimo por quadro 47,62 dB (quadro 239), 17 quadros idênticos; SSIM médio 0,999428, mínimo 0,996825. 540 quadros, 30 fps, 1080x1920, yuv420p, bt709 faixa tv, h264 High | md5 igual, ou PSNR médio 45 dB ou mais, mínimo 40 dB ou mais e SSIM 0,995 ou mais | sim (critério alternativo, explicado abaixo) | K06 (o original) |
| 9. Junção (`kit.py juncao`) | volume=1,30 dB em 2 voltas (o mesmo do V4): -14,0 LUFS, pico real -2,7 dBTP, LRA 1,2 LU; fluxo de vídeo igual ao do mudo | -14,0 ± 0,1 LUFS; pico de -1,5 dBTP ou menos | sim | K07 |
| 9. Áudio contra o V4 (mono 48 kHz, em memória) | atraso 0, correlação 1,000000, nível 0,000 dB. O fluxo AAC do final tem o mesmo md5 do fluxo de áudio do V4 (`0d57488c2267b6d27ce79c8c1e562f82`) | atraso 0, correlação 0,999 ou mais, nível até 0,15 dB | sim | K05, K07 |
| 9. Conferência (`kit.py confere`) | formato ok; som ok; cor com 6 stills, pior média 1,6364 (quadro 0); fala 50 de 50 (48 iguais e 2 trocas no lugar: aparece/parece e o/um), mediana do desvio 0,000 s, fecho reconhecido ("vai legalizar i"); legenda com 0 invasão (27 quadros em alerta abaixo de 8 px, como na calibração); loop com estado t = 0 contra t = 18 igual a 0 (imagem do quadro 0 contra o 539: média 2,169, só registro); texto com 0 travessão, 0 selo e 0 erro de fatos; créditos com o texto aprovado; folha | os da seção 7.7 | sim | K07 |

Os números estão em `provas/r1-*.json`, `provas/r1-stills/kitmotion-x-guiapronta.json`, `provas/r1-stills/reamostragem.json`, `qc/psnr.log`, `qc/ssim.log`, `saida/juncao.json` e `saida/relatorio.md`.

## Rodada 2: o guia pelo caminho do kit (`cenas-kit.json`)

| passo | medido | limite | passou | pacote |
|---|---|---|---|---|
| Narração (decisão do orquestrador) | `kit.py voz-alinha guia-pronta-2026-10-14 --saida voz/narracao-kit.json --forca --sem-refino` (whisper small sem prompt sobre o `narr-dylan.wav`): 50 palavras, 7 frases, mesmas chaves e textos, tFecho 15,00 s. Contra a `narracao.json` do REF: máximo do desvio de início 0,06 s (palavra 15, "O"), mediana 0, fim no máximo 0,02 s. A versão com refino do K03 dava 0,25 s | máximo 0,06 s | sim | K03 |
| 1. Telas (`kit.py telas --so-liga`) | as 4 PNG ligadas em `RM/public-kit/pecas/guia-pronta-2026-10-14/telas/`, st_nlink 2, mesmo inode e o md5 do REF | st_nlink 2 ou mais; pixels iguais aos de `_referencia/` | sim | K04, K07 |
| 2. Props, eventos e fatos (`--cena cenas-kit.json`) | 0 erro nos três (6 avisos nas props, 4 nos fatos). 35 eventos com a ordem, o som, os args, o ganho e o inverte da tabela e da fixture; maior \|dt\| 0,020 s, em 4 eventos: chime 4,24 para 4,26; processa 4,30 para 4,32 (args [4,32; 5,5]); 1109 10,29 para 10,31; 2867 10,42 para 10,44. tFecho 15,00 | \|dt\| até 0,08 s; tFecho 15,00 ± 0,05 | sim | K02, K03 |
| 3. Voz (`kit.py voz-monta --cena cenas-kit.json`) | `audio/voz-final-kit.wav` (md5 `f6aefa1257d98ddddd075728f240e3ff`, 18,000 s, ganho do fecho 0,00 dB). Correlação 0,999989 com o `GP/vo/narr-dylan.wav` de 0 a 18 s (atraso 0, nível 0,000 dB); o fecho achado em 15,000000 s pela correlação com o asset (desvio 0,000 ms, correlação normalizada 1,000000) | correlação 0,98 ou mais; fecho em tFecho ± 1 ms | sim | K03 |
| 4. Mix (`kit.py mix --cena cenas-kit.json`) | `audio/mix-kit.wav` (md5 `540bf9e2854934e2cae28dce3bbb5707`) contra o `mix-guia.wav`: atraso 0, correlação 0,999592, nível 0,005 dB. Não é idêntico (698.800 amostras diferentes), por causa do fecho como asset e dos 4 eventos 0,02 s depois | correlação 0,98 ou mais; nível até 0,5 dB | sim | K05 |
| 5. Stills, props-kit contra props (KitMotion, 2 execuções do `kit.py stills`) | quadro 0: média 0,000002 (3 px, a variante do aparelho); 135: 0; 245: média 0,094 (3.391 px, o destaque de "dia" na legenda, que começa 0,04 s antes). Registro: 309 com média 1,211 (o toque do botão, preso à palavra 37, 0,02 s depois); 478 e 539 iguais | média até 1,0 em 0, 135 e 245; os outros só registro | sim | K02, K06 |
| 6. Final (`kit.py final --cena cenas-kit.json`) | props, eventos, fatos, qc, mix, 6 stills, render (52 s, disco mínimo 409 MB), junção com volume=1,30 dB (-14,0 LUFS, pico real -2,7 dBTP) e conferência 7.7 inteira ok: formato, som, cor (pior média 1,6362), fala 50 de 50 (49 iguais e 1 troca: aparece/parece), legenda com 0 invasão, loop 0, texto, créditos e folha | toda a seção 7.7 | sim | K07 |
| 6. Contra o V4 (só registro) | fluxo `d6e9a41d0eb7e2fa06094472577c4760`. PSNR médio 41,68 dB, mínimo 22,28 dB (quadro 308); SSIM 0,998270 (mínimo 0,952809). Os 30 quadros abaixo de 40 dB estão nas trocas de frase da legenda (110 a 112, 118 e 119, 197 a 199, 205 e 206, 398 a 400 e 405 a 409), no destaque de "dia" (239) e no toque do botão (307 a 321): a narração realinhada mexe até 0,06 s nas palavras. Áudio: atraso 0, correlação 0,998523, nível 0,005 dB | registrar | | |
| 7. Capa (`kit.py capa --cena cenas-kit.json --titulo "O app fazendo a guia do mês"`, 1 still de verdade) | `saida/capa-kit.png` (1080x1920) e `saida/capa-kit-grade.jpg` (540x675), still do quadro 58 (auto). Título em 92 px e 2 linhas ("O app fazendo a" e "guia do mês"), faixa [60, 285, 1020, 561] dentro da área 4:5; 0 erro e 0 aviso. A faixa cobre a borda de cima do aparelho nesse quadro (proposta: o Pedro aprova) | sem erro; título dentro da 4:5 | sim | K07 |

Os números estão em `provas/r2-*.json`, `qc/psnr-kit.log`, `qc/ssim-kit.log`, `saida/juncao-kit.json`, `saida/relatorio-kit.md` e `saida/capa-kit.json`.

## Teste do modo periódico (`cenas-periodico-22s.json`, sem render)

| item | medido | limite | passou | pacote |
|---|---|---|---|---|
| `kit.py props --cena cenas-periodico-22s.json` | 0 erro (6 avisos); 22 s, 660 quadros, periódico true, sons v2 no modo por-evento | zero erro | sim | K02 |
| `kit.py qc`, quadros | `qc/quadros-periodico-22s.json` com 660 quadros e a entrada `tFim` (t = 22) | 660 e tFim | sim | K07 |
| `kit.py qc`, legenda | 1 quadro com invasão: 331 (11,03 s, frase 5 entrando, opacidade 0,21), folga de -28,16 px contra a margem de transição de -26 px; frase cheia com -4,86 px (margem -6). O `kit.py qc` saiu com código 1 | zero erro | não | K07 |
| Camada ambiente em t = 22 contra t = 0 | 3,43e-17 | 1e-9 | sim | K02 |
| Emenda: quadro 659 contra o 0 | câmera 2,67e-5 (o P95 dos passos entre vizinhos é 1,35e-2, e o passo do 658 pro 659 é 2,67e-5); aparelho 1,03e-4 (P95 5,84e-2, passo do 658 pro 659 1,02e-4). Relógio (0,60) e guia (0,70) ficam invisíveis nas duas pontas e não contam, como no confere | até o P95 | sim | K02 |
| Estado da timeline em t = 0 contra t = 22 (sem a camada ambiente) | 0 | 1e-5 | sim | K02 |

Os números estão em `provas/periodico-22s.json` e `qc/legenda-periodico-22s.json`.

## Falhas, desvios e o pacote de cada um

1. **Md5 do fluxo de vídeo da rodada 1** (`054b3c2d...` contra `6ddbb29b...`). Pacote: nenhum defeito do kit; é o não determinismo do original, já registrado pelo K06.
   - O GuiaPronta não é determinístico entre abas: o GLTFLoader cria os materiais do celular na ordem em que as texturas decodificam, e as teclas laterais têm faces coplanares (K06).
   - Medido de novo aqui: nos quadros 24, 525 e 539, três abas do GuiaPronta deram variantes diferentes entre si (máximo 24, 2 e 2). O KitMotion produziu as mesmas variantes: o melhor par ficou idêntico nos 4 quadros reamostrados.
   - O render usa 3 abas (`--concurrency=3`), e cada aba fixa uma ordem de materiais. O primeiro quadro diferente do V4 é o 5: máximo 52 nos pixels decodificados, só na região do aparelho, em blocos de macrobloco (o x264 decide diferente num quadro com poucos pixels mudados). O quadro 6 volta a ser idêntico. Depois a codificação diverge pouco (PSNR mínimo 47,6 dB) e 17 quadros saem idênticos.
   - Conclusão: nem o original repete o md5 do fluxo a cada render. O vídeo passou pelo critério alternativo previsto na seção 11. Pra uma regressão futura: PSNR e SSIM, mais stills com mais de uma aba.
2. **1ª tentativa do render da rodada 1** (22:19:55 a 22:20:43): falhou no quadro 449, com 404 em `public/marca/logo-ai-tinta.svg` e `logo-horizontal.svg`, a primeira vez que o fecho pede essas imagens.
   - Motivo: outra sessão rodou `kit.py stills` na peça `2026-10-05-tradicional-vs-legalizai`, das 22:19:56 às 22:20:21.
   - A limpeza do Temp no fim dela apagou o bundle do meu render, criado no mesmo segundo. Quem limpa é o `limpaTemp` do `stills.mjs` e o `limpa.py` chamado pelo `kit_stills.py`: os dois apagam as pastas `remotion-*` e do Chrome criadas durante a execução, pela janela de tempo.
   - A 2ª tentativa (22:22:17 a 22:23:05) saiu certa, sem colisão (sentinela no Temp).
   - A outra sessão rodou o kit de novo às 22:24, das 22:28 às 22:29 e das 22:31 às 22:33. Antes de cada still e render meus, esperei não haver render dela em andamento.
   - Pacotes: K06 (`stills.mjs`) e K07 (`limpa.py` e `kit_stills.py`), porque a limpeza por janela de tempo não sabe quem criou a pasta e derruba o render de outro processo. Também o orquestrador: duas sessões rodando o kit ao mesmo tempo, contra a regra de uma execução de render por vez.
3. **Periódico, `kit.py qc` com código 1** (1 invasão). Pacote: K07 (calibração da margem da transição).
   - No modo periódico a deriva da câmera muda de frequência (em x, de 0,35 pra 2π/22 = 0,2856 rad/s).
   - No quadro 331 a câmera fica 1,82 mm à direita da do guia, os cantos do aparelho andam até 5,35 px e a folga cai de -24,66 px (o guia) pra -28,16 px.
   - A margem de transição (-26 px) foi calibrada no guia com só 1,34 px de sobra, e a frase está entrando (opacidade 0,21, ainda borrada).
   - Não é defeito do modo periódico: a emenda passa.
   - Decisão pendente: tratar a transição como alerta, ou a peça nova em modo periódico ajustar a coreografia (é o que o qc pede hoje).
4. **Narração da rodada 2 regravada na pasta `voz/` do K03.** O `voz/narracao-kit.json` (md5 de `cfcf2f52...` pra `061927b1...`) e o `voz/alinhamento-kit.md` foram regravados pela decisão do orquestrador, com o comando que o K03 deixou pronto. É escrita fora dos caminhos do K12, autorizada pela decisão. As versões com refino estão em `provas/antes-da-rodada2/`.
5. **Stills da rodada 1 com reamostragem.** Os 4 quadros que diferiram numa aba foram refeitos com 3 abas de cada composição (3 execuções do `kit.py stills`, PNG movidos pra `provas/stills/amostras/` e apagados depois) e comparados pelo `compara.py lote` do K06, que fica com o melhor par. É o método que o K06 deixou pra este pacote.
6. **`qc/psnr.log` e `qc/ssim.log`.** O ffmpeg manda o stats pro stdout (`stats_file=-`) e o `escrita.py` grava, com troca atômica. O conteúdo é o do comando da seção 11, sem o ffmpeg gravar no lugar.
7. **Rodada 1 em comandos separados.** Os passos 8 e 9 rodaram como a seção 11 lista: `render`, `qc`, 6 stills pra conferência de cor, `juncao` e `confere`. A rodada 2 usou o `kit.py final`.
8. **Finais apagados.** Às 22:34 o disco tinha 430 MB livres (abaixo de 450), então os dois finais foram apagados com o md5 registrado (tabela abaixo). As folhas foram feitas antes. Pra refazer: `kit.py render` e `kit.py juncao` (rodada 1); `kit.py final --cena cenas-kit.json` (rodada 2).

## Folhas

- `provas/folha-contato.jpg` (112 KB): um quadro por segundo do V4, do final da rodada 1 e do final da rodada 2.
- `provas/folha-diferencas.jpg` (262 KB). Em cima, os 54 stills da rodada 1, cada um com o still do KitMotion, a diferença KitMotion x GuiaPronta (x40) e a diferença GuiaPronta x V4 (x12); os 4 reamostrados aparecem em coral. Embaixo, a rodada 2 (props-kit contra props) e os dois finais contra o V4 nos quadros de pior PSNR.
- `saida/folha.jpg` e `saida/folha-kit.jpg`: as folhas da conferência, com um quadro a cada 0,5 s.

## Arquivos

| arquivo | estado | md5 |
|---|---|---|
| `props.json`, `props-kit.json`, `props-periodico-22s.json` | ficam | |
| `eventos.json`, `eventos-kit.json` | ficam | |
| `qc/` (fatos, quadros, legenda, psnr e ssim, das três cenas) | ficam | |
| `audio/voz-final-kit.wav` (1.728.044 B) | fica | `f6aefa1257d98ddddd075728f240e3ff` |
| `audio/mix.json`, `audio/mix-kit.json` | ficam | |
| `audio/mix.wav` (3.456.078 B) | apagado | `80dd068e3dde76d25812766e54cf7d18` |
| `audio/mix-kit.wav` (3.456.078 B) | apagado | `540bf9e2854934e2cae28dce3bbb5707` |
| `saida/guia-pronta-2026-10-14-mudo.mp4` (8.782.016 B; fluxo `054b3c2d...`) | apagado | `ecd41e6a1df4c356acf17c4923c34f8c` |
| `saida/guia-pronta-2026-10-14-kit-mudo.mp4` (8.757.823 B; fluxo `d6e9a41d...`) | apagado | `e9520e0acd60d99f07168ecf13d35c0a` |
| `saida/guia-pronta-2026-10-14.mp4` (9.227.554 B, final da rodada 1) | apagado (disco) | `a67eb1febc82a953b73b7949e35ea09b` |
| `saida/guia-pronta-2026-10-14-kit.mp4` (9.203.671 B, final da rodada 2) | apagado (disco) | `748bc310500328cd0b550983dc31acbd` |
| `saida/capa-kit.png` (1.003.727 B), `saida/capa-kit-grade.jpg`, `saida/capa-kit.json` | ficam | `3810dfca3fdf94bbb0328cccb6ea2c71` (png) |
| `saida/relatorio*.md` e `.json`, `juncao*.json`, `creditos*.txt`, `folha*.jpg` | ficam | |
| PNG de stills (108 da rodada 1 em lotes, 24 da reamostragem, 6 da conferência da rodada 1, 12 do passo 5 e 6 do final da rodada 2, 1 da capa) | apagados | md5 dos que não foram apagados por lote em `provas/r1-apagados.json`, `provas/r2-apagados-stills.json` e `provas/r2-apagados.json` |
| `RM/public-kit/pecas/guia-pronta-2026-10-14/telas/` (4 hardlinks das telas do K04) | ficam | os do REF |

## Disco e Temp

- Disco: 613 MB no começo (22:08). Mínimos: 406 MB (still da capa), 409 MB (render da rodada 2) e 519 MB (render da rodada 1). Final: 580 MB no doutor das 22:35 e 543 MB na última conferência, às 22:38, depois de apagar os mudos, os mix, os PNG e os finais. O disco oscilou por causa da outra sessão (de 430 a 580 MB em 1 minuto).
- Temp: nenhuma pasta deste pacote. Ficaram só as 2 `remotion-v4.0.531-assets*` de outra sessão (19:41). `kit.py limpa --desde <início do K12>`: 0 pasta.
- REF: "nada mudou" no fim. Doutor no fim: 14 itens, 0 vermelho (o mesmo aviso do Temp).
- Nenhum `__pycache__` novo (o `PR/src/__pycache__` continua de 30/09), nenhum `.tmp-` e 0 travessão nos arquivos deste pacote.

## Como refazer (comandos usados, nesta ordem)

```
PY -B KIT/catalogos/catalogo.py referencia guia-pronta-2026-10-14
PY -B KIT/scripts/kit.py doutor
node RM/src/kit/testes/equivalencia.mjs
PY -B KIT/scripts/kit.py props guia-pronta-2026-10-14
PY -B KIT/scripts/kit.py eventos guia-pronta-2026-10-14
PY -B KIT/scripts/kit.py fatos guia-pronta-2026-10-14
PY -B KIT/scripts/kit.py mix guia-pronta-2026-10-14
PY -B KIT/telas/testa_guia.py
PY -B KIT/scripts/kit.py stills guia-pronta-2026-10-14 --composicoes GuiaPronta,KitMotion --quadros <54 quadros> --lote 10 --apaga --depois "'PY' -B 'P/provas/mede.py' lote"
PY -B KIT/scripts/kit.py render guia-pronta-2026-10-14
PY -B KIT/scripts/kit.py qc guia-pronta-2026-10-14
PY -B KIT/scripts/kit.py stills guia-pronta-2026-10-14 --quadros 0,108,216,324,432,539
PY -B KIT/scripts/kit.py juncao guia-pronta-2026-10-14
PY -B KIT/scripts/kit.py confere guia-pronta-2026-10-14
PY -B KIT/scripts/kit.py voz-alinha guia-pronta-2026-10-14 --saida voz/narracao-kit.json --forca --sem-refino
PY -B KIT/scripts/kit.py telas guia-pronta-2026-10-14 --so-liga
PY -B KIT/scripts/kit.py props|eventos|fatos guia-pronta-2026-10-14 --cena cenas-kit.json
PY -B KIT/scripts/kit.py voz-monta guia-pronta-2026-10-14 --cena cenas-kit.json
PY -B KIT/scripts/kit.py mix guia-pronta-2026-10-14 --cena cenas-kit.json
PY -B KIT/scripts/kit.py stills guia-pronta-2026-10-14 [--cena cenas-kit.json] --quadros 0,135,245,309,478,539
PY -B KIT/scripts/kit.py final guia-pronta-2026-10-14 --cena cenas-kit.json
PY -B KIT/scripts/kit.py capa guia-pronta-2026-10-14 --cena cenas-kit.json --titulo "O app fazendo a guia do mês"
PY -B KIT/scripts/kit.py props guia-pronta-2026-10-14 --cena cenas-periodico-22s.json
PY -B KIT/scripts/kit.py qc guia-pronta-2026-10-14 --cena cenas-periodico-22s.json
PY -B KIT/scripts/kit.py limpa --desde <início>
```

As medidas: `PY -B P/provas/mede.py eventos|wav-bits|audio|voz|telas|video|pares|periodico|dif-video|folha-contato|folha-diferencas` (ajuda com `--help`).
