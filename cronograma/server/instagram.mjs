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
// O que dá pra ler (docs Meta, conferido em 22/09/2026):
//  - Nossos reels: views, reach, saved, shares, likes, comments,
//    total_interactions, ig_reels_avg_watch_time, reels_skip_rate.
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
const METRICAS = 'views,reach,saved,shares,likes,comments,total_interactions,ig_reels_avg_watch_time,reels_skip_rate';
const METRICAS_BASE = 'views,reach,saved,shares,likes,comments,total_interactions';

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

const semTravessao = (s) => String(s ?? '').replace(TRACOS, ', ');
function resumo(s, n = 80) {
  const linha = semTravessao(String(s ?? '').split('\n').map((l) => l.trim()).find(Boolean) ?? '');
  return linha.length > n ? linha.slice(0, n - 1).trimEnd() + '…' : linha;
}
const fmtN = (n) => (n == null ? '-' : Number(n).toLocaleString('pt-BR'));
const fmtRel = (n) => (n == null ? '-' : `${String(n).replace('.', ',')}×`);

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

async function insights(id, token) {
  const ler = async (metric) => {
    const r = await graph(`${id}/insights`, { metric }, token);
    const o = {};
    for (const x of r.data ?? []) o[x.name] = x.values?.[0]?.value ?? x.total_value?.value ?? null;
    return o;
  };
  try {
    return await ler(METRICAS);
  } catch (e) {
    // métrica que a versão da API não aceita derruba o pedido inteiro: tenta o básico
    if (e.meta?.code === 100) return ler(METRICAS_BASE);
    throw e;
  }
}

const TETO_PAGINAS = 5; // até 500 mídias
const TETO_REELS = 100;

function itemProprio(m, ins, erro, username) {
  return {
    midiaId: m.id,
    conta: m.username ?? username ?? '',
    origem: 'nosso',
    permalink: m.permalink ?? '',
    caption: m.caption ?? '',
    timestamp: m.timestamp ?? null,
    thumb: m.thumbnail_url ?? '',
    views: ins.views ?? null,
    reach: ins.reach ?? null,
    saved: ins.saved ?? null,
    shares: ins.shares ?? null,
    likes: ins.likes ?? m.like_count ?? null,
    comments: ins.comments ?? m.comments_count ?? null,
    interacoes: ins.total_interactions ?? null,
    avgWatchMs: ins.ig_reels_avg_watch_time ?? null,
    skipRate: ins.reels_skip_rate ?? null,
    relativo: null,
    semRegua: false,
    caseId: null,
    ...(erro ? { erro } : {}),
  };
}

// insights de uma mídia; erro numa mídia não derruba o resto (só token ruim derruba)
async function comInsights(m, token, username) {
  let ins = {};
  let erro;
  try {
    ins = await insights(m.id, token);
  } catch (e) {
    if (ehTokenRuim(e)) throw e;
    erro = e.message;
  }
  return itemProprio(m, ins, erro, username);
}

// manter: itens do cache antigo que saíram da janela paginada mas estão ligados a um case ou
// a um reel do cronograma. São relidos direto pelo id e ficam marcados com antigo: true
async function lerProprios(c, manter = []) {
  const conta = await graph(c.igUserId, { fields: CAMPOS_CONTA }, c.token);
  // pagina pelo cursor com graph() (mesmo host, mesmo token, mesmo tratamento de erro);
  // a URL pronta de paging.next traz o token embutido e não é seguida
  const reels = [];
  let after;
  let paginas = 0;
  do {
    const lista = await graph(`${c.igUserId}/media`, { fields: CAMPOS_MIDIA, limit: '100', after }, c.token);
    reels.push(...(lista.data ?? []).filter((m) => m.media_product_type === 'REELS'));
    after = lista.paging?.next ? lista.paging?.cursors?.after : undefined;
  } while (after && ++paginas < TETO_PAGINAS && reels.length < TETO_REELS);

  const itens = await emLotes(reels, 5, (m) => comInsights(m, c.token, conta.username));
  // a mediana é a régua recente: só os itens paginados entram nela
  const med = mediana(itens.map((x) => x.views));

  const vistos = new Set(itens.map((x) => x.midiaId));
  const faltam = manter.filter((x) => x.midiaId && !vistos.has(x.midiaId));
  const antigos = await emLotes(faltam, 5, async (velho) => {
    try {
      const m = await graph(velho.midiaId, { fields: CAMPOS_MIDIA }, c.token);
      return { ...(await comInsights(m, c.token, conta.username)), antigo: true };
    } catch (e) {
      if (ehTokenRuim(e)) throw e;
      return { ...velho, antigo: true, erro: e.message }; // fica como estava, com o aviso
    }
  });

  for (const x of [...itens, ...antigos]) {
    x.relativo = relativoDe(x.views, med);
    x.semRegua = x.relativo == null;
  }
  return { conta: { ...conta, pageName: c.pageName ?? '' }, itens: [...itens, ...antigos], mediana: med };
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
    r = await graph(c.igUserId, { fields: midia('id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count') }, c.token);
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

async function lerInspiracoes(c, config) {
  const itens = [];
  const contas = [];
  const erros = [];
  const vistos = new Set();
  for (const bruto of config.contasReferencia ?? []) {
    const u = limparConta(bruto);
    if (!u) {
      erros.push(`@${bruto}: nome de usuário inválido`);
      continue;
    }
    try {
      const r = await lerConta(c, u);
      contas.push(r.conta);
      for (const x of r.itens) if (!vistos.has(x.midiaId)) vistos.add(x.midiaId), itens.push(x);
    } catch (e) {
      if (ehTokenRuim(e)) throw e;
      erros.push(`@${u}: ${explicarErroConta(e)}`);
    }
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
          timestamp: m.timestamp ?? null, thumb: '', views: null, reach: null, saved: null, shares: null,
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
  const c = await credenciais();
  if (!c) throw falha(400, 'Instagram não conectado. Em Métricas, cole o token do usuário do sistema ou entre com o Facebook.');
  if (vencido(c)) throw falha(400, MSG_VENCIDO);
  if (invalido(c)) throw falha(400, 'A Meta recusou o token da última vez. Desconecte e conecte de novo com um token novo.');
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
      // o que saiu da janela mas está ligado a case ou a reel do cronograma não se perde
      const manter = (ig.proprios ?? []).filter(
        (x) => caseDoPost(db, { midiaId: x.midiaId, permalink: x.permalink }) || db.reels.some((r) => mesmoPost(r.permalink, x.permalink))
      );
      const r = await lerProprios(c, manter);
      ig.conta = r.conta;
      ig.proprios = r.itens;
      ig.medianaPropria = r.mediana;
    } catch (e) {
      if (escopo === 'proprios' || ehTokenRuim(e)) throw e;
      erros.push(`Nossa conta: ${e.message}`);
    }
  }
  if (escopo !== 'proprios') {
    const r = await lerInspiracoes(c, db.config);
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

  // reel do cronograma com permalink ganha as métricas reais (com a mídia, pra virar case certo)
  for (const reel of db.reels) {
    const m = reel.permalink && ig.proprios.find((x) => mesmoPost(x.permalink, reel.permalink));
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
export async function paraIdeia({ midiaId, tema, tipo, formatoId } = {}, autor = null) {
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
    descricao: `Inspirado num reel de ${quem} (${numeros}). Adapte a estrutura ${alvo}, sem copiar a fala.`,
    tipo,
    tema,
    formatoId: db.formatos.some((f) => f.id === formatoId) ? formatoId : doCase || null,
    publico: 'MEI + ME',
    gancho: '',
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
