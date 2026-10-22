// Mecanismo de anti-repetição e continuidade da estratégia (21/10/2026, Pedro, P4): olha uma semana (segunda a
// domingo) contra a estratégia principal (marketing/estrategia/ESTRATEGIA-PRINCIPAL.md) e contra as semanas de antes.
// Puro: recebe o banco (db.reels e db.stories) e devolve a análise, sem disco nem relógio. Quem usa: a rota
// GET /api/mecanismo (rotas-conteudo.mjs), o gerador da semana (gerador-semana.mjs) e o aplicar-mecanismo-2610.mjs.
// Decisões:
//  - item da semana: a peça de feed (reel, carrossel, estático) e o tema de stories do dia (db.stories; a peça antiga
//    com peca 'stories' conta como stories quando o dia não tem db.stories). Os 13 itens da semana (3 reels, 5 feeds e
//    5 temas de stories) entram no mix, como o calendário de 26/10 conta
//  - anti-repetição (alerta, nunca bloqueio, decisão do Ateliê de 26/08): mesmo pilar E ideia, gancho ou headline
//    parecidos (Jaccard >= 0,5 nas palavras sem acento de mais de 3 letras, fora umas palavras de ligação que
//    aparecem em tudo) contra as 8 semanas anteriores e a própria semana; pilar 8 com o mesmo ângulo nas últimas 4
//    semanas; o mesmo pilar 2+ vezes na semana (o stories ligado à peça do dia, com o mesmo pilar, conversa com ela e
//    não conta de novo)
//  - 21/10 (Pedro): o stories ligado à peça do dia (pecaDoDia) também não é comparado com ela no texto parecido nem no
//    ângulo do pilar 8: o teaser do carrossel repete as palavras do carrossel de propósito, e o alerta travava o post
//    gerado (ia como 'ideia', sem aprovação)
//  - 21/10: as 12 peças da 1ª campanha (identidade/brandmkt/05-motor-atelie/pecas, todas do pilar 10) entram como
//    peças existentes quando quem chama passa opcoes.campanha (pecasDaCampanha): a regra 8 do motor Ateliê diz "o
//    pilar já tem 12 peças na campanha de lançamento; prefira outro pilar salvo pedido explícito". É o que o
//    calendário de 26/10 acusou nos stories de oferta de 31/10
//  - excecaoAntiRepeticao.ativa transforma os alertas de repetição da peça num info só, "Repetição de propósito:
//    <motivo>" (a mecânica recorrente se repete por definição e não pede exceção)
//  - continuidade: a semana depois de uma caixinha (stories com mecanica 'caixinha' ou tema com "caixinha") pede a
//    resposta (mecanica 'resposta-caixinha' ou "Traduzindo o contabilês"); a caixinha é a cada 15 dias
//  - mix dos blocos com folga de 10 pontos da fatia; oferta (pilar 10) até 30% enquanto a promoção vale (até
//    31/12/2026) e 20% depois; volume contra o travado (3 reels, 5 feeds, 5 temas de stories)
//  - convite em 2 níveis: peça de Afeto ou Educação com convite de venda (R$, preço, assine, promoção; no Afeto
//    também a lista de espera) na CTA ou na primeira e na última linha da legenda (onde a CTA mora no molde) = alerta
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { blocoDoPilar, blocoCanonico, BLOCOS } from './db.mjs';
import { somarDias } from './estatistica.mjs';

export const ANGULOS_PILAR_8 = [
  'Preço fechado', 'Gente desde a entrada', 'Daqui de BH', 'Garantia', 'Sair sem custo', 'Capricho', 'Começo rápido',
  'Preço redondo', 'Simulador aberto',
];
export const MECANICAS = ['caixinha', 'resposta-caixinha'];
// os nomes da anatomia do orgânico (ESTRATEGIA-PRINCIPAL.md, seções 3 e 4)
export const PILARES_ESTRATEGIA = {
  1: 'Bastidor do fundador', 2: 'Cultural e identificável', 3: 'Nossa origem', 4: 'A dor da burocracia', 5: 'Mitos e crenças erradas',
  16: 'Dicas para quem tem empresa', 8: 'O nosso diferencial', 9: 'Bastidor do processo', 17: 'A facilidade do app', 10: 'Oferta',
  11: 'Troca de contador', 12: 'O dinheiro do dono', 13: 'Documentação em dia',
};
export const PILARES_GUARDADOS = [6, 7, 14, 15];
export const PILARES_ATIVOS = Object.keys(PILARES_ESTRATEGIA).map(Number);
export const VOLUME_PADRAO = { reels: 3, feeds: 5, storiesTemas: 5 };
export const FATIAS_PADRAO = { Afeto: 20, Educação: 30, Diferencial: 25, Conversão: 25 };
export const TETO_PADRAO = { naPromocao: 30, foraDaPromocao: 20 };
export const FIM_PROMOCAO = '2026-12-31';
export const SEMANAS_HISTORICO = 8;
export const SEMANAS_ANGULO = 4;
export const LIMIAR_PARECIDA = 0.5;
export const FOLGA_MIX = 10;
const PECAS_FEED = ['reel', 'carrossel', 'estatico'];
const ROTULO = { reel: 'reel', carrossel: 'carrossel', estatico: 'estático', stories: 'stories' };

const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const tem = (v) => Boolean(String(v ?? '').trim());
const DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const dm = (iso) => `${String(iso).slice(8, 10)}/${String(iso).slice(5, 7)}`;
const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// { inicio: segunda, fim: domingo } da semana de um dia AAAA-MM-DD (o dia da semana sai da data, sem fuso)
export function semanaDe(iso) {
  const m = DATA.exec(String(iso ?? '').trim());
  if (!m) return null;
  const t = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (t.getUTCMonth() !== Number(m[2]) - 1 || t.getUTCDate() !== Number(m[3])) return null;
  const inicio = somarDias(iso, -((t.getUTCDay() + 6) % 7));
  return { inicio, fim: somarDias(inicio, 6) };
}

// "preco fechado", "Preço Fechado" e "  preço fechado " viram "Preço fechado"; fora dos 9: null
export function anguloCanonico(v) {
  const k = semAcento(v).replace(/\s+/g, ' ').trim();
  return k ? ANGULOS_PILAR_8.find((a) => semAcento(a) === k) ?? null : null;
}

// ---------- parecença (Jaccard nas palavras) ----------

// palavras de ligação de mais de 3 letras que aparecem em quase toda frase e inflariam a parecença
const LIGACAO = new Set([
  'para', 'como', 'voce', 'voces', 'mais', 'isso', 'esse', 'essa', 'este', 'esta', 'isto', 'quando', 'pode', 'sobre', 'porque',
  'qual', 'quais', 'tudo', 'todo', 'toda', 'todos', 'todas', 'seus', 'suas', 'pelo', 'pela', 'pelos', 'pelas', 'entre', 'ainda',
  'aqui', 'onde', 'cada', 'muito', 'muita', 'nada', 'antes', 'depois', 'agora', 'dele', 'dela', 'deles', 'nosso', 'nossa', 'gente',
  'fazer', 'sendo', 'ser', 'estar', 'tem', 'tenho', 'temos',
]);
export const palavrasChave = (s) => new Set(semAcento(s).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !LIGACAO.has(w)));
export function jaccard(a, b) {
  const x = palavrasChave(a);
  const y = palavrasChave(b);
  if (x.size < 2 || y.size < 2) return 0;
  let comum = 0;
  for (const w of x) if (y.has(w)) comum++;
  return comum / (x.size + y.size - comum);
}
const parecenca = (a, b) => Math.max(0, ...a.textos.flatMap((x) => b.textos.map((y) => jaccard(x, y))));

// ---------- os itens do banco ----------

const numeroPilar = (p) => (p === '' || p == null || typeof p === 'boolean' || !Number.isInteger(Number(p)) ? null : Number(p));
const ehCaixinhaTexto = (t) => /caixinha/i.test(t) && !/respost|traduzindo/i.test(t);
const ehRespostaTexto = (t) => /traduzindo o contabil[eê]s/i.test(t);
function excecaoDe(v) {
  const e = objeto(v);
  return e.ativa === true && tem(e.motivo) ? { ativa: true, motivo: String(e.motivo).trim() } : null;
}

// o que a análise olha de cada peça e de cada dia de stories
export function itensDo(db) {
  const d = objeto(db);
  const stories = (Array.isArray(d.stories) ? d.stories : []).filter((s) => s && typeof s === 'object' && DATA.test(String(s.data ?? '')));
  const diasStories = new Set(stories.map((s) => s.data));
  const itens = [];
  for (const r of Array.isArray(d.reels) ? d.reels : []) {
    if (!r || typeof r !== 'object' || !DATA.test(String(r.data ?? ''))) continue;
    const peca = PECAS_FEED.includes(r.peca) || r.peca === 'stories' ? r.peca : 'reel';
    if (peca === 'stories' && diasStories.has(r.data)) continue;
    const pilar = numeroPilar(r.pilar);
    const textos = [r.ideia, r.roteiro?.hook, r.carrossel?.capa?.titulo, r.estatico?.headline].filter(tem).map(String);
    const caixinha = peca === 'stories' && (r.mecanica === 'caixinha' || (r.mecanica !== 'resposta-caixinha' && ehCaixinhaTexto(r.ideia)));
    const legenda = String(r.legenda ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    itens.push({
      id: r.id, tipo: peca === 'stories' ? 'stories' : 'peca', peca, data: r.data, pilar,
      bloco: blocoCanonico(r.bloco) ?? blocoDoPilar(pilar) ?? (caixinha ? 'Educação' : null),
      titulo: String(r.ideia ?? '').trim(), textos, angulo: anguloCanonico(r.angulo), mecanica: MECANICAS.includes(r.mecanica) ? r.mecanica : null,
      caixinha, resposta: r.mecanica === 'resposta-caixinha' || ehRespostaTexto(r.ideia),
      excecao: excecaoDe(r.excecaoAntiRepeticao), pecaDoDia: null,
      ctas: [
        ['CTA do roteiro', r.roteiro?.cta], ['Slide final', [r.carrossel?.final?.titulo, r.carrossel?.final?.texto].filter(tem).join(' ')],
        ['CTA da arte', r.estatico?.cta], ['Primeira linha da legenda', legenda[0]], ['Última linha da legenda', legenda.length > 1 ? legenda.at(-1) : ''],
      ].filter(([, t]) => tem(t)),
    });
  }
  for (const s of stories) {
    const pilar = numeroPilar(s.pilar);
    const caixinha = s.mecanica === 'caixinha' || (s.mecanica !== 'resposta-caixinha' && ehCaixinhaTexto(s.tema));
    itens.push({
      id: s.id, tipo: 'stories', peca: 'stories', data: s.data, pilar,
      bloco: blocoCanonico(s.bloco) ?? blocoDoPilar(pilar) ?? (caixinha ? 'Educação' : null),
      titulo: String(s.tema ?? '').trim(), textos: [s.tema, s.quadros?.[0]?.texto].filter(tem).map(String),
      angulo: anguloCanonico(s.angulo), mecanica: MECANICAS.includes(s.mecanica) ? s.mecanica : null,
      caixinha, resposta: s.mecanica === 'resposta-caixinha' || ehRespostaTexto(s.tema),
      excecao: excecaoDe(s.excecaoAntiRepeticao), pecaDoDia: s.pecaDoDia ?? null, ctas: [],
    });
  }
  return itens;
}

const rotuloItem = (i) => `${i.tipo === 'stories' ? 'os stories' : `o ${ROTULO[i.peca] ?? 'post'}`} de ${dm(i.data)}`;
const curto = (s, n = 90) => (String(s).length > n ? `${String(s).slice(0, n - 1).trimEnd()}...` : String(s));
const referencia = (i) => ({ id: i.id, data: i.data, titulo: i.titulo, tipo: i.tipo, peca: i.peca });

// convite de venda: R$, preço, assine, promoção (no Afeto, também a lista de espera)
const VENDA = /R\$\s?\d|\bpre[çc]os?\b|\bassin(e|ar|atura|ando|am)\b|\bpromo[çc](ão|ao|ões|oes)\b|\bpromocional\b/i;
const VENDA_AFETO = /lista de espera/i;

// as 12 peças da 1ª campanha do Ateliê (só leitura; sem a pasta, lista vazia)
const PASTA_CAMPANHA = path.resolve(import.meta.dirname, '..', '..', 'identidade', 'brandmkt', '05-motor-atelie', 'pecas');
let campanhaCache = null;
export async function pecasDaCampanha(pasta = PASTA_CAMPANHA) {
  if (campanhaCache && pasta === PASTA_CAMPANHA) return campanhaCache;
  const out = [];
  try {
    for (const nome of (await readdir(pasta)).filter((n) => /^mote-.*\.json$/i.test(n)).sort()) {
      try {
        const j = JSON.parse(await readFile(path.join(pasta, nome), 'utf8'));
        const pilar = numeroPilar(j.pilar);
        if (pilar == null) continue;
        out.push({ id: String(j.id ?? nome), pilar, titulo: String(j.copy?.headline ?? j.titulo ?? '').trim(), angulo: anguloCanonico(j.angulo) });
      } catch { /* peça ilegível fica de fora */ }
    }
  } catch { /* sem a pasta neste servidor */ }
  if (pasta === PASTA_CAMPANHA) campanhaCache = out;
  return out;
}

// o stories ligado à peça do dia (pecaDoDia), nos dois sentidos
const ligados = (a, b) => (a.tipo === 'stories' && a.pecaDoDia != null && a.pecaDoDia === b.id) || (b.tipo === 'stories' && b.pecaDoDia != null && b.pecaDoDia === a.id);

// caixinha e resposta de uma semana (inicio: a segunda)
function marcosDaSemana(itens, inicio) {
  const fim = somarDias(inicio, 6);
  const daSemana = itens.filter((i) => i.data >= inicio && i.data <= fim);
  return {
    caixinhas: daSemana.filter((i) => i.caixinha).sort((a, b) => a.data.localeCompare(b.data)),
    respostas: daSemana.filter((i) => i.resposta).sort((a, b) => a.data.localeCompare(b.data)),
  };
}

// ---------- a análise ----------

// db: o banco (reels, stories, config); inicio: qualquer dia da semana. opcoes.campanha: as peças da 1ª campanha
// (pecasDaCampanha). Devolve { semana, volume, mix, oferta, continuidade, pecas, alertas, itens }
export function analisarSemana(db, inicio, opcoes = {}) {
  const sem = semanaDe(inicio);
  if (!sem) throw Object.assign(new Error('A semana precisa ser uma data AAAA-MM-DD.'), { status: 400 });
  const cfg = objeto(objeto(db).config);
  const alvo = { ...VOLUME_PADRAO, ...Object.fromEntries(Object.entries(objeto(cfg.volumeSemanal)).filter(([k, v]) => k in VOLUME_PADRAO && Number.isInteger(v) && v >= 0)) };
  const fatias = { ...FATIAS_PADRAO, ...Object.fromEntries(Object.entries(objeto(cfg.mixBlocos)).filter(([k, v]) => BLOCOS.includes(k) && Number.isFinite(v))) };
  const tetos = { ...TETO_PADRAO, ...Object.fromEntries(Object.entries(objeto(cfg.tetoVenda)).filter(([k, v]) => k in TETO_PADRAO && Number.isFinite(v))) };

  const todos = itensDo(db);
  const naSemana = todos.filter((i) => i.data >= sem.inicio && i.data <= sem.fim).sort((a, b) => a.data.localeCompare(b.data) || a.tipo.localeCompare(b.tipo));
  const histIni = somarDias(sem.inicio, -7 * SEMANAS_HISTORICO);
  const anguloIni = somarDias(sem.inicio, -7 * SEMANAS_ANGULO);
  const anteriores = todos.filter((i) => i.data >= histIni && i.data < sem.inicio);
  const campanha = Array.isArray(opcoes?.campanha) ? opcoes.campanha.filter((c) => c && Number.isInteger(c.pilar)) : [];

  // o mesmo pilar na semana: o stories ligado à peça do dia com o mesmo pilar não conta de novo
  const porPilar = new Map();
  for (const i of naSemana) {
    if (i.pilar == null) continue;
    const ligado = i.tipo === 'stories' && i.pecaDoDia && naSemana.some((p) => p.id === i.pecaDoDia && p.pilar === i.pilar);
    if (ligado) continue;
    porPilar.set(i.pilar, [...(porPilar.get(i.pilar) ?? []), i]);
  }

  const pecas = {};
  for (const i of naSemana) {
    const rep = [];
    // 21/10 (Pedro): o stories e a peça do dia a que ele está ligado conversam de propósito: um não é repetição do outro
    const outros = [...anteriores, ...naSemana.filter((o) => o.id !== i.id && !ligados(i, o))];
    // 1. mesmo pilar e texto parecido
    if (i.pilar != null) {
      const parecidas = outros.filter((o) => o.pilar === i.pilar).map((o) => ({ o, p: parecenca(i, o) })).filter((x) => x.p >= LIMIAR_PARECIDA)
        .sort((a, b) => b.p - a.p).slice(0, 2);
      for (const { o, p } of parecidas) {
        rep.push({
          regra: 'repeticao', nivel: 'alerta', parecidaCom: referencia(o),
          texto: `Parecida com ${rotuloItem(o)} (mesmo pilar ${i.pilar}, ${Math.round(p * 100)}% das palavras): "${curto(o.titulo)}". Mude o ângulo ou registre a repetição de propósito.`,
        });
      }
    }
    // 2. pilar 8: o ângulo gira
    let infoAngulo = null;
    if (i.pilar === 8) {
      if (!i.angulo) infoAngulo = { regra: 'angulo', nivel: 'info', texto: 'Pilar 8 sem o ângulo marcado: a anti-repetição do ângulo não confere esta peça (são 9 ângulos que giram).' };
      else {
        const mesmo = outros.filter((o) => o.pilar === 8 && o.angulo === i.angulo && o.data >= anguloIni && o.data <= sem.fim).sort((a, b) => b.data.localeCompare(a.data))[0];
        if (mesmo) rep.push({ regra: 'angulo', nivel: 'alerta', parecidaCom: referencia(mesmo), texto: `O ângulo "${i.angulo}" do pilar 8 já saiu em ${rotuloItem(mesmo)} (últimas ${SEMANAS_ANGULO} semanas): gire pra outro dos 9.` });
      }
    }
    // 3. o mesmo pilar 2+ vezes na semana
    const grupo = i.pilar != null ? porPilar.get(i.pilar) ?? [] : [];
    if (grupo.length >= 2 && grupo.some((g) => g.id === i.id)) {
      const outro = grupo.find((g) => g.id !== i.id);
      rep.push({
        regra: 'pilar-semana', nivel: 'alerta', parecidaCom: outro ? referencia(outro) : undefined,
        texto: `O pilar ${i.pilar} aparece ${grupo.length} vezes nesta semana (${grupo.map((g) => dm(g.data)).join(', ')}).`,
      });
    }
    // 4. a 1ª campanha (Ateliê)
    const daCampanha = i.pilar != null ? campanha.filter((c) => c.pilar === i.pilar) : [];
    if (daCampanha.length) {
      rep.push({
        regra: 'campanha', nivel: 'alerta',
        texto: `Repete o pilar ${i.pilar}, que já tem ${daCampanha.length} ${daCampanha.length === 1 ? 'peça' : 'peças'} na 1ª campanha (Ateliê). Prefira outro pilar ou registre a repetição de propósito.`,
      });
    }
    const lista = [];
    if (i.excecao) {
      lista.push({ regra: 'excecao', nivel: 'info', texto: `Repetição de propósito: ${i.excecao.motivo}`, ...(rep[0]?.parecidaCom ? { parecidaCom: rep[0].parecidaCom } : {}), repete: rep.map((r) => r.texto) });
    } else lista.push(...rep);
    if (infoAngulo) lista.push(infoAngulo);
    // pilar guardado não entra (não é repetição: a exceção não muda)
    if (i.pilar != null && PILARES_GUARDADOS.includes(i.pilar)) {
      lista.push({ regra: 'pilar-guardado', nivel: 'alerta', texto: `O pilar ${i.pilar} está guardado pra outra fase (guardados: ${PILARES_GUARDADOS.join(', ')}).` });
    }
    // convite em 2 níveis: atração sem convite de venda
    if (i.tipo === 'peca' && (i.bloco === 'Afeto' || i.bloco === 'Educação')) {
      for (const [onde, t] of i.ctas) {
        const m = VENDA.exec(t) ?? (i.bloco === 'Afeto' ? VENDA_AFETO.exec(t) : null);
        if (m) {
          lista.push({ regra: 'convite', nivel: 'alerta', texto: `Post de atração não leva convite de venda: "${curto(t, 80)}" (${onde}). A CTA de ${i.bloco} é de engajamento (salvar, mandar, comentar).` });
          break;
        }
      }
    }
    if (!lista.some((x) => x.nivel === 'alerta' || x.regra === 'excecao')) lista.unshift({ regra: 'repeticao', nivel: 'ok', texto: `Sem repetição nas ${SEMANAS_HISTORICO} semanas anteriores nem nesta semana.` });
    pecas[i.id] = lista;
  }

  // volume
  const volume = {
    reels: naSemana.filter((i) => i.peca === 'reel').length,
    feeds: naSemana.filter((i) => i.peca === 'carrossel' || i.peca === 'estatico').length,
    storiesTemas: new Set(naSemana.filter((i) => i.tipo === 'stories').map((i) => i.data)).size,
    alvo,
  };

  // mix dos blocos (os itens com bloco) e oferta (pilar 10, sobre todos os itens)
  const comBloco = naSemana.filter((i) => i.bloco);
  const mix = Object.fromEntries(BLOCOS.map((b) => {
    const n = comBloco.filter((i) => i.bloco === b).length;
    const pct = comBloco.length ? Math.round((n * 100) / comBloco.length) : 0;
    return [b, { n, pct, fatia: fatias[b], ok: !comBloco.length || Math.abs(pct - fatias[b]) <= FOLGA_MIX }];
  }));
  const naPromocao = sem.inicio <= FIM_PROMOCAO;
  const nOferta = naSemana.filter((i) => i.pilar === 10).length;
  const pctOferta = naSemana.length ? Math.round((nOferta * 100) / naSemana.length) : 0;
  const teto = naPromocao ? tetos.naPromocao : tetos.foraDaPromocao;
  const oferta = { n: nOferta, pct: pctOferta, teto, ok: pctOferta <= teto, naPromocao };

  // continuidade: caixinha quinzenal e a resposta na semana seguinte
  const continuidade = [];
  const aqui = marcosDaSemana(todos, sem.inicio);
  const passada = marcosDaSemana(todos, somarDias(sem.inicio, -7));
  const retrasada = marcosDaSemana(todos, somarDias(sem.inicio, -14));
  if (passada.caixinhas.length) {
    const c = passada.caixinhas[0];
    const r = aqui.respostas[0];
    continuidade.push({
      tipo: 'resposta-caixinha', ok: Boolean(r), ...(r ? { pecaId: r.id } : {}),
      texto: r
        ? `A caixinha de ${dm(c.data)} tem a resposta nesta semana: ${rotuloItem(r)}, "${curto(r.titulo)}".`
        : `A caixinha de ${dm(c.data)} (semana passada) pede a resposta nesta semana: o "Traduzindo o contabilês" com 3 a 5 dúvidas da caixinha, sempre anônimas (caixinha numa semana, resposta na seguinte).`,
    });
  }
  if (retrasada.caixinhas.length && !passada.caixinhas.length) {
    const c = aqui.caixinhas[0];
    continuidade.push({
      tipo: 'caixinha-quinzenal', ok: Boolean(c),
      texto: c
        ? `Caixinha da quinzena nesta semana (${dm(c.data)}): a resposta sai na semana de ${dm(somarDias(sem.inicio, 7))}.`
        : `A caixinha é a cada 15 dias e a última foi em ${dm(retrasada.caixinhas[0].data)}: esta semana pede uma nova ("qual dúvida você tem vergonha de perguntar pro contador?", com o aviso de que vira conteúdo anônimo).`,
    });
  } else if (aqui.caixinhas.length) {
    continuidade.push({ tipo: 'caixinha', ok: true, texto: `Caixinha em ${dm(aqui.caixinhas[0].data)}: a resposta sai na semana de ${dm(somarDias(sem.inicio, 7))}.` });
  }

  // o resumo da semana
  const alertas = [];
  const NOMES = { reels: ['reel', 'reels'], feeds: ['feed', 'feeds'], storiesTemas: ['tema de stories', 'temas de stories'] };
  for (const k of Object.keys(NOMES)) {
    const n = volume[k];
    const a = alvo[k];
    if (n < a) alertas.push(`Faltam ${a - n} ${NOMES[k][a - n === 1 ? 0 : 1]}: ${n} de ${a}.`);
    else if (n > a) alertas.push(`Passou do volume travado: ${n} ${NOMES[k][1]} (são ${a}).`);
  }
  for (const b of BLOCOS) if (!mix[b].ok) alertas.push(`${b}: ${mix[b].pct}% da semana (a fatia é ${mix[b].fatia}%, com folga de ${FOLGA_MIX} pontos).`);
  if (!oferta.ok) alertas.push(`Oferta (pilar 10) em ${oferta.pct}% da semana: o teto é ${oferta.teto}%${naPromocao ? ' enquanto a promoção vale (até 31/12/2026)' : ''}.`);
  for (const c of continuidade) if (!c.ok) alertas.push(c.texto);
  for (const i of naSemana) {
    for (const x of pecas[i.id].filter((y) => y.nivel === 'alerta')) alertas.push(`${dm(i.data)}, ${ROTULO[i.peca] ?? 'post'} "${curto(i.titulo, 60)}": ${x.texto}`);
  }

  return {
    semana: { inicio: sem.inicio, fim: sem.fim },
    volume, mix, oferta, continuidade, pecas, alertas,
    itens: naSemana.map((i) => ({ id: i.id, tipo: i.tipo, peca: i.peca, data: i.data, pilar: i.pilar, bloco: i.bloco, titulo: i.titulo, angulo: i.angulo, mecanica: i.mecanica })),
    referencias: { semanasAnteriores: SEMANAS_HISTORICO, pecasAnteriores: anteriores.length, campanha: campanha.length },
  };
}

// ---------- o que a IA do gerador lê ----------

// as peças das 8 semanas anteriores (e da própria semana), uma por linha, pra IA não repetir
export function historicoParaIa(db, inicio) {
  const sem = semanaDe(inicio);
  if (!sem) return '';
  const histIni = somarDias(sem.inicio, -7 * SEMANAS_HISTORICO);
  return itensDo(db).filter((i) => i.data >= histIni && i.data <= sem.fim).sort((a, b) => a.data.localeCompare(b.data))
    .map((i) => `- ${i.data} · ${ROTULO[i.peca]} · pilar ${i.pilar ?? 'sem número'}${i.angulo ? ` · ângulo ${i.angulo}` : ''}${i.mecanica ? ` · ${i.mecanica}` : ''} · ${curto(i.titulo, 140)}${i.textos[1] && i.textos[1] !== i.titulo ? ` · gancho: ${curto(i.textos[1], 100)}` : ''}`)
    .join('\n');
}

// a análise em texto, pro prompt
export function analiseParaIa(a) {
  if (!a) return '';
  const linhas = [
    `Semana de ${dm(a.semana.inicio)} a ${dm(a.semana.fim)}.`,
    `Volume: ${a.volume.reels} de ${a.volume.alvo.reels} reels, ${a.volume.feeds} de ${a.volume.alvo.feeds} feeds, ${a.volume.storiesTemas} de ${a.volume.alvo.storiesTemas} temas de stories.`,
    `Mix: ${BLOCOS.map((b) => `${b} ${a.mix[b].n} (${a.mix[b].pct}%, fatia ${a.mix[b].fatia}%)`).join(' · ')}.`,
    `Oferta (pilar 10): ${a.oferta.n} (${a.oferta.pct}%, teto ${a.oferta.teto}%).`,
    ...a.continuidade.map((c) => `Continuidade (${c.ok ? 'ok' : 'falta'}): ${c.texto}`),
  ];
  return linhas.join('\n');
}
