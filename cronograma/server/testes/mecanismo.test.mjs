// Testes do mecanismo de anti-repetição e continuidade (mecanismo.mjs, 21/10) com a semana real de 26/10 (as ideias,
// os pilares e os blocos do calendário da estratégia principal, como o aplicar-estrategia-2110 grava) e dos campos
// novos da validação (validar.mjs). Puro: nada de disco. Rodar: npm run testar
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  analisarSemana, semanaDe, anguloCanonico, jaccard, itensDo, historicoParaIa, ANGULOS_PILAR_8,
} from '../mecanismo.mjs';
import { conferirReel, conferirStoriesDia, CAMPOS_STORIES } from '../validar.mjs';

const TRACO = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
// o texto EXATO da coluna "O que fiz" da linha "Sáb 31, stories de oferta" do calendário de 26/10
const MOTIVO_31 = 'mantido de propósito, porque é a contagem regressiva. Precisa de `excecaoAntiRepeticao` quando virar peça. Ângulo diferente das existentes: garantia + prazo real, nada de "a partir de" nem "sem asterisco"';

const peca = (id, data, peca, pilar, bloco, ideia, extra = {}) => ({ id, data, peca, peca2: null, pilar, bloco, ideia, status: 'ideia', roteiro: {}, carrossel: {}, estatico: {}, legenda: '', ...extra });
const dia = (id, data, pilar, bloco, tema, extra = {}) => ({ id, data, pilar, bloco, tema, objetivo: 'engajamento', quadros: [], pecaDoDia: null, status: 'ideia', ...extra });

// a semana de 26/10 a 01/11 do calendário (versão 2, motor Ateliê)
function semana2610() {
  return {
    config: { volumeSemanal: { reels: 3, feeds: 5, storiesTemas: 5 }, mixBlocos: { Afeto: 20, Educação: 30, Diferencial: 25, Conversão: 25 }, tetoVenda: { foraDaPromocao: 20, naPromocao: 30 } },
    reels: [
      peca('reel_26', '2026-10-26', 'carrossel', 4, 'Educação', '"Quanto do seu mês vai embora com o contador": nota caçada no WhatsApp, guia que chega em cima da hora, resposta que demora'),
      peca('reel_27', '2026-10-27', 'reel', 3, 'Afeto', '"22 anos de escritório e um app novo: 10/11." A origem da Legalizaí revelando a data'),
      peca('reel_28', '2026-10-28', 'carrossel', 11, 'Conversão', '"5 sinais de que é hora de trocar de contador"'),
      peca('reel_29a', '2026-10-29', 'reel', 17, 'Diferencial', '"Emitir uma nota em 15 segundos": a tela real, uma tarefa chata resolvida, sem narração'),
      peca('reel_29b', '2026-10-29', 'estatico', 9, 'Diferencial', 'O contador de verdade da Legalize, com nome e rosto'),
      peca('reel_30', '2026-10-30', 'carrossel', 5, 'Educação', 'Mito: "Trocar de contador no meio do ano dá dor de cabeça"'),
      peca('reel_31', '2026-10-31', 'reel', 2, 'Afeto', 'Humor: o dono de ME no último dia do mês, caçando nota e comprovante'),
      peca('reel_01', '2026-11-01', 'estatico', 16, 'Educação', '"Novembro chegou: o que muda na sua nota de serviço" (emissor nacional, cliente identificado)'),
    ],
    stories: [
      dia('sto_26', '2026-10-26', null, null, 'Caixinha "Qual dúvida você tem vergonha de perguntar pro contador?", com aviso de que a pergunta pode virar conteúdo anônimo', { pilarTexto: 'Mecânica recorrente · todas · a pergunta não é do Léo', pecaDoDia: 'reel_26' }),
      dia('sto_27', '2026-10-27', null, 'Conversão', 'Contagem regressiva com a figurinha nativa de "lembrete" até 10/11', { objetivo: 'vendas', pilarTexto: 'Conversão · momentâneo (lançamento) · geral', pecaDoDia: 'reel_27' }),
      dia('sto_28', '2026-10-28', 8, 'Diferencial', 'Enquete "Seu contador responde em quanto tempo?"', { pecaDoDia: 'reel_28' }),
      dia('sto_30', '2026-10-30', 1, 'Afeto', 'Bastidor do fundador: a semana do produto (telas, testes, contagem)', { pecaDoDia: 'reel_30' }),
      dia('sto_31', '2026-10-31', 10, 'Conversão', 'Oferta de fundador: ME a R$ 99 nos 3 primeiros meses, até 31/12, com a garantia de 7 dias', { objetivo: 'vendas', pecaDoDia: 'reel_31' }),
    ],
  };
}
// as 12 peças da 1ª campanha do Ateliê: todas do pilar 10 (oferta)
const CAMPANHA = Array.from({ length: 12 }, (_, i) => ({ id: `mote-${i}`, pilar: 10, titulo: `Plano ${i}: o preço que fica`, angulo: null }));
const alertasDe = (a, id) => a.pecas[id].filter((x) => x.nivel === 'alerta');

test('mecanismo: semana, ângulo e parecença', () => {
  assert.deepEqual(semanaDe('2026-10-29'), { inicio: '2026-10-26', fim: '2026-11-01' });
  assert.deepEqual(semanaDe('2026-11-01'), { inicio: '2026-10-26', fim: '2026-11-01' });
  assert.deepEqual(semanaDe('2026-11-02'), { inicio: '2026-11-02', fim: '2026-11-08' });
  assert.deepEqual(semanaDe('2027-01-01'), { inicio: '2026-12-28', fim: '2027-01-03' });
  assert.equal(semanaDe('2026-02-30'), null);
  assert.equal(semanaDe('ontem'), null);
  assert.equal(anguloCanonico('preco fechado'), 'Preço fechado');
  assert.equal(anguloCanonico('  GENTE desde a  entrada '), 'Gente desde a entrada');
  assert.equal(anguloCanonico('preço justo'), null);
  assert.equal(ANGULOS_PILAR_8.length, 9);
  assert.ok(jaccard('Trocar de contador sem dor de cabeça', 'Trocar contador sem dor de cabeça nenhuma') >= 0.5);
  assert.ok(jaccard('Trocar de contador sem dor de cabeça', 'A guia do mês chega pronta no app') < 0.5);
  assert.equal(jaccard('Contador', 'Contador'), 0, 'uma palavra só não decide parecença');
});

test('mecanismo: a semana real de 26/10 (volume, mix, oferta e continuidade)', () => {
  const a = analisarSemana(semana2610(), '2026-10-28', { campanha: CAMPANHA });
  assert.deepEqual(a.semana, { inicio: '2026-10-26', fim: '2026-11-01' });
  assert.deepEqual({ reels: a.volume.reels, feeds: a.volume.feeds, storiesTemas: a.volume.storiesTemas }, { reels: 3, feeds: 5, storiesTemas: 5 });
  // o calendário conta 13 itens: 3 de afeto (23%), 4 de educação (31%, a caixinha entra aqui), 3 de diferencial e 3 de conversão
  assert.deepEqual(Object.fromEntries(Object.entries(a.mix).map(([b, x]) => [b, [x.n, x.pct, x.ok]])), {
    Educação: [4, 31, true], Afeto: [3, 23, true], Diferencial: [3, 23, true], Conversão: [3, 23, true],
  });
  assert.deepEqual(a.oferta, { n: 1, pct: 8, teto: 30, ok: true, naPromocao: true });
  // a caixinha de 26/10 é desta semana: a resposta sai na de 02/11
  assert.equal(a.continuidade.length, 1);
  assert.equal(a.continuidade[0].tipo, 'caixinha');
  assert.match(a.continuidade[0].texto, /02\/11/);
  assert.equal(a.itens.length, 13);
});

test('mecanismo: os stories de oferta de 31/10 repetem o pilar da 1ª campanha e viram info com a exceção', () => {
  const db = semana2610();
  const sem = analisarSemana(db, '2026-10-26', { campanha: CAMPANHA });
  const al = alertasDe(sem, 'sto_31');
  assert.equal(al.length, 1);
  assert.equal(al[0].regra, 'campanha');
  assert.match(al[0].texto, /pilar 10, que já tem 12 peças na 1ª campanha/);
  assert.ok(sem.alertas.some((t) => t.includes('31/10') && t.includes('1ª campanha')));
  // as outras 12 peças da semana não têm alerta nenhum
  for (const i of sem.itens.filter((x) => x.id !== 'sto_31')) assert.deepEqual(alertasDe(sem, i.id), [], i.id);

  // a exceção do calendário (o motivo exato da tabela de anti-repetição)
  db.stories.find((s) => s.id === 'sto_31').excecaoAntiRepeticao = { ativa: true, motivo: MOTIVO_31 };
  const com = analisarSemana(db, '2026-10-26', { campanha: CAMPANHA });
  assert.deepEqual(alertasDe(com, 'sto_31'), []);
  const info = com.pecas.sto_31.find((x) => x.regra === 'excecao');
  assert.equal(info.nivel, 'info');
  assert.equal(info.texto, `Repetição de propósito: ${MOTIVO_31}`);
  assert.equal(info.repete.length, 1);
  assert.deepEqual(com.alertas, []);
  // exceção desligada não vale
  db.stories.find((s) => s.id === 'sto_31').excecaoAntiRepeticao = { ativa: false, motivo: MOTIVO_31 };
  assert.equal(alertasDe(analisarSemana(db, '2026-10-26', { campanha: CAMPANHA }), 'sto_31').length, 1);
  // sem a 1ª campanha passada, a regra não roda
  assert.deepEqual(alertasDe(analisarSemana(semana2610(), '2026-10-26'), 'sto_31'), []);
});

test('mecanismo: a semana de 02/11 pede a resposta da caixinha de 26/10', () => {
  const db = semana2610();
  const sem = analisarSemana(db, '2026-11-02');
  const c = sem.continuidade.find((x) => x.tipo === 'resposta-caixinha');
  assert.equal(c.ok, false);
  assert.match(c.texto, /A caixinha de 26\/10 \(semana passada\) pede a resposta nesta semana/);
  assert.ok(sem.alertas.includes(c.texto));
  // com a resposta (a mecânica marcada) na sexta 06/11, a semana não acusa mais
  db.reels.push(peca('reel_0611', '2026-11-06', 'carrossel', 16, 'Educação', 'Traduzindo o contabilês: as dúvidas da caixinha de 26/10', { mecanica: 'resposta-caixinha' }));
  const com = analisarSemana(db, '2026-11-02');
  const c2 = com.continuidade.find((x) => x.tipo === 'resposta-caixinha');
  assert.equal(c2.ok, true);
  assert.equal(c2.pecaId, 'reel_0611');
  assert.ok(!com.alertas.some((t) => t.includes('caixinha')));
  // a caixinha marcada pela mecânica também vale (tema sem a palavra)
  const db2 = semana2610();
  Object.assign(db2.stories[0], { tema: 'Qual dúvida você tem vergonha de perguntar?', mecanica: 'caixinha' });
  assert.equal(analisarSemana(db2, '2026-11-02').continuidade[0].ok, false);
  // "Traduzindo o contabilês" na ideia vale como resposta mesmo sem a mecânica
  db2.reels.push(peca('reel_x', '2026-11-05', 'reel', 16, 'Educação', 'Traduzindo o contabilês: pró-labore'));
  assert.equal(analisarSemana(db2, '2026-11-02').continuidade[0].ok, true);
});

test('mecanismo: a caixinha é a cada 15 dias', () => {
  const db = semana2610();
  // 09/11: a retrasada (26/10) teve caixinha e a passada (02/11) não: esta deveria ter
  const a = analisarSemana(db, '2026-11-09');
  const q = a.continuidade.find((x) => x.tipo === 'caixinha-quinzenal');
  assert.equal(q.ok, false);
  assert.match(q.texto, /a cada 15 dias e a última foi em 26\/10/);
  db.stories.push(dia('sto_0911', '2026-11-10', null, null, 'Caixinha: qual dúvida você tem vergonha de perguntar pro contador?', { pilarTexto: 'Mecânica recorrente' }));
  assert.equal(analisarSemana(db, '2026-11-09').continuidade.find((x) => x.tipo === 'caixinha-quinzenal').ok, true);
  // a resposta de uma caixinha não é caixinha
  const db3 = semana2610();
  db3.stories.push(dia('sto_r', '2026-11-03', 16, 'Educação', 'Respostas da caixinha: traduzindo o contabilês'));
  assert.equal(itensDo(db3).find((i) => i.id === 'sto_r').caixinha, false);
});

test('mecanismo: anti-repetição (texto parecido, ângulo, pilar repetido) e a exceção', () => {
  const db = {
    reels: [
      // 3 semanas antes: mesmo pilar 11 e quase a mesma ideia
      peca('antiga', '2026-10-05', 'carrossel', 11, 'Conversão', 'Trocar de contador sem dor de cabeça: o caminho pelo app'),
      peca('antiga-outro-pilar', '2026-10-05', 'reel', 5, 'Educação', 'Trocar de contador sem dor de cabeça: o caminho pelo app'),
      // fora das 8 semanas: não conta
      peca('velha', '2026-08-24', 'carrossel', 11, 'Conversão', 'Trocar de contador sem dor de cabeça: o caminho pelo app'),
      peca('nova', '2026-11-03', 'carrossel', 11, 'Conversão', 'Trocar de contador sem dor de cabeça: o caminho no app'),
      // pilar 8: o mesmo ângulo 3 semanas antes; outro, 5 semanas antes
      peca('p8-antiga', '2026-10-13', 'estatico', 8, 'Diferencial', 'Preço que você vê é o que paga', { angulo: 'Preço fechado' }),
      peca('p8-velha', '2026-09-29', 'estatico', 8, 'Diferencial', 'Contador desde a entrada', { angulo: 'Daqui de BH' }),
      peca('p8-nova', '2026-11-05', 'reel', 8, 'Diferencial', 'Sem asterisco no plano', { angulo: 'preço fechado' }),
      peca('p8-bh', '2026-11-06', 'reel', 8, 'Diferencial', 'ISS de BH sem explicar nada', { angulo: 'Daqui de BH' }),
    ],
    stories: [],
  };
  const a = analisarSemana(db, '2026-11-02');
  const rep = alertasDe(a, 'nova').filter((x) => x.regra === 'repeticao');
  assert.equal(rep.length, 1);
  assert.equal(rep[0].parecidaCom.id, 'antiga');
  assert.match(rep[0].texto, /mesmo pilar 11/);
  const ang = alertasDe(a, 'p8-nova').find((x) => x.regra === 'angulo');
  assert.equal(ang.parecidaCom.id, 'p8-antiga');
  assert.match(ang.texto, /"Preço fechado"/);
  assert.ok(!alertasDe(a, 'p8-bh').some((x) => x.regra === 'angulo'), 'Daqui de BH saiu há 5 semanas: pode');
  // o pilar 8 duas vezes na semana
  assert.ok(alertasDe(a, 'p8-nova').some((x) => x.regra === 'pilar-semana'));
  assert.ok(alertasDe(a, 'p8-bh').some((x) => x.regra === 'pilar-semana'));
  // pilar 8 sem ângulo: info
  db.reels.push(peca('p8-sem', '2026-10-20', 'reel', 8, 'Diferencial', 'Algo do diferencial'));
  assert.equal(analisarSemana(db, '2026-10-19').pecas['p8-sem'].find((x) => x.regra === 'angulo').nivel, 'info');
  // a exceção junta tudo num info só
  db.reels.find((r) => r.id === 'p8-nova').excecaoAntiRepeticao = { ativa: true, motivo: 'Pedido do Pedro: reforçar o preço fechado na abertura.' };
  const b = analisarSemana(db, '2026-11-02');
  assert.deepEqual(alertasDe(b, 'p8-nova'), []);
  assert.equal(b.pecas['p8-nova'][0].texto, 'Repetição de propósito: Pedido do Pedro: reforçar o preço fechado na abertura.');
  assert.equal(b.pecas['p8-nova'][0].repete.length, 2);
  // sem repetição: um "ok"
  assert.equal(b.pecas['p8-bh'].some((x) => x.nivel === 'ok'), false);
  const limpo = analisarSemana({ reels: [peca('so', '2026-11-03', 'reel', 4, 'Educação', 'A papelada que trava o mês')], stories: [] }, '2026-11-02');
  assert.equal(limpo.pecas.so[0].nivel, 'ok');
});

test('mecanismo: stories ligado à peça do dia com o mesmo pilar não conta como repetição', () => {
  const db = {
    reels: [peca('r1', '2026-11-03', 'carrossel', 12, 'Conversão', 'Pró-labore no automático')],
    stories: [dia('s1', '2026-11-03', 12, 'Conversão', 'Enquete do pró-labore fixo', { pecaDoDia: 'r1' })],
  };
  assert.deepEqual(alertasDe(analisarSemana(db, '2026-11-02'), 's1'), []);
  db.stories[0].pecaDoDia = null;
  assert.ok(alertasDe(analisarSemana(db, '2026-11-02'), 's1').some((x) => x.regra === 'pilar-semana'));
});

test('mecanismo: o teaser nos stories não é repetição do post do dia a que está ligado (21/10)', () => {
  const db = {
    reels: [
      peca('car', '2026-11-03', 'carrossel', 5, 'Educação', 'Mito: abrir empresa sempre exige cartório e despachante'),
      peca('p8', '2026-11-05', 'estatico', 8, 'Diferencial', 'Preço que você vê é o que paga', { angulo: 'Preço fechado' }),
    ],
    stories: [
      dia('teaser', '2026-11-03', 5, 'Educação', 'Teaser do carrossel: abrir empresa exige cartório e despachante? Enquete', { pecaDoDia: 'car' }),
      dia('s8', '2026-11-05', 8, 'Diferencial', 'Enquete: o preço que você vê é o que paga?', { pecaDoDia: 'p8', angulo: 'Preço fechado' }),
    ],
  };
  const a = analisarSemana(db, '2026-11-02');
  for (const id of ['car', 'teaser', 'p8', 's8']) assert.deepEqual(alertasDe(a, id), [], id);
  // sem a ligação, o texto parecido e o ângulo repetido voltam a ser alerta, nos dois
  for (const s of db.stories) s.pecaDoDia = null;
  const b = analisarSemana(db, '2026-11-02');
  assert.ok(alertasDe(b, 'car').some((x) => x.regra === 'repeticao' && x.parecidaCom.id === 'teaser'));
  assert.ok(alertasDe(b, 'teaser').some((x) => x.regra === 'repeticao'));
  assert.ok(alertasDe(b, 's8').some((x) => x.regra === 'angulo'));
  // ligado a outra peça não isenta: o stories de 03/11 ligado ao estático ainda é parecido com o carrossel
  db.stories[0].pecaDoDia = 'p8';
  assert.ok(alertasDe(analisarSemana(db, '2026-11-02'), 'teaser').some((x) => x.regra === 'repeticao' && x.parecidaCom.id === 'car'));
});

test('mecanismo: convite de venda em post de atração, pilar guardado, mix e teto da oferta', () => {
  const db = {
    reels: [
      peca('afeto', '2026-11-03', 'reel', 2, 'Afeto', 'Humor do fim do mês', { legenda: 'Manda pra quem vive isso 😅\nO resto da legenda.\nEntra na lista de espera pelo link da bio 💛' }),
      peca('edu', '2026-11-04', 'carrossel', 4, 'Educação', 'A papelada do mês', { carrossel: { final: { titulo: 'Assine agora', texto: '' } } }),
      peca('edu-ok', '2026-11-05', 'carrossel', 16, 'Educação', 'Separar o dinheiro da empresa', { legenda: 'Salva pra quando precisar 📌\nDica de preço do seu serviço no meio, sem ser convite.\nManda pra quem tá começando 💬' }),
      peca('venda', '2026-11-06', 'estatico', 10, 'Conversão', 'O preço do plano', { estatico: { cta: 'Garanta o preço promocional' }, legenda: 'R$ 99 por 3 meses' }),
      peca('guardado', '2026-11-07', 'reel', 6, 'Educação', 'Calendário fiscal'),
    ],
    stories: [],
  };
  const a = analisarSemana(db, '2026-11-02');
  assert.match(alertasDe(a, 'afeto').find((x) => x.regra === 'convite').texto, /^Post de atração não leva convite de venda/);
  assert.ok(alertasDe(a, 'edu').some((x) => x.regra === 'convite'));
  assert.ok(!alertasDe(a, 'edu-ok').some((x) => x.regra === 'convite'), 'preço no meio da legenda não é a CTA');
  assert.ok(!alertasDe(a, 'venda').some((x) => x.regra === 'convite'));
  assert.ok(alertasDe(a, 'guardado').some((x) => x.regra === 'pilar-guardado'));
  // 5 itens: Educação 3 (60%), fora da fatia; oferta 1 de 5 (20%) dentro dos 30% da promoção
  assert.equal(a.mix.Educação.pct, 60);
  assert.equal(a.mix.Educação.ok, false);
  assert.ok(a.alertas.some((t) => t.startsWith('Educação: 60%')));
  assert.deepEqual(a.oferta, { n: 1, pct: 20, teto: 30, ok: true, naPromocao: true });
  // depois da promoção (semana que começa em 2027) o teto é 20%
  const depois = { reels: db.reels.map((r, i) => ({ ...r, data: `2027-01-0${4 + i}` })), stories: [] };
  const b = analisarSemana(depois, '2027-01-04');
  assert.deepEqual([b.oferta.teto, b.oferta.naPromocao], [20, false]);
  db.reels.push(peca('venda2', '2026-11-08', 'reel', 10, 'Conversão', 'Outra oferta'));
  const c = analisarSemana(db, '2026-11-02');
  assert.equal(c.oferta.pct, 33);
  assert.ok(c.alertas.some((t) => t.startsWith('Oferta (pilar 10) em 33%')));
  // volume
  assert.ok(c.alertas.some((t) => t === 'Faltam 5 temas de stories: 0 de 5.'));
  for (const t of c.alertas) assert.doesNotMatch(t, TRACO);
});

test('mecanismo: o histórico pra IA e semana inválida', () => {
  const h = historicoParaIa(semana2610(), '2026-11-02');
  assert.match(h, /2026-10-26 · carrossel · pilar 4/);
  assert.match(h, /2026-10-31 · stories · pilar 10/);
  assert.throws(() => analisarSemana({}, '26/10/2026'), (e) => e.status === 400);
  assert.deepEqual(analisarSemana({}, '2026-11-02').itens, []);
});

test('validar: os campos da estratégia na peça e nos stories', () => {
  const r = conferirReel({ angulo: 'gente desde a entrada', mecanica: 'resposta-caixinha', excecaoAntiRepeticao: { ativa: true, motivo: `  contagem ${String.fromCharCode(0x2014)} regressiva ` }, gatilhoEmocional: 'cansaço da burocracia', gatilhoPsicologico: 'curiosidade', versoesAnteriores: [{ x: 1 }], origem: 'gerador-semana' });
  assert.equal(r.angulo, 'Gente desde a entrada');
  assert.equal(r.mecanica, 'resposta-caixinha');
  assert.deepEqual(r.excecaoAntiRepeticao, { ativa: true, motivo: 'contagem, regressiva' });
  assert.ok(!('versoesAnteriores' in r) && !('origem' in r), 'versoesAnteriores e origem são do servidor');
  assert.equal(conferirReel({ excecaoAntiRepeticao: null }).excecaoAntiRepeticao, null);
  assert.equal(conferirReel({ excecaoAntiRepeticao: '' }).excecaoAntiRepeticao, null);
  assert.deepEqual(conferirReel({ excecaoAntiRepeticao: { ativa: false, motivo: '' } }).excecaoAntiRepeticao, { ativa: false, motivo: '' });
  assert.equal(conferirReel({ mecanica: '' }).mecanica, null);
  assert.equal(conferirReel({ angulo: '' }).angulo, '');
  const erro400 = (e) => e.status === 400;
  assert.throws(() => conferirReel({ angulo: 'preço justo' }), erro400);
  assert.throws(() => conferirReel({ mecanica: 'enquete' }), erro400);
  assert.throws(() => conferirReel({ excecaoAntiRepeticao: { ativa: true, motivo: '' } }), erro400);
  assert.throws(() => conferirReel({ excecaoAntiRepeticao: { ativa: 'sim', motivo: 'x' } }), erro400);
  assert.throws(() => conferirReel({ excecaoAntiRepeticao: { ativa: true, motivo: 'x'.repeat(501) } }), erro400);
  assert.throws(() => conferirReel({ gatilhoEmocional: 'x'.repeat(101) }), erro400);
  assert.throws(() => conferirReel({ angulo: 'x'.repeat(101) }), erro400);
  // stories: os campos novos entram em CAMPOS_STORIES e saem do conferirStoriesDia (vazios quando não vêm)
  for (const k of ['excecaoAntiRepeticao', 'mecanica', 'angulo', 'gatilhoEmocional', 'gatilhoPsicologico']) assert.ok(CAMPOS_STORIES.includes(k), k);
  const base = { data: '2026-10-26', objetivo: 'engajamento', pilar: null, pilarTexto: 'Mecânica recorrente', tema: 'Caixinha', quadros: [] };
  const s = conferirStoriesDia(null, base);
  assert.deepEqual([s.excecaoAntiRepeticao, s.mecanica, s.angulo, s.gatilhoEmocional, s.gatilhoPsicologico], [null, null, '', '', '']);
  const s2 = conferirStoriesDia(null, { mecanica: 'caixinha', excecaoAntiRepeticao: { ativa: true, motivo: MOTIVO_31 } }, { ...base, ...s });
  assert.equal(s2.mecanica, 'caixinha');
  assert.equal(s2.excecaoAntiRepeticao.motivo, MOTIVO_31, 'o motivo do calendário passa sem mudar');
  assert.equal(s2.tema, 'Caixinha', 'edição parcial mantém o resto');
  assert.throws(() => conferirStoriesDia(null, { ...base, mecanica: 'sorteio' }), erro400);
});
