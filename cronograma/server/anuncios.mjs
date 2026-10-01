// Anúncios ligados aos nossos posts (SPEC-METRICAS.md §2.4 e §3.7): o lado pago do público POR POST. O time
// promove pelo Gerenciador de Anúncios usando o post já publicado, então o criativo aponta pra mídia orgânica
// e a Marketing API devolve idade, gênero e região do alcance pago daquele post. Guardado em
// data/anuncios.json (lerJsonEstrito/gravarJson com fila de escrita, molde monitoramento.mjs; fica fora do git,
// o botão Atualizar refaz). Arquivo ilegível não vira vazio: a leitura falha (503), nada fica em cache e nada é
// gravado por cima. Decisões:
//  - token: o do usuário do sistema com ads_read. Mora em data/instagram.json (tokenUsuario, gravado pelo
//    instagram.mjs), nunca aqui, nunca no front, nunca no log. conectar() confere o token colado ANTES de
//    gravar (me e me/adaccounts) com um fetch próprio que trata erro igual ao graph() do instagram.mjs,
//    porque o chamar() de lá só usa o token que já está guardado
//  - conta de anúncios: a escolhida precisa estar entre as que o token enxerga; trocar de conta limpa a
//    leitura (número de outra conta não se mistura). Com uma conta só, ela é escolhida sozinha. Com uma leitura
//    rodando (a da agenda, inclusive), a troca espera (409); leitura que termina com a conta trocada no meio
//    (conectar de novo) é descartada, sem gravar
//  - ligação ao post: effective_instagram_media_id ou source_instagram_media_id igual a um midiaId nosso, ou o
//    permalink igual (mesmoPost)
//  - insights por anúncio ligado com date_preset=maximum: totais, breakdowns=age,gender e breakdowns=region.
//    Números chegam como texto (Number). Anúncio que falha não derruba os outros; token ruim e limite param.
//    Post com anúncio que falhou nesta rodada fica com a leitura anterior (soma pela metade engana)
//  - alcance de vários anúncios do mesmo post é somado (a mesma conta pode contar duas vezes): vai com aviso
//  - sem token ou sem conta visível, status().passos explica o caminho no Gerenciador de Negócios
import { lerJsonEstrito, gravarJson, falha, agora, mesmoPost } from './db.mjs';
import * as instagram from './instagram.mjs';
import { lerTotaisAnuncio, lerQuebraAnuncio, agregarAnuncios } from './publico-motor.mjs';
export { frasesPago } from './publico-motor.mjs';

const ARQUIVO = 'anuncios.json';
const TETO_PAGINAS = 20;
const LIMITE_ANUNCIOS = 2000;
const CONTA_OK = /^act_\d{1,30}$/;
const CAMPOS_ANUNCIO =
  'id,name,status,effective_status,created_time,campaign{id,name,objective},adset{id,name},creative{id,effective_instagram_media_id,source_instagram_media_id,instagram_permalink_url}';
const CAMPOS_TOTAIS =
  'spend,reach,impressions,actions,video_thruplay_watched_actions,video_avg_time_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions';
// limite de chamadas: os códigos gerais, o 429 e o limite por caso de uso da Marketing API (80000 a 80014)
const LIMITE_META = [4, 17, 32, 613, 429];
const ehLimiteMeta = (code) => LIMITE_META.includes(code) || (code >= 80000 && code <= 80014);
const limite = (e) => instagram.ehLimite(e) || ehLimiteMeta(e?.meta?.code);

const lista = (v) => (Array.isArray(v) ? v : []);
const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);
const texto = (v, lim = 200) => (typeof v === 'string' ? v.slice(0, lim) : v == null ? '' : String(v).slice(0, lim));

// ---------- arquivo ----------

const vazio = () => ({ versao: 1, conta: null, contasDisponiveis: [], lidoEm: null, erro: null, anuncios: [], porPost: {} });
const contaValida = (c) => (objeto(c) && CONTA_OK.test(String(c.id ?? '')) ? { id: c.id, nome: texto(c.nome), moeda: texto(c.moeda, 10) } : null);

let cache = null;
let carregando = null;
let fila = Promise.resolve();

// o arquivo com a forma garantida (cache em memória). Ausente ou vazio vira o vazio; ilegível (JSON quebrado,
// arquivo preso) lança 503 e não fica em cache: a próxima chamada tenta de novo e nada grava por cima
export async function ler() {
  if (cache) return cache;
  carregando ??= (async () => {
    const b = objeto(await lerJsonEstrito(ARQUIVO, null)) ?? {};
    cache = {
      ...vazio(),
      ...b,
      versao: 1,
      conta: contaValida(b.conta),
      contasDisponiveis: lista(b.contasDisponiveis).map(contaValida).filter(Boolean),
      lidoEm: typeof b.lidoEm === 'string' ? b.lidoEm : null,
      erro: typeof b.erro === 'string' ? b.erro : null,
      anuncios: lista(b.anuncios).filter(objeto),
      porPost: objeto(b.porPost) ?? {},
    };
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
  fila = proxima.catch((e) => console.error('Falha ao gravar anuncios.json:', e.message));
  return proxima;
}

// ---------- Graph direto (só pro token colado, antes de gravar) ----------

const versao = () => process.env.IG_GRAPH_VERSION || 'v26.0';
// a mensagem da Meta nunca traz o token, mas se trouxer, ele não sai daqui
const semToken = (s) => String(s ?? '').replace(/EAA[A-Za-z0-9]{20,}/g, '[token]');

function erroAnuncios(e = {}) {
  const code = Number(e.code) || 0;
  const sub = Number(e.error_subcode) || 0;
  const t = semToken(e.message);
  let msg;
  if (code === 190) msg = 'O token não vale (inválido ou vencido). Gere um token novo do usuário do sistema e cole de novo.';
  else if (ehLimiteMeta(code)) msg = 'A Meta limitou as chamadas deste app por agora. Espere alguns minutos e tente de novo.';
  else if (code === 100 && /adaccounts|nonexisting field|node type \(Page\)/i.test(t)) {
    msg = 'Esse token é de Página, não de usuário. Gere o token do usuário do sistema (Gerenciador de Negócios, Usuários do sistema) com ads_read.';
  } else if (code === 10 || (code >= 200 && code < 300)) msg = 'O token não tem permissão pra ler anúncios. Gere de novo marcando ads_read.';
  else msg = `A Meta recusou o pedido (código ${code || '?'}): ${t.slice(0, 200) || 'sem detalhe'}`;
  return Object.assign(falha(400, msg), { meta: { code, sub, message: t } });
}

// a URL leva o token: ela nunca vai pra mensagem de erro nem pro log
async function graphDireto(caminho, params, token) {
  const url = new URL(`https://graph.facebook.com/${versao()}/${caminho}`);
  for (const [k, v] of Object.entries(params ?? {})) if (v != null && v !== '') url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);
  let r;
  try {
    r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  } catch (e) {
    throw falha(502, e.name === 'TimeoutError' ? 'A Meta demorou demais pra responder. Tente de novo.' : 'Não consegui falar com a Meta (graph.facebook.com). Confira a internet desta máquina.');
  }
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok || corpo.error) throw erroAnuncios(corpo.error ?? { code: r.status, message: r.statusText });
  return corpo;
}

// ---------- conexão ----------

function api() {
  if (typeof instagram.chamar !== 'function') throw falha(503, 'Este servidor ainda não tem a leitura da Meta pra Métricas. Reinicie depois de atualizar o app.');
  return instagram.chamar;
}

async function temTokenUsuario() {
  if (typeof instagram.tokenUsuarioDisponivel !== 'function') return false;
  return Boolean(await instagram.tokenUsuarioDisponivel());
}

// contas de anúncios que o token enxerga (get: graphDireto com o token colado, ou chamar com o guardado)
async function listarContas(get) {
  const contas = [];
  let after;
  let paginas = 0;
  do {
    const r = await get('me/adaccounts', { fields: 'id,name,currency,account_status', limit: '100', after });
    contas.push(...lista(r?.data).map((a) => contaValida({ id: a?.id, nome: a?.name, moeda: a?.currency })).filter(Boolean));
    after = r?.paging?.next ? r?.paging?.cursors?.after : undefined;
  } while (after && ++paginas < 5);
  return contas;
}

function trocarConta(a, c) {
  a.conta = c;
  a.anuncios = [];
  a.porPost = {};
  a.lidoEm = null;
}

function ajustarContas(a, contas) {
  a.contasDisponiveis = contas;
  if (a.conta && !contas.some((c) => c.id === a.conta.id)) trocarConta(a, null);
  if (!a.conta && contas.length === 1) trocarConta(a, contas[0]);
  else if (a.conta) a.conta = contas.find((c) => c.id === a.conta.id) ?? a.conta;
}

const PASSO_GN = 'Abra o Gerenciador de Negócios da Meta (business.facebook.com) e entre em Configurações do negócio.';
const PASSO_USUARIO = 'Em Usuários, abra Usuários do sistema e escolha o usuário que o app já usa pro Instagram.';
const PASSO_ATRIBUIR = 'Clique em Atribuir ativos, escolha Contas de anúncios, marque a conta do Legalizaí e ligue Ver desempenho.';
const PASSO_TOKEN = 'Clique em Gerar novo token, marque ads_read junto com as permissões que já estavam e copie o token.';
const PASSO_COLAR = 'Cole o token aqui e clique em Conectar.';

function passosDe(a, temToken) {
  if (!temToken) return [PASSO_GN, PASSO_USUARIO, PASSO_ATRIBUIR, PASSO_TOKEN, PASSO_COLAR];
  if (!a.contasDisponiveis.length) {
    return [PASSO_GN, PASSO_USUARIO, PASSO_ATRIBUIR, PASSO_TOKEN, 'Cole o token novo aqui e clique em Conectar (ou, se o token já tinha ads_read, clique em Atualizar).'];
  }
  if (!a.conta) return ['Escolha a conta de anúncios do Legalizaí na lista e depois clique em Atualizar.'];
  return [];
}

// o que o front vê: nunca o token
export async function status() {
  const a = await ler();
  const temToken = await temTokenUsuario();
  return {
    temToken,
    conta: a.conta,
    contasDisponiveis: a.contasDisponiveis,
    lidoEm: a.lidoEm,
    erro: a.erro,
    nAnuncios: a.anuncios.length,
    nLigados: a.anuncios.filter((x) => x.midiaId).length,
    nPosts: Object.keys(a.porPost).length,
    passos: passosDe(a, temToken),
  };
}

export async function conectar({ token } = {}) {
  const t = String(token ?? '').trim().replace(/^Bearer\s+/i, '');
  if (!t) throw falha(400, 'Cole o token de acesso.');
  if (/\s/.test(t) || t.length < 30 || t.length > 1000) throw falha(400, 'Esse texto não parece um token da Meta. Copie o token inteiro, sem espaços.');
  if (typeof instagram.gravarTokenUsuario !== 'function') throw falha(503, 'Este servidor ainda não guarda o token dos anúncios. Reinicie depois de atualizar o app.');
  // o arquivo primeiro: ilegível, para aqui (sem guardar o token pela metade)
  const a = await ler();
  await graphDireto('me', { fields: 'id,name' }, t);
  const contas = await listarContas((caminho, params) => graphDireto(caminho, params, t));
  await instagram.gravarTokenUsuario(t);
  ajustarContas(a, contas);
  a.erro = null;
  await gravar();
  return status();
}

export async function escolherConta(contaId) {
  const id = String(contaId ?? '').trim();
  if (!CONTA_OK.test(id)) throw falha(400, 'Conta de anúncios inválida.');
  // trocar no meio da leitura (a da agenda, inclusive) misturaria os anúncios de uma conta com a outra
  if (emCurso) throw falha(409, 'Tem uma leitura dos anúncios rodando. Espere terminar e escolha a conta de novo.');
  const a = await ler();
  const c = a.contasDisponiveis.find((x) => x.id === id);
  if (!c) throw falha(404, 'Essa conta de anúncios não está entre as que o token enxerga. Conecte de novo ou clique em Atualizar.');
  if (a.conta?.id !== c.id) trocarConta(a, c);
  a.erro = null;
  await gravar();
  return status();
}

// ---------- leitura ----------

function midiaDo(ad, porId, midias) {
  const c = objeto(ad?.creative) ?? {};
  for (const id of [c.effective_instagram_media_id, c.source_instagram_media_id]) {
    if (id != null && porId.has(String(id))) return porId.get(String(id));
  }
  const link = typeof c.instagram_permalink_url === 'string' ? c.instagram_permalink_url : '';
  return link ? midias.find((m) => mesmoPost(m.permalink, link)) ?? null : null;
}

function anuncioDe(x, m) {
  const camp = objeto(x.campaign) ?? {};
  const conj = objeto(x.adset) ?? {};
  return {
    adId: String(x.id),
    nome: texto(x.name),
    status: texto(x.effective_status || x.status, 40),
    campanha: { id: camp.id != null ? String(camp.id) : null, nome: texto(camp.name), objetivo: texto(camp.objective, 60) },
    conjunto: { id: conj.id != null ? String(conj.id) : null, nome: texto(conj.name) },
    midiaId: m ? String(m.midiaId) : null,
    permalink: m?.permalink || (typeof x.creative?.instagram_permalink_url === 'string' ? x.creative.instagram_permalink_url : ''),
    criadoEm: typeof x.created_time === 'string' ? x.created_time : null,
  };
}

let emCurso = null;

// lista os anúncios da conta, liga cada um ao post, lê os insights dos ligados e grava porPost
export async function atualizar() {
  emCurso ??= executar().finally(() => {
    emCurso = null;
  });
  return emCurso;
}

async function executar() {
  const chamar = api();
  if (!(await temTokenUsuario())) throw falha(400, 'Conecte os anúncios primeiro: cole o token do usuário do sistema com ads_read.');
  const a = await ler();
  const usuario = (caminho, params) => chamar(caminho, params, { usuario: true });
  try {
    // contas: renova a lista (nome e moeda) e escolhe sozinho quando só tem uma
    let erroContas = null;
    try {
      ajustarContas(a, await listarContas(usuario));
    } catch (e) {
      if (instagram.ehTokenRuim(e) || limite(e)) throw e;
      erroContas = e.message; // token sem ads_read, por exemplo: vai pra tela junto dos passos
    }
    if (!a.conta) {
      a.erro = erroContas;
      await gravar();
      return status();
    }
    // a conta desta leitura: se ela mudar no meio (conectar de novo), o resultado é de outra conta e não grava
    const conta = a.conta;
    const d = await instagram.dados();
    const midias = [...lista(d?.proprios), ...lista(d?.postsProprios)].filter((m) => m?.midiaId);
    const porId = new Map(midias.map((m) => [String(m.midiaId), m]));

    const brutos = [];
    let after;
    let paginas = 0;
    do {
      const r = await usuario(`${conta.id}/ads`, { fields: CAMPOS_ANUNCIO, limit: '100', after });
      brutos.push(...lista(r?.data).filter((x) => x?.id != null));
      after = r?.paging?.next ? r?.paging?.cursors?.after : undefined;
    } while (after && ++paginas < TETO_PAGINAS);
    const anuncios = brutos.slice(0, LIMITE_ANUNCIOS).map((x) => anuncioDe(x, midiaDo(x, porId, midias)));

    let limitado = null;
    const falharam = new Set();
    const ligados = anuncios.filter((x) => x.midiaId);
    const leituras = await instagram.emLotes(ligados, 3, async (ad) => {
      if (limitado) {
        falharam.add(ad.midiaId);
        return null;
      }
      try {
        const base = { date_preset: 'maximum' };
        const totais = lerTotaisAnuncio(await usuario(`${ad.adId}/insights`, { ...base, fields: CAMPOS_TOTAIS }));
        const idadeGenero = lerQuebraAnuncio(await usuario(`${ad.adId}/insights`, { ...base, fields: 'reach,impressions', breakdowns: 'age,gender', limit: '200' }));
        const regioes = lerQuebraAnuncio(await usuario(`${ad.adId}/insights`, { ...base, fields: 'reach,impressions', breakdowns: 'region', limit: '200' }));
        return { adId: ad.adId, midiaId: ad.midiaId, totais, idadeGenero, regioes };
      } catch (e) {
        if (instagram.ehTokenRuim(e)) throw e;
        if (limite(e)) limitado ??= e.message;
        falharam.add(ad.midiaId);
        return null;
      }
    });

    // a conta mudou durante a leitura: nada desta rodada vai pro arquivo (misturaria as duas contas)
    if (a.conta?.id !== conta.id) return status();
    const em = agora();
    const porMidia = new Map();
    for (const l of leituras.filter(Boolean)) {
      if (!porMidia.has(l.midiaId)) porMidia.set(l.midiaId, []);
      porMidia.get(l.midiaId).push(l);
    }
    for (const [midiaId, ls] of porMidia) {
      // um anúncio do post falhou: fica a leitura anterior (a soma sem ele engana); sem anterior, entra com aviso
      if (falharam.has(midiaId) && a.porPost[midiaId]) continue;
      a.porPost[midiaId] = { ...agregarAnuncios(ls, em), ...(falharam.has(midiaId) ? { aviso: 'parte dos anúncios deste post não foi lida' } : {}) };
    }
    a.anuncios = anuncios;
    a.lidoEm = em;
    const nFalhas = falharam.size;
    a.erro = limitado
      ? `${limitado} Parte dos anúncios ficou com a leitura anterior.`
      : nFalhas
        ? `A Meta não devolveu os números de ${nFalhas === 1 ? '1 post com anúncio' : `${nFalhas} posts com anúncio`}: ficou a leitura anterior.`
        : null;
    await gravar();
    return status();
  } catch (e) {
    if (instagram.ehTokenRuim?.(e)) {
      a.erro = 'A Meta recusou o token dos anúncios. Gere um token novo com ads_read e conecte de novo.';
      await gravar();
      throw falha(400, a.erro);
    }
    if (limite(e)) {
      a.erro = e.message;
      await gravar();
    }
    throw e;
  }
}

// anuncios.porPost (cópia)
export async function porPost() {
  return structuredClone((await ler()).porPost);
}
