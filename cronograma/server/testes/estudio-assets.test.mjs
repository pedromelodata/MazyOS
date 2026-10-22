// 22/10 (Pedro): testes do banco de assets do editor de Design do Ateliê (estudio-assets.mjs): o tamanho da imagem
// pelo cabeçalho (PNG, JPEG com a orientação do EXIF, WEBP VP8, VP8L e VP8X), as tags, o catálogo da base, as rotas
// num servidor de verdade numa porta livre (lista com busca e categoria, arquivo com cache e nosniff, upload pelos
// bytes com os tetos, editar, esconder, apagar e restaurar) e a guarda do banco base de verdade do repo
// (estudio/base: catálogo, arquivos, tamanho total e os documentos importados do destaque).
// A pasta de dados e a base das rotas são temporárias: o banco de verdade (data/) não é lido. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync, readFileSync, rmSync, utimesSync, statSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-estudio-assets-'));
const dados = path.join(raiz, 'data');
const base = path.join(raiz, 'base');
process.env.CRONOGRAMA_DATA = dados;
process.env.CRONOGRAMA_ESTUDIO_BASE = base;
mkdirSync(dados, { recursive: true });
mkdirSync(path.join(base, 'assets'), { recursive: true });
mkdirSync(path.join(base, 'docs'), { recursive: true });
writeFileSync(path.join(dados, 'estilos.json'), '{}');
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({ schemaVersion: 2, reels: [] }));

const TRACO = String.fromCharCode(0x2014);
// travessão e meia-risca montados por código (nenhum aparece no fonte)
const TRACOS_RE = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');
const BASE_REAL = path.join(import.meta.dirname, '..', '..', 'estudio', 'base');

// ---------- imagens de teste (só o cabeçalho importa) ----------

const bytes = (...partes) => Buffer.concat(partes.map((p) => (typeof p === 'string' ? Buffer.from(p, 'latin1') : Buffer.from(p))));
const u32be = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
const u16be = (n) => { const b = Buffer.alloc(2); b.writeUInt16BE(n); return b; };
const u16le = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
const u24le = (n) => Buffer.from([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff]);
const png = (w, h, resto = 64) => bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], u32be(13), 'IHDR', u32be(w), u32be(h), [8, 6, 0, 0, 0], Buffer.alloc(resto, 7));
const jpeg = (w, h, { giro = 0 } = {}) => {
  const app0 = bytes([0xff, 0xe0], u16be(16), 'JFIF\0', [1, 1, 0, 0, 1, 0, 1, 0, 0]);
  const tiff = bytes('MM', [0, 0x2a], u32be(8), u16be(1), u16be(0x0112), u16be(3), u32be(1), u16be(giro), u16be(0), u32be(0));
  const exif = bytes('Exif\0\0', tiff);
  const app1 = giro ? bytes([0xff, 0xe1], u16be(exif.length + 2), exif) : Buffer.alloc(0);
  const sof = bytes([0xff, 0xc0], u16be(17), [8], u16be(h), u16be(w), [3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return bytes([0xff, 0xd8], app0, app1, sof, [0xff, 0xda, 0, 8], Buffer.alloc(40, 3), [0xff, 0xd9]);
};
const webpVp8 = (w, h) => bytes('RIFF', u32be(0), 'WEBP', 'VP8 ', u32be(0), [0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a], u16le(w), u16le(h), Buffer.alloc(20));
const webpVp8l = (w, h) => {
  const v = ((w - 1) | ((h - 1) << 14)) >>> 0;
  const b = Buffer.alloc(4);
  b.writeUInt32LE(v);
  return bytes('RIFF', u32be(0), 'WEBP', 'VP8L', u32be(0), [0x2f], b, Buffer.alloc(20));
};
const webpVp8x = (w, h) => bytes('RIFF', u32be(0), 'WEBP', 'VP8X', u32be(10), [0x10, 0, 0, 0], u24le(w - 1), u24le(h - 1), Buffer.alloc(20));
const SVG = bytes('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>');
const GIF = bytes('GIF89a', [1, 0, 1, 0, 0, 0, 0]);
const PDF = bytes('%PDF-1.7\n', Buffer.alloc(30, 1));

// ---------- a base de teste ----------

writeFileSync(path.join(base, 'assets', 'leo-teste.png'), png(400, 800));
writeFileSync(path.join(base, 'assets', 'fundo-teste.png'), png(1080, 1920));
writeFileSync(path.join(base, 'assets', 'simbolo.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="211" height="211" viewBox="0 0 211 211"><rect width="211" height="211" fill="#f2643c"/></svg>');
const itemBase = (id, arquivo, categoria, extra = {}) => ({
  id, nome: extra.nome ?? id, categoria, tags: extra.tags ?? [], descricao: extra.descricao ?? '', origem: 'base', largura: 100, altura: 100,
  tipo: arquivo.endsWith('.svg') ? 'image/svg+xml' : 'image/png', tamanho: 1, licenca: 'Legalizaí', oculto: false,
  criadoEm: '2026-10-22T12:00:00.000Z', criadoPor: 'Legalizaí', arquivo, fonte: { arquivo: 'x', x: 0, y: 0, escala: 1 },
});
writeFileSync(path.join(base, 'catalogo.json'), JSON.stringify({
  versao: 1,
  assets: [
    itemBase('ast_base_fundo-teste', 'fundo-teste.png', 'fundo', { nome: 'Fundo papel' }),
    itemBase('ast_base_leo-teste', 'leo-teste.png', 'leo', { nome: 'Léo acenando', tags: ['léo', 'acenando'], descricao: 'Léo de corpo inteiro dando oi.' }),
    itemBase('ast_base_simbolo', 'simbolo.svg', 'marca', { nome: 'Símbolo' }),
    itemBase('ast_base_sumido', 'nao-existe.png', 'outro'),
    itemBase('ast_base_categoria-ruim', 'leo-teste.png', 'nenhuma'),
    itemBase('ast_base_leo-teste', 'leo-teste.png', 'leo'),
  ],
}));
writeFileSync(path.join(base, 'docs', 'modelo-a.json'), JSON.stringify({ titulo: 'Modelo A' }));
writeFileSync(path.join(base, 'docs', 'quebrado.json'), '{ isso não é json');

const ea = await import('../estudio-assets.mjs');
const auth = await import('../auth.mjs');
// 100 GB livres, a não ser no teste do espaço
const DISCO_FOLGADO = async () => 100 * 1024 ** 3;
ea.disco.livre = DISCO_FOLGADO;
const LIMITES_ORIGINAIS = { ...ea.LIMITES };
// nenhum design usa nada, a não ser no teste do apagar (o estudio.mjs de verdade não entra aqui)
let usosFalsos = new Map();
ea.usos.de = async (id) => usosFalsos.get(id) ?? [];

// ---------- servidor de verdade numa porta livre ----------

const USUARIO = { id: 'usr_time', nome: 'Pedro Melo', usuario: 'pedro', papel: 'admin' };
const json = (res, codigo, corpo) => {
  if (codigo >= 400) auth.fecharSeCorpoChegando(res.req, res);
  res.writeHead(codigo, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(corpo));
};
// o mesmo do server.mjs (que não dá pra importar sem subir o servidor)
async function corpoJson(req, limite = 1_000_000) {
  const partes = [];
  let total = 0;
  for await (const c of req) {
    total += c.length;
    if (total > limite) throw Object.assign(new Error('Corpo grande demais.'), { status: 413 });
    partes.push(c);
  }
  const s = Buffer.concat(partes, total).toString('utf8');
  return s.trim() ? JSON.parse(s) : {};
}
const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const partes = url.pathname.split('/').filter(Boolean).slice(1).map(decodeURIComponent);
    if (partes[0] === 'estudio' && partes[1] === 'assets') return await ea.rota(req, res, partes.slice(2), { usuario: USUARIO }, { json, corpoJson });
    return json(res, 404, { erro: 'Rota não existe.' });
  } catch (e) {
    if (res.headersSent) return res.end();
    return json(res, e.status ?? 500, { erro: e.message });
  }
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
after(() => servidor.close());

function pedir(caminho, { metodo = 'GET', corpo, cabecalhos = {} } = {}) {
  return new Promise((ok, erro) => {
    const cru = corpo === undefined ? null : Buffer.isBuffer(corpo) ? corpo : Buffer.from(JSON.stringify(corpo));
    // cabeçalho com undefined sai (o teste do chunked tira o content-length)
    const juntos = { ...(cru ? { 'content-length': cru.length } : {}), ...(cru && !Buffer.isBuffer(corpo) ? { 'content-type': 'application/json' } : {}), ...cabecalhos };
    const h = Object.fromEntries(Object.entries(juntos).filter(([, v]) => v !== undefined));
    const req = http.request({ host: '127.0.0.1', port: servidor.address().port, path: caminho, method: metodo, headers: h }, (res) => {
      const pedacos = [];
      res.on('data', (c) => pedacos.push(c));
      res.on('end', () => {
        const bruto = Buffer.concat(pedacos);
        let j = null;
        try {
          j = JSON.parse(bruto.toString('utf8'));
        } catch {}
        ok({ status: res.statusCode, h: res.headers, bruto, j });
      });
    });
    req.on('error', erro);
    req.end(cru ?? undefined);
  });
}
const subir = (nome, conteudo, { categoria, tags, cabecalhos = {} } = {}) => pedir('/api/estudio/assets', {
  metodo: 'POST', corpo: conteudo,
  cabecalhos: {
    'x-nome-arquivo': encodeURIComponent(nome), 'content-type': 'application/octet-stream',
    ...(categoria != null ? { 'x-categoria': encodeURIComponent(categoria) } : {}), ...(tags != null ? { 'x-tags': encodeURIComponent(tags) } : {}), ...cabecalhos,
  },
});
const pastaUploads = path.join(dados, 'estudio', 'assets');
const temporarios = () => (existsSync(pastaUploads) ? readdirSync(pastaUploads).filter((n) => n.includes('.tmp')) : []);
const registro = () => JSON.parse(readFileSync(path.join(dados, 'estudio', 'assets.json'), 'utf8'));

// a limpeza só depois do último await do topo (o node:test roda os after do topo quando os testes acabam)
after(() => rmSync(raiz, { recursive: true, force: true }));

// ---------- tamanho pelo cabeçalho ----------

test('dimensoes: PNG, JPEG (com e sem giro do EXIF) e os três WEBP saem do cabeçalho', async () => {
  const casos = [
    [png(1200, 900), 'image/png', { largura: 1200, altura: 900 }],
    [jpeg(800, 600), 'image/jpeg', { largura: 800, altura: 600 }],
    [jpeg(800, 600, { giro: 6 }), 'image/jpeg', { largura: 600, altura: 800 }],
    [jpeg(800, 600, { giro: 3 }), 'image/jpeg', { largura: 800, altura: 600 }],
    [webpVp8(640, 480), 'image/webp', { largura: 640, altura: 480 }],
    [webpVp8l(300, 7000), 'image/webp', { largura: 300, altura: 7000 }],
    [webpVp8x(9000, 20), 'image/webp', { largura: 9000, altura: 20 }],
  ];
  for (const [i, [b, tipo, esperado]] of casos.entries()) {
    const arq = path.join(raiz, `dim-${i}.bin`);
    writeFileSync(arq, b);
    assert.deepEqual(await ea.dimensoes(arq, tipo), esperado, `${tipo} caso ${i}`);
  }
  const ruins = [[bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'xxxx'), 'image/png'], [bytes([0xff, 0xd8, 0xff, 0xd9]), 'image/jpeg'], [bytes('RIFF', u32be(0), 'WEBPVP8 '), 'image/webp'], [png(0, 10), 'image/png']];
  for (const [i, [b, tipo]] of ruins.entries()) {
    const arq = path.join(raiz, `ruim-${i}.bin`);
    writeFileSync(arq, b);
    assert.equal(await ea.dimensoes(arq, tipo), null, `${tipo} ruim ${i}`);
  }
});

test('lerTags: texto com vírgula ou lista, sem repetir, sem travessão e com teto', () => {
  assert.deepEqual(ea.lerTags('Léo, acenando ,, léo'), ['léo', 'acenando']);
  assert.deepEqual(ea.lerTags(['Papel', `a${TRACO}b`]), ['papel', 'a, b']);
  assert.deepEqual(ea.lerTags(null), []);
  assert.throws(() => ea.lerTags('x'.repeat(41)), /40 caracteres/);
  assert.throws(() => ea.lerTags(Array.from({ length: 21 }, (_, i) => `t${i}`)), /20 tags/);
  assert.throws(() => ea.lerTags([1, 2]), /lista de textos/);
});

test('catálogo: item com arquivo que falta, categoria errada ou id repetido fica de fora, com o motivo', async () => {
  const { assets, problemas } = await ea.validarCatalogo(base);
  assert.deepEqual(assets.map((a) => a.id), ['ast_base_fundo-teste', 'ast_base_leo-teste', 'ast_base_simbolo']);
  assert.equal(problemas.length, 3);
  assert.ok(problemas.some((p) => p.includes('nao-existe.png')));
  assert.ok(problemas.some((p) => p.includes('categoria nenhuma')));
  assert.ok(problemas.some((p) => p.includes('id repetido')));
  // o tamanho vem do disco, não do catálogo
  assert.equal(assets[1].tamanho, png(400, 800).length);
});

test('docs base: lê os JSON da pasta em ordem e deixa o quebrado de fora', async () => {
  const docs = await ea.lerDocsBase();
  assert.deepEqual(docs.map((d) => d.arquivo), ['modelo-a.json']);
  assert.equal(docs[0].doc.titulo, 'Modelo A');
});

// ---------- lista ----------

test('lista: a base na ordem das categorias, busca sem acento e filtro de categoria', async () => {
  const r = await pedir('/api/estudio/assets');
  assert.equal(r.status, 200);
  assert.deepEqual(r.j.assets.map((a) => a.id), ['ast_base_leo-teste', 'ast_base_simbolo', 'ast_base_fundo-teste']);
  assert.equal(r.j.categorias.length, 8);
  const leo = r.j.assets[0];
  assert.deepEqual(Object.keys(leo).sort(), ['altura', 'categoria', 'criadoEm', 'criadoPor', 'descricao', 'id', 'largura', 'licenca', 'miniatura', 'nome', 'oculto', 'origem', 'tags', 'tamanho', 'tipo', 'url'].sort());
  assert.equal(leo.url, '/api/estudio/assets/ast_base_leo-teste/arquivo');
  assert.equal(leo.miniatura, '/api/estudio/assets/ast_base_leo-teste/miniatura');
  assert.equal(leo.origem, 'base');
  assert.equal(leo.oculto, false);
  assert.deepEqual((await pedir('/api/estudio/assets?q=leo%20ACENANDO')).j.assets.map((a) => a.id), ['ast_base_leo-teste']);
  assert.deepEqual((await pedir(`/api/estudio/assets?q=${encodeURIComponent('símbolo')}`)).j.assets.map((a) => a.id), ['ast_base_simbolo']);
  assert.deepEqual((await pedir('/api/estudio/assets?q=corpo%20inteiro')).j.assets.map((a) => a.id), ['ast_base_leo-teste'], 'a descrição entra na busca');
  assert.deepEqual((await pedir('/api/estudio/assets?categoria=fundo')).j.assets.map((a) => a.id), ['ast_base_fundo-teste']);
  assert.equal((await pedir('/api/estudio/assets?categoria=xyz')).status, 400);
  assert.equal((await pedir('/api/estudio/assets', { metodo: 'PATCH' })).status, 405);
});

// ---------- arquivo ----------

test('arquivo: tipo certo, nosniff, cache com ETag e 304; SVG da base com CSP sandbox; HEAD sem corpo', async () => {
  const r = await pedir('/api/estudio/assets/ast_base_leo-teste/arquivo');
  assert.equal(r.status, 200);
  assert.equal(r.h['content-type'], 'image/png');
  assert.equal(r.h['x-content-type-options'], 'nosniff');
  assert.equal(r.h['cache-control'], 'private, max-age=3600');
  assert.ok(r.h.etag);
  assert.deepEqual(r.bruto, png(400, 800));
  const de304 = await pedir('/api/estudio/assets/ast_base_leo-teste/arquivo', { cabecalhos: { 'if-none-match': r.h.etag } });
  assert.equal(de304.status, 304);
  const svg = await pedir('/api/estudio/assets/ast_base_simbolo/arquivo');
  assert.equal(svg.h['content-type'], 'image/svg+xml');
  assert.match(svg.h['content-security-policy'], /sandbox/);
  const head = await pedir('/api/estudio/assets/ast_base_leo-teste/arquivo', { metodo: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.bruto.length, 0);
  assert.equal((await pedir('/api/estudio/assets/ast_base_nao-tem/arquivo')).status, 404);
  assert.equal((await pedir('/api/estudio/assets/ast_base_sumido/arquivo')).status, 404, 'item fora do catálogo não serve');
  assert.equal((await pedir('/api/estudio/assets/qualquer/arquivo')).status, 404);
  assert.equal((await pedir('/api/estudio/assets/ast_base_leo-teste/arquivo', { metodo: 'POST' })).status, 405);
});

// 22/10 (Pedro): a grade baixava o PNG inteiro de cada asset; a miniatura da base é o WEBP de 320 px de
// estudio/base/miniaturas e, sem ela (ou no SVG e no upload), a rota manda o original
test('miniatura: o WEBP da base quando existe; sem ele, o original; 404 e 405 como o arquivo', async () => {
  const webp = webpVp8x(160, 320);
  mkdirSync(path.join(base, 'miniaturas'), { recursive: true });
  writeFileSync(path.join(base, 'miniaturas', 'leo-teste.webp'), webp);
  const mini = await pedir('/api/estudio/assets/ast_base_leo-teste/miniatura');
  assert.equal(mini.status, 200);
  assert.equal(mini.h['content-type'], 'image/webp');
  assert.equal(mini.h['x-content-type-options'], 'nosniff');
  assert.deepEqual(mini.bruto, webp);
  const semMini = await pedir('/api/estudio/assets/ast_base_fundo-teste/miniatura');
  assert.equal(semMini.status, 200);
  assert.equal(semMini.h['content-type'], 'image/png', 'sem miniatura vai o original');
  const svg = await pedir('/api/estudio/assets/ast_base_simbolo/miniatura');
  assert.equal(svg.h['content-type'], 'image/svg+xml');
  assert.match(svg.h['content-security-policy'], /sandbox/, 'o SVG vai com a CSP de sempre');
  assert.equal((await pedir('/api/estudio/assets/ast_base_leo-teste/miniatura', { metodo: 'HEAD' })).status, 200);
  assert.equal((await pedir('/api/estudio/assets/ast_base_nao-tem/miniatura')).status, 404);
  assert.equal((await pedir('/api/estudio/assets/ast_base_leo-teste/miniatura', { metodo: 'POST' })).status, 405);
  rmSync(path.join(base, 'miniaturas'), { recursive: true, force: true });
});

// ---------- upload ----------

let enviado = null;
test('upload: PNG pelos bytes, com nome, categoria e tags dos cabeçalhos; entra na lista e serve com cache longo', async () => {
  const r = await subir(`Foto do time${TRACO}2026.jpeg`, png(1600, 1200), { categoria: 'foto', tags: 'time, Equipe, time' });
  assert.equal(r.status, 201, JSON.stringify(r.j));
  enviado = r.j;
  assert.match(enviado.id, /^ast_[0-9a-f]{8}$/);
  assert.equal(enviado.nome, 'Foto do time, 2026');
  assert.equal(enviado.categoria, 'foto');
  assert.deepEqual(enviado.tags, ['time', 'equipe']);
  assert.equal(enviado.origem, 'upload');
  assert.equal(enviado.tipo, 'image/png');
  assert.equal(enviado.largura, 1600);
  assert.equal(enviado.altura, 1200);
  assert.equal(enviado.tamanho, png(1600, 1200).length);
  assert.equal(enviado.criadoPor, 'Pedro Melo');
  assert.equal(enviado.licenca, 'Enviado pelo time');
  assert.ok(existsSync(path.join(pastaUploads, `${enviado.id}.png`)));
  assert.deepEqual(temporarios(), []);
  assert.equal(registro().uploads.length, 1);
  const lista = (await pedir('/api/estudio/assets?categoria=foto')).j.assets;
  assert.deepEqual(lista.map((a) => a.id), [enviado.id]);
  const arq = await pedir(enviado.url);
  assert.equal(arq.status, 200);
  assert.equal(arq.h['cache-control'], 'private, max-age=31536000, immutable');
  assert.deepEqual(arq.bruto, png(1600, 1200));
  // sem categoria: outro; JPEG girado pelo EXIF fica de pé; WEBP entra
  const j = await subir('celular.jpg', jpeg(4000, 3000, { giro: 6 }));
  assert.equal(j.status, 201);
  assert.equal(j.j.categoria, 'outro');
  assert.deepEqual([j.j.largura, j.j.altura], [3000, 4000]);
  assert.equal(j.j.nome, 'celular');
  const w = await subir('', webpVp8l(512, 512), { categoria: 'icone' });
  assert.equal(w.status, 201);
  assert.equal(w.j.tipo, 'image/webp');
  assert.equal(w.j.nome, 'Imagem enviada');
});

test('upload: SVG, GIF, PDF e PNG sem cabeçalho dão 415; categoria errada dá 400 antes de ler o corpo', async () => {
  for (const [nome, b] of [['logo.svg', SVG], ['anim.gif', GIF], ['doc.pdf', PDF], ['quebrado.png', bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'zzzzzzzz')]]) {
    const r = await subir(nome, b);
    assert.equal(r.status, 415, nome);
  }
  assert.match((await subir('a.svg', SVG)).j.erro, /PNG, JPG ou WEBP/);
  const c = await subir('a.png', png(10, 10), { categoria: 'banana' });
  assert.equal(c.status, 400);
  assert.equal(c.h.connection, 'close');
  assert.deepEqual(temporarios(), []);
  assert.equal(registro().uploads.length, 3);
});

test('upload: passa de 8000 px dá 422; passa do teto declarado ou lido em streaming dá 413 sem sobrar temporário', async () => {
  const largo = await subir('largo.png', png(8001, 100));
  assert.equal(largo.status, 422);
  assert.match(largo.j.erro, /8001 x 100/);
  assert.equal((await subir('alto.webp', webpVp8x(100, 9000))).status, 422);
  assert.equal((await subir('ok.png', png(8000, 8000))).status, 201);
  try {
    ea.LIMITES.bytes = 1000;
    const declarado = await subir('grande.png', png(10, 10, 5000));
    assert.equal(declarado.status, 413);
    assert.equal(declarado.h.connection, 'close');
    assert.equal(declarado.j.erro, 'O arquivo passa de 30 MB.');
    // sem content-length (chunked): o teto em streaming
    const corrido = await subir('grande2.png', png(10, 10, 5000), { cabecalhos: { 'content-length': undefined, 'transfer-encoding': 'chunked' } });
    assert.equal(corrido.status, 413);
  } finally {
    Object.assign(ea.LIMITES, LIMITES_ORIGINAIS);
  }
  assert.deepEqual(temporarios(), []);
});

test('upload: vagas ao mesmo tempo (429), teto de imagens no banco (409) e espaço livre (507 e 503)', async () => {
  try {
    ea.LIMITES.simultaneos = 0;
    const r = await subir('a.png', png(10, 10));
    assert.equal(r.status, 429);
    Object.assign(ea.LIMITES, LIMITES_ORIGINAIS);
    ea.LIMITES.uploads = registro().uploads.length;
    assert.equal((await subir('b.png', png(10, 10))).status, 409);
  } finally {
    Object.assign(ea.LIMITES, LIMITES_ORIGINAIS);
  }
  try {
    ea.disco.livre = async () => 1024 ** 3;
    assert.equal((await subir('c.png', png(10, 10))).status, 507);
    ea.disco.livre = async () => { throw new Error('statfs quebrou'); };
    assert.equal((await subir('d.png', png(10, 10))).status, 503);
  } finally {
    ea.disco.livre = DISCO_FOLGADO;
  }
  assert.deepEqual(temporarios(), []);
});

test('temporário de upload com mais de 30 min sai; o recente fica', async () => {
  mkdirSync(pastaUploads, { recursive: true });
  const velho = path.join(pastaUploads, '.subindo-00000000-0000-4000-8000-000000000000.tmp');
  const novo = path.join(pastaUploads, '.subindo-11111111-1111-4111-8111-111111111111.tmp');
  writeFileSync(velho, 'x');
  writeFileSync(novo, 'y');
  const antes = new Date(Date.now() - 31 * 60_000);
  utimesSync(velho, antes, antes);
  assert.equal(await ea.limparTemporariosVelhos(), 1);
  assert.ok(!existsSync(velho));
  assert.ok(existsSync(novo));
  rmSync(novo);
});

// ---------- editar, esconder, apagar e restaurar ----------

test('editar: upload muda no registro; base ganha a camada por cima; ruim não muda nada', async () => {
  const r = await pedir(`/api/estudio/assets/${enviado.id}`, { metodo: 'PUT', corpo: { nome: `Time${TRACO}2026`, categoria: 'foto', tags: ['time'], descricao: 'Os cinco do time.' } });
  assert.equal(r.status, 200, JSON.stringify(r.j));
  assert.equal(r.j.nome, 'Time, 2026');
  assert.equal(r.j.descricao, 'Os cinco do time.');
  const ruim = await pedir(`/api/estudio/assets/${enviado.id}`, { metodo: 'PUT', corpo: { nome: 'Outro nome', categoria: 'nao-existe' } });
  assert.equal(ruim.status, 400);
  assert.equal((await pedir(`/api/estudio/assets/${enviado.id}`)).j.nome, 'Time, 2026');
  assert.equal((await pedir(`/api/estudio/assets/${enviado.id}`, { metodo: 'PUT', corpo: { nome: '  ' } })).status, 400);
  const b = await pedir('/api/estudio/assets/ast_base_leo-teste', { metodo: 'PUT', corpo: { tags: 'léo, oi', categoria: 'leo' } });
  assert.equal(b.status, 200);
  assert.deepEqual(b.j.tags, ['léo', 'oi']);
  assert.equal(b.j.nome, 'Léo acenando');
  assert.deepEqual(registro().base['ast_base_leo-teste'].tags, ['léo', 'oi']);
  // o catálogo do repo não muda
  assert.deepEqual(JSON.parse(readFileSync(path.join(base, 'catalogo.json'), 'utf8')).assets[1].tags, ['léo', 'acenando']);
  assert.equal((await pedir('/api/estudio/assets/ast_base_nao-tem', { metodo: 'PUT', corpo: { nome: 'x' } })).status, 404);
});

test('apagar base esconde (some da lista, continua servindo, volta com restaurar); apagar upload apaga o arquivo', async () => {
  const d = await pedir('/api/estudio/assets/ast_base_simbolo', { metodo: 'DELETE' });
  assert.equal(d.status, 200);
  assert.equal(d.j.oculto, true);
  assert.equal(d.j.asset.oculto, true);
  assert.ok(!(await pedir('/api/estudio/assets')).j.assets.some((a) => a.id === 'ast_base_simbolo'));
  const com = (await pedir('/api/estudio/assets?ocultos=1')).j.assets.find((a) => a.id === 'ast_base_simbolo');
  assert.equal(com.oculto, true);
  assert.ok(!(await ea.resumoParaIA()).some((a) => a.id === 'ast_base_simbolo'), 'a IA não escolhe o escondido');
  assert.equal((await pedir('/api/estudio/assets/ast_base_simbolo/arquivo')).status, 200, 'design que já usa não quebra');
  const v = await pedir('/api/estudio/assets/ast_base_simbolo/restaurar', { metodo: 'POST' });
  assert.equal(v.status, 200);
  assert.equal(v.j.oculto, false);
  assert.ok((await pedir('/api/estudio/assets')).j.assets.some((a) => a.id === 'ast_base_simbolo'));
  assert.equal((await pedir('/api/estudio/assets/ast_base_simbolo/restaurar', { metodo: 'GET' })).status, 405);
  // upload que está em design: 409 com os designs; forcar=1 apaga; sem conseguir conferir: 503
  const arquivo = path.join(pastaUploads, `${enviado.id}.png`);
  assert.ok(existsSync(arquivo));
  usosFalsos = new Map([[enviado.id, [{ id: 'est_a', titulo: 'Capa' }, { id: 'est_b', titulo: 'Time' }]]]);
  const usado = await pedir(`/api/estudio/assets/${enviado.id}`, { metodo: 'DELETE' });
  assert.equal(usado.status, 409);
  assert.match(usado.j.erro, /2 designs \("Capa", "Time"\)/);
  assert.deepEqual(usado.j.usos, [{ id: 'est_a', titulo: 'Capa' }, { id: 'est_b', titulo: 'Time' }]);
  assert.ok(existsSync(arquivo));
  const quebrou = ea.usos.de;
  ea.usos.de = async () => { throw new Error('estúdio fora'); };
  assert.equal((await pedir(`/api/estudio/assets/${enviado.id}`, { metodo: 'DELETE' })).status, 503);
  ea.usos.de = quebrou;
  assert.ok(existsSync(arquivo));
  const a = await pedir(`/api/estudio/assets/${enviado.id}?forcar=1`, { metodo: 'DELETE' });
  usosFalsos = new Map();
  assert.equal(a.status, 200);
  assert.equal(a.j.apagado, true);
  assert.ok(!existsSync(arquivo));
  assert.equal((await pedir(`/api/estudio/assets/${enviado.id}`)).status, 404);
  assert.equal((await pedir(`/api/estudio/assets/${enviado.id}/arquivo`)).status, 404);
  assert.equal((await pedir(`/api/estudio/assets/${enviado.id}/restaurar`, { metodo: 'POST' })).status, 404);
  assert.ok(!registro().uploads.some((u) => u.id === enviado.id));
  assert.equal((await pedir('/api/estudio/assets/ast_base_simbolo/outra')).status, 404);
});

test('o registro lido do disco de novo (reinício do servidor) tem o mesmo estado', async () => {
  const antes = (await pedir('/api/estudio/assets?ocultos=1')).j.assets;
  ea.esquecerCache();
  const depois = (await pedir('/api/estudio/assets?ocultos=1')).j.assets;
  assert.deepEqual(depois, antes);
});

// ---------- o banco base de verdade do repo ----------

test('banco base do repo: catálogo sem problema, arquivos de até 2400 px, abaixo de 120 MB e sem travessão', async () => {
  const { assets, problemas } = await ea.validarCatalogo(BASE_REAL);
  assert.deepEqual(problemas, []);
  assert.ok(assets.length >= 60, `${assets.length} assets`);
  const cat = JSON.parse(readFileSync(path.join(BASE_REAL, 'catalogo.json'), 'utf8'));
  const texto = readFileSync(path.join(BASE_REAL, 'catalogo.json'), 'utf8');
  assert.ok(!TRACOS_RE.test(texto), 'travessão no catálogo');
  let total = 0;
  for (const a of cat.assets) {
    const real = path.join(BASE_REAL, 'assets', a.arquivo);
    total += statSync(real).size;
    assert.ok(a.descricao.length >= 10, `${a.id} sem descrição pra IA`);
    assert.ok(a.licenca, `${a.id} sem licença`);
    if (a.tipo === 'image/png') {
      const d = await ea.dimensoes(real, 'image/png');
      assert.deepEqual(d, { largura: a.largura, altura: a.altura }, a.id);
      assert.ok(Math.max(d.largura, d.altura) <= 2400, `${a.id} passa de 2400 px`);
    } else {
      const svg = readFileSync(real, 'utf8');
      assert.ok(!/<script|foreignObject/i.test(svg), `${a.id} com script`);
      assert.match(svg, /<svg[^>]*\swidth="[\d.]+"[^>]*\sheight="[\d.]+"/, `${a.id} sem width e height`);
    }
  }
  assert.ok(total < 120 * 1024 * 1024, `${(total / 1024 / 1024).toFixed(1)} MB`);
  // sem arquivo solto na pasta (tudo que está lá está no catálogo)
  const nomes = new Set(cat.assets.map((a) => a.arquivo));
  assert.deepEqual(readdirSync(path.join(BASE_REAL, 'assets')).filter((n) => !nomes.has(n)), []);
  for (const c of ['leo', '3d', 'icone', 'marca', 'tela-app', 'fundo']) assert.ok(cat.assets.some((a) => a.categoria === c), `nenhum asset de ${c}`);
  // 22/10 (Pedro): o lote genérico do Ateliê original (mockups, texturas e meio-tom), cada um com a origem e a licença;
  // nada de outra marca (o âmbar da outra marca virou coral)
  const lote = cat.assets.filter((a) => a.lote === 'atelie');
  assert.ok(lote.length >= 20, `${lote.length} do Ateliê`);
  for (const a of lote) {
    assert.ok(String(a.fonte?.arquivo ?? '').startsWith('atelie-original@bdc7b76/referencias/'), `${a.id} sem a origem`);
    assert.match(a.licenca, /Freepik/, `${a.id}: licença`);
    assert.ok(!/presente|sonoro/i.test(`${a.id} ${a.nome} ${a.descricao} ${a.tags.join(' ')}`), `${a.id} cita a outra marca`);
    if (a.tipo === 'image/svg+xml') assert.ok(!/#f9913c/i.test(readFileSync(path.join(BASE_REAL, 'assets', a.arquivo), 'utf8')), `${a.id} com o âmbar da outra marca`);
  }
  // os bustos têm o corte reto marcado (a exceção da área segura, estudio.mjs)
  for (const id of ['ast_base_leo-busto-sorrindo', 'ast_base_leo-busto-patas']) assert.ok(cat.assets.find((a) => a.id === id)?.tags.includes('corte reto'), id);
  // as miniaturas da grade: uma por imagem do catálogo, WEBP de até 320 px
  const pngs = cat.assets.filter((a) => a.tipo !== 'image/svg+xml');
  const minis = new Set(readdirSync(path.join(BASE_REAL, 'miniaturas')));
  for (const a of pngs) {
    const nome = `${a.arquivo.replace(/\.[a-z]+$/, '')}.webp`;
    assert.ok(minis.has(nome), `${a.id} sem miniatura`);
    const d = await ea.dimensoes(path.join(BASE_REAL, 'miniaturas', nome), 'image/webp');
    assert.ok(d && Math.max(d.largura, d.altura) <= 320, `${nome}: ${JSON.stringify(d)}`);
  }
});

test('documentos base do destaque: 11 quadros no contrato, com asset que existe e texto sem travessão', async () => {
  const { assets } = await ea.validarCatalogo(BASE_REAL);
  const ids = new Set(assets.map((a) => a.id));
  const docs = await ea.lerDocsBase(path.join(BASE_REAL, 'docs'));
  const destaque = docs.filter((d) => d.arquivo.startsWith('comece-por-aqui-'));
  assert.equal(destaque.length, 11);
  for (const { arquivo, doc } of destaque) {
    const onde = arquivo;
    assert.ok(!('id' in doc) && !('criadoEm' in doc) && !('atualizadoEm' in doc), `${onde}: id e datas são do servidor`);
    assert.equal(doc.formato, 'stories');
    assert.deepEqual([doc.largura, doc.altura], [1080, 1920]);
    assert.equal(doc.origem, 'importado');
    assert.equal(doc.pecaId, null);
    assert.equal(doc.estrategia.pilar, 3);
    assert.equal(doc.estrategia.bloco, 'Afeto');
    assert.equal(doc.paginas.length, 1);
    const pg = doc.paginas[0];
    assert.ok(ids.has(pg.fundo.assetId), `${onde}: fundo ${pg.fundo.assetId}`);
    assert.ok(['cor', 'gradiente', 'imagem'].includes(pg.fundo.tipo));
    const vistos = new Set();
    for (const c of pg.camadas) {
      assert.ok(!vistos.has(c.id), `${onde}: camada repetida ${c.id}`);
      vistos.add(c.id);
      for (const k of ['x', 'y', 'largura', 'altura', 'rotacao', 'opacidade']) assert.ok(Number.isFinite(c[k]), `${onde} ${c.id}: ${k}`);
      assert.ok(c.largura > 0 && c.altura > 0 && c.opacidade > 0 && c.opacidade <= 1);
      assert.equal(typeof c.travada, 'boolean');
      assert.equal(typeof c.oculta, 'boolean');
      if (c.tipo === 'imagem') assert.ok(ids.has(c.assetId), `${onde}: asset ${c.assetId}`);
      else if (c.tipo === 'texto') {
        assert.ok(['Sora', 'DM Serif Display'].includes(c.fonte));
        assert.ok(c.peso >= 400 && c.peso <= 800, `${onde}: peso ${c.peso}`);
        assert.ok(!TRACOS_RE.test(c.texto), `${onde}: travessão`);
        assert.ok(['esquerda', 'centro', 'direita'].includes(c.alinhamento));
        assert.ok(['normal', 'alta'].includes(c.caixa));
        assert.equal((c.texto.match(/\*/g) ?? []).length % 2, 0, `${onde}: asterisco sem par`);
      } else {
        assert.equal(c.tipo, 'forma');
        assert.ok(['retangulo', 'circulo', 'linha'].includes(c.forma));
      }
    }
  }
});
