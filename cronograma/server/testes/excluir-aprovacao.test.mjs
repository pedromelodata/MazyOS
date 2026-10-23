// Testes do "Excluir" das Aprovações técnicas (23/10, Pedro: "Dê opção nas aprovações técnicas de excluir algo que eu
// subi para aprovação"). POST /api/aprovacoes/:id/excluir:
//  - a peça de feed e o story do dia que estão esperando saem da aprovação (estado null, a conversa anota quem tirou) e
//    continuam no cronograma; dá pra mandar de novo
//  - o envio de arquivos que está esperando é apagado, com a pasta dos arquivos
//  - o item sai do lote dos outros (o que ficou sozinho perde o lote)
//  - tira quem mandou (no envio, também quem subiu) e a gestão (Admin e Gerente de Marketing); outro operador e o
//    Diretor contábil não; o que o gerador da semana mandou só a gestão tira
//  - o que não está esperando (nunca foi, aprovado) dá 409
// O banco de verdade (data/) não é lido. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-excluir-'));
const dados = path.join(raiz, 'data');
process.env.CRONOGRAMA_DATA = dados;
mkdirSync(dados, { recursive: true });
writeFileSync(path.join(dados, 'estilos.json'), '{}');

const PILARES = [4, 5, 9, 10].map((id) => ({ id, nome: `Pilar ${id}`, bloco: id === 9 ? 'Diferencial' : id === 10 ? 'Conversão' : 'Educação', status: 'ativo' }));
const peca = (id, data, extra = {}) => ({
  id, ideia: `Peça ${id}`, data, peca: 'carrossel', status: 'roteiro', legenda: 'Legenda de teste', fontes: [],
  carrossel: { capa: { titulo: 'Capa', texto: '', visual: '' }, slides: [], final: { titulo: '', texto: '', visual: '' } }, aprovacao: null, ...extra,
});
const dia = (id, data, extra = {}) => ({
  id, data, objetivo: 'engajamento', pilar: 4, bloco: 'Educação', tema: `Tema ${id}`, pecaDoDia: null,
  quadros: [{ texto: 'Sabe quanto custa abrir a ME?', visual: '', interacao: '' }], cta: '', fontes: [], notas: '', pilarTexto: '', motivo: '',
  status: 'ideia', aprovacao: null, ...extra,
});
const envio = (id, extra = {}) => ({
  id, titulo: `Envio ${id}`, base: 'Base do envio', criadoPor: 'Thiago', criadoPorId: 'usr_op', criadoEm: '2026-10-22T10:00:00.000Z',
  atualizadoEm: null, atualizadoPor: null, aprovacao: null,
  arquivos: [{ id: `arq_${id.slice(4)}`, nome: 'arte', ext: 'png', tipo: 'image/png', tamanho: 10 }], ...extra,
});
const EM = '2026-10-22T12:00:00.000Z';
// o que o gerador da semana mandou: sem conta (enviadoPorId null)
const doGerador = { estado: 'pendente', etapa: 'gerentes', gerentes: { aprovaram: [] }, explicacao: 'Do gerador', rodada: 1, enviadoEm: EM, enviadoPor: 'Gerador da semana', enviadoPorId: null, conversa: [] };
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({
  schemaVersion: 2, pilares: PILARES, campanhas: [{ id: 'cmp_prelancamento', nome: 'Pré-lançamento' }],
  reels: [
    peca('reel_um', '2099-02-01'),
    peca('reel_lote', '2099-02-02'),
    peca('reel_outro', '2099-02-03'),
    peca('reel_gerador', '2099-02-04', { aprovacao: structuredClone(doGerador) }),
    peca('reel_aprovado', '2099-02-05', { aprovacao: { ...structuredClone(doGerador), estado: 'aprovado', etapa: 'diretor', decididoEm: EM } }),
    peca('reel_nunca', '2099-02-06'),
  ],
  stories: [dia('sto_lote', '2099-02-02'), dia('sto_um', '2099-02-07')],
  envios: [envio('env_lote'), envio('env_um')],
}));
// os arquivos do envio no disco (data/envios/<envio>/<arquivo>.<ext>)
for (const id of ['env_lote', 'env_um']) {
  mkdirSync(path.join(dados, 'envios', id), { recursive: true });
  writeFileSync(path.join(dados, 'envios', id, `arq_${id.slice(4)}.png`), 'png');
}
const conta = (id, usuario, nome, papel) => ({ id, usuario, nome, papel, criadoEm: '2026-01-01T00:00:00.000Z', trocarSenha: false });
writeFileSync(path.join(dados, 'usuarios.json'), JSON.stringify([
  conta('usr_adm', 'pedro', 'Pedro Melo', 'admin'),
  conta('usr_g1', 'pedromaia', 'Pedro Maia', 'gerente'),
  conta('usr_op', 'thiago', 'Thiago', 'operador'),
  conta('usr_op2', 'natanael', 'Natanael', 'operador'),
  conta('usr_dir', 'diretor', 'Diretor Teste', 'diretor'),
]));

const auth = await import('../auth.mjs');
const aprovacoes = await import('../aprovacoes.mjs');
const { carregar } = await import('../db.mjs');

// ---------- as rotas de aprovação numa porta livre (o perfil conferido como no servidor) ----------

const json = (res, codigo, corpo) => {
  if (codigo >= 400) auth.fecharSeCorpoChegando(res.req, res);
  res.writeHead(codigo, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(corpo));
};
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
// x-teste-sem-perfil: pula o auth.podeApi, pra conferir a defesa de dentro do aprovacoes.mjs
const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const partes = auth.partesDaApi(url.pathname);
    if (!partes) return json(res, 400, { erro: 'Endereço inválido.' });
    const caminho = `/api/${partes.join('/')}`;
    const u = auth.usuarios().find((x) => x.usuario === (req.headers['x-teste-quem'] ?? 'pedro'));
    if (!req.headers['x-teste-sem-perfil'] && !auth.podeApi(u, req.method, caminho)) return json(res, 403, { erro: auth.motivoNegado(u, req.method, caminho) });
    if (partes[0] === 'aprovacoes') return await aprovacoes.rota(req, res, partes[1], partes[2], { usuario: u }, { json, corpoJson });
    return json(res, 404, { erro: 'Rota não existe.' });
  } catch (e) {
    if (res.headersSent) return res.end();
    return json(res, e.status ?? 500, { erro: e.message });
  }
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
after(() => servidor.close());

function pedir(caminho, { metodo = 'GET', quem = 'pedro', corpo, semPerfil = false } = {}) {
  return new Promise((ok, erro) => {
    const cru = corpo === undefined ? null : Buffer.from(JSON.stringify(corpo));
    const h = {
      'x-teste-quem': quem, ...(semPerfil ? { 'x-teste-sem-perfil': '1' } : {}),
      ...(cru ? { 'content-length': cru.length, 'content-type': 'application/json' } : {}),
    };
    const req = http.request({ host: '127.0.0.1', port: servidor.address().port, path: caminho, method: metodo, headers: h }, (res) => {
      const pedacos = [];
      res.on('data', (c) => pedacos.push(c));
      res.on('end', () => {
        let j = null;
        try {
          j = JSON.parse(Buffer.concat(pedacos).toString('utf8'));
        } catch {}
        ok({ status: res.statusCode, j });
      });
    });
    req.on('error', erro);
    req.end(cru ?? undefined);
  });
}
const acao = (id, qual, quem, corpo = {}, extra = {}) => pedir(`/api/aprovacoes/${id}/${qual}`, { metodo: 'POST', quem, corpo, ...extra });
const excluir = (id, quem, extra = {}) => acao(id, 'excluir', quem, {}, extra);
async function item(id) {
  const db = await carregar();
  return [...db.reels, ...db.stories, ...(db.envios ?? [])].find((x) => x.id === id);
}
const pendentes = async (quem = 'pedro') => (await pedir('/api/aprovacoes', { quem })).j.pendentes.map((x) => x.id);
const EXPLICACAO = 'Por que este post: o preço trava.\nBase técnica: preço fechado.\nObjetivo: lista de espera.';

after(() => rmSync(raiz, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));

// ---------- peça e story ----------

test('excluir: a peça que está esperando sai da aprovação, continua no cronograma e pode ir de novo', async () => {
  assert.equal((await acao('reel_um', 'enviar', 'thiago', { explicacao: EXPLICACAO })).status, 200);
  assert.ok((await pendentes()).includes('reel_um'));
  const r = await excluir('reel_um', 'thiago');
  assert.equal(r.status, 200, JSON.stringify(r.j));
  assert.equal(r.j.aprovacao.estado, null);
  const ultima = r.j.aprovacao.conversa.at(-1);
  assert.deepEqual([ultima.tipo, ultima.texto, ultima.autor], ['excluido', 'Tirou da aprovação', 'Thiago']);
  assert.ok(!(await pendentes()).includes('reel_um'), 'sai da lista da aba');
  const db = await item('reel_um');
  assert.ok(db, 'a peça continua no cronograma');
  assert.equal(db.aprovacao.estado, null);
  // excluir de novo: não está mais esperando
  assert.equal((await excluir('reel_um', 'thiago')).status, 409);
  // manda de novo: segunda rodada, começa nos gerentes
  const de = await acao('reel_um', 'enviar', 'thiago', { explicacao: EXPLICACAO });
  assert.equal(de.status, 200, JSON.stringify(de.j));
  assert.deepEqual([de.j.aprovacao.estado, de.j.aprovacao.etapa, de.j.aprovacao.rodada], ['pendente', 'gerentes', 2]);
});

test('excluir: o story do dia sai da aprovação e fica no cronograma', async () => {
  assert.equal((await acao('sto_um', 'enviar', 'thiago', { explicacao: 'Por que este story: a enquete.' })).status, 200);
  const r = await excluir('sto_um', 'thiago');
  assert.equal(r.status, 200, JSON.stringify(r.j));
  assert.equal(r.j.stories, true);
  assert.equal(r.j.aprovacao.estado, null);
  assert.equal((await item('sto_um')).aprovacao.conversa.at(-1).tipo, 'excluido');
  assert.ok(!(await pendentes()).includes('sto_um'));
});

// ---------- envio de arquivos ----------

test('excluir: o envio de arquivos que está esperando é apagado, com a pasta dos arquivos', async () => {
  assert.equal((await acao('env_um', 'enviar', 'thiago')).status, 200);
  assert.ok(existsSync(path.join(dados, 'envios', 'env_um')));
  const r = await excluir('env_um', 'thiago');
  assert.equal(r.status, 200, JSON.stringify(r.j));
  assert.deepEqual(r.j, { ok: true, id: 'env_um', apagado: true });
  assert.equal(await item('env_um'), undefined, 'sai do banco');
  assert.ok(!existsSync(path.join(dados, 'envios', 'env_um')), 'a pasta dos arquivos sai junto');
  assert.equal((await excluir('env_um', 'thiago')).status, 404);
});

// ---------- lote ----------

test('excluir: o item sai do lote dos outros; o que ficou sozinho perde o lote', async () => {
  const l = await pedir('/api/aprovacoes/lote', { metodo: 'POST', quem: 'thiago', corpo: { itens: [{ id: 'reel_lote', explicacao: EXPLICACAO }, { id: 'sto_lote', explicacao: 'O story do dia.' }, { id: 'env_lote' }] } });
  assert.equal(l.status, 200, JSON.stringify(l.j));
  assert.deepEqual(l.j.lote.itens, ['reel_lote', 'sto_lote', 'env_lote']);
  assert.equal((await excluir('sto_lote', 'thiago')).status, 200);
  assert.equal((await item('sto_lote')).aprovacao.lote, undefined);
  for (const id of ['reel_lote', 'env_lote']) assert.deepEqual((await item(id)).aprovacao.lote.itens, ['reel_lote', 'env_lote'], id);
  // o envio sai: a peça ficou sozinha e perde o lote
  assert.equal((await excluir('env_lote', 'thiago')).status, 200);
  assert.equal((await item('reel_lote')).aprovacao.lote, undefined);
  assert.equal((await item('reel_lote')).aprovacao.estado, 'pendente', 'o outro do lote segue esperando');
});

// ---------- quem pode ----------

test('excluir: outro operador e o Diretor contábil não tiram; o Admin e o Gerente de Marketing tiram', async () => {
  assert.equal((await acao('reel_outro', 'enviar', 'thiago', { explicacao: EXPLICACAO })).status, 200);
  const outro = await excluir('reel_outro', 'natanael');
  assert.equal(outro.status, 403);
  assert.match(outro.j.erro, /Só quem mandou a peça ou um Admin ou Gerente de Marketing/);
  assert.equal((await excluir('reel_outro', 'diretor')).status, 403, 'o Diretor para no perfil');
  assert.equal((await excluir('reel_outro', 'diretor', { semPerfil: true })).status, 403, 'e na defesa de dentro');
  assert.equal((await item('reel_outro')).aprovacao.estado, 'pendente', 'nada mudou');
  assert.equal((await excluir('reel_outro', 'pedromaia')).status, 200, 'o Gerente de Marketing tira o que outro mandou');
  // o que o gerador da semana mandou (sem conta): só a gestão
  assert.equal((await excluir('reel_gerador', 'thiago')).status, 403);
  assert.equal((await excluir('reel_gerador', 'pedro')).status, 200, 'o Admin tira');
});

test('excluir: o que não está esperando dá 409 (nunca foi, aprovado) e o que não existe, 404', async () => {
  assert.equal((await excluir('reel_nunca', 'pedro')).status, 409);
  assert.equal((await excluir('reel_aprovado', 'pedro')).status, 409);
  assert.equal((await item('reel_aprovado')).aprovacao.estado, 'aprovado');
  assert.equal((await excluir('reel_nao_existe', 'pedro')).status, 404);
  assert.equal((await pedir('/api/aprovacoes/reel_um/excluir', { quem: 'pedro' })).status, 405, 'só POST');
});
