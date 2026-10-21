// O mecanismo de anti-repetição e continuidade na semana de 26/10 (21/10/2026, Pedro, P4). Grava no banco o que o
// calendário da semana (_base-contabil/estrategia/2026-10-26-calendario-editorial-semana-26-10-a-01-11.md) já decidiu e
// o mecanismo (mecanismo.mjs) precisa ver. Rode com o servidor PARADO e depois do aplicar-estrategia-2110.mjs:
//   node server/aplicar-mecanismo-2610.mjs [--simular]
// --simular mostra o que mudaria e a análise de depois, sem gravar. CRONOGRAMA_DATA troca a pasta de dados (teste numa
// cópia). Rodar de novo não duplica (a resposta é achada pela marca calendario "mecanismo:resposta-caixinha:2026-10-26").
//  1. stories de 31/10 (a oferta): excecaoAntiRepeticao { ativa: true, motivo } com o texto EXATO da coluna "O que fiz"
//     da linha "Sáb 31, stories de oferta" da tabela de anti-repetição do calendário (lido do .md na hora)
//  2. stories de 26/10 (a caixinha "Qual dúvida você tem vergonha de perguntar pro contador?"): mecanica 'caixinha'
//  2b. o ângulo do pilar 8 que o calendário já escreveu no pilarTexto (a enquete de 28/10: "ângulo gente desde a
//     entrada") vai pro campo angulo, pra anti-repetição do ângulo conferir
//  3. a resposta da caixinha na semana seguinte, como a mecânica manda (caixinha numa semana, resposta na seguinte):
//     carrossel "Traduzindo o contabilês: as dúvidas da caixinha de 26/10" na sexta 06/11 (feed das 18h), pilar 16,
//     mecanica 'resposta-caixinha', status 'ideia'
//  4. imprime a análise do mecanismo das semanas de 26/10 e 02/11
//  5. backup: db.antes-mecanismo-2610.json na primeira vez e db.antes-mecanismo-2610.ultimo.json a cada rodada
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { DB_PATH, arquivoDados, carregar, salvar, agora, novoId, blocoDoPilar, tipoDoPilar } from './db.mjs';
import { conferirReel, conferirStoriesDia, roteiroLimpo, pecaVazia } from './validar.mjs';
import { analisarSemana, pecasDaCampanha, anguloCanonico } from './mecanismo.mjs';
import { CAMPANHA_PADRAO } from './migrar.mjs';
import { RAIZ } from './importar.mjs';

const SIMULAR = process.argv.includes('--simular');
const PORTA = Number(process.env.PORT) || 4317;
const AUTOR = 'Mecanismo da estratégia (aplicar-mecanismo-2610)';
const CALENDARIO = '_base-contabil/estrategia/2026-10-26-calendario-editorial-semana-26-10-a-01-11.md';
const LINHA_ANTI = 'Sáb 31, stories de oferta';
const MARCA_RESPOSTA = 'mecanismo:resposta-caixinha:2026-10-26';
const RESPOSTA = {
  data: '2026-11-06', peca: 'carrossel', pilar: 16,
  ideia: 'Traduzindo o contabilês: as dúvidas da caixinha de 26/10',
  motivo: 'Mecânica "Pergunta que ninguém explica": caixinha numa semana, resposta na seguinte. A caixinha dos stories de 26/10 vira o carrossel "Traduzindo o contabilês" desta semana, com 3 a 5 dúvidas escolhidas pela que mais se repete, sempre anônimas (mecanicas-engajamento.md e a anatomia do orgânico, seção 8).',
  formatoTexto: 'Feed · carrossel',
  notas: 'Feed das 18h de sexta. Os temas saem das respostas da caixinha de 26/10: de 3 a 5, anônimas, sem expor situação fiscal irregular de ninguém. "Marca quem tem essa dúvida" no fim (alcance emprestado). Nasceu do mecanismo de continuidade (aplicar-mecanismo-2610).',
};
const fmt = (d) => String(d).split('-').reverse().slice(0, 2).join('/');
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

// a célula "O que fiz" da linha da anti-repetição, exatamente como está no .md
function motivoDoCalendario(md) {
  const linhas = md.split(/\r?\n/);
  const i = linhas.findIndex((l) => /^\|\s*Item desta semana\s*\|\s*Peça parecida\s*\|\s*O que fiz\s*\|/.test(l));
  if (i < 0) throw new Error(`A tabela de anti-repetição (Item desta semana | Peça parecida | O que fiz) não foi achada em ${CALENDARIO}.`);
  for (const l of linhas.slice(i + 2)) {
    if (!l.trim().startsWith('|')) break;
    const c = l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((x) => x.trim());
    if (c[0] === LINHA_ANTI) {
      if (c.length !== 3 || !c[2]) throw new Error(`A linha "${LINHA_ANTI}" não tem a coluna "O que fiz".`);
      return c[2];
    }
  }
  throw new Error(`A linha "${LINHA_ANTI}" não está na tabela de anti-repetição de ${CALENDARIO}.`);
}

let MOTIVO;
try {
  MOTIVO = motivoDoCalendario(await readFile(path.join(RAIZ, CALENDARIO), 'utf8'));
} catch (e) { sair(e.message); }

function aplicar(db) {
  const log = [];
  const mudou = { excecao: 0, caixinha: 0, angulo: 0, resposta: 0 };
  db.stories ??= [];
  // 1. a oferta de 31/10: repetição de propósito, com o motivo do calendário
  const s31 = db.stories.find((s) => s.data === '2026-10-31');
  if (!s31) throw new Error('Os stories de 31/10 não estão no banco. Rode antes o aplicar-estrategia-2110.mjs.');
  const excecao = { ativa: true, motivo: MOTIVO };
  if (JSON.stringify(s31.excecaoAntiRepeticao ?? null) !== JSON.stringify(excecao)) {
    Object.assign(s31, conferirStoriesDia(db, { excecaoAntiRepeticao: excecao }, s31), { atualizadoEm: agora(), atualizadoPor: AUTOR });
    mudou.excecao++;
    log.push(`stories 31/10 (${s31.tema.slice(0, 60)}): excecaoAntiRepeticao com o motivo do calendário`);
  }
  // 2. a caixinha de 26/10
  const s26 = db.stories.find((s) => s.data === '2026-10-26');
  if (!s26) throw new Error('Os stories de 26/10 não estão no banco. Rode antes o aplicar-estrategia-2110.mjs.');
  if (!/caixinha/i.test(s26.tema ?? '')) throw new Error(`Os stories de 26/10 não são a caixinha do calendário: "${s26.tema}".`);
  if (s26.mecanica !== 'caixinha') {
    Object.assign(s26, conferirStoriesDia(db, { mecanica: 'caixinha' }, s26), { atualizadoEm: agora(), atualizadoPor: AUTOR });
    mudou.caixinha++;
    log.push(`stories 26/10 (${s26.tema.slice(0, 60)}): mecanica caixinha`);
  }
  // 2b. o ângulo do pilar 8 escrito no pilarTexto da semana
  const naSemana = (d) => typeof d === 'string' && d >= '2026-10-26' && d <= '2026-11-01';
  const doTexto = (t) => anguloCanonico(/(?:^|[\s(])ângulo ([^)·]+)/i.exec(String(t ?? ''))?.[1]?.trim() ?? '');
  for (const s of db.stories.filter((x) => naSemana(x.data) && Number(x.pilar) === 8 && !x.angulo && doTexto(x.pilarTexto))) {
    Object.assign(s, conferirStoriesDia(db, { angulo: doTexto(s.pilarTexto) }, s), { atualizadoEm: agora(), atualizadoPor: AUTOR });
    mudou.angulo++;
    log.push(`stories ${fmt(s.data)}: ângulo ${s.angulo} (do pilarTexto do calendário)`);
  }
  for (const r of db.reels.filter((x) => naSemana(x.data) && Number(x.pilar) === 8 && !x.angulo && doTexto(x.pilarTexto))) {
    Object.assign(r, conferirReel({ angulo: doTexto(r.pilarTexto) }, r), { atualizadoEm: agora(), atualizadoPor: AUTOR });
    mudou.angulo++;
    log.push(`${fmt(r.data)} ${r.peca}: ângulo ${r.angulo} (do pilarTexto do calendário)`);
  }
  // 3. a resposta na semana seguinte (sexta, feed das 18h)
  if (!db.reels.some((r) => r.calendario === MARCA_RESPOSTA)) {
    const campos = conferirReel({
      data: RESPOSTA.data, peca: RESPOSTA.peca, peca2: null, pilar: RESPOSTA.pilar, bloco: blocoDoPilar(RESPOSTA.pilar), tipo: tipoDoPilar(RESPOSTA.pilar),
      ideia: RESPOSTA.ideia, tema: '', motivo: RESPOSTA.motivo, mecanica: 'resposta-caixinha', status: 'ideia', formatoTexto: RESPOSTA.formatoTexto,
      pilarTexto: 'Educação · pilar 16 · mecânica recorrente (resposta da caixinha)', notas: RESPOSTA.notas, rede: 'Instagram', formatoId: null,
      campanhaId: (db.campanhas ?? []).some((c) => c.id === 'cmp_prelancamento') ? 'cmp_prelancamento' : CAMPANHA_PADRAO, calendario: MARCA_RESPOSTA,
    });
    db.reels.push({
      id: novoId('reel'), criadoEm: agora(), criadoPor: AUTOR, roteiro: roteiroLimpo(null), ...pecaVazia(), legenda: '', gravacao: null, fontes: [],
      ...campos, permalink: '', metricas: null, ideiaId: null, favorito: false, atualizadoEm: agora(), atualizadoPor: AUTOR,
    });
    mudou.resposta++;
    log.push(`${fmt(RESPOSTA.data)} nova (carrossel, pilar 16, resposta-caixinha): ${RESPOSTA.ideia}`);
  }
  return { mudou, log };
}

function imprimirAnalise(db, inicio, campanha) {
  const a = analisarSemana(db, inicio, { campanha });
  console.log(`\nSemana de ${fmt(a.semana.inicio)} a ${fmt(a.semana.fim)}: ${a.volume.reels} reels, ${a.volume.feeds} feeds, ${a.volume.storiesTemas} temas de stories (o travado é ${a.volume.alvo.reels}, ${a.volume.alvo.feeds} e ${a.volume.alvo.storiesTemas}).`);
  console.log(`  mix: ${Object.entries(a.mix).map(([b, x]) => `${b} ${x.n} (${x.pct}%, fatia ${x.fatia}%${x.ok ? '' : ', fora'})`).join(' · ')}`);
  console.log(`  oferta: ${a.oferta.n} (${a.oferta.pct}%, teto ${a.oferta.teto}%)`);
  for (const c of a.continuidade) console.log(`  continuidade [${c.ok ? 'ok' : 'falta'}]: ${c.texto}`);
  for (const i of a.itens) {
    for (const x of a.pecas[i.id].filter((y) => y.nivel !== 'ok')) console.log(`  ${fmt(i.data)} ${i.peca} [${x.nivel}] ${x.texto}`);
  }
  if (!a.alertas.length) console.log('  sem alertas.');
  else console.log(`  ${a.alertas.length} alerta(s) na semana.`);
}

const original = await readFile(DB_PATH, 'utf8');
const cru = JSON.parse(original);
const campanha = await pecasDaCampanha();

let plano;
let simulado;
try {
  simulado = structuredClone(cru);
  plano = aplicar(simulado);
} catch (e) { sair(e.message); }
const total = Object.values(plano.mudou).reduce((s, v) => s + v, 0);
let final = simulado;
if (total && !SIMULAR) {
  const db = await carregar();
  plano = aplicar(db);
  const primeiro = arquivoDados('db.antes-mecanismo-2610.json');
  if (!existsSync(primeiro)) await writeFile(primeiro, original);
  await writeFile(arquivoDados('db.antes-mecanismo-2610.ultimo.json'), original);
  await salvar();
  final = db;
}
const m = plano.mudou;
console.log(`${SIMULAR ? '[simulação] ' : ''}Mecanismo na semana de 26/10: ${m.excecao} exceção de anti-repetição, ${m.caixinha} caixinha marcada, ${m.angulo} ângulo do pilar 8, ${m.resposta} resposta da caixinha criada.`);
console.log(`  motivo da exceção (do calendário): ${MOTIVO}`);
for (const l of plano.log) console.log(`  ${l}`);
if (!total) console.log('Nada a mudar.');
imprimirAnalise(final, '2026-10-26', campanha);
imprimirAnalise(final, '2026-11-02', campanha);
process.exit(0);
