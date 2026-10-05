# Fontes e licenças do kit de motion

> **Arquivo gerado: não edite à mão.** Ele sai dos catálogos do kit (`KIT/catalogos/`). Pra atualizar depois de mudar um catálogo, rode no Git Bash, com `PY` e `KIT` como no README: `"$PY" -B "$KIT/catalogos/gera_fontes.py" --saida "$KIT/FONTES.md"`.

Gerado por `KIT/catalogos/gera_fontes.py` em 05/10/2026 15:20, a partir dos catálogos mesclados (base, aquisições e sobreposições).

Regra do crédito: na legenda do post vai só o texto de `licenca.creditoLegenda` (sem marca nenhuma). O texto da fonte (`licenca.credito`) fica só no catálogo e nunca vai pra legenda.

Regra do status: `aceito-com-risco` só vale com `decisaoRisco` (quem decidiu, quando e em que peça vale); decisão pendente do Pedro deixa o item fora do padrão (o kit recusa). Trilha sem verificação nunca entra.

## Textos de legenda prontos

- Reel da guia (14/10), celular e relógio: **Modelos 3D: celular por polyman Studio e relógio por alboxer2000_ (Sketchfab, CC BY 4.0), modificados**
- `glb-celular-iphone15-limpo`, se aparecer sozinho: Modelos 3D: celular por polyman Studio (Sketchfab, CC BY 4.0), modificado
- `glb-smartwatch-ultra-limpo`, se aparecer sozinho: Modelos 3D: relógio por alboxer2000_ (Sketchfab, CC BY 4.0), modificado
- `glb-relogio-analogico-chronograph`, se aparecer sozinho: Modelos 3D: relógio analógico por Eric Chadwick e Darmstadt Graphics Group, a partir de modelo de graphiccompressor (Khronos glTF Sample Assets, CC BY 4.0), modificado
- `glb-calendario-mesa`, se aparecer sozinho: Modelos 3D: 'Calendar' por Tomáš Bayer (Poly Pizza, CC BY 3.0), modificado
- `glb-calendario-parede`, se aparecer sozinho: Modelos 3D: 'Calendar' por jeremy (Poly Pizza, CC BY 3.0), modificado
- `glb-papel-pilha-documento`, se aparecer sozinho: Modelos 3D: 'Small Stack of Paper' por Jarlan Perez (Poly Pizza, CC BY 3.0), modificado
- `glb-sino-mesa`, se aparecer sozinho: Modelos 3D: 'Desk Bell' por Jarlan Perez (Poly Pizza, CC BY 3.0), modificado
- `glb-ampulheta`, se aparecer sozinho: Modelos 3D: 'Hour Glass' por Kodie Russell (Sketchfab, CC BY 4.0), modificado
- `glb-telefone-disco`, se aparecer sozinho: Modelos 3D: 'Slightly used telephone' por pan.stasian (Sketchfab, CC BY 4.0), modificado
- `glb-pastas-az`, se aparecer sozinho: Modelos 3D: 'Several Folders' por janexx (Sketchfab, CC BY 4.0), modificado
- `glb-pote-vidro`, se aparecer sozinho: Modelos 3D: 'Glass Jar' por Jarlan Perez (Poly Pizza, CC BY 3.0), modificado

Pra juntar vários modelos na mesma peça: `python -B KIT/catalogos/catalogo.py creditos <id> <id> ...` (agrupa por fonte e licença, na ordem da cena, e fecha com ', modificado' ou ', modificados').

Sem texto pronto, fora do padrão até o Pedro decidir (o crédito exigido pela licença cita marca): `glb-carimbo`, `glb-cofrinho`, `glb-carteira`.

## Trilhas

### Liberadas (2)

| id | título | autor | licença | link | crédito | janela medida |
|---|---|---|---|---|---|---|
| mixkit-04-house-one | House One | Francisco Alvear | Mixkit Stock Music Free License | https://mixkit.co/free-stock-music/chillout/ | não obrigatório | mStart 51.711, ponto volta-62.011, ganho -6.7 dB |
| mixkit-05-lets-move | Let's Move | Michael Ramir C. | Mixkit Stock Music Free License | https://mixkit.co/free-stock-music/house/ | não obrigatório | mStart 5.735, ponto entrada-16.035, ganho -8.1 dB |

### Aceitas com risco (1)

Só valem nas peças da decisão (o kit recusa em outra peça; texto na cena não libera).

- `mixkit-01-talent-in-the-air` (Talent in the Air, Mixkit Stock Music Free License): Pedro, 02/10/2026: trilha da V2 escolhida mesmo relançada por terceiro com ISRC próprio; só na peça de 14/10 (vale em guia-pronta-2026-10-14). Usos: guia-pronta-2026-10-14 v2, guia-pronta-2026-10-14 v4.
  Antes de postar: subir o vídeo não listado no YouTube e guardar print da licença e do card com a data.

### Sem verificação (11): dependem da AudD, não entram em peça

| id | título | autor | licença | link | crédito sugerido |
|---|---|---|---|---|---|
| pixabay-03-summer-fashion | Summer Fashion (Chill Cool House), Loopable Edit | Musinova | Pixabay Content License | https://pixabay.com/music/funk-summer-fashion-chill-cool-house-loopable-edit-319147/ | por Musinova via Pixabay |
| pixabay-04-party-dance | Party Dance | SOULFULJAMTRACKS | Pixabay Content License | https://pixabay.com/music/electronic-party-dance-503270/ | por SOULFULJAMTRACKS via Pixabay |
| pixabay-05-afterglow | Afro House / Afterglow | TurtleBeats | Pixabay Content License | https://pixabay.com/music/upbeat-afro-house-afterglow-282227/ | por TurtleBeats via Pixabay |
| pixabay-06-turbo-funk-machine | Groove Free YouTube: Turbo Funk Machine | DPStudioMusic | Pixabay Content License | https://pixabay.com/music/funk-groove-free-youtube-turbo-funk-machine-392486/ | por DPStudioMusic via Pixabay |
| pixabay-02-space-dance | SPACE DANCE (Elektro Synth Pop) | Darkmoon_Art (Dorothe Wouters) | Pixabay Content License | https://pixabay.com/music/build-up-scenes-space-dance-elektro-synth-pop-335254/ | por Darkmoon_Art via Pixabay |
| pixabay-01-match-out | Match Out (Free Afro Amapiano Instrumental) | artbybigvee | Pixabay Content License | https://pixabay.com/music/afrobeat-match-out-free-afro-amapiano-instrumental-178406/ | por artbybigvee via Pixabay |
| mixkit-684-classical-vibes-4 | Classical vibes 4 | Grigoriy Nuzhny | Mixkit Stock Music Free License | https://mixkit.co/free-stock-music/tag/documentary/ | não obrigatório |
| mixkit-724-placeit-world-01 | PlaceIt World 01 | Lily J | Mixkit Stock Music Free License | https://mixkit.co/free-stock-music/mood/tension/ | não obrigatório |
| mixkit-764-lo-fi-02 | Lo-Fi 02 | Lily J | Mixkit Stock Music Free License | https://mixkit.co/free-stock-music/discover/lo-fi/ | não obrigatório |
| mixkit-621-bridge-n-98 | BRIDGE N° 98 | Eugenio Mininni | Mixkit Stock Music Free License | https://mixkit.co/free-stock-music/instrument/acoustic-guitar/ | não obrigatório |
| mixkit-641-brazil-jazz | Brazil Jazz | Francisco Alvear | Mixkit Stock Music Free License | https://mixkit.co/free-stock-music/world/ | não obrigatório |

Só viram liberado com 2 recortes limpos na AudD; correspondência com terceiro reprova.

### Reprovadas (10)

- `mixkit-02-be-happy` (Be Happy, Mixkit): relançada como 'Happy Alecrim' de 'Paschoal Dun', 11/04/2021, ISRC QZGLS2191784, no ar no Spotify (mesma gravação: correlação de 0,87 a 0,94).
- `mixkit-03-smooth-grooves` (Smooth Grooves, Mixkit): relançada como 'Challenge' de 'Jackey Mishra', 26/02/2022, ISRC QZLQR2180796 (saiu do Deezer, status desconhecido).
- `mixkit-06-funky-triplets` (Funky Triplets, Mixkit): relançada como 'Groove Day' de 'Musiklinik', 21/03/2024, ISRC SGW502403816, no ar em lojas de streaming (correlação 0,98 a 0,99).

Epidemic Sound, 7 faixas: reprovadas por decisão do Pedro em 02/10/2026 (plano gratuito; não cobre conteúdo de marca). Não entram em peça.

- `epidemic-glorious`: Glorious (Instrumental Version), Adelyn Paik
- `epidemic-brand-new-beginning`: Brand New Beginning, Öman
- `epidemic-palmy-sway`: Palmy Sway, G Mills
- `epidemic-a-step-ahead`: A Step Ahead, Experia
- `epidemic-light-years`: Light Years, Out To The World
- `epidemic-spacesuit-suite`: Spacesuit Suite, Stationary Sign
- `epidemic-fable`: Fable, Jakob Ahlbom

Finais já entregues com trilha da Epidemic ou com indício dela (7): trocar o som antes de postar (ou, na vinheta, usar muda); decisão do Pedro pendente.

- `C:/MKT-INSTA/Content Legalizai/marketing/final/2026-10-01 Abertura do mês (stories)/ABERTURA-MES-leo.mp4` (Brand New Beginning)
- `C:/MKT-INSTA/Content Legalizai/marketing/final/2026-10-01 Abertura do mês (stories)/ABERTURA-MES-motion.mp4` (Brand New Beginning)
- `C:/MKT-INSTA/Content Legalizai/marketing/final/2026-10-02 3 sinais de que você já pode cobrar mais caro/LEO-precificacao-v2.mp4` (Palmy Sway)
- `C:/MKT-INSTA/Content Legalizai/marketing/final/2026-10-02 3 sinais de que você já pode cobrar mais caro/MOTION-precificacao.mp4` (Palmy Sway)
- `C:/MKT-INSTA/Content Legalizai/marketing/final/2026-10-02 3 sinais de que você já pode cobrar mais caro/BROLL-precificacao.mp4` (Palmy Sway)
- `C:/MKT-INSTA/Content Legalizai/marketing/final/Vinheta O Check/vinheta-16x9-piloto-v7.mp4` (som com indícios de Epidemic, origem não confirmada: `vinheta-o-check-16x9`)
- `C:/MKT-INSTA/Content Legalizai/marketing/final/Vinheta O Check/vinheta-9x16-4k60-v2.mp4` (som com indícios de Epidemic, origem não confirmada: `vinheta-o-check-9x16`)

### Prévias de audição (7)

Só pra escolher de ouvido: têm a narração da peça de 14/10 e nunca vão como trilha de cena (o kit recusa prévia em trilha.id; o `kit.py trilhas` lista só o tipo trilha).

| id | trilha de origem | status | decisão de risco |
|---|---|---|---|
| previa-mixkit-04-house-one | mixkit-04-house-one | liberado | - |
| previa-mixkit-05-lets-move | mixkit-05-lets-move | liberado | - |
| previa-mixkit-01-janela-B | mixkit-01-talent-in-the-air | aceito-com-risco | Pedro, 02/10/2026; vale em guia-pronta-2026-10-14 |
| previa-mixkit-01-janela-A | mixkit-01-talent-in-the-air | aceito-com-risco | Pedro, 02/10/2026; vale em guia-pronta-2026-10-14 |
| previa-mixkit-02-be-happy | mixkit-02-be-happy | reprovado | - |
| previa-mixkit-03-smooth-grooves | mixkit-03-smooth-grooves | reprovado | - |
| previa-mixkit-06-funky-triplets | mixkit-06-funky-triplets | reprovado | - |

## Efeitos

### Arquivos (60)

| id | categoria | status | licença | link | crédito | duplicata de |
|---|---|---|---|---|---|---|
| mixkit-2568 | clique | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/click/ | não obrigatório (autor: Mixkit) | - |
| mixkit-3124 | clique | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/click/ | não obrigatório (autor: Mixkit) | - |
| mixkit-1490 | whoosh | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/whoosh/ | não obrigatório (autor: Mixkit) | - |
| mixkit-1493 | whoosh | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/whoosh/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2867 | verificado | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/notification/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2870 | verificado | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/notification/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2568-copia | clique | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/click/ | não obrigatório (autor: Mixkit) | mixkit-2568 |
| mixkit-2867-copia | verificado | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/notification/ | não obrigatório (autor: Mixkit) | mixkit-2867 |
| mixkit-166 | whoosh | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/swoosh/ | não obrigatório (autor: Mixkit) | - |
| mixkit-3115 | whoosh | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/swoosh/ | não obrigatório (autor: Mixkit) | - |
| mixkit-1109 | clique | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/click/ | não obrigatório (autor: Mixkit) | - |
| mixkit-1897 | impacto | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/soft/ | não obrigatório (autor: Mixkit) | - |
| pixabay-405445 | whoosh | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-whoosh-motion-405445/ | opcional: DRAGON-STUDIO via Pixabay | - |
| pixabay-186577 | whoosh | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-movement-swipe-whoosh-3-186577/ | opcional: floraphonic via Pixabay | - |
| pixabay-118248 | whoosh | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-fast-whoosh-118248/ | opcional: StudioKolomna via Pixabay | - |
| pixabay-570438 | notificacao | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/technology-ping-570438/ | opcional: DRAGON-STUDIO via Pixabay | - |
| pixabay-372474 | notificacao | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-notification-sound-372474/ | opcional: DRAGON-STUDIO via Pixabay | - |
| pixabay-240503 | tique | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-clock-ticking-sound-effect-240503/ | opcional: usuário 11325622 via Pixabay | - |
| pixabay-88482 | tique | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-ticking-clock-88482/ | opcional: AntumDeluge via freesound_community (Pixabay) | - |
| pixabay-444806 | clique | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-mouse-click-sfx-444806/ | opcional: DRAGON-STUDIO via Pixabay | - |
| pixabay-513897 | clique | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/technology-digital-click-3-513897/ | opcional: ksjsbwuil via Pixabay | - |
| pixabay-197886 | pop | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-ui-pop-up-1-197886/ | opcional: floraphonic via Pixabay | - |
| pixabay-316482 | pop | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-ui-pop-sound-316482/ | opcional: usuário 47313572 via Pixabay | - |
| pixabay-327342 | riser | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-sharp-riser-327342/ | opcional: CreatorsHome via Pixabay | - |
| pixabay-92231 | riser | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-reverse-crash-92231/ | opcional: genocidalguitar via freesound_community (Pixabay) | - |
| pixabay-289802 | riser | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-riser-hit-sfx-001-289802/ | opcional: AudioPapkin via Pixabay | - |
| pixabay-570440 | sucesso | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/technology-bloom-complete-570440/ | opcional: DRAGON-STUDIO via Pixabay | - |
| pixabay-356013 | sucesso | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-correct-356013/ | opcional: KoiRoylers via Pixabay | - |
| pixabay-7143 | sino | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-chime-sound-7143/ | opcional: jgreer via freesound_community (Pixabay) | - |
| pixabay-360154 | sucesso | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-sample-confirm-success02-kofi-by-miraclei-360154/ | opcional: miraclei via Pixabay | - |
| pixabay-376867 | extra | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-cash-register-kaching-376867/ | opcional: DRAGON-STUDIO via Pixabay | - |
| pixabay-478359 | extra | sem-verificacao | Pixabay Content License | https://pixabay.com/sound-effects/film-special-effects-dropping-a-coin-478359/ | opcional: DRAGON-STUDIO via Pixabay | - |
| mixkit-2577 | toque | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/interface/ | não obrigatório (autor: Mixkit) | - |
| mixkit-1120 | toque | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/click/ | não obrigatório (autor: Mixkit) | - |
| mixkit-1124 | toque | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/click/ | não obrigatório (autor: Mixkit) | - |
| mixkit-1117 | toque | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/click/ | não obrigatório (autor: Mixkit) | - |
| mixkit-1393 | digitacao | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/type/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2539 | apagar | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/type/ | não obrigatório (autor: Mixkit) | - |
| mixkit-1530 | papel-deslizando | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/paper/ | não obrigatório (autor: Mixkit) | - |
| mixkit-1105 | papel-virando | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/paper/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2996 | papel-amassando | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/paper/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2383 | impressora | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/paper/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2384 | envelope | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/paper/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2995 | carimbo | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/click/ | não obrigatório (autor: Mixkit) | - |
| mixkit-766 | notificacao | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/chimes/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2866 | notificacao | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/notification/ | não obrigatório (autor: Mixkit) | - |
| mixkit-3005 | swoosh | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/thud/ | não obrigatório (autor: Mixkit) | - |
| mixkit-1461 | swoosh | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/swoosh/ | não obrigatório (autor: Mixkit) | - |
| mixkit-490 | impacto | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/boom/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2150 | impacto | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/impact/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2569 | erro | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/interface/ | não obrigatório (autor: Mixkit) | - |
| mixkit-1110 | erro | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/interface/ | não obrigatório (autor: Mixkit) | - |
| mixkit-1133 | obturador | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/camera/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2368 | caneta | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/write/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2582 | toggle | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/click/ | não obrigatório (autor: Mixkit) | - |
| mixkit-2641 | rolagem | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/spin/ | não obrigatório (autor: Mixkit) | - |
| mixkit-916 | bipe | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/countdown/ | não obrigatório (autor: Mixkit) | - |
| mixkit-576 | riser | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/cymbal/ | não obrigatório (autor: Mixkit) | - |
| mixkit-365 | ambiente | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/restaurant/ | não obrigatório (autor: Mixkit) | - |
| mixkit-3199 | ambiente | liberado | Mixkit Sound Effects Free License | https://mixkit.co/free-sound-effects/discover/room/ | não obrigatório (autor: Mixkit) | - |

### Sintetizados (19): código próprio, sem licença de terceiro, sem crédito

| id | status | módulo | função |
|---|---|---|---|
| sint-s_pop | liberado | sfx.py | s_pop |
| sint-s_bubble | liberado | sfx.py | s_bubble |
| sint-s_tick | liberado | sfx.py | s_tick |
| sint-s_chime | liberado | sfx.py | s_chime |
| sint-s_check | liberado | sfx.py | s_check |
| sint-s_whoosh | liberado | sfx.py | s_whoosh |
| sint-s_riser | liberado | sfx.py | s_riser |
| sint-s_thump | liberado | sfx.py | s_thump |
| sint-s_roll | liberado | sfx.py | s_roll |
| sint-s_burst | liberado | sfx.py | s_burst |
| sint-s_ring | liberado | sfx.py | s_ring |
| sint-s_clack | liberado | sfx.py | s_clack |
| sint-s_swish | liberado | sfx.py | s_swish |
| sint-s_papel | liberado | sfx_kit.py | s_papel |
| sint-s_vibra | liberado | sfx_kit.py | s_vibra |
| sint-s_brilho | liberado | sfx_kit.py | s_brilho |
| sint-s_conta | liberado | sfx_kit.py | s_conta |
| sint-s_processa | liberado | sfx_kit.py | s_processa |
| sint-s_assinatura | liberado | sfx_kit.py | s_assinatura |

### Receitas (7)

| id | status | arquivo | nota |
|---|---|---|---|
| truque-1490-invertido | liberado | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14/mix_guia.py | - |
| truque-2867-semitom | liberado | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14/mix_guia.py | - |
| truque-whoosh-sintetizado-invertido | liberado | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14/mix_guia.py | - |
| truque-receitas-de-transicao | liberado | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/src/mix_inst.py | - |
| receita-mix-guia | liberado | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14/mix_guia.py | - |
| receita-mix-precificacao | reprovado | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/src/mix2.py | a trilha desta receita é a Palmy Sway (G Mills, Epidemic), reprovada em 02/10 (plano gratuito do Pedro, não cobre conteúdo de marca), e os 3 finais do '3 sinais' usam ela; a cadeia de mix (abaixamento, fades e loudnorm) pode ser reaproveitada com trilha liberada, a trilha não |
| truque-2995-clique-forte | liberado | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/kit/ext/comum/batidas.ts | - |

## Modelos 3D (61)

Entram numa peça: 46 sim, 4 com aviso (aceitos com risco fora das peças da decisão: confirmar com o Pedro antes de postar) e 11 não (.blend, cena inteira, reprovado ou decisão pendente do Pedro). O GLB da biblioteca entra no public-kit por hardlink só quando a peça usa (`3d/biblioteca/<id>.glb`, pelo `kit.py modelos`, `props`, `stills` e `render`); o celular e o relógio do guia ficam fixos. Prova de render de cada um: `KIT/provas/modelos/render/lote-*.jpg` (campo `provaRender` do catálogo).

| id | tipo | status | licença | link | crédito na legenda | decisão de risco | entra no render |
|---|---|---|---|---|---|---|---|
| glb-celular-iphone15-limpo | glb | aceito-com-risco | CC BY 4.0 | https://sketchfab.com/models/df17520841214c1792fb8a44c6783ee7 | celular por polyman Studio (Sketchfab, CC BY 4.0) | orquestrador do kit (DESENHO, revisão 2), 02/10/2026; vale em guia-pronta-2026-10-14; decisão de agente, provisória: em peça nova, confirmar com o Pedro | com aviso (3d/biblioteca/glb-celular-iphone15-limpo.glb; sHeroi 1,003) |
| glb-video-iphone | glb | aceito-com-risco | CC BY 4.0 | https://sketchfab.com/models/df17520841214c1792fb8a44c6783ee7 | celular por polyman Studio (Sketchfab, CC BY 4.0) | orquestrador do kit (DESENHO, revisão 2), 02/10/2026; vale em guia-pronta-2026-10-14; decisão de agente, provisória: em peça nova, confirmar com o Pedro | com aviso (3d/iphone.glb) |
| glb-smartwatch-ultra-limpo | glb | aceito-com-risco | CC BY 4.0 | https://sketchfab.com/models/4656191de2e94767a8c16003fca1f268 | relógio por alboxer2000_ (Sketchfab, CC BY 4.0) | orquestrador do kit (DESENHO, revisão 2), 02/10/2026; vale em guia-pronta-2026-10-14; decisão de agente, provisória: em peça nova, confirmar com o Pedro | com aviso (3d/biblioteca/glb-smartwatch-ultra-limpo.glb; sHeroi 2,058) |
| glb-video-watch | glb | aceito-com-risco | CC BY 4.0 | https://sketchfab.com/models/4656191de2e94767a8c16003fca1f268 | relógio por alboxer2000_ (Sketchfab, CC BY 4.0) | orquestrador do kit (DESENHO, revisão 2), 02/10/2026; vale em guia-pronta-2026-10-14; decisão de agente, provisória: em peça nova, confirmar com o Pedro | com aviso (3d/watch.glb) |
| glb-relogio-analogico-chronograph | glb | aceito-com-risco | CC BY 4.0 | https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ChronographWatch | relógio analógico por Eric Chadwick e Darmstadt Graphics Group, a partir de modelo de graphiccompressor (Khronos glTF Sample Assets, CC BY 4.0) | pendente (Pedro): fora do padrão | não: fora do padrão até o Pedro decidir |
| glb-relogio-digital | glb | aceito-com-risco | CC0 | https://polyhaven.com/a/digital_wrist_watch | dispensa | pendente (Pedro): fora do padrão | não: fora do padrão até o Pedro decidir |
| glb-relogio-parede | glb | liberado | CC0 | https://polyhaven.com/a/wall_clock | dispensa | - | sim (3d/biblioteca/glb-relogio-parede.glb; sHeroi 0,499) |
| glb-despertador | glb | liberado | CC0 | https://polyhaven.com/a/alarm_clock_01 | dispensa | - | sim (3d/biblioteca/glb-despertador.glb; sHeroi 0,919) |
| glb-prancheta | glb | liberado | CC0 | https://polyhaven.com/a/clipboard | dispensa | - | sim (3d/biblioteca/glb-prancheta.glb; sHeroi 0,475) |
| glb-blocos-papel | glb | liberado | CC0 | https://polyhaven.com/a/office_notepads | dispensa | - | sim (3d/biblioteca/glb-blocos-papel.glb; sHeroi 0,145) |
| glb-calendario-mesa | glb | liberado | CC BY 3.0 | https://poly.pizza/m/8GqQAqxi3qk | 'Calendar' por Tomáš Bayer (Poly Pizza, CC BY 3.0) | - | sim (3d/biblioteca/glb-calendario-mesa.glb; sHeroi 0,8) |
| glb-calendario-parede | glb | liberado | CC BY 3.0 | https://poly.pizza/m/2yHE0n1ahjp | 'Calendar' por jeremy (Poly Pizza, CC BY 3.0) | - | sim (3d/biblioteca/glb-calendario-parede.glb; sHeroi 0,282) |
| glb-carimbo | glb | aceito-com-risco | CC BY 3.0 | https://poly.pizza/m/3RdawRyAWKx | fora do padrão: o crédito exigido cita marca (decisão do Pedro pendente) | pendente (Pedro): fora do padrão | não: fora do padrão até o Pedro decidir |
| glb-moeda | glb | liberado | CC0 | https://poly.pizza/m/7IrL01B97W | dispensa | - | sim (3d/biblioteca/glb-moeda.glb; sHeroi 5,862) |
| glb-moedas-pilhas | glb | liberado | CC0 | https://poly.pizza/m/VaGFKE0n0F | dispensa | - | sim (3d/biblioteca/glb-moedas-pilhas.glb; sHeroi 2,518) |
| glb-cofrinho | glb | aceito-com-risco | CC BY 3.0 | https://poly.pizza/m/dpvS2kdW6I9 | fora do padrão: o crédito exigido cita marca (decisão do Pedro pendente) | pendente (Pedro): fora do padrão | não: fora do padrão até o Pedro decidir |
| glb-papel-pilha-documento | glb | liberado | CC BY 3.0 | https://poly.pizza/m/aiBozYlPe-- | 'Small Stack of Paper' por Jarlan Perez (Poly Pizza, CC BY 3.0) | - | sim (3d/biblioteca/glb-papel-pilha-documento.glb; sHeroi 0,533) |
| glb-papel-folhas | glb | liberado | CC0 | https://poly.pizza/m/4qDtAbPYnT | dispensa | - | sim (3d/biblioteca/glb-papel-folhas.glb; sHeroi 0,544) |
| glb-pasta-animada | glb | liberado | CC0 | https://poly.pizza/m/emdPCRNhTX | dispensa | - | sim (3d/biblioteca/glb-pasta-animada.glb; sHeroi 0,497) |
| glb-envelope-fechado-selo | glb | liberado | CC0 | https://poly.pizza/m/BJS8VvgPkQ | dispensa | - | sim (3d/biblioteca/glb-envelope-fechado-selo.glb; sHeroi 1,0) |
| glb-envelope-aberto | glb | liberado | CC0 | https://poly.pizza/m/M9mVmRXHif | dispensa | - | sim (3d/biblioteca/glb-envelope-aberto.glb; sHeroi 0,805) |
| glb-sino-notificacao | glb | liberado | CC0 | https://poly.pizza/m/cILuaO115Y | dispensa | - | sim (3d/biblioteca/glb-sino-notificacao.glb; sHeroi 1,56) |
| glb-sino-mesa | glb | liberado | CC BY 3.0 | https://poly.pizza/m/1BXI7wJyaG8 | 'Desk Bell' por Jarlan Perez (Poly Pizza, CC BY 3.0) | - | sim (3d/biblioteca/glb-sino-mesa.glb; sHeroi 1,881) |
| proc-calendario-clay-img2threejs | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/abertura/3d/createClayCalendarModel.ts | dispensa | - | sim (procedural: calendario-clay) |
| proc-cena-guia | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/guia/ | dispensa | - | não: sem bloco render (cena inteira ou objeto sem ligação ao render) |
| blend-suricato-rigged | blend | sem-verificacao | não documentada (malha gerada no Tripo) | C:/MKT-INSTA/Content Legalizai/marketing/3d/mascote/suricato-rigged.blend | não verificado | - | não: arquivo .blend |
| blend-iphone17-preparado | blend | reprovado | BlenderKit, não conferida | C:/MKT-INSTA/Content Legalizai/marketing/3d/celulares/iphone-b-preparado.blend | não verificado | - | não: arquivo .blend |
| blend-untitled-iphone17 | blend | reprovado | BlenderKit, não conferida | C:/MKT-INSTA/Content Legalizai/marketing/3d/modelo-3d/Untitled.blend | não verificado | - | não: arquivo .blend |
| blend-simbolo-vinheta | blend | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/3d/simbolo/simbolo-9x16.blend | dispensa | - | não: arquivo .blend |
| proc-folha-das | procedural | liberado | próprio | - | dispensa | - | sim (procedural: folha) |
| proc-pilula-dia20 | procedural | liberado | próprio | - | dispensa | - | sim (procedural: pilula) |
| proc-comprovante | procedural | liberado | próprio | - | dispensa | - | sim (procedural: comprovante) |
| glb-despertador-detalhado | glb | liberado | CC0 | https://polyhaven.com/a/alarm_clock_01 | dispensa | - | sim (3d/biblioteca/glb-despertador-detalhado.glb; sHeroi 0,9187) |
| glb-ampulheta | glb | liberado | CC BY 4.0 | https://sketchfab.com/3d-models/cb0e7bf9c2c34681a1c46510298eca2e | 'Hour Glass' por Kodie Russell (Sketchfab, CC BY 4.0) | - | sim (3d/biblioteca/glb-ampulheta.glb; sHeroi 0,8889) |
| glb-telefone-disco | glb | liberado | CC BY 4.0 | https://sketchfab.com/3d-models/c0ec549c914545a8bb29620b70491afd | 'Slightly used telephone' por pan.stasian (Sketchfab, CC BY 4.0) | - | sim (3d/biblioteca/glb-telefone-disco.glb; sHeroi 0,4923) |
| glb-pastas-az | glb | liberado | CC BY 4.0 | https://sketchfab.com/3d-models/1a493b49ef954985ab8057ca66c387d5 | 'Several Folders' por janexx (Sketchfab, CC BY 4.0) | - | sim (3d/biblioteca/glb-pastas-az.glb; sHeroi 0,4579) |
| glb-carimbo-detalhado | glb | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d/carimbo-detalhado_higgsfield_legalizai.glb | dispensa | - | sim (3d/biblioteca/glb-carimbo-detalhado.glb; sHeroi 1,8824) |
| glb-dispensador-senha | glb | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d/dispensador-senha_higgsfield_legalizai.glb | dispensa | - | sim (3d/biblioteca/glb-dispensador-senha.glb; sHeroi 0,5333) |
| glb-notebook-grafite | glb | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d/notebook-grafite_legalizai_proprio.glb | dispensa | - | sim (3d/biblioteca/glb-notebook-grafite.glb; sHeroi 0,516) |
| glb-notebook-aluminio | glb | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d/notebook-aluminio_legalizai_proprio.glb | dispensa | - | sim (3d/biblioteca/glb-notebook-aluminio.glb; sHeroi 0,516) |
| glb-cedula-generica | glb | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d/cedula_legalizai_proprio.glb | dispensa | - | sim (3d/biblioteca/glb-cedula-generica.glb; sHeroi 1,143) |
| glb-simbolo-legalizai | glb | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_assets-externos/kit-2026-10/modelos-3d/simbolo_legalizai_proprio.glb | dispensa | - | sim (3d/biblioteca/glb-simbolo-legalizai.glb; sHeroi 0,444) |
| glb-caixa-papelao | glb | liberado | CC0 | https://polyhaven.com/a/cardboard_box_01 | dispensa | - | sim (3d/biblioteca/glb-caixa-papelao.glb; sHeroi 0,31) |
| glb-camera-fotografica | glb | aceito-com-risco | CC0 | https://polyhaven.com/a/Camera_01 | dispensa | pendente (Pedro): fora do padrão | não: fora do padrão até o Pedro decidir |
| glb-lampada | glb | liberado | CC0 | https://polyhaven.com/a/lightbulb_01 | dispensa | - | sim (3d/biblioteca/glb-lampada.glb; sHeroi 1,595) |
| glb-lupa | glb | liberado | CC0 | https://polyhaven.com/a/magnifying_glass_01 | dispensa | - | sim (3d/biblioteca/glb-lupa.glb; sHeroi 0,589) |
| glb-caneca | glb | liberado | CC0 | https://poly.pizza/m/fis2ugeLbn | dispensa | - | sim (3d/biblioteca/glb-caneca.glb; sHeroi 1,34) |
| glb-carteira | glb | aceito-com-risco | CC BY 3.0 | https://poly.pizza/m/bN7GPQFma7_ | fora do padrão: o crédito exigido cita marca (decisão do Pedro pendente) | pendente (Pedro): fora do padrão | não: fora do padrão até o Pedro decidir |
| glb-pote-vidro | glb | liberado | CC BY 3.0 | https://poly.pizza/m/8dGz3QaoAG- | 'Glass Jar' por Jarlan Perez (Poly Pizza, CC BY 3.0) | - | sim (3d/biblioteca/glb-pote-vidro.glb; sHeroi 1,143) |
| proc-argila-pilha | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/carrossel-2026-10-05/objetos/papelaria.ts | dispensa | - | sim (procedural: argila; sHeroi 1,479687) |
| proc-argila-carimbo | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/carrossel-2026-10-05/objetos/papelaria.ts | dispensa | - | sim (procedural: argila; sHeroi 2,5) |
| proc-argila-pasta | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/carrossel-2026-10-05/objetos/papelaria.ts | dispensa | - | sim (procedural: argila; sHeroi 1,295547) |
| proc-argila-despertador | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/carrossel-2026-10-05/objetos/despertador.ts | dispensa | - | sim (procedural: argila; sHeroi 2,581478) |
| proc-argila-envelope | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/carrossel-2026-10-05/objetos/papelaria.ts | dispensa | - | sim (procedural: argila; sHeroi 1,52381) |
| proc-argila-envelope-aberto | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/carrossel-2026-10-05/objetos/papelaria.ts | dispensa | - | sim (procedural: argila; sHeroi 1,35858) |
| proc-argila-lupa | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/carrossel-2026-10-05/objetos/legalizai.ts | dispensa | - | sim (procedural: argila; sHeroi 1,338912) |
| proc-argila-caneta | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/carrossel-2026-10-05/objetos/papelaria.ts | dispensa | - | sim (procedural: argila; sHeroi 1,818182) |
| proc-argila-prancheta | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/carrossel-2026-10-05/objetos/papelaria.ts | dispensa | - | sim (procedural: argila; sHeroi 1,276935) |
| proc-argila-moeda | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/carrossel-2026-10-05/objetos/legalizai.ts | dispensa | - | sim (procedural: argila; sHeroi 4,705882) |
| proc-argila-sino | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/carrossel-2026-10-05/objetos/legalizai.ts | dispensa | - | sim (procedural: argila; sHeroi 2,366864) |
| proc-palco-argila | procedural | liberado | próprio | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/kit/ext/comum/palco/fabrica.ts | dispensa | - | sim (procedural: palco-argila) |

## Decisões de risco pendentes do Pedro (6)

Item aceito com risco com a decisão pendente fica fora do padrão: o kit recusa até a decisão entrar no catálogo (decisaoRisco numa sobreposição `revisao-*.json` da pasta do tipo, com quem, quando e as peças).

- `glb-relogio-analogico-chronograph` (modelos): usar o relógio analógico cujo desenho lembra uma linha conhecida de relógio esportivo (logos apagados das texturas)?
- `glb-relogio-digital` (modelos): usar o relógio digital de desenho reconhecível (marca fictícia e rótulos na caixa; evitar close)?
- `glb-carimbo` (modelos): a licença CC BY 3.0 deste modelo exige na legenda o autor 'Poly by Google', que cita marca: usar o crédito assim numa peça (exceção à regra do kit, registrada com a peça) ou ficar sem o modelo?
- `glb-cofrinho` (modelos): a licença CC BY 3.0 deste modelo exige na legenda o autor 'Poly by Google', que cita marca: usar o crédito assim numa peça (exceção à regra do kit, registrada com a peça) ou ficar sem o modelo?
- `glb-camera-fotografica` (modelos): usar a câmera fotográfica de desenho clássico reconhecível (marca, modelo e gravações apagados das texturas)?
- `glb-carteira` (modelos): a licença CC BY 3.0 deste modelo exige na legenda o autor 'Poly by Google', que cita marca: usar o crédito assim numa peça (exceção à regra do kit, registrada com a peça) ou ficar sem o modelo?

## Telas do app (176)

Licença própria (Legalizaí). As capturas dos dois conjuntos são do protótipo Next.js, não do app Flutter.
Peça de MEI só usa captura com `servePecaMei` true (o kit recusa as outras, F063); captura reprovada nunca entra; aceita com risco, só com os cortes do item.

- conjunto 2026-09: 80 capturas (aceito-com-risco 27, liberado 4, reprovado 49)
- conjunto 2026-10-02: 88 capturas (aceito-com-risco 36, liberado 8, reprovado 44)
- capturas que são a página de erro 404 do servidor (a rota foi apagada do protótipo @ab68dbc; recapturar dá o mesmo 404; ficam reprovadas): tela0210-saida_fora-bh, tela0210-saida_exterior, tela0210-saida_socios, tela0210-saida_socio-pj, tela0210-mei_saida_ja-tem-cnpj, tela0210-mei_saida_servidor, tela0210-contrato, tela0210-termo, tela0210-painel

| id | conjunto | tipo | status | serve MEI | licença | arquivo |
|---|---|---|---|---|---|---|
| tela-splash | 2026-09 | captura | liberado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/splash.png |
| tela-welcome | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/welcome.png |
| tela-entrada | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/entrada.png |
| tela-entrada-intencao-abrir | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/entrada-intencao-abrir.png |
| tela-entrada-intencao-migrar | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/entrada-intencao-migrar.png |
| tela-entrada-intencao-abrir-regime-me | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/entrada-intencao-abrir-regime-me.png |
| tela-saida_fora-bh | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/saida_fora-bh.png |
| tela-migrar_cnpj | 2026-09 | captura | liberado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/migrar_cnpj.png |
| tela-migrar_cnpj-fase-achou | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/migrar_cnpj-fase-achou.png |
| tela-saida_regime-nao-suportado | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/saida_regime-nao-suportado.png |
| tela-saida_cnpj-inapto | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/saida_cnpj-inapto.png |
| tela-migrar_diagnostico | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/migrar_diagnostico.png |
| tela-migrar_plano | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/migrar_plano.png |
| tela-migrar_contrato | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/migrar_contrato.png |
| tela-gate | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/gate.png |
| tela-veredito_atende | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/veredito_atende.png |
| tela-gate-etapa-triagem | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/gate-etapa-triagem.png |
| tela-gate-etapa-faixa | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/gate-etapa-faixa.png |
| tela-veredito_waitlist | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/veredito_waitlist.png |
| tela-veredito_nao-atende | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/veredito_nao-atende.png |
| tela-veredito_descartado | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/veredito_descartado.png |
| tela-saida_exterior | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/saida_exterior.png |
| tela-saida_socios | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/saida_socios.png |
| tela-conta | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/conta.png |
| tela-plano | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/plano.png |
| tela-contrato | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/contrato.png |
| tela-pagamento | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/pagamento.png |
| tela-pagamento-fluxo-migrar | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/pagamento-fluxo-migrar.png |
| tela-migrar_contador | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/migrar_contador.png |
| tela-migrar_transferencia | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/migrar_transferencia.png |
| tela-migrar_transferencia-estado-travado | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/migrar_transferencia-estado-travado.png |
| tela-migrar_ativa | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/migrar_ativa.png |
| tela-aguardando | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/aguardando.png |
| tela-retomar | 2026-09 | captura | liberado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/retomar.png |
| tela-dossie_socio | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/dossie_socio.png |
| tela-dossie_vinculo | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/dossie_vinculo.png |
| tela-dossie_socios | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/dossie_socios.png |
| tela-dossie_empresa | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/dossie_empresa.png |
| tela-dossie_cnae-secundarios | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/dossie_cnae-secundarios.png |
| tela-dossie_natureza | 2026-09 | captura | liberado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/dossie_natureza.png |
| tela-dossie_nome | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/dossie_nome.png |
| tela-revisar | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/revisar.png |
| tela-termo | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/termo.png |
| tela-painel | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/painel.png |
| tela-painel_recusa | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/painel_recusa.png |
| tela-assinatura | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/assinatura.png |
| tela-home-dia1 | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/home-dia1.png |
| tela-inicio | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/inicio.png |
| tela-impostos | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/impostos.png |
| tela-impostos_guias | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/impostos_guias.png |
| tela-impostos_aliquotas | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/impostos_aliquotas.png |
| tela-impostos_pagar | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/impostos_pagar.png |
| tela-obrigacoes | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/obrigacoes.png |
| tela-notas | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/notas.png |
| tela-notas_detalhe | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/notas_detalhe.png |
| tela-emitir | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/emitir.png |
| tela-mais | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/mais.png |
| tela-perfil | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/perfil.png |
| tela-mais_plano | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/mais_plano.png |
| tela-mais_servicos | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/mais_servicos.png |
| tela-mais_empresa | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/mais_empresa.png |
| tela-mais_socios | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/mais_socios.png |
| tela-mais_colaborador | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/mais_colaborador.png |
| tela-mais_documentos | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/mais_documentos.png |
| tela-mais_certificado | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/mais_certificado.png |
| tela-mais_em-dia | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/mais_em-dia.png |
| tela-mais_relatorios | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/mais_relatorios.png |
| tela-mais_declaracoes | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/mais_declaracoes.png |
| tela-avisos | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/avisos.png |
| tela-pro-labore | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/pro-labore.png |
| tela-blog | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/blog.png |
| tela-blog_post | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/blog_post.png |
| tela-login | 2026-09 | captura | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/login.png |
| tela-ativa | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/ativa.png |
| tela-encaixe | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/encaixe.png |
| tela-home-campea | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/home-campea.png |
| tela-impostos-neutro | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/impostos-neutro.png |
| tela-pagamento-cenario-empresa-paga-v-0 | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/pagamento-cenario-empresa-paga-v-0.png |
| tela-plano-cenario-empresa-paga-v-0 | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/plano-cenario-empresa-paga-v-0.png |
| tela-revisar-cenario-empresa-paga-v-0 | 2026-09 | captura | reprovado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app/revisar-cenario-empresa-paga-v-0.png |
| tela0210-splash | 2026-10-02 | captura | liberado | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/splash.png |
| tela0210-welcome | 2026-10-02 | captura | aceito-com-risco | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/welcome.png |
| tela0210-entrada | 2026-10-02 | captura | aceito-com-risco | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/entrada.png |
| tela0210-entrada-intencao-abrir | 2026-10-02 | captura | aceito-com-risco | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/entrada-intencao-abrir.png |
| tela0210-entrada-intencao-migrar | 2026-10-02 | captura | aceito-com-risco | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/entrada-intencao-migrar.png |
| tela0210-dados | 2026-10-02 | captura | aceito-com-risco | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/dados.png |
| tela0210-endereco | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/endereco.png |
| tela0210-saida_fora-bh | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/saida_fora-bh.png |
| tela0210-migrar_cnpj | 2026-10-02 | captura | liberado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/migrar_cnpj.png |
| tela0210-migrar_cnpj-fase-achou | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/migrar_cnpj-fase-achou.png |
| tela0210-saida_regime-nao-suportado | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/saida_regime-nao-suportado.png |
| tela0210-saida_cnpj-inapto | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/saida_cnpj-inapto.png |
| tela0210-migrar_diagnostico | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/migrar_diagnostico.png |
| tela0210-migrar_plano | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/migrar_plano.png |
| tela0210-migrar_contrato | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/migrar_contrato.png |
| tela0210-dossie_atividade | 2026-10-02 | captura | liberado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/dossie_atividade.png |
| tela0210-veredito_atende | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/veredito_atende.png |
| tela0210-gate-etapa-triagem | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/gate-etapa-triagem.png |
| tela0210-gate-etapa-faixa | 2026-10-02 | captura | liberado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/gate-etapa-faixa.png |
| tela0210-veredito_waitlist | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/veredito_waitlist.png |
| tela0210-veredito_nao-atende | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/veredito_nao-atende.png |
| tela0210-veredito_descartado | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/veredito_descartado.png |
| tela0210-saida_exterior | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/saida_exterior.png |
| tela0210-saida_socios | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/saida_socios.png |
| tela0210-saida_socio-pj | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/saida_socio-pj.png |
| tela0210-endereco-regime-mei | 2026-10-02 | captura | aceito-com-risco | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/endereco-regime-mei.png |
| tela0210-mei_impedimentos | 2026-10-02 | captura | aceito-com-risco | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mei_impedimentos.png |
| tela0210-mei_saida_ja-tem-cnpj | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mei_saida_ja-tem-cnpj.png |
| tela0210-mei_saida_servidor | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mei_saida_servidor.png |
| tela0210-mei_faturamento | 2026-10-02 | captura | aceito-com-risco | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mei_faturamento.png |
| tela0210-mei_atividade | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mei_atividade.png |
| tela0210-mei_atividade-secundarias | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mei_atividade-secundarias.png |
| tela0210-mei_status | 2026-10-02 | captura | aceito-com-risco | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mei_status.png |
| tela0210-mei_certificado | 2026-10-02 | captura | aceito-com-risco | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mei_certificado.png |
| tela0210-mei_proximos-passos | 2026-10-02 | captura | aceito-com-risco | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mei_proximos-passos.png |
| tela0210-conta | 2026-10-02 | captura | liberado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/conta.png |
| tela0210-plano | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/plano.png |
| tela0210-contrato | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/contrato.png |
| tela0210-pagamento | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/pagamento.png |
| tela0210-pagamento-fluxo-migrar | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/pagamento-fluxo-migrar.png |
| tela0210-migrar_contador | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/migrar_contador.png |
| tela0210-migrar_dados | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/migrar_dados.png |
| tela0210-migrar_socios | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/migrar_socios.png |
| tela0210-migrar_gov | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/migrar_gov.png |
| tela0210-migrar_transferencia | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/migrar_transferencia.png |
| tela0210-migrar_transferencia-estado-travado | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/migrar_transferencia-estado-travado.png |
| tela0210-migrar_ativa | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/migrar_ativa.png |
| tela0210-aguardando | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/aguardando.png |
| tela0210-retomar | 2026-10-02 | captura | liberado | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/retomar.png |
| tela0210-dossie_cnae-secundarios | 2026-10-02 | captura | liberado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/dossie_cnae-secundarios.png |
| tela0210-dossie_socio | 2026-10-02 | captura | liberado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/dossie_socio.png |
| tela0210-dossie_vinculo | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/dossie_vinculo.png |
| tela0210-dossie_socios | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/dossie_socios.png |
| tela0210-dossie_empresa | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/dossie_empresa.png |
| tela0210-dossie_nome | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/dossie_nome.png |
| tela0210-revisar | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/revisar.png |
| tela0210-termo | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/termo.png |
| tela0210-painel | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/painel.png |
| tela0210-painel_recusa | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/painel_recusa.png |
| tela0210-certificado | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/certificado.png |
| tela0210-assinatura | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/assinatura.png |
| tela0210-home-dia1 | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/home-dia1.png |
| tela0210-inicio | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/inicio.png |
| tela0210-impostos | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/impostos.png |
| tela0210-impostos_guias | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/impostos_guias.png |
| tela0210-impostos_aliquotas | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/impostos_aliquotas.png |
| tela0210-impostos_pagar | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/impostos_pagar.png |
| tela0210-obrigacoes | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/obrigacoes.png |
| tela0210-notas | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/notas.png |
| tela0210-notas_detalhe | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/notas_detalhe.png |
| tela0210-emitir | 2026-10-02 | captura | aceito-com-risco | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/emitir.png |
| tela0210-mais | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mais.png |
| tela0210-perfil | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/perfil.png |
| tela0210-mais_plano | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mais_plano.png |
| tela0210-mais_servicos | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mais_servicos.png |
| tela0210-mais_empresa | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mais_empresa.png |
| tela0210-mais_socios | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mais_socios.png |
| tela0210-mais_colaborador | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mais_colaborador.png |
| tela0210-mais_documentos | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mais_documentos.png |
| tela0210-mais_certificado | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mais_certificado.png |
| tela0210-mais_em-dia | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mais_em-dia.png |
| tela0210-mais_relatorios | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mais_relatorios.png |
| tela0210-mais_declaracoes | 2026-10-02 | captura | aceito-com-risco | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/mais_declaracoes.png |
| tela0210-avisos | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/avisos.png |
| tela0210-pro-labore | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/pro-labore.png |
| tela0210-blog | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/blog.png |
| tela0210-blog_post | 2026-10-02 | captura | reprovado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/blog_post.png |
| tela0210-login | 2026-10-02 | captura | aceito-com-risco | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/login.png |
| montada-tela-splash | 2026-10-02 | montada | liberado | sim | própria | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14/assets/telas/tela-splash.png |
| montada-tela-inicio | 2026-10-02 | montada | liberado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14/assets/telas/tela-inicio.png |
| montada-tela-inicio-pagar | 2026-10-02 | montada | liberado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14/assets/telas/tela-inicio-pagar.png |
| montada-tela-imposto | 2026-10-02 | montada | liberado | não | própria | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14/assets/telas/tela-imposto.png |
| receita-monta-telas | - | receita-codigo | liberado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14/monta_telas.py |
| receita-tela-ts | - | receita-codigo | liberado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/guia/tela.ts |
| receita-pinturas-ts | - | receita-codigo | liberado | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/guia/pinturas.ts |
| receita-fecho-guia | - | receita-codigo | aceito-com-risco | - | própria | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/guia/Guia.tsx |

## Biblioteca 2D e assets

### biblioteca2d (47)

| id | status | partes | licença | link | crédito na legenda |
|---|---|---|---|---|---|
| p2d-At | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Bg | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Numeral | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Sticker | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-ClayCard | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Bubble | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Calendar | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Stamp | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-HangTag | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Padlock | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-YearOdo | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Check | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-NumDot | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-AlarmClock | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-BigArrow | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Rays | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Confetti | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Phone | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Eye | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-TetoCard | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-CommentIcon | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Pill | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Sparkle | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-spring | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-shake | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-inn | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-constantes | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/motion/kit.tsx | - |
| p2d-Camera | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/Motion.tsx | - |
| p2d-transicao-iris | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/Motion.tsx | - |
| p2d-transicao-push | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/Motion.tsx | - |
| p2d-transicao-zoom | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/Motion.tsx | - |
| p2d-transicao-slideUp | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/Motion.tsx | - |
| p2d-transicao-wipeUp | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/Motion.tsx | - |
| p2d-iris-fim | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/Motion.tsx | - |
| p2d-corte-whipL | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/Broll.tsx | - |
| p2d-corte-whipUp | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/Broll.tsx | - |
| p2d-corte-zoomBlur | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/Broll.tsx | - |
| p2d-corte-flash | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/Broll.tsx | - |
| p2d-corte-loop | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/Broll.tsx | - |
| p2d-Video | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/Broll.tsx | - |
| p2d-AppleCaptions | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/parts/AppleCaptions.tsx | - |
| p2d-Backdrop | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/parts/Backdrop.tsx | - |
| p2d-Captions | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/parts/Captions.tsx | - |
| p2d-Cards | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/parts/Cards.tsx | - |
| p2d-LeoLayer | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/parts/LeoLayer.tsx | - |
| p2d-grupo | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/kit/ext/precificacao/render.tsx | - |
| p2d-legenda | liberado | - | - | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/kit/ext/precificacao/render.tsx | - |

### assets (52)

| id | status | partes | licença | link | crédito na legenda |
|---|---|---|---|---|---|
| leo-take-T1 | liberado | - | própria (mascote Léo gerado no Higgsfield; lip sync no Wan 2.7) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/takes/T1.mp4 | - |
| leo-take-T2 | liberado | - | própria (mascote Léo gerado no Higgsfield; lip sync no Wan 2.7) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/takes/T2.mp4 | - |
| leo-take-T3 | liberado | - | própria (mascote Léo gerado no Higgsfield; lip sync no Wan 2.7) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/takes/T3.mp4 | - |
| leo-take-T4 | liberado | - | própria (mascote Léo gerado no Higgsfield; lip sync no Wan 2.7) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/takes/T4.mp4 | - |
| leo-recorte-0210 | liberado | - | própria (mascote Léo gerado no Higgsfield; lip sync no Wan 2.7) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public/leo/ | - |
| leo-reacao-T1 | liberado | - | própria (mascote Léo gerado no Higgsfield; lip sync no Wan 2.7) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public-abertura/leo/T1/ | - |
| leo-reacao-T2 | liberado | - | própria (mascote Léo gerado no Higgsfield; lip sync no Wan 2.7) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public-abertura/leo/T2/ | - |
| leo-reacao-T3 | liberado | - | própria (mascote Léo gerado no Higgsfield; lip sync no Wan 2.7) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public-abertura/leo/T3/ | - |
| leo-reacao-T4 | liberado | - | própria (mascote Léo gerado no Higgsfield; lip sync no Wan 2.7) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public-abertura/leo/T4/ | - |
| leo-camada-0210 | liberado | - | própria (código do reel de 02/10) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/parts/LeoLayer.tsx | - |
| leo-heroi | liberado | - | própria (mascote Léo gerado no Higgsfield) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/hero/hero-1080.png | - |
| leo-heroi-patas | liberado | - | própria (mascote Léo gerado no Higgsfield) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/hero/hero-patas-1080.png | - |
| broll-b1-gancho | liberado | - | Pexels (uso gratuito, inclusive comercial; sem crédito obrigatório) | https://www.pexels.com/pt-br/licenca/ | - |
| broll-b2-clientes | liberado | - | Pexels (uso gratuito, inclusive comercial; sem crédito obrigatório) | https://www.pexels.com/pt-br/licenca/ | - |
| broll-b3-agenda | liberado | - | Pexels (uso gratuito, inclusive comercial; sem crédito obrigatório) | https://www.pexels.com/pt-br/licenca/ | - |
| broll-b4-tempo | liberado | - | Pexels (uso gratuito, inclusive comercial; sem crédito obrigatório) | https://www.pexels.com/pt-br/licenca/ | - |
| broll-b5-reajuste | liberado | - | Pexels (uso gratuito, inclusive comercial; sem crédito obrigatório) | https://www.pexels.com/pt-br/licenca/ | - |
| broll-b6-cresceu | liberado | - | Pexels (uso gratuito, inclusive comercial; sem crédito obrigatório) | https://www.pexels.com/pt-br/licenca/ | - |
| broll-b7-comenta | liberado | - | Pexels (uso gratuito, inclusive comercial; sem crédito obrigatório) | https://www.pexels.com/pt-br/licenca/ | - |
| vinheta-o-check-16x9 | reprovado | imagem liberado; som reprovado | própria na imagem (Blender e HTML do projeto marketing/vinheta); som reprovado até confirmar a origem (indícios de Epidemic) | C:/MKT-INSTA/Content Legalizai/marketing/final/Vinheta O Check/vinheta-16x9-piloto-v7.mp4 | - |
| vinheta-o-check-9x16 | reprovado | imagem liberado; som reprovado | própria na imagem (Blender e HTML do projeto marketing/vinheta); som reprovado até confirmar a origem (indícios de Epidemic) | C:/MKT-INSTA/Content Legalizai/marketing/final/Vinheta O Check/vinheta-9x16-4k60-v2.mp4 | - |
| clay-cartela-abertura | liberado | - | própria (gerada no Higgsfield, nano_banana_pro 2k 16:9) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/abertura-mes-2026-10-01/assets/cartela-clay.png | - |
| clay-comprovante | liberado | - | própria (gerada no Higgsfield, nano_banana_pro) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/abertura-mes-2026-10-01/assets/comprovante.png | - |
| clay-comprovante-sem-selo | liberado | - | própria (gerada no Higgsfield, nano_banana_pro) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/abertura-mes-2026-10-01/assets/comprovante-sem-selo.png | - |
| clay-selo | liberado | - | própria (gerada no Higgsfield, nano_banana_pro) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/abertura-mes-2026-10-01/assets/selo.png | - |
| clay-pasta | liberado | - | própria (gerada no Higgsfield, nano_banana_pro) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/abertura-mes-2026-10-01/assets/pasta.png | - |
| clay-estrela1 | liberado | - | própria (gerada no Higgsfield, nano_banana_pro) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/abertura-mes-2026-10-01/assets/estrela1.png | - |
| clay-estrela2 | liberado | - | própria (gerada no Higgsfield, nano_banana_pro) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/abertura-mes-2026-10-01/assets/estrela2.png | - |
| clay-lua | liberado | - | própria (gerada no Higgsfield, nano_banana_pro) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/abertura-mes-2026-10-01/assets/lua.png | - |
| clay-lua-sem-estrelas | liberado | - | própria (gerada no Higgsfield, nano_banana_pro) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/abertura-mes-2026-10-01/assets/lua-sem-estrelas.png | - |
| clay-seq-cadastro | liberado | - | própria (gerada no Higgsfield: nano_banana_pro 9:16 2k e kling3_0_turbo 5 s 1080p) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public/clay/cadastro/ | - |
| clay-seq-calculo | liberado | - | própria (gerada no Higgsfield: nano_banana_pro 9:16 2k e kling3_0_turbo 5 s 1080p) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public/clay/calculo/ | - |
| icone-calendario | liberado | - | própria (ícone 3D clay gerado por IA no estilo do design guide) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public/icons/calendario.webp | - |
| icone-campanha | liberado | - | própria (ícone 3D clay gerado por IA no estilo do design guide) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public/icons/campanha.webp | - |
| icone-growth | liberado | - | própria (ícone 3D clay gerado por IA no estilo do design guide) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public/icons/growth.webp | - |
| icone-lampada | liberado | - | própria (ícone 3D clay gerado por IA no estilo do design guide) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public/icons/lampada.webp | - |
| icone-metricas | liberado | - | própria (ícone 3D clay gerado por IA no estilo do design guide) | C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public/icons/metricas.webp | - |
| voz-dylan | liberado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| voz-clone-pedro | liberado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| preset-papel | liberado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| preset-recusar-3d-render | reprovado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| preset-recusar-in-the-dark | reprovado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| preset-recusar-exit-the-dream | reprovado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| preset-recusar-drown-in-music | reprovado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| modelo-kling3-0-turbo | liberado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| modelo-kling3-0 | liberado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| modelo-seedance-2-0-mini | liberado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| modelo-seedance-2-0 | liberado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| modelo-seedance-2-5 | liberado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| modelo-wan2-7 | liberado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| modelo-nano-banana-pro | liberado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |
| modelo-hf-mult-replace-object | liberado | - | Higgsfield (plano do Pedro) | https://higgsfield.ai | - |


## Marca

- Fonte Sora (pesos 100 a 800): SIL Open Font License 1.1, `C:/Users/EDIT-ADMIN/AppData/Local/Microsoft/Windows/Fonts/Sora-wght.ttf`.
- Logos e símbolo: marca própria (7 arquivos em `marca.json`).
- LINK DA BIO padrão: #DD4E27 (o V4 do guia usou #F2643C; só a cena do guia mantém; a regra da marca pede coral-600 em fill de botão sobre fundo claro; decisão final do Pedro pendente).

## Pendências (decisão do Pedro)

- AudD: 22 consultas pendentes na fila (KIT/aquisicoes/fila-audd.json): 10 em 03/10/2026, 10 em 04/10/2026, 2 em 05/10/2026 (datas prováveis da fila, com a cota anônima de 10 por dia; cada dia sem rodada empurra o resto um dia). Lembrete ou agendamento combinado com o Pedro. Até lá as 11 trilhas sem verificação ficam fora das peças, e o kit só tem 2 trilhas liberadas (House One, Let's Move).
- Token grátis da AudD na conta do Pedro (300 consultas no cadastro, sem cartão): fecha a fila num dia e documenta o uso.
- Crédito CC BY que falta na legenda do reel de 14/10: usar o texto aprovado da seção 'Textos de legenda prontos'.
- Licença de empresa do Remotion (exigida acima de 3 pessoas).
- Cor da pílula LINK DA BIO: coral-600 #DD4E27 (regra da marca e padrão das peças novas) ou coral-500 #F2643C (a do V4 do guia, que só a cena do guia mantém).
- Tela real: as capturas dos dois conjuntos (2026-09 e 2026-10-02) são do protótipo Next.js, não do app Flutter. Quais valem como 'tela real' ou 'prévia real' depende do Pedro.
- Trocar o som dos finais com Epidemic ou com indício dela (lista na seção das trilhas reprovadas), ou usar a vinheta O Check muda.
- Decisões de risco pendentes: 6 itens (seção 'Decisões de risco pendentes do Pedro').
