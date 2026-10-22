// Arrastar a peça do cronograma pro Banco de Ideias (22/10/2026, Pedro: "Dê opção de arrastar os posts do cronograma
// para o banco de ideias"). A peça sai do calendário e vira ideia no banco, com tudo o que tinha escrito:
//  - POST /api/reels/:id/para-banco: peça de feed não postada vira ideia. Se ela veio de uma ideia do banco (ideiaId),
//    é essa ideia que volta a ficar livre; senão nasce uma ideia nova (origem 'cronograma'). A peça inteira fica
//    guardada na ideia (pecaOriginal) pro "Desfazer" e pro "Voltar pro cronograma"
//  - POST /api/ideias/:id/voltar { data? }: a peça guardada volta pro cronograma (no dia de antes ou no data pedido). A
//    ideia que nasceu da peça e não foi mexida no banco sai; a que já existia (ou que alguém editou) fica, ligada à peça
// Peça postada não sai: é o registro do que foi ao ar. Peça em aprovação ou aprovada sai com a aprovação guardada
// junto (a tela confirma antes). O story do dia que conversava com ela (pecaDoDia) fica solto e é religado na volta
import { carregar, salvar, falha, agora, novoId, dataValida, conferirTipo, limparFontes, repontarIdeia } from './db.mjs';
import { ideiaPadrao } from './validar.mjs';

const tem = (v) => Boolean(String(v ?? '').trim());
const corta = (s, n) => (String(s ?? '').length > n ? `${String(s).slice(0, n - 1)}…` : String(s ?? ''));
const diaCurto = (iso) => (dataValida(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : 'sem data');
const NOME_PECA = { reel: 'reel', carrossel: 'carrossel', estatico: 'estático', stories: 'stories' };

// o texto que a peça já tinha vira o roteiro base da ideia (gancho, texto de tela, o meio e a CTA)
function roteiroBaseDa(r) {
  const ro = r.roteiro ?? {};
  const ca = r.carrossel ?? {};
  const es = r.estatico ?? {};
  const falas = (ro.cenas ?? []).map((c) => c?.fala).filter(tem);
  const slides = (ca.slides ?? []).map((s) => [s?.titulo, s?.texto].filter(tem).join(': ')).filter(tem);
  const meio = falas.length ? falas.slice(1, tem(ro.cta) ? -1 : undefined).join('\n\n')
    : tem(ro.desenvolvimento) ? ro.desenvolvimento
      : slides.length ? slides.join('\n\n')
        : es.apoio ?? '';
  return {
    hook: corta(ro.hook || ca.capa?.titulo || es.headline || '', 600),
    textoTela: corta(ro.textoTela ?? '', 600),
    narracao: corta(meio, 4000),
    cta: corta(ro.cta || ca.final?.texto || ca.final?.titulo || es.cta || '', 600),
  };
}

export async function paraBanco(id, autor) {
  const db = await carregar();
  const r = db.reels.find((x) => x.id === id);
  if (!r) throw falha(404, 'Essa peça não existe mais.');
  if (r.status === 'publicado') throw falha(409, 'Peça postada fica no cronograma: ela é o registro do que foi ao ar.');
  const foto = structuredClone(r);
  foto.storiesLigados = (db.stories ?? []).filter((s) => s.pecaDoDia === id).map((s) => s.id);
  const nota = `Veio do cronograma (${diaCurto(r.data)}, ${NOME_PECA[r.peca] ?? 'peça'}) em ${diaCurto(agora().slice(0, 10))}, por ${autor}.`;
  let ideia = r.ideiaId ? db.ideias.find((i) => i.id === r.ideiaId) : null;
  if (ideia) {
    Object.assign(ideia, { reelId: null, pecaOriginal: foto, notas: corta([ideia.notas, nota].filter(tem).join('\n\n'), 2000) });
  } else {
    let tipo = null;
    try { tipo = conferirTipo(r.tipo); } catch {}
    ideia = {
      id: novoId('ide'), ...ideiaPadrao(),
      titulo: corta(r.ideia || 'Peça sem título', 300),
      descricao: corta([r.tema, r.motivo].filter(tem).join('\n\n'), 2000),
      tipo, formatoId: db.formatos.some((f) => f.id === r.formatoId) ? r.formatoId : null,
      gancho: roteiroBaseDa(r).hook, roteiroBase: roteiroBaseDa(r), fontes: limparFontes(r.fontes ?? []),
      notas: corta([r.notas, nota].filter(tem).join('\n\n'), 2000),
      origem: 'cronograma', pecaOriginal: foto, criadaEm: agora(), criadoPor: autor,
    };
    db.ideias.push(ideia);
  }
  // a peça sai do calendário (o mesmo que o DELETE faz com os vínculos)
  for (const i of db.ideias) if (i.reelId === id && i !== ideia) repontarIdeia(db, i.id, id);
  for (const c of db.cases ?? []) if (c.reelId === id) c.reelId = null;
  for (const s of db.stories ?? []) if (s.pecaDoDia === id) s.pecaDoDia = null;
  db.reels.splice(db.reels.indexOf(r), 1);
  await salvar();
  return { ideia, removida: id };
}

export async function voltar(ideiaId, b, autor) {
  const db = await carregar();
  const i = db.ideias.find((x) => x.id === ideiaId);
  if (!i) throw falha(404, 'Essa ideia não existe mais.');
  const foto = i.pecaOriginal;
  if (!foto || typeof foto !== 'object') throw falha(409, 'Essa ideia não veio do cronograma.');
  const data = b?.data === undefined ? foto.data ?? '' : b.data;
  if (data !== '' && !dataValida(data)) throw falha(400, 'data precisa ser um dia que existe, no formato AAAA-MM-DD.');
  const { storiesLigados = [], ...peca } = structuredClone(foto);
  if (db.reels.some((r) => r.id === peca.id)) peca.id = novoId('reel');
  Object.assign(peca, { data, atualizadoEm: agora(), atualizadoPor: autor });
  // a ideia que nasceu da peça e ninguém mexeu sai do banco; a que existia antes (ou foi editada) fica ligada
  const nasceuDaPeca = i.origem === 'cronograma' && !i.atualizadoEm;
  if (nasceuDaPeca) {
    db.ideias.splice(db.ideias.indexOf(i), 1);
    peca.ideiaId = null;
  } else {
    delete i.pecaOriginal;
    i.reelId = peca.id;
    peca.ideiaId = i.id;
  }
  db.reels.push(peca);
  for (const s of db.stories ?? []) if (storiesLigados.includes(s.id) && !s.pecaDoDia && s.data === data) s.pecaDoDia = peca.id;
  await salvar();
  return { peca, ideiaRemovida: nasceuDaPeca ? ideiaId : null };
}
