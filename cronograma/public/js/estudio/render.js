// 22/10 (Pedro): o desenho da página do estúdio. O MESMO código monta a página do editor, as miniaturas e a página
// que vai pra exportação (SVG com foreignObject em exportar.js): o que se exporta é o que se vê.
// Tudo é estilo em linha (nada de classe do app): a exportação não enxerga o CSS da casca e a casca não pode mudar
// o desenho. A raiz zera o que herda (all: initial) e cada elemento diz tudo de que precisa.
// Ordem das camadas = ordem no array (a primeira fica no fundo). Camada oculta não desenha.
import { trechosDestaque } from './modelo.js';
import { familiaCss } from './fontes.js';

export const urlDoAsset = (id) => `/api/estudio/assets/${encodeURIComponent(id)}/arquivo`;
// 22/10 (achado da revisão): a miniatura de até 320 px de largura (a lista, os modelos, a faixa de páginas) pega as
// imagens pela rota /miniatura, o WEBP de 320 px do banco (o upload ainda volta o original): a lista dos Destaques
// baixava 33 MB de PNG original pra cartões de 220 px. A prévia larga do celular, o editor e a exportação seguem no
// /arquivo, com a imagem inteira
export const urlMiniaturaDoAsset = (id) => `/api/estudio/assets/${encodeURIComponent(id)}/miniatura`;
const LARGURA_MINIATURA = 320;

const px = (v) => `${Math.round(Number(v) * 100) / 100}px`;
const estilo = (pares) => pares.filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${k}:${v}`).join(';');

// ── raiz e fundo ─────────────────────────────────────────────────────────
function estiloRaiz(doc, fundo, opts) {
  const pares = [
    ['all', 'initial'],
    ['display', 'block'],
    ['position', 'relative'],
    ['box-sizing', 'border-box'],
    ['overflow', 'hidden'],
    ['isolation', 'isolate'],
    ['width', px(doc.largura)],
    ['height', px(doc.altura)],
    ['margin', '0'],
    ['padding', '0'],
    ['font-family', familiaCss('Sora')],
    ['font-size', '16px'],
    ['font-weight', '400'],
    ['line-height', 'normal'],
    ['color', '#1B1E24'],
    ['font-kerning', 'normal'],
    ['-webkit-font-smoothing', 'antialiased'],
    ['text-rendering', 'auto'],
    ['background-color', fundo.cor],
  ];
  if (fundo.tipo === 'gradiente') pares.push(['background-image', `linear-gradient(${fundo.angulo}deg, ${fundo.cor}, ${fundo.cor2})`]);
  else if (fundo.tipo === 'imagem' && fundo.assetId) {
    const src = opts.src?.(fundo.assetId);
    if (src) {
      pares.push(
        ['background-image', `url("${src}")`],
        ['background-size', fundo.ajuste === 'conter' ? 'contain' : 'cover'],
        ['background-position', 'center'],
        ['background-repeat', 'no-repeat'],
      );
    }
  }
  return estilo(pares);
}

export function aplicarRaiz(el, doc, pagina, opts = {}) {
  const s = estiloRaiz(doc, pagina.fundo, opts);
  if (el.getAttribute('style') !== s) el.setAttribute('style', s);
}

// ── camadas ──────────────────────────────────────────────────────────────
function geometria(c, { alturaAuto = false } = {}) {
  return [
    ['position', 'absolute'],
    ['box-sizing', 'border-box'],
    ['display', c.oculta ? 'none' : 'block'],
    ['margin', '0'],
    ['left', px(c.x)],
    ['top', px(c.y)],
    ['width', px(c.largura)],
    ['height', alturaAuto ? 'auto' : px(c.altura)],
    ['transform', c.rotacao ? `rotate(${c.rotacao}deg)` : ''],
    ['transform-origin', '50% 50%'],
    ['opacity', c.opacidade < 1 ? String(c.opacidade) : ''],
  ];
}

function paddingPilula(p) {
  // contrato: padding é um número (vale pros quatro lados); aceita {x, y} se vier assim
  if (p && typeof p === 'object') return `${px(p.y ?? p.vertical ?? 0)} ${px(p.x ?? p.horizontal ?? 0)}`;
  return px(p ?? 0);
}

function estiloTexto(c) {
  return estilo([
    ...geometria(c, { alturaAuto: true }),
    ['font-family', familiaCss(c.fonte)],
    ['font-weight', String(c.peso)],
    ['font-style', c.italico ? 'italic' : 'normal'],
    ['font-size', px(c.tamanho)],
    ['line-height', String(c.alturaLinha)],
    ['letter-spacing', c.espacamentoLetra ? `${c.espacamentoLetra}em` : 'normal'],
    ['color', c.cor],
    ['text-align', c.alinhamento === 'centro' ? 'center' : c.alinhamento === 'direita' ? 'right' : 'left'],
    ['text-transform', c.caixa === 'alta' ? 'uppercase' : 'none'],
    ['white-space', 'pre-wrap'],
    ['overflow-wrap', 'break-word'],
    ['word-break', 'normal'],
    ['font-synthesis', 'style'],
    ['background-color', c.fundo ? c.fundo.cor : ''],
    ['border-radius', c.fundo ? px(c.fundo.raio) : ''],
    ['padding', c.fundo ? paddingPilula(c.fundo.padding) : '0'],
  ]);
}

function preencherTexto(el, c) {
  const chave = `${c.texto}\u0000${c.corDestaque}`;
  if (el.__chaveTexto === chave) return;
  el.__chaveTexto = chave;
  el.replaceChildren();
  for (const p of trechosDestaque(c.texto)) {
    if (!p.destaque) { el.append(document.createTextNode(p.t)); continue; }
    const s = document.createElement('span');
    s.setAttribute('style', `color:${c.corDestaque}`);
    s.textContent = p.t;
    el.append(s);
  }
  // texto vazio ainda precisa de uma linha de altura (a caixa não some)
  if (!c.texto) el.append(document.createTextNode(String.fromCharCode(0x200b)));
}

function atualizarImagem(el, c, opts) {
  const sombra = c.sombra ? `drop-shadow(${px(c.sombra.x)} ${px(c.sombra.y)} ${px(c.sombra.desfoque)} ${c.sombra.cor})` : '';
  const s = estilo([...geometria(c), ['filter', sombra]]);
  if (el.getAttribute('style') !== s) el.setAttribute('style', s);
  let clip = el.firstElementChild;
  if (!clip) {
    clip = document.createElement('div');
    el.append(clip);
  }
  const src = c.assetId ? opts.src?.(c.assetId) ?? null : null;
  const sc = estilo([
    ['display', 'block'],
    ['box-sizing', 'border-box'],
    ['width', '100%'],
    ['height', '100%'],
    ['overflow', 'hidden'],
    ['border-radius', c.raio ? px(c.raio) : ''],
  ]);
  if (clip.getAttribute('style') !== sc) clip.setAttribute('style', sc);
  clip.toggleAttribute('data-sem-arquivo', !src);
  let img = clip.firstElementChild;
  if (!src) { img?.remove(); return; }
  if (!img) {
    img = document.createElement('img');
    img.setAttribute('alt', '');
    img.setAttribute('draggable', 'false');
    if (opts.modo === 'miniatura') { img.setAttribute('loading', 'lazy'); img.setAttribute('decoding', 'async'); }
    if (opts.modo !== 'exportar') {
      img.addEventListener('error', () => img.setAttribute('data-falhou', ''));
      img.addEventListener('load', () => img.removeAttribute('data-falhou'));
    }
    clip.append(img);
  }
  const si = estilo([
    ['display', 'block'],
    ['box-sizing', 'border-box'],
    ['width', '100%'],
    ['height', '100%'],
    ['max-width', 'none'],
    ['max-height', 'none'],
    ['margin', '0'],
    ['border', '0'],
    ['object-fit', 'cover'],
    ['object-position', 'center'],
    ['transform', c.espelhar ? 'scaleX(-1)' : ''],
    ['user-select', 'none'],
    ['-webkit-user-drag', 'none'],
  ]);
  if (img.getAttribute('style') !== si) img.setAttribute('style', si);
  if (img.getAttribute('src') !== src) img.setAttribute('src', src);
}

function estiloForma(c) {
  const raio = c.forma === 'circulo' ? '50%' : c.forma === 'linha' ? px(Math.min(c.raio, c.altura / 2)) : c.raio ? px(c.raio) : '';
  return estilo([
    ...geometria(c),
    ['background-color', c.cor],
    ['border', c.borda && c.forma !== 'linha' && c.borda.largura > 0 ? `${px(c.borda.largura)} solid ${c.borda.cor}` : ''],
    ['border-radius', raio],
  ]);
}

export function atualizarCamadaEl(el, c, opts = {}) {
  el.dataset.camada = c.id;
  el.dataset.tipo = c.tipo;
  if (c.tipo === 'texto') {
    const s = estiloTexto(c);
    if (el.getAttribute('style') !== s) el.setAttribute('style', s);
    // o texto que está sendo editado no lugar é do editor (contenteditable): não remonta por baixo
    if (opts.editando !== c.id) preencherTexto(el, c);
  } else if (c.tipo === 'imagem') {
    atualizarImagem(el, c, opts);
  } else {
    const s = estiloForma(c);
    if (el.getAttribute('style') !== s) el.setAttribute('style', s);
  }
}

// deixa os filhos da raiz iguais às camadas (cria, atualiza, reordena e tira), sem refazer o que não mudou
export function sincronizarCamadas(raiz, camadas, opts = {}) {
  const existentes = new Map();
  for (const el of [...raiz.children]) {
    if (el.dataset.camada) existentes.set(el.dataset.camada, el);
  }
  const lista = opts.modo === 'exportar' ? camadas.filter((c) => !c.oculta) : camadas;
  lista.forEach((c, i) => {
    let el = existentes.get(c.id);
    if (el && el.dataset.tipo !== c.tipo) { el.remove(); el = null; }
    if (!el) el = document.createElement('div');
    existentes.delete(c.id);
    atualizarCamadaEl(el, c, opts);
    const naPosicao = raiz.children[i];
    if (naPosicao !== el) raiz.insertBefore(el, naPosicao ?? null);
  });
  for (const el of existentes.values()) el.remove();
}

// página inteira nova (miniatura e exportação); o editor reaproveita com sincronizarPagina
export function criarPaginaEl(doc, pagina, opts = {}) {
  const el = document.createElement('div');
  el.setAttribute('data-estudio-pagina', pagina.id);
  sincronizarPagina(el, doc, pagina, opts);
  return el;
}

export function sincronizarPagina(el, doc, pagina, opts = {}) {
  el.setAttribute('data-estudio-pagina', pagina.id);
  aplicarRaiz(el, doc, pagina, opts);
  sincronizarCamadas(el, pagina.camadas, opts);
  return el;
}

// miniatura: a página no tamanho real dentro de uma caixa que escala pra caber em "largura" px
export function miniaturaEl(doc, pagina, largura = 160) {
  const k = largura / doc.largura;
  const caixa = document.createElement('div');
  caixa.className = 'est-mini';
  caixa.style.width = `${largura}px`;
  caixa.style.height = `${Math.round(doc.altura * k)}px`;
  const p = criarPaginaEl(doc, pagina, { modo: 'miniatura', src: largura <= LARGURA_MINIATURA ? urlMiniaturaDoAsset : urlDoAsset });
  p.style.transform = `scale(${k})`;
  p.style.transformOrigin = '0 0';
  p.setAttribute('aria-hidden', 'true');
  caixa.append(p);
  return caixa;
}
