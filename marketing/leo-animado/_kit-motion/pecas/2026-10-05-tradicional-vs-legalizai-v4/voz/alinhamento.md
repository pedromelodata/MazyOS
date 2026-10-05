# Alinhamento da narração: 2026-10-05-tradicional-vs-legalizai-v4

Gerado pelo `KIT/voz/alinha.py` em 05/10/2026 17:03 (8 s de relógio).

- Áudio transcrito: `voz/narr-dylan.wav` (28,723 s), o voz.arquivo da cena
- Cena: `cenas.json`
- Roteiro: `roteiro.md` (13 frases, 82 palavras)
- Whisper: faster-whisper 1.2.1, modelo small, cpu, int8, language pt, word_timestamps, beam_size 5, sem initial_prompt
- Refino do início: silêncio abaixo de -40 dB por 80 ms ou mais (47 pausas), como no `PR/src/timeline.py`; a primeira palavra fica como o whisper deu
- Fim da última palavra: da primeira passada (não sobra áudio demais depois dela)
- tFecho: 28,340 + 0,44 = 28,78 s; duração 31,78 s
- Saída: `voz/narracao.json`
- Palavras com marca: 24 de 82; sem par no whisper: 2

## Palavras

| i | palavra | whisper | prob. | início | fim | marca |
|---|---|---|---|---|---|---|
| 0 | Contabilidade | Contabilidade | 0,83 | 0,00 | 0,76 |  |
| 1 | tradicional | tradicional | 0,85 | 0,76 | 1,32 |  |
| 2 | vs | versus | 0,60 | 1,32 | 1,90 | o whisper ouviu 'versus' |
| 3 | Legalizaí. (chave) | legalizaí. | 0,76 | 1,90 | 2,88 |  |
| 4 | O | O | 0,97 | 3,41 | 3,46 | início refinado pelo silêncio (whisper 3,36; pausa 2,84 a 3,41) |
| 5 | que | que | 1,00 | 3,46 | 3,54 |  |
| 6 | muda (chave) | muda | 0,99 | 3,54 | 3,80 |  |
| 7 | pra | para | 0,62 | 3,80 | 3,94 | o whisper ouviu 'para' |
| 8 | você? | você? | 1,00 | 3,94 | 4,20 |  |
| 9 | Abrir | Abrir | 0,83 | 4,79 | 5,10 | início refinado pelo silêncio (whisper 4,76; pausa 4,22 a 4,79) |
| 10 | empresa | empresa | 0,66 | 5,20 | 5,54 | início refinado pelo silêncio (whisper 5,10; pausa 5,10 a 5,20) |
| 11 | era | era | 0,92 | 5,54 | 5,92 |  |
| 12 | papel, (chave) | papel | 0,90 | 5,92 | 6,38 |  |
| 13 | ida | ida | 0,68 | 6,38 | 6,94 |  |
| 14 | ao | ao | 0,99 | 6,94 | 7,18 |  |
| 15 | escritório | escritório | 0,96 | 7,18 | 7,74 |  |
| 16 | e | e | 0,94 | 7,74 | 8,18 |  |
| 17 | espera (chave) | espera | 0,97 | 8,18 | 8,52 |  |
| 18 | pra | para | 0,90 | 8,52 | 8,80 | o whisper ouviu 'para' |
| 19 | ser | ser | 0,99 | 8,80 | 8,94 |  |
| 20 | atendido. | atendido. | 0,99 | 8,94 | 9,32 |  |
| 21 | Agora | Agora | 0,98 | 9,81 | 9,94 | início refinado pelo silêncio (whisper 9,74; pausa 9,35 a 9,81) |
| 22 | é |  |  | 9,94 | 9,99 | sem par no whisper: tempo interpolado; fim esticado pra início + 0,05 (era 9,94) |
| 23 | tudo | tudo | 0,64 | 9,94 | 10,14 |  |
| 24 | pelo | pelo | 0,94 | 10,27 | 10,36 | início refinado pelo silêncio (whisper 10,14; pausa 10,15 a 10,27) |
| 25 | app, (chave) | app | 0,93 | 10,36 | 10,58 |  |
| 26 | com | com | 0,89 | 10,76 | 10,81 | início refinado pelo silêncio (whisper 10,58; pausa 10,56 a 10,76); fim esticado pra início + 0,05 (era 10,78) |
| 27 | a |  |  | 10,78 | 10,83 | sem par no whisper: tempo interpolado; fim esticado pra início + 0,05 (era 10,78) |
| 28 | atividade | atividade | 0,94 | 10,78 | 11,10 |  |
| 29 | certa | certa | 0,99 | 11,10 | 11,58 |  |
| 30 | e | e | 0,90 | 11,58 | 11,92 |  |
| 31 | cada | cada | 0,99 | 12,07 | 12,22 | início refinado pelo silêncio (whisper 11,92; pausa 11,89 a 12,07) |
| 32 | passo (chave) | passo | 1,00 | 12,22 | 12,58 |  |
| 33 | na | na | 0,99 | 12,58 | 12,76 |  |
| 34 | sua | sua | 0,99 | 12,87 | 12,92 | início refinado pelo silêncio (whisper 12,76; pausa 12,76 a 12,87); fim esticado pra início + 0,05 (era 12,90) |
| 35 | tela. | tela. | 1,00 | 12,90 | 13,20 |  |
| 36 | O | O | 0,96 | 14,01 | 14,06 | início refinado pelo silêncio (whisper 13,84; pausa 13,50 a 14,01); fim esticado pra início + 0,05 (era 14,02) |
| 37 | sistema (chave) | sistema | 0,99 | 14,02 | 14,28 |  |
| 38 | calcula, | calcula, | 0,97 | 14,28 | 14,90 |  |
| 39 | emite | emite | 0,94 | 15,24 | 15,42 |  |
| 40 | a | a | 0,95 | 15,42 | 15,54 |  |
| 41 | guia | guia | 0,99 | 15,62 | 15,78 | início refinado pelo silêncio (whisper 15,54; pausa 15,54 a 15,62) |
| 42 | e | e | 0,97 | 15,78 | 16,04 |  |
| 43 | te | te | 0,97 | 16,04 | 16,14 |  |
| 44 | avisa. | avisa, | 0,99 | 16,14 | 16,48 |  |
| 45 | Você | você | 0,99 | 16,60 | 16,76 |  |
| 46 | só (chave) | só | 1,00 | 16,76 | 16,98 |  |
| 47 | paga. | paga. | 1,00 | 17,08 | 17,30 | início refinado pelo silêncio (whisper 16,98; pausa 16,99 a 17,08) |
| 48 | Fugiu | Fugiu | 0,68 | 17,87 | 18,02 | início refinado pelo silêncio (whisper 17,72; pausa 17,30 a 17,87) |
| 49 | do | do | 0,95 | 18,02 | 18,14 |  |
| 50 | padrão? (chave) | padrão? | 1,00 | 18,14 | 18,44 |  |
| 51 | No | No | 0,98 | 19,23 | 19,28 | início refinado pelo silêncio (whisper 19,16; pausa 18,49 a 19,23) |
| 52 | plano | plano | 0,90 | 19,28 | 19,50 |  |
| 53 | do | do | 0,89 | 19,50 | 19,68 |  |
| 54 | Simples, (chave) | simples | 0,93 | 19,68 | 19,98 |  |
| 55 | tem | tem | 0,69 | 19,98 | 20,26 |  |
| 56 | um | um | 0,91 | 20,26 | 20,38 |  |
| 57 | contador (chave) | contador | 0,99 | 20,44 | 20,78 | início refinado pelo silêncio (whisper 20,38; pausa 20,36 a 20,44) |
| 58 | de | de | 0,99 | 20,78 | 21,14 |  |
| 59 | verdade, | verdade | 0,99 | 21,14 | 21,52 |  |
| 60 | com | com | 0,95 | 21,52 | 21,84 |  |
| 61 | registro | registro | 0,97 | 21,84 | 22,32 |  |
| 62 | no | no | 0,96 | 22,32 | 22,46 |  |
| 63 | CRC. | CRC. | 0,90 | 22,46 | 23,08 |  |
| 64 | O | O | 0,86 | 23,87 | 23,92 | início refinado pelo silêncio (whisper 23,78; pausa 23,09 a 23,87) |
| 65 | mesmo | mesmo | 1,00 | 23,92 | 24,12 |  |
| 66 | cuidado, (chave) | cuidado | 0,99 | 24,12 | 24,50 |  |
| 67 | agora | agora | 0,57 | 24,50 | 24,92 |  |
| 68 | no | no | 0,98 | 24,92 | 25,12 |  |
| 69 | app | app | 0,96 | 25,12 | 25,28 |  |
| 70 | que | que | 0,98 | 25,28 | 25,42 | começo do whisper mantido: o refino levaria a 25,45, depois do começo da palavra seguinte (25,42; pausa 25,25 a 25,45) |
| 71 | tá | está | 0,73 | 25,45 | 25,50 | o whisper ouviu 'está'; início refinado pelo silêncio (whisper 25,42; pausa 25,25 a 25,45) |
| 72 | chegando. | chegando. | 1,00 | 25,50 | 25,96 |  |
| 73 | Segue | Segue | 0,96 | 26,57 | 26,78 | início refinado pelo silêncio (whisper 26,42; pausa 25,99 a 26,57) |
| 74 | a | a | 0,96 | 26,78 | 26,90 |  |
| 75 | gente | gente | 1,00 | 26,90 | 27,14 |  |
| 76 | e | e | 0,76 | 27,54 | 27,60 | início refinado pelo silêncio (whisper 27,14; pausa 27,09 a 27,54) |
| 77 | clica | clica | 0,98 | 27,60 | 27,76 |  |
| 78 | no | no | 0,99 | 27,76 | 27,90 |  |
| 79 | link (chave) | link | 0,99 | 27,90 | 28,06 |  |
| 80 | da | da | 0,76 | 28,06 | 28,20 |  |
| 81 | bio. | bio. | 0,32 | 28,20 | 28,34 |  |

## Frases

| frase | palavras | chave | início | fim | out |
|---|---|---|---|---|---|
| 0 | 0 a 3 | 3 (Legalizaí.) | 0,00 | 2,88 | 3,39 |
| 1 | 4 a 8 | 6 (muda) | 3,41 | 4,20 | 4,77 |
| 2 | 9 a 15 | 12 (papel,) | 4,79 | 7,74 | 7,72 |
| 3 | 16 a 20 | 17 (espera) | 7,74 | 9,32 | 9,79 |
| 4 | 21 a 25 | 25 (app,) | 9,81 | 10,58 | 10,74 |
| 5 | 26 a 35 | 32 (passo) | 10,76 | 13,20 | 13,99 |
| 6 | 36 a 44 | 37 (sistema) | 14,01 | 16,48 | 16,58 |
| 7 | 45 a 47 | 46 (só) | 16,60 | 17,30 | 17,85 |
| 8 | 48 a 50 | 50 (padrão?) | 17,87 | 18,44 | 19,21 |
| 9 | 51 a 54 | 54 (Simples,) | 19,23 | 19,98 | 19,96 |
| 10 | 55 a 63 | 57 (contador) | 19,98 | 23,08 | 23,85 |
| 11 | 64 a 72 | 66 (cuidado,) | 23,87 | 25,96 | 26,55 |
| 12 | 73 a 81 | 79 (link) | 26,57 | 28,34 | 28,76 |

## Pausas do áudio (abaixo de -40 dB por 80 ms ou mais)

0,84 a 0,94, 1,50 a 1,67, 2,06 a 2,26, 2,84 a 3,41, 4,22 a 4,79, 5,10 a 5,20, 5,62 a 5,78, 5,98 a 6,12, 6,20 a 6,32, 6,48 a 6,79, 7,28 a 7,41, 7,78 a 8,12, 8,28 a 8,37, 8,58 a 8,71, 9,35 a 9,81, 10,15 a 10,27, 10,56 a 10,76, 10,84 a 10,94, 11,72 a 11,88, 11,89 a 12,07, 12,30 a 12,39, 12,76 a 12,87, 12,95 a 13,03, 13,19 a 13,47, 13,50 a 14,01, 14,14 a 14,23, 14,37 a 14,45, 14,58 a 14,70, 14,90 a 15,19, 15,54 a 15,62, 15,80 a 15,98, 16,38 a 16,60, 16,99 a 17,08, 17,30 a 17,87, 18,49 a 19,23, 20,11 a 20,20, 20,36 a 20,44, 20,80 a 21,08, 21,68 a 21,78, 22,22 a 22,34, 23,09 a 23,87, 24,19 a 24,27, 24,59 a 24,74, 25,25 a 25,45, 25,99 a 26,57, 27,09 a 27,54, 28,40 a 28,72
