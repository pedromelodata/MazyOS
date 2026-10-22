// 22/10 (achados da revisão do estúdio): fumaça do editor de design no Node sem navegador. As contas sem DOM do
// editor.js e do painel-dir.js (o bloco que cresce sem sair da área segura, a troca de imagem que cabe na caixa, o
// cadeado de proporção, os textos escolhidos juntos, as cores que acompanham o fundo, o contraste da marca, a pílula
// que acompanha o texto e a exceção de corte reto marcada no uso), as sementes dos Destaques e a trava do editor
// destruído (o editor de verdade, no modo prévia do celular, com o fetch de mentira). core.js mexe no document ao
// carregar: os globais mínimos entram antes do import (por isso import dinâmico).
// Rodar: node --test "server/testes/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const nada = () => {};
function elementoFalso() {
  return {
    style: {}, dataset: {}, hidden: true, className: '', innerHTML: '', isConnected: true, clientWidth: 0,
    setAttribute: nada, getAttribute: () => null, removeAttribute: nada, toggleAttribute: nada,
    append: nada, appendChild: nada, replaceChildren: nada, remove: nada, focus: nada,
    addEventListener: nada, removeEventListener: nada,
    querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    classList: { add: nada, remove: nada, toggle: nada, contains: () => false },
  };
}
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
globalThis.location = { hash: '#/atelie', pathname: '/', search: '', href: 'http://localhost/' };
globalThis.addEventListener = nada;
globalThis.removeEventListener = nada;
// o celular: o editor abre na prévia (sem a mesa de edição, que precisa do navegador)
globalThis.matchMedia = () => ({ matches: true, addEventListener: nada, removeEventListener: nada });
globalThis.CSS = { escape: (s) => String(s) };
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, setItem: nada, removeItem: nada }, configurable: true, writable: true });

// o servidor de mentira: guarda o design e conta os PUT
const servidor = { doc: null, puts: [] };
const resposta = (j, status = 200) => ({ ok: status < 400, status, json: async () => j, arrayBuffer: async () => new ArrayBuffer(8) });
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  const metodo = opts.method ?? 'GET';
  if (u.includes('/fontes/')) return resposta({});
  if (u.startsWith('/api/estudio/docs/') && metodo === 'GET') return resposta(structuredClone(servidor.doc));
  if (u.startsWith('/api/estudio/docs/') && metodo === 'PUT') {
    const corpo = JSON.parse(opts.body);
    servidor.puts.push(corpo);
    servidor.doc = { ...servidor.doc, ...corpo, versao: corpo.versao + 1 };
    return resposta(structuredClone(servidor.doc));
  }
  if (u.startsWith('/api/estudio/mecanismo')) return resposta({ alertas: [] });
  if (u.startsWith('/api/estudio/assets')) return resposta({ assets: [] });
  return resposta({ erro: 'não existe' }, 404);
};

const M = await import('../../public/js/estudio/modelo.js');
const E = await import('../../public/js/estudio/editor.js');
const P = await import('../../public/js/estudio/painel-dir.js');

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(AQUI, '../../estudio/base');
const lerJson = (...p) => JSON.parse(readFileSync(path.join(BASE, ...p), 'utf8'));
const catalogo = lerJson('catalogo.json');
const assetsPorId = new Map(catalogo.assets.map((a) => [a.id, a]));
const semente = (nn) => M.normalizarDoc(lerJson('docs', `comece-por-aqui-${nn}.json`));
const camadaDe = (doc, id) => doc.paginas[0].camadas.find((c) => c.id === id);
const AREA_STORIES = { x0: 96, y0: 240, x1: 984, y1: 1560 };
const dentro = (b, a = AREA_STORIES) => b.x0 >= a.x0 - 0.5 && b.x1 <= a.x1 + 0.5 && b.y0 >= a.y0 - 0.5 && b.y1 <= a.y1 + 0.5;

test('o Léo e a papelada do Destaque 02 crescem pelo centro só até a área segura (e avisam que pararam)', () => {
  const d = semente('02');
  const bloco = M.uniao(['cam_q2_02', 'cam_q2_03'].map((id) => M.caixaGirada(camadaDe(d, id))));
  const cx = (bloco.x0 + bloco.x1) / 2;
  const cy = (bloco.y0 + bloco.y1) / 2;
  const r = E.escalaPeloCentro(bloco, 1.2, AREA_STORIES, cx, cy);
  assert.equal(r.parou, true);
  // a largura toda da área segura (888) é o teto: o bloco de 882 cresce menos de 1%
  assert.ok(Math.abs((bloco.x1 - bloco.x0) * r.k - 888) < 1e-6, String(r.k));
  const depois = { x0: cx + (bloco.x0 - cx) * r.k + r.dx, x1: cx + (bloco.x1 - cx) * r.k + r.dx, y0: cy + (bloco.y0 - cy) * r.k + r.dy, y1: cy + (bloco.y1 - cy) * r.k + r.dy };
  assert.ok(dentro(depois), JSON.stringify(depois));
  // diminuir nunca trava
  assert.deepEqual(E.escalaPeloCentro(bloco, 0.8, AREA_STORIES, cx, cy), { k: 0.8, dx: 0, dy: 0, parou: false });
});

test('perto da margem, o bloco cresce pro lado que tem espaço; o lado que já estava fora não trava', () => {
  const perto = { x0: 100, y0: 600, x1: 300, y1: 800 };
  const r = E.escalaPeloCentro(perto, 1.5, AREA_STORIES, 200, 700);
  assert.equal(r.parou, false);
  assert.equal(r.k, 1.5);
  assert.ok(r.dx > 0 && Math.abs(200 + (100 - 200) * 1.5 + r.dx - 96) < 1e-9, 'encosta na margem da esquerda e o resto vai pra direita');
  // o busto de corte reto colado na base da página: a base não segura, o topo segura
  const busto = { x0: 300, y0: 1500, x1: 700, y1: 1920 };
  const b = E.escalaPeloCentro(busto, 1.1, AREA_STORIES, 500, 1710);
  assert.equal(b.parou, false);
  assert.equal(b.dy, 0);
});

test('a alça do grupo: o canto oposto fica parado e o canto que anda para na margem', () => {
  const bloco = { x0: 200, y0: 400, x1: 800, y1: 900 };
  const r = E.escalaComAncora(bloco, 1.5, AREA_STORIES, 200, 400);
  assert.equal(r.parou, true);
  assert.ok(Math.abs(200 + 600 * r.k - 984) < 1e-9, String(r.k));
  assert.deepEqual(r.limite, { eixo: 'x', v: 984 });
  assert.deepEqual(E.escalaComAncora(bloco, 1.1, AREA_STORIES, 200, 400), { k: 1.1, parou: false, limite: null });
});

test('trocar a pose do Léo: a imagem nova cabe na caixa antiga com o mesmo centro e não sai da área segura', () => {
  const d = semente('02');
  const leo = camadaDe(d, 'cam_q2_02');
  const papelada = camadaDe(d, 'cam_q2_03');
  const pose = assetsPorId.get('ast_base_leo-bracos-abertos');
  const n = E.caixaContida(leo, pose.largura, pose.altura);
  assert.ok(n.largura <= leo.largura + 0.05 && n.altura <= leo.altura + 0.05);
  assert.ok(Math.abs(n.largura / n.altura - pose.largura / pose.altura) < 0.002, 'proporção do arquivo');
  assert.ok(Math.abs(n.x + n.largura / 2 - (leo.x + leo.largura / 2)) < 0.1 && Math.abs(n.y + n.altura / 2 - (leo.y + leo.altura / 2)) < 0.1, 'mesmo centro');
  assert.ok(dentro({ x0: n.x, y0: n.y, x1: n.x + n.largura, y1: n.y + n.altura }));
  assert.ok(n.x + n.largura < papelada.x, 'não encosta na papelada');
});

test('cadeado de proporção: a largura digitada leva a altura junto, pela proporção do arquivo, e o centro fica', () => {
  const d = semente('02');
  const leo = camadaDe(d, 'cam_q2_02');
  const a = assetsPorId.get(leo.assetId);
  const n = P.tamanhoNaProporcao(leo, 'largura', 420, a.largura / a.altura);
  assert.equal(n.largura, 420);
  assert.ok(Math.abs(n.altura - (420 * a.altura) / a.largura) < 0.1, String(n.altura));
  assert.ok(Math.abs(n.x + n.largura / 2 - (leo.x + leo.largura / 2)) < 0.1);
  assert.ok(Math.abs(n.y + n.altura / 2 - (leo.y + leo.altura / 2)) < 0.1);
  const h = P.tamanhoNaProporcao(leo, 'altura', 500, a.largura / a.altura);
  assert.ok(Math.abs(h.largura / h.altura - a.largura / a.altura) < 0.001);
});

test('vários textos: o campo mostra o valor de todos ou fica em "vários"', () => {
  assert.equal(P.valorComum(['#1B1E24', '#1b1e24', '#1B1E24FF']), '#1B1E24');
  assert.equal(P.valorComum(['#1B1E24', '#524E48']), undefined);
  assert.equal(P.valorComum([96, 96]), 96);
  assert.equal(P.valorComum([96, 100]), undefined);
  assert.equal(P.valorComum([]), undefined);
});

test('fundo claro pra escuro: os textos na tinta da marca e o logo trocam; o texto do card e a pílula ficam', () => {
  const d = M.normalizarDoc(lerJson('modelos', 'estatico-dica.json'));
  const pag = d.paginas[0];
  const plano = E.trocaDeCores(pag, true, assetsPorId);
  const de = (id) => plano.find((m) => m.id === id);
  assert.deepEqual(de('cam_dica_03'), { id: 'cam_dica_03', cor: '#F4F1EC', corDestaque: '#F2643C' });
  assert.equal(de('cam_dica_04').cor, '#BDB8B0');
  assert.equal(de('cam_dica_10').assetId, 'ast_base_logo-negativo-claro');
  assert.equal(de('cam_dica_09'), undefined, 'o texto em cima do card claro fica');
  assert.equal(de('cam_dica_01'), undefined, 'a pílula tem fundo próprio');
  // e volta: do escuro pro claro
  for (const m of plano) Object.assign(pag.camadas.find((c) => c.id === m.id), m);
  const volta = E.trocaDeCores(pag, false, assetsPorId);
  assert.equal(volta.find((m) => m.id === 'cam_dica_03').cor, '#1B1E24');
  assert.equal(volta.find((m) => m.id === 'cam_dica_10').assetId, 'ast_base_logo-horizontal');
});

test('contraste da marca: o logo em tinta some no escuro; o símbolo coral no papel é o uso de sempre', () => {
  const doc = (fundo, assetId) => M.normalizarDoc({ formato: 'feed45', paginas: [{ fundo, camadas: [{ tipo: 'imagem', nome: 'Logo', assetId, x: 72, y: 1200, largura: 220, altura: 43 }] }] });
  const escuro = { tipo: 'gradiente', cor: '#2A2E37', cor2: '#15171C', angulo: 160 };
  const papel = { tipo: 'cor', cor: '#FAF8F5' };
  const av = (fundo, id) => { const d = doc(fundo, id); return E.avisosDaMarca(d, d.paginas[0], assetsPorId); };
  const logoNoEscuro = av(escuro, 'ast_base_logo-horizontal');
  assert.equal(logoNoEscuro.length, 1);
  assert.equal(logoNoEscuro[0].nivel, 'alerta');
  assert.match(logoNoEscuro[0].texto, /versão branca/);
  assert.equal(av(escuro, 'ast_base_logo-negativo-claro').length, 0);
  assert.equal(av(papel, 'ast_base_logo-horizontal').length, 0);
  assert.equal(av(papel, 'ast_base_simbolo').length, 0);
  assert.equal(av(papel, 'ast_base_simbolo-negativo').length, 1);
  assert.equal(av({ tipo: 'cor', cor: '#F2643C' }, 'ast_base_simbolo').length, 1, 'o símbolo coral no fundo coral');
});

test('a pílula do Destaque 02 acompanha o texto: "Papelada demais" alarga o texto e a forma, com o mesmo respiro', () => {
  const d = semente('02');
  const pag = d.paginas[0];
  const texto = camadaDe(d, 'cam_q2_06');
  const forma = E.pilulaDoTexto(pag, texto);
  assert.equal(forma?.id, 'cam_q2_05');
  assert.equal(E.pilulaDoTexto(pag, camadaDe(d, 'cam_q2_04')), null, 'o título não está em pílula');
  const g = E.acompanharPilula(texto, forma, 214, 384, 'esquerda');
  assert.equal(g.texto.x, texto.x);
  assert.equal(g.pilula.x, forma.x);
  assert.ok(Math.abs(g.texto.largura - (texto.largura + 170)) < 1e-9 && Math.abs(g.pilula.largura - (forma.largura + 170)) < 1e-9);
  assert.equal(g.d, 170);
  const c = E.acompanharPilula(texto, forma, 214, 184, 'centro');
  assert.ok(Math.abs(c.texto.x - (texto.x + 15)) < 1e-9 && Math.abs(c.pilula.x - (forma.x + 15)) < 1e-9, 'no centro, os dois lados andam');
  // a fileira: a pílula do Prazo (com o texto e o relógio) anda junto; a fileira de baixo, a luz e o título ficam
  const vizinhos = E.vizinhosDaLinha(pag, forma, d, assetsPorId).map((o) => o.id).sort();
  assert.deepEqual(vizinhos, ['cam_q2_08', 'cam_q2_09', 'cam_q2_10']);
});

test('Destaques aprovados: o Léo do 01 sai pela base com a exceção marcada no uso, o grifo do 05 dentro da área, contraste do 06', () => {
  const avisos = (nn) => {
    const d = semente(nn);
    const pag = d.paginas[0];
    return [...E.semExcecaoDoUso(M.avisosDaPagina(d, pag, { assetsPorId }), d, pag), ...E.avisosDaMarca(d, pag, assetsPorId)];
  };
  const leo = camadaDe(semente('01'), 'cam_q1_01');
  assert.equal(E.corteRetoNoUso(leo), true);
  assert.equal(assetsPorId.get(leo.assetId).tags.includes('corte reto'), false, 'o asset de corpo inteiro continua sem a tag');
  const a01 = avisos('01');
  assert.ok(!a01.some((a) => a.regra === 'area-segura'), JSON.stringify(a01));
  assert.ok(!a01.some((a) => a.regra === 'colisao' && a.camadas.includes('cam_q1_05') && a.camadas.includes('cam_q1_01')), 'os brilhos não encostam no Léo');
  assert.ok(!avisos('05').some((a) => a.regra === 'area-segura'));
  assert.ok(!avisos('06').some((a) => a.regra === 'contraste'));
  // a exceção é do uso: o mesmo Léo sem "corte reto" no nome continua avisando
  const d = semente('01');
  camadaDe(d, 'cam_q1_01').nome = 'Léo apontando pra cima';
  assert.ok(E.semExcecaoDoUso(M.avisosDaPagina(d, d.paginas[0], { assetsPorId }), d, d.paginas[0]).some((a) => a.regra === 'area-segura'));
  // nenhum Destaque some com a marca no fundo
  for (const nn of ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10']) {
    const s = semente(nn);
    assert.deepEqual(E.avisosDaMarca(s, s.paginas[0], assetsPorId), [], nn);
  }
});

test('editor destruído não grava mais: o pendente vai uma vez no destruir e o ouvinte velho não muda nada', async () => {
  servidor.doc = {
    id: 'est_teste', titulo: 'Teste', formato: 'stories', largura: 1080, altura: 1920, versao: 1, origem: 'manual',
    paginas: [{ id: 'pag_1', fundo: { tipo: 'cor', cor: '#FAF8F5' }, camadas: [{ id: 'cam_1', tipo: 'texto', nome: 'Título', x: 96, y: 300, largura: 600, altura: 100, texto: 'Oi', tamanho: 60 }] }],
  };
  servidor.puts = [];
  const editor = E.criarEditor(elementoFalso(), 'est_teste');
  const ed = editor._ed;
  for (let i = 0; i < 50 && !ed.assetsProntos; i++) await new Promise((r) => setTimeout(r, 10));
  assert.equal(ed.doc?.titulo, 'Teste', 'o design abriu');
  ed.mudar((d) => { d.titulo = 'Antes de fechar'; }, { redesenhar: null });
  assert.equal(ed.sujo, true);
  await editor.destruir();
  assert.equal(servidor.puts.length, 1, 'o que estava por salvar foi uma vez');
  assert.equal(servidor.puts[0].titulo, 'Antes de fechar');
  // o ouvinte velho (diálogo de modelos, vincular) chama o editor fechado: nada muda e nada grava
  ed.mudar((d) => { d.titulo = 'Depois de fechar'; });
  ed.vincular('reel_x');
  ed.mudarDocMeta((d) => { d.estrategia = { pilar: 1 }; });
  ed.sujar();
  assert.equal(ed.doc.titulo, 'Antes de fechar');
  assert.equal(ed.doc.pecaId, null);
  assert.equal(ed.sujo, false);
  await new Promise((r) => setTimeout(r, 1400));
  assert.equal(servidor.puts.length, 1, 'nenhum PUT depois do destruir');
});
