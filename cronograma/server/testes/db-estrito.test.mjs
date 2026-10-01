// Testes de lerJsonEstrito (server/db.mjs) numa pasta de dados temporária. Rodar: npm run testar
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const pasta = mkdtempSync(path.join(os.tmpdir(), 'cronograma-estrito-'));
process.env.CRONOGRAMA_DATA = pasta;
const { lerJsonEstrito } = await import('../db.mjs');

test('arquivo ausente ou vazio vira o padrão', async () => {
  assert.deepEqual(await lerJsonEstrito('nao-existe.json', { versao: 1 }), { versao: 1 });
  writeFileSync(path.join(pasta, 'vazio.json'), '  \n');
  assert.deepEqual(await lerJsonEstrito('vazio.json', { ok: true }), { ok: true });
});

test('JSON válido é lido', async () => {
  writeFileSync(path.join(pasta, 'bom.json'), JSON.stringify({ a: 1 }));
  assert.deepEqual(await lerJsonEstrito('bom.json', null), { a: 1 });
});

test('JSON quebrado lança 503 e guarda uma cópia ao lado, sem virar vazio', async () => {
  writeFileSync(path.join(pasta, 'quebrado.json'), '{"a": 1,<<<<<<< HEAD');
  await assert.rejects(() => lerJsonEstrito('quebrado.json', {}), (e) => e.status === 503 && /quebrado/.test(e.message));
  assert.ok(readdirSync(pasta).some((n) => n.startsWith('quebrado.quebrado-') && n.endsWith('.json')));
});

test('o mesmo conteúdo quebrado lido de novo não gera outra cópia; conteúdo novo gera', async () => {
  const copias = () => readdirSync(pasta).filter((n) => n.startsWith('quebrado.quebrado-')).length;
  const antes = copias();
  await assert.rejects(() => lerJsonEstrito('quebrado.json', {}), (e) => e.status === 503 && e.message.includes('quebrado.quebrado-'));
  await assert.rejects(() => lerJsonEstrito('quebrado.json', {}), (e) => e.status === 503);
  assert.equal(copias(), antes);
  // nome de cópia com milissegundo no nome: espera um pouco pra não repetir o nome
  await new Promise((r) => setTimeout(r, 5));
  writeFileSync(path.join(pasta, 'quebrado.json'), '{"b": 2,');
  await assert.rejects(() => lerJsonEstrito('quebrado.json', {}), (e) => e.status === 503);
  assert.equal(copias(), antes + 1);
  rmSync(pasta, { recursive: true, force: true });
});
