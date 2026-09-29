// Stories do dia (28/09): lê o JSON de conteúdo dos stories diários e grava uma ideia de stories por data em
// db.stories (upsert pela data). Rode com o servidor PARADO:
//   node server/aplicar-stories.mjs [caminho do JSON] [--simular]
// Padrão: server/stories-diarios-2026-10.json. O JSON é { "dias": [...] } ou a lista pura. Cada dia:
//   { data: "AAAA-MM-DD", objetivo: "engajamento" | "vendas", pilar: 4, bloco: "Educação", tema: "...",
//     pecaDoDia: "<id da peça do cronograma nesse dia>" | null, quadros: [{ texto, visual, interacao }],
//     cta: "...", fontes: ["F0xx ..."], notas: "" }
// --simular confere tudo e mostra o que mudaria, sem gravar nada (nem a migração do boot, que só roda quando
// algum dia vai mudar de verdade). Rodar de novo com o mesmo JSON não muda nada.
// CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia); com ela, PORT é a porta do servidor de teste.
//
//  0. confere o JSON inteiro antes de escrever: a validação do app (validar.mjs, conferirStoriesDia: data,
//     objetivo, pilar que existe, bloco, 1 a 6 quadros, limites de texto; travessão vira vírgula) e as regras
//     duras de copy no texto que vai pro público (quadros e CTA). Um problema e nada é gravado
//  1. dia que já existe com status diferente de "ideia" (alguém já trabalhou nele) nunca é sobrescrito, nem o
//     dia que alguém editou na tela. Os dois saem no resumo
//  2. pecaDoDia só liga se a peça existe no cronograma; se não existe, o dia entra sem ela e o resumo avisa
//  3. backup do db.json de antes (só quando algo vai mudar): db.antes-stories.json na primeira vez (nunca
//     regravado), db.antes-stories.ultimo.json a cada rodada
//  4. resumo
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, novoId, agora } from './db.mjs';
import { conferirStoriesDia, CAMPOS_STORIES } from './validar.mjs';

const AUTOR = 'Stories do dia (aplicar-stories)';
const JSON_PADRAO = path.join(APP, 'server', 'stories-diarios-2026-10.json');
const ARGS = process.argv.slice(2);
const SIMULAR = ARGS.includes('--simular');
const ARQUIVO = path.resolve(ARGS.find((a) => !a.startsWith('--')) || JSON_PADRAO);
const PORTA_APP = 4317;

// travessão e meia-risca (e parentes), montados por código pra nenhum aparecer no fonte
const TRACO = new RegExp(`[${String.fromCharCode(0x2012, 0x2013, 0x2014, 0x2015)}]`, 'g');
// regras duras de copy do texto público (as mesmas do aplicar-ideias-cronograma.mjs, 28/09)
const CONCORRENTE = /\b(contabilizei|agilize|contaj[aá]|facilite|contabilivre|marvee|conta ?azul|nubank)\b/i;
const PROIBIDOS = [
  [CONCORRENTE, 'concorrente citado por nome'],
  // preço vivo só o de FATOS.md, grupo A (F001 a F005); estes morreram ou estão em conflito na base
  [/R\$\s*(?:19|79)(?!\d|[.,]\d)|\b(?:a|por)\s+(?:19|79)\s+reais\b|49,90|86,05|81,05|268,51|R\$\s*288(?!\d|[.,]\d)|168,48/i, 'preço ou valor morto ou em conflito na base (FATOS F006, F063, F018, F140)'],
  [/\blink (?:na|abaixo)\b/i, 'CTA de clique é "link da bio"'],
  [/\bLegaliz(?:ai|ei)\b(?!\.app)/, 'grafia da marca é "Legalizaí"'],
  [/incondicional|sem letra mi[uú]da|sem asterisco|receber tudo de volta/i, 'promessa proibida ("incondicional", "sem letra miúda", "tudo de volta" sem a condição)'],
  [/\bs[oó] hoje\b|[uú]ltimas vagas|vagas? de fundador/i, 'escassez inventada (PROIBIDO P09)'],
  [/\bbaix[ea] (?:o app )?agora\b|j[aá] dispon[ií]vel|app store|google play/i, 'download ou loja que não existe (PROIBIDO P11)'],
  [/\bsem fidelidade\b|imposto novo|\bao vivo\b/i, 'frase proibida (F023, P31, P25)'],
];
// preço promocional só com o cheio junto e a validade escrita (FATOS F002, F004, F005)
const PRECO = (v) => new RegExp(`R\\$\\s*${v}(?!\\d|[.,]\\d)`);
const VALIDADE = /31\/12\/2026|31 de dezembro de 2026/;

const erros = [];
const avisos = [];
const erro = (msg) => erros.push(msg);
const sair = (msg) => {
  console.error(`\nNada foi gravado: ${msg}`);
  process.exit(1);
};
const fmtData = (d) => `${String(d).slice(8, 10)}/${String(d).slice(5, 7)}`;
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const objeto = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const OBJETIVO_CURTO = { engajamento: 'Engaja', vendas: 'Vende' };
const mesmoCaminho = (a, b) => (process.platform === 'win32' ? path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase() : path.resolve(a) === path.resolve(b));

function portaOcupada(porta) {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: porta });
    s.setTimeout(800);
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('timeout', () => { s.destroy(); ok(false); });
    s.once('error', () => ok(false));
  });
}

// ---------- 0. lê o JSON ----------
function lerDias(bruto) {
  let j;
  try {
    j = JSON.parse(bruto.replace(/^﻿/, ''));
  } catch (e) {
    sair(`o JSON não abre: ${e.message}`);
  }
  const dias = Array.isArray(j) ? j : objeto(j) && Array.isArray(j.dias) ? j.dias : null;
  if (!dias) sair('o JSON precisa ser a lista de dias ou { "dias": [...] }.');
  if (!dias.length) sair('o JSON não tem nenhum dia.');
  return dias;
}

// regras duras: o texto público (quadros e CTA) passa por todas; tema, visual e notas só pelo concorrente
function regrasDuras(onde, dia) {
  const publico = [...dia.quadros.flatMap((q) => [q.texto, q.interacao]), dia.cta].filter(Boolean);
  for (const t of publico) {
    for (const [re, motivo] of PROIBIDOS) {
      const m = t.match(re);
      if (m) erro(`${onde}: ${motivo} ("${m[0]}" em "${t.slice(0, 90)}")`);
    }
  }
  for (const t of [dia.tema, dia.notas, ...dia.quadros.map((q) => q.visual)].filter(Boolean)) {
    const m = t.match(CONCORRENTE);
    if (m) erro(`${onde}: concorrente citado por nome ("${m[0]}" em "${t.slice(0, 90)}")`);
  }
  const junto = publico.join('\n');
  if (PRECO(29).test(junto) && !PRECO(49).test(junto)) erro(`${onde}: R$ 29 sem o valor cheio (R$ 49) junto`);
  if (PRECO(99).test(junto) && !PRECO(139).test(junto)) erro(`${onde}: R$ 99 sem o valor cheio (R$ 139) junto`);
  if ((PRECO(29).test(junto) || PRECO(99).test(junto)) && !VALIDADE.test(junto)) erro(`${onde}: preço promocional sem a validade 31/12/2026`);
}

async function main() {
  const dadosReais = mesmoCaminho(DATA_DIR, path.join(APP, 'data'));
  // com o servidor no ar, ele regravaria o banco de memória por cima desta rodada
  const portas = new Set([...(dadosReais ? [PORTA_APP] : []), ...(process.env.PORT ? [Number(process.env.PORT)] : [])]);
  for (const porta of portas) {
    if (await portaOcupada(porta)) sair(`tem um servidor no ar na porta ${porta}. Pare o servidor da Gestão de Marketing antes e rode de novo.`);
  }
  if (!existsSync(ARQUIVO)) sair(`o JSON ${ARQUIVO} não existe.`);
  if (!existsSync(DB_PATH)) sair(`o banco ${DB_PATH} não existe.`);
  console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é gravado)\n' : ''}JSON: ${ARQUIVO}\nDados: ${DATA_DIR}\n`);

  const bruto = await readFile(ARQUIVO, 'utf8');
  const dias = lerDias(bruto);
  const tracos = bruto.match(TRACO)?.length ?? 0;
  if (tracos) avisos.push(`${tracos} travessão(ões) ou meia-risca(s) no JSON viraram vírgula (entre números, hífen).`);

  // o banco de antes desta rodada, lido cru: a conferência e o plano não passam pelo boot (a migração só
  // roda, e só grava, quando algum dia vai mudar de verdade). Precisa só de pilares, peças e stories
  const original = await readFile(DB_PATH);
  let cru;
  try {
    cru = JSON.parse(original.toString('utf8'));
  } catch (e) {
    sair(`o banco não abre: ${e.message}`);
  }
  for (const k of ['stories', 'reels', 'pilares']) if (!Array.isArray(cru[k])) cru[k] = [];

  // ---------- confere cada dia (nada muda no banco até o fim) ----------
  const vistos = new Map();
  const prontos = [];
  for (const [n, dia] of dias.entries()) {
    const onde = `dia ${n + 1}${typeof dia?.data === 'string' ? ` (${fmtData(dia.data)})` : ''}`;
    if (!objeto(dia)) { erro(`${onde}: precisa ser um objeto.`); continue; }
    const fora = Object.keys(dia).filter((k) => !CAMPOS_STORIES.includes(k));
    if (fora.length) avisos.push(`${onde}: campo(s) ignorado(s): ${fora.join(', ')}.`);
    if (vistos.has(dia.data)) { erro(`${onde}: a data ${dia.data} já apareceu no dia ${vistos.get(dia.data)}. Um dia tem um só.`); continue; }
    vistos.set(dia.data, n + 1);
    const entrada = Object.fromEntries(CAMPOS_STORIES.filter((k) => k in dia).map((k) => [k, structuredClone(dia[k])]));
    // peça do dia só liga se existe
    if (entrada.pecaDoDia != null && entrada.pecaDoDia !== '') {
      const r = typeof entrada.pecaDoDia === 'string' ? cru.reels.find((x) => x.id === entrada.pecaDoDia) : null;
      if (!r) {
        avisos.push(`${onde}: a peça ${String(entrada.pecaDoDia)} não existe no cronograma. O dia entra sem peça do dia.`);
        entrada.pecaDoDia = null;
      } else if (r.data !== dia.data) {
        avisos.push(`${onde}: a peça do dia ${r.id} está em ${r.data ? fmtData(r.data) : 'sem data'}. Ligada mesmo assim.`);
      }
    }
    try {
      const limpo = conferirStoriesDia(cru, entrada);
      regrasDuras(onde, limpo);
      prontos.push(limpo);
    } catch (e) {
      if (!e.status) throw e;
      erro(`${onde}: ${e.message}`);
    }
  }
  if (erros.length) sair(`${erros.length} problema(s) no JSON:\n  - ${erros.join('\n  - ')}`);
  prontos.sort((a, b) => a.data.localeCompare(b.data));

  // ---------- 1 e 2. plano no banco cru; na rodada de verdade, o mesmo plano no banco do boot ----------
  let plano = aplicar(cru.stories, prontos);
  const mudouAlgo = plano.cont.novo + plano.cont.atualizado > 0;

  // ---------- 3. grava ----------
  const primeiro = arquivoDados('db.antes-stories.json');
  if (mudouAlgo && !SIMULAR) {
    const db = await carregar();
    db.stories ??= [];
    plano = aplicar(db.stories, prontos);
    if (!existsSync(primeiro)) await writeFile(primeiro, original);
    await writeFile(arquivoDados('db.antes-stories.ultimo.json'), original);
    await salvar();
  }

  // ---------- 4. resumo ----------
  const { linhas, protegidos, cont, foraDoJson } = plano;
  const datas = prontos.map((d) => d.data);
  const porObjetivo = (o) => prontos.filter((d) => d.objetivo === o).length;
  console.log([
    `== Stories do dia ${SIMULAR ? '(simulação) ' : ''}==`,
    `Dias no JSON: ${prontos.length} (${fmtData(datas[0])} a ${fmtData(datas.at(-1))}) · ${porObjetivo('engajamento')} engajamento, ${porObjetivo('vendas')} vendas`,
    ...linhas,
    `Novos: ${cont.novo} · Atualizados: ${cont.atualizado} · Sem mudança: ${cont.igual} · Não sobrescritos: ${protegidos.length}`,
    ...(protegidos.length ? ['Não sobrescritos (alguém já trabalhou neles; o que precisar mudar, mude na tela):', ...protegidos] : []),
    ...(foraDoJson ? [`Dias no banco fora deste JSON: ${foraDoJson} (ficam como estão)`] : []),
    ...(avisos.length ? ['Avisos:', ...avisos.map((x) => `  - ${x}`)] : []),
    !mudouAlgo ? 'Nada mudou: este conteúdo já estava aplicado.'
      : SIMULAR ? 'Simulação: nada foi gravado. Rode sem --simular pra aplicar.'
        : `Pronto. Backup de antes da primeira rodada: ${primeiro}`,
  ].join('\n'));
}

// upsert pela data, no lugar. Dia com status diferente de "ideia" ou editado na tela não muda.
// atualizadoEm só em quem mudou de verdade
function aplicar(stories, prontos) {
  const quando = agora();
  const linhas = [];
  const protegidos = [];
  const cont = { novo: 0, atualizado: 0, igual: 0 };
  for (const dia of prontos) {
    const atual = stories.find((s) => s.data === dia.data);
    const resumo = `${fmtData(dia.data)} · ${OBJETIVO_CURTO[dia.objetivo]} · ${dia.quadros.length} ${dia.quadros.length === 1 ? 'quadro' : 'quadros'}${dia.pecaDoDia ? ` · peça do dia ${dia.pecaDoDia}` : ''}`;
    if (!atual) {
      stories.push({ id: novoId('sto'), ...structuredClone(dia), status: 'ideia', criadoEm: quando, criadoPor: AUTOR });
      cont.novo++;
      linhas.push(`  ${resumo} · novo`);
      continue;
    }
    const mudou = CAMPOS_STORIES.filter((k) => !igual(atual[k] ?? null, dia[k] ?? null));
    if (!mudou.length) {
      cont.igual++;
      linhas.push(`  ${resumo} · sem mudança`);
      continue;
    }
    const naTela = atual.atualizadoPor && atual.atualizadoPor !== AUTOR;
    if (atual.status !== 'ideia' || naTela) {
      const motivo = atual.status !== 'ideia' ? `status ${atual.status}` : `editado na tela por ${atual.atualizadoPor}`;
      protegidos.push(`  ${fmtData(dia.data)} (${motivo}). No JSON mudaria: ${mudou.join(', ')}`);
      linhas.push(`  ${resumo} · não sobrescrito (${motivo})`);
      continue;
    }
    Object.assign(atual, structuredClone(dia), { atualizadoEm: quando, atualizadoPor: AUTOR });
    cont.atualizado++;
    linhas.push(`  ${resumo} · atualizado: ${mudou.join(', ')}`);
  }
  const datas = new Set(prontos.map((d) => d.data));
  const foraDoJson = stories.filter((s) => !datas.has(s.data)).length;
  return { linhas, protegidos, cont, foraDoJson };
}

try {
  await main();
  process.exit(0);
} catch (e) {
  console.error(`\nErro: ${e.status ? e.message : e.stack}`);
  process.exit(1);
}
