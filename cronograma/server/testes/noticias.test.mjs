// Testes das notícias do dia (noticias.mjs, 21/10): o parser de feed (RSS 2.0, RSS 1.0 da Receita, Atom, CDATA,
// entidades), a rede protegida (só https, só os hosts da lista, redirecionamento pra fora recusado, 1 MB), a janela de
// 48 h (72 h na segunda), a escolha sem IA e a conferência da escolha da IA, a rodada inteira com rede e IA falsas numa
// pasta de dados temporária, a pesquisa no Google (pesquisa-temas.mjs: autocompletar, manchetes e a conferência dos
// temas) e a agenda das notícias (todo dia a partir das 06:00). Nada sai pra rede. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-noticias-'));
const dados = path.join(raiz, 'data');
process.env.CRONOGRAMA_DATA = dados;
mkdirSync(dados, { recursive: true });
after(() => rmSync(raiz, { recursive: true, force: true }));

const n = await import('../noticias.mjs');
const p = await import('../pesquisa-temas.mjs');
const { tarefasConteudoDevidas, proximasConteudo, msAteAsSeis } = await import('../agenda.mjs');

const TRACO = String.fromCharCode(0x2014);
const brt = (dia, hora = 12, minuto = 0) => Date.parse(`${dia}T${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00-03:00`);
const iso = (ms) => new Date(ms).toISOString();

const RSS = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
<title>Portal</title><link>https://www.contabeis.com.br</link>
<item><title><![CDATA[Simples Nacional tem prazo até dia 30 ${TRACO} veja o que muda]]></title>
<link>https://www.contabeis.com.br/noticias/1/simples/</link>
<description><![CDATA[<p>Empresas do <b>Simples</b> t&ecirc;m prazo.</p><script>alert(1)</script><img src="x"> Mais &amp;nbsp;texto.]]></description>
<pubDate>Wed, 21 Oct 2026 16:30:01 -0300</pubDate></item>
<item><title>MEI &amp; nota fiscal: o que &#233; o emissor &#x2014; nacional</title><link>https://jornalcontabil.com.br/nota/</link>
<description>&lt;p&gt;Texto &lt;a href="x"&gt;com link&lt;/a&gt; e &amp;amp; escapado&lt;/p&gt;</description><pubDate>Tue, 20 Oct 2026 10:00:00 GMT</pubDate></item>
<item><title>Sem link</title><description>x</description></item>
<item><title>Link javascript</title><link>javascript:alert(1)</link></item>
</channel></rss>`;

const RDF = `<?xml version="1.0" encoding="utf-8" ?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns="http://purl.org/rss/1.0/">
<channel rdf:about="https://www.gov.br/receitafederal/x/RSS"><title>Notícias</title><items><rdf:Seq><rdf:li rdf:resource="https://www.gov.br/a" /></rdf:Seq></items></channel>
<item rdf:about="https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/outubro/arrecadacao">
<title>Receita Federal comenta nesta quinta-feira (22) a arrecadação</title>
<link>https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/outubro/arrecadacao</link>
<description>A entrevista será às 10h.</description>
<dc:date>2026-10-21T11:43:32Z</dc:date></item></rdf:RDF>`;

const ATOM = `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>CFC</title>
<entry><title type="html">Norma nova do CFC</title><link rel="self" href="https://cfc.org.br/self"/><link rel="alternate" type="text/html" href="https://cfc.org.br/noticias/norma?a=1&amp;b=2"/>
<summary>Resumo &lt;em&gt;curto&lt;/em&gt;.</summary><updated>2026-10-21T09:00:00-03:00</updated></entry>
<entry><title>Sem rel</title><link href="https://cfc.org.br/outra"/><published>2026-10-19T09:00:00Z</published></entry></feed>`;

test('notícias: parser de RSS 2.0 (CDATA, entidades, HTML e travessão fora)', () => {
  const itens = n.lerFeed(RSS);
  assert.equal(itens.length, 2, 'item sem link e com link javascript ficam de fora');
  assert.equal(itens[0].titulo, 'Simples Nacional tem prazo até dia 30, veja o que muda');
  assert.equal(itens[0].link, 'https://www.contabeis.com.br/noticias/1/simples/');
  assert.equal(itens[0].resumo, 'Empresas do Simples têm prazo. Mais texto.');
  assert.equal(itens[0].publicadoEm, '2026-10-21T19:30:01.000Z');
  assert.equal(itens[1].titulo, 'MEI & nota fiscal: o que é o emissor, nacional');
  assert.equal(itens[1].resumo, 'Texto com link e & escapado');
  assert.equal(itens[1].publicadoEm, '2026-10-20T10:00:00.000Z');
  for (const i of itens) for (const v of Object.values(i)) assert.ok(!String(v).includes(TRACO) && !String(v).includes('<'));
});

test('notícias: parser de RSS 1.0 (RDF da Receita) e Atom', () => {
  const rdf = n.lerFeed(RDF);
  assert.equal(rdf.length, 1, '<items> do canal não vira item');
  assert.equal(rdf[0].titulo, 'Receita Federal comenta nesta quinta-feira (22) a arrecadação');
  assert.equal(rdf[0].publicadoEm, '2026-10-21T11:43:32.000Z');
  const atom = n.lerFeed(ATOM);
  assert.equal(atom.length, 2);
  assert.equal(atom[0].link, 'https://cfc.org.br/noticias/norma?a=1&b=2', 'o link alternate, com a entidade desfeita');
  assert.equal(atom[0].resumo, 'Resumo curto.');
  assert.equal(atom[0].publicadoEm, '2026-10-21T12:00:00.000Z');
  assert.equal(atom[1].link, 'https://cfc.org.br/outra');
  assert.equal(n.decodificarEntidades('&#0; &#xD800; &#65; &foo; &ccedil;'), '  A &foo; ç');
});

// fetch falso: um mapa de URL -> resposta
function fetchFalso(rotas) {
  const chamadas = [];
  const f = async (url, opcoes) => {
    chamadas.push({ url, redirect: opcoes?.redirect });
    const r = rotas[url];
    if (!r) return new Response('não achou', { status: 404 });
    if (typeof r === 'function') return r(opcoes);
    if (r.para) return new Response(null, { status: 302, headers: { location: r.para } });
    return new Response(r.corpo, { status: r.status ?? 200, headers: { 'content-type': r.tipo ?? 'application/rss+xml; charset=utf-8', ...(r.cabecalhos ?? {}) } });
  };
  f.chamadas = chamadas;
  return f;
}

test('notícias: rede protegida (https, lista de hosts, redirecionamento, 1 MB, tempo)', async () => {
  const hosts = new Set(['cfc.org.br', 'www.cfc.org.br']);
  assert.throws(() => n.urlPermitida('http://cfc.org.br/feed/', hosts), /só https/);
  assert.throws(() => n.urlPermitida('https://evil.com/feed/', hosts), /não está na lista/);
  assert.throws(() => n.urlPermitida('https://user:x@cfc.org.br/', hosts), /usuário ou senha/);
  assert.throws(() => n.urlPermitida('https://cfc.org.br:8443/', hosts), /porta/);
  assert.throws(() => n.urlPermitida('https://169.254.169.254/', hosts), /não está na lista/);
  assert.equal(n.urlPermitida('https://CFC.org.br/feed/', hosts).hostname, 'cfc.org.br');

  // redirecionamento dentro da lista: segue (à mão); pra fora: recusado sem buscar o destino
  const f1 = fetchFalso({ 'https://www.cfc.org.br/feed/': { para: '/feed2/' }, 'https://www.cfc.org.br/feed2/': { para: 'https://cfc.org.br/feed/' }, 'https://cfc.org.br/feed/': { corpo: RSS } });
  const r1 = await n.buscarSeguro('https://www.cfc.org.br/feed/', { hosts, fetchImpl: f1 });
  assert.equal(r1.url, 'https://cfc.org.br/feed/');
  assert.ok(f1.chamadas.every((c) => c.redirect === 'manual'));
  const f2 = fetchFalso({ 'https://cfc.org.br/feed/': { para: 'http://127.0.0.1:4317/api/estado' } });
  await assert.rejects(n.buscarSeguro('https://cfc.org.br/feed/', { hosts, fetchImpl: f2 }), /só https/);
  const f3 = fetchFalso({ 'https://cfc.org.br/feed/': { para: 'https://metadata.google.internal/x' } });
  await assert.rejects(n.buscarSeguro('https://cfc.org.br/feed/', { hosts, fetchImpl: f3 }), /não está na lista/);
  assert.equal(f3.chamadas.length, 1, 'o destino de fora nem é buscado');
  // laço de redirecionamento
  const f4 = fetchFalso({ 'https://cfc.org.br/a': { para: 'https://cfc.org.br/b' }, 'https://cfc.org.br/b': { para: 'https://cfc.org.br/a' } });
  await assert.rejects(n.buscarSeguro('https://cfc.org.br/a', { hosts, fetchImpl: f4 }), /redirecionamentos demais/);
  // 1 MB (21/10: era 2 MB; o maior feed medido tem 108 KB): pelo cabeçalho e pelo corpo lido aos pedaços
  const f5 = fetchFalso({ 'https://cfc.org.br/grande': { corpo: 'x', cabecalhos: { 'content-length': String(3 * 1024 * 1024) } } });
  await assert.rejects(n.buscarSeguro('https://cfc.org.br/grande', { hosts, fetchImpl: f5 }), /passou de 1 MB/);
  const f6 = fetchFalso({ 'https://cfc.org.br/grande': () => new Response(new ReadableStream({ pull(c) { c.enqueue(new Uint8Array(512 * 1024)); } }), { status: 200 }) });
  await assert.rejects(n.buscarSeguro('https://cfc.org.br/grande', { hosts, fetchImpl: f6 }), /passou de 1 MB/);
  // tempo esgotado
  const lento = async (url, { signal }) => new Promise((_, nao) => signal.addEventListener('abort', () => nao(new Error('abortado'))));
  await assert.rejects(n.buscarSeguro('https://cfc.org.br/feed/', { hosts, fetchImpl: lento, timeoutMs: 50 }), /passou de 0 s|passou de/);
  // charset latin1 pelo prólogo
  const latin = Buffer.concat([Buffer.from('<?xml version="1.0" encoding="ISO-8859-1"?><rss><item><title>Contribui'), Buffer.from([0xe7, 0xe3]), Buffer.from('o</title><link>https://cfc.org.br/x</link></item></rss>')]);
  const f7 = fetchFalso({ 'https://cfc.org.br/latin': () => new Response(latin, { status: 200, headers: { 'content-type': 'application/xml' } }) });
  assert.equal(n.lerFeed((await n.buscarSeguro('https://cfc.org.br/latin', { hosts, fetchImpl: f7 })).texto)[0].titulo, 'Contribuição');
  // a lista das fontes: só https e todas na lista de hosts
  for (const fonte of n.FONTES) assert.doesNotThrow(() => n.urlPermitida(fonte.url, n.HOSTS_NOTICIAS), fonte.nome);
});

const FONTE = (id, prioridade, nome = id) => ({ id, nome, prioridade, oficial: prioridade === 1 });
const item = (titulo, horasAtras, agora, resumo = '') => ({ titulo, link: `https://x.com/${encodeURIComponent(titulo)}`, resumo, publicadoEm: iso(agora - horasAtras * 3_600_000) });

test('notícias: janela de 48 h (72 h na segunda), relevância e a escolha sem IA', () => {
  const quarta = brt('2026-10-21', 6, 0);
  const segunda = brt('2026-10-26', 6, 0);
  assert.equal(n.janelaHoras(quarta), 48);
  assert.equal(n.janelaHoras(segunda), 72);
  const fontes = (agora) => [
    { fonte: FONTE('receita', 1, 'Receita Federal'), itens: [item('MEI tem prazo novo da declaração', 50, agora), item('Receita Federal libera lote de restituição do imposto', 10, agora)] },
    { fonte: FONTE('portal', 3, 'Portal'), itens: [item('Simples Nacional: prazo até dia 30 para optar', 1, agora), item('Simples Nacional: prazo até dia 30 para optar pelo híbrido', 2, agora), item('Nota fiscal de serviço muda em dezembro', 3, agora), item('Mais uma do MEI', 4, agora)] },
    { fonte: FONTE('geral', 2, 'Agência'), itens: [item('Dólar fecha em alta', 1, agora), item('Futuro sem data', -5, agora)] },
  ];
  const c = n.candidatas(fontes(quarta), quarta);
  assert.ok(!c.some((x) => x.titulo === 'MEI tem prazo novo da declaração'), '50 h numa quarta: fora');
  assert.ok(!c.some((x) => x.titulo === 'Futuro sem data'), 'data no futuro: fora');
  assert.ok(n.candidatas(fontes(segunda), segunda).some((x) => x.titulo === 'MEI tem prazo novo da declaração'), '50 h numa segunda: dentro');
  assert.equal(c.at(-1).titulo, 'Dólar fecha em alta', 'sem relevância pro público vai pro fim');
  assert.equal(c[0].fonte, 'Receita Federal', 'a oficial relevante primeiro');
  const escolhidas = n.escolherSemIa(c);
  assert.equal(escolhidas.length, 4);
  assert.equal(escolhidas.filter((x) => x.fonte === 'Portal').length, 2, 'até 2 por fonte');
  assert.equal(escolhidas.filter((x) => x.titulo.startsWith('Simples Nacional: prazo até dia 30')).length, 1, 'mesmo assunto uma vez só');
  for (const e of escolhidas) {
    assert.match(e.id, /^not_[0-9a-f]{10}$/);
    assert.deepEqual([e.comoVirarConteudo, e.bloco, e.pilar], ['', null, null]);
  }
});

test('notícias: a escolha da IA é conferida contra a lista que foi', () => {
  const agora = brt('2026-10-21', 7);
  const lista = n.candidatas([{ fonte: FONTE('receita', 1, 'Receita Federal'), itens: [item('MEI: prazo da declaração', 1, agora, 'Resumo do site.'), item('Simples: opção até 30', 2, agora)] }], agora);
  const out = n.conferirEscolhaIa({
    itens: [
      { ref: 'n9', resumo: 'inventada', comoVirarConteudo: 'x', bloco: 'Educação', pilar: 4 },
      { ref: 'n1', resumo: `Resumo ${TRACO} da IA. **Negrito**.`, comoVirarConteudo: 'Vira carrossel do pilar 16 na Legalizai.', bloco: 'Afeto', pilar: 16, link: 'https://evil.com' },
      { ref: 'n1', resumo: 'repetida', comoVirarConteudo: 'x', bloco: 'Educação', pilar: 4 },
      { ref: 'n2', resumo: '', comoVirarConteudo: 'y', bloco: 'Educação', pilar: 7 },
    ],
  }, lista);
  assert.equal(out.length, 2);
  assert.equal(out[0].link, lista[0].link, 'o link sai da lista, nunca da IA');
  assert.equal(out[0].titulo, lista[0].titulo);
  assert.equal(out[0].resumo, 'Resumo, da IA. Negrito.');
  assert.equal(out[0].comoVirarConteudo, 'Vira carrossel do pilar 16 na Legalizaí.');
  assert.deepEqual([out[0].pilar, out[0].bloco], [16, 'Educação'], 'o bloco sai do pilar');
  assert.deepEqual([out[1].pilar, out[1].bloco], [null, null], 'pilar guardado cai');
  assert.equal(out[1].resumo, '', 'sem resumo da IA nem do site');
});

test('notícias: a rodada com rede e IA falsas grava data/noticias.json', async () => {
  const agora = brt('2026-10-21', 6, 0);
  const rss = (titulos) => `<rss><channel>${titulos.map((t, i) => `<item><title>${t}</title><link>https://cfc.org.br/n/${encodeURIComponent(t)}</link><description>Sobre ${t}.</description><pubDate>${new Date(agora - (i + 1) * 3_600_000).toUTCString()}</pubDate></item>`).join('')}</channel></rss>`;
  const fontes = [
    { id: 'cfc', nome: 'CFC', url: 'https://cfc.org.br/feed/', prioridade: 1, oficial: true },
    { id: 'crc', nome: 'CRC-MG', url: 'https://crcmg.org.br/feed/', prioridade: 1, oficial: true },
  ];
  const f = fetchFalso({ 'https://cfc.org.br/feed/': { corpo: rss(['MEI tem regra nova', 'Simples Nacional muda prazo', 'Nota fiscal de serviço']) }, 'https://crcmg.org.br/feed/': { status: 500 } });
  let prompt = '';
  const ia = async (a) => {
    prompt = a.prompt;
    return { dados: { itens: [{ ref: 'n2', resumo: 'O prazo mudou.', comoVirarConteudo: 'Stories do pilar 16 com o app no fim.', bloco: 'Educação', pilar: 16 }] } };
  };
  const r = await n.atualizar({ agoraMs: agora, fetchImpl: f, ia, fontes });
  assert.equal(r.ia, true);
  // 21/10: a IA escolheu 1 e o resto sai da escolha sem IA (aqui, até 2 por fonte: a fonte só tem o CFC)
  assert.equal(r.itens.length, 2);
  assert.equal(r.itens[0].titulo, 'Simples Nacional muda prazo');
  assert.equal(r.itens[1].comoVirarConteudo, '', 'o que completou não tem ideia de conteúdo');
  assert.match(prompt, /Escolha 3 notícias/, 'pede exatamente 5, ou todas quando vêm menos');
  assert.match(prompt, /<noticias>/);
  assert.deepEqual(r.fontes, [{ nome: 'CFC', ok: true }, { nome: 'CRC-MG', ok: false, erro: 'respondeu 500' }]);
  const gravado = JSON.parse(readFileSync(path.join(dados, 'noticias.json'), 'utf8'));
  assert.equal(gravado.dia, '2026-10-21');
  assert.equal(gravado.itens[0].comoVirarConteudo, 'Stories do pilar 16 com o app no fim.');
  const lido = await n.ler();
  assert.deepEqual(Object.keys(lido).filter((k) => ['dia', 'geradoEm', 'itens', 'erro', 'ia'].includes(k)).length, 5);
  assert.equal(lido.rodando, false);

  // sem a chave do Claude: as mais recentes (até 2 por fonte), sem IA, com o erro claro, e não lança
  const semChave = async () => { throw Object.assign(new Error(n.MSG_SEM_IA), { status: 503 }); };
  const r2 = await n.atualizar({ agoraMs: agora, fetchImpl: f, ia: semChave, fontes });
  assert.equal(r2.ia, false);
  assert.equal(r2.itens.length, 2);
  assert.ok(r2.erro.startsWith('Falta ligar a IA neste servidor: a chave do Claude.'));
  // IA que falha de outro jeito: grava sem IA e lança (a agenda tenta de novo em 1 h)
  const quebrada = async () => { throw Object.assign(new Error('caiu'), { status: 502 }); };
  await assert.rejects(n.atualizar({ agoraMs: agora, fetchImpl: f, ia: quebrada, fontes }), /não fez o resumo/);
  assert.equal(JSON.parse(readFileSync(path.join(dados, 'noticias.json'), 'utf8')).itens.length, 2);
  // nenhuma fonte responde: lança e o que já estava gravado fica
  const fora = fetchFalso({});
  await assert.rejects(n.atualizar({ agoraMs: agora, fetchImpl: fora, ia, fontes }), /Nenhuma fonte respondeu/);
  const depois = JSON.parse(readFileSync(path.join(dados, 'noticias.json'), 'utf8'));
  assert.equal(depois.itens.length, 2);
  assert.match(depois.erro, /Nenhuma fonte respondeu/);
});

test('pesquisa no Google: autocompletar, manchetes e a conferência dos temas', async () => {
  assert.deepEqual(p.lerSugestoes('["abrir mei",["abrir mei","abrir mei gov","trocar de contador contabilizei","abrir mei gratuito"],[],{}]', 'abrir mei'), ['abrir mei gov', 'abrir mei gratuito']);
  assert.deepEqual(p.lerSugestoes('<html>', 'x'), []);
  assert.deepEqual(p.lerSugestoes('{"a":1}', 'x'), []);
  assert.deepEqual(p.separarFonte('Perdão de dívidas de MEI: entenda - Agência Brasil'), { titulo: 'Perdão de dívidas de MEI: entenda', fonte: 'Agência Brasil' });
  assert.match(p.urlSugestao('pró-labore'), /^https:\/\/suggestqueries\.google\.com\/complete\/search\?client=firefox&hl=pt-BR&gl=br&ie=utf-8&oe=utf-8&q=pr%C3%B3-labore$/);
  assert.match(p.urlManchetes('MEI'), /^https:\/\/news\.google\.com\/rss\/search\?q=MEI%20when%3A7d&hl=pt-BR&gl=BR&ceid=BR:pt-419$/);
  // a coleta com rede falsa: só os hosts do Google
  const agora = brt('2026-10-21', 6);
  const rotas = {};
  for (const s of p.SEMENTES) rotas[p.urlSugestao(s)] = { corpo: JSON.stringify([s, [`${s} hoje`, `${s} 2026`]]), tipo: 'text/javascript' };
  for (const q of p.BUSCAS_NOTICIAS) rotas[p.urlManchetes(q)] = { corpo: `<rss><channel><item><title>${q} muda - Agência Brasil</title><link>https://news.google.com/rss/articles/${encodeURIComponent(q)}</link><pubDate>${new Date(agora - 3_600_000).toUTCString()}</pubDate></item><item><title>velha - X</title><link>https://news.google.com/rss/articles/velha</link><pubDate>${new Date(agora - 9 * 86_400_000).toUTCString()}</pubDate></item></channel></rss>` };
  rotas[p.urlSugestao('cnpj')] = { para: 'https://consent.google.com/x' };
  const c = await p.coletar({ agoraMs: agora, fetchImpl: fetchFalso(rotas) });
  assert.equal(c.buscas.length, 12);
  assert.ok(c.buscas.find((b) => b.semente === 'cnpj').erro.includes('não está na lista'), 'redirecionamento pra fora do Google recusado');
  assert.equal(c.manchetes.length, p.BUSCAS_NOTICIAS.length, 'a de 9 dias fica de fora');
  assert.equal(c.manchetes[0].fonte, 'Agência Brasil');
  // a IA só vale com evidência que confere
  const temas = await p.conferirTemas({
    temas: [
      { tema: 'Abrir MEI hoje', porque: 'busca', evidencias: [{ tipo: 'google-busca', texto: 'abrir mei hoje', ref: '' }, { tipo: 'google-busca', texto: 'inventada', ref: '' }], bloco: 'Afeto', pilar: 4, peca: 'reel', comoUsar: 'Reel do pilar 4.' },
      { tema: 'Manchete', porque: 'notícia', evidencias: [{ tipo: 'google-noticias', texto: 'qualquer', ref: 'm1' }], bloco: 'Educação', pilar: 16, peca: 'carrossel', comoUsar: 'Carrossel.' },
      { tema: 'Sem evidência', porque: 'x', evidencias: [{ tipo: 'google-noticias', texto: 'x', ref: 'm99' }], bloco: 'Educação', pilar: 5, peca: 'carrossel', comoUsar: 'x' },
      { tema: 'Com o Mauro', porque: 'x', evidencias: [{ tipo: 'google-busca', texto: 'abrir mei 2026', ref: '' }], bloco: 'Afeto', pilar: 3, peca: 'reel', comoUsar: 'Conta a história do Mauro.' },
      { tema: 'Guardado', porque: 'x', evidencias: [{ tipo: 'google-busca', texto: 'cnpj hoje', ref: '' }], bloco: 'Educação', pilar: 7, peca: 'reel', comoUsar: 'x' },
    ],
  }, c);
  assert.equal(temas.length, 2);
  assert.deepEqual(temas[0].evidencias, [{ tipo: 'google-busca', texto: 'abrir mei hoje' }]);
  assert.equal(temas[0].bloco, 'Educação', 'o bloco sai do pilar');
  assert.equal(temas[1].evidencias[0].link, c.manchetes[0].link, 'o link sai da coleta');
  assert.match(temas[0].id, /^tem_/);
  // sem IA: grava a coleta com o erro e não lança
  const semIa = await p.pesquisar('2026-11-11', { agoraMs: agora, fetchImpl: fetchFalso(rotas), ia: async () => { throw Object.assign(new Error('x'), { status: 503 }); } });
  assert.equal(semIa.semana, '2026-11-09');
  assert.deepEqual(semIa.temas, []);
  assert.ok(semIa.erro.startsWith('Falta ligar a IA neste servidor: a chave do Claude.'));
  // 21/10: o GET devolve as buscas e as manchetes com os nomes da tela (a do "cnpj" não trouxe sugestão e fica de fora)
  const lido = await p.ler('2026-11-13');
  assert.equal(lido.buscas.length, 11);
  assert.deepEqual(lido.buscas[0], { busca: 'abrir mei', sugestoes: ['abrir mei hoje', 'abrir mei 2026'] });
  assert.equal(lido.manchetes.length, p.BUSCAS_NOTICIAS.length);
  assert.deepEqual(Object.keys(lido.manchetes[0]).sort(), ['data', 'fonte', 'link', 'publicadoEm', 'titulo']);
  assert.equal(lido.manchetes[0].data, '2026-10-21');
  assert.equal(lido.manchetes[0].fonte, 'Agência Brasil');
  assert.equal(lido.rodando, false);
  const vazia = await p.ler('2026-11-16');
  assert.deepEqual([vazia.temas, vazia.buscas, vazia.manchetes], [[], [], []]);
});

test('pesquisa no Google: cada semana na sua rodada (21/10)', async () => {
  const agora = brt('2026-10-21', 6);
  let soltar;
  const segura = new Promise((ok) => { soltar = ok; });
  const rotas = {};
  for (const s of p.SEMENTES) rotas[p.urlSugestao(s)] = { corpo: JSON.stringify([s, [`${s} agora`]]), tipo: 'text/javascript' };
  const lenta = fetchFalso(rotas);
  const esperando = async (url, o) => { await segura; return lenta(url, o); };
  const semIa = async () => { throw Object.assign(new Error('x'), { status: 503 }); };
  const x = p.pesquisar('2026-11-23', { agoraMs: agora, fetchImpl: esperando, ia: semIa });
  const x2 = p.pesquisar('2026-11-25', { agoraMs: agora, fetchImpl: esperando, ia: semIa });
  assert.equal(x2, x, 'a mesma semana recebe a mesma rodada');
  assert.equal(p.rodando('2026-11-24'), true);
  assert.equal(p.rodando('2026-11-30'), false);
  // outra semana roda a sua (antes, recebia a rodada de 23/11)
  const y = p.pesquisar('2026-11-30', { agoraMs: agora, fetchImpl: fetchFalso(rotas), ia: semIa });
  assert.notEqual(y, x);
  assert.equal((await y).semana, '2026-11-30');
  soltar();
  assert.equal((await x).semana, '2026-11-23');
  assert.equal(p.rodando(), false);
  await assert.rejects(p.pesquisar('ontem'), (e) => e.status === 400);
});

test('rota: GET /api/semana/sugestoes devolve as buscas e as manchetes gravadas, sem IA (21/10)', async () => {
  const { rota } = await import('../rotas-conteudo.mjs');
  let saida = null;
  const json = (res, status, corpo) => { saida = { status, corpo }; };
  await rota({ method: 'GET' }, {}, ['semana', 'sugestoes'], { usuario: { nome: 'Teste', papel: 'operador' } }, { json, url: new URL('http://x/api/semana/sugestoes?semana=2026-11-12') });
  assert.equal(saida.status, 200);
  assert.equal(saida.corpo.semana, '2026-11-09');
  assert.deepEqual(saida.corpo.temas, []);
  assert.ok(saida.corpo.erro.startsWith(n.MSG_SEM_IA));
  assert.equal(saida.corpo.buscas.length, 11);
  assert.ok(saida.corpo.buscas.every((b) => typeof b.busca === 'string' && b.sugestoes.length));
  assert.ok(saida.corpo.manchetes.length && saida.corpo.manchetes.every((m) => m.titulo && m.link.startsWith('https://') && typeof m.fonte === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.data)));
});

test('notícias: o parser anda só pra frente (feed hostil não trava o servidor)', () => {
  // 21/10: '<item>' repetido sem fechar levava 198 ms em 100 KB e uns 80 s em 2 MB; o mesmo com '<script' solto
  const medir = (fn) => { const t = performance.now(); fn(); return performance.now() - t; };
  const itensAbertos = `<rss><channel>${'<item>'.repeat(170_000)}</channel></rss>`;
  assert.ok(medir(() => assert.deepEqual(n.lerFeed(itensAbertos), [])) < 1500, 'item sem fechar, 1 MB');
  const scripts = `<rss><channel>${Array.from({ length: 20 }, (_, i) => `<item><title>Nota ${i}</title><link>https://cfc.org.br/${i}</link><description>${'<script'.repeat(20_000)}</description></item>`).join('')}</channel></rss>`;
  assert.ok(medir(() => assert.equal(n.lerFeed(scripts).length, 20)) < 1500, 'script sem fechar');
  const tags = `<rss><channel><item><title>x</title><link>https://cfc.org.br/x</link><description><![CDATA[${'<p '.repeat(300_000)}]]></description></item></channel></rss>`;
  assert.ok(medir(() => n.lerFeed(tags)) < 1500, 'tag aberta repetida, sem nenhum >');
  assert.ok(medir(() => assert.equal(n.textoDe(`${'< '.repeat(100_000)}>`, 10), '< < < <...')) < 1500, 'muitos < antes do mesmo >');
  const titulos = `<rss><channel><item>${'<title <link href="'.repeat(60_000)}</item></channel></rss>`;
  assert.ok(medir(() => n.lerFeed(titulos)) < 1500, 'título e link sem fechar dentro do item');
  // o texto continua o mesmo de antes: script some, tag de bloco separa, "a < b" fica, comentário some
  assert.equal(n.textoDe('<p>Um</p><p>dois</p> <b>tr</b>ês <script>alert(1)</script>a &lt; b <!-- nada -->fim'), 'Um dois três a < b fim');
  assert.equal(n.textoDe('antes <script>var x = 1; depois sem fechar'), 'antes');
  assert.equal(n.textoDe('<![CDATA[<em>dentro</em>]]> e <![CDATA[aberto'), 'dentro e aberto');
  // até 200 itens por feed
  const muitos = `<rss><channel>${Array.from({ length: 250 }, (_, i) => `<item><title>T${i}</title><link>https://cfc.org.br/${i}</link></item>`).join('')}</channel></rss>`;
  assert.equal(n.lerFeed(muitos).length, 200);
  // um <item> sem fechar no começo não esconde as <entry> do Atom que vêm depois
  assert.equal(n.lerFeed(`<item>solto ${ATOM}`).length, 2);
});

test('notícias: sem IA, o mesmo assunto sai pelo título e pelo resumo (a lei do MEI de 21/10)', () => {
  const agora = brt('2026-10-21', 18);
  const it = (titulo, resumo, horas = 1) => ({ ...item(titulo, horas, agora, resumo) });
  const fontes = [
    { fonte: FONTE('agencia', 2, 'Agência Brasil'), itens: [
      it('Perdão de dívidas e novo teto do MEI: entenda o que muda', 'Sancionada nesta quarta-feira, a lei complementar dá perdão de dívidas aos microempreendedores individuais (MEI) com a União e amplia o limite de faturamento anual da categoria.'),
      it('Sancionada lei que perdoa dívida e aumenta limite de MEI', 'Foi sancionada nesta quarta-feira a lei complementar que prevê o perdão de dívidas do MEI com a União e amplia o limite anual de faturamento.', 2),
    ] },
    { fonte: FONTE('sebrae', 2, 'Agência Sebrae'), itens: [
      it('Mais funcionários, maior faturamento e dívida zero: programa incentiva o MEI', 'O governo sancionou nesta quarta-feira a lei complementar do programa: amplia o limite de faturamento do MEI, perdoa dívidas e permite mais funcionários.', 3),
      it('Microempreendedores individuais atingem R$ 100 milhões em contratos com órgãos públicos', 'A plataforma de compras do governo passou de R$ 100 milhões em contratos com MEI.', 4),
    ] },
    { fonte: FONTE('cfc', 1, 'CFC'), itens: [
      it('Primeira reunião da Comissão CFC Voluntário com nova composição define atuação do grupo', 'A comissão vai atuar em educação financeira, empreendedorismo, cidadania fiscal e destinação do Imposto de Renda.', 1),
    ] },
    { fonte: FONTE('portal', 3, 'Portal'), itens: [
      it('Como consultar o regime de IBS e CBS de fornecedores', 'A consulta pelo CNPJ mostra o regime de IBS e CBS de fornecedores do Simples Nacional.', 2),
      it('Simples Nacional tem prazo até dia 30 para optar pelo Simples Híbrido', 'Empresas podem escolher o recolhimento separado de IBS e CBS.', 3),
    ] },
  ];
  const c = n.candidatas(fontes, agora);
  assert.ok(c.findIndex((x) => x.fonte === 'CFC') > c.findIndex((x) => x.titulo.startsWith('Como consultar')), 'a reunião interna vai pro fim: o resumo conta a metade');
  const lei = c.filter((x) => /MEI/.test(x.titulo) && !/contratos/.test(x.titulo));
  for (let i = 0; i < lei.length; i++) for (let j = i + 1; j < lei.length; j++) assert.ok(n.mesmoAssunto(lei[i], lei[j]), `${lei[i].titulo} x ${lei[j].titulo}`);
  assert.ok(!n.mesmoAssunto(c.find((x) => x.titulo.startsWith('Como consultar')), c.find((x) => x.titulo.startsWith('Simples Nacional'))), 'IBS e CBS de fornecedor não é o prazo do Simples Híbrido');
  const escolhidas = n.escolherSemIa(c);
  assert.equal(escolhidas.filter((x) => /perd|dívida/i.test(x.titulo)).length, 1, 'a lei do MEI entra uma vez só');
  assert.deepEqual(escolhidas.map((x) => x.fonte).filter((f) => f === 'CFC'), ['CFC'], 'a reunião só entra porque sobrou vaga');
  assert.equal(escolhidas.at(-1).fonte, 'CFC');
  // com a IA que escolheu 1, o resto completa sem repetir o assunto nem o link
  const daIa = n.conferirEscolhaIa({ itens: [{ ref: 'n2', resumo: 'A lei perdoa dívidas do MEI e sobe o limite de faturamento.', comoVirarConteudo: 'Carrossel.', bloco: 'Educação', pilar: 16 }] }, c);
  const completo = [...daIa, ...n.escolherSemIa(c, 4, daIa)];
  assert.equal(completo.length, 5);
  assert.equal(new Set(completo.map((x) => x.link)).size, 5);
  assert.equal(completo.filter((x) => /perd|dívida/i.test(x.titulo)).length, 1);
});

test('agenda: notícias todo dia a partir das 06:00, uma vez por dia; falhou, de novo em 1 h', () => {
  const devida = (conteudo, ms) => tarefasConteudoDevidas(conteudo, ms).includes('noticias');
  assert.equal(devida({}, brt('2026-10-21', 5, 59)), false);
  assert.equal(devida({}, brt('2026-10-21', 6, 0)), true);
  assert.equal(devida({}, brt('2026-10-24', 6, 0)), true, 'sábado também');
  assert.equal(devida({ noticias: { em: iso(brt('2026-10-21', 6, 1)), ok: true } }, brt('2026-10-21', 23, 0)), false, 'uma vez por dia');
  assert.equal(devida({ noticias: { em: iso(brt('2026-10-21', 6, 1)), ok: true } }, brt('2026-10-22', 5, 59)), false);
  assert.equal(devida({ noticias: { em: iso(brt('2026-10-21', 6, 1)), ok: true } }, brt('2026-10-22', 6, 0)), true, 'no dia seguinte, às 06:00');
  assert.equal(devida({ noticias: { em: iso(brt('2026-10-21', 5, 30)), ok: true } }, brt('2026-10-21', 6, 0)), true, 'rodada antes das 06:00 não conta como a do dia');
  assert.equal(devida({ noticias: { em: iso(brt('2026-10-21', 6, 1)), ok: false, erro: 'x' } }, brt('2026-10-21', 7, 0)), false);
  assert.equal(devida({ noticias: { em: iso(brt('2026-10-21', 6, 1)), ok: false, erro: 'x' } }, brt('2026-10-21', 7, 1)), true);
  const prox = proximasConteudo({ noticias: { em: iso(brt('2026-10-21', 6, 1)), ok: true } }, brt('2026-10-21', 15));
  assert.equal(prox.noticias, iso(brt('2026-10-22', 6)));
  assert.equal(proximasConteudo({}, brt('2026-10-21', 4)).noticias, iso(brt('2026-10-21', 6)));
  assert.equal(proximasConteudo({ noticias: { em: iso(brt('2026-10-21', 6, 1)), ok: false } }, brt('2026-10-21', 6, 30)).noticias, iso(brt('2026-10-21', 7, 1)));
  // o relógio acorda às 06:00 em ponto (mais 5 s)
  assert.equal(msAteAsSeis(brt('2026-10-21', 5, 0)), 3_600_000 + 5_000);
  assert.equal(msAteAsSeis(brt('2026-10-21', 6, 1)), 24 * 3_600_000 - 60_000 + 5_000);
});
