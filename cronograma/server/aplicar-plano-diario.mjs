// Plano diário de 22/10 a 10/11/2026 no cronograma (Pedro, 21/10: 1 post por dia; "temos apenas segunda, quarta e
// sexta, coloque também até sábado pelo menos"). Os posts estão em server/conteudo-plano-diario-2026-10.mjs, tirados
// de marketing/conteudo/plano-diario-2026-10-22/PLANO.md. Rode com o servidor PARADO:
//   node server/aplicar-plano-diario.mjs [--simular]
// --simular confere tudo e mostra o que mudaria, sem gravar. CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia).
// Rodar de novo não duplica: a peça do plano é achada pela marca calendario "plano-diario:<data>[:<ordem>]".
//  0. confere tudo antes de gravar (um problema e nada é gravado): data válida, peça e tipo que existem, pilar que
//     existe e bloco que bate com ele, cada fato citado existe no _base-contabil/FATOS.md e está como USAR, e o texto
//     passa na conferência do Ateliê (atelie.mjs) sem bloqueante. Alerta e "revisar" saem no resumo
//  1. peça do plano: criada, ou atualizada se veio de uma rodada anterior. A que alguém mexeu na tela depois
//     (atualizadoPor diferente deste script) não muda
//  2. peça da V1 que ocupava o dia (não postada) sai do calendário: fica sem data, com a nota de por que saiu, e
//     aparece no Início em "peças sem data". mesmaPeca (o 28/10): a peça da V1 é refeita no lugar, e o texto do tipo
//     antigo continua guardado nela
//  3. backup do db.json de antes: db.antes-plano-diario.json na primeira vez (nunca regravado) e
//     db.antes-plano-diario.ultimo.json a cada rodada
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { DB_PATH, arquivoDados, carregar, salvar, agora, novoId, dataValida, blocoDoPilar, TIPOS_REEL } from './db.mjs';
import { conferirReel, roteiroLimpo, pecaVazia } from './validar.mjs';
import { conferir } from './atelie.mjs';
import { RAIZ } from './importar.mjs';
import { PLANO } from './conteudo-plano-diario-2026-10.mjs';

const SIMULAR = process.argv.includes('--simular');
const PORTA = Number(process.env.PORT) || 4317;
const AUTOR = 'Plano diário (aplicar-plano-diario)';
const CRIADO_POR = 'Plano diário de 22/10 a 10/11';
const CAMPANHA = 'cmp_prelancamento';
const PECAS_FEED = ['reel', 'carrossel', 'estatico'];
const ORIGEM = 'Plano diário de 22/10 a 10/11 (marketing/conteudo/plano-diario-2026-10-22/PLANO.md).';
const LIM_NOTAS = 2000;

const tem = (v) => Boolean(String(v ?? '').trim());
const marca = (p) => `plano-diario:${p.data}${p.ordem ? `:${p.ordem}` : ''}`;
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

// os campos da peça do plano, no formato do banco (antes do conferirReel)
function campos(p, pilares, fatos) {
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
  const pil = pilares.find((x) => Number(x.id ?? x.numero) === p.pilar);
  return {
    ideia: p.ideia, tema: p.tema, pilar: p.pilar, pilarTexto: pil ? `${p.pilar} · ${pil.nome}` : String(p.pilar), bloco: p.bloco,
    peca: p.peca, peca2: null, tipo: p.tipo, data: p.data, status: p.status, campanhaId: CAMPANHA, rede: 'Instagram',
    formatoTexto: p.formatoTexto ?? '', formatoId: null,
    ...(roteiro ? { roteiro } : {}),
    ...(p.carrossel ? { carrossel: p.carrossel } : {}),
    ...(p.estatico ? { estatico: p.estatico } : {}),
    legenda: p.legenda ?? '',
    fontes: (p.fontes ?? []).map((id) => { const f = fatos.get(id); return f ? `${id} · ${f.titulo} (${f.fonte})` : id; }),
    gravacao: p.gravacao ?? null,
    videos: p.videos ?? [],
    notas: `${ORIGEM} ${p.notas ?? ''}`.trim(),
    calendario: marca(p),
  };
}

const juntarNotas = (antes, depois) => curto([antes, depois].filter(tem).join('\n\n'), LIM_NOTAS);
const comparavel = (r) => JSON.stringify(['ideia', 'tema', 'pilar', 'bloco', 'peca', 'tipo', 'data', 'status', 'roteiro', 'carrossel', 'estatico', 'legenda', 'fontes', 'gravacao', 'videos', 'notas', 'formatoTexto'].map((k) => r[k] ?? null));

// aplica o plano no banco dado (uma cópia pra conferir, depois o de verdade)
function aplicar(db, fatos) {
  const cont = { criada: 0, atualizada: 0, igual: 0, refeita: 0, saiu: 0, mexida: 0 };
  const linhas = [];
  db.reels ??= [];
  for (const p of PLANO) {
    const onde = `${fmt(p.data)}${p.ordem ? ` (${p.ordem}ª)` : ''}`;
    const novo = conferirReel(campos(p, db.pilares ?? [], fatos));
    const doPlano = db.reels.find((r) => r.calendario === marca(p));
    const daV1 = p.ordem ? [] : db.reels.filter((r) => r.data === p.data && (r.peca ?? 'reel') !== 'stories' && r.status !== 'publicado'
      && !String(r.calendario ?? '').startsWith('plano-diario:'));
    if (doPlano) {
      if (doPlano.atualizadoPor && doPlano.atualizadoPor !== AUTOR) { cont.mexida++; linhas.push(`${onde} · mexida na tela por ${doPlano.atualizadoPor}: não mudou · ${curto(doPlano.ideia, 60)}`); continue; }
      // a nota de "refeita" (peça da V1 refeita no lugar) fica na frente das notas do plano
      const refeita = /^Refeita pelo plano diário[^\n]*/.exec(doPlano.notas ?? '')?.[0];
      if (refeita) novo.notas = juntarNotas(refeita, novo.notas);
      if (comparavel(doPlano) === comparavel({ ...doPlano, ...novo })) { cont.igual++; continue; }
      Object.assign(doPlano, novo, { atualizadoEm: agora(), atualizadoPor: AUTOR });
      cont.atualizada++;
      linhas.push(`${onde} · atualizada · ${curto(p.ideia, 60)}`);
      continue;
    }
    if (p.mesmaPeca && daV1.length === 1) {
      const r = daV1[0];
      const antes = `Refeita pelo plano diário em 21/10: era "${curto(r.ideia, 90)}" (${r.peca ?? 'reel'}). O texto do tipo antigo continua guardado na peça.`;
      Object.assign(r, novo, { notas: juntarNotas(antes, novo.notas), atualizadoEm: agora(), atualizadoPor: AUTOR });
      // texto mudou: aprovação antiga não vale mais
      if (['aprovado', 'pendente'].includes(r.aprovacao?.estado)) {
        r.aprovacao.estado = 'alterado';
        r.aprovacao.conversa = [...(r.aprovacao.conversa ?? []), { id: novoId('apv'), em: agora(), tipo: 'alterado', autor: AUTOR, autorId: null, papel: 'operador', texto: 'O plano diário refez a peça: mande de novo pra aprovação', mudou: ['roteiro'] }];
      }
      cont.refeita++;
      linhas.push(`${onde} · V1 refeita no lugar (${r.peca}) · ${curto(p.ideia, 60)}`);
      continue;
    }
    for (const r of daV1) {
      r.notas = juntarNotas(`Saiu do calendário em 21/10: o plano diário (22/10 a 10/11) pôs no dia ${fmt(p.data)} o post "${curto(p.ideia, 90)}". O texto desta peça continua aqui; pra voltar ao calendário, é só pôr uma data.`, r.notas);
      r.data = '';
      r.atualizadoEm = agora();
      r.atualizadoPor = AUTOR;
      cont.saiu++;
      linhas.push(`${onde} · V1 saiu do dia (sem data) · ${curto(r.ideia, 60)}`);
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
for (const p of PLANO) {
  const onde = `${fmt(p.data)}${p.ordem ? ` (${p.ordem}ª)` : ''} "${curto(p.ideia, 50)}"`;
  if (!dataValida(p.data)) erros.push(`${onde}: data inválida.`);
  if (vistos.has(marca(p))) erros.push(`${onde}: aparece duas vezes (use "ordem" pro segundo post do dia).`);
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
  try { peca = conferirReel(campos(p, pilares, fatos)); } catch (e) { erros.push(`${onde}: ${e.message}`); continue; }
  // a conferência lê o roteiro no nível de cima (como vem da IA): o do banco fica dentro de roteiro
  const qa = await conferir({ ...peca, ...(peca.roteiro ?? {}) });
  for (const i of qa.itens.filter((x) => !x.ok)) {
    const linha = `${onde}: [${i.nivel}] ${i.nome}: ${i.achados.map((a) => `${a.onde}: "${a.trecho}"`).join('; ')}`;
    (i.nivel === 'bloqueante' ? erros : avisos).push(linha);
  }
}
if (erros.length) sair(`${erros.length} problema(s):\n  - ${erros.join('\n  - ')}`);

// o plano numa cópia: mostra o que muda
let plano = aplicar(structuredClone(cru), fatos);
const mudou = plano.cont.criada + plano.cont.atualizada + plano.cont.refeita + plano.cont.saiu > 0;
if (mudou && !SIMULAR) {
  const db = await carregar();
  plano = aplicar(db, fatos);
  const primeiro = arquivoDados('db.antes-plano-diario.json');
  if (!existsSync(primeiro)) await writeFile(primeiro, original);
  await writeFile(arquivoDados('db.antes-plano-diario.ultimo.json'), original);
  await salvar();
}

const c = plano.cont;
console.log(`${SIMULAR ? '[simulação] ' : ''}Plano diário: ${c.criada} nova(s), ${c.atualizada} atualizada(s), ${c.refeita} da V1 refeita(s) no lugar, ${c.saiu} da V1 fora do calendário (sem data), ${c.igual} igual(is), ${c.mexida} mexida(s) na tela (não mudaram).`);
for (const l of plano.linhas) console.log(`  ${l}`);
if (avisos.length) console.log(`\nPra conferir (alerta e "revisar" da conferência do Ateliê):\n  - ${avisos.join('\n  - ')}`);
if (!mudou) console.log('Nada a mudar.');
else if (!SIMULAR) console.log(`\nBackup em ${path.relative(process.cwd(), arquivoDados('db.antes-plano-diario.ultimo.json'))}.`);
process.exit(0);
