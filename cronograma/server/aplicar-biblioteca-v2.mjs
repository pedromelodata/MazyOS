// Troca a Biblioteca de Reels e o Guia de estilos pela versão 2 (28/09/2026): a "Nossa versão pro Legalizaí"
// dos 28 formatos reescrita contra _base-contabil/FATOS.md, e o estilos.json com os temas presos a fatos.
// Rode com o servidor PARADO:
//   node server/aplicar-biblioteca-v2.mjs [--simular]
// --simular confere tudo e mostra o que mudaria, sem gravar nada.
// CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia). Rodar de novo não muda nada.
//
// Onde a mudança mora (conferido no código):
//  - data/biblioteca.json é mesclado no db.json a cada boot (migrar.mjs, mesclar): formato que ninguém editou
//    no app (sem atualizadoEm) passa a ser a versão do arquivo; o editado fica como está. Por isso a troca do
//    arquivo basta pros formatos não editados, e este script grava no db.json SÓ os campos da adaptação dos
//    formatos editados, mantendo referência, evidências, cases e datas
//  - data/estilos.json é lido no boot (lerGuia) e dele sai formato.tipos (formatoTipos) quando falta
//  - cases ficam em db.cases e a validação sai das evidências do formato: nada disso é tocado
//
//  0. porta: se tem servidor respondendo, para. Na pasta de dados de verdade confere sempre a 4317
//  1. lê e confere data/biblioteca.v2.json e data/estilos.v2.json: forma igual à do arquivo vivo, referência
//     e evidências intactas, id de fato USAR em FATOS.md em cada fonte, travessão, barrinha, concorrente,
//     preço morto, "link na bio", grafia, id de fato fora das fontes, tema de ideia que deixaria de existir
//  2. backup (só quando algo vai mudar): <arquivo>.antes-v2.json na primeira vez, .antes-v2.ultimo.json a cada rodada
//  3. troca os dois arquivos (tmp + rename) e, se houver formato editado, grava os campos dele no db.json
//  4. confere: simula o merge do boot com as funções do próprio app e compara os 28 formatos
import { readFile, writeFile, rename, copyFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { APP, DATA_DIR, DB_PATH, arquivoDados, definirGuia, statusFormato, TIPOS_REEL, ESTILOS, TEMA_LEGADO } from './db.mjs';
import { mesclar, normFormato } from './migrar.mjs';

const SIMULAR = process.argv.includes('--simular');
const DADOS_PADRAO = path.join(APP, 'data');
const FATOS_MD = path.join(APP, '..', '_base-contabil', 'FATOS.md');
const ARQ = {
  bib: { vivo: 'biblioteca.json', novo: 'biblioteca.v2.json' },
  est: { vivo: 'estilos.json', novo: 'estilos.v2.json' },
};
// o que é "Nossa versão pro Legalizaí" (o resto do formato é referência e dado, e não muda)
const ADAPTACAO = ['nome', 'formula', 'descricao', 'publico', 'duracao', 'estrutura', 'exemplo', 'fontes'];
const INTOCADOS = ['id', 'codigo', 'categoria', 'referencia', 'origem', 'evidencias'];
const PUBLICOS = ['MEI', 'ME', 'MEI + ME'];
const CATEGORIAS_BANCO = [
  'Abertura com Gancho Direto', 'Storytelling em Vídeo', 'Curiosidades e Fatos', 'Polêmicas e Opiniões', 'Motivação Curta',
  'Educativo Rápido', 'Provas e Resultados', 'Perguntas Que Prendem', 'Gatilhos de Identificação',
];

// travessão, meia-risca e parentes, montados por código pra nenhum aparecer no fonte
const TRACO = new RegExp(`[${String.fromCharCode(0x2012, 0x2013, 0x2014, 0x2015, 0x2212)}]`);
const BARRINHA = /(^|\s)-(\s|$)/; // hífen solto (lista ou régua), lê como travessão
const PROIBIDOS = [
  [/\b(contabilizei|agilize|contaj[aá]|facilite|contabilivre|marvee|conta ?azul|nubank)\b/i, 'concorrente citado por nome'],
  [/R\$\s*(?:19|79)(?![\d.,])|49,90|86,05|81,05/, 'preço ou valor morto (F006, F063)'],
  [/\blink (?:na|abaixo)\b/i, 'CTA de clique é "link da bio"'],
  [/\bLegaliz(?:ai|ei)\b(?![.\w])/, 'grafia da marca é "Legalizaí"'],
  [/\bao vivo\b/i, '"ao vivo" é proibido em copy (P25)'],
];
const PROMESSAS = [[/incondicional|sem letra mi[uú]da|baix[ae] o app|j[aá] dispon[ií]vel|em (?:24|48|72) ?h/i, 'promessa proibida (P01, P05, P11)']];
const ID_FATO = /\bF\d{3}\b/;

const erros = [];
const avisos = [];
const erro = (m) => erros.push(m);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const objeto = (v) => v && typeof v === 'object' && !Array.isArray(v);
const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const sair = (m) => { console.error(`\nNada foi gravado: ${m}`); process.exit(1); };

function portaOcupada(porta) {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: porta });
    s.setTimeout(800);
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('timeout', () => { s.destroy(); ok(false); });
    s.once('error', () => ok(false));
  });
}

function textos(v) {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(textos);
  if (objeto(v)) return Object.values(v).flatMap(textos);
  return [];
}
function regras(onde, valor, { promessas = true, semId = true } = {}) {
  for (const t of textos(valor)) {
    if (TRACO.test(t)) erro(`${onde}: travessão ou meia-risca em "${t.slice(0, 80)}"`);
    if (BARRINHA.test(t)) erro(`${onde}: hífen solto (barrinha) em "${t.slice(0, 80)}"`);
    for (const [re, motivo] of [...PROIBIDOS, ...(promessas ? PROMESSAS : [])]) {
      const m = t.match(re);
      if (m) erro(`${onde}: ${motivo} ("${m[0]}" em "${t.slice(0, 80)}")`);
    }
    if (semId && ID_FATO.test(t)) erro(`${onde}: id de fato fora das fontes em "${t.slice(0, 80)}" (P33)`);
  }
}

// ---------- FATOS.md ----------
async function lerFatos() {
  if (!existsSync(FATOS_MD)) sair(`não achei ${FATOS_MD}.`);
  const fatos = new Map();
  for (const l of (await readFile(FATOS_MD, 'utf8')).split(/\r?\n/)) {
    const m = /^\*\*(F\d{3}) · (.+?)\*\* · (USAR|NÃO USAR|CONFLITO)/.exec(l);
    if (m) fatos.set(m[1], m[3]);
  }
  if (fatos.size < 100) sair(`FATOS.md parece incompleto (${fatos.size} fatos lidos).`);
  return fatos;
}
function fonteComFato(onde, s, fatos) {
  const ids = String(s).split(' · ')[0].match(/\bF\d{3}\b/g) ?? [];
  if (!ids.length || !/^F\d{3}/.test(String(s))) return erro(`${onde}: a fonte precisa começar pelo id do fato ("F0xx · arquivo §seção"): "${String(s).slice(0, 60)}"`);
  for (const id of String(s).match(/\bF\d{3}\b/g)) {
    const st = fatos.get(id);
    if (!st) erro(`${onde}: ${id} não existe em FATOS.md`);
    else if (st !== 'USAR') erro(`${onde}: ${id} é ${st} em FATOS.md`);
  }
}

// ---------- arquivos ----------
async function lerArquivo(nome, obrigatorio = true) {
  const p = arquivoDados(nome);
  if (!existsSync(p)) {
    if (obrigatorio) sair(`${p} não existe.`);
    return null;
  }
  const texto = await readFile(p, 'utf8');
  let json;
  try { json = JSON.parse(texto); } catch (e) { sair(`${p} não abre: ${e.message}`); }
  return { texto, json };
}

// o mesmo guia que migrar.mjs (lerGuia) monta do estilos.json
function guiaDe(bruto) {
  const estilos = {};
  for (const k of ESTILOS) if (bruto.estilos?.[k] && typeof bruto.estilos[k] === 'object') estilos[k] = bruto.estilos[k];
  return {
    estilos,
    temas: Array.isArray(bruto.temas) ? bruto.temas.filter((t) => t && typeof t.id === 'string' && t.id) : [],
    formatoTipos: Array.isArray(bruto.formatoTipos) ? bruto.formatoTipos.filter((x) => x && typeof x.formatoId === 'string' && Array.isArray(x.tipos)) : [],
    rotulosTema: objeto(bruto.rotulosTema) ? bruto.rotulosTema : {},
  };
}

// ---------- 1. conferência ----------
function conferirBiblioteca(vivo, novo, jaAplicado, fatos) {
  if (!Array.isArray(novo) || novo.length !== 28) return erro(`${ARQ.bib.novo}: esperava uma lista com os 28 formatos.`);
  if (!Array.isArray(vivo)) return erro(`${ARQ.bib.vivo}: não é uma lista.`);
  if (!igual(vivo.map((f) => f.id), novo.map((f) => f.id))) erro(`${ARQ.bib.novo}: os ids ou a ordem não batem com ${ARQ.bib.vivo}.`);
  for (const [i, f] of novo.entries()) {
    const v = vivo.find((x) => x.id === f.id);
    const onde = `formato ${f.codigo ?? i}`;
    if (!v) continue;
    if (!igual(Object.keys(v), Object.keys(f))) erro(`${onde}: os campos mudaram (${Object.keys(f).join(', ')}).`);
    // no arquivo vivo ainda antigo, tudo que não é adaptação tem que ser idêntico
    if (!jaAplicado) for (const k of INTOCADOS) if (!igual(v[k], f[k])) erro(`${onde}: "${k}" mudou, e ele não é da adaptação.`);
    for (const k of ['nome', 'formula', 'descricao', 'duracao']) if (typeof f[k] !== 'string' || !f[k].trim()) erro(`${onde}: "${k}" vazio.`);
    if (!PUBLICOS.includes(f.publico)) erro(`${onde}: público "${f.publico}" fora de ${PUBLICOS.join(', ')}.`);
    if (!/^\d+-\d+s$/.test(f.duracao ?? '')) erro(`${onde}: duração "${f.duracao}" fora do molde "20-30s".`);
    if (!Array.isArray(f.estrutura) || f.estrutura.length < 4) erro(`${onde}: estrutura com menos de 4 blocos.`);
    for (const b of f.estrutura ?? []) {
      if (!/\(\d+-\d+s\)/.test(b) && !/^CTA só na legenda/.test(b)) erro(`${onde}: bloco sem tempo "(0-3s)": "${String(b).slice(0, 60)}"`);
    }
    const ex = f.exemplo ?? {};
    if (!igual(Object.keys(ex), ['titulo', 'gancho', 'tela', 'destaque'])) erro(`${onde}: exemplo precisa de titulo, gancho, tela e destaque.`);
    if (ex.destaque && !String(ex.tela ?? '').includes(ex.destaque)) erro(`${onde}: o destaque "${ex.destaque}" não está na tela "${ex.tela}".`);
    if (!Array.isArray(f.fontes) || !f.fontes.length) erro(`${onde}: sem fontes (todo formato cita os fatos que usa).`);
    for (const s of f.fontes ?? []) fonteComFato(`${onde} fontes`, s, fatos);
    regras(onde, ADAPTACAO.filter((k) => k !== 'fontes').map((k) => f[k]));
    regras(`${onde} fontes`, f.fontes, { semId: false });
  }
}

function conferirEstilos(vivo, novo, bib, db, fatos) {
  if (!objeto(novo)) return erro(`${ARQ.est.novo}: não é um objeto.`);
  if (!igual(Object.keys(vivo).sort(), Object.keys(novo).sort())) erro(`${ARQ.est.novo}: as chaves do topo mudaram (${Object.keys(novo).join(', ')}).`);
  regras('_leia', novo._leia, { promessas: false, semId: false });
  const idsBib = new Set(bib.map((f) => f.id));
  const tiposDe = new Map((novo.formatoTipos ?? []).map((x) => [x.formatoId, x.tipos]));
  for (const k of ESTILOS) {
    const e = novo.estilos?.[k];
    const ev = vivo.estilos?.[k];
    if (!objeto(e)) { erro(`estilo ${k}: faltando.`); continue; }
    if (ev && !igual(Object.keys(ev), Object.keys(e))) erro(`estilo ${k}: os campos mudaram.`);
    for (const c of ['gatilhos', 'familiasDeGancho', 'ganchosModelo', 'estrutura', 'ctas', 'formatosRecomendados', 'evitar']) {
      if (!Array.isArray(e[c]) || !e[c].length) erro(`estilo ${k}: "${c}" vazio.`);
    }
    regras(`estilo ${k}`, [e.nome, e.objetivo, e.gatilhos, e.familiasDeGancho, e.estrutura, e.ctas]);
    regras(`estilo ${k} evitar`, e.evitar, { promessas: false });
    for (const g of e.ganchosModelo ?? []) {
      const ref = /\s*\(([^()]*)\)\s*$/.exec(g);
      const corpo = ref && /\btm_[a-z0-9_]+/.test(ref[1]) ? g.slice(0, ref.index) : g;
      regras(`estilo ${k} gancho`, corpo);
      if (ref && ID_FATO.test(ref[1])) {
        if (!/\btm_[a-z0-9_]+/.test(ref[1])) erro(`estilo ${k} gancho: o id de fato só some da tela junto com o tema no parêntese: "${g.slice(0, 60)}"`);
        for (const id of ref[1].match(/\bF\d{3}\b/g)) if (fatos.get(id) !== 'USAR') erro(`estilo ${k} gancho: ${id} não é USAR.`);
      }
      const tm = ref?.[1].match(/\btm_[a-z0-9_]+/)?.[0];
      if (tm && !(novo.temas ?? []).some((t) => t.id === tm)) erro(`estilo ${k} gancho: o tema ${tm} não está na lista de temas.`);
    }
    for (const fam of e.familiasDeGancho ?? []) {
      if (!CATEGORIAS_BANCO.some((c) => semAcento(fam).trimStart().startsWith(semAcento(c)))) avisos.push(`estilo ${k}: a família "${fam.slice(0, 40)}" não casa com uma categoria do banco da reels-curtos`);
    }
    for (const id of e.formatosRecomendados ?? []) {
      if (!idsBib.has(id)) erro(`estilo ${k}: formato recomendado ${id} não existe.`);
      else if (!(tiposDe.get(id) ?? []).includes(k)) erro(`estilo ${k}: recomenda ${id}, que não serve pra ${k} no formatoTipos.`);
    }
  }
  const idsTema = new Set();
  for (const t of novo.temas ?? []) {
    const onde = `tema ${t.id}`;
    if (!igual(Object.keys(t), ['id', 'nome', 'publico', 'dor', 'fatos', 'fontes', 'pilar', 'sazonal'])) erro(`${onde}: campos fora do molde.`);
    if (idsTema.has(t.id)) erro(`${onde}: repetido.`);
    idsTema.add(t.id);
    if (!PUBLICOS.includes(t.publico)) erro(`${onde}: público "${t.publico}".`);
    if (typeof t.pilar !== 'number') erro(`${onde}: pilar precisa ser número.`);
    if (!Array.isArray(t.fatos) || !t.fatos.length) erro(`${onde}: sem fatos (tema sem fato na base vira rótulo).`);
    if (t.fatos?.length !== t.fontes?.length) erro(`${onde}: ${t.fatos?.length} fatos e ${t.fontes?.length} fontes (cada fato com a fonte na mesma posição).`);
    for (const s of t.fontes ?? []) fonteComFato(`${onde} fontes`, s, fatos);
    regras(onde, [t.nome, t.dor, t.fatos]);
    regras(`${onde} sazonal`, t.sazonal, { promessas: false, semId: false });
    if (Object.hasOwn(novo.rotulosTema ?? {}, t.id)) erro(`${onde}: está nos temas e nos rótulos ao mesmo tempo.`);
  }
  if (!objeto(novo.rotulosTema) || Object.values(novo.rotulosTema).some((v) => typeof v !== 'string')) erro('rotulosTema: precisa ser um objeto de textos.');
  regras('rotulosTema', Object.values(novo.rotulosTema ?? {}), { promessas: false });
  const ft = novo.formatoTipos ?? [];
  if (!igual(ft.map((x) => x.formatoId), bib.map((f) => f.id))) erro('formatoTipos: precisa de uma entrada por formato, na ordem da biblioteca.');
  for (const x of ft) if (!x.tipos?.length || x.tipos.some((t) => !TIPOS_REEL.includes(t)) || new Set(x.tipos).size !== x.tipos.length) erro(`formatoTipos ${x.formatoId}: tipos inválidos (${x.tipos}).`);
  // tema que alguma ideia ou reel usa não pode sumir (o app recusaria salvar a ideia)
  const vivos = new Set([...idsTema, ...Object.keys(novo.rotulosTema ?? {}), ...Object.keys(TEMA_LEGADO)]);
  const usados = new Set([...db.ideias.map((i) => i.tema), ...(vivo.temas ?? []).map((t) => t.id), ...Object.keys(vivo.rotulosTema ?? {})].filter((t) => typeof t === 'string' && t));
  for (const t of usados) if (!vivos.has(t)) erro(`o tema "${t}" (usado hoje) some no estilos.v2.json.`);
}

// ---------- gravação ----------
async function trocar(nome, texto) {
  const destino = arquivoDados(nome);
  const tmp = `${destino}.${process.pid}.tmp`;
  await writeFile(tmp, texto, 'utf8');
  for (let i = 0; ; i++) {
    try { return await rename(tmp, destino); } catch (e) {
      if (i >= 4 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) { await unlink(tmp).catch(() => {}); throw e; }
      await new Promise((r) => setTimeout(r, 60 * (i + 1)));
    }
  }
}
async function backup(nome) {
  const base = nome.replace(/\.json$/, '');
  const primeiro = arquivoDados(`${base}.antes-v2.json`);
  if (!existsSync(primeiro)) await copyFile(arquivoDados(nome), primeiro);
  await copyFile(arquivoDados(nome), arquivoDados(`${base}.antes-v2.ultimo.json`));
  return primeiro;
}

// ---------- principal ----------
const portas = new Set([Number(process.env.PORT) || 4317]);
if (path.resolve(DATA_DIR) === path.resolve(DADOS_PADRAO)) portas.add(4317); // a pasta de verdade: a 4317 sempre
for (const p of portas) if (await portaOcupada(p)) sair(`tem um servidor no ar na porta ${p}. Pare o servidor da Gestão de Marketing antes e rode de novo.`);

console.log(`Pasta de dados: ${DATA_DIR}${SIMULAR ? ' (simulação: nada é gravado)' : ''}`);
const fatos = await lerFatos();
const bibVivo = await lerArquivo(ARQ.bib.vivo);
const bibNovo = await lerArquivo(ARQ.bib.novo);
const estVivo = await lerArquivo(ARQ.est.vivo);
const estNovo = await lerArquivo(ARQ.est.novo);
if (!existsSync(DB_PATH)) sair(`${DB_PATH} não existe (rode o servidor uma vez antes).`);
const dbTexto = await readFile(DB_PATH, 'utf8');
let db;
try { db = JSON.parse(dbTexto); } catch (e) { sair(`db.json não abre: ${e.message}`); }

for (const [chave, { vivo, novo }] of Object.entries({ bib: { vivo: bibVivo, novo: bibNovo }, est: { vivo: estVivo, novo: estNovo } })) {
  if (novo.texto !== JSON.stringify(novo.json, null, 2) + '\n') erro(`${ARQ[chave].novo}: formatação diferente da do app (JSON com 2 espaços e quebra de linha no fim).`);
  if (TRACO.test(novo.texto)) erro(`${ARQ[chave].novo}: tem travessão ou meia-risca.`);
}
const bibJaAplicada = bibVivo.texto === bibNovo.texto;
const estJaAplicado = estVivo.texto === estNovo.texto;
conferirBiblioteca(bibVivo.json, bibNovo.json, bibJaAplicada, fatos);
conferirEstilos(estVivo.json, estNovo.json, bibNovo.json, db, fatos);
if (erros.length) {
  console.error(`\n${erros.length} problema(s):\n- ${erros.join('\n- ')}`);
  sair('corrija os arquivos v2 e rode de novo.');
}
for (const a of avisos) console.warn(`aviso: ${a}`);

// formatos editados no app: o merge do boot não mexe neles, então os campos da adaptação vão direto pro db.json
const tiposNovos = new Map(estNovo.json.formatoTipos.map((x) => [x.formatoId, x.tipos]));
const editados = [];
for (const f of bibNovo.json) {
  const atual = db.formatos.find((x) => x.id === f.id);
  if (!atual) { avisos.push(`${f.id} não está no db.json: entra no próximo boot`); continue; }
  if (!atual.atualizadoEm) continue;
  const campos = Object.fromEntries([...ADAPTACAO.map((k) => [k, f[k]]), ['tipos', tiposNovos.get(f.id)]]);
  if (Object.entries(campos).some(([k, v]) => !igual(atual[k], v))) editados.push([atual, campos]);
}

// ---------- 4. o que o boot vai fazer, com as funções do próprio app ----------
function simularBoot(dbBase) {
  definirGuia(guiaDe(estNovo.json));
  const copia = structuredClone(dbBase);
  mesclar(copia, 'formatos', bibNovo.json, normFormato);
  const problemas = [];
  for (const f of bibNovo.json) {
    const depois = copia.formatos.find((x) => x.id === f.id);
    const antes = dbBase.formatos.find((x) => x.id === f.id);
    if (!depois) { problemas.push(`${f.id} sumiu`); continue; }
    for (const k of ADAPTACAO) if (!igual(depois[k], f[k])) problemas.push(`${f.codigo}: "${k}" não chega na tela`);
    if (!igual(depois.tipos, tiposNovos.get(f.id))) problemas.push(`${f.codigo}: tipos não chegam (${depois.tipos})`);
    if (antes) {
      for (const k of ['referencia', 'evidencias', 'codigo', 'categoria', 'origem']) if (!igual(depois[k], antes[k])) problemas.push(`${f.codigo}: "${k}" mudaria`);
      if (!igual(statusFormato(depois, copia.cases), statusFormato(antes, dbBase.cases))) problemas.push(`${f.codigo}: a validação mudaria`);
    }
  }
  if (!igual(copia.cases, dbBase.cases)) problemas.push('os cases mudariam');
  return problemas;
}

const dbDepois = structuredClone(db);
for (const [atual, campos] of editados) Object.assign(dbDepois.formatos.find((x) => x.id === atual.id), campos);
const problemas = simularBoot(dbDepois);
if (problemas.length) sair(`o merge do boot não chegaria no resultado esperado:\n- ${problemas.join('\n- ')}`);

const resumo = [
  `biblioteca.json: ${bibJaAplicada ? 'já está na v2' : 'troca pela v2 (28 formatos)'}`,
  `estilos.json: ${estJaAplicado ? 'já está na v2' : `troca pela v2 (${estNovo.json.temas.length} temas, ${Object.keys(estNovo.json.rotulosTema).length} rótulos)`}`,
  `db.json: ${editados.length ? `grava a adaptação de ${editados.length} formato(s) editado(s) no app (${editados.map(([a]) => a.codigo).join(', ')})` : 'nada a gravar (formato editado no app já está na v2, ou não há; o boot mescla a biblioteca nova)'}`,
  `boot simulado: os 28 formatos chegam com o texto novo; referência, evidências, cases e validação iguais`,
];
console.log(resumo.map((l) => `- ${l}`).join('\n'));
for (const a of avisos) console.warn(`aviso: ${a}`);

if (SIMULAR) { console.log('\nSimulação: nada foi gravado.'); process.exit(0); }
if (bibJaAplicada && estJaAplicado && !editados.length) { console.log('\nNada a fazer: a v2 já está aplicada.'); process.exit(0); }

// ---------- 2 e 3. backup e troca ----------
// relê antes de gravar qualquer coisa: o db.json não pode ter mudado desde a leitura
if (editados.length && (await readFile(DB_PATH, 'utf8')) !== dbTexto) sair('o db.json mudou durante a rodada. Pare o que estiver gravando nele e rode de novo.');
const feitos = [];
if (!bibJaAplicada) {
  feitos.push(`backup em ${await backup(ARQ.bib.vivo)}`);
  await trocar(ARQ.bib.vivo, bibNovo.texto);
}
if (!estJaAplicado) {
  feitos.push(`backup em ${await backup(ARQ.est.vivo)}`);
  await trocar(ARQ.est.vivo, estNovo.texto);
}
if (editados.length) {
  const base = 'db.antes-biblioteca-v2';
  if (!existsSync(arquivoDados(`${base}.json`))) await copyFile(DB_PATH, arquivoDados(`${base}.json`));
  await copyFile(DB_PATH, arquivoDados(`${base}.ultimo.json`));
  feitos.push(`backup em ${arquivoDados(`${base}.json`)}`);
  await trocar('db.json', JSON.stringify(dbDepois, null, 2));
}

// confere o que ficou no disco
const bibFinal = await readFile(arquivoDados(ARQ.bib.vivo), 'utf8');
const estFinal = await readFile(arquivoDados(ARQ.est.vivo), 'utf8');
if (bibFinal !== bibNovo.texto || estFinal !== estNovo.texto) sair('a conferência depois da troca falhou (o arquivo gravado difere da v2). Restaure dos backups.');
console.log(`\nAplicado. ${feitos.join(' · ')}\nSuba o servidor de novo pra ver a Biblioteca nova (o merge acontece no boot).`);
