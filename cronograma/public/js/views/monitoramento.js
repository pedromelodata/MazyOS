// Métricas → Orgânico, Pago e Consolidado: as abas de monitoramento da planilha oficial do calendário.
// Contas e regras em server/monitoramento.mjs; aqui só o desenho e a edição célula a célula (um PUT por
// campo, o servidor devolve o mês recalculado). Enter salva e desce pra linha de baixo, como na planilha.
import { esc, api, toast, icone, recarregar } from '../core.js';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const REDES = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['soma', 'Soma']];
const VAZIO = '<span class="mon-nada" aria-label="sem dado">·</span>';

const COL_ORG = [
  { k: 'alcance', t: 'Alcance' },
  { k: 'impressoes', t: 'Impressões', dica: 'A Meta trocou impressões por views em 2025: vem o número de views' },
  { k: 'curtidas', t: 'Curtidas' },
  { k: 'comentarios', t: 'Comentários' },
  { k: 'compartilhamentos', t: 'Compartilhamentos' },
  { k: 'salvamentos', t: 'Salvamentos' },
  { calc: 'engajamento', t: 'Engajamento total' },
  { calc: 'taxa', t: 'Taxa de engajamento', pct: true },
  { k: 'visitasPerfil', t: 'Visitas ao perfil' },
  { k: 'seguidores', t: 'Seguidores ganhos no dia' },
  { k: 'cliquesBio', t: 'Cliques no link da bio' },
  { k: 'reproducoes', t: 'Reproduções (Reels)' },
  { k: 'tempoMedio', t: 'Tempo médio assistido (s)', dec: 1 },
  { k: 'conclusao', t: 'Taxa de conclusão (%)', dec: 1 },
];
const COL_PAGO = [
  { k: 'investimento', t: 'Investimento (R$)', din: true },
  { escala: true, t: 'Escala na semana' },
  { k: 'impressoes', t: 'Impressões' },
  { k: 'alcance', t: 'Alcance' },
  { k: 'frequencia', t: 'Frequência', dec: 2, sug: 'frequencia' },
  { k: 'ctr', t: 'CTR (%)', dec: 2 },
  { k: 'cpc', t: 'CPC (R$)', din: true },
  { k: 'cpm', t: 'CPM (R$)', din: true, sug: 'cpm' },
  { k: 'leadsBrutos', t: 'Leads brutos' },
  { k: 'leadsQualificados', t: 'Leads qualificados (Serviço)' },
  { k: 'leadsDesqualificados', t: 'Leads desqualificados (Comércio/Indústria)' },
  { calc: 'taxaQualificacao', t: 'Taxa de qualificação', pct: true },
  { calc: 'cplBruto', t: 'CPL bruto (R$)', din: true },
  { calc: 'cplQualificado', t: 'CPL qualificado (R$)', din: true },
  { ga4: true, t: 'generate_lead GA4 confere?' },
];

const hoje = new Date();
const st = { mes: `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`, rede: 'instagram', dados: new Map(), carregando: new Set(), erro: new Map() };
let alvo = null; // { el, aba }
const ui = { conjuntosAbertos: false };
const ROTULO_CONS = {
  cadastrosOrganico: 'Cadastros orgânico', cadastrosMeta: 'Cadastros pago Meta', cadastrosGoogle: 'Cadastros pago Google',
  pctMei: '% MEI nos cadastros', pctMe: '% ME nos cadastros',
};

// ── formatos pt-BR ───────────────────────────────────────────────────────
const nf = (min, max) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: min, maximumFractionDigits: max });
const NF0 = nf(0, 0);
const NF1 = nf(0, 1);
const NF2 = nf(0, 2);
const NF22 = nf(2, 2);
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const ok = (v) => typeof v === 'number' && Number.isFinite(v);

function fmt(v, col = {}) {
  if (!ok(v)) return VAZIO;
  if (col.pct) return `${NF1.format(v * 100)}%`;
  if (col.din) return BRL.format(v);
  if (col.dec === 1) return NF1.format(v);
  if (col.dec === 2) return NF2.format(v);
  return NF0.format(v);
}

// valor dentro do campo (sem R$ nem %: o cabeçalho diz a unidade)
function fmtCampo(v, col = {}) {
  if (!ok(v)) return '';
  if (col.din) return NF22.format(v);
  if (col.dec === 1) return NF1.format(v);
  if (col.dec === 2 || col.pct) return NF2.format(v);
  return NF0.format(v);
}

// "1.400,50", "1400.5", "R$ 600", "12,5%" viram número; vazio apaga; o resto é NaN
function lerNumero(s) {
  let t = String(s ?? '').trim().replace(/^R\$\s*/i, '').replace(/%$/, '').replace(/\s/g, '');
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

function rotuloMes(mes) {
  const [a, m] = mes.split('-').map(Number);
  return `${MESES[m - 1].charAt(0).toUpperCase()}${MESES[m - 1].slice(1)} de ${a}`;
}
function vizinho(mes, delta) {
  const [a, m] = mes.split('-').map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function diaCurto(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')} · ${DIAS[new Date(a, m - 1, d).getDay()]}`;
}

// ── dados ────────────────────────────────────────────────────────────────
async function carregar(mes, { forcar = false } = {}) {
  if (st.carregando.has(mes) || (!forcar && st.dados.has(mes))) return;
  st.carregando.add(mes);
  st.erro.delete(mes);
  try {
    st.dados.set(mes, await api('GET', `/api/monitoramento/${mes}`));
  } catch (e) {
    st.erro.set(mes, e.message);
  }
  st.carregando.delete(mes);
  if (st.mes === mes) desenhar();
}

// o cache do mês fica velho quando a sincronização do Instagram roda ou o link de um post muda
export function invalidar() {
  st.dados.clear();
}

// ── pedaços comuns ───────────────────────────────────────────────────────
function barraMes(extra = '') {
  return `
    <div class="mon-barra">
      <div class="mon-mes">
        <button type="button" class="btn-icone btn-sm" data-mon-mes="-1" data-foco="mes-ant" aria-label="Mês anterior">${icone('chevron-esq', 16)}</button>
        <strong aria-live="polite">${esc(rotuloMes(st.mes))}</strong>
        <button type="button" class="btn-icone btn-sm" data-mon-mes="1" data-foco="mes-prox" aria-label="Próximo mês">${icone('chevron-dir', 16)}</button>
      </div>
      ${extra}
    </div>`;
}

function campo({ foco, valor, col = {}, rotulo, dados, sugestao = null, texto = false, largo = false }) {
  const attrs = Object.entries(dados).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  const ph = ok(sugestao) ? ` placeholder="${esc(fmtCampo(sugestao, col))}" title="Calculado: ${esc(fmtCampo(sugestao, col))}. Digite pra trocar"` : '';
  return `<input class="mon-in${texto ? ' mon-in-texto' : ''}${largo ? ' mon-in-largo' : ''}" ${texto ? 'type="text" maxlength="500"' : 'type="text" inputmode="decimal"'}
    value="${esc(texto ? valor ?? '' : fmtCampo(valor, col))}" data-foco="${esc(foco)}" data-col="${esc(dados.campo)}" ${attrs}${ph}
    aria-label="${esc(rotulo)}" autocomplete="off" spellcheck="false" />`;
}

function caixa(rotulo, tabela) {
  return `<div class="mon-caixa" role="region" aria-label="${esc(rotulo)}" tabindex="0">${tabela}</div>`;
}

// ── Orgânico ─────────────────────────────────────────────────────────────
function organicoHtml(d) {
  const redes = `
    <div class="segmentado" role="group" aria-label="Rede">
      ${REDES.map(([id, nome]) => `<button type="button" data-mon-rede="${id}" data-foco="rede-${id}" aria-pressed="${st.rede === id}">${nome}</button>`).join('')}
    </div>`;
  const linhas = d.organico.linhas;
  if (!linhas.length) return `${barraMes(redes)}<p class="mon-vazio">Nenhum post neste mês</p>`;
  const cab = `
    <thead><tr>
      <th scope="col" class="mon-fixa">Post</th>
      <th scope="col">Link do post</th>
      <th scope="col">Pilar</th>
      <th scope="col">Formato</th>
      ${COL_ORG.map((c) => `<th scope="col" class="mon-num"${c.dica ? ` title="${esc(c.dica)}"` : ''}>${esc(c.t)}</th>`).join('')}
    </tr></thead>`;
  const corpo = linhas.map((l) => {
    const r = l[st.rede];
    const celulas = COL_ORG.map((c) => {
      if (c.calc) return `<td class="mon-num mon-calc">${fmt(r[c.calc], c)}</td>`;
      const v = r.valores[c.k];
      if (st.rede === 'soma' || r.auto.includes(c.k)) {
        return `<td class="mon-num${r.auto.includes(c.k) ? ' mon-auto' : ''}"${r.auto.includes(c.k) ? ' title="Do Instagram"' : ''}>${fmt(v, c)}</td>`;
      }
      return `<td class="mon-num">${campo({
        foco: `organico|${l.chave}|${st.rede}|${c.k}`, valor: v, col: c, rotulo: `${c.t}, ${l.titulo}`,
        dados: { alvo: 'organico', chave: l.chave, rede: st.rede, campo: c.k },
      })}</td>`;
    }).join('');
    const link = l.noCronograma
      ? `<div class="mon-link">${campo({ foco: `link|${l.reelId}`, valor: l.link, texto: true, largo: true, rotulo: `Link do post, ${l.titulo}`, dados: { alvo: 'link', reel: l.reelId, campo: 'link' } })}
          ${/^https:\/\//i.test(l.link) ? `<a class="btn-icone btn-sm" href="${esc(l.link)}" target="_blank" rel="noopener noreferrer" data-foco="abrir|${esc(l.reelId)}" aria-label="Abrir no Instagram">${icone('externo', 14)}</a>` : ''}</div>`
      : /^https:\/\//i.test(l.link) ? `<a class="mon-abrir" href="${esc(l.link)}" target="_blank" rel="noopener noreferrer">${icone('instagram', 14)}Abrir</a>` : VAZIO;
    return `
      <tr>
        <th scope="row" class="mon-fixa">
          <span class="mon-data">${esc(diaCurto(l.data))}${l.noCronograma ? '' : ' <span class="mon-selo" title="Publicado fora do cronograma">fora do cronograma</span>'}</span>
          <span class="mon-titulo" title="${esc(l.titulo)}">${esc(l.titulo)}</span>
        </th>
        <td class="mon-link-td">${link}</td>
        <td class="mon-texto">${l.pilar ? esc(l.pilar) : VAZIO}</td>
        <td class="mon-texto">${l.formato ? esc(l.formato) : VAZIO}</td>
        ${celulas}
      </tr>`;
  }).join('');
  return `${barraMes(redes)}${caixa(`Orgânico de ${rotuloMes(st.mes)}`, `<table class="mon-tabela mon-org">${cab}<tbody>${corpo}</tbody></table>`)}`;
}

// ── Pago ─────────────────────────────────────────────────────────────────
function escalaHtml(l) {
  if (!ok(l.variacao)) return VAZIO;
  const p = `${NF0.format(Math.abs(l.variacao) * 100)}%`;
  if (l.escalou) return `<span class="pill pill-alerta mon-escala" title="O gasto por dia subiu ${p} contra a semana anterior. A regra é no máximo 20%">${icone('alerta', 13)}↑ ${p}</span>`;
  return `<span class="mon-variacao" title="Gasto por dia contra a semana anterior">${l.variacao >= 0 ? '↑' : '↓'} ${p}</span>`;
}

function pagoHtml(d) {
  const { conjuntos, semanas } = d.pago;
  const editor = `
    <details class="mon-conjuntos"${ui.conjuntosAbertos ? ' open' : ''}>
      <summary>Conjuntos do mês · ${conjuntos.length}</summary>
      <ul>
        ${conjuntos.map((c) => `
          <li>
            <select class="campo mon-canal-sel" data-cj="${esc(c.id)}" data-foco="cj-canal|${esc(c.id)}" aria-label="Canal de ${esc(c.nome)}">
              ${['Meta', 'Google'].map((x) => `<option ${x === c.canal ? 'selected' : ''}>${x}</option>`).join('')}
            </select>
            <input class="campo mon-cj-nome" type="text" maxlength="120" value="${esc(c.nome)}" data-cj="${esc(c.id)}" data-foco="cj-nome|${esc(c.id)}" aria-label="Nome do conjunto" />
            <button type="button" class="btn-icone btn-sm" data-cj-remover="${esc(c.id)}" aria-label="Remover ${esc(c.nome)}">${icone('lixo', 14)}</button>
          </li>`).join('')}
      </ul>
      <button type="button" class="btn btn-sm" data-cj-novo data-foco="cj-novo">${icone('mais', 14)}Adicionar conjunto</button>
    </details>`;
  if (!conjuntos.length) return `${barraMes()}${editor}`;
  const cab = `
    <thead><tr>
      <th scope="col" class="mon-fixa">Campanha / Conjunto</th>
      ${COL_PAGO.map((c) => `<th scope="col" class="${c.ga4 ? '' : 'mon-num'}">${esc(c.t)}</th>`).join('')}
    </tr></thead>`;
  const grupos = semanas.map((s) => `
    <tbody>
      <tr class="mon-grupo"><th scope="rowgroup" colspan="${COL_PAGO.length + 1}"><span>Semana ${s.n} · ${esc(s.periodo)}${ok(s.investimento) ? ` · ${BRL.format(s.investimento)}` : ''}</span></th></tr>
      ${s.linhas.map((l) => `
        <tr${l.escalou ? ' class="mon-alerta"' : ''}>
          <th scope="row" class="mon-fixa"><span class="mon-data">${esc(l.canal)}</span><span class="mon-titulo" title="${esc(l.nome)}">${esc(l.nome)}</span></th>
          ${COL_PAGO.map((c) => {
            if (c.escala) return `<td class="mon-num">${escalaHtml(l)}</td>`;
            if (c.calc) return `<td class="mon-num mon-calc">${fmt(l[c.calc], c)}</td>`;
            if (c.ga4) {
              return `<td><select class="mon-in mon-sel" data-alvo="pago" data-semana="${s.n}" data-conjunto="${esc(l.conjuntoId)}" data-campo="ga4" data-col="ga4"
                data-foco="pago|${s.n}|${esc(l.conjuntoId)}|ga4" aria-label="GA4 confere, ${esc(l.nome)}, semana ${s.n}">
                <option value="" ${!l.ga4 ? 'selected' : ''}></option><option value="sim" ${l.ga4 === 'sim' ? 'selected' : ''}>Sim</option><option value="nao" ${l.ga4 === 'nao' ? 'selected' : ''}>Não</option>
              </select></td>`;
            }
            return `<td class="mon-num">${campo({
              foco: `pago|${s.n}|${l.conjuntoId}|${c.k}`, valor: l.valores[c.k], col: c, sugestao: c.sug ? l.sugestao[c.sug] : null,
              rotulo: `${c.t}, ${l.nome}, semana ${s.n}`, dados: { alvo: 'pago', semana: s.n, conjunto: l.conjuntoId, campo: c.k },
            })}</td>`;
          }).join('')}
        </tr>`).join('')}
    </tbody>`).join('');
  return `${barraMes()}${editor}${caixa(`Pago de ${rotuloMes(st.mes)}`, `<table class="mon-tabela mon-pago">${cab}${grupos}</table>`)}`;
}

// ── Consolidado ──────────────────────────────────────────────────────────
function splitHtml(l, meta) {
  const alvoTxt = `MEI ${meta.mei}% · ME ${meta.me}%`;
  if (!ok(l.gapMei)) return `<span class="mon-mudo">${alvoTxt}</span>`;
  const g = Math.abs(l.gapMei);
  const txt = g < 0.05 ? 'MEI na meta' : `MEI ${NF1.format(g)} p.p. ${l.gapMei > 0 ? 'acima' : 'abaixo'}`;
  return `<span class="mon-mudo">${alvoTxt}</span><small class="${g > 5 ? 'mon-fora' : 'mon-dentro'}">${txt}</small>`;
}

function consolidadoHtml(d) {
  const { linhas, total, metaSplit } = d.consolidado;
  const din = { din: true };
  const cab = `
    <thead><tr>
      <th scope="col" class="mon-fixa">Semana</th>
      <th scope="col" class="mon-num">Cadastros orgânico</th>
      <th scope="col" class="mon-num">Cadastros pago Meta</th>
      <th scope="col" class="mon-num">Cadastros pago Google</th>
      <th scope="col" class="mon-num">Cadastros total</th>
      <th scope="col" class="mon-num">Investimento total (R$)</th>
      <th scope="col" class="mon-num">Custo por cadastro blended (R$)</th>
      <th scope="col" class="mon-num">% MEI nos cadastros</th>
      <th scope="col" class="mon-num">% ME nos cadastros</th>
      <th scope="col">Meta de split</th>
      <th scope="col">Post/tema que mais salvou e compartilhou</th>
      <th scope="col">Escalou orçamento &gt;20% na semana?</th>
      <th scope="col">Observações</th>
    </tr></thead>`;
  const entrada = (l, k, pct = false) => campo({
    foco: `consolidado|${l.n}|${k}`, valor: l.valores[k], col: pct ? { dec: 2 } : {}, sugestao: l.sugestao[k] ?? null,
    rotulo: `${ROTULO_CONS[k]}, semana ${l.n}`, dados: { alvo: 'consolidado', semana: l.n, campo: k },
  });
  const corpo = linhas.map((l) => `
    <tr${l.escalou?.sim ? ' class="mon-alerta"' : ''}>
      <th scope="row" class="mon-fixa"><span class="mon-data">Semana ${l.n}</span><span class="mon-titulo">${esc(l.periodo)}</span></th>
      <td class="mon-num">${entrada(l, 'cadastrosOrganico')}</td>
      <td class="mon-num">${entrada(l, 'cadastrosMeta')}</td>
      <td class="mon-num">${entrada(l, 'cadastrosGoogle')}</td>
      <td class="mon-num mon-calc">${fmt(l.cadastros)}</td>
      <td class="mon-num mon-calc">${fmt(l.investimento, din)}</td>
      <td class="mon-num mon-calc">${fmt(l.custoCadastro, din)}</td>
      <td class="mon-num">${entrada(l, 'pctMei', true)}</td>
      <td class="mon-num">${entrada(l, 'pctMe', true)}</td>
      <td class="mon-split">${splitHtml(l, metaSplit)}</td>
      <td class="mon-destaque">${l.destaque
        ? `<span class="mon-titulo" title="${esc(l.destaque.titulo)}">${esc(l.destaque.titulo)}</span><small class="mon-mudo">${NF0.format(l.destaque.salvamentos)} salv. · ${NF0.format(l.destaque.compartilhamentos)} compart.</small>`
        : VAZIO}</td>
      <td>${l.escalou == null ? VAZIO : l.escalou.sim
        ? `<span class="pill pill-alerta" title="${esc(l.escalou.conjuntos.join(', '))}">${icone('alerta', 13)}Sim</span><small class="mon-mudo mon-quebra">${esc(l.escalou.conjuntos.join(', '))}</small>`
        : '<span class="mon-mudo">Não</span>'}</td>
      <td>${campo({ foco: `consolidado|${l.n}|observacoes`, valor: l.observacoes, texto: true, largo: true, rotulo: `Observações, semana ${l.n}`, dados: { alvo: 'consolidado', semana: l.n, campo: 'observacoes' } })}</td>
    </tr>`).join('');
  const rodape = `
    <tfoot><tr>
      <th scope="row" class="mon-fixa"><span class="mon-data">Mês</span></th>
      <td></td><td></td><td></td>
      <td class="mon-num mon-calc">${fmt(total.cadastros)}</td>
      <td class="mon-num mon-calc">${fmt(total.investimento, din)}</td>
      <td class="mon-num mon-calc">${fmt(total.custoCadastro, din)}</td>
      <td colspan="6"></td>
    </tr></tfoot>`;
  return `${barraMes()}${caixa(`Consolidado de ${rotuloMes(st.mes)}`, `<table class="mon-tabela mon-cons">${cab}<tbody>${corpo}</tbody>${rodape}</table>`)}`;
}

// ── desenho ──────────────────────────────────────────────────────────────
// o app redesenha a tela inteira quando o estado muda (recarregar): o campo que estava em edição volta
// com o foco e com o que já tinha sido digitado. Clicar fora (foco no body com o campo ainda na tela) esquece
let focoGuardado = null;
document.addEventListener('focusin', (e) => {
  const f = e.target instanceof Element ? e.target.closest('.mon [data-foco]') : null;
  focoGuardado = f ? { foco: f.dataset.foco, valor: null } : null;
});
document.addEventListener('input', (e) => {
  if (focoGuardado && e.target instanceof Element && e.target.dataset?.foco === focoGuardado.foco) focoGuardado.valor = e.target.value;
});
document.addEventListener('focusout', (e) => {
  const t = e.target;
  setTimeout(() => {
    if (t instanceof Element && t.isConnected && (!document.activeElement || document.activeElement === document.body)) focoGuardado = null;
  });
});

function conteudo(aba) {
  const d = st.dados.get(st.mes);
  if (!d) {
    if (st.erro.has(st.mes)) {
      return `${barraMes()}<div class="card vazio"><strong>Não consegui ler o monitoramento</strong><p>${esc(st.erro.get(st.mes))}</p>
        <button type="button" class="btn btn-sm" data-mon-tentar>Tentar de novo</button></div>`;
    }
    return `${barraMes()}<p class="ig-carregando-txt" role="status"><span class="ig-giro" aria-hidden="true"></span>Carregando…</p>`;
  }
  if (aba === 'pago') return pagoHtml(d);
  if (aba === 'consolidado') return consolidadoHtml(d);
  return organicoHtml(d);
}

function desenhar() {
  if (!alvo?.el?.isConnected) return;
  const el = alvo.el;
  // redesenho com resposta chegando: o foco e o que estava sendo digitado ficam onde estavam
  const ativo = document.activeElement;
  const dentro = el.contains(ativo);
  const semFoco = !ativo || ativo === document.body;
  const foco = dentro ? ativo.dataset?.foco : semFoco ? focoGuardado?.foco ?? null : null;
  const digitado = dentro
    ? (foco && ativo.matches?.('input') && ativo.value !== ativo.defaultValue ? ativo.value : null)
    : focoGuardado?.valor ?? null;
  const sel = dentro && foco && ativo.matches?.('input') ? [ativo.selectionStart, ativo.selectionEnd] : null;
  const rolagem = el.querySelector('.mon-caixa')?.scrollLeft ?? 0;
  el.innerHTML = conteudo(alvo.aba);
  ligar();
  const caixaNova = el.querySelector('.mon-caixa');
  if (caixaNova) caixaNova.scrollLeft = rolagem;
  if (foco) {
    const alvoFoco = el.querySelector(`[data-foco="${CSS.escape(foco)}"]`);
    if (alvoFoco) {
      if (digitado != null) alvoFoco.value = digitado;
      alvoFoco.focus({ preventScroll: true });
      if (sel && alvoFoco.setSelectionRange) try { alvoFoco.setSelectionRange(...sel); } catch { /* select não tem seleção */ }
    }
  }
}

// ── edição ───────────────────────────────────────────────────────────────
async function mandar(metodo, url, corpo) {
  try {
    const d = await api(metodo, url, corpo);
    if (d?.mes) st.dados.set(d.mes, d);
    desenhar();
    return true;
  } catch (e) {
    toast(e.message);
    return false;
  }
}

async function salvarCampo(input) {
  const { alvo: aba, campo: nome } = input.dataset;
  if (focoGuardado?.foco === input.dataset.foco) focoGuardado.valor = null;
  const mes = st.mes;
  if (aba === 'link') {
    const link = input.value.trim();
    if (link && !/^https:\/\/(www\.)?instagram\.com\/\S+$/i.test(link)) {
      toast('Cole o link do post no Instagram (https://www.instagram.com/...)');
      input.value = input.defaultValue;
      return;
    }
    try {
      await api('PUT', `/api/reels/${encodeURIComponent(input.dataset.reel)}`, { permalink: link });
    } catch (e) {
      toast(e.message);
      input.value = input.defaultValue;
      return;
    }
    input.defaultValue = link;
    st.dados.delete(mes);
    await carregar(mes, { forcar: true });
    recarregar().catch(() => {});
    return;
  }
  let valor = input.value;
  if (nome !== 'observacoes' && nome !== 'ga4') {
    valor = lerNumero(valor);
    if (Number.isNaN(valor)) {
      toast('Esse campo só aceita número, sem sinal de menos.');
      input.value = input.defaultValue;
      return;
    }
  }
  const base = { campo: nome, valor };
  const corpo = aba === 'organico'
    ? { ...base, chave: input.dataset.chave, rede: input.dataset.rede }
    : aba === 'pago'
      ? { ...base, semana: Number(input.dataset.semana), conjuntoId: input.dataset.conjunto }
      : { ...base, semana: Number(input.dataset.semana) };
  if (!(await mandar('PUT', `/api/monitoramento/${mes}/${aba}`, corpo))) input.value = input.defaultValue;
}

// Enter salva e desce pra mesma coluna da linha de baixo
function descer(input) {
  const todos = [...alvo.el.querySelectorAll(`.mon-tabela [data-col="${CSS.escape(input.dataset.col)}"]`)];
  const i = todos.indexOf(input);
  if (i >= 0 && todos[i + 1]) todos[i + 1].focus();
  else input.blur();
}

function ligar() {
  const el = alvo.el;
  el.querySelectorAll('[data-mon-mes]').forEach((b) => (b.onclick = () => {
    st.mes = vizinho(st.mes, Number(b.dataset.monMes));
    desenhar();
    carregar(st.mes);
  }));
  el.querySelectorAll('[data-mon-rede]').forEach((b) => (b.onclick = () => { st.rede = b.dataset.monRede; desenhar(); }));
  el.querySelectorAll('[data-mon-tentar]').forEach((b) => (b.onclick = () => { st.erro.delete(st.mes); desenhar(); carregar(st.mes); }));
  el.querySelectorAll('input.mon-in, select.mon-in').forEach((i) => {
    i.addEventListener('change', () => salvarCampo(i));
    if (i.matches('input')) {
      i.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); descer(i); }
        if (e.key === 'Escape') { i.value = i.defaultValue; i.blur(); }
      });
    }
  });
  const det = el.querySelector('.mon-conjuntos');
  if (det) det.addEventListener('toggle', () => { ui.conjuntosAbertos = det.open; });
  el.querySelectorAll('.mon-canal-sel').forEach((s) => s.addEventListener('change', () => mandar('PUT', `/api/monitoramento/${st.mes}/conjuntos/${encodeURIComponent(s.dataset.cj)}`, { canal: s.value })));
  el.querySelectorAll('.mon-cj-nome').forEach((i) => {
    i.addEventListener('change', async () => {
      if (!i.value.trim()) { i.value = i.defaultValue; return; }
      if (!(await mandar('PUT', `/api/monitoramento/${st.mes}/conjuntos/${encodeURIComponent(i.dataset.cj)}`, { nome: i.value }))) i.value = i.defaultValue;
    });
    i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); i.blur(); } });
  });
  el.querySelectorAll('[data-cj-remover]').forEach((b) => (b.onclick = () => {
    const nome = b.closest('li')?.querySelector('.mon-cj-nome')?.value ?? 'este conjunto';
    if (!confirm(`Remover "${nome}" de ${rotuloMes(st.mes)}? Os números dele neste mês saem junto.`)) return;
    mandar('DELETE', `/api/monitoramento/${st.mes}/conjuntos/${encodeURIComponent(b.dataset.cjRemover)}`);
  }));
  el.querySelectorAll('[data-cj-novo]').forEach((b) => (b.onclick = async () => {
    ui.conjuntosAbertos = true;
    if (await mandar('POST', `/api/monitoramento/${st.mes}/conjuntos`, { canal: 'Meta', nome: 'Novo conjunto' })) {
      const nomes = el.querySelectorAll('.mon-cj-nome');
      const ultimo = nomes[nomes.length - 1];
      ultimo?.focus();
      ultimo?.select();
    }
  }));
}

export function montar(el, aba) {
  if (!el) return;
  alvo = { el, aba };
  desenhar();
  carregar(st.mes);
}
