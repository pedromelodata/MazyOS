// Testes do lote da aprovação (22/10, Pedro: "Dê opção no sistema de mandar vários para a aprovação, o post juntamente
// com os story"). POST /api/aprovacoes/lote { itens: [{ id, explicacao }] }:
//  - lote misto (peça de feed + story do dia + envio de arquivos): cada um vai pelas regras do enviar de um item e todos
//    ganham o mesmo aprovacao.lote = { id, em, por, itens }
//  - um item com erro não derruba os outros (200 com o resultado de cada um); o que falhou não muda; itens leva só os
//    que foram; o que acabou indo sozinho fica sem lote
//  - id repetido, lista vazia, malformada ou com mais de 30 = 400 sem mandar nenhum; 30 passa
//  - o Diretor contábil não chega (auth.podeApi e a defesa por dentro); admin, gerente e operador mandam
//  - o campo lote na lista da aba e no GET de um item; decidir um item não mexe nos outros; mandar de novo tira o lote
//  - o servidor de verdade (node server/server.mjs) numa porta alta, com uma cópia de dados temporária e sem agenda: a
//    rota pelo caminho canônico, o 403 do Diretor e o lote no /api/estado
// O banco de verdade (data/) não é lido. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-lote-'));
const dados = path.join(raiz, 'data');
process.env.CRONOGRAMA_DATA = dados;
mkdirSync(dados, { recursive: true });
writeFileSync(path.join(dados, 'estilos.json'), '{}');

const BLOCO = { 1: 'Afeto', 2: 'Afeto', 3: 'Afeto', 4: 'Educação', 5: 'Educação', 8: 'Diferencial', 9: 'Diferencial', 10: 'Conversão', 11: 'Conversão', 12: 'Conversão' };
const PILARES = Object.keys(BLOCO).map(Number).map((id) => ({ id, nome: `Pilar ${id}`, bloco: BLOCO[id], status: 'ativo' }));
const QUADROS = [
  { texto: 'Sabe quanto custa abrir a ME?', visual: 'mesa com papelada', interacao: '' },
  { texto: 'Vota aqui: caro ou barato?', visual: 'app aberto', interacao: 'enquete' },
];
const dia = (id, data, extra = {}) => ({
  id, data, objetivo: 'engajamento', pilar: 4, bloco: 'Educação', tema: `Tema ${id}`, pecaDoDia: null, quadros: structuredClone(QUADROS),
  cta: 'Responde a enquete', fontes: ['F051 · 07-OBRIGACOES-MENSAIS §5'], notas: '', pilarTexto: '', motivo: 'Dúvida que trava a abertura', status: 'ideia', ...extra,
});
const peca = (id, data, extra = {}) => ({
  id, ideia: `Peça ${id}`, data, peca: 'reel', status: 'ideia', legenda: 'Legenda de teste',
  roteiro: { hook: 'Gancho', textoTela: '', cenas: [], desenvolvimento: 'Meio', cta: 'Fim' }, aprovacao: null, ...extra,
});
const envio = (id, extra = {}) => ({
  id, titulo: `Envio ${id}`, base: 'Base do envio: preço fechado (F051)', criadoPor: 'Thiago', criadoPorId: 'usr_op', criadoEm: '2026-10-22T10:00:00.000Z',
  atualizadoEm: null, atualizadoPor: null, aprovacao: null,
  arquivos: [{ id: `arq_${id.slice(4)}`, nome: 'arte', ext: 'png', tipo: 'image/png', tamanho: 10 }], ...extra,
});
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({
  schemaVersion: 2, pilares: PILARES, campanhas: [{ id: 'cmp_prelancamento', nome: 'Pré-lançamento' }],
  reels: [
    peca('reel_dia', '2099-01-12'),
    peca('reel_b', '2099-01-13'),
    peca('reel_sozinho', '2099-01-14'),
    peca('reel_vazia', '2099-01-15'),
    peca('reel_rep', '2099-01-16'),
    peca('reel_adm', '2099-01-17'),
    peca('reel_ger', '2099-01-18'),
    peca('reel_postado', '2026-10-01', { status: 'publicado' }),
    peca('reel_antigo', '2099-01-19', { peca: 'stories' }),
    peca('reel_obj', '2099-01-20'),
  ],
  stories: [
    dia('sto_dia', '2099-01-12', { tema: 'Enquete: o preço que você vê' }),
    dia('sto_b', '2099-01-13'),
    dia('sto_semtema', '2099-01-14', { tema: '' }),
    dia('sto_adm', '2099-01-17'),
    dia('sto_postado', '2026-10-01', { status: 'publicado' }),
  ],
  envios: [envio('env_um'), envio('env_vazio', { arquivos: [] })],
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
const lote = (itens, quem = 'thiago', extra = {}) => pedir('/api/aprovacoes/lote', { metodo: 'POST', quem, corpo: { itens }, ...extra });
const acao = (id, qual, quem, corpo = {}) => pedir(`/api/aprovacoes/${id}/${qual}`, { metodo: 'POST', quem, corpo });
// o item no banco, pelo id (peça, story do dia ou envio)
async function item(id) {
  const db = await carregar();
  return [...db.reels, ...db.stories, ...db.envios].find((x) => x.id === id);
}
const EXPLICACAO = 'Por que este post: o preço trava.\nBase técnica:\n• Preço fechado (F051)\nObjetivo: lista de espera.';

// ---------- o lote misto ----------

test('lote misto: a peça, o story do dia e o envio vão juntos e ganham o mesmo lote', async () => {
  const r = await lote([
    { id: 'reel_dia', explicacao: EXPLICACAO },
    { id: 'sto_dia', explicacao: 'Por que este story: a enquete do preço (F051).' },
    { id: 'env_um' },
  ]);
  assert.equal(r.status, 200, JSON.stringify(r.j));
  assert.deepEqual(r.j.resultados.map((x) => [x.id, x.ok]), [['reel_dia', true], ['sto_dia', true], ['env_um', true]], 'na ordem pedida');
  for (const x of r.j.resultados) assert.equal(x.erro, undefined);

  // o lote da resposta
  assert.match(r.j.lote.id, /^lot_/);
  assert.equal(r.j.lote.por, 'Thiago');
  assert.ok(!Number.isNaN(Date.parse(r.j.lote.em)));
  assert.deepEqual(r.j.lote.itens, ['reel_dia', 'sto_dia', 'env_um']);

  // cada item na forma de tela dele, já com o lote
  const [p, s, e] = r.j.resultados.map((x) => x.item);
  assert.equal(p.peca, 'reel');
  assert.equal(s.stories, true);
  assert.equal(s.ideia, 'Story · Enquete: o preço que você vê');
  assert.equal(e.envio, true);
  for (const x of [p, s, e]) {
    assert.equal(x.aprovacao.estado, 'pendente');
    assert.equal(x.aprovacao.etapa, 'gerentes', 'mesmas 2 etapas: começa nos gerentes');
    assert.deepEqual(x.aprovacao.lote, r.j.lote);
    assert.equal(x.aprovacao.rodada, 1);
    assert.equal(x.aprovacao.enviadoPor, 'Thiago');
    assert.equal(x.aprovacao.conversa.at(-1).tipo, 'envio');
    assert.equal(x.aprovacao.conversa.at(-1).texto, 'Mandou pra aprovação');
  }
  assert.equal(p.aprovacao.explicacao, EXPLICACAO);
  assert.equal(s.aprovacao.explicacao, 'Por que este story: a enquete do preço (F051).');
  assert.equal(e.aprovacao.explicacao, 'Base do envio: preço fechado (F051)', 'envio sem explicação: a base vai como explicação');

  // gravado no banco, uma cópia do lote por item
  for (const id of ['reel_dia', 'sto_dia', 'env_um']) assert.deepEqual((await item(id)).aprovacao.lote, r.j.lote);
  (await item('reel_dia')).aprovacao.lote.itens.push('mexido');
  assert.deepEqual((await item('sto_dia')).aprovacao.lote.itens, ['reel_dia', 'sto_dia', 'env_um'], 'cada item tem o lote dele');
  (await item('reel_dia')).aprovacao.lote.itens.pop();
});

test('lote: o campo lote na lista da aba e no GET de um item', async () => {
  const lista = (await pedir('/api/aprovacoes', { quem: 'thiago' })).j;
  const pend = lista.pendentes.filter((x) => x.aprovacao.lote);
  assert.deepEqual(pend.map((x) => x.id).sort(), ['env_um', 'reel_dia', 'sto_dia']);
  assert.equal(new Set(pend.map((x) => x.aprovacao.lote.id)).size, 1, 'o mesmo lote nos três');
  const um = await pedir('/api/aprovacoes/sto_dia', { quem: 'pedromaia' });
  assert.equal(um.status, 200);
  assert.deepEqual(um.j.aprovacao.lote.itens, ['reel_dia', 'sto_dia', 'env_um']);
});

// ---------- um com erro, os outros passando ----------

test('lote: um item com erro não derruba os outros e o que falhou não muda', async () => {
  const antes = Object.fromEntries(await Promise.all(['sto_semtema', 'reel_postado', 'reel_vazia', 'reel_antigo', 'env_vazio', 'sto_postado']
    .map(async (id) => [id, structuredClone((await item(id)).aprovacao ?? null)])));
  const r = await lote([
    { id: 'reel_b', explicacao: EXPLICACAO },
    { id: 'sto_semtema', explicacao: EXPLICACAO },
    { id: 'reel_naoexiste', explicacao: EXPLICACAO },
    { id: 'sto_b', explicacao: EXPLICACAO },
    { id: 'reel_postado', explicacao: EXPLICACAO },
    { id: 'reel_vazia', explicacao: '   ' },
    { id: 'reel_dia', explicacao: EXPLICACAO },
    { id: 'reel_antigo', explicacao: EXPLICACAO },
    { id: 'env_vazio' },
    { id: 'sto_postado', explicacao: EXPLICACAO },
  ]);
  assert.equal(r.status, 200, JSON.stringify(r.j));
  const por = Object.fromEntries(r.j.resultados.map((x) => [x.id, x]));
  assert.deepEqual(r.j.resultados.map((x) => x.id), ['reel_b', 'sto_semtema', 'reel_naoexiste', 'sto_b', 'reel_postado', 'reel_vazia', 'reel_dia', 'reel_antigo', 'env_vazio', 'sto_postado']);
  // os que foram
  assert.equal(por.reel_b.ok, true);
  assert.equal(por.sto_b.ok, true);
  // os que falharam: a mesma mensagem e o mesmo status do enviar de um item
  const falhou = (id, status, erro) => {
    assert.equal(por[id].ok, false, id);
    assert.equal(por[id].status, status, id);
    assert.equal(por[id].item, undefined, id);
    if (erro instanceof RegExp) assert.match(por[id].erro, erro, id);
    else assert.equal(por[id].erro, erro, id);
  };
  falhou('sto_semtema', 400, 'Escreva o tema do story antes de mandar pra aprovação.');
  falhou('reel_naoexiste', 404, 'Essa peça não existe mais.');
  falhou('reel_postado', 409, 'Essa peça já foi postada.');
  falhou('reel_vazia', 400, 'A explicação técnica não pode ficar vazia.');
  falhou('reel_dia', 409, 'Essa peça já está esperando a aprovação.');
  falhou('reel_antigo', 400, /pelos stories do dia/);
  falhou('env_vazio', 400, 'Suba pelo menos um arquivo antes de mandar.');
  falhou('sto_postado', 409, 'Esse story já foi postado.');
  // o mesmo erro do enviar de um item
  const sozinho = await acao('reel_postado', 'enviar', 'thiago', { explicacao: EXPLICACAO });
  assert.equal(sozinho.status, por.reel_postado.status);
  assert.equal(sozinho.j.erro, por.reel_postado.erro);

  // o lote leva só os que foram
  assert.deepEqual(r.j.lote.itens, ['reel_b', 'sto_b']);
  assert.deepEqual((await item('reel_b')).aprovacao.lote, r.j.lote);
  assert.deepEqual((await item('sto_b')).aprovacao.lote, r.j.lote);
  // os que falharam ficam como estavam
  for (const [id, ap] of Object.entries(antes)) assert.deepEqual((await item(id)).aprovacao ?? null, ap, id);
  // o pendente que falhou (já esperando) segue no lote dele, sem mudar
  assert.deepEqual((await item('reel_dia')).aprovacao.lote.itens, ['reel_dia', 'sto_dia', 'env_um']);
  assert.equal((await item('reel_dia')).aprovacao.rodada, 1);
});

test('lote: o que acabou indo sozinho fica sem lote; nenhum indo, nada muda', async () => {
  const r = await lote([{ id: 'reel_sozinho', explicacao: EXPLICACAO }, { id: 'sto_semtema', explicacao: EXPLICACAO }]);
  assert.equal(r.status, 200);
  assert.equal(r.j.lote, null);
  assert.equal(r.j.resultados[0].ok, true);
  assert.equal(r.j.resultados[0].item.aprovacao.estado, 'pendente');
  assert.equal(r.j.resultados[0].item.aprovacao.lote, undefined);
  assert.equal((await item('reel_sozinho')).aprovacao.lote, undefined);

  const nenhum = await lote([{ id: 'reel_naoexiste' }, { id: 'sto_naoexiste' }, { id: 'env_naoexiste' }]);
  assert.equal(nenhum.status, 200);
  assert.equal(nenhum.j.lote, null);
  assert.deepEqual(nenhum.j.resultados.map((x) => [x.ok, x.status, x.erro]), [
    [false, 404, 'Essa peça não existe mais.'], [false, 404, 'Esse story não existe mais.'], [false, 404, 'Esse envio não existe mais.'],
  ]);
});

// ---------- a lista conferida inteira antes ----------

test('lote: id repetido, lista vazia, malformada ou com mais de 30 = 400 sem mandar nenhum', async () => {
  const rep = await lote([{ id: 'reel_rep', explicacao: EXPLICACAO }, { id: 'sto_adm', explicacao: EXPLICACAO }, { id: 'reel_rep', explicacao: 'outra' }]);
  assert.equal(rep.status, 400);
  assert.match(rep.j.erro, /reel_rep está repetido/);
  assert.equal((await item('reel_rep')).aprovacao, null, 'nenhum foi');
  assert.equal((await item('sto_adm')).aprovacao, undefined, 'nenhum foi');
  // repetido com espaço em volta também
  assert.equal((await lote([{ id: 'reel_rep' }, { id: ' reel_rep ' }])).status, 400);

  const vazia = await lote([]);
  assert.equal(vazia.status, 400);
  assert.equal(vazia.j.erro, 'Escolha pelo menos um item pra mandar.');
  assert.equal((await pedir('/api/aprovacoes/lote', { metodo: 'POST', quem: 'thiago', corpo: {} })).status, 400, 'sem itens');
  assert.equal((await pedir('/api/aprovacoes/lote', { metodo: 'POST', quem: 'thiago', corpo: { itens: 'reel_rep' } })).status, 400, 'itens não é lista');
  assert.equal((await pedir('/api/aprovacoes/lote', { metodo: 'POST', quem: 'thiago', corpo: [{ id: 'reel_rep' }] })).status, 400, 'corpo é lista');
  const semId = await lote([{ id: 'reel_rep', explicacao: EXPLICACAO }, { explicacao: 'x' }]);
  assert.equal(semId.status, 400);
  assert.equal(semId.j.erro, 'O item 2 da lista veio sem id.');
  assert.equal((await lote(['reel_rep'])).status, 400, 'item que não é objeto');
  assert.equal((await lote([{ id: 42 }])).status, 400, 'id que não é texto');
  assert.equal((await item('reel_rep')).aprovacao, null, 'nenhum foi');

  const ids = (n) => Array.from({ length: n }, (_, i) => ({ id: `reel_falta${i}`, explicacao: EXPLICACAO }));
  const demais = await lote([{ id: 'reel_rep', explicacao: EXPLICACAO }, ...ids(30)]);
  assert.equal(demais.status, 400);
  assert.equal(demais.j.erro, 'Dá pra mandar até 30 de uma vez (vieram 31).');
  assert.equal((await item('reel_rep')).aprovacao, null, 'nenhum foi');
  // 30 cabem: cada um responde por si
  const trinta = await lote([{ id: 'reel_rep', explicacao: EXPLICACAO }, ...ids(29)]);
  assert.equal(trinta.status, 200);
  assert.equal(trinta.j.resultados.length, 30);
  assert.equal(trinta.j.resultados[0].ok, true);
  assert.equal(trinta.j.resultados.filter((x) => !x.ok && x.status === 404).length, 29);
  assert.equal(trinta.j.lote, null);

  // só POST
  assert.equal((await pedir('/api/aprovacoes/lote', { quem: 'thiago' })).status, 405);
});

// ---------- quem manda ----------

// 22/10 (achado): explicação que não é texto não vira "[object Object]"
test('lote: explicação que não é texto é recusada no item (400) e ele não muda', async () => {
  for (const explicacao of [{ a: 1 }, [1, 2], false, 7]) {
    const r = await lote([{ id: 'reel_obj', explicacao }]);
    assert.equal(r.status, 200, JSON.stringify(r.j));
    const [res] = r.j.resultados;
    assert.equal(res.ok, false);
    assert.equal(res.status, 400);
    assert.equal(res.erro, 'A explicação técnica precisa ser texto.');
    assert.equal((await item('reel_obj')).aprovacao ?? null, null);
  }
});

test('lote: o Diretor contábil não chega; admin, gerente e operador mandam', async () => {
  for (const quem of ['diretor', 'diretorpin']) {
    const r = await lote([{ id: 'reel_adm', explicacao: EXPLICACAO }], quem);
    assert.equal(r.status, 403, quem);
    assert.equal(r.j.erro, 'O seu perfil vê só as Aprovações técnicas.');
  }
  assert.equal(auth.podeApi(auth.usuarios().find((x) => x.usuario === 'diretor'), 'POST', '/api/aprovacoes/lote'), false);
  // a defesa por dentro, mesmo sem o podeApi
  const dentro = await lote([{ id: 'reel_adm', explicacao: EXPLICACAO }], 'diretor', { semPerfil: true });
  assert.equal(dentro.status, 403);
  assert.equal((await item('reel_adm')).aprovacao, null, 'o Diretor não mandou');

  const adm = await lote([{ id: 'reel_adm', explicacao: EXPLICACAO }, { id: 'sto_adm', explicacao: EXPLICACAO }], 'pedro');
  assert.equal(adm.status, 200);
  assert.equal(adm.j.lote.por, 'Pedro Melo');
  assert.ok(adm.j.resultados.every((x) => x.ok));
  const ger = await lote([{ id: 'reel_ger', explicacao: EXPLICACAO }], 'pedromaia');
  assert.equal(ger.status, 200);
  assert.equal(ger.j.resultados[0].item.aprovacao.enviadoPor, 'Pedro Maia');
});

// ---------- decidir um item não mexe nos outros ----------

test('lote: aprovar, reprovar e conversar num item não mexe nos outros do lote', async () => {
  const foto = async (id) => structuredClone((await item(id)).aprovacao);
  const stoAntes = await foto('sto_dia');
  const envAntes = await foto('env_um');

  // os gerentes aprovam a peça (um com observação) e o Diretor fecha: o story e o envio seguem iguais
  assert.equal((await acao('reel_dia', 'aprovar', 'pedromaia')).status, 200);
  assert.equal((await acao('reel_dia', 'aprovar', 'pedropuntel', { observacao: 'Ok, conferir a fonte.' })).status, 200);
  const fechou = await acao('reel_dia', 'aprovar', 'diretor');
  assert.equal(fechou.status, 200, JSON.stringify(fechou.j));
  assert.equal(fechou.j.aprovacao.estado, 'aprovado');
  assert.equal(fechou.j.aprovacao.lote.itens.length, 3, 'a peça decidida guarda o lote');
  assert.deepEqual(await foto('sto_dia'), stoAntes);
  assert.deepEqual(await foto('env_um'), envAntes);

  // o gerente reprova o story: a peça (aprovada) e o envio seguem iguais
  const pecaAntes = await foto('reel_dia');
  const rep = await acao('sto_dia', 'ajustar', 'pedromaia', { mensagem: 'Troque a CTA.' });
  assert.equal(rep.status, 200);
  assert.equal(rep.j.aprovacao.estado, 'ajuste');
  assert.equal(rep.j.aprovacao.lote.id, stoAntes.lote.id, 'o reprovado guarda o lote da rodada');
  assert.deepEqual(await foto('reel_dia'), pecaAntes);
  assert.deepEqual(await foto('env_um'), envAntes);

  // a conversa num item fica nele
  assert.equal((await acao('env_um', 'mensagem', 'thiago', { texto: 'Arte nova subida.' })).status, 200);
  assert.deepEqual(await foto('reel_dia'), pecaAntes);
  assert.equal((await foto('sto_dia')).conversa.length, rep.j.aprovacao.conversa.length);

  // mandar o story de novo sozinho tira o lote dele; a peça continua com o lote antigo (a tela agrupa pelo lote.id)
  const deNovo = await acao('sto_dia', 'enviar', 'thiago', { explicacao: 'CTA trocada (F051).' });
  assert.equal(deNovo.status, 200);
  assert.equal(deNovo.j.aprovacao.lote, undefined);
  assert.equal(deNovo.j.aprovacao.rodada, 2);
  assert.equal((await item('sto_dia')).aprovacao.lote, undefined);
  assert.deepEqual(await foto('reel_dia'), pecaAntes);

  // reprovado e mandado de novo pelo lote: lote novo, rodada 2
  await acao('env_um', 'ajustar', 'pedromaia', { mensagem: 'Arte cortada.' });
  const novo = await lote([{ id: 'env_um' }, { id: 'reel_sozinho' }]);
  assert.equal(novo.j.resultados[0].ok, true);
  assert.equal(novo.j.resultados[1].ok, false, 'reel_sozinho já está esperando');
  assert.equal(novo.j.lote, null);
  assert.equal(novo.j.resultados[0].item.aprovacao.lote, undefined, 'o lote antigo saiu');
  assert.equal(novo.j.resultados[0].item.aprovacao.rodada, 2);
});

// ---------- o servidor de verdade ----------

const SENHA = 'senha-de-teste-123';
const SERVER = path.join(import.meta.dirname, '..', 'server.mjs');
let real = null;

async function subirServidorReal() {
  const pasta = path.join(raiz, 'real');
  mkdirSync(pasta, { recursive: true });
  writeFileSync(path.join(pasta, 'estilos.json'), '{}');
  writeFileSync(path.join(pasta, 'db.json'), JSON.stringify({
    schemaVersion: 2, pilares: PILARES, reels: [peca('reel_real', '2099-02-10')], stories: [dia('sto_real', '2099-02-10')],
  }));
  const hash = await auth.hashSenha(SENHA);
  writeFileSync(path.join(pasta, 'usuarios.json'), JSON.stringify([
    { id: 'usr_ger', usuario: 'gerente', nome: 'Gerente', hash, papel: 'gerente', criadoEm: '2026-01-01T00:00:00.000Z', trocarSenha: false },
    { id: 'usr_op', usuario: 'operador', nome: 'Operador', hash, papel: 'operador', criadoEm: '2026-01-03T00:00:00.000Z', trocarSenha: false },
    { id: 'usr_dir', usuario: 'diretor', nome: 'Diretor', hash, papel: 'diretor', criadoEm: '2026-01-04T00:00:00.000Z', trocarSenha: false },
  ]));
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const porta = 41_000 + Math.floor(Math.random() * 8_000);
    const filho = spawn(process.execPath, [SERVER], {
      env: { ...process.env, CRONOGRAMA_DATA: pasta, CRONOGRAMA_AGENDA: '0', PORT: String(porta) },
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
    if (subiu) return { filho, porta };
    filho.kill();
  }
  throw new Error('O servidor de teste não subiu.');
}

function pedirReal(caminho, { metodo = 'GET', cookie, corpo } = {}) {
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
        ok({ status: res.statusCode, j });
      });
    });
    req.on('error', erro);
    req.end(cru ?? undefined);
  });
}
test('servidor de verdade: o lote pela rota canônica, o 403 do Diretor e o lote no /api/estado', { timeout: 90_000 }, async () => {
  real = await subirServidorReal();
  after(async () => {
    if (real.filho.exitCode !== null) return;
    const saiu = new Promise((ok) => real.filho.once('exit', ok));
    real.filho.kill();
    await saiu;
  });
  const entrar = (usuario) => new Promise((ok, erro) => {
    const cru = Buffer.from(JSON.stringify({ usuario, senha: SENHA }));
    const req = http.request({
      host: '127.0.0.1', port: real.porta, path: '/api/auth/entrar', method: 'POST', agent: false,
      headers: { host: `localhost:${real.porta}`, 'content-type': 'application/json', 'content-length': cru.length },
    }, (res) => {
      res.resume();
      res.on('end', () => (res.statusCode === 200 ? ok([res.headers['set-cookie']].flat().map((c) => c.split(';')[0]).join('; ')) : erro(new Error(`login ${usuario}: ${res.statusCode}`))));
    });
    req.on('error', erro);
    req.end(cru);
  });
  const op = await entrar('operador');
  const dir = await entrar('diretor');
  const itens = [{ id: 'reel_real', explicacao: EXPLICACAO }, { id: 'sto_real', explicacao: EXPLICACAO }];

  const negado = await pedirReal('/api/aprovacoes/lote', { metodo: 'POST', cookie: dir, corpo: { itens } });
  assert.equal(negado.status, 403);
  assert.equal(negado.j.erro, 'O seu perfil vê só as Aprovações técnicas.');

  const r = await pedirReal('/api/aprovacoes/lote', { metodo: 'POST', cookie: op, corpo: { itens } });
  assert.equal(r.status, 200, JSON.stringify(r.j));
  assert.ok(r.j.resultados.every((x) => x.ok));
  assert.deepEqual(r.j.lote.itens, ['reel_real', 'sto_real']);
  assert.equal(r.j.lote.por, 'Operador');

  // o /api/estado leva o lote na aprovação normalizada da peça e do story
  const est = (await pedirReal('/api/estado', { cookie: op })).j;
  assert.equal(est.reels.find((x) => x.id === 'reel_real').aprovacao.lote.id, r.j.lote.id);
  assert.equal(est.stories.find((x) => x.id === 'sto_real').aprovacao.lote.id, r.j.lote.id);
  assert.equal(est.reels.find((x) => x.id === 'reel_real').aprovacao.etapa, 'gerentes');
});

// a limpeza só depois do último await do topo (no Windows, o arquivo do servidor que acabou de sair pode demorar a soltar)
after(() => rmSync(raiz, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));
