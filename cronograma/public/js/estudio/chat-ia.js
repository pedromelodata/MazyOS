// 23/10 (Pedro: "na edição, deixe um chat para pedir a IA para alterar algumas coisas"): o chat da IA do editor. A
// pessoa pede o ajuste em palavras ("deixa o Léo maior", "troca o fundo desta página") e o servidor manda pra IA o
// design como está (POST /api/estudio/docs/:id/ajustar-ia); a IA muda só o que foi pedido e volta uma versão nova (a
// de antes fica em Versões; o Ctrl+Z desfaz na tela). Enquanto a IA trabalha, a página fica parada: mexer nela no meio
// faria o ajuste chegar em cima de uma versão velha. A conversa fica guardada nesta aba do navegador, por design
import { esc } from '../core.js';
import * as A from './api.js';
import { ic } from './icones.js';

const SUGESTOES = ['Deixa o Léo maior', 'Encurta o texto desta página', 'Troca o fundo desta página pro coral'];
const GUARDADAS = 40;
const QUEM = new Set(['voce', 'ia', 'erro']);
const chave = (id) => `est-chat-ia-${id}`;

function lerConversa(id) {
  try {
    const v = JSON.parse(sessionStorage.getItem(chave(id)) ?? '[]');
    return Array.isArray(v) ? v.filter((m) => m && QUEM.has(m.quem) && typeof m.texto === 'string') : [];
  } catch {
    return [];
  }
}
function gravarConversa(id, msgs) {
  try {
    sessionStorage.setItem(chave(id), JSON.stringify(msgs.slice(-GUARDADAS)));
  } catch { /* sem armazenamento: a conversa fica só na memória */ }
}

// antes(): sai do texto e salva o que estiver pendente. aoPronto(doc, ajuste): a versão nova chegou. aoOcupar(sim):
// trava e destrava a página. aoConflito(): alguém gravou outra versão no meio. refazerInteiro(): o "Gerar com IA"
export function montarChatIa(ed, { antes, aoPronto, aoOcupar, aoConflito, refazerInteiro }) {
  const msgs = lerConversa(ed.id);
  let esperando = false;
  let inicio = 0;
  let relogio = null;
  const el = document.createElement('section');
  el.className = 'est-chat';
  el.setAttribute('aria-label', 'Ajustar o design com a IA');
  el.hidden = true;
  el.innerHTML = `
    <header class="est-chat-topo">
      <span class="est-chat-ico" aria-hidden="true">${ic('ia', 15)}</span>
      <strong>Ajustar com a IA</strong>
      <button type="button" class="btn-icone btn-sm" data-chat="fechar" aria-label="Fechar o chat" title="Fechar">${ic('fechar', 16)}</button>
    </header>
    <div class="est-chat-msgs" role="log" aria-live="polite"></div>
    <form class="est-chat-form">
      <textarea class="campo" rows="2" maxlength="2000" aria-label="O que a IA deve mudar" placeholder="O que mudar? Ex.: deixa o Léo maior na capa"></textarea>
      <button type="submit" class="btn btn-primario btn-sm" aria-label="Enviar" title="Enviar (Enter)">${ic('subir', 16)}</button>
    </form>
    <button type="button" class="est-chat-refazer" data-chat="refazer">${ic('restaurar', 14)}Refazer o design inteiro com a IA</button>`;
  const lista = el.querySelector('.est-chat-msgs');
  const form = el.querySelector('form');
  const campo = form.querySelector('textarea');
  const enviarBt = form.querySelector('[type="submit"]');

  const segundos = () => Math.round((Date.now() - inicio) / 1000);
  const linhaEspera = () => `<span class="est-girando" aria-hidden="true"></span><p>Ajustando o design (${segundos()} s). Costuma levar de 30 s a 2 min.</p>`;
  function pintar() {
    if (!msgs.length && !esperando) {
      lista.innerHTML = `
        <p class="est-chat-vazio">A IA muda só o que você pedir e salva como versão nova.</p>
        <div class="est-chat-sugestoes">${SUGESTOES.map((s) => `<button type="button" class="est-chip" data-sugestao="${esc(s)}">${esc(s)}</button>`).join('')}</div>`;
      return;
    }
    lista.innerHTML = msgs.map((m) => `
      <div class="est-chat-msg" data-quem="${m.quem}">
        ${m.quem === 'erro' ? ic('alerta', 15) : ''}
        <div>
          <p>${esc(m.texto)}</p>
          ${m.avisos?.length ? `<ul>${m.avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
          ${m.paginas?.length ? `<p class="est-chat-pags">${m.paginas.map((n) => `<button type="button" data-ir="${Number(n)}">Página ${Number(n)}</button>`).join('')}</p>` : ''}
        </div>
      </div>`).join('') + (esperando ? `<div class="est-chat-msg" data-quem="espera">${linhaEspera()}</div>` : '');
    lista.scrollTop = lista.scrollHeight;
  }
  function travar(sim) {
    campo.disabled = sim;
    enviarBt.disabled = sim;
    el.querySelectorAll('[data-chat]').forEach((b) => { b.disabled = sim; });
    aoOcupar(sim);
  }

  async function enviar(texto) {
    const pedido = String(texto ?? '').trim();
    if (!pedido || esperando || !ed.doc) return;
    // a conversa até aqui vai junto (o "deixa maior ainda" depende do pedido de antes); o erro fica só na tela
    const conversa = msgs.filter((m) => m.quem !== 'erro').slice(-12).map((m) => ({ quem: m.quem, texto: m.texto.slice(0, 3000) }));
    msgs.push({ quem: 'voce', texto: pedido });
    gravarConversa(ed.id, msgs);
    campo.value = '';
    esperando = true;
    inicio = Date.now();
    travar(true);
    pintar();
    relogio = setInterval(() => {
      const w = lista.querySelector('[data-quem="espera"]');
      if (w) w.innerHTML = linhaEspera();
    }, 1000);
    try {
      await antes();
      const r = await A.ajustarComIa(ed.id, { versao: ed.doc.versao, pedido, pagina: ed.idx + 1, conversa });
      const aj = r?.ajuste ?? {};
      msgs.push({ quem: 'ia', texto: aj.resposta || 'Pronto.', avisos: Array.isArray(aj.avisos) ? aj.avisos : [], paginas: aj.semMudanca ? [] : aj.paginas ?? [] });
      if (!aj.semMudanca && r?.id) aoPronto(r, aj);
    } catch (e) {
      // "sem IA" só quando falta a chave (o MSG_SEM_IA do servidor); o resto, a mensagem do servidor como ela é
      const semIa = /chave do Claude|Falta ligar a IA/i.test(e.message || '');
      if (e.status === 409 && e.corpo?.versaoAtual != null) aoConflito();
      msgs.push({ quem: 'erro', texto: semIa ? 'A IA não está ligada neste servidor: falta colar a chave do Claude.' : e.message || 'A IA não respondeu. Tente de novo.', avisos: Array.isArray(e.corpo?.problemas) ? e.corpo.problemas : [] });
    } finally {
      clearInterval(relogio);
      esperando = false;
      travar(false);
      gravarConversa(ed.id, msgs);
      pintar();
      if (!el.hidden) campo.focus();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    enviar(campo.value);
  });
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      enviar(campo.value);
    }
  });
  el.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('button') : null;
    if (!b || b.disabled) return;
    if (b.dataset.chat === 'fechar') fechar();
    else if (b.dataset.chat === 'refazer') refazerInteiro();
    else if (b.dataset.sugestao) { campo.value = b.dataset.sugestao; campo.focus(); }
    else if (b.dataset.ir) ed.irPagina(Number(b.dataset.ir) - 1);
  });

  function abrir() {
    el.hidden = false;
    pintar();
    if (!esperando) campo.focus();
  }
  function fechar() {
    if (esperando) return;
    el.hidden = true;
  }
  return {
    el,
    abrir,
    fechar,
    alternar: () => (el.hidden ? abrir() : fechar()),
    destruir() {
      clearInterval(relogio);
      el.remove();
    },
  };
}
