// Login da equipe: todo mundo com o mesmo acesso, ninguém usa o app sem entrar.
//  - senha em scrypt (N=2^15, r=8, p=1, sal 16 bytes, chave 64) em data/usuarios.json
//  - sessão = cookie __Host-cronograma com 32 bytes aleatórios; no disco (data/sessoes.json) só o sha256
//  - 5 erros em 15 min por rede (IPv6 conta por /64) e por login = 429. A tentativa conta ANTES do scrypt:
//    pedido em paralelo não fura
//  - conta nova e senha esquecida só por link único (convites.mjs, data/convites.json). Ninguém cria
//    conta pela tela de entrar, nem nesta máquina
// usuarios.json, sessoes.json e convites.json também são mexidos pelo terminal (usuarios-cli.mjs) com o
// servidor no ar: a leitura confere data e tamanho do arquivo e relê quando mudou.
// Decisões fora do contrato: Origin de outro túnel rápido (*.trycloudflare.com é de qualquer um) só vale
// se for o próprio Host; host público só por https; Sec-Fetch-Site cross-site em escrita é recusado; senha
// errada em /api/auth/senha é 400 (401 é só pra sessão ausente) e tem limite próprio por usuário.
// A trava do login não vale pra este computador nem pro aparelho que já entrou naquela conta (cookie
// __Host-cronograma-aparelho, assinado com data/aparelhos.chave): quem sabe o login de alguém de fora trava
// só aparelho novo. Senha redefinida (link único) zera a trava do login. Acerto perdoa os erros do
// mesmo login naquela rede. Teto geral: 60 erros por minuto somados trava aparelho novo por 1 min, e no
// máximo 2 scrypt rodam juntos (o resto espera numa fila curta; cheia = 503).
import { scrypt, randomBytes, timingSafeEqual, createHash, createHmac } from 'node:crypto';
import { readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import net from 'node:net';
import { DATA_DIR, arquivoDados, gravarJson, falha, agora } from './db.mjs';

export const NOME_COOKIE = '__Host-cronograma';
const COOKIE_APARELHO = '__Host-cronograma-aparelho';
export const PORTA = Number(process.env.PORT) || 4317;
const VIDA_SESSAO = 30 * 86_400_000;
const VIDA_APARELHO = 180 * 86_400;
const RENOVAR_A_CADA = 3_600_000;
const JANELA_FALHAS = 15 * 60_000;
const MAX_FALHAS = 5;
const JANELA_GERAL = 60_000;
const MAX_GERAL = 60;
const SCRYPT_JUNTOS = 2; // o pool da libuv tem 4 threads e também serve a leitura de arquivo
const FILA_ENTRAR = 24;
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, sal: 16, chave: 64 };
const MAXMEM = 128 * 1024 * 1024; // 2^15 × 8 passa um pouco dos 32 MB padrão do Node
export const SENHA_MIN = 10;
const SENHA_MAX = 256;
export const LOGIN_OK = /^[a-z0-9._-]{3,32}$/;

// ---------- hosts, origem e cabeçalhos ----------

const HOSTS_LOCAIS = new Set([`localhost:${PORTA}`, `127.0.0.1:${PORTA}`]);
const TUNEL_RAPIDO = /^[a-z0-9-]+\.trycloudflare\.com$/;

function limparHost(s) {
  const h = String(s ?? '').trim().toLowerCase().replace(/^[a-z][a-z0-9+.-]*:\/\//, '').replace(/[/?#].*$/, '');
  return /^[a-z0-9.-]+(:\d{1,5})?$/.test(h) ? h : '';
}
const HOSTS_PUBLICOS = new Set(
  [...String(process.env.PUBLIC_HOSTS ?? '').split(','), process.env.PUBLIC_URL ?? ''].map(limparHost).filter(Boolean)
);

export const hostDe = (req) => String(req.headers.host ?? '').trim().toLowerCase();
export const hostPermitido = (h) => HOSTS_LOCAIS.has(h) || HOSTS_PUBLICOS.has(h) || TUNEL_RAPIDO.test(h);
export const hostsPublicos = () => [...HOSTS_PUBLICOS];

// escrita (POST, PUT, DELETE): sem Origin é cliente fora do navegador e quem decide é o cookie
export function origemPermitida(req) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const o = req.headers.origin;
  if (o == null) return true;
  let u;
  try {
    u = new URL(o);
  } catch {
    return false;
  }
  if (!['http:', 'https:'].includes(u.protocol) || u.origin !== o) return false;
  if (!hostPermitido(u.host)) return false;
  // http:// só nesta máquina: pela internet a senha não anda em texto claro
  if (u.protocol === 'http:' && !HOSTS_LOCAIS.has(u.host)) return false;
  return !TUNEL_RAPIDO.test(u.host) || u.host === hostDe(req);
}

// esquema que o visitante usou até a Cloudflare: 'https', 'http' ou '' (pedido local, sem proxy)
export function protocoloVisitante(req) {
  try {
    const s = JSON.parse(String(req.headers['cf-visitor'] ?? '')).scheme;
    if (s === 'http' || s === 'https') return s;
  } catch {}
  const p = String(req.headers['x-forwarded-proto'] ?? '').split(',')[0].trim().toLowerCase();
  return p === 'http' || p === 'https' ? p : '';
}
export const hostLocal = (h) => HOSTS_LOCAIS.has(h);

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data: https://*.cdninstagram.com https://*.fbcdn.net",
  // vídeo dos reels (Métricas e Inspirações) toca direto do CDN do Instagram
  "media-src 'self' https://*.cdninstagram.com https://*.fbcdn.net",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
].join('; ');

export function cabecalhosSeguranca(req, res) {
  res.setHeader('content-security-policy', CSP);
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'same-origin');
  res.setHeader('x-frame-options', 'DENY');
  if (protocoloVisitante(req) === 'https') res.setHeader('strict-transport-security', 'max-age=15552000');
}

// ---------- quem está chamando ----------

const loopback = (a) => /^(::ffff:)?127\./.test(a ?? '') || a === '::1';

export function ipDoCliente(req) {
  const cf = String(req.headers['cf-connecting-ip'] ?? '').trim();
  if (cf) return net.isIP(cf) ? cf : cf.slice(0, 64);
  return String(req.socket.remoteAddress ?? '').replace(/^::ffff:/, '');
}

// chave do limite de tentativas: IPv4 inteiro; IPv6 pelos primeiros 64 bits (uma casa ou um
// servidor costuma ter o /64 todo, então trocar o fim do endereço não abre balde novo)
export function redeDoCliente(req) {
  const ip = ipDoCliente(req).replace(/%.*$/, '');
  const v4 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (v4) return v4[1];
  if (net.isIP(ip) !== 6) return ip;
  const grupos = (s) => (s ? s.split(':').flatMap((g) => (g.includes('.') ? ['0', '0'] : [g])) : []);
  const i = ip.indexOf('::');
  let g = grupos(i < 0 ? ip : ip.slice(0, i));
  if (i >= 0) {
    const fim = grupos(ip.slice(i + 2));
    g = [...g, ...Array(Math.max(0, 8 - g.length - fim.length)).fill('0'), ...fim];
  }
  return `${g.slice(0, 4).map((x) => parseInt(x, 16).toString(16)).join(':')}::/64`;
}

// qualquer um destes = veio por proxy/túnel, não desta máquina
const CABECALHOS_PROXY = ['cf-connecting-ip', 'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host', 'forwarded', 'cf-ray', 'cf-visitor', 'cdn-loop', 'x-real-ip', 'true-client-ip'];
export const ehLocal = (req) =>
  loopback(req.socket.remoteAddress) && !CABECALHOS_PROXY.some((h) => h in req.headers) && HOSTS_LOCAIS.has(hostDe(req));

// ---------- senha ----------

// no máximo SCRYPT_JUNTOS de uma vez: rajada de login não toma o pool que serve os arquivos do app
let rodando = 0;
const naFila = [];
const pegarVaga = () => (rodando < SCRYPT_JUNTOS ? (rodando++, Promise.resolve()) : new Promise((ok) => naFila.push(ok)));
function soltarVaga() {
  const proximo = naFila.shift();
  if (proximo) proximo();
  else rodando--;
}
export const scryptOcupado = () => rodando + naFila.length >= SCRYPT_JUNTOS + FILA_ENTRAR;

async function derivar(senha, sal, { N, r, p }, tamanho) {
  await pegarVaga();
  try {
    return await new Promise((ok, erro) => scrypt(String(senha).normalize('NFC'), sal, tamanho, { N, r, p, maxmem: MAXMEM }, (e, k) => (e ? erro(e) : ok(k))));
  } finally {
    soltarVaga();
  }
}

export async function hashSenha(senha) {
  const sal = randomBytes(SCRYPT.sal);
  const k = await derivar(senha, sal, SCRYPT, SCRYPT.chave);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, sal.toString('base64'), k.toString('base64')].join('$');
}

export async function conferirSenha(senha, hash) {
  const partes = typeof hash === 'string' ? hash.split('$') : [];
  if (partes.length !== 6 || partes[0] !== 'scrypt') return false;
  const [N, r, p] = partes.slice(1, 4).map(Number);
  // parâmetro fora da faixa (arquivo mexido) não roda: não vira trava de CPU nem de memória
  if (![2 ** 14, 2 ** 15, 2 ** 16].includes(N) || r !== 8 || ![1, 2].includes(p)) return false;
  const sal = Buffer.from(partes[4], 'base64');
  const esperado = Buffer.from(partes[5], 'base64');
  if (sal.length < 16 || esperado.length < 32) return false;
  try {
    return timingSafeEqual(await derivar(senha, sal, { N, r, p }, esperado.length), esperado);
  } catch {
    return false;
  }
}

// usuário que não existe gasta o mesmo scrypt: o tempo de resposta não entrega quem existe
let falso;
const hashFalso = () => (falso ??= hashSenha(randomBytes(18).toString('base64')));
// a chave dos aparelhos nasce no boot: disco sem permissão aparece aqui, não no primeiro login
export const preparar = () => (chaveAparelho(), hashFalso());

export function conferirLogin(v) {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  if (!LOGIN_OK.test(s)) throw falha(400, 'O login precisa ter de 3 a 32 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado.');
  return s;
}

export function conferirNome(v) {
  const s = typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim() : '';
  if (!s) throw falha(400, 'Escreva o nome.');
  if (s.length > 60) throw falha(400, 'O nome pode ter no máximo 60 caracteres.');
  return s;
}

export function conferirSenhaNova(senha, login) {
  if (typeof senha !== 'string' || senha.length < SENHA_MIN) throw falha(400, `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`);
  if (senha.length > SENHA_MAX) throw falha(400, `A senha pode ter no máximo ${SENHA_MAX} caracteres.`);
  if (senha.trim().toLowerCase() === String(login ?? '').toLowerCase()) throw falha(400, 'A senha não pode ser igual ao login.');
  return senha;
}

// ---------- arquivos ----------

const ARQUIVOS = { usuarios: 'usuarios.json', sessoes: 'sessoes.json', convites: 'convites.json' };
const cache = Object.fromEntries(Object.keys(ARQUIVOS).map((k) => [k, { lista: null, marca: '', pendentes: 0 }]));
const filas = Object.fromEntries(Object.keys(ARQUIVOS).map((k) => [k, Promise.resolve()]));

function marca(nome) {
  try {
    const s = statSync(arquivoDados(nome));
    return `${s.mtimeMs}:${s.size}`;
  } catch (e) {
    if (e.code === 'ENOENT') return 'ausente';
    throw e;
  }
}

function ler(qual) {
  const c = cache[qual];
  // com gravação na fila, a memória é a verdade (evita reler no meio da própria escrita)
  if (c.lista && c.pendentes) return c.lista;
  const m = marca(ARQUIVOS[qual]);
  if (c.lista && c.marca === m) return c.lista;
  let lista = [];
  if (m !== 'ausente') {
    try {
      const txt = readFileSync(arquivoDados(ARQUIVOS[qual]), 'utf8');
      lista = txt.trim() ? JSON.parse(txt) : [];
      if (!Array.isArray(lista)) throw new Error('não é uma lista');
    } catch (e) {
      // sessões quebradas: todo mundo entra de novo. Convites quebrados: nenhum link vale.
      // Usuários quebrados: ninguém entra (falha fechada)
      if (qual !== 'usuarios') lista = [];
      else {
        console.error(`data/${ARQUIVOS[qual]} ilegível:`, e.message);
        throw falha(500, 'O arquivo de usuários (data/usuarios.json) está ilegível. Confira o arquivo no servidor.');
      }
    }
  }
  c.lista = lista;
  c.marca = m;
  return lista;
}

function gravar(qual) {
  const c = cache[qual];
  // nunca lido = nada mudou (e gravar null apagaria o arquivo)
  if (!c.lista) return Promise.resolve();
  c.pendentes++;
  const proxima = filas[qual].then(async () => {
    try {
      await mkdir(DATA_DIR, { recursive: true });
      await gravarJson(ARQUIVOS[qual], c.lista);
      c.marca = marca(ARQUIVOS[qual]);
    } finally {
      c.pendentes--;
    }
  });
  filas[qual] = proxima.catch((e) => console.error(`Falha ao gravar ${ARQUIVOS[qual]}:`, e.message));
  return proxima;
}

export const usuarios = () => ler('usuarios');
const sessoes = () => ler('sessoes');
export const convites = () => ler('convites');
export { gravar as gravarArquivo };

// alterações de conta uma de cada vez (o mesmo link usado duas vezes juntas, criar e apagar juntos)
let trava = Promise.resolve();
export function emFila(fn) {
  const r = trava.then(fn);
  trava = r.catch(() => {});
  return r;
}

const ativa = (s, agoraMs = Date.now()) => Date.parse(s.expiraEm) > agoraMs;

// tira (no lugar) as sessões que casam com o filtro e as vencidas
export function tirarSessoes(filtro) {
  const lista = sessoes();
  const agoraMs = Date.now();
  for (let i = lista.length - 1; i >= 0; i--) if (filtro(lista[i]) || !ativa(lista[i], agoraMs)) lista.splice(i, 1);
}

export const sessoesAtivas = (usuarioId) => sessoes().filter((s) => s.usuarioId === usuarioId && ativa(s)).length;

export const resumo = (u) => ({ id: u.id, usuario: u.usuario, nome: u.nome, trocarSenha: Boolean(u.trocarSenha) });
export const publico = (u) => ({
  ...resumo(u),
  criadoEm: u.criadoEm ?? null,
  criadoPor: u.criadoPor ?? null,
  ultimoAcesso: u.ultimoAcesso ?? null,
});

// ---------- contas (API e terminal) ----------
// conta nova e senha nova nascem em convites.mjs (link único); aqui só sai

export function removerConta(id) {
  return emFila(async () => {
    const lista = usuarios();
    const i = lista.findIndex((u) => u.id === id);
    if (i < 0) throw falha(404, 'Esse usuário não existe.');
    if (lista.length === 1) throw falha(409, 'Esse é o único usuário. Convide outra pessoa antes de remover este.');
    const [u] = lista.splice(i, 1);
    tirarSessoes((s) => s.usuarioId === id);
    // link pra quem saiu e link que ela gerou não valem mais (criadoPorId é novo: os antigos casam pelo nome)
    const cs = convites();
    const dela = (c) => c.usuarioId === id || c.criadoPorId === id || (!c.criadoPorId && c.criadoPor != null && c.criadoPor === u.nome);
    for (let j = cs.length - 1; j >= 0; j--) if (!cs[j].usadoEm && dela(cs[j])) cs.splice(j, 1);
    await Promise.all([gravar('usuarios'), gravar('sessoes'), gravar('convites')]);
    return u;
  });
}

// ---------- sessão ----------

const sha256 = (t) => createHash('sha256').update(t).digest('hex');
const cookie = (valor, maxAge) => `${NOME_COOKIE}=${valor}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
// um Set-Cookie por nome: o mais novo do mesmo nome substitui o anterior na mesma resposta
function porCookie(res, linha) {
  const prefixo = linha.slice(0, linha.indexOf('=') + 1);
  const outros = [res.getHeader('set-cookie') ?? []].flat().filter((c) => !String(c).startsWith(prefixo));
  res.setHeader('set-cookie', [...outros, linha]);
}
const definirCookie = (res, token) => porCookie(res, cookie(token, VIDA_SESSAO / 1000));
export const limparCookie = (res) => porCookie(res, cookie('', 0));

function lerCookie(req, nome, formato) {
  for (const parte of String(req.headers.cookie ?? '').split(';')) {
    const i = parte.indexOf('=');
    if (i < 0 || parte.slice(0, i).trim() !== nome) continue;
    const v = parte.slice(i + 1).trim();
    if (formato.test(v)) return v;
  }
  return null;
}

const tokenDoCookie = (req) => lerCookie(req, NOME_COOKIE, /^[A-Za-z0-9_-]{43}$/);

// aparelho que já entrou numa conta: "<id da conta>.<assinatura>". Não abre sessão nenhuma, só tira
// esse aparelho da trava por login daquela conta. A chave fica em data/ e sobrevive a reinício e a senha nova
let chave;
function chaveAparelho() {
  if (chave) return chave;
  const arq = arquivoDados('aparelhos.chave');
  try {
    chave = Buffer.from(readFileSync(arq, 'utf8').trim(), 'hex');
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    mkdirSync(DATA_DIR, { recursive: true });
    try {
      writeFileSync(arq, randomBytes(32).toString('hex'), { flag: 'wx', mode: 0o600 });
    } catch (e2) {
      if (e2.code !== 'EEXIST') throw e2;
    }
    chave = Buffer.from(readFileSync(arq, 'utf8').trim(), 'hex');
  }
  if (chave.length < 32) throw new Error('data/aparelhos.chave está estragada. Apague o arquivo e reinicie o servidor.');
  return chave;
}
const assinaturaAparelho = (id) => createHmac('sha256', chaveAparelho()).update(`aparelho:${id}`).digest('base64url');

function marcarAparelho(res, u) {
  porCookie(res, `${COOKIE_APARELHO}=${u.id}.${assinaturaAparelho(u.id)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${VIDA_APARELHO}`);
}

function aparelhoConhecido(req, u) {
  if (!u) return false;
  const v = lerCookie(req, COOKIE_APARELHO, /^[A-Za-z0-9_-]{1,64}\.[A-Za-z0-9_-]{43}$/) ?? '';
  const i = v.lastIndexOf('.');
  if (i < 0 || v.slice(0, i) !== u.id) return false;
  const veio = Buffer.from(v.slice(i + 1));
  const certo = Buffer.from(assinaturaAparelho(u.id));
  return veio.length === certo.length && timingSafeEqual(veio, certo);
}

// { usuario, sessao, hash } ou null. Renova (30 dias de novo) no máximo uma vez por hora
export async function sessaoDe(req, res) {
  const token = tokenDoCookie(req);
  if (!token) return null;
  const hash = sha256(token);
  const s = sessoes().find((x) => x.tokenHash === hash);
  const agoraMs = Date.now();
  if (!s || !ativa(s, agoraMs)) return null;
  const u = usuarios().find((x) => x.id === s.usuarioId);
  if (!u) return null;
  if (!(agoraMs - Date.parse(s.ultimoUso) < RENOVAR_A_CADA)) {
    const quando = new Date(agoraMs).toISOString();
    Object.assign(s, { ultimoUso: quando, expiraEm: new Date(agoraMs + VIDA_SESSAO).toISOString(), ip: ipDoCliente(req) });
    u.ultimoAcesso = quando;
    // disco cheio não derruba quem já está dentro: a sessão segue valendo em memória
    await Promise.all([gravar('sessoes'), gravar('usuarios')]).catch(() => {});
    definirCookie(res, token);
  }
  return { usuario: u, sessao: s, hash };
}

export async function abrirSessao(req, res, u) {
  // quem entra de novo no mesmo navegador troca de sessão: a do cookie antigo sai
  const antigo = tokenDoCookie(req);
  const hashAntigo = antigo ? sha256(antigo) : null;
  const token = randomBytes(32).toString('base64url');
  const quando = agora();
  tirarSessoes((s) => s.tokenHash === hashAntigo);
  sessoes().push({
    tokenHash: sha256(token),
    usuarioId: u.id,
    criadaEm: quando,
    expiraEm: new Date(Date.now() + VIDA_SESSAO).toISOString(),
    ultimoUso: quando,
    ip: ipDoCliente(req),
    ua: String(req.headers['user-agent'] ?? '').slice(0, 200),
  });
  u.ultimoAcesso = quando;
  await Promise.all([gravar('sessoes'), gravar('usuarios')]);
  definirCookie(res, token);
  marcarAparelho(res, u);
}

// ---------- limite de tentativas (memória) ----------

const falhas = new Map(); // chave → [{ t, login }]
const hashNaTrava = new Map(); // login → { hash da conta no último erro, t }: hash mudou = senha redefinida
let geral = []; // erros de aparelho novo no último minuto, somando todo mundo

export function recentes(chave, agoraMs) {
  const xs = (falhas.get(chave) ?? []).filter((f) => agoraMs - f.t < JANELA_FALHAS);
  if (xs.length) falhas.set(chave, xs);
  else falhas.delete(chave);
  return xs;
}

// ms até liberar (0 = liberado)
export function espera(chaves) {
  const agoraMs = Date.now();
  let ms = 0;
  for (const c of chaves) {
    const xs = recentes(c, agoraMs);
    if (xs.length >= MAX_FALHAS) ms = Math.max(ms, xs[xs.length - MAX_FALHAS].t + JANELA_FALHAS - agoraMs);
  }
  return ms;
}

function esperaGeral() {
  const agoraMs = Date.now();
  geral = geral.filter((f) => agoraMs - f.t < JANELA_GERAL);
  return geral.length >= MAX_GERAL ? geral[geral.length - MAX_GERAL].t + JANELA_GERAL - agoraMs : 0;
}

export function contarTentativa(chaves, { login = '', hash = '', noGeral = false } = {}) {
  const t = Date.now();
  if (falhas.size > 5000) for (const c of [...falhas.keys()]) recentes(c, t);
  if (hashNaTrava.size > 5000) for (const [l, m] of hashNaTrava) if (t - m.t >= JANELA_FALHAS) hashNaTrava.delete(l);
  const marca = { t, login };
  for (const c of chaves) {
    const xs = falhas.get(c) ?? [];
    xs.push(marca);
    falhas.set(c, xs);
  }
  if (login) hashNaTrava.set(login, { hash, t });
  if (noGeral) geral.push(marca);
  return marca;
}

// acertou: a tentativa provisória sai; a chave do login (ou da troca de senha) zera
function descontar(chaves, marca, zerar) {
  for (const c of chaves) {
    if (c === zerar) {
      falhas.delete(c);
      continue;
    }
    const xs = falhas.get(c);
    const i = xs ? xs.indexOf(marca) : -1;
    if (i >= 0) xs.splice(i, 1);
  }
  const i = geral.indexOf(marca);
  if (i >= 0) geral.splice(i, 1);
}

// tira os erros de um login destes baldes de rede
function perdoar(login, chaves) {
  for (const c of chaves) {
    const xs = (falhas.get(c) ?? []).filter((f) => f.login !== login);
    if (xs.length) falhas.set(c, xs);
    else falhas.delete(c);
  }
}

// senha redefinida (pela tela ou pelo terminal) depois dos erros: a trava daquele login recomeça do zero
function zerarSeRedefinida(login, u) {
  const m = hashNaTrava.get(login);
  if (!m || !u || m.hash === u.hash) return;
  hashNaTrava.delete(login);
  falhas.delete(`login:${login}`);
  perdoar(login, [...falhas.keys()].filter((c) => c.startsWith('ip:')));
}

export function muitasTentativas(res, json, ms) {
  const minutos = Math.max(1, Math.ceil(ms / 60_000));
  res.setHeader('retry-after', String(Math.ceil(ms / 1000)));
  return json(res, 429, { erro: `Muitas tentativas erradas. Espere ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} e tente de novo.`, minutos });
}

// ---------- rotas ----------

export const semSessao = (res, json) => json(res, 401, { erro: 'Entre com seu usuário e senha pra continuar.' });

async function entrar(req, res, { json, corpoJson }) {
  const corpo = await corpoJson(req, 16_000);
  const login = typeof corpo.usuario === 'string' ? corpo.usuario.trim().toLowerCase().slice(0, 64) : '';
  const u = login ? usuarios().find((x) => x.usuario === login) : undefined;
  if (login) zerarSeRedefinida(login, u);
  // este computador e o aparelho que já entrou nessa conta ficam fora da trava do login e do teto geral
  const conhecido = ehLocal(req) || aparelhoConhecido(req, u);
  const rede = `ip:${redeDoCliente(req)}`;
  const chaves = [rede, ...(login && !conhecido ? [`login:${login}`] : [])];
  const ms = Math.max(espera(chaves), conhecido ? 0 : esperaGeral());
  if (ms) return muitasTentativas(res, json, ms);
  if (!login || typeof corpo.senha !== 'string' || !corpo.senha) return json(res, 400, { erro: 'Preencha o usuário e a senha.' });
  if (!conhecido && scryptOcupado()) {
    res.setHeader('retry-after', '5');
    return json(res, 503, { erro: 'Muita gente tentando entrar agora. Espere alguns segundos e tente de novo.' });
  }
  const marca = contarTentativa(chaves, { login, hash: u?.hash ?? '', noGeral: !conhecido });
  const ok = corpo.senha.length <= 1024 && (await conferirSenha(corpo.senha, u ? u.hash : await hashFalso()));
  if (!u || !ok) {
    if (recentes(rede, Date.now()).length === MAX_FALHAS) console.log(`Login travado por 15 min pra ${rede.slice(3)} (muitas senhas erradas)`);
    return json(res, 401, { erro: 'Usuário ou senha incorretos.' });
  }
  descontar(chaves, marca, `login:${login}`);
  falhas.delete(`login:${login}`);
  // os erros deste login nesta rede eram da própria pessoa: não seguram mais ninguém
  perdoar(login, [rede]);
  const atual = usuarios().find((x) => x.id === u.id) ?? u;
  await abrirSessao(req, res, atual);
  console.log(`Entrou: ${atual.usuario}`);
  return json(res, 200, { ok: true, usuario: resumo(atual) });
}

async function trocarSenha(req, res, sess, { json, corpoJson }) {
  const corpo = await corpoJson(req, 16_000);
  const chave = `senha:${sess.usuario.id}`;
  const ms = espera([chave]);
  if (ms) return muitasTentativas(res, json, ms);
  if (typeof corpo.atual !== 'string' || !corpo.atual || typeof corpo.nova !== 'string') return json(res, 400, { erro: 'Preencha a senha atual e a nova.' });
  const t = contarTentativa([chave]);
  if (!(corpo.atual.length <= 1024 && (await conferirSenha(corpo.atual, sess.usuario.hash)))) return json(res, 400, { erro: 'A senha atual não confere.' });
  descontar([chave], t, chave);
  conferirSenhaNova(corpo.nova, sess.usuario.usuario);
  if (corpo.nova === corpo.atual) throw falha(400, 'A senha nova precisa ser diferente da atual.');
  const u = await emFila(async () => {
    const hash = await hashSenha(corpo.nova);
    const alvo = usuarios().find((x) => x.id === sess.usuario.id);
    if (!alvo) throw falha(401, 'Entre com seu usuário e senha pra continuar.');
    Object.assign(alvo, { hash, trocarSenha: false });
    // as outras sessões desta conta caem; esta continua
    tirarSessoes((s) => s.usuarioId === alvo.id && s.tokenHash !== sess.hash);
    await Promise.all([gravar('usuarios'), gravar('sessoes')]);
    return alvo;
  });
  console.log(`Senha trocada: ${u.usuario}`);
  return json(res, 200, { ok: true, usuario: resumo(u) });
}

// /api/auth/<acao>
export async function rotaAuth(req, res, acao, sess, ferramentas) {
  const { json } = ferramentas;
  const m = req.method;
  if (acao === 'estado' && m === 'GET') {
    return json(res, 200, { logado: Boolean(sess), usuario: sess ? resumo(sess.usuario) : null, semUsuarios: usuarios().length === 0 });
  }
  if (acao === 'entrar' && m === 'POST') return entrar(req, res, ferramentas);
  if (!sess) return semSessao(res, json);
  if (acao === 'sair' && m === 'POST') {
    tirarSessoes((s) => s.tokenHash === sess.hash);
    await gravar('sessoes');
    limparCookie(res);
    return json(res, 200, { ok: true });
  }
  if (acao === 'senha' && m === 'POST') return trocarSenha(req, res, sess, ferramentas);
  return json(res, 404, { erro: 'Rota não existe.' });
}
