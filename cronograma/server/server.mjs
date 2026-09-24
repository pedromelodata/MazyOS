// Servidor local da Gestão de Marketing (o antigo Cronograma de Reels, SPEC v2 §5). Só escuta em 127.0.0.1;
// o acesso de fora chega pelo túnel da Cloudflare (cloudflared → localhost), então todo pedido passa pelo
// login (auth.mjs).
// Decisões fora do SPEC, anotadas aqui:
//  - Host precisa ser localhost/127.0.0.1, um de PUBLIC_HOSTS ou *.trycloudflare.com (anti DNS
//    rebinding) e escrita vinda de outra origem é recusada: a API roda o Claude com a conta logada
//  - sem sessão: página vai pra /entrar?volta=..., o resto é 401. Só a tela de entrar, as logos e o link
//    único (/api/auth/convite, convites.mjs) são livres
//  - 23/09: conta nova e senha esquecida só por link único. POST /api/usuarios (senha temporária) e
//    POST /api/auth/primeiro (primeira conta) saíram: 410
//  - host público visitado por http (Cf-Visitor / X-Forwarded-Proto): GET e HEAD vão pra https (308), o resto é 403
//  - criadoPor / atualizadoPor (nome de quem entrou) são do servidor: o corpo não mexe
//  - apagar formato com case pendurado dá 409 (o case é a prova do formato, não some calado)
//  - reel.ideiaId é a verdade; ideia.reelId aponta pro reel mais recente da ideia (repontarIdeia)
//  - o mesmo post (mídia, link ou reel) nunca vira dois cases: 409
//  - reel.origem e reel.origemChat são do servidor (importar.mjs e salvar_reel): o corpo não mexe
//  - config só aceita as chaves conhecidas
//  - reel tem tipo (viralizacao | vendas | conexao | ensino | null), gravacao (só as chaves conhecidas) e fontes
//  - POST /api/reels/lote cria vários reels de uma vez (tipo, data e formato obrigatórios). Mesma
//    data + mesmo título (ou mesma ideia) de um reel que já existe = duplicado: não cria gêmeo
//  - edição na tela regrava o reel.md que o próprio cronograma gerou (o escrito à mão fica)
//  - 23/09: /api/estado leva o guia do nicho (estilos, temas, tipos). Ideia tem tipo, tema (id do guia
//    ou rótulo), estiloGancho e roteiroBase; na tela ela ganha temaNome (calculado, não volta pro banco).
//    Formato tem tipos (pra que tipos serve)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  APP, DATA_DIR, carregar, salvar, statusFormato, falha, novoId, agora, hoje, repontarIdeia, mesmoPost,
  LIMIAR_RELATIVO, MIN_CASES_ACIMA, TIPOS_REEL, ROTULO_TIPO, ICONE_TIPO, guia, nomeTema, limparTiposFormato, gravacaoVazia,
} from './db.mjs';
import {
  semCampos, conferirRefs, refsVazias, conferirReel, mesmoReel, reelDoLote, limparIdeia, ideiaPadrao,
} from './validar.mjs';
import { RAIZ } from './importar.mjs';
import { CAMPANHA_PADRAO } from './migrar.mjs';
import { conversar, conferirPedidoChat } from './agente.mjs';
import { escreverReelMd, regravarSeGerado } from './reelmd.mjs';
import { gerarIdeias } from './ideias-ia.mjs';
import * as instagram from './instagram.mjs';
import * as auth from './auth.mjs';
import * as convites from './convites.mjs';

const PORTA = auth.PORTA;

const PUBLICO = path.join(APP, 'public');
// tokens.css e logos vêm direto do design system, não são cópia: mudou lá, muda aqui
const ESTATICOS = {
  '/tokens.css': path.join(RAIZ, 'identidade', 'tokens.css'),
  '/simbolo.svg': path.join(RAIZ, 'identidade', 'logos', 'simbolo.svg'),
  '/logo-clara.svg': path.join(RAIZ, 'identidade', 'logos', 'legalizai-logo-negativa-clara.svg'),
  '/logo.svg': path.join(RAIZ, 'identidade', 'logos', 'legalizai-logo-horizontal.svg'),
  '/favicon.ico': path.join(APP, 'deploy', 'cronograma.ico'),
  // tela de entrar: a única página que abre sem sessão
  '/entrar': path.join(APP, 'public', 'entrar.html'),
  '/css/entrar.css': path.join(APP, 'public', 'css', 'entrar.css'),
  '/js/entrar.js': path.join(APP, 'public', 'js', 'entrar.js'),
};
// sem sessão, só isto responde (caminho exato, sem decodificar)
const API_PUBLICA = new Set(['GET /api/auth/estado', 'POST /api/auth/entrar', 'GET /api/auth/convite', 'POST /api/auth/convite']);
// rotas que saíram: respondem 410 pra qualquer um (a tela antiga mostra o motivo em vez de um 401)
const REMOVIDAS = new Map([
  ['POST /api/auth/primeiro', 'A primeira conta agora nasce por link único. Neste computador: npm run usuario convite'],
]);
// quem está com senha temporária só fala com estas até trocar
const LIVRES_COM_SENHA_TEMPORARIA = new Set(['/api/auth/estado', '/api/auth/senha', '/api/auth/sair']);
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const ORIGENS_CASE = ['nosso', 'nicho', 'manual'];
const CALCULADOS = ['status', 'via', 'acima', 'casesCount'];
const CHAVES_CONFIG = ['nomeUsuario', 'metaMensal', 'handleInstagram', 'contasReferencia', 'hashtags'];
const AUDITORIA = ['criadoPor', 'atualizadoPor'];
const autor = (req) => req.auth?.usuario?.nome ?? null;
// o que aparece no reel.md: mudou algum destes na tela, o arquivo gerado é regravado
const CAMPOS_DO_MD = ['ideia', 'tema', 'tipo', 'data', 'formatoId', 'ideiaId', 'campanhaId', 'roteiro', 'legenda', 'gravacao', 'fontes'];
const MAX_LOTE = 60;
// campos do tema que a tela recebe (fatos com fontes: o painel da ideia mostra)
const CAMPOS_TEMA = ['id', 'nome', 'publico', 'dor', 'pilar', 'fatos', 'fontes', 'sazonal'];

const json = (res, codigo, corpo) => {
  res.writeHead(codigo, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(corpo));
};

// junta os pedaços e decodifica uma vez só: acento cortado entre dois pedaços não vira �
async function corpoJson(req, limite = 1_000_000) {
  const partes = [];
  let total = 0;
  for await (const c of req) {
    total += c.length;
    if (total > limite) throw falha(413, 'Corpo grande demais.');
    partes.push(c);
  }
  const s = Buffer.concat(partes, total).toString('utf8');
  if (!s.trim()) return {};
  try {
    const b = JSON.parse(s);
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error();
    return b;
  } catch {
    throw falha(400, 'JSON inválido no corpo da requisição.');
  }
}

const numOuNull = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

// aceita array ou texto separado por vírgula/espaço/linha; tira @ ou # e repetidos
function listaLimpa(v, prefixo) {
  const itens = Array.isArray(v) ? v : String(v ?? '').split(/[\s,;]+/);
  return [...new Set(itens.map((s) => String(s).trim().replace(prefixo, '').trim()).filter(Boolean))];
}

// a proveniência dos formatos da biblioteca fica só no banco: pro navegador vai "validado" e nada mais
const neutro = (v) => (v === 'curadoria' ? 'biblioteca' : v);
function formatoParaTela(f, calc) {
  const { referencia, ...resto } = f;
  return {
    ...resto,
    origem: neutro(f.origem),
    // mesmo índice do banco: o DELETE de evidência usa ?i=N
    evidencias: (f.evidencias ?? []).map((e) => (e.tipo === 'curadoria' ? { tipo: 'interna' } : e)),
    ...calc,
    via: neutro(calc.via),
  };
}
const ideiaParaTela = (i) => ({ ...i, origem: neutro(i.origem), temaNome: nomeTema(i.tema) });

async function estado() {
  const db = await carregar();
  const porFormato = new Map();
  for (const c of db.cases) porFormato.set(c.formatoId, (porFormato.get(c.formatoId) ?? 0) + 1);
  // montado campo a campo: o cache pesado de mídias e qualquer credencial ficam de fora
  return {
    schemaVersion: db.schemaVersion,
    config: db.config,
    pilares: db.pilares,
    campanhas: db.campanhas,
    formatos: db.formatos.map((f) => formatoParaTela(f, { ...statusFormato(f, db.cases), casesCount: porFormato.get(f.id) ?? 0 })),
    cases: db.cases,
    ideias: db.ideias.map(ideiaParaTela),
    reels: db.reels,
    regraValidacao: { limiarRelativo: LIMIAR_RELATIVO, minCasesAcima: MIN_CASES_ACIMA },
    instagram: await instagram.status(),
    // guia do nicho (data/estilos.json): os 3 estilos, os temas com fatos e fontes, e os tipos de reel
    estilos: guia().estilos,
    temas: guia().temas.map((t) => Object.fromEntries(CAMPOS_TEMA.map((k) => [k, t[k] ?? (['fatos', 'fontes'].includes(k) ? [] : null)]))),
    tipos: TIPOS_REEL.map((id) => ({ id, rotulo: ROTULO_TIPO[id], icone: ICONE_TIPO[id], estilo: Object.hasOwn(guia().estilos, id) })),
  };
}

const comStatus = (db, f) => formatoParaTela(f, { ...statusFormato(f, db.cases), casesCount: db.cases.filter((c) => c.formatoId === f.id).length });
const paraTela = (db, recurso, item) => (recurso === 'formatos' ? comStatus(db, item) : recurso === 'ideias' ? ideiaParaTela(item) : item);

// ---------- validação e padrões por coleção (reel e ideia em validar.mjs) ----------

function limparCase(b) {
  const c = { ...b };
  for (const k of ['views', 'likes', 'comments', 'saved', 'shares', 'relativo']) if (k in c) c[k] = numOuNull(c[k]);
  if ('origem' in c && !ORIGENS_CASE.includes(c.origem)) throw falha(400, 'origem do case precisa ser nosso, nicho ou manual.');
  if ('midiaId' in c) c.midiaId = c.midiaId == null || c.midiaId === '' ? null : String(c.midiaId);
  return c;
}

// o mesmo post nunca vira dois cases: um reel só não pode validar um formato
function conferirCaseRepetido(db, b, excetoId = null) {
  const dup = instagram.caseDoPost(db, { midiaId: b.midiaId, permalink: b.permalink, reelId: b.reelId }, excetoId);
  if (!dup) return;
  const f = db.formatos.find((x) => x.id === dup.formatoId);
  throw falha(409, `Esse reel já é case do formato ${f?.codigo || dup.formatoId}.`);
}

// case novo liga a mídia do cache (Métricas / Inspirações) e herda o midiaId dela
function ligarCaseMidia(db, c) {
  for (const m of [...(db.instagram?.proprios ?? []), ...(db.instagram?.inspiracoes ?? [])]) {
    if ((c.midiaId && m.midiaId === c.midiaId) || mesmoPost(m.permalink, c.permalink)) {
      if (!m.caseId) m.caseId = c.id;
      c.midiaId ??= m.midiaId;
    }
  }
}

const NOVO = {
  reels: (b, db) => {
    const limpo = conferirReel(b);
    conferirRefs(db, limpo);
    return {
      ideia: '', tema: '', pilar: null, formatoId: null, campanhaId: CAMPANHA_PADRAO, data: '', status: 'ideia',
      roteiro: { hook: '', textoTela: '', cenas: [], desenvolvimento: '', cta: '' }, legenda: '', permalink: '',
      metricas: null, ideiaId: null, favorito: false, tipo: null, gravacao: gravacaoVazia(), fontes: [], ...limpo, criadoEm: agora(),
    };
  },
  ideias: (b, db) => {
    if (!String(b.titulo ?? '').trim()) throw falha(400, 'A ideia precisa de um título.');
    const limpo = limparIdeia(b);
    conferirRefs(db, limpo);
    return { ...ideiaPadrao(), ...limpo, criadaEm: agora() };
  },
  formatos: (b, db) => {
    if (!String(b.nome ?? '').trim()) throw falha(400, 'O formato precisa de um nome.');
    const n = Math.max(0, ...db.formatos.map((f) => (String(f.codigo).startsWith('T.') ? Number(String(f.codigo).slice(2)) || 0 : 0)));
    return {
      codigo: `T.${n + 1}`, categoria: 'Nossos testes', nome: '', formula: '', descricao: '', publico: 'MEI + ME', duracao: '',
      estrutura: [], exemplo: { titulo: '', gancho: '', tela: '', destaque: '' }, referencia: null, origem: 'teste', fontes: [],
      ...semCampos(b, [...CALCULADOS, 'evidencias']), tipos: limparTiposFormato(b.tipos), evidencias: [], criadoEm: agora(),
    };
  },
  cases: (b, db) => {
    if (!db.formatos.some((f) => f.id === b.formatoId)) throw falha(400, 'O case precisa estar pendurado num formato da biblioteca.');
    conferirRefs(db, b);
    const c = limparCase(b);
    conferirCaseRepetido(db, c);
    return {
      formatoId: b.formatoId, titulo: '', conta: '', origem: 'manual', permalink: '', thumb: '', views: null, likes: null,
      comments: null, saved: null, shares: null, relativo: null, data: hoje(), notas: '', midiaId: null, reelId: null,
      ...c, criadoEm: agora(),
    };
  },
};
const PREFIXO = { reels: 'reel', ideias: 'ide', formatos: 'fmt', cases: 'case' };

function validarEdicao(recurso, b, db, item) {
  if (recurso === 'reels') b = conferirReel(b, item);
  if (recurso === 'ideias') b = limparIdeia(b, item);
  if (recurso === 'formatos' && 'tipos' in b) b.tipos = limparTiposFormato(b.tipos);
  if (recurso === 'cases' && 'formatoId' in b && !db.formatos.some((f) => f.id === b.formatoId)) throw falha(400, 'O case precisa estar pendurado num formato da biblioteca.');
  conferirRefs(db, recurso === 'cases' ? semCampos(b, ['formatoId']) : b);
  let limpo = semCampos(b, ['id', 'criadoEm', 'criadaEm', 'atualizadoEm', ...AUDITORIA]);
  if (recurso === 'formatos') limpo = semCampos(limpo, [...CALCULADOS, 'evidencias']); // evidência só pela rota própria
  if (recurso === 'cases') {
    limpo = limparCase(limpo);
    if (['midiaId', 'permalink', 'reelId'].some((k) => k in limpo)) conferirCaseRepetido(db, { ...item, ...limpo }, item.id);
  }
  return limpo;
}

// reel.ideiaId <-> ideia.reelId
function ligarIdeia(db, reel, ideiaIdAntiga) {
  if (ideiaIdAntiga && ideiaIdAntiga !== reel.ideiaId) {
    const velha = db.ideias.find((i) => i.id === ideiaIdAntiga);
    if (velha?.reelId === reel.id) repontarIdeia(db, velha.id, reel.id);
  }
  const nova = reel.ideiaId && db.ideias.find((i) => i.id === reel.ideiaId);
  if (nova) nova.reelId = reel.id;
}
function ligarReel(db, ideia, reelIdAntigo) {
  if (reelIdAntigo && reelIdAntigo !== ideia.reelId) {
    const velho = db.reels.find((r) => r.id === reelIdAntigo);
    if (velho?.ideiaId === ideia.id) velho.ideiaId = null;
  }
  const novo = ideia.reelId && db.reels.find((r) => r.id === ideia.reelId);
  if (novo) {
    // o reel deixa a ideia de antes: ela volta pra outro reel dela (ou fica sem)
    const dono = novo.ideiaId;
    novo.ideiaId = ideia.id;
    if (dono && dono !== ideia.id) repontarIdeia(db, dono, novo.id);
  }
}

async function crud(req, res, recurso, id) {
  const db = await carregar();
  const lista = db[recurso];

  if (req.method === 'POST' && !id) {
    const b = refsVazias(await corpoJson(req));
    const item = { id: novoId(PREFIXO[recurso]), ...NOVO[recurso](semCampos(b, ['id', ...AUDITORIA]), db), criadoPor: autor(req) };
    lista.push(item);
    if (recurso === 'reels') ligarIdeia(db, item, null);
    if (recurso === 'ideias') ligarReel(db, item, null);
    if (recurso === 'cases') ligarCaseMidia(db, item);
    await salvar();
    return json(res, 201, paraTela(db, recurso, item));
  }

  const item = id && lista.find((x) => x.id === id);
  if (!item) return json(res, 404, { erro: 'Não encontrado.' });

  if (req.method === 'PUT') {
    const b = validarEdicao(recurso, refsVazias(await corpoJson(req)), db, item);
    const antes = { ideiaId: item.ideiaId, reelId: item.reelId };
    // só favoritar não conta como edição: o card não pula pro topo nem vira "editado hoje"
    const soFavorito = Object.keys(b).length > 0 && Object.keys(b).every((k) => k === 'favorito' || k === 'favorita');
    Object.assign(item, b, soFavorito ? {} : { atualizadoEm: agora(), atualizadoPor: autor(req) });
    if (recurso === 'reels' && 'ideiaId' in b) ligarIdeia(db, item, antes.ideiaId);
    if (recurso === 'ideias' && 'reelId' in b) ligarReel(db, item, antes.reelId);
    await salvar();
    // texto do reel mudou na tela: o reel.md gerado acompanha (falha no arquivo não desfaz a edição)
    if (recurso === 'reels' && CAMPOS_DO_MD.some((k) => k in b)) {
      await regravarSeGerado(item).catch((e) => console.error(`reel.md de ${item.id} não foi regravado:`, e.message));
    }
    return json(res, 200, paraTela(db, recurso, item));
  }

  if (req.method === 'DELETE') {
    if (recurso === 'formatos') {
      const n = db.cases.filter((c) => c.formatoId === id).length;
      if (n) return json(res, 409, { erro: `Esse formato tem ${n} ${n === 1 ? 'case' : 'cases'}. Mova ou apague os cases antes.` });
      for (const x of [...db.reels, ...db.ideias]) if (x.formatoId === id) x.formatoId = null;
    }
    if (recurso === 'reels') {
      // a ideia volta pro outro reel dela que ainda existe, se houver
      for (const i of db.ideias) if (i.reelId === id) repontarIdeia(db, i.id, id);
      for (const c of db.cases) if (c.reelId === id) c.reelId = null;
    }
    if (recurso === 'ideias') for (const r of db.reels) if (r.ideiaId === id) r.ideiaId = null;
    if (recurso === 'cases') for (const m of [...db.instagram.proprios, ...db.instagram.inspiracoes]) if (m.caseId === id) m.caseId = null;
    lista.splice(lista.indexOf(item), 1);
    await salvar();
    return json(res, 200, { ok: true });
  }
  return json(res, 405, { erro: 'Método não permitido.' });
}

// ---------- lote de reels (POST /api/reels/lote; validação em validar.mjs) ----------

// tudo ou nada na validação: um item com problema e nada é criado (400 com a lista).
// Duplicado de reel que já existe não vira gêmeo: fica de fora e volta em "duplicados";
// se todos forem duplicados, 409. Criação num save só; depois o reel.md de cada um
async function lote(req, res) {
  const b = await corpoJson(req, 5_000_000);
  if (!Array.isArray(b.reels) || !b.reels.length) throw falha(400, 'Mande { "reels": [ ... ] } com pelo menos um reel.');
  if (b.reels.length > MAX_LOTE) throw falha(400, `No máximo ${MAX_LOTE} reels por lote.`);
  const db = await carregar();
  const problemas = [];
  const validos = [];
  b.reels.forEach((bruto, indice) => {
    try {
      const r = reelDoLote(db, bruto);
      const igual = validos.find((v) => mesmoReel(v.r, r));
      if (igual) throw falha(400, `repete o reel de índice ${igual.indice} deste lote (mesma data e mesmo título ou mesma ideia).`);
      validos.push({ indice, r });
    } catch (e) {
      if (!e.status) throw e;
      problemas.push({ indice, data: bruto?.data ?? null, ideia: bruto?.ideia ?? null, erro: e.message });
    }
  });
  if (problemas.length) {
    const n = problemas.length;
    return json(res, 400, { erro: `${n} ${n === 1 ? 'reel tem' : 'reels têm'} problema. Nada foi criado.`, problemas });
  }

  const duplicados = [];
  const novos = [];
  for (const { indice, r } of validos) {
    const existente = db.reels.find((x) => mesmoReel(x, r));
    if (existente) duplicados.push({ indice, data: r.data, ideia: r.ideia, reelId: existente.id });
    else novos.push({ indice, reel: { id: novoId('reel'), ...r, criadoPor: autor(req) } });
  }
  if (!novos.length) {
    return json(res, 409, { erro: 'Esses reels já estão no cronograma (mesma data e mesmo título). Nada foi criado.', criados: [], duplicados, avisos: [] });
  }

  for (const { reel } of novos) {
    db.reels.push(reel);
    ligarIdeia(db, reel, null);
  }
  await salvar();

  const criados = [];
  const avisos = [];
  for (const { indice, reel } of novos) {
    let arquivo = null;
    try {
      await escreverReelMd(reel, { adiar: true });
      arquivo = reel.origem ?? null;
    } catch (e) {
      avisos.push({ indice, reelId: reel.id, erro: `O reel entrou no cronograma, mas o reel.md não foi escrito: ${e.message}` });
    }
    criados.push({ indice, id: reel.id, data: reel.data, tipo: reel.tipo, ideia: reel.ideia, arquivo });
  }
  await salvar(); // origem (caminho do reel.md) de cada reel novo
  return json(res, 201, { criados, duplicados, avisos });
}

async function evidencias(req, res, id, url) {
  const db = await carregar();
  const f = db.formatos.find((x) => x.id === id);
  if (!f) return json(res, 404, { erro: 'Esse formato não existe.' });
  f.evidencias ??= [];
  if (req.method === 'POST') {
    const e = await corpoJson(req);
    const relativo = numOuNull(e.relativo);
    if (!String(e.fonte ?? '').trim() || !(String(e.valor ?? '').trim() || relativo != null)) {
      return json(res, 400, { erro: 'A evidência precisa de número (valor ou relativo) e de fonte.' });
    }
    const nova = { tipo: e.tipo || 'benchmark', valor: String(e.valor ?? '').trim(), fonte: String(e.fonte).trim() };
    if (relativo != null) nova.relativo = relativo;
    if (e.data) nova.data = e.data;
    nova.registradaEm = hoje();
    f.evidencias.push(nova);
  } else if (req.method === 'DELETE') {
    // ?i ausente, vazio ou torto não vira 0 (apagaria a evidência da curadoria)
    const bruto = url.searchParams.get('i');
    if (bruto == null || !/^\d+$/.test(bruto)) return json(res, 400, { erro: 'Informe o índice da evidência (?i=N).' });
    const i = Number(bruto);
    if (!f.evidencias[i]) return json(res, 400, { erro: 'Essa evidência não existe.' });
    f.evidencias.splice(i, 1);
  } else return json(res, 405, { erro: 'Método não permitido.' });
  f.atualizadoEm = agora();
  await salvar();
  return json(res, 200, comStatus(db, f));
}

async function rotaInstagram(req, res, acao, url) {
  const m = req.method;
  if (acao === 'dados' && m === 'GET') return json(res, 200, await instagram.dados());
  if (acao === 'token' && m === 'POST') return json(res, 200, await instagram.conectarPorToken((await corpoJson(req)).token));
  if (acao === 'login' && m === 'GET') {
    res.writeHead(302, { location: instagram.urlLogin(), 'cache-control': 'no-store' });
    return res.end();
  }
  if (acao === 'callback' && m === 'GET') {
    try {
      await instagram.callback(url.searchParams);
    } catch (e) {
      console.error('Login do Facebook falhou:', e.message);
      // callback que não veio de um login nosso (state ausente ou desconhecido) não grava nada
      if (!e.silencioso) await instagram.registrarErro(e.message);
    }
    res.writeHead(302, { location: '/#/instagram/metricas', 'cache-control': 'no-store' });
    return res.end();
  }
  if (acao === 'desconectar' && m === 'POST') return json(res, 200, await instagram.desconectar());
  if (acao === 'sincronizar' && m === 'POST') return json(res, 200, await instagram.sincronizar(await corpoJson(req)));
  if (acao === 'para-biblioteca' && m === 'POST') return json(res, 201, await instagram.paraBiblioteca(await corpoJson(req), autor(req)));
  if (acao === 'para-ideia' && m === 'POST') return json(res, 201, await instagram.paraIdeia(await corpoJson(req), autor(req)));
  return json(res, 404, { erro: 'Rota não existe.' });
}

async function api(req, res, url) {
  let partes;
  try {
    partes = url.pathname.split('/').filter(Boolean).slice(1).map(decodeURIComponent); // tira "api"
  } catch {
    return json(res, 400, { erro: 'Endereço inválido.' });
  }
  const [recurso, id, sub] = partes;
  const m = req.method;

  if (recurso === 'auth' && id === 'convite' && partes.length === 2) return convites.rotaConvitePublica(req, res, url, { json, corpoJson });
  if (recurso === 'auth' && partes.length <= 2) return auth.rotaAuth(req, res, id, req.auth, { json, corpoJson });
  if (recurso === 'usuarios' && partes.length <= 3) return convites.rotaUsuarios(req, res, id, sub, req.auth, { json, corpoJson });
  if (recurso === 'convites' && partes.length <= 2) return convites.rotaConvites(req, res, id, req.auth, { json, corpoJson });

  if (recurso === 'estado' && m === 'GET') return json(res, 200, await estado());

  if (recurso === 'config' && m === 'PUT') {
    const db = await carregar();
    const b = Object.fromEntries(Object.entries(await corpoJson(req)).filter(([k]) => CHAVES_CONFIG.includes(k)));
    for (const k of ['nomeUsuario', 'handleInstagram']) {
      if (k in b && b[k] != null && typeof b[k] !== 'string') throw falha(400, `${k} precisa ser texto.`);
    }
    if ('nomeUsuario' in b) b.nomeUsuario = String(b.nomeUsuario ?? '').trim().slice(0, 40) || 'Pedro';
    if ('contasReferencia' in b) b.contasReferencia = listaLimpa(b.contasReferencia, /^@/);
    if ('hashtags' in b) b.hashtags = listaLimpa(b.hashtags, /^#/);
    if ('handleInstagram' in b) b.handleInstagram = String(b.handleInstagram ?? '').trim().replace(/^@/, '');
    if ('metaMensal' in b) b.metaMensal = Math.max(0, Math.round(Number(b.metaMensal) || 0));
    db.config = { ...db.config, ...b };
    await salvar();
    return json(res, 200, db.config);
  }

  // { tipo: viralizacao | vendas | conexao, tema?, formatoId?, quantidade? } (ideias-ia.mjs)
  if (recurso === 'ideias' && id === 'gerar' && m === 'POST') {
    const b = await corpoJson(req);
    const r = await gerarIdeias(b, { autor: autor(req) });
    return json(res, 200, { ...r, ideias: r.ideias.map(ideiaParaTela) });
  }

  if (recurso === 'formatos' && id && sub === 'evidencias') return evidencias(req, res, id, url);

  if (recurso === 'reels' && id === 'lote' && !sub) {
    if (m !== 'POST') return json(res, 405, { erro: 'Método não permitido.' });
    return lote(req, res);
  }

  // hasOwn: __proto__, constructor e cia. não são coleção (caem no 404)
  if (Object.hasOwn(PREFIXO, recurso) && !sub) return crud(req, res, recurso, id);

  if (recurso === 'campanhas' && id && m === 'PUT') {
    const db = await carregar();
    const c = db.campanhas.find((x) => x.id === id);
    if (!c) return json(res, 404, { erro: 'Essa campanha não existe.' });
    Object.assign(c, semCampos(await corpoJson(req), ['id', ...AUDITORIA]), { atualizadoEm: agora(), atualizadoPor: autor(req) });
    await salvar();
    return json(res, 200, c);
  }

  // POST /api/chat: stream SSE da conversa com a skill
  if (recurso === 'chat' && m === 'POST') {
    const b = await corpoJson(req);
    // reel novo sem dia ou sem tipo: 400 em JSON, antes de abrir o stream
    conferirPedidoChat(b, await carregar());
    res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', connection: 'keep-alive' });
    // aba fechada ou recarregada no meio da resposta: o turno do agente para (não segue gastando).
    // res e não req: req emite 'close' assim que o corpo foi lido
    const ac = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) ac.abort();
    });
    const emitir = (ev) => {
      if (!res.writableEnded && !ac.signal.aborted) res.write(`data: ${JSON.stringify(ev)}\n\n`);
    };
    // pelo túnel da Cloudflare, resposta parada por 100 s cai (524): comentário SSE mantém a linha viva
    res.write(': ok\n\n');
    const pulso = setInterval(() => {
      if (!res.writableEnded && !ac.signal.aborted) res.write(': ping\n\n');
    }, 20_000);
    try {
      await conversar(b, emitir, ac, autor(req));
    } catch (e) {
      if (!ac.signal.aborted) emitir({ type: 'error', message: e.message });
    } finally {
      clearInterval(pulso);
    }
    return res.end();
  }

  if (recurso === 'instagram') return rotaInstagram(req, res, id, url);

  return json(res, 404, { erro: 'Rota não existe.' });
}

async function estatico(req, res, url) {
  if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { erro: 'Método não permitido.' });
  let caminho;
  try {
    caminho = decodeURIComponent(url.pathname);
  } catch {
    return json(res, 400, { erro: 'Endereço inválido.' });
  }
  if (caminho.includes('\0')) return json(res, 400, { erro: 'Endereço inválido.' });
  let arquivo = ESTATICOS[caminho];
  if (!arquivo) {
    arquivo = path.resolve(PUBLICO, '.' + (caminho === '/' ? '/index.html' : caminho));
    if (!arquivo.startsWith(PUBLICO + path.sep)) return json(res, 403, { erro: 'Acesso negado.' });
  }
  const conteudo = await readFile(arquivo);
  res.writeHead(200, {
    'content-type': TIPOS[path.extname(arquivo).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-cache',
  });
  res.end(req.method === 'HEAD' ? undefined : conteudo);
}

// navegador abrindo uma página (e não fetch de script, css ou API)
function pedePagina(req, url) {
  if (!['GET', 'HEAD'].includes(req.method)) return false;
  const destino = req.headers['sec-fetch-dest'];
  if (destino) return ['document', 'iframe', 'frame'].includes(destino);
  if (String(req.headers.accept ?? '').includes('text/html')) return true;
  const ext = path.extname(url.pathname).toLowerCase();
  return !ext || ext === '.html';
}

// volta = caminho relativo deste site (nunca //outro-site nem /\outro-site)
function paraEntrar(res, url) {
  let volta = url.pathname + url.search;
  if (!/^\/(?![/\\])/.test(volta) || volta.length > 512 || volta.startsWith('/entrar')) volta = '/';
  res.writeHead(302, { location: `/entrar?volta=${encodeURIComponent(volta)}`, 'cache-control': 'no-store' });
  res.end();
}

const servidor = http.createServer(async (req, res) => {
  try {
    auth.cabecalhosSeguranca(req, res);
    const host = auth.hostDe(req);
    if (!auth.hostPermitido(host)) return json(res, 403, { erro: `Endereço não permitido. Abra por http://localhost:${PORTA} ou pelo link público da Gestão de Marketing.` });
    const url = new URL(req.url, `http://${host}`);
    // link público aberto por http://: página sobe pra https, escrita nem é lida (senha em texto claro)
    if (!auth.hostLocal(host) && auth.protocoloVisitante(req) === 'http') {
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 403, { erro: `Use o endereço com https://${host}` });
      res.writeHead(308, { location: `https://${host}${url.pathname}${url.search}`, 'cache-control': 'no-store' });
      return res.end();
    }
    const ehApi = url.pathname.startsWith('/api/');
    if (ehApi && !['GET', 'HEAD'].includes(req.method) && !auth.origemPermitida(req)) return json(res, 403, { erro: 'Origem não permitida.' });

    if (ehApi && REMOVIDAS.has(`${req.method} ${url.pathname}`)) return json(res, 410, { erro: REMOVIDAS.get(`${req.method} ${url.pathname}`) });
    req.auth = await auth.sessaoDe(req, res);
    const livre = ehApi
      ? API_PUBLICA.has(`${req.method} ${url.pathname}`)
      : ['GET', 'HEAD'].includes(req.method) && Object.hasOwn(ESTATICOS, url.pathname);
    if (!livre) {
      if (!req.auth) {
        if (!ehApi && pedePagina(req, url)) return paraEntrar(res, url);
        return json(res, 401, { erro: 'Entre com seu usuário e senha pra continuar.' });
      }
      if (ehApi && req.auth.usuario.trocarSenha && !LIVRES_COM_SENHA_TEMPORARIA.has(url.pathname)) {
        return json(res, 403, { erro: 'Troque a senha temporária antes de continuar.', trocarSenha: true });
      }
    }
    if (ehApi) return await api(req, res, url);
    return await estatico(req, res, url);
  } catch (e) {
    if (res.headersSent) return res.end();
    if (e.status) return json(res, e.status, { erro: e.message });
    if (['ENOENT', 'EISDIR', 'ENOTDIR'].includes(e.code)) return json(res, 404, { erro: 'Arquivo não encontrado.' });
    console.error(e);
    // detalhe só pra quem entrou: sem sessão não vê caminho de arquivo
    json(res, 500, { erro: req.auth ? `Erro interno: ${e.message}` : 'Erro interno.' });
  }
});

await carregar(); // migração v1 → v2 e merge da biblioteca antes de aceitar requisição
await auth.preparar();
auth.usuarios(); // usuarios.json ilegível derruba o boot aqui, não no primeiro login
servidor.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `A porta ${PORTA} já está em uso. Feche o outro servidor ou defina PORT no .env.` : e.message);
  process.exit(1);
});
// só na máquina local: de fora, só pelo túnel (que entrega em localhost) e com login
servidor.listen(PORTA, '127.0.0.1', () => {
  const publicos = auth.hostsPublicos();
  console.log(`Gestão de Marketing no ar: http://localhost:${PORTA} (dados em ${DATA_DIR})${publicos.length ? ` · público: ${publicos.map((h) => `https://${h}`).join(', ')}` : ''}`);
  if (!auth.usuarios().length) console.log('Nenhuma conta ainda: gere o link de acesso neste computador com npm run usuario convite');
});
