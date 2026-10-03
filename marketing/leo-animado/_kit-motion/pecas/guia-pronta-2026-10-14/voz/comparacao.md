# Comparação do alinhamento contra a referência: guia-pronta-2026-10-14

Gerado pelo `KIT/voz/compara.py` em 02/10/2026 15:04. Referência: `voz/narracao.json` (md5 de548fb7302f40fe57156dae9581d467, 50 palavras, 7 frases).

## Rodadas

| rodada | narração | áudio transcrito |
|---|---|---|
| Dylan (kit) | `voz/narracao-kit.json` | `voz/narr-dylan.wav` |
| Pedro | `C:/Users/EDIT-A~1/AppData/Local/Temp/claude/c--MKT-INSTA/9f25c963-3802-4688-87c4-1ffb83432d65/scratchpad/k03/comparacao/narracao-pedro.json` | `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14/vo/narr-pedro-raw.wav` |
| Dylan sem refino | `C:/Users/EDIT-A~1/AppData/Local/Temp/claude/c--MKT-INSTA/9f25c963-3802-4688-87c4-1ffb83432d65/scratchpad/k03/comparacao/narracao-dylan-sem-refino.json` | `voz/narr-dylan.wav` |
| Pedro sem refino | `C:/Users/EDIT-A~1/AppData/Local/Temp/claude/c--MKT-INSTA/9f25c963-3802-4688-87c4-1ffb83432d65/scratchpad/k03/comparacao/narracao-pedro-sem-refino.json` | `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14/vo/narr-pedro-raw.wav` |

## Resumo contra a referência (desvios em segundos)

| rodada | mesmas palavras, frases, índices e chaves | início: mediana | início: máximo | acima de 0,04 | acima de 0,15 | fim: mediana | fim: máximo | tFecho |
|---|---|---|---|---|---|---|---|---|
| Dylan (kit) | sim | 0,000 | 0,250 | 6 | 2 | 0,000 | 0,060 | 15,00 |
| Pedro | sim | 0,000 | 0,200 | 2 | 1 | 0,000 | 0,040 | 14,98 |
| Dylan sem refino | sim | 0,000 | 0,060 | 5 | 0 | 0,000 | 0,020 | 15,00 |
| Pedro sem refino | sim | 0,000 | 0,020 | 0 | 0 | 0,000 | 0,040 | 14,98 |

## Verificação da rodada entregue: Dylan (kit)

| critério | medido | passou |
|---|---|---|
| 50 palavras e 7 frases, com os mesmos índices e palavras-chave da referência | 50 palavras, 7 frases | sim |
| mediana do desvio de início até 0,04 s | 0,000 s | sim |
| máximo do desvio de início até 0,15 s | 0,250 s (palavras 15 'O', 20 'e') | NÃO |
| tFecho = 15,00 ± 0,05 s | 15,00 s | sim |

## Palavras acima de 0,15 s em alguma rodada, com o início acústico

Início acústico: primeira subida acima de -50 dB depois do ponto mais baixo do trecho que vai do menor ao maior início (referência e rodadas), no envelope RMS de 10 ms a cada 1 ms de cada áudio.

| i | palavra | referência | Dylan (kit) | Pedro | Dylan sem refino | Pedro sem refino | acústico em `voz/narr-dylan.wav` | acústico em `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14/vo/narr-pedro-raw.wav` |
|---|---|---|---|---|---|---|---|---|
| 15 | O | 3,980 | 4,230 | 4,180 | 3,920 | 3,980 | 4,168 | 4,161 |
| 20 | e | 5,480 | 5,730 | 5,480 | 5,480 | 5,480 | 5,726 | 5,726 |

## Leitura

- **Estrutura:** as quatro rodadas dão as mesmas 50 palavras e as 7 frases com os mesmos índices e as chaves 6, 9, 16, 26, 36, 42 e 49. O texto de cada palavra vem do roteiro (`voz/roteiro.md`) e é igual ao da legenda aprovada.
- **Mediana:** 0,000 s nas quatro rodadas (mais da metade das palavras cai no mesmo tempo da referência).
- **Máximo:** a rodada entregue (Dylan com refino, o padrão do kit) passa de 0,15 s em duas palavras, o "O" (15) e o "e" (20), as duas com 0,25 s. Nas duas é a referência que está adiantada. Ela é o whisper bruto de 01/10 sobre a narração do Pedro, sem refino pelo silêncio, e o whisper pôs o começo dessas palavras dentro da pausa anterior. O início acústico medido nos dois áudios (tabela acima) é 4,16 a 4,17 s pro "O" (a referência diz 3,98) e 5,73 s pro "e" (a referência diz 5,48). Com o refino que o contrato pede (DESENHO seção 8, a regra do `PR/src/timeline.py`), o kit põe 4,23 e 5,73, a menos de 0,07 s do início acústico. Sem o refino (`--sem-refino`), o máximo cai pra 0,06 s (Dylan) e 0,02 s (Pedro), mas o "O" e o "e" voltam a acender antes da fala (0,19 e 0,25 s antes). O limite de 0,15 s e o refino não cabem juntos nessas duas palavras: o pacote manteve o refino, que é o comportamento padrão do kit, e registrou o desvio no relatório do K03.
- **Efeito na regressão (K12, rodada 2):** nenhuma batida do guia está presa ao "O" nem ao "e". As presas a palavra usam as palavras 9, 16, 17, 26, 37 e 42, com desvio de 0 a 0,02 s, e o tFecho dá 15,00. No quadro 0 a legenda é a mesma (o "Veja" fica em 0,0, porque a primeira palavra não é refinada). No quadro 135 (4,5 s) também: a frase 2 já entrou nas duas versões e o "O" e o "sistema" já acenderam. No quadro 245 (8,17 s) só o "dia" acende um pouco antes (8,12 contra 8,16), diferença do whisper no Dylan e não do refino. O que muda de verdade é a troca da frase 1 pra frase 2, 0,25 s mais tarde: a frase 1 some de 3,95 a 4,09 s (no V4, de 3,70 a 3,84 s) e a frase 2 entra em 4,13 s (no V4, em 3,88 s), logo antes do "O" falado.
- **Primeira palavra:** o refino levaria o "Veja" pra 0,34 s, porque o áudio começa com 0,34 s de silêncio. O kit mantém o começo do whisper (0,0): a legenda da primeira frase entra no quadro 0 (gancho e emenda do loop), como no guia aprovado.
- **"que" (44):** o "que" e o "estamos" caem na mesma pausa, o fechamento do "k" (12,19 a 12,31 s). Pela regra do timeline.py os dois iriam pra 12,31 e acenderiam juntos. O kit só leva pro fim da pausa a palavra de depois ("estamos", 12,31) e mantém o "que" em 12,18, como a referência.
- **tFecho:** com o fecho embutido logo depois, o whisper corta o "breve" em 14,16 s (o tFecho daria 14,60). O alinha.py transcreve de novo só até 15,01 s, o começo do fecho embutido, e ali o whisper dá 14,56, como na referência: tFecho 15,00. Na narração do Pedro, que não tem fecho e acaba em 14,68 s, o fim sai 14,54 já na primeira passada e o tFecho fica 14,98.

## Qual áudio alinha melhor

A narração original do Pedro (`GP/vo/narr-pedro-raw.wav`) bate melhor com a referência: máximo de 0,20 s com refino (só o "O") e 0,02 s sem refino, contra 0,25 e 0,06 s do Dylan. É o esperado, porque a referência foi transcrita dela em 01/10, às 15:56, antes da troca de voz (18:14). A diferença é pequena: o voice_change mantém o tempo (o `recebe.py` mede -0,2 ms entre a voz convertida e a narração que foi pro voice_change).

O kit continua transcrevendo o `voz.arquivo` da cena, o Dylan, como o contrato manda. É o áudio que vai pro vídeo, dá o tFecho exato do guia (15,00 contra 14,98) e não depende de um arquivo que fica fora do vídeo. A rodada entregue, `voz/narracao-kit.json`, é a do Dylan com refino.

## Comandos (02/10/2026)

```
PYW -B KIT/voz/alinha.py KIT/pecas/guia-pronta-2026-10-14 --saida voz/narracao-kit.json
PYW -B KIT/voz/alinha.py KIT/pecas/guia-pronta-2026-10-14 --wav GP/vo/narr-pedro-raw.wav --saida <scratchpad>/narracao-pedro.json
PYW -B KIT/voz/alinha.py KIT/pecas/guia-pronta-2026-10-14 --sem-refino --saida <scratchpad>/narracao-dylan-sem-refino.json
PYW -B KIT/voz/alinha.py KIT/pecas/guia-pronta-2026-10-14 --wav GP/vo/narr-pedro-raw.wav --sem-refino --saida <scratchpad>/narracao-pedro-sem-refino.json
PY -B KIT/voz/compara.py --pasta KIT/pecas/guia-pronta-2026-10-14 --ref voz/narracao.json --rodada ... --entregue "Dylan (kit)" --tfecho 15.0 --notas <notas.md> --saida voz/comparacao.md
```

As três rodadas de comparação ficaram só no scratchpad da sessão; os números delas estão neste relatório.

## Palavra por palavra (início, em segundos; Δ = rodada menos referência)

| i | palavra | referência | Dylan (kit) | Δ | Pedro | Δ | Dylan sem refino | Δ | Pedro sem refino | Δ |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | Veja | 0,00 | 0,00 | 0 | 0,00 | 0 | 0,00 | 0 | 0,00 | 0 |
| 1 | como | 0,54 | 0,54 | 0 | 0,54 | 0 | 0,54 | 0 | 0,54 | 0 |
| 2 | vai | 0,68 | 0,70 | +0,02 | 0,68 | 0 | 0,70 | +0,02 | 0,68 | 0 |
| 3 | ser | 0,86 | 0,86 | 0 | 0,86 | 0 | 0,86 | 0 | 0,86 | 0 |
| 4 | ter | 1,04 | 1,04 | 0 | 1,04 | 0 | 1,04 | 0 | 1,04 | 0 |
| 5 | a | 1,26 | 1,28 | +0,02 | 1,28 | +0,02 | 1,28 | +0,02 | 1,28 | +0,02 |
| 6 | guia | 1,40 | 1,42 | +0,02 | 1,42 | +0,02 | 1,42 | +0,02 | 1,42 | +0,02 |
| 7 | do | 1,56 | 1,56 | 0 | 1,56 | 0 | 1,56 | 0 | 1,56 | 0 |
| 8 | mês | 1,64 | 1,66 | +0,02 | 1,64 | 0 | 1,66 | +0,02 | 1,64 | 0 |
| 9 | sem | 1,86 | 1,86 | 0 | 1,86 | 0 | 1,86 | 0 | 1,86 | 0 |
| 10 | entrar | 2,22 | 2,24 | +0,02 | 2,22 | 0 | 2,24 | +0,02 | 2,22 | 0 |
| 11 | no | 2,48 | 2,48 | 0 | 2,48 | 0 | 2,48 | 0 | 2,48 | 0 |
| 12 | site | 2,62 | 2,62 | 0 | 2,62 | 0 | 2,62 | 0 | 2,62 | 0 |
| 13 | do | 2,86 | 2,84 | -0,02 | 2,86 | 0 | 2,84 | -0,02 | 2,86 | 0 |
| 14 | governo. | 3,04 | 3,04 | 0 | 3,04 | 0 | 3,04 | 0 | 3,04 | 0 |
| 15 | O | 3,98 | 4,23 | +0,25 | 4,18 | +0,20 | 3,92 | -0,06 | 3,98 | 0 |
| 16 | sistema | 4,22 | 4,24 | +0,02 | 4,22 | 0 | 4,24 | +0,02 | 4,22 | 0 |
| 17 | calcula | 4,50 | 4,50 | 0 | 4,50 | 0 | 4,50 | 0 | 4,50 | 0 |
| 18 | o | 5,04 | 5,02 | -0,02 | 5,04 | 0 | 5,02 | -0,02 | 5,04 | 0 |
| 19 | imposto | 5,12 | 5,10 | -0,02 | 5,12 | 0 | 5,10 | -0,02 | 5,12 | 0 |
| 20 | e | 5,48 | 5,73 | +0,25 | 5,48 | 0 | 5,48 | 0 | 5,48 | 0 |
| 21 | emite | 5,82 | 5,82 | 0 | 5,82 | 0 | 5,82 | 0 | 5,82 | 0 |
| 22 | a | 6,10 | 6,10 | 0 | 6,12 | +0,02 | 6,10 | 0 | 6,12 | +0,02 |
| 23 | guia. | 6,22 | 6,22 | 0 | 6,22 | 0 | 6,22 | 0 | 6,22 | 0 |
| 24 | Ela | 6,88 | 6,93 | +0,05 | 6,91 | +0,03 | 6,84 | -0,04 | 6,88 | 0 |
| 25 | aparece | 7,02 | 7,02 | 0 | 7,02 | 0 | 7,02 | 0 | 7,02 | 0 |
| 26 | pronta, | 7,28 | 7,28 | 0 | 7,28 | 0 | 7,28 | 0 | 7,28 | 0 |
| 27 | com | 8,00 | 8,02 | +0,02 | 8,00 | 0 | 7,96 | -0,04 | 8,00 | 0 |
| 28 | o | 8,10 | 8,10 | 0 | 8,10 | 0 | 8,10 | 0 | 8,10 | 0 |
| 29 | dia | 8,16 | 8,12 | -0,04 | 8,16 | 0 | 8,12 | -0,04 | 8,16 | 0 |
| 30 | que | 8,24 | 8,24 | 0 | 8,24 | 0 | 8,24 | 0 | 8,24 | 0 |
| 31 | vence. | 8,38 | 8,38 | 0 | 8,38 | 0 | 8,38 | 0 | 8,38 | 0 |
| 32 | A | 9,28 | 9,32 | +0,04 | 9,32 | +0,04 | 9,28 | 0 | 9,28 | 0 |
| 33 | sua | 9,40 | 9,38 | -0,02 | 9,40 | 0 | 9,38 | -0,02 | 9,40 | 0 |
| 34 | parte | 9,52 | 9,52 | 0 | 9,52 | 0 | 9,52 | 0 | 9,52 | 0 |
| 35 | é | 9,92 | 9,92 | 0 | 9,92 | 0 | 9,92 | 0 | 9,92 | 0 |
| 36 | só | 10,12 | 10,12 | 0 | 10,12 | 0 | 10,12 | 0 | 10,12 | 0 |
| 37 | pagar. | 10,30 | 10,32 | +0,02 | 10,30 | 0 | 10,32 | +0,02 | 10,30 | 0 |
| 38 | Isso | 11,12 | 11,14 | +0,02 | 11,10 | -0,02 | 11,12 | 0 | 11,10 | -0,02 |
| 39 | é | 11,26 | 11,28 | +0,02 | 11,26 | 0 | 11,28 | +0,02 | 11,26 | 0 |
| 40 | uma | 11,38 | 11,38 | 0 | 11,38 | 0 | 11,38 | 0 | 11,38 | 0 |
| 41 | prévia | 11,46 | 11,46 | 0 | 11,46 | 0 | 11,46 | 0 | 11,46 | 0 |
| 42 | real | 11,82 | 11,82 | 0 | 11,82 | 0 | 11,82 | 0 | 11,82 | 0 |
| 43 | do | 12,08 | 12,08 | 0 | 12,08 | 0 | 12,08 | 0 | 12,08 | 0 |
| 44 | que | 12,18 | 12,18 | 0 | 12,18 | 0 | 12,18 | 0 | 12,18 | 0 |
| 45 | estamos | 12,28 | 12,31 | +0,03 | 12,28 | 0 | 12,28 | 0 | 12,28 | 0 |
| 46 | construindo. | 12,50 | 12,50 | 0 | 12,50 | 0 | 12,50 | 0 | 12,50 | 0 |
| 47 | Chegando | 13,56 | 13,62 | +0,06 | 13,56 | 0 | 13,52 | -0,04 | 13,56 | 0 |
| 48 | em | 13,88 | 13,86 | -0,02 | 13,88 | 0 | 13,86 | -0,02 | 13,88 | 0 |
| 49 | breve. | 14,00 | 14,00 | 0 | 14,00 | 0 | 14,00 | 0 | 14,00 | 0 |

## Frases (início, fim e out)

| frase | chave | referência | Dylan (kit) | Pedro | Dylan sem refino | Pedro sem refino |
|---|---|---|---|---|---|---|
| 0 | 6 (guia) | 0,00 a 1,86, out 1,84 | 0,00 a 1,86, out 1,84 | 0,00 a 1,86, out 1,84 | 0,00 a 1,86, out 1,84 | 0,00 a 1,86, out 1,84 |
| 1 | 9 (sem) | 1,86 a 3,40, out 3,96 | 1,86 a 3,40, out 4,21 | 1,86 a 3,36, out 4,16 | 1,86 a 3,40, out 3,90 | 1,86 a 3,36, out 3,96 |
| 2 | 16 (sistema) | 3,98 a 6,50, out 6,86 | 4,23 a 6,50, out 6,91 | 4,18 a 6,50, out 6,89 | 3,92 a 6,50, out 6,82 | 3,98 a 6,50, out 6,86 |
| 3 | 26 (pronta,) | 6,88 a 8,72, out 9,26 | 6,93 a 8,72, out 9,30 | 6,91 a 8,72, out 9,30 | 6,84 a 8,72, out 9,26 | 6,88 a 8,72, out 9,26 |
| 4 | 36 (só) | 9,28 a 10,54, out 11,10 | 9,32 a 10,54, out 11,12 | 9,32 a 10,52, out 11,08 | 9,28 a 10,54, out 11,10 | 9,28 a 10,52, out 11,08 |
| 5 | 42 (real) | 11,12 a 13,12, out 13,54 | 11,14 a 13,10, out 13,60 | 11,10 a 13,12, out 13,54 | 11,12 a 13,10, out 13,50 | 11,10 a 13,12, out 13,54 |
| 6 | 49 (breve.) | 13,56 a 14,56, out 14,98 | 13,62 a 14,56, out 14,98 | 13,56 a 14,54, out 14,96 | 13,52 a 14,56, out 14,98 | 13,56 a 14,54, out 14,96 |
