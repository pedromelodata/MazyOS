// Banco em arquivo JSON. Um arquivo só, legível por gente e pelo Claude,
// versionável no git. Escrita atômica (tmp + rename) pra não corromper.
// A pasta de dados pode ser trocada por CRONOGRAMA_DATA (caminho absoluto):
// é assim que os testes rodam numa cópia sem encostar no banco de verdade.
import { readFile, writeFile, rename, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export const APP = path.resolve(import.meta.dirname, '..');
// .env é carregado aqui (primeiro módulo importado pelo servidor) pra valer antes de qualquer leitura
if (existsSync(path.join(APP, '.env'))) process.loadEnvFile(path.join(APP, '.env'));

export const DATA_DIR = process.env.CRONOGRAMA_DATA ? path.resolve(process.env.CRONOGRAMA_DATA) : path.join(APP, 'data');
export const DB_PATH = path.join(DATA_DIR, 'db.json');
export const arquivoDados = (nome) => path.join(DATA_DIR, nome);

let cache = null;
let carregando = null;
let fila = Promise.resolve();

export async function carregar() {
  if (cache) return cache;
  // a migração (v1 → v2, merge da biblioteca e das ideias) roda uma vez por boot
  carregando ??= (async () => {
    await mkdir(DATA_DIR, { recursive: true });
    const { migrar } = await import('./migrar.mjs');
    cache = await migrar();
    return cache;
  })();
  return carregando;
}

// lê um JSON da pasta de dados; ausente, vazio ou quebrado (outro processo escrevendo) = padrao
export async function lerJson(nome, padrao = null) {
  try {
    const txt = await readFile(arquivoDados(nome), 'utf8');
    return txt.trim() ? JSON.parse(txt) : padrao;
  } catch {
    return padrao;
  }
}

async function trocar(tmp, destino) {
  // no Windows o rename falha de vez em quando se o antivírus ou o editor seguram o arquivo
  for (let i = 0; ; i++) {
    try {
      return await rename(tmp, destino);
    } catch (e) {
      if (i >= 4 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) throw e;
      await new Promise((r) => setTimeout(r, 60 * (i + 1)));
    }
  }
}

export async function gravarJson(nome, dados) {
  const destino = arquivoDados(nome);
  const tmp = `${destino}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(dados, null, 2), 'utf8');
  await trocar(tmp, destino);
}

export async function apagarJson(nome) {
  try {
    await unlink(arquivoDados(nome));
    return true;
  } catch (e) {
    if (e.code === 'ENOENT') return false;
    throw e;
  }
}

export function definir(db) {
  cache = db;
}

export function salvar() {
  // serializa as escritas: duas requisições simultâneas não se atropelam
  const proxima = fila.then(() => gravarJson('db.json', cache));
  fila = proxima.catch((e) => console.error('Falha ao gravar db.json:', e.message));
  return proxima;
}

// erro com status HTTP: o servidor devolve { erro } com esse código
export const falha = (status, mensagem) => Object.assign(new Error(mensagem), { status });

// travessão e meia-risca (regra dura de copy), montados por código pra nenhum aparecer no fonte
export const TRACOS = new RegExp(`\\s*[${String.fromCharCode(0x2014, 0x2013)}]\\s*`, 'g');

export const novoId = (prefixo) => `${prefixo}_${randomUUID().slice(0, 8)}`;
export const agora = () => new Date().toISOString();
// data local (Brasil), não UTC: às 22h de BH ainda é o mesmo dia
export const hoje = () => new Date().toLocaleDateString('sv-SE');

// AAAA-MM-DD que existe no calendário (2026-02-30 não passa), entre 2000 e 2100
export function dataValida(s) {
  const m = typeof s === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [a, me, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(a, me - 1, d));
  return a >= 2000 && a <= 2100 && dt.getUTCMonth() === me - 1 && dt.getUTCDate() === d;
}

// ---------- campos do reel: tipo (funil), gravação e fontes ----------
// a mesma forma no banco, no chat (salvar_reel), no lote e no reel.md.
// conexao = conexão e identificação (23/09): CTA suave, sem funil.
// conselho (24/09) = conselho direto ou reflexão de quem já viveu; CTA salvar, mandar ou seguir, sem funil
export const TIPOS_REEL = ['viralizacao', 'vendas', 'conexao', 'ensino', 'conselho'];
export const ROTULO_TIPO = { viralizacao: 'Viralização', vendas: 'Vendas', conexao: 'Conexão', ensino: 'Ensino', conselho: 'Conselho' };
export const ICONE_TIPO = { viralizacao: 'raio', vendas: 'alvo', conexao: 'coracao', ensino: 'livro', conselho: 'balao' };
// os tipos que têm guia de estilo em data/estilos.json (ensino e conselho não têm)
export const ESTILOS = ['viralizacao', 'vendas', 'conexao'];
export const GRAVACAO_TEXTO = ['duracao', 'quem', 'local', 'enquadramento', 'luz', 'audio', 'figurino', 'edicao'];
export const GRAVACAO_LISTA = ['objetos', 'broll', 'telasApp', 'checklist'];
export const gravacaoVazia = () => ({
  duracao: '', quem: '', local: '', enquadramento: '', luz: '', audio: '', figurino: '',
  objetos: [], broll: [], telasApp: [], edicao: '', checklist: [],
});
const LIM_TEXTO = 2000;
const LIM_ITEM = 500;
const LIM_ITENS = 40;

function texto(v, rotulo, lim = LIM_TEXTO) {
  if (v == null) return '';
  if (typeof v === 'number' || typeof v === 'boolean') v = String(v);
  if (typeof v !== 'string') throw falha(400, `${rotulo} precisa ser texto.`);
  return v.trim().slice(0, lim);
}

// lista de textos; texto solto vira uma linha por item (campo "um por linha" da tela)
function listaTexto(v, rotulo, lim = LIM_ITEM) {
  if (v == null || v === '') return [];
  const itens = typeof v === 'string' ? v.split(/\r?\n/) : v;
  if (!Array.isArray(itens)) throw falha(400, `${rotulo} precisa ser uma lista de textos.`);
  return itens
    .map((x, i) => texto(x, `${rotulo}[${i}]`, lim).replace(/^[-*•]\s+/, '').replace(/^\[[ xX]?\]\s*/, ''))
    .filter(Boolean)
    .slice(0, LIM_ITENS);
}

// só as chaves conhecidas; o que não veio fica como estava em `base` (edição parcial)
export function limparGravacao(v, base = null) {
  const g = gravacaoVazia();
  if (base && typeof base === 'object' && !Array.isArray(base)) {
    for (const k of GRAVACAO_TEXTO) if (typeof base[k] === 'string') g[k] = base[k];
    for (const k of GRAVACAO_LISTA) if (Array.isArray(base[k])) g[k] = base[k].filter((s) => typeof s === 'string');
  }
  if (v == null) return gravacaoVazia();
  if (typeof v !== 'object' || Array.isArray(v)) throw falha(400, 'gravacao precisa ser um objeto.');
  for (const k of GRAVACAO_TEXTO) if (k in v) g[k] = texto(v[k], `gravacao.${k}`);
  for (const k of GRAVACAO_LISTA) if (k in v) g[k] = listaTexto(v[k], `gravacao.${k}`);
  return g;
}

// fonte com link e trecho citado passa de 500 caracteres: corte só em 1.000
export const limparFontes = (v) => listaTexto(v, 'fontes', 1000);

export function conferirTipo(v) {
  if (v === '' || v == null) return null;
  if (!TIPOS_REEL.includes(v)) throw falha(400, `tipo precisa ser ${TIPOS_REEL.join(', ')} (ou vazio).`);
  return v;
}

export const textoCurto = (v, rotulo, lim = LIM_ITEM) => texto(v, rotulo, lim);

// ---------- guia do nicho (data/estilos.json, lido no boot pela migração) ----------
// estilos: o guia de cada tipo com estilo; temas: os temas do nicho com fatos e fontes;
// formatoTipos: pra que tipos cada formato da biblioteca serve; rotulosTema: nome de tela dos
// temas que as ideias usam como rótulo e que não têm ficha (sem fatos)
let guiaAtual = { estilos: {}, temas: [], formatoTipos: [], rotulosTema: {} };
export const guia = () => guiaAtual;
export function definirGuia(g) {
  guiaAtual = g;
}

// temas antigos do banco de ideias (v2 de 22/09): "fator-r" virou o tema da lista; "app" fica rótulo
export const TEMA_LEGADO = { 'fator-r': 'tm_fator_r' };
export const temaDoGuia = (id) => (typeof id === 'string' ? guiaAtual.temas.find((t) => t.id === id) ?? null : null);

export function nomeTema(id) {
  if (id == null || id === '') return null;
  const t = temaDoGuia(TEMA_LEGADO[id] ?? id);
  if (t) return t.nome;
  if (Object.hasOwn(guiaAtual.rotulosTema, id)) return guiaAtual.rotulosTema[id];
  // rótulo sem nome cadastrado: "tm_primeira_nota" vira "Primeira nota"
  const s = String(id).replace(/^tm_/, '').replace(/[_-]+/g, ' ').trim();
  return s ? s[0].toUpperCase() + s.slice(1) : null;
}

// tema da ideia: id de um tema do guia, um rótulo conhecido ou o que a ideia já tinha (edição)
export function conferirTema(v, atual = null) {
  if (v === '' || v == null) return null;
  if (typeof v !== 'string') throw falha(400, 'tema precisa ser o id de um tema do nicho.');
  const id = TEMA_LEGADO[v] ?? v.trim();
  if (temaDoGuia(id) || Object.hasOwn(guiaAtual.rotulosTema, id) || id === atual) return id;
  throw falha(400, 'Esse tema não existe na lista do nicho.');
}

// tipos que um formato serve: só os conhecidos, sem repetir, na ordem dada (o primeiro é o principal)
export function limparTiposFormato(v) {
  if (v == null || v === '') return [];
  const itens = typeof v === 'string' ? v.split(/[\s,;]+/).filter(Boolean) : v;
  if (!Array.isArray(itens) || itens.some((t) => !TIPOS_REEL.includes(t))) throw falha(400, `tipos só aceita ${TIPOS_REEL.join(', ')}.`);
  return [...new Set(itens)];
}

// roteiro base da ideia: o esqueleto que o chat usa de partida (hook, texto de tela, narração, CTA)
export const ROTEIRO_BASE = ['hook', 'textoTela', 'narracao', 'cta'];
export const roteiroBaseVazio = () => ({ hook: '', textoTela: '', narracao: '', cta: '' });
export function limparRoteiroBase(v, base = null) {
  const r = roteiroBaseVazio();
  if (base && typeof base === 'object' && !Array.isArray(base)) for (const k of ROTEIRO_BASE) if (typeof base[k] === 'string') r[k] = base[k];
  if (v == null) return roteiroBaseVazio();
  if (typeof v !== 'object' || Array.isArray(v)) throw falha(400, 'roteiroBase precisa ser um objeto {hook, textoTela, narracao, cta}.');
  for (const k of ROTEIRO_BASE) if (k in v) r[k] = texto(v[k], `roteiroBase.${k}`, k === 'narracao' ? 4000 : 600);
  return r;
}

// A regra que impede achismo na Biblioteca. Formato é VALIDADO com:
//  - 2+ cases (nossos ou do nicho) rendendo 1,5× ou mais a mediana de views da própria conta (via dado), ou
//  - 1 benchmark externo com número E fonte citável (via benchmark), ou
//  - curadoria com fonte (os 28 formatos da biblioteca; a UI mostra só "validado").
// Opinião, júri de IA e "todo mundo sabe" não contam.
export const LIMIAR_RELATIVO = 1.5;
export const MIN_CASES_ACIMA = 2;

// o mesmo post aparece como /reel/X, /reels/X, /p/X ou /usuario/reel/X
export function codigoPost(url) {
  const m = String(url ?? '').match(/instagram\.com\/(?:[^/?#]+\/)?(?:reels?|p|tv)\/([^/?#]+)/i);
  return m ? m[1] : String(url ?? '').split(/[?#]/)[0].replace(/\/+$/, '');
}
export const mesmoPost = (a, b) => Boolean(a && b) && codigoPost(a) === codigoPost(b);

// dois cases são o mesmo post se batem a mídia, o link ou o reel do cronograma
export const mesmoCase = (a, b) =>
  Boolean(a.midiaId && b.midiaId && String(a.midiaId) === String(b.midiaId)) || mesmoPost(a.permalink, b.permalink) || Boolean(a.reelId && a.reelId === b.reelId);

// "2+ cases" são 2 posts diferentes: case repetido do mesmo post conta uma vez só
function postsDistintos(cases) {
  let grupos = [];
  for (const c of cases) {
    const juntar = grupos.filter((g) => g.some((d) => mesmoCase(c, d)));
    grupos = grupos.filter((g) => !juntar.includes(g));
    grupos.push([c, ...juntar.flat()]);
  }
  return grupos.length;
}

export function statusFormato(f, cases = []) {
  const ev = f?.evidencias ?? [];
  const acima = postsDistintos(
    (cases ?? []).filter((c) => c.formatoId === f.id && ['nosso', 'nicho'].includes(c.origem) && c.relativo != null && Number(c.relativo) >= LIMIAR_RELATIVO)
  );
  if (acima >= MIN_CASES_ACIMA) return { status: 'validado', via: 'dado', acima };
  if (ev.some((e) => e.tipo === 'benchmark' && e.valor && e.fonte)) return { status: 'validado', via: 'benchmark', acima };
  if (ev.some((e) => e.tipo === 'curadoria' && e.fonte)) return { status: 'validado', via: 'curadoria', acima };
  return { status: 'em-teste', via: null, acima };
}

// reel.ideiaId é a verdade; ideia.reelId = o reel mais recente que ainda aponta pra ela (ou null).
// saindoReelId: o reel que está deixando a ideia (apagado ou religado a outra)
export function repontarIdeia(db, ideiaId, saindoReelId = null) {
  const i = ideiaId && db.ideias.find((x) => x.id === ideiaId);
  if (!i) return;
  if (i.reelId && i.reelId !== saindoReelId && db.reels.some((r) => r.id === i.reelId && r.ideiaId === i.id)) return;
  const outro = db.reels
    .filter((r) => r.id !== saindoReelId && r.ideiaId === i.id)
    .sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)))[0];
  i.reelId = outro?.id ?? null;
}

export async function colecao(nome) {
  const db = await carregar();
  return db[nome];
}

// ideias usam "criadaEm" (§3.3); o resto "criadoEm"
const CAMPO_DATA = { ideias: 'criadaEm' };

export async function criar(nome, prefixo, dados) {
  const db = await carregar();
  const { id: _ignorado, ...resto } = dados ?? {};
  const item = { id: novoId(prefixo), [CAMPO_DATA[nome] ?? 'criadoEm']: agora(), ...resto };
  db[nome].push(item);
  await salvar();
  return item;
}

export async function atualizar(nome, id, dados) {
  const db = await carregar();
  const item = db[nome].find((x) => x.id === id);
  if (!item) return null;
  const { id: _i, criadoEm: _c, criadaEm: _d, ...resto } = dados ?? {};
  Object.assign(item, resto, { atualizadoEm: agora() });
  await salvar();
  return item;
}

export async function remover(nome, id) {
  const db = await carregar();
  const i = db[nome].findIndex((x) => x.id === id);
  if (i < 0) return false;
  db[nome].splice(i, 1);
  await salvar();
  return true;
}
