// Conector Instagram via Graph API oficial (Facebook Login, host graph.facebook.com).
// Por que Facebook Login e não Instagram Login: só ele tem Business Discovery,
// que é o que lê reels de OUTRAS contas do nicho. Um token, um app.
//
// Conexão, em ordem de preferência:
//  1. token colado (usuário do sistema do Gerenciador de Negócios): POST /api/instagram/token
//  2. OAuth (se META_APP_ID + META_APP_SECRET no .env): /api/instagram/login → callback
//  3. compatível com a v1: IG_ACCESS_TOKEN + IG_USER_ID no .env (metodo "env")
// A credencial mora em data/instagram.json (no .gitignore) e NUNCA vai pro front.
//
// O que dá pra ler (docs Meta em 22/09/2026; nossa conta conferida na API v26.0 em 24/09/2026):
//  - Nossos Reels: views, reach, saved, shares, likes, comments, total_interactions,
//    ig_reels_avg_watch_time, reels_skip_rate. profile_visits e follows a Meta recusa pra Reels.
//  - Nossos posts de feed (foto e carrossel): views, reach, saved, shares, likes, comments,
//    total_interactions, profile_visits, follows.
//  - Conta: follower_count por dia (só os últimos 30 dias, conta com 100+ seguidores).
//  - Não vem de jeito nenhum: impressions (a Meta trocou por views), taxa de conclusão,
//    clique no link da bio por post e qualquer número do Facebook (o Monitoramento pede à mão).
//  - Reels de outra conta Business/Creator: view_count (inclui pago!),
//    like_count, comments_count. Saves, shares e retenção NÃO vêm.
//  - Hashtag: top_media sem views (sem régua), e exige o recurso
//    "Instagram Public Content Access" aprovado no app.
//  - Scraping fora da API viola os Termos do Instagram. Não fazemos.
import { randomBytes } from 'node:crypto';
import {
  carregar, salvar, lerJson, gravarJson, apagarJson, novoId, agora, falha, TRACOS, mesmoPost, conferirTema, conferirTipo, nomeTema,
  roteiroBaseVazio,
} from './db.mjs';

const ARQUIVO = 'instagram.json';
// ads_read: a Meta exige quando a Página chega pelo Gerenciador de Negócios (sempre, no usuário do sistema)
const ESCOPOS = 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement,business_management,ads_read';
const CAMPOS_MIDIA = 'id,caption,media_type,media_product_type,permalink,timestamp,thumbnail_url,media_url,like_count,comments_count,username';
const CAMPOS_CONTA = 'id,username,name,profile_picture_url,followers_count,media_count';
// O que a Graph devolve de insight por mídia nossa muda com o tipo (media_product_type + media_type).
// Esta é a lista pedida; a métrica que a Meta recusar (erro 100 citando o nome dela) sai da lista daquele
// tipo e fica anotada em db.instagram.metricasApi (aceitas, recusadas, em). A lista aceita vale 7 dias
const METRICAS_TIPO = {
  REELS: ['views', 'reach', 'saved', 'shares', 'likes', 'comments', 'total_interactions', 'ig_reels_avg_watch_time', 'reels_skip_rate', 'profile_visits', 'follows'],
  FEED: ['views', 'reach', 'saved', 'shares', 'likes', 'comments', 'total_interactions', 'profile_visits', 'follows'],
  CAROUSEL_ALBUM: ['views', 'reach', 'saved', 'shares', 'likes', 'comments', 'total_interactions', 'profile_visits', 'follows'],
};
const VALIDADE_METRICAS = 7 * 86_400_000;
const tipoInsights = (m) => (m.media_product_type === 'REELS' ? 'REELS' : m.media_type === 'CAROUSEL_ALBUM' ? 'CAROUSEL_ALBUM' : 'FEED');

const versao = () => process.env.IG_GRAPH_VERSION || 'v26.0';
const porta = () => Number(process.env.PORT) || 4317;
// com túnel, a Meta volta pelo endereço público (PUBLIC_URL); sem ele, localhost
function baseUrl() {
  const p = String(process.env.PUBLIC_URL ?? '').trim().replace(/\/+$/, '');
  return /^https?:\/\/[a-z0-9.-]+(:\d{1,5})?$/i.test(p) ? p : `http://localhost:${porta()}`;
}
const redirectUri = () => `${baseUrl()}/api/instagram/callback`;
const appMeta = () => ({
  id: process.env.META_APP_ID ?? '',
  segredo: process.env.META_APP_SECRET ?? '',
  configId: process.env.META_LOGIN_CONFIG_ID ?? '',
});
export const oauthDisponivel = () => Boolean(appMeta().id && appMeta().segredo);

// ---------- credencial ----------

let cred; // undefined = ainda não leu o arquivo; null = sem arquivo
async function credenciais() {
  if (cred === undefined) {
    const salvo = await lerJson(ARQUIVO, null);
    cred = salvo?.token && salvo?.igUserId ? salvo : null;
  }
  if (cred) return cred;
  if (process.env.IG_ACCESS_TOKEN && process.env.IG_USER_ID) {
    return { metodo: 'env', token: process.env.IG_ACCESS_TOKEN, igUserId: process.env.IG_USER_ID, username: '', pageId: '', pageName: '', expiraEm: null };
  }
  return null;
}

// token que a Meta recusou (190) ou que venceu: a conexão conta como caída até conectar de novo.
// O do .env não dá pra reescrever, então a marca dele fica só em memória
let envInvalido = false;
const vencido = (c) => Boolean(c?.expiraEm) && Date.parse(c.expiraEm) <= Date.now();
const invalido = (c) => Boolean(c?.invalido) || (c?.metodo === 'env' && envInvalido);
const MSG_VENCIDO = 'O acesso ao Instagram venceu. Conecte de novo.';

async function marcarTokenRuim(msg) {
  if (cred) {
    cred.invalido = true;
    await gravarJson(ARQUIVO, cred);
  } else envInvalido = true;
  const db = await carregar();
  db.instagram.erros = [msg];
  await salvar();
}

// segredos vivos, pra conferir que nenhum texto gerado pela IA vaza um deles
export async function segredosAtuais() {
  const c = await credenciais();
  return [c?.token, process.env.IG_ACCESS_TOKEN, process.env.META_APP_SECRET].filter((s) => typeof s === 'string' && s.length >= 12);
}

// ---------- Graph API ----------

function erroMeta(e = {}) {
  const code = Number(e.code) || 0;
  const sub = Number(e.error_subcode) || 0;
  let msg;
  if (code === 190) {
    msg = [463, 467].includes(sub)
      ? 'O token expirou. Gere um token novo e conecte de novo.'
      : 'Token inválido ou expirado. Confira se você copiou o token inteiro e, se precisar, gere outro no Gerenciador de Negócios.';
  } else if ([4, 17, 32, 613].includes(code)) {
    msg = 'A Meta limitou as chamadas deste app por agora. Espere alguns minutos e tente de novo.';
  } else if (code === 101) {
    msg = 'O META_APP_ID ou o META_APP_SECRET do .env não confere com o app da Meta. Confira os dois em developers.facebook.com.';
  } else if (code === 100 && /verification code|redirect_uri/i.test(e.message ?? '')) {
    msg = `O código de login expirou ou a URL de redirecionamento não está cadastrada no app da Meta (${redirectUri()}). Tente entrar de novo.`;
  } else if (code === 10 || (code >= 200 && code < 300)) {
    msg = `O token não tem permissão pra isso. Ele precisa de ${ESCOPOS.replaceAll(',', ', ')}.`;
  } else {
    msg = `A Meta recusou o pedido (código ${code || '?'}): ${e.message ?? 'sem detalhe'}`;
  }
  return Object.assign(falha(400, msg), { meta: { code, sub, message: e.message ?? '' } });
}

async function graph(caminho, params = {}, token) {
  const url = new URL(`https://graph.facebook.com/${versao()}/${caminho}`);
  for (const [k, v] of Object.entries(params)) if (v != null && v !== '') url.searchParams.set(k, v);
  if (token) url.searchParams.set('access_token', token);
  let r;
  try {
    r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  } catch (e) {
    throw falha(502, e.name === 'TimeoutError' ? 'A Meta demorou demais pra responder. Tente de novo.' : 'Não consegui falar com a Meta (graph.facebook.com). Confira a internet desta máquina.');
  }
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok || corpo.error) throw erroMeta(corpo.error ?? { code: r.status, message: r.statusText });
  return corpo;
}

const ehTokenRuim = (e) => e?.meta?.code === 190;
// limite de chamadas da Meta (Business Discovery conta por hora): parar de insistir e manter o que já tinha
const ehLimite = (e) => [4, 17, 32, 613].includes(e?.meta?.code) || e?.status === 502;

async function emLotes(xs, n, fn) {
  const saida = new Array(xs.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, xs.length) }, async () => {
      while (i < xs.length) {
        const k = i++;
        saida[k] = await fn(xs[k], k);
      }
    })
  );
  return saida;
}

const mediana = (xs) => {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return 0;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
const relativoDe = (views, med) => (med && Number.isFinite(views) ? +(views / med).toFixed(2) : null);

export { mesmoPost };

// case que já existe pro mesmo post (mesma mídia, mesmo link ou mesmo reel do cronograma)
export function caseDoPost(db, { midiaId, permalink, reelId } = {}, excetoId = null) {
  return db.cases.find(
    (c) =>
      c.id !== excetoId &&
      ((midiaId && c.midiaId && String(c.midiaId) === String(midiaId)) || mesmoPost(c.permalink, permalink) || (reelId && c.reelId === reelId))
  );
}

// URL do vídeo (CDN do Instagram, assinada e com validade): só https; a sincronização renova
const urlVideo = (m) => (/^https:\/\//i.test(m?.media_url ?? '') && m.media_type !== 'IMAGE' ? m.media_url : '');
const semTravessao = (s) => String(s ?? '').replace(TRACOS, ', ');
function resumo(s, n = 80) {
  const linha = semTravessao(String(s ?? '').split('\n').map((l) => l.trim()).find(Boolean) ?? '');
  return linha.length > n ? linha.slice(0, n - 1).trimEnd() + '…' : linha;
}
const fmtN = (n) => (n == null ? 'sem dado de' : Number(n).toLocaleString('pt-BR'));
const fmtRel = (n) => (n == null ? 'sem dado' : `${String(n).replace('.', ',')}×`);

function limparConta(u) {
  const s = String(u ?? '')
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .split(/[/?#]/)[0]
    .toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(s) ? s : null;
}

// ---------- conectar ----------

async function descobrirConta(token) {
  const eu = await graph('me', { fields: 'id,name' }, token);
  let paginas = [];
  try {
    const r = await graph('me/accounts', { fields: `id,name,access_token,instagram_business_account{${CAMPOS_CONTA}}`, limit: '100' }, token);
    paginas = r.data ?? [];
  } catch (e) {
    if (ehTokenRuim(e)) throw e; // token de Página não tem me/accounts: tenta abaixo
  }
  let pagina = paginas.find((p) => p.instagram_business_account);
  let tokenUso = pagina ? pagina.access_token || token : null;
  if (!pagina) {
    // token de Página colado direto
    try {
      const p = await graph('me', { fields: `id,name,instagram_business_account{${CAMPOS_CONTA}}` }, token);
      if (p.instagram_business_account) [pagina, tokenUso] = [p, token];
    } catch (e) {
      if (ehTokenRuim(e)) throw e; // token de usuário: o campo não existe, segue pro erro claro
    }
  }
  if (!pagina) {
    const nomes = paginas.map((p) => p.name).filter(Boolean);
    const comoResolver =
      'No Gerenciador de Negócios, em Usuários do sistema, atribua a Página do Legalizaí e a conta do Instagram a esse usuário e gere o token de novo.';
    throw falha(
      400,
      nomes.length
        ? `O token enxerga ${nomes.length === 1 ? 'a Página' : 'as Páginas'} ${nomes.join(', ')}, mas nenhuma tem conta profissional do Instagram ligada. ${comoResolver}`
        : `O token é válido (${eu.name ?? eu.id}), mas não enxerga nenhuma Página. ${comoResolver}`
    );
  }
  const ig = pagina.instagram_business_account;
  return {
    token: tokenUso,
    igUserId: ig.id,
    username: ig.username ?? '',
    pageId: pagina.id,
    pageName: pagina.name ?? '',
    conta: { ...ig, pageName: pagina.name ?? '' },
  };
}

async function gravarConexao(d, metodo, expiraEm = null) {
  cred = { metodo, token: d.token, igUserId: d.igUserId, username: d.username, pageId: d.pageId, pageName: d.pageName, expiraEm, conectadoEm: agora() };
  envInvalido = false;
  await gravarJson(ARQUIVO, cred);
  const db = await carregar();
  db.instagram.conta = d.conta;
  db.instagram.erros = [];
  if (!db.config.handleInstagram && d.username) db.config.handleInstagram = d.username;
  await salvar();
  return status();
}

export async function conectarPorToken(bruto) {
  const token = String(bruto ?? '').trim().replace(/^Bearer\s+/i, '');
  if (!token) throw falha(400, 'Cole o token de acesso.');
  if (/\s/.test(token) || token.length < 30) throw falha(400, 'Esse texto não parece um token da Meta. Copie o token inteiro, sem espaços.');
  return gravarConexao(await descobrirConta(token), 'token', null);
}

// OAuth: state aleatório vale 10 min, guardado só em memória
const estados = new Map();

export function urlLogin() {
  const m = appMeta();
  if (!oauthDisponivel()) {
    throw falha(400, 'Login com Facebook não configurado. Preencha META_APP_ID e META_APP_SECRET no arquivo .env e reinicie o servidor, ou conecte colando o token do usuário do sistema.');
  }
  const agoraMs = Date.now();
  for (const [k, expira] of estados) if (expira < agoraMs) estados.delete(k);
  const state = randomBytes(24).toString('hex');
  estados.set(state, agoraMs + 10 * 60 * 1000);
  const u = new URL(`https://www.facebook.com/${versao()}/dialog/oauth`);
  u.searchParams.set('client_id', m.id);
  u.searchParams.set('redirect_uri', redirectUri());
  u.searchParams.set('state', state);
  u.searchParams.set('response_type', 'code');
  if (m.configId) u.searchParams.set('config_id', m.configId);
  else u.searchParams.set('scope', ESCOPOS);
  return u.toString();
}

const CODIGO_META = /^[a-z_]{1,40}$/;

// A rota é GET (qualquer site consegue abrir): o state é conferido ANTES de ler qualquer outro
// parâmetro, e o texto que a Meta (ou quem forjou a URL) manda nunca é gravado.
// Erro com silencioso: true não vai pra tela (não veio de um login nosso).
export async function callback(params) {
  const m = appMeta();
  const state = params.get('state') ?? '';
  const expira = state ? estados.get(state) : undefined;
  estados.delete(state);
  if (!oauthDisponivel() || !expira) {
    throw Object.assign(falha(400, 'Callback de login ignorado (state ausente ou desconhecido).'), { silencioso: true });
  }
  // state nosso, mas vencido: só quem começou o login aqui tem esse valor
  if (expira < Date.now()) throw falha(400, 'O login expirou. Clique em Entrar com Facebook de novo.');
  const erro = params.get('error');
  if (erro) {
    if (params.get('error_reason') === 'user_denied') throw falha(400, 'Você cancelou o login com o Facebook.');
    throw falha(400, `O Facebook recusou o login (código ${CODIGO_META.test(erro) ? erro : 'desconhecido'}). Tente entrar com o Facebook de novo.`);
  }
  const code = params.get('code');
  if (!code) throw falha(400, 'O Facebook não devolveu o código de login.');
  const curto = await graph('oauth/access_token', { client_id: m.id, client_secret: m.segredo, redirect_uri: redirectUri(), code });
  const longo = await graph('oauth/access_token', { grant_type: 'fb_exchange_token', client_id: m.id, client_secret: m.segredo, fb_exchange_token: curto.access_token });
  const d = await descobrirConta(longo.access_token);
  // token de Página tirado de um token longo não expira; o de usuário vence em ~60 dias
  const expiraEm = d.token === longo.access_token && longo.expires_in ? new Date(Date.now() + longo.expires_in * 1000).toISOString() : null;
  return gravarConexao(d, 'oauth', expiraEm);
}

export async function registrarErro(mensagem) {
  const db = await carregar();
  db.instagram.erros = [mensagem];
  await salvar();
}

export async function desconectar() {
  await apagarJson(ARQUIVO);
  cred = null;
  const db = await carregar();
  db.instagram.conta = null;
  await salvar();
  const s = await status();
  if (s.metodo === 'env') s.aviso = 'O arquivo .env ainda tem IG_ACCESS_TOKEN e IG_USER_ID. Apague as duas linhas e reinicie pra desconectar de vez.';
  return s;
}

// o que o front pode ver: nunca o token
export async function status() {
  const c = await credenciais();
  const db = await carregar();
  const ig = db.instagram ?? {};
  const expirado = vencido(c);
  const ruim = invalido(c);
  const erros = ig.erros ?? [];
  return {
    conectado: Boolean(c) && !expirado && !ruim,
    metodo: c?.metodo ?? null,
    conta: c ? { ...(ig.conta ?? {}), username: ig.conta?.username || c.username || '', pageName: ig.conta?.pageName || c.pageName || '' } : null,
    oauthDisponivel: oauthDisponivel(),
    versao: versao(),
    expiraEm: c?.expiraEm ?? null,
    expirado,
    invalido: ruim,
    sincronizadoEm: ig.sincronizadoEm ?? null,
    erros: expirado && !erros.length ? [MSG_VENCIDO] : erros,
  };
}

export async function dados() {
  const ig = (await carregar()).instagram ?? {};
  return {
    conta: ig.conta ?? null,
    proprios: ig.proprios ?? [],
    inspiracoes: ig.inspiracoes ?? [],
    contas: ig.contas ?? [],
    sincronizadoEm: ig.sincronizadoEm ?? null,
    erros: ig.erros ?? [],
  };
}

// ---------- sincronizar ----------

// ---------- nossa conta: histórico inteiro ----------
// A sincronização pagina TODAS as mídias da conta (Reels em ig.proprios; foto e carrossel em
// ig.postsProprios, pro Monitoramento) e junta com o cache: post que a Meta não listou mais continua
// aqui (naoListado: true quando a paginação chegou ao fim). Insight custa uma chamada por mídia, então
// só relê o que ainda mexe: posts dos últimos 90 dias, os que nunca foram lidos, os que deram erro e os
// lidos há mais de 30 dias. O resto fica com o número do cache (a mídia em si é relida: link do vídeo novo)

const TETO_PAGINAS = 50; // 5.000 mídias: trava contra laço infinito, não é limite de uso
const REGUA = 100; // a mediana (a régua do "×") usa os 100 reels mais recentes, como antes
const JANELA_INSIGHTS = 90 * 86_400_000;
const RELER_INSIGHTS = 30 * 86_400_000;
const msDe = (ts) => Date.parse(String(ts ?? '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2')) || 0;

// nome de métrica citado no erro 100 da Meta ("does not support the follows metric", ou a lista
// "must be one of the following values: a, b, c"): o que sair daqui deixa de ser pedido pra esse tipo
export function metricasRecusadas(msg, lista) {
  const t = String(msg ?? '');
  const valores = /one of the following values:\s*([a-z_,\s]+)/i.exec(t);
  if (valores) {
    const ok = new Set(valores[1].split(',').map((s) => s.trim()).filter(Boolean));
    return lista.filter((x) => !ok.has(x));
  }
  return lista.filter((x) => new RegExp(`(^|[^a-z_])${x}([^a-z_]|$)`, 'i').test(t));
}

function metricasIniciais(salvo = {}) {
  const aceitas = {};
  const recusadas = {};
  for (const [tipo, lista] of Object.entries(METRICAS_TIPO)) {
    const s = salvo?.[tipo];
    const fresco = s?.em && Date.now() - Date.parse(s.em) < VALIDADE_METRICAS && Array.isArray(s.aceitas) && s.aceitas.length;
    aceitas[tipo] = fresco ? lista.filter((x) => s.aceitas.includes(x)) : [...lista];
    recusadas[tipo] = new Set(fresco ? s.recusadas ?? [] : []);
  }
  return { aceitas, recusadas, confirmadas: new Set() };
}

function metricasParaGravar(estado, salvo = {}) {
  const saida = { ...(salvo ?? {}) };
  for (const tipo of estado.confirmadas) {
    saida[tipo] = { aceitas: estado.aceitas[tipo], recusadas: [...estado.recusadas[tipo]], em: agora() };
  }
  return saida;
}

async function insightsDe(id, tipo, estado, token) {
  for (let i = 0; i < 8; i++) {
    const lista = estado.aceitas[tipo];
    if (!lista.length) return {};
    try {
      const r = await graph(`${id}/insights`, { metric: lista.join(',') }, token);
      estado.confirmadas.add(tipo);
      const o = {};
      for (const x of r.data ?? []) {
        const v = x.values?.[0]?.value ?? x.total_value?.value;
        o[x.name] = typeof v === 'number' ? v : null;
      }
      return o;
    } catch (e) {
      if (e.meta?.code !== 100) throw e;
      const fora = metricasRecusadas(e.meta.message, lista);
      if (!fora.length) throw e;
      estado.aceitas[tipo] = lista.filter((x) => !fora.includes(x));
      for (const x of fora) estado.recusadas[tipo].add(x);
    }
  }
  throw falha(502, 'A Meta recusou as métricas desta mídia.');
}

const precisaInsights = (m, velho) =>
  !velho?.insightsEm || Boolean(velho.erro) || Date.now() - msDe(m.timestamp) <= JANELA_INSIGHTS || Date.now() - Date.parse(velho.insightsEm) > RELER_INSIGHTS;

// ins null: sem leitura nova de insight (fica o número do cache; curtidas e comentários vêm da mídia)
function itemProprio(m, ins, velho, tipo, username, erro) {
  const v = velho ?? {};
  const de = (k, antigo) => (ins ? ins[k] ?? null : v[antigo] ?? null);
  const imagem = m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM';
  return {
    midiaId: m.id,
    conta: m.username ?? username ?? v.conta ?? '',
    origem: 'nosso',
    tipo,
    permalink: m.permalink ?? v.permalink ?? '',
    caption: m.caption ?? '',
    timestamp: m.timestamp ?? v.timestamp ?? null,
    thumb: m.thumbnail_url ?? (imagem && /^https:\/\//i.test(m.media_url ?? '') ? m.media_url : '') ?? '',
    video: urlVideo(m),
    views: de('views', 'views'),
    reach: de('reach', 'reach'),
    saved: de('saved', 'saved'),
    shares: de('shares', 'shares'),
    likes: ins?.likes ?? m.like_count ?? v.likes ?? null,
    comments: ins?.comments ?? m.comments_count ?? v.comments ?? null,
    interacoes: de('total_interactions', 'interacoes'),
    avgWatchMs: de('ig_reels_avg_watch_time', 'avgWatchMs'),
    skipRate: de('reels_skip_rate', 'skipRate'),
    profileVisits: de('profile_visits', 'profileVisits'),
    follows: de('follows', 'follows'),
    insightsEm: ins ? agora() : v.insightsEm ?? null,
    relativo: null,
    semRegua: false,
    caseId: v.caseId ?? null,
    ...(erro ? { erro } : {}),
  };
}

// seguidores novos por dia (follower_count, só os últimos 30 dias e só conta com 100+ seguidores).
// end_time vem à meia-noite do Pacífico do dia seguinte: 12h antes cai no dia certo
async function lerDiario(c, anterior = {}) {
  const ate = Math.floor(Date.now() / 1000);
  const r = await graph(`${c.igUserId}/insights`, { metric: 'follower_count', period: 'day', since: String(ate - 29 * 86_400), until: String(ate) }, c.token);
  const diario = { ...(anterior ?? {}) };
  for (const x of r.data ?? []) {
    for (const v of x.values ?? []) {
      const ms = msDe(v.end_time);
      if (typeof v.value !== 'number' || !ms) continue;
      const dia = new Date(ms - 12 * 3_600_000).toISOString().slice(0, 10);
      diario[dia] = { ...(diario[dia] ?? {}), seguidores: v.value };
    }
  }
  return diario;
}

async function lerProprios(c, ig) {
  const conta = await graph(c.igUserId, { fields: CAMPOS_CONTA }, c.token);
  // pagina pelo cursor com graph() (mesmo host, mesmo token, mesmo tratamento de erro);
  // a URL pronta de paging.next traz o token embutido e não é seguida
  const midias = [];
  let after;
  let paginas = 0;
  do {
    const lista = await graph(`${c.igUserId}/media`, { fields: CAMPOS_MIDIA, limit: '100', after }, c.token);
    midias.push(...(lista.data ?? []).filter((m) => m?.id));
    after = lista.paging?.next ? lista.paging?.cursors?.after : undefined;
  } while (after && ++paginas < TETO_PAGINAS);
  const completo = !after;

  const cache = new Map([...(ig.proprios ?? []), ...(ig.postsProprios ?? [])].filter((x) => x?.midiaId).map((x) => [String(x.midiaId), x]));
  const estado = metricasIniciais(ig.metricasApi);
  let limitado = null;
  let erros = 0;
  const ler = async (m) => {
    const velho = cache.get(String(m.id));
    const tipo = tipoInsights(m);
    if (limitado || !precisaInsights(m, velho)) return itemProprio(m, null, velho, tipo, conta.username);
    try {
      return itemProprio(m, await insightsDe(m.id, tipo, estado, c.token), velho, tipo, conta.username);
    } catch (e) {
      if (ehTokenRuim(e)) throw e;
      if (ehLimite(e)) limitado ??= e.message;
      erros++;
      return itemProprio(m, null, velho, tipo, conta.username, e.message); // o número do cache fica
    }
  };
  // o primeiro de cada tipo vai sozinho (é ele que descobre as métricas aceitas); o resto, 5 por vez
  const lidos = new Map();
  const primeiros = new Map();
  for (const m of midias) if (precisaInsights(m, cache.get(String(m.id))) && !primeiros.has(tipoInsights(m))) primeiros.set(tipoInsights(m), m);
  for (const m of primeiros.values()) lidos.set(m.id, await ler(m));
  const resto = midias.filter((m) => !lidos.has(m.id));
  (await emLotes(resto, 5, ler)).forEach((x, i) => lidos.set(resto[i].id, x));

  const vistos = new Set(midias.map((m) => String(m.id)));
  const guardados = [...cache.values()]
    .filter((x) => !vistos.has(String(x.midiaId)))
    .map((x) => ({ ...x, tipo: x.tipo ?? 'REELS', ...(completo ? { naoListado: true } : {}) }));
  const porData = (a, b) => msDe(b.timestamp) - msDe(a.timestamp);
  const todos = [...midias.map((m) => lidos.get(m.id)), ...guardados].sort(porData);
  const reels = todos.filter((x) => x.tipo === 'REELS');
  const posts = todos.filter((x) => x.tipo !== 'REELS');

  // a régua é recente: os 100 reels mais novos que a Meta ainda lista. Fora dela, antigo: true
  // (analise.mjs deixa esses fora da mediana, igual ao "×" daqui)
  const regua = reels.filter((x) => !x.naoListado).slice(0, REGUA);
  const naRegua = new Set(regua.map((x) => x.midiaId));
  const med = mediana(regua.map((x) => x.views));
  for (const x of reels) {
    x.relativo = relativoDe(x.views, med);
    x.semRegua = x.relativo == null;
    if (naRegua.has(x.midiaId)) delete x.antigo;
    else x.antigo = true;
  }

  let diario = ig.diario ?? {};
  const avisos = [];
  if (!limitado) {
    try {
      diario = await lerDiario(c, diario);
      estado.confirmadas.add('CONTA');
      estado.aceitas.CONTA = ['follower_count'];
      estado.recusadas.CONTA = new Set();
    } catch (e) {
      if (ehTokenRuim(e)) throw e;
      if (ehLimite(e)) limitado ??= e.message;
      else {
        estado.confirmadas.add('CONTA');
        estado.aceitas.CONTA = [];
        estado.recusadas.CONTA = new Set(['follower_count']);
      }
    }
  }
  if (limitado) avisos.push(`${limitado} Parte dos números ficou com a leitura anterior.`);
  else if (erros) avisos.push(`A Meta não devolveu os números de ${erros === 1 ? '1 post' : `${erros} posts`}: ficou a leitura anterior.`);

  return {
    conta: { ...conta, pageName: c.pageName ?? '' },
    reels,
    posts,
    mediana: med,
    diario,
    metricasApi: metricasParaGravar(estado, ig.metricasApi),
    avisos,
  };
}

async function lerConta(c, u) {
  const midia = (campos) =>
    `business_discovery.username(${u}){username,name,profile_picture_url,followers_count,media_count,media.limit(50){${campos}}}`;
  let r;
  try {
    r = await graph(c.igUserId, { fields: midia('id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,view_count,thumbnail_url,media_url') }, c.token);
  } catch (e) {
    if (e.meta?.code !== 100 || /business|user/i.test(e.meta.message)) throw e;
    // versão da API sem view_count/thumbnail_url no Business Discovery: lê sem régua
    r = await graph(c.igUserId, { fields: midia('id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,media_url') }, c.token);
  }
  const bd = r.business_discovery ?? {};
  const reels = (bd.media?.data ?? []).filter((m) => m.media_product_type === 'REELS');
  const med = mediana(reels.map((m) => m.view_count));
  return {
    conta: { username: bd.username ?? u, name: bd.name ?? '', profile_picture_url: bd.profile_picture_url ?? '', followers_count: bd.followers_count ?? null, media_count: bd.media_count ?? null, medianaViews: med || null },
    itens: reels.map((m) => {
      const relativo = relativoDe(m.view_count, med);
      return {
        midiaId: m.id,
        conta: bd.username ?? u,
        origem: 'nicho',
        permalink: m.permalink ?? '',
        caption: m.caption ?? '',
        timestamp: m.timestamp ?? null,
        thumb: m.thumbnail_url ?? '',
        video: urlVideo(m),
        views: m.view_count ?? null,
        reach: null,
        saved: null,
        shares: null,
        likes: m.like_count ?? null,
        comments: m.comments_count ?? null,
        relativo,
        semRegua: relativo == null,
        caseId: null,
      };
    }),
  };
}

function explicarErroConta(e) {
  const t = `${e.meta?.message ?? ''} ${e.message}`;
  if (e.meta?.code === 110 || /cannot find|not found|business discovery|invalid user/i.test(t)) {
    return 'não achei essa conta ou ela não é profissional (Business ou Creator). A API só lê contas profissionais.';
  }
  return e.message;
}

function ehSemPermissaoHashtag(e) {
  const code = e.meta?.code;
  return code === 10 || code === 24 || (code >= 200 && code < 300) || /public content|permission|feature/i.test(e.meta?.message ?? '');
}

// anterior: o cache da leitura passada. Conta que não deu pra ler agora por limite da Meta ou rede
// fica com os reels da leitura anterior (a tela não esvazia); a próxima sincronização renova
async function lerInspiracoes(c, config, anterior = {}) {
  const itens = [];
  const contas = [];
  const erros = [];
  const vistos = new Set();
  let limitado = null;
  const mantidas = [];
  // 3 contas por vez (dezenas de referências); o resultado entra na ordem da lista
  const lidas = await emLotes(config.contasReferencia ?? [], 3, async (bruto) => {
    const u = limparConta(bruto);
    if (!u) return { erro: `@${bruto}: nome de usuário inválido` };
    if (limitado) return { manter: u };
    try {
      return await lerConta(c, u);
    } catch (e) {
      if (ehTokenRuim(e)) throw e;
      if (ehLimite(e)) {
        limitado ??= e.message;
        return { manter: u };
      }
      return { erro: `@${u}: ${explicarErroConta(e)}` };
    }
  });
  for (const r of lidas) {
    if (r.erro) {
      erros.push(r.erro);
      continue;
    }
    if (r.manter) {
      const velhos = (anterior.itens ?? []).filter((x) => x.conta === r.manter && x.origem !== 'hashtag');
      const conta = (anterior.contas ?? []).find((x) => x.username === r.manter);
      if (conta) contas.push(conta);
      for (const x of velhos) if (!vistos.has(x.midiaId)) vistos.add(x.midiaId), itens.push(x);
      mantidas.push(r.manter);
      continue;
    }
    contas.push(r.conta);
    for (const x of r.itens) if (!vistos.has(x.midiaId)) vistos.add(x.midiaId), itens.push(x);
  }
  if (mantidas.length) {
    erros.push(
      `${limitado} ${mantidas.length === 1 ? '1 conta ficou' : `${mantidas.length} contas ficaram`} com a leitura anterior (${mantidas.map((u) => `@${u}`).join(', ')}). A Meta libera de novo em até uma hora.`
    );
  }
  for (const bruto of config.hashtags ?? []) {
    const tag = String(bruto ?? '').trim().replace(/^#/, '').toLowerCase();
    if (!/^[\p{L}\p{N}_]{1,100}$/u.test(tag)) {
      erros.push(`#${bruto}: hashtag inválida`);
      continue;
    }
    try {
      const busca = await graph('ig_hashtag_search', { user_id: c.igUserId, q: tag }, c.token);
      const hid = busca.data?.[0]?.id;
      if (!hid) {
        erros.push(`#${tag}: a Meta não achou essa hashtag`);
        continue;
      }
      const top = await graph(`${hid}/top_media`, { user_id: c.igUserId, fields: 'id,caption,media_type,permalink,timestamp,like_count,comments_count,media_url', limit: '25' }, c.token);
      for (const m of top.data ?? []) {
        if (m.media_type !== 'VIDEO' || vistos.has(m.id)) continue;
        vistos.add(m.id);
        itens.push({
          midiaId: m.id, conta: '', origem: 'hashtag', hashtag: tag, permalink: m.permalink ?? '', caption: m.caption ?? '',
          timestamp: m.timestamp ?? null, thumb: '', video: urlVideo(m), views: null, reach: null, saved: null, shares: null,
          likes: m.like_count ?? null, comments: m.comments_count ?? null, relativo: null, semRegua: true, caseId: null,
        });
      }
    } catch (e) {
      if (ehTokenRuim(e)) throw e;
      erros.push(
        ehSemPermissaoHashtag(e)
          ? `#${tag}: a busca por hashtag exige o recurso "Instagram Public Content Access" aprovado no app da Meta. As contas de referência continuam funcionando.`
          : `#${tag}: ${e.message}`
      );
    }
  }
  return { itens, contas, erros };
}

export async function sincronizar({ escopo = 'tudo' } = {}) {
  if (!['proprios', 'inspiracoes', 'tudo'].includes(escopo)) throw falha(400, 'escopo precisa ser proprios, inspiracoes ou tudo');
  const c = await credencialPronta();
  try {
    return await sincronizarCom(c, escopo);
  } catch (e) {
    // token recusado (190) fica registrado: a tela mostra o aviso e o formulário de conectar
    if (ehTokenRuim(e)) await marcarTokenRuim(e.message);
    throw e;
  }
}

async function sincronizarCom(c, escopo) {
  const db = await carregar();
  const ig = db.instagram;
  const erros = [];

  if (escopo !== 'inspiracoes') {
    try {
      // junta com o cache: nada do histórico sai; falha no meio não mexe no que já tinha
      const r = await lerProprios(c, ig);
      ig.conta = r.conta;
      ig.proprios = r.reels;
      ig.postsProprios = r.posts;
      ig.medianaPropria = r.mediana;
      ig.diario = r.diario;
      ig.metricasApi = r.metricasApi;
      erros.push(...r.avisos.map((a) => `Nossa conta: ${a}`));
    } catch (e) {
      if (escopo === 'proprios' || ehTokenRuim(e)) throw e;
      erros.push(`Nossa conta: ${e.message}`);
    }
  }
  if (escopo !== 'proprios') {
    const r = await lerInspiracoes(c, db.config, { itens: ig.inspiracoes, contas: ig.contas });
    ig.inspiracoes = r.itens;
    ig.contas = r.contas;
    erros.push(...r.erros);
  }

  // case já criado continua ligado à mídia (pelo id ou pelo link) e ganha os números novos
  for (const x of [...ig.proprios, ...ig.inspiracoes]) {
    const cs = caseDoPost(db, { midiaId: x.midiaId, permalink: x.permalink });
    x.caseId = cs?.id ?? null;
    if (!cs) continue;
    if (!cs.midiaId) cs.midiaId = x.midiaId;
    if (x.views != null) {
      Object.assign(cs, { views: x.views, likes: x.likes, comments: x.comments, saved: x.saved ?? cs.saved, shares: x.shares ?? cs.shares, relativo: x.relativo });
      if (!cs.thumb && x.thumb) cs.thumb = x.thumb;
    }
  }

  ig.sincronizadoEm = agora();
  ig.erros = erros;

  // item do cronograma com permalink ganha as métricas reais (com a mídia, pra virar case certo).
  // Carrossel e estático do calendário casam com os posts de feed
  const nossas = [...(ig.proprios ?? []), ...(ig.postsProprios ?? [])];
  for (const reel of db.reels) {
    const m = reel.permalink && nossas.find((x) => mesmoPost(x.permalink, reel.permalink));
    if (m) {
      reel.metricas = {
        midiaId: m.midiaId, thumb: m.thumb ?? '', timestamp: m.timestamp ?? '',
        views: m.views, reach: m.reach, saved: m.saved, shares: m.shares, likes: m.likes, comments: m.comments, relativo: m.relativo, em: ig.sincronizadoEm,
      };
    }
  }
  await salvar();
  return dados();
}

// ---------- referências automáticas ----------
// A API não tem busca por nicho. A lista de candidatas (data/referencias-candidatas.json) foi
// montada por pesquisa na web: contas brasileiras que postam Reels de contabilidade, MEI, CNPJ,
// impostos e pequenos negócios. "Buscar novas referências" testa cada candidata que ainda não está
// na lista pelo Business Discovery (só conta profissional devolve dado) e entra quem tem Reels.
// Conta que alguém tirou da lista fica marcada como descartada e não volta sozinha.
const CANDIDATAS = 'referencias-candidatas.json';

async function lerCandidatas() {
  const bruto = await lerJson(CANDIDATAS, null);
  const lista = Array.isArray(bruto) ? bruto : Array.isArray(bruto?.candidatas) ? bruto.candidatas : [];
  return { meta: bruto && !Array.isArray(bruto) ? bruto : {}, lista: lista.filter((x) => limparConta(x?.handle)) };
}

async function gravarCandidatas(meta, lista) {
  await gravarJson(CANDIDATAS, { ...meta, atualizadoEm: agora(), candidatas: lista });
}

// uma chamada leve por conta: perfil + tipo das últimas 30 mídias (pra saber se posta Reels)
export async function validarConta(c, u) {
  try {
    const r = await graph(
      c.igUserId,
      { fields: `business_discovery.username(${u}){username,followers_count,media_count,media.limit(30){media_product_type,timestamp}}` },
      c.token
    );
    const bd = r.business_discovery ?? {};
    const reels = (bd.media?.data ?? []).filter((m) => m.media_product_type === 'REELS');
    if (!reels.length) return { ok: false, motivo: 'não tem Reels entre as últimas publicações' };
    return { ok: true, username: bd.username ?? u, seguidores: bd.followers_count ?? null, reels: reels.length };
  } catch (e) {
    if (ehTokenRuim(e)) throw e;
    if (ehLimite(e)) return { ok: false, limite: true, motivo: e.message };
    return { ok: false, motivo: explicarErroConta(e) };
  }
}

async function credencialPronta() {
  const c = await credenciais();
  if (!c) throw falha(400, 'Instagram não conectado. Em Métricas, cole o token do usuário do sistema ou entre com o Facebook.');
  if (vencido(c)) throw falha(400, MSG_VENCIDO);
  if (invalido(c)) throw falha(400, 'A Meta recusou o token da última vez. Desconecte e conecte de novo com um token novo.');
  return c;
}

export async function buscarReferencias() {
  const c = await credencialPronta();
  const { meta, lista } = await lerCandidatas();
  if (!lista.length) throw falha(400, 'A lista de candidatas (data/referencias-candidatas.json) está vazia.');
  const db = await carregar();
  const atuais = new Set((db.config.contasReferencia ?? []).map(limparConta).filter(Boolean));
  const testar = lista.filter((x) => !x.descartada && !atuais.has(limparConta(x.handle)));
  const inicio = agora();
  const adicionadas = [];
  const recusadas = [];
  let limitado = null;
  try {
    await emLotes(testar, 3, async (x) => {
      if (limitado) return;
      const u = limparConta(x.handle);
      const r = await validarConta(c, u);
      if (r.limite) {
        limitado ??= r.motivo;
        return; // não marca nada: tenta de novo na próxima busca
      }
      x.verificadoEm = agora();
      x.validado = r.ok;
      if (r.ok) {
        x.seguidores = r.seguidores;
        delete x.erro;
        adicionadas.push(u);
      } else {
        x.erro = r.motivo;
        recusadas.push({ handle: u, motivo: r.motivo });
      }
    });
  } catch (e) {
    if (ehTokenRuim(e)) await marcarTokenRuim(e.message);
    throw e;
  } finally {
    await gravarCandidatas(meta, lista);
  }
  // a ordem da lista de candidatas vale (as maiores primeiro)
  const novas = lista.map((x) => limparConta(x.handle)).filter((u) => adicionadas.includes(u));
  if (novas.length) {
    db.config.contasReferencia = [...(db.config.contasReferencia ?? []), ...novas];
    await salvar();
  }
  const pendentes = testar.filter((x) => !x.verificadoEm || x.verificadoEm < inicio).length;
  return {
    limitado,
    pendentes: limitado ? pendentes : 0,
    testadas: testar.length - (limitado ? pendentes : 0),
    adicionadas: novas,
    recusadas,
    jaNaLista: lista.length - testar.length,
    contasReferencia: db.config.contasReferencia ?? [],
  };
}

// chamada pelo PUT /api/config: conta que saiu da lista vira descartada nas candidatas
export async function anotarReferenciasRemovidas(antes = [], depois = []) {
  const fica = new Set(depois.map(limparConta).filter(Boolean));
  const saiu = new Set(antes.map(limparConta).filter((u) => u && !fica.has(u)));
  const { meta, lista } = await lerCandidatas();
  let mudou = false;
  for (const x of lista) {
    const u = limparConta(x.handle);
    if (saiu.has(u) && !x.descartada) (x.descartada = true), (mudou = true);
    else if (fica.has(u) && x.descartada) (x.descartada = false), (mudou = true);
  }
  if (mudou) await gravarCandidatas(meta, lista);
}

// ---------- ações sobre a mídia ----------

function acharMidia(db, midiaId) {
  const ig = db.instagram ?? {};
  return [...(ig.proprios ?? []), ...(ig.inspiracoes ?? [])].find((x) => x.midiaId === String(midiaId ?? ''));
}

// autor: nome de quem está logado (criadoPor / atualizadoPor), vem do servidor
export async function paraBiblioteca({ midiaId, formatoId } = {}, autor = null) {
  const db = await carregar();
  const item = acharMidia(db, midiaId);
  if (!item) throw falha(404, 'Essa mídia não está no cache. Sincronize de novo.');
  if (!db.formatos.some((f) => f.id === formatoId)) throw falha(400, 'Escolha um formato da biblioteca.');
  const reel = db.reels.find((r) => mesmoPost(r.permalink, item.permalink));
  // o mesmo post nunca vira dois cases (um reel só não valida formato): se já existe, reclassifica
  const existente =
    (item.caseId && db.cases.find((x) => x.id === item.caseId)) ||
    caseDoPost(db, { midiaId: item.midiaId, permalink: item.permalink, reelId: reel?.id });
  if (existente) {
    Object.assign(existente, { formatoId, atualizadoEm: agora(), atualizadoPor: autor });
    existente.midiaId ??= item.midiaId;
    item.caseId = existente.id;
    await salvar();
    return existente;
  }
  const quem = item.conta ? `@${item.conta}` : `#${item.hashtag}`;
  // legenda de outra conta é texto de terceiro: não vira título (o título entra no prompt da IA);
  // fica só nas notas. A nossa legenda é nossa e pode dar nome ao case
  const legenda = resumo(item.caption, 280);
  const nosso = item.origem === 'nosso';
  const novo = {
    id: novoId('case'),
    formatoId,
    titulo: nosso ? reel?.ideia || resumo(item.caption) || `Reel de ${quem}` : `Reel de ${quem}`,
    conta: item.conta ?? '',
    origem: nosso ? 'nosso' : 'nicho',
    permalink: item.permalink ?? '',
    thumb: item.thumb ?? '',
    views: item.views ?? null,
    likes: item.likes ?? null,
    comments: item.comments ?? null,
    saved: item.saved ?? null,
    shares: item.shares ?? null,
    relativo: item.semRegua ? null : item.relativo ?? null,
    data: item.timestamp?.slice(0, 10) ?? '',
    notas: [
      item.origem === 'hashtag' ? `Veio da hashtag #${item.hashtag}, sem views: não conta pra validar o formato.` : '',
      !nosso && legenda ? `Legenda original: ${legenda}` : '',
    ].filter(Boolean).join('\n'),
    midiaId: item.midiaId,
    reelId: reel?.id ?? null,
    criadoEm: agora(),
    criadoPor: autor,
  };
  db.cases.push(novo);
  item.caseId = novo.id;
  await salvar();
  return novo;
}

// tema: id de um tema do nicho, "app" ou o antigo "fator-r" (vira tm_fator_r); pode vir vazio. tipo opcional
// daAnalise (opcional, de analise.mjs): { descricao, gancho, notas, formatoId } da análise do reel
export async function paraIdeia({ midiaId, tema, tipo, formatoId } = {}, autor = null, daAnalise = null) {
  const db = await carregar();
  tema = conferirTema(tema);
  tipo = conferirTipo(tipo);
  const alvo = tema === 'app' ? 'pro jeito fácil de usar o app' : tema ? `pro tema "${nomeTema(tema)}"` : 'pro nicho contábil do Legalizaí';
  const item = acharMidia(db, midiaId);
  if (!item) throw falha(404, 'Essa mídia não está no cache. Sincronize de novo.');
  const quem = item.conta ? `@${item.conta}` : `#${item.hashtag}`;
  const numeros =
    item.views != null
      ? `${fmtN(item.views)} views${item.relativo != null ? `, ${fmtRel(item.relativo)} a mediana da conta` : ''}`
      : `${fmtN(item.likes)} curtidas`;
  const doCase = item.caseId && db.cases.find((x) => x.id === item.caseId)?.formatoId;
  // a legenda é de terceiro: fica só em referencia.legenda, nunca no título (que entra no prompt da IA)
  const legenda = resumo(item.caption, 280);
  const ideia = {
    id: novoId('ide'),
    titulo: `Inspirado em ${quem}`,
    descricao: daAnalise?.descricao
      ? semTravessao(`${daAnalise.descricao}

Inspirado num reel de ${quem} (${numeros}). Adapte ${alvo}, sem copiar a fala.`).slice(0, 2000)
      : `Inspirado num reel de ${quem} (${numeros}). Adapte a estrutura ${alvo}, sem copiar a fala.`,
    tipo,
    tema,
    formatoId: db.formatos.some((f) => f.id === formatoId) ? formatoId : doCase || (db.formatos.some((f) => f.id === daAnalise?.formatoId) ? daAnalise.formatoId : null),
    publico: 'MEI + ME',
    gancho: semTravessao(daAnalise?.gancho ?? '').slice(0, 300),
    ...(daAnalise?.notas ? { notas: semTravessao(daAnalise.notas).slice(0, 2000) } : {}),
    estiloGancho: '',
    roteiroBase: roteiroBaseVazio(),
    fontes: [],
    origem: 'instagram',
    referencia: { permalink: item.permalink ?? '', conta: item.conta || null, ...(item.hashtag ? { hashtag: item.hashtag } : {}), midiaId: item.midiaId, ...(legenda ? { legenda } : {}) },
    favorita: false,
    reelId: null,
    criadaEm: agora(),
    criadoPor: autor,
  };
  db.ideias.push(ideia);
  await salvar();
  return ideia;
}
