# Alinhamento da narração: guia-pronta-2026-10-14

Gerado pelo `KIT/voz/alinha.py` em 02/10/2026 15:09 (11 s de relógio).

- Áudio transcrito: `voz/narr-dylan.wav` (17,995 s), o voz.arquivo da cena
- Cena: `cenas.json`
- Roteiro: `voz/roteiro.md` (7 frases, 50 palavras)
- Whisper: faster-whisper 1.2.1, modelo small, cpu, int8, language pt, word_timestamps, beam_size 5, sem initial_prompt
- Refino do início: silêncio abaixo de -40 dB por 80 ms ou mais (24 pausas), como no `PR/src/timeline.py`; a primeira palavra fica como o whisper deu
- Fim da última palavra: segunda passada do whisper até 15,01 s (começo da fala depois do roteiro): fim 14,56 no lugar de 14,16
- tFecho: 14,560 + 0,44 = 15,00 s; duração 18,00 s
- Fala depois do roteiro começa em 15,01 s (ela não entra na narração; com o fecho embutido, é ele)
- Saída: `voz/narracao-kit.json`
- Palavras com marca: 12 de 50; sem par no whisper: 0

## Palavras

| i | palavra | whisper | prob. | início | fim | marca |
|---|---|---|---|---|---|---|
| 0 | Veja | Veja | 0,96 | 0,00 | 0,54 | primeira palavra: começo do whisper mantido (o refino levaria a 0,34; pausa 0,00 a 0,34) |
| 1 | como | como | 1,00 | 0,54 | 0,70 |  |
| 2 | vai | vai | 0,99 | 0,70 | 0,86 |  |
| 3 | ser | ser | 0,95 | 0,86 | 1,04 |  |
| 4 | ter | ter | 0,95 | 1,04 | 1,28 |  |
| 5 | a | a | 0,98 | 1,28 | 1,42 |  |
| 6 | guia (chave) | guia | 0,92 | 1,42 | 1,56 |  |
| 7 | do | do | 0,99 | 1,56 | 1,66 |  |
| 8 | mês | mês | 1,00 | 1,66 | 1,86 |  |
| 9 | sem (chave) | sem | 0,96 | 1,86 | 2,24 |  |
| 10 | entrar | entrar | 1,00 | 2,24 | 2,48 |  |
| 11 | no | no | 0,99 | 2,48 | 2,62 |  |
| 12 | site | site | 1,00 | 2,62 | 2,84 |  |
| 13 | do | do | 1,00 | 2,84 | 3,04 |  |
| 14 | governo. | governo. | 0,94 | 3,04 | 3,40 |  |
| 15 | O | O | 0,99 | 4,23 | 4,28 | início refinado pelo silêncio (whisper 3,92; pausa 3,45 a 4,23); fim esticado pra início + 0,05 (era 4,24) |
| 16 | sistema (chave) | sistema | 0,99 | 4,24 | 4,50 |  |
| 17 | calcula | calcula | 0,94 | 4,50 | 5,02 |  |
| 18 | o | o | 0,96 | 5,02 | 5,10 |  |
| 19 | imposto | imposto | 0,95 | 5,10 | 5,48 |  |
| 20 | e | e | 0,96 | 5,73 | 5,82 | início refinado pelo silêncio (whisper 5,48; pausa 5,44 a 5,73) |
| 21 | emite | emite | 0,97 | 5,82 | 6,10 |  |
| 22 | a | a | 0,98 | 6,10 | 6,22 |  |
| 23 | guia. | guia. | 0,99 | 6,22 | 6,50 |  |
| 24 | Ela | Ela | 0,99 | 6,93 | 7,02 | início refinado pelo silêncio (whisper 6,84; pausa 6,44 a 6,93) |
| 25 | aparece | aparece | 0,67 | 7,02 | 7,28 |  |
| 26 | pronta, (chave) | pronta, | 0,99 | 7,28 | 7,76 |  |
| 27 | com | com | 0,98 | 8,02 | 8,10 | início refinado pelo silêncio (whisper 7,96; pausa 7,78 a 8,02) |
| 28 | o | o | 0,69 | 8,10 | 8,15 | fim esticado pra início + 0,05 (era 8,12) |
| 29 | dia | dia | 0,99 | 8,12 | 8,24 |  |
| 30 | que | que | 0,99 | 8,24 | 8,38 |  |
| 31 | vence. | vence. | 0,98 | 8,38 | 8,72 |  |
| 32 | A | A | 0,97 | 9,32 | 9,38 | início refinado pelo silêncio (whisper 9,28; pausa 8,74 a 9,32) |
| 33 | sua | sua | 1,00 | 9,38 | 9,52 |  |
| 34 | parte | parte | 1,00 | 9,52 | 9,92 |  |
| 35 | é | é | 0,99 | 9,92 | 10,12 |  |
| 36 | só (chave) | só | 1,00 | 10,12 | 10,32 |  |
| 37 | pagar. | pagar. | 0,99 | 10,32 | 10,54 |  |
| 38 | Isso | Isso | 0,97 | 11,14 | 11,28 | início refinado pelo silêncio (whisper 11,12; pausa 10,63 a 11,14) |
| 39 | é | é | 1,00 | 11,28 | 11,38 |  |
| 40 | uma | uma | 0,99 | 11,38 | 11,46 |  |
| 41 | prévia | prévia | 0,90 | 11,46 | 11,82 |  |
| 42 | real (chave) | real | 0,98 | 11,82 | 12,08 |  |
| 43 | do | do | 0,98 | 12,08 | 12,18 |  |
| 44 | que | que | 1,00 | 12,18 | 12,28 | começo do whisper mantido: o refino levaria a 12,31, depois do começo da palavra seguinte (12,28; pausa 12,19 a 12,31) |
| 45 | estamos | estamos | 0,99 | 12,31 | 12,50 | início refinado pelo silêncio (whisper 12,28; pausa 12,19 a 12,31) |
| 46 | construindo. | construindo. | 1,00 | 12,50 | 13,10 |  |
| 47 | Chegando | Chegando | 0,99 | 13,62 | 13,86 | início refinado pelo silêncio (whisper 13,52; pausa 13,08 a 13,62) |
| 48 | em | em | 0,99 | 13,86 | 14,00 |  |
| 49 | breve. (chave) | breve, | 1,00 | 14,00 | 14,56 | fim da segunda passada (áudio até 15,01 s, começo da fala depois do roteiro); a primeira passada dava 14,16 |

## Frases

| frase | palavras | chave | início | fim | out |
|---|---|---|---|---|---|
| 0 | 0 a 8 | 6 (guia) | 0,00 | 1,86 | 1,84 |
| 1 | 9 a 14 | 9 (sem) | 1,86 | 3,40 | 4,21 |
| 2 | 15 a 23 | 16 (sistema) | 4,23 | 6,50 | 6,91 |
| 3 | 24 a 31 | 26 (pronta,) | 6,93 | 8,72 | 9,30 |
| 4 | 32 a 37 | 36 (só) | 9,32 | 10,54 | 11,12 |
| 5 | 38 a 46 | 42 (real) | 11,14 | 13,10 | 13,60 |
| 6 | 47 a 49 | 49 (breve.) | 13,62 | 14,56 | 14,98 |

## Fala do whisper depois do roteiro (fica fora da narração)

| whisper | prob. | início | fim |
|---|---|---|---|
| vai | 0,78 | 15,18 | 15,22 |
| legalizar | 0,80 | 15,22 | 16,04 |
| i. | 0,17 | 16,04 | 16,20 |

## Pausas do áudio (abaixo de -40 dB por 80 ms ou mais)

0,00 a 0,34, 1,09 a 1,21, 1,98 a 2,06, 3,45 a 4,23, 4,76 a 4,90, 5,16 a 5,25, 5,44 a 5,73, 6,44 a 6,93, 7,39 a 7,48, 7,68 a 7,77, 7,78 a 8,02, 8,74 a 9,32, 9,59 a 9,67, 9,83 a 9,91, 10,63 a 11,14, 11,49 a 11,59, 12,19 a 12,31, 12,56 a 12,66, 12,75 a 12,83, 13,08 a 13,62, 14,23 a 14,58, 14,59 a 15,01, 15,27 a 15,46, 16,22 a 17,99
