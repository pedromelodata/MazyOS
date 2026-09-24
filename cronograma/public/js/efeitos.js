// Camada de movimento: cards que inclinam em 3D, objetos de argila nos cabeçalhos, entrada das telas, revelação
// em cascata, números que sobem, indicador do menu e esqueletos de carregamento.
// Só transform e opacity. Ponteiro fino (mouse) e sem "reduzir movimento"; no toque nada liga.
// A luz laranja e o anel que seguiam o cursor saíram em 24/09 (pedido do Pedro); a tela de entrar tem os dela.
// Não depende do core.js: qualquer página pode importar.

const MOV = matchMedia('(prefers-reduced-motion: reduce)');
const FINO = matchMedia('(hover: hover) and (pointer: fine)');
export const semMovimento = () => MOV.matches;
const comPonteiro = () => FINO.matches && !MOV.matches;

// ── Objetos 3D de argila ─────────────────────────────────────────────────
const OBJETOS = new Set(['growth', 'calendario', 'lampada', 'reels', 'metricas', 'inspiracoes', 'campanha']);
const CICLO_FLUTUA = 7000;

// a fase vem do relógio: a vista redesenha a cada recarga e o objeto não pode dar pulo
export function objeto3d(nome, { classe = '', tam = 112 } = {}) {
  if (!OBJETOS.has(nome)) return '';
  const fase = Math.round(performance.now() % CICLO_FLUTUA);
  return `<span class="fx-objeto-caixa${classe ? ` ${classe}` : ''}" aria-hidden="true"><img class="fx-objeto" src="/img/3d/${nome}.webp" alt="" width="${tam}" height="${tam}" draggable="false" style="animation-delay:-${fase}ms"></span>`;
}

// ── Esqueletos ───────────────────────────────────────────────────────────
const barra = (classe) => `<span class="fx-esq ${classe}"></span>`;

export function esqueletoPagina(texto = 'Carregando') {
  return `
    <div class="fx-esq-pagina" aria-busy="true">
      <span class="sr-only" role="status">${texto}</span>
      <div class="fx-esq-topo">${barra('fx-esq-h1')}${barra('fx-esq-p')}</div>
      <div class="fx-esq-kpis">${barra('fx-esq-kpi').repeat(4)}</div>
      <div class="fx-esq-grade">${barra('fx-esq-card').repeat(3)}</div>
    </div>`;
}

export function esqueletoCards(n = 4) {
  return `<div class="fx-esq-grade" aria-hidden="true">${barra('fx-esq-card').repeat(n)}</div>`;
}

// ── Ponteiro (só pra inclinação dos cards) ───────────────────────────────
const SEL_INCLINA = '.hc, .kpi, .bib-card, .bib-estilo, .ide-card:not(.ide-esqueleto), .ig-card';
const MAX_GRAUS = 6;

let quadro = 0;
const alvo = { x: 0, y: 0 };
let card = null;
let retangulo = null;

function pedirQuadro() {
  if (!quadro) quadro = requestAnimationFrame(() => { quadro = 0; inclinar(); });
}

// ── Inclinação 3D ────────────────────────────────────────────────────────
function soltar() {
  if (!card) return;
  card.style.setProperty('--fx-rx', '0deg');
  card.style.setProperty('--fx-ry', '0deg');
  card.classList.remove('fx-inclina');
  // depois da volta, tira a classe: sem perspective nem overflow: clip parados, o texto volta ao normal
  const solto = card;
  card = null;
  retangulo = null;
  setTimeout(() => { if (solto !== card) solto.classList.remove('fx-inclinavel'); }, 360);
}

function inclinar() {
  if (!card || !card.isConnected) { card = null; return; }
  // lido uma vez por card (e depois de rolar), no começo do quadro, antes de qualquer escrita
  retangulo ??= card.getBoundingClientRect();
  const r = retangulo;
  if (!r.width || !r.height) return;
  const px = Math.min(1, Math.max(0, (alvo.x - r.left) / r.width));
  const py = Math.min(1, Math.max(0, (alvo.y - r.top) / r.height));
  const s = card.style;
  s.setProperty('--fx-rx', `${((0.5 - py) * 2 * MAX_GRAUS).toFixed(2)}deg`);
  s.setProperty('--fx-ry', `${((px - 0.5) * 2 * MAX_GRAUS).toFixed(2)}deg`);
  s.setProperty('--fx-px', px.toFixed(3));
  s.setProperty('--fx-py', py.toFixed(3));
  card.classList.add('fx-inclina');
}

function aoMover(e) {
  if (e.pointerType !== 'mouse' || !comPonteiro() || !card) return;
  alvo.x = e.clientX;
  alvo.y = e.clientY;
  pedirQuadro();
}

function aoEntrar(e) {
  if (e.pointerType !== 'mouse' || !comPonteiro() || !(e.target instanceof Element)) return;
  alvo.x = e.clientX;
  alvo.y = e.clientY;
  const novo = e.target.closest(SEL_INCLINA);
  if (novo === card) return;
  soltar();
  if (novo && !novo.closest('.painel')) {
    card = novo;
    card.classList.add('fx-inclinavel');
    retangulo = null;
  }
}

function aoSair(e) {
  // relatedTarget nulo: o ponteiro saiu da janela
  if (e.pointerType === 'mouse' && !e.relatedTarget) soltar();
}

// ── Entrada da vista, revelação em cascata e contagem ────────────────────
const SEL_REVELA = '.card, .kpi, .hc, .crono-linha:not(.crono-cab), .home-linha, .bib-estilo, .cmp-etapa, .cmp-contagem, .ig-card';
const SEL_NUMERO = ':scope > b, .hc-numero > b';
const PASSO_CASCATA = 35;
const MAX_CASCATA = 12;
const JANELA_ENTRADA = 1500;

let observador = null;
let mutacoes = null;
let janelaAte = 0;
let vistaAtual = null;
const vistos = new WeakSet();
// o que já entrou nesta rota: um redesenho logo depois (dados chegando) não pisca o que já estava lá
let assinaturas = new Set();
const assinatura = (el) => `${el.className}|${el.textContent.replace(/\s+/g, ' ').trim().slice(0, 80)}`;

function contar(b, atraso) {
  const no = [...b.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  if (!no) return;
  const original = no.textContent;
  const txt = original.trim();
  if (!/^\d{1,3}(\.\d{3})*$/.test(txt)) return;
  const final = Number(txt.replace(/\./g, ''));
  if (!(final >= 2)) return;
  const dur = 720;
  no.textContent = '0';
  setTimeout(() => {
    const t0 = performance.now();
    const quadroContagem = (t) => {
      if (!no.isConnected) return;
      const p = Math.min(1, Math.max(0, (t - t0) / dur));
      no.textContent = p < 1 ? Math.round(final * (1 - (1 - p) ** 3)).toLocaleString('pt-BR') : original;
      if (p < 1) requestAnimationFrame(quadroContagem);
    };
    requestAnimationFrame(quadroContagem);
  }, atraso);
}

const EASE = 'cubic-bezier(.2, .8, .2, 1)';
const SOBE = [{ opacity: 0, translate: '0 12px' }, { opacity: 1, translate: '0 0' }];
const ENTRA = [{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }];

function revelarVisiveis(entradas) {
  let i = 0;
  for (const en of entradas) {
    if (!en.isIntersecting) continue;
    const el = en.target;
    observador.unobserve(el);
    const atraso = Math.min(i++, MAX_CASCATA) * PASSO_CASCATA;
    el.classList.remove('fx-espera');
    if (semMovimento()) continue;
    // fill backwards segura o quadro inicial durante o atraso; no fim o efeito some sozinho
    el.animate(SOBE, { duration: 440, delay: atraso, easing: EASE, fill: 'backwards' });
    const b = el.querySelector(SEL_NUMERO);
    if (b) contar(b, atraso);
  }
}

function revelar(root, soNovos = false) {
  if (semMovimento() || !('IntersectionObserver' in window)) return;
  const todos = [...root.querySelectorAll(SEL_REVELA)].filter((el) => !vistos.has(el) && !el.closest('.painel'));
  // só as folhas: um card que tem cards dentro (o cartão da lista) deixa os de dentro entrarem
  const folhas = todos.filter((el) => !todos.some((o) => o !== el && el.contains(o))).slice(0, 80);
  observador ??= new IntersectionObserver(revelarVisiveis, { rootMargin: '0px' });
  for (const el of todos) vistos.add(el);
  for (const el of folhas) {
    const a = assinatura(el);
    if (soNovos && assinaturas.has(a)) continue;
    assinaturas.add(a);
    el.classList.add('fx-espera');
    observador.observe(el);
  }
}

// chamada pelo main.js logo depois de desenhar uma vista nova (troca de rota ou primeira carga)
export function entrarVista(root) {
  if (!root) return;
  observador?.disconnect();
  // sobra de uma entrada anterior que o observador não chegou a mostrar
  for (const el of root.querySelectorAll('.fx-espera')) el.classList.remove('fx-espera');
  vistaAtual = root;
  if (semMovimento()) return;
  root.animate(ENTRA, { duration: 220, easing: EASE });
  janelaAte = performance.now() + JANELA_ENTRADA;
  assinaturas = new Set();
  revelar(root);
  // a vista que redesenha logo depois de abrir (dados chegando): só o que é novo entra em cascata
  if (!mutacoes) {
    mutacoes = new MutationObserver(() => {
      if (vistaAtual && performance.now() < janelaAte) revelar(vistaAtual, true);
    });
  }
  mutacoes.disconnect();
  mutacoes.observe(root, { childList: true });
}

// ── Indicador do item ativo do menu ──────────────────────────────────────
export function medirAtivo(nav) {
  const a = nav?.querySelector('.sb-item.ativo');
  return a ? a.offsetTop : null;
}

export function posicionarIndicador(nav, antes = null) {
  const ativo = nav?.querySelector('.sb-item.ativo');
  if (!ativo) return;
  const ind = document.createElement('span');
  ind.className = 'sb-indicador';
  ind.setAttribute('aria-hidden', 'true');
  nav.prepend(ind);
  nav.classList.add('com-indicador');
  const y = ativo.offsetTop;
  ind.style.height = `${ativo.offsetHeight}px`;
  if (antes == null || antes === y || semMovimento()) {
    ind.style.transform = `translateY(${y}px)`;
    return;
  }
  ind.style.transform = `translateY(${antes}px)`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ind.classList.add('anda');
    ind.style.transform = `translateY(${y}px)`;
  }));
}

// ── Início ───────────────────────────────────────────────────────────────
let iniciado = false;

export function iniciarEfeitos() {
  if (iniciado) return;
  iniciado = true;
  window.addEventListener('pointermove', aoMover, { passive: true });
  document.addEventListener('pointerover', aoEntrar, { passive: true });
  document.addEventListener('pointerout', aoSair, { passive: true });
  window.addEventListener('blur', soltar);
  // rolar muda onde o card está: o retângulo é relido no próximo movimento
  window.addEventListener('scroll', () => { retangulo = null; }, { passive: true, capture: true });
  const mudou = () => {
    if (!comPonteiro()) soltar();
    if (semMovimento()) {
      observador?.disconnect();
      for (const el of document.querySelectorAll('.fx-espera')) el.classList.remove('fx-espera');
    }
  };
  MOV.addEventListener('change', mudou);
  FINO.addEventListener('change', mudou);
}
