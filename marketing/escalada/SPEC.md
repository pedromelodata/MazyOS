# Filme institucional "Escalada de Mercado" — Legalizai

## Contexto

Vídeo institucional novo (diferente do v9 MASTER de 38s): peça de pitch pra investidor com arco **confronto → impacto → esperança**, baseada na Proposta 1 "A Escada" do roteiro (`marketing\audio\Narração\roteiro-escalada-mercado_2.md`) e no storyboard aprovado na reunião de 13/08 com o time de vídeo e marca (`marketing\audio\Reuniao direcional video insti.md`). A narração já está gravada (ElevenLabs): `marketing\audio\Narração\Agora, enquanto você (1).wav` — WAV 48kHz mono, **75,65s**, contém os 8 blocos incluindo o fecho "Vai, legaliza aí". Os silêncios dramáticos do roteiro (~97s) não estão no áudio; serão montados na edição (alvo final ~88–92s).

## Decisões travadas (com o Pedro)

| Decisão | Valor |
|---|---|
| Estratégia | **AE-first híbrido**: os 8 takes nascem no After Effects 2026 via MCP; Seedance 2.0 (Higgsfield, 329 cr) só como textura/apoio pontual |
| Master | **16:9 3840×2160 (4K)**, 30fps |
| Arco visual | **Dark (#15171C) nos takes 1–5 → virada coral/papel (#FAF8F5 + coral) nos takes 6–8** |
| Mascote (take 8) | Pedro fornece o asset quando chegarmos no take 8; comp fica com placeholder/slot |
| Legendas | Lettering (kinetic typography) em Sora, word-by-word sync via WhisperX → keyframes AE via MCP |
| Música | Decidida por último (slot no mix com sidechain preparado) |
| Texto/logo | **ZERO texto ou logo vindo de IA generativa** (modelos alucinam glifos, PT-BR pior caso). Tudo tipográfico nasce no AE |

## Por que AE-first

- Storyboard da reunião é ~100% motion design: cards, ícones multiplicando, contador até 7,4mi, gráfico BH×SP×RJ, mapa MG/estados, lettering "22 anos", telas reais do app, mascote.
- Modelos de vídeo IA (ago/2026) seguem não-confiáveis pra tipografia exata; Seedance 2.5 na Higgsfield está capado em 720p; 329 créditos não bancam 8 takes IA (~520+/passada).
- AE 26: variable fonts animáveis (Sora é variable), SVG import nativo, 3D paramétrico com sombras — cobre o look "Apple keynote".
- Pipeline já provado no vault: ffmpeg conform CRF16, loudnorm -14 LUFS, telas 1290×2796, logos SVG, tokens dark completos.

## Fronteiras da narração no WAV (a refinar com WhisperX)

| Take | Texto | Janela no WAV |
|---|---|---|
| T1 | "Agora, enquanto você assiste isso..." | 0–8,0s |
| T2 | "Ela não sabe qual imposto..." | 8,9–18,4s |
| T3 | "E não é uma pessoa... 7,4 milhões" | 19,3–29,0s |
| T4 | "Sabe quanto... 0,7%... uma em cada cem" | 29,8–38,3s |
| T5 | "E o resto? Planilha. Caderno..." | 38,3–52,1s |
| T6 | "Vamos começar por Belo Horizonte..." | 52,8–63,2s |
| T7 | "Por baixo de tudo isso... prontos" | 63,9–72,1s |
| T8 | "Vai, legaliza aí." | 73,1–75,7s |

## Assets existentes (verificados)

- Logos: `identidade\logos\legalizai-logo-horizontal.svg` (master), `legalizai-logo-negativa-escura.svg` (dark); símbolo puro `legalizei-branding\simbolo.svg`. ⚠️ `legalizei-logo-app-fundo-solido.svg` tem wordmark ANTIGO dentro — nunca usar lockup completo dele.
- Telas do app: 80 PNGs 1290×2796 em `marketing\telas-app\` + 5 travadas em `marketing\telas-filme\`.
- Tokens: `identidade\tokens.css` — dark: page #15171C, card #1F2228, texto #F4F1EC, hairline #2E313A; gradientes ink-hero/scrim/metal/brand-glow; motion 150/250/400ms; coral 500 #F2643C (marca) / 600 #DD4E27 (ação).
- iPhone 3D: `marketing\filme\cena\iphone-b-preparado.blend`.
- Mascote: só inspiração (`insp\Suricato 1-3.webp`, `insp\Suricato Legalizai.mp4` 9:16) — sem vetor/alpha. Asset oficial virá do Pedro.
- AE MCP bootstrap: `marketing\filme\ae\boot-mcp-bridge.jsx`, `enable-scripting.jsx`.

## Regras de marca no vídeo (hard rules)

1. Sora em tudo; nunca outra fonte.
2. Coral só como beat marker/ação; coral-500 nunca vira fill de botão; branco sobre coral-600 só ≥18,66px bold (AA).
3. NUNCA azul. Erro = crimson #E03E43 + forma. Check/sucesso = #17A06A.
4. NUNCA travessão (—/–) em texto visível.
5. Wordmark sempre "Legalizai"; no fecho, o "AI" acende em coral #F2643C na sílaba tônica do "aí".
6. Sem sombras decorativas (hairline borders); raios 16/12/8; ease-out sempre; nada de bounce.
7. Dark→coral é reversão consciente da decisão de fundo bege de 12/08 (registrar no ADR ao executar).

---

## Timeline mestre (~89,5s)

Narração fatiada nos limites de take e deslizada pra frente (silêncios adicionados na edição):

| Take | Fonte WAV | Filme (in–out) | Respiro após | Nota |
|---|---|---|---|---|
| head | — | 0,00–0,80 | | fade-in do preto |
| T1 | 0,00–8,00 | **0,80–8,80** | 1,5s | |
| T2 | 8,90–18,40 | **10,30–19,80** | 2,0s | corte interno dramático |
| T3 | 19,30–29,00 | **21,80–31,50** | 1,2s | mesma tela que T4 |
| T4 | 29,80–38,30 | **32,70–41,20** | 1,5s | T4/T5 colados no WAV — cortar |
| T5 | 38,30–52,10 | **42,70–56,50** | 2,5s | **A VIRADA** dark→coral |
| T6 | 52,80–63,20 | **59,00–69,40** | 1,5s | mundo papel/coral |
| T7 | 63,90–72,10 | **70,90–79,10** | **2,2s PRETO+SILÊNCIO** | corte seco |
| T8 | 73,10–75,70 | **81,30–83,90** | cauda 5,6s | logo hold + fade out |

Curva de trilha (entra por último): pulso → baixo → percussão → suspensão → cordas → resolução na virada (58,6) → camada cheia → topo → MUDO (79,1) → hit único no check do suricato (~83,0).

**Regra de sincronia:** timings de palavra são estimativas ±0,3s. Antes de animar: waveform + `add-markers-bulk` com um marker por palavra-âncora; todo keyframe de lettering referencia marker, nunca número solto.

## Spec por take (resumo executável — direção da reunião)

- **T1 Madrugada** (dark): outline de iPhone hairline, cards skeleton flutuantes assentando na tela em onsets de palavra; micro-label `03:12`; zero coral. Transição: câmera aproxima, cards flipam revelando dúvidas.
- **T2 Dúvidas**: cards `Qual imposto?`, `CNAE 6201·5?` (chip warning #F5A524), micro-labels `JAN→DEZ→1 ANO DEPOIS`; em "corrigir" card `Prazo encerrado` (crimson #E03E43 + ícone) e freeze. Transição: cards apagam como luzes, sobra avatar → vira ícone de pessoa.
- **T3 7,4 milhões**: ícone solo → zoom out pra campo de ícones (LOD A/B/C via Repeater + CC RepeTile, nunca 1 layer/ícone) + contador rolando 1→7.400.000 (text layer + slider + expressão pt-BR), snap pra `7,4 MILHÕES` **coral-500** + micro-label fonte (Receita Federal · dez/2024). SEM transição pro T4 (mesma tela, regra da reunião).
- **T4 0,7%**: mesma câmera; apagão em varredura (matte animado) deixando cluster de ~25 acesos (proporção honesta de 0,7% dos ~3.500 visíveis); âncora `0,7%` coral-500 720px AO LADO do cluster; fileira de 100 ícones com 1 aceso (`MENOS DE 1 EM CADA 100`). Transição: mergulho de volta pro outline do iPhone.
- **T5 Planilha/Caderno** (13,8s — take mais longo): 3 atos (pergunta no vazio → planilha ESQ + caderno DIR entrando simultâneos em "planilha" → card calendário 12 meses). "**ainda**" acende coral-500 na legenda (único coral não-numérico); check verde #17A06A no único mês visitado (`1x POR ANO`). Regra: nunca >1,5s sem micro-evento. Transição = **A VIRADA**: cards caem, ponto coral-600 despenca (ease-in, gravidade), impacto → onda circular de papel #FAF8F5 com anel coral engole o dark, silhueta de MG se desenha, ponto vira pino sobre BH.
- **T6 BH** (papel): pino + ripple; âncora `BELO HORIZONTE`; gráfico barras BH×SP×RJ (BH coral-600, badge `3ª`, fonte REDESIM); chip `11 HORAS` coral-600 branco bold; pino vira estrela + ramificações coral pra silhuetas de estados com estrelas menores (stagger 120ms). Transição: mergulho na estrela → brilho vira papel do T7.
- **T7 22 anos + produto** (denso): lettering `22 ANOS` coral-600 560px assenta LOW ("por baixo"); iPhone 2.5D desce POR CIMA com splash → home; strafe lateral de MÁX 4 telas reais (`telas-app\` 1290×2796); lettering final 2 linhas com "MAIOR" e "BRASIL" em coral-600. Fecho: **corte seco pro preto** (79,10).
- **T8 Suricato + logo**: preto 2,2s → papel POP (4 frames); suricato entra da esquerda (350ms + settle; personagem pode mini-overshoot); mão desenha check coral-600 no ar (trim path, mesmo ângulo do check do logo); check voa e assenta no símbolo; wordmark reveal por máscara; **"AI" acende coral-500 na sílaba tônica do "aí" (~83,20)** com brand-glow + pulso; suricato sorri; hold; fade out. **Placeholder riggado em nulls (root/hand_R/head) — timing todo feito agora, asset do Pedro entra por parenting sem retiming.**

## Sistema de lettering (Sora, px em 4K)

| Papel | Spec | Uso |
|---|---|---|
| A · Âncora/número-herói | Sora 700, tracking -2%; números 560–720px, texto 280–360px; centro óptico y≈46% | Máx 1 por take; só números-chave e vereditos |
| B · Legenda corrida | Sora 600, 96px, máx 2 linhas ×2400px, terço inferior (baseline y 1780–1960) | Fio contínuo word-by-word |
| C · Label micro | Sora 500, 48px, CAPS, tracking +8%; canto sup. esq. ou sob a âncora | Contexto/fonte de dado; separador `·` nunca travessão |

Word-by-word: opacidade 0→100 + y +24→0 em **150ms ease-out** no onset (marker); âncoras 250ms com scale 96→100; tracking "respira" +2%→0; frase sai em fade 250ms. Sem motion blur no texto, sem overshoot. Safe area: 3456×1944 central.

**Lista fechada de onde o coral acende:** `7,4 MILHÕES` · `0,7%` · `ainda` · badge `3ª` · `11h` · `22 ANOS` · `MAIOR`/`BRASIL` · `AI` do wordmark. Dark = coral-500; papel = coral-600. Mais nada.

## Riscos criativos (mitigações no spec)

1. **T5 longo (13,8s)** → 3 atos + micro-eventos ≤1,5s + push-in contínuo 4%.
2. **Milhares de ícones (T3/T4)** → shape layer + 2 Repeaters → precomp tile → CC RepeTile; 3 LODs trocados por corte de escala; collapse OFF; motion blur OFF; contador = 1 text layer + expressão.
3. **Banding na virada** → círculo shape vetorial (não Radial Wipe), 16bpc, grain 1,5–2%.
4. **T7 denso** → máx 4 telas no strafe, layout 40/60, corte seco fecha.
5. **Honestidade do 0,7%** → proporção real no cluster + fileira de 100 auditável + fontes em micro-label.
6. **Mascote sem asset** → nulls riggados agora, parenting depois, zero retiming.

*(Nota: timings em segundos; na execução tudo snapa pra múltiplos de 1/30s. Master comp = 3840×2160 @ 30,000fps, 2700 frames = 90,0s, com folga na cauda.)*

---

## Pipeline de execução

### Estado verificado da máquina (13/08)

| Item | Status |
|---|---|
| Defender Controlled Folder Access | **LIGADO**; whitelist dos exes do AE pendente (bloqueia o bridge) |
| Fonte Sora | **NÃO instalada no Windows** (AE não a enxerga) |
| Bridge do AE MCP (`mcp-bridge-auto.jsx`) | **NÃO instalado** — `Roaming\Adobe\After Effects\26.3\Scripts\ScriptUI Panels\` nem existe |
| Whisper/WhisperX | **NÃO instalado** (Python 3.12 disponível) |
| GPU | **Só Radeon integrada** (RTX 3060 não está mais na máquina) → render 4K em CPU |
| aerender | OK (`C:\Program Files\Adobe\Adobe After Effects 2026\Support Files\aerender.exe`) |
| ffmpeg 8.1.1 | OK no PATH |
| Higgsfield | Plus, 329,05 créditos |

### Estrutura nova: `marketing\filme\escalada\`

```
escalada\
  ae\        escalada-master_v001.aep (saves incrementais) · CHANGELOG.md
  jsx\       00-tokens.jsx · 10-estrutura.jsx · 20-precomps.jsx · 30-lettering.jsx · 4N-take-tN.jsx · 90-utils.jsx
  data\      tokens.json · words-master.json · timeline.json · legendas\t1..t8.json
  audio\     narracao-master.wav (cópia) · takes\t1..t8.wav · narracao-timeline.wav
  assets\    telas\ · svg\ · mascote\ (slot vazio — asset do Pedro)
  seedance\  prompts\ · takes\ · aprovados\
  previews\  tN_v00X.mp4 · qc\
  render\    master\ · entregas\
  tools\     .venv (whisperx) · gera-tokens.mjs · monta-timeline.mjs · mux-final.mjs
```

Fonte da verdade em texto (jsx+json, git); o .aep é artefato reconstruível. Scripts jsx **idempotentes** (apagam e recriam o que é seu).

### Fase 0 — Gate: destravar AE MCP (bloqueia tudo)

1. **Pedro, PowerShell admin:** `Add-MpPreference -ControlledFolderAccessAllowedApplications` pra `AfterFX.exe`, `aerender.exe`, `TeamProjectsLocalHub.exe` (em `C:\Program Files\Adobe\Adobe After Effects 2026\Support Files\`).
2. **Instalar Sora** variable (`Sora[wght].ttf` do Google Fonts) **"para todos os usuários"** (aerender enxerga). Plano B offline: extrair woff2 embutido de `identidade\design-system.html`.
3. **Instalar o bridge** do after-effects-mcp em `Roaming\Adobe\After Effects\26.3\Scripts\ScriptUI Panels\` (criar a árvore) + rodar `enable-scripting.jsx`.
4. **Smoke test:** `check-bridge` → comp descartável → text layer Sora com "Legaliza aí" (valida fonte+UTF-8) → `see-frame` → `inspect-layer` (fonte ≠ fallback) → aerender 1s (valida CFA no aerender).
5. Teste GPU: cena 3D simples; ao primeiro artefato → Mercury Software Only.

### Fase 1 — Áudio (WhisperX + fatiamento)

1. venv Python 3.12 + `pip install whisperx` (CPU basta pra 76s).
2. `whisperx --model small --language pt --align_model jonatasgrosman/wav2vec2-large-xlsr-53-portuguese --output_format json` → `words-master.json` word-level.
3. Diff contra o roteiro; conferir à mão os 4 números por extenso (alinhamento fragmenta números).
4. Refinar fronteiras (silencedetect -35dB cruzado com words) e snapar pra 1/30s → `timeline.json`.
5. Fatiar 8 takes (`atrim` sample-accurate) + montar `narracao-timeline.wav` com os silêncios da timeline mestre (concat + anullsrc).
6. QC: ouvir; conferir que o "aí" cai no frame do acendimento do AI.

### Fase 2 — Estrutura AE

1. `gera-tokens.mjs`: `tokens.css` → `tokens.json` (hex resolvidos, gradientes, motion 150/250/400ms, radii). Híbrido: jsx aplicam valores literais + comp `_CONTROLE` com ~10 Color Controls nomeados pra ajuste global via expressão.
2. Comps: `MASTER-3840x2160-30` + `T1`..`T8` + precomps: `PRE-phone-frame`, `PRE-card`, `PRE-contador` (slider + expressão formato pt-BR), `PRE-mapa`, `PRE-lettering-rig`, `PRE-grade-grain`, `GUIA-safe`, `PRE-mascote` (**slot do T8**: null `SLOT-MASCOTE` posicionado; asset entra por replace/parenting sem retiming).
3. Imports: SVGs nativos (logos, símbolo — validar com see-frame; fallback PNG @4x), telas PNG selecionadas via `_manifesto.json`, áudio + `add-markers-bulk` (um marker por palavra-âncora, nomes `W_T4_07PCT` etc.).
4. Versionamento: save incremental v001→v00N a cada marco + `CHANGELOG.md`; git versiona jsx/json/md. Save antes de qualquer batch destrutivo.

### Fase 3 — Lettering (legendas kinetic)

1. `words-master.json` + timeline → `legendas\tN.json`: palavras com t_in/t_out relativos ao take, linhas = quebras de respiração do roteiro v4, cada palavra `anchor`|`run`.
2. **Rota: ExtendScript batch** (`30-lettering.jsx` lê JSON, cria tudo numa chamada `execute-script` por take). Descartado keyframe-a-keyframe via MCP (centenas de round-trips).
3. Rig: 1 text layer por palavra agrupado em precomp por respiração. Âncora: 400ms ease-out, scale 92→100, y 40→0, **wght da Sora variable 300→700**; corrida: 150–250ms, opacity+y. Temporal ease influence ~66%, speed 0 na chegada.
4. Hard rules no script: Sora ou falha alto; máx 1 palavra coral por take (lista fechada); nunca travessão; texto dark = #F4F1EC (nunca branco puro); validação de tamanho mínimo AA.
5. QC: see-frame nos t_in das âncoras + meio das respirações; Claude confere palavra/cor/margem contra GUIA-safe.

### Fase 4 — Loop de produção por take

**Ordem: T4 → T3 → T5 → T2 → T1 → T6 → T7 → T8** (T4 é tipografia pura, valida o rig; T8 por último aguardando o mascote do Pedro — estrutura/slot prontos desde a Fase 2).

Por take: build jsx → QC Claude (see-frame 4–6 tempos + contact-sheet + match-reference vs styleframes) → ajuste fino (`batch-set-layer-properties`) → **preview 1080p half-res com áudio pro Pedro aprovar** (aerender + mux ffmpeg, minutos por take) → save incremental + CHANGELOG → próximo. Ao final: preview da MASTER inteira 1080p com narração (primeira vez do filme inteiro).

### Fase 5 — Takes IA opcionais (Seedance 2.0)

Critério (só gera se 3× sim): elemento figurativo/orgânico demais pra vetores? Fica ATRÁS do lettering? Especificável com start/end frame dos nossos styleframes? Candidatos por valor: **T6 BH acordando** > T1 madrugada > T7 textura escritório. Máx 3 takes.

Parâmetros herdados de `specs-v2-seedance20.md`: `seedance_2_0` std 1080p 16:9, `generate_audio:false`, `bitrate_mode:high`, NEGATIVE do vault **+ "no text, no letters, no numbers, no typography"**. Cotar via `models_explore` antes. **Teto: 150 dos 329 créditos.** Sem upscale 4K (fundo 1080p→4K com grain/scrim por cima). Composição: mp4 sob o lettering + `--gradient-scrim` + grade + grain. Decisão final: lado a lado vs versão AE-pura, Pedro escolhe.

### Fase 6 — Render final e mix

1. Master: comps aninhadas na MASTER; `aerender` → **ProRes 422 HQ 4K sem áudio**, em 2–4 segmentos retomáveis (`-s`/`-e`). Estimativa CPU: 1,5–4,5h (overnight).
2. Áudio (`mux-final.mjs`): narração → loudnorm 2-pass **-14 LUFS / -1,5 dBTP**, dual-mono 48kHz. **Slot de trilha com sidechaincompress keyado pela narração já montado** — quando o Pedro escolher a música (por último), re-roda só o script, sem re-render de vídeo.
3. Entregas: ProRes 4K (mezanino) + H.264 CRF14 veryslow 4K + 1080p, bt709 sem tonemap.
4. QC final: 2700 frames exatos; sync "aí"↔AI frame a frame; `ebur128`; passe visual em cada âncora; checklist de marca (zero azul, zero travessão, zero sombra, coral só na lista fechada, wordmark "Legalizai").

## Riscos técnicos

| Risco | Mitigação |
|---|---|
| GPU só integrada + driver AMD recente | Smoke 3D no Gate 0; Mercury Software Only ao 1º artefato; motion blur só em camadas-chave; previews half-res |
| Render 4K CPU lento | Master overnight, segmentado retomável |
| Bridge degrada em sessão longa | jsx idempotentes; save incremental antes de batch; renders via aerender (fora do AE aberto) |
| CFA reverte em update do Windows | Smoke do Gate 0 é o teste de regressão; pipeline vive em C:\Projects (não protegido) |
| Sora variable instável no aerender | Fallback: pesos estáticos (Regular/SemiBold/Bold) com cut |
| WhisperX fragmenta números por extenso | Conferência manual dedicada na Fase 1 |
| SVG import achata gradiente | Logos são paths simples; validar see-frame; fallback PNG @4x |
| Mascote atrasa | T8 aprovável com slot; troca por parenting sem retiming |

## Verificação end-to-end

1. Gate 0: see-frame com Sora correta + aerender sem erro de I/O + zero alertas no Defender.
2. Fase 1: escuta da timeline montada; words-master bate com roteiro.
3. Por take: preview 1080p com áudio aprovado pelo Pedro.
4. Master: preview 1080p inteiro aprovado → só então render 4K.
5. Entrega: QC de marca frame a frame nas âncoras + loudness medido.

## Fora de escopo (agora)

- Trilha sonora (decisão por último; slot pronto no mix).
- Variante 9:16 (deriva do master depois, se pedida).
- Emenda com a vinheta v7 (slot documentado; decidir na montagem final).
- Registro no ADR da reversão dark (fazer ao executar).
