// Banco de Ideias: muitos temas do nicho contábil em três estilos (Viralização, Vendas, Conexão),
// cada ideia com roteiro base (hook, texto de tela, narração, CTA) e pendurada num formato da Biblioteca.
// A geração com IA leva de 1 a 3 minutos: o estado "gerando" vive no módulo, não no DOM,
// porque recarregar() redesenha a view várias vezes enquanto a requisição corre.
import {
  $, esc, store, api, recarregar, toast, abrirPainel, fecharPainel, BTN_FECHAR, formato, ideia, reel, seloFormato, icone,
  TIPOS, tipoReel, pillTipo, temaDo, nomeTema, listaTemas, mesmoTema, fonteComLink,
} from '../core.js';
import { abrirCriar } from '../chat.js';
import { abrirDetalhe } from '../detalhe.js';
import { agruparPorCategoria } from './biblioteca.js';
import { objeto3d } from '../efeitos.js';

const ESTILOS = TIPOS.filter((t) => !t.secundario);
const FILTROS = [['todas', 'Todas'], ...ESTILOS.map((t) => [t.id, t.nome]), ['favoritas', 'Favoritas']];
const ORIGENS = { ia: 'IA', manual: 'Manual', instagram: 'Instagram' };
const MSGS_IA = ['Lendo as regras da marca', 'Lendo o guia do estilo', 'Conferindo os fatos do tema', 'Escrevendo o roteiro base', 'Conferindo as fontes'];

// pedido: o que a pessoa escolheu no popover de gerar (tema null = ainda não mexeu, vale o filtro)
const estado = { filtro: 'todas', tema: '', gerando: null, inicio: 0, novas: new Set(), pedido: { tipo: '', tema: null } };
let raiz = null;
let relogio = null;
let ouvindoFora = false;

const dataIdeia = (i) => i.criadaEm ?? i.criadoEm ?? '';
const passaTipo = (i, filtro) =>
  filtro === 'todas' ? true : filtro === 'favoritas' ? !!i.favorita : i.tipo === filtro;
const passaTema = (i, tema) => !tema || mesmoTema(i.tema, tema);
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
// sem escolha no popover, o pedido segue o filtro da tela (estilo e tema)
function pedidoAtual() {
  const t = tipoReel(estado.filtro);
  return {
    tipo: estado.pedido.tipo || (t && !t.secundario ? t.id : ''),
    tema: estado.pedido.tema ?? temaDo(estado.tema)?.id ?? '',
  };
}

function naRota() {
  return location.hash.replace(/^#/, '').startsWith('/ideias');
}
function redesenhar() {
  if (raiz && naRota()) render(raiz);
}

export function render(root) {
  raiz = root;
  if (!store.E) { root.innerHTML = '<div class="vazio">Carregando…</div>'; return; }
  const todas = [...(store.E.ideias ?? [])].sort((a, b) => dataIdeia(b).localeCompare(dataIdeia(a)));
  const temasUsados = new Set(todas.map((i) => temaDo(i.tema)?.id ?? i.tema).filter(Boolean));
  if (estado.tema && !listaTemas().some((t) => t.id === estado.tema) && !temasUsados.has(estado.tema)) estado.tema = '';
  const doTema = todas.filter((i) => passaTema(i, estado.tema));
  const lista = doTema.filter((i) => passaTipo(i, estado.filtro));
  const g = estado.gerando;
  const mostrarEsqueleto = g && ['todas', g.tipo].includes(estado.filtro) && (!estado.tema || !g.tema || g.tema === estado.tema);
  const nTemas = temasUsados.size;

  root.innerHTML = `
    <div class="ide-pagina">
      <header class="cabecalho-pagina">
        <div>
          <h1>Banco de Ideias <span class="ide-contagem">${todas.length}</span></h1>
          <p>${plural(todas.length, 'ideia', 'ideias')} ${nTemas > 1 ? `sobre ${nTemas} temas do nicho` : 'do nicho'}, em três estilos: viralização, vendas e conexão. Cada uma com roteiro base e um formato da Biblioteca.</p>
        </div>
        <div class="acoes ide-acoes">
          <button class="btn" data-acao="nova">+ Nova ideia</button>
          ${botaoGerar()}
        </div>
        ${objeto3d('lampada')}
      </header>

      <div class="ide-filtros">
        <div class="ide-chips" role="group" aria-label="Filtrar ideias por estilo">
          ${FILTROS.map(([k, rotulo]) => {
            const t = tipoReel(k);
            return `
            <button class="ide-chip" data-filtro="${k}" aria-pressed="${estado.filtro === k}">
              ${t ? icone(t.icone, 14) : k === 'favoritas' ? icone('estrela', 14) : ''}${esc(rotulo)}<span>${doTema.filter((i) => passaTipo(i, k)).length}</span>
            </button>`;
          }).join('')}
        </div>
        <label class="ide-tema">
          <span class="sr-only">Filtrar por tema</span>
          <select class="campo" data-tema-filtro>${opcoesTema(estado.tema, { todos: 'Todos os temas', contar: todas.filter((i) => passaTipo(i, estado.filtro)) })}</select>
        </label>
      </div>

      ${lista.length || mostrarEsqueleto
        ? `<div class="grade ide-grade">${mostrarEsqueleto ? esqueletos() : ''}${lista.map(cardHtml).join('')}</div>`
        : vazioHtml()}
    </div>`;

  ligar($('.ide-pagina', root));

  // #/ideias?abrir=<id> (link de uma ideia favorita na home) abre o painel da ideia uma vez
  const abrir = new URLSearchParams(location.hash.split('?')[1] ?? '').get('abrir');
  if (abrir) {
    history.replaceState(null, '', '#/ideias'); // limpa antes: recarregar() chama render() de novo
    // espera o main.js focar a #vista, senão o foco sai do painel
    queueMicrotask(() => (ideia(abrir) ? abrirIdeia(abrir) : toast('Não achei essa ideia')));
  }
}

// temas do mapa do nicho, na ordem do mapa; os que só existem em ideias ficam em "Outros temas"
function opcoesTema(atual, { todos = '', contar = null, extra = null } = {}) {
  const temas = listaTemas();
  const n = (id) => (contar ? contar.filter((i) => mesmoTema(i.tema, id)).length : 0);
  const rot = (id, nome) => (contar && n(id) ? `${nome} (${n(id)})` : nome);
  const fora = [...new Set([...(store.E?.ideias ?? []).map((i) => i.tema), extra]
    .filter((id) => id && !temaDo(id)))];
  return `
    ${todos ? `<option value="">${esc(todos)}</option>` : ''}
    ${temas.map((t) => `<option value="${esc(t.id)}" ${mesmoTema(atual, t.id) ? 'selected' : ''}>${esc(rot(t.id, nomeTema(t.id, { curto: true })))}</option>`).join('')}
    ${fora.length ? `<optgroup label="Outros temas">${fora.map((id) => `<option value="${esc(id)}" ${atual === id ? 'selected' : ''}>${esc(rot(id, nomeTema(id, { curto: true })))}</option>`).join('')}</optgroup>` : ''}`;
}

function botaoGerar() {
  const g = estado.gerando;
  if (g)
    return `
      <div class="ide-gerar">
        <button class="btn btn-primario ide-btn-gerar" disabled aria-busy="true">
          <span class="ide-spinner" aria-hidden="true"></span>
          Gerando ideias de ${esc(tipoReel(g.tipo)?.nome ?? g.tipo)}
          <span class="ide-tempo">${tempoDecorrido()}</span>
        </button>
      </div>`;
  const p = pedidoAtual();
  return `
    <div class="ide-gerar">
      <button class="btn btn-primario ide-btn-gerar" data-acao="menu-gerar" aria-haspopup="dialog" aria-expanded="false" aria-controls="ide-menu-gerar">
        ${icone('raio', 16)} Gerar 3 ideias com IA
      </button>
      <div class="ide-menu" id="ide-menu-gerar" role="dialog" aria-label="Gerar 3 ideias com IA" hidden>
        <p class="ide-menu-rotulo" id="ide-gerar-estilo">Estilo<span class="ide-obrig">obrigatório</span></p>
        <div class="ide-menu-tipos" role="radiogroup" aria-labelledby="ide-gerar-estilo">
          ${ESTILOS.map((t) => `
          <button type="button" role="radio" aria-checked="${p.tipo === t.id}" data-gerar-tipo="${t.id}">
            <span class="ide-menu-ico">${icone(t.icone, 16)}</span>
            <span class="ide-menu-txt"><strong>${esc(t.nome)}</strong><span>${esc(t.resumo)}</span></span>
          </button>`).join('')}
        </div>
        <label class="ide-menu-campo">
          <span class="ide-menu-rotulo">Tema<span class="ide-obrig opcional">opcional</span></span>
          <select class="campo" data-gerar-tema>
            <option value="">A IA escolhe entre os temas do nicho</option>
            ${listaTemas().map((t) => `<option value="${esc(t.id)}" ${p.tema === t.id ? 'selected' : ''}>${esc(nomeTema(t.id, { curto: true }))}</option>`).join('')}
          </select>
        </label>
        <button type="button" class="btn btn-primario ide-menu-ok" data-gerar-ok ${p.tipo ? '' : 'disabled'}>${icone('raio', 16)} Gerar 3 ideias</button>
        <small>Leva de 1 a 3 minutos. Você pode seguir usando o app.</small>
      </div>
    </div>`;
}

function esqueletos() {
  const msg = MSGS_IA[0];
  const t = tipoReel(estado.gerando?.tipo);
  return Array.from({ length: 3 }, () => `
    <div class="card ide-card ide-esqueleto" aria-hidden="true">
      <div class="ide-card-topo"><span class="ide-tile">${icone(t?.icone ?? 'lampada', 20)}</span></div>
      <span class="ide-esq-linha" style="width:88%"></span>
      <span class="ide-esq-linha" style="width:64%"></span>
      <span class="ide-esq-linha fina" style="width:95%"></span>
      <span class="ide-esq-linha fina" style="width:80%"></span>
      <span class="ide-esq-msg">${msg}…</span>
    </div>`).join('');
}

// o texto num span: dentro do inline-flex da .pill as reticências não aparecem
const pillTema = (i) => (i.tema
  ? `<span class="pill ide-pill-tema" title="${esc(`Tema: ${nomeTema(i.tema)}`)}"><span class="ide-pill-txt">${esc(nomeTema(i.tema, { curto: true }))}</span></span>`
  : '');
// no card, do que o reel fala: o hook (sem o "PEDRO:" do diálogo); se ele só repete o título, o começo
// da narração. A descrição inteira (encenação e produção) fica no painel
const semFalante = (s) => String(s ?? '').replace(/\b(PEDRO|MAURO|COLEGA|PAPELADA):\s*/g, '').trim();
const palavras = (s) => new Set(String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
function premissa(i) {
  const hook = semFalante(i.roteiroBase?.hook || i.gancho);
  const t = palavras(i.titulo);
  const h = palavras(hook);
  const repete = t.size > 0 && [...t].filter((w) => h.has(w)).length / t.size >= 0.6;
  if (hook && !repete) return hook;
  return semFalante(i.roteiroBase?.narracao) || hook || i.descricao || '';
}
const pillFormato = (f) => (f
  ? `<span class="pill ide-pill-fmt" title="${esc(`${f.codigo} · ${f.nome}`)}"><i class="ponto-fmt ${esc(f.status)}"></i>${esc(f.codigo)} · ${esc(f.categoria)}</span>`
  : '<span class="pill ide-pill-fmt">Formato livre</span>');

function cardHtml(i) {
  const f = formato(i.formatoId);
  const t = tipoReel(i.tipo);
  const nova = estado.novas.has(i.id);
  return `
    <article class="card card-link ide-card${nova ? ' ide-nova' : ''}" data-tipo="${esc(i.tipo ?? '')}">
      <div class="ide-card-topo">
        <span class="ide-tile">${icone(t?.icone ?? 'lampada', 20)}</span>
        ${nova ? '<span class="pill pill-marca ide-selo-nova">Nova</span>' : ''}
        <button class="ide-fav${i.favorita ? ' ativo' : ''}" data-favoritar="${esc(i.id)}"
          aria-pressed="${!!i.favorita}" aria-label="${i.favorita ? 'Tirar dos favoritos' : 'Favoritar'}">
          ${icone(i.favorita ? 'estrela-cheia' : 'estrela', 18)}
        </button>
      </div>
      <h3><button class="ide-card-abrir" data-abrir="${esc(i.id)}"><span>${esc(i.titulo)}</span></button></h3>
      <p class="ide-card-desc">${esc(premissa(i))}</p>
      <div class="ide-pills">${pillsHtml(i, f)}</div>
    </article>`;
}

function pillsHtml(i, f, { origem = false } = {}) {
  return `
    ${pillTipo(i.tipo, { semTipo: false, tam: 12 })}
    ${pillTema(i)}
    ${pillFormato(f)}
    ${origem || i.origem === 'instagram' ? (ORIGENS[i.origem] ? `<span class="pill">${i.origem === 'instagram' ? icone('instagram', 12) : ''}${esc(ORIGENS[i.origem])}</span>` : '') : ''}
    ${i.reelId ? '<span class="pill pill-ok">virou reel</span>' : ''}`;
}

function vazioHtml() {
  if (estado.filtro === 'favoritas' && !estado.tema)
    return `<div class="card vazio">${objeto3d('growth')}<strong>Nenhuma favorita ainda</strong><p>Toque na estrela de uma ideia pra guardar ela aqui.</p></div>`;
  if (estado.tema || estado.filtro !== 'todas')
    return `<div class="card vazio"><strong>Nenhuma ideia com esse filtro</strong><p>Troque o estilo ou o tema, ou peça 3 ideias pra IA nesse recorte.</p><button class="btn btn-sm" data-limpar-filtros>Ver todas</button></div>`;
  return `<div class="card vazio">${objeto3d('growth')}<strong>Nenhuma ideia aqui ainda</strong><p>Crie uma com "+ Nova ideia" ou peça 3 pra IA.</p></div>`;
}

function ligar(pag) {
  pag.onclick = (e) => {
    const alvo = e.target.closest('button');
    if (!alvo || !pag.contains(alvo)) return;
    if (alvo.dataset.favoritar) return favoritar(alvo.dataset.favoritar);
    if (alvo.dataset.abrir) return abrirIdeia(alvo.dataset.abrir);
    if (alvo.dataset.filtro) { estado.filtro = alvo.dataset.filtro; return redesenhar(); }
    if ('limparFiltros' in alvo.dataset) { estado.filtro = 'todas'; estado.tema = ''; return redesenhar(); }
    if (alvo.dataset.gerarTipo) return escolherTipoGerar(alvo.dataset.gerarTipo);
    if ('gerarOk' in alvo.dataset) {
      const p = pedidoAtual();
      if (!tipoReel(p.tipo)) return;
      fecharMenu();
      estado.pedido = { tipo: '', tema: null };
      return gerar(p.tipo, p.tema);
    }
    if (alvo.dataset.acao === 'nova') return abrirForm();
    if (alvo.dataset.acao === 'menu-gerar') return alternarMenu();
  };
  const selTema = $('[data-tema-filtro]', pag);
  if (selTema) selTema.onchange = () => { estado.tema = selTema.value; redesenhar(); $('[data-tema-filtro]')?.focus(); };
  const selGerar = $('[data-gerar-tema]', pag);
  if (selGerar) selGerar.onchange = () => { estado.pedido.tema = selGerar.value; };
  ouvirFora();
  // celular: a faixa de chips rola na horizontal; o chip ativo fora da vista vem pra dentro
  const faixa = $('.ide-chips', pag);
  const ativo = $('.ide-chip[aria-pressed="true"]', pag);
  if (faixa && ativo && faixa.scrollWidth > faixa.clientWidth) {
    const a = ativo.getBoundingClientRect();
    const f = faixa.getBoundingClientRect();
    if (a.left < f.left || a.right > f.right) faixa.scrollLeft += a.left - f.left - 16;
  }
}

// ── Popover "Gerar com IA": estilo obrigatório, tema opcional ────────────
function escolherTipoGerar(tipo) {
  estado.pedido.tipo = tipo;
  document.querySelectorAll('[data-gerar-tipo]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.gerarTipo === tipo)));
  const ok = document.querySelector('[data-gerar-ok]');
  if (ok) ok.disabled = false;
}
function alternarMenu() {
  const menu = document.querySelector('.ide-menu');
  if (!menu) return;
  const abrir = menu.hidden;
  menu.hidden = !abrir;
  document.querySelector('[data-acao="menu-gerar"]')?.setAttribute('aria-expanded', String(abrir));
  if (abrir) (menu.querySelector('[aria-checked="true"]') ?? menu.querySelector('[data-gerar-tipo]'))?.focus();
}
function fecharMenu(devolverFoco = false) {
  const menu = document.querySelector('.ide-menu');
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  const btn = document.querySelector('[data-acao="menu-gerar"]');
  btn?.setAttribute('aria-expanded', 'false');
  if (devolverFoco) btn?.focus();
}
function ouvirFora() {
  if (ouvindoFora) return;
  ouvindoFora = true;
  document.addEventListener('click', (e) => {
    const caixa = document.querySelector('.ide-gerar');
    if (caixa && e.target instanceof Node && e.target.isConnected && !caixa.contains(e.target)) fecharMenu();
  });
  document.addEventListener('keydown', (e) => {
    const menu = document.querySelector('.ide-menu');
    if (e.key === 'Escape' && menu && !menu.hidden) fecharMenu(true);
    // setas trocam o estilo dentro do grupo, como um radiogroup
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target instanceof Element && e.target.matches('[data-gerar-tipo]')) {
      e.preventDefault();
      const itens = [...document.querySelectorAll('[data-gerar-tipo]')];
      const i = itens.indexOf(e.target);
      const prox = itens[(i + (e.key === 'ArrowDown' ? 1 : -1) + itens.length) % itens.length];
      escolherTipoGerar(prox.dataset.gerarTipo);
      prox.focus();
    }
  });
}

// ── Gerar com IA ─────────────────────────────────────────────────────────
function tempoDecorrido() {
  const s = Math.max(0, Math.floor((Date.now() - estado.inicio) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

async function gerar(tipo, tema) {
  if (estado.gerando) return;
  const t = tipoReel(tipo);
  estado.gerando = { tipo, tema: tema || '' };
  estado.inicio = Date.now();
  // a vista mostra onde as ideias vão cair: o estilo pedido e, se veio, o tema
  estado.filtro = tipo;
  estado.tema = tema || '';
  redesenhar();
  let tique = 0;
  relogio = setInterval(() => {
    tique++;
    const el = document.querySelector('.ide-tempo');
    if (el) el.textContent = tempoDecorrido();
    if (tique % 6 === 0) {
      const msg = MSGS_IA[(tique / 6) % MSGS_IA.length];
      document.querySelectorAll('.ide-esq-msg').forEach((x) => (x.textContent = msg + '…'));
    }
  }, 1000);
  try {
    const r = await api('POST', '/api/ideias/gerar', { tipo, ...(tema ? { tema } : {}), quantidade: 3 });
    const novas = r.ideias ?? [];
    estado.novas = new Set(novas.map((i) => i.id));
    toast(novas.length
      ? `${plural(novas.length, 'ideia nova', 'ideias novas')} de ${t?.nome ?? tipo} no Banco de Ideias`
      : 'A IA não devolveu nenhuma ideia. Tente de novo.');
  } catch (e) {
    toast(`Não deu pra gerar as ideias: ${e.message}`);
  } finally {
    clearInterval(relogio);
    relogio = null;
    estado.gerando = null;
    try { await recarregar(); } catch { redesenhar(); }
  }
}

// ── Favoritar ────────────────────────────────────────────────────────────
async function favoritar(id, reabrir = false) {
  const i = ideia(id);
  if (!i) return;
  try {
    await api('PUT', `/api/ideias/${id}`, { favorita: !i.favorita });
    await recarregar();
    if (reabrir) abrirIdeia(id);
    toast(i.favorita ? 'Saiu das favoritas' : 'Foi pras favoritas');
  } catch (e) { toast(e.message); }
}

// ── Painel da ideia ──────────────────────────────────────────────────────
const temRoteiro = (rb) => Boolean(rb && ['hook', 'textoTela', 'narracao', 'cta'].some((k) => String(rb[k] ?? '').trim()));

function textoRoteiro(i) {
  const rb = i.roteiroBase ?? {};
  const t = tipoReel(i.tipo);
  const f = formato(i.formatoId);
  const bloco = (titulo, corpo) => (String(corpo ?? '').trim() ? [titulo, String(corpo).trim(), ''] : []);
  return [
    `ROTEIRO BASE: ${i.titulo}`,
    [t?.nome, i.tema ? nomeTema(i.tema) : '', f ? `Formato ${f.codigo} · ${f.nome}` : ''].filter(Boolean).join(' · '),
    '',
    ...bloco('HOOK', rb.hook),
    ...bloco('TEXTO DE TELA', rb.textoTela),
    ...bloco('NARRAÇÃO', rb.narracao),
    ...bloco('CTA', rb.cta),
    ...bloco('FONTES', (i.fontes ?? []).filter(Boolean).map((x) => `- ${x}`).join('\n')),
  ].join('\n').trim();
}

function temaHtml(i) {
  const tm = temaDo(i.tema);
  if (!tm) {
    return i.tema
      ? `<p class="ide-mudo">Tema "${esc(nomeTema(i.tema))}": ainda sem ficha de fatos no mapa do nicho. Confira os números nas fontes da ideia.</p>`
      : '<p class="ide-mudo">Sem tema. Escolha um em "Editar".</p>';
  }
  const fatos = (tm.fatos ?? []).filter(Boolean);
  const fontes = (tm.fontes ?? []).filter(Boolean);
  return `
    <div class="card ide-tema-card">
      <div class="ide-tema-topo">
        <strong>${esc(tm.nome)}</strong>
        <span class="ide-tema-pills">${tm.publico ? `<span class="pill">${esc(tm.publico)}</span>` : ''}</span>
      </div>
      ${tm.dor ? `<p class="ide-tema-dor"><span class="ide-rotulo">A dor</span>${esc(tm.dor)}</p>` : ''}
      ${fatos.length ? `
      <div class="ide-tema-bloco">
        <span class="ide-rotulo">Fatos do tema</span>
        <ul class="ide-fatos">${fatos.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      </div>` : ''}
      ${fontes.length ? `
      <div class="ide-tema-bloco">
        <span class="ide-rotulo">Fontes dos fatos</span>
        <ol class="ide-fontes ide-fontes-tema">${fontes.map((x) => `<li>${fonteComLink(x)}</li>`).join('')}</ol>
      </div>` : ''}
      ${tm.sazonal ? `<p class="ide-tema-quando">${icone('calendario', 14)}<span>${esc(tm.sazonal)}</span></p>` : ''}
    </div>`;
}

function abrirIdeia(id) {
  const i = ideia(id);
  if (!i) return;
  const f = formato(i.formatoId);
  const t = tipoReel(i.tipo);
  const r = i.reelId ? reel(i.reelId) : null;
  const fontes = (i.fontes ?? []).filter(Boolean);
  const rb = i.roteiroBase ?? {};
  const comRoteiro = temRoteiro(rb);
  const temNumero = /\d/.test(`${i.titulo} ${i.descricao} ${i.gancho} ${Object.values(rb).join(' ')}`);

  const p = abrirPainel(`
    <div class="painel-topo">
      <div>
        <div class="ide-painel-pills">${pillsHtml(i, f, { origem: true })}</div>
        <h2>${esc(i.titulo)}</h2>
      </div>
      <button class="btn-icone ide-fav-painel${i.favorita ? ' ativo' : ''}" data-favoritar aria-pressed="${!!i.favorita}"
        aria-label="${i.favorita ? 'Tirar dos favoritos' : 'Favoritar'}">${icone(i.favorita ? 'estrela-cheia' : 'estrela', 18)}</button>
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo ide-painel">
      ${comRoteiro ? `
      <div class="bloco">
        <div class="bloco-titulo">Roteiro base<button class="btn btn-sm" data-copiar-roteiro>${icone('copiar', 14)} Copiar roteiro base</button></div>
        <div class="card ide-roteiro">
          ${rb.hook ? `<div class="ide-rb-linha"><span class="ide-rotulo">Hook</span><p class="ide-rb-hook">${esc(rb.hook)}</p></div>` : ''}
          ${rb.textoTela ? `<div class="ide-rb-linha"><span class="ide-rotulo">Texto de tela</span><span class="ide-rb-tela">${esc(rb.textoTela)}</span></div>` : ''}
          ${rb.narracao ? `<div class="ide-rb-linha"><span class="ide-rotulo">Narração</span><p class="ide-rb-narracao">${esc(rb.narracao)}</p></div>` : ''}
          ${rb.cta ? `<div class="ide-rb-linha ide-rb-cta"><span class="ide-rotulo">CTA</span><p>${esc(rb.cta)}</p></div>` : ''}
        </div>
      </div>` : i.gancho ? `
      <div class="bloco">
        <div class="bloco-titulo">Gancho</div>
        <blockquote class="ide-gancho">${esc(i.gancho)}</blockquote>
      </div>` : ''}

      ${i.estiloGancho || (comRoteiro && i.gancho && i.gancho !== rb.hook) ? `
      <div class="bloco">
        <div class="bloco-titulo">Estilo do gancho</div>
        <div class="ide-estilo-gancho">
          ${t ? `<span class="ide-estilo-ico" title="${esc(t.nome)}">${icone(t.icone, 16)}</span>` : ''}
          <div>
            ${i.estiloGancho ? `<p>${esc(i.estiloGancho)}</p>` : ''}
            ${comRoteiro && i.gancho && i.gancho !== rb.hook ? `<p class="ide-mudo">Gancho sugerido: "${esc(i.gancho)}"</p>` : ''}
          </div>
        </div>
      </div>` : ''}

      ${i.descricao ? `<div class="bloco"><div class="bloco-titulo">A ideia</div><p class="ide-descricao">${esc(i.descricao)}</p></div>` : ''}

      ${String(i.notas ?? '').trim() ? `
      <div class="bloco">
        <div class="bloco-titulo">Agenda e cuidados</div>
        <p class="ide-notas">${icone('calendario', 14)}<span>${esc(i.notas)}</span></p>
      </div>` : ''}

      <div class="bloco">
        <div class="bloco-titulo">Formato</div>
        ${f ? `
        <a class="card card-link ide-formato" href="#/biblioteca/${esc(f.id)}" data-ir-formato>
          <span class="ide-formato-cod">${esc(f.codigo)}</span>
          <span class="ide-formato-txt">
            <strong>${esc(f.nome)}</strong>
            <small>${esc(f.formula)}</small>
            <span class="ide-formato-selo">${seloFormato(f)}</span>
          </span>
        </a>` : '<p class="ide-mudo">Sem formato ainda. Escolha um em "Editar".</p>'}
      </div>

      <div class="bloco">
        <div class="bloco-titulo">Tema</div>
        ${temaHtml(i)}
      </div>

      <div class="bloco">
        <div class="bloco-titulo">Fontes da ideia</div>
        ${fontes.length
          ? `<ul class="ide-fontes">${fontes.map((x) => `<li>${fonteComLink(x)}</li>`).join('')}</ul>`
          : temNumero
            ? '<span class="selo em-teste">! Tem número sem fonte. Coloque a fonte antes de virar reel.</span>'
            : '<p class="ide-mudo">Sem número, sem fonte necessária.</p>'}
      </div>

      ${i.referencia?.permalink ? `
      <div class="bloco">
        <div class="bloco-titulo">Referência</div>
        <a class="ide-ref" href="${esc(i.referencia.permalink)}" target="_blank" rel="noopener">
          ${icone('instagram', 16)} Reel de @${esc(i.referencia.conta ?? 'conta')} ${icone('link', 14)}
        </a>
      </div>` : ''}

      ${i.reelId ? `
      <div class="bloco">
        <div class="bloco-titulo">Reel vinculado</div>
        ${r ? `
        <button class="card card-link ide-reel" data-reel="${esc(r.id)}">
          <strong>${esc(r.ideia)}</strong>
          <span class="pill ${r.status === 'publicado' ? 'pill-ok' : ''}">${esc(r.status)}</span>
          ${r.data ? `<span class="ide-mudo">${esc(new Date(r.data + 'T12:00').toLocaleDateString('pt-BR'))}</span>` : ''}
        </button>` : '<p class="ide-mudo">O reel vinculado foi excluído do cronograma.</p>'}
      </div>` : ''}
    </div>
    <div class="painel-rodape">
      <button class="btn btn-primario" data-criar>${icone('raio', 16)} Criar reel com esta ideia</button>
      <button class="btn" data-editar>${icone('editar', 16)} Editar</button>
      <span class="ide-espaco"></span>
      <button class="btn btn-fantasma btn-perigo" data-excluir>${icone('lixo', 16)} Excluir</button>
    </div>
  `);
  if (!p) return;
  p.querySelectorAll('[data-fechar]').forEach((b) => (b.onclick = fecharPainel));
  $('[data-favoritar]', p).onclick = () => favoritar(i.id, true);
  $('[data-criar]', p).onclick = () => abrirCriar({ formatoId: i.formatoId || '', ideiaId: i.id, tipo: tipoReel(i.tipo) ? i.tipo : '' });
  $('[data-editar]', p).onclick = () => abrirForm(i);
  const copiar = $('[data-copiar-roteiro]', p);
  if (copiar) copiar.onclick = async () => {
    try {
      await navigator.clipboard.writeText(textoRoteiro(ideia(i.id) ?? i));
      toast('Roteiro base copiado');
    } catch { toast('Não consegui copiar. Selecione o texto e copie na mão.'); }
  };
  $('[data-excluir]', p).onclick = async () => {
    if (!confirm(`Excluir a ideia "${i.titulo}"?`)) return;
    try {
      await api('DELETE', `/api/ideias/${i.id}`);
      fecharPainel();
      await recarregar();
      toast('Ideia excluída');
    } catch (e) { toast(e.message); }
  };
  const irFormato = $('[data-ir-formato]', p);
  if (irFormato) irFormato.onclick = () => fecharPainel();
  const btnReel = $('[data-reel]', p);
  if (btnReel) btnReel.onclick = () => abrirDetalhe(btnReel.dataset.reel);
}

// ── Formulário: nova ideia e edição ──────────────────────────────────────
function opcoesFormato(atual) {
  const grupos = agruparPorCategoria(store.E.formatos ?? []);
  return `<option value="">Escolher depois</option>` + grupos.map((g) => `
    <optgroup label="${esc(`${g.num} · ${g.nome}`)}">
      ${g.itens.map((f) => `<option value="${esc(f.id)}" ${f.id === atual ? 'selected' : ''}>${esc(f.codigo)} ${esc(f.nome)}${f.status === 'validado' ? ' ✓' : ''}</option>`).join('')}
    </optgroup>`).join('');
}

function problemaDeCopy(texto, fontes) {
  if (/[\u2013\u2014]/.test(texto)) return 'Tire o travessão. Use vírgula, ponto ou dois-pontos.';
  if (/Legaliza[ie](?![a-zà-ú])/i.test(texto)) return 'A grafia é "Legalizaí", com acento no i.';
  if (/\d/.test(texto) && !fontes.length) return 'Tem número no texto: coloque a fonte.';
  return '';
}

function abrirForm(i = null) {
  const tipoAtual = i ? (tipoReel(i.tipo) ? i.tipo : '') : tipoReel(estado.filtro) ? estado.filtro : '';
  const temaAtual = i ? (temaDo(i.tema)?.id ?? i.tema ?? '') : estado.tema;
  const rb = i?.roteiroBase ?? {};
  const p = abrirPainel(`
    <div class="painel-topo">
      <div>
        <h2>${i ? 'Editar ideia' : 'Nova ideia'}</h2>
        <p>Um tema do nicho, um estilo e um formato. Número só com fonte.</p>
      </div>
      ${BTN_FECHAR}
    </div>
    <form class="painel-corpo ide-form" id="ide-form" novalidate>
      <label class="rotulo">Título
        <input class="campo" name="titulo" required maxlength="160" value="${esc(i?.titulo)}" placeholder="Ex.: Ninguém comemora a primeira nota fiscal" />
      </label>
      <div class="ide-form-linha ide-form-3">
        <label class="rotulo">Estilo
          <select class="campo" name="tipo" required>
            <option value="" ${tipoAtual ? '' : 'selected'} disabled>Escolha o estilo</option>
            ${TIPOS.map((t) => `<option value="${t.id}" ${tipoAtual === t.id ? 'selected' : ''}>${esc(t.nome)}</option>`).join('')}
          </select>
        </label>
        <label class="rotulo">Tema
          <select class="campo" name="tema" required>
            <option value="" ${temaAtual ? '' : 'selected'} disabled>Escolha o tema</option>
            ${opcoesTema(temaAtual, { extra: i?.tema })}
          </select>
        </label>
        <label class="rotulo">Formato
          <select class="campo" name="formatoId">${opcoesFormato(i?.formatoId)}</select>
        </label>
      </div>
      <label class="rotulo">Descrição
        <textarea class="campo" name="descricao" rows="3" placeholder="2 ou 3 frases: do que o reel fala, como grava e por que prende">${esc(i?.descricao)}</textarea>
      </label>
      <div class="ide-form-linha">
        <label class="rotulo">Gancho
          <textarea class="campo" name="gancho" rows="2" placeholder="A primeira frase do reel">${esc(i?.gancho)}</textarea>
        </label>
        <label class="rotulo">Estilo do gancho
          <textarea class="campo" name="estiloGancho" rows="2" placeholder="Família do banco de ganchos, ex.: Gatilhos de Identificação">${esc(i?.estiloGancho)}</textarea>
        </label>
      </div>
      <fieldset class="ide-form-grupo">
        <legend>Roteiro base <small>opcional</small></legend>
        <label class="rotulo">Hook falado
          <textarea class="campo" name="rb.hook" rows="2" placeholder="O que se fala nos primeiros 3 segundos">${esc(rb.hook)}</textarea>
        </label>
        <label class="rotulo">Texto de tela
          <input class="campo" name="rb.textoTela" maxlength="120" value="${esc(rb.textoTela)}" placeholder="CAIXA ALTA, curto, chama pra legenda" />
        </label>
        <label class="rotulo">Narração
          <textarea class="campo" name="rb.narracao" rows="5" placeholder="Palavra por palavra, como vai ser falado">${esc(rb.narracao)}</textarea>
        </label>
        <label class="rotulo">CTA
          <textarea class="campo" name="rb.cta" rows="2" placeholder="Viralização e Conexão: engajamento. Vendas: lista de espera pelo link da bio">${esc(rb.cta)}</textarea>
        </label>
      </fieldset>
      <label class="rotulo">Agenda e cuidados
        <textarea class="campo" name="notas" rows="2" placeholder="Quando publicar, o que fica pra outra peça, o que não entra na fala">${esc(i?.notas)}</textarea>
      </label>
      <label class="rotulo">Fontes
        <textarea class="campo" name="fontes" rows="2" placeholder="Uma por linha. Obrigatório se tiver número">${esc((i?.fontes ?? []).join('\n'))}</textarea>
      </label>
      <p class="ide-form-erro" id="ide-form-erro" role="alert" hidden></p>
    </form>
    <div class="painel-rodape">
      <button class="btn btn-primario" type="submit" form="ide-form">${i ? 'Salvar' : 'Criar ideia'}</button>
      <button class="btn btn-fantasma" type="button" data-cancelar>Cancelar</button>
    </div>
  `);
  if (!p) return;
  p.querySelectorAll('[data-fechar]').forEach((b) => (b.onclick = fecharPainel));
  $('[data-cancelar]', p).onclick = i ? () => abrirIdeia(i.id) : fecharPainel;
  const form = $('#ide-form', p);
  const erro = $('#ide-form-erro', p);
  $('[name="titulo"]', p).focus();

  form.onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const txt = (k) => String(d[k] ?? '').trim();
    const fontes = txt('fontes').split('\n').map((s) => s.trim()).filter(Boolean);
    const avisar = (msg) => { erro.textContent = msg; erro.hidden = false; erro.scrollIntoView({ block: 'nearest' }); };
    const roteiroBase = { hook: txt('rb.hook'), textoTela: txt('rb.textoTela'), narracao: txt('rb.narracao'), cta: txt('rb.cta') };
    if (!txt('titulo')) return avisar('Dê um título pra ideia.');
    if (!tipoReel(d.tipo)) return avisar('Escolha o estilo da ideia.');
    if (!txt('tema')) return avisar('Escolha o tema da ideia.');
    const problema = problemaDeCopy([d.titulo, d.descricao, d.gancho, d.estiloGancho, d.notas, ...Object.values(roteiroBase)].join('\n'), fontes);
    if (problema) return avisar(problema);
    if (d.tipo !== 'vendas' && /link da bio|lista de espera/i.test(roteiroBase.cta))
      return avisar(`${tipoReel(d.tipo).nome} não leva pra lista: a CTA é de engajamento (comentar, mandar, salvar, seguir).`);
    erro.hidden = true;

    const f = formato(d.formatoId);
    const corpo = {
      titulo: txt('titulo'),
      descricao: txt('descricao'),
      tipo: d.tipo,
      tema: txt('tema'),
      formatoId: d.formatoId || null,
      publico: temaDo(d.tema)?.publico ?? i?.publico ?? f?.publico ?? 'MEI + ME',
      gancho: txt('gancho'),
      estiloGancho: txt('estiloGancho'),
      roteiroBase: temRoteiro(roteiroBase) ? roteiroBase : null,
      notas: txt('notas'),
      fontes,
    };
    const botao = p.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
      if (i) {
        await api('PUT', `/api/ideias/${i.id}`, corpo);
        await recarregar();
        abrirIdeia(i.id);
        toast('Ideia salva');
      } else {
        const nova = await api('POST', '/api/ideias', {
          ...corpo, origem: 'manual', referencia: null, favorita: false, reelId: null, criadaEm: new Date().toISOString(),
        });
        await recarregar();
        if (nova?.id && ideia(nova.id)) abrirIdeia(nova.id);
        else fecharPainel();
        toast('Ideia criada');
      }
    } catch (err) {
      botao.disabled = false;
      avisar(err.message);
    }
  };
}
