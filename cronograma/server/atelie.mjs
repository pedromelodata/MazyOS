// Ateliê (21/10/2026, Pedro): "aba Ateliê toda vez que for criar um reel, carrossel ou estático". É o motor oficial
// de criação de posts da marca (identidade/brandmkt/05-motor-atelie, cópia do atelie/ do vault) dentro do app: o
// chat de criação de sempre (reels-leo, FATOS, regras duras, tipo e dia escolhidos no app) mais o método do Ateliê.
// Antes de salvar, a IA mostra a peça como CARD (ferramenta mostrar_card, em agente.mjs): o texto inteiro mais o
// público, a persona (as 5 dorsais do Ateliê), o estágio do funil, o dial de ironia e quem fala. O servidor confere
// o texto contra as regras duras por código (conferir, o equivalente ao ds/regras.json do motor): bloqueante impede
// o salvar_reel; alerta e revisar ficam no card pra decidir. A anti-repetição compara o gancho com as peças dos
// últimos 90 dias e só avisa (decisão do Ateliê de 26/08: alerta, não bloqueio).
// 22/10 (Pedro): "sempre que falar de funcionário, nunca diga funcionário, e sim colaborador" virou regra que barra
// (colaborador, com a troca sugerida na mesma concordância) e o zero travessão passou a pegar a família inteira de
// traços e o hífen solto que a IA põe no lugar do travessão. A P39 vale em tudo, inclusive no pilar 3
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { RAIZ } from './importar.mjs';

const DS = path.join(RAIZ, 'identidade', 'brandmkt', '05-motor-atelie', 'ds');
const DIAS_REPETICAO = 90;
const LIMITE_LEGENDA = 700;
// a lista do voz.json, se o arquivo não estiver no servidor. Agilize e Facilite também são verbos: só "revisar"
const CONCORRENTES_PADRAO = ['Contabilizei', 'Agilize', 'Contaja', 'Facilite', 'Contabilivre', 'Marvee', 'ContaAzul', 'Nubank'];
const CONCORRENTE_VERBO = new Set(['Agilize', 'Facilite']);

export const PERSONAS = ['A', 'B', 'C', 'D', 'E', 'geral'];
export const PUBLICOS = ['MEI', 'ME', 'MEI e ME'];
export const ESTAGIOS = ['topo', 'meio', 'fundo', 'lista de espera'];
export const IRONIAS = ['zero', 'baixo', 'médio', 'alto'];
export const VOZES = ['pedro', 'colega', 'institucional', 'leo'];
// 21/10 (estratégia principal, marketing/estrategia/ESTRATEGIA-PRINCIPAL.md): pilar × gatilho emocional × psicológico
export const GATILHOS_EMOCIONAIS = [
  'cansaço da burocracia', 'medo de errar com o fisco', 'alívio da conquista', 'vergonha do contabilês', 'pressa de prazo travado',
  'orgulho de virar empresa', 'declaração anual do MEI', 'imposto de renda', 'virada de ano', 'dia do microempreendedor', 'PLP 108/2021',
];
export const GATILHOS_PSICOLOGICOS = ['curiosidade', 'identificação', 'prova social', 'reciprocidade', 'ancoragem', 'novidade', 'escassez real'];

let ds = null;
async function lerDs() {
  if (ds) return ds;
  const ler = async (nome) => JSON.parse(await readFile(path.join(DS, nome), 'utf8'));
  const [personas, voz] = await Promise.all([ler('personas.json').catch(() => null), ler('voz.json').catch(() => null)]);
  const lista = (voz?.glossario?.concorrentesNomeados?.lista ?? []).map((c) => c?.nome).filter(Boolean);
  ds = {
    dorsais: (personas?.dorsais ?? []).map((d) => ({ id: d.id, nome: d.nome, perfil: d.perfil, ironia: d.dialIroniaPontoDePartida })),
    concorrentes: lista.length ? lista : CONCORRENTES_PADRAO,
  };
  return ds;
}
// o nome da dorsal pro card ("Direto"); "geral" fica geral
export async function nomePersona(id) {
  const d = (await lerDs()).dorsais.find((x) => x.id === id);
  return d ? d.nome : id === 'geral' ? 'Geral' : '';
}

// ── conferência por código ──
const tem = (v) => Boolean(String(v ?? '').trim());
const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// o texto da peça campo a campo. publico: vai pro ar (copy); o resto é produção (o que a cena ou a arte mostram)
function partes(p) {
  const out = [];
  const add = (onde, texto, publico = true) => { if (tem(texto)) out.push({ onde, texto: String(texto), publico }); };
  add('Hook', p.hook);
  add('Texto de tela', p.textoTela);
  (p.cenas ?? []).forEach((c, i) => {
    add(`Cena ${i + 1}`, c?.fala);
    add(`Tela da cena ${i + 1}`, c?.tela);
    add(`Cena ${i + 1} (o que mostra)`, c?.cena, false);
  });
  add('Desenvolvimento', p.desenvolvimento);
  add('CTA', p.cta);
  const ca = p.carrossel;
  if (ca) {
    const slide = (nome, s) => { add(nome, [s?.titulo, s?.texto].filter(tem).join('\n')); add(`${nome} (visual)`, s?.visual, false); };
    slide('Capa', ca.capa);
    (ca.slides ?? []).forEach((s, i) => slide(`Slide ${i + 2}`, s));
    slide('Slide final', ca.final);
  }
  const es = p.estatico;
  if (es) {
    add('Headline', es.headline);
    add('Apoio', es.apoio);
    add('CTA da arte', es.cta);
    add('Arte (visual)', es.visual, false);
  }
  add('Legenda', p.legenda);
  if (p.gravacao && typeof p.gravacao === 'object') {
    add('Produção', Object.values(p.gravacao).flat().filter((v) => typeof v === 'string').join('\n'), false);
  }
  return out;
}

// trecho curto em volta do que achou, pra mostrar no card
function trecho(texto, re) {
  const m = re.exec(texto);
  if (!m) return '';
  const ini = Math.max(0, m.index - 40);
  const fim = Math.min(texto.length, m.index + m[0].length + 40);
  // corte no meio de um emoji deixa meio par de surrogate: tira a sobra das pontas
  const miolo = texto.slice(ini, fim).replace(/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/g, '').replace(/\s+/g, ' ').trim();
  return `${ini > 0 ? '...' : ''}${miolo}${fim < texto.length ? '...' : ''}`;
}
function achar(ps, re, filtro = () => true) {
  const achados = [];
  for (const p of ps.filter(filtro)) {
    const r = new RegExp(re.source, re.flags.replace('g', ''));
    if (r.test(p.texto)) achados.push({ onde: p.onde, trecho: trecho(p.texto, r) });
  }
  return achados;
}

// 22/10 (achado da revisão do estúdio): proibida de usar travessão, a IA troca por " - ". Conta como travessão: os
// traços de U+2012 a U+2015, o sinal de menos U+2212 e o hífen solto (1 a 3 hífens entre espaços ou na ponta da
// linha). Hífen colado na palavra ou no número (6x1, e-CNPJ, 30-35s, -5%) passa
const CLASSE_TRACOS = `[${String.fromCharCode(0x2012)}-${String.fromCharCode(0x2015)}${String.fromCharCode(0x2212)}]`;
const TRACOS = new RegExp(CLASSE_TRACOS);
const HIFEN_SOLTO = /(^|\s)-{1,3}(?=\s|$)/m;
export const TRACO_OU_HIFEN_SOLTO = new RegExp(`${TRACOS.source}|${HIFEN_SOLTO.source}`, 'm');
// a troca do hífen solto e dos outros traços que a regra acima barra (U+2012 a U+2015 e U+2212) no texto que a IA
// escreve (pesquisa de temas, notícias, gerador da semana): entre números volta a ser o hífen colado ("30 - 35" vira
// "30-35"), o sinal de menos colado no número vira hífen ("-5%"), no meio da frase vira vírgula e na ponta da linha sai
export function semHifenSolto(texto) {
  return String(texto ?? '')
    .replace(new RegExp(`(\\d)[ \\t]*(?:${CLASSE_TRACOS}|-{1,3})[ \\t]*(?=\\d)`, 'g'), '$1-')
    .replace(new RegExp(`${String.fromCharCode(0x2212)}(?=\\d)`, 'g'), '-')
    .replace(new RegExp(`[ \\t]*${CLASSE_TRACOS}[ \\t]*`, 'g'), ', ')
    .replace(/[ \t]+-{1,3}(?=[ \t])/g, ',')
    .replace(/^-{1,3}[ \t]+|[ \t]+-{1,3}$/gm, '')
    .replace(/^, |, $/gm, '');
}

// 22/10 (Pedro): colaborador, nunca funcionário. Só o substantivo: "funcionaria" sem acento é o verbo (o app
// funcionaria), então o feminino só conta com acento; o masculino conta com ou sem
const FUNCIONARIO = /\bfuncion(?:[áa]ri(o)|ári(a))(s?)\b/i;
// a troca na mesma concordância (gênero, número e caixa): "Até 2 funcionários" vira "Até 2 colaboradores"
export function trocarFuncionario(texto) {
  return String(texto ?? '').replace(new RegExp(FUNCIONARIO.source, 'gi'), (achado, masc, fem, plural) => {
    const novo = masc ? `colaborador${plural ? 'es' : ''}` : `colaboradora${plural ? 's' : ''}`;
    if (achado === achado.toUpperCase()) return novo.toUpperCase();
    return achado[0] === achado[0].toUpperCase() ? novo[0].toUpperCase() + novo.slice(1) : novo;
  });
}
export const temFuncionario = (texto) => FUNCIONARIO.test(String(texto ?? ''));
// P39 (Pedro, 21/10, e vale em tudo desde 22/10): o Mauro, o escritório Legalize (e a Legalize Group) e os "22 anos"
export const P39 = /\bmauro\b|\blegalize\b|\b22 anos\b/i;

// regra por expressão: todos = confere também o texto de produção (b-roll, visual)
const REGRAS = [
  { id: 'travessao', nome: 'Zero travessão', nivel: 'bloqueante', re: TRACO_OU_HIFEN_SOLTO, todos: true, dica: 'Troque o travessão (e o hífen solto no lugar dele, " - ") por vírgula, ponto ou dois-pontos.' },
  { id: 'p39', nome: 'Sem Mauro, escritório Legalize ou "22 anos"', nivel: 'bloqueante', re: P39, todos: true, dica: 'PROIBIDO P39: nem em texto, imagem, b-roll, legenda ou fonte.' },
  { id: 'garantia', nome: 'Garantia nunca "incondicional"', nivel: 'alerta', re: /incondiciona/i, dica: 'A garantia tem condição (F021 e F022).' },
  { id: 'letra-miuda', nome: '"Sem letra miúda" não vira promessa', nivel: 'revisar', re: /sem letra mi[uú]da/i, dica: 'Como assunto pode; como promessa de garantia, não.' },
  { id: 'escassez', nome: 'Escassez só a real', nivel: 'alerta', re: /s[óo] hoje|[úu]ltimas vagas|[úu]ltimas unidades|vagas limitadas|corre que acaba|acaba hoje|[úu]ltima chance/i, dica: 'A única escassez real é a oferta até 31/12/2026.' },
  { id: 'p38', nome: 'Nunca ensinar a fazer sozinho', nivel: 'revisar', re: /(fa[çz]a|faz|fazer|abra|abrir|emita|emitir|declare|declarar) (voc[êe] mesm[oa]|sozinh[oa])|passo a passo (no|do|na|pelo) (portal|gov|emissor)|quem abre [ée] voc[êe]|(entre|acesse|entra) no portal do empreendedor/i, dica: 'PROIBIDO P38: o caminho é sempre o app (no MEI o app prepara e o titular só confirma; na ME a gente abre).' },
  { id: 'pre-lancamento', nome: 'App ainda não está pra baixar', nivel: 'alerta', re: /baix(e|a|ar) (o app|agora)|j[áa] dispon[íi]vel|app store|play store|google play/i, dica: 'Pré-lançamento: a chamada é a lista de espera pelo link da bio.' },
  { id: 'data-app', nome: 'Data do app: chega dia 10/11', nivel: 'revisar', re: /app que (t[áa]|est[áa]) chegando/i, dica: 'Pedro, 14/10: diga a data (o app chega dia 10/11) no lugar de "o app que tá chegando".' },
  { id: 'link-bio', nome: 'CTA é "link da bio"', nivel: 'alerta', re: /link (abaixo|aqui embaixo|na descri[çc][ãa]o)/i, dica: 'Reel orgânico chama pro link da bio.' },
  { id: 'hashtag', nome: 'Legenda sem hashtag', nivel: 'alerta', re: /(^|\s)#[\p{L}\d_]{2,}/u, filtro: (p) => p.onde === 'Legenda', dica: 'Pedro: legenda curta, com emoji e sem hashtag.' },
  { id: 'grafia', nome: 'Grafia "Legalizaí"', nivel: 'alerta', re: /\bLegalizai\b(?![.\w])|\bLegalizei\b|Story Book/, dica: 'A marca se escreve Legalizaí, com acento.' },
  // 21/10: o que a auditoria da anatomia do orgânico achou (seção 11 da estratégia principal)
  { id: 'fundador', nome: 'Sem "vagas de fundador"', nivel: 'bloqueante', re: /vagas? de fundador|oferta de fundador|pre[çc]o de fundador|plano fundador/i, dica: 'P09: a promoção é uma só, até 31/12/2026 (F005). Nada de "fundador" nem de vagas.' },
  { id: 'prazo-abertura', nome: 'Sem prazo pra ter o CNPJ', nivel: 'alerta', re: /cnpj (pronto )?r[áa]pido|cnpj (sai|fica pronto|pronto) em|sai em \d+ (dias?|horas?)|em (24|48|72) ?h(oras)?\b/i, dica: 'P01: nenhum número de tempo pra ter o CNPJ.' },
  { id: 'simulador', nome: 'Simulador não tem link', nivel: 'alerta', re: /simulador/i, dica: 'P11 e F009: só existem 3 links (lista de espera, site e Instagram). O simulador volta quando tiver link.' },
  { id: 'fidelidade', nome: 'Fidelidade de 12 meses', nivel: 'alerta', re: /sem fidelidade|cancel[ae] quando quiser|sair sem custo/i, dica: 'F023: o plano tem fidelidade de 12 meses a partir da emissão do CNPJ.' },
  { id: 'servico-que-nao-faz', nome: 'Serviço que o app não faz', nivel: 'revisar', re: /(d[áa]|damos|a gente d[áa]) baixa|regulariza(mos)? (a sua|sua) (empresa|d[íi]vida)|(de|é) gr[áa]tis|sem custo/i, dica: 'P07 e P10: baixa e regularização não são serviço do app, e "grátis" só onde não existe custo.' },
];

const NUMERO = /R\$\s?\d|\d+([.,]\d+)?\s?%|\b\d{1,2}\/\d{1,2}\b|\b\d{1,3}(\.\d{3})+\b/;
const palavras = (s) => new Set(semAcento(s).split(/[^a-z0-9]+/).filter((w) => w.length > 3));
function parecido(a, b) {
  const x = palavras(a);
  const y = palavras(b);
  if (x.size < 3 || y.size < 3) return 0;
  let comum = 0;
  for (const w of x) if (y.has(w)) comum++;
  return comum / (x.size + y.size - comum);
}
const ganchoDe = (r) => r?.roteiro?.hook || r?.carrossel?.capa?.titulo || r?.estatico?.headline || r?.hook || '';

// peca: o que a IA mandou (campos do salvar_reel); meta: o card (persona, voz...); db e reelId pra anti-repetição
export async function conferir(peca, { db = null, reelId = null, meta = {} } = {}) {
  const { concorrentes } = await lerDs();
  const ps = partes(peca ?? {});
  const publicas = (p) => p.publico;
  const itens = [];
  const item = (regra, achados, extra = {}) => itens.push({ id: regra.id, nome: regra.nome, nivel: regra.nivel, ok: !achados.length, dica: regra.dica ?? '', achados, ...extra });

  for (const r of REGRAS) item(r, achar(ps, r.re, r.filtro ?? (r.todos ? () => true : publicas)));

  // concorrente: nome que só existe como marca bloqueia; os que também são verbo pedem um olho humano
  const marca = concorrentes.filter((c) => !CONCORRENTE_VERBO.has(c));
  const verbo = concorrentes.filter((c) => CONCORRENTE_VERBO.has(c));
  const reMarca = new RegExp(`\\b(${marca.map((c) => c.replace(/([a-z])([A-Z])/g, '$1 ?$2')).join('|')})\\b`, 'i');
  item({ id: 'concorrente', nome: 'Zero concorrente citado', nivel: 'bloqueante', dica: 'Nenhuma marca concorrente na peça (a lista é só pra conferência interna).' }, marca.length ? achar(ps, reMarca, () => true) : []);
  if (verbo.length) {
    item({ id: 'concorrente-verbo', nome: `"${verbo.join('" e "')}" como marca`, nivel: 'revisar', dica: 'Com maiúscula pode ser nome de concorrente; como verbo, pode.' }, achar(ps, new RegExp(`\\b(${verbo.join('|')})\\b`), publicas));
  }

  // 22/10 (Pedro): colaborador, nunca funcionário. Barra como a P39, e cada achado já leva a troca sugerida
  item({ id: 'colaborador', nome: 'Colaborador, nunca "funcionário"', nivel: 'bloqueante', dica: 'Pedro, 22/10: diga colaborador, colaboradora, colaboradores ou colaboradoras, na mesma concordância ("Até 2 colaboradores", "Se você tem colaborador").' },
    achar(ps, FUNCIONARIO, publicas).map((a) => ({ ...a, sugestao: trocarFuncionario(a.trecho) })));

  // MEI com contador humano: frase que fala de MEI e de contador, sem assistente virtual e sem negar
  const meiContador = [];
  for (const p of ps.filter(publicas)) {
    for (const frase of p.texto.split(/[.!?\n]+/)) {
      if (/\bMEI\b/.test(frase) && /contador/i.test(frase) && !/assistente virtual/i.test(frase) && !/n[ãa]o (precisa|tem|existe|vai ter)|sem contador/i.test(frase)) {
        meiContador.push({ onde: p.onde, trecho: frase.trim().slice(0, 140) });
      }
    }
  }
  item({ id: 'mei-contador', nome: 'MEI sem contador humano', nivel: 'revisar', dica: 'No MEI é assistente virtual, nunca contador humano dedicado.' }, meiContador);

  // "100% humana" fala do plano ME: no texto em que aparece, o plano ME tem que estar dito (P06)
  const humana = ps.filter(publicas).filter((p) => /100\s?% human[oa]/i.test(p.texto) && !/plano ME|na ME\b|\bME do Simples/i.test(p.texto))
    .map((p) => ({ onde: p.onde, trecho: trecho(p.texto, /100\s?% human[oa]/i) }));
  item({ id: 'humana-me', nome: '"100% humana" junto do plano ME', nivel: 'revisar', dica: 'P06: o humano é do plano ME; no MEI é assistente virtual.' }, humana);

  // número sem fonte
  // o mote "100% digital / 100% humana" é claim, não número que pede fato
  const semClaim = (t) => t.replace(/100\s?%\s?(e\s)?(human|digital)\w*/gi, '');
  const comNumero = ps.filter(publicas).filter((p) => NUMERO.test(semClaim(p.texto)));
  const semFonte = comNumero.length && !(peca?.fontes ?? []).some(tem);
  item({ id: 'fontes', nome: 'Número com fonte (id do FATOS)', nivel: 'alerta', dica: 'Todo número, data, preço ou regra cita o fato em Fontes.' },
    semFonte ? comNumero.slice(0, 3).map((p) => ({ onde: p.onde, trecho: trecho(p.texto, NUMERO) })) : []);

  // legenda curta
  const leg = String(peca?.legenda ?? '');
  item({ id: 'legenda', nome: 'Legenda curta', nivel: 'alerta', dica: `Até uns 600 caracteres (esta tem ${leg.length}).` },
    leg.length > LIMITE_LEGENDA ? [{ onde: 'Legenda', trecho: `${leg.length} caracteres` }] : []);

  // Léo em 1ª pessoa tem que aparecer
  item({ id: 'leo', nome: 'Léo falando aparece na peça', nivel: 'revisar', dica: 'Se o Léo fala em 1ª pessoa, ele aparece no vídeo ou na arte.' },
    meta?.voz === 'leo' ? [{ onde: 'Card', trecho: 'Quem fala: Léo' }] : []);

  // anti-repetição: gancho parecido com peça dos últimos 90 dias (só avisa)
  const gancho = ganchoDe(peca);
  const repetidas = [];
  if (db && tem(gancho)) {
    const limite = Date.now() - DIAS_REPETICAO * 86_400_000;
    for (const r of db.reels ?? []) {
      if (r.id === reelId || !r.data || Date.parse(`${r.data}T12:00:00`) < limite) continue;
      const g = ganchoDe(r);
      if (Math.max(parecido(gancho, g), parecido(gancho, r.ideia)) >= 0.5) repetidas.push({ onde: r.data.split('-').reverse().slice(0, 2).join('/'), trecho: r.ideia });
    }
  }
  const motivo = String(meta?.excecaoAntiRepeticao ?? '').trim();
  item({ id: 'repeticao', nome: 'Anti-repetição (últimos 90 dias)', nivel: 'alerta', dica: motivo ? `Repetição de propósito: ${motivo}` : 'Gancho parecido com peça recente: mude o ângulo ou diga o motivo.' },
    motivo ? [] : repetidas.slice(0, 3));

  const falhas = itens.filter((i) => !i.ok);
  return {
    itens,
    bloqueia: falhas.some((i) => i.nivel === 'bloqueante'),
    contagem: { ok: itens.length - falhas.length, bloqueante: falhas.filter((i) => i.nivel === 'bloqueante').length, alerta: falhas.filter((i) => i.nivel === 'alerta').length, revisar: falhas.filter((i) => i.nivel === 'revisar').length },
  };
}

// o que a IA lê de volta (resposta do mostrar_card e recusa do salvar_reel)
export function textoConferencia(qa) {
  const falhas = qa.itens.filter((i) => !i.ok);
  if (!falhas.length) return `Conferência do Ateliê: as ${qa.itens.length} regras passaram.`;
  // 22/10: o achado com troca sugerida (colaborador) diz também como fica
  const linha = (i) => `- [${i.nivel}] ${i.nome}: ${i.achados.map((a) => `${a.onde}: "${a.trecho}"${a.sugestao ? ` (fica: "${a.sugestao}")` : ''}`).join('; ')}${i.dica ? ` (${i.dica})` : ''}`;
  return [
    `Conferência do Ateliê: ${qa.contagem.ok} regras ok, ${qa.contagem.bloqueante} bloqueante(s), ${qa.contagem.alerta} alerta(s), ${qa.contagem.revisar} pra revisar.`,
    ...falhas.map(linha),
    qa.bloqueia ? 'Com bloqueante a peça não salva: corrija e chame mostrar_card de novo.' : '',
  ].filter(Boolean).join('\n');
}

// peças recentes pra anti-repetição (vão nos dados de referência da primeira mensagem)
export function pecasRecentes(db, reelId = null) {
  const limite = Date.now() - DIAS_REPETICAO * 86_400_000;
  return (db.reels ?? [])
    .filter((r) => r.id !== reelId && r.data && Date.parse(`${r.data}T12:00:00`) >= limite)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 40)
    .map((r) => ({ data: r.data, peca: r.peca ?? 'reel', tipo: r.tipo ?? null, titulo: r.ideia, gancho: ganchoDe(r) }));
}

// bloco do system prompt na aba Ateliê
export async function blocoAtelie() {
  const { dorsais } = await lerDs();
  // o personas.json do motor tem travessão e o dial sem acento: aqui sai limpo (a IA copia o que lê)
  // 22/10: a família inteira de traços e o hífen solto também viram vírgula
  const IRONIA = { alto: 'alto', medio: 'médio', baixo: 'baixo', baixissimo_a_zero: 'zero' };
  const limpo = (s) => String(s ?? '').replace(new RegExp(`\\s*${CLASSE_TRACOS}\\s*`, 'g'), ', ').replace(/\s+-{1,3}\s+/g, ', ');
  const personas = dorsais.length
    ? dorsais.map((d) => `- ${d.id} ${limpo(d.nome)}: ${limpo(d.perfil)} (ironia de partida: ${IRONIA[d.ironia] ?? limpo(d.ironia)})`).join('\n')
    : '- (índice das personas indisponível neste servidor)';
  return `
## Ateliê: esta conversa está na aba Ateliê (o motor oficial de criação de posts da marca)
O Ateliê (identidade/brandmkt/05-motor-atelie) é o método de criação do Legalizaí: pedido no chat, a peça vira um CARD, o card passa pela conferência das regras duras e só então é salvo. Tudo o que está acima continua valendo (fluxo da reels-leo, FATOS, regras duras); o Ateliê muda o item 5 do fluxo e acrescenta:
1. **Card antes de salvar.** Com a versão completa pronta, chame a ferramenta **mostrar_card** com a peça inteira (os mesmos campos do salvar_reel) e os campos do card: público (MEI, ME ou MEI e ME), persona (uma das dorsais abaixo, ou "geral"), estágio do funil (topo, meio, fundo ou lista de espera), dial de ironia, quem fala, se a peça cita valor (preço ou data), os dois gatilhos da estratégia principal (o emocional e o psicológico) e o motivo (a "defesa": por que o post existe na estratégia, em 1 a 3 frases). A tela mostra o card e a conferência ao lado do chat: não cole o texto inteiro no chat, diga em 2 ou 3 linhas curtas o que a peça faz e o que a conferência apontou.
2. **Conferência.** A resposta do mostrar_card traz o que a conferência por código achou. Bloqueante (travessão, inclusive o hífen solto no lugar dele; P39; concorrente; "funcionário", que é sempre colaborador) impede salvar: corrija e chame mostrar_card de novo antes de perguntar qualquer coisa. Alerta: corrija, a não ser que tenha motivo (diga qual em uma linha). Revisar: é pra pessoa olhar; avise em uma linha.
3. **Salvar.** Pergunte se pode salvar. Só depois do sim, chame salvar_reel com o mesmo conteúdo do último card, sem mudar o que o usuário não pediu. Pedido de ajuste: refaça o card (mostrar_card) e pergunte de novo.
4. **Anti-repetição é alerta, não bloqueio.** Evite repetir gancho, ângulo e headline das peças recentes (pecasRecentes, nos dados de referência). Se repetir de propósito, preencha excecaoAntiRepeticao no card com o motivo.
5. **Ironia mira o sistema**, nunca a dúvida ou o erro de quem lê. O dial de cada persona é o ponto de partida, não trava. Com a persona C, na dúvida, sem ironia.
6. **Léo em 1ª pessoa aparece.** Se a peça fala na voz do Léo, ele aparece no vídeo ou na arte.

Personas do Ateliê (dorsais; o arquivo de cada uma está em identidade/brandmkt/02-personas/, leia quando precisar de nuance):
${personas}

## A estratégia principal (marketing/estrategia/ESTRATEGIA-PRINCIPAL.md, 21/10; leia o arquivo quando precisar do detalhe)
- **O sistema:** pilar × gatilho emocional × gatilho psicológico. O card diz os três (o pilar vai no salvar_reel).
- **Blocos e fatias:** Afeto e marca 20% (pilares 1, 2 e 3) · Educação e dor 30% (4, 5 e 16) · Diferencial e confiança 25% (8, 9 e 17) · Conversão e produto 25% (10, 11, 12 e 13). Guardados: 6, 7, 14 e 15 (não usar agora).
- **Pilar 3 (Nossa origem):** a origem do Legalizaí e de quem constrói o produto novo. No pilar 1 é uma pessoa; aqui é a empresa (Pedro, 22/10: a P39 vale em tudo, inclusive aqui).
- **Colaborador, nunca "funcionário"** (Pedro, 22/10), na mesma concordância: "Até 2 colaboradores", "Se você tem colaborador".
- **Ângulos do pilar 8:** preço fechado ("sem 'a partir de'"), gente no plano ME (contador com CRC só na ME), daqui de BH (ISS de BH), 7 dias na ME com a condição, capricho, tudo pelo app (sem papel nem cartório, você só assina) e preço redondo (R$ 49 no plano MEI, sempre com o promocional e a validade). Fora: "CNPJ pronto rápido" (P01), "sair sem custo" (P07, F023) e o simulador (sem link, P11).
- **Gatilhos emocionais:** ${GATILHOS_EMOCIONAIS.slice(0, 6).join(', ')} (o ano todo, 70%); ${GATILHOS_EMOCIONAIS.slice(6).join(', ')} (data marcada, 30% quando há data perto).
- **Gatilhos psicológicos:** ${GATILHOS_PSICOLOGICOS.join(', ')}. Novidade é o app que chega dia 10/11 e a funcionalidade nova; escassez só a real (a promoção até 31/12/2026), nunca "vagas de fundador" (P09).
- **Ritmo:** por semana, 3 reels, 5 feeds e 5 temas de stories; feed às 18h na terça, quinta e sexta. Venda no máximo 20% da pauta fora da promoção, até 30% enquanto ela vale.
- **Convite em 2 níveis:** engajamento (salvar, depois mandar, depois comentar) e venda (lista de espera pelo link da bio). Post de atração não leva convite de venda; no molde da legenda a CTA abre e fecha.
- **Formatos especiais:** "O app em X segundos" (tela real, tarefa chata resolvida, sem narração técnica) e "Traduzindo o contabilês" (um termo por peça, das dúvidas da caixinha quinzenal).
`.trim();
}
