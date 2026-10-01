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
//    clique no link da bio por reel e qualquer número do Facebook (o Monitoramento pede à mão).
//  - Reels de outra conta Business/Creator: view_count (inclui pago!),
//    like_count, comments_count. Saves, shares e retenção NÃO vêm.
//  - Hashtag: top_media sem views (sem régua), e exige o recurso
//    "Instagram Public Content Access" aprovado no app.
//  - Scraping fora da API viola os Termos do Instagram. Não fazemos.
//
// 30/09/2026 (Métricas: Diagnóstico, Público e Semanal; SPEC-METRICAS.md §3.10 e §3.11):
//  - Reels pedem também ig_reels_video_view_total_time, reposts e total_views; feed e carrossel, reposts e
//    total_views (a recusa por tipo tira o que a Meta não aceitar). Métrica nova na lista é pedida já, sem
//    esperar a validade da lista salva, e a recusa vale 7 dias a partir de quando aconteceu
//  - feed e carrossel: clique no link da bio = profile_activity por action_type, numa chamada à parte
//  - a mídia pede também media_audio_type, is_shared_to_feed e children{id} (slides); campo que a Meta
//    recusar sai até o servidor reiniciar
//  - cada mídia com insight novo ganha uma leitura no histórico por idade (historico.mjs); falha lá não
//    derruba a sincronização
//  - uma sincronização por vez no servidor: a manual que chega no meio recebe 409, a da agenda pula (null)
//  - reel.metricas vale também pra peça ligada à mídia em data/mecanismos.json (lido cru: importar
//    mecanismos.mjs faria import circular)
//  - o token de usuário do sistema (anúncios) mora no mesmo arquivo, como tokenUsuario, e nunca vai pro
//    front; recusa dele não derruba a conexão do Instagram
//  - chamar() é a porta dos módulos novos (público, stories, anúncios) pra Graph
// 30/09/2026 (revisão):
//  - data/instagram.json é lido com lerJsonEstrito: ilegível (JSON quebrado, preso por outro processo) não vira
//    "sem arquivo". Nada é gravado por cima (conectar, token dos anúncios, marca do 190, desconectar) até uma
//    leitura dar certo; a conexão conta como caída, a tela mostra o porquê e a leitura tenta de novo sozinha
//  - 190 só marca o token que falhou, e só se ele ainda é o atual: a resposta atrasada de uma chamada com o token
//    antigo não derruba o token que alguém acabou de colar (vale pro da Página e pro dos anúncios)
//  - entrar com o Facebook não guarda o token pessoal de quem entrou como token dos anúncios (vence em ~60 dias e
//    fala em nome da pessoa): o do usuário do sistema que já estava fica, e ele só entra pelo Conectar dos
//    anúncios ou pelo token colado
//  - limite de uso da Meta inclui 80000 a 80014 e o HTTP 429 (ehCodigoDeLimite); o erro guarda is_transient
//    (meta.transitorio) e se a resposta veio sem corpo de erro da Meta (meta.semCorpo), pro público separar
//    falha passageira de recusa (ehPassageiro)
//  - propriosEm: quando os nossos posts foram lidos. O sincronizadoEm anda com qualquer escopo (inspirações
//    também), e a agenda e o Diagnóstico precisam do outro
import { randomBytes } from 'node:crypto';
import {
  carregar, salvar, lerJson, lerJsonEstrito, gravarJson, apagarJson, novoId, agora, falha, TRACOS, mesmoPost, conferirTema, conferirTipo, nomeTema,
  roteiroBaseVazio,
} from './db.mjs';
import { msDe as msBrasilia } from './estatistica.mjs';
import * as historico from './historico.mjs';
import {
  metricasRecusadas, recusaDeMetrica, extrasRecusados, lerAtividadePerfil, tipoInsights, urlVideo, itemProprio, metricasDaPeca, BIO,
  ehCodigoDeLimite, ehErroDeLimite, ehErroPassageiro,
} from './instagram-motor.mjs';

export { metricasRecusadas, lerAtividadePerfil, metricasDaPeca };

const ARQUIVO = 'instagram.json';
// ads_read: a Meta exige quando a Página chega pelo Gerenciador de Negócios (sempre, no usuário do sistema)
const ESCOPOS = 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement,business_management,ads_read';
const CAMPOS_MIDIA = 'id,caption,media_type,media_product_type,permalink,timestamp,thumbnail_url,media_url,like_count,comments_count,username';
// 30/09: tipo de áudio (música ou som original), reel que também aparece no feed e os slides do carrossel.
// Campo que a Meta recusar (erro 100 citando o nome) sai até o servidor reiniciar; a lista acima segue igual
const CAMPOS_EXTRA = ['media_audio_type', 'is_shared_to_feed', 'children{id}'];
const extrasFora = new Set();
const CAMPOS_CONTA = 'id,username,name,profile_picture_url,followers_count,media_count';
// O que a Graph devolve de insight por mídia nossa muda com o tipo (media_product_type + media_type).
// Esta é a lista pedida; a métrica que a Meta recusar (erro 100 citando o nome dela) sai da lista daquele
// tipo e fica anotada em db.instagram.metricasApi (aceitas, recusadas, em). A lista aceita vale 7 dias
const METRICAS_TIPO = {
  REELS: [
    'views', 'reach', 'saved', 'shares', 'likes', 'comments', 'total_interactions', 'ig_reels_avg_watch_time', 'reels_skip_rate', 'profile_visits', 'follows',
    'ig_reels_video_view_total_time', 'reposts', 'total_views',
  ],
  FEED: ['views', 'reach', 'saved', 'shares', 'likes', 'comments', 'total_interactions', 'profile_visits', 'follows', 'reposts', 'total_views'],
  CAROUSEL_ALBUM: ['views', 'reach', 'saved', 'shares', 'likes', 'comments', 'total_interactions', 'profile_visits', 'follows', 'reposts', 'total_views'],
};
// as que entraram em 30/09: erro 100 sem nome de métrica com alguma delas na lista tenta uma vez sem elas
// (passou, eram elas). A leitura de antes nunca quebra por causa das novas
const METRICAS_NOVAS = ['ig_reels_video_view_total_time', 'reposts', 'total_views'];
// profile_activity (clique no link da bio) só existe pra feed e carrossel
const TIPOS_ATIVIDADE = ['FEED', 'CAROUSEL_ALBUM'];
const MODOS_ATIVIDADE = ['sem', 'total', 'recusada'];
const VALIDADE_METRICAS = 7 * 86_400_000;

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

// o conteúdo de data/instagram.json (undefined = ainda não leu, ou a leitura falhou; null = sem arquivo). A
// conexão é o arquivo com token e igUserId; o tokenUsuario (usuário do sistema, pros anúncios) pode morar nele
// até sem conexão (método env). Lido já no import: conectado() e tokenUsuarioDisponivel() respondem sem esperar
// disco. Arquivo ilegível: lerJsonEstrito lança 503 (JSON quebrado ganha uma cópia ao lado), arquivo fica
// undefined e quem grava lê antes, então lança junto. Uma leitura por vez (chamadas juntas esperam a mesma)
let arquivo;
let lendoArquivo = null;
function lerArquivo() {
  if (arquivo !== undefined) return Promise.resolve(arquivo);
  lendoArquivo ??= lerJsonEstrito(ARQUIVO, null)
    .then((salvo) => {
      if (arquivo === undefined) arquivo = salvo && typeof salvo === 'object' && !Array.isArray(salvo) ? salvo : null;
      return arquivo;
    })
    .finally(() => {
      lendoArquivo = null;
    });
  return lendoArquivo;
}
// o servidor sobe mesmo com o arquivo ilegível (o resto do app não depende dele): a conexão fica caída até ler
await lerArquivo().catch((e) => console.error('Instagram sem conexão até o arquivo voltar:', e.message));

// escrita em fila (dois 190 juntos não se atropelam no mesmo .tmp). Grava o estado da memória na hora;
// sem nada na memória, apaga o arquivo
let filaArquivo = Promise.resolve();
function gravarArquivo() {
  const proxima = filaArquivo.then(() => (arquivo ? gravarJson(ARQUIVO, arquivo) : apagarJson(ARQUIVO)));
  filaArquivo = proxima.catch((e) => console.error('Falha ao gravar instagram.json:', e.message));
  return proxima;
}

const conexaoSalva = () => (arquivo?.token && arquivo?.igUserId ? arquivo : null);
function credencialAtual() {
  // arquivo não lido (ilegível): não dá pra saber se a conexão dele vale mais que a do .env. Conta como caída
  if (arquivo === undefined) return null;
  const c = conexaoSalva();
  if (c) return c;
  if (process.env.IG_ACCESS_TOKEN && process.env.IG_USER_ID) {
    return { metodo: 'env', token: process.env.IG_ACCESS_TOKEN, igUserId: process.env.IG_USER_ID, username: '', pageId: '', pageName: '', expiraEm: null };
  }
  return null;
}
async function credenciais() {
  await lerArquivo();
  return credencialAtual();
}

// token que a Meta recusou (190) ou que venceu: a conexão conta como caída até conectar de novo.
// O do .env não dá pra reescrever, então a marca dele fica só em memória
let envInvalido = false;
const vencido = (c) => Boolean(c?.expiraEm) && Date.parse(c.expiraEm) <= Date.now();
const invalido = (c) => Boolean(c?.invalido) || (c?.metodo === 'env' && envInvalido);
const MSG_VENCIDO = 'O acesso ao Instagram venceu. Conecte de novo.';

// tokenQueFalhou: o token da chamada que voltou 190. Só marca se ele ainda é o atual: a resposta atrasada de uma
// chamada com o token antigo (revogado e trocado no meio de uma leitura longa) não derruba o token recém colado.
// Arquivo não lido (ilegível): nada é gravado por cima
async function marcarTokenRuim(msg, tokenQueFalhou) {
  if (arquivo === undefined || !tokenQueFalhou) return;
  const c = conexaoSalva();
  if (c) {
    if (c.token !== tokenQueFalhou) return;
    c.invalido = true;
    await gravarArquivo();
  } else if (process.env.IG_ACCESS_TOKEN === tokenQueFalhou) envInvalido = true;
  else return;
  const db = await carregar();
  db.instagram.erros = [msg];
  await salvar();
}

// token de usuário do sistema (anúncios): o guardado, se não venceu nem foi recusado
const MSG_SEM_USUARIO = 'Falta o token de usuário do sistema pra ler os anúncios. Cole o token em Métricas, Público, Anúncios.';
const MSG_USUARIO_RECUSADO = 'A Meta recusou o token de usuário do sistema (venceu ou foi revogado). Gere um token novo e cole em Métricas, Público, Anúncios.';
function tokenDeUsuario() {
  const t = arquivo?.tokenUsuario;
  if (typeof t !== 'string' || !t || arquivo.tokenUsuarioInvalido) return null;
  if (arquivo.tokenUsuarioExpiraEm && Date.parse(arquivo.tokenUsuarioExpiraEm) <= Date.now()) return null;
  return t;
}
export const tokenUsuarioDisponivel = () => Boolean(tokenDeUsuario());

// o mesmo cuidado do marcarTokenRuim: só o token dos anúncios que falhou, se ele ainda é o guardado
async function marcarUsuarioRuim(tokenQueFalhou) {
  if (!arquivo?.tokenUsuario || arquivo.tokenUsuarioInvalido || arquivo.tokenUsuario !== tokenQueFalhou) return;
  arquivo.tokenUsuarioInvalido = true;
  await gravarArquivo().catch(() => {});
}

// segredos vivos, pra conferir que nenhum texto gerado pela IA vaza um deles. Arquivo ilegível não derruba a
// conferência: ficam os da memória e do .env (a guarda também pega token da Meta pelo formato)
export async function segredosAtuais() {
  const c = await credenciais().catch(() => null);
  return [c?.token, arquivo?.tokenUsuario, process.env.IG_ACCESS_TOKEN, process.env.META_APP_SECRET].filter((s) => typeof s === 'string' && s.length >= 12);
}

// sem exceção e sem esperar disco: a agenda e as abas perguntam antes de ler. Arquivo que não foi lido (preso
// ou quebrado no boot): tenta de novo por trás e, até dar certo, responde desconectado
export function conectado() {
  try {
    if (arquivo === undefined) {
      lerArquivo().catch(() => {});
      return false;
    }
    const c = credencialAtual();
    return Boolean(c) && !vencido(c) && !invalido(c);
  } catch {
    return false;
  }
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
  } else if (ehCodigoDeLimite(code)) {
    msg = 'A Meta limitou as chamadas deste app por agora. Espere alguns minutos e tente de novo.';
  } else if (e.semCorpo && code >= 500 && code < 600) {
    msg = `A Meta está instável agora (código ${code}). Tente de novo em alguns minutos.`;
  } else if (code === 101) {
    msg = 'O META_APP_ID ou o META_APP_SECRET do .env não confere com o app da Meta. Confira os dois em developers.facebook.com.';
  } else if (code === 100 && /verification code|redirect_uri/i.test(e.message ?? '')) {
    msg = `O código de login expirou ou a URL de redirecionamento não está cadastrada no app da Meta (${redirectUri()}). Tente entrar de novo.`;
  } else if (code === 10 || (code >= 200 && code < 300)) {
    msg = `O token não tem permissão pra isso. Ele precisa de ${ESCOPOS.replaceAll(',', ', ')}.`;
  } else {
    msg = `A Meta recusou o pedido (código ${code || '?'}): ${e.message ?? 'sem detalhe'}`;
  }
  // transitorio: a Meta disse que é passageiro (is_transient); semCorpo: a resposta não trouxe erro da Meta
  // (HTML de um 5xx, 429 cru): o código é o status HTTP
  return Object.assign(falha(400, msg), { meta: { code, sub, message: e.message ?? '', transitorio: e.is_transient === true, semCorpo: e.semCorpo === true } });
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
  if (!r.ok || corpo.error) throw erroMeta(corpo.error ?? { code: r.status, message: r.statusText, semCorpo: true });
  return corpo;
}

export const ehTokenRuim = (e) => e?.meta?.code === 190;
// limite de chamadas da Meta (Business Discovery conta por hora; 80000 a 80014 é o limite por caso de negócio,
// 80002 o do Instagram): parar de insistir e manter o que já tinha. O 502 é o nosso (rede ou tempo esgotado)
export const ehLimite = ehErroDeLimite;
// falha que passa sozinha (limite, rede, resposta sem corpo de erro da Meta, is_transient, códigos 1 e 2): quem
// anota recusa por dias (o público) confere aqui antes. A regra mora em instagram-motor.mjs
export const ehPassageiro = ehErroPassageiro;

export async function emLotes(xs, n, fn) {
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

// caminho da Graph: ids e arestas (act_123/ads, 1784.../insights, me/adaccounts). Nada de "..", "?" ou "#"
const CAMINHO_GRAPH = /^[A-Za-z0-9_]{1,80}(\/[A-Za-z0-9_]{1,80}){0,3}$/;

// Porta dos módulos de Métricas (público, stories, anúncios) pra Graph: mesmo host e mesmo tratamento de
// erro. Token da Página por padrão (190 nele derruba a conexão, como na sincronização); usuario: true usa
// o token de usuário do sistema (anúncios), e 190 nele só marca esse token. "{ig}" no começo do caminho
// vira o id da conta do Instagram conectada. Com usuario: true a conexão do Instagram só é exigida pro "{ig}":
// a leitura dos anúncios (act_.../ads) segue de pé com a conexão caída
export async function chamar(caminho, params = {}, { usuario = false } = {}) {
  const bruto = String(caminho ?? '');
  const c = !usuario || bruto.startsWith('{ig}') ? await credencialPronta() : null;
  // o token dos anúncios mora no mesmo arquivo: lido antes (ilegível lança 503, como a conexão)
  if (usuario) await lerArquivo();
  const alvo = bruto.replace(/^\{ig\}/, c?.igUserId ?? '');
  if (!CAMINHO_GRAPH.test(alvo)) throw falha(400, 'Caminho inválido pra Graph API.');
  const p = params && typeof params === 'object' && !Array.isArray(params) ? params : {};
  if (!usuario) {
    try {
      return await graph(alvo, p, c.token);
    } catch (e) {
      if (ehTokenRuim(e)) await marcarTokenRuim(e.message, c.token);
      throw e;
    }
  }
  const t = tokenDeUsuario();
  if (!t) throw falha(400, arquivo?.tokenUsuario && arquivo.tokenUsuarioInvalido ? MSG_USUARIO_RECUSADO : MSG_SEM_USUARIO);
  try {
    return await graph(alvo, p, t);
  } catch (e) {
    if (!ehTokenRuim(e)) throw e;
    await marcarUsuarioRuim(t);
    throw Object.assign(falha(400, MSG_USUARIO_RECUSADO), { meta: e.meta });
  }
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
  // só token de usuário lista me/accounts: quando ele é outro (não o da Página), fica guardado pros anúncios
  const tokenUsuario = pagina && tokenUso !== token ? token : null;
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
    tokenUsuario,
    igUserId: ig.id,
    username: ig.username ?? '',
    pageId: pagina.id,
    pageName: pagina.name ?? '',
    conta: { ...ig, pageName: pagina.name ?? '' },
  };
}

const CHAVES_USUARIO = ['tokenUsuario', 'tokenUsuarioExpiraEm', 'tokenUsuarioInvalido'];

async function gravarConexao(d, metodo, expiraEm = null, usuarioExpiraEm = null) {
  // arquivo ilegível lança aqui: a conexão nova nunca grava por cima do que não foi lido (o token dos anúncios
  // pode estar lá)
  await lerArquivo();
  const antes = arquivo ?? {};
  // o token de usuário que já estava (anúncios) fica, a não ser que esta conexão traga outro
  const usuario = d.tokenUsuario
    ? { tokenUsuario: d.tokenUsuario, ...(usuarioExpiraEm ? { tokenUsuarioExpiraEm: usuarioExpiraEm } : {}) }
    : Object.fromEntries(CHAVES_USUARIO.filter((k) => antes[k] != null).map((k) => [k, antes[k]]));
  arquivo = {
    metodo, token: d.token, igUserId: d.igUserId, username: d.username, pageId: d.pageId, pageName: d.pageName, expiraEm, conectadoEm: agora(),
    ...usuario,
  };
  envInvalido = false;
  await gravarArquivo();
  const db = await carregar();
  db.instagram.conta = d.conta;
  db.instagram.erros = [];
  if (!db.config.handleInstagram && d.username) db.config.handleInstagram = d.username;
  await salvar();
  return status();
}

function limparToken(bruto) {
  const token = String(bruto ?? '').trim().replace(/^Bearer\s+/i, '');
  if (!token) throw falha(400, 'Cole o token de acesso.');
  if (/\s/.test(token) || token.length < 30) throw falha(400, 'Esse texto não parece um token da Meta. Copie o token inteiro, sem espaços.');
  return token;
}

export async function conectarPorToken(bruto) {
  const token = limparToken(bruto);
  // arquivo ilegível: para antes de ir à Meta (a gravação lançaria depois, do mesmo jeito)
  await lerArquivo();
  return gravarConexao(await descobrirConta(token), 'token', null);
}

// token de usuário do sistema pros anúncios (anuncios.mjs): mesma checagem de forma do token da conexão e
// um "me" na Meta antes de guardar (token recusado não entra). Fica em data/instagram.json, nunca no front.
// Arquivo ilegível lança antes de tudo: gravar só o token dos anúncios apagaria a conexão que está lá
export async function gravarTokenUsuario(bruto) {
  const token = limparToken(bruto);
  await lerArquivo();
  let eu;
  try {
    eu = await graph('me', { fields: 'id,name' }, token);
  } catch (e) {
    if (ehTokenRuim(e)) throw falha(400, 'A Meta recusou esse token. Gere um token novo do usuário do sistema (com ads_read) e cole de novo.');
    throw e;
  }
  await lerArquivo();
  const resto = Object.fromEntries(Object.entries(arquivo ?? {}).filter(([k]) => !CHAVES_USUARIO.includes(k)));
  arquivo = { ...resto, tokenUsuario: token };
  await gravarArquivo();
  return { ok: true, id: eu.id ?? null, nome: eu.name ?? null };
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
  const vence = longo.expires_in ? new Date(Date.now() + longo.expires_in * 1000).toISOString() : null;
  // o token de usuário daqui é o pessoal de quem entrou (vence em ~60 dias, com business_management e ads_read
  // em nome da pessoa): não vira o token dos anúncios. tokenUsuario null mantém o do usuário do sistema que já
  // estava; o dos anúncios só entra pelo Conectar dos anúncios (gravarTokenUsuario) ou pelo token colado
  return gravarConexao({ ...d, tokenUsuario: null }, 'oauth', d.token === longo.access_token ? vence : null, null);
}

export async function registrarErro(mensagem) {
  const db = await carregar();
  db.instagram.erros = [mensagem];
  await salvar();
}

// apaga o arquivo inteiro: a conexão e o token de usuário dos anúncios. Arquivo ilegível lança antes (nada é
// apagado sem ter sido lido: a cópia ao lado é de boa vontade e pode faltar com o disco cheio)
export async function desconectar() {
  await lerArquivo();
  const antes = arquivo;
  arquivo = null;
  try {
    await gravarArquivo();
  } catch (e) {
    arquivo = antes; // o arquivo continua lá: a memória também
    throw e;
  }
  const db = await carregar();
  db.instagram.conta = null;
  await salvar();
  const s = await status();
  if (s.metodo === 'env') s.aviso = 'O arquivo .env ainda tem IG_ACCESS_TOKEN e IG_USER_ID. Apague as duas linhas e reinicie pra desconectar de vez.';
  return s;
}

// o que o front pode ver: nunca o token (nem o de usuário). Com data/instagram.json ilegível não lança (o estado
// do app inteiro passa por aqui): responde desconectado, com o porquê em erros
export async function status() {
  let c = null;
  let ilegivel = null;
  try {
    c = await credenciais();
  } catch (e) {
    ilegivel = e.message;
  }
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
    propriosEm: ig.propriosEm ?? null,
    erros: ilegivel ? [ilegivel] : expirado && !erros.length ? [MSG_VENCIDO] : erros,
  };
}

export async function dados() {
  const ig = (await carregar()).instagram ?? {};
  return {
    conta: ig.conta ?? null,
    proprios: ig.proprios ?? [],
    postsProprios: ig.postsProprios ?? [],
    inspiracoes: ig.inspiracoes ?? [],
    contas: ig.contas ?? [],
    diario: ig.diario ?? {},
    medianaPropria: ig.medianaPropria ?? null,
    sincronizadoEm: ig.sincronizadoEm ?? null,
    // quando os nossos posts foram lidos (o sincronizadoEm anda também com a leitura só das inspirações)
    propriosEm: ig.propriosEm ?? null,
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
// ms do timestamp da Graph ("2026-09-09T15:12:25+0000"); 0 quando não dá pra ler
export const msDe = (ts) => msBrasilia(ts) ?? 0;

const mesmaLista = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x) => b.includes(x));

function atividadeInicial(salvo = {}) {
  const o = {};
  for (const tipo of TIPOS_ATIVIDADE) {
    const s = salvo?.[`${tipo}:profile_activity`];
    const fresco = s?.em && Date.now() - Date.parse(s.em) < VALIDADE_METRICAS && MODOS_ATIVIDADE.includes(s.modo);
    o[tipo] = { modo: fresco ? s.modo : null, mudou: false, falhas: 0 };
  }
  return o;
}

function metricasIniciais(salvo = {}) {
  const aceitas = {};
  const recusadas = {};
  const desde = {};
  for (const [tipo, lista] of Object.entries(METRICAS_TIPO)) {
    const s = salvo?.[tipo];
    const fresco = s?.em && Date.now() - Date.parse(s.em) < VALIDADE_METRICAS && Array.isArray(s.aceitas) && s.aceitas.length;
    const recusou = new Set(fresco ? s.recusadas ?? [] : []);
    // métrica nova na lista (nem aceita nem recusada na leitura salva) é pedida já
    aceitas[tipo] = fresco ? lista.filter((x) => s.aceitas.includes(x) || !recusou.has(x)) : [...lista];
    recusadas[tipo] = recusou;
    desde[tipo] = fresco ? s.em : null;
  }
  return { aceitas, recusadas, confirmadas: new Set(), desde, atividade: atividadeInicial(salvo) };
}

function metricasParaGravar(estado, salvo = {}) {
  const saida = { ...(salvo ?? {}) };
  for (const tipo of estado.confirmadas) {
    const velho = saida[tipo];
    const aceitas = estado.aceitas[tipo];
    const recusadas = [...estado.recusadas[tipo]];
    // a data só anda quando a lista muda: a recusa vale 7 dias a partir de quando aconteceu
    const igual = estado.desde?.[tipo] && velho?.em === estado.desde[tipo] && mesmaLista(velho.aceitas, aceitas) && mesmaLista(velho.recusadas, recusadas);
    saida[tipo] = { aceitas, recusadas, em: igual ? velho.em : agora() };
  }
  for (const [tipo, a] of Object.entries(estado.atividade ?? {})) {
    if (!a.mudou) continue;
    const recusada = a.modo === 'recusada';
    saida[`${tipo}:profile_activity`] = {
      aceitas: recusada ? [] : ['profile_activity'], recusadas: recusada ? ['profile_activity'] : [], modo: a.modo, em: agora(),
    };
  }
  return saida;
}

async function insightsDe(id, tipo, estado, token) {
  let semNovas = null; // erro 100 sem nome de métrica: uma tentativa sem as novas
  for (let i = 0; i < 8; i++) {
    const lista = estado.aceitas[tipo].filter((x) => !semNovas?.includes(x));
    if (!lista.length) return {};
    try {
      const r = await graph(`${id}/insights`, { metric: lista.join(',') }, token);
      if (semNovas) {
        estado.aceitas[tipo] = estado.aceitas[tipo].filter((x) => !semNovas.includes(x));
        for (const x of semNovas) estado.recusadas[tipo].add(x);
      }
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
      if (fora.length) {
        estado.aceitas[tipo] = estado.aceitas[tipo].filter((x) => !fora.includes(x));
        for (const x of fora) estado.recusadas[tipo].add(x);
        continue;
      }
      const novas = lista.filter((x) => METRICAS_NOVAS.includes(x));
      if (semNovas || !novas.length) throw e;
      semNovas = novas;
    }
  }
  throw falha(502, 'A Meta recusou as métricas desta mídia.');
}

// clique no link da bio (feed e carrossel): profile_activity por action_type, numa chamada à parte. Sem
// metric_type primeiro; erro 100, de novo com metric_type=total_value. As duas recusadas: o tipo fica 7 dias
// sem pedir (metricasApi, chave "FEED:profile_activity"). undefined = não leu agora (fica o do cache)
async function bioDe(id, tipo, estado, token) {
  const a = estado.atividade[tipo];
  if (!a || a.modo === 'recusada') return undefined;
  let erro = null;
  for (const modo of a.modo === 'total' ? ['total', 'sem'] : ['sem', 'total']) {
    try {
      const r = await graph(`${id}/insights`, { metric: 'profile_activity', breakdown: 'action_type', ...(modo === 'total' ? { metric_type: 'total_value' } : {}) }, token);
      if (a.modo !== modo) Object.assign(a, { modo, mudou: true });
      return lerAtividadePerfil(r).bioLinkClicks;
    } catch (e) {
      if (e.meta?.code !== 100) throw e;
      erro = e;
    }
  }
  // recusa da métrica (o erro cita a métrica, o breakdown ou o metric_type), ou 3 posts com erro 100 nesta leitura
  if (recusaDeMetrica(erro.meta.message) || ++a.falhas >= 3) Object.assign(a, { modo: 'recusada', mudou: true });
  return undefined;
}

const precisaInsights = (m, velho) =>
  !velho?.insightsEm || Boolean(velho.erro) || Date.now() - msDe(m.timestamp) <= JANELA_INSIGHTS || Date.now() - Date.parse(velho.insightsEm) > RELER_INSIGHTS;

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

// uma página da lista de mídias, com os campos extras que a Meta ainda aceita
async function paginaDeMidias(c, after) {
  for (;;) {
    const extras = CAMPOS_EXTRA.filter((x) => !extrasFora.has(x));
    try {
      return await graph(`${c.igUserId}/media`, { fields: [CAMPOS_MIDIA, ...extras].join(','), limit: '100', after }, c.token);
    } catch (e) {
      const fora = e.meta?.code === 100 ? extrasRecusados(e.meta.message, extras) : [];
      if (!fora.length) throw e;
      for (const x of fora) extrasFora.add(x);
      console.error(`A Meta recusou ${fora.join(', ')} na lista de mídias: a leitura segue sem.`);
    }
  }
}

async function lerProprios(c, ig) {
  const conta = await graph(c.igUserId, { fields: CAMPOS_CONTA }, c.token);
  // pagina pelo cursor com graph() (mesmo host, mesmo token, mesmo tratamento de erro);
  // a URL pronta de paging.next traz o token embutido e não é seguida
  const midias = [];
  let after;
  let paginas = 0;
  do {
    const lista = await paginaDeMidias(c, after);
    midias.push(...(lista.data ?? []).filter((m) => m?.id));
    after = lista.paging?.next ? lista.paging?.cursors?.after : undefined;
  } while (after && ++paginas < TETO_PAGINAS);
  const completo = !after;

  const cache = new Map([...(ig.proprios ?? []), ...(ig.postsProprios ?? [])].filter((x) => x?.midiaId).map((x) => [String(x.midiaId), x]));
  const estado = metricasIniciais(ig.metricasApi);
  let limitado = null;
  let erros = 0;
  // o que ganhou insight agora: vai pro histórico por idade
  const frescos = [];
  const ler = async (m) => {
    const velho = cache.get(String(m.id));
    const tipo = tipoInsights(m);
    const base = { tipo, username: conta.username };
    if (limitado || !precisaInsights(m, velho)) return itemProprio(m, null, velho, base);
    let ins;
    try {
      ins = await insightsDe(m.id, tipo, estado, c.token);
    } catch (e) {
      if (ehTokenRuim(e)) throw e;
      if (ehLimite(e)) limitado ??= e.message;
      erros++;
      return itemProprio(m, null, velho, { ...base, erro: e.message }); // o número do cache fica
    }
    // feed e carrossel: o clique no link da bio é outra chamada; falha nela não perde o resto do post
    let bio;
    if (tipo !== 'REELS' && !limitado) {
      try {
        bio = await bioDe(m.id, tipo, estado, c.token);
      } catch (e) {
        if (ehTokenRuim(e)) throw e;
        if (ehLimite(e)) limitado ??= e.message;
      }
    }
    const item = itemProprio(m, bio === undefined ? ins : { ...ins, [BIO]: bio }, velho, { ...base, em: agora() });
    // clique que não foi lido agora fica no item (o do cache), mas não entra no histórico como leitura nova
    frescos.push(tipo !== 'REELS' && bio === undefined ? { ...item, bioLinkClicks: null } : item);
    return item;
  };
  // o primeiro de cada tipo vai sozinho (é ele que descobre as métricas aceitas); o resto, 5 por vez
  const lidos = new Map();
  const primeiros = new Map();
  for (const m of midias) if (precisaInsights(m, cache.get(String(m.id))) && !primeiros.has(tipoInsights(m))) primeiros.set(tipoInsights(m), m);
  for (const m of primeiros.values()) lidos.set(m.id, await ler(m));
  const resto = midias.filter((m) => !lidos.has(m.id));
  (await emLotes(resto, 5, ler)).forEach((x, i) => lidos.set(resto[i].id, x));

  const vistos = new Set(midias.map((m) => String(m.id)));
  // item antigo do cache (de antes dos campos novos) ganha os campos que faltam como null
  const novosNulos = { totalViews: null, viewTotalMs: null, reposts: null, bioLinkClicks: null, audioTipo: null, noFeed: null, nSlides: null, mediaType: null };
  const guardados = [...cache.values()]
    .filter((x) => !vistos.has(String(x.midiaId)))
    .map((x) => ({ ...novosNulos, ...x, tipo: x.tipo ?? 'REELS', ...(completo ? { naoListado: true } : {}) }));
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
    frescos,
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

// uma leitura por vez no servidor inteiro (a da agenda e a do botão mexem no mesmo cache)
let leituraAtual = null;
export const emAndamento = () => leituraAtual !== null;

// origem 'agenda': com outra leitura rodando, pula (devolve null) em vez do 409
export async function sincronizar({ escopo = 'tudo', origem = null } = {}) {
  if (!['proprios', 'inspiracoes', 'tudo'].includes(escopo)) throw falha(400, 'escopo precisa ser proprios, inspiracoes ou tudo');
  // nada de await antes da trava: duas chamadas juntas nunca passam as duas
  if (leituraAtual) {
    if (origem === 'agenda') return null;
    throw falha(409, 'Já tem uma leitura do Instagram rodando. Espere ela terminar.');
  }
  const esta = (async () => {
    const c = await credencialPronta();
    try {
      return await sincronizarCom(c, escopo);
    } catch (e) {
      // token recusado (190) fica registrado: a tela mostra o aviso e o formulário de conectar. Só o token desta
      // leitura: se alguém colou outro no meio dela, o novo fica
      if (ehTokenRuim(e)) await marcarTokenRuim(e.message, c.token);
      throw e;
    }
  })();
  leituraAtual = esta;
  try {
    return await esta;
  } finally {
    if (leituraAtual === esta) leituraAtual = null;
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
      // a agenda e o Diagnóstico contam "a última leitura dos nossos posts" daqui: a leitura só das inspirações
      // não empurra a próxima 3 horas pra frente
      ig.propriosEm = agora();
      erros.push(...r.avisos.map((a) => `Nossa conta: ${a}`));
      // leitura por idade (comparar peças na mesma idade): falha no histórico nunca derruba a sincronização
      try {
        await historico.registrar(r.frescos, agora());
      } catch (e) {
        console.error('Histórico das mídias não gravou:', e.message);
      }
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
  // mecanismos.json ilegível: os números das peças ficam como estavam, e a tela diz por quê
  const aviso = await preencherMetricasDasPecas(db, ig);
  ig.erros = aviso ? [...erros, aviso] : erros;
  await salvar();
  return dados();
}

// ---------- métricas no item do cronograma ----------

// mídia → peça ligada no Diagnóstico (data/mecanismos.json, midias[midiaId].reelId), só peça que existe:
// { mapa }. Arquivo ilegível (lerJsonEstrito lançou): { erro }, e quem chama não mexe nas peças até ele voltar
async function vinculosDasMidias(pecas) {
  let bruto;
  try {
    bruto = await lerJsonEstrito('mecanismos.json', null);
  } catch (e) {
    return { mapa: null, erro: e.message };
  }
  const midias = bruto?.midias && typeof bruto.midias === 'object' && !Array.isArray(bruto.midias) ? bruto.midias : {};
  const mapa = new Map();
  for (const [midiaId, r] of Object.entries(midias)) if (typeof r?.reelId === 'string' && pecas.has(r.reelId)) mapa.set(String(midiaId), r.reelId);
  return { mapa, erro: null };
}

// item do cronograma ganha as métricas reais (com a mídia, pra virar case certo). A peça ligada à mídia no
// Diagnóstico vale antes do permalink; mídia ligada a outra peça não casa pelo link, e o número dela sai da
// peça que tinha antes. Carrossel e estático do calendário casam com os posts de feed. Devolve um aviso (texto)
// quando não deu pra mexer nas peças, senão null
async function preencherMetricasDasPecas(db, ig) {
  const nossas = [...(ig.proprios ?? []), ...(ig.postsProprios ?? [])];
  const porId = new Map(nossas.map((x) => [String(x.midiaId), x]));
  const { mapa: dono, erro } = await vinculosDasMidias(new Set(db.reels.map((r) => r.id)));
  // sem os vínculos, casar só pelo link poria o número de um post na peça errada: as peças ficam como estão
  if (!dono) return `Os números das peças do cronograma ficaram como estavam. ${erro}`;
  const ligada = new Map(); // reelId → mídia (a mais nova, se duas apontam pra mesma peça)
  for (const [midiaId, reelId] of dono) {
    const m = porId.get(midiaId);
    if (m && (!ligada.has(reelId) || msDe(m.timestamp) > msDe(ligada.get(reelId).timestamp))) ligada.set(reelId, m);
  }
  // quando os números dos nossos posts foram lidos (a leitura só das inspirações não conta)
  const em = ig.propriosEm ?? ig.sincronizadoEm ?? agora();
  for (const reel of db.reels) {
    const livre = (midiaId) => !dono.has(String(midiaId)) || dono.get(String(midiaId)) === reel.id;
    const m = ligada.get(reel.id) ?? (reel.permalink ? nossas.find((x) => mesmoPost(x.permalink, reel.permalink) && livre(x.midiaId)) : null);
    if (m) reel.metricas = metricasDaPeca(m, em);
    else if (reel.metricas?.midiaId && !livre(reel.metricas.midiaId)) reel.metricas = null;
  }
  return null;
}

// sem ler a Meta: refaz reel.metricas com o cache (depois de ligar ou soltar mídia e peça no Diagnóstico)
export async function atualizarMetricasDasPecas() {
  const db = await carregar();
  const aviso = await preencherMetricasDasPecas(db, db.instagram ?? {});
  if (aviso) console.error(aviso);
  await salvar();
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
    if (ehTokenRuim(e)) await marcarTokenRuim(e.message, c.token);
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
