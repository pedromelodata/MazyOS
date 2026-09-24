// Cronograma do mês: calendário e KPIs (geral e por tipo). O card de cada tipo também filtra.
// Mês fica em store.ui; filtros de status e de tipo em variável de módulo.
import { esc, fmtData, STATUS, DIAS, TIPOS, store, formato, icone, tipoReel, formatoCurto, tipoFormato } from '../core.js';
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
  return u;
}

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
        // sem formato da biblioteca, o chip mostra o formato do calendário ("Carrossel 4:5")
        const livre = !f && r.formatoTexto ? formatoCurto(r.formatoTexto) : '';
        const dica = [r.ideia, t?.nome ?? 'sem tipo', f ? `${tipoFormato(f)}: ${f.nome} (${f.codigo})` : r.formatoTexto ?? ''].filter(Boolean).join(' · ');
        return `<button class="crono-chip" data-st="${esc(r.status)}" data-tipo="${esc(r.tipo ?? '')}" data-detalhar="${r.id}" title="${esc(dica)}">${t ? icone(t.icone, 12) : ''}${f ? `<b>${esc(tipoFormato(f))}</b> ` : livre ? `<b>${esc(livre)}</b> ` : ''}${esc(r.ideia)}</button>`;
      }).join('')}
      ${fora ? '' : `<button class="crono-add" data-criar-em="${iso}" aria-label="Novo reel em ${esc(fmtData(iso))}">+ reel</button>`}
    </div>`;
  }
  return html + '</div></div>';
}

// quantos reels de cada tipo no mês (com o filtro de status, sem o de tipo: é o mix do mês).
// Cada card é um botão que liga o filtro daquele tipo; clicar de novo volta pra "Todos"
function mixHtml(doMesTodos) {
  const total = doMesTodos.length;
  const semTipo = doMesTodos.filter((r) => !tipoReel(r.tipo)).length;
  return `
    <div class="crono-mix" role="group" aria-label="Reels do mês por tipo (clique pra filtrar)">
      ${TIPOS.map((t) => {
        const n = doMesTodos.filter((r) => r.tipo === t.id).length;
        const ativo = filtroTipo === t.id;
        return `<button type="button" class="kpi crono-mix-kpi" data-tipo="${t.id}" data-filtro-tipo="${ativo ? '' : t.id}" aria-pressed="${ativo}" title="${ativo ? 'Mostrar todos os tipos' : `Mostrar só ${esc(t.nome)}`}${total ? ` (${pct(n, total)}% do mês)` : ''}">
          <span class="crono-mix-ico">${icone(t.icone, 16)}</span>
          <b>${n}${total ? `<small>${pct(n, total)}%</small>` : ''}</b>
          <span>${esc(t.nome)}</span>
        </button>`;
      }).join('')}
      ${semTipo ? `<p class="crono-mix-nota">${semTipo} sem tipo</p>` : ''}
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
  const publicados = doMes.filter((r) => r.status === 'publicado').length;
  const tipoAtivo = tipoReel(filtroTipo);
  const meta = E.config?.metaMensal || 12;

  root.innerHTML = `
    <div class="crono">
      <header class="cabecalho-pagina">
        <div>
          <h1>Cronograma</h1>
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
      </div>

      <div class="crono-filtro-tipo">
        <span class="crono-filtro-rotulo" id="crono-tipo-rot">Tipo</span>
        <div class="segmentado" role="group" aria-labelledby="crono-tipo-rot">
          <button data-filtro-tipo="" aria-pressed="${!filtroTipo}">Todos</button>
          ${TIPOS.map((t) => `<button data-filtro-tipo="${t.id}" aria-pressed="${filtroTipo === t.id}">${icone(t.icone, 14)}${esc(t.nome)}</button>`).join('')}
        </div>
      </div>

      <div class="crono-resumo">
      <div class="crono-kpis">
        <div class="kpi"><b>${doMes.length}${tipoAtivo ? '' : `<small>/${meta}</small>`}</b><span>${tipoAtivo ? `${doMes.length === 1 ? 'reel' : 'reels'} de ${esc(tipoAtivo.nome)}` : 'reels no mês'}</span></div>
        <div class="kpi"><b>${publicados}</b><span>${publicados === 1 ? 'publicado' : 'publicados'}</span></div>
      </div>
      ${mixHtml(doMesTodos)}
      </div>

      ${filtroTipo && !doMes.length ? `<p class="crono-filtro-nota">Nenhum reel de ${esc(tipoAtivo?.nome ?? filtroTipo)} em ${esc(mes.toLocaleDateString('pt-BR', { month: 'long' }))}${filtroStatus ? ' com esse status' : ''}. <button type="button" class="crono-link" data-filtro-tipo="">Ver todos os tipos</button></p>` : ''}
      ${calendarioHtml(doMes, mes)}
    </div>
  `;

  const qq = (s) => [...root.querySelectorAll(s)];
  qq('[data-mes]').forEach((b) => (b.onclick = () => {
    const d = Number(b.dataset.mes);
    u.mesCronograma = d === 0 ? inicioMes() : new Date(mes.getFullYear(), mes.getMonth() + d, 1);
    render(root);
  }));
  root.querySelector('#crono-f-status').onchange = (e) => { filtroStatus = e.target.value; render(root); };
  qq('[data-filtro-tipo]').forEach((b) => (b.onclick = () => {
    // redesenhar tira o foco do botão: devolve pro card equivalente (teclado não se perde)
    const card = b.classList.contains('crono-mix-kpi') ? b.dataset.tipo : null;
    filtroTipo = b.dataset.filtroTipo;
    render(root);
    if (card) root.querySelector(`.crono-mix-kpi[data-tipo="${card}"]`)?.focus({ preventScroll: true });
  }));
  qq('[data-detalhar]').forEach((b) => (b.onclick = () => abrirDetalhe(b.dataset.detalhar)));
  qq('[data-criar-em]').forEach((b) => (b.onclick = () => abrirCriar({ data: b.dataset.criarEm })));
}
