// Testes do server.mjs nas peças e na aprovação (21/10, Pedro), no servidor de verdade (node server/server.mjs) numa
// porta alta, com uma cópia de dados temporária, sem agenda e sem IA:
//  - POST /api/reels e POST /api/reels/lote não criam peça de feed já postada sem aprovação (a de data passada pode)
//  - PUT /api/reels/:id: vídeo final, tipo de peça e fontes trocados tiram a aprovação; "Marcar como postado" confere a
//    peça como estava e como fica (tipo de peça novo, texto mudado no mesmo pedido)
//  - /api/estado leva a aprovação na forma da aba (etapa de agora, só os gerentes de agora em "aprovaram")
//  - corpo lento: só o upload com sessão fica com os 30 min; o resto cai em CRONOGRAMA_PRAZO_CORPO
// O banco de verdade (data/) não é lido. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-servidor-'));
const dados = path.join(raiz, 'data');
process.env.CRONOGRAMA_DATA = dados;
mkdirSync(dados, { recursive: true });
writeFileSync(path.join(dados, 'estilos.json'), '{}');
const auth = await import('../auth.mjs');

const FUTURO = '2099-03-10';
const PRAZO = 1500;
const MSG_TRAVA = 'Falta a aprovação técnica: mande a peça pra aprovação e espere o Diretor contábil aprovar.';
const aprovado = () => ({ estado: 'aprovado', etapa: 'diretor', decididoEm: new Date().toISOString(), decididoPor: 'Diretor', conversa: [] });
const peca = (id, extra = {}) => ({
  id, ideia: `Peça ${id}`, data: FUTURO, peca: 'reel', status: 'roteiro', legenda: 'Legenda aprovada',
  roteiro: { hook: 'Gancho', textoTela: '', cenas: [], desenvolvimento: 'Meio', cta: 'Fim' },
  fontes: ['F051'], videos: [{ arquivo: 'proposta/final.mp4', rotulo: 'Motion' }], aprovacao: null, ...extra,
});
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({
  schemaVersion: 2,
  reels: [
    peca('reel_video', { aprovacao: aprovado() }),
    peca('reel_tipo', { aprovacao: aprovado() }),
    peca('reel_junto', { aprovacao: aprovado() }),
    peca('reel_limpo', { aprovacao: aprovado() }),
    peca('reel_stories', { peca: 'stories', aprovacao: null }),
    // pendentes gravados com a etapa dos gerentes: um com a aprovação do gerente de agora (agora é do diretor), outro
    // com a de quem deixou de ser gerente (segue com os gerentes, sem ninguém em "aprovaram")
    peca('reel_pend', { aprovacao: { estado: 'pendente', etapa: 'gerentes', gerentes: { aprovaram: [{ id: 'usr_ger', nome: 'Gerente' }] }, conversa: [] } }),
    peca('reel_pend_ex', { aprovacao: { estado: 'pendente', etapa: 'gerentes', gerentes: { aprovaram: [{ id: 'usr_ex', nome: 'Ex Gerente' }] }, conversa: [] } }),
  ],
}));
const SENHA = 'senha-de-teste-123';
const hash = await auth.hashSenha(SENHA);
writeFileSync(path.join(dados, 'usuarios.json'), JSON.stringify([
  { id: 'usr_ger', usuario: 'gerente', nome: 'Gerente', hash, papel: 'gerente', criadoEm: '2026-01-01T00:00:00.000Z', trocarSenha: false },
  { id: 'usr_op', usuario: 'operador', nome: 'Operador', hash, papel: 'operador', criadoEm: '2026-01-02T00:00:00.000Z', trocarSenha: false },
  { id: 'usr_ex', usuario: 'exgerente', nome: 'Ex Gerente', hash, papel: 'operador', criadoEm: '2026-01-03T00:00:00.000Z', trocarSenha: false },
]));

// ---------- o servidor de verdade numa porta alta ----------

const SERVER = path.join(import.meta.dirname, '..', 'server.mjs');
let real = null;
for (let tentativa = 0; tentativa < 5 && !real; tentativa++) {
  const porta = 41_000 + Math.floor(Math.random() * 8_000);
  const filho = spawn(process.execPath, [SERVER], {
    env: { ...process.env, CRONOGRAMA_DATA: dados, CRONOGRAMA_AGENDA: '0', CRONOGRAMA_IA: '0', CRONOGRAMA_PRAZO_CORPO: String(PRAZO), PORT: String(porta) },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  const subiu = await new Promise((ok) => {
    let saida = '';
    const relogio = setTimeout(() => ok(false), 30_000);
    filho.stdout.on('data', (c) => {
      saida += c;
      if (saida.includes('Gestão de Marketing no ar')) {
        clearTimeout(relogio);
        ok(true);
      }
    });
    filho.stderr.on('data', (c) => { saida += c; });
    filho.on('exit', () => {
      clearTimeout(relogio);
      ok(false);
    });
  });
  if (subiu) real = { filho, porta };
  else filho.kill();
}
if (!real) throw new Error('O servidor de teste não subiu.');
after(async () => {
  if (real.filho.exitCode !== null) return;
  const saiu = new Promise((ok) => real.filho.once('exit', ok));
  real.filho.kill();
  await saiu;
});

function pedir(caminho, { metodo = 'GET', cookie, corpo } = {}) {
  return new Promise((ok, erro) => {
    const cru = corpo === undefined ? null : Buffer.from(JSON.stringify(corpo));
    const h = { host: `localhost:${real.porta}`, ...(cookie ? { cookie } : {}), ...(cru ? { 'content-length': cru.length, 'content-type': 'application/json' } : {}) };
    const req = http.request({ host: '127.0.0.1', port: real.porta, path: caminho, method: metodo, headers: h, agent: false }, (res) => {
      const pedacos = [];
      res.on('data', (c) => pedacos.push(c));
      res.on('end', () => {
        let j = null;
        try {
          j = JSON.parse(Buffer.concat(pedacos).toString('utf8'));
        } catch {}
        ok({ status: res.statusCode, h: res.headers, j });
      });
    });
    req.on('error', erro);
    req.end(cru ?? undefined);
  });
}
async function entrar(usuario) {
  const r = await pedir('/api/auth/entrar', { metodo: 'POST', corpo: { usuario, senha: SENHA } });
  assert.equal(r.status, 200, `login ${usuario}: ${JSON.stringify(r.j)}`);
  return [r.h['set-cookie']].flat().map((c) => c.split(';')[0]).join('; ');
}
const op = await entrar('operador');
const estado = async () => (await pedir('/api/estado', { cookie: op })).j;
const doEstado = async (id) => (await estado()).reels.find((r) => r.id === id);

// ---------- peça nova postada ----------

test('POST /api/reels e o lote: peça de feed de hoje em diante não nasce postada sem aprovação', async () => {
  const feed = await pedir('/api/reels', { metodo: 'POST', cookie: op, corpo: { ideia: 'Postada sem aprovação', peca: 'estatico', data: FUTURO, status: 'publicado' } });
  assert.equal(feed.status, 409);
  assert.equal(feed.j.erro, MSG_TRAVA);
  assert.ok(!(await estado()).reels.some((r) => r.ideia === 'Postada sem aprovação'), 'nada foi criado');
  // data passada (registro do que já foi ao ar) e stories: pode
  const passada = await pedir('/api/reels', { metodo: 'POST', cookie: op, corpo: { ideia: 'Já foi ao ar', peca: 'reel', data: '2026-01-05', status: 'publicado' } });
  assert.equal(passada.status, 201);
  const stories = await pedir('/api/reels', { metodo: 'POST', cookie: op, corpo: { ideia: 'Stories postados', peca: 'stories', data: FUTURO, status: 'publicado' } });
  assert.equal(stories.status, 201);
  const ok = await pedir('/api/reels', { metodo: 'POST', cookie: op, corpo: { ideia: 'Em roteiro', peca: 'reel', data: FUTURO, status: 'roteiro' } });
  assert.equal(ok.status, 201);
  // o lote: o item postado vira problema e nada é criado
  const lote = await pedir('/api/reels/lote', {
    metodo: 'POST', cookie: op,
    corpo: { reels: [{ tipo: 'vendas', data: FUTURO, ideia: 'Lote postado', peca: 'estatico', status: 'publicado' }, { tipo: 'vendas', data: FUTURO, ideia: 'Lote ok', peca: 'estatico' }] },
  });
  assert.equal(lote.status, 400);
  assert.deepEqual(lote.j.problemas.map((p) => [p.indice, p.erro]), [[0, MSG_TRAVA]]);
});

// ---------- edição de peça aprovada ----------

test('PUT /api/reels: vídeo final, tipo de peça e fontes trocados tiram a aprovação', async () => {
  const mesmo = await pedir('/api/reels/reel_video', { metodo: 'PUT', cookie: op, corpo: { videos: [{ arquivo: 'proposta/final.mp4', rotulo: 'Outro rótulo' }], fontes: [' F051 '] } });
  assert.equal(mesmo.status, 200);
  assert.equal(mesmo.j.aprovacao.estado, 'aprovado', 'o mesmo arquivo e a mesma fonte não contam');
  const video = await pedir('/api/reels/reel_video', { metodo: 'PUT', cookie: op, corpo: { videos: [{ arquivo: 'proposta/outro.mp4', rotulo: 'Motion' }] } });
  assert.equal(video.status, 200);
  assert.equal(video.j.aprovacao.estado, 'alterado');
  assert.deepEqual(video.j.aprovacao.conversa.at(-1).mudou, ['vídeo final']);
  assert.equal(video.j.aprovacao.conversa.at(-1).autor, 'Operador');
  const tipo = await pedir('/api/reels/reel_tipo', { metodo: 'PUT', cookie: op, corpo: { peca: 'estatico', fontes: ['inventada'] } });
  assert.equal(tipo.j.aprovacao.estado, 'alterado');
  assert.deepEqual(tipo.j.aprovacao.conversa.at(-1).mudou, ['tipo de peça', 'fontes']);
  // alterada: o "Marcar como postado" volta a travar
  assert.equal((await pedir('/api/reels/reel_tipo', { metodo: 'PUT', cookie: op, corpo: { status: 'publicado' } })).status, 409);
});

test('PUT /api/reels: "Marcar como postado" confere a peça como estava e como fica', async () => {
  // texto mudado no mesmo pedido: 409 e nada muda
  const junto = await pedir('/api/reels/reel_junto', { metodo: 'PUT', cookie: op, corpo: { status: 'publicado', legenda: 'Legenda que ninguém aprovou' } });
  assert.equal(junto.status, 409);
  assert.equal(junto.j.erro, MSG_TRAVA);
  const r = await doEstado('reel_junto');
  assert.deepEqual([r.status, r.legenda, r.aprovacao.estado], ['roteiro', 'Legenda aprovada', 'aprovado']);
  // aprovada, sem mexer no aprovado: posta
  const limpo = await pedir('/api/reels/reel_limpo', { metodo: 'PUT', cookie: op, corpo: { status: 'publicado', legenda: 'Legenda aprovada' } });
  assert.equal(limpo.status, 200);
  assert.equal(limpo.j.status, 'publicado');
  // stories que vira reel no mesmo pedido: a trava vale pro reel
  const virou = await pedir('/api/reels/reel_stories', { metodo: 'PUT', cookie: op, corpo: { peca: 'reel', status: 'publicado' } });
  assert.equal(virou.status, 409);
  assert.equal((await doEstado('reel_stories')).peca, 'stories');
});

// ---------- /api/estado ----------

test('/api/estado: a etapa de agora e só os gerentes de agora em "aprovaram"', async () => {
  const pend = await doEstado('reel_pend');
  assert.equal(pend.aprovacao.etapa, 'diretor', 'o único gerente de agora já aprovou');
  assert.deepEqual(pend.aprovacao.gerentes.aprovaram.map((x) => x.id), ['usr_ger']);
  const ex = await doEstado('reel_pend_ex');
  assert.equal(ex.aprovacao.etapa, 'gerentes');
  assert.deepEqual(ex.aprovacao.gerentes.aprovaram, [], 'a aprovação de quem deixou de ser gerente não conta');
  // a lista da aba diz o mesmo
  const lista = (await pedir('/api/aprovacoes', { cookie: op })).j;
  assert.equal(lista.pendentes.find((x) => x.id === 'reel_pend').aprovacao.etapa, 'diretor');
  // a resposta do PUT também vem na forma da tela
  const put = await pedir('/api/reels/reel_pend_ex', { metodo: 'PUT', cookie: op, corpo: { favorito: true } });
  assert.deepEqual(put.j.aprovacao.gerentes.aprovaram, []);
});

// ---------- corpo lento ----------

// manda o cabeçalho e um pedaço do corpo, e espera o servidor fechar (ou desiste em ateMs)
function corpoLento(caminho, { metodo = 'POST', cookie, ateMs, cabecalhos = '' }) {
  return new Promise((ok) => {
    const s = net.connect(real.porta, '127.0.0.1');
    const t0 = Date.now();
    let resposta = '';
    const fim = (fechou) => {
      clearTimeout(relogio);
      s.destroy();
      ok({ fechou, ms: Date.now() - t0, resposta });
    };
    const relogio = setTimeout(() => fim(false), ateMs);
    s.on('data', (c) => { resposta += c; });
    s.on('close', () => fim(true));
    s.on('error', () => {});
    s.write(`${metodo} ${caminho} HTTP/1.1\r\nHost: localhost:${real.porta}\r\nContent-Length: 100000\r\n${cookie ? `Cookie: ${cookie}\r\n` : ''}${cabecalhos}\r\n{"a":`);
  });
}

test('corpo lento: sem sessão (e fora do upload) o socket cai no prazo; o upload com sessão segue', { timeout: 60_000 }, async () => {
  const pin = await corpoLento('/api/auth/pin', { ateMs: PRAZO * 6 });
  assert.equal(pin.fechou, true, 'o /api/auth/pin com corpo lento cai');
  assert.ok(pin.ms >= PRAZO - 100, `caiu cedo demais: ${pin.ms} ms`);
  assert.equal(pin.resposta, '', 'sem resposta: o socket só cai');
  const put = await corpoLento('/api/reels/reel_pend_ex', { metodo: 'PUT', cookie: op, ateMs: PRAZO * 6, cabecalhos: 'Content-Type: application/json\r\n' });
  assert.equal(put.fechou, true, 'com sessão, mas fora do upload, também cai');
  assert.ok(put.ms >= PRAZO - 100, `caiu cedo demais: ${put.ms} ms`);
  assert.equal(put.resposta, '');

  const envio = await pedir('/api/envios', { metodo: 'POST', cookie: op, corpo: { titulo: 'Parecer', base: 'Base técnica (F051)' } });
  assert.equal(envio.status, 201);
  const upload = await corpoLento(`/api/envios/${envio.j.id}/arquivos`, { cookie: op, ateMs: PRAZO * 3, cabecalhos: 'X-Nome-Arquivo: parecer.png\r\n' });
  // sem 2 GB livres neste disco o servidor recusa na hora (507): aí não dá pra ver o prazo
  if (/^HTTP\/1\.1 507/.test(upload.resposta)) return;
  assert.equal(upload.fechou, false, `o upload com sessão segue aberto depois do prazo: ${upload.resposta.slice(0, 80)}`);
  assert.equal(upload.resposta, '', 'e sem resposta: o servidor segue esperando o arquivo');
});

// a limpeza só depois do último await do topo (no Windows, o arquivo do servidor que acabou de sair pode demorar a soltar)
after(() => rmSync(raiz, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));
