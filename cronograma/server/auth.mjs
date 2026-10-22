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
// 21/10 (Pedro): perfil Gerente de Marketing (todo o poder do Admin e a primeira etapa da aprovação) e a conta que
// entra por link + PIN de 4 números (acesso 'pin', o Diretor contábil sem senha). Ver "perfis" e "link + PIN" abaixo.
// Decisões fora do contrato: conta de PIN não troca senha (409) nem recebe link de redefinição (convites.mjs); PIN
// fora do formato (não são 4 números) é 400 e não conta como erro; link desconhecido conta no balde da rede (5 em
// 15 min = 429, a regra do link único); rota livre (API_PUBLICA) não passa pelo perfil, pra quem já tem sessão poder
// entrar de novo por outro link.
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

// 21/10 (Pedro, segurança): os segmentos de /api/... decodificados um a um, ou null (o servidor responde 400
// "Endereço inválido."). Antes o perfil olhava o caminho cru e a rota os segmentos decodificados sem os vazios:
// /api//usuarios/x, /api/%75suarios/x e /api/aprovacoes/x/aprovar/ passavam do controle de perfil. Agora não passa
// segmento vazio (barra dupla ou no fim), decode que falha, nem segmento que decodificado tenha barra, contrabarra ou
// caractere de controle, nem "." e ".." decodificados. O servidor monta o caminho canônico ('/api/' + partes) uma vez
// e usa ele em tudo: lista livre, rotas que saíram, senha temporária, podeApi e a rota
export function partesDaApi(pathname) {
  const brutas = String(pathname).split('/');
  if (brutas[0] !== '' || brutas[1] !== 'api' || brutas.length < 3) return null;
  const partes = [];
  for (const b of brutas.slice(2)) {
    if (!b) return null;
    let s;
    try {
      s = decodeURIComponent(b);
    } catch {
      return null;
    }
    if (!s || /[\\/\u0000-\u001f\u007f-\u009f]/.test(s) || s === '.' || s === '..') return null;
    partes.push(s);
  }
  return partes;
}

// Quem está com senha temporária só fala com estas até trocar. Dado é a API e o vídeo final (/videos/..., 02/10):
// os dois dão 403 com trocarSenha: true. A página e os estáticos abrem (a tela manda pra troca)
const LIVRES_COM_SENHA_TEMPORARIA = new Set(['/api/auth/estado', '/api/auth/senha', '/api/auth/sair']);
export const presoNaSenhaTemporaria = (usuario, pathname) => Boolean(usuario?.trocarSenha)
  && (String(pathname).startsWith('/api/') || String(pathname).startsWith('/videos/'))
  && !LIVRES_COM_SENHA_TEMPORARIA.has(pathname);

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

// 21/10 (Pedro, segurança): o IP de quem chamou, pros baldes de tentativa e pra sessão. Cabeçalho de proxy só vale
// quando o pedido chega pelo proxy desta máquina (remoteAddress de loopback) e só o que o proxy escreve:
//  - padrão (VPS, Caddy na frente): o ÚLTIMO valor do X-Forwarded-For. O Caddy sem trusted_proxies joga fora o que o
//    cliente mandou e escreve o IP real; se algum proxy só acrescentar, o último continua sendo o que ele viu
//  - CRONOGRAMA_PROXY=cloudflare (túnel da Cloudflare): o cf-connecting-ip, que a Cloudflare sobrescreve
// Antes o cf-connecting-ip valia sempre: atrás do Caddy o cliente escolhia o balde (travava o link + PIN e o login de
// outra rede, e fugia do balde da própria) e o ip gravado na sessão era o que ele quisesse
const IP_DO_PROXY = { cloudflare: 'cf-connecting-ip' };
export function ipDoCliente(req) {
  const direto = String(req.socket?.remoteAddress ?? '').replace(/^::ffff:/, '');
  if (!loopback(req.socket?.remoteAddress)) return direto;
  const proxy = IP_DO_PROXY[process.env.CRONOGRAMA_PROXY];
  const bruto = proxy ? req.headers[proxy] : req.headers['x-forwarded-for'];
  const ip = String([bruto ?? ''].flat().join(',')).split(',').at(-1).trim().replace(/^::ffff:(?=\d)/i, '');
  return net.isIP(ip) ? ip : direto;
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

// ---------- perfis (21/10, Pedro): Admin, Gerente de Marketing, Operador e Diretor contábil ----------
// admin: tudo, inclusive usuários e perfis. gerente (21/10, Pedro): tudo que o Admin pode, mais a primeira etapa da
// aprovação técnica (aprovar e ajustar na etapa dos gerentes). operador: todo o conteúdo, sem usuários, sem gerar a
// semana e sem atualizar as notícias. diretor: só as Aprovações técnicas (ver, aprovar, ajustar e conversar), na etapa
// dele. Aprovar e ajustar são só do gerente e do diretor; a etapa certa é conferida por dentro (aprovacoes.mjs).
// Conta sem papel (de antes dos perfis) é operador; garantirPapeis acerta isso no boot
export const PAPEIS = ['admin', 'gerente', 'operador', 'diretor'];
export const NOME_PAPEL = { admin: 'Admin', gerente: 'Gerente de Marketing', operador: 'Operador', diretor: 'Diretor contábil' };
export const papelDe = (u) => (PAPEIS.includes(u?.papel) ? u.papel : 'operador');
export function conferirPapel(v) {
  if (!PAPEIS.includes(v)) throw falha(400, 'O perfil precisa ser Admin, Gerente de Marketing, Operador ou Diretor contábil.');
  return v;
}
// quem manda no app (usuários, perfis, links, gerar a semana, atualizar as notícias): Admin e Gerente de Marketing
const PAPEIS_GESTAO = ['admin', 'gerente'];
export const ehGestao = (u) => PAPEIS_GESTAO.includes(papelDe(u));
// quem aprova e pede ajuste (cada um na sua etapa): Gerente de Marketing e Diretor contábil
export const PAPEIS_APROVACAO = ['gerente', 'diretor'];
// 21/10 (Pedro): o Diretor também abre os arquivos subidos direto na aba (envios.mjs), só pra ver (GET e HEAD). Subir,
// editar e apagar envio é do time. Mecanismo, semana e notícias (rotas-conteudo.mjs) ficam fora pra ele
const DIRETOR_PODE = [
  /^GET \/api\/auth\/estado$/, /^POST \/api\/auth\/(sair|senha)$/, /^GET \/api\/versao$/,
  /^GET \/api\/aprovacoes(\/[A-Za-z0-9_-]+)?$/, /^POST \/api\/aprovacoes\/[A-Za-z0-9_-]+\/(aprovar|ajustar|mensagem)$/,
  /^(GET|HEAD) \/api\/envios\/env_[A-Za-z0-9_-]+\/arquivos\/arq_[A-Za-z0-9_-]+$/,
];
// o caminho que chega aqui é o canônico (server.mjs): um segmento por barra, já decodificado, sem vazio
const SO_GESTAO = [/^[A-Z]+ \/api\/(usuarios|convites)(\/|$)/, /^POST \/api\/semana\/gerar$/, /^POST \/api\/noticias\/atualizar$/];
const SO_APROVACAO = [/^POST \/api\/aprovacoes\/[^/]+\/(aprovar|ajustar)$/];
// o que cada perfil pode chamar na API (o servidor confere em toda requisição com sessão, pelo caminho canônico)
export function podeApi(u, metodo, caminho) {
  const p = papelDe(u);
  const pedido = `${metodo} ${caminho}`;
  if (p === 'diretor') return DIRETOR_PODE.some((re) => re.test(pedido));
  if (p !== 'gerente' && SO_APROVACAO.some((re) => re.test(pedido))) return false;
  if (!PAPEIS_GESTAO.includes(p) && SO_GESTAO.some((re) => re.test(pedido))) return false;
  return true;
}
// a mensagem do 403 quando podeApi diz não
export function motivoNegado(u, metodo, caminho) {
  if (papelDe(u) === 'diretor') return 'O seu perfil vê só as Aprovações técnicas.';
  if (SO_APROVACAO.some((re) => re.test(`${metodo} ${caminho}`))) return 'Só os Gerentes de Marketing e o Diretor contábil aprovam ou pedem ajuste.';
  return 'O seu perfil não tem acesso a isso. Peça pra um Admin ou Gerente de Marketing.';
}
// sem ninguém que gerencie usuários (Admin ou Gerente de Marketing) o app não tem volta pela tela
const ultimoGestor = (lista, u) => PAPEIS_GESTAO.includes(u.papel) && lista.filter((x) => PAPEIS_GESTAO.includes(x.papel)).length === 1;
const MSG_ULTIMO_GESTOR = 'Essa é a única conta que gerencia usuários (Admin ou Gerente de Marketing). Dê um desses perfis pra outra pessoa antes';
// conta sem perfil (de antes de 21/10): o "pedro" (ou, sem ele, a conta mais antiga) vira admin se ninguém for admin
// nem gerente; as outras viram operador. Nunca fica sem quem gerencie usuários
export function garantirPapeis() {
  return emFila(async () => {
    const lista = usuarios();
    const semPapel = lista.filter((u) => !PAPEIS.includes(u.papel));
    if (!semPapel.length) return 0;
    if (!lista.some((u) => PAPEIS_GESTAO.includes(u.papel))) {
      const dono = lista.find((u) => u.usuario === 'pedro') ?? [...lista].sort((a, b) => String(a.criadoEm).localeCompare(String(b.criadoEm)))[0];
      if (dono) dono.papel = 'admin';
    }
    for (const u of lista) if (!PAPEIS.includes(u.papel)) u.papel = 'operador';
    await gravar('usuarios');
    return semPapel.length;
  });
}
export function trocarPapel(id, papel) {
  return emFila(async () => {
    const lista = usuarios();
    const u = lista.find((x) => x.id === id);
    if (!u) throw falha(404, 'Esse usuário não existe.');
    const novo = conferirPapel(papel);
    if (!PAPEIS_GESTAO.includes(novo) && ultimoGestor(lista, u)) throw falha(409, `${MSG_ULTIMO_GESTOR} de trocar este.`);
    u.papel = novo;
    await gravar('usuarios');
    return u;
  });
}
export { ultimoGestor, MSG_ULTIMO_GESTOR };

// ---------- etapas da aprovação técnica (21/10, Pedro) ----------
// Os gerentes que precisam aprovar são as contas com o perfil Gerente de Marketing agora (ativas = cadastradas).
// Aprovação pendente: etapa 'gerentes' enquanto falta algum deles; pendente antigo (sem etapa) e etapa dos gerentes
// sem ninguém faltando (gerente que saiu ou mudou de perfil) contam como etapa 'diretor'. null = não está pendente
export const gerentesAtivos = () => usuarios().filter((u) => papelDe(u) === 'gerente')
  .sort((a, b) => String(a.criadoEm ?? '').localeCompare(String(b.criadoEm ?? '')))
  .map((u) => ({ id: u.id, nome: u.nome }));
export const aprovaramGerentes = (ap) => (Array.isArray(ap?.gerentes?.aprovaram) ? ap.gerentes.aprovaram.filter((x) => x && typeof x === 'object' && x.id) : []);
export function faltamGerentes(ap, gerentes = gerentesAtivos()) {
  const ja = new Set(aprovaramGerentes(ap).map((x) => x.id));
  return gerentes.filter((g) => !ja.has(g.id));
}
export function etapaDaAprovacao(ap, gerentes = gerentesAtivos()) {
  if (ap?.estado !== 'pendente') return null;
  if (ap.etapa !== 'gerentes') return 'diretor';
  return faltamGerentes(ap, gerentes).length ? 'gerentes' : 'diretor';
}
// o Diretor contábil vê o que está pendente na etapa dele e o que foi decidido nela (aprovado, ajustado por um
// diretor, mudado depois de aprovado). O que ainda está com os gerentes, o que eles ajustaram e o rascunho, não
export function diretorVe(ap, gerentes = gerentesAtivos()) {
  if (!ap || typeof ap !== 'object' || !ap.estado) return false;
  if (ap.estado === 'pendente') return etapaDaAprovacao(ap, gerentes) === 'diretor';
  return (ap.etapa ?? 'diretor') === 'diretor';
}

// conta de PIN (21/10): entra por link pessoal + PIN de 4 números, nunca por usuário e senha
export const ehContaPin = (u) => u?.acesso === 'pin';
// 21/10 (Pedro): ajustar peça ou envio já aprovado é do Diretor contábil com a permissão na conta (P3). A permissão
// sozinha não basta: conta que mudou pra outro perfil deixa de ajustar (e volta a ajustar se voltar a ser diretor)
export const ajustaAprovada = (u) => papelDe(u) === 'diretor' && u?.ajustaDepoisDeAprovada === true;

export const resumo = (u) => ({
  id: u.id, usuario: u.usuario, nome: u.nome, trocarSenha: Boolean(u.trocarSenha), papel: papelDe(u),
  // 21/10: a tela esconde "trocar senha" da conta de PIN e mostra o ajuste depois de aprovado pra quem pode
  acesso: ehContaPin(u) ? 'pin' : 'senha', ajustaDepoisDeAprovada: ajustaAprovada(u),
});
// sem pinHash nem linkPinHash: a tela de Usuários só sabe se o link vale e se está travado
export const publico = (u) => ({
  ...resumo(u),
  criadoEm: u.criadoEm ?? null,
  criadoPor: u.criadoPor ?? null,
  ultimoAcesso: u.ultimoAcesso ?? null,
  ...(ehContaPin(u) ? {
    linkPinAtivo: Boolean(u.linkPinHash),
    pinBloqueadoAte: Date.parse(u.pinBloqueadoAte ?? '') > Date.now() ? u.pinBloqueadoAte : null,
  } : {}),
});

// ---------- contas (API e terminal) ----------
// conta nova e senha nova nascem em convites.mjs (link único); aqui só sai

export function removerConta(id) {
  return emFila(async () => {
    const lista = usuarios();
    const i = lista.findIndex((u) => u.id === id);
    if (i < 0) throw falha(404, 'Esse usuário não existe.');
    if (lista.length === 1) throw falha(409, 'Esse é o único usuário. Convide outra pessoa antes de remover este.');
    if (ultimoGestor(lista, lista[i])) throw falha(409, `${MSG_ULTIMO_GESTOR} de remover esta.`);
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

export const sha256 = (t) => createHash('sha256').update(t).digest('hex');
const cookie =(valor, maxAge) => `${NOME_COOKIE}=${valor}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
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
  // 21/10: conta de PIN não entra por senha (gasta o mesmo scrypt e dá a mesma resposta de senha errada)
  const porSenha = u && !ehContaPin(u);
  const ok = corpo.senha.length <= 1024 && (await conferirSenha(corpo.senha, porSenha ? u.hash : await hashFalso())) && porSenha;
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
  if (ehContaPin(sess.usuario)) return json(res, 409, { erro: 'Essa conta entra por link e PIN: não tem senha pra trocar.' });
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

// ---------- link + PIN (21/10, Pedro) ----------
// Conta com acesso 'pin' (o Diretor contábil que entra sem senha): um link pessoal, /entrar?pin=<token> (32 bytes
// aleatórios em base64url; no disco só o sha256 em linkPinHash), mais um PIN de 4 números (pinHash, o mesmo scrypt
// da senha). O link vale até alguém gerar outro (convites.mjs, gerarLinkPin; o velho morre). POST /api/auth/pin
// { token, pin } abre a mesma sessão de cookie do login normal.
// Cada PIN errado conta em pinFalhas ANTES do scrypt (pedido em paralelo não fura): a cada 5 o link trava 15 min
// (pinBloqueadoAte) e no 20º ele é revogado (linkPinHash null: só um Admin ou Gerente gera outro). PIN certo zera a
// conta. Link desconhecido conta no balde da rede (5 em 15 min = 429), como o link único
export const PIN_OK = /^\d{4}$/;
const TOKEN_LINK = /^[A-Za-z0-9_-]{43}$/;
export const PIN_TRAVA_A_CADA = 5;
export const PIN_REVOGA_EM = 20;
const PIN_TRAVA_MS = 15 * 60_000;
export const LINK_PIN_INVALIDO = 'Este link de acesso não vale mais. Peça um link novo pra um Admin ou Gerente de Marketing.';

async function entrarPorPin(req, res, { json, corpoJson }) {
  const corpo = await corpoJson(req, 4_000);
  // conta ANTES de qualquer await: pedido em paralelo não fura
  const balde = `pin:${redeDoCliente(req)}`;
  const msRede = espera([balde]);
  if (msRede) return muitasTentativas(res, json, msRede);
  const token = typeof corpo.token === 'string' ? corpo.token : '';
  const hashLink = TOKEN_LINK.test(token) ? sha256(token) : null;
  const u = hashLink ? usuarios().find((x) => ehContaPin(x) && x.linkPinHash === hashLink) : undefined;
  if (!u) {
    contarTentativa([balde]);
    return json(res, 400, { erro: LINK_PIN_INVALIDO, linkInvalido: true });
  }
  const agoraMs = Date.now();
  const travadoAte = Date.parse(u.pinBloqueadoAte ?? '');
  if (travadoAte > agoraMs) return muitasTentativas(res, json, travadoAte - agoraMs);
  const pin = typeof corpo.pin === 'string' ? corpo.pin.trim() : '';
  if (!PIN_OK.test(pin)) return json(res, 400, { erro: 'O PIN tem 4 números.' });
  if (scryptOcupado()) {
    res.setHeader('retry-after', '5');
    return json(res, 503, { erro: 'Muita gente tentando entrar agora. Espere alguns segundos e tente de novo.' });
  }
  // a tentativa conta já (e trava provisória no 5º, 10º...): quem chega em paralelo enquanto o scrypt roda espera
  const n = (Number(u.pinFalhas) || 0) + 1;
  u.pinFalhas = n;
  if (n % PIN_TRAVA_A_CADA === 0) u.pinBloqueadoAte = new Date(agoraMs + PIN_TRAVA_MS).toISOString();
  gravar('usuarios').catch(() => {});
  const ok = await conferirSenha(pin, u.pinHash);
  // a conta pode ter mudado no meio (link novo pelo terminal, conta removida): vale a de agora, com o mesmo link
  const conta = usuarios().find((x) => x.id === u.id && ehContaPin(x) && x.linkPinHash === hashLink);
  if (!conta) return json(res, 400, { erro: LINK_PIN_INVALIDO, linkInvalido: true });
  if (ok) {
    Object.assign(conta, { pinFalhas: 0, pinBloqueadoAte: null });
    await abrirSessao(req, res, conta);
    console.log(`Entrou pelo link e PIN: ${conta.usuario}`);
    return json(res, 200, { ok: true, usuario: resumo(conta) });
  }
  const falhas = Number(conta.pinFalhas) || 0;
  if (falhas >= PIN_REVOGA_EM) {
    Object.assign(conta, { linkPinHash: null, pinBloqueadoAte: null });
    await gravar('usuarios').catch(() => {});
    console.log(`Link de PIN revogado (${PIN_REVOGA_EM} PINs errados): ${conta.usuario}`);
    return json(res, 400, { erro: `O PIN foi errado ${PIN_REVOGA_EM} vezes e este link foi cancelado. Peça um link novo pra um Admin ou Gerente de Marketing.`, linkInvalido: true });
  }
  await gravar('usuarios').catch(() => {});
  const ate = Date.parse(conta.pinBloqueadoAte ?? '');
  if (ate > Date.now()) {
    console.log(`Link de PIN travado por 15 min (${falhas} PINs errados): ${conta.usuario}`);
    return muitasTentativas(res, json, ate - Date.now());
  }
  return json(res, 401, { erro: 'PIN errado.', restam: PIN_TRAVA_A_CADA - (falhas % PIN_TRAVA_A_CADA) });
}

// ---------- corpo que ainda está chegando (21/10, revisão do upload) ----------
// Pedido recusado com o corpo ainda chegando (upload de até 200 MB, por exemplo) responde com connection: close: o
// servidor não lê (e joga fora) o resto só pra manter a conexão viva. A regra é esta, uma só: o json do server.mjs
// chama em toda resposta de erro e o upload (envios.mjs) também
export function corpoChegando(req) {
  const temCorpo = req.headers['transfer-encoding'] != null || Number(req.headers['content-length']) > 0;
  return temCorpo && !req.complete && !req.readableEnded;
}
export function fecharSeCorpoChegando(req, res) {
  if (req && !res.headersSent && corpoChegando(req)) res.setHeader('connection', 'close');
}

// /api/auth/<acao>
export async function rotaAuth(req, res, acao, sess, ferramentas) {
  const { json } = ferramentas;
  const m = req.method;
  if (acao === 'estado' && m === 'GET') {
    return json(res, 200, { logado: Boolean(sess), usuario: sess ? resumo(sess.usuario) : null, semUsuarios: usuarios().length === 0 });
  }
  if (acao === 'entrar' && m === 'POST') return entrar(req, res, ferramentas);
  // 21/10: link + PIN (sem sessão, como o entrar)
  if (acao === 'pin' && m === 'POST') return entrarPorPin(req, res, ferramentas);
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
