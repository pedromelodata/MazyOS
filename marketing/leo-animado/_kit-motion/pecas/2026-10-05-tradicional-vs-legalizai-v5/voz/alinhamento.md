# Alinhamento da narração: 2026-10-05-tradicional-vs-legalizai-v5

Gerado pelo `KIT/voz/alinha.py` em 05/10/2026 17:48 (11 s de relógio).

- Áudio transcrito: `voz/narr-dylan.wav` (30,557 s), o voz.arquivo da cena
- Cena: `cenas.json`
- Roteiro: `roteiro.md` (13 frases, 83 palavras)
- Whisper: faster-whisper 1.2.1, modelo small, cpu, int8, language pt, word_timestamps, beam_size 5, sem initial_prompt
- Refino do início: silêncio abaixo de -40 dB por 80 ms ou mais (44 pausas), como no `PR/src/timeline.py`; a primeira palavra fica como o whisper deu
- Fim da última palavra: da primeira passada (não sobra áudio demais depois dela)
- tFecho: 30,160 + 0,44 = 30,60 s; duração 33,60 s
- Saída: `voz/narracao.json`
- Palavras com marca: 18 de 83; sem par no whisper: 1

## Palavras

| i | palavra | whisper | prob. | início | fim | marca |
|---|---|---|---|---|---|---|
| 0 | Contabilidade | Contabilidade | 0,84 | 0,00 | 0,76 |  |
| 1 | tradicional | tradicional | 0,72 | 0,76 | 1,32 |  |
| 2 | vs | versus | 0,49 | 1,32 | 1,90 | o whisper ouviu 'versus' |
| 3 | Legalizaí. (chave) | legalizaí. | 0,69 | 1,90 | 2,90 |  |
| 4 | O | O | 0,92 | 3,41 | 3,46 | início refinado pelo silêncio (whisper 3,38; pausa 2,88 a 3,41) |
| 5 | que | que | 0,99 | 3,46 | 3,56 |  |
| 6 | muda (chave) | muda | 0,99 | 3,56 | 3,80 |  |
| 7 | pra | pra | 0,61 | 3,80 | 3,94 |  |
| 8 | você? | você? | 0,98 | 3,94 | 4,20 |  |
| 9 | Abrir | Abrir | 0,76 | 4,79 | 5,12 | início refinado pelo silêncio (whisper 4,76; pausa 4,26 a 4,79) |
| 10 | empresa | empresa | 0,78 | 5,12 | 5,54 |  |
| 11 | era | era | 0,90 | 5,54 | 5,92 |  |
| 12 | papel, (chave) | papel, | 0,95 | 5,92 | 6,38 |  |
| 13 | ida | ida | 0,93 | 6,86 | 6,96 |  |
| 14 | ao | ao | 0,99 | 6,96 | 7,18 |  |
| 15 | escritório | escritório | 0,96 | 7,18 | 7,74 |  |
| 16 | e | e | 0,80 | 7,74 | 8,18 |  |
| 17 | espera (chave) | espera | 0,96 | 8,18 | 8,54 |  |
| 18 | pra | pra | 0,66 | 8,54 | 8,80 |  |
| 19 | ser | ser | 0,96 | 8,80 | 8,94 |  |
| 20 | atendido. | atendido. | 0,99 | 8,94 | 9,32 |  |
| 21 | Agora | Agora | 0,96 | 9,81 | 9,94 | início refinado pelo silêncio (whisper 9,76; pausa 9,35 a 9,81) |
| 22 | é | é | 0,53 | 9,94 | 10,08 |  |
| 23 | tudo | tudo | 1,00 | 10,08 | 10,16 |  |
| 24 | pelo | pelo | 0,98 | 10,16 | 10,36 |  |
| 25 | app, (chave) | app | 0,84 | 10,36 | 10,60 |  |
| 26 | com | com | 0,66 | 10,72 | 10,78 | início refinado pelo silêncio (whisper 10,60; pausa 10,56 a 10,72) |
| 27 | a |  |  | 10,78 | 10,83 | sem par no whisper: tempo interpolado; fim esticado pra início + 0,05 (era 10,78) |
| 28 | atividade | atividade | 0,93 | 10,78 | 11,12 |  |
| 29 | certa | certa | 0,98 | 11,12 | 11,58 |  |
| 30 | e | e | 0,86 | 11,58 | 11,94 |  |
| 31 | cada | cada | 0,99 | 12,07 | 12,22 | início refinado pelo silêncio (whisper 11,94; pausa 11,90 a 12,07) |
| 32 | passo (chave) | passo | 1,00 | 12,22 | 12,60 |  |
| 33 | na | na | 0,99 | 12,60 | 12,76 |  |
| 34 | sua | sua | 0,98 | 12,76 | 12,92 |  |
| 35 | tela. | tela. | 1,00 | 12,92 | 13,20 |  |
| 36 | O | O | 0,92 | 14,00 | 14,05 | início refinado pelo silêncio (whisper 13,86; pausa 13,50 a 14,00); fim esticado pra início + 0,05 (era 14,02) |
| 37 | sistema (chave) | sistema | 0,98 | 14,02 | 14,28 |  |
| 38 | calcula, | calcula, | 0,96 | 14,28 | 14,92 |  |
| 39 | emite | emite | 0,93 | 15,26 | 15,42 |  |
| 40 | a | a | 0,96 | 15,42 | 15,56 |  |
| 41 | guia | guia | 0,98 | 15,56 | 15,80 |  |
| 42 | e | e | 0,96 | 15,80 | 16,04 |  |
| 43 | te | te | 0,98 | 16,04 | 16,14 |  |
| 44 | avisa. | avisa, | 0,98 | 16,14 | 16,48 |  |
| 45 | Você | você | 0,98 | 16,58 | 16,76 |  |
| 46 | só (chave) | só | 1,00 | 16,76 | 16,98 |  |
| 47 | paga. | paga. | 1,00 | 17,08 | 17,30 | início refinado pelo silêncio (whisper 16,98; pausa 16,98 a 17,08) |
| 48 | Fugiu | Fugiu | 0,63 | 17,87 | 18,02 | início refinado pelo silêncio (whisper 17,72; pausa 17,31 a 17,87) |
| 49 | do | do | 0,97 | 18,02 | 18,14 |  |
| 50 | padrão? (chave) | padrão? | 0,99 | 18,14 | 18,44 |  |
| 51 | No | No | 0,96 | 19,02 | 19,16 |  |
| 52 | plano | plano | 0,83 | 19,25 | 19,42 | início refinado pelo silêncio (whisper 19,16; pausa 19,16 a 19,25) |
| 53 | do | do | 0,82 | 19,42 | 19,64 |  |
| 54 | Simples, (chave) | simples, | 0,91 | 19,64 | 20,10 |  |
| 55 | tem | tem | 0,98 | 20,47 | 20,56 | início refinado pelo silêncio (whisper 20,28; pausa 20,29 a 20,47) |
| 56 | um | um | 0,98 | 20,56 | 20,76 |  |
| 57 | contador (chave) | contador | 0,99 | 20,76 | 21,16 |  |
| 58 | de | de | 0,99 | 21,16 | 21,32 |  |
| 59 | verdade, | verdade | 0,99 | 21,32 | 21,70 |  |
| 60 | com | com | 0,96 | 21,70 | 22,16 |  |
| 61 | registro | registro | 0,96 | 22,16 | 22,76 |  |
| 62 | no | no | 0,96 | 22,76 | 23,08 |  |
| 63 | CRC. | CRC. | 0,86 | 23,08 | 24,50 |  |
| 64 | O | O | 0,87 | 25,21 | 25,28 | início refinado pelo silêncio (whisper 24,96; pausa 24,52 a 25,21) |
| 65 | mesmo | mesmo | 1,00 | 25,28 | 25,48 |  |
| 66 | cuidado, (chave) | cuidado. | 0,99 | 25,48 | 25,78 |  |
| 67 | mas | Mas | 0,97 | 26,22 | 26,30 | início refinado pelo silêncio (whisper 26,18; pausa 25,85 a 26,22) |
| 68 | agora | agora, | 0,98 | 26,30 | 26,56 |  |
| 69 | no | no | 0,99 | 26,92 | 27,00 | início refinado pelo silêncio (whisper 26,84; pausa 26,63 a 26,92) |
| 70 | app | app | 0,99 | 27,00 | 27,18 |  |
| 71 | que | que | 0,99 | 27,18 | 27,30 |  |
| 72 | tá | tá | 0,80 | 27,37 | 27,42 | início refinado pelo silêncio (whisper 27,30; pausa 27,22 a 27,37) |
| 73 | chegando. | chegando, | 1,00 | 27,42 | 27,76 |  |
| 74 | Segue | segue | 0,94 | 28,41 | 28,58 | início refinado pelo silêncio (whisper 28,08; pausa 27,85 a 28,41) |
| 75 | a | a | 0,97 | 28,58 | 28,72 |  |
| 76 | gente | gente. | 1,00 | 28,72 | 28,96 |  |
| 77 | e | E | 0,26 | 29,38 | 29,43 | início refinado pelo silêncio (whisper 28,96; pausa 28,90 a 29,38); fim esticado pra início + 0,05 (era 29,40) |
| 78 | clica | clica | 0,83 | 29,40 | 29,62 |  |
| 79 | no | no | 0,98 | 29,62 | 29,72 |  |
| 80 | link (chave) | link | 0,99 | 29,72 | 29,86 |  |
| 81 | da | da | 0,36 | 29,86 | 30,02 |  |
| 82 | bio. | bio. | 0,74 | 30,02 | 30,16 |  |

## Frases

| frase | palavras | chave | início | fim | out |
|---|---|---|---|---|---|
| 0 | 0 a 3 | 3 (Legalizaí.) | 0,00 | 2,90 | 3,39 |
| 1 | 4 a 8 | 6 (muda) | 3,41 | 4,20 | 4,77 |
| 2 | 9 a 15 | 12 (papel,) | 4,79 | 7,74 | 7,72 |
| 3 | 16 a 20 | 17 (espera) | 7,74 | 9,32 | 9,79 |
| 4 | 21 a 25 | 25 (app,) | 9,81 | 10,60 | 10,70 |
| 5 | 26 a 35 | 32 (passo) | 10,72 | 13,20 | 13,98 |
| 6 | 36 a 44 | 37 (sistema) | 14,00 | 16,48 | 16,56 |
| 7 | 45 a 47 | 46 (só) | 16,58 | 17,30 | 17,85 |
| 8 | 48 a 50 | 50 (padrão?) | 17,87 | 18,44 | 19,00 |
| 9 | 51 a 54 | 54 (Simples,) | 19,02 | 20,10 | 20,45 |
| 10 | 55 a 63 | 57 (contador) | 20,47 | 24,50 | 25,19 |
| 11 | 64 a 73 | 66 (cuidado,) | 25,21 | 27,76 | 28,39 |
| 12 | 74 a 82 | 80 (link) | 28,41 | 30,16 | 30,58 |

## Pausas do áudio (abaixo de -40 dB por 80 ms ou mais)

0,85 a 0,94, 1,50 a 1,67, 2,09 a 2,25, 2,88 a 3,41, 4,26 a 4,79, 5,67 a 5,78, 5,99 a 6,11, 6,20 a 6,31, 6,50 a 6,78, 7,28 a 7,41, 7,80 a 8,10, 8,28 a 8,37, 8,59 a 8,70, 9,35 a 9,81, 10,20 a 10,28, 10,56 a 10,72, 11,72 a 11,88, 11,90 a 12,07, 12,31 a 12,39, 13,21 a 13,47, 13,50 a 14,00, 14,60 a 14,69, 14,91 a 15,19, 15,82 a 15,98, 16,98 a 17,08, 17,31 a 17,87, 18,49 a 19,04, 19,16 a 19,25, 20,29 a 20,47, 21,90 a 22,07, 22,55 a 22,65, 22,80 a 22,93, 23,10 a 23,21, 23,53 a 23,72, 23,87 a 23,99, 24,03 a 24,26, 24,52 a 25,21, 25,53 a 25,61, 25,85 a 26,22, 26,63 a 26,92, 27,22 a 27,37, 27,85 a 28,41, 28,90 a 29,38, 30,18 a 30,55
