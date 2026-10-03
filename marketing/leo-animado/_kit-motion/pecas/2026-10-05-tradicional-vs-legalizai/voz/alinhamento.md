# Alinhamento da narração: 2026-10-05-tradicional-vs-legalizai

Gerado pelo `KIT/voz/alinha.py` em 02/10/2026 21:26 (7 s de relógio).

- Áudio transcrito: `voz/narr-dylan.wav` (24,427 s), o voz.arquivo da cena
- Cena: `nenhuma (padrões do kit)`
- Roteiro: `roteiro.md` (11 frases, 63 palavras)
- Whisper: faster-whisper 1.2.1, modelo small, cpu, int8, language pt, word_timestamps, beam_size 5, sem initial_prompt
- Refino do início: silêncio abaixo de -40 dB por 80 ms ou mais (39 pausas), como no `PR/src/timeline.py`; a primeira palavra fica como o whisper deu
- Fim da última palavra: da primeira passada (não sobra áudio demais depois dela)
- tFecho: 24,080 + 0,44 = 24,52 s; duração 27,52 s
- Saída: `voz/narracao.json`
- Palavras com marca: 20 de 63; sem par no whisper: 0

## Palavras

| i | palavra | whisper | prob. | início | fim | marca |
|---|---|---|---|---|---|---|
| 0 | Contabilidade | Contabilidade | 0,89 | 0,00 | 1,02 | primeira palavra: começo do whisper mantido (o refino levaria a 0,31; pausa 0,00 a 0,31) |
| 1 | tradicional | tradicional | 0,98 | 1,02 | 1,60 |  |
| 2 | vs | versus | 0,65 | 1,60 | 2,16 | o whisper ouviu 'versus' |
| 3 | Legalizaí. (chave) | legalizaí. | 0,80 | 2,16 | 3,20 |  |
| 4 | O | O | 0,98 | 3,66 | 3,72 | início refinado pelo silêncio (whisper 3,58; pausa 3,16 a 3,66) |
| 5 | que | que | 1,00 | 3,72 | 3,80 |  |
| 6 | muda (chave) | muda | 1,00 | 3,80 | 4,06 |  |
| 7 | pra | para | 0,89 | 4,06 | 4,20 | o whisper ouviu 'para' |
| 8 | você? | você? | 1,00 | 4,20 | 4,46 |  |
| 9 | Abrir | Abrir | 0,91 | 4,99 | 5,24 | início refinado pelo silêncio (whisper 4,92; pausa 4,49 a 4,99) |
| 10 | empresa | empresa | 1,00 | 5,30 | 5,54 |  |
| 11 | era | era | 0,96 | 5,54 | 5,88 |  |
| 12 | papel (chave) | papel | 0,97 | 5,88 | 6,32 |  |
| 13 | e | e | 0,97 | 6,32 | 6,68 |  |
| 14 | ida | ir | 0,57 | 6,68 | 6,80 | o whisper ouviu 'ir' |
| 15 | ao | ao | 0,99 | 6,80 | 6,92 |  |
| 16 | escritório. | escritório. | 0,91 | 6,92 | 7,44 |  |
| 17 | Agora, | Agora, | 0,98 | 7,88 | 8,12 | início refinado pelo silêncio (whisper 7,84; pausa 7,44 a 7,88) |
| 18 | tudo | tudo | 1,00 | 8,51 | 8,60 | início refinado pelo silêncio (whisper 8,42; pausa 8,25 a 8,51) |
| 19 | pelo | pelo | 1,00 | 8,60 | 8,84 |  |
| 20 | app. (chave) | app. | 0,86 | 8,84 | 9,10 |  |
| 21 | O | O | 0,98 | 9,43 | 9,48 | início refinado pelo silêncio (whisper 9,36; pausa 9,03 a 9,43); fim esticado pra início + 0,05 (era 9,46) |
| 22 | sistema (chave) | sistema | 0,99 | 9,46 | 9,68 |  |
| 23 | calcula, | calcula, | 0,97 | 9,68 | 10,34 |  |
| 24 | emite | emite | 0,77 | 10,64 | 10,88 |  |
| 25 | a | a | 0,96 | 10,88 | 10,98 |  |
| 26 | guia | guia | 0,99 | 10,98 | 11,26 |  |
| 27 | e | e | 0,96 | 11,44 | 11,49 | início refinado pelo silêncio (whisper 11,26; pausa 11,26 a 11,44); fim esticado pra início + 0,05 (era 11,48) |
| 28 | te | te | 0,98 | 11,48 | 11,60 |  |
| 29 | avisa. | avisa. | 0,98 | 11,60 | 11,94 |  |
| 30 | Você | Você | 0,99 | 12,06 | 12,22 |  |
| 31 | só (chave) | só | 1,00 | 12,22 | 12,44 |  |
| 32 | paga. | paga. | 1,00 | 12,54 | 12,78 | início refinado pelo silêncio (whisper 12,44; pausa 12,44 a 12,54) |
| 33 | Fugiu | Fugiu | 0,65 | 13,26 | 13,42 | início refinado pelo silêncio (whisper 13,08; pausa 12,77 a 13,26) |
| 34 | do | do | 0,97 | 13,42 | 13,52 |  |
| 35 | padrão? (chave) | padrão. | 1,00 | 13,52 | 13,84 |  |
| 36 | No | No | 0,96 | 14,40 | 14,46 | início refinado pelo silêncio (whisper 14,32; pausa 13,88 a 14,40) |
| 37 | plano | plano | 1,00 | 14,53 | 14,70 | início refinado pelo silêncio (whisper 14,46; pausa 14,45 a 14,53) |
| 38 | ME, | ME, | 0,76 | 14,70 | 15,12 |  |
| 39 | tem | tem | 0,64 | 15,62 | 15,68 | início refinado pelo silêncio (whisper 15,56; pausa 15,29 a 15,62) |
| 40 | gente (chave) | gente | 0,99 | 15,68 | 15,96 |  |
| 41 | de | de | 1,00 | 15,96 | 16,12 |  |
| 42 | verdade. | verdade. | 1,00 | 16,12 | 16,44 |  |
| 43 | Um | Um | 0,98 | 16,94 | 17,02 | início refinado pelo silêncio (whisper 16,90; pausa 16,59 a 16,94) |
| 44 | contador (chave) | contador | 0,99 | 17,02 | 17,44 |  |
| 45 | com | com | 1,00 | 17,44 | 17,64 |  |
| 46 | registro | registro | 0,99 | 17,64 | 18,20 |  |
| 47 | no | no | 0,95 | 18,52 | 18,62 | início refinado pelo silêncio (whisper 18,20; pausa 18,20 a 18,52) |
| 48 | CRC. | CRC. | 0,97 | 18,62 | 19,38 |  |
| 49 | O | O | 0,99 | 19,71 | 19,76 | início refinado pelo silêncio (whisper 19,66; pausa 19,39 a 19,71) |
| 50 | mesmo | mesmo | 1,00 | 19,76 | 19,94 |  |
| 51 | cuidado, (chave) | cuidado | 1,00 | 19,94 | 20,36 |  |
| 52 | agora | agora | 0,65 | 20,36 | 20,74 |  |
| 53 | no | no | 0,98 | 20,74 | 21,16 |  |
| 54 | app | app | 0,97 | 21,16 | 21,40 |  |
| 55 | que | que | 0,99 | 21,40 | 21,54 |  |
| 56 | tá | está | 0,88 | 21,54 | 21,62 | o whisper ouviu 'está' |
| 57 | chegando. | chegando. | 1,00 | 21,62 | 22,04 |  |
| 58 | E | E | 0,92 | 22,54 | 22,60 | início refinado pelo silêncio (whisper 22,50; pausa 22,04 a 22,54) |
| 59 | você, | você | 0,99 | 22,60 | 22,84 |  |
| 60 | prefere | prefere | 0,85 | 22,84 | 23,42 |  |
| 61 | resolver | resolver | 1,00 | 23,42 | 23,66 |  |
| 62 | como? (chave) | como? | 0,98 | 23,66 | 24,08 |  |

## Frases

| frase | palavras | chave | início | fim | out |
|---|---|---|---|---|---|
| 0 | 0 a 3 | 3 (Legalizaí.) | 0,00 | 3,20 | 3,64 |
| 1 | 4 a 8 | 6 (muda) | 3,66 | 4,46 | 4,97 |
| 2 | 9 a 16 | 12 (papel) | 4,99 | 7,44 | 7,86 |
| 3 | 17 a 20 | 20 (app.) | 7,88 | 9,10 | 9,41 |
| 4 | 21 a 29 | 22 (sistema) | 9,43 | 11,94 | 12,04 |
| 5 | 30 a 32 | 31 (só) | 12,06 | 12,78 | 13,24 |
| 6 | 33 a 35 | 35 (padrão?) | 13,26 | 13,84 | 14,38 |
| 7 | 36 a 42 | 40 (gente) | 14,40 | 16,44 | 16,92 |
| 8 | 43 a 48 | 44 (contador) | 16,94 | 19,38 | 19,69 |
| 9 | 49 a 57 | 51 (cuidado,) | 19,71 | 22,04 | 22,52 |
| 10 | 58 a 62 | 62 (como?) | 22,54 | 24,08 | 24,50 |

## Pausas do áudio (abaixo de -40 dB por 80 ms ou mais)

0,00 a 0,31, 1,11 a 1,23, 1,77 a 1,95, 2,37 a 2,54, 3,16 a 3,66, 4,49 a 4,99, 5,91 a 6,08, 6,17 a 6,27, 6,45 a 6,60, 7,01 a 7,09, 7,16 a 7,27, 7,44 a 7,88, 8,25 a 8,51, 9,03 a 9,43, 9,56 a 9,65, 10,00 a 10,12, 10,33 a 10,62, 11,26 a 11,44, 11,85 a 11,95, 11,96 a 12,06, 12,44 a 12,54, 12,77 a 13,26, 13,88 a 14,40, 14,45 a 14,53, 14,77 a 14,85, 15,29 a 15,62, 15,98 a 16,06, 16,59 a 16,94, 17,47 a 17,56, 18,03 a 18,14, 18,20 a 18,52, 19,39 a 19,71, 20,02 a 20,10, 20,97 a 21,14, 21,44 a 21,56, 22,04 a 22,54, 22,93 a 23,15, 23,81 a 23,90, 24,13 a 24,42

## Correções de tempo depois do alinha.py

Conferência de 02/10/2026, palavra por palavra, no espectrograma da `narr-dylan.wav` com as pausas acima.

- Em 14 palavras o whisper small pôs o começo cedo demais: a fronteira caiu antes da pausa (ou do fechamento da oclusiva) que separa a palavra da anterior. O refino do kit só move o começo que cai dentro da pausa (de 0,01 s antes dela), então não pegou. O erro ia de 0,10 a 0,40 s; no gancho, o "Legalizaí" (a batida cheia da trilha) estava 0,38 s cedo.
- A `narracao.json` tem os tempos corrigidos (começo no fim da pausa ou na soltura da oclusiva, como o refino faz, e o fim da palavra anterior no começo da pausa). A saída pura do alinha.py ficou em `narracao-alinha.json`.
- tFecho, duração, frases e chaves não mudam: as frases começam nas mesmas palavras, e só o fim da frase 0 foi de 3,20 pra 3,16.
- O large-v3-turbo (no cache, só pra conferir) dá os mesmos começos cedo nessas palavras; os dois whisper erram do mesmo jeito.

| i | palavra | alinha.py | corrigido | evidência |
|---|---|---|---|---|
| 0 | Contabilidade | 0,00 a 1,02 | 0,00 a 1,11 | fim no começo da pausa 1,11 a 1,23 |
| 1 | tradicional | 1,02 a 1,60 | 1,23 a 1,77 | começo no fim da pausa 1,11 a 1,23 (soltura do t); fim no começo da pausa 1,77 a 1,95 |
| 2 | vs | 1,60 a 2,16 | 1,95 a 2,37 | começo no fim da pausa 1,77 a 1,95; de 1,60 a 1,77 ainda é o "-cional"; fim no começo da pausa 2,37 a 2,54 |
| 3 | Legalizaí. | 2,16 a 3,20 | 2,54 a 3,16 | começo no fim da pausa 2,37 a 2,54; de 2,16 a 2,37 ainda é o "-sus" do versus; fim no começo da pausa 3,16 a 3,66 |
| 11 | era | 5,54 a 5,88 | 5,54 a 5,91 | fim no fechamento do p do "papel" (5,91) |
| 12 | papel | 5,88 a 6,32 | 6,08 a 6,45 | começo na soltura do p, no fim da pausa 5,91 a 6,08; fim no começo da pausa 6,45 a 6,60 |
| 13 | e | 6,32 a 6,68 | 6,60 a 6,68 | começo no fim da pausa 6,45 a 6,60; de 6,32 a 6,45 ainda é o "-pel" |
| 22 | sistema | 9,46 a 9,68 | 9,46 a 9,80 | fim no fechamento do k do "calcula" (9,80 a 9,86, abaixo de -49 dB) |
| 23 | calcula, | 9,68 a 10,34 | 9,86 a 10,34 | começo na soltura do k (9,86); de 9,68 a 9,80 ainda é o "-tema" |
| 37 | plano | 14,53 a 14,70 | 14,53 a 14,77 | fim no começo da pausa 14,77 a 14,85 |
| 38 | ME, | 14,70 a 15,12 | 14,85 a 15,29 | começo no fim da pausa 14,77 a 14,85; fim no começo da pausa 15,29 a 15,62 |
| 40 | gente | 15,68 a 15,96 | 15,68 a 15,98 | fim no fechamento do d do "de" (15,98) |
| 41 | de | 15,96 a 16,12 | 16,06 a 16,12 | começo na soltura do d, no fim da pausa 15,98 a 16,06 |
| 44 | contador | 17,02 a 17,44 | 17,02 a 17,47 | fim no fechamento do k do "com" (17,47) |
| 45 | com | 17,44 a 17,64 | 17,56 a 17,64 | começo na soltura do k, no fim da pausa 17,47 a 17,56 |
| 50 | mesmo | 19,76 a 19,94 | 19,76 a 20,02 | fim no fechamento do k do "cuidado" (20,02) |
| 51 | cuidado, | 19,94 a 20,36 | 20,10 a 20,37 | começo na soltura do k, no fim da pausa 20,02 a 20,10; a vogal forte do "-do" acaba em 20,37 |
| 52 | agora | 20,36 a 20,74 | 20,54 a 20,97 | a vogal do "a-" sobe em 20,54, depois do trecho fraco de 20,37 a 20,53; fim no começo da pausa 20,97 a 21,14 |
| 53 | no | 20,74 a 21,16 | 21,14 a 21,24 | começo no fim da pausa 20,97 a 21,14; de 20,74 a 20,97 ainda é o "-gora" |
| 54 | app | 21,16 a 21,40 | 21,24 a 21,40 | o "a" do app entra em 21,24 (o centroide sobe de 0,8 pra 1,3 kHz) |
| 59 | você, | 22,60 a 22,84 | 22,60 a 22,93 | fim no começo da pausa 22,93 a 23,15 (a vírgula) |
| 60 | prefere | 22,84 a 23,42 | 23,15 a 23,42 | começo na soltura do p, no fim da pausa 22,93 a 23,15 |

Palavras que o whisper ouviu diferente e ficam com o texto do roteiro (o tempo é dele): "vs" (a voz diz "versus"), "pra" ("para"), "ida" ("ir"; o d está lá, entre 6,77 e 6,80 s, e o turbo ouve "ida" no recorte), "tá" ("está"). "ME" e "CRC" saem como sigla nos dois whisper.
