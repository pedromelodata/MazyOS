// Campanha · Pré-lançamento (a única campanha, SPEC §1.3). A contagem regressiva é escassez
// real: sai de campanha.fim, nunca de número inventado. Detalhe e chat entram por import
// dinâmico pra esta view não depender deles na carga.
import { esc, fmtData, STATUS, store, api, recarregar, toast, abrirPainel, fecharPainel, BTN_FECHAR, formato, icone } from '../core.js';
import { objeto3d } from '../efeitos.js';

const ID_CAMPANHA = 'cmp_prelancamento';
const ROTULO = { ideia: 'Ideia', roteiro: 'Roteiro', gravado: 'Gravado', editado: 'Editado', publicado: 'Publicado' };
const ETAPAS = Array.isArray(STATUS) && STATUS.length ? STATUS : Object.keys(ROTULO);

const hojeISO = () => new Date().toLocaleDateString('sv-SE');
const diasAte = (iso) => Math.round((new Date(`${iso}T12:00`) - new Date(`${hojeISO()}T12:00`)) / 864e5);
const decimal = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const mesCurto = (iso) => new Date(`${iso}T12:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
const porData = (a, b) => (a.data || '9999').localeCompare(b.data || '9999');
const semMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let timerMeta = null;

export function render(root) {
  const E = store.E;
  const c = E?.campanhas?.find((x) => x.id === ID_CAMPANHA) ?? E?.campanhas?.[0];
  if (!c) {
    root.innerHTML = '<div class="card vazio"><strong>Nenhuma campanha cadastrada</strong><p>O Pré-lançamento volta quando o servidor migrar os dados.</p></div>';
    return;
  }
  const reels = (E.reels ?? []).filter((r) => r.campanhaId === c.id);
  root.innerHTML = `
    <div class="cmp">
      ${heroHtml(c, reels)}
      ${funilHtml(reels)}
      ${listaHtml(c, reels)}
    </div>`;
  ligar(root, c);
}

// ── herói ────────────────────────────────────────────────────────────────
function contagem(c) {
  if (!c.fim) return { n: '-', txt: 'sem data de fim', nota: '' };
  const d = diasAte(c.fim);
  const nota = '';
  if (d > 1) return { n: d, txt: `dias até ${fmtData(c.fim)}`, nota };
  if (d === 1) return { n: 1, txt: `dia até ${fmtData(c.fim)}`, nota };
  if (d === 0) return { n: 'Hoje', txt: 'é o último dia', nota };
  return { n: 'Fim', txt: `encerrada em ${fmtData(c.fim, { ano: true })}`, nota: '' };
}

function ritmoTexto(c, meta, publicados) {
  if (!meta) return 'Defina uma meta pra ver o ritmo por semana.';
  const faltam = meta - publicados;
  if (faltam <= 0) return 'Meta batida. Dá pra subir a meta.';
  const dias = c.fim ? diasAte(c.fim) : null;
  if (dias == null) return `Faltam ${faltam} reels pra meta.`;
  if (dias < 0) return `A campanha acabou com ${faltam} ${faltam === 1 ? 'reel' : 'reels'} abaixo da meta.`;
  const porSemana = faltam / Math.max(1, dias / 7);
  return `Faltam ${faltam} ${faltam === 1 ? 'reel' : 'reels'}: uns ${decimal(porSemana)} por semana até ${fmtData(c.fim)}.`;
}

function heroHtml(c, reels) {
  const publicados = reels.filter((r) => r.status === 'publicado').length;
  const meta = Math.max(0, Math.round(Number(c.metaReels) || 0));
  const alvo = meta || reels.length;
  const pct = alvo ? Math.min(100, Math.round((publicados / alvo) * 100)) : 0;
  const acabou = c.fim && diasAte(c.fim) < 0;
  const comecou = !c.inicio || diasAte(c.inicio) <= 0;
  const selo = acabou ? 'Campanha encerrada' : comecou ? 'Campanha no ar' : `Começa em ${fmtData(c.inicio)}`;
  const k = contagem(c);
  const periodo = c.inicio || c.fim
    ? `${c.inicio ? fmtData(c.inicio, { ano: true }) : 'sem início'} a ${c.fim ? fmtData(c.fim, { ano: true }) : 'sem fim'}`
    : 'Sem período definido';

  return `
    <section class="cmp-hero">
      <div class="cmp-hero-info">
        <span class="cmp-selo ${acabou ? 'fim' : ''}">${icone('alvo', 14)}${esc(selo)}</span>
        <h1 class="cmp-nome">${esc(c.nome)}</h1>
        <p class="cmp-objetivo">${esc(c.objetivo) || 'Sem objetivo escrito ainda.'}</p>
        <p class="cmp-periodo">${icone('calendario', 16)}${esc(periodo)}</p>
        <div class="cmp-hero-acoes">
          <button type="button" class="btn btn-primario" data-novo-reel>${icone('mais', 16)}Reel pra campanha</button>
          <button type="button" class="btn" id="cmp-editar">${icone('editar', 16)}Editar objetivo</button>
        </div>
      </div>

      <div class="cmp-contagem" aria-label="${esc(`${k.n} ${k.txt}`)}">
        ${objeto3d('campanha', { classe: 'cmp-objeto' })}
        <b>${esc(k.n)}</b>
        <span>${esc(k.txt)}</span>
        ${k.nota ? `<small>${esc(k.nota)}</small>` : ''}
      </div>

      <div class="cmp-progresso">
        <div class="cmp-progresso-topo">
          <strong>${publicados} de ${alvo} publicados</strong>
          <span>${pct}%</span>
        </div>
        <div class="cmp-barra" role="progressbar" aria-label="Reels publicados na campanha" aria-valuemin="0" aria-valuemax="${alvo}" aria-valuenow="${publicados}"><i style="width:${pct}%"></i></div>
        <div class="cmp-progresso-pe">
          <label class="cmp-meta">
            <span>Meta</span>
            <input type="number" class="campo" id="cmp-meta" min="0" max="999" step="1" inputmode="numeric" value="${meta || ''}" placeholder="0" aria-label="Meta de reels publicados" />
            <span>reels${c.fim ? ` até ${fmtData(c.fim)}` : ''}</span>
          </label>
          <span class="cmp-ritmo">${esc(ritmoTexto(c, meta, publicados))}${meta ? '' : ` Hoje são ${reels.length} ${reels.length === 1 ? 'reel' : 'reels'} na campanha.`}</span>
        </div>
      </div>
    </section>`;
}

// ── funil por status ─────────────────────────────────────────────────────
function funilHtml(reels) {
  return `
    <nav class="cmp-funil" aria-label="Reels da campanha por status">
      ${ETAPAS.map((s) => {
        const n = reels.filter((r) => r.status === s).length;
        return `
        <button type="button" class="cmp-etapa" data-ir="${s}" ${n ? '' : 'disabled'}>
          <b>${n}</b>
          <span class="cmp-etapa-rotulo"><i class="cmp-ponto" data-st="${s}"></i>${esc(ROTULO[s] ?? s)}</span>
        </button>`;
      }).join('')}
    </nav>`;
}

// ── lista agrupada ───────────────────────────────────────────────────────
function listaHtml(c, reels) {
  const topo = `
    <div class="cmp-secao-topo">
      <h2 class="bloco-titulo">Reels da campanha</h2>
      <span class="cmp-mudo">${reels.length} ${reels.length === 1 ? 'reel' : 'reels'}</span>
    </div>`;
  if (!reels.length) {
    return `${topo}
      <div class="card vazio">
        <strong>Nenhum reel na campanha ainda</strong>
        <div class="cmp-vazio-acoes"><button type="button" class="btn btn-primario" data-novo-reel>${icone('mais', 16)}Reel pra campanha</button></div>
      </div>`;
  }
  return topo + ETAPAS.map((s) => {
    const rs = reels.filter((r) => r.status === s).sort(porData);
    if (!rs.length) return '';
    return `
      <section class="cmp-grupo" id="cmp-st-${s}">
        <h3 class="cmp-grupo-titulo"><i class="cmp-ponto" data-st="${s}"></i>${esc(ROTULO[s] ?? s)}<span class="cmp-n">${rs.length}</span></h3>
        <ul class="card cmp-lista">${rs.map((r) => linhaHtml(r, c)).join('')}</ul>
      </section>`;
  }).join('');
}

function linhaHtml(r, c) {
  const f = formato(r.formatoId);
  const depoisDoFim = r.data && c.fim && r.data > c.fim;
  const atrasado = r.data && r.status !== 'publicado' && r.data < hojeISO();
  const tags = [
    f ? `<span class="pill" title="${esc(f.nome)}">${f.origem === 'teste' ? 'Formato' : 'Adaptado de'} ${esc(f.codigo)}</span>` : '',
    depoisDoFim ? `<span class="pill pill-alerta" title="Essa data cai depois do fim da campanha">depois de ${fmtData(c.fim)}</span>` : '',
    atrasado ? '<span class="pill pill-alerta" title="A data passou e o reel ainda não foi publicado">atrasado</span>' : '',
  ].join('');
  return `
    <li class="cmp-linha">
      ${r.data
        ? `<div class="cmp-dia"><b>${Number(r.data.slice(8, 10))}</b><span>${esc(mesCurto(r.data))}</span></div>`
        : '<div class="cmp-dia sem">sem data</div>'}
      <div class="cmp-ideia">
        <strong title="${esc(r.ideia)}">${esc(r.ideia || 'Reel sem título')}</strong>
        ${r.tema ? `<span>${esc(r.tema)}</span>` : ''}
      </div>
      ${tags ? `<div class="cmp-tags">${tags}</div>` : ''}
      <button type="button" class="btn btn-sm" data-detalhar="${esc(r.id)}">Detalhar</button>
    </li>`;
}

// ── ações ────────────────────────────────────────────────────────────────
async function detalhar(id) {
  try {
    const { abrirDetalhe } = await import('../detalhe.js');
    abrirDetalhe(id);
  } catch (e) {
    toast(`Não consegui abrir o detalhe: ${e.message}`);
  }
}

async function novoReel() {
  try {
    const { abrirCriar } = await import('../chat.js');
    abrirCriar();
  } catch (e) {
    toast(`Não consegui abrir o criador: ${e.message}`);
  }
}

const inteiro = (v) => Math.max(0, Math.min(999, Math.round(Number(v) || 0)));

function salvarMeta(c, valor) {
  clearTimeout(timerMeta);
  timerMeta = setTimeout(async () => {
    const n = inteiro(valor);
    if (n === inteiro(c.metaReels)) return;
    try {
      await api('PUT', `/api/campanhas/${encodeURIComponent(c.id)}`, { metaReels: n });
      toast(n ? `Meta: ${n} reels` : 'Meta removida');
      await recarregar();
    } catch (e) {
      toast(e.message);
    }
  }, 450);
}

function editar(c) {
  const p = abrirPainel(`
    <div class="painel-topo">
      <div><h2>Editar campanha</h2><p>${esc(c.nome)}${c.fim ? ` · até ${fmtData(c.fim, { ano: true })}` : ''}</p></div>
      ${BTN_FECHAR}
    </div>
    <form class="painel-corpo cmp-form" id="cmp-form">
      <label class="rotulo">Objetivo
        <textarea class="campo" name="objetivo" rows="6" required>${esc(c.objetivo)}</textarea>
      </label>
      <label class="rotulo">Meta de reels publicados${c.fim ? ` até ${fmtData(c.fim)}` : ''}
        <input class="campo" type="number" name="metaReels" min="0" max="999" step="1" inputmode="numeric" value="${inteiro(c.metaReels) || ''}" placeholder="0 = sem meta" />
      </label>
    </form>
    <div class="painel-rodape">
      <button type="submit" form="cmp-form" class="btn btn-primario">Salvar</button>
      <button type="button" class="btn btn-fantasma" data-fechar>Cancelar</button>
    </div>`) ?? document;
  p.querySelectorAll('[data-fechar]').forEach((b) => (b.onclick = () => fecharPainel()));
  const form = p.querySelector('#cmp-form');
  const texto = form.querySelector('textarea');
  texto.focus();
  texto.setSelectionRange(texto.value.length, texto.value.length);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const corpo = { objetivo: String(d.get('objetivo') ?? '').trim(), metaReels: inteiro(d.get('metaReels')) };
    try {
      await api('PUT', `/api/campanhas/${encodeURIComponent(c.id)}`, corpo);
      fecharPainel();
      toast('Campanha salva');
      await recarregar();
    } catch (err) {
      toast(err.message);
    }
  };
}

function ligar(root, c) {
  root.querySelectorAll('[data-novo-reel]').forEach((b) => (b.onclick = novoReel));
  root.querySelectorAll('[data-detalhar]').forEach((b) => (b.onclick = () => detalhar(b.dataset.detalhar)));
  root.querySelectorAll('[data-ir]').forEach((b) => (b.onclick = () => {
    root.querySelector(`#cmp-st-${b.dataset.ir}`)?.scrollIntoView({ behavior: semMovimento() ? 'auto' : 'smooth', block: 'start' });
  }));
  root.querySelector('#cmp-editar').onclick = () => editar(c);
  const meta = root.querySelector('#cmp-meta');
  meta.onchange = () => salvarMeta(c, meta.value);
  meta.onkeydown = (e) => { if (e.key === 'Enter') meta.blur(); };
}
