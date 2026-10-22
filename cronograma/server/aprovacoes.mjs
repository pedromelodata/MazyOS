// Aprovações técnicas (21/10/2026, Pedro). Toda peça de feed (reel, carrossel ou estático) passa pelo Diretor
// contábil antes de ir ao ar, de preferência com um dia de antecedência:
//  1. o time manda pra aprovação com uma explicação técnica curta (por que o post existe, a base dele na
//     contabilidade e o objetivo prático). A IA escreve um rascunho dela a partir da peça e do FATOS.md
//  2. a peça aparece na aba Aprovações técnicas. O Diretor contábil vê o roteiro inteiro, a legenda, as fontes e o
//     vídeo final, e aprova ou ajusta: ajustar é escrever o que mudar (conversa) e, se quiser, editar o texto da
//     peça ali mesmo. Salvo o ajuste, a peça sai da aba e volta pro cronograma com a bandeira amarela
//     ("Ajustada" quando ele mudou o texto, "Sugestão de ajuste" quando só escreveu)
//  3. o time ajusta e manda de novo. Aprovada, a peça fica pronta e o "Marcar como postado" libera
//  4. texto mexido depois de aprovado volta pra "Mudou depois de aprovada": precisa mandar de novo
// Stories do dia ficam fora (são do dia a dia). Peça postada não entra. (22/10: os stories do dia agora podem ir, ver abaixo)
// 21/10 (Pedro): arquivos subidos direto na aba (envios.mjs, db.envios) passam pelas mesmas rotas. No envio: mandar
// pede pelo menos 1 arquivo e, sem explicação, a base vira a explicação; ajustar é só a mensagem (sugestão, sem
// edição); a explicação pela IA não existe (a base já é ela). GET /api/aprovacoes leva também "envios": os do time
// que não estão com o Diretor nem aprovados (rascunho, ajuste, alterado). Pro Diretor contábil, vazio
// 21/10 (Pedro): aprovação em 2 etapas pra toda peça de feed e todo envio de arquivos. Primeiro os gerentes (as contas
// Gerente de Marketing: cada um aprova separado e todos precisam aprovar), depois o Diretor contábil (a aprovação de UM
// diretor fecha). Mandar (enviar, ou enviarPeloSistema pro gerador da semana) sempre recomeça nos gerentes; sem nenhum
// gerente cadastrado, já cai no diretor. Ajustar: o gerente na etapa dele ou o diretor na dele (estado 'ajuste', e a
// próxima ida recomeça nos gerentes). Depois de aprovada, só o Diretor contábil com ajustaDepoisDeAprovada ajusta (o outro
// diretor não; a permissão numa conta que mudou de perfil também não, auth.ajustaAprovada). Papel ou etapa errados = 409; quem não é gerente nem diretor = 403 (o servidor já barrou no auth.podeApi, e
// aprovar e ajustar conferem de novo aqui dentro). O Diretor contábil só vê o que está na etapa dele e o que foi
// decidido nela (auth.diretorVe): na lista, no GET de um item e na conversa.
// Decisões fora do contrato: texto da peça mexido no meio da aprovação (PUT do time) volta pros gerentes, com as
// aprovações deles zeradas (o que eles aprovaram não é mais o texto que está ali); peça já postada não recebe ajuste
// (ficaria presa na bandeira amarela, sem poder mandar de novo); a conversa da aprovação de um gerente leva etapa:
// 'gerentes' e a do diretor etapa: 'diretor'; a do sistema leva papel 'sistema'.
// Estado na própria peça (db.reels[].aprovacao, campo do servidor: o PUT da peça não mexe nele):
//   { estado: pendente | aprovado | ajuste | alterado, etapa: gerentes | diretor (onde está ou onde foi decidida),
//     gerentes: { aprovaram: [{ id, nome, em }] }, tipoAjuste: editado | sugestao | null, explicacao, rodada,
//     enviadoEm, enviadoPor, enviadoPorId, decididoEm, decididoPor, decididoPorId,
//     conversa: [{ id, em, tipo: envio | aprovado | ajuste | mensagem | alterado, autor, autorId, papel, texto, mudou, etapa }] }
// 22/10 (Pedro): "Libere também pedir autorização de Stories a serem feitos". Os stories do dia (db.stories, id sto_...)
// PODEM ir pra aprovação pelas mesmas rotas e com as mesmas 2 etapas; é opcional (marcar os stories como postados
// continua sem pedir aprovação). Estado em db.stories[].aprovacao, no mesmo formato da peça e também campo do servidor
// (o PUT dos stories não grava aprovacao vinda da tela). Mandar pede tema; dia já postado = 409. Ajustar edita só o
// texto de cada quadro e a CTA (o visual e a interação ficam). Tema, quadros, CTA ou fontes mexidos depois de aprovado
// viram 'alterado' (pendente volta pros gerentes), como na peça. Na tela, os stories vão com stories: true, peca
// 'stories' e ideia "Story · <tema>" (storiesParaTela).
// Decisões fora do contrato: o vídeo final dos stories (videos) não entra no que a aprovação cobre (o contrato fala só
// de tema, quadros, CTA e fontes); stories pendentes que vão ao ar (a agenda marca o dia como postado) seguem na lista
// até alguém decidir, como a peça de data passada; a peça antiga do feed com peca 'stories' (db.reels) continua fora.
// 22/10 (Pedro): as decisões são exatamente três, nas duas etapas (gerentes e Diretor contábil) e nos três tipos (peça
// de feed, stories do dia e envio de arquivos):
//  1. "Aprovado": POST .../aprovar sem observação, como antes ({ mensagem } segue opcional pra quem já chamava assim)
//  2. "Aprovado com observação": POST .../aprovar com { observacao } (até 2000 caracteres; com comObservacao: true, vazia
//     dá 400). Na etapa dos gerentes conta como a aprovação daquele gerente (a entrada dele em gerentes.aprovaram leva
//     comObservacao: true); na do diretor fecha como aprovado, com aprovacao.comObservacao: true. A observação fica em
//     aprovacao.observacoes [{ id, autor, autorId, papel, etapa, texto, em, rodada }] e na conversa (tipo 'aprovado',
//     comObservacao: true, texto = a observação)
//  3. "Reprovado": POST .../ajustar, o ajuste de antes (estado 'ajuste', volta pro time, a próxima ida recomeça nos
//     gerentes), agora sempre com a mensagem escrita ("Escreva o que ajustar."). A edição do texto pelo próprio aprovador
//     (conteudo) segue como opção dentro do Reprovado. Quem tem ajustaDepoisDeAprovada reprova o que já foi aprovado
// Decisões fora do contrato: aprovacao.comObservacao fala da decisão que fechou (mandar de novo e reprovar voltam pra
// false); as observações ficam de rodada em rodada (histórico, com a rodada de cada uma; até 100); o que já foi postado
// (peça ou stories) não é reprovado nem no pendente, porque ficaria preso na bandeira amarela sem poder mandar de novo
// (nos stories é o caminho normal: marcar como postado não pede aprovação e a agenda marca sozinha); o Reprovado com
// edição não tira quadro dos stories (texto vazio num quadro sem visual nem interação = 400).
// 22/10 (Pedro): "Dê opção no sistema de mandar vários para a aprovação, o post juntamente com os story".
// POST /api/aprovacoes/lote { itens: [{ id, explicacao }] }: de 1 a 30 itens (peças de feed, stories do dia e envios de
// arquivos, misturados), sem id repetido. Cada um passa pelo mesmo miolo do enviar de um item (mandar: as mesmas regras,
// sem atalho nenhum); um que falha não derruba os outros. A resposta é 200 com { resultados: [{ id, ok, erro?, status?,
// item? }] } na ordem pedida e { lote } (o que ficou marcado, ou null). Só o time manda: o Diretor contábil já para no
// auth.podeApi e aqui dentro de novo (403). Os que foram juntos ficam marcados: aprovacao.lote = { id, em, por, itens:
// [ids] } em cada um, pra aba Aprovações mostrar "Mandado junto com ..." e agrupar. Decidir um item (aprovar, reprovar,
// conversar) não mexe nos outros do lote.
// Decisões fora do contrato: o lote só marca quando 2 ou mais foram (o que acabou indo sozinho, porque os outros
// falharam, fica sem lote) e itens leva só os que foram; mandar de novo (enviar, lote ou o gerador da semana) tira o lote
// da rodada anterior, e o outro item do lote antigo continua com o dele (a tela agrupa pelo lote.id); lista malformada
// (sem itens, item sem id), mais de 30 e id repetido derrubam o pedido inteiro com 400, antes de mandar qualquer um; o
// resultado com erro leva também o status (400, 404 ou 409) que o enviar de um item daria; o banco é gravado uma vez no
// fim (nada gravado quando nenhum foi).
import { query } from '@anthropic-ai/claude-agent-sdk';
import { carregar, salvar, falha, agora, novoId, limparFontes } from './db.mjs';
import { conferirReel, conferirStoriesDia } from './validar.mjs';
import { regravarSeGerado } from './reelmd.mjs';
import { blocoBaseContabil } from './base-contabil.mjs';
import { ehErroLogin } from './analise.mjs';
import { iaConfigurada, MSG_SEM_IA } from './noticias.mjs';
import { RAIZ } from './importar.mjs';
import * as auth from './auth.mjs';
import * as envios from './envios.mjs';

const PECAS_FEED = ['reel', 'carrossel', 'estatico'];
// 22/10 (Pedro): observacao é o texto do "Aprovado com observação"; observacoes, quantas ficam guardadas por item
const LIM = { explicacao: 3000, mensagem: 2000, observacao: 2000, conversa: 300, observacoes: 100 };
// 22/10 (Pedro): quantos itens vão num lote e o tamanho do corpo dele (30 explicações de 3000 caracteres cabem com folga)
const LOTE = { max: 30, corpo: 600_000 };
const RECENTES_DIAS = 30;
const ESTADOS_DECIDIDOS = ['aprovado', 'ajuste', 'alterado'];
const TIMEOUT_IA = 120_000;

const tem = (v) => Boolean(String(v ?? '').trim());
const pecaDe = (r) => (PECAS_FEED.includes(r?.peca) || r?.peca === 'stories' ? r.peca : 'reel');
export const precisaAprovacao = (r) => PECAS_FEED.includes(pecaDe(r));
const hojeBrasilia = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
// "Marcar como postado" pede aprovação na peça de feed de hoje em diante; a de antes de 21/10 (ou já passada) não
export const travaPostado = (r) => precisaAprovacao(r) && r.status !== 'publicado' && (!r.data || r.data >= hojeBrasilia())
  && r.aprovacao?.estado !== 'aprovado';

function texto(v, nome, max, obrigatorio = false) {
  const s = String(v ?? '').replace(/\r\n/g, '\n').trim();
  if (obrigatorio && !s) throw falha(400, `${nome} não pode ficar ${nome.startsWith('A ') ? 'vazia' : 'vazio'}.`);
  if (s.length > max) throw falha(400, `${nome} passou de ${max} caracteres.`);
  return s;
}

// u.sistema: quem manda é o próprio servidor (gerador da semana), sem conta logada
const quem = (u) => ({ autor: u.nome, autorId: u.id ?? null, papel: u.sistema ? 'sistema' : auth.papelDe(u) });
function registrar(r, tipo, u, txt = '', extra = {}) {
  r.aprovacao.conversa ??= [];
  r.aprovacao.conversa.push({ id: novoId('apv'), em: agora(), tipo, ...quem(u), texto: txt, ...extra });
  if (r.aprovacao.conversa.length > LIM.conversa) r.aprovacao.conversa.splice(0, r.aprovacao.conversa.length - LIM.conversa);
}
// 22/10 (Pedro): a observação do "Aprovado com observação", guardada à parte pro painel mostrar com destaque
function anotarObservacao(r, u, etapa, txt) {
  const lista = Array.isArray(r.aprovacao.observacoes) ? r.aprovacao.observacoes : [];
  lista.push({ id: novoId('obs'), ...quem(u), etapa, texto: txt, em: agora(), rodada: r.aprovacao.rodada ?? 1 });
  if (lista.length > LIM.observacoes) lista.splice(0, lista.length - LIM.observacoes);
  r.aprovacao.observacoes = lista;
}

// a peça como a aba mostra: o texto inteiro e o que o diretor precisa pra decidir (sem métricas, sem gravação)
// 21/10 (Pedro): a peça vai pra aprovação do jeito que está, com o roteiro, o pilar, o bloco e o motivo (a defesa do
// calendário da estratégia principal)
function paraTela(db, r) {
  const f = (db.formatos ?? []).find((x) => x.id === r.formatoId);
  const pl = (db.pilares ?? []).find((x) => x.id === Number(r.pilar));
  return {
    id: r.id, ideia: r.ideia, data: r.data, peca: pecaDe(r), tipo: r.tipo ?? null, tema: r.tema ?? '', bloco: r.bloco ?? pl?.bloco ?? null,
    pilar: pl ? { id: pl.id, nome: pl.nome } : null, pilarTexto: r.pilarTexto ?? '', motivo: r.motivo ?? '', formatoTexto: r.formatoTexto ?? '',
    formato: f ? { nome: f.nome, codigo: f.codigo } : null,
    status: r.status, roteiro: r.roteiro ?? {}, carrossel: r.carrossel ?? {}, estatico: r.estatico ?? {}, legenda: r.legenda ?? '',
    fontes: r.fontes ?? [], videos: r.videos ?? [], artes: artesParaTela(r.artes), aprovacao: r.aprovacao ?? null,
  };
}
// 22/10 (Pedro): a arte do estúdio de design anexada na peça ou nos stories (estudio.mjs grava em artes): o que a tela
// precisa pra mostrar e abrir o arquivo. O Diretor contábil abre só a da peça que ele vê (o estudio.mjs confere)
const ID_EXPORTACAO = /^exp_[A-Za-z0-9_-]{1,64}$/;
const artesParaTela = (artes) => (Array.isArray(artes) ? artes : [])
  .filter((a) => a && typeof a === 'object' && ID_EXPORTACAO.test(String(a.id ?? '')))
  .map((a) => ({ id: a.id, docId: a.docId ?? null, pagina: a.pagina ?? null, formato: a.formato ?? null, em: a.em ?? null, por: a.por ?? null }));

// 21/10: a aprovação como a tela vê: a etapa de agora (pendente antigo, sem etapa, está com o diretor; etapa dos
// gerentes sem ninguém faltando também) e a lista de quem já aprovou na etapa dos gerentes sempre presente.
// 21/10 (Pedro): também nas peças do /api/estado (server.mjs), pro Início, o cronograma e o painel da peça mostrarem a
// mesma etapa da aba. Na peça pendente, "aprovaram" leva só quem é gerente agora: aprovação de quem saiu ou mudou de
// perfil não conta no "(1 de 2)" nem no "já aprovou" (a conversa guarda o histórico)
export function aprovacaoParaTela(ap, gerentes = auth.gerentesAtivos()) {
  if (!ap || typeof ap !== 'object') return null;
  const pendente = ap.estado === 'pendente';
  const etapa = pendente ? auth.etapaDaAprovacao(ap, gerentes) : ap.etapa ?? 'diretor';
  const aprovaram = auth.aprovaramGerentes(ap).filter((x) => !pendente || gerentes.some((g) => g.id === x.id));
  return { ...ap, etapa, gerentes: { aprovaram } };
}

// 22/10 (Pedro): os stories do dia (db.stories) pelo id; todo dia de stories nasce com novoId('sto')
const ID_STORIES = /^sto_[A-Za-z0-9_-]+$/;
export const ehStories = (id) => ID_STORIES.test(String(id ?? ''));
// o tipo do item da aprovação: a peça do feed (db.reels), o envio de arquivos (db.envios) ou os stories do dia (db.stories)
const tipoDe = (id) => (envios.ehEnvio(id) ? 'envio' : ehStories(id) ? 'stories' : 'peca');
// 22/10: as falas de cada tipo (as da peça e do envio são as de antes)
const FALAS = {
  peca: {
    naoExiste: 'Essa peça não existe mais.', jaEsperando: 'Essa peça já está esperando a aprovação.', naoEspera: 'Essa peça não está esperando aprovação.',
    naoMandado: 'Essa peça ainda não foi mandada pra aprovação.', passouGerentes: 'Essa peça já passou pelos gerentes', aprovado: 'Essa peça já foi aprovada',
    mexe: 'nela', postado: 'Essa peça já foi postada.',
  },
  envio: {
    naoExiste: 'Esse envio não existe mais.', jaEsperando: 'Esse envio já está esperando a aprovação.', naoEspera: 'Esse envio não está esperando aprovação.',
    naoMandado: 'Esse envio ainda não foi mandado pra aprovação.', passouGerentes: 'Esse envio já passou pelos gerentes', aprovado: 'Esse envio já foi aprovado',
    mexe: 'nele',
  },
  stories: {
    naoExiste: 'Esse story não existe mais.', jaEsperando: 'Esse story já está esperando a aprovação.', naoEspera: 'Esse story não está esperando aprovação.',
    naoMandado: 'Esse story ainda não foi mandado pra aprovação.', passouGerentes: 'Esse story já passou pelos gerentes', aprovado: 'Esse story já foi aprovado',
    mexe: 'nele', postado: 'Esse story já foi postado.',
  },
};

// 22/10 (Pedro): os stories do dia como a aba mostra: o planejamento (motivo, bloco, pilar), os quadros (texto, visual,
// interação), a CTA e as fontes. O título é sempre "Story · <tema>"
const tituloStories = (s) => (tem(s?.tema) ? `Story · ${String(s.tema).trim()}` : 'Story');
function storiesParaTela(db, s) {
  const pl = s.pilar == null ? null : (db.pilares ?? []).find((x) => x.id === Number(s.pilar));
  return {
    id: s.id, stories: true, peca: 'stories', ideia: tituloStories(s), tema: s.tema ?? '', data: s.data ?? '', objetivo: s.objetivo ?? null,
    bloco: s.bloco ?? pl?.bloco ?? null, pilar: pl ? { id: pl.id, nome: pl.nome } : null, pilarTexto: s.pilarTexto ?? '', motivo: s.motivo ?? '',
    quadros: Array.isArray(s.quadros) ? s.quadros : [], cta: s.cta ?? '', fontes: Array.isArray(s.fontes) ? s.fontes : [], status: s.status ?? 'ideia',
    artes: artesParaTela(s.artes), aprovacao: s.aprovacao ?? null,
  };
}

// a peça do cronograma, o envio de arquivos (envios.mjs) ou os stories do dia, cada um na forma de tela dele, com a etapa
// da aprovação e os gerentes que precisam aprovar (gerentesNecessarios, os de agora)
const ehEnvio = (r) => envios.ehEnvio(r?.id);
function tela(db, r, gerentes = auth.gerentesAtivos()) {
  const t = ehEnvio(r) ? envios.paraTela(r) : ehStories(r?.id) ? storiesParaTela(db, r) : paraTela(db, r);
  return { ...t, aprovacao: aprovacaoParaTela(r.aprovacao, gerentes), gerentesNecessarios: gerentes };
}
// a última vez que o envio mexeu (criado, editado, mandado ou decidido)
const ultimaMexida = (e) => [e.atualizadoEm, e.criadoEm, e.aprovacao?.enviadoEm, e.aprovacao?.decididoEm].map((x) => String(x ?? '')).sort().at(-1);
const ehDiretor = (u) => auth.papelDe(u) === 'diretor';

// sess: quem pediu. O Diretor contábil vê só o pendente na etapa dele e o decidido nela; os envios fora da aprovação
// (rascunho, ajuste, alterado) não vão pra ele
export async function listar(sess = null) {
  const db = await carregar();
  const gerentes = auth.gerentesAtivos();
  const diretor = ehDiretor(sess?.usuario);
  const visivel = (r) => !diretor || auth.diretorVe(r.aprovacao, gerentes);
  const limite = Date.now() - RECENTES_DIAS * 86_400_000;
  const objetos = (l) => (Array.isArray(l) ? l : []).filter((x) => x && typeof x === 'object');
  // 22/10 (Pedro): os stories do dia mandados pra aprovação entram junto, pela data deles
  const todos = [...db.reels, ...objetos(db.stories).filter((s) => ehStories(s.id)), ...objetos(db.envios)];
  // com data primeiro, pela data; sem data (envio de arquivos, peça sem dia) no fim, por ordem de chegada
  const pend = todos.filter((r) => r.aprovacao?.estado === 'pendente' && visivel(r))
    .sort((a, b) => (a.data || '9999').localeCompare(b.data || '9999')
      || (!a.data && !b.data ? String(a.aprovacao.enviadoEm ?? '').localeCompare(String(b.aprovacao.enviadoEm ?? '')) : 0));
  // 21/10 (Pedro): "Decididas" é só o que teve decisão (ou mudou depois de aprovado). A peça regerada pelo gerador da
  // semana fica com a aprovação solta (estado null): não foi decidida e segue com o "Enviar para aprovação" no painel
  const rec = todos.filter((r) => ESTADOS_DECIDIDOS.includes(r.aprovacao?.estado) && visivel(r) && Date.parse(r.aprovacao.decididoEm ?? r.aprovacao.enviadoEm ?? 0) > limite)
    .sort((a, b) => String(b.aprovacao.decididoEm ?? '').localeCompare(String(a.aprovacao.decididoEm ?? '')));
  const fora = diretor ? []
    : (db.envios ?? []).filter((e) => e && typeof e === 'object' && !['pendente', 'aprovado'].includes(e.aprovacao?.estado))
      .sort((a, b) => ultimaMexida(b).localeCompare(ultimaMexida(a)));
  return {
    pendentes: pend.map((r) => tela(db, r, gerentes)),
    recentes: rec.map((r) => tela(db, r, gerentes)),
    envios: fora.map((e) => tela(db, e, gerentes)),
  };
}

// tipo: 'peca' (db.reels), 'envio' (db.envios) ou 'stories' (db.stories, 22/10); envio fica pro que já perguntava por ele
// 22/10 (Pedro): a busca no banco já carregado, pro lote achar todos sem carregar de novo
function acharNoDb(db, id) {
  const tipo = tipoDe(id);
  const lista = tipo === 'envio' ? db.envios : tipo === 'stories' ? db.stories : db.reels;
  const r = (Array.isArray(lista) ? lista : []).find((x) => x?.id === id);
  if (!r) throw falha(404, FALAS[tipo].naoExiste);
  return { r, tipo, envio: tipo === 'envio' };
}
async function acharPeca(id) {
  const db = await carregar();
  return { db, ...acharNoDb(db, id) };
}

// o Diretor contábil só chega no que está na etapa dele ou foi decidido nela; o resto é como se não existisse (404)
function conferirVisivel(r, tipo, u, gerentes) {
  if (ehDiretor(u) && !auth.diretorVe(r.aprovacao, gerentes)) throw falha(404, FALAS[tipo].naoExiste);
}

// manda pra aprovação: sempre recomeça na etapa dos gerentes (sem gerente cadastrado, já cai no diretor)
// 22/10 (Pedro): o miolo, sem gravar, é o mandar: o enviar de um item e o lote (enviarLote) passam pelas mesmas regras.
// Tudo é conferido antes de mexer: o que dá erro não muda nada no item
function mandar(r, tipo, b, u, gerentes) {
  const envio = tipo === 'envio';
  if (envio) {
    if (r.aprovacao?.estado === 'pendente') throw falha(409, FALAS.envio.jaEsperando);
    if (!(r.arquivos ?? []).length) throw falha(400, 'Suba pelo menos um arquivo antes de mandar.');
  } else if (tipo === 'stories') {
    // 22/10 (Pedro): os stories do dia vão com o tema (o "Story · <tema>" da aba); o dia já postado não vai
    if (r.status === 'publicado') throw falha(409, FALAS.stories.postado);
    if (r.aprovacao?.estado === 'pendente') throw falha(409, FALAS.stories.jaEsperando);
    if (!tem(r.tema)) throw falha(400, 'Escreva o tema do story antes de mandar pra aprovação.');
  } else {
    // a peça antiga do feed com peca 'stories' (db.reels) segue fora: os stories vão pelos stories do dia
    if (!precisaAprovacao(r)) throw falha(400, 'Essa peça é de stories: mande pra aprovação pelos stories do dia.');
    if (r.status === 'publicado') throw falha(409, FALAS.peca.postado);
    if (r.aprovacao?.estado === 'pendente') throw falha(409, FALAS.peca.jaEsperando);
  }
  // 22/10 (achado): explicação que não é texto ({}, lista, número) era aceita como "[object Object]"
  if (b?.explicacao != null && typeof b.explicacao !== 'string') throw falha(400, 'A explicação técnica precisa ser texto.');
  // no envio de arquivos, sem explicação escrita a base vai como explicação
  const explicacao = texto(envio && !tem(b.explicacao) ? r.base : b.explicacao, 'A explicação técnica', LIM.explicacao, true);
  const rodada = (r.aprovacao?.rodada ?? 0) + 1;
  // 22/10 (Pedro): o lote da rodada anterior não vale pra esta (o enviarLote marca de novo os que vão juntos)
  const antes = { ...(r.aprovacao ?? {}) };
  delete antes.lote;
  r.aprovacao = {
    ...antes, estado: 'pendente', etapa: gerentes.length ? 'gerentes' : 'diretor', gerentes: { aprovaram: [] }, tipoAjuste: null,
    comObservacao: false, explicacao, rodada, enviadoEm: agora(), enviadoPor: u.nome, enviadoPorId: u.id ?? null, decididoEm: null, decididoPor: null, decididoPorId: null,
  };
  registrar(r, 'envio', u, rodada > 1 ? 'Mandou de novo pra aprovação' : 'Mandou pra aprovação');
}
async function enviar(id, b, u) {
  const { db, r, tipo } = await acharPeca(id);
  const gerentes = auth.gerentesAtivos();
  mandar(r, tipo, b, u, gerentes);
  await salvar();
  return tela(db, r, gerentes);
}

// 22/10 (Pedro): vários de uma vez (o post junto com o story do dia, ou o que o time marcar no Cronograma). A lista é
// conferida inteira antes (formato, de 1 a 30, sem id repetido); depois cada item vai pelo mandar, na ordem pedida, e o
// erro de um fica no resultado dele. Os que foram (2 ou mais) ganham o mesmo aprovacao.lote
async function enviarLote(b, u) {
  if (ehDiretor(u)) throw falha(403, 'O seu perfil vê só as Aprovações técnicas.');
  const lista = b && typeof b === 'object' && !Array.isArray(b) ? b.itens : null;
  if (!Array.isArray(lista)) throw falha(400, 'Mande a lista de itens pra aprovação.');
  if (!lista.length) throw falha(400, 'Escolha pelo menos um item pra mandar.');
  if (lista.length > LOTE.max) throw falha(400, `Dá pra mandar até ${LOTE.max} de uma vez (vieram ${lista.length}).`);
  const pedidos = lista.map((x, i) => {
    const id = x && typeof x === 'object' && !Array.isArray(x) && typeof x.id === 'string' ? x.id.trim() : '';
    if (!id) throw falha(400, `O item ${i + 1} da lista veio sem id.`);
    return { id, explicacao: x.explicacao };
  });
  const repetido = pedidos.find((p, i) => pedidos.findIndex((q) => q.id === p.id) !== i);
  if (repetido) throw falha(400, `O item ${repetido.id} está repetido na lista: cada um vai uma vez só.`);
  const db = await carregar();
  const gerentes = auth.gerentesAtivos();
  const feitos = pedidos.map(({ id, explicacao }) => {
    try {
      const { r, tipo } = acharNoDb(db, id);
      mandar(r, tipo, { explicacao }, u, gerentes);
      return { id, ok: true, r };
    } catch (e) {
      if (!e.status) console.error(`lote da aprovação, ${id}:`, e);
      return { id, ok: false, status: e.status ?? 500, erro: e.message };
    }
  });
  const foram = feitos.filter((x) => x.ok);
  const lote = foram.length > 1 ? { id: novoId('lot'), em: agora(), por: u.nome, itens: foram.map((x) => x.id) } : null;
  if (lote) for (const x of foram) x.r.aprovacao.lote = structuredClone(lote);
  if (foram.length) await salvar();
  return { lote, resultados: feitos.map(({ r, ...x }) => (x.ok ? { ...x, item: tela(db, r, gerentes) } : x)) };
}

// 21/10 (Pedro): o gerador da semana manda a peça (ou o envio) pra etapa dos gerentes sozinho, sem conta logada.
// Mesmas regras do enviar (peça postada, stories e o que já está pendente dão erro com status)
export async function enviarPeloSistema(id, explicacao, autorNome = 'Gerador da semana') {
  const nome = String(autorNome ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Gerador da semana';
  return enviar(id, { explicacao }, { id: null, nome, sistema: true });
}

const naoEspera = (tipo) => falha(409, FALAS[tipo].naoEspera);
const nomes = (gs) => {
  const ns = gs.map((g) => g.nome).filter(Boolean);
  return ns.length > 1 ? `${ns.slice(0, -1).join(', ')} e ${ns.at(-1)}` : ns[0] ?? '';
};
// as mensagens de etapa errada (409)
function foraDaEtapa(papel, ap, gerentes, tipo) {
  if (papel === 'gerente') return falha(409, `${FALAS[tipo].passouGerentes}: agora está com o Diretor contábil.`);
  const ja = auth.aprovaramGerentes(ap).filter((x) => gerentes.some((g) => g.id === x.id)).length;
  return falha(409, `Ainda está com os gerentes (${ja} de ${gerentes.length}): o Diretor contábil decide depois deles.`);
}
// a defesa por dentro: só gerente e diretor aprovam ou pedem ajuste (o servidor já barrou no auth.podeApi)
function papelQueDecide(u, acao) {
  const papel = auth.papelDe(u);
  if (!auth.PAPEIS_APROVACAO.includes(papel)) throw falha(403, `Só os Gerentes de Marketing e o Diretor contábil ${acao}.`);
  return papel;
}

async function aprovar(id, b, u) {
  const papel = papelQueDecide(u, 'aprovam');
  const { db, r, tipo } = await acharPeca(id);
  const gerentes = auth.gerentesAtivos();
  if (papel === 'diretor') conferirVisivel(r, tipo, u, gerentes);
  if (r.aprovacao?.estado !== 'pendente') throw naoEspera(tipo);
  const msg = texto(b?.mensagem, 'A mensagem', LIM.mensagem);
  // 22/10 (Pedro): com a observação escrita, a decisão é "Aprovado com observação" (comObservacao: true pede o texto)
  const obs = texto(b?.observacao, 'A observação', LIM.observacao, b?.comObservacao === true);
  const comObservacao = Boolean(obs);
  const etapa = auth.etapaDaAprovacao(r.aprovacao, gerentes);
  if (papel === 'gerente') {
    if (etapa !== 'gerentes') throw foraDaEtapa(papel, r.aprovacao, gerentes, tipo);
    const aprovaram = auth.aprovaramGerentes(r.aprovacao);
    if (aprovaram.some((x) => x.id === u.id)) {
      const faltam = auth.faltamGerentes(r.aprovacao, gerentes);
      throw falha(409, `Você já aprovou.${faltam.length ? ` Falta ${nomes(faltam)}.` : ''}`);
    }
    // 22/10 (Pedro): o "Aprovado com observação" do gerente conta como a aprovação dele
    aprovaram.push({ id: u.id, nome: u.nome, em: agora(), ...(comObservacao ? { comObservacao: true } : {}) });
    r.aprovacao.gerentes = { aprovaram };
    const faltam = auth.faltamGerentes(r.aprovacao, gerentes);
    // todos os gerentes aprovaram: segue pro Diretor contábil
    r.aprovacao.etapa = faltam.length ? 'gerentes' : 'diretor';
    if (comObservacao) anotarObservacao(r, u, 'gerentes', obs);
    registrar(r, 'aprovado', u, obs || msg || (faltam.length ? `Aprovou. Falta ${nomes(faltam)}` : 'Aprovou. Segue pro Diretor contábil'), { etapa: 'gerentes', comObservacao });
    await salvar();
    return tela(db, r, gerentes);
  }
  // diretor: a aprovação de um diretor fecha (22/10: com observação, fecha como aprovado também)
  if (etapa !== 'diretor') throw foraDaEtapa(papel, r.aprovacao, gerentes, tipo);
  Object.assign(r.aprovacao, { estado: 'aprovado', etapa: 'diretor', tipoAjuste: null, comObservacao, decididoEm: agora(), decididoPor: u.nome, decididoPorId: u.id });
  if (comObservacao) anotarObservacao(r, u, 'diretor', obs);
  registrar(r, 'aprovado', u, obs || msg || 'Aprovou', { etapa: 'diretor', comObservacao });
  await salvar();
  return tela(db, r, gerentes);
}

// edição do diretor: só o texto (falas do roteiro, slides, arte e legenda); tempo, cena e tela ficam
function conteudoEditado(r, c) {
  const b = {};
  if (c?.roteiro && typeof c.roteiro === 'object') {
    const ro = structuredClone(r.roteiro ?? {});
    const cr = c.roteiro;
    if (Array.isArray(cr.cenas) && Array.isArray(ro.cenas) && ro.cenas.length) {
      cr.cenas.forEach((x, i) => { if (ro.cenas[i] && typeof x?.fala === 'string') ro.cenas[i].fala = x.fala; });
      // o hook e a CTA acompanham a primeira e a última fala; o desenvolvimento, as do meio
      const ultimaEhCta = tem(ro.cta) && ro.cenas.length > 1;
      ro.hook = ro.cenas[0].fala;
      if (ultimaEhCta) ro.cta = ro.cenas.at(-1).fala;
      ro.desenvolvimento = ro.cenas.slice(1, ultimaEhCta ? -1 : undefined).map((x) => x.fala).filter(tem).join('\n\n');
    } else {
      for (const k of ['hook', 'desenvolvimento', 'cta']) if (typeof cr[k] === 'string') ro[k] = cr[k];
    }
    b.roteiro = ro;
  }
  if (c?.carrossel && typeof c.carrossel === 'object') {
    const ca = structuredClone(r.carrossel ?? {});
    const slide = (alvo, x) => { if (alvo && x) for (const k of ['titulo', 'texto']) if (typeof x[k] === 'string') alvo[k] = x[k]; };
    slide(ca.capa, c.carrossel.capa);
    (c.carrossel.slides ?? []).forEach((x, i) => slide(ca.slides?.[i], x));
    slide(ca.final, c.carrossel.final);
    b.carrossel = ca;
  }
  if (c?.estatico && typeof c.estatico === 'object') {
    const es = structuredClone(r.estatico ?? {});
    for (const k of ['headline', 'apoio', 'cta']) if (typeof c.estatico[k] === 'string') es[k] = c.estatico[k];
    b.estatico = es;
  }
  if (typeof c?.legenda === 'string') b.legenda = c.legenda;
  return b;
}
// o texto da peça, o que a edição do diretor (ajustar) mexe
const NOMES_CAMPO = { roteiro: 'roteiro', carrossel: 'slides', estatico: 'arte', legenda: 'legenda' };
// 21/10 (Pedro): o que a aprovação cobre, além do texto: o tipo de peça (o estático que ninguém revisou não vai ao ar
// como o reel aprovado), o vídeo final (o arquivo que vai ao ar) e as fontes. Mudou um destes, conferirMudancaAprovada
const NOMES_APROVADO = { ...NOMES_CAMPO, peca: 'tipo de peça', peca2: 'segundo tipo de peça', videos: 'vídeo final', fontes: 'fontes' };
const tentar = (fn, v) => {
  try {
    return fn(v);
  } catch {
    return v;
  }
};
// cada campo comparado na forma limpa: a mesma peça mandada de volta pela tela (fonte com espaço, vídeo com outro
// rótulo, peça antiga sem tipo gravado) não conta como mudança
const valorAprovado = {
  peca: (r) => pecaDe(r),
  peca2: (r) => r.peca2 || null,
  videos: (r) => (Array.isArray(r.videos) ? r.videos : []).map((v) => String(v?.arquivo ?? '')).sort(),
  fontes: (r) => tentar(limparFontes, Array.isArray(r.fontes) ? r.fontes : []),
};
const valorDe = (r, k) => (valorAprovado[k] ? valorAprovado[k](r ?? {}) : r?.[k] ?? null);
// 22/10 (Pedro): nos stories do dia, a aprovação cobre o tema, os quadros, a CTA e as fontes. A edição do ajuste mexe só
// no texto dos quadros e na CTA (NOMES_CAMPO_STORIES)
const NOMES_CAMPO_STORIES = { quadros: 'quadros', cta: 'CTA' };
const NOMES_APROVADO_STORIES = { tema: 'tema', ...NOMES_CAMPO_STORIES, fontes: 'fontes' };
const SO_TEXTO_STORIES = new Set(['tema', ...Object.keys(NOMES_CAMPO_STORIES)]);
const valorStories = (s, k) => {
  const v = s?.[k];
  if (k === 'quadros' || k === 'fontes') return Array.isArray(v) ? v : [];
  return String(v ?? '').trim();
};
// a foto do que a aprovação cobre, tirada antes de gravar uma edição (PUT, chat, "Outra ideia"; 22/10: o PUT dos stories)
export const fotoDaAprovacao = (r) => structuredClone(Object.fromEntries(Object.keys(ehStories(r?.id) ? NOMES_APROVADO_STORIES : NOMES_APROVADO)
  .map((k) => [k, r?.[k] ?? null])));
// 22/10 (achado da revisão): a comparação é pelo conteúdo, com as chaves em ordem: a cena montada pelo formulário
// ({tempo, fala, cena, tela}) e a do chat ({tempo, cena, fala, tela}) com o mesmo texto não contam como texto mexido
const canonico = (v) => JSON.stringify(v, (_, x) => (x && typeof x === 'object' && !Array.isArray(x)
  ? Object.fromEntries(Object.keys(x).sort().map((c) => [c, x[c]])) : x));
// as chaves que mudaram entre a foto (ou a peça de antes) e a peça de agora (ou os stories do dia, pelo id)
export const mudancasAprovadas = (antes, r) => (ehStories(r?.id)
  ? Object.keys(NOMES_APROVADO_STORIES).filter((k) => canonico(valorStories(r, k)) !== canonico(valorStories(antes, k)))
  : Object.keys(NOMES_APROVADO).filter((k) => canonico(valorDe(r, k)) !== canonico(valorDe(antes, k))));
const SO_TEXTO = new Set(Object.keys(NOMES_CAMPO));

// 22/10 (Pedro): a edição do ajuste nos stories do dia: só o texto de cada quadro (pela posição) e a CTA; o visual, a
// interação e o resto ficam. Passa pela mesma validação do PUT (conferirStoriesDia: limite, travessão vira vírgula)
// 22/10 (achado): o texto vazio num quadro sem visual nem interação fazia o conferirStoriesDia tirar o quadro (e os
// seguintes andavam uma posição). O ajuste mexe só no texto: tirar quadro dá 400, com o número do quadro
const MSG_QUADRO_VAZIO = (n) => `O texto do quadro ${n} não pode ficar vazio: ele não tem visual nem interação, e o ajuste não tira quadro.`;
function storiesEditados(db, s, c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return {};
  const b = {};
  if (Array.isArray(c.quadros)) {
    const qs = structuredClone(Array.isArray(s.quadros) ? s.quadros : []);
    c.quadros.forEach((x, i) => {
      if (!qs[i] || typeof x?.texto !== 'string') return;
      if (!tem(x.texto) && !tem(qs[i].visual) && !tem(qs[i].interacao)) throw falha(400, MSG_QUADRO_VAZIO(i + 1));
      qs[i].texto = x.texto;
    });
    b.quadros = qs;
  }
  if (typeof c.cta === 'string') b.cta = c.cta;
  if (!Object.keys(b).length) return {};
  const limpo = conferirStoriesDia(db, b, s);
  // a rede de segurança: o que a limpeza tirou (texto que virou vazio depois de limpo, por exemplo) também é 400
  if (b.quadros && limpo.quadros.length !== b.quadros.length) {
    const i = b.quadros.findIndex((q) => ![q?.texto, q?.visual, q?.interacao].some(tem));
    throw falha(400, MSG_QUADRO_VAZIO(i >= 0 ? i + 1 : limpo.quadros.length + 1));
  }
  return Object.fromEntries(Object.keys(b).map((k) => [k, limpo[k]]));
}

// o gerente ajusta na etapa dele, o diretor na dele; depois de aprovada, só o Diretor contábil com ajustaDepoisDeAprovada
// 22/10 (Pedro): o ajustar é o "Reprovado": a mensagem escrita é obrigatória (o chat pede o ajuste por texto) e a edição
// do texto pelo próprio aprovador (conteudo) segue como opção dentro dele
async function ajustar(id, b, u) {
  const papel = papelQueDecide(u, 'reprovam');
  const { db, r, tipo, envio } = await acharPeca(id);
  const gerentes = auth.gerentesAtivos();
  if (papel === 'diretor') conferirVisivel(r, tipo, u, gerentes);
  const ap = r.aprovacao;
  let etapa;
  if (ap?.estado === 'aprovado') {
    // 21/10 (Pedro): a permissão da conta só vale com o perfil Diretor contábil (auth.ajustaAprovada)
    if (!auth.ajustaAprovada(u)) {
      throw falha(409, `${FALAS[tipo].aprovado}. Depois da aprovação, só o Diretor com a permissão de reprovar o aprovado mexe ${FALAS[tipo].mexe}.`);
    }
    etapa = 'diretor';
  } else {
    if (ap?.estado !== 'pendente') throw naoEspera(tipo);
    etapa = auth.etapaDaAprovacao(ap, gerentes);
    if ((papel === 'gerente') !== (etapa === 'gerentes')) throw foraDaEtapa(papel, ap, gerentes, tipo);
  }
  // 22/10 (achado): o que já foi postado não é reprovado, nem aprovado nem pendente: ficaria preso na bandeira amarela
  // (mandar de novo dá 409). Nos stories pendentes é o caminho normal (a agenda marca o dia como postado). Aprovar segue livre
  if (!envio && r.status === 'publicado') throw falha(409, FALAS[tipo].postado);
  const msg = texto(b?.mensagem, 'O ajuste', LIM.mensagem);
  if (!msg) throw falha(400, 'Escreva o que ajustar.');
  const decisao = { estado: 'ajuste', etapa, comObservacao: false, decididoEm: agora(), decididoPor: u.nome, decididoPorId: u.id };
  // envio de arquivos: o ajuste é só a mensagem (sugestão); ninguém edita arquivo por aqui
  if (envio) {
    Object.assign(r.aprovacao, { ...decisao, tipoAjuste: 'sugestao' });
    registrar(r, 'ajuste', u, msg, { mudou: [], etapa });
    await salvar();
    return tela(db, r, gerentes);
  }
  // 22/10 (Pedro): stories do dia: o gerente ou o diretor pode trocar o texto de cada quadro e a CTA
  if (tipo === 'stories') {
    const novo = storiesEditados(db, r, b?.conteudo);
    const mudou = Object.keys(NOMES_CAMPO_STORIES).filter((k) => k in novo && canonico(novo[k]) !== canonico(valorStories(r, k)));
    for (const k of mudou) r[k] = novo[k];
    Object.assign(r.aprovacao, { ...decisao, tipoAjuste: mudou.length ? 'editado' : 'sugestao' });
    if (mudou.length) Object.assign(r, { atualizadoEm: agora(), atualizadoPor: u.nome });
    registrar(r, 'ajuste', u, msg, { mudou: mudou.map((k) => NOMES_CAMPO_STORIES[k]), etapa });
    await salvar();
    return tela(db, r, gerentes);
  }
  const novo = conferirReel(conteudoEditado(r, b?.conteudo), r);
  const mudou = Object.keys(NOMES_CAMPO).filter((k) => k in novo && canonico(novo[k]) !== canonico(r[k] ?? (k === 'legenda' ? '' : {})));
  for (const k of mudou) r[k] = novo[k];
  Object.assign(r.aprovacao, { ...decisao, tipoAjuste: mudou.length ? 'editado' : 'sugestao' });
  r.atualizadoEm = agora();
  r.atualizadoPor = u.nome;
  registrar(r, 'ajuste', u, msg, { mudou: mudou.map((k) => NOMES_CAMPO[k]), etapa });
  await salvar();
  if (mudou.some((k) => k === 'roteiro' || k === 'legenda')) await regravarSeGerado(r).catch((e) => console.error(`reel.md de ${r.id}:`, e.message));
  return tela(db, r, gerentes);
}

async function mensagem(id, b, u) {
  const { db, r, tipo } = await acharPeca(id);
  const gerentes = auth.gerentesAtivos();
  conferirVisivel(r, tipo, u, gerentes);
  if (!r.aprovacao) throw falha(409, FALAS[tipo].naoMandado);
  const msg = texto(b?.texto, 'A mensagem', LIM.mensagem, true);
  registrar(r, 'mensagem', u, msg);
  await salvar();
  return tela(db, r, gerentes);
}

// texto da peça mexido pelo time (PUT /api/reels/:id). Depois de aprovada: precisa de aprovação de novo ('alterado').
// 21/10: no meio da aprovação, o que os gerentes aprovaram não é mais o texto que está ali: volta pra etapa deles com
// as aprovações zeradas (sem gerente cadastrado, segue com o diretor, que vê o texto novo)
// 21/10 (Pedro): vale pra tudo que a aprovação cobre (NOMES_APROVADO: texto, tipo de peça, vídeo final e fontes) e pra
// todo caminho que grava a peça: o PUT, o chat (salvar_reel, agente.mjs) e o "Outra ideia" (outras-ideias.mjs).
// antes: a foto de fotoDaAprovacao (ou a peça de antes). Devolve true quando mexeu na aprovação (falta gravar)
// 22/10 (Pedro): vale também pros stories do dia (PUT /api/stories/:id), pelo id: tema, quadros, CTA e fontes
export function conferirMudancaAprovada(r, antes, u) {
  const estado = r.aprovacao?.estado;
  if (estado !== 'aprovado' && estado !== 'pendente') return false;
  const mudou = mudancasAprovadas(antes ?? {}, r);
  if (!mudou.length) return false;
  const autor = u ?? { nome: 'Sistema', id: null, sistema: true };
  const stories = ehStories(r?.id);
  const soTexto = mudou.every((k) => (stories ? SO_TEXTO_STORIES : SO_TEXTO).has(k));
  const rotulos = mudou.map((k) => (stories ? NOMES_APROVADO_STORIES : NOMES_APROVADO)[k]);
  if (estado === 'aprovado') {
    r.aprovacao.estado = 'alterado';
    const oQue = soTexto ? 'O texto mudou depois de aprovado' : stories ? 'O story mudou depois de aprovado' : 'A peça mudou depois de aprovada';
    registrar(r, 'alterado', autor, `${oQue}: mande de novo pra aprovação`, { mudou: rotulos });
    return true;
  }
  const gerentes = auth.gerentesAtivos();
  const etapaAntes = auth.etapaDaAprovacao(r.aprovacao, gerentes);
  if (!gerentes.length || (etapaAntes === 'gerentes' && !auth.aprovaramGerentes(r.aprovacao).length)) return false;
  Object.assign(r.aprovacao, { etapa: 'gerentes', gerentes: { aprovaram: [] } });
  // 22/10 (Pedro): a observação que um gerente deixou ao aprovar o texto de antes não vale mais (a aprovação dele caiu
  // junto); ela fica anulada (o painel não mostra) e o texto continua na conversa, como histórico
  for (const o of r.aprovacao.observacoes ?? []) {
    if (o && o.etapa === 'gerentes' && Number(o.rodada ?? 1) === Number(r.aprovacao.rodada ?? 1) && !o.anulada) o.anulada = agora();
  }
  const oQue = soTexto ? 'O texto mudou' : stories ? 'O story mudou' : 'A peça mudou';
  registrar(r, 'alterado', autor, `${oQue} durante a aprovação: volta pros gerentes aprovarem de novo`, { mudou: rotulos });
  return true;
}

// 21/10 (Pedro): o PUT que marca como postada confere a peça como estava E como fica (data e tipo de peça novos não
// abrem a trava) e, na peça aprovada, se a mesma edição não muda o que foi aprovado (aí ela já não está aprovada).
// b: o corpo já limpo (validarEdicao). Peça que já estava postada não trava
export function travaPostadoNaEdicao(item, b) {
  if (b?.status !== 'publicado' || item.status === 'publicado') return false;
  const depois = { ...item, ...b, status: item.status };
  if (item.aprovacao?.estado === 'aprovado' && mudancasAprovadas(item, depois).length) depois.aprovacao = { ...item.aprovacao, estado: 'alterado' };
  return travaPostado(item) || travaPostado(depois);
}
export const MSG_TRAVA_POSTADO = 'Falta a aprovação técnica: mande a peça pra aprovação e espere o Diretor contábil aprovar.';

// ── rascunho da explicação técnica pela IA (só o time pede) ──
const SISTEMA = `Você escreve a explicação técnica que acompanha uma peça de Instagram do Legalizaí (contabilidade digital pra MEI e ME de serviço em BH) quando ela vai pra aprovação do Diretor contábil.
Escreva em português do Brasil, curto, prático e sem firula, pra um contador ler em 30 segundos.
Formato, exatamente estas três partes, cada uma começando pelo rótulo:
Por que este post: uma ou duas frases sobre a dor ou a dúvida do público que a peça responde.
Base técnica: de um a quatro itens, um por linha começando com "• ", cada um com a regra ou o fato contábil que a peça usa e o id do fato do FATOS.md entre parênteses (ex.: (F051)). Se a peça afirma algo que não está no FATOS.md, escreva um item "• Sem fato na base: <o trecho>. Conferir." em vez de inventar.
Objetivo: uma frase com o resultado prático que a peça busca (ex.: levar quem tem ME pra lista de espera, tirar uma dúvida que trava a abertura).
Regras: só fatos do FATOS.md; nada de número, data ou prazo que não esteja lá; zero travessão (nem o traço longo nem o médio); nunca cite o Mauro, o escritório Legalize nem "22 anos"; não repita o roteiro; texto puro, sem markdown (nada de asterisco, cerquilha ou negrito).`;

// a IA às vezes devolve markdown mesmo assim: tira negrito e título, lista vira "• ", travessão vira vírgula
const textoPuro = (s) => String(s ?? '').replace(/\r\n/g, '\n')
  .split('\n').map((l) => l.replace(/^\s*#{1,6}\s*/, '').replace(/^\s*[-*–—]\s+/, '• ').replace(/\*\*|__/g, '').trimEnd()).join('\n')
  .replace(/[ \t]*[–—][ \t]*/g, ', ').trim();

function textoDaPeca(r) {
  const ro = r.roteiro ?? {};
  const cenas = (ro.cenas ?? []).map((c) => c?.fala).filter(tem);
  const partes = [
    `Título: ${r.ideia ?? ''}`, `Tipo de peça: ${pecaDe(r)}`, `Tema: ${r.tema ?? ''}`, `Objetivo do funil: ${r.tipo ?? ''}`, `Data: ${r.data || 'sem data'}`,
    cenas.length ? `Roteiro:\n${cenas.join('\n')}` : [ro.hook, ro.desenvolvimento, ro.cta].some(tem) ? `Roteiro:\n${[ro.hook, ro.desenvolvimento, ro.cta].filter(tem).join('\n')}` : '',
    pecaDe(r) === 'carrossel' ? `Slides:\n${[r.carrossel?.capa, ...(r.carrossel?.slides ?? []), r.carrossel?.final].filter(Boolean).map((s) => [s.titulo, s.texto].filter(tem).join(': ')).filter(tem).join('\n')}` : '',
    pecaDe(r) === 'estatico' ? `Arte: ${['headline', 'apoio', 'cta'].map((k) => r.estatico?.[k]).filter(tem).join(' | ')}` : '',
    tem(r.legenda) ? `Legenda:\n${r.legenda}` : '',
    (r.fontes ?? []).length ? `Fontes da peça:\n${r.fontes.join('\n')}` : '',
  ];
  return partes.filter(tem).join('\n\n');
}

// 22/10 (Pedro): o que a IA lê dos stories do dia: o tema, o objetivo, o planejamento (pilar e motivo), os quadros, a
// CTA e as fontes
export function textoDosStories(db, s) {
  const pl = s.pilar == null ? null : (db?.pilares ?? []).find((x) => x.id === Number(s.pilar));
  const quadros = (Array.isArray(s.quadros) ? s.quadros : []).map((q, i) => `${i + 1}. ${[
    q?.texto, tem(q?.visual) ? `visual: ${q.visual}` : '', tem(q?.interacao) ? `interação: ${q.interacao}` : '',
  ].filter(tem).join(' | ')}`);
  const fontes = Array.isArray(s.fontes) ? s.fontes.filter(tem) : [];
  const partes = [
    `Título: ${tituloStories(s)}`, 'Tipo de peça: stories do dia (sequência de quadros)', `Tema: ${s.tema ?? ''}`, `Objetivo: ${s.objetivo ?? ''}`,
    `Data: ${s.data || 'sem data'}`, `Pilar: ${pl ? `${pl.id} ${pl.nome}` : s.pilarTexto || 'sem pilar'}${s.bloco ? ` (bloco ${s.bloco})` : ''}`,
    tem(s.motivo) ? `Motivo no calendário: ${s.motivo}` : '',
    quadros.length ? `Quadros:\n${quadros.join('\n')}` : '',
    tem(s.cta) ? `CTA: ${s.cta}` : '',
    fontes.length ? `Fontes dos stories:\n${fontes.join('\n')}` : '',
  ];
  return partes.filter(tem).join('\n\n');
}

async function explicacaoIA(id) {
  if (envios.ehEnvio(id)) throw falha(400, 'No envio de arquivos, a base já é a explicação.');
  const { db, r, tipo } = await acharPeca(id);
  // 21/10 (Pedro): a mesma conferência da chave do resto do app (noticias.mjs). O loginClaude() dava true sem o arquivo
  // de login (VPS sem chave): o SDK rodava, falhava e a tela mostrava outra mensagem
  if (!iaConfigurada()) throw falha(503, `${MSG_SEM_IA} Escreva a explicação à mão.`);
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TIMEOUT_IA);
  let resultado = null;
  try {
    const q = query({
      prompt: tipo === 'stories' ? `Escreva a explicação técnica destes stories do dia.\n\n${textoDosStories(db, r)}` : `Escreva a explicação técnica desta peça.\n\n${textoDaPeca(r)}`,
      options: {
        cwd: RAIZ,
        model: process.env.CRONOGRAMA_MODEL || undefined,
        systemPrompt: `${SISTEMA}\n\n${blocoBaseContabil()}`,
        settingSources: [],
        tools: [],
        allowedTools: [],
        permissionMode: 'dontAsk',
        persistSession: false,
        maxTurns: 2,
        abortController: controle,
      },
    });
    for await (const m of q) if (m.type === 'result') resultado = m;
  } catch (e) {
    if (controle.signal.aborted) throw falha(504, 'A IA passou de 2 minutos. Tente de novo ou escreva à mão.');
    throw falha(502, ehErroLogin(e.message) ? 'O login da IA venceu neste servidor. Escreva a explicação à mão.' : `A IA não respondeu: ${e.message}`);
  } finally {
    clearTimeout(relogio);
  }
  if (resultado?.is_error && ehErroLogin(resultado.result)) throw falha(502, 'O login da IA venceu neste servidor. Escreva a explicação à mão.');
  if (!resultado || resultado.subtype !== 'success' || resultado.is_error) throw falha(502, 'A IA não conseguiu escrever a explicação. Tente de novo ou escreva à mão.');
  const txt = textoPuro(resultado.result);
  if (!txt) throw falha(502, 'A IA devolveu uma explicação vazia. Escreva à mão.');
  return { explicacao: txt.slice(0, LIM.explicacao) };
}

// /api/aprovacoes, /api/aprovacoes/:id/(enviar|aprovar|ajustar|mensagem|explicacao). O perfil já foi conferido
// pelo servidor (auth.podeApi): aprovar e ajustar só o gerente e o diretor (e aqui dentro de novo, com a etapa); o
// diretor só vê, aprova, ajusta e conversa, e só no que está na etapa dele ou foi decidido nela.
// 21/10: :id também pode ser um envio de arquivos (env_..., envios.mjs). 22/10 (Pedro): ou os stories do dia (sto_...)
// 22/10 (Pedro): aprovar = "Aprovado" ou, com { observacao }, "Aprovado com observação"; ajustar = "Reprovado"
// ({ mensagem } obrigatória, { conteudo } opcional)
// 22/10 (Pedro): POST /api/aprovacoes/lote { itens: [{ id, explicacao }] } manda vários de uma vez (enviarLote), só o time
export async function rota(req, res, id, sub, sess, { json, corpoJson }) {
  const m = req.method;
  if (!id) {
    if (m !== 'GET') return json(res, 405, { erro: 'Método não permitido.' });
    return json(res, 200, await listar(sess));
  }
  // 22/10 (Pedro): POST /api/aprovacoes/lote, vários de uma vez (enviarLote)
  if (id === 'lote' && !sub) {
    if (m !== 'POST') return json(res, 405, { erro: 'Método não permitido.' });
    return json(res, 200, await enviarLote(await corpoJson(req, LOTE.corpo), sess.usuario));
  }
  if (!sub && m === 'GET') {
    const { db, r, tipo } = await acharPeca(id);
    const gerentes = auth.gerentesAtivos();
    // 21/10: o rascunho do time (e o que ainda está com os gerentes) não existe pro Diretor contábil
    conferirVisivel(r, tipo, sess?.usuario, gerentes);
    return json(res, 200, tela(db, r, gerentes));
  }
  if (m !== 'POST') return json(res, 405, { erro: 'Método não permitido.' });
  const u = sess.usuario;
  if (sub === 'explicacao') return json(res, 200, await explicacaoIA(id));
  const b = await corpoJson(req, 200_000);
  if (sub === 'enviar') return json(res, 200, await enviar(id, b, u));
  if (sub === 'aprovar') return json(res, 200, await aprovar(id, b, u));
  if (sub === 'ajustar') return json(res, 200, await ajustar(id, b, u));
  if (sub === 'mensagem') return json(res, 200, await mensagem(id, b, u));
  return json(res, 404, { erro: 'Rota não existe.' });
}
