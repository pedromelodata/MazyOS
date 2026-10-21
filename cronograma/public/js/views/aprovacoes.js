// Aprovações técnicas (21/10/2026, Pedro). A aba onde o Diretor contábil confere cada peça de feed (reel,
// carrossel ou estático) antes de ir ao ar: o roteiro inteiro em Hook, Desenvolvimento e CTA, a legenda, as
// fontes, o vídeo final e a explicação técnica (por que o post existe e o objetivo). Ele aprova ou ajusta:
// ajustar é escrever o que mudar e, se quiser, editar o texto ali mesmo. Salvo, a peça sai da lista e volta
// pro cronograma com a bandeira amarela. Dados de GET /api/aprovacoes (não usa o /api/estado: o Diretor só
// enxerga esta aba). O time (Admin e Operador) vê a mesma lista, sem os botões de decidir.
import {
  esc, api, icone, toast, abrirPainel, fecharPainel, BTN_FECHAR, fmtData, blocosRoteiro, roteiroTresHtml, pillBloco, blocoInfo,
  pecaInfo, store, ehDiretor, recarregar, navegar, NOME_PAPEL, infoAprovacao,
} from '../core.js';

const tem = (v) => Boolean(String(v ?? '').trim());
const est = { dados: null, erro: null, carregando: false, abertoId: null, ajustando: false, editando: false, enviando: false };
let raiz = null;

const urlVideo = (arquivo) => '/videos/' + String(arquivo).split('/').map(encodeURIComponent).join('/');
const diasAte = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return null;
  const h = new Date();
  return Math.round((new Date(+m[1], +m[2] - 1, +m[3]) - new Date(h.getFullYear(), h.getMonth(), h.getDate())) / 86400000);
};
function prazo(iso) {
  const d = diasAte(iso);
  if (d == null) return 'sem data';
  if (d < 0) return `era pra ${fmtData(iso)}`;
  if (d === 0) return 'posta hoje';
  if (d === 1) return 'posta amanhã';
  return `posta em ${d} dias`;
}
const quando = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');

export async function render(root) {
  raiz = root;
  desenhar();
  if (!est.dados && !est.carregando) await carregar();
}

async function carregar() {
  est.carregando = true;
  try {
    est.dados = await api('GET', '/api/aprovacoes');
    est.erro = null;
  } catch (e) {
    est.erro = e.message;
  } finally {
    est.carregando = false;
  }
  if (raiz?.isConnected) desenhar();
}

// ── lista ──
function cartaoHtml(r, decidido = false) {
  const p = pecaInfo(r.peca) ?? pecaInfo('reel');
  const a = r.aprovacao ?? {};
  const d = diasAte(r.data);
  const urgente = !decidido && d != null && d <= 1;
  const info = infoAprovacao(r);
  const situacao = decidido
    ? `${icone(info?.icone ?? 'bandeira', 14)}${esc(info?.dica ?? '')}`
    : `${icone('relogio', 14)}Mandada por ${esc(a.enviadoPor ?? '')} ${esc(quando(a.enviadoEm))}${a.rodada > 1 ? ` · ${a.rodada}ª vez` : ''}`;
  return `
    <button type="button" class="apv-card card${urgente ? ' urgente' : ''}" data-apv="${esc(r.id)}" data-estado="${esc(a.estado ?? '')}">
      <span class="apv-card-topo">
        <span class="pill pill-peca">${icone(p.icone, 13)}${esc(p.nome)}</span>
        ${pillBloco(r.bloco, { tam: 12 })}${r.pilar ? `<span class="pill">Pilar ${r.pilar.id}</span>` : ''}
        <span class="apv-prazo${urgente ? ' urgente' : ''}">${icone('calendario', 13)}${r.data ? esc(fmtData(r.data, { diaSemana: true })) : 'sem data'} · ${esc(prazo(r.data))}</span>
      </span>
      <strong class="apv-card-titulo">${esc(r.ideia)}</strong>
      <span class="apv-card-situacao" data-estado="${esc(a.estado ?? '')}">${situacao}</span>
    </button>`;
}

function desenhar() {
  if (!raiz) return;
  const d = est.dados;
  const diretor = ehDiretor();
  const topo = `
    <header class="apv-topo">
      <div>
        <h1>Aprovações técnicas</h1>
        <p class="apv-sub">${diretor
          ? 'Cada peça chega aqui antes de ir ao ar. Leia o roteiro e a explicação técnica e aprove ou peça um ajuste.'
          : 'As peças que estão com o Diretor contábil. Mande pra aprovação pelo painel da peça, de preferência um dia antes de postar.'}</p>
      </div>
    </header>`;
  if (est.erro && !d) {
    raiz.innerHTML = `${topo}<div class="card vazio"><strong>Não consegui carregar as aprovações</strong><p>${esc(est.erro)}</p><button class="btn" data-apv-tentar>Tentar de novo</button></div>`;
    raiz.querySelector('[data-apv-tentar]').onclick = () => { est.erro = null; desenhar(); carregar(); };
    return;
  }
  if (!d) {
    raiz.innerHTML = `${topo}<div class="apv-lista">${'<div class="apv-card card apv-esq"><span class="fx-esq"></span><span class="fx-esq"></span></div>'.repeat(3)}</div>`;
    return;
  }
  const pend = d.pendentes ?? [];
  const rec = d.recentes ?? [];
  raiz.innerHTML = `
    ${topo}
    <section class="apv-secao">
      <div class="bloco-titulo">Esperando aprovação<span class="dt-contador">${pend.length}</span></div>
      ${pend.length ? `<div class="apv-lista">${pend.map((r) => cartaoHtml(r)).join('')}</div>`
        : `<div class="card vazio apv-vazio">${icone('escudo', 22)}<strong>Nada esperando aprovação</strong><p>${diretor ? 'Quando o time mandar uma peça, ela aparece aqui.' : 'Mande uma peça pelo botão "Enviar para aprovação" no painel dela.'}</p></div>`}
    </section>
    ${rec.length ? `
    <details class="apv-secao apv-recentes">
      <summary class="bloco-titulo">Decididas nos últimos 30 dias<span class="dt-contador">${rec.length}</span></summary>
      <div class="apv-lista">${rec.map((r) => cartaoHtml(r, true)).join('')}</div>
    </details>` : ''}`;
  raiz.querySelectorAll('[data-apv]').forEach((b) => (b.onclick = () => abrir(b.dataset.apv)));
}

// ── painel da peça ──
const achar = (id) => [...(est.dados?.pendentes ?? []), ...(est.dados?.recentes ?? [])].find((x) => x.id === id);

export function explicacaoHtml(txt) {
  if (!tem(txt)) return '<p class="dt-vazio">Sem explicação técnica.</p>';
  // "Por que este post:", "Base técnica:" e "Objetivo:" viram rótulos; o resto fica como veio
  const linhas = String(txt).split(/\n+/).map((l) => l.replace(/\*\*/g, '').trim()).filter(Boolean);
  return `<div class="apv-explicacao">${linhas.map((l) => {
    const m = /^(Por que este post|Base técnica|Objetivo)\s*:\s*(.*)$/i.exec(l);
    if (m) return `<p><b>${esc(m[1])}:</b>${m[2] ? ` ${esc(m[2])}` : ''}</p>`;
    // "Sem fato na base" é o que o diretor mais precisa ver: fica em destaque
    const classe = l.startsWith('•') ? (/sem fato na base/i.test(l) ? 'apv-item alerta' : 'apv-item') : '';
    return `<p${classe ? ` class="${classe}"` : ''}>${esc(l)}</p>`;
  }).join('')}</div>`;
}

function slidesHtml(c = {}) {
  const sl = [
    ...(tem(c.capa?.titulo) || tem(c.capa?.texto) ? [{ ...c.capa, nome: 'Capa', parte: 'gancho' }] : []),
    ...(c.slides ?? []).filter((s) => tem(s?.titulo) || tem(s?.texto)).map((s) => ({ ...s, nome: '', parte: 'dev' })),
    ...(tem(c.final?.titulo) || tem(c.final?.texto) ? [{ ...c.final, nome: 'CTA', parte: 'cta' }] : []),
  ];
  if (!sl.length) return '<p class="dt-vazio">sem slides</p>';
  return `<ol class="rt-blocos">${sl.map((s, i) => `
    <li class="rt-bloco" data-parte="${s.parte}">
      <div class="rt-cab"><span class="rt-rotulo">${s.nome ? `${i + 1} · ${esc(s.nome)}` : `Slide ${i + 1}`}</span></div>
      ${tem(s.titulo) ? `<p class="rt-fala">${esc(s.titulo)}</p>` : ''}
      ${tem(s.texto) ? `<p class="pc-texto">${esc(s.texto)}</p>` : ''}
    </li>`).join('')}</ol>`;
}
function arteHtml(e = {}) {
  const partes = [['headline', 'Headline', 'gancho'], ['apoio', 'Texto de apoio', 'dev'], ['cta', 'CTA', 'cta']].filter(([k]) => tem(e[k]));
  if (!partes.length) return '<p class="dt-vazio">sem arte</p>';
  return `<ol class="rt-blocos">${partes.map(([k, nome, parte]) => `
    <li class="rt-bloco" data-parte="${parte}"><div class="rt-cab"><span class="rt-rotulo">${esc(nome)}</span></div><p class="${k === 'headline' ? 'rt-fala' : 'pc-texto'}">${esc(e[k])}</p></li>`).join('')}</ol>`;
}
function videosHtml(vs = []) {
  const lista = vs.filter((v) => v && typeof v.arquivo === 'string' && v.arquivo);
  if (!lista.length) return '';
  return `
    <section class="bloco">
      <div class="bloco-titulo">Vídeo final</div>
      <div class="apv-videos">${lista.map((v) => `
        <figure class="apv-video">
          <video controls preload="metadata" playsinline src="${esc(urlVideo(v.arquivo))}"></video>
          ${tem(v.rotulo) ? `<figcaption>${esc(v.rotulo)}</figcaption>` : ''}
        </figure>`).join('')}</div>
    </section>`;
}
export function conversaHtml(conversa = []) {
  if (!conversa.length) return '';
  const ICONE = { envio: 'seta', aprovado: 'escudo', ajuste: 'bandeira', mensagem: 'balao', alterado: 'alerta' };
  return `
    <section class="bloco">
      <div class="bloco-titulo">Conversa</div>
      <ol class="apv-conversa">${conversa.map((m) => `
        <li class="apv-msg" data-tipo="${esc(m.tipo)}" data-papel="${esc(m.papel ?? '')}">
          <span class="apv-msg-ico">${icone(ICONE[m.tipo] ?? 'balao', 14)}</span>
          <div>
            <p class="apv-msg-quem"><b>${esc(m.autor ?? '')}</b> <span>${esc(NOME_PAPEL[m.papel] ?? '')} · ${esc(quando(m.em))}</span></p>
            ${tem(m.texto) ? `<p class="apv-msg-texto">${esc(m.texto)}</p>` : ''}
            ${m.mudou?.length ? `<p class="apv-msg-mudou">Mudou: ${esc(m.mudou.join(', '))}</p>` : ''}
          </div>
        </li>`).join('')}</ol>
    </section>`;
}

// edição do diretor: só o texto (as falas do roteiro, os slides, a arte e a legenda)
function editorHtml(r) {
  const area = (k, valor, linhas = 2) => `<textarea class="campo" data-apv-ed="${esc(k)}" rows="${linhas}">${esc(valor ?? '')}</textarea>`;
  const ro = r.roteiro ?? {};
  let corpo = '';
  if (r.peca === 'reel') {
    const cenas = ro.cenas ?? [];
    if (cenas.length) {
      const ultimaCta = tem(ro.cta) && cenas.length > 1;
      corpo = cenas.map((c, i) => {
        const nome = i === 0 ? 'Hook' : ultimaCta && i === cenas.length - 1 ? 'CTA' : 'Desenvolvimento';
        return `<label class="rotulo">${nome}${area(`cena.${i}`, c?.fala, 2)}</label>`;
      }).join('');
    } else {
      corpo = `<label class="rotulo">Hook${area('hook', ro.hook, 2)}</label>
        <label class="rotulo"><span>Desenvolvimento <small>uma fala por parágrafo</small></span>${area('desenvolvimento', ro.desenvolvimento, 6)}</label>
        <label class="rotulo">CTA${area('cta', ro.cta, 2)}</label>`;
    }
  } else if (r.peca === 'carrossel') {
    const c = r.carrossel ?? {};
    const slide = (chave, s, nome) => `<fieldset class="apv-slide"><legend>${esc(nome)}</legend><label class="rotulo">Título${area(`${chave}.titulo`, s?.titulo, 1)}</label><label class="rotulo">Texto${area(`${chave}.texto`, s?.texto, 2)}</label></fieldset>`;
    corpo = [slide('capa', c.capa, 'Capa'), ...(c.slides ?? []).map((s, i) => slide(`slide.${i}`, s, `Slide ${i + 2}`)), slide('final', c.final, 'CTA')].join('');
  } else {
    const e = r.estatico ?? {};
    corpo = `<label class="rotulo">Headline${area('headline', e.headline, 1)}</label><label class="rotulo">Texto de apoio${area('apoio', e.apoio, 3)}</label><label class="rotulo">CTA${area('ctaArte', e.cta, 1)}</label>`;
  }
  return `<div class="apv-editor">${corpo}<label class="rotulo">Legenda${area('legenda', r.legenda, 8)}</label></div>`;
}
function lerEditor(p, r) {
  const v = (k) => p.querySelector(`[data-apv-ed="${CSS.escape(k)}"]`)?.value;
  const c = {};
  if (r.peca === 'reel') {
    const cenas = r.roteiro?.cenas ?? [];
    c.roteiro = cenas.length ? { cenas: cenas.map((_, i) => ({ fala: v(`cena.${i}`) ?? '' })) } : { hook: v('hook') ?? '', desenvolvimento: v('desenvolvimento') ?? '', cta: v('cta') ?? '' };
  } else if (r.peca === 'carrossel') {
    const sl = (k) => ({ titulo: v(`${k}.titulo`) ?? '', texto: v(`${k}.texto`) ?? '' });
    c.carrossel = { capa: sl('capa'), slides: (r.carrossel?.slides ?? []).map((_, i) => sl(`slide.${i}`)), final: sl('final') };
  } else {
    c.estatico = { headline: v('headline') ?? '', apoio: v('apoio') ?? '', cta: v('ctaArte') ?? '' };
  }
  c.legenda = v('legenda') ?? '';
  return c;
}

function abrir(id) {
  const r = achar(id);
  if (!r) return;
  est.abertoId = id;
  est.ajustando = false;
  est.editando = false;
  pintarPainel(r);
}

function pintarPainel(r) {
  const p = pecaInfo(r.peca) ?? pecaInfo('reel');
  const a = r.aprovacao ?? {};
  const diretor = ehDiretor();
  const decide = diretor && a.estado === 'pendente';
  // a peça vai do jeito que está: sem texto escrito ainda, o diretor vê a ideia como está no calendário
  const semTexto = `<p class="apv-ideia">${esc(r.ideia)}</p><p class="dt-vazio">O texto ainda não foi escrito: a peça foi pra aprovação do jeito que está no calendário.</p>`;
  const conteudo = r.peca === 'reel'
    ? (() => { const bl = blocosRoteiro(r.roteiro ?? {}); return bl.length ? roteiroTresHtml(bl) : semTexto; })()
    : r.peca === 'carrossel'
      ? ((r.carrossel?.capa?.titulo || (r.carrossel?.slides ?? []).length) ? slidesHtml(r.carrossel) : semTexto)
      : (r.estatico?.headline ? arteHtml(r.estatico) : semTexto);
  // 21/10 (Pedro): o planejamento da estratégia principal junto: motivo, bloco, pilar e o que o calendário diz
  const bl = blocoInfo(r.bloco);
  const planejamento = `
      <section class="bloco">
        <div class="bloco-titulo">Planejamento</div>
        ${tem(r.motivo) ? `<div class="dt-plan-tema dt-plan-motivo"><span class="dt-rotulo">Motivo</span><p>${esc(r.motivo)}</p></div>` : ''}
        <dl class="dt-plan-grade apv-plan">
          <div class="dt-plan-item"><dt>Bloco</dt><dd>${bl ? esc(`${bl.longo} (${bl.fatia}% da pauta)`) : 'sem bloco'}</dd></div>
          <div class="dt-plan-item"><dt>Pilar</dt><dd>${r.pilar ? esc(`${r.pilar.id} · ${r.pilar.nome}`) : 'sem pilar'}</dd></div>
          ${tem(r.pilarTexto) ? `<div class="dt-plan-item largo"><dt>Pilar no calendário</dt><dd>${esc(r.pilarTexto)}</dd></div>` : ''}
          ${tem(r.formatoTexto) ? `<div class="dt-plan-item largo"><dt>Formato no calendário</dt><dd>${esc(r.formatoTexto)}</dd></div>` : ''}
          ${tem(r.tema) ? `<div class="dt-plan-item largo"><dt>Tema</dt><dd>${esc(r.tema)}</dd></div>` : ''}
        </dl>
      </section>`;
  const rotuloConteudo = r.peca === 'reel' ? 'Roteiro' : r.peca === 'carrossel' ? 'Carrossel' : 'Arte';
  const fontes = (r.fontes ?? []).filter(tem);
  const corpo = est.ajustando ? `
      <section class="bloco apv-ajuste">
        <div class="bloco-titulo">O que ajustar</div>
        <textarea class="campo" id="apv-msg" rows="4" maxlength="2000" aria-label="O que ajustar" placeholder="Escreva o ajuste pro time: o que está errado e como fica certo"></textarea>
        <label class="apv-editar"><input type="checkbox" id="apv-editar" ${est.editando ? 'checked' : ''} /> Quero editar o texto da peça eu mesmo</label>
        ${est.editando ? editorHtml(r) : ''}
      </section>` : `
      <section class="bloco apv-porque">
        <div class="bloco-titulo">Explicação técnica</div>
        ${explicacaoHtml(a.explicacao)}
      </section>
      ${planejamento}
      ${videosHtml(r.videos)}
      <section class="bloco">
        <div class="bloco-titulo">${rotuloConteudo}</div>
        ${conteudo}
      </section>
      ${tem(r.legenda) ? `<section class="bloco"><div class="bloco-titulo">Legenda</div><div class="texto">${esc(r.legenda)}</div></section>` : ''}
      ${fontes.length ? `<section class="bloco"><div class="bloco-titulo">Fontes</div><ul class="apv-fontes">${fontes.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></section>` : ''}
      ${conversaHtml(a.conversa)}`;
  const rodape = est.ajustando
    ? `<button class="btn btn-primario" id="apv-salvar">${icone('bandeira', 16)} Salvar ajuste</button><button class="btn" id="apv-cancelar">Cancelar</button>`
    : decide
      ? `<button class="btn btn-primario" id="apv-aprovar">${icone('escudo', 16)} Aprovar</button><button class="btn" id="apv-ajustar">${icone('editar', 16)} Ajustar</button>`
      : diretor ? '' : `<button class="btn" id="apv-abrir-peca">${icone('calendario', 16)} Abrir no cronograma</button>`;
  // 21/10 (Pedro): quem decide vê em nome de quem a decisão fica registrada
  const assina = decide || est.ajustando ? `<span class="apv-assina">Fica registrado como <b>${esc(store.usuario?.nome ?? '')}</b> (${esc(NOME_PAPEL.diretor)})</span>` : '';
  const painel = abrirPainel(`
    <div class="painel-topo">
      <div class="dt-cabeca">
        <div class="dt-pills"><span class="pill pill-peca">${icone(p.icone, 13)}${esc(p.nome)}</span>${pillBloco(r.bloco)}<span class="pill">${icone('calendario', 13)}${r.data ? esc(fmtData(r.data, { ano: true, diaSemana: true })) : 'sem data'}</span></div>
        <h2>${esc(r.ideia)}</h2>
      </div>
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo apv-painel">${corpo}</div>
    ${rodape ? `<div class="painel-rodape dt-rodape">${rodape}${assina}</div>` : ''}`, { largo: true });
  if (!painel) return;
  painel.querySelectorAll('[data-fechar]').forEach((b) => (b.onclick = fecharPainel));
  const q = (s) => painel.querySelector(s);
  if (q('#apv-aprovar')) q('#apv-aprovar').onclick = () => decidir(r, 'aprovar', q('#apv-aprovar'));
  if (q('#apv-ajustar')) q('#apv-ajustar').onclick = () => { est.ajustando = true; pintarPainel(r); q2('#apv-msg')?.focus(); };
  if (q('#apv-cancelar')) q('#apv-cancelar').onclick = () => { est.ajustando = false; est.editando = false; pintarPainel(r); };
  if (q('#apv-editar')) q('#apv-editar').onchange = (e) => {
    const msg = q('#apv-msg').value;
    est.editando = e.target.checked;
    pintarPainel(r);
    q2('#apv-msg').value = msg;
  };
  if (q('#apv-salvar')) q('#apv-salvar').onclick = () => decidir(r, 'ajustar', q('#apv-salvar'), painel);
  if (q('#apv-abrir-peca')) q('#apv-abrir-peca').onclick = () => { fecharPainel(); navegar(`#/reel/${encodeURIComponent(r.id)}`); };
}
const q2 = (s) => document.querySelector(`#painel ${s}`);

async function decidir(r, acao, botao, painel = null) {
  if (est.enviando) return;
  let corpo = {};
  if (acao === 'ajustar') {
    const mensagem = (painel?.querySelector('#apv-msg')?.value ?? '').trim();
    const conteudo = est.editando ? lerEditor(painel, r) : null;
    if (!mensagem && !conteudo) { toast('Escreva o que ajustar ou edite o texto da peça.'); painel?.querySelector('#apv-msg')?.focus(); return; }
    corpo = { mensagem, ...(conteudo ? { conteudo } : {}) };
  }
  est.enviando = true;
  botao.disabled = true;
  try {
    await api('POST', `/api/aprovacoes/${encodeURIComponent(r.id)}/${acao}`, corpo);
    fecharPainel();
    const eu = store.usuario?.nome ?? 'você';
    toast(acao === 'aprovar' ? `Aprovada por ${eu}: a peça está pronta pra postar` : `Ajuste de ${eu} salvo: a peça voltou pro time`);
    est.ajustando = false;
    est.editando = false;
    await carregar();
    if (!ehDiretor() && store.E) recarregar().catch(() => {});
  } catch (e) {
    botao.disabled = false;
    toast(e.message);
  } finally {
    est.enviando = false;
  }
}

// o painel da peça (cronograma) manda pra aprovação e a lista tem que refletir na próxima visita
export function invalidar() {
  est.dados = null;
}
