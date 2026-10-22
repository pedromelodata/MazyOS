// Testes da aprovação dos stories do dia (22/10, Pedro: "Libere também pedir autorização de Stories a serem feitos"):
//  - mandar (precisa de tema; dia já postado = 409; o que já está pendente = 409) e a forma de tela dos stories
//  - as 2 etapas (os gerentes, cada um conta; depois um Diretor contábil fecha), o Diretor fora da etapa (404)
//  - o ajuste com a edição do texto dos quadros e da CTA (o visual e a interação ficam), na etapa dos gerentes, na do
//    diretor e depois de aprovado (só a conta com ajustaDepoisDeAprovada); a próxima ida recomeça nos gerentes
//  - texto mexido depois de aprovado vira 'alterado'; no meio da aprovação volta pros gerentes
//  - o regerar e o voltar do gerador da semana soltam a aprovação dos stories
//  - 22/10 (achados): o pendente que foi postado não é reprovado; o Reprovado com edição não tira quadro
//  - o servidor de verdade (node server/server.mjs) numa porta alta, com uma cópia de dados temporária e sem agenda: o PUT
//    dos stories não grava a aprovação vinda da tela, vira 'alterado', o /api/estado manda a aprovação normalizada e
//    marcar como postado segue sem pedir aprovação
// O banco de verdade (data/) não é lido. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-stories-aprovacao-'));
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
const peca = (id, extra = {}) => ({
  id, ideia: `Peça ${id}`, data: '2099-01-10', peca: 'reel', status: 'ideia', legenda: 'Legenda de teste',
  roteiro: { hook: 'Gancho', textoTela: '', cenas: [], desenvolvimento: 'Meio', cta: 'Fim' }, aprovacao: null, ...extra,
});
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({
  schemaVersion: 2, pilares: PILARES, campanhas: [{ id: 'cmp_prelancamento', nome: 'Pré-lançamento' }],
  config: { volumeSemanal: { reels: 3, feeds: 5, storiesTemas: 5 }, mixBlocos: { Afeto: 20, Educação: 30, Diferencial: 25, Conversão: 25 }, tetoVenda: { foraDaPromocao: 20, naPromocao: 30 } },
  reels: [peca('reel_feed', { data: '2099-01-12' })],
  stories: [
    dia('sto_um', '2099-01-11', { tema: 'Enquete: o preço que você vê' }),
    dia('sto_dois', '2099-01-13'),
    dia('sto_semtema', '2099-01-14', { tema: '' }),
    dia('sto_postado', '2026-10-01', { status: 'publicado' }),
    dia('sto_regerar', '2026-11-10', { origem: 'gerador-semana', pilar: 5 }),
  ],
}));
const conta = (id, usuario, nome, papel, criadoEm, extra = {}) => ({ id, usuario, nome, papel, criadoEm, trocarSenha: false, ...extra });
const CONTAS = [
  conta('usr_adm', 'pedro', 'Pedro Melo', 'admin', '2026-01-05T00:00:00.000Z'),
  conta('usr_g1', 'pedromaia', 'Pedro Maia', 'gerente', '2026-01-01T00:00:00.000Z'),
  conta('usr_g2', 'pedropuntel', 'Pedro Puntel', 'gerente', '2026-01-02T00:00:00.000Z'),
  conta('usr_op', 'thiago', 'Thiago', 'operador', '2026-01-06T00:00:00.000Z'),
  conta('usr_dir', 'diretor', 'Diretor Senha', 'diretor', '2026-01-07T00:00:00.000Z'),
  conta('usr_pin', 'diretorpin', 'Diretor Pin', 'diretor', '2026-01-08T00:00:00.000Z', { acesso: 'pin', ajustaDepoisDeAprovada: true }),
];
writeFileSync(path.join(dados, 'usuarios.json'), JSON.stringify(CONTAS));

const auth = await import('../auth.mjs');
const aprovacoes = await import('../aprovacoes.mjs');
const ger = await import('../gerador-semana.mjs');
const { carregar } = await import('../db.mjs');
const { MSG_SEM_IA } = await import('../noticias.mjs');

const TRACO = String.fromCharCode(0x2014);

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
const stories = async (id) => (await carregar()).stories.find((s) => s.id === id);

// ---------- mandar ----------

test('stories: mandar pra aprovação pede tema e vai na forma de tela dos stories', async () => {
  const semTema = await acao('sto_semtema', 'enviar', 'thiago', { explicacao: 'Base (F051)' });
  assert.equal(semTema.status, 400);
  assert.match(semTema.j.erro, /tema/);
  assert.equal((await acao('sto_um', 'enviar', 'thiago', { explicacao: '' })).status, 400, 'sem explicação');
  assert.equal((await acao('sto_naoexiste', 'enviar', 'thiago', { explicacao: 'x' })).j.erro, 'Esse story não existe mais.');

  const r = await acao('sto_um', 'enviar', 'thiago', { explicacao: 'Por que este post: o preço trava.\nBase técnica:\n• Preço fechado (F051)' });
  assert.equal(r.status, 200, JSON.stringify(r.j));
  const t = r.j;
  assert.equal(t.id, 'sto_um');
  assert.equal(t.stories, true);
  assert.equal(t.peca, 'stories');
  assert.equal(t.ideia, 'Story · Enquete: o preço que você vê');
  assert.equal(t.tema, 'Enquete: o preço que você vê');
  assert.equal(t.data, '2099-01-11');
  assert.equal(t.objetivo, 'engajamento');
  assert.equal(t.bloco, 'Educação');
  assert.deepEqual(t.pilar, { id: 4, nome: 'Pilar 4' });
  assert.equal(t.pilarTexto, '');
  assert.equal(t.motivo, 'Dúvida que trava a abertura');
  assert.deepEqual(t.quadros, QUADROS);
  assert.equal(t.cta, 'Responde a enquete');
  assert.deepEqual(t.fontes, ['F051 · 07-OBRIGACOES-MENSAIS §5']);
  assert.equal(t.status, 'ideia');
  assert.deepEqual(t.gerentesNecessarios, [{ id: 'usr_g1', nome: 'Pedro Maia' }, { id: 'usr_g2', nome: 'Pedro Puntel' }]);
  assert.equal(t.aprovacao.estado, 'pendente');
  assert.equal(t.aprovacao.etapa, 'gerentes');
  assert.deepEqual(t.aprovacao.gerentes.aprovaram, []);
  assert.equal(t.aprovacao.enviadoPor, 'Thiago');
  assert.equal(t.aprovacao.rodada, 1);
  assert.deepEqual([t.aprovacao.conversa.at(-1).tipo, t.aprovacao.conversa.at(-1).papel], ['envio', 'operador']);
  // o estado fica no próprio dia de stories (db.stories[].aprovacao)
  assert.equal((await stories('sto_um')).aprovacao.estado, 'pendente');

  const deNovo = await acao('sto_um', 'enviar', 'thiago', { explicacao: 'x' });
  assert.equal(deNovo.status, 409);
  assert.equal(deNovo.j.erro, 'Esse story já está esperando a aprovação.');
  // na lista do time, junto das peças, pela data
  await acao('reel_feed', 'enviar', 'thiago', { explicacao: 'Base (F051)' });
  const lista = (await pedir('/api/aprovacoes', { quem: 'thiago' })).j;
  assert.deepEqual(ids(lista.pendentes), ['sto_um', 'reel_feed']);
  assert.equal(lista.pendentes[1].peca, 'reel', 'a peça do feed segue igual');
  assert.equal(lista.pendentes[1].stories, undefined);
  assert.deepEqual(lista.envios, [], 'os stories não entram nos envios de arquivos');
});

test('stories: dia já postado não vai pra aprovação (409)', async () => {
  const r = await acao('sto_postado', 'enviar', 'thiago', { explicacao: 'Base' });
  assert.equal(r.status, 409);
  assert.equal(r.j.erro, 'Esse story já foi postado.');
  assert.equal((await stories('sto_postado')).aprovacao, undefined);
  await assert.rejects(aprovacoes.enviarPeloSistema('sto_postado', 'Base'), (e) => e.status === 409);
});

// ---------- etapas ----------

test('stories: os 2 gerentes aprovam cada um, depois um diretor fecha; o Diretor só vê a etapa dele', async () => {
  const id = 'sto_um';
  // com os gerentes: o Diretor não vê, não aprova, não conversa
  assert.equal((await pedir(`/api/aprovacoes/${id}`, { quem: 'diretor' })).status, 404);
  assert.equal((await pedir(`/api/aprovacoes/${id}`, { quem: 'diretor' })).j.erro, 'Esse story não existe mais.');
  assert.ok(!ids((await pedir('/api/aprovacoes', { quem: 'diretor' })).j.pendentes).includes(id));
  assert.equal((await acao(id, 'aprovar', 'diretor')).status, 404);
  assert.equal((await acao(id, 'mensagem', 'diretor', { texto: 'oi' })).status, 404);
  assert.equal((await acao(id, 'aprovar', 'thiago')).status, 403, 'operador não aprova');
  assert.equal((await acao(id, 'aprovar', 'pedro')).status, 403, 'admin não aprova');

  const g1 = await acao(id, 'aprovar', 'pedromaia');
  assert.equal(g1.status, 200);
  assert.equal(g1.j.aprovacao.etapa, 'gerentes');
  assert.deepEqual(g1.j.aprovacao.gerentes.aprovaram.map((x) => x.id), ['usr_g1']);
  assert.match(g1.j.aprovacao.conversa.at(-1).texto, /Falta Pedro Puntel/);
  const repetido = await acao(id, 'aprovar', 'pedromaia');
  assert.equal(repetido.status, 409);
  assert.match(repetido.j.erro, /Você já aprovou/);

  const g2 = await acao(id, 'aprovar', 'pedropuntel');
  assert.equal(g2.j.aprovacao.etapa, 'diretor');
  assert.equal(g2.j.aprovacao.estado, 'pendente');
  const tarde = await acao(id, 'aprovar', 'pedromaia');
  assert.equal(tarde.status, 409);
  assert.equal(tarde.j.erro, 'Esse story já passou pelos gerentes: agora está com o Diretor contábil.');

  // com o Diretor: ele vê, conversa e fecha
  assert.ok(ids((await pedir('/api/aprovacoes', { quem: 'diretor' })).j.pendentes).includes(id));
  const visto = await pedir(`/api/aprovacoes/${id}`, { quem: 'diretor' });
  assert.equal(visto.status, 200);
  assert.equal(visto.j.ideia, 'Story · Enquete: o preço que você vê');
  assert.equal((await acao(id, 'mensagem', 'diretor', { texto: 'Conferindo a fonte' })).status, 200);
  const fechado = await acao(id, 'aprovar', 'diretor', { mensagem: 'Base confere' });
  assert.equal(fechado.status, 200);
  assert.equal(fechado.j.aprovacao.estado, 'aprovado');
  assert.equal(fechado.j.aprovacao.decididoPor, 'Diretor Senha');
  assert.equal(fechado.j.aprovacao.conversa.at(-1).etapa, 'diretor');
  assert.equal((await acao(id, 'aprovar', 'diretorpin')).j.erro, 'Esse story não está esperando aprovação.');
  // decidido pelo diretor: aparece nas Sugestões (recentes) dele
  assert.ok(ids((await pedir('/api/aprovacoes', { quem: 'diretor' })).j.recentes).includes(id));
  assert.equal((await stories(id)).aprovacao.estado, 'aprovado');
});

test('stories: ajuste depois de aprovado só com a permissão, editando o texto dos quadros e a CTA', async () => {
  const id = 'sto_um';
  const semPermissao = await acao(id, 'ajustar', 'diretor', { mensagem: 'Trocar a CTA' });
  assert.equal(semPermissao.status, 409);
  assert.equal(semPermissao.j.erro, 'Esse story já foi aprovado. Depois da aprovação, só o Diretor com a permissão de reprovar o aprovado mexe nele.');
  assert.equal((await acao(id, 'ajustar', 'pedromaia', { mensagem: 'x' })).status, 409, 'gerente também não');

  const r = await acao(id, 'ajustar', 'diretorpin', {
    mensagem: 'Deixei a pergunta mais direta',
    conteudo: {
      quadros: [{ texto: `Quanto custa abrir a ME ${TRACO} de verdade?`, visual: 'trocado pelo diretor', interacao: 'trocada' }, {}],
      cta: 'Vota na enquete',
    },
  });
  assert.equal(r.status, 200, JSON.stringify(r.j));
  assert.equal(r.j.aprovacao.estado, 'ajuste');
  assert.equal(r.j.aprovacao.etapa, 'diretor');
  assert.equal(r.j.aprovacao.tipoAjuste, 'editado');
  assert.equal(r.j.aprovacao.decididoPor, 'Diretor Pin');
  assert.deepEqual(r.j.aprovacao.conversa.at(-1).mudou, ['quadros', 'CTA']);
  assert.equal(r.j.aprovacao.conversa.at(-1).texto, 'Deixei a pergunta mais direta');
  // só o texto muda; o travessão vira vírgula; o visual e a interação ficam
  assert.equal(r.j.quadros[0].texto, 'Quanto custa abrir a ME, de verdade?');
  assert.equal(r.j.quadros[0].visual, 'mesa com papelada');
  assert.equal(r.j.quadros[0].interacao, '');
  assert.deepEqual(r.j.quadros[1], QUADROS[1]);
  assert.equal(r.j.cta, 'Vota na enquete');
  const s = await stories(id);
  assert.equal(s.quadros[0].texto, 'Quanto custa abrir a ME, de verdade?');
  assert.equal(s.atualizadoPor, 'Diretor Pin');
  // ajustado pelo diretor: o Diretor segue vendo (Sugestões)
  assert.equal((await pedir(`/api/aprovacoes/${id}`, { quem: 'diretor' })).status, 200);

  // a próxima ida recomeça nos gerentes, com as aprovações zeradas
  const deNovo = await acao(id, 'enviar', 'thiago', { explicacao: 'Base (F051)' });
  assert.equal(deNovo.j.aprovacao.etapa, 'gerentes');
  assert.deepEqual(deNovo.j.aprovacao.gerentes.aprovaram, []);
  assert.equal(deNovo.j.aprovacao.rodada, 2);
  // o gerente ajusta na etapa dele (só a CTA), e o texto longo demais é recusado
  assert.equal((await acao(id, 'ajustar', 'pedromaia', { mensagem: 'CTA longa', conteudo: { cta: 'x'.repeat(301) } })).status, 400);
  assert.equal((await acao(id, 'ajustar', 'pedromaia', {})).status, 400, 'sem mensagem e sem mudança');
  // 22/10 (Pedro): o Reprovado pede a mensagem escrita, mesmo com o texto editado
  const semMsg = await acao(id, 'ajustar', 'pedromaia', { conteudo: { cta: 'Responde na caixinha' } });
  assert.equal(semMsg.status, 400);
  assert.equal(semMsg.j.erro, 'Escreva o que ajustar.');
  assert.equal((await stories(id)).cta, 'Vota na enquete', 'sem a mensagem, nada muda');
  const g = await acao(id, 'ajustar', 'pedromaia', { mensagem: 'Troquei a CTA pela caixinha', conteudo: { cta: 'Responde na caixinha' } });
  assert.equal(g.status, 200);
  assert.equal(g.j.aprovacao.estado, 'ajuste');
  assert.equal(g.j.aprovacao.etapa, 'gerentes');
  assert.equal(g.j.aprovacao.tipoAjuste, 'editado');
  assert.deepEqual(g.j.aprovacao.conversa.at(-1).mudou, ['CTA']);
  assert.equal(g.j.aprovacao.conversa.at(-1).texto, 'Troquei a CTA pela caixinha');
  assert.equal(g.j.cta, 'Responde na caixinha');
  // ajustado pelos gerentes: o Diretor não vê
  assert.equal((await pedir(`/api/aprovacoes/${id}`, { quem: 'diretor' })).status, 404);
  assert.ok(!ids((await pedir('/api/aprovacoes', { quem: 'diretor' })).j.recentes).includes(id));
  // só a mensagem é sugestão
  await acao(id, 'enviar', 'thiago', { explicacao: 'Base (F051)' });
  const so = await acao(id, 'ajustar', 'pedropuntel', { mensagem: 'Falta a fonte do preço' });
  assert.equal(so.j.aprovacao.tipoAjuste, 'sugestao');
  assert.deepEqual(so.j.aprovacao.conversa.at(-1).mudou, []);
});

test('stories: dia postado depois de aprovado não recebe ajuste', async () => {
  const s = await stories('sto_postado');
  s.aprovacao = { estado: 'aprovado', etapa: 'diretor', decididoEm: new Date().toISOString(), conversa: [] };
  const r = await acao('sto_postado', 'ajustar', 'diretorpin', { mensagem: 'x' });
  assert.equal(r.status, 409);
  assert.equal(r.j.erro, 'Esse story já foi postado.');
  delete s.aprovacao;
});

// 22/10 (achado): marcar os stories como postados não pede aprovação e a agenda marca sozinha. O pendente postado não
// é reprovado (nem com a edição do texto), senão ficava preso na bandeira amarela; aprovar segue livre
test('stories: pendente que foi postado não é reprovado (409) e o texto fica; aprovar segue', async () => {
  const db = await carregar();
  db.stories.push(dia('sto_pend_postado', '2099-03-01'));
  const id = 'sto_pend_postado';
  assert.equal((await acao(id, 'enviar', 'thiago', { explicacao: 'Base (F051)' })).status, 200);
  const s = await stories(id);
  s.status = 'publicado';
  for (const corpo of [{ mensagem: 'Trocar a CTA' }, { mensagem: 'Trocar a CTA', conteudo: { cta: 'CTA depois de postado', quadros: [{ texto: 'Texto novo num dia ja postado' }] } }]) {
    const r = await acao(id, 'ajustar', 'pedromaia', corpo);
    assert.equal(r.status, 409, JSON.stringify(corpo));
    assert.equal(r.j.erro, 'Esse story já foi postado.');
  }
  assert.equal(s.cta, 'Responde a enquete');
  assert.deepEqual(s.quadros, QUADROS);
  assert.equal(s.aprovacao.estado, 'pendente');
  // com o diretor também
  await acao(id, 'aprovar', 'pedromaia');
  await acao(id, 'aprovar', 'pedropuntel');
  assert.equal((await acao(id, 'ajustar', 'diretor', { mensagem: 'x' })).status, 409);
  const ok = await acao(id, 'aprovar', 'diretor', { observacao: 'Foi ao ar antes, mas a base confere' });
  assert.equal(ok.status, 200);
  assert.equal(ok.j.aprovacao.estado, 'aprovado');
  assert.equal(ok.j.aprovacao.comObservacao, true);
});

// 22/10 (achado): o texto vazio num quadro sem visual nem interação tirava o quadro inteiro
test('stories: o Reprovado com edição não tira quadro (400 com o número do quadro)', async () => {
  const db = await carregar();
  const quadros = [{ texto: 'A', visual: 'v', interacao: '' }, { texto: 'B', visual: '', interacao: '' }, { texto: 'C', visual: '', interacao: 'caixinha' }];
  db.stories.push(dia('sto_quadro', '2099-03-02', { quadros: structuredClone(quadros) }));
  const id = 'sto_quadro';
  await acao(id, 'enviar', 'thiago', { explicacao: 'Base (F051)' });
  const vazio = await acao(id, 'ajustar', 'pedromaia', { mensagem: 'Tirei o B', conteudo: { quadros: [{ texto: 'A' }, { texto: '  ' }] } });
  assert.equal(vazio.status, 400);
  assert.equal(vazio.j.erro, 'O texto do quadro 2 não pode ficar vazio: ele não tem visual nem interação, e o ajuste não tira quadro.');
  assert.deepEqual((await stories(id)).quadros, quadros);
  assert.equal((await stories(id)).aprovacao.estado, 'pendente');
  // quadro com visual ou interação pode ficar sem texto: segue com os 3 quadros, na mesma ordem
  const ok = await acao(id, 'ajustar', 'pedromaia', { mensagem: 'O visual fala sozinho', conteudo: { quadros: [{ texto: '' }, {}, { texto: '' }] } });
  assert.equal(ok.status, 200, JSON.stringify(ok.j));
  assert.deepEqual(ok.j.quadros, [{ texto: '', visual: 'v', interacao: '' }, quadros[1], { texto: '', visual: '', interacao: 'caixinha' }]);
  assert.deepEqual(ok.j.aprovacao.conversa.at(-1).mudou, ['quadros']);
});

// ---------- o que a aprovação cobre ----------

test('stories: tema, quadros, CTA ou fontes mexidos depois de aprovado viram "alterado"; no meio da aprovação voltam pros gerentes', async () => {
  const s = await stories('sto_dois');
  const aprovar = () => { s.aprovacao = { estado: 'aprovado', etapa: 'diretor', decididoEm: new Date().toISOString(), conversa: [] }; };
  const thiago = CONTAS.find((c) => c.id === 'usr_op');
  // nada mudou (o mesmo texto com espaço, notas e status não contam)
  aprovar();
  let antes = aprovacoes.fotoDaAprovacao(s);
  assert.deepEqual(Object.keys(antes).sort(), ['cta', 'fontes', 'quadros', 'tema']);
  s.cta = ` ${s.cta} `;
  s.notas = 'nota nova';
  s.status = 'pronto';
  assert.equal(aprovacoes.conferirMudancaAprovada(s, antes, thiago), false);
  assert.equal(s.aprovacao.estado, 'aprovado');
  for (const [campo, valor, rotulo, texto] of [
    ['tema', 'Tema trocado', 'tema', /^O texto mudou depois de aprovado/],
    ['quadros', [{ texto: 'Outro quadro', visual: '', interacao: '' }], 'quadros', /^O texto mudou depois de aprovado/],
    ['cta', 'Outra CTA', 'CTA', /^O texto mudou depois de aprovado/],
    ['fontes', ['Outra fonte'], 'fontes', /^O story mudou depois de aprovado/],
  ]) {
    aprovar();
    antes = aprovacoes.fotoDaAprovacao(s);
    s[campo] = valor;
    assert.equal(aprovacoes.conferirMudancaAprovada(s, antes, thiago), true, campo);
    assert.equal(s.aprovacao.estado, 'alterado', campo);
    assert.deepEqual(s.aprovacao.conversa.at(-1).mudou, [rotulo], campo);
    assert.match(s.aprovacao.conversa.at(-1).texto, texto, campo);
    assert.equal(s.aprovacao.conversa.at(-1).autor, 'Thiago');
  }
  // pendente com um gerente aprovado: volta pros gerentes com as aprovações zeradas
  s.aprovacao = { estado: 'pendente', etapa: 'gerentes', gerentes: { aprovaram: [{ id: 'usr_g1', nome: 'Pedro Maia', em: '2026-10-22T10:00:00.000Z' }] }, conversa: [] };
  antes = aprovacoes.fotoDaAprovacao(s);
  s.tema = 'Tema trocado no meio';
  assert.equal(aprovacoes.conferirMudancaAprovada(s, antes, thiago), true);
  assert.equal(s.aprovacao.estado, 'pendente');
  assert.equal(s.aprovacao.etapa, 'gerentes');
  assert.deepEqual(s.aprovacao.gerentes.aprovaram, []);
  assert.match(s.aprovacao.conversa.at(-1).texto, /^O texto mudou durante a aprovação/);
  // a peça do feed segue com a foto e as chaves dela
  assert.ok('legenda' in aprovacoes.fotoDaAprovacao({ id: 'reel_feed', legenda: 'x' }));
  assert.equal(aprovacoes.ehStories('sto_dois'), true);
  assert.equal(aprovacoes.ehStories('reel_x'), false);
  s.aprovacao = null;
});

test('stories: "Escrever com IA" lê o tema, o objetivo, os quadros, a CTA, as fontes e o motivo; sem IA, a mensagem de sempre', async () => {
  const db = await carregar();
  const t = aprovacoes.textoDosStories(db, dia('sto_ia', '2099-01-20', { tema: 'Enquete do preço', objetivo: 'vendas' }));
  for (const trecho of [
    'Título: Story · Enquete do preço', 'Tema: Enquete do preço', 'Objetivo: vendas', 'Pilar: 4 Pilar 4 (bloco Educação)', 'Motivo no calendário: Dúvida que trava a abertura',
    'Quadros:\n1. Sabe quanto custa abrir a ME? | visual: mesa com papelada', '2. Vota aqui: caro ou barato? | visual: app aberto | interação: enquete',
    'CTA: Responde a enquete', 'Fontes dos stories:\nF051 · 07-OBRIGACOES-MENSAIS §5',
  ]) {
    assert.ok(t.includes(trecho), `${trecho}\n---\n${t}`);
  }
  const antes = process.env.CRONOGRAMA_IA;
  process.env.CRONOGRAMA_IA = '0';
  try {
    const r = await acao('sto_dois', 'explicacao', 'thiago');
    assert.equal(r.status, 503);
    assert.ok(r.j.erro.startsWith(MSG_SEM_IA), r.j.erro);
    assert.equal((await acao('sto_naoexiste', 'explicacao', 'thiago')).status, 404);
  } finally {
    if (antes === undefined) delete process.env.CRONOGRAMA_IA;
    else process.env.CRONOGRAMA_IA = antes;
  }
});

// ---------- gerador da semana ----------

test('stories: o regerar e o voltar do gerador da semana soltam a aprovação', async () => {
  const id = 'sto_regerar';
  const mandado = await acao(id, 'enviar', 'thiago', { explicacao: 'Base (F051)' });
  assert.equal(mandado.j.aprovacao.estado, 'pendente');
  const ia = async ({ etapa }) => {
    assert.equal(etapa, 'stories');
    return {
      tema: 'Tema novo regerado: a pasta do dono', objetivo: 'engajamento', pilar: 5, pilarTexto: '', motivo: 'Dúvida comum', angulo: '',
      gatilhoEmocional: 'cansaço da burocracia', gatilhoPsicologico: 'curiosidade', ganchoOrigem: 'G04', excecaoAntiRepeticao: '', mecanica: '',
      quadros: [{ texto: 'Sabe aquela semana corrida?', visual: 'mesa', interacao: '' }, { texto: 'Responde aqui', visual: 'app', interacao: 'caixinha' }],
      cta: 'Responde a caixinha', fontes: [],
    };
  };
  const r = await ger.regerar({ storiesId: id, ia, autor: 'Pedro Maia' });
  assert.equal(r.tema, 'Tema novo regerado: a pasta do dono');
  assert.equal(r.aprovacao.estado, null, 'pendente perde a aprovação');
  assert.equal(r.aprovacao.conversa.at(-1).papel, 'sistema');
  assert.match(r.aprovacao.conversa.at(-1).texto, /regerados por Pedro Maia/);
  // aprovação solta: some da lista e o Diretor não vê
  const lista = (await pedir('/api/aprovacoes', { quem: 'thiago' })).j;
  assert.ok(!ids(lista.pendentes).includes(id));
  assert.ok(!ids(lista.recentes).includes(id));
  // aprovado e depois voltado pra versão anterior: solta também
  await acao(id, 'enviar', 'thiago', { explicacao: 'Base (F051)' });
  await acao(id, 'aprovar', 'pedromaia');
  await acao(id, 'aprovar', 'pedropuntel');
  assert.equal((await acao(id, 'aprovar', 'diretor')).j.aprovacao.estado, 'aprovado');
  const v = await ger.regerar({ storiesId: id, voltar: true, autor: 'Pedro Puntel' });
  assert.equal(v.tema, 'Tema sto_regerar');
  assert.equal(v.aprovacao.estado, null);
  assert.match(v.aprovacao.conversa.at(-1).texto, /Pedro Puntel voltou os stories pra versão anterior/);
  assert.equal((await pedir(`/api/aprovacoes/${id}`, { quem: 'diretor' })).status, 404);
});

// ---------- o servidor de verdade: PUT dos stories e /api/estado ----------

const SENHA = 'senha-de-teste-123';
const SERVER = path.join(import.meta.dirname, '..', 'server.mjs');
let real = null;

async function subirServidorReal() {
  const pasta = path.join(raiz, 'real');
  mkdirSync(pasta, { recursive: true });
  writeFileSync(path.join(pasta, 'estilos.json'), '{}');
  writeFileSync(path.join(pasta, 'db.json'), JSON.stringify({
    schemaVersion: 2, pilares: PILARES, reels: [],
    stories: [
      dia('sto_aprovado', '2099-02-10', { aprovacao: { estado: 'aprovado', etapa: 'diretor', decididoEm: '2026-10-22T10:00:00.000Z', decididoPor: 'Diretor', conversa: [] } }),
      dia('sto_pendente', '2099-02-11', {
        aprovacao: { estado: 'pendente', etapa: 'gerentes', gerentes: { aprovaram: [{ id: 'usr_ger', nome: 'Gerente', em: '2026-10-22T10:00:00.000Z' }, { id: 'usr_saiu', nome: 'Quem saiu', em: '2026-10-22T10:00:00.000Z' }] }, conversa: [] },
      }),
      dia('sto_livre', '2099-02-12'),
    ],
  }));
  const hash = await auth.hashSenha(SENHA);
  writeFileSync(path.join(pasta, 'usuarios.json'), JSON.stringify([
    { id: 'usr_ger', usuario: 'gerente', nome: 'Gerente', hash, papel: 'gerente', criadoEm: '2026-01-01T00:00:00.000Z', trocarSenha: false },
    { id: 'usr_ger2', usuario: 'gerente2', nome: 'Gerente Dois', hash, papel: 'gerente', criadoEm: '2026-01-02T00:00:00.000Z', trocarSenha: false },
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
test('servidor de verdade: o PUT dos stories, o /api/estado e o postado sem aprovação', { timeout: 90_000 }, async () => {
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

  // /api/estado: a aprovação dos stories normalizada (a etapa de agora, só os gerentes de agora em "aprovaram")
  const est = (await pedirReal('/api/estado', { cookie: op })).j;
  const pend = est.stories.find((s) => s.id === 'sto_pendente');
  assert.equal(pend.aprovacao.etapa, 'gerentes');
  assert.deepEqual(pend.aprovacao.gerentes.aprovaram.map((x) => x.id), ['usr_ger']);
  assert.equal(est.stories.find((s) => s.id === 'sto_livre').aprovacao, undefined);
  assert.deepEqual(est.stories.find((s) => s.id === 'sto_aprovado').aprovacao.gerentes, { aprovaram: [] });

  // o PUT não grava a aprovação vinda da tela
  const forjado = await pedirReal('/api/stories/sto_livre', { metodo: 'PUT', cookie: op, corpo: { aprovacao: { estado: 'aprovado', etapa: 'diretor' }, notas: 'nota' } });
  assert.equal(forjado.status, 200, JSON.stringify(forjado.j));
  assert.equal(forjado.j.aprovacao, undefined);
  assert.equal(forjado.j.notas, 'nota');
  const forjado2 = await pedirReal('/api/stories/sto_aprovado', { metodo: 'PUT', cookie: op, corpo: { aprovacao: null } });
  assert.equal(forjado2.j.aprovacao.estado, 'aprovado', 'a tela não apaga a aprovação');

  // texto que não mexe no aprovado (notas) segue aprovado; a CTA mexida vira "alterado"
  assert.equal((await pedirReal('/api/stories/sto_aprovado', { metodo: 'PUT', cookie: op, corpo: { notas: 'só nota' } })).j.aprovacao.estado, 'aprovado');
  const alterado = await pedirReal('/api/stories/sto_aprovado', { metodo: 'PUT', cookie: op, corpo: { cta: 'CTA mexida pelo time' } });
  assert.equal(alterado.status, 200);
  assert.equal(alterado.j.aprovacao.estado, 'alterado');
  assert.equal(alterado.j.aprovacao.etapa, 'diretor');
  assert.deepEqual(alterado.j.aprovacao.conversa.at(-1).mudou, ['CTA']);
  assert.equal(alterado.j.aprovacao.conversa.at(-1).autor, 'Operador');
  // o Diretor vê o "alterado" (decidido na etapa dele) pela rota do sto_...
  const visto = await pedirReal('/api/aprovacoes/sto_aprovado', { cookie: dir });
  assert.equal(visto.status, 200);
  assert.equal(visto.j.stories, true);
  assert.equal(visto.j.aprovacao.estado, 'alterado');
  assert.equal((await pedirReal('/api/stories/sto_aprovado', { cookie: dir })).status, 403, 'o Diretor não chega na rota dos stories');

  // pendente com um gerente aprovado: os quadros mexidos voltam pros gerentes, aprovações zeradas
  const meio = await pedirReal('/api/stories/sto_pendente', { metodo: 'PUT', cookie: op, corpo: { quadros: [{ texto: 'Quadro novo', visual: 'app', interacao: '' }] } });
  assert.equal(meio.j.aprovacao.estado, 'pendente');
  assert.equal(meio.j.aprovacao.etapa, 'gerentes');
  assert.deepEqual(meio.j.aprovacao.gerentes.aprovaram, []);
  assert.deepEqual(meio.j.aprovacao.conversa.at(-1).mudou, ['quadros']);

  // marcar como postado não pede aprovação (nem com a aprovação pendente); depois disso não vai mais pra aprovação
  const postado = await pedirReal('/api/stories/sto_pendente/status', { metodo: 'PUT', cookie: op, corpo: { status: 'publicado' } });
  assert.equal(postado.status, 200);
  assert.equal(postado.j.status, 'publicado');
  assert.equal(postado.j.aprovacao.etapa, 'gerentes', 'a resposta leva a aprovação na forma da tela');
  assert.equal((await pedirReal('/api/stories/sto_livre/status', { metodo: 'PUT', cookie: op, corpo: { status: 'publicado' } })).j.status, 'publicado');
  const tarde = await pedirReal('/api/aprovacoes/sto_livre/enviar', { metodo: 'POST', cookie: op, corpo: { explicacao: 'Base' } });
  assert.equal(tarde.status, 409);
  assert.equal(tarde.j.erro, 'Esse story já foi postado.');
});

// a limpeza só depois do último await do topo (no Windows, o arquivo do servidor que acabou de sair pode demorar a soltar)
after(() => rmSync(raiz, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));
