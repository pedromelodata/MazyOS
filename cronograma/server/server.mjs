// Servidor local da Gestão de Marketing (o antigo Cronograma de Reels, SPEC v2 §5). Só escuta em 127.0.0.1;
// o acesso de fora chega pelo túnel da Cloudflare (cloudflared → localhost), então todo pedido passa pelo
// login (auth.mjs).
// Decisões fora do SPEC, anotadas aqui:
//  - Host precisa ser localhost/127.0.0.1, um de PUBLIC_HOSTS ou *.trycloudflare.com (anti DNS
//    rebinding) e escrita vinda de outra origem é recusada: a API roda o Claude com a conta logada
//  - sem sessão: página vai pra /entrar?volta=..., o resto é 401. Só a tela de entrar, as logos e o link
//    único (/api/auth/convite, convites.mjs) são livres
//  - 23/09: conta nova e senha esquecida só por link único. POST /api/usuarios (senha temporária) e
//    POST /api/auth/primeiro (primeira conta) saíram: 410
//  - host público visitado por http (Cf-Visitor / X-Forwarded-Proto): GET e HEAD vão pra https (308), o resto é 403
//  - criadoPor / atualizadoPor (nome de quem entrou) são do servidor: o corpo não mexe
//  - apagar formato com case pendurado dá 409 (o case é a prova do formato, não some calado)
//  - reel.ideiaId é a verdade; ideia.reelId aponta pro reel mais recente da ideia (repontarIdeia)
//  - o mesmo post (mídia, link ou reel) nunca vira dois cases: 409
//  - reel.origem e reel.origemChat são do servidor (importar.mjs e salvar_reel): o corpo não mexe
//  - config só aceita as chaves conhecidas
//  - reel tem tipo (viralizacao | vendas | conexao | ensino | conselho | null), gravacao (só as chaves conhecidas) e fontes
//  - POST /api/reels/lote cria vários reels de uma vez (tipo, data e formato obrigatórios). Mesma
//    data + mesmo título (ou mesma ideia) de um reel que já existe = duplicado: não cria gêmeo
//  - edição na tela regrava o reel.md que o próprio cronograma gerou (o escrito à mão fica)
//  - 24/09: /api/instagram/analise/:midiaId (POST começa a análise "Por que esse reel funcionou", GET
//    devolve fatos + cache + andamento; um job por vez) e .../quadro/:n (quadros-chave em webp)
//  - 24/09: /api/monitoramento/:mes (monitoramento.mjs): abas Orgânico, Pago e Consolidado da planilha
//    de monitoramento, guardadas em data/monitoramento.json
//  - 28/09: /api/reels/:id/outras-ideias (outras-ideias.mjs): POST começa a geração de 3 ideias pro mesmo
//    lugar da peça (uma por usuário), GET acompanha, POST .../usar { opcao } aplica a escolhida
//  - 28/09: stories do dia (db.stories, um por data; nasce do aplicar-stories.mjs). /api/estado leva a lista;
//    PUT /api/stories/:id edita o dia (validar.mjs, conferirStoriesDia; outra data já com stories = 409) e
//    PUT /api/stories/:id/status { status } só troca o status. Peça apagada solta o pecaDoDia que apontava pra ela
//  - 23/09: /api/estado leva o guia do nicho (estilos, temas, tipos). Ideia tem tipo, tema (id do guia
//    ou rótulo), estiloGancho e roteiroBase; na tela ela ganha temaNome (calculado, não volta pro banco).
//    Formato tem tipos (pra que tipos serve)
//  - 30/09: /api/metricas/* (metricas-rotas.mjs, SPEC-METRICAS.md §4): Diagnóstico, Público, Anúncios, Stories,
//    Semanal e Agenda. "Sincronizar agora" zera o cache do diagnóstico (número novo na próxima leitura)
//  - 30/09: agenda de Métricas (agenda.mjs) liga no listen: lê posts, stories, público e anúncios e gera o
//    semanal sozinha, só com este computador e o servidor ligados. CRONOGRAMA_AGENDA=0 não liga (teste)
//  - 02/10: vídeos finais (videos.mjs). GET /api/videos lista as propostas de marketing/final (CRONOGRAMA_FINAL)
//    com as peças que apontam pra cada arquivo; GET /videos/<caminho> entrega o vídeo (Range, só com login, só
//    dentro da pasta; o player recebe em pedaços) e, com ?capa=, a capa em JPEG (ffmpeg, em data/capas-videos).
//    Senha temporária: 403 no vídeo também. /api/estado leva videosFinais (a versão da área): a tela só mostra
//    "Vídeos prontos" com 2+. /api/versao leva a hora em que o servidor subiu: a aba aberta recarrega depois do reinício
//  - 21/10: /api/envios (envios.mjs): arquivos subidos direto nas Aprovações técnicas, com título e base. O upload lê o
//    corpo cru (não passa pelo corpoJson). O pedido pode levar até 30 min (requestTimeout): 200 MB por uma rede lenta
//    passam dos 5 min padrão do Node, que cortava o arquivo no meio
//  - 21/10 (Pedro, segurança): o caminho da API é montado UMA vez no handler (auth.partesDaApi) e o canônico passa por
//    tudo: lista livre, rotas que saíram, senha temporária, perfil (auth.podeApi) e a própria rota (api recebe as
//    partes). Segmento vazio, decode que falha e segmento com barra, contrabarra, controle, "." ou ".." = 400. Toda
//    resposta de erro com o corpo ainda chegando fecha a conexão (auth.fecharSeCorpoChegando, no json). Rota livre
//    não passa pelo perfil (quem já tem sessão entra de novo por outro link). POST /api/auth/pin é livre (link + PIN)
//  - 22/10 (Pedro): os stories do dia podem ir pra aprovação técnica (aprovacoes.mjs, id sto_...). /api/estado e as rotas
//    /api/stories/:id devolvem a aprovação deles normalizada (aprovacaoParaTela); o PUT confere o texto mexido com a
//    aprovação dada ou pendente (conferirMudancaAprovada)
import http from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  APP, DATA_DIR, carregar, salvar, statusFormato, falha, novoId, agora, hoje, repontarIdeia, mesmoPost,
  LIMIAR_RELATIVO, MIN_CASES_ACIMA, TIPOS_REEL, ROTULO_TIPO, ICONE_TIPO, guia, nomeTema, limparTiposFormato, gravacaoVazia, TRACOS,
} from './db.mjs';
import {
  semCampos, conferirRefs, refsVazias, conferirReel, mesmoReel, reelDoLote, limparIdeia, ideiaPadrao, pecaVazia,
  conferirStoriesDia, conferirStatusStories,
} from './validar.mjs';
import { RAIZ } from './importar.mjs';
import { CAMPANHA_PADRAO } from './migrar.mjs';
import { conversar, conferirPedidoChat } from './agente.mjs';
import { escreverReelMd, regravarSeGerado } from './reelmd.mjs';
import { gerarIdeias } from './ideias-ia.mjs';
import * as outrasIdeias from './outras-ideias.mjs';
import * as bancoIdeias from './banco-ideias.mjs';
import * as instagram from './instagram.mjs';
import * as analise from './analise.mjs';
import * as auth from './auth.mjs';
import * as convites from './convites.mjs';
import * as monitoramento from './monitoramento.mjs';
import * as metricasRotas from './metricas-rotas.mjs';
import * as agenda from './agenda.mjs';
import * as videos from './videos.mjs';
import * as storiesMetricas from './stories-metricas.mjs';
import * as aprovacoes from './aprovacoes.mjs';
import * as envios from './envios.mjs';
import * as rotasConteudo from './rotas-conteudo.mjs';

const PORTA = auth.PORTA;

// CRONOGRAMA_PUBLIC (teste): serve uma cópia do front sem mexer no que o servidor de verdade está servindo
const PUBLICO = process.env.CRONOGRAMA_PUBLIC ? path.resolve(process.env.CRONOGRAMA_PUBLIC) : path.join(APP, 'public');
// tokens.css e logos vêm direto do design system, não são cópia: mudou lá, muda aqui
const ESTATICOS = {
  '/tokens.css': path.join(RAIZ, 'identidade', 'tokens.css'),
  '/simbolo.svg': path.join(RAIZ, 'identidade', 'logos', 'simbolo.svg'),
  '/logo-clara.svg': path.join(RAIZ, 'identidade', 'logos', 'legalizai-logo-negativa-clara.svg'),
  '/logo.svg': path.join(RAIZ, 'identidade', 'logos', 'legalizai-logo-horizontal.svg'),
  '/favicon.ico': path.join(APP, 'deploy', 'cronograma.ico'),
  // tela de entrar: a única página que abre sem sessão
  '/entrar': path.join(APP, 'public', 'entrar.html'),
  '/css/entrar.css': path.join(APP, 'public', 'css', 'entrar.css'),
  '/js/entrar.js': path.join(APP, 'public', 'js', 'entrar.js'),
};
// sem sessão, só isto responde (caminho canônico, partesDaApi). 21/10: link + PIN (auth.mjs)
const API_PUBLICA = new Set(['GET /api/auth/estado', 'POST /api/auth/entrar', 'GET /api/auth/convite', 'POST /api/auth/convite', 'POST /api/auth/pin']);
// rotas que saíram: respondem 410 pra qualquer um (a tela antiga mostra o motivo em vez de um 401)
const REMOVIDAS = new Map([
  ['POST /api/auth/primeiro', 'A primeira conta agora nasce por link único. Neste computador: npm run usuario convite'],
]);
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', // 22/10 (Pedro): as fontes do estúdio de design (public/js/estudio/fontes)
};

const ORIGENS_CASE = ['nosso', 'nicho', 'manual'];
const CALCULADOS = ['status', 'via', 'acima', 'casesCount', 'original'];
const CHAVES_CONFIG = ['nomeUsuario', 'metaMensal', 'handleInstagram', 'contasReferencia', 'hashtags'];
const AUDITORIA = ['criadoPor', 'atualizadoPor'];
const autor = (req) => req.auth?.usuario?.nome ?? null;
// o que aparece no reel.md: mudou algum destes na tela, o arquivo gerado é regravado
const CAMPOS_DO_MD = [
  'ideia', 'tema', 'tipo', 'data', 'formatoId', 'ideiaId', 'campanhaId', 'roteiro', 'legenda', 'gravacao', 'fontes',
  'pilar', 'pilarTexto', 'rede', 'gatilho', 'impulsionar', 'formatoTexto', 'notas',
  'bloco', 'peca', 'peca2', 'carrossel', 'estatico', 'stories',
];
const MAX_LOTE = 60;
// campos do tema que a tela recebe (fatos com fontes: o painel da ideia mostra)
const CAMPOS_TEMA = ['id', 'nome', 'publico', 'dor', 'pilar', 'fatos', 'fontes', 'sazonal'];

const json = (res, codigo, corpo) => {
  // 21/10: recusa com o corpo ainda chegando sai com connection: close (a regra única, auth.mjs)
  if (codigo >= 400) auth.fecharSeCorpoChegando(res.req, res);
  res.writeHead(codigo, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(corpo));
};

// junta os pedaços e decodifica uma vez só: acento cortado entre dois pedaços não vira �
async function corpoJson(req, limite = 1_000_000) {
  const partes = [];
  let total = 0;
  for await (const c of req) {
    total += c.length;
    if (total > limite) throw falha(413, 'Corpo grande demais.');
    partes.push(c);
  }
  const s = Buffer.concat(partes, total).toString('utf8');
  if (!s.trim()) return {};
  try {
    const b = JSON.parse(s);
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error();
    return b;
  } catch {
    throw falha(400, 'JSON inválido no corpo da requisição.');
  }
}

const numOuNull = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

// aceita array ou texto separado por vírgula/espaço/linha; tira @ ou # e repetidos
function listaLimpa(v, prefixo) {
  const itens = Array.isArray(v) ? v : String(v ?? '').split(/[\s,;]+/);
  return [...new Set(itens.map((s) => String(s).trim().replace(prefixo, '').trim()).filter(Boolean))];
}

// a proveniência dos formatos da biblioteca fica só no banco: pro navegador vai "validado" e nada mais
const neutro = (v) => (v === 'curadoria' ? 'biblioteca' : v);
// o template original (título, fórmula e público) vai pra tela; a fonte da referência nunca.
// Nome de pessoa sai do título e travessão vira vírgula ou dois-pontos (regras duras de copy)
const ORIGINAL_AJUSTE = {
  '2.1': { titulo: 'Marketing × oportunismo', formula: 'Reação a uma notícia de marketing oportunista' },
  '3.2': { formula: 'Vendeu uma Ferrari de leilão pra abrir uma loja, e virou rede bilionária' },
  '5.3': { titulo: '10 vídeos em 2 dias' },
  '8.1': { titulo: 'Recusei trabalho' },
  '8.2': { formula: 'Heurística do esforço: mostre o trabalho invisível' },
};
const limparOriginal = (s) => String(s ?? '')
  .replace(/^\s*(?:Giullya|Natalha|Natalia)\s*[:\u2013\u2014-]\s*/i, '')
  .replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, '$1-$2')
  .replace(TRACOS, ', ')
  .trim();
function originalDo(f) {
  const r = f.referencia;
  if (!r || typeof r !== 'object' || !r.titulo) return null;
  const aj = ORIGINAL_AJUSTE[f.codigo] ?? {};
  return {
    titulo: limparOriginal(aj.titulo ?? r.titulo),
    formula: limparOriginal(aj.formula ?? r.formula),
    publico: limparOriginal(r.publicoOriginal),
  };
}
function formatoParaTela(f, calc) {
  const { referencia, ...resto } = f;
  return {
    ...resto,
    original: originalDo(f),
    origem: neutro(f.origem),
    // mesmo índice do banco: o DELETE de evidência usa ?i=N
    evidencias: (f.evidencias ?? []).map((e) => (e.tipo === 'curadoria' ? { tipo: 'interna' } : e)),
    ...calc,
    via: neutro(calc.via),
  };
}
// 22/10: a peça guardada (ideia que veio do cronograma) não vai inteira pra tela: só o dia e o tipo, pro "Voltar"
const ideiaParaTela = ({ pecaOriginal, ...i }) => ({
  ...i, origem: neutro(i.origem), temaNome: nomeTema(i.tema),
  daPeca: pecaOriginal ? { data: pecaOriginal.data ?? '', peca: pecaOriginal.peca ?? 'reel' } : null,
});

// 21/10 (Pedro): os stories que já foram ao ar, por dia de Brasília, pra preencher os quadros do dia no painel.
// Vêm do registro de stories-metricas.json (a agenda captura de hora em hora). Registro ilegível não derruba o estado
async function storiesPostados() {
  try {
    const j = await storiesMetricas.ler();
    const out = {};
    for (const [id, s] of Object.entries(j?.stories ?? {})) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s?.dia ?? ''))) continue;
      (out[s.dia] ??= []).push({
        id,
        publicadoEm: String(s.publicadoEm ?? ''),
        tipo: String(s.tipo ?? ''),
        permalink: String(s.permalink ?? ''),
        thumb: String(s.thumb ?? ''),
        views: Number.isFinite(s.ultima?.views) ? s.ultima.views : null,
        reach: Number.isFinite(s.ultima?.reach) ? s.ultima.reach : null,
      });
    }
    for (const l of Object.values(out)) l.sort((a, b) => a.publicadoEm.localeCompare(b.publicadoEm));
    return out;
  } catch (e) {
    console.error('stories postados fora do estado:', e.message);
    return {};
  }
}

function reelsParaTela(reels) {
  const gerentes = auth.gerentesAtivos();
  return reels.map((r) => (r.aprovacao && typeof r.aprovacao === 'object' ? { ...r, aprovacao: aprovacoes.aprovacaoParaTela(r.aprovacao, gerentes) } : r));
}
// 22/10 (Pedro): os stories do dia também vão pra aprovação: a aprovação deles na mesma forma das peças (a mesma conta)
const storiesParaTela = (stories) => reelsParaTela(stories);

async function estado() {
  const db = await carregar();
  const porFormato = new Map();
  for (const c of db.cases) porFormato.set(c.formatoId, (porFormato.get(c.formatoId) ?? 0) + 1);
  // montado campo a campo: o cache pesado de mídias e qualquer credencial ficam de fora
  return {
    schemaVersion: db.schemaVersion,
    config: db.config,
    pilares: db.pilares,
    campanhas: db.campanhas,
    formatos: db.formatos.map((f) => formatoParaTela(f, { ...statusFormato(f, db.cases), casesCount: porFormato.get(f.id) ?? 0 })),
    cases: db.cases,
    ideias: db.ideias.map(ideiaParaTela),
    // 21/10 (Pedro): a aprovação de cada peça na forma da aba Aprovações (aprovacoes.aprovacaoParaTela): a etapa de
    // agora, não a gravada (gerente que saiu ou mudou de perfil), e só os gerentes de agora em "aprovaram"
    reels: reelsParaTela(db.reels),
    // 22/10 (Pedro): a aprovação dos stories do dia na mesma forma (aprovacaoParaTela)
    stories: storiesParaTela(db.stories ?? []),
    storiesPostados: await storiesPostados(),
    regraValidacao: { limiarRelativo: LIMIAR_RELATIVO, minCasesAcima: MIN_CASES_ACIMA },
    instagram: await instagram.status(),
    // guia do nicho (data/estilos.json): os 3 estilos, os temas com fatos e fontes, e os tipos de reel
    estilos: guia().estilos,
    temas: guia().temas.map((t) => Object.fromEntries(CAMPOS_TEMA.map((k) => [k, t[k] ?? (['fatos', 'fontes'].includes(k) ? [] : null)]))),
    tipos: TIPOS_REEL.map((id) => ({ id, rotulo: ROTULO_TIPO[id], icone: ICONE_TIPO[id], estilo: Object.hasOwn(guia().estilos, id) })),
    // 02/10: versão da área de vídeos finais (/api/videos e /videos/...). A tela só mostra "Vídeos prontos" com 2+
    videosFinais: videos.VERSAO,
  };
}

const comStatus = (db, f) => formatoParaTela(f, { ...statusFormato(f, db.cases), casesCount: db.cases.filter((c) => c.formatoId === f.id).length });
// 21/10 (Pedro): a peça devolvida pelo POST e pelo PUT leva a aprovação na mesma forma do /api/estado
const paraTela = (db, recurso, item) => (recurso === 'formatos' ? comStatus(db, item) : recurso === 'ideias' ? ideiaParaTela(item)
  : recurso === 'reels' ? reelsParaTela([item])[0] : item);

// ---------- validação e padrões por coleção (reel e ideia em validar.mjs) ----------

function limparCase(b) {
  const c = { ...b };
  for (const k of ['views', 'likes', 'comments', 'saved', 'shares', 'relativo']) if (k in c) c[k] = numOuNull(c[k]);
  if ('origem' in c && !ORIGENS_CASE.includes(c.origem)) throw falha(400, 'origem do case precisa ser nosso, nicho ou manual.');
  if ('midiaId' in c) c.midiaId = c.midiaId == null || c.midiaId === '' ? null : String(c.midiaId);
  return c;
}

// o mesmo post nunca vira dois cases: um reel só não pode validar um formato
function conferirCaseRepetido(db, b, excetoId = null) {
  const dup = instagram.caseDoPost(db, { midiaId: b.midiaId, permalink: b.permalink, reelId: b.reelId }, excetoId);
  if (!dup) return;
  const f = db.formatos.find((x) => x.id === dup.formatoId);
  throw falha(409, `Esse reel já é case do formato ${f?.codigo || dup.formatoId}.`);
}

// case novo liga a mídia do cache (Métricas / Inspirações) e herda o midiaId dela
function ligarCaseMidia(db, c) {
  for (const m of [...(db.instagram?.proprios ?? []), ...(db.instagram?.inspiracoes ?? [])]) {
    if ((c.midiaId && m.midiaId === c.midiaId) || mesmoPost(m.permalink, c.permalink)) {
      if (!m.caseId) m.caseId = c.id;
      c.midiaId ??= m.midiaId;
    }
  }
}

const NOVO = {
  reels: (b, db) => {
    const limpo = conferirReel(b);
    conferirRefs(db, limpo);
    return {
      ideia: '', tema: '', pilar: null, formatoId: null, campanhaId: CAMPANHA_PADRAO, data: '', status: 'ideia',
      roteiro: { hook: '', textoTela: '', cenas: [], desenvolvimento: '', cta: '' }, legenda: '', permalink: '',
      metricas: null, ideiaId: null, favorito: false, tipo: null, gravacao: gravacaoVazia(), fontes: [], ...pecaVazia(), ...limpo, criadoEm: agora(),
    };
  },
  ideias: (b, db) => {
    if (!String(b.titulo ?? '').trim()) throw falha(400, 'A ideia precisa de um título.');
    const limpo = limparIdeia(b);
    conferirRefs(db, limpo);
    return { ...ideiaPadrao(), ...limpo, criadaEm: agora() };
  },
  formatos: (b, db) => {
    if (!String(b.nome ?? '').trim()) throw falha(400, 'O formato precisa de um nome.');
    const n = Math.max(0, ...db.formatos.map((f) => (String(f.codigo).startsWith('T.') ? Number(String(f.codigo).slice(2)) || 0 : 0)));
    return {
      codigo: `T.${n + 1}`, categoria: 'Nossos testes', nome: '', formula: '', descricao: '', publico: 'MEI + ME', duracao: '',
      estrutura: [], exemplo: { titulo: '', gancho: '', tela: '', destaque: '' }, referencia: null, origem: 'teste', fontes: [],
      ...semCampos(b, [...CALCULADOS, 'evidencias']), tipos: limparTiposFormato(b.tipos), evidencias: [], criadoEm: agora(),
    };
  },
  cases: (b, db) => {
    if (!db.formatos.some((f) => f.id === b.formatoId)) throw falha(400, 'O case precisa estar pendurado num formato da biblioteca.');
    conferirRefs(db, b);
    const c = limparCase(b);
    conferirCaseRepetido(db, c);
    return {
      formatoId: b.formatoId, titulo: '', conta: '', origem: 'manual', permalink: '', thumb: '', views: null, likes: null,
      comments: null, saved: null, shares: null, relativo: null, data: hoje(), notas: '', midiaId: null, reelId: null,
      ...c, criadoEm: agora(),
    };
  },
};
const PREFIXO = { reels: 'reel', ideias: 'ide', formatos: 'fmt', cases: 'case' };

function validarEdicao(recurso, b, db, item) {
  if (recurso === 'reels') b = conferirReel(b, item);
  if (recurso === 'ideias') b = limparIdeia(b, item);
  if (recurso === 'formatos' && 'tipos' in b) b.tipos = limparTiposFormato(b.tipos);
  if (recurso === 'cases' && 'formatoId' in b && !db.formatos.some((f) => f.id === b.formatoId)) throw falha(400, 'O case precisa estar pendurado num formato da biblioteca.');
  conferirRefs(db, recurso === 'cases' ? semCampos(b, ['formatoId']) : b);
  let limpo = semCampos(b, ['id', 'criadoEm', 'criadaEm', 'atualizadoEm', ...AUDITORIA]);
  if (recurso === 'formatos') limpo = semCampos(limpo, [...CALCULADOS, 'evidencias']); // evidência só pela rota própria
  if (recurso === 'cases') {
    limpo = limparCase(limpo);
    if (['midiaId', 'permalink', 'reelId'].some((k) => k in limpo)) conferirCaseRepetido(db, { ...item, ...limpo }, item.id);
  }
  return limpo;
}

// reel.ideiaId <-> ideia.reelId
function ligarIdeia(db, reel, ideiaIdAntiga) {
  if (ideiaIdAntiga && ideiaIdAntiga !== reel.ideiaId) {
    const velha = db.ideias.find((i) => i.id === ideiaIdAntiga);
    if (velha?.reelId === reel.id) repontarIdeia(db, velha.id, reel.id);
  }
  const nova = reel.ideiaId && db.ideias.find((i) => i.id === reel.ideiaId);
  if (nova) nova.reelId = reel.id;
}
function ligarReel(db, ideia, reelIdAntigo) {
  if (reelIdAntigo && reelIdAntigo !== ideia.reelId) {
    const velho = db.reels.find((r) => r.id === reelIdAntigo);
    if (velho?.ideiaId === ideia.id) velho.ideiaId = null;
  }
  const novo = ideia.reelId && db.reels.find((r) => r.id === ideia.reelId);
  if (novo) {
    // o reel deixa a ideia de antes: ela volta pra outro reel dela (ou fica sem)
    const dono = novo.ideiaId;
    novo.ideiaId = ideia.id;
    if (dono && dono !== ideia.id) repontarIdeia(db, dono, novo.id);
  }
}

async function crud(req, res, recurso, id) {
  const db = await carregar();
  const lista = db[recurso];

  if (req.method === 'POST' && !id) {
    const b = refsVazias(await corpoJson(req));
    const item = { id: novoId(PREFIXO[recurso]), ...NOVO[recurso](semCampos(b, ['id', ...AUDITORIA]), db), criadoPor: autor(req) };
    // 21/10 (Pedro): peça de feed não nasce postada sem passar pela aprovação técnica (a mesma trava do PUT). Peça de
    // data passada pode nascer postada (registro do que já foi ao ar)
    if (recurso === 'reels' && item.status === 'publicado' && aprovacoes.travaPostado({ ...item, status: 'ideia' })) {
      return json(res, 409, { erro: aprovacoes.MSG_TRAVA_POSTADO });
    }
    lista.push(item);
    if (recurso === 'reels') ligarIdeia(db, item, null);
    if (recurso === 'ideias') ligarReel(db, item, null);
    if (recurso === 'cases') ligarCaseMidia(db, item);
    await salvar();
    return json(res, 201, paraTela(db, recurso, item));
  }

  const item = id && lista.find((x) => x.id === id);
  if (!item) return json(res, 404, { erro: 'Não encontrado.' });

  if (req.method === 'PUT') {
    const b = validarEdicao(recurso, refsVazias(await corpoJson(req)), db, item);
    // 21/10: peça de feed só vira "postada" depois da aprovação técnica (aprovacoes.mjs). 21/10 (Pedro): conferida como
    // estava e como fica (data e tipo de peça novos no mesmo PUT) e sem mudar o que foi aprovado no mesmo pedido
    if (recurso === 'reels' && aprovacoes.travaPostadoNaEdicao(item, b)) {
      return json(res, 409, { erro: aprovacoes.MSG_TRAVA_POSTADO });
    }
    // 21/10 (Pedro): a foto de tudo que a aprovação cobre (texto, tipo de peça, vídeo final e fontes), não só do texto
    const textoAntes = recurso === 'reels' ? aprovacoes.fotoDaAprovacao(item) : null;
    const antes = { ideiaId: item.ideiaId, reelId: item.reelId };
    // só favoritar não conta como edição: o card não pula pro topo nem vira "editado hoje"
    const soFavorito = Object.keys(b).length > 0 && Object.keys(b).every((k) => k === 'favorito' || k === 'favorita');
    Object.assign(item, b, soFavorito ? {} : { atualizadoEm: agora(), atualizadoPor: autor(req) });
    if (recurso === 'reels' && 'ideiaId' in b) ligarIdeia(db, item, antes.ideiaId);
    if (recurso === 'ideias' && 'reelId' in b) ligarReel(db, item, antes.reelId);
    if (recurso === 'reels') aprovacoes.conferirMudancaAprovada(item, textoAntes, req.auth?.usuario);
    await salvar();
    // texto do reel mudou na tela: o reel.md gerado acompanha (falha no arquivo não desfaz a edição)
    if (recurso === 'reels' && CAMPOS_DO_MD.some((k) => k in b)) {
      await regravarSeGerado(item).catch((e) => console.error(`reel.md de ${item.id} não foi regravado:`, e.message));
    }
    return json(res, 200, paraTela(db, recurso, item));
  }

  if (req.method === 'DELETE') {
    if (recurso === 'formatos') {
      const n = db.cases.filter((c) => c.formatoId === id).length;
      if (n) return json(res, 409, { erro: `Esse formato tem ${n} ${n === 1 ? 'case' : 'cases'}. Mova ou apague os cases antes.` });
      for (const x of [...db.reels, ...db.ideias]) if (x.formatoId === id) x.formatoId = null;
    }
    if (recurso === 'reels') {
      // a ideia volta pro outro reel dela que ainda existe, se houver
      for (const i of db.ideias) if (i.reelId === id) repontarIdeia(db, i.id, id);
      for (const c of db.cases) if (c.reelId === id) c.reelId = null;
      for (const s of db.stories ?? []) if (s.pecaDoDia === id) s.pecaDoDia = null;
    }
    if (recurso === 'ideias') for (const r of db.reels) if (r.ideiaId === id) r.ideiaId = null;
    if (recurso === 'cases') for (const m of [...db.instagram.proprios, ...db.instagram.inspiracoes]) if (m.caseId === id) m.caseId = null;
    lista.splice(lista.indexOf(item), 1);
    await salvar();
    if (recurso === 'reels') {
      // 30/09 (Métricas): as hipóteses da peça saem de hipoteses.json e os posts ligados a ela ficam sem peça em
      // mecanismos.json (diagnostico.pecaApagada, pelos módulos donos). Melhor esforço: a peça já foi apagada e
      // falha aqui só vai pro log
      try {
        await (await import('./diagnostico.mjs')).pecaApagada(id, autor(req));
      } catch (e) {
        console.error(`Peça ${id} apagada, mas as hipóteses e os vínculos de post dela não foram limpos:`, e.message);
      }
    }
    return json(res, 200, { ok: true });
  }
  return json(res, 405, { erro: 'Método não permitido.' });
}

// ---------- lote de reels (POST /api/reels/lote; validação em validar.mjs) ----------

// tudo ou nada na validação: um item com problema e nada é criado (400 com a lista).
// Duplicado de reel que já existe não vira gêmeo: fica de fora e volta em "duplicados";
// se todos forem duplicados, 409. Criação num save só; depois o reel.md de cada um
async function lote(req, res) {
  const b = await corpoJson(req, 5_000_000);
  if (!Array.isArray(b.reels) || !b.reels.length) throw falha(400, 'Mande { "reels": [ ... ] } com pelo menos um reel.');
  if (b.reels.length > MAX_LOTE) throw falha(400, `No máximo ${MAX_LOTE} reels por lote.`);
  const db = await carregar();
  const problemas = [];
  const validos = [];
  b.reels.forEach((bruto, indice) => {
    try {
      const r = reelDoLote(db, bruto);
      // 21/10 (Pedro): a mesma trava do POST de uma peça: feed de hoje em diante não entra já postado
      if (r.status === 'publicado' && aprovacoes.travaPostado({ ...r, status: 'ideia' })) throw falha(409, aprovacoes.MSG_TRAVA_POSTADO);
      const igual = validos.find((v) => mesmoReel(v.r, r));
      if (igual) throw falha(400, `repete o reel de índice ${igual.indice} deste lote (mesma data e mesmo título ou mesma ideia).`);
      validos.push({ indice, r });
    } catch (e) {
      if (!e.status) throw e;
      problemas.push({ indice, data: bruto?.data ?? null, ideia: bruto?.ideia ?? null, erro: e.message });
    }
  });
  if (problemas.length) {
    const n = problemas.length;
    return json(res, 400, { erro: `${n} ${n === 1 ? 'reel tem' : 'reels têm'} problema. Nada foi criado.`, problemas });
  }

  const duplicados = [];
  const novos = [];
  for (const { indice, r } of validos) {
    const existente = db.reels.find((x) => mesmoReel(x, r));
    if (existente) duplicados.push({ indice, data: r.data, ideia: r.ideia, reelId: existente.id });
    else novos.push({ indice, reel: { id: novoId('reel'), ...r, criadoPor: autor(req) } });
  }
  if (!novos.length) {
    return json(res, 409, { erro: 'Esses reels já estão no cronograma (mesma data e mesmo título). Nada foi criado.', criados: [], duplicados, avisos: [] });
  }

  for (const { reel } of novos) {
    db.reels.push(reel);
    ligarIdeia(db, reel, null);
  }
  await salvar();

  const criados = [];
  const avisos = [];
  for (const { indice, reel } of novos) {
    let arquivo = null;
    try {
      await escreverReelMd(reel, { adiar: true });
      arquivo = reel.origem ?? null;
    } catch (e) {
      avisos.push({ indice, reelId: reel.id, erro: `O reel entrou no cronograma, mas o reel.md não foi escrito: ${e.message}` });
    }
    criados.push({ indice, id: reel.id, data: reel.data, tipo: reel.tipo, ideia: reel.ideia, arquivo });
  }
  await salvar(); // origem (caminho do reel.md) de cada reel novo
  return json(res, 201, { criados, duplicados, avisos });
}

// ---------- stories do dia (28/09): PUT edita o dia inteiro, PUT .../status só troca o status ----------
// 22/10 (Pedro): os stories do dia podem ir pra aprovação técnica (aprovacoes.mjs). aprovacao é campo do servidor: o PUT
// não grava a que vem da tela (conferirStoriesDia só devolve os campos do dia). Tema, quadros, CTA ou fontes mexidos com
// a aprovação dada viram 'alterado' (pendente volta pros gerentes), como na peça. Marcar como postado não pede
// aprovação. A resposta leva a aprovação na forma da tela, como o /api/estado
const diaMes = (iso) => `${String(iso).slice(8, 10)}/${String(iso).slice(5, 7)}`;
async function rotaStories(req, res, id, sub) {
  const db = await carregar();
  db.stories ??= [];
  const s = db.stories.find((x) => x.id === id);
  if (!s) return json(res, 404, { erro: 'Esses stories não existem mais.' });
  const marcar = () => Object.assign(s, { atualizadoEm: agora(), atualizadoPor: autor(req) });
  const devolver = () => json(res, 200, storiesParaTela([s])[0]);
  if (sub === 'status') {
    if (req.method !== 'PUT') return json(res, 405, { erro: 'Método não permitido.' });
    const status = conferirStatusStories((await corpoJson(req, 10_000)).status);
    if (status !== s.status) {
      s.status = status;
      marcar();
      await salvar();
    }
    return devolver();
  }
  if (sub) return json(res, 404, { erro: 'Rota não existe.' });
  if (req.method === 'GET') return devolver();
  if (req.method !== 'PUT') return json(res, 405, { erro: 'Método não permitido.' });
  const b = await corpoJson(req, 200_000);
  const limpo = conferirStoriesDia(db, b, s);
  const status = 'status' in b ? conferirStatusStories(b.status) : s.status;
  const outro = db.stories.find((x) => x.id !== s.id && x.data === limpo.data);
  if (outro) throw falha(409, `Já existem stories em ${diaMes(limpo.data)}. Um dia tem um só.`);
  const antes = JSON.stringify(s);
  // 22/10 (Pedro): a foto do que a aprovação cobre, antes de gravar
  const fotoAprovacao = aprovacoes.fotoDaAprovacao(s);
  Object.assign(s, limpo, { status });
  aprovacoes.conferirMudancaAprovada(s, fotoAprovacao, req.auth?.usuario);
  if (JSON.stringify(s) !== antes) {
    marcar();
    await salvar();
  }
  return devolver();
}

async function evidencias(req, res, id, url) {
  const db = await carregar();
  const f = db.formatos.find((x) => x.id === id);
  if (!f) return json(res, 404, { erro: 'Esse formato não existe.' });
  f.evidencias ??= [];
  if (req.method === 'POST') {
    const e = await corpoJson(req);
    const relativo = numOuNull(e.relativo);
    if (!String(e.fonte ?? '').trim() || !(String(e.valor ?? '').trim() || relativo != null)) {
      return json(res, 400, { erro: 'A evidência precisa de número (valor ou relativo) e de fonte.' });
    }
    const nova = { tipo: e.tipo || 'benchmark', valor: String(e.valor ?? '').trim(), fonte: String(e.fonte).trim() };
    if (relativo != null) nova.relativo = relativo;
    if (e.data) nova.data = e.data;
    nova.registradaEm = hoje();
    f.evidencias.push(nova);
  } else if (req.method === 'DELETE') {
    // ?i ausente, vazio ou torto não vira 0 (apagaria a evidência da curadoria)
    const bruto = url.searchParams.get('i');
    if (bruto == null || !/^\d+$/.test(bruto)) return json(res, 400, { erro: 'Informe o índice da evidência (?i=N).' });
    const i = Number(bruto);
    if (!f.evidencias[i]) return json(res, 400, { erro: 'Essa evidência não existe.' });
    f.evidencias.splice(i, 1);
  } else return json(res, 405, { erro: 'Método não permitido.' });
  f.atualizadoEm = agora();
  await salvar();
  return json(res, 200, comStatus(db, f));
}

async function rotaInstagram(req, res, acao, url, resto = []) {
  const m = req.method;
  // "Por que esse reel funcionou" (analise.mjs): POST começa, GET devolve fatos, cache e andamento
  if (acao === 'analise') {
    const [midiaId, sub, n] = resto;
    if (sub === 'quadro' && resto.length === 3 && m === 'GET') {
      const img = await analise.quadro(midiaId, n);
      res.writeHead(200, { 'content-type': 'image/webp', 'cache-control': 'private, max-age=3600' });
      return res.end(img);
    }
    if (resto.length !== 1) return json(res, 404, { erro: 'Rota não existe.' });
    if (m === 'GET') return json(res, 200, await analise.ler(midiaId));
    if (m === 'POST') return json(res, 202, await analise.iniciar(midiaId, autor(req)));
    return json(res, 405, { erro: 'Método não permitido.' });
  }
  if (acao === 'dados' && m === 'GET') return json(res, 200, await instagram.dados());
  if (acao === 'token' && m === 'POST') return json(res, 200, await instagram.conectarPorToken((await corpoJson(req)).token));
  if (acao === 'login' && m === 'GET') {
    res.writeHead(302, { location: instagram.urlLogin(), 'cache-control': 'no-store' });
    return res.end();
  }
  if (acao === 'callback' && m === 'GET') {
    try {
      await instagram.callback(url.searchParams);
    } catch (e) {
      console.error('Login do Facebook falhou:', e.message);
      // callback que não veio de um login nosso (state ausente ou desconhecido) não grava nada
      if (!e.silencioso) await instagram.registrarErro(e.message);
    }
    res.writeHead(302, { location: '/#/instagram/metricas', 'cache-control': 'no-store' });
    return res.end();
  }
  if (acao === 'desconectar' && m === 'POST') return json(res, 200, await instagram.desconectar());
  if (acao === 'sincronizar' && m === 'POST') {
    // só o escopo vem da tela: origem 'agenda' (pular quando outra leitura roda) é do servidor
    const r = await instagram.sincronizar({ escopo: (await corpoJson(req)).escopo });
    await metricasRotas.invalidarDiagnostico();
    return json(res, 200, r);
  }
  if (acao === 'para-biblioteca' && m === 'POST') return json(res, 201, await instagram.paraBiblioteca(await corpoJson(req), autor(req)));
  // testa as candidatas de data/referencias-candidatas.json e põe as profissionais com Reels na lista
  if (acao === 'buscar-referencias' && m === 'POST') return json(res, 200, await instagram.buscarReferencias());
  if (acao === 'para-ideia' && m === 'POST') {
    const b = await corpoJson(req);
    // usarAnalise: a adaptação da análise do reel entra na descrição e o porquê nas notas
    const daAnalise = b.usarAnalise ? await analise.paraIdeia(b.midiaId) : null;
    return json(res, 201, await instagram.paraIdeia(b, autor(req), daAnalise));
  }
  return json(res, 404, { erro: 'Rota não existe.' });
}

// versão do front: o arquivo de public/ mudado por último e a hora em que este servidor subiu. A tela aberta compara
// e recarrega sozinha quando a equipe sobe mudança (sem isso, quem estava com a aba aberta seguia vendo a versão
// antiga). 02/10: o reinício também conta. Rota nova só vale depois dele e o /api/estado só é lido de novo ao
// carregar a página: sem a hora, a aba aberta seguia com o estado do servidor antigo (sem "Vídeos prontos") até o F5
const SUBIU_EM = Date.now().toString(36);
let versaoCache = { em: 0, valor: '' };
async function versaoFront() {
  if (Date.now() - versaoCache.em < 5000) return versaoCache.valor;
  let maior = 0;
  const varrer = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await varrer(p);
      else maior = Math.max(maior, (await stat(p)).mtimeMs);
    }
  };
  await varrer(PUBLICO);
  versaoCache = { em: Date.now(), valor: `${Math.round(maior)}-${SUBIU_EM}` };
  return versaoCache.valor;
}

// 21/10: partes = os segmentos depois de "api", já decodificados e conferidos pelo handler (partesDaApi): aqui não se
// recalcula nada, a rota é a mesma que o perfil conferiu
async function api(req, res, url, partes) {
  const [recurso, id, sub] = partes;
  const m = req.method;

  if (recurso === 'auth' && id === 'convite' && partes.length === 2) return convites.rotaConvitePublica(req, res, url, { json, corpoJson });
  if (recurso === 'auth' && partes.length <= 2) return auth.rotaAuth(req, res, id, req.auth, { json, corpoJson });
  // 21/10: Aprovações técnicas (aprovacoes.mjs)
  if (recurso === 'aprovacoes' && partes.length <= 3) return aprovacoes.rota(req, res, id, sub, req.auth, { json, corpoJson });
  // 21/10: arquivos subidos direto nas Aprovações técnicas (envios.mjs). O upload lê o corpo cru, não o corpoJson
  if (recurso === 'envios' && partes.length <= 4) return envios.rota(req, res, partes.slice(1), req.auth, { json, corpoJson });
  if (recurso === 'usuarios' && partes.length <= 3) return convites.rotaUsuarios(req, res, id, sub, req.auth, { json, corpoJson });
  if (recurso === 'convites' && partes.length <= 2) return convites.rotaConvites(req, res, id, req.auth, { json, corpoJson });

  if (recurso === 'estado' && m === 'GET') return json(res, 200, await estado());
  if (recurso === 'versao' && m === 'GET') return json(res, 200, { versao: await versaoFront() });

  // vídeos finais (videos.mjs): as propostas da pasta marketing/final e as peças que apontam pra cada arquivo
  if (recurso === 'videos' && partes.length === 1) {
    if (m !== 'GET') return json(res, 405, { erro: 'Método não permitido.' });
    return json(res, 200, await videos.listar(await carregar()));
  }

  if (recurso === 'config' && m === 'PUT') {
    const db = await carregar();
    const b = Object.fromEntries(Object.entries(await corpoJson(req)).filter(([k]) => CHAVES_CONFIG.includes(k)));
    for (const k of ['nomeUsuario', 'handleInstagram']) {
      if (k in b && b[k] != null && typeof b[k] !== 'string') throw falha(400, `${k} precisa ser texto.`);
    }
    if ('nomeUsuario' in b) b.nomeUsuario = String(b.nomeUsuario ?? '').trim().slice(0, 40) || 'Pedro';
    if ('contasReferencia' in b) {
      b.contasReferencia = listaLimpa(b.contasReferencia, /^@/);
      // quem saiu da lista não volta pelo "Buscar novas referências"
      await instagram.anotarReferenciasRemovidas(db.config.contasReferencia ?? [], b.contasReferencia);
    }
    if ('hashtags' in b) b.hashtags = listaLimpa(b.hashtags, /^#/);
    if ('handleInstagram' in b) b.handleInstagram = String(b.handleInstagram ?? '').trim().replace(/^@/, '');
    if ('metaMensal' in b) b.metaMensal = Math.max(0, Math.round(Number(b.metaMensal) || 0));
    db.config = { ...db.config, ...b };
    await salvar();
    return json(res, 200, db.config);
  }

  // { tipo: viralizacao | vendas | conexao, tema?, formatoId?, quantidade? } (ideias-ia.mjs)
  if (recurso === 'ideias' && id === 'gerar' && m === 'POST') {
    const b = await corpoJson(req);
    const r = await gerarIdeias(b, { autor: autor(req) });
    return json(res, 200, { ...r, ideias: r.ideias.map(ideiaParaTela) });
  }

  if (recurso === 'formatos' && id && sub === 'evidencias') return evidencias(req, res, id, url);

  // "Outra ideia" do detalhe da peça: a opção escolhida vai por id (o texto fica no servidor)
  if (recurso === 'reels' && id && sub === 'outras-ideias' && partes.length <= 4) {
    const usuarioId = req.auth.usuario.id;
    if (partes.length === 3 && m === 'GET') return json(res, 200, outrasIdeias.ler(id, usuarioId));
    if (partes.length === 3 && m === 'POST') return json(res, 202, await outrasIdeias.iniciar(id, usuarioId));
    if (partes[3] === 'usar' && m === 'POST') {
      const b = await corpoJson(req, 10_000);
      if (typeof b.opcao !== 'string' || !b.opcao) throw falha(400, 'Escolha uma das opções.');
      // 21/10 (Pedro): a conta vai junto pra aprovação anotar quem trocou o texto da peça aprovada
      const r = await outrasIdeias.usar(id, b.opcao, { usuarioId, autor: autor(req), usuario: req.auth.usuario });
      return json(res, 200, { reel: reelsParaTela([r.reel])[0], ideia: ideiaParaTela(r.ideia) });
    }
    if (partes[3] && partes[3] !== 'usar') return json(res, 404, { erro: 'Rota não existe.' });
    return json(res, 405, { erro: 'Método não permitido.' });
  }

  if (recurso === 'stories' && id && partes.length <= 3) return rotaStories(req, res, id, sub);

  if (recurso === 'reels' && id === 'lote' && !sub) {
    if (m !== 'POST') return json(res, 405, { erro: 'Método não permitido.' });
    return lote(req, res);
  }

  // 22/10 (Pedro): a peça arrastada do cronograma pro Banco de Ideias, e a volta (banco-ideias.mjs)
  if (recurso === 'reels' && id && sub === 'para-banco' && partes.length === 3) {
    if (m !== 'POST') return json(res, 405, { erro: 'Método não permitido.' });
    const r = await bancoIdeias.paraBanco(id, autor(req) ?? 'Alguém do time');
    return json(res, 200, { ideia: ideiaParaTela(r.ideia), removida: r.removida });
  }
  if (recurso === 'ideias' && id && sub === 'voltar' && partes.length === 3) {
    if (m !== 'POST') return json(res, 405, { erro: 'Método não permitido.' });
    const r = await bancoIdeias.voltar(id, await corpoJson(req, 10_000), autor(req) ?? 'Alguém do time');
    return json(res, 200, { peca: reelsParaTela([r.peca])[0], ideiaRemovida: r.ideiaRemovida });
  }

  // hasOwn: __proto__, constructor e cia. não são coleção (caem no 404)
  if (Object.hasOwn(PREFIXO, recurso) && !sub) return crud(req, res, recurso, id);

  if (recurso === 'campanhas' && id && m === 'PUT') {
    const db = await carregar();
    const c = db.campanhas.find((x) => x.id === id);
    if (!c) return json(res, 404, { erro: 'Essa campanha não existe.' });
    Object.assign(c, semCampos(await corpoJson(req), ['id', ...AUDITORIA]), { atualizadoEm: agora(), atualizadoPor: autor(req) });
    await salvar();
    return json(res, 200, c);
  }

  // POST /api/chat: stream SSE da conversa com a skill
  if (recurso === 'chat' && m === 'POST') {
    const b = await corpoJson(req);
    // reel novo sem dia ou sem tipo: 400 em JSON, antes de abrir o stream
    conferirPedidoChat(b, await carregar());
    res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', connection: 'keep-alive' });
    // aba fechada ou recarregada no meio da resposta: o turno do agente para (não segue gastando).
    // res e não req: req emite 'close' assim que o corpo foi lido
    const ac = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) ac.abort();
    });
    const emitir = (ev) => {
      if (!res.writableEnded && !ac.signal.aborted) res.write(`data: ${JSON.stringify(ev)}\n\n`);
    };
    // pelo túnel da Cloudflare, resposta parada por 100 s cai (524): comentário SSE mantém a linha viva
    res.write(': ok\n\n');
    const pulso = setInterval(() => {
      if (!res.writableEnded && !ac.signal.aborted) res.write(': ping\n\n');
    }, 20_000);
    try {
      // 21/10 (Pedro): a conta vai junto pra aprovação anotar quem trocou o texto pelo chat (salvar_reel)
      await conversar(b, emitir, ac, autor(req), req.auth?.usuario ?? null);
    } catch (e) {
      if (!ac.signal.aborted) emitir({ type: 'error', message: e.message });
    } finally {
      clearInterval(pulso);
    }
    return res.end();
  }

  if (recurso === 'instagram') return rotaInstagram(req, res, id, url, partes.slice(2));
  if (recurso === 'monitoramento') return monitoramento.rota(req, res, partes.slice(1), { json, corpoJson, autor: autor(req) });
  if (recurso === 'metricas') return metricasRotas.rota(req, res, partes.slice(1), { json, corpoJson, autor: autor(req) });
  // 21/10 (Pedro): mecanismo da semana, gerador da semana, sugestões do Google e notícias do dia (rotas-conteudo.mjs)
  if (['mecanismo', 'semana', 'noticias'].includes(recurso)) return rotasConteudo.rota(req, res, partes, req.auth, { json, corpoJson, url });

  return json(res, 404, { erro: 'Rota não existe.' });
}

async function estatico(req, res, url) {
  if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { erro: 'Método não permitido.' });
  let caminho;
  try {
    caminho = decodeURIComponent(url.pathname);
  } catch {
    return json(res, 400, { erro: 'Endereço inválido.' });
  }
  if (caminho.includes('\0')) return json(res, 400, { erro: 'Endereço inválido.' });
  let arquivo = ESTATICOS[caminho];
  if (!arquivo) {
    arquivo = path.resolve(PUBLICO, '.' + (caminho === '/' ? '/index.html' : caminho));
    if (!arquivo.startsWith(PUBLICO + path.sep)) return json(res, 403, { erro: 'Acesso negado.' });
  }
  const conteudo = await readFile(arquivo);
  res.writeHead(200, {
    'content-type': TIPOS[path.extname(arquivo).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-cache',
  });
  res.end(req.method === 'HEAD' ? undefined : conteudo);
}

// navegador abrindo uma página (e não fetch de script, css ou API)
function pedePagina(req, url) {
  if (!['GET', 'HEAD'].includes(req.method)) return false;
  const destino = req.headers['sec-fetch-dest'];
  if (destino) return ['document', 'iframe', 'frame'].includes(destino);
  if (String(req.headers.accept ?? '').includes('text/html')) return true;
  const ext = path.extname(url.pathname).toLowerCase();
  return !ext || ext === '.html';
}

// volta = caminho relativo deste site (nunca //outro-site nem /\outro-site)
function paraEntrar(res, url) {
  let volta = url.pathname + url.search;
  if (!/^\/(?![/\\])/.test(volta) || volta.length > 512 || volta.startsWith('/entrar')) volta = '/';
  res.writeHead(302, { location: `/entrar?volta=${encodeURIComponent(volta)}`, 'cache-control': 'no-store' });
  res.end();
}

// 21/10 (Pedro, segurança): os 30 min do requestTimeout (lá embaixo) são só do upload das Aprovações técnicas, que já
// passou pela sessão e pelo perfil. Todo outro pedido tem PRAZO_CORPO (os 5 min padrão do Node) pra chegar inteiro, ou
// o socket cai: sem isso, quem não tem conta prendia centenas de sockets por 30 min mandando 1 byte de corpo a cada
// poucos segundos no /api/auth/pin ou no /api/auth/entrar. CRONOGRAMA_PRAZO_CORPO (ms) só pro teste
const PRAZO_CORPO = Number(process.env.CRONOGRAMA_PRAZO_CORPO) > 0 ? Number(process.env.CRONOGRAMA_PRAZO_CORPO) : 5 * 60_000;
const PRAZO_PEDIDO = 30 * 60_000;
const UPLOAD = /^POST \/api\/envios\/[^/]+\/arquivos$/;
function prazoDoCorpo(req) {
  const relogio = setTimeout(() => {
    if (!req.complete) req.socket?.destroy();
  }, PRAZO_CORPO);
  relogio.unref();
  const soltar = () => clearTimeout(relogio);
  req.once('end', soltar);
  req.once('close', soltar);
  return soltar;
}

const servidor = http.createServer(async (req, res) => {
  // antes de qualquer await: o relógio do corpo começa junto com o pedido
  const soltarPrazo = prazoDoCorpo(req);
  try {
    auth.cabecalhosSeguranca(req, res);
    const host = auth.hostDe(req);
    if (!auth.hostPermitido(host)) return json(res, 403, { erro: `Endereço não permitido. Abra por http://localhost:${PORTA} ou pelo link público da Gestão de Marketing.` });
    const url = new URL(req.url, `http://${host}`);
    // link público aberto por http://: página sobe pra https, escrita nem é lida (senha em texto claro)
    if (!auth.hostLocal(host) && auth.protocoloVisitante(req) === 'http') {
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 403, { erro: `Use o endereço com https://${host}` });
      res.writeHead(308, { location: `https://${host}${url.pathname}${url.search}`, 'cache-control': 'no-store' });
      return res.end();
    }
    const ehApi = url.pathname.startsWith('/api/');
    // 21/10: o caminho canônico da API, montado uma vez só (auth.partesDaApi). Fora da API vale o pathname
    const partes = ehApi ? auth.partesDaApi(url.pathname) : null;
    if (ehApi && !partes) return json(res, 400, { erro: 'Endereço inválido.' });
    const caminho = ehApi ? `/api/${partes.join('/')}` : url.pathname;
    const pedido = `${req.method} ${caminho}`;
    if (ehApi && !['GET', 'HEAD'].includes(req.method) && !auth.origemPermitida(req)) return json(res, 403, { erro: 'Origem não permitida.' });

    if (ehApi && REMOVIDAS.has(pedido)) return json(res, 410, { erro: REMOVIDAS.get(pedido) });
    req.auth = await auth.sessaoDe(req, res);
    const livre = ehApi
      ? API_PUBLICA.has(pedido)
      : ['GET', 'HEAD'].includes(req.method) && Object.hasOwn(ESTATICOS, url.pathname);
    if (!livre) {
      if (!req.auth) {
        if (!ehApi && pedePagina(req, url)) return paraEntrar(res, url);
        return json(res, 401, { erro: 'Entre com seu usuário e senha pra continuar.' });
      }
      // senha temporária: a API e o vídeo final ficam presos até trocar (auth.mjs)
      if (auth.presoNaSenhaTemporaria(req.auth.usuario, caminho)) {
        return json(res, 403, { erro: 'Troque a senha temporária antes de continuar.', trocarSenha: true });
      }
    }
    // 21/10: perfil (Admin, Gerente de Marketing, Operador, Diretor contábil), pelo caminho canônico. O Diretor só
    // chega nas Aprovações técnicas. Rota livre não passa por aqui (é de todo mundo, com ou sem sessão)
    if (ehApi && req.auth && !livre && !auth.podeApi(req.auth.usuario, req.method, caminho)) {
      return json(res, 403, { erro: auth.motivoNegado(req.auth.usuario, req.method, caminho), perfil: auth.papelDe(req.auth.usuario) });
    }
    // o upload com sessão e perfil conferidos fica com os 30 min do servidor (PRAZO_PEDIDO)
    if (ehApi && req.auth && UPLOAD.test(pedido)) soltarPrazo();
    if (ehApi) return await api(req, res, url, partes);
    // vídeo final: depois do login (a rota não é livre), só de dentro da pasta (videos.mjs confere)
    if (url.pathname.startsWith('/videos/')) return await videos.servir(req, res, url, { json });
    return await estatico(req, res, url);
  } catch (e) {
    if (res.headersSent) return res.end();
    if (e.status) return json(res, e.status, { erro: e.message });
    if (['ENOENT', 'EISDIR', 'ENOTDIR'].includes(e.code)) return json(res, 404, { erro: 'Arquivo não encontrado.' });
    console.error(e);
    // detalhe só pra quem entrou: sem sessão não vê caminho de arquivo
    json(res, 500, { erro: req.auth ? `Erro interno: ${e.message}` : 'Erro interno.' });
  }
});

await carregar(); // migração v1 → v2 e merge da biblioteca antes de aceitar requisição
await auth.preparar();
auth.usuarios(); // usuarios.json ilegível derruba o boot aqui, não no primeiro login
// 21/10: conta de antes dos perfis ganha o dela (pedro = Admin, as outras = Operador)
{
  const n = await auth.garantirPapeis();
  if (n) console.log(`${n} ${n === 1 ? 'conta ganhou' : 'contas ganharam'} perfil (Admin, Operador ou Diretor contábil)`);
}
// 21/10: o pedido inteiro (cabeçalho e corpo) pode levar até 30 min: o arquivo de até 200 MB das Aprovações técnicas
// (envios.mjs) por uma rede lenta passava dos 5 min padrão e o Node cortava no meio. O cabeçalho segue com o limite
// curto de sempre (headersTimeout). 21/10 (Pedro): os 30 min valem só pro upload; o resto cai em PRAZO_CORPO
servidor.requestTimeout = PRAZO_PEDIDO;
servidor.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `A porta ${PORTA} já está em uso. Feche o outro servidor ou defina PORT no .env.` : e.message);
  process.exit(1);
});
// só na máquina local: de fora, só pelo túnel (que entrega em localhost) e com login
servidor.listen(PORTA, '127.0.0.1', () => {
  const publicos = auth.hostsPublicos();
  console.log(`Gestão de Marketing no ar: http://localhost:${PORTA} (dados em ${DATA_DIR})${publicos.length ? ` · público: ${publicos.map((h) => `https://${h}`).join(', ')}` : ''}`);
  if (!auth.usuarios().length) console.log('Nenhuma conta ainda: gere o link de acesso neste computador com npm run usuario convite');
  if (process.env.CRONOGRAMA_AGENDA !== '0') agenda.iniciar();
  // 21/10: dias de stories que já foram ao ar ficam "Postado" (a agenda repete isso de hora em hora)
  storiesMetricas.marcarDiasPostados()
    .then((n) => { if (n) console.log(`${n} ${n === 1 ? 'dia de stories marcado' : 'dias de stories marcados'} como postado`); })
    .catch((e) => console.error('stories postados no boot:', e.message));
});
