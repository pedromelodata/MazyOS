// Os 4 posts de 22 a 25/10/2026 no cronograma (Pedro, 21/10: os dias 22 a 25 estavam vazios; as 4 ideias foram
// aprovadas no chat). Os posts estão em server/conteudo-semana-2210.mjs. Rode com o servidor PARADO:
//   node server/aplicar-semana-2210.mjs [--simular]
// --simular confere tudo e mostra o que mudaria, sem gravar. CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia).
// Rodar de novo não duplica: a peça é achada pela marca calendario "semana-2210:<data>".
//  0. confere tudo antes de gravar (um problema e nada é gravado): data válida, peça e tipo que existem, pilar que
//     existe e bloco que bate com ele, cada fato citado existe no _base-contabil/FATOS.md e está como USAR, e o texto
//     passa na conferência do Ateliê (atelie.mjs) sem bloqueante. Alerta e "revisar" saem no resumo
//  1. peça da semana: criada, ou atualizada se veio de uma rodada anterior. A que alguém mexeu na tela depois
//     (atualizadoPor diferente deste script) não muda. Motivo e pilarTexto como os da semana de 26/10 (21/10)
//  2. peça de feed que ocupava o dia (não postada) sai do calendário: fica sem data, com a nota de por que saiu, e
//     aparece no Início em "peças sem data". A peça com vídeo final pronto fica no dia (o Pedro decide). O post que
//     alguém já criou na tela (mesmo dia e mesmo título) fica como está: o script não cria outro nem tira nada do dia
//  3. stories (22/10): um por dia, ligado ao post do dia (pecaDoDia). Dia sem stories ganha o do script; o que já
//     existe só muda se foi este script que criou e ninguém mexeu (status ideia). A tela não cria stories, só edita
//  4. backup do db.json de antes: db.antes-semana-2210.json na primeira vez (nunca regravado) e
//     db.antes-semana-2210.ultimo.json a cada rodada
// 22/10 (achado): peça ou stories que já foi pra aprovação técnica (aprovacao.estado pendente, aprovado, ajuste ou
// alterado) conta como mexido e não muda: regravar por cima trocaria o texto que os gerentes e o Diretor aprovaram sem
// virar "alterado". O que mudar nele, mude na tela (o PUT confere a aprovação). Aprovação solta (estado nulo) não trava
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { DB_PATH, arquivoDados, carregar, salvar, agora, novoId, dataValida, blocoDoPilar, TIPOS_REEL } from './db.mjs';
import { conferirReel, roteiroLimpo, pecaVazia, conferirStoriesDia, chaveTitulo } from './validar.mjs';
import { conferir } from './atelie.mjs';
import { RAIZ } from './importar.mjs';
import { SEMANA, STORIES } from './conteudo-semana-2210.mjs';

const SIMULAR = process.argv.includes('--simular');
const PORTA = Number(process.env.PORT) || 4317;
const AUTOR = 'Semana de 22 a 25/10 (aplicar-semana-2210)';
const CRIADO_POR = 'Posts de 22 a 25/10 (aprovados em 21/10)';
const CAMPANHA = 'cmp_prelancamento';
const PECAS_FEED = ['reel', 'carrossel', 'estatico'];
const ORIGEM = 'Posts de 22 a 25/10, aprovados pelo Pedro em 21/10 (server/conteudo-semana-2210.mjs). Estratégia: marketing/estrategia/ESTRATEGIA-PRINCIPAL.md.';
const LIM_NOTAS = 2000;

const tem = (v) => Boolean(String(v ?? '').trim());
// 22/10 (achado): o estado da aprovação técnica do item, ou null quando ele não foi pra aprovação (ou ela foi solta)
const emAprovacao = (x) => (tem(x?.aprovacao?.estado) ? String(x.aprovacao.estado) : null);
const marca = (p) => `semana-2210:${p.data}`;
const fmt = (d) => String(d).split('-').reverse().slice(0, 2).join('/');
const curto = (s, n) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));
const erros = [];
const avisos = [];
const sair = (msg) => { console.error(`Nada foi gravado. ${msg}`); process.exit(1); };

function portaOcupada() {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: PORTA });
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('error', () => ok(false));
    s.setTimeout(1500, () => { s.destroy(); ok(false); });
  });
}
if (!SIMULAR && !process.env.CRONOGRAMA_DATA && (await portaOcupada())) {
  console.error(`O servidor está no ar na porta ${PORTA}. Pare ele antes (systemctl stop gestao-marketing) e rode de novo.`);
  process.exit(1);
}

// FATOS.md: id → título, status e fonte (a fonte vira o texto da lista de fontes da peça)
async function lerFatos() {
  const s = await readFile(path.join(RAIZ, '_base-contabil', 'FATOS.md'), 'utf8');
  const mapa = new Map();
  for (const b of s.split(/\n(?=\*\*F\d{3} · )/)) {
    const m = /^\*\*(F\d{3}) · (.+?)\*\* · ([^\n]+)\n([\s\S]*)/.exec(b);
    if (!m) continue;
    const corpo = m[4].split(/\n## /)[0];
    mapa.set(m[1], { titulo: m[2].trim(), status: m[3].trim(), fonte: ((/- Fonte: (.*)/.exec(corpo) ?? [])[1] ?? '').replace(/`/g, '').trim() });
  }
  return mapa;
}

// fontesExternas (22/10): fonte oficial de fato que ainda não entrou no FATOS (a LC 238/2026), vai sem id e sem conferência
const fontesDe = (p, fatos) => [
  ...(p.fontes ?? []).map((id) => { const f = fatos.get(id); return f ? `${id} · ${f.titulo} (${f.fonte})` : id; }),
  ...(p.fontesExternas ?? []).map((t) => `Fora do FATOS: ${t}`),
];

// os campos do stories do dia (antes do conferirStoriesDia), ligado ao post do mesmo dia
const camposStories = (s, fatos, pecaDoDia) => ({
  data: s.data, objetivo: s.objetivo, pilar: s.pilar, bloco: s.bloco, tema: s.tema, pecaDoDia, quadros: s.quadros,
  cta: s.cta, fontes: fontesDe(s, fatos), notas: `${ORIGEM} ${s.notas ?? ''}`.trim(), pilarTexto: s.pilarTexto, motivo: s.motivo,
});

// o post do dia que alguém já criou na tela: mesmo dia e mesmo título, sem a marca deste script
const criadoNaTela = (db, p) => db.reels.find((r) => r.data === p.data && (r.peca ?? 'reel') !== 'stories'
  && r.calendario !== marca(p) && chaveTitulo(r.ideia) === chaveTitulo(p.ideia));

// os campos da peça, no formato do banco (antes do conferirReel)
function campos(p, fatos) {
  const cenas = (p.cenas ?? []).map((c) => ({ tempo: c.tempo ?? '', cena: c.cena ?? '', fala: c.fala ?? '', tela: c.tela ?? '' }));
  const ultimaEhCta = cenas.length > 1 && tem(cenas.at(-1).fala);
  const roteiro = p.peca === 'reel'
    ? roteiroLimpo({
      hook: cenas[0]?.fala ?? '',
      textoTela: p.textoTela ?? '',
      cenas,
      desenvolvimento: cenas.slice(1, ultimaEhCta ? -1 : undefined).map((c) => c.fala).filter(tem).join('\n\n'),
      cta: ultimaEhCta ? cenas.at(-1).fala : '',
    })
    : null;
  return {
    ideia: p.ideia, tema: p.tema, pilar: p.pilar, pilarTexto: p.pilarTexto, bloco: p.bloco, motivo: p.motivo,
    peca: p.peca, peca2: null, tipo: p.tipo, data: p.data, status: p.status, campanhaId: CAMPANHA, rede: 'Instagram',
    formatoTexto: p.formatoTexto ?? '', formatoId: null,
    ...(roteiro ? { roteiro } : {}),
    ...(p.carrossel ? { carrossel: p.carrossel } : {}),
    ...(p.estatico ? { estatico: p.estatico } : {}),
    legenda: p.legenda ?? '',
    fontes: fontesDe(p, fatos),
    gravacao: p.gravacao ?? null,
    notas: `${ORIGEM} ${p.notas ?? ''}`.trim(),
    calendario: marca(p),
  };
}

const juntarNotas = (antes, depois) => curto([antes, depois].filter(tem).join('\n\n'), LIM_NOTAS);
const comparavel = (r) => JSON.stringify(['ideia', 'tema', 'pilar', 'pilarTexto', 'bloco', 'motivo', 'peca', 'tipo', 'data', 'status', 'roteiro', 'carrossel', 'estatico', 'legenda', 'fontes', 'gravacao', 'notas', 'formatoTexto'].map((k) => r[k] ?? null));

// aplica a semana no banco dado (uma cópia pra conferir, depois o de verdade)
function aplicar(db, fatos) {
  const cont = { criada: 0, atualizada: 0, igual: 0, saiu: 0, mexida: 0, emAprovacao: 0, naTela: 0, sCriado: 0, sAtualizado: 0, sIgual: 0, sOutro: 0, sEmAprovacao: 0 };
  const linhas = [];
  const ids = {};
  db.reels ??= [];
  for (const p of SEMANA) {
    const onde = fmt(p.data);
    const novo = conferirReel(campos(p, fatos));
    const daSemana = db.reels.find((r) => r.calendario === marca(p));
    if (daSemana) {
      ids[p.data] = daSemana.id;
      if (daSemana.atualizadoPor && daSemana.atualizadoPor !== AUTOR) { cont.mexida++; linhas.push(`${onde} · mexida na tela por ${daSemana.atualizadoPor}: não mudou · ${curto(daSemana.ideia, 60)}`); continue; }
      if (emAprovacao(daSemana)) { cont.emAprovacao++; linhas.push(`${onde} · na aprovação técnica (${emAprovacao(daSemana)}): não mudou · ${curto(daSemana.ideia, 60)}`); continue; }
      if (comparavel(daSemana) === comparavel({ ...daSemana, ...novo })) { cont.igual++; continue; }
      Object.assign(daSemana, novo, { atualizadoEm: agora(), atualizadoPor: AUTOR });
      cont.atualizada++;
      linhas.push(`${onde} · atualizada · ${curto(p.ideia, 60)}`);
      continue;
    }
    const naTela = criadoNaTela(db, p);
    if (naTela) {
      ids[p.data] = naTela.id;
      cont.naTela++;
      linhas.push(`${onde} · já criado na tela${naTela.criadoPor ? ` por ${naTela.criadoPor}` : ''}: não mudou · ${curto(naTela.ideia, 60)}`);
      continue;
    }
    // o que estava no dia (feed não postado, de outra origem) sai do calendário, guardado sem data
    // peça com vídeo final pronto (o Filme Pipoca no 25, por exemplo) fica no dia: o Pedro decide se sai
    const doDia = db.reels.filter((r) => r.data === p.data && (r.peca ?? 'reel') !== 'stories' && r.status !== 'publicado'
      && !String(r.calendario ?? '').startsWith('semana-2210:') && !r.videos?.length);
    for (const r of db.reels.filter((x) => x.data === p.data && x.videos?.length && x.status !== 'publicado' && !String(x.calendario ?? '').startsWith('semana-2210:'))) {
      linhas.push(`${onde} · fica no dia (tem vídeo final) · ${curto(r.ideia, 60)}`);
    }
    for (const r of doDia) {
      r.notas = juntarNotas(`Saiu do calendário em 22/10: o dia ${fmt(p.data)} ficou com o post "${curto(p.ideia, 90)}" (aprovado pelo Pedro em 21/10). O texto desta peça continua aqui; pra voltar ao calendário, é só pôr uma data.`, r.notas);
      r.data = '';
      r.atualizadoEm = agora();
      r.atualizadoPor = AUTOR;
      cont.saiu++;
      linhas.push(`${onde} · saiu do dia (sem data) · ${curto(r.ideia, 60)}`);
    }
    const nova = {
      id: novoId('reel'), criadoEm: agora(), criadoPor: CRIADO_POR,
      roteiro: roteiroLimpo(null), ...pecaVazia(), legenda: '', gravacao: null, fontes: [],
      ...novo, permalink: '', metricas: null, ideiaId: null, favorito: false, atualizadoEm: agora(), atualizadoPor: AUTOR,
    };
    db.reels.push(nova);
    ids[p.data] = nova.id;
    cont.criada++;
    linhas.push(`${onde} · nova (${p.peca}, ${p.tipo}) · ${curto(p.ideia, 60)}`);
  }
  // stories: um por dia, ligado ao post do dia
  db.stories ??= [];
  for (const s of STORIES) {
    const onde = `stories ${fmt(s.data)}`;
    const atual = db.stories.find((x) => x.data === s.data);
    // 22/10 (achado): os stories que foram pra aprovação técnica contam como mexidos (não são regravados)
    if (atual && emAprovacao(atual)) { cont.sEmAprovacao++; linhas.push(`${onde} · na aprovação técnica (${emAprovacao(atual)}): não mudou · ${curto(atual.tema, 60)}`); continue; }
    const doScript = atual && atual.criadoPor === AUTOR && (!atual.atualizadoPor || atual.atualizadoPor === AUTOR) && atual.status === 'ideia';
    if (atual && !doScript) { cont.sOutro++; linhas.push(`${onde} · já tem stories (${atual.status}, ${atual.atualizadoPor ?? atual.criadoPor ?? 'sem autor'}): não mudou · ${curto(atual.tema, 60)}`); continue; }
    const dia = conferirStoriesDia(db, camposStories(s, fatos, ids[s.data] ?? null), atual ?? null);
    if (atual) {
      const antes = JSON.stringify(atual);
      Object.assign(atual, dia);
      if (JSON.stringify(atual) === antes) { cont.sIgual++; continue; }
      Object.assign(atual, { atualizadoEm: agora(), atualizadoPor: AUTOR });
      cont.sAtualizado++;
      linhas.push(`${onde} · atualizado · ${curto(s.tema, 60)}`);
      continue;
    }
    db.stories.push({ id: novoId('sto'), ...dia, status: 'ideia', criadoEm: agora(), criadoPor: AUTOR });
    cont.sCriado++;
    linhas.push(`${onde} · novo (${s.objetivo}${dia.pecaDoDia ? ', ligado ao post do dia' : ', sem post do dia'}) · ${curto(s.tema, 60)}`);
  }
  return { cont, linhas };
}

const original = await readFile(DB_PATH, 'utf8');
const cru = JSON.parse(original);
const fatos = await lerFatos();
const pilares = cru.pilares ?? [];

// 0. conferência, peça por peça
const vistos = new Set();
for (const p of SEMANA) {
  const onde = `${fmt(p.data)} "${curto(p.ideia, 50)}"`;
  if (!dataValida(p.data)) erros.push(`${onde}: data inválida.`);
  if (vistos.has(marca(p))) erros.push(`${onde}: aparece duas vezes (um post por dia).`);
  vistos.add(marca(p));
  if (!PECAS_FEED.includes(p.peca)) erros.push(`${onde}: peça ${p.peca} não é reel, carrossel nem estático.`);
  if (!TIPOS_REEL.includes(p.tipo)) erros.push(`${onde}: tipo ${p.tipo} não existe.`);
  if (!pilares.some((x) => Number(x.id ?? x.numero) === p.pilar)) erros.push(`${onde}: pilar ${p.pilar} não existe.`);
  if (blocoDoPilar(p.pilar) !== p.bloco) erros.push(`${onde}: bloco ${p.bloco} não bate com o pilar ${p.pilar} (${blocoDoPilar(p.pilar)}).`);
  for (const id of p.fontes ?? []) {
    const f = fatos.get(id);
    if (!f) erros.push(`${onde}: o fato ${id} não existe no FATOS.md.`);
    else if (!/^USAR\b/.test(f.status)) erros.push(`${onde}: o fato ${id} está como ${f.status} no FATOS.md.`);
  }
  let peca;
  try { peca = conferirReel(campos(p, fatos)); } catch (e) { erros.push(`${onde}: ${e.message}`); continue; }
  // a conferência lê o roteiro no nível de cima (como vem da IA): o do banco fica dentro de roteiro
  const qa = await conferir({ ...peca, ...(peca.roteiro ?? {}) });
  for (const i of qa.itens.filter((x) => !x.ok)) {
    const linha = `${onde}: [${i.nivel}] ${i.nome}: ${i.achados.map((a) => `${a.onde}: "${a.trecho}"`).join('; ')}`;
    (i.nivel === 'bloqueante' ? erros : avisos).push(linha);
  }
}
// stories: a validação do app (sem a peça do dia, que só existe depois), os fatos e a conferência do Ateliê no texto
// que vai pro público (quadros e CTA)
const diasStories = new Set();
for (const s of STORIES) {
  const onde = `stories ${fmt(s.data)}`;
  if (diasStories.has(s.data)) erros.push(`${onde}: aparece duas vezes (um stories por dia).`);
  diasStories.add(s.data);
  if (!SEMANA.some((p) => p.data === s.data)) avisos.push(`${onde}: não tem post do dia na semana.`);
  for (const id of s.fontes ?? []) {
    const f = fatos.get(id);
    if (!f) erros.push(`${onde}: o fato ${id} não existe no FATOS.md.`);
    else if (!/^USAR\b/.test(f.status)) erros.push(`${onde}: o fato ${id} está como ${f.status} no FATOS.md.`);
  }
  try { conferirStoriesDia(cru, camposStories(s, fatos, null)); } catch (e) { erros.push(`${onde}: ${e.message}`); continue; }
  const qa = await conferir({ legenda: [...s.quadros.map((q) => q.texto), s.cta].join('\n'), fontes: fontesDe(s, fatos) });
  for (const i of qa.itens.filter((x) => !x.ok)) {
    const linha = `${onde}: [${i.nivel}] ${i.nome}: ${i.achados.map((a) => `"${a.trecho}"`).join('; ')}`;
    (i.nivel === 'bloqueante' ? erros : avisos).push(linha);
  }
}
if (erros.length) sair(`${erros.length} problema(s):\n  - ${erros.join('\n  - ')}`);

// a semana numa cópia: mostra o que muda
let plano = aplicar(structuredClone(cru), fatos);
const mudou = plano.cont.criada + plano.cont.atualizada + plano.cont.saiu + plano.cont.sCriado + plano.cont.sAtualizado > 0;
if (mudou && !SIMULAR) {
  const db = await carregar();
  plano = aplicar(db, fatos);
  const primeiro = arquivoDados('db.antes-semana-2210.json');
  if (!existsSync(primeiro)) await writeFile(primeiro, original);
  await writeFile(arquivoDados('db.antes-semana-2210.ultimo.json'), original);
  await salvar();
}

const c = plano.cont;
console.log(`${SIMULAR ? '[simulação] ' : ''}Semana de 22 a 25/10: posts ${c.criada} novo(s), ${c.atualizada} atualizado(s), ${c.saiu} fora do calendário (sem data), ${c.igual} igual(is), ${c.mexida} mexido(s) na tela, ${c.emAprovacao} na aprovação técnica, ${c.naTela} já criado(s) na tela; stories ${c.sCriado} novo(s), ${c.sAtualizado} atualizado(s), ${c.sIgual} igual(is), ${c.sEmAprovacao} na aprovação técnica, ${c.sOutro} já existente(s) de outra origem (não mudaram).`);
for (const l of plano.linhas) console.log(`  ${l}`);
if (avisos.length) console.log(`\nPra conferir (alerta e "revisar" da conferência do Ateliê):\n  - ${avisos.join('\n  - ')}`);
if (!mudou) console.log('Nada a mudar.');
else if (!SIMULAR) console.log(`\nBackup em ${path.relative(process.cwd(), arquivoDados('db.antes-semana-2210.ultimo.json'))}.`);
process.exit(0);
