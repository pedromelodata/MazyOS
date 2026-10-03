// Stories do dia (28/09): a ideia de stories de cada dia (db.stories, uma por data), fora das peças do feed.
// No calendário é uma linha discreta por dia (Engaja ou Vende) que abre este painel; o interruptor
// "Stories do dia" da barra mostra ou esconde, e a escolha fica no navegador de cada um. Nunca entram nos KPIs.
// Painel no molde do detalhe da peça: leitura limpa (tema, objetivo, pilar, bloco, status, quadros em cards
// de celular, CTA, fontes no "i"); "Editar" abre tudo em campos e salva de uma vez (PUT /api/stories/:id).
// O status troca na hora (PUT /api/stories/:id/status).
// 02/10: dia com vídeo final (stories.videos) ganha a marca na linha do calendário e a seção "Vídeo final" no painel
import {
  esc, store, api, recarregar, toast, abrirPainel, BTN_FECHAR, icone, botaoFontes, botaoNotas, reel, rotuloPeca, pecaInfo,
  tiposDaPeca, BLOCOS, blocoDoPilar, lerLocal, gravarLocal,
} from './core.js';
import { temVideos, marcaVideo, secaoVideoFinal, pilulaVideoFinal, ligarPlayers } from './videos-finais.js';

export const OBJETIVOS = [
  { id: 'engajamento', nome: 'Engajamento', curto: 'Engaja' },
  { id: 'vendas', nome: 'Vendas', curto: 'Vende' },
];
const STATUS = [['ideia', 'Ideia'], ['pronto', 'Pronto'], ['publicado', 'Publicado']];
// os mesmos limites do servidor (validar.mjs, LIM_STORIES)
const LIM = { quadros: 6, texto: 500, visual: 500, interacao: 200, tema: 300, cta: 300, notas: 2000 };
const INTERACOES = ['Enquete', 'Caixinha de perguntas', 'Quiz', 'Link', 'Contagem regressiva', 'Reação com emoji'];
const CHAVE_VISIVEIS = 'gm-stories-do-dia';
const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// servidor que ainda não reiniciou com os stories não manda a lista: nada aparece, nem o interruptor
export const temStories = () => Array.isArray(store.E?.stories);
export const storiesVisiveis = () => lerLocal(CHAVE_VISIVEIS) !== '0';
export const mostrarStories = (sim) => gravarLocal(CHAVE_VISIVEIS, sim ? '1' : '0');
export const objetivoInfo = (id) => OBJETIVOS.find((o) => o.id === id) ?? OBJETIVOS[0];
const lista = () => (temStories() ? store.E.stories : []);
export const storiesDoDia = (iso) => lista().find((s) => s.data === iso) ?? null;
const storiesPorId = (id) => lista().find((s) => s.id === id) ?? null;

const tem = (v) => Boolean(String(v ?? '').trim());
const linhas = (v) => String(v ?? '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const SEM_DADO = '<span class="dt-sem">sem dado</span>';
const nomePilar = (id) => {
  const p = (store.E?.pilares ?? []).find((x) => x.id === Number(id));
  return p ? `${p.id} · ${p.nome}` : '';
};
function dataLonga(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''));
  if (!m) return 'Sem data';
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return `${DIAS_LONGOS[d.getDay()]}, ${d.getDate()} de ${d.toLocaleDateString('pt-BR', { month: 'long' })}`;
}
const quadrosCheios = (s) => (s.quadros ?? []).filter((q) => tem(q.texto) || tem(q.visual) || tem(q.interacao));

// ── Calendário ─────────────────────────────────────────────────────────────
export function linhaStoriesHtml(s) {
  const o = objetivoInfo(s.objetivo);
  const video = temVideos(s);
  const nome = `Stories do dia: ${o.nome}${tem(s.tema) ? `. ${s.tema}` : ''}${video ? '. Vídeo final pronto' : ''}`;
  return `<button type="button" class="sto-linha" data-stories="${esc(s.id)}" data-objetivo="${esc(o.id)}" data-st="${esc(s.status)}" title="${esc(nome)}" aria-label="${esc(nome)}">${icone('stories', 12)}<span class="sto-linha-rot" aria-hidden="true">${esc(o.curto)}</span>${video ? marcaVideo(7) : ''}</button>`;
}

// ── Texto puro (Copiar stories): lista com "•", nunca com hífen solto ──────
function textoStories(s) {
  const o = objetivoInfo(s.objetivo);
  const r = s.pecaDoDia ? reel(s.pecaDoDia) : null;
  const pilar = nomePilar(s.pilar);
  const fontes = (s.fontes ?? []).filter(tem);
  return [
    [`STORIES DO DIA: ${dataLonga(s.data)}`, [o.nome, pilar ? `Pilar ${pilar}` : '', s.bloco].filter(Boolean).join(' · '), tem(s.tema) ? `Tema: ${s.tema}` : ''],
    ...quadrosCheios(s).map((q, i) => [
      `QUADRO ${i + 1}`,
      tem(q.texto) ? `"${q.texto.trim()}"` : '',
      tem(q.visual) ? `Visual: ${q.visual.trim()}` : '',
      tem(q.interacao) ? `Interação: ${q.interacao.trim()}` : '',
    ]),
    [tem(s.cta) ? `CTA: ${s.cta.trim()}` : ''],
    [r ? `Peça do dia: ${rotuloPeca(r)}, ${r.ideia}` : ''],
    [tem(s.notas) ? `Notas: ${s.notas.trim()}` : ''],
    fontes.length ? ['FONTES', ...fontes.map((f) => `• ${f}`)] : [],
  ].map((b) => b.filter(Boolean).join('\n')).filter(Boolean).join('\n\n');
}

// ── Leitura ────────────────────────────────────────────────────────────────
function quadrosHtml(qs) {
  if (!qs.length) return '<p class="dt-vazio">sem quadros ainda</p>';
  return `<ol class="sto-quadros">${qs.map((q, i) => `
    <li class="sto-quadro">
      <span class="sto-quadro-n"><span class="sr-only">Quadro </span>${i + 1}<span aria-hidden="true">/</span><span class="sr-only"> de </span>${qs.length}</span>
      <p class="sto-quadro-texto">${tem(q.texto) ? esc(q.texto.trim()) : ''}</p>
      ${tem(q.visual) || tem(q.interacao) ? `<div class="sto-quadro-pe">
        ${tem(q.visual) ? `<p class="sto-quadro-visual"><span>Visual</span> ${esc(q.visual.trim())}</p>` : ''}
        ${tem(q.interacao) ? `<span class="sto-quadro-interacao">${icone('balao', 12)}${esc(q.interacao.trim())}</span>` : ''}
      </div>` : ''}
    </li>`).join('')}</ol>`;
}

function planoHtml(s) {
  const o = objetivoInfo(s.objetivo);
  const r = s.pecaDoDia ? reel(s.pecaDoDia) : null;
  const pilar = nomePilar(s.pilar);
  const item = (rot, valor, extra = '') => `<div class="dt-plan-item${extra}"><dt>${esc(rot)}</dt><dd>${valor}</dd></div>`;
  const status = `<div class="segmentado sto-status" role="group" aria-label="Status dos stories">${STATUS.map(([id, nome]) => `<button type="button" data-sto-status="${id}" aria-pressed="${s.status === id}">${esc(nome)}</button>`).join('')}</div>`;
  const peca = r
    ? `<a class="sto-peca" href="#/reel/${encodeURIComponent(r.id)}">${icone(pecaInfo(tiposDaPeca(r)[0]).icone, 15)}<span><b>${esc(rotuloPeca(r))}</b> ${esc(r.ideia)}</span></a>`
    : '';
  return `
    <div class="dt-plan">
      <div class="dt-plan-tema"><span class="dt-rotulo">Tema</span><p>${tem(s.tema) ? esc(s.tema) : SEM_DADO}</p></div>
      <dl class="dt-plan-grade">
        ${item('Objetivo', `<span class="sto-objetivo" data-objetivo="${esc(o.id)}">${esc(o.nome)}</span>`)}
        ${item('Pilar', pilar ? esc(pilar) : SEM_DADO)}
        ${item('Bloco', s.bloco ? esc(s.bloco) : SEM_DADO)}
        ${item('Status', status, ' largo')}
        ${r ? item('Peça do dia', peca, ' largo') : ''}
      </dl>
    </div>`;
}

// ── Edição ─────────────────────────────────────────────────────────────────
const opcoes = (pares, atual) => pares.map(([v, t]) => `<option value="${esc(v)}" ${String(atual ?? '') === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('');
// peças do dia escolhido; a que já está ligada fica na lista mesmo se mudou de dia
function opcoesPeca(data, atual) {
  const rs = (store.E?.reels ?? []).filter((r) => (data && r.data === data) || r.id === atual);
  const curto = (t) => (t.length > 60 ? `${t.slice(0, 59).trimEnd()}…` : t);
  return `<option value="">nenhuma</option>${opcoes(rs.map((r) => [r.id, `${rotuloPeca(r)} · ${curto(String(r.ideia ?? ''))}`]), atual)}`;
}

function editorQuadros(qs) {
  return `
    <ol class="rt-blocos rt-edicao">${qs.map((q, i) => `
      <li class="rt-bloco" data-parte="dev">
        <div class="rt-cab"><span class="rt-rotulo">Quadro ${i + 1}</span><button type="button" class="btn-icone btn-sm pc-remover" data-sto-del="${i}" aria-label="Remover o quadro ${i + 1}" ${qs.length <= 1 ? 'disabled' : ''}>${icone('fechar', 14)}</button></div>
        <label class="rotulo">Texto<textarea class="campo" data-sto-q="${i}.texto" rows="2" maxlength="${LIM.texto}">${esc(q.texto ?? '')}</textarea></label>
        <label class="rotulo">Visual<input class="campo" data-sto-q="${i}.visual" maxlength="${LIM.visual}" value="${esc(q.visual ?? '')}" /></label>
        <label class="rotulo">Interação<input class="campo" data-sto-q="${i}.interacao" maxlength="${LIM.interacao}" list="sto-interacoes" value="${esc(q.interacao ?? '')}" /></label>
      </li>`).join('')}</ol>
    <datalist id="sto-interacoes">${INTERACOES.map((x) => `<option value="${esc(x)}"></option>`).join('')}</datalist>
    <button type="button" class="btn btn-sm pc-adicionar" data-sto-add ${qs.length >= LIM.quadros ? 'disabled' : ''}>${icone('mais', 14)} Adicionar quadro</button>`;
}

function edicaoHtml(s) {
  const E = store.E;
  return `
    <section class="bloco">
      <div class="dt-plan-edicao">
        <label class="rotulo">Data<input type="date" class="campo" data-sto="data" min="2000-01-01" max="2100-12-31" required value="${esc(s.data)}" /></label>
        <label class="rotulo">Objetivo<select class="campo" data-sto="objetivo">${opcoes(OBJETIVOS.map((o) => [o.id, o.nome]), s.objetivo)}</select></label>
        <label class="rotulo">Pilar<select class="campo" data-sto="pilar">${opcoes((E.pilares ?? []).map((p) => [p.id, `${p.id} · ${p.nome}`]), s.pilar)}</select></label>
        <label class="rotulo">Bloco<select class="campo" data-sto="bloco">${opcoes(BLOCOS.map((b) => [b, b]), s.bloco)}</select></label>
        <label class="rotulo">Status<select class="campo" data-sto="status">${opcoes(STATUS, s.status)}</select></label>
        <label class="rotulo">Peça do dia<select class="campo" data-sto="pecaDoDia">${opcoesPeca(s.data, s.pecaDoDia)}</select></label>
        <label class="rotulo largo">Tema<input class="campo" data-sto="tema" maxlength="${LIM.tema}" required value="${esc(s.tema)}" /></label>
        <label class="rotulo largo">CTA<input class="campo" data-sto="cta" maxlength="${LIM.cta}" value="${esc(s.cta)}" /></label>
        <label class="rotulo largo">Notas<textarea class="campo" data-sto="notas" rows="2" maxlength="${LIM.notas}">${esc(s.notas)}</textarea></label>
      </div>
    </section>
    <section class="bloco">
      <div class="bloco-titulo">Quadros</div>
      <div id="sto-ed-quadros">${editorQuadros(quadrosCheios(s).length ? quadrosCheios(s) : [{ texto: '', visual: '', interacao: '' }])}</div>
    </section>
    <section class="bloco">
      <div class="bloco-titulo">Fontes</div>
      <textarea class="campo sto-fontes-campo" data-sto="fontes" rows="4" aria-label="Fontes, uma por linha">${esc((s.fontes ?? []).join('\n'))}</textarea>
    </section>`;
}

// ── Painel ─────────────────────────────────────────────────────────────────
let painel = null;

// reabre o mesmo dia sem perder a rolagem (toda mudança recarrega o estado)
function reabrir(id, editando = false) {
  const topo = painel?.querySelector('.painel-corpo')?.scrollTop ?? 0;
  abrirStories(id, editando);
  const corpo = painel?.querySelector('.painel-corpo');
  if (corpo) corpo.scrollTop = topo;
}

export function abrirStories(id, editando = false) {
  if (!store.E) return;
  const s = storiesPorId(id);
  if (!s) { toast('Esses stories não existem mais'); return; }
  const qs = quadrosCheios(s);

  painel = abrirPainel(`
    <div class="painel-topo">
      <div class="dt-cabeca">
        <div class="dt-pills"><span class="pill pill-peca">${icone('stories', 13)}Stories do dia</span>${editando ? '' : pilulaVideoFinal(s)}</div>
        <h2>${esc(dataLonga(s.data))}</h2>
      </div>
      ${editando ? '' : botaoNotas(s.notas) + botaoFontes(s.fontes)}
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo">
      ${editando ? edicaoHtml(s) : `
        <section class="bloco">${planoHtml(s)}</section>
        ${secaoVideoFinal(s)}
        <section class="bloco">
          <div class="bloco-titulo">Quadros${qs.length ? `<span class="dt-contador">${qs.length} ${qs.length === 1 ? 'quadro' : 'quadros'}</span>` : ''}</div>
          ${quadrosHtml(qs)}
        </section>
        ${tem(s.cta) ? `<section class="bloco"><div class="bloco-titulo">CTA</div><p class="sto-cta">${esc(s.cta)}</p></section>` : ''}`}
    </div>
    <div class="painel-rodape dt-rodape">
      ${editando
        ? '<button class="btn btn-primario" data-sto-salvar>Salvar</button><button class="btn" data-sto-cancelar>Cancelar</button>'
        : `<button class="btn" data-sto-editar>${icone('editar', 16)} Editar</button><button class="btn" data-sto-copiar>${icone('copiar', 16)} Copiar stories</button>`}
    </div>`);

  const p = painel;
  const q = (sel) => p.querySelector(sel);
  const qq = (sel) => [...p.querySelectorAll(sel)];

  if (!editando) {
    ligarPlayers(p);
    q('[data-sto-editar]').onclick = () => reabrir(s.id, true);
    q('[data-sto-copiar]').onclick = async () => {
      try {
        await navigator.clipboard.writeText(textoStories(storiesPorId(s.id) ?? s));
        toast('Stories copiados');
      } catch { toast('Não consegui copiar. Selecione o texto e copie na mão.'); }
    };
    qq('[data-sto-status]').forEach((b) => (b.onclick = async () => {
      const status = b.dataset.stoStatus;
      if (status === s.status) return;
      qq('[data-sto-status]').forEach((x) => { x.disabled = true; });
      try {
        await api('PUT', `/api/stories/${encodeURIComponent(s.id)}/status`, { status });
        await recarregar();
        reabrir(s.id);
        p.querySelector(`[data-sto-status="${status}"]`)?.focus({ preventScroll: true });
        toast(`Status: ${STATUS.find(([k]) => k === status)[1]}`);
      } catch (e) {
        qq('[data-sto-status]').forEach((x) => { x.disabled = false; });
        toast(e.message);
      }
    }));
    return;
  }

  // ── modo edição ──
  q('[data-sto-cancelar]').onclick = () => reabrir(s.id);
  const campo = (k) => q(`[data-sto="${k}"]`);
  // pilar novo puxa o bloco dele (dá pra trocar depois); data nova troca as peças do dia oferecidas
  campo('pilar').onchange = () => { const b = blocoDoPilar(campo('pilar').value); if (b) campo('bloco').value = b; };
  campo('data').onchange = () => {
    const atual = campo('pecaDoDia').value;
    campo('pecaDoDia').innerHTML = opcoesPeca(campo('data').value, atual);
  };

  // quadros entram e saem sem perder o que já foi digitado (de 1 a 6)
  const caixa = q('#sto-ed-quadros');
  const valor = (k) => p.querySelector(`[data-sto-q="${CSS.escape(k)}"]`)?.value ?? '';
  const lerQuadros = () => Array.from({ length: qq('[data-sto-del]').length }, (_, i) => ({
    texto: valor(`${i}.texto`), visual: valor(`${i}.visual`), interacao: valor(`${i}.interacao`),
  }));
  caixa.onclick = (e) => {
    const add = e.target.closest('[data-sto-add]');
    const del = e.target.closest('[data-sto-del]');
    if ((!add && !del) || e.target.closest(':disabled')) return;
    const atuais = lerQuadros();
    if (add) atuais.push({ texto: '', visual: '', interacao: '' });
    else atuais.splice(Number(del.dataset.stoDel), 1);
    caixa.innerHTML = editorQuadros(atuais);
    if (add) caixa.querySelector(`[data-sto-q="${atuais.length - 1}.texto"]`)?.focus();
    else caixa.querySelector('[data-sto-add]')?.focus();
  };

  q('[data-sto-salvar]').onclick = async () => {
    const data = campo('data');
    if (!data.value || !data.checkValidity()) {
      toast('Data incompleta ou fora do intervalo. Confira o ano.');
      data.focus();
      return;
    }
    if (!campo('tema').value.trim()) {
      toast('O tema não pode ficar vazio.');
      campo('tema').focus();
      return;
    }
    const botao = q('[data-sto-salvar]');
    botao.disabled = true;
    try {
      await api('PUT', `/api/stories/${encodeURIComponent(s.id)}`, {
        data: data.value,
        objetivo: campo('objetivo').value,
        pilar: Number(campo('pilar').value),
        bloco: campo('bloco').value,
        status: campo('status').value,
        pecaDoDia: campo('pecaDoDia').value || null,
        tema: campo('tema').value,
        cta: campo('cta').value,
        notas: campo('notas').value,
        quadros: lerQuadros(),
        fontes: linhas(campo('fontes').value),
      });
      await recarregar();
      reabrir(s.id);
      toast('Salvo');
    } catch (e) {
      botao.disabled = false;
      toast(e.message);
    }
  };
}
