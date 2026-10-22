// Testes das 3 decisões da aprovação técnica (22/10, Pedro): "Aprovado", "Aprovado com observação" e "Reprovado", nas
// 2 etapas (os gerentes e o Diretor contábil) e nos 3 tipos (peça de feed, stories do dia e envio de arquivos):
//  - Aprovado: POST .../aprovar sem observação (com {} ou com a mensagem antiga, pra quem já chamava assim)
//  - Aprovado com observação: POST .../aprovar com { observacao }. No gerente conta como a aprovação dele; no diretor
//    fecha como aprovado. Fica em aprovacao.observacoes e na conversa (tipo 'aprovado', comObservacao: true)
//  - Reprovado: POST .../ajustar com a mensagem obrigatória (estado 'ajuste', a próxima ida recomeça nos gerentes); o
//    Diretor com ajustaDepoisDeAprovada reprova o aprovado
//  - a peça pendente que foi postada não é reprovada (achado de 22/10)
// O banco de verdade (data/) não é lido. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-decisoes-'));
const dados = path.join(raiz, 'data');
process.env.CRONOGRAMA_DATA = dados;
mkdirSync(dados, { recursive: true });
writeFileSync(path.join(dados, 'estilos.json'), '{}');

const BLOCO = { 1: 'Afeto', 4: 'Educação', 8: 'Diferencial', 10: 'Conversão' };
const PILARES = Object.keys(BLOCO).map(Number).map((id) => ({ id, nome: `Pilar ${id}`, bloco: BLOCO[id], status: 'ativo' }));
const peca = (id, extra = {}) => ({
  id, ideia: `Peça ${id}`, data: '2099-01-10', peca: 'reel', status: 'ideia', legenda: 'Legenda de teste',
  roteiro: { hook: 'Gancho', textoTela: '', cenas: [], desenvolvimento: 'Meio', cta: 'Fim' }, aprovacao: null, ...extra,
});
const dia = (id, data, extra = {}) => ({
  id, data, objetivo: 'engajamento', pilar: 4, bloco: 'Educação', tema: `Tema ${id}`, pecaDoDia: null,
  quadros: [{ texto: 'Sabe quanto custa abrir a ME?', visual: 'mesa', interacao: '' }, { texto: 'Vota aqui', visual: 'app', interacao: 'enquete' }],
  cta: 'Responde a enquete', fontes: ['F051 · 07-OBRIGACOES-MENSAIS §5'], notas: '', pilarTexto: '', motivo: 'Dúvida', status: 'ideia', ...extra,
});
const envio = (id) => ({
  id, titulo: `Envio ${id}`, base: 'Base do envio (F051)', criadoEm: '2026-10-22T10:00:00.000Z', aprovacao: null,
  arquivos: [{ id: 'arq_teste', nome: 'parecer.gif', tipo: 'image/gif', ext: 'gif', tamanho: 10 }],
});
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({
  schemaVersion: 2, pilares: PILARES,
  reels: [peca('reel_dec'), peca('reel_postada', { data: '2026-01-05' })],
  stories: [dia('sto_dec', '2099-01-11')],
  envios: [envio('env_dec')],
}));
const conta = (id, usuario, nome, papel, criadoEm, extra = {}) => ({ id, usuario, nome, papel, criadoEm, trocarSenha: false, ...extra });
writeFileSync(path.join(dados, 'usuarios.json'), JSON.stringify([
  conta('usr_adm', 'pedro', 'Pedro Melo', 'admin', '2026-01-05T00:00:00.000Z'),
  conta('usr_g1', 'pedromaia', 'Pedro Maia', 'gerente', '2026-01-01T00:00:00.000Z'),
  conta('usr_g2', 'pedropuntel', 'Pedro Puntel', 'gerente', '2026-01-02T00:00:00.000Z'),
  conta('usr_op', 'thiago', 'Thiago', 'operador', '2026-01-06T00:00:00.000Z'),
  conta('usr_dir', 'diretor', 'Diretor Senha', 'diretor', '2026-01-07T00:00:00.000Z'),
  conta('usr_pin', 'diretorpin', 'Diretor Pin', 'diretor', '2026-01-08T00:00:00.000Z', { acesso: 'pin', ajustaDepoisDeAprovada: true }),
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
const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const partes = auth.partesDaApi(url.pathname);
    if (!partes) return json(res, 400, { erro: 'Endereço inválido.' });
    const caminho = `/api/${partes.join('/')}`;
    const u = auth.usuarios().find((x) => x.usuario === (req.headers['x-teste-quem'] ?? 'pedro'));
    if (!auth.podeApi(u, req.method, caminho)) return json(res, 403, { erro: auth.motivoNegado(u, req.method, caminho) });
    if (partes[0] === 'aprovacoes') return await aprovacoes.rota(req, res, partes[1], partes[2], { usuario: u }, { json, corpoJson });
    return json(res, 404, { erro: 'Rota não existe.' });
  } catch (e) {
    if (res.headersSent) return res.end();
    return json(res, e.status ?? 500, { erro: e.message });
  }
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
after(() => servidor.close());

function pedir(caminho, { metodo = 'GET', quem = 'pedro', corpo } = {}) {
  return new Promise((ok, erro) => {
    const cru = corpo === undefined ? null : Buffer.from(JSON.stringify(corpo));
    const h = { 'x-teste-quem': quem, ...(cru ? { 'content-length': cru.length, 'content-type': 'application/json' } : {}) };
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
const acao = (id, qual, quem, corpo = {}) => pedir(`/api/aprovacoes/${id}/${qual}`, { metodo: 'POST', quem, corpo });
const ids = (lista) => lista.map((x) => x.id);
const mandar = async (id) => {
  const r = await acao(id, 'enviar', 'thiago', { explicacao: 'Base técnica (F051)' });
  assert.equal(r.status, 200, JSON.stringify(r.j));
  return r.j;
};

// ---------- as 3 decisões, nas 2 etapas, nos 3 tipos ----------

const TIPOS = [
  { tipo: 'peça', id: 'reel_dec', aprovado: 'Essa peça já foi aprovada', mexe: 'nela', reprovar: { conteudo: { legenda: 'Legenda nova do Diretor' } } },
  { tipo: 'stories', id: 'sto_dec', aprovado: 'Esse story já foi aprovado', mexe: 'nele', reprovar: { conteudo: { cta: 'Responde na caixinha' } } },
  { tipo: 'envio', id: 'env_dec', aprovado: 'Esse envio já foi aprovado', mexe: 'nele', reprovar: {} },
];

for (const t of TIPOS) {
  test(`${t.tipo}: Aprovado e Aprovado com observação na etapa dos gerentes, Aprovado com observação no diretor`, async () => {
    const mandado = await mandar(t.id);
    assert.equal(mandado.aprovacao.etapa, 'gerentes');
    assert.equal(mandado.aprovacao.comObservacao, false);

    // validação da observação: longa demais e vazia quando pedida (nada muda)
    const longa = await acao(t.id, 'aprovar', 'pedromaia', { observacao: 'x'.repeat(2001) });
    assert.equal(longa.status, 400);
    assert.equal(longa.j.erro, 'A observação passou de 2000 caracteres.');
    const vazia = await acao(t.id, 'aprovar', 'pedromaia', { comObservacao: true, observacao: '   ' });
    assert.equal(vazia.status, 400);
    assert.equal(vazia.j.erro, 'A observação não pode ficar vazia.');
    assert.deepEqual((await pedir(`/api/aprovacoes/${t.id}`, { quem: 'thiago' })).j.aprovacao.gerentes.aprovaram, []);

    // gerente 1: "Aprovado" (sem corpo nenhum, como quem chamava antes)
    const g1 = await acao(t.id, 'aprovar', 'pedromaia');
    assert.equal(g1.status, 200, JSON.stringify(g1.j));
    assert.equal(g1.j.aprovacao.estado, 'pendente');
    assert.equal(g1.j.aprovacao.etapa, 'gerentes');
    assert.deepEqual(g1.j.aprovacao.gerentes.aprovaram.map((x) => [x.id, x.comObservacao ?? false]), [['usr_g1', false]]);
    assert.deepEqual(g1.j.aprovacao.observacoes ?? [], []);
    const c1 = g1.j.aprovacao.conversa.at(-1);
    assert.deepEqual([c1.tipo, c1.comObservacao, c1.etapa, c1.autor], ['aprovado', false, 'gerentes', 'Pedro Maia']);
    assert.match(c1.texto, /Falta Pedro Puntel/);

    // gerente 2: "Aprovado com observação" conta como a aprovação dele e leva pro Diretor
    const g2 = await acao(t.id, 'aprovar', 'pedropuntel', { observacao: '  Na próxima, cite o fato F051 na legenda.  ' });
    assert.equal(g2.status, 200, JSON.stringify(g2.j));
    assert.equal(g2.j.aprovacao.estado, 'pendente');
    assert.equal(g2.j.aprovacao.etapa, 'diretor');
    assert.deepEqual(g2.j.aprovacao.gerentes.aprovaram.map((x) => [x.id, x.comObservacao ?? false]), [['usr_g1', false], ['usr_g2', true]]);
    assert.equal(g2.j.aprovacao.comObservacao, false, 'a decisão final ainda não saiu');
    const [o1] = g2.j.aprovacao.observacoes;
    assert.deepEqual(
      [o1.autor, o1.autorId, o1.papel, o1.etapa, o1.texto, o1.rodada],
      ['Pedro Puntel', 'usr_g2', 'gerente', 'gerentes', 'Na próxima, cite o fato F051 na legenda.', 1],
    );
    assert.match(o1.id, /^obs_/);
    assert.ok(!Number.isNaN(Date.parse(o1.em)));
    const c2 = g2.j.aprovacao.conversa.at(-1);
    assert.deepEqual([c2.tipo, c2.comObservacao, c2.etapa, c2.texto], ['aprovado', true, 'gerentes', 'Na próxima, cite o fato F051 na legenda.']);
    assert.equal((await acao(t.id, 'aprovar', 'pedropuntel', { observacao: 'De novo' })).status, 409, 'já passou pelos gerentes');

    // o Diretor vê a observação do gerente e fecha com "Aprovado com observação"
    const visto = await pedir(`/api/aprovacoes/${t.id}`, { quem: 'diretor' });
    assert.equal(visto.status, 200);
    assert.equal(visto.j.aprovacao.observacoes.length, 1);
    const d = await acao(t.id, 'aprovar', 'diretor', { observacao: 'Aprovado, mas troque a capa antes de postar.' });
    assert.equal(d.status, 200, JSON.stringify(d.j));
    assert.equal(d.j.aprovacao.estado, 'aprovado');
    assert.equal(d.j.aprovacao.etapa, 'diretor');
    assert.equal(d.j.aprovacao.comObservacao, true);
    assert.equal(d.j.aprovacao.decididoPor, 'Diretor Senha');
    assert.equal(d.j.aprovacao.tipoAjuste, null);
    assert.deepEqual(d.j.aprovacao.observacoes.map((o) => [o.autor, o.papel, o.etapa]), [['Pedro Puntel', 'gerente', 'gerentes'], ['Diretor Senha', 'diretor', 'diretor']]);
    const cd = d.j.aprovacao.conversa.at(-1);
    assert.deepEqual([cd.tipo, cd.comObservacao, cd.etapa, cd.texto], ['aprovado', true, 'diretor', 'Aprovado, mas troque a capa antes de postar.']);
    // nas Sugestões do time e do Diretor, com a observação junto
    for (const quem of ['thiago', 'diretor']) {
      const rec = (await pedir('/api/aprovacoes', { quem })).j.recentes.find((x) => x.id === t.id);
      assert.ok(rec, quem);
      assert.equal(rec.aprovacao.comObservacao, true, quem);
      assert.equal(rec.aprovacao.observacoes.length, 2, quem);
    }
    // o outro diretor não decide de novo
    assert.equal((await acao(t.id, 'aprovar', 'diretorpin', { observacao: 'x' })).status, 409);
  });

  test(`${t.tipo}: Reprovado mesmo aprovado (só com a permissão), depois Reprovado nos gerentes e no diretor, e Aprovado no diretor`, async () => {
    // depois de aprovado: o diretor sem a permissão e o gerente não reprovam
    const sem = await acao(t.id, 'ajustar', 'diretor', { mensagem: 'Trocar' });
    assert.equal(sem.status, 409);
    assert.equal(sem.j.erro, `${t.aprovado}. Depois da aprovação, só o Diretor com a permissão de reprovar o aprovado mexe ${t.mexe}.`);
    assert.equal((await acao(t.id, 'ajustar', 'pedromaia', { mensagem: 'x' })).status, 409);
    // a mensagem é obrigatória, mesmo com a edição do texto
    const semMsg = await acao(t.id, 'ajustar', 'diretorpin', t.reprovar);
    assert.equal(semMsg.status, 400);
    assert.equal(semMsg.j.erro, 'Escreva o que ajustar.');
    assert.equal((await pedir(`/api/aprovacoes/${t.id}`, { quem: 'thiago' })).j.aprovacao.estado, 'aprovado', 'sem a mensagem, nada muda');
    const rep = await acao(t.id, 'ajustar', 'diretorpin', { mensagem: 'Reprovado: a capa ficou fora da marca.', ...t.reprovar });
    assert.equal(rep.status, 200, JSON.stringify(rep.j));
    assert.equal(rep.j.aprovacao.estado, 'ajuste');
    assert.equal(rep.j.aprovacao.etapa, 'diretor');
    assert.equal(rep.j.aprovacao.comObservacao, false);
    assert.equal(rep.j.aprovacao.decididoPor, 'Diretor Pin');
    assert.equal(rep.j.aprovacao.tipoAjuste, t.tipo === 'envio' ? 'sugestao' : 'editado');
    assert.deepEqual([rep.j.aprovacao.conversa.at(-1).tipo, rep.j.aprovacao.conversa.at(-1).texto], ['ajuste', 'Reprovado: a capa ficou fora da marca.']);
    assert.equal(rep.j.aprovacao.observacoes.length, 2, 'as observações ficam (histórico)');

    // rodada 2: Reprovado na etapa dos gerentes (só a mensagem)
    const r2 = await mandar(t.id);
    assert.equal(r2.aprovacao.rodada, 2);
    assert.equal(r2.aprovacao.etapa, 'gerentes');
    assert.equal(r2.aprovacao.comObservacao, false);
    assert.equal((await acao(t.id, 'ajustar', 'pedromaia', { mensagem: '   ' })).status, 400);
    assert.equal((await acao(t.id, 'ajustar', 'diretor', { mensagem: 'x' })).status, 404, 'com os gerentes, o Diretor não chega');
    const g = await acao(t.id, 'ajustar', 'pedromaia', { mensagem: 'Falta a fonte do preço.' });
    assert.equal(g.status, 200);
    assert.equal(g.j.aprovacao.estado, 'ajuste');
    assert.equal(g.j.aprovacao.etapa, 'gerentes');
    assert.equal(g.j.aprovacao.tipoAjuste, 'sugestao');
    assert.equal(g.j.aprovacao.decididoPor, 'Pedro Maia');
    assert.equal((await pedir(`/api/aprovacoes/${t.id}`, { quem: 'diretor' })).status, 404, 'reprovado nos gerentes: o Diretor não vê');

    // rodada 3: os gerentes aprovam, o Diretor reprova na etapa dele
    await mandar(t.id);
    assert.equal((await acao(t.id, 'aprovar', 'pedromaia', { mensagem: 'Base confere' })).j.aprovacao.conversa.at(-1).texto, 'Base confere', 'a mensagem antiga segue');
    await acao(t.id, 'aprovar', 'pedropuntel', {});
    assert.equal((await acao(t.id, 'ajustar', 'pedromaia', { mensagem: 'x' })).status, 409, 'com o Diretor, o gerente não reprova');
    const dr = await acao(t.id, 'ajustar', 'diretor', { mensagem: 'O número da guia não tem fonte.' });
    assert.equal(dr.status, 200);
    assert.equal(dr.j.aprovacao.estado, 'ajuste');
    assert.equal(dr.j.aprovacao.etapa, 'diretor');
    assert.equal(dr.j.aprovacao.decididoPor, 'Diretor Senha');
    assert.ok(ids((await pedir('/api/aprovacoes', { quem: 'diretor' })).j.recentes).includes(t.id), 'reprovado pelo Diretor: ele vê nas Sugestões');

    // rodada 4: "Aprovado" no diretor, sem observação
    await mandar(t.id);
    await acao(t.id, 'aprovar', 'pedromaia');
    await acao(t.id, 'aprovar', 'pedropuntel');
    const ok = await acao(t.id, 'aprovar', 'diretor', {});
    assert.equal(ok.status, 200);
    assert.equal(ok.j.aprovacao.estado, 'aprovado');
    assert.equal(ok.j.aprovacao.comObservacao, false);
    assert.equal(ok.j.aprovacao.rodada, 4);
    assert.deepEqual([ok.j.aprovacao.conversa.at(-1).texto, ok.j.aprovacao.conversa.at(-1).comObservacao], ['Aprovou', false]);
    assert.equal(ok.j.aprovacao.observacoes.length, 2);
    // o banco guarda o mesmo
    const db = await carregar();
    const item = [...db.reels, ...db.stories, ...db.envios].find((x) => x.id === t.id);
    assert.equal(item.aprovacao.estado, 'aprovado');
    assert.equal(item.aprovacao.comObservacao, false);
    assert.equal(item.aprovacao.observacoes.length, 2);
  });
}

test('peça: pendente já com o diretor, o "Aprovado com observação" fecha e a observação é o texto da conversa', async () => {
  // pendente antigo, já na etapa do diretor: a observação também fica guardada
  const db = await carregar();
  db.reels.push(peca('reel_so_diretor', { aprovacao: { estado: 'pendente', etapa: 'diretor', rodada: 1, explicacao: 'Base', conversa: [] } }));
  const r = await acao('reel_so_diretor', 'aprovar', 'diretorpin', { observacao: 'Ok com ressalva no gancho', mensagem: 'ignorada' });
  assert.equal(r.status, 200);
  assert.equal(r.j.aprovacao.estado, 'aprovado');
  assert.equal(r.j.aprovacao.comObservacao, true);
  assert.equal(r.j.aprovacao.conversa.at(-1).texto, 'Ok com ressalva no gancho', 'a observação é o texto da conversa');
  assert.deepEqual(r.j.aprovacao.observacoes.map((o) => [o.autor, o.etapa, o.rodada]), [['Diretor Pin', 'diretor', 1]]);
});

// 22/10 (achado): o que foi postado não é reprovado nem no pendente (ficaria preso na bandeira amarela)
test('peça: pendente de data passada que foi postada não é reprovada (409); aprovar segue', async () => {
  await mandar('reel_postada');
  const db = await carregar();
  const r = db.reels.find((x) => x.id === 'reel_postada');
  r.status = 'publicado';
  const legenda = r.legenda;
  const rep = await acao('reel_postada', 'ajustar', 'pedromaia', { mensagem: 'Trocar a legenda', conteudo: { legenda: 'Outra' } });
  assert.equal(rep.status, 409);
  assert.equal(rep.j.erro, 'Essa peça já foi postada.');
  assert.equal(r.legenda, legenda);
  assert.equal(r.aprovacao.estado, 'pendente');
  assert.equal((await acao('reel_postada', 'aprovar', 'pedromaia', { observacao: 'Já foi ao ar; base confere' })).status, 200);
});

// 22/10 (achado): a observação que o gerente deixou ao aprovar o texto de antes cai junto com a aprovação dele
test('peça: texto mudado no meio da aprovação anula a observação do gerente (fica só na conversa)', async () => {
  const db = await carregar();
  db.reels.push(peca('reel_obs_anula'));
  await mandar('reel_obs_anula');
  assert.equal((await acao('reel_obs_anula', 'aprovar', 'pedromaia', { observacao: 'Obs sobre o texto antigo' })).status, 200);
  const r = db.reels.find((x) => x.id === 'reel_obs_anula');
  const antes = aprovacoes.fotoDaAprovacao(r);
  r.legenda = 'Legenda trocada pelo time';
  assert.equal(aprovacoes.conferirMudancaAprovada(r, antes, { nome: 'Thiago', id: 'usr_op' }), true);
  assert.deepEqual(r.aprovacao.gerentes.aprovaram, [], 'a aprovação do gerente caiu');
  assert.ok(r.aprovacao.observacoes.every((o) => o.anulada), 'a observação ficou anulada');
  assert.ok(r.aprovacao.conversa.some((m) => m.texto === 'Obs sobre o texto antigo'), 'o texto continua na conversa');
});

// a limpeza só depois do último await do topo
after(() => rmSync(raiz, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));
