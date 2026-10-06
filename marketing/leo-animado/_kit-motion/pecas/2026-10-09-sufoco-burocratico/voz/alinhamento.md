# Alinhamento da narração: 2026-10-09-sufoco-burocratico

Gerado pelo `KIT/voz/alinha.py` em 06/10/2026 11:15 (8 s de relógio).

- Áudio transcrito: `voz/narr-dylan.wav` (21,478 s), o voz.arquivo da cena
- Cena: `cenas.json`
- Roteiro: `roteiro.md` (8 frases, 53 palavras)
- Whisper: faster-whisper 1.2.1, modelo small, cpu, int8, language pt, word_timestamps, beam_size 5, sem initial_prompt
- Refino do início: silêncio abaixo de -40 dB por 80 ms ou mais (29 pausas), como no `PR/src/timeline.py`; a primeira palavra fica como o whisper deu
- Fim da última palavra: da primeira passada (não sobra áudio demais depois dela)
- tFecho: 21,360 + 0,44 = 21,80 s; duração 24,80 s
- Saída: `voz/narracao.json`
- Palavras com marca: 17 de 53; sem par no whisper: 0

## Palavras

| i | palavra | whisper | prob. | início | fim | marca |
|---|---|---|---|---|---|---|
| 0 | Você | Você | 0,82 | 0,00 | 0,60 | primeira palavra: começo do whisper mantido (o refino levaria a 0,44; pausa 0,00 a 0,44) |
| 1 | separa | separa | 0,99 | 0,60 | 1,02 |  |
| 2 | a | a | 0,34 | 1,02 | 1,08 | começo do whisper mantido: o refino levaria a 1,12, depois do começo da palavra seguinte (1,08; pausa 1,03 a 1,12) |
| 3 | tarde (chave) | tarde | 1,00 | 1,12 | 1,32 | início refinado pelo silêncio (whisper 1,08; pausa 1,03 a 1,12) |
| 4 | inteira | inteira | 0,97 | 1,32 | 1,72 |  |
| 5 | pra | para | 0,77 | 1,72 | 1,88 | o whisper ouviu 'para' |
| 6 | resolver | resolver | 0,99 | 1,88 | 2,18 |  |
| 7 | uma | uma | 0,98 | 2,18 | 2,36 |  |
| 8 | coisa | coisa | 1,00 | 2,36 | 2,60 |  |
| 9 | simples. | simples. | 0,99 | 2,60 | 3,08 |  |
| 10 | Chega | Chega | 0,97 | 3,73 | 3,92 | início refinado pelo silêncio (whisper 3,58; pausa 3,24 a 3,73) |
| 11 | no | no | 0,98 | 3,92 | 4,02 |  |
| 12 | site, | site, | 1,00 | 4,02 | 4,38 |  |
| 13 | trava. (chave) | prava, | 0,75 | 4,97 | 5,36 | o whisper ouviu 'prava,'; início refinado pelo silêncio (whisper 4,82; pausa 4,54 a 4,97) |
| 14 | Liga | liga | 0,92 | 6,01 | 6,18 | início refinado pelo silêncio (whisper 5,90; pausa 5,40 a 6,01) |
| 15 | pro | pro | 0,65 | 6,18 | 6,32 |  |
| 16 | telefone, | telefone, | 1,00 | 6,32 | 6,86 |  |
| 17 | cai | cai | 0,91 | 7,10 | 7,22 |  |
| 18 | a | a | 0,91 | 7,22 | 7,34 |  |
| 19 | ligação. (chave) | ligação. | 0,95 | 7,34 | 7,74 |  |
| 20 | Vai | Vai | 0,98 | 8,79 | 8,98 | início refinado pelo silêncio (whisper 8,58; pausa 7,78 a 8,79) |
| 21 | pessoalmente, | pessoalmente, | 0,89 | 8,98 | 9,68 |  |
| 22 | fila. (chave) | fila! | 0,96 | 9,98 | 10,26 | início refinado pelo silêncio (whisper 9,90; pausa 9,70 a 9,98) |
| 23 | No | No | 0,97 | 10,92 | 10,98 | início refinado pelo silêncio (whisper 10,84; pausa 10,27 a 10,92) |
| 24 | fim | fim | 1,00 | 10,98 | 11,16 |  |
| 25 | do | do | 0,99 | 11,16 | 11,26 |  |
| 26 | dia, | dia, | 1,00 | 11,26 | 11,58 |  |
| 27 | nada | nada | 0,99 | 12,12 | 12,26 | início refinado pelo silêncio (whisper 11,96; pausa 11,65 a 12,12) |
| 28 | resolvido, (chave) | resolvido | 0,88 | 12,26 | 12,92 |  |
| 29 | e | e | 0,40 | 12,92 | 13,52 |  |
| 30 | sua | sua | 0,94 | 13,52 | 13,64 |  |
| 31 | empresa | empresa | 1,00 | 13,64 | 13,92 |  |
| 32 | parada (chave) | parada | 0,93 | 13,92 | 14,32 |  |
| 33 | esperando. | esperando. | 0,90 | 14,32 | 14,68 |  |
| 34 | É | É | 0,98 | 15,29 | 15,34 | início refinado pelo silêncio (whisper 15,22; pausa 14,82 a 15,29) |
| 35 | por | por | 0,99 | 15,43 | 15,50 | início refinado pelo silêncio (whisper 15,34; pausa 15,32 a 15,43) |
| 36 | isso | isso | 0,99 | 15,50 | 15,78 |  |
| 37 | que | que | 0,99 | 15,78 | 15,94 |  |
| 38 | a | a | 0,94 | 15,94 | 16,00 |  |
| 39 | gente | gente | 1,00 | 16,00 | 16,10 |  |
| 40 | tá | está | 0,56 | 16,10 | 16,24 | o whisper ouviu 'está' |
| 41 | construindo | construindo | 1,00 | 16,33 | 16,82 | início refinado pelo silêncio (whisper 16,24; pausa 16,25 a 16,33) |
| 42 | o | o | 0,96 | 16,82 | 17,18 |  |
| 43 | Legalizaí. (chave) | Legalizai. | 0,67 | 17,18 | 17,84 |  |
| 44 | Segue | Segue | 0,74 | 18,62 | 18,86 | início refinado pelo silêncio (whisper 18,34; pausa 17,89 a 18,62) |
| 45 | a | a | 0,98 | 18,86 | 18,96 |  |
| 46 | gente. | gente | 1,00 | 18,96 | 19,24 |  |
| 47 | E | e | 0,55 | 19,24 | 20,10 |  |
| 48 | clica | clica | 0,98 | 20,39 | 20,66 | início refinado pelo silêncio (whisper 20,10; pausa 19,29 a 20,39) |
| 49 | no | no | 0,99 | 20,66 | 20,80 |  |
| 50 | link (chave) | link | 0,98 | 20,80 | 20,98 |  |
| 51 | da | da | 0,93 | 20,98 | 21,12 |  |
| 52 | bio. | bio. | 0,37 | 21,12 | 21,36 |  |

## Frases

| frase | palavras | chave | início | fim | out |
|---|---|---|---|---|---|
| 0 | 0 a 9 | 3 (tarde) | 0,00 | 3,08 | 3,71 |
| 1 | 10 a 13 | 13 (trava.) | 3,73 | 5,36 | 5,99 |
| 2 | 14 a 19 | 19 (ligação.) | 6,01 | 7,74 | 8,77 |
| 3 | 20 a 22 | 22 (fila.) | 8,79 | 10,26 | 10,90 |
| 4 | 23 a 28 | 28 (resolvido,) | 10,92 | 12,92 | 12,90 |
| 5 | 29 a 33 | 32 (parada) | 12,92 | 14,68 | 15,27 |
| 6 | 34 a 43 | 43 (Legalizaí.) | 15,29 | 17,84 | 18,60 |
| 7 | 44 a 52 | 50 (link) | 18,62 | 21,36 | 21,78 |

## Pausas do áudio (abaixo de -40 dB por 80 ms ou mais)

0,00 a 0,44, 1,03 a 1,12, 1,44 a 1,56, 2,37 a 2,48, 2,98 a 3,06, 3,24 a 3,73, 4,39 a 4,48, 4,54 a 4,97, 5,40 a 6,01, 6,57 a 6,72, 6,91 a 7,10, 7,78 a 8,79, 9,02 a 9,12, 9,56 a 9,64, 9,70 a 9,98, 10,27 a 10,92, 11,02 a 11,10, 11,65 a 12,12, 12,62 a 12,70, 12,95 a 13,48, 14,43 a 14,53, 14,82 a 15,29, 15,32 a 15,43, 15,83 a 15,93, 16,25 a 16,33, 16,40 a 16,52, 16,86 a 17,11, 17,89 a 18,62, 19,29 a 20,39
