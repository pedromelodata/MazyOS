// Testes da conferência do Ateliê (atelie.mjs) nas regras de 22/10/2026 (Pedro): "colaborador, nunca funcionário"
// (barra no texto público e sugere a troca na mesma concordância; produção não conta; o verbo "funcionaria" e a
// "funcionalidade" passam), o zero travessão com a família inteira de traços e o hífen solto no lugar dele (hífen
// colado passa), a P39 que segue barrando e o bloco de regras que vai pra toda IA (base-contabil.mjs). Os traços entram
// por código, pra nenhum aparecer no fonte. Não lê o banco. Rodar: npm run testar
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conferir, textoConferencia, trocarFuncionario, temFuncionario } from '../atelie.mjs';
import { blocoBaseContabil, REGRAS_PALAVRA } from '../base-contabil.mjs';

const ch = (n) => String.fromCharCode(n);
const regra = (qa, id) => qa.itens.find((i) => i.id === id);

test('funcionário vira colaborador na mesma concordância (gênero, número e caixa)', () => {
  const casos = [
    ['Até 2 funcionários', 'Até 2 colaboradores'],
    ['Se você tem funcionário', 'Se você tem colaborador'],
    ['quem tem funcionário', 'quem tem colaborador'],
    ['a funcionária do salão', 'a colaboradora do salão'],
    ['as funcionárias', 'as colaboradoras'],
    ['Funcionário do mês', 'Colaborador do mês'],
    ['1 FUNCIONÁRIO NO MEI', '1 COLABORADOR NO MEI'],
    ['funcionario sem acento', 'colaborador sem acento'],
    ['o app funcionaria bem', 'o app funcionaria bem'],
    ['funcionalidade nova', 'funcionalidade nova'],
  ];
  for (const [antes, depois] of casos) assert.equal(trocarFuncionario(antes), depois, antes);
  assert.equal(temFuncionario('O app funcionaria melhor'), false, 'o verbo sem acento não é o substantivo');
  assert.equal(temFuncionario('Mais funcionários'), true);
});

test('funcionário no texto público barra, com a troca sugerida; no texto de produção não conta', async () => {
  const qa = await conferir({
    carrossel: { capa: { titulo: 'Se você tem funcionário, esse post é pra você', visual: 'Capa só com texto' }, slides: [{ titulo: '2. Até 2 funcionários', texto: 'O MEI vai poder contratar até 2 pessoas.' }] },
    legenda: 'Manda pra quem tem funcionárias 👇',
    fontes: ['F051'],
  });
  const r = regra(qa, 'colaborador');
  assert.equal(r.nivel, 'bloqueante');
  assert.equal(r.ok, false);
  assert.equal(qa.bloqueia, true);
  assert.deepEqual(r.achados.map((a) => a.onde), ['Capa', 'Slide 2', 'Legenda']);
  assert.match(r.achados[0].sugestao, /Se você tem colaborador, esse post/);
  assert.match(r.achados[1].sugestao, /Até 2 colaboradores/);
  assert.match(r.achados[2].sugestao, /quem tem colaboradoras/);
  assert.match(textoConferencia(qa), /\(fica: "Se você tem colaborador, esse post é pra você"\)/, 'a IA lê a troca');

  const producao = await conferir({ estatico: { headline: 'Seu time em dia', visual: 'Foto de funcionário no balcão' } });
  assert.equal(regra(producao, 'colaborador').ok, true, 'o visual (produção) não vai pro ar como texto');
  const limpo = await conferir({ estatico: { headline: 'Até 2 colaboradores no MEI' }, fontes: ['F051'] });
  assert.equal(regra(limpo, 'colaborador').ok, true);
});

test('zero travessão: a família de traços e o hífen solto no lugar dele barram; hífen colado passa', async () => {
  const barram = [
    `Abrir empresa ${ch(0x2014)} sem cartório`,
    `Abrir empresa ${ch(0x2013)} sem cartório`,
    `Abrir empresa ${ch(0x2015)} sem cartório`,
    `Abrir empresa ${ch(0x2012)} sem cartório`,
    `Abrir empresa ${ch(0x2212)} sem cartório`,
    'Abrir empresa - sem cartório',
    'Abrir empresa -- sem cartório',
    'Abrir empresa\n- sem cartório',
    'Abrir empresa -',
  ];
  for (const h of barram) {
    const qa = await conferir({ estatico: { headline: h } });
    assert.equal(regra(qa, 'travessao').ok, false, JSON.stringify(h));
    assert.equal(qa.bloqueia, true, JSON.stringify(h));
  }
  for (const h of ['Escala 6x1 e e-CNPJ', 'Vídeo de 30-35s', 'Pré-lançamento', 'Queda de -5% no mês']) {
    const qa = await conferir({ estatico: { headline: h } });
    assert.equal(regra(qa, 'travessao').ok, true, h);
  }
  const visual = await conferir({ estatico: { headline: 'Tudo pelo app', visual: 'Léo - acenando' } });
  assert.equal(regra(visual, 'travessao').ok, false, 'o travessão vale também no texto de produção (desenho)');
});

test('a P39 segue barrando (o escritório, a Legalize Group, o Mauro e os 22 anos)', async () => {
  for (const t of ['22 anos de escritório e um app novo', 'A evolução da Legalize Group', 'O Mauro explica']) {
    const qa = await conferir({ legenda: t });
    assert.equal(regra(qa, 'p39').ok, false, t);
  }
  const qa = await conferir({ legenda: 'Um app novo: 10/11. A origem da Legalizaí revelando a data', fontes: ['data do app: decisão do Pedro, 14/10/2026'] });
  assert.equal(regra(qa, 'p39').ok, true);
});

test('o bloco de regras que vai pra toda IA diz colaborador, o hífen solto e a P39', () => {
  const bloco = blocoBaseContabil();
  assert.ok(bloco.includes(REGRAS_PALAVRA));
  assert.match(REGRAS_PALAVRA, /Colaborador, nunca "funcionário"/);
  assert.match(REGRAS_PALAVRA, /Até 2 colaboradores/);
  assert.match(REGRAS_PALAVRA, /hífen solto/);
  assert.match(REGRAS_PALAVRA, /P39 vale em tudo/);
  assert.ok(!new RegExp(`[${ch(0x2012)}-${ch(0x2015)}${ch(0x2212)}]`).test(REGRAS_PALAVRA), 'sem travessão no bloco');
});
