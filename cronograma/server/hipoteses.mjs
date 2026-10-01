// Hipóteses do Diagnóstico (Métricas, 30/09/2026; SPEC-METRICAS.md §2.6, §3.4 e §3.11), em data/hipoteses.json.
// "Aplicar nesta peça" vira uma hipótese: a peça do cronograma, o insight, a ação (usar ou evitar) e a etapa em
// que o efeito deve aparecer. O veredito sai quando o post vinculado faz 7 dias (diagnostico.mjs). Decisões:
//  - cache em memória e fila de escrita (molde monitoramento.mjs); o arquivo é trabalho do time e vai pro git
//  - leitura estrita (30/09, lerJsonEstrito): só arquivo ausente ou vazio vira lista vazia. Preso por outro
//    processo ou com o JSON quebrado (um pull com conflito, por exemplo) lança 503 e não vira cache: a próxima
//    chamada tenta de novo, e nada é gravado por cima de um arquivo que não foi lido. Uma carga só por vez
//    (duas chamadas juntas no boot recebem o mesmo objeto, e a hipótese criada numa não some na outra)
//  - a peça guarda o que foi aplicado em reel.insightsAplicados ({ hipId, insightId, em, autor }) no db.json;
//    apagar a hipótese tira de lá também. Peça apagada do cronograma leva as hipóteses dela (daPecaApagada)
//  - aplicar de novo o mesmo insight na mesma peça devolve a hipótese que já existe (clique duplo não duplica)
//  - tudo que entra é conferido (ids, ação, etapa, status, texto sem travessão); ler() devolve cópia, então
//    ninguém mexe no cache sem passar por aqui
import { carregar, salvar, lerJsonEstrito, gravarJson, novoId, agora, falha, semTracos } from './db.mjs';

const ARQUIVO = 'hipoteses.json';
export const ID_HIPOTESE = /^hip_[a-z0-9]{8}$/i;
const ID_REEL = /^reel_[a-z0-9]{4,20}$/i;
const ID_MIDIA = /^\d{1,40}$/;
// ins_<dimensão>_<valor>, como gerarInsights monta (o valor pode ter hífen: fora-do-escopo, 16-30)
export const ID_INSIGHT = /^ins_[A-Za-z]{1,40}_[A-Za-z0-9_-]{1,80}$/;
const DIMENSAO = /^[A-Za-z]{1,40}$/;
const VALOR_TEXTO = /^[A-Za-z0-9_-]{1,80}$/;
export const STATUS = ['aberta', 'confirmada', 'refutada', 'inconclusiva', 'nao-aplicada'];
export const ETAPAS_PREVISAO = ['objetivo', 'gancho', 'retencao', 'distribuicao', 'qualidade', 'conversao'];
const ACOES = ['usar', 'evitar'];

let cache = null;
let carregando = null;
let fila = Promise.resolve();

const texto = (s, lim) => semTracos(String(s ?? '')).replace(/\s+/g, ' ').trim().slice(0, lim);
const numeroOuNulo = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const valorOk = (v) => typeof v === 'boolean' || (typeof v === 'string' && VALOR_TEXTO.test(v));

function vereditoOk(v) {
  if (v == null) return null;
  if (typeof v !== 'object' || Array.isArray(v)) throw falha(400, 'Veredito inválido.');
  return { em: typeof v.em === 'string' ? v.em : agora(), score: numeroOuNulo(v.score), scoreEtapa: numeroOuNulo(v.scoreEtapa), texto: texto(v.texto, 600) };
}

// forma garantida de uma hipótese lida do arquivo (editado à mão ou de versão velha): a torta sai
function daLeitura(h) {
  if (!h || typeof h !== 'object' || !ID_HIPOTESE.test(String(h.id ?? '')) || !ID_REEL.test(String(h.reelId ?? ''))) return null;
  if (!ID_INSIGHT.test(String(h.insightId ?? '')) || !DIMENSAO.test(String(h.dimensao ?? '')) || !valorOk(h.valor)) return null;
  let veredito = null;
  try {
    veredito = vereditoOk(h.veredito);
  } catch {
    veredito = null;
  }
  return {
    id: h.id, criadaEm: typeof h.criadaEm === 'string' ? h.criadaEm : null, autor: typeof h.autor === 'string' ? h.autor : null,
    reelId: h.reelId, insightId: h.insightId, dimensao: h.dimensao, valor: h.valor, acao: ACOES.includes(h.acao) ? h.acao : 'usar',
    texto: texto(h.texto, 500), previsao: { etapa: ETAPAS_PREVISAO.includes(h.previsao?.etapa) ? h.previsao.etapa : 'objetivo' },
    midiaId: ID_MIDIA.test(String(h.midiaId ?? '')) ? String(h.midiaId) : null,
    status: STATUS.includes(h.status) ? h.status : 'aberta', veredito,
  };
}

// o arquivo com a forma garantida. Falha de leitura (503) sobe sem virar cache: tenta de novo na próxima chamada
function arquivo() {
  if (cache) return Promise.resolve(cache);
  carregando ??= lerJsonEstrito(ARQUIVO, null)
    .then((bruto) => {
      const lista = Array.isArray(bruto?.hipoteses) ? bruto.hipoteses : [];
      cache = { versao: 1, hipoteses: lista.map(daLeitura).filter(Boolean) };
      return cache;
    })
    .finally(() => {
      carregando = null;
    });
  return carregando;
}

function gravar() {
  const proxima = fila.then(() => gravarJson(ARQUIVO, cache));
  fila = proxima.catch((e) => console.error('Falha ao gravar hipoteses.json:', e.message));
  return proxima;
}

// o arquivo inteiro, { versao: 1, hipoteses: [...] } (cópia)
export async function ler() {
  return structuredClone(await arquivo());
}

// dados = { reelId, insightId, dimensao, valor, acao, texto, previsao: { etapa }, midiaId }; autor vem do servidor
export async function criar(dados = {}, autor = null) {
  const reelId = String(dados.reelId ?? '');
  const insightId = String(dados.insightId ?? '');
  if (!ID_REEL.test(reelId)) throw falha(400, 'Peça inválida.');
  if (!ID_INSIGHT.test(insightId)) throw falha(400, 'Recomendação inválida.');
  if (!DIMENSAO.test(String(dados.dimensao ?? ''))) throw falha(400, 'Dimensão inválida.');
  if (!valorOk(dados.valor)) throw falha(400, 'Valor inválido.');
  if (!ACOES.includes(dados.acao)) throw falha(400, 'A ação precisa ser usar ou evitar.');
  const etapa = dados.previsao?.etapa ?? 'objetivo';
  if (!ETAPAS_PREVISAO.includes(etapa)) throw falha(400, 'Etapa da previsão inválida.');
  const midiaId = dados.midiaId == null || dados.midiaId === '' ? null : String(dados.midiaId);
  if (midiaId && !ID_MIDIA.test(midiaId)) throw falha(400, 'Mídia inválida.');
  const db = await carregar();
  const reel = db.reels.find((r) => r.id === reelId);
  if (!reel) throw falha(404, 'Essa peça não existe mais.');
  const h = await arquivo();
  const existente = h.hipoteses.find((x) => x.reelId === reelId && x.insightId === insightId);
  if (existente) return structuredClone(existente);
  const em = agora();
  const hip = {
    id: novoId('hip'), criadaEm: em, autor: typeof autor === 'string' ? autor : null, reelId, insightId,
    dimensao: dados.dimensao, valor: dados.valor, acao: dados.acao, texto: texto(dados.texto, 500), previsao: { etapa },
    midiaId, status: 'aberta', veredito: null,
  };
  h.hipoteses.push(hip);
  reel.insightsAplicados = [...(Array.isArray(reel.insightsAplicados) ? reel.insightsAplicados : []), { hipId: hip.id, insightId, em, autor: hip.autor }];
  await Promise.all([gravar(), salvar()]);
  return structuredClone(hip);
}

// tira do arquivo e do reel.insightsAplicados da peça. Não existe: 404
export async function apagar(id) {
  if (!ID_HIPOTESE.test(String(id ?? ''))) throw falha(400, 'Hipótese inválida.');
  const h = await arquivo();
  const i = h.hipoteses.findIndex((x) => x.id === id);
  if (i < 0) throw falha(404, 'Essa hipótese não existe mais.');
  const [hip] = h.hipoteses.splice(i, 1);
  const escritas = [gravar()];
  const reel = (await carregar()).reels.find((r) => r.id === hip.reelId);
  if (Array.isArray(reel?.insightsAplicados)) {
    const resto = reel.insightsAplicados.filter((x) => x?.hipId !== hip.id);
    if (resto.length !== reel.insightsAplicados.length) {
      reel.insightsAplicados = resto;
      escritas.push(salvar());
    }
  }
  await Promise.all(escritas);
  return { ok: true };
}

// patch = { status?, veredito?, midiaId? } (o veredito do diagnóstico). Não existe: null
export async function atualizar(id, patch = {}) {
  const h = await arquivo();
  const hip = h.hipoteses.find((x) => x.id === id);
  if (!hip) return null;
  if ('status' in patch) {
    if (!STATUS.includes(patch.status)) throw falha(400, 'Status inválido.');
    hip.status = patch.status;
  }
  if ('veredito' in patch) hip.veredito = vereditoOk(patch.veredito);
  if ('midiaId' in patch) {
    const m = patch.midiaId == null || patch.midiaId === '' ? null : String(patch.midiaId);
    if (m && !ID_MIDIA.test(m)) throw falha(400, 'Mídia inválida.');
    hip.midiaId = m;
  }
  await gravar();
  return structuredClone(hip);
}

// peça apagada do cronograma: as hipóteses dela saem do arquivo (sem a peça, a aberta nunca fecharia, apareceria
// sem título e contaria "em teste" em todo semanal). O reel.insightsAplicados sumiu junto com a peça, então o
// db.json não muda. Devolve quantas saíram
export async function daPecaApagada(reelId) {
  const id = String(reelId ?? '');
  if (!ID_REEL.test(id)) return 0;
  const h = await arquivo();
  const antes = h.hipoteses.length;
  h.hipoteses = h.hipoteses.filter((x) => x.reelId !== id);
  const sairam = antes - h.hipoteses.length;
  if (sairam) await gravar();
  return sairam;
}

// as hipóteses de uma peça, a mais nova primeiro (cópia)
export async function daPeca(reelId) {
  const id = String(reelId ?? '');
  if (!ID_REEL.test(id)) return [];
  return structuredClone((await arquivo()).hipoteses.filter((x) => x.reelId === id)).sort((a, b) => String(b.criadaEm).localeCompare(String(a.criadaEm)));
}
