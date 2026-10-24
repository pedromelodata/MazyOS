// Stories do dia (28/09): a ideia de stories de cada dia (db.stories, uma por data), fora das peças do feed.
// No calendário é uma linha discreta por dia (Engaja ou Vende) que abre este painel; o interruptor
// "Stories do dia" da barra mostra ou esconde, e a escolha fica no navegador de cada um. Nunca entram nos KPIs.
// Painel no molde do detalhe da peça: leitura limpa (tema, objetivo, pilar, bloco, status, quadros em cards
// de celular, CTA, fontes no "i"); "Editar" abre tudo em campos e salva de uma vez (PUT /api/stories/:id).
// O status troca na hora (PUT /api/stories/:id/status).
// 02/10: dia com vídeo final (stories.videos) ganha a marca na linha do calendário e a seção "Vídeo final" no painel
// 21/10 (Pedro): sem pilar, sem peça do dia e sem a seção CTA; ficam objetivo, bloco e os quadros (3 a 5 por dia).
// Quando os stories do dia vão ao ar, os quadros se preenchem com os postados (storiesPostados, do registro de
// métricas da agenda) e o dia conta como postado. "Marcar como postado" no rodapé marca na mão
// 21/10 (Pedro): o bloco "Mecanismo" (mecanismo.js) no painel do dia: os alertas de repetição e continuidade, a exceção
// ("repetição de propósito"), "Regerar stories" com o "O que mudar" opcional (POST /api/semana/regerar { storiesId }) e
// "Voltar à versão anterior" quando o dia tem versoesAnteriores. No calendário, o chip ganha o ícone de alerta do mecanismo
// 22/10 (Pedro): "Libere também pedir autorização de Stories a serem feitos". O painel do dia ganha o mesmo bloco
// "Aprovação técnica" do painel da peça (aprovacao-painel.js) e o "Enviar para aprovação" no rodapé, do lado do
// "Marcar como postado": é opcional (postar não depende dela). O chip do calendário ganha o ícone da aprovação, como o da
// peça, e os quadros saem daqui pra aba Aprovações técnicas (quadrosStoriesHtml)
// 22/10 (Pedro): o story fala sempre no singular, como o "Story · tema" do calendário ("Esse story não existe mais",
// "Desmarcar este story como postado?"). A observação de quem aprovou com observação aparece no bloco da aprovação
// 24/10 (Pedro): o story nasce no Ateliê (chat.js, POST /api/stories) e o painel ganha o "Excluir". O "Postado" e o
// "Excluir" também servem o menu do botão direito do cronograma (alternarPostadoStory, excluirStory)
import {
  esc, store, api, recarregar, toast, abrirPainel, BTN_FECHAR, icone, botaoFontes, botaoNotas, BLOCOS, lerLocal, gravarLocal, blocoInfo,
  infoAprovacao, fecharPainel, navegar,
} from './core.js';
import { temVideos, marcaVideo, secaoVideoFinal, pilulaVideoFinal, ligarPlayers } from './videos-finais.js';
import { marcaMecanismo, blocoMecanismoHtml, ligarBlocoMecanismo } from './mecanismo.js';
import { abrirDetalhe } from './detalhe.js';
import { blocoAprovacaoHtml, botaoAprovacaoHtml, ligarAprovacao, pilulaAprovacaoHtml } from './aprovacao-painel.js';
// 22/10 (Pedro): a arte que o estúdio de design anexou nos stories do dia (stories.artes), depois do vídeo final
import { artesHtml } from './artes-estudio.js';

export const OBJETIVOS = [
  { id: 'engajamento', nome: 'Engajamento', curto: 'Engaja' },
  { id: 'vendas', nome: 'Vendas', curto: 'Vende' },
];
const STATUS = [['ideia', 'Ideia'], ['pronto', 'Pronto'], ['publicado', 'Postado']];
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
// os stories que já foram ao ar naquele dia (servidor que ainda não manda a lista: nenhum)
export const postadosDoDia = (iso) => (Array.isArray(store.E?.storiesPostados?.[iso]) ? store.E.storiesPostados[iso] : []);
// 23/10 (Pedro: "marquei o story como não postado, ele continua verde"): o dia desmarcado por alguém (postadoDesmarcado,
// do servidor) não fica postado pelos stories que o Instagram registrou nele
export const diaPostado = (s) => s?.status === 'publicado' || (!s?.postadoDesmarcado && postadosDoDia(s?.data).length > 0);
const horaBrasilia = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
};
function dataLonga(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''));
  if (!m) return 'Sem data';
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return `${DIAS_LONGOS[d.getDay()]}, ${d.getDate()} de ${d.toLocaleDateString('pt-BR', { month: 'long' })}`;
}
const quadrosCheios = (s) => (s.quadros ?? []).filter((q) => tem(q.texto) || tem(q.visual) || tem(q.interacao));

// ── Calendário ─────────────────────────────────────────────────────────────
// 21/10 (Pedro): o story é sempre "Story · Tema", centrado na ideia do post do dia ou da semana. No calendário vira um
// cartão como o da peça: "Story" em cima e o tema embaixo
export function linhaStoriesHtml(s) {
  const o = objetivoInfo(s.objetivo);
  const video = temVideos(s);
  const nome = `Story · ${tem(s.tema) ? s.tema : 'sem tema'} (${o.nome})${video ? '. Vídeo final pronto' : ''}`;
  const ok = diaPostado(s);
  // 22/10 (Pedro): a aprovação técnica no chip, como na peça (relógio = em aprovação, bandeira = ajuste ou mudou,
  // escudo = aprovado). O botão tem aria-label: a dica entra no nome lido e os ícones de dentro ficam escondidos
  const apv = ok ? null : infoAprovacao(s);
  // 23/10 (Pedro: "permita mover os stories também"; "até stories postados podem mudar de lugar"): o card arrasta pra
  // outro dia, como o do post
  const rot = [nome, ok ? 'Postado' : '', apv?.dica ?? '', 'Arraste pra outro dia (no dia que já tem story, os dois trocam)'].filter(Boolean).join('. ');
  // o alerta do mecanismo (mecanismo.js) entra no nome lido; data-rotulo guarda o nome sem ele pra quando a análise mudar
  const mec = ok ? '' : marcaMecanismo(s.id, s.data);
  const dicaMec = mec ? mec.match(/title="([^"]*)"/)?.[1] ?? '' : '';
  const icoApv = apv && !apv.curto ? `<span class="crono-chip-apv" data-estado="${esc(apv.estado)}" aria-hidden="true">${icone(apv.icone, 12)}</span>` : '';
  const flagApv = apv?.curto ? `<span class="crono-chip-flag" data-estado="${esc(apv.estado)}" aria-hidden="true">${icone(apv.icone, 11)}<span class="crono-chip-flag-txt">${esc(apv.curto)}</span></span>` : '';
  return `<button type="button" class="crono-chip crono-chip-story" data-stories="${esc(s.id)}" data-objetivo="${esc(o.id)}" data-st="${esc(ok ? 'publicado' : s.status)}" data-arrastavel data-rotulo="${esc(rot)}" title="${esc(rot)}" aria-label="${esc(rot)}${dicaMec ? `. Mecanismo: ${dicaMec}` : ''}"><span class="crono-chip-peca"><span class="crono-chip-tipo">${icone('stories', 12)}<b>Story</b></span><span class="sto-chip-obj" data-objetivo="${esc(o.id)}">${esc(o.curto)}</span>${video ? marcaVideo(7) : ''}${ok ? `<span class="crono-chip-ok" aria-label="Postado">${icone('check', 12)}</span>` : ''}${icoApv}${mec}</span><span class="crono-chip-titulo">${esc(tem(s.tema) ? s.tema : 'sem tema')}</span>${flagApv}</button>`;
}

// ── Texto puro (Copiar stories): lista com "•", nunca com hífen solto ──────
function textoStories(s) {
  const o = objetivoInfo(s.objetivo);
  const fontes = (s.fontes ?? []).filter(tem);
  return [
    [`STORIES DO DIA: ${dataLonga(s.data)}`, [o.nome, s.bloco].filter(Boolean).join(' · '), tem(s.tema) ? `Tema: ${s.tema}` : ''],
    ...quadrosCheios(s).map((q, i) => [
      `QUADRO ${i + 1}`,
      tem(q.texto) ? `"${q.texto.trim()}"` : '',
      tem(q.visual) ? `Visual: ${q.visual.trim()}` : '',
      tem(q.interacao) ? `Interação: ${q.interacao.trim()}` : '',
    ]),
    [tem(s.cta) ? `CTA: ${s.cta.trim()}` : ''],
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
// 22/10 (Pedro): os quadros como no painel (cards de celular), pra aba Aprovações técnicas mostrar os stories mandados
export const quadrosStoriesHtml = (quadros) => quadrosHtml(quadrosCheios({ quadros: Array.isArray(quadros) ? quadros : [] }));

// os stories que foram ao ar, como quadros: a imagem do Instagram (o link da Meta vence; sem imagem fica o
// ícone), o horário de Brasília e as visualizações
function postadosHtml(ps) {
  return `<ol class="sto-quadros sto-postados">${ps.map((x, i) => {
    const hora = horaBrasilia(x.publicadoEm);
    const desc = `Story ${i + 1} de ${ps.length}${hora ? `, postado às ${hora}` : ''}`;
    const img = x.thumb ? `<img src="${esc(x.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-sto-img />` : '';
    const corpo = `${img}<span class="sto-postado-sem" aria-hidden="true">${icone(x.tipo === 'VIDEO' ? 'reel' : 'stories', 22)}</span>`;
    const midia = x.permalink
      ? `<a class="sto-postado-midia" href="${esc(x.permalink)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(`${desc}. Abrir no Instagram`)}">${corpo}</a>`
      : `<span class="sto-postado-midia" role="img" aria-label="${esc(desc)}">${corpo}</span>`;
    return `
    <li class="sto-quadro sto-postado${x.thumb ? '' : ' sem-img'}">
      ${midia}
      <span class="sto-postado-info"><span class="sto-quadro-n">${i + 1}/${ps.length}</span>${hora ? `<span>${esc(hora)}</span>` : ''}${x.views != null ? `<span>${esc(Number(x.views).toLocaleString('pt-BR'))} views</span>` : ''}</span>
    </li>`;
  }).join('')}</ol>`;
}

function planoHtml(s) {
  const o = objetivoInfo(s.objetivo);
  const item = (rot, valor, extra = '') => `<div class="dt-plan-item${extra}"><dt>${esc(rot)}</dt><dd>${valor}</dd></div>`;
  const status = `<div class="segmentado sto-status" role="group" aria-label="Status do story">${STATUS.map(([id, nome]) => `<button type="button" data-sto-status="${id}" aria-pressed="${s.status === id}">${esc(nome)}</button>`).join('')}</div>`;
  return `
    <div class="dt-plan">
      <div class="dt-plan-tema"><span class="dt-rotulo">Story · Tema</span><p>${tem(s.tema) ? esc(s.tema) : SEM_DADO}</p></div>
      ${tem(s.motivo) ? `<div class="dt-plan-tema dt-plan-motivo"><span class="dt-rotulo">Motivo</span><p>${esc(s.motivo)}</p></div>` : ''}
      <dl class="dt-plan-grade">
        ${item('Objetivo', `<span class="sto-objetivo" data-objetivo="${esc(o.id)}">${esc(o.nome)}</span>`)}
        ${item('Bloco', s.bloco ? esc(blocoInfo(s.bloco)?.longo ?? s.bloco) : SEM_DADO)}
        ${tem(s.pilarTexto) ? item('Pilar no calendário', esc(s.pilarTexto), ' largo') : ''}
        ${item('Status', status, ' largo')}
      </dl>
    </div>`;
}

// ── Edição ─────────────────────────────────────────────────────────────────
const opcoes = (pares, atual) => pares.map(([v, t]) => `<option value="${esc(v)}" ${String(atual ?? '') === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('');

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
  return `
    <section class="bloco">
      <div class="dt-plan-edicao">
        <label class="rotulo">Data<input type="date" class="campo" data-sto="data" min="2000-01-01" max="2100-12-31" required value="${esc(s.data)}" /></label>
        <label class="rotulo">Objetivo<select class="campo" data-sto="objetivo">${opcoes(OBJETIVOS.map((o) => [o.id, o.nome]), s.objetivo)}</select></label>
        <label class="rotulo">Bloco<select class="campo" data-sto="bloco">${opcoes(BLOCOS.map((b) => [b, b]), s.bloco)}</select></label>
        <label class="rotulo">Status<select class="campo" data-sto="status">${opcoes(STATUS, s.status)}</select></label>
        <label class="rotulo largo">Tema<input class="campo" data-sto="tema" maxlength="${LIM.tema}" required value="${esc(s.tema)}" /></label>
        <label class="rotulo largo">Motivo<textarea class="campo" data-sto="motivo" rows="2" maxlength="1000" placeholder="Por que este story existe (a defesa do calendário)">${esc(s.motivo ?? '')}</textarea></label>
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

// ── Postado e Excluir (24/10): do painel e do menu do botão direito no cronograma ──
// Devolvem se mudou (false: desistiu na confirmação ou o servidor recusou, com o aviso)
// 23/10 (Pedro: "marquei o story como não postado, ele continua verde"): o dia verde só pelos stories que o Instagram
// registrou também desmarca; o servidor lembra (a agenda não marca de novo)
export async function alternarPostadoStory(s) {
  const desmarcar = diaPostado(s);
  const volta = s.status === 'publicado' ? 'pronto' : s.status;
  if (desmarcar && !confirm(`Desmarcar este story como postado?${s.status === 'publicado' ? ' Ele volta pra Pronto.' : ''}`)) return false;
  try {
    await api('PUT', `/api/stories/${encodeURIComponent(s.id)}/status`, desmarcar ? { status: volta, desmarcarPostado: true } : { status: 'publicado' });
    await recarregar();
    toast(desmarcar ? (s.status === 'publicado' ? 'Desmarcado: voltou pra Pronto' : 'Desmarcado como postado') : 'Marcado como postado');
    return true;
  } catch (e) {
    toast(e.message);
    return false;
  }
}
// 24/10 (Pedro): o story some do dia (DELETE /api/stories/:id); o design do Ateliê ligado a ele fica na lista do Design
export async function excluirStory(s, { aoApagar = () => {} } = {}) {
  const extra = s.aprovacao?.estado === 'pendente' ? ' Ele sai das Aprovações técnicas também.' : '';
  if (!confirm(`Excluir o story ${tem(s.tema) ? `"${s.tema.trim()}"` : 'sem tema'} de ${dataLonga(s.data)}?${extra}`)) return false;
  try {
    await api('DELETE', `/api/stories/${encodeURIComponent(s.id)}`);
    aoApagar();
    toast('Story excluído');
    await recarregar();
    return true;
  } catch (e) {
    toast(e.message);
    return false;
  }
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
  if (!s) { toast('Esse story não existe mais'); return; }
  const qs = quadrosCheios(s);
  const ps = postadosDoDia(s.data);
  const postado = diaPostado(s);

  painel = abrirPainel(`
    <div class="painel-topo">
      <div class="dt-cabeca">
        <div class="dt-pills"><span class="pill pill-peca">${icone('stories', 13)}Story · Tema</span>${editando ? '' : pilulaVideoFinal(s)}${postado && !editando ? `<span class="pill pill-ok">${icone('check', 13)}Postado</span>` : ''}${editando ? '' : pilulaAprovacaoHtml(s, { postado })}</div>
        <h2>${esc(dataLonga(s.data))}</h2>
      </div>
      ${editando ? '' : botaoNotas(s.notas) + botaoFontes(s.fontes)}
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo">
      ${editando ? edicaoHtml(s) : `
        <section class="bloco">${planoHtml(s)}</section>
        ${blocoAprovacaoHtml(s, { tipo: 'stories', postado })}
        ${blocoMecanismoHtml(s, { tipo: 'stories', postado })}
        ${secaoVideoFinal(s)}
        ${artesHtml(s.artes)}
        <section class="bloco">
          ${ps.length ? `
          <div class="bloco-titulo">Quadros<span class="dt-contador">${ps.length} ${ps.length === 1 ? 'postado' : 'postados'} no Instagram</span></div>
          ${postadosHtml(ps)}
          ${qs.length ? `<details class="sto-planejado"><summary>Ver o planejado (${qs.length} ${qs.length === 1 ? 'quadro' : 'quadros'})</summary>${quadrosHtml(qs)}</details>` : ''}` : `
          <div class="bloco-titulo">Quadros${qs.length ? `<span class="dt-contador">${qs.length} ${qs.length === 1 ? 'quadro' : 'quadros'}</span>` : ''}</div>
          ${quadrosHtml(qs)}`}
        </section>`}
    </div>
    <div class="painel-rodape dt-rodape">
      ${editando
        ? '<button class="btn btn-primario" data-sto-salvar>Salvar</button><button class="btn" data-sto-cancelar>Cancelar</button>'
        : `${postado
          ? `<button class="btn btn-postado" data-sto-postado aria-pressed="true" title="Clique pra desmarcar">${icone('check', 16)} Postado</button>`
          : `<button class="btn btn-primario" data-sto-postado aria-pressed="false">${icone('check', 16)} Marcar como postado</button>`}${botaoAprovacaoHtml(s, { postado, primario: false })}<button class="btn" data-sto-atelie>${icone('pincel', 16)} Criar no Ateliê</button><button class="btn" data-sto-editar>${icone('editar', 16)} Editar</button><button class="btn" data-sto-copiar>${icone('copiar', 16)} Copiar story</button><span class="dt-espaco"></span><button class="btn btn-fantasma btn-perigo" data-sto-excluir>${icone('lixo', 16)} Excluir</button>`}
    </div>`);

  const p = painel;
  const q = (sel) => p.querySelector(sel);
  const qq = (sel) => [...p.querySelectorAll(sel)];

  if (!editando) {
    ligarPlayers(p);
    ligarBlocoMecanismo(p, s, { tipo: 'stories', reabrir: (id) => reabrir(id), abrirPeca: (id) => abrirDetalhe(id), abrirStoriesDia: (id) => abrirStories(id) });
    // 22/10 (Pedro): a aprovação técnica dos stories (opcional): explicação, "Escrever com IA", enviar e responder
    ligarAprovacao(p, s, { tipo: 'stories', reabrir: (id) => reabrir(id) });
    // imagem do Instagram que venceu: fica o ícone, sem a imagem quebrada
    qq('[data-sto-img]').forEach((img) => img.addEventListener('error', () => {
      img.closest('.sto-postado')?.classList.add('sem-img');
      img.remove();
    }, { once: true }));
    const btnPostado = q('[data-sto-postado]');
    if (btnPostado) btnPostado.onclick = async () => {
      btnPostado.disabled = true;
      if (await alternarPostadoStory(s)) reabrir(s.id);
      else btnPostado.disabled = false;
    };
    q('[data-sto-excluir]').onclick = () => excluirStory(s, { aoApagar: fecharPainel });
    q('[data-sto-editar]').onclick = () => reabrir(s.id, true);
    // 23/10 (Pedro): leva o story pro Ateliê, no design ligado a ele (sem nenhum, o servidor monta um quadro por página)
    const btnAtelie = q('[data-sto-atelie]');
    if (btnAtelie) btnAtelie.onclick = () => { fecharPainel(); navegar(`#/atelie?arte=${encodeURIComponent(s.id)}`); };
    q('[data-sto-copiar]').onclick = async () => {
      try {
        await navigator.clipboard.writeText(textoStories(storiesPorId(s.id) ?? s));
        toast('Story copiado');
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
        // pilar, peça do dia e CTA saíram da tela: o servidor mantém o que o dia já tem
        objetivo: campo('objetivo').value,
        bloco: campo('bloco').value,
        status: campo('status').value,
        tema: campo('tema').value,
        motivo: campo('motivo').value,
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
