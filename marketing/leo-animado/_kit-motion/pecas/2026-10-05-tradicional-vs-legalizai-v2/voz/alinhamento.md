# Alinhamento da narração: 2026-10-05-tradicional-vs-legalizai-v2

Gerado pelo `KIT/voz/alinha.py` em 05/10/2026 13:02 (8 s de relógio).

- Áudio transcrito: `voz/narr-dylan.wav` (24,910 s), o voz.arquivo da cena
- Cena: `cenas.json`
- Roteiro: `roteiro.md` (11 frases, 67 palavras)
- Whisper: faster-whisper 1.2.1, modelo small, cpu, int8, language pt, word_timestamps, beam_size 5, sem initial_prompt
- Refino do início: silêncio abaixo de -40 dB por 80 ms ou mais (39 pausas), como no `PR/src/timeline.py`; a primeira palavra fica como o whisper deu
- Fim da última palavra: da primeira passada (não sobra áudio demais depois dela)
- tFecho: 24,440 + 0,44 = 24,88 s; duração 27,88 s
- Saída: `voz/narracao.json`
- Palavras com marca: 21 de 67; sem par no whisper: 0

## Palavras

| i | palavra | whisper | prob. | início | fim | marca |
|---|---|---|---|---|---|---|
| 0 | Contabilidade | Contabilidade | 0,91 | 0,00 | 1,02 | primeira palavra: começo do whisper mantido (o refino levaria a 0,31; pausa 0,00 a 0,31) |
| 1 | tradicional | tradicional | 0,98 | 1,02 | 1,60 |  |
| 2 | vs | versus | 0,63 | 1,60 | 2,16 | o whisper ouviu 'versus' |
| 3 | Legalizaí. (chave) | legalizaí. | 0,77 | 2,16 | 3,20 |  |
| 4 | O | O | 0,98 | 3,66 | 3,72 | início refinado pelo silêncio (whisper 3,58; pausa 3,16 a 3,66) |
| 5 | que | que | 1,00 | 3,72 | 3,80 |  |
| 6 | muda (chave) | muda | 1,00 | 3,80 | 4,06 |  |
| 7 | pra | para | 0,90 | 4,06 | 4,18 | o whisper ouviu 'para' |
| 8 | você? | você? | 1,00 | 4,18 | 4,46 |  |
| 9 | Abrir | Abrir | 0,91 | 4,99 | 5,24 | início refinado pelo silêncio (whisper 4,94; pausa 4,49 a 4,99) |
| 10 | empresa | empresa | 1,00 | 5,30 | 5,54 |  |
| 11 | era | era | 0,93 | 5,54 | 5,88 |  |
| 12 | papel (chave) | papel | 0,97 | 5,88 | 6,32 |  |
| 13 | e | e | 0,97 | 6,32 | 6,68 |  |
| 14 | ida | ir | 0,57 | 6,68 | 6,80 | o whisper ouviu 'ir' |
| 15 | ao | ao | 0,99 | 6,80 | 6,92 |  |
| 16 | escritório. | escritório. | 0,91 | 6,92 | 7,44 |  |
| 17 | Agora, | Agora, | 0,98 | 7,88 | 8,10 | início refinado pelo silêncio (whisper 7,84; pausa 7,44 a 7,88) |
| 18 | tudo | tudo | 1,00 | 8,51 | 8,60 | início refinado pelo silêncio (whisper 8,36; pausa 8,25 a 8,51) |
| 19 | pelo | pelo | 1,00 | 8,60 | 8,84 |  |
| 20 | app. (chave) | app. | 0,87 | 8,84 | 9,10 |  |
| 21 | O | O | 0,98 | 9,43 | 9,48 | início refinado pelo silêncio (whisper 9,36; pausa 9,03 a 9,43); fim esticado pra início + 0,05 (era 9,46) |
| 22 | sistema (chave) | sistema | 0,99 | 9,46 | 9,68 |  |
| 23 | calcula, | calcula, | 0,97 | 9,68 | 10,34 |  |
| 24 | emite | emite | 0,79 | 10,62 | 10,88 |  |
| 25 | a | a | 0,96 | 10,88 | 11,00 |  |
| 26 | guia | guia | 0,99 | 11,00 | 11,26 |  |
| 27 | e | e | 0,95 | 11,44 | 11,49 | início refinado pelo silêncio (whisper 11,26; pausa 11,26 a 11,44); fim esticado pra início + 0,05 (era 11,48) |
| 28 | te | te | 0,98 | 11,48 | 11,60 |  |
| 29 | avisa. | avisa. | 0,98 | 11,60 | 11,94 |  |
| 30 | Você | Você | 0,99 | 12,07 | 12,22 | início refinado pelo silêncio (whisper 12,04; pausa 11,96 a 12,07) |
| 31 | só (chave) | só | 1,00 | 12,22 | 12,44 |  |
| 32 | paga. | paga, | 1,00 | 12,54 | 12,76 | início refinado pelo silêncio (whisper 12,44; pausa 12,44 a 12,54) |
| 33 | Fugiu | fugiu | 0,92 | 13,26 | 13,44 | início refinado pelo silêncio (whisper 13,08; pausa 12,77 a 13,26) |
| 34 | do | do | 0,99 | 13,44 | 13,52 |  |
| 35 | padrão? (chave) | padrão. | 1,00 | 13,52 | 13,84 |  |
| 36 | No | No | 0,96 | 14,40 | 14,46 | início refinado pelo silêncio (whisper 14,30; pausa 13,88 a 14,40) |
| 37 | plano | plano | 1,00 | 14,53 | 14,70 | início refinado pelo silêncio (whisper 14,46; pausa 14,45 a 14,53) |
| 38 | ME, | ME | 0,75 | 14,70 | 15,12 |  |
| 39 | tem | tem | 0,48 | 15,12 | 15,68 |  |
| 40 | gente (chave) | gente | 0,99 | 15,68 | 15,96 |  |
| 41 | de | de | 1,00 | 15,96 | 16,12 |  |
| 42 | verdade. | verdade, | 1,00 | 16,12 | 16,46 |  |
| 43 | Um | um | 0,99 | 16,92 | 17,02 |  |
| 44 | contador (chave) | contador | 0,99 | 17,02 | 17,44 |  |
| 45 | com | com | 1,00 | 17,44 | 17,64 |  |
| 46 | registro | registro | 0,99 | 17,64 | 18,20 |  |
| 47 | no | no | 0,96 | 18,52 | 18,62 | início refinado pelo silêncio (whisper 18,20; pausa 18,20 a 18,52) |
| 48 | CRC. | CRC. | 0,98 | 18,62 | 19,40 |  |
| 49 | O | O | 0,98 | 19,71 | 19,76 | início refinado pelo silêncio (whisper 19,64; pausa 19,39 a 19,71) |
| 50 | mesmo | mesmo | 1,00 | 19,76 | 19,94 |  |
| 51 | cuidado, (chave) | cuidado | 0,99 | 19,94 | 20,34 |  |
| 52 | agora | agora | 0,81 | 20,34 | 20,76 |  |
| 53 | no | no | 0,97 | 20,76 | 21,16 |  |
| 54 | app | app | 0,97 | 21,16 | 21,40 |  |
| 55 | que | que | 0,99 | 21,40 | 21,54 |  |
| 56 | tá | está | 0,91 | 21,54 | 21,62 | o whisper ouviu 'está' |
| 57 | chegando. | chegando. | 1,00 | 21,62 | 22,04 |  |
| 58 | Segue | Segue | 0,96 | 22,54 | 22,72 | início refinado pelo silêncio (whisper 22,46; pausa 22,04 a 22,54) |
| 59 | a | a | 0,97 | 22,72 | 22,82 |  |
| 60 | gente | gente | 1,00 | 22,82 | 23,08 |  |
| 61 | e | e | 0,95 | 23,08 | 23,52 |  |
| 62 | clica | clica | 0,99 | 23,59 | 23,72 | início refinado pelo silêncio (whisper 23,52; pausa 23,17 a 23,59) |
| 63 | no | no | 1,00 | 23,72 | 23,84 |  |
| 64 | link (chave) | link | 0,99 | 23,84 | 24,06 |  |
| 65 | da | da | 0,81 | 24,16 | 24,24 | início refinado pelo silêncio (whisper 24,06; pausa 24,03 a 24,16) |
| 66 | bio. | bio. | 0,66 | 24,24 | 24,44 |  |

## Frases

| frase | palavras | chave | início | fim | out |
|---|---|---|---|---|---|
| 0 | 0 a 3 | 3 (Legalizaí.) | 0,00 | 3,20 | 3,64 |
| 1 | 4 a 8 | 6 (muda) | 3,66 | 4,46 | 4,97 |
| 2 | 9 a 16 | 12 (papel) | 4,99 | 7,44 | 7,86 |
| 3 | 17 a 20 | 20 (app.) | 7,88 | 9,10 | 9,41 |
| 4 | 21 a 29 | 22 (sistema) | 9,43 | 11,94 | 12,05 |
| 5 | 30 a 32 | 31 (só) | 12,07 | 12,76 | 13,24 |
| 6 | 33 a 35 | 35 (padrão?) | 13,26 | 13,84 | 14,38 |
| 7 | 36 a 42 | 40 (gente) | 14,40 | 16,46 | 16,90 |
| 8 | 43 a 48 | 44 (contador) | 16,92 | 19,40 | 19,69 |
| 9 | 49 a 57 | 51 (cuidado,) | 19,71 | 22,04 | 22,52 |
| 10 | 58 a 66 | 64 (link) | 22,54 | 24,44 | 24,86 |

## Pausas do áudio (abaixo de -40 dB por 80 ms ou mais)

0,00 a 0,31, 1,11 a 1,23, 1,77 a 1,95, 2,37 a 2,54, 3,16 a 3,66, 4,49 a 4,99, 5,91 a 6,08, 6,17 a 6,27, 6,45 a 6,60, 7,01 a 7,09, 7,16 a 7,27, 7,44 a 7,88, 8,25 a 8,51, 9,03 a 9,43, 9,56 a 9,65, 10,00 a 10,12, 10,33 a 10,62, 11,26 a 11,44, 11,85 a 11,95, 11,96 a 12,07, 12,44 a 12,54, 12,77 a 13,26, 13,88 a 14,40, 14,45 a 14,53, 14,77 a 14,85, 15,29 a 15,62, 15,98 a 16,06, 16,59 a 16,94, 17,47 a 17,56, 18,03 a 18,14, 18,20 a 18,52, 19,39 a 19,71, 20,02 a 20,10, 20,97 a 21,14, 21,44 a 21,56, 22,04 a 22,54, 23,17 a 23,59, 24,03 a 24,16, 24,49 a 24,91
