# Catálogos do kit de motion

Tudo que o kit pode usar, com o status de licença: trilhas, efeitos, modelos 3D, telas do app, marca, e (do K14) a biblioteca 2D e os assets. Contrato: `KIT/DESENHO.md`, seções 1.6, 3, 4.5, 4.9, 4.12 e 4.13. Dono desta pasta: K01 (menos as camadas dos outros pacotes, listadas abaixo).

O catálogo aponta pro arquivo original, nada é copiado. Quando um arquivo precisa estar dentro de outra pasta (o public do Remotion, a pasta da peça), ele entra por hardlink (`escrita.liga`).

## O que tem aqui

| arquivo | o que é |
|---|---|
| `esquemas/*.schema.json` | JSON Schema 2020-12: trilhas, efeitos, modelos, telas, marca, cenas, biblioteca2d, assets e referencia |
| `trilhas/base.json` | 19 trilhas e 7 prévias de audição (Anexo A.1) |
| `efeitos/base.json` | 32 arquivos, 19 sintetizados e 6 receitas (Anexo A.2, com os usos corrigidos pela seção 0) |
| `modelos/base.json` | 32 itens: 23 GLB, 2 procedurais do inventário, a folha DAS, a pílula "dia 20", o comprovante e 4 arquivos .blend |
| `telas/base.json` | 80 capturas antigas (conjunto 2026-09), 88 de 02/10 (conjunto 2026-10-02), 4 telas montadas do guia e 4 receitas de código |
| `modelos/revisao-render.json` | o bloco `render` dos 32 GLB que entram numa peça (frente MODELOS NO RENDER, 03/10: `publicKit`, `rotacaoBase`, `pivo`, `escala`, `cores`, `materiais`, `sombra`, `sHeroi`, `notaRender`) e o `provaRender` dos 38 modelos provados |
| `modelos/aquisicoes-ext-comum.json` | os 11 objetos de argila do carrossel de 05/10 (`proc-argila-<forma>`, tipo `argila`, a forma em `render.formaArgila`) e o palco de argila (`proc-palco-argila`, tipo `palco-argila`), da extensão comum do kit (03/10) |
| `modelos/aquisicoes-2026-10-05.json` e `modelos/revisao-render-2026-10-05.json` | os 6 modelos detalhados pra argila de 05/10 (despertador, ampulheta, telefone de disco, pastas AZ, carimbo e dispensador de senha), sem textura e com as partes que animam em nós próprios (campo `partes`), e o bloco render deles (`KIT/modelos/LEIA-ME.md`, seção "Modelos detalhados pra argila") |
| `efeitos/aquisicoes-ext-comum.json` e `efeitos/revisao-usos-ext-comum.json` | a receita `truque-2995-clique-forte` (o som padrão da batida carimba) e os usos dos efeitos no final da peça de 05/10, um por evento, com a batida de origem na nota (03/10) |
| `*/revisao-travas.json` | sobreposições das travas de regra (03/10): `decisaoRisco` estruturada em todo item aceito com risco, os 3 modelos de crédito com marca fora do padrão, a receita de mix com Epidemic reprovada, o som da vinheta O Check reprovado e o `servePecaMei` das 4 telas montadas do guia |
| `marca.json` | logos, cores, fonte, componentes (legenda, fecho, LINK DA BIO, régua, tag ME/MEI), tipografia e regras |
| `catalogo.py` | carregador em camadas e linha de comando |
| `valida.py` | validador (esquemas e regras) |
| `bbox_glb.py` | caixa de um GLB pelo chunk JSON |
| `gera_fontes.py` | gera o FONTES consolidado |

## Camadas

Cada tipo (`trilhas`, `efeitos`, `modelos`, `telas`, `biblioteca2d`, `assets`) tem a sua pasta, e o `catalogo.py` junta, nesta ordem:

1. `base.json`: o inventário. Formato `{versao: 1, camada: "base", tipo, geradoEm, geradoPor, fontes, itens: [...]}`.
2. `aquisicoes-*.json`, em ordem alfabética: itens novos, no mesmo formato (`camada: "aquisicoes"`). Id que já existe em outra camada é erro.
3. Sobreposições, nesta ordem: `verificacoes.json`, `revisao-*.json` (ordem alfabética) e `provas.json`. Formato `{versao: 1, camada, itens: {id: {campos}}}`. Elas só trocam campos de itens que já existem (id inexistente é erro, e o id não muda). A mescla é profunda: objeto mescla campo a campo; as listas `verificacao` e `usos` são concatenadas; qualquer outro valor é trocado.

Exemplo de sobreposição (a AudD liberou uma trilha):

```json
{
  "versao": 1,
  "camada": "verificacoes",
  "itens": {
    "pixabay-03-summer-fashion": {
      "status": "liberado",
      "verificacao": [
        {"data": "2026-10-03", "metodo": "audd", "recortes": [20, 60], "resultado": "sem correspondência nos dois recortes"}
      ]
    }
  }
}
```

`biblioteca2d` e `assets` são do K14: enquanto o `base.json` deles não existir, o catálogo vem vazio, com aviso.

## Quem escreve cada arquivo (seção 3 do DESENHO)

| caminho | dono |
|---|---|
| `esquemas/`, `marca.json`, `*/base.json` de trilhas, efeitos, modelos e telas, os scripts e este LEIA-ME | K01 |
| `trilhas/aquisicoes-2026-10.json`, `trilhas/verificacoes.json` (AudD e trocas de status) | K08 |
| `efeitos/aquisicoes-2026-10.json`, `efeitos/verificacoes.json` | K08 |
| `modelos/aquisicoes-2026-10.json` (modelos novos e o símbolo 3D da marca) | K09 |
| `modelos/provas.json` (still de prova e caixa medida) | K10 |
| `modelos/revisao-render.json` (bloco render e prova de render; o `provaRender` é gravado pelo `kit.py prova-modelos --grava-catalogo`) | frente MODELOS NO RENDER (03/10); modelo novo ganha o bloco render aqui ou num `revisao-*.json` novo |
| `telas/revisao-2026-10-02.json` (revisão por regra das 88 telas de 02/10) | K13 |
| `biblioteca2d/base.json`, `assets/base.json` | K14 |
| `modelos/aquisicoes-ext-comum.json`, `efeitos/aquisicoes-ext-comum.json` e `efeitos/revisao-usos-ext-comum.json` | frente PEÇA DE 05/10 DE VOLTA PRO KIT (03/10); objeto ou som novo de extensão entra numa camada nova como estas |
| `modelos/aquisicoes-2026-10-05.json` (gerado pelo `KIT/modelos/cataloga_detalhados.py`) e `modelos/revisao-render-2026-10-05.json` | frente MODELOS DETALHADOS (05/10) |
| `*/revisao-travas.json` (decisões de risco, travas de licença e de F063) | frente TRAVAS DE REGRA (03/10); decisão nova do Pedro entra aqui (ou num `revisao-*.json` novo) |
| `KIT/FONTES.md` (gerado pelo `gera_fontes.py`) | K11 |

Cada pacote escreve só na sua camada. Correção num item do `base.json` entra por sobreposição; erro do inventário em si volta pro K01. A ordem das sobreposições é alfabética: o `revisao-travas.json` entra depois do `revisao-2026-10-02.json` e do `revisao-render.json` e antes do `provas.json` (cada uma mexe em campos diferentes: decisão e licença, bloco render, still e caixa do K10).

## Como gravar (ajudante de escrita)

Todo arquivo desta pasta é gravado pelo `KIT/lib/escrita.py` (temporário na mesma pasta, `os.replace`, recusa de hardlink e de caminho protegido). Sempre com `python -B`:

```python
import sys
sys.dont_write_bytecode = True
sys.path.insert(0, "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/lib")
import escrita
escrita.grava_json(".../catalogos/trilhas/verificacoes.json", camada)
```

Detalhes no `KIT/lib/LEIA-ME.md`. Depois de gravar, rode o `valida.py`.

## Status

Sempre um destes: `liberado`, `aceito-com-risco` (só com `decisaoRisco` estruturada, em qualquer tipo de item), `sem-verificacao` (ainda não conferido; efeito assim entra com aviso, trilha nunca entra) e `reprovado` (não entra em peça).

`decisaoRisco` (o `valida.py` recusa item aceito com risco sem ela, e recusa o texto livre antigo):

```json
{"quem": "Pedro", "quando": "2026-10-02", "pecas": ["guia-pronta-2026-10-14"],
 "texto": "o que foi decidido e a condição", "fonte": "onde está registrado (memória, REVISAO.md...)"}
```

- `pecas`: as peças em que a decisão vale, pelo nome da PASTA em `KIT/pecas` (o kit nunca usa o campo `"peca"` da cena: desde 03/10 a cena com `"peca"` diferente da pasta é recusada). `["*"]` vale só na peça do guia.
- **Quem libera peça nova (rodada 4, 03/10).** Em toda pasta que não é a do guia (`guia-pronta-2026-10-14`), só vale a decisão do Pedro (`quem` começando com "Pedro") com a peça escrita pelo nome: decisão de agente (K13, inventário, orquestrador) e `["*"]` não valem pra peça nova (`catalogo.decisao_vale`, `catalogo.por_que_nao_vale`; o mesmo `decisaoVale` do `nucleo/props.ts`). Na peça do guia valem as decisões registradas. Em peça nova, a trilha aceita com risco sem decisão que vale é recusada, e o modelo e a tela de captura aceitos com risco entram com aviso ("confirmar com o Pedro antes de postar"). Pedro liberando um item pra toda peça: o item vira `liberado`, com a decisão dele em `verificacao`. O `valida.py` avisa quantas decisões são de agente ou com `"*"` (hoje 68: 36 telas do K13 e 27 do inventário com `"*"`, e 5 do orquestrador só pro guia).
- Enquanto o Pedro não decide: `{"quem": "Pedro", "quando": null, "pecas": [], "pendente": true, "pergunta": "o que ele precisa decidir", "texto": "..."}`. O item fica fora do padrão: o kit recusa e o FONTES lista a pergunta.
- Trilha aceita com risco só entra nas peças da decisão (o `montaProps`, o `mixa.py` e o `confere.py` conferem pela mesma regra, `catalogo.confere_trilha`, com o nome da pasta); texto em `trilha.decisaoRisco` da cena não libera nada. Peça de teste (pasta começando com `_`) passa com aviso, porque o `entregar` recusa ela na pasta final.
- Modelo aceito com risco fora das peças da decisão entra com aviso ("confirmar com o Pedro antes de postar"); com decisão pendente (ou com `notaLicenca` sem decisão), o kit recusa.
- Decisão nova do Pedro: grave a `decisaoRisco` numa sobreposição (`revisao-travas.json` da pasta do tipo, ou um `revisao-*.json` novo), rode o `valida.py` e regenere o FONTES.
- Epidemic Sound: as 7 faixas ficam `reprovado` (plano gratuito do Pedro, decisão de 02/10/2026; não cobre conteúdo de marca). As usadas em final entregue levam `usos` com `alerta`. Efeito, receita ou asset com a Epidemic na licença também fica `reprovado` (a `receita-mix-precificacao`, com a Palmy Sway; o som da vinheta O Check, com indícios de Epidemic). Desde 03/10 (rodada 4), a Epidemic é achada pela fonte, pela url, pela licença (nome e url), pelo autor, pela origem e pelo arquivo, em todo tipo de item (`catalogo.cita_epidemic`), e o `valida.py`, o `montaProps`, o `mixa.py` e o `confere.py` recusam fora do reprovado.
- Licença NC (não comercial) ou ND (sem derivações): só no `reprovado` (o `valida.py` dá erro; o `montaProps`, o `mixa.py` e o `confere.py` recusam). Licença SA (compartilha igual) fora do reprovado: aviso do `valida.py` até ter decisão do Pedro (`catalogo.licenca_restrita`, `catalogo.licenca_sa`).
- Mixkit e Pixabay só viram `liberado` depois da checagem de relançamento na AudD (2 recortes limpos), registrada em `verificacao`.
- Prévia de audição tem o status da trilha de origem e nunca vai como trilha de cena (o kit recusa; `catalogo.py lista trilhas --tipo trilha` lista sem elas).

## Convenções por tipo

### Trilhas

- `grade {batida0, periodo, tempo1_0, compasso, confianca}`: a primeira batida, o período em segundos, o primeiro tempo 1 e a confiança (`alta`, `media`, `baixa` ou null).
- `pontos`: cada janela medida vira um ponto em `t = mStart + 10,30` (o toque do "pagar" no reel da guia), com `tipo` `volta`, `drop`, `entrada` ou `parada` e id `<tipo>-<t com 3 casas>` (House One: `volta-62.011`; Talent in the Air, janela B: `volta-15.748`). Na faixa em loop sem seção (Summer Fashion) e na janela alternativa da Match Out, o ponto é só um tempo 1 e fica como `entrada`.
- `janelas [{nome, mStart, pontoNoVideo, ponto, lufs, lufsAntes, lufsDepois, ganhoDb, grade, automacao, picoDbtp, desc}]`: `grade` são os 4 instantes em volta do ponto (tempo 1, semicolcheia, contratempo e tempo 2); `automacao` são pares `[segundo do vídeo, dB somado ao ganho]` com interpolação linear (dois pares no mesmo segundo fazem degrau). A cena acha `mStart = ponto.t - momento`.
- `tom.transporVerificado`: semitons do 2867 com essa trilha; null quer dizer "testar no ouvido".
- `dados` e `notas` guardam o texto original do inventário, sem reescrever; os números estão nos campos.

### Efeitos

- `tipo`: `arquivo`, `sintetizado` ou `receita`.
- Arquivo: `inicioSom_ms` e `sincronia_ms` saem do texto medido (o instante do arquivo que cai no evento, `ancora: "sincronia"` da seção 4.3); `fim_ms`, picos, crista, banda e estéreo saem da medição bruta de 02/10; md5 e duração foram medidos no arquivo. Duplicata leva `duplicataDe` (os usos ficam no item principal).
- Sintetizado: `sintese {modulo, funcao, args, argsPadrao, usaRuido, composto}`, com os argumentos na ordem da função Python. `usaRuido` marca quem consome o gerador global (a ordem desses importa no modo legado); `composto` (s_processa e s_conta) devolve vários tiques e é um evento só.
- `usos`: o V4 tem os efeitos da V2 (perfil `v2`: 166, 1897, 1109 e 2867 em 10,42 s). Onde o inventário dizia outra coisa, o item leva `errata`.
- `ganhoTipico [mínimo, máximo]` em dB, tirado dos usos.

### Modelos

- `caixa {min, max, tamanho}` em metros, já com a escala sugerida (`escala`), tirada do chunk JSON pelo `bbox_glb.py`; `caixaArquivo` é a mesma caixa nas unidades do arquivo. Sem escala sugerida (pilhas de moedas), a caixa fica nas unidades do arquivo.
- `render`: o bloco que o K06 usa (seção 4.9), com `tipoObjeto`, `rotacaoBase`, tela, vidro, textura de malha, sombra e flutuação. Desde 03/10 (frente MODELOS NO RENDER, camada `revisao-render.json`):
  - `publicKit`: o caminho no `RM/public-kit/`. Fixos: `3d/iphone.glb` e `3d/watch.glb` (hardlinks do public-guia). Biblioteca: `3d/biblioteca/<id>.glb`, ligado por hardlink só quando a peça usa (`kit.py modelos`, `props`, `stills` e `render`) e desligado depois (`kit.py limpa <peça> --entregue`). Sem ele, o GLB não entra numa peça (o `valida.py` avisa);
  - `rotacaoBase`: deixa a frente pra +Z (a câmera) e o cima pra +Y; os que vêm deitados no arquivo levam rx +π/2;
  - `pivo`: `"centro"` (o centro da caixa, depois da rotação e da escala, vai pra origem do rig; o `montaProps` calcula o deslocamento e a caixa das props sai centrada), `"base"` (o meio do pé), `"origem"` (a do arquivo: o celular e o relógio do guia) ou `[x, y, z]` em metros;
  - `escala`: a escala de render (vence a do item); a caixa das props é reescalada a partir de `caixa.escala`;
  - `cores` (`{material: "#RRGGBB"}`, tint) e `materiais` (`{material: {cor, rugosidade, metalico, envMap, opacidade, transparente, transmissao, semMapa, semLuz, emissivo, intensidadeEmissiva, dupla, normaisSuaves, matiz}}`; `"*"` vale pra todos; `matiz: [{de, para, tolerancia?, satMin?}]` troca uma cor dentro da textura mantendo a luz e o desgaste): a cor de marca de cada modelo. A cena soma as dela, e a dela vence. O `valida.py` confere os nomes de material contra o GLB;
  - `sHeroi`: o `pose.s` que deixa a maior medida do objeto com os 16 cm do celular do guia; `notaRender`: o que foi decidido e por quê.
- `provaRender {data, folha, lote, posicao, vistas, composicao, difCaixaMm, semDecisao}`: a prova de render (o objeto montado pelo `montaProps` no `KitProvaModelo`, de frente e 3/4, numa folha de contato por lote em `KIT/provas/modelos/render/`). `difCaixaMm` é a diferença entre a caixa medida no navegador e a das props; `semDecisao` marca o modelo de decisão pendente provado só no render.
- Objeto feito em código (procedural) entra quando o `render.tipoObjeto` tem fábrica conhecida (`TIPOS_SEM_ARQUIVO` do `catalogo.py`): os do núcleo (`folha`, `pilula`, `comprovante`), o `calendario-clay` da extensão abertura e o `argila` e o `palco-argila` da extensão comum. O objeto de argila leva a forma em `render.formaArgila` (o campo `render.forma` é o da pílula) e as opções em `render.opcoes`.
- `catalogo.entra_no_render(item, peca)` dá `sim`, `com aviso` ou `não` (com o motivo), pela regra do `montaProps`: .blend, reprovado, sem bloco render ou GLB sem `publicKit` não entram; aceito com risco entra com aviso fora das peças da decisão e fica fora com a decisão pendente. O FONTES traz a coluna "entra no render".
- CC BY é a sigla ("CC BY", "CC-BY") ou o nome por extenso ("CC Attribution 4.0", o rótulo do Sketchfab; "Creative Commons Attribution"; "CC Atribuição"): todos pedem `licenca.creditoLegenda` (`catalogo.cc_by`). "Atribuição" sozinha não conta (a licença do Pixabay diz "atribuição não é necessária").
- Marca no crédito (`catalogo.marca_em`, a lista única `catalogo.MARCAS_CREDITO`, que o `montaProps` recebe pelo `exporta`): sobre o texto sem acento, a marca colada a número, hífen ou outra palavra também conta ("iPhone15", "iPhone-15", "Apple-Watch", "AppleWatch", "CasioF91W"), e a lista tem também GoPro, Garmin, Nokia, Pixel, AirPods, Kindle, Swatch, Bic, Faber-Castell, Coca-Cola, Visa, Post-it e Moleskine (rodada 4).
- `licenca.credito` é o texto da fonte e pode citar título com marca: nunca vai pra legenda. `licenca.creditoLegenda` é `{trecho, fonte, licenca}` sem marca nenhuma, ou null quando a licença não pede crédito. A lista de marcas é uma só, `catalogo.MARCAS_CREDITO` (Apple, iPhone, Google, Casio, Samsung, Nubank, Pix e as outras): o `valida.py`, o `confere.py`, o `gera_fontes.py` e o `montaProps` (pelo `exporta`, em `regras.marcasCredito`) usam ela. A fonte (Sketchfab, Poly Pizza, Khronos glTF Sample Assets) não é marca de produto.
- CC BY cujo autor exigido cita marca (os 3 de "Poly by Google": `glb-carimbo`, `glb-cofrinho` e `glb-carteira`) não tem crédito de legenda possível: `creditoLegenda` null, status `aceito-com-risco` com a decisão pendente do Pedro, fora do padrão até ele decidir.
- Regra do texto de legenda: agrupe os modelos usados por (fonte, licença), na ordem da cena; dentro de cada grupo junte os trechos com ", " e " e " antes do último; cada grupo vira `<trechos> (<fonte>, <licença>)`; grupos separados por "; "; prefixo "Modelos 3D: "; sufixo ", modificado" com um item ou ", modificados" com mais de um. `catalogo.py creditos glb-video-iphone glb-video-watch` dá o texto aprovado: "Modelos 3D: celular por polyman Studio e relógio por alboxer2000_ (Sketchfab, CC BY 4.0), modificados".
- Modelo com `notaLicenca`: a licença ou o desenho pede cuidado (crédito exigido que cita marca, desenho reconhecível); a nota diz qual. Ele só entra com `decisaoRisco` registrada; com a decisão pendente, o kit recusa.

### Telas

- Ids: `tela-<nome>` (conjunto 2026-09, capturas de antes de 29/08, fundo papel, `historico: true`), `tela0210-<nome>` (conjunto 2026-10-02, fundo branco, `sem-verificacao` até a revisão do K13) e `montada-<nome>` (as 4 telas do guia, lidas do disco e conferidas contra o `REF`). As capturas dos dois conjuntos são do protótipo Next.js, não do app Flutter.
- `regioes {nome: {caixa [x0, y0, x1, y1], medido, sistema, desc, cor}}`: `medido "y"` quer dizer que só a faixa de y foi medida (a caixa ocupa a largura toda); `sistema "captura"` são px da captura; `sistema "destino"` são px da tela montada (`{x, y, w, h, r}` da seção 4.8).
- `cortes [{caixa, motivo, regra}]`: o que não pode aparecer, com o código do PROIBIDO (`P..`) ou do FATOS (`F..`), ou null quando é só composição.
- `notaApp {texto, citacao: true}`: a nota do `_manifesto.json`, limpa (sem travessão, sem emoji, concorrente trocado por "[concorrente]"). É citação: nunca vai pro FONTES nem pra texto visível.
- `citacoes [{texto, citacao: true, onde}]`: texto do app citado na prosa do inventário (por exemplo o rótulo da marca sem acento).
- Nove capturas de 02/10 são a página de erro 404 do servidor (md5 igual): o item leva `avisos`. A rota foi apagada do protótipo (@ab68dbc); recapturar dá o mesmo 404, e elas ficam reprovadas.
- `publico` e `servePecaMei` (da revisão do K13): peça de MEI só usa captura com `servePecaMei` true. As 4 telas montadas do guia herdam os dois da captura de origem (`capturaOrigem`, pela receita do K04): só a splash serve MEI; o Início, o Início com o pagar e o Imposto mostram o valor de exemplo da guia (ME) e o kit recusa em peça de MEI (F063).
- Captura reprovada nunca entra: o `telas/monta.py` recusa a receita, e o `montaProps` e o `kit.py fatos` recusam a tela. Captura aceita com risco: o `monta.py` avisa quando a área visível da receita cobre um corte com regra.

### Assets

- `partes` separa o que tem licença diferente dentro do mesmo arquivo. Na vinheta O Check: `imagem` liberada (própria, pode entrar muda) e `som` reprovado (indícios de Epidemic), com `usos` de alerta nos 2 finais entregues.

## Linha de comando

```
python -B catalogo.py exporta [--tipos trilhas,efeitos,modelos,telas] [--saida <arquivo>]
python -B catalogo.py lista trilhas --status liberado --tipo trilha
python -B catalogo.py lista trilhas --clima groove
python -B catalogo.py lista efeitos --categoria whoosh
python -B catalogo.py mostra mixkit-04-house-one
python -B catalogo.py creditos glb-video-iphone glb-video-watch
python -B catalogo.py materiais glb-caneca
python -B catalogo.py referencia guia-pronta-2026-10-14 [--arquivo <json>] [--json]
python -B valida.py [--rapido] [--cenas-estrito] [--json]
python -B bbox_glb.py <arquivo.glb> [--escala s] [--json]
python -B gera_fontes.py --saida <arquivo.md>
```

- `exporta` devolve `{versao, tipos: {tipo: {itens, camadas, avisos}}, marca}` no stdout (UTF-8).
- `materiais <id>` lista os materiais de um GLB (nome, cor base, se tem textura e o que o bloco render já ajusta): são os nomes que `cores` e `materiais` usam, no catálogo e na cena.
- `referencia` confere o registro congelado da peça (seção 4.13): tamanho e md5 iguais; st_ino diferente com o mesmo md5 vira aviso ("regravado com o mesmo conteúdo"); st_nlink não conta; as cópias de `_referencia/` são conferidas pelo md5. Sai com código 1 se algo mudou.
- `valida.py` sai com código 1 se houver erro. Avisos esperados hoje: o `sint-s_assinatura` sem argumentos declarados e os 3 modelos de crédito com marca (fora do padrão até o Pedro decidir).
- `exporta` também manda `regras.marcasCredito` e `regras.concorrentes` (as listas únicas do kit) pro `montaProps`.

Importável (`sys.path.insert(0, ".../_kit-motion/catalogos")`): `carrega(tipo)`, `indice(tipo)`, `acha(id)`, `marca()`, `creditos(ids)`, `creditos_trechos(ids)`, `confere_referencia(peca)`, `decisao(item)`, `decisao_vale(d, peca)`, `resumo_decisao(d)`, `confere_trilha(item, peca)`, `origem_tela(arquivo, conjunto)`, `marca_em(texto)`, `MARCAS_CREDITO`, `CONCORRENTES_NOMES`, `bbox_glb.caixa(caminho, escala)`.

Teste das travas (decisão de risco, trilha, crédito com marca, F063, fatos e telas): `python -B KIT/scripts/testa_regras.py`.

## Origem dos dados

Os quatro `base.json` e o `marca.json` foram gerados em 02/10/2026 a partir do Anexo A do `DESENHO.md` (revisão 2), da medição bruta dos efeitos de 02/10, dos dois `_manifesto.json` das telas, do `REF` e dos FONTES de `_assets-externos/`. md5, tamanho, duração (ffprobe), caixa dos GLB e o pixel de fundo das telas foram lidos do disco nesse dia.
