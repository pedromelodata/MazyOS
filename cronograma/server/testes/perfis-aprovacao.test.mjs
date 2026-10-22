// Testes dos perfis e da aprovação em 2 etapas (21/10, Pedro):
//  - perfis (auth.podeApi): o Gerente de Marketing tem todo o poder do Admin (usuários, perfis, gerar a semana,
//    atualizar as notícias) e aprova; o Admin e o Operador não aprovam; o Diretor contábil não chega em mecanismo,
//    semana nem notícias
//  - etapas (aprovacoes.mjs): os 2 gerentes aprovam cada um, depois um diretor fecha; papel na etapa errada = 409;
//    a conta com ajustaDepoisDeAprovada ajusta peça aprovada e o outro diretor não; o Diretor só vê a etapa dele;
//    enviarPeloSistema; pendente antigo sem etapa; sem gerente cadastrado; texto mexido no meio da aprovação
//  - caminho canônico (server.mjs + auth.partesDaApi): o servidor de verdade (node server/server.mjs) numa porta alta,
//    com uma cópia de dados temporária e sem agenda, e os ataques de caminho dão 400 ou 403
// O banco de verdade (data/) não é lido. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-perfis-'));
const dados = path.join(raiz, 'data');
process.env.CRONOGRAMA_DATA = dados;
mkdirSync(dados, { recursive: true });
writeFileSync(path.join(dados, 'estilos.json'), '{}');
const peca = (id, extra = {}) => ({
  id, ideia: `Peça ${id}`, data: '2099-01-10', peca: 'reel', status: 'ideia', legenda: 'Legenda de teste',
  roteiro: { hook: 'Gancho', textoTela: '', cenas: [], desenvolvimento: 'Meio', cta: 'Fim' }, aprovacao: null, ...extra,
});
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({
  schemaVersion: 2,
  reels: [
    peca('reel_um'),
    peca('reel_dois'),
    peca('reel_postado', { status: 'publicado', data: '2026-10-01' }),
    // pendente de antes das etapas (sem etapa): está com o diretor
    peca('reel_velho', { aprovacao: { estado: 'pendente', explicacao: 'Base antiga', rodada: 1, enviadoEm: '2026-10-20T10:00:00.000Z', enviadoPor: 'Pedro Melo', conversa: [] } }),
    peca('reel_sistema'),
  ],
  envios: [{ id: 'env_rascunho', titulo: 'Rascunho', base: 'Base', arquivos: [], criadoEm: '2026-10-21T10:00:00.000Z', aprovacao: null }],
}));
const conta = (id, usuario, nome, papel, extra = {}) => ({ id, usuario, nome, papel, criadoEm: `2026-01-0${id.length % 9}T00:00:00.000Z`, trocarSenha: false, ...extra });
const CONTAS = [
  conta('usr_adm', 'pedro', 'Pedro Melo', 'admin'),
  { ...conta('usr_g1', 'pedromaia', 'Pedro Maia', 'gerente'), criadoEm: '2026-01-01T00:00:00.000Z' },
  { ...conta('usr_g2', 'pedropuntel', 'Pedro Puntel', 'gerente'), criadoEm: '2026-01-02T00:00:00.000Z' },
  conta('usr_op', 'thiago', 'Thiago', 'operador'),
  conta('usr_dir', 'diretor', 'Diretor Senha', 'diretor'),
  conta('usr_pin', 'diretorpin', 'Diretor Pin', 'diretor', { acesso: 'pin', ajustaDepoisDeAprovada: true }),
];
const gravarContas = (lista) => writeFileSync(path.join(dados, 'usuarios.json'), JSON.stringify(lista));
gravarContas(CONTAS);

const auth = await import('../auth.mjs');
const aprovacoes = await import('../aprovacoes.mjs');
const envios = await import('../envios.mjs');
const { carregar } = await import('../db.mjs');
// 21/10 (Pedro): os outros caminhos que gravam a peça (chat e "Outra ideia") e a mensagem de sem IA
const agente = await import('../agente.mjs');
const outrasIdeias = await import('../outras-ideias.mjs');
const { MSG_SEM_IA } = await import('../noticias.mjs');

// ---------- servidor das rotas de aprovação numa porta livre ----------

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
    // x-sem-perfil: pula o podeApi, pra ver a defesa de dentro da rota
    if (!req.headers['x-sem-perfil'] && !auth.podeApi(u, req.method, caminho)) return json(res, 403, { erro: auth.motivoNegado(u, req.method, caminho) });
    const sess = { usuario: u };
    if (partes[0] === 'aprovacoes') return await aprovacoes.rota(req, res, partes[1], partes[2], sess, { json, corpoJson });
    if (partes[0] === 'envios') return await envios.rota(req, res, partes.slice(1), sess, { json, corpoJson });
    return json(res, 404, { erro: 'Rota não existe.' });
  } catch (e) {
    if (res.headersSent) return res.end();
    return json(res, e.status ?? 500, { erro: e.message });
  }
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
after(() => servidor.close());

function pedir(caminho, { metodo = 'GET', quem = 'pedro', corpo, cabecalhos = {} } = {}) {
  return new Promise((ok, erro) => {
    const cru = corpo === undefined ? null : Buffer.from(JSON.stringify(corpo));
    const h = { 'x-teste-quem': quem, ...(cru ? { 'content-length': cru.length, 'content-type': 'application/json' } : {}), ...cabecalhos };
    const req = http.request({ host: '127.0.0.1', port: servidor.address().port, path: caminho, method: metodo, headers: h }, (res) => {
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
const acao = (id, qual, quem, corpo = {}) => pedir(`/api/aprovacoes/${id}/${qual}`, { metodo: 'POST', quem, corpo });
const ids = (lista) => lista.map((x) => x.id).sort();

// ---------- perfis ----------

test('perfis: o Gerente tem o poder do Admin e aprova; Admin e Operador não aprovam; Operador não gerencia', () => {
  const p = (papel) => ({ papel });
  const gestao = [
    ['GET', '/api/usuarios'], ['PUT', '/api/usuarios/usr_x'], ['DELETE', '/api/usuarios/usr_x'], ['POST', '/api/usuarios/usr_x/redefinir'],
    ['POST', '/api/usuarios/usr_x/link-pin'], ['GET', '/api/convites'], ['POST', '/api/convites'], ['DELETE', '/api/convites/cnv_x'],
    ['POST', '/api/semana/gerar'], ['POST', '/api/noticias/atualizar'],
  ];
  const time = [
    ['GET', '/api/estado'], ['PUT', '/api/reels/reel_x'], ['GET', '/api/mecanismo'], ['GET', '/api/semana/sugestoes'], ['POST', '/api/semana/sugestoes/usar'],
    ['GET', '/api/semana/estado'], ['POST', '/api/semana/regerar'], ['GET', '/api/noticias'], ['POST', '/api/aprovacoes/reel_x/enviar'],
    ['POST', '/api/aprovacoes/reel_x/explicacao'], ['POST', '/api/envios'],
  ];
  const decidir = [['POST', '/api/aprovacoes/reel_x/aprovar'], ['POST', '/api/aprovacoes/env_x/ajustar'], ['POST', '/api/aprovacoes/reel.x/aprovar']];
  for (const [m, c] of [...gestao, ...time]) {
    assert.ok(auth.podeApi(p('admin'), m, c), `admin: ${m} ${c}`);
    assert.ok(auth.podeApi(p('gerente'), m, c), `gerente: ${m} ${c}`);
  }
  for (const [m, c] of time) assert.ok(auth.podeApi(p('operador'), m, c), `operador: ${m} ${c}`);
  for (const [m, c] of gestao) assert.equal(auth.podeApi(p('operador'), m, c), false, `operador: ${m} ${c}`);
  for (const [m, c] of decidir) {
    assert.ok(auth.podeApi(p('gerente'), m, c), `gerente: ${m} ${c}`);
    assert.ok(auth.podeApi(p('diretor'), m, c) || c.includes('.'), `diretor: ${m} ${c}`);
    assert.equal(auth.podeApi(p('admin'), m, c), false, `admin: ${m} ${c}`);
    assert.equal(auth.podeApi(p('operador'), m, c), false, `operador: ${m} ${c}`);
  }
  // o Diretor contábil não chega no conteúdo novo (nem no resto do time)
  for (const [m, c] of [...gestao, ...time]) assert.equal(auth.podeApi(p('diretor'), m, c), false, `diretor: ${m} ${c}`);
  assert.ok(auth.podeApi(p('diretor'), 'GET', '/api/aprovacoes'));
  assert.ok(auth.podeApi(p('diretor'), 'POST', '/api/aprovacoes/reel_x/mensagem'));
  // os nomes e as mensagens
  assert.equal(auth.NOME_PAPEL.gerente, 'Gerente de Marketing');
  assert.deepEqual(auth.PAPEIS, ['admin', 'gerente', 'operador', 'diretor']);
  assert.equal(auth.conferirPapel('gerente'), 'gerente');
  assert.throws(() => auth.conferirPapel('chefe'), (e) => e.status === 400);
  assert.match(auth.motivoNegado(p('admin'), 'POST', '/api/aprovacoes/reel_x/aprovar'), /Gerentes de Marketing e o Diretor contábil/);
  assert.match(auth.motivoNegado(p('operador'), 'POST', '/api/semana/gerar'), /Admin ou Gerente de Marketing/);
  assert.equal(auth.motivoNegado(p('diretor'), 'GET', '/api/noticias'), 'O seu perfil vê só as Aprovações técnicas.');
  assert.deepEqual(auth.gerentesAtivos(), [{ id: 'usr_g1', nome: 'Pedro Maia' }, { id: 'usr_g2', nome: 'Pedro Puntel' }]);
});

test('caminho canônico: segmento vazio, decode torto, barra, contrabarra e controle não passam', () => {
  assert.deepEqual(auth.partesDaApi('/api/usuarios/usr_1'), ['usuarios', 'usr_1']);
  assert.deepEqual(auth.partesDaApi('/api/%75suarios/x'), ['usuarios', 'x']);
  assert.deepEqual(auth.partesDaApi('/api/videos/a%20b'), ['videos', 'a b']);
  for (const ruim of [
    '/api/', '/api//usuarios/x', '/api/aprovacoes/x/aprovar/', '/api/usuarios//x', '/api/usuarios%2Fx', '/api/usuarios%5Cx', '/api/a%00b',
    '/api/a%0Ab', '/api/a%7Fb', '/api/a%C2%85b', '/api/%E0%A4%A', '/api/%', '/api/%2e', '/api/%2E%2E/usuarios', '/apix/usuarios', '/outra/api/x', '/api',
  ]) assert.equal(auth.partesDaApi(ruim), null, ruim);
});

// ---------- etapas ----------

test('etapas: os 2 gerentes aprovam cada um, depois um diretor fecha', async () => {
  const id = 'reel_um';
  // antes de mandar: o Diretor não vê
  assert.equal((await pedir(`/api/aprovacoes/${id}`, { quem: 'diretor' })).status, 404);
  const mandado = await acao(id, 'enviar', 'thiago', { explicacao: 'Base técnica (F051)' });
  assert.equal(mandado.status, 200);
  assert.equal(mandado.j.aprovacao.estado, 'pendente');
  assert.equal(mandado.j.aprovacao.etapa, 'gerentes');
  assert.deepEqual(mandado.j.aprovacao.gerentes.aprovaram, []);
  assert.deepEqual(mandado.j.gerentesNecessarios, [{ id: 'usr_g1', nome: 'Pedro Maia' }, { id: 'usr_g2', nome: 'Pedro Puntel' }]);

  // com os gerentes: o Diretor não vê, não aprova e não ajusta; quem não decide nem chega
  assert.ok(!ids((await pedir('/api/aprovacoes', { quem: 'diretor' })).j.pendentes).includes(id));
  assert.ok(ids((await pedir('/api/aprovacoes', { quem: 'thiago' })).j.pendentes).includes(id));
  assert.equal((await pedir(`/api/aprovacoes/${id}`, { quem: 'diretor' })).status, 404);
  assert.equal((await acao(id, 'aprovar', 'diretor')).status, 404);
  assert.equal((await acao(id, 'aprovar', 'pedro')).status, 403);
  assert.equal((await acao(id, 'aprovar', 'thiago')).status, 403);

  // primeiro gerente
  const g1 = await acao(id, 'aprovar', 'pedromaia');
  assert.equal(g1.status, 200);
  assert.equal(g1.j.aprovacao.estado, 'pendente');
  assert.equal(g1.j.aprovacao.etapa, 'gerentes');
  assert.deepEqual(g1.j.aprovacao.gerentes.aprovaram.map((x) => [x.id, x.nome]), [['usr_g1', 'Pedro Maia']]);
  assert.match(g1.j.aprovacao.conversa.at(-1).texto, /Falta Pedro Puntel/);
  assert.equal(g1.j.aprovacao.conversa.at(-1).etapa, 'gerentes');
  assert.equal(g1.j.aprovacao.conversa.at(-1).papel, 'gerente');
  const repetido = await acao(id, 'aprovar', 'pedromaia');
  assert.equal(repetido.status, 409);
  assert.match(repetido.j.erro, /Você já aprovou\. Falta Pedro Puntel\./);
  const cedo = await acao(id, 'aprovar', 'diretorpin');
  assert.equal(cedo.status, 404, 'ainda com os gerentes: não existe pro Diretor');

  // segundo gerente: segue pro Diretor contábil
  const g2 = await acao(id, 'aprovar', 'pedropuntel');
  assert.equal(g2.j.aprovacao.etapa, 'diretor');
  assert.equal(g2.j.aprovacao.estado, 'pendente');
  assert.equal(g2.j.aprovacao.gerentes.aprovaram.length, 2);
  const tarde = await acao(id, 'aprovar', 'pedromaia');
  assert.equal(tarde.status, 409);
  assert.match(tarde.j.erro, /já passou pelos gerentes/);
  assert.equal((await acao(id, 'ajustar', 'pedropuntel', { mensagem: 'x' })).status, 409);

  // com o Diretor: ele vê; um diretor aprova e fecha
  assert.ok(ids((await pedir('/api/aprovacoes', { quem: 'diretor' })).j.pendentes).includes(id));
  assert.equal((await pedir(`/api/aprovacoes/${id}`, { quem: 'diretor' })).status, 200);
  const fechado = await acao(id, 'aprovar', 'diretor', { mensagem: 'Base confere' });
  assert.equal(fechado.status, 200);
  assert.equal(fechado.j.aprovacao.estado, 'aprovado');
  assert.equal(fechado.j.aprovacao.decididoPor, 'Diretor Senha');
  assert.equal(fechado.j.aprovacao.conversa.at(-1).etapa, 'diretor');
  // o outro diretor não precisa aprovar (e não aprova de novo)
  assert.equal((await acao(id, 'aprovar', 'diretorpin')).status, 409);
  const db = await carregar();
  assert.equal(db.reels.find((r) => r.id === id).aprovacao.estado, 'aprovado');
  assert.ok(ids((await pedir('/api/aprovacoes', { quem: 'diretor' })).j.recentes).includes(id));
});

test('etapas: só a conta com ajustaDepoisDeAprovada ajusta peça aprovada; o ajuste recomeça nos gerentes', async () => {
  const id = 'reel_um';
  const leonam = await acao(id, 'ajustar', 'diretor', { mensagem: 'Trocar o gancho' });
  assert.equal(leonam.status, 409);
  assert.match(leonam.j.erro, /já foi aprovada/);
  assert.equal((await acao(id, 'ajustar', 'pedromaia', { mensagem: 'x' })).status, 409, 'gerente também não');
  const ajuste = await acao(id, 'ajustar', 'diretorpin', { mensagem: 'Ajustei a legenda', conteudo: { legenda: 'Legenda nova do Diretor' } });
  assert.equal(ajuste.status, 200);
  assert.equal(ajuste.j.aprovacao.estado, 'ajuste');
  assert.equal(ajuste.j.aprovacao.tipoAjuste, 'editado');
  assert.equal(ajuste.j.aprovacao.decididoPor, 'Diretor Pin');
  assert.equal(ajuste.j.legenda, 'Legenda nova do Diretor');
  assert.deepEqual(ajuste.j.aprovacao.conversa.at(-1).mudou, ['legenda']);
  // a próxima ida recomeça nos gerentes, com as aprovações zeradas
  const deNovo = await acao(id, 'enviar', 'thiago', { explicacao: 'Base técnica (F051)' });
  assert.equal(deNovo.j.aprovacao.etapa, 'gerentes');
  assert.deepEqual(deNovo.j.aprovacao.gerentes.aprovaram, []);
  assert.equal(deNovo.j.aprovacao.rodada, 2);
  // ajuste do gerente na etapa dele
  const g = await acao(id, 'ajustar', 'pedropuntel', { mensagem: 'Faltou a fonte' });
  assert.equal(g.status, 200);
  assert.equal(g.j.aprovacao.estado, 'ajuste');
  assert.equal(g.j.aprovacao.etapa, 'gerentes');
  // decidido pelos gerentes: o Diretor não vê
  assert.equal((await pedir(`/api/aprovacoes/${id}`, { quem: 'diretor' })).status, 404);
  assert.ok(!ids((await pedir('/api/aprovacoes', { quem: 'diretor' })).j.recentes).includes(id));
  // peça já postada não recebe ajuste nem depois de aprovada
  const db = await carregar();
  Object.assign(db.reels.find((r) => r.id === 'reel_postado'), { aprovacao: { estado: 'aprovado', etapa: 'diretor', decididoEm: new Date().toISOString(), conversa: [] } });
  assert.equal((await acao('reel_postado', 'ajustar', 'diretorpin', { mensagem: 'x' })).status, 409);
});

test('etapas: a defesa de dentro da rota não confia só no perfil', async () => {
  await acao('reel_dois', 'enviar', 'thiago', { explicacao: 'Base' });
  for (const quem of ['pedro', 'thiago']) {
    for (const qual of ['aprovar', 'ajustar']) {
      const r = await pedir(`/api/aprovacoes/reel_dois/${qual}`, { metodo: 'POST', quem, corpo: { mensagem: 'x' }, cabecalhos: { 'x-sem-perfil': '1' } });
      assert.equal(r.status, 403, `${quem} ${qual}`);
    }
  }
  const db = await carregar();
  assert.equal(db.reels.find((r) => r.id === 'reel_dois').aprovacao.estado, 'pendente');
});

test('etapas: pendente antigo (sem etapa) está com o diretor', async () => {
  const lista = (await pedir('/api/aprovacoes', { quem: 'pedromaia' })).j;
  const velho = lista.pendentes.find((x) => x.id === 'reel_velho');
  assert.equal(velho.aprovacao.etapa, 'diretor');
  assert.deepEqual(velho.aprovacao.gerentes.aprovaram, []);
  assert.equal((await acao('reel_velho', 'aprovar', 'pedromaia')).status, 409);
  assert.ok(ids((await pedir('/api/aprovacoes', { quem: 'diretor' })).j.pendentes).includes('reel_velho'));
  assert.equal((await acao('reel_velho', 'aprovar', 'diretorpin')).j.aprovacao.estado, 'aprovado');
});

test('etapas: o gerador da semana manda pros gerentes sem conta logada', async () => {
  const r = await aprovacoes.enviarPeloSistema('reel_sistema', 'Explicação do gerador (F051)');
  assert.equal(r.aprovacao.estado, 'pendente');
  assert.equal(r.aprovacao.etapa, 'gerentes');
  assert.equal(r.aprovacao.enviadoPor, 'Gerador da semana');
  assert.equal(r.aprovacao.enviadoPorId, null);
  assert.deepEqual([r.aprovacao.conversa.at(-1).tipo, r.aprovacao.conversa.at(-1).papel], ['envio', 'sistema']);
  await assert.rejects(aprovacoes.enviarPeloSistema('reel_sistema', 'De novo'), (e) => e.status === 409);
  await assert.rejects(aprovacoes.enviarPeloSistema('reel_postado', 'Postada'), (e) => e.status === 409);
  await assert.rejects(aprovacoes.enviarPeloSistema('reel_naoexiste', 'x'), (e) => e.status === 404);
  const outro = await aprovacoes.enviarPeloSistema('reel_dois', 'x', 'Outro robô').catch((e) => e);
  assert.equal(outro.status, 409, 'reel_dois já está pendente');
});

test('etapas: texto mexido no meio da aprovação volta pros gerentes', async () => {
  const db = await carregar();
  const r = db.reels.find((x) => x.id === 'reel_sistema');
  await acao('reel_sistema', 'aprovar', 'pedromaia');
  await acao('reel_sistema', 'aprovar', 'pedropuntel');
  assert.equal(r.aprovacao.etapa, 'diretor');
  const antes = structuredClone({ roteiro: r.roteiro, carrossel: r.carrossel, estatico: r.estatico, legenda: r.legenda });
  assert.equal(aprovacoes.conferirMudancaAprovada(r, antes, { nome: 'Thiago', id: 'usr_op', papel: 'operador' }), false, 'nada mudou');
  r.legenda = 'Legenda mexida pelo time';
  assert.equal(aprovacoes.conferirMudancaAprovada(r, antes, { nome: 'Thiago', id: 'usr_op', papel: 'operador' }), true);
  assert.equal(r.aprovacao.estado, 'pendente');
  assert.equal(r.aprovacao.etapa, 'gerentes');
  assert.deepEqual(r.aprovacao.gerentes.aprovaram, []);
  assert.equal(r.aprovacao.conversa.at(-1).tipo, 'alterado');
  // sem aprovação nenhuma ainda: nada a perder, nada anotado
  const n = r.aprovacao.conversa.length;
  const antes2 = structuredClone({ roteiro: r.roteiro, carrossel: r.carrossel, estatico: r.estatico, legenda: r.legenda });
  r.legenda = 'Outra legenda';
  assert.equal(aprovacoes.conferirMudancaAprovada(r, antes2, null), false);
  assert.equal(r.aprovacao.conversa.length, n);
});

test('envios: o Diretor não vê o rascunho do time (404) nem o que está com os gerentes', async () => {
  assert.equal((await pedir('/api/aprovacoes/env_rascunho', { quem: 'diretor' })).status, 404);
  assert.equal((await pedir('/api/aprovacoes/env_rascunho', { quem: 'diretorpin' })).status, 404);
  assert.equal((await pedir('/api/aprovacoes/env_rascunho', { quem: 'thiago' })).status, 200);
  assert.equal((await acao('env_rascunho', 'mensagem', 'diretor', { texto: 'oi' })).status, 404);
  // com arquivo e mandado: fica com os gerentes; envio pendente não muda
  const db = await carregar();
  const e = db.envios.find((x) => x.id === 'env_rascunho');
  e.arquivos.push({ id: 'arq_teste', nome: 'parecer.gif', tipo: 'image/gif', ext: 'gif', tamanho: 10 });
  const mandado = await acao('env_rascunho', 'enviar', 'thiago', {});
  assert.equal(mandado.j.aprovacao.etapa, 'gerentes');
  const travado = await pedir('/api/envios/env_rascunho', { metodo: 'PUT', quem: 'thiago', corpo: { titulo: 'Outro' } });
  assert.equal(travado.status, 409);
  assert.equal(travado.j.erro, 'Está com os gerentes: espere a decisão antes de mexer.');
  assert.equal((await pedir('/api/aprovacoes/env_rascunho', { quem: 'diretor' })).status, 404);
  assert.equal((await pedir('/api/envios/env_rascunho/arquivos/arq_teste', { quem: 'diretor' })).status, 404);
  await acao('env_rascunho', 'aprovar', 'pedromaia');
  await acao('env_rascunho', 'aprovar', 'pedropuntel');
  assert.equal((await pedir('/api/aprovacoes/env_rascunho', { quem: 'diretor' })).status, 200);
  const fechado = await acao('env_rascunho', 'aprovar', 'diretor');
  assert.equal(fechado.j.aprovacao.estado, 'aprovado');
  // envio aprovado: só a conta com a permissão ajusta (só a mensagem)
  assert.equal((await acao('env_rascunho', 'ajustar', 'diretor', { mensagem: 'x' })).status, 409);
  const ajuste = await acao('env_rascunho', 'ajustar', 'diretorpin', { mensagem: 'Trocar a imagem' });
  assert.equal(ajuste.j.aprovacao.estado, 'ajuste');
  assert.equal(ajuste.j.aprovacao.tipoAjuste, 'sugestao');
});

test('etapas: sem gerente cadastrado, mandar já cai no diretor; gerente que sai não trava a etapa', async () => {
  // um dos gerentes vira operador: a etapa dos gerentes espera só o outro
  gravarContas(CONTAS.map((c) => (c.id === 'usr_g2' ? { ...c, papel: 'operador' } : c)));
  const um = await acao('reel_um', 'enviar', 'thiago', { explicacao: 'Base' });
  assert.equal(um.j.aprovacao.etapa, 'gerentes');
  assert.deepEqual(um.j.gerentesNecessarios, [{ id: 'usr_g1', nome: 'Pedro Maia' }]);
  assert.equal((await acao('reel_um', 'aprovar', 'pedromaia')).j.aprovacao.etapa, 'diretor');
  // sem nenhum gerente: direto pro diretor
  gravarContas(CONTAS.filter((c) => c.papel !== 'gerente'));
  assert.deepEqual(auth.gerentesAtivos(), []);
  const dois = await acao('reel_dois', 'ajustar', 'diretor', { mensagem: 'x' }).catch((e) => e);
  assert.equal(dois.status, 200, 'reel_dois estava com os gerentes, que saíram: agora é do diretor');
  const mandado = await acao('reel_dois', 'enviar', 'thiago', { explicacao: 'Base' });
  assert.equal(mandado.j.aprovacao.etapa, 'diretor');
  assert.deepEqual(mandado.j.gerentesNecessarios, []);
  assert.equal((await acao('reel_dois', 'aprovar', 'diretor')).j.aprovacao.estado, 'aprovado');
  gravarContas(CONTAS);
});

// ---------- 21/10 (Pedro): o que a aprovação cobre e por onde a peça muda ----------

const aprovada = (id, extra = {}) => peca(id, {
  fontes: ['F051 · 07-OBRIGACOES-MENSAIS §5'], videos: [{ arquivo: 'proposta/final.mp4', rotulo: 'Motion' }],
  estatico: { headline: 'Arte que ninguém revisou', apoio: '', visual: '', cta: '' },
  aprovacao: { estado: 'aprovado', etapa: 'diretor', decididoEm: new Date().toISOString(), decididoPor: 'Diretor Senha', conversa: [] },
  ...extra,
});
async function novaPeca(r) {
  (await carregar()).reels.push(r);
  return r;
}
const THIAGO = CONTAS.find((c) => c.id === 'usr_op');

test('aprovação: tipo de peça, vídeo final e fontes trocados tiram a aprovação; a mesma peça mandada de volta não', async () => {
  const r = await novaPeca(aprovada('reel_cobre'));
  // a tela manda de volta o mesmo (fonte com espaço, vídeo com outro rótulo): segue aprovada
  let antes = aprovacoes.fotoDaAprovacao(r);
  r.fontes = ['  F051 · 07-OBRIGACOES-MENSAIS §5 '];
  r.videos = [{ arquivo: 'proposta/final.mp4', rotulo: 'Outro rótulo' }];
  assert.equal(aprovacoes.conferirMudancaAprovada(r, antes, THIAGO), false);
  assert.equal(r.aprovacao.estado, 'aprovado');
  for (const [campo, valor, rotulo] of [
    ['videos', [{ arquivo: 'proposta/outro.mp4', rotulo: 'Motion' }], 'vídeo final'], ['peca', 'estatico', 'tipo de peça'], ['fontes', ['inventada'], 'fontes'],
  ]) {
    r.aprovacao.estado = 'aprovado';
    antes = aprovacoes.fotoDaAprovacao(r);
    r[campo] = valor;
    assert.equal(aprovacoes.conferirMudancaAprovada(r, antes, THIAGO), true, campo);
    assert.equal(r.aprovacao.estado, 'alterado', campo);
    assert.deepEqual(r.aprovacao.conversa.at(-1).mudou, [rotulo]);
    assert.match(r.aprovacao.conversa.at(-1).texto, /^A peça mudou depois de aprovada/);
  }
});

test('aprovação: "Marcar como postado" confere a peça como estava e como fica, no mesmo PUT', () => {
  const r = aprovada('reel_trava');
  assert.equal(aprovacoes.travaPostadoNaEdicao(r, { status: 'publicado' }), false, 'aprovada: posta');
  assert.equal(aprovacoes.travaPostadoNaEdicao(r, { status: 'publicado', legenda: 'Outra' }), true, 'mudou o aprovado no mesmo pedido');
  assert.equal(aprovacoes.travaPostadoNaEdicao(r, { status: 'publicado', peca: 'estatico' }), true, 'virou estático no mesmo pedido');
  assert.equal(aprovacoes.travaPostadoNaEdicao(r, { status: 'publicado', fontes: [' F051 · 07-OBRIGACOES-MENSAIS §5'] }), false, 'a mesma fonte');
  const stories = peca('reel_stories', { peca: 'stories' });
  assert.equal(aprovacoes.travaPostadoNaEdicao(stories, { status: 'publicado' }), false, 'stories não pede aprovação');
  assert.equal(aprovacoes.travaPostadoNaEdicao(stories, { status: 'publicado', peca: 'reel' }), true, 'virou reel no mesmo pedido');
  const passada = peca('reel_passada', { data: '2026-01-05' });
  assert.equal(aprovacoes.travaPostadoNaEdicao(passada, { status: 'publicado' }), false, 'data passada');
  assert.equal(aprovacoes.travaPostadoNaEdicao(passada, { status: 'publicado', data: '2099-02-01' }), true, 'data nova de hoje em diante');
  assert.equal(aprovacoes.travaPostadoNaEdicao(peca('reel_ja', { status: 'publicado' }), { status: 'publicado', legenda: 'x' }), false, 'já postada');
});

test('aprovação: o chat (salvar_reel) e o "Outra ideia" mexem na aprovação como o PUT', async () => {
  const db = await carregar();
  // chat numa peça aprovada: vira "Mudou depois de aprovada", com o nome de quem trocou
  const r1 = await novaPeca(aprovada('reel_chat'));
  const salvo = await agente.gravarEdicaoDoChat('reel_chat', { legenda: 'Legenda nova pelo chat' }, { autor: 'Thiago', usuario: THIAGO });
  assert.equal(salvo, r1);
  assert.equal(r1.legenda, 'Legenda nova pelo chat');
  assert.equal(r1.atualizadoPor, 'Thiago');
  assert.equal(r1.aprovacao.estado, 'alterado');
  assert.deepEqual([r1.aprovacao.conversa.at(-1).tipo, r1.aprovacao.conversa.at(-1).autor], ['alterado', 'Thiago']);
  assert.deepEqual(r1.aprovacao.conversa.at(-1).mudou, ['legenda']);
  // o mesmo texto de novo pelo chat não mexe
  r1.aprovacao.estado = 'aprovado';
  await agente.gravarEdicaoDoChat('reel_chat', { legenda: 'Legenda nova pelo chat' }, { autor: 'Thiago' });
  assert.equal(r1.aprovacao.estado, 'aprovado');
  assert.equal(await agente.gravarEdicaoDoChat('reel_naoexiste', { legenda: 'x' }), null);

  // "Outra ideia" numa peça pendente com 1 gerente aprovado: volta pros gerentes com as aprovações zeradas
  const op = {
    titulo: 'Ideia nova', temaDaPeca: 'Tema novo', descricao: 'Descrição da ideia nova', gancho: 'Gancho novo', estiloGancho: '', publico: 'MEI',
    tema: null, roteiroBase: { hook: 'Gancho novo', textoTela: '', narracao: 'Narração nova da ideia, com mais de dez letras.', cta: 'Chama no app' },
    fontes: ['F051'], conferir: false,
  };
  const r2 = await novaPeca(peca('reel_outra', {
    aprovacao: { estado: 'pendente', etapa: 'gerentes', gerentes: { aprovaram: [{ id: 'usr_g1', nome: 'Pedro Maia', em: '2026-10-21T10:00:00.000Z' }] }, conversa: [] },
  }));
  const ideia = outrasIdeias.trocarIdeia(db, r2, op, { autor: 'Thiago', usuario: THIAGO });
  assert.equal(r2.ideiaId, ideia.id);
  assert.equal(r2.roteiro.hook, 'Gancho novo');
  assert.equal(r2.aprovacao.estado, 'pendente');
  assert.equal(r2.aprovacao.etapa, 'gerentes');
  assert.deepEqual(r2.aprovacao.gerentes.aprovaram, []);
  assert.equal(r2.aprovacao.conversa.at(-1).tipo, 'alterado');
  assert.ok(r2.aprovacao.conversa.at(-1).mudou.includes('roteiro'));
  // peça aprovada trocada pelo "Outra ideia": vira "Mudou depois de aprovada"
  const r3 = await novaPeca(aprovada('reel_outra_aprovada'));
  outrasIdeias.trocarIdeia(db, r3, op, { autor: 'Thiago' });
  assert.equal(r3.aprovacao.estado, 'alterado');
  assert.equal(r3.aprovacao.conversa.at(-1).autor, 'Thiago');
});

test('aprovação: a permissão de ajustar o aprovado só vale com o perfil Diretor contábil', async () => {
  await novaPeca(aprovada('reel_permissao'));
  // um gerente com a permissão gravada e o diretor de PIN que virou gerente: nenhum dos dois ajusta
  gravarContas(CONTAS.map((c) => (c.id === 'usr_g1' ? { ...c, ajustaDepoisDeAprovada: true } : c.id === 'usr_pin' ? { ...c, papel: 'gerente' } : c)));
  try {
    for (const quem of ['pedromaia', 'diretorpin']) {
      const r = await acao('reel_permissao', 'ajustar', quem, { mensagem: 'Trocar o gancho' });
      assert.equal(r.status, 409, quem);
      assert.match(r.j.erro, /já foi aprovada/);
    }
    assert.equal(auth.resumo(auth.usuarios().find((u) => u.id === 'usr_pin')).ajustaDepoisDeAprovada, false, 'a tela não mostra o botão');
  } finally {
    gravarContas(CONTAS);
  }
  // de volta a Diretor contábil: ajusta
  const ok = await acao('reel_permissao', 'ajustar', 'diretorpin', { mensagem: 'Trocar o gancho' });
  assert.equal(ok.status, 200);
  assert.equal(ok.j.aprovacao.estado, 'ajuste');
});

test('aprovação: peça regerada (aprovação solta, estado null) não aparece em "Decididas"', async () => {
  await novaPeca(peca('reel_regerada', { aprovacao: { estado: null, etapa: 'gerentes', enviadoEm: new Date().toISOString(), conversa: [] } }));
  const l = await aprovacoes.listar({ usuario: CONTAS[0] });
  assert.ok(!ids(l.recentes).includes('reel_regerada'));
  assert.ok(!ids(l.pendentes).includes('reel_regerada'));
  assert.ok(l.recentes.length > 0);
  assert.ok(l.recentes.every((x) => ['aprovado', 'ajuste', 'alterado'].includes(x.aprovacao.estado)));
});

test('aprovação na forma da tela: a etapa de agora e, na pendente, só os gerentes de agora em "aprovaram"', () => {
  const ger = [{ id: 'usr_g1', nome: 'Pedro Maia' }];
  const ap = { estado: 'pendente', etapa: 'gerentes', gerentes: { aprovaram: [{ id: 'usr_g1', nome: 'Pedro Maia' }, { id: 'usr_saiu', nome: 'Quem saiu' }] } };
  const t = aprovacoes.aprovacaoParaTela(ap, ger);
  assert.equal(t.etapa, 'diretor');
  assert.deepEqual(t.gerentes.aprovaram.map((x) => x.id), ['usr_g1']);
  const t2 = aprovacoes.aprovacaoParaTela({ ...ap, gerentes: { aprovaram: [{ id: 'usr_saiu', nome: 'Quem saiu' }] } }, ger);
  assert.equal(t2.etapa, 'gerentes');
  assert.deepEqual(t2.gerentes.aprovaram, [], 'aprovação de quem saiu não conta no "(1 de 1)"');
  // decidida: o histórico fica
  assert.equal(aprovacoes.aprovacaoParaTela({ ...ap, estado: 'aprovado', etapa: 'diretor' }, ger).gerentes.aprovaram.length, 2);
  assert.equal(ap.etapa, 'gerentes', 'o banco não muda');
  assert.equal(aprovacoes.aprovacaoParaTela(null, ger), null);
});

test('aprovação: "Escrever com IA" sem a chave da IA dá a mensagem combinada (503)', async () => {
  const antes = process.env.CRONOGRAMA_IA;
  process.env.CRONOGRAMA_IA = '0';
  try {
    const r = await pedir('/api/aprovacoes/reel_um/explicacao', { metodo: 'POST', quem: 'thiago', corpo: {} });
    assert.equal(r.status, 503);
    assert.ok(r.j.erro.startsWith(MSG_SEM_IA), r.j.erro);
  } finally {
    if (antes === undefined) delete process.env.CRONOGRAMA_IA;
    else process.env.CRONOGRAMA_IA = antes;
  }
});

// ---------- o servidor de verdade: caminho canônico ----------

const SENHA = 'senha-de-teste-123';
const SERVER = path.join(import.meta.dirname, '..', 'server.mjs');
let real = null;

async function subirServidorReal() {
  const pasta = path.join(raiz, 'real');
  mkdirSync(pasta, { recursive: true });
  writeFileSync(path.join(pasta, 'estilos.json'), '{}');
  writeFileSync(path.join(pasta, 'db.json'), JSON.stringify({ schemaVersion: 2, reels: [] }));
  const hash = await auth.hashSenha(SENHA);
  writeFileSync(path.join(pasta, 'usuarios.json'), JSON.stringify([
    { id: 'usr_ger', usuario: 'gerente', nome: 'Gerente', hash, papel: 'gerente', criadoEm: '2026-01-01T00:00:00.000Z', trocarSenha: false },
    { id: 'usr_op', usuario: 'operador', nome: 'Operador', hash, papel: 'operador', criadoEm: '2026-01-02T00:00:00.000Z', trocarSenha: false },
    { id: 'usr_dir', usuario: 'diretor', nome: 'Diretor', hash, papel: 'diretor', criadoEm: '2026-01-03T00:00:00.000Z', trocarSenha: false },
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

function pedirReal(caminho, { metodo = 'GET', cookie, corpo, cabecalhos = {}, parcial } = {}) {
  return new Promise((ok, erro) => {
    const cru = corpo === undefined ? null : Buffer.from(JSON.stringify(corpo));
    const h = {
      host: `localhost:${real.porta}`, ...(cookie ? { cookie } : {}),
      ...(cru ? { 'content-length': cru.length, 'content-type': 'application/json' } : {}), ...cabecalhos,
    };
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
    req.on('error', (e) => (parcial && ['ECONNRESET', 'EPIPE'].includes(e.code) ? null : erro(e)));
    if (parcial) req.write(parcial);
    else req.end(cru ?? undefined);
  });
}
async function entrarReal(usuario) {
  const r = await pedirReal('/api/auth/entrar', { metodo: 'POST', corpo: { usuario, senha: SENHA } });
  assert.equal(r.status, 200, `login ${usuario}: ${JSON.stringify(r.j)}`);
  return [r.h['set-cookie']].flat().map((c) => c.split(';')[0]).join('; ');
}

test('caminho canônico no servidor de verdade: os ataques dão 400 ou 403', { timeout: 90_000 }, async () => {
  real = await subirServidorReal();
  after(async () => {
    if (real.filho.exitCode !== null) return;
    const saiu = new Promise((ok) => real.filho.once('exit', ok));
    real.filho.kill();
    await saiu;
  });
  const op = await entrarReal('operador');
  const ger = await entrarReal('gerente');
  const dir = await entrarReal('diretor');

  // o caminho limpo: o operador não chega em usuários; o gerente chega
  assert.equal((await pedirReal('/api/usuarios', { cookie: op })).status, 403);
  assert.equal((await pedirReal('/api/usuarios', { cookie: ger })).status, 200);

  // barra dupla, barra no fim, segmento com barra, contrabarra ou controle, decode torto: 400
  for (const [m, c] of [
    ['GET', '/api//usuarios'], ['GET', '/api//usuarios/usr_ger'], ['GET', '/api/usuarios/'], ['DELETE', '/api/usuarios//usr_ger'],
    ['POST', '/api/aprovacoes/x/aprovar/'], ['POST', '/api//aprovacoes/x/aprovar'], ['POST', '/api/aprovacoes/x%2Faprovar'],
    ['GET', '/api/usuarios%2Fusr_ger'], ['GET', '/api/usuarios%5Cusr_ger'], ['GET', '/api/a%00b'], ['GET', '/api/%E0%A4%A'],
    ['GET', '/api/auth/estado/'], ['GET', '/api/'],
  ]) {
    const r = await pedirReal(c, { metodo: m, cookie: op, corpo: m === 'GET' ? undefined : {} });
    assert.equal(r.status, 400, `${m} ${c}: ${JSON.stringify(r.j)}`);
    assert.equal(r.j.erro, 'Endereço inválido.');
  }
  // o mesmo caminho escrito com %XX: o perfil confere o canônico (403), e a rota é a mesma que ele conferiu
  for (const [m, c] of [
    ['GET', '/api/%75suarios'], ['PUT', '/api/%75suarios/usr_ger'], ['DELETE', '/api/usuarios/%75sr_ger'], ['POST', '/api/%63onvites'],
    ['POST', '/api/aprovacoes/x/%61provar'], ['POST', '/api/aprovacoes/x/aprova%72'], ['POST', '/api/semana/%67erar'], ['POST', '/api/noticias/atualizar'],
  ]) {
    const r = await pedirReal(c, { metodo: m, cookie: op, corpo: m === 'GET' ? undefined : { papel: 'admin' } });
    assert.equal(r.status, 403, `${m} ${c}: ${JSON.stringify(r.j)}`);
    assert.equal(r.j.perfil, 'operador');
  }
  assert.equal((await pedirReal('/api/%75suarios', { cookie: ger })).status, 200, 'o gerente chega pelo canônico também');
  // o Diretor contábil não chega no conteúdo novo, nem escrito de outro jeito
  for (const c of ['/api/mecanismo?semana=2026-10-26', '/api/noticias', '/api/semana/sugestoes', '/api/semana/estado', '/api/%6Eoticias', '/api/estado']) {
    const r = await pedirReal(c, { cookie: dir });
    assert.equal(r.status, 403, c);
    assert.equal(r.j.erro, 'O seu perfil vê só as Aprovações técnicas.');
  }
  assert.equal((await pedirReal('/api/aprovacoes', { cookie: dir })).status, 200);
  // o operador não gera a semana nem atualiza as notícias
  for (const c of ['/api/semana/gerar', '/api/noticias/atualizar']) assert.equal((await pedirReal(c, { metodo: 'POST', cookie: op, corpo: {} })).status, 403, c);
  // sem sessão: o caminho torto é 400 antes de tudo; a rota livre também pelo canônico
  assert.equal((await pedirReal('/api//auth/estado')).status, 400);
  assert.equal((await pedirReal('/api/auth/%65stado')).status, 200);
  assert.equal((await pedirReal('/api/usuarios')).status, 401);
  // recusa com o corpo ainda chegando fecha a conexão
  const cortado = await pedirReal('/api//usuarios', { metodo: 'POST', cookie: op, cabecalhos: { 'content-length': '100000', 'content-type': 'application/json' }, parcial: '{"a":' });
  assert.equal(cortado.status, 400);
  assert.equal(cortado.h.connection, 'close');
  const semPerfil = await pedirReal('/api/usuarios', { metodo: 'POST', cookie: op, cabecalhos: { 'content-length': '100000', 'content-type': 'application/json' }, parcial: '{"a":' });
  assert.equal(semPerfil.status, 403);
  assert.equal(semPerfil.h.connection, 'close');
  // PIN: rota livre (link desconhecido = 400 com linkInvalido), mesmo pra quem já tem sessão
  const pin = await pedirReal('/api/auth/pin', { metodo: 'POST', cookie: dir, corpo: { token: 'x'.repeat(43), pin: '1225' } });
  assert.equal(pin.status, 400);
  assert.equal(pin.j.linkInvalido, true);
});

// a limpeza só depois do último await do topo (no Windows, o arquivo do servidor que acabou de sair pode demorar a soltar)
after(() => rmSync(raiz, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));
