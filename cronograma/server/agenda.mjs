// Agenda de Métricas (SPEC-METRICAS.md §3.9): mantém os números em dia sem ninguém clicar. Roda dentro do
// processo do servidor, então só trabalha com este computador e o servidor ligados; o que passou da hora roda
// no primeiro giro depois. Decisões:
//  - laço de setTimeout encadeado com unref(): o próximo giro só é marcado quando o anterior termina (nunca dois
//    ao mesmo tempo) e o relógio não segura o processo aberto. Primeiro giro 2 min depois do boot, depois a
//    cada 30 min
//  - quando cada tarefa é devida sai de uma função pura (tarefasDevidas), testada sem relógio nem disco:
//    sincronizar a cada 3h (conta a última tentativa da agenda, com sucesso ou falha, e também o "Sincronizar
//    agora" de alguém); hipóteses depois de cada sincronização; stories a cada 1h; público a cada 20h ou quando
//    vira o dia em Brasília; anúncios a cada 12h com a conta escolhida; o semanal a partir de segunda 7h
//    (Brasília), pela situação dos resumos gravados (semanalPendente, abaixo; computador desligado na segunda gera
//    na terça)
//  - "a última sincronização" é a última leitura dos NOSSOS posts (propriosEm; sincronizadoEm em banco antigo):
//    sincronizar só as inspirações não adia a leitura dos nossos posts nem dispara as hipóteses (30/09)
//  - (30/09) o semanal da semana que acabou espera uma leitura dos nossos posts feita depois do fim dela (segunda
//    0h): gerado com o cache velho, ficaria sem os posts do fim da semana. Sem leitura (Instagram caído), sai na
//    terça 7h com o aviso da data da leitura e é gerado de novo quando a leitura chegar. O da semana retrasada é
//    gerado de novo quando saiu com peça de menos de 7 dias (na segunda, todas já fizeram 7 dias) ou parcial;
//    gerado de novo, fica fechado (situacaoRelatorio do motor) e não volta a cada giro
//  - stories e público também pedem o Instagram conectado: sem ele, cada giro só anotaria o mesmo erro
//  - anúncios também pedem o token dos anúncios valendo: recusado ou vencido, a tarefa só anotaria "Falta o token"
//    a cada 12h e empurraria os outros erros pra fora da lista
//  - público cortado (limite da Meta, rede fora, tempo esgotado) ou sem nada lido é falha, não sucesso, e tenta de
//    novo em 1h: com sucesso anotado, o dia só voltava a ser lido na virada do dia
//  - semanal que falhou espera 3h pra tentar de novo (não vira um erro a cada giro)
//  - antes de cada tarefa a decisão é refeita: a sincronização que acabou de rodar libera as hipóteses, e uma
//    tarefa rodada à mão no meio do giro não roda de novo
//  - cada tarefa isolada: erro vai pro agenda.json (os últimos 20) e pro console, nunca derruba o giro nem o
//    servidor; mensagem com cara de credencial é trocada antes. Depois de cada tarefa o cache do diagnóstico zera
//  - rodarAgora (POST manual) entra na mesma vez do laço (espera o giro em curso) e responde em até 25 s; o que
//    passar disso segue rodando e aparece em estado().rodando
//  - os módulos das tarefas entram por import() na hora de rodar: este arquivo carrega só a estatística (o teste
//    da decisão não toca disco) e módulo com defeito derruba só a tarefa dele
//  - CRONOGRAMA_AGENDA=0 no ambiente: o laço não liga (servidor de teste); o POST manual continua valendo
import { msDe, diaBrasilia, partesBrasilia, inicioDoDia, somarDias, semanaIso, intervaloSemana, somarSemanas } from './estatistica.mjs';

export const TAREFAS = ['sincronizar', 'hipoteses', 'stories', 'publico', 'anuncios', 'relatorio'];
export const ROTULO_TAREFA = {
  sincronizar: 'Ler os posts do Instagram',
  hipoteses: 'Avaliar as hipóteses',
  stories: 'Capturar os stories',
  publico: 'Ler o público da conta',
  anuncios: 'Ler os anúncios',
  relatorio: 'Gerar o resumo semanal',
};
const QUANDO = {
  sincronizar: 'a cada 3 horas, com o Instagram conectado',
  hipoteses: 'depois de cada leitura dos posts',
  stories: 'a cada hora (story só tem número enquanto está no ar)',
  publico: 'uma vez por dia (leitura cortada tenta de novo em 1 hora)',
  anuncios: 'a cada 12 horas, com a conta de anúncios escolhida e o token dos anúncios valendo',
  relatorio: 'segunda a partir das 7h (Brasília), depois da primeira leitura dos posts na semana nova (sem ela, na terça às 7h, com aviso); o da semana retrasada é gerado de novo quando todas as peças dela fazem 7 dias',
};
const HORA = 3_600_000;
export const INTERVALO = { sincronizar: 3 * HORA, stories: HORA, publico: 20 * HORA, anuncios: 12 * HORA };
// depois de uma falha, a tarefa volta a ser devida nesse tempo (as outras esperam o intervalo, com sucesso ou falha)
const ESPERA_FALHA = { publico: HORA, relatorio: 3 * HORA };
const HORA_SEMANAL = 7;
// sem leitura dos posts depois do fim da semana, o semanal sai assim mesmo 24h depois da hora (terça 7h), com aviso
const ESPERA_LEITURA_SEMANAL = 24 * HORA;
// situação do resumo gravado (situacaoRelatorio de relatorio-motor.mjs) que pede gerar de novo
const REFAZER_ANTERIOR = new Set(['falta', 'parcial', 'desatualizado']);
const REFAZER_RETRASADA = new Set(['parcial', 'desatualizado', 'provisorio']);
const PRIMEIRO_GIRO_MS = 2 * 60_000;
const GIRO_MS = 30 * 60_000;
const ESPERA_MANUAL_MS = 25_000;
const MAX_ERROS = 20;
const ARQUIVO = 'agenda.json';

const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const iso = (ms) => new Date(ms).toISOString();

// ---------- a decisão (pura) ----------

// o semanal (puro): { semanas: [as devidas agora, fora a hora da segunda e a espera de uma falha], aguardando:
// [{ semana, ate }] as que esperam a leitura dos posts (ate: quando saem assim mesmo, com aviso; null: só com a
// leitura) }. A semana anterior sai quando falta, está parcial ou desatualizada e os posts foram lidos depois do
// fim dela (segunda 0h); sem leitura, na terça 7h (a desatualizada, que já saiu com aviso, só com leitura nova).
// A retrasada, gravada parcial, desatualizada ou com peça de menos de 7 dias, sai com leitura depois da mesma
// segunda 0h, quando a última peça dela (a de domingo) já fez 7 dias.
// opcoes: semanal { anterior, retrasada } (situacaoRelatorio de cada uma; sem ele, semanaAnteriorTemRelatorio
// true é 'fechado' e false é 'falta', e a retrasada conta como fechada) e ultimaSincronizacao
export function semanalPendente(agoraMs, opcoes = {}) {
  const semana = semanaIso(diaBrasilia(agoraMs));
  const i = intervaloSemana(semana);
  if (!i) return { semanas: [], aguardando: [] };
  const segunda0h = inicioDoDia(i.inicio);
  const lido = msDe(opcoes?.ultimaSincronizacao);
  const leuDepois = lido != null && lido >= segunda0h;
  const semLeituraEm = segunda0h + HORA_SEMANAL * HORA + ESPERA_LEITURA_SEMANAL;
  const sit = objeto(opcoes?.semanal);
  const sitAnterior = sit.anterior ?? (opcoes?.semanaAnteriorTemRelatorio ? 'fechado' : 'falta');
  const sitRetrasada = sit.retrasada ?? 'fechado';
  const semanas = [];
  const aguardando = [];
  if (REFAZER_ANTERIOR.has(sitAnterior)) {
    const ate = sitAnterior === 'desatualizado' ? null : semLeituraEm;
    if (leuDepois || (ate != null && agoraMs >= ate)) semanas.push(somarSemanas(semana, -1));
    else aguardando.push({ semana: somarSemanas(semana, -1), ate });
  }
  if (REFAZER_RETRASADA.has(sitRetrasada)) {
    if (leuDepois) semanas.push(somarSemanas(semana, -2));
    else aguardando.push({ semana: somarSemanas(semana, -2), ate: null });
  }
  return { semanas, aguardando };
}

// anúncios só com a conta escolhida e o token dos anúncios valendo (recusado ou vencido, a tarefa só anotaria o
// mesmo erro a cada 12h). tokenDisponivel null: não deu pra saber, vale a conta
export const anunciosProntos = (arquivoAnuncios, tokenDisponivel = null) => Boolean(arquivoAnuncios?.conta) && tokenDisponivel !== false;

// o retorno de publico.atualizar() que não é sucesso: a mensagem da falha, ou null. Leitura que parou no meio
// (limite da Meta, rede fora ou tempo esgotado: o limitado) ou que não leu nada perde o dia se contar como ok
export function falhaDaLeituraPublico(r) {
  if (!r || typeof r !== 'object') return null;
  if (r.limitado) return `A leitura do público parou no meio e tenta de novo em 1 hora. ${String(r.limitado).trim()}`.trim();
  if (r.lidos === 0) return 'Nenhum número do público veio da Meta nesta leitura: tenta de novo em 1 hora.';
  return null;
}

// ultimas: agenda.json ultimas ({ [tarefa]: { em, ok, erro? } }); agoraMs: o relógio de quem chama.
// opções: conectado (Instagram), contaAnuncios (conta escolhida e token dos anúncios valendo), semanal (situação
// dos resumos gravados da semana anterior e da retrasada, ou semanaAnteriorTemRelatorio), diaAtual (AAAA-MM-DD em
// Brasília; sem ele sai do agoraMs) e ultimaSincronizacao (a última leitura dos nossos posts, de qualquer origem).
// Devolve as tarefas devidas na ordem em que rodam
export function tarefasDevidas(ultimas, agoraMs, opcoes = {}) {
  const u = objeto(ultimas);
  const { conectado = false, contaAnuncios = false, ultimaSincronizacao = null } = opcoes ?? {};
  const dia = opcoes?.diaAtual ?? diaBrasilia(agoraMs);
  const ha = (quando) => {
    const ms = msDe(quando);
    return ms == null ? Infinity : agoraMs - ms;
  };
  const devidas = new Set();
  if (conectado && ha(u.sincronizar?.em) >= INTERVALO.sincronizar && ha(ultimaSincronizacao) >= INTERVALO.sincronizar) devidas.add('sincronizar');
  // hipóteses: depois de cada sincronização (a desta rodada ou uma manual que ainda não foi avaliada)
  const sinc = msDe(ultimaSincronizacao);
  const hip = msDe(u.hipoteses?.em);
  if (devidas.has('sincronizar') || (sinc != null && (hip == null || sinc > hip))) devidas.add('hipoteses');
  if (conectado && ha(u.stories?.em) >= INTERVALO.stories) devidas.add('stories');
  // público: a cada 20h ou na virada do dia; a leitura que falhou (cortada ou vazia) tenta de novo em 1h
  const pub = u.publico;
  const publicoDevido = pub?.ok === false ? ha(pub.em) >= ESPERA_FALHA.publico : ha(pub?.em) >= INTERVALO.publico || diaBrasilia(pub?.em) !== dia;
  if (conectado && publicoDevido) devidas.add('publico');
  if (contaAnuncios && ha(u.anuncios?.em) >= INTERVALO.anuncios) devidas.add('anuncios');
  const p = partesBrasilia(agoraMs);
  const depoisDaSegunda7h = Boolean(p) && (p.diaSemana !== 1 || p.hora >= HORA_SEMANAL);
  const falhouAgorinha = u.relatorio?.ok === false && ha(u.relatorio.em) < ESPERA_FALHA.relatorio;
  if (depoisDaSegunda7h && !falhouAgorinha && semanalPendente(agoraMs, opcoes ?? {}).semanas.length) devidas.add('relatorio');
  return TAREFAS.filter((t) => devidas.has(t));
}

// quando cada tarefa volta a ser devida (ISO), no mais cedo no próximo giro; null = não roda (falta conexão ou
// conta). É uma estimativa: a tarefa roda no primeiro giro depois dessa hora
export function proximasExecucoes(ultimas, agoraMs, ctx, proximoGiroMs = null) {
  const saida = Object.fromEntries(TAREFAS.map((t) => [t, null]));
  if (!ctx) return saida;
  const u = objeto(ultimas);
  const piso = Math.max(agoraMs, proximoGiroMs ?? agoraMs);
  const depois = (quando, intervalo) => {
    const ms = msDe(quando);
    return ms == null ? piso : Math.max(piso, ms + intervalo);
  };
  const hoje = diaBrasilia(agoraMs);
  if (ctx.conectado) {
    saida.sincronizar = iso(Math.max(depois(u.sincronizar?.em, INTERVALO.sincronizar), depois(ctx.ultimaSincronizacao, INTERVALO.sincronizar)));
    saida.stories = iso(depois(u.stories?.em, INTERVALO.stories));
    const ultimo = msDe(u.publico?.em);
    const amanha = inicioDoDia(somarDias(hoje, 1));
    if (u.publico?.ok === false && ultimo != null) saida.publico = iso(Math.max(piso, ultimo + ESPERA_FALHA.publico));
    else saida.publico = iso(ultimo == null || diaBrasilia(ultimo) !== hoje ? piso : Math.max(piso, Math.min(ultimo + INTERVALO.publico, amanha)));
  }
  const devidas = tarefasDevidas(u, agoraMs, ctx);
  if (devidas.includes('hipoteses') && !devidas.includes('sincronizar')) saida.hipoteses = iso(piso);
  else if (saida.sincronizar) saida.hipoteses = saida.sincronizar;
  if (ctx.contaAnuncios) saida.anuncios = iso(depois(u.anuncios?.em, INTERVALO.anuncios));
  // o semanal: com semana pendente, a segunda 7h (e a espera de uma falha); se ela ainda espera a leitura dos
  // posts, a próxima sincronização (ou a terça 7h, quando sai com aviso). Nada pendente: a próxima segunda 7h
  const segunda = intervaloSemana(semanaIso(hoje))?.inicio;
  if (segunda) {
    const seteHoras = (dia) => inicioDoDia(dia) + HORA_SEMANAL * HORA;
    const pend = semanalPendente(agoraMs, ctx);
    let ms = null;
    if (pend.semanas.length || pend.aguardando.length) {
      ms = Math.max(piso, seteHoras(segunda));
      if (u.relatorio?.ok === false && msDe(u.relatorio.em) != null) ms = Math.max(ms, msDe(u.relatorio.em) + ESPERA_FALHA.relatorio);
      if (!pend.semanas.length) {
        const quando = [msDe(saida.sincronizar), ...pend.aguardando.map((a) => a.ate)].filter((x) => x != null);
        ms = quando.length ? Math.max(ms, Math.min(...quando)) : null;
      }
    }
    saida.relatorio = iso(ms ?? seteHoras(somarDias(segunda, 7)));
  }
  return saida;
}

// ---------- arquivo (agenda.json, fila de escrita no molde de monitoramento.mjs) ----------

let cache = null;
let carregando = null;
let fila = Promise.resolve();

async function lerAgenda() {
  if (cache) return cache;
  carregando ??= (async () => {
    const { lerJson } = await import('./db.mjs');
    const bruto = objeto(await lerJson(ARQUIVO, null));
    const ultimas = {};
    for (const t of TAREFAS) {
      const x = objeto(bruto.ultimas)[t];
      if (x && typeof x.em === 'string') ultimas[t] = { em: x.em, ok: Boolean(x.ok), ...(x.erro ? { erro: String(x.erro) } : {}) };
    }
    const erros = (Array.isArray(bruto.erros) ? bruto.erros : []).filter((x) => x && typeof x === 'object').slice(-MAX_ERROS);
    cache = { versao: 1, ultimas, erros };
    return cache;
  })().catch((e) => {
    carregando = null; // tenta de novo na próxima vez
    throw e;
  });
  return carregando;
}

function gravar() {
  const proxima = fila.then(async () => (await import('./db.mjs')).gravarJson(ARQUIVO, cache));
  fila = proxima.catch((e) => console.error('Falha ao gravar agenda.json:', e.message));
  return proxima;
}

async function registrar(tarefa, r) {
  const a = await lerAgenda();
  a.ultimas[tarefa] = r;
  if (!r.ok) a.erros = [...a.erros, { em: r.em, tarefa, msg: r.erro }].slice(-MAX_ERROS);
  await gravar();
}

// ---------- contexto da decisão ----------

const avisados = new Set();
async function seguro(oque, fn, padrao) {
  try {
    return await fn();
  } catch (e) {
    // o mesmo defeito não enche o log a cada giro e a cada GET da aba
    const chave = `${oque}: ${e.message}`;
    if (!avisados.has(chave)) {
      avisados.add(chave);
      console.error(`Agenda: não deu pra saber ${oque} (${e.message}).`);
    }
    return padrao;
  }
}

async function contexto() {
  const [conectado, contaAnuncios, semanal, ultimaSincronizacao] = await Promise.all([
    seguro('se o Instagram está conectado', async () => {
      const ig = await import('./instagram.mjs');
      return typeof ig.conectado === 'function' ? Boolean(await ig.conectado()) : Boolean((await ig.status())?.conectado);
    }, false),
    seguro('a conta de anúncios', async () => {
      const [an, ig] = await Promise.all([import('./anuncios.mjs'), import('./instagram.mjs')]);
      const a = typeof an.ler === 'function' ? await an.ler() : await an.status();
      return anunciosProntos(a, typeof ig.tokenUsuarioDisponivel === 'function' ? Boolean(ig.tokenUsuarioDisponivel()) : null);
    }, false),
    // na dúvida, conta como fechado: melhor esperar o próximo giro do que gerar em cima de um erro
    seguro('os resumos semanais gravados', async () => {
      const r = await import('./relatorio.mjs');
      const anterior = r.semanaAnterior();
      const [a, b] = await Promise.all([r.situacao(anterior), r.situacao(somarSemanas(anterior, -1))]);
      return { anterior: a, retrasada: b };
    }, { anterior: 'fechado', retrasada: 'fechado' }),
    // a última leitura dos NOSSOS posts: propriosEm (a das inspirações não grava); sincronizadoEm em banco antigo
    seguro('a última leitura do Instagram', async () => {
      const ig = (await (await import('./db.mjs')).carregar()).instagram ?? {};
      return ig.propriosEm ?? ig.sincronizadoEm ?? null;
    }, null),
  ]);
  return { conectado, contaAnuncios, semanal, ultimaSincronizacao };
}

// ---------- as tarefas ----------

const MSG_PULADA = 'Já tinha uma leitura do Instagram rodando; a agenda tenta de novo no próximo giro.';
const EXECUTAR = {
  async sincronizar() {
    const ig = await import('./instagram.mjs');
    if (typeof ig.emAndamento === 'function' && ig.emAndamento()) return { pulada: MSG_PULADA };
    // com origem agenda e outra leitura rodando, a sincronização devolve null em vez de 409
    return (await ig.sincronizar({ escopo: 'proprios', origem: 'agenda' })) === null ? { pulada: MSG_PULADA } : {};
  },
  async hipoteses() {
    await (await import('./diagnostico.mjs')).avaliarHipoteses();
  },
  async stories() {
    await (await import('./stories-metricas.mjs')).capturar();
  },
  async publico() {
    const falhou = falhaDaLeituraPublico(await (await import('./publico.mjs')).atualizar());
    if (falhou) throw new Error(falhou);
  },
  async anuncios() {
    await (await import('./anuncios.mjs')).atualizar();
  },
  // as semanas pendentes (a anterior e a retrasada); o "rodar agora" sem nenhuma gera a anterior, como o
  // "Gerar agora" da aba. Uma semana que falha não impede a outra; a falha fica anotada e volta em 3h
  async relatorio({ manual = false } = {}) {
    const r = await import('./relatorio.mjs');
    const { semanas } = semanalPendente(Date.now(), await contexto());
    const lista = semanas.length ? semanas : manual ? [r.semanaAnterior()] : [];
    let erro = null;
    for (const semana of lista) {
      try {
        await r.gerar(semana, { autor: 'agenda' });
      } catch (e) {
        erro ??= e;
      }
    }
    if (erro) throw erro;
  },
};

async function mensagemSegura(e) {
  let msg = String(e?.message ?? e ?? '').replace(/\s+/g, ' ').trim() || 'Erro sem mensagem.';
  try {
    const { semTracos } = await import('./db.mjs');
    msg = semTracos(msg).slice(0, 300);
    const { contemSegredo } = await import('./guarda.mjs');
    if (await contemSegredo(msg)) msg = 'A mensagem de erro tinha cara de credencial e foi omitida.';
  } catch {
    msg = msg.slice(0, 300);
  }
  return msg;
}

async function invalidarDiagnostico() {
  try {
    (await import('./diagnostico.mjs')).invalidar?.();
  } catch {
    /* diagnóstico que não carrega não tem cache pra zerar */
  }
}

let emCurso = null; // { tarefa, desde }
const naFila = []; // tarefas manuais esperando a vez

// roda uma tarefa, anota o resultado e nunca rejeita. opcoes.manual: veio do POST (rodarAgora)
async function rodarTarefa(tarefa, opcoes = {}) {
  emCurso = { tarefa, desde: iso(Date.now()) };
  try {
    const r = await EXECUTAR[tarefa](opcoes);
    if (r?.pulada) return { tarefa, ok: true, pulada: r.pulada };
    await registrar(tarefa, { em: iso(Date.now()), ok: true });
    return { tarefa, ok: true };
  } catch (e) {
    const msg = await mensagemSegura(e);
    console.error(`Agenda: "${ROTULO_TAREFA[tarefa]}" falhou: ${msg}`);
    if (!e?.status && e?.stack) console.error(String(e.stack).split('\n').slice(1, 4).join('\n'));
    await registrar(tarefa, { em: iso(Date.now()), ok: false, erro: msg }).catch(() => {});
    return { tarefa, ok: false, erro: msg };
  } finally {
    emCurso = null;
    await invalidarDiagnostico();
  }
}

// a vez: giro e tarefa manual nunca rodam juntos
let vez = Promise.resolve();
function naVez(fn) {
  const proxima = vez.then(fn);
  vez = proxima.catch(() => {});
  return proxima;
}

let ligada = false;
let proximoGiroMs = null;

async function giro() {
  for (const tarefa of TAREFAS) {
    if (!ligada) return;
    const a = await lerAgenda();
    if (!tarefasDevidas(a.ultimas, Date.now(), await contexto()).includes(tarefa)) continue;
    await rodarTarefa(tarefa);
  }
}

function marcar(ms) {
  proximoGiroMs = Date.now() + ms;
  const relogio = setTimeout(() => {
    proximoGiroMs = null;
    naVez(giro)
      .catch((e) => console.error('Agenda: o giro parou no meio:', e?.message ?? e))
      .finally(() => {
        if (ligada) marcar(GIRO_MS);
      });
  }, ms);
  relogio.unref?.();
}

// ---------- o que o servidor chama ----------

// no listen do server.mjs. CRONOGRAMA_AGENDA=0 não liga (devolve false)
export function iniciar() {
  if (ligada) return true;
  if (process.env.CRONOGRAMA_AGENDA === '0') return false;
  ligada = true;
  marcar(PRIMEIRO_GIRO_MS);
  return true;
}

// { ligada, ultimas: { [tarefa]: { em, ok, erro? } } (só as que já rodaram), proximas: { [tarefa]: ISO|null },
//   erros: [os 10 mais novos, o mais novo primeiro], rodando, naFila, proximoGiro, tarefas: [{ id, rotulo, quando }] }
export async function estado() {
  const a = await lerAgenda();
  const ctx = ligada ? await contexto() : null;
  return {
    ligada,
    ultimas: structuredClone(a.ultimas),
    proximas: proximasExecucoes(a.ultimas, Date.now(), ctx, proximoGiroMs),
    erros: a.erros.slice(-10).reverse(),
    rodando: emCurso ? { ...emCurso } : null,
    naFila: [...naFila],
    proximoGiro: ligada && proximoGiroMs ? iso(proximoGiroMs) : null,
    tarefas: TAREFAS.map((id) => ({ id, rotulo: ROTULO_TAREFA[id], quando: QUANDO[id] })),
  };
}

// POST manual: roda a tarefa na próxima vez livre, sem esperar o intervalo. Devolve estado() e o resultado
// (ou { rodando: true } quando passa de 25 s: segue rodando e o GET acompanha)
export async function rodarAgora(tarefa, { esperarMs = ESPERA_MANUAL_MS } = {}) {
  if (!TAREFAS.includes(tarefa)) {
    const { falha } = await import('./db.mjs');
    throw falha(404, 'Essa tarefa não existe na agenda.');
  }
  naFila.push(tarefa);
  const execucao = naVez(() => {
    naFila.splice(naFila.indexOf(tarefa), 1);
    return rodarTarefa(tarefa, { manual: true });
  });
  let relogio;
  const limite = new Promise((ok) => {
    relogio = setTimeout(() => ok(null), esperarMs);
    relogio.unref?.();
  });
  const resultado = await Promise.race([execucao, limite]);
  clearTimeout(relogio);
  return { ...(await estado()), resultado: resultado ?? { tarefa, rodando: true } };
}
