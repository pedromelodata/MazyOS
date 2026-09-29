// Aplica a reescrita v2 do Banco de Ideias com a base contábil (_base-contabil/FATOS.md): as ideias
// LIVRES (fora de peça com data no cronograma), os reels SEM data, a campanha do pré-lançamento
// (db.campanhas e data/seed.json) e db.config (hoje sem mudança). Conteúdo em
// server/conteudo-ideias-v2.json. Rode com o servidor PARADO:
//   node server/aplicar-ideias-v2.mjs [caminho do JSON] [--simular]
// --simular confere tudo e mostra o que mudaria, sem gravar (o boot do banco ainda pode acertar o
// db.json, como no servidor: por isso também só roda com o servidor parado).
// CRONOGRAMA_DATA troca a pasta de dados e CRONOGRAMA_CONTEUDO a dos reel.md (teste numa cópia: os
// dois juntos). Rodar de novo com o mesmo JSON não muda nada.
//
// Nunca mexe em: ideia ligada a peça com data (ideia.reelId ou reel.ideiaId de um reel com data),
// reel com data, formatos, estilos, ideias.json, biblioteca.json, reel.md. Se uma ideia do JSON
// estiver ligada a uma peça com data na hora de aplicar, ela é pulada com aviso.
//
//  0. confere o JSON inteiro antes de abrir o banco: travessão, concorrente, grafia, preço morto,
//     preço que não é de fato USAR, promessas proibidas, id de fato no texto publicado
//  1. valida cada campo com o validar.mjs (limparIdeia, conferirReel, roteiroLimpo, conferirRefs) e
//     confere que a validação não cortou texto
//  2. backup só quando algo vai mudar: db.antes-ideias-v2.json e seed.antes-ideias-v2.json na
//     primeira vez; *.ultimo.json a cada rodada
//  3. atualizadoEm só em quem mudou (é ele que impede o boot de trocar a ideia pela versão de
//     ideias.json); ids, favorita, criadaEm e reelId ficam como estão
//  4. seed.json: troca só os valores da campanha, no lugar, sem reformatar o arquivo
import { readFile, writeFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, agora, conferirTema } from './db.mjs';
import { conferirReel, conferirRefs, limparIdeia, roteiroLimpo, MAX_LEGENDA } from './validar.mjs';

const AUTOR = 'Reescrita v2 com a base contábil';
const JSON_PADRAO = path.join(APP, 'server', 'conteudo-ideias-v2.json');
const ARGS = process.argv.slice(2);
const SIMULAR = ARGS.includes('--simular');
const ARQUIVO = path.resolve(ARGS.find((a) => !a.startsWith('--')) || JSON_PADRAO);
const PORTA = 4317;

// ---------- regras duras de texto (as mesmas do build do conteúdo) ----------
// travessão, meia-risca e parentes, montados por código pra nenhum aparecer no fonte
const TRACO = new RegExp(`[${String.fromCharCode(0x2012, 0x2013, 0x2014, 0x2015)}]`);
const CONCORRENTE = [/\b(contabilizei|agilize|contaj[aá]|facilite|contabilivre|marvee|conta ?azul|nubank)\b/i, 'concorrente citado por nome (P27)'];
const GRAFIA = [/\bLegaliz(?:ai|ei)\b(?![.\w])/, 'grafia da marca é "Legalizaí" (P28)'];
const PROMESSAS = [
  [/\blink (?:na|abaixo)\b/i, 'CTA de clique é "link da bio" (P32)'],
  [/incondicional|sem letra mi[uú]da/i, '"incondicional" ou "sem letra miúda" (P05)'],
  [/\bao vivo\b/i, '"ao vivo" é proibido em copy (P25)'],
  [/gr[aá]tis/i, '"grátis" (P10)'],
  [/qualquer cidade/i, 'MEI fora de BH está em conflito (F027)'],
  [/\bbaix(?:e|a) (?:agora|o app)\b|j[aá] dispon[ií]vel|app store|play store|google play/i, 'download ou loja que não existe (P11)'],
  [/\bgarantid[oa]s?\b|zero multa/i, 'promessa de resultado (P02, P03)'],
  [/economi[az]|pag(?:ar|ue) menos/i, 'economia de imposto (P04)'],
  [/imposto novo/i, 'reforma mal dita (P31)'],
  [/6\s?% fixo/i, '"6% fixo" (P14)'],
  [/(?:cnpj|empresa|abertura|abrir|abre|sai|pronto|bloquead)[^.]{0,25}\bna hora\b|\bem \d+ ?(?:h|horas?|dias?|minutos?)\b|cnpj pronto/i, 'prazo de abertura (P01)'],
  [/\bvagas?\b|\bs[óo] hoje\b/i, 'escassez inventada (P09)'],
  [/sem fidelidade|cancela quando quiser/i, 'fidelidade dita de cabeça (F023)'],
  [/simulador|simule/i, 'simulador de Fator R não é link da base (F009)'],
];
const MORTOS = [
  [/R\$\s*(?:19|79)(?![\d.,])/i, 'R$ 19 ou R$ 79 (F006)'],
  [/\b(?:19|79)\s+reais\b/i, '19 ou 79 reais (F006)'],
  [/\b(?:por|a)\s+(?:19|79)\b(?![\d/.,%])/i, 'preço 19 ou 79 (F006)'],
  [/49,90/, 'R$ 49,90 (morto, ADR L103)'],
  [/86,05|81,05/, 'valor da guia do MEI em conflito (F063)'],
  [/178,31/, 'conta nova com número novo (P13)'],
  [/168,48|268,51/, 'valor superado ou em conflito (F018, F140)'],
];
// todo "R$ X" precisa ser um valor que um fato USAR traz (FATOS.md)
const REAIS_OK = new Set([
  '29', '49', '99', '139', '148', '188', '281,08', '209', '50', '25', '7.910', '474,60', '474,59', '1.621', '1.518',
  '8.475,55', '932,31', '200', '500', '81 mil', '81.000', '6.750', '97.200', '97.200,00', '81.000,01', '97.200,01',
  '180 mil', '360 mil', '360.000', '30.000', '4,8 milhões', '5 mil', '300', '10 mil', '600', '9.400',
]);
const valoresEmReais = (t) => [...String(t).matchAll(/R\$\s?(\d{1,3}(?:\.\d{3})*(?:,\d+)?(?:\s(?:mil|milhões)\b)?)/gi)].map((m) => m[1].toLowerCase());
const ID_FATO = /\bF\d{3}\b|\bP\d{2}\b/;

const erros = [];
const avisos = [];
const erro = (msg) => erros.push(msg);
const sair = (msg) => {
  console.error(`\nNada foi gravado: ${msg}`);
  process.exit(1);
};
const objeto = (v) => v && typeof v === 'object' && !Array.isArray(v);
const semData = (o) => JSON.stringify({ ...o, atualizadoEm: undefined, atualizadoPor: undefined });

// completo = texto publicado (fala, tela, título, gancho, CTA, legenda). Os campos internos
// (descrição, notas, tema, objetivo) descrevem o que a peça NÃO diz, então só passam por
// travessão, concorrente, grafia e preço
function regrasDuras(onde, t, { completo = true, idsOk = false } = {}) {
  const s = String(t ?? '');
  if (TRACO.test(s)) erro(`${onde}: travessão ou meia-risca`);
  for (const [re, motivo] of [CONCORRENTE, GRAFIA, ...MORTOS, ...(completo ? PROMESSAS : [])]) {
    const m = s.match(re);
    if (m) erro(`${onde}: ${motivo} ("${m[0]}")`);
  }
  for (const v of valoresEmReais(s)) if (!REAIS_OK.has(v)) erro(`${onde}: R$ ${v} não é valor de fato USAR em FATOS.md`);
  if (!idsOk && ID_FATO.test(s)) erro(`${onde}: id de fato no texto publicado (P33)`);
}

function portaOcupada(porta) {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: porta });
    s.setTimeout(800);
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('timeout', () => { s.destroy(); ok(false); });
    s.once('error', () => ok(false));
  });
}

async function trocarArquivo(destino, texto) {
  const tmp = `${destino}.${process.pid}.tmp`;
  await writeFile(tmp, texto, 'utf8');
  for (let i = 0; ; i++) {
    try {
      return await rename(tmp, destino);
    } catch (e) {
      if (i >= 4 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) throw e;
      await new Promise((r) => setTimeout(r, 60 * (i + 1)));
    }
  }
}

// ---------- 0. o JSON ----------
const CAMPOS_IDEIA = ['titulo', 'descricao', 'tipo', 'tema', 'formatoId', 'publico', 'gancho', 'estiloGancho', 'roteiroBase', 'fontes', 'notas'];
const CAMPOS_REEL = ['ideia', 'tema', 'tipo', 'pilar', 'bloco', 'formatoTexto', 'roteiro', 'legenda', 'fontes', 'notas', 'gravacao'];
const CAMPOS_CAMPANHA = ['objetivo', 'origem'];
const PUBLICOS = ['MEI', 'ME', 'MEI + ME'];

function lerConteudo(bruto) {
  if (TRACO.test(bruto)) {
    const i = bruto.search(TRACO);
    sair(`o JSON tem travessão ou meia-risca perto de "${bruto.slice(Math.max(0, i - 40), i + 20).replace(/\s+/g, ' ')}".`);
  }
  let j;
  try {
    j = JSON.parse(bruto);
  } catch (e) {
    sair(`o JSON não abre: ${e.message}`);
  }
  if (!objeto(j) || !Array.isArray(j.ideias) || !Array.isArray(j.reels) || !Array.isArray(j.campanhas)) sair('o JSON precisa de "ideias", "reels" e "campanhas" (listas).');
  const vistos = new Set();
  for (const [n, i] of j.ideias.entries()) {
    const onde = `ideias[${n}]`;
    if (!objeto(i) || typeof i.id !== 'string' || !objeto(i.campos)) { erro(`${onde}: precisa de id e campos.`); continue; }
    if (vistos.has(i.id)) erro(`${onde}: a ideia ${i.id} aparece duas vezes.`);
    vistos.add(i.id);
    for (const k of Object.keys(i.campos)) if (!CAMPOS_IDEIA.includes(k)) erro(`${i.id}: o campo "${k}" não é gravado por este script.`);
    const c = i.campos;
    if (!String(c.roteiroBase?.narracao ?? '').trim()) erro(`${i.id}: ideia sem narração.`);
    if ('publico' in c && !PUBLICOS.includes(c.publico)) erro(`${i.id}: publico precisa ser ${PUBLICOS.join(', ')}.`);
    for (const k of ['titulo', 'gancho']) regrasDuras(`${i.id}.${k}`, c[k]);
    for (const [k, v] of Object.entries(c.roteiroBase ?? {})) regrasDuras(`${i.id}.roteiroBase.${k}`, v);
    for (const k of ['descricao', 'estiloGancho']) regrasDuras(`${i.id}.${k}`, c[k], { completo: false });
    regrasDuras(`${i.id}.notas`, c.notas, { completo: false, idsOk: true });
    if (!Array.isArray(c.fontes) || !c.fontes.length) erro(`${i.id}: sem fontes.`);
    else if (/\d/.test(JSON.stringify(c.roteiroBase)) && !c.fontes.some((f) => /\bF\d{3}\b/.test(f))) erro(`${i.id}: tem número e nenhuma fonte com id de fato.`);
  }
  const reelsVistos = new Set();
  for (const [n, r] of j.reels.entries()) {
    const onde = `reels[${n}]`;
    if (!objeto(r) || typeof r.id !== 'string' || !objeto(r.campos)) { erro(`${onde}: precisa de id e campos.`); continue; }
    if (reelsVistos.has(r.id)) erro(`${onde}: o reel ${r.id} aparece duas vezes.`);
    reelsVistos.add(r.id);
    for (const k of Object.keys(r.campos)) if (!CAMPOS_REEL.includes(k)) erro(`${r.id}: o campo "${k}" não é gravado por este script.`);
    const c = r.campos;
    for (const k of ['ideia', 'legenda']) regrasDuras(`${r.id}.${k}`, c[k]);
    for (const k of ['hook', 'textoTela', 'cta', 'desenvolvimento']) regrasDuras(`${r.id}.roteiro.${k}`, c.roteiro?.[k]);
    for (const [m, x] of (c.roteiro?.cenas ?? []).entries()) {
      regrasDuras(`${r.id}.cenas[${m}].fala`, x.fala);
      regrasDuras(`${r.id}.cenas[${m}].tela`, x.tela);
      regrasDuras(`${r.id}.cenas[${m}].cena`, x.cena, { completo: false });
    }
    for (const k of ['tema', 'formatoTexto']) regrasDuras(`${r.id}.${k}`, c[k], { completo: false });
    regrasDuras(`${r.id}.notas`, c.notas, { completo: false, idsOk: true });
    if (typeof c.legenda === 'string' && c.legenda.length > MAX_LEGENDA) erro(`${r.id}: legenda com ${c.legenda.length} caracteres (limite ${MAX_LEGENDA}).`);
  }
  for (const [n, cp] of j.campanhas.entries()) {
    if (!objeto(cp) || typeof cp.id !== 'string' || !objeto(cp.campos)) { erro(`campanhas[${n}]: precisa de id e campos.`); continue; }
    for (const k of Object.keys(cp.campos)) if (!CAMPOS_CAMPANHA.includes(k)) erro(`${cp.id}: o campo "${k}" da campanha não é gravado por este script.`);
    // o objetivo vai pro prompt do chat: pode citar os ids dos fatos
    for (const [k, v] of Object.entries(cp.campos)) regrasDuras(`${cp.id}.${k}`, v, { completo: false, idsOk: true });
  }
  for (const cp of j.seed?.campanhas ?? []) {
    if (!objeto(cp) || typeof cp.id !== 'string' || !objeto(cp.campos)) { erro('seed.campanhas: cada item precisa de id e campos.'); continue; }
    for (const k of Object.keys(cp.campos)) if (!CAMPOS_CAMPANHA.includes(k)) erro(`seed ${cp.id}: o campo "${k}" não é gravado por este script.`);
    for (const [k, v] of Object.entries(cp.campos)) regrasDuras(`seed ${cp.id}.${k}`, v, { completo: false, idsOk: true });
  }
  if (j.config?.mudar && Object.keys(j.config.mudar).length) erro('config.mudar: este script não muda db.config (o conteúdo dele não tem afirmação a corrigir).');
  return j;
}

// a validação não pode cortar nem trocar texto sem avisar
function igualOuErro(onde, entrou, saiu) {
  if (JSON.stringify(entrou) !== JSON.stringify(saiu)) erro(`${onde}: a validação mudou o texto (limite de tamanho?).`);
}
const aparado = (o) => (objeto(o) ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])) : o);

async function main() {
  const dadosReais = path.resolve(DATA_DIR) === path.join(APP, 'data');
  if (Boolean(process.env.CRONOGRAMA_DATA) !== Boolean(process.env.CRONOGRAMA_CONTEUDO)) {
    sair('teste numa cópia usa CRONOGRAMA_DATA e CRONOGRAMA_CONTEUDO juntos (um sem o outro mistura banco de teste com reel.md de verdade).');
  }
  // banco de verdade: nada abre com o servidor no ar (ele guarda o banco em memória e gravaria por cima)
  if (dadosReais) {
    for (const porta of new Set([Number(process.env.PORT) || PORTA, PORTA])) {
      if (await portaOcupada(porta)) sair(`tem um servidor respondendo na porta ${porta}. Pare o servidor da Gestão de Marketing e rode de novo.`);
    }
  }
  if (!existsSync(ARQUIVO)) sair(`o JSON ${ARQUIVO} não existe.`);
  if (!existsSync(DB_PATH)) sair(`o banco ${DB_PATH} não existe.`);
  const SEED = arquivoDados('seed.json');
  console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é gravado)\n' : ''}JSON: ${ARQUIVO}\nDados: ${DATA_DIR}${dadosReais ? ' (banco de verdade)' : ' (cópia)'}\n`);

  const conteudo = lerConteudo(await readFile(ARQUIVO, 'utf8'));
  if (erros.length) sair(`o JSON tem ${erros.length} problema(s):\n  - ${erros.join('\n  - ')}`);

  // ---------- backup: os arquivos como estavam antes desta rodada (lidos antes do boot) ----------
  const originalDb = await readFile(DB_PATH);
  const originalSeed = existsSync(SEED) ? await readFile(SEED, 'utf8') : null;

  const db = await carregar();
  const comData = new Set(db.reels.filter((r) => r.data).map((r) => r.id));
  const ligadas = new Set([
    ...db.ideias.filter((i) => i.reelId && comData.has(i.reelId)).map((i) => i.id),
    ...db.reels.filter((r) => r.data && r.ideiaId).map((r) => r.ideiaId),
  ]);
  // o que nunca pode mudar: foto das ideias ligadas e dos reels com data
  const intocados = new Map([
    ...db.ideias.filter((i) => ligadas.has(i.id)).map((i) => [`ideia ${i.id}`, JSON.stringify(i)]),
    ...db.reels.filter((r) => r.data).map((r) => [`reel ${r.id}`, JSON.stringify(r)]),
  ]);

  // ---------- 1. ideias ----------
  const planoIdeias = [];
  for (const item of conteudo.ideias) {
    const atual = db.ideias.find((x) => x.id === item.id);
    if (!atual) { avisos.push(`${item.id}: não existe mais no banco, pulada.`); continue; }
    if (ligadas.has(item.id)) { avisos.push(`${item.id}: agora está ligada a uma peça com data no cronograma, pulada (é do redator do cronograma).`); continue; }
    const c = structuredClone(item.campos);
    if ('tema' in c) {
      try { conferirTema(c.tema, atual.tema); } catch {
        avisos.push(`${item.id}: o tema "${c.tema}" não existe mais no guia; ficou o tema atual (${atual.tema ?? 'nenhum'}).`);
        delete c.tema;
      }
    }
    if (c.formatoId && !db.formatos.some((f) => f.id === c.formatoId)) {
      avisos.push(`${item.id}: o formato "${c.formatoId}" não existe mais na biblioteca; ficou o formato atual (${atual.formatoId ?? 'nenhum'}).`);
      delete c.formatoId;
    }
    try {
      for (const k of ['titulo', 'descricao', 'gancho']) if (typeof c[k] === 'string') c[k] = c[k].trim();
      if ('titulo' in c && (!c.titulo || c.titulo.length > 300)) throw new Error('titulo precisa ter de 1 a 300 caracteres.');
      const limpo = limparIdeia(c, atual);
      if ('roteiroBase' in c) igualOuErro(`${item.id} roteiroBase`, aparado(c.roteiroBase), limpo.roteiroBase);
      if ('fontes' in c) igualOuErro(`${item.id} fontes`, c.fontes.map((s) => s.trim()), limpo.fontes);
      if ('notas' in c) igualOuErro(`${item.id} notas`, c.notas.trim(), limpo.notas);
      if ('estiloGancho' in c) igualOuErro(`${item.id} estiloGancho`, c.estiloGancho.trim(), limpo.estiloGancho);
      conferirRefs(db, { formatoId: limpo.formatoId });
      const novo = { ...atual, ...limpo };
      planoIdeias.push({ item, atual, novo, mudou: semData(novo) !== semData(atual) });
    } catch (e) {
      erro(`${item.id}: ${e.message}`);
    }
  }
  const livresForaDoJson = db.ideias.filter((i) => !ligadas.has(i.id) && !conteudo.ideias.some((x) => x.id === i.id));

  // ---------- 2. reels sem data ----------
  const GRAVADA = ['gravado', 'editado', 'publicado'];
  const planoReels = [];
  for (const item of conteudo.reels) {
    const r = db.reels.find((x) => x.id === item.id);
    if (!r) { avisos.push(`${item.id}: o reel não existe mais, pulado.`); continue; }
    if (r.data) { avisos.push(`${item.id}: o reel ganhou data (${r.data}) e entrou no cronograma, pulado.`); continue; }
    const c = structuredClone(item.campos);
    if (GRAVADA.includes(r.status)) {
      for (const k of ['roteiro', 'legenda', 'gravacao']) if (k in c) { avisos.push(`${item.id}: já ${r.status}, "${k}" não foi mexido.`); delete c[k]; }
    }
    try {
      const saida = {};
      if ('roteiro' in c) {
        saida.roteiro = roteiroLimpo(c.roteiro);
        igualOuErro(`${item.id} roteiro`, { ...aparado(c.roteiro), cenas: c.roteiro.cenas.map(aparado) }, saida.roteiro);
        delete c.roteiro;
      }
      if ('legenda' in c) {
        if (typeof c.legenda !== 'string') throw new Error('legenda precisa ser texto.');
        saida.legenda = c.legenda.trim();
        delete c.legenda;
      }
      if (typeof c.notas === 'string' && c.notas.trim().length > 2000) throw new Error('notas passam de 2000 caracteres.');
      for (const k of ['ideia', 'tema']) if (k in c) { if (typeof c[k] !== 'string' || !c[k].trim()) throw new Error(`${k} precisa ser texto.`); saida[k] = c[k].trim(); delete c[k]; }
      const limpo = conferirReel(structuredClone(c), r);
      if ('fontes' in c) igualOuErro(`${item.id} fontes`, c.fontes.map((s) => s.trim()), limpo.fontes);
      if ('notas' in c) igualOuErro(`${item.id} notas`, c.notas.trim(), limpo.notas);
      Object.assign(saida, limpo);
      conferirRefs(db, saida);
      const novo = { ...r, ...saida };
      planoReels.push({ item, r, novo, mudou: semData(novo) !== semData(r) });
    } catch (e) {
      erro(`${item.id}: ${e.message}`);
    }
  }

  // ---------- 3. campanhas ----------
  const planoCampanhas = [];
  for (const item of conteudo.campanhas) {
    const cp = db.campanhas.find((x) => x.id === item.id);
    if (!cp) { erro(`${item.id}: a campanha não existe no banco.`); continue; }
    const novo = { ...cp };
    for (const [k, v] of Object.entries(item.campos)) {
      if (typeof v !== 'string' || !v.trim()) { erro(`${item.id}.${k}: precisa ser texto.`); continue; }
      novo[k] = v.trim();
    }
    planoCampanhas.push({ cp, novo, mudou: JSON.stringify(novo) !== JSON.stringify(cp) });
  }

  // ---------- 4. seed.json (troca no lugar, sem reformatar) ----------
  let seedNovo = null;
  const seedMudancas = [];
  if ((conteudo.seed?.campanhas ?? []).length) {
    if (originalSeed == null) erro('seed.json não existe na pasta de dados.');
    else {
      let texto = originalSeed;
      let seed;
      try { seed = JSON.parse(texto); } catch (e) { erro(`seed.json não abre: ${e.message}`); }
      for (const item of seed ? conteudo.seed.campanhas : []) {
        const cp = (seed.campanhas ?? []).find((x) => x.id === item.id);
        if (!cp) { erro(`seed.json: a campanha ${item.id} não existe.`); continue; }
        for (const [k, v] of Object.entries(item.campos)) {
          const novo = v.trim();
          if (cp[k] === novo) continue;
          const de = `"${k}": ${JSON.stringify(cp[k])}`;
          const vezes = texto.split(de).length - 1;
          if (vezes !== 1) { erro(`seed.json: "${k}" da campanha ${item.id} aparece ${vezes} vez(es) no arquivo; troca no lugar não é segura.`); continue; }
          texto = texto.replace(de, () => `"${k}": ${JSON.stringify(novo)}`);
          seedMudancas.push(`${item.id}.${k}`);
        }
      }
      if (seed && seedMudancas.length) {
        // confere que só mudou o que devia
        const esperado = structuredClone(seed);
        for (const item of conteudo.seed.campanhas) Object.assign(esperado.campanhas.find((x) => x.id === item.id), Object.fromEntries(Object.entries(item.campos).map(([k, v]) => [k, v.trim()])));
        let depois = null;
        try { depois = JSON.parse(texto); } catch (e) { erro(`seed.json ficaria quebrado: ${e.message}`); }
        if (depois && JSON.stringify(depois) !== JSON.stringify(esperado)) erro('seed.json: a troca mexeria em mais do que a campanha.');
        seedNovo = texto;
      }
    }
  }

  if (erros.length) sair(`${erros.length} problema(s) na validação:\n  - ${erros.join('\n  - ')}`);

  // ---------- aplica (em memória; só grava no fim) ----------
  const quando = agora();
  const ideiasMudadas = planoIdeias.filter((p) => p.mudou);
  const reelsMudados = planoReels.filter((p) => p.mudou);
  const campanhasMudadas = planoCampanhas.filter((p) => p.mudou);
  for (const p of ideiasMudadas) {
    const i = db.ideias.indexOf(p.atual);
    db.ideias[i] = { ...p.novo, id: p.atual.id, favorita: p.atual.favorita, criadaEm: p.atual.criadaEm, reelId: p.atual.reelId, atualizadoEm: quando, atualizadoPor: AUTOR };
  }
  for (const p of reelsMudados) {
    const i = db.reels.indexOf(p.r);
    db.reels[i] = { ...p.novo, id: p.r.id, data: p.r.data, criadoEm: p.r.criadoEm, atualizadoEm: quando, atualizadoPor: AUTOR };
  }
  for (const p of campanhasMudadas) Object.assign(p.cp, p.novo);

  // trava final: ideia ligada e reel com data saem idênticos
  for (const [k, foto] of intocados) {
    const [tipo, id] = k.split(' ');
    const agoraObj = tipo === 'ideia' ? db.ideias.find((x) => x.id === id) : db.reels.find((x) => x.id === id);
    if (JSON.stringify(agoraObj) !== foto) sair(`${k} mudou, e não podia (peça com data ou ideia ligada a ela).`);
  }

  const mudouDb = ideiasMudadas.length + reelsMudados.length + campanhasMudadas.length > 0;
  const mudouSeed = Boolean(seedNovo);

  if (!SIMULAR && (mudouDb || mudouSeed)) {
    const primeiroDb = arquivoDados('db.antes-ideias-v2.json');
    if (mudouDb) {
      if (!existsSync(primeiroDb)) await writeFile(primeiroDb, originalDb);
      await writeFile(arquivoDados('db.antes-ideias-v2.ultimo.json'), originalDb);
      await salvar();
    }
    if (mudouSeed) {
      const primeiroSeed = arquivoDados('seed.antes-ideias-v2.json');
      if (!existsSync(primeiroSeed)) await writeFile(primeiroSeed, originalSeed, 'utf8');
      await writeFile(arquivoDados('seed.antes-ideias-v2.ultimo.json'), originalSeed, 'utf8');
      await trocarArquivo(SEED, seedNovo);
    }
  }

  // ---------- resumo ----------
  const n = (lista, acao) => lista.filter((p) => p.item.acao === acao).length;
  const linhas = [
    `== Reescrita v2 das ideias livres ${SIMULAR ? '(simulação) ' : ''}==`,
    `Ideias no JSON: ${conteudo.ideias.length} · aplicáveis: ${planoIdeias.length} (${n(planoIdeias, 'reescrita')} reescritas, ${n(planoIdeias, 'substituida')} substituídas) · mudaram: ${ideiasMudadas.length}`,
    ...ideiasMudadas.map((p) => `  ${p.item.id} · ${p.item.acao} · ${p.novo.titulo}`),
    `Reels sem data: ${planoReels.length} · mudaram: ${reelsMudados.length}`,
    ...reelsMudados.map((p) => `  ${p.r.id} · ${p.novo.ideia}`),
    `Campanhas: ${planoCampanhas.length} · mudaram: ${campanhasMudadas.length}${campanhasMudadas.length ? ` (${campanhasMudadas.map((p) => p.cp.id).join(', ')})` : ''}`,
    `seed.json: ${mudouSeed ? `muda ${seedMudancas.join(', ')}` : 'sem mudança'}`,
    `db.config: sem mudança (${conteudo.config?.nota ?? 'sem afirmação de conteúdo'})`,
    `Intocados conferidos: ${[...intocados.keys()].filter((k) => k.startsWith('ideia')).length} ideias ligadas a peça com data e ${[...intocados.keys()].filter((k) => k.startsWith('reel')).length} reels com data`,
    ...(livresForaDoJson.length ? [`Ideias livres que não estão no JSON (ficam como estão): ${livresForaDoJson.map((i) => i.id).join(', ')}`] : []),
    ...(avisos.length ? ['Avisos:', ...avisos.map((x) => `  - ${x}`)] : []),
    !mudouDb && !mudouSeed ? 'Nada mudou: este conteúdo já estava aplicado.'
      : SIMULAR ? 'Simulação: nada foi gravado. Rode sem --simular pra aplicar.'
        : `Pronto. Backup de antes da primeira rodada: ${arquivoDados('db.antes-ideias-v2.json')}${mudouSeed ? ` e ${arquivoDados('seed.antes-ideias-v2.json')}` : ''}`,
  ];
  console.log(linhas.join('\n'));
}

try {
  await main();
  process.exit(0);
} catch (e) {
  console.error(`\nErro: ${e.status ? e.message : e.stack}`);
  process.exit(1);
}
