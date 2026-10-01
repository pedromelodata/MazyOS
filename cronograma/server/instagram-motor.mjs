// Partes puras da leitura do Instagram e do histórico por mídia (Métricas, 30/09/2026; SPEC-METRICAS.md
// §2.1, §3.2 e §3.10). Sem disco, rede nem relógio escondido (quem precisa de "agora" recebe por parâmetro):
// instagram.mjs e historico.mjs usam daqui, e os testes (server/testes/instagram.test.mjs e
// historico.test.mjs) rodam sem banco. Decisões:
//  - métrica recusada: o nome citado no erro 100 da Meta sai da lista daquele tipo (metricasRecusadas)
//  - clique no link da bio (feed e carrossel) é o BIO_LINK_CLICKED do profile_activity por action_type. A Meta
//    não manda a ação que ficou em zero: resposta com quebra (ou com total zero) e sem BIO_LINK_CLICKED é 0;
//    resposta sem número nenhum, ou com total e sem quebra, é "sem dado" (null)
//  - item nosso: campo que a leitura de agora não trouxe fica com o do cache; item antigo, sem os campos
//    novos, lê null
//  - histórico: uma leitura por sincronização com insight novo, com a idade em horas. Poda por idade (tudo
//    até 72h; depois 1 por 12h até 14 dias, 1 por dia até 60 dias e 1 por semana), ficando a mais nova de
//    cada janela. Teto de 200 por mídia: passando, a faixa de 72h fica com 1 por hora e depois saem as
//    semanais mais antigas (a mais nova de todas sempre fica)
//  - campo sem dado fica fora da leitura (interpolarIdade ignora); leitura sem número nenhum não entra
// 30/09 (revisão):
//  - limite de uso da Meta inclui o limite por caso de negócio (80000 a 80014: 80002 é o do Instagram, 80004 o
//    dos anúncios) e o HTTP 429 sem corpo de erro da Meta. Falha passageira (limite, rede, 5xx sem corpo de erro
//    da Meta, is_transient) é separada de recusa de verdade (ehErroPassageiro), pra ninguém anotar recusa por dias
//    por causa de um soluço da Meta
//  - download do CDN da Meta (vídeo do reel, imagem do post): o redirecionamento é seguido à mão, com o destino
//    conferido de novo a cada salto (só https nos hosts da Meta, no máximo 3 saltos), e o teto de bytes é contado
//    no caminho. O fetch entra por parâmetro: este módulo não vai à rede (analise.mjs liga as peças)
//  - a forma do historico-midias.json mora aqui (formaHistorico), pra testar sem disco
import { finito, msDe, interpolarIdade } from './estatistica.mjs';

export const TIPOS_MIDIA = ['REELS', 'FEED', 'CAROUSEL_ALBUM'];
// chave interna do clique no link da bio junto das métricas lidas (não é nome de métrica da Meta)
export const BIO = 'bio_link_clicks';
export const CAMPOS_LEITURA = [
  'views', 'reach', 'saved', 'shares', 'likes', 'comments', 'interacoes', 'avgWatchMs', 'skipRate',
  'totalViews', 'viewTotalMs', 'reposts', 'profileVisits', 'follows', 'bioLinkClicks',
];
export const TETO_LEITURAS = 200;
const H_TUDO = 72;
const H_12H = 14 * 24;
const H_DIA = 60 * 24;
const H_SEMANA = 7 * 24;

// ---------- erros da Meta ----------

// o nome aparece solto na mensagem (follows não casa com total_follows)
export const citaNome = (msg, nome) => new RegExp(`(^|[^a-z_])${nome}([^a-z_]|$)`, 'i').test(String(msg ?? ''));

// nome de métrica citado no erro 100 da Meta ("does not support the follows metric", ou a lista
// "must be one of the following values: a, b, c"): o que sair daqui deixa de ser pedido pra esse tipo
export function metricasRecusadas(msg, lista) {
  const t = String(msg ?? '');
  const valores = /one of the following values:\s*([a-z_,\s]+)/i.exec(t);
  if (valores) {
    const ok = new Set(valores[1].split(',').map((s) => s.trim()).filter(Boolean));
    return lista.filter((x) => !ok.has(x));
  }
  return lista.filter((x) => citaNome(t, x));
}

// erro 100 que é recusa da métrica ou do jeito de pedir (e não um problema daquele post)
export const recusaDeMetrica = (msg) => /profile_activity|breakdown|metric_type|following values|does not support|not supported/i.test(String(msg ?? ''));

// limite de uso: 4 (app), 17 (usuário), 32 (página), 613 (chamadas demais), 80000 a 80014 (limite por caso de
// negócio) e 429 (HTTP sem corpo de erro da Meta, que vira o código). Com ele a leitura para de insistir
export const ehCodigoDeLimite = (code) => [4, 17, 32, 613, 429].includes(code) || (Number.isInteger(code) && code >= 80000 && code <= 80014);

// e = o erro do graph() de instagram.mjs ({ status, meta: { code, transitorio, semCorpo } }). Limite: um dos
// códigos acima ou o nosso 502 (rede, tempo esgotado)
export const ehErroDeLimite = (e) => ehCodigoDeLimite(e?.meta?.code) || e?.status === 502;

// falha que passa sozinha (não é recusa do que foi pedido): sem erro da Meta, limite, resposta sem corpo de
// erro da Meta (5xx em HTML, 429 cru: recusa de verdade vem sempre com o erro da Meta), is_transient, ou os
// códigos 1 e 2 (erro desconhecido e serviço fora). Código da Meta acima de 500 não conta sozinho: 506 e
// 1609005 são recusas. Quem anota recusa por dias (o público) confere aqui antes
export const ehErroPassageiro = (e) =>
  !e?.meta || ehErroDeLimite(e) || e.meta.transitorio === true || e.meta.semCorpo === true || [1, 2].includes(e.meta.code);

// campos extras da lista de mídias que o erro 100 cita ("children{id}" é citado como children).
// Erro que fala de campo sem citar nenhum dos extras: todos saem
export function extrasRecusados(msg, extras) {
  const t = String(msg ?? '');
  const citados = extras.filter((x) => citaNome(t, x.split('{')[0]));
  if (citados.length) return citados;
  return /field/i.test(t) ? [...extras] : [];
}

// ---------- profile_activity ----------

const numero = (v) => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);

// resposta de GET {midia}/insights?metric=profile_activity&breakdown=action_type
// → { total, acoes: { BIO_LINK_CLICKED: 2, CALL: 1, ... }, bioLinkClicks }. Aceita total_value.breakdowns[].results[]
// ({ dimension_values: ['BIO_LINK_CLICKED'], value }) e values[0].value em objeto ({ BIO_LINK_CLICKED: 2 })
export function lerAtividadePerfil(resposta) {
  const lista = Array.isArray(resposta?.data) ? resposta.data : [];
  const x = lista.find((d) => d?.name === 'profile_activity') ?? lista[0] ?? null;
  const acoes = {};
  const somar = (k, v) => {
    const chave = String(k ?? '').trim().toUpperCase();
    const n = numero(v);
    if (chave && Number.isFinite(n)) acoes[chave] = (acoes[chave] ?? 0) + n;
  };
  const tv = x?.total_value;
  for (const b of Array.isArray(tv?.breakdowns) ? tv.breakdowns : []) {
    const i = Math.max(0, Array.isArray(b?.dimension_keys) ? b.dimension_keys.indexOf('action_type') : 0);
    for (const r of Array.isArray(b?.results) ? b.results : []) somar(r?.dimension_values?.[i], r?.value);
  }
  const v0 = Array.isArray(x?.values) ? x.values[0]?.value : undefined;
  if (!Object.keys(acoes).length && v0 && typeof v0 === 'object' && !Array.isArray(v0)) {
    for (const [k, v] of Object.entries(v0)) somar(k, v);
  }
  const temAcao = Object.keys(acoes).length > 0;
  const direto = [tv?.value, v0].map(numero).find(Number.isFinite);
  const total = direto ?? (temAcao ? Object.values(acoes).reduce((s, v) => s + v, 0) : null);
  const bioLinkClicks = Object.hasOwn(acoes, 'BIO_LINK_CLICKED') ? acoes.BIO_LINK_CLICKED : temAcao || total === 0 ? 0 : null;
  return { total, acoes, bioLinkClicks };
}

// ---------- item nosso ----------

// o que a Graph devolve de insight por mídia muda com o tipo (media_product_type + media_type)
export const tipoInsights = (m) => (m?.media_product_type === 'REELS' ? 'REELS' : m?.media_type === 'CAROUSEL_ALBUM' ? 'CAROUSEL_ALBUM' : 'FEED');

// URL do vídeo (CDN do Instagram, assinada e com validade): só https; a sincronização renova
export const urlVideo = (m) => (/^https:\/\//i.test(m?.media_url ?? '') && m.media_type !== 'IMAGE' ? m.media_url : '');

// ---------- download do CDN da Meta ----------

const HOST_CDN = /(^|\.)(cdninstagram\.com|fbcdn\.net)$/i;
export const SALTOS_CDN = 3;
const REDIRECIONAMENTO = new Set([301, 302, 303, 307, 308]);

// link do CDN da Meta: só https nos hosts da Meta e, com agoraMs, dentro da validade (parâmetro oe, hexadecimal,
// com 2 minutos de folga). base: o endereço de onde veio um redirecionamento (Location relativo).
// { ok: true, url } | { ok: false, vencido }
export function linkDoCdn(u, { base = null, agoraMs = null } = {}) {
  const s = String(u ?? '').trim();
  if (!s) return { ok: false, vencido: false };
  let url;
  try {
    url = base ? new URL(s, base) : new URL(s);
  } catch {
    return { ok: false, vencido: false };
  }
  if (url.protocol !== 'https:' || !HOST_CDN.test(url.hostname)) return { ok: false, vencido: false };
  const oe = url.searchParams.get('oe');
  if (finito(agoraMs) && oe && /^[0-9a-f]+$/i.test(oe) && parseInt(oe, 16) * 1000 < agoraMs + 120_000) return { ok: false, vencido: true };
  return { ok: true, url: url.toString() };
}

// erro do download sem status HTTP. motivo: 'rede', 'redirecionamento', 'recusado' (com statusCdn), 'grande',
// 'vazio' ou 'disco'; quem chama traduz pro texto dele (vídeo ou imagem)
export const erroDownload = (motivo, statusCdn = null) => Object.assign(new Error(`Download do CDN da Meta: ${motivo}`), { motivo, statusCdn });

// GET no CDN com o redirecionamento seguido à mão: o automático do fetch seguiria um 30x pra qualquer host
// (inclusive http ou 127.0.0.1), e o filtro de host valia só pro primeiro endereço. Cada destino passa de novo
// pelo linkDoCdn (a validade não: link vencido volta 403, que quem chama já traduz), no máximo 3 saltos.
// buscar = o fetch. Devolve a resposta final; quem chama confere o status
export async function abrirNoCdn(url, { buscar, sinal = null, saltos = SALTOS_CDN } = {}) {
  let atual = url;
  for (let n = 0; ; n++) {
    let r;
    try {
      r = await buscar(atual, { redirect: 'manual', signal: sinal });
    } catch {
      throw erroDownload('rede');
    }
    if (!REDIRECIONAMENTO.has(r.status)) return r;
    await r.body?.cancel().catch(() => {});
    const v = n < saltos ? linkDoCdn(r.headers.get('location'), { base: atual }) : { ok: false };
    if (!v.ok) throw erroDownload('redirecionamento', r.status);
    atual = v.url;
  }
}

// conta os bytes no caminho e para ao passar do teto (erro 'grande'): resposta sem content-length não vai inteira
// pra memória nem pro disco antes do corte. conta.bytes fica com o total que passou
export async function* comTeto(fonte, maximo, conta = { bytes: 0 }) {
  for await (const pedaco of fonte) {
    conta.bytes += pedaco?.byteLength ?? pedaco?.length ?? 0;
    if (conta.bytes > maximo) throw erroDownload('grande');
    yield pedaco;
  }
}

// m: a mídia da Graph; ins: as métricas lidas agora (null = sem leitura nova de insight: fica o número do
// cache; curtidas e comentários vêm da mídia); velho: o item do cache. ins[BIO] undefined = o clique no
// link da bio não foi lido agora (fica o do cache). em: quando o insight foi lido
export function itemProprio(m, ins, velho, { tipo, username, erro, em } = {}) {
  const v = velho ?? {};
  const de = (k, antigo) => (ins ? ins[k] ?? null : v[antigo] ?? null);
  const imagem = m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM';
  const filhos = Array.isArray(m.children?.data) ? m.children.data.length : null;
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
    totalViews: de('total_views', 'totalViews'),
    viewTotalMs: de('ig_reels_video_view_total_time', 'viewTotalMs'),
    reposts: de('reposts', 'reposts'),
    bioLinkClicks: ins && ins[BIO] !== undefined ? ins[BIO] ?? null : v.bioLinkClicks ?? null,
    // da mídia (não é insight): quando a Meta não mandou o campo, fica o do cache
    audioTipo: typeof m.media_audio_type === 'string' && m.media_audio_type ? m.media_audio_type : v.audioTipo ?? null,
    noFeed: typeof m.is_shared_to_feed === 'boolean' ? m.is_shared_to_feed : v.noFeed ?? null,
    nSlides: m.media_type === 'CAROUSEL_ALBUM' ? filhos ?? v.nSlides ?? null : null,
    mediaType: m.media_type ?? v.mediaType ?? null,
    insightsEm: ins ? em ?? null : v.insightsEm ?? null,
    relativo: null,
    semRegua: false,
    caseId: v.caseId ?? null,
    ...(erro ? { erro } : {}),
  };
}

// o resumo que vai pro item do cronograma (reel.metricas): a mídia ligada à peça e a data da leitura
export function metricasDaPeca(m, em) {
  const n = (x) => (finito(x) ? x : null);
  return {
    midiaId: m.midiaId,
    thumb: m.thumb ?? '',
    timestamp: m.timestamp ?? '',
    views: n(m.views),
    reach: n(m.reach),
    saved: n(m.saved),
    shares: n(m.shares),
    likes: n(m.likes),
    comments: n(m.comments),
    relativo: n(m.relativo),
    avgWatchMs: n(m.avgWatchMs),
    skipRate: n(m.skipRate),
    interacoes: n(m.interacoes),
    profileVisits: n(m.profileVisits),
    follows: n(m.follows),
    bioLinkClicks: n(m.bioLinkClicks),
    tipo: TIPOS_MIDIA.includes(m.tipo) ? m.tipo : 'REELS',
    em: em ?? null,
  };
}

// ---------- histórico por idade ----------

const ID_MIDIA = /^\d{1,40}$/;
const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

// o historico-midias.json com a forma garantida: { versao: 1, midias: { [midiaId]: { publicadoEm, tipo, leituras } } }.
// Só id numérico da Meta vira chave (nada de __proto__ vindo de arquivo editado à mão); leitura sem idade sai
export function formaHistorico(bruto) {
  const midias = {};
  for (const [id, m] of Object.entries(objeto(objeto(bruto).midias))) {
    if (!ID_MIDIA.test(id) || !Array.isArray(m?.leituras)) continue;
    midias[id] = {
      publicadoEm: m.publicadoEm ?? null,
      tipo: m.tipo ?? null,
      leituras: m.leituras.filter((l) => l && typeof l === 'object' && finito(l.idadeH)),
    };
  }
  return { versao: 1, midias };
}

// a leitura do item lido agora: idade em horas desde a publicação e só os campos com número.
// null = sem data de publicação válida ou sem número nenhum (não entra)
export function leituraDoItem(item, em) {
  const pub = msDe(item?.timestamp);
  const quando = msDe(em);
  if (pub == null || quando == null) return null;
  const l = { em: new Date(quando).toISOString(), idadeH: Math.max(0, Math.round(((quando - pub) / 3_600_000) * 100) / 100) };
  let algum = false;
  for (const k of CAMPOS_LEITURA) {
    if (finito(item[k])) {
      l[k] = item[k];
      algum = true;
    }
  }
  return algum ? l : null;
}

// a janela da poda pela idade: null = até 72h (fica tudo); depois "12h:N", "1d:N" ou "7d:N"
export function faixaDaIdade(h) {
  if (!finito(h) || h <= H_TUDO) return null;
  if (h <= H_12H) return `12h:${Math.ceil((h - H_TUDO) / 12)}`;
  if (h <= H_DIA) return `1d:${Math.ceil((h - H_12H) / 24)}`;
  return `7d:${Math.ceil((h - H_DIA) / H_SEMANA)}`;
}

// fica a leitura mais nova de cada janela; janela null = fica tudo (ordem: idade crescente)
function maisNovaPorJanela(ordem, janela) {
  const ultima = new Map();
  ordem.forEach((l, i) => {
    const j = janela(l.idadeH);
    if (j != null) ultima.set(j, i);
  });
  return ordem.filter((l, i) => {
    const j = janela(l.idadeH);
    return j == null || ultima.get(j) === i;
  });
}

// poda (regra no cabeçalho). Devolve em ordem de idade; a mesma leitura (mesmo em) conta uma vez, a última
export function podar(leituras, teto = TETO_LEITURAS) {
  const porEm = new Map();
  for (const l of Array.isArray(leituras) ? leituras : []) if (l && typeof l === 'object' && finito(l.idadeH)) porEm.set(String(l.em ?? l.idadeH), l);
  const ordem = [...porEm.values()].sort((a, b) => a.idadeH - b.idadeH);
  let fica = maisNovaPorJanela(ordem, faixaDaIdade);
  if (fica.length > teto) fica = maisNovaPorJanela(fica, (h) => faixaDaIdade(h) ?? `1h:${Math.floor(h)}`);
  if (fica.length > teto) {
    const semanais = fica.slice(0, -1).filter((l) => faixaDaIdade(l.idadeH)?.startsWith('7d:'));
    const sai = new Set(semanais.slice(0, fica.length - teto));
    fica = fica.filter((l) => !sai.has(l));
  }
  if (fica.length > teto) fica = [...fica.slice(0, teto - 1), fica.at(-1)];
  return fica;
}

// entrada do histórico com a leitura nova (podada). Item sem leitura válida: a entrada fica como estava
export function juntarLeitura(entrada, item, em) {
  const l = leituraDoItem(item, em);
  if (!l) return entrada ?? null;
  const antes = Array.isArray(entrada?.leituras) ? entrada.leituras.filter((x) => x?.em !== l.em) : [];
  return {
    publicadoEm: new Date(msDe(item.timestamp)).toISOString(),
    tipo: TIPOS_MIDIA.includes(item.tipo) ? item.tipo : entrada?.tipo ?? null,
    leituras: podar([...antes, l]),
  };
}

// valor acumulado de um campo numa idade (horas), por interpolação entre as leituras guardadas.
// midia = uma entrada de historico-midias.json (midias[id]); null quando não dá pra saber
export const valorNaIdade = (midia, campo, horas) => interpolarIdade(midia?.leituras ?? [], campo, horas);
