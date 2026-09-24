// Primeiro acesso e senha esquecida: só por link único (data/convites.json, fora do git).
//  - token = 32 bytes aleatórios em base64url; no disco só o sha256. O link aparece uma vez só, na resposta
//    de quem gerou (tela Usuários ou npm run usuario convite | redefinir), e nunca vai pro log
//  - vale 72 h e uma vez só. Link novo de redefinição de alguém anula os anteriores dessa pessoa
//  - GET e POST /api/auth/convite abrem sem sessão: link desconhecido, vencido, usado ou revogado dá a mesma
//    resposta, e 5 desses por rede em 15 min = 429 (a regra do login, num balde próprio)
//  - usar o link: 'novo' cria a conta, 'redefinir' troca a senha e derruba as sessões da pessoa; nos dois ela
//    já sai logada neste navegador
// Registro: { id, tokenHash, tipo, usuarioId, nomeSugerido, criadoPor (null = terminal), criadoPorId, criadoEm, expiraEm, usadoEm }.
// Usado ou vencido fica 30 dias no arquivo (histórico) e sai.
import { randomBytes, createHash } from 'node:crypto';
import { falha, novoId, agora } from './db.mjs';
import * as auth from './auth.mjs';

const VIDA = 72 * 3_600_000;
const GUARDAR = 30 * 86_400_000;
const MAX_PENDENTES = 50;
const TOKEN_OK = /^[A-Za-z0-9_-]{43}$/;
const INVALIDO = 'Este link de acesso não vale mais. Cada link funciona uma vez só e por 72 horas. Peça um link novo pra alguém da equipe.';
const RESPOSTA_INVALIDA = { valido: false, tipo: null, nomeSugerido: null, expiraEm: null, erro: INVALIDO };

const sha256 = (t) => createHash('sha256').update(t).digest('hex');

// base dos links: PUBLIC_URL (link público) ou este computador
export function baseLink() {
  try {
    const u = new URL(String(process.env.PUBLIC_URL ?? '').trim());
    if (['http:', 'https:'].includes(u.protocol) && u.host) return u.origin;
  } catch {}
  return `http://localhost:${auth.PORTA}`;
}
const linkDe = (token) => `${baseLink()}/entrar?convite=${token}`;
export const temPublicUrl = () => !baseLink().startsWith('http://localhost:');

const dono = (c) => (c.tipo === 'redefinir' ? auth.usuarios().find((u) => u.id === c.usuarioId) ?? null : null);

function pendente(c, agoraMs = Date.now()) {
  if (c.usadoEm || !(Date.parse(c.expiraEm) > agoraMs)) return false;
  // link de quem já saiu da equipe não vale
  if (c.criadoPorId && !auth.usuarios().some((u) => u.id === c.criadoPorId)) return false;
  return c.tipo === 'novo' || (c.tipo === 'redefinir' && Boolean(dono(c)));
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
export function gerarConvite({ tipo = 'novo', usuarioId = null, nome = null, criadoPor = null, criadoPorId = null }) {
  return auth.emFila(async () => {
    const lista = auth.convites();
    const agoraMs = Date.now();
    podar(lista, agoraMs);
    let nomeSugerido = null;
    if (tipo === 'redefinir') {
      const u = auth.usuarios().find((x) => x.id === usuarioId);
      if (!u) throw falha(404, 'Esse usuário não existe.');
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
        conta = { id: novoId('usr'), usuario: login, nome, hash, criadoEm: quando, criadoPor: atual.criadoPor ?? null, trocarSenha: false, ultimoAcesso: null };
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

// /api/convites, /api/convites/:id
export async function rotaConvites(req, res, id, sess, { json, corpoJson }) {
  if (!sess) return auth.semSessao(res, json);
  const m = req.method;
  if (!id) {
    if (m === 'GET') return json(res, 200, pendentes());
    if (m === 'POST') {
      const b = await corpoJson(req, 16_000);
      const { convite: c, link } = await gerarConvite({ tipo: 'novo', nome: b.nome ?? null, criadoPor: sess.usuario.nome, criadoPorId: sess.usuario.id });
      console.log(`Link de acesso gerado por ${sess.usuario.usuario}${c.nomeSugerido ? ` (pra ${c.nomeSugerido})` : ''}`);
      return json(res, 201, { id: c.id, tipo: c.tipo, nomeSugerido: c.nomeSugerido, link, expiraEm: c.expiraEm });
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

// /api/usuarios, /api/usuarios/:id, /api/usuarios/:id/redefinir
export async function rotaUsuarios(req, res, id, sub, sess, { json }) {
  if (!sess) return auth.semSessao(res, json);
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
  if (sub) return json(res, 404, { erro: 'Rota não existe.' });
  if (m === 'DELETE') {
    const u = await auth.removerConta(id);
    console.log(`Conta removida: ${u.usuario} (por ${sess.usuario.usuario})`);
    if (u.id === eu) auth.limparCookie(res);
    return json(res, 200, { ok: true, saiu: u.id === eu });
  }
  return json(res, 405, { erro: 'Método não permitido.' });
}
