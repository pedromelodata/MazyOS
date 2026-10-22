# Fontes: trilha do Filme Parque (21/10/2026)

O pedido do Pedro, em 21/10: "está faltando uma música, épica e drmática para poder combinar, conect-se ocm a Epidemic SOund ou busque referências para poder colocar uma música que combine examente com cada take e ponto do vídeo".

A Epidemic ficou de fora por dois motivos:
- não há conector dela no Claude;
- o plano do Pedro lá é o gratuito, que não cobre conteúdo de marca (memória `trilhas-licenca`, 02/10).

As três faixas abaixo foram baixadas com o OK dele, cada uma na sua pasta, como o Mixkit entrega: MP3 de 256 kbps.

| Pasta | Faixa | Autor | Mixkit | Duração | md5 |
|---|---|---|---|---|---|
| `mixkit-552/` | Masking the Masters | Eugenio Mininni | ID 552, listagem Orchestral Hybrid | 3:40 | CD298385F073FD868FDE69F6B3FBC677 |
| `mixkit-606/` | Drawing the Sky | Eugenio Mininni | ID 606, listagem Orchestral Pop | 3:27 | E5630A77C6C4FD24BAB9B29CA33BA06C |
| `mixkit-76/` | Epic Games | Ahjay Stelino | ID 76, listagem Film Score | 1:39 | DB03CF63793AACDAC1E24AD467E34F0D |

Endereço de cada arquivo: `https://assets.mixkit.co/music/<ID>/<ID>.mp3`.

**A licença é a Mixkit Stock Music Free License** (https://mixkit.co/license/#musicFree). Ela permite uso comercial em rede social e anúncio online, sem crédito. Ela não permite registrar a faixa em Content ID nem redistribuir o arquivo solto.

## Como a faixa foi escolhida

- **A triagem foi sem baixar o áudio.** A listagem do Mixkit traz, no JSON-LD de cada card, o MP3 e a forma de onda (`<ID>-waveform.json`). A forma de onda de 10 faixas épicas mostrou quais crescem e explodem.
- **As três baixadas** passaram por `analisa_trilha.py` (energia, andamento e pancadas) e por espectrograma. As três estão em 98,5 a 100 BPM.
- **A escolhida é a 552**, a mais épica das três: cordas em staccato crescendo, um respiro e a orquestra inteira com pratos em 68,2 s.
- **A 606** é mais emotiva (piano e cordas, com a bateria entrando em 14,8 s).
- **A 76** cresce aos poucos, sem uma pancada clara.

## Checagem de relançamento na AudD (21/10)

Foram 9 consultas do dia, por `audd_trilha.py`, com as mesmas funções do `_kit-motion/aquisicoes/audd.py` (recorte de 20 s em memória).

| Faixa | Recorte | Resultado |
|---|---|---|
| 552 | 54 s | "Miami 82", de Thomas Gaudibert: não é esta gravação (correlação 0,17 com a prévia da Apple) |
| 552 | 58 s | "Path To Greatness E", de David Alan Robidoux (biblioteca da NFL Films): sem prévia pra comparar |
| 552 | 66 s | "Joy To The World", de Dominic Carter: não é esta gravação (correlação 0,18 com a prévia do Spotify) |
| 552 | 150 s | sem correspondência |
| 606 | 5 s | "Far From Troubles", de Nadib, 2024: sem prévia |
| 606 | 15 s | "My Secret Corner", de Jean & Mike, 2020: sem prévia |
| 606 | 100 s | sem correspondência |

**A 552 está liberada para esta peça.** Cada recorte trouxe uma correspondência diferente, e as duas com prévia não bateram. A de 58 s, sem prévia, não voltou nos recortes de 54 s e 66 s, que passam pelo mesmo trecho. É o padrão de falso positivo que a House One já teve. A 606 fica sem decisão.

**Antes de postar:**
- subir o vídeo final como não listado no YouTube, porque o Content ID responde em minutos;
- guardar print da licença e da página com a data.

Se vier reivindicação, contestar com o link da licença e avisar o team@mixkit.co.

## O trecho no filme de 15 s

A trilha entra a partir de 58,0 s da faixa (`M_START`). Os tempos abaixo são do filme:

| Tempo | Na música | No filme |
|---|---|---|
| 0 a 7,0 s | cordas em staccato crescendo | a brincadeira, ele pegando o celular (2,9 s) e o toque |
| 3,88 s | grave forte | o corte da abertura pro toque |
| 7,0 a 7,75 s | o respiro | o corte pro close do bolso |
| 8,69 s | grave | o corte do close pra volta |
| 9,29 s | o grave mais forte antes da explosão | o rosto da menina se acendendo (e a risada dela) |
| 10,19 s | a orquestra inteira, com pratos | a palma que retoma a brincadeira e o "E 100% Humanos" |
| 14,0 a 15,0 s | some em 1 s | o fim |

A mixagem está no `monta_parque2.py`:
- o som da cena fica 4 dB abaixo da trilha, com o corte de agudos só nele;
- o filme sai em −14,4 LUFS, com pico real de −1,5 dB;
- o limitador trabalha em 192 kHz, porque um prato da faixa em 70,9 s já vem acima de 0 dB no MP3.
