// Testes da lista espremida num slide do carrossel (listas-carrossel.mjs, 26/10/2026, Pedro: "tem que ter um slide
// explicativo para cada um"): o que conta como lista, o que não conta (preço, data, número solto) e as páginas com a
// lista aberta. Rodar: npm run testar
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { itensDeLista, slidesComLista, paginasAbrindoListas, itensPrometidos, promessaSemSlides } from '../listas-carrossel.mjs';

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
  // sem lista e sem número na capa: a conta de sempre (capa, os slides e o fim), com o slide vazio contando
  const semNumero = { titulo: 'A dor de quem tem empresa' };
  assert.equal(paginasAbrindoListas([semNumero, { titulo: 'Um' }, {}, { titulo: 'Fim' }]), 4);
  assert.equal(paginasAbrindoListas([semNumero, { titulo: 'Fim' }]), 2);
  // a capa "As 5 dores" promete 5: no mínimo 5 slides de item (Pedro, 26/10)
  assert.equal(paginasAbrindoListas([capa, { titulo: 'Fim' }]), 7);
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

// 26/10 (Pedro: "se o carrossel for de 5 coisas, deve ter no mínimo 5 [slides] e um no final com um CTA")
test('promessa: o número de coisas no começo da capa ou da ideia', () => {
  for (const [t, n] of [
    ['5 sinais de que é hora de trocar de contador', 5],
    ['"5 sinais de que é hora de trocar de contador"', 5],
    ['As 5 dores de quem tem empresa', 5],
    ['3 coisas que te disseram sobre abrir empresa e não são verdade', 3],
    ['Os 7 erros de quem abre o primeiro CNPJ', 7],
    ['Cinco sinais de que o seu contador sumiu', 5],
    ['Três mitos sobre o MEI', 3],
    ['10 dúvidas de quem vai abrir empresa', 10],
  ]) assert.equal(itensPrometidos(t), n, t);
  for (const t of [
    '7 dias pra mudar de ideia',
    '12 meses de fidelidade',
    'Nos 3 primeiros meses, para quem entra na lista',
    'Dia 10/11, a parte chata muda de dono.',
    'R$ 99 por mês',
    'Até 2 colaboradores',
    '2 coisas que você precisa saber',
    '15 dicas pra quem tem MEI',
    'Abrir empresa exige cartório?',
    'O que vem no plano da ME: 5 coisas',
    '',
    null,
  ]) assert.equal(itensPrometidos(t), 0, String(t));
});

test('a promessa pede no mínimo N slides de item, mesmo sem os itens escritos (o caso da VPS)', () => {
  const vazio = { titulo: '', texto: '' };
  // a peça "5 sinais" com a capa, o fim e nada escrito: a capa, 5 slides e o fim
  assert.equal(paginasAbrindoListas([vazio, vazio], { promessa: '"5 sinais de que é hora de trocar de contador"' }), 7);
  assert.deepEqual(promessaSemSlides([vazio, vazio], { promessa: '5 sinais de que é hora de trocar de contador' }), { prometidos: 5, entregues: 0 });
  // a capa promete e o meio tem 1 slide: ainda faltam 4
  const capa = { titulo: '5 sinais de que é hora de trocar de contador' };
  assert.equal(paginasAbrindoListas([capa, { titulo: 'Ele some' }, { titulo: 'Bateu algum?' }]), 7);
  assert.deepEqual(promessaSemSlides([capa, { titulo: 'Ele some' }, { titulo: 'Bateu algum?' }]), { prometidos: 5, entregues: 1 });
  // cumprida: 5 slides do meio, ou mais (um de abertura)
  const cinco = Array.from({ length: 5 }, (_, i) => ({ titulo: `Sinal ${i + 1}` }));
  assert.equal(paginasAbrindoListas([capa, ...cinco, { titulo: 'Fim' }]), 7);
  assert.equal(promessaSemSlides([capa, ...cinco, { titulo: 'Fim' }]), null);
  assert.equal(paginasAbrindoListas([capa, { titulo: 'Antes' }, ...cinco, { titulo: 'Fim' }]), 8);
  // sem promessa: a conta de sempre
  assert.equal(promessaSemSlides([{ titulo: 'Capa' }, { titulo: 'Fim' }]), null);
});

test('o front também faz a conta da promessa igual ao servidor', () => {
  for (const t of ['5 sinais de que é hora de trocar de contador', '"Cinco sinais"', '7 dias pra mudar de ideia', 'As 3 coisas', '']) {
    assert.equal(FRONT.itensPrometidos(t), itensPrometidos(t), t);
  }
  const casos = [
    [{ capa: { titulo: '' }, slides: [], final: { titulo: '' } }, '"5 sinais de que é hora de trocar de contador"'],
    [{ capa: { titulo: '5 sinais de que é hora de trocar de contador' }, slides: [{ titulo: 'Um' }], final: { titulo: 'Fim' } }, ''],
    [{ capa: { titulo: 'Capa' }, slides: [{ texto: PRINT }], final: { titulo: 'Fim' } }, 'As 3 coisas'],
  ];
  for (const [ca, promessa] of casos) {
    assert.equal(FRONT.paginasDoCarrossel(ca, { promessa }), paginasAbrindoListas([ca.capa, ...ca.slides, ca.final], { promessa }), JSON.stringify(ca));
  }
});
