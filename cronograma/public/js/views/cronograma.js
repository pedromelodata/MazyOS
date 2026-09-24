// Cronograma do mês: lista por semana ou calendário, KPIs (geral e por tipo) e reels sem data.
// Porta da v1. Mês e visão ficam em store.ui; filtros de status e de tipo em variável de módulo.
import { esc, fmtData, STATUS, DIAS, TIPOS, store, api, recarregar, toast, formato, icone, lerLocal, gravarLocal, tipoReel, pillTipo } from '../core.js';
import { abrirDetalhe } from '../detalhe.js';
import { abrirCriar } from '../chat.js';
import { objeto3d } from '../efeitos.js';

let filtroStatus = '';
let filtroTipo = '';
let mesAjustado = false;

const inicioMes = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const chaveMes = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const nomeMes = (d) => { const s = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1); };
const hojeISO = () => new Date().toLocaleDateString('sv-SE');
const rotulo = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
const dataDe = (iso) => new Date(iso + 'T12:00');
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

function ui() {
  const u = store.ui;
  if (!(u.mesCronograma instanceof Date)) u.mesCronograma = inicioMes();
  if (!u.visaoCronograma) u.visaoCronograma = lerLocal('cronograma-visao') || 'lista';
  return u;
}

function pillFormato(r) {
  const f = formato(r.formatoId);
  if (f) {
    const dica = `${f.codigo} · ${f.nome} (${f.status === 'validado' ? 'validado' : 'em teste'})`;
    return `<span class="pill crono-fmt" title="${esc(dica)}"><i class="ponto-fmt ${esc(f.status)}"></i>${esc(f.codigo)} · ${esc(f.categoria)}</span>`;
  }
  const livre = (r.formatoTexto ?? '').split(',')[0];
  return `<span class="pill crono-fmt" title="${esc(livre || 'Formato livre')}">${esc(livre || 'Formato livre')}</span>`;
}

// dia da semana em cima, número grande, mês embaixo: dá pra ler a data sem abrir o reel
function diaHtml(r) {
  if (!r.data) return '<div class="crono-dia sem">sem data</div>';
  const d = dataDe(r.data);
  const fds = d.getDay() === 0 || d.getDay() === 6;
  const longo = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const mes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `<div class="crono-dia${fds ? ' fds' : ''}${r.data === hojeISO() ? ' hoje' : ''}" title="${esc(longo)}">
      <span class="crono-dia-sem">${DIAS[d.getDay()]}</span><b>${String(d.getDate()).padStart(2, '0')}</b><span class="crono-dia-mes">${esc(mes)}</span>
    </div>`;
}

function linhaHtml(r) {
  return `
    <li class="crono-linha" data-linha="${r.id}">
      ${diaHtml(r)}
      <div class="crono-ideia"><strong>${esc(r.ideia)}</strong><span>${r.data ? `${esc(fmtData(r.data, { diaSemana: true }))} · ` : ''}${esc(r.tema)}</span></div>
      <div class="crono-col-tipo">${pillTipo(r.tipo)}</div>
      <div class="crono-col-formato">${pillFormato(r)}</div>
      <select class="campo status-reel crono-status" data-st="${esc(r.status)}" data-status="${r.id}" aria-label="Status de ${esc(r.ideia)}">
        ${STATUS.map((s) => `<option value="${s}" ${r.status === s ? 'selected' : ''}>${esc(rotulo(s))}</option>`).join('')}
      </select>
      <button class="btn btn-sm" data-detalhar="${r.id}" aria-label="Detalhar ${esc(r.ideia)}">Detalhar</button>
    </li>`;
}

const cabecalhoLista = `<li class="crono-linha crono-cab" aria-hidden="true"><span>Data</span><span>Ideia · tema</span><span class="crono-col-tipo">Tipo</span><span class="crono-col-formato">Formato</span><span>Status</span><span></span></li>`;

function listaHtml(doMes, semData, mes) {
  if (!doMes.length && !semData.length) {
    return filtroTipo || filtroStatus
      ? `<div class="card vazio"><strong>Nenhum reel com esse filtro</strong><p>Troque o tipo ou o status, ou volte pra "Todos".</p></div>`
      : `<div class="card vazio">${objeto3d('growth')}<strong>Nenhum reel aqui ainda</strong><p>Use "+ Novo reel" pra montar o primeiro com a skill.</p></div>`;
  }
  const semanas = new Map();
  for (const r of doMes) {
    const d = dataDe(r.data);
    const ini = new Date(d); ini.setDate(d.getDate() - d.getDay());
    const k = fmtData(ini.toLocaleDateString('sv-SE'));
    if (!semanas.has(k)) semanas.set(k, []);
    semanas.get(k).push(r);
  }
  let html = '';
  for (const [k, rs] of semanas)
    html += `<div class="crono-grupo">Semana de ${esc(k)} <span>${rs.length}</span></div><div class="card crono-cartao"><ul class="crono-lista">${cabecalhoLista}${rs.map(linhaHtml).join('')}</ul></div>`;
  if (!doMes.length) html += `<div class="card vazio">${objeto3d('growth')}<strong>Nada agendado em ${esc(mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))}</strong><p>Dê uma data aos reels sem data ou crie um novo.</p><button class="btn btn-primario" data-criar-em="">${icone('mais', 16)} Novo reel</button></div>`;
  return html + semDataHtml(semData);
}

const semDataHtml = (semData) => (semData.length
  ? `<div class="crono-grupo">Sem data <span>${semData.length}</span></div><div class="card crono-cartao"><ul class="crono-lista">${semData.map(linhaHtml).join('')}</ul></div>`
  : '');

function calendarioHtml(doMes, mes) {
  const ini = new Date(mes); ini.setDate(1 - ini.getDay());
  const hoje = hojeISO();
  let html = `<div class="crono-cal-rolagem"><div class="crono-cal">${DIAS.map((d) => `<div class="crono-cal-cab">${d}</div>`).join('')}`;
  for (let i = 0; i < 42; i++) {
    const d = new Date(ini); d.setDate(ini.getDate() + i);
    const iso = d.toLocaleDateString('sv-SE');
    const fora = d.getMonth() !== mes.getMonth();
    if (i >= 35 && fora) break;
    const fds = d.getDay() === 0 || d.getDay() === 6;
    const rs = doMes.filter((r) => r.data === iso);
    html += `<div class="crono-cal-dia ${fora ? 'fora' : ''} ${iso === hoje ? 'hoje' : ''} ${fds ? 'fds' : ''}">
      <span class="crono-num">${d.getDate()}</span>
      ${rs.map((r) => {
        const f = formato(r.formatoId);
        const t = tipoReel(r.tipo);
        const dica = [r.ideia, t?.nome ?? 'sem tipo', f ? `${f.codigo} · ${f.nome}` : ''].filter(Boolean).join(' · ');
        return `<button class="crono-chip" data-st="${esc(r.status)}" data-tipo="${esc(r.tipo ?? '')}" data-detalhar="${r.id}" title="${esc(dica)}">${t ? icone(t.icone, 12) : ''}${f ? `<b>${esc(f.codigo)}</b> ` : ''}${esc(r.ideia)}</button>`;
      }).join('')}
      ${fora ? '' : `<button class="crono-add" data-criar-em="${iso}" aria-label="Novo reel em ${esc(fmtData(iso))}">+ reel</button>`}
    </div>`;
  }
  return html + '</div></div>';
}

// quantos reels de cada tipo no mês (com o filtro de status, sem o de tipo: é o mix do mês)
function mixHtml(doMesTodos) {
  const total = doMesTodos.length;
  const semTipo = doMesTodos.filter((r) => !tipoReel(r.tipo)).length;
  return `
    <div class="crono-mix" aria-label="Reels do mês por tipo">
      ${TIPOS.map((t) => {
        const n = doMesTodos.filter((r) => r.tipo === t.id).length;
        return `<div class="kpi crono-mix-kpi" data-tipo="${t.id}">
          <span class="crono-mix-ico">${icone(t.icone, 16)}</span>
          <b>${n}</b>
          <span>${esc(t.nome)}${total ? ` · ${pct(n, total)}% do mês` : ''}</span>
        </div>`;
      }).join('')}
      ${semTipo ? `<p class="crono-mix-nota">${semTipo} ${semTipo === 1 ? 'reel sem tipo' : 'reels sem tipo'} no mês: escolha o tipo no detalhe.</p>` : ''}
    </div>`;
}

export function render(root) {
  const E = store.E;
  if (!E) { root.innerHTML = '<div class="vazio">Carregando...</div>'; return; }
  const u = ui();

  // primeira abertura: se o mês atual está vazio, pula pro próximo mês com reel
  if (!mesAjustado) {
    mesAjustado = true;
    if (!E.reels.some((r) => r.data?.startsWith(chaveMes(u.mesCronograma)))) {
      const prox = E.reels.map((r) => r.data).filter(Boolean).sort().find((d) => d >= hojeISO());
      if (prox) u.mesCronograma = new Date(Number(prox.slice(0, 4)), Number(prox.slice(5, 7)) - 1, 1);
    }
  }

  const mes = u.mesCronograma;
  const km = chaveMes(mes);
  const porStatus = E.reels.filter((r) => !filtroStatus || r.status === filtroStatus);
  const doMesTodos = porStatus.filter((r) => r.data?.startsWith(km));
  const passaTipo = (r) => !filtroTipo || r.tipo === filtroTipo;
  const doMes = doMesTodos.filter(passaTipo).sort((a, b) => a.data.localeCompare(b.data));
  const semData = porStatus.filter((r) => !r.data && passaTipo(r));
  const publicados = doMesTodos.filter((r) => r.status === 'publicado').length;
  const validados = doMesTodos.filter((r) => formato(r.formatoId)?.status === 'validado').length;
  const semDataTodos = porStatus.filter((r) => !r.data).length;
  const meta = E.config?.metaMensal || 12;

  root.innerHTML = `
    <div class="crono">
      <header class="cabecalho-pagina">
        <div>
          <h1>Cronograma</h1>
          <p>Os reels do mês, da ideia ao publicado.</p>
        </div>
        <div class="acoes">
          <button class="btn btn-primario" id="crono-novo">${icone('mais', 16)} Novo reel</button>
        </div>
        ${objeto3d('calendario')}
      </header>

      <div class="crono-barra">
        <div class="crono-mes">
          <button class="btn-icone" data-mes="-1" aria-label="Mês anterior">‹</button>
          <h2>${esc(nomeMes(mes))}</h2>
          <button class="btn-icone" data-mes="1" aria-label="Próximo mês">›</button>
        </div>
        <button class="btn btn-fantasma btn-sm" data-mes="0">Hoje</button>
        <span class="crono-espaco"></span>
        <select class="campo crono-filtro" id="crono-f-status" aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          ${STATUS.map((s) => `<option value="${s}" ${filtroStatus === s ? 'selected' : ''}>${esc(rotulo(s))}</option>`).join('')}
        </select>
        <div class="segmentado" role="group" aria-label="Visualização">
          <button data-visao="lista" aria-pressed="${u.visaoCronograma === 'lista'}">Lista</button>
          <button data-visao="calendario" aria-pressed="${u.visaoCronograma === 'calendario'}">Calendário</button>
        </div>
      </div>

      <div class="crono-filtro-tipo">
        <span class="crono-filtro-rotulo" id="crono-tipo-rot">Tipo</span>
        <div class="segmentado" role="group" aria-labelledby="crono-tipo-rot">
          <button data-filtro-tipo="" aria-pressed="${!filtroTipo}">Todos</button>
          ${TIPOS.map((t) => `<button data-filtro-tipo="${t.id}" aria-pressed="${filtroTipo === t.id}">${icone(t.icone, 14)}${esc(t.nome)}</button>`).join('')}
        </div>
      </div>

      <div class="crono-kpis">
        <div class="kpi"><b>${doMesTodos.length}<small>/${meta}</small></b><span>reels no mês</span></div>
        <div class="kpi"><b>${publicados}</b><span>publicados</span></div>
        <div class="kpi"><b>${validados}</b><span>em formato validado</span></div>
        <div class="kpi"><b>${semDataTodos}</b><span>sem data</span></div>
      </div>
      ${mixHtml(doMesTodos)}

      ${u.visaoCronograma === 'calendario' ? calendarioHtml(doMes, mes) + semDataHtml(semData) : listaHtml(doMes, semData, mes)}
    </div>
  `;

  const qq = (s) => [...root.querySelectorAll(s)];
  qq('[data-mes]').forEach((b) => (b.onclick = () => {
    const d = Number(b.dataset.mes);
    u.mesCronograma = d === 0 ? inicioMes() : new Date(mes.getFullYear(), mes.getMonth() + d, 1);
    render(root);
  }));
  root.querySelector('#crono-f-status').onchange = (e) => { filtroStatus = e.target.value; render(root); };
  qq('[data-filtro-tipo]').forEach((b) => (b.onclick = () => { filtroTipo = b.dataset.filtroTipo; render(root); }));
  qq('[data-visao]').forEach((b) => (b.onclick = () => {
    u.visaoCronograma = b.dataset.visao;
    gravarLocal('cronograma-visao', u.visaoCronograma);
    render(root);
  }));
  root.querySelector('#crono-novo').onclick = () => abrirCriar();
  qq('[data-detalhar]').forEach((b) => (b.onclick = () => abrirDetalhe(b.dataset.detalhar)));
  qq('[data-criar-em]').forEach((b) => (b.onclick = () => abrirCriar({ data: b.dataset.criarEm })));
  qq('[data-linha]').forEach((li) => (li.onclick = (e) => {
    if (e.target.closest('select, button, a')) return;
    abrirDetalhe(li.dataset.linha);
  }));
  qq('[data-status]').forEach((s) => (s.onchange = async () => {
    const antes = s.dataset.st;
    s.dataset.st = s.value;
    try {
      await api('PUT', `/api/reels/${s.dataset.status}`, { status: s.value });
      toast(`Status: ${rotulo(s.value)}`);
      await recarregar();
    } catch (e) {
      // não ficou salvo: volta o select pro valor anterior e tenta redesenhar com o servidor
      s.value = s.dataset.st = antes;
      toast(e.message);
      recarregar().catch(() => {});
    }
  }));
}
