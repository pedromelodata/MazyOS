# SPEC v2 · Cronograma de Reels (Legalizaí)

Contrato único da reconstrução de 22/09/2026. Todo agente constrói CONTRA este arquivo. Se algo
aqui estiver ambíguo, escolha o mais simples que respeite o contrato e documente no topo do seu
arquivo. Não invente rotas, nomes de export ou classes CSS fora do que está aqui sem necessidade.

Raiz do app: `C:\MKT-INSTA\Content Legalizai\cronograma\` (chamada de `APP`). Raiz do workspace:
`C:\MKT-INSTA\Content Legalizai\` (chamada de `RAIZ`). Node 26, ES modules, zero build, zero
framework no front. Dependências já instaladas: `@anthropic-ai/claude-agent-sdk`, `zod`.

---

## 1. O que o usuário pediu (checklist de aceite)

1. **Menu lateral** no lugar das abas, no estilo da referência mag.ai (seções GERAL / BIBLIOTECAS /
   INSTAGRAM / CAMPANHA, botão "+ Novo reel" no topo, barra "Reels do mês X/12" no rodapé)
2. **Home** parecida com a referência: saudação grande ("Bora criar, **Pedro.**" com o nome em
   coral), card de plano ("próximo passo"), 3 cards grandes: Criar do zero (coral), Banco de ideias
   (N ideias), Biblioteca de Reels (N validados, card escuro com mini gráfico de barras)
3. **Campanha: só "Pré-lançamento"** (lista de espera, 20/08/2026 a 31/12/2026)
4. **Efeito laranja no hover de TODOS os botões** (e itens clicáveis), bonito e leve (ver §6)
5. **Banco de Ideias** só com ideias de **Fator R** e **Facilidade de usar o app**, usando os
   formatos validados da Giu adaptados ao nicho
6. **Biblioteca de Reels**: os 28 formatos validados pela curadoria da Giu (mag.ai), adaptados ao
   Legalizaí, + os 6 formatos nossos em teste. Todo **case de sucesso** (reel que performou,
   nosso ou do nicho) vai pra lá, pendurado num formato
7. **Meus conteúdos**: grade de cards dos reels criados ("Adaptado de 4.1"), com card "+ Novo reel a
   partir da biblioteca"
8. **Cronograma** (calendário/lista do mês) continua existindo, com o detalhe completo do reel
   (hook, roteiro, desenvolvimento, CTA, legenda, checagem de regras) e o chat "Criar reel" com a
   skill reels-curtos
9. **Instagram** conectado: **Métricas** (nossa conta) e **Inspirações** (contas de referência do
   nicho + hashtags) com ações "Mandar pra biblioteca" (vira case) e "Virar ideia"
10. Tudo organizado: código em módulos, tema escuro por padrão com botão pro claro, responsivo

---

## 2. Arquivos e dono de cada um

Cada agente só escreve nos arquivos que são dele. Pode LER qualquer coisa.

| Dono | Arquivos |
|---|---|
| **backend** | `server/db.mjs`, `server/server.mjs`, `server/agente.mjs`, `server/instagram.mjs`, `server/migrar.mjs` (novo), `server/ideias-ia.mjs` (novo), `server/importar.mjs`, `data/seed.json`, `.env.exemplo`, `.gitignore`, `package.json` |
| **shell** | `public/index.html`, `public/css/base.css`, `public/js/core.js`, `public/js/main.js`, `public/js/capa.js`, `public/js/views/home.js`, `public/css/views/home.css`. Apaga `public/app.js` e `public/app.css` (versão antiga) |
| **views-a** | `public/js/views/cronograma.js`, `public/js/views/conteudos.js`, `public/js/detalhe.js`, `public/js/chat.js`, `public/css/views/cronograma.css`, `public/css/views/conteudos.css`, `public/css/detalhe-chat.css` |
| **views-b** | `public/js/views/ideias.js`, `public/js/views/biblioteca.js`, `public/css/views/ideias.css`, `public/css/views/biblioteca.css` |
| **views-c** | `public/js/views/instagram.js`, `public/js/views/campanha.js`, `public/css/views/instagram.css`, `public/css/views/campanha.css` |
| **conteudo-biblioteca** | `data/biblioteca.json` |
| **conteudo-ideias** | `data/ideias.json` |

Referência de código que JÁ funciona (versão 1, ler antes de reescrever): `public/app.js`,
`public/app.css`, `server/*.mjs`. O chat SSE, o QA de regras duras, o calendário, o detalhe e o
parser de `reel.md` foram testados de ponta a ponta. Porte, não reinvente.

`index.html` carrega TODOS os CSS listados acima (arquivo ausente = 404 inofensivo) e um único
`<script type="module" src="/js/main.js">`.

---

## 3. Modelo de dados (`data/db.json`, `schemaVersion: 2`)

```jsonc
{
  "schemaVersion": 2,
  "config": {
    "nomeUsuario": "Pedro",
    "metaMensal": 12,                 // reels/mês (cadência de referência 3/semana)
    "handleInstagram": "",
    "contasReferencia": [],           // @ sem arroba
    "hashtags": []                    // sem #
  },
  "pilares": [ { "id": 1, "nome": "...", "bloco": "..." } ],   // igual v1
  "campanhas": [ {
    "id": "cmp_prelancamento", "nome": "Pré-lançamento",
    "objetivo": "Engordar a lista de espera. Oferta real até 31/12/2026: MEI R$19 e ME R$79 nos 3 primeiros meses (depois R$49 e R$139).",
    "inicio": "2026-08-20", "fim": "2026-12-31", "metaReels": 0, "origem": "_memoria/estrategia.md"
  } ],
  "formatos": [ /* entradas da Biblioteca, §3.1 */ ],
  "cases":    [ /* §3.2 */ ],
  "ideias":   [ /* §3.3 */ ],
  "reels":    [ /* §3.4 */ ],
  "instagram": {                      // cache do que a API devolveu (§8)
    "conta": null, "proprios": [], "inspiracoes": [], "sincronizadoEm": null, "erros": []
  }
}
```

### 3.1 Formato (entrada da Biblioteca de Reels)

```jsonc
{
  "id": "fmt_4_1",                    // fmt_<categoria>_<item>; testes: fmt_t_1 ... fmt_t_6
  "codigo": "4.1",                    // mesma numeração da mag.ai ("Adaptado de 4.1"); testes: "T.1"
  "categoria": "Analogia",            // ver tabela §3.5
  "nome": "Objeto-analogia pra tema chato",
  "formula": "[N] cuidados com [tema chato] mostrados num objeto do dia a dia",
  "descricao": "1 a 2 frases: o que é e por que prende",
  "publico": "MEI + ME",              // "MEI" | "ME" | "MEI + ME"
  "duracao": "30-45s",
  "estrutura": ["Etapa 1 (0-3s) ...", "..."],   // 3 a 6 etapas
  "exemplo": {                        // aplicação ao Legalizaí; alimenta a capa tipográfica
    "titulo": "Fator R explicado com uma balança",
    "gancho": "Seu imposto pode ser 6% ou 15,5%. Quem decide é uma conta.",
    "tela": "6% OU 15,5%?",           // texto curto, CAIXA ALTA, até ~24 caracteres
    "destaque": "15,5%"               // 1 palavra/trecho de `tela` que fica em coral
  },
  "referencia": {                     // de onde veio (curadoria) — null nos testes
    "codigo": "4.1", "titulo": "Tema Tabu com Objeto-Analogia",
    "formula": "Lista de cuidados sobre assunto delicado, dita por meio de uma analogia visual",
    "publicoOriginal": "B2C",
    "fonte": "mag.ai · Biblioteca de Reels (curadoria Giullya Becker, Comunicadores Magnéticos)"
  },
  "origem": "curadoria",              // "curadoria" | "teste"
  "fontes": ["LC 123/2006, Anexos III e V"],   // fonte de todo número que aparece no exemplo
  "evidencias": [ { "tipo": "curadoria", "valor": "Formato validado na Biblioteca de Reels da mag.ai", "fonte": "mag.ai · Biblioteca de Reels · item 4.1", "registradaEm": "2026-09-22" } ]
}
```

Os 6 formatos v1 (`fmt_selfie_desabafo`, `fmt_caos_calma`, `fmt_giro_manchetes`, `fmt_traduzindo`,
`fmt_texto_sem_rosto`, `fmt_tela_legenda`) viram `fmt_t_1..fmt_t_6`, `codigo` "T.1".."T.6",
`categoria` "Nossos testes", `origem` "teste", sem evidência. A migração remapeia `formatoId` dos
reels antigos.

### 3.2 Case de sucesso

```jsonc
{
  "id": "case_xxxxxxxx", "formatoId": "fmt_4_1",
  "titulo": "Fator R na balança", "conta": "legalizai.app",
  "origem": "nosso",                  // "nosso" | "nicho" | "manual"
  "permalink": "https://www.instagram.com/reel/...", "thumb": "",   // thumb pode ser vazio
  "views": 12000, "likes": 400, "comments": 30, "saved": 90, "shares": 40,   // null se não houver
  "relativo": 2.4,                    // views ÷ mediana de views da própria conta
  "data": "2026-09-30", "notas": "", "midiaId": "1789...", "reelId": null, "criadoEm": "..."
}
```

### 3.3 Ideia

```jsonc
{
  "id": "ide_xxxxxxxx", "titulo": "...", "descricao": "2 a 3 frases",
  "tema": "fator-r",                  // "fator-r" | "app"
  "formatoId": "fmt_4_1", "publico": "MEI + ME",
  "gancho": "gancho sugerido",
  "fontes": [],                       // obrigatório se a ideia tem número
  "origem": "curadoria",              // "curadoria" (seed) | "ia" | "manual" | "instagram"
  "referencia": null,                 // {permalink, conta} quando vem de Inspirações
  "favorita": false, "reelId": null, "criadaEm": "..."
}
```

### 3.4 Reel (v1 + campos novos)

Igual à v1 (`ideia`, `tema`, `pilar`, `formatoId`, `campanhaId`, `data`, `status`,
`roteiro{hook,textoTela,cenas[{tempo,cena,fala,tela}],desenvolvimento,cta}`, `legenda`,
`permalink`, `metricas`, `origem`) + `ideiaId` (null), `favorito` (false).
Status: `ideia | roteiro | gravado | editado | publicado`.
02/10/2026: campo opcional `videos` (vídeo final da peça, §3.6). O mesmo campo vale nos stories do dia (`db.stories`).

### 3.5 Categorias da Biblioteca (numeração da mag.ai, não mudar)

| # | Categoria | Itens (referência original → código) |
|---|---|---|
| 1 | Dica/DIY | Dica Técnica Explicativa 1.1 · Série Episódica 1.2 · Receita Rápida 1.3 |
| 2 | Análise | Giullya: Virgínia (marketing × oportunismo) 2.1 · O Conteúdo Mais Nojento da Internet 2.2 · O Critério de Autoridade Mudou 2.3 |
| 3 | História | Senna não é vilão 3.1 · A Ferrari que virou sorveteria 3.2 · Criou uma categoria que não existia 3.3 |
| 4 | Analogia | Tema Tabu com Objeto-Analogia 4.1 |
| 5 | Vlog | Pai como Dublê 5.1 · Aliança Divergente 5.2 · Natalha: 10 vídeos em 2 dias 5.3 |
| 6 | Desafio | 2 min × máximo de enquadramentos 6.1 |
| 7 | Palestra | Aula por Casos 7.1 · Simulação ao Vivo 7.2 |
| 8 | Storytelling Looping | Giullya: Recusei Trabalho 8.1 · Finja que seu trabalho é mais difícil 8.2 |
| 9 | Diálogo | 15 mil é classe média? 9.1 · Quando você não paga o banco 9.2 · Quanto custa um cachorro de raça em SP 9.3 |
| 10 | Conselho | Tubarão no Tanque 10.1 · Negócio que depende de você é um emprego 10.2 · Saia da casa dos pais 10.3 · Manual do homem que vence 10.4 |
| 11 | Comparação | Um dia de salário: Brasil × Alemanha 11.1 |
| 12 | Câmera Frontal | Trabalhar mais é papo de perdedor 12.1 · O efeito cobra 12.2 |
| T | Nossos testes | T.1 a T.6 (v1) |

Fórmula e público original de cada item estão no arquivo `REFERENCIA-GIU.md` (mesma pasta).

### 3.6 Vídeo final (02/10/2026)

Os vídeos prontos ficam em `RAIZ/marketing/final/<AAAA-MM-DD> <nome da proposta>/` (só a última versão; as antigas
em `final/_versoes-anteriores/`; guia em `final/LEIA-ME.md`). O app só LÊ essa pasta: nunca move, renomeia nem grava
nada nela. Outra pasta: `CRONOGRAMA_FINAL` no `.env` (ou no ambiente).

```jsonc
// reel.videos e stories.videos (opcional; sem o campo = sem vídeo final)
"videos": [
  { "arquivo": "2026-10-02 3 sinais de que você já pode cobrar mais caro/LEO-precificacao-v2.mp4",
    "rotulo": "Com o Léo",            // "Motion" | "Com o Léo" | "B-roll" | "Completo" | "Corte de 15 s" | ...
    "aviso": "Trocar a trilha antes de postar: ..." }   // opcional, texto curto
]
```

- `arquivo`: caminho relativo à pasta final, com barra normal, do jeito que está no disco (maiúscula e acento iguais).
  Recusado (`server/db.mjs`, `caminhoVideo` e `limparVideos`): vazio, absoluto, drive (`C:`), barra invertida,
  dois-pontos, `.` ou `..`, pedaço que começa com `.` ou `_` (`_versoes-anteriores` fica fora), pedaço terminado em
  ponto ou espaço, mais de 400 caracteres e extensão que não é `.mp4`, `.m4v`, `.mov` ou `.webm`. Travessão no nome
  do arquivo fica como está, inclusive no boot (a migração que tira travessão de todo texto da peça pula
  `videos[].arquivo`, senão o caminho deixaria de bater com o disco); na tela o nome passa pelo `esc()`, que troca
- `rotulo`: obrigatório, até 40 caracteres. `aviso`: até 300. Os dois numa linha só; travessão vira vírgula
- No máximo 12 vídeos por peça; o mesmo arquivo (sem diferença de caixa) não entra duas vezes
- Reel: `conferirReel` valida quando o campo vem (a tela não manda o campo ao editar: ele fica como está). Stories:
  `conferirStoriesDia` só devolve `videos` quando o campo veio; ele não está em `CAMPOS_STORIES`, então o
  aplicar-stories nunca apaga nem compara o vídeo
- Gravação: `server/aplicar-videos-2026-10.mjs` (servidor parado). A pasta final tem tudo; a peça aponta pro que é dela.
  `--sem-aviso-trilha` tira o aviso da trilha do Epidemic dos 5 vídeos depois da troca (sem ela, rodar de novo põe o
  aviso de volta); opção desconhecida é recusada sem gravar nada. Vídeo da mesma pasta da proposta que saiu da pasta
  final (versão trocada) sai da peça; o resto que a peça já tinha fica. Pela API: `PUT /api/reels/:id` ou
  `PUT /api/stories/:id` com `videos` inteiro, sem o `aviso`

---

## 4. Regra de validação (em `server/db.mjs`)

```js
export const LIMIAR_RELATIVO = 1.5, MIN_CASES_ACIMA = 2;
export function statusFormato(f, cases) → { status: 'validado'|'em-teste', via: 'dado'|'curadoria'|'benchmark'|null, acima: n }
```

- `acima` = cases do formato com `origem` em (`nosso`,`nicho`) e `relativo >= 1.5`
- `acima >= 2` → validado via **dado** (vence as outras)
- senão evidência `benchmark` com `valor` e `fonte` → via **benchmark**
- senão evidência `curadoria` com `fonte` → via **curadoria**
- senão **em-teste**

Na UI: selo verde "✓ validado" + legenda do via ("pelo nosso dado" / "pela curadoria da Giu" /
"por benchmark"). Curadoria é validação de OUTRO nicho: o detalhe do formato mostra "Validado pela
curadoria da Giu. Ainda sem dado do nosso nicho" até existir case nosso.

---

## 5. API (servidor em `127.0.0.1`, porta `PORT` ou 4317)

Todas JSON, erros `{ erro: "mensagem em português" }` com status 4xx/5xx.

| Método e rota | Faz |
|---|---|
| `GET /api/estado` | tudo: `config, pilares, campanhas, formatos` (cada um com `status, via, acima, casesCount`), `cases, ideias, reels, regraValidacao{limiarRelativo,minCasesAcima}, instagram{conectado, conta, metodo, oauthDisponivel, versao, sincronizadoEm, erros}` (SEM o cache pesado de mídias, SEM token) |
| `PUT /api/config` | merge parcial em `config` |
| `POST /api/reels` · `PUT/DELETE /api/reels/:id` | CRUD |
| `POST /api/ideias` · `PUT/DELETE /api/ideias/:id` | CRUD |
| `POST /api/ideias/gerar` `{tema, formatoId?, quantidade?=3}` | gera ideias com IA (§7.2), grava com `origem:"ia"`, devolve `{ideias:[...]}` |
| `POST /api/formatos` · `PUT/DELETE /api/formatos/:id` | CRUD (PUT ignora `evidencias`) |
| `POST /api/formatos/:id/evidencias` · `DELETE /api/formatos/:id/evidencias?i=N` | evidência exige `fonte` e (`valor` ou `relativo`) |
| `POST /api/cases` · `PUT/DELETE /api/cases/:id` | CRUD de case |
| `PUT /api/campanhas/:id` | edita a campanha |
| `POST /api/chat` | SSE da skill (§7.1) |
| `GET /api/instagram/dados` | `{conta, proprios, inspiracoes, sincronizadoEm, erros}` |
| `POST /api/instagram/token` `{token}` | conecta colando token (usuário do sistema do Gerenciador de Negócios). Descobre a conta IG sozinho |
| `GET /api/instagram/login` | 302 pro diálogo OAuth do Facebook (se `META_APP_ID`+`META_APP_SECRET`) |
| `GET /api/instagram/callback` | troca `code` por token, descobre a conta, grava, 302 pra `/#/instagram/metricas` |
| `POST /api/instagram/desconectar` | apaga `data/instagram.json` |
| `POST /api/instagram/sincronizar` `{escopo:"proprios"|"inspiracoes"|"tudo"}` | lê a API, atualiza cache e `reels[].metricas` por `permalink` |
| `POST /api/instagram/para-biblioteca` `{midiaId, formatoId}` | cria case a partir de mídia do cache |
| `POST /api/instagram/para-ideia` `{midiaId, tema}` | cria ideia `origem:"instagram"` com `referencia` |
| `GET /api/videos` (02/10) | `{ pastaExiste, propostas: [{ pasta, nome, data, arquivos: [{ nome, arquivo, tamanho, modificadoEm, url, capa, pecas }], pecas }], faltando }`: as pastas de proposta da pasta final (§3.6), sem `_versoes-anteriores`, `src`, pasta escondida, link e arquivo que não é vídeo. `nome` é a pasta sem a data na frente; `data` sai da frente do nome (ou null). `capa`: endereço da capa (`url` + `?capa=<tamanho>-<data>`). `pecas` de cada arquivo: `{ tipo: "reel"\|"stories", id, titulo, data, status, rotulo, aviso, ordem }`; `faltando`: peça que aponta pra arquivo que não está na pasta |
| `GET` e `HEAD /videos/<caminho relativo>` (02/10) | o arquivo da pasta final, só com login (sem sessão: 401; aberto direto no navegador: 302 pra `/entrar`; senha temporária não trocada: 403 com `trocarSenha: true`, como a API). Range (206 e 416), `Content-Type` de vídeo, ETag e `Last-Modified` (304), `Cache-Control: private, max-age=300` (private é obrigatório: a Cloudflare guarda .mp4 por padrão). Player do Chrome, do Edge e do Firefox (`Sec-Fetch-Dest: video` ou `audio` e o navegador no User-Agent) pedindo até o fim do arquivo (`bytes=N-` ou fechado no último byte): 206 com um pedaço só, metade da posição entre 1 MB e 4 MB, e o `Content-Range` do fim real dele; o navegador pede o seguinte sozinho. Safari, iPhone, iPad, Baixar e retomada de download recebem o que pediram. Caminho inválido 400, link pra fora da pasta 403 (confere o caminho real), sem arquivo 404, arquivo preso por quem está gravando 503 |
| `GET` e `HEAD /videos/<caminho relativo>?capa=<versão>` (02/10) | a capa do vídeo: um quadro perto de 1 s em JPEG (até 540 px de largura em pé, 960 deitado), feito pelo ffmpeg na primeira vez e guardado em `data/capas-videos/` (nunca na pasta final; vídeo refeito ganha capa nova e a velha sai). Mesmas regras de login e de caminho do vídeo; `Cache-Control: private, max-age=86400` e ETag. Sem ffmpeg (ou vídeo que ele não abre): 404. Outro ffmpeg: `CRONOGRAMA_FFMPEG` no `.env` |
| `GET /api/versao` | `{ versao }`: o arquivo de `public/` mudado por último e a hora em que o servidor subiu (02/10). A tela aberta recarrega sozinha quando muda, sem painel aberto e sem vídeo tocando |

`GET /api/estado` leva `videosFinais` (02/10): a versão da área de vídeos finais (`server/videos.mjs`, `VERSAO`). A
tela só liga "Vídeos prontos", a seção "Vídeo final" e a marca do calendário com 2 ou mais.

Estáticos: `/` → `public/index.html`; `/tokens.css` → `RAIZ/identidade/tokens.css`;
`/simbolo.svg` → `RAIZ/identidade/logos/simbolo.svg`; `/logo-clara.svg` →
`RAIZ/identidade/logos/legalizai-logo-negativa-clara.svg`; `/logo.svg` →
`RAIZ/identidade/logos/legalizai-logo-horizontal.svg`; resto de `public/` com bloqueio de path
traversal (v1 já faz). Tipos: html, css, js (`text/javascript`), svg, json, png, webp.

---

## 6. Front-end

### 6.1 Módulos e contratos de export

`public/js/core.js` (dono: shell). Todos os views importam daqui:

```js
export const $, $$                               // querySelector(All) → array
export function esc(s)                           // escape HTML
export function negrito(s)                       // esc + **x** → <strong>
export function fmtN(n)                          // 12000 → "12.000"; null → "-"
export function fmtRel(n)                        // 2.4 → "2,4×"; null → "-"
export function fmtData(iso, opts?)              // "2026-09-29" → "29/09" (opts.ano → "29/09/2026")
export function haQuanto(iso)                    // "editado hoje" | "há 3 dias"
export const STATUS, DIAS
export const store = { E: null, ui: { tema, visaoCronograma, mesCronograma(Date) } }
export async function api(metodo, url, corpo)    // lança Error(msg do servidor)
export async function recarregar()               // GET /api/estado → store.E, depois rerender()
export function aoMudar(fn)                      // main.js registra o rerender
export function toast(msg)
export function abrirPainel(html, { largo=false }={})  // painel lateral direito; devolve o elemento
export function fecharPainel()
export const BTN_FECHAR                          // html do botão ✕ com data-fechar
export function navegar(hash)                    // location.hash = hash
export function formato(id), campanha(id), ideia(id), reel(id), casesDo(formatoId)
export function seloFormato(f)                   // html do selo validado/em teste + via
export function qa(reel)                         // porta da v1: [{ok, texto, nivel:'erro'|'alerta'}]
export function lerLocal(k), gravarLocal(k, v)   // try/catch
export function icone(nome, tam=18)              // SVG inline stroke=currentColor. nomes: casa, calendario, lampada, grade, pasta, livro, carrossel, grafico, bussola, alvo, mais, coracao, coracao-cheio, play, lua, sol, cadeado, raio, seta, fechar, busca, instagram, link, copiar, lixo, editar, estrela
```

`public/js/capa.js` (dono: shell): `export function capa({ tela, destaque, categoria, variante, thumb })`
→ html de uma capa 4:5 estilo reel (ver §6.4). `variante` = `"ink" | "papel" | "tint"`; se `thumb`,
usa a imagem com scrim e o texto por cima.

`public/js/main.js` (dono: shell): monta o layout (sidebar + `<main id="vista">`), router por hash,
tema, registra `aoMudar(render da rota atual)`, chama `recarregar()`. Botão "+ Novo reel" chama
`abrirCriar()` de `chat.js`.

Rotas (hash) → módulo → export:

| Hash | Módulo | Chamada |
|---|---|---|
| `#/` ou vazio | `views/home.js` | `render(root)` |
| `#/cronograma` | `views/cronograma.js` | `render(root)` |
| `#/ideias` | `views/ideias.js` | `render(root)` |
| `#/conteudos` | `views/conteudos.js` | `render(root)` |
| `#/biblioteca` | `views/biblioteca.js` | `render(root, {})` |
| `#/biblioteca/<formatoId>` | `views/biblioteca.js` | `render(root, { id })` |
| `#/instagram/metricas` | `views/instagram.js` | `render(root, { aba: 'metricas' })` |
| `#/instagram/inspiracoes` | `views/instagram.js` | `render(root, { aba: 'inspiracoes' })` |
| `#/campanha` | `views/campanha.js` | `render(root)` |
| `#/videos` (02/10) | `views/videos.js` | `render(root)`: "Vídeos prontos", no menu GERAL logo depois de Cronograma |
| `#/reel/<id>` | abre `abrirDetalhe(id)` por cima do cronograma | |
| `#/criar` | abre `abrirCriar()` por cima da home | |

Toda view: `export function render(root, params)` síncrona, escreve `root.innerHTML` e liga os
eventos. Ela é chamada de novo a cada `recarregar()`: não guarde estado no DOM, guarde em variável
de módulo.

`public/js/chat.js` (views-a): `export function abrirCriar({ data, formatoId, ideiaId } = {})` (seletor
de formato: validados primeiro agrupados por categoria, "Nossos testes" recolhido; campanha já vem
Pré-lançamento) e `export function abrirChat({ formatoId, campanhaId, data, reelId, ideiaId, titulo })`
(porta do SSE da v1, manda `ideiaId` junto).

`public/js/detalhe.js` (views-a): `export function abrirDetalhe(reelId, editando=false)` (porta da v1,
mostra "Adaptado de X.Y" e a ideia de origem).

`public/js/videos-finais.js` (02/10): o player do vídeo final, usado no detalhe do reel, no painel dos stories do dia
e na página "Vídeos prontos". No detalhe e nos stories, `<video controls preload="metadata" playsinline>` com `src` em
`/videos/...`. Na página, o player tem capa (`poster`, de `/api/videos`) e `preload="none"`: abrir e rolar só baixa as
capas e cada vídeo só é lido no play; capa e `src` entram quando o player chega perto da tela, e a capa dá o formato
do cartão. Capa que não vem (servidor sem ffmpeg) volta pro `preload="metadata"`. Exports: `videosNoAr()`, `videosDe(item)`, `temVideos(item)`,
`urlVideo(arquivo)`, `tamanhoArquivo(bytes)`, `avisoComum(lista)`, `avisoHtml(texto)`, `marcaVideo()`,
`cartaoVideo(v, opts)`, `gradeVideos(lista)`, `pilulaVideoFinal(item)`, `secaoVideoFinal(item)` e
`ligarPlayers(raiz, { adiar })`. Estilos em `public/css/videos-finais.css` (player, aviso, marca do calendário) e
`public/css/views/videos.css` (a página).

### 6.2 Layout

- Desktop: grid `272px 1fr`. Sidebar fixa (sticky, 100vh, rolagem própria), fundo
  `--surface-card` com borda direita hairline. Conteúdo com `max-width: 1180px`, padding 32px.
- Sidebar, de cima pra baixo: bloco da marca (símbolo 32px + "legalizaí" em Sora 700 + subtítulo
  "cronograma de reels" 12px `--text-tertiary`); botão primário largo "+ Novo reel" (ícone raio ou
  mais); seções com rótulo 11px uppercase letter-spacing .14em `--text-tertiary`:
  - **GERAL**: Início (casa) · Cronograma (calendario) · Banco de Ideias (lampada) · Meus conteúdos (pasta)
  - **BIBLIOTECAS**: Biblioteca de Reels (livro) · Biblioteca de Carrosséis (carrossel, desabilitado, cadeado, "em breve")
  - **INSTAGRAM**: Métricas (grafico) · Inspirações (bussola). Ponto verde ao lado quando conectado
  - **CAMPANHA**: Pré-lançamento (alvo) com contador "N dias" até 31/12
  - Rodapé: cartão "Reels do mês" com `publicados+agendados do mês / metaMensal` e barra de
    progresso coral; linha com avatar (inicial "P" num círculo tint) + nome + @handle ou "Instagram
    não conectado"; botão de tema (sol/lua)
- Item ativo: fundo `--surface-tint-brand`, texto `--action-primary`, barrinha coral 3px à esquerda.
- Mobile (<900px): sidebar vira gaveta (off-canvas) aberta por botão hambúrguer numa barra de topo
  com o símbolo e "+"; conteúdo com padding 16px; nada de rolagem horizontal da página.

### 6.3 Efeito laranja (pedido explícito, em `base.css`, vale pra tudo)

Transições 180-240ms `cubic-bezier(.2,.8,.2,1)`. Nada de sombra escura de elevação (regra do
design guide); o efeito é COR e HALO coral:

```css
--halo: 0 0 0 3px color-mix(in srgb, var(--brand) 20%, transparent);
--brilho: 0 10px 28px -14px color-mix(in srgb, var(--brand) 70%, transparent);
```

- `.btn` (secundário) hover: borda `--brand`, fundo `--surface-tint-brand`, texto
  `--action-primary`, `box-shadow: var(--halo)`, `translateY(-1px)`
- `.btn-primario` hover: fundo `--action-primary-hover`, `box-shadow: var(--halo), var(--brilho)`,
  `translateY(-1px)`; active volta pra 0
- `.btn-fantasma` hover: fundo tint, texto coral
- `.btn-icone` hover: borda coral, ícone coral, halo
- Item da sidebar hover: fundo tint, texto coral, ícone coral (sem translate)
- Cards clicáveis (`.card-link`) hover: borda coral + halo + `translateY(-2px)`; capa com
  `scale(1.02)` suave na imagem/texto
- `:focus-visible`: mesmo halo (acessível por teclado)
- `@media (prefers-reduced-motion: reduce)`: sem translate/scale

### 6.4 Componentes base (classes em `base.css`, usadas por todos)

`.btn .btn-primario .btn-fantasma .btn-sm .btn-icone .btn-perigo` · `.campo` (input/select/textarea)
· `label.rotulo` · `.card` (superfície card, borda hairline, raio 16) · `.card-link` · `.pill`
`.pill-marca` `.pill-ok` `.pill-alerta` `.pill-info` · `.selo.validado .selo.em-teste .selo.erro` ·
`.grade` (auto-fill minmax(280px,1fr) gap 20) · `.grade-3` · `.cabecalho-pagina` (h1 32px 700 +
subtítulo `--text-secondary` + ações à direita) · `.vazio` · `.kpi` · `.segmentado` · `.painel`
`.painel-topo` `.painel-corpo` `.painel-rodape` `.veu` · `.toast` · `.bloco` `.bloco-titulo` (eyebrow
coral com régua 18×3) · `.texto` (caixa de texto longo) · `.progresso > i` · `.tabela` + `.rolagem`
· `.capa` (§ abaixo)

**Capa tipográfica** (`.capa`, 4:5, raio 16, overflow hidden): pill branca da categoria no canto
superior esquerdo (fundo `#FFFFFFE6` texto ink 12px 600), texto da `tela` em Sora 800, 30-34px,
line-height 1.0, caixa alta, centralizado verticalmente com leve rotação 0, trecho `destaque` em
`--brand`; ícone play num círculo `rgba(0,0,0,.45)` no canto inferior direito. Variantes: `ink`
(`--gradient-ink-hero` + texto `#F4F1EC`), `papel` (`#FAF8F5` + texto `#1B1E24`), `tint`
(`#FEF3EE` + texto `#1B1E24`). Estas 3 são as únicas exceções onde a peça declara cor fixa (a capa
imita uma peça publicada, que tem cor fixa nos dois temas). Um único destaque coral por capa.

**Card da biblioteca**: `.card.card-link` com `.capa` em cima e corpo: título 17px 600, fórmula
14px `--text-secondary` (2 linhas), linha de pills: público + selo; código "4.1" discreto.

**Card de ideia** (referência mag.ai): quadradinho tint 40px com ícone lampada coral, coração no
canto (favoritar), título 17px 700 (2 linhas), descrição 14px (3 linhas), pills: "Reel · Analogia"
(formato), tema ("Fator R" / "App"), origem ("Curadoria" / "IA" / "Instagram").

**Card de conteúdo** (Meus conteúdos): "editado hoje" 12px, título 20px 800 (2 linhas),
"Adaptado de 4.1", pills "Reel" + status + campanha, coração.

### 6.5 Tema e tokens

- `<link rel="stylesheet" href="/tokens.css">` e Sora do Google Fonts (400-800). Peso máx 800.
- `html[data-theme="dark"]` por padrão; botão alterna e grava em `localStorage`
  (`cronograma-tema`) com try/catch. Tema claro = tokens `:root` padrão (papel quente, não branco).
- Só tokens SEMÂNTICOS (`--surface-*`, `--text-*`, `--action-*`, `--border-*`, `--state-*`,
  `--brand`, `--radius-*`, `--space-*`, `--motion-*`, `--gradient-*`). Hex fixo só nas capas (§6.4).
- Proibido: azul como marca, coral como erro, branco puro de fundo de página, `--text-muted` em
  texto de leitura, travessão (— ou –) em QUALQUER texto de interface.

### 6.6 Textos da interface

Português do Brasil, "você", curto, sem travessão, grafia "Legalizaí". Saudação da home:
"Bora criar," + quebra + "**Pedro.**" (nome de `config.nomeUsuario`, em coral) e subtítulo "Por onde
você quer começar hoje?". Card de plano: próximo reel do cronograma sem publicar ("Próximo: <ideia>
· <data>" + botão "Abrir") ou, sem nenhum, "Seu mês está vazio" + "Planejar agora" (→ #/criar).
Cards grandes: "Criar do zero / Gerar reel com a skill / Reel em poucos cliques" (coral, abre
`abrirCriar`), "Banco de ideias / N ideias / Fator R e facilidade do app", "Reels / N validados /
formatos prontos pra adaptar" (escuro com 5 barrinhas, a do meio coral).

---

## 7. Agente (Claude Agent SDK, conta do Claude Code logada, sem API key)

### 7.1 Chat da skill (`server/agente.mjs`, porta da v1)

Mesmo esquema da v1 (streaming input + MCP in-process `salvar_reel`, tools `Read/Glob/Grep/Skill`,
`skills:['reels-curtos']`, `settingSources:['user','project']`, `cwd: RAIZ`, `permissionMode:
'dontAsk'`). Novidades no contexto: formato da biblioteca (código, categoria, fórmula, estrutura,
exemplo, referência, status/via) e, se houver `ideiaId`, a ideia (título, descrição, gancho,
fontes). `salvar_reel` grava `ideiaId` no reel e `reelId` na ideia. Campanha padrão
`cmp_prelancamento`. Modelo: `process.env.CRONOGRAMA_MODEL || undefined`.

### 7.2 Gerar ideias (`server/ideias-ia.mjs`)

`gerarIdeias({ tema, formatoId, quantidade })`: `query()` do SDK com `tools: ['Read']`, sem skills,
contexto com as regras duras (`_memoria/preferencias.md` e `estrategia.md` via Read), o tema
("fator-r": Fator R, pró-labore, Anexo III × V, simulador grátis; "app": facilidade de usar o app,
emitir nota em poucos toques, acompanhar CNPJ pelo celular, avisos de prazo; LEMBRAR que o app está
em pré-lançamento, então nada de "baixe agora") e a lista de formatos validados. Saída estruturada
por ferramenta MCP `registrar_ideias` (zod: array de {titulo, descricao, formatoId, gancho,
publico, fontes[]}) OU `outputFormat` json_schema se o SDK suportar. Grava e devolve. Timeout
3 min.

---

## 8. Instagram (`server/instagram.mjs`)

Graph API com login do Facebook, versão `process.env.IG_GRAPH_VERSION || 'v26.0'`, host
`graph.facebook.com`. Credenciais NUNCA vão pro front nem pro git. Persistência em
`data/instagram.json` (no `.gitignore`): `{ metodo: 'token'|'oauth', token, igUserId, username,
pageId, pageName, expiraEm|null, conectadoEm }`. Compatível com a v1: se `.env` tiver
`IG_ACCESS_TOKEN` + `IG_USER_ID`, usa isso (metodo `env`).

**Conectar por token (caminho recomendado pro Legalizaí, que já tem Gerenciador de Negócios por
causa dos anúncios)**: `POST /api/instagram/token {token}` → `GET me?fields=id,name` pra validar →
`GET me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}`
→ primeira página com `instagram_business_account` → grava (usa o `access_token` da página se vier,
senão o próprio token). Se nenhuma página tiver IG: erro claro dizendo quais páginas o token enxerga
e que o ativo precisa estar atribuído ao usuário do sistema.

**OAuth** (se `META_APP_ID` + `META_APP_SECRET` no `.env`): `/api/instagram/login` gera `state`
aleatório (guarda em memória 10 min) e redireciona pra
`https://www.facebook.com/<versao>/dialog/oauth?client_id&redirect_uri=http://localhost:<PORT>/api/instagram/callback&state&scope=instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement,business_management`
(ou `config_id=META_LOGIN_CONFIG_ID` no lugar de `scope` se existir). Callback confere `state`,
troca `code` (`oauth/access_token`), troca por longa duração (`fb_exchange_token`), descobre a conta
como acima, grava, redireciona.

**Métricas (proprios)**: igual v1 (`/{ig}/media` REELS + `/{media}/insights` com
`views,reach,saved,shares,likes,comments,total_interactions,ig_reels_avg_watch_time,reels_skip_rate`),
+ `thumbnail_url`; `relativo` = views ÷ mediana. Conta: `followers_count, media_count,
profile_picture_url, username`. Erro por mídia não derruba o resto.

**Inspirações**: por conta de referência, Business Discovery (v1) pedindo também
`thumbnail_url,media_url`; `relativo` pela mediana DAQUELA conta. Por hashtag:
`ig_hashtag_search?user_id&q` → `/{id}/top_media?user_id&fields=id,caption,media_type,permalink,timestamp,like_count,comments_count,media_url`
(sem views: `relativo: null`, marcado `semRegua: true`; não vira evidência). Hashtag pode exigir o
recurso "Instagram Public Content Access": se a API recusar, registrar em `erros` com essa
explicação e seguir.

Item de mídia no cache: `{ midiaId, conta, origem:'nosso'|'nicho'|'hashtag', hashtag?, permalink,
caption, timestamp, thumb, views, reach, saved, shares, likes, comments, relativo, semRegua,
caseId }`.

---

## 9. Migração (`server/migrar.mjs`, roda no boot)

Se `db.json` não existe: monta a partir de `seed.json` + `biblioteca.json` + `ideias.json` +
importação dos `reel.md` (v1 `importar.mjs`). Se existe com `schemaVersion` ausente (v1): backup em
`data/db.v1.backup.json` (se ainda não existir), então: campanhas viram só `cmp_prelancamento` e
todo reel com campanha (ou sem) aponta pra ela; `formatos` = `biblioteca.json` (28) + os 6 testes
remapeados; `radar` vira `instagram` (reels do radar → `proprios`/`inspiracoes`); `ideias` do seed;
`cases` = []; `schemaVersion: 2`. Idempotente. Se `biblioteca.json`/`ideias.json` ganharem entrada
nova com id que não existe no db, ela entra no boot (merge por id, nunca sobrescreve edição do
usuário).
