// Testes da lista espremida num slide do carrossel (listas-carrossel.mjs, 26/10/2026, Pedro: "tem que ter um slide
// explicativo para cada um"): o que conta como lista, o que não conta (preço, data, número solto) e as páginas com a
// lista aberta. Rodar: npm run testar
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { itensDeLista, slidesComLista, paginasAbrindoListas } from '../listas-carrossel.mjs';

const FRONT = await import('../../public/js/estudio/listas.js');

const PRINT = '1. Guia apertada · 2. Nota caçada · 3. Resposta demorada · 4. Só contabilês · 5. Papelada infinita';

test('lista: a numeração de 1 a N, numa linha ou uma por linha, e os marcadores', () => {
  assert.equal(itensDeLista(PRINT), 5, 'a do carrossel do print');
  assert.equal(itensDeLista('Bateu algum?\n1. Guia apertada\n2. Nota caçada\n3. Resposta demorada'), 3);
  assert.equal(itensDeLista('1) Abre o app 2) Confere os dados 3) Assina'), 3, 'com parêntese');
  assert.equal(itensDeLista('• Nota\n• Guia\n• Prazo\n• Certidão'), 4, 'marcador por linha');
  assert.equal(itensDeLista('1.\nGuia apertada\n2.\nNota caçada\n3.\nResposta demorada'), 3, 'número e item em camadas separadas do design');
});

test('lista: preço, data, número solto e lista de 2 não contam', () => {
  for (const t of [
    'ME a R$ 99. Depois, R$ 139.',
    'Dia 10/11. A parte chata muda de dono.',
    'O teto é de R$ 81 mil por ano. Fica de olho no dia 20. Eu aviso antes.',
    'Nos 3 primeiros meses, para quem entra na lista.',
    '1. Guia apertada · 2. Nota caçada',
    '2. Nota caçada · 3. Resposta demorada · 4. Só contabilês',
    'Nota · guia · prazo',
    '',
  ]) assert.equal(itensDeLista(t), 0, t);
  assert.equal(itensDeLista(null), 0);
});

test('slidesComLista: os slides com lista, contando a capa como 1', () => {
  const slides = [{ titulo: 'Qual dessas te pegou?' }, { titulo: 'Bateu algum?', texto: PRINT }, { texto: 'Salva pra quando bater a dúvida.' }];
  assert.deepEqual(slidesComLista(slides), [{ indice: 2, itens: 5 }]);
  assert.deepEqual(slidesComLista([{ titulo: 'Capa' }, { titulo: 'Fim' }]), []);
  assert.deepEqual(slidesComLista(undefined), []);
});

test('paginasAbrindoListas: capa, um slide por item e o fim', () => {
  const capa = { titulo: 'As 5 dores de quem tem empresa' };
  // o print: capa e o fim com a lista inteira (02 / 02) viram 7 páginas
  assert.equal(paginasAbrindoListas([capa, { titulo: 'Bateu algum?', texto: `${PRINT}\nSalva e manda.` }]), 7);
  // a lista num slide do meio: o slide vira os 5 itens
  assert.equal(paginasAbrindoListas([capa, { texto: PRINT }, { titulo: 'Salva pra quando bater a dúvida.' }]), 7);
  // sem lista: a conta de sempre (capa, os slides e o fim), com o slide vazio contando
  assert.equal(paginasAbrindoListas([capa, { titulo: 'Um' }, {}, { titulo: 'Fim' }]), 4);
  assert.equal(paginasAbrindoListas([capa, { titulo: 'Fim' }]), 2);
  // as páginas de um design (os textos de cada página, juntos)
  assert.equal(paginasAbrindoListas(['As 5 dores', `01 / 02\nBateu algum?\n${PRINT}`]), 7);
  assert.equal(paginasAbrindoListas([capa]), 1);
  assert.equal(paginasAbrindoListas(null), 0);
});

test('o front (public/js/estudio/listas.js) faz a mesma conta do servidor', () => {
  const textos = [PRINT, 'Bateu algum?\n1. Guia\n2. Nota\n3. Prazo', '• Nota\n• Guia\n• Prazo', 'ME a R$ 99. Depois, R$ 139.', '1. Guia · 2. Nota', '', null];
  for (const t of textos) assert.equal(FRONT.itensDeLista(t), itensDeLista(t), String(t));
  const carrosseis = [
    { capa: { titulo: 'Capa' }, slides: [], final: { titulo: 'Bateu algum?', texto: PRINT } },
    { capa: { titulo: 'Capa' }, slides: [{ texto: PRINT }, { titulo: 'Outro' }], final: { titulo: 'Fim' } },
    { capa: { titulo: 'Capa' }, slides: [{ titulo: 'Um' }], final: { titulo: 'Fim' } },
    { capa: { titulo: 'Capa' } },
    undefined,
  ];
  for (const ca of carrosseis) {
    const c = ca ?? {};
    assert.equal(FRONT.paginasDoCarrossel(ca), paginasAbrindoListas([c.capa, ...(c.slides ?? []), c.final]), JSON.stringify(ca));
  }
});
