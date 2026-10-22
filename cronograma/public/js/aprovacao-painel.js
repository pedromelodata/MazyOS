// Aprovação técnica no painel lateral (21/10/2026, Pedro): mandar pra aprovação, ver o que disseram e mandar de novo.
// 21/10 (Pedro): 2 etapas. Primeiro os gerentes (os dois aprovam, cada um do seu lado), depois o Diretor contábil (um
// basta). A trilha mostra cada gerente com check ou relógio; na vez do gerente, um atalho leva pra decidir nas Aprovações
// 22/10 (Pedro): "Libere também pedir autorização de Stories a serem feitos". O bloco saiu do detalhe.js pra cá: o painel
// da peça (detalhe.js) e o dos stories do dia (stories.js) usam o mesmo bloco (a situação com a trilha, a explicação
// técnica com o "Escrever com IA", quem aprovou ou pediu ajuste e a conversa) e o mesmo botão de mandar no rodapé.
// Nos stories a aprovação é opcional: o "Marcar como postado" continua livre e o botão de mandar fica do lado dele.
// tipo: 'peca' (reel, carrossel ou estático) ou 'stories' (o dia de stories, id sto_...)
// 22/10 (Pedro): as decisões são "Aprovado", "Aprovado com observação" e "Reprovado". A observação de quem aprovou com
// observação aparece em destaque aqui no bloco (observacoesHtml) e na conversa; o story fala sempre no singular
// 22/10 (Pedro): "Dê opção no sistema de mandar vários para a aprovação, o post juntamente com os story". No formulário
// de mandar, o que pode ir junto no mesmo dia (lote-aprovacao.js, juntosDoDia: na peça, o story do dia que ainda não foi,
// voltou reprovado ou mudou depois de aprovado; no story, os posts do feed do dia) aparece marcado por padrão ("Mandar
// junto o Story · tema (dd/mm)" ou "Mandar junto o post ... (dd/mm)"), com a explicação dele e o "Escrever com IA" dele.
// Marcado, o botão vira "Enviar os 2 para aprovação" e vai tudo pelo POST /api/aprovacoes/lote. Decisões fora do
// contrato: o botão do rodapé que abre o formulário ganha o mesmo rótulo; o que não foi (um item recusado no lote) fica
// num aviso no alto do bloco depois de redesenhar; o texto escrito e não mandado fica guardado (rascunho) até ir
import {
  esc, store, api, recarregar, toast, icone, fecharPainel, navegar, precisaAprovacao, travaPostado, infoAprovacao,
  hojeBrasilia, minhaVez, etapaAprovacao, gerentesFaltando, gerentesDe, lembrarGerentes, juntarNomes, DECISAO,
} from './core.js';
import { explicacaoHtml, conversaHtml, trilhaHtml, observacoesHtml, invalidar as invalidarAprovacoes } from './views/aprovacoes.js';
import {
  juntosDoDia, rotuloJunto, nomeDoItem, ehStory, explicacaoInicial, caixaExplicacao, guardarRascunho, esquecerRascunho,
  escreverComIA, enviarLote, resumoLote,
} from './lote-aprovacao.js';

const tem = (v) => Boolean(String(v ?? '').trim());

// o que muda no texto entre a peça e os stories do dia
// 22/10 (Pedro): o story no singular, como o "Story · tema" do calendário
const FALA = {
  peca: {
    nesta: 'nesta peça',
    editou: 'mudou o texto da peça (já está aqui no roteiro)',
    ajustar: 'Ajuste a peça e mande de novo.',
    alterado: 'O texto mudou depois de aprovado. Mande de novo pra aprovação antes de postar.',
    mandou: (diretor) => (diretor ? 'Mandada pra aprovação: está com o Diretor contábil' : 'Mandada pra aprovação: agora está com os gerentes'),
  },
  stories: {
    nesta: 'neste story',
    editou: 'mudou o texto do story (já está aqui nos quadros)',
    ajustar: 'Ajuste o story e mande de novo.',
    alterado: 'O texto mudou depois de aprovado. Mande de novo pra aprovação.',
    mandou: (diretor) => (diretor ? 'Story mandado pra aprovação: está com o Diretor contábil' : 'Story mandado pra aprovação: agora está com os gerentes'),
  },
};
const fala = (tipo) => FALA[tipo] ?? FALA.peca;

// mandar (ou mandar de novo) só quando ainda não foi, ou quando voltou com ajuste ou mudou depois de aprovado
const podeMandar = (r, postado) => !postado && (!r.aprovacao?.estado || ['ajuste', 'alterado'].includes(r.aprovacao.estado));

// 22/10 (Pedro): o que pode ir junto (só quando este item pode ir) e o rótulo do botão de mandar
const juntosDe = (r, postado) => (podeMandar(r, postado) ? juntosDoDia(r) : []);
const rotuloMandar = (r, nJuntos) => (nJuntos ? `Enviar os ${nJuntos + 1} para aprovação` : r.aprovacao?.estado ? 'Mandar de novo pra aprovação' : 'Enviar para aprovação');
// o que não foi num envio junto: aparece uma vez, no alto do bloco, quando o painel redesenha
const avisosDoLote = new Map();

// cada item que pode ir junto: a caixa de marcar (marcada por padrão) e, marcada, a explicação dele com o "Escrever com IA"
function juntoHtml(x) {
  const story = ehStory(x.id);
  const id = esc(x.id);
  return `
            <div class="dt-apv-junto" data-apv-junto-caixa="${id}">
              <label class="dt-apv-junto-marca"><input type="checkbox" data-apv-junto="${id}" checked /><span>${esc(rotuloJunto(x))}</span></label>
              <div class="dt-apv-junto-corpo">
                <label class="rotulo"><span>Explicação técnica ${story ? 'do story' : 'do post'} <small>por que ${story ? 'este story' : 'este post'} existe, a base contábil dele e o objetivo</small></span>
                  ${caixaExplicacao(`data-apv-exp-junto="${id}"`, explicacaoInicial(x))}
                </label>
                <div class="dt-apv-acoes"><button type="button" class="btn btn-sm" data-apv-ia-junto="${id}">${icone('raio', 14)} Escrever com IA</button></div>
              </div>
            </div>`;
}

// o bloco "Aprovação técnica" do painel. postado: a peça (ou o dia de stories) já foi ao ar
export function blocoAprovacaoHtml(r, { tipo = 'peca', postado = false } = {}) {
  const stories = tipo === 'stories';
  const apv = r.aprovacao ?? null;
  if ((!stories && !precisaAprovacao(r)) || (postado && !apv)) return '';
  const f = fala(tipo);
  const infoApv = infoAprovacao(r);
  const juntos = juntosDe(r, postado);
  // o que não foi no último envio junto (some depois de mostrado)
  const naoForam = avisosDoLote.get(r.id) ?? [];
  avisosDoLote.delete(r.id);
  const avisoLote = naoForam.length
    ? `<div class="dt-apv-nota alerta dt-apv-lote-aviso" role="alert">${icone('alerta', 14)}<span>${naoForam.map((x) => esc(`${x.nome} não foi: ${x.erro}`)).join('<br />')}</span></div>` : '';
  const vezApv = minhaVez(r);
  const dias = r.data ? Math.round((Date.parse(`${r.data}T12:00:00`) - Date.parse(`${hojeBrasilia()}T12:00:00`)) / 86400000) : null;
  // quem aprovou ou ajustou, com nome e hora (21/10, Pedro: sempre a confirmação de quem foi)
  const estadoHtml = infoApv
    ? `<span class="dt-apv-estado" id="dt-apv-estado" data-estado="${esc(infoApv.estado)}">${icone(infoApv.icone, 15)}${esc(infoApv.dica)}</span>`
    : '<span class="dt-apv-estado">Ainda não foi pra aprovação</span>';
  // 21/10 (Pedro): o "Enviar para aprovação" fica no rodapé, no lugar do "Marcar como postado" (que só volta
  // depois de aprovada). Peça de data passada não pede aprovação (travaPostado)
  // 22/10 (Pedro): nos stories a aprovação é opcional, e a nota diz isso
  // 22/10 (Pedro): o ajuste agora é "Reprovado por <nome>"
  const quemReprovou = esc(apv?.decididoPor ? `${DECISAO.reprovado} por ${apv.decididoPor}` : DECISAO.reprovado);
  let nota = '';
  if (!apv?.estado && !postado) {
    if (stories) nota = '<p class="dt-apv-nota">Opcional no story: mande quando quiser a conferência dos gerentes e do Diretor contábil. Marcar como postado não depende dela.</p>';
    else if (travaPostado(r)) {
      nota = `<p class="dt-apv-nota${dias != null && dias <= 1 ? ' alerta' : ''}">${dias != null && dias <= 1
        ? `${icone('alerta', 14)} ${dias === 0 ? 'Posta hoje' : 'Posta amanhã'}: mande pra aprovação agora.`
        : 'Mande pra aprovação de preferência um dia antes de postar: primeiro os gerentes, depois o Diretor contábil. Aprovada, o botão do rodapé vira "Marcar como postado".'}</p>`;
    }
  } else if (apv?.estado === 'ajuste') {
    nota = `<p class="dt-apv-nota alerta">${apv.tipoAjuste === 'editado' ? `${quemReprovou}: o pedido está na conversa. ${esc(apv.decididoPor || 'Quem reprovou')} ${f.editou}. Confira, ajuste o que faltar e mande de novo.` : `${quemReprovou}: o pedido de ajuste está na conversa. ${f.ajustar}`}</p>`;
  } else if (apv?.estado === 'alterado') {
    nota = `<p class="dt-apv-nota alerta">${f.alterado}</p>`;
  }
  // a vez de quem está vendo: o gerente decide nas Aprovações técnicas (lá ele vê a peça inteira e a explicação)
  const faltamOutros = gerentesFaltando(r).filter((g) => g.id !== store.usuario?.id).map((g) => g.nome).filter(Boolean);
  const vez = vezApv === 'decidir'
    ? `<div class="dt-apv-vez"><p>${etapaAprovacao(apv) === 'gerentes' ? `Falta a sua decisão ${f.nesta} (etapa dos gerentes).` : `Falta a sua decisão ${f.nesta}.`}</p><button type="button" class="btn btn-primario btn-sm" data-apv-ir>${icone('escudo', 14)} Aprovar ou reprovar</button></div>`
    : vezApv === 'aguardar' ? `<p class="dt-apv-nota">Você já aprovou. ${faltamOutros.length ? `Falta${faltamOutros.length > 1 ? 'm' : ''} ${esc(juntarNomes(faltamOutros))}.` : 'Falta o outro gerente.'}</p>` : '';
  return `
      <section class="bloco" id="dt-apv">
        <div class="bloco-titulo">Aprovação técnica</div>
        <div class="dt-apv">
          ${estadoHtml}
          ${avisoLote}
          ${nota}
          ${observacoesHtml(r)}
          ${vez}
          <div id="dt-apv-trilha">${trilhaHtml(r)}</div>
          ${apv?.explicacao && apv.estado !== 'ajuste' ? `<details class="dt-apv-exp"><summary>Explicação técnica</summary>${explicacaoHtml(apv.explicacao)}</details>` : ''}
          ${podeMandar(r, postado) ? `
          <div class="dt-apv-form" id="dt-apv-form" hidden>
            <label class="rotulo"><span>Explicação técnica <small>${stories ? 'por que este story existe, a base contábil dele' : 'por que este post existe, a base contábil dele'} e o objetivo, curto e sem firula</small></span>
              <textarea class="campo" id="dt-apv-exp" rows="8" maxlength="3000" placeholder="Por que este post: ...&#10;Base técnica:&#10;• ... (F051)&#10;Objetivo: ...">${esc(explicacaoInicial(r))}</textarea>
            </label>
            ${juntos.length ? `
            <div class="dt-apv-acoes"><button type="button" class="btn btn-sm" data-apv-ia>${icone('raio', 14)} Escrever com IA</button></div>
            <div class="dt-apv-juntos" role="group" aria-label="Mandar junto">${juntos.map(juntoHtml).join('')}</div>
            <div class="dt-apv-acoes">
              <button type="button" class="btn btn-primario" data-apv-enviar>${icone('escudo', 15)} ${esc(rotuloMandar(r, juntos.length))}</button>
              <button type="button" class="btn btn-fantasma" data-apv-cancelar>Cancelar</button>
            </div>` : `
            <div class="dt-apv-acoes">
              <button type="button" class="btn" data-apv-ia>${icone('raio', 15)} Escrever com IA</button>
              <button type="button" class="btn btn-primario" data-apv-enviar>${icone('escudo', 15)} Enviar</button>
              <button type="button" class="btn btn-fantasma" data-apv-cancelar>Cancelar</button>
            </div>`}
          </div>` : ''}
          ${apv?.conversa?.length ? conversaHtml(apv.conversa).replace('<section class="bloco">', '<section class="dt-apv-conversa">') : ''}
          ${apv?.estado ? `
          <div class="dt-apv-form">
            <label class="rotulo"><span class="sr-only">Responder na conversa</span><textarea class="campo" id="dt-apv-msg" rows="2" maxlength="2000" placeholder="Responder na conversa da aprovação"></textarea></label>
            <div class="dt-apv-acoes"><button type="button" class="btn btn-sm" data-apv-responder>${icone('balao', 14)} Responder</button></div>
          </div>` : ''}
        </div>
      </section>`;
}

// o botão de mandar do rodapé: "Esperando aprovação" (desligado) enquanto está com os gerentes ou o diretor; "Enviar para
// aprovação" ou "Mandar de novo pra aprovação" quando pode mandar; nada depois de aprovado ou postado.
// primario: na peça ele toma o lugar do "Marcar como postado"; nos stories fica do lado dele, como botão comum
export function botaoAprovacaoHtml(r, { postado = false, primario = true } = {}) {
  const apv = r.aprovacao ?? null;
  if (postado) return '';
  if (apv?.estado === 'pendente') {
    return `<button class="btn" id="dt-apv-esperando" disabled title="${esc(infoAprovacao(r)?.dica ?? 'Com o Diretor contábil')}">${icone('relogio', 16)} Esperando aprovação</button>`;
  }
  if (!podeMandar(r, postado)) return '';
  // 22/10 (Pedro): com o story (ou o post) do dia marcado pra ir junto, "Enviar os 2 para aprovação"
  return `<button class="btn${primario ? ' btn-primario' : ''}" data-apv-abrir>${icone('escudo', 16)} ${esc(rotuloMandar(r, juntosDe(r, postado).length))}</button>`;
}

// liga o bloco e o botão do rodapé: explicação (à mão ou rascunho da IA), enviar, a vez do gerente e responder na conversa.
// reabrir(id): redesenha o painel depois de mandar ou responder (com o estado recarregado)
export function ligarAprovacao(p, r, { tipo = 'peca', reabrir } = {}) {
  const q = (s) => p.querySelector(s);
  const apv = r.aprovacao ?? null;
  const formApv = q('#dt-apv-form');
  const abrirApv = q('[data-apv-abrir]');
  // o botão é o do rodapé: abre o formulário da explicação no bloco "Aprovação técnica" e leva até ele
  if (abrirApv && formApv) abrirApv.onclick = () => {
    formApv.hidden = false;
    formApv.scrollIntoView({ block: 'center', behavior: 'smooth' });
    q('#dt-apv-exp')?.focus({ preventScroll: true });
  };
  const cancelarApv = q('[data-apv-cancelar]');
  if (cancelarApv && formApv) cancelarApv.onclick = () => { formApv.hidden = true; abrirApv?.focus(); };
  const campoApv = q('#dt-apv-exp');
  // 22/10: o texto escrito fica guardado até ir (fechar o painel não perde)
  if (campoApv) campoApv.oninput = () => guardarRascunho(r.id, campoApv.value);
  const iaApv = q('[data-apv-ia]');
  if (iaApv) iaApv.onclick = async () => {
    try {
      await escreverComIA(iaApv, campoApv, r.id);
      toast('Rascunho pronto: confira antes de enviar');
    } catch (e) { toast(e.message); }
  };
  // 22/10 (Pedro): o que vai junto (o story do dia no painel da peça; o post do dia no do story)
  const caixasJunto = [...p.querySelectorAll('[data-apv-junto]')];
  const campoJunto = (id) => p.querySelector(`[data-apv-exp-junto="${CSS.escape(id)}"]`);
  const marcados = () => caixasJunto.filter((c) => c.checked).map((c) => c.dataset.apvJunto);
  const enviarApv = q('[data-apv-enviar]');
  const atualizarJuntos = () => {
    const n = marcados().length;
    for (const c of caixasJunto) {
      const corpo = c.closest('[data-apv-junto-caixa]')?.querySelector('.dt-apv-junto-corpo');
      if (corpo) corpo.hidden = !c.checked;
    }
    if (enviarApv) enviarApv.innerHTML = `${icone('escudo', 15)} ${esc(n ? rotuloMandar(r, n) : 'Enviar')}`;
    if (abrirApv) abrirApv.innerHTML = `${icone('escudo', 16)} ${esc(rotuloMandar(r, n))}`;
  };
  for (const c of caixasJunto) {
    c.onchange = atualizarJuntos;
    const campo = campoJunto(c.dataset.apvJunto);
    if (campo) campo.oninput = () => guardarRascunho(c.dataset.apvJunto, campo.value);
  }
  p.querySelectorAll('[data-apv-ia-junto]').forEach((b) => (b.onclick = async () => {
    try {
      await escreverComIA(b, campoJunto(b.dataset.apvIaJunto), b.dataset.apvIaJunto);
      toast('Rascunho pronto: confira antes de enviar');
    } catch (e) { toast(e.message); }
  }));
  if (enviarApv) enviarApv.onclick = async () => {
    const explicacao = campoApv.value.trim();
    if (!explicacao) { toast('Escreva a explicação técnica (ou use "Escrever com IA").'); campoApv.focus(); return; }
    const juntos = marcados().map((id) => ({ id, campo: campoJunto(id), nome: nomeDoItem(juntosDoDia(r).find((x) => x.id === id) ?? { id }) }));
    const semTexto = juntos.find((j) => !j.campo?.value.trim());
    if (semTexto) { toast(`Escreva a explicação de ${semTexto.nome} (ou use "Escrever com IA").`); semTexto.campo?.focus(); return; }
    enviarApv.disabled = true;
    if (!juntos.length) {
      try {
        const novo = await api('POST', `/api/aprovacoes/${encodeURIComponent(r.id)}/enviar`, { explicacao });
        esquecerRascunho(r.id);
        invalidarAprovacoes();
        await recarregar();
        reabrir?.(r.id);
        // 21/10: sem gerente cadastrado, o servidor já manda direto pro Diretor contábil
        toast(fala(tipo).mandou(etapaAprovacao(novo?.aprovacao) === 'diretor'));
      } catch (e) {
        enviarApv.disabled = false;
        toast(e.message);
      }
      return;
    }
    // 22/10 (Pedro): os dois (ou mais) juntos, pelo lote: cada um com a regra de sempre, e o que falha não derruba o resto
    const itens = [{ id: r.id, explicacao, nome: nomeDoItem(r) }, ...juntos.map((j) => ({ id: j.id, explicacao: j.campo.value.trim(), nome: j.nome }))];
    let res;
    try {
      res = await enviarLote(itens.map(({ id, explicacao: txt }) => ({ id, explicacao: txt })));
    } catch (e) {
      enviarApv.disabled = false;
      toast(e.message);
      return;
    }
    const naoForam = itens.map((x) => ({ ...x, r: res.find((y) => y?.id === x.id) }))
      .filter((x) => !x.r?.ok).map((x) => ({ nome: x.nome, erro: x.r?.erro || 'o servidor não respondeu sobre ele.' }));
    if (naoForam.length) avisosDoLote.set(r.id, naoForam);
    await recarregar().catch(() => {});
    reabrir?.(r.id);
    toast(resumoLote(itens.map((x) => res.find((y) => y?.id === x.id) ?? { id: x.id, ok: false })));
  };
  // 21/10: a vez do gerente: abre a peça nas Aprovações técnicas, pronta pra aprovar ou ajustar
  const irApv = q('[data-apv-ir]');
  if (irApv) irApv.onclick = () => { fecharPainel(); navegar(`#/aprovacoes?abrir=${encodeURIComponent(r.id)}`); };
  // a peça do /api/estado não traz quem são os gerentes: sem a lista guardada, busca uma vez e redesenha a trilha
  if (apv?.estado === 'pendente' && etapaAprovacao(apv) === 'gerentes' && !gerentesDe(r)) {
    api('GET', '/api/aprovacoes').then((dados) => {
      lembrarGerentes(dados);
      const trilha = q('#dt-apv-trilha');
      if (!trilha?.isConnected || !gerentesDe(r)) return;
      trilha.innerHTML = trilhaHtml(r);
      const est = q('#dt-apv-estado');
      const info = infoAprovacao(r);
      if (!info) return;
      if (est) est.innerHTML = `${icone(info.icone, 15)}${esc(info.dica)}`;
      // 21/10 (Pedro): a pílula do topo e o "Esperando aprovação" do rodapé ganham o "(1 de 2)" junto com a trilha
      const pilula = q('.dt-apv-pill');
      if (pilula) {
        pilula.innerHTML = `${icone(info.icone, 13)}${esc(info.curto ?? info.nome)}`;
        pilula.title = info.dica;
      }
      const esperando = q('#dt-apv-esperando');
      if (esperando) esperando.title = info.dica;
    }).catch(() => {});
  }
  const responderApv = q('[data-apv-responder]');
  if (responderApv) responderApv.onclick = async () => {
    const texto = q('#dt-apv-msg').value.trim();
    if (!texto) { q('#dt-apv-msg').focus(); return; }
    responderApv.disabled = true;
    try {
      await api('POST', `/api/aprovacoes/${encodeURIComponent(r.id)}/mensagem`, { texto });
      invalidarAprovacoes();
      await recarregar();
      reabrir?.(r.id);
      toast('Resposta enviada');
    } catch (e) {
      responderApv.disabled = false;
      toast(e.message);
    }
  };
}

// a pílula do topo do painel (some depois de postado)
export function pilulaAprovacaoHtml(r, { postado = false } = {}) {
  const info = postado ? null : infoAprovacao(r);
  return info ? `<span class="pill dt-apv-pill" data-estado="${esc(info.estado)}" title="${esc(info.dica)}">${icone(info.icone, 13)}${esc(info.curto ?? info.nome)}</span>` : '';
}
