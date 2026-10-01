// Testes das partes puras da leitura do Instagram (instagram-motor.mjs) e da fila pesada (node --test).
// Rodar: npm run testar. Nada de disco nem de rede: nenhum import de db.mjs ou instagram.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  metricasRecusadas, recusaDeMetrica, extrasRecusados, lerAtividadePerfil, itemProprio, metricasDaPeca, tipoInsights, citaNome, BIO,
  ehCodigoDeLimite, ehErroDeLimite, ehErroPassageiro, linkDoCdn, abrirNoCdn, comTeto, erroDownload, SALTOS_CDN,
} from '../instagram-motor.mjs';
import * as fila from '../fila-pesada.mjs';

const REELS = [
  'views', 'reach', 'saved', 'shares', 'likes', 'comments', 'total_interactions', 'ig_reels_avg_watch_time', 'reels_skip_rate', 'profile_visits', 'follows',
  'ig_reels_video_view_total_time', 'reposts', 'total_views',
];
const FEED = ['views', 'reach', 'saved', 'shares', 'likes', 'comments', 'total_interactions', 'profile_visits', 'follows', 'reposts', 'total_views'];
const EXTRAS = ['media_audio_type', 'is_shared_to_feed', 'children{id}'];
const EM = '2026-09-30T12:00:00.000Z';

test('metricasRecusadas: sai só o nome citado no erro 100', () => {
  assert.deepEqual(metricasRecusadas('(#100) The Media Insights API does not support the follows metric for this media product type', REELS), ['follows']);
  assert.deepEqual(metricasRecusadas('(#100) does not support the profile_visits, follows metrics', REELS), ['profile_visits', 'follows']);
  // total_views não arrasta views, nem reach arrasta outra
  assert.deepEqual(metricasRecusadas('(#100) The Media Insights API does not support the total_views metric', REELS), ['total_views']);
  assert.deepEqual(metricasRecusadas('reposts is not a valid metric', FEED), ['reposts']);
  assert.deepEqual(metricasRecusadas('(#100) ig_reels_video_view_total_time is not available', REELS), ['ig_reels_video_view_total_time']);
  assert.deepEqual(metricasRecusadas('(#100) An unknown error occurred', REELS), []);
  assert.deepEqual(metricasRecusadas(undefined, REELS), []);
  assert.ok(citaNome('(views)', 'views'));
  assert.ok(!citaNome('total_views', 'views'));
});

test('metricasRecusadas: lista "one of the following values" tira o que ficou de fora', () => {
  const msg = '(#100) metric[11] must be one of the following values: views, reach, saved, shares, likes, comments, total_interactions, ig_reels_avg_watch_time, reels_skip_rate, reposts';
  assert.deepEqual(metricasRecusadas(msg, REELS), ['profile_visits', 'follows', 'ig_reels_video_view_total_time', 'total_views']);
  assert.deepEqual(metricasRecusadas(msg, ['views', 'reach']), []);
});

test('recusa de métrica e campos extras recusados', () => {
  assert.ok(recusaDeMetrica('(#100) The Media Insights API does not support the profile_activity metric for this media product type'));
  assert.ok(recusaDeMetrica('(#100) metric_type must be total_value when breakdown is set'));
  assert.ok(recusaDeMetrica('(#100) Incompatible breakdown for this metric'));
  assert.ok(!recusaDeMetrica('(#100) Unsupported get request. Object with ID 123 does not exist'));
  assert.ok(!recusaDeMetrica(null));
  assert.deepEqual(extrasRecusados('(#100) Tried accessing nonexisting field (media_audio_type) on node type (ShadowIGMedia)', EXTRAS), ['media_audio_type']);
  assert.deepEqual(extrasRecusados('(#100) Tried accessing nonexisting field (children) on node type (ShadowIGMedia)', EXTRAS), ['children{id}']);
  assert.deepEqual(extrasRecusados('(#100) Unknown fields in the request', EXTRAS), EXTRAS);
  assert.deepEqual(extrasRecusados('(#100) Invalid cursor', EXTRAS), []);
  assert.deepEqual(extrasRecusados('(#100) Tried accessing nonexisting field (x)', []), []);
});

test('profile_activity: total_value.breakdowns com BIO_LINK_CLICKED', () => {
  const r = {
    data: [{
      name: 'profile_activity', period: 'lifetime',
      total_value: { value: 5, breakdowns: [{ dimension_keys: ['action_type'], results: [
        { dimension_values: ['BIO_LINK_CLICKED'], value: 3 },
        { dimension_values: ['CALL'], value: 2 },
      ] }] },
    }],
  };
  assert.deepEqual(lerAtividadePerfil(r), { total: 5, acoes: { BIO_LINK_CLICKED: 3, CALL: 2 }, bioLinkClicks: 3 });
});

test('profile_activity: a Meta não manda ação com zero', () => {
  const soLigacao = { data: [{ name: 'profile_activity', total_value: { value: 1, breakdowns: [{ dimension_keys: ['action_type'], results: [{ dimension_values: ['CALL'], value: 1 }] }] } }] };
  assert.equal(lerAtividadePerfil(soLigacao).bioLinkClicks, 0);
  const zero = { data: [{ name: 'profile_activity', total_value: { value: 0 } }] };
  assert.deepEqual(lerAtividadePerfil(zero), { total: 0, acoes: {}, bioLinkClicks: 0 });
  // total sem a quebra: não dá pra saber quantos foram no link
  const semQuebra = { data: [{ name: 'profile_activity', total_value: { value: 7 } }] };
  assert.equal(lerAtividadePerfil(semQuebra).bioLinkClicks, null);
});

test('profile_activity: values[0].value em objeto, texto e chave minúscula', () => {
  const r = { data: [{ name: 'profile_activity', values: [{ value: { bio_link_clicked: '4', EMAIL: 1 } }] }] };
  assert.deepEqual(lerAtividadePerfil(r), { total: 5, acoes: { BIO_LINK_CLICKED: 4, EMAIL: 1 }, bioLinkClicks: 4 });
  const duasChaves = { data: [{ name: 'profile_activity', total_value: { breakdowns: [{ dimension_keys: ['media_product_type', 'action_type'], results: [{ dimension_values: ['POST', 'BIO_LINK_CLICKED'], value: 2 }] }] } }] };
  assert.equal(lerAtividadePerfil(duasChaves).bioLinkClicks, 2);
});

test('profile_activity: vazio é sem dado, nunca zero', () => {
  const vazio = { total: null, acoes: {}, bioLinkClicks: null };
  assert.deepEqual(lerAtividadePerfil({ data: [] }), vazio);
  assert.deepEqual(lerAtividadePerfil(null), vazio);
  assert.deepEqual(lerAtividadePerfil({ data: [{ name: 'profile_activity', total_value: { breakdowns: [{ results: [] }] } }] }), vazio);
  assert.deepEqual(lerAtividadePerfil({ data: 'x' }), vazio);
});

test('tipo de insight pela mídia', () => {
  assert.equal(tipoInsights({ media_product_type: 'REELS', media_type: 'VIDEO' }), 'REELS');
  assert.equal(tipoInsights({ media_product_type: 'FEED', media_type: 'CAROUSEL_ALBUM' }), 'CAROUSEL_ALBUM');
  assert.equal(tipoInsights({ media_product_type: 'FEED', media_type: 'IMAGE' }), 'FEED');
});

test('itemProprio: campos novos da leitura de agora', () => {
  const m = {
    id: '17900000000000001', media_type: 'VIDEO', media_product_type: 'REELS', permalink: 'https://www.instagram.com/reel/ABC/',
    timestamp: '2026-09-20T15:00:00+0000', media_url: 'https://scontent.cdninstagram.com/v.mp4', thumbnail_url: 'https://scontent.cdninstagram.com/t.jpg',
    like_count: 10, comments_count: 2, username: 'legalizai.app', media_audio_type: 'ORIGINAL_SOUND', is_shared_to_feed: true,
  };
  const ins = {
    views: 500, reach: 400, saved: 3, shares: 5, likes: 11, comments: 2, total_interactions: 21, ig_reels_avg_watch_time: 7100, reels_skip_rate: 46.2,
    ig_reels_video_view_total_time: 3_550_000, reposts: 1, total_views: 520,
  };
  const it = itemProprio(m, ins, null, { tipo: 'REELS', username: 'legalizai.app', em: EM });
  assert.equal(it.tipo, 'REELS');
  assert.equal(it.views, 500);
  assert.equal(it.likes, 11);
  assert.equal(it.interacoes, 21);
  assert.equal(it.avgWatchMs, 7100);
  assert.equal(it.skipRate, 46.2);
  assert.equal(it.totalViews, 520);
  assert.equal(it.viewTotalMs, 3_550_000);
  assert.equal(it.reposts, 1);
  assert.equal(it.profileVisits, null);
  assert.equal(it.bioLinkClicks, null);
  assert.equal(it.audioTipo, 'ORIGINAL_SOUND');
  assert.equal(it.noFeed, true);
  assert.equal(it.nSlides, null);
  assert.equal(it.mediaType, 'VIDEO');
  assert.equal(it.insightsEm, EM);
  assert.equal(it.video, m.media_url);
  assert.equal(it.thumb, m.thumbnail_url);
});

test('itemProprio: item antigo do cache sem os campos novos lê null', () => {
  const velho = {
    midiaId: '17900000000000001', views: 300, reach: 250, saved: 1, shares: 2, likes: 9, comments: 1, interacoes: 13, avgWatchMs: 6000, skipRate: 50,
    insightsEm: '2026-09-24T17:57:14.644Z', caseId: 'case_abc12345',
  };
  // a Meta recusou os campos extras: a mídia vem sem eles
  const m = { id: '17900000000000001', media_type: 'VIDEO', media_product_type: 'REELS', timestamp: '2026-09-20T15:00:00+0000', like_count: 12 };
  const it = itemProprio(m, null, velho, { tipo: 'REELS' });
  assert.equal(it.views, 300);
  assert.equal(it.likes, 12);
  assert.equal(it.insightsEm, velho.insightsEm);
  assert.equal(it.caseId, 'case_abc12345');
  for (const k of ['totalViews', 'viewTotalMs', 'reposts', 'bioLinkClicks', 'audioTipo', 'noFeed', 'nSlides']) assert.equal(it[k], null, k);
  assert.equal(it.mediaType, 'VIDEO');
});

test('itemProprio: carrossel com slides e clique no link da bio', () => {
  const c = {
    id: '17900000000000002', media_type: 'CAROUSEL_ALBUM', media_product_type: 'FEED', timestamp: '2026-09-21T15:00:00+0000',
    media_url: 'https://scontent.cdninstagram.com/1.jpg', children: { data: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] },
  };
  const lido = itemProprio(c, { views: 10, follows: 1, profile_visits: 4, [BIO]: 2 }, null, { tipo: 'CAROUSEL_ALBUM', em: EM });
  assert.equal(lido.nSlides, 3);
  assert.equal(lido.bioLinkClicks, 2);
  assert.equal(lido.follows, 1);
  assert.equal(lido.profileVisits, 4);
  assert.equal(lido.thumb, c.media_url);
  // o clique não foi lido agora: fica o do cache; slides sem children: fica o do cache
  const semFilhos = { ...c, children: undefined };
  const cache = itemProprio(semFilhos, { views: 12 }, { bioLinkClicks: 4, nSlides: 5 }, { tipo: 'CAROUSEL_ALBUM', em: EM });
  assert.equal(cache.bioLinkClicks, 4);
  assert.equal(cache.nSlides, 5);
  // lido agora e sem dado: null (não o cache)
  assert.equal(itemProprio(c, { views: 12, [BIO]: null }, { bioLinkClicks: 4 }, { tipo: 'CAROUSEL_ALBUM', em: EM }).bioLinkClicks, null);
  // erro da leitura vai junto
  assert.equal(itemProprio(c, null, null, { tipo: 'CAROUSEL_ALBUM', erro: 'A Meta recusou' }).erro, 'A Meta recusou');
});

test('metricasDaPeca: o resumo do item do cronograma com os campos novos', () => {
  const m = {
    midiaId: '17900000000000001', thumb: 't', timestamp: '2026-09-20T15:00:00+0000', views: 500, reach: 400, saved: 3, shares: 5, likes: 11, comments: 2,
    relativo: 1.4, avgWatchMs: 7100, skipRate: 46.2, interacoes: 21, profileVisits: null, follows: undefined, bioLinkClicks: 'x', tipo: 'REELS',
  };
  assert.deepEqual(metricasDaPeca(m, EM), {
    midiaId: m.midiaId, thumb: 't', timestamp: m.timestamp, views: 500, reach: 400, saved: 3, shares: 5, likes: 11, comments: 2, relativo: 1.4,
    avgWatchMs: 7100, skipRate: 46.2, interacoes: 21, profileVisits: null, follows: null, bioLinkClicks: null, tipo: 'REELS', em: EM,
  });
  // item antigo sem tipo era reel
  assert.equal(metricasDaPeca({ midiaId: '1' }, EM).tipo, 'REELS');
  assert.equal(metricasDaPeca({ midiaId: '1', tipo: 'FEED' }, EM).tipo, 'FEED');
});

test('limite de uso da Meta: os códigos de sempre, 80000 a 80014 e o 429', () => {
  for (const c of [4, 17, 32, 613, 429, 80000, 80001, 80002, 80004, 80014]) assert.ok(ehCodigoDeLimite(c), String(c));
  for (const c of [79999, 80015, 100, 190, 1, 2, 10, 500, 503, 0, null, undefined, '80002', 80002.5]) assert.ok(!ehCodigoDeLimite(c), String(c));
  // o erro do graph(): o código mora em meta; o 502 sem meta é o nosso (rede, tempo esgotado)
  const meta = (code, extra = {}) => ({ status: 400, meta: { code, sub: 0, message: '', transitorio: false, semCorpo: false, ...extra } });
  assert.ok(ehErroDeLimite(meta(80002)));
  assert.ok(ehErroDeLimite({ status: 502 }));
  assert.ok(!ehErroDeLimite(meta(100)));
  assert.ok(!ehErroDeLimite(null));
});

test('falha passageira x recusa: só recusa de verdade vira "a Meta não devolve isso"', () => {
  const meta = (code, extra = {}) => ({ status: 400, meta: { code, sub: 0, message: '', transitorio: false, semCorpo: false, ...extra } });
  for (const [e, nome] of [
    [new Error('rede'), 'sem meta'],
    [{ status: 502 }, 'rede ou tempo esgotado'],
    [meta(80002), 'limite do Instagram'],
    [meta(4), 'limite do app'],
    [meta(503, { semCorpo: true }), '5xx em HTML'],
    [meta(429, { semCorpo: true }), '429 cru'],
    [meta(1), 'erro desconhecido'],
    [meta(2), 'serviço fora'],
    [meta(100, { transitorio: true }), 'is_transient'],
  ]) {
    assert.ok(ehErroPassageiro(e), nome);
  }
  for (const [e, nome] of [
    [meta(100), 'métrica recusada'],
    [meta(10), 'sem permissão'],
    [meta(190), 'token'],
    [meta(506), 'código da Meta acima de 500'],
    [meta(1609005), 'código grande da Meta'],
  ]) {
    assert.ok(!ehErroPassageiro(e), nome);
  }
});

// ---------- download do CDN da Meta ----------

const CDN = 'https://scontent.cdninstagram.com/v/t50/video.mp4?oe=6A000000';
const AGORA = Date.UTC(2026, 8, 30, 12);
const oeHex = (ms) => Math.floor(ms / 1000).toString(16).toUpperCase();

test('link do CDN: só https nos hosts da Meta, com a validade do oe', () => {
  assert.deepEqual(linkDoCdn('https://scontent-gru2-1.cdninstagram.com/v.mp4'), { ok: true, url: 'https://scontent-gru2-1.cdninstagram.com/v.mp4' });
  assert.equal(linkDoCdn('https://video.fbhe1-1.fna.fbcdn.net/o1/v.mp4').ok, true);
  for (const ruim of [
    'http://scontent.cdninstagram.com/v.mp4', 'https://evil.com/v.mp4', 'https://fbcdn.net.evil.com/v.mp4', 'https://xfbcdn.net/v.mp4',
    'https://127.0.0.1/v.mp4', 'https://cdninstagram.com@evil.com/v.mp4', 'file:///C:/Windows/win.ini', 'javascript:alert(1)', '', null, undefined, 'não é url',
  ]) {
    assert.equal(linkDoCdn(ruim).ok, false, String(ruim));
  }
  // validade: vencido (ou vencendo em menos de 2 minutos) só conta com agoraMs
  const vencido = `https://scontent.cdninstagram.com/v.mp4?oe=${oeHex(AGORA - 60_000)}`;
  assert.deepEqual(linkDoCdn(vencido, { agoraMs: AGORA }), { ok: false, vencido: true });
  assert.equal(linkDoCdn(`https://scontent.cdninstagram.com/v.mp4?oe=${oeHex(AGORA + 60_000)}`, { agoraMs: AGORA }).vencido, true);
  assert.equal(linkDoCdn(`https://scontent.cdninstagram.com/v.mp4?oe=${oeHex(AGORA + 3_600_000)}`, { agoraMs: AGORA }).ok, true);
  assert.equal(linkDoCdn(vencido).ok, true);
  // Location relativo resolve contra o endereço de onde veio; vazio nunca vira a própria base
  assert.deepEqual(linkDoCdn('/outro/v2.mp4', { base: CDN }), { ok: true, url: 'https://scontent.cdninstagram.com/outro/v2.mp4' });
  assert.equal(linkDoCdn('//evil.com/v.mp4', { base: CDN }).ok, false);
  assert.equal(linkDoCdn('http://127.0.0.1:4317/api/estado', { base: CDN }).ok, false);
  for (const vazio of ['', '   ', null, undefined]) assert.equal(linkDoCdn(vazio, { base: CDN }).ok, false, String(vazio));
});

// fetch falso: cada endereço devolve o que o mapa diz; guarda o que foi pedido e as opções
function fetchFalso(mapa) {
  const pedidos = [];
  const buscar = async (url, opcoes) => {
    pedidos.push({ url, opcoes });
    const r = mapa[url];
    if (!r) throw new TypeError('fetch failed');
    return { status: r.status, ok: r.status >= 200 && r.status < 300, headers: new Headers(r.location ? { location: r.location } : {}), body: r.body ?? null };
  };
  return { buscar, pedidos };
}

test('abrirNoCdn: redirecionamento seguido à mão, destino conferido a cada salto', async () => {
  let cancelados = 0;
  const corpo = { cancel: async () => { cancelados++; } };
  const B = 'https://video.xx.fbcdn.net/b.mp4';
  const { buscar, pedidos } = fetchFalso({
    [CDN]: { status: 302, location: B, body: corpo },
    [B]: { status: 301, location: '/c.mp4' },
    'https://video.xx.fbcdn.net/c.mp4': { status: 200 },
  });
  const r = await abrirNoCdn(CDN, { buscar });
  assert.equal(r.status, 200);
  assert.deepEqual(pedidos.map((p) => p.url), [CDN, B, 'https://video.xx.fbcdn.net/c.mp4']);
  assert.ok(pedidos.every((p) => p.opcoes.redirect === 'manual'), 'o fetch nunca segue sozinho');
  assert.equal(cancelados, 1, 'o corpo do 30x é descartado');
  // sem redirecionamento: a resposta volta como veio (quem chama confere o status)
  const direto = fetchFalso({ [CDN]: { status: 403 } });
  assert.equal((await abrirNoCdn(CDN, { buscar: direto.buscar })).status, 403);
});

test('abrirNoCdn: 30x pra fora da Meta, sem Location ou saltos demais param antes de pedir', async () => {
  const pra = (location, status = 302) => fetchFalso({ [CDN]: { status, location } });
  for (const destino of ['http://127.0.0.1:4317/api/estado', 'https://evil.com/v.mp4', 'http://scontent.cdninstagram.com/v.mp4', undefined]) {
    const f = pra(destino, 307);
    await assert.rejects(() => abrirNoCdn(CDN, { buscar: f.buscar }), (e) => e.motivo === 'redirecionamento' && e.statusCdn === 307, String(destino));
    assert.equal(f.pedidos.length, 1, `nada foi pedido em ${destino}`);
  }
  // 3 saltos passam; o quarto não é seguido
  const cadeia = {};
  const url = (i) => `https://s${i}.cdninstagram.com/v.mp4`;
  for (let i = 0; i < SALTOS_CDN + 1; i++) cadeia[url(i)] = { status: 302, location: url(i + 1) };
  cadeia[url(SALTOS_CDN + 1)] = { status: 200 };
  const longa = fetchFalso(cadeia);
  await assert.rejects(() => abrirNoCdn(url(0), { buscar: longa.buscar }), (e) => e.motivo === 'redirecionamento');
  assert.equal(longa.pedidos.length, SALTOS_CDN + 1);
  delete cadeia[url(0)];
  assert.equal((await abrirNoCdn(url(1), { buscar: fetchFalso(cadeia).buscar })).status, 200);
  // rede caída vira motivo 'rede'
  await assert.rejects(() => abrirNoCdn('https://s9.cdninstagram.com/x', { buscar: fetchFalso({}).buscar }), (e) => e.motivo === 'rede');
  assert.equal(erroDownload('grande').statusCdn, null);
});

test('comTeto: conta os bytes no caminho e para ao passar do teto', async () => {
  async function* pedacos(n, tamanho) {
    for (let i = 0; i < n; i++) yield new Uint8Array(tamanho);
  }
  const conta = { bytes: 0 };
  const passaram = [];
  await assert.rejects(async () => {
    for await (const p of comTeto(pedacos(100, 4), 10, conta)) passaram.push(p.length);
  }, (e) => e.motivo === 'grande');
  assert.deepEqual(passaram, [4, 4], 'o pedaço que passa do teto não sai');
  assert.equal(conta.bytes, 12, 'e o resto nem é lido');
  const inteiro = { bytes: 0 };
  let n = 0;
  for await (const _ of comTeto(pedacos(3, 4), 12, inteiro)) n++;
  assert.equal(n, 3);
  assert.equal(inteiro.bytes, 12);
});

test('fila pesada: uma vaga só no servidor', () => {
  assert.equal(fila.ocupada(), null);
  assert.equal(fila.atual(), null);
  assert.equal(fila.reservar('pesada', 'analise:1'), true);
  assert.equal(fila.ocupada(), 'pesada');
  assert.equal(fila.reservar('pesada', 'ia:2'), false);
  // não é reentrante, e outro nome também espera
  assert.equal(fila.reservar('pesada', 'analise:1'), false);
  assert.equal(fila.reservar('ia', 'ia:2'), false);
  // quem não reservou não solta
  assert.equal(fila.liberar('pesada', 'ia:2'), false);
  assert.equal(fila.liberar('ia'), false);
  assert.equal(fila.ocupada(), 'pesada');
  const a = fila.atual();
  assert.equal(a.dono, 'analise:1');
  assert.ok(!Number.isNaN(Date.parse(a.desde)));
  assert.equal(fila.liberar('pesada', 'analise:1'), true);
  assert.equal(fila.ocupada(), null);
  assert.equal(fila.liberar('pesada'), false);
  // sem o dono, solta a vaga daquele nome
  assert.equal(fila.reservar('pesada', 'ia:2'), true);
  assert.equal(fila.liberar('pesada'), true);
  assert.equal(fila.ocupada(), null);
});

test('zero travessão nos arquivos desta parte', () => {
  const traco = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
  for (const f of ['instagram.mjs', 'instagram-motor.mjs', 'historico.mjs', 'fila-pesada.mjs', 'analise.mjs', 'testes/instagram.test.mjs', 'testes/historico.test.mjs']) {
    assert.ok(!traco.test(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')), f);
  }
});
