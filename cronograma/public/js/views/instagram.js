// Instagram · Métricas (nossa conta) e Inspirações (contas de referência e hashtags do nicho).
// O cache de mídias não vem no /api/estado (SPEC §5): busca /api/instagram/dados uma vez por
// visita à rota e guarda aqui no módulo. O token só sai do campo direto pro POST e nunca volta
// pra tela; mensagens de erro passam por mascarar() por garantia.
import {
  esc, fmtN, fmtRel, fmtData, store, api, recarregar, toast, abrirPainel, fecharPainel,
  BTN_FECHAR, navegar, formato, seloFormato, icone, TIPOS, listaTemas, nomeTema,
  tipoFormato,
} from '../core.js';
import { capa } from '../capa.js';
import { objeto3d, esqueletoCards } from '../efeitos.js';

const LINK_NEGOCIO = 'https://business.facebook.com/settings';
const LINK_USUARIOS_SISTEMA = 'https://business.facebook.com/settings/system-users';
// ads_read: a Meta exige quando a Página chega pelo Gerenciador de Negócios (sempre, no usuário do sistema)
const PERMISSOES = ['instagram_basic', 'instagram_manage_insights', 'pages_show_list', 'pages_read_engagement', 'business_management', 'ads_read'];
// "Virar ideia": a referência entra no banco com um dos 3 estilos e, se quiser, um tema do nicho
const ESTILOS = TIPOS;
const FILTROS = [['todas', 'Todas'], ['acima', ''], ['contas', 'Contas'], ['hashtags', 'Hashtags']];
const METODO = { token: 'por token do Gerenciador de Negócios', oauth: 'pelo login do Facebook', env: 'pelo arquivo .env' };

const cache = { dados: null, carregando: false, erro: '', velho: false };
const ui = { ordem: 'recentes', filtro: 'todas', sincronizando: null, conectando: false, aviso: null, focar: null, ultimoFormato: '', rascunho: {} };
let ultimo = null; // { root, params } da última render: o fetch e as ações redesenham por aqui
let porId = new Map();

addEventListener('hashchange', () => {
  if (location.hash.startsWith('#/instagram')) return;
  cache.velho = true;
  cache.erro = '';
  ui.aviso = null;
});

// ── helpers ──────────────────────────────────────────────────────────────
const limiar = () => store.E?.regraValidacao?.limiarRelativo ?? 1.5;
const https = (u) => (/^https:\/\//i.test(u ?? '') ? u : '');
const mascarar = (s) => String(s ?? '').replace(/\bEA[A-Za-z0-9]{20,}/g, '[token oculto]').replace(/access_token=[^&\s"]+/gi, 'access_token=[oculto]');
const textoErro = (e) => mascarar(typeof e === 'string' ? e : e?.mensagem ?? e?.message ?? e?.erro ?? JSON.stringify(e));
const compacto = (n) => (n == null ? '-' : new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n));
const isoTs = (ts) => String(ts ?? '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2'); // Graph devolve +0000
const ms = (ts) => Date.parse(isoTs(ts)) || 0;
const giro = '<span class="ig-giro" aria-hidden="true"></span>';
const num = (rotulo, valor) => `<div><dt>${rotulo}</dt><dd>${valor}</dd></div>`;

function invalidar() {
  cache.velho = true;
  cache.erro = '';
}

function diaDe(ts) {
  if (!ts) return '';
  const d = new Date(isoTs(ts));
  return Number.isNaN(d.getTime()) ? String(ts).slice(0, 10) : d.toLocaleDateString('sv-SE');
}

function dataCurta(ts) {
  const iso = diaDe(ts);
  if (!iso) return 'sem data';
  return fmtData(iso, { ano: iso.slice(0, 4) !== String(new Date().getFullYear()) });
}

function quando(iso) {
  const d = new Date(iso ?? '');
  if (!iso || Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function mediana(xs) {
  const v = xs.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

function tempoMedio(m) {
  const t = m.avgWatchMs ?? m.tempoMedioMs ?? m.ig_reels_avg_watch_time ?? null;
  return t == null ? '-' : `${(t / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}s`;
}

// o formato exato de `conta` é do backend; aceita os nomes da Graph e os em português
function contaDe(c) {
  if (!c) return null;
  return {
    username: c.username ?? '',
    foto: https(c.profile_picture_url ?? c.foto ?? c.fotoPerfil ?? ''),
    seguidores: c.followers_count ?? c.seguidores ?? null,
    posts: c.media_count ?? c.posts ?? null,
  };
}

const fonteDe = (m) => (m.origem === 'hashtag' ? `#${m.hashtag ?? ''}` : `@${m.conta ?? ''}`);

// capa tipográfica de fallback: a primeira frase da legenda (corta no travessão, que a capa
// imita peça nossa e não pode ter), sem hashtag, menção nem emoji, até ~28 caracteres e sem
// terminar em palavra solta. Os códigos evitam o caractere literal no fonte.
const TRACOS = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}|]`);
const SOLTAS = new Set(['a', 'o', 'as', 'os', 'e', 'é', 'em', 'de', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'num', 'numa', 'um', 'uma', 'uns', 'umas', 'ao', 'aos', 'à', 'às', 'pelo', 'pela', 'pelos', 'pelas', 'pra', 'pras', 'pro', 'pros', 'para', 'com', 'sem', 'por', 'até', 'entre', 'sobre', 'sob', 'contra', 'desde', 'após', 'que', 'quem', 'se', 'ou', 'nem', 'mas', 'como', 'mais', 'seu', 'sua', 'seus', 'suas', 'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'nosso', 'nossa']);
function textoCapa(caption = '') {
  const linha = String(caption ?? '').split('\n')[0]
    .replace(/[#@][\p{L}\p{N}_.]+/gu, '')
    .replace(/\p{Extended_Pictographic}|\u{FE0F}/gu, ' ')
    .split(TRACOS)[0]
    .replace(/\s+/g, ' ').trim();
  const frase = (linha.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? linha).replace(/\.$/, '');
  if (!frase) return '';
  const palavras = [];
  for (const p of frase.split(' ')) {
    if ([...palavras, p].join(' ').length > 28) break;
    palavras.push(p);
  }
  while (palavras.length > 2 && SOLTAS.has(palavras.at(-1).toLowerCase().replace(/[,;:]$/, ''))) palavras.pop();
  const s = palavras.join(' ').replace(/[,;:]$/, '');
  return (s || frase.slice(0, 28)).toUpperCase();
}

const destaqueDe = (tela) => (tela.match(/R\$\s?\d[\d.,]*|\d[\d.,]*\s?%|\d[\d.,]*/) ?? [''])[0];

function capaDe(m, categoria, variante) {
  const daLegenda = textoCapa(m.caption);
  const tela = daLegenda || (m.origem === 'nosso' ? `REEL DE ${dataCurta(m.timestamp)}` : 'SEM LEGENDA');
  return capa({ tela, destaque: daLegenda ? destaqueDe(tela) : '', categoria, variante });
}

const chaveCodigo = (c = '') => {
  const [a, b] = String(c).split('.');
  return [a === 'T' ? 999 : Number(a) || 998, Number(b) || 0];
};

function gruposFormato(lista) {
  const ord = [...lista].sort((x, y) => {
    const [a1, b1] = chaveCodigo(x.codigo), [a2, b2] = chaveCodigo(y.codigo);
    return a1 - a2 || b1 - b2;
  });
  const g = new Map();
  for (const f of ord) {
    const k = f.categoria || 'Outros';
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(f);
  }
  return [...g];
}

// ── dados ────────────────────────────────────────────────────────────────
async function carregarDados() {
  cache.carregando = true;
  cache.velho = false;
  try {
    cache.dados = await api('GET', '/api/instagram/dados');
    cache.erro = '';
  } catch (e) {
    cache.erro = e.message || 'erro desconhecido';
    if (cache.dados) toast(`Não consegui atualizar os dados do Instagram: ${textoErro(cache.erro)}`);
  }
  cache.carregando = false;
  redesenhar();
}

function redesenhar() {
  if (ultimo?.root?.isConnected && location.hash.startsWith('#/instagram')) render(ultimo.root, ultimo.params);
}

async function recarregarTudo() {
  try { await recarregar(); } catch { redesenhar(); }
}

// ── render ───────────────────────────────────────────────────────────────
export function render(root, params = {}) {
  ultimo = { root, params };
  const E = store.E;
  if (!E) { root.innerHTML = '<div class="card vazio"><strong>Carregando…</strong></div>'; return; }
  const aba = params.aba === 'inspiracoes' ? 'inspiracoes' : 'metricas';
  if ((!cache.dados || cache.velho) && !cache.carregando && !cache.erro) carregarDados();

  // redesenho no meio da digitação (fetch voltando, recarregar) não pode roubar o foco
  ui.focar ??= root.contains(document.activeElement) ? document.activeElement.closest?.('.ig-chips')?.dataset.lista ?? null : null;

  const ig = E.instagram ?? {};
  const d = cache.dados ?? {};
  porId = new Map([...(d.proprios ?? []), ...(d.inspiracoes ?? [])].map((m) => [String(m.midiaId), m]));

  root.innerHTML = `
    <div class="ig">
      ${cabecalhoHtml(aba, ig, d)}
      ${avisoHtml()}
      ${errosHtml(ig, d)}
      ${aba === 'metricas' ? metricasHtml(ig, d) : inspiracoesHtml(ig, d)}
    </div>`;
  ligar(root);
}

function cabecalhoHtml(aba, ig, d) {
  const c = contaDe(d.conta ?? ig.conta);
  const status = ig.conectado
    ? `<span class="ig-status on"><i></i>Conectado${c?.username ? ` como @${esc(c.username)}` : ''}</span>`
    : '<span class="ig-status"><i></i>Não conectado</span>';
  return `
    <header class="cabecalho-pagina ig-cabecalho">
      <div>
        <h1>Instagram</h1>
      </div>
      <div class="acoes ig-cabecalho-acoes">
        ${status}
        <div class="segmentado" role="group" aria-label="Seção do Instagram">
          <button type="button" data-aba="metricas" aria-pressed="${aba === 'metricas'}">${icone('grafico', 16)}Métricas</button>
          <button type="button" data-aba="inspiracoes" aria-pressed="${aba === 'inspiracoes'}">${icone('bussola', 16)}Inspirações</button>
        </div>
      </div>
      ${objeto3d(aba === 'metricas' ? 'metricas' : 'inspiracoes')}
    </header>`;
}

function avisoHtml() {
  if (!ui.aviso) return '';
  const ok = ui.aviso.tipo === 'ok';
  return `
    <div class="ig-aviso ${ok ? 'ok' : 'erro'}" role="${ok ? 'status' : 'alert'}">
      <b aria-hidden="true">${ok ? '✓' : '!'}</b>
      <span>${esc(mascarar(ui.aviso.texto))}</span>
      <button type="button" class="btn-icone ig-aviso-x" data-fechar-aviso aria-label="Fechar aviso">${icone('fechar', 14)}</button>
    </div>`;
}

function errosHtml(ig, d) {
  const lista = [...new Set([...(ig.erros ?? []), ...(d.erros ?? [])].map(textoErro).filter(Boolean))];
  if (!lista.length) return '';
  const itens = lista.map((e) => `<li>${esc(e)}</li>`).join('');
  return `
    <div class="ig-alerta" role="status">
      <strong>O Instagram devolveu ${lista.length === 1 ? 'um aviso' : `${lista.length} avisos`} na última leitura</strong>
      ${lista.length > 3 ? `<details><summary>Ver todos</summary><ul>${itens}</ul></details>` : `<ul>${itens}</ul>`}
    </div>`;
}

// conteúdo que depende do /api/instagram/dados: carregando, erro ou o próprio conteúdo
function comDados(fn) {
  if (cache.dados) return fn();
  if (cache.erro) {
    return `
      <div class="card vazio">
        <strong>Não consegui ler os dados do Instagram</strong>
        <p>${esc(textoErro(cache.erro))}</p>
        <button type="button" class="btn btn-sm" data-recarregar-dados>Tentar de novo</button>
      </div>`;
  }
  return `
    <div class="ig-carregando" aria-busy="true">
      <p class="ig-carregando-txt" role="status">${giro}Lendo os dados do Instagram…</p>
      ${esqueletoCards(4)}
    </div>`;
}

// ── Conectar ─────────────────────────────────────────────────────────────
function conectarHtml(ig) {
  const oauth = Boolean(ig.oauthDisponivel);
  return `
    <section class="card ig-conectar">
      <div class="ig-conectar-topo">
        <span class="ig-conectar-icone" aria-hidden="true">${icone('instagram', 28)}</span>
        <div>
          <h2>Conectar o Instagram</h2>
        </div>
      </div>

      <div class="ig-caminhos">
        <article class="ig-caminho recomendado">
          <div class="ig-caminho-topo"><span class="pill pill-marca">Recomendado</span></div>
          <h3>Colar token do Gerenciador de Negócios</h3>
          <ol class="ig-passos">
            <li>Primeiro ponha o app no portfólio: <a href="${LINK_NEGOCIO}" target="_blank" rel="noopener noreferrer">Configurações do negócio</a> → <strong>Contas</strong> → <strong>Apps</strong> → <strong>Adicionar</strong> → <strong>Conectar um ID do app</strong>.
              <small>Sem app? Em developers.facebook.com, <strong>Meus apps</strong> → <strong>Criar app</strong>, tipo Empresa, no portfólio da Legalizaí.</small></li>
            <li>Em <a href="${LINK_USUARIOS_SISTEMA}" target="_blank" rel="noopener noreferrer">Usuários do sistema</a>, crie um com função <strong>Funcionário</strong> (Admin também serve) ou use um que já existe.</li>
            <li>Em <strong>Atribuir ativos</strong>, dê acesso ao app (<strong>Gerenciar app</strong>), à Página do Facebook e à conta do Instagram da Legalizaí.</li>
            <li>Clique em <strong>Gerar novo token</strong>, escolha esse app e a validade <strong>Nunca</strong>. Se a Meta não oferecer, escolha 60 dias e reconecte antes de vencer (a data aparece aqui). Marque: ${PERMISSOES.map((p) => `<code>${p}</code>`).join(' ')}</li>
            <li>Copie o token e cole aqui embaixo.</li>
          </ol>
          <form id="ig-form-token" class="ig-form-token" autocomplete="off">
            <label class="rotulo" for="ig-token">Token de acesso</label>
            <div class="ig-token-linha">
              <input id="ig-token" class="campo" type="password" autocomplete="off" autocapitalize="off" spellcheck="false"
                placeholder="Cole o token aqui" required data-1p-ignore data-lpignore="true" ${ui.conectando ? 'disabled' : ''} />
              <button class="btn btn-primario" ${ui.conectando ? 'disabled aria-busy="true"' : ''}>${ui.conectando ? `${giro}Conectando…` : 'Conectar'}</button>
            </div>
            <small class="ig-seguro">${icone('cadeado', 14)}O token fica só nesta máquina, em <code>data/instagram.json</code>, e nunca aparece na tela.</small>
          </form>
        </article>

        <article class="ig-caminho">
          <div class="ig-caminho-topo"><span class="pill">Alternativa</span></div>
          <h3>Entrar com Facebook</h3>
          ${oauth
            ? `<a class="btn" href="/api/instagram/login">${icone('instagram', 16)}Entrar com Facebook</a>`
            : '<p class="ig-nota">Precisa de um app da Meta: preencha <code>META_APP_ID</code> e <code>META_APP_SECRET</code> no <code>.env</code> da pasta cronograma e reinicie o servidor. Sem isso, use o token.</p>'}
        </article>
      </div>

      <p class="ig-requisito">A conta do Instagram precisa ser profissional (Empresa ou Criador) e estar ligada a uma Página do Facebook.</p>
    </section>`;
}

async function conectarPorToken(e) {
  e.preventDefault();
  const campo = e.currentTarget.querySelector('#ig-token');
  const token = campo.value.trim();
  campo.value = '';
  if (!token || ui.conectando) return;
  ui.conectando = true;
  ui.aviso = null;
  redesenhar();
  let conectou = false;
  try {
    const r = await api('POST', '/api/instagram/token', { token });
    const user = r?.conta?.username ?? r?.username ?? r?.instagram?.conta?.username ?? '';
    ui.aviso = { tipo: 'ok', texto: user ? `Instagram conectado: @${user}. Lendo os reels agora.` : 'Instagram conectado. Lendo os reels agora.' };
    toast(user ? `Conectado como @${user}` : 'Instagram conectado');
    conectou = true;
  } catch (err) {
    ui.aviso = { tipo: 'erro', texto: err.message };
  }
  ui.conectando = false;
  invalidar();
  await recarregarTudo();
  if (conectou) sincronizar('proprios');
}

async function desconectar() {
  if (!confirm('Desconectar o Instagram? O token salvo nesta máquina é apagado. Os números já lidos continuam aqui.')) return;
  try {
    await api('POST', '/api/instagram/desconectar');
    ui.aviso = null;
    toast('Instagram desconectado');
  } catch (e) {
    toast(textoErro(e.message));
  }
  invalidar();
  await recarregarTudo();
}

async function sincronizar(escopo) {
  if (ui.sincronizando) return;
  ui.sincronizando = escopo;
  redesenhar();
  try {
    const r = await api('POST', '/api/instagram/sincronizar', { escopo });
    // a rota devolve o mesmo formato do /dados: aproveita e poupa um GET
    if (Array.isArray(r?.proprios) && Array.isArray(r?.inspiracoes)) { cache.dados = r; cache.erro = ''; cache.velho = false; }
    else invalidar();
    toast(escopo === 'inspiracoes' ? 'Inspirações atualizadas' : 'Métricas atualizadas');
  } catch (e) {
    ui.aviso = { tipo: 'erro', texto: e.message };
    invalidar();
  }
  ui.sincronizando = null;
  await recarregarTudo();
}

// ── Métricas ─────────────────────────────────────────────────────────────
function metricasHtml(ig, d) {
  const proprios = d.proprios ?? [];
  if (!ig.conectado) {
    return conectarHtml(ig) + (proprios.length ? `
      <section class="ig-secao">
        <div class="ig-barra"><h2 class="ig-h2">Última leitura salva <span class="ig-conta-n">${proprios.length}</span></h2></div>
        <div class="ig-grade">${ordenar(proprios).map(cardProprio).join('')}</div>
      </section>` : '');
  }
  return `
    ${contaHtml(ig, d)}
    ${comDados(() => `
      ${kpisHtml(proprios)}
      <section class="ig-secao">
        <div class="ig-barra">
          <h2 class="ig-h2">Reels ${proprios.length ? `<span class="ig-conta-n">${proprios.length}</span>` : ''}</h2>
          ${proprios.length > 1 ? `
          <label class="ig-ordem"><span>Ordenar</span>
            <select class="campo" id="ig-ordem" aria-label="Ordenar reels">
              <option value="recentes" ${ui.ordem === 'recentes' ? 'selected' : ''}>Mais recentes</option>
              <option value="relativo" ${ui.ordem === 'relativo' ? 'selected' : ''}>Maior ×</option>
            </select>
          </label>` : ''}
        </div>
        ${proprios.length
          ? `<div class="ig-grade">${ordenar(proprios).map(cardProprio).join('')}</div>`
          : `<div class="card vazio">${objeto3d('growth')}<strong>Nenhum reel lido ainda</strong><p>Clique em "Sincronizar agora" pra puxar os reels da conta.</p></div>`}
      </section>`)}`;
}

function contaHtml(ig, d) {
  const c = contaDe(d.conta ?? ig.conta) ?? { username: '' };
  const sinc = d.sincronizadoEm ?? ig.sincronizadoEm;
  const lendo = ui.sincronizando === 'proprios';
  const inicial = (c.username || 'L')[0].toUpperCase();
  return `
    <section class="card ig-conta">
      <span class="ig-avatar" aria-hidden="true">${esc(inicial)}${c.foto ? `<img src="${esc(c.foto)}" alt="" referrerpolicy="no-referrer" />` : ''}</span>
      <div class="ig-conta-info">
        <strong>@${esc(c.username || 'conta')}</strong>
        <span class="ig-conta-nums">
          ${c.seguidores != null ? `<span><b>${fmtN(c.seguidores)}</b> seguidores</span>` : ''}
          ${c.posts != null ? `<span><b>${fmtN(c.posts)}</b> posts</span>` : ''}
        </span>
        <small>${sinc ? `Última leitura em ${quando(sinc)}` : 'Ainda sem leitura'}${METODO[ig.metodo] ? ` · conectado ${METODO[ig.metodo]}` : ''}${ig.expiraEm ? ` · acesso vence em ${fmtData(ig.expiraEm, { ano: true })}` : ''}</small>
      </div>
      <div class="ig-conta-acoes">
        <button type="button" class="btn btn-primario" data-sync="proprios" ${ui.sincronizando ? 'disabled' : ''} aria-busy="${lendo}">
          ${lendo ? `${giro}Lendo o Instagram…` : `${icone('raio', 16)}Sincronizar agora`}
        </button>
        ${ig.metodo === 'env'
          ? '<small class="ig-mudo" title="Pra desconectar, tire IG_ACCESS_TOKEN e IG_USER_ID do .env e reinicie o servidor">Conexão pelo .env</small>'
          : '<button type="button" class="btn btn-fantasma btn-sm" id="ig-desconectar">Desconectar</button>'}
      </div>
    </section>`;
}

function kpisHtml(proprios) {
  if (!proprios.length) return '';
  const med = mediana(proprios.map((m) => m.views));
  const rels = proprios.map((m) => m.relativo).filter(Number.isFinite);
  const melhor = rels.length ? Math.max(...rels) : null;
  const temSalvos = proprios.some((m) => m.saved != null);
  const salvos = proprios.reduce((s, m) => s + (Number(m.saved) || 0), 0);
  return `
    <div class="kpis">
      <div class="kpi"><b>${fmtN(proprios.length)}</b><span>reels lidos</span></div>
      <div class="kpi"><b>${med == null ? '-' : fmtN(Math.round(med))}</b><span>mediana de views</span></div>
      <div class="kpi"><b class="${melhor != null && melhor >= limiar() ? 'ig-alto' : ''}">${fmtRel(melhor)}</b><span>melhor reel × a mediana</span></div>
      <div class="kpi"><b>${temSalvos ? fmtN(salvos) : '-'}</b><span>salvamentos totais</span></div>
    </div>`;
}

function ordenar(lista) {
  const l = [...lista];
  if (ui.ordem === 'relativo') return l.sort((a, b) => (b.relativo ?? -1) - (a.relativo ?? -1) || ms(b.timestamp) - ms(a.timestamp));
  return l.sort((a, b) => ms(b.timestamp) - ms(a.timestamp));
}

function badgeRel(m) {
  if (m.origem === 'hashtag') return '<span class="pill pill-info ig-rel" title="Hashtag não traz views: não dá pra comparar com a mediana">sem régua</span>';
  if (m.semRegua || m.relativo == null) return '<span class="pill ig-rel" title="Sem views pra comparar com a mediana">sem dado</span>';
  const alto = m.relativo >= limiar();
  return `<span class="pill ${alto ? 'pill-ok' : ''} ig-rel" title="Views ÷ mediana de views da própria conta">${alto ? '↑ ' : ''}${fmtRel(m.relativo)}</span>`;
}

// com thumb: a própria capa() em modo foto (sem texto, a thumb já tem o dela) + views por cima
function thumbHtml(m, categoria, variante) {
  const src = https(m.thumb);
  if (!src) return `<div class="ig-thumb">${capaDe(m, categoria, variante)}</div>`;
  return `
    <div class="ig-thumb" data-thumb="${esc(m.midiaId)}" data-categoria="${esc(categoria)}" data-variante="${variante}">
      ${capa({ thumb: src, categoria, variante })}
      ${m.views != null ? `<span class="ig-thumb-views">${icone('play', 12)}${esc(compacto(m.views))}</span>` : ''}
    </div>`;
}

// o mesmo post aparece como /reel/X, /reels/X, /p/X ou /usuario/reel/X (igual ao mesmoPost do servidor)
const codigoPost = (url) => {
  const m = String(url ?? '').match(/instagram\.com\/(?:[^/?#]+\/)?(?:reels?|p|tv)\/([^/?#]+)/i);
  return m ? m[1] : String(url ?? '').split(/[?#]/)[0].replace(/\/+$/, '');
};
const mesmoPost = (a, b) => Boolean(a && b) && codigoPost(a) === codigoPost(b);

// case já existente pra esta mídia: pelo caseId do cache, pelo midiaId ou pelo link do post
// (um case criado pelo detalhe do reel pode não ter o midiaId)
function caseDaMidia(m) {
  const cases = store.E?.cases ?? [];
  return (m.caseId && cases.find((x) => x.id === m.caseId))
    || cases.find((x) => (x.midiaId && x.midiaId === m.midiaId) || mesmoPost(x.permalink, m.permalink))
    || null;
}

function acaoBiblioteca(m) {
  const c = caseDaMidia(m);
  if (m.caseId || c) {
    const f = c && formato(c.formatoId);
    return `<a class="pill pill-ok ig-feito" href="${f ? `#/biblioteca/${esc(f.id)}` : '#/biblioteca'}">✓ Case${f ? ` em ${esc(f.codigo)}` : ' na biblioteca'}</a>`;
  }
  // reel nosso sem views ainda pode virar case; de fora, sem régua não vira
  if (m.semRegua && m.origem !== 'nosso') {
    const motivo = m.origem === 'hashtag'
      ? 'Hashtag não traz views: sem régua pra comparar, então não vira case'
      : 'Sem views pra comparar com a mediana da conta, então não vira case';
    return `<span class="ig-desabilitado" title="${motivo}">
      <button type="button" class="btn btn-sm" disabled>${icone('livro', 14)}Mandar pra biblioteca</button></span>`;
  }
  return `<button type="button" class="btn btn-sm" data-biblioteca="${esc(m.midiaId)}">${icone('livro', 14)}Mandar pra biblioteca</button>`;
}

function cardProprio(m) {
  const link = https(m.permalink);
  return `
    <article class="card ig-card">
      ${thumbHtml(m, 'Reel', '')}
      <div class="ig-card-corpo">
        <div class="ig-card-topo"><span class="ig-data">${icone('calendario', 14)}${esc(dataCurta(m.timestamp))}</span>${badgeRel(m)}</div>
        <p class="ig-legenda" title="${esc(m.caption)}">${esc(m.caption) || '<span class="ig-mudo">Sem legenda</span>'}</p>
        <dl class="ig-nums">
          ${num('views', fmtN(m.views))}${num('salvamentos', fmtN(m.saved))}${num('compart.', fmtN(m.shares))}${num('tempo médio', tempoMedio(m))}
        </dl>
        <div class="ig-card-acoes">
          ${acaoBiblioteca(m)}
          ${link ? `<a class="btn btn-sm btn-fantasma" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${icone('instagram', 14)}Abrir no Instagram</a>` : ''}
        </div>
      </div>
    </article>`;
}

// ── Inspirações ──────────────────────────────────────────────────────────
function chipsHtml(chave, lista, prefixo, placeholder) {
  return `
    <div class="ig-chips" data-lista="${chave}">
      ${lista.map((v) => `<span class="ig-chip">${prefixo}${esc(v)}<button type="button" data-remover="${esc(v)}" aria-label="Remover ${prefixo}${esc(v)}">${icone('fechar', 12)}</button></span>`).join('')}
      <input type="text" class="ig-chips-entrada" value="${esc(ui.rascunho[chave] ?? '')}" placeholder="${lista.length ? 'Adicionar mais' : placeholder}"
        aria-label="Adicionar ${chave === 'hashtags' ? 'hashtag' : 'conta de referência'}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" />
    </div>`;
}

function inspiracoesHtml(ig, d) {
  const cfg = store.E.config ?? {};
  const contas = cfg.contasReferencia ?? [];
  const tags = cfg.hashtags ?? [];
  const lendo = ui.sincronizando === 'inspiracoes';
  const temFonte = contas.length + tags.length > 0;
  const motivo = !ig.conectado ? 'Conecte o Instagram primeiro' : !temFonte ? 'Adicione uma conta ou hashtag' : '';
  const sinc = d.sincronizadoEm ?? ig.sincronizadoEm;
  return `
    ${ig.conectado ? '' : `
    <div class="card ig-faixa">
      <span class="ig-conectar-icone sm" aria-hidden="true">${icone('instagram', 20)}</span>
      <div><strong>Instagram não conectado</strong><span class="ig-mudo">Você já pode montar a lista de contas e hashtags. A busca libera depois de conectar.</span></div>
      <button type="button" class="btn btn-primario btn-sm" data-ir-conectar>Conectar</button>
    </div>`}

    <section class="card ig-fontes">
      <div class="ig-fontes-cols">
        <div class="ig-fonte-bloco">
          <h2 class="ig-h2">${icone('instagram', 18)}Contas de referência</h2>
          ${chipsHtml('contasReferencia', contas, '@', '@conta e Enter')}
        </div>
        <div class="ig-fonte-bloco">
          <h2 class="ig-h2">${icone('busca', 18)}Hashtags</h2>
          ${chipsHtml('hashtags', tags, '#', '#hashtag e Enter')}
        </div>
      </div>

      <div class="ig-limites">
        <strong>O que a API do Instagram deixa ver</strong>
        <ul>
          <li>Não existe busca por nicho: quem escolhe as contas e hashtags é você.</li>
          <li>Só contas profissionais (Empresa ou Criador) podem ser lidas.</li>
          <li>Views de outras contas incluem mídia paga. Salvamentos, compartilhamentos e retenção delas não vêm.</li>
          <li>Hashtag não traz views: fica sem régua e não vira evidência de formato. A Meta limita a 30 hashtags diferentes por semana.</li>
        </ul>
      </div>

      <div class="ig-fontes-rodape">
        <span title="${esc(motivo)}">
          <button type="button" class="btn btn-primario" data-sync="inspiracoes" ${ig.conectado && temFonte && !ui.sincronizando ? '' : 'disabled'} aria-busy="${lendo}">
            ${lendo ? `${giro}Buscando…` : `${icone('bussola', 16)}Buscar inspirações`}
          </button>
        </span>
        <small class="ig-mudo">${sinc ? `Última leitura em ${quando(sinc)}` : 'Nenhuma leitura ainda'}</small>
      </div>
    </section>

    <section class="ig-secao">
      ${comDados(() => gradeInspiracoes(d.inspiracoes ?? []))}
    </section>`;
}

function gradeInspiracoes(itens) {
  if (!itens.length) {
    return `<div class="card vazio">${objeto3d('growth')}<strong>Nenhuma inspiração lida ainda</strong><p>Adicione contas ou hashtags e clique em "Buscar inspirações".</p></div>`;
  }
  const L = limiar();
  const teste = {
    todas: () => true,
    acima: (m) => !m.semRegua && m.relativo != null && m.relativo >= L,
    contas: (m) => m.origem !== 'hashtag',
    hashtags: (m) => m.origem === 'hashtag',
  };
  if (!teste[ui.filtro]) ui.filtro = 'todas';
  const filtrados = itens.filter(teste[ui.filtro])
    .sort((a, b) => (b.relativo ?? -1) - (a.relativo ?? -1) || (b.views ?? b.likes ?? 0) - (a.views ?? a.likes ?? 0));
  const filtros = `
    <div class="ig-filtros" role="group" aria-label="Filtrar inspirações">
      ${FILTROS.map(([id, nome]) => `<button type="button" class="ig-filtro" data-filtro="${id}" aria-pressed="${ui.filtro === id}">${nome || `Acima de ${fmtRel(L)}`}<span>${itens.filter(teste[id]).length}</span></button>`).join('')}
    </div>`;
  if (!filtrados.length) {
    return `${filtros}<div class="card vazio"><strong>Nada nesse filtro</strong><p>${ui.filtro === 'acima'
      ? `Nenhum reel passou de ${fmtRel(L)} a mediana da própria conta.`
      : 'Troque o filtro ou busque de novo.'}</p></div>`;
  }
  return `${filtros}<div class="ig-grade">${filtrados.map(cardInspiracao).join('')}</div>`;
}

function cardInspiracao(m) {
  const fonte = fonteDe(m);
  const link = https(m.permalink);
  const jaIdeia = link && store.E.ideias?.some((i) => i.referencia?.permalink === link);
  return `
    <article class="card ig-card">
      ${thumbHtml(m, fonte, '')}
      <div class="ig-card-corpo">
        <div class="ig-card-topo"><span class="ig-fonte-nome" title="${esc(fonte)}">${esc(fonte)}</span>${badgeRel(m)}</div>
        <p class="ig-legenda ig-legenda-3" title="${esc(m.caption)}">${esc(m.caption) || '<span class="ig-mudo">Sem legenda</span>'}</p>
        <dl class="ig-nums ig-nums-3">${num('views', fmtN(m.views))}${num('curtidas', fmtN(m.likes))}${num('coment.', fmtN(m.comments))}</dl>
        <div class="ig-card-acoes">
          ${acaoBiblioteca(m)}
          ${jaIdeia
            ? '<a class="pill pill-marca ig-feito" href="#/ideias">✓ Virou ideia</a>'
            : `<button type="button" class="btn btn-sm" data-ideia="${esc(m.midiaId)}">${icone('lampada', 14)}Virar ideia</button>`}
          ${link ? `<a class="btn-icone ig-abrir" href="${esc(link)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir no Instagram" title="Abrir no Instagram">${icone('link', 16)}</a>` : ''}
        </div>
        <small class="ig-data">${esc(dataCurta(m.timestamp))}</small>
      </div>
    </article>`;
}

// ── listas de contas e hashtags (PUT /api/config) ────────────────────────
const NORMALIZAR = {
  contasReferencia: (s) => {
    const u = s.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '').replace(/^@+/, '').toLowerCase();
    return /^[a-z0-9._]{1,30}$/.test(u) ? u : null;
  },
  hashtags: (s) => {
    const t = s.trim().replace(/^#+/, '').toLowerCase();
    return /^[\p{L}\p{N}_]{1,100}$/u.test(t) ? t : null;
  },
};

async function adicionar(chave, texto) {
  const partes = String(texto).split(/[\s,;]+/).filter(Boolean);
  if (!partes.length) return;
  const atual = store.E.config?.[chave] ?? [];
  const validos = [];
  const invalidos = [];
  for (const p of partes) {
    const v = NORMALIZAR[chave](p);
    if (v) validos.push(v); else invalidos.push(p);
  }
  if (invalidos.length) toast(`${chave === 'hashtags' ? 'Hashtag inválida' : '@ inválido'}: ${invalidos.join(', ')}`);
  ui.rascunho[chave] = invalidos.join(' '); // o que não entrou volta pro campo pra corrigir
  const nova = [...new Set([...atual, ...validos])];
  if (nova.length === atual.length) {
    if (validos.length && !invalidos.length) toast('Já está na lista');
    return;
  }
  await salvarLista(chave, nova);
}

async function salvarLista(chave, lista) {
  const anterior = store.E.config?.[chave] ?? [];
  store.E.config = { ...store.E.config, [chave]: lista }; // otimista; o recarregar confirma
  ui.focar = chave;
  redesenhar();
  try {
    await api('PUT', '/api/config', { [chave]: lista });
  } catch (e) {
    store.E.config = { ...store.E.config, [chave]: anterior };
    toast(e.message);
  }
  ui.focar = chave;
  await recarregarTudo();
}

// ── painéis: mandar pra biblioteca e virar ideia ─────────────────────────
function resumoMidia(m) {
  const src = https(m.thumb);
  return `
    <div class="ig-resumo">
      ${src ? `<img src="${esc(src)}" alt="" referrerpolicy="no-referrer" />` : `<span class="ig-resumo-sem">${icone('play', 18)}</span>`}
      <div>
        <div class="ig-resumo-topo"><strong>${esc(m.origem === 'nosso' || !m.origem ? `@${m.conta ?? 'nós'}` : fonteDe(m))}</strong>${badgeRel(m)}</div>
        <p class="ig-legenda ig-legenda-3">${esc(m.caption) || '<span class="ig-mudo">Sem legenda</span>'}</p>
        <small class="ig-mudo">${esc(dataCurta(m.timestamp))} · ${fmtN(m.views)} views · ${fmtN(m.likes)} curtidas</small>
      </div>
    </div>`;
}

function notaValidacao(m) {
  const L = limiar();
  const minimo = store.E.regraValidacao?.minCasesAcima ?? 2;
  if (m.relativo == null) return 'Sem views pra comparar: fica registrado como case, mas não conta pra validar o formato.';
  const base = m.relativo >= L
    ? `Com ${fmtRel(m.relativo)} a mediana da conta, este case conta pra validar o formato pelo dado (o formato valida com ${minimo} cases acima de ${fmtRel(L)}).`
    : `Com ${fmtRel(m.relativo)} a mediana da conta, fica registrado como case, mas não conta pra validação (precisa de ${fmtRel(L)} ou mais).`;
  return m.origem === 'nicho' ? `${base} Lembrete: views de outras contas incluem mídia paga.` : base;
}

function ligarPainel(p) {
  p.querySelectorAll('.ig-resumo img').forEach((img) => img.addEventListener('error', () => img.remove(), { once: true }));
}

// o toast do core só aceita texto: o link entra depois, no mesmo elemento (some no próximo toast)
function toastComLink(msg, rotulo, hash) {
  toast(msg);
  const t = document.getElementById('toast');
  if (!t) return;
  const a = document.createElement('a');
  a.className = 'ig-toast-link';
  a.href = hash;
  a.textContent = rotulo;
  a.onclick = (e) => { e.preventDefault(); t.hidden = true; fecharPainel(); navegar(hash); };
  t.append(' ', a);
}

function abrirParaBiblioteca(m) {
  let escolhido = formato(ui.ultimoFormato) ? ui.ultimoFormato : '';
  const info = (f) => (f ? `
    <div class="ig-formato-escolhido">
      <div class="ig-formato-topo"><span class="ig-codigo">${esc(tipoFormato(f))}</span><strong>${esc(f.nome)}</strong><small class="fmt-cod">${esc(f.codigo)}</small></div>
      ${f.formula || f.descricao ? `<p>${esc(f.formula || f.descricao)}</p>` : ''}
      <div>${seloFormato(f)}</div>
    </div>` : '');

  const p = abrirPainel(`
    <div class="painel-topo">
      <div><h2>Mandar pra biblioteca</h2></div>
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo ig-painel">
      ${resumoMidia(m)}
      <label class="rotulo">Formato do reel
        <select class="campo" id="ig-formato">
          <option value="">Escolha o formato</option>
          ${gruposFormato(store.E.formatos ?? []).map(([cat, fs]) => `
            <optgroup label="${esc(cat)}">
              ${fs.map((f) => `<option value="${esc(f.id)}" ${f.id === escolhido ? 'selected' : ''}>${esc(f.codigo)} · ${esc(f.nome)}${f.status === 'validado' ? ' ✓' : ''}</option>`).join('')}
            </optgroup>`).join('')}
        </select>
      </label>
      <div id="ig-formato-info">${info(formato(escolhido))}</div>
      <p class="ig-nota">${esc(notaValidacao(m))}</p>
    </div>
    <div class="painel-rodape">
      <button type="button" class="btn btn-primario" id="ig-confirmar" ${escolhido ? '' : 'disabled'}>Mandar pra biblioteca</button>
      <button type="button" class="btn btn-fantasma" data-fechar>Cancelar</button>
    </div>`) ?? document;
  ligarPainel(p);

  const sel = p.querySelector('#ig-formato');
  const btn = p.querySelector('#ig-confirmar');
  sel.onchange = () => {
    escolhido = sel.value;
    p.querySelector('#ig-formato-info').innerHTML = info(formato(escolhido));
    btn.disabled = !escolhido;
  };
  btn.onclick = async () => {
    if (!escolhido) return;
    btn.disabled = true;
    btn.innerHTML = `${giro}Mandando…`;
    try {
      await api('POST', '/api/instagram/para-biblioteca', { midiaId: m.midiaId, formatoId: escolhido });
    } catch (e) {
      toast(textoErro(e.message));
      btn.disabled = false;
      btn.textContent = 'Mandar pra biblioteca';
      return;
    }
    ui.ultimoFormato = escolhido;
    const f = formato(escolhido);
    fecharPainel();
    toastComLink(`Virou case em ${f?.codigo ?? 'formato'}.`, 'Ver na biblioteca', `#/biblioteca/${escolhido}`);
    invalidar();
    recarregarTudo();
  };
}

function abrirParaIdeia(m) {
  let tipo = '';
  const temas = listaTemas();
  const p = abrirPainel(`
    <div class="painel-topo">
      <div><h2>Virar ideia</h2></div>
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo ig-painel">
      ${resumoMidia(m)}
      <p class="ig-rotulo" id="ig-tema-rotulo">Estilo da ideia</p>
      <div class="ig-temas ig-estilos" role="radiogroup" aria-labelledby="ig-tema-rotulo">
        ${ESTILOS.map((t) => `<button type="button" class="ig-tema" role="radio" aria-checked="false" data-tipo="${t.id}"><strong>${icone(t.icone, 15)}${esc(t.nome)}</strong><small>${esc(t.resumo)}</small></button>`).join('')}
      </div>
      ${temas.length ? `
      <label class="rotulo"><span>Tema do nicho <small class="ig-opcional">opcional</small></span>
        <select class="campo" id="ig-tema-ideia">
          <option value="">Decidir depois</option>
          ${temas.map((t) => `<option value="${esc(t.id)}">${esc(nomeTema(t.id, { curto: true }))}</option>`).join('')}
        </select>
      </label>` : ''}
    </div>
    <div class="painel-rodape">
      <button type="button" class="btn btn-primario" id="ig-criar-ideia" disabled>Criar ideia</button>
      <button type="button" class="btn btn-fantasma" data-fechar>Cancelar</button>
    </div>`) ?? document;
  ligarPainel(p);

  const btn = p.querySelector('#ig-criar-ideia');
  p.querySelectorAll('[data-tipo]').forEach((b) => (b.onclick = () => {
    tipo = b.dataset.tipo;
    p.querySelectorAll('[data-tipo]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    btn.disabled = false;
  }));
  btn.onclick = async () => {
    if (!tipo) return;
    const tema = p.querySelector('#ig-tema-ideia')?.value || '';
    btn.disabled = true;
    btn.innerHTML = `${giro}Criando…`;
    try {
      await api('POST', '/api/instagram/para-ideia', { midiaId: m.midiaId, tipo, ...(tema ? { tema } : {}) });
    } catch (e) {
      toast(textoErro(e.message));
      btn.disabled = false;
      btn.textContent = 'Criar ideia';
      return;
    }
    fecharPainel();
    toastComLink('Virou ideia no Banco de Ideias.', 'Abrir', '#/ideias');
    invalidar();
    recarregarTudo();
  };
}

// ── eventos ──────────────────────────────────────────────────────────────
function ligar(root) {
  const q = (s) => root.querySelector(s);
  const qq = (s) => [...root.querySelectorAll(s)];

  qq('[data-aba]').forEach((b) => (b.onclick = () => navegar(`#/instagram/${b.dataset.aba}`)));
  qq('[data-fechar-aviso]').forEach((b) => (b.onclick = () => { ui.aviso = null; redesenhar(); }));
  qq('[data-recarregar-dados]').forEach((b) => (b.onclick = () => { cache.erro = ''; carregarDados(); redesenhar(); }));
  qq('[data-sync]').forEach((b) => (b.onclick = () => sincronizar(b.dataset.sync)));
  qq('[data-ir-conectar]').forEach((b) => (b.onclick = () => navegar('#/instagram/metricas')));
  qq('[data-filtro]').forEach((b) => (b.onclick = () => { ui.filtro = b.dataset.filtro; redesenhar(); }));
  qq('[data-biblioteca]').forEach((b) => (b.onclick = () => { const m = porId.get(b.dataset.biblioteca); if (m) abrirParaBiblioteca(m); }));
  qq('[data-ideia]').forEach((b) => (b.onclick = () => { const m = porId.get(b.dataset.ideia); if (m) abrirParaIdeia(m); }));

  const form = q('#ig-form-token');
  if (form) form.onsubmit = conectarPorToken;
  const desc = q('#ig-desconectar');
  if (desc) desc.onclick = desconectar;
  const ordem = q('#ig-ordem');
  if (ordem) ordem.onchange = () => { ui.ordem = ordem.value; redesenhar(); };

  for (const box of qq('.ig-chips')) {
    const chave = box.dataset.lista;
    const entrada = box.querySelector('input');
    box.onclick = (e) => { if (e.target === box) entrada.focus(); };
    entrada.onkeydown = (e) => {
      if (e.isComposing) return;
      if (e.key === 'Enter' || e.keyCode === 13 || e.key === ',') {
        e.preventDefault();
        adicionar(chave, entrada.value);
      }
    };
    entrada.oninput = () => { ui.rascunho[chave] = entrada.value; };
    entrada.onpaste = () => setTimeout(() => { if (/[\s,;]/.test(entrada.value.trim())) adicionar(chave, entrada.value); });
    box.querySelectorAll('[data-remover]').forEach((b) => (b.onclick = () => {
      salvarLista(chave, (store.E.config?.[chave] ?? []).filter((v) => v !== b.dataset.remover));
    }));
  }
  if (ui.focar) {
    const inp = q(`.ig-chips[data-lista="${ui.focar}"] input`);
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    ui.focar = null;
  }

  // thumbs do CDN do Instagram expiram: se a imagem falhar, cai na capa tipográfica.
  // O erro sai numa task depois deste código, então o listener chega a tempo; o box fica
  // guardado aqui porque o onerror da capa() tira a img do DOM antes deste listener rodar.
  for (const box of qq('[data-thumb]')) {
    box.querySelector('img')?.addEventListener('error', () => {
      const m = porId.get(box.dataset.thumb);
      if (m) box.innerHTML = capaDe(m, box.dataset.categoria, box.dataset.variante);
    }, { once: true });
  }
  for (const img of qq('.ig-avatar img')) img.addEventListener('error', () => img.remove(), { once: true });
}
