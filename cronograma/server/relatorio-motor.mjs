// Motor do resumo semanal de Métricas (SPEC-METRICAS.md §3.8). Puro: nada de disco, rede ou relógio
// escondido (quem precisa de "agora" recebe por parâmetro) e só importa módulos puros (a estatística e os
// motores do público e do diagnóstico), pra testar sem banco. relatorio.mjs carrega os arquivos, chama este
// motor e grava. Decisões:
//  - a semana é a ISO no fuso de Brasília (segunda a domingo, AAAA-Www); o post entra pelo dia dele em Brasília
//  - todo número que o relatório afirma mora num fato numerado (F1, F2...) com o número exato; a leitura com
//    IA só recebe os fatos, e cada frase dela cita ids que existem
//  - a frase da IA só fica se TODO número dela aparece no texto de um fato citado. A conferência é pelo valor,
//    em pt-BR ("1.234" é mil duzentos e trinta e quatro, "1,5" é um e meio), e número por extenso ("três",
//    "dobro") também conta. "um" e "uma" soltos ficam de fora: na maior parte das frases são artigo
//  - (30/09) data, semana e hora do fato (28/09, 2026-W40, 14h) e o título entre aspas não autorizam número: o
//    "28" de uma data e o "5" de "5 erros do MEI" liberavam quase qualquer contagem pequena. A frase só pode repetir
//    a mesma data, a mesma hora e o mesmo título. Número por extenso composto vira um só ("trezentas e vinte" é
//    320) e quantidade vaga ("centenas", "milhares") derruba a frase, porque não tem como conferir
//  - melhor e pior da semana pelo score do objetivo (log2 contra a base do tipo); o pior só com 2 peças ou mais
//  - meta, score e "bateu" vêm do diagnóstico como estão (a aba e o semanal dizem o mesmo). Nos números da semana
//    (metas batidas, mediana e destaques) só entra peça fechada: com 7 dias e sem anúncio (C5, 30/09), como nos
//    números da conta da aba. A agenda gera o semanal na segunda de manhã, quando quase toda peça da semana ainda
//    é provisória: a de menos de 7 dias e a com anúncio ficam de fora e são contadas à parte, em palavras
//  - fator de peça que não bateu a meta: truncado em uma casa e no máximo 1,9 (C2, 30/09), o vezesDaPeca de
//    metricas-comum.js: 1,96× nunca aparece como "2×" ao lado de "não bateu". Sem veredito (a mediana, a peça
//    provisória), truncado sem teto; e o valor abaixo da meta nunca é arredondado pra cima até ela
//  - o relatório guarda de quando é a leitura dos posts que usou (lidoEm). Leitura de antes do fim da semana ganha
//    aviso (post publicado depois dela não está lá), e situacaoRelatorio diz à agenda quando o resumo gravado
//    precisa ser gerado de novo (parcial, desatualizado ou com peça provisória)
//  - percentual na escala 0 a 100 (o pct de metricas-comum.js); ausente é null e o texto diz "sem dado"
//  - o alcance de quem não segue sai da descoberta do publico-motor.mjs (puro): a semana dá o mesmo número
//    aqui e na aba Público
//  - texto que vem de fora do motor (título, porquê, insight, hipótese, frase do público) passa pelo limpar()
//    recebido: relatorio.mjs manda o semTracos de db.mjs (o motor não importa o db pra continuar puro)
import {
  finito, mediana, diaBrasilia, horaBrasilia, intervaloSemana, somarSemanas, semanaIso, inicioDoDia, somarDias, msDe,
  n0, num, pct, vezes, fatorDeScore, dataCurta, listaPt, SEM_DADO,
} from './estatistica.mjs';
import { descoberta } from './publico-motor.mjs';
import { objetivoDoTipo } from './diagnostico-motor.mjs';

export const VERSAO = 1;
export const SEMANA_OK = /^\d{4}-W\d{2}$/;
const FEED = ['reel', 'carrossel', 'estatico'];
const PECA_DO_TIPO_MIDIA = { REELS: 'reel', CAROUSEL_ALBUM: 'carrossel', FEED: 'estatico' };
const PLURAL_PECA = { reel: ['reel', 'reels'], carrossel: ['carrossel', 'carrosséis'], estatico: ['estático', 'estáticos'] };
const ACAO = { usar: 'Fazer mais', evitar: 'Evitar', testar: 'Testar', planejar: 'No planejamento' };
const ORDEM_EVIDENCIA = { forte: 0, moderada: 1, fraca: 2 };
const MAX_FATOS = 60;
const MAX_INSIGHTS = 6;
const MAX_FRASES_IA = 6;
const MAX_FRASE_IA = 400;
const MAX_TITULO = 140;

// ---------- semana ----------

// AAAA-Www que existe no calendário ISO (2026 tem W53; 2025 não), entre 2000 e 2100
export function semanaValida(s) {
  if (typeof s !== 'string' || !SEMANA_OK.test(s)) return false;
  const ano = Number(s.slice(0, 4));
  const i = intervaloSemana(s);
  return ano >= 2000 && ano <= 2100 && Boolean(i) && semanaIso(i.inicio) === s;
}

// a semana ISO anterior à do dia (AAAA-MM-DD, Brasília): segunda 05/10/2026 dá 2026-W40
export const semanaAnteriorDe = (dia) => somarSemanas(semanaIso(dia), -1);

// quando a semana acabou (a segunda seguinte, 0h em Brasília) e quando todas as peças dela fizeram 7 dias (a
// segunda depois dessa, 0h: o post de domingo às 23h59 faz 7 dias no domingo seguinte), em ms. null: semana torta
export function marcosDaSemana(semana) {
  const i = semanaValida(semana) ? intervaloSemana(semana) : null;
  return i ? { acabouMs: inicioDoDia(somarDias(i.fim, 1)), maduraMs: inicioDoDia(somarDias(i.fim, 8)) } : null;
}

// o resumo gravado de uma semana, pra agenda saber se gera de novo:
//  'falta'         sem arquivo
//  'parcial'       gerado com a semana em andamento
//  'desatualizado' a leitura dos posts que ele usou é de antes do fim da semana (post novo pode ter ficado de fora)
//  'provisorio'    gerado antes de todas as peças fazerem 7 dias, com peça provisória na conta
//  'fechado'       o resto. Gerado de novo depois dos 7 dias, fica fechado mesmo com peça ainda sem número de 7
//                  dias (leitura que faltou): a agenda não gera o mesmo resumo em todo giro
export function situacaoRelatorio(rel, semana = rel?.semana) {
  const m = marcosDaSemana(semana);
  if (!rel || typeof rel !== 'object' || !m) return 'falta';
  const gerado = msDe(rel.geradoEm);
  if (rel.resumo?.parcial === true || (gerado != null && gerado < m.acabouMs)) return 'parcial';
  const lido = msDe(rel.lidoEm);
  if (lido != null && lido < m.acabouMs) return 'desatualizado';
  if ((gerado == null || gerado < m.maduraMs) && finito(rel.resumo?.provisorias) && rel.resumo.provisorias > 0) return 'provisorio';
  return 'fechado';
}

const DIA = /^\d{4}-\d{2}-\d{2}$/;
const diaDo = (p) => (typeof p?.dia === 'string' && DIA.test(p.dia) ? p.dia : diaBrasilia(p?.timestamp));

// posts (PostRow do diagnóstico) publicados na semana, pelo dia em Brasília
export function postsDaSemana(posts, semana) {
  const i = semanaValida(semana) ? intervaloSemana(semana) : null;
  if (!i) return [];
  return (Array.isArray(posts) ? posts : []).filter((p) => {
    const d = diaDo(p);
    return Boolean(d) && d >= i.inicio && d <= i.fim;
  });
}

// ---------- conferência da leitura com IA ----------

const NUMERO = /\d+(?:[.,]\d+)*/g;
// cardinais por extenso (sem acento). "um" e "uma" só contam dentro de um número composto ("vinte e um"): soltos,
// são artigo na maior parte das frases
const CARDINAL = {
  dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12,
  treze: 13, catorze: 14, quatorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90,
  cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quatrocentos: 400,
  quatrocentas: 400, quinhentos: 500, quinhentas: 500, seiscentos: 600, seiscentas: 600, setecentos: 700,
  setecentas: 700, oitocentos: 800, oitocentas: 800, novecentos: 900, novecentas: 900,
  dezena: 10, duzia: 12, centena: 100, mil: 1000, milhar: 1000, milhao: 1_000_000, milhoes: 1_000_000,
};
// fator por extenso: vale sozinho, não compõe número
const FATOR = {
  dobro: 2, dobrou: 2, dobraram: 2, dobrar: 2, duplicou: 2, duplicaram: 2, triplo: 3, triplicou: 3, triplicaram: 3,
  quadruplo: 4, quadruplicou: 4, metade: 0.5,
};
// quantidade vaga: não tem como conferir com fato nenhum
const VAGO = new Set(['dezenas', 'centenas', 'milhares', 'bilhoes']);
const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// "1.234" e "1.234,5" (milhar pt-BR), "1,5" (decimal pt-BR), "12" e "1.5" (ponto decimal). O resto (1.2.3)
// vira um número por grupo: nada escapa da conferência
function valoresDoToken(tok) {
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(tok)) return [Number(tok.replace(/\./g, '').replace(',', '.'))];
  if (/^\d+,\d+$/.test(tok)) return [Number(tok.replace(',', '.'))];
  if (/^\d+(?:\.\d+)?$/.test(tok)) return [Number(tok)];
  return tok.split(/[.,]/).map(Number);
}

// palavras de número seguidas (com ou sem "e" no meio) viram um número só: "trezentas e vinte" é 320, "dois mil" é
// 2.000, "vinte e um" é 21. Juntar a mais é o lado seguro (o número junto precisa estar no fato); separar deixaria
// "vinte e três" passar com um 20 e um 3 soltos no fato
function numerosPorExtenso(texto) {
  const toks = semAcento(texto).match(/[a-z]+|[^\sa-z]+/g) ?? [];
  const saida = [];
  let total = null;
  let parcial = 0;
  const fechar = () => {
    if (total !== null) saida.push(total + parcial);
    total = null;
    parcial = 0;
  };
  for (const w of toks) {
    if (Object.hasOwn(FATOR, w)) {
      fechar();
      saida.push(FATOR[w]);
      continue;
    }
    const dentro = total !== null;
    const v = Object.hasOwn(CARDINAL, w) ? CARDINAL[w] : dentro && (w === 'um' || w === 'uma') ? 1 : null;
    if (v === null) {
      if (!(dentro && w === 'e')) fechar();
      continue;
    }
    if (total === null) total = 0;
    if (v >= 1000) {
      total += (parcial || 1) * v;
      parcial = 0;
    } else parcial += v;
  }
  fechar();
  return saida;
}

// os números de um texto pelo valor: algarismos (pt-BR) e os por extenso das listas
export function numerosDoTexto(texto) {
  const t = String(texto ?? '');
  const saida = [];
  for (const tok of t.match(NUMERO) ?? []) saida.push(...valoresDoToken(tok));
  saida.push(...numerosPorExtenso(t));
  return saida.filter((n) => Number.isFinite(n));
}

const temNumeroVago = (texto) => (semAcento(texto).match(/[a-z]+/g) ?? []).some((w) => VAGO.has(w));

// data (28/09, 28/09/2026, 2026-09-28), semana (2026-W40) e hora (14h, 7h30): conferidas como marca, não como
// número solto. 4/10 e 04/10 são a mesma data
const MARCA = /\b\d{4}-\d{2}-\d{2}\b|\b\d{4}-W\d{2}\b|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\b\d{1,2}h(?:\d{2})?\b/gi;
const normalMarca = (m) => m.toLowerCase().replace(/\d+/g, (d) => String(Number(d)));
// título entre aspas (retas ou curvas)
const ASPAS = /"([^"\n]*)"|“([^”\n]*)”/g;
const normalTitulo = (s) => semAcento(s).replace(/\s+/g, ' ').trim();
// o título entra no fato entre aspas retas; aspas dentro dele viram simples, pra não quebrar o par
const entreAspas = (t) => `"${String(t ?? '').replace(/["“”]/g, "'")}"`;

// o que um fato autoriza: os números fora de data, hora e título, as datas e horas, e os títulos entre aspas
function autorizadoPor(texto) {
  const t = String(texto ?? '');
  const titulos = [...t.matchAll(ASPAS)].map((m) => normalTitulo(m[1] ?? m[2] ?? ''));
  const semTitulo = t.replace(ASPAS, ' ');
  const marcas = (semTitulo.match(MARCA) ?? []).map(normalMarca);
  return { numeros: numerosDoTexto(semTitulo.replace(MARCA, ' ')), marcas, titulos };
}

// a frase só repete número, data, hora e título que estão nos fatos citados
function confere(texto, citados) {
  const numeros = [];
  const marcas = new Set();
  const titulos = new Set();
  for (const x of citados) {
    const a = autorizadoPor(x.texto);
    numeros.push(...a.numeros);
    for (const m of a.marcas) marcas.add(m);
    for (const t of a.titulos) titulos.add(t);
  }
  // título igual ao de um fato citado sai da conta; título que não está lá conta como texto comum
  const semTitulo = texto.replace(ASPAS, (tudo, a, b) => (titulos.has(normalTitulo(a ?? b ?? '')) ? ' ' : tudo));
  if (!(semTitulo.match(MARCA) ?? []).every((m) => marcas.has(normalMarca(m)))) return false;
  const resto = semTitulo.replace(MARCA, ' ');
  if (temNumeroVago(resto)) return false;
  return numerosDoTexto(resto).every((n) => numeros.some((p) => Math.abs(p - n) < 1e-9));
}

// "(F2)", "[F1, F3]" e "F4" soltos saem do texto: a citação vai no campo fatos, e o dígito do id não é número
const CITACAO = /\s*[([]\s*F\d{1,3}(?:\s*(?:,|e)\s*F\d{1,3})*\s*[)\]]/gi;
const ID_SOLTO = /\bF\d{1,3}\b/gi;
const tirarCitacoes = (s) =>
  String(s ?? '').replace(CITACAO, '').replace(ID_SOLTO, '').replace(/\s{2,}/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();

// frases da IA: [{ texto, fatos: ['F1'] }]. Fica a frase que cita só ids que existem e cujo número, data, hora e
// título aparecem nos fatos citados (data e título não liberam número); o resto sai e conta em descartadas.
// No máximo 6
export function conferirFrases(brutas, fatos) {
  const porId = new Map((Array.isArray(fatos) ? fatos : []).filter((f) => f?.id).map((f) => [String(f.id).toUpperCase(), f]));
  const frases = [];
  let descartadas = 0;
  for (const f of Array.isArray(brutas) ? brutas : []) {
    const texto = tirarCitacoes(f?.texto);
    const ids = [...new Set((Array.isArray(f?.fatos) ? f.fatos : []).map((x) => String(x ?? '').trim().toUpperCase()).filter(Boolean))];
    const citados = ids.map((id) => porId.get(id));
    if (!texto || texto.length > MAX_FRASE_IA || !ids.length || citados.some((x) => !x) || frases.length >= MAX_FRASES_IA) {
      descartadas++;
      continue;
    }
    if (!confere(texto, citados)) {
      descartadas++;
      continue;
    }
    frases.push({ texto, fatos: citados.map((x) => x.id) });
  }
  return { frases, descartadas };
}

// ---------- números da semana ----------

const pecaDe = (p) => (FEED.includes(p?.peca) ? p.peca : PECA_DO_TIPO_MIDIA[p?.tipoMidia] ?? 'reel');
// peça que entra na conta da semana: com 7 dias (não provisória) e sem anúncio (C5)
const fechada = (p) => Boolean(p) && p.impulsionado !== true && !p.objetivo?.provisorio;

// publicadas por peça e os números que dizem se a semana foi bem: metas batidas (entre as fechadas com veredito),
// mediana do score e taxa de acerto (0 a 100), só com peça fechada. À parte: provisórias (menos de 7 dias), com
// anúncio e, entre as fechadas, sem avaliação (sem base de comparação ou sem o número do objetivo)
export function numerosDaSemana(posts) {
  const lista = Array.isArray(posts) ? posts : [];
  const publicadas = { reel: 0, carrossel: 0, estatico: 0, total: 0 };
  for (const p of lista) {
    publicadas[pecaDe(p)]++;
    publicadas.total++;
  }
  const fechadas = lista.filter(fechada);
  const avaliadas = fechadas.filter((p) => typeof p.objetivo?.bateuMeta === 'boolean');
  const n = avaliadas.filter((p) => p.objetivo.bateuMeta).length;
  const de = avaliadas.length;
  return {
    publicadas,
    metasBatidas: { n, de },
    medianaScore: mediana(fechadas.map((p) => p.objetivo?.score)),
    taxaAcerto: de ? Math.round((n / de) * 1000) / 10 : null,
    provisorias: lista.filter((p) => p?.objetivo?.provisorio).length,
    comAnuncio: lista.filter((p) => p?.impulsionado === true).length,
    semAvaliacao: fechadas.length - de,
  };
}

// seguidores no primeiro e no último dia da semana com leitura (publico.json, diario[dia].seguidoresTotal)
export function seguidoresDaSemana(diario, semana) {
  const i = intervaloSemana(semana);
  const d = diario && typeof diario === 'object' ? diario : {};
  const dias = i ? Object.keys(d).filter((k) => DIA.test(k) && k >= i.inicio && k <= i.fim && finito(d[k]?.seguidoresTotal)).sort() : [];
  if (!dias.length) return { inicio: null, fim: null, variacao: null, diaInicio: null, diaFim: null };
  const a = d[dias[0]].seguidoresTotal;
  const b = d[dias.at(-1)].seguidoresTotal;
  // uma leitura só não mede variação: fica null, não 0
  return { inicio: a, fim: b, variacao: dias.length > 1 ? b - a : null, diaInicio: dias[0], diaFim: dias.at(-1) };
}

// parte do alcance diário (somado na semana) que veio de quem não segue: a mesma conta da aba Público
// (descoberta do publico-motor.mjs), pra semana dar o mesmo número nas duas telas. hoje: só dias fechados
export function naoSeguidoresDaSemana(diario, semana, { hoje = null } = {}) {
  const w = descoberta(diario, { hoje, semanas: 10_000 }).semanas.find((s) => s.semana === semana);
  return w && finito(w.pctNao) ? { pct: w.pctNao, naoSeguidores: w.naoSeguidores, alcance: w.alcance, dias: w.dias } : null;
}

// totais dos stories da semana (resumoStories com início e fim): dias com story, views, saídas, respostas, cliques
export function storiesDaSemana(resumo) {
  const dias = (Array.isArray(resumo?.dias) ? resumo.dias : []).filter((d) => finito(d?.n) && d.n > 0);
  if (!dias.length) return null;
  const somar = (k) => {
    const v = dias.map((d) => d[k]).filter(finito);
    return v.length ? v.reduce((s, x) => s + x, 0) : null;
  };
  return {
    dias: dias.length,
    stories: somar('n'),
    views: somar('views'),
    saidas: somar('saidas'),
    respostas: somar('respostas'),
    cliques: somar('cliques'),
    porDia: dias.map((d) => ({ dia: d.dia ?? null, n: d.n, views: finito(d.views) ? d.views : null })),
  };
}

// ---------- montagem ----------

const lista = (v) => (Array.isArray(v) ? v : []);
const cortar = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const minuscula = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);

// o fator de uma peça contra a base, como a aba mostra (vezesDaPeca de metricas-comum.js). Bateu: o fator como é.
// Não bateu: truncado em uma casa e no máximo 1,9 (C2: 1,96× ao lado de "não bateu" não pode virar "2×"). Sem
// veredito (mediana, peça provisória): truncado, sem teto. Abaixo de 0,1× fica o algarismo significativo de vezes()
function vezesDaPeca(score, bateu = null) {
  const r = fatorDeScore(score);
  if (!finito(r)) return SEM_DADO;
  if (bateu === true || r < 0.1) return vezes(r);
  // o 1e-9 só absorve o erro de ponto flutuante (2 ** log2(1,9) = 1,8999999...)
  const t = Math.floor(r * 10 + 1e-9) / 10;
  return vezes(bateu === false ? Math.min(t, 1.9) : t);
}
// contagem como o diagnóstico escreve: milhar a partir de 100; abaixo, uma casa (o valor aos 7 dias pode ser 3,4)
const qtd = (v) => (finito(v) ? (Math.abs(v) >= 100 ? n0(v) : num(v, 1)) : SEM_DADO);
// valor que não chegou na meta nunca aparece arredondado pra cima até ela (1.047,6 contra meta de 1.048 é "1.047")
function qtdAte(v, meta) {
  if (!finito(v) || !finito(meta) || v >= meta - 1e-9) return qtd(v);
  return Math.abs(v) >= 100 ? n0(Math.floor(v)) : num(Math.floor(v * 10 + 1e-7) / 10, 1);
}

function coletorDeFatos(txt) {
  const fatos = [];
  const add = (texto) => {
    const t = txt(texto);
    if (!t) return null;
    const igual = fatos.find((f) => f.texto === t);
    if (igual) return igual.id;
    if (fatos.length >= MAX_FATOS) return null;
    const id = `F${fatos.length + 1}`;
    fatos.push({ id, texto: t });
    return id;
  };
  return { fatos, add };
}

// entrada = { semana, posts, insights, hipoteses, titulosPeca, publico: { diario, frases }, stories, proximas,
//   geradoEm, geradoPor, hoje, lidoEm }. proximas = [{ reelId, dia, titulo, tipo, peca, pilarNome, rec }] com rec =
//   recomendacoesPara() do diagnóstico (ou null); hoje (AAAA-MM-DD, Brasília) deixa o dia em curso fora do
//   alcance, como na aba Público; lidoEm (ISO) é a última leitura dos nossos posts que o contexto usou (sem ele,
//   nada de aviso). Devolve o Relatorio da §3.8 com leituraIa null
export function montarRelatorio(entrada = {}, { rotulosTipo = {}, rotulosPeca = {}, limpar = (s) => String(s ?? '') } = {}) {
  const { semana } = entrada;
  if (!semanaValida(semana)) throw new TypeError('Semana inválida: use AAAA-Www.');
  const { inicio, fim } = intervaloSemana(semana);
  const marcos = marcosDaSemana(semana);
  const txt = (s) => String(limpar(String(s ?? '')) ?? '').replace(/\s+/g, ' ').trim();
  const rotTipo = (t) => (t && rotulosTipo[t]) || 'sem tipo';
  const rotPeca = (p) => rotulosPeca[p] || 'Post';
  const { fatos, add } = coletorDeFatos(txt);
  const periodo = `${dataCurta(inicio)} a ${dataCurta(fim)}`;

  const posts = postsDaSemana(entrada.posts, semana).sort((a, b) => String(diaDo(a)).localeCompare(String(diaDo(b))) || String(a.timestamp ?? '').localeCompare(String(b.timestamp ?? '')));
  const anteriores = postsDaSemana(entrada.posts, somarSemanas(semana, -1));
  const nums = numerosDaSemana(posts);
  const ant = anteriores.length ? numerosDaSemana(anteriores) : null;

  // ---- resumo (semana corrente: parcial, e a frase avisa)
  const { publicadas, metasBatidas } = nums;
  const parcial = typeof entrada.hoje === 'string' && entrada.hoje <= fim;
  const lidoMs = msDe(entrada.lidoEm);
  // posts lidos antes do fim da semana (Instagram desconectado ou leitura falhando): o que saiu depois não está aqui
  const lidoAntes = !parcial && lidoMs != null && lidoMs < marcos.acabouMs;
  const frases = parcial ? ['Semana em andamento: os números ainda mudam até domingo.'] : [];
  if (lidoAntes) {
    frases.push(`Os números dos posts são da leitura de ${dataCurta(diaBrasilia(lidoMs))} às ${horaBrasilia(lidoMs)}h, antes do fim da semana: post publicado depois disso fica de fora.`);
  }
  if (!publicadas.total) frases.push(`Nenhum post nosso saiu de ${periodo}${parcial ? ' até agora' : lidoAntes ? ' até essa leitura' : ''}.`);
  else {
    const partes = FEED.filter((k) => publicadas[k]).map((k) => `${n0(publicadas[k])} ${publicadas[k] === 1 ? PLURAL_PECA[k][0] : PLURAL_PECA[k][1]}`);
    frases.push(`De ${periodo}, ${publicadas.total === 1 ? 'saiu 1 peça' : `saíram ${n0(publicadas.total)} peças`}: ${listaPt(partes)}.`);
    const { n, de } = metasBatidas;
    if (de) {
      if (!n) frases.push(de === 1 ? 'A peça com base não bateu a meta de 2× do tipo.' : `Nenhuma das ${n0(de)} peças com base bateu a meta de 2× do tipo.`);
      else frases.push(`${n0(n)} de ${n0(de)} ${de === 1 ? 'peça' : 'peças'} com base ${n === 1 ? 'bateu' : 'bateram'} a meta de 2× do tipo.`);
    } else if (nums.semAvaliacao) {
      // só a peça fechada sem base ou sem número: a provisória e a com anúncio têm frase própria logo abaixo
      frases.push('Nenhuma peça da semana com 7 dias tem como comparar com a meta de 2× ainda (falta base de comparação ou o número do objetivo).');
    }
    if (finito(nums.medianaScore)) {
      frases.push(`A mediana da semana ficou em ${vezesDaPeca(nums.medianaScore)} a base do tipo${finito(ant?.medianaScore) ? `; na semana anterior, ${vezesDaPeca(ant.medianaScore)}` : ''}.`);
    }
    if (ant?.metasBatidas.de) {
      frases.push(`Na semana anterior, ${n0(ant.metasBatidas.n)} de ${n0(ant.metasBatidas.de)} ${ant.metasBatidas.de === 1 ? 'peça' : 'peças'} com base ${ant.metasBatidas.n === 1 ? 'bateu' : 'bateram'} a meta.`);
    }
    if (nums.provisorias) {
      frases.push(nums.provisorias === 1
        ? '1 peça ainda tem menos de 7 dias: fica fora da conta da meta, da mediana e dos destaques até fazer 7 dias.'
        : `${n0(nums.provisorias)} peças ainda têm menos de 7 dias: ficam fora da conta da meta, da mediana e dos destaques até fazerem 7 dias.`);
    }
    if (nums.comAnuncio) {
      frases.push(nums.comAnuncio === 1
        ? '1 peça teve anúncio: fica fora da conta da meta, da mediana e dos destaques.'
        : `${n0(nums.comAnuncio)} peças tiveram anúncio: ficam fora da conta da meta, da mediana e dos destaques.`);
    }
  }
  frases.forEach(add);

  // ---- peças da semana
  const pecas = posts.map((p) => {
    const peca = pecaDe(p);
    const dia = diaDo(p);
    const titulo = cortar(txt(p.reelTitulo || p.legenda1) || `${rotPeca(peca)} de ${dataCurta(dia)}`, MAX_TITULO);
    const rotuloEtapa = (etapa) => (etapa ? txt(lista(p.funil).find((x) => x?.etapa === etapa)?.rotulo) || null : null);
    return {
      midiaId: p.midiaId ?? null,
      titulo,
      dia,
      tipo: p.tipo ?? null,
      peca,
      pilarNome: p.pilarNome ? txt(p.pilarNome) : null,
      objetivo: p.objetivo ?? null,
      bateuMeta: typeof p.objetivo?.bateuMeta === 'boolean' ? p.objetivo.bateuMeta : null,
      // teve anúncio: fica fora da conta da semana (C5)
      impulsionado: typeof p.impulsionado === 'boolean' ? p.impulsionado : null,
      porque: { bem: lista(p.porque?.bem).map(txt).filter(Boolean), mal: lista(p.porque?.mal).map(txt).filter(Boolean) },
      gargalo: p.gargalo ?? null,
      forte: p.forte ?? null,
      gargaloRotulo: rotuloEtapa(p.gargalo),
      forteRotulo: rotuloEtapa(p.forte),
      thumb: p.thumb ?? '',
      permalink: p.permalink ?? '',
    };
  });
  const cabecalho = (x) => `${rotPeca(x.peca)} ${entreAspas(x.titulo)} (${dataCurta(x.dia)}, ${rotTipo(x.tipo)})`;
  for (const x of pecas) add(fatoObjetivo(x, cabecalho(x), rotTipo(x.tipo)));

  // ---- destaques: pelo score do objetivo, só entre as peças fechadas (7 dias e sem anúncio); o pior só com 2 ou mais
  const comScore = pecas.filter((x) => finito(x.objetivo?.score) && !x.objetivo.provisorio && x.impulsionado !== true);
  const ordenadas = [...comScore].sort((a, b) => b.objetivo.score - a.objetivo.score);
  const melhor = ordenadas[0] ?? null;
  const pior = ordenadas.length >= 2 ? ordenadas.at(-1) : null;
  const destaque = (rotulo, x) =>
    `${rotulo} da semana pelo objetivo: ${rotPeca(x.peca)} ${entreAspas(x.titulo)}, ${vezesDaPeca(x.objetivo.score, x.bateuMeta)} a base.`;
  if (melhor) add(destaque('Melhor peça', melhor));
  if (pior) add(destaque('Pior peça', pior));

  // ---- mecanismos: os insights com evidência (fraca pra cima), os que tocam a semana primeiro
  const idsSemana = new Set(pecas.map((x) => String(x.midiaId)));
  const insights = lista(entrada.insights)
    .map((i, k) => ({ i, k, daSemana: lista(i?.midias).some((id) => idsSemana.has(String(id))) }))
    .filter(({ i }) => i && Object.hasOwn(ORDEM_EVIDENCIA, i.evidencia) && txt(i.texto))
    .sort((a, b) => ORDEM_EVIDENCIA[a.i.evidencia] - ORDEM_EVIDENCIA[b.i.evidencia] || Number(b.daSemana) - Number(a.daSemana) || (b.i.n ?? 0) - (a.i.n ?? 0) || a.k - b.k)
    .slice(0, MAX_INSIGHTS)
    .map(({ i }) => ({ id: i.id ?? null, acao: i.acao ?? null, titulo: txt(i.titulo), texto: txt(i.texto), evidencia: i.evidencia }));
  for (const i of insights) add(`${ACAO[i.acao] ?? 'Sinal'}: ${i.texto}`);

  // ---- hipóteses: veredito saído na semana; abertas contadas agora
  const titulos = entrada.titulosPeca && typeof entrada.titulosPeca === 'object' ? entrada.titulosPeca : {};
  const hips = lista(entrada.hipoteses).filter((h) => h && typeof h === 'object');
  const vereditoNaSemana = (h) => {
    const d = diaBrasilia(h.veredito?.em);
    return Boolean(d) && d >= inicio && d <= fim;
  };
  const itemHipotese = (h) => ({
    id: h.id ?? null,
    reelId: h.reelId ?? null,
    reelTitulo: cortar(txt(h.reelTitulo || titulos[h.reelId]), MAX_TITULO),
    midiaId: h.midiaId ?? null,
    texto: txt(h.texto),
    veredito: txt(h.veredito?.texto),
    score: finito(h.veredito?.score) ? h.veredito.score : null,
  });
  const doStatus = (s) => hips.filter((h) => h.status === s && vereditoNaSemana(h)).map(itemHipotese);
  const hipoteses = {
    confirmadas: doStatus('confirmada'),
    refutadas: doStatus('refutada'),
    inconclusivas: doStatus('inconclusiva'),
    naoAplicadas: doStatus('nao-aplicada'),
    abertas: hips.filter((h) => h.status === 'aberta').length,
  };
  const ROTULO_STATUS = { confirmadas: 'confirmada', refutadas: 'refutada', inconclusivas: 'inconclusiva', naoAplicadas: 'não aplicada' };
  for (const [k, rot] of Object.entries(ROTULO_STATUS)) {
    for (const h of hipoteses[k]) add(`Hipótese ${rot}${h.reelTitulo ? ` em ${entreAspas(h.reelTitulo)}` : ''}: ${h.texto}${h.veredito ? ` ${h.veredito}` : ''}`);
  }
  if (hipoteses.abertas) add(hipoteses.abertas === 1 ? '1 hipótese segue em teste.' : `${n0(hipoteses.abertas)} hipóteses seguem em teste.`);

  // ---- público
  const diario = entrada.publico?.diario;
  const seg = seguidoresDaSemana(diario, semana);
  const alcNao = naoSeguidoresDaSemana(diario, semana, { hoje: entrada.hoje ?? null });
  const frasesPublico = [];
  if (finito(seg.variacao)) {
    const v = seg.variacao;
    const mudanca = v > 0 ? `${n0(v)} a mais` : v < 0 ? `${n0(-v)} a menos` : 'o mesmo número';
    frasesPublico.push(`Seguidores: ${n0(seg.inicio)} em ${dataCurta(seg.diaInicio)} e ${n0(seg.fim)} em ${dataCurta(seg.diaFim)} (${mudanca}).`);
  } else if (finito(seg.inicio)) {
    frasesPublico.push(`Seguidores: ${n0(seg.inicio)} em ${dataCurta(seg.diaInicio)} (uma leitura só na semana).`);
  } else frasesPublico.push('Seguidores da semana: sem dado (o público é lido uma vez por dia com o Instagram conectado).');
  if (alcNao) {
    frasesPublico.push(`${pct(alcNao.pct)} do alcance da semana veio de contas que não seguem o perfil (alcance diário somado de ${alcNao.dias === 1 ? '1 dia' : `${n0(alcNao.dias)} dias`}).`);
  } else frasesPublico.push('Alcance de quem não segue o perfil: sem dado nesta semana.');
  for (const f of lista(entrada.publico?.frases).slice(0, 2)) if (txt(f)) frasesPublico.push(txt(f));
  const publico = {
    seguidores: seg,
    pctNaoSeguidores: alcNao?.pct ?? null,
    frases: frasesPublico,
  };
  // frase sem número não vira fato: não tem o que conferir
  for (const f of frasesPublico) if (/\d/.test(f)) add(f);

  // ---- stories
  const st = storiesDaSemana(entrada.stories);
  let stories = null;
  if (st) {
    const frase = `Stories em ${n0(st.dias)} dos 7 dias. Views: ${n0(st.views)}; saídas: ${n0(st.saidas)}; respostas: ${n0(st.respostas)}; cliques no link: ${n0(st.cliques)}.`;
    stories = { dias: st.dias, views: st.views, saidas: st.saidas, respostas: st.respostas, cliques: st.cliques, frase, porDia: st.porDia };
    add(frase);
  }

  // ---- próxima semana: as peças de feed do cronograma, com a meta e as recomendações de cada uma
  const prox = somarSemanas(semana, 1);
  const iProx = intervaloSemana(prox);
  const proximaSemana = lista(entrada.proximas).map((x) => {
    const m = x?.rec?.meta ?? null;
    const itens = lista(x?.rec?.itens).slice(0, 3).map((i) => {
      const base = txt(i?.texto || i?.titulo || i?.nomeValor);
      return base ? `${ACAO[i.acao] ?? 'Fazer mais'}: ${base}${txt(i.aviso) ? ` (${txt(i.aviso)})` : ''}` : '';
    });
    const testar = x?.rec?.testar ? txt(x.rec.testar.texto || x.rec.testar.nomeValor) : '';
    return {
      reelId: x?.reelId ?? null,
      dia: x?.dia ?? null,
      titulo: cortar(txt(x?.titulo) || 'Sem título', MAX_TITULO),
      tipo: x?.tipo ?? null,
      peca: FEED.includes(x?.peca) ? x.peca : 'reel',
      pilarNome: x?.pilarNome ? txt(x.pilarNome) : null,
      meta: m ? { rotulo: txt(m.objetivo?.rotulo) || null, base: finito(m.base) ? m.base : null, meta: finito(m.meta) ? m.meta : null, baseN: finito(m.baseN) ? m.baseN : null } : null,
      recomendacoes: [...itens, testar ? `Testar: ${testar}` : ''].filter(Boolean),
    };
  });
  add(proximaSemana.length
    ? `Próxima semana (${dataCurta(iProx.inicio)} a ${dataCurta(iProx.fim)}): ${proximaSemana.length === 1 ? '1 peça' : `${n0(proximaSemana.length)} peças`} de feed no cronograma.`
    : `Próxima semana (${dataCurta(iProx.inicio)} a ${dataCurta(iProx.fim)}): nenhuma peça de feed no cronograma.`);
  for (const x of proximaSemana) {
    const cab = cabecalho(x);
    if (x.meta && finito(x.meta.meta)) {
      // a meta da peça é sempre a do objetivo do tipo dela
      const rot = metricaDoObjetivo(x.tipo, null);
      add(`${cab}: meta de ${rot} ${qtd(x.meta.meta)} (mediana ${qtd(x.meta.base)}${finito(x.meta.baseN) ? ` das últimas ${n0(x.meta.baseN)}` : ''}).`);
    } else add(`${cab}: ainda sem meta (falta base de comparação).`);
  }

  // o porquê de cada peça e as recomendações da próxima semana por último: se o teto de fatos chegar, sai o detalhe
  for (const x of pecas) {
    for (const f of x.porque.bem.slice(0, 2)) add(`Por que ${entreAspas(x.titulo)} foi bem: ${f}`);
    for (const f of x.porque.mal.slice(0, 2)) add(`Por que ${entreAspas(x.titulo)} foi mal: ${f}`);
  }
  for (const x of proximaSemana) for (const r of x.recomendacoes.slice(0, 2)) add(`Pra ${entreAspas(x.titulo)}: ${r}`);

  return {
    versao: VERSAO,
    semana,
    inicio,
    fim,
    geradoEm: entrada.geradoEm ?? null,
    geradoPor: entrada.geradoPor ?? null,
    // a última leitura dos nossos posts que este resumo usou (null: não se sabe)
    lidoEm: lidoMs != null ? new Date(lidoMs).toISOString() : null,
    resumo: {
      publicadas,
      metasBatidas,
      medianaScore: nums.medianaScore,
      taxaAcerto: nums.taxaAcerto,
      provisorias: nums.provisorias,
      comAnuncio: nums.comAnuncio,
      semAvaliacao: nums.semAvaliacao,
      parcial,
      anterior: ant ? { metasBatidas: ant.metasBatidas, medianaScore: ant.medianaScore } : null,
      frases,
    },
    pecas,
    destaques: { melhor: melhor?.midiaId ?? null, pior: pior?.midiaId ?? null },
    mecanismos: { insights, hipoteses },
    publico,
    stories,
    proximaSemana,
    fatos,
    leituraIa: null,
  };
}

// a métrica do objetivo como entra no meio da frase ("salvamentos"), a mesma do diagnóstico
function metricaDoObjetivo(tipo, objetivo) {
  const obj = objetivoDoTipo(tipo);
  return objetivo?.id && objetivo.id !== obj.id ? minuscula(String(objetivo.rotulo ?? '').trim()) || obj.curto : obj.curto;
}

// o fato do objetivo de uma peça, com os números que a aba mostra (valor, base, meta e o × do score)
function fatoObjetivo(x, cab, tipoRot) {
  const o = x.objetivo ?? {};
  const rotulo = metricaDoObjetivo(x.tipo, o);
  const provisorio = o.provisorio ? ' Número provisório: a peça tem menos de 7 dias.' : '';
  const anuncio = x.impulsionado === true ? ' Teve anúncio: fica fora da conta da semana.' : '';
  if (!finito(o.valor)) {
    return `${cab}: ${rotulo} sem dado${o.id === 'interesse' ? ' (informe os números do app no painel do post)' : ''}.${anuncio}`;
  }
  if (!finito(o.base)) return `${cab}: ${rotulo} ${qtd(o.valor)}, ainda sem base de comparação.${provisorio}${anuncio}`;
  const deQuem = o.baseDe === 'formato' ? 'do mesmo formato' : x.tipo ? `de ${tipoRot}` : 'sem tipo';
  const quantas = finito(o.baseN) ? `das últimas ${n0(o.baseN)} peças` : 'das últimas peças';
  const veredito = typeof o.bateuMeta === 'boolean' ? ` ${o.bateuMeta ? 'Bateu' : 'Não bateu'}${finito(o.score) ? ` (${vezesDaPeca(o.score, o.bateuMeta)} a base)` : ''}.` : '';
  return `${cab}: ${rotulo} ${qtdAte(o.valor, o.meta)}, contra ${qtd(o.base)} na mediana ${quantas} ${deQuem}. Meta de 2×: ${qtd(o.meta)}.${veredito}${provisorio}${anuncio}`;
}
