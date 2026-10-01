// Resumo semanal de Métricas (SPEC-METRICAS.md §3.8): um arquivo por semana ISO em data/relatorios/<AAAA-Www>.json.
// O cálculo e o texto moram em relatorio-motor.mjs (puro); aqui só carrega, chama e grava. Decisões:
//  - uma fonte só pra cada coisa: o contexto do diagnóstico (posts com objetivo e porquê, insights, hipóteses),
//    o publico.json (seguidores do começo e do fim da semana, alcance de quem não segue) e as frases de quem
//    segue do resumo da aba Público, os stories da semana (resumoStories com início e fim) e as peças de feed da
//    semana seguinte no cronograma, com a meta e as recomendações de cada uma (recomendacoesPara)
//  - gerar de novo sobrescreve; a leitura com IA de antes só fica se os fatos não mudaram (ela cita os ids)
//  - semana que ainda não começou não gera (400); a semana corrente gera, parcial
//  - (30/09) o resumo grava de quando é a leitura dos nossos posts que usou (lidoEm: propriosEm, que só a leitura
//    dos nossos posts grava; sincronizadoEm em banco antigo). situacao(semana) diz à agenda se o gravado é parcial,
//    desatualizado (leitura de antes do fim da semana) ou provisório (peça de menos de 7 dias), pra gerar de novo
//  - (30/09, C4) arquivo de dados ilegível (503 do lerJsonEstrito: preso ou com o JSON quebrado) derruba a geração
//    em vez de virar "sem dado": o resumo ficaria gravado como definitivo sem um número que existe. E o resumo
//    gravado é lido sem engolir erro antes de gravar por cima (arquivo preso perderia a leitura com IA dele); só o
//    JSON quebrado, que já ganhou uma cópia ao lado, é refeito por cima
//  - leitura com IA (botão): Agent SDK com a conta logada e sem ferramenta nenhuma (tools: []), só os fatos
//    dentro de dados_de_referencia, saída estruturada de 3 a 6 frases com os ids citados. O motor confere cada
//    frase (id que existe, número que está no fato citado) e contemSegredo roda antes de gravar. Uma leitura
//    por vez; falha não apaga a leitura boa de antes. Nada do prompt nem da resposta vai pro log
//  - escrita pela fila (molde monitoramento.mjs), e a leitura e a geração leem e gravam dentro dela: as duas
//    mexem no mesmo arquivo
import { query } from '@anthropic-ai/claude-agent-sdk';
import { mkdir, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { carregar, lerJson, lerJsonEstrito, gravarJson, arquivoDados, falha, agora, semTracos, ROTULO_TIPO, ROTULO_PECA } from './db.mjs';
import { LEITURAS_PROIBIDAS, contemSegredo, blocoDados, AVISO_DADOS } from './guarda.mjs';
import { loginClaude } from './analise.mjs';
import { MSG_LOGIN, ehErroLogin, limpar as limparIa } from './ideias-ia.mjs';
import * as diagnostico from './diagnostico.mjs';
import * as publico from './publico.mjs';
import * as stories from './stories-metricas.mjs';
import { diaBrasilia, intervaloSemana, somarSemanas, dataCurta } from './estatistica.mjs';
import { VERSAO, montarRelatorio, conferirFrases, semanaValida, semanaAnteriorDe, situacaoRelatorio } from './relatorio-motor.mjs';

const PASTA = 'relatorios';
const TIMEOUT_IA = 3 * 60 * 1000;
const FEED = ['reel', 'carrossel', 'estatico'];
const arquivo = (semana) => path.join(PASTA, `${semana}.json`);
const hojeBrasilia = () => diaBrasilia(Date.now());

// ---------- arquivo ----------

let fila = Promise.resolve();
function naFila(fn) {
  const proxima = fila.then(fn);
  fila = proxima.catch(() => {}); // quem chamou trata o erro; a fila segue
  return proxima;
}

async function gravar(semana, rel) {
  await mkdir(arquivoDados(PASTA), { recursive: true });
  await gravarJson(arquivo(semana), rel);
}

function conferirSemana(semana) {
  if (!semanaValida(semana)) throw falha(400, 'Semana precisa ser AAAA-Www, como 2026-W40.');
  return semana;
}

const doFormato = (r, semana) => (r && r.versao === VERSAO && r.semana === semana ? r : null);

async function lerArquivo(semana) {
  return doFormato(await lerJson(arquivo(semana), null), semana);
}

// o gravado antes de gravar por cima: arquivo preso lança (nada é gravado e a leitura com IA dele não se perde);
// JSON quebrado já tem a cópia ao lado (lerJsonEstrito) e o resumo, que se refaz, vai por cima
async function lerArquivoParaRegravar(semana) {
  try {
    return doFormato(await lerJsonEstrito(arquivo(semana), null), semana);
  } catch (e) {
    if (/JSON quebrado/.test(String(e?.message ?? ''))) return null;
    throw e;
  }
}

const mesmosFatos = (a, b) => JSON.stringify((a ?? []).map((f) => [f.id, f.texto])) === JSON.stringify((b ?? []).map((f) => [f.id, f.texto]));

// 'AAAA-Www' da semana anterior à do dia (Brasília)
export function semanaAnterior(dia = hojeBrasilia()) {
  return semanaAnteriorDe(dia);
}

// semanas com arquivo, a mais nova primeiro
export async function listar() {
  let nomes = [];
  try {
    nomes = await readdir(arquivoDados(PASTA));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  return nomes
    .map((n) => /^(\d{4}-W\d{2})\.json$/.exec(n)?.[1])
    .filter((s) => s && semanaValida(s))
    .sort()
    .reverse();
}

// null quando a semana não tem arquivo
export async function ler(semana) {
  return lerArquivo(conferirSemana(semana));
}

// o resumo gravado da semana: 'falta', 'parcial', 'desatualizado', 'provisorio' ou 'fechado' (situacaoRelatorio
// do motor). A agenda gera de novo o que não está fechado
export async function situacao(semana) {
  return situacaoRelatorio(await ler(semana), semana);
}

// ---------- geração ----------

async function tentar(oque, fn) {
  try {
    return await fn();
  } catch (e) {
    // arquivo de dados ilegível (C4): melhor falhar e a agenda tentar de novo do que gravar "sem dado" no lugar
    if (e?.status === 503) throw e;
    console.error(`Resumo semanal: ${oque} ficou de fora (${e.message}).`);
    return null;
  }
}

const listaHipoteses = (h) => (Array.isArray(h) ? h : Array.isArray(h?.hipoteses) ? h.hipoteses : []);

// as frases do cartão "Seguidores" da aba Público (já com a célula pequena escondida pelo publico.mjs)
function frasesDeQuemSegue(resumo) {
  const cartao = (Array.isArray(resumo?.quem) ? resumo.quem : []).find((q) => q?.id === 'seguidores' && q.disponivel !== false);
  return (Array.isArray(cartao?.frases) ? cartao.frases : []).filter((f) => typeof f === 'string').slice(0, 2);
}

const pecaDoFeed = (r) => [r.peca ?? 'reel', r.peca2].find((p) => FEED.includes(p)) ?? null;
const pilarNome = (db, r) => (db.pilares ?? []).find((p) => p.id === Number(r.pilar))?.nome ?? (r.pilarTexto || null);

// meta e recomendações da peça como o bloco da peça mostra (recomendacoes do diagnóstico, que usa o contexto
// em cache no formato do motor); a função pura com o contexto daqui só na falta dela
async function recomendacoesDa(r, ctx) {
  try {
    if (typeof diagnostico.recomendacoes === 'function') return (await diagnostico.recomendacoes(r.id)) ?? null;
    if (typeof diagnostico.recomendacoesPara === 'function') return (await diagnostico.recomendacoesPara(r, ctx)) ?? null;
  } catch (e) {
    console.error(`Resumo semanal: sem recomendações pra ${r.id} (${e.message}).`);
  }
  return null;
}

async function pecasDaSemana(db, ctx, semana) {
  const { inicio, fim } = intervaloSemana(semana);
  const pecas = (db.reels ?? [])
    .filter((r) => typeof r.data === 'string' && r.data >= inicio && r.data <= fim && pecaDoFeed(r))
    .sort((a, b) => a.data.localeCompare(b.data));
  const saida = [];
  for (const r of pecas) {
    saida.push({
      reelId: r.id, dia: r.data, titulo: r.ideia || r.tema || 'Sem título', tipo: r.tipo ?? null, peca: pecaDoFeed(r),
      pilarNome: pilarNome(db, r), rec: await recomendacoesDa(r, ctx),
    });
  }
  return saida;
}

// grava relatorios/<semana>.json e devolve o Relatorio
export async function gerar(semana, { autor = 'agenda' } = {}) {
  conferirSemana(semana);
  const { inicio, fim } = intervaloSemana(semana);
  if (inicio > hojeBrasilia()) throw falha(400, 'Essa semana ainda não começou.');
  const ctx = await diagnostico.carregarContexto();
  const db = ctx?.db ?? (await carregar());
  // a última leitura dos NOSSOS posts (a das inspirações não conta); sincronizadoEm em banco de antes do propriosEm
  const lidoEm = db.instagram?.propriosEm ?? db.instagram?.sincronizadoEm ?? null;
  const [arqPublico, resumoPublico, storiesSemana, proximas] = await Promise.all([
    ctx?.publico ?? tentar('o arquivo do público', () => publico.ler()),
    tentar('o resumo do público', () => publico.resumo()),
    tentar('os stories da semana', () => stories.resumoStories({ inicio, fim })),
    pecasDaSemana(db, ctx, somarSemanas(semana, 1)),
  ]);
  const rel = montarRelatorio({
    semana,
    posts: ctx?.posts,
    insights: ctx?.insights,
    hipoteses: listaHipoteses(ctx?.hipoteses),
    titulosPeca: Object.fromEntries((db.reels ?? []).map((r) => [r.id, r.ideia || r.tema || ''])),
    publico: { diario: arqPublico?.diario, frases: frasesDeQuemSegue(resumoPublico) },
    stories: storiesSemana,
    proximas,
    geradoEm: agora(),
    geradoPor: autor ?? null,
    hoje: hojeBrasilia(),
    lidoEm,
  }, { rotulosTipo: ROTULO_TIPO, rotulosPeca: ROTULO_PECA, limpar: semTracos });
  return naFila(async () => {
    const antes = await lerArquivoParaRegravar(semana);
    if (antes?.leituraIa && mesmosFatos(antes.fatos, rel.fatos)) rel.leituraIa = antes.leituraIa;
    await gravar(semana, rel);
    return rel;
  });
}

// ---------- leitura com IA ----------

const SISTEMA_LEITURA = `Você escreve a leitura da semana das métricas do Instagram do Legalizaí (contabilidade digital para MEI e ME, de Belo Horizonte), para o time de marketing.
Use SÓ os fatos numerados que estão em <dados_de_referencia> (F1, F2...). Nada de conhecimento de fora e nada de suposição sobre o que não está lá.
Regras:
- De 3 a 6 frases curtas, em português do Brasil, tom direto, sem hype e sem adjetivo vazio.
- Cada frase lista em "fatos" os ids dos fatos que ela usa. Não escreva os ids dentro do texto.
- Número só se estiver escrito no texto de um fato que a frase cita, com algarismos e do mesmo jeito que está lá. Nada de somar, subtrair, arredondar, calcular porcentagem nova nem escrever número por extenso. Frase com número que não está nos fatos citados é descartada.
- Título de peça só entre aspas e escrito igual ao do fato. Data e hora só do jeito que estão no fato (28/09, 14h). Número que só aparece dentro de uma data ou de um título não vale como número.
- Nunca afirme causa: use "tende a", "sinal", "nas N peças". Uma peça só é sinal, não prova.
- Comece pelo que mais importa: metas de 2× batidas ou não, a melhor e a pior peça e o porquê delas. Depois, o que os mecanismos e as hipóteses sugerem pra próxima semana.
- Zero travessão.
${AVISO_DADOS}
Responda só pela saída estruturada.`;

function esquemaLeitura(ids) {
  return {
    type: 'object',
    properties: {
      frases: {
        type: 'array',
        minItems: 3,
        maxItems: 6,
        items: {
          type: 'object',
          properties: {
            texto: { type: 'string', description: 'Uma frase curta, sem os ids dos fatos' },
            fatos: { type: 'array', minItems: 1, maxItems: 6, items: { type: 'string', enum: ids } },
          },
          required: ['texto', 'fatos'],
          additionalProperties: false,
        },
      },
    },
    required: ['frases'],
    additionalProperties: false,
  };
}

const semLogin = () => Object.assign(falha(503, MSG_LOGIN), { semLogin: true });

async function escreverLeitura(rel, autor) {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TIMEOUT_IA);
  const dados = { semana: rel.semana, periodo: `${dataCurta(rel.inicio)} a ${dataCurta(rel.fim)}`, fatos: rel.fatos };
  let resultado = null;
  try {
    const q = query({
      prompt: `${blocoDados(dados)}\n\nEscreva a leitura desta semana pela saída estruturada.`,
      options: {
        cwd: os.tmpdir(),
        model: process.env.METRICAS_MODEL || process.env.CRONOGRAMA_MODEL || undefined,
        systemPrompt: SISTEMA_LEITURA,
        settingSources: [],
        tools: [], // sem arquivo nenhum: os fatos já vão no prompt
        allowedTools: [],
        disallowedTools: LEITURAS_PROIBIDAS,
        permissionMode: 'dontAsk',
        outputFormat: { type: 'json_schema', schema: esquemaLeitura(rel.fatos.map((f) => f.id)) },
        persistSession: false,
        maxTurns: 4,
        abortController: controle,
      },
    });
    for await (const m of q) if (m.type === 'result') resultado = m;
  } catch (e) {
    if (controle.signal.aborted) throw falha(504, 'A IA passou de 3 minutos e a leitura foi cancelada. Tente de novo.');
    if (ehErroLogin(e.message)) throw semLogin();
    throw falha(502, 'A IA não respondeu. Tente de novo.');
  } finally {
    clearTimeout(relogio);
  }
  if (resultado?.is_error && ehErroLogin(resultado.result)) throw semLogin();
  const o = resultado?.structured_output;
  if (!resultado || resultado.subtype !== 'success' || resultado.is_error || !o || typeof o !== 'object') {
    throw falha(502, `A IA não conseguiu escrever a leitura (${resultado?.subtype ?? 'sem resposta'}). Tente de novo.`);
  }
  if (await contemSegredo(JSON.stringify(o))) throw falha(502, 'A IA devolveu um texto com cara de credencial. Nada foi gravado.');
  // travessão fora e "Legalizaí" com acento antes de conferir; semTracos primeiro: faixa entre números vira
  // hífen ("25-34"), e não vírgula, e o número continua o mesmo
  const brutas = (Array.isArray(o.frases) ? o.frases : []).map((f) => ({ texto: limparIa(semTracos(f?.texto)), fatos: f?.fatos }));
  const { frases, descartadas } = conferirFrases(brutas, rel.fatos);
  if (!frases.length) throw falha(422, 'Nenhuma frase da IA passou na conferência com os fatos. Tente de novo.');
  return { em: agora(), autor: autor ?? null, status: 'ok', frases, descartadas, custo: resultado.total_cost_usd ?? null };
}

let job = null; // { semana, etapa: 'escrevendo'|'pronto'|'erro', inicio, fim, erro, semLogin }
const jobPublico = (j) => ({ semana: j.semana, etapa: j.etapa, inicio: j.inicio, fim: j.fim ?? null, erro: j.erro ?? null, semLogin: Boolean(j.semLogin) });

async function executarLeitura(j, rel, autor) {
  try {
    const leitura = await escreverLeitura(rel, autor);
    // grava só se o resumo ainda é o mesmo que a IA leu (gerar de novo no meio troca os fatos)
    const gravou = await naFila(async () => {
      const atual = await lerArquivo(j.semana);
      if (!atual || !mesmosFatos(atual.fatos, rel.fatos)) return false;
      atual.leituraIa = leitura;
      await gravar(j.semana, atual);
      return true;
    });
    if (!gravou) throw falha(409, 'O resumo mudou enquanto a IA escrevia. Peça a leitura de novo.');
    j.etapa = 'pronto';
  } catch (e) {
    if (!e.status) console.error('Leitura da semana com IA: falhou de um jeito inesperado.');
    j.etapa = 'erro';
    j.erro = e.status ? e.message : 'A leitura com IA falhou. Tente de novo.';
    j.semLogin = Boolean(e.semLogin);
  } finally {
    j.fim = agora();
  }
}

// começa a leitura (202); a mesma semana rodando devolve o andamento. Sem login do Claude: o aviso, sem rodar
export async function iniciarLeituraIa(semana, autor = null) {
  conferirSemana(semana);
  if (job && !job.fim) {
    if (job.semana === semana) return jobPublico(job);
    throw falha(409, 'A IA já está escrevendo a leitura de outra semana. Espere terminar.');
  }
  const anterior = job;
  const meu = { semana, etapa: 'escrevendo', inicio: agora(), fim: null, erro: null, semLogin: false };
  job = meu; // reservado antes de qualquer await: dois cliques juntos não abrem duas leituras
  try {
    const rel = await lerArquivo(semana);
    if (!rel) throw falha(404, 'Essa semana ainda não tem resumo. Gere o resumo antes.');
    if (!Array.isArray(rel.fatos) || !rel.fatos.length) throw falha(409, 'O resumo desta semana não tem fatos pra IA ler.');
    if (!loginClaude()) throw semLogin();
    executarLeitura(meu, rel, autor); // segue sozinha; o GET acompanha
    return jobPublico(meu);
  } catch (e) {
    if (e.semLogin) {
      Object.assign(meu, { etapa: 'erro', erro: e.message, semLogin: true, fim: agora() });
      return jobPublico(meu);
    }
    job = anterior;
    throw e;
  }
}

// andamento da leitura daquela semana (só na memória do servidor), ou null
export function estadoLeituraIa(semana) {
  return job && job.semana === semana ? jobPublico(job) : null;
}
