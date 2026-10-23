// Números dos stories (SPEC-METRICAS.md §2.5 e §3.7). O insight do story só existe enquanto ele está no ar
// (24h), então a agenda captura de hora em hora e a gente guarda. Guardado em data/stories-metricas.json
// (lerJsonEstrito/gravarJson com fila de escrita, molde monitoramento.mjs): é registro nosso, não cache (a Meta
// apaga o insight do story em 24h), e vai pro git. Arquivo ilegível não vira vazio: a leitura falha (503), nada
// fica em cache e nada é gravado por cima. Decisões:
//  - uma leitura por captura; "ultima" junta a mais nova campo a campo com a anterior (o story some da API
//    depois de 24h e ela fica como o número final: métrica que falhou nesta hora não apaga a da hora anterior).
//    Captura sem número nenhum não entra e conta como erro, não como lida
//  - erro #10 da Meta num story = menos de 5 pessoas viram: a métrica fica 'menos-de-5' (nem número nem zero)
//  - as métricas vão numa chamada; a que a Meta recusar pelo nome sai (7 dias sem pedir de novo, em
//    "suporte") e o resto é pedido de novo; erro 100 que não diz qual: uma por uma, e só é recusada a métrica
//    cujo erro fala dela (erroDoStory, no motor). Story que sumiu (100 com subcódigo 33) e erro passageiro são
//    erro daquele story: nada vai pra "suporte". link_clicks é opcional: se a Meta não tiver, fica sem dado
//  - navegação pela quebra story_navigation_action_type: TAP_FORWARD avançou, TAP_BACK voltou, TAP_EXIT
//    saiu, SWIPE_FORWARD passou pro próximo
//  - o resumo junta por dia de Brasília com os stories do cronograma (db.stories: objetivo e pilar do dia).
//    Alcance não soma entre stories (a mesma pessoa vê vários): o do dia é o maior deles
import { carregar, salvar, lerJsonEstrito, gravarJson, falha, agora } from './db.mjs';
import * as instagram from './instagram.mjs';
import { finito, diaBrasilia, msDe, somarDias, dataCurta, n0, plural, listaPt } from './estatistica.mjs';
import { parseBreakdown, totaisDe, erroDoStory, leituraStoryVazia, juntarLeituraStory, MENOS_DE_5 } from './publico-motor.mjs';

const ARQUIVO = 'stories-metricas.json';
const METRICAS = ['views', 'reach', 'replies', 'shares', 'follows', 'profile_visits', 'total_interactions', 'link_clicks'];
const CAMPO = {
  views: 'views', reach: 'reach', replies: 'replies', shares: 'shares', follows: 'follows', profile_visits: 'profileVisits',
  total_interactions: 'interacoes', link_clicks: 'linkClicks',
};
const NAVEGACAO = { TAP_FORWARD: 'avancou', TAP_BACK: 'voltou', TAP_EXIT: 'saiu', SWIPE_FORWARD: 'proximo' };
const POUCOS = MENOS_DE_5;
const MAX_LEITURAS = 30;
const MAX_STORIES = 1000;
const RECUSA_MS = 7 * 86_400_000;
const ID_OK = /^\d{1,40}$/;
const DIA_OK = /^\d{4}-\d{2}-\d{2}$/;

const lista = (v) => (Array.isArray(v) ? v : []);
const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);
const somaNum = (xs) => {
  const v = xs.filter(finito);
  return v.length ? v.reduce((a, b) => a + b, 0) : null;
};
const maxNum = (xs) => {
  const v = xs.filter(finito);
  return v.length ? Math.max(...v) : null;
};

// ---------- arquivo ----------

const vazio = () => ({ versao: 1, capturadoEm: null, suporte: {}, stories: {} });
let cache = null;
let carregando = null;
let fila = Promise.resolve();

// o arquivo com a forma garantida (cache em memória). Ausente ou vazio vira o vazio; ilegível (JSON quebrado,
// arquivo preso) lança 503 e não fica em cache: a próxima chamada tenta de novo e nada grava por cima
export async function ler() {
  if (cache) return cache;
  carregando ??= (async () => {
    const b = objeto(await lerJsonEstrito(ARQUIVO, null)) ?? {};
    const stories = {};
    for (const [id, s] of Object.entries(objeto(b.stories) ?? {})) {
      if (!ID_OK.test(id) || !objeto(s)) continue;
      stories[id] = { ...s, ultima: objeto(s.ultima), leituras: lista(s.leituras).filter(objeto) };
    }
    cache = { ...vazio(), ...b, versao: 1, suporte: objeto(b.suporte) ?? {}, stories };
    return cache;
  })().catch((e) => {
    carregando = null;
    throw e;
  });
  return carregando;
}

// grava o que está em memória; sem arquivo lido (cache vazio), não grava nada
function gravar() {
  const proxima = fila.then(() => (cache ? gravarJson(ARQUIVO, cache) : undefined));
  fila = proxima.catch((e) => console.error('Falha ao gravar stories-metricas.json:', e.message));
  return proxima;
}

// ---------- captura ----------

function api() {
  if (typeof instagram.chamar !== 'function') throw falha(503, 'Este servidor ainda não tem a leitura da Meta pra Métricas. Reinicie depois de atualizar o app.');
  return instagram.chamar;
}

async function estaConectado() {
  if (typeof instagram.conectado === 'function') return Boolean(await instagram.conectado());
  return Boolean((await instagram.status())?.conectado);
}

// "{ig}" no começo do caminho: o chamar() troca pelo id da conta conectada
const IG = '{ig}';

// limite de uso: os códigos que o instagram.mjs conhece, o 429 e o limite por caso de uso (80000 a 80014)
const limite = (e) => instagram.ehLimite(e) || e?.meta?.code === 429 || (e?.meta?.code >= 80000 && e?.meta?.code <= 80014);
const fatal = (e) => instagram.ehTokenRuim(e) || limite(e);
const TODOS_POUCOS = () => ({ avancou: POUCOS, voltou: POUCOS, saiu: POUCOS, proximo: POUCOS });

function recusadasDe(s) {
  const agoraMs = Date.now();
  return new Set(
    Object.entries(s.suporte)
      .filter(([k, v]) => k.startsWith('metrica:') && v?.ok === false && agoraMs - Date.parse(v.em) < RECUSA_MS)
      .map(([k]) => k.slice('metrica:'.length))
  );
}

function recusar(estado, metricas) {
  for (const m of metricas) {
    estado.recusadas.add(m);
    estado.novas.add(m);
  }
}

const VARIANTES_NAVEGACAO = [{}, { metric_type: 'total_value' }];

async function lerNavegacao(chamar, id, estado) {
  const vazia = { avancou: null, voltou: null, saiu: null, proximo: null };
  if (estado.recusadas.has('navigation')) return vazia;
  let recusas = 0;
  for (const extra of VARIANTES_NAVEGACAO) {
    try {
      const r = await chamar(`${id}/insights`, { metric: 'navigation', breakdown: 'story_navigation_action_type', ...extra });
      const nav = { ...vazia };
      for (const i of parseBreakdown(r)) {
        const k = NAVEGACAO[i.navegacao];
        if (k) nav[k] = (nav[k] ?? 0) + i.valor;
      }
      return nav;
    } catch (e) {
      if (fatal(e)) throw e;
      const x = erroDoStory(e, ['navigation']);
      if (x.tipo === 'menos-de-5') return TODOS_POUCOS();
      // story que sumiu ou erro passageiro: sem dado nesta hora, sem recusa
      if (x.tipo === 'sumiu' || x.tipo === 'outro') return vazia;
      if (x.tipo === 'recusa') recusas++;
    }
  }
  // as duas formas recusadas pela Meta falando da métrica (ou do jeito de pedir): 7 dias sem pedir
  if (recusas === VARIANTES_NAVEGACAO.length) recusar(estado, ['navigation']);
  return vazia;
}

// uma leitura do story: número, null (sem dado) ou 'menos-de-5' em cada métrica. Lança (erro deste story,
// nada vai pra "suporte") quando o story sumiu ou a chamada conjunta falhou por outro motivo que não a métrica
async function lerStory(chamar, id, estado) {
  const leitura = Object.fromEntries(Object.values(CAMPO).map((c) => [c, null]));
  let pedir = METRICAS.filter((m) => !estado.recusadas.has(m));
  let umaPorUma = false;
  for (let i = 0; i < METRICAS.length && pedir.length; i++) {
    try {
      const tot = totaisDe(await chamar(`${id}/insights`, { metric: pedir.join(',') }));
      for (const m of pedir) leitura[CAMPO[m]] = finito(tot[m]) ? tot[m] : null;
      pedir = [];
    } catch (e) {
      if (fatal(e)) throw e;
      const x = erroDoStory(e, pedir);
      if (x.tipo === 'menos-de-5') {
        for (const m of pedir) leitura[CAMPO[m]] = POUCOS;
        return { ...leitura, navegacao: TODOS_POUCOS() };
      }
      if (x.tipo === 'sumiu' || x.tipo === 'outro') throw e;
      if (x.tipo === 'recusa' && x.fora.length) {
        recusar(estado, x.fora);
        pedir = pedir.filter((m) => !x.fora.includes(m));
        continue;
      }
      // erro 100 que não diz qual métrica: uma por uma, e só sai a que a Meta recusar falando dela
      umaPorUma = true;
      break;
    }
  }
  if (umaPorUma) {
    for (const m of pedir) {
      try {
        const tot = totaisDe(await chamar(`${id}/insights`, { metric: m }));
        leitura[CAMPO[m]] = finito(tot[m]) ? tot[m] : null;
      } catch (e) {
        if (fatal(e)) throw e;
        const x = erroDoStory(e, [m]);
        if (x.tipo === 'sumiu') throw e;
        if (x.tipo === 'menos-de-5') leitura[CAMPO[m]] = POUCOS;
        else if (x.tipo === 'recusa') recusar(estado, [m]);
        // sem-nome ou outro: essa métrica fica sem dado nesta hora
      }
    }
  }
  return { ...leitura, navegacao: await lerNavegacao(chamar, id, estado) };
}

// leitura null: só atualiza os dados do story (a leitura desta hora falhou). A "ultima" junta a nova campo a
// campo com a anterior (juntarLeituraStory); o histórico guarda a leitura como veio
function guardar(s, m, leitura) {
  const ms = msDe(m.timestamp);
  const velho = objeto(s.stories[m.id]) ?? {};
  const https = (u) => (typeof u === 'string' && /^https:\/\//i.test(u) ? u : null);
  const item = {
    publicadoEm: ms != null ? new Date(ms).toISOString() : velho.publicadoEm ?? null,
    dia: ms != null ? diaBrasilia(ms) : velho.dia ?? null,
    tipo: ['IMAGE', 'VIDEO'].includes(m.media_type) ? m.media_type : velho.tipo ?? null,
    permalink: typeof m.permalink === 'string' ? m.permalink : velho.permalink ?? '',
    thumb: https(m.thumbnail_url) ?? (m.media_type === 'IMAGE' ? https(m.media_url) : null) ?? velho.thumb ?? '',
    ultima: velho.ultima ?? null,
    leituras: lista(velho.leituras),
  };
  if (leitura) {
    const l = { em: agora(), idadeH: ms != null ? Math.round(((Date.now() - ms) / 3_600_000) * 10) / 10 : null, ...leitura };
    item.ultima = juntarLeituraStory(item.ultima, l);
    item.leituras = [...item.leituras, l].slice(-MAX_LEITURAS);
  }
  s.stories[m.id] = item;
}

function podar(s) {
  const ids = Object.keys(s.stories);
  if (ids.length <= MAX_STORIES) return;
  const velhos = ids.sort((a, b) => String(s.stories[a].publicadoEm).localeCompare(String(s.stories[b].publicadoEm))).slice(0, ids.length - MAX_STORIES);
  for (const id of velhos) delete s.stories[id];
}

let emCurso = null;

// GET {ig}/stories (só os que estão no ar) + os insights de cada um
export async function capturar() {
  emCurso ??= executar().finally(() => {
    emCurso = null;
  });
  return emCurso;
}

async function executar() {
  const chamar = api();
  if (!(await estaConectado())) throw falha(400, 'Conecte o Instagram (Métricas) antes de capturar os stories.');
  const s = await ler();
  const r = await chamar(`${IG}/stories`, { fields: 'id,media_type,media_product_type,timestamp,permalink,thumbnail_url,media_url', limit: '100' });
  const noAr = lista(r?.data).filter((x) => ID_OK.test(String(x?.id ?? '')));
  const estado = { recusadas: recusadasDe(s), novas: new Set(), limitado: null, lidos: 0, erros: 0 };
  try {
    await instagram.emLotes(noAr, 3, async (m) => {
      if (estado.limitado) return;
      let leitura = null;
      try {
        leitura = await lerStory(chamar, m.id, estado);
        // sem número nenhum (tudo falhou nesta hora): não troca a "ultima" e conta como erro, não como lida
        if (leituraStoryVazia(leitura)) {
          leitura = null;
          estado.erros++;
        } else estado.lidos++;
      } catch (e) {
        if (instagram.ehTokenRuim(e)) throw e;
        if (limite(e)) estado.limitado ??= e.message;
        else estado.erros++;
      }
      guardar(s, m, leitura);
    });
  } finally {
    const em = agora();
    for (const m of estado.novas) s.suporte[`metrica:${m}`] = { ok: false, em };
    s.capturadoEm = em;
    podar(s);
    await gravar();
  }
  return { noAr: noAr.length, lidos: estado.lidos, erros: estado.erros, limitado: estado.limitado };
}

// 21/10 (Pedro): dia de stories do cronograma que teve story no ar vira "publicado" (Postado na tela) sozinho.
// Só sobe o status (ideia ou pronto viram publicado), nunca desce. Roda depois da captura de hora em hora e no boot
export async function marcarDiasPostados() {
  const s = await ler();
  const dias = new Set(Object.values(s.stories ?? {}).map((x) => String(x?.dia ?? '')).filter((d) => DIA_OK.test(d)));
  if (!dias.size) return 0;
  const db = await carregar();
  let n = 0;
  for (const st of db.stories ?? []) {
    // 23/10 (Pedro: "marquei o story como não postado, ele continua verde"): o desmarcado por alguém fica desmarcado
    if (!dias.has(st.data) || st.status === 'publicado' || st.postadoDesmarcado) continue;
    Object.assign(st, { status: 'publicado', atualizadoEm: agora(), atualizadoPor: 'agenda' });
    n++;
  }
  if (n) await salvar();
  return n;
}

// ---------- resumo ----------

// { dias: [ { dia, n, views, alcanceMax, saidas, respostas, cliques, objetivo, pilar, pilarNome, menosDe5 } ], total }.
// Aceita resumoStories(14) ou resumoStories({ dias, inicio, fim }) (inicio e fim em AAAA-MM-DD: o semanal usa a
// semana). Dia sem story capturado entra com n 0 e números sem dado
export async function resumoStories(opcoes = {}) {
  const o = typeof opcoes === 'number' ? { dias: opcoes } : objeto(opcoes) ?? {};
  const dias = Number.isInteger(o.dias) && o.dias > 0 ? Math.min(o.dias, 400) : 14;
  const hoje = diaBrasilia(Date.now());
  const fim = DIA_OK.test(String(o.fim ?? '')) ? o.fim : hoje;
  const inicio = DIA_OK.test(String(o.inicio ?? '')) ? o.inicio : somarDias(fim, -(dias - 1));
  const s = await ler();
  const db = await carregar();
  const cronograma = new Map(lista(db.stories).filter((x) => DIA_OK.test(String(x?.data ?? ''))).map((x) => [x.data, x]));
  const pilares = new Map(lista(db.pilares).map((p) => [Number(p.id), p.nome]));
  const porDia = new Map();
  for (const st of Object.values(s.stories)) {
    if (!DIA_OK.test(String(st?.dia ?? '')) || st.dia < inicio || st.dia > fim) continue;
    if (!porDia.has(st.dia)) porDia.set(st.dia, []);
    porDia.get(st.dia).push(st);
  }
  const linhas = [];
  for (let d = inicio, i = 0; d && d <= fim && i < 400; d = somarDias(d, 1), i++) {
    const sts = porDia.get(d) ?? [];
    const u = sts.map((x) => x.ultima).filter(objeto);
    const plan = cronograma.get(d);
    linhas.push({
      dia: d,
      n: sts.length,
      views: somaNum(u.map((l) => l.views)),
      alcanceMax: maxNum(u.map((l) => l.reach)),
      saidas: somaNum(u.map((l) => l.navegacao?.saiu)),
      respostas: somaNum(u.map((l) => l.replies)),
      cliques: somaNum(u.map((l) => l.linkClicks)),
      menosDe5: u.filter((l) => l.views === POUCOS).length,
      objetivo: plan?.objetivo ?? null,
      pilar: plan?.pilar ?? null,
      pilarNome: plan ? pilares.get(Number(plan.pilar)) ?? null : null,
    });
  }
  const total = {
    dias: linhas.filter((l) => l.n).length,
    n: linhas.reduce((a, l) => a + l.n, 0),
    views: somaNum(linhas.map((l) => l.views)),
    saidas: somaNum(linhas.map((l) => l.saidas)),
    respostas: somaNum(linhas.map((l) => l.respostas)),
    cliques: somaNum(linhas.map((l) => l.cliques)),
  };
  const periodo = o.inicio || o.fim ? `De ${dataCurta(inicio)} a ${dataCurta(fim)}` : `Nos últimos ${dias} dias`;
  if (!total.n) total.frase = `${periodo}, nenhum story capturado (a leitura só pega o story enquanto ele está no ar).`;
  else {
    const partes = [
      finito(total.views) ? `${n0(total.views)} visualizações somadas` : 'visualizações sem dado',
      finito(total.saidas) ? `${plural(total.saidas, 'saída', 'saídas')}` : null,
      finito(total.respostas) ? `${plural(total.respostas, 'resposta', 'respostas')}` : null,
      finito(total.cliques) ? `${plural(total.cliques, 'clique no link', 'cliques no link')}` : null,
    ].filter(Boolean);
    total.frase = `${periodo}, ${plural(total.n, 'story', 'stories')} em ${plural(total.dias, 'dia', 'dias')}: ${listaPt(partes)}.`;
  }
  return { inicio, fim, dias: linhas, total, capturadoEm: s.capturadoEm };
}
