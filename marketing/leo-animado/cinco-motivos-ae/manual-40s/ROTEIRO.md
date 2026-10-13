# Cinco motivos pra ter CNPJ, 40 s, edição manual no After Effects (13/10/2026)

Pedido do Pedro: "acesse meu computador usando o computador use e edite manualmente o vídeo todo, fazendo tudo de forma
manual, mexendo na timeline, adicionando efeitos, como um editor mesmo" e "Fazendo cortes, adicionando músicas e etc.
Faça o vídeo com duração de 40 segundos, seguindo esse modelo de motion" (pin "Motion inspiration - Frames", de
imran__visuals: corte seco a cada 1 a 2 s, fundo creme e fundo preto com luz se alternando, tipografia bold com uma
palavra em vermelho, objeto recortado, fita curva cruzando a tela, tela de app). Ele quer saber o desempenho e o custo.

Plano feito pra edição à mão; o Pedro trocou no meio pro MCP do AE com o Remotion (ver `LEIA-ME.md`). Os tempos e o desenho abaixo são os que valem. Material em `material/`. Projeto: `CINCO-40S-MANUAL.aep` nesta pasta.

## Estilo (a marca Legalizaí no lugar do vermelho da referência)

- Comp `CINCO-40S`: 1080 x 1920, 30 qps, 0:00:40:00, motion blur ligado na comp e em toda camada que se mexe.
- **papel:** sólido #FAF8F5, texto #15171C. **tinta:** sólido #15171C com a Rampa de gradiente radial (#2A2E38 no
  meio, #0E0F12 na borda), texto #FAF8F5. Destaque sempre coral #F2643C; no fundo tinta, o destaque leva Brilho.
- Fontes: **Sora ExtraBold** (texto e números) e **DM Serif Display Italic** (palavra de ênfase). Nenhuma outra.
- Texto centralizado (parágrafo ao centro), x = 540 quando a tabela não diz outro x. Margem: nada fora de x 96 a 984 e
  y 240 a 1560 (fundo e fita podem ir até a borda). Texto não encosta em texto nem em imagem.
- Entrada de cada camada (corte seco, sem saída): Escala 60% no começo da tomada, 106% 4 quadros depois e 100% mais 3
  quadros depois, com Desaceleração suave (F9). A camada de destaque entra 3 quadros depois da primeira, com giro de -4
  a 0. Depois da primeira tomada pronta, duplicar (Ctrl+D), levar pro tempo da próxima (tecla [) e trocar o texto, ou
  copiar e colar os quadros-chave: é o jeito rápido de editor.
- **FITA:** camada de forma feita com a Caneta, uma curva larga cruzando a tela de um canto ao outro, traço #DCD6CE de
  70 px, sem preenchimento, atrás do texto; Aparar caminhos com o Fim de 0 a 100% nos primeiros 10 quadros da tomada.
- **PILULA:** retângulo arredondado coral; texto branco (#FFFFFF) por cima.
- **FECHO** (papel): "Vai," Sora ExtraBold 106 px #15171C, alinhado à esquerda, começando em x 126, y 822;
  `20-logo-ai-tinta.png` a 44,7% com o centro em (659, 822); `21-logo-ai-coral.png` igual, por cima, com a opacidade de
  0 a 100% em 4 quadros a partir de 0:00:39:12 (o "aí" acende quando é dito); pílula LINK DA BIO pequena (330 x 70,
  coral, texto branco Sora ExtraBold 34 px) com o centro em (540, 995), entrando em 0:00:39:20.
- Tela do app (PNG de fundo branco) leva Sombra projetada (preto, 40%, distância 20, suavidade 60).

## Som

Narração: importar `01-narracao.wav`, pôr na comp no quadro 0 e fazer 11 cópias. Em cada cópia: ir ao tempo "entra" e Alt+[, ir ao "sai" e Alt+], ir ao "vai pra" e tecla [. No fim, apagar a camada original.

| # | trecho | entra (Alt+[) | sai (Alt+]) | vai pra (tecla [) |
|---|---|---|---|---|
| 1 | Ainda recebe pelo seu trabalho no CPF? | 0:00:00:00 | 0:00:02:11 | 0:00:00:03 |
| 2 | Cinco motivos pra ter CNPJ. | 0:00:02:29 | 0:00:05:00 | 0:00:02:15 |
| 3 | Um: no MEI, a guia é fixa. | 0:00:05:10 | 0:00:08:03 | 0:00:04:17 |
| 4 | Fature de 1 real até o teto de 81 mil por ano, exatamente 6.750 por mês. | 0:00:08:11 | 0:00:15:07 | 0:00:07:11 |
| 5 | Dois: numa microempresa que começa em 6%, | 0:00:15:20 | 0:00:19:04 | 0:00:14:08 |
| 6 | de 10 mil, uns 600 de imposto e uns 9.400 no bolso. | 0:00:19:12 | 0:00:23:29 | 0:00:17:23 |
| 7 | Três: na microempresa, seu salário de dono recolhe INSS pra sua aposentadoria. | 0:00:24:14 | 0:00:30:05 | 0:00:22:11 |
| 8 | Quatro: o app calcula. | 0:00:30:29 | 0:00:32:17 | 0:00:28:03 |
| 9 | Você emite a nota e paga. | 0:00:32:26 | 0:00:34:11 | 0:00:29:22 |
| 10 | Cinco: a abertura é com a gente, sem honorário. | 0:00:34:29 | 0:00:38:08 | 0:00:31:08 |
| 11 | clique no link da bio e entre na lista de espera do app que tá chegando. | 0:00:41:29 | 0:00:45:17 | 0:00:34:18 |

- Fecho: `02-fecho-vai-legalizai.wav` inteiro, com a entrada em 0:00:38:10; Níveis de áudio -1,3 dB.
- Trilha: `03-trilha-house-one.mp3` (liberada), começando 51,711 s dentro da faixa: coluna Início = -0:00:51:21. Níveis de áudio: -60 dB em 0, -33 dB em 0:00:00:15, -33 dB em 0:00:38:15, -60 dB em 0:00:40:00.
- A narração fica em 0 dB. O nível final (-14 LUFS) é na exportação.

## Tomadas (corte seco; as camadas da tomada começam no "de" e acabam no "até")

| # | de | até | fundo | camadas: texto, fonte, px, cor, (x, y) |
|---|---|---|---|---|
| 1 | 0:00:00:00 | 0:00:01:17 | papel | "Ainda recebe pelo" Sora ExtraBold 72 tinta (540, 860); "seu trabalho" Sora ExtraBold 150 tinta (540, 1010) |
| 2 | 0:00:01:17 | 0:00:02:15 | tinta | "no" Sora ExtraBold 80 papel (540, 820); "CPF?" Sora ExtraBold 260 coral (540, 1050) |
| 3 | 0:00:02:15 | 0:00:03:14 | papel | "5" Sora ExtraBold 520 coral (540, 920); "motivos" DM Serif Display Italic 170 tinta (540, 1240); FITA |
| 4 | 0:00:03:14 | 0:00:04:17 | tinta | "pra ter" Sora ExtraBold 90 papel (540, 820); "CNPJ." Sora ExtraBold 230 coral (540, 1040) |
| 5 | 0:00:04:17 | 0:00:06:04 | papel | "1" Sora ExtraBold 460 coral (540, 860); "no MEI," Sora ExtraBold 120 tinta (540, 1150) |
| 6 | 0:00:06:04 | 0:00:07:11 | tinta | "a guia é" Sora ExtraBold 100 papel (540, 850); "fixa." DM Serif Display Italic 230 coral (540, 1060) |
| 7 | 0:00:07:11 | 0:00:08:08 | papel | "Fature de" Sora ExtraBold 100 tinta (540, 820); "R$ 1" Sora ExtraBold 300 coral (540, 1080) |
| 8 | 0:00:08:08 | 0:00:10:19 | tinta | "até o teto de" Sora ExtraBold 90 papel (540, 760); "R$ 81 mil" Sora ExtraBold 200 coral (540, 960); "por ano" Sora ExtraBold 80 papel (540, 1110) |
| 9 | 0:00:10:19 | 0:00:11:09 | papel | "exatamente" DM Serif Display Italic 190 coral (540, 980) |
| 10 | 0:00:11:09 | 0:00:14:08 | papel | "R$ 6.750" Sora ExtraBold 230 tinta (540, 930); "por mês" DM Serif Display Italic 140 coral (540, 1110); FITA |
| 11 | 0:00:14:08 | 0:00:15:26 | tinta | "2" Sora ExtraBold 460 coral (540, 880); "numa microempresa" Sora ExtraBold 96 papel (540, 1130) |
| 12 | 0:00:15:26 | 0:00:17:23 | papel | "que começa em" Sora ExtraBold 96 tinta (540, 780); "6%" Sora ExtraBold 420 coral (540, 1100) |
| 13 | 0:00:17:23 | 0:00:19:23 | tinta | "de R$ 10 mil," Sora ExtraBold 96 papel (540, 760); "R$ 600" Sora ExtraBold 240 coral (540, 980); "de imposto" Sora ExtraBold 90 papel (540, 1130) |
| 14 | 0:00:19:23 | 0:00:22:11 | papel | "R$ 9.400" Sora ExtraBold 230 tinta (540, 930); "no bolso." DM Serif Display Italic 170 coral (540, 1120) |
| 15 | 0:00:22:11 | 0:00:24:07 | tinta | "3" Sora ExtraBold 460 coral (540, 880); "na microempresa," Sora ExtraBold 96 papel (540, 1130) |
| 16 | 0:00:24:07 | 0:00:25:06 | papel | IMG 12-tela-pro-labore.png escala 31%, giro -5, sombra (540, 730); "seu salário" Sora ExtraBold 110 tinta (540, 1270); "de dono" DM Serif Display Italic 150 coral (540, 1420) |
| 17 | 0:00:25:06 | 0:00:26:14 | tinta | "recolhe" Sora ExtraBold 100 papel (540, 840); "INSS" Sora ExtraBold 260 coral (540, 1080) |
| 18 | 0:00:26:14 | 0:00:28:03 | papel | "pra sua" Sora ExtraBold 100 tinta (540, 860); "aposentadoria." DM Serif Display Italic 125 coral (540, 1040); FITA |
| 19 | 0:00:28:03 | 0:00:29:22 | tinta | IMG 13-celular-imposto.png escala 72% (760, 900); "4" Sora ExtraBold 380 coral (280, 720); "o app" Sora ExtraBold 90 papel (280, 980); "calcula." DM Serif Display Italic 120 coral (300, 1140) |
| 20 | 0:00:29:22 | 0:00:31:08 | papel | IMG 11-tela-emitir-nota.png escala 32%, sombra (540, 700); "Você emite a nota" Sora ExtraBold 90 tinta (540, 1290); "e paga." DM Serif Display Italic 150 coral (540, 1430) |
| 21 | 0:00:31:08 | 0:00:32:24 | tinta | "5" Sora ExtraBold 460 coral (540, 880); "a abertura" Sora ExtraBold 110 papel (540, 1140) |
| 22 | 0:00:32:24 | 0:00:33:17 | papel | IMG 14-celular-empresa-nasceu.png escala 72% (760, 900); "é com a" Sora ExtraBold 90 tinta (280, 860); "gente," DM Serif Display Italic 150 coral (290, 1020) |
| 23 | 0:00:33:17 | 0:00:34:18 | tinta | "sem" Sora ExtraBold 110 papel (540, 840); "honorário." DM Serif Display Italic 180 coral (540, 1040) |
| 24 | 0:00:34:18 | 0:00:35:19 | papel | "clique no" Sora ExtraBold 100 tinta (540, 820); PILULA coral 620x150, cantos 75 (540, 1030); "LINK DA BIO" Sora ExtraBold 80 branco (540, 1058) |
| 25 | 0:00:35:19 | 0:00:38:07 | tinta | "entre na" Sora ExtraBold 90 papel (540, 760); "lista de espera" DM Serif Display Italic 150 coral (540, 940); "do app que tá chegando." Sora ExtraBold 64 papel (540, 1100) |
| 26 | 0:00:38:07 | 0:00:40:00 | papel | FECHO (ver Estilo) |

## Exportar

Composição > Adicionar à fila do Adobe Media Encoder; H.264, 1080 x 1920, 30 qps, taxa alta; Normalização de volume
(ITU BS.1770) em -14 LUFS com pico -1,5 dB se o AME oferecer; saída `saida/CINCO-40S-MANUAL.mp4` nesta pasta.
