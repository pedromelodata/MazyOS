// Métricas → Ranking: os 5 reels nossos que mais renderam no período, escolhido num mini calendário 3D.
// Semanal: o mês em blocos por dia e cada linha (segunda a domingo) é uma semana clicável.
// Mensal, trimestral, semestral e anual: o ano em 12 blocos, uma linha por trimestre.
// Altura e cor do bloco seguem a métrica escolhida. Clicar num reel do ranking abre "Por que esse reel
// funcionou". Só CSS 3D (transform), sem biblioteca; com "reduzir movimento" nada anima.
import { esc, fmtN, fmtRel, icone, store } from '../core.js';

const GRANS = [
  { id: 'semana', nome: 'Semanal' },
  { id: 'mes', nome: 'Mensal' },
  { id: 'trimestre', nome: 'Trimestral' },
  { id: 'semestre', nome: 'Semestral' },
  { id: 'ano', nome: 'Anual' },
];
const engajamento = (m) => {
  const xs = [m.likes, m.comments, m.shares, m.saved].filter(Number.isFinite);
  return xs.length ? xs.reduce((a, b) => a + b, 0) : null;
};
const METRICAS = [
  { id: 'views', nome: 'Views', un: 'views', de: (m) => m.views },
  { id: 'engajamento', nome: 'Engajamento', un: 'interações', de: engajamento },
  { id: 'taxa', nome: 'Taxa de engajamento', un: 'do alcance', pct: true, de: (m) => (engajamento(m) != null && m.reach > 0 ? engajamento(m) / m.reach : null) },
  { id: 'saved', nome: 'Salvamentos', un: 'salvamentos', de: (m) => m.saved },
  { id: 'shares', nome: 'Compartilhamentos', un: 'compartilhamentos', de: (m) => m.shares },
];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const ALTURA = { dia: 20, mes: 30 };

const st = { gran: 'mes', metrica: 'views', ref: null, mesVisto: null, grade: '' };
let alvo = null; // { el, proprios, aoAnalisar }

// ── datas (locais, meia-noite) ───────────────────────────────────────────
const dia0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const somaDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const segunda = (d) => somaDias(dia0(d), -((d.getDay() + 6) % 7));
const primeiroDoMes = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const dd = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
const deIso = (s) => { const [a, m, d] = String(s).split('-').map(Number); return new Date(a, m - 1, d); };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function dataDo(ts) {
  const d = new Date(String(ts ?? '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return Number.isNaN(d.getTime()) ? null : dia0(d);
}

function periodo(gran, ref) {
  const a = ref.getFullYear();
  const m = ref.getMonth();
  if (gran === 'semana') { const i = segunda(ref); return { inicio: i, fim: somaDias(i, 7) }; }
  if (gran === 'mes') return { inicio: new Date(a, m, 1), fim: new Date(a, m + 1, 1) };
  if (gran === 'trimestre') { const q = Math.floor(m / 3) * 3; return { inicio: new Date(a, q, 1), fim: new Date(a, q + 3, 1) }; }
  if (gran === 'semestre') { const s = m < 6 ? 0 : 6; return { inicio: new Date(a, s, 1), fim: new Date(a, s + 6, 1) }; }
  return { inicio: new Date(a, 0, 1), fim: new Date(a + 1, 0, 1) };
}

function mover(gran, ref, delta) {
  const a = ref.getFullYear();
  const m = ref.getMonth();
  if (gran === 'semana') return somaDias(segunda(ref), 7 * delta);
  if (gran === 'mes') return new Date(a, m + delta, 1);
  if (gran === 'trimestre') return new Date(a, Math.floor(m / 3) * 3 + 3 * delta, 1);
  if (gran === 'semestre') return new Date(a, (m < 6 ? 0 : 6) + 6 * delta, 1);
  return new Date(a + delta, 0, 1);
}

function rotulo(gran, ref) {
  const p = periodo(gran, ref);
  const a = p.inicio.getFullYear();
  if (gran === 'semana') {
    const f = somaDias(p.fim, -1);
    const ini = p.inicio.getMonth() === f.getMonth() ? dd(p.inicio.getDate()) : `${dd(p.inicio.getDate())}/${dd(p.inicio.getMonth() + 1)}${p.inicio.getFullYear() !== f.getFullYear() ? `/${p.inicio.getFullYear()}` : ''}`;
    return `${ini} a ${dd(f.getDate())}/${dd(f.getMonth() + 1)}/${f.getFullYear()}`;
  }
  if (gran === 'mes') return `${cap(MESES[p.inicio.getMonth()])} de ${a}`;
  if (gran === 'trimestre') return `${Math.floor(p.inicio.getMonth() / 3) + 1}º trimestre de ${a}`;
  if (gran === 'semestre') return `${p.inicio.getMonth() < 6 ? 1 : 2}º semestre de ${a}`;
  return String(a);
}

const dentro = (d, p) => d >= p.inicio && d < p.fim;
const cruza = (p, q) => p.inicio < q.fim && q.inicio < p.fim;
const metrica = () => METRICAS.find((x) => x.id === st.metrica) ?? METRICAS[0];

// soma da métrica no bloco (taxa: engajamento somado ÷ alcance somado)
function agregado(lista, met) {
  if (!lista.length) return 0;
  if (met.id === 'taxa') {
    const e = lista.reduce((s, x) => s + (engajamento(x.m) ?? 0), 0);
    const r = lista.reduce((s, x) => s + (Number.isFinite(x.m.reach) ? x.m.reach : 0), 0);
    return r > 0 ? e / r : 0;
  }
  return lista.reduce((s, x) => s + (Number.isFinite(met.de(x.m)) ? met.de(x.m) : 0), 0);
}

function valorFmt(v, met) {
  if (v == null) return 'sem dado';
  return met.pct ? `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : fmtN(v);
}

// ── estado inicial ───────────────────────────────────────────────────────
function iniciar(itens) {
  if (st.ref) return;
  const ultimo = itens.reduce((max, x) => (!max || x.d > max ? x.d : max), null);
  st.ref = primeiroDoMes(ultimo ?? new Date());
  st.mesVisto = primeiroDoMes(st.ref);
}

// ── calendário 3D ────────────────────────────────────────────────────────
function bloco(v, max, alto, { rotulo: r = '', fora = false, titulo = '' } = {}) {
  const i = max > 0 && v > 0 ? v / max : 0;
  const h = v > 0 ? 2 + Math.round(i * (alto - 2)) : 0;
  return `<span class="c3-bloco${v > 0 ? ' tem' : ''}${fora ? ' fora' : ''}" style="--h:${h};--i:${i.toFixed(3)}"${titulo ? ` title="${esc(titulo)}"` : ''}>`
    + `<i class="c3-topo">${r ? `<b>${esc(r)}</b>` : ''}</i><i class="c3-frente"></i><i class="c3-lado"></i></span>`;
}

function contagem(n) {
  return n === 1 ? '1 reel' : `${n} reels`;
}

function gradeSemanas(itens, met) {
  const mes = st.mesVisto;
  const fimMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 1);
  const semanas = [];
  for (let s = segunda(mes); s < fimMes; s = somaDias(s, 7)) semanas.push(s);
  const porDia = new Map();
  for (const x of itens) {
    const k = iso(x.d);
    if (!porDia.has(k)) porDia.set(k, []);
    porDia.get(k).push(x);
  }
  const dias = semanas.flatMap((s) => Array.from({ length: 7 }, (_, k) => somaDias(s, k)));
  const valores = new Map(dias.map((d) => [iso(d), agregado(porDia.get(iso(d)) ?? [], met)]));
  const max = Math.max(0, ...valores.values());
  const sel = periodo('semana', st.ref);
  const linhas = semanas.map((s) => {
    const p = { inicio: s, fim: somaDias(s, 7) };
    const ativo = sel.inicio.getTime() === s.getTime();
    const n = itens.filter((x) => dentro(x.d, p)).length;
    const ref = s < mes ? mes : s;
    const cels = Array.from({ length: 7 }, (_, k) => {
      const d = somaDias(s, k);
      const lista = porDia.get(iso(d)) ?? [];
      const titulo = `${dd(d.getDate())}/${dd(d.getMonth() + 1)}${lista.length ? `: ${contagem(lista.length)}, ${valorFmt(valores.get(iso(d)), met)} ${met.un}` : ''}`;
      return bloco(valores.get(iso(d)), max, ALTURA.dia, { fora: d.getMonth() !== mes.getMonth(), titulo });
    }).join('');
    return `<button type="button" class="c3-unidade c3-semana" data-rk-ref="${iso(ref)}" data-foco="u:${iso(s)}" aria-pressed="${ativo}"
      aria-label="Semana de ${esc(rotulo('semana', s))}, ${contagem(n)}">${cels}</button>`;
  }).join('');
  return `
    <div class="c3-cab" aria-hidden="true">${DIAS.map((d) => `<span>${d}</span>`).join('')}</div>
    <div class="c3-unidades c3-uma-coluna">${linhas}</div>`;
}

function gradeAno(itens, met) {
  const a = st.ref.getFullYear();
  const meses = Array.from({ length: 12 }, (_, m) => {
    const p = { inicio: new Date(a, m, 1), fim: new Date(a, m + 1, 1) };
    const lista = itens.filter((x) => dentro(x.d, p));
    return { m, p, lista, v: agregado(lista, met) };
  });
  const max = Math.max(0, ...meses.map((x) => x.v));
  const tile = (x) => bloco(x.v, max, ALTURA.mes, {
    rotulo: MESES_CURTOS[x.m],
    titulo: `${cap(MESES[x.m])}: ${x.lista.length ? `${contagem(x.lista.length)}, ${valorFmt(x.v, met)} ${met.un}` : 'sem reel'}`,
  });
  const sel = periodo(st.gran, st.ref);
  const tamanho = { mes: 1, trimestre: 3, semestre: 6, ano: 12 }[st.gran];
  const grupos = [];
  for (let i = 0; i < 12; i += tamanho) grupos.push(meses.slice(i, i + tamanho));
  const unidades = grupos.map((g) => {
    const p = { inicio: g[0].p.inicio, fim: g.at(-1).p.fim };
    const n = g.reduce((s, x) => s + x.lista.length, 0);
    const ativo = cruza(p, sel) && p.inicio.getTime() === sel.inicio.getTime();
    return `<button type="button" class="c3-unidade c3-g${tamanho}" data-rk-ref="${iso(p.inicio)}" data-foco="u:${iso(p.inicio)}" aria-pressed="${ativo}"
      aria-label="${esc(rotulo(st.gran, p.inicio))}, ${contagem(n)}">${g.map(tile).join('')}</button>`;
  }).join('');
  return `<div class="c3-unidades ${tamanho === 1 ? 'c3-tres-colunas' : 'c3-uma-coluna'}">${unidades}</div>`;
}

function calendarioHtml(itens, met) {
  const semanal = st.gran === 'semana';
  const titulo = semanal ? `${cap(MESES[st.mesVisto.getMonth()])} de ${st.mesVisto.getFullYear()}` : String(st.ref.getFullYear());
  // a entrada (blocos subindo) só roda quando a grade muda: clicar noutra semana do mesmo mês não repete
  const chave = `${semanal ? `s${iso(st.mesVisto)}` : `a${st.ref.getFullYear()}`}:${st.metrica}`;
  const nova = chave !== st.grade;
  st.grade = chave;
  return `
    <div class="card rk-cal">
      <div class="rk-nav">
        <button type="button" class="btn-icone btn-sm" data-rk-mover="-1" data-foco="ant" aria-label="Período anterior">${icone('chevron-esq', 16)}</button>
        <strong aria-live="polite">${esc(titulo)}</strong>
        <button type="button" class="btn-icone btn-sm" data-rk-mover="1" data-foco="prox" aria-label="Próximo período">${icone('chevron-dir', 16)}</button>
      </div>
      <div class="c3${nova ? ' c3-entra' : ''}" role="group" aria-label="Calendário do ranking">
        <div class="c3-plano ${semanal ? 'c3-dias' : 'c3-meses'}">${semanal ? gradeSemanas(itens, met) : gradeAno(itens, met)}</div>
      </div>
    </div>`;
}

// ── ranking ──────────────────────────────────────────────────────────────
function tituloReel(m, d) {
  const linha = String(m.caption ?? '').split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  const t = linha.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim();
  return t || `Reel de ${dd(d.getDate())}/${dd(d.getMonth() + 1)}`;
}

function topHtml(itens, met) {
  const p = periodo(st.gran, st.ref);
  const noPeriodo = itens.filter((x) => dentro(x.d, p));
  const comValor = noPeriodo
    .map((x) => ({ ...x, v: met.de(x.m) }))
    .filter((x) => Number.isFinite(x.v))
    .sort((a, b) => b.v - a.v || (b.m.views ?? -1) - (a.m.views ?? -1) || b.d - a.d)
    .slice(0, 5);
  const limiar = store.E?.regraValidacao?.limiarRelativo ?? 1.5;
  let corpo;
  if (!noPeriodo.length) corpo = '<p class="rk-vazio">Nenhum reel nesse período</p>';
  else if (!comValor.length) corpo = `<p class="rk-vazio">Sem dado de ${esc(met.nome.toLowerCase())} nesse período</p>`;
  else {
    const topo = comValor[0].v || 1;
    corpo = `<ol class="rk-lista">${comValor.map((x, i) => {
      const titulo = tituloReel(x.m, x.d);
      const thumb = /^https:\/\//i.test(x.m.thumb ?? '') ? `<img src="${esc(x.m.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : '';
      const rel = Number.isFinite(x.m.relativo)
        ? `<span class="pill ${x.m.relativo >= limiar ? 'pill-ok' : ''} rk-rel" title="Views ÷ mediana de views da conta">${fmtRel(x.m.relativo)} mediana</span>`
        : '<span class="pill rk-rel">sem régua</span>';
      return `
        <li>
          <button type="button" class="rk-item" data-rk-analisar="${esc(x.m.midiaId)}" data-foco="r:${esc(x.m.midiaId)}"
            aria-label="${i + 1}º lugar: ${esc(titulo)}, ${esc(valorFmt(x.v, met))} ${esc(met.un)}. Abrir a análise">
            <span class="rk-pos" aria-hidden="true">${i + 1}</span>
            <span class="rk-thumb" aria-hidden="true">${icone('play', 14)}${thumb}</span>
            <span class="rk-info">
              <strong>${esc(titulo)}</strong>
              <small>${dd(x.d.getDate())}/${dd(x.d.getMonth() + 1)}/${x.d.getFullYear()} · ${fmtN(x.m.views)} views</small>
              <span class="rk-barra" style="--p:${Math.max(0.04, x.v / topo).toFixed(3)}"></span>
            </span>
            <span class="rk-valor"><b>${esc(valorFmt(x.v, met))}</b><small>${esc(met.un)}</small></span>
            ${rel}
          </button>
        </li>`;
    }).join('')}</ol>`;
  }
  return `
    <div class="card rk-top">
      <div class="rk-top-cab">
        <h3>${esc(rotulo(st.gran, st.ref))}</h3>
        ${noPeriodo.length ? `<small class="ig-mudo">${contagem(noPeriodo.length)}</small>` : ''}
      </div>
      ${corpo}
    </div>`;
}

function html(proprios) {
  const itens = proprios.map((m) => ({ m, d: dataDo(m.timestamp) })).filter((x) => x.d);
  iniciar(itens);
  const met = metrica();
  return `
    <section class="rk" aria-label="Ranking dos reels">
      <div class="rk-controles">
        <div class="segmentado rk-seg" role="group" aria-label="Período do ranking">
          ${GRANS.map((g) => `<button type="button" data-rk-gran="${g.id}" data-foco="g:${g.id}" aria-pressed="${st.gran === g.id}">${g.nome}</button>`).join('')}
        </div>
        <div class="segmentado rk-seg" role="group" aria-label="Métrica do ranking">
          ${METRICAS.map((x) => `<button type="button" data-rk-metrica="${x.id}" data-foco="m:${x.id}" aria-pressed="${st.metrica === x.id}">${x.nome}</button>`).join('')}
        </div>
      </div>
      <div class="rk-corpo">
        ${calendarioHtml(itens, met)}
        ${topHtml(itens, met)}
      </div>
    </section>`;
}

// ── eventos ──────────────────────────────────────────────────────────────
function moverPeriodo(delta) {
  const nova = mover(st.gran, st.ref, delta);
  if (st.gran === 'semana') {
    const p = periodo('semana', nova);
    const vis = { inicio: st.mesVisto, fim: new Date(st.mesVisto.getFullYear(), st.mesVisto.getMonth() + 1, 1) };
    if (!cruza(p, vis)) st.mesVisto = primeiroDoMes(delta > 0 ? p.inicio : somaDias(p.fim, -1));
  }
  st.ref = nova;
  desenhar();
}

function escolherGran(g) {
  if (g === st.gran) return;
  // a semana nova é a que contém o início do período que estava na tela
  const p = periodo(st.gran, st.ref);
  st.gran = g;
  st.ref = g === 'semana' ? p.inicio : primeiroDoMes(p.inicio);
  st.mesVisto = primeiroDoMes(p.inicio);
  desenhar();
}

function desenhar() {
  if (!alvo?.el?.isConnected) return;
  const ativo = document.activeElement;
  const foco = alvo.el.contains(ativo) ? ativo.dataset?.foco : null;
  alvo.el.innerHTML = html(alvo.proprios);
  ligar();
  if (foco) alvo.el.querySelector(`[data-foco="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
}

function ligar() {
  const el = alvo.el;
  el.querySelectorAll('[data-rk-gran]').forEach((b) => (b.onclick = () => escolherGran(b.dataset.rkGran)));
  el.querySelectorAll('[data-rk-metrica]').forEach((b) => (b.onclick = () => { st.metrica = b.dataset.rkMetrica; desenhar(); }));
  el.querySelectorAll('[data-rk-mover]').forEach((b) => (b.onclick = () => moverPeriodo(Number(b.dataset.rkMover))));
  el.querySelectorAll('[data-rk-ref]').forEach((b) => (b.onclick = () => {
    st.ref = deIso(b.dataset.rkRef);
    desenhar();
  }));
  el.querySelectorAll('[data-rk-analisar]').forEach((b) => (b.onclick = () => alvo.aoAnalisar?.(b.dataset.rkAnalisar)));
  el.querySelectorAll('.rk-thumb img').forEach((img) => img.addEventListener('error', () => img.remove(), { once: true }));
  // setas do teclado no calendário andam de período em período
  const cal = el.querySelector('.c3');
  if (cal) cal.onkeydown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    moverPeriodo(e.key === 'ArrowLeft' ? -1 : 1);
    el.querySelector('.c3-unidade[aria-pressed="true"]')?.focus({ preventScroll: true });
  };
}

export function montar(el, proprios, { aoAnalisar } = {}) {
  if (!el) return;
  alvo = { el, proprios: (proprios ?? []).filter((m) => (m.tipo ?? 'REELS') === 'REELS'), aoAnalisar };
  desenhar();
}
