# Fontes Mixkit

Baixado em 01/10/2026 para a nova versão do Reel "guia pronta" (peça de 14/10), batida "A sua parte é só pagar": flip do celular, botão "Pagar agora", clique e verificado. Pasta: `_assets-externos/mixkit/sfx/` (6 arquivos WAV, 0,9 MB no total). Crédito na legenda: **não é obrigatório**.

## Licença (conferida na página oficial)

Os 6 efeitos estão sob a **Mixkit Sound Effects Free License**. Li o texto em https://mixkit.co/license/#sfxFree (o texto completo abre em https://mixkit.co/license/modal/sfxFree/) e os Termos de Uso do Mixkit (https://mixkit.co/terms/, revisão de 02/10/2025). O que vale pra nós:

| Pode | Não pode |
|---|---|
| Usar de graça em post de rede social, anúncio online e projeto comercial (a licença lista "Social Media video posts", "Online marketing ads" e "Commercial projects") | Redistribuir o arquivo sozinho, como banco de sons, dentro de ferramenta ou de template |
| Cortar, mudar o tom, mixar com outros sons | Dizer que o som é seu ou registrar em sistema de gestão de direitos (Content ID e afins) |
| Publicar sem crédito: nem a licença nem os Termos pedem atribuição, e o próprio Mixkit se descreve como uso "without attribution" | Baixar em massa com robô ou script (os Termos proíbem) |

O Mixkit é do grupo Envato, o mesmo dono do Elements. Os efeitos não têm autor individual: a página mostra só título, tags e duração, então o autor é "Mixkit". Também não existe página própria de cada efeito. A "página" de cada um abaixo é a categoria onde ele aparece, e o arquivo sai do botão "Download Free SFX", que aponta para `https://assets.mixkit.co/active_storage/sfx/<id>/<id>.wav`.

## Como foi escolhido

1. Li as categorias Click, Interface, Tap, Notification, Tones, Positive, Success, Correct, Whoosh, Swoosh, Transition, Swish, Spin, Air, Thud, Drop, Soft e Pop.
2. Ouvir não dá aqui (não há saída de áudio). Baixei a prévia MP3 de 40 candidatos e medi cada um: envelope, espectrograma, nota musical (FFT) e transientes. O "como soa" abaixo sai dessa medição. Vale passar no ouvido antes de fechar a mixagem.
3. Ficaram 6, baixados no WAV original (16 bits, 44,1 kHz, estéreo). As prévias foram apagadas.

## Efeitos (6 arquivos, `mixkit/sfx/`)

Duração medida com ffprobe. Pico medido com ffmpeg (astats e true peak do ebur128): **nenhum passa de 0 dBFS**. O 166 encosta no teto (pico de amostra -0,09 dBFS, true peak -0,1 dBFS): baixe uns 4 dB na mixagem.

| Arquivo | Título e página | ID | Duração | Pico |
|---|---|---|---|---|
| `whoosh-flip_fast-small-sweep-transition_mixkit_166.wav` | Fast small sweep transition, em [Swoosh](https://mixkit.co/free-sound-effects/swoosh/) e [Transition](https://mixkit.co/free-sound-effects/transition/) | 166 | 0,78 s | -0,09 dBFS |
| `whoosh-flip-curto_fast-transitions-swoosh_mixkit_3115.wav` | Fast transitions swoosh, em [Swoosh](https://mixkit.co/free-sound-effects/swoosh/) e [Transition](https://mixkit.co/free-sound-effects/transition/) | 3115 | 0,57 s | -3,9 dBFS |
| `clique_select-click_mixkit_1109.wav` | Select click, em [Click](https://mixkit.co/free-sound-effects/click/) e [Interface](https://mixkit.co/free-sound-effects/interface/) | 1109 | 1,10 s | -4,0 dBFS |
| `clique-seco_cool-interface-click-tone_mixkit_2568.wav` | Cool interface click tone, em [Click](https://mixkit.co/free-sound-effects/click/) e [Interface](https://mixkit.co/free-sound-effects/interface/) | 2568 | 0,20 s | -6,1 dBFS |
| `sucesso_confirmation-tone_mixkit_2867.wav` | Confirmation tone, em [Notification](https://mixkit.co/free-sound-effects/notification/) e [Tones](https://mixkit.co/free-sound-effects/tones/) | 2867 | 1,30 s | -0,6 dBFS |
| `pouso_pillow-soft-hit_mixkit_1897.wav` | Pillow soft hit, em [Soft](https://mixkit.co/free-sound-effects/soft/) | 1897 | 1,17 s | -2,5 dBFS |

Todos: Mixkit Sound Effects Free License, autor Mixkit, sem crédito obrigatório.

**Como soa e onde usar** (tempos da narração: "A" 9,28 s, "é" 9,92 s, "só" 10,12 s, "pagar" 10,30 a 10,54 s; a frase seguinte começa em 11,12 s):

1. **166, Fast small sweep transition** (o whoosh do flip). Entra em 0,10 s, com corpo grave (quase metade da energia abaixo de 300 Hz) e 3 pulsos rápidos em 0,14, 0,24 e 0,33 s, que dão a sensação de algo girando no ar. Pico em 0,27 s. O agudo vai fechando até sumir em 0,6 s. Uso: o giro do celular em "A sua parte". Comece o arquivo uns 0,1 s antes do flip para os pulsos caírem durante a rotação.
2. **3115, Fast transitions swoosh** (flip curto, alternativa). Um "fsh" aéreo e curto, quase só agudo (77% da energia acima de 4 kHz), de 0,07 a 0,24 s, pico em 0,12 s. Uso: flip mais rápido que 0,3 s, ou por cima do 166 para dar brilho.
3. **1109, Select click** (o toque no botão). Dois toques colados (0 e 0,04 s) com um "tim" afinado em dó (523 Hz e 1047 Hz) que some em 0,2 s. O resto do arquivo é silêncio. Uso: o dedo no "Pagar agora", no quadro em que o botão afunda ("só", 10,12 s). Está no mesmo tom do 2867, então clique e verificado soam como uma frase só.
4. **2568, Cool interface click tone** (toque seco, alternativa). Tique de 30 ms, agudo (perto de 2 kHz), sem cauda. Uso: versão mais discreta do toque, ou o "soltar" do botão logo depois do 1109.
5. **2867, Confirmation tone** (o verificado). Duas notas limpas subindo uma oitava: dó (1047 Hz) em 0 s e dó agudo (2093 Hz) em 0,19 s. O som principal acaba em 0,4 s e a cauda some em 0,85 s. Uso: em "pagar" (10,30 s), a primeira nota quando o círculo fecha e a segunda quando o check termina de desenhar. Começando o arquivo em 10,30 s, a segunda nota cai em 10,49 s.
6. **1897, Pillow soft hit** (o pouso suave). Baque abafado e grave (62% da energia abaixo de 300 Hz), ataque em 0,04 s, some em 0,28 s, com dois quiques quase inaudíveis em 0,10 e 0,19 s. Não tem cara de "caiu no chão". Uso: o celular assentando depois do flip, uns 8 a 10 dB abaixo do whoosh.

**Tom.** O 1109 e o 2867 estão em dó. A trilha atual (Summer Fashion) gira em torno de mi, pela análise de croma. Se no ouvido o check soar fora do tom, suba os dois em 4 semitons (dó vira mi).

## Ficaram de reserva (não baixados)

Mesma licença. Cada um sai de `https://assets.mixkit.co/active_storage/sfx/<id>/<id>.wav`.

| ID | Título | Página | Por que ficou de fora |
|---|---|---|---|
| 766 | Alert quick chime | [Chime](https://mixkit.co/free-sound-effects/chime/) | sino único em dó maior, quente, 0,66 s; bom verificado alternativo, mas o 2867 casa melhor com o check desenhado em dois tempos |
| 2865 | Success software tone | [Success](https://mixkit.co/free-sound-effects/success/) | dois acordes de dó maior, 0,68 s, mais cheio; disputa espaço com a voz |
| 1490 | Fast whoosh transition | [Whoosh](https://mixkit.co/free-sound-effects/whoosh/) | sobe por 0,5 s e corta seco em 0,75 s; serve se o flip terminar num impacto |
| 3005 | Explainer video pops whoosh light pop | [Pop](https://mixkit.co/free-sound-effects/pop/) | pop de 0,15 s com um mini whoosh; bom para o botão surgir na tela |
| 2354 | Message pop alert | [Pop](https://mixkit.co/free-sound-effects/pop/) | gota de 15 ms subindo de tom; toque alternativo, curto demais |
| 3088 | Tv remote control or plastic toy drop | [Thud](https://mixkit.co/free-sound-effects/thud/) | plástico batendo com 4 quiques; soa como queda, justamente o que o Pedro não quer |
| 914 | Sci Fi confirmation | [Notification](https://mixkit.co/free-sound-effects/notification/) | varredura sci-fi, nada limpo |

## Música grátis do Mixkit, se quiser trocar a trilha (não baixei)

Licença diferente: **Mixkit Stock Music Free License** (https://mixkit.co/license/#musicFree). Libera post em rede social, anúncio online e uso comercial, sem pedir crédito. Proíbe CD e DVD, TV e rádio, games, remix em faixa só de música e registro em Content ID. Se aparecer reclamação de direitos, o Mixkit pede para mandar os dados para team@mixkit.co.

| Faixa | Autor | Gênero no Mixkit | Duração | BPM estimado |
|---|---|---|---|---|
| Close Up | Michael Ramir C. | Corporate Music | 1:35 | 105 |
| Better Times are Coming | Alejandro Magaña (A. M.) | Synthpop | 1:40 | 120 |
| House 02 | Lily J | House | 1:53 | 123 |
| Cat Walk | Arulo | House | 2:04 | 129 |

Todas listadas em https://mixkit.co/free-stock-music/tag/technology/. BPM estimado por autocorrelação de 40 s de cada faixa, sem ouvir.
