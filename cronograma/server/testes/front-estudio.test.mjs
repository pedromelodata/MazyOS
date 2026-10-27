// 22/10 (Pedro): fumaça do front do estúdio de design (editor tipo Canva do Ateliê), no Node sem navegador. Só os
// módulos puros: o modelo (formatos, área segura, normalização, geometria, encaixe, alinhar, distribuir, lugar livre,
// os avisos das regras do Pedro) e o gerador mínimo de PDF. O desenho e a exportação são testados no navegador.
// Rodar: node --test "server/testes/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const M = await import('../../public/js/estudio/modelo.js');
const { gerarPdf, dimensoesJpeg, textoPdf } = await import('../../public/js/estudio/pdf.js');
const Z = await import('../../public/js/estudio/zip.js');

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PUBLICO = path.resolve(AQUI, '../../public');
const BASE = path.resolve(AQUI, '../../estudio/base');

const docStories = (camadas = [], fundo = {}) => M.normalizarDoc({ titulo: 'Teste', formato: 'stories', paginas: [{ fundo, camadas }] });
const docFeed = (camadas = [], fundo = {}) => M.normalizarDoc({ titulo: 'Teste', formato: 'feed45', paginas: [{ fundo, camadas }] });
const texto = (extra = {}) => ({ tipo: 'texto', nome: 'Título', x: 96, y: 300, largura: 600, altura: 100, texto: 'Oi', tamanho: 60, cor: '#1B1E24', ...extra });

test('área segura: stories 96/240/360, feed e quadrado 72, personalizado 72 na proporção do lado menor', () => {
  assert.deepEqual(M.margemSegura({ formato: 'stories', largura: 1080, altura: 1920 }), { esq: 96, dir: 96, topo: 240, base: 360 });
  assert.deepEqual(M.margemSegura({ formato: 'feed45', largura: 1080, altura: 1350 }), { esq: 72, dir: 72, topo: 72, base: 72 });
  assert.deepEqual(M.margemSegura({ formato: 'quadrado', largura: 1080, altura: 1080 }), { esq: 72, dir: 72, topo: 72, base: 72 });
  assert.deepEqual(M.margemSegura({ formato: 'personalizado', largura: 540, altura: 960 }), { esq: 36, dir: 36, topo: 36, base: 36 });
  assert.deepEqual(M.areaSegura({ formato: 'stories', largura: 1080, altura: 1920 }), { x0: 96, y0: 240, x1: 984, y1: 1560 });
});

test('normalização: Sora até 800, DM Serif só 400 itálica, espaço entre letras em em, cor inválida cai no padrão', () => {
  const d = docStories([
    texto({ peso: 900 }),
    texto({ fonte: 'DM Serif Display', peso: 700, italico: false }),
    texto({ espacamentoLetra: -2, tamanho: 100 }),
    texto({ cor: 'url(javascript:alert(1))' }),
    { tipo: 'video', nome: 'não existe' },
  ]);
  const [a, b, c, e] = d.paginas[0].camadas;
  assert.equal(d.paginas[0].camadas.length, 4, 'tipo desconhecido sai');
  assert.equal(a.peso, 800);
  assert.equal(b.peso, 400);
  assert.equal(b.italico, true);
  assert.equal(c.espacamentoLetra, -0.02);
  assert.equal(e.cor, '#1B1E24');
});

test('normalização: id repetido de camada e de página ganha outro; documento vazio ganha uma página', () => {
  const d = M.normalizarDoc({ paginas: [{ id: 'p', camadas: [texto({ id: 'c' }), texto({ id: 'c' })] }, { id: 'p', camadas: [] }] });
  assert.notEqual(d.paginas[0].camadas[0].id, d.paginas[0].camadas[1].id);
  assert.notEqual(d.paginas[0].id, d.paginas[1].id);
  assert.equal(M.normalizarDoc({}).paginas.length, 1);
  assert.equal(M.normalizarDoc({ formato: 'xx' }).formato, 'personalizado');
});

test('o PUT leva só o conteúdo e a versão', () => {
  const d = docStories([texto()]);
  const corpo = M.corpoParaSalvar({ ...d, id: 'est_1', versao: 7, criadoEm: 'x', areaSegura: {} });
  assert.deepEqual(Object.keys(corpo).sort(), ['altura', 'estrategia', 'formato', 'guiasFixas', 'largura', 'origem', 'paginas', 'pecaId', 'titulo', 'versao']);
  // 23/10 (Pedro): as guias da régua vão junto, sempre no formato { v, h }
  assert.deepEqual(corpo.guiasFixas, { v: [], h: [] });
  assert.equal(corpo.versao, 7);
});

test('destaque entre asteriscos', () => {
  assert.deepEqual(M.trechosDestaque('Ter empresa *cansa*.'), [{ t: 'Ter empresa ', destaque: false }, { t: 'cansa', destaque: true }, { t: '.', destaque: false }]);
  assert.equal(M.textoSemMarcas('a *b* c *'), 'a b c *');
  assert.equal(M.contarPalavras('Você cuida do *negócio*.'), 4);
});

test('geometria: caixa girada, ponto na camada girada', () => {
  const c = { x: 0, y: 0, largura: 200, altura: 100, rotacao: 90 };
  const b = M.caixaGirada(c);
  assert.ok(Math.abs(b.x0 - 50) < 1e-9 && Math.abs(b.x1 - 150) < 1e-9 && Math.abs(b.y0 + 50) < 1e-9 && Math.abs(b.y1 - 150) < 1e-9);
  assert.equal(M.pontoNaCamada(c, 100, -40), true);
  assert.equal(M.pontoNaCamada(c, 10, 50), false);
});

test('encaixe: a caixa pula pro centro da página e devolve a guia', () => {
  const d = docStories();
  const alvos = M.alvosDeEncaixe(d, d.paginas[0]);
  const r = M.encaixar({ x0: 437, y0: 100, x1: 637, y1: 200 }, alvos, 6);
  assert.equal(r.dx, 3);
  assert.deepEqual(r.guiasX, [540]);
});

test('alinhar na área segura e no centro; distribuir com espaço igual', () => {
  const d = docStories();
  const cs = [{ x: 300, y: 500, largura: 100, altura: 100, rotacao: 0 }, { x: 500, y: 800, largura: 100, altura: 50, rotacao: 0 }];
  M.alinhar(cs, 'esquerda', d);
  assert.deepEqual(cs.map((c) => c.x), [96, 96]);
  M.alinhar(cs, 'centroH', d);
  assert.deepEqual(cs.map((c) => c.x), [490, 490]);
  M.alinhar(cs, 'base', d);
  assert.deepEqual(cs.map((c) => c.y + c.altura), [1560, 1560]);
  const tres = [{ x: 0, y: 0, largura: 100, altura: 10 }, { x: 150, y: 0, largura: 100, altura: 10 }, { x: 600, y: 0, largura: 100, altura: 10 }];
  assert.equal(M.distribuir(tres, 'h'), true);
  // 0 a 100, 150 a 250, 600 a 700: sobram 400 de vão, 200 em cada lado da do meio
  assert.equal(tres[1].x, 300);
  assert.equal(M.distribuir(tres.slice(0, 2), 'h'), false);
});

test('lugar livre: a camada nova não nasce em cima de outra', () => {
  const d = docStories([texto({ x: 96, y: 240, largura: 888, altura: 300 })]);
  const nova = M.normalizarCamada(texto({ x: 96, y: 300, largura: 888, altura: 100 }));
  const l = M.lugarLivre(d, d.paginas[0], nova);
  assert.ok(l && l.y >= 540, JSON.stringify(l));
});

test('avisos: área segura, texto que encosta, texto em card pode, barrinha, travessão, grafia, contraste', () => {
  const d = docStories([
    texto({ nome: 'Fora', x: 20, y: 300 }),
    texto({ nome: 'A', x: 96, y: 600, texto: 'Ter empresa' }),
    texto({ nome: 'B', x: 300, y: 650, texto: `Dois ${String.fromCharCode(0x2014)} Legalizai` }),
    { tipo: 'forma', nome: 'Card', forma: 'retangulo', x: 96, y: 900, largura: 800, altura: 300, cor: '#FFFFFF' },
    texto({ nome: 'No card', x: 120, y: 950, largura: 500, altura: 80 }),
    { tipo: 'forma', nome: 'Barrinha', forma: 'linha', x: 96, y: 1320, largura: 60, altura: 6, cor: '#F2643C' },
    texto({ nome: 'Depois da barra', x: 180, y: 1290, largura: 400, altura: 70 }),
    texto({ nome: 'Clarinho', x: 96, y: 1420, largura: 400, altura: 70, cor: '#F1EEE9' }),
  ]);
  const av = M.avisosDaPagina(d, d.paginas[0]);
  const regras = (r) => av.filter((a) => a.regra === r);
  assert.ok(regras('area-segura').some((a) => a.texto.includes('"Fora"')));
  assert.ok(regras('colisao').some((a) => a.texto.includes('"A"') && a.texto.includes('"B"')));
  assert.ok(!regras('colisao').some((a) => a.texto.includes('No card')), 'texto em cima do card que o contém pode');
  assert.equal(regras('barrinha').length, 1);
  assert.equal(regras('travessao').length, 1);
  assert.equal(regras('grafia').length, 1);
  assert.ok(regras('contraste').some((a) => a.texto.includes('Clarinho')));
  assert.ok(!regras('contraste').some((a) => a.texto.includes('No card')));
});

test('avisos: card atrás contém o ícone, grifo embaixo da palavra e a tinta medida do texto não contam como colisão', () => {
  const assets = new Map([['ast_grifo', { id: 'ast_grifo', categoria: 'outro', nome: 'Grifo coral à mão', largura: 400, altura: 34 }]]);
  const d = docStories([
    { tipo: 'forma', nome: 'Card', forma: 'retangulo', x: 96, y: 900, largura: 800, altura: 140, cor: '#FFFFFF' },
    { tipo: 'imagem', nome: 'Ícone', assetId: 'ast_x', x: 120, y: 930, largura: 80, altura: 80 },
    texto({ nome: 'Palavra', x: 96, y: 300, largura: 888, altura: 120, texto: 'A história' }),
    { tipo: 'imagem', nome: 'Grifo', assetId: 'ast_grifo', x: 150, y: 400, largura: 300, altura: 30 },
    texto({ nome: 'Curto', x: 96, y: 600, largura: 888, altura: 80, texto: 'Oi' }),
    { tipo: 'imagem', nome: 'Léo', assetId: 'ast_leo', x: 700, y: 560, largura: 200, altura: 200 },
  ]);
  const ids = Object.fromEntries(d.paginas[0].camadas.map((c) => [c.nome, c.id]));
  const pela = (tintas) => M.avisosDaPagina(d, d.paginas[0], { assetsPorId: assets, tintas }).filter((a) => a.regra === 'colisao');
  const semTinta = pela(null);
  assert.ok(!semTinta.some((a) => a.camadas.includes(ids['Ícone'])), 'ícone dentro do card');
  assert.ok(!semTinta.some((a) => a.camadas.includes(ids.Grifo)), 'grifo com texto');
  assert.ok(semTinta.some((a) => a.camadas.includes(ids.Curto) && a.camadas.includes(ids['Léo'])), 'pela caixa, o texto curto encosta no Léo');
  const tintas = new Map([[ids.Curto, [{ x0: 96, y0: 600, x1: 160, y1: 680 }]]]);
  assert.ok(!pela(tintas).some((a) => a.camadas.includes(ids.Curto)), 'pela tinta, não encosta');
});

test('avisos: fundo pode sangrar; o símbolo da marca vai inteiro', () => {
  const assets = new Map([
    ['ast_fundo', { id: 'ast_fundo', categoria: 'fundo', nome: 'Papel', largura: 1080, altura: 1920 }],
    ['ast_simbolo', { id: 'ast_simbolo', categoria: 'marca', nome: 'Símbolo', tags: ['simbolo'], largura: 211, altura: 211 }],
  ]);
  const d = docFeed([
    { tipo: 'imagem', nome: 'Papel', assetId: 'ast_fundo', x: -20, y: -20, largura: 1120, altura: 1390 },
    { tipo: 'imagem', nome: 'Símbolo', assetId: 'ast_simbolo', x: 1000, y: 100, largura: 200, altura: 200 },
  ]);
  const av = M.avisosDaPagina(d, d.paginas[0], { assetsPorId: assets });
  assert.ok(!av.some((a) => a.camadas.includes(d.paginas[0].camadas[0].id)), 'fundo não avisa');
  assert.ok(av.some((a) => a.regra === 'simbolo'));
});

test('trocar o formato leva as camadas junto', () => {
  const d = docStories([texto({ x: 96, y: 240, largura: 888, tamanho: 96 })]);
  M.redimensionarDoc(d, 1080, 1350);
  const c = d.paginas[0].camadas[0];
  assert.equal(d.altura, 1350);
  assert.ok(c.tamanho < 96 && c.tamanho > 60);
  assert.equal(M.nomeArquivo('Comece por aqui 02 · Dor'), 'comece-por-aqui-02-dor');
});

// JPEG mínimo só com o cabeçalho (SOI, SOF0 com o tamanho, EOI): o PDF não decodifica, só embrulha
function jpegFalso(w, h) {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, h >> 8, h & 255, w >> 8, w & 255, 0x03, 1, 0x11, 0, 2, 0x11, 1, 3, 0x11, 1, 0xff, 0xd9]);
}

test('PDF: páginas, tamanho em pontos, tabela xref com os offsets certos e título com acento', () => {
  const bytes = gerarPdf([
    { jpeg: jpegFalso(2160, 3840), larguraPt: 810, alturaPt: 1440 },
    { jpeg: jpegFalso(2160, 3840), larguraPt: 810, alturaPt: 1440 },
  ], { titulo: 'Comece por aqui · Legalizaí' });
  const s = Buffer.from(bytes).toString('latin1');
  assert.ok(s.startsWith('%PDF-1.4\n'));
  assert.ok(s.trimEnd().endsWith('%%EOF'));
  assert.match(s, /\/Count 2/);
  assert.match(s, /\/MediaBox \[0 0 810 1440\]/);
  assert.match(s, /\/Width 2160 \/Height 3840 \/ColorSpace \/DeviceRGB/);
  const startxref = Number(/startxref\n(\d+)/.exec(s)[1]);
  assert.equal(s.slice(startxref, startxref + 4), 'xref');
  const linhas = s.slice(startxref).split('\n');
  const total = Number(linhas[1].split(' ')[1]);
  for (let n = 1; n < total; n++) {
    const off = Number(linhas[2 + n].slice(0, 10));
    assert.equal(s.slice(off, off + `${n} 0 obj`.length), `${n} 0 obj`, `objeto ${n}`);
  }
  assert.ok(s.includes(textoPdf('Comece por aqui · Legalizaí')));
  assert.deepEqual(dimensoesJpeg(jpegFalso(10, 20)), { largura: 10, altura: 20, componentes: 3 });
  assert.throws(() => gerarPdf([]));
});

// ---------- 22/10 (achados da revisão) ----------

test('zip: CRC32, cabeçalhos, diretório central e nome em UTF-8; os dados entram como estão', async () => {
  const { crc32: crcDoNode } = await import('node:zlib');
  assert.equal(Z.crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  const grande = Uint8Array.from({ length: 70_000 }, (_, i) => (i * 7919) & 255);
  assert.equal(Z.crc32(grande), crcDoNode(grande));
  assert.equal(Z.crc32(grande.subarray(500), Z.crc32(grande.subarray(0, 500))), crcDoNode(grande), 'soma em partes');
  const arquivos = [{ nome: 'página-p01@2x.png', dados: new TextEncoder().encode('um') }, { nome: 'b.png', dados: grande }];
  const z = Z.gerarZip(arquivos, { data: new Date(2026, 9, 22, 15, 30, 10) });
  const v = new DataView(z.buffer);
  // o fim do diretório: 2 arquivos, o diretório central logo depois dos dados
  const fim = z.length - 22;
  assert.equal(v.getUint32(fim, true), 0x06054b50);
  assert.equal(v.getUint16(fim + 10, true), 2);
  let o = v.getUint32(fim + 16, true);
  assert.equal(o + v.getUint32(fim + 12, true), fim);
  for (const a of arquivos) {
    assert.equal(v.getUint32(o, true), 0x02014b50);
    assert.equal(v.getUint16(o + 8, true), 0x0800, 'nome em UTF-8');
    assert.equal(v.getUint16(o + 10, true), 0, 'STORE');
    const n = v.getUint16(o + 28, true);
    assert.equal(new TextDecoder().decode(z.subarray(o + 46, o + 46 + n)), a.nome);
    assert.equal(v.getUint32(o + 16, true), Z.crc32(a.dados));
    const local = v.getUint32(o + 42, true);
    assert.equal(v.getUint32(local, true), 0x04034b50);
    const ini = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    assert.deepEqual(z.subarray(ini, ini + a.dados.length), a.dados);
    o += 46 + n;
  }
  // a hora do MS-DOS: 15:30:10
  assert.equal(v.getUint16(10, true), (15 << 11) | (30 << 5) | 5);
  // o Blob da página exportada entra sem cópia, com o CRC e o tamanho já calculados
  const partes = Z.partesDoZip([{ nome: 'x.png', dados: new Blob([grande]), tamanho: grande.length, crc: Z.crc32(grande) }]);
  assert.ok(partes[1] instanceof Blob);
  assert.throws(() => Z.partesDoZip([]));
  assert.throws(() => Z.partesDoZip([{ nome: 'a', dados: new Uint8Array(1) }, { nome: 'a', dados: new Uint8Array(1) }]), /repetido/);
  assert.throws(() => Z.partesDoZip([{ nome: 'a', dados: new Blob(['x']) }]), /CRC/);
});

test('trocar de formato não desalinha: o Destaque 07 no feed, a página de stories num feed', () => {
  const cat = JSON.parse(readFileSync(path.join(BASE, 'catalogo.json'), 'utf8'));
  const assetsPorId = new Map(cat.assets.map((a) => [a.id, a]));
  const d = M.normalizarDoc(JSON.parse(readFileSync(path.join(BASE, 'docs', 'comece-por-aqui-07.json'), 'utf8')));
  const antes = M.clonar(d.paginas[0].camadas);
  const x0 = antes.find((c) => c.nome === '100%').x;
  const rotulos = antes.filter((c) => c.tipo === 'texto' && Math.abs(c.x - x0) < 0.5).map((c) => c.id);
  assert.ok(rotulos.length >= 5, 'os 5 rótulos dos cartões dividem o x');
  M.redimensionarDoc(d, 1080, 1350, { formato: 'feed45', assetsPorId });
  const por = (id) => d.paginas[0].camadas.find((c) => c.id === id);
  assert.equal(new Set(rotulos.map((id) => por(id).x)).size, 1, `rótulos em ${rotulos.map((id) => por(id).x)}`);
  const simbolos = antes.filter((c) => c.nome === 'Símbolo').map((c) => por(c.id).x);
  assert.equal(new Set(simbolos).size, 1);
  const vao = (a, b) => { const p = d.paginas[0].camadas.find((c) => c.nome === a); const q = d.paginas[0].camadas.find((c) => c.nome === b); return q.x - (p.x + p.largura); };
  assert.ok(vao('100%', 'Humana') < 3, `100% e Humana continuam juntos (${vao('100%', 'Humana')})`);
  // a página de um modelo de stories num feed: o que dividia a borda dentro do cartão continua dividindo, e o "/mês" colado no preço
  const feed = M.normalizarDoc({ titulo: 'Em branco', formato: 'feed45', paginas: [{}] });
  const modelo = (nome) => ({ id: nome, ...JSON.parse(readFileSync(path.join(BASE, 'modelos', `${nome}.json`), 'utf8')) });
  const dica = M.paginasDoModelo(modelo('stories-dica'), feed, assetsPorId)[0].camadas;
  assert.equal(new Set(['Folha de papel', 'Dica', 'Detalhe'].map((n) => dica.find((c) => c.nome === n).x)).size, 1);
  const oferta = M.paginasDoModelo(modelo('stories-oferta'), feed, assetsPorId)[0].camadas;
  const preco = oferta.find((c) => c.nome === 'Preço');
  const mes = oferta.find((c) => c.nome === 'Por mês');
  assert.ok(mes.x - (preco.x + preco.largura) < 16, `vão de ${mes.x - (preco.x + preco.largura)} px entre o preço e o /mês`);
});

test('avisos: a colisão pela tinta varre pela altura (14 textos de 2000 linhas em menos de 50 ms)', () => {
  // caixas largas que se cruzam; as linhas de cada texto ficam numa coluna só dele, então nenhuma letra encosta
  const camadas = Array.from({ length: 14 }, (_, k) => texto({ id: `t${k}`, nome: `T${k}`, x: 100, y: 240 + k, largura: 880, altura: 28_000, tamanho: 12 }));
  const d = docStories(camadas);
  const tintas = new Map(camadas.map((c, k) => [c.id, Array.from({ length: 2000 }, (_, i) => ({ x0: 100 + 60 * k, y0: 240 + k + 14 * i, x1: 150 + 60 * k, y1: 252 + k + 14 * i }))]));
  M.avisosDaPagina(d, d.paginas[0], { tintas });
  const t0 = performance.now();
  const av = M.avisosDaPagina(d, d.paginas[0], { tintas });
  const ms = performance.now() - t0;
  assert.ok(ms < 50, `${Math.round(ms)} ms`);
  assert.equal(av.filter((a) => a.regra === 'colisao').length, 0);
  // e a linha que encosta de verdade ainda aparece
  tintas.get('t1').push({ x0: 100, y0: 900, x1: 160, y1: 940 });
  assert.equal(M.avisosDaPagina(d, d.paginas[0], { tintas }).filter((a) => a.regra === 'colisao').length, 1);
});

test('escala por formato e palavras: a mesma conta do servidor', () => {
  const regras = (d) => M.avisosDaPagina(d, d.paginas[0]).filter((a) => ['escala', 'palavras'].includes(a.regra)).map((a) => a.texto);
  const tit = (tamanho, extra = {}) => texto({ nome: 'Título', y: 300, altura: 240, texto: 'Um título curto', tamanho, ...extra });
  const corpo = (tamanho) => texto({ nome: 'Corpo', y: 700, altura: 300, texto: 'uma frase de apoio com dez palavras pra ler no celular', tamanho });
  // stories: título de 80 a 112 (o Destaque 07 aprovado tem 80) e corpo de 36 a 44; o mesmo 96 que no feed passa de 92
  assert.deepEqual(regras(docStories([tit(96), corpo(40)])), []);
  assert.match(regras(docStories([tit(70), corpo(40)]))[0], /título vai de 80 a 112/);
  assert.match(regras(docStories([tit(96), corpo(30)]))[0], /corpo vai de 36 a 44/);
  assert.match(regras(docFeed([tit(96), corpo(30)]))[0], /título vai de 54 a 92/);
  // o número em destaque, a lista sem título e a página de um texto só não têm título pra conferir
  assert.deepEqual(regras(docStories([texto({ nome: 'Preço', texto: 'R$ 99', tamanho: 180, altura: 200 }), tit(60, { y: 600 })])), []);
  assert.deepEqual(regras(docStories([0, 1, 2].map((i) => texto({ nome: `Nome ${i}`, texto: 'Pedro Melo', tamanho: 44, y: 300 + 100 * i, altura: 60 })))), []);
  assert.deepEqual(regras(docStories([texto({ texto: 'A gente tá aqui pra tirar a burocracia do CNPJ das suas costas.', tamanho: 88, altura: 400 })])), []);
  // palavras: a conta do servidor ("31/12/2026" é uma; antes o editor contava 8 aqui) e o mesmo teto
  assert.equal(M.contarPalavras('Até 31/12/2026, R$ 99 *por mês*.'), 6);
  assert.equal(M.LIMITE_PALAVRAS, 35);
  const muitas = texto({ y: 1100, altura: 100, tamanho: 40, texto: Array.from({ length: 36 }, (_, i) => `p${i}`).join(' ') });
  assert.ok(regras(docStories([muitas])).some((t) => /36 palavras/.test(t)));
});

test('zero travessão nos arquivos do estúdio (código, comentário e texto)', () => {
  const traco = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
  const arquivos = [
    ...readdirSync(path.join(PUBLICO, 'js', 'estudio')).filter((f) => f.endsWith('.js')).map((f) => path.join(PUBLICO, 'js', 'estudio', f)),
    path.join(PUBLICO, 'css', 'views', 'estudio.css'),
    path.join(PUBLICO, 'js', 'views', 'atelie.js'),
  ];
  for (const f of arquivos) assert.ok(!traco.test(readFileSync(f, 'utf8')), path.basename(f));
});

// 23/10 (Pedro: Ctrl + G agrupa; a régua com guias que valem em todas as páginas e atraem as camadas)
test('grupo e guias da régua no modelo do editor', () => {
  assert.equal(M.normalizarCamada({ tipo: 'texto', texto: 'a', grupo: 'grp_1' }).grupo, 'grp_1');
  assert.equal(M.normalizarCamada({ tipo: 'texto', texto: 'a', grupo: 'com espaço' }).grupo, undefined);
  assert.deepEqual(M.normalizarGuias({ v: [10, 10.04, 'x'], h: null }), { v: [10], h: [] });
  const doc = { largura: 1080, altura: 1350, formato: 'feed45', guiasFixas: { v: [333], h: [444] } };
  const a = M.alvosDeEncaixe(doc, { camadas: [] });
  assert.ok(a.xs.some((x) => x.v === 333 && x.tipo === 'guia') && a.ys.some((y) => y.v === 444 && y.tipo === 'guia'));
  assert.ok(!M.alvosDeEncaixe(doc, { camadas: [] }, new Set(), { guias: false }).xs.some((x) => x.tipo === 'guia'), 'régua escondida: a guia não atrai');
});

// 27/10 (Pedro: "coloque uma feature de editar várias imagens ao mesmo tempo, ao invés de uma por uma, apenas selecionando")
test('páginas juntas: posição, estilo, fundo e camada nova vão pras outras; o texto e a imagem de cada página ficam', () => {
  const pagina = (camadas) => M.normalizarPagina({ fundo: { tipo: 'cor', cor: '#15171C' }, camadas });
  const a = pagina([
    { id: 'a_tit', tipo: 'texto', nome: 'Título', texto: 'Sinal 1', x: 72, y: 200, largura: 900, altura: 120, tamanho: 64 },
    { id: 'a_logo', tipo: 'imagem', nome: 'Logo', assetId: 'ast_logo', x: 72, y: 1200, largura: 200, altura: 60 },
    { id: 'a_ico', tipo: 'imagem', assetId: 'ast_a', x: 600, y: 500, largura: 300, altura: 300 },
    { id: 'a_txt', tipo: 'texto', texto: 'Corpo 1', x: 72, y: 400, largura: 900, altura: 100, tamanho: 30 },
  ]);
  const b = pagina([
    { id: 'b_tit', tipo: 'texto', nome: 'Título', texto: 'Sinal 2', x: 72, y: 200, largura: 900, altura: 120, tamanho: 64 },
    { id: 'b_logo', tipo: 'imagem', nome: 'Logo', assetId: 'ast_logo', x: 72, y: 1200, largura: 200, altura: 60 },
    { id: 'b_ico', tipo: 'imagem', assetId: 'ast_b', x: 610, y: 490, largura: 300, altura: 150 },
    { id: 'b_txt', tipo: 'texto', texto: 'Corpo 2', x: 80, y: 410, largura: 900, altura: 100, tamanho: 30 },
    { id: 'b_longe', tipo: 'texto', texto: 'Outro', x: 72, y: 900, largura: 500, altura: 60, tamanho: 30 },
  ]);
  const depois = M.clonar(a);
  const em = (id) => depois.camadas.find((c) => c.id === id);
  depois.fundo.cor = '#FAF8F5';
  Object.assign(em('a_tit'), { tamanho: 80, x: 100, texto: 'Esse texto não vai' });
  em('a_logo').y = 1150;
  Object.assign(em('a_ico'), { largura: 400, altura: 400, assetId: 'ast_trocada' });
  em('a_txt').cor = '#F2643C';
  depois.camadas.push(M.normalizarCamada({ id: 'a_selo', tipo: 'texto', nome: 'Selo', texto: 'Novo', x: 72, y: 72, grupo: 'g1' }));
  const n = M.aplicarMudancas(b, M.mudancasDaPagina(a, depois));
  const lb = (id) => b.camadas.find((c) => c.id === id);
  assert.equal(b.fundo.cor, '#FAF8F5', 'o fundo da página vai');
  assert.equal(lb('b_tit').tamanho, 80);
  assert.equal(lb('b_tit').x, 100);
  assert.equal(lb('b_tit').texto, 'Sinal 2', 'o texto de cada página fica');
  assert.equal(lb('b_logo').y, 1150, 'o logo, pelo nome');
  assert.equal(lb('b_ico').assetId, 'ast_b', 'a imagem de cada página fica');
  assert.equal(lb('b_ico').largura, 400);
  assert.equal(lb('b_ico').altura, 200, 'a imagem com outra figura guarda a proporção dela (300 x 150)');
  assert.equal(lb('b_txt').cor, '#F2643C', 'o texto sem nome, pela posição mais perto');
  assert.notEqual(lb('b_longe').cor, '#F2643C', 'longe da posição, não é a mesma camada');
  const selo = b.camadas.find((c) => c.nome === 'Selo');
  assert.ok(selo && selo.id !== 'a_selo' && !('grupo' in selo), 'a camada nova vai com outro id e sem o grupo da página de origem');
  assert.equal(n, 6);
});

test('páginas juntas: apagar numa apaga a correspondente nas outras; só o texto mudou, nada vai', () => {
  const a = M.normalizarPagina({ camadas: [{ id: 'a_logo', tipo: 'imagem', nome: 'Logo', assetId: 'ast_logo', x: 72, y: 1200, largura: 200, altura: 60 }, { id: 'a_t', tipo: 'texto', nome: 'Título', texto: 'Um', x: 72, y: 200 }] });
  const b = M.normalizarPagina({ camadas: [{ id: 'b_logo', tipo: 'imagem', nome: 'Logo', assetId: 'ast_logo', x: 72, y: 1200, largura: 200, altura: 60 }, { id: 'b_t', tipo: 'texto', nome: 'Título', texto: 'Dois', x: 72, y: 200 }] });
  const semLogo = M.clonar(a);
  semLogo.camadas = semLogo.camadas.filter((c) => c.id !== 'a_logo');
  assert.equal(M.aplicarMudancas(b, M.mudancasDaPagina(a, semLogo)), 1);
  assert.deepEqual(b.camadas.map((c) => c.id), ['b_t'], 'o logo saiu da outra página também');
  assert.equal(M.mudancasDaPagina(a, M.clonar(a)), null, 'sem mudança, nada');
  const soTexto = M.clonar(a);
  soTexto.camadas[1].texto = 'Outro';
  assert.equal(M.mudancasDaPagina(a, soTexto), null, 'só o texto mudou: nada vai pras outras');
  assert.deepEqual(M.camadasEquivalentes(b, { tipo: 'texto', nome: 'Texto', x: 500, y: 900 }), [], 'nome padrão longe de tudo: nenhuma');
});

// 27/10 (Pedro, com a 6 e a 7 marcadas: "Os 2 estão selecionados mas ainda só está aparecendo um para editar"). As
// camadas do carrossel "5 sinais" (est_95b4bd9a): o celular emenda da 6 pra 7 com um nome em cada página, e a IA numera
// o título de cada item
test('páginas juntas: a emenda anda pelo deslocamento e o título do item acha o do outro item', () => {
  const p6 = M.normalizarPagina({ camadas: [
    { id: 'c6', tipo: 'imagem', nome: 'Celular com o Início (emenda pra página 7)', assetId: 'ast_base_celular-tela-inicio', x: 826.5, y: 368, largura: 440, altura: 910.1 },
    { id: 't6', tipo: 'texto', nome: 'Título do item 5', texto: 'Sinal 5', x: 72, y: 100, largura: 664, altura: 264, tamanho: 72 },
  ] });
  const p7 = M.normalizarPagina({ camadas: [
    { id: 'c7', tipo: 'imagem', nome: 'Celular com o Início (continuação)', assetId: 'ast_base_celular-tela-inicio', x: -248, y: 376, largura: 440, altura: 910.1 },
    { id: 't7', tipo: 'texto', nome: 'Título do item 2', texto: 'Sinal 2', x: 412, y: 345, largura: 596, altura: 264, tamanho: 72 },
    { id: 'k7', tipo: 'texto', nome: 'Kicker', texto: 'Comece por aqui', x: 72, y: 110, largura: 600, altura: 29, tamanho: 24 },
  ] });
  const depois = M.clonar(p6);
  Object.assign(depois.camadas[0], { x: 804.5, y: 400, largura: 484, altura: 1001.1 });
  Object.assign(depois.camadas[1], { tamanho: 80, cor: '#F2643C', largura: 730.4, altura: 300 });
  assert.equal(M.aplicarMudancas(p7, M.mudancasDaPagina(p6, depois)), 2);
  const [c7, t7, k7] = p7.camadas;
  assert.deepEqual([c7.x, c7.y, c7.largura, c7.altura], [-270, 408, 484, 1001.1], 'o celular da 7 anda o mesmo tanto e cresce na mesma proporção: a emenda casa');
  assert.equal(c7.nome, 'Celular com o Início (continuação)', 'o nome de cada página fica');
  assert.deepEqual([t7.tamanho, t7.cor, t7.x, t7.largura], [80, '#F2643C', 412, 655.6], 'o título do item 2 recebe o estilo; fica no lugar dele, com a largura na mesma proporção');
  assert.equal(t7.altura, 264, 'a altura do texto é a medida de cada página: não vai');
  assert.equal(t7.texto, 'Sinal 2');
  assert.notEqual(k7.cor, '#F2643C', 'perto, mas com outro nome: o título acha o da família antes');
  assert.deepEqual(M.camadasEquivalentes(p7, { tipo: 'texto', nome: 'Título do item 9', x: 0, y: 0 }).map((c) => c.id), ['t7']);
  assert.deepEqual(M.camadasEquivalentes(p7, { tipo: 'imagem', nome: 'Outra figura', assetId: 'ast_base_celular-tela-inicio', x: 0, y: 0 }).map((c) => c.id), ['c7'], 'a mesma figura com outro nome');
});
