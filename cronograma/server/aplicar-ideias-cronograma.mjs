// Liga cada peça do cronograma (reel, carrossel, estático, stories) a uma ideia do Banco de Ideias: a ideia
// que produz aquela peça no dia, com roteiro base e narração. Também completa o planejamento (tema, pilar,
// bloco, peça, formato, rede, gatilho, impulsionar) e grava o conteúdo e as notas. Tudo vem de um JSON de
// conteúdo (padrão: server/conteudo-cronograma-v2.json, a reescrita de 28/09 com a base contábil; o
// conteudo-cronograma-2026-10.json é a versão anterior e fica só como histórico). Rode com o servidor PARADO:
//   node server/aplicar-ideias-cronograma.mjs [caminho do JSON] [--simular]
// --simular confere tudo e mostra o que mudaria, sem gravar nada.
// CRONOGRAMA_DATA troca a pasta de dados e CRONOGRAMA_CONTEUDO a dos reel.md (teste numa cópia: os dois juntos).
// Rodar de novo com o mesmo JSON não muda nada.
//
//  0. lê e confere o JSON inteiro antes de escrever: travessão, concorrente, preço morto ou em conflito na
//     base (_base-contabil/FATOS.md), preço promocional sem o cheio ou sem a validade, promessa proibida,
//     "link na bio", grafia da marca; cada peça existe e está na data do JSON; uma ideia por peça
//  1. backup do db.json de antes da rodada (só quando algo vai mudar): db.antes-ideias-cronograma.json na
//     primeira vez, db.antes-ideias-cronograma.ultimo.json a cada rodada
//  2. peças: campos validados pelo validar.mjs (conferirReel, roteiroLimpo, conferirRefs) e nota acrescentada
//  3. ideias: limparIdeia sobre a ideia do banco (ou ideiaPadrao, se nova); tipo da ideia = tipo da peça
//  4. ligação: item.ideiaId = ideia e ideia.reelId = item. A ideia que estava ligada à peça antes é solta
//     (repontarIdeia: volta livre pro banco se nenhuma outra peça aponta pra ela)
//  5. atualizadoEm só em quem mudou; salva uma vez; regrava o reel.md (regravarSeGerado) das peças que mudaram
//  6. resumo
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, repontarIdeia, agora, ROTULO_PECA } from './db.mjs';
import { conferirReel, conferirRefs, limparIdeia, ideiaPadrao, roteiroLimpo, MAX_LEGENDA } from './validar.mjs';
import { regravarSeGerado, CONTEUDO } from './reelmd.mjs';

const AUTOR = 'Ideias por peça do cronograma';
const JSON_PADRAO = path.join(APP, 'server', 'conteudo-cronograma-v2.json');
const ARGS = process.argv.slice(2);
const SIMULAR = ARGS.includes('--simular');
const ARQUIVO = path.resolve(ARGS.find((a) => !a.startsWith('--')) || JSON_PADRAO);

// travessão, meia-risca e parentes (regra dura de copy), montados por código pra nenhum aparecer no fonte
const TRACO = new RegExp(`[${String.fromCharCode(0x2012, 0x2013, 0x2014, 0x2015)}]`);
// o que não pode sair em texto público (fala, tela, legenda, slide, quadro, roteiro base da ideia)
const PROIBIDOS = [
  [/\b(contabilizei|agilize|contaj[aá]|facilite|contabilivre|marvee|conta ?azul|nubank)\b/i, 'concorrente citado por nome'],
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
function precoCasado(onde, bloco) {
  const t = textos(bloco).join('\n');
  if (PRECO(29).test(t) && !PRECO(49).test(t)) erro(`${onde}: R$ 29 sem o valor cheio (R$ 49) junto`);
  if (PRECO(99).test(t) && !PRECO(139).test(t)) erro(`${onde}: R$ 99 sem o valor cheio (R$ 139) junto`);
  if ((PRECO(29).test(t) || PRECO(99).test(t)) && !VALIDADE.test(t)) erro(`${onde}: preço promocional sem a validade 31/12/2026`);
}

// campos que o JSON pode gravar na peça e na ideia (o resto é do servidor ou de outro fluxo)
const CAMPOS_ITEM = [
  'tema', 'pilar', 'pilarTexto', 'bloco', 'peca', 'peca2', 'formatoTexto', 'rede', 'gatilho', 'impulsionar',
  'roteiro', 'legenda', 'gravacao', 'fontes', 'carrossel', 'estatico', 'stories', 'notas',
];
const CAMPOS_IDEIA = ['titulo', 'descricao', 'tipo', 'tema', 'formatoId', 'publico', 'gancho', 'estiloGancho', 'roteiroBase', 'fontes', 'notas'];
// conteúdo que não muda em peça já gravada (planejamento, ligação e peça alternativa mudam)
const TRAVADOS_DEPOIS_DE_GRAVAR = ['roteiro', 'legenda', 'gravacao'];
const GRAVADA = ['gravado', 'editado', 'publicado'];
const PUBLICOS = ['MEI', 'ME', 'MEI + ME'];
// limites em que a validação corta o texto sem avisar: aqui passar do limite é erro
const LIMITES = { rede: 200, gatilho: 1000, formatoTexto: 300, pilarTexto: 200, notas: 2000 };

const erros = [];
const avisos = [];
const erro = (msg) => erros.push(msg);
const sair = (msg) => {
  console.error(`\nNada foi gravado: ${msg}`);
  process.exit(1);
};
const fmtData = (d) => `${String(d).slice(8, 10)}/${String(d).slice(5, 7)}`;
const juntar = (...partes) => partes.map((x) => String(x ?? '').trim()).filter(Boolean).join(' ');
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const objeto = (v) => v && typeof v === 'object' && !Array.isArray(v);

function portaOcupada(porta) {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: porta });
    s.setTimeout(800);
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('timeout', () => { s.destroy(); ok(false); });
    s.once('error', () => ok(false));
  });
}

// todos os textos de um valor (string solta, lista ou objeto), pra passar pelas regras duras
function textos(v, fora = []) {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap((x) => textos(x, fora));
  if (objeto(v)) return Object.entries(v).filter(([k]) => !fora.includes(k)).flatMap(([, x]) => textos(x, fora));
  return [];
}
function regrasDuras(onde, lista) {
  for (const t of lista) {
    for (const [re, motivo] of PROIBIDOS) {
      const m = t.match(re);
      if (m) erro(`${onde}: ${motivo} ("${m[0]}" em "${t.slice(0, 90)}")`);
    }
  }
}

// o texto que a validação devolve tem que ser o mesmo que entrou (sem corte nem troca silenciosa)
function semCorte(onde, entrou, saiu) {
  const a = textos(entrou);
  const b = textos(saiu);
  const faltando = a.map((x) => x.trim()).filter((x) => x && !b.includes(x));
  if (faltando.length) erro(`${onde}: a validação cortou ou mudou o texto "${faltando[0].slice(0, 80)}" (limite de tamanho?)`);
}

// ---------- 0. lê e confere o JSON ----------
function lerConteudo(bruto) {
  if (TRACO.test(bruto)) {
    const i = bruto.search(TRACO);
    sair(`o JSON tem travessão ou meia-risca perto de "${bruto.slice(Math.max(0, i - 40), i + 20).replace(/\s+/g, ' ')}". Reescreva com ponto, vírgula ou "e".`);
  }
  let j;
  try {
    j = JSON.parse(bruto);
  } catch (e) {
    sair(`o JSON não abre: ${e.message}`);
  }
  if (!objeto(j) || !Array.isArray(j.itens) || !Array.isArray(j.ideias)) sair('o JSON precisa de "itens" e "ideias" (listas).');
  const idsItem = new Set();
  const idsIdeiaLigada = new Map();
  for (const [n, it] of j.itens.entries()) {
    const onde = `itens[${n}]`;
    if (!objeto(it) || typeof it.id !== 'string' || typeof it.data !== 'string' || typeof it.ideiaId !== 'string') {
      erro(`${onde}: precisa de id, data e ideiaId.`);
      continue;
    }
    if (idsItem.has(it.id)) erro(`${onde}: a peça ${it.id} aparece duas vezes.`);
    idsItem.add(it.id);
    if (idsIdeiaLigada.has(it.ideiaId)) erro(`${onde}: a ideia ${it.ideiaId} já é da peça ${idsIdeiaLigada.get(it.ideiaId)} (uma ideia por peça).`);
    idsIdeiaLigada.set(it.ideiaId, it.id);
    if (it.campos != null && !objeto(it.campos)) erro(`${onde}: campos precisa ser um objeto.`);
    for (const k of Object.keys(it.campos ?? {})) if (!CAMPOS_ITEM.includes(k)) erro(`${onde}: o campo "${k}" não é gravado por este script.`);
    if (it.notasAcrescentar != null && typeof it.notasAcrescentar !== 'string') erro(`${onde}: notasAcrescentar precisa ser texto.`);
    const c = it.campos ?? {};
    regrasDuras(`${it.id} (${fmtData(it.data)})`, [
      ...textos(c.roteiro), ...textos(c.legenda), ...textos(c.carrossel), ...textos(c.estatico), ...textos(c.stories),
    ]);
    for (const k of ['roteiro', 'legenda', 'carrossel', 'estatico', 'stories']) if (k in c) precoCasado(`${it.id} (${fmtData(it.data)}) ${k}`, c[k]);
    if (c.notas != null && typeof c.notas !== 'string') erro(`${onde}: notas precisa ser texto.`);
    if (typeof c.notas === 'string' && it.notasAcrescentar) erro(`${onde}: use notas (substitui) ou notasAcrescentar (acrescenta), não os dois.`);
  }
  const idsIdeia = new Set();
  for (const [n, i] of j.ideias.entries()) {
    const onde = `ideias[${n}]`;
    if (!objeto(i) || typeof i.id !== 'string' || !objeto(i.campos)) {
      erro(`${onde}: precisa de id e campos.`);
      continue;
    }
    if (idsIdeia.has(i.id)) erro(`${onde}: a ideia ${i.id} aparece duas vezes.`);
    idsIdeia.add(i.id);
    for (const k of Object.keys(i.campos)) if (!CAMPOS_IDEIA.includes(k)) erro(`${onde}: o campo "${k}" não é gravado por este script.`);
    regrasDuras(i.id, [...textos(i.campos.titulo), ...textos(i.campos.gancho), ...textos(i.campos.descricao), ...textos(i.campos.roteiroBase)]);
    precoCasado(i.id, [i.campos.titulo, i.campos.gancho, i.campos.descricao, i.campos.roteiroBase]);
  }
  return j;
}

// ---------- 2. campos da peça ----------
function camposDoItem(db, it, r) {
  const onde = `${it.id} (${fmtData(it.data)})`;
  const c = structuredClone(it.campos ?? {});
  if (GRAVADA.includes(r.status)) {
    for (const k of TRAVADOS_DEPOIS_DE_GRAVAR) {
      if (k in c) {
        avisos.push(`${onde}: peça já ${r.status}, "${k}" não foi mexido.`);
        delete c[k];
      }
    }
  }
  const saida = {};
  try {
    if ('roteiro' in c) {
      saida.roteiro = roteiroLimpo(c.roteiro);
      semCorte(`${onde} roteiro`, c.roteiro, saida.roteiro);
      delete c.roteiro;
    }
    if ('legenda' in c) {
      if (typeof c.legenda !== 'string') throw new Error('legenda precisa ser texto.');
      saida.legenda = c.legenda.trim();
      if (saida.legenda.length > MAX_LEGENDA) throw new Error(`legenda tem ${saida.legenda.length} caracteres; o limite do Instagram é ${MAX_LEGENDA}.`);
      delete c.legenda;
    }
    for (const [k, lim] of Object.entries(LIMITES)) {
      if (typeof c[k] === 'string' && c[k].trim().length > lim) throw new Error(`${k} passa de ${lim} caracteres.`);
    }
    const limpo = conferirReel(structuredClone(c), r);
    for (const k of ['carrossel', 'estatico', 'stories', 'fontes']) if (k in c) semCorte(`${onde} ${k}`, c[k], limpo[k]);
    if ('gravacao' in c) semCorte(`${onde} gravacao`, c.gravacao, limpo.gravacao);
    Object.assign(saida, limpo);
    conferirRefs(db, saida);
  } catch (e) {
    erro(`${onde}: ${e.message}`);
    return null;
  }
  if (it.notasAcrescentar?.trim()) {
    const atual = r.notas ?? '';
    const nota = it.notasAcrescentar.trim();
    const notas = atual.includes(nota) ? atual : juntar(atual, nota);
    if (notas.length > LIMITES.notas) erro(`${onde}: as notas passariam de ${LIMITES.notas} caracteres com a nota nova.`);
    else if (notas !== atual) saida.notas = notas;
  }
  return saida;
}

// ---------- 3. campos da ideia ----------
function camposDaIdeia(db, i, atual) {
  const c = structuredClone(i.campos);
  try {
    if ('titulo' in c && (typeof c.titulo !== 'string' || !c.titulo.trim() || c.titulo.length > 300)) throw new Error('titulo precisa ser texto de 1 a 300 caracteres.');
    for (const k of ['descricao', 'gancho']) if (k in c && typeof c[k] !== 'string') throw new Error(`${k} precisa ser texto.`);
    if ('publico' in c && !PUBLICOS.includes(c.publico)) throw new Error(`publico precisa ser ${PUBLICOS.join(', ')}.`);
    if (c.notas != null && String(c.notas).length > LIMITES.notas) throw new Error(`notas passa de ${LIMITES.notas} caracteres.`);
    if (c.estiloGancho != null && String(c.estiloGancho).length > 600) throw new Error('estiloGancho passa de 600 caracteres.');
    if (objeto(c.roteiroBase)) {
      for (const [k, v] of Object.entries(c.roteiroBase)) {
        const lim = k === 'narracao' ? 4000 : 600;
        if (typeof v === 'string' && v.trim().length > lim) throw new Error(`roteiroBase.${k} passa de ${lim} caracteres.`);
      }
    }
    for (const k of ['titulo', 'descricao', 'gancho']) if (typeof c[k] === 'string') c[k] = c[k].trim();
    const limpo = limparIdeia(c, atual);
    if ('fontes' in c) semCorte(`${i.id} fontes`, c.fontes, limpo.fontes);
    if ('formatoId' in limpo && limpo.formatoId === '') limpo.formatoId = null;
    conferirRefs(db, { formatoId: limpo.formatoId });
    return limpo;
  } catch (e) {
    erro(`${i.id}: ${e.message}`);
    return null;
  }
}

// a narração da ideia cobre as falas do roteiro atual da peça? (o roteiro pode ter mudado depois do JSON)
function conferirNarracao(r, ideia) {
  if (![r.peca || 'reel', r.peca2].includes('reel') || !r.roteiro?.cenas?.length) return;
  const narr = ideia.roteiroBase?.narracao ?? '';
  const falas = r.roteiro.cenas.slice(1, -1).map((c) => (c.fala ?? '').trim()).filter(Boolean);
  const fora = falas.filter((f) => !narr.includes(f));
  const semFalante = (s) => String(s ?? '').replace(/^[A-ZÀ-Ú]{3,}:\s*/, '').trim();
  if (fora.length) avisos.push(`${fmtData(r.data)}: a narração de ${ideia.id} não traz a fala "${fora[0].slice(0, 70)}" do roteiro atual. O roteiro mudou depois do JSON?`);
  if (semFalante(ideia.roteiroBase?.hook) !== semFalante(r.roteiro.hook)) avisos.push(`${fmtData(r.data)}: o hook de ${ideia.id} é diferente do hook do roteiro atual.`);
  if (semFalante(ideia.roteiroBase?.cta) !== semFalante(r.roteiro.cta)) avisos.push(`${fmtData(r.data)}: o CTA de ${ideia.id} é diferente do CTA do roteiro atual.`);
}

async function main() {
  const dadosReais = path.resolve(DATA_DIR) === path.join(APP, 'data');
  if (Boolean(process.env.CRONOGRAMA_DATA) !== Boolean(process.env.CRONOGRAMA_CONTEUDO)) {
    sair('teste numa cópia usa CRONOGRAMA_DATA e CRONOGRAMA_CONTEUDO juntos (um sem o outro mistura banco de teste com reel.md de verdade).');
  }
  if (dadosReais) {
    for (const porta of new Set([Number(process.env.PORT) || 4317, 4317])) {
      if (await portaOcupada(porta)) sair(`tem um servidor no ar na porta ${porta}. Pare o servidor da Gestão de Marketing antes e rode de novo.`);
    }
  }
  if (!existsSync(ARQUIVO)) sair(`o JSON ${ARQUIVO} não existe.`);
  if (!existsSync(DB_PATH)) sair(`o banco ${DB_PATH} não existe.`);
  console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é gravado)\n' : ''}JSON: ${ARQUIVO}\nDados: ${DATA_DIR}\nreel.md: ${CONTEUDO}\n`);

  const conteudo = lerConteudo(await readFile(ARQUIVO, 'utf8'));
  if (erros.length) sair(`o JSON tem ${erros.length} problema(s):\n  - ${erros.join('\n  - ')}`);

  // ---------- 1. backup: o banco como estava antes desta rodada (lido antes do boot, que pode migrar) ----------
  const primeiro = arquivoDados('db.antes-ideias-cronograma.json');
  const original = await readFile(DB_PATH);
  const guardarBackup = async () => {
    if (!existsSync(primeiro)) await writeFile(primeiro, original);
    await writeFile(arquivoDados('db.antes-ideias-cronograma.ultimo.json'), original);
  };

  const db = await carregar();
  const fotoReel = new Map(db.reels.map((r) => [r.id, JSON.stringify(r)]));
  const fotoIdeia = new Map(db.ideias.map((i) => [i.id, JSON.stringify(i)]));

  // peças do JSON: existem, na data certa, e a ideia de cada uma não é de outra peça fora do JSON
  const pecas = [];
  for (const it of conteudo.itens) {
    const r = db.reels.find((x) => x.id === it.id);
    if (!r) { erro(`${it.id}: essa peça não existe no cronograma.`); continue; }
    if (r.data !== it.data) { erro(`${it.id}: a peça está em ${r.data || 'sem data'}, e o JSON diz ${it.data}.`); continue; }
    const dono = db.reels.find((x) => x.id !== it.id && x.ideiaId === it.ideiaId && !conteudo.itens.some((y) => y.id === x.id));
    if (dono) erro(`${it.id}: a ideia ${it.ideiaId} já é da peça ${dono.id} (${dono.data || 'sem data'}), que fica fora deste JSON.`);
    const naLista = conteudo.ideias.some((i) => i.id === it.ideiaId);
    if (!naLista && !db.ideias.some((i) => i.id === it.ideiaId)) erro(`${it.id}: a ideia ${it.ideiaId} não existe no banco nem no JSON.`);
    pecas.push({ it, r });
  }

  // ---------- 3. ideias (validadas antes de mexer em qualquer coisa) ----------
  const ideiasProntas = [];
  for (const i of conteudo.ideias) {
    const atual = db.ideias.find((x) => x.id === i.id) ?? null;
    if (!atual && !i.nova) { erro(`${i.id}: essa ideia não existe no banco (se é nova, marque "nova": true).`); continue; }
    const limpo = camposDaIdeia(db, i, atual);
    if (limpo) ideiasProntas.push({ i, atual, limpo });
  }

  // ---------- 2. peças ----------
  const pecasProntas = [];
  for (const p of pecas) {
    const campos = camposDoItem(db, p.it, p.r);
    if (campos) pecasProntas.push({ ...p, campos });
  }

  // tipo da ideia = tipo da peça; peça de novo com a ideia pronta
  for (const { it, r } of pecasProntas) {
    const pronta = ideiasProntas.find((x) => x.i.id === it.ideiaId);
    const tipo = pronta ? (pronta.limpo.tipo ?? pronta.atual?.tipo ?? null) : db.ideias.find((x) => x.id === it.ideiaId)?.tipo;
    if (tipo !== r.tipo) erro(`${it.id} (${fmtData(r.data)}): a ideia ${it.ideiaId} é do tipo "${tipo}" e a peça é "${r.tipo}".`);
    const titulo = pronta ? (pronta.limpo.titulo ?? pronta.atual?.titulo) : db.ideias.find((x) => x.id === it.ideiaId)?.titulo;
    if (!String(titulo ?? '').trim()) erro(`${it.ideiaId}: ideia sem título.`);
  }
  if (erros.length) sair(`${erros.length} problema(s) na validação:\n  - ${erros.join('\n  - ')}`);

  // ---------- aplica (em memória; só grava no fim) ----------
  const novas = [];
  for (const { i, atual, limpo } of ideiasProntas) {
    if (atual) Object.assign(atual, limpo);
    else {
      const nova = { id: i.id, ...ideiaPadrao(), ...limpo, origem: 'manual', referencia: null, reelId: null, criadaEm: agora(), criadaPor: AUTOR };
      db.ideias.push(nova);
      novas.push(nova.id);
    }
  }
  const soltas = [];
  for (const { it, r, campos } of pecasProntas) {
    Object.assign(r, campos);
    const antes = r.ideiaId ?? null;
    r.ideiaId = it.ideiaId;
    conferirRefs(db, { ideiaId: r.ideiaId });
    // a ideia que era desta peça (pelo item ou pelo reelId dela) volta livre, se ninguém mais aponta pra ela
    const deAntes = new Set([antes, ...db.ideias.filter((x) => x.reelId === r.id).map((x) => x.id)].filter((x) => x && x !== it.ideiaId));
    for (const id of deAntes) {
      repontarIdeia(db, id, r.id);
      soltas.push({ id, de: r });
    }
    db.ideias.find((x) => x.id === it.ideiaId).reelId = r.id;
  }

  // atualizadoEm só em quem mudou de verdade
  const quando = agora();
  const reelsMudados = db.reels.filter((r) => fotoReel.get(r.id) !== JSON.stringify(r));
  const ideiasMudadas = db.ideias.filter((i) => fotoIdeia.has(i.id) && fotoIdeia.get(i.id) !== JSON.stringify(i));
  const camposMudados = new Map(reelsMudados.map((r) => {
    const velho = JSON.parse(fotoReel.get(r.id));
    return [r.id, Object.keys(r).filter((k) => !igual(velho[k], r[k]))];
  }));
  for (const r of reelsMudados) Object.assign(r, { atualizadoEm: quando, atualizadoPor: AUTOR });
  for (const i of ideiasMudadas) Object.assign(i, { atualizadoEm: quando, atualizadoPor: AUTOR });
  const mudou = reelsMudados.length || ideiasMudadas.length || novas.length;

  for (const { r } of pecasProntas) conferirNarracao(r, db.ideias.find((x) => x.id === r.ideiaId));

  // ---------- 5. grava ----------
  const arquivos = [];
  const semMd = [];
  if (mudou && !SIMULAR) {
    await guardarBackup();
    await salvar();
    const ideiaMudou = new Set([...ideiasMudadas.map((i) => i.id), ...novas]);
    for (const { r } of pecasProntas) {
      if (!camposMudados.has(r.id) && !ideiaMudou.has(r.ideiaId)) continue;
      try {
        const pasta = await regravarSeGerado(r);
        if (pasta) arquivos.push(`${fmtData(r.data)} ${r.origem}`);
        else semMd.push(fmtData(r.data));
      } catch (e) {
        avisos.push(`reel.md de ${fmtData(r.data)} (${r.id}): ${e.message}`);
      }
    }
  }

  // ---------- 6. resumo ----------
  const rotulo = (r) => [r.peca || 'reel', r.peca2].filter((t) => ROTULO_PECA[t]).map((t) => ROTULO_PECA[t]).join(' / ');
  const situacaoIdeia = (id) => (novas.includes(id) ? 'nova' : ideiasMudadas.some((x) => x.id === id) ? 'atualizada' : 'sem mudança');
  const linhas = [
    `== Ideias por peça do cronograma ${SIMULAR ? '(simulação) ' : ''}==`,
    `Peças no JSON: ${pecasProntas.length}, todas ligadas a uma ideia do banco`,
    ...pecasProntas
      .sort((a, b) => a.r.data.localeCompare(b.r.data))
      .map(({ r }) => {
        const ks = (camposMudados.get(r.id) ?? []).filter((k) => !['atualizadoEm', 'atualizadoPor'].includes(k));
        return `  ${fmtData(r.data)} · ${rotulo(r)} · ${r.ideiaId} (${situacaoIdeia(r.ideiaId)})${ks.length ? ` · mudou: ${ks.join(', ')}` : ' · peça sem mudança'}`;
      }),
    `Ideias: ${novas.length} nova(s), ${ideiasMudadas.length} atualizada(s), ${conteudo.ideias.length - novas.length - ideiasMudadas.length} sem mudança`,
    ...(soltas.length ? ['Ideias soltas das peças (voltam livres pro banco se nenhuma outra peça aponta pra elas):', ...soltas.map((s) => `  - ${s.id} (era de ${fmtData(s.de.data)}), agora reelId = ${db.ideias.find((x) => x.id === s.id)?.reelId ?? 'nenhum'}`)] : []),
    ...(SIMULAR ? [] : [
      ...(arquivos.length ? ['reel.md regravado:', ...arquivos.map((x) => `  - ${x}`)] : ['reel.md: nada a regravar']),
      ...(semMd.length ? [`Sem reel.md gerado pelo app (não regravado): ${semMd.join(', ')}`] : []),
    ]),
    ...(avisos.length ? ['Avisos:', ...avisos.map((x) => `  - ${x}`)] : []),
    !mudou ? 'Nada mudou: este conteúdo já estava aplicado.'
      : SIMULAR ? 'Simulação: nada foi gravado. Rode sem --simular pra aplicar.'
        : `Pronto. Backup de antes da primeira rodada: ${primeiro}`,
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
