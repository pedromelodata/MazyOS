# Alinhamento da narração: 2026-10-05-tradicional-vs-legalizai-v3

Gerado pelo `KIT/voz/alinha.py` em 05/10/2026 14:48 (16 s de relógio).

- Áudio transcrito: `voz/narr-dylan.wav` (30,720 s), o voz.arquivo da cena
- Cena: `nenhuma (padrões do kit)`
- Roteiro: `roteiro.md` (13 frases, 82 palavras)
- Whisper: faster-whisper 1.2.1, modelo small, cpu, int8, language pt, word_timestamps, beam_size 5, sem initial_prompt
- Refino do início: silêncio abaixo de -40 dB por 80 ms ou mais (52 pausas), como no `PR/src/timeline.py`; a primeira palavra fica como o whisper deu
- Fim da última palavra: segunda passada do whisper até 30,65 s (fim acústico da última palavra (29,87) mais 0,78 s): fim 29,82 no lugar de 29,82
- tFecho: 29,820 + 0,44 = 30,26 s; duração 33,26 s
- Saída: `voz/narracao.json`
- Palavras com marca: 24 de 82; sem par no whisper: 0

## Palavras

| i | palavra | whisper | prob. | início | fim | marca |
|---|---|---|---|---|---|---|
| 0 | Contabilidade | Contabilidade | 0,88 | 0,00 | 0,76 |  |
| 1 | tradicional | tradicional | 0,83 | 0,76 | 1,30 |  |
| 2 | vs | versus | 0,53 | 1,30 | 1,90 | o whisper ouviu 'versus' |
| 3 | Legalizaí. (chave) | legalizaí. | 0,71 | 1,90 | 2,88 |  |
| 4 | O | O | 0,96 | 3,41 | 3,48 | início refinado pelo silêncio (whisper 3,34; pausa 2,84 a 3,41) |
| 5 | que | que | 1,00 | 3,48 | 3,56 |  |
| 6 | muda (chave) | muda | 0,99 | 3,56 | 3,80 |  |
| 7 | pra | para | 0,55 | 3,80 | 3,94 | o whisper ouviu 'para' |
| 8 | você? | você? | 0,99 | 3,94 | 4,22 |  |
| 9 | Abrir | Abrir | 0,86 | 4,78 | 5,10 |  |
| 10 | empresa | empresa | 0,71 | 5,22 | 5,54 | início refinado pelo silêncio (whisper 5,10; pausa 5,10 a 5,22) |
| 11 | era | era | 0,91 | 5,54 | 5,92 |  |
| 12 | papel, (chave) | papel, | 0,95 | 5,92 | 6,38 |  |
| 13 | ida | ida | 0,93 | 6,86 | 6,94 |  |
| 14 | ao | ao | 0,99 | 6,94 | 7,18 |  |
| 15 | escritório | escritório | 0,96 | 7,18 | 7,74 |  |
| 16 | e | e | 0,83 | 7,74 | 8,16 |  |
| 17 | espera (chave) | espera | 0,97 | 8,16 | 8,54 |  |
| 18 | pra | para | 0,94 | 8,54 | 8,78 | o whisper ouviu 'para' |
| 19 | ser | ser | 0,98 | 8,78 | 8,94 |  |
| 20 | atendido. | atendido. | 0,97 | 8,94 | 9,30 |  |
| 21 | Agora | Agora | 0,98 | 9,88 | 10,08 | início refinado pelo silêncio (whisper 9,80; pausa 9,35 a 9,88) |
| 22 | é | é | 0,71 | 10,08 | 10,32 |  |
| 23 | tudo | tudo | 1,00 | 10,38 | 10,44 | início refinado pelo silêncio (whisper 10,32; pausa 10,30 a 10,38) |
| 24 | pelo | pelo | 0,99 | 10,44 | 10,64 |  |
| 25 | app, (chave) | app, | 0,88 | 10,64 | 10,92 |  |
| 26 | com | com | 0,99 | 11,23 | 11,32 | início refinado pelo silêncio (whisper 11,18; pausa 10,86 a 11,23) |
| 27 | o | o | 0,84 | 11,32 | 11,52 |  |
| 28 | CNAE | senai | 0,49 | 11,52 | 11,84 | o whisper ouviu 'senai' |
| 29 | certo | certo | 0,99 | 11,84 | 12,20 |  |
| 30 | e | e | 0,71 | 12,20 | 12,52 | começo do whisper mantido: o refino levaria a 12,57, depois do começo da palavra seguinte (12,52; pausa 12,15 a 12,47, 12,48 a 12,57) |
| 31 | cada | cada | 1,00 | 12,57 | 12,74 | início refinado pelo silêncio (whisper 12,52; pausa 12,48 a 12,57) |
| 32 | passo (chave) | passo | 1,00 | 12,74 | 13,06 |  |
| 33 | na | na | 0,99 | 13,06 | 13,20 |  |
| 34 | sua | sua | 0,98 | 13,20 | 13,34 |  |
| 35 | tela. | tela. | 1,00 | 13,34 | 13,60 |  |
| 36 | O | O | 0,97 | 14,21 | 14,26 | início refinado pelo silêncio (whisper 14,10; pausa 13,67 a 14,21); fim esticado pra início + 0,05 (era 14,24) |
| 37 | sistema (chave) | sistema | 0,98 | 14,24 | 14,48 |  |
| 38 | calcula, | calcula, | 0,96 | 14,48 | 15,14 |  |
| 39 | emite | emite | 0,92 | 15,44 | 15,62 |  |
| 40 | a | a | 0,97 | 15,62 | 15,74 |  |
| 41 | guia | guia | 0,99 | 15,74 | 16,00 |  |
| 42 | e | e | 0,97 | 16,18 | 16,24 | início refinado pelo silêncio (whisper 16,00; pausa 16,00 a 16,18) |
| 43 | te | te | 0,97 | 16,24 | 16,34 |  |
| 44 | avisa. | avisa, | 0,98 | 16,34 | 16,66 |  |
| 45 | Você | você | 0,99 | 16,79 | 16,94 | início refinado pelo silêncio (whisper 16,76; pausa 16,70 a 16,79) |
| 46 | só (chave) | só | 0,99 | 16,94 | 17,16 |  |
| 47 | paga. | paga. | 0,99 | 17,27 | 17,46 | início refinado pelo silêncio (whisper 17,16; pausa 17,17 a 17,27) |
| 48 | Fugiu | Fugiu | 0,62 | 18,07 | 18,22 | início refinado pelo silêncio (whisper 17,88; pausa 17,49 a 18,07) |
| 49 | do | do | 0,97 | 18,22 | 18,34 |  |
| 50 | padrão? (chave) | padrão? | 1,00 | 18,34 | 18,62 |  |
| 51 | No | No | 0,98 | 19,25 | 19,36 | início refinado pelo silêncio (whisper 19,18; pausa 18,68 a 19,25) |
| 52 | plano | plano | 0,90 | 19,36 | 19,62 |  |
| 53 | do | dos | 0,69 | 19,62 | 19,80 | o whisper ouviu 'dos' |
| 54 | Simples, (chave) | simples, | 0,97 | 19,80 | 20,14 |  |
| 55 | tem | tem | 0,99 | 20,59 | 20,68 | início refinado pelo silêncio (whisper 20,52; pausa 20,32 a 20,59) |
| 56 | um | um | 0,99 | 20,68 | 20,92 |  |
| 57 | contador (chave) | contador | 1,00 | 20,92 | 21,40 |  |
| 58 | de | de | 0,87 | 21,40 | 21,82 |  |
| 59 | verdade, | verdade | 0,99 | 21,82 | 22,20 |  |
| 60 | com | com | 0,96 | 22,20 | 22,74 |  |
| 61 | registro | registro | 0,97 | 22,74 | 23,34 |  |
| 62 | no | no | 0,96 | 23,34 | 23,64 |  |
| 63 | CRC. | CRC. | 0,93 | 23,64 | 24,58 |  |
| 64 | O | O | 0,93 | 25,05 | 25,12 | início refinado pelo silêncio (whisper 24,98; pausa 24,59 a 25,05) |
| 65 | mesmo | mesmo | 0,99 | 25,12 | 25,28 |  |
| 66 | cuidado, (chave) | cuidado | 0,99 | 25,28 | 25,64 |  |
| 67 | agora | agora | 0,86 | 25,64 | 26,10 |  |
| 68 | no | no | 0,97 | 26,10 | 26,48 |  |
| 69 | app | app | 0,46 | 26,48 | 26,70 |  |
| 70 | que | que | 0,99 | 26,70 | 26,84 |  |
| 71 | tá | está | 0,80 | 26,87 | 26,92 | o whisper ouviu 'está'; início refinado pelo silêncio (whisper 26,84; pausa 26,76 a 26,87) |
| 72 | chegando. | chegando. | 1,00 | 26,92 | 27,36 |  |
| 73 | Segue | Segue | 0,89 | 28,06 | 28,26 | início refinado pelo silêncio (whisper 27,88; pausa 27,34 a 28,06) |
| 74 | a | a | 0,95 | 28,26 | 28,36 |  |
| 75 | gente | gente | 1,00 | 28,36 | 28,58 |  |
| 76 | e | e | 0,67 | 29,02 | 29,07 | início refinado pelo silêncio (whisper 28,58; pausa 28,56 a 29,02); fim esticado pra início + 0,05 (era 29,06) |
| 77 | clica | clica | 0,96 | 29,06 | 29,28 |  |
| 78 | no | no | 0,98 | 29,28 | 29,38 |  |
| 79 | link (chave) | link | 0,98 | 29,38 | 29,54 |  |
| 80 | da | da | 0,86 | 29,54 | 29,66 |  |
| 81 | bio. | bio. | 0,79 | 29,66 | 29,82 | fim da segunda passada (áudio até 30,65 s, fim acústico da última palavra (29,87) mais 0,78 s); a primeira passada dava 29,82 |

## Frases

| frase | palavras | chave | início | fim | out |
|---|---|---|---|---|---|
| 0 | 0 a 3 | 3 (Legalizaí.) | 0,00 | 2,88 | 3,39 |
| 1 | 4 a 8 | 6 (muda) | 3,41 | 4,22 | 4,76 |
| 2 | 9 a 15 | 12 (papel,) | 4,78 | 7,74 | 7,72 |
| 3 | 16 a 20 | 17 (espera) | 7,74 | 9,30 | 9,86 |
| 4 | 21 a 25 | 25 (app,) | 9,88 | 10,92 | 11,21 |
| 5 | 26 a 35 | 32 (passo) | 11,23 | 13,60 | 14,19 |
| 6 | 36 a 44 | 37 (sistema) | 14,21 | 16,66 | 16,77 |
| 7 | 45 a 47 | 46 (só) | 16,79 | 17,46 | 18,05 |
| 8 | 48 a 50 | 50 (padrão?) | 18,07 | 18,62 | 19,23 |
| 9 | 51 a 54 | 54 (Simples,) | 19,25 | 20,14 | 20,57 |
| 10 | 55 a 63 | 57 (contador) | 20,59 | 24,58 | 25,03 |
| 11 | 64 a 72 | 66 (cuidado,) | 25,05 | 27,36 | 28,04 |
| 12 | 73 a 81 | 79 (link) | 28,06 | 29,82 | 30,24 |

## Pausas do áudio (abaixo de -40 dB por 80 ms ou mais)

0,84 a 0,94, 1,50 a 1,67, 2,07 a 2,26, 2,84 a 3,41, 4,22 a 4,80, 5,10 a 5,22, 5,62 a 5,78, 5,99 a 6,12, 6,20 a 6,32, 6,49 a 6,79, 6,99 a 7,08, 7,28 a 7,41, 7,44 a 7,52, 7,78 a 8,12, 8,28 a 8,37, 8,58 a 8,71, 9,35 a 9,88, 10,16 a 10,24, 10,30 a 10,38, 10,86 a 11,23, 11,34 a 11,46, 12,15 a 12,47, 12,48 a 12,57, 13,39 a 13,47, 13,67 a 14,21, 14,34 a 14,42, 14,77 a 14,89, 15,10 a 15,38, 16,00 a 16,18, 16,42 a 16,50, 16,55 a 16,64, 16,70 a 16,79, 17,17 a 17,27, 17,49 a 18,07, 18,68 a 19,25, 19,38 a 19,48, 20,02 a 20,12, 20,32 a 20,59, 20,72 a 20,82, 21,09 a 21,17, 21,45 a 21,76, 22,35 a 22,66, 23,15 a 23,29, 23,37 a 23,55, 23,98 a 24,15, 24,59 a 25,05, 25,37 a 25,45, 26,29 a 26,46, 26,76 a 26,87, 27,34 a 28,06, 28,56 a 29,02, 29,87 a 30,72
