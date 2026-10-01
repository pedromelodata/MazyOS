// Teste de fumaça do front da aba Público (public/js/views/publico.js; SPEC-METRICAS.md §5.4).
// Rodar: node --test "server/testes/*.test.mjs". O core.js mexe no DOM ao carregar, então o teste monta o
// mínimo do navegador (document, window, location, localStorage, addEventListener) antes de importar, e só
// chama as funções puras (os construtores de HTML e as de dado). Dado de exemplo no formato da §3.6 e §3.7.
// Confere: não quebra, não sai travessão nem meia-risca, número ausente vira "sem dado", token não aparece.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const nada = () => {};
globalThis.window ??= globalThis;
globalThis.addEventListener ??= nada;
globalThis.removeEventListener ??= nada;
globalThis.document ??= {
  addEventListener: nada,
  removeEventListener: nada,
  documentElement: { dataset: { theme: 'dark' } },
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  body: { append: nada, classList: { add: nada, remove: nada } },
};
Object.defineProperty(globalThis, 'location', { value: { hash: '#/instagram/metricas/publico', pathname: '/', search: '' }, configurable: true, writable: true });
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, setItem: nada, removeItem: nada }, configurable: true, writable: true });

const pb = await import('../../public/js/views/publico.js');

const TRACO = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const TRAVESSAO = String.fromCharCode(0x2014);
const MEIA_RISCA = String.fromCharCode(0x2013);
const TOKEN = `EAAB${'x9'.repeat(20)}`;
const semTraco = (html, onde) => assert.ok(!TRACO.test(html), `${onde}: saiu travessão ou meia-risca`);
const vezes = (html, trecho) => html.split(trecho).length - 1;

const EM = '2026-09-30T17:00:00.000Z';
const bloco = (id, extra = {}) => ({
  id, titulo: id, fonte: 'api', em: EM, base: null, disponivel: true, motivo: null, frases: [],
  genero: [], idade: [], idadeGenero: null, cidades: [], paises: [], ocultos: 0, ...extra,
});

// resumo() da §3.6, com buracos de propósito (null onde a Meta não devolveu)
const RESUMO = {
  atualizadoEm: EM,
  seguidores: { total: 109, em: EM, variacao7d: 3 },
  quem: [
    bloco('seguidores', {
      titulo: 'Seguidores',
      base: 109,
      frases: [
        'Dos 109 seguidores com dado (30 dias): 64% são mulheres e 35% homens.',
        `72% têm menos de 35 anos ${TRAVESSAO} o maior grupo é de mulheres de 25 a 34 anos (31%).`,
      ],
      genero: [
        { id: 'F', rotulo: 'Mulheres', valor: 70, pct: 64.2 },
        { id: 'M', rotulo: 'Homens', valor: 38, pct: 34.9 },
        { id: 'U', rotulo: 'Não informado', valor: 1, pct: 0.9 },
      ],
      idade: [{ faixa: '25-34', valor: 50, pct: 45.9 }, { faixa: '18-24', valor: 20, pct: 18.3 }, { faixa: '65+', valor: 2, pct: null }],
      idadeGenero: [
        { faixa: '25-34', mulheres: 34, homens: 15, outros: 1 },
        { faixa: '18-24', mulheres: 12, homens: 8, outros: 0 },
        { faixa: '35-44', mulheres: 16, homens: 10, outros: 0 },
        { faixa: '45-54', mulheres: 8, homens: 5, outros: 0 },
      ],
      cidades: [
        { nome: 'Belo Horizonte, Minas Gerais', valor: 49, pct: 45 },
        { nome: 'Contagem, Minas Gerais', valor: 9, pct: 8.3 },
        { nome: `São Paulo${MEIA_RISCA}SP`, valor: 7, pct: null },
      ],
      paises: [{ nome: 'BR', valor: 105, pct: 96.3 }, { nome: 'PT', valor: 4, pct: 3.7 }],
      ocultos: 2,
    }),
    bloco('engajados-30', {
      titulo: 'Engajados nos últimos 30 dias',
      base: 140,
      frases: ['Das 140 contas que engajaram (30 dias): 58% são mulheres.'],
      genero: [{ id: 'F', rotulo: 'Mulheres', valor: 81, pct: 58 }, { id: 'M', rotulo: 'Homens', valor: 59, pct: 42 }],
      idade: [{ faixa: '25-34', valor: 60, pct: 42.9 }, { faixa: '35-44', valor: 40, pct: 28.6 }],
      cidades: [{ nome: 'Belo Horizonte, Minas Gerais', valor: 70, pct: 50 }],
      paises: [{ nome: 'BR', valor: 140, pct: 100 }],
    }),
    bloco('engajados-7', { disponivel: false, motivo: 'A Meta só devolve com 100 ou mais contas engajadas na janela.', em: null }),
    bloco('alcancados-30', { disponivel: false, motivo: 'A Meta não devolve isso pra esta conta.', em: null }),
  ],
  descoberta: {
    semanas: [
      { semana: '2026-W38', rotulo: '14/09 a 20/09', alcance: 900, seguidores: 300, naoSeguidores: 600, pctNao: 66.7 },
      { semana: '2026-W39', rotulo: null, alcance: null, seguidores: null, naoSeguidores: null, pctNao: null },
    ],
    porTipo: { REEL: 1200, POST: 300, CAROUSEL_CONTAINER: null, STORY: 150, AD: 0 },
    frase: 'Na última semana, 67% do alcance veio de quem não segue a conta.',
  },
  crescimento: {
    dias: [
      { dia: '2026-09-28', seguiram: 3, deixaram: 1, total: 106 },
      { dia: '2026-09-29', seguiram: null, deixaram: 0, total: 107 },
      { dia: '2026-09-30', seguiram: 2, deixaram: 0, total: 109 },
    ],
    frase: 'Nos últimos 3 dias: 5 seguiram e 1 deixou de seguir.',
  },
  horarios: {
    online: [2, 1, 0, 0, 0, 1, 3, 8, 12, 15, 14, 16, 30, 18, 14, 13, 15, 20, 26, 33, 31, 22, null, 5],
    nossos: [
      { faixa: 'manha', rotulo: 'Manhã (6h a 12h)', n: 4, medianaScore: 0.4 },
      { faixa: 'noite', rotulo: 'Noite (18h a 24h)', n: 2, medianaScore: null },
    ],
    frase: 'Os seguidores ficam mais online às 19h.',
  },
  personas: [
    { id: 'A', nome: 'A Direto', recorte: '25 a 44 anos, todos', pctSeguidores: 58.5, pctEngajados: 61, frase: 'Cabem no recorte 58% dos seguidores.' },
    { id: 'C', nome: 'C Mão na mão', recorte: 'homens de 45 anos ou mais', pctSeguidores: null, pctEngajados: null, frase: '' },
  ],
  porPost: [
    {
      midiaId: '17900000000000001', dia: '2026-09-25', titulo: 'MEI pode ter funcionário?', thumb: 'https://scontent.cdninstagram.com/v/x.jpg',
      fonte: 'anuncio', base: 1234, frases: ['No alcance pago (1.234 contas, R$ 150,00): 72% mulheres.'],
      genero: [{ id: 'female', pct: 72 }], idade: [{ faixa: '25-34', pct: 40 }],
    },
    {
      midiaId: '17900000000000001', dia: '2026-09-25', titulo: 'MEI pode ter funcionário?', thumb: '',
      fonte: 'app', base: 'visualizacoes', frases: [], genero: { mulheres: 60, homens: 40 }, idade: { '25-34': 40, '18-24': 20 },
    },
    { midiaId: '17900000000000002', dia: '2026-09-20', titulo: '', thumb: 'http://inseguro.example/x.jpg', fonte: 'app', base: null, frases: [], genero: null, idade: null },
    { midiaId: '../../etc', dia: '2026-09-19', titulo: 'id inválido', fonte: 'app' },
  ],
  anuncios: {
    temToken: true, conta: { id: 'act_123', nome: 'Legalizaí', moeda: 'BRL' },
    contasDisponiveis: [{ id: 'act_123', nome: 'Legalizaí', moeda: 'BRL' }, { id: 'act_456', nome: 'Teste', moeda: 'BRL' }],
    lidoEm: EM, erro: null, nAnuncios: 3, nPosts: null, passos: [],
  },
  suporte: {
    'demo:alcancados:this_month:age,gender': { ok: false, em: EM, erro: `(#100) Invalid parameter access_token=${TOKEN}` },
    'demo:seguidores:this_month:age,gender': { ok: true, em: EM },
    'diario:views-seguidor': { ok: false, em: EM, erro: '(#100) metric not supported' },
    online_followers: { ok: false, em: EM },
  },
  avisos: ['Alcance somado dos anúncios.', `Token recusado: ${TOKEN}`],
};

test('a aba inteira desenha sem quebrar, sem travessão e com "sem dado" no que falta', () => {
  const html = pb.paginaHtml(RESUMO, { bloco: 'seguidores' });
  assert.equal(typeof html, 'string');
  semTraco(html, 'paginaHtml');
  assert.match(html, /Dos 109 seguidores com dado \(30 dias\)/);
  assert.match(html, /Fonte: API do Instagram/);
  assert.match(html, /Janela: últimos 30 dias/);
  assert.match(html, /Lido em \d{2}\/\d{2} às \d{2}:\d{2}/);
  assert.match(html, /Base: 109 contas com dado/);
  // São Paulo sem pct, nPosts nulo, a semana sem alcance, o seguiram nulo: tudo "sem dado", nunca "-" nem 0
  assert.ok(vezes(html, 'sem dado') >= 4, 'esperava vários "sem dado"');
  assert.ok(!/<td[^>]*>-<\/td>/.test(html), 'célula com hífen no lugar de "sem dado"');
  // os gráficos certos: pirâmide, barras, empilhadas, colunas divergentes e as 24 colunas
  for (const classe of ['mc-piramide', 'mc-barras', 'mc-empilhadas', 'mc-coldiv', 'mc-colunas', 'mc-linha']) assert.ok(html.includes(classe), `faltou ${classe}`);
  assert.equal(vezes(html, 'class="mc-col"'), 24);
  assert.match(html, /as 3 horas com mais gente online: 12h, 19h, 20h/);
  // países aparecem porque tem Portugal; o aviso fixo das personas sempre
  assert.match(html, /Países/);
  assert.match(html, /Portugal/);
  assert.match(html, /Idade e gênero não dizem profissão nem se é MEI ou ME/);
  // a lista do que a Meta não devolve, sem o token que veio dentro do erro
  assert.match(html, /Alcançados por idade e gênero cruzados \(30 dias\)/);
  assert.match(html, /Views por dia, entre seguidores e não seguidores/);
  assert.match(html, /Horários em que os seguidores ficam online/);
  assert.ok(!html.includes(TOKEN), 'token apareceu na tela');
  assert.match(html, /\[oculto\]|\[token oculto\]/);
  // post com id inválido não entra; thumb sem https não vira imagem
  assert.ok(!html.includes('../../etc'));
  assert.ok(!html.includes('inseguro.example'));
  assert.equal(vezes(html, 'data-pb-print="'), 2);
});

test('o seletor mostra o público ativo e desabilita o indisponível com o motivo', () => {
  const html = pb.trocaHtml(RESUMO.quem, 'engajados-30');
  semTraco(html, 'trocaHtml');
  assert.match(html, /data-pb-bloco="engajados-30"[^>]*aria-pressed="true"/);
  assert.match(html, /data-pb-bloco="seguidores"[^>]*aria-pressed="false"/);
  assert.equal(vezes(html, 'aria-disabled="true"'), 2);
  assert.match(html, /A Meta só devolve com 100 ou mais contas engajadas na janela\./);
  assert.match(html, /data-mc-dica="Alcançados 30 dias: A Meta não devolve isso pra esta conta\."/);
  // pedido de bloco indisponível cai no primeiro disponível
  assert.equal(pb.escolherBloco(RESUMO.quem, 'engajados-7')?.id, 'seguidores');
  assert.equal(pb.escolherBloco(RESUMO.quem, 'engajados-30')?.id, 'engajados-30');
  assert.equal(pb.escolherBloco([], 'seguidores'), null);
});

test('bloco sem cruzamento mostra idade separada e esconde país quando é só Brasil', () => {
  const html = pb.quemHtml(RESUMO.quem[1]);
  semTraco(html, 'quemHtml');
  assert.ok(!html.includes('mc-piramide'));
  assert.match(html, /25 a 34 anos/);
  assert.ok(!html.includes('Países'));
  assert.equal(pb.soBrasil([{ nome: 'BR', pct: 100 }]), true);
  assert.equal(pb.soBrasil([{ nome: 'Brasil', valor: 3 }, { nome: 'US', valor: 0 }]), true);
  assert.equal(pb.soBrasil([{ nome: 'BR', pct: 90 }, { nome: 'US', pct: 10 }]), false);
  assert.equal(pb.soBrasil([]), true);
});

test('resumo vazio, carregando e erro também desenham', () => {
  const vazio = pb.paginaHtml({}, {});
  semTraco(vazio, 'vazio');
  assert.match(vazio, /Ainda sem dado de público/);
  assert.match(vazio, /Seguidores: <b>sem dado<\/b>/);
  assert.match(vazio, /em 7 dias: sem dado/);
  assert.match(vazio, /Ainda sem leitura do público/);
  assert.match(pb.paginaHtml(null, {}), /Lendo o público/);
  const erro = pb.paginaHtml(null, { erro: `Falhou com ${TOKEN}` });
  assert.match(erro, /Tentar de novo/);
  assert.ok(!erro.includes(TOKEN));
  const velho = pb.paginaHtml(RESUMO, { carregando: true, erro: 'Sem conexão com o servidor' });
  assert.match(velho, /class="pb pb-velho"/);
  assert.match(velho, /aria-busy="true"/);
  assert.match(velho, /Tentar de novo/);
  semTraco(velho, 'velho');
});

test('topo: seguidores, variação e o "Atualizar agora" ocupado', () => {
  const html = pb.topoHtml({ seguidores: { total: 109, variacao7d: -2 }, atualizadoEm: EM }, { atualizando: true });
  semTraco(html, 'topoHtml');
  assert.match(html, /<b>109<\/b> seguidores/);
  assert.match(html, /-2 em 7 dias/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /Lendo a conta/);
});

test('pirâmide: contagem vira percentual do total, percentual fica como veio', () => {
  const contas = pb.linhasPiramide([{ faixa: '35-44', mulheres: 20, homens: 20, outros: 0 }, { faixa: '25-34', mulheres: 50, homens: 30, outros: 0 }]);
  assert.deepEqual(contas.map((l) => l.faixa), ['25-34', '35-44']);
  assert.ok(Math.abs(contas[0].a - (50 / 120) * 100) < 1e-9);
  const pcts = pb.linhasPiramide([{ faixa: '25-34', mulheres: 31, homens: 22 }, { faixa: '18-24', mulheres: 20, homens: 27 }]);
  assert.equal(pcts.find((l) => l.faixa === '25-34').a, 31);
  // base maior que a soma (grupo escondido): divide pela base
  const comBase = pb.linhasPiramide([{ faixa: '25-34', mulheres: 60, homens: 50 }], 200);
  assert.equal(comBase[0].a, 30);
  assert.deepEqual(pb.linhasPiramide(null), []);
  assert.deepEqual(pb.linhasPiramide([{ faixa: '25-34', mulheres: null, homens: null }]), []);
});

test('formas do servidor: gênero, idade e alcance por tipo', () => {
  assert.deepEqual(pb.generoNorm({ mulheres: 60, homens: 40 }).map((x) => [x.rotulo, x.pct]), [['Mulheres', 60], ['Homens', 40]]);
  const g = pb.generoNorm([{ id: 'F', valor: 30 }, { id: 'M', valor: 10 }]);
  assert.equal(g[0].rotulo, 'Mulheres');
  assert.equal(g[0].pct, 75);
  assert.deepEqual(pb.idadeNorm({ '65+': 5, '18-24': 20 }).map((x) => x.faixa), ['18-24', '65+']);
  assert.equal(pb.faixaTexto('25-34'), '25 a 34');
  assert.equal(pb.faixaTexto('65+'), '65 ou mais');
  const tipos = pb.itensPorTipo({ REEL: 1200, POST: 300, AD: null });
  assert.deepEqual(tipos.map((x) => x.rotulo), ['Reels', 'Posts', 'Anúncios']);
  assert.deepEqual(pb.itensPorTipo({ alcance: { STORY: 3 } }).map((x) => x.rotulo), ['Stories']);
  assert.deepEqual(pb.topoHoras([1, 9, 3, 9, null, 8]), [1, 3, 5]);
  assert.equal(pb.nomePais('US'), 'Estados Unidos');
  assert.equal(pb.nomePais('Brasil'), 'Brasil');
});

test('o que a Meta não devolve: rótulos em português, só as recusas e sem token', () => {
  assert.equal(pb.rotuloSuporte('demo:seguidores:this_week:city'), 'Seguidores por cidade (7 dias)');
  assert.equal(pb.rotuloSuporte('demo:engajados::gender'), 'Engajados por gênero');
  assert.equal(pb.rotuloSuporte('diario:seguiram'), 'Quem começou e quem deixou de seguir, por dia');
  assert.equal(pb.rotuloSuporte('online_followers'), 'Horários em que os seguidores ficam online');
  const itens = pb.itensSuporte(RESUMO.suporte);
  assert.equal(itens.length, 3);
  assert.ok(itens.every((x) => !x.erro.includes(TOKEN)));
  const html = pb.suporteHtml({ 'diario:tipo': { ok: true, em: EM } });
  assert.match(html, /devolveu tudo o que o app pediu/);
  assert.match(pb.suporteHtml(null), /Ainda sem leitura/);
});

test('anúncios: sem token pede o token (password, sem valor), sem conta pede a conta, com conta atualiza', () => {
  const semToken = pb.anunciosHtml({ temToken: false, conta: null, contasDisponiveis: [], passos: ['Abra Usuários do sistema → Atribuir ativos'], token: TOKEN }, {});
  semTraco(semToken, 'semToken');
  assert.match(semToken, /type="password"/);
  assert.ok(!/id="pb-token"[^>]*value=/.test(semToken), 'o campo do token não pode ter value');
  assert.ok(!semToken.includes(TOKEN), 'token apareceu na tela');
  assert.match(semToken, /Atribuir ativos/);
  const semPassos = pb.anunciosHtml({ temToken: false, passos: null }, {});
  assert.match(semPassos, /ads_read/);
  const semConta = pb.anunciosHtml({ temToken: true, conta: null, contasDisponiveis: [{ id: 'act_1', nome: 'Conta 1', moeda: 'BRL' }] }, { erro: `Token vencido ${TOKEN}` });
  assert.match(semConta, /<select class="campo" id="pb-conta"/);
  assert.match(semConta, /Escolha a conta/);
  assert.ok(!semConta.includes(TOKEN));
  const comConta = pb.anunciosHtml(RESUMO.anuncios, { ocupado: 'atualizar' });
  assert.match(comConta, /Lendo os anúncios/);
  assert.match(comConta, /Trocar a conta de anúncios/);
  assert.match(comConta, /sem dado/);
  const semStatus = pb.anunciosHtml(null, {});
  assert.match(semStatus, /Ler estado dos anúncios/);
  // token sem conta visível: os passos do servidor e o "Atualizar anúncios" (relê as contas do token)
  const semContaVisivel = pb.anunciosHtml({ temToken: true, conta: null, contasDisponiveis: [], passos: ['Abra o Gerenciador de Negócios.', 'Cole o token novo aqui e clique em Conectar (ou, se o token já tinha ads_read, clique em Atualizar).'] }, {});
  assert.match(semContaVisivel, /Nenhuma conta de anúncios chegou por este token/);
  assert.match(semContaVisivel, /data-pb-ads-atualizar/);
  assert.match(semContaVisivel, /clique em Atualizar/);
  // com contas e sem escolha: o passo único do servidor vira uma frase acima da lista
  const escolher = pb.anunciosHtml({ temToken: true, conta: null, contasDisponiveis: [{ id: 'act_1', nome: 'Conta 1' }], passos: ['Escolha a conta de anúncios do Legalizaí na lista e depois clique em Atualizar.'] }, {});
  assert.match(escolher, /<p class="pb-sub">Escolha a conta de anúncios do Legalizaí na lista/);
  assert.match(pb.anunciosHtml({ temToken: false }, {}), />Conectar<\/button>/);
  assert.match(pb.anunciosHtml({ ...RESUMO.anuncios, nLigados: 2 }, {}), /Ligados a posts nossos<\/dt><dd>2</);
});

test('público por post: anúncio e app juntos no mesmo post, mais novo primeiro', () => {
  const grupos = pb.agruparPorPost(RESUMO.porPost);
  assert.deepEqual(grupos.map((g) => g.midiaId), ['17900000000000001', '17900000000000002']);
  assert.equal(grupos[0].fontes.length, 2);
  const html = pb.porPostHtml(RESUMO.porPost);
  semTraco(html, 'porPostHtml');
  assert.match(html, /Editar números do app/);
  assert.match(html, /#\/instagram\/metricas\/diagnostico\?post=17900000000000001/);
  assert.match(html, /Base: visualizações/);
  assert.match(html, /Base: sem dado/);
  assert.match(pb.porPostHtml([]), /Nenhum post com público ainda/);
  // a linha do app sem frase mostra o porquê, nunca o gênero e a idade crus que vieram nela
  assert.match(html, /Sem frase: nenhum grupo com 5 pessoas ou mais\./);
  assert.ok(!/60%|40%|Mulheres 60/.test(html), 'percentual cru da linha apareceu');
});

test('público por post: sem frase, nenhum percentual cru (grupo pequeno não aparece nem por fora)', () => {
  // 7 visualizações: 57,1% são 4 pessoas e 42,9% são 3; o servidor não solta frase e a tela não pode mostrar
  const linha = {
    midiaId: '17900000000000007', dia: '2026-09-29', titulo: 'Reel pequeno', fonte: 'app', base: 'visualizacoes', baseTexto: 'visualizações',
    n: 7, em: EM, autor: 'Pedro', frases: [],
    genero: [{ id: 'F', rotulo: 'Mulheres', pct: 57.1 }, { id: 'M', rotulo: 'Homens', pct: 42.9 }],
    idade: [{ faixa: '25-34', pct: 57.1 }, { faixa: '35-44', pct: 42.9 }],
    visiveis: { genero: [], idade: [], cidades: [], paises: [], seguidores: null },
    dados: { base: 'visualizacoes', genero: { mulheres: 57.1, homens: 42.9 }, idade: { '25-34': 57.1, '35-44': 42.9 }, cidades: [], paises: [] },
  };
  const html = pb.porPostHtml([linha]);
  semTraco(html, 'sem frase');
  assert.match(html, /Sem frase: nenhum grupo com 5 pessoas ou mais\./);
  assert.ok(!/57,1|42,9|25 a 34/.test(html), 'grupo com menos de 5 pessoas apareceu');
  // sem o número de contas da base (n null), o porquê é outro
  const semBase = pb.porPostHtml([{ ...linha, n: null }]);
  assert.match(semBase, /Sem frase: falta o número de contas da base/);
  assert.ok(!/57,1|42,9/.test(semBase));
  assert.equal(pb.semFraseTexto({ fonte: 'anuncio', frases: [] }), 'Sem frase: nenhum grupo com 5 pessoas ou mais.');
  // com frase, só a frase
  const comFrase = pb.porPostHtml([{ ...linha, n: 900, frases: ['Na tela do app (visualizações): 57,1% mulheres e 42,9% homens.'] }]);
  assert.match(comFrase, /<li>Na tela do app \(visualizações\): 57,1% mulheres e 42,9% homens\.<\/li>/);
  assert.ok(!comFrase.includes('Sem frase'));
});

test('números salvos do app vêm do GET do post (publico.app.dados) e o resumo velho é relido', () => {
  const detalhe = {
    post: { midiaId: '17900000000000001' },
    publico: {
      pago: null,
      app: {
        frases: ['Na tela do app (contas alcançadas): 61% mulheres e 39% homens.'],
        visiveis: { genero: [{ id: 'F', rotulo: 'Mulheres', pct: 61 }], idade: [], cidades: [], paises: [], seguidores: null },
        dados: { em: EM, autor: 'Pedro', base: 'contas-alcancadas', contas: 980, genero: { mulheres: 61, homens: 39 }, idade: { '25-34': 41, '18-24': 59 }, cidades: [{ nome: 'Belo Horizonte', pct: 44 }], paises: [], seguidores: 22, naoSeguidores: 78 },
      },
    },
  };
  const app = pb.appDoDetalhe(detalhe);
  assert.deepEqual([app.base, app.contas, app.genero.homens, app.idade['18-24'], app.cidades[0].nome, app.naoSeguidores], ['contas-alcancadas', 980, 39, 59, 'Belo Horizonte', 78]);
  // forma antiga (os números soltos na própria linha) ainda serve; sem público do app, null
  assert.equal(pb.appDoDetalhe({ publico: { app: { base: 'visualizacoes', genero: { mulheres: 70 }, frases: [] } } }).genero.mulheres, 70);
  assert.equal(pb.appDoDetalhe({ publico: { app: null } }), null);
  assert.equal(pb.appDoDetalhe(null), null);
  // 2 minutos: antes disso vale o que está guardado; depois, a aba lê de novo
  const agora = Date.parse(EM);
  assert.equal(pb.resumoVelho({ dados: {}, velho: false, lidoEm: agora - 60_000 }, agora), false);
  assert.equal(pb.resumoVelho({ dados: {}, velho: false, lidoEm: agora - pb.VELHO_MS - 1 }, agora), true);
  assert.equal(pb.resumoVelho({ dados: {}, velho: true, lidoEm: agora }, agora), true);
  assert.equal(pb.resumoVelho({ dados: null, velho: false, lidoEm: agora }, agora), true);
  assert.equal(pb.resumoVelho({ dados: {}, velho: false }, agora), true, 'sem hora de leitura é velho');
});

test('validação do "Informar do app": números em pt-BR, somas e mensagens em português', () => {
  assert.equal(pb.lerPct('45,5'), 45.5);
  assert.equal(pb.lerPct('45.5%'), 45.5);
  assert.equal(pb.lerPct(' '), null);
  assert.ok(Number.isNaN(pb.lerPct('abc')));
  assert.ok(Number.isNaN(pb.lerPct('101')));
  const ok = pb.validarApp({
    midiaId: '17900000000000001', base: 'visualizacoes',
    genero: { mulheres: '64,2', homens: '35,8' },
    idade: { '25-34': '45', '18-24': '20', '35-44': '25', '45-54': '9,5' },
    seguidores: '30', naoSeguidores: '70',
    cidades: [{ nome: '  Belo   Horizonte ', pct: '45' }, { nome: '', pct: '' }],
    paises: [{ nome: 'Brasil', pct: '98' }],
  });
  assert.deepEqual(ok.erros, []);
  assert.deepEqual(ok.corpo, {
    base: 'visualizacoes', genero: { mulheres: 64.2, homens: 35.8 }, idade: { '18-24': 20, '25-34': 45, '35-44': 25, '45-54': 9.5 },
    cidades: [{ nome: 'Belo Horizonte', pct: 45 }], paises: [{ nome: 'Brasil', pct: 98 }], seguidores: 30, naoSeguidores: 70,
  });
  // um gênero só, sem idade e sem seguidores: vale (a soma só confere grupo inteiro)
  assert.deepEqual(pb.validarApp({ midiaId: '1', base: 'contas-engajadas', genero: { mulheres: '61' } }).erros, []);
  const ruim = pb.validarApp({
    midiaId: 'abc', base: '',
    genero: { mulheres: '80', homens: '40' },
    idade: { '25-34': '1000', '18-24': '40' },
    seguidores: '10', naoSeguidores: '20',
    cidades: [{ nome: 'Contagem', pct: '' }, { nome: '', pct: '5' }, { nome: 'BH', pct: '99' }, { nome: 'Betim', pct: '9' }],
  });
  assert.equal(ruim.corpo, null);
  const msgs = ruim.erros.map((x) => x.msg).join(' | ');
  semTraco(msgs, 'mensagens');
  assert.match(msgs, /Escolha o post\./);
  assert.match(msgs, /Diga de onde são os percentuais/);
  assert.match(msgs, /Idade de 25 a 34: use um número de 0 a 100/);
  assert.match(msgs, /Mulheres e homens somam 120%: na tela do app a soma fica perto de 100%\./);
  assert.match(msgs, /As faixas de idade somam 40%: preencha todas as faixas da tela/);
  assert.match(msgs, /Seguidores e não seguidores somam 30%/);
  assert.match(msgs, /As cidades somam 108%: passa de 100%\./);
  assert.match(msgs, /Cidade 1: falta o percentual\./);
  assert.match(msgs, /Cidade 2: falta o nome\./);
  // o campo de cada erro existe no formulário (o painel marca e foca o primeiro)
  const campos = new Set(ruim.erros.map((x) => x.campo));
  for (const c of ['midiaId', 'base', 'genero.mulheres', 'idade.18-24', 'idade.25-34', 'seguidores', 'cidades.0.pct', 'cidades.1.nome']) assert.ok(campos.has(c), `faltou o campo ${c}`);
  const nadaPreenchido = pb.validarApp({ midiaId: '1', base: 'contas-alcancadas' });
  assert.deepEqual(nadaPreenchido.erros.map((x) => x.msg), ['Preencha pelo menos um número da tela do app.']);
});

test('contas na base: inteiro opcional, em pt-BR, que vai no corpo só quando preenchido', () => {
  assert.equal(pb.lerContas('1.234'), 1234);
  assert.equal(pb.lerContas(' 1 234 '), 1234);
  assert.equal(pb.lerContas('980'), 980);
  assert.equal(pb.lerContas(''), null);
  assert.equal(pb.lerContas(null), null);
  for (const ruim of ['12,5', '1.5', '0', '-3', 'mil', '1,234']) assert.ok(Number.isNaN(pb.lerContas(ruim)), `aceitou ${ruim}`);
  const base = { midiaId: '17900000000000001', base: 'contas-engajadas', genero: { mulheres: '61', homens: '39' } };
  const com = pb.validarApp({ ...base, contas: '1.234' });
  assert.deepEqual(com.erros, []);
  assert.equal(com.corpo.contas, 1234);
  const sem = pb.validarApp({ ...base, contas: '' });
  assert.deepEqual(sem.erros, []);
  assert.ok(!('contas' in sem.corpo), 'contas vazia não vai no corpo');
  const ruim = pb.validarApp({ ...base, contas: '12,5' });
  assert.equal(ruim.corpo, null);
  assert.deepEqual(ruim.erros.map((x) => [x.campo, x.msg]), [['contas', 'Contas na base: use o número inteiro que a tela mostra (ex.: 1.234).']]);
  // só as contas, sem percentual: continua faltando o número da tela
  const soContas = pb.validarApp({ midiaId: '1', base: 'visualizacoes', contas: '300' });
  assert.deepEqual(soContas.erros.map((x) => x.msg), ['Preencha pelo menos um número da tela do app.']);
  // a sugestão do print pode trazer as contas (número ou texto)
  assert.equal(pb.paraFormApp({ base: 'visualizacoes', contas: 450, genero: {} }).contas, 450);
  assert.equal(pb.paraFormApp({ base: 'visualizacoes', contas: '1.200' }).contas, 1200);
  assert.equal(pb.paraFormApp({ base: 'visualizacoes', contas: 0 }).contas, null);
  assert.equal(pb.paraFormApp({ base: 'visualizacoes' }).contas, null);
});

test('prints: tipo, tamanho, quantidade e o estado da leitura', () => {
  const png = (size, name = 'tela.png') => ({ name, type: 'image/png', size });
  assert.equal(pb.validarArquivos([png(1000)]), '');
  assert.match(pb.validarArquivos([]), /Escolha de 1 a 3 prints/);
  assert.match(pb.validarArquivos([png(1), png(1), png(1), png(1)]), /no máximo 3/);
  assert.match(pb.validarArquivos([{ name: 'a.gif', type: 'image/gif', size: 10 }]), /só PNG, JPG ou WebP/);
  assert.match(pb.validarArquivos([png(5 * 1024 * 1024)]), /passou de 4 MB/);
  assert.match(pb.validarArquivos([png(4 * 1024 * 1024), png(4 * 1024 * 1024), png(3 * 1024 * 1024)]), /12 MB/);
  assert.equal(pb.faseLeitura(null), 'nenhuma');
  assert.equal(pb.faseLeitura({ etapa: null, erro: null, sugestao: null }), 'nenhuma');
  assert.equal(pb.faseLeitura({ etapa: 'lendo' }), 'rodando');
  assert.equal(pb.faseLeitura({ etapa: 'pronto', sugestao: { base: 'visualizacoes' } }), 'pronta');
  assert.equal(pb.faseLeitura({ etapa: 'pronto', sugestao: null }), 'vazia');
  assert.equal(pb.faseLeitura({ etapa: 'lendo', erro: 'soma deu 130%' }), 'erro');
  const sugestao = pb.paraFormApp({ base: 'contas-alcancadas', genero: { mulheres: 61, homens: 39 }, idade: { '25-34': 41 }, cidades: [{ nome: 'Belo Horizonte', pct: 44 }], paises: [], seguidores: 22, naoSeguidores: 78 });
  assert.equal(sugestao.base, 'contas-alcancadas');
  assert.equal(sugestao.idade['25-34'], 41);
  // a saída do sugestaoDoPrint ({ sugestao, avisos, vazio }) dentro da leitura
  const aninhada = { etapa: 'pronto', sugestao: { sugestao: { base: 'visualizacoes', genero: { mulheres: 70 } }, avisos: ['Não deu pra ver a base.'], vazio: false } };
  assert.equal(pb.faseLeitura(aninhada), 'pronta');
  assert.equal(pb.sugestaoDe(aninhada).genero.mulheres, 70);
  assert.deepEqual(pb.avisosDaLeitura({ ...aninhada, avisos: ['Não deu pra ver a base.', `token ${TOKEN}`] }), ['Não deu pra ver a base.', 'token [token oculto]']);
  assert.equal(pb.faseLeitura({ etapa: 'pronto', sugestao: { sugestao: {}, avisos: [], vazio: true } }), 'vazia');
});

test('formas reais do publico-motor: bloco com percentual, célula oculta null e porTipo com itens', () => {
  // blocoQuem manda idadeGenero em percentual, com null na célula de menos de 5 pessoas, e janela null
  const bloco = {
    id: 'seguidores', titulo: 'Seguidores', fonte: 'Meta: seguidores da conta', em: EM, janela: null, base: 109, disponivel: true, motivo: '',
    frases: ['Dos 109 seguidores com dado: 64,2% são mulheres e 34,9% homens.'],
    genero: [{ id: 'F', rotulo: 'Mulheres', valor: 70, pct: 64.2 }, { id: 'M', rotulo: 'Homens', valor: 38, pct: 34.9 }],
    idade: [{ faixa: '25-34', rotulo: '25 a 34 anos', valor: 50, pct: 45.9 }],
    idadeGenero: [
      { faixa: '18-24', mulheres: 11, homens: 7.3, outros: null },
      { faixa: '25-34', mulheres: 31.2, homens: 13.8, outros: null },
      { faixa: '35-44', mulheres: 14.7, homens: 9.2, outros: null },
      { faixa: '45-54', mulheres: 7.3, homens: null, outros: null },
    ],
    cidades: [{ nome: 'Belo Horizonte, Minas Gerais', valor: 49, pct: 45 }],
    paises: [{ nome: 'Brasil', codigo: 'BR', valor: 105, pct: 96.3 }], ocultos: 3, temCruzamento: true,
  };
  const linhas = pb.linhasPiramide(bloco.idadeGenero, bloco.base);
  assert.equal(linhas.find((l) => l.faixa === '25-34').a, 31.2);
  assert.equal(linhas.find((l) => l.faixa === '45-54').b, null);
  const cab = pb.cabecaHtml([bloco], bloco);
  semTraco(cab, 'cabecaHtml');
  assert.match(cab, /<span>Meta: seguidores da conta<\/span>/);
  assert.ok(!cab.includes('Janela:'), 'leitura sem janela não inventa "30 dias"');
  assert.match(cab, /3 grupos com menos de 5 pessoas ficaram fora das frases/);
  const quem = pb.quemHtml(bloco);
  assert.match(quem, /mc-piramide/);
  assert.ok(!quem.includes('Países'), 'só Brasil: sem a lista de países');
  // descoberta.porTipo do motor: { inicio, fim, dias, itens }
  const porTipo = { inicio: '2026-09-02', fim: '2026-09-29', dias: 28, itens: [{ tipo: 'REEL', rotulo: 'Reels', alcance: 1200, views: 3000, pctAlcance: 80 }, { tipo: 'STORY', rotulo: 'Stories', alcance: 300, views: null, pctAlcance: 20 }] };
  assert.deepEqual(pb.itensPorTipo(porTipo).map((x) => [x.rotulo, x.valor, x.texto]), [['Reels', 1200, '1.200'], ['Stories', 300, '300']]);
  assert.equal(pb.itensPorTipo(porTipo)[0].dica, 'Reels: 1.200 (80% do alcance)');
  // porPost do publico.mjs: base 'alcance-pago' com baseTexto pronto; a linha do app traz a cópia em "dados"
  const porPost = [
    { midiaId: '17900000000000005', dia: '2026-09-26', titulo: 'Reel do DAS', thumb: '', permalink: 'https://www.instagram.com/reel/abc/', tipo: 'REELS', fonte: 'anuncio', base: 'alcance-pago', baseTexto: 'alcance pago de 1.234 contas', n: 1234, em: EM, frases: ['No alcance pago (1.234 contas, R$ 150,00): 72% mulheres.'], genero: [{ id: 'F', rotulo: 'Mulheres', pct: 72 }], idade: [] },
    { midiaId: '17900000000000005', dia: '2026-09-26', titulo: 'Reel do DAS', thumb: '', permalink: 'https://www.instagram.com/reel/abc/', tipo: 'REELS', fonte: 'app', base: 'contas-alcancadas', baseTexto: 'contas alcançadas', n: 900, em: EM, autor: 'Pedro', frases: [], genero: [{ id: 'F', rotulo: 'Mulheres', pct: 60 }], idade: [{ faixa: '25-34', pct: 40 }], dados: { em: EM, autor: 'Pedro', base: 'contas-alcancadas', genero: { mulheres: 60, homens: 40 }, idade: { '25-34': 40, '18-24': 60 }, cidades: [{ nome: 'Belo Horizonte', pct: 50 }], paises: [], seguidores: 25, naoSeguidores: 75 } },
  ];
  const linhaPost = pb.porPostHtml(porPost);
  semTraco(linhaPost, 'porPost real');
  assert.match(linhaPost, /Base: alcance pago de 1\.234 contas/);
  assert.ok(!linhaPost.includes('alcance-pago'), 'id cru da base não aparece');
  assert.match(linhaPost, /Base: contas alcançadas, informado por Pedro em \d{2}\/\d{2}/);
  assert.match(linhaPost, /Reel · 26\/09/);
  assert.match(linhaPost, /href="https:\/\/www\.instagram\.com\/reel\/abc\/" target="_blank" rel="noopener noreferrer"/);
  assert.equal(pb.textoBase({ base: 'alcance-pago', n: 1234 }), 'Base: alcance pago de 1.234 contas');
  // a linha traz a cópia em "dados", mas a tela não mostra nada dela (só as frases)
  assert.ok(!linhaPost.includes('Belo Horizonte'), 'número digitado da linha apareceu na lista');
  // o painel abre em branco e travado, com o aviso de que está lendo os números salvos deste post
  const painel = pb.formAppHtml({ midiaId: '17900000000000005', posts: [{ midiaId: '17900000000000005', tipo: 'REELS', caption: 'Reel do DAS', timestamp: '2026-09-26' }], comApp: ['17900000000000005'] });
  assert.match(painel, /Reel do DAS · já tem números do app<\/option>/);
  assert.match(painel, /name="cidades\.0\.nome" value=""/);
  assert.match(painel, /id="pb-app-dados" disabled/);
  assert.match(painel, /id="pb-app-salvar" aria-disabled="true"/);
  assert.match(painel, /Lendo os números salvos deste post/);
  // aviso das personas e rótulo do suporte vindos do servidor; leitura rodando no servidor
  assert.match(pb.personasHtml([], 'Aviso do servidor: idade e gênero não dizem profissão.'), /Aviso do servidor: idade e gênero não dizem profissão\./);
  assert.equal(pb.itensSuporte({ 'demo:engajados:this_week:city': { ok: false, em: EM, erro: 'vazio', rotulo: 'Engajados: cidade (7 dias)' } })[0].rotulo, 'Engajados: cidade (7 dias)');
  assert.match(pb.topoHtml({ seguidores: {}, rodando: true }, {}), /Tem uma leitura do público rodando agora/);
  const desc = pb.descobertaHtml({ semanas: [], porTipo, frase: '' });
  assert.match(desc, /Alcance por tipo de conteúdo, somado em 28 dias/);
  assert.ok(!desc.includes('>dias<'), 'chave "dias" não vira barra');
  // semana sem uma das partes não vira "100%": sai do gráfico e é citada
  const semanas = [
    { semana: '2026-W38', rotulo: '14/09 a 20/09', seguidores: 300, naoSeguidores: 600 },
    { semana: '2026-W39', rotulo: null, seguidores: 280, naoSeguidores: null },
  ];
  const comBuraco = pb.descobertaHtml({ semanas, porTipo: null, frase: '' });
  assert.equal(vezes(comBuraco, 'class="mc-emp-linha"'), 1);
  assert.match(comBuraco, /Fora do gráfico, sem a divisão entre seguidores e não seguidores: 21\/09 a 27\/09\./);
  assert.ok(!comBuraco.includes('100%'));
  assert.match(pb.descobertaHtml({ semanas: [semanas[1]] }), /Sem a divisão do alcance/);
  // persona: o cartão não repete o nome e o recorte que já estão em cima
  assert.equal(pb.corpoPersona({ nome: 'Direto', frase: 'Direto (serviço intelectual; 25 a 44 anos, todos os gêneros): 58% dos seguidores.' }), '58% dos seguidores.');
  assert.equal(pb.corpoPersona({ nome: 'Mão na mão', frase: 'Mão na mão (ofícios; homens de 45 anos ou mais): sem dado, menos de 5 pessoas.' }), 'Sem dado, menos de 5 pessoas.');
  assert.equal(pb.corpoPersona({ nome: 'X', frase: 'Outro formato de frase.' }), 'Outro formato de frase.');
  assert.equal(pb.corpoPersona({ nome: 'X', frase: '', motivo: 'sem dado de idade' }), 'Sem dado: sem dado de idade.');
  // nenhuma persona com número: sem gráfico, só os cartões com o motivo
  const semNumero = pb.personasHtml([{ id: 'A', nome: 'Direto', recorte: '25 a 44 anos', pctSeguidores: null, pctEngajados: null, frase: 'Direto (serviço intelectual; 25 a 44 anos): sem dado, a demografia ainda não foi lida.' }]);
  assert.ok(!semNumero.includes('mc-barras'));
  assert.match(semNumero, /Sem dado, a demografia ainda não foi lida\./);
});

test('painel do app: post escolhido, números preenchidos, rótulos e nada de travessão', () => {
  const posts = [
    { midiaId: '17900000000000002', tipo: 'FEED', caption: `Carrossel ${TRAVESSAO} MEI e o DAS\n#mei`, timestamp: '2026-09-20T12:00:00+0000' },
    { midiaId: '17900000000000001', tipo: 'REELS', caption: 'MEI pode ter funcionário? #mei #cnpj', timestamp: '2026-09-25T12:00:00+0000' },
    { midiaId: '17900000000000001', tipo: 'REELS', caption: 'repetido', timestamp: '2026-09-25T12:00:00+0000' },
    { midiaId: 'x', caption: 'inválido' },
  ];
  const html = pb.formAppHtml({ midiaId: '17900000000000001', posts });
  semTraco(html, 'formAppHtml');
  assert.match(html, /<option value="17900000000000001" selected>25\/09 · Reel · MEI pode ter funcionário\?<\/option>/);
  assert.equal(vezes(html, '<option value="1790'), 2);
  // em branco até o GET do post: nenhum número do resumo guardado entra aqui
  assert.match(html, /name="genero.mulheres" value=""/);
  assert.match(html, /name="idade.25-34" value=""/);
  assert.ok(!/type="radio" name="base" value="[^"]+" checked/.test(html), 'base marcada antes de ler o post');
  // o campo novo das contas, opcional e com a nota do porquê
  assert.match(html, /<label class="rotulo" for="pb-app-contas">Contas na base \(o número que a tela mostra, se aparecer\)<\/label>/);
  assert.match(html, /id="pb-app-contas" name="contas" value=""/);
  assert.match(html, /grupo com menos de 5 pessoas não vira frase/);
  assert.match(html, /accept="image\/png,image\/jpeg,image\/webp" multiple/);
  assert.match(html, /até 4 MB cada e 12 MB juntos/);
  // o "Confira" é região viva vazia: a sugestão do print entra nela
  assert.match(html, /id="pb-confira" role="status"/);
  const confira = pb.confiraHtml([`Mulheres e homens somam 130% ${TRAVESSAO} confira`]);
  semTraco(confira, 'confiraHtml');
  assert.match(confira, /Confira os números antes de salvar\./);
  assert.match(confira, /<li>Mulheres e homens somam 130%/);
  // o "Apagar" só aparece depois que o GET do post disser que tem número do app
  assert.match(html, /id="pb-app-apagar" hidden/);
  assert.match(html, /65 ou mais/);
  const novo = pb.formAppHtml({ posts: [] });
  assert.match(novo, /<option value="" selected>Escolha o post<\/option>/);
  assert.match(novo, /id="pb-app-apagar" hidden/);
  assert.match(novo, /Escolha o post pra preencher os números da tela\./);
  assert.match(novo, /id="pb-app-dados" disabled/);
  // post que não veio na lista do Instagram entra com o título da linha
  const soDaLinha = pb.formAppHtml({ midiaId: '17900000000000009', posts: [], titulo: 'Reel da lista' });
  assert.match(soDaLinha, /<option value="17900000000000009" selected>Reel da lista<\/option>/);
});
