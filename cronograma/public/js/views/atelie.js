// Ateliê (21/10/2026, Pedro): "aba Ateliê toda vez que for criar um reel, carrossel ou estático". O motor de criação
// da marca (identidade/brandmkt/05-motor-atelie) dentro do app: o passo 1 de sempre (peça, dia, tipo e formato, de
// chat.js), depois o chat com a IA à esquerda e o CARD da peça à direita. O card chega pela ferramenta mostrar_card
// (agente.mjs) com a conferência por código das regras duras (atelie.mjs): bloqueante não deixa salvar; alerta e
// revisar ficam pra decidir. Salva, a peça vai pro cronograma e o card oferece mandar pra aprovação técnica.
// Sair da aba e voltar mantém a conversa (o nó fica guardado e volta pro lugar); "Nova peça" começa outra.
import {
  esc, icone, fmtData, pecaInfo, pillTipo, formato, pillFormato, blocosRoteiro, roteiroTresHtml, recarregar,
} from '../core.js';
import { abrirCriar, abrirChat } from '../chat.js';
import { abrirDetalhe } from '../detalhe.js';

const est = { no: null, raiz: null, chat: null, card: null, salvo: null, mudouDepois: false, pedido: null, comecou: false };
const tem = (v) => Boolean(String(v ?? '').trim());

const NIVEL = {
  bloqueante: { nome: 'Bloqueante', icone: 'fechar' },
  alerta: { nome: 'Alerta', icone: 'alerta' },
  revisar: { nome: 'Revisar', icone: 'olho' },
};
const VOZ = { pedro: 'Pedro', colega: 'Alguém do time', institucional: 'A marca', leo: 'Léo' };
const AVISO_TROCA = 'Começar outra peça? A conversa de agora sai da tela (o que já foi salvo continua no cronograma).';

export function render(root) {
  est.raiz = root;
  // pedido pela URL (#/atelie?peca=carrossel&data=...): vem do menu, do dia do cronograma, da ideia ou da biblioteca
  const qs = location.hash.split('?')[1] ?? '';
  const pedido = Object.fromEntries(new URLSearchParams(qs));
  if (qs) history.replaceState(null, '', '#/atelie');
  const temPedido = Object.keys(pedido).length > 0;
  if (est.no && !temPedido) { root.replaceChildren(est.no); return; }
  if (est.no && temPedido && est.comecou && !est.salvo && !window.confirm(AVISO_TROCA)) { root.replaceChildren(est.no); return; }
  novo(pedido);
}

function novo(pedido = {}) {
  Object.assign(est, { chat: null, card: null, salvo: null, mudouDepois: false, pedido: null, comecou: false });
  const no = document.createElement('div');
  no.className = 'atelie';
  no.innerHTML = `
    <header class="atelie-topo">
      <div>
        <h1>Ateliê</h1>
        <p class="atelie-sub">Toda peça nova nasce aqui. Você pede no chat, o Ateliê escreve o card e confere as regras da marca antes de salvar.</p>
      </div>
      <button type="button" class="btn" data-atelie-nova hidden>${icone('mais', 16)}Nova peça</button>
    </header>
    <div class="atelie-pedido card"></div>
    <div class="atelie-grade" hidden>
      <section class="atelie-chat card" aria-label="Conversa com o Ateliê"></section>
      <section class="atelie-card" aria-label="Card da peça"></section>
    </div>`;
  est.no = no;
  est.raiz?.replaceChildren(no);
  no.querySelector('[data-atelie-nova]').onclick = () => {
    if (est.comecou && !est.salvo && !window.confirm(AVISO_TROCA)) return;
    novo({});
  };
  abrirCriar(
    { peca: pedido.peca || 'reel', data: pedido.data || '', formatoId: pedido.formatoId || '', ideiaId: pedido.ideiaId || '', tipo: pedido.tipo || '' },
    { alvo: no.querySelector('.atelie-pedido'), aoComecar: comecar },
  );
}

function comecar(sel) {
  const no = est.no;
  if (!no) return;
  est.comecou = true;
  est.pedido = sel;
  const pedido = no.querySelector('.atelie-pedido');
  pedido.hidden = true;
  pedido.replaceChildren();
  no.querySelector('.atelie-grade').hidden = false;
  no.querySelector('[data-atelie-nova]').hidden = false;
  desenharCard();
  est.chat = abrirChat(sel, {
    alvo: no.querySelector('.atelie-chat'),
    aoCard: (ev) => { est.card = ev; if (est.salvo) est.mudouDepois = true; desenharCard(); },
    aoSalvo: (reel) => { est.salvo = reel; est.mudouDepois = false; desenharCard(); },
  });
}

// ── card ──
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
      ${tem(s.visual) ? `<p class="atelie-visual">${icone('olho', 13)}${esc(s.visual)}</p>` : ''}
    </li>`).join('')}</ol>`;
}
function arteHtml(e = {}) {
  const partes = [['headline', 'Headline', 'gancho'], ['apoio', 'Texto de apoio', 'dev'], ['cta', 'CTA', 'cta']].filter(([k]) => tem(e[k]));
  if (!partes.length) return '<p class="dt-vazio">sem arte</p>';
  return `<ol class="rt-blocos">${partes.map(([k, nome, parte]) => `
    <li class="rt-bloco" data-parte="${parte}"><div class="rt-cab"><span class="rt-rotulo">${esc(nome)}</span></div><p class="${k === 'headline' ? 'rt-fala' : 'pc-texto'}">${esc(e[k])}</p></li>`).join('')}
    ${tem(e.visual) ? `<li class="atelie-visual">${icone('olho', 13)}${esc(e.visual)}</li>` : ''}</ol>`;
}

function conferenciaHtml(qa) {
  if (!qa) return '';
  const falhas = qa.itens.filter((i) => !i.ok);
  const ok = qa.itens.filter((i) => i.ok);
  const ordem = { bloqueante: 0, alerta: 1, revisar: 2 };
  falhas.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
  const resumo = falhas.length
    ? [qa.contagem.bloqueante && `${qa.contagem.bloqueante} bloqueante${qa.contagem.bloqueante > 1 ? 's' : ''}`,
      qa.contagem.alerta && `${qa.contagem.alerta} alerta${qa.contagem.alerta > 1 ? 's' : ''}`,
      qa.contagem.revisar && `${qa.contagem.revisar} pra revisar`].filter(Boolean).join(' · ')
    : `As ${qa.itens.length} regras passaram`;
  return `
    <section class="atelie-qa" data-bloqueia="${qa.bloqueia}">
      <div class="atelie-qa-topo">
        <div class="bloco-titulo">Conferência do Ateliê</div>
        <span class="atelie-qa-resumo" data-estado="${qa.bloqueia ? 'bloqueante' : falhas.length ? 'alerta' : 'ok'}">${icone(qa.bloqueia ? 'fechar' : falhas.length ? 'alerta' : 'check', 14)}${esc(resumo)}</span>
      </div>
      ${falhas.length ? `<ul class="atelie-qa-lista">${falhas.map((i) => `
        <li class="atelie-qa-item" data-nivel="${esc(i.nivel)}">
          <span class="atelie-qa-ico" aria-hidden="true">${icone(NIVEL[i.nivel]?.icone ?? 'alerta', 14)}</span>
          <div>
            <strong>${esc(i.nome)}</strong><span class="atelie-qa-nivel">${esc(NIVEL[i.nivel]?.nome ?? i.nivel)}</span>
            ${i.achados.map((a) => `<p class="atelie-qa-achado"><b>${esc(a.onde)}:</b> ${esc(a.trecho)}</p>`).join('')}
            ${tem(i.dica) ? `<p class="atelie-qa-dica">${esc(i.dica)}</p>` : ''}
          </div>
        </li>`).join('')}</ul>` : ''}
      ${ok.length ? `<details class="atelie-qa-ok"><summary>${ok.length} regra${ok.length > 1 ? 's' : ''} ok</summary><ul>${ok.map((i) => `<li>${icone('check', 13)}${esc(i.nome)}${i.id === 'repeticao' && /propósito/.test(i.dica) ? ` <small>(${esc(i.dica)})</small>` : ''}</li>`).join('')}</ul></details>` : ''}
    </section>`;
}

function desenharCard() {
  const caixa = est.no?.querySelector('.atelie-card');
  if (!caixa) return;
  const ev = est.card;
  if (!ev) {
    caixa.innerHTML = `
      <div class="atelie-card-vazio card">
        <span class="atelie-card-vazio-ico">${icone('editar', 22)}</span>
        <strong>O card da peça aparece aqui</strong>
        <p>Quando a versão estiver pronta, o Ateliê mostra a peça inteira com público, persona, funil e a conferência das regras duras (travessão, P39, concorrente, MEI sem contador, número com fonte, legenda sem hashtag). Com bloqueante, não salva.</p>
      </div>`;
    return;
  }
  const c = ev.card ?? {};
  const pecas = ev.pecas ?? [est.pedido?.peca ?? 'reel'];
  const p = pecaInfo(pecas[0]) ?? pecaInfo('reel');
  const f = ev.formatoId ? formato(ev.formatoId) : null;
  const meta = [
    ['Público', c.publico],
    ['Persona', c.persona ? `${c.persona === 'geral' ? 'Geral' : `${c.persona} ${c.personaNome ?? ''}`}` : ''],
    ['Funil', c.estagioFunil],
    ['Ironia', c.dialIronia],
    ['Quem fala', VOZ[c.voz] ?? c.voz],
    ['Valor', c.valorExplicito == null ? '' : c.valorExplicito ? 'cita preço ou data' : 'sem preço nem data'],
    // 21/10 (estratégia principal): pilar × gatilho emocional × gatilho psicológico
    ['Pilar', c.pilar ? String(c.pilar) : ''],
    ['Gatilho emocional', c.gatilhoEmocional],
    ['Gatilho psicológico', c.gatilhoPsicologico],
  ].filter(([, v]) => tem(v));
  let conteudo = '';
  if (pecas.includes('reel') && (tem(c.hook) || c.cenas?.length)) {
    conteudo += `<section class="bloco"><div class="bloco-titulo">Roteiro</div>${roteiroTresHtml(blocosRoteiro({ hook: c.hook, textoTela: c.textoTela, cenas: c.cenas, desenvolvimento: c.desenvolvimento, cta: c.cta }))}</section>`;
  }
  if (c.carrossel) conteudo += `<section class="bloco"><div class="bloco-titulo">Carrossel</div>${slidesHtml(c.carrossel)}</section>`;
  if (c.estatico) conteudo += `<section class="bloco"><div class="bloco-titulo">Arte</div>${arteHtml(c.estatico)}</section>`;
  const bloqueia = Boolean(ev.qa?.bloqueia);
  const salvo = est.salvo;
  const acoes = salvo && !est.mudouDepois
    ? `<span class="atelie-salvo">${icone('check', 15)}Salvo no cronograma</span>
       <button type="button" class="btn" data-atelie-abrir>${icone('calendario', 15)}Abrir no cronograma</button>
       <button type="button" class="btn btn-primario" data-atelie-aprovacao>${icone('escudo', 15)}Enviar para aprovação</button>`
    : `<button type="button" class="btn btn-primario" data-atelie-salvar ${bloqueia ? 'disabled' : ''}>${icone('check', 15)}${salvo ? 'Salvar de novo' : 'Salvar no cronograma'}</button>
       <span class="atelie-acao-nota">${bloqueia ? 'Tem bloqueante: peça pro Ateliê corrigir no chat.' : salvo ? 'O card mudou depois de salvo.' : 'Salvar manda o "pode salvar" pro chat.'}</span>`;
  caixa.innerHTML = `
    <article class="atelie-peca card">
      <header class="atelie-peca-topo">
        <div class="dt-pills">
          <span class="pill pill-peca">${icone(p.icone, 13)}${esc(p.nome)}</span>
          ${ev.tipo ? pillTipo(ev.tipo, { semTipo: false }) : ''}
          ${ev.data ? `<span class="pill">${icone('calendario', 13)}${esc(fmtData(ev.data, { diaSemana: true }))}</span>` : ''}
          ${f ? pillFormato(f) : ''}
        </div>
        <h2>${esc(c.ideia ?? '')}</h2>
        ${tem(c.tema) ? `<p class="atelie-tema">${esc(c.tema)}</p>` : ''}
      </header>
      ${meta.length ? `<dl class="atelie-meta">${meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${tem(c.excecaoAntiRepeticao) ? `<p class="atelie-repete">${icone('bandeira', 14)}Repete de propósito: ${esc(c.excecaoAntiRepeticao)}</p>` : ''}
      ${conferenciaHtml(ev.qa)}
      ${conteudo}
      ${tem(c.legenda) ? `<section class="bloco"><div class="bloco-titulo">Legenda</div><div class="texto atelie-legenda">${esc(c.legenda)}</div></section>` : ''}
      ${(c.fontes ?? []).length ? `<section class="bloco"><div class="bloco-titulo">Fontes</div><ul class="apv-fontes">${c.fontes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
      <footer class="atelie-acoes">${acoes}</footer>
    </article>`;
  const q = (s) => caixa.querySelector(s);
  q('[data-atelie-salvar]')?.addEventListener('click', () => {
    if (!est.chat || est.chat.ocupado()) return;
    est.chat.enviar('Sim, pode salvar');
  });
  q('[data-atelie-abrir]')?.addEventListener('click', async () => { await recarregar(); abrirDetalhe(est.salvo.id); });
  q('[data-atelie-aprovacao]')?.addEventListener('click', async () => {
    await recarregar();
    abrirDetalhe(est.salvo.id);
    // o painel da peça abre com o formulário de envio já aberto (o botão do rodapé leva até ele)
    requestAnimationFrame(() => document.querySelector('#painel [data-apv-abrir]')?.click());
  });
}
