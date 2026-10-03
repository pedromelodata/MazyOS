// Testes dos vídeos finais (02/10): regras do caminho (db.mjs), lista das propostas e entrega com Range
// (videos.mjs), pedaços do player, trava da senha temporária (auth.mjs) e o boot com travessão no nome do arquivo
// (migrar.mjs) e a capa feita pelo ffmpeg. Tudo numa pasta temporária com arquivos falsos (e vídeos de 2 s feitos
// pelo ffmpeg): a pasta marketing/final de verdade não é lida.
// Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, symlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { Writable } from 'node:stream';
import v8 from 'node:v8';
import vm from 'node:vm';

// coleta de lixo na mão: arquivo esquecido aberto é fechado por ela, e no Node 26 isso derruba o processo
v8.setFlagsFromString('--expose-gc');
const gc = vm.runInNewContext('gc');

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-videos-'));
const final = path.join(raiz, 'final');
const fora = path.join(raiz, 'fora');
process.env.CRONOGRAMA_DATA = path.join(raiz, 'data');
process.env.CRONOGRAMA_FINAL = final;
const { caminhoVideo, limparVideos } = await import('../db.mjs');
const videos = await import('../videos.mjs');
const { presoNaSenhaTemporaria } = await import('../auth.mjs');
const { semTracosFundo, migrar } = await import('../migrar.mjs');
const MB = 1024 * 1024;

const escrever = (rel, conteudo = '0123456789') => {
  const p = path.join(final, ...rel.split('/'));
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, conteudo);
};
escrever('2026-10-14 Proposta A/A-motion.mp4');
escrever('2026-10-14 Proposta A/notas.txt', 'texto');
escrever('2026-09-29 Proposta B/B.mov', 'mov');
escrever('2026-09-29 Proposta B/cortes/B-15s.mp4', 'curto');
escrever('Sem data/clip.MP4', 'clip');
escrever('_versoes-anteriores/Proposta A/A-v1.mp4');
escrever('src/final.html', '<html>');
escrever('src/x.mp4');
escrever('Vazia/leia.md', 'nada');
escrever('.oculta/x.mp4');
writeFileSync(path.join(final, 'LEIA-ME.md'), '# leia');
mkdirSync(fora, { recursive: true });
writeFileSync(path.join(fora, 'fora.mp4'), 'segredo');
// junção (o Windows cria sem ser administrador) apontando pra fora da pasta
let comJuncao = true;
try {
  symlinkSync(fora, path.join(final, 'Atalho'), 'junction');
} catch {
  comJuncao = false;
}

after(() => rmSync(raiz, { recursive: true, force: true }));

test('caminho do vídeo: relativo, visível e com extensão de vídeo', () => {
  const ok = '2026-10-14 O app fazendo a guia do mês, sem site do governo/GUIA-PRONTA-motion-v4.mp4';
  assert.equal(caminhoVideo(ok), ok);
  assert.equal(caminhoVideo('Pasta/clip.MOV'), 'Pasta/clip.MOV');
  assert.equal(caminhoVideo('Pasta/sub/clip.webm'), 'Pasta/sub/clip.webm');
  for (const ruim of [
    '../x.mp4', 'a/../x.mp4', './x.mp4', '/abs/x.mp4', 'C:/x.mp4', 'C:x.mp4', 'a\\b.mp4', '\\\\servidor\\x.mp4',
    '_versoes-anteriores/x.mp4', '.oculta/x.mp4', 'a/x.txt', 'a/x', 'a/x.mp4 ', 'a./x.mp4', 'a//x.mp4', 'a/x.mp4:fluxo',
    'a/x\u0000.mp4', '', null, 42, 'a/'.repeat(250) + 'x.mp4',
  ]) assert.equal(caminhoVideo(ruim), null, `deveria recusar ${JSON.stringify(ruim)}`);
});

test('limparVideos: forma, rótulo obrigatório, repetido, travessão e limite', () => {
  assert.deepEqual(limparVideos(null), []);
  assert.deepEqual(limparVideos([{ arquivo: 'P/a.mp4', rotulo: 'Motion', aviso: '' }]), [{ arquivo: 'P/a.mp4', rotulo: 'Motion' }]);
  const traco = String.fromCharCode(0x2014);
  assert.deepEqual(
    limparVideos([{ arquivo: 'P/a.mp4', rotulo: '  Com o  Léo ', aviso: `Trocar a trilha ${traco} antes` }]),
    [{ arquivo: 'P/a.mp4', rotulo: 'Com o Léo', aviso: 'Trocar a trilha, antes' }],
  );
  const recusa = (v, re) => assert.throws(() => limparVideos(v), (e) => e.status === 400 && re.test(e.message));
  recusa('P/a.mp4', /lista/);
  recusa([{ arquivo: '../a.mp4', rotulo: 'X' }], /arquivo/);
  recusa([{ arquivo: 'P/a.mp4', rotulo: ' ' }], /rotulo/);
  recusa([{ arquivo: 'P/a.mp4', rotulo: 'A' }, { arquivo: 'p/A.MP4', rotulo: 'B' }], /repete/);
  recusa([{ arquivo: 'P/a.mp4', rotulo: 'A', aviso: 'x'.repeat(301) }], /300/);
  recusa(Array.from({ length: 13 }, (_, i) => ({ arquivo: `P/${i}.mp4`, rotulo: 'A' })), /12/);
});

test('endereço /videos/...: cada pedaço decodificado e conferido sozinho', () => {
  assert.equal(videos.relativoDaUrl('/videos/2026-10-14%20Proposta%20A/A-motion.mp4'), '2026-10-14 Proposta A/A-motion.mp4');
  assert.equal(videos.relativoDaUrl('/videos/Caixa%20do%20caminh%C3%A3o/x.mp4'), 'Caixa do caminhão/x.mp4');
  for (const ruim of [
    '/videos/a%2F..%2Fb.mp4', '/videos/%2e%2e/x.mp4', '/videos/C%3A/x.mp4', '/videos/a%5Cb.mp4', '/videos/a/%E0%A4%A.mp4',
    '/videos/a/b.txt', '/videos/_versoes-anteriores/a.mp4', '/videos//a.mp4', '/videos/', '/outra/a.mp4',
  ]) assert.equal(videos.relativoDaUrl(ruim), null, `deveria recusar ${ruim}`);
  assert.equal(videos.urlDoVideo('Caixa do caminhão (iPhone)/a b.mp4'), '/videos/Caixa%20do%20caminh%C3%A3o%20(iPhone)/a%20b.mp4');
});

test('Range: um pedaço, sufixo, aberto, fora do arquivo e cabeçalho torto', () => {
  assert.deepEqual(videos.intervalo('bytes=0-99', 1000), { inicio: 0, fim: 99 });
  assert.deepEqual(videos.intervalo('bytes=900-', 1000), { inicio: 900, fim: 999 });
  assert.deepEqual(videos.intervalo('bytes=-100', 1000), { inicio: 900, fim: 999 });
  assert.deepEqual(videos.intervalo('bytes=-5000', 1000), { inicio: 0, fim: 999 });
  assert.deepEqual(videos.intervalo('bytes=10-5000', 1000), { inicio: 10, fim: 999 });
  assert.equal(videos.intervalo('bytes=1000-', 1000), 'fora');
  assert.equal(videos.intervalo('bytes=-0', 1000), 'fora');
  assert.equal(videos.intervalo('bytes=0-', 0), 'fora');
  assert.equal(videos.intervalo('bytes=5-3', 1000), null);
  assert.equal(videos.intervalo('bytes=0-1,5-6', 1000), null);
  assert.equal(videos.intervalo('itens=0-1', 1000), null);
  assert.equal(videos.intervalo('bytes=-', 1000), null);
});

// User-Agent de verdade dos navegadores (o pedaço só vale pro player do Chrome, do Edge e do Firefox)
const UA = {
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  chromeIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.0.0 Mobile/15E148 Safari/604.1',
  safariIpad: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
};

// 02/10: com o resto do arquivo, o Edge lia de 3 a 7 MB de cada vídeo com preload="metadata"
test('Range do player: até o fim (aberto ou fechado no último byte) vem em pedaços que crescem; o resto, como pedido', () => {
  const player = { player: true };
  const tam = 10 * MB;
  // o pedaço: metade da posição, de 1 MB a 4 MB
  for (const [pos, pedaco] of [[0, MB], [MB, MB], [2 * MB, MB], [3 * MB, 1.5 * MB], [8 * MB, 4 * MB], [30 * MB, 4 * MB]]) {
    assert.equal(videos.pedacoDoPlayer(pos), pedaco, `posição ${pos}`);
  }
  assert.deepEqual(videos.intervalo('bytes=0-', tam, player), { inicio: 0, fim: MB - 1 });
  // a continuação do Chrome e do Edge: fechada no último byte
  assert.deepEqual(videos.intervalo(`bytes=${MB}-${tam - 1}`, tam, player), { inicio: MB, fim: 2 * MB - 1 });
  assert.deepEqual(videos.intervalo(`bytes=${MB}-${tam + 50}`, tam, player), { inicio: MB, fim: 2 * MB - 1 });
  assert.deepEqual(videos.intervalo(`bytes=${3 * MB}-`, tam, player), { inicio: 3 * MB, fim: 4.5 * MB - 1 });
  assert.deepEqual(videos.intervalo(`bytes=${8 * MB}-`, tam, player), { inicio: 8 * MB, fim: tam - 1 });
  assert.deepEqual(videos.intervalo('bytes=0-', 500, player), { inicio: 0, fim: 499 });
  // fechada antes do fim e sufixo: como pedidos
  assert.deepEqual(videos.intervalo('bytes=0-99', tam, player), { inicio: 0, fim: 99 });
  assert.deepEqual(videos.intervalo(`bytes=0-${9 * MB}`, tam, player), { inicio: 0, fim: 9 * MB });
  assert.deepEqual(videos.intervalo('bytes=-100', tam, player), { inicio: tam - 100, fim: tam - 1 });
  assert.equal(videos.intervalo(`bytes=${tam}-`, tam, player), 'fora');
  // fora do player (Baixar, retomada de download, Safari): até o fim
  assert.deepEqual(videos.intervalo('bytes=0-', tam), { inicio: 0, fim: tam - 1 });
  assert.deepEqual(videos.intervalo(`bytes=${MB}-${tam - 1}`, tam), { inicio: MB, fim: tam - 1 });
  const pedido = (destino, ua) => ({ headers: { ...(destino ? { 'sec-fetch-dest': destino } : {}), ...(ua ? { 'user-agent': ua } : {}) } });
  for (const [destino, ua, sim] of [
    ['video', UA.edge, true], ['audio', UA.edge, true], ['Video', UA.chromeAndroid, true], ['video', UA.firefox, true],
    ['video', UA.safariMac, false], ['video', UA.chromeIphone, false], ['video', UA.safariIpad, false],
    ['document', UA.edge, false], ['empty', UA.edge, false], [undefined, UA.edge, false], ['video', undefined, false],
  ]) {
    assert.equal(videos.pedidoDoPlayer(pedido(destino, ua)), sim, `${destino} ${ua}`);
  }
});

test('senha temporária: a API e o vídeo final ficam presos até trocar, a página abre', () => {
  const temporaria = { trocarSenha: true };
  for (const preso of ['/videos/2026-10-14%20Proposta%20A/A-motion.mp4', '/videos/x', '/api/videos', '/api/estado']) {
    assert.equal(presoNaSenhaTemporaria(temporaria, preso), true, preso);
  }
  for (const livre of ['/api/auth/estado', '/api/auth/senha', '/api/auth/sair', '/', '/index.html', '/js/main.js', '/videosx']) {
    assert.equal(presoNaSenhaTemporaria(temporaria, livre), false, livre);
  }
  assert.equal(presoNaSenhaTemporaria({ trocarSenha: false }, '/videos/a/b.mp4'), false);
  assert.equal(presoNaSenhaTemporaria(null, '/videos/a/b.mp4'), false);
});

test('lista: propostas com vídeo, sem escondidas, src, links e arquivo que não é vídeo', async () => {
  const lista = await videos.propostas();
  assert.deepEqual(lista.map((p) => p.pasta), ['2026-10-14 Proposta A', '2026-09-29 Proposta B', 'Sem data']);
  const [a, b, semData] = lista;
  assert.equal(a.nome, 'Proposta A');
  assert.equal(a.data, '2026-10-14');
  assert.deepEqual(a.arquivos.map((x) => x.arquivo), ['2026-10-14 Proposta A/A-motion.mp4']);
  assert.equal(a.arquivos[0].tamanho, 10);
  assert.ok(!Number.isNaN(Date.parse(a.arquivos[0].modificadoEm)));
  assert.deepEqual(b.arquivos.map((x) => x.arquivo).sort(), ['2026-09-29 Proposta B/B.mov', '2026-09-29 Proposta B/cortes/B-15s.mp4']);
  assert.equal(semData.data, null);
  assert.equal(semData.nome, 'Sem data');
  assert.equal(await videos.propostas(path.join(raiz, 'nao-existe')), null);
});

test('lista com o banco: peças de cada arquivo, ordem da peça e o que falta no disco', async () => {
  const db = {
    reels: [
      { id: 'r1', ideia: 'Reel A', data: '2026-10-14', status: 'editado', videos: [
        { arquivo: '2026-10-14 Proposta A/A-motion.mp4', rotulo: 'Motion' },
        { arquivo: '2026-10-14 Proposta A/sumiu.mp4', rotulo: 'Corte' },
      ] },
      { id: 'r2', ideia: 'Sem vídeo', data: '2026-10-15', status: 'roteiro' },
    ],
    stories: [{ id: 's1', tema: 'Stories B', data: '2026-09-29', status: 'pronto', videos: [
      { arquivo: '2026-09-29 Proposta B/cortes/B-15s.mp4', rotulo: 'Corte de 15 s', aviso: 'Trocar a trilha' },
    ] }],
  };
  const r = await videos.listar(db);
  assert.equal(r.pastaExiste, true);
  const [a, b] = r.propostas;
  assert.deepEqual(a.pecas, [{ tipo: 'reel', id: 'r1', titulo: 'Reel A', data: '2026-10-14', status: 'editado' }]);
  assert.equal(a.arquivos[0].url, '/videos/2026-10-14%20Proposta%20A/A-motion.mp4');
  assert.equal(a.arquivos[0].pecas[0].rotulo, 'Motion');
  // o arquivo que a peça usa vem primeiro
  assert.equal(b.arquivos[0].arquivo, '2026-09-29 Proposta B/cortes/B-15s.mp4');
  assert.equal(b.arquivos[0].pecas[0].aviso, 'Trocar a trilha');
  assert.deepEqual(b.arquivos[1].pecas, []);
  assert.deepEqual(r.faltando, [{ tipo: 'reel', id: 'r1', titulo: 'Reel A', arquivo: '2026-10-14 Proposta A/sumiu.mp4' }]);
  const vazio = await videos.listar({ reels: [], stories: [] }, null);
  assert.deepEqual(vazio, { pastaExiste: false, propostas: [], faltando: [] });
});

// ---------- entrega, num servidor de verdade numa porta livre ----------
const json = (res, codigo, corpo) => {
  res.writeHead(codigo, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(corpo));
};
const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  videos.servir(req, res, url, { json }).catch((e) => json(res, 500, { erro: e.message }));
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
after(() => servidor.close());
const pedir = (caminho, { metodo = 'GET', cabecalhos = {} } = {}) => new Promise((ok, erro) => {
  const req = http.request({ host: '127.0.0.1', port: servidor.address().port, path: caminho, method: metodo, headers: cabecalhos }, (res) => {
    const partes = [];
    res.on('data', (c) => partes.push(c));
    res.on('end', () => {
      const bruto = Buffer.concat(partes);
      ok({ status: res.statusCode, h: res.headers, corpo: bruto.toString('utf8'), bruto });
    });
  });
  req.on('error', erro);
  req.end();
});
const A = '/videos/2026-10-14%20Proposta%20A/A-motion.mp4';

test('entrega: arquivo inteiro, pedaço (206), fora (416), HEAD e cache privado', async () => {
  const r = await pedir(A);
  assert.equal(r.status, 200);
  assert.equal(r.h['content-type'], 'video/mp4');
  assert.equal(r.h['content-length'], '10');
  assert.equal(r.h['accept-ranges'], 'bytes');
  assert.match(r.h['cache-control'], /^private/);
  assert.equal(r.corpo, '0123456789');
  const p = await pedir(A, { cabecalhos: { range: 'bytes=2-5' } });
  assert.equal(p.status, 206);
  assert.equal(p.h['content-range'], 'bytes 2-5/10');
  assert.equal(p.h['content-length'], '4');
  assert.equal(p.corpo, '2345');
  const f = await pedir(A, { cabecalhos: { range: 'bytes=20-' } });
  assert.equal(f.status, 416);
  assert.equal(f.h['content-range'], 'bytes */10');
  const h = await pedir(A, { metodo: 'HEAD' });
  assert.equal(h.status, 200);
  assert.equal(h.corpo, '');
  assert.equal((await pedir('/videos/2026-09-29%20Proposta%20B/B.mov')).h['content-type'], 'video/quicktime');
  assert.equal((await pedir(A, { metodo: 'POST' })).status, 405);
});

test('entrega: ETag (304) e If-Range que não bate manda o arquivo inteiro', async () => {
  const { h } = await pedir(A);
  assert.equal((await pedir(A, { cabecalhos: { 'if-none-match': h.etag } })).status, 304);
  const mudou = await pedir(A, { cabecalhos: { range: 'bytes=0-1', 'if-range': '"outro"' } });
  assert.equal(mudou.status, 200);
  assert.equal(mudou.corpo, '0123456789');
  const igual = await pedir(A, { cabecalhos: { range: 'bytes=0-1', 'if-range': h.etag } });
  assert.equal(igual.status, 206);
});

// 02/10: o Chrome corta pedido de vídeo o tempo todo. Cortado enquanto o arquivo abria, o servidor deixava o
// arquivo aberto e a coleta de lixo derrubava o processo (ERR_INVALID_STATE). Se voltar, este teste cai junto
test('entrega: pedido cortado não deixa arquivo aberto nem derruba o processo', async () => {
  const resFechada = () => {
    const w = new Writable({ write(_c, _e, cb) { cb(); } });
    w.writeHead = () => w;
    w.setHeader = () => {};
    w.destroy();
    return w;
  };
  for (let i = 0; i < 20; i++) {
    await videos.servir({ method: 'GET', headers: i % 2 ? { range: 'bytes=0-3' } : {} }, resFechada(), new URL(`http://localhost${A}`), { json });
  }
  escrever('Grande/grande.mp4', Buffer.alloc(4 * 1024 * 1024, 7));
  for (let i = 0; i < 30; i++) {
    await new Promise((ok) => {
      const req = http.request({ host: '127.0.0.1', port: servidor.address().port, path: '/videos/Grande/grande.mp4', headers: i % 2 ? { range: 'bytes=0-' } : {} }, (res) => {
        res.once('data', () => { req.destroy(); ok(); });
        res.on('error', ok);
      });
      req.on('error', () => ok());
      req.end();
      if (i % 3 === 0) setImmediate(() => { req.destroy(); ok(); });
    });
  }
  for (let i = 0; i < 3; i++) {
    gc();
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal((await pedir(A)).status, 200);
});

test('entrega: recusa fora da pasta, escondido, não vídeo, link pra fora e o que não existe', async () => {
  for (const [caminho, codigo] of [
    ['/videos/..%2F..%2Ffora%2Ffora.mp4', 400],
    ['/videos/%2e%2e/fora/fora.mp4', 400],
    ['/videos/C%3A%2FWindows%2Fwin.ini', 400],
    ['/videos/_versoes-anteriores/Proposta%20A/A-v1.mp4', 400],
    ['/videos/.oculta/x.mp4', 400],
    ['/videos/2026-10-14%20Proposta%20A/notas.txt', 400],
    ['/videos/Nada/x.mp4', 404],
    ...(comJuncao ? [['/videos/Atalho/fora.mp4', 403]] : []),
  ]) {
    const r = await pedir(caminho);
    assert.equal(r.status, codigo, `${caminho} deveria dar ${codigo} (deu ${r.status})`);
    assert.doesNotMatch(r.corpo, /segredo/);
  }
});

test('entrega: o player do Chrome e do Edge recebe em pedaços, sem buraco; Baixar, Safari e faixa fechada, como pedidos', async () => {
  const conteudo = Buffer.alloc(7 * MB);
  for (let i = 0; i < conteudo.length; i++) conteudo[i] = i % 251;
  escrever('Pedacos/p.mp4', conteudo);
  const P = '/videos/Pedacos/p.mp4';
  const player = { 'sec-fetch-dest': 'video', 'user-agent': UA.edge };
  // começo do arquivo: 1 MB, com o fim real do pedaço no Content-Range
  const a = await pedir(P, { cabecalhos: { ...player, range: 'bytes=0-' } });
  assert.equal(a.status, 206);
  assert.equal(a.h['content-range'], `bytes 0-${MB - 1}/${7 * MB}`);
  assert.equal(a.h['content-length'], String(MB));
  assert.ok(a.bruto.equals(conteudo.subarray(0, MB)));
  // o Edge pede a continuação de onde parou, fechada no último byte: o resto chega inteiro, pedaço por pedaço
  const pedacos = [a.bruto];
  const tamanhos = [a.bruto.length];
  let pos = MB;
  while (pos < conteudo.length) {
    const r = await pedir(P, { cabecalhos: { ...player, range: `bytes=${pos}-${conteudo.length - 1}` } });
    assert.equal(r.status, 206);
    const fim = Math.min(conteudo.length, pos + videos.pedacoDoPlayer(pos)) - 1;
    assert.equal(r.h['content-range'], `bytes ${pos}-${fim}/${conteudo.length}`);
    pedacos.push(r.bruto);
    tamanhos.push(r.bruto.length);
    pos = fim + 1;
  }
  // 1 MB, 1 MB, 1 MB, 1,5 MB, 2,25 MB e o que sobra
  assert.deepEqual(tamanhos, [MB, MB, MB, 1.5 * MB, 2.25 * MB, 0.25 * MB]);
  assert.ok(Buffer.concat(pedacos).equals(conteudo));
  // Baixar (sem Range) e retomada de download (aberto, mas sem ser o player): até o fim
  const inteiro = await pedir(P, { cabecalhos: { 'sec-fetch-dest': 'document', 'user-agent': UA.edge } });
  assert.equal(inteiro.status, 200);
  assert.equal(inteiro.bruto.length, conteudo.length);
  const retomada = await pedir(P, { cabecalhos: { range: `bytes=${3 * MB}-`, 'user-agent': UA.edge } });
  assert.equal(retomada.h['content-range'], `bytes ${3 * MB}-${7 * MB - 1}/${7 * MB}`);
  assert.ok(retomada.bruto.equals(conteudo.subarray(3 * MB)));
  // Safari e iPhone conferem o tamanho do que veio: exatamente o pedido, mesmo até o fim
  for (const ua of [UA.safariMac, UA.chromeIphone]) {
    const s = await pedir(P, { cabecalhos: { 'sec-fetch-dest': 'video', 'user-agent': ua, range: `bytes=0-${7 * MB - 1}` } });
    assert.equal(s.h['content-range'], `bytes 0-${7 * MB - 1}/${7 * MB}`);
    assert.equal(s.bruto.length, 7 * MB);
  }
  // faixa fechada antes do fim (a sonda de 2 bytes, um trecho do meio): exatamente o pedido
  const sonda = await pedir(P, { cabecalhos: { ...player, range: 'bytes=0-1' } });
  assert.equal(sonda.h['content-length'], '2');
  const meio = await pedir(P, { cabecalhos: { ...player, range: `bytes=${MB}-${5 * MB}` } });
  assert.equal(meio.bruto.length, 4 * MB + 1);
});

// 02/10: o boot trocava por vírgula o travessão de todo texto da peça, inclusive videos[].arquivo: o caminho deixava
// de bater com o disco e o vídeo aparecia como faltando
test('travessão no nome do arquivo: o boot não mexe no caminho, só no rótulo e no aviso', async () => {
  const traco = String.fromCharCode(0x2014);
  const meia = String.fromCharCode(0x2013);
  const arquivo = `Vinheta O Check/vinheta ${traco} teste ${meia} 2.mp4`;
  // a validação aceita do jeito que está no disco
  assert.deepEqual(limparVideos([{ arquivo, rotulo: 'Motion' }]), [{ arquivo, rotulo: 'Motion' }]);
  // a troca do boot, direto
  const peca = { legenda: `a ${traco} b`, videos: [{ arquivo, rotulo: `Com ${traco} Léo`, aviso: `Trocar ${meia} já` }] };
  semTracosFundo(peca);
  assert.deepEqual(peca, { legenda: 'a, b', videos: [{ arquivo, rotulo: 'Com, Léo', aviso: 'Trocar, já' }] });
  // o boot de verdade (migrar), num banco temporário com um reel e um stories do dia
  const dados = process.env.CRONOGRAMA_DATA;
  mkdirSync(dados, { recursive: true });
  writeFileSync(path.join(dados, 'estilos.json'), '{}');
  const lista = () => [{ arquivo, rotulo: `Motion ${traco} v2`, aviso: `Trocar a trilha ${traco} antes` }];
  writeFileSync(path.join(dados, 'db.json'), JSON.stringify({
    schemaVersion: 2,
    reels: [{ id: 'reel_t1', ideia: `Vinheta ${traco} teste`, data: '2026-10-05', status: 'editado', videos: lista() }],
    stories: [{ id: 'sto_t1', data: '2026-10-05', tema: 'Abertura', status: 'pronto', videos: lista() }],
  }));
  const db = await migrar();
  const gravado = JSON.parse(readFileSync(path.join(dados, 'db.json'), 'utf8'));
  for (const banco of [db, gravado]) {
    for (const item of [banco.reels[0], banco.stories[0]]) {
      assert.deepEqual(item.videos, [{ arquivo, rotulo: 'Motion, v2', aviso: 'Trocar a trilha, antes' }]);
    }
    assert.equal(banco.reels[0].ideia, 'Vinheta, teste');
  }
  // o arquivo no disco é achado pela lista e entregue pelo endereço
  escrever(arquivo, 'vinheta');
  const r = await videos.listar(db);
  assert.deepEqual(r.faltando, []);
  const achado = r.propostas.find((p) => p.pasta === 'Vinheta O Check').arquivos[0];
  assert.equal(achado.arquivo, arquivo);
  assert.deepEqual(achado.pecas.map((x) => x.id), ['reel_t1', 'sto_t1']);
  const servido = await pedir(achado.url);
  assert.equal(servido.status, 200);
  assert.equal(servido.corpo, 'vinheta');
});

// 02/10: capa da página "Vídeos prontos", feita pelo ffmpeg e guardada em data/capas-videos (nunca na pasta final)
const FFMPEG = process.env.CRONOGRAMA_FFMPEG || 'ffmpeg';
const temFfmpeg = !spawnSync(FFMPEG, ['-version'], { windowsHide: true }).error;

test('capa: feita pelo ffmpeg uma vez, guardada na pasta de dados e trocada quando o vídeo muda', { skip: !temFfmpeg && 'sem ffmpeg nesta máquina' }, async () => {
  const fazer = (rel, segundos) => {
    const p = path.join(final, ...rel.split('/'));
    mkdirSync(path.dirname(p), { recursive: true });
    const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=red:s=64x112:d=${segundos}:r=10`,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', p], { windowsHide: true });
    assert.equal(r.status, 0, String(r.stderr));
  };
  fazer('Capas/c.mp4', 2);
  const lista = await videos.listar({ reels: [], stories: [] });
  const item = lista.propostas.find((p) => p.pasta === 'Capas').arquivos[0];
  assert.match(item.capa, /^\/videos\/Capas\/c\.mp4\?capa=[0-9a-z]+-[0-9a-z]+$/);
  const r = await pedir(item.capa);
  assert.equal(r.status, 200);
  assert.equal(r.h['content-type'], 'image/jpeg');
  assert.match(r.h['cache-control'], /^private/);
  assert.deepEqual([...r.bruto.subarray(0, 2)], [0xff, 0xd8]);
  assert.ok(videos.PASTA_CAPAS.startsWith(path.resolve(process.env.CRONOGRAMA_DATA)));
  const capas = () => readdirSync(videos.PASTA_CAPAS).filter((n) => n.endsWith('.jpg'));
  assert.equal(capas().length, 1);
  // de novo: a mesma, do disco; com a ETag, 304
  assert.ok((await pedir(item.capa)).bruto.equals(r.bruto));
  assert.equal((await pedir(item.capa, { cabecalhos: { 'if-none-match': r.h.etag } })).status, 304);
  // vídeo refeito no lugar (outro tamanho): capa nova e a velha sai
  fazer('Capas/c.mp4', 3);
  const nova = await pedir(item.capa);
  assert.equal(nova.status, 200);
  assert.notEqual(nova.h.etag, r.h.etag);
  assert.equal(capas().length, 1);
  // vídeo com menos de 1 s: o primeiro quadro
  fazer('Capas/curto.mp4', 0.3);
  assert.equal((await pedir('/videos/Capas/curto.mp4?capa=1')).status, 200);
  // arquivo que o ffmpeg não abre: 404 (a tela volta pro preload="metadata") e as outras capas seguem saindo
  escrever('Capas/quebrado.mp4', 'isto não é vídeo');
  assert.equal((await pedir('/videos/Capas/quebrado.mp4?capa=1')).status, 404);
  assert.equal((await pedir(item.capa)).status, 200);
  // as mesmas regras do vídeo: não vídeo, escondido, fora da pasta e o que não existe
  assert.equal((await pedir('/videos/2026-10-14%20Proposta%20A/notas.txt?capa=1')).status, 400);
  assert.equal((await pedir('/videos/_versoes-anteriores/Proposta%20A/A-v1.mp4?capa=1')).status, 400);
  assert.equal((await pedir('/videos/..%2Ffora%2Ffora.mp4?capa=1')).status, 400);
  assert.equal((await pedir('/videos/Nada/x.mp4?capa=1')).status, 404);
  if (comJuncao) assert.equal((await pedir('/videos/Atalho/fora.mp4?capa=1')).status, 403);
  // nada de capa dentro da pasta dos vídeos
  const naFinal = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? naFinal(path.join(dir, e.name)) : [e.name]));
  assert.ok(!naFinal(final).some((n) => n.endsWith('.jpg')));
});

// por último: sem ffmpeg o servidor guarda isso por 10 minutos
test('capa: sem ffmpeg, 404 (a tela volta pro preload="metadata") e o vídeo segue saindo', async () => {
  const antes = process.env.CRONOGRAMA_FFMPEG;
  process.env.CRONOGRAMA_FFMPEG = path.join(raiz, 'nao-existe', 'ffmpeg.exe');
  try {
    escrever('SemFfmpeg/s.mp4', '0123456789');
    assert.equal((await pedir('/videos/SemFfmpeg/s.mp4?capa=1')).status, 404);
    assert.equal((await pedir('/videos/SemFfmpeg/s.mp4?capa=2')).status, 404);
    const v = await pedir('/videos/SemFfmpeg/s.mp4');
    assert.equal(v.status, 200);
    assert.equal(v.corpo, '0123456789');
  } finally {
    if (antes === undefined) delete process.env.CRONOGRAMA_FFMPEG;
    else process.env.CRONOGRAMA_FFMPEG = antes;
  }
});
