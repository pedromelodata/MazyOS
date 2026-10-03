// Migração e merge do banco. Roda no boot (db.carregar) e também sozinha: node server/migrar.mjs
//
// - db.json não existe: nasce de seed.json + biblioteca.json + ideias.json + os reel.md do disco
// - db.json v1 (sem schemaVersion): backup em db.v1.backup.json (se ainda não houver) e conversão
// - todo boot: entrada nova de biblioteca.json / ideias.json / formatos do seed entra por id
//
// Decisão (SPEC §9 deixa aberto): "nunca sobrescreve edição do usuário" é lido assim.
//  - entrada que o usuário já mexeu (tem atualizadoEm) nunca é tocada
//  - entrada nunca mexida acompanha a versão do arquivo (a curadoria pode ser refinada depois)
//  - entrada que o usuário apagou não volta: db.sementes guarda os ids que já entraram
// biblioteca.json e ideias.json aceitam array puro ou { formatos: [...] } / { ideias: [...] }.
// Arquivo ausente, vazio ou quebrado (ainda sendo escrito) conta como vazio: entra no próximo boot.
// estilos.json (guia do nicho, 23/09) fica só em memória (db.guia()): não é editável pela tela, então
// não vai pro db.json. Dele sai formato.tipos quando falta (edição do usuário nunca é tocada). Tema das
// ideias: "fator-r" vira tm_fator_r; "app" e os rótulos sem ficha ficam como estão.
import { readFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import {
  DB_PATH, arquivoDados, lerJson, gravarJson, novoId, agora, TRACOS, gravacaoVazia, TIPOS_REEL, ESTILOS,
  guia, definirGuia, TEMA_LEGADO, roteiroBaseVazio, ROTEIRO_BASE, PECAS, pecasDoTexto, blocoCanonico, blocoDoPilar,
  BLOCO_DO_PILAR, carrosselVazio, estaticoVazio, storiesVazio, limparCarrossel, limparEstatico, limparStories, semTracos,
} from './db.mjs';
import { listarReelsDoDisco } from './importar.mjs';

export const CAMPANHA_PADRAO = 'cmp_prelancamento';

const CAMPANHA_PRELANCAMENTO = {
  id: CAMPANHA_PADRAO,
  nome: 'Pré-lançamento',
  objetivo: 'Engordar a lista de espera. Oferta real, válida até 31/12/2026 pra quem entra na lista de espera: plano MEI a R$ 29 por mês nos 3 primeiros meses, depois R$ 49; plano ME a R$ 99 por mês nos 3 primeiros meses, depois R$ 139.',
  inicio: '2026-08-20',
  fim: '2026-12-31',
  metaReels: 0,
  origem: '_base-contabil/FATOS.md (F001 a F007)',
};

// pilares que o calendário editorial oficial de outubro/2026 trouxe (24/09). Entram por id, uma vez:
// nome ou bloco editado pelo usuário fica como está
export const PILARES_NOVOS = [
  { id: 16, nome: 'Dicas empresariais', bloco: 'Educação' },
  { id: 17, nome: 'Facilidade do app', bloco: 'Diferencial' },
];

// @ oficial do Legalizaí (confirmado pelo Pedro em 22/09/2026): aparece antes mesmo de conectar
export const HANDLE_OFICIAL = 'legalizai.app';
const CONFIG_PADRAO = { nomeUsuario: 'Pedro', metaMensal: 12, handleInstagram: HANDLE_OFICIAL, contasReferencia: [], hashtags: [] };

// os 6 formatos da v1 viram os testes T.1..T.6. "arquivo" é o reel.md onde cada um nasceu:
// é por ele que um reel importado sem formatoId descobre o formato
export const FORMATOS_V1 = {
  fmt_selfie_desabafo: { id: 'fmt_t_1', arquivo: 'marketing/conteudo/reel-cansaco-burocracia-2026-09-01/reel.md' },
  fmt_caos_calma: { id: 'fmt_t_2', arquivo: 'marketing/conteudo/reel-nota-fiscal-facil-2026-09-01/reel.md' },
  fmt_giro_manchetes: { id: 'fmt_t_3', arquivo: 'marketing/conteudo/reel-noticias-setembro-2026-09-01/reel.md' },
  fmt_traduzindo: { id: 'fmt_t_4' },
  fmt_texto_sem_rosto: { id: 'fmt_t_5' },
  fmt_tela_legenda: { id: 'fmt_t_6' },
};

const clonar = (x) => structuredClone(x);

// completa as chaves que faltam sem mudar a ordem das existentes (JSON estável entre boots)
function padroes(obj, pad) {
  for (const [k, v] of Object.entries(pad)) if (!(k in obj)) obj[k] = clonar(v);
  return obj;
}

const FORMATO_PADRAO = {
  codigo: '', categoria: '', nome: '', formula: '', descricao: '', publico: 'MEI + ME', duracao: '',
  estrutura: [], exemplo: { titulo: '', gancho: '', tela: '', destaque: '' }, referencia: null,
  origem: 'curadoria', fontes: [], evidencias: [],
};
const IDEIA_PADRAO = {
  titulo: '', descricao: '', tipo: null, tema: null, formatoId: null, publico: 'MEI + ME', gancho: '', estiloGancho: '',
  roteiroBase: roteiroBaseVazio(), fontes: [], notas: '', origem: 'curadoria', referencia: null, favorita: false, reelId: null,
};
const REEL_PADRAO = {
  ideia: '', tema: '', pilar: null, formatoId: null, campanhaId: CAMPANHA_PADRAO, data: '', status: 'ideia',
  roteiro: { hook: '', textoTela: '', cenas: [], desenvolvimento: '', cta: '' }, legenda: '', permalink: '',
  metricas: null, ideiaId: null, favorito: false,
  // 23/09: tipo do funil (vendas | viralizacao | ensino), detalhes de gravação e fontes
  tipo: null, gravacao: gravacaoVazia(), fontes: [],
  // 24/09: estrutura das peças que não são reel (peca, peca2 e bloco saem de formaPeca)
  carrossel: carrosselVazio(), estatico: estaticoVazio(), stories: storiesVazio(),
};

// peça (reel, carrossel, estático, stories) e bloco, no lugar. peca que falta sai do formato escrito
// pelo calendário (formatoTexto); sem ele, é reel (tudo antes de 24/09 era reel). bloco que falta sai
// do pilar; o que existe fica, só com a grafia da planilha ("Educação/Dor" vira "Educação")
function formaPeca(r) {
  if (!PECAS.includes(r.peca)) {
    const d = pecasDoTexto(r.formatoTexto);
    r.peca = d.peca;
    if (!('peca2' in r)) r.peca2 = d.peca2;
  }
  if (!('peca2' in r) || (r.peca2 != null && !PECAS.includes(r.peca2)) || r.peca2 === r.peca) r.peca2 = null;
  if (!('bloco' in r) || r.bloco === '') r.bloco = blocoDoPilar(r.pilar);
  else if (r.bloco != null) r.bloco = blocoCanonico(r.bloco) ?? blocoDoPilar(r.pilar);
  // estrutura quebrada (editada à mão no JSON) volta pro vazio em vez de derrubar a tela
  for (const [k, limpar, vazio] of [['carrossel', limparCarrossel, carrosselVazio], ['estatico', limparEstatico, estaticoVazio], ['stories', limparStories, storiesVazio]]) {
    try { r[k] = limpar(r[k]); } catch { r[k] = vazio(); }
  }
  return r;
}

// stories do dia (28/09): a forma que a tela espera. A validação de verdade é a do validar.mjs
const STORIES_DIA_PADRAO = {
  data: '', objetivo: 'engajamento', pilar: null, bloco: null, tema: '', pecaDoDia: null, quadros: [], cta: '', fontes: [], notas: '', status: 'ideia',
};
function formaStoriesDia(s) {
  padroes(s, STORIES_DIA_PADRAO);
  if (!['engajamento', 'vendas'].includes(s.objetivo)) s.objetivo = 'engajamento';
  if (!['ideia', 'pronto', 'publicado'].includes(s.status)) s.status = 'ideia';
  if (!Array.isArray(s.quadros)) s.quadros = [];
  s.quadros = s.quadros.filter((q) => q && typeof q === 'object' && !Array.isArray(q));
  if (!Array.isArray(s.fontes)) s.fontes = [];
  return s;
}

// travessão e meia-risca em qualquer texto da peça (regra dura): some no boot, em todo campo. Menos no caminho do
// vídeo final (videos[].arquivo, 02/10): ele é o nome do arquivo no disco e, trocado por vírgula, o vídeo aparecia
// como faltando. Rótulo e aviso do vídeo seguem a regra; na tela, o nome do arquivo passa pelo esc(), que já troca
const TEM_TRACO = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
export function semTracosFundo(v, chave = '') {
  if (typeof v === 'string') return TEM_TRACO.test(v) ? semTracos(v) : v;
  if (Array.isArray(v)) return v.map((x) => (chave === 'videos' ? videoSemTracos(x) : semTracosFundo(x)));
  if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) v[k] = semTracosFundo(v[k], k);
    return v;
  }
  return v;
}
function videoSemTracos(x) {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return semTracosFundo(x);
  for (const k of Object.keys(x)) if (k !== 'arquivo') x[k] = semTracosFundo(x[k], k);
  return x;
}

// ---------- conversão única das peças do calendário (24/09) ----------
// Roda uma vez (db.migracoes). Onde o roteiro já foi escrito como carrossel ou estático (cenas "Slide N")
// e a peça não tem reel, o texto passa pra estrutura do tipo, sem mudar uma palavra: gancho vira o título
// da capa (ou a headline), a fala de cada slide vira o texto e a cena vira o visual. O roteiro de reel
// dessas peças fica vazio (o backup db.antes-pecas.json guarda o de antes). Stories que o checklist do
// reel já descreve ("Stories do mesmo dia: 4 quadros (...) com o mesmo texto de tela") ganham os quadros
// com o texto de tela das primeiras cenas. O gatilho volta a ser o da planilha: o aviso de preço que a
// importação tinha colado nele já está nas notas
export const MIGRACAO_PECAS = 'pecas-2026-09-24';
const ehSlide = (c) => /^slide\s*\d+$/i.test(String(c?.tempo ?? '').trim());
const aparar = (s) => String(s ?? '').trim();
const semInicio = (t, inicio) => (aparar(inicio) && aparar(t).startsWith(aparar(inicio)) ? aparar(t).slice(aparar(inicio).length).trim() : aparar(t));
const frases = (t) => aparar(t).match(/[^.!?]+(?:[.!?]+["'”]?|$)/g)?.map(aparar).filter(Boolean) ?? [];
const semPontoFinal = (s) => aparar(s).replace(/[.!?:]+$/, '').trim();
// tira a CTA do fim do texto: igual à CTA, ou a última frase é a CTA sem o complemento depois dos dois-pontos
function semCta(t, cta) {
  const texto = aparar(t);
  const c = aparar(cta);
  if (!c) return texto;
  if (texto.endsWith(c)) return texto.slice(0, -c.length).trim();
  const fs = frases(texto);
  if (fs.length > 1 && semPontoFinal(fs.at(-1)) === semPontoFinal(c.split(':')[0])) return fs.slice(0, -1).join(' ');
  return texto;
}

const PRECO_NO_GATILHO = /[.\s]*Conferir preço com o Pedro antes de produzir\.$/;

export function converterPeca(r) {
  const mudou = [];
  const tipos = [r.peca, r.peca2].filter(Boolean);
  const ro = r.roteiro ?? {};
  const cenas = Array.isArray(ro.cenas) ? ro.cenas : [];
  const vazioCarrossel = JSON.stringify(r.carrossel) === JSON.stringify(carrosselVazio());
  const vazioEstatico = JSON.stringify(r.estatico) === JSON.stringify(estaticoVazio());
  if (cenas.length && cenas.every(ehSlide) && !tipos.includes('reel')) {
    if (cenas.length === 1 && tipos.includes('estatico') && vazioEstatico) {
      const c = cenas[0];
      r.estatico = limparEstatico({
        headline: ro.hook,
        apoio: semCta(semInicio(c.fala, ro.hook), ro.cta),
        visual: c.cena,
        cta: ro.cta,
      });
      mudou.push('estático');
    } else if (tipos.includes('carrossel') && vazioCarrossel) {
      const slide = (c) => ({ titulo: '', texto: aparar(c.fala), visual: aparar(c.cena) });
      const [primeira, ...resto] = cenas;
      const ultima = resto.length ? resto.pop() : null;
      r.carrossel = limparCarrossel({
        capa: { titulo: ro.hook, texto: semInicio(primeira.fala, ro.hook), visual: primeira.cena },
        slides: resto.map(slide),
        final: ultima ? slide(ultima) : { titulo: '', texto: '', visual: '' },
      });
      mudou.push('carrossel');
    }
    if (mudou.length) r.roteiro = { hook: '', textoTela: '', cenas: [], desenvolvimento: '', cta: '' };
  }
  const quadros = r.stories?.quadros ?? [];
  if (tipos.includes('stories') && tipos.includes('reel') && !quadros.length) {
    const item = (r.gravacao?.checklist ?? []).find((x) => /^stories do mesmo dia:\s*\d+\s+quadros\b.*mesmo texto de tela/i.test(x));
    const n = Number(item?.match(/(\d+)\s+quadros/i)?.[1] ?? 0);
    const telas = cenas.slice(0, n).map((c) => aparar(c.tela));
    if (n && telas.length === n && telas.every(Boolean)) {
      r.stories = limparStories({ quadros: telas.map((texto) => ({ texto, visual: '', interacao: '' })) });
      mudou.push('stories');
    }
  }
  if (r.calendario && PRECO_NO_GATILHO.test(r.gatilho ?? '') && /Conferir preço com o Pedro/.test(r.notas ?? '')) {
    r.gatilho = r.gatilho.replace(PRECO_NO_GATILHO, '');
    mudou.push('gatilho');
  }
  return mudou;
}

// formato.tipos vem do guia quando falta. Lista vazia de formato nunca editado também é preenchida
// (o guia pode ganhar o formato depois); o que o usuário editou (atualizadoEm) fica como está
function comTipos(f) {
  if (Array.isArray(f.tipos) && (f.tipos.length || f.atualizadoEm)) {
    f.tipos = [...new Set(f.tipos.filter((t) => TIPOS_REEL.includes(t)))];
    return f;
  }
  const doGuia = guia().formatoTipos.find((x) => x.formatoId === f.id)?.tipos ?? [];
  f.tipos = doGuia.filter((t) => TIPOS_REEL.includes(t));
  return f;
}

// no lugar: campos novos da ideia (tipo, estiloGancho, roteiroBase, notas) e o tema antigo mapeado
function formaIdeia(i) {
  padroes(i, IDEIA_PADRAO);
  if (Object.hasOwn(TEMA_LEGADO, i.tema)) i.tema = TEMA_LEGADO[i.tema];
  if (i.tema === '') i.tema = null;
  if (i.tipo != null && !TIPOS_REEL.includes(i.tipo)) i.tipo = null;
  if (!i.roteiroBase || typeof i.roteiroBase !== 'object' || Array.isArray(i.roteiroBase)) i.roteiroBase = roteiroBaseVazio();
  for (const k of ROTEIRO_BASE) if (typeof i.roteiroBase[k] !== 'string') i.roteiroBase[k] = '';
  if (typeof i.notas !== 'string') i.notas = '';
  return i;
}

export const normFormato = (f) => comTipos(padroes(clonar(f), FORMATO_PADRAO));
export const normIdeia = (i) => formaIdeia(padroes(clonar(i), { ...IDEIA_PADRAO, criadaEm: agora() }));
export const normReel = (r) => padroes(r, REEL_PADRAO);

// estilos.json → db.guia(). Ausente ou quebrado: guia vazio (o app sobe, sem estilos nem temas)
export async function lerGuia() {
  const bruto = await lerJson('estilos.json', null);
  const ok = Boolean(bruto) && typeof bruto === 'object' && !Array.isArray(bruto);
  if (!ok) console.error('data/estilos.json ausente ou ilegível: o app sobe sem os guias de estilo e sem os temas do nicho.');
  const estilos = {};
  for (const k of ESTILOS) if (ok && bruto.estilos?.[k] && typeof bruto.estilos[k] === 'object') estilos[k] = bruto.estilos[k];
  const g = {
    estilos,
    temas: ok && Array.isArray(bruto.temas) ? bruto.temas.filter((t) => t && typeof t.id === 'string' && t.id) : [],
    formatoTipos: ok && Array.isArray(bruto.formatoTipos) ? bruto.formatoTipos.filter((x) => x && typeof x.formatoId === 'string' && Array.isArray(x.tipos)) : [],
    rotulosTema: ok && bruto.rotulosTema && typeof bruto.rotulosTema === 'object' && !Array.isArray(bruto.rotulosTema) ? bruto.rotulosTema : {},
  };
  definirGuia(g);
  return g;
}

function lista(json, chave) {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json[chave])) return json[chave];
  return [];
}

function formatoPorArquivo(arquivo, formatosV1 = []) {
  if (!arquivo) return null;
  for (const [v1, { id, arquivo: a }] of Object.entries(FORMATOS_V1)) {
    if (a === arquivo) return id;
    if (formatosV1.some((f) => f.id === v1 && f.origem === arquivo)) return id;
  }
  return null;
}

export function mesclar(db, colecao, entradas, normalizar) {
  db.sementes ??= {};
  const vistos = new Set(db.sementes[colecao] ?? []);
  const lugar = new Map(db[colecao].map((x, i) => [x.id, i]));
  let novos = 0;
  let atualizados = 0;
  for (const bruto of entradas) {
    if (!bruto || typeof bruto !== 'object' || typeof bruto.id !== 'string' || !bruto.id) continue;
    const i = lugar.get(bruto.id);
    if (i === undefined) {
      if (vistos.has(bruto.id)) continue; // o usuário apagou: não ressuscita
      db[colecao].push(normalizar(bruto));
      lugar.set(bruto.id, db[colecao].length - 1);
      novos++;
    } else {
      const atual = db[colecao][i];
      if (!atual.atualizadoEm) {
        const datas = Object.fromEntries(['criadoEm', 'criadaEm'].filter((k) => k in atual && !(k in bruto)).map((k) => [k, atual[k]]));
        // favoritar e o vínculo com o reel são estado do usuário, não edição do texto:
        // não congelam a entrada, mas também não podem voltar pro valor do arquivo
        const doUsuario = Object.fromEntries(['favorita', 'reelId'].filter((k) => k in atual).map((k) => [k, atual[k]]));
        const novo = normalizar({ ...bruto, ...datas, ...doUsuario });
        if (JSON.stringify(novo) !== JSON.stringify(atual)) {
          db[colecao][i] = novo;
          atualizados++;
        }
      }
    }
    vistos.add(bruto.id);
  }
  db.sementes[colecao] = [...vistos];
  return { novos, atualizados };
}

// o merge de ideias.json do boot (também usado pelo importar-nicho.mjs, pra dar no mesmo)
export function mesclarIdeias(db, entradas) {
  const formatoVivo = (id) => db.formatos.some((f) => f.id === id);
  const normIdeiaViva = (x) => {
    const n = normIdeia(x);
    if (n.formatoId && !formatoVivo(n.formatoId)) n.formatoId = null;
    return n;
  };
  return mesclar(db, 'ideias', entradas, normIdeiaViva);
}

// 1.1 < 1.2 < 2.1 < ... < 12.2, e os testes (T.x) no fim
function ordemFormato(f) {
  const [a, b] = String(f.codigo ?? '').split('.');
  const teste = f.origem === 'teste' || a === 'T';
  return [teste ? 1 : 0, teste ? 0 : Number(a) || 999, Number(b) || 999];
}
function ordenarFormatos(formatos) {
  return formatos
    .map((f, i) => ({ f, i, k: ordemFormato(f) }))
    .sort((x, y) => x.k[0] - y.k[0] || x.k[1] - y.k[1] || x.k[2] - y.k[2] || x.i - y.i)
    .map((x) => x.f);
}

const resumoCaption = (s, n = 80) => {
  const linha = (String(s ?? '').split('\n').map((l) => l.trim()).find(Boolean) ?? '').replace(TRACOS, ', ');
  return linha.length > n ? linha.slice(0, n - 1).trimEnd() + '…' : linha;
};

function base(seed) {
  const { _leia, ...resto } = clonar(seed ?? {});
  return {
    schemaVersion: 2,
    config: { ...CONFIG_PADRAO, ...(resto.config ?? {}) },
    pilares: resto.pilares ?? [],
    campanhas: resto.campanhas?.length ? resto.campanhas : [clonar(CAMPANHA_PRELANCAMENTO)],
    formatos: (resto.formatos ?? []).map(normFormato),
    cases: resto.cases ?? [],
    ideias: resto.ideias ?? [],
    reels: resto.reels ?? [],
    instagram: { conta: null, proprios: [], inspiracoes: [], sincronizadoEm: null, erros: [], ...(resto.instagram ?? {}) },
  };
}

function deV1(v1, seed) {
  const db = base(seed);
  const testes = new Map(db.formatos.map((f) => [f.id, f]));
  const mapa = (id) => FORMATOS_V1[id]?.id ?? id;

  // formatos: os 6 da v1 viram T.1..T.6 (com as evidências que o usuário tiver posto);
  // formato criado pelo usuário na v1 vira mais um teste
  const formatos = [];
  let n = Math.max(0, ...[...testes.values()].map((f) => Number(String(f.codigo).split('.')[1]) || 0));
  for (const f of v1.formatos ?? []) {
    const evid = (f.evidencias ?? []).filter((e) => !e.radarId); // as do radar viram case abaixo
    const alvo = testes.get(FORMATOS_V1[f.id]?.id);
    if (alvo) {
      const t = clonar(alvo);
      if (evid.length) Object.assign(t, { evidencias: evid, atualizadoEm: agora() });
      formatos.push(t);
      testes.delete(t.id);
    } else if (!f.id?.startsWith('fmt_t_')) {
      n++;
      const { origem, ...resto } = f;
      formatos.push(normFormato({ ...resto, codigo: `T.${n}`, categoria: 'Nossos testes', origem: 'teste', referencia: null, fontes: origem ? [origem] : [], evidencias: evid }));
    }
  }
  // teste do seed que não existia na v1 também entra
  formatos.push(...testes.values());

  const reels = (v1.reels ?? []).map((r) =>
    normReel({ ...r, formatoId: r.formatoId ? mapa(r.formatoId) : formatoPorArquivo(r.origem, v1.formatos), campanhaId: CAMPANHA_PADRAO })
  );

  // radar vira instagram; reel classificado num formato vira case
  const radar = v1.radar ?? {};
  const cases = [];
  const itens = (radar.reels ?? []).map((r) => {
    const item = {
      midiaId: r.id, conta: r.conta ?? '', origem: r.proprio ? 'nosso' : 'nicho', permalink: r.permalink ?? '',
      caption: r.caption ?? '', timestamp: r.timestamp ?? null, thumb: r.thumb ?? '', views: r.views ?? null,
      reach: r.reach ?? null, saved: r.saved ?? null, shares: r.shares ?? null, likes: r.likes ?? null,
      comments: r.comments ?? null, relativo: r.relativo ?? null, semRegua: false, caseId: null,
    };
    if (r.formatoId) {
      // legenda de outra conta é texto de terceiro: não vira título (o título entra no prompt da IA)
      const c = {
        id: novoId('case'), formatoId: mapa(r.formatoId), titulo: (item.origem === 'nosso' && resumoCaption(r.caption)) || `Reel de @${item.conta}`,
        conta: item.conta, origem: item.origem, permalink: item.permalink, thumb: item.thumb, views: item.views,
        likes: item.likes, comments: item.comments, saved: item.saved, shares: item.shares, relativo: item.relativo,
        data: item.timestamp?.slice(0, 10) ?? '', notas: 'Classificado no Radar da v1', midiaId: item.midiaId,
        reelId: null, criadoEm: agora(),
      };
      cases.push(c);
      item.caseId = c.id;
    }
    return item;
  });

  return {
    ...db,
    config: { ...db.config, ...(v1.config ?? {}) },
    pilares: v1.pilares?.length ? v1.pilares : db.pilares,
    formatos,
    cases,
    ideias: [],
    reels,
    instagram: {
      conta: null,
      proprios: itens.filter((x) => x.origem === 'nosso'),
      inspiracoes: itens.filter((x) => x.origem !== 'nosso'),
      contas: radar.contas ?? [],
      sincronizadoEm: radar.sincronizadoEm ?? null,
      erros: radar.erros ?? [],
    },
    importadoEm: v1.importadoEm ?? agora(),
    migradoDaV1Em: agora(),
    // os testes do seed já "entraram": se o usuário apagar um, ele não volta
    sementes: { formatos: db.formatos.map((f) => f.id), ideias: [] },
  };
}

// campos que surgiram depois: completa sem mexer no que já existe
function garantirForma(db, seed) {
  db.schemaVersion = 2;
  db.config = padroes(db.config ?? {}, { ...CONFIG_PADRAO, ...(seed.config ?? {}) });
  // nome que não é texto (editado à mão ou por API antiga) quebraria a saudação da home
  if (typeof db.config.nomeUsuario !== 'string' || !db.config.nomeUsuario.trim()) db.config.nomeUsuario = 'Pedro';
  if (!db.config.handleInstagram) db.config.handleInstagram = HANDLE_OFICIAL;
  for (const k of ['pilares', 'campanhas', 'formatos', 'cases', 'ideias', 'reels']) if (!Array.isArray(db[k])) db[k] = [];
  if (!db.pilares.length && seed.pilares) db.pilares = clonar(seed.pilares);
  for (const p of PILARES_NOVOS) if (!db.pilares.some((x) => x.id === p.id)) db.pilares.push(clonar(p));
  if (!db.campanhas.length) db.campanhas = [clonar(CAMPANHA_PRELANCAMENTO)];
  db.instagram = padroes(db.instagram ?? {}, { conta: null, proprios: [], inspiracoes: [], sincronizadoEm: null, erros: [] });
  // pilares no bloco da planilha do calendário (Afeto, Educação, Diferencial, Conversão)
  for (const p of db.pilares) {
    const b = BLOCO_DO_PILAR[p.id] ?? blocoCanonico(p.bloco);
    if (b && p.bloco !== b) p.bloco = b;
  }
  for (const f of db.formatos) comTipos(padroes(f, FORMATO_PADRAO));
  for (const i of db.ideias) formaIdeia(i);
  for (const r of db.reels) formaPeca(semTracosFundo(normReel(r)));
  // 28/09: stories do dia (um por data, aplicar-stories.mjs). Item editado à mão no JSON ganha as chaves que
  // faltam em vez de derrubar a tela
  if (!Array.isArray(db.stories)) db.stories = [];
  for (const s of db.stories) if (s && typeof s === 'object' && !Array.isArray(s)) formaStoriesDia(semTracosFundo(s));
  delete db._leia;
  delete db.radar;
  return db;
}

export async function migrar() {
  await lerGuia();
  const seed = (await lerJson('seed.json', {})) ?? {};
  const biblioteca = lista(await lerJson('biblioteca.json', []), 'formatos');
  const ideiasSemente = lista(await lerJson('ideias.json', []), 'ideias');

  let db = null;
  let antes = '';
  if (existsSync(DB_PATH)) {
    antes = await readFile(DB_PATH, 'utf8');
    try {
      db = JSON.parse(antes);
    } catch (e) {
      // nunca sobrescreve um banco quebrado com a semente: melhor parar e avisar
      throw new Error(`data/db.json está corrompido (${e.message}). Restaure de um backup antes de subir o servidor.`);
    }
  }

  if (!db) {
    db = base(seed);
    for (const r of await listarReelsDoDisco()) {
      db.reels.push(normReel({ id: novoId('reel'), ...r, formatoId: formatoPorArquivo(r.origem), campanhaId: CAMPANHA_PADRAO }));
    }
    db.importadoEm = agora();
    console.log(`Banco novo a partir do seed (${db.reels.length} reels importados do disco)`);
  } else if (!db.schemaVersion) {
    const backup = arquivoDados('db.v1.backup.json');
    if (!existsSync(backup)) await copyFile(DB_PATH, backup);
    db = deV1(db, seed);
    console.log(`Migração v1 → v2: ${db.formatos.length} formatos de teste, ${db.reels.length} reels na campanha Pré-lançamento`);
  }

  garantirForma(db, seed);
  // conversão única das peças (24/09): antes de gravar, o banco de antes fica em db.antes-pecas.json
  db.migracoes ??= [];
  let backupPecas = false;
  if (!db.migracoes.includes(MIGRACAO_PECAS)) {
    const convertidas = db.reels.map((r) => [r, converterPeca(r)]).filter(([, m]) => m.length);
    for (const [r, m] of convertidas) console.log(`Peça ${r.id} (${r.data || 'sem data'}): ${m.join(', ')}`);
    db.migracoes.push(MIGRACAO_PECAS);
    backupPecas = Boolean(antes) && !existsSync(arquivoDados('db.antes-pecas.json'));
  }
  const t = mesclar(db, 'formatos', (seed.formatos ?? []).filter((f) => f.id), normFormato);
  const b = mesclar(db, 'formatos', biblioteca, normFormato);
  // ideia não pode apontar pra formato que não existe (apagado pelo usuário, ou ainda não escrito
  // na biblioteca). Checado dentro do normalizador, antes da comparação: sem "N atualizadas" falso,
  // e o banco que já está nesse estado se conserta no boot. Os formatos já foram mesclados acima
  const i = mesclarIdeias(db, ideiasSemente);
  db.formatos = ordenarFormatos(db.formatos);
  if (b.novos + b.atualizados + t.novos + t.atualizados) console.log(`Biblioteca: ${b.novos + t.novos} formatos novos, ${b.atualizados + t.atualizados} atualizados`);
  if (i.novos + i.atualizados) console.log(`Banco de ideias: ${i.novos} novas, ${i.atualizados} atualizadas`);

  const depois = JSON.stringify(db, null, 2);
  if (backupPecas) await copyFile(DB_PATH, arquivoDados('db.antes-pecas.json'));
  if (depois !== antes) await gravarJson('db.json', db);
  return db;
}

if (import.meta.main) {
  const db = await migrar();
  console.log(
    `db.json v${db.schemaVersion}: ${db.formatos.length} formatos (${db.formatos.filter((f) => f.tipos?.length).length} com tipos), ${db.ideias.length} ideias, ${db.reels.length} reels, ${db.cases.length} cases, ${db.campanhas.length} campanha(s)`
  );
}
