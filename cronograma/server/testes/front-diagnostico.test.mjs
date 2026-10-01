// Teste de fumaça da aba Diagnóstico (public/js/views/diagnostico.js, SPEC-METRICAS.md §5.3): desenha o HTML
// puro com dados no formato do §3.4 (resumo) e do §3.11 (detalhePost) e confere que nada quebra, que não sai
// travessão nem meia-risca e que número ausente vira "sem dado". Sem navegador: o core.js e o efeitos.js tocam
// em document, window, location, localStorage, addEventListener e matchMedia ao carregar, então entra o mínimo.
// Revisão de 30/09: cartões de meta por tipo e formato (a régua da última peça é a dela), fator truncado de
// quem não bateu, efeito sem comparação, público do post só com frases e grupos visíveis, seletor de vínculo
// com botão, evidência da IA em texto puro, leitura de print pendente, falha da agenda e stories sem dia vazio.
// Rodar: node --test "server/testes/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const nada = () => {};
const elemento = () => ({
  dataset: {}, style: {}, hidden: true, isConnected: false,
  classList: { add: nada, remove: nada, toggle: nada, contains: () => false },
  setAttribute: nada, getAttribute: () => null, removeAttribute: nada, addEventListener: nada, removeEventListener: nada,
  append: nada, appendChild: nada, querySelector: () => null, querySelectorAll: () => [], contains: () => false, focus: nada,
});
globalThis.document = {
  documentElement: { dataset: { theme: 'dark' } }, body: elemento(), activeElement: null, visibilityState: 'visible',
  addEventListener: nada, removeEventListener: nada, querySelector: () => null, querySelectorAll: () => [],
  getElementById: () => null, createElement: elemento,
};
globalThis.window = globalThis;
globalThis.location = { hash: '#/instagram/metricas/diagnostico', pathname: '/', href: 'http://localhost/#/instagram/metricas/diagnostico' };
globalThis.localStorage = { getItem: () => null, setItem: nada, removeItem: nada };
globalThis.addEventListener = nada;
globalThis.removeEventListener = nada;
globalThis.matchMedia = () => ({ matches: false, addEventListener: nada, removeEventListener: nada });

const dg = await import('../../public/js/views/diagnostico.js');
const mc = await import('../../public/js/metricas-comum.js');

const TRACO = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const EM = String.fromCharCode(0x2014);

// saída de tela: sem travessão, sem valor cru de JS vazando pro texto
function limpo(html, onde) {
  assert.equal(typeof html, 'string', `${onde}: não devolveu texto`);
  assert.doesNotMatch(html, TRACO, `${onde}: tem travessão ou meia-risca`);
  assert.doesNotMatch(html, /\bundefined\b|\bNaN\b|\bnull\b|\[object Object\]/, `${onde}: vazou valor cru`);
  // número ausente nunca vira hífen solto nem célula vazia de propósito
  assert.doesNotMatch(html, />\s*-\s*</, `${onde}: hífen no lugar de "sem dado"`);
}
// o texto que aparece na tela (sem as tags e os atributos)
const visivel = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

// ── dados no formato do SPEC ──
const ID1 = '17900000000000001';
const ID2 = '17900000000000002';
const ID3 = '17900000000000003';
const ID4 = '17900000000000004';

const post = (extra = {}) => ({
  midiaId: ID1, permalink: 'https://www.instagram.com/reel/ABC123/', thumb: 'https://scontent.cdninstagram.com/v/t51/1.jpg',
  legenda1: 'Quanto custa abrir um MEI em 2026?', timestamp: '2026-09-28T15:00:00+0000', dia: '2026-09-28', hora: 12, idadeH: 50,
  tipoMidia: 'REELS', peca: 'reel', formatoMidia: 'reel', reelId: 'reel_abc123', reelTitulo: 'Quanto custa abrir MEI', tipo: 'ensino', pilar: '3',
  pilarNome: 'Abrir e regularizar', bloco: 'Educação',
  metricas: {
    views: 1500, reach: 1005, saved: 3, shares: 5, likes: 40, comments: 2, interacoes: 50, avgWatchMs: 7100, skipRate: 46,
    retido3s: 54, duracaoS: 38, pctAssistido: 18.7, replays: null, follows: null, profileVisits: null, bioLinkClicks: null,
    cadastros: null, totalViews: 1500, seguidoresNoDia: 109, alcancePorSeguidor: 9.2,
  },
  objetivo: {
    id: 'salvamentos', rotulo: 'Salvamentos', valor: 3, fonte: 'api', idadeRef: 'atual', provisorio: true, base: 1, baseN: 5,
    baseDe: 'tipo', meta: 3, razao: 3, score: 1, bateuMeta: true, ritmo: 0.8,
  },
  funil: [
    { etapa: 'gancho', rotulo: 'Gancho (0 a 3s)', valor: 54, valorTexto: '54%', base: 40, baseTexto: '40%', score: 0.43, nivel: 'normal', detalhe: 'passaram dos 3 primeiros segundos' },
    { etapa: 'retencao', rotulo: 'Retenção', valor: 18.7, valorTexto: '18,7%', base: 26, baseTexto: '26%', score: -0.6, nivel: 'abaixo', detalhe: '7,1s de 38s' },
    { etapa: 'distribuicao', rotulo: 'Distribuição', valor: 9.2, valorTexto: '9,2×', base: 3, baseTexto: '3×', score: 1.62, nivel: 'acima', detalhe: '' },
    { etapa: 'qualidade', rotulo: 'Ação por pessoa alcançada', valor: null, valorTexto: null, base: null, baseTexto: null, score: null, nivel: null, detalhe: null },
  ],
  gargalo: 'retencao', forte: 'distribuicao',
  porque: {
    bem: ['Chegou longe: alcance de 1.005 contas, 9,2× o número de seguidores (a mediana é 3×).'],
    mal: ['Quem ficou assistiu em média 18% do vídeo (7,1s de 38s), abaixo da mediana (26%).'],
  },
  tags: { ganchoForma: { valor: 'pergunta', fonte: 'ia' } }, tagsFaltando: ['gatilho'],
  impulsionado: false, talvezImpulsionado: false, outlier: false, iaStatus: 'ok', avisos: [],
  ...extra,
});

const postVazio = {
  midiaId: ID2, permalink: null, thumb: null, legenda1: '', timestamp: '2026-09-29T21:00:00+0000', dia: '2026-09-29', hora: 18, idadeH: 20,
  tipoMidia: 'CAROUSEL_ALBUM', peca: 'carrossel', formatoMidia: 'feed', reelId: null, reelTitulo: null, tipo: null, pilar: null, pilarNome: null, bloco: null,
  metricas: { views: null, reach: null, saved: null, shares: null, likes: null, comments: null, follows: null, profileVisits: null, bioLinkClicks: null },
  objetivo: {
    id: 'alcance', rotulo: 'Alcance (peça sem tipo)', valor: null, fonte: null, idadeRef: null, provisorio: false, base: null, baseN: 0,
    baseDe: null, meta: null, razao: null, score: null, bateuMeta: null, ritmo: null,
  },
  funil: [], gargalo: null, forte: null, porque: { bem: [], mal: [] }, tags: {}, tagsFaltando: [],
  impulsionado: null, talvezImpulsionado: true, outlier: false, iaStatus: null, avisos: ['Sem insight da Meta ainda: o post tem menos de 48 horas.'],
};

const postVendas = post({
  midiaId: ID3, timestamp: '2026-09-27T12:00:00+0000', dia: '2026-09-27', tipo: 'vendas', reelId: 'reel_vnd001', outlier: true,
  objetivo: {
    id: 'interesse', rotulo: 'Seguidores, visitas ao perfil e cliques no link', valor: null, fonte: null, idadeRef: 'atual',
    provisorio: false, base: 4, baseN: 3, baseDe: 'formato', meta: 9, razao: null, score: null, bateuMeta: null, ritmo: null,
  },
  gargalo: null, forte: null,
});

// reel de Vendas de 50 dias com os números do app digitados no terceiro dia: provisório pra sempre
const postVendasVelho = post({
  midiaId: ID4, timestamp: '2026-08-11T12:00:00+0000', dia: '2026-08-11', idadeH: 1200, tipo: 'vendas', reelId: 'reel_vnd002',
  objetivo: {
    id: 'interesse', rotulo: 'Seguidores, visitas ao perfil e cliques no link', valor: 12, fonte: 'manual', idadeRef: 'atual',
    provisorio: true, base: 10, baseN: 3, baseDe: 'tipo', meta: 20, razao: 1.2, score: 0.26, bateuMeta: null, ritmo: null,
  },
  gargalo: null, forte: null,
});

const agendaOk = { ligada: true, ultimas: { sincronizar: { em: '2026-09-30T17:00:00.000Z', ok: true, erro: null } }, proximas: { sincronizar: '2026-09-30T20:00:00.000Z' }, erros: [] };

const resumo = {
  atualizadoEm: '2026-09-30T18:00:00.000Z', conectado: true, sincronizadoEm: '2026-09-30T17:00:00.000Z',
  agenda: agendaOk,
  // um cartão por tipo e formato (C1): a régua da última peça vem em ultima.base e ultima.meta
  metas: [
    {
      tipo: 'ensino', rotuloTipo: 'Ensino', formato: 'reel', rotuloFormato: 'Reels', objetivo: { id: 'salvamentos', rotulo: 'Salvamentos' },
      base: 2, baseN: 5, baseDe: 'tipo', meta: 4, ultima: { midiaId: ID1, valor: 3, score: 1, bateuMeta: true, provisorio: true, base: 1, meta: 3 },
    },
    {
      tipo: 'vendas', rotuloTipo: 'Vendas', formato: 'reel', rotuloFormato: 'Reels', objetivo: { id: 'interesse', rotulo: 'Seguidores, visitas ao perfil e cliques no link' },
      base: null, baseN: 1, baseDe: null, meta: null, ultima: { midiaId: ID3, valor: null, score: null, bateuMeta: null, provisorio: false, base: 4, meta: 9 },
    },
    {
      tipo: 'viralizacao', rotuloTipo: 'Viralização', formato: 'feed', rotuloFormato: 'Posts e carrosséis', objetivo: { id: 'alcance', rotulo: 'Alcance' },
      base: 480.5, baseN: 4, baseDe: 'tipo-misto', meta: 961, ultima: { midiaId: ID2, valor: null, score: null, bateuMeta: null, provisorio: false, base: null, meta: null },
    },
    { tipo: 'conexao', rotuloTipo: 'Conexão', formato: null, rotuloFormato: null, objetivo: { id: 'conversa', rotulo: 'Comentários e compartilhamentos' }, base: null, baseN: 0, baseDe: null, meta: null, ultima: null },
  ],
  numeros: { posts: 3, comBase: 1, bateramMeta30d: 1, avaliadas30d: 2, taxaAcerto30d: 50, medianaScore30d: 0.26, semTipo: 1, semTags: 1, semVinculo: 1 },
  pendencias: [
    { id: 'vincular', texto: '1 post sem peça do cronograma', n: 1, acao: 'Vincular' },
    { id: 'etiquetar', texto: '2 posts sem etiqueta da IA', n: 2, acao: 'Etiquetar com IA' },
    { id: 'numeros-app', texto: '1 reel de Vendas sem os números do app', n: 1, acao: 'Informar números do app' },
    { id: 'anuncios', texto: 'Anúncios não conectados', n: null, acao: 'Conectar anúncios' },
  ],
  sugestoesVinculo: [
    { midiaId: ID2, reelId: 'reel_xyz789', reelTitulo: 'Carrossel do DAS', dia: '2026-09-29', reelDia: '2026-09-30', score: 0.8, motivo: 'mesmo dia e legenda parecida' },
    { midiaId: 'abc', reelId: 'reel_xyz789', reelTitulo: 'id ruim', dia: '2026-09-29', score: 0.5, motivo: 'não pode aparecer' },
  ],
  posts: [post(), postVazio, postVendas],
  efeitos: [
    {
      // mediaEtapaCom e mediaEtapaSem são o valor cru da etapa (52 = 52% passaram do gancho), não score
      dimensao: 'ganchoForma', valor: 'pergunta', nomeValor: 'Pergunta', n: 4, nSem: 6, mediaCom: 0.68, mediaSem: -0.32, efeito: 0.57,
      consistencia: 0.75, etapa: 'gancho', efeitoEtapa: 0.3, mediaEtapaCom: 52, mediaEtapaSem: 38, unidadeEtapa: 'pct', evidencia: 'moderada', midias: [ID1],
    },
    {
      dimensao: 'ganchoForma', valor: 'afirmacao', nomeValor: 'Afirmação', n: 3, nSem: 7, mediaCom: -0.4, mediaSem: 0.2, efeito: -0.3,
      consistencia: 0.67, etapa: 'gancho', efeitoEtapa: null, mediaEtapaCom: null, mediaEtapaSem: null, evidencia: 'fraca', midias: [ID3],
    },
    {
      dimensao: 'rostoInicio', valor: true, nomeValor: null, n: 2, nSem: 8, mediaCom: null, mediaSem: null, efeito: null, consistencia: null,
      etapa: null, efeitoEtapa: null, mediaEtapaCom: null, mediaEtapaSem: null, evidencia: 'insuficiente', midias: [],
    },
  ],
  insights: [
    {
      id: 'ins_ganchoForma_pergunta', acao: 'usar', dimensao: 'ganchoForma', valor: 'pergunta', nomeValor: 'Pergunta', titulo: 'Gancho de pergunta',
      texto: 'Peças com gancho de pergunta ficaram em 1,6× a base, contra 0,8× das outras (4 peças, evidência moderada).', evidencia: 'moderada',
      n: 4, fatorCom: 1.6, fatorSem: 0.8, aplica: 'peca', pecas: ['reel'], tipos: ['ensino'], midias: [ID1, '999'],
    },
    {
      id: 'ins_pilar_3', acao: 'planejar', dimensao: 'pilar', valor: '3', nomeValor: 'Abrir e regularizar', titulo: 'Pilar Abrir e regularizar',
      texto: 'O pilar tende a ir melhor nas 2 peças.', evidencia: 'fraca', n: 2, fatorCom: null, fatorSem: null, aplica: 'planejamento', pecas: [], tipos: [], midias: [],
    },
  ],
  hipoteses: [
    {
      id: 'hip_abcd1234', criadaEm: '2026-09-25T12:00:00.000Z', autor: 'pedro', reelId: 'reel_abc123', insightId: 'ins_ganchoForma_pergunta',
      dimensao: 'ganchoForma', valor: 'pergunta', acao: 'usar', texto: 'Gancho de pergunta', previsao: { etapa: 'gancho' }, midiaId: ID1,
      status: 'aberta', veredito: null, reelTitulo: 'Quanto custa abrir MEI',
    },
    {
      id: 'hip_efgh5678', criadaEm: '2026-09-20T12:00:00.000Z', autor: 'pedro', reelId: 'x', insightId: 'ins_x', dimensao: 'cta', valor: 'salvar',
      acao: 'evitar', texto: 'CTA de salvar', previsao: { etapa: 'objetivo' }, midiaId: null, status: 'refutada',
      veredito: { em: '2026-09-28T12:00:00.000Z', score: -0.7, scoreEtapa: null, texto: 'Ficou abaixo da base. 1 peça é sinal, não prova.' }, reelTitulo: 'Peça antiga',
    },
  ],
  // resumoStories(): todos os dias da janela (n 0 nos sem story), pilar é o id e pilarNome o nome
  stories: {
    dias: [
      { dia: '2026-09-28', n: 1, views: 40, alcanceMax: 35, saidas: 2, respostas: null, cliques: null, menosDe5: 0, objetivo: null, pilar: 16, pilarNome: 'Bastidores do app' },
      { dia: '2026-09-29', n: 0, views: null, alcanceMax: null, saidas: null, respostas: null, cliques: null, menosDe5: 0, objetivo: null, pilar: null, pilarNome: null },
      { dia: '2026-09-30', n: 3, views: 120, alcanceMax: 98, saidas: 12, respostas: 'menos-de-5', cliques: null, menosDe5: 1, objetivo: null, pilar: 7, pilarNome: null },
    ],
    total: { n: 4, views: 160, alcanceMax: 98, saidas: 14, respostas: null, cliques: null },
  },
  ia: { atual: { midiaId: ID2, etapa: 'baixando', inicio: '2026-09-30T18:00:00.000Z' }, fila: 2, feitos: 1, erros: [] },
};

const codebook = [
  { id: 'ganchoForma', nome: 'Gancho: forma', grupo: 'mecanismo', etapa: 'gancho', aplica: 'peca', tipo: 'enum', valores: [] },
  { id: 'rostoInicio', nome: 'Rosto nos 3 primeiros segundos', grupo: 'mecanismo', etapa: 'gancho', aplica: 'peca', tipo: 'bool', valores: [] },
  { id: 'linha', nome: 'Linha editorial', grupo: 'contexto', etapa: null, aplica: 'nunca', tipo: 'enum', valores: [] },
];

// público do app como o detalhe manda depois de 30/09 (C3): só frases e grupos visíveis na tela; o digitado
// fica em "dados" (Sete Lagoas, 3%, é grupo pequeno: não pode aparecer fora do formulário)
const appPost = {
  fonte: 'app', em: '2026-09-30T13:00:00.000Z', autor: 'pedro', base: 'contas-alcancadas', baseTexto: 'contas alcançadas', contas: 900, n: 900, nDe: 'informado',
  frases: ['Das contas alcançadas (app): 64% mulheres e 35% homens.'], semFrase: null,
  visiveis: {
    genero: [{ id: 'F', rotulo: 'Mulheres', pct: 64 }, { id: 'M', pct: 35 }],
    idade: [{ faixa: '25-34', pct: 31 }, { faixa: '65+', pct: 6 }], cidades: [{ nome: 'Belo Horizonte', pct: 45 }], paises: [],
    seguidores: { seguidores: 20, naoSeguidores: 80 },
  },
  dados: {
    em: '2026-09-30T13:00:00.000Z', autor: 'pedro', base: 'contas-alcancadas', contas: 900, genero: { mulheres: 64, homens: 35 },
    idade: { '25-34': 31, '35-44': 22, '65+': 6 }, cidades: [{ nome: 'Belo Horizonte', pct: 45 }, { nome: 'Sete Lagoas', pct: 0.3 }], paises: [],
    seguidores: 20, naoSeguidores: 80,
  },
};

const detalhe = {
  // a escolha manual de anúncio vem nas tags da linha do post; o detalhe tira impulsionado da lista
  post: post({ tags: { ganchoForma: { valor: 'pergunta', fonte: 'ia' }, impulsionado: { valor: false, fonte: 'manual' } } }),
  midia: {
    midiaId: ID1, permalink: 'https://www.instagram.com/reel/ABC123/', thumb: 'https://scontent.cdninstagram.com/v/t51/1.jpg',
    video: 'https://scontent.cdninstagram.com/v/t50/1.mp4', caption: 'Quanto custa abrir um MEI em 2026?\n\nSalva pra ver depois.',
    timestamp: '2026-09-28T15:00:00+0000', tipo: 'REELS', audioTipo: 'ORIGINAL_SOUND', nSlides: null,
  },
  tags: [
    {
      dimensao: 'tipo', nome: 'Tipo (objetivo da peça)', grupo: 'fundamento', etapa: 'objetivo', valor: 'ensino', nomeValor: 'Ensino', fonte: 'cronograma',
      evidencias: [], opcoes: [{ id: 'viralizacao', nome: 'Viralização' }, { id: 'ensino', nome: 'Ensino' }], editavel: true,
    },
    {
      dimensao: 'ganchoForma', nome: 'Gancho: forma', grupo: 'mecanismo', etapa: 'gancho', valor: 'pergunta', nomeValor: 'Pergunta', fonte: 'ia',
      evidencias: [
        { tipo: 'fala', tempo: '0:00,5', texto: 'Quanto custa abrir um MEI?' },
        { tipo: 'quadro', tempo: '0:01', texto: 'Léo olhando pra câmera' },
        // texto livre da IA com endereço: nunca vira link
        { tipo: 'quadro', tempo: '0:02', texto: 'a tela mostra http://exemplo.com/boleto' },
      ],
      opcoes: [{ id: 'pergunta', nome: 'Pergunta' }, { id: 'afirmacao', nome: 'Afirmação' }], editavel: true,
    },
    { dimensao: 'rostoInicio', nome: 'Rosto nos 3 primeiros segundos', grupo: 'mecanismo', etapa: 'gancho', valor: true, nomeValor: null, fonte: 'manual', evidencias: [], opcoes: [], editavel: true },
    {
      dimensao: 'gatilho', nome: 'Gatilho emocional', grupo: 'mecanismo', etapa: 'qualidade', valor: null, nomeValor: null, fonte: null, evidencias: [],
      opcoes: [{ id: 'surpresa-fato', nome: 'Surpresa com fato' }], editavel: true,
    },
    { dimensao: 'duracaoFaixa', nome: 'Duração', grupo: 'mecanismo', etapa: 'retencao', valor: '31-45', nomeValor: '31 a 45s', fonte: 'calculado', evidencias: [], opcoes: [], editavel: false },
  ],
  efeitosDasTags: [resumo.efeitos[0]],
  vinculo: {
    reelId: 'reel_abc123', reelTitulo: 'Quanto custa abrir MEI', dia: '2026-09-28', por: 'permalink', sugestao: null,
    opcoes: [{ id: 'reel_abc123', titulo: 'Quanto custa abrir MEI', dia: '2026-09-28', peca: 'reel' }, { id: 'reel_xyz789', titulo: 'Carrossel do DAS', dia: '2026-09-29', peca: 'carrossel' }],
  },
  manual: { follows: 4, profileVisits: null, bioLinkClicks: null, cadastros: 2, em: '2026-09-29T12:00:00.000Z', autor: 'pedro' },
  publico: {
    pago: {
      em: '2026-09-30T12:00:00.000Z', anuncios: ['120200000000001', '120200000000002'], gasto: 150, alcance: 1234, impressoes: 2000,
      frases: ['No alcance pago (1.234 contas, R$ 150,00): 72% mulheres e 28% homens.'],
    },
    app: appPost,
  },
  hipoteses: [resumo.hipoteses[0]],
  ia: { status: 'ok', em: '2026-09-29T10:00:00.000Z', mensagem: null, descartadas: 2 }, iaRodando: false,
  analiseVideo: { existe: true, podeAnalisar: true },
};

const detalheVazio = {
  post: postVazio,
  midia: { midiaId: ID2, permalink: null, thumb: null, video: null, caption: '', timestamp: '2026-09-29T21:00:00+0000', tipo: 'CAROUSEL_ALBUM', audioTipo: null, nSlides: 4 },
  tags: [], efeitosDasTags: [],
  vinculo: { reelId: null, reelTitulo: null, dia: null, por: null, sugestao: { reelId: 'reel_xyz789', reelTitulo: 'Carrossel do DAS', score: 0.8, motivo: 'mesmo dia' }, opcoes: [] },
  manual: null, publico: { pago: null, app: null }, hipoteses: [], ia: null, iaRodando: false,
  analiseVideo: { existe: false, podeAnalisar: false },
};

// ── testes ──
test('aba completa desenha todas as seções sem travessão', () => {
  const html = dg.abaHtml(resumo, { ordem: 'recentes', mostrar: 20, codebook, vinculando: new Set(), loteIniciando: false });
  limpo(html, 'aba');
  for (const t of ['Metas 2× por tipo', 'Pendências', 'O que os números mostram', 'Pilares e mecanismos', 'Peças', 'Hipóteses em teste', 'Stories dos últimos 14 dias']) {
    assert.ok(html.includes(t), `falta a seção ${t}`);
  }
  // ordem da tela (§5.3)
  const pos = ['dg-t-metas', 'dg-t-pendencias', 'dg-t-insights', 'dg-t-mecanismos', 'dg-t-pecas', 'dg-t-hipoteses', 'dg-t-stories'].map((id) => html.indexOf(`id="${id}"`));
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
  assert.ok(html.includes('Fazer mais') && html.includes('No planejamento'));
  assert.ok(html.includes('Gancho: forma'), 'nome da dimensão vem do codebook');
  assert.ok(html.includes('data-dg-vincular="17900000000000002"'), 'sugestão de vínculo com 1 clique');
  assert.ok(!html.includes('data-dg-vincular="abc"'), 'id ruim não vira botão');
  assert.ok(html.includes('href="#/instagram/metricas/publico"'), 'Conectar anúncios leva pra aba Público');
  assert.ok(html.includes('data-dg-ir="numeros"'), 'números do app abre o painel no formulário');
  assert.ok(html.includes('Etiquetando: 1 de 4'), 'andamento do lote');
  assert.ok(html.includes('50%') && html.includes('1 de 2 peças'), 'taxa de acerto de 0 a 100, com o N');
  assert.ok(html.includes('parece a peça <b>Carrossel do DAS</b> de 30/09'), 'data da peça é a do cronograma (reelDia)');
  assert.ok(html.includes('menos de 5'), 'story com menos de 5 pessoas');
  assert.ok(!html.includes('class="dg-agenda"'), 'agenda sem falha não mostra aviso');
});

test('estados da aba: carregando, erro, desconectado, sem posts, sem base e atualizando', () => {
  const carregando = dg.abaHtml(null, {});
  limpo(carregando, 'carregando');
  assert.ok(carregando.includes('Lendo o diagnóstico'));

  const erro = dg.abaHtml(null, { erro: 'Servidor fora do ar' });
  limpo(erro, 'erro');
  assert.ok(erro.includes('Tentar de novo') && erro.includes('Servidor fora do ar'));

  const desconectado = dg.abaHtml({ conectado: false, posts: [], pendencias: [{ id: 'conectar', texto: 'Instagram não conectado', n: null }] }, {});
  limpo(desconectado, 'desconectado');
  assert.ok(desconectado.includes('Instagram não conectado'));
  assert.ok(desconectado.includes('href="#/instagram/metricas"'), 'aponta pra Visão geral');

  const semPosts = dg.abaHtml({ conectado: true, posts: [] }, {});
  limpo(semPosts, 'sem posts');
  assert.ok(semPosts.includes('Nenhum post lido ainda'));

  const semBase = dg.metasHtml({ metas: [{ tipo: 'ensino', rotuloTipo: 'Ensino', formato: null, rotuloFormato: null, objetivo: { id: 'salvamentos', rotulo: 'Salvamentos' }, base: null, baseN: 0, baseDe: null, meta: null, ultima: null }], numeros: {} });
  limpo(semBase, 'sem base');
  assert.ok(semBase.includes('ainda sem base') && semBase.includes('Ainda sem base'));
  assert.ok(semBase.includes('Nenhuma peça de Ensino publicada ainda'));
  assert.ok(semBase.includes('sem dado'), 'KPI sem número mostra sem dado');

  const atualizando = dg.abaHtml(resumo, { carregando: true, codebook });
  limpo(atualizando, 'atualizando');
  assert.ok(atualizando.includes('aria-busy="true"') && atualizando.includes('Atualizando'));

  const falhouDeNovo = dg.abaHtml(resumo, { erro: 'Caiu a conexão', codebook });
  limpo(falhouDeNovo, 'erro com dado antigo');
  assert.ok(falhouDeNovo.includes('Caiu a conexão') && falhouDeNovo.includes('Metas 2× por tipo'), 'o desenho anterior continua com o erro em cima');
});

test('metas: cartão por tipo e formato, medidor da última peça com a régua dela, meta da próxima em linha própria', () => {
  // o cenário do achado: 6 reels de Viralização (300 a 720). A última tinha base 350 e meta 700 e bateu; a
  // próxima já conta com ela (base 400, meta 800). O medidor não pode medir 720 contra 800
  const d = {
    metas: [{
      tipo: 'viralizacao', rotuloTipo: 'Viralização', formato: 'reel', rotuloFormato: 'Reels', objetivo: { id: 'alcance', rotulo: 'Alcance' },
      base: 400, baseN: 5, baseDe: 'tipo', meta: 800,
      ultima: { midiaId: ID1, valor: 720, score: Math.log2(720 / 350), bateuMeta: true, provisorio: false, base: 350, meta: 700 },
    }],
    posts: [post({ tipo: 'viralizacao' })], numeros: {},
  };
  const html = dg.metasHtml(d);
  limpo(html, 'metas');
  assert.match(html, /aria-label="Viralização, Reels: última peça, valor 720, base 350, meta 700"/, 'o medidor usa ultima.base e ultima.meta');
  assert.ok(!/última peça, valor 720, base 400/.test(html), 'a base da próxima não entra no medidor da última');
  const proxima = html.slice(html.indexOf('dg-meta-proxima'));
  assert.ok(proxima.includes('Meta da próxima peça') && proxima.includes('<b>800</b>') && proxima.includes('base 400, mediana das últimas 5'));
  assert.ok(html.includes('bateu 2×') && html.includes('Última peça, 28/09'));
  assert.ok(html.includes('>Reels<'), 'o formato aparece no cartão');
  assert.ok(html.includes('data-foco="meta:viralizacao:reel"'), 'foco por tipo e formato');
  // o resumo completo: cartões de reel, de feed (base de reels e posts juntos) e do tipo sem peça
  const aba = dg.metasHtml(resumo);
  limpo(aba, 'metas do resumo');
  assert.ok(aba.includes('Posts e carrosséis') && aba.includes('reels e posts juntos'));
  assert.ok(aba.includes('Nenhuma peça de Conexão publicada ainda'));
  assert.ok(aba.includes('Metas 2× por tipo e formato'));
  // provisória e sem valor: o selo diz, sem inventar número
  assert.ok(aba.includes('provisório') && aba.includes('data-meta="sem">sem dado'));
  // última peça com anúncio: o selo avisa (fica fora da base)
  const comAnuncio = dg.metasHtml({ ...d, metas: [{ ...d.metas[0], ultima: { ...d.metas[0].ultima, impulsionado: true } }] });
  assert.ok(comAnuncio.includes('teve anúncio'));
});

test('fator de quem não bateu é truncado: nunca "2×" ao lado de não bateu', () => {
  assert.equal(mc.vezesDaPeca(Math.log2(1.99), false), '1,9×');
  assert.equal(mc.vezesDaPeca(Math.log2(1.96), null), '1,9×');
  // 2,0002 acontece com valor quebrado aos 7 dias logo abaixo da meta arredondada pra cima
  assert.equal(mc.vezesDaPeca(Math.log2(2.0002), false), '1,9×');
  // o ponto flutuante de 2 ** log2(1,9) não pode derrubar pra 1,8
  assert.equal(mc.vezesDaPeca(Math.log2(1.9), false), '1,9×');
  assert.equal(mc.vezesDaPeca(Math.log2(0.64), false), '0,6×');
  assert.equal(mc.vezesDaPeca(Math.log2(0.05), false), '0,05×');
  assert.equal(mc.vezesDaPeca(Math.log2(2.5), null), '2,5×');
  assert.equal(mc.vezesDaPeca(Math.log2(2.06), true), '2,1×');
  assert.equal(mc.vezesDaPeca(null, false), 'sem dado');
  assert.match(mc.pillMeta(false, Math.log2(1.99)), />1,9× a base</);
  assert.ok(!mc.pillMeta(false, Math.log2(1.99)).includes('2×'));
  assert.match(mc.pillMeta(true, 1), /bateu 2×/);
  assert.match(mc.pillMeta(null, Math.log2(1.97)), />1,9× a base</);
  // a frase do achado: 1.047 contra a meta de 1.048 (base 523,7) sai "Ficou em 1,9×"
  const o = { id: 'alcance', rotulo: 'Alcance', valor: 1047, base: 523.7, meta: 1048, score: Math.log2(1047 / 523.7), bateuMeta: false, provisorio: false };
  const v = dg.vereditoTexto(o);
  assert.match(v, /^Ficou em 1,9× a base: 1\.047 contra a meta de 1\.048\.$/);
  assert.equal(dg.vereditoTexto({ ...o, valor: 1048, score: Math.log2(1048 / 523.7), bateuMeta: true }), 'Bateu a meta de 2×: 1.048 contra a meta de 1.048 (2× a base).');
  assert.match(dg.vereditoTexto({ ...o, valor: 600, score: Math.log2(600 / 523.7), bateuMeta: null, provisorio: true }), /^Por enquanto em 1,1× a base/);
  // a linha da peça
  const linha = dg.pecaHtml(post({ objetivo: { ...o, id: 'salvamentos', rotulo: 'Salvamentos' } }));
  limpo(linha, 'peça que não bateu');
  assert.ok(linha.includes('<b>1,9×</b>') && !linha.includes('<b>2×</b>'));
});

test('efeito sem grupo de comparação: sem barra, sem evidência e fora da escolha padrão', () => {
  // resposta antiga (nSem 0 com "evidência forte") e nova (semComparacao, efeito null): as duas saem iguais
  const efeitos = [
    { dimensao: 'linha', valor: 'anterior', nomeValor: 'Anterior', n: 5, nSem: 0, mediaCom: 0.9, mediaSem: null, efeito: 0.6, bruto: 0.9, consistencia: 1, etapa: null, evidencia: 'forte', midias: [ID1] },
    { dimensao: 'voz', valor: 'pedro', nomeValor: 'Pedro', n: 5, nSem: 0, mediaCom: 0.9, mediaSem: null, efeito: null, bruto: null, consistencia: null, etapa: 'qualidade', efeitoEtapa: null, evidencia: 'insuficiente', evidenciaEtapa: 'insuficiente', semComparacao: true, fatorCom: 1.9, midias: [ID1] },
    { dimensao: 'ganchoForma', valor: 'pergunta', nomeValor: 'Pergunta', n: 3, nSem: 4, mediaCom: 0.4, mediaSem: -0.1, efeito: 0.25, consistencia: 0.67, etapa: 'gancho', efeitoEtapa: null, evidencia: 'fraca', midias: [ID1] },
  ];
  const padrao = dg.mecanismosHtml({ efeitos }, { codebook });
  limpo(padrao, 'mecanismos padrão');
  assert.match(padrao, /<option value="ganchoForma" selected>/, 'abre na dimensão que tem comparação');
  const linha = dg.mecanismosHtml({ efeitos }, { codebook, dimensao: 'linha' });
  limpo(linha, 'sem comparação');
  assert.ok(linha.includes('Todas as 5 peças têm esse valor: sem comparação.'));
  assert.ok(!linha.includes('evidência forte') && !linha.includes('class="mc-div"'), 'nada de evidência nem barra de efeito');
  assert.ok(!visivel(linha).includes('efeito 1,5×'));
  const voz = dg.mecanismosHtml({ efeitos }, { codebook, dimensao: 'voz' });
  limpo(voz, 'sem comparação (nova)');
  assert.ok(voz.includes('Todas as 5 peças têm esse valor: sem comparação.') && voz.includes('data-sem-comparacao'));
  // só uma peça
  const uma = dg.mecanismosHtml({ efeitos: [{ ...efeitos[1], n: 1 }] }, { codebook });
  assert.ok(uma.includes('Só uma peça tem esse dado: sem comparação.'));
  // no painel, a etiqueta com efeito sem comparação não mostra efeito
  const det = { ...detalhe, efeitosDasTags: [{ ...efeitos[1], dimensao: 'ganchoForma', valor: 'pergunta', efeito: 0.6, evidencia: 'forte' }] };
  assert.ok(!dg.regiaoHtml('mecanismos', det, {}).includes('dg-tag-efeito'));
});

test('textos: sem causa, sem jargão e sem "score" na tela', () => {
  const mec = dg.mecanismosHtml(resumo, { codebook });
  limpo(mec, 'mecanismos');
  assert.ok(mec.includes('Como ficaram as peças com cada valor, contra as peças sem ele. É sinal, não causa; com poucas peças o número é puxado pro meio.'));
  assert.ok(!mec.includes('muda o resultado') && !mec.includes('descontado o N'));
  assert.ok(mec.includes('ajustado pelo número pequeno de peças'), 'a dica da barra sem jargão');
  assert.ok(mec.includes('4 peças contra 6'), 'os dois lados da comparação');
  // a etapa na unidade dela (o valor cru do servidor), nunca 2 elevado a 52
  assert.ok(mec.includes('Na etapa Gancho (0 a 3s): 52% com, 38% sem (efeito 1,2×).'));
  const aba = dg.abaHtml(resumo, { codebook });
  assert.doesNotMatch(visivel(aba), /\bscore\b/i, '"score" não aparece na tela');
  assert.ok(aba.includes('Mais acima da base') && aba.includes('mediana contra a base em 30 dias (1× = a base)'));
  // idade "7d" do servidor vira a nota da mesma idade
  assert.ok(dg.notasObjetivo({ idadeRef: '7d', base: 10, baseN: 5, baseDe: 'tipo' }).includes('Comparado na mesma idade: 7 dias depois de publicar.'));
  assert.ok(dg.notasObjetivo({ idadeRef: 'atual', provisorio: false }).includes('Valor atual'));
  // peças provisórias separadas no número da conta (C5): a frase do servidor, ou a conta dita aqui
  assert.ok(dg.metasHtml({ metas: [], numeros: { provisorias30d: 2 } }).includes('2 peças ainda têm menos de 7 dias'));
  const fraseServidor = '1 peça ainda tem menos de 7 dias e 1 peça tem número de antes dos 7 dias (informe ou sincronize de novo): ficam fora da taxa de acerto e da mediana até o número fechar.';
  const comFrase = dg.metasHtml({ metas: [], numeros: { provisorias30d: 2, fraseProvisorias: fraseServidor } });
  assert.ok(comFrase.includes(fraseServidor) && !comFrase.includes('até completarem 7 dias'));
});

test('números do app de Vendas informados antes dos 7 dias: pede de novo em vez de "menos de 7 dias no ar"', () => {
  const o = postVendasVelho.objetivo;
  const nota = dg.notasObjetivo(o, { idadeH: 1200, diasInformado: 3 });
  assert.ok(nota.includes('Números do app informados com 3 dias de post: informe de novo pra fechar a meta.'));
  assert.ok(!nota.includes('menos de 7 dias no ar'));
  assert.ok(dg.notasObjetivo(o, { idadeH: 1200 }).includes('informados antes dos 7 dias'));
  // peça nova de verdade continua "menos de 7 dias no ar"
  assert.ok(dg.notasObjetivo({ ...o, fonte: 'api' }, { idadeH: 50 }).includes('Provisório: menos de 7 dias no ar.'));
  // a linha e o painel
  const linha = dg.pecaHtml(postVendasVelho);
  limpo(linha, 'peça de Vendas velha');
  assert.ok(linha.includes('Números do app informados antes dos 7 dias: informe de novo pra fechar a meta'));
  const det = { ...detalhe, post: postVendasVelho, manual: { follows: 12, profileVisits: null, bioLinkClicks: null, cadastros: null, em: '2026-08-14T12:00:00.000Z', autor: 'pedro' } };
  const meta = dg.regiaoHtml('meta', det, {});
  limpo(meta, 'meta de Vendas velha');
  assert.ok(meta.includes('com 3 dias de post') && meta.includes('Atualizar os números do app'));
  const numeros = dg.regiaoHtml('numeros', det, {});
  assert.ok(numeros.includes('Os números salvos foram informados com 3 dias de post'));
  // post novo: diz até quando o número fica provisório
  assert.match(dg.avisoSeteDias(post({ idadeH: 50 }), null), /^Informado antes de 05\/10 \(7 dias do post\)/);
  // a pendência lista o reel velho com "Atualizar"
  const pend = dg.pendenciasHtml({ posts: [postVendas, postVendasVelho], pendencias: [{ id: 'numeros-app', texto: 'Reels de Vendas sem os números do app', n: 2 }] });
  limpo(pend, 'pendência de números');
  assert.ok(pend.includes('Atualizar números do app: 11/08') && pend.includes('Informar números do app: 27/09'));
});

test('número ausente vira "sem dado" na peça, no painel e nos stories', () => {
  const peca = dg.pecaHtml(postVazio);
  limpo(peca, 'peça vazia');
  assert.ok(peca.includes('sem dado') || peca.includes('ainda sem base'));
  assert.ok(peca.includes('mc-medidor-vazio'), 'medidor sem nenhum número');

  const painel = dg.painelHtml(detalheVazio, { salvando: new Set(), temAnalise: true });
  limpo(painel, 'painel vazio');
  assert.ok(painel.includes('sem dado'));
  assert.ok(painel.includes('Sem dado de público deste post'));
  assert.ok(!painel.includes('data-dg-analise'), 'sem vídeo pra analisar, sem botão');

  const stories = dg.storiesHtml(resumo);
  limpo(stories, 'stories');
  assert.ok(stories.includes('sem dado'));
  assert.ok(stories.indexOf('30/09') < stories.indexOf('28/09'), 'dia mais novo primeiro');
});

test('stories: só dias com story, nome do pilar, "menos de 5" e o vazio de verdade', () => {
  const html = dg.storiesHtml(resumo);
  limpo(html, 'stories');
  assert.ok(!html.includes('29/09'), 'dia sem story não vira linha');
  assert.ok(html.includes('<td>Bastidores do app</td>'), 'pilar pelo nome');
  assert.ok(html.includes('<td>pilar 7</td>'), 'sem nome, o número com a palavra');
  assert.ok(!html.includes('<td>16</td>'));
  // dia só com story abaixo de 5 pessoas: "menos de 5" (5 por story), não "sem dado"
  const so5 = dg.storiesHtml({ stories: { dias: [
    { dia: '2026-09-30', n: 1, views: null, alcanceMax: null, saidas: null, respostas: null, cliques: null, menosDe5: 1, pilar: null, pilarNome: null },
    { dia: '2026-09-29', n: 2, views: null, alcanceMax: null, saidas: null, respostas: null, cliques: null, menosDe5: 2, pilar: null, pilarNome: null },
  ], total: { n: 3, views: null } } });
  limpo(so5, 'stories com menos de 5');
  assert.match(so5, /<td class="num">1<\/td><td class="num">menos de 5<\/td>/);
  assert.match(so5, /<td class="num">2<\/td><td class="num">menos de 10<\/td>/);
  assert.match(so5, /<th scope="row">Total<\/th>\s*<td class="num">3<\/td><td class="num">menos de 15<\/td>/);
  // 14 dias sem captura: o vazio aparece (antes eram 14 linhas de 0)
  const dias = Array.from({ length: 14 }, (_, i) => ({ dia: `2026-09-${String(17 + i).padStart(2, '0')}`, n: 0, views: null, alcanceMax: null, saidas: null, respostas: null, cliques: null, menosDe5: 0, pilar: null, pilarNome: null }));
  const vazio = dg.storiesHtml({ stories: { dias, total: { n: 0 } } });
  limpo(vazio, 'stories vazios');
  assert.ok(vazio.includes('Sem story lido nos últimos 14 dias') && !vazio.includes('<table'));
  // captura quebrada não parece "não teve story"
  const quebrada = dg.storiesHtml({ stories: { dias, total: { n: 0 } }, agenda: { ultimas: { stories: { em: '2026-09-30T18:00:00.000Z', ok: false, erro: 'A Meta recusou a permissão.' } } } });
  limpo(quebrada, 'stories com captura quebrada');
  assert.ok(quebrada.includes('A última captura dos stories falhou em 30/09 às 15:00: A Meta recusou a permissão.'));
  assert.ok(quebrada.includes('a captura está falhando'));
});

test('falha da leitura automática: aviso com a tarefa, quando e "Tentar agora"', () => {
  const agora = Date.parse('2026-09-30T19:00:00.000Z');
  const agenda = {
    ligada: true,
    ultimas: {
      sincronizar: { em: '2026-09-30T17:00:00.000Z', ok: true },
      stories: { em: '2026-09-30T18:00:00.000Z', ok: false, erro: 'A Meta recusou a permissão de stories.' },
    },
    erros: [
      { em: '2026-09-30T18:00:00.000Z', tarefa: 'stories', msg: 'A Meta recusou a permissão de stories.' },
      { em: '2026-09-10T18:00:00.000Z', tarefa: 'publico', msg: 'erro antigo' },
    ],
    tarefas: [{ id: 'stories', rotulo: 'Capturar os stories', quando: 'a cada hora' }],
  };
  const html = dg.agendaErrosHtml(agenda, {}, agora);
  limpo(html, 'aviso da agenda');
  assert.ok(html.includes('<details class="dg-agenda" data-falha="sim">'), 'fechado por padrão');
  assert.ok(html.includes('A leitura automática falhou: capturar os stories'));
  assert.ok(html.includes('<b>Capturar os stories</b>: falhou em 30/09 às 15:00. A Meta recusou a permissão de stories.'));
  assert.ok(html.includes('data-dg-agenda="stories"') && html.includes('Tentar agora'));
  assert.ok(!html.includes('erro antigo'), 'erro de mais de 7 dias fica de fora');
  assert.ok(dg.agendaErrosHtml(agenda, { agendaAberta: true }, agora).includes('data-falha="sim" open'), 'aberto atravessa o redesenho');
  const rodando = dg.agendaErrosHtml(agenda, { agendaRodando: 'stories' }, agora);
  assert.ok(rodando.includes('Rodando…') && rodando.includes('aria-busy="true"'));
  // tudo certo e nenhum erro recente: nada
  assert.equal(dg.agendaErrosHtml({ ultimas: { stories: { ok: true } }, erros: [] }, {}, agora), '');
  // voltou a dar certo, mas errou hoje: aviso calmo, sem botão
  const calmo = dg.agendaErrosHtml({ ultimas: { stories: { em: '2026-09-30T18:30:00.000Z', ok: true } }, erros: agenda.erros }, {}, agora);
  assert.ok(calmo.includes('data-falha="nao"') && calmo.includes('Erros recentes') && !calmo.includes('Tentar agora'));
  // entra na aba, acima do corpo
  const aba = dg.abaHtml({ ...resumo, agenda: { ...agenda, erros: [agenda.erros[0]] } }, { codebook });
  assert.ok(aba.includes('class="dg-agenda"') && aba.indexOf('dg-agenda') < aba.indexOf('dg-t-metas'));
});

test('painel do post: regiões na ordem do SPEC, sem travessão', () => {
  const html = dg.painelHtml(detalhe, { salvando: new Set(), temAnalise: true, editandoPublico: false });
  limpo(html, 'painel');
  const regioes = ['cab', 'vinculo', 'meta', 'porque', 'funil', 'mecanismos', 'ia', 'numeros', 'publico', 'print', 'pubform', 'anuncio', 'hipoteses'];
  const pos = regioes.map((r) => html.indexOf(`data-regiao="${r}"`));
  assert.ok(pos.every((x) => x >= 0), 'falta região');
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
  for (const t of ['Por que foi bem', 'Por que foi mal', 'Funil contra a base', 'Mecanismos', 'Etiquetar de novo com IA', 'Números do app', 'Público do post', 'Teve anúncio', 'Ver a análise do vídeo', 'Abrir no Instagram']) {
    assert.ok(html.includes(t), `falta ${t}`);
  }
  assert.ok(html.includes('aria-live="polite"'), 'andamento da IA e do print avisa o leitor de tela');
  assert.ok(html.includes('data-dg-anuncio="nao" data-foco="an:nao" aria-pressed="true"'), 'anúncio marcado à mão');
  assert.ok(html.includes('Evidência da IA'), 'evidência no botão i');
  assert.ok(html.includes('value="4"'), 'número do app já informado');

  const carregando = dg.painelHtml(null, { id: ID1 });
  limpo(carregando, 'painel carregando');
  assert.ok(carregando.includes('Lendo o post'));
  const erro = dg.painelHtml(null, { id: ID1, erro: 'Não achei esse post' });
  limpo(erro, 'painel com erro');
  assert.ok(erro.includes('Não consegui abrir este post') && erro.includes('Tentar de novo'));
});

test('evidência da IA: texto puro, id fixo e região estável entre dois desenhos', () => {
  const um = dg.regiaoHtml('mecanismos', detalhe, { salvando: new Set() });
  const dois = dg.regiaoHtml('mecanismos', detalhe, { salvando: new Set() });
  limpo(um, 'mecanismos do post');
  assert.equal(um, dois, 'o mesmo detalhe desenha o mesmo HTML (o balão aberto não fecha a cada 3 s)');
  assert.ok(!/\bpop-\d+\b/.test(um), 'sem o id que muda a cada desenho');
  assert.ok(um.includes('data-pop="dg-ev-ganchoForma"') && um.includes('id="dg-ev-ganchoForma"'));
  assert.ok(um.includes('data-foco="ev:ganchoForma"'), 'o foco volta pro "i" quando a região muda');
  assert.ok(!um.includes('<a '), 'endereço no texto da IA não vira link');
  assert.ok(um.includes('quadro 0:02: a tela mostra http://exemplo.com/boleto'));
  const bal = dg.botaoEvidencias(['veja <script>x</script> em https://exemplo.com'], 'ganchoForma', 'Evidência da IA: Gancho');
  assert.ok(bal.includes('&lt;script&gt;') && !bal.includes('<a '));
  assert.equal(dg.botaoEvidencias([], 'x', 'y'), '');
});

test('vínculo: o seletor só escolhe e o botão grava', () => {
  const parado = dg.regiaoHtml('vinculo', detalhe, {});
  limpo(parado, 'vínculo');
  assert.match(parado, /data-dg-p-vinculo-salvar data-foco="pv:salvar" aria-disabled="true">Salvar vínculo</);
  const escolhido = dg.regiaoHtml('vinculo', detalhe, { vinculoEscolha: 'reel_xyz789' });
  limpo(escolhido, 'vínculo escolhido');
  assert.match(escolhido, /<option value="reel_xyz789" selected>/);
  assert.match(escolhido, /class="btn btn-sm btn-primario" data-dg-p-vinculo-salvar data-foco="pv:salvar">Salvar vínculo</);
  assert.ok(escolhido.includes('só depois de Salvar vínculo'));
  // "sem peça" também é escolha, e escolha que não existe volta pra atual
  assert.match(dg.regiaoHtml('vinculo', detalhe, { vinculoEscolha: '' }), /<option value="" selected>Sem peça vinculada/);
  assert.match(dg.regiaoHtml('vinculo', detalhe, { vinculoEscolha: 'reel_naoexiste' }), /<option value="reel_abc123" selected>/);
  const salvando = dg.regiaoHtml('vinculo', detalhe, { salvando: new Set(['vinculo']) });
  assert.ok(salvando.includes('Salvando…') && salvando.includes('disabled'));
});

test('público do post: só frases e grupos visíveis; o digitado só volta no formulário', () => {
  const bloco = dg.regiaoHtml('publico', detalhe, { salvando: new Set() });
  limpo(bloco, 'público do post');
  assert.ok(bloco.includes('Das contas alcançadas (app): 64% mulheres e 35% homens.'));
  assert.ok(bloco.includes('Ver os grupos com 5 pessoas ou mais') && bloco.includes('Belo Horizonte'));
  assert.ok(bloco.includes('65 ou mais') && bloco.includes('Não seguiam'));
  assert.ok(!bloco.includes('Sete Lagoas') && !bloco.includes('35 a 44'), 'grupo pequeno digitado não aparece fora do formulário');
  assert.ok(bloco.includes('Base: contas alcançadas · 900 contas (o número da tela do app)'), 'a base em pessoas da regra de 5');
  assert.deepEqual(dg.linhasVisiveis(appPost.visiveis).map((l) => l[1]), ['Mulheres', 'Homens', '25 a 34', '65 ou mais', 'Belo Horizonte', 'Já seguiam', 'Não seguiam']);
  assert.deepEqual(dg.linhasVisiveis(null), []);
  // sem frase e sem grupo visível: o aviso, nunca o percentual cru (resposta antiga, sem "visiveis")
  const cru = dg.regiaoHtml('publico', { ...detalhe, publico: { pago: null, app: { ...appPost.dados, frases: [] } } }, {});
  limpo(cru, 'público sem frase');
  assert.ok(cru.includes('Sem frase: nenhum grupo com 5 pessoas ou mais'));
  assert.ok(!cru.includes('64') && !cru.includes('Sete Lagoas'));
  // sem saber quantas contas a tela mede: o servidor diz o porquê e a tela repete
  const semN = { ...appPost, n: null, nDe: null, frases: [], visiveis: { genero: [], idade: [], cidades: [], paises: [], seguidores: null }, semFrase: 'Sem frase: falta saber quantas contas a tela mede. Informe as contas na base no formulário.' };
  const semNHtml = dg.regiaoHtml('publico', { ...detalhe, publico: { pago: null, app: semN } }, {});
  limpo(semNHtml, 'público sem n');
  assert.ok(semNHtml.includes('falta saber quantas contas a tela mede') && !semNHtml.includes('Ver os grupos'));
  // o formulário pré-preenche com "dados" (e com a leitura do print, quando há)
  const form = dg.regiaoHtml('pubform', detalhe, { editandoPublico: true, salvando: new Set() });
  limpo(form, 'formulário com dados');
  assert.ok(form.includes('value="Sete Lagoas"') && form.includes('value="0,3"'));
  assert.match(form, /<option value="contas-alcancadas" selected>Contas alcançadas<\/option>/);
  assert.match(form, /name="contas" value="900"/);
  assert.ok(form.includes('Contas na base (o número que a tela mostra, se aparecer)'));
  assert.ok(form.includes('Percentual do país 1') && form.includes('Percentual da cidade 1'));
});

test('formulário do público: base obrigatória, contas na base e leitura do print', () => {
  const sugestao = { base: 'visualizacoes', genero: { mulheres: 70.5, homens: 29.5 }, idade: { '18-24': 12, '25-34': 40 }, cidades: [{ nome: 'Contagem', pct: 8 }], paises: [{ nome: 'Brasil', pct: 99 }], seguidores: 10, naoSeguidores: 90, contas: 1234 };
  const form = dg.regiaoHtml('pubform', detalhe, { editandoPublico: true, sugestao, salvando: new Set() });
  limpo(form, 'formulário do público');
  assert.ok(form.includes('Números lidos do print'));
  assert.ok(form.includes('value="70,5"') && form.includes('Contagem') && form.includes('value="1234"'));
  assert.ok(form.includes('25 a 34') && form.includes('65 ou mais'), 'faixa de idade no texto é "25 a 34"');
  // sem base na leitura: "Escolha", nunca "Visualizações" presumido; o nome é o mesmo da aba Público
  const semBase = dg.publicoFormHtml(null, { genero: { mulheres: 60 } }, { salvando: new Set() });
  assert.match(semBase, /<option value="" selected>Escolha<\/option>/);
  assert.ok(semBase.includes('>Contas com engajamento<') && !semBase.includes('Contas engajadas'));

  assert.equal(dg.regiaoHtml('pubform', detalhe, { editandoPublico: false }), '');
  const lendo = dg.regiaoHtml('print', detalhe, { leitura: { etapa: 'lendo' } });
  assert.ok(lendo.includes('Lendo o print'));
  const tentando = dg.printEstadoHtml({ etapa: 'lendo' }, { falhasPrint: 1 });
  assert.ok(tentando.includes('tentando de novo'));
  const pronto = dg.regiaoHtml('print', detalhe, { leitura: { etapa: 'ok', sugestao } });
  assert.ok(pronto.includes('nada foi salvo ainda'));
  const falhou = dg.regiaoHtml('print', detalhe, { leitura: { erro: 'soma deu 130%' } });
  assert.ok(falhou.includes('soma deu 130%'));
  // a sugestão pode vir aninhada, com avisos; vazia não vira formulário
  const aninhada = dg.regiaoHtml('print', detalhe, { leitura: { etapa: 'pronto', sugestao: { sugestao, avisos: ['Não deu pra ver a base.'], vazio: false } } });
  assert.ok(aninhada.includes('nada foi salvo ainda') && aninhada.includes('Não deu pra ver a base.'));
  const semNumero = dg.regiaoHtml('print', detalhe, { leitura: { etapa: 'pronto', sugestao: { sugestao: {}, avisos: [], vazio: true } } });
  assert.ok(semNumero.includes('Não achei números de público'));
  // leitura pronta que não entrou no formulário: só com o clique (digitando ou reabrindo o painel)
  const digitando = dg.printEstadoHtml({ etapa: 'pronto', sugestao }, { sugestaoPendente: sugestao });
  assert.ok(digitando.includes('Você já tinha começado a digitar') && digitando.includes('data-dg-print-usar'));
  const retomada = dg.printEstadoHtml({ etapa: 'pronto', sugestao, fim: '2026-09-30T13:30:00.000Z' }, { sugestaoPendente: sugestao, printRetomado: true });
  assert.ok(retomada.includes('Tem uma leitura de print pronta deste post (30/09 às 10:30)') && retomada.includes('Usar os números lidos'));
  limpo(lendo + tentando + pronto + falhou + aninhada + semNumero + digitando + retomada, 'print');
});

test('validação do público do app (pura)', () => {
  const ok = dg.validarPublico({
    base: 'contas-engajadas', contas: '1.234',
    pcts: [{ campo: 'genero', chave: 'mulheres', valor: '64,5' }, { campo: 'idade', chave: '25-34', valor: '31%' }, { campo: 'seguidores', chave: 'seguidores', valor: '' }],
    lugares: [{ tipo: 'cidades', nome: 'Belo Horizonte', pct: '45' }, { tipo: 'paises', nome: '', pct: '' }],
  });
  assert.deepEqual(ok, { dados: { base: 'contas-engajadas', contas: 1234, genero: { mulheres: 64.5 }, idade: { '25-34': 31 }, cidades: [{ nome: 'Belo Horizonte', pct: 45 }], paises: [] } });
  assert.equal(dg.validarPublico({ base: '', pcts: [{ campo: 'genero', chave: 'mulheres', valor: '60' }] }).onde, 'base');
  assert.match(dg.validarPublico({ base: '' }).erro, /^Diga de onde são os percentuais/);
  assert.equal(dg.validarPublico({ base: 'visualizacoes', contas: 'muitas' }).onde, 'contas');
  assert.equal(dg.validarPublico({ base: 'visualizacoes', contas: '0' }).onde, 'contas');
  assert.ok(!('contas' in dg.validarPublico({ base: 'visualizacoes', contas: '', pcts: [{ campo: 'genero', chave: 'homens', valor: '40' }] }).dados));
  assert.deepEqual(dg.validarPublico({ base: 'visualizacoes', pcts: [{ campo: 'idade', chave: '18-24', valor: '120' }] }).onde, ['pct', 0]);
  assert.deepEqual(dg.validarPublico({ base: 'visualizacoes', lugares: [{ tipo: 'cidades', nome: 'Contagem', pct: '' }] }).onde, ['lugarPct', 0]);
  assert.match(dg.validarPublico({ base: 'visualizacoes', pcts: [{ campo: 'genero', chave: 'mulheres', valor: '70' }, { campo: 'genero', chave: 'homens', valor: '40' }] }).erro, /soma passou/);
  assert.match(dg.validarPublico({ base: 'visualizacoes' }).erro, /pelo menos um número/);
});

test('print: o corpo é medido como chega no servidor (12 MiB, 4 MiB por imagem)', () => {
  assert.equal(dg.PRINT_MAX_CORPO, 12 * 1024 * 1024);
  assert.equal(dg.PRINT_MAX_IMAGEM, 4 * 1024 * 1024);
  const img = 'data:image/png;base64,AAAA';
  assert.equal(dg.tamanhoCorpoPrint([img]), JSON.stringify({ imagens: [img] }).length);
  const grande = 'x'.repeat(4_200_000);
  assert.ok(dg.tamanhoCorpoPrint([grande, grande, grande]) > dg.PRINT_MAX_CORPO);
  const cabe = 'x'.repeat(4_000_000);
  assert.ok(dg.tamanhoCorpoPrint([cabe, cabe, cabe]) <= dg.PRINT_MAX_CORPO);
});

test('IA do post na fila, anúncio automático e manual', () => {
  const naFila = dg.regiaoHtml('ia', detalhe, { iaNaFila: true });
  limpo(naFila, 'IA na fila');
  assert.ok(naFila.includes('Na fila da IA') && naFila.includes('aria-disabled="true"'));
  const rodando = dg.regiaoHtml('ia', { ...detalhe, iaRodando: true }, {});
  assert.ok(rodando.includes('Etiquetando com IA'));
  const semLogin = dg.regiaoHtml('ia', { ...detalhe, ia: { status: 'sem-login', em: null, mensagem: 'Rode claude login.', descartadas: null } }, {});
  assert.ok(semLogin.includes('login do Claude') && semLogin.includes('dg-erro-txt'));

  const manual = dg.regiaoHtml('anuncio', detalhe, {});
  assert.ok(manual.includes('data-dg-anuncio="nao" data-foco="an:nao" aria-pressed="true"') && manual.includes('Marcado à mão'));
  const auto = dg.regiaoHtml('anuncio', { ...detalhe, post: post({ impulsionado: true, tags: { impulsionado: { valor: true, fonte: 'calculado' } } }) }, {});
  limpo(auto, 'anúncio automático');
  assert.ok(auto.includes('data-dg-anuncio="auto" data-foco="an:auto" aria-pressed="true"') && auto.includes('anúncio ligado'));
});

test('texto de fora sai escapado e sem travessão; peças ordenam pelo fator contra a base', () => {
  const sujo = post({ midiaId: '17900000000000009', legenda1: `MEI ${EM} <script>alert(1)</script> "quanto" custa`, pilarNome: `Pilar ${EM} teste` });
  const html = dg.pecaHtml(sujo);
  limpo(html, 'peça com legenda suja');
  assert.ok(!html.includes('<script>') && html.includes('&lt;script&gt;'));

  const lista = dg.pecasHtml({ posts: [postVazio, post(), postVendas] }, { ordem: 'score' });
  limpo(lista, 'peças por score');
  assert.ok(lista.indexOf(`data-dg-linha="${ID1}"`) < lista.indexOf(`data-dg-linha="${ID2}"`), 'maior fator primeiro');
  assert.ok(lista.includes('aria-pressed="true">Mais acima da base'));
  assert.ok(lista.includes('gargalo: Retenção') && lista.includes('forte: Distribuição'));

  const hip = dg.hipotesesHtml(resumo);
  limpo(hip, 'hipóteses');
  assert.ok(hip.includes('href="#/reel/reel_abc123"') && !hip.includes('href="#/reel/x"'), 'só reelId válido vira link');
  assert.ok(hip.indexOf('em teste') < hip.indexOf('refutada'), 'aberta primeiro');
});

test('lote de etiquetagem: parado, rodando, começando e o porquê do erro', () => {
  const rodando = dg.loteEstadoHtml(resumo.ia);
  limpo(rodando, 'lote rodando');
  assert.ok(rodando.includes('role="progressbar"') && rodando.includes('aria-valuenow="1"'));
  const parado = dg.loteEstadoHtml(null);
  limpo(parado, 'lote parado');
  assert.ok(parado.includes('A IA olha'));
  // estadoIa(): feitos conta todos os que passaram pela fila; ok, só os que deram certo
  const fimIa = { atual: null, fila: 0, feitos: 5, ok: 4, erros: [{ midiaId: ID2, status: 'erro', mensagem: 'O vídeo não baixou.' }], rodando: false };
  const fim = dg.loteEstadoHtml(fimIa);
  limpo(fim, 'lote terminado');
  assert.ok(fim.includes('4 posts etiquetados') && fim.includes('1 com erro'));
  assert.ok(fim.includes('Último erro: O vídeo não baixou.'), 'a mensagem do erro aparece');
  assert.equal(dg.toastFimLote(fimIa), 'A etiquetagem com IA terminou com 1 post com erro: O vídeo não baixou.');
  // sem login do Claude: a fila para, o resto fica de fora e o passo a passo aparece
  const MSG = 'A etiquetagem com IA precisa do login do Claude neste computador: abra um terminal, rode claude e depois /login.';
  const semLoginIa = { atual: null, fila: 0, feitos: 1, ok: 0, cancelados: 29, erros: [{ midiaId: ID2, status: 'sem-login', mensagem: MSG }], rodando: false };
  const semLogin = dg.loteEstadoHtml(semLoginIa);
  limpo(semLogin, 'lote sem login');
  assert.ok(semLogin.includes('29 posts ficaram de fora: falta o login do Claude.') && semLogin.includes('rode claude e depois /login'));
  assert.ok(dg.loteEstadoHtml({ ...semLoginIa, cancelados: undefined }).includes('A fila parou: falta o login do Claude.'));
  assert.equal(dg.toastFimLote(semLoginIa), 'A etiquetagem com IA parou: falta o login do Claude neste computador');
  assert.equal(dg.toastFimLote({ feitos: 3, ok: 3, erros: [] }), 'A etiquetagem com IA terminou');
  assert.ok(dg.loteEstadoHtml({ atual: null, fila: 0, feitos: 0, ok: 0, erros: [], rodando: true }).includes('role="progressbar"'), 'rodando vale mesmo sem atual');
  const botao = dg.loteHtml(resumo.ia, {}, 'Etiquetar com IA');
  assert.ok(botao.includes('aria-disabled="true"'), 'rodando: botão fica parado sem perder o foco');
});

test('gráficos comuns: faixa por extenso na pirâmide e percentual fora da cor do dado', () => {
  const pir = mc.piramide([{ faixa: '25-34', a: 31, b: 22 }, { faixa: '65+', a: 6, b: 4 }]);
  limpo(pir, 'pirâmide');
  assert.ok(pir.includes('<span class="mc-pir-faixa">25 a 34</span>') && pir.includes('<span class="mc-pir-faixa">65 ou mais</span>'));
  assert.ok(pir.includes('<td>25 a 34</td>') && pir.includes('<td>65 ou mais</td>'), 'a tabela também');
  assert.ok(!/>25-34<|>65\+</.test(pir), 'a chave não vai pra tela');
  assert.equal(mc.faixaIdade('45-54'), '45 a 54');
  const emp = mc.empilhadas([{ rotulo: '14/09 a 20/09', partes: [300, 600] }], { nomes: ['Seguidores', 'Não seguidores'] });
  limpo(emp, 'empilhadas');
  assert.ok(!/class="mc-emp-seg"[^>]*>[^<]/.test(emp) && !emp.includes('<b>'), 'nada escrito dentro do segmento');
  assert.match(emp, /<span class="mc-emp-valores"><span><i class="mc-chave" data-serie="1" aria-hidden="true"><\/i>33%<\/span><span><i class="mc-chave" data-serie="2" aria-hidden="true"><\/i>67%<\/span><\/span>/);
});

test('ligações do painel: público salvo invalida a aba Público, vínculo recarrega o cronograma', () => {
  // DOM puro não roda no Node: confere no código que as chamadas estão nos lugares certos
  const js = readFileSync(new URL('../../public/js/views/diagnostico.js', import.meta.url), 'utf8');
  const corpo = (nome) => {
    const i = js.indexOf(`function ${nome}(`);
    assert.ok(i >= 0, `falta a função ${nome}`);
    return js.slice(i, js.indexOf('\n}\n', i));
  };
  assert.match(js, /import \{ invalidar as invalidarPublico \} from '\.\/publico\.js';/);
  assert.ok(corpo('salvarPublico').includes('invalidarPublico()') && corpo('apagarPublico').includes('invalidarPublico()'));
  assert.ok(corpo('vincular').includes('recarregarCronograma()') && corpo('salvarVinculo').includes('recarregarCronograma()'));
  assert.ok(corpo('recarregarCronograma').includes('recarregar()'));
  // o seletor de vínculo não grava no change; o de etiqueta só grava direto quando veio do mouse
  assert.ok(!/data-dg-p-vinculo\]'\)\) salvarVinculo/.test(js));
  assert.ok(corpo('aoMudarPainel').includes("t.dataset.dgPonteiro === '1'") && corpo('aoTeclarTag').includes("e.key === 'Enter'"));
  // fechar o painel devolve o foco pro controle da aba (o botão que abriu some no redesenho)
  assert.ok(corpo('abrirPost').includes('observarFechamento()') && corpo('observarFechamento').includes("attributeFilter: ['hidden']"));
  // a leitura do print não rouba o foco nem pisa no digitado; é retomada ao abrir e aguenta erro de rede
  assert.ok(corpo('aplicarLeitura').includes('focoLivre()') && corpo('aplicarLeitura').includes('data-dg-sujo'));
  assert.ok(corpo('carregarPost').includes('retomarPrint(id)') && corpo('consultarPrint').includes('PRINT_TENTATIVAS'));
});

test('arquivos da aba: sem travessão, sem barrinha antes do texto', () => {
  const raiz = new URL('../../public/', import.meta.url);
  const js = readFileSync(new URL('js/views/diagnostico.js', raiz), 'utf8');
  const css = readFileSync(new URL('css/views/diagnostico.css', raiz), 'utf8');
  const comumJs = readFileSync(new URL('js/metricas-comum.js', raiz), 'utf8');
  const comumCss = readFileSync(new URL('css/views/metricas-comum.css', raiz), 'utf8');
  const teste = readFileSync(new URL(import.meta.url), 'utf8');
  for (const [nome, t] of [['diagnostico.js', js], ['diagnostico.css', css], ['metricas-comum.js', comumJs], ['metricas-comum.css', comumCss], ['este teste', teste]]) {
    assert.doesNotMatch(t, TRACO, `${nome} tem travessão`);
  }
  assert.doesNotMatch(css, /border-left|::before/, 'CSS com barrinha decorativa');
  // toda classe definida no CSS da aba começa com dg-
  const classes = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.([a-z][\w-]*)/gi)].map((m) => m[1]);
  const deFora = new Set(['ico', 'campo', 'btn', 'pill', 'segmentado', 'mc-div', 'mc-medidor', 'bloco-titulo']);
  for (const c of classes) assert.ok(c.startsWith('dg-') || deFora.has(c), `classe sem prefixo dg-: ${c}`);
  // rótulo branco dentro da barra empilhada saiu (contraste abaixo de 4,5:1)
  assert.doesNotMatch(comumCss, /\.mc-emp-seg b\b/);
});
