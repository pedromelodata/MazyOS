// Validação do que chega de fora pra reel e ideia: a mesma na tela (POST/PUT), no lote
// (POST /api/reels/lote) e no importar-nicho.mjs. Saiu do server.mjs em 23/09.
import {
  falha, agora, dataValida, TIPOS_REEL, conferirTipo, limparGravacao, limparFontes, gravacaoVazia,
  conferirTema, limparRoteiroBase, roteiroBaseVazio, textoCurto, TRACOS, conferirPeca, conferirBloco, blocoDoPilar,
  limparCarrossel, limparEstatico, limparStories, carrosselVazio, estaticoVazio, storiesVazio, semTracos, BLOCOS,
  limparVideos,
} from './db.mjs';
import { CAMPANHA_PADRAO } from './migrar.mjs';
import { ANGULOS_PILAR_8, MECANICAS, anguloCanonico } from './mecanismo.mjs';

export const STATUS_REEL = ['ideia', 'roteiro', 'gravado', 'editado', 'publicado'];
// metricas (sincronização do Instagram) e insightsAplicados (Diagnóstico, 30/09) também são do servidor
// 21/10: aprovacao é do servidor (aprovacoes.mjs); o PUT da peça não mexe nela. atelie (o card e a conferência
// de quando a peça nasceu no Ateliê) também
// 21/10 (Pedro): versoesAnteriores (o "Regerar ideia" do gerador da semana, gerador-semana.mjs) também. A origem
// 'gerador-semana' já é do servidor pela regra de cima
const DO_SERVIDOR_REEL = ['origem', 'origemChat', 'metricas', 'insightsAplicados', 'aprovacao', 'atelie', 'versoesAnteriores'];
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
// o que um item do lote pode trazer (o resto é ignorado: origem, métricas e ids são do servidor)
const CAMPOS_LOTE = [
  'data', 'tipo', 'formatoId', 'pilar', 'ideiaId', 'campanhaId', 'status', 'ideia', 'tema', 'roteiro', 'legenda', 'gravacao', 'fontes',
  'rede', 'gatilho', 'impulsionar', 'formatoTexto', 'pilarTexto', 'notas', 'bloco', 'peca', 'peca2', 'carrossel', 'estatico', 'stories',
  'motivo', 'excecaoAntiRepeticao', 'mecanica', 'angulo', 'gatilhoEmocional', 'gatilhoPsicologico',
];

// ---------- campos da estratégia (21/10, Pedro: o mecanismo de anti-repetição e continuidade, mecanismo.mjs) ----------
// excecaoAntiRepeticao { ativa, motivo } (ou null): a repetição de propósito, com o motivo. mecanica: a caixinha
// quinzenal e a resposta da semana seguinte. angulo: um dos 9 ângulos do pilar 8. gatilhoEmocional e
// gatilhoPsicologico: as camadas do sistema "pilar × gatilho emocional × gatilho psicológico". Vazio é null (exceção e
// mecânica) ou texto vazio (o resto). Valem na peça e nos stories do dia
export const LIM_ESTRATEGIA = { motivoExcecao: 500, angulo: 100, gatilho: 100 };
export const CAMPOS_ESTRATEGIA = ['excecaoAntiRepeticao', 'mecanica', 'angulo', 'gatilhoEmocional', 'gatilhoPsicologico'];

function textoEstrategia(v, rotulo, lim) {
  if (v == null) return '';
  if (typeof v !== 'string') throw falha(400, `${rotulo} precisa ser texto.`);
  const t = semTracos(v).replace(/\s+/g, ' ').trim();
  if (t.length > lim) throw falha(400, `${rotulo} passa de ${lim} caracteres (tem ${t.length}).`);
  return t;
}

export function conferirExcecao(v) {
  if (v == null || v === '' || v === false) return null;
  if (typeof v !== 'object' || Array.isArray(v)) throw falha(400, 'excecaoAntiRepeticao precisa ser { ativa, motivo } (ou vazio).');
  if (typeof v.ativa !== 'boolean') throw falha(400, 'excecaoAntiRepeticao.ativa precisa ser verdadeiro ou falso.');
  const motivo = textoEstrategia(v.motivo, 'O motivo da repetição de propósito', LIM_ESTRATEGIA.motivoExcecao);
  if (v.ativa && !motivo) throw falha(400, 'Diga o motivo da repetição de propósito.');
  return { ativa: v.ativa, motivo };
}

export function conferirMecanica(v) {
  if (v == null || v === '') return null;
  if (!MECANICAS.includes(v)) throw falha(400, `mecanica precisa ser ${MECANICAS.join(' ou ')} (ou vazia).`);
  return v;
}

export function conferirAngulo(v) {
  const t = textoEstrategia(v, 'O ângulo', LIM_ESTRATEGIA.angulo);
  if (!t) return '';
  const a = anguloCanonico(t);
  if (!a) throw falha(400, `O ângulo precisa ser um dos 9 do pilar 8: ${ANGULOS_PILAR_8.join(', ')}.`);
  return a;
}

// só as chaves que vieram (edição parcial)
export function conferirCamposEstrategia(b) {
  if ('excecaoAntiRepeticao' in b) b.excecaoAntiRepeticao = conferirExcecao(b.excecaoAntiRepeticao);
  if ('mecanica' in b) b.mecanica = conferirMecanica(b.mecanica);
  if ('angulo' in b) b.angulo = conferirAngulo(b.angulo);
  if ('gatilhoEmocional' in b) b.gatilhoEmocional = textoEstrategia(b.gatilhoEmocional, 'O gatilho emocional', LIM_ESTRATEGIA.gatilho);
  if ('gatilhoPsicologico' in b) b.gatilhoPsicologico = textoEstrategia(b.gatilhoPsicologico, 'O gatilho psicológico', LIM_ESTRATEGIA.gatilho);
  return b;
}
export const MAX_LEGENDA = 2200;
// campos do calendário editorial (CSV oficial do mês, 24/09): todos opcionais no reel.
// formatoTexto é o formato como o calendário escreve ("Carrossel 4:5, 3 slides"); vale sozinho quando
// o reel não tem formatoId (formato livre). permalink é o "Link do post" do calendário
export const IMPULSIONAR = ['Sim', 'Não', 'Avaliar'];
// 21/10 (Pedro): motivo é a "defesa" do calendário da estratégia principal: por que o post existe
const TEXTOS_CALENDARIO = { rede: 200, gatilho: 1000, formatoTexto: 300, pilarTexto: 200, notas: 2000, motivo: 1000 };

function conferirCalendario(b) {
  for (const [k, lim] of Object.entries(TEXTOS_CALENDARIO)) {
    if (k in b) b[k] = textoCurto(b[k], k, lim).replace(TRACOS, ', ');
  }
  if ('impulsionar' in b) {
    if (b.impulsionar === '' || b.impulsionar == null) b.impulsionar = null;
    else if (!IMPULSIONAR.includes(b.impulsionar)) throw falha(400, `impulsionar precisa ser ${IMPULSIONAR.join(', ')} (ou vazio).`);
  }
  if ('pilar' in b) {
    if (b.pilar === '' || b.pilar == null) b.pilar = null;
    else if (!Number.isInteger(Number(b.pilar)) || Number(b.pilar) < 1) throw falha(400, 'pilar precisa ser o número de um pilar editorial.');
    else b.pilar = Number(b.pilar);
  }
  return b;
}

export const semCampos = (obj, campos) => Object.fromEntries(Object.entries(obj).filter(([k]) => !campos.includes(k)));

export function conferirRefs(db, b) {
  if (b.formatoId != null && b.formatoId !== '' && !db.formatos.some((f) => f.id === b.formatoId)) throw falha(400, 'Esse formato não existe na biblioteca.');
  if (b.ideiaId != null && b.ideiaId !== '' && !db.ideias.some((i) => i.id === b.ideiaId)) throw falha(400, 'Essa ideia não existe no banco.');
  if (b.reelId != null && b.reelId !== '' && !db.reels.some((r) => r.id === b.reelId)) throw falha(400, 'Esse reel não existe.');
  if (b.campanhaId != null && b.campanhaId !== '' && !db.campanhas.some((c) => c.id === b.campanhaId)) throw falha(400, 'Essa campanha não existe.');
  if (b.pilar != null && b.pilar !== '' && !(db.pilares ?? []).some((p) => p.id === Number(b.pilar))) throw falha(400, 'Esse pilar não existe.');
}

// o front manda "" quando um select fica em branco: referência vazia vira null
export function refsVazias(b) {
  for (const k of ['formatoId', 'ideiaId', 'reelId']) if (b[k] === '') b[k] = null;
  if (b.campanhaId === '') b.campanhaId = CAMPANHA_PADRAO;
  return b;
}

// status pela presença da chave: "", null e 0 também são recusados.
// item: o reel que está sendo editado (gravacao parcial completa com o que ele já tem)
export function conferirReel(b, item = null) {
  if ('status' in b && !STATUS_REEL.includes(b.status)) throw falha(400, `status precisa ser ${STATUS_REEL.join(', ')}.`);
  if ('data' in b) {
    if (b.data == null) b.data = '';
    if (b.data !== '' && !(typeof b.data === 'string' && DATA_ISO.test(b.data))) throw falha(400, 'data precisa ser AAAA-MM-DD (ou vazia).');
  }
  // 21/10: a posição da peça dentro do dia no cronograma (o card solto em cima de outro do mesmo dia troca os dois)
  if ('ordem' in b) {
    if (b.ordem === '' || b.ordem == null) b.ordem = null;
    else if (!Number.isInteger(b.ordem) || b.ordem < 0 || b.ordem > 99) throw falha(400, 'ordem precisa ser um número inteiro de 0 a 99 (ou vazia).');
  }
  if ('tipo' in b) b.tipo = conferirTipo(b.tipo);
  if ('gravacao' in b) b.gravacao = limparGravacao(b.gravacao, item?.gravacao);
  if ('fontes' in b) b.fontes = limparFontes(b.fontes);
  // 02/10: vídeo final da peça (db.mjs, limparVideos). A tela não manda o campo ao editar: fica como está
  if ('videos' in b) b.videos = limparVideos(b.videos);
  conferirCalendario(b);
  conferirCamposEstrategia(b);
  conferirEstrutura(b, item);
  return semCampos(b, DO_SERVIDOR_REEL);
}

// peça (24/09): tipo principal, segundo tipo (ou vazio), bloco do calendário e a estrutura de cada tipo.
// Pilar novo sem bloco junto: o bloco acompanha o pilar
function conferirEstrutura(b, item = null) {
  if ('peca' in b) b.peca = conferirPeca(b.peca);
  if ('peca2' in b) b.peca2 = conferirPeca(b.peca2, 'peca2', { vazio: true });
  const principal = b.peca ?? item?.peca ?? 'reel';
  if (b.peca2 != null && b.peca2 === principal) b.peca2 = null;
  if ('peca' in b && !('peca2' in b) && item?.peca2 === b.peca) b.peca2 = null;
  if ('bloco' in b) b.bloco = conferirBloco(b.bloco);
  else if ('pilar' in b) b.bloco = blocoDoPilar(b.pilar);
  if ('carrossel' in b) b.carrossel = limparCarrossel(b.carrossel, item?.carrossel);
  if ('estatico' in b) b.estatico = limparEstatico(b.estatico, item?.estatico);
  if ('stories' in b) b.stories = limparStories(b.stories);
  return b;
}

// título comparável: sem acento, caixa, pontuação e espaço extra
export const chaveTitulo = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const mesmoReel = (a, b) => a.data === b.data && (chaveTitulo(a.ideia) === chaveTitulo(b.ideia) || Boolean(a.ideiaId && a.ideiaId === b.ideiaId));

function textoOuVazio(v, rotulo) {
  if (v == null) return '';
  if (typeof v !== 'string') throw falha(400, `${rotulo} precisa ser texto.`);
  return v.trim();
}

export function roteiroLimpo(v) {
  if (v == null) return { hook: '', textoTela: '', cenas: [], desenvolvimento: '', cta: '' };
  if (typeof v !== 'object' || Array.isArray(v)) throw falha(400, 'roteiro precisa ser um objeto.');
  if (v.cenas != null && !Array.isArray(v.cenas)) throw falha(400, 'roteiro.cenas precisa ser uma lista.');
  const cenas = (v.cenas ?? []).map((c, i) => {
    if (!c || typeof c !== 'object' || Array.isArray(c)) throw falha(400, `roteiro.cenas[${i}] precisa ser um objeto {tempo, cena, fala, tela}.`);
    return Object.fromEntries(['tempo', 'cena', 'fala', 'tela'].map((k) => [k, textoOuVazio(c[k], `roteiro.cenas[${i}].${k}`)]));
  });
  return {
    hook: textoOuVazio(v.hook, 'roteiro.hook'),
    textoTela: textoOuVazio(v.textoTela, 'roteiro.textoTela'),
    cenas,
    desenvolvimento: textoOuVazio(v.desenvolvimento, 'roteiro.desenvolvimento'),
    cta: textoOuVazio(v.cta, 'roteiro.cta'),
  };
}

// um item do lote → reel pronto pra entrar (sem id). Erro de validação sai como falha(400)
export function reelDoLote(db, bruto) {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) throw falha(400, 'Cada reel precisa ser um objeto.');
  const b = refsVazias(Object.fromEntries(Object.entries(bruto).filter(([k]) => CAMPOS_LOTE.includes(k))));
  if (!TIPOS_REEL.includes(b.tipo)) throw falha(400, `tipo é obrigatório: ${TIPOS_REEL.join(', ')}.`);
  if (!dataValida(b.data)) throw falha(400, 'data é obrigatória e precisa ser um dia que existe, no formato AAAA-MM-DD.');
  // formato da Biblioteca de Reels só é obrigatório quando a peça tem reel
  const temReel = [b.peca ?? 'reel', b.peca2].includes('reel');
  if (temReel && !b.formatoId) throw falha(400, 'formatoId é obrigatório (um formato da Biblioteca de Reels).');
  if (b.formatoId && !db.formatos.some((f) => f.id === b.formatoId)) throw falha(400, `formatoId "${b.formatoId}" não existe na biblioteca.`);
  if (b.ideiaId && !db.ideias.some((i) => i.id === b.ideiaId)) throw falha(400, `ideiaId "${b.ideiaId}" não existe no banco de ideias.`);
  b.ideia = textoOuVazio(b.ideia, 'ideia');
  if (!b.ideia) throw falha(400, 'ideia (o título curto do reel) é obrigatória.');
  b.tema = textoOuVazio(b.tema, 'tema');
  b.legenda = textoOuVazio(b.legenda, 'legenda');
  if (b.legenda.length > MAX_LEGENDA) throw falha(400, `legenda tem ${b.legenda.length} caracteres; o limite do Instagram é ${MAX_LEGENDA}.`);
  b.roteiro = roteiroLimpo(b.roteiro);
  const limpo = conferirReel({ status: 'roteiro', gravacao: null, fontes: [], ...b });
  conferirRefs(db, limpo);
  return {
    ideia: '', tema: '', pilar: null, formatoId: null, campanhaId: CAMPANHA_PADRAO, data: '', status: 'roteiro',
    roteiro: roteiroLimpo(null), legenda: '', permalink: '', metricas: null, ideiaId: null, favorito: false,
    tipo: null, gravacao: gravacaoVazia(), fontes: [], ...pecaVazia(), ...limpo, criadoEm: agora(),
  };
}

// campos de peça de um item novo (o boot completa os antigos em migrar.mjs)
export const pecaVazia = () => ({
  peca: 'reel', peca2: null, bloco: null, carrossel: carrosselVazio(), estatico: estaticoVazio(), stories: storiesVazio(),
});

// ---------- ideia ----------

// calculado pra tela (server.mjs, ideiaParaTela): se o front mandar de volta, não entra no banco
export const CALCULADOS_IDEIA = ['temaNome'];

// tipo, tema (id do guia ou rótulo que a ideia já tinha), estilo do gancho, roteiro base, fontes e
// notas (agenda e cuidados: o que fica pra outra peça, quando publicar).
// item: a ideia que está sendo editada (roteiroBase parcial completa com o que ela já tem)
export function limparIdeia(b, item = null) {
  const c = semCampos(b, CALCULADOS_IDEIA);
  if ('tipo' in c) c.tipo = conferirTipo(c.tipo);
  if ('tema' in c) c.tema = conferirTema(c.tema, item?.tema ?? null);
  if ('estiloGancho' in c) c.estiloGancho = textoCurto(c.estiloGancho, 'estiloGancho', 600);
  if ('notas' in c) c.notas = textoCurto(c.notas, 'notas', 2000);
  if ('roteiroBase' in c) c.roteiroBase = limparRoteiroBase(c.roteiroBase, item?.roteiroBase);
  if ('fontes' in c) c.fontes = limparFontes(c.fontes);
  return c;
}

export const ideiaPadrao = () => ({
  titulo: '', descricao: '', tipo: null, tema: null, formatoId: null, publico: 'MEI + ME', gancho: '', estiloGancho: '',
  roteiroBase: roteiroBaseVazio(), fontes: [], notas: '', origem: 'manual', referencia: null, favorita: false, reelId: null,
});

// ---------- stories do dia (28/09) ----------
// db.stories: uma ideia de stories por data, fora das peças do feed (não conta em KPI nenhum). Nasce do
// aplicar-stories.mjs (JSON de conteúdo) e se edita no painel (PUT /api/stories/:id). A mesma validação
// nos dois. Texto acima do limite é recusado, nunca cortado calado; travessão e meia-risca viram vírgula
// (entre números, hífen), como nos outros campos
export const STATUS_STORIES = ['ideia', 'pronto', 'publicado'];
export const OBJETIVOS_STORIES = ['engajamento', 'vendas'];
// 21/10 (Pedro): o story é sempre "Story · Tema". O dia pode nascer só com o tema (os quadros vêm depois), e o pilar
// pode faltar quando o calendário não dá número ("Mecânica recorrente", "momentâneo"): fica o texto em pilarTexto
export const LIM_STORIES = {
  quadrosMin: 0, quadrosMax: 6, texto: 500, visual: 500, interacao: 200, tema: 300, cta: 300, notas: 2000, fonte: 1000, fontes: 40,
  pilarTexto: 200, motivo: 1000,
};
// os campos do dia, na ordem em que ficam no banco (id, status e datas são do servidor)
// 21/10 (Pedro): mais os campos da estratégia (CAMPOS_ESTRATEGIA). origem, calendario e versoesAnteriores (o gerador
// da semana) são do servidor e não passam por aqui
export const CAMPOS_STORIES = [
  'data', 'objetivo', 'pilar', 'bloco', 'tema', 'pecaDoDia', 'quadros', 'cta', 'fontes', 'notas', 'pilarTexto', 'motivo',
  ...CAMPOS_ESTRATEGIA,
];

function textoStories(v, rotulo, lim, obrigatorio = false) {
  if (v == null) v = '';
  if (typeof v === 'number') v = String(v);
  if (typeof v !== 'string') throw falha(400, `${rotulo} precisa ser texto.`);
  const t = semTracos(v).trim();
  if (t.length > lim) throw falha(400, `${rotulo} passa de ${lim} caracteres (tem ${t.length}).`);
  if (obrigatorio && !t) throw falha(400, `${rotulo} não pode ficar vazio.`);
  return t;
}

function quadrosDoDia(v) {
  const { quadrosMin: min, quadrosMax: max } = LIM_STORIES;
  if (!Array.isArray(v)) throw falha(400, 'quadros precisa ser uma lista.');
  if (v.length > 20) throw falha(400, `Os stories do dia têm de ${min} a ${max} quadros (vieram ${v.length}).`);
  const qs = v.map((x, i) => {
    if (!x || typeof x !== 'object' || Array.isArray(x)) throw falha(400, `O quadro ${i + 1} precisa ser um objeto {texto, visual, interacao}.`);
    return {
      texto: textoStories(x.texto, `O texto do quadro ${i + 1}`, LIM_STORIES.texto),
      visual: textoStories(x.visual, `O visual do quadro ${i + 1}`, LIM_STORIES.visual),
      interacao: textoStories(x.interacao, `A interação do quadro ${i + 1}`, LIM_STORIES.interacao),
    };
  }).filter((q) => q.texto || q.visual || q.interacao);
  if (qs.length < min || qs.length > max) throw falha(400, `Os stories do dia têm de ${min} a ${max} quadros (com texto: ${qs.length}).`);
  return qs;
}

// uma fonte por item (ou por linha, vindo da tela); marcador de lista no começo sai
function fontesDoDia(v) {
  if (v == null || v === '') return [];
  const itens = typeof v === 'string' ? v.split(/\r?\n/) : v;
  if (!Array.isArray(itens)) throw falha(400, 'fontes precisa ser uma lista de textos.');
  const fs = itens.map((x, i) => textoStories(x, `A fonte ${i + 1}`, LIM_STORIES.fonte).replace(/^[-*•]\s+/, '').trim()).filter(Boolean);
  if (fs.length > LIM_STORIES.fontes) throw falha(400, `As fontes aceitam no máximo ${LIM_STORIES.fontes} itens.`);
  return fs;
}

// b: o que chegou (JSON de conteúdo ou tela). atual: o dia que já existe; na edição o que não veio fica
// como está e pilar novo sem bloco junto leva o bloco do pilar (como na peça). Devolve o dia inteiro limpo,
// sem id, status e datas. db confere pilar e peça do dia.
// 02/10: videos (vídeo final do dia, db.mjs limparVideos) não é campo de CAMPOS_STORIES: só sai no resultado
// quando veio em b. Assim o aplicar-stories (que monta o dia só com CAMPOS_STORIES) nunca apaga nem compara o
// vídeo, e a tela, que não manda o campo, também não
export function conferirStoriesDia(db, b, atual = null) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw falha(400, 'Cada dia de stories precisa ser um objeto.');
  const veio = (k) => Object.hasOwn(b, k);
  const v = Object.fromEntries(CAMPOS_STORIES.map((k) => [k, veio(k) ? b[k] : atual?.[k]]));
  if (!dataValida(v.data)) throw falha(400, 'data precisa ser um dia que existe, no formato AAAA-MM-DD.');
  if (!OBJETIVOS_STORIES.includes(v.objetivo)) throw falha(400, `objetivo precisa ser ${OBJETIVOS_STORIES.join(' ou ')}.`);
  // pilar vazio vale quando o calendário diz o pilar em texto (pilarTexto) ou dá o bloco
  const semPilar = v.pilar === '' || v.pilar == null;
  const pilar = semPilar || typeof v.pilar === 'boolean' ? NaN : Number(v.pilar);
  const temTextoDoPilar = typeof v.pilarTexto === 'string' && v.pilarTexto.trim();
  if (!(semPilar && (temTextoDoPilar || v.bloco)) && (!Number.isInteger(pilar) || pilar < 1)) throw falha(400, 'pilar precisa ser o número de um pilar editorial.');
  const doBanco = db && !semPilar ? (db.pilares ?? []).find((p) => p.id === pilar) : null;
  if (db && !semPilar && !doBanco) throw falha(400, `O pilar ${pilar} não existe.`);
  const blocoVeio = veio('bloco') ? b.bloco : atual && veio('pilar') ? null : v.bloco;
  const bloco = conferirBloco(blocoVeio) ?? (semPilar ? null : blocoDoPilar(pilar)) ?? conferirBloco(doBanco?.bloco ?? null);
  if (!bloco && !temTextoDoPilar) throw falha(400, `bloco precisa ser ${BLOCOS.join(', ')}.`);
  // peça do dia: só uma peça que existe. A que já estava e sumiu (apagada) solta sem erro
  let peca = v.pecaDoDia === '' || v.pecaDoDia == null ? null : v.pecaDoDia;
  const existe = (id) => typeof id === 'string' && (!db || db.reels.some((r) => r.id === id));
  if (peca != null && !existe(peca)) {
    if (veio('pecaDoDia')) throw falha(400, 'Essa peça do dia não existe no cronograma.');
    peca = null;
  }
  return {
    data: v.data,
    objetivo: v.objetivo,
    pilar: semPilar ? null : pilar,
    bloco: bloco ?? null,
    tema: textoStories(v.tema, 'O tema', LIM_STORIES.tema, true),
    pecaDoDia: peca,
    quadros: quadrosDoDia(v.quadros ?? []),
    cta: textoStories(v.cta, 'A CTA', LIM_STORIES.cta),
    fontes: fontesDoDia(v.fontes),
    notas: textoStories(v.notas, 'As notas', LIM_STORIES.notas),
    pilarTexto: textoStories(v.pilarTexto, 'O pilar no calendário', LIM_STORIES.pilarTexto),
    motivo: textoStories(v.motivo, 'O motivo', LIM_STORIES.motivo),
    ...conferirCamposEstrategia(Object.fromEntries(CAMPOS_ESTRATEGIA.map((k) => [k, v[k] ?? null]))),
    ...(veio('videos') ? { videos: limparVideos(b.videos) } : {}),
  };
}

export function conferirStatusStories(s) {
  if (!STATUS_STORIES.includes(s)) throw falha(400, `status precisa ser ${STATUS_STORIES.join(', ')}.`);
  return s;
}
