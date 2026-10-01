// Testes de server/diagnostico-motor.mjs (node --test) com banco falso montado aqui mesmo. Rodar: npm run testar
// O codebook é um recorte da tabela da SPEC §3.3 escrito aqui (não importa mecanismos-codebook.mjs): o teste
// não quebra quando outro módulo muda
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  montarPosts, calcularEfeitos, gerarInsights, recomendacoesPara, blocoParaIa, avaliarHipotese, metaPara,
  metasPorTipo, numerosDaConta, pendenciasDe, anuncioDoPost, pessoasNaBaseApp, visiveisDoApp, AVISO_HUMOR,
} from '../diagnostico-motor.mjs';

const TRACO = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const semTraco = (x) => assert.ok(!TRACO.test(JSON.stringify(x)), 'texto com travessão ou meia-risca');

const AGORA = '2026-09-30T15:00:00.000Z';
const H = 3_600_000;
const antes = (dias, horas = 0) => new Date(Date.parse(AGORA) - (dias * 24 + horas) * H).toISOString();
const ROTULOS = { viralizacao: 'Viralização', vendas: 'Vendas', conexao: 'Conexão', ensino: 'Ensino', conselho: 'Conselho' };
const PILARES = [{ id: 4, nome: 'Dor educativa', bloco: 'Educação' }, { id: 5, nome: 'Mitos', bloco: 'Educação' }, { id: 6, nome: 'Calendário fiscal', bloco: 'Educação' }];
const SIM_NAO = [{ id: true, nome: 'Sim' }, { id: false, nome: 'Não' }];
const TODAS = ['reel', 'carrossel', 'estatico'];
const v = (...ids) => ids.map((id) => ({ id, nome: id }));
const DIMS = [
  { id: 'pilar', nome: 'Pilar', grupo: 'fundamento', etapa: 'objetivo', aplica: 'planejamento', pecas: TODAS, fontes: ['manual', 'cronograma'], valores: [{ id: '4', nome: '4 · Dor educativa' }, { id: '5', nome: '5 · Mitos' }, { id: '6', nome: '6 · Calendário fiscal' }], tipo: 'enum' },
  { id: 'tipo', nome: 'Tipo', grupo: 'fundamento', etapa: 'objetivo', aplica: 'planejamento', pecas: TODAS, fontes: ['manual', 'cronograma'], valores: Object.entries(ROTULOS).map(([id, nome]) => ({ id, nome })), tipo: 'enum' },
  { id: 'ganchoFamilia', nome: 'Gancho: família', grupo: 'mecanismo', etapa: 'gancho', aplica: 'peca', pecas: ['reel', 'carrossel'], fontes: ['manual', 'ia'], valores: v('gancho-direto', 'curiosidades', 'educativo-rapido', 'listas', 'perguntas', 'fator-r', 'fora-do-banco'), tipo: 'enum' },
  { id: 'ganchoForma', nome: 'Gancho: forma', grupo: 'mecanismo', etapa: 'gancho', aplica: 'peca', pecas: TODAS, fontes: ['manual', 'ia'], valores: v('pergunta', 'afirmacao', 'numero', 'cena', 'sem-fala'), tipo: 'enum' },
  { id: 'rostoInicio', nome: 'Rosto nos 3 primeiros segundos', grupo: 'mecanismo', etapa: 'gancho', aplica: 'peca', pecas: ['reel'], fontes: ['manual', 'ia'], valores: SIM_NAO, tipo: 'bool' },
  { id: 'cta', nome: 'CTA', grupo: 'mecanismo', etapa: 'conversao', aplica: 'peca', pecas: TODAS, fontes: ['manual', 'ia', 'cronograma'], valores: v('seguir', 'salvar', 'mandar', 'comentar', 'lista-de-espera', 'fora-do-escopo', 'curtir', 'sem-cta'), tipo: 'enum' },
  { id: 'humor', nome: 'Humor', grupo: 'mecanismo', etapa: 'qualidade', aplica: 'peca', pecas: TODAS, fontes: ['manual', 'ia'], valores: SIM_NAO, tipo: 'bool' },
  { id: 'preco', nome: 'Preço na peça', grupo: 'mecanismo', etapa: 'conversao', aplica: 'peca', pecas: TODAS, fontes: ['manual', 'ia'], valores: SIM_NAO, tipo: 'bool' },
  { id: 'impulsionado', nome: 'Teve anúncio', grupo: 'contexto', etapa: 'contexto', aplica: 'nunca', pecas: TODAS, fontes: ['manual', 'calculado'], valores: SIM_NAO, tipo: 'bool' },
];
const CTA_POR_TIPO = {
  viralizacao: ['salvar', 'mandar', 'comentar', 'fora-do-escopo'],
  conexao: ['comentar', 'mandar', 'seguir', 'fora-do-escopo'],
  ensino: ['salvar', 'mandar', 'seguir', 'fora-do-escopo'],
  conselho: ['salvar', 'mandar', 'fora-do-escopo'],
  vendas: ['lista-de-espera', 'fora-do-escopo'],
};
const FAMILIAS = { ensino: ['educativo-rapido', 'curiosidades', 'listas'], vendas: ['gancho-direto', 'listas'] };

let seq = 18_000_000_000;
function midia(dias, extra = {}) {
  const id = String(seq++);
  return {
    midiaId: id, tipo: 'REELS', timestamp: antes(dias), insightsEm: AGORA, permalink: `https://www.instagram.com/reel/C${id}/`,
    caption: 'Legenda de teste\nsegunda linha', views: 500, reach: 300, saved: 1, shares: 2, likes: 10, comments: 1, interacoes: 14,
    avgWatchMs: 7000, skipRate: 60, ...extra,
  };
}
// tipos = { [midiaId]: tipo } vira a peça vinculada e a tag de tipo do cronograma
function montar({ midias, tipos = {}, tags = {}, registros = {}, historico = {}, publico = null, conta = { followers_count: 100 }, duracoes = {}, anuncios = null }) {
  const reelPorMidia = {};
  const tagsPorMidia = {};
  for (const m of midias) {
    const t = tipos[m.midiaId];
    if (t) reelPorMidia[m.midiaId] = { id: `reel_t${m.midiaId}`, ideia: `Peça ${m.midiaId}`, tipo: t, pilar: 4 };
    tagsPorMidia[m.midiaId] = { ...(t ? { tipo: { valor: t, fonte: 'cronograma' } } : {}), ...(tags[m.midiaId] ?? {}) };
  }
  return montarPosts({
    midias, reelPorMidia, tagsPorMidia, registros, historico, publico, conta, duracoes, anuncios,
    pilares: PILARES, dimensoes: DIMS, rotulosTipo: ROTULOS, agora: AGORA,
  });
}
const todosDoTipo = (ms, tipo) => Object.fromEntries(ms.map((m) => [m.midiaId, tipo]));
const achar = (posts, m) => posts.find((p) => p.midiaId === m.midiaId);

// ---------- objetivo por tipo ----------

test('Ensino: salvamentos contra a mediana das 5 anteriores do tipo, meta de 2× e a frase da SPEC', () => {
  const anteriores = [1, 2, 1, 0, 3].map((saved, i) => midia(40 - i * 5, { saved }));
  const alvo = midia(10, { saved: 3 });
  const posts = montar({ midias: [...anteriores, alvo], tipos: todosDoTipo([...anteriores, alvo], 'ensino') });
  const p = achar(posts, alvo);
  assert.equal(p.objetivo.id, 'salvamentos');
  assert.equal(p.objetivo.valor, 3);
  assert.equal(p.objetivo.fonte, 'api');
  assert.equal(p.objetivo.idadeRef, 'atual');
  assert.equal(p.objetivo.base, 1);
  assert.equal(p.objetivo.baseN, 5);
  assert.equal(p.objetivo.baseDe, 'tipo');
  assert.equal(p.objetivo.meta, 3);
  assert.equal(p.objetivo.score, 1);
  assert.equal(p.objetivo.bateuMeta, true);
  assert.ok(p.porque.bem.includes('Na métrica do tipo Ensino (salvamentos), fez 3, contra 1 na mediana dos últimos 5 reels de Ensino. Meta de 2×: 3. Bateu.'));
  assert.equal(posts[0].midiaId, alvo.midiaId, 'mais novo primeiro');
  assert.equal(p.legenda1, 'Legenda de teste');
  semTraco(posts);
});

test('objetivo de cada tipo e da peça sem tipo', () => {
  const viral = midia(20, { reach: 400 });
  const conselho = midia(20, { saved: 2, shares: 3 });
  const conexao = midia(20, { comments: 4, shares: 3 });
  const semTipo = midia(20, { reach: 250 });
  const posts = montar({ midias: [viral, conselho, conexao, semTipo], tipos: { [viral.midiaId]: 'viralizacao', [conselho.midiaId]: 'conselho', [conexao.midiaId]: 'conexao' } });
  assert.deepEqual([achar(posts, viral).objetivo.id, achar(posts, viral).objetivo.valor], ['alcance', 400]);
  assert.deepEqual([achar(posts, conselho).objetivo.id, achar(posts, conselho).objetivo.valor], ['salvar-mandar', 5]);
  assert.deepEqual([achar(posts, conexao).objetivo.id, achar(posts, conexao).objetivo.valor], ['conversa', 7]);
  const s = achar(posts, semTipo);
  assert.equal(s.tipo, null);
  assert.equal(s.objetivo.id, 'alcance');
  assert.equal(s.objetivo.rotulo, 'Alcance (peça sem tipo)');
  assert.equal(s.objetivo.valor, 250);
  assert.ok(s.avisos.some((a) => a.startsWith('Peça sem tipo')));
});

test('Vendas: número do app no reel (cadastros fora da soma), feed pela API e sem dado quando falta', () => {
  const comApp = midia(12);
  const semApp = midia(11);
  const feed = midia(9, { tipo: 'FEED', follows: 2, profileVisits: 7, avgWatchMs: undefined, skipRate: undefined });
  const registros = { [comApp.midiaId]: { manual: { follows: 2, profileVisits: 10, bioLinkClicks: 3, cadastros: 1, em: AGORA, autor: 'Pedro' } } };
  const posts = montar({ midias: [comApp, semApp, feed], tipos: todosDoTipo([comApp, semApp, feed], 'vendas'), registros });
  const a = achar(posts, comApp);
  assert.equal(a.objetivo.id, 'interesse');
  assert.equal(a.objetivo.valor, 15);
  assert.equal(a.objetivo.fonte, 'manual');
  assert.equal(a.objetivo.cadastros, 1);
  assert.equal(a.metricas.cadastros, 1);
  const b = achar(posts, semApp);
  assert.equal(b.objetivo.valor, null);
  assert.equal(b.objetivo.fonte, null);
  assert.ok(b.avisos.includes('Sem dado: informe os números do app (seguidores, visitas ao perfil e cliques no link).'));
  const c = achar(posts, feed);
  assert.equal(c.peca, 'estatico');
  assert.equal(c.objetivo.valor, 9);
  assert.equal(c.objetivo.fonte, 'api');
  assert.ok(c.avisos.includes('A soma leva só seguidores e visitas ao perfil: cliques no link sem dado.'));
  assert.deepEqual(c.funil.map((x) => x.etapa), ['distribuicao', 'qualidade', 'conversao'], 'feed não tem gancho nem retenção');
  const pend = pendenciasDe(posts);
  assert.equal(pend.find((x) => x.id === 'numeros-app').n, 1);
});

// ---------- base do 2× ----------

test('base: reel não se compara com carrossel; sem tipo nunca mistura formatos; tipo-misto só com tipo', () => {
  const carrossel = (dias, reach) => midia(dias, { tipo: 'CAROUSEL_ALBUM', reach, avgWatchMs: undefined, skipRate: undefined });
  // conta real de 30/09: reels chegam a mil, carrosséis a dezenas; nenhum post antigo tem tipo
  const r = [midia(40, { reach: 1000 }), midia(35, { reach: 900 }), midia(30, { reach: 1100 })];
  const c = [carrossel(38, 60), carrossel(33, 50), carrossel(28, 70)];
  const reelAlvo = midia(20, { reach: 950 });
  const carrosselAlvo = carrossel(19, 65);
  const posts = montar({ midias: [...r, ...c, reelAlvo, carrosselAlvo] });
  const pr = achar(posts, reelAlvo);
  assert.equal(pr.objetivo.baseDe, 'tipo');
  assert.equal(pr.objetivo.base, 1000, 'só os 3 reels sem tipo');
  const pc = achar(posts, carrosselAlvo);
  assert.equal(pc.objetivo.base, 60, 'só os 3 carrosséis sem tipo');
  assert.ok(pr.porque.bem.concat(pr.porque.mal).every((t) => !t.includes('carross')));

  // com tipo: 1 reel de Ensino e 2 carrosséis de Ensino antes: junta os formatos, com aviso
  const e = [midia(50, { saved: 4 }), carrossel(48, 10), carrossel(46, 10)];
  e[1].saved = 8;
  e[2].saved = 6;
  const alvo = midia(44, { saved: 5 });
  const tipos = todosDoTipo([...e, alvo], 'ensino');
  const q = achar(montar({ midias: [...e, alvo], tipos }), alvo);
  assert.equal(q.objetivo.baseDe, 'tipo-misto');
  assert.equal(q.objetivo.base, 6);
  assert.ok(q.avisos.some((a) => a.includes('junta reels e posts de Ensino')));
  semTraco(q);
});

test('base: anúncio, peça depois e provisória ficam fora; menos de 3 do tipo usa o formato, com aviso', () => {
  const e1 = midia(16, { saved: 4 });
  const e2 = midia(15, { saved: 6 });
  const anuncio = midia(14, { saved: 100 });
  const v1 = midia(13, { saved: 1 });
  const v2 = midia(12, { saved: 1 });
  const v3 = midia(11, { saved: 2 });
  const alvo = midia(10, { saved: 5 });
  const depois = midia(8, { saved: 50 });
  const tipos = { ...todosDoTipo([e1, e2, anuncio, alvo, depois], 'ensino'), ...todosDoTipo([v1, v2, v3], 'viralizacao') };
  const registros = { [anuncio.midiaId]: { impulsionado: true } };
  const posts = montar({ midias: [e1, e2, anuncio, v1, v2, v3, alvo, depois], tipos, registros });
  const p = achar(posts, alvo);
  assert.equal(p.objetivo.baseDe, 'formato');
  assert.equal(p.objetivo.baseN, 5);
  assert.equal(p.objetivo.base, 2, 'mediana de 4, 6, 1, 1 e 2');
  assert.ok(p.avisos.includes('Ainda não há 3 peças de Ensino do mesmo formato antes dela: a base usa as últimas 5 do mesmo formato de mídia, de qualquer tipo.'));
  assert.ok(!p.objetivo.baseMidias.includes(anuncio.midiaId));
  assert.ok(!p.objetivo.baseMidias.includes(depois.midiaId));
  const ad = achar(posts, anuncio);
  assert.equal(ad.impulsionado, true);
  assert.ok(ad.avisos[0].startsWith('Teve anúncio'));

  const x1 = midia(30, { saved: 2 });
  const x2 = midia(25, { saved: 2 });
  const x3 = midia(20, { saved: 2 });
  const recente = midia(4, { saved: 100 });
  const novo = midia(1, { saved: 1 });
  const p2 = achar(montar({ midias: [x1, x2, x3, recente, novo], tipos: todosDoTipo([x1, x2, x3, recente, novo], 'ensino') }), novo);
  assert.equal(p2.objetivo.base, 2, 'a de 4 dias é provisória e não entra na base');
  assert.equal(p2.objetivo.baseN, 3);

  const a = midia(30, { saved: 1 });
  const b = midia(25, { saved: 1 });
  const sozinho = midia(10, { saved: 5 });
  const p3 = achar(montar({ midias: [a, b, sozinho], tipos: todosDoTipo([a, b, sozinho], 'ensino') }), sozinho);
  assert.equal(p3.objetivo.base, null);
  assert.equal(p3.objetivo.meta, null);
  assert.equal(p3.objetivo.bateuMeta, null);
  assert.ok(p3.avisos.includes('Ainda sem base: tem 2 peças anteriores com o número e a base precisa de 3.'), 'o aviso conta as que já existem');
  const primeira = achar(montar({ midias: [a, b, sozinho], tipos: todosDoTipo([a, b, sozinho], 'ensino') }), a);
  assert.ok(primeira.avisos.includes('Ainda sem base: nenhuma peça anterior com o número; a base precisa de 3.'));
});

test('meta: 2× a base de 10 ou mais, 2× + 1 abaixo; não bateu fica em "ficou em"', () => {
  const ant = [300, 320, 340, 360, 380].map((reach, i) => midia(40 - i * 5, { reach }));
  const alvo = midia(10, { reach: 500 });
  const posts = montar({ midias: [...ant, alvo], tipos: todosDoTipo([...ant, alvo], 'viralizacao') });
  const p = achar(posts, alvo);
  assert.equal(p.objetivo.base, 340);
  assert.equal(p.objetivo.meta, 680);
  assert.equal(p.objetivo.bateuMeta, false);
  assert.ok(p.porque.bem.some((f) => f.endsWith('Meta de 2×: 680. Ficou em 1,4×.')), 'score acima de zero vai pro "bem"; 1,47× truncado');
  const cartoes = metasPorTipo(posts, { rotulosTipo: ROTULOS, agora: AGORA });
  const viral = cartoes.find((c) => c.tipo === 'viralizacao');
  assert.equal(viral.formato, 'reel');
  assert.equal(viral.base, 360, 'a próxima peça compara com as 5 mais novas (320 a 500)');
  assert.equal(viral.meta, 720);
  assert.equal(viral.ultima.midiaId, alvo.midiaId);
  assert.deepEqual([viral.ultima.base, viral.ultima.meta], [340, 680], 'a última peça na régua dela, não na da próxima');
  assert.equal(cartoes.find((c) => c.tipo === 'ensino').base, null);
  const m = metaPara('ensino', 'reel', posts, { rotulosTipo: ROTULOS, agora: AGORA });
  assert.equal(m.baseDe, 'formato');
  assert.equal(m.meta, 3, 'salvamentos da mediana 1: meta 2 × 1 + 1');
});

test('peça provisória: ritmo contra a base na mesma idade e "bateu" só quando já passou da meta', () => {
  const base = [[1, 4], [2, 5], [3, 6]].map(([aos2, aos7], i) => {
    const m = midia(30 - i * 5, { saved: aos7 + 2 });
    return { m, h: { leituras: [{ idadeH: 24, saved: aos2 }, { idadeH: 48, saved: aos2 }, { idadeH: 168, saved: aos7 }] } };
  });
  const alvo = midia(2, { saved: 4 });
  const historico = Object.fromEntries(base.map((x) => [x.m.midiaId, x.h]));
  const midias = [...base.map((x) => x.m), alvo];
  const posts = montar({ midias, tipos: todosDoTipo(midias, 'ensino'), historico });
  const b0 = achar(posts, base[0].m);
  assert.equal(b0.objetivo.idadeRef, '7d', 'o histórico dá o valor aos 7 dias');
  assert.equal(b0.objetivo.valor, 4);
  const p = achar(posts, alvo);
  assert.equal(p.objetivo.provisorio, true);
  assert.equal(p.objetivo.base, 5);
  assert.equal(p.objetivo.meta, 11);
  assert.equal(p.objetivo.bateuMeta, null);
  assert.equal(p.objetivo.ritmoBase, 2);
  assert.ok(Math.abs(p.objetivo.ritmo - Math.log2(5 / 3)) < 1e-9);
  assert.ok(p.porque.bem.some((f) => f.includes('em 2 dias no ar') && f.includes('No ritmo das peças da base na mesma idade: 1,7×.')));
  assert.ok(p.avisos.includes('Peça com menos de 7 dias: o número ainda cresce e a comparação é provisória.'));
  const nums = numerosDaConta(posts, { agora: AGORA });
  assert.equal(nums.posts, 4);
  assert.equal(nums.avaliadas30d, 0, 'provisória não conta como acerto nem erro');
});

// ---------- funil ----------

test('funil: níveis, gargalo, ponto forte e frases em pt-BR sem travessão', () => {
  const ant = [40, 35, 30, 25, 20].map((d) => midia(d, { skipRate: 60, avgWatchMs: 9000, reach: 300 }));
  const alvo = midia(10, { skipRate: 40, avgWatchMs: 4000, reach: 1005, shares: 20, likes: 10, saved: 1 });
  const midias = [...ant, alvo];
  const duracoes = Object.fromEntries(midias.map((m) => [m.midiaId, 30]));
  const posts = montar({ midias, tipos: todosDoTipo(midias, 'viralizacao'), duracoes });
  const p = achar(posts, alvo);
  const etapa = (id) => p.funil.find((x) => x.etapa === id);
  assert.equal(etapa('gancho').nivel, 'acima');
  assert.equal(etapa('gancho').valorTexto, '60%');
  assert.equal(etapa('retencao').nivel, 'abaixo');
  assert.equal(etapa('retencao').unidade, 'pct');
  assert.equal(etapa('retencao').valorTexto, '13,3%');
  assert.equal(etapa('distribuicao').nivel, 'acima');
  assert.equal(etapa('conversao').valorTexto, 'sem dado', 'reel sem número do app');
  assert.equal(p.gargalo, 'retencao');
  assert.equal(p.forte, 'distribuicao');
  assert.ok(p.porque.bem.includes('O gancho segurou mais gente: 60% passaram dos 3 primeiros segundos, contra 40% na mediana dos últimos reels.'));
  assert.ok(p.porque.bem.includes('Chegou longe: alcance de 1.005 contas, 10× o número de seguidores (a mediana é 3×).'));
  assert.ok(p.porque.mal.includes('Quem ficou assistiu em média 13% do vídeo (4s de 30s), abaixo da mediana (30%).'));
  const q = etapa('qualidade');
  assert.equal(q.partes.length, 3);
  assert.ok(q.detalhe.includes('por mil'));
  semTraco(p);

  const semDuracao = montar({ midias: [...ant.map((m) => ({ ...m, midiaId: String(seq++) })), { ...alvo, midiaId: String(seq++) }], tipos: {} });
  const r = semDuracao[0].funil.find((x) => x.etapa === 'retencao');
  assert.equal(r.unidade, 's');
  assert.equal(r.valorTexto, '4s');
  assert.ok(semDuracao[0].avisos.includes('Sem a duração do vídeo: a retenção compara segundos assistidos.'));
  assert.ok(semDuracao[0].porque.mal.includes('Quem ficou assistiu em média 4s, abaixo da mediana (9s); sem a duração do vídeo, a comparação é em segundos.'));
});

// ---------- efeitos e insights ----------

function linha(id, { score, tags = {}, funil = [], peca = 'reel', tipo = 'ensino', impulsionado = false, provisorio = false, idadeH = 400 }) {
  return { midiaId: String(id), peca, tipo, impulsionado, idadeH, tags, objetivo: { score, provisorio, valor: 1, base: 1 }, funil };
}

test('efeitos: encolhimento, evidência, anúncio e provisória de fora; insight com N e rótulo', () => {
  const posts = [
    ...[1.2, 1, 1.4, 0.9, 1.1, 1.3].map((s, i) => linha(100 + i, { score: s, tags: { ganchoForma: { valor: 'pergunta', fonte: 'ia' } } })),
    ...[-0.2, 0, 0.1, -0.3, -0.1].map((s, i) => linha(200 + i, { score: s, tags: { ganchoForma: { valor: 'afirmacao', fonte: 'ia' } } })),
    linha(300, { score: -5, impulsionado: true, tags: { ganchoForma: { valor: 'pergunta', fonte: 'ia' } } }),
    linha(301, { score: -5, provisorio: true, tags: { ganchoForma: { valor: 'pergunta', fonte: 'ia' } } }),
  ];
  const efeitos = calcularEfeitos(posts, DIMS);
  const pergunta = efeitos.find((e) => e.dimensao === 'ganchoForma' && e.valor === 'pergunta');
  assert.equal(pergunta.n, 6);
  assert.equal(pergunta.nSem, 5);
  assert.equal(pergunta.evidencia, 'forte');
  assert.equal(pergunta.semComparacao, false);
  assert.ok(pergunta.efeito < pergunta.mediaCom - pergunta.mediaSem, 'encolhido pra zero');
  assert.ok(!pergunta.midias.includes('300') && !pergunta.midias.includes('301'));
  const insights = gerarInsights(efeitos, posts, DIMS);
  const usar = insights.find((i) => i.id === 'ins_ganchoForma_pergunta');
  assert.equal(usar.acao, 'usar');
  assert.equal(usar.nSem, 5);
  assert.equal(usar.prep, 'com gancho de pergunta');
  assert.equal(usar.texto, 'Peças com gancho de pergunta ficaram em 2,2× a base, contra 0,9× das outras (6 reels contra 5, evidência forte).');
  const evitar = insights.find((i) => i.id === 'ins_ganchoForma_afirmacao');
  assert.equal(evitar.acao, 'evitar');
  assert.equal(evitar.evidencia, 'forte');
  assert.equal(evitar.texto, 'Peças com gancho de afirmação ficaram em 0,9× a base, contra 2,2× das outras (5 reels contra 6, evidência forte).');
  assert.equal(insights[0].id, 'ins_ganchoForma_pergunta', 'a mais forte primeiro');
  semTraco(insights);
});

test('insight da etapa (rosto no começo) e só o lado "com" do sim ou não', () => {
  const gancho = (valor, score) => [{ etapa: 'gancho', valor, score, unidade: 'pct' }];
  // o objetivo quase empata (sem evidência): quem fala é a etapa do gancho
  const posts = [
    ...[[50, 0.4], [52, 0.45], [54, 0.5], [51, 0.42], [53, 0.48]].map(([vl, s], i) => linha(400 + i, { score: [0.9, 1, 1.1, 0.95, 1.05][i], tags: { rostoInicio: { valor: true, fonte: 'ia' } }, funil: gancho(vl, s) })),
    ...[[38, -0.1], [37, -0.12], [39, -0.08], [38, -0.1]].map(([vl, s], i) => linha(500 + i, { score: 0.95, tags: { rostoInicio: { valor: false, fonte: 'ia' } }, funil: gancho(vl, s) })),
  ];
  const efeitos = calcularEfeitos(posts, DIMS);
  const rostoSim = efeitos.find((e) => e.dimensao === 'rostoInicio' && e.valor === true);
  assert.equal(rostoSim.evidencia, 'insuficiente');
  assert.equal(rostoSim.evidenciaEtapa, 'moderada');
  assert.equal(rostoSim.mediaEtapaCom, 52);
  assert.equal(rostoSim.mediaEtapaSem, 38);
  const insights = gerarInsights(efeitos, posts, DIMS);
  const rosto = insights.find((i) => i.dimensao === 'rostoInicio');
  assert.equal(rosto.id, 'ins_rostoInicio_true');
  assert.equal(rosto.acao, 'usar');
  assert.equal(rosto.etapa, 'gancho');
  assert.equal(rosto.texto, 'Com rosto nos 3 primeiros segundos, 52% passaram do gancho, contra 38% sem rosto (5 reels contra 4, evidência moderada).');
  assert.ok(!insights.some((i) => i.id === 'ins_rostoInicio_false'));
  semTraco(insights);
});

test('planejamento: pilar vira "planejar" (nunca recomendação), com aviso quando está em standby', () => {
  const posts = [
    ...[1.4, 1.5, 1.6, 1.45, 1.55].map((s, i) => linha(600 + i, { score: s, tags: { pilar: { valor: '6', fonte: 'cronograma' } } })),
    ...[0.2, 0.1, 0.3, 0.2, 0.2].map((s, i) => linha(700 + i, { score: s, tags: { pilar: { valor: '5', fonte: 'cronograma' } } })),
  ];
  const insights = gerarInsights(calcularEfeitos(posts, DIMS), posts, DIMS);
  const p6 = insights.find((i) => i.id === 'ins_pilar_6');
  assert.equal(p6.acao, 'planejar');
  assert.equal(p6.evidencia, 'forte');
  assert.equal(p6.standby, true);
  assert.equal(p6.texto, 'Peças do pilar 6 · Calendário fiscal ficaram em 2,8× a base, contra 1,1× das outras (5 reels contra 5, evidência forte). O pilar está em standby: fica fora do calendário.');
  const p5 = insights.find((i) => i.id === 'ins_pilar_5');
  assert.equal(p5.acao, 'planejar');
  assert.equal(p5.standby, false);
  const r = recomendacoesPara({ id: 'reel_pla01', tipo: 'ensino', peca: 'reel', pilar: 6 }, contexto({ insights }));
  assert.equal(r.itens.length, 0, 'pilar é do calendário: nunca vira recomendação de peça');
  const bloco = blocoParaIa({ tipo: 'ensino', pecas: ['reel'], pilar: 6 }, contexto({ insights, posts: [] }));
  assert.ok(!bloco.includes('Pilar desta peça'), 'pilar em standby não entra no bloco da IA');
  const bloco5 = blocoParaIa({ tipo: 'ensino', pecas: ['reel'], pilar: '5' }, contexto({ insights, posts: [] }));
  assert.equal(bloco5, '', 'sem meta, sem mecanismo e sem hipótese: vazio');
});

test('sem peça do outro lado não vira insight; sinal misturado compara com as outras; sinal de uma peça só de mecanismo', () => {
  const DIAS = [...DIMS, { id: 'diaSemana', nome: 'Dia da semana', grupo: 'mecanismo', etapa: 'distribuicao', aplica: 'peca', pecas: TODAS, fontes: ['calculado'], valores: v('ter', 'qua', 'sex'), tipo: 'enum' }];
  const conv = [{ etapa: 'conversao', valor: 5, score: 0.5, unidade: 'pormil' }];
  const tudoIgual = [0.6, 0.8, 0.7, 0.9, 0.75].map((s, i) => linha(800 + i, { score: s, tags: { cta: { valor: 'salvar', fonte: 'ia' } }, funil: conv }));
  const e1 = calcularEfeitos(tudoIgual, DIMS);
  const salvar = e1.find((e) => e.valor === 'salvar');
  assert.equal(salvar.nSem, 0);
  // sem comparação (C6): sem efeito nem evidência, mas com o N e a média de quem tem o valor
  assert.equal(salvar.semComparacao, true);
  assert.deepEqual([salvar.efeito, salvar.bruto, salvar.consistencia, salvar.evidencia], [null, null, null, 'insuficiente']);
  assert.equal(salvar.n, 5);
  assert.ok(Math.abs(salvar.mediaCom - 0.75) < 1e-9);
  assert.ok(Math.abs(salvar.fatorCom - 2 ** 0.75) < 1e-9);
  assert.deepEqual([salvar.semComparacaoEtapa, salvar.efeitoEtapa, salvar.evidenciaEtapa, salvar.nEtapa], [true, null, 'insuficiente', 5]);
  assert.deepEqual(gerarInsights(e1, tudoIgual, DIMS), [], 'todas com a mesma CTA: é tendência da conta, não efeito da CTA');

  const qual = (score) => [{ etapa: 'qualidade', valor: 10, score, unidade: 'pormil' }];
  const misto = [
    ...[[0.1, 0.9], [0.2, 1], [0, 1.1], [0.1, 0.8]].map(([s, q], i) => linha(820 + i, { score: s, tags: { humor: { valor: true, fonte: 'ia' } }, funil: qual(q) })),
    ...[[1.2, 0], [1.3, 0.1], [1.1, -0.1]].map(([s, q], i) => linha(830 + i, { score: s, tags: { humor: { valor: false, fonte: 'ia' } }, funil: qual(q) })),
  ];
  const conflito = gerarInsights(calcularEfeitos(misto, DIMS), misto, DIMS).find((i) => i.dimensao === 'humor');
  assert.equal(conflito.acao, 'testar');
  assert.equal(conflito.texto, 'Sinal misturado: com humor, a ação por pessoa alcançada ficou acima (1,9× a base, contra 1× sem humor), mas a métrica do tipo ficou abaixo (1,1× a base, contra 2,3× sem humor). São 4 reels contra 3, evidência moderada: vale testar de novo antes de virar regra.');

  const viral = [
    linha(900, { score: 3, tags: { ganchoForma: { valor: 'numero', fonte: 'ia' }, humor: { valor: true, fonte: 'ia' }, diaSemana: { valor: 'qua', fonte: 'calculado' } } }),
    ...[0, 0.1, -0.1].map((s, i) => linha(910 + i, { score: s, tags: { ganchoForma: { valor: 'pergunta', fonte: 'ia' }, humor: { valor: false, fonte: 'ia' }, diaSemana: { valor: 'ter', fonte: 'calculado' } } })),
  ];
  const sinais = gerarInsights(calcularEfeitos(viral, DIAS), viral, DIAS).filter((i) => i.evidencia === 'insuficiente');
  assert.deepEqual(sinais.map((i) => i.id), ['ins_ganchoForma_numero'], 'um sinal por post, de mecanismo que a IA etiqueta');
  assert.equal(sinais[0].texto, 'Uma peça com gancho com número ficou em 8× a base (1 peça, sem evidência ainda). Uma peça é sinal, não prova: vale testar de novo.');
});

// ---------- recomendações ----------

const ins = (id, acao, dimensao, valor, evidencia, efeito, curto) => ({
  id, acao, dimensao, valor, nomeValor: String(valor), curto, titulo: curto, texto: `Texto de ${curto}.`, evidencia, n: evidencia === 'forte' ? 6 : 3, efeito, pecas: ['reel'], etapa: 'objetivo',
});
const INSIGHTS = [
  ins('ins_cta_comentar', 'usar', 'cta', 'comentar', 'forte', 0.9, 'CTA de comentar'),
  ins('ins_cta_salvar', 'usar', 'cta', 'salvar', 'fraca', 0.3, 'CTA de salvar'),
  ins('ins_preco_true', 'usar', 'preco', true, 'moderada', 0.5, 'preço na peça'),
  ins('ins_humor_true', 'usar', 'humor', true, 'moderada', 0.4, 'humor'),
  ins('ins_ganchoForma_pergunta', 'usar', 'ganchoForma', 'pergunta', 'forte', 0.8, 'gancho de pergunta'),
  ins('ins_ganchoForma_afirmacao', 'evitar', 'ganchoForma', 'afirmacao', 'moderada', -0.7, 'gancho de afirmação'),
  ins('ins_rostoInicio_true', 'usar', 'rostoInicio', true, 'fraca', 0.25, 'rosto nos 3 primeiros segundos'),
  ins('ins_ganchoFamilia_fator-r', 'usar', 'ganchoFamilia', 'fator-r', 'forte', 1, 'gancho da família Fator R'),
  ins('ins_ganchoFamilia_perguntas', 'usar', 'ganchoFamilia', 'perguntas', 'forte', 1.1, 'gancho da família Perguntas'),
  { ...ins('ins_pilar_6', 'planejar', 'pilar', '6', 'forte', 1.2, 'pilar 6'), standby: true },
  ins('ins_humor_x', 'usar', 'humor', true, 'insuficiente', 2, 'humor'),
];
const contexto = (extra = {}) => ({
  posts: [], insights: INSIGHTS, hipoteses: [], dimensoes: DIMS, ctaPorTipo: CTA_POR_TIPO, familiasPorTipo: FAMILIAS, rotulosTipo: ROTULOS, agora: AGORA, ...extra,
});

test('recomendações: escada de CTA, preço só em Vendas, humor com aviso, família do tipo, uma por dimensão, até 3', () => {
  const ensino = recomendacoesPara({ id: 'reel_ens01', tipo: 'ensino', peca: 'reel' }, contexto());
  assert.deepEqual(ensino.itens.map((i) => i.insightId), ['ins_ganchoForma_pergunta', 'ins_humor_true', 'ins_cta_salvar']);
  assert.equal(ensino.itens.find((i) => i.dimensao === 'humor').aviso, AVISO_HUMOR);
  assert.equal(ensino.testar, null);
  assert.ok(!ensino.itens.some((i) => i.dimensao === 'preco'), 'preço só em Vendas');
  assert.ok(!ensino.itens.some((i) => i.valor === 'comentar'), 'comentar não é da escada de Ensino');

  const vendas = recomendacoesPara({ id: 'reel_ven01', tipo: 'vendas', peca: 'reel' }, contexto());
  assert.deepEqual(vendas.itens.map((i) => i.insightId), ['ins_ganchoForma_pergunta', 'ins_preco_true', 'ins_humor_true']);

  const conexao = recomendacoesPara({ id: 'reel_con01', tipo: 'conexao', peca: 'reel' }, contexto({ familiasPorTipo: { conexao: ['perguntas'] } }));
  assert.deepEqual(conexao.itens.map((i) => i.insightId), ['ins_ganchoFamilia_perguntas', 'ins_cta_comentar', 'ins_ganchoForma_pergunta']);
  for (const r of [ensino, vendas, conexao]) {
    assert.ok(r.itens.length <= 3);
    assert.ok(!r.itens.some((i) => i.dimensao === 'pilar' || i.valor === 'fator-r'), 'nada de pilar em standby nem de Fator R');
  }
  const carrossel = recomendacoesPara({ id: 'reel_car01', tipo: 'ensino', peca: 'carrossel' }, contexto());
  assert.equal(carrossel.itens.length, 0, 'os insights são de reel');

  const hip = { id: 'hip_1234abcd', reelId: 'reel_ens01', insightId: 'ins_ganchoForma_pergunta', status: 'aberta' };
  const comHip = recomendacoesPara({ id: 'reel_ens01', tipo: 'ensino', peca: 'reel' }, contexto({ hipoteses: [hip] }));
  assert.equal(comHip.itens[0].aplicado, 'hip_1234abcd');
  assert.deepEqual(comHip.aplicados, [hip]);
});

test('recomendações: sem nenhuma, testa a família de gancho menos usada do tipo e traz a meta', () => {
  const ms = [2, 3, 1].map((saved, i) => midia(30 - i * 5, { saved }));
  const tags = { [ms[0].midiaId]: { ganchoFamilia: { valor: 'educativo-rapido', fonte: 'ia' } }, [ms[1].midiaId]: { ganchoFamilia: { valor: 'educativo-rapido', fonte: 'ia' } }, [ms[2].midiaId]: { ganchoFamilia: { valor: 'curiosidades', fonte: 'ia' } } };
  const posts = montar({ midias: ms, tipos: todosDoTipo(ms, 'ensino'), tags });
  const r = recomendacoesPara({ id: 'reel_novo1', tipo: 'ensino', peca: 'reel' }, contexto({ posts, insights: [] }));
  assert.equal(r.itens.length, 0);
  assert.equal(r.testar.valor, 'listas');
  assert.equal(r.testar.insightId, 'ins_ganchoFamilia_listas');
  assert.equal(r.testar.acao, 'usar');
  assert.ok(r.testar.texto.includes('nenhuma peça até agora'));
  assert.equal(r.meta.base, 2);
  assert.equal(r.meta.meta, 5);
  assert.equal(r.meta.texto, 'Meta desta peça (Ensino): salvamentos, 2× a mediana das últimas 3 de Ensino (mediana 2, meta 5).');
  assert.equal(r.resultado, null);
  assert.equal(r.semDados, null);
  const vazio = recomendacoesPara({ id: 'reel_novo2', tipo: 'ensino', peca: 'reel' }, contexto({ posts: [], insights: [] }));
  assert.equal(vazio.semDados, 'Ainda não há posts lidos do Instagram pra comparar.');
  const stories = recomendacoesPara({ id: 'reel_novo3', tipo: 'ensino', peca: 'stories' }, contexto({ posts }));
  assert.equal(stories.meta, null);
  semTraco([r, vazio, stories]);
});

test('igual à mediana não vai pro porquê; dia da semana não vira recomendação e hora não vai pra IA', () => {
  const ant = [1, 1, 1, 1, 1].map((saved, i) => midia(40 - i * 5, { saved }));
  const alvo = midia(10, { saved: 1 });
  const p = achar(montar({ midias: [...ant, alvo], tipos: todosDoTipo([...ant, alvo], 'ensino') }), alvo);
  assert.equal(p.objetivo.score, 0);
  assert.ok(!p.porque.bem.concat(p.porque.mal).some((f) => f.startsWith('Na métrica')));
  const DIAS = [...DIMS,
    { id: 'diaSemana', nome: 'Dia da semana', grupo: 'mecanismo', etapa: 'distribuicao', aplica: 'peca', pecas: TODAS, fontes: ['calculado'], valores: v('sex'), tipo: 'enum' },
    { id: 'horario', nome: 'Horário de postagem', grupo: 'mecanismo', etapa: 'distribuicao', aplica: 'peca', pecas: TODAS, fontes: ['calculado'], valores: v('tarde'), tipo: 'enum' }];
  const insights = [ins('ins_diaSemana_sex', 'evitar', 'diaSemana', 'sex', 'forte', -1, 'postagem na sexta'), ins('ins_horario_tarde', 'usar', 'horario', 'tarde', 'forte', 0.9, 'postagem à tarde')];
  const r = recomendacoesPara({ id: 'reel_dia01', tipo: 'ensino', peca: 'reel' }, contexto({ insights, dimensoes: DIAS }));
  assert.deepEqual(r.itens.map((i) => i.insightId), ['ins_horario_tarde']);
  assert.equal(blocoParaIa({ tipo: 'ensino', pecas: ['reel'] }, contexto({ insights, dimensoes: DIAS })), '');
});

// ---------- bloco das IAs de criação ----------

test('bloco da IA: vazio sem nada; com meta, fazer mais, evitar e hipótese aberta; até 1.200 caracteres', () => {
  assert.equal(blocoParaIa({ tipo: 'ensino', pecas: ['reel'], pilar: null }, contexto({ insights: [] })), '');
  const ant = [1, 2, 1, 0, 3].map((saved, i) => midia(40 - i * 5, { saved }));
  const posts = montar({ midias: ant, tipos: todosDoTipo(ant, 'ensino') });
  const hip = { id: 'hip_1234abcd', reelId: 'reel_ens01', insightId: 'ins_ganchoForma_pergunta', dimensao: 'ganchoForma', valor: 'pergunta', acao: 'usar', status: 'aberta' };
  const bloco = blocoParaIa({ tipo: 'ensino', pecas: ['reel'], pilar: 4, reelId: 'reel_ens01' }, contexto({ posts, hipoteses: [hip] }));
  const linhas = bloco.split('\n');
  assert.equal(linhas[0], '## O que os números da nossa conta mostram (Métricas, 30/09)');
  assert.ok(linhas[1].startsWith('Use como orientação de MECANISMO'));
  assert.ok(linhas.includes('- Meta desta peça (Ensino): salvamentos, 2× a mediana das últimas 5 de Ensino (mediana 1, meta 3).'));
  assert.ok(linhas.some((l) => l.startsWith('- Fazer mais: gancho de pergunta (6 reels, evidência forte)')));
  assert.ok(linhas.some((l) => l.includes('humor (3 reels, evidência moderada; só se o tema não for multa, dívida, prazo vencido, golpe ou teto)')));
  assert.ok(linhas.includes('- Evitar: gancho de afirmação (3 reels, evidência moderada).'));
  assert.ok(linhas.includes('- Em teste nesta peça: gancho de pergunta.'));
  assert.ok(!bloco.includes('Fator R') && !bloco.includes('CTA de comentar') && !bloco.includes('preço'));
  assert.ok(bloco.length <= 1200);
  semTraco(bloco);
  const soMeta = blocoParaIa({ tipo: 'ensino', pecas: ['reel'] }, contexto({ posts, insights: [] }));
  assert.equal(soMeta.split('\n').length, 3);
  assert.equal(blocoParaIa({ tipo: 'ensino', pecas: ['stories'] }, contexto({ posts })), '');
});

// ---------- hipóteses ----------

test('veredito da hipótese: confirmada, refutada, inconclusiva, não aplicada e ainda aberta', () => {
  const post = (id, { forma = 'pergunta', gancho = 0.7, score = 0.2, idadeH = 400, humor = false } = {}) => ({
    ...linha(id, { score, idadeH, tags: { ganchoForma: { valor: forma, fonte: 'ia' }, humor: { valor: humor, fonte: 'ia' } }, funil: [{ etapa: 'gancho', valor: 50, score: gancho, unidade: 'pct' }] }),
    reelId: `reel_h${id}`,
  });
  const hip = (id, extra = {}) => ({ id: `hip_${id}`, reelId: `reel_h${id}`, insightId: 'ins_ganchoForma_pergunta', dimensao: 'ganchoForma', valor: 'pergunta', acao: 'usar', previsao: { etapa: 'gancho' }, midiaId: null, status: 'aberta', ...extra });
  const posts = [post(1), post(2, { gancho: -0.7 }), post(3, { gancho: 0.1 }), post(4, { forma: 'afirmacao' }), post(5, { idadeH: 72 }), post(6, { score: 1.2 }), post(7, { humor: true })];
  const ctx = { posts, dimensoes: DIMS, rotulosTipo: ROTULOS, agora: AGORA };
  const r1 = avaliarHipotese(hip(1), ctx);
  assert.equal(r1.status, 'confirmada');
  assert.equal(r1.midiaId, '1');
  assert.equal(r1.veredito.scoreEtapa, 0.7);
  assert.equal(r1.veredito.score, 0.2);
  assert.equal(r1.veredito.em, AGORA);
  assert.equal(r1.veredito.texto, 'Confirmada nesta peça: fez a peça com gancho de pergunta, e o gancho ficou em 1,6× a base. Uma peça é sinal, não prova.');
  assert.equal(avaliarHipotese(hip(2), ctx).status, 'refutada');
  const r3 = avaliarHipotese(hip(3), ctx);
  assert.equal(r3.status, 'inconclusiva');
  assert.equal(r3.veredito.texto, 'Inconclusiva: fez a peça com gancho de pergunta, e o gancho ficou em 1× a base, perto do normal. Uma peça é sinal, não prova.');
  const r4 = avaliarHipotese(hip(4), ctx);
  assert.equal(r4.status, 'nao-aplicada');
  assert.equal(r4.veredito.texto, 'Não aplicada: a peça saiu com gancho de afirmação em vez de com gancho de pergunta. Uma peça é sinal, não prova.');
  assert.equal(avaliarHipotese(hip(5), ctx), null, 'menos de 7 dias: segue aberta');
  const humor = { dimensao: 'humor', valor: true, acao: 'evitar', insightId: 'ins_humor_true', previsao: { etapa: 'objetivo' } };
  assert.equal(avaliarHipotese(hip(6, humor), ctx).status, 'confirmada', 'evitou humor e o objetivo ficou 2,3× a base');
  assert.equal(avaliarHipotese(hip(7, humor), ctx).status, 'nao-aplicada');
  assert.equal(avaliarHipotese(hip(1, { status: 'confirmada' }), ctx), null, 'só as abertas');
  assert.equal(avaliarHipotese(hip(9), ctx), null, 'sem mídia vinculada');
  for (const i of [1, 2, 3, 4]) assert.ok(avaliarHipotese(hip(i), ctx).veredito.texto.endsWith('Uma peça é sinal, não prova.'));
  semTraco(posts.map((p) => avaliarHipotese(hip(Number(p.midiaId)), ctx)));
});

// ---------- números e público do post ----------

test('pendências e números da conta', () => {
  const a = midia(10);
  const b = midia(9);
  const posts = montar({ midias: [a, b], tipos: { [a.midiaId]: 'ensino' } });
  const n = numerosDaConta(posts, { agora: AGORA });
  assert.equal(n.posts, 2);
  assert.equal(n.semVinculo, 1);
  assert.equal(n.semTipo, 1);
  const pend = pendenciasDe(posts, { conectado: false, anunciosConectados: false, nSugestoes: 1 });
  assert.deepEqual(pend.map((x) => x.id), ['conectar', 'vincular', 'etiquetar', 'anuncios']);
  assert.ok(pend.find((x) => x.id === 'vincular').texto.includes('Tem 1 sugestão pronta'));
  assert.deepEqual(pendenciasDe(posts, { conectado: true, anunciosConectados: null }).map((x) => x.id), ['vincular', 'etiquetar'], 'sem o módulo de anúncios, não cobra conectar');
  semTraco([n, pend]);
});

// ---------- correções da revisão de 30/09 ----------

const aHoras = (horas) => new Date(Date.parse(AGORA) - horas * H).toISOString();
const carrosselDe = (dias, extra = {}) => midia(dias, { tipo: 'CAROUSEL_ALBUM', avgWatchMs: undefined, skipRate: undefined, ...extra });

test('metas: um cartão por tipo e formato, com a meta da próxima peça e a última medida na régua dela', () => {
  // o cenário do achado: 5 reels de Viralização com 1.000, 4 carrosséis com 50 e o reel mais novo com 900
  const reels = [60, 56, 52, 48, 44].map((d) => midia(d, { reach: 1000 }));
  const cars = [40, 36, 32, 28].map((d) => carrosselDe(d, { reach: 50 }));
  const novo = midia(10, { reach: 900 });
  const midias = [...reels, ...cars, novo];
  const posts = montar({ midias, tipos: todosDoTipo(midias, 'viralizacao') });
  const cartoes = metasPorTipo(posts, { rotulosTipo: ROTULOS, agora: AGORA });
  const viral = cartoes.filter((c) => c.tipo === 'viralizacao');
  assert.deepEqual(viral.map((c) => [c.formato, c.rotuloFormato]), [['reel', 'Reels'], ['feed', 'Posts e carrosséis']]);
  const [r, f] = viral;
  assert.deepEqual([r.base, r.meta, r.baseDe], [1000, 2000, 'tipo'], 'a próxima de reel: só reels');
  assert.equal(r.ultima.midiaId, novo.midiaId);
  assert.deepEqual([r.ultima.valor, r.ultima.base, r.ultima.meta, r.ultima.bateuMeta, r.ultima.provisorio], [900, 1000, 2000, false, false]);
  assert.deepEqual([f.base, f.meta], [50, 100], 'a próxima do feed: só carrosséis e estáticos');
  assert.equal(f.ultima.midiaId, cars[3].midiaId);
  assert.deepEqual([f.ultima.base, f.ultima.meta], [50, 100]);
  // a mesma meta do bloco da peça
  const rec = (peca) => recomendacoesPara({ id: 'reel_vir01', tipo: 'viralizacao', peca }, contexto({ posts, insights: [] })).meta.meta;
  assert.equal(rec('reel'), r.meta);
  assert.equal(rec('carrossel'), f.meta);
  // tipo sem nenhuma peça: um cartão só, sem formato, sem base e sem última
  const ensino = cartoes.filter((c) => c.tipo === 'ensino');
  assert.equal(ensino.length, 1);
  assert.deepEqual([ensino[0].formato, ensino[0].rotuloFormato, ensino[0].base, ensino[0].meta, ensino[0].ultima], [null, null, null, null, null]);
  semTraco(cartoes);
});

test('meta: o menor inteiro que dá 2×; bateu é valor >= meta; quem não bateu nunca aparece como 2×', () => {
  // alcance aos 7 dias com casa decimal (interpolado): base 523,7 e meta 1.048, não 1.047,4
  const cenario = (reach, historicoAlvo = null) => {
    const base = [500.4, 510.6, 523.7, 530.2, 540.9].map((r7, i) => ({ m: midia(60 - i * 5, { reach: Math.round(r7) + 50 }), r7 }));
    const alvo = midia(10, { reach });
    const historico = Object.fromEntries(base.map((x) => [x.m.midiaId, { leituras: [{ idadeH: 168, reach: x.r7 }] }]));
    if (historicoAlvo) historico[alvo.midiaId] = historicoAlvo;
    const midias = [...base.map((x) => x.m), alvo];
    return achar(montar({ midias, tipos: todosDoTipo(midias, 'viralizacao'), historico }), alvo);
  };
  const fraseMeta = (p) => p.porque.bem.concat(p.porque.mal).find((t) => t.startsWith('Na métrica'));
  const quase = cenario(1047);
  assert.deepEqual([quase.objetivo.base, quase.objetivo.meta, quase.objetivo.bateuMeta], [523.7, 1048, false]);
  assert.equal(fraseMeta(quase), 'Na métrica do tipo Viralização (alcance), fez 1.047, contra 524 na mediana dos últimos 5 reels de Viralização. Meta de 2×: 1.048. Ficou em 1,9×.');
  const bateu = cenario(1048);
  assert.equal(bateu.objetivo.bateuMeta, true);
  assert.ok(fraseMeta(bateu).endsWith('Meta de 2×: 1.048. Bateu.'));
  // valor interpolado 1.047,6: não aparece como 1.048 nem como 2×
  const meio = cenario(1100, { leituras: [{ idadeH: 160, reach: 1047 }, { idadeH: 176, reach: 1048.2 }] });
  assert.ok(Math.abs(meio.objetivo.valor - 1047.6) < 1e-9);
  assert.equal(meio.objetivo.bateuMeta, false);
  assert.equal(fraseMeta(meio), 'Na métrica do tipo Viralização (alcance), fez 1.047 aos 7 dias, contra 524 na mediana dos últimos 5 reels de Viralização. Meta de 2×: 1.048. Ficou em 1,9×.');
  semTraco([quase, bateu, meio]);
});

test('valor aos 7 dias só depois dos 7 dias: leitura de 5 dias e pouco segue provisória e fora da base', () => {
  const base = [40, 35, 30, 25, 20].map((d) => midia(d, { saved: 3 }));
  // 130 horas no ar, leituras até 128h: a folga da interpolação (42h) não vale antes dos 7 dias
  const alvo = midia(0, { saved: 6, timestamp: aHoras(130) });
  const depois = midia(0, { saved: 1, timestamp: aHoras(20) });
  const historico = { [alvo.midiaId]: { leituras: [{ idadeH: 24, saved: 2 }, { idadeH: 72, saved: 4 }, { idadeH: 128, saved: 6 }] } };
  const midias = [...base, alvo, depois];
  const posts = montar({ midias, tipos: todosDoTipo(midias, 'ensino'), historico });
  const p = achar(posts, alvo);
  assert.deepEqual([p.objetivo.idadeRef, p.objetivo.provisorio, p.objetivo.bateuMeta, p.objetivo.meta], ['atual', true, null, 7]);
  assert.ok(p.porque.bem.concat(p.porque.mal).every((t) => !t.includes('aos 7 dias')));
  assert.ok(!achar(posts, depois).objetivo.baseMidias.includes(alvo.midiaId), 'provisória não entra na base da seguinte');
  // leitura atual depois dos 7 dias: o histórico de antes e a atual interpolam os 7 dias
  const velho = midia(0, { saved: 10, timestamp: aHoras(200) });
  const q = achar(montar({ midias: [velho], tipos: todosDoTipo([velho], 'ensino'), historico: { [velho.midiaId]: { leituras: [{ idadeH: 128, saved: 6 }] } } }), velho);
  assert.equal(q.objetivo.idadeRef, '7d');
  assert.equal(q.objetivo.provisorio, false);
  assert.ok(Math.abs(q.objetivo.valor - (6 + (40 / 72) * 4)) < 1e-9);
});

test('distribuição de peça provisória compara na mesma idade; sem base nessa idade, fica sem nível', () => {
  const leituras = { leituras: [{ idadeH: 24, reach: 150 }, { idadeH: 48, reach: 200 }, { idadeH: 168, reach: 300 }] };
  const base = [40, 35, 30, 25, 20].map((d) => midia(d, { reach: 300 }));
  const alvo = midia(0, { reach: 195, timestamp: aHoras(26) });
  const midias = [...base, alvo];
  const historico = Object.fromEntries(base.map((m) => [m.midiaId, leituras]));
  const p = achar(montar({ midias, tipos: todosDoTipo(midias, 'viralizacao'), historico }), alvo);
  const dist = p.funil.find((x) => x.etapa === 'distribuicao');
  assert.equal(dist.mesmaIdade, true);
  assert.ok(Math.abs(dist.base - (150 + (2 / 24) * 50) / 100) < 1e-9, 'alcance das anteriores às 26h, por seguidor');
  assert.equal(dist.nivel, 'normal');
  assert.notEqual(p.gargalo, 'distribuicao');
  assert.ok(!p.porque.mal.some((t) => t.startsWith('Ficou perto de casa')));
  assert.ok(dist.detalhe.includes('a mediana é a das peças anteriores na mesma idade'));
  // sem histórico nas anteriores: nenhuma leitura na mesma idade, sem base e sem nível (antes: "abaixo" e gargalo)
  const base2 = [40, 35, 30, 25, 20].map((d) => midia(d, { reach: 300 }));
  const alvo2 = midia(0, { reach: 195, timestamp: aHoras(26) });
  const q = achar(montar({ midias: [...base2, alvo2], tipos: todosDoTipo([...base2, alvo2], 'viralizacao') }), alvo2);
  const d2 = q.funil.find((x) => x.etapa === 'distribuicao');
  assert.deepEqual([d2.base, d2.score, d2.nivel], [null, null, null]);
  assert.notEqual(q.gargalo, 'distribuicao');
  assert.ok(d2.detalhe.includes('a comparação espera os 7 dias'));
  semTraco([p, q]);
});

test('Vendas: números do app de antes dos 7 dias seguem provisórios, com aviso, e voltam pra pendência', () => {
  const reels = [50, 40, 30, 20].map((d) => midia(d));
  const cedo = (m) => ({ manual: { follows: 2, profileVisits: 8, bioLinkClicks: 1, em: new Date(Date.parse(m.timestamp) + 72 * H).toISOString(), autor: 'Pedro' } });
  const registros = Object.fromEntries(reels.map((m) => [m.midiaId, cedo(m)]));
  const novo = midia(3);
  const midias = [...reels, novo];
  const posts = montar({ midias, tipos: todosDoTipo(midias, 'vendas'), registros });
  const p = achar(posts, reels[3]);
  assert.deepEqual([p.objetivo.fonte, p.objetivo.provisorio, p.objetivo.idadeValorH], ['manual', true, 72]);
  assert.ok(p.avisos.includes('Números do app informados com 3 dias de post: informe de novo pra fechar a meta (o número só vale como definitivo a partir dos 7 dias).'));
  assert.ok(!p.avisos.some((a) => a.startsWith('Peça com menos de 7 dias')), 'a peça tem 20 dias');
  assert.ok(p.porque.bem.concat(p.porque.mal).every((t) => !t.includes('20 dias no ar')));
  const pend = pendenciasDe(posts).find((x) => x.id === 'numeros-app');
  assert.equal(pend.n, 4);
  assert.deepEqual([...pend.midiaIds].sort(), reels.map((m) => m.midiaId).sort());
  assert.equal(pend.texto, '4 reels de Vendas têm os números do app informados antes dos 7 dias: atualize os números do app pra fechar a meta.');
  // o reel de 3 dias sem números ainda não é cobrado: o aviso diz quando informar
  assert.ok(achar(posts, novo).avisos.includes('Sem dado ainda: informe os números do app (seguidores, visitas ao perfil e cliques no link) quando a peça fizer 7 dias.'));
  // informado de novo com 7 dias ou mais: fecha, e sai da pendência
  const registros2 = { ...registros, [reels[3].midiaId]: { manual: { follows: 2, profileVisits: 8, bioLinkClicks: 1, em: AGORA, autor: 'Pedro' } } };
  const posts2 = montar({ midias, tipos: todosDoTipo(midias, 'vendas'), registros: registros2 });
  assert.equal(achar(posts2, reels[3]).objetivo.provisorio, false);
  assert.equal(pendenciasDe(posts2).find((x) => x.id === 'numeros-app').n, 3);
  semTraco([p, pend]);
});

test('recomendações: gatilho só do guia do tipo; preço e escassez só em Vendas; humor sobre a burocracia com aviso', () => {
  const GATILHO = {
    id: 'gatilho', nome: 'Gatilho emocional', grupo: 'mecanismo', etapa: 'qualidade', aplica: 'peca', pecas: TODAS, fontes: ['manual', 'ia'], tipo: 'enum',
    valores: [
      { id: 'transparencia-preco', nome: 'Transparência de preço', tipo: 'vendas' }, { id: 'escassez-real', nome: 'Escassez real', tipo: 'vendas' },
      { id: 'humor-burocracia', nome: 'Humor sobre a burocracia', tipo: 'viralizacao' }, { id: 'validacao', nome: 'Validação sem pena', tipo: 'conexao' },
    ],
  };
  const dims = [...DIMS, GATILHO];
  const g = (valor, efeito) => ins(`ins_gatilho_${valor}`, 'usar', 'gatilho', valor, 'forte', efeito, `gatilho ${valor}`);
  const insights = [g('transparencia-preco', 1.2), g('escassez-real', 1.1), g('humor-burocracia', 1), g('validacao', 0.9)];
  const itens = (tipo) => recomendacoesPara({ id: 'reel_gat01', tipo, peca: 'reel' }, contexto({ insights, dimensoes: dims })).itens;
  assert.deepEqual(itens('ensino'), [], 'gatilho de Vendas não vai pra peça de Ensino');
  assert.deepEqual(itens('conexao').map((i) => i.insightId), ['ins_gatilho_validacao']);
  assert.deepEqual(itens('vendas').map((i) => i.insightId), ['ins_gatilho_transparencia-preco']);
  const viral = itens('viralizacao');
  assert.deepEqual(viral.map((i) => i.insightId), ['ins_gatilho_humor-burocracia']);
  assert.equal(viral[0].aviso, AVISO_HUMOR);
  assert.deepEqual(itens(null), [], 'peça sem tipo não recebe gatilho');
  assert.equal(blocoParaIa({ tipo: 'ensino', pecas: ['reel'] }, contexto({ insights, dimensoes: dims, posts: [] })), '');
  const blocoViral = blocoParaIa({ tipo: 'viralizacao', pecas: ['reel'] }, contexto({ insights, dimensoes: dims, posts: [] }));
  assert.ok(blocoViral.includes('gatilho humor-burocracia (6 reels, evidência forte; só se o tema não for multa, dívida, prazo vencido, golpe ou teto)'));
  assert.ok(!blocoViral.includes('transparencia') && !blocoViral.includes('escassez'));
});

test('evidência limitada pelo lado menor: 5 peças contra 1 não é forte, e o texto diz os dois N', () => {
  const VOZ = { id: 'voz', nome: 'Quem fala', grupo: 'mecanismo', etapa: 'qualidade', aplica: 'peca', pecas: ['reel'], fontes: ['manual', 'ia'], valores: v('leo', 'pedro', 'sem-voz'), tipo: 'enum' };
  const dims = [...DIMS, VOZ];
  const voz = (id, valor, score) => linha(id, { score, tags: { voz: { valor, fonte: 'ia' } } });
  const posts = [...[0.3, 0.4, 0.5, 0.35, 0.45].map((s, i) => voz(1000 + i, 'leo', s)), voz(1010, 'pedro', -0.6)];
  const efeitos = calcularEfeitos(posts, dims);
  const leo = efeitos.find((e) => e.dimensao === 'voz' && e.valor === 'leo');
  assert.deepEqual([leo.n, leo.nSem, leo.evidencia], [5, 1, 'insuficiente'], 'a média do outro lado é uma peça só');
  assert.ok(!gerarInsights(efeitos, posts, dims).some((i) => i.id === 'ins_voz_leo'));
  const mais = [...posts, voz(1011, 'pedro', -0.5), voz(1012, 'pedro', -0.4)];
  const i = gerarInsights(calcularEfeitos(mais, dims), mais, dims).find((x) => x.id === 'ins_voz_leo');
  assert.deepEqual([i.evidencia, i.n, i.nSem], ['moderada', 5, 3], 'com 3 do outro lado, no máximo moderada');
  assert.equal(i.texto, 'Peças com o Léo falando ficaram em 1,3× a base, contra 0,7× das outras (5 reels contra 3, evidência moderada).');
});

test('valor médio da etapa só com as peças todas na mesma unidade (retenção em % e em segundos não se misturam)', () => {
  const AUDIO = { id: 'audio', nome: 'Áudio', grupo: 'mecanismo', etapa: 'retencao', aplica: 'peca', pecas: ['reel'], fontes: ['manual', 'ia', 'calculado'], valores: v('fala', 'musica', 'sem-audio'), tipo: 'enum' };
  const dims = [...DIMS, AUDIO];
  const ret = (id, valor, retencao, unidade, s) => linha(id, { score: 0.1, tags: { audio: { valor, fonte: 'ia' } }, funil: [{ etapa: 'retencao', valor: retencao, score: s, unidade }] });
  const posts = [
    ret(1100, 'fala', 60, 'pct', 0.9),
    ...[0.8, 0.7, 0.9, 1].map((s, i) => ret(1101 + i, 'fala', 12, 's', s)),
    ...[-0.1, 0, -0.2].map((s, i) => ret(1110 + i, 'musica', 25, 'pct', s)),
  ];
  const efeitos = calcularEfeitos(posts, dims);
  const fala = efeitos.find((e) => e.dimensao === 'audio' && e.valor === 'fala');
  assert.deepEqual([fala.mediaEtapaCom, fala.mediaEtapaSem, fala.unidadeEtapa], [null, null, null], 'o 60% seria de 1 reel só');
  const i = gerarInsights(efeitos, posts, dims).find((x) => x.id === 'ins_audio_fala');
  assert.equal(i.texto, 'Com áudio só de fala, a retenção ficou em 1,8× a base (5 reels contra 3, evidência moderada).');
  // todas em %: o valor médio volta pro texto
  const emPct = posts.map((p) => ({ ...p, funil: p.funil.map((x) => ({ ...x, unidade: 'pct', valor: x.valor === 12 ? 40 : x.valor })) }));
  const i2 = gerarInsights(calcularEfeitos(emPct, dims), emPct, dims).find((x) => x.id === 'ins_audio_fala');
  assert.equal(i2.texto, 'Com áudio só de fala, assistiram em média 44% do vídeo, contra 25% nas outras (5 reels contra 3, evidência moderada).');
});

test('hipótese: "sem" sem "com sem" nos textos; sem número ou base, segue aberta até 30 dias e diz o que faltou', () => {
  const VOZ = { id: 'voz', nome: 'Quem fala', grupo: 'mecanismo', etapa: 'qualidade', aplica: 'peca', pecas: ['reel'], fontes: ['manual', 'ia'], valores: v('leo', 'pedro', 'sem-voz'), tipo: 'enum' };
  const dims = [...DIMS, VOZ];
  const post = (id, tags, extra = {}) => ({ ...linha(id, { score: 0.2, tags }), reelId: `reel_s${id}`, ...extra });
  const h = (id, dimensao, valor, acao = 'usar', etapa = 'objetivo') => ({ id: `hip_s${id}`, reelId: `reel_s${id}`, insightId: `ins_${dimensao}_${valor}`, dimensao, valor, acao, previsao: { etapa }, midiaId: null, status: 'aberta' });
  const cta = { cta: { valor: 'lista-de-espera', fonte: 'ia' } };
  const vendas = (id, idadeH, objetivo) => post(id, cta, { idadeH, tipo: 'vendas', tipoMidia: 'REELS', objetivo });
  const posts = [
    post(1, { rostoInicio: { valor: false, fonte: 'ia' } }), post(2, { voz: { valor: 'sem-voz', fonte: 'ia' } }), post(3, { cta: { valor: 'sem-cta', fonte: 'ia' } }),
    vendas(4, 8 * 24, { score: null, valor: null, base: 11, provisorio: false }),
    vendas(5, 31 * 24, { score: null, valor: null, base: 11, provisorio: false }),
    vendas(6, 31 * 24, { score: null, valor: 20, base: null, provisorio: false }),
    vendas(7, 31 * 24, { score: 0.5, valor: 20, base: 11, provisorio: true, fonte: 'manual' }),
    vendas(8, 20 * 24, { score: 0.5, valor: 20, base: 11, provisorio: true, fonte: 'manual' }),
  ];
  const ctx = { posts, dimensoes: dims, rotulosTipo: ROTULOS, agora: AGORA };
  const texto = (hip) => avaliarHipotese(hip, ctx)?.veredito.texto ?? null;
  assert.equal(texto(h(1, 'rostoInicio', true)), 'Não aplicada: a peça saiu sem rosto em vez de com rosto nos 3 primeiros segundos. Uma peça é sinal, não prova.');
  assert.equal(texto(h(2, 'voz', 'leo')), 'Não aplicada: a peça saiu sem voz em vez de com o Léo falando. Uma peça é sinal, não prova.');
  assert.equal(texto(h(3, 'cta', 'sem-cta', 'evitar')), 'Não aplicada: a peça saiu sem CTA mesmo assim. Uma peça é sinal, não prova.');
  assert.equal(texto(h(2, 'voz', 'sem-voz')), 'Inconclusiva: fez a peça sem voz, e a métrica do tipo (salvamentos) ficou em 1,1× a base, perto do normal. Uma peça é sinal, não prova.');
  // Vendas sem os números do app: com 8 dias segue aberta (informar depois ainda conta); com 31, fecha dizendo o que faltou
  const lista = (id) => h(id, 'cta', 'lista-de-espera', 'usar', 'conversao');
  assert.equal(avaliarHipotese(lista(4), ctx), null);
  assert.equal(texto(lista(5)), 'Inconclusiva: fez a peça com CTA da lista de espera, mas faltou o número da peça pra comparar (os números do app não foram informados). Uma peça é sinal, não prova.');
  assert.equal(texto(lista(6)), 'Inconclusiva: fez a peça com CTA da lista de espera, mas não havia base pra comparar (menos de 3 peças anteriores com o número). Uma peça é sinal, não prova.');
  assert.equal(texto(lista(7)), 'Inconclusiva: fez a peça com CTA da lista de espera, mas o número da peça ficou provisório (os números do app foram informados antes dos 7 dias). Uma peça é sinal, não prova.');
  assert.equal(avaliarHipotese(lista(8), ctx), null, 'provisória antes do prazo segue aberta');
  // a recomendação leva o prep pro texto da hipótese ("Fazer a peça sem voz.", nunca "Usar sem voz.")
  const rec = recomendacoesPara({ id: 'reel_s9', tipo: 'ensino', peca: 'reel' }, contexto({ insights: [ins('ins_voz_sem-voz', 'usar', 'voz', 'sem-voz', 'forte', 0.9, 'sem voz')], dimensoes: dims }));
  assert.equal(rec.itens[0].prep, 'sem voz');
  const evitar = { id: 'hip_s10', reelId: 'reel_s10', insightId: 'ins_cta_sem-cta', dimensao: 'cta', valor: 'sem-cta', acao: 'evitar', status: 'aberta' };
  const bloco = blocoParaIa({ tipo: 'ensino', pecas: ['reel'], reelId: 'reel_s10' }, contexto({ insights: [], hipoteses: [evitar], dimensoes: dims }));
  assert.ok(bloco.includes('- Em teste nesta peça: evitar fazer a peça sem CTA.'));
  semTraco(posts.map((p) => avaliarHipotese(lista(Number(p.midiaId)), ctx)));
});

test('números da conta: provisória fora da taxa de acerto e da mediana, contada à parte e dita em palavras', () => {
  const ant = [40, 35, 30, 25, 20].map((d) => midia(d, { saved: 1 }));
  const jaBateu = midia(2, { saved: 10 });
  const midias = [...ant, jaBateu];
  const posts = montar({ midias, tipos: todosDoTipo(midias, 'ensino') });
  assert.equal(achar(posts, jaBateu).objetivo.bateuMeta, true, '"já bateu" com 2 dias');
  const n = numerosDaConta(posts, { agora: AGORA });
  assert.deepEqual([n.avaliadas30d, n.bateramMeta30d, n.taxaAcerto30d], [2, 0, 0], 'o "já bateu" de 2 dias não é acerto fechado');
  assert.equal(n.medianaScore30d, 0);
  assert.equal(n.provisorias30d, 1);
  assert.equal(n.fraseProvisorias, '1 peça ainda tem menos de 7 dias: fica fora da taxa de acerto e da mediana até o número fechar.');
  assert.equal(numerosDaConta(montar({ midias: ant, tipos: todosDoTipo(ant, 'ensino') }), { agora: AGORA }).fraseProvisorias, null);
  semTraco(n);
});

test('anúncio do post: "sem anúncio" só com leitura boa e recente; lista de anúncios conta como anúncio', () => {
  const pub = antes(10);
  const boa = { conta: { id: 'act_1' }, lidoEm: antes(0, 2), erro: null, anuncios: [{ adId: '1', midiaId: '555' }], porPost: { 777: { em: AGORA } } };
  const op = { agora: AGORA, tokenUsuario: true };
  assert.equal(anuncioDoPost('777', pub, boa, op), true);
  assert.equal(anuncioDoPost('555', pub, boa, op), true, 'anúncio listado, mesmo sem os números lidos');
  assert.equal(anuncioDoPost('999', pub, boa, op), false);
  assert.equal(anuncioDoPost('999', pub, { ...boa, lidoEm: antes(2) }, op), undefined, 'leitura de 2 dias atrás');
  assert.equal(anuncioDoPost('999', pub, boa, { ...op, tokenUsuario: false }), undefined, 'token de usuário revogado');
  assert.equal(anuncioDoPost('999', pub, boa, { ...op, tokenUsuario: null }), undefined, 'token que não dá pra conferir');
  assert.equal(anuncioDoPost('999', pub, { ...boa, erro: 'A Meta não devolveu' }, op), undefined);
  assert.equal(anuncioDoPost('999', antes(0, 1), boa, op), undefined, 'post publicado depois da leitura');
  assert.equal(anuncioDoPost('999', pub, { ...boa, conta: null }, op), undefined);
  assert.equal(anuncioDoPost('999', pub, null, op), undefined);
  // no motor: sem certeza, o post com views totais bem acima das orgânicas ganha o aviso; o listado é anúncio
  const suspeito = midia(10, { views: 3200, totalViews: 14000 });
  const listado = midia(9);
  const posts = montar({ midias: [suspeito, listado], anuncios: { ...boa, lidoEm: antes(20), anuncios: [{ adId: '2', midiaId: listado.midiaId }], porPost: {} } });
  assert.deepEqual([achar(posts, suspeito).impulsionado, achar(posts, suspeito).talvezImpulsionado], [null, true]);
  assert.equal(achar(posts, listado).impulsionado, true);
});

test('público do post pelo app: a base em pessoas nunca é views, e só grupo de 5 pessoas ou mais aparece', () => {
  const met = { views: 400, reach: 120, likes: 12, saved: 3, comments: 15, shares: 2 };
  assert.deepEqual(pessoasNaBaseApp({ base: 'visualizacoes' }, met), { n: 120, nDe: 'alcance' });
  assert.deepEqual(pessoasNaBaseApp({ base: 'contas-alcancadas' }, met), { n: 120, nDe: 'alcance' });
  // comentários (15) não contam: a mesma conta comenta várias vezes e as nossas respostas entram no número
  assert.deepEqual(pessoasNaBaseApp({ base: 'contas-engajadas' }, met), { n: 12, nDe: 'interacoes' });
  assert.deepEqual(pessoasNaBaseApp({ base: 'contas-engajadas', contas: 40 }, met), { n: 40, nDe: 'informado' }, 'o número da tela manda');
  assert.deepEqual(pessoasNaBaseApp({ base: 'contas-engajadas' }, {}), { n: null, nDe: null });
  assert.deepEqual(pessoasNaBaseApp({ base: 'visualizacoes' }, { views: 400 }), { n: null, nDe: null }, 'views não viram pessoas');
  const app = {
    base: 'contas-engajadas', genero: { mulheres: 91, homens: 9 }, idade: { '18-24': 8, '25-34': 60, '35-44': 32 },
    cidades: [{ nome: 'Belo Horizonte, Minas Gerais', pct: 92 }, { nome: 'Contagem', pct: 4 }], paises: [], seguidores: 92, naoSeguidores: 8,
  };
  const v12 = visiveisDoApp(app, 12);
  assert.deepEqual(v12.genero, [{ id: 'F', rotulo: 'Mulheres', pct: 91 }], '9% de 12 é 1 pessoa');
  assert.deepEqual(v12.idade, [{ faixa: '25-34', pct: 60 }]);
  assert.deepEqual(v12.cidades, [{ nome: 'Belo Horizonte, Minas Gerais', pct: 92 }]);
  assert.deepEqual(v12.paises, []);
  assert.deepEqual(v12.seguidores, { seguidores: 92, naoSeguidores: null });
  assert.deepEqual(visiveisDoApp(app, null), { genero: [], idade: [], cidades: [], paises: [], seguidores: null }, 'sem n, nenhum grupo');
  assert.equal(visiveisDoApp(app, 1000).genero.length, 2);
});
