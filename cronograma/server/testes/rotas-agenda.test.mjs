// Testes da agenda (tarefasDevidas), das rotas de Métricas (resolução e leitura do corpo) e do motor do semanal
// (node --test). Só módulos sem disco na carga: agenda.mjs e metricas-rotas.mjs importam os outros na hora de
// rodar. Rodar: npm run testar
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  tarefasDevidas, proximasExecucoes, TAREFAS, semanalPendente, anunciosProntos, falhaDaLeituraPublico,
} from '../agenda.mjs';
import {
  resolverRota, lerReelDoCorpo, lerTag, lerNumeros, lerImpulsionado, lerMidiaIds, lerHipotese, lerConta, lerToken,
  lerImagens, lerSemana, lerDias, LIMITE_PRINT, MSG_PRINT_GRANDE, corpoDoPrint, rota,
} from '../metricas-rotas.mjs';
import {
  numerosDoTexto, conferirFrases, postsDaSemana, montarRelatorio, semanaValida, semanaAnteriorDe, seguidoresDaSemana,
  naoSeguidoresDaSemana, storiesDaSemana, numerosDaSemana, situacaoRelatorio, marcosDaSemana,
} from '../relatorio-motor.mjs';

const TRACO = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const H = 3_600_000;
// hora de Brasília (UTC-3, sem horário de verão) em ms
const brt = (dia, hora = 12, minuto = 0) => Date.parse(`${dia}T${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00-03:00`);
const iso = (ms) => new Date(ms).toISOString();
const falhaCom = (status) => (e) => e.status === status;

// ---------- agenda ----------

test('agenda: nada rodou ainda, conectado e sem conta de anúncios', () => {
  const agora = brt('2026-10-06', 10); // terça
  assert.deepEqual(tarefasDevidas({}, agora, { conectado: true, semanaAnteriorTemRelatorio: true }), ['sincronizar', 'hipoteses', 'stories', 'publico']);
  assert.deepEqual(tarefasDevidas({}, agora, { conectado: false, semanaAnteriorTemRelatorio: true }), []);
  assert.deepEqual(TAREFAS, ['sincronizar', 'hipoteses', 'stories', 'publico', 'anuncios', 'relatorio']);
});

test('agenda: sincronizar a cada 3h (sucesso ou falha) e só conectado', () => {
  const agora = brt('2026-10-06', 15);
  const base = { conectado: true, semanaAnteriorTemRelatorio: true };
  const devidas = (ultimas, extra = {}) => tarefasDevidas(ultimas, agora, { ...base, ...extra });
  assert.ok(!devidas({ sincronizar: { em: iso(agora - 2.9 * H), ok: true } }).includes('sincronizar'));
  assert.ok(devidas({ sincronizar: { em: iso(agora - 3 * H), ok: true } }).includes('sincronizar'));
  assert.ok(!devidas({ sincronizar: { em: iso(agora - 1 * H), ok: false, erro: 'x' } }).includes('sincronizar'), 'falha também conta');
  assert.ok(devidas({ sincronizar: { em: iso(agora - 4 * H), ok: false, erro: 'x' } }).includes('sincronizar'));
  assert.ok(!devidas({ sincronizar: { em: iso(agora - 5 * H), ok: true } }, { conectado: false }).includes('sincronizar'));
  // "Sincronizar agora" de alguém há 1h: a agenda não lê de novo
  assert.ok(!devidas({ sincronizar: { em: iso(agora - 5 * H), ok: true } }, { ultimaSincronizacao: iso(agora - H) }).includes('sincronizar'));
});

test('agenda: hipóteses depois de cada sincronização', () => {
  const agora = brt('2026-10-06', 15);
  const base = { conectado: true, semanaAnteriorTemRelatorio: true };
  const ultimas = { sincronizar: { em: iso(agora - H), ok: true }, stories: { em: iso(agora - 0.5 * H), ok: true }, publico: { em: iso(agora - 2 * H), ok: true } };
  // leitura nova (manual ou da agenda) ainda não avaliada
  assert.ok(tarefasDevidas({ ...ultimas, hipoteses: { em: iso(agora - 2 * H), ok: true } }, agora, { ...base, ultimaSincronizacao: iso(agora - H) }).includes('hipoteses'));
  // já avaliada depois da última leitura
  assert.deepEqual(tarefasDevidas({ ...ultimas, hipoteses: { em: iso(agora - 0.9 * H), ok: true } }, agora, { ...base, ultimaSincronizacao: iso(agora - H) }), []);
  // a sincronização vai rodar agora: as hipóteses vêm logo depois
  const devidas = tarefasDevidas({ hipoteses: { em: iso(agora - H), ok: true } }, agora, base);
  assert.equal(devidas.indexOf('hipoteses'), devidas.indexOf('sincronizar') + 1);
});

test('agenda: stories a cada 1h', () => {
  const agora = brt('2026-10-06', 15);
  const base = { conectado: true, semanaAnteriorTemRelatorio: true };
  assert.ok(!tarefasDevidas({ stories: { em: iso(agora - 59 * 60_000), ok: true } }, agora, base).includes('stories'));
  assert.ok(tarefasDevidas({ stories: { em: iso(agora - 60 * 60_000), ok: false, erro: 'x' } }, agora, base).includes('stories'));
  assert.ok(!tarefasDevidas({}, agora, { ...base, conectado: false }).includes('stories'));
});

test('agenda: público a cada 20h ou quando vira o dia em Brasília', () => {
  const base = { conectado: true, semanaAnteriorTemRelatorio: true };
  // 23h50 de ontem e agora 00h10: 20 minutos, mas virou o dia
  assert.ok(tarefasDevidas({ publico: { em: iso(brt('2026-10-05', 23, 50)), ok: true } }, brt('2026-10-06', 0, 10), base).includes('publico'));
  // 00h10 de hoje e agora 19h: mesmo dia, 18h50
  assert.ok(!tarefasDevidas({ publico: { em: iso(brt('2026-10-06', 0, 10)), ok: true } }, brt('2026-10-06', 19), base).includes('publico'));
  // 00h10 de hoje e agora 20h15: passou de 20h
  assert.ok(tarefasDevidas({ publico: { em: iso(brt('2026-10-06', 0, 10)), ok: true } }, brt('2026-10-06', 20, 15), base).includes('publico'));
  // 22h UTC do dia 5 ainda é dia 5 em Brasília (19h): às 23h de Brasília do dia 5, não virou
  assert.ok(!tarefasDevidas({ publico: { em: '2026-10-05T22:00:00.000Z', ok: true } }, brt('2026-10-05', 23), base).includes('publico'));
  // diaAtual explícito vence o do relógio
  assert.ok(tarefasDevidas({ publico: { em: iso(brt('2026-10-06', 9)), ok: true } }, brt('2026-10-06', 10), { ...base, diaAtual: '2026-10-07' }).includes('publico'));
});

test('agenda: anúncios a cada 12h, só com a conta escolhida', () => {
  const agora = brt('2026-10-06', 15);
  const base = { conectado: true, semanaAnteriorTemRelatorio: true };
  assert.ok(!tarefasDevidas({}, agora, { ...base, contaAnuncios: false }).includes('anuncios'));
  assert.ok(tarefasDevidas({}, agora, { ...base, contaAnuncios: true }).includes('anuncios'));
  assert.ok(!tarefasDevidas({ anuncios: { em: iso(agora - 11 * H), ok: true } }, agora, { ...base, contaAnuncios: true }).includes('anuncios'));
  assert.ok(tarefasDevidas({ anuncios: { em: iso(agora - 12 * H), ok: true } }, agora, { ...base, contaAnuncios: true }).includes('anuncios'));
  // anúncios não dependem do Instagram conectado (o token de usuário é outro)
  assert.deepEqual(tarefasDevidas({}, agora, { conectado: false, contaAnuncios: true, semanaAnteriorTemRelatorio: true }), ['anuncios']);
});

test('agenda: semanal a partir de segunda 7h, depois de uma leitura dos posts feita com a semana já acabada', () => {
  const devido = (agora, opcoes, ultimas = {}) => tarefasDevidas(ultimas, agora, { conectado: false, ...opcoes }).includes('relatorio');
  const sem = { semanaAnteriorTemRelatorio: false };
  const leuHoje = { ...sem, ultimaSincronizacao: iso(brt('2026-10-05', 4)) }; // segunda 05/10, 4h: depois do fim da W40
  const leuDomingo = { ...sem, ultimaSincronizacao: iso(brt('2026-10-04', 22)) };
  assert.ok(!devido(brt('2026-10-05', 6, 59), leuHoje), 'segunda antes das 7h');
  assert.ok(devido(brt('2026-10-05', 7, 0), leuHoje));
  assert.ok(!devido(brt('2026-10-05', 9), { semanaAnteriorTemRelatorio: true, ultimaSincronizacao: iso(brt('2026-10-05', 8)) }));
  // a última leitura é de domingo (Instagram caído ou leitura falhando): espera, pra não gravar sem os posts do fim
  assert.ok(!devido(brt('2026-10-05', 7, 0), leuDomingo));
  assert.ok(!devido(brt('2026-10-06', 6, 59), leuDomingo));
  // sem leitura até terça 7h: sai assim mesmo, com o aviso da data da leitura (e é gerado de novo quando ela chegar)
  assert.ok(devido(brt('2026-10-06', 7, 0), leuDomingo));
  // computador desligado na segunda: gera na terça
  assert.ok(devido(brt('2026-10-06', 9), sem));
  // falhou há 1h: espera; há 4h: tenta de novo
  const falhou = { relatorio: { em: iso(brt('2026-10-05', 8)), ok: false, erro: 'x' } };
  assert.ok(!devido(brt('2026-10-05', 9), leuHoje, falhou));
  assert.ok(devido(brt('2026-10-05', 12), leuHoje, falhou));
});

test('agenda: semanal gravado parcial, desatualizado ou com peça provisória é gerado de novo', () => {
  const agora = brt('2026-10-05', 9); // segunda da 2026-W41: anterior W40, retrasada W39
  const leu = iso(brt('2026-10-05', 8));
  const antes = iso(brt('2026-10-04', 20));
  const pend = (semanal, ultimaSincronizacao, quando = agora) => semanalPendente(quando, { semanal, ultimaSincronizacao });
  assert.deepEqual(pend({ anterior: 'falta', retrasada: 'fechado' }, leu).semanas, ['2026-W40']);
  // a anterior provisória é o normal da segunda (fecha na segunda seguinte); a retrasada provisória fecha agora
  assert.deepEqual(pend({ anterior: 'provisorio', retrasada: 'provisorio' }, leu).semanas, ['2026-W39']);
  assert.deepEqual(pend({ anterior: 'parcial', retrasada: 'desatualizado' }, leu).semanas, ['2026-W40', '2026-W39']);
  assert.deepEqual(pend({ anterior: 'fechado', retrasada: 'fechado' }, leu), { semanas: [], aguardando: [] });
  // sem leitura depois que as peças da retrasada fizeram 7 dias: espera (gerar de novo daria o mesmo número)
  assert.deepEqual(pend({ anterior: 'fechado', retrasada: 'provisorio' }, antes), { semanas: [], aguardando: [{ semana: '2026-W39', ate: null }] });
  assert.deepEqual(pend({ anterior: 'falta', retrasada: 'fechado' }, antes).aguardando, [{ semana: '2026-W40', ate: brt('2026-10-06', 7) }]);
  // a anterior desatualizada já saiu com aviso: só uma leitura nova a gera de novo (nada de um resumo igual a cada giro)
  const terca = brt('2026-10-06', 10);
  assert.deepEqual(pend({ anterior: 'desatualizado' }, antes, terca).semanas, []);
  assert.deepEqual(pend({ anterior: 'parcial' }, antes, terca).semanas, ['2026-W40']);
  assert.deepEqual(pend({ anterior: 'desatualizado' }, iso(brt('2026-10-06', 9)), terca).semanas, ['2026-W40']);
  // na decisão: só a retrasada pendente já faz a tarefa ser devida
  const devidas = (ultimaSincronizacao) => tarefasDevidas({ hipoteses: { em: iso(agora), ok: true } }, agora, { semanal: { anterior: 'fechado', retrasada: 'provisorio' }, ultimaSincronizacao });
  assert.deepEqual(devidas(leu), ['relatorio']);
  assert.deepEqual(devidas(antes), []);
});

test('agenda: o ciclo do semanal com o motor (gerado na segunda, fechado na segunda seguinte, e não volta)', () => {
  const post = (id, dia) => ({ midiaId: id, dia, peca: 'reel', tipo: 'ensino', objetivo: { valor: 3, base: 1, meta: 3, score: 1, bateuMeta: true, provisorio: dia > '2026-09-28' } });
  const posts = [post('1', '2026-09-28'), post('2', '2026-10-02'), post('3', '2026-10-04')];
  // segunda 05/10, 8h: a W40 sai com 2 peças provisórias
  const primeiro = montarRelatorio({ semana: '2026-W40', posts, geradoEm: iso(brt('2026-10-05', 8)), lidoEm: iso(brt('2026-10-05', 7)), hoje: '2026-10-05' });
  assert.equal(primeiro.resumo.provisorias, 2);
  assert.equal(situacaoRelatorio(primeiro), 'provisorio');
  assert.deepEqual(semanalPendente(brt('2026-10-05', 9), { semanal: { anterior: situacaoRelatorio(primeiro) }, ultimaSincronizacao: iso(brt('2026-10-05', 8)) }).semanas, []);
  // segunda 12/10: a W40 é a retrasada e todas as peças já fizeram 7 dias
  assert.deepEqual(semanalPendente(brt('2026-10-12', 8), { semanal: { anterior: 'falta', retrasada: situacaoRelatorio(primeiro) }, ultimaSincronizacao: iso(brt('2026-10-12', 7)) }).semanas, ['2026-W41', '2026-W40']);
  // gerado de novo depois dos 7 dias: fechado, mesmo que uma peça tenha ficado sem a leitura dos 7 dias
  const segundo = montarRelatorio({ semana: '2026-W40', posts: [posts[0], { ...posts[1], objetivo: { ...posts[1].objetivo, provisorio: false } }, posts[2]], geradoEm: iso(brt('2026-10-12', 8)), lidoEm: iso(brt('2026-10-12', 7)), hoje: '2026-10-12' });
  assert.equal(segundo.resumo.provisorias, 1);
  assert.equal(situacaoRelatorio(segundo), 'fechado');
  assert.deepEqual(semanalPendente(brt('2026-10-12', 9), { semanal: { anterior: 'fechado', retrasada: situacaoRelatorio(segundo) }, ultimaSincronizacao: iso(brt('2026-10-12', 8)) }).semanas, []);
});

test('agenda: público que falhou tenta de novo em 1h, sem esperar o dia virar', () => {
  const base = { conectado: true, semanaAnteriorTemRelatorio: true };
  const falhou = { publico: { em: iso(brt('2026-10-06', 8, 2)), ok: false, erro: 'A leitura do público parou no meio' } };
  assert.ok(!tarefasDevidas(falhou, brt('2026-10-06', 8, 32), base).includes('publico'));
  assert.ok(tarefasDevidas(falhou, brt('2026-10-06', 9, 2), base).includes('publico'));
  // com sucesso, o mesmo horário só volta com 20h ou na virada do dia
  const ok = { publico: { em: iso(brt('2026-10-06', 8, 2)), ok: true } };
  assert.ok(!tarefasDevidas(ok, brt('2026-10-06', 18, 59), base).includes('publico'));
  assert.ok(!tarefasDevidas(falhou, brt('2026-10-06', 9), { ...base, conectado: false }).includes('publico'));
  assert.equal(proximasExecucoes(falhou, brt('2026-10-06', 8, 32), base).publico, iso(brt('2026-10-06', 9, 2)));
});

test('agenda: leitura do público cortada é falha, e anúncios só com o token dos anúncios valendo', () => {
  assert.equal(falhaDaLeituraPublico({ lidos: 40, recusas: 1, limitado: null, avisos: [] }), null);
  assert.match(falhaDaLeituraPublico({ lidos: 3, limitado: 'A Meta não respondeu a tempo.' }), /parou no meio e tenta de novo em 1 hora\. A Meta não respondeu a tempo\./);
  assert.match(falhaDaLeituraPublico({ lidos: 0, recusas: 0, limitado: null }), /Nenhum número do público veio da Meta/);
  assert.equal(falhaDaLeituraPublico(undefined), null);
  assert.equal(anunciosProntos({ conta: { id: 'act_1' } }, true), true);
  assert.equal(anunciosProntos({ conta: { id: 'act_1' } }, false), false, 'token recusado ou vencido');
  assert.equal(anunciosProntos({ conta: { id: 'act_1' } }), true, 'sem como saber do token: vale a conta');
  assert.equal(anunciosProntos({ conta: null }, true), false);
  assert.equal(anunciosProntos(null, true), false);
});

test('agenda: próxima execução do semanal que espera a leitura dos posts', () => {
  const agora = brt('2026-10-05', 8);
  const esperando = { contaAnuncios: false, semanal: { anterior: 'falta', retrasada: 'fechado' }, ultimaSincronizacao: iso(brt('2026-10-04', 22)) };
  // a leitura da agenda falhou às 7h30: a próxima (10h30) é a que libera o semanal
  const u = { sincronizar: { em: iso(brt('2026-10-05', 7, 30)), ok: false, erro: 'rede' } };
  assert.equal(proximasExecucoes(u, agora, { ...esperando, conectado: true }).relatorio, iso(brt('2026-10-05', 10, 30)));
  // Instagram desconectado: terça 7h, com aviso
  assert.equal(proximasExecucoes(u, agora, { ...esperando, conectado: false }).relatorio, iso(brt('2026-10-06', 7)));
  // já com leitura depois da meia-noite: no próximo giro
  assert.equal(proximasExecucoes({}, agora, { ...esperando, conectado: false, ultimaSincronizacao: iso(brt('2026-10-05', 6)) }).relatorio, iso(agora));
  // nada pendente: a próxima segunda 7h
  assert.equal(proximasExecucoes({}, agora, { ...esperando, conectado: false, semanal: { anterior: 'provisorio', retrasada: 'fechado' } }).relatorio, iso(brt('2026-10-12', 7)));
});

test('agenda: próximas execuções', () => {
  const agora = brt('2026-10-06', 15);
  const ctx = { conectado: true, contaAnuncios: false, semanaAnteriorTemRelatorio: true, ultimaSincronizacao: iso(agora - H) };
  const ultimas = { sincronizar: { em: iso(agora - H), ok: true }, hipoteses: { em: iso(agora - 0.5 * H), ok: true }, publico: { em: iso(brt('2026-10-06', 1)), ok: true } };
  const p = proximasExecucoes(ultimas, agora, ctx);
  assert.equal(p.sincronizar, iso(agora + 2 * H));
  assert.equal(p.hipoteses, p.sincronizar, 'avaliadas depois da última leitura: esperam a próxima');
  // leitura ainda não avaliada: já no próximo giro
  assert.equal(proximasExecucoes({ ...ultimas, hipoteses: undefined }, agora, ctx).hipoteses, iso(agora));
  assert.equal(p.stories, iso(agora));
  assert.equal(p.publico, iso(brt('2026-10-06', 21)));
  assert.equal(p.anuncios, null);
  assert.equal(p.relatorio, iso(brt('2026-10-12', 7)));
  assert.deepEqual(Object.values(proximasExecucoes({}, agora, null)), TAREFAS.map(() => null));
});

// ---------- rotas ----------

test('rotas: caminho, método e ids', () => {
  assert.deepEqual(resolverRota('GET', ['diagnostico']), { acao: 'diagnostico', params: {} });
  assert.equal(resolverRota('POST', ['diagnostico']).status, 405);
  assert.equal(resolverRota('GET', ['nada']).status, 404);
  assert.equal(resolverRota('GET', []).status, 404);
  assert.equal(resolverRota('GET', ['__proto__']).status, 404);
  assert.deepEqual(resolverRota('GET', ['post', '17912345678901234']), { acao: 'post', params: { midia: '17912345678901234' } });
  assert.equal(resolverRota('GET', ['post', 'abc']).status, 400);
  assert.equal(resolverRota('GET', ['post', '1'.repeat(41)]).status, 400);
  assert.equal(resolverRota('GET', ['post', '12/../x']).status, 400);
  assert.equal(resolverRota('PUT', ['post', '123', 'vinculo']).acao, 'vinculo');
  assert.equal(resolverRota('GET', ['post', '123', 'vinculo']).status, 405);
  assert.equal(resolverRota('PUT', ['post', '123', 'outra']).status, 404);
  assert.equal(resolverRota('GET', ['recomendacoes', 'reel_ab12cd34']).acao, 'recomendacoes');
  assert.equal(resolverRota('GET', ['recomendacoes', 'REEL_AB12']).acao, 'recomendacoes');
  assert.equal(resolverRota('GET', ['recomendacoes', 'reel_!!']).status, 400);
  assert.equal(resolverRota('GET', ['recomendacoes', 'ide_ab12cd34']).status, 400);
  assert.equal(resolverRota('DELETE', ['hipoteses', 'hip_1a2b3c4d']).acao, 'apagarHipotese');
  assert.equal(resolverRota('DELETE', ['hipoteses', '../x']).status, 400);
  assert.equal(resolverRota('POST', ['hipoteses']).acao, 'criarHipotese');
  assert.equal(resolverRota('PUT', ['publico', 'post', '99']).acao, 'publicoPost');
  assert.equal(resolverRota('DELETE', ['publico', 'post', '99']).acao, 'publicoPostApagar');
  assert.equal(resolverRota('POST', ['publico', 'post', '99', 'print']).acao, 'printIniciar');
  assert.equal(resolverRota('GET', ['publico', 'post', '99', 'print']).acao, 'printEstado');
  assert.equal(resolverRota('GET', ['semanal', 'leitura']).acao, 'leituraEstado');
  assert.equal(resolverRota('POST', ['agenda', 'sincronizar']).acao, 'agendaRodar');
  assert.equal(resolverRota('POST', ['agenda', 'formatar-disco']).status, 404);
  assert.equal(resolverRota('GET', ['agenda', 'sincronizar']).status, 405);
  assert.equal(resolverRota('HEAD', ['agenda']).status, 405);
  assert.equal(resolverRota('GET', ['post', '1']).acao, 'post');
  assert.equal(resolverRota('GET', ['post', '12a']).status, 400);
  assert.equal(resolverRota('GET', ['post', '']).status, 400);
  assert.equal(resolverRota('GET', ['recomendacoes', 'reel_abcd']).acao, 'recomendacoes');
  assert.equal(resolverRota('GET', ['recomendacoes', 'reel_abc']).status, 400);
  assert.equal(resolverRota('GET', ['recomendacoes', `reel_${'a'.repeat(21)}`]).status, 400);
});

test('rotas: corpo do vínculo, da tag, dos números e do anúncio', () => {
  assert.equal(lerReelDoCorpo({ reelId: null }), null);
  assert.equal(lerReelDoCorpo({ reelId: '' }), null);
  assert.equal(lerReelDoCorpo({ reelId: 'reel_ab12cd34' }), 'reel_ab12cd34');
  assert.throws(() => lerReelDoCorpo({}), falhaCom(400));
  assert.throws(() => lerReelDoCorpo({ reelId: 'reel_x' }), falhaCom(400));
  assert.throws(() => lerReelDoCorpo({ reelId: 5 }), falhaCom(400));

  assert.deepEqual(lerTag({ dimensao: 'ganchoForma', valor: 'pergunta' }), { dimensao: 'ganchoForma', valor: 'pergunta' });
  assert.deepEqual(lerTag({ dimensao: 'pilar', valor: 4 }), { dimensao: 'pilar', valor: '4' });
  assert.deepEqual(lerTag({ dimensao: 'humor', valor: false }), { dimensao: 'humor', valor: false });
  assert.deepEqual(lerTag({ dimensao: 'humor', valor: null }), { dimensao: 'humor', valor: null });
  assert.throws(() => lerTag({ dimensao: 'x y', valor: 'a' }), falhaCom(400));
  assert.throws(() => lerTag({ dimensao: 'humor' }), falhaCom(400));
  assert.throws(() => lerTag({ dimensao: 'cta', valor: { $ne: 1 } }), falhaCom(400));

  assert.deepEqual(lerNumeros({ follows: 3, cadastros: '1.234', lixo: 9 }), { follows: 3, cadastros: 1234 });
  assert.deepEqual(lerNumeros({ follows: null, profileVisits: '' }), { follows: null, profileVisits: null });
  assert.throws(() => lerNumeros({ follows: -1 }), falhaCom(400));
  assert.throws(() => lerNumeros({ follows: 1.5 }), falhaCom(400));
  assert.throws(() => lerNumeros({ follows: '1,5' }), falhaCom(400));
  assert.throws(() => lerNumeros({}), falhaCom(400));

  assert.equal(lerImpulsionado({ valor: true }), true);
  assert.equal(lerImpulsionado({ valor: null }), null);
  assert.throws(() => lerImpulsionado({}), falhaCom(400));
  assert.throws(() => lerImpulsionado({ valor: 'sim' }), falhaCom(400));

  assert.equal(lerMidiaIds({}), null);
  assert.deepEqual(lerMidiaIds({ midiaIds: ['1', 2, '1'] }), ['1', '2']);
  assert.throws(() => lerMidiaIds({ midiaIds: [] }), falhaCom(400));
  assert.throws(() => lerMidiaIds({ midiaIds: ['x'] }), falhaCom(400));
  assert.throws(() => lerMidiaIds({ midiaIds: '1' }), falhaCom(400));

  assert.deepEqual(lerHipotese({ reelId: 'reel_ab12cd34', insightId: 'ins_ganchoForma_pergunta' }), { reelId: 'reel_ab12cd34', insightId: 'ins_ganchoForma_pergunta' });
  assert.throws(() => lerHipotese({ reelId: 'reel_ab12cd34' }), falhaCom(400));
  assert.throws(() => lerHipotese({ reelId: 'x', insightId: 'ins_a' }), falhaCom(400));

  assert.equal(lerConta({ contaId: 'act_123' }), 'act_123');
  assert.equal(lerConta({ contaId: '123' }), 'act_123');
  assert.throws(() => lerConta({ contaId: 'act_12a' }), falhaCom(400));
  assert.equal(lerToken({ token: '  EAAB123  ' }), 'EAAB123');
  assert.throws(() => lerToken({ token: '' }), falhaCom(400));

  assert.deepEqual(lerImagens({ imagens: ['data:image/png;base64,AAAA'] }), ['data:image/png;base64,AAAA']);
  assert.throws(() => lerImagens({ imagens: [] }), falhaCom(400));
  assert.throws(() => lerImagens({ imagens: Array(4).fill('data:image/png;base64,AAAA') }), falhaCom(400));
  assert.throws(() => lerImagens({ imagens: ['data:text/html;base64,AAAA'] }), falhaCom(400));
  assert.throws(() => lerImagens({ imagens: [`data:image/jpeg;base64,${'A'.repeat(5_700_000)}`] }), falhaCom(413));
});

test('rotas: semana e dias da query', () => {
  assert.equal(lerSemana('2026-W40'), '2026-W40');
  assert.equal(lerSemana('2026-W53'), '2026-W53');
  assert.equal(lerSemana(null), null);
  assert.throws(() => lerSemana(null, { obrigatoria: true }), falhaCom(400));
  for (const ruim of ['2025-W53', '2026-W54', '2026-W00', '2026-40', '2026-W4', 'x']) assert.throws(() => lerSemana(ruim), falhaCom(400), ruim);
  assert.equal(lerDias(undefined), 14);
  assert.equal(lerDias('30'), 30);
  for (const ruim of ['0', '91', 'abc', '1e1', '-3']) assert.throws(() => lerDias(ruim), falhaCom(400), ruim);
});

test('rotas: print com até 12 MB de imagens juntas, e o 413 diz o que fazer (C7)', async () => {
  assert.equal(LIMITE_PRINT, 12 * 1024 * 1024 + 64 * 1024);
  // 3 prints de uns 3,2 MB cada: cada um passa dos 4 MB? não; juntos passam de 12 MB em data URL
  const print = `data:image/png;base64,${'A'.repeat(4_300_000)}`;
  assert.throws(() => lerImagens({ imagens: [print, print, print] }), (e) => e.status === 413 && e.message === MSG_PRINT_GRANDE);
  assert.equal(lerImagens({ imagens: [print, print] }).length, 2);
  // o corpo acima do teto: o 413 genérico do servidor vira a mensagem, e o teto pedido é o do print
  let teto = null;
  const grandeDemais = async (_req, limite) => {
    teto = limite;
    throw Object.assign(new Error('Corpo grande demais.'), { status: 413 });
  };
  await assert.rejects(() => corpoDoPrint({}, grandeDemais), (e) => e.status === 413 && e.message === MSG_PRINT_GRANDE);
  assert.equal(teto, LIMITE_PRINT);
  await assert.rejects(() => corpoDoPrint({}, async () => { throw Object.assign(new Error('JSON inválido no corpo da requisição.'), { status: 400 }); }), falhaCom(400));
  assert.deepEqual(await corpoDoPrint({}, async () => ({ imagens: ['x'] })), { imagens: ['x'] });
  // pela rota: o POST do print usa esse teto e essa mensagem (e para antes de tocar disco)
  teto = null;
  const req = { method: 'POST', url: '/api/metricas/publico/post/123/print' };
  await assert.rejects(() => rota(req, {}, ['publico', 'post', '123', 'print'], { json: () => {}, corpoJson: grandeDemais }), (e) => e.status === 413 && e.message === MSG_PRINT_GRANDE);
  assert.equal(teto, LIMITE_PRINT);
});

// ---------- motor do semanal ----------

test('semanal: semana válida e semana anterior', () => {
  assert.ok(semanaValida('2026-W40') && semanaValida('2026-W53'));
  assert.ok(!semanaValida('2025-W53') && !semanaValida('1999-W10') && !semanaValida(null));
  assert.equal(semanaAnteriorDe('2026-10-05'), '2026-W40');
  assert.equal(semanaAnteriorDe('2026-10-04'), '2026-W39');
  assert.equal(semanaAnteriorDe('2026-01-01'), '2025-W52');
});

test('semanal: posts da semana pelo dia de Brasília', () => {
  const posts = [
    { midiaId: '1', dia: '2026-09-27' },
    { midiaId: '2', dia: '2026-09-28' },
    { midiaId: '3', timestamp: '2026-10-05T02:00:00+0000' }, // domingo 04/10, 23h em Brasília
    { midiaId: '4', timestamp: '2026-10-05T03:30:00+0000' }, // segunda 05/10, 0h30
    { midiaId: '5' },
  ];
  assert.deepEqual(postsDaSemana(posts, '2026-W40').map((p) => p.midiaId), ['2', '3']);
  assert.deepEqual(postsDaSemana(posts, '2026-W39').map((p) => p.midiaId), ['1']);
  assert.deepEqual(postsDaSemana(posts, 'ruim'), []);
});

test('semanal: números do texto em pt-BR', () => {
  assert.deepEqual(numerosDoTexto('Fez 1.234 views, 45,5% e 2× a base em 23/09.'), [1234, 45.5, 2, 23, 9]);
  assert.deepEqual(numerosDoTexto('Três peças fizeram o dobro'), [3, 2]);
  assert.deepEqual(numerosDoTexto('Uma peça bateu a meta em setembro'), []);
  assert.deepEqual(numerosDoTexto('R$ 150,00 e 1.500,5 e 0.8'), [150, 1500.5, 0.8]);
  assert.deepEqual(numerosDoTexto(''), []);
});

test('semanal: frase da IA só fica com fato que existe e número que está no fato citado', () => {
  const fatos = [
    { id: 'F1', texto: '1 de 3 peças com base bateu a meta de 2× do tipo.' },
    { id: 'F2', texto: 'Seguidores: 109 em 28/09 e 115 em 04/10 (6 a mais).' },
    { id: 'F3', texto: 'Melhor peça da semana pelo objetivo: Reel "Nota fiscal", 2,6× a base.' },
  ];
  const { frases, descartadas } = conferirFrases([
    { texto: 'Uma de três peças bateu a meta de 2×.', fatos: ['F1'] },
    { texto: 'A conta ganhou 6 seguidores na semana (F2).', fatos: ['f2'] },
    { texto: 'Os seguidores subiram 7.', fatos: ['F2'] },
    { texto: 'O melhor reel fez 2,6× a base.', fatos: ['F9'] },
    { texto: 'Sem número nenhum aqui.', fatos: [] },
    { texto: 'Foram 115 seguidores e 2,6× a base.', fatos: ['F1'] },
    { texto: 'Foram 115 seguidores e 2,6× a base no melhor reel.', fatos: ['F2', 'F3'] },
    { texto: 'O melhor post teve 2.6× a base.', fatos: ['F3'] },
  ], fatos);
  assert.deepEqual(frases, [
    { texto: 'Uma de três peças bateu a meta de 2×.', fatos: ['F1'] },
    { texto: 'A conta ganhou 6 seguidores na semana.', fatos: ['F2'] },
    { texto: 'Foram 115 seguidores e 2,6× a base no melhor reel.', fatos: ['F2', 'F3'] },
    { texto: 'O melhor post teve 2.6× a base.', fatos: ['F3'] },
  ]);
  assert.equal(descartadas, 4);
  // no máximo 6 frases
  const muitas = Array.from({ length: 8 }, () => ({ texto: 'A meta foi de 2×.', fatos: ['F1'] }));
  const r = conferirFrases(muitas, fatos);
  assert.equal(r.frases.length, 6);
  assert.equal(r.descartadas, 2);
});

test('semanal: seguidores, alcance de quem não segue e stories', () => {
  const diario = {
    '2026-09-27': { seguidoresTotal: 100, alcance: { seguidores: 999, naoSeguidores: 999 } },
    '2026-09-28': { seguidoresTotal: 109, alcance: { total: 300, seguidores: 100, naoSeguidores: 200 } },
    '2026-10-01': { alcance: { seguidores: 50, naoSeguidores: 50 } },
    '2026-10-04': { seguidoresTotal: 115 },
  };
  assert.deepEqual(seguidoresDaSemana(diario, '2026-W40'), { inicio: 109, fim: 115, variacao: 6, diaInicio: '2026-09-28', diaFim: '2026-10-04' });
  assert.equal(seguidoresDaSemana({ '2026-09-30': { seguidoresTotal: 110 } }, '2026-W40').variacao, null);
  assert.equal(seguidoresDaSemana({}, '2026-W40').inicio, null);
  // a conta da aba Público: não seguidores ÷ total do dia (ou seguidores + não seguidores + desconhecido)
  assert.deepEqual(naoSeguidoresDaSemana(diario, '2026-W40'), { pct: 62.5, naoSeguidores: 250, alcance: 300, dias: 2 });
  assert.equal(naoSeguidoresDaSemana(diario, '2026-W40', { hoje: '2026-10-01' }).pct, 66.7, 'o dia em curso fica fora');
  assert.equal(naoSeguidoresDaSemana({ '2026-09-29': { alcance: { seguidores: 10, naoSeguidores: 10, desconhecido: 20 } } }, '2026-W40').pct, 25);
  assert.equal(naoSeguidoresDaSemana({}, '2026-W40'), null);
  const st = storiesDaSemana({ dias: [
    { dia: '2026-09-28', n: 3, views: 100, saidas: 4, respostas: 1, cliques: null },
    { dia: '2026-09-29', n: 0, views: null },
    { dia: '2026-09-30', n: 2, views: 50, saidas: 'menos-de-5', respostas: 2, cliques: null },
  ] });
  assert.equal(st.dias, 2);
  assert.equal(st.views, 150);
  assert.equal(st.saidas, 4);
  assert.equal(st.respostas, 3);
  assert.equal(st.cliques, null);
  assert.equal(storiesDaSemana({ dias: [{ dia: '2026-09-28', n: 0 }] }), null);
  assert.equal(storiesDaSemana(null), null);
});

function postFalso(midiaId, dia, { tipo = 'ensino', peca = 'reel', valor = 3, base = 1, score = 1, bateu = true, provisorio = false, titulo } = {}) {
  return {
    midiaId, dia, timestamp: `${dia}T15:00:00+0000`, peca, tipo, reelTitulo: titulo ?? `Peça ${midiaId}`, pilarNome: 'Educação', thumb: '', permalink: '',
    objetivo: { id: 'salvamentos', rotulo: 'Salvamentos', valor, fonte: 'api', base, baseN: 5, baseDe: 'tipo', meta: base == null ? null : base * 2 + 1, score, bateuMeta: base == null ? null : bateu, provisorio },
    porque: { bem: ['O gancho segurou mais gente: 54% passaram dos 3 primeiros segundos.'], mal: [] },
    funil: [{ etapa: 'gancho', rotulo: 'Gancho (0 a 3s)' }], gargalo: null, forte: 'gancho',
  };
}

test('semanal: montar o relatório com banco falso', () => {
  const rotulosTipo = { ensino: 'Ensino', vendas: 'Vendas' };
  const rotulosPeca = { reel: 'Reel', carrossel: 'Carrossel', estatico: 'Estático' };
  const travessao = String.fromCharCode(0x2014);
  const rel = montarRelatorio({
    semana: '2026-W40',
    posts: [
      postFalso('1', '2026-09-28', { score: 1, bateu: true, titulo: `Nota fiscal ${travessao} sem susto` }),
      postFalso('2', '2026-09-30', { peca: 'carrossel', valor: 0, score: -1, bateu: false }),
      postFalso('3', '2026-10-04', { tipo: 'vendas', valor: null, base: null, score: null, provisorio: true }),
      postFalso('9', '2026-09-22', { score: 0.5, bateu: false }),
    ],
    insights: [
      { id: 'ins_a', acao: 'usar', titulo: 'Gancho de pergunta', texto: 'Peças com gancho de pergunta ficaram em 1,6× a base, contra 0,8× das outras (4 peças, evidência moderada).', evidencia: 'moderada', n: 4, midias: ['1'] },
      { id: 'ins_b', acao: 'evitar', titulo: 'x', texto: 'Uma peça só.', evidencia: 'insuficiente', n: 1 },
    ],
    hipoteses: [
      { id: 'hip_1', status: 'confirmada', reelId: 'reel_aaaa', texto: 'Usar gancho de pergunta.', veredito: { em: '2026-10-01T12:00:00.000Z', texto: 'Confirmada nesta peça: 1 peça é sinal, não prova.', score: 1 } },
      { id: 'hip_2', status: 'refutada', texto: 'Antiga.', veredito: { em: '2026-09-10T12:00:00.000Z', texto: 'x' } },
      { id: 'hip_3', status: 'aberta', texto: 'Em teste.' },
    ],
    titulosPeca: { reel_aaaa: 'Peça da hipótese' },
    publico: {
      diario: { '2026-09-28': { seguidoresTotal: 109, alcance: { seguidores: 100, naoSeguidores: 200 } }, '2026-10-04': { seguidoresTotal: 115 } },
      frases: ['Dos 109 seguidores com dado (30 dias): 64% são mulheres e 35% homens.'],
    },
    stories: { dias: [{ dia: '2026-09-28', n: 2, views: 80, saidas: 3, respostas: 1, cliques: null }] },
    proximas: [
      { reelId: 'reel_bbbb', dia: '2026-10-06', titulo: 'Próxima peça', tipo: 'ensino', peca: 'reel', pilarNome: 'Educação',
        rec: { meta: { objetivo: { id: 'salvamentos', rotulo: 'Salvamentos' }, base: 1, baseN: 5, meta: 3 }, itens: [{ acao: 'usar', texto: 'Gancho de pergunta tende a render mais (4 peças).', aviso: '' }], testar: { texto: 'Gancho de lista, o menos usado.' } } },
      { reelId: 'reel_cccc', dia: '2026-10-08', titulo: 'Sem base', tipo: null, peca: 'estatico', rec: null },
    ],
    geradoEm: '2026-10-05T10:00:00.000Z',
    geradoPor: 'agenda',
  }, { rotulosTipo, rotulosPeca, limpar: (s) => String(s ?? '').replace(new RegExp(`\\s*${travessao}\\s*`, 'g'), ', ') });

  assert.equal(rel.versao, 1);
  assert.equal(rel.inicio, '2026-09-28');
  assert.equal(rel.fim, '2026-10-04');
  assert.deepEqual(rel.resumo.publicadas, { reel: 2, carrossel: 1, estatico: 0, total: 3 });
  assert.deepEqual(rel.resumo.metasBatidas, { n: 1, de: 2 });
  assert.equal(rel.resumo.taxaAcerto, 50);
  assert.equal(rel.resumo.medianaScore, 0);
  assert.equal(rel.resumo.provisorias, 1);
  assert.deepEqual(rel.resumo.anterior, { metasBatidas: { n: 0, de: 1 }, medianaScore: 0.5 });
  assert.deepEqual(rel.pecas.map((p) => p.midiaId), ['1', '2', '3']);
  assert.equal(rel.pecas[0].titulo, 'Nota fiscal, sem susto');
  assert.equal(rel.pecas[0].forteRotulo, 'Gancho (0 a 3s)');
  assert.deepEqual(rel.destaques, { melhor: '1', pior: '2' });
  assert.deepEqual(rel.mecanismos.insights.map((i) => i.id), ['ins_a']);
  assert.deepEqual(rel.mecanismos.hipoteses.confirmadas.map((h) => h.id), ['hip_1']);
  assert.equal(rel.mecanismos.hipoteses.confirmadas[0].reelTitulo, 'Peça da hipótese');
  assert.deepEqual(rel.mecanismos.hipoteses.refutadas, []);
  assert.equal(rel.mecanismos.hipoteses.abertas, 1);
  assert.deepEqual(rel.publico.seguidores, { inicio: 109, fim: 115, variacao: 6, diaInicio: '2026-09-28', diaFim: '2026-10-04' });
  assert.equal(rel.publico.pctNaoSeguidores, 66.7);
  assert.equal(rel.stories.dias, 1);
  assert.equal(rel.stories.cliques, null);
  assert.match(rel.stories.frase, /cliques no link: sem dado/);
  assert.equal(rel.proximaSemana.length, 2);
  assert.deepEqual(rel.proximaSemana[0].meta, { rotulo: 'Salvamentos', base: 1, meta: 3, baseN: 5 });
  assert.deepEqual(rel.proximaSemana[0].recomendacoes, ['Fazer mais: Gancho de pergunta tende a render mais (4 peças).', 'Testar: Gancho de lista, o menos usado.']);
  assert.equal(rel.proximaSemana[1].meta, null);
  assert.equal(rel.leituraIa, null);

  // fatos numerados em ordem, sem repetição, e os números da peça estão lá
  assert.deepEqual(rel.fatos.map((f) => f.id), rel.fatos.map((_, i) => `F${i + 1}`));
  assert.equal(new Set(rel.fatos.map((f) => f.texto)).size, rel.fatos.length);
  const todos = rel.fatos.map((f) => f.texto).join('\n');
  assert.match(todos, /Reel "Nota fiscal, sem susto" \(28\/09, Ensino\): salvamentos 3, contra 1 na mediana das últimas 5 peças de Ensino\. Meta de 2×: 3\. Bateu \(2× a base\)\./);
  assert.match(todos, /salvamentos sem dado/);
  assert.match(todos, /Melhor peça da semana pelo objetivo: Reel "Nota fiscal, sem susto", 2× a base\./);
  assert.match(todos, /Seguidores: 109 em 28\/09 e 115 em 04\/10 \(6 a mais\)\./);
  assert.match(todos, /66,7% do alcance da semana/);
  assert.match(todos, /Próxima semana \(05\/10 a 11\/10\): 2 peças de feed no cronograma\./);
  assert.match(todos, /meta de salvamentos 3 \(mediana 1 das últimas 5\)/);
  assert.ok(rel.resumo.frases.some((f) => f.includes('1 de 2 peças com base bateu')));

  // nada de travessão nem de "undefined"/"NaN" em lugar nenhum
  const json = JSON.stringify(rel);
  assert.ok(!TRACO.test(json));
  assert.ok(!/undefined|NaN/.test(json));
});

test('semanal: peça sem tipo usa o alcance e a frase não diz "de sem tipo"', () => {
  const p = {
    midiaId: '7', dia: '2026-09-15', peca: 'reel', tipo: null, reelTitulo: null, legenda1: 'Último dia da condição',
    objetivo: { id: 'alcance', rotulo: 'Alcance (peça sem tipo)', valor: 587, base: 141, baseN: 5, baseDe: 'tipo', meta: 282, score: Math.log2(587 / 141), bateuMeta: true },
  };
  const rel = montarRelatorio({ semana: '2026-W38', posts: [p] }, { rotulosPeca: { reel: 'Reel' } });
  const f = rel.fatos.find((x) => x.texto.startsWith('Reel "Último dia'));
  assert.equal(f.texto, 'Reel "Último dia da condição" (15/09, sem tipo): alcance 587, contra 141 na mediana das últimas 5 peças sem tipo. Meta de 2×: 282. Bateu (4,2× a base).');
});

test('semanal: semana sem nada vira "sem dado", não zero inventado', () => {
  const rel = montarRelatorio({ semana: '2026-W40', posts: [], proximas: [] });
  assert.deepEqual(rel.resumo.publicadas, { reel: 0, carrossel: 0, estatico: 0, total: 0 });
  assert.equal(rel.resumo.medianaScore, null);
  assert.equal(rel.resumo.taxaAcerto, null);
  assert.equal(rel.resumo.anterior, null);
  assert.deepEqual(rel.destaques, { melhor: null, pior: null });
  assert.equal(rel.stories, null);
  assert.equal(rel.publico.pctNaoSeguidores, null);
  assert.deepEqual(rel.publico.seguidores.variacao, null);
  assert.ok(rel.publico.frases.every((f) => f.includes('sem dado')));
  assert.match(rel.resumo.frases[0], /Nenhum post nosso saiu de 28\/09 a 04\/10\./);
  assert.equal(rel.resumo.parcial, false);
  // a semana corrente é parcial e a frase avisa
  const corrente = montarRelatorio({ semana: '2026-W40', posts: [], hoje: '2026-09-30' });
  assert.equal(corrente.resumo.parcial, true);
  assert.deepEqual(corrente.resumo.frases, ['Semana em andamento: os números ainda mudam até domingo.', 'Nenhum post nosso saiu de 28/09 a 04/10 até agora.']);
  assert.equal(montarRelatorio({ semana: '2026-W40', posts: [], hoje: '2026-10-05' }).resumo.parcial, false);
  assert.throws(() => montarRelatorio({ semana: '2026-W99' }), TypeError);
  assert.ok(!TRACO.test(JSON.stringify(rel)));
});

test('semanal: só peça com 7 dias e sem anúncio entra na meta, na mediana e nos destaques (C5)', () => {
  const posts = [
    postFalso('1', '2026-09-28', { score: 1.2, bateu: true }),
    postFalso('2', '2026-09-29', { score: -0.5, bateu: false }),
    postFalso('3', '2026-10-02', { score: -1.5, bateu: null, provisorio: true }),
    // já bateu, mas tem menos de 7 dias: fica de fora até fechar
    postFalso('4', '2026-10-03', { score: 1.5, bateu: true, provisorio: true }),
    { ...postFalso('5', '2026-10-01', { score: 2.5, bateu: true }), impulsionado: true },
    postFalso('6', '2026-09-30', { base: null, score: null }),
  ];
  const n = numerosDaSemana(posts);
  assert.deepEqual(n.metasBatidas, { n: 1, de: 2 });
  assert.equal(n.medianaScore, 0.35);
  assert.equal(n.taxaAcerto, 50);
  assert.equal(n.provisorias, 2);
  assert.equal(n.comAnuncio, 1);
  assert.equal(n.semAvaliacao, 1);
  assert.equal(n.publicadas.total, 6);

  const rel = montarRelatorio({ semana: '2026-W40', posts }, { rotulosTipo: { ensino: 'Ensino' }, rotulosPeca: { reel: 'Reel' } });
  assert.deepEqual(rel.destaques, { melhor: '1', pior: '2' }, 'a provisória que já bateu e a com anúncio (2,5) ficam de fora');
  assert.equal(rel.resumo.comAnuncio, 1);
  assert.equal(rel.resumo.semAvaliacao, 1);
  assert.equal(rel.pecas.find((p) => p.midiaId === '5').impulsionado, true);
  assert.equal(rel.pecas.find((p) => p.midiaId === '1').impulsionado, null);
  const frases = rel.resumo.frases.join(' ');
  assert.match(frases, /1 de 2 peças com base bateu a meta de 2× do tipo\./);
  assert.match(frases, /2 peças ainda têm menos de 7 dias: ficam fora da conta da meta, da mediana e dos destaques até fazerem 7 dias\./);
  assert.match(frases, /1 peça teve anúncio: fica fora da conta da meta, da mediana e dos destaques\./);
  assert.ok(rel.fatos.some((f) => f.texto.startsWith('Reel "Peça 5"') && f.texto.endsWith('Teve anúncio: fica fora da conta da semana.')));
});

test('semanal: semana só com peça provisória não diz "sem base" nem tira mediana de número de 1 a 6 dias', () => {
  // o gerado da agenda na segunda 05/10 às 8h: 4 reels de 0,8 a 6,8 dias contra base de 300
  const posts = [120, 200, 310, 520].map((valor, i) => postFalso(String(i + 1), `2026-10-0${i + 1}`, { valor, base: 300, score: Math.log2(valor / 300), bateu: null, provisorio: true }));
  const rel = montarRelatorio({ semana: '2026-W40', posts, geradoEm: '2026-10-05T11:00:00.000Z', lidoEm: '2026-10-05T10:30:00.000Z', hoje: '2026-10-05' }, { rotulosPeca: { reel: 'Reel' } });
  assert.deepEqual(rel.resumo.metasBatidas, { n: 0, de: 0 });
  assert.equal(rel.resumo.medianaScore, null);
  assert.equal(rel.resumo.taxaAcerto, null);
  assert.equal(rel.resumo.provisorias, 4);
  assert.deepEqual(rel.destaques, { melhor: null, pior: null });
  assert.ok(!rel.resumo.frases.some((f) => /Nenhuma peça da semana|A mediana da semana|base de comparação/.test(f)), rel.resumo.frases.join(' | '));
  assert.ok(rel.resumo.frases.includes('4 peças ainda têm menos de 7 dias: ficam fora da conta da meta, da mediana e dos destaques até fazerem 7 dias.'));
  assert.equal(rel.lidoEm, '2026-10-05T10:30:00.000Z');
  assert.equal(situacaoRelatorio(rel), 'provisorio', 'a agenda gera de novo na segunda seguinte');
  // semana fechada sem base de verdade continua dizendo que falta base
  const semBase = montarRelatorio({ semana: '2026-W40', posts: [postFalso('1', '2026-09-28', { base: null, score: null })] });
  assert.ok(semBase.resumo.frases.some((f) => f.startsWith('Nenhuma peça da semana com 7 dias tem como comparar com a meta de 2× ainda')));
});

test('semanal: leitura dos posts de antes do fim da semana ganha aviso e fica gravada', () => {
  const lidoEm = '2026-10-01T17:00:00.000Z'; // quinta 01/10, 14h em Brasília
  const rel = montarRelatorio({ semana: '2026-W40', posts: [postFalso('1', '2026-09-28')], lidoEm, hoje: '2026-10-06', geradoEm: '2026-10-06T10:00:00.000Z' }, { rotulosPeca: { reel: 'Reel' } });
  assert.equal(rel.lidoEm, lidoEm);
  assert.equal(rel.resumo.frases[0], 'Os números dos posts são da leitura de 01/10 às 14h, antes do fim da semana: post publicado depois disso fica de fora.');
  assert.ok(rel.fatos.some((f) => f.texto === rel.resumo.frases[0]));
  assert.equal(situacaoRelatorio(rel), 'desatualizado');
  // semana vazia com leitura velha não afirma que nada saiu
  const vazio = montarRelatorio({ semana: '2026-W40', posts: [], lidoEm, hoje: '2026-10-06' });
  assert.equal(vazio.resumo.frases[1], 'Nenhum post nosso saiu de 28/09 a 04/10 até essa leitura.');
  // semana em andamento: o aviso de parcial basta
  const corrente = montarRelatorio({ semana: '2026-W40', posts: [], lidoEm, hoje: '2026-10-01' });
  assert.ok(!corrente.resumo.frases.some((f) => f.startsWith('Os números dos posts')));
  // leitura depois do fim da semana: sem aviso
  const emDia = montarRelatorio({ semana: '2026-W40', posts: [], lidoEm: '2026-10-05T10:00:00.000Z', hoje: '2026-10-05' });
  assert.deepEqual(emDia.resumo.frases, ['Nenhum post nosso saiu de 28/09 a 04/10.']);
});

test('semanal: situação do resumo gravado', () => {
  const rel = (extra = {}, resumo = {}) => ({ versao: 1, semana: '2026-W40', geradoEm: '2026-10-05T11:00:00.000Z', lidoEm: '2026-10-05T10:00:00.000Z', resumo: { provisorias: 3, parcial: false, ...resumo }, ...extra });
  assert.equal(situacaoRelatorio(null, '2026-W40'), 'falta');
  assert.equal(situacaoRelatorio(rel()), 'provisorio');
  assert.equal(situacaoRelatorio(rel({}, { provisorias: 0 })), 'fechado');
  assert.equal(situacaoRelatorio(rel({ geradoEm: '2026-10-02T15:00:00.000Z' }, { parcial: true })), 'parcial');
  assert.equal(situacaoRelatorio(rel({ geradoEm: '2026-10-04T15:00:00.000Z' })), 'parcial', 'domingo ainda é a semana');
  assert.equal(situacaoRelatorio(rel({ lidoEm: '2026-10-03T15:00:00.000Z' })), 'desatualizado');
  // resumo antigo, sem lidoEm: vale só a peça provisória
  assert.equal(situacaoRelatorio(rel({ lidoEm: undefined })), 'provisorio');
  // gerado de novo a partir de segunda 12/10, 0h de Brasília (todas as peças com 7 dias): fechado
  assert.equal(situacaoRelatorio(rel({ geradoEm: '2026-10-12T03:00:00.000Z' }, { provisorias: 1 })), 'fechado');
  assert.equal(situacaoRelatorio(rel({ geradoEm: '2026-10-12T02:59:00.000Z' }, { provisorias: 1 })), 'provisorio');
  assert.deepEqual(marcosDaSemana('2026-W40'), { acabouMs: brt('2026-10-05', 0), maduraMs: brt('2026-10-12', 0) });
  assert.equal(marcosDaSemana('2026-W99'), null);
});

test('semanal: peça que não bateu a meta nunca aparece como 2× nem com o valor arredondado até a meta (C2)', () => {
  const obj = (valor) => ({ id: 'salvamentos', rotulo: 'Salvamentos', valor, fonte: 'api', base: 10.5, baseN: 5, baseDe: 'tipo', meta: 21, score: Math.log2(valor / 10.5), bateuMeta: valor >= 21, provisorio: false });
  const posts = [{ ...postFalso('1', '2026-09-28'), objetivo: obj(20.96) }, { ...postFalso('2', '2026-09-29'), objetivo: obj(5) }];
  const rel = montarRelatorio({ semana: '2026-W40', posts }, { rotulosTipo: { ensino: 'Ensino' }, rotulosPeca: { reel: 'Reel' } });
  const todos = rel.fatos.map((f) => f.texto).join('\n');
  assert.match(todos, /Reel "Peça 1" \(28\/09, Ensino\): salvamentos 20,9, contra 10,5 na mediana das últimas 5 peças de Ensino\. Meta de 2×: 21\. Não bateu \(1,9× a base\)\./);
  assert.match(todos, /Melhor peça da semana pelo objetivo: Reel "Peça 1", 1,9× a base\./);
  assert.match(todos, /Pior peça da semana pelo objetivo: Reel "Peça 2", 0,4× a base\./);
  assert.ok(!/\b2× a base/.test(todos));
  assert.ok(!/salvamentos 21\b/.test(todos));
});

test('semanal: data, hora e título do fato não liberam número; número por extenso vale pelo valor', () => {
  assert.deepEqual(numerosDoTexto('trezentas e vinte pessoas'), [320]);
  assert.deepEqual(numerosDoTexto('dois mil e quinhentos'), [2500]);
  assert.deepEqual(numerosDoTexto('vinte e um reels e uma peça'), [21]);
  assert.deepEqual(numerosDoTexto('O alcance dobrou'), [2]);
  const fatos = [
    { id: 'F1', texto: 'Reel "5 erros do MEI" (28/09, Ensino): salvamentos 3, contra 1 na mediana das últimas 4 peças de Ensino. Meta de 2×: 3. Bateu (3,5× a base).' },
    { id: 'F2', texto: 'Seguidores: 109 em 28/09 e 115 em 04/10 (6 a mais).' },
    { id: 'F3', texto: 'Os números dos posts são da leitura de 01/10 às 14h, antes do fim da semana: post publicado depois disso fica de fora.' },
    { id: 'F4', texto: 'Stories em 3 dos 7 dias. Views: 20; saídas: 3; respostas: 1; cliques no link: sem dado.' },
  ];
  const { frases, descartadas } = conferirFrases([
    { texto: 'Foram 28 metas batidas na semana.', fatos: ['F1'] }, // o 28 é da data
    { texto: 'O reel teve 9 salvamentos.', fatos: ['F1'] }, // o 9 é do mês
    { texto: 'Trezentas pessoas salvaram o reel.', fatos: ['F1'] },
    { texto: 'O reel "5 erros do MEI" fez 3 salvamentos, 3,5× a base.', fatos: ['F1'] },
    { texto: 'O reel de 28/09 bateu a meta de 2×.', fatos: ['F1'] },
    { texto: 'O reel de 29/09 bateu a meta de 2×.', fatos: ['F1'] }, // data que não está no fato
    { texto: 'O reel “5 erros do MEI” teve 5 salvamentos.', fatos: ['F1'] }, // o 5 é do título
    { texto: 'A conta ganhou seis seguidores entre 28/09 e 04/10.', fatos: ['F2'] },
    { texto: 'Os stories somaram vinte e três views.', fatos: ['F4'] }, // 23 não está lá, só 20 e 3 soltos
    { texto: 'Foram centenas de views nos stories.', fatos: ['F4'] },
    { texto: 'A leitura dos posts foi em 01/10 às 14h.', fatos: ['F3'] },
    { texto: 'A leitura dos posts foi às 15h.', fatos: ['F3'] },
  ], fatos);
  assert.deepEqual(frases.map((f) => f.texto), [
    'O reel "5 erros do MEI" fez 3 salvamentos, 3,5× a base.',
    'O reel de 28/09 bateu a meta de 2×.',
    'A conta ganhou seis seguidores entre 28/09 e 04/10.',
    'A leitura dos posts foi em 01/10 às 14h.',
  ]);
  assert.equal(descartadas, 8);
});
