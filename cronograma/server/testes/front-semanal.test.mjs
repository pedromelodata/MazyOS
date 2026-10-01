// Fumaça do front de Métricas (aba Semanal e bloco "Métricas desta peça"), rodando no Node sem navegador.
// core.js mexe no document ao carregar: os globais mínimos entram antes do import (por isso import
// dinâmico). Só as funções puras de HTML e texto são exercitadas, com dados no formato do SPEC-METRICAS.md
// (§3.8 Relatorio e §3.11 recomendacoesPara). Rodar: node --test "server/testes/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';

const nada = () => {};
const elementoFalso = () => ({
  style: {}, dataset: {}, hidden: true, setAttribute: nada, getAttribute: () => null, removeAttribute: nada,
  append: nada, appendChild: nada, remove: nada, addEventListener: nada, removeEventListener: nada,
  querySelector: () => null, querySelectorAll: () => [], classList: { add: nada, remove: nada, toggle: nada, contains: () => false },
});
globalThis.window = globalThis;
globalThis.document = {
  documentElement: { dataset: { theme: 'dark' } },
  body: elementoFalso(),
  activeElement: null,
  visibilityState: 'visible',
  addEventListener: nada,
  removeEventListener: nada,
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  createElement: elementoFalso,
};
globalThis.location = { hash: '#/instagram/metricas/semanal', pathname: '/', search: '', href: 'http://localhost/' };
globalThis.addEventListener = nada;
globalThis.removeEventListener = nada;
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, setItem: nada, removeItem: nada }, configurable: true, writable: true });

const semanal = await import('../../public/js/views/semanal.js');
const dm = await import('../../public/js/detalhe-metricas.js');

const TRACO = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const EM = String.fromCharCode(0x2014);
const SEM_DADO = 'sem dado';

// saída limpa: sem travessão nem meia-risca, sem valor de JS vazando pra tela; no HTML, sem script cru.
// O texto do "Copiar resumo" vai pra área de transferência, não pro HTML: lá o título sai como veio
function limpo(s, onde, { html = true } = {}) {
  assert.equal(typeof s, 'string', `${onde}: não é texto`);
  assert.ok(!TRACO.test(s), `${onde}: tem travessão ou meia-risca`);
  assert.ok(!/undefined|NaN|\bnull\b|\[object Object\]/.test(s), `${onde}: vazou valor de JS`);
  if (!html) return;
  assert.ok(!/<script/i.test(s), `${onde}: script sem escapar`);
  assert.ok(!/javascript:/i.test(s), `${onde}: url javascript:`);
}

// ── dados no formato do SPEC ─────────────────────────────────────────────
const hipotese = (extra = {}) => ({
  id: 'hip_1a2b3c4d', criadaEm: '2026-09-15T13:00:00.000Z', autor: 'pedro', reelId: 'reel_9beb8a8e',
  insightId: 'ins_ganchoForma_pergunta', dimensao: 'ganchoForma', valor: 'pergunta', acao: 'usar',
  texto: 'Usar gancho de pergunta nesta peça.', previsao: { etapa: 'gancho' }, midiaId: '17900000000000001',
  status: 'confirmada',
  veredito: { em: '2026-09-29T10:00:00.000Z', score: 0.8, scoreEtapa: 0.7, texto: 'O gancho segurou 1,6× a base. Uma peça é sinal, não prova.' },
  ...extra,
});

const relatorio = () => ({
  versao: 1, semana: '2026-W39', inicio: '2026-09-21', fim: '2026-09-27', geradoEm: '2026-09-28T10:02:00.000Z', geradoPor: 'agenda',
  resumo: {
    publicadas: { reel: 2, carrossel: 1, estatico: 0, total: 3 },
    metasBatidas: { n: 1, de: 2 }, medianaScore: 0.4, taxaAcerto: 0.5,
    anterior: { metasBatidas: { n: 0, de: 1 }, medianaScore: -0.3 },
    frases: ['1 de 2 peças com base bateu a meta de 2×.', `A mediana subiu ${EM} de 0,8× pra 1,3× a base.`],
  },
  pecas: [
    {
      midiaId: '17900000000000001', titulo: 'MEI pode ter funcionário? <script>alert(1)</script>', dia: '2026-09-22', tipo: 'ensino', peca: 'reel', pilarNome: '3 · Obrigações do MEI',
      objetivo: { id: 'salvamentos', rotulo: 'Salvamentos', valor: 7, fonte: 'api', idadeRef: 'atual', provisorio: false, base: 3, baseN: 5, baseDe: 'tipo', meta: 7, razao: 2.33, score: 1.2, bateuMeta: true, ritmo: null },
      bateuMeta: true,
      porque: {
        bem: ['O gancho segurou mais gente: 54% passaram dos 3 primeiros segundos, contra 40% na mediana dos últimos reels.'],
        mal: [`Quem ficou assistiu em média 18% do vídeo (7,1s de 38s) ${EM} abaixo da mediana (26%).`],
      },
      gargalo: 'retencao', forte: 'gancho', thumb: 'https://scontent.cdninstagram.com/v/t51/foto.jpg', permalink: 'https://www.instagram.com/reel/ABC123/',
    },
    {
      midiaId: '17900000000000002', titulo: 'Quanto custa abrir MEI', dia: '2026-09-24', tipo: 'vendas', peca: 'carrossel', pilarNome: '5 · Preço',
      objetivo: { id: 'interesse', rotulo: 'Seguidores, visitas ao perfil e cliques no link', valor: null, fonte: null, idadeRef: null, provisorio: true, base: 2.5, baseN: 3, baseDe: 'formato', meta: 6, razao: null, score: null, bateuMeta: null, ritmo: null },
      bateuMeta: null, porque: { bem: [], mal: [] }, gargalo: null, forte: null, thumb: 'javascript:alert(1)', permalink: '',
    },
    {
      midiaId: '17900000000000003', titulo: '', dia: '2026-09-26', tipo: 'viralizacao', peca: 'reel', pilarNome: '',
      objetivo: { id: 'alcance', rotulo: 'Alcance', valor: 250, fonte: 'api', idadeRef: 'atual', provisorio: false, base: 500, baseN: 5, baseDe: 'tipo', meta: 1000, razao: 0.5, score: -1, bateuMeta: false, ritmo: null },
      bateuMeta: false, porque: { bem: [], mal: ['Chegou em pouca gente: alcance de 250 contas, 2,3× o número de seguidores (a mediana é 3×).'] },
      gargalo: 'distribuicao', forte: null, thumb: null, permalink: 'https://www.instagram.com/reel/XYZ/',
    },
  ],
  destaques: { melhor: '17900000000000001', pior: '17900000000000003' },
  mecanismos: {
    insights: [
      { id: 'ins_ganchoForma_pergunta', acao: 'usar', titulo: 'Gancho de pergunta', texto: 'Peças com gancho de pergunta ficaram em 1,6× a base, contra 0,8× das outras (4 peças, evidência moderada).', evidencia: 'moderada' },
      { id: 'ins_duracaoFaixa_mais-60', acao: 'evitar', titulo: 'Reel com mais de 60s', texto: 'Reels com mais de 60s tendem a ficar em 0,6× a base (3 reels).', evidencia: 'fraca' },
      { id: 'ins_pilar_3', acao: 'planejar', titulo: 'Pilar 3', texto: 'O pilar 3 tende a render mais salvamentos (5 peças).', evidencia: 'forte' },
    ],
    hipoteses: {
      confirmadas: [hipotese({ reelTitulo: 'MEI pode ter funcionário?' })],
      refutadas: [],
      inconclusivas: [hipotese({ id: 'hip_5e6f7a8b', status: 'inconclusiva', texto: 'Evitar reel com mais de 60s.', veredito: { em: '2026-09-29T10:00:00.000Z', score: 0.1, scoreEtapa: null, texto: 'Ficou perto da base: inconclusivo. Uma peça é sinal, não prova.' } })],
      abertas: 2,
    },
  },
  publico: { seguidores: { inicio: 109, fim: 115, variacao: 6 }, pctNaoSeguidores: null, frases: ['Dos 109 seguidores com dado (30 dias): 64% são mulheres e 35% homens.'] },
  stories: { dias: 4, views: 312, saidas: 21, respostas: null, cliques: 2, frase: 'Stories em 4 dias: 312 views e 2 cliques no link.' },
  proximaSemana: [
    { reelId: 'reel_9beb8a8e', dia: '2026-09-29', titulo: 'Abrir MEI custa quanto?', tipo: 'vendas', peca: 'reel', pilarNome: '5 · Preço', meta: { rotulo: 'Seguidores, visitas ao perfil e cliques no link', base: 2, meta: 5 }, recomendacoes: ['Use gancho de pergunta (4 peças, evidência moderada).'] },
    { reelId: 'reel_b464585e', dia: '2026-10-01', titulo: 'Carrossel do DAS', tipo: 'ensino', peca: 'carrossel', pilarNome: '3 · Obrigações do MEI', meta: null, recomendacoes: [] },
  ],
  fatos: [{ id: 'F1', texto: '3 peças publicadas: 2 reels e 1 carrossel.' }, { id: 'F2', texto: 'Mediana contra a base: 1,3×.' }],
  leituraIa: {
    em: '2026-09-28T11:00:00.000Z', autor: 'pedro', status: 'ok', descartadas: 1,
    frases: [{ texto: 'A semana teve 3 peças e 1 bateu a meta.', fatos: ['F1'] }, { texto: 'A mediana ficou em 1,3× a base.', fatos: ['F1', 'F2'] }],
  },
});

const postRow = () => ({
  midiaId: '17900000000000001', permalink: 'https://www.instagram.com/reel/ABC123/', thumb: 'https://scontent.cdninstagram.com/v/t51/foto.jpg',
  legenda1: 'MEI pode ter funcionário?', timestamp: '2026-09-22T15:00:00+0000', dia: '2026-09-22', hora: 12, idadeH: 200,
  tipoMidia: 'REELS', peca: 'reel', reelId: 'reel_9beb8a8e', reelTitulo: 'MEI pode ter funcionário?', tipo: 'ensino', pilar: 3, pilarNome: '3 · Obrigações do MEI', bloco: 'Educação',
  metricas: {
    views: 1200, reach: 1005, saved: 7, shares: 5, likes: 40, comments: 3, interacoes: 55, avgWatchMs: 7100, skipRate: 46,
    retido3s: 54, duracaoS: 38, pctAssistido: 18.7, replays: null, follows: null, profileVisits: null, bioLinkClicks: null, cadastros: null,
    totalViews: null, seguidoresNoDia: 109, alcancePorSeguidor: 9.2,
  },
  objetivo: { id: 'salvamentos', rotulo: 'Salvamentos', valor: 7, fonte: 'api', idadeRef: 'atual', provisorio: false, base: 3, baseN: 5, baseDe: 'tipo', meta: 7, razao: 2.33, score: 1.2, bateuMeta: true, ritmo: null },
  funil: [
    { etapa: 'gancho', rotulo: 'Gancho (0 a 3s)', valor: 54, valorTexto: '54%', base: 40, baseTexto: '40%', score: 0.43, nivel: 'acima', detalhe: '' },
    { etapa: 'retencao', rotulo: 'Retenção', valor: 18.7, valorTexto: '18,7%', base: 26, baseTexto: '26%', score: -0.48, nivel: 'abaixo', detalhe: '' },
  ],
  gargalo: 'retencao', forte: 'gancho',
  porque: { bem: ['O gancho segurou mais gente.'], mal: ['A retenção ficou abaixo da mediana.'] },
  tags: {}, tagsFaltando: [], impulsionado: false, talvezImpulsionado: false, outlier: false, iaStatus: null, avisos: [],
});

const recsPlanejar = () => ({
  reelId: 'reel_9beb8a8e', tipo: 'ensino', peca: 'reel',
  meta: { objetivo: { id: 'salvamentos', rotulo: 'Salvamentos' }, base: 1, baseN: 5, baseDe: 'tipo', meta: 3, texto: 'Meta desta peça (Ensino): salvamentos, 2× a mediana das últimas 5 de Ensino (mediana 1, meta 3).' },
  itens: [
    { insightId: 'ins_ganchoForma_pergunta', acao: 'usar', dimensao: 'ganchoForma', valor: 'pergunta', nomeValor: 'Pergunta', titulo: 'Gancho de pergunta', texto: 'Peças com gancho de pergunta ficaram em 1,6× a base, contra 0,8× das outras (4 peças, evidência moderada).', evidencia: 'moderada', n: 4, aviso: null, aplicado: null },
    { insightId: 'ins_humor_sim', acao: 'usar', dimensao: 'humor', valor: true, nomeValor: 'Com humor', titulo: 'Humor', texto: 'Peças com humor ficaram em 1,4× a base (3 peças, evidência fraca).', evidencia: 'fraca', n: 3, aviso: 'humor só se o tema não for multa, dívida, prazo vencido, golpe ou teto', aplicado: 'hip_1a2b3c4d' },
  ],
  testar: { insightId: 'ins_ganchoFamilia_listas', dimensao: 'ganchoFamilia', valor: 'listas', nomeValor: 'Listas', texto: 'Teste um gancho de lista: é a família menos usada nas peças de Ensino.', aplicado: null },
  aplicados: [
    hipotese({ insightId: 'ins_humor_sim', status: 'aberta', veredito: null, midiaId: null, texto: 'Usar humor nesta peça.' }),
    hipotese({ id: 'hip_9c9c9c9c', insightId: 'ins_voz_leo', status: 'aberta', veredito: null, midiaId: null, texto: 'Léo falando nesta peça.' }),
  ],
  resultado: null,
  semDados: null,
});

const peca = (extra = {}) => ({ id: 'reel_9beb8a8e', ideia: 'MEI pode ter funcionário?', status: 'roteiro', permalink: '', ...extra });

// ── Semanal ──────────────────────────────────────────────────────────────
test('semanas ISO: soma atravessa o ano e a de hoje sai no formato AAAA-Www', () => {
  assert.equal(semanal.somarSemanas('2026-W40', -1), '2026-W39');
  assert.equal(semanal.somarSemanas('2026-W01', -1), '2025-W52');
  assert.equal(semanal.somarSemanas('2026-W53', 1), '2027-W01');
  assert.equal(semanal.somarSemanas('lixo', 1), null);
  // 30/09/2026 às 12h de Brasília é quarta da semana 40
  assert.equal(semanal.semanaDeHoje(Date.UTC(2026, 8, 30, 15)), '2026-W40');
  // domingo 04/10 às 23h de Brasília ainda é a semana 40 (em UTC já é segunda)
  assert.equal(semanal.semanaDeHoje(Date.UTC(2026, 9, 5, 2)), '2026-W40');
});

test('fase da leitura aceita os formatos prováveis do job', () => {
  assert.equal(semanal.faseLeitura(null), null);
  assert.equal(semanal.faseLeitura({ etapa: 'lendo', inicio: '2026-09-30T10:00:00Z' }), 'rodando');
  assert.equal(semanal.faseLeitura({ rodando: true }), 'rodando');
  assert.equal(semanal.faseLeitura({ estado: 'gerando' }), 'rodando');
  assert.equal(semanal.faseLeitura({ etapa: 'pronto' }), 'pronto');
  assert.equal(semanal.faseLeitura({ etapa: 'escrevendo', fim: '2026-09-30T10:01:00Z' }), 'pronto');
  assert.equal(semanal.faseLeitura({ etapa: 'erro', erro: 'Sem login do Claude' }), 'erro');
  assert.equal(semanal.faseLeitura({ status: 'sem-login' }), 'erro');
});

test('aba com o relatório: seções na ordem do Relatorio, links e "sem dado"', () => {
  const html = semanal.semanalHtml({
    semana: '2026-W39', atual: '2026-W40', semanas: ['2026-W39', '2026-W38'], hoje: '2026-W40',
    relatorio: relatorio(), temDados: true, leitura: null, abertos: new Set(['f1']), aoAnalisar: true,
  });
  limpo(html, 'semanal');
  const ordem = ['Resumo', 'Peças da semana', 'Destaques', 'Mecanismos e hipóteses', 'Público', 'Stories', 'Próxima semana', 'Leitura da IA']
    .map((t) => html.indexOf(`>${t}</h3>`));
  assert.ok(ordem.every((i) => i > 0), `seção faltando: ${ordem}`);
  assert.deepEqual([...ordem].sort((a, b) => a - b), ordem, 'seções fora da ordem do Relatorio');
  assert.ok(html.includes('Semana de 21/09 a 27/09'));
  assert.ok(html.includes('href="#/reel/reel_9beb8a8e"'));
  assert.ok(html.includes('href="#/instagram/metricas/diagnostico?post=17900000000000001"'));
  assert.ok(html.includes('data-sm-analisar="17900000000000001"'));
  assert.ok(html.includes('&lt;script&gt;'), 'título com html precisa sair escapado');
  assert.ok(html.includes(SEM_DADO), 'número ausente precisa virar "sem dado"');
  assert.ok(html.includes('Ver o fato citado') && html.includes('Ver os 2 fatos citados'));
  assert.ok(/data-sm-det="f1" open/.test(html), 'fato aberto antes do redesenho continua aberto');
  assert.ok(html.includes('bateu 2×'), 'pílula da meta batida');
  assert.ok(html.includes('evidência moderada'));
  assert.ok(html.includes('ponto forte: gancho (0 a 3s)') && html.includes('gargalo: retenção'));
  assert.ok(html.includes('Gerado em 28/09 às 07:02, automático'));
  assert.ok(html.includes('value="2026-W40"') && html.includes('28/09 a 04/10 (parcial)'), 'semana de agora na lista, marcada como parcial');
  // peça com base mas sem o valor: nada de pílula "sem base" (o medidor já diz "sem dado")
  assert.ok(!html.includes('>sem base<'), 'pílula de meta enganosa na peça sem valor');
  assert.ok(!html.includes('data-mc-dica=""'));
});

test('aba sem relatório, carregando, com erro e na semana parcial', () => {
  const vazia = semanal.semanalHtml({ semana: '2026-W39', semanas: [], hoje: '2026-W40', relatorio: null, temDados: true });
  limpo(vazia, 'vazia');
  assert.ok(vazia.includes('O resumo da semana sai toda segunda às 7h, ou agora em Gerar agora'));
  assert.ok(vazia.includes('data-sm-gerar'));
  assert.ok(/data-sm-copiar[^>]*disabled/.test(vazia), 'sem relatório não tem o que copiar');

  const parcial = semanal.semanalHtml({ semana: '2026-W40', semanas: [], hoje: '2026-W40', relatorio: null, temDados: true });
  assert.ok(parcial.includes('sm-parcial') && parcial.includes('o resumo de agora sai parcial'));
  assert.ok(/data-sm-mover="1"[^>]*disabled/.test(parcial), 'não anda pra semana que ainda não começou');

  const carregando = semanal.semanalHtml({ semana: null, hoje: '2026-W40' });
  limpo(carregando, 'carregando');
  assert.ok(carregando.includes('Carregando o resumo') && carregando.includes('aria-busy="true"'));

  const erro = semanal.semanalHtml({ semana: null, hoje: '2026-W40', erro: 'Sem conexão com o servidor' });
  limpo(erro, 'erro');
  assert.ok(erro.includes('Não consegui ler o resumo') && erro.includes('data-sm-tentar'));

  const escrevendo = semanal.semanalHtml({ semana: '2026-W39', hoje: '2026-W40', relatorio: relatorio(), temDados: true, leitura: { etapa: 'lendo' } });
  assert.ok(escrevendo.includes('A IA está escrevendo a leitura'));
  assert.ok(/data-sm-leitura[^>]*aria-disabled="true"/.test(escrevendo), 'não pede outra leitura com uma rodando');

  assert.equal(semanal.relatorioHtml(null), '');
});

test('relatório quase vazio não quebra e mostra "sem dado"', () => {
  const html = semanal.relatorioHtml({ versao: 1, semana: '2026-W39', resumo: {}, pecas: [], destaques: {}, mecanismos: {}, publico: {}, stories: null, proximaSemana: [], fatos: [], leituraIa: null });
  limpo(html, 'quase vazio');
  assert.ok(html.includes(SEM_DADO));
  assert.ok(html.includes('Nenhuma peça publicada nesta semana.'));
  assert.ok(html.includes('Ainda sem leitura.'));

  // semana sem peça com base (como o servidor devolve de verdade): "0 de 0" não é taxa, é "sem dado"
  const zero = { versao: 1, semana: '2026-W39', inicio: '2026-09-21', fim: '2026-09-27', resumo: { publicadas: { reel: 0, carrossel: 0, estatico: 0, total: 0 }, metasBatidas: { n: 0, de: 0 }, medianaScore: null, taxaAcerto: null, anterior: { metasBatidas: { n: 1, de: 2 }, medianaScore: 0.6 }, frases: [] }, pecas: [], destaques: { melhor: null, pior: null }, mecanismos: { insights: [], hipoteses: { confirmadas: [], refutadas: [], inconclusivas: [], abertas: 0 } }, publico: { seguidores: { inicio: null, fim: null, variacao: null }, pctNaoSeguidores: null, frases: [] }, stories: null, proximaSemana: [], fatos: [], leituraIa: null };
  const hz = semanal.relatorioHtml(zero);
  limpo(hz, 'semana sem base');
  assert.ok(!hz.includes('0 de 0') && hz.includes('nenhuma peça da semana tinha base pra comparar'));
  const tz = semanal.textoResumo(zero);
  limpo(tz, 'texto sem base', { html: false });
  assert.ok(tz.includes('Bateram a meta de 2×: sem dado (nenhuma peça da semana tinha base pra comparar); na semana anterior, 1 de 2'));
  assert.ok(tz.includes('Seguidores: sem dado'));

  // a única peça teve anúncio: não é "nenhuma peça tinha base", é a peça com anúncio fora da conta
  const anuncio = { ...zero, resumo: { ...zero.resumo, publicadas: { reel: 1, carrossel: 0, estatico: 0, total: 1 }, comAnuncio: 1, semAvaliacao: 0, provisorias: 0 },
    pecas: [{ midiaId: '17900000000000009', titulo: 'Reel com anúncio', dia: '2026-09-23', tipo: 'ensino', peca: 'reel', impulsionado: true, objetivo: { rotulo: 'Salvamentos', valor: 9, base: 3, meta: 7, score: 1.3 } }] };
  const ha = semanal.relatorioHtml(anuncio);
  limpo(ha, 'peça com anúncio');
  assert.ok(ha.includes('1 peça teve anúncio') && !ha.includes('nenhuma peça da semana tinha base'));
  assert.ok(ha.includes('data-destaque="anuncio"'), 'a peça com anúncio leva o selo');
  const ta = semanal.textoResumo(anuncio);
  limpo(ta, 'texto com anúncio', { html: false });
  assert.ok(ta.includes('Bateram a meta de 2×: sem dado (1 peça teve anúncio)'));
  assert.ok(ta.includes('Reel com anúncio (teve anúncio, fora da conta da semana)'));
});

test('seguidores da semana: uma leitura só não vira "0 na semana" e os rótulos dizem o dia da leitura', () => {
  // o motor devolve variacao null com uma leitura só (seguidoresDaSemana)
  const umaLeitura = { ...relatorio(), publico: { seguidores: { inicio: 109, fim: 109, variacao: null, diaInicio: '2026-09-30', diaFim: '2026-09-30' }, pctNaoSeguidores: 62.5, frases: [] } };
  const h1 = semanal.relatorioHtml(umaLeitura);
  limpo(h1, 'uma leitura');
  assert.ok(h1.includes('<dt>Seguidores em 30/09</dt>'), 'rótulo com o dia da leitura');
  assert.ok(/<dt>Variação na semana<\/dt><dd class="sm-kpi-valor">sem dado<\/dd><dd class="sm-kpi-detalhe"><span>uma leitura só na semana<\/span>/.test(h1));
  assert.ok(!h1.includes('fim da semana') && !h1.includes('começo da semana'));
  const t1 = semanal.textoResumo(umaLeitura);
  limpo(t1, 'texto uma leitura', { html: false });
  assert.ok(t1.includes('• Seguidores em 30/09: 109 (uma leitura só na semana)'));
  assert.ok(!t1.includes('0 na semana'));
  // duas leituras: a variação do servidor e os dois dias
  const duas = { ...relatorio(), publico: { seguidores: { inicio: 109, fim: 115, variacao: 6, diaInicio: '2026-09-28', diaFim: '2026-09-30' }, pctNaoSeguidores: null, frases: [] } };
  const h2 = semanal.relatorioHtml(duas);
  assert.ok(h2.includes('<dt>Seguidores em 30/09</dt>') && h2.includes('eram 109 em 28/09') && h2.includes('de 28/09 a 30/09'));
  assert.ok(h2.includes('>+6<'));
  assert.ok(semanal.textoResumo(duas).includes('• Seguidores em 30/09: 115 (+6 desde 28/09)'));
  // variação 0 medida de verdade (duas leituras) continua 0
  const igual = { ...duas, publico: { ...duas.publico, seguidores: { ...duas.publico.seguidores, fim: 109, variacao: 0 } } };
  assert.ok(semanal.textoResumo(igual).includes('(sem mudança desde 28/09)'));
});

test('hipóteses "não aplicada" aparecem na tela e no texto, com o veredito que o motor manda', () => {
  // o relatorio-motor manda o veredito como texto pronto (itemHipotese), não como objeto
  const naoAplicada = { id: 'hip_aaaa1111', reelId: 'reel_9beb8a8e', reelTitulo: 'MEI pode ter funcionário?', midiaId: '17900000000000001', texto: 'Usar gancho de pergunta nesta peça.', veredito: 'A peça saiu sem gancho de pergunta: não aplicada.', score: null };
  const rel = { ...relatorio(), mecanismos: { insights: [], hipoteses: { confirmadas: [], refutadas: [], inconclusivas: [], naoAplicadas: [naoAplicada], abertas: 0 } } };
  const html = semanal.relatorioHtml(rel);
  limpo(html, 'não aplicada');
  assert.ok(!html.includes('Nenhuma hipótese ganhou veredito nesta semana.'), 'negou o veredito que existe');
  assert.ok(html.includes('data-grupo="naoAplicadas"') && html.includes('Não aplicadas'));
  assert.ok(html.includes('A peça saiu sem gancho de pergunta: não aplicada.'), 'veredito em texto sumiu');
  const txt = semanal.textoResumo(rel);
  assert.ok(txt.includes('• Não aplicada: Usar gancho de pergunta nesta peça. A peça saiu sem gancho de pergunta: não aplicada.'));
  // o formato antigo (hipótese crua, veredito { texto }) continua valendo
  assert.ok(semanal.relatorioHtml(relatorio()).includes('O gancho segurou 1,6× a base.'));
});

test('fator abaixo de 2× sai truncado: quem não bateu nunca aparece como "2×"', () => {
  assert.equal(semanal.vezesDe(Math.log2(1047 / 523.7), { bateu: false }), '1,9×');
  assert.equal(semanal.vezesDe(Math.log2(670 / 340)), '1,9×');
  assert.equal(semanal.vezesDe(Math.log2(19 / 10)), '1,9×');
  assert.equal(semanal.vezesDe(Math.log2(1.46)), '1,4×');
  assert.equal(semanal.vezesDe(1), '2×');
  assert.equal(semanal.vezesDe(Math.log2(2.35), { bateu: true }), '2,4×');
  // valor fracionário entre 2× a base e a meta inteira: não bateu, então no máximo 1,9×
  assert.equal(semanal.vezesDe(Math.log2(2.06), { bateu: false }), '1,9×');
  assert.equal(semanal.vezesDe(Math.log2(0.05)), '0,05×');
  assert.equal(semanal.vezesDe(null), SEM_DADO);
  // a peça que ficou em 1,97× a base: a tela e o texto dizem 1,9×
  const quase = relatorio();
  quase.pecas[2] = { ...quase.pecas[2], objetivo: { ...quase.pecas[2].objetivo, valor: 985, base: 500, meta: 1000, score: Math.log2(985 / 500), bateuMeta: false }, bateuMeta: false };
  const txt = semanal.textoResumo(quase);
  assert.ok(txt.includes('Alcance: 985 (meta 1.000, base 500). Ficou em 1,9× a base.'), 'texto arredondou pra 2×');
  const html = semanal.relatorioHtml(quase);
  assert.ok(html.includes('Alcance: 985 (1,9× a base)'), 'destaque arredondou pra 2×');
  assert.ok(!/Ficou em 2×|\(2× a base\)/.test(txt + html));
  // mediana da semana em 1,96×: "1,9×", nunca "2×"
  const mediana = { ...relatorio(), resumo: { ...relatorio().resumo, medianaScore: Math.log2(1.96) } };
  assert.ok(semanal.relatorioHtml(mediana).includes('<dd class="sm-kpi-valor">1,9×</dd>'));
});

test('peças com menos de 7 dias ficam fora da meta e são ditas à parte', () => {
  const rel = relatorio();
  rel.resumo = { ...rel.resumo, metasBatidas: { n: 0, de: 0 }, taxaAcerto: null, provisorias: 3 };
  const html = semanal.relatorioHtml(rel);
  limpo(html, 'provisórias');
  assert.ok(html.includes('3 peças ainda têm menos de 7 dias'));
  assert.ok(!html.includes('nenhuma peça da semana tinha base pra comparar'), 'afirmou que não tinha base');
  const txt = semanal.textoResumo(rel);
  assert.ok(txt.includes('Bateram a meta de 2×: sem dado (3 peças ainda têm menos de 7 dias)'));
  rel.resumo = { ...rel.resumo, metasBatidas: { n: 1, de: 2 }, provisorias: 1 };
  assert.ok(semanal.relatorioHtml(rel).includes('1 peça ainda tem menos de 7 dias'));
  assert.ok(semanal.textoResumo(rel).includes('Bateram a meta de 2×: 1 de 2 (50%); 1 peça ainda tem menos de 7 dias'));
  // sem destaque: a regra inteira, sem afirmar que nenhuma peça tinha base
  const semDestaque = { ...relatorio(), destaques: { melhor: null, pior: null } };
  assert.ok(semanal.relatorioHtml(semDestaque).includes('Sem destaque: ele sai só de peça com 7 dias ou mais, sem anúncio e com base pra comparar.'));
});

test('leitura da IA: o rodapé não inventa o motivo das frases que saíram', () => {
  const html = semanal.relatorioHtml(relatorio());
  assert.ok(html.includes('1 frase saiu por não passar na conferência com os fatos citados'));
  assert.ok(!html.includes('por trazer número que não estava neles'));
  const tres = { ...relatorio(), leituraIa: { ...relatorio().leituraIa, descartadas: 3 } };
  assert.ok(semanal.relatorioHtml(tres).includes('3 frases saíram por não passar na conferência com os fatos citados'));
});

test('Gerar agora com outra semana gerando: travado e dizendo qual', () => {
  const html = semanal.semanalHtml({
    semana: '2026-W38', semanas: ['2026-W39', '2026-W38'], hoje: '2026-W40', relatorio: null, temDados: true, gerando: false, gerandoOutra: '2026-W39',
  });
  limpo(html, 'gerando outra');
  assert.ok(/data-sm-gerar data-foco="gerar" aria-disabled="true" data-mc-dica="Espere: gerando o resumo da semana de 21\/09 a 27\/09"/.test(html), 'botão do topo');
  assert.ok(/data-foco="gerar-vazio" aria-disabled="true"/.test(html), 'botão do estado vazio');
  assert.ok(html.includes('Gerando o resumo da semana de 21/09 a 27/09. O Gerar agora desta semana volta quando ele terminar.'));
  // a semana que está gerando: ocupada; nenhuma gerando: livre
  const propria = semanal.semanalHtml({ semana: '2026-W39', hoje: '2026-W40', relatorio: null, temDados: true, gerando: true, gerandoOutra: null });
  assert.ok(/data-foco="gerar" aria-disabled="true" aria-busy="true"/.test(propria));
  const livre = semanal.semanalHtml({ semana: '2026-W39', hoje: '2026-W40', relatorio: null, temDados: true, gerando: false, gerandoOutra: null });
  assert.ok(!/data-sm-gerar[^>]*aria-disabled/.test(livre));
});

test('copiar resumo: texto puro pro WhatsApp, com "•" e sem travessão', () => {
  const txt = semanal.textoResumo(relatorio());
  limpo(txt, 'texto', { html: false });
  assert.ok(txt.startsWith('RESUMO DA SEMANA: 21/09 a 27/09'));
  assert.ok(txt.includes('\n• Peças publicadas: 3 (2 reels e 1 carrossel)'));
  assert.ok(txt.includes('Bateram a meta de 2×: 1 de 2 (50%)'));
  assert.ok(txt.includes('   • Salvamentos: 7 (meta 7, base 3). Bateu a meta de 2×.'));
  assert.ok(txt.includes('Seguidores, visitas ao perfil e cliques no link: sem dado.'));
  assert.ok(txt.includes('Respostas: sem dado'));
  assert.ok(txt.includes('Alcance de quem não segue: sem dado'));
  assert.ok(txt.includes('PRÓXIMA SEMANA') && txt.includes('LEITURA DA IA'));
  assert.ok(!/[*_`#]/.test(txt), 'nada de markdown');
  assert.ok(!/<(?:span|div|p|b|ul|li|a|svg)\b/i.test(txt), 'nada da marcação da tela no texto');
  assert.ok(txt.includes('MEI pode ter funcionário? <script>alert(1)</script>'), 'título sai como veio, sem entidade de HTML');
  assert.equal(semanal.textoResumo(null), '');
});

// ── Métricas desta peça ──────────────────────────────────────────────────
test('bloco da peça: esqueleto, modo edição e peça faltando', () => {
  assert.equal(dm.blocoMetricasHtml(null), '');
  assert.equal(dm.blocoMetricasHtml(peca(), { editando: true }), '');
  const html = dm.blocoMetricasHtml(peca());
  limpo(html, 'esqueleto');
  assert.ok(html.includes('id="dm-bloco"') && html.includes('data-reel="reel_9beb8a8e"'));
  assert.ok(html.includes('Métricas desta peça') && html.includes('Carregando as métricas'));
  const semId = dm.blocoMetricasHtml(peca({ id: '../../x' }));
  limpo(semId, 'sem id');
  assert.ok(semId.includes('data-reel=""') && semId.includes('Esta peça ainda não tem métricas.'));
});

test('peça por publicar: meta, aplicar, aplicado com desfazer e testar', () => {
  const html = dm.metricasPecaHtml(recsPlanejar(), peca());
  limpo(html, 'planejar');
  assert.ok(html.includes('Aplicar nesta peça'));
  assert.ok(html.includes('data-dm-aplicar="ins_ganchoForma_pergunta"'));
  assert.ok(html.includes('data-dm-desfazer="hip_1a2b3c4d"') && html.includes('Aplicado <b aria-hidden="true">✓</b>'));
  assert.ok(html.includes('data-dm-aplicar="ins_ganchoFamilia_listas"') && html.includes('Testar'));
  assert.ok(html.includes('Meta desta peça (Ensino)'));
  assert.ok(html.includes('humor só se o tema não for multa'));
  assert.ok(html.includes('evidência moderada') && html.includes('4 peças'));
  // hipótese de insight que saiu da lista aparece à parte, com desfazer
  assert.ok(html.includes('Também aplicado nesta peça') && html.includes('data-dm-desfazer="hip_9c9c9c9c"'));

  // com base e sem recomendação com evidência: a meta e só o "Testar" (SPEC §3.4)
  const soTestar = dm.metricasPecaHtml({ ...recsPlanejar(), itens: [], aplicados: [] }, peca());
  limpo(soTestar, 'só testar');
  assert.ok(soTestar.includes('meta <b>3</b>') && soTestar.includes('data-dm-aplicar="ins_ganchoFamilia_listas"'));
  assert.ok(!soTestar.includes('Fazer mais'));
});

test('peça publicada e ligada: resultado contra a meta, etapas e link do diagnóstico', () => {
  const d = { ...recsPlanejar(), itens: [], testar: null, aplicados: [hipotese()], resultado: postRow() };
  const html = dm.metricasPecaHtml(d, peca({ status: 'publicado', permalink: 'https://www.instagram.com/reel/ABC123/' }));
  limpo(html, 'publicada');
  assert.ok(html.includes('Resultado × meta') && html.includes('bateu 2×'));
  assert.ok(html.includes('Bateu a meta de 2×: fez 7 em salvamentos, e a meta era 7.'));
  assert.ok(html.includes('Ponto forte: o gancho (0 a 3s), com 54% contra 40% na base.'));
  assert.ok(html.includes('Gargalo: a retenção, com 18,7% contra 26% na base.'));
  assert.ok(html.includes('Confirmada') && html.includes('Uma peça é sinal, não prova.'));
  assert.ok(html.includes('data-dm-ir="#/instagram/metricas/diagnostico?post=17900000000000001"') && html.includes('Ver diagnóstico completo'));
  assert.ok(!html.includes('data-dm-aplicar'), 'peça publicada não oferece aplicar');

  // sem o valor: só o objetivo de Vendas (interesse) pede os números do app; os outros esperam o Instagram
  const semValor = { ...d, resultado: { ...postRow(), objetivo: { ...postRow().objetivo, valor: null, fonte: null, bateuMeta: null, score: null }, funil: [], gargalo: null, forte: null } };
  const h2 = dm.metricasPecaHtml(semValor, peca({ status: 'publicado' }));
  limpo(h2, 'publicada sem valor');
  assert.ok(h2.includes(SEM_DADO) && h2.includes('Sem dado da métrica do tipo nesta leitura: o Instagram não mandou o número.'));
  assert.ok(!h2.includes('informe os números do app'), 'mandou informar número do app fora de Vendas');
  const recente = { ...semValor, resultado: { ...semValor.resultado, idadeH: 20 } };
  assert.ok(dm.metricasPecaHtml(recente, peca({ status: 'publicado' })).includes('o Instagram ainda não mandou o número (pode levar até 48h depois de publicar)'));
  const vendas = { ...semValor, resultado: { ...semValor.resultado, tipo: 'vendas', objetivo: { ...semValor.resultado.objetivo, id: 'interesse', rotulo: 'Seguidores, visitas ao perfil e cliques no link' } } };
  assert.ok(dm.metricasPecaHtml(vendas, peca({ status: 'publicado' })).includes('Sem dado: informe os números do app (seguidores, visitas ao perfil e cliques no link) no Diagnóstico.'));
});

test('resultado que não bateu: o fator sai truncado e nunca "2×"', () => {
  const o = { ...postRow().objetivo, valor: 985, base: 500, meta: 1000, score: Math.log2(985 / 500), bateuMeta: false, id: 'alcance', rotulo: 'Alcance' };
  const d = { ...recsPlanejar(), itens: [], testar: null, aplicados: [], resultado: { ...postRow(), objetivo: o } };
  const html = dm.metricasPecaHtml(d, peca({ status: 'publicado' }));
  limpo(html, 'não bateu');
  assert.ok(html.includes('Ficou em 1,9× a base: fez 985 em alcance, e a meta era 1.000.'), 'fator arredondado pra cima');
  assert.ok(!html.includes('Ficou em 2×'));
  assert.equal(dm.vezesDe(Math.log2(1.999), { bateu: false }), '1,9×');
  assert.equal(dm.vezesDe(Math.log2(2.06), { bateu: false }), '1,9×');
  assert.equal(dm.vezesDe(Math.log2(2.35)), '2,4×');
  assert.equal(dm.vezesDe(Math.log2(0.64)), '0,6×');
});

test('stories publicado: a régua própria, nunca "ligue o post"', () => {
  const stories = { reelId: 'reel_9beb8a8e', tipo: 'conexao', peca: 'stories', meta: null, itens: [], testar: null, aplicados: [], resultado: null, semDados: 'Stories têm a régua própria, na tabela de Stories.' };
  const html = dm.metricasPecaHtml(stories, peca({ status: 'publicado', peca: 'stories' }));
  limpo(html, 'stories');
  assert.ok(html.includes('Stories têm a régua própria, na tabela de Stories.') && html.includes('class="dm-frase"'));
  assert.ok(!html.includes('falta o link do post') && !html.includes('Abrir o Diagnóstico'));
  // hipótese que sobrou de quando a peça era reel continua com o Desfazer
  const comHip = dm.metricasPecaHtml({ ...stories, aplicados: [hipotese({ status: 'aberta', veredito: null })] }, peca({ status: 'publicado', peca: 'stories' }));
  assert.ok(comHip.includes('data-dm-desfazer="hip_1a2b3c4d"'));
  // sem o porquê do servidor: a frase dos stories, não a de "sem base"
  const semPorque = dm.metricasPecaHtml({ ...stories, semDados: null }, peca({ status: 'publicado', peca: 'stories' }));
  assert.ok(semPorque.includes('Stories têm a régua própria, na tabela de Stories do Diagnóstico.'));
});

test('aplicar e desfazer seguidos: cada um parte do estado mais novo e os dois ficam', () => {
  const hipA = hipotese({ id: 'hip_aaaaaaaa', insightId: 'ins_ganchoForma_pergunta', status: 'aberta', veredito: null });
  const d0 = {
    ...recsPlanejar(),
    itens: [
      { ...recsPlanejar().itens[0], aplicado: 'hip_aaaaaaaa' },
      { ...recsPlanejar().itens[1], aplicado: null },
    ],
    aplicados: [hipA],
  };
  const hipB = hipotese({ id: 'hip_bbbbbbbb', insightId: 'ins_humor_sim', status: 'aberta', veredito: null });
  // Desfazer no I1 e depois Aplicar no I2: o segundo parte do resultado do primeiro
  const depois = dm.comAplicado(dm.semAplicado(d0, 'hip_aaaaaaaa'), 'ins_humor_sim', hipB);
  assert.deepEqual(depois.itens.map((i) => i.aplicado), [null, 'hip_bbbbbbbb']);
  assert.deepEqual(depois.aplicados.map((h) => h.id), ['hip_bbbbbbbb']);
  // partir do d do clique (o erro de antes) ressuscitava a hipótese apagada
  const doClique = dm.comAplicado(d0, 'ins_humor_sim', hipB);
  assert.equal(doClique.itens[0].aplicado, 'hip_aaaaaaaa');
  // aplicar de novo o mesmo não duplica a hipótese
  assert.equal(dm.comAplicado(depois, 'ins_humor_sim', hipB).aplicados.length, 1);
});

test('sem Instagram, sem base, rota fora do ar: uma frase curta, nunca caixa de erro', () => {
  const casos = [
    [dm.metricasPecaHtml(null, peca()), 'não carregaram agora'],
    [dm.metricasPecaHtml(null, peca(), { conectado: false }), 'Conecte o Instagram'],
    [dm.metricasPecaHtml({ reelId: 'reel_9beb8a8e', meta: null, itens: [], testar: null, aplicados: [], resultado: null, semDados: null }, peca()), 'Ainda sem base'],
    [dm.metricasPecaHtml({ reelId: 'reel_9beb8a8e', meta: null, itens: [], testar: null, aplicados: [], resultado: null, semDados: 'Ainda sem base: faltam peças de Ensino com número.' }, peca()), 'faltam peças de Ensino'],
    // como o motor manda de verdade: meta sempre presente (base null) e um testar mesmo sem post
    [dm.metricasPecaHtml({
      reelId: 'reel_9beb8a8e', tipo: 'ensino', peca: 'reel',
      meta: { objetivo: { id: 'salvamentos', rotulo: 'Salvamentos' }, base: null, baseN: 0, baseDe: null, meta: null, texto: 'Ainda sem base de Ensino.' },
      itens: [], testar: { insightId: 'ins_ganchoFamilia_listas', dimensao: 'ganchoFamilia', valor: 'listas', nomeValor: 'Listas', texto: 'Teste um gancho de lista.', aplicado: null },
      aplicados: [], resultado: null, semDados: 'Ainda não há posts lidos do Instagram pra comparar.',
    }, peca()), 'Ainda não há posts lidos'],
  ];
  for (const [html, trecho] of casos) {
    limpo(html, trecho);
    assert.ok(html.includes(trecho), trecho);
    assert.ok(html.includes('class="dm-frase"'));
    assert.ok(!/role="alert"|erro/i.test(html), 'frase curta, sem cara de erro');
  }
  const semPost = dm.metricasPecaHtml({ ...recsPlanejar(), aplicados: [] }, peca({ status: 'publicado' }));
  limpo(semPost, 'publicada sem post');
  assert.ok(semPost.includes('Peça publicada, mas falta o link do post') && semPost.includes('Abrir o Diagnóstico'));
});
