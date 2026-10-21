// Contas da Gestão de Marketing pelo terminal, pra quando ninguém consegue entrar pela tela:
//   npm run usuario convite [nome] [--papel admin|gerente|operador|diretor]   link único de primeiro acesso (conta
//                                       nova; sem --papel é operador, e a primeira conta do sistema é admin)
//   npm run usuario redefinir <login>   link único pra pessoa criar uma senha nova
//   npm run usuario listar
//   npm run usuario remover <login>
//   npm run usuario papel <login> <papel>   troca o perfil (admin, gerente, operador ou diretor)
//   npm run usuario pin <login> "<Nome>" [--papel diretor] [--pin <4 números>] [--ajusta-aprovada | --sem-ajuste-aprovada]
//                                       conta que entra por link + PIN (cria ou atualiza; imprime o link)
//   npm run usuario link-pin <login>    outro link pra conta de PIN (o velho morre)
// Conta nova e senha nova só nascem pelo link (convites.mjs): ninguém digita senha aqui. O PIN da conta de PIN é a
// exceção: sem --pin, ele é perguntado (e não fica no histórico do terminal).
// 21/10 (Pedro): perfil Gerente de Marketing e conta de link + PIN (auth.mjs). No pin, sem --ajusta-aprovada nem
// --sem-ajuste-aprovada a permissão de ajustar peça já aprovada fica como está (conta nova: sem). Gerar outro link ou
// mudar o PIN derruba as sessões da conta.
// Pode rodar com o servidor no ar: ele relê usuarios.json, sessoes.json e convites.json quando mudam.
import readline from 'node:readline';
import { DATA_DIR } from './db.mjs';
import { usuarios, removerConta, sessoesAtivas, papelDe, NOME_PAPEL, trocarPapel, ehContaPin, PIN_OK, ajustaAprovada } from './auth.mjs';
import { gerarConvite, pendentes, temPublicUrl, salvarContaPin, gerarLinkPin } from './convites.mjs';

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
  avisoLocal();
}

function avisoLocal() {
  if (!temPublicUrl()) console.log('Sem PUBLIC_URL no .env o link aponta pra este computador (localhost). Depois do túnel permanente (deploy\\tunel-permanente.ps1) ele sai com o endereço público.');
}

function mostrarLinkPin(link) {
  console.log('');
  console.log(`  ${link}`);
  console.log('');
  console.log('O link vale até alguém gerar outro e só abre com o PIN. Mande o link e o PIN por caminhos separados, só pra essa pessoa.');
  console.log('5 PINs errados travam o link por 15 minutos; 20 cancelam o link (aí gere outro com: npm run usuario link-pin <login>).');
  avisoLocal();
}

// "--chave valor" sai da lista; devolve [valor ou null, o resto]
function tirarOpcao(partes, chave) {
  const i = partes.indexOf(chave);
  if (i < 0) return [null, partes];
  return [partes[i + 1] ?? '', [...partes.slice(0, i), ...partes.slice(i + 2)]];
}

// 21/10 (Pedro): a permissão de ajustar o que já foi aprovado só vale com o perfil Diretor contábil (auth.ajustaAprovada)
const ajusteAprovada = (u) => (ajustaAprovada(u) ? 'ajusta peça já aprovada'
  : u.ajustaDepoisDeAprovada === true ? 'permissão de ajustar peça aprovada parada (só vale com o perfil Diretor contábil)' : '');

async function listar() {
  const lista = usuarios();
  console.log(lista.length ? `Usuários (dados em ${DATA_DIR}):` : `Nenhum usuário ainda (dados em ${DATA_DIR}). Gere o primeiro acesso com: npm run usuario convite`);
  for (const u of lista) {
    const pin = ehContaPin(u)
      ? [`link + PIN${u.linkPinHash ? '' : ' (link cancelado: gere outro)'}`, Date.parse(u.pinBloqueadoAte ?? '') > Date.now() ? `travado até ${data(u.pinBloqueadoAte)}` : '',
        ajusteAprovada(u)]
      : [];
    const extras = [...pin, u.trocarSenha ? 'senha temporária' : '', `${sessoesAtivas(u.id)} sessão(ões) ativa(s)`].filter(Boolean).join(', ');
    console.log(`  ${u.usuario.padEnd(18)} ${u.nome.padEnd(24)} ${NOME_PAPEL[papelDe(u)].padEnd(21)} último acesso: ${data(u.ultimoAcesso)} · ${extras}`);
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

async function convite(...partes) {
  const [papel, resto] = tirarOpcao(partes, '--papel');
  const nome = resto.join(' ');
  const { convite: c, link } = await gerarConvite({ tipo: 'novo', nome: nome || null, papel: papel ?? 'operador', criadoPor: null });
  console.log(`Link de primeiro acesso (${NOME_PAPEL[c.papel]})${c.nomeSugerido ? ` pra ${c.nomeSugerido}` : ''}. A pessoa escolhe o login e a senha dela:`);
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

// 21/10 (Pedro): troca o perfil pelo terminal
async function papel(bruto, novo) {
  const u = acharPorLogin(bruto, 'papel');
  if (!novo) {
    console.error('Diga o perfil novo: admin, gerente, operador ou diretor. Ex.: npm run usuario papel pedromaia gerente');
    process.exit(1);
  }
  const antes = papelDe(u);
  const atual = await trocarPapel(u.id, String(novo).trim().toLowerCase());
  console.log(antes === atual.papel
    ? `${atual.nome} (${atual.usuario}) já era ${NOME_PAPEL[atual.papel]}.`
    : `Pronto: ${atual.nome} (${atual.usuario}) passou de ${NOME_PAPEL[antes]} pra ${NOME_PAPEL[atual.papel]}.`);
}

// 21/10 (Pedro): conta de link + PIN
async function pin(login, ...partes) {
  if (!login || login.startsWith('--')) {
    console.error('Uso: npm run usuario pin <login> "<Nome>" [--papel diretor] [--pin <4 números>] [--ajusta-aprovada | --sem-ajuste-aprovada]');
    process.exit(1);
  }
  let resto = partes;
  let papelNovo;
  let pinNovo;
  [papelNovo, resto] = tirarOpcao(resto, '--papel');
  [pinNovo, resto] = tirarOpcao(resto, '--pin');
  const sim = resto.includes('--ajusta-aprovada');
  const nao = resto.includes('--sem-ajuste-aprovada');
  if (sim && nao) {
    console.error('Escolha um só: --ajusta-aprovada ou --sem-ajuste-aprovada.');
    process.exit(1);
  }
  resto = resto.filter((x) => x !== '--ajusta-aprovada' && x !== '--sem-ajuste-aprovada');
  const desconhecida = resto.find((x) => x.startsWith('--'));
  if (desconhecida) {
    console.error(`Opção desconhecida: ${desconhecida}`);
    process.exit(1);
  }
  const existente = usuarios().find((x) => x.usuario === String(login).trim().toLowerCase());
  const nome = resto.join(' ').trim() || existente?.nome || '';
  if (pinNovo == null) pinNovo = (await perguntar('PIN de 4 números: ')).trim();
  if (!PIN_OK.test(String(pinNovo))) {
    console.error('O PIN precisa ter 4 números.');
    process.exit(1);
  }
  const { usuario: u, link, novo } = await salvarContaPin({
    usuario: login, nome, papel: papelNovo ? papelNovo.trim().toLowerCase() : existente ? papelDe(existente) : 'diretor', pin: pinNovo,
    ajusta: sim ? true : nao ? false : null,
  });
  console.log(`${novo ? 'Conta criada' : 'Conta atualizada'}: ${u.nome} (${u.usuario}), ${NOME_PAPEL[papelDe(u)]}, entra por link + PIN.`);
  console.log(`Ajusta peça ou envio já aprovado: ${ajustaAprovada(u) ? 'sim' : u.ajustaDepoisDeAprovada === true ? 'não (a permissão só vale com o perfil Diretor contábil)' : 'não'}.`);
  if (!novo) console.log('O link anterior deixou de valer e a conta saiu dos aparelhos onde estava.');
  mostrarLinkPin(link);
}

async function linkPin(bruto) {
  const u = acharPorLogin(bruto, 'link-pin');
  if (!ehContaPin(u)) {
    console.error(`${u.usuario} entra com usuário e senha. Pra virar conta de PIN: npm run usuario pin ${u.usuario} "${u.nome}" --pin <4 números>`);
    process.exit(1);
  }
  const { link } = await gerarLinkPin(u.id);
  console.log(`Link novo pra ${u.nome} (${u.usuario}). O anterior deixou de valer e a conta saiu dos aparelhos onde estava; o PIN continua o mesmo:`);
  mostrarLinkPin(link);
}

const [comando, ...args] = process.argv.slice(2);
const COMANDOS = { convite, redefinir, listar, remover, papel, pin, 'link-pin': linkPin };
if (!Object.hasOwn(COMANDOS, comando ?? '')) {
  if (comando === 'criar') console.log('Conta nova agora só nasce por link único: npm run usuario convite [nome]');
  console.log('Uso: npm run usuario convite [nome] [--papel admin|gerente|operador|diretor] | redefinir <login> | listar | remover <login>');
  console.log('     | papel <login> <admin|gerente|operador|diretor> | pin <login> "<Nome>" [--papel diretor] [--pin <4 números>] [--ajusta-aprovada | --sem-ajuste-aprovada]');
  console.log('     | link-pin <login>');
  process.exit(comando ? 1 : 0);
}
if (!tty && (comando === 'remover' || (comando === 'pin' && !args.includes('--pin')))) console.log('(A entrada não é um terminal: a resposta é lida da primeira linha.)');
try {
  await COMANDOS[comando](...args);
  process.exit(0);
} catch (e) {
  console.error(e.status ? e.message : `Erro: ${e.message}`);
  process.exit(1);
}
