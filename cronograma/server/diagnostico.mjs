// Diagnóstico (Métricas, 30/09/2026; SPEC-METRICAS.md §3.4, §3.5 e §3.11): a parte que lê os arquivos e guarda o
// contexto calculado. Todo cálculo é de diagnostico-motor.mjs (puro); aqui só carrega, junta e devolve as formas
// da aba, do painel do post, das recomendações da peça, das hipóteses e do bloco das IAs de criação. Decisões:
//  - o contexto calculado vale 30 s; invalidar() zera (a rota chama depois de toda escrita, o server.mjs depois
//    de "Sincronizar agora", a agenda depois de cada tarefa). Carga que começou antes de um invalidar() não
//    vira cache
//  - os vizinhos (histórico, mecanismos, público, anúncios, Instagram) entram por import dinâmico: um módulo
//    ausente vira dado vazio, com um aviso só no console, e o diagnóstico segue. Arquivo de dados ilegível
//    (lerJsonEstrito, 503: preso por outro processo ou JSON quebrado) NÃO vira vazio: a carga falha, nada vai
//    pro cache e a rota mostra qual arquivo conferir (30/09). Com o histórico ou as tags sumidos em silêncio, o
//    diagnóstico mostraria número errado e a agenda gravaria veredito de hipótese em cima dele. O bloco das IAs
//    de criação nunca derruba a geração: qualquer erro vira ''
//  - não importa agenda.mjs, relatorio.mjs nem metricas-rotas.mjs (quem junta é a rota, SPEC §3.11)
//  - id que vem da URL ou do corpo é conferido aqui também (midiaId, reelId, insightId, id de hipótese)
//  - "teve anúncio" é certeza com o post em porPost ou na lista de anúncios; "sem anúncio" só com leitura boa,
//    recente (24 horas), depois da publicação e com o token de usuário valendo (motor.anuncioDoPost). No resto,
//    impulsionado null (pode ter tido): leitura velha nunca põe post impulsionado na base
//  - público do post lido do app (C3, 30/09): a base em pessoas é o número de contas da tela, ou o alcance, ou
//    (contas com engajamento) o maior entre curtidas e salvamentos; nunca as views.
//    A resposta leva só as frases e os grupos com 5 pessoas ou mais ("visiveis"); o que foi digitado fica em
//    "dados", só pro formulário
//  - peça apagada do cronograma (pecaApagada, chamada pelo DELETE do server.mjs): as hipóteses dela saem e os
//    posts ligados a ela ficam sem peça. Melhor esforço, só no log
//  - a família de gancho "do tipo" é o GANCHO_POR_TIPO do codebook (o mapa por tipo do ganchos.md)
import path from 'node:path';
import { carregar, lerJson, falha, agora, mesmoPost, semTracos, ROTULO_TIPO } from './db.mjs';
import { finito } from './estatistica.mjs';
import * as motor from './diagnostico-motor.mjs';
import * as hipoteses from './hipoteses.mjs';

const VALIDADE_MS = 30_000;
const ID_REEL = /^reel_[a-z0-9]{4,20}$/i;

// ---------- vizinhos (import dinâmico) ----------

const VIZINHOS = {
  historico: './historico.mjs',
  mecanismos: './mecanismos.mjs',
  codebook: './mecanismos-codebook.mjs',
  publico: './publico.mjs',
  publicoMotor: './publico-motor.mjs',
  anuncios: './anuncios.mjs',
  instagram: './instagram.mjs',
};
const modulos = new Map();
const avisados = new Set();

function avisarUmaVez(chave, mensagem) {
  if (avisados.has(chave)) return;
  avisados.add(chave);
  console.error(mensagem);
}

function vizinho(nome) {
  if (!modulos.has(nome)) {
    modulos.set(nome, import(VIZINHOS[nome]).catch((e) => {
      modulos.delete(nome); // tenta de novo na próxima carga
      avisarUmaVez(`import:${nome}`, `Diagnóstico: ${VIZINHOS[nome]} não carregou (${e.code ?? e.message}); segue sem ele.`);
      return null;
    }));
  }
  return modulos.get(nome);
}

async function tentar(nome, fn, padrao) {
  try {
    const m = await vizinho(nome);
    if (!m) return padrao;
    return (await fn(m)) ?? padrao;
  } catch (e) {
    // arquivo de dados ilegível (falha com status, de lerJsonEstrito): sobe, pra rota dizer qual arquivo conferir
    if (e?.status) throw e;
    avisarUmaVez(`uso:${nome}`, `Diagnóstico: a leitura de ${VIZINHOS[nome]} falhou (${e.message}); segue sem ela.`);
    return padrao;
  }
}

function protegido(nome, fn, padrao) {
  try {
    return fn() ?? padrao;
  } catch (e) {
    avisarUmaVez(`fn:${nome}`, `Diagnóstico: ${nome} falhou (${e.message}); segue sem.`);
    return padrao;
  }
}

// sem o codebook: a peça gravada no vínculo, senão a do mesmo link
function vinculoPeloLink(db, m, registro) {
  const gravada = registro?.reelId ? db.reels.find((r) => r.id === registro.reelId) : null;
  if (gravada) return { reel: gravada, por: registro.vinculoPor === 'permalink' ? 'permalink' : 'manual' };
  const r = m.permalink ? db.reels.find((x) => mesmoPost(x.permalink, m.permalink)) : null;
  return { reel: r ?? null, por: r ? 'permalink' : null };
}

// só o que o diagnóstico usa da análise do vídeo: duração e o que a transcrição achou (pro áudio calculado)
async function lerAnalises(midias) {
  const ids = midias.filter((m) => (m.tipo ?? 'REELS') === 'REELS').map((m) => String(m.midiaId));
  const lidas = await Promise.all(ids.map((id) => lerJson(path.join('analises', `${id}.json`), null)));
  const out = {};
  ids.forEach((id, i) => {
    const a = lidas[i];
    if (!a || typeof a !== 'object' || Array.isArray(a)) return;
    out[id] = { duracao: finito(a.duracao) ? a.duracao : null, temAudio: typeof a.temAudio === 'boolean' ? a.temAudio : null, avisoAudio: String(a.avisoAudio ?? ''), transcricao: a.transcricao && typeof a.transcricao === 'object' ? a.transcricao : null };
  });
  return out;
}

// ---------- contexto (cache de 30 s) ----------

let cache = null;
let cacheEm = 0;
let carregando = null;
let geracao = 0;
let ouvindoMecanismos = false;

export function invalidar() {
  geracao++;
  cache = null;
  carregando = null;
}

// a etiquetagem com IA grava em segundo plano (sem passar pela rota): cada gravação dos mecanismos zera o cache
async function ouvirMecanismos() {
  if (ouvindoMecanismos) return;
  const m = await vizinho('mecanismos');
  if (typeof m?.aoMudar !== 'function') return;
  ouvindoMecanismos = true;
  m.aoMudar(invalidar);
}

async function montarContexto() {
  const em = agora();
  await ouvirMecanismos();
  const db = await carregar();
  const ig = db.instagram ?? {};
  const midias = [...(ig.proprios ?? []), ...(ig.postsProprios ?? [])].filter((m) => m && motor.MIDIA_ID.test(String(m.midiaId ?? '')));
  const [historico, mecanismos, publico, anuncios, arqHipoteses, cb, analises, tokenUsuario] = await Promise.all([
    tentar('historico', (m) => m.todas(), {}),
    tentar('mecanismos', (m) => m.ler(), null),
    tentar('publico', (m) => m.ler(), null),
    tentar('anuncios', (m) => m.ler(), null),
    hipoteses.ler(),
    vizinho('codebook'),
    lerAnalises(midias),
    tokenDeUsuario(),
  ]);
  const registros = mecanismos?.midias && typeof mecanismos.midias === 'object' ? mecanismos.midias : {};
  const dimensoes = cb?.codebook ? protegido('codebook(db)', () => cb.codebook(db), []) : [];
  // "sem anúncio" só com leitura boa e recente que cobre o post (servidor-3): leitura velha, com erro ou sem o
  // token de usuário vira "não se sabe", e o post que passou das views orgânicas ganha o aviso
  const anunciosLidos = Boolean(anuncios?.conta?.id && anuncios?.lidoEm);
  const tagsPorMidia = {};
  const reelPorMidia = {};
  const vinculoPor = {};
  const duracoes = {};
  for (const m of midias) {
    const id = String(m.midiaId);
    const registro = registros[id] ?? null;
    const analise = analises[id] ?? null;
    const anunciado = motor.anuncioDoPost(id, m.timestamp, anuncios, { agora: em, tokenUsuario });
    tagsPorMidia[id] = cb?.tagsEfetivas ? protegido('tagsEfetivas', () => cb.tagsEfetivas(db, m, registro, { analise, anunciado }), {}) : {};
    const v = cb?.vinculoDaMidia ? protegido('vinculoDaMidia', () => cb.vinculoDaMidia(db, m, registro), { reel: null, por: null }) : vinculoPeloLink(db, m, registro);
    reelPorMidia[id] = v.reel ?? null;
    vinculoPor[id] = v.por ?? null;
    // duração do vídeo: da análise do reel ou, sem ela, da etiquetagem da IA (as duas medem com o ffprobe)
    if (finito(analise?.duracao)) duracoes[id] = analise.duracao;
    else if (finito(registro?.ia?.duracaoS)) duracoes[id] = registro.ia.duracaoS;
  }
  const posts = motor.montarPosts({
    midias, pilares: db.pilares, conta: ig.conta, historico, registros, tagsPorMidia, reelPorMidia, publico, anuncios, duracoes,
    dimensoes, rotulosTipo: ROTULO_TIPO, agora: em,
  });
  const efeitos = motor.calcularEfeitos(posts, dimensoes);
  const insights = motor.gerarInsights(efeitos, posts, dimensoes);
  const sugestoes = cb?.sugerirVinculos ? protegido('sugerirVinculos', () => cb.sugerirVinculos(db, midias, registros), []) : [];
  return {
    em, db, historico, mecanismos, publico, anuncios, hipoteses: arqHipoteses.hipoteses, analises, posts, efeitos, insights,
    codebook: dimensoes, midias, registros, tagsPorMidia, reelPorMidia, vinculoPor, sugestoes, anunciosLidos, tokenUsuario,
    ctaPorTipo: cb?.CTA_POR_TIPO ?? {}, familiasPorTipo: cb?.GANCHO_POR_TIPO ?? {}, rotulosTipo: ROTULO_TIPO,
  };
}

// o token de usuário (o dos anúncios) ainda está guardado? true, false, ou null quando não dá pra saber
async function tokenDeUsuario() {
  const v = await tentar('instagram', (m) => (typeof m.tokenUsuarioDisponivel === 'function' ? m.tokenUsuarioDisponivel() : null), null);
  return typeof v === 'boolean' ? v : null;
}

// { db, historico, mecanismos, publico, anuncios, hipoteses (a lista), analises, posts, efeitos, insights, codebook, ... }
export async function carregarContexto() {
  if (cache && Date.now() - cacheEm < VALIDADE_MS) return cache;
  if (carregando) return carregando;
  const g = geracao;
  const p = montarContexto()
    .then((ctx) => {
      if (g === geracao) {
        cache = ctx;
        cacheEm = Date.now();
      }
      return ctx;
    })
    .finally(() => {
      if (carregando === p) carregando = null;
    });
  carregando = p;
  return p;
}

const contextoMotor = (ctx) => ({
  posts: ctx.posts, insights: ctx.insights, hipoteses: ctx.hipoteses, dimensoes: ctx.codebook, ctaPorTipo: ctx.ctaPorTipo,
  familiasPorTipo: ctx.familiasPorTipo, rotulosTipo: ctx.rotulosTipo, agora: agora(),
});
const tituloDe = (db, reelId) => {
  const r = db.reels.find((x) => x.id === reelId);
  return r ? semTracos(r.ideia ?? '') || null : null;
};

async function estaConectado() {
  return tentar('instagram', async (m) => (typeof m.conectado === 'function' ? Boolean(await m.conectado()) : Boolean((await m.status())?.conectado)), false);
}
const estadoIa = () => tentar('mecanismos', (m) => (typeof m.estadoIa === 'function' ? m.estadoIa() : null), null);

// true com conta de anúncios escolhida e o token de usuário guardado; false sem um dos dois (a pendência aparece
// também depois de desconectar); null quando o módulo de anúncios nem carregou
const anunciosConectados = (ctx) => (ctx.anuncios ? Boolean(ctx.anuncios.conta?.id) && ctx.tokenUsuario !== false : null);

// ---------- a aba ----------

// a aba inteira (SPEC §3.4), sem agenda e stories: a rota junta os dois
export async function resumo() {
  const ctx = await carregarContexto();
  const [conectado, ia] = await Promise.all([estaConectado(), estadoIa()]);
  const sugestoesVinculo = ctx.sugestoes.map((s) => {
    const r = ctx.db.reels.find((x) => x.id === s.reelId);
    return {
      midiaId: s.midiaId, reelId: s.reelId, reelTitulo: tituloDe(ctx.db, s.reelId), dia: ctx.posts.find((p) => p.midiaId === s.midiaId)?.dia ?? null,
      reelDia: r?.data || null, score: s.score, motivo: semTracos(s.motivo ?? ''),
    };
  });
  return {
    atualizadoEm: ctx.em,
    conectado,
    // a última leitura dos NOSSOS posts (sincronizar só as inspirações não conta); banco antigo: sincronizadoEm
    sincronizadoEm: ctx.db.instagram?.propriosEm ?? ctx.db.instagram?.sincronizadoEm ?? null,
    metas: motor.metasPorTipo(ctx.posts, contextoMotor(ctx)),
    numeros: motor.numerosDaConta(ctx.posts, { agora: agora() }),
    pendencias: motor.pendenciasDe(ctx.posts, { conectado, anunciosConectados: anunciosConectados(ctx), nSugestoes: sugestoesVinculo.length }),
    sugestoesVinculo,
    posts: ctx.posts,
    efeitos: ctx.efeitos,
    insights: ctx.insights,
    hipoteses: ctx.hipoteses.map((h) => ({ ...h, reelTitulo: tituloDe(ctx.db, h.reelId) })),
    ia,
  };
}

// ---------- o painel do post ----------

async function frasesDoPago(pago) {
  const f = await tentar('anuncios', (m) => (typeof m.frasesPago === 'function' ? m.frasesPago(pago) : []), []);
  return Array.isArray(f) ? f.filter((x) => typeof x === 'string') : [];
}

const ROTULO_BASE_APP = { visualizacoes: 'visualizações', 'contas-alcancadas': 'contas alcançadas', 'contas-engajadas': 'contas com engajamento' };
const listaDe = (x) => (Array.isArray(x) ? x : null);

// o público do post pela tela do app (C3), na mesma forma da linha "app" do porPost da aba Público: n = pessoas na
// base (nunca views); frases e grupos visíveis só com 5 pessoas ou mais, e nada sem n. Os números digitados vão só
// em "dados" (o formulário de correção preenche com eles). As regras são as do publico-motor.mjs (uma fonte só pras
// duas telas); sem ele, as reservas do motor, com a mesma regra
async function publicoDoApp(app, post) {
  const pm = await vizinho('publicoMotor');
  const reserva = motor.pessoasNaBaseApp(app, post.metricas);
  const deLa = typeof pm?.pessoasNaBase === 'function' ? protegido('pessoasNaBase', () => pm.pessoasNaBase(app, post.metricas), null) : reserva.n;
  const n = finito(deLa) ? deLa : null;
  // sem n, nenhuma frase de grupo (mesmo se o publico-motor deixasse passar)
  const frases = n != null && typeof pm?.frasesPostApp === 'function' ? protegido('frasesPostApp', () => pm.frasesPostApp(app, { n }), []) : [];
  const lista = Array.isArray(frases) ? frases.filter((x) => typeof x === 'string') : [];
  const vis = typeof pm?.visiveisPostApp === 'function' ? protegido('visiveisPostApp', () => pm.visiveisPostApp(app, n), null) : null;
  const formaOk = vis && typeof vis === 'object' && ['genero', 'idade', 'cidades', 'paises'].every((k) => listaDe(vis[k]));
  const semFrase = typeof pm?.semFrasePostApp === 'function' ? protegido('semFrasePostApp', () => pm.semFrasePostApp(lista, n), null) : null;
  return {
    fonte: 'app', base: app.base ?? null, baseTexto: ROTULO_BASE_APP[app.base] ?? ROTULO_BASE_APP.visualizacoes,
    contas: finito(app.contas) ? app.contas : null, n,
    // de onde veio a base em pessoas: 'informado' (contas da tela), 'alcance', 'interacoes' ou null
    nDe: n == null ? null : finito(app.contas) ? 'informado' : app.base === 'contas-engajadas' ? 'interacoes' : 'alcance',
    em: app.em ?? null, autor: app.autor ?? null,
    frases: lista,
    semFrase: typeof semFrase === 'string' ? semFrase : lista.length ? null
      : n != null ? 'Sem frase: nenhum grupo com 5 pessoas ou mais.' : 'Sem frase: falta saber quantas contas a tela mede. Informe as contas na base no formulário.',
    visiveis: formaOk ? vis : motor.visiveisDoApp(app, n),
    dados: structuredClone(app),
  };
}

// a linha + tags com detalhe + efeitos das tags + vínculo + público do post (SPEC §3.11)
export async function detalhePost(midiaId) {
  const id = String(midiaId ?? '');
  if (!motor.MIDIA_ID.test(id)) throw falha(400, 'Mídia inválida.');
  const ctx = await carregarContexto();
  const post = ctx.posts.find((p) => p.midiaId === id);
  const m = ctx.midias.find((x) => String(x.midiaId) === id);
  if (!post || !m) throw falha(404, 'Esse post não está no cache. Sincronize de novo.');
  const registro = ctx.registros[id] ?? null;
  const completas = ctx.tagsPorMidia[id] ?? {};
  // "Teve anúncio" tem controle próprio no painel: fica fora da lista de mecanismos
  const tags = motor.listaDimensoes(ctx.codebook)
    .filter((d) => d.id !== 'impulsionado' && (!Array.isArray(d.pecas) || !d.pecas.length || d.pecas.includes(post.peca)))
    .map((d) => {
      const t = completas[d.id];
      return {
        dimensao: d.id, nome: d.nome, grupo: d.grupo, etapa: d.etapa, valor: t?.valor ?? null, nomeValor: t ? motor.nomeDoValor(d, t.valor) : null,
        fonte: t?.fonte ?? null, evidencias: Array.isArray(t?.evidencias) ? t.evidencias : [], opcoes: motor.opcoesDaDimensao(d),
        editavel: Array.isArray(d.fontes) && d.fontes.includes('manual'),
      };
    });
  const reel = ctx.reelPorMidia[id] ?? null;
  const sug = reel ? null : ctx.sugestoes.find((s) => s.midiaId === id) ?? null;
  const pago = ctx.anuncios?.porPost?.[id] ?? null;
  const app = ctx.publico?.porPostApp?.[id] ?? null;
  const [frasesPago, publicoApp, ia] = await Promise.all([pago ? frasesDoPago(pago) : [], app ? publicoDoApp(app, post) : null, estadoIa()]);
  return {
    post,
    midia: {
      midiaId: id, permalink: m.permalink ?? '', thumb: m.thumb ?? '', video: m.video ?? '', caption: m.caption ?? '', timestamp: m.timestamp ?? null,
      tipo: post.tipoMidia, audioTipo: m.audioTipo ?? null, nSlides: Number.isInteger(m.nSlides) ? m.nSlides : null,
    },
    tags,
    efeitosDasTags: motor.efeitosDoPost(post, ctx.efeitos),
    vinculo: {
      reelId: reel?.id ?? null, reelTitulo: reel ? tituloDe(ctx.db, reel.id) : null, dia: reel?.data || null, por: ctx.vinculoPor[id] ?? null,
      sugestao: sug ? { reelId: sug.reelId, reelTitulo: tituloDe(ctx.db, sug.reelId), score: sug.score, motivo: semTracos(sug.motivo ?? '') } : null,
      opcoes: motor.opcoesDeVinculo(ctx.db.reels, post.dia),
    },
    manual: registro?.manual ?? null,
    publico: { pago: pago ? { ...pago, frases: frasesPago } : null, app: publicoApp },
    hipoteses: ctx.hipoteses.filter((h) => h.midiaId === id || (reel && h.reelId === reel.id)).map((h) => ({ ...h, reelTitulo: tituloDe(ctx.db, h.reelId) })),
    ia: registro?.ia ? { status: registro.ia.status ?? null, em: registro.ia.em ?? null, mensagem: registro.ia.mensagem ?? null, descartadas: registro.ia.descartadas ?? null } : null,
    iaRodando: ia?.atual?.midiaId === id,
    analiseVideo: { existe: Boolean(ctx.analises[id]), podeAnalisar: post.tipoMidia === 'REELS' && /^https:\/\//i.test(String(m.video ?? '')) },
  };
}

// ---------- recomendações e hipóteses ----------

// recomendacoesPara() da peça, com o resultado (PostRow do post vinculado, ou null)
export async function recomendacoes(reelId) {
  const id = String(reelId ?? '');
  if (!ID_REEL.test(id)) throw falha(400, 'Peça inválida.');
  const ctx = await carregarContexto();
  const reel = ctx.db.reels.find((r) => r.id === id);
  if (!reel) throw falha(404, 'Essa peça não existe mais.');
  const r = motor.recomendacoesPara(reel, contextoMotor(ctx));
  if (!ctx.midias.length) {
    r.semDados = (await estaConectado()) ? 'Ainda não há posts lidos do Instagram pra comparar. Sincronize em Métricas.' : 'Instagram não conectado: ainda sem números pra montar a meta.';
  }
  return r;
}

// "Aplicar": refaz as recomendações da peça e só aceita um insight que esteja nelas (itens ou testar).
// Aceita (reelId, insightId, autor) e também ({ reelId, insightId }, autor), a forma que a rota usa
export async function criarHipotese(reelId, insightId, autor = null) {
  if (reelId && typeof reelId === 'object') return criarHipotese(reelId.reelId, reelId.insightId, insightId ?? null);
  const idReel = String(reelId ?? '');
  const idInsight = String(insightId ?? '');
  if (!ID_REEL.test(idReel)) throw falha(400, 'Peça inválida.');
  if (!hipoteses.ID_INSIGHT.test(idInsight)) throw falha(400, 'Recomendação inválida.');
  const ctx = await carregarContexto();
  const reel = ctx.db.reels.find((r) => r.id === idReel);
  if (!reel) throw falha(404, 'Essa peça não existe mais.');
  const r = motor.recomendacoesPara(reel, contextoMotor(ctx));
  const testar = r.testar?.insightId === idInsight;
  const item = r.itens.find((i) => i.insightId === idInsight) ?? (testar ? r.testar : null);
  if (!item) throw falha(400, 'Essa recomendação não vale mais pra esta peça. Atualize a tela e tente de novo.');
  const acao = item.acao === 'evitar' ? 'evitar' : 'usar';
  // o "prep" já traz o "com" ou o "sem" ("Fazer a peça sem voz.", nunca "Usar sem voz.")
  const d = motor.listaDimensoes(ctx.codebook).find((x) => x.id === item.dimensao) ?? { id: item.dimensao };
  const prep = item.prep ?? motor.frase(d, item.valor).prep;
  const h = await hipoteses.criar({
    reelId: idReel, insightId: idInsight, dimensao: item.dimensao, valor: item.valor, acao,
    texto: testar ? `Testar a peça ${prep}.` : acao === 'evitar' ? `Evitar fazer a peça ${prep}.` : `Fazer a peça ${prep}.`,
    previsao: { etapa: item.etapa ?? 'objetivo' }, midiaId: r.resultado?.midiaId ?? null,
  }, autor);
  invalidar();
  return h;
}

export async function apagarHipotese(id) {
  const r = await hipoteses.apagar(id);
  invalidar();
  return r;
}

// peça apagada do cronograma (o DELETE de /api/reels/:id chama depois de gravar): as hipóteses dela saem de
// hipoteses.json (sem a peça, nenhuma fecharia nem teria título, e todo semanal contaria "em teste") e os posts
// ligados a ela ficam sem peça em mecanismos.json. Melhor esforço: cada parte isolada, erro só no log (o DELETE
// já gravou). O vínculo sai pelo dono do arquivo: soltarPeca(reelId) do mecanismos.mjs (zera também o vinculoEm,
// e a sugestão de vínculo volta pro post); sem ela, vincular(post, null) de cada post ligado.
// → { hipoteses: n apagadas, vinculos: n soltos }
export async function pecaApagada(reelId, autor = null) {
  const id = String(reelId ?? '');
  const feito = { hipoteses: 0, vinculos: 0 };
  if (!ID_REEL.test(id)) return feito;
  try {
    feito.hipoteses = await hipoteses.daPecaApagada(id);
  } catch (e) {
    console.error(`Peça ${id} apagada: as hipóteses dela ficaram em hipoteses.json (${e.message}).`);
  }
  try {
    const mec = await vizinho('mecanismos');
    if (typeof mec?.soltarPeca === 'function') feito.vinculos = Number(await mec.soltarPeca(id)) || 0;
    else if (mec) {
      const db = await carregar();
      const proprias = [...(db.instagram?.proprios ?? []), ...(db.instagram?.postsProprios ?? [])];
      const arq = await mec.ler();
      for (const [midiaId, r] of Object.entries(arq?.midias ?? {})) {
        if (r?.reelId !== id) continue;
        // outra peça com o link do mesmo post: o post já é dela pelo link, e vincular(null) tiraria o link dela
        const m = proprias.find((x) => String(x?.midiaId) === midiaId);
        if (m?.permalink && db.reels.some((x) => mesmoPost(x.permalink, m.permalink))) continue;
        try {
          await mec.vincular(midiaId, null, autor);
          feito.vinculos++;
        } catch (e) {
          console.error(`Peça ${id} apagada: o post ${midiaId} segue apontando pra ela (${e.message}).`);
        }
      }
    }
  } catch (e) {
    console.error(`Peça ${id} apagada: os vínculos de post dela ficaram em mecanismos.json (${e.message}).`);
  }
  invalidar();
  return feito;
}

// avalia as abertas com o contexto novo e grava os vereditos (a agenda chama depois de cada sincronização)
export async function avaliarHipoteses() {
  invalidar();
  const ctx = await carregarContexto();
  const c = contextoMotor(ctx);
  let avaliadas = 0;
  let fechadas = 0;
  for (const h of ctx.hipoteses) {
    if (h.status !== 'aberta') continue;
    avaliadas++;
    const v = motor.avaliarHipotese(h, c);
    if (v) {
      await hipoteses.atualizar(h.id, { status: v.status, midiaId: v.midiaId, veredito: v.veredito });
      fechadas++;
      continue;
    }
    // a peça ganhou post depois de aplicada: guarda o vínculo, o veredito sai com os 7 dias
    const p = h.midiaId ? null : ctx.posts.find((x) => x.reelId === h.reelId);
    if (p) await hipoteses.atualizar(h.id, { midiaId: p.midiaId });
  }
  invalidar();
  return { avaliadas, fechadas };
}

// ---------- bloco das IAs de criação (SPEC §3.5) ----------

// { tipo, pecas, pilar, reelId? } → texto pro prompt, ou '' (nunca lança: a geração segue sem o bloco)
export async function blocoInsightsIa({ tipo = null, pecas = null, pilar = null, reelId = null } = {}) {
  try {
    const ctx = await carregarContexto();
    return motor.blocoParaIa({ tipo, pecas, pilar, reelId: ID_REEL.test(String(reelId ?? '')) ? reelId : null }, contextoMotor(ctx));
  } catch (e) {
    console.error('Diagnóstico: o bloco das Métricas não entrou no prompt:', e.message);
    return '';
  }
}
