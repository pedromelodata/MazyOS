// Biblioteca de Reels em duas abas (24/09): "Reels validados" (só os 28 templates validados, com a
// miniatura do template original em public/img/templates/<codigo>.webp) e "Guia de estilos" (os guias dos
// 3 estilos). O detalhe mostra o template original (título, fórmula, público) e a nossa versão pro
// Legalizaí. Os nossos testes (em teste) não aparecem na aba; seguem no Criar reel e no link direto.
// Todo case de sucesso fica pendurado num formato. "Serve pra" filtra pelo tipo de reel (formato.tipos).
// #/biblioteca?estilo=<tipo> abre o guia daquele estilo.
// Exporta também CATEGORIAS e agruparPorCategoria, que o Banco de Ideias usa no seletor de formato.
import {
  $, esc, fmtN, fmtRel, fmtData, store, api, recarregar, toast, abrirPainel, fecharPainel, BTN_FECHAR,
  formato, casesDo, seloFormato, icone, lerLocal, gravarLocal,
  TIPOS, tipoReel, estilo, listaEstilos, tiposDoFormato, partesGancho, comLacunas, nomeTema, botaoFontes,
} from '../core.js';
import { capa } from '../capa.js';
import { abrirCriar } from '../chat.js';
import { abrirDetalhe } from '../detalhe.js';
import { objeto3d } from '../efeitos.js';

// numeração fixa (SPEC §3.5), não mudar: os reels guardam "Adaptado de X.Y"
export const CATEGORIAS = [
  ['1', 'Dica/DIY'], ['2', 'Análise'], ['3', 'História'], ['4', 'Analogia'], ['5', 'Vlog'], ['6', 'Desafio'],
  ['7', 'Palestra'], ['8', 'Storytelling Looping'], ['9', 'Diálogo'], ['10', 'Conselho'], ['11', 'Comparação'],
  ['12', 'Câmera Frontal'], ['T', 'Nossos testes'],
];
const VARIANTES = ['ink', 'papel', 'tint'];
const ORIGEM_CASE = { nosso: 'Nosso', nicho: 'Nicho', manual: 'Manual' };
const TIPOS_EV = { benchmark: 'Benchmark', 'dado-proprio': 'Reel nosso', nicho: 'Reel do nicho' };

const ui = {
  aba: lerLocal('biblioteca-aba') === 'estilos' ? 'estilos' : 'reels',
  cat: '', formEv: null,
  servePra: tipoReel(lerLocal('biblioteca-serve-pra')) ? lerLocal('biblioteca-serve-pra') : '',
  estilo: '',
};
let raiz = null;
let ultimosParams = {};
let paginaAtual = null;

const porCodigo = (a, b) => String(a.codigo ?? '').localeCompare(String(b.codigo ?? ''), 'pt-BR', { numeric: true });
const ehValidado = (f) => f.status === 'validado';
// os templates da aba "Reels validados": validados e da biblioteca (não os nossos testes)
const ehTemplate = (f) => ehValidado(f) && f.categoria !== 'Nossos testes';
// miniatura recortada do template original; formato sem ela usa a capa tipográfica
const temThumb = (f) => Boolean(f?.original) && /^\d+\.\d+$/.test(String(f.codigo ?? ''));
const thumbDe = (f) => `/img/templates/${encodeURIComponent(f.codigo)}.webp`;
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const dataCase = (c) => String(c.data || c.criadoEm || '');
// "[N] cuidados com [tema]": cada lacuna da fórmula vira um destaque
const formulaHtml = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<span class="bib-slot">$1</span>');
const servePra = (f, tipo) => !tipo || tiposDoFormato(f).includes(tipo);
// tags pequenas dos tipos que o formato serve (a do filtro ativo fica acesa)
const tagsTipo = (f, ativo = '') => {
  const ts = tiposDoFormato(f).map(tipoReel).filter(Boolean);
  return ts.length
    ? `<span class="bib-tags" title="${esc(`Serve pra ${ts.map((t) => t.nome).join(', ')}`)}">${ts.map((t) => `<span class="bib-tag${t.id === ativo ? ' ativo' : ''}" data-tipo="${t.id}">${icone(t.icone, 12)}${esc(t.nome)}</span>`).join('')}</span>`
    : '';
};

export function agruparPorCategoria(formatos) {
  const grupos = new Map(CATEGORIAS.map(([num, nome]) => [nome, { num, nome, itens: [] }]));
  for (const f of formatos) {
    const nome = f.categoria || 'Sem categoria';
    if (!grupos.has(nome)) grupos.set(nome, { num: String(f.codigo ?? '').split('.')[0] || '?', nome, itens: [] });
    grupos.get(nome).itens.push(f);
  }
  for (const g of grupos.values()) g.itens.sort(porCodigo);
  return [...grupos.values()].filter((g) => g.itens.length);
}

function regra() {
  const r = store.E?.regraValidacao ?? {};
  return { limiar: r.limiarRelativo ?? 1.5, min: r.minCasesAcima ?? 2 };
}

function melhorCase(formatoId) {
  return casesDo(formatoId)
    .filter((c) => c.thumb)
    .sort((a, b) => (b.relativo ?? 0) - (a.relativo ?? 0))[0];
}

function ordemGlobal() {
  return agruparPorCategoria(store.E.formatos ?? []).flatMap((g) => g.itens.map((f) => f.id));
}

function naRota() {
  return location.hash.replace(/^#/, '').startsWith('/biblioteca');
}
function redesenhar() {
  if (raiz && naRota()) render(raiz, ultimosParams);
}

export function render(root, params = {}) {
  raiz = root;
  ultimosParams = params;
  if (!store.E) { root.innerHTML = '<div class="vazio">Carregando…</div>'; return; }
  const pagina = params.id || 'lista';
  if (pagina !== paginaAtual) {
    paginaAtual = pagina;
    ui.formEv = null;
    window.scrollTo(0, 0);
    root.scrollTop = 0;
  }
  if (params.id) return renderDetalhe(root, params.id);
  const pedido = new URLSearchParams(location.hash.split('?')[1] ?? '').get('estilo');
  let rolarGuia = false;
  if (pedido != null) {
    history.replaceState(null, '', '#/biblioteca'); // limpa antes: recarregar() chama render() de novo
    if (estilo(pedido)) { ui.estilo = pedido; ui.aba = 'estilos'; rolarGuia = true; }
  }
  renderLista(root);
  if (rolarGuia) requestAnimationFrame(() => $('#bib-guia')?.scrollIntoView({ block: 'start' }));
}

// ── Lista ────────────────────────────────────────────────────────────────
function renderLista(root) {
  const templates = (store.E.formatos ?? []).filter(ehTemplate);
  // chips de categoria e "Todas" contam só o que serve pro tipo escolhido em "Serve pra"
  const baseServe = templates.filter((f) => servePra(f, ui.servePra));
  const gruposChips = agruparPorCategoria(baseServe);
  if (ui.cat && !gruposChips.some((g) => g.nome === ui.cat)) ui.cat = '';
  const lista = agruparPorCategoria(baseServe).filter((g) => !ui.cat || g.nome === ui.cat).flatMap((g) => g.itens);
  const recentes = [...(store.E.cases ?? [])].sort((a, b) => dataCase(b).localeCompare(dataCase(a))).slice(0, 10);
  const temEstilos = listaEstilos().length > 0;
  if (!temEstilos) ui.aba = 'reels';
  const aba = ui.aba;

  root.innerHTML = `
    <div class="bib-pagina">
      <header class="cabecalho-pagina">
        <div>
          <h1>Biblioteca de Reels</h1>
        </div>
        ${objeto3d('reels')}
      </header>

      ${temEstilos ? `
      <div class="bib-abas" role="tablist" aria-label="Biblioteca de Reels">
        <button type="button" role="tab" id="bib-aba-reels" data-aba="reels" aria-selected="${aba === 'reels'}" aria-controls="bib-painel-aba" tabindex="${aba === 'reels' ? 0 : -1}">Reels validados<span>${templates.length}</span></button>
        <button type="button" role="tab" id="bib-aba-estilos" data-aba="estilos" aria-selected="${aba === 'estilos'}" aria-controls="bib-painel-aba" tabindex="${aba === 'estilos' ? 0 : -1}">Guia de estilos<span>${listaEstilos().length}</span></button>
      </div>` : ''}

      <div id="bib-painel-aba" ${temEstilos ? `role="tabpanel" aria-labelledby="bib-aba-${aba}"` : ''}>
      ${aba === 'estilos' ? estilosHtml() : `
        ${recentes.length ? stripHtml(recentes) : ''}

        <div class="bib-serve">
          <span class="bib-serve-rotulo" id="bib-serve-rot">Serve pra</span>
          <div class="segmentado" role="group" aria-labelledby="bib-serve-rot">
            <button data-serve="" aria-pressed="${!ui.servePra}">Todos</button>
            ${TIPOS.map((t) => `<button data-serve="${t.id}" aria-pressed="${ui.servePra === t.id}">${icone(t.icone, 14)}${esc(t.nome)}<span class="bib-serve-n">${templates.filter((f) => servePra(f, t.id)).length}</span></button>`).join('')}
          </div>
        </div>

        <div class="bib-filtros">
          <div class="bib-chips" role="group" aria-label="Filtrar por categoria">
            <button class="bib-chip" data-cat="" aria-pressed="${!ui.cat}">Todas<span>${baseServe.length}</span></button>
            ${gruposChips.map((g) => `
              <button class="bib-chip" data-cat="${esc(g.nome)}" aria-pressed="${ui.cat === g.nome}">${esc(g.nome)}<span>${g.itens.length}</span></button>`).join('')}
          </div>
        </div>

        ${lista.length ? `<div class="grade bib-grade">${lista.map((f, i) => cardFormato(f, i)).join('')}</div>` : vazioLista(templates.length)}
      `}
      </div>
    </div>`;

  const pag = $('.bib-pagina', root);
  pag.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || !pag.contains(b)) return;
    if (b.dataset.aba) return trocarAba(b.dataset.aba);
    if (b.dataset.cat != null) { ui.cat = b.dataset.cat; return redesenhar(); }
    if (b.dataset.serve != null) {
      ui.servePra = b.dataset.serve;
      gravarLocal('biblioteca-serve-pra', ui.servePra);
      redesenhar();
      return $(`[data-serve="${ui.servePra}"]`)?.focus({ preventScroll: true });
    }
    if (b.dataset.estilo) {
      ui.estilo = ui.estilo === b.dataset.estilo ? '' : b.dataset.estilo;
      redesenhar();
      $(`[data-estilo="${b.dataset.estilo}"]`)?.focus({ preventScroll: true });
      if (ui.estilo) requestAnimationFrame(() => $('#bib-guia')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
      return;
    }
    if ('fecharGuia' in b.dataset) {
      const era = ui.estilo;
      ui.estilo = '';
      redesenhar();
      return $(`[data-estilo="${era}"]`)?.focus();
    }
    if (b.dataset.copiar != null) return copiar(b.dataset.copiar);
    if ('mostrarTodos' in b.dataset) {
      ui.cat = ''; ui.servePra = '';
      gravarLocal('biblioteca-serve-pra', '');
      return redesenhar();
    }
  };
  // abas: setas trocam (padrão de tablist)
  pag.onkeydown = (e) => {
    const t = e.target instanceof Element ? e.target.closest('[role="tab"]') : null;
    if (!t || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    trocarAba(t.dataset.aba === 'reels' ? 'estilos' : 'reels');
  };
}

function trocarAba(aba) {
  if (ui.aba === aba) return;
  ui.aba = aba;
  gravarLocal('biblioteca-aba', aba);
  redesenhar();
  $(`#bib-aba-${aba}`)?.focus({ preventScroll: true });
}

function stripHtml(cases) {
  const { limiar } = regra();
  return `
    <section class="bib-strip-secao" aria-label="Cases de sucesso recentes">
      <div class="bloco-titulo">Cases de sucesso recentes</div>
      <div class="bib-strip">
        ${cases.map((c) => {
          const f = formato(c.formatoId);
          return `
          <a class="card card-link bib-mini" href="#/biblioteca/${esc(c.formatoId)}">
            <span class="bib-mini-midia">
              ${c.thumb
                ? `<img src="${esc(c.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-some-se-falhar />`
                : `<span class="bib-mini-cod">${esc(f?.codigo ?? '?')}</span>`}
              <span class="bib-mini-play">${icone('play', 12)}</span>
            </span>
            <span class="bib-mini-txt">
              <strong>@${esc(c.conta)}</strong>
              <span>${fmtN(c.views)} views <b class="${c.relativo != null && c.relativo >= limiar ? 'alto' : ''}">${fmtRel(c.relativo)}</b></span>
              <small>${f ? `${esc(f.codigo)} · ${esc(f.nome)}` : 'formato removido'}</small>
            </span>
          </a>`;
        }).join('')}
      </div>
    </section>`;
}

// ── Estilos: 3 cartões que abrem o guia completo logo abaixo ─────────────
function estilosHtml() {
  const es = listaEstilos();
  if (!es.length) return '';
  if (ui.estilo && !estilo(ui.estilo)) ui.estilo = '';
  return `
    <section class="bib-estilos" aria-labelledby="bib-estilos-titulo">
      <h2 class="sr-only" id="bib-estilos-titulo">Guia de estilos</h2>
      <div class="bib-estilos-grade">${es.map(cartaoEstilo).join('')}</div>
      ${ui.estilo ? guiaHtml(ui.estilo) : ''}
    </section>`;
}

function cartaoEstilo(e) {
  const t = tipoReel(e.id);
  if (!t) return '';
  const aberto = ui.estilo === e.id;
  const nFmt = (e.formatosRecomendados ?? []).filter((id) => formato(id)).length;
  return `
    <button type="button" class="bib-estilo" data-estilo="${e.id}" aria-expanded="${aberto}" aria-controls="bib-guia">
      <span class="bib-estilo-marca" aria-hidden="true">${icone(t.icone, 132)}</span>
      <span class="bib-estilo-topo">
        <span class="bib-estilo-ico">${icone(t.icone, 20)}</span>
        <span class="bib-estilo-nums">
          <span><b>${(e.ganchosModelo ?? []).length}</b> ganchos</span>
          <span><b>${(e.ctas ?? []).length}</b> CTAs</span>
          <span><b>${nFmt}</b> ${nFmt === 1 ? 'recomendado' : 'recomendados'}</span>
        </span>
      </span>
      <strong class="bib-estilo-nome">${esc(t.longo ?? t.nome)}</strong>
      <span class="bib-estilo-obj">${esc(e.objetivo)}</span>
      <span class="bib-estilo-acao">${aberto ? 'Fechar o guia' : 'Ver o guia completo'}${icone(aberto ? 'fechar' : 'chevron-dir', 16)}</span>
    </button>`;
}

// "0-2s Gancho: a frase-tese..." vira tempo + título + texto
function etapaEstilo(txt, i) {
  let texto = String(txt ?? '').trim();
  let tempo = '';
  const m = /^(\d+(?:-\d+)?s)\s+/.exec(texto);
  if (m) { tempo = m[1]; texto = texto.slice(m[0].length); }
  const d = texto.indexOf(':');
  const titulo = d > 0 && d < 48 ? texto.slice(0, d) : '';
  const resto = titulo ? texto.slice(d + 1).trim() : texto;
  return `
    <li>
      <span class="bib-passo-num">${i + 1}</span>
      <div class="bib-passo-txt">${tempo ? `<span class="bib-tempo">${esc(tempo)}</span>` : ''}${titulo ? `<strong>${esc(titulo)}</strong> ` : ''}<span>${esc(resto)}</span></div>
    </li>`;
}

function guiaHtml(id) {
  const e = estilo(id);
  const t = tipoReel(id);
  if (!e || !t) return '';
  const ganchos = (e.ganchosModelo ?? []).map(partesGancho);
  const familias = (e.familiasDeGancho ?? []).map((x) => {
    const s = String(x ?? '');
    const i = s.indexOf(':');
    return i > 0 && i < 60 ? [s.slice(0, i), s.slice(i + 1).trim()] : ['', s];
  });
  const fmts = (e.formatosRecomendados ?? []).map(formato).filter(Boolean);
  const copiarBtn = (texto, rotulo) =>
    `<button type="button" class="btn-icone btn-sm bib-copiar" data-copiar="${esc(texto)}" aria-label="${esc(rotulo)}" title="${esc(rotulo)}">${icone('copiar', 15)}</button>`;
  return `
    <div class="card bib-guia" id="bib-guia" role="region" aria-labelledby="bib-guia-titulo" data-tipo="${id}">
      <header class="bib-guia-topo">
        <span class="bib-estilo-ico grande">${icone(t.icone, 24)}</span>
        <div class="bib-guia-cab">
          <span class="bib-eyebrow">Guia do estilo</span>
          <h2 id="bib-guia-titulo">${esc(t.longo ?? t.nome)}</h2>
          <p class="bib-guia-obj">${esc(e.objetivo)}</p>
        </div>
        <button type="button" class="btn-icone" data-fechar-guia aria-label="Fechar o guia">${icone('fechar', 18)}</button>
      </header>
      <div class="bib-guia-colunas">
        <div class="bib-guia-principal">
          ${(e.estrutura ?? []).length ? `
          <section class="bloco">
            <div class="bloco-titulo">Estrutura</div>
            <ol class="bib-timeline bib-guia-estrutura">${e.estrutura.map(etapaEstilo).join('')}</ol>
          </section>` : ''}
          ${ganchos.length ? `
          <section class="bloco">
            <div class="bloco-titulo">Ganchos modelo<span class="bib-guia-n">${ganchos.length}</span></div>
            <ol class="bib-ganchos">${ganchos.map((g, i) => `
              <li>
                <span class="bib-gancho-num">${i + 1}</span>
                <div class="bib-gancho-txt">
                  <p class="bib-gancho-modelo">${comLacunas(g.modelo)}</p>
                  ${g.exemplo ? `<p class="bib-gancho-ex"><span>Ex.:</span> ${esc(g.exemplo)}</p>` : ''}
                  ${g.temaId ? `<span class="bib-gancho-tema" title="${esc(`Tema: ${nomeTema(g.temaId)}`)}">${esc(nomeTema(g.temaId, { curto: true }))}</span>` : ''}
                </div>
                ${copiarBtn(g.exemplo ? `${g.modelo}\nEx.: ${g.exemplo}` : g.modelo, `Copiar o gancho ${i + 1}`)}
              </li>`).join('')}</ol>
          </section>` : ''}
          ${(e.ctas ?? []).length ? `
          <section class="bloco">
            <div class="bloco-titulo">CTAs<span class="bib-guia-n">${e.ctas.length}</span></div>
            <ul class="bib-ctas">${e.ctas.map((c, i) => `<li><p>${esc(c)}</p>${copiarBtn(c, `Copiar a CTA ${i + 1}`)}</li>`).join('')}</ul>
          </section>` : ''}
        </div>
        <aside class="bib-guia-lateral">
          ${(e.gatilhos ?? []).length ? `
          <section class="bloco">
            <div class="bloco-titulo">Gatilhos</div>
            <ul class="bib-gatilhos">${e.gatilhos.map((x) => `<li>${comTitulo(x)}</li>`).join('')}</ul>
          </section>` : ''}
          ${familias.length ? `
          <section class="bloco">
            <div class="bloco-titulo">Famílias de gancho</div>
            <ul class="bib-familias">${familias.map(([n, d]) => `<li>${n ? `<strong>${esc(n)}</strong>` : ''}<span>${esc(d)}</span></li>`).join('')}</ul>
          </section>` : ''}
          ${fmts.length ? `
          <section class="bloco">
            <div class="bloco-titulo">Formatos recomendados</div>
            <ul class="bib-guia-fmts">${fmts.map((f) => `
              <li><a href="#/biblioteca/${esc(f.id)}"><b>${esc(f.codigo)}</b><span>${esc(f.nome)}</span>${icone('chevron-dir', 14)}</a></li>`).join('')}</ul>
          </section>` : ''}
          ${(e.evitar ?? []).length ? `
          <section class="bloco bib-evitar">
            <div class="bloco-titulo">Evitar</div>
            <ul>${e.evitar.map((x) => `<li>${icone('fechar', 14)}<span>${esc(x)}</span></li>`).join('')}</ul>
          </section>` : ''}
        </aside>
      </div>
    </div>`;
}

// "Reconhecimento de cena: o Pix sem nome..." vira título em negrito + resto
function comTitulo(x) {
  const s = String(x ?? '');
  const i = s.indexOf(':');
  return i > 0 && i < 44 ? `<strong>${esc(s.slice(0, i + 1))}</strong> ${esc(s.slice(i + 1).trim())}` : esc(s);
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    toast('Copiado');
  } catch { toast('Não consegui copiar. Selecione o texto e copie na mão.'); }
}

// miniatura do template: imagem recortada do original (ou a capa tipográfica), categoria no canto e play
function thumbHtml(f, idx, { grande = false } = {}) {
  if (!temThumb(f)) {
    return capa({ tela: f.exemplo?.tela || f.nome, destaque: f.exemplo?.destaque, categoria: f.categoria, variante: VARIANTES[Math.max(0, idx) % VARIANTES.length] });
  }
  return `
    <span class="bib-thumb${grande ? ' grande' : ''}">
      <img src="${thumbDe(f)}" alt="" width="360" height="410" loading="${grande ? 'eager' : 'lazy'}" decoding="async" draggable="false" />
      <span class="bib-thumb-cat">${esc(f.categoria)}</span>
      <span class="bib-thumb-play" aria-hidden="true">${icone('play', 14)}</span>
    </span>`;
}

function cardFormato(f, idx) {
  const o = f.original;
  return `
    <a class="card card-link bib-card" href="#/biblioteca/${esc(f.id)}">
      ${thumbHtml(f, idx)}
      <span class="bib-card-corpo">
        <h3>${esc(o?.titulo || f.nome)}</h3>
        ${o?.formula || f.formula ? `<span class="bib-card-formula">${formulaHtml(o?.formula || f.formula)}</span>` : ''}
        ${o?.publico ? `<span class="pill bib-publico" data-publico="${esc(o.publico)}">${esc(o.publico)}</span>` : ''}
      </span>
    </a>`;
}

function vazioLista(total) {
  if (!total) return `<div class="card vazio">${objeto3d('growth')}<strong>A Biblioteca está vazia</strong></div>`;
  return `
    <div class="card vazio">
      <strong>Nenhum template com esse filtro</strong>
      <div class="bib-vazio-acao"><button class="btn btn-sm" data-mostrar-todos>Mostrar todos</button></div>
    </div>`;
}

// ── Detalhe do formato ───────────────────────────────────────────────────
function renderDetalhe(root, id) {
  const E = store.E;
  const f = formato(id);
  if (!f) {
    root.innerHTML = `
      <div class="bib-pagina bib-detalhe">
        <a class="bib-voltar" href="#/biblioteca">← Biblioteca de Reels</a>
        <div class="card vazio"><strong>Formato não encontrado</strong></div>
      </div>`;
    return;
  }
  const { limiar, min } = regra();
  const cases = [...casesDo(id)].sort((a, b) => dataCase(b).localeCompare(dataCase(a)));
  const reels = (E.reels ?? []).filter((r) => r.formatoId === id)
    .sort((a, b) => (a.data || '9999').localeCompare(b.data || '9999'));
  const idx = ordemGlobal().indexOf(id);
  const ex = f.exemplo ?? {};
  const evidencias = f.evidencias ?? [];
  const formEvAberto = ui.formEv === id;
  const o = f.original;

  root.innerHTML = `
    <div class="bib-pagina bib-detalhe">
      <a class="bib-voltar" href="#/biblioteca">← Biblioteca de Reels</a>

      <section class="bib-hero">
        <div class="bib-hero-capa">${thumbHtml(f, idx, { grande: true })}</div>
        <div class="bib-hero-info">
          <div class="bib-eyebrow">${esc(f.categoria)}<small class="fmt-cod">${esc(f.codigo)}</small></div>
          <h1>${esc(o?.titulo || f.nome)}</h1>
          ${o?.formula || f.formula ? `<p class="bib-formula">${formulaHtml(o?.formula || f.formula)}</p>` : ''}
          <div class="bib-hero-pills">
            ${o?.publico ? `<span class="pill bib-publico" data-publico="${esc(o.publico)}">${esc(o.publico)}</span>` : ''}
            ${seloFormato(f, { compacto: true })}
          </div>
          <div class="bib-hero-acoes">
            <button class="btn btn-primario" data-usar>${icone('raio', 16)} Adaptar com a skill</button>
            ${reels.length ? `<span class="bib-uso">Usado em ${plural(reels.length, 'reel', 'reels')}</span>` : ''}
          </div>
        </div>
      </section>

      <div class="bib-colunas">
        <div class="bib-principal">
          <section class="bloco">
            <div class="bloco-titulo">${o ? 'Nossa versão pro Legalizaí' : 'Estrutura'}</div>
            <div class="card bib-adaptado">
              ${o ? `<h2>${esc(f.nome)}</h2>` : ''}
              ${o && f.formula ? `<p class="bib-formula">${formulaHtml(f.formula)}</p>` : ''}
              ${f.descricao ? `<p class="bib-descricao">${esc(f.descricao)}</p>` : ''}
              <div class="bib-adaptado-pills">
                ${f.publico ? `<span class="pill">${esc(f.publico)}</span>` : ''}
                ${f.duracao ? `<span class="pill">${icone('relogio', 12)}${esc(f.duracao)}</span>` : ''}
                ${tagsTipo(f)}
              </div>
              ${(f.estrutura ?? []).length ? `<ol class="bib-timeline">${f.estrutura.map(etapaHtml).join('')}</ol>` : ''}
              ${ex.titulo || ex.gancho ? `
              <div class="bib-exemplo">
                <div class="bib-exemplo-topo"><span class="bib-rotulo">Exemplo</span>${botaoFontes(f.fontes)}</div>
                ${ex.titulo ? `<h3>${esc(ex.titulo)}</h3>` : ''}
                ${ex.gancho ? `<div class="bib-exemplo-gancho"><span class="bib-rotulo">Gancho</span><p>${esc(ex.gancho)}</p></div>` : ''}
                ${ex.tela ? `<div class="bib-exemplo-tela"><span class="bib-rotulo">Na tela</span><span class="bib-tela">${telaHtml(ex)}</span></div>` : ''}
              </div>` : ''}
            </div>
          </section>

          <section class="bloco">
            <div class="bib-bloco-topo">
              <div class="bloco-titulo">Cases de sucesso · ${cases.length}</div>
              <button class="btn btn-sm" data-add-case>+ Adicionar case</button>
            </div>
            ${cases.length
              ? `<div class="bib-cases">${cases.map((c, i) => caseHtml(c, f, i, limiar)).join('')}</div>`
              : `<div class="card vazio bib-vazio"><strong>Nenhum case ainda</strong></div>`}
          </section>

          <section class="bloco">
            <div class="bib-bloco-topo">
              <div class="bloco-titulo">Evidências</div>
              ${formEvAberto ? '' : '<button class="btn btn-sm" data-add-ev>+ Benchmark</button>'}
            </div>
            ${evidencias.some((e) => e.tipo !== 'interna')
              ? `<ul class="bib-evidencias">${evidencias.map((e, i) => (e.tipo === 'interna' ? '' : evidenciaHtml(e, i))).join('')}</ul>`
              : '<p class="bib-mudo">Nenhuma evidência registrada.</p>'}
            ${formEvAberto ? `
            <form class="card bib-form-ev" id="bib-form-ev" novalidate>
              <label class="rotulo">O número<input class="campo" name="valor" required placeholder="Ex.: reels de lista retêm 2× mais que a média" /></label>
              <label class="rotulo">Fonte<input class="campo" name="fonte" required placeholder="Link ou nome do estudo" /></label>
              <p class="bib-form-erro" role="alert" hidden></p>
              <div class="bib-form-acoes">
                <button class="btn btn-primario btn-sm" type="submit">Registrar benchmark</button>
                <button class="btn btn-fantasma btn-sm" type="button" data-cancelar-ev>Cancelar</button>
              </div>
            </form>` : ''}
          </section>

          <section class="bloco">
            <div class="bloco-titulo">Reels do cronograma com este formato</div>
            ${reels.length ? `
            <ul class="bib-reels">
              ${reels.map((r) => `
              <li>
                <button class="bib-reel" data-reel="${esc(r.id)}">
                  <span class="bib-reel-data">${r.data ? esc(fmtData(r.data)) : 'sem data'}</span>
                  <strong>${esc(r.ideia)}</strong>
                  <span class="pill ${r.status === 'publicado' ? 'pill-ok' : ''}">${esc(r.status)}</span>
                </button>
              </li>`).join('')}
            </ul>` : '<p class="bib-mudo">Nenhum ainda.</p>'}
          </section>
        </div>

        <aside class="bib-lateral">
          ${validacaoHtml(f, cases, limiar, min)}
        </aside>
      </div>
    </div>`;

  ligarDetalhe(root, f);
}

function etapaHtml(txt, i) {
  let texto = String(txt ?? '');
  let tempo = '';
  const entre = texto.match(/\(\s*(\d+(?:[.,]\d+)?\s*(?:-|a)\s*\d+(?:[.,]\d+)?\s*s|\d+(?:[.,]\d+)?\s*s)\s*\)/i);
  const inicio = texto.match(/^\s*(\d+(?:-\d+)?\s*s)\s*[:·.]\s*/i);
  if (entre) { tempo = entre[1]; texto = texto.replace(entre[0], ' '); }
  else if (inicio) { tempo = inicio[1]; texto = texto.slice(inicio[0].length); }
  texto = texto.replace(/\s{2,}/g, ' ').replace(/\s+([.,:])/g, '$1').trim();
  return `
    <li>
      <span class="bib-passo-num">${i + 1}</span>
      <div class="bib-passo-txt">${tempo ? `<span class="bib-tempo">${esc(tempo)}</span>` : ''}<span>${esc(texto)}</span></div>
    </li>`;
}

function telaHtml(ex) {
  const tela = esc(ex.tela);
  const d = ex.destaque ? esc(ex.destaque) : '';
  return d && tela.includes(d) ? tela.replace(d, `<em>${d}</em>`) : tela;
}

function fonteHtml(fonte) {
  const s = String(fonte ?? '');
  return /^https?:\/\//.test(s) ? `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(s)}</a>` : esc(s);
}

function caseHtml(c, f, i, limiar) {
  const alto = c.relativo != null && c.relativo >= limiar;
  const tela = c.relativo != null ? `${fmtRel(c.relativo)} A MEDIANA` : c.views != null ? `${fmtN(c.views)} VIEWS` : f.exemplo?.tela || f.nome;
  const numeros = [
    ['views', c.views], ['curtidas', c.likes], ['coment.', c.comments], ['salv.', c.saved], ['compart.', c.shares],
  ].filter(([, v]) => v != null);
  return `
    <article class="card bib-case">
      <div class="bib-case-midia">
        ${capa({
          tela,
          destaque: c.relativo != null ? fmtRel(c.relativo) : undefined,
          categoria: ORIGEM_CASE[c.origem] ?? 'Case',
          variante: VARIANTES[i % VARIANTES.length],
          thumb: c.thumb || undefined,
        })}
      </div>
      <div class="bib-case-corpo">
        <div class="bib-case-linha">
          <strong>@${esc(c.conta)}</strong>
          <span class="pill ${alto ? 'pill-ok' : ''}" title="Views sobre a mediana da conta">${fmtRel(c.relativo)}</span>
        </div>
        ${c.titulo ? `<p class="bib-case-titulo">${esc(c.titulo)}</p>` : ''}
        ${numeros.length ? `<div class="bib-case-nums">${numeros.map(([k, v]) => `<span><b>${fmtN(v)}</b> ${k}</span>`).join('')}</div>` : ''}
        ${c.notas ? `<p class="bib-case-notas">${esc(c.notas)}</p>` : ''}
        <div class="bib-case-pe">
          <span class="pill">${esc(ORIGEM_CASE[c.origem] ?? c.origem ?? 'Case')}</span>
          ${c.data ? `<span class="bib-mudo">${esc(fmtData(String(c.data).slice(0, 10), { ano: true }))}</span>` : ''}
          <span class="bib-espaco"></span>
          ${c.permalink ? `<a class="btn btn-sm btn-fantasma" href="${esc(c.permalink)}" target="_blank" rel="noopener">${icone('link', 14)} Abrir</a>` : ''}
          <button class="btn-icone bib-rm" data-rm-case="${esc(c.id)}" aria-label="Excluir case">${icone('lixo', 16)}</button>
        </div>
      </div>
    </article>`;
}

function evidenciaHtml(e, i) {
  const valor = e.valor || (e.relativo != null ? `${fmtRel(e.relativo)} a mediana da conta` : '');
  const quando = e.registradaEm ? fmtData(String(e.registradaEm).slice(0, 10), { ano: true }) : '';
  return `
    <li>
      <span class="pill ${e.tipo === 'benchmark' ? 'pill-info' : 'pill-marca'}">${esc(TIPOS_EV[e.tipo] ?? e.tipo ?? 'Evidência')}</span>
      <div class="bib-ev-txt">
        <p>${esc(valor)}</p>
        <small>${fonteHtml(e.fonte)}${quando ? ` · ${esc(quando)}` : ''}</small>
      </div>
      <button class="btn-icone bib-rm" data-rm-ev="${i}" aria-label="Remover evidência">${icone('lixo', 16)}</button>
    </li>`;
}

function validacaoHtml(f, cases, limiar, min) {
  const doNicho = cases.filter((c) => ['nosso', 'nicho'].includes(c.origem));
  const acima = f.acima ?? doNicho.filter((c) => c.relativo != null && c.relativo >= limiar).length;
  const bench = (f.evidencias ?? []).find((e) => e.tipo === 'benchmark' && e.valor && e.fonte);
  const regua = fmtRel(limiar);
  let texto;
  if (ehValidado(f) && f.via === 'dado')
    texto = `Validado pelo nosso dado: ${plural(acima, 'case', 'cases')} do nosso nicho com ${regua} ou mais a mediana da própria conta.`;
  else if (ehValidado(f) && f.via === 'benchmark')
    texto = `Validado por benchmark: ${esc(String(bench?.valor ?? 'número externo com fonte').replace(/\.\s*$/, ''))}.`;
  else if (ehValidado(f) && f.via === 'biblioteca')
    texto = doNicho.length
      ? `Formato validado. Já tem ${plural(doNicho.length, 'case', 'cases')} com o nosso dado, ${acima} acima da régua.`
      : 'Formato validado. Ainda sem case nosso publicado.';
  else if (ehValidado(f)) texto = 'Validado.';
  else texto = `Em teste. Vira validado com ${min} cases rendendo ${regua} ou mais a mediana da conta, ou com um benchmark que tenha número e fonte.`;
  const pct = Math.min(100, Math.round((acima / min) * 100));
  return `
    <div class="card bib-validacao ${ehValidado(f) ? 'ok' : ''}">
      <div class="bloco-titulo">Validação</div>
      <div class="bib-validacao-selo">${seloFormato(f)}</div>
      <p>${texto}</p>
      <div class="bib-progresso-rotulo"><b>${acima}/${min}</b> cases do nosso nicho acima de ${regua} a mediana</div>
      <div class="progresso" role="progressbar" aria-valuemin="0" aria-valuemax="${min}" aria-valuenow="${Math.min(acima, min)}"><i style="width:${pct}%"></i></div>
      ${bench && f.via === 'benchmark' ? `<small class="bib-mudo">Fonte: ${fonteHtml(bench.fonte)}</small>` : ''}
    </div>`;
}

function ligarDetalhe(root, f) {
  const pag = $('.bib-detalhe', root);
  pag.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || !pag.contains(b)) return;
    if ('usar' in b.dataset) return abrirCriar({ formatoId: f.id });
    if ('addCase' in b.dataset) return abrirFormCase(f);
    if (b.dataset.rmCase) return removerCase(b.dataset.rmCase);
    if ('addEv' in b.dataset) {
      ui.formEv = f.id;
      redesenhar();
      return $('#bib-form-ev [name="valor"]')?.focus();
    }
    if ('cancelarEv' in b.dataset) { ui.formEv = null; return redesenhar(); }
    if (b.dataset.rmEv != null) return removerEvidencia(f, Number(b.dataset.rmEv));
    if (b.dataset.reel) return abrirDetalhe(b.dataset.reel);
  };

  const formEv = $('#bib-form-ev', pag);
  if (formEv) formEv.onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(formEv));
    const erro = $('.bib-form-erro', formEv);
    const valor = String(d.valor ?? '').trim();
    const fonte = String(d.fonte ?? '').trim();
    if (!valor || !fonte) { erro.textContent = 'Benchmark precisa do número e da fonte.'; erro.hidden = false; return; }
    try {
      await api('POST', `/api/formatos/${f.id}/evidencias`, { tipo: 'benchmark', valor, fonte });
      ui.formEv = null;
      await recarregar();
      toast('Benchmark registrado');
    } catch (err) { erro.textContent = err.message; erro.hidden = false; }
  };
}

async function removerCase(id) {
  if (!confirm('Excluir este case? Ele deixa de contar pra validar o formato.')) return;
  try {
    await api('DELETE', `/api/cases/${id}`);
    await recarregar();
    toast('Case excluído');
  } catch (e) { toast(e.message); }
}

async function removerEvidencia(f, i) {
  if (!confirm('Remover esta evidência? O status do formato pode mudar.')) return;
  try {
    await api('DELETE', `/api/formatos/${f.id}/evidencias?i=${i}`);
    await recarregar();
    toast('Evidência removida');
  } catch (e) { toast(e.message); }
}

// ── Painel: adicionar case ───────────────────────────────────────────────
function abrirFormCase(f) {
  const { limiar } = regra();
  const handle = store.E.config?.handleInstagram ?? '';
  const numero = (nome, rotulo, extra = '') =>
    `<label class="rotulo">${rotulo}<input class="campo" name="${nome}" type="number" min="0" step="1" inputmode="numeric" ${extra} /></label>`;

  const p = abrirPainel(`
    <div class="painel-topo">
      <div>
        <h2>Adicionar case</h2>
        <p>${esc(f.nome)}</p>
      </div>
      ${BTN_FECHAR}
    </div>
    <form class="painel-corpo bib-form" id="bib-form-case" novalidate>
      <label class="rotulo">Link do reel
        <input class="campo" name="permalink" type="url" required placeholder="https://www.instagram.com/reel/..." />
      </label>
      <div class="bib-form-linha">
        <label class="rotulo">Conta<input class="campo" name="conta" required placeholder="@conta" value="${esc(handle)}" /></label>
        <label class="rotulo">Origem
          <select class="campo" name="origem">
            <option value="nosso">Reel nosso</option>
            <option value="nicho">Reel do nicho</option>
          </select>
        </label>
      </div>
      <label class="rotulo">Título (opcional)<input class="campo" name="titulo" placeholder="Do que o reel fala" /></label>
      <div class="bib-form-linha">
        ${numero('views', 'Views', 'required')}
        ${numero('mediana', 'Mediana de views da conta', 'placeholder="Views de um reel típico"')}
      </div>
      <div class="bib-relativo" id="bib-relativo" aria-live="polite"></div>
      <div class="bib-form-linha bib-form-4">
        ${numero('likes', 'Curtidas')}
        ${numero('comments', 'Comentários')}
        ${numero('saved', 'Salvamentos')}
        ${numero('shares', 'Compartilhamentos')}
      </div>
      <label class="rotulo">Data de publicação<input class="campo" name="data" type="date" /></label>
      <label class="rotulo">Notas<textarea class="campo" name="notas" rows="3" placeholder="O que fez esse reel funcionar"></textarea></label>
      <p class="bib-form-erro" id="bib-form-erro" role="alert" hidden></p>
    </form>
    <div class="painel-rodape">
      <button class="btn btn-primario" type="submit" form="bib-form-case">Salvar case</button>
      <button class="btn btn-fantasma" type="button" data-cancelar>Cancelar</button>
    </div>
  `, { largo: false });
  if (!p) return;
  p.querySelectorAll('[data-fechar], [data-cancelar]').forEach((b) => (b.onclick = fecharPainel));

  const form = $('#bib-form-case', p);
  const campos = form.elements;
  const saida = $('#bib-relativo', p);
  const erro = $('#bib-form-erro', p);
  const regua = fmtRel(limiar);

  const calcular = () => {
    const v = Number(campos.views.value);
    const m = Number(campos.mediana.value);
    if (campos.views.value === '' || !(m > 0)) {
      saida.className = 'bib-relativo';
      saida.textContent = `Com views e mediana, o app calcula quantas vezes o reel rendeu acima do normal da conta. A régua é ${regua}.`;
      return null;
    }
    const rel = Math.round((v / m) * 100) / 100;
    const alto = rel >= limiar;
    saida.className = `bib-relativo ${alto ? 'alto' : ''}`;
    saida.innerHTML = `<b>${fmtRel(rel)}</b> a mediana da conta. ${alto ? 'Conta pra validar o formato.' : `Fica registrado, mas só conta pra validar a partir de ${regua}.`}`;
    return rel;
  };
  campos.views.oninput = calcular;
  campos.mediana.oninput = calcular;
  campos.origem.onchange = () => {
    if (campos.origem.value === 'nosso' && !campos.conta.value) campos.conta.value = handle;
    if (campos.origem.value === 'nicho' && campos.conta.value === handle) campos.conta.value = '';
  };
  calcular();
  campos.permalink.focus();

  form.onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const num = (v) => (v === '' || v == null ? null : Number(v));
    const avisar = (msg) => { erro.textContent = msg; erro.hidden = false; };
    const permalink = String(d.permalink ?? '').trim();
    const conta = String(d.conta ?? '').trim().replace(/^@/, '');
    if (!/^https?:\/\//.test(permalink)) return avisar('Cole o link do reel (começa com https://).');
    if (!conta) return avisar('Diga de qual conta é o reel.');
    if (d.views === '') return avisar('Coloque as views do reel.');
    erro.hidden = true;
    const relativo = calcular();
    const botao = p.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
      await api('POST', '/api/cases', {
        formatoId: f.id,
        titulo: String(d.titulo ?? '').trim(),
        conta,
        origem: d.origem,
        permalink,
        thumb: '',
        views: num(d.views),
        likes: num(d.likes),
        comments: num(d.comments),
        saved: num(d.saved),
        shares: num(d.shares),
        relativo,
        data: d.data || null,
        notas: String(d.notas ?? '').trim(),
        midiaId: null,
        reelId: null,
      });
      fecharPainel();
      await recarregar();
      toast(relativo != null && relativo >= limiar ? 'Case salvo. Ele conta pra validar o formato.' : 'Case salvo');
    } catch (err) {
      botao.disabled = false;
      avisar(err.message);
    }
  };
}
