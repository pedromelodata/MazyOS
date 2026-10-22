// Testes do arrastar a peça do cronograma pro Banco de Ideias (banco-ideias.mjs, 22/10, Pedro): a peça vira ideia com
// o texto que tinha, a ideia de origem volta a ficar livre, a peça postada não sai, o "voltar" devolve a peça inteira
// (com a aprovação e o story do dia religado) e a tela não consegue forjar a peça guardada.
// O banco de verdade (data/) não é lido. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-banco-'));
const dados = path.join(raiz, 'data');
process.env.CRONOGRAMA_DATA = dados;
mkdirSync(dados, { recursive: true });
writeFileSync(path.join(dados, 'estilos.json'), '{}');

const peca = (id, extra = {}) => ({
  id, ideia: `Peça ${id}`, tema: 'Tema da peça', motivo: 'Motivo da peça', data: '2099-01-10', peca: 'carrossel', status: 'roteiro', tipo: 'ensino',
  roteiro: { hook: '', textoTela: '', cenas: [], desenvolvimento: '', cta: '' }, legenda: 'Legenda',
  carrossel: { capa: { titulo: 'Capa do carrossel', texto: '' }, slides: [{ titulo: 'Slide 1', texto: 'Texto 1' }], final: { titulo: 'Fim', texto: 'Salva esse post' } },
  fontes: ['F093 · Mês sem faturamento'], notas: 'Nota da peça', ideiaId: null, ...extra,
});
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({
  schemaVersion: 2,
  pilares: [{ id: 13, nome: 'Documentação em dia', bloco: 'Conversão', status: 'ativo' }],
  reels: [
    peca('reel_solta', { aprovacao: { estado: 'aprovado', etapa: 'diretor', rodada: 1, conversa: [] } }),
    peca('reel_do_banco', { ideiaId: 'ide_origem' }),
    peca('reel_postada', { status: 'publicado' }),
  ],
  ideias: [{ id: 'ide_origem', titulo: 'Ideia de origem', descricao: 'A ideia que virou peça', tipo: 'viralizacao', reelId: 'reel_do_banco', notas: '' }],
  stories: [{ id: 'sto_dia', data: '2099-01-10', objetivo: 'engajamento', pilar: 13, tema: 'Story do dia', pecaDoDia: 'reel_solta', quadros: [], status: 'ideia' }],
}));

const banco = await import('../banco-ideias.mjs');
const { carregar } = await import('../db.mjs');
const { limparIdeia } = await import('../validar.mjs');

test('peça solta vira ideia nova com o texto, sai do calendário e solta o story do dia', async () => {
  const { ideia } = await banco.paraBanco('reel_solta', 'Pedro Melo');
  const db = await carregar();
  assert.equal(db.reels.some((r) => r.id === 'reel_solta'), false);
  assert.equal(ideia.titulo, 'Peça reel_solta');
  assert.equal(ideia.origem, 'cronograma');
  assert.equal(ideia.roteiroBase.hook, 'Capa do carrossel');
  assert.match(ideia.roteiroBase.narracao, /Slide 1: Texto 1/);
  assert.equal(ideia.roteiroBase.cta, 'Salva esse post');
  assert.deepEqual(ideia.fontes, ['F093 · Mês sem faturamento']);
  assert.match(ideia.notas, /Veio do cronograma \(10\/01, carrossel\)/);
  assert.equal(db.stories.find((s) => s.id === 'sto_dia').pecaDoDia, null);
  assert.equal(ideia.pecaOriginal.aprovacao.estado, 'aprovado', 'a aprovação fica guardada');
});

test('voltar devolve a peça inteira no dia de antes, tira a ideia que nasceu dela e religa o story', async () => {
  const db0 = await carregar();
  const ide = db0.ideias.find((i) => i.pecaOriginal?.id === 'reel_solta');
  const { peca: volta, ideiaRemovida } = await banco.voltar(ide.id, {}, 'Pedro Melo');
  const db = await carregar();
  assert.equal(volta.id, 'reel_solta');
  assert.equal(volta.data, '2099-01-10');
  assert.equal(volta.aprovacao.estado, 'aprovado');
  assert.equal(ideiaRemovida, ide.id);
  assert.equal(db.ideias.some((i) => i.id === ide.id), false);
  assert.equal(db.stories.find((s) => s.id === 'sto_dia').pecaDoDia, 'reel_solta');
});

test('peça que veio de uma ideia do banco devolve a mesma ideia livre e, na volta, liga de novo', async () => {
  const { ideia } = await banco.paraBanco('reel_do_banco', 'Thiago');
  assert.equal(ideia.id, 'ide_origem');
  assert.equal(ideia.reelId, null);
  const { peca: volta, ideiaRemovida } = await banco.voltar('ide_origem', { data: '2099-02-01' }, 'Thiago');
  const db = await carregar();
  assert.equal(ideiaRemovida, null);
  assert.equal(volta.data, '2099-02-01');
  assert.equal(volta.ideiaId, 'ide_origem');
  assert.equal(db.ideias.find((i) => i.id === 'ide_origem').reelId, volta.id);
  assert.equal(db.ideias.find((i) => i.id === 'ide_origem').pecaOriginal, undefined);
});

test('peça postada não sai e data torta na volta é recusada', async () => {
  await assert.rejects(banco.paraBanco('reel_postada', 'Thiago'), (e) => e.status === 409);
  await assert.rejects(banco.paraBanco('reel_nao_existe', 'Thiago'), (e) => e.status === 404);
  const { ideia } = await banco.paraBanco('reel_solta', 'Thiago');
  await assert.rejects(banco.voltar(ideia.id, { data: '2099-02-30' }, 'Thiago'), (e) => e.status === 400);
  await assert.rejects(banco.voltar('ide_origem', {}, 'Thiago'), (e) => e.status === 409, 'ideia sem peça guardada');
});

test('a tela não grava pecaOriginal numa ideia', () => {
  const limpo = limparIdeia({ titulo: 'x', pecaOriginal: { id: 'reel_forjada', aprovacao: { estado: 'aprovado' } } });
  assert.equal('pecaOriginal' in limpo, false);
});

after(() => rmSync(raiz, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }));
