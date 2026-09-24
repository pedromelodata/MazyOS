# Assets 3D clay — Departamento Pessoal (cadastro, folha, holerite)

Três assets 9:16 animados, 5s cada, gerados no Higgsfield em 17/09/2026.

| # | Asset | Frame-herói | Take |
| --- | --- | --- | --- |
| 1 | Pessoas sendo cadastradas na tabela | `frames/01-cadastro.png` | `takes/01-cadastro.mp4` |
| 2 | Cálculo de folha fechando | `frames/02-calculo.png` | `takes/02-calculo.mp4` |
| 3 | Holerites sendo enviados | `frames/03-holerite.png` | `takes/03-holerite.mp4` |

## Método

Frame-herói primeiro (`nano_banana_pro`, 9:16, 2k), aprovado, depois animado em
`kling3_0_turbo` 5s 1080p 9:16 com `start_image` = job_id da imagem. Nunca texto-to-video
direto: o frame-herói é o que garante material, paleta e ausência de texto.

## Regras aplicadas

- Estilo v2 híbrido do design guide: 3D clay, fundo papel quente `#FAF8F5`, objeto
  off-white, acento coral `#F2643C`, detalhe ink `#1B1E24`
- **Zero texto gerado por IA** (design guide, "o que nunca fazer" §7): toda linha de
  escrita é barrinha bege `#D9C9B6`. Nenhum número, nenhuma letra, nem nas teclas da
  calculadora. Tipografia, se entrar, nasce em PIL/HTML por cima
- Câmera travada e fundo vazio nos três, pra aceitar legenda e corte de 2 a 5s
- Prompt de vídeo pede AÇÃO, não estado (armadilha já medida: prompt sem verbo devolve
  foto parada)
- Preset "IN THE DARK" oferecido pelo sugestor nas três submissões, recusado com
  `declined_preset_id=24bae836-2c4a-48e0-89b6-49fcc0b21612`

## Especificação dos arquivos entregues

1076x1928, 24fps, 121 frames, 5,04s, sem áudio. O Kling entrega 1076x1928 e não
1080x1920 exatos; escalar no pós, não antes. Não converter cadência: deixar o `overlay`
do ffmpeg reamostrar pra 60fps na peça final.

## O que cada take faz

1. **Cadastro** — o avatar coral que flutua sobre a linha vazia desce, assenta na linha, e
   o `+` vira check coral. O painel flutua de leve o tempo todo. Termina com a tabela
   completa, boa pra segurar sob legenda
2. **Cálculo** — três ícones de pessoa clay em coluna à esquerda da calculadora (ink,
   coral, ink) fazem um ripple suave de cima pra baixo, as teclas afundam em sequência e a
   moeda inclinada tomba e assenta na pilha. Versão de 18/09, a pedido do Pedro: os ícones
   de pessoa entraram ao lado da calculadora e o card de documento saiu, pra não ficarem
   quatro elementos brigando no mesmo quadro
3. **Holerite** — folhas sobem e saem pelo topo enquanto novas repõem de dentro do
   envelope, que nunca esvazia. Último frame quase igual ao primeiro, então dá loop

## Defeito conhecido

O fundo do `02-calculo` refeito é levemente mais rosado (`#FAEDE5`) que o do `01` e do
`03` (`#F8F2E6` e `#F4EAE1`). Está dentro da variação que os três já tinham entre si, mas
se entrarem lado a lado no mesmo corte vale igualar o matiz no pós.

## Descartes

- `frames/descartes/02-calculo-v1-moeda-cravada.png` — a moeda flutuante nasceu embutida
  no teclado, o que travaria a queda dela na animação. Refeita usando o frame 3 como
  referência de material e fundo
- `takes/descartes/03-holerite-v1-envelope-esvazia.mp4` — as folhas saem e nada repõe, o
  envelope termina vazio. Serve se a leitura desejada for "esvaziou / acabou", não serve
  como fluxo contínuo nem como loop
- `takes/descartes/02-calculo-v1-sem-pessoas.mp4` e
  `frames/descartes/02-calculo-v2-sem-pessoas.png` — a primeira versão da calculadora, com
  card de documento no lugar dos ícones de pessoa. Tem o flash de contorno escuro em duas
  teclas por 3 frames aos 0,58s
- `frames/descartes/02-calculo-pessoas-A-barras-cortadas.png` — as barrinhas dos avatares
  sumiam atrás da calculadora e a moeda encostava no corpo dela
- `frames/descartes/02-calculo-pessoas-B-desbalanceada.png` — avatares amontoados no canto,
  muito vazio em cima, moeda cravada no teclado de novo

## Alternativa

`frames/02-calculo-alt-com-barras.png` — mesma cena com uma barrinha bege ao lado de cada
ícone de pessoa, reforçando a leitura de lista de funcionários. Ainda não animada; o
teclado dessa versão ficou mais estreito. Animar custa 10 créditos.

## Custo

8 imagens `nano_banana_pro` 2k + 5 vídeos `kling3_0_turbo` 5s 1080p 9:16 a 10 créditos
cada. Saldo: 1000,32 no início, 934,32 no fim.
