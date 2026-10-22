// Testes da arte do estúdio nas Aprovações técnicas (22/10, Pedro): a arte exportada e anexada na peça ou nos stories
// (artes, gravado pelo estudio.mjs) vai na lista da aprovação só com o que a tela precisa (id, design, página, formato,
// quando e quem), o que não é exportação fica de fora e o Diretor contábil recebe a arte da peça que ele vê.
// O banco de verdade (data/) não é lido. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-artes-'));
const dados = path.join(raiz, 'data');
process.env.CRONOGRAMA_DATA = dados;
mkdirSync(dados, { recursive: true });
writeFileSync(path.join(dados, 'estilos.json'), '{}');

const naEtapaDoDiretor = { estado: 'pendente', etapa: 'diretor', rodada: 1, enviadoEm: '2026-10-22T10:00:00.000Z', gerentes: { aprovaram: [] }, conversa: [] };
const arte = (id, pagina, formato = 'png') => ({ id, docId: 'est_teste', pagina, formato, url: `/api/estudio/exportacoes/${id}/arquivo`, em: '2026-10-22T12:00:00.000Z', por: 'Pedro Maia', versaoDoc: 3 });
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({
  schemaVersion: 2,
  pilares: [{ id: 13, nome: 'Documentação em dia', bloco: 'Conversão', status: 'ativo' }],
  reels: [{
    id: 'reel_art', ideia: 'Peça com arte', data: '2099-01-10', peca: 'carrossel', status: 'roteiro', aprovacao: naEtapaDoDiretor,
    carrossel: { capa: { titulo: 'Capa', texto: '' }, slides: [], final: { titulo: '', texto: '' } },
    artes: [arte('exp_pag2', 2), arte('exp_pag1', 1), { id: '../fora', formato: 'png' }, 'texto solto', null],
  }],
  stories: [{
    id: 'sto_art', data: '2099-01-11', objetivo: 'engajamento', pilar: 13, tema: 'Story com arte', quadros: [], status: 'ideia',
    aprovacao: naEtapaDoDiretor, artes: [arte('exp_sto', 'todas', 'pdf')],
  }],
}));
const conta = (id, usuario, nome, papel) => ({ id, usuario, nome, papel, criadoEm: '2026-01-01T00:00:00.000Z', trocarSenha: false });
const CONTAS = [
  conta('usr_adm', 'pedro', 'Pedro Melo', 'admin'),
  conta('usr_g1', 'pedromaia', 'Pedro Maia', 'gerente'),
  conta('usr_dir', 'diretor', 'Diretor', 'diretor'),
];
writeFileSync(path.join(dados, 'usuarios.json'), JSON.stringify(CONTAS));

const aprovacoes = await import('../aprovacoes.mjs');

after(() => rmSync(raiz, { recursive: true, force: true }));

test('a peça na aprovação leva a arte do estúdio só com o que a tela precisa', async () => {
  const l = await aprovacoes.listar({ usuario: CONTAS[0] });
  const r = l.pendentes.find((x) => x.id === 'reel_art');
  assert.ok(r, 'a peça está nas pendentes');
  assert.deepEqual(r.artes.map((a) => a.id), ['exp_pag2', 'exp_pag1']);
  assert.deepEqual(Object.keys(r.artes[0]).sort(), ['docId', 'em', 'formato', 'id', 'pagina', 'por']);
  assert.equal(r.artes[1].pagina, 1);
});

test('os stories na aprovação também levam a arte', async () => {
  const l = await aprovacoes.listar({ usuario: CONTAS[1] });
  const s = l.pendentes.find((x) => x.id === 'sto_art');
  assert.ok(s, 'os stories estão nas pendentes');
  assert.deepEqual(s.artes, [{ id: 'exp_sto', docId: 'est_teste', pagina: 'todas', formato: 'pdf', em: '2026-10-22T12:00:00.000Z', por: 'Pedro Maia' }]);
});

test('o Diretor contábil recebe a arte da peça que está na etapa dele', async () => {
  const l = await aprovacoes.listar({ usuario: CONTAS[2] });
  assert.deepEqual(l.pendentes.map((x) => x.id).sort(), ['reel_art', 'sto_art']);
  assert.equal(l.pendentes.find((x) => x.id === 'reel_art').artes.length, 2);
});
