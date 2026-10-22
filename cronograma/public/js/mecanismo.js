// 21/10 (Pedro): o mecanismo de anti-repetição e continuidade da estratégia, do lado da tela. A análise de cada semana
// (segunda a domingo) vem de GET /api/mecanismo?semana=AAAA-MM-DD e fica guardada aqui por semana, junto com o estado
// (store.E) que ela olhou: mudou o estado (qualquer recarga), a próxima leitura busca de novo e, enquanto isso, a tela
// usa a de antes (nada pisca). Quem usa:
//   cronograma.js: o ícone pequeno de alerta no chip da peça (e dos stories) que o mecanismo acusa;
//   detalhe.js e stories.js: o bloco "Mecanismo" do painel, com os alertas, a exceção ("repetição de propósito"),
//     "Regerar ideia" (POST /api/semana/regerar, com o "O que mudar" opcional) e "Voltar à versão anterior";
//   sugestoes.js: o resumo da semana (volume, mix dos blocos, oferta, continuidade).
// Sem a rota no servidor (versão antiga) ou sem a análise, nada aparece no chip e o bloco diz que não carregou.
import { esc, store, api, recarregar, toast, icone } from './core.js';
// import * : se a vista das aprovações mudar de nome a função, só o aviso de contador deixa de atualizar
import * as vistaAprovacoes from './views/aprovacoes.js';

const invalidarAprovacoes = () => { try { vistaAprovacoes.invalidar?.(); } catch { /* sem a lista aberta, nada a fazer */ } };

// ── Datas da semana (AAAA-MM-DD, sem fuso: meio-dia UTC não vira o dia) ──────
const comoData = (iso) => new Date(`${iso}T12:00:00Z`);
const comoIso = (d) => d.toISOString().slice(0, 10);
const ehIso = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ''));
export function segundaDe(iso) {
  if (!ehIso(iso)) return '';
  const d = comoData(iso);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return comoIso(d);
}
export function somarDias(iso, n) {
  const d = comoData(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return comoIso(d);
}
export const ddmm = (iso) => (ehIso(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '');
export const rotuloSemana = (seg) => (ehIso(seg) ? `${ddmm(seg)} a ${ddmm(somarDias(seg, 6))}` : '');
const DIA_CURTO = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const diaDaSemana = (iso) => DIA_CURTO[comoData(iso).getUTCDay()];

// ── Análise por semana ─────────────────────────────────────────────────────
// semana -> { E, dados, erro, prom }
const cache = new Map();
export const analiseDaSemana = (seg) => cache.get(seg)?.dados ?? null;
export const erroDaSemana = (seg) => cache.get(seg)?.erro ?? null;
export function invalidarMecanismo() { for (const c of cache.values()) c.E = null; }

export function carregarSemana(seg, { forcar = false } = {}) {
  if (!ehIso(seg)) return Promise.resolve(null);
  const c = cache.get(seg);
  if (c?.prom) return c.prom;
  if (c && !forcar && c.E === store.E && (c.dados || c.erro)) return Promise.resolve(c);
  const E = store.E;
  const prom = api('GET', `/api/mecanismo?semana=${encodeURIComponent(seg)}`).then(
    (dados) => { const n = { E, dados, erro: null, prom: null }; cache.set(seg, n); return n; },
    (erro) => { const n = { E, dados: c?.dados ?? null, erro, prom: null }; cache.set(seg, n); return n; },
  );
  cache.set(seg, { E: c?.E ?? null, dados: c?.dados ?? null, erro: c?.erro ?? null, prom });
  return prom;
}
export const carregarSemanas = (segs) => Promise.all([...new Set(segs)].filter(ehIso).map((s) => carregarSemana(s)));

// os itens que a análise da semana tem pra uma peça ou um dia de stories
export function itensDe(id, data) {
  const seg = segundaDe(data);
  const lista = analiseDaSemana(seg)?.pecas?.[id];
  return Array.isArray(lista) ? lista : null;
}
const alertasDe = (id, data) => (itensDe(id, data) ?? []).filter((x) => x?.nivel === 'alerta');

// a peça parecida pode vir como id ou como { id, ideia|tema|titulo, data }
function parecida(x) {
  const p = x?.parecidaCom;
  if (!p) return null;
  const id = typeof p === 'string' ? p : p.id ?? null;
  const E = store.E;
  const r = id ? (E?.reels ?? []).find((y) => y.id === id) ?? null : null;
  const s = !r && id ? (E?.stories ?? []).find((y) => y.id === id) ?? null : null;
  const titulo = (typeof p === 'object' ? p.ideia ?? p.titulo ?? p.tema : '') || r?.ideia || (s ? `Story · ${s.tema ?? ''}` : '');
  const data = (typeof p === 'object' ? p.data : '') || r?.data || s?.data || '';
  return { id, titulo: String(titulo ?? '').trim(), data, tipo: r ? 'peca' : s ? 'stories' : (typeof p === 'object' && p.tipo) || '' };
}
// "Mesmo pilar e ideia parecida com ..." + a peça, sem repetir o título quando o texto já fala dele
function textoItem(x) {
  const t = String(x?.texto ?? '').trim();
  const p = parecida(x);
  // o texto do servidor já cita a peça (com o título cortado em 90 letras): só completa quando não cita
  if (!p?.titulo || t.includes(p.titulo.slice(0, 40))) return t;
  return `${t} ("${p.titulo}"${p.data ? `, ${ddmm(p.data)}` : ''})`;
}

// ── Chip do calendário ──────────────────────────────────────────────────────
// o ícone pequeno de alerta (com a dica) quando o mecanismo acusa a peça; vazio quando não acusa
export function marcaMecanismo(id, data) {
  const al = alertasDe(id, data);
  if (!al.length) return '';
  const dica = al.map(textoItem).filter(Boolean).join(' · ');
  return `<span class="crono-chip-mec" title="${esc(dica)}">${icone('alerta', 12)}<span class="sr-only">Mecanismo: ${esc(dica)}</span></span>`;
}
// depois que a análise chega: acerta o ícone de cada chip do calendário sem redesenhar a vista
export function pintarCalendario(root) {
  for (const chip of root.querySelectorAll('.crono-chip[data-detalhar], .crono-chip[data-stories]')) {
    const id = chip.dataset.detalhar || chip.dataset.stories;
    const data = chip.closest('[data-dia]')?.dataset.dia ?? '';
    // 21/10 (Pedro): peça e stories já postados não levam o alerta, igual ao desenho do calendário (cronograma.js e
    // stories.js): aqui o ícone que estiver nele sai e o nome lido volta ao data-rotulo
    const novo = chip.dataset.st === 'publicado' ? '' : marcaMecanismo(id, data);
    const velho = chip.querySelector('.crono-chip-mec');
    if (velho && velho.outerHTML === novo) continue;
    velho?.remove();
    if (novo) chip.querySelector('.crono-chip-peca')?.insertAdjacentHTML('beforeend', novo);
    // o chip dos stories tem aria-label: o alerta entra nele
    if (chip.dataset.rotulo) {
      const dica = novo ? alertasDe(id, data).map(textoItem).join(' · ') : '';
      chip.setAttribute('aria-label', dica ? `${chip.dataset.rotulo}. Mecanismo: ${dica}` : chip.dataset.rotulo);
    }
  }
}

// ── Bloco "Mecanismo" do painel (peça e stories do dia) ─────────────────────
const NIVEL = {
  alerta: { icone: 'alerta', nome: 'Alerta' },
  info: { icone: 'info', nome: 'Info' },
  ok: { icone: 'check', nome: 'Ok' },
};
const ROTULO_MECANICA = { caixinha: 'Caixinha de perguntas', 'resposta-caixinha': 'Resposta da caixinha' };
const tem = (v) => Boolean(String(v ?? '').trim());
const LIM_MOTIVO = 500;
const LIM_INSTRUCAO = 500;

function itensHtml(item, tipo) {
  const seg = segundaDe(item.data);
  const lista = itensDe(item.id, item.data);
  const erro = erroDaSemana(seg);
  if (!lista) {
    if (erro && !analiseDaSemana(seg)) return `<p class="mec-vazio">${icone('info', 14)}Não deu pra ler o mecanismo desta semana: ${esc(erro.message)}</p>`;
    if (!analiseDaSemana(seg)) return `<div class="mec-esq" aria-hidden="true"><span class="fx-esq"></span><span class="fx-esq"></span></div><span class="sr-only" role="status">Lendo o mecanismo</span>`;
    return `<p class="mec-vazio mec-vazio-ok">${icone('check', 14)}Nada repetido: nem nas últimas 8 semanas, nem nesta.</p>`;
  }
  const ordem = { alerta: 0, info: 1, ok: 2 };
  // a exceção ligada tem a caixa dela logo abaixo (com o motivo e o que repete): não sai duas vezes
  const itens = lista.filter((x) => !(x?.regra === 'excecao' && item.excecaoAntiRepeticao?.ativa)).sort((a, b) => (ordem[a?.nivel] ?? 3) - (ordem[b?.nivel] ?? 3));
  if (!itens.length) return item.excecaoAntiRepeticao?.ativa ? '' : `<p class="mec-vazio mec-vazio-ok">${icone('check', 14)}Nada repetido: nem nas últimas 8 semanas, nem nesta.</p>`;
  return `<ul class="mec-lista">${itens.map((x) => {
    const n = NIVEL[x?.nivel] ?? NIVEL.info;
    const p = parecida(x);
    const abre = p?.id && (p.tipo === 'peca' || p.tipo === 'stories') && p.id !== item.id;
    return `
      <li class="mec-item" data-nivel="${esc(x?.nivel ?? 'info')}">
        <span class="mec-ico" aria-hidden="true">${icone(n.icone, 14)}</span>
        <div class="mec-item-corpo">
          <p><span class="sr-only">${esc(n.nome)}: </span>${esc(String(x?.texto ?? '').trim())}</p>
          ${p?.titulo ? (abre
            ? `<button type="button" class="mec-parecida" data-mec-abrir="${esc(p.id)}" data-mec-abrir-tipo="${esc(p.tipo)}">${icone(p.tipo === 'stories' ? 'stories' : 'seta', 13)}<span>Abrir ${p.tipo === 'stories' ? 'os stories' : 'a peça'}${p.data ? ` de ${esc(ddmm(p.data))}` : ''}</span></button>`
            : String(x?.texto ?? '').includes(p.titulo.slice(0, 40)) ? '' : `<p class="mec-parecida-texto">Parecida com <b>${esc(p.titulo)}</b>${p.data ? ` · ${esc(ddmm(p.data))}` : ''}</p>`) : ''}
        </div>
      </li>`;
  }).join('')}</ul>`;
}

// a exceção da peça: ligada, mostra o motivo; desligada e com alerta de repetição, oferece marcar
function excecaoHtml(item) {
  const ex = item.excecaoAntiRepeticao;
  if (ex?.ativa) {
    // o que a exceção cobre: o item 'excecao' da análise traz as repetições que viraram informação
    const doServidor = (itensDe(item.id, item.data) ?? []).find((x) => x?.regra === 'excecao');
    // sem o conselho do fim ("...registre a repetição de propósito"): a exceção já está registrada
    const repete = Array.isArray(doServidor?.repete) ? doServidor.repete.map((t) => String(t).replace(/\s*[^.]*registre a repetição de propósito\.?/i, '').trim()).filter(tem) : [];
    return `
      <div class="mec-excecao" data-ativa="true">
        <span class="mec-ico" aria-hidden="true">${icone('alfinete', 14)}</span>
        <div class="mec-item-corpo">
          <p><b>Repetição de propósito.</b> ${tem(ex.motivo) ? esc(ex.motivo) : 'Sem motivo escrito.'}</p>
          ${repete.length ? `<ul class="mec-repete">${repete.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
          <button type="button" class="crono-link" data-mec-excecao-tirar>Tirar a exceção</button>
        </div>
      </div>`;
  }
  if (!alertasDe(item.id, item.data).length) return '';
  return `
    <div class="mec-excecao-abrir">
      <button type="button" class="crono-link" data-mec-excecao-abrir aria-expanded="false" aria-controls="mec-excecao-form">A repetição é de propósito?</button>
    </div>
    <form class="mec-form" id="mec-excecao-form" hidden>
      <label class="rotulo">Por que repetir<textarea class="campo" name="motivo" rows="2" maxlength="${LIM_MOTIVO}" required placeholder="ex.: série de 3 posts sobre o mesmo mito, com ângulos diferentes"></textarea></label>
      <p class="mec-form-nota">O alerta vira informação ("Repetição de propósito") e o gerador da semana respeita.</p>
      <div class="mec-form-acoes"><button class="btn btn-primario btn-sm" type="submit">Salvar a exceção</button><button class="btn btn-sm btn-fantasma" type="button" data-mec-excecao-cancelar>Cancelar</button></div>
    </form>`;
}

function metaHtml(item) {
  const partes = [
    item.mecanica && ['Mecânica', ROTULO_MECANICA[item.mecanica] ?? item.mecanica],
    tem(item.angulo) && ['Ângulo', item.angulo],
    tem(item.gatilhoEmocional) && ['Gatilho emocional', item.gatilhoEmocional],
    tem(item.gatilhoPsicologico) && ['Gatilho psicológico', item.gatilhoPsicologico],
  ].filter(Boolean);
  if (!partes.length) return '';
  return `<dl class="mec-meta">${partes.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
}

function corpoHtml(item, tipo) {
  return `${itensHtml(item, tipo)}${excecaoHtml(item)}`;
}

// item: a peça (tipo 'peca') ou o dia de stories (tipo 'stories'). postado: sem regerar
export function blocoMecanismoHtml(item, { tipo = 'peca', postado = false } = {}) {
  if (!item) return '';
  const seg = segundaDe(item.data);
  const versoes = Array.isArray(item.versoesAnteriores) ? item.versoesAnteriores.length : 0;
  const nome = tipo === 'stories' ? 'stories' : 'ideia';
  const gerada = item.origem === 'gerador-semana';
  return `
    <section class="bloco mec" id="mec-bloco" data-mec-tipo="${tipo}" data-mec-id="${esc(item.id)}" aria-labelledby="mec-titulo">
      <div class="bloco-titulo" id="mec-titulo">Mecanismo${seg ? `<span class="dt-contador">Semana de ${esc(rotuloSemana(seg))}</span>` : ''}</div>
      ${gerada ? `<p class="mec-origem">${icone('gerar', 13)}Veio do gerador da semana</p>` : ''}
      <div class="mec-corpo" id="mec-corpo" aria-live="polite">${seg ? corpoHtml(item, tipo) : `<p class="mec-vazio">${icone('info', 14)}Sem dia marcado: o mecanismo olha a semana da peça.</p>`}</div>
      ${metaHtml(item)}
      ${postado ? '' : `
      <div class="mec-acoes">
        <button type="button" class="btn btn-sm" data-mec-regerar aria-expanded="false" aria-controls="mec-regerar-form">${icone('gerar', 15)}Regerar ${tipo === 'stories' ? 'stories' : 'ideia'}</button>
        ${versoes ? `<button type="button" class="btn btn-sm btn-fantasma" data-mec-voltar>${icone('chevron-esq', 15)}Voltar à versão anterior<span class="mec-n">${versoes}</span></button>` : ''}
      </div>
      <form class="mec-form" id="mec-regerar-form" hidden>
        <label class="rotulo"><span>O que mudar <small>opcional</small></span><textarea class="campo" name="instrucao" rows="2" maxlength="${LIM_INSTRUCAO}" placeholder="${tipo === 'stories' ? 'ex.: mais leve, com enquete, falando do post do dia' : 'ex.: outro ângulo, mais curto, sem preço'}"></textarea></label>
        <p class="mec-form-nota">A IA escreve ${tipo === 'stories' ? 'outros stories pro mesmo dia' : 'outra ideia pro mesmo dia'}, seguindo a estratégia e o mecanismo. A versão de agora fica guardada pra voltar.</p>
        <div class="mec-form-acoes"><button class="btn btn-primario btn-sm" type="submit" data-mec-regerar-ir>Regerar ${nome}</button><button class="btn btn-sm btn-fantasma" type="button" data-mec-regerar-cancelar>Cancelar</button></div>
      </form>`}
    </section>`;
}

const ESTADO_APV = { pendente: 'em aprovação', aprovado: 'aprovada' };

// liga o bloco: busca a análise da semana (se a guardada é de outro estado), a exceção, regerar e voltar.
// reabrir(id): redesenha o painel depois de mudar; abrirPeca/abrirStoriesDia: pra "Parecida com"
export function ligarBlocoMecanismo(p, item, { tipo = 'peca', reabrir, abrirPeca, abrirStoriesDia } = {}) {
  const sec = p.querySelector('#mec-bloco');
  if (!sec || !item) return;
  const q = (s) => sec.querySelector(s);
  const seg = segundaDe(item.data);
  const caminho = tipo === 'stories' ? `/api/stories/${encodeURIComponent(item.id)}` : `/api/reels/${encodeURIComponent(item.id)}`;

  // 21/10 (Pedro): o regerar espera a IA até o fim (1 a 2 minutos). Se nesse tempo a pessoa fechou o painel, abriu outra
  // peça ou entrou no Editar (o modo Editar não tem o bloco), o painel não volta sozinho por cima nem apaga o que ela
  // está escrevendo: só o estado recarrega e o aviso diz de qual peça era. Vale também pra exceção e pro voltar.
  // Ainda é desta peça: o bloco ligado aqui segue na tela, ou o painel aberto mostra esta mesma peça fora do Editar
  const aindaNela = () => {
    if (sec.isConnected) return true;
    const atual = document.querySelector('#painel:not([hidden]) #mec-bloco');
    return Boolean(atual && atual.dataset.mecId === item.id && atual.dataset.mecTipo === tipo);
  };
  // redesenha o painel só se ele ainda é desta peça; devolve o complemento do aviso quando não é
  const voltarAoPainel = () => {
    if (aindaNela()) { reabrir?.(item.id); return ''; }
    const dia = ddmm(item.data);
    return dia ? ` (${tipo === 'stories' ? 'stories' : 'peça'} de ${dia})` : '';
  };

  const ligarCorpo = () => {
    sec.querySelectorAll('[data-mec-abrir]').forEach((b) => (b.onclick = () => {
      if (b.dataset.mecAbrirTipo === 'stories') abrirStoriesDia?.(b.dataset.mecAbrir);
      else abrirPeca?.(b.dataset.mecAbrir);
    }));
    const abrirEx = q('[data-mec-excecao-abrir]');
    const formEx = q('#mec-excecao-form');
    if (abrirEx && formEx) {
      abrirEx.onclick = () => {
        const abrir = formEx.hidden;
        formEx.hidden = !abrir;
        abrirEx.setAttribute('aria-expanded', String(abrir));
        if (abrir) formEx.querySelector('textarea')?.focus();
      };
      q('[data-mec-excecao-cancelar]').onclick = () => { formEx.hidden = true; abrirEx.setAttribute('aria-expanded', 'false'); abrirEx.focus(); };
      formEx.onsubmit = async (e) => {
        e.preventDefault();
        const motivo = formEx.motivo.value.trim();
        if (!motivo) { toast('Escreva por que a repetição é de propósito.'); formEx.motivo.focus(); return; }
        await gravarExcecao({ ativa: true, motivo }, formEx.querySelector('[type="submit"]'));
      };
    }
    const tirar = q('[data-mec-excecao-tirar]');
    if (tirar) tirar.onclick = () => gravarExcecao(null, tirar);
  };

  async function gravarExcecao(valor, botao) {
    if (botao) botao.disabled = true;
    try {
      await api('PUT', caminho, { excecaoAntiRepeticao: valor });
      invalidarMecanismo();
      await recarregar();
      const onde = voltarAoPainel();
      toast(valor ? `Exceção salva${onde}: repetição de propósito` : `Exceção tirada${onde}`);
    } catch (e) {
      if (botao?.isConnected) botao.disabled = false;
      toast(e.message);
    }
  }

  ligarCorpo();
  if (seg) {
    const c = cache.get(seg);
    const precisa = !c || c.E !== store.E || (!c.dados && !c.erro);
    if (precisa) carregarSemana(seg).then(() => {
      const corpo = sec.isConnected ? q('#mec-corpo') : null;
      // não apaga o que a pessoa começou a escrever na exceção
      if (!corpo || (q('#mec-excecao-form') && !q('#mec-excecao-form').hidden)) return;
      corpo.innerHTML = corpoHtml(item, tipo);
      ligarCorpo();
    });
  }

  // ── Regerar ──
  const btnRegerar = q('[data-mec-regerar]');
  const form = q('#mec-regerar-form');
  if (btnRegerar && form) {
    btnRegerar.onclick = () => {
      const abrir = form.hidden;
      form.hidden = !abrir;
      btnRegerar.setAttribute('aria-expanded', String(abrir));
      if (abrir) form.instrucao.focus();
    };
    q('[data-mec-regerar-cancelar]').onclick = () => { form.hidden = true; btnRegerar.setAttribute('aria-expanded', 'false'); btnRegerar.focus(); };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const estado = item.aprovacao?.estado;
      if (ESTADO_APV[estado] && !confirm(`Esta peça está ${ESTADO_APV[estado]}. Regerar a ideia tira a aprovação: ela volta pra mandar de novo. Seguir?`)) return;
      const instrucao = form.instrucao.value.trim();
      const ir = form.querySelector('[data-mec-regerar-ir]');
      const antes = ir.innerHTML;
      form.querySelectorAll('button, textarea').forEach((x) => { x.disabled = true; });
      btnRegerar.disabled = true;
      ir.setAttribute('aria-busy', 'true');
      ir.innerHTML = '<span class="dt-spinner" aria-hidden="true"></span> Regerando';
      try {
        await api('POST', '/api/semana/regerar', { ...(tipo === 'stories' ? { storiesId: item.id } : { id: item.id }), ...(instrucao ? { instrucao } : {}) });
        invalidarMecanismo();
        if (tipo !== 'stories') invalidarAprovacoes();
        await recarregar();
        const onde = voltarAoPainel();
        toast(`${tipo === 'stories' ? 'Stories regerados' : 'Ideia regerada'}${onde}. A versão anterior ficou guardada.`);
      } catch (err) {
        if (!form.isConnected) { toast(err.message); return; }
        form.querySelectorAll('button, textarea').forEach((x) => { x.disabled = false; });
        btnRegerar.disabled = false;
        ir.removeAttribute('aria-busy');
        ir.innerHTML = antes;
        avisarNoForm(form, err.message);
      }
    };
  }

  // ── Voltar à versão anterior ──
  const voltar = q('[data-mec-voltar]');
  if (voltar) voltar.onclick = async () => {
    const estado = item.aprovacao?.estado;
    const extra = ESTADO_APV[estado] ? ' A aprovação de agora sai.' : '';
    if (!confirm(`Voltar ${tipo === 'stories' ? 'os stories' : 'a ideia'} pra versão anterior?${extra}`)) return;
    voltar.disabled = true;
    try {
      await api('POST', '/api/semana/regerar', { ...(tipo === 'stories' ? { storiesId: item.id } : { id: item.id }), voltar: true });
      invalidarMecanismo();
      if (tipo !== 'stories') invalidarAprovacoes();
      await recarregar();
      toast(`Voltou pra versão anterior${voltarAoPainel()}`);
    } catch (e) {
      if (voltar.isConnected) voltar.disabled = false;
      toast(e.message);
    }
  };
}

function avisarNoForm(form, msg) {
  let el = form.querySelector('.mec-erro');
  if (!el) {
    el = document.createElement('p');
    el.className = 'mec-erro';
    el.setAttribute('role', 'alert');
    form.querySelector('.mec-form-acoes')?.before(el);
  }
  el.textContent = msg;
}
