# SPEC Métricas: Diagnóstico, Público e Semanal (30/09/2026)

Contrato das três abas novas de Métricas e do que elas mexem no resto do app. Complementa o `SPEC.md`
(o contrato geral) e o `README.md` (o manual). Quando o código e este arquivo discordarem, vale o código
mais novo, e este arquivo é corrigido.

## 0. Por que existe e o que decide

O Pedro pediu (30/09/2026):

1. **Diagnóstico**: métricas completas e a análise dos **mecanismos e fundamentos/pilares** que explicam
   por que um vídeo, post ou carrossel foi bem ou mal, virando insight aplicado nas próximas peças, com
   meta de **pelo menos 2× o desempenho**.
2. **Público**: quem assiste, padrões e comportamento ("80% dessas views são de mulheres abaixo de 35 e o
   restante são homens com X, Y e Z").

Decisões dele (30/09):

- **A métrica que define "foi bem" depende do tipo da peça** (seção 3.4).
- **A meta de 2× compara com a mediana das últimas 5 peças do mesmo tipo**, não com o último post literal.
- **Pago**: eles promovem pelo Gerenciador de Anúncios usando o post já publicado (não pelo botão
  Impulsionar). O anúncio aponta pra mídia orgânica: dá pra ligar o anúncio ao post e ler idade e gênero
  POR POST do lado pago.
- **Onde aparece**: aba nova em Métricas; card dentro da peça no cronograma; contexto da IA de criação
  (Criar reel, Gerar ideias, Outra ideia); resumo semanal DENTRO de Métricas, numa aba só dele.

O que a pesquisa da API (v26.0, docs da Meta de jun/2026, conferidas por verificador) fixou e o desenho
respeita:

- Insight por mídia é só acumulado (lifetime), com atraso de até 48h, sem série por idade. **Comparar
  peças na mesma idade exige guardar leituras nossas** (historico-midias.json) e **sincronizar sozinho**.
- Por mídia orgânica **não existe** idade, gênero, cidade, seguidor × não seguidor nem origem da view.
  "80% das views deste reel são mulheres abaixo de 35" só sai de: (a) anúncio ligado ao post (Marketing
  API, `breakdowns=age,gender`); (b) a tela do app do Instagram, digitada ou lida de um print; (c) no
  nível da CONTA, por janela (seguidores; engajados com 100+ interações na janela).
- Reels: `reels_skip_rate` (0 a 100, % das views que pularam nos 3 primeiros segundos) é o gancho;
  `ig_reels_avg_watch_time` vem em ms; não há duração do vídeo na API (sai do ffprobe). Reels não têm
  `follows`, `profile_visits` nem clique no link por API (o app mostra "Seguidores" por reel: entra à mão).
- Feed e carrossel têm `follows`, `profile_visits` e `profile_activity` com `breakdown=action_type`
  (BIO_LINK_CLICKED = clique no link da bio a partir do post). Slide de carrossel não tem insight.
- Stories só têm insight enquanto estão no ar (24h): só capturando de hora em hora.
- Demografia da conta: `follower_demographics` (100+ seguidores; hoje são 109) e
  `engaged_audience_demographics` (100+ interações na janela), `timeframe` só `this_week` ou
  `this_month`, `breakdown` no singular, top 45, sem histórico na API (a gente guarda). `age,gender` numa
  chamada só funciona nos conectores de produção, mas não é documentado: tenta e cai pra separado.
- `reached_audience_demographics`, `online_followers` e `follower_count` saíram da tabela da doc sem aviso
  de fim: o app testa e marca "a Meta não devolve isso pra esta conta" quando vier erro ou vazio.
- Métricas orgânicas por mídia (`views`, `likes`, `comments`, `total_interactions`) não contam anúncio;
  `total_views` (Facebook Login) soma pago e Facebook. Post com anúncio fica fora da base de comparação.
- Termos da Meta e LGPD: só agregado. Nada de perfil por pessoa, nada de inferir idade ou gênero de quem
  comentou. Célula com menos de 5 pessoas não vira frase.

## 1. Regras que valem pra todo código novo

- Português do Brasil na tela e nos comentários (comentário curto que explica o porquê, como no resto do
  app). Todo módulo novo abre com um comentário de cabeçalho dizendo o que faz e as decisões.
- **Zero travessão e zero meia-risca em QUALQUER lugar**: fonte, string, comentário, CSS, teste. Faixa
  numérica é "25 a 34" no texto e "25-34" em chave. Quando precisar do caractere pra limpar texto, use
  `TRACOS` de `db.mjs` (montado por código). Nada de barrinha decorativa antes de texto no CSS.
- Número ausente é "sem dado" (nunca "-", nunca vazio, nunca 0 inventado). Vazio da API é "sem dado",
  não zero.
- Números em pt-BR (`toLocaleString('pt-BR')`), razão como "1,4×", percentual como "45,5%".
- Insight nunca afirma causa: "tende a", "nas N peças", "sinal"; sempre com N e o rótulo de evidência.
- Erro de servidor: `throw falha(status, 'mensagem em português')`.
- Arquivo novo em `data/`: `lerJson`/`gravarJson` com fila de escrita (molde `monitoramento.mjs`), nunca no
  `db.json` (exceto o que já é do reel).
- Token nunca vai pro front nem pro log. Texto gerado por IA passa por `contemSegredo` antes de gravar.
- Datas de negócio (dia, semana, hora de postagem) no fuso `America/Sao_Paulo`. Semana = ISO, segunda a
  domingo, rótulo `AAAA-Www`.
- Front: sem build, módulos ES, `esc()` em todo texto interpolado, estado em variável do módulo, padrão
  `montar(el, opções)` + `invalidar()` + redesenho com `data-foco` (molde `views/ranking.js`).
- Gráfico: só SVG/CSS feito à mão (a CSP não deixa biblioteca), com os helpers de
  `public/js/metricas-comum.js`. Todo gráfico tem tabela equivalente ("Ver em tabela") e dica no
  hover/foco.

## 2. Arquivos de dados novos (em `DATA_DIR`)

Todos com `versao: 1`. Ficam no `.gitignore` só os caches, que a API ou um botão refazem: `anuncios.json`,
`agenda.json` e `relatorios/`. Entram no git, como o `db.json`: `historico-midias.json`, `stories-metricas.json`
e `publico.json`, que são registro nosso e a API não refaz (as leituras por idade são nossas, o insight do story
some em 24h, a demografia não tem histórico na API e o `porPostApp` foi digitado ou lido do print pelo time), e
`mecanismos.json` e `hipoteses.json`, que são trabalho do time. A cópia de arquivo com o JSON quebrado
(`<nome>.quebrado-<quando>.json`, do `lerJsonEstrito`) também fica no `.gitignore`: a do `instagram.json` leva o token.

### 2.1 `historico-midias.json` (server/historico.mjs)

```
{ versao: 1,
  midias: { [midiaId]: {
    publicadoEm: ISO, tipo: 'REELS'|'FEED'|'CAROUSEL_ALBUM',
    leituras: [ { em: ISO, idadeH: number,
      views, reach, saved, shares, likes, comments, interacoes, avgWatchMs, skipRate,
      totalViews, viewTotalMs, reposts, profileVisits, follows, bioLinkClicks } ] } } }
```

Uma leitura por sincronização em que a mídia ganhou insight novo. Poda: tudo até 72h; depois no máximo 1
por 12h até 14 dias; 1 por dia até 60 dias; 1 por semana depois; teto de 200 por mídia.

### 2.2 `mecanismos.json` (server/mecanismos.mjs)

```
{ versao: 1,
  midias: { [midiaId]: {
    reelId: string|null, vinculoPor: 'manual'|'permalink'|null, vinculoEm: ISO|null, vinculoAutor: string|null,
    tags: { [dimensao]: { valor, fonte: 'manual'|'ia', em: ISO, autor?: string,
                          evidencias?: [ { tipo: 'quadro'|'fala'|'legenda'|'imagem', tempo: string, texto: string } ] } },
    ia: { em: ISO, status: 'ok'|'erro'|'sem-login', mensagem?: string, custo?: number, duracaoS?: number,
          descartadas?: number } | null,
    manual: { follows?: number, profileVisits?: number, bioLinkClicks?: number, cadastros?: number,
              em: ISO, autor: string } | null,
    impulsionado: true|false|null } } }
```

As tags vindas do cronograma e as calculadas NÃO são gravadas aqui: são derivadas na hora (seção 3.3).

### 2.3 `publico.json` (server/publico.mjs)

```
{ versao: 1,
  suporte: { [chave]: { ok: boolean, em: ISO, erro?: string } },
  demografia: [ { id, em: ISO, semana: 'AAAA-Www',
                  metrica: 'seguidores'|'engajados'|'alcancados',
                  janela: 'this_week'|'this_month'|null,
                  dimensao: 'idade_genero'|'idade'|'genero'|'cidade'|'pais',
                  itens: [ { idade?: '25-34', genero?: 'F'|'M'|'U', cidade?: 'Belo Horizonte, Minas Gerais', pais?: 'BR', valor: number } ],
                  total: number } ],
  diario: { [AAAA-MM-DD]: { em: ISO,
      seguidoresTotal?: number,
      alcance?: { total, seguidores, naoSeguidores, desconhecido },
      alcancePorTipo?: { REEL, POST, CAROUSEL_CONTAINER, STORY, AD },
      views?: { total, seguidores, naoSeguidores, desconhecido },
      viewsPorTipo?: { REEL, POST, CAROUSEL_CONTAINER, STORY, AD },
      contasEngajadas?, interacoes?, curtidas?, comentarios?, salvamentos?, compartilhamentos?,
      seguiram?, deixaram?, toquesContato? } },
  online: { em: ISO, horasBrasilia: [24 números] } | null,
  porPostApp: { [midiaId]: { em, autor, base: 'visualizacoes'|'contas-alcancadas'|'contas-engajadas',
      contas?: number,   // as contas que a tela mostra, quando aparece (manda na base em pessoas, seção 3.6)
      genero: { mulheres?: pct, homens?: pct },
      idade: { '13-17'?: pct, '18-24'?: pct, '25-34'?: pct, '35-44'?: pct, '45-54'?: pct, '55-64'?: pct, '65+'?: pct },
      cidades: [ { nome, pct } ], paises: [ { nome, pct } ],
      seguidores?: pct, naoSeguidores?: pct } } }
```

Chaves de `suporte`: `demo:<metrica>:<janela>:<breakdown>`, `diario:<grupo>` (grupos da seção 3.6),
`online_followers`. Recusa fica 7 dias sem tentar de novo (a não ser no "Atualizar agora").

### 2.4 `anuncios.json` (server/anuncios.mjs)

```
{ versao: 1, conta: { id: 'act_123', nome, moeda } | null, contasDisponiveis: [ { id, nome, moeda } ],
  lidoEm: ISO|null, erro: string|null,
  anuncios: [ { adId, nome, status, campanha: { id, nome, objetivo }, conjunto: { id, nome }, midiaId, permalink, criadoEm } ],
  porPost: { [midiaId]: { em: ISO, anuncios: [adId], gasto, alcance, impressoes, plays3s, thruplays,
      tempoMedioS, p25, p50, p75, p100, visitasPerfil, seguiram,
      idadeGenero: [ { idade: '25-34', genero: 'female'|'male'|'unknown', alcance, impressoes } ],
      regioes: [ { regiao, alcance, impressoes } ] } } }
```

O token de usuário (o do usuário do sistema) mora em `data/instagram.json` como `tokenUsuario`, nunca aqui.

### 2.5 `stories-metricas.json` (server/stories-metricas.mjs)

```
{ versao: 1, stories: { [midiaId]: { publicadoEm: ISO, dia: 'AAAA-MM-DD', tipo: 'IMAGE'|'VIDEO', permalink, thumb,
    ultima: Leitura|null, leituras: [Leitura] } } }
Leitura = { em, idadeH, views, reach, replies, shares, follows, profileVisits, interacoes, linkClicks,
            navegacao: { avancou, voltou, saiu, proximo } }   // número, null (sem dado) ou 'menos-de-5'
```

### 2.6 `hipoteses.json` (server/hipoteses.mjs)

```
{ versao: 1, hipoteses: [ { id: 'hip_xxxxxxxx', criadaEm, autor, reelId, insightId, dimensao, valor,
    acao: 'usar'|'evitar', texto, previsao: { etapa: 'objetivo'|'gancho'|'retencao'|'distribuicao'|'qualidade'|'conversao' },
    midiaId: string|null, status: 'aberta'|'confirmada'|'refutada'|'inconclusiva'|'nao-aplicada',
    veredito: { em, score, scoreEtapa, texto } | null } ] }
```

### 2.7 `relatorios/<AAAA-Www>.json` (server/relatorio.mjs) e `agenda.json` (server/agenda.mjs)

Formas nas seções 3.8 e 3.9.

## 3. Servidor

### 3.1 `server/estatistica.mjs` (puro, já escrito)

Mediana, MAD, z modificado, log2 da razão com suavização, meta 2×, taxa com shrinkage beta-binomial,
limite inferior de Wilson, efeito de tag com encolhimento e rótulo de evidência, interpolação por idade,
datas em Brasília (dia, hora, dia da semana, semana ISO) e formatadores pt-BR. Ler o arquivo: a assinatura
de cada função está no comentário dela. Os testes ficam em `server/testes/estatistica.test.mjs`.

Regras numéricas que o resto usa:

- `score = log2Razao(valor, base)`: `log2(valor/base)` quando a base é 10 ou mais; `log2((valor+1)/(base+1))`
  quando é menor (evita meta zero e razão infinita). +1 = 2×.
- `meta2x(base)`: `2 × base` (base ≥ 10) ou `2 × base + 1` (base < 10). A meta mostrada e cobrada é
  `Math.ceil(meta2x(base))` (ação é número inteiro) e bateu a meta = `valor ≥ meta` (revisão de 30/09).
- Fator de quem não bateu: truncado em uma casa e no máximo 1,9× (1,96× sai "1,9×"); o valor arredonda pra
  baixo. Uma peça que não bateu nunca aparece como "2×" nem com o valor igual à meta.
- Nível de uma etapa: `acima` com score ≥ log2(1,5); `abaixo` com score ≤ log2(1/1,5); `normal` no meio.
- Evidência: `forte` (n ≥ 5, |efeito| ≥ 0,5, consistência ≥ 0,8); `moderada` (n ≥ 3, |efeito| ≥ 0,3,
  consistência ≥ 0,67); `fraca` (n ≥ 2, |efeito| ≥ 0,2); senão `insuficiente`. O n é o do lado MENOR (com
  ou sem): 5 peças contra 1 é `insuficiente`, e o texto diz os dois lados ("5 reels contra 3").

### 3.2 `server/historico.mjs`

```
export async function registrar(itens, em = agora())   // itens: proprios com insight lido AGORA
export async function leiturasDe(midiaId)               // [] quando não tem
export async function todas()                           // o objeto midias inteiro (cópia rasa)
export function valorNaIdade(midia, campo, horas)       // midia = entrada de midias; usa interpolarIdade
```

### 3.3 `server/mecanismos.mjs`

Codebook (exportado e servido em `GET /api/metricas/codebook`). Cada dimensão:
`{ id, nome, grupo: 'fundamento'|'mecanismo'|'contexto', etapa, aplica: 'peca'|'planejamento'|'nunca',
pecas: ['reel','carrossel','estatico'], fontes: [...], valores: [ { id, nome } ], tipo: 'enum'|'bool' }`.

| id | nome | etapa | aplica | pecas | fontes (ordem de prioridade) | valores |
|---|---|---|---|---|---|---|
| pilar | Pilar | objetivo | planejamento | todas | manual, cronograma | os de `db.pilares` (id numérico como texto) |
| bloco | Bloco | objetivo | planejamento | todas | manual, cronograma | Educação, Afeto, Diferencial, Conversão |
| tipo | Tipo (objetivo da peça) | objetivo | planejamento | todas | manual, cronograma | viralizacao, vendas, conexao, ensino, conselho |
| formato | Formato da biblioteca | objetivo | planejamento | reel | manual, cronograma, ia | ids de `db.formatos` (nome: "código · nome") |
| ganchoFamilia | Gancho: família | gancho | peca | reel, carrossel | manual, ia | gancho-direto, storytelling, curiosidades, polemicas, motivacao, educativo-rapido, provas, perguntas, identificacao, listas, fator-r, fora-do-banco |
| ganchoForma | Gancho: forma | gancho | peca | reel, carrossel, estatico | manual, ia | pergunta, afirmacao, numero, cena, sem-fala |
| rostoInicio | Rosto nos 3 primeiros segundos | gancho | peca | reel | manual, ia | bool |
| textoInicio | Texto na tela no começo | gancho | peca | reel | manual, ia | bool |
| telaApp | Tela do app aparece | qualidade | peca | todas | manual, ia | bool |
| gatilho | Gatilho emocional | qualidade | peca | todas | manual, ia | os 24 da seção 3.3.1 |
| cta | CTA | conversao | peca | todas | manual, ia, cronograma | seguir, salvar, mandar, comentar, lista-de-espera, fora-do-escopo, curtir, sem-cta |
| voz | Quem fala | qualidade | peca | reel | manual, ia | leo, pedro, mauro, institucional, sem-voz, outro |
| humor | Humor | qualidade | peca | todas | manual, ia | bool |
| audio | Áudio | retencao | peca | reel | manual, ia, calculado | fala, musica, fala-e-musica, som-sem-fala, sem-audio |
| preco | Preço na peça | conversao | peca | todas | manual, ia | bool |
| duracaoFaixa | Duração | retencao | peca | reel | calculado | ate-15, 16-30, 31-45, 46-60, mais-60 |
| slidesFaixa | Slides do carrossel | retencao | peca | carrossel | calculado | 2-3, 4-6, 7-10 |
| legendaFaixa | Tamanho da legenda | qualidade | peca | todas | calculado | curta (até 300 caracteres), media (301 a 1.000), longa (mais de 1.000) |
| horario | Horário de postagem | distribuicao | peca | todas | calculado | madrugada (0h a 6h), manha (6h a 12h), tarde (12h a 18h), noite (18h a 24h) |
| diaSemana | Dia da semana | distribuicao | peca | todas | calculado | dom, seg, ter, qua, qui, sex, sab |
| impulsionado | Teve anúncio | contexto | nunca | todas | manual, calculado | bool |
| linha | Linha editorial | contexto | nunca | todas | calculado | v1 (publicado a partir de 30/09/2026), anterior |

Precedência ao juntar: manual > cronograma > ia > calculado. Cronograma = a peça vinculada (`reelId`):
`pilar`, `bloco` (ou o do pilar), `tipo`, `formatoId` (vira `formato`), CTA do texto (`ctaDaPeca` do
servidor, classificada por palavra: "lista de espera" ou "link da bio" → lista-de-espera; "salva" →
salvar; "manda", "compartilha", "marca" → mandar; "comenta", "conta pra gente" → comentar; "segue" →
seguir). Calculado: `duracaoFaixa` (de `ia.duracaoS`), `slidesFaixa` (de `nSlides`), `legendaFaixa`,
`horario`, `diaSemana`, `audio` (de `media_audio_type`: MUSIC → musica; ORIGINAL_SOUND com fala na
transcrição → fala; sem fala → som-sem-fala; vídeo sem trilha de áudio → sem-audio; a IA refina pra
fala-e-musica), `impulsionado`, `linha`.

#### 3.3.1 Gatilhos emocionais (de `data/estilos.json`)

Viralização: surpresa-fato (Surpresa com fato), indignacao-sistema (Indignação com o sistema),
humor-burocracia (Humor sobre a burocracia), opiniao-forte (Opinião forte), curiosidade-lacuna
(Curiosidade com lacuna), utilidade-salvar (Utilidade de salvar), protecao (Proteção de quem você
gosta), reconhecimento-imediato (Reconhecimento imediato). Vendas: dor-custo (Dor com custo concreto),
prova-visivel (Prova visível na tela do app), facilidade (Facilidade), transparencia-preco
(Transparência de preço), confianca-local (Confiança local), honestidade (Honestidade que desarma),
escassez-real (Escassez real), baixo-atrito (Baixo atrito). Conexão: reconhecimento-cena (Reconhecimento
de cena), validacao (Validação sem pena), orgulho-cnpj (Orgulho do CNPJ), medo-nomeado (Medo nomeado com
cuidado), solidao (Solidão de quem trabalha sozinho), bastidor-fundador (Bastidor vulnerável do
fundador), especificidade-profissao (Especificidade de profissão), pertencimento (Pertencimento).

#### 3.3.2 Funções

```
export const DIMENSOES, VALORES_GATILHO, VALORES_GANCHO, CTA_POR_TIPO
export function codebook(db)                                   // DIMENSOES com valores dinâmicos (pilares, formatos)
export async function ler()                                    // o arquivo (cache em memória)
export function tagsEfetivas(db, midia, registro, extras)      // { [dim]: { valor, fonte, evidencias? } }
   // midia = item de proprios/postsProprios; registro = mecanismos.midias[id] ou null;
   // extras = { analise?: data/analises/<id>.json, anunciado?: boolean }
export function reelDaMidia(db, midia, registro)               // a peça vinculada: registro.reelId, senão permalink igual
export function sugerirVinculos(db, midias, registros)         // [ { midiaId, reelId, score, motivo } ] um por mídia sem vínculo
export async function vincular(midiaId, reelId|null, autor)    // grava; peça sem permalink ganha o da mídia (db.json)
export async function definirTag(midiaId, dimensao, valor|null, autor)   // valida no codebook; null apaga a manual
export async function definirNumeros(midiaId, { follows, profileVisits, bioLinkClicks, cadastros }, autor)
export async function definirImpulsionado(midiaId, true|false|null, autor)
export async function iniciarIa(midiaId, autor)                // job (um por vez com analise.mjs); 202
export async function iniciarIaLote(midiaIds|null, autor)      // fila: todas sem ia ok (máx 30); 202
export function estadoIa()                                     // { atual: { midiaId, etapa, inicio }, fila: n, feitos: n, erros: [..] } | null
```

CTA por tipo (da `ctas.md`): viralizacao [salvar, mandar, comentar]; conexao [comentar, mandar,
seguir]; ensino [salvar, mandar, seguir]; conselho [salvar, mandar]; vendas [lista-de-espera]. Em
qualquer tipo, fora-do-escopo.

#### 3.3.3 Etiquetar com IA (sem olhar número)

- Reel: reaproveita de `analise.mjs` o download do vídeo, os quadros (mais densos em 0 a 3s) e a
  transcrição; imagem e carrossel: baixa até 10 imagens (`children{media_type,media_url}`; só https em
  host da Meta). Nada de número de desempenho no prompt: a extração não pode racionalizar resultado.
- Agent SDK com a conta logada, `tools: ['Read']` só nos arquivos da pasta temporária (hook igual ao de
  `analise.mjs`), `outputFormat` json_schema com `enum` do codebook, `persistSession: false`, modelo
  `process.env.METRICAS_MODEL || process.env.CRONOGRAMA_MODEL || undefined`, 4 min de limite.
- Cada tag vem com evidência (`quadro` com tempo da lista, `fala` literal da transcrição, `legenda`
  literal, `imagem` com o número da imagem). O servidor confere igual a `analise.mjs` (`conferir`); tag
  sem evidência conferida sai e conta em `descartadas`.
- Uma rodada por vez no servidor inteiro (fila pesada compartilhada com a análise do reel):
  `server/fila-pesada.mjs` com `reservar(nome, dono) → boolean`, `liberar(nome)`, `ocupada() → nome|null`.

### 3.4 `server/diagnostico.mjs` (o motor)

Tudo o que é cálculo fica em funções puras exportadas (testáveis sem disco); as de rota só carregam os
arquivos e chamam.

#### Objetivo por tipo (decisão do Pedro)

| tipo | id | rótulo | valor |
|---|---|---|---|
| viralizacao | alcance | Alcance | reach |
| ensino | salvamentos | Salvamentos | saved |
| conselho | salvar-mandar | Salvamentos e compartilhamentos | saved + shares |
| conexao | conversa | Comentários e compartilhamentos | comments + shares |
| vendas | interesse | Seguidores, visitas ao perfil e cliques no link | follows + profileVisits + bioLinkClicks |
| sem tipo | alcance | Alcance (peça sem tipo) | reach |

Fonte do valor: `api` (feed traz follows, profileVisits e bioLinkClicks), `manual` (números do app em
`mecanismos.manual`, o caminho dos reels de Vendas) ou nulo ("sem dado: informe os números do app").
Cadastros (manual) aparecem ao lado, fora da soma.

Valor comparável: leitura interpolada aos 7 dias (168h) quando o histórico tem e a leitura que fecha a conta
já tem 7 dias ou mais (a leitura atual conta como ponto da interpolação); senão, com 7 dias ou mais de vida,
o valor atual (`idadeRef: 'atual'`); senão o atual com `provisorio: true` e, quando 3 ou mais peças da base
têm leitura na mesma idade, o `ritmo` (score contra a mediana delas na mesma idade). `idadeValorH` diz a
idade da leitura por trás do valor. Número do app informado antes dos 7 dias deixa a peça provisória ("Números
do app informados com N dias de post: informe de novo pra fechar a meta").

Base do 2×: mediana do valor comparável das **5 peças anteriores do mesmo tipo e do mesmo formato de mídia**
(reel com reel, feed e carrossel juntos; publicadas antes, sem anúncio, com valor), `baseDe: 'tipo'`. Com menos
de 3: o mesmo tipo em qualquer formato, `baseDe: 'tipo-misto'`, com aviso (nunca pra peça sem tipo). Com menos
de 3: as 5 anteriores do mesmo formato de mídia, `baseDe: 'formato'`, com aviso. Com menos de 3 no total:
`base: null` ("ainda sem base"). O formato entrou na regra em 30/09, depois do teste com os dados reais: reel e
carrossel não se comparam em alcance nem em salvamento.

#### Linha por post

```
PostRow = {
  midiaId, permalink, thumb, legenda1 (primeira linha, até 140), timestamp, dia, hora, idadeH,
  tipoMidia: 'REELS'|'FEED'|'CAROUSEL_ALBUM', peca: 'reel'|'carrossel'|'estatico',
  reelId, reelTitulo, tipo, pilar, pilarNome, bloco,
  metricas: { views, reach, saved, shares, likes, comments, interacoes, avgWatchMs, skipRate,
    retido3s, duracaoS, pctAssistido, replays, follows, profileVisits, bioLinkClicks, cadastros, totalViews,
    seguidoresNoDia, alcancePorSeguidor },
  objetivo: { id, rotulo, valor, fonte, idadeRef, idadeValorH, provisorio, base, baseN, baseDe,
    meta (inteira), razao, score, bateuMeta, ritmo },
  funil: [ { etapa, rotulo, valor, valorTexto, base, baseTexto, score, nivel, detalhe } ],
  gargalo: etapa|null, forte: etapa|null,
  porque: { bem: [texto], mal: [texto] },
  tags: { [dim]: { valor, fonte } }, tagsFaltando: [dim],
  impulsionado: true|false|null, talvezImpulsionado: boolean, outlier: boolean,
  iaStatus: 'ok'|'erro'|'sem-login'|null, avisos: [texto] }
```

Etapas do funil (base = mediana das 10 peças anteriores do mesmo formato de mídia, sem anúncio):

| etapa | rótulo | reel | feed e carrossel |
|---|---|---|---|
| gancho | Gancho (0 a 3s) | retido3s = 100 − skipRate | não se aplica |
| retencao | Retenção | pctAssistido = avgWatch ÷ duração (sem duração: segundos assistidos, com aviso) | não se aplica |
| distribuicao | Distribuição | alcance ÷ seguidores no dia | alcance ÷ seguidores no dia |
| qualidade | Ação por pessoa alcançada | média dos scores de compartilhamentos, curtidas e salvamentos por alcance (taxas com shrinkage beta-binomial, prior da própria conta) | idem |
| conversao | Interesse no perfil | follows por alcance, só com número do app | (follows + visitas + cliques) por alcance |

`gargalo` = etapa com menor score quando ele está `abaixo`; `forte` = maior quando `acima`. Peça provisória:
a distribuição compara com as peças anteriores na mesma idade (`mesmaIdade`); com menos de 3 leituras nessa
idade fica sem base, sem score e sem nível (não vira gargalo, ponto forte nem motivo).

Anúncio (`impulsionado`): true quando o post está no `porPost` ou na lista de anúncios; false só com a leitura
de anúncios sem erro, de menos de 24h, feita depois da publicação e com o token de anúncios presente; senão
null ("pode ter tido anúncio"), e post com null nunca entra na base.

Frases do `porque` (determinísticas, com os números; exemplos do tom):

- gancho acima: "O gancho segurou mais gente: 54% passaram dos 3 primeiros segundos, contra 40% na mediana dos últimos reels."
- gancho abaixo: "O gancho perdeu gente cedo: só 27% passaram dos 3 primeiros segundos (a mediana é 40%)."
- retenção: "Quem ficou assistiu em média 18% do vídeo (7,1s de 38s), abaixo da mediana (26%)."
- distribuição: "Chegou longe: alcance de 1.005 contas, 9,2× o número de seguidores (a mediana é 3×)."
- qualidade: "Gerou mais ação por pessoa: 5 compartilhamentos e 1 salvamento a cada mil alcançados..."
- objetivo: "Na métrica do tipo Ensino (salvamentos), fez 3, contra 1 na mediana das últimas 5 peças de Ensino. Meta de 2×: 3. Bateu."

#### Efeitos, insights e recomendações

```
export function calcularEfeitos(posts, codebook)  // por dimensão e valor
  → [ { dimensao, valor, nomeValor, n, nSem, mediaCom, mediaSem, efeito (encolhido, k=3), consistencia,
        etapa, efeitoEtapa, mediaEtapaCom, mediaEtapaSem, evidencia, midias: [ids],
        semComparacao, semComparacaoEtapa } ]
     // semComparacao: todas as peças têm o valor (nSem 0): sem efeito, evidência insuficiente; n, mediaCom e
     // fatorCom ficam ("Todas as N peças têm esse valor: sem comparação.")
export function gerarInsights(efeitos, posts, codebook)
  → [ { id: 'ins_<dim>_<valor>', acao: 'usar'|'evitar'|'testar'|'planejar', dimensao, valor, nomeValor,
        titulo, texto, evidencia, n, nSem, prep, fatorCom, fatorSem, aplica, pecas, tipos, midias } ]
     // prep: o valor já com "com"/"sem" ("sem rosto", "com CTA de salvar") pra frase não dobrar a preposição
export function recomendacoesPara(reel, contexto)   // { meta, itens (até 3, com prep), testar, aplicados }
export function blocoParaIa({ tipo, pecas, pilar }, contexto)   // texto pro prompt (ou '')
export function avaliarHipotese(h, contexto)        // veredito
export async function carregarContexto()            // { db, historico, mecanismos, publico, anuncios, hipoteses, analises, posts, efeitos, insights, codebook }
export async function resumo()                      // a aba inteira
export async function detalhePost(midiaId)          // a linha + tags com detalhe + efeitos das tags + público do post
```

- Efeito usa o score do objetivo de cada post (sem anúncio, com base) e, quando a dimensão tem etapa, o
  score daquela etapa. Encolhimento: `efeito = n/(n+3) × (média com − média sem)`. `planejar` =
  dimensões de planejamento (pilar, bloco, tipo, formato): viram insight da aba e do semanal, nunca
  recomendação de peça (o pilar da peça é do calendário e não muda).
- Texto do insight: "Peças com gancho de pergunta ficaram em 1,6× a base, contra 0,8× das outras (4
  peças, evidência moderada)." Com etapa: "Com rosto nos 3 primeiros segundos, 52% passaram do gancho,
  contra 38% sem rosto (5 reels)."
- Recomendação de peça: insights `usar`/`evitar` com evidência fraca ou melhor, da mesma peça (reel,
  carrossel, estático), respeitando: CTA só da escada do tipo; preço só em Vendas; gatilho só pro próprio
  tipo (preço e escassez só em Vendas; peça sem tipo não recebe gatilho); humor (inclusive o gatilho de humor
  com a burocracia) com o aviso "humor só se o tema não for multa, dívida, prazo vencido, golpe ou teto"; nada
  de standby (6, 7, 14, 15). Até 3, forte antes de fraca. Sem nenhuma: um `testar` (a família de gancho menos
  usada entre as permitidas pro tipo) e a meta.
- Hipótese: "Aplicar" cria `{ reelId, insightId, acao, previsao.etapa }`. Veredito quando a mídia
  vinculada tem 7 dias: `nao-aplicada` se a tag efetiva não bate com a ação; `confirmada` com score ≥
  log2(1,5) (na etapa, se houver; senão no objetivo); `refutada` com score ≤ log2(1/1,5); senão
  `inconclusiva` (fator perto do normal arredonda pra 1×). Sem o número, sem base ou com número provisório,
  fica aberta até 30 dias (`PRAZO_HIPOTESE_H`) e então fecha `inconclusiva` dizendo o que faltou. Texto sempre
  diz que 1 peça é sinal, não prova. Peça apagada do cronograma leva as hipóteses dela e solta os posts
  ligados (`diagnostico.pecaApagada` → `hipoteses.daPecaApagada` e `mecanismos.soltarPeca`).

`resumo()`:

```
{ atualizadoEm, conectado, sincronizadoEm, agenda: estadoAgenda(),
  metas: [ { tipo, rotuloTipo, formato: 'reel'|'feed', rotuloFormato, objetivo: { id, rotulo }, base, baseN,
             baseDe, meta,   // a meta da PRÓXIMA peça desse tipo e formato (a mesma do recomendacoesPara)
             ultima: { midiaId, valor, score, bateuMeta, base, meta, provisorio, impulsionado } | null } ],
             // um cartão por tipo e formato; a última peça leva a base e a meta dela (as da época)
  numeros: { posts, comBase, bateramMeta30d, taxaAcerto30d, medianaScore30d, provisorias30d, fraseProvisorias,
             semTipo, semTags, semVinculo },   // provisória e com anúncio ficam fora da taxa e da mediana
  pendencias: [ { id: 'vincular'|'etiquetar'|'numeros-app'|'conectar'|'anuncios', texto, n, acao, midiaIds? } ],
             // numeros-app: reels de Vendas com 7 dias ou mais sem número do app, ou com número de antes dos 7
  sugestoesVinculo: [ { midiaId, reelId, reelTitulo, dia, score, motivo } ],
  posts: [PostRow] (mais novo primeiro),
  efeitos, insights, hipoteses: [ ... com reelTitulo ], stories: resumoStories(14),
  ia: estadoIa() }   // estadoIa().cancelados: posts que saíram da fila sem rodar por falta do login do Claude
```

`detalhePost(midiaId).publico.app` (a mesma forma da linha da tela do app na aba Público):
`{ fonte: 'app', base, baseTexto, contas, n, nDe: 'informado'|'interacoes'|'alcance'|null, em, autor, frases,
semFrase, visiveis: { genero, idade, cidades, paises, seguidores }, dados }`. Só `frases` e `visiveis` vão pra
tela; os números digitados ficam em `dados`, só pro formulário. Leitura de arquivo que falha com status (503 do
`lerJsonEstrito`) sobe e não vai pro cache: a aba diz qual arquivo consertar e nenhum veredito é gravado com
dado pela metade.

### 3.5 Contexto das IAs de criação

`diagnostico.blocoParaIa({ tipo, pecas, pilar })` devolve até ~1.200 caracteres, ou string vazia quando
não há nada com evidência fraca ou melhor e nem base de meta:

```
## O que os números da nossa conta mostram (Métricas, DD/MM)
Use como orientação de MECANISMO (gancho, duração, CTA, formato), nunca como fato de copy: nenhum
número daqui entra na peça. O pilar, a base contábil e as regras duras mandam sobre isto.
- Meta desta peça (Ensino): salvamentos, 2× a mediana das últimas 5 de Ensino (mediana 1, meta 3).
- Fazer mais: gancho de pergunta (4 peças, evidência moderada).
- Evitar: ...
- Em teste nesta peça: ...
```

Entra em `agente.mjs` (montarContexto, logo depois de "Contexto escolhido no app"), `ideias-ia.mjs`
(antes de "CADA IDEIA") e `outras-ideias.mjs` (antes de "DADOS DO LUGAR"). Falha ao montar o bloco não
derruba a geração (vira string vazia e loga).

### 3.6 `server/publico.mjs`

```
export async function atualizar({ forcar = false, dias = null } = {})   // leitura da conta
export async function resumo()                                        // a aba Público
export async function definirPostApp(midiaId, dados, autor)          // números da tela do app
export async function apagarPostApp(midiaId)
export async function iniciarLeituraPrint(midiaId, imagens, autor)   // job; imagens = data URLs (png/jpg/webp, até 3, 4 MB cada)
export function estadoLeituraPrint(midiaId)                          // { etapa, erro, sugestao }
export function frasesDemografia(itens, opcoes)                      // puro (testes)
export function aderenciaPersonas(idadeGenero)                       // puro
export function parseBreakdown(resposta)                             // puro: resposta da Graph → [ { chaves..., valor } ]
```

Leitura (`atualizar`), cada chamada isolada (erro numa não derruba as outras; `ehTokenRuim` para tudo):

1. `GET {ig}?fields=followers_count,follows_count,media_count` → `diario[hoje].seguidoresTotal`.
2. Por dia (Brasília, `since`/`until` em epoch do começo e fim do dia), últimos 3 dias (primeira vez:
   28), grupos:
   - `alcance-seguidor`: `metric=reach&period=day&metric_type=total_value&breakdown=follow_type`
   - `tipo`: `metric=reach,views,likes,comments,saves,shares,total_interactions&breakdown=media_product_type`
   - `views-seguidor`: `metric=views&breakdown=follow_type` (recusou: tenta `follower_type`)
   - `conta`: `metric=accounts_engaged,total_interactions,profile_links_taps` sem breakdown
   - `seguiram`: `metric=follows_and_unfollows&breakdown=follow_type` (FOLLOWER = seguiram, NON_FOLLOWER = deixaram)
3. Demografia (1 vez por semana, ou `forcar`): `follower_demographics` (`timeframe=this_month`; recusou:
   sem timeframe), `engaged_audience_demographics` (this_month e this_week), `reached_audience_demographics`
   (this_month, sondagem), cada uma com `breakdown=age,gender` (recusou ou veio só uma chave: `age` e
   `gender` separados), `city`, `country`. Sempre `period=lifetime&metric_type=total_value`.
4. `online_followers` (`period=lifetime`, 1 vez por semana): horas do Pacífico convertidas pra Brasília
   pela diferença de fuso da data.

`resumo()`:

```
{ atualizadoEm, seguidores: { total, em, variacao7d },
  quem: [ { id: 'seguidores'|'engajados-30'|'engajados-7'|'alcancados-30', titulo, fonte, em, base,
            disponivel, motivo, frases: [texto], genero: [ { id, rotulo, valor, pct } ],
            idade: [ { faixa, valor, pct } ], idadeGenero: [ { faixa, mulheres, homens, outros } ] | null,
            cidades: [ { nome, valor, pct } ], paises: [ { nome, valor, pct } ], ocultos: n } ],
  descoberta: { semanas: [ { semana, rotulo, alcance, seguidores, naoSeguidores, pctNao } ], porTipo: {...}, frase },
  crescimento: { dias: [ { dia, seguiram, deixaram, total } ], frase },
  horarios: { online: [24] | null, nossos: [ { faixa, rotulo, n, medianaScore } ], frase },
  personas: [ { id, nome, recorte, pctSeguidores, pctEngajados, frase } ],
  porPost: [ { midiaId, dia, titulo, thumb, fonte: 'anuncio'|'app', base, baseTexto, frases, visiveis,
               // linha da tela do app: contas, n (null sem a base em pessoas), nDe, semFrase, autor, em
               genero, idade } ],   // genero e idade = visiveis (nunca os números digitados crus)
  anuncios: status de anuncios.mjs, suporte, avisos }
```

Frases (o exemplo do Pedro), só com célula de 5 pessoas ou mais, sempre dizendo a fonte e a base:

- "Dos 109 seguidores com dado (30 dias): 64% são mulheres e 35% homens."
- "72% têm menos de 35 anos. O maior grupo é de mulheres de 25 a 34 anos (31%)."
- Com o cruzamento idade e gênero: "Mulheres abaixo de 35 anos são cerca de 50% do total. O restante são
  principalmente homens de 25 a 44 anos (22%) e mulheres de 35 a 44 (12%)."
- Cidade: "45% estão em Belo Horizonte; depois Contagem (8%) e São Paulo (6%)."
- Sem cruzamento, as frases de gênero e de idade saem separadas, sem juntar os dois.
- Soma que mistura grupo escondido (menos de 5 pessoas) com grupo visível sai "cerca de X%", em múltiplos de 5
  (abaixo de 35, recorte, personas, gênero tirado do cruzamento, somas do pago); em lista vai sem contagem e
  com `aproximado: true`.
- "principalmente" só quando os grupos citados cobrem 60% do restante; senão "No restante, os maiores grupos
  são...". Idade e gênero de um cartão vêm de UMA leitura (mesmo `em`); cidade ou país de leitura mais velha
  diz a data ("Pela leitura de 22/09, ...").

Base em pessoas do público do post pela tela do app (`pessoasNaBase`, regra C3): as contas que a tela mostra
(`contas`), quando informadas; senão o alcance do post (base visualizações ou contas alcançadas); na base de
contas com engajamento, o maior entre curtidas e salvamentos (cada um é uma conta diferente; comentário e
compartilhamento repetem conta, e as nossas respostas contam como comentário). Visualização nunca é pessoa.
Sem número: nenhum grupo vira frase (falha fechada) e a linha diz "falta saber quantas contas a tela mede".

Personas (recorte de idade e gênero de cada dorsal; aviso fixo: "idade e gênero não dizem profissão nem
se é MEI ou ME"): A Direto (serviço intelectual) 25 a 44, todos; B Construindo (beleza e estética)
mulheres 35 a 54; C Mão na mão (ofícios tradicionais) homens 45+; D MEI de vida toda 25 a 54, todos;
E Começa Certo (jovem com CNPJ) 18 a 34, todos. Fonte: `identidade/brandmkt/02-personas/`.

Leitura de print (tela de público do post no app do Instagram): as imagens vão pra pasta temporária, o
Agent SDK lê só elas e devolve números com `enum` de faixa; o servidor confere soma (90 a 102%) e
devolve como SUGESTÃO pro formulário. Nada é gravado sem o "Salvar" da pessoa. Imagem e pasta são
apagadas no fim.

### 3.7 `server/anuncios.mjs` e `server/stories-metricas.mjs`

```
// anuncios.mjs
export async function status()        // { temToken, conta, contasDisponiveis, lidoEm, erro, nAnuncios, nPosts, passos }
export async function conectar({ token })   // valida (me, me/adaccounts) e grava tokenUsuario em instagram.json
export async function escolherConta(contaId)
export async function atualizar()     // lista anúncios, liga ao post, lê insights por idade e gênero e por região
export async function porPost()       // anuncios.porPost (cópia)
export function frasesPago(p)         // puro: "No alcance pago (1.234 contas, R$ 150,00): 72% mulheres..."
// stories-metricas.mjs
export async function capturar()      // /stories + insights de cada um (erro #10 = 'menos-de-5')
export async function resumoStories(dias = 14)   // { dias: [ { dia, n, views, alcanceMax, saidas, respostas, cliques, objetivo, pilar } ], total }
```

Anúncios: `GET me/adaccounts?fields=id,name,currency,account_status`; anúncios da conta escolhida:
`GET act_<id>/ads?fields=id,name,status,effective_status,created_time,campaign{id,name,objective},adset{id,name},creative{id,effective_instagram_media_id,source_instagram_media_id,instagram_permalink_url}&limit=100`
(cursor, até 20 páginas). Liga pelo `effective_instagram_media_id`/`source_instagram_media_id` igual a um
`midiaId` nosso, ou permalink igual (`mesmoPost`). Insights por anúncio ligado, `date_preset=maximum`:
totais (`spend,reach,impressions,actions,video_thruplay_watched_actions,video_avg_time_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions`),
`breakdowns=age,gender` (`reach,impressions`) e `breakdowns=region` (`reach,impressions`). Números vêm como
texto: `Number()`. Alcance somado entre anúncios leva o aviso "alcance somado dos anúncios".
Sem token de usuário ou sem conta de anúncios atribuída: `status().passos` explica, na tela, o caminho
(Gerenciador de Negócios → Usuários do sistema → Atribuir ativos → Contas de anúncios → Ver desempenho;
gerar token de novo com `ads_read`).

### 3.8 `server/relatorio.mjs` (resumo semanal)

```
export async function gerar(semana, { autor = 'agenda' } = {})   // grava relatorios/<semana>.json e devolve
export async function ler(semana)                                // null quando não tem
export async function listar()                                   // [ semanas com arquivo ], mais nova primeiro
export async function iniciarLeituraIa(semana, autor)            // job; 202
export function estadoLeituraIa(semana)
export function semanaAnterior(dia = hoje)                       // 'AAAA-Www'
```

```
export async function situacao(semana)                           // pronto, parcial ou pede regerar (agenda)
Relatorio = { versao: 1, semana, inicio, fim, geradoEm, geradoPor,
  lidoEm,   // a última leitura dos nossos posts que o resumo usou (antes do fim da semana: a frase avisa)
  resumo: { publicadas: { reel, carrossel, estatico, total }, metasBatidas: { n, de }, medianaScore,
            taxaAcerto, anterior: { metasBatidas, medianaScore } | null, provisorias, comAnuncio, semAvaliacao,
            frases: [texto] },
            // metasBatidas, medianaScore, taxaAcerto e anterior contam só peça fechada: 7 dias ou mais e sem
            // anúncio. provisorias, comAnuncio e semAvaliacao (fechada sem base ou sem número) são ditas à parte
  pecas: [ { midiaId, titulo, dia, tipo, peca, pilarNome, objetivo, bateuMeta, impulsionado, porque, gargalo, forte, thumb, permalink } ],
  destaques: { melhor: midiaId|null, pior: midiaId|null },
  mecanismos: { insights: [ { id, acao, titulo, texto, evidencia } ], hipoteses: { confirmadas: [..], refutadas: [..], inconclusivas: [..], abertas: n } },
  publico: { seguidores: { inicio, fim, variacao }, pctNaoSeguidores, frases: [texto] },
  stories: { dias, views, saidas, respostas, cliques, frase } | null,
  proximaSemana: [ { reelId, dia, titulo, tipo, peca, pilarNome, meta: { rotulo, base, meta } | null, recomendacoes: [texto] } ],
  fatos: [ { id: 'F1', texto } ],
  leituraIa: { em, autor, status, frases: [ { texto, fatos: ['F1'] } ], descartadas } | null }
```

A leitura com IA (botão) só recebe `fatos` e só pode citar ids que existem; frase sem fato citado, ou
com número que não aparece nos fatos citados, sai. Nada de número novo. Data (dd/mm, AAAA-MM-DD, AAAA-Www),
hora ("14h") e título entre aspas de um fato não liberam número: a frase só pode repeti-los exatamente como
estão no fato. Número por extenso conta como número ("trezentas e vinte" é 320) e palavra vaga (dezenas,
centenas, milhares) derruba a frase. Destaques (melhor e pior) só saem de peça fechada com base.

### 3.9 `server/agenda.mjs`

Laço no próprio processo (setTimeout encadeado com `.unref()`), primeiro giro 2 min depois do boot,
depois a cada 30 min. Cada tarefa isolada (erro vai pra `agenda.json` e pro console, nunca derruba):

| tarefa | quando | o que |
|---|---|---|
| sincronizar | 3h desde a última leitura dos nossos posts (`propriosEm`, senão `sincronizadoEm`) e conectado | `instagram.sincronizar({ escopo: 'proprios', origem: 'agenda' })`; pula se uma leitura manual está rodando |
| stories | 1h | `stories.capturar()` |
| publico | 20h, ou virou o dia; leitura que falhou (cortada, `limitado` ou nada lido) volta em 1h | `publico.atualizar()` |
| anuncios | 12h, conta escolhida e token de anúncios válido (`tokenUsuarioDisponivel()`) | `anuncios.atualizar()` |
| relatorio | segunda depois das 7h (Brasília), com uma leitura dos nossos posts feita depois do fim da semana; sem ela, terça às 7h com a frase da data da leitura. Regera quando chega leitura nova, quando o arquivo foi salvo com a semana ainda correndo e quando a semana retrasada foi salva com peça provisória (a leitura da IA fica se os fatos não mudaram) | `relatorio.gerar(semanaAnterior())` |
| hipoteses | depois de cada sincronização | `diagnostico.avaliarHipoteses()` |

```
export function iniciar()               // chamado no listen do server.mjs
export async function estado()          // { ligada, ultimas: { [tarefa]: { em, ok, erro } }, proximas: { [tarefa]: ISO }, erros: [..10] }
export async function rodarAgora(tarefa)   // POST manual (sem esperar o intervalo)
```

`agenda.json`: `{ versao: 1, ultimas: { [tarefa]: { em, ok, erro? } }, erros: [ { em, tarefa, msg } ] }`.
Com `CRONOGRAMA_AGENDA=0` no ambiente, não liga (testes).

### 3.10 Mudanças em módulos que já existem

- `instagram.mjs`: REELS pede também `ig_reels_video_view_total_time`, `reposts` e `total_views`; FEED e
  CAROUSEL_ALBUM pedem `reposts` e `total_views` (a recusa de métrica que já existe tira o que a Meta não
  aceitar). Feed e carrossel ganham uma chamada `profile_activity` com `breakdown=action_type` (tenta sem e
  com `metric_type=total_value`; recusou, anota em `metricasApi` e segue). Campos extras da mídia
  `media_audio_type,is_shared_to_feed,children{id}` com volta pra lista antiga se a Meta recusar.
  `itemProprio` ganha `totalViews, viewTotalMs, reposts, bioLinkClicks, audioTipo, noFeed, nSlides,
  mediaType`. Depois de ler, `historico.registrar(itens com insight novo)`. Trava de servidor contra duas
  sincronizações ao mesmo tempo (a segunda manual recebe 409 "Já tem uma leitura do Instagram rodando").
  `dados()` devolve também `postsProprios`, `diario`, `medianaPropria`. `reel.metricas` passa a levar
  também `avgWatchMs, skipRate, interacoes, profileVisits, follows, bioLinkClicks, tipo` e vale também
  pra peça vinculada em `mecanismos.json`. Conectar por token guarda também `tokenUsuario` quando o
  token colado é de usuário (difere do token da Página); `segredosAtuais()` inclui ele. Exporta
  `chamar(caminho, params, { usuario = false })`, `conectado()`, `ehLimite`, `ehTokenRuim`, `emLotes`,
  `msDe`, `gravarTokenUsuario(token)`, `tokenUsuarioDisponivel()`.
- `analise.mjs`: exporta `acharFfmpeg, videoDe, baixar, extrairEvidencia, hooksQuadros, loginClaude,
  ehErroLogin, conferir, rotuloTempo, lerTempo, normal, limpar`; `iniciar` respeita `fila-pesada.mjs`.
  O nível `baixo` dos fatos passa a ter estilo na tela.
- `validar.mjs`: `metricas` e `insightsAplicados` entram em `DO_SERVIDOR_REEL` (o corpo não mexe).
- `server.mjs`: `if (recurso === 'metricas') return metricasRotas.rota(req, res, partes.slice(1), { json, corpoJson, autor: autor(req) })`
  e `agenda.iniciar()` no `listen`. Decisões novas no cabeçalho com data.
- `package.json`: módulos novos no `check`; script `testar` (`node --test server/testes/`).
- `.gitignore`: os caches da seção 2.

### 3.11 Ligações entre os módulos (quem chama o quê)

Pra não ter import circular: `diagnostico.mjs` NÃO importa `agenda.mjs`, `relatorio.mjs` nem
`metricas-rotas.mjs`; `mecanismos.mjs` NÃO importa `diagnostico.mjs`. Quem junta é a rota.

- Leitura dos arquivos (cada módulo dono exporta `ler()`, que devolve o objeto do arquivo com cache em
  memória e a forma garantida): `historico.todas()`, `mecanismos.ler()`, `publico.ler()`, `anuncios.ler()`,
  `hipoteses.ler()`, `stories.ler()`.
- `hipoteses.mjs`: `ler()`, `criar(dados, autor)`, `apagar(id)`, `atualizar(id, patch)`, `daPeca(reelId)`.
- `diagnostico.mjs` guarda o contexto calculado por 30 s; `invalidar()` zera. A rota chama `invalidar()`
  depois de toda escrita (vínculo, tag, números, impulsionado, hipótese, público do post, anúncios) e o
  `server.mjs` depois de "Sincronizar agora"; a agenda depois de cada tarefa.
- `diagnostico.blocoInsightsIa({ tipo, pecas, pilar })`: async, carrega o contexto sozinho (usa o cache) e
  devolve `blocoParaIa(...)`; erro vira `''`.
- `diagnostico.avaliarHipoteses()`: async, avalia as abertas e grava os vereditos; a agenda chama.
- `GET /api/metricas/diagnostico` = `{ ...await diagnostico.resumo(), agenda: await agenda.estado(), stories: await stories.resumoStories({ dias: 14 }) }`.
- `stories.resumoStories({ dias = 14, inicio = null, fim = null } = {})`: `inicio`/`fim` em AAAA-MM-DD
  (o semanal usa a semana).
- `instagram.sincronizar({ escopo, origem })`: com `origem: 'agenda'` e outra leitura rodando, devolve
  `null` (pula) em vez de 409. `instagram.emAndamento()` diz se há leitura rodando.

`detalhePost(midiaId)`:

```
{ post: PostRow,
  midia: { midiaId, permalink, thumb, video, caption, timestamp, tipo, audioTipo, nSlides },
  tags: [ { dimensao, nome, grupo, etapa, valor, nomeValor, fonte, evidencias, opcoes: [ { id, nome } ], editavel } ],
  efeitosDasTags: [ Efeito ],
  vinculo: { reelId, reelTitulo, dia, por, sugestao: { reelId, reelTitulo, score, motivo } | null,
             opcoes: [ { id, titulo, dia, peca } ] },      // peças de 7 dias antes a 7 depois
  manual: { follows, profileVisits, bioLinkClicks, cadastros, em, autor } | null,
  publico: { pago: { ...porPost, frases } | null, app: { ...porPostApp, frases } | null },
  hipoteses: [ Hipotese ],
  ia: { status, em, mensagem, descartadas } | null, iaRodando: boolean,
  analiseVideo: { existe: boolean, podeAnalisar: boolean } }
```

`recomendacoesPara(reel, contexto)`:

```
{ reelId, tipo, peca,
  meta: { objetivo: { id, rotulo }, base, baseN, baseDe, meta, texto } | null,
  itens: [ { insightId, acao, dimensao, valor, nomeValor, titulo, texto, evidencia, n, aviso, aplicado: hipId|null } ],
  testar: { insightId, dimensao, valor, nomeValor, texto, aplicado: hipId|null } | null,
  aplicados: [ Hipotese ],
  resultado: PostRow | null,          // a peça já tem mídia vinculada
  semDados: texto | null }
```

`POST /hipoteses { reelId, insightId }` refaz `recomendacoesPara` da peça e só aceita um `insightId` que
esteja em `itens` ou em `testar` (senão 400); a hipótese nasce com os dados do item.

## 4. Rotas (`server/metricas-rotas.mjs`, prefixo `/api/metricas`)

| Método | Caminho | Corpo | Resposta |
|---|---|---|---|
| GET | `/diagnostico` | | `resumo()` da 3.4 |
| GET | `/post/:midiaId` | | `detalhePost()` |
| PUT | `/post/:midiaId/vinculo` | `{ reelId }` (null solta) | `detalhePost()` |
| PUT | `/post/:midiaId/tag` | `{ dimensao, valor }` (null apaga a manual) | `detalhePost()` |
| PUT | `/post/:midiaId/numeros` | `{ follows, profileVisits, bioLinkClicks, cadastros }` | `detalhePost()` |
| PUT | `/post/:midiaId/impulsionado` | `{ valor: true|false|null }` | `detalhePost()` |
| POST | `/post/:midiaId/etiquetar` | | 202 `{ ia: estadoIa() }` |
| POST | `/etiquetar-lote` | `{ midiaIds? }` | 202 `{ ia }` |
| GET | `/etiquetar` | | `{ ia }` |
| GET | `/codebook` | | `codebook(db)` |
| GET | `/recomendacoes/:reelId` | | `recomendacoesPara()` + `{ resultado: PostRow|null }` |
| POST | `/hipoteses` | `{ reelId, insightId }` | 201 hipótese |
| DELETE | `/hipoteses/:id` | | `{ ok: true }` |
| GET | `/publico` | | `resumo()` da 3.6 |
| POST | `/publico/atualizar` | | `resumo()` |
| PUT | `/publico/post/:midiaId` | dados do app (2.3) | `resumo()` |
| DELETE | `/publico/post/:midiaId` | | `resumo()` |
| POST | `/publico/post/:midiaId/print` | `{ imagens: [dataURL] }` (até 12 MB) | 202 `{ leitura }` |
| GET | `/publico/post/:midiaId/print` | | `{ leitura }` |
| GET | `/anuncios` | | `status()` |
| POST | `/anuncios/token` | `{ token }` | `status()` |
| PUT | `/anuncios/conta` | `{ contaId }` | `status()` |
| POST | `/anuncios/atualizar` | | `status()` |
| GET | `/stories` | `?dias=14` | `resumoStories()` |
| GET | `/semanal` | `?semana=AAAA-Www` (sem: a mais nova) | `{ semanas: [..], relatorio: Relatorio|null, atual: 'AAAA-Www', leitura }` |
| POST | `/semanal/gerar` | `{ semana }` | `{ relatorio }` |
| POST | `/semanal/leitura` | `{ semana }` | 202 `{ leitura }` |
| GET | `/semanal/leitura` | `?semana=` | `{ leitura }` |
| GET | `/agenda` | | `estado()` |
| POST | `/agenda/:tarefa` | | `estado()` |

`midiaId` validado com `/^\d{1,40}$/`; `reelId` com `/^reel_[a-z0-9]{4,20}$/i`; `semana` com
`/^\d{4}-W\d{2}$/`. Método errado: 405; caminho que não existe: 404.

## 5. Front

### 5.1 Comum (já escrito)

- `public/js/metricas-comum.js`: formatadores ("sem dado", "1,4×", "45,5%", "7,1s"), pílulas (evidência,
  nível, fonte), gráficos (barras horizontais, barra divergente, pirâmide idade × gênero, colunas, colunas
  divergentes, barras 100% empilhadas, linha, medidor de meta), tabela equivalente e dicas de hover/foco.
- `public/css/views/metricas-comum.css`: cores de dado validadas (azul e laranja pra séries; azul e
  vermelho pra acima e abaixo da base, cinza no meio), grade e eixos em hairline, pílulas e dica.

### 5.2 Abas de Métricas (`views/instagram.js`)

`SUBABAS = [['', 'Visão geral'], ['diagnostico', 'Diagnóstico'], ['publico', 'Público'], ['semanal', 'Semanal'], ['ranking', 'Ranking'], ['organico', 'Orgânico'], ['pago', 'Pago'], ['consolidado', 'Consolidado']]`.
Cada aba nova é um `<div id="ig-diagnostico|ig-publico|ig-semanal">` montado por
`views/diagnostico.js`, `views/publico.js` e `views/semanal.js` (`montar(el, { aoAnalisar })`,
`invalidar()`). Elas buscam os próprios dados em `/api/metricas/*`. Sincronizar agora invalida as três.
`?post=<midiaId>` no endereço da aba Diagnóstico abre o painel daquele post.

### 5.3 Diagnóstico (`views/diagnostico.js` + `css/views/diagnostico.css`, prefixo `dg-`)

1. **Metas 2× por tipo**: um cartão por tipo E formato (reels; posts e carrosséis). O medidor da última peça
   usa a base e a meta da época dela (`ultima.base`/`ultima.meta`) com o selo "bateu" ou "ficou em 0,6×"
   (provisória: "por enquanto em..."; com anúncio: selo "teve anúncio"); a base e a meta de agora ficam numa
   linha à parte, "Meta da próxima peça". Números da conta: peças com base, taxa de acerto 30 dias, mediana
   (provisória e com anúncio fora, ditas em `fraseProvisorias`). Aviso recolhível da agenda com as tarefas
   que falharam (nome, quando, erro, "Tentar agora") e os erros dos últimos 7 dias.
2. **Pendências**: vincular post a peça (sugestão com 1 clique), etiquetar com IA (lote, com andamento),
   números do app nos reels de Vendas, conectar anúncios. Cada uma com o botão que resolve.
3. **O que os números mostram**: insights em cartões (Fazer mais, Evitar, Testar, No planejamento), cada
   um com evidência, N, fator com × fator sem e as miniaturas das peças.
4. **Pilares e mecanismos**: seletor de dimensão (abre na de evidência mais forte); por valor, barra
   divergente do efeito, N, consistência, evidência; e a etapa quando houver. Valor que todas as peças têm
   (`semComparacao`): "Todas as N peças têm esse valor: sem comparação.", sem barra e sem selo de evidência.
5. **Peças**: lista (mais nova primeiro; ordenar por score) com miniatura, data, tipo, pilar, medidor
   valor × base × meta, score, gargalo e ponto forte. Clicar abre o painel.
6. **Hipóteses em teste** e **Stories dos últimos 14 dias** (tabela simples).

Painel do post (`abrirPost(midiaId)`, também exportado): cabeçalho (miniatura, data, tipo, pilar, link),
vínculo com a peça (seletor + sugestão), meta do tipo com o medidor e o veredito, "Por que foi bem" e
"Por que foi mal", funil (uma barra divergente por etapa com valor × base), mecanismos (cada dimensão com
o valor, a fonte e um seletor pra corrigir; evidência da IA no "i"), "Etiquetar com IA", números do app
(reels), público do post (pago e do app, com as frases e os botões "Informar do app" e "Ler do print"),
"Teve anúncio" (sim, não, automático) e "Análise do vídeo" (abre o painel "Por que esse reel funcionou").

### 5.4 Público (`views/publico.js` + `css/views/publico.css`, prefixo `pb-`)

Cabeçalho com as frases (o exemplo do Pedro), a fonte e a data; troca Seguidores | Engajados 30 dias |
Engajados 7 dias | Alcançados 30 dias (indisponível mostra o porquê); pirâmide idade × gênero; gênero;
cidades; países; descoberta (barras 100% seguidores × não seguidores por semana); crescimento (colunas
divergentes seguiram × deixaram); horários (colunas das 24h com destaque nas 3 maiores, ou nossos
horários por score); personas × público real; por post (pago e do app, com o formulário e a leitura de
print); anúncios (conectar, escolher conta, atualizar); "Atualizar agora" e o que a Meta não devolve.

### 5.5 Semanal (`views/semanal.js` + `css/views/semanal.css`, prefixo `sm-`)

Seletor de semana (anterior, próxima, lista), "Gerar agora", "Escrever leitura com IA", "Copiar resumo"
(texto puro pro WhatsApp). Seções na ordem do `Relatorio`: resumo, peças (com o porquê), destaques,
mecanismos e hipóteses, público, stories, próxima semana (metas e recomendações por peça), leitura da IA
(cada frase com os fatos citados).

### 5.6 Peça no cronograma (`detalhe-metricas.js` + `css/detalhe-metricas.css`, prefixo `dm-`)

Módulo próprio, ligado ao `detalhe.js` por duas chamadas (a integração é feita junto com a subida do
servidor, porque o `detalhe.js` já está no ar):

```
export function blocoMetricasHtml(r)              // a <section class="bloco" id="dm-bloco"> com o esqueleto; '' em modo edição
export function ligarBlocoMetricas(painel, r)     // busca as recomendações e desenha dentro de #dm-bloco; ignora resposta velha
```

Bloco novo "Métricas desta peça", logo depois do bloco Ideia (fora do modo edição), carregado depois de
abrir o painel (`GET /api/metricas/recomendacoes/:reelId`):

- Peça ainda não publicada: "Meta" (rótulo, base, meta) e "Aplicar nesta peça" (até 3 itens, cada um
  com "Aplicar" que cria a hipótese e vira "Aplicado ✓" com "Desfazer"), mais o "Testar" quando houver.
- Peça publicada e vinculada: "Resultado × meta" (medidor, veredito, gargalo e ponto forte em frase,
  hipóteses desta peça com o veredito) e "Ver diagnóstico completo"
  (`#/instagram/metricas/diagnostico?post=<midiaId>`).
- Sem Instagram conectado ou sem base: a frase curta do porquê, sem erro.

## 6. Testes e verificação

- `npm run check` (sintaxe de todos os módulos) e `npm run testar` (node:test): estatística, motor do
  diagnóstico com banco falso (objetivo por tipo, base, funil, frases sem travessão), parser de breakdown,
  frases de demografia com célula pequena, personas, veredito de hipótese.
- Servidor de teste numa cópia: `CRONOGRAMA_DATA=<cópia> PORT=4399 CRONOGRAMA_AGENDA=0 node server/server.mjs`,
  login por `npm run usuario convite` na mesma cópia, e as rotas com `curl`.
- Nada de print de token. Nada de apagar o `data/` de verdade.
