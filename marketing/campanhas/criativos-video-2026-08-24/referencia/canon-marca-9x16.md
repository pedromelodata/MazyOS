# RÉGUA DE MARCA PARA VÍDEO — Legalizai
### Canon operacional para os 6 criativos de performance (Reels 9:16, waitlist, sem mascote em quadro)

> Fontes destiladas: `00-estrategia.md` (brief da campanha), `identidade/brand-book.md`, `identidade/design-guide.md`, `identidade/referencia/decisoes-marca.md` (ADR), `identidade/referencia/paleta-cores.md`, `identidade/referencia/design-system.md`, `identidade/tokens.css`, `marketing/filme/escalada/SPEC.md`, `marketing/filme/escalada/jsx/32-lettering.jsx`.
> Em conflito entre este documento e o brief da campanha, vale o brief. Em conflito entre este documento e o vault do produto (repo `legalizei` + Storybook), vale o vault.

---

## 1. REGRAS DURAS

Cada regra tem: **a regra**, **o porquê**, e **como ela se manifesta em vídeo**. Quebrar qualquer uma reprova a peça inteira, não só o quadro.

---

### 1.1 Zero travessão em qualquer texto falado ou de tela
- **Porquê:** regra dura do Pedro travada no ADR em 13/07/2026, reiterada com ênfase, e já aplicada em gate, LP, wizard, deck e bio. É o tique mais visível de texto gerado por máquina, e a marca se posiciona como humana.
- **Em vídeo:** vale para locução escrita, legenda queimada, super, card, chip, micro-label, nome de arquivo entregue e legenda do post no Meta. O separador de micro-label é `·` (ponto médio), nunca `—` nem `–`. Onde o roteiro pediria travessão, quebrar em duas frases ou usar ponto, vírgula ou "e". Em After Effects, isso precisa ser um assert no script de lettering: se o JSON de legenda contiver `\u2014` ou `\u2013`, o build falha alto em vez de renderizar.

### 1.2 O suricato não aparece. Nem parcialmente.
- **Porquê:** decisão do Pedro de 24/08/2026, regra dura desta leva. O Léo continua sendo a alma, não o corpo. Uma peça que precisa dele em quadro para funcionar é uma peça mal escrita.
- **Em vídeo:** proibido corpo, rosto, pata, silhueta, sombra projetada com formato de bicho, reflexo, versão estilizada, ícone dele, plush, boneco, animal genérico substituto, e qualquer plano de IA que possa alucinar um bicho. O que sobrevive dele é comportamento de câmera e de edição: **o plano que congela**, **o snap de atenção**, **o corte que antecipa o problema antes de o problema aparecer**, **o calendário vigiado**. Onde o storyboard antigo dizia "Léo aponta", agora quem aponta é o corte. Onde dizia "Léo com lupa", a lupa entra sozinha e o texto fala em 1ª pessoa por cima.

### 1.3 Azul nunca é marca
- **Porquê:** decisão de território de 10/07/2026. O setor contábil inteiro é azul frio. O coral quente é a única cor vazia do mercado.
- **Em vídeo:** o info-blue `#3B82E0` só pode existir como estado funcional de UI dentro de uma tela do app mostrada em quadro. Nunca como fundo, nunca como luz de cena, nunca como cor de gráfico, nunca no scrim. Isso inclui: nada de "luz azul de tela de celular na madrugada" como grade, nada de gradiente azul de fundo, nada de plano de Higgsfield com dominante azul. Se um plano de IA voltar azulado, ele é corrigido no grade para neutro-quente ou descartado.

### 1.4 Coral nunca é erro
- **Porquê:** coral e crimson são hues vizinhos. Se o coral marcar erro, a marca vira sinal de perigo.
- **Em vídeo:** erro, prazo perdido, multa e vencimento usam crimson `#E03E43` **sempre com ícone e texto juntos**, nunca só a cor. Nada de flash coral como transição de tensão, nada de fundo coral no bloco do problema, nada de coral piscando no quadro de dor. O arco continua sendo dark no problema e coral só na virada.

### 1.5 Coral-500 é só logo e wordmark. Fill é coral-600.
- **Porquê:** travado na paleta v1. `#F2643C` é identidade; `#DD4E27` é ação, e é o único que bate AA com texto branco.
- **Em vídeo:** o único coral-500 permitido numa peça é o do símbolo e do wordmark (incluindo o "AI" que acende no fecho), **e no lettering sobre fundo escuro**, porque no dark o coral-600 fica pesado (o token `action-primary` sobe para o 500 no tema escuro). Fill de botão, pino, badge, chip e barra de gráfico sobre papel usam coral-600. O rig `32-lettering.jsx` já implementa essa troca por tema: dark usa `[242,100,60]`, papel usa `[221,78,39]`.

### 1.6 Branco sobre coral-600 só em tipo grande (derivada da AA, travada 12/07)
- **Porquê:** o contraste é 4,04:1. Passa AA só em texto grande (≥18,66px bold no app). Botão pequeno já nasce no coral-700.
- **Em vídeo, número concreto:** o frame de 1080 de largura é 2,77× a viewport lógica do app (390). Logo, **branco sobre coral-600 só a partir de 56px em 1080×1920**. Abaixo disso: ou o fill vira coral-700 `#B83D1C`, ou o texto vira ink-900. O rótulo do botão `Cadastre-se` do end card fica em 56px ou mais, o que resolve sozinho.

### 1.7 Fundo é papel quente `#FAF8F5`, nunca branco puro. Texto no escuro é `#F4F1EC`, nunca branco puro.
- **Porquê:** metáfora de papel. O branco puro é o que faz UI parecer fria e clínica, exatamente o oposto do arquétipo Aliado.
- **Em vídeo:** o mundo claro nasce em `#FAF8F5`, o card branco `#FFFFFF` vem por cima com hairline `#E3DED7`, e o texto sobre dark é `#F4F1EC`. Um plano de IA de textura de papel precisa passar por grade para bater esse ponto de branco; se voltar em `#FFFFFF` estourado, ele é corrigido ou descartado. Nada de fade para branco puro como transição.

### 1.8 Sora em tudo. Sem exceção.
- **Porquê:** travado 12/07/2026 como sistema inteiro, não só o wordmark. Fraunces, Bricolage, Space Grotesk, Schibsted e Instrument Serif foram sondadas e descartadas.
- **Em vídeo:** legenda, super, número, chip, micro-label, carimbo, tudo em Sora. A variable `Sora-wght.ttf` está instalada e o eixo `wght` é animável (300 a 800), o que substitui qualquer necessidade de fonte de apoio. Se o AE cair em fallback, o build tem que falhar, não renderizar. Nada de fonte "de máquina de escrever", nada de serifada para simular documento oficial: um documento oficial em quadro se faz com layout e carimbo, não com outra fonte.

### 1.9 Sem sombra decorativa. Separação por borda fina.
- **Porquê:** o fundo já é papel, então a separação existe sem sombra. Sombra só em sheet e modal, que precisam flutuar de verdade.
- **Em vídeo:** nada de drop shadow em texto, nada de glow atrás de número, nada de contorno em legenda. A legibilidade da legenda sobre imagem se resolve com o `--gradient-scrim` do `tokens.css`, não com caixa preta nem com stroke. A única exceção autorizada é o `--gradient-brand-glow` no acendimento do "AI" no end card.

### 1.10 Raios derivados do logo, escalados por 3 no frame vertical
- **Porquê:** o símbolo tem raio ≈ 0,27 × lado, e num ícone de 44px isso dá 12. O logo governa a régua do sistema.
- **Em vídeo:** o frame de 1080 é 3× a viewport de desenho mobile (360), então os raios do sistema entram multiplicados por 3: **card 48 · botão e input 36 · chip 24 · sheet 72 · pill 999**. O quadrado do símbolo continua com 0,27 × lado, seja qual for o tamanho em quadro.

### 1.11 Nenhum hex cru na peça. A peça pede papel, não cor.
- **Porquê:** governança solo é mecânica, não social. Se o valor está literal, ele diverge.
- **Em vídeo:** as cores nascem do `tokens.json` gerado do `tokens.css`, e a comp `_CONTROLE` do projeto AE carrega os Color Controls nomeados que as expressões leem. Ninguém digita `#DD4E27` num fill de text layer à mão. Se um roteiro escrever um hex, ele está escrevendo um bug.

### 1.12 Zero texto ou logo vindo de IA generativa
- **Porquê:** modelos alucinam glifo, e português é o pior caso. Estas peças são quase todas tipografia, preço e rótulo de plano.
- **Em vídeo:** todo elemento tipográfico nasce no After Effects. Higgsfield entra em no máximo 2 ou 3 planos na leva inteira (só restam 96,62 créditos), sempre como textura ou atmosfera: papel com luz rasante, tinta assentando, poeira de arquivo em contraluz, macro de carimbo, fibra de papel. O prompt carrega negativo obrigatório: `no text, no letters, no numbers, no typography, no logo, no face, no animal`. Nenhum plano de IA pode conter algo que precise estar factualmente correto.

### 1.13 Zero nome, cor, logo ou silhueta de concorrente
- **Porquê:** arquétipo anti-guru e anti-cross-sell. A marca não se define pelo inimigo.
- **Em vídeo:** qualquer UI de terceiro em quadro é neutra e genérica: sem paleta reconhecível, sem tipografia reconhecível, sem layout reconhecível. Também não vale a comparação implícita ("aquele app azul que você usa"). O gráfico de barras que compara praças (BH, SP, RJ) compara **cidades**, não empresas, e isso é o limite.

### 1.14 Nada de foto de banco de imagem posando de contador
- **Porquê:** a marca vende honestidade. Stock de "profissional sorrindo com prancheta" é a assinatura visual de quem não tem produto.
- **Em vídeo:** ou pessoa real autorizada, ou ilustração, ou render, ou tela real do app. Nesta leva, sem mascote e com o app já tendo 80 telas reais em `marketing/telas-app/`, a resposta padrão é: **tela real do app**.

### 1.15 Não é peça de garantia
- **Porquê:** "incondicional" e "sem letra miúda" são promessas proibidas no canon. A garantia de 7 dias existe, mas vive na LP, e esta campanha é waitlist, não venda.
- **Em vídeo:** proibido dizer ou escrever "garantia", "incondicional", "sem letra miúda", "sem pegadinha", "sem surpresa". O equivalente permitido é descritivo, não promissório: mostrar os dois preços juntos, do mesmo tamanho, na mesma tela. Mostrar substitui prometer.

### 1.16 Ink-400 `#A19B92` nunca é texto de leitura
- **Porquê:** falha AA. É placeholder e disabled, só.
- **Em vídeo:** o super de condição, o micro-label e a fonte do dado usam texto terciário `#736E67` no papel e `#8E8981` no dark. Nunca ink-400. Isso importa mais em vídeo que em UI, porque o vídeo comprime e a compressão come exatamente o contraste baixo.

### 1.17 Cor de estado é estado do CNPJ, nunca decoração
- **Porquê:** verde, âmbar e crimson carregam significado operacional dentro do produto. Usá-los como enfeite treina o usuário errado.
- **Em vídeo:** verde `#17A06A` só marca "em dia" ou "feito". Âmbar `#F5A524` só marca "vence em breve". Crimson `#E03E43` só marca "vencido" ou "erro", sempre com ícone e texto. Não existe verde de "aprovado pela campanha", nem âmbar de "atenção dramática".

### 1.18 O nome é Legalizai, com A no fim
- **Porquê:** rebrand travado 03/08/2026. "Legalizei" não se usa mais em superfície nova. O domínio pago continua `legalizei.app`, mas isso é ativo de infraestrutura, não nome exibido.
- **Em vídeo:** wordmark sempre "Legalizai". Locução pronuncia "legalizái". **Nunca usar o lockup completo de `legalizei-logo-app-fundo-solido.svg`, porque o wordmark dentro dele é o antigo**: desse arquivo só se aproveita o quadrado com o check. Para lockup em fundo claro, usar `legalizai-logo-horizontal.svg`; para fundo escuro, `legalizai-logo-negativa-clara.svg`.

### 1.19 Estado selecionado é coral sólido com texto branco, nunca tint
- **Porquê:** travado no ADR em 30/07/2026. Duas gramáticas para o mesmo gesto de "escolhi esta" fazem o tint pálido ler como menos selecionado.
- **Em vídeo:** se a peça mostrar escolha de plano, degrau, card ou opção, o item escolhido é fill coral-600 sólido com texto branco (≥56px), e o texto interno inverte junto. Nada de tint coral-50 com texto escuro para significar seleção.

### 1.20 O claim "100% digital de verdade" é de marketing, não de operação
- **Porquê:** internamente se sabe que ~15 a 20% do trabalho ainda exige humano (órgãos sem API). O claim está travado como claim, mas ele não pode ser esticado.
- **Em vídeo:** pode dizer o claim. Não pode dizer, escrever ou insinuar "nenhum humano", "totalmente automático", "você não faz nada", "resolve sozinho", "sem precisar falar com ninguém". A honestidade é o produto: o diferencial da marca é ser sincera desde a entrada, não ser mágica.

### 1.21 ACHADO NO ADR, não está no brief: o ME não é nacional
- **Porquê:** decisão de 03/08/2026. **MEI a Legalizai abre de qualquer cidade do Brasil. ME e Simples Nacional hoje só atende BH e MG** (limite geográfico da esteira). Por isso o MEI pula o gate de cidade no flow.
- **Em vídeo:** peça do **mote C (ME / Simples Nacional) não pode prometer nem sugerir cobertura nacional**: nada de mapa do Brasil inteiro, nada de "de qualquer lugar", nada de "onde você estiver". Peça do **mote B (MEI) pode**, e isso é inclusive um argumento forte não explorado. Peça do mote A (institucional) evita o tema, porque a marca fala dos dois.

### 1.22 ACHADO NO ADR, não está no brief: nada de termo contratual nestes criativos
- **Porquê:** fidelidade de 12 meses do MEI, certificado digital incluso, multa rescisória de 30% do saldo, e a taxa da Junta que **o cliente sempre paga** (a Legalizai não arca, travado 30/07) são todos termos reais, mas nenhum deles foi validado para esta campanha de waitlist, e o preço de MEI no ADR (`R$49,90`) diverge do preço da campanha.
- **Em vídeo:** proibido citar fidelidade, multa, certificado digital, taxa da Junta, DAE, TTRT e prazo de abertura. Os únicos números permitidos são os quatro do brief: **19 e 49 (MEI)**, **79 e 139 (ME)**. E o **22** dos anos de escritório. Nenhum outro número monetário entra em quadro sem o Pedro aprovar.

### 1.23 Anti-cross-sell: uma peça vende uma coisa
- **Porquê:** o arquétipo é o oposto do líder do mercado. Empilhar oferta é o comportamento que a marca criticou para existir.
- **Em vídeo:** a peça do MEI não menciona o ME. A peça do ME não menciona o MEI. A institucional não menciona preço nenhum. Nenhuma menciona serviço avulso, blog, indicação ou app irmão. Um CTA por peça: `Cadastre-se`.

### 1.24 O alvo do humor é sempre a marca ou a prática do setor
- **Porquê:** o cliente é o herói. Rir da dúvida de quem assiste quebra o arquétipo Aliado e queima a Persona C, que é a que mais cai no MEI.
- **Em vídeo:** a piada é "eu já caí numa letra miúda", "linguagem de cartório nunca fez guia chegar mais barata", "tô te oferecendo o preço de um app que nem abriu, era pra soar estranho". Nunca "você ainda faz isso na planilha?", nunca "todo mundo erra isso", nunca cara de espanto reagindo a uma pergunta ingênua. Em peça de MEI, o default é o par sóbrio, não o cômico.

### 1.25 Preço, rótulo de plano, prazo e CTA nunca vivem só no áudio
- **Porquê:** Meta e Instagram rodam sem som por padrão. Um preço que só existe na locução é um preço que a maioria da audiência não recebe, e um rótulo de plano que só existe na locução é risco de comunicação enganosa.
- **Em vídeo:** os quatro aparecem em **texto de tela** (destaque ou super), não só na legenda queimada, e ficam em quadro no mínimo 1,5s cada. O rótulo `MEI` ou `ME · SIMPLES NACIONAL` entra no mesmo quadro do preço, colado, nunca num quadro anterior nem posterior.

### 1.26 Escassez real apenas
- **Porquê:** honestidade antes do toque. Os dois limites que existem são verdadeiros.
- **Em vídeo:** proibido countdown, relógio, contagem regressiva, contador de vagas, "restam X", "só hoje", "última chance", barra enchendo. Os únicos limites citáveis são **31 de dezembro de 2026** e **enquanto a lista estiver aberta**, sempre juntos, sempre unidos por **"o que vier primeiro"**, e sempre por extenso, nunca `31/12/2026`.

### 1.27 Mecânica de reserva explícita nos motes B e C
- **Porquê:** o app não lançou. Ninguém paga hoje. Vender preço de produto inexistente sem explicar a mecânica é a única forma de esta campanha virar problema jurídico.
- **Em vídeo:** os motes B e C dizem **na tela e no áudio** que o app ainda não abriu, que ninguém paga nada agora, e que o valor fica guardado para o lançamento. O super de condição entra a partir do 2º quadro e fica até o fim.

---

## 2. SISTEMA DE LETTERING PARA 9:16 VERTICAL (1080 × 1920, 30 fps)

### 2.1 Por que não é uma escala da tabela do SPEC

A tabela do SPEC foi feita para 3840×2160 assistido em tela grande, à distância de mesa. Aqui a peça é vista num retângulo estreito, num polegar em movimento, com som desligado, e com a UI do Instagram comendo topo e rodapé. Duas consequências:

1. **O tipo cresce em proporção.** A legenda do filme é 96px em 3840 (2,5% da largura). Aqui ela é 60px em 1080 (5,6% da largura), ou seja, mais que o dobro em peso relativo.
2. **A legenda sobe.** No filme ela mora em `baseline y 1780 a 1960` de 2160, que é 82% a 91% da altura. Aqui isso cairia debaixo do nome de usuário e do ticker de áudio do Reels. A faixa de legenda sobe para 69% a 75% da altura.

### 2.2 Grade e zonas verticais

| Faixa (y) | Nome | Regra |
|---|---|---|
| 0 a 200 | Zona morta topo | Barra de status e header do Reels. Nada legível, nada carregando informação. |
| 200 a 360 | Faixa de micro-label | Só label C. Baseline em **y = 320**. |
| 360 a 1140 | Palco | Âncora, objeto, card, tela do app. **Centro óptico do bloco-âncora em y = 790** (41% da altura). |
| 1140 a 1220 | Respiro | Vazio. Separa palco de legenda. |
| 1220 a 1400 | Faixa da legenda queimada | Ver 2.4 para as duas baselines. |
| 1400 a 1520 | Faixa do super de condição | Só motes B e C. Baselines 1420, 1460, 1500. |
| 1520 a 1920 | Zona morta rodapé | Usuário, legenda do post, ticker de áudio, barra de progresso. Nada legível. |

**Margem lateral: 72px de cada lado.** Área útil horizontal `x = 72 a 1008`, largura 936. O 72 não é gosto: é o `space-5` do sistema (24, o padding lateral da página) multiplicado por 3, que é o fator entre a viewport de desenho mobile (360) e o frame (1080).

**Corredor da UI do Instagram (evitar elemento significativo):**
- Coluna de ações à direita (curtir, comentar, enviar, mais): aproximadamente `x 880 a 1080`, `y 1040 a 1780`. A margem de 72 já protege quase tudo; o cuidado extra é não jogar a palavra coral nem o número-âncora encostado à direita na metade de baixo.
- Bloco de usuário e legenda do post: `y ≈ 1560 a 1800`, largura quase toda.
- Cabeçalho: `y ≈ 60 a 200`.

**Crop 4:5 do Feed (se a mesma peça rodar em Feed):** o Meta corta 1080×1350 centralizado, ou seja preserva `y 285 a 1635`. Todo o sistema acima cabe dentro dessa janela, incluindo o micro-label em 320 e o super em 1500. Isso é intencional: **o mesmo master serve Reels, Stories e Feed sem reautorar.**

### 2.3 Os três papéis, adaptados

| Papel | SPEC (4K 16:9) | **9:16 (1080×1920)** |
|---|---|---|
| **A · Âncora / número-herói** | Sora 700, tracking -2%; números 560 a 720px, texto 280 a 360px; centro óptico y ≈ 46% | Sora 700 a 800 (eixo `wght`), tracking -2%. **Número: 300 a 420px. Palavra-veredito: 200 a 260px.** Line-height 0,95em. **Centro óptico do bloco em y = 790.** Máximo 1 âncora por peça em quadro ao mesmo tempo. |
| **B · Legenda corrida (queimada)** | Sora 600, 96px, máx 2 linhas × 2400px, terço inferior, baseline y 1780 a 1960 | **Sora 600, 60px**, line-height 1,25 (75px), tracking -1%, centralizada. **Máx 2 linhas × 880px de largura.** Máx 5 palavras por bloco. Baselines na 2.4. |
| **C · Micro-label** | Sora 500, 48px, CAPS, tracking +8%, canto sup. esq. ou sob a âncora | **Sora 500, 32px**, CAPS, tracking +8%, cor texto-terciário. Canto superior esquerdo em `x = 72, baseline y = 320`, ou colado sob a âncora com gap de 40px. Separador `·`, nunca travessão. |
| **D · Super de condição** (novo, não existe no SPEC) | n/a | **Sora 400, 30px**, line-height 1,35, alinhado à esquerda em `x = 72`, largura máx 936, **máx 3 linhas**, baselines 1420 / 1460 / 1500. Cor texto-terciário. Entra a partir do 2º quadro e fica até o fim. Só motes B e C. |
| **E · Rótulo de botão / CTA** (novo) | n/a | Sora 700, **56px mínimo**, branco sobre coral-600 (abaixo de 56px o fill obrigatoriamente vira coral-700). |

**Piso absoluto de legibilidade: 30px.** Abaixo disso nada entra em quadro, nem carimbo, nem fonte de dado. Qualquer coisa que **venda** algo (preço, rótulo, prazo, CTA) fica em 40px ou mais.

### 2.4 Baseline da legenda queimada, os dois casos

| Caso | Última baseline | 1ª baseline (bloco de 2 linhas) |
|---|---|---|
| **Mote A (sem super de condição)** | **y = 1440** | y = 1365 |
| **Motes B e C (com super de condição)** | **y = 1320** | y = 1245 |

O bloco cresce **para cima**: a última linha fica ancorada, para o olho não ter que reencontrar a legenda a cada frase.

### 2.5 Como a âncora dimensiona sozinha

O tamanho da âncora não é escolhido, é **calculado para caber em 936px**, com teto de 420px e piso de 240px. Sora Bold tem avanço médio de ~0,60em em dígitos e ~0,68em em caixa alta.

| String | Largura em em | Tamanho resultante | Nota |
|---|---|---|---|
| `R$19` | ≈ 2,48em | **377px** | dentro da banda |
| `0,7%` | ≈ 2,34em | **400px** | dentro da banda |
| `22` | ≈ 1,20em | **420px** (teto) | teto vence |
| `R$79` | ≈ 2,48em | **377px** | |
| `7,4 MILHÕES` numa linha | ≈ 6,50em | 144px | **reprovado**, cai abaixo do piso |

**Regra que resolve o último caso:** quando a âncora tem número e qualificador, o número vai sozinho na linha 1 no tamanho máximo, e o qualificador vai na linha 2 com **45% a 55% do tamanho do número**. `7,4` em 420px, `MILHÕES` em 197px.

### 2.6 Ritmo de cor dentro da legenda (direção do Pedro de 14/08, que substitui a regra "1 coral por take" nas legendas)

Peça de 15 a 30s roda em **modo duas cores**, não três. A alternância de três cores do filme lê como ruído na velocidade de Reel.

| Fundo | Texto normal | Palavra forte (1 por frase) |
|---|---|---|
| Dark `#15171C` | `#F4F1EC` | **coral-500 `#F2643C`**, Bold |
| Papel `#FAF8F5` | `#1B1E24` | **coral-600 `#DD4E27`**, Bold |
| Mundo coral (fundo coral cheio) | `#FFFFFF` | `#1B1E24` |

O rig existente já suporta isso via a flag `OPC.duasCores` em `marketing/filme/escalada/jsx/32-lettering.jsx`.

### 2.7 Parâmetros para reusar o rig do escalada em 9:16

`32-lettering.jsx` está com o frame **hardcoded na linha 17**:

```
var W = 3840, H = 2160, FPS = 30;
```

Para a leva vertical isso precisa virar parâmetro. Os defaults atuais (`TAM = 125`, `LARG_MAX = 3000`, `XC = 1920`, `Y1 = 1124`) são todos de 4K. Bloco de opções para 9:16:

```
$.global.LETTERING_OPCOES = {
  W: 1080, H: 1920, FPS: 30,
  tema: "dark",          // ou "papel"
  duasCores: true,
  tam: 60,               // legenda corrida
  larguraMax: 880,
  xc: 540,
  y1: 1320,              // 1 linha, motes B e C
  y2a: 1245, y2b: 1320   // 2 linhas, motes B e C
};
```

Para mote A, trocar `y1` por 1440 e `y2a/y2b` por 1365/1440.

### 2.8 Telas reais do app em quadro

As telas são 1290×2796. Se uma tela inteira entrar num frame de 1920 de altura ocupando 1500px, ela escala para 0,536 e o corpo de 16px do app vira 25,7px em quadro, abaixo do piso de 30. Portanto:

- **Ou** a tela entra como textura, em escala pequena, com um micro-label ou destaque nomeando o que é (o espectador não precisa ler a UI, precisa reconhecer que é um app real);
- **Ou** a tela é recortada num único componente e ampliada em **2,2× ou mais**, para o corpo da UI cair em 44px ou mais em quadro.

Nunca mostrar uma tela inteira esperando que o espectador leia o que está escrito dentro dela.

---

## 3. LISTA FECHADA DE ONDE O CORAL PODE ACENDER (peça de 15 a 30s)

O SPEC do filme tem lista fechada porque coral disperso mata o coral. O equivalente para peça de campanha separa dois sistemas que operam ao mesmo tempo, com regras diferentes:

### Sistema 1 · Legenda queimada
**Uma palavra forte coral por frase**, conforme a direção do Pedro de 14/08. Isso é ritmo de leitura, não ênfase de conteúdo, e não conta no teto do palco.

### Sistema 2 · Palco (lista fechada)

**Teto: peça de 15 a 20s → no máximo 2 acendimentos. Peça de 20 a 30s → no máximo 3.**

| # | Onde pode acender | Cor | Limite |
|---|---|---|---|
| 1 | **O algarismo do preço de reserva** (`19`, `79`) | papel: coral-600 · dark: coral-500 | 1 por peça. O segundo preço (`49`, `139`) fica em ink, **do mesmo tamanho**. O coral é ênfase, não hierarquia de valor. |
| 2 | **A palavra-veredito da peça** (`ainda`, `hoje`, `guardado`, `MAIOR`, `22 ANOS`) | idem | 1 por peça, e só se for âncora classe A |
| 3 | **O objeto que a metáfora resolve** (o pino, o check desenhado, a etiqueta de preço, o degrau que desce, o carimbo que assenta) | idem | 1 por peça, 1 objeto só |
| 4 | **O badge ou chip de dado real** (`3ª`, `11 HORAS`) | idem | 1 por peça, e **só se a fonte do dado estiver na tela** num micro-label |
| 5 | **O fill do botão do end card** | coral-600, texto branco ≥56px | sempre presente, **não conta no teto** |
| 6 | **O "AI" do wordmark no fecho** | coral-500 | sempre presente, **não conta no teto**. O lockup inteiro (ícone + os dois pingos de i + o "ai") conta como **um** acendimento, não três. |

### Regra de simultaneidade
**Um foco coral por frame no palco.** Se a âncora está acesa, a palavra forte da legenda naquela frase fica em ink ou `#F4F1EC`. A única exceção é o end card, onde o "AI" e o botão coexistem por construção.

### Onde o coral nunca acende
- Em erro, prazo perdido, vencimento, multa ou qualquer estado negativo (isso é crimson `#E03E43` + ícone + texto).
- No rótulo do plano (`MEI`, `ME · SIMPLES NACIONAL`): rótulo é ink, sempre. Acender o rótulo faz o rótulo competir com a oferta.
- No super de condição.
- No segundo preço (`49`, `139`).
- Como fundo cheio de um quadro de tensão ou de dor.
- Como flash de transição.
- Em fill de área maior que ~35% do frame, exceto no end card.
- Em qualquer coisa que também esteja se mexendo rápido. Coral que se mexe rápido lê como alerta.

---

## 4. PALETA OPERACIONAL

### 4.1 Mundo papel (o mundo da solução)

| Papel no vídeo | Hex | Onde entra | Onde é proibido |
|---|---|---|---|
| Fundo de cena | `#FAF8F5` | fundo padrão do mundo claro, end card | nunca `#FFFFFF` como fundo de cena |
| Card / superfície | `#FFFFFF` | card, moldura de tela, folha | como fundo do frame inteiro |
| Superfície alternada | `#F1EEE9` | faixa de contraste sutil, fundo de chip neutro | |
| Hairline | `#E3DED7` | borda de card, divisor, contorno de moldura. **3px em 1080** | não substituir por sombra |
| Borda forte | `#CBC5BC` | divisor de seção, contorno de botão secundário | |
| Texto primário | `#1B1E24` | legenda queimada, âncora, corpo | |
| Texto secundário | `#524E48` | subtítulo, apoio | |
| Texto terciário | `#736E67` | micro-label, super de condição, fonte de dado | |
| Texto muted | `#A19B92` | **nada.** Só placeholder de UI dentro de uma tela do app | qualquer texto que precise ser lido |
| **Marca** | **`#F2643C`** (coral-500) | **só símbolo e wordmark** | fill de botão, chip, barra, pino |
| **Ação** | **`#DD4E27`** (coral-600) | fill de botão, pino, badge, barra de gráfico, palavra forte da legenda no papel | texto branco por cima abaixo de 56px |
| Ação pequena / hover | `#B83D1C` (coral-700) | fill quando o rótulo branco fica abaixo de 56px | como cor de marca |
| Tint de marca | `#FEF3EE` (coral-50) | fundo suave de destaque | como estado selecionado (selecionado é sólido) |
| Em dia | `#17A06A` | check de "feito", mês visitado, status do CNPJ | como decoração, como "aprovado" genérico |
| Vence em breve | `#F5A524` | chip de prazo se aproximando | como "atenção" dramática |
| Vencido / erro | `#E03E43` | prazo perdido, multa, **sempre com ícone + texto** | sozinho, só na cor |
| Dica | `#3B82E0` | só dentro de uma tela real do app, uso mínimo | como cor de marca, de fundo, de grade ou de luz |

### 4.2 Mundo escuro (o mundo do problema)

Todos vêm do bloco `:root[data-theme="dark"]` do `tokens.css`. Não inventar tons.

| Papel no vídeo | Hex | Nota |
|---|---|---|
| Fundo de cena | `#15171C` | o dark do arco, o fundo do problema |
| Card / superfície | `#1F2228` | card skeleton, card de dúvida |
| Superfície alternada | `#282B32` | |
| Superfície mais profunda | `#0A0B0E` | fundo de fundo, vinheta |
| Tint de marca | `#2A1B15` | |
| Hairline | `#2E313A` | contorno de iPhone, borda de card, 3px |
| Borda forte | `#3C4049` | |
| Texto primário | `#F4F1EC` | **nunca `#FFFFFF`** |
| Texto secundário | `#BDB8B0` | palavras curtas de apoio na legenda (≤3 letras) |
| Texto terciário | `#8E8981` | micro-label, super de condição no dark |
| Texto muted | `#615D57` | nada legível |
| **Ação no escuro** | **`#F2643C`** (coral-500) | no dark o `action-primary` sobe para o 500, porque o 600 fica pesado. É por isso que a palavra forte no dark é coral-500 e no papel é coral-600. |
| Ação pequena no escuro | `#DD4E27` (coral-600) | |
| Sucesso no escuro | tint `#122720` · texto `#5FCB9E` | |
| Alerta no escuro | tint `#2A2211` · texto `#F1BC6A` | |
| Erro no escuro | tint `#2B1517` · texto `#F08D90` | |
| Dica no escuro | tint `#132131` · texto `#82B2EF` | uso mínimo |

### 4.3 Gradientes (do `tokens.css`, valores literais, não copiar de tela)

| Nome | Valor | Uso em vídeo |
|---|---|---|
| `ink-hero` | `linear-gradient(160deg, #2A2E37 0%, #15171C 62%, #202433 100%)` | fundo do mundo escuro, com um pouco de vida |
| `scrim` | `linear-gradient(to top, rgba(21,23,28,.94) 4%, rgba(21,23,28,.55) 46%, rgba(42,46,55,.10) 100%)` | **a única forma autorizada de garantir legibilidade de legenda sobre imagem.** Substitui caixa preta e stroke |
| `metal` | `linear-gradient(150deg, #3a3d44 0%, #16181d 45%, #2b2e35 100%)` | moldura de dispositivo, superfície fria |
| `brand-glow` | `radial-gradient(120% 80% at 15% 0%, coral-500 a 22%, transparent 60%)` | **exclusivo do acendimento do "AI" no end card.** Único glow permitido na leva |

### 4.4 Grade e textura
Grain de 1,5% a 2% e grade quente leve são obrigatórios em qualquer transição de área grande (a onda de papel, o apagão), porque em 8 bits com H.264 essas áreas fazem banding. Círculo vetorial, nunca Radial Wipe.

---

## 5. GRAMÁTICA DE MOTION

### 5.1 As três durações (do sistema, iguais às do produto)

| Token | ms | Frames @30 | Onde em vídeo |
|---|---|---|---|
| `motion-micro` | **150** | 5f | palavra da legenda corrida, chip, hairline se desenhando, check assentando, snap de atenção |
| `motion-default` | **250** | 8f (7,5 arredondado) | card entrando, saída de frase em fade, troca de estado, super de condição entrando |
| `motion-enter` | **400** | 12f | âncora, objeto-herói, tela do app, logo do end card |

Tudo snapa para múltiplo de 1/30s. Nada de duração "entre".

### 5.2 Easing
- **Sempre ease-out.** Em After Effects: influência temporal de chegada ~66%, velocidade 0 na chegada, saída entre 0 e 20%.
- No modo mais premium (o `modo apple` do rig do escalada): entrada rápida com influência 28% e desaceleração longa com influência 92%. Isso é permitido em âncora e objeto-herói, não em legenda corrida.
- **Nunca ease-in-out em entrada.** Nunca ease-in isolado, exceto num único lugar: o objeto que cai por gravidade na virada dark para papel.

### 5.3 Valores de animação

| Elemento | Opacidade | Y | Escala | Outro |
|---|---|---|---|---|
| Palavra da legenda corrida | 0 → 100 em 150ms | +28 → 0 | 92 → 100 | rotação alternada -4°/+4° opcional, máx ±4° |
| Palavra forte da legenda | 0 → 100 em 250ms | +40 → 0 | 88 → 100 | `wght` 400 → 700 |
| Âncora | 0 → 100 em 400ms | +48 → 0 | 92 → 100 | `wght` 300 → 700; tracking +2% → 0 |
| Card | 0 → 100 em 250ms | +32 → 0 | 96 → 100 | |
| Chip / badge | 0 → 100 em 150ms | 0 | 88 → 100 | |
| Saída de frase | 100 → 0 em 250ms | **0, sem movimento** | 100 | |
| End card, papel | POP em 4 frames | | | corte, não dissolve |
| End card, "AI" | acende em 150ms | | | `brand-glow` sobe junto |

**Stagger entre palavras: 60 a 90ms (2 a 3 frames).** Acima de 120ms a frase lê como lista, não como fala.

### 5.4 Ritmo de corte (mais apertado que o filme)
- **Nunca mais de 1,2s sem micro-evento.** O filme institucional usa 1,5s; num Reel o polegar é mais rápido.
- **Primeiro micro-evento até o frame 12** (400ms). O hook não pode começar parado.
- Duração mínima de plano: 0,8s. Abaixo disso o espectador não processa e o corte vira ruído.
- **Cortes secos.** Dissolve é proibido, com uma exceção: a onda de papel da virada dark para coral.
- Push-in contínuo de 3% a 5% ao longo de um plano, uma direção só. Nunca zoom com keyframe visível, nunca zoom para dentro e para fora no mesmo plano.
- **Hold do preço: mínimo 1,5s** em quadro parado o suficiente para ser lido. Hold da âncora não-preço: mínimo 1,2s. Hold do end card com o botão: mínimo 1,8s.

### 5.5 Proibido, sem exceção
1. Bounce. Em nada.
2. Overshoot em texto. Em objeto físico, no máximo 2%.
3. Spring, elástico, wiggle, jitter.
4. Motion blur em texto.
5. Blur de zoom, blur direcional, glitch, RGB split, lens flare.
6. Typewriter letra a letra. O sistema é **word-by-word**.
7. Strobe, piscada, flash branco, flash coral.
8. Whip pan, roll de câmera, shake, handheld simulado em tipografia.
9. Caixa preta atrás da legenda. Usar o `--gradient-scrim`.
10. Stroke, contorno ou sombra projetada em texto.
11. Pulso infinito no CTA, seta piscando, botão "respirando".
12. Countdown, relógio, barra enchendo, contador de vaga.
13. Animação de tracking além de +2% → 0.
14. Zoom no logo do end card. O logo entra e assenta, não cresce.
15. Qualquer efeito que exista para "esconder" que o plano não é bom.

---

## 6. VOZ DA MARCA EM 1ª PESSOA

O Léo saiu de quadro, então a 1ª pessoa deixou de ser dele e virou **a marca falando**. Ela precisa se sustentar sozinha, sem personagem para carregar a simpatia. O que a segura de pé é o instinto de vigia ("eu fico de olho"), a admissão de falha própria ("eu já caí nessa"), e a recusa de fingir ("o app ainda não abriu"). Essas três coisas fazem o trabalho que o rosto fazia.

### 6.1 Dez frases que ela DIRIA

1. "Eu fico de olho no prazo. Você cuida do negócio."
2. "O app ainda não abriu. O preço já está guardado no seu nome."
3. "Ninguém paga nada hoje. Hoje você só entra na lista."
4. "R$19 por mês nos três primeiros meses, R$49 depois. Os dois números do mesmo tamanho, na mesma tela."
5. "Eu sou nova. A contabilidade atrás de mim tem 22 anos em Belo Horizonte."
6. "Eu já caí numa letra miúda. Foi assim que eu aprendi a escrever a minha."
7. "Contador de verdade do Simples Nacional já no plano de entrada, não só no plano caro."
8. "Você não precisa aprender imposto. Você precisa de alguém que já aprendeu."
9. "A gente carrega o chato. Você fica com a empresa."
10. "Vai, legaliza aí."

### 6.2 Dez frases que ela NUNCA diria

1. "A gente cuida — você cresce." *(travessão)*
2. "Diferente daquele app azul, a gente é honesta." *(concorrente, mesmo sem nome)*
3. "É de graça, não custa nada." *(nada finge ser grátis)*
4. "Só hoje. Restam 7 vagas." *(escassez falsa)*
5. "Sem letra miúda, garantia incondicional." *(promessa proibida)*
6. "No MEI você tem um contador só seu." *(no MEI é assistente virtual)*
7. "R$99 por mês no plano ME." *(preço errado; R$99 é lançamento, fora desta campanha)*
8. "Otimizamos a gestão tributária do seu empreendimento." *(Sábio distante, não Aliado)*
9. "Você está fazendo tudo errado desde o começo." *(ri de quem assiste)*
10. "Prezado cliente, vimos por meio desta informar." *(linguagem de cartório)*

**Quase-erros que também reprovam:** dizer "Legalizei" em vez de "Legalizai"; falar o preço só na locução sem ele estar na tela; dizer "resolve sozinho, você não faz nada"; e prometer atendimento nacional numa peça de ME.

### 6.3 Teste de uma linha antes de aprovar qualquer fala
> **Isso soa Sábio distante ou Aliado?**
> E: **quem é o alvo da piada, se houver piada?** Se for quem assiste, reescreva.

---

## 7. CHECKLIST DE AUDITORIA DE PEÇA DE VÍDEO

Verificação binária, item a item, aplicável direto no roteiro antes de qualquer render. **Qualquer NÃO reprova a peça.** Ordem de aplicação: bloco A primeiro (reprova imediata), depois os demais.

### Bloco A · Reprovação imediata

- [ ] **Travessão:** nenhum `—` nem `–` no roteiro, na locução, na legenda queimada, no super, no micro-label, no nome do arquivo, nem na legenda do post. Separador usado é `·`, ponto, vírgula ou "e".
- [ ] **Mascote:** o suricato não aparece em nenhum frame. Nem corpo, nem rosto, nem pata, nem silhueta, nem sombra com forma de bicho, nem reflexo, nem versão estilizada, nem ícone dele. Nenhum plano de IA pode gerar um animal.
- [ ] **A peça funciona sem o mascote:** se você adicionar o suricato, ela melhora; ela não passa a existir. Se a peça só faz sentido com ele, ela está reprovada.
- [ ] **Concorrente:** nenhum nome, cor característica, logo, tipografia, layout de UI ou silhueta de concorrente. Nenhuma comparação implícita com "aquele outro app".
- [ ] **Preço não vive só no áudio:** todo valor monetário citado aparece em texto de tela por 1,5s ou mais.
- [ ] **Rótulo de plano:** `MEI` ou `ME · SIMPLES NACIONAL` aparece **na tela e no áudio**, no mesmo quadro do preço. Mote A não tem rótulo nem preço.
- [ ] **Preço correto:** MEI = R$19 nos 3 primeiros meses e R$49 depois. ME = R$79 nos 3 primeiros meses e R$139 depois. Nenhum R$99. Nenhum R$49,90. Nenhum R$195. Nenhum outro valor monetário em quadro.
- [ ] **Os dois preços aparecem juntos, do mesmo tamanho.** O segundo preço não é escondido, nem menor, nem mais rápido, nem sugerido como "quando fica sério".
- [ ] **Mecânica de reserva explícita** (motes B e C): o roteiro diz que o app ainda não abriu, que ninguém paga nada hoje, e que o valor fica guardado para o lançamento.
- [ ] **Qualificador do Simples Nacional** (mote C): toda menção a contador ou CRC vem com **"do Simples Nacional"** colado, na mesma frase, sem intervalo.
- [ ] **MEI não promete humano:** nenhuma menção a contador dedicado, contador só seu, atendimento humano ou pessoa de verdade numa peça de MEI. O MEI tem assistente virtual.
- [ ] **Cobertura geográfica:** peça de ME não promete nem sugere cobertura nacional (ME e Simples hoje é BH e MG). Peça de MEI pode.
- [ ] **Nenhum termo contratual:** zero menção a fidelidade, multa rescisória, certificado digital, taxa da Junta, DAE, TTRT ou prazo de abertura.
- [ ] **Nenhuma promessa de garantia:** as palavras "garantia", "incondicional", "sem letra miúda", "sem pegadinha" e "sem surpresa" não aparecem.
- [ ] **Claim não esticado:** nenhum "nenhum humano", "totalmente automático", "resolve sozinho", "você não faz nada".

### Bloco B · Prazo, escassez e data

- [ ] **Escassez real apenas:** nenhum countdown, relógio, contagem regressiva, contador de vagas, "restam X", "só hoje", "última chance", barra enchendo.
- [ ] **Os dois limites vêm sempre juntos:** "31 de dezembro de 2026" **e** "enquanto a lista estiver aberta", unidos por **"o que vier primeiro"**. Nunca um sem o outro.
- [ ] **Data por extenso:** "31 de dezembro de 2026", na voz e na tela. Nunca `31/12/2026`.
- [ ] **Super de condição presente** (motes B e C): entra a partir do 2º quadro, rodapé, Sora 400 em 30px, máx 3 linhas, última baseline y = 1500, e permanece até o fim.
- [ ] **Prazo não vive só no áudio.**

### Bloco C · Hook e retenção

- [ ] **Hook mudo:** o primeiro quadro carrega o gancho em **texto grande na tela**, legível com o som desligado, e legível já no frame 1 (nada abaixo de 60% de opacidade nos primeiros 6 frames).
- [ ] **Primeiro micro-evento até o frame 12.**
- [ ] **Nenhum trecho de mais de 1,2s sem micro-evento.**
- [ ] **CTA na tela:** o convite para entrar na lista aparece em texto, e o end card carrega o botão `Cadastre-se`.
- [ ] **Ritmo de fala:** ~2,1 palavras por segundo na régua conservadora. Se sobrou tempo, ele foi gasto no quadro do meio, nunca no hook nem no CTA.

### Bloco D · Legenda e tipografia

- [ ] **Legenda queimada do primeiro ao último quadro**, sem buraco.
- [ ] **Legenda ≠ destaque:** o "texto na tela" do roteiro é o super ou card, maior e visualmente diferente da legenda corrida.
- [ ] **Sora em tudo.** Nenhuma outra fonte. Nenhum fallback do AE aceito.
- [ ] **Tamanhos:** legenda corrida 60px · micro-label 32px · super 30px · âncora entre 200 e 420px · rótulo de botão ≥56px. Nada abaixo de 30px em quadro.
- [ ] **Safe area:** nada legível acima de y = 200 nem abaixo de y = 1520. Margem lateral de 72px respeitada. Nada significativo no corredor de ícones do Instagram (`x 880 a 1080`, `y 1040 a 1780`).
- [ ] **Baseline da legenda correta:** 1440 (mote A) ou 1320 (motes B e C), com o bloco crescendo para cima.
- [ ] **Máx 2 linhas e 5 palavras por bloco de legenda**, largura máx 880px.
- [ ] **Tela do app legível ou assumidamente ilegível:** se a UI precisa ser lida, ela está ampliada em 2,2× ou mais. Se não, ela é textura com label nomeando o que é.
- [ ] **Separador de micro-label é `·`.**

### Bloco E · Cor

- [ ] **Coral-500 `#F2643C` só em logo e wordmark** (e como cor da palavra forte no lettering sobre fundo escuro). Nunca fill de botão.
- [ ] **Fill de ação é coral-600 `#DD4E27`.** Se o rótulo branco por cima ficar abaixo de 56px, o fill vira coral-700 `#B83D1C`.
- [ ] **Lista fechada do coral respeitada:** máx 2 acendimentos no palco em peça de 15 a 20s, máx 3 em peça de 20 a 30s, e só nos papéis autorizados. End card não conta no teto.
- [ ] **Um foco coral por frame no palco.** Se a âncora está acesa, a palavra forte da legenda daquela frase não está.
- [ ] **Coral não é erro:** nenhum coral em prazo perdido, multa, vencimento ou estado negativo. Erro é crimson `#E03E43` **com ícone e texto**.
- [ ] **Zero azul de marca:** o info-blue só existe dentro de uma tela real do app. Nada de grade azulado, luz azul, gradiente azul ou gráfico azul.
- [ ] **Fundo é papel quente `#FAF8F5`**, nunca branco puro. Texto sobre dark é `#F4F1EC`, nunca branco puro.
- [ ] **Ink-400 `#A19B92` não é texto de leitura em lugar nenhum.**
- [ ] **Estado selecionado é coral sólido com texto branco**, nunca tint pálido.
- [ ] **Cores de estado só marcam estado do CNPJ**, nunca decoração.
- [ ] **Nenhum hex cru digitado à mão na comp.** As cores vêm do `tokens.json` e da comp `_CONTROLE`.

### Bloco F · Motion e construção

- [ ] **Durações são 150 / 250 / 400ms**, snapadas em 5 / 8 / 12 frames. Nenhuma duração fora da régua.
- [ ] **Easing é ease-out em tudo.** A única exceção é o objeto que cai por gravidade na virada.
- [ ] **Zero bounce, zero overshoot em texto, zero spring, zero motion blur em texto.**
- [ ] **Zero sombra decorativa, zero stroke em texto, zero caixa preta atrás da legenda.** Legibilidade sobre imagem vem do `--gradient-scrim`.
- [ ] **Zero glow**, exceto o `brand-glow` no acendimento do "AI".
- [ ] **Cortes secos.** O único dissolve autorizado é a onda de papel da virada.
- [ ] **Raios corretos no frame vertical:** card 48, botão e input 36, chip 24, pill 999. Símbolo com raio 0,27 × lado.
- [ ] **Hairline em 3px.**
- [ ] **Grain de 1,5% a 2% em qualquer transição de área grande** (anti-banding).

### Bloco G · Marca, origem e entrega

- [ ] **Wordmark é "Legalizai", com A.** Nenhuma ocorrência de "Legalizei" em quadro.
- [ ] **Logo correto:** master `legalizai-logo-horizontal.svg` no papel, `legalizai-logo-negativa-clara.svg` no dark. **Do `legalizei-logo-app-fundo-solido.svg` só se usa o quadrado com o check, nunca o lockup completo** (o wordmark de dentro é o antigo).
- [ ] **End card padrão da leva:** papel quente, logo entrando com o "AI" acendendo em coral, linha de CTA e botão `Cadastre-se`.
- [ ] **A peça funciona com E sem a frase falada "Vai, legaliza aí."**, sem reescrita, porque essa fala ainda depende de validação explícita do Pedro.
- [ ] **Zero texto ou logo vindo de IA generativa.** Todo elemento tipográfico nasce no After Effects.
- [ ] **Cada plano do roteiro está marcado com a origem:** `[AE]`, `[TELA APP]`, `[SVG]`, `[HIGGSFIELD]` ou `[FFMPEG]`.
- [ ] **Planos de Higgsfield:** no máximo 2 ou 3 na leva inteira, sem texto legível, sem logo, sem rosto humano identificável, sem animal, e sem nada que precise estar factualmente correto.
- [ ] **Nenhuma foto de banco de imagem posando de contador.**
- [ ] **Anti-cross-sell:** a peça vende uma coisa só, com um CTA só.
- [ ] **Alvo do humor:** a piada é da marca sobre si mesma ou sobre a prática do setor. Nunca de quem assiste, nunca da dúvida da pessoa. Em peça de MEI, o default é o par sóbrio (a Persona C cai muito no MEI e ironia alta a assusta).
- [ ] **Teste final da voz:** cada fala passou no "isso soa Sábio distante ou Aliado?".