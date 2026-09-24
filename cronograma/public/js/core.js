// Núcleo do front: estado, API, formatação, painel lateral, toast, ícones e o QA
// das regras duras. Todos os views importam daqui (contrato em SPEC §6.1).

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// travessão e meia-risca nunca aparecem na tela (regra dura de copy), nem vindo do banco ou do Instagram:
// entre números vira hífen ("30-35s"), no resto vira vírgula
const TRACO = /[\u2013\u2014]/;
export const semTraco = (s) => String(s ?? '')
  .replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, '$1-$2')
  .replace(/\s*[\u2013\u2014]+\s*/g, ', ')
  .replace(/^, |, $/g, '');
export const esc = (s) => {
  const t = TRACO.test(String(s ?? '')) ? semTraco(s) : String(s ?? '');
  return t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
};
export const negrito = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

export const STATUS = ['ideia', 'roteiro', 'gravado', 'editado', 'publicado'];
export const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

// tipo do reel = estilo e estágio do funil. Todos usam a mesma pílula neutra com ícone.
// Os três primeiros têm guia de estilo (store.E.estilos); Ensino e Conselho são os secundários, sem guia próprio
export const TIPOS = [
  { id: 'viralizacao', nome: 'Viralização', icone: 'raio',
    resumo: 'Surpresa, indignação com o sistema ou humor. Só engajamento.',
    dica: 'Topo de funil: uma verdade sobre o CNPJ que surpreende ou indigna com o sistema. CTA só de engajamento, sem link.' },
  { id: 'vendas', nome: 'Vendas', icone: 'alvo',
    resumo: 'Dor com custo, prova na tela do app e a lista de espera.',
    dica: 'Fundo de funil: dor com custo real, prova na tela do app e uma CTA só, pra lista de espera pelo link da bio.' },
  { id: 'conexao', nome: 'Conexão', longo: 'Conexão e identificação', icone: 'coracao',
    resumo: 'Faz o MEI e o dono de ME se sentirem vistos. CTA suave.',
    dica: 'Conexão e identificação: faz o MEI e o dono de ME se sentirem vistos. CTA suave: comenta sua história, manda pra quem vive isso, segue pra acompanhar. Sem link.' },
  { id: 'ensino', nome: 'Ensino', icone: 'livro', secundario: true,
    resumo: 'Um conceito por reel, em fala de gente.',
    dica: 'Um conceito por reel, em fala de gente. CTA: salvar ou mandar pra quem precisa.' },
  { id: 'conselho', nome: 'Conselho', icone: 'balao', secundario: true,
    resumo: 'Conselho direto de quem já viveu. Salvar, mandar, seguir.',
    dica: 'Conselho direto ou reflexão de quem já viveu o problema. CTA: salvar, mandar pra quem precisa ouvir ou seguir. Sem link.' },
];
export const tipoReel = (id) => TIPOS.find((t) => t.id === id);
// formato como o calendário editorial escreve ("Carrossel 4:5, 3 slides") em até ~18 letras pro chip
export function formatoCurto(texto) {
  const t = String(texto ?? '').split(',')[0].trim();
  return t.length > 18 ? t.split(/[\s/]+/)[0] : t;
}
export function pillTipo(id, { semTipo = true, tam = 13 } = {}) {
  const t = tipoReel(id);
  if (!t) return semTipo ? '<span class="pill pill-tipo sem">sem tipo</span>' : '';
  return `<span class="pill pill-tipo" data-tipo="${t.id}" title="${esc(t.dica)}">${icone(t.icone, tam)}${esc(t.nome)}</span>`;
}

// ── Estilos e temas do nicho (data/estilos.json via /api/estado) ────────
const ORDEM_ESTILOS = ['viralizacao', 'vendas', 'conexao'];
function mapaEstilos() {
  const e = store.E?.estilos;
  if (Array.isArray(e)) return Object.fromEntries(e.filter((x) => x?.id).map((x) => [x.id, x]));
  return e && typeof e === 'object' ? e : {};
}
export const estilo = (tipo) => (tipo && Object.hasOwn(mapaEstilos(), tipo) ? mapaEstilos()[tipo] : null);
export const listaEstilos = () => ORDEM_ESTILOS.filter((id) => estilo(id)).map((id) => ({ id, ...estilo(id) }));

// formatos que servem pra cada tipo: vem do servidor em formato.tipos; sem isso, das recomendações dos estilos
export function tiposDoFormato(f) {
  if (!f) return [];
  const lista = Array.isArray(f.tipos) ? [...f.tipos] : ORDEM_ESTILOS.filter((t) => estilo(t)?.formatosRecomendados?.includes(f.id));
  // formato da categoria Conselho sempre serve pro tipo Conselho (o tipo nasceu depois do guia)
  if (f.categoria === 'Conselho') lista.push('conselho');
  return TIPOS.map((t) => t.id).filter((t) => lista.includes(t));
}

// ── Formato: o tipo em palavras simples vem primeiro; código e selo ficam pequenos ──
const TIPO_FORMATO = { 'Dica/DIY': 'Dica', 'Storytelling Looping': 'Reviravolta', 'Nossos testes': 'Teste' };
export const tipoFormato = (f) => (f ? TIPO_FORMATO[f.categoria] ?? f.categoria ?? 'Formato' : '');
// "Conselho  Sua memória não é sistema  10.2" (código pequeno no fim)
export function rotuloFormato(f, { codigo = true, nome = true } = {}) {
  if (!f) return '';
  return `<span class="fmt-rot"><b class="fmt-tipo">${esc(tipoFormato(f))}</b>${nome ? `<span class="fmt-nome">${esc(f.nome)}</span>` : ''}${codigo && f.codigo ? `<small class="fmt-cod">${esc(f.codigo)}</small>` : ''}</span>`;
}
export function pillFormato(f, { livre = 'Formato livre' } = {}) {
  if (!f) return `<span class="pill pill-fmt">${esc(livre)}</span>`;
  return `<span class="pill pill-fmt" title="${esc(`${tipoFormato(f)} · ${f.nome} · ${f.codigo}${f.status === 'validado' ? ' · validado' : ' · em teste'}`)}"><i class="ponto-fmt ${esc(f.status)}"></i><b>${esc(tipoFormato(f))}</b><span class="pill-fmt-nome">${esc(f.nome)}</span></span>`;
}

export const listaTemas = () => (Array.isArray(store.E?.temas) ? store.E.temas : []);
const TEMAS_LEGADO = { 'fator-r': 'Fator R', app: 'Facilidade do app' };
const SIGLAS = new Set(['mei', 'me', 'cnpj', 'das', 'dasn', 'inss', 'iss', 'ir', 'pj', 'pf', 'bh', 'mg', 'cnae', 'crc']);
export function temaDo(id) {
  if (!id) return null;
  const achar = (x) => listaTemas().find((t) => t.id === x) ?? null;
  return achar(id) ?? (id === 'fator-r' ? achar('tm_fator_r') : null);
}
// id que não está no mapa (tm_primeira_nota) vira "Primeira nota"; texto livre fica como veio
export function nomeTema(id, { curto = false } = {}) {
  if (!id) return '';
  const t = temaDo(id);
  // sem ficha no mapa: o nome que o servidor calculou pra ideia (temaNome) vale antes do id limpo
  let nome = t?.nome ?? (store.E?.ideias ?? []).find((i) => i.tema === id && i.temaNome)?.temaNome ?? TEMAS_LEGADO[id];
  if (!nome && /^tm_[a-z0-9_]+$/i.test(id)) {
    const ps = id.slice(3).split('_').filter(Boolean).map((p) => (SIGLAS.has(p.toLowerCase()) ? p.toUpperCase() : p.toLowerCase()));
    nome = ps.join(' ').replace(/^./, (c) => c.toUpperCase());
  }
  nome = String(nome ?? id);
  if (!curto) return nome;
  // curto: sem parênteses e, se a primeira parte já diz o tema (3+ palavras), só ela
  const limpo = nome.replace(/\s*\([^)]*\)/g, '').trim();
  const m = /^([^:?]+)([:?])/.exec(limpo);
  if (m && m[1].trim().split(/\s+/).length >= 3) return m[1].trim() + (m[2] === '?' ? '?' : '');
  return limpo;
}
export const mesmoTema = (a, b) => Boolean(a && b) && (a === b || temaDo(a)?.id === b || temaDo(b)?.id === a);

// gancho modelo do guia: "modelo com [lacunas]. Ex.: exemplo. (tm_tema)"
export function partesGancho(s) {
  let t = String(s ?? '').trim();
  let temaId = '';
  const ref = /\s*\(([^()]*?\b(tm_[a-z0-9_]+)[^()]*)\)\s*$/i.exec(t);
  if (ref) { temaId = ref[2]; t = t.slice(0, ref.index).trim(); }
  const i = t.search(/\s+Ex\.:\s+/);
  return {
    modelo: i >= 0 ? t.slice(0, i).trim() : t,
    exemplo: i >= 0 ? t.slice(i).replace(/^\s+Ex\.:\s+/, '').trim() : '',
    temaId,
  };
}
// "[N] cuidados com [tema]": cada lacuna vira um destaque
export const comLacunas = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<span class="lacuna">$1</span>');
// fonte com link no meio do texto: o texto fica, a URL vira link
export function fonteComLink(s) {
  return String(s ?? '').split(/(https?:\/\/[^\s)]+)/g).map((p, i) => (i % 2
    ? `<a href="${esc(p)}" target="_blank" rel="noopener noreferrer">${esc(p.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>`
    : esc(p))).join('');
}

export function lerLocal(k) { try { return localStorage.getItem(k); } catch { return null; } }
export function gravarLocal(k, v) { try { localStorage.setItem(k, v); } catch {} }

const inicioMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); };

export const store = {
  E: null,
  usuario: null, // {id, usuario, nome, trocarSenha} de GET /api/auth/estado
  ui: {
    tema: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
    mesCronograma: inicioMes(),
  },
};

// ── Formatação ───────────────────────────────────────────────────────────
export function fmtN(n) {
  if (n == null || n === '' || !Number.isFinite(Number(n))) return '·';
  return Number(n).toLocaleString('pt-BR');
}

export function fmtRel(n) {
  if (n == null || n === '' || !Number.isFinite(Number(n))) return '·';
  return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '×';
}

// "2026-09-29" vira data local sem fuso; timestamp completo vira o dia local dele
function paraData(iso) {
  if (!iso) return null;
  if (iso instanceof Date) return iso;
  const s = String(iso);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtData(iso, opts = {}) {
  const d = paraData(iso);
  if (!d) return '·';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  let s = `${dd}/${mm}${opts.ano ? '/' + d.getFullYear() : ''}`;
  if (opts.diaSemana) s = `${DIAS[d.getDay()]}, ${s}`;
  return s;
}

export function haQuanto(iso) {
  const d = paraData(iso);
  if (!d) return '';
  const hoje = new Date();
  const a = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dias = Math.round((a - b) / 86400000);
  if (dias <= 0) return 'editado hoje';
  if (dias === 1) return 'editado ontem';
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.round(dias / 30);
  if (meses < 12) return meses === 1 ? 'há 1 mês' : `há ${meses} meses`;
  const anos = Math.round(dias / 365);
  return anos === 1 ? 'há 1 ano' : `há ${anos} anos`;
}

// ── Sessão ──────────────────────────────────────────────────────────────
let saindo = false;
export function irParaEntrar({ trocar = false } = {}) {
  if (saindo) return;
  saindo = true;
  const volta = encodeURIComponent(location.pathname + location.hash);
  location.href = trocar ? `/entrar?trocar=1&volta=${volta}` : `/entrar?volta=${volta}`;
}

// 401 = sem sessão; 403 com trocarSenha = senha temporária ainda não trocada
export function sessaoCaiu(status, corpo) {
  if (status === 401) { irParaEntrar(); return true; }
  if (status === 403 && corpo?.trocarSenha) { irParaEntrar({ trocar: true }); return true; }
  return false;
}

// ── API e estado ─────────────────────────────────────────────────────────
// semRedirecionar: 401 que é resposta de formulário (senha atual errada), não sessão vencida
export async function api(metodo, url, corpo, { semRedirecionar = false } = {}) {
  let r;
  try {
    r = await fetch(url, {
      method: metodo,
      headers: corpo !== undefined ? { 'content-type': 'application/json' } : {},
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new Error('Sem conexão com o servidor');
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (!semRedirecionar && sessaoCaiu(r.status, j)) throw new Error('Sua sessão acabou. Entre de novo.');
    throw Object.assign(new Error(j.erro || `Erro ${r.status}`), { status: r.status, corpo: j });
  }
  return j;
}

const ouvintes = [];
export function aoMudar(fn) {
  ouvintes.push(fn);
  return () => { const i = ouvintes.indexOf(fn); if (i >= 0) ouvintes.splice(i, 1); };
}

// duas recargas seguidas podem voltar fora de ordem: só a última vale
let seqRecarga = 0;
export async function recarregar() {
  const minha = ++seqRecarga;
  const E = await api('GET', '/api/estado');
  if (minha !== seqRecarga) return store.E;
  store.E = E;
  for (const fn of [...ouvintes]) {
    try { fn(E); } catch (e) { console.error(e); }
  }
  return E;
}

export function navegar(hash) {
  const h = hash.startsWith('#') ? hash : '#' + hash;
  if (location.hash === h || (h === '#/' && !location.hash)) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = h;
}

// ── Buscas no estado ─────────────────────────────────────────────────────
const lista = (nome) => store.E?.[nome] ?? [];
export const formato = (id) => (id ? lista('formatos').find((x) => x.id === id) : undefined);
export const campanha = (id) => (id ? lista('campanhas').find((x) => x.id === id) : undefined);
export const ideia = (id) => (id ? lista('ideias').find((x) => x.id === id) : undefined);
export const reel = (id) => (id ? lista('reels').find((x) => x.id === id) : undefined);
export const casesDo = (formatoId) => lista('cases').filter((c) => c.formatoId === formatoId);

// ── Roteiro em blocos: Gancho, cada batida do desenvolvimento, CTA ───────
const PALAVRAS_SEG = 2.1;
const nPalavras = (s) => (String(s ?? '').trim().match(/\S+/g) ?? []).length;
const chaves = (s) => new Set(String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
function parecido(a, b) {
  const x = chaves(a), y = chaves(b);
  if (!x.size || !y.size) return false;
  const comum = [...x].filter((w) => y.has(w)).length;
  return comum / Math.min(x.size, y.size) >= 0.6;
}
// "PEDRO: ..." marca quem fala num diálogo
const TURNO = /(?=(?:^|\s)[A-ZÀ-Ú]{3,}:\s)/;
// o desenvolvimento em batidas: parágrafos; senão turnos do diálogo (2 por bloco); senão frases (~30 palavras por bloco)
export function batidas(texto) {
  const t = String(texto ?? '').trim();
  if (!t) return [];
  const pars = t.split(/\n+/).map((x) => x.trim()).filter(Boolean);
  if (pars.length > 1) return pars;
  const turnos = t.split(TURNO).map((x) => x.trim()).filter(Boolean);
  if (turnos.length > 2) {
    const out = [];
    for (let i = 0; i < turnos.length; i += 2) out.push(turnos.slice(i, i + 2).join(' '));
    return out;
  }
  const frases = t.match(/[^.!?…]+(?:[.!?…]+["”']?|$)/g)?.map((x) => x.trim()).filter(Boolean) ?? [t];
  const out = [];
  let atual = '';
  for (const f of frases) {
    if (atual && nPalavras(atual) + nPalavras(f) > 32) { out.push(atual); atual = f; } else atual = atual ? `${atual} ${f}` : f;
  }
  if (atual) out.push(atual);
  return out;
}
// ro: roteiro do reel ({hook, textoTela, cenas, desenvolvimento, cta}) ou roteiro base da ideia ({hook, textoTela, narracao, cta})
export function blocosRoteiro(ro = {}) {
  const tem = (v) => Boolean(String(v ?? '').trim());
  const cenas = (ro.cenas ?? []).filter((c) => tem(c?.fala) || tem(c?.cena));
  let blocos;
  if (cenas.length) {
    blocos = cenas.map((c) => ({ parte: 'dev', tempo: c.tempo ?? '', fala: c.fala ?? '', cena: c.cena ?? '', tela: c.tela ?? '' }));
    blocos[0].parte = 'gancho';
    const ultimo = blocos.at(-1);
    if (blocos.length > 1 && (!tem(ro.cta) || parecido(ultimo.fala, ro.cta))) ultimo.parte = 'cta';
    else if (tem(ro.cta) && !blocos.some((b) => parecido(b.fala, ro.cta))) blocos.push({ parte: 'cta', tempo: '', fala: ro.cta, cena: '', tela: '' });
  } else {
    blocos = [
      ...(tem(ro.hook) ? [{ parte: 'gancho', fala: ro.hook, tela: ro.textoTela ?? '' }] : []),
      ...batidas(ro.desenvolvimento ?? ro.narracao).map((fala) => ({ parte: 'dev', fala })),
      ...(tem(ro.cta) ? [{ parte: 'cta', fala: ro.cta }] : []),
    ];
    // tempo estimado pela fala (~2,1 palavras por segundo); o gancho ocupa pelo menos 0-3s
    let t = 0;
    for (const b of blocos) {
      const dur = Math.max(b.parte === 'gancho' ? 3 : 2, Math.round(nPalavras(b.fala) / PALAVRAS_SEG));
      b.tempo = `${t}-${t + dur}s`;
      t += dur;
    }
  }
  const nDev = blocos.filter((b) => b.parte === 'dev').length;
  let i = 0;
  for (const b of blocos) {
    b.rotulo = b.parte === 'gancho' ? 'Gancho' : b.parte === 'cta' ? 'CTA' : nDev > 1 ? `Desenvolvimento ${++i}` : 'Desenvolvimento';
  }
  return blocos;
}
// fala com turnos de diálogo ("PEDRO: ... MAURO: ...") vira uma linha por pessoa
function falaHtml(s) {
  const t = String(s ?? '').trim();
  const partes = t.split(TURNO).map((x) => x.trim()).filter(Boolean);
  if (!partes.some((p) => /^[A-ZÀ-Ú]{3,}:\s/.test(p))) return esc(t);
  return partes.map((p) => {
    const m = /^([A-ZÀ-Ú]{3,}):\s+/.exec(p);
    if (!m) return `<span class="rt-turno">${esc(p)}</span>`;
    const nome = m[1][0] + m[1].slice(1).toLowerCase();
    return `<span class="rt-turno"><b class="rt-falante">${esc(nome)}</b> ${esc(p.slice(m[0].length))}</span>`;
  }).join('');
}
export function roteiroHtml(blocos) {
  if (!blocos.length) return '';
  const tem = (v) => Boolean(String(v ?? '').trim());
  return `<ol class="rt-blocos">${blocos.map((b) => `
    <li class="rt-bloco" data-parte="${b.parte}">
      <div class="rt-cab"><span class="rt-rotulo">${esc(b.rotulo)}</span>${b.tempo ? `<span class="rt-tempo">${esc(b.tempo)}</span>` : ''}</div>
      ${tem(b.fala) ? `<p class="rt-fala">${falaHtml(b.fala)}</p>` : ''}
      ${tem(b.cena) ? `<p class="rt-meta"><span>Em cena:</span> ${esc(b.cena)}</p>` : ''}
      ${tem(b.tela) ? `<p class="rt-meta"><span>Na tela:</span> <span class="rt-tela">${esc(b.tela)}</span></p>` : ''}
    </li>`).join('')}</ol>`;
}
// o mesmo roteiro em texto puro (copiar pro WhatsApp)
export function roteiroTexto(blocos) {
  const tem = (v) => Boolean(String(v ?? '').trim());
  return blocos.map((b) => [
    `${b.rotulo.toUpperCase()}${b.tempo ? ` (${b.tempo})` : ''}`,
    tem(b.fala) ? `"${String(b.fala).trim()}"` : '',
    tem(b.cena) ? `Em cena: ${b.cena}` : '',
    tem(b.tela) ? `Na tela: ${b.tela}` : '',
  ].filter(Boolean).join('\n')).join('\n\n');
}

// ── Fontes: botão "i" que abre um balão (clique ou foco; Escape e clique fora fecham) ──
let seqPop = 0;
export function botaoFontes(fontes, { rotulo = 'Fontes', classe = '' } = {}) {
  const itens = (fontes ?? []).filter((x) => String(x ?? '').trim());
  if (!itens.length) return '';
  const id = `pop-${++seqPop}`;
  return `<span class="pop${classe ? ` ${classe}` : ''}"><button type="button" class="btn-icone btn-sm pop-btn" data-pop="${id}" aria-label="${esc(rotulo)}" aria-expanded="false" aria-controls="${id}" title="${esc(rotulo)}">${icone('info', 16)}</button><div class="pop-balao" id="${id}" role="region" aria-label="${esc(rotulo)}" hidden><strong class="pop-titulo">${esc(rotulo)}</strong><ol>${itens.map((x) => `<li>${fonteComLink(x)}</li>`).join('')}</ol></div></span>`;
}
let popAbertoEm = 0;
function fecharPops(exceto = null, devolver = false) {
  for (const b of document.querySelectorAll('[data-pop][aria-expanded="true"]')) {
    if (b === exceto) continue;
    b.setAttribute('aria-expanded', 'false');
    const bal = document.getElementById(b.dataset.pop);
    if (bal) bal.hidden = true;
    if (devolver) b.focus({ preventScroll: true });
  }
}
function abrirPop(b) {
  fecharPops(b);
  if (b.getAttribute('aria-expanded') === 'true') return;
  b.setAttribute('aria-expanded', 'true');
  const bal = document.getElementById(b.dataset.pop);
  if (bal) bal.hidden = false;
  popAbertoEm = performance.now();
}
document.addEventListener('focusin', (e) => {
  const el = e.target instanceof Element ? e.target : null;
  const b = el?.closest('[data-pop]');
  if (b) return abrirPop(b);
  // o foco saiu pra fora de qualquer balão aberto (Tab): fecha
  if (!el?.closest('.pop')) fecharPops();
});
document.addEventListener('click', (e) => {
  const el = e.target instanceof Element ? e.target : null;
  const b = el?.closest('[data-pop]');
  if (b) {
    // o foco do próprio clique já abriu: esse clique não fecha de novo
    if (b.getAttribute('aria-expanded') === 'true' && performance.now() - popAbertoEm > 350) fecharPops();
    else abrirPop(b);
    return;
  }
  if (!el?.closest('.pop-balao')) fecharPops();
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !document.querySelector('[data-pop][aria-expanded="true"]')) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  fecharPops(null, true);
}, true);

// ── Ícones (traço fino, herdam a cor do texto) ───────────────────────────
const ICONES = {
  casa: '<path d="M3.5 10.2 12 3.5l8.5 6.7"/><path d="M5.5 9v10a1.5 1.5 0 0 0 1.5 1.5h3.5v-5.5h3v5.5H17a1.5 1.5 0 0 0 1.5-1.5V9"/>',
  calendario: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  lampada: '<path d="M9 17.5h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2v.5h5V16c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z"/>',
  grade: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
  pasta: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.8l2 2.2h7.2a2 2 0 0 1 2 2V17.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/>',
  livro: '<path d="M3 5.5a1 1 0 0 1 1-1h4.5A3.5 3.5 0 0 1 12 8v12a3 3 0 0 0-3-3H4a1 1 0 0 1-1-1Z"/><path d="M21 5.5a1 1 0 0 0-1-1h-4.5A3.5 3.5 0 0 0 12 8v12a3 3 0 0 1 3-3h5a1 1 0 0 0 1-1Z"/>',
  carrossel: '<rect x="6.5" y="4" width="11" height="16" rx="2.2"/><path d="M3 6.5v11M21 6.5v11"/>',
  grafico: '<path d="M3.5 3.5v15a2 2 0 0 0 2 2h15"/><path d="M8.5 16.5v-4M13 16.5V8.5M17.5 16.5v-9"/>',
  bussola: '<circle cx="12" cy="12" r="8.8"/><path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1Z"/>',
  alvo: '<circle cx="12" cy="12" r="8.8"/><circle cx="12" cy="12" r="5.2"/><circle cx="12" cy="12" r="1.6"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  coracao: '<path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 7.5 2.9C19.5 15.4 12 20 12 20Z"/>',
  'coracao-cheio': '<path fill="currentColor" d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 7.5 2.9C19.5 15.4 12 20 12 20Z"/>',
  play: '<path fill="currentColor" d="M8.5 5.8v12.4a.8.8 0 0 0 1.2.7l9.6-6.2a.8.8 0 0 0 0-1.4L9.7 5.1a.8.8 0 0 0-1.2.7Z"/>',
  lua: '<path d="M20 14.2A8 8 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2Z"/>',
  sol: '<circle cx="12" cy="12" r="3.8"/><path d="M12 2.8v2M12 19.2v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.8 12h2M19.2 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  cadeado: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.6"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  raio: '<path d="M13.2 2.8 4.8 13.4h6.4l-.9 7.8 8.4-10.6h-6.4Z"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
  busca: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.9"/><path d="M16.9 7.1h.01"/>',
  link: '<path d="M10 13.5a4.2 4.2 0 0 0 6.2.4l2.8-2.8a4.2 4.2 0 0 0-5.9-5.9l-1.4 1.4"/><path d="M14 10.5a4.2 4.2 0 0 0-6.2-.4L5 12.9a4.2 4.2 0 0 0 5.9 5.9l1.4-1.4"/>',
  copiar: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.4"/><path d="M15.5 8.5V5.9a2.4 2.4 0 0 0-2.4-2.4H5.9a2.4 2.4 0 0 0-2.4 2.4v7.2a2.4 2.4 0 0 0 2.4 2.4h2.6"/>',
  lixo: '<path d="M4 6.5h16M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7"/><path d="M6.2 6.5 7 19a1.6 1.6 0 0 0 1.6 1.5h6.8A1.6 1.6 0 0 0 17 19l.8-12.5"/><path d="M10 11v5.5M14 11v5.5"/>',
  editar: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>',
  estrela: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z"/>',
  // favoritar é estrela: o coração é o ícone do tipo Conexão
  'estrela-cheia': '<path fill="currentColor" d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z"/>',
  // extras do shell
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  'chevron-esq': '<path d="m14.5 6-6 6 6 6"/>',
  'chevron-dir': '<path d="m9.5 6 6 6-6 6"/>',
  relogio: '<circle cx="12" cy="12" r="8.8"/><path d="M12 7.5V12l3 2"/>',
  alerta: '<circle cx="12" cy="12" r="8.8"/><path d="M12 7.8v5M12 16.2h.01"/>',
  externo: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
  // conta e equipe
  usuario: '<circle cx="12" cy="8.2" r="3.9"/><path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0"/>',
  equipe: '<circle cx="9" cy="8.5" r="3.4"/><path d="M2.8 19.5a6.2 6.2 0 0 1 12.4 0"/><path d="M15.2 5.3a3.4 3.4 0 0 1 0 6.4M17.6 13.9a6.2 6.2 0 0 1 3.6 5.6"/>',
  sair: '<path d="M14.5 4.5H18a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3.5"/><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15"/>',
  chave: '<circle cx="8" cy="15.5" r="4"/><path d="m10.9 12.6 8.6-8.6M16.5 7l2.5 2.5M14 9.5l2 2"/>',
  olho: '<path d="M2.8 12S6.2 5.5 12 5.5 21.2 12 21.2 12 17.8 18.5 12 18.5 2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="3"/>',
  'olho-fechado': '<path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c5.8 0 9.2 6.5 9.2 6.5a16 16 0 0 1-2.6 3.5M6.6 7.2A15.6 15.6 0 0 0 2.8 12s3.4 6.5 9.2 6.5a9 9 0 0 0 4.7-1.3"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3.5 3.5l17 17"/>',
  alfinete: '<path d="M9 3.5h6l-.9 5.6 3.4 3.4v1.8h-11v-1.8l3.4-3.4Z"/><path d="M12 14.3v6.2"/>',
  balao: '<path d="M4.5 5.5h15a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5v-3.5h-1A1.5 1.5 0 0 1 3 16V7a1.5 1.5 0 0 1 1.5-1.5Z"/><path d="M8 10.5h8M8 13.5h5"/>',
  info: '<circle cx="12" cy="12" r="8.8"/><path d="M12 11v5.2M12 7.8h.01"/>',
  gerar: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.7"/><path d="M20 4v4.7h-4.7"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.3"/><path d="M4 20v-4.7h4.7"/>',
};

export function icone(nome, tam = 18) {
  const miolo = ICONES[nome] ?? '<circle cx="12" cy="12" r="3"/>';
  return `<svg class="ico" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${miolo}</svg>`;
}

// ── Toast ────────────────────────────────────────────────────────────────
function garantir(id, tag, attrs) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement(tag);
    el.id = id;
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    el.hidden = true;
    document.body.append(el);
  }
  return el;
}

let tempoToast = null;
export function toast(msg) {
  const t = garantir('toast', 'div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(tempoToast);
  tempoToast = setTimeout(() => (t.hidden = true), 2800);
}

// ── Painel lateral ───────────────────────────────────────────────────────
export const BTN_FECHAR = `<button class="btn-icone" data-fechar aria-label="Fechar">${icone('fechar', 18)}</button>`;

let focoAntes = null;

export function abrirPainel(html, { largo = false } = {}) {
  const p = garantir('painel', 'aside', { class: 'painel', role: 'dialog', 'aria-modal': 'true', tabindex: '-1' });
  const v = garantir('veu', 'div', { class: 'veu' });
  const estavaFechado = p.hidden;
  if (estavaFechado) focoAntes = document.activeElement;
  p.innerHTML = html;
  // o título do painel vira o nome do dialog pro leitor de tela
  const h = p.querySelector('.painel-topo h2');
  if (h) { h.id = 'painel-titulo'; p.setAttribute('aria-labelledby', 'painel-titulo'); }
  else p.removeAttribute('aria-labelledby');
  p.classList.toggle('largo', !!largo);
  p.hidden = false;
  v.hidden = false;
  document.body.classList.add('com-painel');
  $$('[data-fechar]', p).forEach((b) => (b.onclick = fecharPainel));
  if (estavaFechado) p.focus({ preventScroll: true });
  return p;
}

export function fecharPainel() {
  const p = document.getElementById('painel');
  const v = document.getElementById('veu');
  if (p) { p.hidden = true; p.innerHTML = ''; p.classList.remove('largo'); }
  if (v) v.hidden = true;
  document.body.classList.remove('com-painel');
  // #/reel/<id> e #/criar são rotas de painel: ao fechar, volta pra vista de baixo
  // sem disparar hashchange (a vista já está desenhada)
  if (/^#\/reel\//.test(location.hash)) history.replaceState(null, '', '#/cronograma');
  else if (/^#\/criar/.test(location.hash)) history.replaceState(null, '', '#/');
  if (focoAntes?.isConnected) focoAntes.focus({ preventScroll: true });
  focoAntes = null;
}

document.addEventListener('keydown', (e) => {
  const p = document.getElementById('painel');
  if (e.key === 'Escape' && p && !p.hidden) fecharPainel();
});
document.addEventListener('click', (e) => {
  if (e.target instanceof Element && e.target.id === 'veu') fecharPainel();
});

// ── Selo de validação do formato (SPEC §4) ───────────────────────────────
// formato da biblioteca mostra só "validado", sem legenda de origem
const VIAS = { dado: 'pelo nosso dado', benchmark: 'por benchmark' };

export function seloFormato(f, { compacto = false } = {}) {
  if (!f) return '';
  if (compacto) return f.status === 'validado' ? '<span class="selo-mini validado">✓ validado</span>' : '<span class="selo-mini em-teste">em teste</span>';
  if (f.status === 'validado') {
    const via = VIAS[f.via] ?? '';
    return `<span class="selo-formato"><span class="selo validado" title="${esc(via ? 'Validado ' + via : 'Validado')}">✓ validado</span>${via ? `<span class="selo-via">${esc(via)}</span>` : ''}</span>`;
  }
  const r = store.E?.regraValidacao;
  const dica = r ? `${f.acima ?? 0} de ${r.minCasesAcima ?? 2} cases acima de ${fmtRel(r.limiarRelativo ?? 1.5)} a mediana` : 'Ainda sem evidência';
  return `<span class="selo-formato"><span class="selo em-teste" title="${esc(dica)}">em teste</span></span>`;
}

// ── QA das regras duras (_memoria/preferencias.md), porta da v1 ─────────
const CONCORRENTES = ['contabilizei', 'agilize', 'contaja', 'facilite', 'contabilivre', 'marvee', 'contaazul', 'nubank'];

export function qa(reel) {
  const r = reel?.roteiro ?? {};
  const tudo = [r.hook, r.textoTela, r.desenvolvimento, r.cta, reel?.legenda, ...(r.cenas ?? []).flatMap((c) => [c.fala, c.tela])].join('\n');
  // gravação e fontes são internas, mas travessão e concorrente não entram em lugar nenhum
  const interno = [...Object.values(reel?.gravacao ?? {}).flat(), ...(reel?.fontes ?? [])].filter((x) => typeof x === 'string').join('\n');
  const baixo = (tudo + '\n' + interno).toLowerCase();
  const fontes = (reel?.fontes ?? []).filter((x) => String(x).trim());
  const itens = [];
  const regra = (ok, texto, nivel = 'erro') => itens.push({ ok, texto, nivel });
  regra(!/[\u2013\u2014]/.test(tudo + interno), 'Zero travessão');
  regra(!/Legaliza[ie](?![a-zà-ú])/i.test(tudo), 'Grafia "Legalizaí"');
  regra(!/link (abaixo|na descrição)/i.test(tudo), 'CTA é "link da bio"');
  regra(!CONCORRENTES.some((c) => baixo.includes(c)), 'Nenhum concorrente citado');
  regra(!/imposto novo/i.test(tudo), 'Sem "imposto novo" (Reforma)');
  regra((reel?.legenda ?? '').length <= 2200, 'Legenda até 2.200 caracteres');
  if (reel?.tipo === 'viralizacao' && /link da bio|lista de espera/i.test(r.cta ?? '')) regra(false, 'Viralização: CTA final só de engajamento, sem link', 'alerta');
  if (reel?.tipo === 'vendas' && r.cta && !/lista/i.test(r.cta)) regra(false, 'Vendas: confira se a CTA final leva pra lista de espera', 'alerta');
  if (reel?.tipo === 'conexao' && /link da bio|lista de espera/i.test(`${r.cta ?? ''}\n${reel?.legenda ?? ''}`)) regra(false, 'Conexão: CTA suave (comentar, mandar, seguir), sem link nem lista', 'alerta');
  if (/contador/i.test(tudo)) regra(false, 'Cita "contador": confira se não promete contador humano no MEI', 'alerta');
  if (/baix[ea] (agora|o app|já)/i.test(tudo)) regra(false, 'App em pré-lançamento: nada de "baixe agora"', 'alerta');
  if (/\d/.test(tudo)) {
    if (fontes.length) regra(true, `Números com fonte (${fontes.length})`);
    else regra(false, 'Tem número e nenhuma fonte listada', 'alerta');
  }
  return itens;
}
