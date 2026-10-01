// Testes de mecanismos.mjs que gravam o arquivo (soltarPeca), numa pasta de dados temporária. Rodar: npm run testar
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const pasta = mkdtempSync(path.join(os.tmpdir(), 'cronograma-teste-soltar-'));
process.env.CRONOGRAMA_DATA = pasta;
process.env.CRONOGRAMA_AGENDA = '0';

const PECA = 'reel_abcd1234';
const OUTRA = 'reel_outra999';
const ligado = (reelId, autor = null) => ({
  reelId, vinculoPor: 'manual', vinculoEm: '2026-09-20T10:00:00.000Z', vinculoAutor: autor, tags: {}, ia: null, manual: null, impulsionado: null,
});
writeFileSync(path.join(pasta, 'mecanismos.json'), JSON.stringify({
  versao: 1,
  midias: {
    '17900000000000001': ligado(PECA, 'Pedro'),
    '17900000000000002': { ...ligado(PECA), manual: { follows: 3, em: '2026-09-25T10:00:00.000Z', autor: 'Pedro' } },
    '17900000000000003': ligado(OUTRA),
  },
}));
const mec = await import('../mecanismos.mjs');

test('peça apagada: soltarPeca solta só os posts dela, zera o vinculoEm e grava no disco', async () => {
  assert.equal(await mec.soltarPeca(PECA), 2);
  const arq = await mec.ler();
  for (const id of ['17900000000000001', '17900000000000002']) {
    const r = arq.midias[id];
    assert.deepEqual([r.reelId, r.vinculoPor, r.vinculoEm, r.vinculoAutor], [null, null, null, null]);
  }
  assert.equal(arq.midias['17900000000000002'].manual.follows, 3, 'os números do app do post ficam');
  assert.equal(arq.midias['17900000000000003'].reelId, OUTRA, 'post de outra peça não muda');
  const disco = JSON.parse(readFileSync(path.join(pasta, 'mecanismos.json'), 'utf8'));
  assert.equal(disco.midias['17900000000000001'].reelId, null);
  assert.equal(disco.midias['17900000000000003'].reelId, OUTRA);
});

test('soltarPeca sem post ligado ou com id inválido não grava nada', async () => {
  assert.equal(await mec.soltarPeca(PECA), 0);
  assert.equal(await mec.soltarPeca('../db'), 0);
  assert.equal(await mec.soltarPeca(null), 0);
  rmSync(pasta, { recursive: true, force: true });
});
