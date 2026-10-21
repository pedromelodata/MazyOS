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
//  - 21/10 (Pedro): as tarefas de conteúdo (TAREFAS_CONTEUDO): as notícias do dia no Início (noticias.mjs, todo dia a
//    partir das 06:00 de Brasília, uma vez por dia) e o gerador da semana (gerador-semana.mjs, segunda a partir das
//    06:00, só a partir de 02/11/2026, uma vez por segunda: gera a semana seguinte). Falhou: tenta de novo em 1 h (o
//    gerador, até o fim da segunda). Ficam fora de TAREFAS (a lista das Métricas que o Diagnóstico mostra), gravam no
//    agenda.json em "conteudo" e "errosConteudo" e rodam fora da vez das Métricas (o gerador leva minutos e não pode
//    segurar a leitura do Instagram). O relógio acorda às 06:00 em ponto, sem esperar o giro de 30 min
//  - 21/10 (Pedro): a geração que não completou a semana (a IA caiu num post, o plano veio curto) é falha e tenta de
//    novo em 1 h (geracaoIncompleta); rodar de novo é seguro, o gerador só completa o que falta. A falha por falta da
//    chave da IA (semIa) fica anotada uma vez e não tenta de novo no mesmo dia enquanto a chave não aparece: eram 18
//    erros iguais na segunda, empurrando os das notícias pra fora da lista. Antes do 503, o gerador grava a pesquisa
//    no Google da semana (buscas e manchetes), pra tela mostrar
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

// ---------- as tarefas de conteúdo (21/10, Pedro): notícias do dia e gerador da semana ----------

export const TAREFAS_CONTEUDO = ['noticias', 'semana'];
export const ROTULO_TAREFA_CONTEUDO = { noticias: 'Buscar as notícias do dia', semana: 'Gerar a semana seguinte' };
const QUANDO_CONTEUDO = {
  noticias: 'todo dia a partir das 06:00 (Brasília), uma vez por dia; falhou, tenta de novo em 1 hora',
  semana: 'segunda a partir das 06:00 (Brasília), a partir de 02/11/2026: gera a semana seguinte; falhou ou ficou incompleta, tenta de novo em 1 hora até o fim da segunda; sem a chave da IA, grava só a pesquisa no Google e não repete no dia',
};
export const HORA_CONTEUDO = 6;
export const PRIMEIRA_SEGUNDA_GERADOR = '2026-11-02';
const ESPERA_FALHA_CONTEUDO = HORA;

// a falha por falta da chave da IA (semIa) anotada hoje, com a chave ainda desligada (opcoes.iaLigada): não tenta de
// novo no mesmo dia
const semIaHoje = (x, hoje, opcoes) => x?.ok === false && x.semIa === true && msDe(x.em) != null && diaBrasilia(msDe(x.em)) === hoje && !opcoes?.iaLigada;

// conteudo: agenda.json conteudo ({ [tarefa]: { em, ok, erro?, semIa? } }). Puro: só o relógio de quem chama.
// opcoes.iaLigada: a chave da IA está no servidor agora (a falha semIa de hoje volta a valer a espera de 1 h)
export function tarefasConteudoDevidas(conteudo, agoraMs, opcoes = {}) {
  const u = objeto(conteudo);
  const p = partesBrasilia(agoraMs);
  const hoje = diaBrasilia(agoraMs);
  if (!p || !hoje) return [];
  const seisHoras = inicioDoDia(hoje) + HORA_CONTEUDO * HORA;
  const okHoje = (x) => Boolean(x?.ok) && (msDe(x.em) ?? -Infinity) >= seisHoras;
  const falhouAgorinha = (x) => (x?.ok === false && msDe(x.em) != null && agoraMs - msDe(x.em) < ESPERA_FALHA_CONTEUDO) || semIaHoje(x, hoje, opcoes);
  const devidas = [];
  if (agoraMs >= seisHoras && !okHoje(u.noticias) && !falhouAgorinha(u.noticias)) devidas.push('noticias');
  if (p.diaSemana === 1 && agoraMs >= seisHoras && hoje >= PRIMEIRA_SEGUNDA_GERADOR && !okHoje(u.semana) && !falhouAgorinha(u.semana)) devidas.push('semana');
  return devidas;
}

// 21/10 (Pedro): o resumo do gerador que ainda deixa a semana com falta (faltam) vira a mensagem da falha; completo, null
export function geracaoIncompleta(r) {
  const f = objeto(r?.faltam);
  const partes = [[f.reels, 'reel', 'reels'], [f.feeds, 'feed', 'feeds'], [f.stories, 'tema de stories', 'temas de stories']]
    .filter(([n]) => Number.isInteger(n) && n > 0).map(([n, um, varios]) => `${n} ${n === 1 ? um : varios}`);
  if (!partes.length) return null;
  const lista = partes.length > 1 ? `${partes.slice(0, -1).join(', ')} e ${partes.at(-1)}` : partes[0];
  const erros = (Array.isArray(r?.erros) ? r.erros : []).slice(0, 3).join(' | ');
  return `A geração da semana ficou incompleta: ${partes.length === 1 && /^1 /.test(lista) ? 'falta' : 'faltam'} ${lista}.${erros ? ` ${erros}` : ''} Tenta de novo em 1 hora.`;
}

// quando cada tarefa de conteúdo roda de novo (ISO; estimativa, como proximasExecucoes). opcoes: iaLigada
export function proximasConteudo(conteudo, agoraMs, proximoGiroMs = null, opcoes = {}) {
  const u = objeto(conteudo);
  const piso = Math.max(agoraMs, proximoGiroMs ?? agoraMs);
  const hoje = diaBrasilia(agoraMs);
  const seis = (dia) => inicioDoDia(dia) + HORA_CONTEUDO * HORA;
  const devidas = tarefasConteudoDevidas(u, agoraMs, opcoes);
  // a falha sem IA de hoje não tem nova tentativa hoje: a próxima é a do dia seguinte (notícias) ou a próxima segunda
  const depoisDaFalha = (x) => (x?.ok === false && msDe(x.em) != null && !semIaHoje(x, hoje, opcoes) ? msDe(x.em) + ESPERA_FALHA_CONTEUDO : null);
  let noticias;
  if (devidas.includes('noticias')) noticias = piso;
  else if (depoisDaFalha(u.noticias) && depoisDaFalha(u.noticias) > agoraMs) noticias = depoisDaFalha(u.noticias);
  else noticias = agoraMs < seis(hoje) ? seis(hoje) : seis(somarDias(hoje, 1));
  // a próxima segunda que ainda gera (a de hoje, se ainda não gerou; nunca antes de 02/11/2026)
  let semana;
  const p = partesBrasilia(agoraMs);
  const falhaSemana = depoisDaFalha(u.semana);
  if (devidas.includes('semana')) semana = piso;
  else if (p.diaSemana === 1 && falhaSemana && falhaSemana > agoraMs && diaBrasilia(falhaSemana) === hoje) semana = falhaSemana;
  else {
    let dia = p.diaSemana === 1 && agoraMs < seis(hoje) ? hoje : somarDias(hoje, (8 - p.diaSemana) % 7 || 7);
    while (dia < PRIMEIRA_SEGUNDA_GERADOR) dia = somarDias(dia, 7);
    semana = seis(dia);
  }
  return { noticias: iso(noticias), semana: iso(semana) };
}

// ms até as próximas 06:00 de Brasília (+5 s), pra acordar o relógio na hora
export function msAteAsSeis(agoraMs) {
  const hoje = diaBrasilia(agoraMs);
  let alvo = inicioDoDia(hoje) + HORA_CONTEUDO * HORA + 5_000;
  if (alvo <= agoraMs) alvo = inicioDoDia(somarDias(hoje, 1)) + HORA_CONTEUDO * HORA + 5_000;
  return alvo - agoraMs;
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
    // 21/10: as tarefas de conteúdo (notícias e gerador da semana), separadas das Métricas
    const conteudo = {};
    for (const t of TAREFAS_CONTEUDO) {
      const x = objeto(bruto.conteudo)[t];
      if (x && typeof x.em === 'string') conteudo[t] = { em: x.em, ok: Boolean(x.ok), ...(x.erro ? { erro: String(x.erro) } : {}), ...(x.semIa === true ? { semIa: true } : {}) };
    }
    const errosConteudo = (Array.isArray(bruto.errosConteudo) ? bruto.errosConteudo : []).filter((x) => x && typeof x === 'object').slice(-MAX_ERROS);
    cache = { versao: 1, ultimas, erros, conteudo, errosConteudo };
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
    const sm = await import('./stories-metricas.mjs');
    await sm.capturar();
    // 21/10: o dia que teve story no ar fica "Postado" no cronograma
    await sm.marcarDiasPostados();
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

// ---------- as tarefas de conteúdo (21/10): fora da vez das Métricas, uma por vez entre elas ----------

const EXECUTAR_CONTEUDO = {
  async noticias() {
    await (await import('./noticias.mjs')).atualizar();
  },
  // sem semana: a seguinte à de hoje (a segunda 02/11 gera 09/11 a 15/11). Sem a chave da IA, grava a pesquisa no
  // Google da semana antes do 503; a semana que ficou com falta é falha (tenta de novo em 1 h)
  async semana() {
    const r = await (await import('./gerador-semana.mjs')).gerarSemana({ autor: 'agenda', pesquisarSemIa: true });
    const incompleta = geracaoIncompleta(r);
    if (incompleta) throw new Error(incompleta);
  },
};

// a chave da IA está no servidor agora (o mesmo teste das notícias e do gerador)
const iaLigadaAgora = () => import('./noticias.mjs').then((n) => Boolean(n.iaConfigurada())).catch(() => false);
// a falha é a falta da chave da IA (503 com a mensagem de sempre)
const ehSemIa = (e) => (e?.status === 503 ? import('./noticias.mjs').then((n) => String(e?.message ?? '') === n.MSG_SEM_IA).catch(() => false) : false);

// anota o resultado de uma tarefa de conteúdo (a agenda e o "Atualizar agora" das notícias). semIa: a falha foi a
// falta da chave da IA (não tenta de novo no mesmo dia)
export async function anotarConteudo(tarefa, { ok, erro = null, semIa = false } = {}) {
  if (!TAREFAS_CONTEUDO.includes(tarefa)) return;
  const a = await lerAgenda();
  const em = iso(Date.now());
  const msg = ok ? null : await mensagemSegura({ message: erro ?? 'Erro sem mensagem.' });
  a.conteudo[tarefa] = { em, ok: Boolean(ok), ...(msg ? { erro: msg } : {}), ...(!ok && semIa ? { semIa: true } : {}) };
  if (!ok) a.errosConteudo = [...a.errosConteudo, { em, tarefa, msg }].slice(-MAX_ERROS);
  await gravar();
}

let conteudoEmCurso = null; // { tarefa, desde }
async function giroConteudo() {
  if (conteudoEmCurso) return;
  for (const tarefa of TAREFAS_CONTEUDO) {
    if (!ligada) return;
    const a = await lerAgenda();
    if (!tarefasConteudoDevidas(a.conteudo, Date.now(), { iaLigada: await iaLigadaAgora() }).includes(tarefa)) continue;
    conteudoEmCurso = { tarefa, desde: iso(Date.now()) };
    try {
      await EXECUTAR_CONTEUDO[tarefa]();
      await anotarConteudo(tarefa, { ok: true });
    } catch (e) {
      console.error(`Agenda: "${ROTULO_TAREFA_CONTEUDO[tarefa]}" falhou: ${e?.message ?? e}`);
      await anotarConteudo(tarefa, { ok: false, erro: e?.message ?? String(e), semIa: await ehSemIa(e) }).catch(() => {});
    } finally {
      conteudoEmCurso = null;
    }
  }
}

// { ultimas, proximas, erros (os 10 mais novos), rodando, tarefas }: o que a tela do conteúdo mostra
export async function estadoConteudo() {
  const a = await lerAgenda();
  return {
    ligada,
    ultimas: structuredClone(a.conteudo),
    proximas: proximasConteudo(a.conteudo, Date.now(), ligada ? proximoGiroMs : null, { iaLigada: await iaLigadaAgora() }),
    erros: a.errosConteudo.slice(-10).reverse(),
    rodando: conteudoEmCurso ? { ...conteudoEmCurso } : null,
    tarefas: TAREFAS_CONTEUDO.map((id) => ({ id, rotulo: ROTULO_TAREFA_CONTEUDO[id], quando: QUANDO_CONTEUDO[id] })),
  };
}

function marcar(ms) {
  // 21/10: acorda às 06:00 em ponto (notícias do dia e gerador da segunda), sem esperar o giro de 30 min
  const espera = Math.min(ms, msAteAsSeis(Date.now()));
  proximoGiroMs = Date.now() + espera;
  const relogio = setTimeout(() => {
    proximoGiroMs = null;
    giroConteudo().catch((e) => console.error('Agenda: o giro do conteúdo parou no meio:', e?.message ?? e));
    naVez(giro)
      .catch((e) => console.error('Agenda: o giro parou no meio:', e?.message ?? e))
      .finally(() => {
        if (ligada) marcar(GIRO_MS);
      });
  }, espera);
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
