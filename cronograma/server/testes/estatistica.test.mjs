// Testes de server/estatistica.mjs (node --test). Rodar: npm run testar
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  mediana, media, quantil, mad, zModificado, ehOutlier, log2Razao, meta2x, nivelDeScore, razao, fatorDeScore,
  priorBeta, taxaEB, wilsonInferior, rotuloEvidencia, efeitoTag, interpolarIdade, msDe, diaBrasilia, horaBrasilia,
  diaSemanaBrasilia, inicioDoDia, somarDias, diasEntre, semanaIso, intervaloSemana, somarSemanas, semanaDe,
  pct, pct01, vezes, n0, segundos, listaPt, dataCurta, slug, reais, offsetMinutos,
} from '../estatistica.mjs';

const TRACO = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);

test('mediana, média, quantil e MAD ignoram o que não é número', () => {
  assert.equal(mediana([3, 1, 2]), 2);
  assert.equal(mediana([4, 1, 2, 3]), 2.5);
  assert.equal(mediana([]), null);
  assert.equal(mediana([null, undefined, NaN, 5]), 5);
  assert.equal(media([1, 2, 3, null]), 2);
  assert.equal(quantil([1, 2, 3, 4], 0.5), 2.5);
  assert.equal(quantil([1, 2, 3, 4], 0), 1);
  assert.equal(quantil([1, 2, 3, 4], 1), 4);
  assert.equal(mad([1, 1, 2, 2, 4, 6, 9]), 1);
});

test('z modificado marca o viral e não quebra com MAD zero', () => {
  const xs = [100, 110, 95, 105, 98, 102, 5000];
  assert.ok(ehOutlier(5000, xs));
  assert.ok(!ehOutlier(105, xs));
  assert.equal(zModificado(5, [5, 5, 5]), null);
});

test('log2Razao: razão pura com base >= 10, suavizada abaixo', () => {
  assert.equal(log2Razao(950, 475), 1);
  assert.equal(log2Razao(475, 475), 0);
  assert.equal(log2Razao(1, 0), 1);
  assert.equal(log2Razao(0, 0), 0);
  assert.ok(log2Razao(0, 475) < -8);
  assert.equal(log2Razao(null, 3), null);
  assert.equal(log2Razao(3, -1), null);
});

test('meta2x é o menor valor com score 1', () => {
  for (const base of [0, 0.5, 1, 2.5, 5, 9.5, 10, 12.5, 475]) {
    const m = meta2x(base);
    assert.ok(Math.abs(log2Razao(m, base) - 1) < 1e-9, `base ${base} meta ${m}`);
  }
  assert.equal(meta2x(475), 950);
  assert.equal(meta2x(0), 1);
  assert.equal(meta2x(null), null);
});

test('nível: 1,5× ou mais é acima; 1/1,5 ou menos é abaixo', () => {
  assert.equal(nivelDeScore(Math.log2(1.5)), 'acima');
  assert.equal(nivelDeScore(Math.log2(1.49)), 'normal');
  assert.equal(nivelDeScore(Math.log2(1 / 1.5)), 'abaixo');
  assert.equal(nivelDeScore(null), null);
  assert.equal(razao(3, 0), null);
  assert.equal(fatorDeScore(1), 2);
});

test('prior beta e taxa encolhida', () => {
  const pares = [{ eventos: 3, n: 600 }, { eventos: 0, n: 130 }, { eventos: 5, n: 590 }, { eventos: 0, n: 1000 }, { eventos: 3, n: 330 }];
  const p = priorBeta(pares);
  assert.ok(p.alfa > 0 && p.beta > 0);
  const t = taxaEB(1, 10, p);
  assert.ok(t < 1 / 10, 'um evento em 10 encolhe pra baixo, perto da taxa da conta');
  const fraco = priorBeta([]);
  assert.ok(fraco.alfa > 0 && fraco.beta > 0);
  assert.equal(taxaEB(null, 10, p), null);
});

test('prior beta desconta o ruído binomial: com alcance pequeno a taxa encolhe de verdade', () => {
  // o cenário da revisão: 10 carrosséis com alcance 50. A variância observada (0,000404) é quase toda ruído
  // de amostragem (0,014 × 0,986 / 50 = 0,000276); sem o desconto a força saía 33 e 3 em 50 ficava em 4,2%
  const pares = [0, 1, 0, 2, 0, 0, 1, 0, 3, 0].map((eventos) => ({ eventos, n: 50 }));
  const p = priorBeta(pares);
  const forca = p.alfa + p.beta;
  assert.ok(Math.abs(forca - 106.91) < 0.05, `força ${forca}`);
  assert.ok(Math.abs(p.alfa / forca - 0.014) < 1e-12, 'a média do prior segue a média das taxas');
  const t = taxaEB(3, 50, p);
  assert.ok(Math.abs(t - 0.02866) < 0.0001, `3 em 50 encolhe pra perto de 2,9% (${t})`);
  // variação toda de ruído (ou menor que ele): a força vai pro teto
  const iguais = priorBeta([{ eventos: 1, n: 100 }, { eventos: 1, n: 100 }, { eventos: 1, n: 100 }]);
  assert.ok(Math.abs(iguais.alfa + iguais.beta - 200) < 1e-9);
  const soRuido = priorBeta([{ eventos: 0, n: 20 }, { eventos: 1, n: 20 }, { eventos: 0, n: 20 }, { eventos: 1, n: 20 }]);
  assert.ok(Math.abs(soRuido.alfa + soRuido.beta - 200) < 1e-9);
  // alcance grande e variação real grande: o ruído quase não pesa (27,2 sem o desconto)
  const espalhadas = priorBeta([{ eventos: 10, n: 10_000 }, { eventos: 300, n: 10_000 }, { eventos: 900, n: 10_000 }]);
  assert.ok(Math.abs(espalhadas.alfa + espalhadas.beta - 27.26) < 0.05, `força ${espalhadas.alfa + espalhadas.beta}`);
  // os limites de 2 a 200 continuam
  const extremas = priorBeta([{ eventos: 0, n: 1000 }, { eventos: 1000, n: 1000 }, { eventos: 0, n: 1000 }]);
  assert.ok(Math.abs(extremas.alfa + extremas.beta - 2) < 1e-9);
});

test('Wilson premia amostra grande', () => {
  assert.ok(wilsonInferior(30, 300) > wilsonInferior(1, 10));
  assert.equal(wilsonInferior(1, 0), null);
});

test('efeito de tag encolhe e rotula a evidência', () => {
  const forte = efeitoTag([1.2, 1, 1.4, 0.9, 1.1, 1.3], [-0.2, 0, 0.1, -0.3]);
  assert.equal(forte.n, 6);
  assert.equal(forte.evidencia, 'forte');
  assert.ok(forte.efeito < forte.bruto);
  const um = efeitoTag([2], [0, 0.1]);
  assert.equal(um.evidencia, 'insuficiente');
  const vazio = efeitoTag([], [1]);
  assert.equal(vazio.efeito, null);
  assert.equal(vazio.evidencia, 'insuficiente');
  const negativo = efeitoTag([-1, -1.2, -0.8], [0.2, 0.3]);
  assert.ok(negativo.efeito < 0);
  assert.equal(negativo.consistencia, 1);
  assert.equal(rotuloEvidencia({ n: 3, efeito: 0.3, consistencia: 0.67 }), 'moderada');
  assert.equal(rotuloEvidencia({ n: 2, efeito: -0.25, consistencia: 0 }), 'fraca');
});

test('interpolação por idade', () => {
  const l = [{ idadeH: 24, views: 100 }, { idadeH: 72, views: 300 }, { idadeH: 200, views: 460 }];
  assert.equal(interpolarIdade(l, 'views', 48), 200);
  assert.equal(interpolarIdade(l, 'views', 24), 100);
  assert.ok(Math.abs(interpolarIdade(l, 'views', 168) - 420) < 1e-9);
  assert.equal(interpolarIdade([{ idadeH: 300, views: 5 }], 'views', 168), null);
  assert.equal(interpolarIdade([{ idadeH: 170, views: 5 }], 'views', 168), 5);
  assert.equal(interpolarIdade([{ idadeH: 2, views: 5 }], 'views', 168), null);
  assert.equal(interpolarIdade([], 'views', 168), null);
});

test('datas de Brasília e semana ISO', () => {
  assert.equal(msDe('2026-09-09T15:12:25+0000'), Date.UTC(2026, 8, 9, 15, 12, 25));
  assert.equal(diaBrasilia('2026-09-10T02:00:00+0000'), '2026-09-09');
  assert.equal(horaBrasilia('2026-09-10T02:00:00+0000'), 23);
  assert.equal(diaSemanaBrasilia('2026-09-30T12:00:00+0000'), 3);
  assert.equal(offsetMinutos('America/Sao_Paulo', Date.UTC(2026, 8, 30, 12)), -180);
  assert.equal(inicioDoDia('2026-09-30'), Date.UTC(2026, 8, 30, 3));
  assert.equal(somarDias('2026-09-30', 2), '2026-10-02');
  assert.equal(somarDias('2026-01-01', -1), '2025-12-31');
  assert.equal(diasEntre('2026-09-28', '2026-10-04'), 6);
  assert.equal(semanaIso('2026-09-30'), '2026-W40');
  assert.equal(semanaIso('2026-01-01'), '2026-W01');
  assert.equal(semanaIso('2025-12-29'), '2026-W01');
  assert.equal(semanaIso('2027-01-01'), '2026-W53');
  assert.deepEqual(intervaloSemana('2026-W40'), { inicio: '2026-09-28', fim: '2026-10-04' });
  assert.deepEqual(intervaloSemana('2026-W01'), { inicio: '2025-12-29', fim: '2026-01-04' });
  assert.equal(somarSemanas('2026-W40', -1), '2026-W39');
  assert.equal(semanaDe('2026-10-05T01:00:00+0000'), '2026-W40');
});

test('texto em pt-BR, sem travessão', () => {
  assert.equal(pct(45.5), '45,5%');
  assert.equal(pct(64), '64%');
  assert.equal(pct01(0.315), '31,5%');
  assert.equal(pct(63.30275, { casas: 0 }), '63%');
  assert.equal(vezes(1.4), '1,4×');
  assert.equal(vezes(12.3), '12×');
  assert.equal(vezes(null), 'sem dado');
  assert.equal(n0(1301), '1.301');
  assert.equal(segundos(7051), '7,1s');
  assert.equal(listaPt(['a', 'b', 'c']), 'a, b e c');
  assert.equal(listaPt(['a']), 'a');
  assert.equal(dataCurta('2026-09-09'), '09/09');
  assert.equal(slug('Mão na mão!'), 'mao-na-mao');
  for (const s of [pct(1), vezes(0.05), reais(150), listaPt(['x', 'y'])]) assert.ok(!TRACO.test(s));
});

test('zero travessão no módulo e neste teste', () => {
  for (const f of ['estatistica.mjs', 'testes/estatistica.test.mjs']) {
    assert.ok(!TRACO.test(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')), f);
  }
});
