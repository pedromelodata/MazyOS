// Métricas (Diagnóstico, Público e Semanal, 30/09/2026): formatação, pílulas e gráficos feitos à mão em
// SVG e CSS, porque a CSP não deixa biblioteca (SPEC-METRICAS.md §5.1). Regras de visualização seguidas:
//  - marca fina (barra de 14px, no máximo 24), ponta de dado arredondada em 4px e reta na base; 2px de
//    respiro entre marcas que se encostam; grade e eixo em linha fina, nunca tracejada
//  - cor de dado só na marca: texto usa as cores de texto; identidade nunca só pela cor (legenda com 2+
//    séries, rótulo direto seletivo, seta e palavra no acima/abaixo)
//  - série 1 azul e série 2 laranja; acima da base azul, abaixo vermelho, meio cinza (validadas contra o
//    cartão claro #FFFFFF e o escuro #1F2228, nos dois temas: metricas-comum.css)
//  - toda figura tem a tabela equivalente ("Ver em tabela") e dica no hover e no foco (texto por
//    textContent, nunca innerHTML)
//  - rótulo de número nunca fica dentro da cor do dado (branco sobre azul ou laranja não passa de 4,5:1):
//    vai ao lado, com a cor de texto (30/09)
//  - faixa de idade é chave ("25-34") só no dado; na tela é "25 a 34" e "65 ou mais" (30/09)
//  - fator de peça que não bateu a meta é truncado em uma casa e fica abaixo de 2: 1,96× vira "1,9×",
//    nunca "2×" ao lado de "não bateu" (vezesDaPeca, 30/09)
import { esc } from './core.js';

export const SEM_DADO = 'sem dado';
export const finito = (x) => typeof x === 'number' && Number.isFinite(x);
const limitar = (x, min, max) => Math.min(max, Math.max(min, x));

// ── números ──────────────────────────────────────────────────────────────
export function num(n, { casas = 0, compacto = false } = {}) {
  if (!finito(n)) return SEM_DADO;
  if (compacto && Math.abs(n) >= 10_000) return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  return n.toLocaleString('pt-BR', { maximumFractionDigits: casas });
}
// n na escala 0 a 100
export function pct(n, { casas } = {}) {
  if (!finito(n)) return SEM_DADO;
  const c = casas ?? (n === Math.round(n) ? 0 : 1);
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: c })}%`;
}
export function vezes(r) {
  if (!finito(r)) return SEM_DADO;
  const o = r >= 10 ? { maximumFractionDigits: 0 } : r >= 0.1 ? { maximumFractionDigits: 1 } : { maximumSignificantDigits: 1 };
  return `${r.toLocaleString('pt-BR', o)}×`;
}
export const vezesDeScore = (s) => (finito(s) ? vezes(2 ** s) : SEM_DADO);
// fator de uma peça contra a base (score = log2 da razão). Bateu (true): o fator como é. Não bateu (false):
// truncado em uma casa e no máximo 1,9, porque a meta é o menor inteiro que dá 2× e um fator de 1,96 (ou
// 2,0002 com valor quebrado aos 7 dias) arredondado viraria "2×" ao lado de "não bateu". Ainda sem veredito
// (null, peça provisória): truncado, sem teto. Abaixo de 0,1× fica o algarismo significativo de vezes()
export function vezesDaPeca(score, bateu = null) {
  if (!finito(score)) return SEM_DADO;
  const r = 2 ** score;
  if (bateu === true || r < 0.1) return vezes(r);
  // o 1e-9 só absorve o erro de ponto flutuante (2 ** log2(1,9) = 1,8999999...)
  const t = Math.floor(r * 10 + 1e-9) / 10;
  return vezes(bateu === false ? Math.min(t, 1.9) : t);
}
export const segundos = (ms) => (finito(ms) ? `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}s` : SEM_DADO);
export const reais = (v) => (finito(v) ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : SEM_DADO);
export const plural = (n, um, varios) => `${num(n)} ${n === 1 ? um : varios}`;

// ── datas (Brasília) ─────────────────────────────────────────────────────
const FUSO = 'America/Sao_Paulo';
const isoTs = (ts) => String(ts ?? '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
function paraData(ts) {
  if (!ts) return null;
  const s = String(ts);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 15)) : new Date(isoTs(s));
  return Number.isNaN(d.getTime()) ? null : d;
}
export function dataCurta(ts, { ano = false } = {}) {
  const d = paraData(ts);
  if (!d) return SEM_DADO;
  return d.toLocaleDateString('pt-BR', { timeZone: FUSO, day: '2-digit', month: '2-digit', ...(ano ? { year: 'numeric' } : {}) });
}
export function dataHora(ts) {
  const d = paraData(ts);
  if (!d) return SEM_DADO;
  const dia = d.toLocaleDateString('pt-BR', { timeZone: FUSO, day: '2-digit', month: '2-digit' });
  const hora = d.toLocaleTimeString('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' });
  return `${dia} às ${hora}`;
}
export function diaDaSemana(ts) {
  const d = paraData(ts);
  return d ? d.toLocaleDateString('pt-BR', { timeZone: FUSO, weekday: 'long' }) : SEM_DADO;
}
// "28/09 a 04/10" da semana ISO AAAA-Www
export function rotuloSemana(semana) {
  const m = /^(\d{4})-W(\d{2})$/.exec(String(semana ?? ''));
  if (!m) return SEM_DADO;
  const ano = Number(m[1]);
  const jan4 = new Date(Date.UTC(ano, 0, 4));
  const seg = Date.UTC(ano, 0, 4 - ((jan4.getUTCDay() + 6) % 7)) + (Number(m[2]) - 1) * 7 * 86_400_000;
  const f = (ms) => { const d = new Date(ms); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
  return `${f(seg)} a ${f(seg + 6 * 86_400_000)}`;
}
// "há 3 horas", "há 2 dias"
export function haQuanto(iso) {
  const d = paraData(iso);
  if (!d) return '';
  const min = Math.round((Date.now() - d.getTime()) / 60_000);
  if (min < 2) return 'agora há pouco';
  if (min < 60) return `há ${min} minutos`;
  const h = Math.round(min / 60);
  if (h < 24) return h === 1 ? 'há 1 hora' : `há ${h} horas`;
  const dias = Math.round(h / 24);
  return dias === 1 ? 'há 1 dia' : `há ${dias} dias`;
}

// ── pílulas ──────────────────────────────────────────────────────────────
const EVIDENCIA = {
  forte: ['evidência forte', '5 peças ou mais, efeito grande e quase todas do mesmo lado'],
  moderada: ['evidência moderada', '3 peças ou mais e efeito claro'],
  fraca: ['evidência fraca', 'poucas peças: é sinal, ainda não é regra'],
  insuficiente: ['sem evidência', 'menos de 2 peças ou efeito pequeno demais'],
};
export function pillEvidencia(rotulo) {
  const [texto, dica] = EVIDENCIA[rotulo] ?? EVIDENCIA.insuficiente;
  return `<span class="pill mc-ev" data-ev="${esc(rotulo ?? 'insuficiente')}" title="${esc(dica)}">${esc(texto)}</span>`;
}
const NIVEL = { acima: ['↑', 'acima da base'], abaixo: ['↓', 'abaixo da base'], normal: ['=', 'na base'] };
export function pillNivel(nivel, { curto = false } = {}) {
  if (!NIVEL[nivel]) return `<span class="pill mc-nivel" data-nivel="sem">${SEM_DADO}</span>`;
  const [seta, texto] = NIVEL[nivel];
  return `<span class="pill mc-nivel" data-nivel="${nivel}"><b aria-hidden="true">${seta}</b>${curto ? esc(nivel) : esc(texto)}</span>`;
}
const FONTE = {
  cronograma: 'do cronograma', ia: 'IA', manual: 'manual', calculado: 'calculado', api: 'Instagram', estimado: 'estimado',
  app: 'app do Instagram', anuncio: 'anúncio', agenda: 'automático',
};
export function pillFonte(fonte) {
  return fonte && FONTE[fonte] ? `<span class="mc-fonte" data-fonte="${esc(fonte)}">${esc(FONTE[fonte])}</span>` : '';
}
// selo da meta de uma peça: "bateu 2×", ou o fator contra a base (truncado quando não bateu: vezesDaPeca)
export function pillMeta(bateu, score) {
  if (bateu == null) return `<span class="pill mc-meta" data-meta="sem">${esc(finito(score) ? `${vezesDaPeca(score, null)} a base` : 'sem base')}</span>`;
  return bateu
    ? '<span class="pill mc-meta" data-meta="bateu"><b aria-hidden="true">✓</b>bateu 2×</span>'
    : `<span class="pill mc-meta" data-meta="nao">${esc(finito(score) ? `${vezesDaPeca(score, false)} a base` : 'não bateu')}</span>`;
}

// ── tabela equivalente ───────────────────────────────────────────────────
// colunas: [{ titulo, num? }]; linhas: [[células em texto]]
export function tabela(colunas, linhas, { resumo = 'Ver em tabela' } = {}) {
  if (!linhas?.length) return '';
  return `
    <details class="mc-tabela">
      <summary>${esc(resumo)}</summary>
      <div class="mc-tabela-rolo"><table>
        <thead><tr>${colunas.map((c) => `<th scope="col"${c.num ? ' class="mc-num"' : ''}>${esc(c.titulo)}</th>`).join('')}</tr></thead>
        <tbody>${linhas.map((l) => `<tr>${l.map((x, i) => `<td${colunas[i]?.num ? ' class="mc-num"' : ''}>${esc(x ?? SEM_DADO)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
    </details>`;
}

const legendaHtml = (series) => `<ul class="mc-legenda">${series.map((s) => `<li><i class="mc-chave" data-serie="${s.serie}" aria-hidden="true"></i>${esc(s.nome)}</li>`).join('')}</ul>`;

// ── barras horizontais (uma série) ───────────────────────────────────────
// itens: [{ rotulo, valor, texto?, dica?, destaque? }]; formato(valor) → texto na ponta
export function barrasH(itens, { formato = (v) => num(v), max = null, titulo = '', tabelaTitulos = ['Item', 'Valor'], emfase = false } = {}) {
  const lista = (itens ?? []).filter((x) => x && x.rotulo != null);
  if (!lista.length) return '';
  const topo = max ?? Math.max(0, ...lista.map((x) => (finito(x.valor) ? x.valor : 0)));
  const linhas = lista.map((x) => {
    const p = topo > 0 && finito(x.valor) ? limitar(x.valor / topo, 0, 1) : 0;
    const texto = x.texto ?? formato(x.valor);
    const serie = emfase && !x.destaque ? 'apagado' : '1';
    return `
      <li class="mc-barra-linha" tabindex="0" data-mc-dica="${esc(x.dica ?? `${x.rotulo}: ${texto}`)}">
        <span class="mc-barra-rotulo">${esc(x.rotulo)}</span>
        <span class="mc-barra-trilho"><span class="mc-barra" data-serie="${serie}" style="--p:${p.toFixed(4)}"></span><span class="mc-barra-valor">${esc(texto)}</span></span>
      </li>`;
  }).join('');
  return `
    <figure class="mc-fig">
      ${titulo ? `<figcaption class="mc-titulo">${esc(titulo)}</figcaption>` : ''}
      <ul class="mc-barras" role="list">${linhas}</ul>
      ${tabela([{ titulo: tabelaTitulos[0] }, { titulo: tabelaTitulos[1], num: true }], lista.map((x) => [x.rotulo, x.texto ?? formato(x.valor)]))}
    </figure>`;
}

// ── barra divergente (score em log2 contra a base) ───────────────────────
// o meio é a base; a direita é acima (azul), a esquerda abaixo (vermelho). limite = 2 (4× ou 1/4)
export function divergente(score, { limite = 2, rotulo = '' } = {}) {
  if (!finito(score)) return `<span class="mc-div mc-div-vazio" role="img" aria-label="${esc(rotulo ? `${rotulo}: sem dado` : SEM_DADO)}"><i class="mc-div-meio"></i></span>`;
  const p = limitar(Math.abs(score) / limite, 0.03, 1) * 50;
  const lado = score >= 0 ? 'acima' : 'abaixo';
  const texto = `${vezesDeScore(score)} a base`;
  return `<span class="mc-div" role="img" aria-label="${esc(rotulo ? `${rotulo}: ${texto}` : texto)}"><i class="mc-div-meio"></i><i class="mc-div-barra" data-lado="${lado}" style="--p:${p.toFixed(2)}%"></i></span>`;
}

// ── pirâmide idade × gênero ──────────────────────────────────────────────
// "25-34" é a chave do dado; na tela (rótulo, dica e tabela) vira "25 a 34", e "65+" vira "65 ou mais"
export const faixaIdade = (f) => String(f ?? '').replace('-', ' a ').replace(/\+$/, ' ou mais');

// linhas: [{ faixa: '25-34', a: pct, b: pct }] (percentual do total); a = mulheres, b = homens
export function piramide(linhas, { rotuloA = 'Mulheres', rotuloB = 'Homens', titulo = '', minimoRotulo = 5 } = {}) {
  const ls = (linhas ?? []).filter((l) => l && (finito(l.a) || finito(l.b)));
  if (!ls.length) return '';
  const topo = Math.max(1, ...ls.flatMap((l) => [l.a ?? 0, l.b ?? 0]));
  const faixa = faixaIdade;
  const lado = (v, serie, quem, f) => {
    const p = finito(v) ? limitar(v / topo, 0, 1) : 0;
    const texto = pct(v, { casas: 0 });
    return `<span class="mc-pir-lado" data-lado="${serie === '1' ? 'esq' : 'dir'}" tabindex="0" data-mc-dica="${esc(`${quem} de ${faixa(f)} anos: ${texto}`)}">
      <span class="mc-barra" data-serie="${serie}" style="--p:${p.toFixed(4)}"></span>${finito(v) && v >= minimoRotulo ? `<span class="mc-barra-valor">${esc(texto)}</span>` : ''}</span>`;
  };
  return `
    <figure class="mc-fig mc-piramide">
      ${titulo ? `<figcaption class="mc-titulo">${esc(titulo)}</figcaption>` : ''}
      ${legendaHtml([{ serie: '1', nome: rotuloA }, { serie: '2', nome: rotuloB }])}
      <div class="mc-pir" role="list">
        ${ls.map((l) => `<div class="mc-pir-linha" role="listitem">${lado(l.a, '1', rotuloA, l.faixa)}<span class="mc-pir-faixa">${esc(faixa(l.faixa))}</span>${lado(l.b, '2', rotuloB, l.faixa)}</div>`).join('')}
      </div>
      ${tabela([{ titulo: 'Idade' }, { titulo: rotuloA, num: true }, { titulo: rotuloB, num: true }], ls.map((l) => [faixa(l.faixa), pct(l.a, { casas: 1 }), pct(l.b, { casas: 1 })]))}
    </figure>`;
}

// ── colunas (uma série; as de destaque em azul e o resto apagado quando emfase) ──
// itens: [{ rotulo, valor, destaque?, dica? }]
export function colunas(itens, { formato = (v) => num(v), altura = 120, titulo = '', rotuloACada = 1, emfase = false, tabelaTitulos = ['Item', 'Valor'] } = {}) {
  const lista = itens ?? [];
  if (!lista.some((x) => finito(x?.valor))) return '';
  const topo = Math.max(0, ...lista.map((x) => (finito(x.valor) ? x.valor : 0)));
  return `
    <figure class="mc-fig">
      ${titulo ? `<figcaption class="mc-titulo">${esc(titulo)}</figcaption>` : ''}
      <div class="mc-colunas" style="--alt:${altura}px">
        ${lista.map((x, i) => {
          const p = topo > 0 && finito(x.valor) ? limitar(x.valor / topo, 0, 1) : 0;
          const serie = emfase && !x.destaque ? 'apagado' : '1';
          return `<div class="mc-col" tabindex="0" data-mc-dica="${esc(x.dica ?? `${x.rotulo}: ${formato(x.valor)}`)}">
            <span class="mc-col-area"><span class="mc-col-barra" data-serie="${serie}" style="--p:${p.toFixed(4)}"></span></span>
            <span class="mc-col-rotulo">${i % rotuloACada === 0 ? esc(x.rotulo) : ''}</span>
          </div>`;
        }).join('')}
      </div>
      ${tabela([{ titulo: tabelaTitulos[0] }, { titulo: tabelaTitulos[1], num: true }], lista.map((x) => [x.rotulo, formato(x.valor)]))}
    </figure>`;
}

// ── colunas divergentes (duas séries: pos pra cima, neg pra baixo) ───────
// itens: [{ rotulo, pos, neg }]
export function colunasDivergentes(itens, { rotuloPos = 'Seguiram', rotuloNeg = 'Deixaram de seguir', altura = 80, titulo = '', rotuloACada = 1 } = {}) {
  const lista = itens ?? [];
  if (!lista.some((x) => finito(x?.pos) || finito(x?.neg))) return '';
  const topo = Math.max(1, ...lista.flatMap((x) => [finito(x.pos) ? x.pos : 0, finito(x.neg) ? x.neg : 0]));
  return `
    <figure class="mc-fig">
      ${titulo ? `<figcaption class="mc-titulo">${esc(titulo)}</figcaption>` : ''}
      ${legendaHtml([{ serie: '1', nome: rotuloPos }, { serie: '2', nome: rotuloNeg }])}
      <div class="mc-coldiv" style="--alt:${altura}px">
        ${lista.map((x, i) => `
          <div class="mc-coldiv-col" tabindex="0" data-mc-dica="${esc(`${x.rotulo}: ${num(x.pos)} ${rotuloPos.toLowerCase()}, ${num(x.neg)} ${rotuloNeg.toLowerCase()}`)}">
            <span class="mc-coldiv-cima"><span class="mc-col-barra" data-serie="1" style="--p:${(finito(x.pos) ? limitar(x.pos / topo, 0, 1) : 0).toFixed(4)}"></span></span>
            <span class="mc-coldiv-baixo"><span class="mc-col-barra" data-serie="2" style="--p:${(finito(x.neg) ? limitar(x.neg / topo, 0, 1) : 0).toFixed(4)}"></span></span>
            <span class="mc-col-rotulo">${i % rotuloACada === 0 ? esc(x.rotulo) : ''}</span>
          </div>`).join('')}
      </div>
      ${tabela([{ titulo: 'Dia' }, { titulo: rotuloPos, num: true }, { titulo: rotuloNeg, num: true }], lista.map((x) => [x.rotulo, num(x.pos), num(x.neg)]))}
    </figure>`;
}

// ── barras 100% empilhadas (duas partes) ─────────────────────────────────
// linhas: [{ rotulo, partes: [a, b] }] em números absolutos; nomes: [nomeA, nomeB]. Os dois percentuais
// ficam ao lado da barra, na cor de texto e com a chave da série (dentro do segmento, o branco sobre o azul
// e o laranja ficava abaixo de 4,5:1 nos dois temas)
export function empilhadas(linhas, { nomes = ['A', 'B'], titulo = '' } = {}) {
  const ls = (linhas ?? []).filter((l) => l && (l.partes ?? []).some(finito));
  if (!ls.length) return '';
  const html = ls.map((l) => {
    const [a, b] = (l.partes ?? []).map((x) => (finito(x) ? x : 0));
    const total = a + b;
    const pa = total > 0 ? (a / total) * 100 : 0;
    const pb = total > 0 ? 100 - pa : 0;
    const seg = (p, serie) => `<span class="mc-emp-seg" data-serie="${serie}" style="--p:${p.toFixed(2)}%"></span>`;
    const valor = (p, serie) => `<span><i class="mc-chave" data-serie="${serie}" aria-hidden="true"></i>${esc(pct(p, { casas: 0 }))}</span>`;
    return `
      <li class="mc-emp-linha" tabindex="0" data-mc-dica="${esc(`${l.rotulo}: ${nomes[0]} ${pct(pa, { casas: 0 })}, ${nomes[1]} ${pct(pb, { casas: 0 })}`)}">
        <span class="mc-barra-rotulo">${esc(l.rotulo)}</span>
        <span class="mc-emp">${total > 0 ? seg(pa, '1') + seg(pb, '2') : `<span class="mc-emp-vazio">${SEM_DADO}</span>`}</span>
        <span class="mc-emp-valores">${total > 0 ? valor(pa, '1') + valor(pb, '2') : ''}</span>
      </li>`;
  }).join('');
  return `
    <figure class="mc-fig">
      ${titulo ? `<figcaption class="mc-titulo">${esc(titulo)}</figcaption>` : ''}
      ${legendaHtml([{ serie: '1', nome: nomes[0] }, { serie: '2', nome: nomes[1] }])}
      <ul class="mc-empilhadas" role="list">${html}</ul>
      ${tabela([{ titulo: 'Período' }, { titulo: nomes[0], num: true }, { titulo: nomes[1], num: true }], ls.map((l) => [l.rotulo, num(l.partes?.[0]), num(l.partes?.[1])]))}
    </figure>`;
}

// ── linha (uma série, com o último ponto rotulado) ───────────────────────
// pontos: [{ rotulo, valor }]
export function linha(pontos, { formato = (v) => num(v), altura = 120, titulo = '', tabelaTitulos = ['Período', 'Valor'] } = {}) {
  const ps = (pontos ?? []).filter((p) => p && p.rotulo != null);
  const vals = ps.map((p) => p.valor).filter(finito);
  if (vals.length < 2) return '';
  const L = 600;
  const H = altura;
  const topo = 12;
  const base = H - 22;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const faixa = max - min || 1;
  const x = (i) => (ps.length === 1 ? L / 2 : 8 + (i * (L - 60)) / (ps.length - 1));
  const y = (v) => base - ((v - min) / faixa) * (base - topo);
  const trechos = [];
  let atual = [];
  ps.forEach((p, i) => {
    if (finito(p.valor)) atual.push(`${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`);
    else if (atual.length) { trechos.push(atual); atual = []; }
  });
  if (atual.length) trechos.push(atual);
  const ultimo = [...ps.keys()].reverse().find((i) => finito(ps[i].valor));
  const pontosHtml = ps.map((p, i) => (finito(p.valor)
    ? `<g class="mc-lin-ponto" tabindex="0" data-mc-dica="${esc(`${p.rotulo}: ${formato(p.valor)}`)}"><circle class="mc-lin-alvo" cx="${x(i).toFixed(1)}" cy="${y(p.valor).toFixed(1)}" r="12"></circle>${i === ultimo ? `<circle class="mc-lin-fim" cx="${x(i).toFixed(1)}" cy="${y(p.valor).toFixed(1)}" r="4"></circle>` : ''}</g>`
    : '')).join('');
  return `
    <figure class="mc-fig">
      ${titulo ? `<figcaption class="mc-titulo">${esc(titulo)}</figcaption>` : ''}
      <svg class="mc-linha" viewBox="0 0 ${L} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(`${titulo || 'Série'}: de ${formato(vals[0])} a ${formato(vals.at(-1))}`)}">
        <line class="mc-lin-grade" x1="0" x2="${L}" y1="${topo}" y2="${topo}"></line>
        <line class="mc-lin-base" x1="0" x2="${L}" y1="${base}" y2="${base}"></line>
        ${trechos.map((t) => `<polyline class="mc-lin" points="${t.join(' ')}"></polyline>`).join('')}
        ${pontosHtml}
      </svg>
      <div class="mc-lin-eixo"><span>${esc(ps[0].rotulo)}</span><span class="mc-lin-fim-rotulo">${esc(formato(ps[ultimo].valor))}</span><span>${esc(ps.at(-1).rotulo)}</span></div>
      ${tabela([{ titulo: tabelaTitulos[0] }, { titulo: tabelaTitulos[1], num: true }], ps.map((p) => [p.rotulo, formato(p.valor)]))}
    </figure>`;
}

// ── medidor da meta: barra do valor, marca da base e marca da meta ───────
export function medidor({ valor, base, meta, formato = (v) => num(v), rotulo = '' } = {}) {
  const vals = [valor, base, meta].filter(finito);
  if (!vals.length) return `<div class="mc-medidor mc-medidor-vazio">${SEM_DADO}</div>`;
  const topo = Math.max(...vals) * 1.08 || 1;
  const p = (v) => (finito(v) ? limitar(v / topo, 0, 1) * 100 : null);
  const pv = p(valor);
  const bateu = finito(valor) && finito(meta) && valor >= meta - 1e-9;
  const descricao = [
    rotulo,
    `valor ${formato(valor)}`,
    finito(base) ? `base ${formato(base)}` : 'sem base',
    finito(meta) ? `meta ${formato(meta)}` : '',
  ].filter(Boolean).join(', ');
  return `
    <div class="mc-medidor" role="img" aria-label="${esc(descricao)}" tabindex="0" data-mc-dica="${esc(descricao)}">
      <span class="mc-medidor-trilho">
        ${pv != null ? `<span class="mc-medidor-valor" data-bateu="${bateu}" style="--p:${pv.toFixed(2)}%"></span>` : ''}
        ${p(base) != null ? `<i class="mc-medidor-marca" data-marca="base" style="--p:${p(base).toFixed(2)}%"></i>` : ''}
        ${p(meta) != null ? `<i class="mc-medidor-marca" data-marca="meta" style="--p:${p(meta).toFixed(2)}%"></i>` : ''}
      </span>
      <span class="mc-medidor-legenda">
        <span><b>${esc(formato(valor))}</b></span>
        ${finito(base) ? `<span><i class="mc-marca-chave" data-marca="base" aria-hidden="true"></i>base ${esc(formato(base))}</span>` : ''}
        ${finito(meta) ? `<span><i class="mc-marca-chave" data-marca="meta" aria-hidden="true"></i>meta ${esc(formato(meta))}</span>` : ''}
      </span>
    </div>`;
}

// ── estado vazio curto ───────────────────────────────────────────────────
export function vazio(titulo, texto = '', acao = '') {
  return `<div class="mc-vazio"><strong>${esc(titulo)}</strong>${texto ? `<p>${esc(texto)}</p>` : ''}${acao}</div>`;
}

// ── dica (hover e foco) ──────────────────────────────────────────────────
// Um balão só pra página; o texto vem de data-mc-dica e entra por textContent
let dica = null;
let alvoDica = null;
function garantirDica() {
  if (dica?.isConnected) return dica;
  dica = document.createElement('div');
  dica.className = 'mc-dica';
  dica.setAttribute('role', 'tooltip');
  dica.hidden = true;
  document.body.append(dica);
  return dica;
}
function mostrar(el) {
  const texto = el?.dataset?.mcDica;
  if (!texto) return;
  const d = garantirDica();
  alvoDica = el;
  d.textContent = texto;
  d.hidden = false;
  const r = el.getBoundingClientRect();
  const w = d.offsetWidth;
  const h = d.offsetHeight;
  const x = limitar(r.left + r.width / 2 - w / 2, 8, window.innerWidth - w - 8);
  const acima = r.top - h - 8;
  const y = acima >= 8 ? acima : r.bottom + 8;
  d.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}
function esconder() {
  if (dica) dica.hidden = true;
  alvoDica = null;
}
let ligado = false;
export function ligarDicas() {
  if (ligado) return;
  ligado = true;
  document.addEventListener('pointerover', (e) => {
    const el = e.target instanceof Element ? e.target.closest('[data-mc-dica]') : null;
    if (el && el !== alvoDica) mostrar(el);
    else if (!el && alvoDica) esconder();
  });
  document.addEventListener('focusin', (e) => {
    const el = e.target instanceof Element ? e.target.closest('[data-mc-dica]') : null;
    if (el) mostrar(el);
    else esconder();
  });
  document.addEventListener('focusout', () => esconder());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && alvoDica) esconder(); });
  addEventListener('scroll', esconder, { passive: true, capture: true });
}
