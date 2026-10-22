// Testes do envio de arquivos nas Aprovações técnicas (21/10): o tipo pelos bytes do começo (envios.mjs,
// tipoPelosBytes), o nome limpo, o teto de tamanho em streaming (gravarCorpo), o perfil do Diretor contábil
// (auth.podeApi) e o caminho inteiro num servidor de verdade numa porta livre, com a pasta de dados temporária: criar,
// subir, entregar com Range, mandar pra aprovação, aprovar, mexer depois de aprovado, os 20 arquivos e apagar.
// O banco de verdade (data/) não é lido. Rodar: npm run testar
// 21/10 (revisão do upload): extensão do tipo dos bytes no nome, vaga reservada antes do corpo, espaço livre mínimo,
// pedido que morreu antes do pipe e temporário velho. O disco é simulado (envios.disco): o teste não depende do espaço
// livre de verdade desta máquina
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync, statSync, rmSync, utimesSync } from 'node:fs';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-envios-'));
const dados = path.join(raiz, 'data');
process.env.CRONOGRAMA_DATA = dados;
mkdirSync(dados, { recursive: true });
writeFileSync(path.join(dados, 'estilos.json'), '{}');
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({ schemaVersion: 2, reels: [] }));
const envios = await import('../envios.mjs');
const aprovacoes = await import('../aprovacoes.mjs');
const auth = await import('../auth.mjs');
const { carregar } = await import('../db.mjs');
// 100 GB livres, a não ser no teste do espaço
const DISCO_FOLGADO = async () => 100 * 1024 ** 3;
envios.disco.livre = DISCO_FOLGADO;

const TRACO = String.fromCharCode(0x2014);
const bytes = (...partes) => Buffer.concat(partes.map((p) => (typeof p === 'string' ? Buffer.from(p, 'latin1') : Buffer.from(p))));
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], [0, 0, 0, 13], 'IHDR', [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]);
const ftyp = (marca) => bytes([0, 0, 0, 0x18], 'ftyp', marca, [0, 0, 2, 0], 'isomiso2', Buffer.alloc(40, 1));
const SVG = bytes('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const HTML = bytes('<!DOCTYPE html><html><body>oi</body></html>');

// ---------- servidor de verdade numa porta livre ----------

const USUARIOS = {
  time: { id: 'usr_time', nome: 'Pedro Melo', usuario: 'pedro', papel: 'admin' },
  diretor: { id: 'usr_dir', nome: 'Diretor Teste', usuario: 'diretor', papel: 'diretor' },
};
const json = (res, codigo, corpo) => {
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
const TETO_TESTE = 1024;
// o que o /teto respondeu, por n (o pedido cortado no meio não recebe resposta: o teste lê daqui)
const resultadosTeto = new Map();
const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    // o teto em streaming, direto (200 MB de verdade não cabem num teste)
    if (url.pathname === '/teto') {
      const n = url.searchParams.get('n');
      const destino = path.join(dados, `teto-${n}.bin`);
      try {
        const r = await envios.gravarCorpo(req, destino, TETO_TESTE);
        resultadosTeto.set(n, { status: 200, existe: existsSync(destino) });
        return json(res, 200, { total: r.total, cabeca: r.cabeca.toString('hex'), existe: existsSync(destino) });
      } catch (e) {
        resultadosTeto.set(n, { status: e.status ?? 500, existe: existsSync(destino) });
        res.setHeader('connection', 'close');
        return json(res, e.status ?? 500, { erro: e.message, existe: existsSync(destino) });
      }
    }
    const u = USUARIOS[req.headers['x-teste-quem'] ?? 'time'];
    if (!auth.podeApi(u, req.method, url.pathname)) return json(res, 403, { erro: auth.motivoNegado(u, req.method, url.pathname) });
    const partes = url.pathname.split('/').filter(Boolean).slice(1).map(decodeURIComponent);
    const sess = { usuario: u };
    if (partes[0] === 'envios') return await envios.rota(req, res, partes.slice(1), sess, { json, corpoJson });
    if (partes[0] === 'aprovacoes') return await aprovacoes.rota(req, res, partes[1], partes[2], sess, { json, corpoJson });
    return json(res, 404, { erro: 'Rota não existe.' });
  } catch (e) {
    if (res.headersSent) return res.end();
    return json(res, e.status ?? 500, { erro: e.message });
  }
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
after(() => servidor.close());

function pedir(caminho, { metodo = 'GET', quem = 'time', corpo, cabecalhos = {} } = {}) {
  return new Promise((ok, erro) => {
    const cru = corpo === undefined ? null : Buffer.isBuffer(corpo) ? corpo : Buffer.from(JSON.stringify(corpo));
    const h = { 'x-teste-quem': quem, ...(cru ? { 'content-length': cru.length } : {}), ...(cru && !Buffer.isBuffer(corpo) ? { 'content-type': 'application/json' } : {}), ...cabecalhos };
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
const subir = (id, nome, conteudo, tipo = 'image/png') =>
  pedir(`/api/envios/${id}/arquivos`, { metodo: 'POST', corpo: conteudo, cabecalhos: { 'x-nome-arquivo': encodeURIComponent(nome), 'content-type': tipo } });
const pastaEnvios = path.join(dados, 'envios');
const temporarios = () => (existsSync(pastaEnvios) ? readdirSync(pastaEnvios).filter((n) => n.includes('.tmp')) : []);

// a limpeza só depois do último await do topo: com await no meio, o node:test roda os after do topo quando os
// testes registrados até ali acabam, e a pasta sumia antes dos testes de baixo
after(() => rmSync(raiz, { recursive: true, force: true }));

// ---------- tipo pelos bytes ----------

test('tipo: cada formato aceito sai dos bytes do começo', () => {
  const casos = [
    [PNG, 'image/png', 'png'],
    [bytes([0xff, 0xd8, 0xff, 0xe0], 'JFIF'), 'image/jpeg', 'jpg'],
    [bytes('GIF87a', [1, 0, 1, 0]), 'image/gif', 'gif'],
    [bytes('GIF89a', [1, 0, 1, 0]), 'image/gif', 'gif'],
    [bytes('RIFF', [0x24, 0, 0, 0], 'WEBPVP8 '), 'image/webp', 'webp'],
    [bytes('%PDF-1.7\n'), 'application/pdf', 'pdf'],
    [bytes([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81]), 'video/webm', 'webm'],
    [ftyp('isom'), 'video/mp4', 'mp4'],
    [ftyp('mp42'), 'video/mp4', 'mp4'],
    [ftyp('qt  '), 'video/quicktime', 'mov'],
  ];
  for (const [b, tipo, ext] of casos) assert.deepEqual(envios.tipoPelosBytes(b), { tipo, ext }, `${tipo} (${b.subarray(0, 12).toString('hex')})`);
});

test('tipo: SVG, HTML, vazio, zip, exe, foto HEIC e o resto não entram', () => {
  const recusados = [
    SVG, bytes('<?xml version="1.0"?><svg/>'), HTML, bytes('<html>'), Buffer.alloc(0), bytes('PK', [3, 4, 20, 0]), bytes('MZ', [0x90, 0]),
    ftyp('heic'), ftyp('mif1'), ftyp('avif'), bytes('RIFF', [0x24, 0, 0, 0], 'WAVEfmt '), bytes('%PD'), bytes([0xff, 0xd8]), bytes('GIF8'),
    bytes([0x89, 0x50, 0x4e, 0x47]), bytes('texto qualquer com ftyp no meio'),
  ];
  for (const b of recusados) assert.equal(envios.tipoPelosBytes(b), null, `deveria recusar ${b.subarray(0, 12).toString('hex') || '(vazio)'}`);
  assert.equal(envios.tipoPelosBytes('%PDF-1.7'), null, 'texto não é arquivo');
  assert.equal(envios.tipoPelosBytes(null), null);
});

// ---------- nome ----------

test('nome limpo: sem controle, sem barra, sem invisível de direção e até 120 caracteres', () => {
  assert.equal(envios.limparNome('Tabela do MEI.png'), 'Tabela do MEI.png');
  const comBarra = envios.limparNome('../../dados/db.json');
  assert.doesNotMatch(comBarra, /[\\/]/);
  assert.equal(envios.limparNome('pasta\\outra/arquivo.pdf'), 'pasta outra arquivo.pdf');
  assert.equal(envios.limparNome('a\u0000b\nc\td\u007f.png'), 'abcd.png');
  assert.equal(envios.limparNome('foto‮gnp.exe'), 'fotognp.exe');
  assert.equal(envios.limparNome(`Reel ${TRACO} final.mp4`), 'Reel, final.mp4');
  assert.equal(envios.limparNome('x'.repeat(300)).length, 120);
  const emoji = envios.limparNome('\u{1F600}'.repeat(130));
  assert.equal(Array.from(emoji).length, 120);
  assert.doesNotMatch(emoji, /[\uD800-\uDBFF](?![\uDC00-\uDFFF])/, 'sem emoji cortado no meio');
  assert.equal(envios.limparNome('', 'pdf'), 'arquivo.pdf');
  assert.equal(envios.limparNome(' \u0001 / ', 'png'), 'arquivo.png');
  assert.equal(envios.limparNome(undefined), 'arquivo');
});

// ---------- perfil ----------

test('perfil: o Diretor contábil só lê os arquivos do envio; subir, editar e apagar são do time', () => {
  const diretor = { papel: 'diretor' };
  const arq = '/api/envios/env_1a2b3c4d/arquivos/arq_9f8e7d6c';
  assert.ok(auth.podeApi(diretor, 'GET', arq));
  assert.ok(auth.podeApi(diretor, 'HEAD', arq));
  const negados = [
    ['POST', '/api/envios'], ['GET', '/api/envios'], ['GET', '/api/envios/env_1a2b3c4d'], ['PUT', '/api/envios/env_1a2b3c4d'],
    ['DELETE', '/api/envios/env_1a2b3c4d'], ['POST', '/api/envios/env_1a2b3c4d/arquivos'], ['GET', '/api/envios/env_1a2b3c4d/arquivos'],
    ['DELETE', arq], ['PUT', arq], ['POST', arq], ['GET', `${arq}/x`], ['GET', '/api/envios/env_1a2b3c4d/arquivos/..%2F..%2Fdb.json'],
    ['GET', '/api/envios/reel_1/arquivos/arq_1'], ['POST', '/api/aprovacoes/env_1a2b3c4d/enviar'],
  ];
  for (const [m, c] of negados) assert.equal(auth.podeApi(diretor, m, c), false, `${m} ${c}`);
  // aprovar e ajustar o envio seguem do Diretor
  assert.ok(auth.podeApi(diretor, 'POST', '/api/aprovacoes/env_1a2b3c4d/aprovar'));
  assert.ok(auth.podeApi(diretor, 'GET', '/api/aprovacoes/env_1a2b3c4d'));
  for (const papel of ['admin', 'operador']) {
    const u = { papel };
    for (const [m, c] of [...negados.slice(0, 11), ['GET', arq], ['HEAD', arq]]) assert.ok(auth.podeApi(u, m, c), `${papel}: ${m} ${c}`);
    assert.equal(auth.podeApi(u, 'POST', '/api/aprovacoes/env_1a2b3c4d/aprovar'), false, `${papel} não aprova`);
  }
});

test('teto em streaming: passou, para, apaga o que gravou e dá 413; no teto, grava', async () => {
  const grande = await pedir('/teto?n=1', { metodo: 'POST', corpo: Buffer.alloc(3 * TETO_TESTE, 7) });
  assert.equal(grande.status, 413);
  assert.equal(grande.j.erro, envios.MSG_GRANDE);
  assert.equal(grande.j.existe, false, 'o temporário sai');
  const justo = await pedir('/teto?n=2', { metodo: 'POST', corpo: bytes(PNG, Buffer.alloc(TETO_TESTE - PNG.length, 1)) });
  assert.equal(justo.status, 200);
  assert.equal(justo.j.total, TETO_TESTE);
  assert.equal(justo.j.cabeca, PNG.subarray(0, 16).toString('hex'));
  assert.equal(statSync(path.join(dados, 'teto-2.bin')).size, TETO_TESTE);
  assert.equal(envios.MAX_BYTES, 200 * 1024 * 1024);
  // a pessoa fechou a aba no meio: não fica esperando pra sempre e o pedaço gravado sai
  await new Promise((ok) => {
    const req = http.request({ host: '127.0.0.1', port: servidor.address().port, path: '/teto?n=3', method: 'POST', headers: { 'content-length': '900' } });
    req.on('error', () => {});
    req.write(Buffer.alloc(100, 2), () => setTimeout(() => { req.destroy(); ok(); }, 50));
  });
  for (let i = 0; i < 100 && !resultadosTeto.has('3'); i++) await new Promise((ok) => setTimeout(ok, 20));
  assert.deepEqual(resultadosTeto.get('3'), { status: 400, existe: false });
});

test('caminho inteiro: criar, subir, entregar, mandar, aprovar, mexer depois de aprovado e apagar', async () => {
  // criar: título e base obrigatórios, travessão vira vírgula
  assert.equal((await pedir('/api/envios', { metodo: 'POST', corpo: {} })).j.erro, 'O título não pode ficar vazio.');
  assert.equal((await pedir('/api/envios', { metodo: 'POST', corpo: { titulo: 'Tabela', base: '  ' } })).j.erro, 'A base não pode ficar vazia.');
  assert.equal((await pedir('/api/envios', { metodo: 'POST', corpo: { titulo: 'x'.repeat(201), base: 'b' } })).status, 400);
  assert.equal((await pedir('/api/envios', { metodo: 'POST', corpo: { titulo: 'T', base: 'b'.repeat(3001) } })).status, 400);
  const criado = await pedir('/api/envios', { metodo: 'POST', corpo: { titulo: `Tabela ${TRACO} MEI`, base: 'Fato F051 do FATOS.md' } });
  assert.equal(criado.status, 201);
  const e = criado.j;
  assert.match(e.id, /^env_[A-Za-z0-9_-]+$/);
  assert.deepEqual(
    { envio: e.envio, titulo: e.titulo, ideia: e.ideia, base: e.base, peca: e.peca, data: e.data, arquivos: e.arquivos, aprovacao: e.aprovacao, criadoPor: e.criadoPor },
    { envio: true, titulo: 'Tabela, MEI', ideia: 'Tabela, MEI', base: 'Fato F051 do FATOS.md', peca: 'arquivos', data: '', arquivos: [], aprovacao: null, criadoPor: 'Pedro Melo' },
  );
  const id = e.id;
  const db = await carregar();
  assert.ok(Array.isArray(db.envios) && db.envios.some((x) => x.id === id), 'db.envios no banco');

  // o Diretor não cria, não edita, não apaga e não vê o envio por esta rota
  for (const [m, c] of [['POST', '/api/envios'], ['GET', `/api/envios/${id}`], ['PUT', `/api/envios/${id}`], ['DELETE', `/api/envios/${id}`], ['POST', `/api/envios/${id}/arquivos`]]) {
    assert.equal((await pedir(c, { metodo: m, quem: 'diretor', corpo: {} })).status, 403, `${m} ${c}`);
  }

  // mandar sem arquivo
  assert.equal((await pedir(`/api/aprovacoes/${id}/enviar`, { metodo: 'POST', corpo: {} })).j.erro, 'Suba pelo menos um arquivo antes de mandar.');

  // subir: o tipo sai dos bytes (o content-type e a extensão que chegam não contam) e o nome é só pra mostrar
  const png = await subir(id, `../../segredo‮gnp${TRACO}.png`, PNG, 'text/html');
  assert.equal(png.status, 201);
  const a1 = png.j.arquivos[0];
  assert.equal(a1.tipo, 'image/png');
  assert.equal(a1.tamanho, PNG.length);
  assert.doesNotMatch(a1.nome, /[\\/‮]/);
  assert.match(a1.id, /^arq_/);
  assert.equal(a1.url, `/api/envios/${id}/arquivos/${a1.id}`);
  assert.deepEqual(readdirSync(path.join(pastaEnvios, id)), [`${a1.id}.png`]);
  for (const [nome, conteudo] of [['logo.png', SVG], ['pagina.png', HTML], ['vazio.png', Buffer.alloc(0)]]) {
    const r = await subir(id, nome, conteudo);
    assert.equal(r.status, 415, nome);
    assert.equal(r.j.erro, envios.MSG_TIPO);
  }
  const mp4 = await subir(id, 'video.mov', ftyp('isom'), 'video/quicktime');
  assert.equal(mp4.status, 201);
  assert.equal(mp4.j.arquivos[1].tipo, 'video/mp4');
  assert.deepEqual(temporarios(), [], 'nenhum temporário sobra');
  assert.equal(readdirSync(path.join(pastaEnvios, id)).length, 2);

  // entregar: inteiro, pedaço e HEAD, com nosniff, inline com o nome e cache privado sem guardar
  const inteiro = await pedir(a1.url);
  assert.equal(inteiro.status, 200);
  assert.equal(inteiro.h['content-type'], 'image/png');
  assert.equal(inteiro.h['x-content-type-options'], 'nosniff');
  assert.equal(inteiro.h['cache-control'], 'private, no-cache');
  assert.match(inteiro.h['content-disposition'], /^inline; filename\*=UTF-8''[A-Za-z0-9%._~!-]+$/);
  assert.ok(inteiro.bruto.equals(PNG));
  const pedaco = await pedir(a1.url, { cabecalhos: { range: 'bytes=0-3' } });
  assert.equal(pedaco.status, 206);
  assert.equal(pedaco.h['content-range'], `bytes 0-3/${PNG.length}`);
  assert.ok(pedaco.bruto.equals(PNG.subarray(0, 4)));
  const cabeca = await pedir(a1.url, { metodo: 'HEAD' });
  assert.equal(cabeca.status, 200);
  assert.equal(cabeca.bruto.length, 0);
  assert.equal((await pedir(`/api/envios/${id}/arquivos/arq_naoexiste`)).status, 404);
  assert.equal((await pedir(`/api/envios/${id}/arquivos/..%2F..%2Fdb.json`)).status, 404);
  // rascunho do time: o Diretor ainda não vê
  assert.equal((await pedir(a1.url, { quem: 'diretor' })).status, 404);

  // a aba: o rascunho aparece em "envios" pro time, nunca pro Diretor
  let lista = (await pedir('/api/aprovacoes')).j;
  assert.deepEqual(lista.envios.map((x) => x.id), [id]);
  assert.equal(lista.pendentes.length, 0);
  assert.deepEqual((await pedir('/api/aprovacoes', { quem: 'diretor' })).j.envios, []);

  // a IA não escreve explicação de envio
  assert.equal((await pedir(`/api/aprovacoes/${id}/explicacao`, { metodo: 'POST' })).j.erro, 'No envio de arquivos, a base já é a explicação.');

  // mandar: sem explicação, a base vai como explicação
  const mandado = await pedir(`/api/aprovacoes/${id}/enviar`, { metodo: 'POST', corpo: {} });
  assert.equal(mandado.status, 200);
  assert.equal(mandado.j.aprovacao.estado, 'pendente');
  assert.equal(mandado.j.aprovacao.explicacao, 'Fato F051 do FATOS.md');
  assert.equal(mandado.j.envio, true);

  // com o Diretor: nada muda
  const travado = 'Está com o Diretor contábil: espere a decisão antes de mexer.';
  assert.equal((await pedir(`/api/envios/${id}`, { metodo: 'PUT', corpo: { titulo: 'Outro' } })).j.erro, travado);
  assert.equal((await subir(id, 'mais.png', PNG)).status, 409);
  assert.equal((await pedir(a1.url, { metodo: 'DELETE' })).status, 409);
  assert.equal((await pedir(`/api/envios/${id}`, { metodo: 'DELETE' })).status, 409);
  assert.equal((await pedir(`/api/aprovacoes/${id}/enviar`, { metodo: 'POST', corpo: {} })).status, 409);

  // o Diretor vê o envio na lista e os arquivos; tirar arquivo não
  lista = (await pedir('/api/aprovacoes', { quem: 'diretor' })).j;
  assert.deepEqual(lista.pendentes.map((x) => [x.id, x.envio, x.peca, x.arquivos.length]), [[id, true, 'arquivos', 2]]);
  assert.deepEqual(lista.envios, []);
  assert.equal((await pedir(a1.url, { quem: 'diretor' })).status, 200);
  assert.equal((await pedir(a1.url, { quem: 'diretor', metodo: 'HEAD' })).status, 200);
  assert.equal((await pedir(a1.url, { quem: 'diretor', metodo: 'DELETE' })).status, 403);
  assert.equal((await pedir(`/api/aprovacoes/${id}`, { quem: 'diretor' })).j.base, 'Fato F051 do FATOS.md');

  // aprovar
  const aprovado = await pedir(`/api/aprovacoes/${id}/aprovar`, { metodo: 'POST', quem: 'diretor', corpo: {} });
  assert.equal(aprovado.j.aprovacao.estado, 'aprovado');
  assert.equal(aprovado.j.aprovacao.decididoPor, 'Diretor Teste');
  lista = (await pedir('/api/aprovacoes')).j;
  assert.deepEqual(lista.recentes.map((x) => x.id), [id]);
  assert.deepEqual(lista.envios, [], 'aprovado sai de "envios"');

  // arquivo novo depois de aprovado: precisa mandar de novo
  const depois = await subir(id, 'novo.png', PNG);
  assert.equal(depois.status, 201);
  assert.equal(depois.j.aprovacao.estado, 'alterado');
  assert.deepEqual(depois.j.aprovacao.conversa.at(-1).mudou, ['arquivos']);
  assert.equal(depois.j.aprovacao.conversa.at(-1).tipo, 'alterado');
  assert.deepEqual((await pedir('/api/aprovacoes')).j.envios.map((x) => x.id), [id]);

  // de novo com explicação escrita, aprovado, e o título mexido
  const segunda = await pedir(`/api/aprovacoes/${id}/enviar`, { metodo: 'POST', corpo: { explicacao: 'Outra explicação' } });
  assert.equal(segunda.j.aprovacao.explicacao, 'Outra explicação');
  assert.equal(segunda.j.aprovacao.rodada, 2);
  await pedir(`/api/aprovacoes/${id}/aprovar`, { metodo: 'POST', quem: 'diretor', corpo: {} });
  const igual = await pedir(`/api/envios/${id}`, { metodo: 'PUT', corpo: { titulo: 'Tabela, MEI' } });
  assert.equal(igual.j.aprovacao.estado, 'aprovado', 'sem mudança de verdade, segue aprovado');
  const ruim = await pedir(`/api/envios/${id}`, { metodo: 'PUT', corpo: { titulo: 'Tabela nova', base: '' } });
  assert.equal(ruim.status, 400);
  assert.equal((await pedir(`/api/envios/${id}`)).j.titulo, 'Tabela, MEI', 'base ruim não deixa o título mudar');
  const mexido = await pedir(`/api/envios/${id}`, { metodo: 'PUT', corpo: { titulo: 'Tabela nova' } });
  assert.equal(mexido.j.titulo, 'Tabela nova');
  assert.equal(mexido.j.aprovacao.estado, 'alterado');
  assert.deepEqual(mexido.j.aprovacao.conversa.at(-1).mudou, ['título']);

  // ajuste do Diretor no envio: só a mensagem
  await pedir(`/api/aprovacoes/${id}/enviar`, { metodo: 'POST', corpo: {} });
  const semMsg = await pedir(`/api/aprovacoes/${id}/ajustar`, { metodo: 'POST', quem: 'diretor', corpo: { conteudo: { legenda: 'x' } } });
  assert.equal(semMsg.j.erro, 'Escreva o que ajustar.');
  const ajuste = await pedir(`/api/aprovacoes/${id}/ajustar`, { metodo: 'POST', quem: 'diretor', corpo: { mensagem: 'Trocar a imagem' } });
  assert.equal(ajuste.j.aprovacao.estado, 'ajuste');
  assert.equal(ajuste.j.aprovacao.tipoAjuste, 'sugestao');
  assert.equal(ajuste.j.aprovacao.conversa.at(-1).texto, 'Trocar a imagem');
  assert.equal(ajuste.j.titulo, 'Tabela nova');

  // tirar arquivo (em ajuste segue ajuste) e o arquivo sai do disco
  const tirado = await pedir(a1.url, { metodo: 'DELETE' });
  assert.equal(tirado.status, 200);
  assert.equal(tirado.j.arquivos.length, 2);
  assert.equal(tirado.j.aprovacao.estado, 'ajuste');
  assert.equal(existsSync(path.join(pastaEnvios, id, `${a1.id}.png`)), false);
  assert.equal((await pedir(a1.url)).status, 404);

  // até 20 arquivos por envio
  for (let i = tirado.j.arquivos.length; i < envios.MAX_ARQUIVOS; i++) assert.equal((await subir(id, `f${i}.png`, PNG)).status, 201);
  assert.equal((await subir(id, 'demais.png', PNG)).status, 409);

  // apagar: some do banco e do disco
  assert.deepEqual((await pedir(`/api/envios/${id}`, { metodo: 'DELETE' })).j, { ok: true });
  assert.equal(existsSync(path.join(pastaEnvios, id)), false);
  assert.equal((await pedir(`/api/envios/${id}`)).status, 404);
  assert.equal((await pedir(`/api/aprovacoes/${id}`)).status, 404);
  assert.equal((await pedir('/api/aprovacoes')).j.envios.length, 0);
});

test('upload: arquivo declarado maior que 200 MB dá 413 antes de ler o corpo', async () => {
  const id = (await pedir('/api/envios', { metodo: 'POST', corpo: { titulo: 'Grande', base: 'Base' } })).j.id;
  const r = await new Promise((ok, erro) => {
    const req = http.request({
      host: '127.0.0.1', port: servidor.address().port, path: `/api/envios/${id}/arquivos`, method: 'POST',
      headers: { 'content-length': String(envios.MAX_BYTES + 1), 'x-nome-arquivo': 'grande.mp4', 'x-teste-quem': 'time' },
    }, (res) => {
      const pedacos = [];
      res.on('data', (c) => pedacos.push(c));
      res.on('end', () => ok({ status: res.statusCode, h: res.headers, j: JSON.parse(Buffer.concat(pedacos).toString('utf8')) }));
    });
    req.on('error', (e) => (['ECONNRESET', 'EPIPE'].includes(e.code) ? null : erro(e)));
    req.write(ftyp('isom'));
  });
  assert.equal(r.status, 413);
  assert.equal(r.j.erro, envios.MSG_GRANDE);
  assert.equal(r.h.connection, 'close');
  assert.deepEqual(temporarios(), []);
  assert.equal((await pedir(`/api/envios/${id}`)).j.arquivos.length, 0);
});

// ---------- revisão do upload (21/10) ----------

const GIF = bytes('GIF89a', [1, 0, 1, 0, 0x80, 0, 0]);

test('nome: termina sempre na extensão do tipo que os bytes deram', async () => {
  const casos = [
    ['parecer.bat', 'gif', 'parecer.gif'], ['foto.jpeg', 'jpg', 'foto.jpg'], ['Tabela.PNG', 'png', 'Tabela.png'], ['foto.png.exe', 'png', 'foto.png'],
    ['sem extensao', 'pdf', 'sem extensao.pdf'], ['', 'webm', 'arquivo.webm'], ['.bashrc', 'png', 'arquivo.png'], ['video.mov', 'mp4', 'video.mp4'],
    ['relatorio.final.pdf', 'pdf', 'relatorio.final.pdf'], [`Reel ${TRACO} final.mp4`, 'mp4', 'Reel, final.mp4'],
  ];
  for (const [nome, ext, esperado] of casos) assert.equal(envios.nomeComExtensao(nome, ext), esperado, nome);
  const longo = envios.nomeComExtensao(`${'x'.repeat(300)}.exe`, 'png');
  assert.equal(longo.length, 120);
  assert.ok(longo.endsWith('.png'));

  // de ponta a ponta: o gravado e o servido
  const id = (await pedir('/api/envios', { metodo: 'POST', corpo: { titulo: 'Parecer', base: 'Base' } })).j.id;
  const r = await subir(id, 'parecer.bat', GIF, 'application/x-msdownload');
  assert.equal(r.status, 201);
  const a = r.j.arquivos[0];
  assert.equal(a.nome, 'parecer.gif');
  assert.equal(a.tipo, 'image/gif');
  const db = await carregar();
  assert.equal(db.envios.find((x) => x.id === id).arquivos[0].nome, 'parecer.gif');
  const servido = await pedir(a.url);
  assert.equal(servido.h['content-type'], 'image/gif');
  assert.equal(servido.h['content-disposition'], "inline; filename*=UTF-8''parecer.gif");
  // registro antigo com o nome torto: sai com a extensão certa também
  db.envios.find((x) => x.id === id).arquivos[0].nome = 'antigo.bat';
  assert.equal((await pedir(`/api/envios/${id}`)).j.arquivos[0].nome, 'antigo.gif');
  assert.equal((await pedir(a.url)).h['content-disposition'], "inline; filename*=UTF-8''antigo.gif");
});

// um upload que manda o começo e espera o sinal pra mandar o resto
function uploadLento(id, conteudo, extra = 64) {
  let soltar;
  const resposta = new Promise((ok, erro) => {
    const req = http.request({
      host: '127.0.0.1', port: servidor.address().port, path: `/api/envios/${id}/arquivos`, method: 'POST',
      headers: { 'content-length': String(conteudo.length + extra), 'x-nome-arquivo': 'lento.png', 'x-teste-quem': 'time' },
    }, (res) => {
      const pedacos = [];
      res.on('data', (c) => pedacos.push(c));
      res.on('end', () => ok({ status: res.statusCode, j: JSON.parse(Buffer.concat(pedacos).toString('utf8') || 'null') }));
    });
    req.on('error', erro);
    req.write(conteudo);
    soltar = () => req.end(Buffer.alloc(extra, 1));
  });
  return { resposta, soltar: () => soltar() };
}
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

test('vaga: o upload em andamento já ocupa a vaga, o próximo leva 409 antes de mandar o corpo', async () => {
  const id = (await pedir('/api/envios', { metodo: 'POST', corpo: { titulo: 'Cheio', base: 'Base' } })).j.id;
  for (let i = 0; i < envios.MAX_ARQUIVOS - 1; i++) assert.equal((await subir(id, `f${i}.png`, PNG)).status, 201);
  const lento = uploadLento(id, PNG);
  await esperar(80);
  const segundo = await subir(id, 'outro.png', PNG);
  assert.equal(segundo.status, 409);
  assert.match(segundo.j.erro, /contando os que estão subindo agora/);
  lento.soltar();
  const r = await lento.resposta;
  assert.equal(r.status, 201);
  assert.equal(r.j.arquivos.length, envios.MAX_ARQUIVOS);
  // a vaga foi solta: com um tirado, entra de novo
  await pedir(r.j.arquivos[0].url, { metodo: 'DELETE' });
  assert.equal((await subir(id, 'volta.png', PNG)).status, 201);
  assert.deepEqual(temporarios(), []);
});

test('espaço: sem 2 GB livres depois do arquivo, 507 antes de ler o corpo; sem medir o disco, 503', async () => {
  const id = (await pedir('/api/envios', { metodo: 'POST', corpo: { titulo: 'Disco', base: 'Base' } })).j.id;
  try {
    envios.disco.livre = async () => envios.ESPACO_MIN + 1000;
    const r = await new Promise((ok, erro) => {
      const req = http.request({
        host: '127.0.0.1', port: servidor.address().port, path: `/api/envios/${id}/arquivos`, method: 'POST',
        headers: { 'content-length': '5000', 'x-nome-arquivo': 'grande.png', 'x-teste-quem': 'time' },
      }, (res) => {
        const pedacos = [];
        res.on('data', (c) => pedacos.push(c));
        res.on('end', () => ok({ status: res.statusCode, h: res.headers, j: JSON.parse(Buffer.concat(pedacos).toString('utf8')) }));
      });
      req.on('error', (e) => (['ECONNRESET', 'EPIPE'].includes(e.code) ? null : erro(e)));
      req.write(PNG);
    });
    assert.equal(r.status, 507);
    assert.equal(r.j.erro, envios.MSG_SEM_ESPACO);
    assert.equal(r.h.connection, 'close');
    // cabe: o arquivo pequeno deixa os 2 GB
    assert.equal((await subir(id, 'pequeno.png', PNG)).status, 201);
    envios.disco.livre = async () => {
      throw Object.assign(new Error('sem statfs'), { code: 'ENOSYS' });
    };
    assert.equal((await subir(id, 'cego.png', PNG)).status, 503);
  } finally {
    envios.disco.livre = DISCO_FOLGADO;
  }
  assert.deepEqual(temporarios(), []);
  assert.equal((await pedir(`/api/envios/${id}`)).j.arquivos.length, 1);
});

test('pedido que morreu antes do pipe: recusa na hora, sem ficar esperando', async () => {
  const morto = new Readable({ read() {} });
  morto.destroy();
  const destino = path.join(dados, 'morto.bin');
  await assert.rejects(envios.gravarCorpo(morto, destino), (e) => e.status === 400 && e.message === envios.MSG_PAROU);
  assert.equal(existsSync(destino), false);
});

test('temporário de upload com mais de 30 min sai; o recente fica', async () => {
  mkdirSync(pastaEnvios, { recursive: true });
  const velho = path.join(pastaEnvios, `.subindo-${randomUUID()}.tmp`);
  const novo = path.join(pastaEnvios, `.subindo-${randomUUID()}.tmp`);
  const outro = path.join(pastaEnvios, '.subindo-nao-e-nosso.tmp');
  for (const p of [velho, novo, outro]) writeFileSync(p, 'x');
  const antigo = new Date(Date.now() - 31 * 60_000);
  utimesSync(velho, antigo, antigo);
  utimesSync(outro, antigo, antigo);
  assert.equal(await envios.limparTemporariosVelhos(), 1);
  assert.equal(existsSync(velho), false);
  assert.equal(existsSync(novo), true);
  assert.equal(existsSync(outro), true, 'nome fora do padrão não é nosso');
  rmSync(novo);
  rmSync(outro);
});
