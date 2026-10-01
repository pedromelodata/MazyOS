// Rotas de /api/metricas (SPEC-METRICAS.md §4): Diagnóstico, Público, Anúncios, Stories, Semanal e Agenda, com o
// mesmo login das outras rotas (server.mjs só despacha). Decisões:
//  - a tabela de rotas é dado (ROTAS) e a resolução é pura (resolverRota): caminho que não existe dá 404, método
//    errado 405 e id torto 400, antes de ler o corpo ou tocar qualquer módulo
//  - ids do endereço e do corpo conferidos aqui: midiaId /^\d{1,40}$/ e reelId /^reel_[a-z0-9]{4,20}$/i (os do
//    mecanismos-codebook.mjs, puro), semana AAAA-Www que existe no calendário ISO, hipótese hip_..., tarefa da
//    lista da agenda (outra dá 404). Post e peça que não existem dão 404 antes de qualquer escrita
//  - corpo de até 1 MB. No print do público do post (C7, 30/09): até 3 imagens, cada uma de até 4 MB e as data URLs
//    juntas até 12 MB (12 × 1.024 × 1.024, a mesma conta das telas), mais 64 KB de folga pro JSON. Antes o corpo
//    parava em 12.000.000 bytes, abaixo do que a tela deixava mandar, e a resposta era "Corpo grande demais."; o
//    413 agora diz o que fazer
//  - toda escrita zera o cache do diagnóstico (invalidar) ANTES de montar a resposta: a tela volta com o número
//    novo. server.mjs chama invalidarDiagnostico() depois do "Sincronizar agora"
//  - GET /diagnostico junta a agenda e os stories de 14 dias (o diagnóstico não importa a agenda, §3.11); falha
//    num dos dois vira null com log e não derruba a aba
//  - os módulos entram por import() na primeira chamada: este arquivo carrega só módulos puros (o teste da
//    resolução não toca disco) e módulo com defeito derruba só as rotas dele, não o servidor
//  - o token de anúncios só passa pro anuncios.mjs: nunca volta na resposta nem vai pro log
import { semanaIso, diaBrasilia } from './estatistica.mjs';
import { MIDIA_ID as ID_MIDIA, REEL_ID as ID_REEL } from './mecanismos-codebook.mjs';
import { semanaValida } from './relatorio-motor.mjs';
import * as agenda from './agenda.mjs';

const ID_HIPOTESE = /^hip_[a-z0-9]{4,32}$/i;
const ID_INSIGHT = /^[\w.:-]{1,160}$/;
const ID_DIMENSAO = /^[a-z][a-z0-9]{0,39}$/i;
const CONTA_ANUNCIOS = /^(?:act_)?(\d{1,40})$/;
const IMAGEM = /^data:image\/(?:png|jpe?g|webp);base64,/i;
const MAX_IMAGENS = 3;
const MAX_IMAGEM_BYTES = 4 * 1024 * 1024;
const MAX_PRINTS_JUNTOS = 12 * 1024 * 1024;
export const LIMITE_PRINT = MAX_PRINTS_JUNTOS + 64 * 1024;
export const MSG_PRINT_GRANDE = 'As imagens juntas passam de 12 MB: mande menos prints ou prints menores.';
const MAX_LOTE = 200;
const CAMPOS_NUMEROS = ['follows', 'profileVisits', 'bioLinkClicks', 'cadastros'];
const NOME_NUMERO = { follows: 'Seguidores', profileVisits: 'Visitas ao perfil', bioLinkClicks: 'Cliques no link', cadastros: 'Cadastros' };

// erro com status no formato que o servidor devolve ({ erro }), igual ao falha() de db.mjs: aqui sem importar
// o db, pra resolução e a leitura do corpo continuarem puras
const erroHttp = (status, mensagem) => Object.assign(new Error(mensagem), { status });

// ---------- a tabela ----------

const ROTAS = [
  ['diagnostico', { GET: 'diagnostico' }],
  ['post/:midia', { GET: 'post' }],
  ['post/:midia/vinculo', { PUT: 'vinculo' }],
  ['post/:midia/tag', { PUT: 'tag' }],
  ['post/:midia/numeros', { PUT: 'numeros' }],
  ['post/:midia/impulsionado', { PUT: 'impulsionado' }],
  ['post/:midia/etiquetar', { POST: 'etiquetar' }],
  ['etiquetar-lote', { POST: 'etiquetarLote' }],
  ['etiquetar', { GET: 'etiquetarEstado' }],
  ['codebook', { GET: 'codebook' }],
  ['recomendacoes/:reel', { GET: 'recomendacoes' }],
  ['hipoteses', { POST: 'criarHipotese' }],
  ['hipoteses/:hipotese', { DELETE: 'apagarHipotese' }],
  ['publico', { GET: 'publico' }],
  ['publico/atualizar', { POST: 'publicoAtualizar' }],
  ['publico/post/:midia', { PUT: 'publicoPost', DELETE: 'publicoPostApagar' }],
  ['publico/post/:midia/print', { POST: 'printIniciar', GET: 'printEstado' }],
  ['anuncios', { GET: 'anuncios' }],
  ['anuncios/token', { POST: 'anunciosToken' }],
  ['anuncios/conta', { PUT: 'anunciosConta' }],
  ['anuncios/atualizar', { POST: 'anunciosAtualizar' }],
  ['stories', { GET: 'stories' }],
  ['semanal', { GET: 'semanal' }],
  ['semanal/gerar', { POST: 'semanalGerar' }],
  ['semanal/leitura', { POST: 'leituraIniciar', GET: 'leituraEstado' }],
  ['agenda', { GET: 'agenda' }],
  ['agenda/:tarefa', { POST: 'agendaRodar' }],
].map(([molde, metodos]) => ({ segmentos: molde.split('/'), metodos }));

function conferirParametros(params) {
  if ('midia' in params && !ID_MIDIA.test(params.midia)) return { status: 400, erro: 'Post inválido.' };
  if ('reel' in params && !ID_REEL.test(params.reel)) return { status: 400, erro: 'Peça inválida.' };
  if ('hipotese' in params && !ID_HIPOTESE.test(params.hipotese)) return { status: 400, erro: 'Hipótese inválida.' };
  if ('tarefa' in params && !agenda.TAREFAS.includes(params.tarefa)) return { status: 404, erro: 'Essa tarefa não existe na agenda.' };
  return null;
}

// partes = o caminho depois de /api/metricas, já decodificado. { acao, params } ou { status, erro }
export function resolverRota(metodo, partes) {
  const ps = Array.isArray(partes) ? partes.map((p) => String(p)) : [];
  for (const { segmentos, metodos } of ROTAS) {
    if (segmentos.length !== ps.length) continue;
    const params = {};
    const casa = segmentos.every((s, i) => {
      if (s.startsWith(':')) {
        params[s.slice(1)] = ps[i];
        return true;
      }
      return s === ps[i];
    });
    if (!casa) continue;
    if (!Object.hasOwn(metodos, metodo)) return { status: 405, erro: 'Método não permitido.' };
    return conferirParametros(params) ?? { acao: metodos[metodo], params };
  }
  return { status: 404, erro: 'Rota não existe.' };
}

// ---------- leitura do corpo e da query (puras) ----------

// { reelId }: null (ou vazio) solta o vínculo
export function lerReelDoCorpo(b) {
  if (!b || !Object.hasOwn(b, 'reelId')) throw erroHttp(400, 'Mande reelId (ou null pra soltar o vínculo).');
  const v = b.reelId;
  if (v === null || v === '') return null;
  if (typeof v !== 'string' || !ID_REEL.test(v)) throw erroHttp(400, 'Peça inválida.');
  return v;
}

// { dimensao, valor }: null (ou vazio) apaga a tag manual. O valor é conferido no codebook pelo mecanismos.mjs
export function lerTag(b) {
  const dimensao = b?.dimensao;
  if (typeof dimensao !== 'string' || !ID_DIMENSAO.test(dimensao)) throw erroHttp(400, 'Dimensão inválida.');
  if (!Object.hasOwn(b, 'valor')) throw erroHttp(400, 'Mande o valor (ou null pra apagar o manual).');
  const v = b.valor;
  if (v === null || v === '' || typeof v === 'boolean') return { dimensao, valor: v === '' ? null : v };
  // pilar vem como número na tela; no codebook o id é texto
  if (typeof v === 'number' && Number.isFinite(v)) return { dimensao, valor: String(v) };
  if (typeof v === 'string' && v.trim() && v.length <= 120) return { dimensao, valor: v.trim() };
  throw erroHttp(400, 'Valor inválido pra essa dimensão.');
}

// { follows, profileVisits, bioLinkClicks, cadastros }: inteiro de 0 pra cima ("1.234" também), null apaga.
// Só as chaves que vieram
export function lerNumeros(b) {
  const saida = {};
  for (const k of CAMPOS_NUMEROS) {
    if (!b || !Object.hasOwn(b, k)) continue;
    const v = b[k];
    if (v === null || v === '') {
      saida[k] = null;
      continue;
    }
    const t = typeof v === 'string' ? v.trim() : '';
    const n = typeof v === 'number' ? v : /^\d{1,3}(?:\.\d{3})+$|^\d+$/.test(t) ? Number(t.replace(/\./g, '')) : NaN;
    if (!Number.isInteger(n) || n < 0 || n > 1e9) throw erroHttp(400, `${NOME_NUMERO[k]}: precisa ser um número inteiro de 0 pra cima.`);
    saida[k] = n;
  }
  if (!Object.keys(saida).length) throw erroHttp(400, 'Mande pelo menos um número: seguidores, visitas ao perfil, cliques no link ou cadastros.');
  return saida;
}

// { valor: true | false | null } (null = automático)
export function lerImpulsionado(b) {
  if (!b || !Object.hasOwn(b, 'valor') || ![true, false, null].includes(b.valor)) throw erroHttp(400, 'Teve anúncio: mande true, false ou null.');
  return b.valor;
}

// { midiaIds? }: ausente ou null = todos os posts sem etiqueta da IA
export function lerMidiaIds(b) {
  const v = b?.midiaIds;
  if (v === undefined || v === null) return null;
  if (!Array.isArray(v) || !v.length || v.length > MAX_LOTE) throw erroHttp(400, `midiaIds precisa ser uma lista de 1 a ${MAX_LOTE} posts.`);
  const ids = [...new Set(v.map((x) => (typeof x === 'string' || typeof x === 'number' ? String(x) : '')))];
  if (ids.some((x) => !ID_MIDIA.test(x))) throw erroHttp(400, 'Tem post inválido na lista.');
  return ids;
}

// { reelId, insightId }: o diagnóstico confere se o insight está nas recomendações da peça
export function lerHipotese(b) {
  if (typeof b?.reelId !== 'string' || !ID_REEL.test(b.reelId)) throw erroHttp(400, 'Peça inválida.');
  if (typeof b.insightId !== 'string' || !ID_INSIGHT.test(b.insightId)) throw erroHttp(400, 'Recomendação inválida.');
  return { reelId: b.reelId, insightId: b.insightId };
}

// { contaId }: "act_123" ou "123" viram "act_123"
export function lerConta(b) {
  const v = b?.contaId;
  const m = typeof v === 'string' || typeof v === 'number' ? CONTA_ANUNCIOS.exec(String(v).trim()) : null;
  if (!m) throw erroHttp(400, 'Conta de anúncios inválida.');
  return `act_${m[1]}`;
}

// { token }: o formato fino fica com o anuncios.mjs; aqui só o básico (e o token nunca volta em mensagem)
export function lerToken(b) {
  const t = typeof b?.token === 'string' ? b.token.trim() : '';
  if (!t) throw erroHttp(400, 'Cole o token do usuário do sistema.');
  if (t.length > 4096) throw erroHttp(400, 'Esse texto não parece um token da Meta.');
  return t;
}

// { imagens: [dataURL] }: de 1 a 3, png, jpg ou webp, até 4 MB cada e 12 MB juntas (em data URL, como a tela conta)
export function lerImagens(b) {
  const v = b?.imagens;
  if (!Array.isArray(v) || !v.length || v.length > MAX_IMAGENS) throw erroHttp(400, 'Mande de 1 a 3 imagens do print (png, jpg ou webp).');
  for (const s of v) {
    if (typeof s !== 'string' || !IMAGEM.test(s)) throw erroHttp(400, 'O print precisa ser imagem png, jpg ou webp.');
    if (Math.floor(((s.length - s.indexOf(',') - 1) * 3) / 4) > MAX_IMAGEM_BYTES) throw erroHttp(413, 'Cada imagem pode ter até 4 MB.');
  }
  if (v.reduce((soma, s) => soma + s.length, 0) > MAX_PRINTS_JUNTOS) throw erroHttp(413, MSG_PRINT_GRANDE);
  return v;
}

// o corpo do print com o teto dele; o 413 genérico do servidor ("Corpo grande demais.") vira o que fazer
export async function corpoDoPrint(req, corpoJson) {
  try {
    return await corpoJson(req, LIMITE_PRINT);
  } catch (e) {
    if (e?.status === 413) throw erroHttp(413, MSG_PRINT_GRANDE);
    throw e;
  }
}

// AAAA-Www que existe; ausente = null (ou 400 quando obrigatória)
export function lerSemana(v, { obrigatoria = false } = {}) {
  if (v === undefined || v === null || v === '') {
    if (obrigatoria) throw erroHttp(400, 'Diga a semana (AAAA-Www, como 2026-W40).');
    return null;
  }
  if (typeof v !== 'string' || !semanaValida(v)) throw erroHttp(400, 'Semana precisa ser AAAA-Www, como 2026-W40.');
  return v;
}

// ?dias= de 1 a 90 (padrão 14)
export function lerDias(v) {
  if (v === undefined || v === null || v === '') return 14;
  const n = Number(v);
  if (!/^\d{1,3}$/.test(String(v)) || n < 1 || n > 90) throw erroHttp(400, 'dias vai de 1 a 90.');
  return n;
}

// ---------- apoio (com disco, por import) ----------

const modulo = {
  db: () => import('./db.mjs'),
  diagnostico: () => import('./diagnostico.mjs'),
  mecanismos: () => import('./mecanismos.mjs'),
  publico: () => import('./publico.mjs'),
  anuncios: () => import('./anuncios.mjs'),
  stories: () => import('./stories-metricas.mjs'),
  relatorio: () => import('./relatorio.mjs'),
};

// o cache do diagnóstico (30 s) zera depois de toda escrita; falha aqui não derruba a escrita que já foi feita
export async function invalidarDiagnostico() {
  try {
    (await modulo.diagnostico()).invalidar?.();
  } catch (e) {
    console.error('Não deu pra zerar o cache do diagnóstico:', e.message);
  }
}

async function opcional(oque, fn) {
  try {
    return await fn();
  } catch (e) {
    console.error(`Métricas: ${oque} ficou de fora do diagnóstico (${e.message}).`);
    return null;
  }
}

async function conferirPost(midiaId) {
  const ig = (await (await modulo.db()).carregar()).instagram ?? {};
  const nossa = [...(ig.proprios ?? []), ...(ig.postsProprios ?? [])].some((m) => String(m?.midiaId) === midiaId);
  if (!nossa) throw erroHttp(404, 'Esse post não está no cache. Sincronize de novo.');
}

async function conferirPeca(reelId) {
  const db = await (await modulo.db()).carregar();
  if (!(db.reels ?? []).some((r) => r.id === reelId)) throw erroHttp(404, 'Essa peça não existe mais.');
}

async function detalheDepoisDeEscrever(midiaId) {
  await invalidarDiagnostico();
  return [200, await (await modulo.diagnostico()).detalhePost(midiaId)];
}

// a escrita do público já devolve o resumo da aba: só lê de novo quando não veio
async function publicoDepoisDeEscrever(devolvido = null) {
  await invalidarDiagnostico();
  return [200, devolvido && typeof devolvido === 'object' && Array.isArray(devolvido.quem) ? devolvido : await (await modulo.publico()).resumo()];
}

async function anunciosDepoisDeEscrever() {
  await invalidarDiagnostico();
  return [200, await (await modulo.anuncios()).status()];
}

// codebook(db): do mecanismos-codebook.mjs; sem ele, o que o mecanismos.mjs exportar
async function funcaoCodebook() {
  try {
    const cb = await import('./mecanismos-codebook.mjs');
    if (typeof cb.codebook === 'function') return cb.codebook;
  } catch {
    /* sem o arquivo separado: vale o do mecanismos.mjs */
  }
  return (await modulo.mecanismos()).codebook;
}

// ---------- as ações ----------
// cada uma recebe { req, url, corpoJson, autor, ...params } e devolve [status, corpo]

const ACOES = {
  async diagnostico() {
    const d = await modulo.diagnostico();
    const [resumo, estadoAgenda, stories] = await Promise.all([
      d.resumo(),
      opcional('a agenda', () => agenda.estado()),
      opcional('os stories', async () => (await modulo.stories()).resumoStories({ dias: 14 })),
    ]);
    return [200, { ...resumo, agenda: estadoAgenda, stories }];
  },

  async post({ midia }) {
    await conferirPost(midia);
    return [200, await (await modulo.diagnostico()).detalhePost(midia)];
  },
  async vinculo({ req, corpoJson, autor, midia }) {
    const reelId = lerReelDoCorpo(await corpoJson(req));
    await conferirPost(midia);
    if (reelId) await conferirPeca(reelId);
    await (await modulo.mecanismos()).vincular(midia, reelId, autor);
    return detalheDepoisDeEscrever(midia);
  },
  async tag({ req, corpoJson, autor, midia }) {
    const { dimensao, valor } = lerTag(await corpoJson(req));
    await conferirPost(midia);
    await (await modulo.mecanismos()).definirTag(midia, dimensao, valor, autor);
    return detalheDepoisDeEscrever(midia);
  },
  async numeros({ req, corpoJson, autor, midia }) {
    const numeros = lerNumeros(await corpoJson(req));
    await conferirPost(midia);
    await (await modulo.mecanismos()).definirNumeros(midia, numeros, autor);
    return detalheDepoisDeEscrever(midia);
  },
  async impulsionado({ req, corpoJson, autor, midia }) {
    const valor = lerImpulsionado(await corpoJson(req));
    await conferirPost(midia);
    await (await modulo.mecanismos()).definirImpulsionado(midia, valor, autor);
    return detalheDepoisDeEscrever(midia);
  },
  async etiquetar({ autor, midia }) {
    await conferirPost(midia);
    const m = await modulo.mecanismos();
    await m.iniciarIa(midia, autor);
    return [202, { ia: m.estadoIa() }];
  },
  async etiquetarLote({ req, corpoJson, autor }) {
    const ids = lerMidiaIds(await corpoJson(req));
    const m = await modulo.mecanismos();
    await m.iniciarIaLote(ids, autor);
    return [202, { ia: m.estadoIa() }];
  },
  async etiquetarEstado() {
    return [200, { ia: (await modulo.mecanismos()).estadoIa() }];
  },
  async codebook() {
    const [fn, db] = await Promise.all([funcaoCodebook(), modulo.db().then((x) => x.carregar())]);
    return [200, fn(db)];
  },

  async recomendacoes({ reel }) {
    await conferirPeca(reel);
    const r = await (await modulo.diagnostico()).recomendacoes(reel);
    return [200, { resultado: null, ...r }];
  },
  async criarHipotese({ req, corpoJson, autor }) {
    const { reelId, insightId } = lerHipotese(await corpoJson(req));
    await conferirPeca(reelId);
    const h = await (await modulo.diagnostico()).criarHipotese(reelId, insightId, autor);
    await invalidarDiagnostico();
    return [201, h];
  },
  async apagarHipotese({ hipotese }) {
    await (await modulo.diagnostico()).apagarHipotese(hipotese);
    await invalidarDiagnostico();
    return [200, { ok: true }];
  },

  async publico() {
    return [200, await (await modulo.publico()).resumo()];
  },
  async publicoAtualizar() {
    // o "Atualizar agora" da aba: tenta de novo até o que a Meta recusou nos últimos 7 dias
    await (await modulo.publico()).atualizar({ forcar: true });
    return publicoDepoisDeEscrever();
  },
  async publicoPost({ req, corpoJson, autor, midia }) {
    const dados = await corpoJson(req);
    await conferirPost(midia);
    return publicoDepoisDeEscrever(await (await modulo.publico()).definirPostApp(midia, dados, autor));
  },
  async publicoPostApagar({ midia }) {
    await conferirPost(midia);
    return publicoDepoisDeEscrever(await (await modulo.publico()).apagarPostApp(midia));
  },
  async printIniciar({ req, corpoJson, autor, midia }) {
    const imagens = lerImagens(await corpoDoPrint(req, corpoJson));
    await conferirPost(midia);
    const p = await modulo.publico();
    await p.iniciarLeituraPrint(midia, imagens, autor);
    return [202, { leitura: (await p.estadoLeituraPrint(midia)) ?? null }];
  },
  async printEstado({ midia }) {
    return [200, { leitura: (await (await modulo.publico()).estadoLeituraPrint(midia)) ?? null }];
  },

  async anuncios() {
    return [200, await (await modulo.anuncios()).status()];
  },
  async anunciosToken({ req, corpoJson }) {
    const token = lerToken(await corpoJson(req));
    await (await modulo.anuncios()).conectar({ token });
    return anunciosDepoisDeEscrever();
  },
  async anunciosConta({ req, corpoJson }) {
    const contaId = lerConta(await corpoJson(req));
    await (await modulo.anuncios()).escolherConta(contaId);
    return anunciosDepoisDeEscrever();
  },
  async anunciosAtualizar() {
    await (await modulo.anuncios()).atualizar();
    return anunciosDepoisDeEscrever();
  },

  async stories({ url }) {
    const dias = lerDias(url.searchParams.get('dias'));
    return [200, await (await modulo.stories()).resumoStories({ dias })];
  },

  async semanal({ url }) {
    const pedida = lerSemana(url.searchParams.get('semana'));
    const r = await modulo.relatorio();
    const semanas = await r.listar();
    // sem semana pedida: a mais nova com arquivo; sem nenhuma, a anterior (a que o "Gerar agora" faria)
    const atual = pedida ?? semanas[0] ?? r.semanaAnterior();
    return [200, { semanas, relatorio: await r.ler(atual), atual, leitura: r.estadoLeituraIa(atual), corrente: semanaIso(diaBrasilia(Date.now())) }];
  },
  async semanalGerar({ req, corpoJson, autor }) {
    const b = await corpoJson(req);
    const r = await modulo.relatorio();
    const semana = lerSemana(b.semana) ?? r.semanaAnterior();
    return [200, { relatorio: await r.gerar(semana, { autor: autor || 'manual' }) }];
  },
  async leituraIniciar({ req, corpoJson, autor }) {
    const semana = lerSemana((await corpoJson(req)).semana, { obrigatoria: true });
    return [202, { leitura: await (await modulo.relatorio()).iniciarLeituraIa(semana, autor) }];
  },
  async leituraEstado({ url }) {
    const semana = lerSemana(url.searchParams.get('semana'), { obrigatoria: true });
    return [200, { leitura: (await modulo.relatorio()).estadoLeituraIa(semana) }];
  },

  async agenda() {
    return [200, await agenda.estado()];
  },
  async agendaRodar({ tarefa }) {
    return [200, await agenda.rodarAgora(tarefa)];
  },
};

// /api/metricas/... (partes já sem o "metricas")
export async function rota(req, res, partes, { json, corpoJson, autor = null } = {}) {
  const alvo = resolverRota(req.method, partes);
  if (alvo.status) return json(res, alvo.status, { erro: alvo.erro });
  const url = new URL(req.url ?? '/', 'http://localhost');
  const [status, corpo] = await ACOES[alvo.acao]({ req, url, corpoJson, autor, ...alvo.params });
  return json(res, status, corpo);
}
