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
// 21/10 (Pedro): "Sugestões da semana" na barra abre o painel da semana (sugestoes.js): o resumo do mecanismo, o que o
// gerador de segunda fez e os temas da pesquisa no Google, com "Pôr no dia". O calendário continua limpo: o mecanismo só
// aparece como um ícone pequeno de alerta no chip da peça que ele acusa (repetição, convite de venda em post de atração),
// com o texto na dica. A análise de cada semana à vista vem de GET /api/mecanismo (mecanismo.js) depois do desenho
// 22/10 (Pedro): "Dê opção no sistema de mandar vários para a aprovação, o post juntamente com os story". O botão "Mandar
// vários pra aprovação" da barra liga o modo de seleção: clicar (ou tocar) num post ou num story marca e desmarca; o que
// não pode ir (esperando aprovação, aprovado, postado, story sem tema) fica apagado, com o motivo na dica e num aviso ao
// tocar; o número do dia vira o atalho "Marcar o post e o story do dia". A barra de baixo conta os selecionados e o
// "Continuar" abre o painel com a explicação de cada um (lote-aprovacao.js, abrirLote). Esc ou "Cancelar" sai do modo.
// Fora do modo, arrastar e trocar de lugar continuam como antes; no modo, o arrasto fica desligado.
// Decisões fora do contrato: a seleção vale entre os meses (trocar de mês não desmarca) e até 30 itens (o limite do
// servidor); sair do Cronograma pra outra tela desliga o modo; o que foi pra aprovação sai da seleção e, sem nada
// marcado, o modo desliga sozinho
import {
  esc, DIAS, PECAS, store, formato, icone, tipoFormato, pecaInfo, tiposDaPeca, rotuloPeca, api, recarregar, toast, infoAprovacao,
  BLOCOS_ESTRATEGIA, blocoInfo, blocoDaPeca, nomePilar, focoAoFecharPainel,
} from '../core.js';
import { abrirDetalhe } from '../detalhe.js';
import { objeto3d } from '../efeitos.js';
import { temStories, storiesVisiveis, mostrarStories, linhaStoriesHtml, abrirStories } from '../stories.js';
import { temVideos, marcaVideo } from '../videos-finais.js';
import { ligarArrasto } from '../arrastar-cronograma.js';
import { marcaMecanismo, carregarSemanas, pintarCalendario, segundaDe } from '../mecanismo.js';
import { abrirSugestoes } from '../sugestoes.js';
import { acharItem, bloqueio, nomeDoItem, abrirLote, MAX_LOTE } from '../lote-aprovacao.js';

// 21/10 (Pedro): o filtro é pelos blocos da estratégia principal (Afeto, Educação, Diferencial, Conversão), não mais
// pelos tipos (viralização, vendas...). A variável guarda o id do bloco
let filtroTipo = '';
let filtroPeca = '';
let mesAjustado = false;
// 22/10 (Pedro): o modo "Mandar vários pra aprovação": null = desligado; ligado, os ids marcados (peça ou story)
let selecao = null;

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
    // 22/10 (Pedro): no modo de seleção, o número do dia com post ou story que pode ir vira o atalho de marcar os dois
    const doDia = selecao ? [...rs, ...(sto ? [sto] : [])].filter((x) => !bloqueio(x)) : [];
    const num = doDia.length
      ? `<button type="button" class="crono-num crono-num-sel" data-sel-dia="${iso}">${d.getDate()}</button>`
      : `<span class="crono-num">${d.getDate()}</span>`;
    html += `<div class="crono-cal-dia ${fora ? 'fora' : ''} ${iso === hoje ? 'hoje' : ''} ${fds ? 'fds' : ''}" data-dia="${iso}">
      <div class="crono-dia-topo">${num}</div>
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
        const dica = [r.ideia, rotuloPeca(r, ' + '), bl ? bl.longo : 'sem bloco', nomePilar(r.pilar), f ? `${tipoFormato(f)}: ${f.nome} (${f.codigo})` : r.formatoTexto ?? '', video ? 'Vídeo final pronto' : '', postado ? 'Postado' : '', apv?.dica ?? '', arrasta ? 'Arraste pra outro dia, em cima de outro post (troca os dois) ou pro Banco de Ideias' : ''].filter(Boolean).join(' · ');
        // 21/10: peça postada ganha o check no canto (o mesmo verde do "Postado" do painel)
        return `<button class="crono-chip" data-st="${esc(r.status)}" data-tipo="${esc(r.tipo ?? '')}" data-peca="${esc(p1)}"${p2 ? ` data-peca2="${esc(p2)}"` : ''} data-detalhar="${r.id}"${arrasta ? ' data-arrastavel' : ''} title="${esc(dica)}"><span class="crono-chip-peca">${pecasDoChip(r)}${video ? marcaVideo() : ''}${postado ? `<span class="crono-chip-ok" aria-label="Postado">${icone('check', 12)}</span>` : ''}${apv && !apv.curto ? `<span class="crono-chip-apv" data-estado="${esc(apv.estado)}" aria-label="${esc(apv.dica)}">${icone(apv.icone, 12)}</span>` : ''}${postado ? '' : marcaMecanismo(r.id, r.data)}</span><span class="crono-chip-titulo">${esc(r.ideia)}</span>${apv?.curto ? `<span class="crono-chip-flag" data-estado="${esc(apv.estado)}" aria-label="${esc(apv.dica)}">${icone(apv.icone, 11)}<span class="crono-chip-flag-txt">${esc(apv.curto)}</span></span>` : ''}</button>`;
      }).join('')}
    </div>`;
  }
  return html + '</div></div>';
}

export function render(root) {
  const E = store.E;
  if (!E) { root.innerHTML = '<div class="vazio">Carregando...</div>'; return; }
  const u = ui();
  // 22/10: chegando de outra tela, o modo de seleção começa desligado (redesenho da própria tela mantém)
  if (!root.querySelector('.crono')) selecao = null;
  raiz = root;
  ligarEsc();

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
    <div class="crono${selecao ? ' crono-selecao' : ''}">
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
        <button type="button" class="btn btn-sm crono-sugestoes" data-sugestoes>${icone('lampada', 15)}Sugestões da semana</button>
        <button type="button" class="btn btn-sm crono-lote-btn" data-lote-modo aria-pressed="${selecao ? 'true' : 'false'}">${icone('escudo', 15)}Mandar vários pra aprovação</button>
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

      ${selecao ? `<p class="crono-sel-dica" role="status">${icone('escudo', 15)}<span>O número do dia marca o post e o story dele. Esc sai.</span></p>` : ''}
      ${semNada ? `<p class="crono-filtro-nota">Nenhuma peça${esc(doFiltro)} em ${esc(mes.toLocaleDateString('pt-BR', { month: 'long' }))}. <button type="button" class="crono-link" data-limpar-filtros>Limpar filtros</button></p>` : ''}
      ${calendarioHtml(doMes, mes, stoMes)}
      ${selecao ? `
      <div class="crono-sel-barra" role="region" aria-label="Seleção pra aprovação">
        <span class="crono-sel-conta" aria-live="polite" data-sel-conta></span>
        <span class="crono-espaco"></span>
        <button type="button" class="btn btn-fantasma" data-sel-cancelar>Cancelar</button>
        <button type="button" class="btn btn-primario" data-sel-continuar>${icone('escudo', 16)}Continuar</button>
      </div>` : `
      <div class="crono-banco-doca" data-solta-banco aria-hidden="true">${icone('lampada', 18)}<span>Solte aqui pra guardar no Banco de Ideias</span></div>`}
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
  qq('[data-sugestoes]').forEach((b) => (b.onclick = () => abrirSugestoes()));
  qq('[data-stories]').forEach((b) => (b.onclick = () => abrirStories(b.dataset.stories)));
  const botaoLote = root.querySelector('[data-lote-modo]');
  if (botaoLote) botaoLote.onclick = () => {
    if (selecao) { sairDaSelecao(); return; }
    selecao = new Set();
    render(root);
    root.querySelector('[data-lote-modo]')?.focus({ preventScroll: true });
  };
  if (selecao) ligarSelecao(root);
  const toggle = root.querySelector('#crono-sto');
  if (toggle) toggle.onchange = () => {
    mostrarStories(toggle.checked);
    render(root);
    root.querySelector('#crono-sto')?.focus({ preventScroll: true });
  };
  // a análise de cada semana com peça à vista chega depois: só os chips mudam (o calendário não redesenha)
  carregarSemanas([...doMes.map((r) => r.data), ...stoMes.map((x) => x.data)].map(segundaDe))
    .then(() => { if (root.isConnected && root.querySelector('.crono')) pintarCalendario(root); })
    .catch(() => {});
  ligarArrasto(root, {
    // 22/10: no modo de seleção o card não arrasta (tocar e clicar marcam)
    podeArrastar: (chip) => !selecao && chip.dataset.st !== 'publicado',
    aoSoltar: (id, para, de) => moverPeca(root, id, para, de),
    aoTrocar: (id, comId) => trocarPecas(root, id, comId),
    aoSoltarNoBanco: (id) => guardarNoBanco(root, id),
  });
}

// ── Mandar vários pra aprovação (22/10, Pedro) ───────────────────────────
let raiz = null;
const idDoChip = (chip) => chip.dataset.detalhar || chip.dataset.stories || '';
const ehStoryId = (id) => /^sto_/.test(String(id ?? ''));

// liga o modo: o que já não pode ir sai da seleção, cada chip vira marcar e desmarcar e o número do dia vira o atalho
function ligarSelecao(root) {
  for (const id of [...selecao]) if (bloqueio(acharItem(id))) selecao.delete(id);
  for (const chip of root.querySelectorAll('.crono-chip')) {
    const id = idDoChip(chip);
    const motivo = bloqueio(acharItem(id));
    // o card não arrasta no modo (nem o cursor de mão)
    chip.removeAttribute('data-arrastavel');
    if (motivo) {
      chip.setAttribute('aria-disabled', 'true');
      chip.dataset.selBloqueio = motivo;
      chip.title = `Não dá pra marcar: ${motivo}`;
    }
    chip.onclick = (e) => {
      e.preventDefault();
      // no toque não tem dica: o motivo vem num aviso
      if (motivo) { toast(`${nomeDoItem(acharItem(id) ?? { id })}: ${motivo.charAt(0).toLowerCase()}${motivo.slice(1)}`); return; }
      alternar([id]);
    };
  }
  for (const b of root.querySelectorAll('[data-sel-dia]')) b.onclick = () => alternar(idsDoDia(root, b.dataset.selDia));
  root.querySelector('[data-sel-cancelar]').onclick = () => sairDaSelecao();
  root.querySelector('[data-sel-continuar]').onclick = () => continuar();
  atualizarSelecao(root);
}

// os ids que podem ir num dia (os chips à vista na célula dele)
const idsDoDia = (root, iso) => [...root.querySelectorAll(`[data-dia="${CSS.escape(iso)}"] .crono-chip:not([aria-disabled="true"])`)].map(idDoChip).filter(Boolean);

// marca ou desmarca: um chip, ou o dia inteiro (todos marcados: desmarca; senão marca os que faltam)
function alternar(ids) {
  if (!selecao || !ids.length) return;
  if (ids.every((id) => selecao.has(id))) ids.forEach((id) => selecao.delete(id));
  else {
    const novos = ids.filter((id) => !selecao.has(id));
    const cabem = MAX_LOTE - selecao.size;
    if (cabem <= 0) { toast(`Dá pra mandar até ${MAX_LOTE} de uma vez. Continue com esses e marque o resto depois.`); return; }
    novos.slice(0, cabem).forEach((id) => selecao.add(id));
    if (novos.length > cabem) toast(`Dá pra mandar até ${MAX_LOTE} de uma vez: ${novos.length - cabem} ficaram de fora.`);
  }
  if (raiz?.isConnected) atualizarSelecao(raiz);
}

// os chips, os atalhos dos dias e a barra de baixo mostram a seleção (sem redesenhar o calendário: o foco fica onde está)
function atualizarSelecao(root) {
  if (!selecao) return;
  for (const chip of root.querySelectorAll('.crono-chip:not([aria-disabled="true"])')) chip.setAttribute('aria-pressed', String(selecao.has(idDoChip(chip))));
  for (const b of root.querySelectorAll('[data-sel-dia]')) {
    const iso = b.dataset.selDia;
    const ids = idsDoDia(root, iso);
    const posts = ids.filter((id) => !ehStoryId(id)).length;
    const story = ids.length > posts;
    const oque = [posts ? (posts > 1 ? 'os posts' : 'o post') : '', story ? 'o story' : ''].filter(Boolean).join(' e ');
    const todos = ids.length > 0 && ids.every((id) => selecao.has(id));
    const rot = `${todos ? 'Desmarcar' : 'Marcar'} ${oque} do dia ${diaCurto(iso)}`;
    b.setAttribute('aria-pressed', String(todos));
    b.setAttribute('aria-label', rot);
    b.title = rot;
  }
  const n = selecao.size;
  const conta = root.querySelector('[data-sel-conta]');
  if (conta) conta.innerHTML = `<b>${n}</b> ${n === 1 ? 'selecionado' : 'selecionados'}`;
  const seguir = root.querySelector('[data-sel-continuar]');
  if (seguir) {
    seguir.disabled = !n;
    seguir.title = n ? '' : 'Marque pelo menos um post ou story';
  }
}

function sairDaSelecao() {
  selecao = null;
  if (!raiz?.isConnected || !raiz.querySelector('.crono')) return;
  render(raiz);
  raiz.querySelector('[data-lote-modo]')?.focus({ preventScroll: true });
}

function continuar() {
  if (!selecao?.size) { toast('Marque pelo menos um post ou story.'); return; }
  abrirLote([...selecao], {
    // o que foi sai da seleção; sem nada marcado, o modo desliga
    aoEnviar: (ids) => {
      if (!selecao) return;
      ids.forEach((id) => selecao.delete(id));
      // 22/10 (achado): o que ficou barrado no envio (outra pessoa mandou, foi postado) também sai da seleção
      for (const id of [...selecao]) if (bloqueio(acharItem(id))) selecao.delete(id);
      if (!selecao.size) selecao = null;
      if (raiz?.isConnected && raiz.querySelector('.crono')) {
        render(raiz);
        // o botão que abriu o painel sumiu no redesenho: ao fechar, o foco volta pro Continuar ou pro botão do modo
        focoAoFecharPainel(raiz.querySelector('[data-sel-continuar]') ?? raiz.querySelector('[data-lote-modo]'));
      }
    },
    aoTirar: (id) => {
      selecao?.delete(id);
      if (raiz?.isConnected) atualizarSelecao(raiz);
    },
  });
}

// Esc sai do modo. Com um painel aberto, o Esc é dele (fecha o painel) e o próximo sai do modo; arrastando, cancela o arrasto
let escLigado = false;
function ligarEsc() {
  if (escLigado) return;
  escLigado = true;
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !selecao || !raiz?.isConnected || !raiz.querySelector('.crono')) return;
    if (document.body.classList.contains('com-painel') || document.body.classList.contains('crono-arrastando')) return;
    if (document.querySelector('[data-pop][aria-expanded="true"]')) return;
    e.preventDefault();
    sairDaSelecao();
  }, true);
}

// ── arrastar a peça pra outro dia ─────────────────────────────────────────
const diaCurto = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
// o título entre aspas no aviso, sem dobrar quando a ideia já começa com aspas (as do calendário da semana)
const entreAspas = (s) => (/["“”]/.test(s) ? s : `"${s}"`);

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
    // 22/10 (Pedro): o story no singular
    const extra = sto ? ` O story de ${diaCurto(de)} fala dela.` : '';
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

// 22/10 (Pedro): "Dê opção de arrastar os posts do cronograma para o banco de ideias". Solto na área de baixo (ou no
// item Banco de Ideias do menu), o post vira ideia com o que tinha escrito (POST /api/reels/:id/para-banco) e some do
// calendário na hora; o Desfazer devolve ele inteiro pro mesmo dia (POST /api/ideias/:id/voltar)
async function guardarNoBanco(root, id) {
  const E = store.E;
  const i = E?.reels.findIndex((x) => x.id === id) ?? -1;
  if (i < 0) return;
  const r = E.reels[i];
  const est = r.aprovacao?.estado;
  if ((est === 'pendente' || est === 'aprovado')
    && !confirm(`${entreAspas(r.ideia)} está ${est === 'pendente' ? 'em aprovação' : 'aprovada'}. Guardar no Banco de Ideias tira do cronograma e das Aprovações (a aprovação fica guardada na ideia). Seguir?`)) return;
  E.reels.splice(i, 1);
  render(root);
  let d;
  try {
    d = await api('POST', `/api/reels/${encodeURIComponent(id)}/para-banco`, {});
  } catch (e) {
    E.reels.splice(i, 0, r);
    render(root);
    toast(`Não deu pra guardar no banco: ${e.message}`);
    return;
  }
  avisoDesfazer(`${entreAspas(r.ideia)} foi pro Banco de Ideias.`, async () => {
    try {
      const v = await api('POST', `/api/ideias/${encodeURIComponent(d.ideia.id)}/voltar`, {});
      toast(v.peca?.data ? `Voltou pro cronograma em ${diaCurto(v.peca.data)}` : 'Voltou pro cronograma, sem data');
    } catch (e) {
      toast(`Não deu pra desfazer: ${e.message}`);
    }
    recarregar().catch(() => {});
  });
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
