# INVENTÁRIO DE PRODUÇÃO 9:16 · o que esta máquina entrega hoje

Levantamento feito em 24/08/2026 direto no disco, no git, nos 383 logs de render do After Effects e na conta Higgsfield. Tudo abaixo foi verificado, não inferido. Onde é estimativa, está marcado.

---

## 0. Veredito em seis linhas

1. **O pipeline do escalada é reciclável, mas em duas velocidades:** os módulos genéricos (tokens, estrutura, precomps, imports, rig de lettering, contador, polimento) portam pra 9:16 com pouca cirurgia. Os oito take-scripts são código de conceito, descartáveis.
2. **A máquina mudou desde a SPEC:** a **RTX 3060 12 GB está de volta** (driver 591.86, 0 MiB em uso). A SPEC e o brief dizem "só Radeon integrada". Está desatualizado.
3. **O gargalo real não é render, é DISCO: 1,8 GB livres de 110,7 GB, num único volume C:.** Isso hoje reprova qualquer render de sequência. É o item número um a resolver antes de escrever a primeira peça.
4. **Render de 20s em 1080x1920 custa entre 4 e 15 minutos**, extrapolado de 18.070 frames 4K realmente renderizados (1,09 s/frame médio). Render nunca vai ser o limite.
5. **Higgsfield: 96,62 créditos compram exatamente 2 planos Seedance na configuração mais barata (45 créditos cada) e zero retakes.** O histórico da conta mostra 45 / 54 / 63 / 90 / 108 por geração. Não são "2 ou 3 planos", são 2 tiros sem munição de reserva.
6. **Existe uma segunda pista 9:16 já provada e esquecida:** HTML + Playwright, que produziu `legalizai-15s-9x16-4k-mudo.mp4` (2160x3840, 60fps, 15s). Ela é muito mais rápida que ExtendScript para peça tipográfica pura.

---

## 1. Tabela "Pronto pra usar hoje"

### 1.1 Núcleo AE reciclável (fonte da verdade em git)

| Arquivo | O que faz | Reuso em 9:16 |
|---|---|---|
| `c:\Projects\Legalizei_Videos\marketing\filme\escalada\jsx\00-tokens.jsx` | Cria comp `_CONTROLE` com null `CORES` e 10 Color Controls nomeados (page-dark, card-dark, texto-dark, hairline-dark, papel, coral-500, coral-600, crimson, verde-check, warning). Idempotente. Função `hexToRgb()`. | **100% direto.** Independe de resolução. |
| `c:\Projects\Legalizei_Videos\marketing\filme\escalada\tools\gera-tokens.mjs` | Parseia `identidade\tokens.css` e emite `data\tokens.json` com light + dark resolvidos, motion 150/250/400ms (5/8/12 frames), radii 8/12/16/24, régua de lettering. | **100% direto.** Só trocar o bloco `filme.master` e a régua `lettering`. |
| `...\jsx\10-estrutura.jsx` | Cria MASTER 3840x2160 2790f, T1..T8 aninhados nos frames exatos, `GUIA-safe` como camada-guia, `FADE-PRETO-HEAD`. Helpers `findItem() / removeItem() / findOrCreateFolder()`. Organiza pastas 01-COMPS / 02-PRECOMPS / 03-ASSETS / 04-AUDIO. | **Estrutura sim, números não.** Ver §6. |
| `...\jsx\20-precomps.jsx` | `PRE-phone-frame` (outline hairline 1350x2860 raio 180 + null `SLOT-TELA`), `PRE-card` (1160x680 raio 16, card-dark + hairline), **`PRE-contador`** (null `CTRL` com Slider "Contador" + text layer com expressão de milhar pt-BR), `PRE-mapa`, `PRE-lettering-rig`, **`PRE-grade-grain`** (adjustment com ADBE Noise 1,5%, anti-banding), `PRE-mascote`. Helper `rrect()` (retângulo arredondado com fill, stroke e raio). Seta o projeto em **16bpc**. | **Alto reuso.** Só reescalar dimensões. O `PRE-mascote` sai fora nesta leva. |
| `...\jsx\30-imports.jsx` | Importa áudio (timeline + takes), os 3 SVGs de marca e as 5 telas travadas. Helper `importa()` idempotente que remove o item homônimo antes. | **100% direto**, só trocar a lista de arquivos. |
| `...\tools\fase1-processa.py` | WhisperX word-level → `timeline.json`, fatia os takes com `atrim` sample-accurate, monta `narracao-timeline.wav` com `adelay + anullsrc + amix`. Fronteiras por âncora de conteúdo, snap 1/30s. | **Direto** para peça multi-bloco. Para peça de 20s de bloco único, usar só a parte de alinhamento. |
| `...\tools\fase3-gera-legendas.py` | Casa o texto de exibição do roteiro com os tokens do WhisperX, distribui números por extenso (`0,7%` vira 5 palavras), marca `peso` na última palavra da respiração, marca `coral`, **valida travessão e valida máximo de coral por take**, e emite `jsx\31-legendas-data.jsx`. | **Direto.** É o único lugar do pipeline que já checa regra de marca automaticamente. |
| **`...\jsx\32-lettering.jsx`** | **A joia da coroa.** Rig de legenda queimada word-by-word, dois modos. Modo padrão: 1 text layer por palavra, agrupado em precomp por respiração, palavra forte em coral + Bold, apoio (<=3 letras) em cinza secundário, corrida 200ms com y+56, scale 90 para 100 e rotação alternada -4/+4, forte 400ms com y+80 e scale 84 para 100, ease de chegada com speed 0 e influence 66, saída da respiração em fade 250ms, quebra automática em 2 linhas. **Modo `apple`**: agrupa em frases de 2 a 3 palavras, usa Text Animators (Scale 3D + Opacity + Blur juntos), curva rápida na entrada (influence 28) e desaceleração longa (influence 92), animator separado com `ADBE Text Selector` por percentual para pintar só a palavra forte. Parametrizado por `$.global.LETTERING_OPCOES`: `tema` (dark / papel / coral), `tudoBranco`, `duasCores`, `tam`, `larguraMax`, `xc`, `y1`, `y2a`, `y2b`, `modo`, **`zonas`** (posição da legenda por fase do take). | **Alto reuso, mudança de 3 linhas.** Ver §6. |
| `...\jsx\48-polimento.jsx` | Acabamento global idempotente com detecção de efeito já aplicado (`temFx()`): `sombra()` Drop Shadow, `brilho()` Glow, `blurOn()` motion blur, `tilt()` rotação Y 3D em chip, `dotGrid()` (elipse + Repeater X e Y, fundo de dados), `corTela()` Change To Color, extrusão fake de mapa, `rmPolimento()` para reverter. | **100% direto.** É o passe de qualidade que separa "esquema" de "peça". |
| `...\jsx\54-contador-fix.jsx` | Contador com texto keyframado (`fmt()` com separador de milhar), curva exponencial de rolagem, e **Directional Blur vertical animado 0 → 26 → 0 durante a rolagem** (efeito slot machine). | **Direto.** Vira contador de preço (R$19, R$49, R$79, R$139) e de anos (22). |
| `...\jsx\52-fumaca-t7.jsx` | Fumaça fluida sem partículas: solid + Fractal Noise (contraste 150, brilho -35, evolution 0 → 700 graus, offset de turbulência subindo) + máscara elíptica animada com feather 200 + Gaussian Blur 16. Helper `elipse()` (bezier k=0,5523) e **`fxProp()` que acha propriedade de efeito por nome pt-BR ou matchName, recursivo**. | **Direto.** `fxProp()` sozinho já vale o arquivo: resolve o problema de AE em português. |
| `...\jsx\50-master.jsx` | Encadeamento da master, `giroCamera()` (giro 3D de uma volta com escala convergindo até estourar o quadro), `sai()` (saída coreografada por elemento com `easeSaida()` que acelera na saída), `painel()` (**transição SWIPE de dois painéis coral, lead 300 e lag 600, rotação -8 graus, motion blur**), zoom-ponte com ponto fixo. | **Alto reuso conceitual**, código precisa de porte. O swipe é a transição de corte mais reutilizável do acervo. |
| `...\jsx\53-lettering-t8-cores.jsx` | Percorre precomp recursivamente e repinta text layers por critério ASCII, sem depender de acento nem encoding. É como o "ai." vira coral. | **Direto**, é o mecanismo do "AI acendendo". |
| `...\jsx\46-mapa-dados.jsx` | Contornos reais de MG, SP e RJ em GeoJSON simplificado por Douglas-Peucker, já em coordenadas de comp 4K, mais os pontos de BH e São Paulo. | Direto se algum criativo usar mapa. Coordenadas em espaço 3840x2160, precisam de fator de escala. |

### 1.2 Assets prontos

| Caminho | O que é | Nota de uso |
|---|---|---|
| `c:\Projects\Legalizei_Videos\identidade\logos\legalizai-logo-horizontal.svg` | Master, viewBox 659,73x130, **tricolor** (ink `#1b1e24` + branco + coral `#f2643c`). O "ai" já nasce coral. | **Fundo claro (papel).** É o único que permite o "AI acendendo" sem recortar path. |
| `...\logos\legalizai-logo-negativa-clara.svg` | Monocromático **branco** `#fff`. | **Fundo escuro.** Confirmado no CHANGELOG v001: a nomenclatura da SPEC estava invertida, clara é a versão pro mundo dark. |
| `...\logos\legalizai-logo-negativa-escura.svg` | Monocromático **ink** `#1b1e24`. | Fundo claro, versão de uma cor só. |
| `...\logos\legalizei-logo-app-fundo-solido.svg` | Quadrado coral com check. **Wordmark interno é o antigo "Legalizei".** | Usar **só o quadrado recortado**, nunca o lockup. |
| `c:\Projects\Legalizei_Videos\legalizei-branding\simbolo.svg` | Símbolo puro. | Base da vinheta 3D. |
| `c:\Projects\Legalizei_Videos\identidade\tokens.css` | 187 linhas, duas camadas (primitivos + semânticos), bloco `[data-theme="dark"]` completo, 4 gradientes (ink-hero, scrim, metal, brand-glow), radii e durações. | Fonte dos jsx via `gera-tokens.mjs`. |
| `c:\Projects\Legalizei_Videos\marketing\filme\escalada\assets\iphone-t2.png` / `iphone-t5.png` / `iphone-t7-splash.png` | **iPhone renderizado no Blender Cycles, 1600x2400 PNG com alpha**, três ângulos (3/4, frontal reto, com splash). | Mais que suficiente para 1080x1920. Evita construir moldura vetorial. |
| `...\assets\spin-t2\` (36 PNGs) e `...\assets\spin-t5\` (33 PNGs) | **Sequência de giro 3D do iPhone**, 1600x2400 com alpha. | Giro de aparelho pronto, custo zero de render 3D. |
| `c:\Projects\Legalizei_Videos\marketing\vinheta\out\vinheta-9x16-4k60-v2.mp4` | **Vinheta "O Check" em 2160x3840, 60fps, 9,32s, 41 MB.** Logo ident completo: símbolo 3D caindo como carimbo, check se desenhando, wordmark revelando, "ai" acendendo, mão clicando, palco rasgando. | **Já é 9:16.** Serve como end card recortado (usar os últimos 2 a 3s) sem render nenhum. Grade de 116 BPM em `marketing\vinheta\timing.json`. |
| `c:\Projects\Legalizei_Videos\marketing\styleframes\src\base.css` + `sf1/sf2/sf3.html` | **Sistema de design 9:16 em HTML/CSS já construído em 1080x1920**: mockup de aparelho com moldura metálica, glare de vidro, cards flutuantes com perspectiva 2200px, tokens de marca. Renderizados em `sf1.png`, `sf2.png`, `sf3.png` a **2160x3840**. | Base pronta da pista HTML. Importa Sora do Google Fonts (precisa de rede no render). |
| `c:\Projects\Legalizei_Videos\marketing\filme\styleframes\` | 6 styleframes 16:9 (`f1-hook` a `f6-fecho`), incluindo **`f5-preco.png` "preço fechado na tela"**. | Referência de composição de preço, e alvo do `match-reference` do MCP. |
| `c:\Projects\Legalizei_Videos\marketing\final\9x16\legalizai-15s-9x16-4k-mudo.mp4` | Peça de 15s já entregue em 2160x3840 60fps. Fonte em `marketing\final\src\final-18s.html` (1080x1920, arquitetura `window.__render(t)` / `window.__dur`). | **Prova de que a pista HTML fecha uma peça 9:16 inteira.** |
| `c:\Projects\Legalizei_Videos\marketing\filme\escalada\audio\Trilha\` | 7 faixas Epidemic Sound, **3 delas com STEMS separados** (bass / drums / instruments / melody): "Brand New Beginning", "A Step Ahead", "Light Years". Mais 3 mp3 novos ainda não commitados (Glorious, Palmy Sway, Spacesuit Suite). | Stems permitem montar envelope por camada, foi assim que o v104 resolveu a trilha sem ducking. |
| `c:\Projects\Legalizei_Videos\marketing\filme\escalada\tools\.venv` | venv Python 3.12 com **WhisperX instalado** (2,3 GB, torch incluso). | Word-sync funciona hoje. Também é o maior consumidor de disco recuperável. |
| `c:\Projects\Legalizei_Videos\marketing\filme\escalada\tools\Sora-wght.ttf` | Sora variable, cópia local. | Já instalada no Windows: registrada em **HKLM** e HKCU. `aerender` enxerga. |

### 1.3 Ferramentas ativas

| Ferramenta | Estado verificado hoje |
|---|---|
| After Effects 2026 (26.3) | Instalado. `aerender.exe` em `C:\Program Files\Adobe\Adobe After Effects 2026\Support Files\`. **Não está aberto agora.** |
| Bridge MCP | `mcp-bridge-auto.jsx` presente em `C:\Users\EDIT-ADMIN\AppData\Roaming\Adobe\After Effects\26.3\Scripts\ScriptUI Panels\`. `check-bridge` retorna **timeout**, porque o AE não está aberto. Boot = abrir AE + abrir o painel. Cerca de 2 minutos. |
| ffmpeg / ffprobe | 9.0-full_build, no PATH. |
| Node | v26.7.0. npm 12.0.2. |
| Python | 3.14.7 no sistema, 3.12 no venv do WhisperX. |
| Playwright | **Ausente.** `marketing\pipeline\node_modules` não existe. Reativar a pista HTML custa `npm i playwright` + `npx playwright install chromium`, cerca de 5 minutos e uns 400 MB de disco que hoje não existem. |
| Fonte Sora | Instalada e registrada em HKLM. **Só Sora-Regular, Sora-SemiBold e Sora-Bold resolvem no text engine.** Sora-Medium aparece em `app.fonts` mas cai em serifa e quebra o aerender (lição do CHANGELOG v003). |
| Higgsfield | Plano Plus, **96,62 créditos**. |

---

## 2. Tabela "Telas do app por argumento"

80 PNGs em `c:\Projects\Legalizei_Videos\marketing\telas-app\`, todos **1290x2796**, 73 catalogados em `_manifesto.json` com nome, rota, grupo e nota de direção. Mais 5 travadas em `c:\Projects\Legalizei_Videos\marketing\telas-filme\` (01-N1-splash, 02-N2-welcome, 03-N3-entrada, 04-N4-gate-cnae, 05-N4-atende).

**Sete arquivos não estão no manifesto e não são recapturados** (o README do pipeline manda não apagar): `ativa.png`, `home-campea.png`, `impostos-neutro.png`, `encaixe.png`, `pagamento-cenario-empresa-paga-v-0.png`, `plano-cenario-empresa-paga-v-0.png`, `revisar-cenario-empresa-paga-v-0.png`.

| Argumento do roteiro | Tela (arquivo) | Por que serve | Cuidado |
|---|---|---|---|
| **PREÇO da abertura** | `plano.png` | "Fecha a conta na cara do cliente antes de pedir dinheiro". Bloco "hoje x todo mês" no topo. | Mostra taxa da Junta no ME. **MEI não paga taxa.** Não usar essa tela em peça de MEI sem cobrir a linha. |
| **PREÇO recorrente / mensalidade** | `mais_plano.png` | Gerenciar plano, próxima fatura, avulsos somados. | O manifesto marca o preço como **FAKE** (valor de referência do Mauro). Não filmar o número, ou cobrir com card AE. |
| **PREÇO sem susto na migração** | `migrar_plano.png` | Diz explicitamente que **não há taxa de governo** na migração. Só a mensalidade no rodapé. | Serve aos dois regimes. |
| **PREÇO honesto, recap final** | `revisar.png` | Recap read-only, "números com carimbo de estimativa", taxa da Junta como única quantia dura. | MEI não vê capital social nem taxa. |
| **PAGAMENTO / mecânica de cobrança** | `pagamento.png`, `pagamento-fluxo-migrar.png` | Cobrança + elegibilidade no mesmo CPF, boleto fora do happy path. | Campanha é waitlist. Ninguém paga hoje. Usar só como imagem de "o app existe", nunca sugerindo cobrança. |
| **PRAZO / vigilância de data** | `obrigacoes.png` | **Calendário de obrigações.** É a tela literal da metáfora "eu fico de olho no prazo por você". | Melhor tela do acervo para a persona vigia. |
| **PRAZO / próximo compromisso** | `inicio.png` (Home Campeã) | Saudação + CNPJ pill + **próximo compromisso** + vigília preditiva. | `?regime=mei` reduz para 2 números. |
| **PRAZO de abertura** | `painel.png` | Timeline de 3 status com 4 estados, previsão honesta, "não cobramos de novo". | MEI vira 1 passo, prazo qualitativo "minutos, não dias". |
| **GUIA (o boleto do imposto)** | `impostos_pagar.png` | Ver e baixar guia, copiar código de barras, enviar. | Copy é explícita: **não intermediamos pagamento**. Não dizer "a gente paga pra você". |
| **GUIA / histórico** | `impostos_guias.png` | Guias anteriores com status automático. | |
| **IMPOSTO / dashboard** | `impostos.png` | Carrossel do mês (DAS + INSS), vigília fiscal, calendário. | |
| **IMPOSTO / o número que dói** | `impostos_aliquotas.png` | **Alíquota efetiva + Fator R numa barra contra o corte dos 28%**, memória de cálculo. | O mais forte para mote C (ME / Simples Nacional). Não existe no MEI. |
| **IMPOSTO / MEI** | `inicio.png?regime=mei` (usar `home-campea.png` como variante) | MEI tem DAS fixo, não tem Fator R nem Anexo. | **Nunca mostrar Fator R nem alíquota efetiva em peça de MEI.** Vira erro factual. |
| **ABERTURA de CNPJ / a porta** | `gate.png` + `veredito_atende.png` | Gate-CNAE com pills e veredito. "Linguagem humana antes do código". | |
| **ABERTURA / escolha MEI x ME** | `entrada-intencao-abrir.png` | Pergunta direta MEI x ME logo após o fork. Critério de elegibilidade. | Rotula os dois planos na tela. Casa com a regra dura de "rótulo na TELA e no ÁUDIO". |
| **ABERTURA / o parto** | `home-dia1.png` | Home dia-1, hero celebra o nascimento com confete da marca + CNPJ pill + checklist. | Melhor payoff visual de "empresa nasceu". |
| **ABERTURA / os 3 caminhos** | `entrada.png` | Fork de 3 rotas. A palavra "migrar" não aparece: pergunta pelo fato. | |
| **MIGRAÇÃO** | `migrar_transferencia.png` | Pipeline de 5 etapas (encerrar, CRC-MG, Redesim, Prefeitura, liberar acesso). | Códigos oficiais estão fora da tela de propósito. Não citar resolução nem Evento 232 na locução. |
| **MIGRAÇÃO / diagnóstico** | `migrar_diagnostico.png` | "Você já tem certificado digital?" | |
| **MIGRAÇÃO / prova de economia** | `mais_documentos.png?fluxo=migrar` | Traz o **Relatório de Oportunidade Fiscal**. | |
| **HOME** | `inicio.png` (regime), `home-campea.png` (variante fora do catálogo) | | |
| **AVISOS / o vigia falando** | `avisos.png` | Central de notificações, tipos com cor de estado, sino. | **Tela âncora do instinto de vigia.** O aviso chegando antes do prazo é a marca inteira em uma imagem. |
| **AVISOS / conformidade** | `mais_em-dia.png` | "Você está em dia": hero escuro + streak + órgãos + cumprido-no-mês. | Payoff emocional puro. |
| **CONTRATO** | `contrato.png` | Contrato de serviço, reversível, CDC art. 49, cancelamento aberto na tela. | Regra dura 12: **não prometer garantia incondicional**. A tela ajuda, a fala não pode exagerar. |
| **CONTRATO irreversível** | `termo.png` | "A taxa do governo não volta" em uma linha, sem letra miúda. | |
| **SÓCIO** | `dossie_socio.png` (dados do sócio), `mais_socios.png` (lista e participação), `dossie_socios.png` (adicionar sócios) | | `mais_socios.png` **não existe no Plano MEI**. |
| **SÓCIO / o caso MEI** | `mais_colaborador.png` | Substitui Sócios no hub quando MEI. Um funcionário com carteira, processamento é da gente. | Prova concreta do que o MEI ganha, sem prometer contador dedicado. |
| **CONTADOR HUMANO (só mote C)** | `migrar_contador.png` (CRC do contador atual) | | Regra dura do mote B: **proibido prometer contador ou humano dedicado no MEI**. Se a tela puxa CRC, ela é peça de ME. |
| **NOTA FISCAL** | `emitir.png` (prévia viva do imposto), `notas.png` (ledger), `notas_detalhe.png` | | |
| **ABERTURA de marca / o coral cheio** | `splash.png` | Único momento em que o coral cobre a tela toda, logo negativa, check em wipe. | Melhor tela para transição ou impacto de marca. |
| **WAITLIST (a própria campanha)** | `veredito_waitlist.png` | "Não é não, é ainda não". Captura contato sem fechar a porta. | Espelha a mecânica da campanha dentro do produto. |
| **PRÓ-LABORE** | `pro-labore.png` | Imposto e INSS ao vivo, mira de 30%. | Só ME. |

---

## 3. Vocabulário de motion já provado no escalada

Tudo abaixo já rodou até o master `escalada_v104_com-som.mp4` (1920x1080, 30fps, 81,0s, 2423 frames, áudio PCM 48 kHz mono). Nada aqui é hipótese.

### 3.1 Tipografia
- **Word-by-word sync a partir de WhisperX.** Marker por palavra, keyframe referenciando marker, nunca número solto. 164 text layers no filme inteiro.
- **Legenda queimada com ritmo de cor:** palavra forte da frase em coral + Bold, palavras de apoio (<=3 letras) em cinza secundário, resto no texto de tema. Direção do Pedro de 14/08 que **substitui** a regra de "máximo 1 coral por take" nas legendas.
- **Modo Apple:** frase de 2 a 3 palavras entrando com Scale 3D 122 → 100, Opacity 0 → 100 em 280ms e Blur 42 → 0 em 500ms, tudo em Text Animator, com entrada rápida (influence 28) e desaceleração longa (influence 92). Saída em corte de 80ms quando a próxima frase entra.
- **Legenda que compõe (`zonas`):** a legenda muda de posição por fase do take, em cima quando o palco está cheio, ao lado quando o objeto estaciona num canto.
- **Palavra pintada dentro da frase** via `ADBE Text Selector` por percentual de caractere, sem quebrar a frase em layers.
- **Repintura recursiva de precomp** por critério ASCII, imune a acento e encoding (`53-lettering-t8-cores.jsx`). É o mecanismo do "ai" coral.

### 3.2 Números
- **Contador com Slider + expressão de milhar pt-BR** (`PRE-contador`).
- **Contador com texto keyframado em curva exponencial + Directional Blur vertical 0 → 26 → 0**, efeito slot machine que casa com swipe (`54-contador-fix.jsx`). Chegou a 7.400.000 sem card, direto sobre a cena.
- **Contador de 1 a 22** no T7 com cards de tarefa orbitando.

### 3.3 Câmera e transição
- **Swipe de dois painéis coral** varrendo esquerda para direita, lead coral-300 e lag coral-600, rotação -8 graus, motion blur ligado. Cobre corte seco e entrega a cena nova já em movimento.
- **Giro 3D de uma volta com escala convergindo** até estourar o quadro no corte (`giroCamera()`), usado como saída de aparelho.
- **Zoom-ponte com ponto fixo:** 100 para 112% no fim de um bloco, o bloco seguinte abre a 112% e relaxa. Movimento de câmera contínuo atravessando o corte.
- **Saída coreografada por elemento** (`sai()` + `easeSaida()`): uns caem, outros vão pro lado, outros sobem, com ease que **acelera** na saída.
- **Corte contínuo:** T3 e T4 com a mesma seed LCG, o T4 abre no ângulo exato em que o T3 foi cortado. Zero transição, o espectador não percebe o corte.
- **Freeze de atenção:** X crimson estampando e a cena travando no "corrigir". É o snap de vigia.
- **Linear Wipe apagando letras** conforme um objeto passa por cima delas.
- **Onda circular de papel** engolindo o dark (shape vetorial, nunca Radial Wipe, por causa de banding).

### 3.4 Cards e UI viva
- **Card voando da câmera** (voo em Z local -1650 → 0) e **colando** na tela do aparelho.
- **Digitação e apagamento** (`digita()`, `seqDigitacao()`, `seqApaga()`) com cursor `|` piscando via keyframes de hold no `sourceText`. Foi assim que o card IMPOSTO digitou e apagou valores.
- **Flip de ano** (rotX) girando 2026 → 2029 com micro-label "1 ANO DEPOIS".
- **Calendário de 12 meses** com check verde `#17A06A` no único mês visitado e chip "1x POR ANO".
- **Grade / planilha** com fantasma financeiro em todas as células.
- **Chip com tilt 3D leve** e dot grid de fundo (`dotGrid()`, elipse + Repeater X e Y).

### 3.5 Multidão e escala
- **Campo de milhares de ícones** com 1 shape layer + 2 Repeaters (80x44, pitch 48/49), sem 1 layer por ícone. 3.520 ícones renderizando confortavelmente.
- **Apagão em varredura** (Linear Wipe 90 graus, feather 400) deixando cluster registrado na grade, com proporção **honesta** (25 acesos de 3.520 = 0,71%).
- **Fileira de 100 auditável** com 1 aceso.

### 3.6 Atmosfera e acabamento
- **Manchas de cor** (`mancha()`): solid com máscara elíptica de feather alto, opacidade baixa e expressão `wiggle` na posição. É o que dá vida ao fundo papel sem sujar.
- **Fumaça fluida** com Fractal Noise (evolution animada + offset subindo) sob máscara que cresce, sem partícula e sem bolha.
- **Grain 1,5%** em adjustment layer, projeto em 16bpc, anti-banding.
- **DOF em pós no ffmpeg** (split + gblur sigma 7 + geq com máscara animada + feather + alphamerge). **Mais robusto que duas camadas 4K no AE nesta máquina**, que estourava memória e travava o aerender sem log.
- Glow, drop shadow e Change To Color aplicados por um único passe idempotente e reversível.

### 3.7 Som
- **Trilha em stems com envelope por camada** (bass, drums, instruments, melody), com offset na música para pular intro muda.
- **Sem sidechain** por decisão do Pedro: música 5,9 dB abaixo da voz, constante. Swell pontual de +2,6 dB em momento de impacto.
- **95 SFX sintetizados proceduralmente** com numpy (whoosh de giro, cliques de UI, ticks de contador, impacto grave com sub, pops de card, riser, twinkle, passos, ding). **O script viveu no scratchpad e sumiu.** A técnica está documentada, o código não.
- Loudnorm 2-pass -14 LUFS / -1,5 dBTP, dual-mono 48 kHz.
- Localização de batidas por **análise de movimento quadro a quadro**, para sincronizar SFX a gesto.

---

## 4. O que teria que nascer do zero

| Item | Esforço | Por quê |
|---|---|---|
| **Template 9:16 base** (`10-estrutura-9x16.jsx` + `20-precomps-9x16.jsx` + guia de safe area de Reels) | **6 a 10 h**, uma vez só | Os arquivos atuais têm dimensões literais de 4K 16:9. Ver §6. |
| **Rig de card vertical e phone-frame vertical** | 3 a 5 h | O `PRE-phone-frame` é 1400x2910 numa comp 3840x2160. Em 1080x1920 o aparelho ocupa quase o quadro inteiro e a moldura hairline vira ruído. Provavelmente vira "tela sem moldura, sangrada", ou usa o `iphone-t5.png` reduzido. |
| **Fábrica de peça curta** (um jsx parametrizado que monta hook, corpo, super de condição e end card a partir de um JSON) | **12 a 20 h**, uma vez só | É o que separa "6 peças em 6 semanas" de "6 peças em 2 semanas". Hoje cada take do escalada é código artesanal de 300 a 700 linhas. |
| **Super de condição** (rodapé, corpo pequeno, motes B e C) | 1 a 2 h | Texto fixo longo, exige wrap e legibilidade em rodapé de 1080 de largura. Nunca foi feito. |
| **End card padrão dos 6** (papel quente, logo entrando, "AI" acendendo, linha de CTA, botão Cadastre-se) | 4 a 6 h se feito no AE. **Cerca de 1 h se recortar a vinheta 9:16 já renderizada.** | A vinheta `vinheta-9x16-4k60-v2.mp4` já tem o acendimento. Falta o botão e a linha de CTA por cima. |
| **Biblioteca de SFX** | 3 a 5 h | Os SFX do escalada eram sintetizados por um script perdido no scratchpad, e a pasta `marketing\audio\sfx\` não existe mais (é gitignorada). Reescrever o sintetizador em numpy, ou baixar de novo do Freesound com `marketing\pipeline\sfx.mjs`. |
| **Locução das 6 peças** | Depende do Pedro | ElevenLabs Multilingual v2. O guia de fraseado está em `marketing\audio\Narração\narracao-elevenlabs-escalada.md` (uma ideia por respiração, palavra de peso no fim, lista vira staccato). **Não há chave de API no repo.** Alternativa medida: Voiceover da Higgsfield custa **1,35 créditos por trecho**, então 96 créditos dão umas 70 tomadas. |
| **Reativar a pista HTML** | 30 min | `npm i playwright && npx playwright install chromium` dentro de `marketing\pipeline`. Precisa de disco. |
| **LP da lista de espera** | Fora do escopo de vídeo | Pendência aberta número 2 do brief. A peça não pode prometer mecânica que a LP não cumpre. |

---

## 5. Limites reais

### 5.1 O que a máquina é

| Item | Valor medido |
|---|---|
| CPU | AMD Ryzen 7 5700G, 8 núcleos, 16 threads |
| RAM | 31,3 GB total, **14,9 GB livres agora** |
| GPU | **NVIDIA RTX 3060, 12 GB, driver 591.86, 0 MiB em uso** + Radeon integrada do 5700G |
| Disco | **Volume único C:, 110,7 GB total, 1,8 GB livres** |
| Repo | 6,3 GB |

**A SPEC do escalada e o brief estão desatualizados sobre a GPU.** A 3060 está de volta. Isso libera Mercury GPU (CUDA) no AE e destrava efeitos acelerados. Mas exige smoke test antes de confiar, porque a SPEC prevê "Mercury Software Only ao primeiro artefato".

### 5.2 Render: números reais, não chute

Agreguei **383 logs do aerender** em `c:\Projects\Legalizei_Videos\marketing\filme\escalada\ae\Logs de escalada-master_v*.aep\`:

- **18.070 frames de 3840x2160 renderizados em 19.750 segundos.**
- Média: **1,09 s/frame**. Mediana 0,78. p10 0,30. p90 2,25. Pior bloco 9,88 s/frame.

1080x1920 tem 2.073.600 px contra 8.294.400 px de 4K, ou seja **um quarto**. Descontando o custo fixo por frame, a estimativa conservadora é **2,5 a 3x mais rápido**, ou seja **0,36 a 0,44 s/frame médio** e **0,75 a 0,90 s/frame no p90**.

**Peça de 20s em 1080x1920 a 30 fps = 600 frames:**

| Cenário | Tempo de aerender | Mais ffmpeg e mux |
|---|---|---|
| Peça leve (tipografia + telas + cards) | 3,5 a 4,5 min | + 40 s |
| Peça média (3D leve, blur, glow) | 7 a 9 min | + 40 s |
| Peça pesada (Fractal Noise em tela cheia, frame blending, 2 camadas de vídeo) | 15 a 25 min | + 1 min |

**Render nunca é o gargalo.** Dá para fazer de 4 a 10 passadas completas de uma peça por hora.

### 5.3 O que a máquina NÃO aguenta

1. **Disco. 1,8 GB livres.** Uma sequência TIFF RGBA de 1080x1920 pesa 8,29 MB por frame, ou **5,0 GB para 600 frames**. O pipeline chunked (blocos de 40 frames, ffmpeg converte e apaga incremental) reduz o pico para uns 350 MB, mas o cache de disco do AE em `%LOCALAPPDATA%\Temp\Adobe` já chegou a **11 GB e matou renders por disco cheio** (CHANGELOG v017). Hoje isso reprova.
   **Recuperável rápido:** `marketing\filme\escalada\tools\.venv` (2,3 GB, recriável), 47 dos 49 `.aep` antigos em `escalada\ae\` (~450 MB, só v102 e v102A estão no git), `marketing\mascote\renders` (946 MB, mascote está fora desta leva). Isso devolve cerca de 3,7 GB. **Ainda insuficiente. O alvo mínimo é 30 GB livres.**
2. **Encoder H.264 do MediaCore está quebrado nesta máquina.** O caminho obrigatório é aerender → Sequência TIFF com alfa em chunks → ffmpeg → concat. Nunca saída direta de mp4 pelo AE.
3. **`aerender` morre sem escrever log.** Vigiar por arquivos e timestamps, nunca só pelo log. Retry loop não registra a primeira tentativa.
4. **`aerender` sempre com `-mfr OFF 100`.** Multi-Frame Rendering estourava RAM em 4K 16bpc.
5. **A bridge MCP morre quando o AE passa de 17 GB de RAM**, e `-r` não roteia para instância ocupada. Solução provada: script headless via `-r` numa instância leve, sem projeto na linha de comando.
6. **Duas camadas de vídeo 4K com frame blending estouram memória.** Foi por isso que o DOF migrou para o ffmpeg.
7. **Só Sora-Regular, SemiBold e Bold.** Sora-Medium quebra.
8. **Validar bloco por `count_frames` no MP4**, nunca contando TIFs antes do ffmpeg. Foi essa lição que custou o bug do bloco 0520 no v102.
9. Diálogo pós-crash do AE ("Opções de reparo de falhas") trava o launch. Precisa de screenshot e clique programático, nunca ENTER cego.

### 5.4 Veredito de capacidade

**Assumindo o disco resolvido e o template 9:16 pronto:**

Custo real por criativo de 15 a 30s, com o rig atual:

| Etapa | Tempo |
|---|---|
| Roteiro fechado e locução gerada | 1 a 2 h (depende do Pedro) |
| WhisperX + fase1 + fase3 (legendas com validação de marca) | 30 a 45 min |
| Build visual do conceito em ExtendScript | **3 a 6 h** |
| Lettering (rig pronto, muda parâmetro) | 20 min |
| QC por `see-frame` e `contact-sheet` + ajuste | 1 a 2 h |
| Render + mux + loudnorm | 30 min a 1 h |
| Rodadas de review do Pedro | **2 a 5 h** |

**Total: 8 a 16 horas por peça.**

**Resposta direta:**
- **Semana 1: zero peças finalizadas.** Ela é gasta em liberar disco, montar o template 9:16, portar os módulos genéricos e provar uma peça piloto ponta a ponta. No fim da semana 1 sai **1 peça aprovável**.
- **Semana 2 em diante: 3 a 4 criativos 9:16 de 15 a 30s por semana**, em regime, com o mesmo nível de acabamento do escalada.
- Se a **pista HTML** for autorizada para as peças que são tipografia pura + tela de app + card (provavelmente 3 das 6), esse número sobe para **5 a 6 por semana**, porque escrever `__render(t)` em HTML/CSS é de 3 a 5 vezes mais rápido que ExtendScript e não depende da bridge do AE.

### 5.5 O gargalo de verdade

Não é o render. Não é o After Effects. Não é a GPU.

1. **Disco (1,8 GB).** É bloqueio duro e imediato. Nada roda até isso mudar.
2. **Autoria de cada conceito em ExtendScript.** O acervo do escalada tem oito take-scripts de 300 a 700 linhas cada, todos escritos à mão para um conceito específico. Não há uma "fábrica" parametrizada. **Cada peça nova é código novo.** Esse é o custo dominante depois do disco.
3. **Rodadas de review.** O CHANGELOG registra 104 versões em 8 dias. A maior parte é ajuste fino pedido pelo Pedro, não erro técnico. Isso não se otimiza com ferramenta, se otimiza com styleframe aprovado ANTES do build.
4. **A locução.** Fica fora do controle do pipeline: depende do Pedro gerar no ElevenLabs, e todo o word-sync do lettering depende dela existir primeiro.

**Recomendação de sequenciamento:** aprovar styleframe estático de cada uma das 6 peças (a pista HTML de `marketing\styleframes\src\` renderiza um styleframe 9:16 em segundos) ANTES de qualquer linha de ExtendScript. Isso mata o item 3, que é o mais caro.

---

## 6. O que muda para sair de 3840x2160 16:9 e ir para 1080x1920 9:16

Fator de escala linear: **0,28125** (1080 / 3840). Mas o quadro fica **mais alto e muito mais estreito**, então layout horizontal não escala, ele se reprojeta.

| Arquivo | Mudança |
|---|---|
| `00-tokens.jsx` | Nenhuma. |
| `gera-tokens.mjs` | Trocar `filme.master` para `{ w: 1080, h: 1920, dur: <n> }`, `filme.safe` para `{ w: 864, h: 1440 }` e reescrever o bloco `lettering` (ver abaixo). |
| `10-estrutura.jsx` | `W = 1080`, `H = 1920`. Substituir a tabela `TAKES` pela grade da peça curta. `GUIA-safe` deixa de ser 90% central e passa a ser **retângulo 864x1440 centrado em y=840**, para respeitar a UI de Reels: os 12,5% de topo e os 25% de base são zona de risco (legenda do post, CTA, áudio, botões laterais). |
| `20-precomps.jsx` | `PRE-phone-frame`: 1400x2910 vira **620x1290** (ou substituir por `iphone-t5.png` escalado). `PRE-card` 1200x720 vira **900x420** (card vertical usa mais largura relativa). `PRE-contador`: comp 2400x800 vira **1000x340**, `fontSize` 560 vira **220** (número herói vertical ocupa ~20% da altura, não ~26%). `PRE-grade-grain` e `PRE-mapa`: 3840x2160 vira 1080x1920. `PRE-mascote`: **deletar**, o mascote está proibido nesta leva. Manter `proj.bitsPerChannel = 16`. |
| `30-imports.jsx` | Só trocar a lista de telas e o caminho do áudio. |
| `fase1-processa.py` | `FILME_DUR` e o dicionário `RESPIRO` viram os da peça curta. `ANCORAS_FIM` vira a lista de âncoras do novo roteiro. Resto intacto. |
| `fase3-gera-legendas.py` | Trocar o dicionário `LINHAS` e o `CORAL`. **As validações de travessão e de contagem de coral ficam como estão**, são regra de marca. |
| **`32-lettering.jsx`** | **Três mudanças.** (a) Trocar `var W = 3840, H = 2160` por leitura do comp do take (`takeComp.width` / `takeComp.height`), movendo o lookup do `takeComp` para antes. (b) Novos defaults em `OPC`: `tam` de 125 para **64 a 76** (a régua atual dá 3,3% da largura, ilegível em celular; Reels pede 6 a 7%), `larguraMax` de 3000 para **860**, `xc` de 1920 para **540**, `y1` de 1124 para **1180**, `y2a`/`y2b` de 1042/1204 para **1120/1270**. (c) `GAP` de 36 para **11**. O resto do rig, incluindo o modo `apple`, funciona sem tocar. |
| `48-polimento.jsx` | Trocar as dimensões literais do `dotGrid()` e os raios de Repeater. Os valores de sombra, glow e tilt são relativos e sobrevivem. |
| `54-contador-fix.jsx` | Só o `Directional Blur` length de 26 para **8** (blur em px, escala com o quadro). Curva e formatação intactas. |
| `52-fumaca-t7.jsx` | Escalar elipse, feather (200 para 56) e Gaussian Blur (16 para 5). `fxProp()` intacto. |
| `50-master.jsx` | Porte parcial. O `painel()` do swipe precisa de retângulos altos em vez de largos, e a rotação de -8 graus fica exagerada em quadro estreito, usar **-4**. `giroCamera()` e `sai()` migram por conceito, não por código. |
| `40-49-take-*.jsx` | **Não portar.** São conceito. Servem como catálogo de técnica e de coordenada de referência. |
| `46-mapa-dados.jsx` | Multiplicar todas as coordenadas por 0,28125 e reposicionar verticalmente. Ou regerar do GeoJSON com o novo viewport. |

**Duas regras práticas de resolução que valem a pena registrar:**
- As telas do app são **1290x2796**. Em 1080x1920, uma tela ocupando 85% da altura fica em **58% do tamanho nativo**. Sobra resolução. Em 2160x3840 ela precisaria de **117%**, ou seja, upscale. **1080x1920 é o ponto ótimo** e coincide com o formato do master entregue do escalada (que também é 1080p).
- Os iPhones renderizados no Blender são **1600x2400 com alpha**. Também sobra resolução em 1080x1920.

---

## 7. Higgsfield: a matemática real

96,62 créditos, plano Plus. Preços **verificados no extrato da própria conta** (`transactions`), não em tabela pública:

| Operação | Créditos observados |
|---|---|
| **Seedance 2.0** | **45** (config mais barata) · 54 · 63 · **90** (10s 1080p bitrate high) · 108 (mais longo) |
| Seedance 2.5 | **195** |
| **Bytedance Video Upscale** (para 4K) | **0,81** |
| Nano Banana Pro (imagem) | **2 a 4** |
| Motion Control | 16 |
| Image / Video Background Remover | 1 |
| Voiceover (TTS por trecho) | **1,35** |
| Voice Element (criar voz) | 40 |
| Multi-Image to 3D | 25 a 35 |

**Quantos planos 96,62 créditos compram, de verdade:**

- **Dois** planos Seedance 2.0 na configuração de 45 créditos (provavelmente 5s, 720p, standard), sobrando 6,62. **Zero retakes.**
- Ou **um** plano de 90 créditos (10s, 1080p, high). Sobrando 6,62.
- **Nenhum** plano Seedance 2.5, que custa 195 sozinho.

O histórico do escalada mostra que cada take do mascote precisou de **3 a 5 tentativas** antes de sair aprovável (v1 a v5, com uma falha do provedor que não cobrou e um refund de 90). **Planejar 2 planos com zero orçamento de retake é planejar falhar.**

**Onde vale gastar, na ordem:**

1. **Não gastar em vídeo.** Gastar em **imagem estática no Nano Banana Pro, a 2 a 4 créditos**. 96 créditos compram de **24 a 48 imagens**. Textura de papel com luz rasante, macro de fibra, poeira em contraluz, tinta assentando: tudo isso funciona melhor como **still de altíssima qualidade animado no AE** (push-in, parallax, grain, wiggle de luz) do que como plano de vídeo IA de 5 segundos que você não controla. Custa 40 vezes menos por tentativa, permite iterar, e o movimento nasce no AE onde a marca manda.
2. Se ainda assim quiserem plano de vídeo, o caminho barato é gerar em **480p ou 720p curto** e usar **`upscale_video` a 0,81 créditos** para subir para 4K. O upscale é praticamente de graça, foi usado três vezes no escalada.
3. **Voiceover a 1,35 créditos** é uma rede de segurança real: se o ElevenLabs travar, 96 créditos dão cerca de 70 tomadas de locução. Não é o plano A (a voz da marca já está calibrada no ElevenLabs), mas é um plano B verificado e barato.

**Regra que continua valendo, sem exceção:** nenhum plano vindo de IA pode conter texto legível, logo, rosto humano identificável ou qualquer coisa que precise estar factualmente correta. E como o mascote está fora desta leva, sumiu o único elemento que realmente justificava geração por IA. **Estas 6 peças podem ser feitas com zero créditos gastos.**

---

## 8. Arquivos que os roteiristas precisam abrir

- Brief da campanha: `C:\Users\EDIT-A~1\AppData\Local\Temp\claude\c--Projects-Legalizei-Videos\8f5ab627-a089-4e39-98a6-32e6d2414708\scratchpad\00-estrategia.md`
- Regras duras de marca: `c:\Projects\Legalizei_Videos\identidade\brand-book.md` §7
- Tokens de cor e motion: `c:\Projects\Legalizei_Videos\identidade\tokens.css`
- Catálogo comentado das telas: `c:\Projects\Legalizei_Videos\marketing\telas-app\_manifesto.json`
- Como escrever para o TTS: `c:\Projects\Legalizei_Videos\marketing\audio\Narração\narracao-elevenlabs-escalada.md`
- Vocabulário de motion, com o porquê de cada decisão: `c:\Projects\Legalizei_Videos\marketing\filme\escalada\ae\CHANGELOG.md` (694 linhas, 104 versões)
- Referência de composição de preço em quadro: `c:\Projects\Legalizei_Videos\marketing\filme\styleframes\f5-preco.png`
- Referência de composição 9:16: `c:\Projects\Legalizei_Videos\marketing\styleframes\sf1.png`, `sf2.png`, `sf3.png` (2160x3840)