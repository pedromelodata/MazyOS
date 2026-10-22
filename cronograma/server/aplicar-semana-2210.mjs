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
//     aparece no Início em "peças sem data". Stories do dia não mudam
//  3. backup do db.json de antes: db.antes-semana-2210.json na primeira vez (nunca regravado) e
//     db.antes-semana-2210.ultimo.json a cada rodada
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { DB_PATH, arquivoDados, carregar, salvar, agora, novoId, dataValida, blocoDoPilar, TIPOS_REEL } from './db.mjs';
import { conferirReel, roteiroLimpo, pecaVazia } from './validar.mjs';
import { conferir } from './atelie.mjs';
import { RAIZ } from './importar.mjs';
import { SEMANA } from './conteudo-semana-2210.mjs';

const SIMULAR = process.argv.includes('--simular');
const PORTA = Number(process.env.PORT) || 4317;
const AUTOR = 'Semana de 22 a 25/10 (aplicar-semana-2210)';
const CRIADO_POR = 'Posts de 22 a 25/10 (aprovados em 21/10)';
const CAMPANHA = 'cmp_prelancamento';
const PECAS_FEED = ['reel', 'carrossel', 'estatico'];
const ORIGEM = 'Posts de 22 a 25/10, aprovados pelo Pedro em 21/10 (server/conteudo-semana-2210.mjs). Estratégia: marketing/estrategia/ESTRATEGIA-PRINCIPAL.md.';
const LIM_NOTAS = 2000;

const tem = (v) => Boolean(String(v ?? '').trim());
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
    fontes: (p.fontes ?? []).map((id) => { const f = fatos.get(id); return f ? `${id} · ${f.titulo} (${f.fonte})` : id; }),
    gravacao: p.gravacao ?? null,
    notas: `${ORIGEM} ${p.notas ?? ''}`.trim(),
    calendario: marca(p),
  };
}

const juntarNotas = (antes, depois) => curto([antes, depois].filter(tem).join('\n\n'), LIM_NOTAS);
const comparavel = (r) => JSON.stringify(['ideia', 'tema', 'pilar', 'pilarTexto', 'bloco', 'motivo', 'peca', 'tipo', 'data', 'status', 'roteiro', 'carrossel', 'estatico', 'legenda', 'fontes', 'gravacao', 'notas', 'formatoTexto'].map((k) => r[k] ?? null));

// aplica a semana no banco dado (uma cópia pra conferir, depois o de verdade)
function aplicar(db, fatos) {
  const cont = { criada: 0, atualizada: 0, igual: 0, saiu: 0, mexida: 0 };
  const linhas = [];
  db.reels ??= [];
  for (const p of SEMANA) {
    const onde = fmt(p.data);
    const novo = conferirReel(campos(p, fatos));
    const daSemana = db.reels.find((r) => r.calendario === marca(p));
    if (daSemana) {
      if (daSemana.atualizadoPor && daSemana.atualizadoPor !== AUTOR) { cont.mexida++; linhas.push(`${onde} · mexida na tela por ${daSemana.atualizadoPor}: não mudou · ${curto(daSemana.ideia, 60)}`); continue; }
      if (comparavel(daSemana) === comparavel({ ...daSemana, ...novo })) { cont.igual++; continue; }
      Object.assign(daSemana, novo, { atualizadoEm: agora(), atualizadoPor: AUTOR });
      cont.atualizada++;
      linhas.push(`${onde} · atualizada · ${curto(p.ideia, 60)}`);
      continue;
    }
    // o que estava no dia (feed não postado, de outra origem) sai do calendário, guardado sem data
    const doDia = db.reels.filter((r) => r.data === p.data && (r.peca ?? 'reel') !== 'stories' && r.status !== 'publicado'
      && !String(r.calendario ?? '').startsWith('semana-2210:'));
    for (const r of doDia) {
      r.notas = juntarNotas(`Saiu do calendário em 22/10: o dia ${fmt(p.data)} ficou com o post "${curto(p.ideia, 90)}" (aprovado pelo Pedro em 21/10). O texto desta peça continua aqui; pra voltar ao calendário, é só pôr uma data.`, r.notas);
      r.data = '';
      r.atualizadoEm = agora();
      r.atualizadoPor = AUTOR;
      cont.saiu++;
      linhas.push(`${onde} · saiu do dia (sem data) · ${curto(r.ideia, 60)}`);
    }
    db.reels.push({
      id: novoId('reel'), criadoEm: agora(), criadoPor: CRIADO_POR,
      roteiro: roteiroLimpo(null), ...pecaVazia(), legenda: '', gravacao: null, fontes: [],
      ...novo, permalink: '', metricas: null, ideiaId: null, favorito: false, atualizadoEm: agora(), atualizadoPor: AUTOR,
    });
    cont.criada++;
    linhas.push(`${onde} · nova (${p.peca}, ${p.tipo}) · ${curto(p.ideia, 60)}`);
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
if (erros.length) sair(`${erros.length} problema(s):\n  - ${erros.join('\n  - ')}`);

// a semana numa cópia: mostra o que muda
let plano = aplicar(structuredClone(cru), fatos);
const mudou = plano.cont.criada + plano.cont.atualizada + plano.cont.saiu > 0;
if (mudou && !SIMULAR) {
  const db = await carregar();
  plano = aplicar(db, fatos);
  const primeiro = arquivoDados('db.antes-semana-2210.json');
  if (!existsSync(primeiro)) await writeFile(primeiro, original);
  await writeFile(arquivoDados('db.antes-semana-2210.ultimo.json'), original);
  await salvar();
}

const c = plano.cont;
console.log(`${SIMULAR ? '[simulação] ' : ''}Semana de 22 a 25/10: ${c.criada} nova(s), ${c.atualizada} atualizada(s), ${c.saiu} fora do calendário (sem data), ${c.igual} igual(is), ${c.mexida} mexida(s) na tela (não mudaram).`);
for (const l of plano.linhas) console.log(`  ${l}`);
if (avisos.length) console.log(`\nPra conferir (alerta e "revisar" da conferência do Ateliê):\n  - ${avisos.join('\n  - ')}`);
if (!mudou) console.log('Nada a mudar.');
else if (!SIMULAR) console.log(`\nBackup em ${path.relative(process.cwd(), arquivoDados('db.antes-semana-2210.ultimo.json'))}.`);
process.exit(0);
