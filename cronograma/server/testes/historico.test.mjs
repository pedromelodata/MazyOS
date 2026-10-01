// Testes do histórico por idade das mídias (leitura, poda e interpolação: instagram-motor.mjs, usado por
// historico.mjs). Rodar: npm run testar. As partes puras rodam sem disco; o arquivo ilegível (historico.mjs com
// lerJsonEstrito) roda numa pasta temporária (CRONOGRAMA_DATA), nunca em data/
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  leituraDoItem, faixaDaIdade, podar, juntarLeitura, valorNaIdade, formaHistorico, TETO_LEITURAS, CAMPOS_LEITURA,
} from '../instagram-motor.mjs';

const PUB = Date.UTC(2026, 8, 1, 12); // publicado em 01/09/2026, 9h de Brasília
const emH = (h) => new Date(PUB + h * 3_600_000).toISOString();
const leitura = (h, views = Math.round(h * 10)) => ({ em: emH(h), idadeH: h, views });
function serie(de, ate, passo) {
  const xs = [];
  for (let h = de; h <= ate + 1e-9; h += passo) xs.push(leitura(Math.round(h * 100) / 100));
  return xs;
}
const idades = (ls) => ls.map((l) => l.idadeH);
const item = (extra = {}) => ({ midiaId: '17900000000000001', tipo: 'REELS', timestamp: '2026-09-01T12:00:00+0000', views: 100, reach: 80, saved: null, likes: 5, ...extra });

test('leitura do item: idade em horas e só os campos com número', () => {
  const l = leituraDoItem(item({ bioLinkClicks: undefined, caseId: 'case_x', relativo: 1.2 }), emH(30.5));
  assert.equal(l.em, emH(30.5));
  assert.equal(l.idadeH, 30.5);
  assert.equal(l.views, 100);
  assert.equal(l.reach, 80);
  assert.equal(l.likes, 5);
  assert.ok(!('saved' in l), 'sem dado fica fora');
  for (const k of Object.keys(l)) assert.ok(['em', 'idadeH', ...CAMPOS_LEITURA].includes(k), k);
  assert.equal(leituraDoItem(item({ timestamp: null }), emH(1)), null);
  assert.equal(leituraDoItem({ timestamp: '2026-09-01T12:00:00+0000', views: null }, emH(1)), null);
  assert.equal(leituraDoItem(item(), 'não é data'), null);
  // relógio da máquina um pouco atrás da Meta: idade 0, nunca negativa
  assert.equal(leituraDoItem(item(), emH(-0.5)).idadeH, 0);
});

test('janelas da poda por idade', () => {
  assert.equal(faixaDaIdade(0), null);
  assert.equal(faixaDaIdade(72), null);
  assert.equal(faixaDaIdade(72.01), '12h:1');
  assert.equal(faixaDaIdade(84), '12h:1');
  assert.equal(faixaDaIdade(84.5), '12h:2');
  assert.equal(faixaDaIdade(336), '12h:22');
  assert.equal(faixaDaIdade(336.5), '1d:1');
  assert.equal(faixaDaIdade(1440), '1d:46');
  assert.equal(faixaDaIdade(1440.1), '7d:1');
  assert.equal(faixaDaIdade(1608), '7d:1');
  assert.equal(faixaDaIdade(1608.1), '7d:2');
  assert.equal(faixaDaIdade(null), null);
});

test('poda: tudo até 72h, 1 por 12h até 14 dias, 1 por dia até 60, 1 por semana depois', () => {
  const todas = serie(0, 1944, 3); // de 3 em 3 horas por 81 dias
  const fica = podar(todas);
  const ate72 = idades(fica).filter((h) => h <= 72);
  const ate14d = idades(fica).filter((h) => h > 72 && h <= 336);
  const ate60d = idades(fica).filter((h) => h > 336 && h <= 1440);
  const depois = idades(fica).filter((h) => h > 1440);
  assert.equal(ate72.length, 25);
  // a mais nova de cada janela fica
  assert.deepEqual(ate14d, Array.from({ length: 22 }, (_, i) => 84 + 12 * i));
  assert.deepEqual(ate60d, Array.from({ length: 46 }, (_, i) => 360 + 24 * i));
  assert.deepEqual(depois, [1608, 1776, 1944]);
  assert.equal(fica.length, 25 + 22 + 46 + 3);
  // em ordem de idade, sem repetir
  assert.deepEqual(idades(fica), [...idades(fica)].sort((a, b) => a - b));
});

test('poda: a leitura nova substitui a anterior da mesma janela, e o mesmo instante conta uma vez', () => {
  assert.deepEqual(idades(podar([leitura(80), leitura(83)])), [83]);
  assert.deepEqual(idades(podar([leitura(83), leitura(80)])), [83]);
  assert.deepEqual(idades(podar([leitura(80), leitura(85)])), [80, 85]);
  const dup = podar([{ ...leitura(10), views: 1 }, { ...leitura(10), views: 2 }]);
  assert.equal(dup.length, 1);
  assert.equal(dup[0].views, 2);
  assert.deepEqual(podar([null, 'x', { idadeH: 'y' }, leitura(5)]).length, 1);
  assert.deepEqual(podar(undefined), []);
});

test('poda: rodar de novo não muda, e uma por vez dá o mesmo que todas juntas', () => {
  const todas = serie(0, 2400, 3);
  const uma = podar(todas);
  assert.deepEqual(podar(uma), uma);
  let aos = [];
  for (const l of todas) aos = podar([...aos, l]);
  assert.deepEqual(aos, uma);
});

test('poda: teto de 200 por mídia', () => {
  // sincronização a cada 12 minutos nas primeiras 60h: a faixa de 72h fica com 1 por hora (a mais nova)
  const densa = podar(serie(0, 59.8, 0.2));
  assert.equal(densa.length, 60);
  assert.equal(densa.at(-1).idadeH, 59.8);
  assert.deepEqual(idades(densa).slice(0, 3), [0.8, 1.8, 2.8]);
  // quase 4 anos de leituras semanais: saem as semanais mais antigas; o começo e a mais nova ficam
  const semanas = Array.from({ length: 200 }, (_, i) => leitura(1440 + 168 * (i + 1)));
  const longa = podar([...serie(0, 1440, 3), ...semanas]);
  assert.equal(longa.length, TETO_LEITURAS);
  assert.equal(idades(longa).filter((h) => h <= 72).length, 25);
  assert.equal(idades(longa).filter((h) => h > 72 && h <= 1440).length, 22 + 46);
  assert.equal(longa.at(-1).idadeH, 1440 + 168 * 200);
  assert.equal(idades(longa).filter((h) => h > 1440)[0], 1440 + 168 * 94);
});

test('juntar leitura na entrada da mídia', () => {
  const a = juntarLeitura(undefined, item(), emH(24));
  assert.equal(a.publicadoEm, new Date(PUB).toISOString());
  assert.equal(a.tipo, 'REELS');
  assert.deepEqual(idades(a.leituras), [24]);
  const b = juntarLeitura(a, item({ views: 150 }), emH(48));
  assert.deepEqual(idades(b.leituras), [24, 48]);
  // a mesma sincronização de novo troca a leitura, não duplica
  const c = juntarLeitura(b, item({ views: 160 }), emH(48));
  assert.equal(c.leituras.length, 2);
  assert.equal(c.leituras[1].views, 160);
  // item sem número nenhum não mexe na entrada
  assert.equal(juntarLeitura(c, { timestamp: '2026-09-01T12:00:00+0000', tipo: 'REELS' }, emH(50)), c);
  assert.equal(juntarLeitura(undefined, { timestamp: null, views: 3 }, emH(50)), null);
  // tipo desconhecido não apaga o que já tinha
  assert.equal(juntarLeitura(c, item({ tipo: undefined }), emH(60)).tipo, 'REELS');
});

test('valor na idade usa a interpolação por idade', () => {
  const midia = { publicadoEm: new Date(PUB).toISOString(), tipo: 'REELS', leituras: [leitura(150, 100), leitura(180, 160)] };
  assert.ok(Math.abs(valorNaIdade(midia, 'views', 168) - 136) < 1e-9);
  assert.equal(valorNaIdade(midia, 'views', 150), 100);
  assert.equal(valorNaIdade(midia, 'views', 24), null);
  assert.equal(valorNaIdade(midia, 'bioLinkClicks', 168), null);
  assert.equal(valorNaIdade(null, 'views', 168), null);
  assert.equal(valorNaIdade({ leituras: [] }, 'views', 168), null);
});

test('forma do arquivo: só id numérico, leitura com idade, versão 1', () => {
  const vazio = { versao: 1, midias: {} };
  for (const bruto of [null, undefined, [], 'x', 3, { midias: [] }, { midias: null }]) assert.deepEqual(formaHistorico(bruto), vazio);
  const bruto = JSON.parse(`{ "versao": 1, "midias": {
    "17900000000000001": { "publicadoEm": "2026-09-01T12:00:00.000Z", "tipo": "REELS", "leituras": [ { "em": "x", "idadeH": 24, "views": 5 }, { "em": "y", "idadeH": "48" }, null, 7 ] },
    "17900000000000002": { "leituras": "não é lista" },
    "__proto__": { "leituras": [] },
    "abc": { "leituras": [] }
  } }`);
  const f = formaHistorico(bruto);
  assert.deepEqual(Object.keys(f.midias), ['17900000000000001']);
  assert.deepEqual(f.midias['17900000000000001'], { publicadoEm: '2026-09-01T12:00:00.000Z', tipo: 'REELS', leituras: [{ em: 'x', idadeH: 24, views: 5 }] });
  assert.equal(Object.getPrototypeOf(f.midias), Object.prototype);
  assert.deepEqual(formaHistorico({ midias: { 1: { leituras: [] } } }).midias, { 1: { publicadoEm: null, tipo: null, leituras: [] } });
});

// ---------- historico.mjs numa pasta temporária ----------

const pasta = mkdtempSync(path.join(os.tmpdir(), 'cronograma-historico-teste-'));
process.env.CRONOGRAMA_DATA = pasta;
after(() => rmSync(pasta, { recursive: true, force: true }));
const ARQ = path.join(pasta, 'historico-midias.json');
const QUEBRADO = '{"versao": 1, "midias": {"17900000000000001": {"leituras": [<<<<<<< HEAD';
const e503 = (e) => e.status === 503 && /historico-midias\.json/.test(e.message);

test('arquivo ilegível: ler, registrar e todas lançam 503, nada vai pro cache e nada é gravado por cima', async () => {
  const historico = await import('../historico.mjs?ilegivel');
  writeFileSync(ARQ, QUEBRADO);
  await assert.rejects(() => historico.ler(), e503);
  await assert.rejects(() => historico.registrar([item()], emH(24)), e503);
  await assert.rejects(() => historico.todas(), e503);
  await assert.rejects(() => historico.leiturasDe('17900000000000001'), e503);
  // a sincronização (registrar) não regravou o arquivo com só a leitura nova: continua o que estava
  assert.equal(readFileSync(ARQ, 'utf8'), QUEBRADO);
  assert.ok(readdirSync(pasta).some((n) => n.startsWith('historico-midias.quebrado-')), 'a cópia do arquivo quebrado fica ao lado');
  // a falha não ficou no cache: consertado o arquivo, a próxima chamada lê
  const bom = { versao: 1, midias: { '17900000000000001': { publicadoEm: '2026-09-01T12:00:00.000Z', tipo: 'REELS', leituras: [leitura(24, 240)] } } };
  writeFileSync(ARQ, JSON.stringify(bom));
  assert.deepEqual((await historico.leiturasDe('17900000000000001')).map((l) => l.idadeH), [24]);
  // e a gravação seguinte junta com o que estava, sem perder a série
  assert.equal(await historico.registrar([item({ views: 480 })], emH(48)), 1);
  const gravado = JSON.parse(readFileSync(ARQ, 'utf8'));
  assert.deepEqual(gravado.midias['17900000000000001'].leituras.map((l) => [l.idadeH, l.views]), [[24, 240], [48, 480]]);
});

test('primeira carga: chamadas juntas recebem o mesmo objeto (nenhuma leitura some)', async () => {
  const historico = await import('../historico.mjs?junto');
  writeFileSync(ARQ, JSON.stringify({ versao: 1, midias: { '17900000000000001': { tipo: 'REELS', leituras: [leitura(24, 240)] } } }));
  const [a, b] = await Promise.all([historico.ler(), historico.ler()]);
  assert.equal(a, b);
  // o registrar e a leitura do Diagnóstico ao mesmo tempo, logo depois do boot: a leitura nova fica
  const outro = await import('../historico.mjs?junto2');
  const [n] = await Promise.all([outro.registrar([item({ views: 480 })], emH(48)), outro.todas()]);
  assert.equal(n, 1);
  assert.deepEqual((await outro.leiturasDe('17900000000000001')).map((l) => l.idadeH), [24, 48]);
  assert.deepEqual(JSON.parse(readFileSync(ARQ, 'utf8')).midias['17900000000000001'].leituras.map((l) => l.idadeH), [24, 48]);
});
