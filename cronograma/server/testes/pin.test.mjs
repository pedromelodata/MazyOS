// Testes da conta de link + PIN (21/10, Pedro): PIN certo entra (a mesma sessão de cookie do login), PIN errado conta,
// 5 travam o link por 15 min, 20 cancelam o link, pedido em paralelo não fura a trava, conta de PIN não entra por
// senha nem troca senha nem recebe link de redefinição, link novo (tela e terminal) mata o velho, e o terminal
// (usuarios-cli.mjs pin, link-pin e papel). Num servidor de verdade numa porta livre, com a pasta de dados temporária:
// o banco de verdade (data/) não é lido. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-pin-'));
const dados = path.join(raiz, 'data');
process.env.CRONOGRAMA_DATA = dados;
mkdirSync(dados, { recursive: true });
writeFileSync(path.join(dados, 'estilos.json'), '{}');
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({ schemaVersion: 2, reels: [] }));
const auth = await import('../auth.mjs');
const convites = await import('../convites.mjs');

const SENHA = 'senha-de-teste-123';
const hash = await auth.hashSenha(SENHA);
writeFileSync(path.join(dados, 'usuarios.json'), JSON.stringify([
  { id: 'usr_ger', usuario: 'gerente', nome: 'Gerente Teste', hash, papel: 'gerente', criadoEm: '2026-01-01T00:00:00.000Z', trocarSenha: false },
  { id: 'usr_op', usuario: 'operador', nome: 'Operador Teste', hash, papel: 'operador', criadoEm: '2026-01-02T00:00:00.000Z', trocarSenha: false },
]));

const CLI = path.join(import.meta.dirname, '..', 'usuarios-cli.mjs');
const conta = (login) => auth.usuarios().find((u) => u.usuario === login);
const tokenDo = (link) => new URL(link).searchParams.get('pin');

// ---------- servidor de verdade numa porta livre ----------

const json = (res, codigo, corpo) => {
  if (codigo >= 400) auth.fecharSeCorpoChegando(res.req, res);
  res.writeHead(codigo, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(corpo));
};
// o mesmo do server.mjs (que não dá pra importar sem subir o servidor)
async function corpoJson(req, limite = 1_000_000) {
  const partes = [];
  let total = 0;
  for await (const c of req) {
    total += c.length;
    if (total > limite) throw Object.assign(new Error('Corpo grande demais.'), { status: 413 });
    partes.push(c);
  }
  const s = Buffer.concat(partes, total).toString('utf8');
  return s.trim() ? JSON.parse(s) : {};
}
const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const partes = auth.partesDaApi(url.pathname);
    if (!partes) return json(res, 400, { erro: 'Endereço inválido.' });
    const quem = req.headers['x-teste-quem'];
    const sess = quem ? { usuario: auth.usuarios().find((u) => u.usuario === quem), hash: 'teste' } : null;
    const [recurso, id, sub] = partes;
    if (recurso === 'auth') return await auth.rotaAuth(req, res, id, sess, { json, corpoJson });
    if (recurso === 'usuarios') return await convites.rotaUsuarios(req, res, id, sub, sess, { json, corpoJson });
    return json(res, 404, { erro: 'Rota não existe.' });
  } catch (e) {
    if (res.headersSent) return res.end();
    return json(res, e.status ?? 500, { erro: e.message });
  }
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
after(() => servidor.close());

function pedir(caminho, { metodo = 'POST', quem, corpo, cabecalhos = {} } = {}) {
  return new Promise((ok, erro) => {
    const cru = corpo === undefined ? null : Buffer.from(JSON.stringify(corpo));
    const h = { ...(quem ? { 'x-teste-quem': quem } : {}), ...(cru ? { 'content-length': cru.length, 'content-type': 'application/json' } : {}), ...cabecalhos };
    const req = http.request({ host: '127.0.0.1', port: servidor.address().port, path: caminho, method: metodo, headers: h }, (res) => {
      const pedacos = [];
      res.on('data', (c) => pedacos.push(c));
      res.on('end', () => {
        let j = null;
        try {
          j = JSON.parse(Buffer.concat(pedacos).toString('utf8'));
        } catch {}
        ok({ status: res.statusCode, h: res.headers, j });
      });
    });
    req.on('error', erro);
    req.end(cru ?? undefined);
  });
}
// rede: o IP que o Caddy escreveria (último valor do X-Forwarded-For; o pedido sai de 127.0.0.1), pra um teste ter o
// balde de rede só dele (21/10: o cf-connecting-ip só vale com CRONOGRAMA_PROXY=cloudflare)
const entrarPin = (token, pin, rede, cabecalhos = {}) => pedir('/api/auth/pin', { corpo: { token, pin }, cabecalhos: { ...(rede ? { 'x-forwarded-for': rede } : {}), ...cabecalhos } });
const cli = (...args) => spawnSync(process.execPath, [CLI, ...args], { env: { ...process.env, CRONOGRAMA_DATA: dados }, encoding: 'utf8', input: '' });

// a limpeza só depois do último await do topo
after(() => rmSync(raiz, { recursive: true, force: true }));

let token;

test('conta de PIN: nasce com o hash do PIN e o sha256 do link, sem senha; o link aparece só na resposta', async () => {
  await assert.rejects(convites.salvarContaPin({ usuario: 'diretorpin', nome: 'Diretor Pin', pin: '12a4' }), (e) => e.status === 400);
  await assert.rejects(convites.salvarContaPin({ usuario: 'diretorpin', nome: 'Diretor Pin', pin: '12345' }), (e) => e.status === 400);
  const r = await convites.salvarContaPin({ usuario: 'diretorpin', nome: 'Diretor Pin', papel: 'diretor', pin: '1225', ajusta: true });
  assert.equal(r.novo, true);
  assert.match(r.link, /\/entrar\?pin=[A-Za-z0-9_-]{43}$/);
  token = tokenDo(r.link);
  const u = conta('diretorpin');
  assert.equal(u.acesso, 'pin');
  assert.equal(u.papel, 'diretor');
  assert.equal(u.ajustaDepoisDeAprovada, true);
  assert.equal(u.hash, undefined, 'sem senha');
  assert.match(u.pinHash, /^scrypt\$/);
  assert.match(u.linkPinHash, /^[0-9a-f]{64}$/);
  assert.equal(u.linkPinHash, auth.sha256(token));
  const disco = readFileSync(path.join(dados, 'usuarios.json'), 'utf8');
  assert.ok(!disco.includes(token), 'o token não vai pro disco');
  assert.ok(!disco.includes('"1225"'), 'o PIN não vai pro disco');
  // a tela de Usuários e o estado não levam hash nenhum
  const p = auth.publico(u);
  assert.deepEqual([p.acesso, p.ajustaDepoisDeAprovada, p.linkPinAtivo, p.pinBloqueadoAte], ['pin', true, true, null]);
  assert.ok(!('pinHash' in p) && !('linkPinHash' in p) && !('hash' in p));
  assert.equal(auth.resumo(conta('gerente')).acesso, 'senha');
});

test('PIN certo entra com a mesma sessão de cookie do login', async () => {
  const r = await entrarPin(token, '1225');
  assert.equal(r.status, 200);
  assert.equal(r.j.ok, true);
  assert.equal(r.j.usuario.usuario, 'diretorpin');
  assert.equal(r.j.usuario.acesso, 'pin');
  assert.equal(r.j.usuario.ajustaDepoisDeAprovada, true);
  const cookies = [r.h['set-cookie']].flat().join('\n');
  assert.match(cookies, /__Host-cronograma=[A-Za-z0-9_-]{43}; HttpOnly; Secure; SameSite=Lax; Path=\//);
  assert.equal(auth.sessoesAtivas(conta('diretorpin').id), 1);
  // fora do formato: 400, sem contar erro
  assert.equal((await entrarPin(token, '12')).status, 400);
  assert.equal((await entrarPin(token, 'abcd')).status, 400);
  assert.equal(conta('diretorpin').pinFalhas, 0);
});

test('conta de PIN não entra por usuário e senha, não troca senha e não recebe link de redefinição', async () => {
  for (const senha of ['1225', SENHA, 'qualquer-coisa-1']) {
    const r = await pedir('/api/auth/entrar', { corpo: { usuario: 'diretorpin', senha } });
    assert.equal(r.status, 401, senha);
    assert.equal(r.j.erro, 'Usuário ou senha incorretos.');
  }
  // a conta de senha segue entrando
  assert.equal((await pedir('/api/auth/entrar', { corpo: { usuario: 'gerente', senha: SENHA } })).status, 200);
  const troca = await pedir('/api/auth/senha', { quem: 'diretorpin', corpo: { atual: '1225', nova: 'outra-senha-longa' } });
  assert.equal(troca.status, 409);
  const red = await pedir(`/api/usuarios/${conta('diretorpin').id}/redefinir`, { quem: 'gerente' });
  assert.equal(red.status, 409);
});

test('PIN errado conta; 5 travam o link por 15 min (nem o certo entra); PIN certo depois zera', async () => {
  for (let i = 1; i <= 4; i++) {
    const r = await entrarPin(token, '0000');
    assert.equal(r.status, 401, `erro ${i}`);
    assert.equal(r.j.restam, 5 - i);
    assert.equal(conta('diretorpin').pinFalhas, i);
  }
  const quinto = await entrarPin(token, '0000');
  assert.equal(quinto.status, 429);
  assert.equal(quinto.j.minutos, 15);
  assert.ok(Date.parse(conta('diretorpin').pinBloqueadoAte) > Date.now() + 14 * 60_000);
  assert.equal((await entrarPin(token, '1225')).status, 429, 'travado: nem o certo entra');
  assert.equal(conta('diretorpin').pinFalhas, 5, 'o pedido travado não conta');
  assert.ok(auth.publico(conta('diretorpin')).pinBloqueadoAte);
  // passaram os 15 min
  conta('diretorpin').pinBloqueadoAte = new Date(Date.now() - 1000).toISOString();
  const certo = await entrarPin(token, '1225');
  assert.equal(certo.status, 200);
  assert.equal(conta('diretorpin').pinFalhas, 0);
  assert.equal(conta('diretorpin').pinBloqueadoAte, null);
});

test('pedido em paralelo não fura a trava: 8 PINs errados juntos, só 5 contam', async () => {
  const rs = await Promise.all(Array.from({ length: 8 }, () => entrarPin(token, '9999')));
  const status = rs.map((r) => r.status);
  assert.ok(status.every((s) => s === 401 || s === 429), status.join(','));
  // os 3 que chegaram com o link já travado nem rodam o scrypt; os 5 que contaram respondem 401 ou, se o link travou
  // antes do scrypt deles acabar, 429
  assert.ok(status.filter((s) => s === 429).length >= 3, status.join(','));
  assert.equal(conta('diretorpin').pinFalhas, 5);
  conta('diretorpin').pinBloqueadoAte = null;
  assert.equal((await entrarPin(token, '1225')).status, 200);
});

test('20 PINs errados cancelam o link; só um link novo (tela de Usuários) volta a entrar', async () => {
  for (let i = 1; i <= 20; i++) {
    const r = await entrarPin(token, '4321');
    if (i === 20) {
      assert.equal(r.status, 400);
      assert.equal(r.j.linkInvalido, true);
    } else assert.equal(r.status, i % 5 === 0 ? 429 : 401, `erro ${i}`);
    if (i % 5 === 0) conta('diretorpin').pinBloqueadoAte = null; // passaram os 15 min
  }
  assert.equal(conta('diretorpin').linkPinHash, null);
  assert.equal(auth.publico(conta('diretorpin')).linkPinAtivo, false);
  const morto = await entrarPin(token, '1225');
  assert.equal(morto.status, 400);
  assert.equal(morto.j.erro, auth.LINK_PIN_INVALIDO);

  // link novo: só Admin e Gerente (a rota confere por dentro também); conta de senha não tem link de PIN
  const id = conta('diretorpin').id;
  assert.equal((await pedir(`/api/usuarios/${id}/link-pin`, { quem: 'operador' })).status, 403);
  assert.equal((await pedir(`/api/usuarios/${id}/link-pin`, { quem: 'diretorpin' })).status, 403);
  assert.equal((await pedir(`/api/usuarios/${conta('operador').id}/link-pin`, { quem: 'gerente' })).status, 409);
  assert.equal((await pedir(`/api/usuarios/${id}/link-pin`, { metodo: 'GET', quem: 'gerente' })).status, 405);
  const novo = await pedir(`/api/usuarios/${id}/link-pin`, { quem: 'gerente' });
  assert.equal(novo.status, 201);
  assert.match(novo.j.link, /\/entrar\?pin=[A-Za-z0-9_-]{43}$/);
  const outro = tokenDo(novo.j.link);
  assert.notEqual(outro, token);
  assert.equal(conta('diretorpin').pinFalhas, 0, 'link novo zera a contagem');
  assert.equal(auth.sessoesAtivas(id), 0, 'link novo derruba as sessões da conta');
  assert.equal((await entrarPin(token, '1225')).status, 400, 'o velho segue morto');
  assert.equal((await entrarPin(outro, '1225')).status, 200);
  // outro link de novo: o anterior morre na hora
  const terceiro = tokenDo((await convites.gerarLinkPin(id)).link);
  assert.equal((await entrarPin(outro, '1225')).status, 400);
  token = terceiro;
  assert.equal((await entrarPin(token, '1225')).status, 200);
});

test('terminal: pin cria e atualiza, link-pin troca o link, papel troca o perfil', async () => {
  const criar = cli('pin', 'outrodir', 'Outro', 'Diretor', '--papel', 'diretor', '--pin', '4321', '--ajusta-aprovada');
  assert.equal(criar.status, 0, criar.stderr);
  assert.match(criar.stdout, /Conta criada: Outro Diretor \(outrodir\), Diretor contábil/);
  assert.match(criar.stdout, /Ajusta peça ou envio já aprovado: sim/);
  const link1 = criar.stdout.match(/https?:\/\/\S+\/entrar\?pin=[A-Za-z0-9_-]{43}/)?.[0];
  assert.ok(link1, criar.stdout);
  assert.ok(!criar.stdout.includes('4321'), 'o PIN não aparece na saída');
  assert.equal((await entrarPin(tokenDo(link1), '4321')).status, 200);

  // atualizar sem dizer a permissão: fica como está; PIN novo, link novo, o velho morre
  const atualizar = cli('pin', 'outrodir', '--pin', '8765');
  assert.equal(atualizar.status, 0, atualizar.stderr);
  assert.match(atualizar.stdout, /Conta atualizada: Outro Diretor/);
  assert.match(atualizar.stdout, /Ajusta peça ou envio já aprovado: sim/);
  const link2 = atualizar.stdout.match(/\/entrar\?pin=([A-Za-z0-9_-]{43})/)?.[1];
  assert.equal((await entrarPin(tokenDo(link1), '8765')).status, 400);
  assert.equal((await entrarPin(link2, '4321')).status, 401, 'o PIN velho não vale');
  assert.equal((await entrarPin(link2, '8765')).status, 200);

  const tirar = cli('pin', 'outrodir', '--pin', '8765', '--sem-ajuste-aprovada');
  assert.match(tirar.stdout, /Ajusta peça ou envio já aprovado: não/);
  assert.equal(conta('outrodir').ajustaDepoisDeAprovada, false);

  const link = cli('link-pin', 'outrodir');
  assert.equal(link.status, 0, link.stderr);
  const link3 = link.stdout.match(/\/entrar\?pin=([A-Za-z0-9_-]{43})/)?.[1];
  assert.ok(link3);
  assert.equal((await entrarPin(link3, '8765')).status, 200, 'o PIN continua o mesmo');
  assert.equal(cli('link-pin', 'gerente').status, 1, 'conta de senha não tem link de PIN');
  // 21/10 (Pedro): com a permissão de volta, a troca de perfil abaixo deixa ela parada (só vale pro Diretor contábil)
  assert.match(cli('pin', 'outrodir', '--pin', '8765', '--ajusta-aprovada').stdout, /Ajusta peça ou envio já aprovado: sim/);

  const papel = cli('papel', 'outrodir', 'gerente');
  assert.equal(papel.status, 0, papel.stderr);
  assert.match(papel.stdout, /passou de Diretor contábil pra Gerente de Marketing/);
  assert.equal(conta('outrodir').papel, 'gerente');
  assert.equal(cli('papel', 'outrodir', 'chefe').status, 1);
  // sem quem gerencie usuários o app não tem volta: o último Admin ou Gerente não perde o perfil
  assert.equal(cli('papel', 'outrodir', 'operador').status, 0);
  const ultimo = cli('papel', 'gerente', 'operador');
  assert.equal(ultimo.status, 1);
  assert.match(ultimo.stderr, /única conta que gerencia usuários/);
  assert.equal(conta('gerente').papel, 'gerente');

  const lista = cli('listar');
  assert.match(lista.stdout, /outrodir .*Operador .*link \+ PIN/);
  // 21/10 (Pedro): a permissão de ajustar o que já foi aprovado só vale com o perfil Diretor contábil
  const outro = conta('outrodir');
  assert.equal(outro.ajustaDepoisDeAprovada, true, 'a permissão continua gravada');
  assert.equal(auth.resumo(outro).ajustaDepoisDeAprovada, false, 'Operador com a permissão gravada não ajusta');
  assert.match(lista.stdout, /outrodir .*permissão de ajustar peça aprovada parada/);
  assert.equal(auth.ajustaAprovada({ papel: 'gerente', ajustaDepoisDeAprovada: true }), false);
  assert.equal(auth.ajustaAprovada({ papel: 'diretor', ajustaDepoisDeAprovada: true }), true);
  assert.equal(auth.ajustaAprovada({ papel: 'diretor' }), false);
});

test('link desconhecido conta no balde da rede: 5 em 15 min = 429', async () => {
  const rede = '203.0.113.7';
  for (let i = 0; i < 5; i++) {
    const r = await entrarPin(i % 2 ? 'x'.repeat(43) : 'curto', '1225', rede);
    assert.equal(r.status, 400);
    assert.equal(r.j.linkInvalido, true);
  }
  assert.equal((await entrarPin('y'.repeat(43), '1225', rede)).status, 429);
  assert.equal((await entrarPin(token, '1225', rede)).status, 429, 'a rede travada não tenta nem o link bom');
  // 21/10 (Pedro, segurança): o cliente não escolhe o balde. O cf-connecting-ip que ele manda não vale atrás do Caddy,
  // e o que ele põe na frente do X-Forwarded-For também não (o último é o que o proxy escreveu)
  assert.equal((await entrarPin(token, '1225', rede, { 'cf-connecting-ip': '198.51.100.77' })).status, 429, 'cf-connecting-ip forjado não abre balde novo');
  assert.equal((await entrarPin(token, '1225', `198.51.100.77, ${rede}`)).status, 429, 'IP forjado na frente do X-Forwarded-For não abre balde novo');
  assert.equal((await entrarPin(token, '1225', '198.51.100.9', { 'cf-connecting-ip': rede })).status, 200, 'outra rede segue entrando (o cf-connecting-ip dela não trava)');
});

test('IP do cliente: cabeçalho de proxy só do proxy desta máquina; cf-connecting-ip só com CRONOGRAMA_PROXY=cloudflare', () => {
  const req = (remoto, headers = {}) => ({ socket: { remoteAddress: remoto }, headers });
  const antes = process.env.CRONOGRAMA_PROXY;
  try {
    delete process.env.CRONOGRAMA_PROXY;
    // padrão (Caddy): o último valor do X-Forwarded-For, só quando o pedido vem do loopback
    assert.equal(auth.ipDoCliente(req('127.0.0.1', { 'x-forwarded-for': '200.1.2.3' })), '200.1.2.3');
    assert.equal(auth.ipDoCliente(req('::ffff:127.0.0.1', { 'x-forwarded-for': '10.0.0.1, 200.1.2.3' })), '200.1.2.3');
    assert.equal(auth.ipDoCliente(req('::1', { 'x-forwarded-for': '2001:db8::1' })), '2001:db8::1');
    assert.equal(auth.ipDoCliente(req('127.0.0.1', { 'cf-connecting-ip': '200.1.2.3' })), '127.0.0.1', 'sem Cloudflare, o cf-connecting-ip não vale');
    assert.equal(auth.ipDoCliente(req('127.0.0.1', { 'x-forwarded-for': 'lixo' })), '127.0.0.1', 'valor que não é IP não vale');
    assert.equal(auth.ipDoCliente(req('198.51.100.5', { 'x-forwarded-for': '200.1.2.3', 'cf-connecting-ip': '200.1.2.4' })), '198.51.100.5', 'de fora do loopback, nenhum cabeçalho vale');
    assert.equal(auth.redeDoCliente(req('127.0.0.1', { 'x-forwarded-for': '2001:db8:1:2:3:4:5:6' })), '2001:db8:1:2::/64');
    // túnel da Cloudflare
    process.env.CRONOGRAMA_PROXY = 'cloudflare';
    assert.equal(auth.ipDoCliente(req('127.0.0.1', { 'cf-connecting-ip': '200.1.2.3', 'x-forwarded-for': '200.9.9.9' })), '200.1.2.3');
    assert.equal(auth.ipDoCliente(req('127.0.0.1', {})), '127.0.0.1');
    assert.equal(auth.ipDoCliente(req('198.51.100.5', { 'cf-connecting-ip': '200.1.2.3' })), '198.51.100.5');
  } finally {
    if (antes === undefined) delete process.env.CRONOGRAMA_PROXY;
    else process.env.CRONOGRAMA_PROXY = antes;
  }
});
