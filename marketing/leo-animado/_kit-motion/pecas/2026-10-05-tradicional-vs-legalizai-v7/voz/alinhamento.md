# Alinhamento da narração: 2026-10-05-tradicional-vs-legalizai-v6

Gerado pelo `KIT/voz/alinha.py` em 06/10/2026 12:32 (16 s de relógio).

- Áudio transcrito: `voz/narr-pedro-gravada.wav` (33,620 s), o voz.arquivo da cena
- Cena: `cenas.json`
- Roteiro: `roteiro.md` (13 frases, 86 palavras)
- Whisper: faster-whisper 1.2.1, modelo small, cpu, int8, language pt, word_timestamps, beam_size 5, sem initial_prompt
- Refino do início: silêncio abaixo de -40 dB por 80 ms ou mais (31 pausas), como no `PR/src/timeline.py`; a primeira palavra fica como o whisper deu
- Fim da última palavra: segunda passada do whisper até 31,61 s (começo da fala depois do roteiro): fim 30,94 no lugar de 30,96
- tFecho: 30,940 + 0,44 = 31,38 s; duração 34,38 s
- Fala depois do roteiro começa em 31,61 s (ela não entra na narração; com o fecho embutido, é ele)
- Saída: `voz/narracao.json`
- Palavras com marca: 17 de 86; sem par no whisper: 0

## Palavras

| i | palavra | whisper | prob. | início | fim | marca |
|---|---|---|---|---|---|---|
| 0 | Contabilidade | Conto habilidade | 0,54 | 0,00 | 0,74 | trecho diferente no whisper ('Conto habilidade'): tempo repartido; primeira palavra: começo do whisper mantido (o refino levaria a 0,19; pausa 0,00 a 0,19) |
| 1 | tradicional | tradicional | 0,99 | 0,74 | 1,26 |  |
| 2 | vs | versus legalize aí. | 0,17 | 1,26 | 1,58 | trecho diferente no whisper ('versus legalize aí.'): tempo repartido |
| 3 | Legalizaí. (chave) | versus legalize aí. | 0,17 | 1,68 | 3,02 | trecho diferente no whisper ('versus legalize aí.'): tempo repartido; início refinado pelo silêncio (whisper 1,58; pausa 1,53 a 1,68) |
| 4 | O | O | 0,91 | 3,53 | 3,60 | início refinado pelo silêncio (whisper 3,44; pausa 3,18 a 3,53) |
| 5 | que | que | 0,99 | 3,60 | 3,66 |  |
| 6 | muda (chave) | muda | 0,99 | 3,66 | 3,86 |  |
| 7 | pra | pra | 0,76 | 3,86 | 4,02 |  |
| 8 | você? | você? | 0,99 | 4,02 | 4,28 |  |
| 9 | Abrir | Abrir | 0,66 | 4,98 | 5,16 | início refinado pelo silêncio (whisper 4,92; pausa 4,88 a 4,98) |
| 10 | empresa | empresa | 0,78 | 5,16 | 5,48 |  |
| 11 | era | era | 0,92 | 5,48 | 5,76 |  |
| 12 | papel, (chave) | papel, | 0,98 | 5,76 | 6,12 |  |
| 13 | ida | ida | 0,71 | 6,52 | 6,62 |  |
| 14 | ao | ao | 0,37 | 6,62 | 6,70 |  |
| 15 | escritório | escritório | 0,98 | 6,70 | 7,22 |  |
| 16 | e | e | 0,92 | 7,22 | 7,54 |  |
| 17 | espera (chave) | espera | 0,96 | 7,54 | 7,92 |  |
| 18 | pra | pra | 0,64 | 7,92 | 8,28 |  |
| 19 | ser | ser | 0,86 | 8,28 | 8,44 |  |
| 20 | atendido. | atendido. | 1,00 | 8,44 | 8,92 |  |
| 21 | Agora | Agora | 0,99 | 9,40 | 9,74 |  |
| 22 | é | é | 0,81 | 9,74 | 10,02 |  |
| 23 | tudo | tudo | 0,99 | 10,02 | 10,18 |  |
| 24 | pelo | pelo | 0,99 | 10,18 | 10,44 |  |
| 25 | app, (chave) | app, | 0,82 | 10,44 | 10,72 |  |
| 26 | com | com | 0,99 | 11,15 | 11,24 | início refinado pelo silêncio (whisper 11,06; pausa 10,97 a 11,15) |
| 27 | acesso | acesso | 0,99 | 11,24 | 11,48 |  |
| 28 | à | à | 0,92 | 11,48 | 11,64 |  |
| 29 | atividade | atividade | 0,95 | 11,64 | 11,94 |  |
| 30 | certa | certa | 0,99 | 11,94 | 12,36 |  |
| 31 | e | e | 0,94 | 12,36 | 12,74 |  |
| 32 | cada | cada | 0,97 | 12,74 | 12,92 |  |
| 33 | passo (chave) | passo | 1,00 | 12,92 | 13,34 |  |
| 34 | na | na | 0,96 | 13,34 | 13,70 |  |
| 35 | sua | sua | 0,99 | 13,70 | 13,96 |  |
| 36 | tela. | tela. | 0,99 | 13,96 | 14,26 |  |
| 37 | O | O | 0,98 | 14,88 | 14,94 | início refinado pelo silêncio (whisper 14,78; pausa 14,61 a 14,88) |
| 38 | sistema (chave) | sistema | 0,99 | 14,94 | 15,16 |  |
| 39 | calcula, | calcula, | 0,98 | 15,34 | 15,90 |  |
| 40 | emite | emite | 0,93 | 16,32 | 16,56 |  |
| 41 | a | a | 0,98 | 16,56 | 16,70 |  |
| 42 | guia | guia | 0,98 | 16,70 | 16,92 |  |
| 43 | e | e | 0,92 | 16,92 | 17,24 |  |
| 44 | te | te | 0,97 | 17,24 | 17,32 |  |
| 45 | avisa. | avisa. | 0,99 | 17,32 | 17,66 |  |
| 46 | Você | Você | 0,98 | 18,00 | 18,30 |  |
| 47 | só (chave) | só | 0,98 | 18,30 | 18,94 |  |
| 48 | paga. | paga. | 0,99 | 18,94 | 19,28 |  |
| 49 | E | E | 0,80 | 19,96 | 20,02 | início refinado pelo silêncio (whisper 19,86; pausa 19,67 a 19,96) |
| 50 | aí, | aí, | 0,92 | 20,02 | 20,18 |  |
| 51 | fugiu | fugiu | 0,85 | 20,45 | 20,62 | início refinado pelo silêncio (whisper 20,42; pausa 20,30 a 20,45) |
| 52 | do | do | 0,99 | 20,62 | 20,70 |  |
| 53 | padrão? (chave) | padrão? | 0,99 | 20,70 | 20,96 |  |
| 54 | No | No | 0,94 | 21,59 | 21,68 | início refinado pelo silêncio (whisper 21,44; pausa 21,22 a 21,59) |
| 55 | plano | Plano | 0,71 | 21,68 | 21,84 |  |
| 56 | do | do | 0,84 | 21,84 | 22,02 |  |
| 57 | Simples, (chave) | Simples, | 0,79 | 22,02 | 22,36 |  |
| 58 | tem | tenho | 0,49 | 22,50 | 22,76 | o whisper ouviu 'tenho' |
| 59 | um | o | 0,35 | 22,76 | 22,88 | o whisper ouviu 'o' |
| 60 | contador (chave) | contador | 0,98 | 22,88 | 23,12 |  |
| 61 | de | de | 0,99 | 23,12 | 23,24 |  |
| 62 | verdade, | verdade | 0,99 | 23,24 | 23,58 |  |
| 63 | com | com | 0,90 | 23,58 | 24,12 |  |
| 64 | registro | registro | 0,99 | 24,16 | 24,54 |  |
| 65 | no | do | 0,56 | 24,54 | 24,64 | o whisper ouviu 'do' |
| 66 | CRC, | CRC. | 0,84 | 24,64 | 25,18 |  |
| 67 | o | O | 0,52 | 25,77 | 25,84 | início refinado pelo silêncio (whisper 25,70; pausa 25,62 a 25,77) |
| 68 | mesmo | mesmo | 1,00 | 25,84 | 26,04 |  |
| 69 | cuidado, (chave) | cuidado, | 0,98 | 26,04 | 26,36 |  |
| 70 | mas | mas | 0,99 | 26,99 | 27,10 | início refinado pelo silêncio (whisper 26,88; pausa 26,59 a 26,99) |
| 71 | agora | agora | 0,99 | 27,10 | 27,46 |  |
| 72 | no | no | 0,82 | 27,46 | 27,88 |  |
| 73 | app | app | 0,97 | 27,88 | 28,12 |  |
| 74 | que | que | 0,99 | 28,12 | 28,24 |  |
| 75 | está | tá | 0,78 | 28,24 | 28,36 | o whisper ouviu 'tá' |
| 76 | chegando. | chegando. | 1,00 | 28,36 | 28,72 |  |
| 77 | Segue | Segue | 0,60 | 28,72 | 29,48 |  |
| 78 | a | a | 0,96 | 29,48 | 29,54 |  |
| 79 | gente | gente | 1,00 | 29,54 | 29,74 |  |
| 80 | e | e | 0,92 | 29,74 | 30,10 |  |
| 81 | clique | clique | 0,95 | 30,10 | 30,26 |  |
| 82 | no | no | 0,98 | 30,26 | 30,44 |  |
| 83 | link (chave) | link | 0,98 | 30,44 | 30,62 |  |
| 84 | da | da | 0,82 | 30,62 | 30,76 |  |
| 85 | bio. | bio. | 0,59 | 30,76 | 30,94 | fim da segunda passada (áudio até 31,61 s, começo da fala depois do roteiro); a primeira passada dava 30,96 |

## Frases

| frase | palavras | chave | início | fim | out |
|---|---|---|---|---|---|
| 0 | 0 a 3 | 3 (Legalizaí.) | 0,00 | 3,02 | 3,51 |
| 1 | 4 a 8 | 6 (muda) | 3,53 | 4,28 | 4,96 |
| 2 | 9 a 15 | 12 (papel,) | 4,98 | 7,22 | 7,20 |
| 3 | 16 a 20 | 17 (espera) | 7,22 | 8,92 | 9,38 |
| 4 | 21 a 25 | 25 (app,) | 9,40 | 10,72 | 11,13 |
| 5 | 26 a 36 | 33 (passo) | 11,15 | 14,26 | 14,86 |
| 6 | 37 a 45 | 38 (sistema) | 14,88 | 17,66 | 17,98 |
| 7 | 46 a 48 | 47 (só) | 18,00 | 19,28 | 19,94 |
| 8 | 49 a 53 | 53 (padrão?) | 19,96 | 20,96 | 21,57 |
| 9 | 54 a 57 | 57 (Simples,) | 21,59 | 22,36 | 22,48 |
| 10 | 58 a 66 | 60 (contador) | 22,50 | 25,18 | 25,75 |
| 11 | 67 a 76 | 69 (cuidado,) | 25,77 | 28,72 | 28,70 |
| 12 | 77 a 85 | 83 (link) | 28,72 | 30,94 | 31,36 |

## Fala do whisper depois do roteiro (fica fora da narração)

| whisper | prob. | início | fim |
|---|---|---|---|
| Vai, | 0,87 | 31,86 | 32,26 |
| legalize | 0,65 | 32,26 | 32,66 |
| aí. | 0,96 | 32,66 | 32,82 |

## Pausas do áudio (abaixo de -40 dB por 80 ms ou mais)

0,00 a 0,19, 1,53 a 1,68, 2,20 a 2,35, 3,06 a 3,17, 3,18 a 3,53, 4,38 a 4,87, 4,88 a 4,98, 7,36 a 7,46, 8,97 a 9,11, 10,83 a 10,96, 10,97 a 11,15, 14,32 a 14,52, 14,61 a 14,88, 16,02 a 16,14, 16,15 a 16,23, 17,81 a 18,02, 19,67 a 19,96, 20,30 a 20,45, 21,22 a 21,59, 23,82 a 24,01, 25,27 a 25,37, 25,42 a 25,54, 25,62 a 25,77, 26,59 a 26,99, 27,61 a 27,78, 28,79 a 29,15, 31,09 a 31,22, 31,24 a 31,34, 31,53 a 31,61, 32,05 a 32,19, 33,36 a 33,62
