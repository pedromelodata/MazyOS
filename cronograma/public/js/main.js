// Casca do app: menu lateral, roteador por hash, tema e gaveta no celular.
// Cada vista é um módulo com render(root, params); o painel lateral é do core.
import { $, $$, esc, store, api, recarregar, aoMudar, fecharPainel, icone, lerLocal, gravarLocal, toast, reel, irParaEntrar } from './core.js';
import * as home from './views/home.js';
import * as cronograma from './views/cronograma.js';
import * as ideias from './views/ideias.js';
import * as biblioteca from './views/biblioteca.js';
import * as instagram from './views/instagram.js';
import * as campanha from './views/campanha.js';
import * as chat from './chat.js';
import * as detalhe from './detalhe.js';
import * as conta from './conta.js';
import { iniciarEfeitos, entrarVista, medirAtivo, posicionarIndicador, esqueletoPagina } from './efeitos.js';

// import * em vez de { render }: se um módulo ainda não exporta o nome, só aquela tela falha
const VIEWS = { home, cronograma, ideias, biblioteca, instagram, campanha };

const HANDLE_PADRAO = 'legalizai.app';
const PRODUTO = 'Gestão de Marketing';

const TITULOS = {
  home: 'Início', cronograma: 'Cronograma', ideias: 'Banco de Ideias',
  biblioteca: 'Biblioteca de Reels', metricas: 'Métricas', inspiracoes: 'Inspirações', campanha: 'Pré-lançamento',
};

const MENU = [
  { secao: 'Geral', itens: [
    { id: 'home', href: '#/', icone: 'casa', nome: 'Início' },
    { id: 'cronograma', href: '#/cronograma', icone: 'calendario', nome: 'Cronograma' },
    { id: 'ideias', href: '#/ideias', icone: 'lampada', nome: 'Banco de Ideias' },
  ] },
  { secao: 'Bibliotecas', itens: [
    { id: 'biblioteca', href: '#/biblioteca', icone: 'livro', nome: 'Biblioteca de Reels' },
  ] },
  { secao: 'Instagram', instagram: true, itens: [
    { id: 'metricas', href: '#/instagram/metricas', icone: 'grafico', nome: 'Métricas' },
    { id: 'inspiracoes', href: '#/instagram/inspiracoes', icone: 'bussola', nome: 'Inspirações' },
  ] },
  { secao: 'Campanha', itens: [
    { id: 'campanha', href: '#/campanha', icone: 'alvo', nome: 'Pré-lançamento', contador: true },
  ] },
];

// ── Rotas ────────────────────────────────────────────────────────────────
const LEGADO_V1 = { cronograma: '#/cronograma', formatos: '#/biblioteca', campanhas: '#/campanha', radar: '#/instagram/metricas', criar: '#/criar' };

const rotaDe = (view, menu, params = {}, overlay = null) => ({ view, menu, params, overlay });
const decodificar = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

function lerRota() {
  const h = location.hash;
  if (h && h !== '#' && !h.startsWith('#/')) {
    const s = h.slice(1);
    history.replaceState(null, '', s.startsWith('reel=') ? '#/reel/' + s.slice(5) : LEGADO_V1[s] ?? '#/');
  }
  const caminho = location.hash.replace(/^#\/?/, '').split('?')[0];
  const p = caminho.split('/').filter(Boolean).map(decodificar);
  switch (p[0] ?? '') {
    case '': return rotaDe('home', 'home');
    case 'cronograma': return rotaDe('cronograma', 'cronograma');
    case 'ideias': return rotaDe('ideias', 'ideias');
    case 'conteudos': // tela retirada em 23/09: link antigo cai no cronograma
      history.replaceState(null, '', '#/cronograma');
      return rotaDe('cronograma', 'cronograma');
    case 'biblioteca': return rotaDe('biblioteca', 'biblioteca', p[1] ? { id: p[1] } : {});
    case 'instagram': {
      const aba = p[1] === 'inspiracoes' ? 'inspiracoes' : 'metricas';
      return rotaDe('instagram', aba, { aba });
    }
    case 'campanha': return rotaDe('campanha', 'campanha');
    case 'reel': return rotaDe('cronograma', 'cronograma', {}, p[1] ? { tipo: 'reel', id: p[1] } : null);
    case 'criar': return rotaDe('home', 'home', {}, { tipo: 'criar' });
    default:
      history.replaceState(null, '', '#/');
      return rotaDe('home', 'home');
  }
}

let rota = lerRota();
let erroCarga = null;

// ── Tema ─────────────────────────────────────────────────────────────────
function temaInicial() {
  try {
    const q = new URLSearchParams(location.search).get('tema');
    if (q === 'claro' || q === 'light') return 'light';
    if (q === 'escuro' || q === 'dark') return 'dark';
  } catch {}
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function aplicarTema(t, gravar = false) {
  const tema = t === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = tema;
  store.ui.tema = tema;
  if (gravar) gravarLocal('cronograma-tema', tema);
}

// ── Sidebar ──────────────────────────────────────────────────────────────
// fixa (padrão) = menu inteiro; solta = trilho de ícones que abre por cima no hover/foco (só desktop)
let sidebarFixa = lerLocal('gm-sidebar-fixa') !== '0';

const dicaFixar = () => (sidebarFixa ? 'Menu fixo: clique pra recolher em ícones' : 'Fixar o menu aberto');

function aplicarSidebar() {
  document.documentElement.dataset.sidebar = sidebarFixa ? 'fixa' : 'solta';
}

function alternarSidebar() {
  sidebarFixa = !sidebarFixa;
  gravarLocal('gm-sidebar-fixa', sidebarFixa ? '1' : '0');
  aplicarSidebar();
  const b = $('#sidebar [data-shell="fixar"]');
  if (!b) return;
  b.setAttribute('aria-pressed', String(sidebarFixa));
  b.title = dicaFixar();
  $$('#sidebar .sb-item').forEach((it) => { if (sidebarFixa) it.removeAttribute('title'); else it.title = it.dataset.nome ?? ''; });
}

const chaveMes = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

function diasAte(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return null;
  const h = new Date();
  return Math.round((new Date(+m[1], +m[2] - 1, +m[3]) - new Date(h.getFullYear(), h.getMonth(), h.getDate())) / 86400000);
}

function textoDias(n) {
  if (n == null) return '';
  if (n < 0) return 'encerrada';
  if (n === 0) return 'último dia';
  return n === 1 ? '1 dia' : `${n} dias`;
}

function itemHtml(it, extra = '') {
  const ativo = rota.menu === it.id;
  if (it.emBreve) {
    return `
      <span class="sb-item desabilitado" aria-disabled="true" title="${esc(it.nome)}: em breve" data-nome="${esc(it.nome)}: em breve">
        <span class="sb-ico">${icone(it.icone)}</span>
        <span class="sb-texto">${esc(it.nome)}<small>${icone('cadeado', 12)}em breve</small></span>
      </span>`;
  }
  return `
    <a class="sb-item${ativo ? ' ativo' : ''}" href="${it.href}"${ativo ? ' aria-current="page"' : ''} data-nome="${esc(it.nome)}"${sidebarFixa ? '' : ` title="${esc(it.nome)}"`}>
      <span class="sb-ico">${icone(it.icone)}</span>
      <span class="sb-texto">${esc(it.nome)}</span>
      ${extra}
    </a>`;
}

function renderSidebar() {
  const E = store.E;
  const ig = E?.instagram ?? {};
  const cmp = E?.campanhas?.find((c) => c.id === 'cmp_prelancamento') ?? E?.campanhas?.[0];
  const dias = diasAte(cmp?.fim);
  const hoje = new Date();
  const noMes = (E?.reels ?? []).filter((r) => r.data?.startsWith(chaveMes(hoje))).length;
  const meta = Number(E?.config?.metaMensal) || 12;
  const pct = Math.min(100, Math.round((noMes / meta) * 100));
  const faltam = Math.max(0, meta - noMes);
  const nomeMes = hoje.toLocaleDateString('pt-BR', { month: 'long' });
  // a conta oficial aparece mesmo antes de conectar; conectado, vale o que a API devolveu
  const handle = (ig.conectado && ig.conta?.username) || E?.config?.handleInstagram || HANDLE_PADRAO;
  const escuro = store.ui.tema !== 'light';
  menuContaAberto = false;

  const secoes = MENU.map((s) => {
    const ponto = s.instagram && ig.conectado
      ? `<i class="ponto-ig" title="${esc(handle ? `Conectado como @${handle}` : 'Conectado')}"></i><span class="sr-only">conectado</span>`
      : '';
    const itens = s.itens.map((it) => {
      if (it.contador && dias != null) return itemHtml({ ...it, nome: cmp?.nome || it.nome }, `<span class="sb-contador${dias < 0 ? ' encerrada' : ''}">${textoDias(dias)}</span>`);
      return itemHtml(it);
    }).join('');
    return `<div class="sb-secao"><div class="sb-rotulo">${esc(s.secao)}${ponto}</div>${itens}</div>`;
  }).join('');

  // onde o item ativo estava: o indicador sai dali e desliza até o novo
  const antes = medirAtivo($('#sidebar .sb-nav'));
  $('#sidebar').innerHTML = `
    <div class="sb-topo">
      <a class="sb-marca" href="#/" aria-label="Legalizaí, início">
        <img src="/simbolo.svg" alt="" width="32" height="32" />
        <span><strong>legalizaí</strong><small>gestão de marketing</small></span>
      </a>
      <button class="btn-icone btn-sm sb-fixar" data-shell="fixar" aria-pressed="${sidebarFixa}" aria-label="Fixar menu" title="${dicaFixar()}">${icone('alfinete', 16)}</button>
      <button class="btn-icone sb-fechar" data-shell="fechar-menu" aria-label="Fechar menu">${icone('fechar')}</button>
    </div>
    <button class="btn btn-primario sb-novo" data-shell="novo-reel" aria-label="Novo reel" title="Novo reel">${icone('mais', 18)}<span class="sb-novo-texto">Novo reel</span></button>
    <nav class="sb-nav" aria-label="Seções">${secoes}</nav>
    <div class="sb-rodape">
      <div class="sb-meta">
        <div class="sb-meta-topo"><span>Reels do mês</span><b>${noMes}<small>/${meta}</small></b></div>
        <div class="progresso" role="progressbar" aria-label="Reels do mês" aria-valuemin="0" aria-valuemax="${meta}" aria-valuenow="${noMes}"><i style="width:${pct}%"></i></div>
        <small class="sb-meta-nota">${faltam ? `Faltam ${faltam} pra meta de ${esc(nomeMes)}` : `Meta de ${esc(nomeMes)} batida`}</small>
      </div>
      <div class="sb-conta">
        ${chipConta(E, ig, handle)}
        <button class="btn-icone" data-shell="tema" aria-label="${escuro ? 'Mudar pro tema claro' : 'Mudar pro tema escuro'}" title="${escuro ? 'Tema claro' : 'Tema escuro'}">${icone(escuro ? 'sol' : 'lua')}</button>
      </div>
    </div>`;
  posicionarIndicador($('#sidebar .sb-nav'), antes);
}

// ── Conta logada (chip do rodapé + menu) ─────────────────────────────────
let menuContaAberto = false;

function chipConta(E, ig, handle) {
  const u = store.usuario;
  if (!u) {
    // servidor sem login (versão antiga): o chip volta a ser só o nome da config
    const nome = E?.config?.nomeUsuario || 'Pedro';
    return `
      <span class="avatar" aria-hidden="true">${esc(nome.trim()[0]?.toUpperCase() ?? 'P')}</span>
      <span class="sb-conta-texto">
        <strong>${esc(nome)}</strong>
        <small title="${ig.conectado ? 'Instagram conectado' : 'Instagram ainda não conectado'}">@${esc(handle)}${ig.conectado ? '' : '<span class="sr-only">, Instagram não conectado</span>'}</small>
      </span>`;
  }
  return `
    <div class="sb-usuario">
      <button class="sb-usuario-btn" type="button" data-shell="conta" aria-haspopup="menu" aria-expanded="false" aria-controls="menu-conta" title="Sua conta">
        <span class="avatar" aria-hidden="true">${esc(u.nome?.trim()[0]?.toUpperCase() ?? '?')}</span>
        <span class="sb-conta-texto">
          <strong>${esc(u.nome)}</strong>
          <small>@${esc(u.usuario)}</small>
        </span>
        <span class="sb-usuario-seta" aria-hidden="true">${icone('chevron-dir', 16)}</span>
      </button>
      <div class="sb-menu" id="menu-conta" role="menu" aria-label="Sua conta" hidden>
        <button type="button" role="menuitem" class="sb-menu-item" data-shell="minha-conta">${icone('usuario', 17)}Minha conta</button>
        <button type="button" role="menuitem" class="sb-menu-item" data-shell="usuarios">${icone('equipe', 17)}Usuários</button>
        <hr />
        <button type="button" role="menuitem" class="sb-menu-item" data-shell="sair">${icone('sair', 17)}Sair</button>
      </div>
    </div>`;
}

function abrirMenuConta(focarItem = false) {
  const menu = $('#menu-conta');
  const btn = $('#sidebar [data-shell="conta"]');
  if (!menu || !btn) return;
  menuContaAberto = true;
  menu.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
  if (focarItem) $('.sb-menu-item', menu)?.focus();
}

function fecharMenuConta(devolverFoco = false) {
  if (!menuContaAberto) return;
  menuContaAberto = false;
  const menu = $('#menu-conta');
  const btn = $('#sidebar [data-shell="conta"]');
  if (menu) menu.hidden = true;
  btn?.setAttribute('aria-expanded', 'false');
  if (devolverFoco) btn?.focus();
}

// ── Gaveta (celular) ─────────────────────────────────────────────────────
function abrirMenu() {
  document.body.classList.add('com-menu');
  $('#veu-menu').hidden = false;
  $('#abrir-menu').setAttribute('aria-expanded', 'true');
  // o Tab fica dentro da gaveta: a tela de trás e a barra do topo saem do foco
  $('#vista').inert = true;
  $('.topo-movel').inert = true;
  ($('#sidebar .sb-item.ativo') ?? $('#sidebar .sb-item'))?.focus({ preventScroll: true });
}

function fecharMenu() {
  if (!document.body.classList.contains('com-menu')) return;
  const foco = document.activeElement;
  document.body.classList.remove('com-menu');
  $('#veu-menu').hidden = true;
  $('#abrir-menu').setAttribute('aria-expanded', 'false');
  $('#vista').inert = false;
  $('.topo-movel').inert = false;
  // Escape, véu ou X: o foco volta pro hambúrguer (a navegação por link foca a #vista depois)
  if (!foco || foco === document.body || $('#sidebar').contains(foco)) $('#abrir-menu').focus({ preventScroll: true });
}

// troca só o botão de tema: redesenhar a sidebar destruiria o botão com foco
function atualizarBotaoTema() {
  const b = $('#sidebar [data-shell="tema"]');
  if (!b) return;
  const escuro = store.ui.tema !== 'light';
  b.setAttribute('aria-label', escuro ? 'Mudar pro tema claro' : 'Mudar pro tema escuro');
  b.title = escuro ? 'Tema claro' : 'Tema escuro';
  b.innerHTML = icone(escuro ? 'sol' : 'lua');
}

// ── Vista ────────────────────────────────────────────────────────────────
function renderVista() {
  const root = $('#vista');
  root.dataset.vista = rota.view;
  if (erroCarga) {
    root.innerHTML = `
      <div class="card vazio">
        <span class="vazio-ico">${icone('raio', 22)}</span>
        <strong>Não consegui falar com o servidor</strong>
        <p>${esc(erroCarga.message)}. Rode <code>npm start</code> na pasta cronograma e tente de novo.</p>
        <button class="btn btn-primario" data-shell="tentar">Tentar de novo</button>
      </div>`;
    return;
  }
  if (!store.E) {
    root.innerHTML = esqueletoPagina();
    return;
  }
  const v = VIEWS[rota.view];
  try {
    if (typeof v?.render !== 'function') throw new Error(`views/${rota.view}.js ainda não exporta render()`);
    v.render(root, { ...rota.params });
  } catch (e) {
    console.error(e);
    root.innerHTML = `
      <div class="card vazio">
        <span class="vazio-ico">${icone('fechar', 22)}</span>
        <strong>Esta tela não abriu</strong>
        <p>${esc(e.message)}</p>
        <button class="btn" data-shell="tentar">Tentar de novo</button>
      </div>`;
  }
}

function renderTudo() {
  renderSidebar();
  renderVista();
}

function abrirOverlay(ov) {
  if (!ov || !store.E) return;
  if (ov.tipo === 'reel') {
    if (!reel(ov.id)) {
      toast('Não achei esse reel');
      history.replaceState(null, '', '#/cronograma');
      return;
    }
    if (typeof detalhe.abrirDetalhe === 'function') detalhe.abrirDetalhe(ov.id);
  } else if (ov.tipo === 'criar') {
    novoReel();
  }
}

function novoReel() {
  fecharMenu();
  if (typeof chat.abrirCriar === 'function') chat.abrirCriar();
  else toast('O criador de reels ainda não carregou');
}

function aoNavegar() {
  const antes = rota;
  rota = lerRota();
  fecharMenu();
  // hash com pedido (#/ideias?abrir=, #/biblioteca?estilo=) redesenha mesmo na mesma vista: é a view que lê e limpa o pedido
  const comPedido = location.hash.includes('?');
  const mesmaVista = !comPedido && antes.view === rota.view && JSON.stringify(antes.params) === JSON.stringify(rota.params);
  const painel = document.getElementById('painel');
  if (!rota.overlay && painel && !painel.hidden) fecharPainel();
  document.title = `${TITULOS[rota.menu] ?? 'Início'} · ${PRODUTO}`;
  renderSidebar();
  if (!mesmaVista) {
    renderVista();
    window.scrollTo(0, 0);
    if (!rota.overlay) $('#vista').focus({ preventScroll: true });
    if (store.E && !erroCarga) entrarVista($('#vista'));
  }
  abrirOverlay(rota.overlay);
}

// sem sessão (ou com senha temporária) o app nem desenha: vai pra /entrar
async function conferirSessao() {
  if (store.usuario) return true;
  let est;
  try {
    est = await api('GET', '/api/auth/estado');
  } catch (e) {
    // servidor antigo, sem login: segue sem conta (o chip mostra o nome da config)
    if (e.status === 404) return true;
    throw e;
  }
  if (!est.logado || !est.usuario) { irParaEntrar(); return false; }
  if (est.usuario.trocarSenha) { irParaEntrar({ trocar: true }); return false; }
  store.usuario = est.usuario;
  return true;
}

async function carregar() {
  erroCarga = null;
  try {
    if (!(await conferirSessao())) return;
    await recarregar();
    entrarVista($('#vista'));
    abrirOverlay(rota.overlay);
  } catch (e) {
    erroCarga = e;
    renderTudo();
  }
}

// ── Eventos ──────────────────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const alvo = e.target instanceof Element ? e.target.closest('[data-shell]') : null;
  if (!alvo) {
    if (!(e.target instanceof Element && e.target.closest('#menu-conta'))) fecharMenuConta();
    if (e.target instanceof Element && e.target.closest('#sidebar .sb-item')) fecharMenu();
    return;
  }
  const acao = alvo.dataset.shell;
  if (acao !== 'conta') fecharMenuConta();
  if (acao === 'conta') { if (menuContaAberto) fecharMenuConta(); else abrirMenuConta(e.detail === 0); }
  else if (acao === 'minha-conta') { fecharMenu(); conta.abrirMinhaConta(); }
  else if (acao === 'usuarios') {
    fecharMenu();
    // o painel se chama Usuários; abrirEquipe é o nome antigo do mesmo painel
    const abrir = conta.abrirUsuarios ?? conta.abrirEquipe;
    if (typeof abrir === 'function') abrir();
    else toast('O painel de usuários ainda não carregou');
  }
  else if (acao === 'sair') conta.sair();
  else if (acao === 'novo-reel') novoReel();
  else if (acao === 'fixar') alternarSidebar();
  else if (acao === 'tema') { aplicarTema(store.ui.tema === 'light' ? 'dark' : 'light', true); atualizarBotaoTema(); }
  else if (acao === 'fechar-menu') fecharMenu();
  else if (acao === 'tentar') { if (erroCarga || !store.E) { erroCarga = null; renderVista(); carregar(); } else renderVista(); }
});

document.addEventListener('keydown', (e) => {
  if (menuContaAberto) {
    if (e.key === 'Escape') { e.stopPropagation(); fecharMenuConta(true); return; }
    const itens = $$('#menu-conta .sb-menu-item');
    const i = itens.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const d = e.key === 'ArrowDown' ? 1 : -1;
      itens[(i + d + itens.length) % itens.length]?.focus();
      return;
    }
    if (e.key === 'Tab' && i >= 0) fecharMenuConta();
  }
  if (e.key === 'Escape' && document.body.classList.contains('com-menu')) fecharMenu();
});

window.addEventListener('hashchange', aoNavegar);

// ── Início ───────────────────────────────────────────────────────────────
aplicarTema(temaInicial());
aplicarSidebar();
$('#abrir-menu').innerHTML = icone('menu', 20);
$('#novo-reel-movel').innerHTML = icone('mais', 20);
$('#abrir-menu').onclick = () => (document.body.classList.contains('com-menu') ? fecharMenu() : abrirMenu());
$('#novo-reel-movel').onclick = novoReel;
$('#veu-menu').onclick = fecharMenu;
// janela que cresce pro desktop com a gaveta aberta não pode deixar a #vista inerte
matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches) fecharMenu(); });
document.title = `${TITULOS[rota.menu] ?? 'Início'} · ${PRODUTO}`;
iniciarEfeitos();

aoMudar(renderTudo);
renderTudo();
window.__cronogramaPronto = true;
carregar();
