// 22/10 (Pedro): exportação no navegador de quem usa (o VPS não tem Chromium nem Playwright), em qualidade máxima.
// A página sai do MESMO render.js do editor, vira XHTML dentro de um SVG (foreignObject) com as fontes do estúdio em
// base64 e cada imagem em data: URL, e o navegador desenha o SVG num canvas no tamanho pedido (1x ou 2x). PNG sem
// perda, JPG com qualidade 0,95 (1,0 no tamanho Máximo), PDF com todas as páginas sem perda ou em JPEG de alta qualidade
// (pdf.js, sem dependência).
// A CSP do app (img-src 'self' data:) não deixa blob: em <img>: o SVG vai como data: URL.
import { criarPaginaEl, urlDoAsset } from './render.js';
import { carregarFontes, cssFontesEmbutidas } from './fontes.js';
import { gerarPdf, rgbComPreditor } from './pdf.js';
import { partesDoZip, crc32 } from './zip.js';
import { nomeArquivo } from './modelo.js';

export const QUALIDADE_JPG = 0.95;
// 22/10 (Pedro): "qualidade máxima" é 1,0 no JPG (o tamanho Máximo usa essa)
export const QUALIDADE_JPG_MAX = 1;
// canvas maior que isso falha em silêncio em vários navegadores (toBlob devolve null)
const AREA_MAX = 16384 * 16384;
const LADO_CANVAS_MAX = 16384;

const dados = new Map(); // assetId -> Promise<string data:>
// cada imagem em data: URL pesa uns megas: guarda as últimas 24 (a mais velha sai)
const MAX_GUARDADAS = 24;
function lerComoDataUrl(blob) {
  return new Promise((ok, falhou) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => falhou(r.error ?? new Error('Não consegui ler a imagem'));
    r.readAsDataURL(blob);
  });
}
function dadosDoAsset(id) {
  if (!dados.has(id)) {
    const p = (async () => {
      const r = await fetch(urlDoAsset(id), { credentials: 'same-origin' });
      if (!r.ok) throw Object.assign(new Error(`imagem ${id} (${r.status})`), { status: r.status });
      return lerComoDataUrl(await r.blob());
    })();
    p.catch(() => dados.delete(id));
    dados.set(id, p);
    while (dados.size > MAX_GUARDADAS) dados.delete(dados.keys().next().value);
  } else {
    // usada de novo: vai pro fim da fila
    const p = dados.get(id);
    dados.delete(id);
    dados.set(id, p);
  }
  return dados.get(id);
}
// asset trocado ou apagado: a próxima exportação busca de novo
export const esquecerAsset = (id) => dados.delete(id);

function idsDeImagem(pagina) {
  const ids = new Set();
  if (pagina.fundo?.tipo === 'imagem' && pagina.fundo.assetId) ids.add(pagina.fundo.assetId);
  for (const c of pagina.camadas) if (c.tipo === 'imagem' && !c.oculta && c.assetId) ids.add(c.assetId);
  return [...ids];
}

function carregarImagem(src) {
  return new Promise((ok, falhou) => {
    const img = new Image();
    img.decoding = 'sync';
    img.onload = () => ok(img);
    img.onerror = () => falhou(new Error('O navegador não conseguiu montar a página pra exportar'));
    img.src = src;
  });
}
// 22/10 (Pedro): o navegador pausa o requestAnimationFrame com a aba em segundo plano e a exportação parava ali. O quadro
// agora corre contra um relógio de 100 ms (o que chegar primeiro)
const quadro = () => new Promise((r) => {
  let feito = false;
  const fim = () => { if (!feito) { feito = true; r(); } };
  requestAnimationFrame(fim);
  setTimeout(fim, 100);
});

// SVG (texto) da página, com tudo embutido. Exportado também pra conferência no teste do navegador
export async function svgDaPagina(doc, pagina, { escala = 1 } = {}) {
  await carregarFontes();
  const ids = idsDeImagem(pagina);
  const mapa = new Map();
  const falhas = [];
  await Promise.all(ids.map(async (id) => {
    try { mapa.set(id, await dadosDoAsset(id)); } catch { falhas.push(id); }
  }));
  if (falhas.length) {
    const nomes = pagina.camadas.filter((c) => c.tipo === 'imagem' && falhas.includes(c.assetId)).map((c) => `"${c.nome}"`);
    if (falhas.includes(pagina.fundo?.assetId)) nomes.push('a imagem do fundo');
    throw new Error(`Não consegui carregar ${nomes.join(', ') || 'uma imagem'}: troque ou tire antes de exportar`);
  }
  const css = await cssFontesEmbutidas();
  const el = criarPaginaEl(doc, pagina, { modo: 'exportar', src: (id) => mapa.get(id) ?? null });
  const xhtml = new XMLSerializer().serializeToString(el);
  const W = doc.largura;
  const H = doc.altura;
  const w = Math.round(W * escala);
  const h = Math.round(H * escala);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${W} ${H}"><foreignObject x="0" y="0" width="${W}" height="${H}"><div xmlns="http://www.w3.org/1999/xhtml" style="margin:0;padding:0;width:${W}px;height:${H}px"><style>${css}</style>${xhtml}</div></foreignObject></svg>`;
}

// uma página num canvas no tamanho final
export async function canvasDaPagina(doc, pagina, { escala = 1, fundoOpaco = false } = {}) {
  const w = Math.round(doc.largura * escala);
  const h = Math.round(doc.altura * escala);
  if (w > LADO_CANVAS_MAX || h > LADO_CANVAS_MAX || w * h > AREA_MAX) throw new Error('Grande demais pra exportar nesse tamanho: tente em 1x');
  const svg = await svgDaPagina(doc, pagina, { escala });
  const img = await carregarImagem(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  try { await img.decode(); } catch { /* o load já chegou: segue */ }
  // a fonte embutida no SVG pode terminar de entrar um instante depois do load: dois quadros de folga
  await quadro();
  await quadro();
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (fundoOpaco) {
    ctx.fillStyle = pagina.fundo?.cor || '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  return cv;
}

function blobDoCanvas(cv, tipo, qualidade) {
  return new Promise((ok, falhou) => {
    cv.toBlob((b) => (b ? ok(b) : falhou(new Error('O navegador não conseguiu gerar o arquivo (página grande demais?)'))), tipo, qualidade);
  });
}

export async function exportarImagem(doc, pagina, { formato = 'png', escala = 1, qualidade = QUALIDADE_JPG } = {}) {
  const jpg = formato === 'jpg';
  const cv = await canvasDaPagina(doc, pagina, { escala, fundoOpaco: jpg });
  return blobDoCanvas(cv, jpg ? 'image/jpeg' : 'image/png', jpg ? qualidade : undefined);
}

// 22/10 (Pedro): a página sem perda pro PDF: os pixels RGB com o preditor do PNG (linha de cima), comprimidos com o
// deflate do próprio navegador (CompressionStream, formato zlib, que é o FlateDecode do PDF)
async function deflate(bytes) {
  if (typeof CompressionStream !== 'function') throw new Error('Este navegador não comprime o PDF sem perda: desligue "sem perda"');
  const fluxo = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(fluxo).arrayBuffer());
}
async function paginaSemPerda(cv) {
  const { width: w, height: h } = cv;
  const px = cv.getContext('2d').getImageData(0, 0, w, h).data;
  return { flate: await deflate(rgbComPreditor(px, w, h)), largura: w, altura: h };
}

// PDF com as páginas pedidas (todas, por padrão), uma imagem por página: sem perda (FlateDecode) ou JPEG de alta qualidade
export async function exportarPdf(doc, { escala = 1, paginas = doc.paginas, semPerda = false, aoProgresso = () => {} } = {}) {
  const lista = [];
  for (let i = 0; i < paginas.length; i++) {
    aoProgresso(i, paginas.length);
    const cv = await canvasDaPagina(doc, paginas[i], { escala, fundoOpaco: true });
    const medida = { larguraPt: doc.largura * 0.75, alturaPt: doc.altura * 0.75 };
    if (semPerda) lista.push({ ...(await paginaSemPerda(cv)), ...medida });
    else {
      // 23/10 (Pedro): "sempre na melhor qualidade possível": o PDF em JPEG (só o da prévia do celular, pela memória) vai em 1,0
      const b = await blobDoCanvas(cv, 'image/jpeg', QUALIDADE_JPG_MAX);
      lista.push({ jpeg: new Uint8Array(await b.arrayBuffer()), ...medida });
    }
    cv.width = 0;
    cv.height = 0;
  }
  aoProgresso(paginas.length, paginas.length);
  const bytes = gerarPdf(lista, { titulo: doc.titulo });
  return new Blob([bytes], { type: 'application/pdf' });
}

// 22/10 (achado da revisão): as páginas exportadas ([{ nome, blob }]) num .zip só (zip.js), pra um download no lugar de
// um por página. Lê uma página por vez só pro CRC; o .zip junta os próprios Blobs, sem copiar as imagens
export async function zipDasPaginas(paginas) {
  const lista = [];
  for (const p of paginas) lista.push({ nome: p.nome, dados: p.blob, tamanho: p.blob.size, crc: crc32(new Uint8Array(await p.blob.arrayBuffer())) });
  return new Blob(partesDoZip(lista), { type: 'application/zip' });
}

export function baixar(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function nomeExportacao(doc, { formato, escala, pagina = null }) {
  const base = nomeArquivo(doc.titulo);
  const pag = pagina == null ? '' : `-p${String(pagina).padStart(2, '0')}`;
  const x = escala > 1 ? `@${escala}x` : '';
  return `${base}${pag}${x}.${formato}`;
}
