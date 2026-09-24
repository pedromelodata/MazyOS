// Contas da Gestão de Marketing pelo terminal, pra quando ninguém consegue entrar pela tela:
//   npm run usuario convite [nome]      link único de primeiro acesso (conta nova)
//   npm run usuario redefinir <login>   link único pra pessoa criar uma senha nova
//   npm run usuario listar
//   npm run usuario remover <login>
// Conta nova e senha nova só nascem pelo link (convites.mjs): ninguém digita senha aqui.
// Pode rodar com o servidor no ar: ele relê usuarios.json, sessoes.json e convites.json quando mudam.
import readline from 'node:readline';
import { DATA_DIR } from './db.mjs';
import { usuarios, removerConta, sessoesAtivas } from './auth.mjs';
import { gerarConvite, pendentes, temPublicUrl } from './convites.mjs';

const tty = Boolean(process.stdin.isTTY);
let linhas = null;

function perguntar(texto) {
  process.stdout.write(texto);
  linhas ??= readline.createInterface({ input: process.stdin, crlfDelay: Infinity })[Symbol.asyncIterator]();
  return linhas.next().then((r) => {
    if (r.done) {
      console.error('\nEntrada acabou antes da resposta.');
      process.exit(1);
    }
    return r.value;
  });
}

function acharPorLogin(bruto, comando) {
  if (!bruto) {
    console.error(`Diga qual login. Ex.: npm run usuario ${comando} pedro`);
    process.exit(1);
  }
  const login = String(bruto).trim().toLowerCase();
  const u = usuarios().find((x) => x.usuario === login);
  if (!u) {
    console.error(`Não existe usuário "${login}". Veja a lista com: npm run usuario listar`);
    process.exit(1);
  }
  return u;
}

const data = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'nunca');

function mostrarLink(link, expiraEm) {
  console.log('');
  console.log(`  ${link}`);
  console.log('');
  console.log(`Funciona uma vez só e vale até ${data(expiraEm)} (72 horas). Mande só pra essa pessoa.`);
  if (!temPublicUrl()) console.log('Sem PUBLIC_URL no .env o link aponta pra este computador (localhost). Depois do túnel permanente (deploy\\tunel-permanente.ps1) ele sai com o endereço público.');
}

async function listar() {
  const lista = usuarios();
  console.log(lista.length ? `Usuários (dados em ${DATA_DIR}):` : `Nenhum usuário ainda (dados em ${DATA_DIR}). Gere o primeiro acesso com: npm run usuario convite`);
  for (const u of lista) {
    const extras = [u.trocarSenha ? 'senha temporária' : '', `${sessoesAtivas(u.id)} sessão(ões) ativa(s)`].filter(Boolean).join(', ');
    console.log(`  ${u.usuario.padEnd(18)} ${u.nome.padEnd(24)} último acesso: ${data(u.ultimoAcesso)} · ${extras}`);
  }
  const ps = pendentes();
  if (ps.length) {
    console.log('Links esperando uso:');
    for (const c of ps) {
      const quem = c.tipo === 'novo' ? `acesso${c.nomeSugerido ? ` pra ${c.nomeSugerido}` : ''}` : `redefinição de ${c.usuario}`;
      console.log(`  ${quem.padEnd(42)} criado por ${String(c.criadoPor ?? 'terminal').padEnd(16)} vence ${data(c.expiraEm)}`);
    }
  }
}

async function convite(...nome) {
  const { convite: c, link } = await gerarConvite({ tipo: 'novo', nome: nome.join(' ') || null, criadoPor: null });
  console.log(`Link de primeiro acesso${c.nomeSugerido ? ` pra ${c.nomeSugerido}` : ''}. A pessoa escolhe o login e a senha dela:`);
  mostrarLink(link, c.expiraEm);
}

async function redefinir(bruto) {
  const u = acharPorLogin(bruto, 'redefinir');
  const { convite: c, link } = await gerarConvite({ tipo: 'redefinir', usuarioId: u.id, criadoPor: null });
  console.log(`Link de senha nova pra ${u.nome} (${u.usuario}). Os links de redefinição anteriores dessa pessoa deixaram de valer:`);
  mostrarLink(link, c.expiraEm);
  console.log('Quando a senha nova for criada, a pessoa sai de todos os outros aparelhos.');
}

async function remover(bruto) {
  const u = acharPorLogin(bruto, 'remover');
  const conf = (await perguntar(`Pra remover ${u.nome} (${u.usuario}), digite o login de novo: `)).trim().toLowerCase();
  if (conf !== u.usuario) {
    console.log('Não confere. Nada foi removido.');
    process.exit(1);
  }
  await removerConta(u.id);
  console.log(`Pronto: ${u.usuario} removido e desconectado.`);
}

const [comando, ...args] = process.argv.slice(2);
const COMANDOS = { convite, redefinir, listar, remover };
if (!Object.hasOwn(COMANDOS, comando ?? '')) {
  if (comando === 'criar') console.log('Conta nova agora só nasce por link único: npm run usuario convite [nome]');
  console.log('Uso: npm run usuario convite [nome] | redefinir <login> | listar | remover <login>');
  process.exit(comando ? 1 : 0);
}
if (!tty && comando === 'remover') console.log('(A entrada não é um terminal: a resposta é lida da primeira linha.)');
try {
  await COMANDOS[comando](...args);
  process.exit(0);
} catch (e) {
  console.error(e.status ? e.message : `Erro: ${e.message}`);
  process.exit(1);
}
