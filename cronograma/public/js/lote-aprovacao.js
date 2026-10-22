// Mandar vários pra aprovação de uma vez (22/10/2026). Pedido do Pedro: "Dê opção no sistema de mandar vários para a
// aprovação, o post juntamente com os story".
// 22/10 (Pedro): POST /api/aprovacoes/lote { itens: [{ id, explicacao }] } (de 1 a 30) manda cada item (peça de feed ou
// story do dia) com a mesma regra do "Enviar para aprovação" de um só e devolve { resultados: [{ id, ok, erro?, item? }] }:
// um que falha não derruba os outros. O conjunto fica marcado em aprovacao.lote e a aba Aprovações mostra os itens juntos.
// Aqui fica o que os dois caminhos da tela usam em comum:
//  1. o painel da peça e o do story (aprovacao-painel.js): "Mandar junto o Story · tema (dd/mm)" ou "Mandar junto o post
//     ... (dd/mm)", com o que pode ir junto no mesmo dia (juntosDoDia) e o rascunho da explicação de cada um;
//  2. a seleção do Cronograma (views/cronograma.js): o que pode ser marcado (bloqueio) e o painel "Mandar vários pra
//     aprovação" (abrirLote), com a explicação de cada item, "Escrever com IA" em cada um, "Escrever todas com IA" (um
//     por vez, com o progresso), "Usar a mesma explicação em todos" e o resultado de cada um depois de mandar.
// Decisões fora do contrato: a explicação de cada item começa como no painel de um só (o rascunho escrito antes, a
// explicação da ida anterior ou "Por que este post: <motivo>"); o que foi escrito e ainda não foi mandado fica guardado
// enquanto a página está aberta (rascunhos), pra fechar e abrir o painel sem perder texto; "Escrever todas com IA" só
// escreve nas caixas vazias ou com o começo automático, e pergunta antes de reescrever as que já têm texto; IA desligada
// no servidor (503) ou login vencido param o "Escrever todas" na hora, com a mensagem do servidor no alto do painel.
import {
  esc, store, api, recarregar, toast, icone, abrirPainel, fecharPainel, BTN_FECHAR, precisaAprovacao, etapaAprovacao,
  fmtData, pecaInfo, tiposDaPeca, infoAprovacao,
} from './core.js';
import { diaPostado } from './stories.js';
import { invalidar as invalidarAprovacoes } from './views/aprovacoes.js';

// o mesmo limite do servidor (de 1 a 30 itens por vez) e o da explicação técnica (aprovacoes.mjs, LIM.explicacao)
export const MAX_LOTE = 30;
const MAX_EXPLICACAO = 3000;
const PLACEHOLDER = 'Por que este post: ...&#10;Base técnica:&#10;• ... (F051)&#10;Objetivo: ...';

const tem = (v) => Boolean(String(v ?? '').trim());
// o story do dia tem id sto_...; o resto do cronograma é peça (db.reels)
export const ehStory = (id) => /^sto_/.test(String(id ?? ''));

export function acharItem(id) {
  const E = store.E;
  if (!E || !id) return null;
  const lista = ehStory(id) ? E.stories : E.reels;
  return (Array.isArray(lista) ? lista : []).find((x) => x?.id === id) ?? null;
}
// 22/10 (Pedro): o story sempre no singular, "Story · tema", como no calendário
export const nomeDoItem = (x) => (ehStory(x?.id) ? `Story · ${tem(x?.tema) ? String(x.tema).trim() : 'sem tema'}` : String(x?.ideia ?? 'Peça sem título'));
// o título do post entre aspas, sem dobrar quando a ideia já começa com aspas (as do calendário da semana)
export const entreAspas = (s) => (/^["“]/.test(String(s ?? '')) ? String(s) : `"${s}"`);
export const diaDoItem = (x) => (x?.data ? fmtData(x.data) : 'sem data');
// a peça fala no feminino, o story no masculino ("Mandada", "Mandado")
const oa = (x) => (ehStory(x?.id) ? 'o' : 'a');

// por que o item não pode ir pra aprovação agora (null = pode). As mesmas regras do enviar do servidor, mais o que a tela
// já sabe: o que está esperando, o aprovado (só volta quando muda) e o postado não vão
export function bloqueio(x) {
  if (!x) return 'Não existe mais';
  const story = ehStory(x.id);
  if (story ? diaPostado(x) : x.status === 'publicado') return `Já postad${oa(x)}`;
  if (!story && !precisaAprovacao(x)) return 'Story antigo do feed: vai pelo story do dia';
  const estado = x.aprovacao?.estado;
  if (estado === 'pendente') return 'Já está esperando aprovação';
  if (estado === 'aprovado') return `Já aprovad${oa(x)}`;
  if (story && !tem(x.tema)) return 'Sem tema: escreva o tema do story antes';
  return null;
}

// o que pode ir junto do item no mesmo dia: da peça, o story do dia; do story, os posts do feed do dia (na ordem do dia)
export function juntosDoDia(x) {
  if (!x?.data || !store.E) return [];
  const lista = ehStory(x.id)
    ? (store.E.reels ?? []).filter((r) => r?.data === x.data).sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99))
    : (store.E.stories ?? []).filter((s) => s?.data === x.data);
  return lista.filter((y) => y.id !== x.id && !bloqueio(y));
}
// "Mandar junto o Story · tema (22/10)" ou "Mandar junto o post "ideia" (22/10)"
export const rotuloJunto = (x) => (ehStory(x?.id)
  ? `Mandar junto o ${nomeDoItem(x)} (${diaDoItem(x)})`
  : `Mandar junto o post ${entreAspas(nomeDoItem(x))} (${diaDoItem(x)})`);

// ── Rascunhos da explicação ────────────────────────────────────────────────
// o que foi escrito e ainda não foi mandado, por item; some quando o item vai
const rascunhos = new Map();
export const guardarRascunho = (id, txt) => { if (id) rascunhos.set(id, String(txt ?? '')); };
export const esquecerRascunho = (id) => rascunhos.delete(id);
const comecoAutomatico = (x) => (tem(x?.motivo) ? `Por que este post: ${String(x.motivo).trim()}` : '');
// o rascunho, a explicação da ida anterior (reprovado ou mudou) ou o começo pelo motivo, como no painel de um só
export function explicacaoInicial(x) {
  if (x?.id && rascunhos.has(x.id)) return rascunhos.get(x.id);
  return x?.aprovacao?.explicacao ?? comecoAutomatico(x);
}
export const caixaExplicacao = (atrs, valor) => `<textarea class="campo" ${atrs} rows="6" maxlength="${MAX_EXPLICACAO}" placeholder="${PLACEHOLDER}">${esc(valor)}</textarea>`;

// ── IA ─────────────────────────────────────────────────────────────────────
export async function rascunhoIA(id) {
  const d = await api('POST', `/api/aprovacoes/${encodeURIComponent(id)}/explicacao`, {});
  return String(d?.explicacao ?? '');
}
// IA desligada neste servidor (503) ou login dela vencido: os próximos falhariam igual
export const iaParada = (e) => e?.status === 503 || /login da IA/i.test(String(e?.message ?? ''));
const ESCREVENDO = '<span class="dt-spinner" aria-hidden="true"></span> Escrevendo';
// "Escrever com IA" de um item: o botão gira enquanto escreve e o texto entra na caixa
export async function escreverComIA(botao, campo, id) {
  const antes = botao.innerHTML;
  botao.disabled = true;
  botao.setAttribute('aria-busy', 'true');
  botao.innerHTML = ESCREVENDO;
  try {
    const txt = await rascunhoIA(id);
    if (campo?.isConnected) campo.value = txt;
    guardarRascunho(id, txt);
    return txt;
  } finally {
    if (botao.isConnected) { botao.disabled = false; botao.removeAttribute('aria-busy'); botao.innerHTML = antes; }
  }
}

// ── Mandar ─────────────────────────────────────────────────────────────────
export async function enviarLote(itens) {
  const d = await api('POST', '/api/aprovacoes/lote', { itens });
  invalidarAprovacoes();
  const res = Array.isArray(d?.resultados) ? d.resultados : [];
  for (const x of res) if (x?.ok) esquecerRascunho(x.id);
  return res;
}
// pra onde foi: com os gerentes ou, sem gerente cadastrado, direto com o Diretor contábil
export const destino = (item) => (etapaAprovacao(item?.aprovacao) === 'diretor' ? 'com o Diretor contábil' : 'com os gerentes');
// o resumo depois de mandar ("Os 2 foram pra aprovação juntos: agora estão com os gerentes")
export function resumoLote(res) {
  const ok = res.filter((x) => x?.ok);
  const falhas = res.filter((x) => !x?.ok);
  const total = res.length;
  if (!falhas.length) return total === 1 ? `Foi pra aprovação: agora está ${destino(ok[0]?.item)}` : `Os ${total} foram pra aprovação juntos: agora estão ${destino(ok[0]?.item)}`;
  if (!ok.length) return total === 1 ? 'Não foi pra aprovação' : `Nenhum dos ${total} foi pra aprovação`;
  return `${ok.length} de ${total} foram pra aprovação; ${falhas.length === 1 ? '1 não foi' : `${falhas.length} não foram`}`;
}

// ── Painel "Mandar vários pra aprovação" (seleção do Cronograma) ─────────────
// est: { ids, res: Map(id -> resultado do servidor), iaErros: Map(id -> erro da IA), mesma, textoMesma, iaTodas: { i, total }
// | null, enviando, alerta, aoEnviar(idsQueForam), aoTirar(id) }
let est = null;

// na ordem do calendário: pelo dia; no dia, os posts (na posição deles) e depois o story
function ordenar(ids) {
  const peso = (id) => {
    const x = acharItem(id);
    return [x?.data || '9999', ehStory(id) ? 1 : 0, x?.ordem ?? 99];
  };
  return [...ids].sort((a, b) => {
    const [da, sa, oa1] = peso(a);
    const [db, sb, ob] = peso(b);
    return da.localeCompare(db) || sa - sb || oa1 - ob;
  });
}

export function abrirLote(ids, { aoEnviar, aoTirar } = {}) {
  est = { ids: ordenar(ids), res: new Map(), iaErros: new Map(), mesma: false, textoMesma: '', iaTodas: null, enviando: false, alerta: '', aoEnviar, aoTirar };
  pintar({ foco: true });
}

const painelAberto = () => document.querySelector('#painel:not([hidden]) [data-lote-painel]');
const qPainel = (s) => document.querySelector(`#painel [data-lote-painel] ${s}`);
const campoDe = (id) => qPainel(`[data-lote-exp="${CSS.escape(id)}"]`);
const foi = (id) => est?.res.get(id)?.ok === true;
// o que não foi e agora não pode mais ir (outra pessoa mandou, foi postado, sumiu): sai do "Enviar de novo"
const barrado = (id) => (foi(id) ? null : bloqueio(acharItem(id)));
const faltam = () => (est ? est.ids.filter((id) => !foi(id) && !barrado(id)) : []);
const tipoNome = (x) => (ehStory(x?.id) ? { icone: 'stories', nome: 'Story' } : pecaInfo(tiposDaPeca(x)[0]) ?? pecaInfo('reel'));

function itemHtml(id) {
  const x = acharItem(id);
  const r = est.res.get(id);
  const ok = r?.ok === true;
  const t = tipoNome(x);
  // reprovado ou mudou depois de aprovado: a pílula lembra por que vai de novo
  const info = x && !ok ? infoAprovacao(x) : null;
  const nome = x ? nomeDoItem(x) : 'Item que não existe mais';
  const motivo = barrado(id);
  const linha = (sim, txt) => `<p class="lote-item-res" data-ok="${sim ? 'sim' : 'nao'}">${icone(sim ? 'check' : 'alerta', 15)}<span>${esc(txt)}</span></p>`;
  const resultado = [
    r ? linha(ok, ok ? `Mandad${oa(x ?? { id })}: agora está ${destino(r.item)}` : `Não foi: ${r.erro || 'o servidor recusou.'}`) : '',
    // sem o resultado dizendo o mesmo: o motivo de agora
    motivo && (!r || r.ok) ? linha(false, `Não vai: ${motivo}`) : '',
  ].join('');
  // 22/10 (achado): o aviso de quando a IA não escreveu fica no desenho do item (antes sumia no primeiro redesenho)
  const erroIA = !ok && est.iaErros.has(id) ? linha(false, `A IA não escreveu esta: ${est.iaErros.get(id)}`) : '';
  const travado = ok || est.enviando || !x;
  return `
    <li class="lote-item" data-lote-item="${esc(id)}" data-estado="${ok ? 'ok' : r ? 'erro' : ''}">
      <div class="lote-item-topo">
        <span class="pill pill-peca">${icone(t.icone, 13)}${esc(t.nome)}</span>
        <span class="pill">${icone('calendario', 13)}${esc(diaDoItem(x))}</span>
        ${info ? `<span class="pill dt-apv-pill" data-estado="${esc(info.estado)}" title="${esc(info.dica)}">${icone(info.icone, 13)}${esc(info.curto ?? info.nome)}</span>` : ''}
        ${ok ? '' : `<button type="button" class="btn-icone btn-sm lote-tirar" data-lote-tirar="${esc(id)}" aria-label="${esc(`Tirar ${nome} da lista`)}" title="Tirar da lista"${est.enviando ? ' disabled' : ''}>${icone('fechar', 14)}</button>`}
      </div>
      <strong class="lote-item-titulo" id="lote-tit-${esc(id)}">${esc(nome)}</strong>
      ${resultado}
      ${ok || motivo || est.mesma ? '' : `
      <label class="rotulo"><span>Explicação técnica <small>${ehStory(id) ? 'por que este story existe, a base contábil dele' : 'por que este post existe, a base contábil dele'} e o objetivo</small></span>
        ${caixaExplicacao(`data-lote-exp="${esc(id)}" aria-describedby="lote-tit-${esc(id)}"${travado ? ' disabled' : ''}`, x ? explicacaoInicial(x) : '')}
      </label>
      <div class="lote-item-acoes"><button type="button" class="btn btn-sm" data-lote-ia="${esc(id)}"${travado || est.iaTodas ? ' disabled' : ''}>${icone('raio', 14)} Escrever com IA</button></div>
      <div data-lote-ia-erro="${esc(id)}">${erroIA}</div>`}
    </li>`;
}

function pintar({ foco = false } = {}) {
  if (!est) return;
  const pend = faltam();
  const n = pend.length;
  const enviados = est.ids.filter(foi).length;
  const ia = est.iaTodas;
  const rodape = n
    ? `<button type="button" class="btn btn-primario" data-lote-enviar${est.enviando || ia ? ' disabled' : ''}>${est.enviando ? '<span class="dt-spinner" aria-hidden="true"></span> Mandando' : `${icone('escudo', 16)} ${enviados ? `Enviar de novo ${n === 1 ? 'o que não foi' : `os ${n} que não foram`}` : `Enviar ${n} para aprovação`}`}</button>
       <button type="button" class="btn" data-lote-voltar${est.enviando ? ' disabled' : ''}>${enviados ? 'Fechar' : 'Voltar pra seleção'}</button>`
    : '<button type="button" class="btn btn-primario" data-lote-fechar>Fechar</button>';
  const corpo = `
    <div class="lote-ferramentas"${n ? '' : ' hidden'}>
      <label class="lote-mesma"><input type="checkbox" data-lote-mesma ${est.mesma ? 'checked' : ''}${est.enviando || ia ? ' disabled' : ''} /><span>Usar a mesma explicação em todos</span></label>
      <button type="button" class="btn btn-sm" data-lote-ia-todas${est.mesma || est.enviando || ia ? ' disabled' : ''}${est.mesma ? ' title="Desligue a mesma explicação pra escrever com IA"' : ''}>${ia ? `<span class="dt-spinner" aria-hidden="true"></span> Escrevendo ${ia.i} de ${ia.total}` : `${icone('raio', 14)} Escrever todas com IA`}</button>
    </div>
    <p class="lote-status" role="status" aria-live="polite">${ia ? esc(`Escrevendo com a IA: ${ia.i} de ${ia.total}`) : ''}</p>
    <div data-lote-alerta>${est.alerta ? `<p class="lote-alerta" role="alert">${icone('alerta', 15)}<span>${esc(est.alerta)}</span></p>` : ''}</div>
    ${est.mesma && n ? `
    <label class="rotulo lote-mesma-caixa"><span>Explicação técnica pra todos <small>vai igual em cada um dos ${n}</small></span>
      ${caixaExplicacao(`data-lote-exp-todos${est.enviando ? ' disabled' : ''}`, est.textoMesma)}
    </label>` : ''}
    <ol class="lote-itens">${est.ids.map(itemHtml).join('')}</ol>`;
  const rolagem = painelAberto() ? document.querySelector('#painel .painel-corpo')?.scrollTop ?? 0 : 0;
  const p = abrirPainel(`
    <div class="painel-topo">
      <div class="dt-cabeca">
        <div class="dt-pills"><span class="pill pill-peca">${icone('escudo', 13)}Aprovação técnica</span><span class="pill">${est.ids.length} ${est.ids.length === 1 ? 'item' : 'itens'}</span></div>
        <h2>Mandar vários pra aprovação</h2>
      </div>
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo" data-lote-painel>${corpo}</div>
    <div class="painel-rodape dt-rodape">${rodape}</div>`, { largo: true });
  if (!p) return;
  if (rolagem) p.querySelector('.painel-corpo').scrollTop = rolagem;
  ligar(p);
  if (foco) p.querySelector('[data-lote-exp], [data-lote-exp-todos]')?.focus({ preventScroll: true });
}

function ligar(p) {
  const q = (s) => p.querySelector(s);
  p.querySelectorAll('[data-lote-exp]').forEach((c) => (c.oninput = () => {
    guardarRascunho(c.dataset.loteExp, c.value);
    limparErroIA(c.dataset.loteExp);
  }));
  const todos = q('[data-lote-exp-todos]');
  if (todos) todos.oninput = () => { est.textoMesma = todos.value; };
  const mesma = q('[data-lote-mesma]');
  if (mesma) mesma.onchange = () => {
    est.mesma = mesma.checked;
    // ligando: a caixa única começa com a primeira explicação escrita
    if (est.mesma && !tem(est.textoMesma)) {
      const primeira = faltam().map((id) => campoDe(id)?.value ?? '').find(tem);
      est.textoMesma = primeira ?? '';
    }
    pintar();
    (est.mesma ? qPainel('[data-lote-exp-todos]') : qPainel('[data-lote-mesma]'))?.focus({ preventScroll: true });
  };
  p.querySelectorAll('[data-lote-ia]').forEach((b) => (b.onclick = async () => {
    const id = b.dataset.loteIa;
    try {
      await escreverComIA(b, campoDe(id), id);
      limparErroIA(id);
      toast('Rascunho pronto: confira antes de enviar');
    } catch (e) {
      if (iaParada(e)) mostrarAlerta(e.message); else toast(e.message);
    }
  }));
  const iaTodas = q('[data-lote-ia-todas]');
  if (iaTodas) iaTodas.onclick = () => escreverTodas();
  p.querySelectorAll('[data-lote-tirar]').forEach((b) => (b.onclick = () => tirar(b.dataset.loteTirar)));
  const enviar = q('[data-lote-enviar]');
  if (enviar) enviar.onclick = () => mandar();
  const voltar = q('[data-lote-voltar]');
  if (voltar) voltar.onclick = () => fecharPainel();
  const fechar = q('[data-lote-fechar]');
  if (fechar) fechar.onclick = () => fecharPainel();
}

function tirar(id) {
  if (!est || est.enviando) return;
  est.ids = est.ids.filter((x) => x !== id);
  est.res.delete(id);
  est.aoTirar?.(id);
  if (!est.ids.length) { fecharPainel(); toast('A lista ficou vazia'); return; }
  pintar();
  qPainel('[data-lote-exp], [data-lote-exp-todos]')?.focus({ preventScroll: true });
}

// "Escrever todas com IA": um por vez, com o progresso no botão e no aviso lido pelo leitor de tela. Escreve nas caixas
// vazias ou só com o começo automático; se todas já têm texto, pergunta antes de reescrever. O painel não redesenha no
// meio (quem está digitando em outra caixa não perde o foco): o texto de cada um entra direto na caixa dele
async function escreverTodas() {
  if (!est || est.iaTodas || est.enviando) return;
  const pend = faltam().filter((id) => acharItem(id));
  const intocada = (id) => {
    const v = (campoDe(id)?.value ?? '').trim();
    return !v || v === comecoAutomatico(acharItem(id));
  };
  let alvos = pend.filter(intocada);
  if (!alvos.length) {
    if (!pend.length || !confirm('Todas já têm explicação. Reescrever todas com a IA?')) return;
    alvos = pend;
  }
  const meu = est;
  meu.iaErros.clear();
  mostrarAlerta('');
  const travar = (sim) => {
    for (const s of ['[data-lote-enviar]', '[data-lote-mesma]', '[data-lote-ia]', '[data-lote-tirar]']) document.querySelectorAll(`#painel ${s}`).forEach((b) => { b.disabled = sim; });
  };
  const botao = qPainel('[data-lote-ia-todas]');
  const antes = botao?.innerHTML ?? '';
  const status = qPainel('.lote-status');
  botao?.setAttribute('aria-busy', 'true');
  if (botao) botao.disabled = true;
  travar(true);
  let feitos = 0;
  let pulados = 0;
  // 22/10 (achado): o texto de cada caixa no começo da fila. Quem digitar numa caixa enquanto a IA escreve as outras
  // não perde o que escreveu: na vez dela, a caixa mexida é pulada
  const noComeco = new Map(alvos.map((id) => [id, campoDe(id)?.value ?? '']));
  const mexida = (id) => (campoDe(id)?.value ?? '') !== noComeco.get(id);
  for (const [i, id] of alvos.entries()) {
    // o painel fechou ou outra lista abriu: para
    if (est !== meu || !painelAberto()) break;
    if (mexida(id)) { pulados += 1; continue; }
    const nome = nomeDoItem(acharItem(id));
    meu.iaTodas = { i: i + 1, total: alvos.length };
    if (botao?.isConnected) botao.innerHTML = `<span class="dt-spinner" aria-hidden="true"></span> Escrevendo ${i + 1} de ${alvos.length}`;
    if (status?.isConnected) status.textContent = `Escrevendo com a IA: ${i + 1} de ${alvos.length} (${nome})`;
    const item = qPainel(`[data-lote-item="${CSS.escape(id)}"]`);
    item?.classList.add('lote-item-escrevendo');
    try {
      const txt = await rascunhoIA(id);
      // digitou nesta caixa enquanto a IA escrevia: fica o texto da pessoa
      if (mexida(id)) { pulados += 1; continue; }
      guardarRascunho(id, txt);
      const campo = campoDe(id);
      if (campo) campo.value = txt;
      noComeco.set(id, txt);
      feitos += 1;
    } catch (e) {
      if (iaParada(e)) { if (est === meu) mostrarAlerta(e.message); break; }
      meu.iaErros.set(id, e.message);
    } finally {
      item?.classList.remove('lote-item-escrevendo');
    }
  }
  meu.iaTodas = null;
  if (est !== meu || !painelAberto()) return;
  // o painel redesenhou no meio (não devia, mas por garantia): desenha de novo, já com os textos guardados
  if (!botao?.isConnected) pintar();
  else { botao.innerHTML = antes; botao.disabled = false; botao.removeAttribute('aria-busy'); }
  travar(false);
  if (status?.isConnected) {
    status.textContent = feitos || pulados
      ? `${feitos} de ${alvos.length} explicações escritas pela IA${pulados ? `, ${pulados} você já tinha escrito` : ''}. Confira antes de enviar.`
      : '';
  }
  // quem não teve o texto escrito ganha o motivo embaixo da caixa (o mesmo desenho do itemHtml)
  for (const [id, msg] of meu.iaErros) {
    const lugar = qPainel(`[data-lote-ia-erro="${CSS.escape(id)}"]`);
    if (lugar) lugar.innerHTML = `<p class="lote-item-res" data-ok="nao">${icone('alerta', 15)}<span>${esc(`A IA não escreveu esta: ${msg}`)}</span></p>`;
  }
  if (feitos) toast(feitos === alvos.length ? 'Rascunhos prontos: confira cada um antes de enviar' : `${feitos} de ${alvos.length} rascunhos prontos: confira antes de enviar`);
}

// o aviso de "a IA não escreveu" de um item sai quando a pessoa escreve na caixa ou a IA escreve nela
function limparErroIA(id) {
  if (!est?.iaErros.delete(id)) return;
  const lugar = qPainel(`[data-lote-ia-erro="${CSS.escape(id)}"]`);
  if (lugar) lugar.innerHTML = '';
}

// o aviso do alto do painel (IA desligada, erro ao mandar), sem redesenhar o resto
function mostrarAlerta(msg) {
  if (est) est.alerta = msg;
  const caixa = qPainel('[data-lote-alerta]');
  if (caixa) caixa.innerHTML = msg ? `<p class="lote-alerta" role="alert">${icone('alerta', 15)}<span>${esc(msg)}</span></p>` : '';
}

async function mandar() {
  if (!est || est.enviando || est.iaTodas) return;
  const pend = faltam();
  const itens = [];
  for (const id of pend) {
    const x = acharItem(id);
    if (!x) continue;
    const txt = (est.mesma ? est.textoMesma : campoDe(id)?.value ?? explicacaoInicial(x)).trim();
    if (!txt) {
      toast(est.mesma ? 'Escreva a explicação técnica pra todos.' : `Escreva a explicação de ${nomeDoItem(x)} (ou use "Escrever com IA").`);
      (est.mesma ? qPainel('[data-lote-exp-todos]') : campoDe(id))?.focus();
      return;
    }
    itens.push({ id, explicacao: txt });
  }
  if (!itens.length) { toast('Nada pra mandar: os itens da lista não existem mais.'); return; }
  const meu = est;
  est.enviando = true;
  est.alerta = '';
  // o erro do item da tentativa anterior (e o da IA) sai: o resultado de agora entra no lugar
  for (const { id } of itens) est.res.delete(id);
  est.iaErros.clear();
  pintar();
  let res = null;
  try {
    res = await enviarLote(itens);
  } catch (e) {
    meu.enviando = false;
    meu.alerta = e.message;
    if (est === meu && painelAberto()) pintar();
    toast(e.message);
    return;
  }
  meu.enviando = false;
  for (const x of res) if (x?.id) meu.res.set(x.id, x);
  // item que o servidor não citou na resposta: conta como não foi
  for (const { id } of itens) if (!meu.res.has(id)) meu.res.set(id, { id, ok: false, erro: 'O servidor não respondeu sobre este item. Tente de novo.' });
  const foram = itens.map((x) => x.id).filter((id) => meu.res.get(id)?.ok);
  const resumo = resumoLote(itens.map(({ id }) => meu.res.get(id)));
  toast(resumo);
  // o estado de agora (o que não foi pode ter ficado barrado: já esperando, postado), antes de redesenhar. 22/10
  // (achado): o calendário só é avisado depois, pra tirar da seleção também o que ficou barrado
  await recarregar().catch(() => {});
  meu.aoEnviar?.(foram);
  if (est === meu && painelAberto()) {
    pintar();
    // o foco vai pro primeiro que não foi (pra corrigir) ou pro Fechar
    (qPainel('.lote-item[data-estado="erro"] textarea') ?? document.querySelector('#painel [data-lote-fechar], #painel [data-lote-enviar]'))?.focus({ preventScroll: false });
  }
}
