// Cronograma do mês: calendário e KPIs (geral e por tipo). O card de cada tipo também filtra.
// Mês fica em store.ui; filtros de status, de tipo e de peça em variável de módulo.
// 24/09: cada peça do mês pode ser reel, carrossel, estático ou stories: o chip mostra o tipo de peça.
// 25/09: peça dupla (Stories + Reel) mostra os dois tipos no chip; filtro de peça (casa com peca ou peca2);
// o calendário não cria peça: o único caminho é o "Novo reel" do menu.
// 28/09: stories do dia (stories.js) numa linha discreta ao lado do número do dia, com o interruptor
// "Stories do dia" na barra (escolha de cada navegador). Fora dos KPIs e do mix; o filtro de Peça em
// Todas ou Stories mostra, os outros escondem; filtro de tipo esconde; o de status vale se bate
// 02/10: peça com vídeo final (reel.videos) ganha a marca pequena de play no canto do chip
// 09/10: o card da peça arrasta pra outro dia (arrastar-cronograma.js), menos a peça publicada. Solta, a peça muda
// de dia na hora, o servidor grava (PUT /api/reels/:id { data }) e um aviso oferece desfazer. Os stories do dia não
// arrastam: eles são do dia.
import { esc, STATUS, DIAS, TIPOS, PECAS, store, formato, icone, tipoReel, tipoFormato, pecaInfo, tiposDaPeca, rotuloPeca, api, recarregar, toast, infoAprovacao, metaDoMes, NOME_BLOCO, fmtData } from '../core.js';
import { abrirDetalhe } from '../detalhe.js';
import { objeto3d } from '../efeitos.js';
import { temStories, storiesVisiveis, mostrarStories, linhaStoriesHtml, abrirStories } from '../stories.js';
import { temVideos, marcaVideo } from '../videos-finais.js';
import { ligarArrasto } from '../arrastar-cronograma.js';

let filtroStatus = '';
let filtroTipo = '';
let filtroPeca = '';
let mesAjustado = false;

const inicioMes = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const chaveMes = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const nomeMes = (d) => { const s = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1); };
const hojeISO = () => new Date().toLocaleDateString('sv-SE');
const rotulo = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
// a peça passa no filtro se o tipo principal ou o segundo é o escolhido
const passaPeca = (r) => !filtroPeca || tiposDaPeca(r).includes(filtroPeca);

function ui() {
  const u = store.ui;
  if (!(u.mesCronograma instanceof Date)) u.mesCronograma = inicioMes();
  return u;
}

// um ícone (e o nome) por tipo de peça: "Stories + Reel" mostra os dois
const pecasDoChip = (r) => tiposDaPeca(r).map((t) => {
  const p = pecaInfo(t);
  return `<span class="crono-chip-tipo">${icone(p.icone, 12)}<b>${esc(p.nome)}</b></span>`;
}).join('');

function calendarioHtml(doMes, mes, stories = []) {
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
    const sto = fora ? null : stories.find((s) => s.data === iso);
    html += `<div class="crono-cal-dia ${fora ? 'fora' : ''} ${iso === hoje ? 'hoje' : ''} ${fds ? 'fds' : ''}" data-dia="${iso}">
      <div class="crono-dia-topo"><span class="crono-num">${d.getDate()}</span>${sto ? linhaStoriesHtml(sto) : ''}</div>
      ${rs.map((r) => {
        const f = formato(r.formatoId);
        const t = tipoReel(r.tipo);
        const [p1, p2] = tiposDaPeca(r);
        const video = temVideos(r);
        const arrasta = r.status !== 'publicado';
        const postado = r.status === 'publicado';
        // 21/10: aprovação técnica (relógio = com o diretor, bandeira amarela = ajuste, escudo verde = aprovada)
        const apv = postado ? null : infoAprovacao(r);
        const dica = [r.ideia, rotuloPeca(r, ' + '), t?.nome ?? 'sem tipo', f ? `${tipoFormato(f)}: ${f.nome} (${f.codigo})` : r.formatoTexto ?? '', video ? 'Vídeo final pronto' : '', postado ? 'Postado' : '', apv?.dica ?? '', arrasta ? 'Arraste pra outro dia' : ''].filter(Boolean).join(' · ');
        // 21/10: peça postada ganha o check no canto (o mesmo verde do "Postado" do painel)
        return `<button class="crono-chip" data-st="${esc(r.status)}" data-tipo="${esc(r.tipo ?? '')}" data-peca="${esc(p1)}"${p2 ? ` data-peca2="${esc(p2)}"` : ''} data-detalhar="${r.id}"${arrasta ? ' data-arrastavel' : ''} title="${esc(dica)}"><span class="crono-chip-peca">${pecasDoChip(r)}${video ? marcaVideo() : ''}${postado ? `<span class="crono-chip-ok" aria-label="Postado">${icone('check', 12)}</span>` : ''}${apv && !apv.curto ? `<span class="crono-chip-apv" data-estado="${esc(apv.estado)}" aria-label="${esc(apv.dica)}">${icone(apv.icone, 12)}</span>` : ''}</span><span class="crono-chip-titulo">${esc(r.ideia)}</span>${apv?.curto ? `<span class="crono-chip-flag" data-estado="${esc(apv.estado)}" aria-label="${esc(apv.dica)}">${icone(apv.icone, 11)}${esc(apv.curto)}</span>` : ''}</button>`;
      }).join('')}
    </div>`;
  }
  return html + '</div></div>';
}

// quantos itens de cada tipo no mês (com os filtros de status e de peça, sem o de tipo: é o mix do mês).
// Cada card é um botão que liga o filtro daquele tipo; clicar de novo volta pra "Todos"
function mixHtml(doMesTodos) {
  const total = doMesTodos.length;
  const semTipo = doMesTodos.filter((r) => !tipoReel(r.tipo)).length;
  return `
    <div class="crono-mix" role="group" aria-label="Peças do mês por tipo (clique pra filtrar)">
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

// 21/10 (estratégia principal): a semana de hoje contra o volume travado (3 reels, 5 feeds, 5 temas de stories),
// o horário do feed e o mix dos blocos do mês contra a fatia de cada um (20/30/25/25)
function semanaHtml(E, doMesTodos) {
  const vs = E.config?.volumeSemanal;
  if (!vs) return '';
  const h = new Date();
  const ini = new Date(h.getFullYear(), h.getMonth(), h.getDate() - ((h.getDay() + 6) % 7));
  const fim = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + 6);
  const [a, b] = [ini, fim].map((d) => d.toLocaleDateString('sv-SE'));
  const daSemana = E.reels.filter((r) => r.data >= a && r.data <= b);
  const n = {
    reels: daSemana.filter((r) => (r.peca ?? 'reel') === 'reel').length,
    feeds: daSemana.filter((r) => ['carrossel', 'estatico'].includes(r.peca)).length,
    storiesTemas: (E.stories ?? []).filter((s) => s.data >= a && s.data <= b).length,
  };
  const item = (k, nome) => `<span class="crono-sem-item" data-ok="${n[k] >= (vs[k] ?? 0)}"><b>${n[k]}</b><small>/${vs[k] ?? 0}</small> ${nome}</span>`;
  const alvo = E.config?.mixBlocos;
  const blocos = alvo && doMesTodos.length
    ? Object.entries(alvo).map(([bl, pctAlvo]) => {
      const p = Math.round((doMesTodos.filter((r) => r.bloco === bl).length / doMesTodos.length) * 100);
      return `<span class="crono-sem-bloco" title="${esc(NOME_BLOCO[bl] ?? bl)}: ${p}% das peças do mês (fatia da estratégia: ${pctAlvo}%)">${esc(bl)} <b>${p}%</b><small>/${pctAlvo}%</small></span>`;
    }).join('')
    : '';
  return `
    <div class="crono-semana" role="note" aria-label="Volume da semana e mix dos blocos">
      <span class="crono-sem-rot">Esta semana · ${esc(fmtData(a))} a ${esc(fmtData(b))}</span>
      ${item('reels', 'reels')}${item('feeds', 'feeds')}${item('storiesTemas', 'temas de stories')}
      ${E.config?.horarioFeed ? `<span class="crono-sem-hora">${icone('relogio', 13)}Feed às ${esc(E.config.horarioFeed)}</span>` : ''}
      ${blocos ? `<span class="crono-sem-quebra"></span><span class="crono-sem-rot">Blocos do mês</span>${blocos}` : ''}
    </div>`;
}

export function render(root) {
  const E = store.E;
  if (!E) { root.innerHTML = '<div class="vazio">Carregando...</div>'; return; }
  const u = ui();

  // primeira abertura: se o mês atual está vazio, pula pro próximo mês com peça
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
  const doMesTodos = porStatus.filter((r) => r.data?.startsWith(km) && passaPeca(r));
  const passaTipo = (r) => !filtroTipo || r.tipo === filtroTipo;
  const doMes = doMesTodos.filter(passaTipo).sort((a, b) => a.data.localeCompare(b.data));
  const publicados = doMes.filter((r) => r.status === 'publicado').length;
  const tipoAtivo = tipoReel(filtroTipo);
  const pecaAtiva = pecaInfo(filtroPeca);
  const filtrado = Boolean(tipoAtivo || pecaAtiva);
  const meta = metaDoMes(mes);
  const doFiltro = `${tipoAtivo ? ` de ${tipoAtivo.nome}` : ''}${pecaAtiva ? ` com ${pecaAtiva.nome}` : ''}`;
  const rotuloKpi = filtrado ? `${doMes.length === 1 ? 'peça' : 'peças'}${doFiltro}` : 'peças no mês';
  // stories do dia: só no calendário (os KPIs e o mix contam só as peças do feed)
  const comStories = temStories();
  const stoLigado = comStories && storiesVisiveis();
  const stoMes = stoLigado && !filtroTipo && (!filtroPeca || filtroPeca === 'stories')
    ? E.stories.filter((s) => s.data?.startsWith(km) && (!filtroStatus || s.status === filtroStatus))
    : [];
  const semNada = filtrado && !doMes.length && !stoMes.length;

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
        ${comStories ? `<label class="crono-sto-toggle"><input type="checkbox" id="crono-sto" ${stoLigado ? 'checked' : ''} /><span class="crono-sto-trilho" aria-hidden="true"></span><span>Stories do dia</span></label>` : ''}
        <select class="campo crono-filtro" id="crono-f-status" aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          ${STATUS.map((s) => `<option value="${s}" ${filtroStatus === s ? 'selected' : ''}>${esc(rotulo(s))}</option>`).join('')}
        </select>
      </div>

      <div class="crono-filtro-tipo">
        <div class="crono-filtro-grupo">
          <span class="crono-filtro-rotulo" id="crono-tipo-rot">Tipo</span>
          <div class="segmentado" role="group" aria-labelledby="crono-tipo-rot">
            <button data-filtro-tipo="" aria-pressed="${!filtroTipo}">Todos</button>
            ${TIPOS.map((t) => `<button data-filtro-tipo="${t.id}" aria-pressed="${filtroTipo === t.id}">${icone(t.icone, 14)}${esc(t.nome)}</button>`).join('')}
          </div>
        </div>
        <div class="crono-filtro-grupo">
          <span class="crono-filtro-rotulo" id="crono-peca-rot">Peça</span>
          <div class="segmentado" role="group" aria-labelledby="crono-peca-rot">
            <button data-filtro-peca="" aria-pressed="${!filtroPeca}">Todas</button>
            ${PECAS.map((p) => `<button data-filtro-peca="${p.id}" aria-pressed="${filtroPeca === p.id}">${icone(p.icone, 14)}${esc(p.nome)}</button>`).join('')}
          </div>
        </div>
      </div>

      ${semanaHtml(E, doMesTodos)}

      <div class="crono-resumo">
      <div class="crono-kpis">
        <div class="kpi"><b>${doMes.length}${filtrado ? '' : `<small>/${meta}</small>`}</b><span>${esc(rotuloKpi)}</span></div>
        <div class="kpi"><b>${publicados}</b><span>${publicados === 1 ? 'publicado' : 'publicados'}</span></div>
      </div>
      ${mixHtml(doMesTodos)}
      </div>

      ${semNada ? `<p class="crono-filtro-nota">Nenhuma peça${esc(doFiltro)} em ${esc(mes.toLocaleDateString('pt-BR', { month: 'long' }))}${filtroStatus ? ' com esse status' : ''}. <button type="button" class="crono-link" data-limpar-filtros>Limpar filtros</button></p>` : ''}
      ${calendarioHtml(doMes, mes, stoMes)}
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
  qq('[data-filtro-peca]').forEach((b) => (b.onclick = () => {
    filtroPeca = b.dataset.filtroPeca;
    render(root);
    root.querySelector(`[data-filtro-peca="${filtroPeca}"]`)?.focus({ preventScroll: true });
  }));
  qq('[data-limpar-filtros]').forEach((b) => (b.onclick = () => {
    filtroTipo = '';
    filtroPeca = '';
    render(root);
  }));
  qq('[data-detalhar]').forEach((b) => (b.onclick = () => abrirDetalhe(b.dataset.detalhar)));
  qq('[data-stories]').forEach((b) => (b.onclick = () => abrirStories(b.dataset.stories)));
  const toggle = root.querySelector('#crono-sto');
  if (toggle) toggle.onchange = () => {
    mostrarStories(toggle.checked);
    render(root);
    root.querySelector('#crono-sto')?.focus({ preventScroll: true });
  };
  ligarArrasto(root, {
    podeArrastar: (chip) => chip.dataset.st !== 'publicado',
    aoSoltar: (id, para, de) => moverPeca(root, id, para, de),
  });
}

// ── arrastar a peça pra outro dia ─────────────────────────────────────────
const diaCurto = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

// a peça muda de dia na tela na hora; o servidor grava; se falhar, ela volta pro dia de antes
async function moverPeca(root, id, para, de, { desfazendo = false } = {}) {
  const r = store.E?.reels.find((x) => x.id === id);
  if (!r || r.data === para) return;
  r.data = para;
  render(root);
  try {
    await api('PUT', `/api/reels/${encodeURIComponent(id)}`, { data: para });
  } catch (e) {
    r.data = de;
    render(root);
    toast(`Não deu pra mudar o dia: ${e.message}`);
    return;
  }
  if (desfazendo) { esconderDesfazer(); toast(`Voltou pra ${diaCurto(para)}`); }
  else {
    // os stories do dia de antes podem falar dessa peça (pecaDoDia): avisa, não mexe neles
    const sto = (store.E?.stories ?? []).find((s) => s.pecaDoDia === id && s.data === de);
    const extra = sto ? ` Os stories de ${diaCurto(de)} falam dela.` : '';
    avisoDesfazer(`"${r.ideia}" foi pra ${diaCurto(para)}.${extra}`, () => moverPeca(root, id, de, para, { desfazendo: true }));
  }
  recarregar().catch(() => {});
}

let tempoDesfazer = 0;
function esconderDesfazer() {
  clearTimeout(tempoDesfazer);
  const el = document.getElementById('crono-desfazer');
  if (el) el.hidden = true;
}
function avisoDesfazer(texto, aoDesfazer) {
  let el = document.getElementById('crono-desfazer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'crono-desfazer';
    el.className = 'toast crono-desfazer';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.innerHTML = `<span>${esc(texto)}</span><button type="button" class="crono-desfazer-btn">Desfazer</button>`;
  el.querySelector('button').onclick = () => { esconderDesfazer(); aoDesfazer(); };
  el.hidden = false;
  clearTimeout(tempoDesfazer);
  tempoDesfazer = setTimeout(esconderDesfazer, 7000);
}
