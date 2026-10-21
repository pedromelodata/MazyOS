// Testes do gerador da semana (gerador-semana.mjs, 21/10) com uma IA falsa (injetada) numa pasta de dados temporária:
// completa só o que falta da semana (o que já existe fica), refaz uma vez o que a conferência barra (Ateliê e
// mecanismo), o que ainda falha entra como 'ideia' e não vai pra aprovação, rodar de novo não duplica, simular não
// grava, sem IA é 503 com nada gravado, uma geração por vez, e o "Regerar ideia" (com a versão anterior e a volta). Mais
// a agenda do gerador (segunda 06:00, só a partir de 02/11/2026, uma vez). 21/10 (Pedro), as correções da revisão: as
// regras da semana refazem o plano e o teto da oferta barra no fim, a exceção de anti-repetição da IA não vale sozinha
// (só a da 1ª campanha), stories do plano ligados ao post do dia, só dias que ainda não chegaram, o regerar que mantém
// formato e campanha e não mexe em peça gravada, a sugestão do Google marcada como usada, a pesquisa gravada sem IA, a
// semana incompleta como falha da agenda e a falha sem IA uma vez por dia. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-gerador-'));
const dados = path.join(raiz, 'data');
process.env.CRONOGRAMA_DATA = dados;
mkdirSync(dados, { recursive: true });
after(() => rmSync(raiz, { recursive: true, force: true }));

const BLOCO = { 1: 'Afeto', 2: 'Afeto', 3: 'Afeto', 4: 'Educação', 5: 'Educação', 6: 'Educação', 7: 'Educação', 16: 'Educação', 8: 'Diferencial', 9: 'Diferencial', 17: 'Diferencial', 10: 'Conversão', 11: 'Conversão', 12: 'Conversão', 13: 'Conversão', 14: null, 15: null };
const pilares = Object.keys(BLOCO).map(Number).sort((a, b) => a - b).map((id) => ({ id, nome: `Pilar ${id}`, bloco: BLOCO[id], status: [6, 7, 14, 15].includes(id) ? 'guardado' : 'ativo' }));
const peca = (id, data, p, pilar, ideia) => ({ id, data, peca: p, peca2: null, pilar, bloco: BLOCO[pilar], ideia, status: 'roteiro', roteiro: {}, carrossel: {}, estatico: {}, legenda: '', fontes: [] });
const dia = (id, data, pilar, tema, extra = {}) => ({ id, data, pilar, bloco: pilar ? BLOCO[pilar] : null, tema, objetivo: 'engajamento', quadros: [], pecaDoDia: null, status: 'ideia', cta: '', fontes: [], notas: '', pilarTexto: '', motivo: '', ...extra });
// a semana de 09/11 a 15/11 já tem 2 reels, 3 feeds e 3 temas de stories
const EXISTENTES = [
  peca('reel_e1', '2026-11-10', 'reel', 3, 'Bastidor: o time testando o app na véspera da abertura'),
  peca('reel_e2', '2026-11-12', 'reel', 17, 'O app emitindo a nota em poucos toques'),
  peca('reel_e3', '2026-11-11', 'carrossel', 11, 'Trocar de contador: o caminho que o app abre'),
  peca('reel_e4', '2026-11-13', 'estatico', 13, 'Sua empresa está em dia'),
  peca('reel_e5', '2026-11-14', 'carrossel', 4, 'A papelada que come o mês do dono'),
];
const STORIES = [
  dia('sto_e1', '2026-11-09', 8, 'Enquete: o preço que você vê', { angulo: 'Preço fechado' }),
  dia('sto_e2', '2026-11-10', 1, 'Bastidor do fundador na semana da abertura'),
  dia('sto_e3', '2026-11-11', null, 'Caixinha: qual dúvida você tem vergonha de perguntar pro contador?', { mecanica: 'caixinha', pilarTexto: 'Mecânica recorrente' }),
];
writeFileSync(path.join(dados, 'estilos.json'), '{}');
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({
  schemaVersion: 2, pilares, campanhas: [{ id: 'cmp_prelancamento', nome: 'Pré-lançamento' }],
  config: { volumeSemanal: { reels: 3, feeds: 5, storiesTemas: 5 }, mixBlocos: { Afeto: 20, Educação: 30, Diferencial: 25, Conversão: 25 }, tetoVenda: { foraDaPromocao: 20, naPromocao: 30 } },
  reels: EXISTENTES, stories: STORIES,
}));

const ger = await import('../gerador-semana.mjs');
const { carregar } = await import('../db.mjs');
const { tarefasConteudoDevidas, proximasConteudo, geracaoIncompleta, anotarConteudo, estadoConteudo } = await import('../agenda.mjs');
const { MSG_SEM_IA } = await import('../noticias.mjs');

const TRACO = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const brt = (d, h = 12, m = 0) => Date.parse(`${d}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-03:00`);
const iso = (ms) => new Date(ms).toISOString();
// o relógio dos testes (21/10): a geração só vale pra dia que ainda não chegou
const AGORA = brt('2026-10-21', 12);
const somar = (d, n) => { const t = new Date(`${d}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

const COMUM = { angulo: '', gatilhoEmocional: 'cansaço da burocracia', gatilhoPsicologico: 'identificação', persona: 'B', leo: 'só no gancho', ganchoOrigem: 'G12', mecanica: '', sugestaoUsada: '', excecaoAntiRepeticao: '' };
// o plano falso, com os dias a partir da segunda da semana (0 = segunda)
const plano = (seg) => ({
  posts: [
    { ...COMUM, data: somar(seg, 6), peca: 'reel', pilar: 2, ideia: 'Humor: o domingo do dono de ME procurando comprovante', motivo: 'Compartilhamento de domingo.', leo: 'forte' },
    { ...COMUM, data: somar(seg, 4), peca: 'carrossel', pilar: 5, ideia: 'Mito: abrir empresa sempre exige cartório', motivo: 'Mito de burocracia.' },
    { ...COMUM, data: somar(seg, 3), peca: 'estatico', pilar: 16, ideia: 'Primeiro cliente empresa vai pedir nota', motivo: 'Dica útil pro dono.' },
    { ...COMUM, data: somar(seg, 5), peca: 'estatico', pilar: 9, ideia: 'Extra que passa do volume da semana', motivo: 'Sobra.' },
  ],
  stories: [
    { ...COMUM, data: somar(seg, 4), objetivo: 'engajamento', pilar: 9, pilarTexto: '', ideia: 'Bastidor do contador respondendo dúvida de ME', motivo: 'Gente de verdade.' },
    { ...COMUM, data: somar(seg, 5), objetivo: 'vendas', pilar: 12, pilarTexto: '', ideia: 'Pró-labore no automático e a lista de espera', motivo: 'Conversão do dia.' },
  ],
});

// a IA falsa: o plano, cada post (o estático do pilar 16 cita o Mauro na 1ª vez; o carrossel do mito cita concorrente
// sempre) e cada stories. O post de regerar devolve uma ideia nova
function iaFalsa({ seg = '2026-11-09', esperar = null } = {}) {
  const conta = { plano: 0, post: 0, stories: 0, regerar: 0, prompts: [] };
  const ia = async ({ etapa, prompt, schema, sistema }) => {
    conta[etapa]++;
    conta.prompts.push({ etapa, prompt, sistema });
    if (esperar) await esperar;
    if (etapa === 'plano') return { dados: plano(seg) };
    const linha = JSON.parse(/\n(\{\n[\s\S]*?\n\})\n/.exec(prompt)[1]);
    const refazendo = prompt.includes('teve estes problemas');
    const regerar = prompt.includes('Regere ');
    if (regerar) conta.regerar++;
    if (etapa === 'stories') {
      return {
        tema: regerar ? 'Tema novo: enquete da semana do dono' : linha.ideia, objetivo: linha.objetivo, pilar: linha.pilar, pilarTexto: '', motivo: linha.motivo, angulo: '',
        gatilhoEmocional: 'cansaço da burocracia', gatilhoPsicologico: 'curiosidade', ganchoOrigem: 'G04', excecaoAntiRepeticao: '', mecanica: '',
        quadros: [{ texto: 'Sabe aquela semana corrida?', visual: 'mesa bagunçada', interacao: '' }, { texto: 'A gente cuida da parte chata.', visual: 'app', interacao: 'enquete' }, { texto: linha.objetivo === 'vendas' ? 'Entra na lista de espera pelo link' : 'Responde aqui', visual: 'fecho', interacao: linha.objetivo === 'vendas' ? 'link da lista de espera' : 'caixinha' }],
        cta: linha.objetivo === 'vendas' ? 'Entra na lista de espera' : 'Responde a enquete', fontes: [],
      };
    }
    const ideia = regerar ? 'Humor novo: a pasta de comprovantes no sofá' : linha.ideia;
    const g = {
      ideia, pilar: linha.pilar, motivo: linha.motivo, angulo: '', gatilhoEmocional: 'cansaço da burocracia', gatilhoPsicologico: 'identificação', persona: 'B', leo: linha.leo,
      ganchoOrigem: 'G12', excecaoAntiRepeticao: '', formatoTexto: `Feed · ${linha.peca}`,
      legenda: `Salva esse post pra quando bater a dúvida 📌\nA rotina do dono tem mais papel do que devia ${String.fromCharCode(0x2014)} e não precisa.\nManda pra quem vive isso 💬`,
      fontes: [], explicacao: { porque: 'A dor da papelada do mês.', baseTecnica: ['Sem fato na base: nenhum número. Conferir.'], objetivo: 'Gerar salvamento.' },
    };
    if (schema.properties.roteiro) g.roteiro = { hook: 'Esse ponto parece difícil', textoTela: 'Parece difícil', cenas: [{ tempo: '0-3s', cena: 'Léo na mesa', fala: 'Esse ponto parece difícil. Vou simplificar.', tela: '' }, { tempo: '3-10s', cena: 'tela', fala: 'A papelada do domingo some quando o app cuida.', tela: '' }, { tempo: '10-15s', cena: 'fecho', fala: 'Salva pra quando precisar.', tela: '' }], desenvolvimento: 'A papelada do domingo some quando o app cuida.', cta: 'Salva pra quando precisar.' };
    if (schema.properties.carrossel) g.carrossel = { capa: { titulo: linha.ideia, texto: '', visual: 'capa' }, slides: [{ titulo: 'O mito', texto: 'Muita gente acha isso.', visual: '' }, { titulo: 'A verdade', texto: 'Na ME a gente abre pelo app, e não é a Contabilizei que faz.', visual: '' }], final: { titulo: 'Salva', texto: 'Salva pra lembrar.', visual: '' } };
    if (schema.properties.estatico) g.estatico = { headline: linha.pilar === 16 && !refazendo ? 'O Mauro explica: o primeiro cliente pede nota' : linha.ideia, apoio: 'A nota sai pelo app, em poucos campos.', visual: 'arte', cta: 'Salva pra depois.' };
    return g;
  };
  return { ia, conta };
}

let snapshotExistentes;
test('gerador: completa só o que falta, refaz uma vez e manda os bons pra aprovação', async () => {
  // 21/10: só os 5 de antes (o id gerado, reel_ + hex, também pode começar com "reel_e")
  snapshotExistentes = JSON.stringify((await carregar()).reels.filter((r) => /^reel_e\d$/.test(r.id)));
  const { ia, conta } = iaFalsa();
  const enviadas = [];
  const aprovar = async (id, explicacao, autor) => { enviadas.push({ id, explicacao, autor }); };
  const r = await ger.gerarSemana({ agoraMs: AGORA, inicio: '2026-11-11', autor: 'Teste', ia, pesquisar: false, aprovar });
  assert.deepEqual(r.semana, { inicio: '2026-11-09', fim: '2026-11-15' });
  assert.equal(conta.plano, 1);
  const db = await carregar();
  assert.equal(JSON.stringify(db.reels.filter((x) => /^reel_e\d$/.test(x.id))), snapshotExistentes, 'o que já existia fica como está');
  const novos = db.reels.filter((x) => x.origem === 'gerador-semana');
  assert.equal(novos.length, 3, '1 reel e 2 feeds: o 4º post do plano passou do volume e ficou de fora');
  assert.deepEqual(novos.map((x) => x.peca).sort(), ['carrossel', 'estatico', 'reel']);
  for (const x of novos) {
    assert.equal(x.criadoPor, 'Gerador da semana');
    assert.match(x.calendario, /^gerador:2026-11-09:\d+$/);
    assert.ok(x.notas.startsWith('ESTRATÉGIA (Gerador da semana'), 'persona, Léo e gancho nas notas');
    assert.match(x.notas, /gancho: G12/);
    assert.doesNotMatch(JSON.stringify(x), TRACO, 'zero travessão no que entrou');
    assert.equal(x.gatilhoEmocional, 'cansaço da burocracia');
  }
  assert.equal(new Set(novos.map((x) => x.calendario)).size, 3);
  const reel = novos.find((x) => x.peca === 'reel');
  const estatico = novos.find((x) => x.peca === 'estatico');
  const carrossel = novos.find((x) => x.peca === 'carrossel');
  assert.equal(reel.status, 'roteiro');
  assert.equal(estatico.status, 'roteiro', 'o Mauro da 1ª versão saiu quando refez');
  assert.ok(!/mauro/i.test(estatico.estatico.headline));
  assert.equal(r.criadas.find((c) => c.id === estatico.id).refeita, true);
  assert.equal(carrossel.status, 'ideia', 'o concorrente continuou depois de refazer');
  assert.match(carrossel.notas, /NÃO FOI PRA APROVAÇÃO/);
  assert.match(carrossel.notas, /concorrente/i);
  // a aprovação: só os dois bons, com a explicação técnica
  assert.deepEqual(enviadas.map((e) => e.id).sort(), [reel.id, estatico.id].sort());
  for (const e of enviadas) {
    assert.match(e.explicacao, /^Por que este post: /);
    assert.match(e.explicacao, /\nBase técnica:\n• /);
    assert.equal(e.autor, 'Gerador da semana');
  }
  assert.equal(r.enviadas, 2);
  // os stories: 2, nos dias livres, ligados ao post gerado do mesmo dia
  const st = db.stories.filter((s) => s.origem === 'gerador-semana');
  assert.equal(st.length, 2);
  assert.equal(new Set(db.stories.map((s) => s.data)).size, db.stories.length, 'um stories por dia');
  assert.equal(st.find((s) => s.data === '2026-11-13').pecaDoDia, carrossel.id);
  assert.match(st[0].calendario, /^gerador:2026-11-09:s\d+$/);
  for (const s of st) assert.equal(s.quadros.length, 3);
  // o histórico
  const h = JSON.parse(readFileSync(path.join(dados, 'gerador-semana.json'), 'utf8'));
  assert.equal(h.execucoes.length, 1);
  assert.equal(h.execucoes[0].ok, true);
  assert.equal(h.execucoes[0].criadas, 5);
  // o prompt leva a estratégia, os ganchos, a base contábil e o aviso do dado de fora
  const p0 = conta.prompts.find((x) => x.etapa === 'plano');
  assert.match(p0.sistema, /<estrategia_principal>/);
  assert.match(p0.sistema, /<banco_de_ganchos>/);
  assert.match(p0.sistema, /fatos_aprovados/);
  assert.match(p0.sistema, /DADO NÃO CONFIÁVEL/);
  assert.match(p0.prompt, /Falta completar: 1 reel, 2 feeds/);
  assert.match(p0.prompt, /13\/11 sexta, 14\/11 sábado, 15\/11 domingo/);
});

test('gerador: rodar de novo não duplica (a semana cheia não gera nada)', async () => {
  const antes = (await carregar()).reels.length;
  const { ia, conta } = iaFalsa();
  const r = await ger.gerarSemana({ agoraMs: AGORA, inicio: '2026-11-09', ia, pesquisar: false, aprovar: async () => {} });
  // o carrossel que ficou 'ideia' também conta no volume: a semana já tem 3 reels, 5 feeds e 5 temas de stories
  assert.equal(r.criadas.length, 0);
  assert.equal(r.mensagem, 'A semana já está completa: nada a gerar.');
  assert.equal(conta.plano, 0);
  assert.equal((await carregar()).reels.length, antes);
});

test('gerador: simular não grava; plano curto é refeito uma vez', async () => {
  const antes = JSON.stringify(await carregar());
  const { ia, conta } = iaFalsa({ seg: '2026-11-16' });
  const enviadas = [];
  const r = await ger.gerarSemana({ agoraMs: AGORA, inicio: '2026-11-16', ia, pesquisar: false, simular: true, aprovar: async (id) => enviadas.push(id) });
  assert.equal(r.simulado, true);
  assert.equal(conta.plano, 2, 'o plano trouxe menos que o volume: refez uma vez');
  assert.match(conta.prompts[1].prompt, /O plano anterior teve estes problemas/);
  assert.equal(r.criadas.length, 6);
  assert.equal(JSON.stringify(await carregar()), antes, 'nada gravado');
  assert.deepEqual(enviadas, []);
  assert.equal(JSON.parse(readFileSync(path.join(dados, 'gerador-semana.json'), 'utf8')).execucoes.length, 2, 'simulação não entra no histórico');
});

test('gerador: sem IA é 503 com a mensagem clara e nada gravado; uma geração por vez', async () => {
  const antes = JSON.stringify(await carregar());
  const era = process.env.CRONOGRAMA_IA;
  process.env.CRONOGRAMA_IA = '0';
  try {
    await assert.rejects(ger.gerarSemana({ agoraMs: AGORA, inicio: '2026-11-23', pesquisar: false }), (e) => e.status === 503 && e.message === MSG_SEM_IA);
    await assert.rejects(ger.regerar({ id: 'reel_e1' }), (e) => e.status === 503 && e.message === MSG_SEM_IA);
  } finally {
    if (era === undefined) delete process.env.CRONOGRAMA_IA;
    else process.env.CRONOGRAMA_IA = era;
  }
  assert.equal(JSON.stringify(await carregar()), antes);
  // a IA cai no meio (503): para tudo, nada gravado
  const caiu = async ({ etapa }) => { if (etapa === 'plano') return { dados: plano('2026-11-23') }; throw Object.assign(new Error(MSG_SEM_IA), { status: 503 }); };
  await assert.rejects(ger.gerarSemana({ agoraMs: AGORA, inicio: '2026-11-23', ia: caiu, pesquisar: false }), (e) => e.status === 503);
  assert.equal(JSON.stringify(await carregar()), antes);
  // uma por vez
  let soltar;
  const espera = new Promise((ok) => { soltar = ok; });
  const { ia } = iaFalsa({ seg: '2026-11-30', esperar: espera });
  const primeira = ger.gerarSemana({ agoraMs: AGORA, inicio: '2026-11-30', ia, pesquisar: false, simular: true });
  await new Promise((ok) => setTimeout(ok, 20));
  assert.equal(ger.estadoGerador().semana, '2026-11-30');
  await assert.rejects(ger.gerarSemana({ agoraMs: AGORA, inicio: '2026-12-07', ia, pesquisar: false }), (e) => e.status === 409);
  soltar();
  await primeira;
  assert.equal(ger.estadoGerador(), null);
});

test('gerador: regerar a ideia de um dia (versão anterior, aprovação solta e voltar)', async () => {
  const db = await carregar();
  const reel = db.reels.find((x) => x.origem === 'gerador-semana' && x.peca === 'reel');
  const ideiaAntes = reel.ideia;
  reel.aprovacao = { estado: 'pendente', etapa: 'gerentes', conversa: [] };
  const { ia, conta } = iaFalsa();
  const r = await ger.regerar({ id: reel.id, instrucao: 'mais leve', autor: 'Pedro Maia', ia });
  assert.equal(conta.regerar, 1);
  assert.match(conta.prompts[0].prompt, /Pedido de quem regerou/);
  assert.match(conta.prompts[0].prompt, /mais leve/);
  assert.equal(r.ideia, 'Humor novo: a pasta de comprovantes no sofá');
  assert.equal(r.status, 'roteiro');
  assert.equal(r.versoesAnteriores.length, 1);
  assert.equal(r.versoesAnteriores[0].campos.ideia, ideiaAntes);
  assert.equal(r.versoesAnteriores[0].por, 'Pedro Maia');
  assert.equal(r.aprovacao.estado, null, 'pendente perde a aprovação');
  assert.match(r.aprovacao.conversa.at(-1).texto, /regerada por Pedro Maia/);
  assert.equal(r.atualizadoPor, 'Pedro Maia');
  // voltar
  const v = await ger.regerar({ id: reel.id, voltar: true, autor: 'Pedro Maia' });
  assert.equal(v.ideia, ideiaAntes);
  assert.equal(v.versoesAnteriores.length, 0);
  await assert.rejects(ger.regerar({ id: reel.id, voltar: true }), (e) => e.status === 409);
  // até 5 versões guardadas
  for (let i = 0; i < 6; i++) await ger.regerar({ id: reel.id, ia });
  assert.equal(reel.versoesAnteriores.length, 5);
  // os stories do dia
  const s = db.stories.find((x) => x.origem === 'gerador-semana');
  const temaAntes = s.tema;
  const rs = await ger.regerar({ storiesId: s.id, ia, autor: 'Pedro Puntel' });
  assert.equal(rs.tema, 'Tema novo: enquete da semana do dono');
  assert.equal(rs.versoesAnteriores[0].campos.tema, temaAntes);
  assert.equal((await ger.regerar({ storiesId: s.id, voltar: true })).tema, temaAntes);
  // peça postada, inexistente, pedido torto
  const postada = db.reels.find((x) => x.id === 'reel_e2');
  postada.status = 'publicado';
  await assert.rejects(ger.regerar({ id: 'reel_e2', ia }), (e) => e.status === 409);
  postada.status = 'roteiro';
  await assert.rejects(ger.regerar({ id: 'reel_nao', ia }), (e) => e.status === 404);
  await assert.rejects(ger.regerar({ ia }), (e) => e.status === 400);
  await assert.rejects(ger.regerar({ id: 'reel_e1', instrucao: 'x'.repeat(1001), ia }), (e) => e.status === 400);
});

test('gerador: limpeza de texto, fontes do FATOS e o mix alvo', () => {
  assert.deepEqual(ger.limparTextos({ a: `um ${String.fromCharCode(0x2014)} dois`, b: ['Legalizai', 3], c: { d: '**negrito**' } }), { a: 'um, dois', b: ['Legalizaí', 3], c: { d: 'negrito' } });
  const fatos = new Map([['F001', 'USAR'], ['F006', 'NÃO USAR'], ['F027', 'CONFLITO']]);
  assert.deepEqual(ger.problemasDasFontes(['F001 · 01-PRECOS', 'F006 · x', 'F027', 'F999'], fatos), [
    'A fonte cita F006, que está NÃO USAR no FATOS.md: tire o fato da peça.',
    'A fonte cita F027, que está CONFLITO no FATOS.md: tire o fato da peça.',
    'A fonte cita F999, que não existe no FATOS.md.',
  ]);
  assert.deepEqual(ger.alvoDosBlocos(13), { Educação: 4, Afeto: 3, Diferencial: 3, Conversão: 3 });
  assert.equal(ger.statusDosFatos().get('F001'), 'USAR', 'lê o FATOS.md de verdade');
});

test('agenda: o gerador roda na segunda a partir das 06:00, só a partir de 02/11/2026, uma vez por segunda', () => {
  const devida = (conteudo, ms) => tarefasConteudoDevidas(conteudo, ms).includes('semana');
  assert.equal(devida({}, brt('2026-11-02', 5, 59)), false);
  assert.equal(devida({}, brt('2026-11-02', 6, 0)), true);
  assert.equal(devida({}, brt('2026-11-02', 23, 59)), true, 'ainda tenta até o fim da segunda');
  assert.equal(devida({}, brt('2026-11-03', 6, 0)), false, 'terça não');
  assert.equal(devida({}, brt('2026-10-26', 6, 0)), false, 'antes de 02/11 não');
  assert.equal(devida({}, brt('2026-11-09', 6, 0)), true);
  const ok = { semana: { em: iso(brt('2026-11-02', 6, 1)), ok: true } };
  assert.equal(devida(ok, brt('2026-11-02', 9, 0)), false, 'uma vez por segunda');
  assert.equal(devida(ok, brt('2026-11-09', 6, 0)), true, 'na segunda seguinte, de novo');
  const falhou = { semana: { em: iso(brt('2026-11-02', 6, 1)), ok: false, erro: 'x' } };
  assert.equal(devida(falhou, brt('2026-11-02', 7, 0)), false);
  assert.equal(devida(falhou, brt('2026-11-02', 7, 1)), true, 'falhou: de novo em 1 h');
  assert.equal(proximasConteudo({}, brt('2026-10-21', 15)).semana, iso(brt('2026-11-02', 6)));
  assert.equal(proximasConteudo(ok, brt('2026-11-02', 9)).semana, iso(brt('2026-11-09', 6)));
  assert.equal(proximasConteudo(falhou, brt('2026-11-02', 6, 30)).semana, iso(brt('2026-11-02', 7, 1)));
  assert.equal(proximasConteudo({}, brt('2026-11-08', 22)).semana, iso(brt('2026-11-09', 6)));
  assert.equal(proximasConteudo({}, brt('2026-11-09', 5)).semana, iso(brt('2026-11-09', 6)));
});

// ---------- 21/10 (Pedro): as correções da revisão ----------

// a IA falsa simples: devolve o plano dado e escreve cada linha como veio (a exceção da linha vai junto)
function iaSimples(planoDaSemana, { falharPost = null } = {}) {
  const conta = { plano: 0, post: 0, stories: 0, prompts: [] };
  const ia = async ({ etapa, prompt, schema }) => {
    conta[etapa]++;
    conta.prompts.push({ etapa, prompt });
    if (etapa === 'plano') return { dados: planoDaSemana };
    const linha = JSON.parse(/\n(\{\n[\s\S]*?\n\})\n/.exec(prompt)[1]);
    if (etapa === 'stories') {
      return {
        tema: linha.ideia, objetivo: linha.objetivo, pilar: linha.pilar, pilarTexto: '', motivo: linha.motivo, angulo: '', gatilhoEmocional: 'alívio', gatilhoPsicologico: 'curiosidade',
        ganchoOrigem: 'G04', excecaoAntiRepeticao: linha.excecaoAntiRepeticao ?? '', mecanica: '', cta: 'Responde a enquete', fontes: [],
        quadros: [{ texto: 'Sabe aquela semana corrida?', visual: 'mesa', interacao: '' }, { texto: 'A gente cuida da parte chata.', visual: 'app', interacao: 'enquete' }, { texto: 'Responde aqui', visual: 'fecho', interacao: 'caixinha' }],
      };
    }
    if (falharPost?.(linha)) throw Object.assign(new Error('A IA passou de 4 minutos e foi cancelada.'), { status: 504 });
    const g = {
      ideia: linha.ideia, pilar: linha.pilar, motivo: linha.motivo, angulo: '', gatilhoEmocional: 'alívio', gatilhoPsicologico: 'identificação', persona: 'B', leo: linha.leo,
      ganchoOrigem: 'G12', excecaoAntiRepeticao: linha.excecaoAntiRepeticao ?? '', formatoTexto: `Feed · ${linha.peca}`,
      legenda: 'Salva esse post pra quando bater a dúvida 📌\nA rotina do dono tem mais papel do que devia.\nManda pra quem vive isso 💬',
      fontes: [], explicacao: { porque: 'A dor da papelada.', baseTecnica: ['Sem fato na base: nenhum número. Conferir.'], objetivo: 'Gerar salvamento.' },
    };
    if (schema.properties.roteiro) g.roteiro = { hook: 'Esse ponto parece difícil', textoTela: 'Parece difícil', cenas: [{ tempo: '0-3s', cena: 'mesa', fala: 'Esse ponto parece difícil.', tela: '' }, { tempo: '3-10s', cena: 'tela', fala: 'O app cuida da parte chata.', tela: '' }, { tempo: '10-15s', cena: 'fecho', fala: 'Salva pra quando precisar.', tela: '' }], desenvolvimento: 'O app cuida da parte chata.', cta: 'Salva pra quando precisar.' };
    if (schema.properties.carrossel) g.carrossel = { capa: { titulo: linha.ideia, texto: '', visual: 'capa' }, slides: [{ titulo: 'O mito', texto: 'Muita gente acha isso.', visual: '' }, { titulo: 'A verdade', texto: 'Na ME a gente abre pelo app.', visual: '' }], final: { titulo: 'Salva', texto: 'Salva pra lembrar.', visual: '' } };
    if (schema.properties.estatico) g.estatico = { headline: linha.ideia, apoio: 'Tudo pelo app, em poucos campos.', visual: 'arte', cta: 'Salva pra depois.' };
    return g;
  };
  return { ia, conta };
}
const linhaPost = (data, peca, pilar, ideia, extra = {}) => ({ ...COMUM, data, peca, pilar, ideia, motivo: 'Defesa da peça.', ...extra });
const linhaStories = (data, pilar, ideia, extra = {}) => ({ ...COMUM, data, pilar, ideia, motivo: 'Conversa com o post do dia.', objetivo: 'engajamento', pilarTexto: '', ...extra });
const CONTAGEM = 'Contagem regressiva da abertura, de propósito.';

test('gerador: a exceção da IA só vale na 1ª campanha; stories do plano ligados ao post; sugestão marcada como usada', async () => {
  // a sugestão do Google da semana de 07/12 (o reel do pilar 2 usa)
  writeFileSync(path.join(dados, 'sugestoes-semana.json'), JSON.stringify({ versao: 1, semanas: { '2026-12-07': {
    semana: '2026-12-07', geradoEm: iso(AGORA), erro: null, buscas: [], manchetes: [],
    temas: [{ id: 'tem_teste01', tema: 'O domingo procurando comprovante', porque: 'busca', evidencias: [{ tipo: 'google-busca', texto: 'comprovante mei' }], bloco: 'Afeto', pilar: 2, peca: 'reel', comoUsar: 'Humor.' }],
  } } }));
  const planoSemana = {
    posts: [
      // pilar 10 com a exceção da campanha: o único alerta é o da 1ª campanha (libera)
      linhaPost('2026-12-08', 'estatico', 10, 'A lista de espera abre a contagem pro app', { excecaoAntiRepeticao: CONTAGEM }),
      // pilar 5 repetindo o mito de 13/11 com uma exceção inventada pela IA (não libera)
      linhaPost('2026-12-10', 'carrossel', 5, 'Mito: abrir empresa sempre exige cartório', { excecaoAntiRepeticao: 'Série do mito, de propósito.' }),
      linhaPost('2026-12-09', 'reel', 2, 'Humor: a pasta de recibos que mora no carro do dono', { leo: 'forte', sugestaoUsada: 'tem_teste01' }),
      linhaPost('2026-12-11', 'estatico', 9, 'Bastidor: como a gente confere a guia antes de mandar'),
    ],
    // o stories do dia do reel, com o pilar dele: ligado ao post, não é pilar repetido
    stories: [linhaStories('2026-12-09', 2, 'Enquete: onde mora a sua pasta de recibos?')],
  };
  const { ia, conta } = iaSimples(planoSemana);
  const enviadas = [];
  const r = await ger.gerarSemana({ agoraMs: AGORA, inicio: '2026-12-07', ia, pesquisar: false, aprovar: async (id) => { enviadas.push(id); } });
  // o plano veio curto e com a exceção que não vale: refeito uma vez, com os achados
  assert.equal(conta.plano, 2);
  const refeito = conta.prompts.filter((x) => x.etapa === 'plano')[1].prompt;
  assert.match(refeito, /Série do mito, de propósito\.\"\) não vale aqui/);
  assert.doesNotMatch(refeito, /O pilar 2 aparece 2 vezes/, 'o stories do plano já está ligado ao reel do dia');
  assert.doesNotMatch(refeito, /Mecanismo \(campanha\)/, 'a exceção da campanha no pilar 10 vale');
  const db = await carregar();
  const daSemana = db.reels.filter((x) => x.calendario?.startsWith('gerador:2026-12-07:'));
  const oferta = daSemana.find((x) => x.pilar === 10);
  assert.equal(oferta.status, 'roteiro');
  assert.deepEqual(oferta.excecaoAntiRepeticao, { ativa: true, motivo: CONTAGEM });
  assert.match(oferta.notas, /exceção de anti-repetição da 1ª campanha \(pilar 10\), pedida pela IA/);
  assert.ok(enviadas.includes(oferta.id));
  const mito = daSemana.find((x) => x.pilar === 5);
  assert.equal(mito.status, 'ideia', 'a exceção inventada pela IA não manda pra aprovação');
  assert.deepEqual(mito.excecaoAntiRepeticao, { ativa: false, motivo: 'Série do mito, de propósito.' });
  assert.match(mito.notas, /NÃO FOI PRA APROVAÇÃO/);
  assert.match(mito.notas, /sugerida pela IA, desligada \(um humano confirma\)/);
  assert.ok(!enviadas.includes(mito.id));
  assert.ok(r.criadas.find((c) => c.id === mito.id).problemas.some((p) => /Mecanismo \(repeticao\)/.test(p)));
  // o stories ligado ao reel do dia, sem alerta de repetição
  const reel = daSemana.find((x) => x.pilar === 2);
  const st = db.stories.find((s) => s.calendario?.startsWith('gerador:2026-12-07:'));
  assert.equal(st.pecaDoDia, reel.id);
  assert.deepEqual(r.criadas.find((c) => c.id === st.id).problemas, []);
  // a sugestão do Google que virou o reel ficou marcada como usada
  const sug = JSON.parse(readFileSync(path.join(dados, 'sugestoes-semana.json'), 'utf8')).semanas['2026-12-07'].temas[0];
  assert.deepEqual([sug.usadoEm?.pecaId, sug.usadoEm?.data, sug.usadoEm?.por], [reel.id, '2026-12-09', 'Gerador da semana']);
  // o resumo diz o que ainda falta na semana (o plano veio curto): a agenda tenta de novo
  assert.deepEqual(r.faltam, { reels: 2, feeds: 2, stories: 4 });
  assert.match(geracaoIncompleta(r), /^A geração da semana ficou incompleta: faltam 2 reels, 2 feeds e 4 temas de stories\./);
});

test('gerador: o teto da oferta refaz o plano e, no fim, o pilar 10 que passa dele entra como ideia', async () => {
  const db = await carregar();
  const antes = db.config.tetoVenda;
  db.config.tetoVenda = { ...antes, naPromocao: 5 };
  try {
    const { ia, conta } = iaSimples({ posts: [linhaPost('2026-12-15', 'estatico', 10, 'A contagem pro app chegar, com a lista de espera', { excecaoAntiRepeticao: CONTAGEM })], stories: [] });
    const enviadas = [];
    const r = await ger.gerarSemana({ agoraMs: AGORA, inicio: '2026-12-14', ia, pesquisar: false, aprovar: async (id) => { enviadas.push(id); } });
    assert.equal(conta.plano, 2);
    assert.match(conta.prompts[1].prompt, /Semana: oferta \(pilar 10\) em 100% da semana; o teto é 5%\. Tire 1 item do pilar 10 do plano\./);
    assert.match(conta.prompts[1].prompt, /Semana: Conversão em 100%/);
    const c = r.criadas[0];
    assert.equal(c.status, 'ideia');
    assert.ok(c.problemas.some((p) => /^Passa do teto da oferta: o pilar 10 ficou em 100% da semana e o teto é 5%/.test(p)));
    assert.deepEqual(enviadas, []);
  } finally {
    db.config.tetoVenda = antes;
  }
  // a regra da semana, direto: a continuidade só pede o que o plano consegue fazer
  const analise = {
    itens: [{ id: 'novo', tipo: 'peca', pilar: 4, bloco: 'Educação' }, { id: 'velho', tipo: 'peca', pilar: 1, bloco: 'Afeto' }],
    oferta: { n: 0, pct: 0, teto: 30, ok: true }, mix: Object.fromEntries(['Afeto', 'Educação', 'Diferencial', 'Conversão'].map((b) => [b, { ok: true }])),
    continuidade: [{ tipo: 'caixinha-quinzenal', ok: false, texto: 'Pede caixinha.' }, { tipo: 'resposta-caixinha', ok: false, texto: 'Pede resposta.' }],
  };
  assert.deepEqual(ger.problemasDaSemana(analise, new Set(['novo'])), ['Continuidade: Pede resposta.'], 'a caixinha nova é stories, e o plano não tem stories');
  assert.deepEqual(ger.problemasDaSemana(analise, new Set()), [], 'sem item no plano, nada a refazer');
});

test('gerador: só dias que ainda não chegaram; semana que já terminou é 400', async () => {
  const { ia, conta } = iaSimples({
    posts: [linhaPost('2026-11-16', 'reel', 4, 'A papelada da segunda que já passou'), linhaPost('2026-11-20', 'carrossel', 16, 'Separar o dinheiro da empresa do seu')],
    stories: [linhaStories('2026-11-17', 12, 'Enquete de terça que já passou'), linhaStories('2026-11-21', 1, 'Bastidor do sábado')],
  });
  const quarta = brt('2026-11-18', 12);
  const r = await ger.gerarSemana({ agoraMs: quarta, inicio: '2026-11-16', ia, pesquisar: false, simular: true });
  const p0 = conta.prompts.find((x) => x.etapa === 'plano').prompt;
  assert.match(p0, /Os dias de antes já passaram: post e stories só nestes dias: 19\/11 quinta, 20\/11 sexta, 21\/11 sábado, 22\/11 domingo\./);
  assert.match(p0, /só nestes dias livres: 19\/11 quinta, 20\/11 sexta, 21\/11 sábado, 22\/11 domingo/);
  assert.match(conta.prompts.filter((x) => x.etapa === 'plano')[1].prompt, /O post "A papelada da segunda que já passou" cai em 16\/11, que já passou\./);
  assert.ok(r.criadas.length > 0 && r.criadas.every((c) => c.data > '2026-11-18'), 'nada em dia que já passou');
  await assert.rejects(ger.gerarSemana({ agoraMs: brt('2026-11-15', 12), inicio: '2026-11-09', ia, pesquisar: false }), (e) => e.status === 400 && /já terminou/.test(e.message));
  await assert.rejects(ger.gerarSemana({ agoraMs: brt('2026-12-01', 12), inicio: '2026-11-25', ia, pesquisar: false }), (e) => e.status === 400);
  const f = ger.faltasDaSemana(await carregar(), '2026-11-16', { hoje: '2026-11-22' });
  assert.deepEqual([f.diasValidos, f.reels, f.feeds, f.stories], [[], 0, 0, 0], 'sem dia pela frente, não falta nada');
});

test('gerador: regerar mantém formato, campanha, rede e segundo tipo; peça gravada não regera; status conferido depois da IA', async () => {
  const db = await carregar();
  const r = db.reels.find((x) => x.origem === 'gerador-semana' && x.peca === 'estatico' && x.data === '2026-11-12');
  Object.assign(r, { formatoId: 'fmt_1_1', campanhaId: 'cmp_outra', rede: 'Instagram e TikTok', peca2: 'stories', status: 'roteiro' });
  const { ia } = iaFalsa();
  const novo = await ger.regerar({ id: r.id, ia, autor: 'Pedro Maia' });
  assert.deepEqual([novo.formatoId, novo.campanhaId, novo.rede, novo.peca2], ['fmt_1_1', 'cmp_outra', 'Instagram e TikTok', 'stories']);
  const volta = await ger.regerar({ id: r.id, voltar: true });
  assert.deepEqual([volta.formatoId, volta.campanhaId, volta.rede, volta.peca2], ['fmt_1_1', 'cmp_outra', 'Instagram e TikTok', 'stories']);
  // gravada ou editada: 409, nada muda (nem pra voltar)
  for (const status of ['gravado', 'editado']) {
    r.status = status;
    await assert.rejects(ger.regerar({ id: r.id, ia }), (e) => e.status === 409 && /já tem gravação/.test(e.message));
    await assert.rejects(ger.regerar({ id: r.id, voltar: true }), (e) => e.status === 409);
  }
  // gravada enquanto a IA escrevia: 409 e a peça fica como estava
  r.status = 'roteiro';
  const ideia = r.ideia;
  const versoes = r.versoesAnteriores?.length ?? 0;
  const { ia: iaLenta } = iaFalsa();
  const gravaNoMeio = async (args) => { r.status = 'gravado'; return iaLenta(args); };
  await assert.rejects(ger.regerar({ id: r.id, ia: gravaNoMeio }), (e) => e.status === 409 && /enquanto a IA escrevia/.test(e.message));
  assert.equal(r.ideia, ideia);
  assert.equal(r.versoesAnteriores?.length ?? 0, versoes);
  r.status = 'roteiro';
});

test('gerador: sem a chave da IA, a agenda ainda grava a pesquisa no Google da semana antes do 503', async () => {
  const p = await import('../pesquisa-temas.mjs');
  const rotas = {};
  for (const s of p.SEMENTES) rotas[p.urlSugestao(s)] = JSON.stringify([s, [`${s} 2026`]]);
  for (const q of p.BUSCAS_NOTICIAS) rotas[p.urlManchetes(q)] = `<rss><channel><item><title>${q} muda - Agência Brasil</title><link>https://news.google.com/rss/articles/${encodeURIComponent(q)}</link><pubDate>${new Date(AGORA - 3_600_000).toUTCString()}</pubDate></item></channel></rss>`;
  const fetchEra = globalThis.fetch;
  const chamadas = [];
  globalThis.fetch = async (url) => { chamadas.push(url); return rotas[url] ? new Response(rotas[url], { status: 200 }) : new Response('não', { status: 404 }); };
  const era = process.env.CRONOGRAMA_IA;
  process.env.CRONOGRAMA_IA = '0';
  try {
    // sem pesquisarSemIa (o botão "Gerar"): 503 na hora, sem rede
    await assert.rejects(ger.gerarSemana({ agoraMs: AGORA, inicio: '2026-12-21' }), (e) => e.status === 503 && e.message === MSG_SEM_IA);
    assert.equal(chamadas.length, 0);
    // a agenda: pesquisa, grava as buscas e as manchetes (sem temas) e aí o 503
    await assert.rejects(ger.gerarSemana({ agoraMs: AGORA, inicio: '2026-12-21', pesquisarSemIa: true }), (e) => e.status === 503 && e.message === MSG_SEM_IA);
    const s = await p.ler('2026-12-23');
    assert.equal(s.buscas.length, p.SEMENTES.length);
    assert.equal(s.manchetes.length, p.BUSCAS_NOTICIAS.length);
    assert.deepEqual(s.temas, []);
    assert.ok(s.erro.startsWith(MSG_SEM_IA));
  } finally {
    globalThis.fetch = fetchEra;
    if (era === undefined) delete process.env.CRONOGRAMA_IA;
    else process.env.CRONOGRAMA_IA = era;
  }
});

test('gerador: a IA que cai num post deixa a semana incompleta (a agenda tenta de novo)', async () => {
  const { ia } = iaSimples({ posts: [linhaPost('2026-12-29', 'reel', 4, 'A papelada do fim do ano'), linhaPost('2026-12-30', 'carrossel', 16, 'O que separar pro ano novo')], stories: [] }, { falharPost: (l) => l.peca === 'reel' });
  const r = await ger.gerarSemana({ agoraMs: AGORA, inicio: '2026-12-28', ia, pesquisar: false, simular: true });
  assert.ok(r.erros.some((e) => /Post de 29\/12 .*passou de 4 minutos/.test(e)));
  assert.equal(r.faltam.reels, 3, 'o reel não foi escrito');
  assert.match(geracaoIncompleta(r), /faltam 3 reels, 4 feeds e 5 temas de stories\. Post de 29\/12/);
  assert.equal(geracaoIncompleta({ faltam: { reels: 0, feeds: 0, stories: 0 } }), null);
  assert.equal(geracaoIncompleta({ faltam: { reels: 1, feeds: 0, stories: 0 }, erros: [] }), 'A geração da semana ficou incompleta: falta 1 reel. Tenta de novo em 1 hora.');
  assert.equal(geracaoIncompleta({ mensagem: 'antigo, sem faltam' }), null);
});

test('agenda: a falha sem a chave da IA é anotada uma vez e não tenta de novo no mesmo dia', async () => {
  const devida = (conteudo, ms, opcoes) => tarefasConteudoDevidas(conteudo, ms, opcoes).includes('semana');
  const semIa = { semana: { em: iso(brt('2026-11-02', 6, 1)), ok: false, erro: MSG_SEM_IA, semIa: true } };
  assert.equal(devida(semIa, brt('2026-11-02', 7, 30)), false, 'eram 18 tentativas iguais até as 23:00');
  assert.equal(devida(semIa, brt('2026-11-02', 23, 0)), false);
  assert.equal(devida(semIa, brt('2026-11-02', 7, 30), { iaLigada: true }), true, 'a chave chegou: tenta de novo');
  assert.equal(devida(semIa, brt('2026-11-02', 6, 30), { iaLigada: true }), false, 'mas respeita a 1 hora');
  assert.equal(devida(semIa, brt('2026-11-09', 6, 0)), true, 'na segunda seguinte, de novo');
  assert.equal(proximasConteudo(semIa, brt('2026-11-02', 7)).semana, iso(brt('2026-11-09', 6)));
  assert.equal(proximasConteudo(semIa, brt('2026-11-02', 7), null, { iaLigada: true }).semana, iso(brt('2026-11-02', 7, 1)));
  // o agenda.json guarda a marca
  await anotarConteudo('semana', { ok: false, erro: MSG_SEM_IA, semIa: true });
  const e = await estadoConteudo();
  assert.equal(e.ultimas.semana.semIa, true);
  assert.equal(e.ultimas.semana.erro, MSG_SEM_IA);
  await anotarConteudo('semana', { ok: false, erro: 'outra coisa' });
  assert.equal((await estadoConteudo()).ultimas.semana.semIa, undefined);
});
