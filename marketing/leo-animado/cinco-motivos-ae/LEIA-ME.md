# Cinco motivos pra ter CNPJ (09/10/2026)

Roteiro 3 de `marketing/conteudo/roteiros-ganchos-2026-10-09.md` (gancho G55 do banco), com o fecho pedido pelo Pedro.
Referências de estilo que ele mandou (YouTube Shorts de AE): fundo escuro com luz em gradiente, cards com brilho,
grade de pontos acesos, ícone que se desenha no traço, explosão de luz e legenda forte, tudo passado pras cores da
marca. Montagem rodada no AE pelo computer use (Arquivo > Scripts > Executar arquivo de script).

## Versão 8 (a que vale)

Pedido do Pedro em 13/10: "Preciso que nas legendas e nas figuras, coloque mais movimento e motion Blur onde é
necessário!". Mesmo áudio e mesmos tempos da v7; só o `CincoMotivos.tsx` mudou.

- **Legenda:** entra subindo com passada (0,2 s), cada palavra pula quando é dita (a ênfase até 108% e com um giro
  pequeno; mais que isso encosta na vizinha) e o bloco sai subindo. Ela passou pra dentro do motion blur, junto com as
  cenas. Desfoque de chegada continua fora: o rastro é só do movimento.
- **Figuras:** as paradas flutuam de leve (`Flutua`, cada uma no seu tempo; as presas uma na outra andam juntas, como a
  guia e o cadeado, os cartões e os vistos); a cena treme nos impactos ("CPF", "5", "6%", "R$ 6.750", carimbo); o "?"
  balança; o contorno dos números grandes gira devagar; brilho correndo na barra dos 10 mil; os pontos do painel do
  INSS pulsam numa onda; linha de leitura no código de barras; a parede do teto pulsa; as pílulas LINK DA BIO pulsam.
- **Motion blur:** 10 amostras e obturador de 240 graus (era 8 e 200). O fecho também entrou no motion blur: o papel e
  o anel andam pelo quadro real (iguais em todas as amostras, sem virar anéis) e o logo e a pílula borram.
- Refazer: `bash renderiza-remotion.sh <...>/saida/cinco-motivos-mudo-v8.mp4` e
  `bash final.sh v8 saida/cinco-motivos-mudo-v8.mp4 copia`.

## Versão 7

Pedido do Pedro sobre a v6: trocar a fala do faturamento ("pode faturar de 1 até 6750 e com o teto de até R$81,000 ao
ano") e, no meio do trabalho, "'Uma média' não, 'exatamente!'". A fala do motivo 1 ficou "Um: no MEI, a guia é fixa.
Fature de 1 real até o teto de 81 mil por ano, exatamente 6.750 por mês." O texto passou por um painel com a base
(F051: o teto é anual; 81.000 ÷ 12 = 6.750), e a tela mostra a conta pra o "exatamente" ficar literal.

- **Voz:** "Um: no MEI, a guia é fixa." é da narração aprovada; na tomada nova inteira a conversão pro Dylan embolou o
  "é fixa" (o whisper ouviu "FX"). A frase nova é a tomada B do clone (`voz/f2-tomadaB.wav`), convertida pro Dylan
  (`voz/f2-dylan.wav`), com o volume casado (+1,0 dB) e as pausas da narração aprovada. `python -B voz-v7.py` grava
  `voz/voz-dylan-v7.wav` e `tempos-v7.json`; tudo depois do motivo 1 anda 5,2 s (156 quadros) e o vídeo vai a 48,5 s.
  - Os tempos de palavra perto de número e depois de silêncio saíram errados do whisper ("6.750", "por", "Dois",
    "Três", "Quatro"...): o `CORRIGE` do voz-v7.py põe os começos medidos pelo envelope da voz.
  - A narração aprovada terminava com um estalo de 16 ms antes do "Vai, Legalizaí" (desde a v2): a v7 corta em 40,24 s.
- **Cena do motivo 1:** régua do ANO, de "R$ 1" até a parede do teto ("R$ 81.000"); no "exatamente" o botão entra na
  parede, a régua se corta em 12 meses e aparece "R$ 81.000 ÷ 12"; no "seis" bate "= R$ 6.750" pronto (nunca conta de
  zero: a conta na tela fica sempre certa), os meses acendem um a um enquanto o número é falado e, no "por mês", um mês
  fica aceso. A guia com o cadeado não muda e não tem valor (F063).
- **Tela do app no celular:** a `impostos_pagar` dizia "Faturou R$ 4.200 · 6% do Simples" com imposto de R$ 178,31 (6%
  de 4.200 dá 252). A v7 usa `public-cinco/telas/impostos_pagar-conta.png`, com "Faturou R$ 2.971,83" (6% = 178,31),
  na mesma fonte; o celular foi renderizado de novo (`assets/celular-3d-17-v7`, links em `public-cinco/cel17v7`).
- **Legenda:** `node legenda-remotion.mjs tempos-v7.json`; o corte "uns 600 de imposto / e uns 9.400 / no bolso." fica
  preso (FORCA) porque o blocos.mjs empatou e trocou.
- **Som:** `python -B mix.py voz/voz-dylan-v7.wav 5.2` (sem efeito sonoro, como na v5).
- **Conferência:** painel de cinco lentes com céticos (legenda x voz, fatos, quadro a quadro do motivo 1, sincronia do
  resto, áudio); os achados confirmados estão corrigidos nesta versão.
- Refazer: `bash renderiza-remotion.sh <...>/saida/cinco-motivos-mudo-v7.mp4` e
  `bash final.sh v7 saida/cinco-motivos-mudo-v7.mp4 copia`.

## Versão 6

Pedido do Pedro sobre a v5: o fecho completo como nos outros vídeos, respiro no card do motivo 3, só o número (sem o
"uns") destacado e com movimento, e o celular chegando da tela, girando, como iPhone 17 Pro Max.

- **Fecho:** o padrão do kit ("Vai," + logo, o "aí" acende em coral a 0,94 s do fecho, LINK DA BIO embaixo), sem o
  desfoque de entrada. Logos em `public-cinco/marca/`.
- **Números:** "R$ 9.400" grande em papel e "R$ 600" em coral, contando de zero com algarismos de largura fixa e um pulo
  no fim.
- **Respiro:** o painel do motivo 3 desceu e encolheu (780 x 500, uns 90 px abaixo do "3"); os cartões do motivo 4
  ganharam espaço entre si e abaixo do "4".
- **Celular:** iPhone 17 Pro Max (Fiq KM, BlenderKit Royalty Free, sem o logo da Apple; ver
  `_assets-externos/FONTES-modelos-3d.md`). Composição `CelularCinco17` (`src/cinco/Celular17.tsx`): chega do fundo
  (z -95) dando uma volta e meia, de costas pra frente, e assenta em 26,15 s. Render a 120 fps em `render-120-17/`, depois
  `python ../sufoco-linha-ae/mistura-120-30.py render-120-17 assets/celular-3d-17` (462 quadros, links em
  `public-cinco/cel17/`). O render a 120 fps leva uns 8 min e ocupa ~900 MB até a mistura: apagar a pasta depois.
- **Som:** o da v5, sem efeito nenhum.
- Refazer: `bash renderiza-remotion.sh <...>/saida/cinco-motivos-mudo-v6.mp4` e
  `bash final.sh v6 saida/cinco-motivos-mudo-v6.mp4 copia`.

## Versão 5

O vídeo da v3 sem nenhum efeito sonoro. Na v4 o Pedro ainda ouvia o som fino nos números: "tira essa bosta, parece um
assovio". Medido: o whoosh 1490 tem um tom subindo de 1,9 pra 2,1 kHz, e o verificado 2867 é um tom puro de 2,1 kHz que
chegava a -5 dBFS. Saíram todos (`EFEITOS = False` no `mix.py`); ficaram a voz, o fecho e a trilha.
`bash final.sh v5 saida/cinco-motivos-mudo-v3.mp4 copia`.

## Versão 4

A versão 3 sem o clique fino na entrada de cada número de motivo (Pedro: "Tire esse efeito sonoro fino toda vez que
aparece um número"). Só o `mix.py` mudou; o vídeo mudo é o da v3: `bash final.sh v4 saida/cinco-motivos-mudo-v3.mp4 copia`.
O clique continua nos três cartões do motivo 4 e nos dois toques do link da bio.

## Versão 3: Remotion

Pedido do Pedro sobre a v2: "Tira esse efeito quando a letra tá chegando, seja um pouco mais rápido e dinâmico, aplique
motions blur e tire barra de progresso, pegue os números e deixe eles grandes e estilizado na esquerda, edite e faça
tudo pelo Remotion".

- **Código:** `precificacao-2026-10-02/remotion/src/cinco/CincoMotivos.tsx`, composição `CincoMotivos` (1080x1920,
  30 fps, 1299 quadros). O public é o `public-cinco`, com links pros arquivos desta pasta e do `sufoco-linha-ae`, sem cópia.
- **O que mudou da v2:**
  - nenhuma letra entra com desfoque, fade ou deslize. A legenda troca seca, e a palavra acende quando é dita, com o pulo
    da ênfase;
  - entradas de uns 0,25 s com passada e saídas de 0,16 s pro lado;
  - motion blur do próprio Remotion (`HtmlInCanvasMotionBlur`, 8 amostras, obturador de 200 graus) em tudo o que se mexe.
    O fundo e o fecho ficam fora;
  - sem a barra de progresso e sem o selo. Os números ficam num trilho à esquerda (Sora 800 de 600 px, coral, com um eco
    em contorno) que rola de um motivo pro outro;
  - cenas rearrumadas pra caber ao lado do número:
    - a guia com o cadeado em cima, à direita, e o faturamento correndo de R$ 500 a R$ 5 mil numa régua;
    - o 6% e a barra embaixo;
    - a nota do salário e o INSS em cima, o painel de pontos embaixo;
    - o celular um pouco mais à direita.
- **Como refazer:**
  1. `node legenda-remotion.mjs`: os blocos da legenda, a partir do `legenda-tempos.json` que o `gera.mjs` grava.
  2. `bash renderiza-remotion.sh`: leva 1 min e grava `saida/cinco-motivos-mudo-v3.mp4`.
  3. `bash final.sh v3 saida/cinco-motivos-mudo-v3.mp4 copia`: junta o som com o loudnorm. O vídeo vai copiado, já em bt709.
  4. Capa: o quadro 132 com `{"semLegenda": true}`, pelo `src/kit/render/stills.mjs`.
  5. Conferência: `bash qc-tiras.sh <vídeo> <pasta>` faz as tiras quadro a quadro das trocas.
- **Armadilhas:**
  - no Studio, a frente aparece sem motion blur, porque a prévia pede a flag de HTML-in-canvas do Chrome. O render usa o
    Chrome 153 do Playwright, que já tem o recurso;
  - sequência de imagens dentro do motion blur (o celular): o quadro da imagem vem do quadro real, passado de fora. Cada
    amostra vê o próprio tempo e misturaria dois quadros;
  - o papel do fecho abre rápido demais pras 8 amostras e virava anéis, então fica fora do motion blur;
  - a faixa dos números precisa de passo maior que a janela (660 contra 480). Sem isso, a ponta do número vizinho e do eco
    aparece no topo.

## Como refazer a v2 (After Effects)

1. **Voz:** `voz/tomada1.wav` é o clone (seed_audio, elemento e43fbc58), convertida pro Dylan (voice_change, preset
   b847bc29) em `voz/voz-dylan.wav`. "ME" foi falado como "microempresa" (a sigla some na voz do Dylan) e "app" foi
   escrito "ép". O fecho "Vai, Legalizaí" é o fixo do kit (`_kit-motion/voz/fecho/`).
2. **Celular 3D:** `precificacao-2026-10-02/remotion/src/sufoco/CelularCinco.tsx`, composição `CelularCinco`
   (1600x2400, 120 fps, 25,2 a 40,6 s do vídeo; telas `impostos_pagar` e `home` do `public-sufoco`). Render em
   sequência PNG e `python mistura-120-30.py` (da pasta do sufoco) pra `assets/celular-3d/` (462 quadros).
   - As malhas do iPhone vêm em escala de centímetro: sem `m.scale.setScalar(1)` o aparelho sai um pontinho.
3. **Mix:** `PYW -B mix.py` grava `audio/mix.wav` (voz, fecho, trilha House One liberada a partir de 51,711 s, e os
   efeitos liberados 1490, 2568 e 2867).
4. **Montagem:** `node gera.mjs` grava `monta.jsx` (só ASCII); rodar no AE com o projeto vazio aberto. Ele monta a comp
   CINCO-MOTIVOS, confere a margem de segurança (96 px dos lados, 240 do topo, 360 da base) e salva `CINCO-MOTIVOS.aep`.
5. **Render:** `bash renderiza.sh saida/cinco-motivos-mudo.mp4 100` (aerender em blocos de 100 quadros, com
   `-mem_usage 5 40`: sem isso o processo chegou a 10 GB no quadro 154 e parou) e depois `bash final.sh v1`.

## Legenda do post

Os 7 dias da ME vão aqui, porque a fala não tem espaço (peça de vendas: F021, F022). Desde a v6 o celular é o
iPhone 17 Pro Max (BlenderKit Royalty Free), e o crédito do modelo saiu da legenda.

```
📲 Entra na lista de espera pelo link da bio. Não cobra nada e não te compromete.

✅ No MEI, a guia é fixa: fature de R$ 1 até o teto de R$ 81 mil por ano, exatamente R$ 6.750 por mês (81 mil ÷ 12)
🧾 Numa ME que começa em 6%: de 10 mil, uns 600 de imposto e uns 9.400 no bolso
🚀 O app calcula e a abertura é com a gente, sem honorário
↩️ Na ME, você tem 7 dias pra mudar de ideia, com dinheiro de volta se desistir antes de autorizar o envio pra Junta

📲 Entrar na lista não cobra nada e não te compromete. Link da bio.
```

## Armadilhas desta peça

- **Legenda com entrada NaN derruba o script com um aviso do AE** ("objeto do tipo Error no qual é necessário um
  número"), numa linha que não é a do erro e fora do try. Era a frase sem o campo `s` (início) que o
  `legendaDaFrase` usa no primeiro bloco.
- **A janela de console do aerender toma a frente** e o computer use não consegue clicar no AE enquanto ele roda.
