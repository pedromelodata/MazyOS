// Primeiro acesso e senha esquecida: só por link único (data/convites.json, fora do git).
//  - token = 32 bytes aleatórios em base64url; no disco só o sha256. O link aparece uma vez só, na resposta
//    de quem gerou (tela Usuários ou npm run usuario convite | redefinir), e nunca vai pro log
//  - vale 72 h e uma vez só. Link novo de redefinição de alguém anula os anteriores dessa pessoa
//  - GET e POST /api/auth/convite abrem sem sessão: link desconhecido, vencido, usado ou revogado dá a mesma
//    resposta, e 5 desses por rede em 15 min = 429 (a regra do login, num balde próprio)
//  - usar o link: 'novo' cria a conta, 'redefinir' troca a senha e derruba as sessões da pessoa; nos dois ela
//    já sai logada neste navegador
// Registro: { id, tokenHash, tipo, usuarioId, nomeSugerido, papel, criadoPor (null = terminal), criadoPorId, criadoEm, expiraEm, usadoEm }.
// 21/10: o link de conta nova leva o perfil (admin, gerente, operador ou diretor; sem perfil = operador). A primeira
// conta é admin
// Usado ou vencido fica 30 dias no arquivo (histórico) e sai.
// 21/10 (Pedro): conta de link + PIN (auth.mjs, "link + PIN"). salvarContaPin cria ou atualiza a conta (terminal) e
// gerarLinkPin troca o link (terminal e POST /api/usuarios/:id/link-pin, só Admin e Gerente): o link aparece uma vez
// só, o velho morre na hora, a contagem de PIN errado zera e as sessões da conta caem (link vazado não deixa ninguém
// dentro). Conta de PIN não recebe link de redefinição de senha.
// Usuários e links: só Admin e Gerente de Marketing (o servidor confere o perfil antes e as rotas conferem de novo)
import { randomBytes, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { falha, novoId, agora, arquivoDados } from './db.mjs';
import * as auth from './auth.mjs';

const VIDA = 72 * 3_600_000;
const GUARDAR = 30 * 86_400_000;
const MAX_PENDENTES = 50;
const TOKEN_OK = /^[A-Za-z0-9_-]{43}$/;
const INVALIDO = 'Este link de acesso não vale mais. Cada link funciona uma vez só e por 72 horas. Peça um link novo pra alguém da equipe.';
const RESPOSTA_INVALIDA = { valido: false, tipo: null, nomeSugerido: null, expiraEm: null, erro: INVALIDO };

const sha256 = (t) => createHash('sha256').update(t).digest('hex');

// base dos links: PUBLIC_URL (túnel permanente), senão o túnel rápido no ar (data/tunel.log), senão este computador
function tunelRapido() {
  try {
    const log = readFileSync(arquivoDados('tunel.log'), 'utf8');
    const achados = log.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g);
    return achados ? achados.at(-1) : null;
  } catch {
    return null;
  }
}
export function baseLink() {
  try {
    const u = new URL(String(process.env.PUBLIC_URL ?? '').trim());
    if (['http:', 'https:'].includes(u.protocol) && u.host) return u.origin;
  } catch {}
  return tunelRapido() ?? `http://localhost:${auth.PORTA}`;
}
const linkDe = (token) => `${baseLink()}/entrar?convite=${token}`;
export const temPublicUrl = () => !baseLink().startsWith('http://localhost:');

const dono = (c) => (c.tipo === 'redefinir' ? auth.usuarios().find((u) => u.id === c.usuarioId) ?? null : null);

function pendente(c, agoraMs = Date.now()) {
  if (c.usadoEm || !(Date.parse(c.expiraEm) > agoraMs)) return false;
  // link de quem já saiu da equipe não vale
  if (c.criadoPorId && !auth.usuarios().some((u) => u.id === c.criadoPorId)) return false;
  // 21/10: redefinição de senha de quem virou conta de PIN não vale (ela não tem senha)
  return c.tipo === 'novo' || (c.tipo === 'redefinir' && Boolean(dono(c)) && !auth.ehContaPin(dono(c)));
}

// usado ou vencido há mais de 30 dias sai do arquivo (registro torto também)
function podar(lista, agoraMs) {
  for (let i = lista.length - 1; i >= 0; i--) {
    const c = lista[i];
    const fim = Date.parse(c.usadoEm || c.expiraEm);
    if (!(agoraMs - fim < GUARDAR)) lista.splice(i, 1);
  }
}

const paraTela = (c) => {
  const u = dono(c);
  return {
    id: c.id,
    tipo: c.tipo,
    usuarioId: c.tipo === 'redefinir' ? c.usuarioId : null,
    usuario: u?.usuario ?? null,
    nomeSugerido: u?.nome ?? c.nomeSugerido ?? null,
    papel: c.tipo === 'novo' ? auth.papelDe({ papel: c.papel }) : null,
    criadoPor: c.criadoPor ?? null,
    criadoEm: c.criadoEm,
    expiraEm: c.expiraEm,
  };
};

// links esperando uso, mais novos primeiro (sem token nem hash)
export function pendentes() {
  const agoraMs = Date.now();
  return auth.convites().filter((c) => pendente(c, agoraMs)).sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm))).map(paraTela);
}

// { convite, link }: o token só existe aqui dentro e no link devolvido
export function gerarConvite({ tipo = 'novo', usuarioId = null, nome = null, papel = 'operador', criadoPor = null, criadoPorId = null }) {
  return auth.emFila(async () => {
    const lista = auth.convites();
    const agoraMs = Date.now();
    podar(lista, agoraMs);
    let nomeSugerido = null;
    if (tipo === 'redefinir') {
      const u = auth.usuarios().find((x) => x.id === usuarioId);
      if (!u) throw falha(404, 'Esse usuário não existe.');
      if (auth.ehContaPin(u)) throw falha(409, 'Essa conta entra por link e PIN, sem senha. Gere outro link de PIN pra ela.');
      nomeSugerido = u.nome;
      for (let i = lista.length - 1; i >= 0; i--) {
        if (lista[i].tipo === 'redefinir' && lista[i].usuarioId === u.id && !lista[i].usadoEm) lista.splice(i, 1);
      }
    } else if (tipo === 'novo') {
      nomeSugerido = nome == null || (typeof nome === 'string' && !nome.trim()) ? null : auth.conferirNome(nome);
      if (lista.filter((c) => c.tipo === 'novo' && pendente(c, agoraMs)).length >= MAX_PENDENTES) {
        throw falha(409, `Já existem ${MAX_PENDENTES} links de acesso esperando uso. Revogue os que não vão ser usados antes de gerar outro.`);
      }
    } else throw falha(400, 'Tipo de link desconhecido.');
    const token = randomBytes(32).toString('base64url');
    const c = {
      id: novoId('cnv'),
      tokenHash: sha256(token),
      tipo,
      usuarioId: tipo === 'redefinir' ? usuarioId : null,
      nomeSugerido,
      papel: tipo === 'novo' ? auth.conferirPapel(papel ?? 'operador') : null,
      criadoPor: criadoPor ?? null,
      criadoPorId: criadoPorId ?? null,
      criadoEm: new Date(agoraMs).toISOString(),
      expiraEm: new Date(agoraMs + VIDA).toISOString(),
      usadoEm: null,
    };
    lista.push(c);
    await auth.gravarArquivo('convites');
    return { convite: c, link: linkDe(token) };
  });
}

export function revogarConvite(id) {
  return auth.emFila(async () => {
    const lista = auth.convites();
    const i = lista.findIndex((c) => c.id === id && pendente(c));
    if (i < 0) throw falha(404, 'Esse link não existe ou já não vale.');
    const [c] = lista.splice(i, 1);
    await auth.gravarArquivo('convites');
    return c;
  });
}

// ---------- link + PIN (21/10, Pedro) ----------

const linkPinDe = (token) => `${baseLink()}/entrar?pin=${token}`;

// link novo pra conta de PIN, dentro da fila de contas: o velho morre, a contagem de PIN errado zera e as sessões
// dela caem. Só existe aqui o token; no disco fica o sha256
function trocarLink(u) {
  const token = randomBytes(32).toString('base64url');
  Object.assign(u, { linkPinHash: sha256(token), pinFalhas: 0, pinBloqueadoAte: null });
  auth.tirarSessoes((s) => s.usuarioId === u.id);
  return linkPinDe(token);
}

// { usuario, link }
export function gerarLinkPin(usuarioId) {
  return auth.emFila(async () => {
    const u = auth.usuarios().find((x) => x.id === usuarioId);
    if (!u) throw falha(404, 'Esse usuário não existe.');
    if (!auth.ehContaPin(u)) throw falha(409, 'Essa conta entra com usuário e senha. Link de PIN é só pra conta de PIN.');
    const link = trocarLink(u);
    await Promise.all([auth.gravarArquivo('usuarios'), auth.gravarArquivo('sessoes')]);
    return { usuario: u, link };
  });
}

// cria ou atualiza a conta de PIN pelo login (terminal). ajusta: true ou false muda ajustaDepoisDeAprovada; null
// mantém o que a conta tem (conta nova: false). Conta de senha que vira de PIN perde a senha. { usuario, link, novo }
export async function salvarContaPin({ usuario, nome, papel = 'diretor', pin, ajusta = null }) {
  const login = auth.conferirLogin(usuario);
  const nomeOk = auth.conferirNome(nome);
  const papelOk = auth.conferirPapel(papel);
  if (typeof pin !== 'string' || !auth.PIN_OK.test(pin)) throw falha(400, 'O PIN precisa ter 4 números.');
  const pinHash = await auth.hashSenha(pin);
  return auth.emFila(async () => {
    const lista = auth.usuarios();
    let u = lista.find((x) => x.usuario === login);
    const novo = !u;
    if (u) {
      if (!['admin', 'gerente'].includes(papelOk) && auth.ultimoGestor(lista, u)) throw falha(409, `${auth.MSG_ULTIMO_GESTOR} de trocar este.`);
      delete u.hash;
      Object.assign(u, {
        nome: nomeOk, papel: papelOk, acesso: 'pin', pinHash, trocarSenha: false,
        ajustaDepoisDeAprovada: ajusta == null ? u.ajustaDepoisDeAprovada === true : Boolean(ajusta),
      });
    } else {
      u = {
        id: novoId('usr'), usuario: login, nome: nomeOk, papel: papelOk, acesso: 'pin', pinHash, linkPinHash: null, pinFalhas: 0,
        pinBloqueadoAte: null, ajustaDepoisDeAprovada: ajusta === true, criadoEm: agora(), criadoPor: null, trocarSenha: false, ultimoAcesso: null,
      };
      lista.push(u);
    }
    const link = trocarLink(u);
    await Promise.all([auth.gravarArquivo('usuarios'), auth.gravarArquivo('sessoes')]);
    return { usuario: u, link, novo };
  });
}

function acharPorToken(token) {
  if (typeof token !== 'string' || !TOKEN_OK.test(token)) return null;
  const h = sha256(token);
  const c = auth.convites().find((x) => x.tokenHash === h);
  return c && pendente(c) ? c : null;
}

// ---------- rotas ----------

// GET /api/auth/convite?token=  e  POST /api/auth/convite (sem sessão)
export async function rotaConvitePublica(req, res, url, { json, corpoJson }) {
  const m = req.method;
  if (m !== 'GET' && m !== 'POST') return json(res, 405, { erro: 'Método não permitido.' });
  const corpo = m === 'POST' ? await corpoJson(req, 16_000) : null;
  // conta ANTES de qualquer await: pedido em paralelo não fura
  const balde = `convite:${auth.redeDoCliente(req)}`;
  const ms = auth.espera([balde]);
  if (ms) return auth.muitasTentativas(res, json, ms);
  const c = acharPorToken(m === 'GET' ? url.searchParams.get('token') : corpo.token);
  if (!c) {
    auth.contarTentativa([balde]);
    return json(res, m === 'GET' ? 200 : 400, RESPOSTA_INVALIDA);
  }
  if (m === 'GET') {
    const u = dono(c);
    return json(res, 200, { valido: true, tipo: c.tipo, nomeSugerido: u?.nome ?? c.nomeSugerido ?? null, expiraEm: c.expiraEm, usuario: u?.usuario ?? null });
  }
  return usar(req, res, c, corpo, json);
}

async function usar(req, res, c, corpo, json) {
  const senha = corpo.senha;
  let login = null;
  let nome = null;
  if (c.tipo === 'novo') {
    login = auth.conferirLogin(corpo.usuario);
    nome = auth.conferirNome(corpo.nome);
    auth.conferirSenhaNova(senha, login);
    if (auth.usuarios().some((u) => u.usuario === login)) throw falha(409, 'Esse login já existe. Escolha outro.');
  } else auth.conferirSenhaNova(senha, dono(c).usuario);
  if (auth.scryptOcupado()) {
    res.setHeader('retry-after', '5');
    return json(res, 503, { erro: 'Muita gente entrando agora. Espere alguns segundos e tente de novo.' });
  }
  const hash = await auth.hashSenha(senha);
  let u;
  try {
    u = await auth.emFila(async () => {
      // o mesmo link usado duas vezes juntas: só o primeiro passa
      const atual = auth.convites().find((x) => x.id === c.id);
      if (!atual || atual.tokenHash !== c.tokenHash || !pendente(atual)) throw Object.assign(falha(400, INVALIDO), { invalido: true });
      const quando = agora();
      let conta;
      if (atual.tipo === 'novo') {
        if (auth.usuarios().some((x) => x.usuario === login)) throw falha(409, 'Esse login já existe. Escolha outro.');
        const papel = auth.usuarios().length ? auth.papelDe({ papel: atual.papel }) : 'admin';
        conta = { id: novoId('usr'), usuario: login, nome, hash, papel, criadoEm: quando, criadoPor: atual.criadoPor ?? null, trocarSenha: false, ultimoAcesso: null };
        auth.usuarios().push(conta);
        atual.usuarioId = conta.id;
      } else {
        conta = dono(atual);
        Object.assign(conta, { hash, trocarSenha: false });
        auth.tirarSessoes((s) => s.usuarioId === conta.id);
      }
      atual.usadoEm = quando;
      await Promise.all([auth.gravarArquivo('usuarios'), auth.gravarArquivo('convites'), atual.tipo === 'redefinir' ? auth.gravarArquivo('sessoes') : null]);
      return conta;
    });
  } catch (e) {
    if (e.invalido) return json(res, 400, RESPOSTA_INVALIDA);
    throw e;
  }
  await auth.abrirSessao(req, res, u);
  console.log(c.tipo === 'novo' ? `Conta criada pelo link de acesso: ${u.usuario}` : `Senha nova pelo link de redefinição: ${u.usuario}`);
  return json(res, 200, { ok: true, tipo: c.tipo, usuario: auth.resumo(u) });
}

// 21/10 (Pedro): usuários e links só pra Admin e Gerente de Marketing. O servidor já conferiu (auth.podeApi); aqui de
// novo, por dentro
const SEM_GESTAO = 'O seu perfil não tem acesso a isso. Peça pra um Admin ou Gerente de Marketing.';

// /api/convites, /api/convites/:id
export async function rotaConvites(req, res, id, sess, { json, corpoJson }) {
  if (!sess) return auth.semSessao(res, json);
  if (!auth.ehGestao(sess.usuario)) return json(res, 403, { erro: SEM_GESTAO, perfil: auth.papelDe(sess.usuario) });
  const m = req.method;
  if (!id) {
    if (m === 'GET') return json(res, 200, pendentes());
    if (m === 'POST') {
      const b = await corpoJson(req, 16_000);
      const { convite: c, link } = await gerarConvite({ tipo: 'novo', nome: b.nome ?? null, papel: b.papel ?? 'operador', criadoPor: sess.usuario.nome, criadoPorId: sess.usuario.id });
      console.log(`Link de acesso (${auth.NOME_PAPEL[c.papel]}) gerado por ${sess.usuario.usuario}${c.nomeSugerido ? ` (pra ${c.nomeSugerido})` : ''}`);
      return json(res, 201, { id: c.id, tipo: c.tipo, nomeSugerido: c.nomeSugerido, papel: c.papel, link, expiraEm: c.expiraEm });
    }
    return json(res, 405, { erro: 'Método não permitido.' });
  }
  if (m === 'DELETE') {
    const c = await revogarConvite(id);
    console.log(`Link ${c.tipo === 'novo' ? 'de acesso' : 'de redefinição'} revogado por ${sess.usuario.usuario}`);
    return json(res, 200, { ok: true });
  }
  return json(res, 405, { erro: 'Método não permitido.' });
}

// /api/usuarios, /api/usuarios/:id, /api/usuarios/:id/redefinir, /api/usuarios/:id/link-pin
export async function rotaUsuarios(req, res, id, sub, sess, { json, corpoJson }) {
  if (!sess) return auth.semSessao(res, json);
  if (!auth.ehGestao(sess.usuario)) return json(res, 403, { erro: SEM_GESTAO, perfil: auth.papelDe(sess.usuario) });
  const m = req.method;
  const eu = sess.usuario.id;
  if (!id) {
    if (m === 'GET') {
      const lista = [...auth.usuarios()].sort((a, b) => String(a.criadoEm).localeCompare(String(b.criadoEm)));
      return json(res, 200, lista.map((u) => ({ ...auth.publico(u), voce: u.id === eu })));
    }
    // conta com senha temporária saiu: conta nova só por link único
    if (m === 'POST') return json(res, 410, { erro: 'Conta nova agora entra só por link único. Em Usuários, use "+ Gerar link de acesso".' });
    return json(res, 405, { erro: 'Método não permitido.' });
  }
  if (sub === 'redefinir') {
    if (m !== 'POST') return json(res, 405, { erro: 'Método não permitido.' });
    const { convite: c, link } = await gerarConvite({ tipo: 'redefinir', usuarioId: id, criadoPor: sess.usuario.nome, criadoPorId: sess.usuario.id });
    console.log(`Link de redefinição gerado pra ${dono(c)?.usuario ?? id} (por ${sess.usuario.usuario})`);
    return json(res, 201, { id: c.id, tipo: c.tipo, usuarioId: id, link, expiraEm: c.expiraEm });
  }
  // 21/10 (Pedro): outro link de PIN (o velho morre). O link aparece só nesta resposta e nunca vai pro log
  if (sub === 'link-pin') {
    if (m !== 'POST') return json(res, 405, { erro: 'Método não permitido.' });
    const { usuario: u, link } = await gerarLinkPin(id);
    console.log(`Link de PIN novo pra ${u.usuario} (por ${sess.usuario.usuario})`);
    return json(res, 201, { usuarioId: u.id, link });
  }
  if (sub) return json(res, 404, { erro: 'Rota não existe.' });
  // 21/10: trocar o perfil (só Admin e Gerente chegam aqui; o servidor confere o perfil antes da rota e a rota de novo)
  if (m === 'PUT') {
    const b = await corpoJson(req, 4_000);
    const u = await auth.trocarPapel(id, b.papel);
    console.log(`Perfil de ${u.usuario} agora é ${auth.NOME_PAPEL[u.papel]} (por ${sess.usuario.usuario})`);
    return json(res, 200, { ...auth.publico(u), voce: u.id === eu });
  }
  if (m === 'DELETE') {
    const u = await auth.removerConta(id);
    console.log(`Conta removida: ${u.usuario} (por ${sess.usuario.usuario})`);
    if (u.id === eu) auth.limparCookie(res);
    return json(res, 200, { ok: true, saiu: u.id === eu });
  }
  return json(res, 405, { erro: 'Método não permitido.' });
}
