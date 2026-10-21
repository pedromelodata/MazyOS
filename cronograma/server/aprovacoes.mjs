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
// Estado na própria peça (db.reels[].aprovacao, campo do servidor: o PUT da peça não mexe nele):
//   { estado: pendente | aprovado | ajuste | alterado, tipoAjuste: editado | sugestao | null, explicacao, rodada,
//     enviadoEm, enviadoPor, enviadoPorId, decididoEm, decididoPor, decididoPorId,
//     conversa: [{ id, em, tipo: envio | aprovado | ajuste | mensagem | alterado, autor, autorId, papel, texto, mudou }] }
import { query } from '@anthropic-ai/claude-agent-sdk';
import { carregar, salvar, falha, agora, novoId } from './db.mjs';
import { conferirReel } from './validar.mjs';
import { regravarSeGerado } from './reelmd.mjs';
import { blocoBaseContabil } from './base-contabil.mjs';
import { loginClaude, ehErroLogin } from './analise.mjs';
import { RAIZ } from './importar.mjs';
import * as auth from './auth.mjs';

const PECAS_FEED = ['reel', 'carrossel', 'estatico'];
const LIM = { explicacao: 3000, mensagem: 2000, conversa: 300 };
const RECENTES_DIAS = 30;
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

const quem = (u) => ({ autor: u.nome, autorId: u.id, papel: auth.papelDe(u) });
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

export async function listar() {
  const db = await carregar();
  const limite = Date.now() - RECENTES_DIAS * 86_400_000;
  const pend = db.reels.filter((r) => r.aprovacao?.estado === 'pendente')
    .sort((a, b) => (a.data || '9999').localeCompare(b.data || '9999'));
  const rec = db.reels.filter((r) => r.aprovacao && r.aprovacao.estado !== 'pendente' && Date.parse(r.aprovacao.decididoEm ?? r.aprovacao.enviadoEm ?? 0) > limite)
    .sort((a, b) => String(b.aprovacao.decididoEm ?? '').localeCompare(String(a.aprovacao.decididoEm ?? '')));
  return { pendentes: pend.map((r) => paraTela(db, r)), recentes: rec.map((r) => paraTela(db, r)) };
}

async function acharPeca(id) {
  const db = await carregar();
  const r = db.reels.find((x) => x.id === id);
  if (!r) throw falha(404, 'Essa peça não existe mais.');
  return { db, r };
}

async function enviar(id, b, u) {
  const { db, r } = await acharPeca(id);
  if (!precisaAprovacao(r)) throw falha(400, 'Stories do dia não passam pela aprovação técnica: só reel, carrossel e estático.');
  if (r.status === 'publicado') throw falha(409, 'Essa peça já foi postada.');
  if (r.aprovacao?.estado === 'pendente') throw falha(409, 'Essa peça já está esperando a aprovação.');
  const explicacao = texto(b.explicacao, 'A explicação técnica', LIM.explicacao, true);
  const rodada = (r.aprovacao?.rodada ?? 0) + 1;
  r.aprovacao = {
    ...(r.aprovacao ?? {}), estado: 'pendente', tipoAjuste: null, explicacao, rodada,
    enviadoEm: agora(), enviadoPor: u.nome, enviadoPorId: u.id, decididoEm: null, decididoPor: null, decididoPorId: null,
  };
  registrar(r, 'envio', u, rodada > 1 ? 'Mandou de novo pra aprovação' : 'Mandou pra aprovação');
  await salvar();
  return paraTela(db, r);
}

async function aprovar(id, b, u) {
  const { db, r } = await acharPeca(id);
  if (r.aprovacao?.estado !== 'pendente') throw falha(409, 'Essa peça não está esperando aprovação.');
  const msg = texto(b?.mensagem, 'A mensagem', LIM.mensagem);
  Object.assign(r.aprovacao, { estado: 'aprovado', tipoAjuste: null, decididoEm: agora(), decididoPor: u.nome, decididoPorId: u.id });
  registrar(r, 'aprovado', u, msg || 'Aprovou');
  await salvar();
  return paraTela(db, r);
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
const NOMES_CAMPO = { roteiro: 'roteiro', carrossel: 'slides', estatico: 'arte', legenda: 'legenda' };

async function ajustar(id, b, u) {
  const { db, r } = await acharPeca(id);
  if (r.aprovacao?.estado !== 'pendente') throw falha(409, 'Essa peça não está esperando aprovação.');
  const msg = texto(b?.mensagem, 'O ajuste', LIM.mensagem);
  const novo = conferirReel(conteudoEditado(r, b?.conteudo), r);
  const mudou = Object.keys(NOMES_CAMPO).filter((k) => k in novo && JSON.stringify(novo[k]) !== JSON.stringify(r[k] ?? (k === 'legenda' ? '' : {})));
  if (!msg && !mudou.length) throw falha(400, 'Escreva o que ajustar ou mude o texto da peça antes de salvar.');
  for (const k of mudou) r[k] = novo[k];
  Object.assign(r.aprovacao, {
    estado: 'ajuste', tipoAjuste: mudou.length ? 'editado' : 'sugestao', decididoEm: agora(), decididoPor: u.nome, decididoPorId: u.id,
  });
  r.atualizadoEm = agora();
  r.atualizadoPor = u.nome;
  registrar(r, 'ajuste', u, msg || 'Ajustou o texto da peça', { mudou: mudou.map((k) => NOMES_CAMPO[k]) });
  await salvar();
  if (mudou.some((k) => k === 'roteiro' || k === 'legenda')) await regravarSeGerado(r).catch((e) => console.error(`reel.md de ${r.id}:`, e.message));
  return paraTela(db, r);
}

async function mensagem(id, b, u) {
  const { db, r } = await acharPeca(id);
  if (!r.aprovacao) throw falha(409, 'Essa peça ainda não foi mandada pra aprovação.');
  const msg = texto(b?.texto, 'A mensagem', LIM.mensagem, true);
  registrar(r, 'mensagem', u, msg);
  await salvar();
  return paraTela(db, r);
}

// texto da peça mexido pelo time depois de aprovada (PUT /api/reels/:id): precisa de aprovação de novo
export function conferirMudancaAprovada(r, antes, u) {
  if (r.aprovacao?.estado !== 'aprovado') return false;
  const mudou = Object.keys(NOMES_CAMPO).filter((k) => JSON.stringify(r[k] ?? null) !== JSON.stringify(antes[k] ?? null));
  if (!mudou.length) return false;
  r.aprovacao.estado = 'alterado';
  registrar(r, 'alterado', u ?? { nome: 'Sistema', id: null }, 'O texto mudou depois de aprovado: mande de novo pra aprovação', { mudou: mudou.map((k) => NOMES_CAMPO[k]) });
  return true;
}

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
  const { r } = await acharPeca(id);
  if (!loginClaude()) throw falha(503, 'A IA não está ligada neste servidor. Escreva a explicação à mão.');
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
  if (!resultado || resultado.subtype !== 'success' || resultado.is_error) throw falha(502, 'A IA não conseguiu escrever a explicação. Tente de novo ou escreva à mão.');
  const txt = textoPuro(resultado.result);
  if (!txt) throw falha(502, 'A IA devolveu uma explicação vazia. Escreva à mão.');
  return { explicacao: txt.slice(0, LIM.explicacao) };
}

// /api/aprovacoes, /api/aprovacoes/:id/(enviar|aprovar|ajustar|mensagem|explicacao). O perfil já foi conferido
// pelo servidor (auth.podeApi): aprovar e ajustar só o diretor; o diretor só vê, aprova, ajusta e conversa
export async function rota(req, res, id, sub, sess, { json, corpoJson }) {
  const m = req.method;
  if (!id) {
    if (m !== 'GET') return json(res, 405, { erro: 'Método não permitido.' });
    return json(res, 200, await listar());
  }
  if (!sub && m === 'GET') {
    const { db, r } = await acharPeca(id);
    return json(res, 200, paraTela(db, r));
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
