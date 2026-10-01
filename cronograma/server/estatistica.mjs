// Estatística e datas do módulo de Métricas (Diagnóstico, Público e Semanal, 30/09/2026; SPEC-METRICAS.md §3.1).
// Puro: nada de disco, rede ou relógio escondido (quem precisa de "agora" recebe por parâmetro), pra testar
// sem banco. Decisões:
//  - desempenho de post é multiplicativo e de cauda longa: a comparação é em log2 da razão contra a mediana
//    (+1 = 2×, 0 = igual à mediana, -1 = metade)
//  - base pequena (menos de 10) ganha +1 nos dois lados: salvamento com mediana 0 tem meta 1, não infinito
//  - taxa com poucos eventos (3 compartilhamentos em 300 alcançados) encolhe pro prior da própria conta
//    (beta-binomial pelo método dos momentos) antes de comparar. A força do prior sai só da variação REAL entre
//    os posts: o ruído binomial de cada um (m(1-m)/n) é descontado da variância observada (30/09, revisão; sem
//    o desconto, com alcance pequeno quase tudo é ruído e a taxa de pouca gente quase não encolhia)
//  - efeito de tag encolhe pra zero quando o n é pequeno (n/(n+3)) e ganha rótulo de evidência pelo n, pelo
//    tamanho e pela consistência: uma peça só nunca vira "insight"
//  - datas de negócio no fuso de Brasília; semana ISO (segunda a domingo), rótulo AAAA-Www

export const FUSO = 'America/Sao_Paulo';
export const LIMIAR_ACIMA = Math.log2(1.5);
export const LIMIAR_ABAIXO = -Math.log2(1.5);
// abaixo disto a razão pura explode (0 contra 1 é -infinito): entra a suavização de +1
export const BASE_SUAVE = 10;
const DIA_MS = 86_400_000;

export const finito = (x) => typeof x === 'number' && Number.isFinite(x);
export const numeros = (xs) => (Array.isArray(xs) ? xs.filter(finito) : []);
const limitar = (x, min, max) => Math.min(max, Math.max(min, x));

// ---------- resumo de uma lista ----------

export function mediana(xs) {
  const v = numeros(xs).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export function media(xs) {
  const v = numeros(xs);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

// quantil com interpolação linear (q de 0 a 1)
export function quantil(xs, q) {
  const v = numeros(xs).sort((a, b) => a - b);
  if (!v.length || !finito(q)) return null;
  const pos = limitar(q, 0, 1) * (v.length - 1);
  const i = Math.floor(pos);
  return i + 1 < v.length ? v[i] + (pos - i) * (v[i + 1] - v[i]) : v[i];
}

// desvio absoluto mediano (MAD): a dispersão que um viral não distorce
export function mad(xs) {
  const med = mediana(xs);
  return med == null ? null : mediana(numeros(xs).map((x) => Math.abs(x - med)));
}

// z modificado (Iglewicz e Hoaglin): |z| > 3,5 é candidato a ponto fora da curva. MAD zero: sem régua
export function zModificado(x, xs) {
  const med = mediana(xs);
  const d = mad(xs);
  if (!finito(x) || med == null || !d) return null;
  return (0.6745 * (x - med)) / d;
}
export const ehOutlier = (x, xs, limite = 3.5) => {
  const z = zModificado(x, xs);
  return z != null && Math.abs(z) > limite;
};

// ---------- razão, meta e nível ----------

// log2 do valor contra a base. Base de 10 ou mais: razão pura; menor (ou valor zero): +1 nos dois lados
export function log2Razao(valor, base) {
  if (!finito(valor) || !finito(base) || valor < 0 || base < 0) return null;
  if (base >= BASE_SUAVE && valor > 0) return Math.log2(valor / base);
  return Math.log2((valor + 1) / (base + 1));
}

// o menor valor com log2Razao >= 1 (o "2×"): 2 × base, ou 2 × base + 1 com a base suavizada
export function meta2x(base) {
  if (!finito(base) || base < 0) return null;
  return base >= BASE_SUAVE ? 2 * base : 2 * base + 1;
}

export const razao = (valor, base) => (finito(valor) && finito(base) && base > 0 ? valor / base : null);
export const fatorDeScore = (s) => (finito(s) ? 2 ** s : null);

// acima com 1,5× ou mais; abaixo com 1/1,5 ou menos; normal no meio
export function nivelDeScore(s) {
  if (!finito(s)) return null;
  if (s >= LIMIAR_ACIMA - 1e-9) return 'acima';
  if (s <= LIMIAR_ABAIXO + 1e-9) return 'abaixo';
  return 'normal';
}

// ---------- taxas com poucos eventos ----------

// prior beta da própria conta pelo método dos momentos. pares: [{ eventos, n }] (n > 0).
// A variância das taxas observadas soma a variação real entre posts e o ruído binomial de cada taxa
// (m(1-m)/n, grande com alcance pequeno): só a parte real (v menos a média do ruído) entra na força. Sem sobra
// (tudo é ruído), a força vai pro teto. Força (alfa + beta) entre 2 e 200: pouca variação entre posts não trava
// o prior num valor só
export function priorBeta(pares, { forcaMin = 2, forcaMax = 200 } = {}) {
  const ok = (pares ?? []).filter((p) => finito(p?.eventos) && finito(p?.n) && p.n > 0 && p.eventos >= 0 && p.eventos <= p.n);
  const totalEv = ok.reduce((s, p) => s + p.eventos, 0);
  const totalN = ok.reduce((s, p) => s + p.n, 0);
  const geral = totalN > 0 ? totalEv / totalN : 0.01;
  if (ok.length < 3) {
    const m = limitar(geral, 1e-4, 1 - 1e-4);
    return { alfa: m * 10, beta: (1 - m) * 10 };
  }
  const taxas = ok.map((p) => p.eventos / p.n);
  const m = limitar(media(taxas), 1e-4, 1 - 1e-4);
  const v = taxas.reduce((s, t) => s + (t - m) ** 2, 0) / taxas.length;
  const ruido = media(ok.map((p) => (m * (1 - m)) / p.n));
  const real = v - ruido;
  const forca = limitar(real > 0 ? (m * (1 - m)) / real - 1 : forcaMax, forcaMin, forcaMax);
  return { alfa: m * forca, beta: (1 - m) * forca };
}

// média a posteriori da taxa: puxa pro prior quando n é pequeno
export function taxaEB(eventos, n, prior) {
  if (!finito(eventos) || !finito(n) || n < 0 || eventos < 0 || !prior) return null;
  return (eventos + prior.alfa) / (n + prior.alfa + prior.beta);
}

// limite inferior do intervalo de Wilson (95%): ordena proporções sem premiar amostra minúscula
export function wilsonInferior(eventos, n, z = 1.96) {
  if (!finito(eventos) || !finito(n) || n <= 0 || eventos < 0) return null;
  const p = Math.min(1, eventos / n);
  const z2 = z * z;
  const centro = p + z2 / (2 * n);
  const raio = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return Math.max(0, (centro - raio) / (1 + z2 / n));
}

// ---------- efeito de tag ----------

// forte: n >= 5, |efeito| >= 0,5 e 80% das peças do mesmo lado; moderada: n >= 3, 0,3 e 67%; fraca: n >= 2 e 0,2
export function rotuloEvidencia({ n, efeito, consistencia } = {}) {
  const e = Math.abs(finito(efeito) ? efeito : 0);
  const c = finito(consistencia) ? consistencia : 0;
  if (n >= 5 && e >= 0.5 && c >= 0.8) return 'forte';
  if (n >= 3 && e >= 0.3 && c >= 0.67) return 'moderada';
  if (n >= 2 && e >= 0.2) return 'fraca';
  return 'insuficiente';
}

// scoresCom / scoresSem: log2 contra a base de cada peça, com e sem a tag.
// efeito = n/(n+k) × (média com − média sem); sem peças "sem", compara com 0 (a própria mediana).
// consistência = fração das peças "com" do mesmo lado da média "sem" que o efeito aponta
export function efeitoTag(scoresCom, scoresSem, { k = 3 } = {}) {
  const com = numeros(scoresCom);
  const sem = numeros(scoresSem);
  const n = com.length;
  const nSem = sem.length;
  const mediaSem = nSem ? media(sem) : null;
  if (!n) return { n: 0, nSem, mediaCom: null, mediaSem, bruto: null, efeito: null, consistencia: null, evidencia: 'insuficiente' };
  const mediaCom = media(com);
  const referencia = mediaSem ?? 0;
  const bruto = mediaCom - referencia;
  const efeito = (n / (n + k)) * bruto;
  const lado = Math.sign(bruto) || 1;
  const consistencia = com.filter((s) => Math.sign(s - referencia) === lado).length / n;
  return { n, nSem, mediaCom, mediaSem, bruto, efeito, consistencia, evidencia: rotuloEvidencia({ n, efeito, consistencia }) };
}

// ---------- idade do post ----------

// valor de um campo acumulado numa idade exata (horas desde a publicação), por interpolação linear entre a
// última leitura antes e a primeira depois. Só a leitura de um lado: vale se estiver a no máximo `folga`
// horas (padrão: 25% da idade, mínimo 6h). Buraco entre as duas maior que max(48h, a idade): sem valor
export function interpolarIdade(leituras, campo, horas, { folga } = {}) {
  if (!finito(horas) || horas < 0) return null;
  const pts = (leituras ?? []).filter((l) => finito(l?.idadeH) && finito(l?.[campo])).sort((a, b) => a.idadeH - b.idadeH);
  if (!pts.length) return null;
  const tol = finito(folga) ? folga : Math.max(6, horas * 0.25);
  let antes = null;
  let depois = null;
  for (const p of pts) {
    if (p.idadeH <= horas) antes = p;
    else {
      depois = p;
      break;
    }
  }
  if (antes && antes.idadeH === horas) return antes[campo];
  if (antes && depois) {
    if (depois.idadeH - antes.idadeH > Math.max(48, horas)) return null;
    const t = (horas - antes.idadeH) / (depois.idadeH - antes.idadeH);
    return antes[campo] + t * (depois[campo] - antes[campo]);
  }
  if (antes) return horas - antes.idadeH <= tol ? antes[campo] : null;
  return depois.idadeH - horas <= tol ? depois[campo] : null;
}

// ---------- datas (Brasília) ----------

// a Graph manda "2026-09-09T15:12:25+0000"; aceita também ISO normal, Date e número (ms)
export function msDe(ts) {
  if (ts instanceof Date) return ts.getTime();
  if (finito(ts)) return ts;
  const s = String(ts ?? '').trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return inicioDoDia(s);
  const v = Date.parse(s.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return Number.isFinite(v) ? v : null;
}

const PARTES = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
});
const SEMANA_EN = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// { ano, mes, dia, hora, minuto, diaSemana (0 = domingo) } no fuso de Brasília
export function partesBrasilia(ts) {
  const ms = msDe(ts);
  if (ms == null) return null;
  const p = Object.fromEntries(PARTES.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { ano: Number(p.year), mes: Number(p.month), dia: Number(p.day), hora: Number(p.hour) % 24, minuto: Number(p.minute), diaSemana: SEMANA_EN[p.weekday] ?? null };
}

const dd = (n) => String(n).padStart(2, '0');
export function diaBrasilia(ts) {
  const p = partesBrasilia(ts);
  return p ? `${p.ano}-${dd(p.mes)}-${dd(p.dia)}` : null;
}
export const horaBrasilia = (ts) => partesBrasilia(ts)?.hora ?? null;
export const diaSemanaBrasilia = (ts) => partesBrasilia(ts)?.diaSemana ?? null;

// diferença do fuso em minutos no instante (Brasília: -180)
export function offsetMinutos(timeZone, ms) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  const comoUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour) % 24, Number(p.minute), Number(p.second));
  return Math.round((comoUtc - Math.floor(ms / 1000) * 1000) / 60_000);
}

// meia-noite de Brasília do dia AAAA-MM-DD, em ms
export function inicioDoDia(dia) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dia ?? ''));
  if (!m) return null;
  const utc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return utc - offsetMinutos(FUSO, utc + 12 * 3_600_000) * 60_000;
}

export function somarDias(dia, n) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dia ?? ''));
  if (!m) return null;
  const t = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n));
  return `${t.getUTCFullYear()}-${dd(t.getUTCMonth() + 1)}-${dd(t.getUTCDate())}`;
}

// dias corridos de a até b (AAAA-MM-DD), podendo ser negativo
export function diasEntre(a, b) {
  const x = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(a ?? ''));
  const y = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(b ?? ''));
  if (!x || !y) return null;
  return Math.round((Date.UTC(+y[1], +y[2] - 1, +y[3]) - Date.UTC(+x[1], +x[2] - 1, +x[3])) / DIA_MS);
}

// semana ISO do dia (a semana é do ano da quinta-feira dela)
export function semanaIso(dia) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dia ?? ''));
  if (!m) return null;
  const t = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3);
  const ano = t.getUTCFullYear();
  const q1 = new Date(Date.UTC(ano, 0, 4));
  q1.setUTCDate(q1.getUTCDate() - ((q1.getUTCDay() + 6) % 7) + 3);
  return `${ano}-W${dd(1 + Math.round((t - q1) / (7 * DIA_MS)))}`;
}
export const semanaDe = (ts) => semanaIso(diaBrasilia(ts));

// { inicio: segunda, fim: domingo } da semana AAAA-Www
export function intervaloSemana(semana) {
  const m = /^(\d{4})-W(\d{2})$/.exec(String(semana ?? ''));
  if (!m) return null;
  const ano = Number(m[1]);
  const w = Number(m[2]);
  const jan4 = new Date(Date.UTC(ano, 0, 4));
  const seg1 = Date.UTC(ano, 0, 4 - ((jan4.getUTCDay() + 6) % 7));
  const inicio = new Date(seg1 + (w - 1) * 7 * DIA_MS);
  const fim = new Date(inicio.getTime() + 6 * DIA_MS);
  const iso = (d) => `${d.getUTCFullYear()}-${dd(d.getUTCMonth() + 1)}-${dd(d.getUTCDate())}`;
  return { inicio: iso(inicio), fim: iso(fim) };
}
export function somarSemanas(semana, n) {
  const i = intervaloSemana(semana);
  return i ? semanaIso(somarDias(i.inicio, 7 * n)) : null;
}

// ---------- texto (pt-BR) ----------

export const SEM_DADO = 'sem dado';
export const n0 = (n) => (finito(n) ? Math.round(n).toLocaleString('pt-BR') : SEM_DADO);
export const num = (n, casas = 1) => (finito(n) ? n.toLocaleString('pt-BR', { maximumFractionDigits: casas }) : SEM_DADO);

// n na escala 0 a 100; uma casa quando não é inteiro (45,5%), nenhuma quando é (64%)
export function pct(n, { casas } = {}) {
  if (!finito(n)) return SEM_DADO;
  const c = casas ?? (n === Math.round(n) ? 0 : 1);
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: c })}%`;
}
export const pct01 = (x, opcoes) => (finito(x) ? pct(x * 100, opcoes) : SEM_DADO);

export function vezes(r) {
  if (!finito(r)) return SEM_DADO;
  const o = r >= 10 ? { maximumFractionDigits: 0 } : r >= 0.1 ? { maximumFractionDigits: 1 } : { maximumSignificantDigits: 1 };
  return `${r.toLocaleString('pt-BR', o)}×`;
}
export const vezesDeScore = (s) => vezes(fatorDeScore(s));
export const segundos = (ms) => (finito(ms) ? `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}s` : SEM_DADO);
export const reais = (v) => (finito(v) ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : SEM_DADO);
export const plural = (n, um, varios) => `${n0(n)} ${n === 1 ? um : varios}`;

// "a", "a e b", "a, b e c"
export function listaPt(itens) {
  const v = (itens ?? []).filter((x) => String(x ?? '').trim());
  if (v.length <= 1) return v[0] ?? '';
  return `${v.slice(0, -1).join(', ')} e ${v.at(-1)}`;
}

export function dataCurta(dia) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dia ?? ''));
  return m ? `${m[3]}/${m[2]}` : SEM_DADO;
}

// id de enum a partir de um texto: sem acento, minúsculo, hífen
export const slug = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
