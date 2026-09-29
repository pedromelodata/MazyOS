// Monitoramento: as 3 abas de acompanhamento da planilha oficial "Calendário Editorial e Monitoramento"
// (Métricas Orgânico, Métricas Pago e Consolidado Semanal), dentro de Métricas.
//  - Orgânico: uma linha por post do mês. Entra todo item do cronograma com data no mês e, fora dele, todo
//    post nosso do Instagram publicado no mês (não some do fechamento). O Instagram preenche sozinho pelo
//    cache da sincronização quando o link do post casa com uma mídia nossa (mesmoPost); o que a API não dá,
//    e o Facebook inteiro, é à mão
//  - Pago: por semana (segunda a domingo, cortada no mês, igual à planilha) e por conjunto de anúncios
//  - Consolidado: o fechamento de cada semana, com as colunas que a planilha calcula sozinha
// Guardado em data/monitoramento.json (lerJson/gravarJson: escrita atômica), fora do db.json.
// Regra da planilha: nunca escalar o orçamento de um conjunto mais de 20% na semana. A comparação é pelo
// gasto por dia: a primeira e a última semana são cortadas no mês, e 4 dias contra 7 não é escalar.
import { carregar, lerJson, gravarJson, falha, agora, novoId, mesmoPost, TRACOS } from './db.mjs';

const ARQUIVO = 'monitoramento.json';
const META_SPLIT = { mei: 30, me: 70 };
const LIMITE_ESCALA = 0.2;

export const CAMPOS_ORGANICO = [
  'alcance', 'impressoes', 'curtidas', 'comentarios', 'compartilhamentos', 'salvamentos',
  'visitasPerfil', 'seguidores', 'cliquesBio', 'reproducoes', 'tempoMedio', 'conclusao',
];
const REDES = ['instagram', 'facebook'];
export const CAMPOS_PAGO = [
  'investimento', 'impressoes', 'alcance', 'frequencia', 'ctr', 'cpc', 'cpm',
  'leadsBrutos', 'leadsQualificados', 'leadsDesqualificados',
];
const CAMPOS_CONSOLIDADO = ['cadastrosOrganico', 'cadastrosMeta', 'cadastrosGoogle', 'pctMei', 'pctMe'];
const PERCENTUAIS = new Set(['conclusao', 'ctr', 'pctMei', 'pctMe']);
const INTEIROS = new Set([
  'alcance', 'impressoes', 'curtidas', 'comentarios', 'compartilhamentos', 'salvamentos', 'visitasPerfil',
  'seguidores', 'cliquesBio', 'reproducoes', 'leadsBrutos', 'leadsQualificados', 'leadsDesqualificados',
  'cadastrosOrganico', 'cadastrosMeta', 'cadastrosGoogle',
]);
const CANAIS = ['Meta', 'Google'];
// os conjuntos da planilha de outubro/2026. Mês sem lista própria herda a do último mês que tem
const CONJUNTOS_PADRAO = [
  { id: 'cj_meta_mei', canal: 'Meta', nome: 'Leads, Conjunto MEI (R$600/mês)' },
  { id: 'cj_meta_me', canal: 'Meta', nome: 'Leads, Conjunto ME Simples (R$1.400/mês)' },
  { id: 'cj_meta_perfil', canal: 'Meta', nome: 'Visitas ao Perfil (R$500/mês)' },
  { id: 'cj_google_pesquisa', canal: 'Google', nome: 'Rede de Pesquisa (R$500/mês)' },
];
const FORMATO_MIDIA = { REELS: 'Reel', CAROUSEL_ALBUM: 'Carrossel', FEED: 'Post' };
const PECA = { reel: 'Reel', carrossel: 'Carrossel', estatico: 'Estático', stories: 'Stories' };

// ---------- arquivo ----------

let mon = null;
let fila = Promise.resolve();
const vazio = () => ({ versao: 1, organico: {}, pago: {}, consolidado: {} });
const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

async function ler() {
  if (!mon) {
    const bruto = objeto(await lerJson(ARQUIVO, null));
    mon = { ...vazio(), ...bruto, organico: objeto(bruto.organico), pago: objeto(bruto.pago), consolidado: objeto(bruto.consolidado) };
  }
  return mon;
}

function gravar() {
  const proxima = fila.then(() => gravarJson(ARQUIVO, mon));
  fila = proxima.catch((e) => console.error('Falha ao gravar monitoramento.json:', e.message));
  return proxima;
}

// ---------- datas ----------

const MES = /^(\d{4})-(0[1-9]|1[0-2])$/;
function conferirMes(s) {
  const m = MES.exec(String(s ?? ''));
  if (!m || Number(m[1]) < 2000 || Number(m[1]) > 2100) throw falha(400, 'Mês precisa ser AAAA-MM.');
  return s;
}
const doisDig = (n) => String(n).padStart(2, '0');
function mesVizinho(mes, delta) {
  const [a, m] = mes.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${doisDig(d.getUTCMonth() + 1)}`;
}

// semanas de segunda a domingo, cortadas no mês (01/10/2026 é quinta: semana 1 = 01 a 04/10)
export function semanasDoMes(mes) {
  const [a, m] = mes.split('-').map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const semanas = [];
  let inicio = 1;
  while (inicio <= ultimo) {
    const dow = new Date(Date.UTC(a, m - 1, inicio)).getUTCDay(); // 0 = domingo
    const fim = Math.min(ultimo, inicio + (dow === 0 ? 0 : 7 - dow));
    semanas.push({
      n: semanas.length + 1,
      inicio: `${mes}-${doisDig(inicio)}`,
      fim: `${mes}-${doisDig(fim)}`,
      dias: fim - inicio + 1,
      periodo: `${doisDig(inicio)} a ${doisDig(fim)}/${doisDig(m)}`,
    });
    inicio = fim + 1;
  }
  return semanas;
}

// dia em Brasília de um timestamp da Graph ("2026-09-18T15:12:25+0000")
const FMT_DIA = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' });
function diaBrasil(ts) {
  const ms = Date.parse(String(ts ?? '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return Number.isFinite(ms) ? FMT_DIA.format(new Date(ms)) : '';
}

// ---------- números ----------

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const soma = (xs) => {
  const v = xs.filter(fin);
  return v.length ? v.reduce((s, x) => s + x, 0) : null;
};
const razao = (a, b) => (fin(a) && fin(b) && b > 0 ? a / b : null);

// valor que chega da tela: número, texto em pt-BR ("1.400,50", "R$ 600", "12,5%") ou vazio (apaga)
export function numero(v, campo) {
  if (v === null || v === undefined || v === '') return null;
  let n = v;
  if (typeof v === 'string') {
    let t = v.trim().replace(/^R\$\s*/i, '').replace(/%$/, '').replace(/\s/g, '');
    if (!t) return null;
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    n = Number(t);
  }
  if (typeof n !== 'number' || !Number.isFinite(n)) throw falha(400, 'Esse campo só aceita número.');
  if (n < 0) throw falha(400, 'Esse campo não aceita número negativo.');
  if (PERCENTUAIS.has(campo) && n > 100) throw falha(400, 'Percentual vai de 0 a 100.');
  if (n > 1e10) throw falha(400, 'Número grande demais.');
  return INTEIROS.has(campo) ? Math.round(n) : Math.round(n * 100) / 100;
}

const semTracos = (s) => String(s ?? '').replace(TRACOS, ', ');
function texto(v, lim) {
  if (v == null) return '';
  if (typeof v !== 'string') throw falha(400, 'Esse campo é texto.');
  const t = semTracos(v).trim().slice(0, lim);
  return /^[\s\-_.·]*$/.test(t) ? '' : t; // "-" solto não é dado
}

// ---------- Orgânico ----------

function autoInstagram(m, diario) {
  if (!m) return {};
  const reel = (m.tipo ?? 'REELS') === 'REELS';
  const o = {
    alcance: m.reach,
    // a Meta trocou impressões por views em 2025 (a Business Suite também mostra views)
    impressoes: m.views,
    curtidas: m.likes,
    comentarios: m.comments,
    compartilhamentos: m.shares,
    salvamentos: m.saved,
    visitasPerfil: m.profileVisits,
    seguidores: diario?.[diaBrasil(m.timestamp)]?.seguidores,
    reproducoes: reel ? m.views : null,
    tempoMedio: reel && fin(m.avgWatchMs) ? Math.round(m.avgWatchMs / 100) / 10 : null,
  };
  return Object.fromEntries(Object.entries(o).filter(([, v]) => fin(v)));
}

function calcular(valores) {
  const engajamento = soma([valores.curtidas, valores.comentarios, valores.compartilhamentos, valores.salvamentos]);
  const temAlgo = engajamento != null || fin(valores.alcance);
  // planilha: Engajamento ÷ Alcance, 0 quando não tem alcance
  const taxa = fin(valores.alcance) && valores.alcance > 0 && engajamento != null ? engajamento / valores.alcance : temAlgo ? 0 : null;
  return { engajamento, taxa };
}

function media(a, pa, b, pb) {
  if (fin(a) && fin(b)) {
    const [x, y] = [fin(pa) ? pa : 0, fin(pb) ? pb : 0];
    return x + y > 0 ? Math.round(((a * x + b * y) / (x + y)) * 10) / 10 : Math.round(((a + b) / 2) * 10) / 10;
  }
  return fin(a) ? a : fin(b) ? b : null;
}

function somaRedes(ig, fb) {
  const v = {};
  for (const k of CAMPOS_ORGANICO) v[k] = soma([ig[k], fb[k]]);
  v.tempoMedio = media(ig.tempoMedio, ig.reproducoes, fb.tempoMedio, fb.reproducoes);
  v.conclusao = media(ig.conclusao, ig.reproducoes, fb.conclusao, fb.reproducoes);
  return v;
}

function resumo(s, n = 90) {
  const linha = semTracos(String(s ?? '').split('\n').map((l) => l.trim()).find(Boolean) ?? '');
  return linha.length > n ? linha.slice(0, n - 1).trimEnd() + '…' : linha;
}

function pilarDe(db, r) {
  if (r.pilarTexto) return semTracos(r.pilarTexto);
  const p = (db.pilares ?? []).find((x) => x.id === Number(r.pilar));
  return p ? `${p.id} · ${p.nome}` : '';
}

function formatoDe(db, r) {
  if (r.formatoTexto) return semTracos(r.formatoTexto);
  if (PECA[r.peca]) return PECA[r.peca];
  const f = r.formatoId && (db.formatos ?? []).find((x) => x.id === r.formatoId);
  return f ? semTracos(f.nome) : '';
}

function linhaOrganica(base, midia, salvo, diario) {
  const auto = autoInstagram(midia, diario);
  const manualIg = objeto(salvo?.instagram);
  const fb = {};
  const ig = {};
  for (const k of CAMPOS_ORGANICO) {
    ig[k] = fin(auto[k]) ? auto[k] : fin(manualIg[k]) ? manualIg[k] : null;
    fb[k] = fin(objeto(salvo?.facebook)[k]) ? salvo.facebook[k] : null;
  }
  const total = somaRedes(ig, fb);
  return {
    ...base,
    midia: midia ? { midiaId: midia.midiaId, tipo: midia.tipo ?? 'REELS', thumb: midia.thumb ?? '', naoListado: Boolean(midia.naoListado) } : null,
    instagram: { valores: ig, auto: Object.keys(auto), ...calcular(ig) },
    facebook: { valores: fb, auto: [], ...calcular(fb) },
    soma: { valores: total, auto: [], ...calcular(total) },
    atualizadoPor: salvo?.atualizadoPor ?? null,
  };
}

function organicoDoMes(db, m, mes) {
  const ig = db.instagram ?? {};
  const midias = [...(ig.proprios ?? []), ...(ig.postsProprios ?? [])];
  const noMes = (dia) => typeof dia === 'string' && dia.startsWith(`${mes}-`);
  const linhas = [];
  const usadas = new Set();
  for (const r of db.reels ?? []) {
    if (!noMes(r.data)) continue;
    const midia = r.permalink ? midias.find((x) => mesmoPost(x.permalink, r.permalink)) : null;
    if (midia) usadas.add(midia.midiaId);
    const chave = `r:${r.id}`;
    const salvo = { ...objeto(midia && m.organico[`m:${midia.midiaId}`]), ...objeto(m.organico[chave]) };
    linhas.push(linhaOrganica({
      chave, reelId: r.id, data: r.data, titulo: resumo(r.ideia || r.tema || 'Sem título'), link: r.permalink ?? '',
      pilar: pilarDe(db, r), formato: formatoDe(db, r), status: r.status ?? null, noCronograma: true,
    }, midia, salvo, ig.diario));
  }
  for (const midia of midias) {
    if (usadas.has(midia.midiaId)) continue;
    const dia = diaBrasil(midia.timestamp);
    if (!noMes(dia)) continue;
    // post ligado a um item do cronograma de outro mês (saiu com atraso) já está lá
    if ((db.reels ?? []).some((r) => r.permalink && mesmoPost(r.permalink, midia.permalink))) continue;
    const chave = `m:${midia.midiaId}`;
    linhas.push(linhaOrganica({
      chave, midiaId: midia.midiaId, data: dia, titulo: resumo(midia.caption) || `${FORMATO_MIDIA[midia.tipo ?? 'REELS']} de ${dia.slice(8, 10)}/${dia.slice(5, 7)}`,
      link: midia.permalink ?? '', pilar: '', formato: FORMATO_MIDIA[midia.tipo ?? 'REELS'] ?? 'Post', status: null, noCronograma: false,
    }, midia, m.organico[chave], ig.diario));
  }
  return linhas.sort((a, b) => a.data.localeCompare(b.data) || a.titulo.localeCompare(b.titulo, 'pt-BR'));
}

// ---------- Pago ----------

function conjuntosDo(m, mes) {
  if (Array.isArray(m.pago[mes]?.conjuntos)) return m.pago[mes].conjuntos;
  const antes = Object.keys(m.pago).filter((k) => k < mes && Array.isArray(m.pago[k]?.conjuntos)).sort().at(-1);
  return antes ? m.pago[antes].conjuntos : CONJUNTOS_PADRAO;
}

// o mês ganha lista própria de conjuntos na primeira escrita (mesmos ids: a semana 1 compara com o mês anterior)
function materializar(m, mes) {
  const atual = objeto(m.pago[mes]);
  m.pago[mes] = {
    conjuntos: Array.isArray(atual.conjuntos) ? atual.conjuntos : structuredClone(conjuntosDo(m, mes)),
    linhas: objeto(atual.linhas),
  };
  return m.pago[mes];
}

const porDia = (v, dias) => (fin(v?.investimento) && dias > 0 ? v.investimento / dias : null);

function pagoDoMes(m, mes) {
  const semanas = semanasDoMes(mes);
  const conjuntos = conjuntosDo(m, mes);
  const salvas = objeto(m.pago[mes]?.linhas);
  const mesAnt = mesVizinho(mes, -1);
  const ultimaAnt = semanasDoMes(mesAnt).at(-1);
  const salvasAnt = objeto(m.pago[mesAnt]?.linhas);
  return semanas.map((s, i) => {
    const linhas = conjuntos.map((cj) => {
      const v = objeto(salvas[`${s.n}:${cj.id}`]);
      const valores = Object.fromEntries(CAMPOS_PAGO.map((k) => [k, fin(v[k]) ? v[k] : null]));
      const antes = i > 0 ? porDia(objeto(salvas[`${s.n - 1}:${cj.id}`]), semanas[i - 1].dias) : porDia(objeto(salvasAnt[`${ultimaAnt.n}:${cj.id}`]), ultimaAnt.dias);
      const agoraDia = porDia(valores, s.dias);
      const variacao = agoraDia != null && antes > 0 ? Math.round((agoraDia / antes - 1) * 10_000) / 10_000 : null;
      return {
        conjuntoId: cj.id,
        canal: cj.canal,
        nome: cj.nome,
        valores,
        ga4: v.ga4 === 'sim' || v.ga4 === 'nao' ? v.ga4 : null,
        taxaQualificacao: razao(valores.leadsQualificados, valores.leadsBrutos),
        cplBruto: razao(valores.investimento, valores.leadsBrutos),
        cplQualificado: razao(valores.investimento, valores.leadsQualificados),
        sugestao: {
          frequencia: fin(razao(valores.impressoes, valores.alcance)) ? Math.round(razao(valores.impressoes, valores.alcance) * 100) / 100 : null,
          cpm: fin(razao(valores.investimento, valores.impressoes)) ? Math.round(razao(valores.investimento, valores.impressoes) * 100_000) / 100 : null,
        },
        variacao,
        escalou: variacao != null && variacao > LIMITE_ESCALA,
      };
    });
    return { ...s, linhas, investimento: soma(linhas.map((l) => l.valores.investimento)) };
  });
}

// ---------- Consolidado ----------

function consolidadoDoMes(m, mes, pago, organico) {
  const salvo = objeto(m.consolidado[mes]);
  const linhas = pago.map((s) => {
    const v = objeto(salvo[s.n]);
    const leads = (canal) => soma(s.linhas.filter((l) => l.canal === canal).map((l) => l.valores.leadsBrutos));
    const valores = Object.fromEntries(CAMPOS_CONSOLIDADO.map((k) => [k, fin(v[k]) ? v[k] : null]));
    const sugestao = {
      cadastrosMeta: leads('Meta'),
      cadastrosGoogle: leads('Google'),
      pctMei: fin(valores.pctMe) ? Math.round((100 - valores.pctMe) * 100) / 100 : null,
      pctMe: fin(valores.pctMei) ? Math.round((100 - valores.pctMei) * 100) / 100 : null,
    };
    const usar = (k) => (fin(valores[k]) ? valores[k] : sugestao[k] ?? null);
    const cadastros = soma([valores.cadastrosOrganico, usar('cadastrosMeta'), usar('cadastrosGoogle')]);
    const pctMei = usar('pctMei');
    // post da semana que mais salvou e compartilhou (Instagram + Facebook)
    let destaque = null;
    for (const l of organico) {
      if (l.data < s.inicio || l.data > s.fim) continue;
      const salv = l.soma.valores.salvamentos ?? 0;
      const comp = l.soma.valores.compartilhamentos ?? 0;
      if (salv + comp > 0 && (!destaque || salv + comp > destaque.salvamentos + destaque.compartilhamentos)) {
        destaque = { chave: l.chave, titulo: l.titulo, salvamentos: salv, compartilhamentos: comp };
      }
    }
    const escalaram = s.linhas.filter((l) => l.escalou).map((l) => l.nome);
    const temGasto = s.linhas.some((l) => fin(l.valores.investimento));
    return {
      n: s.n, inicio: s.inicio, fim: s.fim, periodo: s.periodo, dias: s.dias,
      valores,
      sugestao,
      observacoes: typeof v.observacoes === 'string' ? v.observacoes : '',
      cadastros,
      investimento: s.investimento,
      custoCadastro: razao(s.investimento, cadastros),
      pctMei,
      pctMe: usar('pctMe'),
      gapMei: fin(pctMei) ? Math.round((pctMei - META_SPLIT.mei) * 10) / 10 : null,
      destaque,
      escalou: escalaram.length ? { sim: true, conjuntos: escalaram } : temGasto ? { sim: false, conjuntos: [] } : null,
    };
  });
  const cadastros = soma(linhas.map((l) => l.cadastros));
  const investimento = soma(linhas.map((l) => l.investimento));
  return { linhas, total: { cadastros, investimento, custoCadastro: razao(investimento, cadastros) }, metaSplit: META_SPLIT };
}

// ---------- montagem ----------

export async function montarMes(mesPedido) {
  const alvo = conferirMes(mesPedido);
  const db = await carregar();
  const m = await ler();
  const organico = organicoDoMes(db, m, alvo);
  const pago = pagoDoMes(m, alvo);
  return {
    mes: alvo,
    semanas: semanasDoMes(alvo),
    sincronizadoEm: db.instagram?.sincronizadoEm ?? null,
    organico: { linhas: organico },
    pago: { conjuntos: conjuntosDo(m, alvo), semanas: pago },
    consolidado: consolidadoDoMes(m, alvo, pago, organico),
  };
}

function carimbo(obj, autor) {
  obj.atualizadoEm = agora();
  obj.atualizadoPor = autor ?? null;
}

async function editarOrganico(alvo, b, autor) {
  const chave = String(b.chave ?? '');
  if (!/^(r|m):[\w.-]{1,64}$/.test(chave)) throw falha(400, 'Post inválido.');
  if (!REDES.includes(b.rede)) throw falha(400, 'Rede precisa ser instagram ou facebook.');
  if (!CAMPOS_ORGANICO.includes(b.campo)) throw falha(400, 'Campo desconhecido.');
  const db = await carregar();
  const linha = organicoDoMes(db, await ler(), alvo).find((l) => l.chave === chave);
  if (!linha) throw falha(404, 'Esse post não está no mês.');
  if (b.rede === 'instagram' && linha.instagram.auto.includes(b.campo)) throw falha(409, 'Esse número vem do Instagram e é atualizado na sincronização.');
  const valor = numero(b.valor, b.campo);
  const m = await ler();
  const reg = objeto(m.organico[chave]);
  reg[b.rede] = { ...objeto(reg[b.rede]), [b.campo]: valor };
  if (valor == null) delete reg[b.rede][b.campo];
  carimbo(reg, autor);
  m.organico[chave] = reg;
  await gravar();
}

async function editarPago(alvo, b, autor) {
  const m = await ler();
  const semana = semanasDoMes(alvo).find((s) => s.n === Number(b.semana));
  if (!semana) throw falha(400, 'Semana inválida.');
  const bloco = materializar(m, alvo);
  if (!bloco.conjuntos.some((c) => c.id === b.conjuntoId)) throw falha(404, 'Esse conjunto não está no mês.');
  const chave = `${semana.n}:${b.conjuntoId}`;
  const reg = objeto(bloco.linhas[chave]);
  if (b.campo === 'ga4') {
    if (![null, '', 'sim', 'nao'].includes(b.valor ?? null)) throw falha(400, 'GA4 confere precisa ser sim, nao ou vazio.');
    if (b.valor) reg.ga4 = b.valor;
    else delete reg.ga4;
  } else if (CAMPOS_PAGO.includes(b.campo)) {
    const valor = numero(b.valor, b.campo);
    if (valor == null) delete reg[b.campo];
    else reg[b.campo] = valor;
  } else throw falha(400, 'Campo desconhecido.');
  carimbo(reg, autor);
  bloco.linhas[chave] = reg;
  await gravar();
}

function conferirConjunto(b, atual = {}) {
  const canal = b.canal ?? atual.canal;
  if (!CANAIS.includes(canal)) throw falha(400, 'Canal precisa ser Meta ou Google.');
  const nome = 'nome' in b ? texto(b.nome, 120) : atual.nome;
  if (!nome) throw falha(400, 'O conjunto precisa de um nome.');
  return { canal, nome };
}

async function conjuntos(req, alvo, id, b, autor) {
  const m = await ler();
  const bloco = materializar(m, alvo);
  if (req.method === 'POST' && !id) {
    if (bloco.conjuntos.length >= 20) throw falha(400, 'No máximo 20 conjuntos por mês.');
    bloco.conjuntos.push({ id: novoId('cj'), ...conferirConjunto(b) });
  } else {
    const cj = id && bloco.conjuntos.find((c) => c.id === id);
    if (!cj) throw falha(404, 'Esse conjunto não está no mês.');
    if (req.method === 'PUT') Object.assign(cj, conferirConjunto(b, cj));
    else if (req.method === 'DELETE') {
      bloco.conjuntos.splice(bloco.conjuntos.indexOf(cj), 1);
      for (const k of Object.keys(bloco.linhas)) if (k.endsWith(`:${id}`)) delete bloco.linhas[k];
    } else throw falha(405, 'Método não permitido.');
  }
  bloco.atualizadoEm = agora();
  bloco.atualizadoPor = autor ?? null;
  await gravar();
}

async function editarConsolidado(alvo, b, autor) {
  const m = await ler();
  const semana = semanasDoMes(alvo).find((s) => s.n === Number(b.semana));
  if (!semana) throw falha(400, 'Semana inválida.');
  const doMes = objeto(m.consolidado[alvo]);
  const reg = objeto(doMes[semana.n]);
  if (b.campo === 'observacoes') {
    const t = texto(b.valor ?? '', 500);
    if (t) reg.observacoes = t;
    else delete reg.observacoes;
  } else if (CAMPOS_CONSOLIDADO.includes(b.campo)) {
    const valor = numero(b.valor, b.campo);
    if (valor == null) delete reg[b.campo];
    else reg[b.campo] = valor;
  } else throw falha(400, 'Campo desconhecido.');
  carimbo(reg, autor);
  doMes[semana.n] = reg;
  m.consolidado[alvo] = doMes;
  await gravar();
}

// /api/monitoramento/:mes[/organico|/pago|/consolidado|/conjuntos[/:id]] (mesmo login das outras rotas)
export async function rota(req, res, partes, { json, corpoJson, autor }) {
  const [mesPedido, aba, id, ...sobra] = partes;
  const metodo = req.method;
  if (!mesPedido || sobra.length) return json(res, 404, { erro: 'Rota não existe.' });
  const alvo = conferirMes(mesPedido);
  if (!aba) {
    if (metodo !== 'GET') return json(res, 405, { erro: 'Método não permitido.' });
    return json(res, 200, await montarMes(alvo));
  }
  if (aba === 'conjuntos') {
    if (!(metodo === 'POST' ? !id : ['PUT', 'DELETE'].includes(metodo) && id)) return json(res, 405, { erro: 'Método não permitido.' });
    const b = metodo === 'DELETE' ? {} : await corpoJson(req, 20_000);
    await conjuntos(req, alvo, id, b, autor);
    return json(res, metodo === 'POST' ? 201 : 200, await montarMes(alvo));
  }
  if (id) return json(res, 404, { erro: 'Rota não existe.' });
  const editar = { organico: editarOrganico, pago: editarPago, consolidado: editarConsolidado }[aba];
  if (!editar) return json(res, 404, { erro: 'Rota não existe.' });
  if (metodo !== 'PUT') return json(res, 405, { erro: 'Método não permitido.' });
  await editar(alvo, await corpoJson(req, 20_000), autor);
  return json(res, 200, await montarMes(alvo));
}
