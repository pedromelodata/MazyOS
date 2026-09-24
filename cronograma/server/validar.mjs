// Validação do que chega de fora pra reel e ideia: a mesma na tela (POST/PUT), no lote
// (POST /api/reels/lote) e no importar-nicho.mjs. Saiu do server.mjs em 23/09.
import {
  falha, agora, dataValida, TIPOS_REEL, conferirTipo, limparGravacao, limparFontes, gravacaoVazia,
  conferirTema, limparRoteiroBase, roteiroBaseVazio, textoCurto, TRACOS,
} from './db.mjs';
import { CAMPANHA_PADRAO } from './migrar.mjs';

export const STATUS_REEL = ['ideia', 'roteiro', 'gravado', 'editado', 'publicado'];
const DO_SERVIDOR_REEL = ['origem', 'origemChat'];
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
// o que um item do lote pode trazer (o resto é ignorado: origem, métricas e ids são do servidor)
const CAMPOS_LOTE = ['data', 'tipo', 'formatoId', 'pilar', 'ideiaId', 'campanhaId', 'status', 'ideia', 'tema', 'roteiro', 'legenda', 'gravacao', 'fontes', 'rede', 'gatilho', 'impulsionar', 'formatoTexto', 'pilarTexto', 'notas'];
export const MAX_LEGENDA = 2200;
// campos do calendário editorial (CSV oficial do mês, 24/09): todos opcionais no reel.
// formatoTexto é o formato como o calendário escreve ("Carrossel 4:5, 3 slides"); vale sozinho quando
// o reel não tem formatoId (formato livre). permalink é o "Link do post" do calendário
export const IMPULSIONAR = ['Sim', 'Não', 'Avaliar'];
const TEXTOS_CALENDARIO = { rede: 200, gatilho: 1000, formatoTexto: 300, pilarTexto: 200, notas: 2000 };

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
  if ('tipo' in b) b.tipo = conferirTipo(b.tipo);
  if ('gravacao' in b) b.gravacao = limparGravacao(b.gravacao, item?.gravacao);
  if ('fontes' in b) b.fontes = limparFontes(b.fontes);
  conferirCalendario(b);
  return semCampos(b, DO_SERVIDOR_REEL);
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
  if (!b.formatoId) throw falha(400, 'formatoId é obrigatório (um formato da Biblioteca de Reels).');
  if (!db.formatos.some((f) => f.id === b.formatoId)) throw falha(400, `formatoId "${b.formatoId}" não existe na biblioteca.`);
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
    tipo: null, gravacao: gravacaoVazia(), fontes: [], ...limpo, criadoEm: agora(),
  };
}

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
