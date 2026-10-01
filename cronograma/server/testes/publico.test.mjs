// Testes de server/publico-motor.mjs (node --test). Rodar: npm run testar
// O motor é puro (só estatistica.mjs): nada de disco nem rede aqui
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseBreakdown, totaisDe, agregarDiario, frasesDemografia, montarDemografia, aderenciaPersonas, frasePersona, frasesPago,
  frasesPostApp, horasPacificoParaBrasilia, mediaOnline, limparPostApp, sugestaoDoPrint, blocoQuem, BLOCOS_QUEM, descoberta,
  crescimento, resumoSeguidores, horariosNossos, fraseHorarios, lerTotaisAnuncio, lerQuebraAnuncio, agregarAnuncios, MINIMO_CELULA,
  pessoasNaBase, visiveisPostApp, semFrasePostApp, visiveisPago, entradaDoBloco, lerContas, textoAprox, janelaDiario,
  erroDoStory, leituraStoryVazia, juntarLeituraStory,
} from '../publico-motor.mjs';
import { reais } from '../estatistica.mjs';

const TRACO = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const semTraco = (frases) => frases.forEach((f) => assert.ok(!TRACO.test(f), `tem travessão: ${f}`));

// resposta da Graph no formato total_value.breakdowns
const resposta = (name, chaves, linhas, total) => ({
  data: [{
    name, period: 'lifetime',
    total_value: { ...(total != null ? { value: total } : {}), breakdowns: [{ dimension_keys: chaves, results: linhas.map(([vals, value]) => ({ dimension_values: vals, value })) }] },
  }],
});

// o cruzamento de teste (base 100): reproduz a frase do exemplo do Pedro na SPEC
const cel = (idade, genero, valor) => ({ idade, genero, valor });
const CRUZ = [
  cel('18-24', 'F', 17), cel('25-34', 'F', 31), cel('35-44', 'F', 12), cel('45-54', 'F', 4),
  cel('18-24', 'M', 4), cel('25-34', 'M', 14), cel('35-44', 'M', 8), cel('45-54', 'M', 6), cel('55-64', 'M', 3),
  cel('25-34', 'U', 1),
];
const CIDADES = [
  { cidade: 'Belo Horizonte, Minas Gerais', valor: 45 }, { cidade: 'Contagem, Minas Gerais', valor: 8 },
  { cidade: 'São Paulo, São Paulo', valor: 6 }, { cidade: 'Rio de Janeiro, Rio de Janeiro', valor: 3 },
];

test('parseBreakdown: uma chave (cidade), com os nossos nomes', () => {
  const r = resposta('follower_demographics', ['city'], [[['Belo Horizonte, Minas Gerais'], 45], [['Contagem, Minas Gerais'], 8]]);
  assert.deepEqual(parseBreakdown(r), [
    { metrica: 'follower_demographics', cidade: 'Belo Horizonte, Minas Gerais', valor: 45 },
    { metrica: 'follower_demographics', cidade: 'Contagem, Minas Gerais', valor: 8 },
  ]);
});

test('parseBreakdown: idade e gênero numa chamada só', () => {
  const r = resposta('engaged_audience_demographics', ['age', 'gender'], [[['25-34', 'F'], 31], [['18-24', 'm'], 4], [['65+', 'U'], 2]]);
  assert.deepEqual(parseBreakdown(r), [
    { metrica: 'engaged_audience_demographics', idade: '25-34', genero: 'F', valor: 31 },
    { metrica: 'engaged_audience_demographics', idade: '18-24', genero: 'M', valor: 4 },
    { metrica: 'engaged_audience_demographics', idade: '65+', genero: 'U', valor: 2 },
  ]);
});

test('parseBreakdown: valor ausente ou quebrado não vira zero; formato antigo em mapa', () => {
  const r = {
    data: [{
      name: 'reach',
      total_value: {
        value: 120,
        breakdowns: [{
          dimension_keys: ['follow_type'],
          results: [
            { dimension_values: ['follower'], value: 30 },
            { dimension_values: ['NON_FOLLOWER'] },
            { dimension_values: ['UNKNOWN'], value: null },
            { dimension_values: ['NON_FOLLOWER', 'extra'], value: 5 },
            { dimension_values: ['NON_FOLLOWER'], value: 'abc' },
          ],
        }],
      },
    }],
  };
  assert.deepEqual(parseBreakdown(r), [{ metrica: 'reach', seguidor: 'FOLLOWER', valor: 30 }]);
  assert.deepEqual(totaisDe(r), { reach: 120 });
  assert.deepEqual(parseBreakdown({}), []);
  assert.deepEqual(parseBreakdown({ data: [{ name: 'x', total_value: { value: 3 } }] }), []);
  assert.deepEqual(parseBreakdown(null), []);
  const antigo = { data: [{ name: 'audience_gender_age', values: [{ value: { 'F.25-34': 10, 'M.18-24': '4', 'U.35-44': 'x' } }] }] };
  assert.deepEqual(parseBreakdown(antigo), [
    { metrica: 'audience_gender_age', genero: 'F', idade: '25-34', valor: 10 },
    { metrica: 'audience_gender_age', genero: 'M', idade: '18-24', valor: 4 },
  ]);
});

test('agregarDiario junta os grupos do dia; grupo que falhou não vira zero', () => {
  const d = agregarDiario({
    'alcance-seguidor': resposta('reach', ['follow_type'], [[['FOLLOWER'], 30], [['NON_FOLLOWER'], 80], [['UNKNOWN'], 10]], 120),
    tipo: {
      data: [
        { name: 'reach', total_value: { value: 110, breakdowns: [{ dimension_keys: ['media_product_type'], results: [{ dimension_values: ['REEL'], value: 90 }, { dimension_values: ['STORY'], value: 20 }] }] } },
        { name: 'likes', total_value: { value: 7 } },
        { name: 'saves', total_value: { value: 2 } },
      ],
    },
    conta: { data: [{ name: 'accounts_engaged', total_value: { value: 15 } }, { name: 'total_interactions', total_value: { value: 12 } }] },
    seguiram: resposta('follows_and_unfollows', ['follow_type'], [[['FOLLOWER'], 3], [['NON_FOLLOWER'], 1]]),
    'views-seguidor': null,
  });
  assert.deepEqual(d.alcance, { seguidores: 30, naoSeguidores: 80, desconhecido: 10, total: 120 });
  assert.deepEqual(d.alcancePorTipo, { REEL: 90, STORY: 20 });
  assert.equal(d.curtidas, 7);
  assert.equal(d.salvamentos, 2);
  assert.equal(d.comentarios, undefined, 'sem dado da API: fica ausente');
  assert.equal(d.contasEngajadas, 15);
  assert.equal(d.interacoes, 12);
  assert.equal(d.seguiram, 3);
  assert.equal(d.deixaram, 1);
  assert.equal(d.views, undefined);
});

test('frasesDemografia com o cruzamento idade e gênero (o exemplo do Pedro)', () => {
  const frases = frasesDemografia({ idadeGenero: CRUZ, cidade: CIDADES }, { fonte: 'seguidores', janela: 'this_month' });
  // gênero e "menos de 35" somam célula oculta (mulheres de 45 a 54, homens de 18 a 24...) junto das visíveis da
  // pirâmide: saem "cerca de", em múltiplo de 5. O segmento de mulheres abaixo de 35 não tem oculta: exato
  assert.deepEqual(frases, [
    'Dos 100 seguidores com dado (30 dias): cerca de 65% são mulheres e cerca de 35% homens.',
    'Cerca de 65% têm menos de 35 anos. O maior grupo é de mulheres de 25 a 34 anos (31%).',
    'Mulheres abaixo de 35 anos são 48% do total. O restante são principalmente homens de 25 a 44 anos (22%) e mulheres de 35 a 44 (12%).',
    '45% estão em Belo Horizonte; depois Contagem (8%) e São Paulo (6%).',
  ]);
  semTraco(frases);
  assert.ok(!frases.some((f) => /Rio de Janeiro/.test(f)), 'cidade com 3 pessoas não vira frase');
});

test('soma com célula oculta junto das visíveis sai "cerca de" (a diferença não devolve a oculta)', () => {
  // 109 seguidores, mulheres de 13 a 17 = 3 (oculta); a pirâmide mostra mulheres de 18 a 24 e de 25 a 34
  const M13 = [cel('13-17', 'F', 3), cel('18-24', 'F', 20), cel('25-34', 'F', 30), cel('35-44', 'F', 15), cel('18-24', 'M', 10), cel('25-34', 'M', 20), cel('35-44', 'M', 11)];
  const frases = frasesDemografia(M13, { fonte: 'seguidores', janela: 'this_month' });
  assert.deepEqual(frases, [
    'Dos 109 seguidores com dado (30 dias): cerca de 60% são mulheres e 38% homens.',
    'Cerca de 75% têm menos de 35 anos. O maior grupo é de mulheres de 25 a 34 anos (28%).',
    'Mulheres abaixo de 35 anos são cerca de 50% do total. O restante são principalmente homens de 25 a 34 anos (18%) e mulheres de 35 a 44 (14%).',
  ]);
  assert.ok(!frases.some((f) => /49%/.test(f)), 'o 49% exato (53 de 109) não aparece');
  // na lista do cartão, o gênero somado com a oculta vai sem contagem e em múltiplo de 5
  const def = BLOCOS_QUEM.find((b) => b.id === 'seguidores');
  const b = blocoQuem(def, [{ id: 'd', em: '2026-09-29T10:00:00.000Z', semana: '2026-W40', metrica: 'seguidores', janela: 'this_month', dimensao: 'idade_genero', itens: M13 }], {});
  assert.deepEqual(b.genero.find((g) => g.id === 'F'), { id: 'F', rotulo: 'Mulheres', valor: null, pct: 60, aproximado: true });
  assert.deepEqual(b.genero.find((g) => g.id === 'M'), { id: 'M', rotulo: 'Homens', valor: 41, pct: 37.6 });
  // persona com oculta dentro: pct em múltiplo de 5, sem contagem, e a frase diz "cerca de"
  const B = aderenciaPersonas(CRUZ).find((p) => p.id === 'B');
  assert.deepEqual([B.pct, B.aproximado, B.valor], [15, true, null]);
  assert.equal(textoAprox(98), 'mais de 95%');
  assert.equal(textoAprox(1.2), 'menos de 5%');
  assert.equal(textoAprox(62.4), 'cerca de 60%');
  semTraco(frases);
});

test('"principalmente" só quando os grupos citados cobrem 60% do restante', () => {
  // restante de 74 espalhado: os 3 maiores (homens de 13 a 34) são 30, menos de 60% dele
  const espalhado = [cel('18-24', 'F', 30), cel('25-34', 'F', 30), cel('13-17', 'M', 10), cel('18-24', 'M', 10), cel('25-34', 'M', 10), cel('35-44', 'M', 9), cel('35-44', 'F', 9), cel('45-54', 'F', 9), cel('45-54', 'M', 9), cel('55-64', 'F', 8)];
  const um = frasesDemografia(espalhado);
  assert.equal(um[2], 'Mulheres abaixo de 35 anos são 45% do total. No restante, o maior grupo é de homens de 13 a 34 anos (22%).');
  // restante quase todo em células ocultas: os visíveis cobrem pouco
  const oculto = [cel('18-24', 'F', 40), cel('25-34', 'F', 30), cel('18-24', 'M', 8), cel('45-54', 'F', 7), cel('55-64', 'M', 6),
    cel('13-17', 'M', 4), cel('25-34', 'M', 4), cel('35-44', 'M', 4), cel('45-54', 'M', 4), cel('35-44', 'F', 4), cel('55-64', 'F', 4), cel('65+', 'F', 4), cel('65+', 'M', 4), cel('25-34', 'U', 3)];
  const varios = frasesDemografia(oculto);
  assert.equal(varios[2], 'Mulheres abaixo de 35 anos são 56% do total. No restante, os maiores grupos são homens de 18 a 24 anos (6%), mulheres de 45 a 54 (6%) e homens de 55 a 64 (5%).');
  assert.ok(![...um, ...varios].some((f) => /principalmente/.test(f)));
  semTraco([...um, ...varios]);
});

test('frasesDemografia sem cruzamento: gênero e idade separados, sem juntar os dois', () => {
  const sep = {
    genero: [{ genero: 'F', valor: 64 }, { genero: 'M', valor: 35 }, { genero: 'U', valor: 1 }],
    idade: [{ idade: '18-24', valor: 21 }, { idade: '25-34', valor: 45 }, { idade: '35-44', valor: 20 }, { idade: '45-54', valor: 10 }, { idade: '55-64', valor: 4 }],
  };
  const frases = frasesDemografia(sep, { fonte: 'engajados', janela: 'this_week' });
  assert.deepEqual(frases, [
    'Das 100 contas engajadas com dado (7 dias): 64% são mulheres e 35% homens.',
    '66% têm menos de 35 anos. A faixa mais comum é de 25 a 34 anos (45%).',
  ]);
  assert.ok(!frases.some((f) => /(mulheres|homens) (de|abaixo) /i.test(f)), 'sem cruzamento não junta gênero e idade');
  semTraco(frases);
});

test('frasesDemografia: célula com menos de 5 pessoas não vira frase', () => {
  const peq = [cel('25-34', 'F', 4), cel('25-34', 'M', 3), cel('35-44', 'F', 3), cel('18-24', 'M', 2)];
  const frases = frasesDemografia(peq, { fonte: 'seguidores' });
  // gênero feito só de células ocultas é um grupo de 5 ou mais: exato. "Menos de 35" junta a faixa de 25 a 34
  // (visível) com a de 18 a 24 (oculta): aproximado
  assert.deepEqual(frases, ['Dos 12 seguidores com dado: 58% são mulheres e 42% homens.', 'Cerca de 75% têm menos de 35 anos.']);
  assert.ok(!frases.some((f) => /maior grupo|restante|abaixo de 35 anos são/.test(f)), 'soma feita só de células ocultas não sai');
  assert.deepEqual(frasesDemografia([cel('25-34', 'F', 3), cel('25-34', 'M', 1)]), [], 'menos de 5 com dado: nada');
  const d = montarDemografia({ idadeGenero: CRUZ });
  assert.equal(d.base, 100);
  assert.equal(d.idade.find((i) => i.faixa === '55-64').oculto, true);
  semTraco(frases);
});

test('blocoQuem: listas só com o visível, ocultos contados, motivo quando não leu', () => {
  const def = BLOCOS_QUEM.find((b) => b.id === 'seguidores');
  const demografia = [
    { id: 'd1', em: '2026-09-28T10:00:00.000Z', semana: '2026-W40', metrica: 'seguidores', janela: 'this_month', dimensao: 'idade_genero', itens: CRUZ, total: 100 },
    { id: 'd2', em: '2026-09-28T10:00:00.000Z', semana: '2026-W40', metrica: 'seguidores', janela: 'this_month', dimensao: 'cidade', itens: CIDADES, total: 62 },
  ];
  const b = blocoQuem(def, demografia, {});
  assert.equal(b.disponivel, true);
  assert.equal(b.base, 100);
  // visível com contagem; somado com célula oculta: sem contagem e em múltiplo de 5
  assert.ok(b.genero.every((g) => (g.aproximado ? g.valor === null && g.pct % 5 === 0 : g.valor >= MINIMO_CELULA)));
  assert.ok(!b.cidades.some((c) => /Rio/.test(c.nome)));
  assert.ok(b.ocultos >= 5);
  const f45 = b.idadeGenero.find((l) => l.faixa === '45-54');
  assert.equal(f45.mulheres, null, 'célula de 4 pessoas fica oculta na pirâmide');
  assert.equal(f45.homens, 6);
  assert.equal(b.frases[0], 'Dos 100 seguidores com dado (30 dias): cerca de 65% são mulheres e cerca de 35% homens.');
  const nada = blocoQuem(BLOCOS_QUEM.find((x) => x.id === 'alcancados-30'), demografia, {});
  assert.equal(nada.disponivel, false);
  assert.match(nada.motivo, /Atualizar agora/);
  const recusado = blocoQuem(BLOCOS_QUEM.find((x) => x.id === 'alcancados-30'), [], { 'demo:alcancados:this_month:age,gender': { ok: false, em: '2026-09-28T10:00:00.000Z', erro: 'vazio' } });
  assert.equal(recusado.motivo, 'A Meta não devolve isso pra esta conta.');
  // engajados 7 dias recusado, 30 dias lido: o motivo olha só a janela do bloco
  const suporte = {
    'demo:engajados:this_month:age,gender': { ok: true, em: 'x' },
    'demo:engajados:this_week:age,gender': { ok: false, em: 'x', erro: 'A Meta recusou o pedido' },
    'demo:engajados:this_week:city': { ok: false, em: 'x', erro: 'A Meta recusou o pedido' },
  };
  const sete = blocoQuem(BLOCOS_QUEM.find((x) => x.id === 'engajados-7'), [], suporte);
  assert.equal(sete.motivo, 'A Meta não devolve isso pra esta conta.');
});

test('cartão de público: idade e gênero de UMA leitura; cidade de outra leitura diz de quando é', () => {
  const foto = (id, em, dimensao, itens, metrica = 'seguidores') => ({ id, em, semana: 'x', metrica, janela: 'this_month', dimensao, itens });
  // gênero e idade de 01/09 (maioria mulheres, 35 ou mais) e o cruzamento de 29/09 (maioria homens abaixo de 35)
  const velhas = [
    foto('g', '2026-09-01T10:00:00.000Z', 'genero', [{ genero: 'F', valor: 60 }, { genero: 'M', valor: 40 }]),
    foto('i', '2026-09-01T10:00:00.000Z', 'idade', [{ idade: '35-44', valor: 70 }, { idade: '25-34', valor: 30 }]),
  ];
  const cruz = foto('c', '2026-09-29T10:00:00.000Z', 'idade_genero', [cel('25-34', 'M', 60), cel('18-24', 'M', 19), cel('25-34', 'F', 15), cel('35-44', 'F', 15)]);
  const cidade = foto('l', '2026-09-22T10:00:00.000Z', 'cidade', CIDADES);
  const def = BLOCOS_QUEM.find((b) => b.id === 'seguidores');
  const b = blocoQuem(def, [...velhas, cruz, cidade], {});
  assert.equal(b.em, '2026-09-29T10:00:00.000Z');
  assert.deepEqual(b.frases, [
    'Dos 109 seguidores com dado (30 dias): 72% são homens e 28% mulheres.',
    '86% têm menos de 35 anos. O maior grupo é de homens de 25 a 34 anos (55%).',
    'Homens abaixo de 35 anos são 72% do total. O restante são principalmente mulheres de 25 a 44 anos (28%).',
    'Pela leitura de 22/09, 41% estão em Belo Horizonte; depois Contagem (7%) e São Paulo (6%).',
  ]);
  assert.ok(!b.frases.some((f) => /60%|35 anos ou mais/.test(f)), 'nada da leitura velha de gênero e idade');
  // o contrário: cruzamento velho, gênero e idade novos (a mesma leitura): sai sem a pirâmide velha
  const eng = BLOCOS_QUEM.find((x) => x.id === 'engajados-30');
  const cruzVelho = foto('a', '2026-09-01T10:00:00.000Z', 'idade_genero', [cel('25-34', 'F', 60), cel('35-44', 'M', 40)], 'engajados');
  const gNovo = foto('b', '2026-09-29T10:00:00.000Z', 'genero', [{ genero: 'M', valor: 70 }, { genero: 'F', valor: 30 }], 'engajados');
  const iNovo = foto('d', '2026-09-29T10:00:00.000Z', 'idade', [{ idade: '18-24', valor: 50 }, { idade: '25-34', valor: 50 }], 'engajados');
  const inv = blocoQuem(eng, [cruzVelho, gNovo, iNovo], {});
  assert.equal(inv.idadeGenero, null);
  assert.equal(inv.frases[0], 'Das 100 contas engajadas com dado (30 dias): 70% são homens e 30% mulheres.');
  // as personas usam a mesma entrada: sem o cruzamento velho, as que dependem de gênero ficam sem dado
  const personas = aderenciaPersonas(entradaDoBloco(eng, [cruzVelho, gNovo, iNovo]).entrada);
  assert.equal(personas.find((p) => p.id === 'B').pct, null);
  assert.equal(personas.find((p) => p.id === 'E').pct, 100);
  semTraco([...b.frases, ...inv.frases]);
});

test('aderência às personas: com cruzamento, sem cruzamento e recorte pequeno', () => {
  // no CRUZ todo recorte tem célula oculta dentro (1 a 4 pessoas): pct em múltiplo de 5 (66, 16, 9, 76 e 67 exatos)
  const com = Object.fromEntries(aderenciaPersonas(CRUZ).map((p) => [p.id, p]));
  assert.equal(com.A.pct, 65);
  assert.equal(com.B.pct, 15);
  assert.equal(com.C.pct, 10);
  assert.equal(com.D.pct, 75);
  assert.equal(com.E.pct, 65);
  assert.ok(Object.values(com).every((p) => p.aproximado && p.valor === null));
  const sem = Object.fromEntries(aderenciaPersonas({ idade: [{ idade: '25-34', valor: 50 }, { idade: '35-44', valor: 30 }, { idade: '45-54', valor: 20 }] }).map((p) => [p.id, p]));
  assert.equal(sem.A.pct, 80);
  assert.equal(sem.B.pct, null);
  assert.match(sem.B.motivo, /cruzamento/);
  assert.equal(sem.C.pct, null);
  const pequeno = Object.fromEntries(aderenciaPersonas([cel('25-34', 'F', 40), cel('55-64', 'M', 3), cel('65+', 'M', 2)]).map((p) => [p.id, p]));
  assert.equal(pequeno.C.pct, null, 'recorte feito só de células ocultas não vira número');
  assert.equal(pequeno.C.valor, null);
  const frase = frasePersona(com.A, com.A, sem.A);
  assert.equal(frase, 'Direto (serviço intelectual; 25 a 44 anos, todos os gêneros): cerca de 65% dos seguidores e 80% das contas engajadas em 30 dias.');
  assert.equal(sem.A.aproximado, false, 'sem oculta no recorte: exato');
  assert.match(frasePersona(sem.B, sem.B, null), /sem dado, precisa do cruzamento/);
  semTraco([frase, frasePersona(sem.B, sem.B, null)]);
});

test('frasesPago: gênero female/male/unknown, abaixo de 35 e o maior grupo', () => {
  const p = {
    anuncios: ['120'], alcance: 1234, gasto: 150,
    idadeGenero: [
      { idade: '18-24', genero: 'female', alcance: 190 }, { idade: '25-34', genero: 'female', alcance: 410 }, { idade: '35-44', genero: 'female', alcance: 120 },
      { idade: '18-24', genero: 'male', alcance: 100 }, { idade: '25-34', genero: 'male', alcance: 100 }, { idade: '35-44', genero: 'male', alcance: 60 },
      { idade: '35-44', genero: 'unknown', alcance: 20 },
    ],
    regioes: [{ regiao: 'Minas Gerais', alcance: 800 }, { regiao: 'São Paulo', alcance: 80 }, { regiao: 'Bahia', alcance: 3 }],
  };
  const frases = frasesPago(p);
  assert.equal(frases[0], `No alcance pago (1.234 contas, ${reais(150)}): 72% mulheres; 80% abaixo de 35 anos; maior grupo: mulheres de 25 a 34 (41%).`);
  assert.equal(frases[1], 'Por região: Minas Gerais (91%) e São Paulo (9%).');
  assert.ok(!frases.some((f) => /Bahia/.test(f)), 'região com 3 contas não vira frase');
  const dois = frasesPago({ ...p, anuncios: ['1', '2'] });
  assert.match(dois[0], /alcance somado de 2 anúncios/);
  const vazio = frasesPago({ anuncios: ['1'], alcance: null, gasto: 10, idadeGenero: [{ idade: '25-34', genero: 'female', alcance: 3 }] });
  assert.equal(vazio[0], `No alcance pago (alcance sem dado, ${reais(10)}): sem dado de idade e gênero.`);
  // linha de 1 a 4 contas somada com linha grande: a soma sai "cerca de"; a lista da tela vai sem ela
  const pequeno = {
    anuncios: ['1'], alcance: 300, gasto: 20,
    idadeGenero: [{ idade: '18-24', genero: 'female', alcance: 100 }, { idade: '25-34', genero: 'female', alcance: 3 }, { idade: '25-34', genero: 'male', alcance: 150 }, { idade: '65+', genero: 'male', alcance: 2 }],
  };
  const aprox = frasesPago(pequeno);
  assert.equal(aprox[0], `No alcance pago (300 contas, ${reais(20)}): cerca de 60% homens; mais de 95% abaixo de 35 anos; maior grupo: homens de 25 a 34 (59%).`);
  assert.deepEqual(visiveisPago(pequeno), {
    genero: [{ id: 'F', rotulo: 'Mulheres', pct: 40, aproximado: true }, { id: 'M', rotulo: 'Homens', pct: 60, aproximado: true }],
    idade: [{ faixa: '18-24', pct: 39.2 }, { faixa: '25-34', pct: 60, aproximado: true }],
    cidades: [], paises: [], seguidores: null,
  });
  assert.deepEqual(visiveisPago(p).genero.map((g) => [g.id, g.pct, g.aproximado ?? false]), [['F', 72, false], ['M', 26, false], ['U', 2, false]]);
  semTraco([...frases, ...dois, ...vazio, ...aprox]);
});

test('frasesPostApp: fonte da tela e grupos pequenos fora quando a base é conhecida', () => {
  const dados = { base: 'contas-alcancadas', genero: { mulheres: 97, homens: 3 }, idade: { '18-24': 30, '25-34': 41, '35-44': 20, '45-54': 9 }, cidades: [{ nome: 'Belo Horizonte', pct: 45 }, { nome: 'Contagem', pct: 8 }], seguidores: 30, naoSeguidores: 70 };
  const frases = frasesPostApp(dados, { n: 100 });
  assert.equal(frases[0], 'Na tela do app (contas alcançadas): 97% mulheres; 71% abaixo de 35 anos; maior faixa: 25 a 34 anos (41%).');
  assert.ok(!frases.some((f) => /homens/.test(f)), '3% de 100 contas são 3 pessoas');
  assert.equal(frases[1], '45% estão em Belo Horizonte; depois Contagem (8%).');
  assert.equal(frases[2], '30% seguem a conta e 70% não seguem.');
  assert.deepEqual(frasesPostApp(null), []);
  semTraco(frases);
});

test('público do post pela tela do app: sem a base em pessoas, nenhum grupo (falha fechada)', () => {
  // ~40 contas engajadas: 4% são 1,6 pessoa. Antes, sem n, "96% mulheres e 4% homens" e Contagem (4%) saíam
  const app = { base: 'contas-engajadas', genero: { mulheres: 96, homens: 4 }, cidades: [{ nome: 'Belo Horizonte', pct: 92 }, { nome: 'Contagem', pct: 4 }, { nome: 'Betim', pct: 4 }], seguidores: 96, naoSeguidores: 4 };
  assert.deepEqual(frasesPostApp(app), []);
  assert.deepEqual(frasesPostApp(app, { n: null }), []);
  assert.deepEqual(visiveisPostApp(app, null), { genero: [], idade: [], cidades: [], paises: [], seguidores: null });
  assert.match(semFrasePostApp([], null), /falta saber quantas contas a tela mede/);
  // a base de contas com engajamento sai do maior entre curtidas e salvamentos (comentário e compartilhamento
  // repetem conta)
  const n = pessoasNaBase(app, { likes: 40, saved: 12, comments: 3, shares: 5, reach: 400, views: 900 });
  assert.equal(n, 40);
  assert.equal(pessoasNaBase(app, { likes: 3, saved: 1, comments: 60, shares: 20 }), 3);
  assert.deepEqual(frasesPostApp(app, { n }), ['Na tela do app (contas com engajamento): 96% mulheres.', '92% estão em Belo Horizonte.', '96% seguem a conta.']);
  assert.deepEqual(visiveisPostApp(app, n), {
    genero: [{ id: 'F', rotulo: 'Mulheres', pct: 96 }], idade: [], cidades: [{ nome: 'Belo Horizonte', pct: 92 }], paises: [],
    seguidores: { seguidores: 96, naoSeguidores: null },
  });
  // base de visualizações: a base em pessoas é o alcance (120), nunca as 400 visualizações
  const views = { base: 'visualizacoes', genero: { mulheres: 97, homens: 3 }, idade: { '13-17': 2, '18-24': 30, '25-34': 41, '35-44': 20, '45-54': 7 }, cidades: [{ nome: 'Sete Lagoas', pct: 2 }] };
  const nViews = pessoasNaBase(views, { reach: 120, views: 400 });
  assert.equal(nViews, 120);
  const fv = frasesPostApp(views, { n: nViews });
  assert.deepEqual(fv, ['Na tela do app (visualizações): 97% mulheres; cerca de 75% abaixo de 35 anos; maior faixa: 25 a 34 anos (41%).']);
  assert.ok(!fv.some((f) => /homens|Sete Lagoas/.test(f)), '3% e 2% de 120 contas são menos de 5 pessoas');
  assert.deepEqual(visiveisPostApp(views, nViews).idade.map((i) => i.faixa), ['18-24', '25-34', '35-44', '45-54']);
  // as contas que a tela mostra valem mais que o alcance
  assert.equal(pessoasNaBase({ ...views, contas: 1234 }, { reach: 120 }), 1234);
  assert.equal(pessoasNaBase({ base: 'contas-engajadas' }, { reach: 50 }), null, 'sem curtida nem salvamento, sem base');
  assert.equal(pessoasNaBase({ base: 'contas-alcancadas' }, null), null);
  // todo grupo pequeno: a frase diz por quê (e o front não mostra percentual cru)
  const pequeno = { base: 'contas-alcancadas', genero: { mulheres: 57.1, homens: 42.9 }, idade: { '25-34': 57.1, '35-44': 42.9 } };
  assert.deepEqual(frasesPostApp(pequeno, { n: 7 }), []);
  assert.deepEqual(visiveisPostApp(pequeno, 7).genero, []);
  assert.equal(semFrasePostApp([], 7), 'Sem frase: nenhum grupo com 5 pessoas ou mais.');
  assert.equal(semFrasePostApp(['x'], 7), null);
  semTraco([...frasesPostApp(app, { n }), ...fv, semFrasePostApp([], null)]);
});

test('horas do Pacífico viram horas de Brasília pela diferença do fuso na data', () => {
  // setembro (horário de verão nos EUA): Pacífico = UTC-7, Brasília = UTC-3, +4h
  const verao = horasPacificoParaBrasilia({ 0: 10, 23: 5, 24: 99, x: 1 }, Date.UTC(2026, 8, 15, 19));
  assert.equal(verao.length, 24);
  assert.equal(verao[4], 10);
  assert.equal(verao[3], 5);
  assert.equal(verao.filter((v) => v != null).length, 2);
  // dezembro (inverno nos EUA): Pacífico = UTC-8, +5h
  const inverno = horasPacificoParaBrasilia({ 0: 10, 23: 5 }, Date.UTC(2026, 11, 15, 19));
  assert.equal(inverno[5], 10);
  assert.equal(inverno[4], 5);
  assert.deepEqual(horasPacificoParaBrasilia({ 0: 1 }, null), Array(24).fill(null));
  // online_followers: dois dias, média por hora de Brasília (end_time é o fim do dia no Pacífico)
  const itens = parseBreakdown({
    data: [{
      name: 'online_followers',
      values: [
        { value: { 0: 10, 12: 40 }, end_time: '2026-09-15T07:00:00+0000' },
        { value: { 0: 20, 12: 60 }, end_time: '2026-09-16T07:00:00+0000' },
      ],
    }],
  });
  const media = mediaOnline(itens);
  assert.equal(media[4], 15);
  assert.equal(media[16], 50);
  assert.equal(media[0], null);
  assert.equal(mediaOnline([]), null);
});

test('limparPostApp: percentuais, faixas, somas e cidades', () => {
  const ok = limparPostApp({
    base: 'visualizacoes', genero: { mulheres: '72,5', homens: 27.5 },
    idade: { '18-24': 20, '25-34': 50, '35-44': 30 },
    cidades: [{ nome: 'Belo Horizonte', pct: 45 }, { nome: '', pct: '' }], paises: [{ nome: 'Brasil', pct: '98%' }],
    seguidores: 40, naoSeguidores: 60,
  });
  assert.deepEqual(ok.erros, []);
  assert.deepEqual(ok.limpo, {
    base: 'visualizacoes', genero: { mulheres: 72.5, homens: 27.5 }, idade: { '18-24': 20, '25-34': 50, '35-44': 30 },
    cidades: [{ nome: 'Belo Horizonte', pct: 45 }], paises: [{ nome: 'Brasil', pct: 98 }], seguidores: 40, naoSeguidores: 60,
  });
  const ruim = limparPostApp({ base: 'outra', genero: { mulheres: 120, homens: 10 }, idade: { '20-30': 50, '25-34': 40 }, cidades: Array.from({ length: 11 }, () => ({ nome: 'x', pct: 1 })) });
  assert.ok(ruim.erros.some((e) => /base/.test(e)));
  assert.ok(ruim.erros.some((e) => /Mulheres precisa ser um percentual de 0 a 100/.test(e)));
  assert.ok(ruim.erros.some((e) => /Faixa de idade desconhecida/.test(e)));
  assert.ok(ruim.erros.some((e) => /somam 40%/.test(e)));
  assert.ok(ruim.erros.some((e) => /No máximo 10 cidades/.test(e)));
  assert.ok(limparPostApp({ cidades: [{ nome: 'x'.repeat(81), pct: 3 }] }).erros.some((e) => /80 caracteres/.test(e)));
  assert.ok(limparPostApp({ genero: { mulheres: 60, homens: 20 } }).erros.some((e) => /somam 80%/.test(e)));
  assert.deepEqual(limparPostApp({}).erros, ['Informe pelo menos um número da tela do app.']);
  // "Os países", não "As países"
  const paises = limparPostApp({ paises: [{ nome: 'Brasil', pct: 60 }, { nome: 'Portugal', pct: 45 }] }).erros;
  assert.deepEqual(paises, ['Os países somam 105%: passa de 100%.']);
  assert.deepEqual(limparPostApp({ cidades: [{ nome: 'BH', pct: 60 }, { nome: 'Contagem', pct: 45 }] }).erros, ['As cidades somam 105%: passa de 100%.']);
  semTraco([...ruim.erros, ...paises]);
});

test('contas na base: número inteiro da tela (milhar com ponto); abreviado ou fração não entra', () => {
  assert.equal(lerContas('1.234'), 1234);
  assert.equal(lerContas(' 987 '), 987);
  assert.equal(lerContas(56), 56);
  assert.equal(lerContas(''), undefined);
  assert.equal(lerContas(null), undefined);
  assert.ok(Number.isNaN(lerContas('1,2 mil')));
  assert.ok(Number.isNaN(lerContas('1.5')));
  assert.ok(Number.isNaN(lerContas(12.5)));
  const ok = limparPostApp({ base: 'contas-engajadas', contas: '1.234', genero: { mulheres: 60, homens: 40 } });
  assert.deepEqual(ok.erros, []);
  assert.equal(ok.limpo.contas, 1234);
  assert.equal('contas' in limparPostApp({ genero: { mulheres: 60, homens: 40 } }).limpo, false, 'sem o campo, sem a chave');
  for (const ruim of ['1,2 mil', 0, -3, 'abc']) {
    assert.deepEqual(limparPostApp({ contas: ruim, genero: { mulheres: 60, homens: 40 } }).erros, ['Contas na base precisa ser o número inteiro que a tela mostra, maior que zero (ex.: 1.234).']);
  }
});

test('sugestaoDoPrint: a saída da IA vira a forma do formulário, com avisos', () => {
  const s = sugestaoDoPrint({
    ehTelaDePublico: true, base: 'nao-sei',
    genero: [{ id: 'mulheres', pct: 70 }, { id: 'homens', pct: 30 }],
    idade: [{ faixa: '25-34', pct: 60 }, { faixa: '35-44', pct: 20 }, { faixa: '99-100', pct: 5 }],
    cidades: [{ nome: 'Belo Horizonte', pct: 50 }], paises: [], seguidores: [{ id: 'nao-seguidores', pct: 80 }],
  });
  assert.equal(s.vazio, false);
  assert.deepEqual(s.sugestao.genero, { mulheres: 70, homens: 30 });
  assert.deepEqual(s.sugestao.idade, { '25-34': 60, '35-44': 20 });
  assert.equal(s.sugestao.naoSeguidores, 80);
  assert.ok(s.avisos.some((a) => /somam 80%/.test(a)));
  assert.ok(s.avisos.some((a) => /confira a base/.test(a)));
  assert.equal('contas' in s.sugestao, false, 'sem contas no print, sem a chave');
  assert.equal(sugestaoDoPrint({ ehTelaDePublico: false, base: 'nao-sei', genero: [], idade: [], cidades: [], paises: [], seguidores: [] }).vazio, true);
  // o número de contas que a tela mostra vem junto; lido torto vira aviso e fica de fora
  const comContas = sugestaoDoPrint({ ehTelaDePublico: true, base: 'contas-alcancadas', contas: 1234, genero: [{ id: 'mulheres', pct: 70 }, { id: 'homens', pct: 30 }], idade: [], cidades: [], paises: [], seguidores: [] });
  assert.equal(comContas.sugestao.contas, 1234);
  const torto = sugestaoDoPrint({ ehTelaDePublico: true, base: 'contas-alcancadas', contas: 1.2, genero: [{ id: 'mulheres', pct: 70 }, { id: 'homens', pct: 30 }], idade: [], cidades: [], paises: [], seguidores: [] });
  assert.equal('contas' in torto.sugestao, false);
  assert.ok(torto.avisos.some((a) => /Contas na base/.test(a)));
});

test('descoberta, crescimento e seguidores a partir do diário', () => {
  const diario = {
    '2026-09-21': { alcance: { total: 100, seguidores: 30, naoSeguidores: 70 }, alcancePorTipo: { REEL: 80, POST: 20 }, seguiram: 3, deixaram: 1, seguidoresTotal: 100, em: 'x' },
    '2026-09-22': { alcance: { total: 50, seguidores: 25, naoSeguidores: 25 }, alcancePorTipo: { REEL: 40, STORY: 10 }, seguiram: 2, deixaram: 0 },
    '2026-09-28': { alcance: { total: 200, seguidores: 20, naoSeguidores: 180 }, seguiram: 5, deixaram: 2, seguidoresTotal: 109, em: 'y' },
    '2026-09-30': { seguidoresTotal: 110, em: 'z' },
  };
  const d = descoberta(diario, { hoje: '2026-09-30' });
  assert.deepEqual(d.semanas.map((w) => [w.semana, w.alcance, w.pctNao]), [['2026-W39', 150, 63.3], ['2026-W40', 200, 90]]);
  assert.equal(d.semanas[0].rotulo, '21/09 a 27/09');
  assert.equal(d.porTipo.itens[0].tipo, 'REEL');
  assert.equal(d.porTipo.itens[0].pctAlcance, 80);
  // 275 de 350 = 78,6%
  assert.match(d.frase, /^Nas últimas 2 semanas com dado, 79% do alcance diário somado veio de quem não segue a conta\. Reels somaram 80%/);
  const c = crescimento(diario, { hoje: '2026-09-30', dias: 10 });
  assert.equal(c.dias.length, 10);
  assert.equal(c.dias.at(-1).dia, '2026-09-30');
  assert.equal(c.frase, 'Nos últimos 10 dias (3 com dado), 10 contas começaram a seguir e 3 deixaram de seguir (saldo de 7).');
  const novos = crescimento({}, { hoje: '2026-09-30', dias: 3, novosPorDia: { '2026-09-29': { seguidores: 4 } } });
  assert.equal(novos.dias[1].seguiram, 4);
  const s = resumoSeguidores(diario);
  assert.equal(s.total, 110);
  assert.equal(s.variacao7d, 10);
  assert.equal(resumoSeguidores({}, { contaTotal: 108 }).total, 108);
  semTraco([d.frase, c.frase]);
});

test('horários: score por formato, sem post com anúncio nem post novo', () => {
  const post = (midiaId, dia, hora, reach, tipo = 'REELS') => ({ midiaId, tipo, reach, timestamp: `${dia}T${String(hora + 3).padStart(2, '0')}:00:00+0000` });
  const posts = [
    post('1', '2026-09-01', 19, 400), post('2', '2026-09-02', 20, 300), post('3', '2026-09-03', 21, 350),
    post('4', '2026-09-04', 9, 100), post('5', '2026-09-05', 10, 120), post('6', '2026-09-06', 11, 90),
    post('7', '2026-09-07', 19, 5000), post('8', '2026-09-29', 19, 10),
  ];
  const h = horariosNossos(posts, { agora: '2026-09-30T12:00:00Z', comAnuncio: new Set(['7']) });
  const noite = h.find((f) => f.faixa === 'noite');
  const manha = h.find((f) => f.faixa === 'manha');
  assert.equal(noite.n, 3);
  assert.equal(manha.n, 3);
  assert.ok(noite.medianaScore > 0 && manha.medianaScore < 0);
  const frase = fraseHorarios([...Array(20).fill(1), 9, 7, 8, 1], h);
  assert.match(frase, /^Os seguidores ficam mais online às 20h, 22h e 21h \(horário de Brasília\)\./);
  assert.match(frase, /os da noite \(3 posts\)/);
  assert.match(frase, /sinal, não prova/);
  semTraco([frase]);
});

test('anúncios: números em texto viram número e os anúncios do mesmo post somam', () => {
  const totais = lerTotaisAnuncio({
    data: [{
      spend: '12.34', reach: '1000', impressions: '1500',
      actions: [{ action_type: 'video_view', value: '600' }, { action_type: 'onsite_conversion.profile_visit', value: '12' }, { action_type: 'like', value: '3' }],
      video_thruplay_watched_actions: [{ action_type: 'video_view', value: '200' }],
      video_avg_time_watched_actions: [{ action_type: 'video_view', value: '4' }],
      video_p25_watched_actions: [{ action_type: 'video_view', value: '300' }],
    }],
  });
  assert.equal(totais.gasto, 12.34);
  assert.equal(totais.alcance, 1000);
  assert.equal(totais.plays3s, 600);
  assert.equal(totais.visitasPerfil, 12);
  assert.equal(totais.seguiram, null, 'ação que não veio é sem dado');
  assert.equal(totais.p50, null);
  assert.equal(lerTotaisAnuncio({ data: [] }), null);
  const quebra = lerQuebraAnuncio({ data: [{ age: '25-34', gender: 'female', reach: '410', impressions: '600' }, { region: 'Minas Gerais', reach: '800' }] });
  assert.deepEqual(quebra, [
    { idade: '25-34', genero: 'female', alcance: 410, impressoes: 600 },
    { regiao: 'Minas Gerais', alcance: 800, impressoes: null },
  ]);
  const junto = agregarAnuncios([
    { adId: '1', totais: { ...totais, tempoMedioS: 4, plays3s: 600 }, idadeGenero: [{ idade: '25-34', genero: 'female', alcance: 410, impressoes: 600 }], regioes: [] },
    { adId: '2', totais: { gasto: 5, alcance: 200, tempoMedioS: 10, plays3s: 200 }, idadeGenero: [{ idade: '25-34', genero: 'female', alcance: 90, impressoes: 100 }], regioes: [] },
  ], '2026-09-30T12:00:00.000Z');
  assert.equal(junto.gasto, 17.34);
  assert.equal(junto.alcance, 1200);
  assert.equal(junto.tempoMedioS, 5.5);
  assert.deepEqual(junto.idadeGenero, [{ idade: '25-34', genero: 'female', alcance: 500, impressoes: 700 }]);
  assert.equal(junto.aviso, 'alcance somado dos anúncios');
  assert.deepEqual(junto.anuncios, ['1', '2']);
});

test('janela do diário: relê o dia que falta ou que foi lido cedo demais, de 3 a 28 dias', () => {
  const hoje = '2026-10-06';
  // os 28 dias lidos maduros (2 dias depois de fechar): a leitura normal pega só os 3 últimos
  const maduro = {};
  for (let k = 1; k <= 28; k++) {
    const d = new Date(Date.UTC(2026, 9, 6 - k));
    const dia = d.toISOString().slice(0, 10);
    const lido = new Date(Date.UTC(2026, 9, 6 - k + 3, 12)).toISOString();
    maduro[dia] = { alcance: { total: 10 }, seguiram: 1, em: lido };
  }
  assert.equal(janelaDiario(maduro, { hoje }), 3);
  // computador desligado de sexta (02/10) a terça (06/10): sexta, sábado, domingo e segunda nunca lidos, e a
  // quinta (01/10) lida na sexta de manhã (menos de 48h depois de fechar)
  const desligado = { ...maduro };
  for (const dia of ['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05']) delete desligado[dia];
  desligado['2026-10-01'] = { alcance: { total: 7 }, em: '2026-10-02T11:00:00.000Z' };
  assert.equal(janelaDiario(desligado, { hoje }), 5, 'relê desde a quinta');
  // dia com só o total de seguidores (era "hoje" na leitura) conta como faltando
  const soTotal = { ...maduro, '2026-09-26': { seguidoresTotal: 108, em: '2026-09-26T20:00:00.000Z' } };
  assert.equal(janelaDiario(soTotal, { hoje }), 10);
  // sem nada (primeira leitura) ou buraco antigo: no máximo 28
  assert.equal(janelaDiario({}, { hoje }), 28);
  assert.equal(janelaDiario(null, { hoje }), 28);
});

test('stories: só erro que fala da métrica é recusa; story que sumiu ou erro passageiro é erro do story', () => {
  const erro = (code, message, sub) => ({ meta: { code, message, ...(sub ? { sub } : {}) } });
  assert.deepEqual(erroDoStory(erro(10, '(#10) Not enough viewers for the media to show insights'), ['views']), { tipo: 'menos-de-5' });
  assert.deepEqual(erroDoStory(erro(10, '(#10) Application does not have permission for this action'), ['views']), { tipo: 'outro' });
  // story apagado entre a lista e os insights: não desliga métrica nenhuma
  const sumiu = erro(100, "Unsupported get request. Object with ID '179' does not exist, cannot be loaded due to missing permissions", 33);
  assert.deepEqual(erroDoStory(sumiu, ['views', 'reach', 'replies']), { tipo: 'sumiu' });
  assert.deepEqual(erroDoStory(erro(100, 'Object does not exist'), ['navigation']), { tipo: 'sumiu' });
  assert.deepEqual(erroDoStory(erro(100, '(#100) The Media Insights API does not support the link_clicks metric for this media product type'), ['views', 'link_clicks']), { tipo: 'recusa', fora: ['link_clicks'] });
  assert.deepEqual(erroDoStory(erro(100, '(#100) metric[7] must be one of the following values: views, reach, replies'), ['views', 'reach', 'replies', 'link_clicks']), { tipo: 'recusa', fora: ['link_clicks'] });
  assert.deepEqual(erroDoStory(erro(100, '(#100) Incompatible breakdown for this metric'), ['navigation']), { tipo: 'recusa', fora: [] });
  assert.deepEqual(erroDoStory(erro(100, '(#100) An unknown error occurred'), ['views']), { tipo: 'sem-nome' });
  assert.deepEqual(erroDoStory(erro(2, 'Service temporarily unavailable'), ['views']), { tipo: 'outro' });
  assert.deepEqual(erroDoStory(erro(500, 'Internal Server Error'), ['views']), { tipo: 'outro' });
  assert.deepEqual(erroDoStory(new Error('rede'), ['views']), { tipo: 'outro' });
});

test('stories: a última leitura junta campo a campo; captura sem número nenhum não entra', () => {
  const nav = (avancou, voltou, saiu, proximo) => ({ avancou, voltou, saiu, proximo });
  const vazia = { views: null, reach: null, replies: null, shares: null, follows: null, profileVisits: null, interacoes: null, linkClicks: null, navegacao: nav(null, null, null, null) };
  assert.equal(leituraStoryVazia(vazia), true);
  assert.equal(leituraStoryVazia({ ...vazia, em: 'x', idadeH: 5 }), true, 'a hora da leitura não é número do story');
  assert.equal(leituraStoryVazia({ ...vazia, replies: 'menos-de-5' }), false);
  assert.equal(leituraStoryVazia({ ...vazia, navegacao: nav(null, null, 3, null) }), false);
  assert.equal(leituraStoryVazia(null), true);
  // 19h: 120 visualizações; 20h (a última antes de sair do ar): as visualizações falharam, o alcance veio
  const antes = { em: '2026-09-30T22:00:00.000Z', idadeH: 20, ...vazia, views: 120, reach: 90, replies: 'menos-de-5', navegacao: nav(40, 3, 12, 5) };
  const agora = { em: '2026-09-30T23:00:00.000Z', idadeH: 21, ...vazia, reach: 95, navegacao: nav(44, null, null, null) };
  const u = juntarLeituraStory(antes, agora);
  assert.equal(u.em, '2026-09-30T23:00:00.000Z');
  assert.deepEqual([u.views, u.reach, u.replies, u.shares], [120, 95, 'menos-de-5', null]);
  assert.deepEqual(u.navegacao, nav(44, 3, 12, 5));
  assert.equal(juntarLeituraStory(null, agora), agora, 'sem anterior, a nova');
});
