# Testes do núcleo do kit (K02)

Provas em Node, sem render e sem gravar no disco (menos o `props-guia.mjs`, que grava as props pedidas, e o
`eventos-guia.mjs --saida`, os dois pelo `../lib/escrita.mjs`). Contrato: `KIT/DESENHO.md` (revisão 2),
seções 4.1 a 4.6, 4.11, 4.12, 5 e 6.

Rodar de qualquer pasta (os caminhos são absolutos por dentro):

```
cd "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/kit/testes"
node equivalencia.mjs
node eventos-guia.mjs
node props-guia.mjs cenas.json <saida.json>
node props-guia.mjs cenas-kit.json <saida.json>
node props-guia.mjs cenas-periodico-22s.json <saida.json>
node periodico.mjs
node validacoes.mjs
node extras.mjs
node modelos.mjs
```

Código de saída: 0 passou, 1 falhou, 2 uso errado, 3 pulado (o `props-guia.mjs`, quando falta arquivo de outro
pacote, e o `modelos.mjs`, com o catálogo mínimo). Grave as saídas no scratchpad ou na pasta da peça (as `props*.json` da peça do guia são do K12).

## Como funciona

- `esbuild-node.mjs`: empacota a entrada TypeScript em memória com o esbuild do `RM/node_modules`
  (`bundle`, `platform node`, `format esm`, gsap e three embutidos) e importa por `data:text/javascript;base64`.
  O plugin "calço" troca `../abertura/useMasterTimeline` (que puxa React, Remotion, SplitText e DrawSVGPlugin)
  por um módulo que só registra `lgEntra`, `lgSai` e `lgPousa` com os mesmos caminhos. O plugin "puro" recusa
  React, Remotion, `@react-three`, SplitText e DrawSVGPlugin no pacote: se o núcleo importar um deles, o teste
  quebra. `node esbuild-node.mjs` sozinho empacota o núcleo e a coreografia original e mostra o tamanho.
- `comum.mjs`: caminhos, leitura da cena, da narração (sem `voz/narracao.json` da peça, usa a
  `RM/src/guia/narracao.json` e confere o md5 do REF), das regiões, do `fecho.json` do K03 (sem ele, `aiAcende`
  0,94) e do catálogo.
- Catálogo: 1) `KIT_CATALOGO=<arquivo.json>` (uma saída gravada do `catalogo.py exporta`); 2) o
  `PY -B KIT/catalogos/catalogo.py exporta` do K01, lido do stdout (o comando não grava nada sem `--saida`);
  3) o mínimo em memória do `catalogo-minimo.mjs` (modelos de vídeo, procedurais, Talent, House One e os efeitos
  da seção 6, com as decisões de risco no formato estruturado, as 4 telas montadas do guia com o `servePecaMei`, a
  splash e o /painel reprovado). `KIT_SEM_K01=1` força o mínimo.
- Em Node o ticker do gsap acorda a cada timeline criada (e o `setTimeout` dele segura o processo): os testes
  chamam `gsap.ticker.lagSmoothing(0)` e `gsap.ticker.sleep()` antes de tudo e de novo no fim, e saem com
  `process.exit`. Quem usar o `montaProps` em script de Node (o CLI do K07) faz o mesmo.

## O que cada teste prova

| teste | prova |
|---|---|
| `equivalencia.mjs` | estado do kit (cena `cenas.json`, 13 batidas) igual ao da coreografia original nos 540 quadros (seek k/30 + 1e-4), em ordem, embaralhado (semente 20261014) e embaralhado com timelines novas; tolerância 1e-9, campo a campo pelo mapeamento da seção 4.2 (cam; obj.aparelho = phone; obj.relogio = watch com buzz; obj.guia = folha; telas.aparelho = tela, textos iguais; mostradores.relogio = relogio; luz.varre; ui.assina, ui.ai, ui.link). Também o instante "verso" contra o cruzamento de ry = -π medido na própria timeline original, e a cena com `troca.instante "verso"` (a tela só difere do original em quadro com o verso de frente). |
| `eventos-guia.mjs` | os 35 eventos de som da cena do guia iguais à tabela da seção 6 (ordem, t em 6 casas, som, args, ganho, filtro, inverte; transpor 0 = ausente) e à fixture do K05 (`KIT/audio/_regressao/eventos-guia-v2.json`) quando ela existir. `--saida <arquivo>` grava o `eventos.json` (formato da seção 4.6). |
| `props-guia.mjs` | as props de uma cena do guia, gravadas pelo `escrita.mjs`, com os avisos esperados (efeitos sem verificação, créditos CC BY, LINK DA BIO #F2643C, "prévia real" com telas do protótipo) e o `creditoLegenda` igual ao texto aprovado. A `cenas-kit.json` pula com aviso (código 3) enquanto a `voz/narracao-kit.json` do K03 e o `telas/regioes.json` do K04 não existirem. |
| `periodico.mjs` | com a `cenas-periodico-22s.json`, a camada ambiente (deriva e flutuação de cada objeto) em t = 22 igual à de t = 0 (≤ 1e-9); com `periodico false` ela não fecha (> 1e-6); a emenda do loop na camada ambiente é um passo normal (sem salto); a volta-loop cai em 21,05 s e todo evento tem `semente = crc32(origem)` (o mesmo `zlib.crc32` do Python). |
| `validacoes.mjs` | cada erro e cada aviso do `montaProps` (seção 4.4) provocado numa cópia em memória da cena, e o `pecas/_modelo/cenas.json` montado com a narração do guia (sem erro, `mStart` 51,711 pela House One, transpor 1 no 2867, sons nos mesmos instantes do guia). Desde 03/10 também as travas de regra: trilha aceita com risco só pela `decisaoRisco` do catálogo que vale pra peça (peça nova: erro; peça de teste: aviso; texto livre, sem verificação e prévia: erro), modelo com decisão pendente, crédito com marca, a trava do F063 em peça de MEI (folha DAS e comprovante sem `mostraValor: false`, tela do guia com valor) e a peça de MEI certa sem trava, tela de captura reprovada, exemplo sem origem e o traço U+2015. Desde a rodada 4 (03/10): a cena do guia copiada pra outra pasta (`op.peca`, o nome da pasta, diferente do campo `peca`) e a pasta de teste renomeada, recusadas; a decisão de risco em peça nova (de agente com `"*"`, do Pedro com `"*"` e de agente com a peça escrita não valem; a do Pedro com a peça escrita vale); o público obrigatório e o F063 por padrão (vazio, `todos` e inválido; o contador com formato diferente de `brl` e o contador em peça de MEI; o cartão do imposto do palco de argila, declarado na cena e vindo das peças padrão do tipo de palco pelo `pecasDoPalco`; a tela do guia como imagem 2D); a tela e a imagem 2D de tela sem origem no catálogo em peça de ME; a tela aceita com risco por decisão de agente com aviso; a marca colada a número no crédito, a licença `CC Attribution`, a NC e o efeito da Epidemic pela fonte; a peça de MEI e a pra todos certas sem trava; e o modelo de peça nova recusado com o público vazio (e conferido como MEI) e montando com `ME`. Passa com o catálogo real e com `KIT_SEM_K01=1` (o mínimo ganhou o palco de argila e uma tela aceita com risco do K13). |
| `modelos.mjs` | os modelos da biblioteca no `montaProps` (frente MODELOS NO RENDER, 03/10), com o catálogo real: caminho `3d/biblioteca/<id>.glb`, pivô centro (caixa das props centrada e o deslocamento igual ao centro da caixa do catálogo), `rotacaoBase` da prancheta (de pé), escala do bloco render nas pilhas de moedas (caixa reescalada), cores e materiais do catálogo somados aos da cena (a cena vence), os erros de cor, de campo de material, de matiz e de número, a câmera de decisão pendente recusada, o celular da biblioteca com aviso fora da peça da decisão e os objetos do guia sem `pivo`, `materiais` nem `cores` (as props do guia não mudam). Pula (código 3) com `KIT_SEM_K01=1`. |
| `extras.mjs` | `projecao.ts` igual à `PerspectiveCamera` do three (0 px de diferença), desprojeção do símbolo (410, 818) dando o (-0,021; 0,019) do guia, `fecho-simbolo` com `alvoMundo null` e a volta-loop nascendo do ponto publicado, pílula e comprovante na `objeto-sai-da-tela`, e `poseRender`/`cameraRender` bit a bit com as fórmulas do `Cena3D.tsx`. |
| `../lib/escrita.mjs --autoteste <pasta>` | as recusas (hardlink sem `forca`, caminho protegido, pasta inexistente, destino que é outro arquivo) e a troca atômica, numa pasta temporária que ele mesmo apaga. |

## Instante "verso" (desvio do contrato)

A seção 5 do DESENHO diz que o "verso" do guia dá 9,3586 s (quadro 280,8) e que o verso fica de frente 6 quadros
(279 a 284). Essa conta usa `power3.out` cúbico, `1 - (1 - u)^3`. No GSAP o power3 é quártico,
`1 - (1 - u)^4` (`power3.out(0,5) = 0,9375`). Medido na timeline original: o ry cruza -π em 9,318186 s
(quadro 279,55) e o verso fica de frente nos quadros 278 a 282 (5 quadros). O resolvedor usa a ease de verdade
do GSAP e acerta o medido; a troca com "verso" entra meio quadro antes do primeiro quadro amostrado depois do
cruzamento (9,316667 s, aparece no quadro 280). A cena da regressão usa o 9,35 do original (aparece no quadro
281); os dois caem com o verso de frente. Pro K12: o critério "verso = 9,3586 ± 0,001" deve ler "verso = o
cruzamento medido (9,3182) ± 0,001", que é o que o `equivalencia.mjs` confere.

## Linha de base do tsc

`tsc-base.txt`: o `npx tsc --noEmit -p .` da raiz deu 0 erro antes do kit (02/10 13:38). Depois do kit: 0 erro no
`npx tsc --noEmit -p src/kit/tsconfig.json` e 0 erro no da raiz (o núcleo não usa API posterior à ES2015).
