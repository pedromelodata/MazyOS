// Testes do estúdio de design do Ateliê (estudio.mjs, 22/10/2026, Pedro): a validação do documento (limites, números,
// cores, fontes, assets e travessão), o CRUD com a versão e o 409, as 20 versões guardadas e a volta, a semeadura da
// base do repo, as exportações (tipo pelos bytes, teto, anexo na peça e a aprovação que muda), a permissão do Diretor
// contábil, a geração com uma IA falsa (refaz uma vez, corrige por código, estratégia da peça, sem IA = 503) e o
// mecanismo visual. Um servidor HTTP no próprio processo chama estudio.rota; no fim, o servidor de verdade (node
// server/server.mjs) numa porta alta confere o despacho e o perfil. Pastas de dados temporárias: o banco de verdade
// (data/) não é lido. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-estudio-'));
const dados = path.join(raiz, 'data');
const base = path.join(raiz, 'base');
process.env.CRONOGRAMA_DATA = dados;
process.env.CRONOGRAMA_ESTUDIO_BASE = base;
// a IA de verdade nunca roda no teste
process.env.CRONOGRAMA_IA = '0';
mkdirSync(dados, { recursive: true });
mkdirSync(path.join(base, 'docs'), { recursive: true });
writeFileSync(path.join(dados, 'estilos.json'), '{}');

const TRACO = String.fromCharCode(0x2014);
const MEIA = String.fromCharCode(0x2013);
const TEM_TRACO = new RegExp(`[${TRACO}${MEIA}]`);
const BLOCO = { 1: 'Afeto', 2: 'Afeto', 3: 'Afeto', 4: 'Educação', 5: 'Educação', 6: 'Educação', 7: 'Educação', 16: 'Educação', 8: 'Diferencial', 9: 'Diferencial', 17: 'Diferencial', 10: 'Conversão', 11: 'Conversão', 12: 'Conversão', 13: 'Conversão', 14: null, 15: null };
const pilares = Object.keys(BLOCO).map(Number).sort((a, b) => a - b).map((id) => ({ id, nome: `Pilar ${id}`, bloco: BLOCO[id] }));
const EM = '2026-10-22T12:00:00.000Z';
const carrossel = { capa: { titulo: 'Abrir empresa exige cartório?', texto: '', visual: '' }, slides: [{ titulo: 'Não exige', texto: 'O app cuida do caminho', visual: '' }], final: { titulo: 'Salva pra lembrar', texto: '', visual: '' } };
const peca = (id, extra = {}) => ({
  id, ideia: `Peça ${id}`, data: '2099-05-12', peca: 'carrossel', pilar: 5, bloco: 'Educação', status: 'roteiro', legenda: '', fontes: [],
  roteiro: { hook: '', textoTela: '', cenas: [], desenvolvimento: '', cta: '' }, carrossel, estatico: {}, aprovacao: null, ...extra,
});
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({
  schemaVersion: 2, pilares, campanhas: [{ id: 'cmp_prelancamento', nome: 'Pré-lançamento' }],
  reels: [
    peca('reel_aprovado', {
      ideia: 'Mito: abrir empresa exige cartório', motivo: 'Mito de burocracia que trava a abertura.', gatilhoEmocional: 'cansaço da burocracia',
      gatilhoPsicologico: 'curiosidade', aprovacao: { estado: 'aprovado', etapa: 'diretor', decididoEm: EM, conversa: [] },
    }),
    peca('reel_pendente', { aprovacao: { estado: 'pendente', etapa: 'gerentes', gerentes: { aprovaram: [{ id: 'usr_ger', nome: 'Gerente', em: EM }] }, conversa: [] } }),
    peca('reel_postado', { data: '2026-01-05', status: 'publicado' }),
    peca('reel_futuro', { data: '2099-01-01' }),
    // 22/10 (Pedro): a rodada de correções (aprovação que não cai na reexportação, observação anulada, peça do dia)
    peca('reel_aprovado2', { aprovacao: { estado: 'aprovado', etapa: 'diretor', decididoEm: EM, conversa: [] } }),
    peca('reel_obs', { aprovacao: { estado: 'pendente', etapa: 'gerentes', rodada: 1, gerentes: { aprovaram: [{ id: 'usr_ger', nome: 'Gerente', em: EM }] }, observacoes: [{ id: 'obs_1', etapa: 'gerentes', texto: 'Ok com a foto de antes', em: EM, rodada: 1 }], conversa: [] } }),
    peca('reel_dia', { data: '2099-06-02', peca: 'carrossel', ideia: 'Carrossel do dia sobre o CNPJ', roteiro: { hook: '', textoTela: '', cenas: [], desenvolvimento: '', cta: '' } }),
    peca('reel_apagar', {}),
  ],
  stories: [
    { id: 'sto_1', data: '2099-05-13', objetivo: 'engajamento', pilar: 9, bloco: 'Diferencial', tema: 'Bastidor do time', pecaDoDia: null, quadros: [{ texto: 'Oi', visual: '', interacao: '' }], cta: '', fontes: [], notas: '', pilarTexto: '', motivo: '', status: 'ideia', aprovacao: { estado: 'pendente', etapa: 'diretor', conversa: [] } },
    { id: 'sto_dia', data: '2099-06-02', objetivo: 'engajamento', pilar: 5, bloco: 'Educação', tema: 'Teaser do carrossel', pecaDoDia: 'reel_dia', quadros: [{ texto: 'Vem ver', visual: '', interacao: '' }], cta: '', fontes: [], notas: '', pilarTexto: '', motivo: '', status: 'ideia', aprovacao: null },
  ],
}));
// um gerente cadastrado (a aprovação em 2 etapas olha os gerentes de agora)
writeFileSync(path.join(dados, 'usuarios.json'), JSON.stringify([{ id: 'usr_ger', usuario: 'gerente', nome: 'Gerente', hash: 'x', papel: 'gerente', criadoEm: EM }]));

// a semente da base (estudio/base/docs), antes da primeira chamada ao estúdio
const SEMENTE = path.join(base, 'docs', 'destaque.json');
const semente = (titulo) => ({
  id: 'est_destaque_1', titulo, formato: 'stories',
  paginas: [{ fundo: { tipo: 'cor', cor: '#FAF8F5' }, camadas: [
    { tipo: 'texto', nome: 'Título', texto: `Comece ${TRACO} por aqui`, x: 96, y: 300, largura: 888, altura: 200, tamanho: 80, peso: 800 },
    { tipo: 'imagem', assetId: 'ast_leo', x: 340, y: 700, largura: 400, altura: 600 },
  ] }],
});
writeFileSync(SEMENTE, JSON.stringify(semente('Comece por aqui')));
// semente com asset que não existe: não entra (e não trava as outras)
writeFileSync(path.join(base, 'docs', 'quebrada.json'), JSON.stringify({ titulo: 'Quebrada', paginas: [{ camadas: [{ tipo: 'imagem', assetId: 'ast_nao_existe', x: 0, y: 0, largura: 10, altura: 10 }] }] }));

const estudio = await import('../estudio.mjs');
const auth = await import('../auth.mjs');
const { carregar, salvar } = await import('../db.mjs');
const { conferirReel } = await import('../validar.mjs');
const { MSG_SEM_IA } = await import('../noticias.mjs');

const ASSETS = [
  { id: 'ast_leo', nome: 'Léo acenando', categoria: 'leo', tags: ['leo', 'acenando'], descricao: 'O suricato acenando', origem: 'base', largura: 800, altura: 1200 },
  { id: 'ast_simbolo', nome: 'Símbolo da marca', categoria: 'marca', tags: ['simbolo', 'visto'], descricao: 'Quadrado coral com o visto', origem: 'base', largura: 200, altura: 200 },
  { id: 'ast_papel', nome: 'Pilha de papéis 3D', categoria: '3d', tags: ['papel'], descricao: 'Papelada em clay', origem: 'base', largura: 1000, altura: 1000 },
  { id: 'ast_oculto', nome: 'Asset oculto', categoria: 'outro', tags: [], descricao: '', origem: 'base', largura: 100, altura: 100, oculto: true },
  { id: 'ast_luz', nome: 'Luz coral', categoria: 'fundo', tags: ['luz', 'brilho'], descricao: 'Brilho de fundo', origem: 'base', largura: 1100, altura: 900 },
  { id: 'ast_grifo', nome: 'Grifo coral à mão', categoria: 'outro', tags: ['grifo', 'sublinhado'], descricao: 'Sublinhado à mão', origem: 'base', largura: 400, altura: 34 },
];
estudio.definirFonteAssets(() => ASSETS);
// o disco do teste com folga (o C: deste PC anda apertado); o teste do espaço troca de novo
const DISCO_FOLGADO = async () => 100 * 1024 ** 3;
estudio.discoEstudio.livre = DISCO_FOLGADO;

// ---------- servidor HTTP no processo ----------

const USUARIOS = {
  time: { id: 'usr_time', nome: 'Pedro Melo', usuario: 'pedro', papel: 'admin' },
  outro: { id: 'usr_outro', nome: 'Pedro Maia', usuario: 'maia', papel: 'operador' },
  diretor: { id: 'usr_dir', nome: 'Diretor Teste', usuario: 'diretor', papel: 'diretor' },
};
const json = (res, codigo, corpo) => {
  res.writeHead(codigo, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(corpo));
};
async function corpoJson(req, limite = 1_000_000) {
  const partes = [];
  let total = 0;
  for await (const c of req) {
    total += c.length;
    if (total > limite) throw Object.assign(new Error('Corpo grande demais.'), { status: 413 });
    partes.push(c);
  }
  const s = Buffer.concat(partes, total).toString('utf8');
  return s.trim() ? JSON.parse(s) : {};
}
const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const partes = auth.partesDaApi(url.pathname);
    if (!partes) return json(res, 400, { erro: 'Endereço inválido.' });
    const caminho = `/api/${partes.join('/')}`;
    const u = USUARIOS[req.headers['x-teste-quem'] ?? 'time'];
    if (!auth.podeApi(u, req.method, caminho)) return json(res, 403, { erro: auth.motivoNegado(u, req.method, caminho) });
    if (partes[0] === 'estudio') return await estudio.rota(req, res, partes.slice(1), { usuario: u }, { json, corpoJson, url });
    return json(res, 404, { erro: 'Rota não existe.' });
  } catch (e) {
    if (res.headersSent) return res.end();
    if (e.status) res.setHeader('connection', 'close');
    return json(res, e.status ?? 500, { erro: e.message });
  }
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
after(() => servidor.close());

function pedir(caminho, { metodo = 'GET', quem = 'time', corpo, cabecalhos = {} } = {}) {
  return new Promise((ok, erro) => {
    const cru = corpo === undefined ? null : Buffer.isBuffer(corpo) ? corpo : Buffer.from(JSON.stringify(corpo));
    const h = { 'x-teste-quem': quem, ...(cru ? { 'content-length': cru.length } : {}), ...(cru && !Buffer.isBuffer(corpo) ? { 'content-type': 'application/json' } : {}), ...cabecalhos };
    const req = http.request({ host: '127.0.0.1', port: servidor.address().port, path: caminho, method: metodo, headers: h, agent: false }, (res) => {
      const pedacos = [];
      res.on('data', (c) => pedacos.push(c));
      res.on('end', () => {
        const bruto = Buffer.concat(pedacos);
        let j = null;
        try {
          j = JSON.parse(bruto.toString('utf8'));
        } catch {}
        ok({ status: res.statusCode, h: res.headers, bruto, j });
      });
    });
    req.on('error', erro);
    req.end(cru ?? undefined);
  });
}

const bytes = (...partes) => Buffer.concat(partes.map((p) => (typeof p === 'string' ? Buffer.from(p, 'latin1') : Buffer.from(p))));
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], [0, 0, 0, 13], 'IHDR', [0, 0, 4, 56, 0, 0, 5, 70, 8, 6, 0, 0, 0], Buffer.alloc(64, 7));
const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0], 'JFIF', Buffer.alloc(64, 3));
const PDF = bytes('%PDF-1.7\n', Buffer.alloc(64, 1));
const HTML = bytes('<!DOCTYPE html><html><body>oi</body></html>');
const exportar = (id, conteudo, { pagina = '1', formato = 'png', quem = 'time' } = {}) => pedir(`/api/estudio/docs/${id}/exportacoes`, {
  metodo: 'POST', quem, corpo: conteudo, cabecalhos: { 'content-type': 'application/octet-stream', ...(pagina != null ? { 'x-pagina': pagina } : {}), ...(formato ? { 'x-formato': formato } : {}) },
});
const pagTexto = (texto, extra = {}) => ({ tipo: 'texto', texto, x: 72, y: 200, largura: 900, altura: 200, tamanho: 64, peso: 700, ...extra });
const docSimples = (extra = {}) => ({ titulo: 'Design de teste', formato: 'feed45', paginas: [{ camadas: [pagTexto('Uma ideia por página')] }], ...extra });
const criar = async (corpo, quem = 'time') => {
  const r = await pedir('/api/estudio/docs', { metodo: 'POST', quem, corpo });
  assert.equal(r.status, 201, JSON.stringify(r.j));
  return r.j;
};
const pecaDoBanco = async (id) => {
  const db = await carregar();
  return db.reels.find((r) => r.id === id) ?? db.stories.find((s) => s.id === id);
};

// a limpeza só depois do último await do topo (o node:test roda os after do topo quando os testes de cima acabam)
after(() => rmSync(raiz, { recursive: true, force: true }));

// ---------- validação ----------

test('validação: limites de páginas, camadas, texto e números; cores, fontes e peso; asset que existe', async () => {
  const db = await carregar();
  const assets = new Map(ASSETS.map((a) => [a.id, a]));
  const v = (b, extra = {}) => estudio.validarDocumento(b, { db, assets, ...extra });
  const falha = (b, re) => assert.throws(() => v(b), (e) => e.status === 400 && re.test(e.message), `esperava ${re}`);
  const pagina = (camadas) => ({ camadas });
  falha({ paginas: Array.from({ length: 21 }, () => pagina([])) }, /no máximo 20/);
  falha({ paginas: [pagina(Array.from({ length: 81 }, () => pagTexto('a')))] }, /no máximo 80 camadas/);
  falha({ paginas: [pagina([pagTexto('x'.repeat(2001))])] }, /passa de 2000 caracteres/);
  falha({ paginas: [pagina([pagTexto('a', { x: Infinity })])] }, /x: precisa ser um número/);
  falha({ paginas: [pagina([pagTexto('a', { x: Number.NaN })])] }, /x: precisa ser um número/);
  falha({ paginas: [pagina([pagTexto('a', { y: 10001 })])] }, /y: vai de -10000 a 10000/);
  falha({ paginas: [pagina([pagTexto('a', { cor: 'red' })])] }, /#rgb, #rrggbb ou #rrggbbaa/);
  falha({ paginas: [pagina([pagTexto('a', { cor: '#12345' })])] }, /#rgb, #rrggbb ou #rrggbbaa/);
  falha({ paginas: [pagina([pagTexto('a', { fonte: 'Inter' })])] }, /Sora ou DM Serif Display/);
  falha({ paginas: [pagina([pagTexto('a', { peso: 900 })])] }, /peso: vai de 400 a 800/);
  falha({ paginas: [pagina([{ tipo: 'video', x: 0, y: 0, largura: 1, altura: 1 }])] }, /texto, imagem ou forma/);
  falha({ paginas: [pagina([{ tipo: 'imagem', assetId: 'ast_nao', x: 0, y: 0, largura: 10, altura: 10 }])] }, /não existe no banco \(ast_nao\)/);
  falha({ paginas: [{ fundo: { tipo: 'imagem' }, camadas: [] }] }, /fundo de imagem precisa de um asset/);
  falha({ formato: 'personalizado' }, /personalizado precisa de largura e altura/);
  falha({ pecaId: 'reel_nao_existe' }, /Essa peça não existe/);
  falha({ estrategia: { pilar: 99 } }, /pilar 99 não existe/);
  // o problema diz onde: página e camada (com o nome)
  falha({ paginas: [pagina([]), pagina([pagTexto('a', { nome: 'Título', tamanho: -3 })])] }, /página 2, camada 1 \("Título"\), tamanho/);

  const ok = v({
    titulo: `Capa ${TRACO} teste`, formato: 'stories', largura: 500, altura: 500,
    paginas: [{ fundo: { tipo: 'gradiente', cor: '#ABC', cor2: '#11223344' }, camadas: [
      pagTexto(`Abrir empresa ${TRACO} sem drama ${MEIA} 30${TRACO}35 dias`, { nome: `Nome ${TRACO} x`, rotacao: 450 }),
      pagTexto('Ênfase', { fonte: 'DM Serif Display', peso: 800, italico: true }),
      { tipo: 'imagem', assetId: 'ast_oculto', x: 100, y: 100, largura: 100, altura: 100 },
      { tipo: 'forma', x: 0, y: 0, largura: 10, altura: 10 },
    ] }],
    estrategia: { pilar: 5, motivo: `Por que ${TRACO} existe` },
    fontes: [`F051 ${TRACO} 05-MEI`],
  });
  assert.equal(ok.titulo, 'Capa, teste');
  assert.deepEqual([ok.largura, ok.altura], [1080, 1920], 'stories tem o tamanho travado');
  const [t, serif, img, forma] = ok.paginas[0].camadas;
  assert.equal(t.texto, 'Abrir empresa, sem drama, 30-35 dias');
  assert.equal(t.nome, 'Nome, x');
  assert.equal(t.rotacao, 90);
  assert.ok(!TEM_TRACO.test(JSON.stringify(ok)), 'nenhum travessão sobra');
  assert.equal(serif.peso, 400, 'DM Serif Display só tem o 400');
  assert.equal(ok.paginas[0].fundo.cor, '#abc');
  assert.equal(ok.paginas[0].fundo.cor2, '#11223344');
  assert.equal(img.nome, 'Asset oculto', 'asset oculto existe e dá o nome da camada');
  assert.equal(forma.nome, 'Retângulo');
  assert.deepEqual([t.opacidade, t.travada, t.oculta, t.alinhamento, t.caixa, t.fundo], [1, false, false, 'esquerda', 'normal', null]);
  assert.equal(ok.estrategia.bloco, 'Educação', 'o bloco acompanha o pilar');
  assert.deepEqual(ok.fontes, ['F051-05-MEI'], 'entre números o travessão vira hífen (semTracos)');
  assert.ok(new Set(ok.paginas.flatMap((p) => [p.id, ...p.camadas.map((c) => c.id)])).size === 5, 'ids únicos');
  // a cor que o editor manda em rgb(), rgba(), hsl(), #rgba ou transparent vira hex
  const cores = v({ paginas: [{ fundo: { tipo: 'cor', cor: 'rgb(255, 0, 0)', cor2: 'hsl(0, 100%, 50%)' }, camadas: [
    { tipo: 'imagem', assetId: 'ast_leo', x: 0, y: 0, largura: 80, altura: 120, sombra: { cor: 'rgba(27,30,36,0.22)', desfoque: 24, x: 0, y: 18 } },
    pagTexto('a', { cor: '#ABCD', corDestaque: 'transparent', fundo: { cor: 'rgba(242, 100, 60, 50%)' } }),
  ] }] });
  assert.deepEqual([cores.paginas[0].fundo.cor, cores.paginas[0].fundo.cor2], ['#ff0000', '#ff0000']);
  assert.equal(cores.paginas[0].camadas[0].sombra.cor, '#1b1e2438');
  assert.deepEqual([cores.paginas[0].camadas[1].cor, cores.paginas[0].camadas[1].corDestaque, cores.paginas[0].camadas[1].fundo.cor], ['#aabbccdd', '#00000000', '#f2643c80']);
  falha({ paginas: [pagina([pagTexto('a', { cor: 'rgb(300, 0, 0)' })])] }, /#rgb, #rrggbb ou #rrggbbaa/);
  const pers = v({ formato: 'personalizado', largura: 1200, altura: 628 });
  assert.deepEqual([pers.largura, pers.altura, pers.paginas.length], [1200, 628, 1]);
  // asset que sumiu do banco mas já estava no design segue valendo
  const atual = { paginas: [{ camadas: [{ tipo: 'imagem', assetId: 'ast_sumiu' }] }] };
  assert.equal(v({ paginas: [pagina([{ tipo: 'imagem', assetId: 'ast_sumiu', x: 0, y: 0, largura: 5, altura: 5 }])] }, { atual }).paginas[0].camadas[0].assetId, 'ast_sumiu');
});

test('área segura, caixa do texto e colisão', () => {
  assert.deepEqual(estudio.areaSegura({ formato: 'stories', largura: 1080, altura: 1920 }), { topo: 240, base: 360, esquerda: 96, direita: 96, x: 96, y: 240, largura: 888, altura: 1320 });
  assert.equal(estudio.areaSegura({ formato: 'feed45', largura: 1080, altura: 1350 }).altura, 1206);
  assert.equal(estudio.areaSegura({ formato: 'personalizado', largura: 2160, altura: 2160 }).x, 144);
  const t = { tipo: 'texto', texto: 'uma frase comprida que precisa quebrar em várias linhas', x: 0, y: 0, largura: 300, altura: 40, tamanho: 40, alturaLinha: 1.2, espacamentoLetra: 0, peso: 400, fonte: 'Sora' };
  assert.ok(estudio.alturaEstimada(t) >= 3 * 48, 'o texto quebra em linhas');
  const cartao = { tipo: 'forma', forma: 'retangulo', x: 0, y: 0, largura: 500, altura: 500 };
  const dentro = { ...t, x: 50, y: 50, largura: 400, altura: 300 };
  assert.equal(estudio.colisoes({ camadas: [cartao, dentro] }).length, 0, 'cartão atrás que contém o texto não é colisão');
  assert.equal(estudio.colisoes({ camadas: [dentro, cartao] }).length, 1, 'forma na frente do texto é colisão');
  // a conferência olha a tinta do texto (linha a linha, na largura estimada): caixas justas uma embaixo da outra não
  // colidem, e o ícone ao lado da linha curta de uma caixa larga também não
  const curto = { ...t, texto: 'Curto', altura: 48 };
  assert.equal(estudio.colisoes({ camadas: [{ ...curto, y: 0 }, { ...curto, y: 50 }] }).length, 0, 'uma linha embaixo da outra');
  assert.equal(estudio.colisoes({ camadas: [{ ...t, y: 0, altura: 100 }, { ...t, y: 60 }] }).length, 1, 'texto sobre texto');
  assert.equal(estudio.colisoes({ camadas: [{ ...t, y: 0 }, { ...curto, y: 60 }] }).length, 1, 'o texto que não cabe na caixa desce e atravessa o de baixo');
  assert.equal(estudio.colisoes({ camadas: [{ ...t, y: 0, altura: 100 }, { ...t, y: 60, oculta: true }] }).length, 0, 'camada oculta não conta');
  const larga = { ...t, texto: 'Oi\numa segunda linha bem comprida', largura: 900, altura: 100, tamanho: 40 };
  const icone = { tipo: 'imagem', assetId: 'ast_leo', x: 300, y: 0, largura: 40, altura: 40 };
  assert.equal(estudio.colisoes({ camadas: [larga, icone] }).length, 0, 'ícone ao lado da linha curta');
  assert.equal(estudio.colisoes({ camadas: [larga, { ...icone, y: 50 }] }).length, 1, 'ícone em cima da linha comprida');
});

// ---------- CRUD, versão e 409 ----------

test('CRUD: criar, listar, ler, editar com a versão (409), duplicar e apagar', async () => {
  const d = await criar({ ...docSimples({ titulo: `Capa ${TRACO} teste` }), id: 'est_inventado', versao: 9, origem: 'ia', criadoPor: 'Outro' });
  assert.match(d.id, /^est_[0-9a-f]{8}$/);
  assert.deepEqual([d.titulo, d.versao, d.origem, d.criadoPor, d.atualizadoPor], ['Capa, teste', 1, 'manual', 'Pedro Melo', 'Pedro Melo']);
  assert.deepEqual([d.largura, d.altura, d.areaSegura.x, d.areaSegura.altura], [1080, 1350, 72, 1206]);
  assert.ok(d.revisao && d.revisao.textos && Array.isArray(d.revisao.design), 'revisão gravada');
  assert.ok(existsSync(path.join(dados, 'estudio', 'docs', `${d.id}.json`)), 'arquivo do design');

  const lista = await pedir('/api/estudio/docs');
  assert.equal(lista.status, 200);
  const item = lista.j.docs.find((x) => x.id === d.id);
  assert.ok(item.capa && item.nPaginas === 1 && item.capa.camadas.length === 1, 'a lista leva a capa pra miniatura');

  assert.equal((await pedir(`/api/estudio/docs/${d.id}`)).j.titulo, 'Capa, teste');
  assert.equal((await pedir('/api/estudio/docs/est_nao_existe')).status, 404);
  assert.equal((await pedir('/api/estudio/docs/qualquer')).status, 404);

  const semVersao = await pedir(`/api/estudio/docs/${d.id}`, { metodo: 'PUT', corpo: { titulo: 'Sem versão' } });
  assert.equal(semVersao.status, 400);
  const ed = await pedir(`/api/estudio/docs/${d.id}`, { metodo: 'PUT', quem: 'outro', corpo: { versao: 1, titulo: 'Novo título', origem: 'ia', criadoPor: 'X' } });
  assert.equal(ed.status, 200, JSON.stringify(ed.j));
  assert.deepEqual([ed.j.versao, ed.j.titulo, ed.j.origem, ed.j.criadoPor, ed.j.atualizadoPor, ed.j.paginas.length], [2, 'Novo título', 'manual', 'Pedro Melo', 'Pedro Maia', 1]);
  const conflito = await pedir(`/api/estudio/docs/${d.id}`, { metodo: 'PUT', corpo: { versao: 1, titulo: 'Atrasado' } });
  assert.equal(conflito.status, 409);
  assert.equal(conflito.j.erro, 'Alguém mexeu neste design: recarregue');
  assert.equal(conflito.j.versaoAtual, 2);
  const invalido = await pedir(`/api/estudio/docs/${d.id}`, { metodo: 'PUT', corpo: { versao: 2, paginas: [{ camadas: [pagTexto('a', { cor: 'azul' })] }] } });
  assert.equal(invalido.status, 400);
  assert.ok(Array.isArray(invalido.j.problemas) && invalido.j.problemas.length, 'a lista dos problemas vai junto');
  assert.equal((await pedir(`/api/estudio/docs/${d.id}`)).j.versao, 2, 'o inválido não gravou');

  const dup = await pedir(`/api/estudio/docs/${d.id}/duplicar`, { metodo: 'POST' });
  assert.equal(dup.status, 201);
  assert.notEqual(dup.j.id, d.id);
  assert.deepEqual([dup.j.titulo, dup.j.versao, dup.j.duplicadoDe, dup.j.origem], ['Novo título (cópia)', 1, d.id, 'manual']);
  assert.notEqual(dup.j.paginas[0].camadas[0].id, ed.j.paginas[0].camadas[0].id, 'a cópia ganha ids novos');

  assert.deepEqual((await pedir(`/api/estudio/docs/${dup.j.id}`, { metodo: 'DELETE' })).j, { ok: true, lixeira: true });
  assert.equal((await pedir(`/api/estudio/docs/${dup.j.id}`)).status, 404);
  assert.ok(!existsSync(path.join(dados, 'estudio', 'docs', `${dup.j.id}.json`)));
  assert.ok(!existsSync(path.join(dados, 'estudio', 'versoes', dup.j.id)), 'as versões saem junto');
  assert.equal((await pedir('/api/estudio/docs', { metodo: 'PATCH' })).status, 405);
});

test('versões: guarda as 20 últimas e restaura uma (que vira a versão nova)', async () => {
  const d = await criar(docSimples({ titulo: 'v1' }));
  // duas pessoas se revezando: cada gravação é uma versão na lista
  for (let n = 2; n <= 25; n++) {
    const r = await pedir(`/api/estudio/docs/${d.id}`, { metodo: 'PUT', quem: n % 2 ? 'time' : 'outro', corpo: { versao: n - 1, titulo: `v${n}` } });
    assert.equal(r.status, 200);
  }
  const vs = await pedir(`/api/estudio/docs/${d.id}/versoes`);
  assert.equal(vs.j.atual, 25);
  assert.equal(vs.j.versoes.length, 20);
  assert.deepEqual([vs.j.versoes[0].versao, vs.j.versoes.at(-1).versao, vs.j.versoes[0].atual], [25, 6, true]);
  assert.equal(readdirSync(path.join(dados, 'estudio', 'versoes', d.id)).filter((n) => /^\d+\.json$/.test(n)).length, 20);
  const velha = await pedir(`/api/estudio/docs/${d.id}/versoes/3/restaurar`, { metodo: 'POST' });
  assert.equal(velha.status, 404);
  const conflito = await pedir(`/api/estudio/docs/${d.id}/versoes/10/restaurar`, { metodo: 'POST', corpo: { versao: 7 } });
  assert.equal(conflito.status, 409);
  const r = await pedir(`/api/estudio/docs/${d.id}/versoes/10/restaurar`, { metodo: 'POST', corpo: { versao: 25 } });
  assert.equal(r.status, 200, JSON.stringify(r.j));
  assert.deepEqual([r.j.versao, r.j.titulo], [26, 'v10']);
  const depois = await pedir(`/api/estudio/docs/${d.id}/versoes`);
  assert.equal(depois.j.versoes[0].nota, 'Restaurado da versão 10');
  assert.equal(depois.j.versoes.length, 20);

  // o salvamento automático da mesma pessoa, seguido, vira uma versão só na lista (a versão do design sobe sempre)
  const s = await criar(docSimples({ titulo: 's1' }));
  for (let n = 2; n <= 6; n++) assert.equal((await pedir(`/api/estudio/docs/${s.id}`, { metodo: 'PUT', corpo: { versao: n - 1, titulo: `s${n}` } })).status, 200);
  const juntas = (await pedir(`/api/estudio/docs/${s.id}/versoes`)).j;
  assert.equal(juntas.atual, 6);
  assert.deepEqual(juntas.versoes.map((v) => [v.versao, v.nota]), [[6, 'Editado'], [1, 'Criado']]);
  assert.equal(readdirSync(path.join(dados, 'estudio', 'versoes', s.id)).filter((n) => /^\d+\.json$/.test(n)).length, 2, 'os arquivos do meio saem');
  assert.equal((await pedir(`/api/estudio/docs/${s.id}`, { metodo: 'PUT', quem: 'outro', corpo: { versao: 6, titulo: 's7' } })).status, 200);
  assert.equal((await pedir(`/api/estudio/docs/${s.id}/versoes`)).j.versoes.length, 3, 'outra pessoa abre versão nova');
  assert.equal((await pedir(`/api/estudio/docs/${s.id}/versoes/6/restaurar`, { metodo: 'POST' })).j.titulo, 's6');
});

// ---------- semeadura ----------

test('semeadura: a base vira design uma vez; semente mudada atualiza só o design intocado; apagado não volta', async () => {
  const lista = (await pedir('/api/estudio/docs')).j.docs;
  const d = lista.find((x) => x.id === 'est_destaque_1');
  assert.ok(d, 'a semente entrou com o id dela');
  assert.equal(d.origem, 'importado');
  assert.ok(!lista.some((x) => x.titulo === 'Quebrada'), 'a semente com asset inexistente não entrou');
  const cheio = (await pedir('/api/estudio/docs/est_destaque_1')).j;
  assert.equal(cheio.origemArquivo, 'estudio/base/docs/destaque.json');
  assert.equal(cheio.paginas[0].camadas[0].texto, 'Comece, por aqui', 'travessão da semente vira vírgula');
  assert.equal(cheio.paginas[0].fundo.cor, '#faf8f5');
  assert.equal(await estudio.semear(), 0, 'rodar de novo não duplica');
  assert.equal((await pedir('/api/estudio/docs')).j.docs.filter((x) => x.origem === 'importado').length, 1);

  writeFileSync(SEMENTE, JSON.stringify(semente('Comece por aqui v2')));
  assert.equal(await estudio.semear(), 1);
  const v2 = (await pedir('/api/estudio/docs/est_destaque_1')).j;
  assert.deepEqual([v2.titulo, v2.versao, v2.atualizadoPor], ['Comece por aqui v2', 2, 'Base do estúdio']);

  const ed = await pedir('/api/estudio/docs/est_destaque_1', { metodo: 'PUT', corpo: { versao: 2, titulo: 'Léo maior' } });
  assert.equal(ed.status, 200);
  writeFileSync(SEMENTE, JSON.stringify(semente('Comece por aqui v3')));
  assert.equal(await estudio.semear(), 0);
  assert.equal((await pedir('/api/estudio/docs/est_destaque_1')).j.titulo, 'Léo maior', 'o que a equipe editou fica');

  // depois de um "boot" (memória zerada, arquivos ficam), nada duplica
  await estudio.reiniciarParaTeste();
  assert.equal((await pedir('/api/estudio/docs')).j.docs.filter((x) => x.origem === 'importado').length, 1);

  assert.equal((await pedir('/api/estudio/docs/est_destaque_1', { metodo: 'DELETE' })).status, 200);
  writeFileSync(SEMENTE, JSON.stringify(semente('Comece por aqui v4')));
  assert.equal(await estudio.semear(), 0);
  assert.equal((await pedir('/api/estudio/docs/est_destaque_1')).status, 404, 'apagado pela equipe não volta');
});

// ---------- exportações ----------

test('exportação: tipo pelos bytes, formato e página, teto, nome no download e arquivo servido com nosniff', async () => {
  const d = await criar({ titulo: 'Arte solta', formato: 'feed45', paginas: [{ camadas: [pagTexto('Página 1')] }, { camadas: [pagTexto('Página 2')] }] });
  const png = await exportar(d.id, PNG, { pagina: '2' });
  assert.equal(png.status, 201, JSON.stringify(png.j));
  assert.match(png.j.id, /^exp_/);
  assert.deepEqual([png.j.pagina, png.j.formato, png.j.tipo, png.j.tamanho, png.j.anexo.anexada], [2, 'png', 'image/png', PNG.length, false]);
  const arq = await pedir(png.j.url);
  assert.equal(arq.status, 200);
  assert.equal(arq.h['content-type'], 'image/png');
  assert.equal(arq.h['x-content-type-options'], 'nosniff');
  assert.ok(arq.bruto.equals(PNG));
  const nome = decodeURIComponent(arq.h['content-disposition'].split("''")[1]);
  assert.equal(nome, 'Arte solta (página 2).png');
  assert.match(arq.h['content-disposition'], /^inline;/);
  assert.match((await pedir(`${png.j.url}?baixar=1`)).h['content-disposition'], /^attachment;/);

  assert.equal((await exportar(d.id, HTML)).status, 415);
  const mentira = await exportar(d.id, JPEG, { formato: 'png' });
  assert.equal(mentira.status, 415);
  assert.match(mentira.j.erro, /não é PNG/);
  assert.equal((await exportar(d.id, JPEG, { formato: 'jpg' })).j.formato, 'jpg');
  assert.equal((await exportar(d.id, PNG, { pagina: 'todas', formato: 'png' })).status, 400, 'PNG é uma página por arquivo');
  assert.equal((await exportar(d.id, PNG, { pagina: 'todas', formato: null })).status, 400);
  assert.equal((await exportar(d.id, PNG, { pagina: '3' })).status, 400);
  assert.equal((await exportar(d.id, PNG, { pagina: null })).status, 400, 'design de 2 páginas pede a página');
  assert.equal((await exportar(d.id, PNG, { formato: 'gif' })).status, 400);
  const pdf = await exportar(d.id, PDF, { pagina: 'todas', formato: 'pdf' });
  assert.equal(pdf.status, 201);
  assert.equal(decodeURIComponent((await pedir(pdf.j.url)).h['content-disposition'].split("''")[1]), 'Arte solta (todas as páginas).pdf');
  const antes = estudio.limites.exportacao;
  estudio.limites.exportacao = 64;
  try {
    assert.equal((await exportar(d.id, Buffer.concat([PNG, Buffer.alloc(200)]))).status, 413);
  } finally {
    estudio.limites.exportacao = antes;
  }
  const temporarios = readdirSync(path.join(dados, 'estudio', 'exportacoes')).filter((n) => n.includes('.tmp'));
  assert.deepEqual(temporarios, [], 'nenhum temporário sobra');
  // sem peça: ficam as 10 mais recentes
  for (let i = 0; i < 10; i++) assert.equal((await exportar(d.id, PNG, { pagina: '1' })).status, 201);
  const exps = (await pedir(`/api/estudio/docs/${d.id}/exportacoes`)).j.exportacoes;
  assert.equal(exps.length, 10);
  assert.equal((await pedir(png.j.url)).status, 404, 'a mais antiga saiu do disco');
  assert.equal((await pedir('/api/estudio/exportacoes/exp_nao_existe/arquivo')).status, 404);
});

test('exportação com peça: vira arte da peça, substitui a mesma página e formato e mexe na aprovação', async () => {
  const d = await criar({ titulo: 'Arte do carrossel', formato: 'feed45', pecaId: 'reel_aprovado', paginas: [{ camadas: [pagTexto('Capa')] }, { camadas: [pagTexto('Fim')] }] });
  const um = await exportar(d.id, PNG, { pagina: '1' });
  assert.equal(um.status, 201);
  assert.deepEqual([um.j.anexo.anexada, um.j.anexo.aprovacao, um.j.pecaId], [true, 'alterado', 'reel_aprovado']);
  let r = await pecaDoBanco('reel_aprovado');
  assert.deepEqual(r.artes.map((a) => [a.id, a.docId, a.pagina, a.formato, a.url, a.por]), [[um.j.id, d.id, 1, 'png', `/api/estudio/exportacoes/${um.j.id}/arquivo`, 'Pedro Melo']]);
  assert.equal(r.aprovacao.estado, 'alterado');
  assert.deepEqual([r.aprovacao.conversa.at(-1).tipo, r.aprovacao.conversa.at(-1).mudou, r.aprovacao.conversa.at(-1).autor], ['alterado', ['arte'], 'Pedro Melo']);
  const dois = await exportar(d.id, PNG, { pagina: '1' });
  r = await pecaDoBanco('reel_aprovado');
  assert.deepEqual(r.artes.map((a) => a.id), [dois.j.id], 'a mesma página e formato é substituída');
  assert.deepEqual(dois.j.anexo.substituidas, [um.j.id]);
  assert.equal((await pedir(um.j.url)).status, 404, 'a substituída saiu do disco');
  await exportar(d.id, PDF, { pagina: 'todas', formato: 'pdf' });
  r = await pecaDoBanco('reel_aprovado');
  assert.equal(r.artes.length, 2);
  // a arte é do servidor: a edição da peça pela tela não mexe nela
  assert.ok(!('artes' in conferirReel({ artes: [], ideia: 'x' })), 'conferirReel tira artes do corpo');

  // pendente que todos os gerentes aprovaram: volta pros gerentes, com as aprovações zeradas
  const p = await criar(docSimples({ titulo: 'Arte pendente', pecaId: 'reel_pendente' }));
  const ep = await exportar(p.id, PNG);
  assert.equal(ep.status, 201);
  const pend = await pecaDoBanco('reel_pendente');
  assert.deepEqual([pend.aprovacao.estado, pend.aprovacao.etapa, pend.aprovacao.gerentes.aprovaram], ['pendente', 'gerentes', []]);
  assert.match(pend.aprovacao.conversa.at(-1).texto, /volta pros gerentes/);

  // peça postada não ganha arte
  const post = await criar(docSimples({ titulo: 'Arte atrasada', pecaId: 'reel_postado' }));
  const ex = await exportar(post.id, PNG);
  assert.equal(ex.j.anexo.anexada, false);
  assert.match(ex.j.anexo.aviso, /já foi postada/);
  assert.ok(!(await pecaDoBanco('reel_postado')).artes);

  // stories do dia
  const st = await criar({ titulo: 'Arte dos stories', formato: 'stories', pecaId: 'sto_1', paginas: [{ camadas: [pagTexto('Oi', { x: 96, y: 300, largura: 800 })] }] });
  const es = await exportar(st.id, JPEG, { formato: 'jpg' });
  assert.equal(es.j.anexo.tipo, 'stories');
  assert.equal((await pecaDoBanco('sto_1')).artes[0].id, es.j.id);
  // o design da peça apagado: a arte anexada fica
  assert.equal((await pedir(`/api/estudio/docs/${st.id}`, { metodo: 'DELETE' })).status, 200);
  assert.equal((await pedir(es.j.url)).status, 200);
});

test('Diretor contábil: só o arquivo da arte anexada numa peça que ele vê', async () => {
  const diretor = USUARIOS.diretor;
  assert.equal(auth.podeApi(diretor, 'GET', '/api/estudio/exportacoes/exp_abc/arquivo'), true);
  assert.equal(auth.podeApi(diretor, 'HEAD', '/api/estudio/exportacoes/exp_abc/arquivo'), false);
  for (const [m, c] of [['GET', '/api/estudio/docs'], ['POST', '/api/estudio/gerar'], ['GET', '/api/estudio/assets'], ['GET', '/api/estudio/mecanismo'], ['GET', '/api/estudio/docs/est_x/exportacoes']]) {
    assert.equal(auth.podeApi(diretor, m, c), false, `${m} ${c}`);
  }
  assert.equal(auth.podeApi(USUARIOS.outro, 'POST', '/api/estudio/gerar'), true, 'o operador usa o estúdio');
  assert.equal((await pedir('/api/estudio/docs', { quem: 'diretor' })).status, 403);

  const arte = (await pecaDoBanco('reel_aprovado')).artes[0];
  const ok = await pedir(arte.url, { quem: 'diretor' });
  assert.equal(ok.status, 200, 'peça alterada na etapa dele: vê');
  const pend = await pedir((await pecaDoBanco('reel_pendente')).artes[0].url, { quem: 'diretor' });
  assert.equal(pend.status, 404, 'peça de volta com os gerentes: não vê');
  const solta = await criar(docSimples({ titulo: 'Sem peça' }));
  const exp = await exportar(solta.id, PNG);
  assert.equal((await pedir(exp.j.url, { quem: 'diretor' })).status, 404, 'arte sem peça: não vê');
  assert.equal((await pedir(exp.j.url)).status, 200, 'o time vê');
});

// ---------- geração com IA falsa ----------

const camada = (tipo, extra = {}) => ({
  tipo, nome: '', x: 72, y: 72, largura: 300, altura: 100, rotacao: 0, opacidade: 1, texto: '', fonte: 'Sora', peso: 700, italico: false, tamanho: 48,
  cor: '#1b1e24', corDestaque: '#f2643c', alinhamento: 'esquerda', alturaLinha: 1.1, espacamentoLetra: 0, caixa: 'normal',
  pilula: { ativa: false, cor: '', raio: 0, padding: 0 }, assetId: '', espelhar: false, raio: 0, forma: 'retangulo', borda: { ativa: false, cor: '', largura: 0 }, ...extra,
});
const fundoPapel = { tipo: 'cor', cor: '#faf8f5', cor2: '#f1eee9', angulo: 160, assetId: '', ajuste: 'cobrir' };
const ESTRATEGIA_IA = { pilar: 4, motivo: 'A IA escolheu este motivo.', gatilhoEmocional: 'Cansaço da burocracia', gatilhoPsicologico: 'identificação' };
// 1ª tentativa: o Mauro (bloqueante), texto sobre texto, fora da área segura, visto escrito e um asset inventado
const TENTATIVA_1 = {
  titulo: `Mito do cartório ${TRACO} capa`, ganchoOrigem: 'G20', estrategia: ESTRATEGIA_IA, fontes: [], observacoes: '',
  paginas: [
    { fundo: fundoPapel, camadas: [
      camada('texto', { nome: 'Gancho', texto: `Abrir empresa ${TRACO} sem drama`, y: 200, largura: 900, altura: 120, tamanho: 80, peso: 800 }),
      camada('texto', { nome: 'Apoio', texto: 'Fala com o Mauro', y: 250, largura: 900, altura: 100, tamanho: 40 }),
      camada('imagem', { nome: 'Inventado', assetId: 'ast_inventado', x: 500, y: 600, largura: 300, altura: 300 }),
      camada('texto', { nome: 'Selo', texto: '✓ Tudo pelo app', x: 20, y: 1000, largura: 500, altura: 60, tamanho: 40 }),
    ] },
    { fundo: fundoPapel, camadas: [camada('texto', { nome: 'Final', texto: 'Salva pra lembrar', y: 300, largura: 800, altura: 120, tamanho: 64 })] },
  ],
};
// 2ª tentativa: limpa, mas o apoio ainda encosta no gancho (o código afasta)
const TENTATIVA_2 = {
  titulo: 'Mito do cartório', ganchoOrigem: 'G20', estrategia: ESTRATEGIA_IA, fontes: ['F051 · 05-MEI'], observacoes: 'Capa com o gancho G20.',
  paginas: [
    { fundo: fundoPapel, camadas: [
      camada('texto', { nome: 'Gancho', texto: 'Abrir empresa sem drama', y: 200, largura: 900, altura: 120, tamanho: 80, peso: 800 }),
      camada('texto', { nome: 'Apoio', texto: 'Tudo pelo app, você só assina', y: 330, largura: 900, altura: 80, tamanho: 40 }),
      camada('imagem', { nome: 'Léo', assetId: 'ast_leo', x: 600, y: 700, largura: 300, altura: 450 }),
      camada('imagem', { nome: 'Visto', assetId: 'ast_simbolo', x: 72, y: 1100, largura: 80, altura: 80 }),
      camada('texto', { nome: 'Selo', texto: 'Feito pelo app', x: 180, y: 1110, largura: 380, altura: 60, tamanho: 40 }),
    ] },
    { fundo: fundoPapel, camadas: [camada('texto', { nome: 'Final', texto: 'Salva pra lembrar', y: 300, largura: 800, altura: 120, tamanho: 64 })] },
  ],
};
// sem nada pra refazer: o apoio já fica abaixo do gancho
const TENTATIVA_LIMPA = structuredClone(TENTATIVA_2);
TENTATIVA_LIMPA.paginas[0].camadas[1].y = 420;
function iaFalsa(respostas, { esperar = null } = {}) {
  const chamadas = [];
  let avisar;
  const chamou = new Promise((ok) => { avisar = ok; });
  const fn = async (args) => {
    chamadas.push(args);
    avisar();
    if (esperar) await esperar;
    const r = respostas[Math.min(chamadas.length - 1, respostas.length - 1)];
    return { dados: structuredClone(typeof r === 'function' ? r(args) : r), custo: 0.01 };
  };
  return { fn, chamadas, chamou };
}

test('gerar: sem IA é 503 e nada grava; pedido torto é 400', async () => {
  estudio.definirIa(null);
  const antes = (await pedir('/api/estudio/docs')).j.docs.length;
  const r = await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'Um post sobre MEI', formato: 'feed45', paginas: 1 } });
  assert.equal(r.status, 503);
  assert.equal(r.j.erro, MSG_SEM_IA);
  assert.equal((await pedir('/api/estudio/docs')).j.docs.length, antes);
  assert.equal((await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { formato: 'feed45' } })).status, 400, 'sem brief e sem peça');
  assert.equal((await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'x', paginas: 21 } })).status, 400);
  assert.equal((await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'x', pecaId: 'reel_nao' } })).status, 400);
  assert.equal((await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'x', formato: 'personalizado' } })).status, 400);
  assert.equal((await pedir('/api/estudio/gerar', { metodo: 'GET' })).status, 405);
});

test('gerar: o prompt junta design system, assets, skills, estratégia e mecanismo; refaz uma vez e corrige o resto', async () => {
  const ia = iaFalsa([TENTATIVA_1, TENTATIVA_2]);
  estudio.definirIa(ia.fn);
  try {
    const r = await pedir('/api/estudio/gerar', { metodo: 'POST', quem: 'outro', corpo: { brief: 'Capa do mito do cartório', pecaId: 'reel_aprovado', paginas: 2 } });
    assert.equal(r.status, 200, JSON.stringify(r.j));
    assert.equal(ia.chamadas.length, 2, 'refez uma vez');
    const [p1, p2] = ia.chamadas;
    assert.deepEqual([p1.etapa, p2.etapa], ['design', 'refazer']);
    // o que a IA leu
    assert.match(p1.sistema, /Identidade visual/, 'design-guide');
    assert.match(p1.sistema, /<skill_carrossel arquivo="\.claude\/skills\/carrossel\/SKILL\.md">/);
    assert.match(p1.sistema, /<estrategia_no_carrossel/);
    assert.match(p1.sistema, /<banco_de_ganchos_curado/);
    // 22/10 (Pedro): o banco numerado de 1000 (o "banco N"), a escada de CTA, a paleta e o Léo na arte (sem o P39); a
    // skill de stories só no design de stories
    assert.match(p1.sistema, /<banco_de_ganchos_numerado arquivo="\.claude\/skills\/reels-leo\/references\/banco-1000-ganchos\.md">/);
    assert.match(p1.sistema, /<escada_de_cta/);
    assert.match(p1.sistema, /<paleta_da_marca/);
    assert.match(p1.sistema, /<leo_na_arte/);
    assert.ok(!/<leo_na_arte[^>]*>[^<]*\bLegalize\b/.test(p1.sistema), 'o Léo na arte sem o escritório (P39)');
    assert.ok(!p1.sistema.includes('<stories_leo'), 'feed não leva a skill de stories');
    assert.match(p1.sistema, /<estrategia_na_peca/);
    assert.match(p1.sistema, /<estrategia_principal/);
    assert.match(p1.sistema, /ast_leo · Léo acenando · leo · 800x1200/);
    assert.match(p1.sistema, /ast_simbolo .*O SÍMBOLO DA MARCA/);
    assert.ok(!p1.sistema.includes('ast_oculto'), 'asset oculto não vai pro catálogo da IA');
    assert.match(p1.sistema, /Margem de segurança/);
    assert.match(p1.sistema, /Nada atravessa nada/);
    assert.match(p1.sistema, /Base contábil|base contábil/);
    assert.match(p1.prompt, /<peca_do_cronograma>[\s\S]*Mito: abrir empresa exige cartório[\s\S]*Motivo \(a defesa\): Mito de burocracia/);
    assert.match(p1.prompt, /<mecanismo_da_semana>[\s\S]*Semana de/);
    assert.match(p1.prompt, /<designs_recentes>/);
    assert.match(p1.prompt, /Área segura deste design: x de 72 a 1008 e y de 72 a 1278/);
    assert.equal(p1.schema, estudio.SCHEMA_IA);
    // o que voltou pra refazer
    assert.match(p2.prompt, /<tentativa_anterior>/);
    assert.match(p2.prompt, /<problemas>[\s\S]*\[bloqueante\] Sem Mauro/);
    assert.match(p2.prompt, /atravessa/);
    assert.match(p2.prompt, /sai da área segura/);
    assert.match(p2.prompt, /visto escrito/);
    assert.match(p2.prompt, /ast_inventado/);

    const d = r.j;
    assert.deepEqual([d.origem, d.versao, d.criadoPor, d.pecaId, d.formato, d.paginas.length], ['ia', 1, 'Pedro Maia', 'reel_aprovado', 'feed45', 2]);
    assert.equal(d.titulo, 'Mito do cartório');
    // a estratégia da peça manda
    assert.deepEqual(d.estrategia, { pilar: 5, bloco: 'Educação', motivo: 'Mito de burocracia que trava a abertura.', gatilhoEmocional: 'cansaço da burocracia', gatilhoPsicologico: 'curiosidade' });
    assert.deepEqual(d.fontes, ['F051 · 05-MEI']);
    assert.match(d.notas, /Gancho: G20/);
    assert.ok(!TEM_TRACO.test(JSON.stringify(d.paginas)), 'sem travessão');
    // o código afastou o apoio do gancho: nada atravessa nada e tudo na área segura
    assert.deepEqual(d.revisao.design.filter((x) => ['colisao', 'area-segura', 'visto', 'simbolo'].includes(x.regra)), []);
    for (const p of d.paginas) assert.equal(estudio.colisoes(p).length, 0);
    const gancho = d.paginas[0].camadas.find((c) => c.nome === 'Gancho');
    const apoio = d.paginas[0].camadas.find((c) => c.nome === 'Apoio');
    assert.ok(apoio.y >= gancho.y + estudio.alturaEstimada(gancho), 'o apoio desceu');
    assert.equal(d.revisao.textos.bloqueia, false);
    assert.equal(d.geracao.tentativas, 2);
    assert.ok(d.geracao.problemasDaPrimeira.length >= 4);
    assert.equal(d.geracao.custo, 0.02);
    assert.equal((await pedir(`/api/estudio/docs/${d.id}`)).j.origem, 'ia', 'gravado');

    // nova versão do mesmo design (docId)
    const ia2 = iaFalsa([TENTATIVA_LIMPA]);
    estudio.definirIa(ia2.fn);
    const conflito = await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'Mais leve', docId: d.id, versao: 9 } });
    assert.equal(conflito.status, 409);
    const nova = await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'Mais leve', docId: d.id, versao: 1 } });
    assert.equal(nova.status, 200, JSON.stringify(nova.j));
    assert.deepEqual([nova.j.id, nova.j.versao, nova.j.origem, nova.j.atualizadoPor], [d.id, 2, 'ia', 'Pedro Melo']);
    assert.match(ia2.chamadas[0].prompt, /<design_atual>[\s\S]*versão 1/);
    assert.equal(ia2.chamadas.length, 1, 'a 2ª tentativa só quando algo falha');
  } finally {
    estudio.definirIa(null);
  }
});

test('gerar sem peça: a estratégia da IA, conferida (pilar guardado fica de fora); uma geração por pessoa', async () => {
  const guardado = { ...TENTATIVA_2, estrategia: { pilar: 6, motivo: 'Motivo da IA.', gatilhoEmocional: 'medo de errar com o fisco', gatilhoPsicologico: 'qualquer coisa' } };
  let liberar;
  const esperar = new Promise((ok) => { liberar = ok; });
  const ia = iaFalsa([guardado], { esperar });
  estudio.definirIa(ia.fn);
  try {
    const primeira = pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'Post sobre o fisco', formato: 'feed45', paginas: 2 } });
    await ia.chamou;
    const segunda = await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'Outro', formato: 'feed45' } });
    assert.equal(segunda.status, 409);
    assert.match(segunda.j.erro, /já tem um design sendo gerado/);
    liberar();
    const r = await primeira;
    assert.equal(r.status, 200, JSON.stringify(r.j));
    assert.deepEqual(r.j.estrategia, { pilar: null, bloco: null, motivo: 'Motivo da IA.', gatilhoEmocional: 'medo de errar com o fisco', gatilhoPsicologico: 'qualquer coisa' });
    assert.ok(r.j.geracao.avisos.some((a) => /pilar 6/.test(a)));
    assert.ok(r.j.geracao.avisos.some((a) => /gatilho psicológico "qualquer coisa"/.test(a)));
    assert.equal(r.j.pecaId, null);
  } finally {
    estudio.definirIa(null);
  }
});

// 23/10 (Pedro: "a skill não está sendo utilizada, ela deve ser ativa toda vez que eu for criar no Ateliê")
test('gerar com a skill (Criar no Ateliê): sem modelo de layout, com o tipo da peça; o gancho do cronograma fica como está', async () => {
  const LONGO = '3 coisas que te disseram sobre abrir empresa e não são verdade';
  const db = await carregar();
  const r = db.reels.find((x) => x.id === 'reel_dia');
  const capaAntes = structuredClone(r.carrossel);
  r.carrossel = { ...r.carrossel, capa: { ...r.carrossel.capa, titulo: LONGO }, slides: [{ titulo: '"Nome sujo impede de abrir CNPJ."', texto: 'Não impede.', visual: '' }] };
  await salvar(db);
  const resposta = {
    titulo: 'Mitos de abrir empresa', ganchoOrigem: '', estrategia: ESTRATEGIA_IA, fontes: [], observacoes: '',
    paginas: [
      { fundo: fundoPapel, camadas: [camada('texto', { nome: 'Gancho', texto: LONGO, y: 200, largura: 900, altura: 420, tamanho: 76, peso: 800 }), camada('texto', { nome: 'Apoio', texto: 'Arrasta pro lado', y: 760, largura: 600, altura: 60, tamanho: 28 })] },
      { fundo: fundoPapel, camadas: [camada('texto', { nome: 'Mito', texto: '"Nome sujo impede de abrir CNPJ."', y: 300, largura: 900, altura: 160, tamanho: 60 }), camada('texto', { nome: 'Resposta', texto: 'Não impede.', y: 560, largura: 900, altura: 60, tamanho: 30 })] },
      { fundo: fundoPapel, camadas: [camada('texto', { nome: 'Final', texto: 'Salva pra lembrar', y: 300, largura: 800, altura: 120, tamanho: 64 })] },
    ],
  };
  const ia = iaFalsa([resposta]);
  estudio.definirIa(ia.fn);
  try {
    const g = await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { pecaId: 'reel_dia', skill: true } });
    assert.equal(g.status, 200, JSON.stringify(g.j));
    const [p1] = ia.chamadas;
    assert.match(p1.prompt, /<skill_no_atelie>[\s\S]*rodando no Ateliê pelo botão "Criar no Ateliê"[\s\S]*Tipo de conteúdo desta peça: mito ou verdade[\s\S]*Variação pela ordem do cronograma/);
    assert.ok(!p1.prompt.includes('<modelo'), 'sem o modelo de layout do repo');
    assert.match(p1.sistema, /<skill_carrossel/);
    assert.match(p1.sistema, /O Léo aparece grande/);
    assert.equal(ia.chamadas.length, 1, 'o gancho longo do cronograma não volta pra IA');
    assert.ok(!g.j.geracao.problemasDaPrimeira.some((p) => /gancho/i.test(p)), JSON.stringify(g.j.geracao.problemasDaPrimeira));
    assert.equal(g.j.pecaId, 'reel_dia');
    assert.ok(!g.j.modeloId);
  } finally {
    estudio.definirIa(null);
    const db2 = await carregar();
    db2.reels.find((x) => x.id === 'reel_dia').carrossel = capaAntes;
    await salvar(db2);
  }
});

// 23/10 (Pedro: "na edição, deixe um chat para pedir a IA para alterar algumas coisas")
test('ajustar-ia: o chat do editor muda só o que o pedido diz, refaz o problema que criou e grava versão nova', async () => {
  const d0 = await criar({ titulo: 'Design do chat', formato: 'feed45', paginas: [
    { camadas: [pagTexto('Abrir empresa sem drama', { nome: 'Gancho', tamanho: 80 }), { tipo: 'imagem', nome: 'Léo', assetId: 'ast_leo', x: 640, y: 700, largura: 300, altura: 450, travada: true }] },
    { camadas: [pagTexto('Salva pra lembrar', { nome: 'Final', y: 300 })] },
  ] });
  const [capa, fim] = d0.paginas;
  const leo = capa.camadas.find((c) => c.nome === 'Léo');
  const gancho = capa.camadas.find((c) => c.nome === 'Gancho');
  // a capa como a IA devolve: o mesmo gancho e o mesmo Léo (pelo id), maior
  const capaIa = (...extra) => ({ numero: 1, fundo: fundoPapel, camadas: [
    camada('texto', { id: gancho.id, nome: 'Gancho', texto: gancho.texto, x: gancho.x, y: gancho.y, largura: gancho.largura, altura: gancho.altura, tamanho: gancho.tamanho, peso: gancho.peso, alturaLinha: gancho.alturaLinha }),
    camada('imagem', { id: leo.id, nome: 'Léo', assetId: 'ast_leo', x: 480, y: 500, largura: 520, altura: 780 }),
    ...extra,
  ] });
  const ajuste = (extra) => ({ resposta: '', titulo: '', ganchoOrigem: '', fontes: [], remover: [], paginas: [], ...extra });
  // 1ª: o Léo maior, mas com o Mauro num texto novo e um asset inventado (o ajuste criou os dois); 2ª: só o Léo maior
  const T1 = ajuste({ resposta: 'Aumentei o Léo.', paginas: [capaIa(camada('texto', { id: '', nome: 'Selo', texto: 'Fala com o Mauro', y: 1000, largura: 400, altura: 60, tamanho: 40 }), camada('imagem', { id: '', nome: 'Inventado', assetId: 'ast_inventado', x: 72, y: 800, largura: 100, altura: 100 }))] });
  const T2 = ajuste({ resposta: 'Aumentei o Léo na capa e deixei o resto como estava.', paginas: [capaIa()] });
  const url = `/api/estudio/docs/${d0.id}/ajustar-ia`;
  estudio.definirIa(null);
  const semIa = await pedir(url, { metodo: 'POST', corpo: { versao: 1, pedido: 'Deixa o Léo maior' } });
  assert.deepEqual([semIa.status, semIa.j.erro], [503, MSG_SEM_IA]);
  const ia = iaFalsa([T1, T2]);
  estudio.definirIa(ia.fn);
  try {
    assert.equal((await pedir(url, { metodo: 'POST', corpo: { versao: 9, pedido: 'Deixa o Léo maior' } })).status, 409, 'versão velha');
    assert.equal((await pedir(url, { metodo: 'POST', corpo: { versao: 1, pedido: ' ' } })).status, 400, 'sem pedido');
    assert.equal((await pedir(url, { metodo: 'GET' })).status, 405);
    assert.equal(ia.chamadas.length, 0);
    const r = await pedir(url, { metodo: 'POST', corpo: { versao: 1, pedido: 'Deixa o Léo maior', pagina: 1, conversa: [{ quem: 'voce', texto: 'Oi' }, { quem: 'ia', texto: 'Oi! O que eu mudo?' }] } });
    assert.equal(r.status, 200, JSON.stringify(r.j));
    assert.equal(ia.chamadas.length, 2, 'refez o problema que o ajuste criou');
    const [p1, p2] = ia.chamadas;
    assert.deepEqual([p1.etapa, p2.etapa], ['ajuste', 'refazer-ajuste']);
    assert.equal(p1.schema, estudio.SCHEMA_AJUSTE);
    // as regras do gerar, mais leve: sem o banco de 1000, a skill e a estratégia inteiras
    assert.match(p1.sistema, /Identidade visual/);
    assert.match(p1.sistema, /Nada atravessa nada/);
    assert.match(p1.sistema, /Base contábil|base contábil/);
    assert.match(p1.sistema, /ast_leo · Léo acenando/);
    assert.ok(!p1.sistema.includes('<banco_de_ganchos_numerado') && !p1.sistema.includes('<skill_carrossel'));
    assert.match(p1.prompt, new RegExp(`<design_atual>[\\s\\S]*"id":"${leo.id}"[^}]*"travada":true`));
    assert.match(p1.prompt, /<conversa_ate_aqui>\nTime: Oi\nIA: Oi! O que eu mudo\?/);
    assert.match(p1.prompt, /<pedido>\nDeixa o Léo maior\n<\/pedido>/);
    assert.match(p1.prompt, /página 1 aberta no editor/);
    assert.match(p2.prompt, /<problemas>[\s\S]*\[bloqueante\] Sem Mauro/);
    assert.match(p2.prompt, /ast_inventado/);

    const d = r.j;
    assert.equal(d.versao, 2);
    assert.equal(d.ajuste.resposta, 'Aumentei o Léo na capa e deixei o resto como estava.');
    assert.deepEqual([d.ajuste.paginas, d.ajuste.custo, d.ajuste.tentativas], [[1], 0.02, 2]);
    const leo2 = d.paginas[0].camadas.find((c) => c.id === leo.id);
    assert.ok(leo2 && leo2.largura === 520 && leo2.travada === true, 'o mesmo Léo, maior e ainda travado');
    assert.equal(d.paginas[0].id, capa.id);
    assert.deepEqual(d.paginas[1], fim, 'a página que o pedido não citou fica igual');
    assert.match(JSON.stringify((await pedir(`/api/estudio/docs/${d.id}/versoes`)).j), /Ajustado pela IA: Deixa o Léo maior/);

    // pergunta: só a resposta, sem versão nova
    const ia2 = iaFalsa([ajuste({ resposta: 'O gancho está curto e direto.' })]);
    estudio.definirIa(ia2.fn);
    const q = await pedir(url, { metodo: 'POST', corpo: { versao: 2, pedido: 'O gancho tá bom?' } });
    assert.equal(q.status, 200, JSON.stringify(q.j));
    assert.deepEqual([q.j.versao, q.j.ajuste.semMudanca, q.j.ajuste.resposta], [2, true, 'O gancho está curto e direto.']);

    // o bloqueante nas duas tentativas: 422 e nada gravado
    const ruim = ajuste({ paginas: [capaIa(camada('texto', { id: '', nome: 'Selo', texto: 'Fala com o Mauro', y: 1000, largura: 400, altura: 60, tamanho: 40 }))] });
    estudio.definirIa(iaFalsa([ruim, ruim]).fn);
    const b = await pedir(url, { metodo: 'POST', corpo: { versao: 2, pedido: 'Põe um selo' } });
    assert.equal(b.status, 422, JSON.stringify(b.j));
    assert.match(b.j.erro, /nada foi gravado/);
    assert.equal((await pedir(`/api/estudio/docs/${d.id}`)).j.versao, 2);

    // tira a página 2 e põe uma nova no fim
    const nova = { numero: 3, fundo: fundoPapel, camadas: [camada('texto', { id: '', nome: 'Convite', texto: 'Manda pra quem precisa ver isso', y: 400, largura: 800, altura: 140, tamanho: 56 })] };
    estudio.definirIa(iaFalsa([ajuste({ resposta: 'Troquei a página final.', remover: [2], paginas: [nova] })]).fn);
    const t = await pedir(url, { metodo: 'POST', corpo: { versao: 2, pedido: 'Troca a página final por um convite pra mandar' } });
    assert.equal(t.status, 200, JSON.stringify(t.j));
    assert.deepEqual([t.j.versao, t.j.paginas.length, t.j.ajuste.paginas], [3, 2, [2]]);
    assert.equal(t.j.paginas[0].id, capa.id);
    assert.equal(t.j.paginas[1].camadas[0].texto, 'Manda pra quem precisa ver isso');
  } finally {
    estudio.definirIa(null);
  }
});

test('corrigirDesign: traz pra área segura, afasta o que colide (o cartão anda com o que tem dentro) e tira o visto escrito', () => {
  const doc = {
    formato: 'stories', largura: 1080, altura: 1920,
    paginas: [{ fundo: {}, camadas: [
      { id: 'a', tipo: 'texto', texto: 'Título grande', x: 0, y: 100, largura: 1200, altura: 100, tamanho: 80, alturaLinha: 1.1, espacamentoLetra: 0, peso: 800, fonte: 'Sora', opacidade: 1 },
      { id: 'card', tipo: 'forma', forma: 'retangulo', x: 96, y: 300, largura: 888, altura: 300, opacidade: 1 },
      { id: 'b', tipo: 'texto', texto: '✔ Dentro do cartão', x: 120, y: 320, largura: 800, altura: 60, tamanho: 40, alturaLinha: 1.2, espacamentoLetra: 0, peso: 400, fonte: 'Sora', opacidade: 1 },
      { id: 'faixa', tipo: 'forma', forma: 'retangulo', x: 0, y: 1500, largura: 1080, altura: 420, opacidade: 1 },
    ] }],
  };
  const out = estudio.corrigirDesign(structuredClone(doc));
  const [a, card, b, faixa] = out.paginas[0].camadas;
  const area = estudio.areaSegura(doc);
  assert.ok(a.x >= area.x && a.x + a.largura <= area.x + area.largura && a.y >= area.y, 'o título entrou na área segura');
  assert.ok(card.y >= a.y + estudio.alturaEstimada(a), 'o cartão desceu abaixo do título');
  assert.equal(b.y - card.y, 20, 'o texto andou junto com o cartão');
  assert.equal(b.texto, 'Dentro do cartão');
  assert.deepEqual([faixa.x, faixa.y], [0, 1500], 'faixa de fundo que sangra fica onde está');
  assert.equal(estudio.colisoes(out.paginas[0]).length, 0);
});

// ---------- mecanismo visual ----------

test('mecanismo visual: mesmo fundo e mesmos assets principais nas últimas 4 semanas', async () => {
  const leo = { tipo: 'imagem', assetId: 'ast_leo', x: 300, y: 500, largura: 400, altura: 600 };
  const comLeo = (titulo, extra = {}) => ({ titulo, formato: 'feed45', paginas: [{ fundo: { tipo: 'cor', cor: '#15171c' }, camadas: [pagTexto(titulo, { y: 100 }), leo] }], ...extra });
  const a = await criar(comLeo('Léo no escuro A'));
  const b = await criar(comLeo('Léo no escuro B'));
  const m = await pedir(`/api/estudio/mecanismo?docId=${b.id}`);
  assert.equal(m.status, 200);
  const alerta = m.j.alertas.find((x) => x.regra === 'fundo-e-assets' && x.parecidaCom.id === a.id);
  assert.ok(alerta, JSON.stringify(m.j));
  assert.match(alerta.texto, /Léo acenando/);
  assert.equal(alerta.nivel, 'alerta');
  // outro fundo: não é o mesmo design
  const c = await criar({ ...comLeo('Léo no claro'), paginas: [{ fundo: { tipo: 'cor', cor: '#fef3ee' }, camadas: [leo] }] });
  assert.ok(!(await pedir(`/api/estudio/mecanismo?docId=${c.id}`)).j.alertas.some((x) => x.regra === 'fundo-e-assets'));
  // longe no tempo (a peça é de 2099): fora da janela
  const longe = await criar(comLeo('Léo lá na frente', { pecaId: 'reel_futuro' }));
  const mLonge = (await pedir(`/api/estudio/mecanismo?docId=${longe.id}`)).j;
  assert.deepEqual(mLonge.alertas.filter((x) => x.regra === 'fundo-e-assets'), []);
  assert.equal(mLonge.janelaDias, 28);
  // a cópia (duplicar) não é repetição do original
  const dup = (await pedir(`/api/estudio/docs/${a.id}/duplicar`, { metodo: 'POST' })).j;
  assert.ok(!(await pedir(`/api/estudio/mecanismo?docId=${dup.id}`)).j.alertas.some((x) => x.parecidaCom?.id === a.id));
  assert.equal((await pedir('/api/estudio/mecanismo')).status, 400);
  assert.equal((await pedir('/api/estudio/mecanismo?docId=est_nao')).status, 404);
  const assin = estudio.assinatura(b);
  assert.deepEqual([assin.fundo, assin.principais], ['cor:#15171c', ['ast_leo']]);
});

test('revisão do design: símbolo inteiro, barrinha antes de texto, poucas palavras e paleta', () => {
  const assets = new Map(ASSETS.map((a) => [a.id, a]));
  const doc = {
    formato: 'feed45', largura: 1080, altura: 1350,
    paginas: [{ fundo: { tipo: 'cor', cor: '#0000ff', cor2: '#f1eee9' }, camadas: [
      { id: 's', nome: 'Visto', tipo: 'imagem', assetId: 'ast_simbolo', x: 100, y: 100, largura: 120, altura: 80, raio: 0, opacidade: 1 },
      { id: 'barra', nome: 'Barrinha', tipo: 'forma', forma: 'retangulo', x: 100, y: 330, largura: 40, altura: 6, opacidade: 1 },
      { id: 't', nome: 'Texto', tipo: 'texto', texto: Array.from({ length: 40 }, (_, i) => `palavra${i}`).join(' '), x: 160, y: 300, largura: 840, altura: 900, tamanho: 30, alturaLinha: 1.3, espacamentoLetra: 0, peso: 400, fonte: 'Sora', cor: '#1b1e24', corDestaque: '#f2643c', opacidade: 1 },
    ] }],
  };
  const regras = estudio.revisarDesign(doc, assets).map((x) => x.regra);
  for (const r of ['simbolo', 'barrinha', 'palavras', 'paleta']) assert.ok(regras.includes(r), `${r}: ${regras.join(', ')}`);

  // efeito de fundo (luz) e grifo: fundo e partícula vão até a borda, o grifo mora embaixo da palavra (e estica)
  const efeitos = {
    formato: 'stories', largura: 1080, altura: 1920,
    paginas: [{ fundo: { tipo: 'cor', cor: '#faf8f5', cor2: '#f1eee9' }, camadas: [
      { id: 'luz', nome: 'Luz', tipo: 'imagem', assetId: 'ast_luz', x: -100, y: 1200, largura: 1300, altura: 900, raio: 0, opacidade: 1 },
      { id: 'leo', nome: 'Léo', tipo: 'imagem', assetId: 'ast_leo', x: 300, y: 600, largura: 400, altura: 600, raio: 0, opacidade: 1 },
      { id: 'tit', nome: 'Título', tipo: 'texto', texto: 'Comece por aqui', x: 96, y: 300, largura: 700, altura: 100, tamanho: 80, alturaLinha: 1.1, espacamentoLetra: 0, peso: 800, fonte: 'Sora', cor: '#1b1e24', corDestaque: '#f2643c', opacidade: 1 },
      { id: 'grifo', nome: 'Grifo', tipo: 'imagem', assetId: 'ast_grifo', x: 96, y: 380, largura: 600, altura: 34, raio: 0, opacidade: 1 },
    ] }],
  };
  const achados = estudio.revisarDesign(efeitos, assets);
  assert.deepEqual(achados.filter((x) => ['colisao', 'area-segura', 'proporcao'].includes(x.regra)), [], JSON.stringify(achados));
  assert.deepEqual(estudio.assinatura(efeitos, assets).principais, ['ast_leo'], 'luz e grifo não são objeto principal');
});

// 22/10 (achado da revisão): a escala por formato, o teto de palavras e a cor de destaque por página são a mesma conta
// no servidor e no editor (modelo.js): nada de alerta gravado que a tela não mostra
test('escala, palavras e destaque: a conferência gravada e o editor dizem o mesmo; os 14 modelos nascem sem alerta', async () => {
  const M = await import('../../public/js/estudio/modelo.js');
  const BASE_REAL = path.join(import.meta.dirname, '..', '..', 'estudio', 'base');
  const assets = new Map(JSON.parse(readFileSync(path.join(BASE_REAL, 'catalogo.json'), 'utf8')).assets.map((a) => [a.id, a]));
  const REGRAS = ['escala', 'palavras', 'destaque'];
  const conferir = (rotulo, corpo) => {
    const doc = { id: 'est_paridade', ...estudio.validarDocumento(corpo, { assets }), versao: 1 };
    const servidor = estudio.revisarDesign(doc, assets).filter((x) => REGRAS.includes(x.regra)).map((x) => `${x.pagina}:${x.regra}:${x.camadas.join(',')}`).sort();
    const ed = M.normalizarDoc(doc);
    const editor = ed.paginas.flatMap((p, i) => M.avisosDaPagina(ed, p, { assetsPorId: assets }).filter((x) => REGRAS.includes(x.regra)).map((x) => `${i + 1}:${x.regra}:${x.camadas.join(',')}`)).sort();
    assert.deepEqual(editor, servidor, rotulo);
    return servidor;
  };
  const modelos = readdirSync(path.join(BASE_REAL, 'modelos')).filter((n) => n.endsWith('.json'));
  assert.ok(modelos.length >= 14, `${modelos.length} modelos`);
  for (const n of modelos) {
    const m = JSON.parse(readFileSync(path.join(BASE_REAL, 'modelos', n), 'utf8'));
    assert.deepEqual(conferir(n, M.docDoModelo({ id: n.replace(/\.json$/, ''), ...m })), [], `${n} nasce sem alerta de escala, palavras ou destaque`);
  }
  for (const n of readdirSync(path.join(BASE_REAL, 'docs')).filter((x) => x.endsWith('.json'))) {
    const { id, versao, origem, criadoEm, criadoPor, atualizadoEm, atualizadoPor, revisao, areaSegura, ...corpo } = JSON.parse(readFileSync(path.join(BASE_REAL, 'docs', n), 'utf8'));
    conferir(n, corpo);
  }
  // os dois lados acusam juntos: o título de 70 px no stories (a escala do stories, não a do feed), o corpo fora, o
  // título de 100 px no feed, 36 palavras e duas cores de destaque na mesma página
  const dez = 'uma frase de apoio com dez palavras pra ler no celular';
  const casos = [
    ['stories', [pagTexto('Um título curto', { x: 96, y: 300, tamanho: 70 }), pagTexto(dez, { x: 96, y: 700, tamanho: 30, altura: 300 })], ['escala', 'escala']],
    ['feed45', [pagTexto('Um título curto', { tamanho: 100, altura: 240 }), pagTexto(dez, { y: 700, tamanho: 40, altura: 300 })], ['escala', 'escala']],
    ['stories', [pagTexto('R$ 99', { x: 96, y: 300, tamanho: 180 }), pagTexto('Plano ME', { x: 96, y: 700, tamanho: 60 })], []],
    ['feed45', [pagTexto(Array.from({ length: 36 }, (_, i) => `p${i}`).join(' '), { tamanho: 28, altura: 900 })], ['palavras']],
    ['feed45', [pagTexto('Um *título*', { tamanho: 80, corDestaque: '#DD4E27' }), pagTexto('Outro *trecho*', { y: 700, tamanho: 40, corDestaque: '#1B1E24' })], ['destaque']],
  ];
  for (const [formato, camadas, esperado] of casos) {
    const achados = conferir(`${formato}: ${camadas.map((c) => c.texto.slice(0, 20)).join(' / ')}`, { titulo: 'Paridade', formato, paginas: [{ camadas }] });
    assert.deepEqual(achados.map((x) => x.split(':')[1]), esperado, achados.join(' | '));
  }
});

// ---------- o servidor de verdade (despacho do server.mjs e o perfil) ----------

test('servidor de verdade: /api/estudio chega no estúdio, o Diretor só no arquivo e o PUT da peça não grava artes', async () => {
  const dados2 = path.join(raiz, 'data-servidor');
  const base2 = path.join(raiz, 'base-servidor');
  mkdirSync(dados2, { recursive: true });
  mkdirSync(base2, { recursive: true });
  writeFileSync(path.join(dados2, 'estilos.json'), '{}');
  writeFileSync(path.join(dados2, 'db.json'), JSON.stringify({ schemaVersion: 2, pilares, reels: [peca('reel_srv', { status: 'roteiro', artes: [{ id: 'exp_antiga', docId: 'est_x', pagina: 1, formato: 'png', url: '/x', em: EM, por: 'X' }] })] }));
  const SENHA = 'senha-de-teste-123';
  const hash = await auth.hashSenha(SENHA);
  writeFileSync(path.join(dados2, 'usuarios.json'), JSON.stringify([
    { id: 'usr_op', usuario: 'operador', nome: 'Operador', hash, papel: 'operador', criadoEm: EM, trocarSenha: false },
    { id: 'usr_dir2', usuario: 'diretor', nome: 'Diretor', hash, papel: 'diretor', criadoEm: EM, trocarSenha: false },
  ]));
  const SERVER = path.join(import.meta.dirname, '..', 'server.mjs');
  let real = null;
  for (let tentativa = 0; tentativa < 5 && !real; tentativa++) {
    const porta = 41_000 + Math.floor(Math.random() * 8_000);
    const filho = spawn(process.execPath, [SERVER], {
      env: { ...process.env, CRONOGRAMA_DATA: dados2, CRONOGRAMA_ESTUDIO_BASE: base2, CRONOGRAMA_AGENDA: '0', CRONOGRAMA_IA: '0', PORT: String(porta) },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const subiu = await new Promise((ok) => {
      let saida = '';
      const relogio = setTimeout(() => ok(false), 30_000);
      filho.stdout.on('data', (c) => {
        saida += c;
        if (saida.includes('Gestão de Marketing no ar')) {
          clearTimeout(relogio);
          ok(true);
        }
      });
      filho.stderr.on('data', (c) => { saida += c; });
      filho.on('exit', () => {
        clearTimeout(relogio);
        ok(false);
      });
    });
    if (subiu) real = { filho, porta };
    else filho.kill();
  }
  assert.ok(real, 'o servidor de teste subiu');
  try {
    const ir = (caminho, { metodo = 'GET', cookie, corpo } = {}) => new Promise((ok, erro) => {
      const cru = corpo === undefined ? null : Buffer.from(JSON.stringify(corpo));
      const h = { host: `localhost:${real.porta}`, ...(cookie ? { cookie } : {}), ...(cru ? { 'content-length': cru.length, 'content-type': 'application/json' } : {}) };
      const req = http.request({ host: '127.0.0.1', port: real.porta, path: caminho, method: metodo, headers: h, agent: false }, (res) => {
        const pedacos = [];
        res.on('data', (c) => pedacos.push(c));
        res.on('end', () => {
          let j = null;
          try {
            j = JSON.parse(Buffer.concat(pedacos).toString('utf8'));
          } catch {}
          ok({ status: res.statusCode, h: res.headers, j });
        });
      });
      req.on('error', erro);
      req.end(cru ?? undefined);
    });
    const entrar = async (usuario) => {
      const r = await ir('/api/auth/entrar', { metodo: 'POST', corpo: { usuario, senha: SENHA } });
      assert.equal(r.status, 200, `login ${usuario}: ${JSON.stringify(r.j)}`);
      return [r.h['set-cookie']].flat().map((c) => c.split(';')[0]).join('; ');
    };
    const op = await entrar('operador');
    const dir = await entrar('diretor');
    assert.equal((await ir('/api/estudio/docs', { cookie: op })).status, 200);
    const novo = await ir('/api/estudio/docs', { metodo: 'POST', cookie: op, corpo: docSimples({ titulo: 'Pelo servidor' }) });
    assert.equal(novo.status, 201, JSON.stringify(novo.j));
    assert.equal(novo.j.criadoPor, 'Operador');
    const gerar = await ir('/api/estudio/gerar', { metodo: 'POST', cookie: op, corpo: { brief: 'Um post', formato: 'feed45' } });
    assert.equal(gerar.status, 503);
    assert.equal(gerar.j.erro, MSG_SEM_IA);
    assert.equal((await ir('/api/estudio/docs', { cookie: dir })).status, 403);
    assert.equal((await ir('/api/estudio/gerar', { metodo: 'POST', cookie: dir, corpo: { brief: 'x' } })).status, 403);
    assert.equal((await ir('/api/estudio/exportacoes/exp_nao_existe/arquivo', { cookie: dir })).status, 404, 'o Diretor chega no arquivo (e o estúdio diz que não existe)');
    assert.equal((await ir('/api/estudio/rota-que-nao-existe', { cookie: op })).status, 404);
    // 22/10 (Pedro): as fontes do estúdio vêm do app (woff2) e a exportação embute em data:
    assert.match((await ir('/api/estudio/modelos', { cookie: op })).h['content-security-policy'], /font-src 'self' data: https:\/\/fonts\.gstatic\.com/);
    assert.equal((await ir('/api/estudio/modelos', { cookie: op })).status, 200);
    // artes é do servidor: o PUT da peça não troca
    const put = await ir('/api/reels/reel_srv', { metodo: 'PUT', cookie: op, corpo: { artes: [], ideia: 'Peça editada' } });
    assert.equal(put.status, 200, JSON.stringify(put.j));
    assert.equal(put.j.ideia, 'Peça editada');
    assert.deepEqual(put.j.artes.map((a) => a.id), ['exp_antiga']);
  } finally {
    if (real.filho.exitCode === null) {
      const saiu = new Promise((ok) => real.filho.once('exit', ok));
      real.filho.kill();
      await saiu;
    }
  }
});

// ---------- 22/10 (Pedro): a rodada de correções do estúdio ----------

ASSETS.push(
  { id: 'ast_check_upload', nome: 'Check verde', categoria: 'icone', tags: ['check'], descricao: 'Um check qualquer', origem: 'upload', largura: 100, altura: 100 },
  { id: 'ast_busto', nome: 'Léo, busto', categoria: 'leo', tags: ['léo', 'busto', 'corte reto'], descricao: 'Busto com corte reto', origem: 'base', largura: 800, altura: 600 },
);

test('tetos de trabalho: a camada de 2 KB grava rápido, a colisão de 80 camadas longas é curta e o design tem teto de letras', async () => {
  const grande = { tipo: 'texto', texto: 'M'.repeat(2000), x: 0, y: 0, largura: 1, altura: 100, tamanho: 1200, peso: 800, espacamentoLetra: 2 };
  const t0 = performance.now();
  const r = await pedir('/api/estudio/docs', { metodo: 'POST', corpo: { titulo: 'Camada gigante', formato: 'feed45', paginas: [{ camadas: [grande] }] } });
  assert.equal(r.status, 201, JSON.stringify(r.j));
  assert.ok(performance.now() - t0 < 1500, `${Math.round(performance.now() - t0)} ms`);
  assert.ok(estudio.alturaEstimada(grande) <= 2000 * 1.2 * 1200, 'no máximo uma linha por letra');
  // a leitura como px saiu: o espaçamento é em em, de -0,5 a 2
  assert.equal((await pedir('/api/estudio/docs', { metodo: 'POST', corpo: { paginas: [{ camadas: [{ ...grande, espacamentoLetra: 10000 }] }] } })).status, 400);
  assert.equal((await pedir('/api/estudio/docs', { metodo: 'POST', corpo: { paginas: [{ camadas: [{ ...grande, tamanho: 4000 }] }] } })).status, 400);
  const muitas = (await pedir('/api/estudio/docs', { metodo: 'POST', corpo: { paginas: [{ camadas: Array.from({ length: 16 }, () => pagTexto('a'.repeat(2000))) }] } }));
  assert.equal(muitas.status, 400);
  assert.match(muitas.j.erro, /passa de 30\.000 letras/);
  // 80 camadas de 1900 linhas que se cruzam na caixa e não nas linhas (antes: 21 s por página)
  const pagina = { camadas: Array.from({ length: 80 }, (_, k) => ({ id: `c${k}`, tipo: 'texto', texto: `${'M'.repeat(106)}${'\n'.repeat(1893)}`, x: 100 + 5 * k, y: 100 + 12 * k, largura: 1000, altura: 100, tamanho: 10, alturaLinha: 1.2, espacamentoLetra: 0, peso: 400, fonte: 'Sora', opacidade: 1 })) };
  const t1 = performance.now();
  estudio.colisoes(pagina);
  assert.ok(performance.now() - t1 < 1000, `${Math.round(performance.now() - t1)} ms`);
});

test('revisão gravada com teto, versão sem a revisão, teto de designs, de tamanho e espaço livre (507)', async () => {
  const sobrepostas = Array.from({ length: 80 }, (_, k) => pagTexto(`Texto ${k}`, { x: 100, y: 100, largura: 400, altura: 80, tamanho: 40, nome: `T${k}` }));
  const d = await criar({ titulo: 'Tudo em cima', formato: 'feed45', paginas: [{ camadas: sobrepostas }] });
  assert.ok(d.revisao.design.length <= 200, `${d.revisao.design.length} itens`);
  assert.equal(d.revisao.design.at(-1).regra, 'mais');
  assert.ok(d.revisao.contagem.problemas >= 3160, 'a contagem é a de verdade');
  const versao = JSON.parse(readFileSync(path.join(dados, 'estudio', 'versoes', d.id, '1.json'), 'utf8'));
  assert.ok(!('revisao' in versao), 'a versão guardada vai sem a revisão');
  const antes = { ...estudio.limites };
  try {
    estudio.limites.designs = (await pedir('/api/estudio/docs')).j.docs.length;
    const cheio = await pedir('/api/estudio/docs', { metodo: 'POST', corpo: docSimples() });
    assert.equal(cheio.status, 507);
    assert.match(cheio.j.erro, /lixeira/);
    estudio.limites.designs = antes.designs;
    estudio.limites.bytesDocs = 1;
    assert.equal((await pedir(`/api/estudio/docs/${d.id}`, { metodo: 'PUT', corpo: { versao: 1, titulo: 'Maior' } })).status, 507);
  } finally {
    Object.assign(estudio.limites, antes);
  }
  estudio.discoEstudio.livre = async () => 0;
  try {
    assert.equal((await pedir('/api/estudio/docs', { metodo: 'POST', corpo: docSimples() })).status, 507);
  } finally {
    estudio.discoEstudio.livre = DISCO_FOLGADO;
  }
  assert.equal((await pedir(`/api/estudio/docs/${d.id}`)).j.titulo, 'Tudo em cima', 'nada gravou');
});

test('lixeira: apagar guarda o design e as versões; importado só a gestão apaga; restaurar volta como versão nova', async () => {
  writeFileSync(path.join(base, 'docs', 'base-nova.json'), JSON.stringify({ titulo: 'Base nova', formato: 'feed45', paginas: [{ camadas: [pagTexto('Da base')] }] }));
  assert.equal(await estudio.semear(), 1);
  const id = 'est_base_base-nova';
  assert.equal((await pedir(`/api/estudio/docs/${id}`)).j.origem, 'importado', 'a semente sem id ganha o id fixo do arquivo');
  const negado = await pedir(`/api/estudio/docs/${id}`, { metodo: 'DELETE', quem: 'outro' });
  assert.equal(negado.status, 403);
  assert.match(negado.j.erro, /Admin ou Gerente/);
  assert.equal((await pedir(`/api/estudio/docs/${id}`, { metodo: 'DELETE' })).status, 200);
  assert.equal((await pedir(`/api/estudio/docs/${id}`)).status, 404);
  assert.ok(existsSync(path.join(dados, 'estudio', 'lixeira', id, 'doc.json')));
  assert.ok(existsSync(path.join(dados, 'estudio', 'lixeira', id, 'versoes', 'indice.json')), 'as versões vão junto');
  const lista = (await pedir('/api/estudio/lixeira')).j.docs;
  assert.deepEqual([lista[0].id, lista[0].apagadoPor], [id, 'Pedro Melo']);
  assert.equal(await estudio.semear(), 0, 'apagado pela equipe não volta sozinho');
  const volta = await pedir(`/api/estudio/lixeira/${id}/restaurar`, { metodo: 'POST' });
  assert.equal(volta.status, 200, JSON.stringify(volta.j));
  assert.equal(volta.j.versao, 2);
  assert.equal((await pedir(`/api/estudio/docs/${id}/versoes`)).j.versoes[0].nota, 'Restaurado da lixeira');
  assert.ok(!existsSync(path.join(dados, 'estudio', 'lixeira', id)));
  assert.equal((await pedir(`/api/estudio/lixeira/${id}/restaurar`, { metodo: 'POST' })).status, 409, 'já está de volta');
  // design feito à mão: o operador apaga
  const meu = await criar(docSimples({ titulo: 'Do operador' }), 'outro');
  assert.equal((await pedir(`/api/estudio/docs/${meu.id}`, { metodo: 'DELETE', quem: 'outro' })).status, 200);
});

test('semeadura: queda antes de gravar o registro adota o design (não duplica)', async () => {
  writeFileSync(path.join(base, 'docs', 'adotada.json'), JSON.stringify({ titulo: 'Adotada', formato: 'feed45', paginas: [{ camadas: [pagTexto('Adotada')] }] }));
  assert.equal(await estudio.semear(), 1);
  // a queda: o design ficou e o registro não
  const arq = path.join(dados, 'estudio', 'semeados.json');
  const reg = JSON.parse(readFileSync(arq, 'utf8'));
  delete reg['docs/adotada.json'];
  writeFileSync(arq, JSON.stringify(reg));
  await estudio.reiniciarParaTeste();
  const iguais = (await pedir('/api/estudio/docs')).j.docs.filter((x) => x.titulo === 'Adotada');
  assert.equal(iguais.length, 1);
  assert.equal(JSON.parse(readFileSync(arq, 'utf8'))['docs/adotada.json'].docId, 'est_base_adotada');
});

test('assets sem cache: a imagem recém-subida entra no design na hora', async () => {
  const ea = await import('../estudio-assets.mjs');
  ea.disco.livre = DISCO_FOLGADO;
  const d = await criar(docSimples({ titulo: 'Com upload' }));
  estudio.definirFonteAssets(null);
  try {
    assert.equal((await pedir(`/api/estudio/docs/${d.id}`, { metodo: 'PUT', corpo: { versao: 1, titulo: 'Cache quente' } })).status, 200);
    const up = await pedir('/api/estudio/assets', { metodo: 'POST', corpo: PNG, cabecalhos: { 'content-type': 'application/octet-stream', 'x-nome-arquivo': 'tela.png' } });
    assert.equal(up.status, 201, JSON.stringify(up.j));
    const r = await pedir(`/api/estudio/docs/${d.id}`, { metodo: 'PUT', corpo: { versao: 2, paginas: [{ camadas: [{ tipo: 'imagem', assetId: up.j.id, x: 100, y: 100, largura: 216, altura: 270 }] }] } });
    assert.equal(r.status, 200, JSON.stringify(r.j));
  } finally {
    estudio.definirFonteAssets(() => ASSETS);
  }
});

test('aprovação: reexportar a mesma versão não derruba; a versão nova derruba; arte nova anula a observação dos gerentes', async () => {
  const d = await criar(docSimples({ titulo: 'Arte aprovada', pecaId: 'reel_aprovado2' }));
  const um = await exportar(d.id, PNG);
  assert.equal(um.j.anexo.aprovacao, 'alterado', 'a primeira arte muda a peça aprovada');
  // a peça volta pra aprovação e é aprovada com a arte
  const db = await carregar();
  db.reels.find((r) => r.id === 'reel_aprovado2').aprovacao.estado = 'aprovado';
  await salvar();
  const jpg = await exportar(d.id, JPEG, { formato: 'jpg' });
  assert.equal(jpg.status, 201);
  assert.deepEqual([jpg.j.anexo.anexada, jpg.j.anexo.aprovacao, jpg.j.anexo.mesmaVersao], [true, null, true]);
  const pdf = await exportar(d.id, PDF, { pagina: 'todas', formato: 'pdf' });
  assert.equal(pdf.j.anexo.aprovacao, null, 'o PDF da mesma versão também não muda nada');
  let r = await pecaDoBanco('reel_aprovado2');
  assert.equal(r.aprovacao.estado, 'aprovado');
  assert.ok(r.artes.every((a) => a.versaoDoc === 1), 'a arte guarda a versão do design');
  assert.equal((await pedir(`/api/estudio/docs/${d.id}`, { metodo: 'PUT', corpo: { versao: 1, paginas: [{ camadas: [pagTexto('Outro texto')] }] } })).status, 200);
  const nova = await exportar(d.id, PNG);
  assert.equal(nova.j.anexo.aprovacao, 'alterado');
  r = await pecaDoBanco('reel_aprovado2');
  assert.equal(r.aprovacao.estado, 'alterado');

  const o = await criar(docSimples({ titulo: 'Arte nova no meio', pecaId: 'reel_obs' }));
  assert.equal((await exportar(o.id, PNG)).status, 201);
  const obs = await pecaDoBanco('reel_obs');
  assert.deepEqual([obs.aprovacao.etapa, obs.aprovacao.gerentes.aprovaram], ['gerentes', []]);
  assert.ok(obs.aprovacao.observacoes[0].anulada, 'a observação da rodada ficou anulada');
});

test('bloqueante da conferência: grava o rascunho, mas não exporta nem anexa; a IA não grava (422)', async () => {
  const d = await criar(docSimples({ titulo: 'Com o Mauro', pecaId: 'reel_futuro', paginas: [{ camadas: [pagTexto('Fala com o Mauro')] }] }));
  assert.equal(d.revisao.textos.bloqueia, true);
  const arquivosAntes = readdirSync(path.join(dados, 'estudio', 'exportacoes')).length;
  const ex = await exportar(d.id, PNG);
  assert.equal(ex.status, 409);
  assert.match(ex.j.erro, /bloqueante/);
  assert.equal(readdirSync(path.join(dados, 'estudio', 'exportacoes')).length, arquivosAntes, 'nada no disco');
  assert.ok(!(await pecaDoBanco('reel_futuro')).artes, 'nada na peça');
  const ia = iaFalsa([TENTATIVA_1]);
  estudio.definirIa(ia.fn);
  try {
    const antes = (await pedir('/api/estudio/docs')).j.docs.length;
    const g = await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'Capa do mito', pecaId: 'reel_aprovado', paginas: 2 } });
    assert.equal(g.status, 422, JSON.stringify(g.j));
    assert.match(g.j.erro, /não foi gravado/);
    assert.ok(g.j.problemas.some((p) => /Mauro/.test(p)));
    assert.equal((await pedir('/api/estudio/docs')).j.docs.length, antes);
  } finally {
    estudio.definirIa(null);
  }
});

test('fato só do FATOS.md: id inexistente, NÃO USAR, número sem fonte (inclusive por extenso) e a decisão do Pedro', async () => {
  const regras = async (texto, fontes = []) => (await criar(docSimples({ titulo: texto, fontes, paginas: [{ camadas: [pagTexto(texto)] }] }))).revisao.design.map((x) => x.regra);
  assert.ok((await regras('R$ 49 por mês', ['F999 inventado'])).includes('fato-inexistente'));
  assert.ok((await regras('O MEI fatura até 81 mil por ano')).includes('numero-sem-fato'));
  assert.ok((await regras('Fidelidade de doze meses')).includes('numero-sem-fato'), 'por extenso');
  assert.ok((await regras('Chega dia 10')).includes('numero-sem-fato'));
  assert.ok((await regras('Um escritório', ['F148 · escritório'])).includes('fato-nao-usar'));
  const ok = await regras('O app chega dia 10/11', ['data do app: decisão do Pedro, 14/10/2026']);
  assert.ok(!ok.some((r) => /fato|fonte/.test(r)), ok.join(', '));
  assert.ok(!(await regras('Teto do MEI', ['F051 · 05-MEI'])).some((r) => /fato|fonte/.test(r)));
  // o mote "100% humana" quebrado em camadas (Destaque 07) é claim, não número
  const mote = await criar(docSimples({ paginas: [{ camadas: [pagTexto('100%', { y: 100, altura: 90 }), pagTexto('Humana', { y: 300, altura: 90 })] }] }));
  assert.ok(!mote.revisao.design.some((x) => x.regra === 'numero-sem-fato'));
  // o design da peça herda as fontes dela
  const db = await carregar();
  db.reels.find((r) => r.id === 'reel_futuro').fontes = ['F051 · 05-MEI'];
  await salvar();
  const herda = await criar(docSimples({ titulo: 'Herda', pecaId: 'reel_futuro', paginas: [{ camadas: [pagTexto('Até 81 mil por ano')] }] }));
  assert.ok(!herda.revisao.design.some((x) => x.regra === 'numero-sem-fato'));
});

test('revisão: gancho é a maior letra da capa, MEI e contador em camadas diferentes, símbolo girado, visto de upload, traços', async () => {
  const doc = docSimples({ paginas: [{ camadas: [
    pagTexto('MEI', { tamanho: 24, y: 80, altura: 40, largura: 200, nome: 'Tag' }),
    pagTexto('Um contador cuida de tudo pra você', { tamanho: 80, y: 200, altura: 300, nome: 'Título' }),
  ] }] });
  const d = await criar(doc);
  assert.equal(estudio.ganchoDoDoc(d), 'Um contador cuida de tudo pra você');
  assert.ok(d.revisao.design.some((x) => x.regra === 'mei-contador'));
  const comAssistente = await criar(docSimples({ paginas: [{ camadas: [pagTexto('MEI', { tamanho: 24, y: 80, altura: 40 }), pagTexto('Assistente virtual, sem contador humano', { y: 200, altura: 300 })] }] }));
  assert.ok(!comAssistente.revisao.design.some((x) => x.regra === 'mei-contador'));
  const sim = (extra) => criar(docSimples({ paginas: [{ camadas: [{ tipo: 'imagem', assetId: 'ast_simbolo', x: 200, y: 200, largura: 100, altura: 100, ...extra }] }] }));
  assert.ok((await sim({ espelhar: true })).revisao.design.some((x) => x.regra === 'simbolo' && x.nivel === 'problema'));
  assert.ok((await sim({ rotacao: 10 })).revisao.design.some((x) => x.regra === 'simbolo' && x.nivel === 'problema'));
  const upload = await criar(docSimples({ paginas: [{ camadas: [{ tipo: 'imagem', assetId: 'ast_check_upload', x: 200, y: 200, largura: 100, altura: 100 }] }] }));
  assert.ok(upload.revisao.design.some((x) => x.regra === 'simbolo' && x.nivel === 'alerta'), 'check de upload não é o símbolo');
  const assets = new Map(ASSETS.map((a) => [a.id, a]));
  const db = await carregar();
  const v = (t) => estudio.validarDocumento({ paginas: [{ camadas: [pagTexto(t)] }] }, { db, assets }).paginas[0].camadas[0].texto;
  const BARRA = String.fromCharCode(0x2015);
  const MENOS = String.fromCharCode(0x2212);
  assert.equal(v('Abrir empresa - sem cartório'), 'Abrir empresa, sem cartório');
  assert.equal(v('De 30 - 35 dias'), 'De 30-35 dias');
  assert.equal(v(`Parte 1 ${BARRA} fim`), 'Parte 1, fim');
  assert.equal(v(`Prazo ${MENOS} curto`), 'Prazo, curto');
  assert.equal(v('pró-labore e e-mail'), 'pró-labore e e-mail', 'o hífen colado fica');
});

test('área segura só dos textos (Pedro, 22/10): imagem estoura a borda à vontade, texto fora é problema e a correção traz o texto', async () => {
  const assets = new Map(ASSETS.map((a) => [a.id, a]));
  const busto = (y) => ({ formato: 'stories', largura: 1080, altura: 1920, paginas: [{ fundo: { tipo: 'cor', cor: '#faf8f5', cor2: '#f1eee9' }, camadas: [{ id: 'b', nome: 'Busto', tipo: 'imagem', assetId: 'ast_busto', x: 140, y, largura: 800, altura: 600, raio: 0, opacidade: 1 }] }] });
  // a imagem pode passar da borda (em cima, embaixo, dos lados): nem aviso nem correção
  for (const y of [1320, 1250, 1500, -100]) assert.deepEqual(estudio.revisarDesign(busto(y), assets).filter((x) => x.regra === 'area-segura'), [], String(y));
  assert.equal(estudio.corrigirDesign(busto(1500), assets).paginas[0].camadas[0].y, 1500, 'a imagem fica onde a IA pôs');
  // só não some: a que ficou toda fora da página volta pra área segura
  const sumiu = estudio.corrigirDesign(busto(2500), assets).paginas[0].camadas[0];
  assert.ok(sumiu.y + sumiu.altura <= 1920 && sumiu.y >= 0, JSON.stringify(sumiu));
  // o texto fora da margem é problema e a correção traz ele pra dentro
  const texto = { formato: 'stories', largura: 1080, altura: 1920, paginas: [{ fundo: { tipo: 'cor', cor: '#faf8f5', cor2: '#f1eee9' }, camadas: [
    { ...camada('texto', { nome: 'Título', texto: 'Um título', x: 20, y: 100, largura: 600, altura: 120, tamanho: 90, peso: 800 }), id: 't' },
  ] }] };
  assert.equal(estudio.revisarDesign(texto, assets).filter((x) => x.regra === 'area-segura').length, 1);
  const t = estudio.corrigirDesign(texto, assets).paginas[0].camadas[0];
  assert.ok(t.x >= 96 && t.y >= 240, JSON.stringify(t));
  // a correção sobe a letra abaixo de 22 px e endireita o símbolo
  const pequeno = estudio.corrigirDesign({ formato: 'feed45', largura: 1080, altura: 1350, paginas: [{ fundo: {}, camadas: [
    { id: 't', tipo: 'texto', texto: 'Kicker', x: 100, y: 100, largura: 600, altura: 20, tamanho: 16, alturaLinha: 1.2, espacamentoLetra: 0, peso: 700, fonte: 'Sora', opacidade: 1 },
    { id: 's', tipo: 'imagem', assetId: 'ast_simbolo', x: 100, y: 400, largura: 100, altura: 100, espelhar: true, rotacao: 15, raio: 0, opacidade: 1 },
  ] }] }, assets);
  assert.equal(pequeno.paginas[0].camadas[0].tamanho, 22);
  assert.deepEqual([pequeno.paginas[0].camadas[1].espelhar, pequeno.paginas[0].camadas[1].rotacao], [false, 0]);
});

test('gerar: stories lê a skill de stories e a peça do dia; gancho inventado e convite de venda no Afeto voltam pra IA', async () => {
  const stories = structuredClone(TENTATIVA_LIMPA);
  stories.paginas = [{ fundo: fundoPapel, camadas: [camada('texto', { nome: 'Gancho', texto: 'Abrir empresa sem drama', x: 96, y: 300, largura: 888, altura: 120, tamanho: 80, peso: 800 })] }];
  const ia = iaFalsa([stories]);
  estudio.definirIa(ia.fn);
  try {
    const r = await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { pecaId: 'sto_dia' } });
    assert.equal(r.status, 200, JSON.stringify(r.j));
    assert.match(ia.chamadas[0].sistema, /<stories_leo arquivo="\.claude\/skills\/stories-leo\/SKILL\.md">/);
    assert.match(ia.chamadas[0].sistema, /Este design é de STORIES/);
    assert.match(ia.chamadas[0].prompt, /Peça de feed do dia[\s\S]*Carrossel do dia sobre o CNPJ/);
  } finally {
    estudio.definirIa(null);
  }
  const inventado = { ...structuredClone(TENTATIVA_LIMPA), ganchoOrigem: 'G999' };
  const ia2 = iaFalsa([inventado, { ...structuredClone(TENTATIVA_LIMPA), ganchoOrigem: 'banco 1500' }]);
  estudio.definirIa(ia2.fn);
  try {
    const r = await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'Mais um', pecaId: 'reel_aprovado', paginas: 2 } });
    assert.equal(r.status, 200, JSON.stringify(r.j));
    assert.equal(ia2.chamadas.length, 2);
    assert.match(ia2.chamadas[1].prompt, /G999 não existe/);
    assert.ok(r.j.geracao.avisos.some((a) => /Ficou pra conferir: .*(G999 não existe|banco de ganchos vai de 1 a 1000)/.test(a)), 'o gancho que não existe fica pra conferir');
  } finally {
    estudio.definirIa(null);
  }
  // design sem peça: o mecanismo da semana confere o candidato (Afeto com convite de venda)
  const afeto = structuredClone(TENTATIVA_LIMPA);
  afeto.estrategia = { pilar: 1, motivo: 'Bastidor do fundador.', gatilhoEmocional: 'alívio da conquista', gatilhoPsicologico: 'identificação', angulo: '' };
  afeto.paginas[1].camadas[0].texto = 'Entra na lista de espera';
  const ia3 = iaFalsa([afeto]);
  estudio.definirIa(ia3.fn);
  try {
    const r = await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'Bastidor', formato: 'feed45', paginas: 2, modeloId: 'nenhum' } });
    assert.equal(r.status, 200, JSON.stringify(r.j));
    assert.match(ia3.chamadas[1]?.prompt ?? '', /Mecanismo da semana: Post de atração não leva convite de venda/);
  } finally {
    estudio.definirIa(null);
  }
});

test('modelos: a lista do repo, a escolha pelo código e as janelas de não repetição de modelo e de fundo', async () => {
  const pasta = path.join(base, 'modelos');
  mkdirSync(pasta, { recursive: true });
  const modelo = (cor, tipo) => ({ nome: `Modelo ${tipo}`, descricao: `Fundo ${cor}`, tipo, titulo: `Modelo ${tipo}`, formato: 'feed45', paginas: [{ fundo: { tipo: 'cor', cor }, camadas: [pagTexto('Título do modelo', { y: 120 }), { tipo: 'imagem', assetId: 'ast_papel', x: 400, y: 600, largura: 400, altura: 400 }] }] });
  writeFileSync(path.join(pasta, 'modelo-claro.json'), JSON.stringify(modelo('#faf8f5', 'mito')));
  writeFileSync(path.join(pasta, 'modelo-escuro.json'), JSON.stringify(modelo('#15171c', 'dica')));
  writeFileSync(path.join(pasta, 'modelo-coral.json'), JSON.stringify(modelo('#f2643c', 'oferta')));
  writeFileSync(path.join(pasta, 'modelo-quebrado.json'), JSON.stringify({ nome: 'Quebrado', paginas: [{ camadas: [{ tipo: 'imagem', assetId: 'ast_nao_existe', x: 0, y: 0, largura: 10, altura: 10 }] }] }));
  writeFileSync(path.join(pasta, 'modelo-stories.json'), JSON.stringify({ ...modelo('#faf8f5', 'capa'), formato: 'stories', paginas: [{ fundo: { tipo: 'cor', cor: '#faf8f5' }, camadas: [pagTexto('Stories', { x: 96, y: 300, largura: 800 })] }] }));
  const lista = await pedir('/api/estudio/modelos');
  assert.equal(lista.status, 200);
  assert.deepEqual(lista.j.modelos.map((m) => [m.id, m.fundo]), [['modelo-claro', 'claro'], ['modelo-coral', 'coral'], ['modelo-escuro', 'escuro'], ['modelo-stories', 'claro']]);
  assert.ok(lista.j.modelos[0].paginas.length && lista.j.modelos[0].nome === 'Modelo mito', 'o documento inteiro, com nome');
  assert.ok(lista.j.problemas.some((p) => /modelo-quebrado/.test(p)));
  assert.deepEqual(lista.j.janelas, { modelo: 3, fundo: 2 });
  // o último design é escuro: o fundo escuro fica de fora
  await criar(docSimples({ titulo: 'Último escuro', paginas: [{ fundo: { tipo: 'cor', cor: '#15171c' }, camadas: [pagTexto('Escuro', { cor: '#f4f1ec' })] }] }));
  const ia = iaFalsa([TENTATIVA_LIMPA]);
  estudio.definirIa(ia.fn);
  try {
    const r = await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'Um post de modelo', formato: 'feed45', paginas: 2 } });
    assert.equal(r.status, 200, JSON.stringify(r.j));
    assert.equal(r.j.modeloId, 'modelo-claro');
    assert.equal(r.j.geracao.modelo.id, 'modelo-claro');
    assert.match(ia.chamadas[0].prompt, /<modelo id="modelo-claro">[\s\S]*fora o fundo escuro do último design/);
  } finally {
    estudio.definirIa(null);
  }
  // o próximo: sem o modelo claro (janela do modelo) e sem o fundo claro (janela do fundo); a IA que insiste no claro refaz
  const ia2 = iaFalsa([TENTATIVA_LIMPA]);
  estudio.definirIa(ia2.fn);
  try {
    const r = await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'Outro post de modelo', formato: 'feed45', paginas: 2 } });
    assert.equal(r.status, 200, JSON.stringify(r.j));
    assert.equal(r.j.geracao.modelo.id, 'modelo-coral');
    assert.equal(ia2.chamadas.length, 2);
    assert.match(ia2.chamadas[1].prompt, /O fundo claro repete o do último design/);
  } finally {
    estudio.definirIa(null);
  }
  // o pedido de quem gera manda; modelo que não existe é 400; o modelo do design criado pela tela entra na janela
  const ia3 = iaFalsa([TENTATIVA_LIMPA]);
  estudio.definirIa(ia3.fn);
  try {
    assert.equal((await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'x', formato: 'feed45', paginas: 2, modeloId: 'modelo-inexistente' } })).status, 400);
    const escolhido = await pedir('/api/estudio/gerar', { metodo: 'POST', corpo: { brief: 'x', formato: 'feed45', paginas: 2, modeloId: 'modelo-escuro' } });
    assert.equal(escolhido.j.geracao.modelo.id, 'modelo-escuro');
    const daTela = await criar({ ...docSimples({ titulo: 'Da tela' }), modeloId: 'modelo-coral' });
    assert.equal(daTela.modeloId, 'modelo-coral');
  } finally {
    estudio.definirIa(null);
  }
  rmSync(pasta, { recursive: true, force: true });
});

test('faxina: a arte anexada de peça que sumiu vira exportação solta no boot', async () => {
  const d = await criar(docSimples({ titulo: 'Peça que some', pecaId: 'reel_apagar' }));
  const ex = await exportar(d.id, PNG);
  assert.equal(ex.j.anexo.anexada, true);
  const db = await carregar();
  db.reels.splice(db.reels.findIndex((r) => r.id === 'reel_apagar'), 1);
  await salvar();
  await estudio.reiniciarParaTeste();
  const exps = (await pedir(`/api/estudio/docs/${d.id}/exportacoes`)).j.exportacoes;
  assert.deepEqual(exps.map((x) => [x.id, x.pecaId]), [[ex.j.id, null]]);
});

// ---------- o design montado da peça (23/10) ----------

test('da-peca: o "Criar no Ateliê" monta o design com os modelos do repo e o texto da peça, sem colisão nem texto fora', async () => {
  const BASE_REAL = path.join(import.meta.dirname, '..', '..', 'estudio', 'base');
  const pasta = path.join(base, 'modelos');
  mkdirSync(pasta, { recursive: true });
  for (const n of ['capa-carrossel', 'slide-conteudo', 'cta-final', 'estatico-dica', 'stories-dica']) {
    writeFileSync(path.join(pasta, `${n}.json`), readFileSync(path.join(BASE_REAL, 'modelos', `${n}.json`)));
  }
  // os modelos usam os assets da base de verdade
  const reais = JSON.parse(readFileSync(path.join(BASE_REAL, 'catalogo.json'), 'utf8')).assets;
  estudio.definirFonteAssets(() => [...ASSETS, ...reais]);
  const longo = 'Antes, era papel e ida ao escritório. Agora, tudo pelo celular ou computador, e você assina com a sua conta gov.br.';
  const db = await carregar();
  db.reels.push(
    peca('reel_car', {
      ideia: 'O que já vem no plano da ME', data: '2099-07-01', pilar: 16, bloco: 'Educação',
      carrossel: {
        capa: { titulo: 'O que já vem no plano da ME', texto: 'O que já vem no plano da ME', visual: '' },
        slides: [{ titulo: '1', texto: 'Contador com registro no CRC.', visual: '' }, { titulo: '', texto: longo, visual: '' }],
        final: { titulo: '', texto: 'Comenta aí qual você usa.', visual: '' },
      },
    }),
    peca('reel_est', { peca: 'estatico', ideia: 'A guia do MEI vence todo mês', data: '2099-07-02', estatico: { headline: 'A guia do MEI sai pelo app', apoio: '', visual: '', cta: '' } }),
    peca('reel_capa', { peca: 'reel', ideia: 'Reel da burocracia', data: '2099-07-03', roteiro: { hook: 'Cansou de papel?', textoTela: '', cenas: [], desenvolvimento: '', cta: '' } }),
    // 23/10: o fim da peça de Conversão (o botão do link da bio) e o convite que já fala do link (sem botão repetido)
    peca('reel_conv', {
      ideia: 'Quanto custa a ME no app', data: '2099-07-05', pilar: 10, bloco: 'Conversão',
      carrossel: { capa: { titulo: 'Quanto custa a ME no app', texto: '', visual: '' }, slides: [{ titulo: 'Preço fechado', texto: 'Você vê o valor antes de assinar.', visual: '' }], final: { titulo: 'Entra na lista de espera.', texto: '', visual: '' } },
    }),
    peca('reel_conv2', {
      ideia: 'Lista de espera da ME', data: '2099-07-06', pilar: 10, bloco: 'Conversão',
      carrossel: { capa: { titulo: 'Lista de espera da ME', texto: '', visual: '' }, slides: [], final: { titulo: 'Entra na lista pelo link da bio.', texto: '', visual: '' } },
    }),
  );
  db.stories.push({
    id: 'sto_longo', data: '2099-07-04', objetivo: 'engajamento', pilar: 9, bloco: 'Diferencial', tema: 'Recap do preço', pecaDoDia: null,
    quadros: [{ texto: `Recapitulando o post de ontem: ${longo}`, visual: '', interacao: '' }, { texto: 'Manda sua dúvida na caixinha.', visual: '', interacao: '' }, { texto: '', visual: '', interacao: '' }],
    cta: '', fontes: [], notas: '', pilarTexto: '', motivo: '', status: 'ideia', aprovacao: null,
  });
  await salvar();
  const montar = (pecaId, quem = 'time') => pedir('/api/estudio/da-peca', { metodo: 'POST', quem, corpo: { pecaId } });
  const porNome = (pag) => Object.fromEntries(pag.camadas.map((c) => [c.nome, c]));
  const semProblema = (r) => assert.equal(r.j.revisao.contagem.problemas, 0, JSON.stringify(r.j.revisao.design.filter((d) => d.nivel === 'problema')));
  try {
    // carrossel (23/10, no visual da skill carrossel: estudio-carrossel.mjs): a capa, um slide por slide do texto e o fim
    const car = await montar('reel_car');
    assert.equal(car.status, 201, JSON.stringify(car.j));
    assert.equal(car.j.pecaId, 'reel_car');
    assert.equal(car.j.titulo, 'Carrossel · O que já vem no plano da ME');
    assert.deepEqual([car.j.formato, car.j.largura, car.j.altura], ['feed45', 1080, 1350]);
    assert.equal(car.j.paginas.length, 4);
    const semMarca = (t) => String(t).replace(/\*/g, '');
    const [capa, s1, s2, fim] = car.j.paginas.map(porNome);
    // todas as páginas: o fundo da variação (escuro ou claro, alternando pela data), a tag do público, o contador e
    // (menos no fim de Conversão) o logo no rodapé
    const { varianteDoCarrossel } = await import('../estudio-carrossel.mjs');
    const variante = varianteDoCarrossel(await carregar(), { id: 'reel_car' });
    car.j.paginas.forEach((pg, i) => {
      const c = porNome(pg);
      if (variante === 'escuro') assert.equal(pg.fundo.assetId, 'ast_base_fundo-escuro-feed');
      else assert.equal(pg.fundo.cor.toLowerCase(), '#faf8f5');
      // 23/10 (Pedro): a tag ME / MEI não vai por padrão (está no banco, como asset)
      assert.equal(c['Tag do público'], undefined);
      assert.equal(c['Contador'].texto, `0${i + 1} / 04`);
      assert.equal(c['Logo'].assetId, variante === 'escuro' ? 'ast_base_logo-negativo-claro' : 'ast_base_logo-horizontal');
    });
    assert.equal(semMarca(capa['Título'].texto), 'O que já vem no plano da ME');
    assert.match(capa['Título'].texto, /\*[^*]+\*$/, 'o trecho final em coral');
    assert.equal(capa['Linha de apoio'], undefined, 'a mesma frase no título e no apoio fica uma vez só');
    assert.equal(capa['Kicker'].texto, 'Legalizaí · JULHO 2099');
    // o Léo na capa (pilar 16: fora dos pilares 1 e 3, a skill pede o Léo no gancho), em cima do disco de papel
    assert.ok(capa['Arrasta pro lado'] && capa['Disco de papel']);
    assert.ok(Object.keys(capa).some((n) => /^Léo/.test(n)), 'o Léo na capa');
    for (const id of ['ast_base_tag-me-claro', 'ast_base_tag-mei-escuro', 'ast_base_tag-me-mei-claro']) assert.ok(reais.some((a) => a.id === id), `${id} no banco`);
    // o título que é só o número: o texto curto vira o título, com o número em coral; sem parágrafo, sem régua
    assert.equal(semMarca(s1['Título'].texto), '1. Contador com registro no CRC.');
    assert.match(s1['Título'].texto, /^\*1\.\*/);
    assert.ok(!s1['Texto'] && !s1['Régua']);
    // sem título e com duas frases: a primeira é o título e o resto o parágrafo, com a régua no meio
    assert.equal(semMarca(s2['Título'].texto), '2. Antes, era papel e ida ao escritório.');
    assert.equal(s2['Texto'].texto, 'Agora, tudo pelo celular ou computador, e você assina com a sua conta gov.br.');
    assert.ok(s2['Régua'].y > s2['Título'].y && s2['Régua'].y < s2['Texto'].y);
    // os ícones não se repetem e trocam de lado
    const icone = (c) => c['Ícone 3D'] ?? c['Ícone 3D no círculo'];
    assert.ok(icone(s1) && icone(s2) && icone(s1).assetId !== icone(s2).assetId);
    assert.ok(icone(s1).x < s1['Título'].x && icone(s2).x > s2['Título'].x, 'o ícone alterna o lado');
    // o fim da peça que não é de Conversão: o fechamento dela, sem botão de venda
    assert.equal(semMarca(fim['Fechamento'].texto), 'Comenta aí qual você usa.');
    assert.ok(!fim['Botão'] && (variante === 'escuro' ? fim['Ícone 3D no círculo'] : fim['Ícone 3D']), 'o ícone do fim: círculo no escuro, card no claro');
    semProblema(car);
    // o design aparece pela peça (o "Criar no Ateliê" abre o mais recente)
    assert.deepEqual((await pedir('/api/estudio/docs?pecaId=reel_car')).j.docs.map((d) => d.id), [car.j.id]);

    // o fim da peça de Conversão: o logo no centro, o convite e o botão do link da bio; o convite que já fala do link fica sem botão
    const conv = await montar('reel_conv');
    assert.equal(conv.status, 201, JSON.stringify(conv.j));
    const fimConv = porNome(conv.j.paginas.at(-1));
    assert.equal(semMarca(fimConv['Convite'].texto), 'Entra na lista de espera.');
    assert.equal(fimConv['Botão'].texto, 'Clica no link da bio');
    assert.ok(!fimConv['Contabilidade Digital'] || fimConv['Contabilidade Digital'].alinhamento === 'centro');
    semProblema(conv);
    const conv2 = await montar('reel_conv2');
    assert.equal(conv2.j.paginas.length, 2, 'sem slide: a capa e o fim');
    assert.equal(porNome(conv2.j.paginas[1])['Botão'], undefined);
    // os dois carrosséis seguidos no cronograma (05 e 06/07) têm capas diferentes: um escuro, o outro claro (a skill:
    // nunca duas capas iguais em sequência); o fim de Conversão do claro é a página coral
    const capaDe = (r) => r.j.paginas[0].fundo;
    assert.notDeepEqual(capaDe(conv), capaDe(conv2));
    const claro = [conv, conv2].find((r) => r.j.paginas[0].fundo.cor?.toLowerCase() === '#faf8f5');
    assert.equal(claro.j.paginas.at(-1).fundo.cor.toLowerCase(), '#f2643c');

    // remontar: o design que já existe troca as páginas pelas montadas de novo, como versão nova (a de antes fica guardada)
    const pagAntes = structuredClone(car.j.paginas);
    const db2 = await carregar();
    db2.reels.find((r) => r.id === 'reel_car').carrossel.slides.push({ titulo: 'Sem papel', texto: 'Tudo pelo app.', visual: '' });
    await salvar();
    const re = await pedir(`/api/estudio/docs/${car.j.id}/remontar`, { metodo: 'POST', corpo: { versao: car.j.versao } });
    assert.equal(re.status, 200, JSON.stringify(re.j));
    assert.equal(re.j.versao, car.j.versao + 1);
    assert.equal(re.j.pecaId, 'reel_car');
    assert.equal(re.j.paginas.length, 5, 'o slide novo da peça entrou');
    assert.notDeepEqual(re.j.paginas, pagAntes);
    assert.equal((await pedir(`/api/estudio/docs/${car.j.id}/remontar`, { metodo: 'POST', corpo: { versao: car.j.versao } })).status, 409, 'versão velha');
    const solto = await criar(docSimples({ titulo: 'Sem peça' }));
    assert.equal((await pedir(`/api/estudio/docs/${solto.id}/remontar`, { metodo: 'POST', corpo: { versao: solto.versao } })).status, 409, 'sem peça ligada');

    // estático: sem a pílula do público (23/10, Pedro: a tag fica no banco, como asset); corpo e card que a peça não tem saem
    const est = await montar('reel_est');
    assert.equal(est.status, 201, JSON.stringify(est.j));
    assert.equal(est.j.paginas.length, 1);
    const e = porNome(est.j.paginas[0]);
    assert.equal(e['Título'].texto, 'A guia do MEI sai pelo app');
    assert.equal(e['Pílula dica de mei'], undefined);
    assert.ok(!e['Corpo'] && !e['Card'] && !e['Sino'] && !e['Texto do card'] && !e['Fonte']);
    semProblema(est);

    // reel: a capa, em stories, com o gancho
    const capaReel = await montar('reel_capa');
    assert.equal(capaReel.status, 201, JSON.stringify(capaReel.j));
    assert.equal(capaReel.j.formato, 'stories');
    assert.equal(capaReel.j.titulo, 'Capa do reel · Reel da burocracia');
    assert.equal(porNome(capaReel.j.paginas[0])['Título'].texto, 'Cansou de papel?');

    // stories: um quadro por página (o vazio não entra); o quadro longo: a primeira frase no título e o resto no card
    const sto = await montar('sto_longo');
    assert.equal(sto.status, 201, JSON.stringify(sto.j));
    assert.equal(sto.j.titulo, 'Story · Recap do preço');
    assert.equal(sto.j.paginas.length, 2);
    const [q1, q2] = sto.j.paginas.map(porNome);
    assert.equal(q1['Título'].texto, 'Recapitulando o post de ontem:');
    assert.equal(q1['Dica'].texto, longo);
    const k = q1['Card'];
    assert.ok(k && q1['Dica'].y >= k.y && q1['Dica'].y + q1['Dica'].altura <= k.y + k.altura, 'o card cresce com o texto de dentro');
    assert.ok(!q1['Pílula dica rápida'] && !q1['Detalhe']);
    assert.equal(q2['Título'].texto, 'Manda sua dúvida na caixinha.');
    assert.ok(!q2['Card'] && !q2['Dica'] && !q2['Folha de papel'], 'quadro curto: só o título');
    semProblema(sto);

    // a peça postada também monta (a arte exportada dela fica solta no design, não se anexa)
    const postada = await montar('reel_postado');
    assert.equal(postada.status, 201, JSON.stringify(postada.j));
    const exPostada = await exportar(postada.j.id, PNG);
    assert.equal(exPostada.j?.anexo?.anexada, false, JSON.stringify(exPostada.j));
    assert.equal((await pecaDoBanco('reel_postado')).artes ?? undefined, undefined);
    // peça que não existe, o Diretor e o modelo que sumiu do repo
    assert.equal((await montar('reel_nao_existe')).status, 404);
    assert.equal((await montar('reel_car', 'diretor')).status, 403);
    rmSync(path.join(pasta, 'stories-dica.json'));
    assert.equal((await montar('sto_longo')).status, 503);
  } finally {
    estudio.definirFonteAssets(() => ASSETS);
    rmSync(pasta, { recursive: true, force: true });
  }
});
