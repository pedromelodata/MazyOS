// Ajustes do Pedro de 22/10/2026 no banco (as decisões estão em server/conteudo-ajustes-2210.mjs). Rode com o servidor
// PARADO:
//   node server/aplicar-ajustes-2210.mjs [--simular]
// --simular mostra o que mudaria, sem gravar. CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia). Rodar de novo
// não muda nada: cada troca só acontece enquanto o texto antigo estiver lá.
//  A. "tudo que tem esse 22 anos de Legalize, delete e apague": a P39 vale em tudo que não foi postado. O pilar 3 fica
//     com a descrição nova; o reel de 27/10 (repo-semana:2026-10-26:2) com a ideia nova, sem o alerta da P39 nas notas;
//     o alerta da P39 ("até o Pedro decidir") sai das notas de toda peça e stories não postados; a frase "Mauro não
//     aparece" sai das notas de gravação. O que ainda citar o Mauro, o escritório ou os 22 anos (num texto que o script
//     não conhece) sai no resumo, em "Sobrou", pra resolver na tela: o script não reescreve texto que não conhece
//  B. "gere outra ideia para o do dia 29" e depois "quero essa ideia [a tirinha] para o dia 29": a peça 5 do calendário
//     (repo-semana:2026-10-26:5) é a tirinha "Até o nada tem prazo" em carrossel, com o motivo, o pilarTexto, o pilar
//     13, o bloco Conversão, as fontes F093, F092 e F094 (conferidas no FATOS.md: têm de estar como USAR), status ideia
//     e a nota de origem no lugar das notas da ideia antiga. A ideia escrita pela estratégia ("Bastidor da ME") está no
//     Banco de Ideias desde 22/10. O reel de 29/10 não muda
//  A decisão (A e B) só regrava a peça que um script gravou por último: a que alguém mexeu na tela depois (o Pedro
//  trocou os reels de 27 e 29/10 de dia, por exemplo) fica como está, e a data nunca muda
//  C. "sempre que falar de funcionário, nunca diga funcionário, e sim colaborador": nas peças e stories NÃO postados,
//     funcionário vira colaborador na mesma concordância (trocarFuncionario, do atelie.mjs) na ideia, no tema, no motivo,
//     no roteiro, no carrossel, no estático, nos quadros de stories, na legenda, na CTA e na explicação da aprovação; no
//     Banco de Ideias, no título, na descrição, no gancho e no roteiro base (as fontes ficam: são o título do fato no
//     FATOS.md). O que foi postado (legenda e hashtag que foram ao ar) não muda: é o registro do que foi ao ar. As notas
//     internas de 22/10 que ainda citavam o que a P39 proíbe ficam na forma nova (NOTAS_TROCADAS)
// A peça ou o stories que mudou passa pela regra de sempre da aprovação (aprovacoes.conferirMudancaAprovada): o aprovado
// vira "alterado" e o pendente com gerente que já aprovou volta pros gerentes. O que mudou fica com atualizadoPor deste
// script (o aplicar-semana-2210 e o aplicar-estrategia-2110, rodados de novo, contam como mexido e não regravam).
// Backup do db.json de antes: db.antes-ajustes-2210.json na primeira vez (nunca regravado) e
// db.antes-ajustes-2210.ultimo.json a cada rodada que grava
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { DB_PATH, arquivoDados, carregar, salvar, agora, tipoDoPilar } from './db.mjs';
import { conferirReel } from './validar.mjs';
import { trocarFuncionario, temFuncionario, P39 } from './atelie.mjs';
import { fotoDaAprovacao, conferirMudancaAprovada } from './aprovacoes.mjs';
import { RAIZ } from './importar.mjs';
import { regravarSeGerado, CONTEUDO } from './reelmd.mjs';
import { PILAR_3, DECISOES_SEMANA, ALERTA_P39, FRASE_MAURO, NOTAS_TROCADAS } from './conteudo-ajustes-2210.mjs';

const SIMULAR = process.argv.includes('--simular');
const PORTA = Number(process.env.PORT) || 4317;
const AUTOR = 'Ajustes de 22/10 (aplicar-ajustes-2210)';
const QUEM = { nome: AUTOR, id: null, sistema: true };
const LIM_NOTAS = 2000;
// C: os campos da peça de feed e dos stories do dia em que funcionário vira colaborador (a explicação da aprovação à parte)
const CAMPOS_PECA = ['ideia', 'tema', 'motivo', 'roteiro', 'carrossel', 'estatico', 'stories', 'legenda'];
const CAMPOS_STORIES = ['tema', 'motivo', 'quadros', 'cta'];
const CAMPOS_IDEIA = ['titulo', 'descricao', 'gancho', 'roteiroBase'];
// quem gravou a peça por último sem ser a tela: a decisão de 22/10 só regrava essas (a mexida na tela fica)
const DE_SCRIPT = new Set([AUTOR, 'Estratégia principal (aplicar-estrategia-2110)', 'Ajustes do Pedro (22/10)']);
// nas sobras, o que não é texto da peça (histórico da aprovação, métricas, arquivos) fica de fora
const FORA_DA_VARREDURA = new Set(['id', 'aprovacao', 'metricas', 'videos', 'criadoPor', 'atualizadoPor', 'criadoEm', 'atualizadoEm', 'permalink']);

const tem = (v) => Boolean(String(v ?? '').trim());
const fmt = (d) => (d ? String(d).split('-').reverse().slice(0, 2).join('/') : 'sem data');
const curto = (s, n) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));
const postado = (x) => x?.status === 'publicado';
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

// FATOS.md: id → título e status (a fonte nova da peça de 29/10 tem de existir e estar como USAR)
async function lerFatos() {
  const s = await readFile(path.join(RAIZ, '_base-contabil', 'FATOS.md'), 'utf8');
  const mapa = new Map();
  for (const b of s.split(/\n(?=\*\*F\d{3} · )/)) {
    const m = /^\*\*(F\d{3}) · (.+?)\*\* · ([^\n]+)/.exec(b);
    if (m) mapa.set(m[1], { titulo: m[2].trim(), status: m[3].trim() });
  }
  return mapa;
}

// troca em todo texto de um valor (texto solto, lista ou objeto), sem mexer na forma
function trocarEm(v, fn) {
  if (typeof v === 'string') return fn(v);
  if (Array.isArray(v)) return v.map((x) => trocarEm(x, fn));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, trocarEm(x, fn)]));
  return v;
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// as notas por parágrafo: o que bate com alguma regra sai, o resto fica como estava (sem mexer no espaço)
const paragrafos = (s) => String(s ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
function semParagrafos(notas, regras) {
  const ps = paragrafos(notas);
  const ficam = ps.filter((p) => !regras.some((re) => re.test(p)));
  return ficam.length === ps.length ? notas : ficam.join('\n\n');
}
// a frase que bate com uma troca vira o texto novo dela, onde estiver (a nota pode ter ido junto pra ideia); o resto
// fica como estava
const trocarFrases = (texto, trocas) => trocas.reduce((t, [re, novo]) => t.replace(re, novo), String(texto));
const semFraseMauro = (s) => {
  const t = s.replace(FRASE_MAURO, '');
  return t === s ? s : t.trim();
};

// A e B: o pilar 3 e as duas peças da semana de 26/10 (a peça é achada pela marca do aplicar-estrategia-2110)
function aplicarDecisoes(db, fatos, log, avisos) {
  const pilar = (db.pilares ?? []).find((p) => Number(p.id) === PILAR_3.id);
  if (!pilar) avisos.push(`O pilar ${PILAR_3.id} não existe no banco: a descrição nova não entrou.`);
  else if (pilar.descricao !== PILAR_3.descricao) {
    pilar.descricao = PILAR_3.descricao;
    log.push(`pilar ${PILAR_3.id} (${pilar.nome}): descrição nova: ${PILAR_3.descricao}`);
  }
  const mexidas = new Map();
  for (const d of DECISOES_SEMANA) {
    const r = (db.reels ?? []).find((x) => x.calendario === d.marca);
    if (!r) { avisos.push(`${fmt(d.data)} (${d.peca}): a peça ${d.marca} não está no banco. Nada mudou nela.`); continue; }
    if (postado(r)) { avisos.push(`${fmt(r.data)} ${r.id}: já foi postada. Nada mudou nela.`); continue; }
    if (r.atualizadoPor && !DE_SCRIPT.has(r.atualizadoPor)) { log.push(`${fmt(r.data)} ${r.id}: mexida na tela por ${r.atualizadoPor}, a decisão não regrava · ${curto(r.ideia, 60)}`); continue; }
    const foto = r.aprovacao ? fotoDaAprovacao(r) : null;
    const mudou = [];
    if (r.ideia !== d.ideia) { r.ideia = d.ideia; mudou.push('ideia nova'); }
    // notas: os parágrafos da ideia antiga e o alerta da P39 saem; a nota de origem de 22/10 entra uma vez
    let notas = semParagrafos(r.notas ?? '', [ALERTA_P39, ...(d.notasQueSaem ?? [])]);
    if (d.origem && !paragrafos(notas).includes(d.origem)) notas = [d.origem, ...paragrafos(notas)].join('\n\n');
    if (d.nota && !paragrafos(notas).includes(d.nota)) notas = [...paragrafos(notas), d.nota].join('\n\n');
    notas = curto(notas, LIM_NOTAS);
    if (notas !== (r.notas ?? '')) { r.notas = notas; mudou.push('notas'); }
    // B: tipo de peça, tema, formato, motivo, pilar, bloco, fontes e status pela validação do app (limite de texto,
    // bloco que bate com o pilar). A data nunca muda
    // 22/10 (achado da revisão): o tipo segue o pilar, como a tela faz ao salvar (tipoDoPilar)
    const quer = { peca: d.peca, tema: d.tema, formatoTexto: d.formato, motivo: d.motivo, pilarTexto: d.pilarTexto, pilar: d.pilar, tipo: d.pilar !== undefined ? tipoDoPilar(d.pilar) : undefined, bloco: d.bloco, fontes: d.fontes, status: d.status };
    const campos = {};
    for (const [k, v] of Object.entries(quer)) if (v !== undefined && !igual(r[k] ?? null, v)) campos[k] = structuredClone(v);
    if (campos.fontes) {
      for (const id of d.fatos ?? []) {
        const f = fatos.get(id);
        if (!f) throw new Error(`${fmt(d.data)}: o fato ${id} não existe no FATOS.md.`);
        if (!/^USAR\b/.test(f.status)) throw new Error(`${fmt(d.data)}: o fato ${id} está como ${f.status} no FATOS.md.`);
      }
    }
    if (campos.pilar !== undefined && !(db.pilares ?? []).some((p) => Number(p.id) === campos.pilar)) throw new Error(`${fmt(d.data)}: o pilar ${campos.pilar} não existe no banco.`);
    if (Object.keys(campos).length) {
      Object.assign(r, conferirReel(campos, r));
      mudou.push(...Object.keys(campos));
    }
    if (!mudou.length) continue;
    // o texto que já foi escrito pra ideia antiga não é apagado: fica pra refazer no Ateliê
    const escrito = [r.estatico?.headline, r.estatico?.apoio, r.estatico?.cta, r.legenda, r.roteiro?.hook, r.carrossel?.capa?.titulo].some(tem);
    if (escrito && mudou.includes('ideia nova') && d.origem) avisos.push(`${fmt(r.data)} ${r.id}: a peça já tem texto escrito pra ideia antiga. O texto ficou; refaça no Ateliê com a ideia nova.`);
    mexidas.set(r.id, { foto, mudou });
    log.push(`${fmt(r.data)} ${r.id} (${r.peca}): ${mudou.join(', ')} · ${curto(d.ideia, 70)}`);
  }
  return mexidas;
}

// A e C em cada peça ou stories não postado: funcionário vira colaborador, o alerta da P39 sai das notas e a frase do
// Mauro sai das notas de gravação
function aplicarTextos(x, campos) {
  const mudou = [];
  for (const k of campos) {
    if (x[k] == null) continue;
    const novo = trocarEm(x[k], trocarFuncionario);
    if (!igual(novo, x[k])) { x[k] = novo; mudou.push(k); }
  }
  if (typeof x.aprovacao?.explicacao === 'string') {
    const novo = trocarFuncionario(x.aprovacao.explicacao);
    if (novo !== x.aprovacao.explicacao) { x.aprovacao.explicacao = novo; mudou.push('explicação da aprovação'); }
  }
  if (tem(x.notas)) {
    const novo = trocarFrases(semParagrafos(x.notas, [ALERTA_P39]), NOTAS_TROCADAS);
    if (novo !== x.notas) { x.notas = novo; mudou.push('notas (P39)'); }
  }
  if (x.gravacao && typeof x.gravacao === 'object') {
    const novo = trocarEm(x.gravacao, semFraseMauro);
    if (!igual(novo, x.gravacao)) { x.gravacao = novo; mudou.push('gravação ("Mauro não aparece")'); }
  }
  return mudou;
}

// o que ainda cita a P39 ou funcionário depois dos ajustes (não postado): vai pro resumo, pra resolver na tela
function varrer(v, caminho, out) {
  if (typeof v === 'string') {
    for (const [regra, re] of [['P39', P39], ['funcionário', null]]) {
      const achou = re ? re.exec(v) : temFuncionario(v) ? /funcion/i.exec(v) : null;
      if (achou) out.push(`${caminho} (${regra}): "${curto(v.slice(Math.max(0, achou.index - 40), achou.index + 60).replace(/\s+/g, ' ').trim(), 110)}"`);
    }
    return;
  }
  if (Array.isArray(v)) v.forEach((x, i) => varrer(x, `${caminho}[${i}]`, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!FORA_DA_VARREDURA.has(k)) varrer(x, caminho ? `${caminho}.${k}` : k, out);
}

function aplicar(db, fatos) {
  const log = [];
  const avisos = [];
  const aprov = [];
  const cont = { pilar: 0, decisoes: 0, pecas: 0, stories: 0, ideias: 0, aprovacao: 0 };
  const pilarAntes = (db.pilares ?? []).find((p) => Number(p.id) === PILAR_3.id)?.descricao;
  const mexidas = aplicarDecisoes(db, fatos, log, avisos);
  if (pilarAntes !== undefined && pilarAntes !== PILAR_3.descricao) cont.pilar = 1;
  cont.decisoes = mexidas.size;

  // as peças de feed que mudaram: o reel.md gerado pelo cronograma é regravado depois de salvar (o espelho da peça)
  const pecasMudadas = new Set(mexidas.keys());
  const passar = (x, campos, tipo) => {
    if (postado(x)) return;
    const ja = mexidas.get(x.id);
    const foto = ja?.foto ?? (x.aprovacao ? fotoDaAprovacao(x) : null);
    const mudou = aplicarTextos(x, campos);
    if (!mudou.length && !ja) return;
    x.atualizadoEm = agora();
    x.atualizadoPor = AUTOR;
    if (mudou.length) {
      cont[tipo]++;
      if (tipo === 'pecas') pecasMudadas.add(x.id);
      log.push(`${tipo === 'stories' ? 'stories ' : ''}${fmt(x.data)} ${x.id}: ${mudou.join(', ')} · ${curto(tipo === 'stories' ? x.tema : x.ideia, 60)}`);
    }
    if (foto) {
      const antes = x.aprovacao?.estado;
      const etapa = x.aprovacao?.etapa;
      if (conferirMudancaAprovada(x, foto, QUEM)) {
        cont.aprovacao++;
        aprov.push(`${fmt(x.data)} ${x.id}: ${antes === 'aprovado' ? 'aprovado, agora "alterado" (mande de novo pra aprovação)' : `pendente (${etapa ?? 'sem etapa'}), voltou pros gerentes aprovarem de novo`}`);
      }
    }
  };
  for (const r of db.reels ?? []) passar(r, CAMPOS_PECA, 'pecas');
  for (const s of db.stories ?? []) passar(s, CAMPOS_STORIES, 'stories');
  // C no Banco de Ideias (a ideia não tem aprovação nem autor da última mudança). A peça guardada na ideia
  // (pecaOriginal, a que foi arrastada do cronograma) passa pela mesma troca da peça: é ela que volta pro calendário
  for (const i of db.ideias ?? []) {
    const mudou = [];
    for (const k of CAMPOS_IDEIA) {
      if (i[k] == null) continue;
      const novo = trocarEm(i[k], trocarFuncionario);
      if (!igual(novo, i[k])) { i[k] = novo; mudou.push(k); }
    }
    if (tem(i.notas)) {
      const novo = trocarFrases(i.notas, NOTAS_TROCADAS);
      if (novo !== i.notas) { i.notas = novo; mudou.push('notas (P39)'); }
    }
    if (i.pecaOriginal && typeof i.pecaOriginal === 'object') {
      const naPeca = aplicarTextos(i.pecaOriginal, CAMPOS_PECA);
      if (naPeca.length) mudou.push(`peça guardada (${naPeca.join(', ')})`);
    }
    if (!mudou.length) continue;
    cont.ideias++;
    log.push(`Banco de Ideias ${i.id}: ${mudou.join(', ')} · ${curto(i.titulo, 60)}`);
  }

  // sobras: peças, stories, pilares, campanhas e Banco de Ideias (o que foi postado não entra: é o registro do que foi
  // ao ar). Funcionário só conta nos campos da regra (CAMPOS_PECA, CAMPOS_STORIES e CAMPOS_IDEIA); a P39, em todo texto
  const sobras = [];
  const olhar = (rotulo, x, campos) => {
    const out = [];
    varrer(x, '', out);
    // 22/10 (achado da revisão): a explicação da aprovação é texto vivo (quem aprova lê, e ela volta na próxima ida): a P39
    // conta nela; a conversa e as observações seguem de fora
    if (typeof x?.aprovacao?.explicacao === 'string') varrer({ 'explicação da aprovação': x.aprovacao.explicacao }, '', out);
    const daRegra = (l) => /\(P39\)/.test(l) || !campos || campos.some((k) => l.startsWith(k));
    for (const l of out.filter(daRegra)) sobras.push(`${rotulo}: ${l}`);
  };
  for (const r of (db.reels ?? []).filter((y) => !postado(y))) olhar(`${fmt(r.data)} ${r.id}`, r, CAMPOS_PECA);
  for (const s of (db.stories ?? []).filter((y) => !postado(y))) olhar(`stories ${fmt(s.data)} ${s.id}`, s, CAMPOS_STORIES);
  for (const p of db.pilares ?? []) olhar(`pilar ${p.id}`, p, null);
  for (const c of db.campanhas ?? []) olhar(`campanha ${c.id}`, c, null);
  for (const i of db.ideias ?? []) olhar(`Banco de Ideias ${i.id}`, i, CAMPOS_IDEIA);
  const postados = [...(db.reels ?? []), ...(db.stories ?? [])].filter((y) => postado(y) && (() => { const o = []; varrer(y, '', o); return o.length; })()).length;
  return { log, avisos, aprov, cont, sobras, postados, pecasMudadas };
}

const original = await readFile(DB_PATH, 'utf8');
const cru = JSON.parse(original);
let fatos;
try { fatos = await lerFatos(); } catch (e) { sair(`O FATOS.md não abriu: ${e.message}`); }

let plano;
const reelMds = [];
try { plano = aplicar(structuredClone(cru), fatos); } catch (e) { sair(e.message); }
const c = plano.cont;
const total = c.pilar + c.decisoes + c.pecas + c.stories + c.ideias;
if (total && !SIMULAR) {
  const db = await carregar();
  try { plano = aplicar(db, fatos); } catch (e) { sair(e.message); }
  const primeiro = arquivoDados('db.antes-ajustes-2210.json');
  if (!existsSync(primeiro)) await writeFile(primeiro, original);
  await writeFile(arquivoDados('db.antes-ajustes-2210.ultimo.json'), original);
  await salvar();
  // 22/10 (achado da revisão): o reel.md que o cronograma gerou pra peça (marketing/conteudo, ou CRONOGRAMA_CONTEUDO no
  // teste) é regravado com o texto novo, como fazem a tela e os outros aplicar
  for (const id of plano.pecasMudadas) {
    const r = db.reels.find((x) => x.id === id);
    if (!r) continue;
    try {
      const pasta = await regravarSeGerado(r);
      if (pasta) reelMds.push(path.relative(CONTEUDO, pasta).split(path.sep).join('/'));
    } catch (e) {
      plano.avisos.push(`reel.md de ${fmt(r.data)} (${r.id}) não foi regravado: ${e.message}`);
    }
  }
}

const p = plano;
console.log(`${SIMULAR ? '[simulação] ' : ''}Ajustes de 22/10: pilar 3 ${p.cont.pilar ? 'com a descrição nova' : 'igual'}, ${p.cont.decisoes} peça(s) da semana de 26/10 com a decisão do Pedro, ${p.cont.pecas} peça(s), ${p.cont.stories} stories e ${p.cont.ideias} ideia(s) com texto trocado, ${p.cont.aprovacao} aprovação(ões) mexida(s).`);
for (const l of p.log) console.log(`  ${l}`);
if (p.aprov.length) {
  console.log('Aprovação técnica (a regra de sempre, conferirMudancaAprovada):');
  for (const l of p.aprov) console.log(`  ${l}`);
}
if (p.avisos.length) {
  console.log('Avisos:');
  for (const l of p.avisos) console.log(`  ${l}`);
}
if (p.sobras.length) {
  console.log(`Sobrou (não postado; o script não reescreve texto que não conhece, resolva na tela): ${p.sobras.length}`);
  for (const l of p.sobras.slice(0, 60)) console.log(`  ${l}`);
  if (p.sobras.length > 60) console.log(`  ... e mais ${p.sobras.length - 60}`);
}
if (reelMds.length) console.log(`reel.md regravados (${reelMds.length}): ${reelMds.join(', ')}. Na VPS, o reel.md que já estava no git fica modificado: traga pro PC, faça o commit e dê o checkout na VPS (README, "reel.md salvos pela gestão").`);
if (p.postados) console.log(`Postados que citam a P39 ou funcionário: ${p.postados} (não mudam: é o registro do que foi ao ar).`);
if (!total) console.log('Nada a mudar.');
else if (!SIMULAR) console.log(`Backup em ${path.relative(process.cwd(), arquivoDados('db.antes-ajustes-2210.ultimo.json'))}.`);
process.exit(0);
