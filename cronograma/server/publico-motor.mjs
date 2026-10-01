// Público (SPEC-METRICAS.md §3.6 e §3.7): o motor puro das leituras de público da conta, do público pago
// por post e da tela do app, e das partes puras da captura de stories. Só importa estatistica.mjs e
// instagram-motor.mjs, os dois puros (nada de disco, rede ou relógio escondido: quem precisa de "agora" recebe
// por parâmetro), pra testar sem banco. Decisões:
//  - a Graph devolve quebra de dois jeitos (total_value.breakdowns com dimension_keys e results, e o antigo
//    values[].value com mapa "F.25-34"): os dois viram [{ ...chaves, valor }] com os nossos nomes (idade,
//    genero, cidade, pais, tipo, seguidor); valor que não é número some (vazio é "sem dado", nunca 0)
//  - célula com menos de 5 pessoas nunca vira frase nem aparece sozinha (termos da Meta e LGPD): entra na
//    base e conta em "ocultos". Soma de células (abaixo de 35, persona) só vira número com 5 ou mais
//  - toda frase de demografia diz a fonte e a base ("Dos 109 seguidores com dado (30 dias)"). Sem o
//    cruzamento idade e gênero, gênero e idade saem em frases separadas, sem juntar os dois
//  - persona é recorte de idade e gênero: sem o cruzamento, as que dependem de gênero (B e C) ficam sem
//    dado (nada de supor que idade e gênero são independentes)
//  - online_followers vem nas horas do Pacífico: a troca pra Brasília usa a diferença dos fusos NA data
//    (com o horário de verão dos EUA a diferença passa de +5h pra +4h)
//  - "nossos horários" compara o alcance com a mediana do mesmo formato (reel com reel, feed com
//    carrossel), sem post com anúncio e sem os de menos de 72h (alcance ainda subindo)
//  - alcance diário somado por semana conta a mesma conta de novo a cada dia: a frase diz "somado"
// Revisão de 30/09 (achados da revisão):
//  - soma que junta grupo de 1 a 4 pessoas com grupo visível (menos de 35, segmento, persona, gênero tirado do
//    cruzamento) não sai exata: ao lado das células visíveis, a diferença devolveria o grupo pequeno. Sai em
//    múltiplo de 5 com "cerca de" (na frase) e sem a contagem (na lista), marcada "aproximado"
//  - idade e gênero de um cartão saem de UMA leitura (a mais nova que tem algum dos três): foto antiga de idade
//    ou gênero não passa por cima do cruzamento novo, nem o contrário. Cidade e país podem ser de leitura
//    anterior, e a frase diz de quando
//  - público do post pela tela do app: grupo só aparece (frase ou lista "visiveis") com a base em PESSOAS
//    conhecida (pessoasNaBase: as contas que a tela mostra, senão o alcance do post, ou o maior entre curtidas e
//    salvamentos na base de contas com engajamento; visualização nunca é pessoa).
//    Sem a base, nada de grupo (falha fechada)
//  - "O restante são principalmente..." só quando os grupos citados cobrem 60% do restante
//  - story: só erro 100 que fala da métrica (cita o nome ou o jeito de pedir) é recusa de 7 dias; story que sumiu
//    e erro passageiro são erro daquele story. A "ultima" leitura junta campo a campo (a métrica que falhou nesta
//    hora fica com o número da hora anterior) e leitura sem número nenhum não entra
import { metricasRecusadas, recusaDeMetrica } from './instagram-motor.mjs';
import {
  FUSO, finito, mediana, media, log2Razao, msDe, offsetMinutos, horaBrasilia, somarDias, diasEntre, semanaIso,
  intervaloSemana, pct as pctTexto, n0, reais, vezes, fatorDeScore, listaPt, dataCurta, diaBrasilia, inicioDoDia, SEM_DADO,
} from './estatistica.mjs';

export const MINIMO_CELULA = 5;
export const FAIXAS_IDADE = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const MENOS_35 = ['13-17', '18-24', '25-34'];
export const GENEROS = ['F', 'M', 'U'];
export const ROTULO_GENERO = { F: 'Mulheres', M: 'Homens', U: 'Não informado' };
const NOME_GENERO = { F: 'mulheres', M: 'homens', U: 'pessoas sem gênero informado' };
export const BASES_APP = ['visualizacoes', 'contas-alcancadas', 'contas-engajadas'];
export const ROTULO_BASE_APP = { visualizacoes: 'visualizações', 'contas-alcancadas': 'contas alcançadas', 'contas-engajadas': 'contas com engajamento' };
export const ROTULO_TIPO_CONTEUDO = { REEL: 'Reels', POST: 'Posts', CAROUSEL_CONTAINER: 'Carrosséis', STORY: 'Stories', AD: 'Anúncios' };
const PACIFICO = 'America/Los_Angeles';
const HORA_MS = 3_600_000;
// travessão e meia-risca montados por código (regra dura: nenhum dos dois no fonte)
const TRACO = new RegExp(`\\s*[${String.fromCharCode(0x2013, 0x2014)}]\\s*`, 'g');

const lista = (v) => (Array.isArray(v) ? v : []);
const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);
const arred = (x, casas = 1) => (finito(x) ? Math.round(x * 10 ** casas) / 10 ** casas : null);
const somaOuNull = (xs) => {
  const v = lista(xs).filter(finito);
  return v.length ? v.reduce((a, b) => a + b, 0) : null;
};
const soma = (xs) => lista(xs).filter(finito).reduce((a, b) => a + b, 0);
const atribuir = (o, k, v) => {
  if (finito(v)) o[k] = v;
};
const semTraco = (s) => String(s ?? '').replace(TRACO, ', ').replace(/\s+/g, ' ').trim();
const maiuscula = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// número da Graph; a Marketing API manda texto ("12.34")
export function numeroApi(v) {
  if (finito(v)) return v;
  if (typeof v === 'string' && /^\s*-?\d+(\.\d+)?\s*$/.test(v)) return Number(v);
  return null;
}

// ---------- quebra da Graph ----------

const NOME_CHAVE = {
  age: 'idade', gender: 'genero', city: 'cidade', country: 'pais', media_product_type: 'tipo', follow_type: 'seguidor',
  follower_type: 'seguidor', story_navigation_action_type: 'navegacao', action_type: 'acao', contact_button_type: 'botao', region: 'regiao',
};
const nomeChave = (k) => NOME_CHAVE[String(k ?? '').trim()] ?? String(k ?? '').trim();
const MAIUSCULAS = new Set(['seguidor', 'tipo', 'navegacao', 'acao', 'botao']);

function normalGenero(g) {
  const s = String(g ?? '').trim().toUpperCase();
  return { FEMALE: 'F', MALE: 'M', UNKNOWN: 'U' }[s] ?? s;
}
function valorChave(k, v) {
  const s = String(v ?? '').trim();
  if (k === 'genero') return normalGenero(s);
  return MAIUSCULAS.has(k) ? s.toUpperCase() : s;
}

// mapa do formato antigo: a chave diz a dimensão pelo nome da métrica
function chavesDoMapa(metrica, chave) {
  const m = String(metrica ?? '');
  if (/gender_age/.test(m)) {
    const [g, i] = String(chave).split('.');
    return { genero: normalGenero(g), idade: String(i ?? '').trim() };
  }
  if (/city/.test(m)) return { cidade: String(chave).trim() };
  if (/country/.test(m)) return { pais: String(chave).trim() };
  if (/online/.test(m)) return { hora: Number(chave) };
  return { chave: String(chave) };
}

// resposta da Graph (insights com breakdown) → [{ metrica, ...chaves, valor }] com os nossos nomes de chave.
// Aceita total_value.breakdowns (dimension_keys + results[].dimension_values) e values[].value em mapa.
// Resultado sem número, ou com chaves e valores de tamanhos diferentes, fica de fora (não vira zero)
export function parseBreakdown(resposta) {
  const saida = [];
  for (const x of lista(resposta?.data)) {
    const metrica = typeof x?.name === 'string' ? x.name : null;
    const com = (o) => (metrica ? { metrica, ...o } : o);
    for (const b of lista(x?.total_value?.breakdowns)) {
      const chaves = lista(b?.dimension_keys).map(nomeChave);
      if (!chaves.length) continue;
      for (const r of lista(b?.results)) {
        const valor = numeroApi(r?.value);
        const vals = lista(r?.dimension_values);
        if (valor == null || vals.length !== chaves.length) continue;
        const item = {};
        chaves.forEach((k, i) => {
          item[k] = valorChave(k, vals[i]);
        });
        saida.push(com({ ...item, valor }));
      }
    }
    for (const v of lista(x?.values)) {
      const mapa = objeto(v?.value);
      if (!mapa) continue;
      for (const [chave, bruto] of Object.entries(mapa)) {
        const valor = numeroApi(bruto);
        if (valor == null) continue;
        saida.push(com({ ...chavesDoMapa(metrica, chave), valor, ...(v.end_time ? { fim: v.end_time } : {}) }));
      }
    }
  }
  return saida;
}

// total de cada métrica da resposta: total_value.value ou a soma dos values numéricos (janela de 1 dia)
export function totaisDe(resposta) {
  const o = {};
  for (const x of lista(resposta?.data)) {
    if (typeof x?.name !== 'string') continue;
    const t = numeroApi(x?.total_value?.value);
    if (t != null) {
      o[x.name] = t;
      continue;
    }
    const vs = lista(x?.values).map((v) => numeroApi(v?.value)).filter(finito);
    if (vs.length) o[x.name] = vs.reduce((a, b) => a + b, 0);
  }
  return o;
}

// alcance ou views de um dia por seguidor e não seguidor (follow_type: FOLLOWER, NON_FOLLOWER, UNKNOWN)
function porSeguidor(resposta, metrica) {
  const itens = parseBreakdown(resposta).filter((i) => i.seguidor && (!i.metrica || i.metrica === metrica));
  const de = (k) => somaOuNull(itens.filter((i) => i.seguidor === k).map((i) => i.valor));
  const o = {};
  atribuir(o, 'seguidores', de('FOLLOWER'));
  atribuir(o, 'naoSeguidores', de('NON_FOLLOWER'));
  atribuir(o, 'desconhecido', de('UNKNOWN'));
  atribuir(o, 'total', totaisDe(resposta)[metrica] ?? somaOuNull(Object.values(o)));
  return Object.keys(o).length ? o : null;
}

// um dia de publico.diario a partir das respostas de cada grupo (grupo que falhou chega null e não entra).
// respostas: { 'alcance-seguidor', tipo, 'views-seguidor', conta, seguiram }
export function agregarDiario(respostas = {}) {
  const r = objeto(respostas) ?? {};
  const d = {};
  if (r['alcance-seguidor']) {
    const a = porSeguidor(r['alcance-seguidor'], 'reach');
    if (a) d.alcance = a;
  }
  if (r['views-seguidor']) {
    const v = porSeguidor(r['views-seguidor'], 'views');
    if (v) d.views = v;
  }
  if (r.tipo) {
    const itens = parseBreakdown(r.tipo).filter((i) => i.tipo);
    const tot = totaisDe(r.tipo);
    const porTipo = (met) => {
      const o = {};
      for (const i of itens) if (i.metrica === met) o[i.tipo] = (o[i.tipo] ?? 0) + i.valor;
      return Object.keys(o).length ? o : null;
    };
    const ap = porTipo('reach');
    if (ap) d.alcancePorTipo = ap;
    const vp = porTipo('views');
    if (vp) d.viewsPorTipo = vp;
    const total = (met) => tot[met] ?? somaOuNull(itens.filter((i) => i.metrica === met).map((i) => i.valor));
    atribuir(d, 'curtidas', total('likes'));
    atribuir(d, 'comentarios', total('comments'));
    atribuir(d, 'salvamentos', total('saves'));
    atribuir(d, 'compartilhamentos', total('shares'));
    atribuir(d, 'interacoes', total('total_interactions'));
  }
  if (r.conta) {
    const tot = totaisDe(r.conta);
    atribuir(d, 'contasEngajadas', tot.accounts_engaged);
    atribuir(d, 'interacoes', tot.total_interactions);
    atribuir(d, 'toquesContato', tot.profile_links_taps);
  }
  if (r.seguiram) {
    // follows_and_unfollows: FOLLOWER = quem começou a seguir; NON_FOLLOWER = quem deixou
    const itens = parseBreakdown(r.seguiram).filter((i) => i.seguidor);
    atribuir(d, 'seguiram', somaOuNull(itens.filter((i) => i.seguidor === 'FOLLOWER').map((i) => i.valor)));
    atribuir(d, 'deixaram', somaOuNull(itens.filter((i) => i.seguidor === 'NON_FOLLOWER').map((i) => i.valor)));
  }
  return d;
}

// ---------- horas do Pacífico ----------

// valorPorHora: { '0': n, ..., '23': n } (ou lista de 24) nas horas do Pacífico do dia de referência →
// 24 números nas horas de Brasília (hora sem número: null). A diferença de fuso é a da data de referência
export function horasPacificoParaBrasilia(valorPorHora, referencia) {
  const saida = Array(24).fill(null);
  const ms = msDe(referencia);
  if (ms == null) return saida;
  const desloc = Math.round((offsetMinutos(FUSO, ms) - offsetMinutos(PACIFICO, ms)) / 60);
  const pares = Array.isArray(valorPorHora) ? valorPorHora.map((v, h) => [h, v]) : Object.entries(objeto(valorPorHora) ?? {});
  for (const [h, bruto] of pares) {
    const hora = Number(h);
    const v = numeroApi(bruto);
    if (!Number.isInteger(hora) || hora < 0 || hora > 23 || v == null) continue;
    const b = (((hora + desloc) % 24) + 24) % 24;
    saida[b] = (saida[b] ?? 0) + v;
  }
  return saida;
}

// itens do online_followers (parseBreakdown: { hora, valor, fim }) → média por hora de Brasília, ou null.
// O end_time é o fim do dia no Pacífico: a referência do fuso é o meio desse dia
export function mediaOnline(itens, referenciaPadrao = null) {
  const porDia = new Map();
  for (const i of lista(itens)) {
    if (!Number.isInteger(i?.hora) || !finito(i?.valor)) continue;
    const k = i.fim ?? '';
    if (!porDia.has(k)) porDia.set(k, {});
    porDia.get(k)[i.hora] = i.valor;
  }
  const dias = [...porDia.entries()]
    .map(([fim, mapa]) => {
      const ref = msDe(fim);
      return horasPacificoParaBrasilia(mapa, ref != null ? ref - 12 * HORA_MS : referenciaPadrao);
    })
    .filter((h) => h.some(finito));
  if (!dias.length) return null;
  return Array.from({ length: 24 }, (_, h) => arred(media(dias.map((d) => d[h]))));
}

// ---------- demografia ----------

const rotuloFaixa = (f) => (f === '65+' ? '65 anos ou mais' : `${String(f).replace('-', ' a ')} anos`);
const faixaCurta = (f) => (f === '65+' ? '65 ou mais' : String(f).replace('-', ' a '));
// "de 25 a 44 anos" a partir de faixas vizinhas; comAnos false: "de 35 a 44" (a segunda da lista, como na fala)
function intervalo(faixas, comAnos = true) {
  const de = String(faixas[0]).split(/[-+]/)[0];
  const ultima = faixas.at(-1);
  if (ultima === '65+') return `de ${de} anos ou mais`;
  return `de ${de} a ${String(ultima).split('-')[1]}${comAnos ? ' anos' : ''}`;
}
const cidadeCurta = (nome) => semTraco(String(nome ?? '').split(',')[0]) || semTraco(nome);
let nomesPais = null;
function nomePais(codigo) {
  const c = String(codigo ?? '').trim();
  if (!/^[A-Z]{2}$/i.test(c)) return semTraco(c);
  try {
    nomesPais ??= new Intl.DisplayNames(['pt-BR'], { type: 'region' });
    return nomesPais.of(c.toUpperCase()) ?? c;
  } catch {
    return c;
  }
}

// percentual de frase: inteiro (64%), uma casa abaixo de 1% (0,6%); nunca 100% quando não é tudo nem 0%
// quando não é nada
function pctF(parte, total) {
  if (!finito(parte) || !finito(total) || total <= 0) return SEM_DADO;
  const p = (parte / total) * 100;
  if (p > 0 && p < 0.95) return pctTexto(arred(p, 1));
  let r = Math.round(p);
  if (r >= 100 && parte < total) r = 99;
  if (r <= 0 && parte > 0) r = 1;
  return pctTexto(r);
}
// percentual que já vem na escala 0 a 100 (tela do app)
const pctD = (v) => pctTexto(arred(v, 1));
const pctNum = (parte, total) => (finito(parte) && finito(total) && total > 0 ? arred((parte / total) * 100, 1) : null);

// soma com grupo pequeno dentro: múltiplo de 5 (a soma exata, menos as células visíveis, devolveria o pequeno)
export const aproxPct = (p) => (finito(p) ? Math.round(p / 5) * 5 : null);
// "cerca de 65%"; nas pontas, "mais de 95%" e "menos de 5%" (nunca "cerca de 100%" quando não é tudo)
export function textoAprox(p) {
  const r = aproxPct(p);
  if (r == null) return SEM_DADO;
  if (r >= 100) return 'mais de 95%';
  if (r <= 0) return 'menos de 5%';
  return `cerca de ${pctTexto(r)}`;
}
// percentual de frase de uma soma: exato, ou "cerca de" quando a soma tem grupo pequeno dentro
const pctSoma = (valor, total, aproximado) =>
  aproximado ? (finito(valor) && finito(total) && total > 0 ? textoAprox((valor / total) * 100) : SEM_DADO) : pctF(valor, total);
// item de lista pra tela: o aproximado vai sem a contagem e com o percentual em múltiplo de 5
const paraTela = (x) => (x.aproximado ? { valor: null, pct: aproxPct(x.pct), aproximado: true } : { valor: x.valor, pct: x.pct });

// soma por chave. pequeno: entrou um grupo de 1 a 4 pessoas; visivel: entrou um de 5 ou mais. Os dois juntos
// numa soma = soma aproximada (a Meta manda uma linha por chave: só o que o app soma, como gênero tirado do
// cruzamento idade e gênero ou o alcance pago somado por faixa, cai aqui)
function somarPor(itens, chave) {
  const m = new Map();
  for (const i of itens) {
    const a = m.get(i[chave]) ?? { valor: 0, pequeno: false, visivel: false };
    a.valor += i.valor;
    if (i.valor > 0 && i.valor < MINIMO_CELULA) a.pequeno = true;
    if (i.valor >= MINIMO_CELULA) a.visivel = true;
    m.set(i[chave], a);
  }
  return m;
}
const totalMapa = (m) => (m.size ? [...m.values()].reduce((a, b) => a + b.valor, 0) : null);

// entrada: itens de uma resposta ([{ idade?, genero?, cidade?, pais?, valor }]) ou
// { idadeGenero, idade, genero, cidade|cidades, pais|paises }. Base de cada dimensão = soma dela (as pessoas
// com dado); total (opcional) troca todas. Cidade e país (a Meta manda só os 45 maiores) usam a maior base
// conhecida. oculto = menos de 5 pessoas; aproximado = soma de grupo visível com grupo oculto (valor e pct
// ficam exatos aqui, pra conta; quem mostra usa paraTela e pctSoma)
export function montarDemografia(entrada, { total = null } = {}) {
  const todos = Array.isArray(entrada)
    ? entrada
    : ['idadeGenero', 'idade', 'genero', 'cidade', 'cidades', 'pais', 'paises'].flatMap((k) => lista(entrada?.[k]));
  const ok = todos.filter((i) => objeto(i) && finito(i.valor) && i.valor >= 0);
  const cruz = ok.filter((i) => FAIXAS_IDADE.includes(i.idade) && GENEROS.includes(i.genero));
  const idadeDireta = ok.filter((i) => FAIXAS_IDADE.includes(i.idade) && !i.genero);
  const generoDireto = ok.filter((i) => GENEROS.includes(i.genero) && !i.idade);
  const cidades = somarPor(ok.filter((i) => typeof i.cidade === 'string' && i.cidade.trim() && !i.idade && !i.genero), 'cidade');
  const paises = somarPor(ok.filter((i) => typeof i.pais === 'string' && i.pais.trim() && !i.idade && !i.genero && !i.cidade), 'pais');
  const porIdade = idadeDireta.length ? somarPor(idadeDireta, 'idade') : somarPor(cruz, 'idade');
  const porGenero = generoDireto.length ? somarPor(generoDireto, 'genero') : somarPor(cruz, 'genero');
  const fixo = finito(total) && total > 0 ? total : null;
  const bases = {
    genero: fixo ?? totalMapa(porGenero),
    idade: fixo ?? totalMapa(porIdade),
    idadeGenero: cruz.length ? fixo ?? cruz.reduce((a, i) => a + i.valor, 0) : null,
  };
  const conhecida = Math.max(0, ...[bases.genero, bases.idade, bases.idadeGenero].filter(finito));
  bases.cidade = fixo ?? (conhecida || totalMapa(cidades));
  bases.pais = fixo ?? (conhecida || totalMapa(paises));
  const linha = (valor, base, aproximado = false) => ({
    valor, pct: pctNum(valor, base), oculto: valor < MINIMO_CELULA, ...(aproximado && valor >= MINIMO_CELULA ? { aproximado: true } : {}),
  });
  const doMapa = (a, base) => linha(a.valor, base, a.pequeno && a.visivel);
  const celulas = new Map();
  for (const i of cruz) {
    const k = `${i.idade}|${i.genero}`;
    celulas.set(k, (celulas.get(k) ?? 0) + i.valor);
  }
  const ordenar = (m, base, nome) =>
    [...m.entries()].map(([k, a]) => ({ nome: nome(k), ...doMapa(a, base) })).sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome, 'pt-BR'));
  return {
    base: bases.genero ?? bases.idade ?? bases.idadeGenero ?? bases.cidade ?? bases.pais ?? null,
    bases,
    temCruzamento: cruz.length > 0,
    genero: GENEROS.filter((g) => porGenero.has(g)).map((g) => ({ id: g, rotulo: ROTULO_GENERO[g], ...doMapa(porGenero.get(g), bases.genero) })),
    idade: FAIXAS_IDADE.filter((f) => porIdade.has(f)).map((f) => ({ faixa: f, rotulo: rotuloFaixa(f), ...doMapa(porIdade.get(f), bases.idade) })),
    idadeGenero: cruz.length
      ? FAIXAS_IDADE.filter((f) => GENEROS.some((g) => celulas.has(`${f}|${g}`))).map((f) => ({
          faixa: f,
          celulas: Object.fromEntries(GENEROS.map((g) => [g, celulas.has(`${f}|${g}`) ? linha(celulas.get(`${f}|${g}`), bases.idadeGenero) : null])),
        }))
      : null,
    cidades: ordenar(cidades, bases.cidade, (k) => semTraco(k)),
    paises: ordenar(paises, bases.pais, (k) => k),
  };
}

const FONTES_FRASE = {
  seguidores: ['Dos', 'seguidores'],
  engajados: ['Das', 'contas engajadas'],
  alcancados: ['Das', 'contas alcançadas'],
};
const JANELA_TEXTO = { this_month: '30 dias', this_week: '7 dias' };
function prefixo(fonte, janela, base) {
  const [artigo, nome] = FONTES_FRASE[fonte] ?? ['Das', semTraco(fonte) || 'contas'];
  return `${artigo} ${n0(base)} ${nome} com dado${JANELA_TEXTO[janela] ? ` (${JANELA_TEXTO[janela]})` : ''}`;
}
// depois dos dois pontos da base: "mulheres abaixo de 35", "o maior grupo", "cerca de 65%" (nome de cidade e
// país fica)
const minusculaInicial = (s) => s.replace(/^(Mulheres|Homens|O|A|Cerca|Mais|Menos|Pela)\b/, (m) => m.toLowerCase());

function fraseGenero(d) {
  const base = d.bases.genero;
  if (!finito(base)) return null;
  // mulheres e homens pelo tamanho; "sem gênero informado" só com 5% ou mais, sempre por último. Gênero tirado
  // do cruzamento com célula oculta dentro sai "cerca de" (menos as células visíveis da pirâmide, a conta exata
  // devolveria a oculta)
  const fm = d.genero.filter((g) => g.id !== 'U' && !g.oculto).sort((a, b) => b.valor - a.valor);
  if (!fm.length) return null;
  const u = d.genero.find((g) => g.id === 'U' && !g.oculto && g.pct >= 5);
  const partes = fm.map((g, i) => `${pctSoma(g.valor, base, g.aproximado)} ${i === 0 ? 'são ' : ''}${NOME_GENERO[g.id]}`);
  if (u) partes.push(`${pctSoma(u.valor, base, u.aproximado)} sem gênero informado`);
  return { texto: `${maiuscula(listaPt(partes))}.`, base };
}

function celulasDe(d) {
  const saida = [];
  for (const l of d.idadeGenero ?? []) for (const g of GENEROS) if (l.celulas[g]) saida.push({ faixa: l.faixa, genero: g, ...l.celulas[g] });
  return saida;
}

// soma de grupos que vira número (menos de 35, segmento, persona): só com pelo menos um grupo visível dentro
// (frase feita só de células ocultas não sai). Com grupo oculto (ou já aproximado) dentro, a soma é aproximada:
// exata, menos os grupos visíveis que a tela mostra, ela devolveria o oculto por diferença
function somaDeGrupos(xs) {
  if (!xs.some((x) => !x.oculto)) return null;
  return { valor: soma(xs.map((x) => x.valor)), aproximado: xs.some((x) => (x.oculto && x.valor > 0) || x.aproximado === true) };
}

function fraseIdade(d) {
  const base = d.bases.idade;
  if (!finito(base) || !d.idade.length) return null;
  const doLado = (menos35) => d.idade.filter((i) => MENOS_35.includes(i.faixa) === menos35);
  const abaixo = soma(doLado(true).map((i) => i.valor)) >= soma(doLado(false).map((i) => i.valor));
  const partes = [];
  const lado = somaDeGrupos(doLado(abaixo));
  if (lado) partes.push(`${maiuscula(pctSoma(lado.valor, base, lado.aproximado))} ${abaixo ? 'têm menos de 35 anos' : 'têm 35 anos ou mais'}.`);
  if (d.idadeGenero) {
    const maior = celulasDe(d).filter((c) => c.genero !== 'U' && !c.oculto).sort((a, b) => b.valor - a.valor)[0];
    if (maior) partes.push(`O maior grupo é de ${NOME_GENERO[maior.genero]} de ${rotuloFaixa(maior.faixa)} (${pctF(maior.valor, d.bases.idadeGenero)}).`);
  } else {
    const maior = d.idade.filter((i) => !i.oculto).sort((a, b) => b.valor - a.valor)[0];
    if (maior) partes.push(`A faixa mais comum é de ${rotuloFaixa(maior.faixa)} (${pctSoma(maior.valor, base, maior.aproximado)}).`);
  }
  return partes.length ? { texto: partes.join(' '), base } : null;
}

const SEGMENTOS = [
  { genero: 'F', faixas: MENOS_35, nome: 'Mulheres abaixo de 35 anos' },
  { genero: 'F', faixas: FAIXAS_IDADE.filter((f) => !MENOS_35.includes(f)), nome: 'Mulheres de 35 anos ou mais' },
  { genero: 'M', faixas: MENOS_35, nome: 'Homens abaixo de 35 anos' },
  { genero: 'M', faixas: FAIXAS_IDADE.filter((f) => !MENOS_35.includes(f)), nome: 'Homens de 35 anos ou mais' },
];

// células escolhidas do mesmo gênero e de faixas vizinhas viram um grupo só ("homens de 25 a 44 anos")
function juntarVizinhas(celulas) {
  const grupos = [];
  for (const g of GENEROS) {
    const doGenero = celulas.filter((c) => c.genero === g).sort((a, b) => FAIXAS_IDADE.indexOf(a.faixa) - FAIXAS_IDADE.indexOf(b.faixa));
    for (const c of doGenero) {
      const ultimo = grupos.at(-1);
      if (ultimo && ultimo.genero === g && FAIXAS_IDADE.indexOf(c.faixa) === FAIXAS_IDADE.indexOf(ultimo.faixas.at(-1)) + 1) {
        ultimo.faixas.push(c.faixa);
        ultimo.valor += c.valor;
      } else grupos.push({ genero: g, faixas: [c.faixa], valor: c.valor });
    }
  }
  return grupos.sort((a, b) => b.valor - a.valor);
}

// "Mulheres abaixo de 35 anos são 48% do total. O restante são principalmente homens de 25 a 44 anos (22%) e
// mulheres de 35 a 44 (12%)." O segmento é o maior de gênero × lado dos 35; o restante lista as maiores
// células visíveis até cobrir 60% dele (no máximo 3), juntando as vizinhas. "Principalmente" só quando elas
// cobrem mesmo 60% do restante (com o restante espalhado ou oculto, são só "os maiores grupos")
function fraseCruzamento(d) {
  if (!d.idadeGenero) return null;
  const base = d.bases.idadeGenero;
  const cel = celulasDe(d);
  const dentro = (s, c) => c.genero === s.genero && s.faixas.includes(c.faixa);
  const dom = SEGMENTOS.map((s) => ({ ...s, valor: soma(cel.filter((c) => dentro(s, c)).map((c) => c.valor)) })).sort((a, b) => b.valor - a.valor)[0];
  // o maior segmento feito só de células ocultas não vira frase (e o segundo não vira "o maior")
  const seg = dom ? somaDeGrupos(cel.filter((c) => dentro(dom, c))) : null;
  if (!seg) return null;
  let texto = `${dom.nome} são ${pctSoma(seg.valor, base, seg.aproximado)} do total.`;
  const resto = cel.filter((c) => !dentro(dom, c));
  const totalResto = soma(resto.map((c) => c.valor));
  const escolhidas = [];
  let coberto = 0;
  for (const c of resto.filter((x) => !x.oculto).sort((a, b) => b.valor - a.valor)) {
    if (escolhidas.length >= 3 || coberto >= 0.6 * totalResto) break;
    escolhidas.push(c);
    coberto += c.valor;
  }
  const grupos = juntarVizinhas(escolhidas);
  if (grupos.length && totalResto >= MINIMO_CELULA) {
    const partes = grupos.map((g, i) => `${NOME_GENERO[g.genero]} ${intervalo(g.faixas, i === 0)} (${pctF(g.valor, base)})`);
    if (coberto >= 0.6 * totalResto) texto += ` O restante são principalmente ${listaPt(partes)}.`;
    else if (partes.length === 1) texto += ` No restante, o maior grupo é de ${partes[0]}.`;
    else texto += ` No restante, os maiores grupos são ${listaPt(partes)}.`;
  }
  return { texto, base };
}

function fraseCidades(d) {
  const vis = d.cidades.filter((c) => !c.oculto);
  if (!vis.length) return null;
  const base = d.bases.cidade;
  const [a, ...resto] = vis;
  const depois = resto.slice(0, 2).map((c) => `${cidadeCurta(c.nome)} (${pctSoma(c.valor, base, c.aproximado)})`);
  return { texto: `${maiuscula(pctSoma(a.valor, base, a.aproximado))} estão em ${cidadeCurta(a.nome)}${depois.length ? `; depois ${listaPt(depois)}` : ''}.`, base };
}

function frasePaises(d) {
  const vis = d.paises.filter((c) => !c.oculto);
  if (vis.length < 2) return null;
  const texto = listaPt(vis.slice(0, 3).map((p) => `${nomePais(p.nome)} (${pctSoma(p.valor, d.bases.pais, p.aproximado)})`));
  return { texto: `${texto} são os países com mais gente.`, base: d.bases.pais };
}

// cidade e país de uma leitura anterior à de idade e gênero dizem de quando são ("Pela leitura de 22/09, ...")
const comNota = (p, nota) => (p && nota ? { ...p, texto: `Pela ${nota}, ${p.texto}` } : p);

// frases da demografia (o exemplo do Pedro). A primeira leva a fonte e a base. Sem 5 pessoas com dado, nada.
// notas: { cidade, pais } com "leitura de DD/MM" quando essas fotos são de outra leitura (blocoQuem)
export function frasesDemografia(itens, { total = null, fonte = 'seguidores', janela = null, notas = null } = {}) {
  const d = montarDemografia(itens, { total });
  const partes = [fraseGenero(d), fraseIdade(d), fraseCruzamento(d), comNota(fraseCidades(d), notas?.cidade), comNota(frasePaises(d), notas?.pais)]
    .filter((p) => p && finito(p.base) && p.base >= MINIMO_CELULA);
  if (!partes.length) return [];
  return partes.map((p, i) => (i === 0 ? `${prefixo(fonte, janela, p.base)}: ${minusculaInicial(p.texto)}` : p.texto));
}

// ---------- personas ----------

// recorte de idade e gênero de cada dorsal (identidade/brandmkt/02-personas/)
export const PERSONAS = [
  { id: 'A', nome: 'Direto', descricao: 'serviço intelectual', faixas: ['25-34', '35-44'], generos: null, recorte: '25 a 44 anos, todos os gêneros' },
  { id: 'B', nome: 'Construindo', descricao: 'beleza e estética', faixas: ['35-44', '45-54'], generos: ['F'], recorte: 'mulheres de 35 a 54 anos' },
  { id: 'C', nome: 'Mão na mão', descricao: 'ofícios tradicionais', faixas: ['45-54', '55-64', '65+'], generos: ['M'], recorte: 'homens de 45 anos ou mais' },
  { id: 'D', nome: 'MEI de vida toda', descricao: 'MEI que quer continuar pequeno', faixas: ['25-34', '35-44', '45-54'], generos: null, recorte: '25 a 54 anos, todos os gêneros' },
  { id: 'E', nome: 'Começa Certo', descricao: 'jovem com CNPJ', faixas: ['18-24', '25-34'], generos: null, recorte: '18 a 34 anos, todos os gêneros' },
];
export const AVISO_PERSONAS = 'Idade e gênero não dizem profissão nem se é MEI ou ME: a aderência é só do recorte de idade e gênero de cada persona.';
const MOTIVO_CRUZAMENTO = 'precisa do cruzamento de idade e gênero, que a Meta não devolveu';

// quanto do público cai no recorte de cada persona. Sem o cruzamento, só as de "todos os gêneros". Recorte com
// grupo oculto dentro sai aproximado (pct em múltiplo de 5, sem a contagem: aproximado true)
export function aderenciaPersonas(idadeGenero) {
  const d = montarDemografia(idadeGenero);
  const cel = celulasDe(d);
  return PERSONAS.map((p) => {
    let dentro = [];
    let base = null;
    let motivo = null;
    if (cel.length) {
      base = d.bases.idadeGenero;
      dentro = cel.filter((c) => p.faixas.includes(c.faixa) && (!p.generos || p.generos.includes(c.genero)));
    } else if (!p.generos && d.idade.length) {
      base = d.bases.idade;
      dentro = d.idade.filter((i) => p.faixas.includes(i.faixa));
    } else motivo = p.generos && d.idade.length ? MOTIVO_CRUZAMENTO : 'sem dado de idade';
    if (!motivo && !(base >= MINIMO_CELULA)) motivo = 'sem dado de idade';
    const s = motivo ? null : somaDeGrupos(dentro);
    if (!motivo && !s) motivo = 'menos de 5 pessoas por grupo nesse recorte';
    const aproximado = Boolean(s?.aproximado);
    return {
      id: p.id, nome: p.nome, descricao: p.descricao, recorte: p.recorte,
      valor: s && !aproximado ? s.valor : null, base: finito(base) ? base : null,
      pct: s ? (aproximado ? aproxPct(pctNum(s.valor, base)) : pctNum(s.valor, base)) : null, aproximado, motivo,
    };
  });
}

// "Direto (serviço intelectual; 25 a 44 anos, todos os gêneros): 58% dos seguidores e 61% das contas
// engajadas em 30 dias." seg e eng: o item da persona em aderenciaPersonas (ou null); aproximado vira "cerca de"
export function frasePersona(persona, seg, eng) {
  const cab = `${persona.nome} (${persona.descricao}; ${persona.recorte})`;
  const temS = finito(seg?.pct);
  const temE = finito(eng?.pct);
  if (!temS && !temE) {
    const motivo = seg?.motivo || eng?.motivo || 'sem dado de idade';
    return `${cab}: sem dado, ${motivo}.`;
  }
  const txt = (x) => (x.aproximado ? textoAprox(x.pct) : pctD(x.pct));
  const s = temS ? `${txt(seg)} dos seguidores` : `seguidores sem dado (${seg?.motivo || 'sem dado de idade'})`;
  const e = temE ? `${txt(eng)} das contas engajadas em 30 dias` : `entre as contas engajadas em 30 dias, sem dado (${eng?.motivo || 'sem dado de idade'})`;
  // um lado sem dado não entra num "e" como se fosse número: vira uma parte separada
  return temS && temE ? `${cab}: ${s} e ${e}.` : `${cab}: ${s}; ${e}.`;
}

// ---------- blocos "quem" da aba ----------

export const BLOCOS_QUEM = [
  { id: 'seguidores', metrica: 'seguidores', janelas: ['this_month', null], titulo: 'Seguidores', fonte: 'Meta: seguidores da conta' },
  { id: 'engajados-30', metrica: 'engajados', janelas: ['this_month'], titulo: 'Engajados em 30 dias', fonte: 'Meta: contas que interagiram nos últimos 30 dias' },
  { id: 'engajados-7', metrica: 'engajados', janelas: ['this_week'], titulo: 'Engajados em 7 dias', fonte: 'Meta: contas que interagiram nos últimos 7 dias' },
  { id: 'alcancados-30', metrica: 'alcancados', janelas: ['this_month'], titulo: 'Alcançados em 30 dias', fonte: 'Meta: contas alcançadas nos últimos 30 dias' },
];
const MOTIVO_VAZIO = {
  seguidores: 'A Meta só mostra a demografia dos seguidores com 100 seguidores ou mais.',
  engajados: 'A Meta só mostra esse público quando a janela tem 100 contas engajadas ou mais.',
  alcancados: 'A Meta não devolve isso pra esta conta.',
};

const DIMS_IDADE_GENERO = ['idade_genero', 'idade', 'genero'];

// as fotografias que valem pra uma métrica e janela. Idade e gênero saem de UMA leitura: a mais nova que tem
// cruzamento, idade ou gênero (as fotos de uma leitura têm o mesmo "em"). Foto antiga de idade ou gênero ao lado
// do cruzamento novo (ou o contrário) daria frases que se contradizem no mesmo cartão, e as personas
// misturariam as duas. Cidade e país: a mais nova de cada, que pode ser de outra leitura (a frase diz de quando)
function fotosDe(demografia, metrica, janela) {
  const porDim = {};
  for (const f of lista(demografia)) {
    if (f?.metrica !== metrica || (f.janela ?? null) !== janela) continue;
    if (!porDim[f.dimensao] || String(f.em) > String(porDim[f.dimensao].em)) porDim[f.dimensao] = f;
  }
  const leitura = DIMS_IDADE_GENERO.filter((k) => porDim[k]).map((k) => String(porDim[k].em)).sort().at(-1);
  if (leitura) for (const k of DIMS_IDADE_GENERO) if (porDim[k] && String(porDim[k].em) !== leitura) delete porDim[k];
  return porDim;
}
const entradaDe = (fotos) => ({
  idadeGenero: fotos.idade_genero?.itens, idade: fotos.idade?.itens, genero: fotos.genero?.itens, cidade: fotos.cidade?.itens, pais: fotos.pais?.itens,
});

// a entrada de demografia de um bloco (a janela com a fotografia mais recente ganha). em = a leitura de idade e
// gênero (sem ela, a de cidade e país); datas = o em de cada dimensão que entrou
export function entradaDoBloco(def, demografia) {
  let melhor = null;
  for (const janela of def.janelas) {
    const fotos = fotosDe(demografia, def.metrica, janela);
    const ultimo = Object.values(fotos).map((f) => String(f.em)).sort().at(-1) ?? null;
    if (ultimo && (!melhor || ultimo > melhor.ultimo)) melhor = { janela, ultimo, fotos };
  }
  if (!melhor) return null;
  const f = melhor.fotos;
  const principal = DIMS_IDADE_GENERO.map((k) => f[k]?.em).find((x) => x != null);
  const datas = Object.fromEntries(Object.entries(f).map(([k, x]) => [k, String(x.em)]));
  return { janela: melhor.janela, em: principal != null ? String(principal) : melhor.ultimo, entrada: entradaDe(f), datas };
}

// um bloco de "quem" (seguidores, engajados, alcançados) no formato da aba: listas só com o que é visível
// (5 pessoas ou mais), percentuais na escala 0 a 100, "ocultos" = quantos grupos ficaram de fora. Gênero e
// idade tirados do cruzamento com célula oculta dentro vão aproximados (paraTela: sem contagem, múltiplo de 5)
export function blocoQuem(def, demografia, suporte = {}) {
  const achado = entradaDoBloco(def, demografia);
  const vazio = { id: def.id, titulo: def.titulo, fonte: def.fonte, em: null, base: null, disponivel: false, motivo: '', frases: [], genero: [], idade: [], idadeGenero: null, cidades: [], paises: [], ocultos: 0 };
  if (!achado) {
    // só as chaves das janelas deste bloco (engajados 7 dias não olha a janela de 30)
    const prefixos = def.janelas.map((j) => `demo:${def.metrica}:${j ?? 'sem'}:`);
    const chaves = Object.entries(objeto(suporte) ?? {}).filter(([k]) => prefixos.some((p) => k.startsWith(p)));
    const recusas = chaves.filter(([, v]) => v?.ok === false);
    let motivo = 'Ainda não lido: clique em Atualizar agora.';
    if (chaves.length && recusas.length === chaves.length) {
      motivo = recusas.some(([, v]) => v?.erro === 'vazio') ? MOTIVO_VAZIO[def.metrica] ?? MOTIVO_VAZIO.alcancados : 'A Meta não devolve isso pra esta conta.';
    }
    return { ...vazio, motivo };
  }
  const d = montarDemografia(achado.entrada);
  if (!finito(d.base) || d.base < MINIMO_CELULA) {
    return { ...vazio, em: achado.em, base: d.base, motivo: 'Poucas contas com dado nessa janela (menos de 5).' };
  }
  let ocultos = 0;
  const visiveis = (xs) => xs.filter((x) => (x.oculto ? (ocultos++, false) : true));
  const genero = visiveis(d.genero).map((g) => ({ id: g.id, rotulo: g.rotulo, ...paraTela(g) }));
  const idade = visiveis(d.idade).map((i) => ({ faixa: i.faixa, rotulo: i.rotulo, ...paraTela(i) }));
  const idadeGenero = d.idadeGenero
    ? d.idadeGenero.map((l) => {
        const v = (g) => {
          const c = l.celulas[g];
          if (!c) return null;
          if (c.oculto) {
            ocultos++;
            return null;
          }
          return c.pct;
        };
        return { faixa: l.faixa, mulheres: v('F'), homens: v('M'), outros: v('U') };
      })
    : null;
  const cidades = visiveis(d.cidades).slice(0, 15).map((c) => ({ nome: c.nome, ...paraTela(c) }));
  const paises = visiveis(d.paises).slice(0, 10).map((p) => ({ nome: nomePais(p.nome), codigo: p.nome, ...paraTela(p) }));
  // cidade e país de outro dia que a leitura de idade e gênero: a frase diz de quando são
  const diaDe = (iso) => (iso ? diaBrasilia(iso) : null);
  const nota = (dim) => {
    const dia = diaDe(achado.datas?.[dim]);
    return dia && dia !== diaDe(achado.em) ? `leitura de ${dataCurta(dia)}` : null;
  };
  return {
    ...vazio,
    em: achado.em,
    datas: achado.datas,
    janela: achado.janela,
    base: d.base,
    disponivel: true,
    frases: frasesDemografia(achado.entrada, { fonte: def.metrica, janela: achado.janela, notas: { cidade: nota('cidade'), pais: nota('pais') } }),
    genero, idade, idadeGenero, cidades, paises, ocultos,
    temCruzamento: d.temCruzamento,
  };
}

// ---------- tela do app (público do post) ----------

// percentual digitado ou lido: 45, "45,5", "45,5%". Vazio: undefined (não veio); lixo: NaN
export function lerPct(v) {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const t = v.trim().replace(/%$/, '').trim().replace(',', '.');
    if (!t) return undefined;
    if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  }
  return NaN;
}
const somaCerta = (s) => s >= 90 && s <= 102;

// "contas na base": quantas contas a tela diz que os percentuais medem. 1234, "1234" ou "1.234" (milhar em
// pt-BR). Vazio: undefined (não veio); fração, "1,2 mil" e lixo: NaN (número abreviado é estimativa, não entra)
export function lerContas(v) {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'number') return Number.isInteger(v) ? v : NaN;
  if (typeof v === 'string') {
    const t = v.replace(/\s/g, '');
    if (!t) return undefined;
    if (/^\d{1,12}$/.test(t)) return Number(t);
    if (/^\d{1,3}(\.\d{3}){1,3}$/.test(t)) return Number(t.replace(/\./g, ''));
  }
  return NaN;
}
const MAX_CONTAS = 1_000_000_000;

// os números da tela de público do post no app → a forma de publico.porPostApp (sem em e autor).
// { limpo, erros }: erro barra o "Salvar"; na leitura do print vira aviso da sugestão. contas (opcional) é o
// número que a tela mostra como base: vira a base em pessoas do "grupo com menos de 5" (pessoasNaBase)
export function limparPostApp(dados) {
  const d = objeto(dados) ?? {};
  const erros = [];
  const pctOk = (v, rotulo) => {
    const n = lerPct(v);
    if (n === undefined) return undefined;
    if (!finito(n) || n < 0 || n > 100) {
      erros.push(`${rotulo} precisa ser um percentual de 0 a 100.`);
      return undefined;
    }
    return arred(n, 1);
  };
  const baseBruta = d.base == null || d.base === '' ? 'visualizacoes' : d.base;
  if (!BASES_APP.includes(baseBruta)) erros.push('A base precisa ser visualizações, contas alcançadas ou contas com engajamento.');
  const limpo = { base: BASES_APP.includes(baseBruta) ? baseBruta : 'visualizacoes', genero: {}, idade: {}, cidades: [], paises: [] };
  const contas = lerContas(d.contas);
  if (contas !== undefined) {
    if (!finito(contas) || contas < 1 || contas > MAX_CONTAS) erros.push('Contas na base precisa ser o número inteiro que a tela mostra, maior que zero (ex.: 1.234).');
    else limpo.contas = contas;
  }
  if (d.genero != null && !objeto(d.genero)) erros.push('Gênero precisa ser { mulheres, homens }.');
  const g = objeto(d.genero) ?? {};
  for (const [k, rotulo] of [['mulheres', 'Mulheres'], ['homens', 'Homens']]) {
    const v = pctOk(g[k], rotulo);
    if (v !== undefined) limpo.genero[k] = v;
  }
  const idadeBruta = Array.isArray(d.idade) ? Object.fromEntries(d.idade.map((x) => [x?.faixa, x?.pct])) : objeto(d.idade) ?? {};
  if (d.idade != null && !Array.isArray(d.idade) && !objeto(d.idade)) erros.push('Idade precisa ser a lista de faixas.');
  const chaves = Object.keys(idadeBruta);
  if (chaves.length > FAIXAS_IDADE.length) erros.push(`No máximo ${FAIXAS_IDADE.length} faixas de idade.`);
  for (const k of chaves.slice(0, FAIXAS_IDADE.length)) {
    if (!FAIXAS_IDADE.includes(k)) {
      erros.push(`Faixa de idade desconhecida: use ${listaPt(FAIXAS_IDADE.map(faixaCurta))}.`);
      continue;
    }
    const v = pctOk(idadeBruta[k], `A faixa de ${rotuloFaixa(k)}`);
    if (v !== undefined) limpo.idade[k] = v;
  }
  for (const [campo, nomeCampo, um] of [['cidades', 'cidades', 'cidade'], ['paises', 'países', 'país']]) {
    const xs = d[campo] == null ? [] : d[campo];
    if (!Array.isArray(xs)) {
      erros.push(`A lista de ${nomeCampo} precisa ser uma lista.`);
      continue;
    }
    if (xs.length > 10) erros.push(`No máximo 10 ${nomeCampo}.`);
    for (const x of xs.slice(0, 10)) {
      const nome = semTraco(objeto(x)?.nome ?? '');
      const v = pctOk(objeto(x)?.pct, `O percentual ${campo === 'cidades' ? 'da cidade' : 'do país'}`);
      if (!nome && v === undefined) continue; // linha vazia do formulário
      if (!nome || nome.length > 80) {
        erros.push(`Cada ${um} precisa de um nome de até 80 caracteres.`);
        continue;
      }
      if (v === undefined) {
        erros.push(`Falta o percentual de ${nome}.`);
        continue;
      }
      limpo[campo].push({ nome, pct: v });
    }
  }
  for (const [k, rotulo] of [['seguidores', 'Seguidores'], ['naoSeguidores', 'Não seguidores']]) {
    const v = pctOk(d[k], rotulo);
    if (v !== undefined) limpo[k] = v;
  }
  const gv = Object.values(limpo.genero);
  if (gv.length === 2 && !somaCerta(soma(gv))) erros.push(`Mulheres e homens somam ${pctD(soma(gv))}: na tela do app a soma fica perto de 100%.`);
  const iv = Object.values(limpo.idade);
  if (iv.length && !somaCerta(soma(iv))) erros.push(`As faixas de idade somam ${pctD(soma(iv))}: preencha todas as faixas da tela (a soma fica perto de 100%).`);
  if (finito(limpo.seguidores) && finito(limpo.naoSeguidores) && !somaCerta(limpo.seguidores + limpo.naoSeguidores)) {
    erros.push(`Seguidores e não seguidores somam ${pctD(limpo.seguidores + limpo.naoSeguidores)}: na tela do app a soma fica perto de 100%.`);
  }
  for (const [campo, nomeCampo] of [['cidades', 'As cidades'], ['paises', 'Os países']]) {
    const s = soma(limpo[campo].map((x) => x.pct));
    if (s > 102) erros.push(`${nomeCampo} somam ${pctD(s)}: passa de 100%.`);
  }
  const vazio = !gv.length && !iv.length && !limpo.cidades.length && !limpo.paises.length && !finito(limpo.seguidores) && !finito(limpo.naoSeguidores);
  if (vazio) erros.push('Informe pelo menos um número da tela do app.');
  return { limpo, erros };
}

// saída estruturada da IA que leu o print → { sugestao (forma de porPostApp), avisos, vazio }
export function sugestaoDoPrint(o) {
  const x = objeto(o) ?? {};
  const dados = {
    base: BASES_APP.includes(x.base) ? x.base : 'visualizacoes',
    genero: Object.fromEntries(lista(x.genero).filter((g) => ['mulheres', 'homens'].includes(g?.id)).map((g) => [g.id, g.pct])),
    idade: Object.fromEntries(lista(x.idade).filter((i) => FAIXAS_IDADE.includes(i?.faixa)).map((i) => [i.faixa, i.pct])),
    cidades: lista(x.cidades).slice(0, 10).map((c) => ({ nome: c?.nome, pct: c?.pct })),
    paises: lista(x.paises).slice(0, 10).map((c) => ({ nome: c?.nome, pct: c?.pct })),
    seguidores: lista(x.seguidores).find((s) => s?.id === 'seguidores')?.pct,
    naoSeguidores: lista(x.seguidores).find((s) => s?.id === 'nao-seguidores')?.pct,
    // o número de contas que a tela mostra como base (null quando não aparece ou aparece abreviado)
    contas: finito(x.contas) ? x.contas : undefined,
  };
  const { limpo, erros } = limparPostApp(dados);
  const vazio = erros.includes('Informe pelo menos um número da tela do app.');
  const avisos = erros.filter((e) => e !== 'Informe pelo menos um número da tela do app.');
  if (x.base === 'nao-sei') avisos.push('Não deu pra ver no print se a tela mede visualizações, contas alcançadas ou contas com engajamento: confira a base.');
  return { sugestao: limpo, avisos, vazio };
}

// quantas PESSOAS a tela de público do post mede (a base do "grupo com menos de 5"). As contas que a tela
// mostra (dados.contas), quando alguém informou; senão o que o post tem de contas: o alcance, ou, na base de
// contas com engajamento, o maior entre curtidas e salvamentos do post (cada um é uma conta diferente; comentário
// e compartilhamento não entram: a mesma conta comenta ou manda várias vezes, e as nossas respostas contam como
// comentário). Visualização nunca é pessoa (a mesma conta vê várias vezes: 2% de 400 visualizações não são
// 8 pessoas). Sem número: null
export function pessoasNaBase(dados, metricas) {
  const d = objeto(dados) ?? {};
  if (finito(d.contas) && d.contas >= 0) return d.contas;
  const m = objeto(metricas) ?? {};
  if (d.base === 'contas-engajadas') {
    const xs = [m.likes, m.saved].filter(finito);
    return xs.length ? Math.max(...xs) : null;
  }
  return finito(m.reach) ? m.reach : null;
}

// grupo da tela do app com 5 pessoas ou mais na base n. Sem n, nenhum (falha fechada)
const podeApp = (p, n) => finito(p) && finito(n) && (p / 100) * n >= MINIMO_CELULA;

// frases do público do post pela tela do app. n: as pessoas da base (pessoasNaBase), pra grupo de menos de 5
// não virar frase; sem n, nenhuma frase (falha fechada). Gênero e idade saem separados (a tela não cruza os dois)
export function frasesPostApp(dados, { n = null } = {}) {
  const d = objeto(dados);
  if (!d || !finito(n)) return [];
  const pode = (p) => podeApp(p, n);
  const corpos = [];
  const partes = [];
  const gen = [['mulheres', d.genero?.mulheres], ['homens', d.genero?.homens]].filter(([, v]) => pode(v)).sort((a, b) => b[1] - a[1]);
  if (gen.length) partes.push(listaPt(gen.map(([nome, v]) => `${pctD(v)} ${nome}`)));
  const idade = objeto(d.idade) ?? {};
  const faixas = FAIXAS_IDADE.filter((f) => finito(idade[f]));
  if (faixas.length) {
    // na escala do somaDeGrupos: pct vira "valor"; oculto = menos de 5 pessoas. A soma com faixa oculta dentro
    // sai "cerca de" (ao lado das faixas visíveis, a exata devolveria a oculta)
    const grupo = (fs) => fs.map((f) => ({ valor: idade[f], oculto: !pode(idade[f]) }));
    const menos = faixas.filter((f) => MENOS_35.includes(f));
    const mais = faixas.filter((f) => !MENOS_35.includes(f));
    const abaixo = soma(menos.map((f) => idade[f])) >= soma(mais.map((f) => idade[f]));
    const lado = somaDeGrupos(grupo(abaixo ? menos : mais));
    if (lado) partes.push(`${lado.aproximado ? textoAprox(lado.valor) : pctD(lado.valor)} ${abaixo ? 'abaixo de 35 anos' : 'com 35 anos ou mais'}`);
    const maior = faixas.filter((f) => pode(idade[f])).sort((a, b) => idade[b] - idade[a])[0];
    if (maior) partes.push(`maior faixa: ${rotuloFaixa(maior)} (${pctD(idade[maior])})`);
  }
  if (partes.length) corpos.push(partes.join('; '));
  const cidades = lista(d.cidades).filter((c) => c?.nome && pode(c.pct));
  if (cidades.length) {
    const [a, ...resto] = cidades;
    const depois = resto.slice(0, 2).map((c) => `${cidadeCurta(c.nome)} (${pctD(c.pct)})`);
    corpos.push(`${pctD(a.pct)} estão em ${cidadeCurta(a.nome)}${depois.length ? `; depois ${listaPt(depois)}` : ''}`);
  }
  const paises = lista(d.paises).filter((c) => c?.nome && pode(c.pct));
  if (paises.length >= 2) corpos.push(`${listaPt(paises.slice(0, 3).map((c) => `${nomePais(c.nome)} (${pctD(c.pct)})`))} são os países com mais gente`);
  const seg = [];
  if (pode(d.seguidores)) seg.push(`${pctD(d.seguidores)} seguem a conta`);
  if (pode(d.naoSeguidores)) seg.push(`${pctD(d.naoSeguidores)} não seguem`);
  if (seg.length) corpos.push(listaPt(seg));
  if (!corpos.length) return [];
  return corpos.map((c, i) => (i === 0 ? `Na tela do app (${ROTULO_BASE_APP[d.base] ?? ROTULO_BASE_APP.visualizacoes}): ${c}.` : `${maiuscula(c)}.`));
}

// o que a tela pode mostrar do público do post pela tela do app: só os grupos com 5 pessoas ou mais na base n
// (nada sem n). Os números digitados ficam em "dados" (pro formulário), nunca aqui
export function visiveisPostApp(dados, n) {
  const d = objeto(dados) ?? {};
  const pode = (p) => podeApp(p, n);
  const g = objeto(d.genero) ?? {};
  const idade = objeto(d.idade) ?? {};
  const lugares = (xs, nome) => lista(xs).filter((c) => typeof c?.nome === 'string' && c.nome && pode(c.pct)).map((c) => ({ nome: nome(c.nome), pct: c.pct }));
  const seguidores = pode(d.seguidores) ? d.seguidores : null;
  const naoSeguidores = pode(d.naoSeguidores) ? d.naoSeguidores : null;
  return {
    genero: [['F', 'mulheres'], ['M', 'homens']].filter(([, k]) => pode(g[k])).map(([id, k]) => ({ id, rotulo: ROTULO_GENERO[id], pct: g[k] })),
    idade: FAIXAS_IDADE.filter((f) => pode(idade[f])).map((f) => ({ faixa: f, pct: idade[f] })),
    cidades: lugares(d.cidades, semTraco),
    paises: lugares(d.paises, nomePais),
    seguidores: seguidores != null || naoSeguidores != null ? { seguidores, naoSeguidores } : null,
  };
}

// por que o público do post pela tela do app não virou frase (texto pronto pra tela), ou null quando virou
export function semFrasePostApp(frases, n) {
  if (lista(frases).length) return null;
  return finito(n)
    ? 'Sem frase: nenhum grupo com 5 pessoas ou mais.'
    : 'Sem frase: falta saber quantas contas a tela mede. Informe as contas na base no formulário.';
}

// ---------- stories (captura de hora em hora, stories-metricas.mjs) ----------

export const MENOS_DE_5 = 'menos-de-5';
const temNumeroStory = (v) => finito(v) || v === MENOS_DE_5;

// o que um erro da Meta nos insights de um story quer dizer (metricas: as pedidas nessa chamada):
//  menos-de-5: #10 sem "permission" (menos de 5 pessoas viram);
//  sumiu: #100 com subcódigo 33 ou "does not exist" (o story saiu do ar ou foi apagado depois da lista);
//  recusa: #100 que cita métrica pedida (fora = quais) ou fala do jeito de pedir (fora = []): só isso vira
//    "suporte" (7 dias sem pedir);
//  sem-nome: outro #100, que não fala de métrica (pode ser do story: nunca vira recusa);
//  outro: o resto (instabilidade, 5xx, permissão): erro deste story
export function erroDoStory(e, metricas = []) {
  const code = e?.meta?.code;
  const msg = String(e?.meta?.message ?? '');
  if (code === 10 && !/permission/i.test(msg)) return { tipo: 'menos-de-5' };
  if (code !== 100) return { tipo: 'outro' };
  if (e.meta.sub === 33 || /does not exist|nonexisting/i.test(msg)) return { tipo: 'sumiu' };
  const fora = metricasRecusadas(msg, lista(metricas));
  if (fora.length) return { tipo: 'recusa', fora };
  if (recusaDeMetrica(msg)) return { tipo: 'recusa', fora: [] };
  return { tipo: 'sem-nome' };
}

// leitura de story sem nenhum número nem "menos-de-5" (a captura desta hora falhou inteira): não entra
export function leituraStoryVazia(l) {
  const o = objeto(l);
  if (!o) return true;
  const { navegacao, em: _em, idadeH: _idade, ...campos } = o;
  return !Object.values(campos).some(temNumeroStory) && !Object.values(objeto(navegacao) ?? {}).some(temNumeroStory);
}

// a "ultima" do story (o número final, que o resumo usa), campo a campo: número e "menos-de-5" da leitura nova
// substituem; o que veio sem dado fica com o da anterior (os números do story só crescem, e a métrica que
// falhou nesta hora não apaga a da hora anterior)
export function juntarLeituraStory(anterior, nova) {
  if (!objeto(anterior)) return nova;
  const u = { ...nova };
  for (const [k, v] of Object.entries(anterior)) {
    if (['em', 'idadeH', 'navegacao'].includes(k)) continue;
    if (!temNumeroStory(u[k]) && temNumeroStory(v)) u[k] = v;
  }
  const nav = { ...(objeto(nova?.navegacao) ?? {}) };
  for (const [k, v] of Object.entries(objeto(anterior.navegacao) ?? {})) if (!temNumeroStory(nav[k]) && temNumeroStory(v)) nav[k] = v;
  u.navegacao = nav;
  return u;
}

// ---------- anúncios (Marketing API) ----------

const NOME_GENERO_ADS = { female: 'mulheres', male: 'homens' };
const somaAcoes = (acoes, teste) => somaOuNull(lista(acoes).filter((a) => teste(String(a?.action_type ?? ''))).map((a) => numeroApi(a?.value)));
const primeiraAcao = (acoes) => lista(acoes).map((a) => numeroApi(a?.value)).find(finito) ?? null;

// totais de um anúncio (insights com date_preset=maximum). Números chegam como texto. Ação que a Meta não
// manda fica null (sem dado): visita ao perfil e seguir dependem do objetivo da campanha
export function lerTotaisAnuncio(resposta) {
  const l = objeto(lista(resposta?.data)[0]);
  if (!l) return null;
  const soVideo = (campo) => somaOuNull(lista(l[campo]).map((a) => numeroApi(a?.value)));
  return {
    gasto: numeroApi(l.spend),
    alcance: numeroApi(l.reach),
    impressoes: numeroApi(l.impressions),
    plays3s: somaAcoes(l.actions, (t) => t === 'video_view'),
    thruplays: soVideo('video_thruplay_watched_actions'),
    tempoMedioS: primeiraAcao(l.video_avg_time_watched_actions),
    p25: soVideo('video_p25_watched_actions'),
    p50: soVideo('video_p50_watched_actions'),
    p75: soVideo('video_p75_watched_actions'),
    p100: soVideo('video_p100_watched_actions'),
    visitasPerfil: somaAcoes(l.actions, (t) => /profile_visit/i.test(t)),
    seguiram: somaAcoes(l.actions, (t) => /follow/i.test(t) && !/unfollow/i.test(t)),
  };
}

// linhas com breakdowns=age,gender ou breakdowns=region → [{ idade, genero } | { regiao }, alcance, impressoes]
export function lerQuebraAnuncio(resposta) {
  return lista(resposta?.data)
    .map((l) => {
      const o = {};
      if (l?.age != null) o.idade = String(l.age);
      if (l?.gender != null) o.genero = String(l.gender).toLowerCase();
      if (l?.region != null) o.regiao = semTraco(l.region);
      o.alcance = numeroApi(l?.reach);
      o.impressoes = numeroApi(l?.impressions);
      return o;
    })
    .filter((o) => o.idade || o.genero || o.regiao);
}

function juntarLinhas(linhas, chaves) {
  const m = new Map();
  for (const x of linhas) {
    const k = chaves.map((c) => x[c] ?? '').join('|');
    const a = m.get(k) ?? { ...Object.fromEntries(chaves.map((c) => [c, x[c] ?? null])), alcance: null, impressoes: null };
    a.alcance = somaOuNull([a.alcance, x.alcance]);
    a.impressoes = somaOuNull([a.impressoes, x.impressoes]);
    m.set(k, a);
  }
  return [...m.values()].sort((a, b) => (b.alcance ?? -1) - (a.alcance ?? -1));
}

// os anúncios ligados a um post somados (a forma de anuncios.porPost). leituras: [{ adId, totais, idadeGenero,
// regioes }]. Alcance somado entre anúncios conta a mesma conta mais de uma vez: vai com aviso
export function agregarAnuncios(leituras, em = null) {
  const ls = lista(leituras).filter(objeto);
  const campo = (k) => somaOuNull(ls.map((l) => l.totais?.[k]));
  let tempo = null;
  let s = 0;
  let w = 0;
  for (const l of ls) {
    const t = l.totais?.tempoMedioS;
    const peso = finito(l.totais?.plays3s) ? l.totais.plays3s : l.totais?.impressoes;
    if (finito(t) && finito(peso) && peso > 0) {
      s += t * peso;
      w += peso;
    }
  }
  if (w > 0) tempo = arred(s / w, 1);
  else tempo = arred(media(ls.map((l) => l.totais?.tempoMedioS)), 1);
  const gasto = campo('gasto');
  return {
    em,
    anuncios: ls.map((l) => l.adId),
    gasto: finito(gasto) ? arred(gasto, 2) : null,
    alcance: campo('alcance'), impressoes: campo('impressoes'), plays3s: campo('plays3s'), thruplays: campo('thruplays'),
    tempoMedioS: tempo, p25: campo('p25'), p50: campo('p50'), p75: campo('p75'), p100: campo('p100'),
    visitasPerfil: campo('visitasPerfil'), seguiram: campo('seguiram'),
    idadeGenero: juntarLinhas(ls.flatMap((l) => lista(l.idadeGenero)), ['idade', 'genero']),
    regioes: juntarLinhas(ls.flatMap((l) => lista(l.regioes)), ['regiao']),
    ...(ls.length > 1 ? { aviso: 'alcance somado dos anúncios' } : {}),
  };
}

// soma de linhas da quebra idade × gênero do anúncio: oculta com menos de 5 contas; aproximada quando junta
// linha de 5 ou mais com linha de 1 a 4 (a exata, menos a linha grande, devolveria a pequena)
function somaDeLinhas(linhas) {
  const valor = soma(linhas.map((i) => i.alcance));
  const aproximado = linhas.some((i) => i.alcance > 0 && i.alcance < MINIMO_CELULA) && linhas.some((i) => i.alcance >= MINIMO_CELULA);
  return { valor, oculto: valor < MINIMO_CELULA, ...(aproximado && valor >= MINIMO_CELULA ? { aproximado: true } : {}) };
}

// "No alcance pago (1.234 contas, R$ 150,00): 72% mulheres; 80% abaixo de 35 anos; maior grupo: mulheres de
// 25 a 34 (41%)." p = anuncios.porPost[midiaId]. Percentuais sobre o alcance da quebra idade × gênero
export function frasesPago(p) {
  const d = objeto(p);
  if (!d) return [];
  const ig = lista(d.idadeGenero).filter((i) => finito(i?.alcance) && i.alcance >= 0);
  const base = somaOuNull(ig.map((i) => i.alcance));
  const n = lista(d.anuncios).length;
  const cab = [finito(d.alcance) ? `${n0(d.alcance)} contas` : 'alcance sem dado', finito(d.gasto) ? reais(d.gasto) : 'gasto sem dado'];
  if (n > 1) cab.push(`alcance somado de ${n} anúncios`);
  const partes = [];
  if (finito(base) && base >= MINIMO_CELULA) {
    const genero = ['female', 'male']
      .map((g) => ({ g, ...somaDeLinhas(ig.filter((i) => i.genero === g)) }))
      .sort((a, b) => b.valor - a.valor)[0];
    if (!genero.oculto) partes.push(`${pctSoma(genero.valor, base, genero.aproximado)} ${NOME_GENERO_ADS[genero.g]}`);
    const porIdade = FAIXAS_IDADE.map((f) => ({ faixa: f, ...somaDeLinhas(ig.filter((i) => i.idade === f)) })).filter((x) => x.valor > 0);
    const menos = porIdade.filter((x) => MENOS_35.includes(x.faixa));
    const mais = porIdade.filter((x) => !MENOS_35.includes(x.faixa));
    const abaixo = soma(menos.map((x) => x.valor)) >= soma(mais.map((x) => x.valor));
    const lado = somaDeGrupos(abaixo ? menos : mais);
    if (lado) partes.push(`${pctSoma(lado.valor, base, lado.aproximado)} ${abaixo ? 'abaixo de 35 anos' : 'com 35 anos ou mais'}`);
    const maior = ig
      .filter((i) => NOME_GENERO_ADS[i.genero] && FAIXAS_IDADE.includes(i.idade) && i.alcance >= MINIMO_CELULA)
      .sort((a, b) => b.alcance - a.alcance)[0];
    if (maior) partes.push(`maior grupo: ${NOME_GENERO_ADS[maior.genero]} de ${faixaCurta(maior.idade)} (${pctF(maior.alcance, base)})`);
  }
  const frases = [`No alcance pago (${cab.join(', ')}): ${partes.length ? partes.join('; ') : 'sem dado de idade e gênero'}.`];
  const regioes = lista(d.regioes).filter((r) => r?.regiao && finito(r.alcance));
  const baseRegiao = somaOuNull(regioes.map((r) => r.alcance));
  const vis = regioes.filter((r) => r.alcance >= MINIMO_CELULA && !/^unknown$/i.test(r.regiao)).sort((a, b) => b.alcance - a.alcance).slice(0, 3);
  if (vis.length && finito(baseRegiao)) frases.push(`Por região: ${listaPt(vis.map((r) => `${r.regiao} (${pctF(r.alcance, baseRegiao)})`))}.`);
  return frases;
}

const GENERO_ADS = { female: 'F', male: 'M', unknown: 'U' };

// o que a tela mostra do público pago do post (a mesma forma de visiveisPostApp): gênero e idade com 5 contas ou
// mais, sobre todas as linhas da quebra (idade desconhecida inclusive, a mesma base da frase). Soma com linha
// pequena dentro vai aproximada (pct em múltiplo de 5). Cidade e país não vêm do anúncio (a região vai na frase)
export function visiveisPago(p) {
  const ig = lista(objeto(p)?.idadeGenero).filter((i) => finito(i?.alcance) && i.alcance >= 0);
  const d = montarDemografia(
    {
      genero: ig.map((i) => ({ genero: GENERO_ADS[i.genero] ?? String(i.genero ?? '').toUpperCase(), valor: i.alcance })),
      idade: ig.map((i) => ({ idade: i.idade, valor: i.alcance })),
    },
    { total: soma(ig.map((i) => i.alcance)) }
  );
  const semContagem = (x) => {
    const { valor: _v, ...resto } = paraTela(x);
    return resto;
  };
  return {
    genero: d.genero.filter((g) => !g.oculto).map((g) => ({ id: g.id, rotulo: g.rotulo, ...semContagem(g) })),
    idade: d.idade.filter((i) => !i.oculto).map((i) => ({ faixa: i.faixa, ...semContagem(i) })),
    cidades: [], paises: [], seguidores: null,
  };
}

// ---------- partes do resumo da aba ----------

const rotuloSemana = (s) => {
  const i = intervaloSemana(s);
  return i ? `${dataCurta(i.inicio)} a ${dataCurta(i.fim)}` : SEM_DADO;
};
const diasDe = (diario, hoje) =>
  Object.keys(objeto(diario) ?? {})
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && (!hoje || d < hoje))
    .sort();

export const JANELA_DIARIO_MIN = 3;
export const JANELA_DIARIO_MAX = 28;
const ATRASO_META_MS = 48 * HORA_MS;

// quantos dias fechados (até ontem) a leitura diária pede. Computador desligado não deixa buraco: relê desde o
// dia mais antigo que ainda falta (sem alcance nem seguiram) ou que foi lido menos de 48h depois de fechar (a
// Meta atrasa até 48h: número lido cedo é parcial). No mínimo 3 (ontem e anteontem ainda mudam), no máximo 28
// (o que a Meta ainda dá; a primeira leitura, sem nada, pega os 28)
export function janelaDiario(diario, { hoje } = {}) {
  const d = objeto(diario) ?? {};
  let n = JANELA_DIARIO_MIN;
  for (let k = JANELA_DIARIO_MIN + 1; k <= JANELA_DIARIO_MAX; k++) {
    const dia = somarDias(hoje, -k);
    if (!dia) break;
    const x = objeto(d[dia]);
    const falta = !x || (!objeto(x.alcance) && !finito(x.seguiram));
    const fim = inicioDoDia(somarDias(dia, 1));
    const lidoEm = msDe(x?.em);
    const cedo = !falta && (lidoEm == null || fim == null || lidoEm < fim + ATRASO_META_MS);
    if (falta || cedo) n = k;
  }
  return n;
}

// descoberta: alcance diário somado por semana ISO, de quem segue e de quem não segue; por tipo de conteúdo
// nos últimos 28 dias com dado. Só dias fechados (antes de hoje)
export function descoberta(diario, { hoje = null, semanas = 8 } = {}) {
  const dias = diasDe(diario, hoje);
  const porSemana = new Map();
  for (const dia of dias) {
    const a = objeto(diario[dia]?.alcance);
    if (!a) continue;
    const s = semanaIso(dia);
    const w = porSemana.get(s) ?? { semana: s, alcance: null, seguidores: null, naoSeguidores: null, nao: 0, baseNao: 0, dias: 0 };
    w.dias++;
    w.alcance = somaOuNull([w.alcance, a.total]);
    w.seguidores = somaOuNull([w.seguidores, a.seguidores]);
    w.naoSeguidores = somaOuNull([w.naoSeguidores, a.naoSeguidores]);
    const tot = finito(a.total) ? a.total : somaOuNull([a.seguidores, a.naoSeguidores, a.desconhecido]);
    if (finito(a.naoSeguidores) && finito(tot) && tot > 0) {
      w.nao += a.naoSeguidores;
      w.baseNao += tot;
    }
    porSemana.set(s, w);
  }
  const todas = [...porSemana.values()].sort((a, b) => a.semana.localeCompare(b.semana));
  const lista8 = todas.slice(-semanas).map((w) => ({
    semana: w.semana, rotulo: rotuloSemana(w.semana), alcance: w.alcance, seguidores: w.seguidores, naoSeguidores: w.naoSeguidores,
    pctNao: w.baseNao > 0 ? arred((w.nao / w.baseNao) * 100) : null, dias: w.dias,
  }));
  const recentes = dias.filter((d) => objeto(diario[d]?.alcancePorTipo) || objeto(diario[d]?.viewsPorTipo)).slice(-28);
  const tipos = new Map();
  for (const dia of recentes) {
    for (const [campo, chave] of [['alcancePorTipo', 'alcance'], ['viewsPorTipo', 'views']]) {
      for (const [t, v] of Object.entries(objeto(diario[dia]?.[campo]) ?? {})) {
        if (!finito(v)) continue;
        const x = tipos.get(t) ?? { tipo: t, rotulo: ROTULO_TIPO_CONTEUDO[t] ?? t, alcance: null, views: null };
        x[chave] = (x[chave] ?? 0) + v;
        tipos.set(t, x);
      }
    }
  }
  const somaAlcance = soma([...tipos.values()].map((t) => t.alcance));
  const itens = [...tipos.values()].map((t) => ({ ...t, pctAlcance: pctNum(t.alcance, somaAlcance) })).sort((a, b) => (b.alcance ?? -1) - (a.alcance ?? -1));
  const ultimas = todas.slice(-4);
  const nao = soma(ultimas.map((w) => w.nao));
  const baseNao = soma(ultimas.map((w) => w.baseNao));
  const frases = [];
  if (baseNao > 0) {
    const n = ultimas.length;
    frases.push(`${n === 1 ? 'Na última semana com dado' : `Nas últimas ${n} semanas com dado`}, ${pctF(nao, baseNao)} do alcance diário somado veio de quem não segue a conta.`);
  }
  if (itens[0]?.alcance > 0 && somaAlcance > 0) {
    frases.push(`${itens[0].rotulo} somaram ${pctF(itens[0].alcance, somaAlcance)} do alcance por tipo de conteúdo em ${recentes.length} ${recentes.length === 1 ? 'dia' : 'dias'}.`);
  }
  return {
    semanas: lista8,
    porTipo: { inicio: recentes[0] ?? null, fim: recentes.at(-1) ?? null, dias: recentes.length, itens },
    frase: frases.join(' '),
  };
}

// seguiram × deixaram por dia (os últimos `dias`, até hoje). novosPorDia: o diario da sincronização
// (follower_count: seguidores novos do dia), usado quando follows_and_unfollows não veio
export function crescimento(diario, { hoje, dias = 30, novosPorDia = null } = {}) {
  const d = objeto(diario) ?? {};
  const novos = objeto(novosPorDia) ?? {};
  const linhas = [];
  for (let k = dias - 1; k >= 0; k--) {
    const dia = somarDias(hoje, -k);
    if (!dia) continue;
    const x = objeto(d[dia]) ?? {};
    const seguiram = finito(x.seguiram) ? x.seguiram : finito(novos[dia]?.seguidores) ? novos[dia].seguidores : null;
    linhas.push({ dia, seguiram, deixaram: finito(x.deixaram) ? x.deixaram : null, total: finito(x.seguidoresTotal) ? x.seguidoresTotal : null });
  }
  const comS = linhas.filter((l) => finito(l.seguiram));
  if (!comS.length) return { dias: linhas, frase: '' };
  const s = soma(comS.map((l) => l.seguiram));
  const ambos = linhas.filter((l) => finito(l.seguiram) && finito(l.deixaram));
  const periodo = `Nos últimos ${dias} dias${comS.length < dias - 1 ? ` (${comS.length} com dado)` : ''}`;
  let frase = `${periodo}, ${s === 1 ? '1 conta começou' : `${n0(s)} contas começaram`} a seguir`;
  if (ambos.length === comS.length) {
    const dd = soma(ambos.map((l) => l.deixaram));
    const saldo = s - dd;
    frase += ` e ${n0(dd)} ${dd === 1 ? 'deixou' : 'deixaram'} de seguir (saldo ${saldo < 0 ? `negativo de ${n0(-saldo)}` : `de ${n0(saldo)}`})`;
  }
  return { dias: linhas, frase: `${frase}.` };
}

// seguidores: o total mais novo guardado (ou o da conta), com a variação de 7 dias
export function resumoSeguidores(diario, { contaTotal = null, contaEm = null } = {}) {
  const d = objeto(diario) ?? {};
  const dias = Object.keys(d).filter((k) => finito(d[k]?.seguidoresTotal)).sort();
  const ult = dias.at(-1);
  const total = ult ? d[ult].seguidoresTotal : finito(contaTotal) ? contaTotal : null;
  const em = ult ? d[ult].em ?? ult : contaEm ?? null;
  let variacao7d = null;
  if (ult) {
    const alvo = somarDias(ult, -7);
    const antes = dias.filter((k) => k <= alvo).at(-1);
    if (antes && diasEntre(antes, alvo) <= 2) variacao7d = total - d[antes].seguidoresTotal;
    if (variacao7d == null) {
      const semana = Array.from({ length: 7 }, (_, i) => d[somarDias(ult, -1 - i)]);
      if (semana.every((x) => finito(x?.seguiram) && finito(x?.deixaram))) variacao7d = soma(semana.map((x) => x.seguiram - x.deixaram));
    }
  }
  return { total, em, variacao7d };
}

export const FAIXAS_HORA = [
  { faixa: 'madrugada', rotulo: 'Madrugada (0h a 6h)', nome: 'madrugada', de: 0, ate: 6 },
  { faixa: 'manha', rotulo: 'Manhã (6h a 12h)', nome: 'manhã', de: 6, ate: 12 },
  { faixa: 'tarde', rotulo: 'Tarde (12h a 18h)', nome: 'tarde', de: 12, ate: 18 },
  { faixa: 'noite', rotulo: 'Noite (18h a 24h)', nome: 'noite', de: 18, ate: 24 },
];

// nossos horários: score = log2 do alcance contra a mediana do formato (reel com reel; feed e carrossel juntos,
// com 3 posts ou mais no formato). Fora: post com anúncio e post com menos de idadeMinH horas
export function horariosNossos(posts, { agora = null, comAnuncio = new Set(), idadeMinH = 72 } = {}) {
  const agoraMs = msDe(agora);
  const fora = comAnuncio instanceof Set ? comAnuncio : new Set(lista(comAnuncio).map(String));
  const ok = lista(posts).filter((p) => {
    const t = msDe(p?.timestamp);
    return finito(p?.reach) && t != null && !fora.has(String(p.midiaId)) && (agoraMs == null || agoraMs - t >= idadeMinH * HORA_MS);
  });
  const grupo = (p) => (p.tipo === 'REELS' ? 'reel' : 'feed');
  const med = {};
  for (const g of ['reel', 'feed']) {
    const xs = ok.filter((p) => grupo(p) === g).map((p) => p.reach);
    med[g] = xs.length >= 3 ? mediana(xs) : null;
  }
  const faixas = FAIXAS_HORA.map((f) => ({ ...f, scores: [] }));
  for (const p of ok) {
    const s = log2Razao(p.reach, med[grupo(p)]);
    const h = horaBrasilia(p.timestamp);
    if (s == null || h == null) continue;
    faixas.find((f) => h >= f.de && h < f.ate)?.scores.push(s);
  }
  return faixas.map((f) => ({ faixa: f.faixa, rotulo: f.rotulo, n: f.scores.length, medianaScore: f.scores.length ? arred(mediana(f.scores), 3) : null }));
}

// frase dos horários: as 3 horas de mais seguidores online e a faixa nossa que melhor foi (com 3+ posts)
export function fraseHorarios(online, nossos) {
  const partes = [];
  if (Array.isArray(online) && online.some(finito)) {
    const top = online.map((v, h) => ({ h, v })).filter((x) => finito(x.v)).sort((a, b) => b.v - a.v || a.h - b.h).slice(0, 3);
    partes.push(`Os seguidores ficam mais online às ${listaPt(top.map((x) => `${x.h}h`))} (horário de Brasília).`);
  }
  const bons = lista(nossos).filter((f) => f.n >= 3 && finito(f.medianaScore)).sort((a, b) => b.medianaScore - a.medianaScore);
  if (bons.length >= 2) {
    const m = bons[0];
    const nome = FAIXAS_HORA.find((f) => f.faixa === m.faixa)?.nome ?? m.faixa;
    partes.push(`Nos nossos posts, os da ${nome} (${m.n} posts) tiveram alcance de ${vezes(fatorDeScore(m.medianaScore))} a mediana do formato: é sinal, não prova.`);
  } else if (lista(nossos).some((f) => f.n)) {
    partes.push('Ainda são poucos posts por horário pra comparar (precisa de 3 ou mais em duas faixas).');
  }
  return partes.join(' ');
}
