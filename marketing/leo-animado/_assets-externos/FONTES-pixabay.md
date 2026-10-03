# Fontes Pixabay

Baixado em 01/10/2026 para o Reel motion de 20 a 30 s. Pasta: `_assets-externos/pixabay/` (musica, sfx, imagens). Total em disco: 32 MB (limite era 150 MB).

## Licença (conferida nas páginas oficiais)

Tudo aqui está sob a **Pixabay Content License**. Li o resumo em https://pixabay.com/service/license-summary/ e a seção da licença nos Termos (https://pixabay.com/service/terms/, versão de 18/11/2024). O que vale pra nós:

| Pode | Não pode |
|---|---|
| Usar de graça, inclusive em peça comercial e em rede social | Vender ou redistribuir o arquivo "solto", sem trabalho criativo em cima |
| Editar, cortar, recolorir, misturar com outras mídias | Usar conteúdo que mostre marca, logo ou produto reconhecível em contexto comercial de bens e serviços |
| Publicar sem dar crédito (crédito é opcional; pra música o Pixabay sugere "por [autor] via Pixabay") | Uso enganoso, ilegal ou imoral, em especial com pessoa reconhecível; usar como marca ou nome de empresa |

**Content ID.** Muitas músicas do Pixabay vêm com o selo "Content ID Registered": o autor registrou a faixa num sistema de impressão digital e o vídeo pode levar reivindicação automática (o FAQ do Pixabay diz que dá pra contestar com o certificado de licença, que só aparece pra quem está logado no download). Isso vale pro YouTube e, quando a distribuidora também registra na Meta, pro Instagram. **Por isso só baixei faixas sem esse selo** (conferido página por página em 01/10/2026; o status pode mudar, vale olhar de novo antes de postar).

## Como foi baixado

1. As páginas do pixabay.com bloqueiam curl com desafio do Cloudflare (HTTP 403 "Just a moment...").
2. A API pública (`pixabay.com/api/`) exige chave pessoal (sem chave aqui, HTTP 400) e não cobre música nem efeitos.
3. O CDN (`cdn.pixabay.com`) entrega os arquivos direto (HTTP 200). Achei o endereço de cada arquivo no índice público do Wayback Machine para `cdn.pixabay.com` (o nome do arquivo traz o ID da faixa), conferi cada um na página viva do Pixabay (título, autor, licença, Content ID, marcação de IA) e baixei com curl do CDN.
4. Imagens: versão de 1280 px, a maior pública. Os originais (até 5000 px) saem pelo botão Download da página.
5. Modelos 3D (GLB): o arquivo só sai pelo botão Download da página; o endereço do GLB não aparece no HTML que eu consigo ler. Baixei os renders oficiais de cada modelo (PNG 720 px com fundo transparente) e listei os links dos GLB mais abaixo.

BPM e estrutura foram medidos por análise do áudio (onset e autocorrelação, numpy). **Não ouvi as faixas** (não há saída de áudio aqui): vale passar no ouvido, principalmente as marcadas como IA, pra confirmar que não têm voz.

## Música (6 faixas, nenhuma com Content ID)

| # | Arquivo (`pixabay/musica/`) | Título e página | Autor | Duração | BPM |
|---|---|---|---|---|---|
| 1 | `01_match-out-afro-amapiano_artbybigvee_178406_110bpm.mp3` | [Match Out - Free Afro Amapiano Instrumental](https://pixabay.com/music/afrobeat-match-out-free-afro-amapiano-instrumental-178406/) | [artbybigvee](https://pixabay.com/users/artbybigvee-7284076/) | 2:46 | 110 |
| 2 | `02_space-dance-elektro-synth-pop_darkmoon-art_335254_120bpm.mp3` | [SPACE DANCE- Elektro Synth Pop](https://pixabay.com/music/build-up-scenes-space-dance-elektro-synth-pop-335254/) | [Darkmoon_Art](https://pixabay.com/users/darkmoon_art-1664300/) (Dorothe Wouters) | 2:11 | 120 |
| 3 | `03_summer-fashion-chill-cool-house-loop_musinova_319147_125bpm.mp3` | [Summer Fashion (Chill Cool House) - Loopable Edit](https://pixabay.com/music/funk-summer-fashion-chill-cool-house-loopable-edit-319147/) | [Musinova](https://pixabay.com/users/musinova-47643763/) | 1:40 | 125 |
| 4 | `04_party-dance_soulfuljamtracks_503270_128bpm.mp3` | [Party Dance](https://pixabay.com/music/electronic-party-dance-503270/) | [SOULFULJAMTRACKS](https://pixabay.com/users/soulfuljamtracks-46363515/) | 2:21 | 128 |
| 5 | `05_afro-house-afterglow_turtlebeats_282227_115bpm.mp3` | [Afro House \| Afterglow](https://pixabay.com/music/upbeat-afro-house-afterglow-282227/) | [TurtleBeats](https://pixabay.com/users/turtlebeats-46526702/) | 2:11 | 115 |
| 6 | `06_turbo-funk-machine_dpstudiomusic_392486_110bpm.mp3` | [Groove Free YouTube - Turbo Funk Machine](https://pixabay.com/music/funk-groove-free-youtube-turbo-funk-machine-392486/) | [DPStudioMusic](https://pixabay.com/users/dpstudiomusic-46013940/) | 1:55 | 110 |

Todas: MP3 256 kbps, Pixabay Content License, sem selo de Content ID e sem nota do autor pedindo crédito, e-mail ou "whitelist".

**Leitura de cada faixa** (a "grade" é um instante em que cai uma batida; as outras caem a cada 60/BPM segundos a partir dele):

1. **Match Out** (afro amapiano, feita por gente, tag Instrumental). Abre em fade de 0 a 4 s e o groove entra cheio em ~0:04; sobe um pouco por volta de 0:35; fecha em fade a partir de 2:38. Grade: 4,058 s, uma batida a cada 0,545 s. Janela sugerida: **0:00 a 0:28**. É a mais quente e moderna das seis. Master muito alto: deixe a música uns 6 a 8 dB abaixo dos efeitos.
2. **SPACE DANCE** (synth pop eletrônico, feita por gente, tags Optimistic e Good Mood). Cresce sozinha de 0 a ~0:24 (sai de quase silêncio e chega ao platô), depois segura; a parte mais forte volta em 1:53. Grade: 0,444 s, a cada 0,5 s. Janela: **0:00 a 0:28**, é a que melhor faz a "energia que cresce" sem edição.
3. **Summer Fashion, Loopable Edit** (chill house, não marcada como IA). Energia constante do início ao fim e o bumbo 4x4 mais marcado das seis, ótimo pra corte em batida; como é editada pra loop, qualquer trecho de 20 a 30 s serve. Grade: 0,421 s, a cada 0,48 s. Como não cresce sozinha, a subida tem que vir dos efeitos (riser antes da virada).
4. **Party Dance** (dance pop, **marcada como IA**, descrição diz instrumental). Cheia desde 0:00, com virada a cada ~15 s (8 compassos); respiro de 0:30 a 0:44 e drop em **0:45**. Grade: 0,189 s, a cada 0,469 s. Janelas: **0:21 a 0:51** (groove, respiro, drop) ou **0:30 a 0:56** (cresce até o drop). Está no teto do pedido (128).
5. **Afro House | Afterglow** (soft house, **marcada como IA**, sem tag de voz: confirmar no ouvido). Introdução suave até ~0:46, respiro de 0:46 a 0:49 e drop em **0:50**; segundo drop em 1:40. Grade: 50,299 s, a cada 0,522 s. Janela: **0:26 a 0:56** ou **0:34 a 1:02**.
6. **Turbo Funk Machine** (funk, **marcada como IA**, tag Instrumental). Esquenta e fica cheia por volta de 0:17; quebra de 0:37 a 0:52; volta em 0:53. Grade: 0,366 s, a cada 0,545 s. Batida menos definida que as outras cinco. Janela: **0:00 a 0:30**.

## Efeitos (20 arquivos, `pixabay/sfx/`)

| Arquivo | Título e página | Autor | Duração | Como soa |
|---|---|---|---|---|
| `whoosh_fast-whoosh_studiokolomna_118248.mp3` | [Fast Whoosh](https://pixabay.com/sound-effects/film-special-effects-fast-whoosh-118248/) | [StudioKolomna](https://pixabay.com/users/studiokolomna-2073170/) | 1,2 s | whoosh clássico, sobe e some |
| `whoosh_movement-swipe-whoosh-3_floraphonic_186577.mp3` | [Movement Swipe Whoosh 3](https://pixabay.com/sound-effects/film-special-effects-movement-swipe-whoosh-3-186577/) | [floraphonic](https://pixabay.com/users/floraphonic-38928062/) | 1,0 s | swipe curto e seco |
| `whoosh_whoosh-motion_dragon-studio_405445.mp3` | [Whoosh Motion](https://pixabay.com/sound-effects/film-special-effects-whoosh-motion-405445/) | [DRAGON-STUDIO](https://pixabay.com/users/dragon-studio-38165424/) | 1,0 s | whoosh mais grave |
| `ping_ping_dragon-studio_570438.mp3` | [Ping](https://pixabay.com/sound-effects/technology-ping-570438/) | DRAGON-STUDIO | 0,4 s | ping agudo de notificação de app |
| `ping_notification-sound_dragon-studio_372474.mp3` | [Notification Sound](https://pixabay.com/sound-effects/film-special-effects-notification-sound-372474/) | DRAGON-STUDIO | 2,1 s | ding brilhante de ~0,5 s, resto é silêncio |
| `tique-taque_clock-ticking-sound-effect_11325622_240503.mp3` | [Clock Ticking Sound Effect](https://pixabay.com/sound-effects/film-special-effects-clock-ticking-sound-effect-240503/) | 11325622 | 9,4 s | tique e taque alternados a cada ~0,46 s (casa com 128 a 130 BPM) |
| `tique-taque_ticking-clock_antumdeluge_88482.mp3` | [Ticking Clock](https://pixabay.com/sound-effects/film-special-effects-ticking-clock-88482/) | AntumDeluge, via [freesound_community](https://pixabay.com/users/freesound_community-46691455/) | 3,7 s | um tique por segundo, 4 batidas |
| `clique_mouse-click-sfx_dragon-studio_444806.mp3` | [Mouse Click SFX](https://pixabay.com/sound-effects/film-special-effects-mouse-click-sfx-444806/) | DRAGON-STUDIO | 0,8 s | clique de mouse (aperta e solta) |
| `clique_digital-click-3_ksjsbwuil_513897.mp3` | [Digital Click - 3](https://pixabay.com/sound-effects/technology-digital-click-3-513897/) | [ksjsbwuil](https://pixabay.com/users/ksjsbwuil-50402086/) | 0,5 s | tap digital único |
| `pop_ui-pop-up-1_floraphonic_197886.mp3` | [UI Pop Up 1](https://pixabay.com/sound-effects/film-special-effects-ui-pop-up-1-197886/) | floraphonic | 0,6 s | pop redondo, mais grave |
| `pop_ui-pop-sound_47313572_316482.mp3` | [UI Pop sound](https://pixabay.com/sound-effects/film-special-effects-ui-pop-sound-316482/) | 47313572 | 1,4 s | pop curto de interface |
| `riser_sharp-riser_creatorshome_327342.mp3` | [Sharp Riser](https://pixabay.com/sound-effects/film-special-effects-sharp-riser-327342/) | [CreatorsHome](https://pixabay.com/users/creatorshome-49707711/) | 1,9 s | riser agudo que termina no pico (encosta no corte) |
| `riser_reverse-crash_genocidalguitar_92231.mp3` | [reverse crash](https://pixabay.com/sound-effects/film-special-effects-reverse-crash-92231/) | genocidalguitar, via freesound_community | 3,1 s | prato invertido subindo até o fim |
| `riser_riser-hit-sfx-001_audiopapkin_289802.mp3` | [Riser Hit sfx 001](https://pixabay.com/sound-effects/film-special-effects-riser-hit-sfx-001-289802/) | [AudioPapkin](https://pixabay.com/users/audiopapkin-14728698/) | 4,5 s | sobe 1,7 s e bate grave; mais cinematográfico |
| `sucesso_bloom-complete_dragon-studio_570440.mp3` | [Bloom-Complete](https://pixabay.com/sound-effects/technology-bloom-complete-570440/) | DRAGON-STUDIO | 0,6 s | confirmação curta de app |
| `sucesso_correct_koiroylers_356013.mp3` | [Correct](https://pixabay.com/sound-effects/film-special-effects-correct-356013/) | [KoiRoylers](https://pixabay.com/users/koiroylers-44305058/) | 2,1 s | ding de acerto (marcado como IA) |
| `sucesso_chime-sound_jgreer_7143.mp3` | [Chime sound](https://pixabay.com/sound-effects/film-special-effects-chime-sound-7143/) | jgreer, via freesound_community | 1,6 s | sino de chimebar, brilhante |
| `sucesso_confirm-success02_miraclei_360154.mp3` | [sample_confirm_success02_kofi_by_miraclei](https://pixabay.com/sound-effects/film-special-effects-sample-confirm-success02-kofi-by-miraclei-360154/) | [miraclei](https://pixabay.com/users/miraclei-45186201/) | 1,6 s | chime de sucesso de app (marcado como IA) |
| `extra_cash-register-kaching_dragon-studio_376867.mp3` | [Cash Register Kaching](https://pixabay.com/sound-effects/film-special-effects-cash-register-kaching-376867/) | DRAGON-STUDIO | 1,1 s | caixa registradora |
| `extra_dropping-a-coin_dragon-studio_478359.mp3` | [Dropping a Coin](https://pixabay.com/sound-effects/film-special-effects-dropping-a-coin-478359/) | DRAGON-STUDIO | 0,8 s | moeda caindo |

Todos: Pixabay Content License, sem Content ID. A DRAGON-STUDIO escreve nas páginas que todo o material dela é livre pra uso comercial, sem pedir permissão. Alguns efeitos passam de 0 dBFS no decode (whoosh 186577, pop 197886, kaching, moeda): baixe uns 4 dB na mixagem.

## Imagens e renders 3D (`pixabay/imagens/`)

Nenhuma tem pessoa nem logo visível (conferi cada uma olhando a imagem). PNG = fundo transparente.

| Arquivo | O que é | Página | Autor | Tamanho |
|---|---|---|---|---|
| `celular_3d-inclinado-tela-vermelha_moh-habibie11_7626050.png` | celular 3D inclinado, tela vermelha lisa (fácil de trocar pela tela do app); desenho estilo iPhone X, sem logo | [link](https://pixabay.com/illustrations/smartphone-mobile-phone-cellphone-7626050/) | [moh_habibie11](https://pixabay.com/users/moh_habibie11-26332309/) | 1229 x 1280 PNG |
| `celular_moldura-tela-transparente_nofrickinname_5463818.png` | moldura de celular com a tela vazada, pra pôr a tela do app atrás; as tags da página citam "Samsung S10", mas a frente é genérica e sem logo | [link](https://pixabay.com/illustrations/mock-up-3d-mockup-cellphone-5463818/) | nofrickinname | 591 x 1280 PNG |
| `celular_pedestal-cena-branca_mediamodifier_5614794.jpg` | celular de tela branca num pedestal com formas abstratas brancas; o título da página diz "iPhone", não há logo | [link](https://pixabay.com/illustrations/iphone-3d-mockup-iphone-3d-mockup-5614794/) | [Mediamodifier](https://pixabay.com/users/mediamodifier-1567646/) | 1280 x 853 JPG |
| `celular_frontal-tela-branca-IA_thedigitalartist_8034914.jpg` | celular de frente, tela branca, fundo cinza (marcada como IA) | [link](https://pixabay.com/illustrations/smartphone-screen-gadget-technology-8034914/) | [TheDigitalArtist](https://pixabay.com/users/thedigitalartist-202249/) | 1280 x 958 JPG |
| `celular_pedestal-planta-sombras_thehalaldesign_7271367.jpg` | celular de tela branca num pedestal, planta e sombra de janela | [link](https://pixabay.com/illustrations/empty-white-smartphone-phone-blank-7271367/) | [thehalaldesign](https://pixabay.com/users/thehalaldesign-19718486/) | 1280 x 914 JPG |
| `celular_grade-de-celulares-fundo_mediamodifier_5519650.jpg` | grade de celulares na diagonal com telas em degradê rosa (serve de fundo) | [link](https://pixabay.com/illustrations/smartphone-cellphone-mobile-phone-5519650/) | Mediamodifier | 1280 x 853 JPG |
| `relogio_despertador-azul-3d_ramstudio_7562926.png` | despertador 3D azul, acabamento tipo clay | [link](https://pixabay.com/illustrations/time-minute-bell-morning-isolated-7562926/) | [RamStudio](https://pixabay.com/users/ramstudio-31021841/) | 1280 x 1280 PNG |
| `relogio_despertador-preto-3d_ninacliparts_6891905.png` | despertador 3D preto, minimalista | [link](https://pixabay.com/illustrations/watch-alarm-hour-time-minutes-6891905/) | [NinaCliparts](https://pixabay.com/users/ninacliparts-21564466/) | 974 x 1280 PNG |
| `papel_caixa-de-correio-com-carta-IA_alisakonell_8303593.png` | caixa de correio 3D com carta e bandeirinha (marcada como IA) | [link](https://pixabay.com/illustrations/ai-generated-mail-document-letter-8303593/) | [Alisakonell](https://pixabay.com/users/alisakonell-3238943/) | 1280 x 1280 PNG |
| `3d_cronometro_febrianes86_4272.png` | cronômetro amarelo (render do modelo 3D) | [link](https://pixabay.com/3d-models/stopwatch-clock-timer-running-time-4272/) | [febrianes86](https://pixabay.com/users/febrianes86-5873902/) | 720 x 720 PNG |
| `3d_moeda-ouro_blendertimer_4196.png` | moeda de ouro estilizada, sem símbolo | [link](https://pixabay.com/3d-models/coin-gold-money-currency-metal-4196/) | [BlenderTimer](https://pixabay.com/users/blendertimer-9538909/) | 720 x 720 PNG |
| `3d_despertador-vermelho_mohamed-hassan_2498.png` | despertador vermelho cartoon (bordas um pouco serrilhadas) | [link](https://pixabay.com/3d-models/alarm-clock-time-bell-morning-2498/) | [Mohamed_hassan](https://pixabay.com/users/mohamed_hassan-5229782/) | 720 x 720 PNG |
| `3d_moedas-crescendo_mastertux_1832.png` | pilhas de moedas em escada com seta verde subindo | [link](https://pixabay.com/3d-models/money-coins-finance-wealth-profit-1832/) | [MasterTux](https://pixabay.com/users/mastertux-470906/) | 720 x 720 PNG |
| `3d_checklist-ok_febrianes86_4271.png` | cubo azul com check dourado | [link](https://pixabay.com/3d-models/checklist-consent-paper-yes-note-4271/) | febrianes86 | 720 x 720 PNG |
| `3d_carimbo_febrianes86_4275.png` | carimbo vermelho | [link](https://pixabay.com/3d-models/stamp-logo-envelope-bureaucracy-4275/) | febrianes86 | 720 x 720 PNG |
| `3d_prancheta-papel_febrianes86_4276.png` | prancheta azul com papel amarelo | [link](https://pixabay.com/3d-models/paper-writing-write-texture-4276/) | febrianes86 | 720 x 720 PNG |
| `3d_pasta-verde_arunangshubanerjee_2074.png` | pasta de papelão verde | [link](https://pixabay.com/3d-models/cardboard-folder-green-folder-2074/) | [arunangshubanerjee](https://pixabay.com/users/arunangshubanerjee-29054022/) | 720 x 720 PNG |
| `3d_relogio-de-parede_jeremywoodsster_2603.png` | relógio de parede branco e cobre | [link](https://pixabay.com/3d-models/clock-time-timepiece-watch-2603/) | [jeremywoodsster](https://pixabay.com/users/jeremywoodsster-25048718/) | 720 x 720 PNG |
| `3d_carteira-IA_tiny-planet-friends-3d_3260.png` | carteira azul clara (marcada como IA) | [link](https://pixabay.com/3d-models/wallet-3d-design3d-glb-3d-model-3260/) | [Tiny_Planet_Friends_3D](https://pixabay.com/users/tiny_planet_friends_3d-52823822/) | 720 x 720 PNG |
| `3d_balao-de-mensagem_febrianes86_4263.png` | balão de mensagem vermelho; o título da página cita WhatsApp, mas o objeto é só o balão, sem logo | [link](https://pixabay.com/3d-models/talk-whatsapp-phone-blah-message-4263/) | febrianes86 | 720 x 720 PNG |
| `giro-3d_cronometro_febrianes86_4272/a000.png` a `a340.png` | 18 quadros do cronômetro girando 360° (passo de 20°) | mesma do cronômetro | febrianes86 | 18 x 720 PNG |
| `giro-3d_moeda-ouro_blendertimer_4196/a000.png` a `a340.png` | 18 quadros da moeda girando 360° | mesma da moeda | BlenderTimer | 18 x 720 PNG |

Os dois "giros" funcionam como sprite de rotação 3D de verdade (a 30 fps, segurando 1 quadro cada, a volta inteira leva 0,6 s; segurando 2, leva 1,2 s). Os renders de 720 px aguentam elemento de até meia tela num vídeo 1080 x 1920.

**Calendário 3D:** não achei nada bom no Pixabay. Só ícones planos, calendários com o ano 2023 estampado e um "calendar" que na verdade é uma caneta. Ficou de fora.

## Modelos 3D (GLB) que valem baixar à mão

O GLB sai pelo botão Download de cada página (formato GLB, mesma licença). Não consegui baixar por aqui pelos motivos do item 5 acima.

| Objeto | Página | Autor | Observação |
|---|---|---|---|
| Celular na mão (animado) | https://pixabay.com/3d-models/smartphone-phone-mobile-2355/ | Mohamed_hassan | tela ciano lisa (fácil de trocar); mão low-poly, serrilhado nos renders |
| Celular simples | https://pixabay.com/3d-models/smartphone-phone-mobile-5075/ | Jerryblessed | marcado como IA, sem textura |
| Smartwatch | https://pixabay.com/3d-models/fitness-smartwatch-watch-time-4939/ | Jerryblessed | o único smartwatch 3D do Pixabay; modelo cru, marcado como IA |
| Cronômetro | https://pixabay.com/3d-models/stopwatch-clock-timer-running-time-4272/ | febrianes86 | 21 mil vértices |
| Moeda de ouro | https://pixabay.com/3d-models/coin-gold-money-currency-metal-4196/ | BlenderTimer | 262 vértices, leve |
| Despertador | https://pixabay.com/3d-models/alarm-clock-time-bell-morning-2498/ | Mohamed_hassan | 190 mil vértices |
| Moedas crescendo | https://pixabay.com/3d-models/money-coins-finance-wealth-profit-1832/ | MasterTux | 108 mil vértices |
| Carimbo | https://pixabay.com/3d-models/stamp-logo-envelope-bureaucracy-4275/ | febrianes86 | |
| Checklist | https://pixabay.com/3d-models/checklist-consent-paper-yes-note-4271/ | febrianes86 | |
| Papel e prancheta | https://pixabay.com/3d-models/paper-writing-write-texture-4276/ | febrianes86 | |
| Folha em branco | https://pixabay.com/3d-models/paper-white-sheet-blank-document-564/ | Plaggy_CC0 | |
| Despertador dourado | https://pixabay.com/3d-models/alarm-clock-clock-time-alarm-watch-435/ | DEZYNE_3D | |

## O que ficou de fora, e por quê

**Música com Content ID** (o motivo mais comum): Ramadan Music de JonasBlakewood (533859, versão de 29 s), This Nu Disco e Disco Sunny Beat de 9JackJack8 (277763, 345209), Catchy Electro Pop de SZAudio (319007), Upbeat Happy Indie Pop de Vivaleum (186815), Trendy Fashion Energetic Groove, Happy Upbeat Funk Background e Electro Sport de ABSounds (377639, 398493, 377635), Joyful Rhythm Walk Funk de LightBeatsMusic (513936), Chill House de LMNT_Studio (419916), Pop Rhythm de The_Mountain (139501), Summer Pop e Upbeat de NastelBom (371361, 501716), Festival Party Dance de Monume (519254), Dance Club de MondaMusic (560141; pena, tinha drop aos 16 s), House Background Music de APALONBeats (549535), Pop Fun Summer Background Music de ikoliks_aj (392218), Dance Tonight de MS2Company (387576), Funk Over de MomotMusic (402164), Cool Cat de PlayHouseSound (287388), Dreamy Electronic Beat de Tunetank (348969), Upbeat Waves of ocean de JoyInSound (495981), Inspiring Upbeat No Copyright Music de AudioCoffee (389283, ainda pede crédito), No Copyright Music Upbeat Fun de lNPLUSMUSIC (329743), Summer Afro Tropical Instrumental de OiBeats (263946, ainda pede compra de licença pra uso comercial), Groovy Vibe de Bransboynd (427121, também tem voz).

**Outros motivos na música:** Fresh Decision e Harmonic Shift de Diamond_Tunes (357844, 334081): sem selo, mas o autor pede e-mail pra "whitelist" em uso comercial, sinal de que reivindica. Bright Side de alanajordan (476263): tem voz. afrobeat music de PoorKidMusic (386534): ~90 BPM, fora da faixa. Faixas de future bass e afins (514142, 524192, 141081): fora de 100 a 128 BPM. Sandy Vibe 24 s de maksym_dudchyk (471386) e Disco de alivetunes (581218): removidas do Pixabay (página 404). Beach house Music de RibhavAgrawal (383607): limpa, 128 BPM, IA, ficou de reserva por repetir a Party Dance.

**Efeitos:** digital-ui-click-3 (190280) e celestial-chime (143163): arquivo não existe mais no CDN (HTTP 403). light-success (186802) e level-up (388192): na verdade são músicas de 2 a 3 minutos. Clock ticking ambience de alex_jauk (202980): não é um tique-taque. Neon riser (570431): 0,8 s, curto demais pra riser.

**Imagens:** fotos de Apple Watch e AirPods (iEsrcharger, 5541662 e similares) e relógios com mostrador de marca (4924136): marca de terceiros. Notas de dólar e moeda com cifrão (7148797, 7148806, modelo 3806): leitura de dólar. Calendários "2023" (7678880 e similares): ano errado. Celular de tela verde de walidwilliam4 (6881892): o aparelho ocupa pouco do quadro em 1280 px. "Calculadoras" 3D de febrianes86 (4264 a 4267): são só símbolos matemáticos. Smartwatch 3D (4939) e celular na mão (2355): renders crus (estão na tabela de GLB só como opção).
