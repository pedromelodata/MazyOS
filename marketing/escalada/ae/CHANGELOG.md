# CHANGELOG — escalada-master.aep

## v104 — 21/08/2026 · DESENHO DE SOM (trilha + SFX)

- TRILHA: Brand New Beginning (Oman, Epidemic Sound) montada em STEMS
  com offset 34s na musica (a intro nativa era quase muda — por isso o
  comeco soava sem musica). Envelopes por stem: bass 1.0 / drums ramp
  0.8s / instruments 0.95 / melody 0.45 -> 1.0 aos 41.5 (a virada).
- SEM DUCKING: sidechain removido a pedido do Pedro — variacao medida
  fala/respiro de 0.4 dB (constante). Musica 5.9 dB abaixo da voz.
  Swell de +1.15x na queda do celular (63.3-66.2) = +2.6 dB.
- SFX: ~95 efeitos SINTETIZADOS proceduralmente (scratchpad/sfx.py,
  numpy): whoosh de giro, cliques de mouse/UI, ticks de contador,
  impacto grave com sub, estalos, pops de card, riser, twinkle de
  estrela, passos, succao e ding de confirmacao.
- As 3 BATIDAS do suricato localizadas por analise de movimento quadro a
  quadro no T8: picos ritmicos em 77.10 / 77.50 / 77.90 do filme.
- Master: ESCALADA-DE-MERCADO_MASTER_v104-som.mov (2423 frames, PCM).

## v102 FINAL — 21/08/2026 · MASTER ENTREGUE (auditado frame a frame)

- Pedro APROVOU o v102 (B/narrador). Na auditoria do master, achado
  CRITICO: n_part0520 tinha 25/40 frames (corrompido no conflito de
  pipelines de 20/08 — o validador contava TIFs antes do ffmpeg e o
  outro processo apagava no meio; o filme pulava 0,5s aos ~69,7s desde
  o v095). Bloco re-renderizado e VALIDADO por count_frames no MP4.
- MASTER: ESCALADA-DE-MERCADO_MASTER_v102.mov — video remux bit a bit
  (zero re-encode) + audio PCM 48kHz lossless; 2423 frames exatos,
  80,7667s, decode inteiro sem erros. + escalada_v102_retime.mp4 (dist).
- LICAO DE OURO: validar chunks por count_frames NO MP4, nunca so pela
  contagem de TIFs pre-ffmpeg.

## v102 — 21/08/2026 · lettering em cima do icone

- Review Pedro: o ai. caia na faixa laranja do celular (ilegivel).
  T8-LETTERING movido pra [2050,1010] — em cima do badge que ele segura,
  na area branca. Blocos 0570-0600 B + 0581-0600 A.

## v101 — 21/08/2026 · take final: SO o quadradinho, CLICANDO

- Review Pedro: em vez da logo completa, so o badge do check. Seedance
  v5 (job 674ad0de; 1a tentativa falhou no provedor sem cobrar): ele
  tira SO o quadradinho da tela (que fica com o contorno vazio — otimo
  detalhe), o check some, ele CLICA 2x com o dedinho e o check volta;
  aceno final com o badge na mao. Fundo liso nativo pos-1s. Upscale 4K
  aigc (job b1f297bd). Pipeline v101 identico ao v100.

## v100 — 21/08/2026 · take do mascote REGRAVADO (fundo limpo nativo)

- Pedro autorizou regerar: Seedance v4 com regra de fundo no prompt (a
  grade some no 1o segundo -> fundo branco liso NATIVO, zero grade) +
  upscale 4K aigc. Bonus: a logo sai com o wordmark Legalizai na mao e
  ele acena com ela. SEM DOF de pos (desnecessario agora).
- Balao da versao A consertado: texto era jogado pra fora da tela pelo
  parent-preserve com o balao a scale 0 no playhead — agora parent
  PRIMEIRO + position LOCAL [0,20] (49).
- Arrasto do celular no T7 sincronizado com a descida da legenda
  (8.15->8.85 local; era 8.65->9.45 do fraseado antigo).
- Licoes: renders travando intermitente (aerender morre sem log na 1a
  tentativa) — vigiar por ARQUIVOS/timestamps, nunca so pelo log; o
  Add-Content do log morre silencioso mas o render segue.

## v099 — 21/08/2026 · fundo liso na entrada do suricato

- Review Pedro (fundo tremendo): as linhas da grade se DISSOLVEM em
  fundo branco liso durante o zoom-in (fade 0.6s via blend all_expr) e
  ficam lisas ate a dissolucao nativa (5.6s); janela nitida so no
  mascote (trajeto medido, +-175) e no celular [1030,1855]; gblur 45 +
  brightness .03 no fundo. Residual: anel fino de grade no feather ao
  redor das janelas (remover 100%% exigiria rotoscopia ou retake).

## v098 — 20/08/2026 · DOF calibrado (mascote sempre nitido)

- Review Pedro: o blur v097 pegava o suricato (trajeto chutado errado).
  Trajeto MEDIDO em mosaico de frames: cx(t) = 450+320*min(t,1.5) em
  coords 1080p, banda +-240, uniao com o celular [975,1920]; tudo nitido
  apos 5.6s. Aplicado no filme e no clip A.

## v095-v097 — 20/08/2026 · Por tras + DOF no Suricato

- v095: T7 re-renderizado do projeto novo (legenda POR TRAS de tudo isso,
  sync nativo da narracao nova) e trocado no corte retime; audio t7 volta
  a +200ms (o +300 era compensacao do trecho antigo comprimido).
- v096/v097: DOF no take do Suricato 4K — fundo desfocado esconde os
  artefatos do upscale na grade (fissuras), mascote+celular nitidos.
  No AE (56-dof-t8: duplicata gaussian + mascaras celular/faixa) o
  aerender ESTOURAVA memoria (2 layers 4K + frame blending) e travava
  sem log; solucao final: DOF em POS via ffmpeg (split + gblur sigma7 +
  geq mask animada cx(t)=175+283*min(t,3) + celular [975,1920] + feather
  gblur45 + alphamerge/overlay; tudo nitido apos 5.6s).
- Licoes: aerender pode MORRER sem escrever log (retry-loop nao registra
  1a tentativa em andamento); DOF de pos em ffmpeg e mais robusto que
  2 camadas 4K no AE nesta maquina.

## v094 — 20/08/2026 · Suricato em 4K (upscale do MESMO take)

- Pedro: regerar o take em 4K sem mudar nada — regenerar no Seedance
  criaria take DIFERENTE; a via certa e upscale_video (ByteDance, preset
  aigc, 30fps, 4K) do job v3. Resultado 3840x2160 10.00s exatos.
- 49 com escala DINAMICA (SBASE=3840/width): 4K entra a 100%% (antes
  1080p esticado 200%% = ~540p efetivo no filme 1080p — por isso estava
  ruim); zoom-ponte proporcional (112->100).
- v094 a partir do v089 + reload do footage; 13 blocos B + 4 A; segmento
  s8 do retime trocado pelo T8 4K; clip A remontado (fala 6.2).
- Sync final mantido: T1-T5 +200ms, T6 original, T7 +300ms, T8 +200ms.

## v093 — 20/08/2026 · sync fino por take (FECHADO)

- T7 +300ms (legenda dos 22 anos batia atrasada); T6 tempo original;
  demais +200ms. Mapa final de adelay: t1 1000, t2 6800, t3 17767,
  t4 26500, t5 34733, t6 42067, t7 58000, t8 78267 (ms).

## v092 — 20/08/2026 · sync fino: T6 no tempo original

- Review Pedro: o +200ms adiantou demais a legenda do T6 (unico take em
  que o narrador DESACELEROU — la o sync original ja batia). T6 volta ao
  start original (42.067); demais takes mantem +200ms.


## v091 — 20/08/2026 · sync de legendas do retime

- Review Pedro (legendas atrasadas): fala deslocada +200ms globalmente
  (starts do audio master +0.2s) — legenda queimada chega junto ou um
  tico antes da palavra, padrao de cinema. Video intocado (concat copy).

## v090 — 20/08/2026 · RETIME do filme aprovado (sem reconstrucao)

- Direcao Pedro: pegar o filme pronto aprovado e apenas ajustar TEMPO e
  legendas pra narracao nova — NAO recriar nada. Base: v083 (= v081 + os
  dois fixes pedidos depois: lettering nas orelhinhas e contador sem
  caixa). Feito 100%% em ffmpeg: 8 segmentos cortados nos takes, speed
  por segmento (T1/T3/T6 ~1:1; T2 101,7%%; T7 103,7%%; T4 113%%; T5 117,5%%;
  T8 1:1), concat frame-exato (2423f = 80,77s) + master-audio-v084.wav.
- Emenda T7->T8 intacta (o swipe cobre o corte); legendas kinetic
  originais com deriva de sync <=0,5s (takes acelerados ~1s nos eventos
  internos do T4/T5/T7 — narrador nao acelerou uniforme).
- Paralelo no AE (caminho alternativo, salvo): v085-v089 = legendas
  apple 158 compostas por lado + zonas no T7, giro 1 volta sem frame
  blend, estrela #FFE923, timeline organizada, narracao-timeline
  removida da master. v089 fica como base se o Pedro voltar ao AE.

## v084 — 20/08/2026 · NARRACAO NOVA aplicada — filme realinhado (80.8s)

- Narracao regravada pelo Pedro (marketing/audio/Narracao/, 72.3s vs
  75.65s; agora diz contabil e Por TRAS de tudo isso). Pipeline completo:
  WhisperX small/pt + align -> fase1 (fatias novas t1-t8.wav, timeline)
  -> fase3 (31 regenerado; regra por baixo->por tras) -> 32 x8 takes.
- KEEP novos: T1 5.8 / T2 10.9667 / T3 8.7333 / T4 8.2333 / T5 7.5333 /
  T6 15.6333 (clamp na duracao do comp) / T7 14.3667; fimT7 72.07;
  filme 80.77s (2423 frames).
- RETIME interno por palavra: T3 rolagem 2.4-5.6 snap 6.2; T4 APAGA 5.03
  HERO 6.07 BOLO 6.83; T5 PLA 2.08 NOT 2.85 CON 3.86 CAL5 4.12; T6 T_Q
  13.1; T7 contador22 1.95, cards tPop 2.0 tFun 5.75, VEM 5.6 BATE 6.5
  (fumaca 52 junto), wiggle 8.37, wipe 13.42-14.32; giros T2 10.08 /
  T5 7.15. Zoom-ponte e swipe seguem fimT7 automaticamente.
- Audio master v084 (adelay novos + loudnorm) e t8-audio-v84.
- Blocos renumerados (n_part/n_alt): 54x40 + 1x2 + T8 12x20+1x21;
  render FULL 68+4 blocos.
- Armadilha nova: 46-take-t6 exige 46-mapa-dados.jsx ANTES (senao aborta
  com erro no ESCALADA_RESULT — checar o log, o evalFile nao lanca).

## v082-v083 — 20/08/2026 · lettering nas orelhinhas + contador sem caixa

- v082: T8-LETTERING reposicionado [2680,300] — em cima da logo que o
  suricato segura, na altura das orelhinhas (review Pedro).
- v083 (54-contador-fix.jsx): card branco do contador REMOVIDO (T3 e a
  replica do T4); numero por extenso 7.400.000 (sem MILHOES) em coral
  do inicio ao fim; rolagem com Directional Blur vertical (0->26->0,
  estilo slot machine, casa com o swipe) direto sobre a multidao.
- Fontes 43/44 anotados: rodar o 54 apos os take-scripts.
- Blocos: 0610-0630 BeA (lettering) + 0150-0220 B (contador).

## v081 — 20/08/2026 · lettering preto/coral + fumaca envolvente

- Review Pedro: lettering do T8 com Vai, legaliza em PRETO (ink-900) e
  ai. em CORAL-600 (53-lettering-t8-cores.jsx: pinta text layers do
  precomp recursivo, criterio ascii sem depender de acento/encoding;
  cobre fillColor base + animators de fill).
- FUMACA de dentro pra fora (52 v2): mascara nasce na SILHUETA do
  celular (elipse 430x850 no centro 1920,1240) e vaza pelas bordas do
  topo a base — estilo smoke-reveal da referencia Envato.
- Blocos: 0500/0510 (fumaca) + 0610-0630 (lettering, B e A).

## v080 — 20/08/2026 · swipe T7->T8 + fumaca fluida

- Review Pedro (corte seco + suricato dropando + bolhas): TRANSICAO SWIPE
  na master — dois paineis coral (300 lead / 600 lag, rot -8, motion blur)
  varrem esq->dir cobrindo o corte (fimT7-0.30 -> +0.38); a cena e
  revelada da esquerda, entregando o mascote ja em quadro.
- FUMACA FLUIDA no impacto do T7 (52-fumaca-t7.jsx): solid ink-300 +
  Fractal Noise (evolution 700deg, offset subindo) + mascara eliptica
  crescendo/subindo + feather 250 — estilo smoke-reveal, zero bolhas.
  CC Particle World removido do 47 (fonte remete ao 52).
- Blocos re-renderizados: 0500/0510 (fumaca), 0560/0570 (swipe), A 0570.
- Licoes: setTemporalEaseAtKey em POSITION (espacial) exige matriz de 1
  KeyframeEase (nao dims); @(@(...)) de 1 elemento sofre unwrap no PS —
  usar @(,@(...)); property de efeito por NOME pt-BR com busca regex
  recursiva quando os matchnames -00NN nao sao conhecidos.

## v079 — 20/08/2026 · zoom-ponte na entrada do mascote

- Review Pedro: o suricato entrava "do nada" — agora ha ZOOM-IN leve no
  celular (100->112%%, ponto fixo 2660,1240) enquanto a ultima legenda se
  desfaz (fimT7-0.95 -> corte), e o T8 ABRE a 112%% (T8V-cena 224%% com
  position compensada) relaxando pra 200%% em 2s por baixo do push-in
  interno do video — movimento de camera continuo atravessando o corte.
- Matematica da emenda: video 1080p a 200%% reproduz o 4K 1:1; ponto fixo
  do zoom identico nos dois lados (validacao: s=200 -> position default).
- Blocos re-renderizados: 0550-0580 (B) e 0570-0580 (A).
- Licoes: python one-liner open(w).write(open(r).read()) TRUNCA o arquivo
  (w abre antes do read) — sempre ler ANTES em variavel; dialogo pos-crash
  do AE ("Opcoes de reparo de falhas") trava o launch a 168MB — screenshot
  da tela + click programatico no botao Continuar (nunca ENTER cego).

## v078 — 19/08/2026 · T8 100%% Seedance v3: cutucada 2x, aceno final

- **Take inteiro em video IA** (t8-fullia.mp4 = retake v3, Seedance 2.0,
  start frame = cena real do filme): suricato realista entra andando,
  puxa a logo da tela (wordmark "Legalizai" gigante na tela), a grade
  se dissolve pra fundo clean, o quadradinho sai VAZIO, ele CUTUCA 2x
  e o check branco volta com pop; termina ACENANDO pra camera.
- Review Pedro no v2: pose final "palma aberta apresentando" reprovada
  e giro em volta do check desnecessario -> substituidos pela cutucada
  (retake unico, 90 creditos).
- **Ponte T7 antiga neutralizada** no 50-master (camadas T7X removidas;
  Linear Wipe das letras mantido) — o suricato agora so existe no T8.
- Lettering T8 reposicionado (2620,360) e balao versao A (2450,660)
  pra area limpa do close final (o push-in aproxima o personagem).
- Estrutura T8: T8-LETTERING > t8.wav (6.0) > balao A (off na B) >
  T8V-cena (stretch 87, 10.04s->8.7s, FRAME_MIX) > BG-T8.
- Licao: bridge MCP morre com AE >17GB e -r nao roteia pra instancia
  ocupada; script headless via -r em instancia LEVE (sem projeto na
  linha de comando) roda evalFile+saves+quit sem painel nenhum.


## v077 — 19/08/2026 · T8 final: check limpo, ponte T7->T8 invisivel

- **Check 100%% limpo**: TIME REMAP no video do suricato PULA a fase em que
  o traco marrom da IA nasce (v5.45->7.30) e congela no sorriso final; o
  check branco e desenhado no quadradinho DURANTE o aceno (a patinha
  "rege" o traco). Mascara do traco recalibrada (caixa 425-880 x 15-610,
  coords do VIDEO) — zero traco em qualquer frame.
- **Ponte T7->T8** (50-master): o suricato ENTRA no fim do T7 (master
  74.27) com a ultima frase ainda na tela; Linear Wipe apaga as letras
  conforme ele passa; o video continua no T8 do ponto exato (remap
  encadeado, speed identica) — corte imperceptivel.
- **Fix "travou e voltou"**: os blocos de render tinham nomes 3-digitos
  ambiguos (m_part058 < m_part571 lexicografico) e o concat embaralhou o
  inicio do T8 — renomeados para 4 digitos ordenaveis (NNN0/NNNS).
- Licao: habilitar timeRemap cria keys default; APAGAR TODAS oculta a
  propriedade — sobrescrever por tempo e podar depois.


## v076 — 19/08/2026 · T8 refinado: proporcao, logo colorida, check branco

- Review Pedro: suricato estava GIGANTE vs o celular -> 140% (era 200) com
  o layer deslizando na caminhada pra mao do puxao encostar NA LOGO da
  tela (nao na ilha); logo extraida COLORIDA (horizontal + Change to Color
  ink->coral: quadradinho laranja + wordmark LARANJA), quadradinho sai
  VAZIO e o CHECK BRANCO e desenhado nele (trim path) no ritmo do gesto
  da patinha; traco marrom baked da IA cortado por mascara subtract no
  matte (caixa em coords do VIDEO, expansao colapsada ate o fim do gesto).
- Creditos Higgsfield ESGOTARAM — retake limpo do gesto (prompt sem a
  palavra "check", pronto no historico) pendente de recarga; ate la o
  traco residual aparece só durante o gesto (4.7-6.0) e some.
- Licao: mascara em layer de video usa coords do VIDEO (nao da cena);
  "sumicos" apos re-run = quase sempre preserve/valor residual.


## v075 — 19/08/2026 · T8 SEEDANCE: suricato em animacao de verdade

- Rig 3D nativo REPROVADO pelo diretor (mesh Tripo nao-manifold rasgava;
  "trabalho porco") — rota final: personagem em VIDEO IA (Seedance 2.0,
  referencia = imagem 4K aprovada do mascote) + composicao AE dos elementos
  de marca. Take continuo de 10s (anda -> estica/puxa -> desenha o check ->
  espia e acena), recortado por MATTE DE DIFERENCA (original vs
  bg-removido; h264 nao carrega alpha) via track matte luma.
- 49 v3: video 2 layers (matte+original, stretch 86.7% = 8.7s), logo puxada
  da tela em sincronia com o snap da pata (3.1-3.75), check da logo SOME
  (4.15), traco desenhado (ja no video, ink como o lettering), quadradinho
  real PIPOCA de volta (6.1) completando a marca; lettering topo, logo
  baixo-esquerda [900,1520]; fala 6.0+. Versoes B (narrador) / A (balao,
  v075A.aep).
- Imagens 4K do mascote (nano banana pro, referencia do render 3D):
  suri-higgs-v1..v4 + v4 com fundo transparente (mascara 4K recomposta).
- Ops: chunks do T8 com 2 videos h264 estouravam RAM com AE aberto —
  fechar AE + chunks de 20 frames; disco liberado (anim/ 487MB do rig
  reprovado + aeps v001-v069, 666MB — regeneraveis via jsx no git).


## v073 — 19/08/2026 · T8 COMPLETO: mascote suricato (filme fechado, 84s)

- **49-take-t8.jsx**: cena continua do fim do T7 (celular splash a direita,
  grades formadas). Suricato 3D (stills Blender do modelo Tripo: perfil/
  3-quartos/frente, EEVEE, luz acompanhando a camera) entra ANDANDO
  (cutout: bob 10.5Hz + gingado + sombra de contato), patinha vetorial
  estica e PUXA a logo da tela (patch coral cobre a baked; logo clara ->
  escura no meio do voo; assenta no papel com settle), V de CHECK com
  patinhas + o check da marca pulsa em coral por cima do check da logo,
  t8.wav e lettering movidos pra 6.0 (fala depois do gesto).
- **Duas versoes**: B (default, narrador) e A (balao "Vai, legaliza ai!"
  — escalada-master_v073A.aep com T8V-balao ligado).
- Modelo: assets/mascote/Suricato 3D model.zip (Tripo AI, obj 977k tris,
  SEM rig — por isso 2.5D; upgrade se o Pedro exportar rigado do Tripo).
- Audio unificado com t8 (fala em 81.27); filme completo 0.8-83.97s.
- Licao nova: filho parented ao rig ANTES das keys do rig le preserve na
  posicao inicial — SEMPRE re-setar position local apos parent.


## v072 — 19/08/2026 · contadores RETOS e com folga da borda

- Review Pedro ("filme cortado / contagem embaixo"): o card do contador
  T3/T4 estava TORTO (tilt 3D rotY -4 do polimento — removido tambem da
  pill 11h do T6; "nada torto" e regra do diretor) e baixo demais, com a
  drop shadow sangrando na borda inferior. Contador T3/T4 subiu 55px
  (card 1975->1920, numero 2005->1950 / m74 2035->1980).
- Re-render parcial: chunks 015-022 (T3/T4) + 039-042 (pill T6).


## v071 — 19/08/2026 · bolo uniforme + saida "giro pra camera" (T2/T5)

- **T4**: bolo do heroi em ESPIRAL AUREA (phyllotaxis, r 118-300, esc
  0.52-0.72) — espacamento uniforme, cada icone no seu espaco (antes a
  distribuicao aleatoria amontoava).
- **T2/T5**: saida do celular trocada (era cair/subir): GIRO 3D real
  (SEQ-spin-t5, 1 volta em 0.6s) com o rig convergindo pro centro e
  ESCALANDO ate 640%% — "bate na camera" e o ultimo frame e a tela coral
  cheia, que conecta na cor do take seguinte. Cards/X/planilha fadam em
  0.12s no inicio do giro; still troca pelo spin em corte seco.
- Licoes: mover rig em Z real sofre clipping/projecao imprevisivel do
  renderer (usar SCALE); remover keys de position deixa o VALOR residual
  da ultima key (sempre resetar base explicita); AE aberto pelo Pedro nao
  tem o painel bridge (reinjetar boot) e pode estar em versao antiga
  (conferir app.project.file antes de rodar scripts!).
- Render parcial: so chunks 012/013/025/026/033 re-renderizados.


## v070 — 18/08/2026 · UNIFICACAO T1-T7 (silencios cortados + transicoes)

- **50-master.jsx** (rodar POR ULTIMO): corta os respiros (T1 5.85 / T2 11.15 /
  T3 8.75 / T4 9.30 / T5 8.85 / T6 inteiro / T7 14.90), encadeia na
  MASTER-3840x2160-30 a partir de 0.8 — T7 fecha em 75.27s (era 84.3, -9s).
- Saidas por elemento: T1 cena CAI (via CAM) + lettering sobe; T2 celular/
  cards/X CAEM + lettering sobe + dim apaga; T4 heroi+bolo p/ ESQUERDA,
  0,7% p/ DIREITA, sobreviventes caem, lettering sobe; T5 celular/cards
  SOBEM + lettering p/ esquerda. T3->T4 continua CONTINUO: T4 abre no
  angulo exato do corte do disco (5.24). T6->T7 = zoom-tunel (intocado).
- Audio: narracao-timeline MUTADA na master (cada take toca o proprio wav).
  T8 so reposicionado pro novo fim (75.27) — vinheta pendente.
- MASTER-3840x2160-31 e um WRAPPER acidental (T1 solto + master aninhada) —
  a master real e a -30.


## v069 — 18/08/2026 · grade completa em laranja sobrio

- **T7**: +40 colunas verticais — grade COMPLETA (23 fileiras x 40 colunas)
  crescendo do ponto da queda; cor das linhas coral-300 a 38% (3px), rotas
  de circuito coral-400 a 60% (5px), Glo2 0.85->0.3 (sem neon gritante),
  layer 62%.


## v068 — 18/08/2026 · rede neon completa (todos os pontos conectados)

- **T7**: +23 fileiras horizontais neon (4px, stroke 55%, atras das rotas)
  crescendo do x da queda pros 2 lados em onda a partir da fileira do
  impacto — todos os pontos da malha conectados; rotas verticais fecham a
  rede. Ops: painel do bridge morreu de novo com RAM do AE em 20.9GB —
  relancar AE + rodar scripts em chamadas SEPARADAS com app.purge antes.


## v067 — 18/08/2026 · circuitos neon a partir da queda

- **T7**: "T7V-circuito" — 10 rotas ortogonais snapadas na malha de 96px,
  partindo do ponto onde o celular caiu, desenhando com trim paths
  escalonados (7.25s+) + Glo2 neon coral; opacity 70, acima das malhas de
  pontos e atras de celular/legenda/fumaca.


## v066 — 18/08/2026 · matrix coral expandindo + heroi flat como a ref

- **T7**: segunda malha de pontos CORAL-600 por cima da ink, revelada por
  mascara radial (feather 560) que expande do ponto do impacto ate o fim do
  take — os pontos "acendem" em laranja num gradiente que cresce.
- **T4**: heroi FLAT (Glo2 removido — na referencia o destaque vem do
  contraste + clareira, o halo parecia adesivo); bolo mais cerrado (118-283)
  e wiggles menores (13/10) pra nao descentralizar da clareira.
- Ops: painel do bridge morreu apos o build anterior — AE relancado com o
  v065 + boot reinjetado (o -r durante o load do projeto se perde; reinjetar
  depois que a janela estabiliza).


## v065 — 18/08/2026 · linha cria o ranking + matrix visivel + sem sigla SP

- **T6**: a LINHA cria o ranking — cada barra nasce quando a bolinha passa
  nela (BH 3.62 / RJ 4.22 / SP 4.82, antes de 2.93-3.43); sigla "SP" de
  dentro da estrela removida (fica so a estrela ambar pousando na capital).
- **T7**: dot matrix mais presente (pontos 9px, opacity 16 — a 7 sumia no
  preview em meia resolucao).


## v064 — 18/08/2026 · zoom no corte + fumaca CC Particle World + drag pos-frase

- **T6 zoom**: comeca 14.0 e atravessa o buraco do B NO CORTE (15.65) — "por
  baixo de tudo isso" entra 0.2s depois junto da abertura ambar do T7 (tunel
  continua na narracao, sem tela parada). Interior do mergulho em AMBAR puro:
  Glo2 da estrela com keys (apaga 13.9->14.35; o add saturava ambar+ambar =
  amarelo-limao em tela cheia) e brilho-varredura fade 13.95->14.2.
- **T7 fumaca de verdade**: CC Particle World (burst 7 particulas no impacto,
  saindo do MEIO por TRAS do celular, Faded/esfera + blur 20, opacity 18,
  longevity 0.9 — bem sutil e curta, ink-300->500). Sprite/vetores antigos fora.
- **T7 drag pos-frase**: celular segura o CENTRO ate "produto novo." acabar
  (8.65) e so entao desliza pra direita (9.45); legenda retimada junto.
- **T7 dot matrix**: grade de pontos ink-900 sutil (op 7) acende NO impacto,
  full-screen atras de tudo (ar de interface tech); painel dotgrid-fone e
  grade constante do 48 removidos.


## v063 — 18/08/2026 · estrelas AMBAR + pouso na capital

- Estrelas (BH + SP + rastro) na cor AMBAR #F5A524 (print do Pedro; mesma do
  T7V-volta-ambar) — o amarelo-limao era o glow lavando: Glo2 reduzido
  (78/34/0.32 BH, 78/30/0.28 SP). Pouso da estrela de SP 45px pra ESQUERDA
  (SPX), em cima da capital; saida cadente e rastro partem do novo ponto.


## v062 — 18/08/2026 · T4 heroi como a referencia do Pedro

- Heroi menor (1.4x, pop 148%), aura SUTIL (Glo2 60/26/0.32) — coral nitido,
  nao "bola de sol"; bolo cerrado (raio 130-320: clareira pequena + massa
  densa, como a ref da multidao) e conjunto mais a ESQUERDA (HX 820).


## v061 — 18/08/2026 · rodada de ajustes do review do Pedro (7 frentes)

- **Glow global REMOVIDO dos takes claros (T2–T7)**: o adjustment "polimento"
  lavava mapa/cards/hairlines (mapa "brilhoso", cards do T7 invisiveis,
  estrela palida). Mantido so no T1 (dark). 48-polimento agora REMOVE o layer.
- **Cor de tela = Design System**: Change to Color (#E35F39 -> coral-600
  #DD4E27, transforming, shading preservado) em fone3d + spin do T2/T5 e
  fone3d + flip do T7.
- **T2**: t2.time=0 (fix do TELEPORTE no handoff spin->still — parent-preserve
  usava playhead); icone CIFRAO (circulo coral + $) no card Imposto; MALETA
  no card CNAE; card "Ano fiscal"+"3 ANOS DEPOIS" substituidos por CALENDARIO
  (argolas, cabecalho coral com meses passando, grade 7x4, dia coral pulando
  celula a celula 7.35->10.0).
- **T4**: icones em SO 2 CORES (ink-900 + coral-600, sem gradiente);
  "Menos de uma..." (6.66) -> HEROI voa pra esquerda vazia; "em cada cem."
  (7.95) -> BOLO de 99 icones ink pipoca em volta e o heroi cresce 186% com
  glow acendendo (1 em cada 100 literal).
- **T5**: t5.time=0; card Contador virou CALENDARIO animado (cabecalho coral
  com meses, grade 7x4, dia pulando 5.0->7.8).
- **T6**: linhas internas do mapa mais visiveis (5px/70%); DOURADO rico
  #FAAD14 nas 2 estrelas + rastro, glow reduzido (72/46/0.55) pra cor nao
  lavar; linha de tendencia SUAVE (tangentes Catmull-Rom + round join),
  badge 3a SO quando a linha termina (4.92), linha apaga DE TRAS PRA FRENTE
  (trim start 5.35->6.05) e bolinha sai junto (pop-out 6.12). FIX: vertices
  do path em espaco do layer (desenhava fora do quadro).
- **T7**: cards de volta (borda ink-300 + sombra nos 14 — o loop de sombra so
  cobria 7); fumaca densa confirmada.
- QC frame a frame em todos os takes. Handoff T2 conferido em 1.0667/1.1:
  zero pulo.


## v036–v058 — 18/08/2026 · T6/T7 impacto de marca + lettering APPLE global

- **T6 final**: zoom-in de cena atravessando o buraco do B do "BH" na estrela
  (zoomcam 50.000%, alvo viaja pro centro); estrela SP = tamanho da BH, cai e
  incorpora com sigla dentro, sai como ESTRELA CADENTE (arco + rastro + stretch).
- **T7 final**: volta do branco em círculo; contador 1→22 + 7 cards de tarefas
  em anel; celular entra em quadro e dá FLIP ÚNICO com a SEQUÊNCIA 3D real
  (spin-t5, 1 volta/1s), cai de tela pra cima no CENTRO; choque com shake de
  tela inteira + poeira radial de todos os cantos; arrastado pra direita com
  legenda indo pra esquerda. Tela = render NATIVO com splash baked
  (assets/iphone-t7-splash.png) — zero compositing.
- **LETTERING APPLE (todos os takes, 2 cores)**: modo "apple" no rig — frases
  curtas (2-3 palavras, pontuação fecha grupo), Text Animator (Scale 122→100 +
  Blur 42→0 + Opacity juntos), curva premium (influência 92 na chegada), corte
  seco na troca, palavra forte coral via range selector. Tam -20%.
- Lições NOVAS: parent-preserve usa o PLAYHEAD (t7.time=0 antes de construir!);
  1º grupo de shape pinta NA FRENTE; blend não pode trocar mapas base_*;
  OIDN sem RAM com AE aberto → denoise off + samples 96.
- Pagefile 13GB / disco 2.5GB — REBOOT obrigatório antes dos próximos renders.

## v033–v035 — 18/08/2026 · T6 refinos (direção Pedro)

- **v033**: RJ no mapa (contorno real, 64 pts); estrela de SP troca órbita por
  APROXIMAÇÃO (vem da câmera 340%→100% girando e pousa na capital).
- **v034**: colunas do gráfico ~35% maiores (360/455/580, GBASE 1620); pill
  "nasce em 11 horas" no canto superior direito.
- **v035**: estrela de BH DOURADA (amber DS #F5A524) com BRILHO varrendo 2×
  (grupo branco clipado por máscara em estrela); no "funciona em qualquer
  lugar" a pill 11h apaga e entra frase branca Bold 110 no rodapé.
- Incidente: 3 pipelines de render simultâneos (v033/034/035) — mortos,
  TIFFs limpos, re-render só do v035 (470 frames conferidos). Regra reforçada:
  SEMPRE matar o render anterior antes de lançar o próximo.

## v032 — 18/08/2026 · T6 v2: mapa REAL MG+SP (direção Pedro)

- Mapa com contorno geográfico REAL: GeoJSON público (click_that_hood
  brazil-states) → simplificação Douglas-Peucker (MG 199 pts, SP 132) →
  projeção equiretangular → `jsx/46-mapa-dados.jsx` (gerado; rodar ANTES do
  46-take-t6.jsx). MG+SP em BRANCO sólido, divisa interna coral 45%.
- Pino/labels/estrelas agora CORAL-600 (sobre mapa branco). BH e cidade de SP
  em coordenadas reais projetadas.
- Barras em ESCADA ASCENDENTE: BH (3ª, branca, badge) → RJ → SP.
- 9.29 estrelinha coral ORBITANDO São Paulo (null girando 690°, easing);
  12.47 estrela maior QUICANDO em BH (bounce decrescente 3 quiques — pedido
  explícito do Pedro; pino sai no impacto). Ramificações/estrelinhas antigas
  removidas. Pill "nasce em 11 horas" movida pra baixo do gráfico.

## v028–v031 — 17/08/2026 · T5 final + T6 "A VIRADA"

- **v028-v030 (T5 final)**: cards retos SEM rotação (rig rotY zerado) preenchendo
  a tela (770px, pilha 500/460/460); iPhone re-render 100% FRONTAL az0/el0;
  cantos 44; calendário do Contador = "Dez 26"→"Dez 27"→"Dez 28"→"Dez 29"
  (flip por ano — o "1 visita" contado pela imagem). T5 APROVADO.
- **v031 (T6)**: A VIRADA — coral-600 inunda em círculo de baixo (0.15s);
  silhueta de MG estilizada (low-poly em código; contorno IBGE fica como
  melhoria) com pino branco caindo em BH; gráfico SP/RJ (34%) × BH (branca,
  badge "3ª"); pill "nasce em 11 horas"; pino vira ESTRELA (9.29) e 7
  ramificações com trim-path espalham estrelinhas cintilantes ("funciona em
  qualquer lugar"). Lettering tema NOVO "coral" no rig (texto coral-50,
  secundário coral-200, forte = branco puro Bold), topo centro tam 92.
- Pipeline T6: 470 frames, 12 chunks de 40.

## v026–v027 — 17/08/2026 · T5 "planilha, caderno, contador" (v2 frontal)

- **T5 v2 (v027)**: iPhone re-renderizado QUASE FRONTAL (still-t2-iphone.py agora
  parametrizado: az/el via argv; assets/iphone-t5.png az8/el3) — celular
  centro-direita (FX 2400, esc 84), LEGENDAS À ESQUERDA (xc 980, tam 84).
  Cards 700px retos encaixados como lista de app: Planilha (tabela 4×4 fantasma
  financeiro completa), Notas (digita "pagar imposto amanhã" → apaga →
  "pagar imposto depois de amanhã"), Contador (JAN→DEZ em flip 0,16s/mês +
  snap "1 visita no ano" coral). Mancha coral sobe no respiro (prenúncio T6).
- Rig lettering: opção `tam` (fonte por take) — frase longa estourava margem.
- Lição: labels de card precisam de fade junto com a entrada do card.
- v026 = T5 v1 (celular esquerda estilo T2, grade torta) — substituído.
- ORDEM DOS TAKES confirmada nos dados: T5 ainda é problema ("E o resto?");
  a virada BH/Minas é T6+. Sempre ler timeline.json antes de conceber o take.

## v023–v024 — 17/08/2026 · T4 final: 6 sobreviventes em gradiente coral

- **v024 (aprovação pendente)**: no "0,7%" a multidão SOME de vez (vanish com
  escala) e sobram **6 ícones espalhados** (um por setor de 60°) que se ACENDEM
  em gradiente coral (300→800, esquerda→direita, keys de Fill Color) com pop
  1.75x; "0,7%" gigante ao lado. v023 (bolo de pizza + fantasmas) descartado
  por direção do Pedro.
- Operação: **disk cache do AE desligado por pref** ("Disk Cache Controls" >
  "Enabled 2" = 0 — só vale após restart do AE; purgar Temp\Adobe enquanto isso)
  e **pagefile inchou pra 10GB** (só devolve com reboot) → chunks de 40 frames
  (pico 1,3GB). Recomendado ao Pedro: reboot no fim do dia + limpar v001-v020.

## v020–v022 — 17/08/2026 · T3 giro+scrim e T4 "0,7%" (continuação)

- **v020 (T3)**: disco gira devagar após todos entrarem (Rotate Z 0→9°, ~2.2°/s,
  ease-in; direção Pedro). Nota ExtendScript: rotação 2D = "ADBE Rotate Z".
- **v021 (T4)**: continuação DIRETA do T3 — mesma seed LCG → layout idêntico da
  espiral; abre girando (9→13°, para no "disso?" 3.6s), card 7,4 MILHÕES apaga
  na pergunta, varredura aleatória apaga 149 de 150 ícones no "0,7%" (4.425s),
  sobrevivente único pulsa, "0,7%" coral-600 400px estampa à direita, pessoa
  coral some junto (ninguém cuida dela). Sem zoom (reunião 13/08).
  Nota ExtendScript: referência a Vector Group INVALIDA ao adicionar outro grupo
  — calcular layout antes, criar e keyar cada grupo na hora (duas fases).
- **v022 (T3)**: scrim de papel (feather 130, 90%) na faixa da legenda — ícones
  derretem sob o véu, legenda nunca é tampada (pedido Pedro).
- Pipeline: retry por chunk (3 tentativas); NUNCA rodar dois pipelines juntos
  (deletes de TIFF se atropelam — part0 do T3 saiu com 55/65 e foi consertado).

## v018–v019 — 17/08/2026 · T3 "7,4 milhões" (mundo papel, direção Pedro)

- T3 do zero (43-take-t3.jsx): abre FOCADO na pessoa coral (CAM 480%), zoom-out
  no "São" (2.55→5.9s). **v019**: multidão de 150 ícones ink-900 ("todos
  pretinhos") surgindo **1 a 1 em espiral dourada** (phyllotaxis, r 90→600, só o
  miolo da tela — nada de tela cheia) via keys de scale/opacity por Vector Group.
  Contador rola 1→7.400.000 (exponencial, sourceText) sobre card branco DS
  (dígitos pretos se camuflavam na multidão) e estala "7,4 MILHÕES" coral-600.
  Pessoa coral some engolida pela espiral no "vivendo exatamente assim".
- T3-LETTERING rebuild tema papel no topo (y2a 260 / y2b 420).
- v018 = versão com anéis em ondas (substituída pela espiral 1 a 1).

## v017 — 17/08/2026 · T2 movimento 3D + cards no design system (direção Pedro)

- **v015**: celular vira o RENDER 3D real (Blender/Cycles do iphone-b-preparado.blend,
  still-t2-iphone.py: 1600×2400 alpha, az 14°, splash coral na tela; textura quebrada
  do PC antigo consertada apontando pra telas-filme/01-N1-splash.png).
- **v016**: cards no DS real (levantamento identidade/referencia/* + telas): labels
  sentence case ink-900 peso 600 à esquerda ("Imposto do mês", "Código CNAE", "Ano
  fiscal"), radius proporcional ao radius-lg 16, hairline #E3DED7; contador
  1/2/3 ANOS DEPOIS acompanha os giros 2027/2028/2029, branco sobre coral.
- **v017**: mais movimento — celular gira continuamente pro lado (-10°→-25°) com
  coice a cada card que encaixa; câmera aproxima 100→110% até o freeze.
- Operação: cache de disco do AE (Temp\Adobe) chegou a 11GB e matou renders por
  falta de espaço; pipeline agora em 6 chunks de ~65 frames. Se render morrer com
  disco cheio: limpar %LOCALAPPDATA%\Temp\Adobe.

## v014 — 14/08/2026 · T2 v2 "iPhone 3D em tela branca" (direção Pedro, ultrathink)

- T2 refeito do zero na direção nova (inspiração da reunião 13/08: "cards animados
  dentro da tela do celular"): **fundo BRANCO papel** (#FAF8F5, quebra consciente
  do arco dark 1–5 por direção do Pedro), **iPhone entra em 3D** (rotY -38→-13,
  assenta à esquerda), **legenda à direita** (rig v2 parametrizado: tema papel =
  ink-900/#736E67/coral-600, xc 2780, wrap 1500px).
- Cards voam DA CÂMERA (voo em Z local -1650→0) e COLAM na tela: IMPOSTO · DAS
  digitando e apagando valores (sourceText em hold keys, cursor piscando),
  CÓDIGO · CNAE digitando/apagando códigos, ANO FISCAL girando 2026→2029 (flip
  rotX) + "1 ANO DEPOIS" coral, X CRIMSON estampando no freeze do "corrigir.".
- Lições 3D registradas: rig = null estático → parentar filhos → keys por último
  (parent-preserve infla escala/posição se o parent já tem keys); textos-filhos
  precisam de z explícito à frente do card (oclusão 3D).
- **Pipeline de render definitivo** (encoder H.264 MediaCore quebrado nesta
  máquina): aerender → "Sequência TIFF com alfa" em chunks de 97 frames → ffmpeg
  converte/apaga incremental → concat + wav do take. Script: scratchpad/t2-chunks.ps1.
- v013 = T2 v1 (cards dark empilhando) — substituído pela direção nova.

## v005 — 14/08/2026 · Lettering v2 + T1 v2 (direção do Pedro)

- **Lettering v2 em TODOS os takes** (feedback do Pedro sobre o t1_v001):
  ritmo de cor do design system — palavra FORTE de cada respiração em
  **coral-500 + Bold** (a flagada no JSON, senão a de peso), palavras curtas de
  apoio (≤3 letras) em cinza secundário #BDB8B0, demais em #F4F1EC. Animação
  mais viva: corrida 200ms y+56 scale 90→100 rotação alternada ∓4°; forte 400ms
  y+80 scale 84→100. ⚠️ SUBSTITUI a regra "máx 1 coral por take" da SPEC pras
  legendas (decisão do Pedro 14/08; âncoras-herói seguem a lista fechada).
- **T1 v2 — conceito novo**: cards estáticos assentando → **FEED ROLANDO** dentro
  do iPhone (madrugada, scroll contínuo de 8 cards skeleton com avatar, track
  matte arredondado); drift vivo do celular (posição + rotZ −1,4→1,0); na
  transição o scroll ACELERA e esvazia a tela com a câmera mergulhando (100→114).
- v004 (T1 v1, cards assentando) descartado como direção; arquivo mantido.

## v003 — 14/08/2026 · Fase 4 take 1/8: T4 "0,7%"

- `jsx/40-take-t4.jsx` (idempotente): campo de 3520 ícones de pessoa (1 shape
  layer + 2 Repeaters 80×44, pitch 48/49 — LOD da SPEC) em `PRE-icones-campo`;
  APAGÃO em varredura (Linear Wipe 90°, feather 400, 4,35→5,15s) deixando
  cluster 5×5=25 acesos registrado na grade (0,71% dos visíveis — honesto);
  âncora `0,7%` Sora-Bold 720px coral-500 com pop 250ms no onset do "Zero";
  micro-label fonte `PESQUISA DE MERCADO · 2026`; fileira de 100 (1 aceso maior,
  pop no "cem." 8,248s) + `MENOS DE 1 EM CADA 100`; scrim no terço inferior;
  drift de câmera 100→103%.
- Iteração de QC via see-frame: campo aceso 88→42%, dim 18→12%, varredura
  invertida pra encontrar o reveal do cluster, scrim adicionado, aceso ampliado.
- **Fix de fonte:** `Sora-Medium` enumera no app.fonts mas o text engine NÃO
  resolve (cai em serifa + "fontes ausentes" no aerender) → micro-labels em
  `Sora-SemiBold`. Regra: usar SOMENTE Sora-Regular/SemiBold/Bold (validadas).
- **Infra:** Sora registrada no HKLM (era só HKCU — aerender não enxergava);
  hibernação desativada (disco C estava com 0 bytes livres; +12,5 GB).
  aerender SEMPRE com `-mfr OFF 100` (MFR estourava RAM em 4K 16bpc).

## v002 — 14/08/2026 · Fase 3 (lettering kinetic)

- Rig completo dos 8 takes: 164 text layers (1 por palavra), 26 precomps de
  respiração (TN-Lk) + 8 palcos TN-LETTERING no topo de cada take.
- Fonte dos dados: `data/legendas/t1..t8.json` (texto de exibição do roteiro v4 +
  timing WhisperX; tokens numéricos distribuídos: "0,7%" → 5 palavras, "22" → 3).
- Spec B aplicada: Sora SemiBold 96px #F4F1EC, baseline terço inferior, wrap
  automático >2400px em 2 sublinhas (1780/1920). Peso (última palavra da
  respiração) = Bold, 400ms, scale 92→100 + y40; corrida 150ms opacity + y24;
  ease chegada speed 0 / influence 66. Saída da respiração em fade 250ms.
- Coral: só "ainda" (T5) — validação automática de máx 1 por take no gerador.
- Pesos estáticos (SemiBold/Bold) em vez de wght variable animado — fallback
  sancionado pela SPEC (risco "Sora variable no aerender"). TODO: testar wght
  animado num take antes da Fase 6.
- QC visual (see-frame): T4 (rig-validação), T5 (coral + wrap), T7 e T8 via
  MASTER — sync palavra↔narração conferido nos três níveis de aninhamento.
- Scripts: `tools/fase3-gera-legendas.py` → `jsx/31-legendas-data.jsx` (gerado) +
  `jsx/32-lettering.jsx` (builder idempotente por take).

## v001 — 14/08/2026 · Fase 2 (estrutura)

- Projeto **16bpc** (anti-banding da virada), master **93,0s / 2790 frames @30fps**
  (era 90,0/2700 na SPEC; durações reais da narração — Fase 1 — com respiros da
  reunião preservados; aprovado pelo Pedro em 14/08).
- `_CONTROLE`: null CORES com 10 Color Controls (page/card/texto/hairline dark,
  papel, coral-500/600, crimson, verde-check, warning).
- `MASTER-3840x2160-30`: T1–T8 aninhados nas posições da timeline (frames exatos:
  24 / 238 / 625 / 920 / 1226 / 1555 / 2025 / 2529), narração-timeline na base,
  GUIA-safe (camada-guia 3456×1944), FADE-PRETO-HEAD 0→0,8s.
- **23 comp markers** na MASTER: T*_IN + palavras-âncora word-sync (W_T3_74MI,
  W_T4_07PCT, W_T5_AINDA, W_T6_11H, W_T7_22ANOS, W_T8_AI etc.) + CORTE_SECO_PRETO
  (82,1s). Onsets de tokens numéricos ("22", "7") marcados como imprecisos —
  refinar no waveform ao animar.
- Precomps: PRE-phone-frame (outline hairline + SLOT-TELA), PRE-card,
  PRE-contador (slider + expressão pt-BR com pontos de milhar), PRE-mapa,
  PRE-lettering-rig, PRE-grade-grain (ruído 1,5%), PRE-mascote (**slot do T8**:
  nulls SLOT-MASCOTE/mascote_head/mascote_hand_R riggados — asset do Pedro entra
  por parenting sem retiming).
- Imports: narracao-timeline.wav + t1..t8.wav (cada take com seu áudio @0);
  SVGs nativos validados por see-frame — logo horizontal, símbolo, negativa
  **clara** (branca, pro dark) e negativa escura (pro papel). ⚠️ Correção vs SPEC:
  a nomenclatura estava invertida — **negativa-clara é a versão pro mundo dark**.
  5 telas travadas (assets/telas/_manifesto.json).
- Scripts idempotentes em `jsx/`: 00-tokens, 10-estrutura, 20-precomps, 30-imports.

Gerado na sessão de 14/08 via AE MCP. Fonte da verdade: jsx/ + data/ (git).
