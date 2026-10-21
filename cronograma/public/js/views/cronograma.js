// Cronograma do mês: o calendário, com os filtros de peça e de bloco (21/10: os KPIs e os cards saíram).
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
// 21/10 (Pedro): "tire os cards de métricas, deixe poucos filtros e o calendário apenas". Saíram a faixa da semana,
// os KPIs, o mix dos blocos e o filtro de status; ficam Peça e Bloco, em dois seletores na barra do mês. E "permita
// trocar um de lugar com o outro": soltar o card em cima de outro post troca os dois (dias diferentes: trocam de dia;
// mesmo dia: trocam de posição, que fica gravada em reel.ordem)
import {
  esc, DIAS, PECAS, store, formato, icone, tipoFormato, pecaInfo, tiposDaPeca, rotuloPeca, api, recarregar, toast, infoAprovacao,
  BLOCOS_ESTRATEGIA, blocoInfo, blocoDaPeca, nomePilar,
} from '../core.js';
import { abrirDetalhe } from '../detalhe.js';
import { objeto3d } from '../efeitos.js';
import { temStories, storiesVisiveis, mostrarStories, linhaStoriesHtml, abrirStories } from '../stories.js';
import { temVideos, marcaVideo } from '../videos-finais.js';
import { ligarArrasto } from '../arrastar-cronograma.js';

// 21/10 (Pedro): o filtro é pelos blocos da estratégia principal (Afeto, Educação, Diferencial, Conversão), não mais
// pelos tipos (viralização, vendas...). A variável guarda o id do bloco
let filtroTipo = '';
let filtroPeca = '';
let mesAjustado = false;

const inicioMes = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const chaveMes = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const nomeMes = (d) => { const s = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1); };
const hojeISO = () => new Date().toLocaleDateString('sv-SE');
// a peça passa no filtro se o tipo principal ou o segundo é o escolhido
const passaPeca = (r) => !filtroPeca || tiposDaPeca(r).includes(filtroPeca);
// no dia, a posição gravada (reel.ordem) manda; sem ela, a ordem em que a peça entrou
const porDiaEOrdem = (a, b) => a.data.localeCompare(b.data) || (a.ordem ?? 99) - (b.ordem ?? 99);

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
      <div class="crono-dia-topo"><span class="crono-num">${d.getDate()}</span></div>
      ${sto ? linhaStoriesHtml(sto) : ''}
      ${rs.map((r) => {
        const f = formato(r.formatoId);
        const bl = blocoInfo(blocoDaPeca(r));
        const [p1, p2] = tiposDaPeca(r);
        const video = temVideos(r);
        const arrasta = r.status !== 'publicado';
        const postado = r.status === 'publicado';
        // 21/10: aprovação técnica (relógio = com o diretor, bandeira amarela = ajuste, escudo verde = aprovada)
        const apv = postado ? null : infoAprovacao(r);
        const dica = [r.ideia, rotuloPeca(r, ' + '), bl ? bl.longo : 'sem bloco', nomePilar(r.pilar), f ? `${tipoFormato(f)}: ${f.nome} (${f.codigo})` : r.formatoTexto ?? '', video ? 'Vídeo final pronto' : '', postado ? 'Postado' : '', apv?.dica ?? '', arrasta ? 'Arraste pra outro dia, ou solte em cima de outro post pra trocar os dois' : ''].filter(Boolean).join(' · ');
        // 21/10: peça postada ganha o check no canto (o mesmo verde do "Postado" do painel)
        return `<button class="crono-chip" data-st="${esc(r.status)}" data-tipo="${esc(r.tipo ?? '')}" data-peca="${esc(p1)}"${p2 ? ` data-peca2="${esc(p2)}"` : ''} data-detalhar="${r.id}"${arrasta ? ' data-arrastavel' : ''} title="${esc(dica)}"><span class="crono-chip-peca">${pecasDoChip(r)}${video ? marcaVideo() : ''}${postado ? `<span class="crono-chip-ok" aria-label="Postado">${icone('check', 12)}</span>` : ''}${apv && !apv.curto ? `<span class="crono-chip-apv" data-estado="${esc(apv.estado)}" aria-label="${esc(apv.dica)}">${icone(apv.icone, 12)}</span>` : ''}</span><span class="crono-chip-titulo">${esc(r.ideia)}</span>${apv?.curto ? `<span class="crono-chip-flag" data-estado="${esc(apv.estado)}" aria-label="${esc(apv.dica)}">${icone(apv.icone, 11)}${esc(apv.curto)}</span>` : ''}</button>`;
      }).join('')}
    </div>`;
  }
  return html + '</div></div>';
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
  const passaTipo = (r) => !filtroTipo || blocoDaPeca(r) === filtroTipo;
  const doMes = E.reels.filter((r) => r.data?.startsWith(km) && passaPeca(r) && passaTipo(r)).sort(porDiaEOrdem);
  const tipoAtivo = blocoInfo(filtroTipo);
  const pecaAtiva = pecaInfo(filtroPeca);
  const filtrado = Boolean(tipoAtivo || pecaAtiva);
  const doFiltro = `${tipoAtivo ? ` de ${tipoAtivo.nome}` : ''}${pecaAtiva ? ` com ${pecaAtiva.nome}` : ''}`;
  const comStories = temStories();
  const stoLigado = comStories && storiesVisiveis();
  const stoMes = stoLigado && !filtroTipo && (!filtroPeca || filtroPeca === 'stories')
    ? E.stories.filter((s) => s.data?.startsWith(km))
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
        <select class="campo crono-filtro" id="crono-f-peca" aria-label="Filtrar por peça">
          <option value="">Todas as peças</option>
          ${PECAS.map((p) => `<option value="${p.id}" ${filtroPeca === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}
        </select>
        <select class="campo crono-filtro" id="crono-f-bloco" aria-label="Filtrar por bloco da estratégia">
          <option value="">Todos os blocos</option>
          ${BLOCOS_ESTRATEGIA.map((b) => `<option value="${esc(b.id)}" ${filtroTipo === b.id ? 'selected' : ''}>${esc(b.longo)}</option>`).join('')}
        </select>
        ${comStories ? `<label class="crono-sto-toggle"><input type="checkbox" id="crono-sto" ${stoLigado ? 'checked' : ''} /><span class="crono-sto-trilho" aria-hidden="true"></span><span>Stories do dia</span></label>` : ''}
      </div>

      ${semNada ? `<p class="crono-filtro-nota">Nenhuma peça${esc(doFiltro)} em ${esc(mes.toLocaleDateString('pt-BR', { month: 'long' }))}. <button type="button" class="crono-link" data-limpar-filtros>Limpar filtros</button></p>` : ''}
      ${calendarioHtml(doMes, mes, stoMes)}
    </div>
  `;

  const qq = (s) => [...root.querySelectorAll(s)];
  qq('[data-mes]').forEach((b) => (b.onclick = () => {
    const d = Number(b.dataset.mes);
    u.mesCronograma = d === 0 ? inicioMes() : new Date(mes.getFullYear(), mes.getMonth() + d, 1);
    render(root);
  }));
  // redesenhar tira o foco do seletor: devolve pra ele (teclado não se perde)
  for (const [sel, guardar] of [['#crono-f-peca', (v) => (filtroPeca = v)], ['#crono-f-bloco', (v) => (filtroTipo = v)]]) {
    root.querySelector(sel).onchange = (e) => { guardar(e.target.value); render(root); root.querySelector(sel)?.focus({ preventScroll: true }); };
  }
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
    aoTrocar: (id, comId) => trocarPecas(root, id, comId),
  });
}

// ── arrastar a peça pra outro dia ─────────────────────────────────────────
const diaCurto = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
// o título entre aspas no aviso, sem dobrar quando a ideia já começa com aspas (as do calendário da semana)
const entreAspas = (s) => (/^["“]/.test(s) ? s : `"${s}"`);

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
    avisoDesfazer(`${entreAspas(r.ideia)} foi pra ${diaCurto(para)}.${extra}`, () => moverPeca(root, id, de, para, { desfazendo: true }));
  }
  recarregar().catch(() => {});
}

// soltar um post em cima de outro: os dois trocam de lugar. Dias diferentes: trocam de dia (e de posição no dia);
// mesmo dia: trocam de posição, e todas as peças do dia ganham a ordem gravada (0, 1, 2...)
async function trocarPecas(root, id, comId) {
  const E = store.E;
  const a = E?.reels.find((x) => x.id === id);
  const b = E?.reels.find((x) => x.id === comId);
  if (!a || !b || a === b || !a.data || !b.data) return;
  let mudancas;
  if (a.data === b.data) {
    const doDia = E.reels.filter((r) => r.data === a.data).sort(porDiaEOrdem);
    const ia = doDia.indexOf(a);
    const ib = doDia.indexOf(b);
    [doDia[ia], doDia[ib]] = [doDia[ib], doDia[ia]];
    mudancas = doDia.map((r, i) => ({ r, campos: { ordem: i } })).filter((m) => m.r.ordem !== m.campos.ordem);
  } else {
    mudancas = [
      { r: a, campos: { data: b.data, ordem: b.ordem ?? null } },
      { r: b, campos: { data: a.data, ordem: a.ordem ?? null } },
    ];
  }
  const texto = a.data === b.data
    ? `${entreAspas(a.ideia)} e ${entreAspas(b.ideia)} trocaram de posição em ${diaCurto(a.data)}.`
    : `${entreAspas(a.ideia)} foi pra ${diaCurto(b.data)} e ${entreAspas(b.ideia)} foi pra ${diaCurto(a.data)}.`;
  await mudarPecas(root, mudancas, { texto });
}

// grava as mudanças uma peça por vez; se uma falhar, tudo volta (na tela e no que já tinha gravado)
async function mudarPecas(root, mudancas, { texto = '', desfazendo = false } = {}) {
  const volta = mudancas.map(({ r, campos }) => ({ r, campos: Object.fromEntries(Object.keys(campos).map((k) => [k, r[k] ?? (k === 'ordem' ? null : '')])) }));
  for (const { r, campos } of mudancas) Object.assign(r, campos);
  render(root);
  const feitos = [];
  try {
    for (const m of mudancas) {
      await api('PUT', `/api/reels/${encodeURIComponent(m.r.id)}`, m.campos);
      feitos.push(m.r);
    }
  } catch (e) {
    for (const { r, campos } of volta) Object.assign(r, campos);
    render(root);
    await Promise.allSettled(volta.filter((v) => feitos.includes(v.r)).map((v) => api('PUT', `/api/reels/${encodeURIComponent(v.r.id)}`, v.campos)));
    toast(`Não deu pra trocar de lugar: ${e.message}`);
    return;
  }
  if (desfazendo) { esconderDesfazer(); toast('Voltou como estava'); }
  else avisoDesfazer(texto, () => mudarPecas(root, volta, { desfazendo: true }));
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
