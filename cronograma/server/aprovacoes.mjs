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
// Stories do dia ficam fora (são do dia a dia). Peça postada não entra.
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
import { query } from '@anthropic-ai/claude-agent-sdk';
import { carregar, salvar, falha, agora, novoId, limparFontes } from './db.mjs';
import { conferirReel } from './validar.mjs';
import { regravarSeGerado } from './reelmd.mjs';
import { blocoBaseContabil } from './base-contabil.mjs';
import { ehErroLogin } from './analise.mjs';
import { iaConfigurada, MSG_SEM_IA } from './noticias.mjs';
import { RAIZ } from './importar.mjs';
import * as auth from './auth.mjs';
import * as envios from './envios.mjs';

const PECAS_FEED = ['reel', 'carrossel', 'estatico'];
const LIM = { explicacao: 3000, mensagem: 2000, conversa: 300 };
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
    fontes: r.fontes ?? [], videos: r.videos ?? [], aprovacao: r.aprovacao ?? null,
  };
}

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

// a peça do cronograma ou o envio de arquivos (envios.mjs), cada um na forma de tela dele, com a etapa da aprovação e
// os gerentes que precisam aprovar (gerentesNecessarios, os de agora)
const ehEnvio = (r) => envios.ehEnvio(r?.id);
function tela(db, r, gerentes = auth.gerentesAtivos()) {
  const t = ehEnvio(r) ? envios.paraTela(r) : paraTela(db, r);
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
  const todos = [...db.reels, ...(db.envios ?? []).filter((e) => e && typeof e === 'object')];
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

async function acharPeca(id) {
  const db = await carregar();
  if (envios.ehEnvio(id)) {
    const e = (db.envios ?? []).find((x) => x?.id === id);
    if (!e) throw falha(404, 'Esse envio não existe mais.');
    return { db, r: e, envio: true };
  }
  const r = db.reels.find((x) => x.id === id);
  if (!r) throw falha(404, 'Essa peça não existe mais.');
  return { db, r, envio: false };
}

// o Diretor contábil só chega no que está na etapa dele ou foi decidido nela; o resto é como se não existisse (404)
function conferirVisivel(r, envio, u, gerentes) {
  if (ehDiretor(u) && !auth.diretorVe(r.aprovacao, gerentes)) throw falha(404, envio ? 'Esse envio não existe mais.' : 'Essa peça não existe mais.');
}

// manda pra aprovação: sempre recomeça na etapa dos gerentes (sem gerente cadastrado, já cai no diretor)
async function enviar(id, b, u) {
  const { db, r, envio } = await acharPeca(id);
  if (envio) {
    if (r.aprovacao?.estado === 'pendente') throw falha(409, 'Esse envio já está esperando a aprovação.');
    if (!(r.arquivos ?? []).length) throw falha(400, 'Suba pelo menos um arquivo antes de mandar.');
  } else {
    if (!precisaAprovacao(r)) throw falha(400, 'Stories do dia não passam pela aprovação técnica: só reel, carrossel e estático.');
    if (r.status === 'publicado') throw falha(409, 'Essa peça já foi postada.');
    if (r.aprovacao?.estado === 'pendente') throw falha(409, 'Essa peça já está esperando a aprovação.');
  }
  // no envio de arquivos, sem explicação escrita a base vai como explicação
  const explicacao = texto(envio && !tem(b.explicacao) ? r.base : b.explicacao, 'A explicação técnica', LIM.explicacao, true);
  const rodada = (r.aprovacao?.rodada ?? 0) + 1;
  const gerentes = auth.gerentesAtivos();
  r.aprovacao = {
    ...(r.aprovacao ?? {}), estado: 'pendente', etapa: gerentes.length ? 'gerentes' : 'diretor', gerentes: { aprovaram: [] }, tipoAjuste: null,
    explicacao, rodada, enviadoEm: agora(), enviadoPor: u.nome, enviadoPorId: u.id ?? null, decididoEm: null, decididoPor: null, decididoPorId: null,
  };
  registrar(r, 'envio', u, rodada > 1 ? 'Mandou de novo pra aprovação' : 'Mandou pra aprovação');
  await salvar();
  return tela(db, r, gerentes);
}

// 21/10 (Pedro): o gerador da semana manda a peça (ou o envio) pra etapa dos gerentes sozinho, sem conta logada.
// Mesmas regras do enviar (peça postada, stories e o que já está pendente dão erro com status)
export async function enviarPeloSistema(id, explicacao, autorNome = 'Gerador da semana') {
  const nome = String(autorNome ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Gerador da semana';
  return enviar(id, { explicacao }, { id: null, nome, sistema: true });
}

const naoEspera = (envio) => falha(409, envio ? 'Esse envio não está esperando aprovação.' : 'Essa peça não está esperando aprovação.');
const nomes = (gs) => {
  const ns = gs.map((g) => g.nome).filter(Boolean);
  return ns.length > 1 ? `${ns.slice(0, -1).join(', ')} e ${ns.at(-1)}` : ns[0] ?? '';
};
// as mensagens de etapa errada (409)
function foraDaEtapa(papel, ap, gerentes, envio) {
  if (papel === 'gerente') return falha(409, `${envio ? 'Esse envio' : 'Essa peça'} já passou pelos gerentes: agora está com o Diretor contábil.`);
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
  const { db, r, envio } = await acharPeca(id);
  const gerentes = auth.gerentesAtivos();
  if (papel === 'diretor') conferirVisivel(r, envio, u, gerentes);
  if (r.aprovacao?.estado !== 'pendente') throw naoEspera(envio);
  const msg = texto(b?.mensagem, 'A mensagem', LIM.mensagem);
  const etapa = auth.etapaDaAprovacao(r.aprovacao, gerentes);
  if (papel === 'gerente') {
    if (etapa !== 'gerentes') throw foraDaEtapa(papel, r.aprovacao, gerentes, envio);
    const aprovaram = auth.aprovaramGerentes(r.aprovacao);
    if (aprovaram.some((x) => x.id === u.id)) {
      const faltam = auth.faltamGerentes(r.aprovacao, gerentes);
      throw falha(409, `Você já aprovou.${faltam.length ? ` Falta ${nomes(faltam)}.` : ''}`);
    }
    aprovaram.push({ id: u.id, nome: u.nome, em: agora() });
    r.aprovacao.gerentes = { aprovaram };
    const faltam = auth.faltamGerentes(r.aprovacao, gerentes);
    // todos os gerentes aprovaram: segue pro Diretor contábil
    r.aprovacao.etapa = faltam.length ? 'gerentes' : 'diretor';
    registrar(r, 'aprovado', u, msg || (faltam.length ? `Aprovou. Falta ${nomes(faltam)}` : 'Aprovou. Segue pro Diretor contábil'), { etapa: 'gerentes' });
    await salvar();
    return tela(db, r, gerentes);
  }
  // diretor: a aprovação de um diretor fecha
  if (etapa !== 'diretor') throw foraDaEtapa(papel, r.aprovacao, gerentes, envio);
  Object.assign(r.aprovacao, { estado: 'aprovado', etapa: 'diretor', tipoAjuste: null, decididoEm: agora(), decididoPor: u.nome, decididoPorId: u.id });
  registrar(r, 'aprovado', u, msg || 'Aprovou', { etapa: 'diretor' });
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
// a foto do que a aprovação cobre, tirada antes de gravar uma edição (PUT, chat, "Outra ideia")
export const fotoDaAprovacao = (r) => structuredClone(Object.fromEntries(Object.keys(NOMES_APROVADO).map((k) => [k, r?.[k] ?? null])));
// as chaves que mudaram entre a foto (ou a peça de antes) e a peça de agora
export const mudancasAprovadas = (antes, r) => Object.keys(NOMES_APROVADO).filter((k) => JSON.stringify(valorDe(r, k)) !== JSON.stringify(valorDe(antes, k)));
const SO_TEXTO = new Set(Object.keys(NOMES_CAMPO));

// o gerente ajusta na etapa dele, o diretor na dele; depois de aprovada, só o Diretor contábil com ajustaDepoisDeAprovada
async function ajustar(id, b, u) {
  const papel = papelQueDecide(u, 'pedem ajuste');
  const { db, r, envio } = await acharPeca(id);
  const gerentes = auth.gerentesAtivos();
  if (papel === 'diretor') conferirVisivel(r, envio, u, gerentes);
  const ap = r.aprovacao;
  let etapa;
  if (ap?.estado === 'aprovado') {
    // 21/10 (Pedro): a permissão da conta só vale com o perfil Diretor contábil (auth.ajustaAprovada)
    if (!auth.ajustaAprovada(u)) {
      throw falha(409, `${envio ? 'Esse envio já foi aprovado' : 'Essa peça já foi aprovada'}. Depois da aprovação, só o Diretor com a permissão de ajuste mexe ${envio ? 'nele' : 'nela'}.`);
    }
    if (!envio && r.status === 'publicado') throw falha(409, 'Essa peça já foi postada.');
    etapa = 'diretor';
  } else {
    if (ap?.estado !== 'pendente') throw naoEspera(envio);
    etapa = auth.etapaDaAprovacao(ap, gerentes);
    if ((papel === 'gerente') !== (etapa === 'gerentes')) throw foraDaEtapa(papel, ap, gerentes, envio);
  }
  const msg = texto(b?.mensagem, 'O ajuste', LIM.mensagem);
  const decisao = { estado: 'ajuste', etapa, decididoEm: agora(), decididoPor: u.nome, decididoPorId: u.id };
  // envio de arquivos: o ajuste é só a mensagem (sugestão); ninguém edita arquivo por aqui
  if (envio) {
    if (!msg) throw falha(400, 'Escreva o que ajustar.');
    Object.assign(r.aprovacao, { ...decisao, tipoAjuste: 'sugestao' });
    registrar(r, 'ajuste', u, msg, { mudou: [], etapa });
    await salvar();
    return tela(db, r, gerentes);
  }
  const novo = conferirReel(conteudoEditado(r, b?.conteudo), r);
  const mudou = Object.keys(NOMES_CAMPO).filter((k) => k in novo && JSON.stringify(novo[k]) !== JSON.stringify(r[k] ?? (k === 'legenda' ? '' : {})));
  if (!msg && !mudou.length) throw falha(400, 'Escreva o que ajustar ou mude o texto da peça antes de salvar.');
  for (const k of mudou) r[k] = novo[k];
  Object.assign(r.aprovacao, { ...decisao, tipoAjuste: mudou.length ? 'editado' : 'sugestao' });
  r.atualizadoEm = agora();
  r.atualizadoPor = u.nome;
  registrar(r, 'ajuste', u, msg || 'Ajustou o texto da peça', { mudou: mudou.map((k) => NOMES_CAMPO[k]), etapa });
  await salvar();
  if (mudou.some((k) => k === 'roteiro' || k === 'legenda')) await regravarSeGerado(r).catch((e) => console.error(`reel.md de ${r.id}:`, e.message));
  return tela(db, r, gerentes);
}

async function mensagem(id, b, u) {
  const { db, r, envio } = await acharPeca(id);
  const gerentes = auth.gerentesAtivos();
  conferirVisivel(r, envio, u, gerentes);
  if (!r.aprovacao) throw falha(409, envio ? 'Esse envio ainda não foi mandado pra aprovação.' : 'Essa peça ainda não foi mandada pra aprovação.');
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
export function conferirMudancaAprovada(r, antes, u) {
  const estado = r.aprovacao?.estado;
  if (estado !== 'aprovado' && estado !== 'pendente') return false;
  const mudou = mudancasAprovadas(antes ?? {}, r);
  if (!mudou.length) return false;
  const autor = u ?? { nome: 'Sistema', id: null, sistema: true };
  const soTexto = mudou.every((k) => SO_TEXTO.has(k));
  const rotulos = mudou.map((k) => NOMES_APROVADO[k]);
  if (estado === 'aprovado') {
    r.aprovacao.estado = 'alterado';
    registrar(r, 'alterado', autor, `${soTexto ? 'O texto mudou depois de aprovado' : 'A peça mudou depois de aprovada'}: mande de novo pra aprovação`, { mudou: rotulos });
    return true;
  }
  const gerentes = auth.gerentesAtivos();
  const etapaAntes = auth.etapaDaAprovacao(r.aprovacao, gerentes);
  if (!gerentes.length || (etapaAntes === 'gerentes' && !auth.aprovaramGerentes(r.aprovacao).length)) return false;
  Object.assign(r.aprovacao, { etapa: 'gerentes', gerentes: { aprovaram: [] } });
  registrar(r, 'alterado', autor, `${soTexto ? 'O texto' : 'A peça'} mudou durante a aprovação: volta pros gerentes aprovarem de novo`, { mudou: rotulos });
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

async function explicacaoIA(id) {
  if (envios.ehEnvio(id)) throw falha(400, 'No envio de arquivos, a base já é a explicação.');
  const { r } = await acharPeca(id);
  // 21/10 (Pedro): a mesma conferência da chave do resto do app (noticias.mjs). O loginClaude() dava true sem o arquivo
  // de login (VPS sem chave): o SDK rodava, falhava e a tela mostrava outra mensagem
  if (!iaConfigurada()) throw falha(503, `${MSG_SEM_IA} Escreva a explicação à mão.`);
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TIMEOUT_IA);
  let resultado = null;
  try {
    const q = query({
      prompt: `Escreva a explicação técnica desta peça.\n\n${textoDaPeca(r)}`,
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
// 21/10: :id também pode ser um envio de arquivos (env_..., envios.mjs)
export async function rota(req, res, id, sub, sess, { json, corpoJson }) {
  const m = req.method;
  if (!id) {
    if (m !== 'GET') return json(res, 405, { erro: 'Método não permitido.' });
    return json(res, 200, await listar(sess));
  }
  if (!sub && m === 'GET') {
    const { db, r, envio } = await acharPeca(id);
    const gerentes = auth.gerentesAtivos();
    // 21/10: o rascunho do time (e o que ainda está com os gerentes) não existe pro Diretor contábil
    conferirVisivel(r, envio, sess?.usuario, gerentes);
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
