// 22/10 (Pedro): o editor de design do Ateliê, "um Canva básico" (#/atelie?design=<id>). Desktop primeiro:
// à esquerda os assets e as camadas (painel-esq.js), no meio a página com zoom, encaixe e guias, embaixo a faixa de
// páginas (carrossel), à direita as propriedades (painel-dir.js). Barra de cima: título, desfazer e refazer, zoom,
// área segura, avisos das regras do Pedro, alertas do mecanismo, versões, peça vinculada, IA e exportar (dialogos.js).
// Salva sozinho (1,2 s depois da última mudança) mandando a versão; 409 = alguém mexeu e a tela avisa.
// No celular (menos de 900 px) vira prévia com exportar: editar pede o computador.
// A página é desenhada pelo render.js (o mesmo da exportação): o que se vê é o que se exporta. As alças, guias,
// área segura e avisos ficam numa camada por cima (.est-sobre), em pixels de tela, e nunca vão pro arquivo.
// 22/10 (Pedro, "use com base no original"): do Ateliê original vieram o alinhar várias como bloco ou entre si, o
// tamanho das escolhidas junto, o espaço fixo entre camadas, o estilo rápido de texto e o A+ e A-, o fundo rápido e as
// páginas de um modelo (estudio/base/modelos); o clique atravessa as camadas de fundo (Alt pega elas).
import { esc, toast, lerLocal, gravarLocal, store, reel as reelDoStore, fmtData, rotuloPeca, semTraco } from '../core.js';
import * as M from './modelo.js';
import { sincronizarPagina, miniaturaEl, urlTelaDoAsset, urlMiniaturaDoAsset } from './render.js';
import { carregarFontes } from './fontes.js';
import * as A from './api.js';
import { ic } from './icones.js';
import { montarPropriedades } from './painel-dir.js';
import { montarEsquerda } from './painel-esq.js';
import { abrirExportar, abrirVersoes, abrirVincular, abrirGerarIA, exportarRapido, avisosDaGeracao, abrirModelos } from './dialogos.js';

const ZOOM_MAX = 2;
const ZOOM_MIN = 0.25;
const ESPERA_SALVAR = 1200;
const LIMIAR_ENCAIXE = 6; // px de tela
const HIST_MAX = 150;
const CELULAR = matchMedia('(max-width: 899px)');
const TRACO = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
const ehCampo = (el) => el instanceof Element && (el.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') != null);

export function rotuloDaPeca(id) {
  if (!id) return '';
  const r = reelDoStore(id);
  if (r) return `${r.data ? fmtData(r.data) : 'sem data'} · ${rotuloPeca(r)} · ${r.ideia ?? ''}`.trim();
  const s = (store.E?.stories ?? []).find((x) => x.id === id);
  if (s) return `${s.data ? fmtData(s.data) : 'sem data'} · Stories do dia · ${s.tema ?? ''}`;
  return 'Peça que não está mais no cronograma';
}

// ── contas sem DOM (o teste do Node usa: server/testes/front-estudio-editor.test.mjs) ──
const TOL_SEGURA = 0.5;
const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// 22/10 (achado da revisão): aumentar o Léo e os papéis juntos sem estourar a área segura. caixa: o bloco (sem o que é
// fundo); (ax, ay): o ponto que fica parado (o canto oposto, na alça do grupo). Só trava o lado que estava dentro da
// área (o busto de corte reto colado na base, ou o que a pessoa já pôs fora, não segura nada). Diminuir nunca trava.
// Devolve a escala que vale, se parou na margem e a margem que parou (pra guia)
export function escalaComAncora(caixa, k, area, ax, ay) {
  if (!caixa || !area || !(k > 1)) return { k, parou: false, limite: null };
  let max = Infinity;
  let limite = null;
  const lado = (b, a, lim, baixo, eixo) => {
    const dentro = baixo ? b >= lim - TOL_SEGURA : b <= lim + TOL_SEGURA;
    const anda = baixo ? a - b : b - a;
    if (!dentro || anda <= 1e-9) return;
    const m = (baixo ? a - lim : lim - a) / anda;
    if (m < max) { max = m; limite = { eixo, v: lim }; }
  };
  lado(caixa.x0, ax, area.x0, true, 'x');
  lado(caixa.x1, ax, area.x1, false, 'x');
  lado(caixa.y0, ay, area.y0, true, 'y');
  lado(caixa.y1, ay, area.y1, false, 'y');
  if (k <= max) return { k, parou: false, limite: null };
  return { k: Math.max(1, max), parou: true, limite };
}

// o mesmo pelo centro (o campo de % e o 5% maior): o bloco cresce em volta do centro (cx, cy); o lado que passaria da
// margem empurra o bloco pro lado que tem espaço (dx, dy); maior que a área segura num eixo, para no tamanho que cabe
export function escalaPeloCentro(caixa, k, area, cx, cy) {
  if (!caixa || !area || !(k > 0)) return { k, dx: 0, dy: 0, parou: false };
  const eixo = (lo, hi, c, l0, l1) => ({ lo, hi, c, l0, l1, dentroLo: lo >= l0 - TOL_SEGURA, dentroHi: hi <= l1 + TOL_SEGURA });
  const ex = eixo(caixa.x0, caixa.x1, cx, area.x0, area.x1);
  const ey = eixo(caixa.y0, caixa.y1, cy, area.y0, area.y1);
  let kv = k;
  if (k > 1) {
    for (const e of [ex, ey]) {
      if (e.dentroLo && e.dentroHi && e.hi - e.lo > 1e-9) kv = Math.min(kv, (e.l1 - e.l0) / (e.hi - e.lo));
    }
    kv = Math.max(1, kv);
  }
  const desloca = (e) => {
    if (kv <= 1) return 0;
    const lo = e.c + (e.lo - e.c) * kv;
    const hi = e.c + (e.hi - e.c) * kv;
    let d = 0;
    if (e.dentroLo && lo < e.l0) d = e.l0 - lo;
    if (e.dentroHi && hi + d > e.l1) d -= hi + d - e.l1;
    return d;
  };
  return { k: kv, dx: desloca(ex), dy: desloca(ey), parou: kv < k - 1e-9 };
}

// 22/10 (achado da revisão): a imagem nova da troca cabe na caixa antiga (contain), com o mesmo centro: a pose mais
// larga do Léo fica mais baixa no mesmo lugar, nunca sai da área segura nem encosta no vizinho
export function caixaContida(c, largura, altura) {
  const k = Math.min(c.largura / largura, c.altura / altura);
  const w = Math.max(1, Math.round(largura * k * 10) / 10);
  const h = Math.max(1, Math.round(altura * k * 10) / 10);
  const cx = c.x + c.largura / 2;
  const cy = c.y + c.altura / 2;
  return { x: Math.round((cx - w / 2) * 10) / 10, y: Math.round((cy - h / 2) * 10) / 10, largura: w, altura: h };
}

// 22/10 (achado da revisão): a exceção do busto de corte reto (colado na borda de baixo da página) marcada no USO da
// imagem, não no asset inteiro: a camada com "corte reto" no nome (o Léo do Destaque 01 sai pela base de propósito).
// O mesmo critério do asset (modelo.js, ehCorteReto): só na base, e só colado na borda de baixo da página
export const corteRetoNoUso = (c) => c?.tipo === 'imagem' && /\bcorte reto\b/.test(semAcento(c.nome));
export function semExcecaoDoUso(avisos, doc, pagina) {
  const a = M.areaSegura(doc);
  const livres = new Set(pagina.camadas.filter((c) => {
    if (!corteRetoNoUso(c)) return false;
    const b = M.caixaGirada(c);
    return b.x0 >= a.x0 - TOL_SEGURA && b.x1 <= a.x1 + TOL_SEGURA && b.y0 >= a.y0 - TOL_SEGURA && b.y1 >= doc.altura - 1;
  }).map((c) => c.id));
  if (!livres.size) return avisos;
  return avisos.filter((av) => !(av.regra === 'area-segura' && av.camadas.length === 1 && livres.has(av.camadas[0])));
}

// 22/10 (achado da revisão): o logo e o símbolo (imagem da categoria Marca) também precisam aparecer no fundo. A tinta
// que desenha cada peça da marca do banco: o logo horizontal e o em tinta são tinta, o símbolo é coral, o branco e o
// símbolo negativo são brancos. Peça da marca subida pelo time (sem esse nome) fica de fora. A marca é forma grande e
// chapada: o mínimo é 2:1 (o símbolo coral no papel, 2,9:1, é o uso de sempre; o logo em tinta no escuro dá 1,1:1)
export function tintaDaMarca(a) {
  if (a?.categoria !== 'marca') return null;
  const s = semAcento(`${a.id} ${a.nome} ${(a.tags ?? []).join(' ')}`);
  if (/\bbranco\b|negativo-claro|simbolo-negativo/.test(s)) return '#FFFFFF';
  if (/simbolo/.test(s)) return '#F2643C';
  if (/logo|tinta/.test(s)) return '#1B1E24';
  return null;
}
// o que fica atrás da camada: o fundo da página (no de imagem, a cor por trás) e os cards que a contêm, de baixo pra
// cima (a mesma conta do contraste do texto, modelo.js); null quando não dá pra ler a cor
function coresAtras(pagina, c) {
  const f0 = pagina.fundo;
  let atras = f0.tipo === 'gradiente' ? [f0.cor, f0.cor2] : [f0.cor];
  const i = pagina.camadas.indexOf(c);
  const b = M.caixaGirada(c);
  for (const o of pagina.camadas.slice(0, Math.max(0, i))) {
    if (o.oculta || o.tipo !== 'forma' || o.forma === 'linha' || !(o.opacidade > 0)) continue;
    if (!M.contem(M.caixaGirada(o), b)) continue;
    atras = atras.map((k) => M.comporCor(o.cor, k, o.opacidade));
  }
  return atras.every((k) => M.rgbaDe(k)) ? atras : null;
}
export function avisosDaMarca(doc, pagina, assetsPorId = new Map()) {
  const out = [];
  for (const c of pagina.camadas) {
    if (c.tipo !== 'imagem' || c.oculta || !(c.opacidade > 0)) continue;
    const a = assetsPorId.get(c.assetId);
    const tinta = tintaDaMarca(a);
    const atras = tinta ? coresAtras(pagina, c) : null;
    if (!atras) continue;
    const pior = Math.min(...atras.map((k) => M.contraste(M.comporCor(tinta, k, c.opacidade), k)));
    if (pior >= 2) continue;
    const escuro = M.corEscura(atras[0]);
    const dica = tinta === '#FFFFFF' ? 'no fundo claro vai a versão de tinta ou coral' : escuro ? 'no fundo escuro vai a versão branca' : 'troque pela versão que aparece neste fundo';
    out.push({
      regra: 'contraste-marca', nivel: pior < 1.5 ? 'alerta' : 'revisar', camadas: [c.id],
      texto: `"${c.nome}" quase some no fundo (${pior.toFixed(1).replace('.', ',')}:1): ${dica} (categoria Marca)`,
    });
  }
  return out;
}

// 22/10 (achado da revisão): fundo que vira de claro pra escuro (ou o contrário) leva as cores junto, se a pessoa
// quiser. Texto na tinta da marca troca pela do outro lado (ink e #F4F1EC, secundário e #BDB8B0, coral 600 e coral) e
// o logo e o símbolo trocam pela versão do banco que aparece no fundo novo. Texto com pílula própria e o que está em
// cima de um card ficam: o fundo deles não mudou
const CORES_NO_ESCURO = { '#1b1e24': '#F4F1EC', '#524e48': '#BDB8B0', '#dd4e27': '#F2643C' };
const CORES_NO_CLARO = { '#f4f1ec': '#1B1E24', '#bdb8b0': '#524E48', '#f2643c': '#DD4E27', '#ffffff': '#1B1E24' };
const MARCA_NO_ESCURO = { 'ast_base_logo-horizontal': 'ast_base_logo-negativo-claro', 'ast_base_logo-negativo-escuro': 'ast_base_logo-negativo-claro', ast_base_simbolo: 'ast_base_simbolo-negativo' };
const MARCA_NO_CLARO = { 'ast_base_logo-negativo-claro': 'ast_base_logo-horizontal', 'ast_base_simbolo-negativo': 'ast_base_simbolo' };
const opaca = (cor, opacidade = 1) => (M.rgbaDe(cor)?.a ?? 1) * opacidade >= 0.5;
export function trocaDeCores(pagina, escuro, assetsPorId = new Map()) {
  const cores = escuro ? CORES_NO_ESCURO : CORES_NO_CLARO;
  const marca = escuro ? MARCA_NO_ESCURO : MARCA_NO_CLARO;
  const emCard = (c) => {
    const b = M.caixaGirada(c);
    const i = pagina.camadas.indexOf(c);
    return pagina.camadas.slice(0, Math.max(0, i)).some((o) => !o.oculta && o.tipo === 'forma' && o.forma !== 'linha' && opaca(o.cor, o.opacidade) && M.contem(M.caixaGirada(o), b));
  };
  const nova = (k) => cores[String(k ?? '').trim().toLowerCase().slice(0, 7)] ?? null;
  const out = [];
  for (const c of pagina.camadas) {
    if (c.travada || emCard(c)) continue;
    if (c.tipo === 'texto' && !(c.fundo && opaca(c.fundo.cor))) {
      const cor = nova(c.cor);
      const corDestaque = nova(c.corDestaque);
      if (cor || corDestaque) out.push({ id: c.id, ...(cor ? { cor } : {}), ...(corDestaque ? { corDestaque } : {}) });
    } else if (c.tipo === 'imagem' && marca[c.assetId] && assetsPorId.has(marca[c.assetId]) && !assetsPorId.get(marca[c.assetId]).oculto) {
      const a = assetsPorId.get(marca[c.assetId]);
      out.push({ id: c.id, assetId: a.id, nome: String(a.nome ?? c.nome).slice(0, 80) });
    }
  }
  return out;
}

// 22/10 (achado da revisão): a pílula dos Destaques importados é uma forma Pílula atrás de um texto (e do ícone). O
// texto de uma linha dentro dela não quebra: a largura acompanha o texto e a forma cresce junto, com o mesmo respiro.
// A forma: retângulo de ponta redonda, atrás do texto, que contém o texto inteiro e nenhum outro texto
export function pilulaDoTexto(pagina, c) {
  if (c?.tipo !== 'texto' || c.oculta || c.rotacao || c.fundo) return null;
  const i = pagina.camadas.indexOf(c);
  const b = M.caixaGirada(c);
  for (let j = i - 1; j >= 0; j--) {
    const f = pagina.camadas[j];
    if (f.tipo !== 'forma' || f.forma !== 'retangulo' || f.oculta || f.rotacao) continue;
    if (f.raio < Math.min(f.largura, f.altura) / 2 - 1) continue;
    const bf = M.caixaGirada(f);
    if (!M.contem(bf, b, 1)) continue;
    const outros = pagina.camadas.filter((o) => o !== c && o.tipo === 'texto' && !o.oculta && M.contem(bf, M.caixaGirada(o), 1));
    return outros.length ? null : f;
  }
  return null;
}
// a geometria nova do texto e da pílula quando a largura natural do texto muda de w0 pra w1 (o alinhamento diz o
// lado que fica parado: esquerda, centro ou direita); d é o quanto a borda da direita andou
export function acompanharPilula(c0, f0, w0, w1, alinhamento = 'esquerda') {
  const d = w1 - w0;
  const anda = alinhamento === 'centro' ? -d / 2 : alinhamento === 'direita' ? -d : 0;
  const r1 = (v) => Math.round(v * 1000) / 1000;
  return {
    texto: { x: r1(c0.x + anda), largura: r1(Math.max(1, c0.largura + d)) },
    pilula: { x: r1(f0.x + anda), largura: r1(Math.max(1, f0.largura + d)) },
    d: anda === 0 ? d : 0,
  };
}
// as camadas da mesma fileira à direita da pílula (a pílula do lado, com o texto e o ícone dela): andam junto quando
// ela cresce ou encolhe pela direita, como a fileira de chips do original. Fica o que é fundo, o que está dentro dela
// e o que é bem mais alto que a fileira (o Léo do lado não anda)
export function vizinhosDaLinha(pagina, f, doc, assetsPorId = new Map()) {
  const bf = M.caixaGirada(f);
  const h = bf.y1 - bf.y0;
  return pagina.camadas.filter((o) => {
    if (o === f || o.oculta) return false;
    const b = M.caixaGirada(o);
    if (M.contem(bf, b, 1) || M.camadaDeFundo(o, doc, assetsPorId)) return false;
    if (b.x0 < bf.x1 - 0.5 || b.y1 - b.y0 > h * 1.5) return false;
    return Math.min(b.y1, bf.y1) - Math.max(b.y0, bf.y0) >= Math.min(h, b.y1 - b.y0) * 0.5;
  });
}

export function criarEditor(raiz, docId) {
  const no = document.createElement('div');
  no.className = 'est-editor';
  raiz.replaceChildren(no);

  const ed = {
    id: docId, no, doc: null, idx: 0, sel: [],
    zoom: 1, tx: 0, ty: 0, ajustado: true,
    assets: [], assetsPorId: new Map(),
    mostrarSegura: lerLocal('est-segura') !== '0',
    editando: null, trocando: null, avisos: [], mecanismo: null,
    sujo: false, salvando: false, conflito: false, erroSalvar: null,
    copiado: null, colagens: 0, guias: null, medida: null, marquee: null, sobreId: null,
    modo: CELULAR.matches ? 'previa' : 'edicao',
  };
  const hist = { antes: [], depois: [], chave: null, em: 0 };
  let els = {};
  let props = null;
  let esq = null;
  let arr = null; // arrasto em andamento
  let espaco = false;
  let tempoSalvar = null;
  let tempoFaixa = null;
  let tempoMecanismo = null;
  let tempoOferta = null;
  let destruido = false;

  // ── acesso ao documento ──
  ed.pagina = () => ed.doc.paginas[ed.idx];
  ed.camada = (id) => ed.pagina()?.camadas.find((c) => c.id === id) ?? null;
  ed.selecionadas = () => ed.sel.map(ed.camada).filter(Boolean);
  ed.fundoAtual = () => ed.pagina()?.fundo;
  // camada de fundo (luz, partícula, asset da categoria Fundos, faixa que atravessa a página): o clique atravessa
  const ehDeFundo = (c) => M.camadaDeFundo(c, ed.doc, ed.assetsPorId);

  // ── histórico ──
  const instantaneo = () => JSON.stringify({
    titulo: ed.doc.titulo, formato: ed.doc.formato, largura: ed.doc.largura, altura: ed.doc.altura,
    paginas: ed.doc.paginas, idx: ed.idx, sel: ed.sel,
  });
  function aplicarInstantaneo(s) {
    const x = JSON.parse(s);
    Object.assign(ed.doc, { titulo: x.titulo, formato: x.formato, largura: x.largura, altura: x.altura, paginas: x.paginas });
    ed.idx = Math.min(Math.max(0, x.idx), ed.doc.paginas.length - 1);
    ed.sel = x.sel.filter((id) => ed.camada(id));
  }
  // toda mudança passa aqui: guarda o antes (junta as do mesmo campo em sequência), muda e agenda o salvar.
  // 22/10 (achado da revisão): editor destruído não muda mais nada (ouvinte velho de um diálogo, timer que ficou)
  ed.mudar = (fn, { chave = null, redesenhar: partes = 'tudo' } = {}) => {
    if (!ed.doc || destruido) return;
    const agora = performance.now();
    const junta = chave && chave === hist.chave && agora - hist.em < 1500;
    if (!junta) {
      hist.antes.push(instantaneo());
      if (hist.antes.length > HIST_MAX) hist.antes.shift();
      hist.depois = [];
    }
    hist.chave = chave;
    hist.em = agora;
    // 22/10 (achado da revisão): o texto dentro de uma pílula (as dos Destaques) não quebra: a pílula acompanha
    const pilulas = partes === 'tudo' || partes?.pagina ? pilulasDaPagina() : null;
    fn(ed.doc);
    ed.sujar();
    if (partes) ed.redesenhar(partes);
    if (pilulas?.length) acompanharPilulas(pilulas);
  };
  ed.guardarAntes = (chave = null) => {
    hist.antes.push(instantaneo());
    if (hist.antes.length > HIST_MAX) hist.antes.shift();
    hist.depois = [];
    hist.chave = chave;
    hist.em = performance.now();
  };
  ed.desfazer = () => {
    sairDoTexto();
    fecharOferta();
    if (!hist.antes.length) return toast('Nada pra desfazer');
    hist.depois.push(instantaneo());
    aplicarInstantaneo(hist.antes.pop());
    hist.chave = null;
    ed.sujar();
    ed.redesenhar('tudo');
  };
  ed.refazer = () => {
    sairDoTexto();
    fecharOferta();
    if (!hist.depois.length) return toast('Nada pra refazer');
    hist.antes.push(instantaneo());
    aplicarInstantaneo(hist.depois.pop());
    hist.chave = null;
    ed.sujar();
    ed.redesenhar('tudo');
  };

  // ── salvar ──
  // 22/10 (achado da revisão): depois do destruir() nada grava (o design fechado não muda por baixo de quem está em
  // outro); só o último salvo, o que o destruir() manda com ultimo
  ed.sujar = () => {
    if (destruido) return;
    ed.sujo = true;
    pintarEstadoSalvo();
    clearTimeout(tempoSalvar);
    tempoSalvar = setTimeout(salvar, ESPERA_SALVAR);
  };
  async function salvar({ ultimo = false } = {}) {
    clearTimeout(tempoSalvar);
    if (destruido && ultimo !== true) return;
    if (!ed.doc || ed.conflito || !ed.sujo) return;
    if (ed.salvando) { tempoSalvar = setTimeout(salvar, 400); return; }
    ed.salvando = true;
    ed.sujo = false;
    ed.erroSalvar = null;
    pintarEstadoSalvo();
    try {
      const r = await A.salvarDoc(ed.id, M.corpoParaSalvar(ed.doc));
      ed.doc.versao = Number.isFinite(Number(r?.versao)) ? Number(r.versao) : ed.doc.versao + 1;
      if (r?.atualizadoEm) ed.doc.atualizadoEm = r.atualizadoEm;
      if (r?.atualizadoPor) ed.doc.atualizadoPor = r.atualizadoPor;
      if (r?.revisao) { ed.revisao = r.revisao; pintarRevisao(); }
      agendarMecanismo();
    } catch (e) {
      ed.sujo = true;
      if (e.status === 409) {
        ed.conflito = true;
        pintarConflito();
      } else {
        ed.erroSalvar = e.message || 'Não salvou';
        if (!e.parar) tempoSalvar = setTimeout(salvar, 6000);
      }
    } finally {
      ed.salvando = false;
      pintarEstadoSalvo();
      if (ed.sujo && !ed.conflito && !ed.erroSalvar) tempoSalvar = setTimeout(salvar, ESPERA_SALVAR);
    }
  }
  ed.salvarJa = async () => {
    if (ed.conflito) throw new Error('Alguém mexeu neste design: recarregue');
    if (ed.sujo || ed.salvando) {
      while (ed.salvando) await new Promise((r) => setTimeout(r, 120));
      if (ed.sujo) await salvar();
      while (ed.salvando) await new Promise((r) => setTimeout(r, 120));
      if (ed.conflito) throw new Error('Alguém mexeu neste design: recarregue');
      if (ed.sujo) throw new Error(ed.erroSalvar || 'Não consegui salvar agora');
    }
  };
  function pintarEstadoSalvo() {
    const s = els.salvo;
    if (!s) return;
    let txt = 'Salvo';
    let estado = 'ok';
    if (ed.conflito) { txt = 'Não salvou: alguém mexeu'; estado = 'erro'; }
    else if (ed.erroSalvar) { txt = `Não salvou: ${ed.erroSalvar}`; estado = 'erro'; }
    else if (ed.salvando) { txt = 'Salvando…'; estado = 'salvando'; }
    else if (ed.sujo) { txt = 'Alterações não salvas'; estado = 'sujo'; }
    s.dataset.estado = estado;
    s.innerHTML = `${estado === 'ok' ? ic('check', 14) : estado === 'erro' ? ic('alerta', 14) : ''}<span>${esc(txt)}</span>`;
    s.title = `${ed.doc?.versao ? `Versão ${ed.doc.versao}. ` : ''}Salva sozinho a cada mudança. Clique (ou Ctrl+S) pra salvar agora`;
  }
  function pintarConflito() {
    const c = els.conflito;
    if (!c) return;
    c.hidden = !ed.conflito;
    if (!ed.conflito) return;
    c.innerHTML = `
      ${ic('alerta', 18)}
      <div><strong>Alguém mexeu neste design: recarregue.</strong>
      <p>O que você fez desde o último salvo ficou só nesta tela. Recarregar traz a versão de lá; ou guarde a sua como uma cópia.</p></div>
      <button type="button" class="btn btn-sm" data-conflito="copia">${ic('duplicar', 15)}Salvar a minha como cópia</button>
      <button type="button" class="btn btn-primario btn-sm" data-conflito="recarregar">${ic('restaurar', 15)}Recarregar</button>`;
  }
  async function resolverConflito(acao) {
    if (acao === 'recarregar') {
      try {
        const d = await A.lerDoc(ed.id);
        ed.guardarAntes();
        ed.doc = M.normalizarDoc(d);
        ed.idx = Math.min(ed.idx, ed.doc.paginas.length - 1);
        ed.sel = [];
        ed.conflito = false;
        ed.sujo = false;
        ed.erroSalvar = null;
        pintarConflito();
        pintarEstadoSalvo();
        ed.redesenhar('tudo');
        toast('Versão de lá carregada (Ctrl+Z volta a sua na tela)');
      } catch (e) { toast(e.message); }
    } else if (acao === 'copia') {
      try {
        const corpo = M.corpoParaSalvar(ed.doc);
        delete corpo.versao;
        const novo = await A.criarDoc({ ...corpo, titulo: `${ed.doc.titulo} (minha versão)`.slice(0, 160) });
        ed.sujo = false;
        toast('Cópia salva: abrindo');
        location.hash = `#/atelie?design=${encodeURIComponent(novo.id)}`;
      } catch (e) { toast(e.message); }
    }
  }

  // ── seleção ──
  ed.selecionar = (ids, { somar = false } = {}) => {
    const lista = (Array.isArray(ids) ? ids : [ids]).filter(Boolean);
    if (somar) {
      const s = new Set(ed.sel);
      for (const id of lista) { if (s.has(id)) s.delete(id); else s.add(id); }
      ed.sel = [...s];
    } else ed.sel = [...new Set(lista)];
    if (ed.editando && !ed.sel.includes(ed.editando)) sairDoTexto();
    // 22/10 (Pedro): o "trocar imagem" (duplo clique na imagem) vale só pra ela: escolheu outra coisa, cancela
    if (ed.trocando?.alvo === 'camada' && !(ed.sel.length === 1 && ed.sel[0] === ed.trocando.id)) ed.cancelarTroca();
    ed.redesenhar({ sobre: true, props: true, camadas: true });
  };
  ed.cancelarTroca = () => {
    if (!ed.trocando) return;
    ed.trocando = null;
    esq?.pintarTroca();
  };
  ed.irPagina = (i) => {
    sairDoTexto();
    ed.cancelarTroca();
    fecharOferta();
    ed.idx = Math.max(0, Math.min(ed.doc.paginas.length - 1, i));
    ed.sel = [];
    ed.redesenhar('tudo');
  };

  // ── desenho ──
  ed.redesenhar = (partes = 'tudo') => {
    if (!ed.doc || ed.modo !== 'edicao' || !els.folha) return;
    const p = partes === 'tudo' ? { pagina: true, sobre: true, props: true, camadas: true, faixa: true, topo: true } : partes;
    if (p.pagina) desenharPagina();
    if (p.pagina || p.avisos) calcularAvisos();
    if (p.sobre || p.pagina) desenharSobre();
    if (p.props) props?.desenhar();
    else if (p.pagina) props?.atualizarGeometria();
    if (p.camadas || p.pagina) esq?.desenharCamadas();
    if (p.faixa) desenharFaixa();
    else if (p.pagina) agendarMiniatura();
    if (p.topo) pintarTopo();
  };

  function desenharPagina() {
    const pag = ed.pagina();
    sincronizarPagina(els.folha, ed.doc, pag, { modo: 'editor', src: urlTelaDoAsset, editando: ed.editando });
    els.folhaCaixa.style.width = `${ed.doc.largura}px`;
    els.folhaCaixa.style.height = `${ed.doc.altura}px`;
    medirTextos();
  }
  // a caixa do texto cresce com o conteúdo (como no Canva): a altura guardada acompanha o que o navegador mediu
  function medirTextos() {
    if (!els.folha?.isConnected) return;
    for (const c of ed.pagina().camadas) {
      if (c.tipo !== 'texto' || c.oculta) continue;
      const el = els.folha.querySelector(`[data-camada="${CSS.escape(c.id)}"]`);
      const h = el?.offsetHeight;
      if (h && Math.abs(h - c.altura) > 0.5) c.altura = h;
    }
  }

  // a tinta de cada texto (os retângulos das linhas, medidos no navegador): "nada atravessa nada" olha a letra, não a
  // caixa inteira. Texto girado ou com pílula fica pela caixa
  function medirTintas() {
    const mapa = new Map();
    if (!els.folha?.isConnected) return mapa;
    const f = els.folha.getBoundingClientRect();
    const z = f.width / ed.doc.largura;
    if (!z) return mapa;
    for (const c of ed.pagina().camadas) {
      if (c.tipo !== 'texto' || c.oculta || c.rotacao || c.fundo) continue;
      const el = els.folha.querySelector(`[data-camada="${CSS.escape(c.id)}"]`);
      if (!el?.firstChild) continue;
      const r = document.createRange();
      r.selectNodeContents(el);
      const linhas = [...r.getClientRects()].filter((q) => q.width > 0.5 && q.height > 0.5)
        .map((q) => ({ x0: (q.left - f.left) / z, y0: (q.top - f.top) / z, x1: (q.right - f.left) / z, y1: (q.bottom - f.top) / z }));
      if (linhas.length) mapa.set(c.id, linhas);
    }
    return mapa;
  }

  // ── pílula que acompanha o texto ──
  // 22/10 (achado da revisão): a pílula importada dos Destaques são 3 camadas (a forma Pílula, o texto e o ícone).
  // Trocar "Papelada" por "Papelada demais" quebrava a linha, o texto saía do fundo e encostava na pílula de baixo. Agora
  // o texto de uma linha dentro dela não quebra: a largura dele acompanha a largura natural e a forma de trás cresce
  // junto (o lado que fica parado é o do alinhamento), com o mesmo respiro; a letra maior aumenta a altura também.
  // Só quando a operação não mexeu na caixa do texto nem na pílula (arrastar, alinhar e escalar mandam nelas)
  const elDaCamada = (id) => els.folha?.querySelector(`[data-camada="${CSS.escape(id)}"]`) ?? null;
  // a largura do texto sem quebra de linha, em px do documento (um clone escondido, como o "Largura do tamanho do texto")
  function larguraNatural(el) {
    if (!el?.parentElement || !els.folha?.isConnected) return 0;
    const z = els.folha.getBoundingClientRect().width / ed.doc.largura;
    if (!z) return 0;
    const clone = el.cloneNode(true);
    clone.removeAttribute('data-camada');
    clone.removeAttribute('contenteditable');
    Object.assign(clone.style, { width: 'max-content', whiteSpace: 'pre', transform: 'none', visibility: 'hidden', outline: 'none' });
    el.parentElement.append(clone);
    const w = clone.getBoundingClientRect().width / z;
    clone.remove();
    return w;
  }
  function pilulaAntes(pag, c, el = elDaCamada(c.id)) {
    const f = pilulaDoTexto(pag, c);
    if (!f) return null;
    const w0 = larguraNatural(el);
    // o texto que já quebrava em mais linhas fica como está (a pílula foi feita pra ele assim)
    if (!w0 || w0 > c.largura + 0.5) return null;
    return {
      id: c.id, fId: f.id, w0, c0: { x: c.x, y: c.y, largura: c.largura, altura: c.altura }, f0: { x: f.x, y: f.y, largura: f.largura, altura: f.altura, raio: f.raio },
      vizinhos: vizinhosDaLinha(pag, f, ed.doc, ed.assetsPorId).map((o) => ({ id: o.id, x: o.x })),
    };
  }
  // a fileira anda junto com a borda da direita da pílula (d a partir de onde cada uma estava)
  function andarFileira(antes, d, { naTela = false } = {}) {
    for (const v of antes.vizinhos) {
      const o = ed.camada(v.id);
      if (!o) continue;
      o.x = Math.round((v.x + d) * 1000) / 1000;
      const oe = naTela ? elDaCamada(o.id) : null;
      if (oe) oe.style.left = `${o.x}px`;
    }
  }
  function pilulasDaPagina() {
    if (ed.modo !== 'edicao' || !els.folha?.isConnected || ed.editando) return [];
    const pag = ed.pagina();
    return pag.camadas.map((c) => (c.tipo === 'texto' ? pilulaAntes(pag, c) : null)).filter(Boolean);
  }
  function acompanharPilulas(antes) {
    const pag = ed.pagina();
    const feitas = [];
    // o quanto cada camada já andou com a fileira nesta conta (várias pílulas da mesma fileira mudando juntas: a da
    // esquerda empurra a da direita, que depois cresce também)
    const andou = new Map();
    const xAntes = (o, x) => x + (andou.get(o.id) ?? 0);
    for (const a of [...antes].sort((p, q) => p.f0.x - q.f0.x)) {
      const c = pag.camadas.find((x) => x.id === a.id);
      const f = pag.camadas.find((x) => x.id === a.fId);
      // o texto que ganhou pílula própria (estilo rápido Pílula) ou girou saiu da forma: fica como a operação deixou
      if (!c || !f || c.tipo !== 'texto' || c.oculta || c.fundo || c.rotacao) continue;
      if (c.x !== xAntes(c, a.c0.x) || c.y !== a.c0.y || c.largura !== a.c0.largura) continue;
      if (f.x !== xAntes(f, a.f0.x) || f.y !== a.f0.y || f.largura !== a.f0.largura || f.altura !== a.f0.altura) continue;
      const w1 = larguraNatural(elDaCamada(c.id));
      if (!w1) continue;
      const largura = Math.abs(w1 - a.w0) >= 0.5;
      if (!largura && Math.abs(c.altura - a.c0.altura) < 0.5) continue;
      if (largura) {
        const dx = andou.get(f.id) ?? 0;
        const g = acompanharPilula({ ...a.c0, x: a.c0.x + dx }, { ...a.f0, x: a.f0.x + dx }, a.w0, w1, c.alinhamento);
        Object.assign(c, g.texto);
        Object.assign(f, g.pilula);
        for (const v of a.vizinhos) {
          const o = pag.camadas.find((x) => x.id === v.id);
          // a vizinha que a operação já mexeu fica onde ela deixou
          if (!o || o.x !== xAntes(o, v.x) || !g.d) continue;
          o.x = Math.round((o.x + g.d) * 1000) / 1000;
          andou.set(o.id, (andou.get(o.id) ?? 0) + g.d);
        }
      }
      feitas.push({ a, c, f });
    }
    if (!feitas.length) return;
    desenharPagina();
    let altura = false;
    for (const { a, c, f } of feitas) {
      const dh = c.altura - a.c0.altura;
      if (Math.abs(dh) < 0.5) continue;
      f.altura = Math.round((a.f0.altura + dh) * 1000) / 1000;
      // continua pílula (as pontas redondas) com a altura nova
      if (a.f0.raio >= Math.min(a.f0.largura, a.f0.altura) / 2 - 1) f.raio = Math.max(f.raio, Math.ceil(f.altura / 2));
      altura = true;
    }
    if (altura) desenharPagina();
    calcularAvisos();
    desenharSobre();
    props?.atualizarGeometria();
  }

  function calcularAvisos() {
    // sem a lista de assets, a luz e o disco de fundo pareceriam colisão: os avisos esperam ela chegar.
    // 22/10 (achado da revisão): as regras do modelo.js menos a exceção marcada no uso da imagem (corte reto no
    // nome), mais o contraste do logo e do símbolo com o fundo
    const pag = ed.pagina();
    ed.avisos = ed.assetsProntos ? [
      ...semExcecaoDoUso(M.avisosDaPagina(ed.doc, pag, { assetsPorId: ed.assetsPorId, tintas: medirTintas() }), ed.doc, pag),
      ...avisosDaMarca(ed.doc, pag, ed.assetsPorId),
    ] : [];
    const b = els.avisos;
    if (!b) return;
    const n = ed.avisos.length;
    const alertas = ed.avisos.filter((a) => a.nivel === 'alerta').length;
    b.hidden = n === 0;
    b.dataset.nivel = alertas ? 'alerta' : 'revisar';
    b.innerHTML = `${ic('alerta', 15)}<span>${n} aviso${n > 1 ? 's' : ''}</span>`;
    b.title = 'Regras do Pedro nesta página: área segura, nada atravessa nada, contraste (texto e marca), barrinha, travessão, grafia, símbolo inteiro';
  }

  const telaX = (x) => ed.tx + x * ed.zoom;
  const telaY = (y) => ed.ty + y * ed.zoom;
  function caixaTela(c, extra = '') {
    return `left:${telaX(c.x)}px;top:${telaY(c.y)}px;width:${c.largura * ed.zoom}px;height:${c.altura * ed.zoom}px;${c.rotacao ? `transform:rotate(${c.rotacao}deg);` : ''}${extra}`;
  }
  function alcasDe(c) {
    if (c.travada || ed.editando === c.id) return '';
    const simbolo = c.tipo === 'imagem' && ed.assetsPorId.get(c.assetId)?.categoria === 'marca';
    const lados = c.tipo === 'texto' ? ['e', 'w'] : simbolo ? [] : ['n', 'e', 's', 'w'];
    return [...['nw', 'ne', 'se', 'sw'], ...lados].map((a) => `<span class="est-alca" data-alca="${a}"></span>`).join('')
      + '<span class="est-girar" data-alca="girar" title="Girar (Shift: de 15 em 15 graus)"></span>';
  }

  function desenharSobre() {
    const s = els.sobre;
    if (!s) return;
    const z = ed.zoom;
    const W = ed.doc.largura;
    const H = ed.doc.altura;
    const pw = els.palco.clientWidth;
    const ph = els.palco.clientHeight;
    const partes = [];
    if (ed.mostrarSegura) {
      const a = M.areaSegura(ed.doc);
      const fora = `M${telaX(0)} ${telaY(0)}h${W * z}v${H * z}h${-W * z}Z M${telaX(a.x0)} ${telaY(a.y0)}v${(a.y1 - a.y0) * z}h${(a.x1 - a.x0) * z}v${-(a.y1 - a.y0) * z}Z`;
      partes.push(`<svg class="est-segura" width="${pw}" height="${ph}" viewBox="0 0 ${pw} ${ph}"><path class="est-segura-fora" d="${fora}" fill-rule="evenodd"/><rect class="est-segura-linha" x="${telaX(a.x0)}" y="${telaY(a.y0)}" width="${(a.x1 - a.x0) * z}" height="${(a.y1 - a.y0) * z}"/></svg>`);
    }
    // contorno das camadas com aviso (alerta)
    const comAviso = new Set(ed.avisos.filter((a) => a.nivel === 'alerta').flatMap((a) => a.camadas));
    for (const id of comAviso) {
      const c = ed.camada(id);
      if (c && !c.oculta && !ed.sel.includes(id)) partes.push(`<div class="est-marca-aviso" style="${caixaTela(c)}"></div>`);
    }
    // passar o mouse por cima
    if (ed.sobreId && !ed.sel.includes(ed.sobreId) && !arr) {
      const c = ed.camada(ed.sobreId);
      if (c && !c.oculta) partes.push(`<div class="est-passar" style="${caixaTela(c)}"></div>`);
    }
    // guias do encaixe
    // guias só dentro da página (passam um pouco da borda pra ver o encaixe nela)
    for (const x of ed.guias?.x ?? []) partes.push(`<div class="est-guia est-guia-v" style="left:${telaX(x)}px;top:${telaY(0) - 12}px;height:${H * z + 24}px"></div>`);
    for (const y of ed.guias?.y ?? []) partes.push(`<div class="est-guia est-guia-h" style="top:${telaY(y)}px;left:${telaX(0) - 12}px;width:${W * z + 24}px"></div>`);
    // seleção
    const sel = ed.selecionadas();
    if (sel.length === 1) {
      const c = sel[0];
      partes.push(`<div class="est-sel${c.travada ? ' travada' : ''}${ed.editando === c.id ? ' editando' : ''}" style="${caixaTela(c)}">${alcasDe(c)}</div>`);
    } else if (sel.length > 1) {
      for (const c of sel) partes.push(`<div class="est-sel est-sel-fina" style="${caixaTela(c)}"></div>`);
      const u = M.uniao(sel.map(M.caixaGirada));
      // 22/10 (achado da revisão): o grupo tem as alças dos cantos (escala tudo junto, o canto oposto fica parado), como
      // a camada sozinha. Com camada travada no grupo, sem alça (o travado não muda)
      const alcas = sel.every((c) => !c.travada) ? ['nw', 'ne', 'se', 'sw'].map((a) => `<span class="est-alca" data-alca="${a}"></span>`).join('') : '';
      partes.push(`<div class="est-sel-grupo" style="left:${telaX(u.x0)}px;top:${telaY(u.y0)}px;width:${(u.x1 - u.x0) * z}px;height:${(u.y1 - u.y0) * z}px">${alcas}</div>`);
    }
    if (ed.marquee) {
      const m = ed.marquee;
      partes.push(`<div class="est-marquee" style="left:${Math.min(m.x0, m.x1)}px;top:${Math.min(m.y0, m.y1)}px;width:${Math.abs(m.x1 - m.x0)}px;height:${Math.abs(m.y1 - m.y0)}px"></div>`);
    }
    if (ed.medida) partes.push(`<div class="est-medida" style="left:${ed.medida.x}px;top:${ed.medida.y}px">${esc(ed.medida.texto)}</div>`);
    s.innerHTML = partes.join('');
  }

  // ── zoom e enquadramento ──
  function ajusteDaTela() {
    const pw = els.palco.clientWidth;
    const ph = els.palco.clientHeight;
    const folga = 48;
    return Math.max(0.05, Math.min((pw - folga * 2) / ed.doc.largura, (ph - folga * 2) / ed.doc.altura, ZOOM_MAX));
  }
  ed.ajustar = () => {
    if (!els.palco?.clientWidth) return;
    const z = ajusteDaTela();
    ed.zoom = z;
    ed.tx = (els.palco.clientWidth - ed.doc.largura * z) / 2;
    ed.ty = (els.palco.clientHeight - ed.doc.altura * z) / 2;
    ed.ajustado = true;
    aplicarVista();
  };
  ed.zoomPara = (z, ax = els.palco.clientWidth / 2, ay = els.palco.clientHeight / 2) => {
    const min = Math.min(ZOOM_MIN, ajusteDaTela());
    const novo = Math.max(min, Math.min(ZOOM_MAX, z));
    ed.tx = ax - ((ax - ed.tx) * novo) / ed.zoom;
    ed.ty = ay - ((ay - ed.ty) * novo) / ed.zoom;
    ed.zoom = novo;
    ed.ajustado = false;
    aplicarVista();
  };
  function aplicarVista() {
    els.folhaCaixa.style.transform = `translate(${ed.tx}px, ${ed.ty}px) scale(${ed.zoom})`;
    pintarZoom();
    desenharSobre();
  }
  function pintarZoom() {
    const sel = els.zoom;
    if (!sel) return;
    const pct = Math.round(ed.zoom * 100);
    const custom = sel.querySelector('option[data-atual]');
    custom.value = String(pct);
    custom.textContent = `${pct}%`;
    sel.value = ed.ajustado ? 'ajustar' : String(pct);
    if (ed.ajustado) custom.textContent = `${pct}%`;
  }

  // ── coordenadas ──
  function pontoDoc(e) {
    const r = els.palco.getBoundingClientRect();
    return { x: (e.clientX - r.left - ed.tx) / ed.zoom, y: (e.clientY - r.top - ed.ty) / ed.zoom, sx: e.clientX - r.left, sy: e.clientY - r.top };
  }

  // ── mexer com o ponteiro ──
  function aoApertar(e) {
    if (ed.modo !== 'edicao' || !ed.doc) return;
    if (e.button === 2) return;
    const alvo = e.target instanceof Element ? e.target : null;
    // clique dentro do texto em edição: o cursor é do navegador
    if (ed.editando && alvo?.closest(`[data-camada="${CSS.escape(ed.editando)}"]`)) return;
    if (ed.editando) sairDoTexto();
    els.palco.focus({ preventScroll: true });
    const p = pontoDoc(e);
    if (espaco || e.button === 1) {
      arr = { tipo: 'pan', x0: e.clientX, y0: e.clientY, tx: ed.tx, ty: ed.ty };
      els.palco.dataset.arrastando = 'pan';
      els.palco.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }
    const alca = alvo?.closest('[data-alca]')?.dataset.alca;
    if (alca && ed.sel.length === 1) {
      const c = ed.camada(ed.sel[0]);
      if (c && !c.travada) {
        iniciarAlca(c, alca);
        els.palco.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }
    } else if (alca && ed.sel.length > 1 && iniciarAlcaGrupo(alca)) {
      els.palco.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }
    // a camada já escolhida debaixo do ponto ganha (dá pra arrastar o que está atrás de algo transparente). 22/10
    // (Pedro): o clique atravessa as camadas de fundo (a luz coral, a partícula); com Alt, pega elas também
    const pag = ed.pagina();
    const naSel = ed.selecionadas().filter((c) => !c.oculta && M.pontoNaCamada(c, p.x, p.y)).at(-1);
    const hit = naSel ?? M.camadaNoPonto(pag, p.x, p.y, 0, { pular: e.altKey ? null : ehDeFundo });
    if (hit) {
      if (e.shiftKey) {
        ed.selecionar([hit.id], { somar: true });
        if (!ed.sel.includes(hit.id)) return;
      } else if (!ed.sel.includes(hit.id)) ed.selecionar([hit.id]);
      const moveis = ed.selecionadas().filter((c) => !c.travada);
      arr = {
        tipo: 'mover', inicio: p, comecou: false,
        origem: new Map(moveis.map((c) => [c.id, { x: c.x, y: c.y }])),
        caixa0: moveis.length ? M.uniao(moveis.map(M.caixaGirada)) : null,
        alvos: M.alvosDeEncaixe(ed.doc, pag, new Set(ed.sel)),
        // 22/10 (achado da revisão): clique sem arrastar e sem Shift numa camada de uma seleção de várias deixa só ela
        // escolhida no soltar (como no Canva e no Figma); arrastando, o grupo anda junto
        soEla: !e.shiftKey && ed.sel.length > 1 ? hit.id : null,
      };
      if (!moveis.length && ed.selecionadas().some((c) => c.travada)) toast('Camada travada: destrave em Camadas pra mexer');
    } else {
      if (!e.shiftKey && ed.sel.length) ed.selecionar([]);
      arr = { tipo: 'selecao', inicio: p, base: e.shiftKey ? [...ed.sel] : [], comFundo: e.altKey };
      ed.marquee = { x0: p.sx, y0: p.sy, x1: p.sx, y1: p.sy };
    }
    els.palco.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  // o desfazer só guarda o antes quando a alça anda de verdade (clique parado não vira passo)
  function iniciarAlca(c, alca) {
    const ctr = M.centro(c);
    if (alca === 'girar') {
      arr = { tipo: 'girar', id: c.id, centro: ctr };
      return;
    }
    const d = { nw: [-1, -1], n: [0, -1], ne: [1, -1], e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0] }[alca];
    arr = {
      tipo: 'redim', id: c.id, alca, d, c0: M.clonar(c), centro: ctr,
      alvos: M.alvosDeEncaixe(ed.doc, ed.pagina(), new Set([c.id])),
      simbolo: c.tipo === 'imagem' && ed.assetsPorId.get(c.assetId)?.categoria === 'marca',
    };
  }
  // 22/10 (achado da revisão): alça do canto do grupo. Tudo escala junto na proporção (letra, pílula, raio e sombra,
  // como o "5% maior"), o canto oposto fica parado, a borda que anda encaixa nas guias e a medida mostra o %. O lado
  // do bloco que estava dentro da área segura para na margem (Alt solta o encaixe e a margem)
  function iniciarAlcaGrupo(alca) {
    const d = { nw: [-1, -1], ne: [1, -1], se: [1, 1], sw: [-1, 1] }[alca];
    const sel = ed.selecionadas();
    if (!d || !sel.length || sel.some((c) => c.travada)) return false;
    const seguras = sel.filter((c) => !ehDeFundo(c));
    arr = {
      tipo: 'grupo', d, u0: M.uniao(sel.map(M.caixaGirada)),
      origem: new Map(sel.map((c) => [c.id, M.clonar(c)])),
      seguro: seguras.length ? M.uniao(seguras.map(M.caixaGirada)) : null,
      alvos: M.alvosDeEncaixe(ed.doc, ed.pagina(), new Set(ed.sel)),
    };
    return true;
  }
  function redimensionarGrupo(p, e) {
    const { u0, d: [hx, hy] } = arr;
    const w0 = Math.max(1e-6, u0.x1 - u0.x0);
    const h0 = Math.max(1e-6, u0.y1 - u0.y0);
    // o canto oposto ao que anda
    const ax = hx > 0 ? u0.x0 : u0.x1;
    const ay = hy > 0 ? u0.y0 : u0.y1;
    const dx = (p.x - ax) * hx;
    const dy = (p.y - ay) * hy;
    let s = Math.max(0.05, (dx * w0 + dy * h0) / (w0 * w0 + h0 * h0));
    const guias = { x: [], y: [] };
    if (!e.altKey) {
      // a borda vertical ou a horizontal que anda pula pra guia mais perto (a que estiver mais perto das duas)
      const lim = LIMIAR_ENCAIXE / ed.zoom;
      const bx = ax + hx * w0 * s;
      const by = ay + hy * h0 * s;
      const gx = arr.alvos.xs.reduce((m, a) => (Math.abs(a.v - bx) <= lim && (!m || Math.abs(a.v - bx) < Math.abs(m.v - bx)) ? a : m), null);
      const gy = arr.alvos.ys.reduce((m, a) => (Math.abs(a.v - by) <= lim && (!m || Math.abs(a.v - by) < Math.abs(m.v - by)) ? a : m), null);
      if (gx && (!gy || Math.abs(gx.v - bx) <= Math.abs(gy.v - by))) {
        s = Math.max(0.05, ((gx.v - ax) * hx) / w0);
        guias.x.push(gx.v);
      } else if (gy) {
        s = Math.max(0.05, ((gy.v - ay) * hy) / h0);
        guias.y.push(gy.v);
      }
      const r = escalaComAncora(arr.seguro, s, M.areaSegura(ed.doc), ax, ay);
      if (r.parou) {
        s = r.k;
        guias.x = r.limite?.eixo === 'x' ? [r.limite.v] : [];
        guias.y = r.limite?.eixo === 'y' ? [r.limite.v] : [];
        if (!arr.avisouSegura) { arr.avisouSegura = true; toast('Chegou na área segura'); }
      }
    }
    if (!arr.mexeu) { arr.mexeu = true; ed.guardarAntes(); }
    for (const [id, o] of arr.origem) {
      const c = ed.camada(id);
      if (!c) continue;
      const ctr = M.centro(o);
      Object.assign(c, M.clonar(o));
      M.escalarCamada(c, s);
      c.x = Math.round((ax + (ctr.x - ax) * s - c.largura / 2) * 10) / 10;
      c.y = Math.round((ay + (ctr.y - ay) * s - c.altura / 2) * 10) / 10;
    }
    ed.guias = guias;
    const u = M.uniao(ed.selecionadas().map(M.caixaGirada));
    // o % é o do campo do painel (100 = o tamanho de quando escolheu)
    ed.medida = { x: telaX(u.x0), y: telaY(u.y1) + 10, texto: `${Math.round(ed.tamanhoDaSelecao()?.pct ?? s * 100)}%` };
    sincronizarPagina(els.folha, ed.doc, ed.pagina(), { modo: 'editor', src: urlTelaDoAsset, editando: ed.editando });
    medirTextos();
    desenharSobre();
    props?.atualizarGeometria();
  }

  function aoMover(e) {
    if (ed.modo !== 'edicao' || !ed.doc) return;
    const p = pontoDoc(e);
    if (!arr) {
      // passar por cima: contorno leve
      const alvo = e.target instanceof Element ? e.target : null;
      const id = alvo?.closest('[data-alca]') ? null : M.camadaNoPonto(ed.pagina(), p.x, p.y, 0, { pular: e.altKey ? null : ehDeFundo })?.id ?? null;
      if (id !== ed.sobreId) { ed.sobreId = id; desenharSobre(); }
      return;
    }
    if (arr.tipo === 'pan') {
      ed.tx = arr.tx + (e.clientX - arr.x0);
      ed.ty = arr.ty + (e.clientY - arr.y0);
      ed.ajustado = false;
      aplicarVista();
      return;
    }
    if (arr.tipo === 'selecao') {
      ed.marquee.x1 = p.sx;
      ed.marquee.y1 = p.sy;
      const caixa = { x0: Math.min(arr.inicio.x, p.x), y0: Math.min(arr.inicio.y, p.y), x1: Math.max(arr.inicio.x, p.x), y1: Math.max(arr.inicio.y, p.y) };
      const dentro = ed.pagina().camadas.filter((c) => !c.oculta && (arr.comFundo || !ehDeFundo(c)) && M.cruzam(M.caixaGirada(c), caixa, 0)).map((c) => c.id);
      ed.sel = [...new Set([...arr.base, ...dentro])];
      desenharSobre();
      return;
    }
    if (arr.tipo === 'mover') return moverSelecao(p, e);
    if (arr.tipo === 'redim') return redimensionar(p, e);
    if (arr.tipo === 'grupo') return redimensionarGrupo(p, e);
    if (arr.tipo === 'girar') return girar(p, e);
  }

  function moverSelecao(p, e) {
    if (!arr.caixa0) return;
    let dx = p.x - arr.inicio.x;
    let dy = p.y - arr.inicio.y;
    if (!arr.comecou) {
      if (Math.hypot(dx * ed.zoom, dy * ed.zoom) < 3) return;
      arr.comecou = true;
      ed.guardarAntes();
      els.palco.dataset.arrastando = 'mover';
    }
    if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
    let guias = { x: [], y: [] };
    if (!e.altKey) {
      const caixa = { x0: arr.caixa0.x0 + dx, y0: arr.caixa0.y0 + dy, x1: arr.caixa0.x1 + dx, y1: arr.caixa0.y1 + dy };
      const enc = M.encaixar(caixa, arr.alvos, LIMIAR_ENCAIXE / ed.zoom, { eixoX: !(e.shiftKey && dx === 0), eixoY: !(e.shiftKey && dy === 0) });
      dx += enc.dx;
      dy += enc.dy;
      guias = { x: enc.guiasX, y: enc.guiasY };
    }
    for (const [id, o] of arr.origem) {
      const c = ed.camada(id);
      if (!c) continue;
      c.x = Math.round((o.x + dx) * 2) / 2;
      c.y = Math.round((o.y + dy) * 2) / 2;
    }
    ed.guias = guias;
    const u = M.uniao(ed.selecionadas().map(M.caixaGirada));
    ed.medida = { x: telaX(u.x0), y: telaY(u.y1) + 10, texto: `x ${Math.round(u.x0)}  y ${Math.round(u.y0)}` };
    redesenharMovendo();
  }

  // durante o arrasto só as camadas mexidas e a camada de cima mudam (o resto espera o soltar)
  function redesenharMovendo() {
    const pag = ed.pagina();
    sincronizarPagina(els.folha, ed.doc, pag, { modo: 'editor', src: urlTelaDoAsset, editando: ed.editando });
    desenharSobre();
    props?.atualizarGeometria();
  }

  const RAD = Math.PI / 180;
  function redimensionar(p, e) {
    const c = ed.camada(arr.id);
    const c0 = arr.c0;
    if (!c) return;
    if (!arr.mexeu) { arr.mexeu = true; ed.guardarAntes(); }
    const t = (c0.rotacao || 0) * RAD;
    const cos = Math.cos(t);
    const sen = Math.sin(t);
    // ponto em coordenadas locais (sem rotação, origem no centro antigo)
    const vx = p.x - arr.centro.x;
    const vy = p.y - arr.centro.y;
    const lx = vx * cos + vy * sen;
    const ly = -vx * sen + vy * cos;
    const [hx, hy] = arr.d;
    const w0 = c0.largura;
    const h0 = c0.altura;
    const ax = -hx * w0 / 2;
    const ay = -hy * h0 / 2;
    const canto = hx !== 0 && hy !== 0;
    let w = w0;
    let h = h0;
    // texto: canto escala tudo junto (tamanho da letra), lado muda a largura; imagem: canto mantém a proporção
    // (Shift solta), símbolo da marca sempre na proporção; forma: canto livre (Shift prende)
    const proporcional = canto && (c.tipo === 'texto' || arr.simbolo || (c.tipo === 'imagem' ? !e.shiftKey : e.shiftKey));
    if (canto) {
      const dx = (lx - ax) * hx;
      const dy = (ly - ay) * hy;
      if (proporcional) {
        const s = Math.max(0.02, (dx * w0 + dy * h0) / (w0 * w0 + h0 * h0));
        w = w0 * s;
        h = h0 * s;
      } else {
        w = dx;
        h = dy;
      }
    } else if (hx !== 0) w = (lx - ax) * hx;
    else h = (ly - ay) * hy;
    w = Math.max(4, w);
    h = Math.max(4, h);
    // encaixe da borda que anda (só sem rotação e sem proporção)
    let guias = { x: [], y: [] };
    if (!e.altKey && !c0.rotacao && !proporcional) {
      const lim = LIMIAR_ENCAIXE / ed.zoom;
      if (hx !== 0) {
        const borda = hx > 0 ? c0.x + w : c0.x + w0 - w;
        const alvo = arr.alvos.xs.find((a) => Math.abs(a.v - borda) <= lim);
        if (alvo) { w += (alvo.v - borda) * hx; guias.x.push(alvo.v); }
      }
      if (hy !== 0) {
        const borda = hy > 0 ? c0.y + h : c0.y + h0 - h;
        const alvo = arr.alvos.ys.find((a) => Math.abs(a.v - borda) <= lim);
        if (alvo) { h += (alvo.v - borda) * hy; guias.y.push(alvo.v); }
      }
    }
    // centro novo: âncora + metade do tamanho novo, de volta pro espaço do documento
    const ncx = hx !== 0 ? ax + hx * w / 2 : 0;
    const ncy = hy !== 0 ? ay + hy * h / 2 : 0;
    const cx = arr.centro.x + ncx * cos - ncy * sen;
    const cy = arr.centro.y + ncx * sen + ncy * cos;
    const r1 = (v) => Math.round(v * 2) / 2;
    if (c.tipo === 'texto') {
      if (canto) {
        const s = w / w0;
        c.tamanho = Math.max(6, Math.round(c0.tamanho * s * 10) / 10);
        if (c0.fundo) {
          c.fundo.padding = Math.round(c0.fundo.padding * s * 10) / 10;
          c.fundo.raio = c0.fundo.raio >= 999 ? c0.fundo.raio : Math.round(c0.fundo.raio * s);
        }
        c.largura = r1(w);
        c.altura = h0 * s;
        c.x = r1(cx - w / 2);
        c.y = r1(cy - (h0 * s) / 2);
      } else {
        c.largura = r1(w);
        c.x = r1(cx - w / 2);
      }
    } else {
      c.largura = r1(w);
      c.altura = r1(h);
      c.x = r1(cx - w / 2);
      c.y = r1(cy - h / 2);
    }
    ed.guias = guias;
    ed.medida = { x: telaX(c.x), y: telaY(c.y + c.altura) + 10, texto: c.tipo === 'texto' && canto ? `${Math.round(c.tamanho)} px` : `${Math.round(c.largura)} × ${Math.round(c.altura)}` };
    sincronizarPagina(els.folha, ed.doc, ed.pagina(), { modo: 'editor', src: urlTelaDoAsset, editando: ed.editando });
    if (c.tipo === 'texto') medirTextos();
    desenharSobre();
    props?.atualizarGeometria();
  }

  function girar(p, e) {
    const c = ed.camada(arr.id);
    if (!c) return;
    if (!arr.mexeu) { arr.mexeu = true; ed.guardarAntes(); }
    let ang = Math.atan2(p.y - arr.centro.y, p.x - arr.centro.x) / RAD + 90;
    if (e.shiftKey) ang = Math.round(ang / 15) * 15;
    else {
      const q = Math.round(ang / 45) * 45;
      if (Math.abs(ang - q) < 2.5) ang = q;
    }
    ang = ((ang + 180) % 360 + 360) % 360 - 180;
    c.rotacao = Math.round(ang * 10) / 10;
    ed.medida = { x: telaX(arr.centro.x) - 20, y: telaY(c.y + c.altura) + 14, texto: `${Math.round(c.rotacao)}°` };
    sincronizarPagina(els.folha, ed.doc, ed.pagina(), { modo: 'editor', src: urlTelaDoAsset, editando: ed.editando });
    desenharSobre();
    props?.atualizarGeometria();
  }

  function aoSoltar(e) {
    if (!arr) return;
    try { els.palco.releasePointerCapture(e.pointerId); } catch { /* já solto */ }
    const tipo = arr.tipo;
    const mexeu = tipo === 'mover' ? arr.comecou : Boolean(arr.mexeu);
    const soEla = tipo === 'mover' && !mexeu ? arr.soEla : null;
    arr = null;
    delete els.palco.dataset.arrastando;
    ed.guias = null;
    ed.medida = null;
    ed.marquee = null;
    if (tipo === 'selecao') { ed.redesenhar({ sobre: true, props: true, camadas: true }); return; }
    if (tipo === 'pan') return;
    if (mexeu) {
      hist.chave = null;
      ed.sujar();
      ed.redesenhar({ pagina: true, sobre: true, props: true });
    } else if (soEla && ed.camada(soEla)) ed.selecionar([soEla]);
    else desenharSobre();
  }

  function aoDuploClique(e) {
    if (ed.modo !== 'edicao') return;
    const p = pontoDoc(e);
    const c = M.camadaNoPonto(ed.pagina(), p.x, p.y, 0, { pular: e.altKey ? null : ehDeFundo });
    if (c?.tipo === 'texto') editarTexto(c.id);
    else if (c?.tipo === 'imagem') { ed.selecionar([c.id]); esq?.trocarImagem({ alvo: 'camada', id: c.id }); }
  }

  function aoRoda(e) {
    if (ed.modo !== 'edicao' || !ed.doc) return;
    e.preventDefault();
    const r = els.palco.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) {
      ed.zoomPara(ed.zoom * Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top);
      return;
    }
    const k = e.deltaMode === 1 ? 16 : 1;
    ed.tx -= (e.shiftKey ? e.deltaY : e.deltaX) * k;
    ed.ty -= (e.shiftKey ? 0 : e.deltaY) * k;
    ed.ajustado = false;
    aplicarVista();
  }

  // soltar asset (arrastado do painel) ou arquivo (do computador) em cima da página
  function aoSoltarArrastado(e) {
    if (ed.modo !== 'edicao' || !ed.doc) return;
    const id = e.dataTransfer?.getData('application/x-estudio-asset');
    const arquivos = [...(e.dataTransfer?.files ?? [])].filter((f) => /^image\/(png|jpeg|webp)$/.test(f.type));
    if (!id && !arquivos.length) return;
    e.preventDefault();
    els.palco.classList.remove('soltando');
    const p = pontoDoc(e);
    if (id) {
      const a = ed.assetsPorId.get(id);
      if (a) ed.inserirAsset(a, { cx: p.x, cy: p.y });
      return;
    }
    esq?.subirArquivos(arquivos, { inserir: true, cx: p.x, cy: p.y });
  }

  // ── texto no lugar ──
  // 22/10 (Pedro): o desfazer só ganha um passo quando o texto muda de verdade (abrir e fechar sem digitar não apaga o
  // refazer nem cria passo morto): o instantâneo de antes fica guardado e entra no histórico na saída
  let antesDoTexto = null;
  function editarTexto(id) {
    const c = ed.camada(id);
    if (!c || c.tipo !== 'texto') return;
    if (c.travada) { toast('Camada travada: destrave em Camadas pra editar'); return; }
    sairDoTexto();
    ed.cancelarTroca();
    ed.sel = [id];
    ed.editando = id;
    antesDoTexto = { id, instantaneo: instantaneo(), texto: c.texto };
    desenharPagina();
    const el = els.folha.querySelector(`[data-camada="${CSS.escape(id)}"]`);
    if (!el) { ed.editando = null; antesDoTexto = null; return; }
    // 22/10 (achado da revisão): texto dentro de uma pílula: a largura natural de antes de digitar (a pílula acompanha)
    const pilula = pilulaAntes(ed.pagina(), c, el);
    el.__chaveTexto = null;
    el.textContent = c.texto;
    try { el.contentEditable = 'plaintext-only'; } catch { el.contentEditable = 'true'; }
    if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    el.spellcheck = true;
    el.setAttribute('lang', 'pt-BR');
    el.style.outline = 'none';
    el.style.cursor = 'text';
    el.style.userSelect = 'text';
    el.style.webkitUserSelect = 'text';
    el.focus({ preventScroll: true });
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
    const lerTexto = () => {
      let t = el.innerText.replace(/\u{200B}/gu, '');
      if (el.lastChild?.nodeName === 'BR' || /\n\n$/.test(t)) t = t.replace(/\n$/, '');
      return t;
    };
    const aoDigitar = () => {
      c.texto = lerTexto();
      const f = pilula ? ed.camada(pilula.fId) : null;
      const w1 = f ? larguraNatural(el) : 0;
      if (w1) {
        // a caixa do texto e a pílula crescem com o que foi digitado (sem quebrar a linha); o resto da página espera a saída
        const g = acompanharPilula(pilula.c0, pilula.f0, pilula.w0, w1, c.alinhamento);
        Object.assign(c, g.texto);
        Object.assign(f, g.pilula);
        el.style.left = `${c.x}px`;
        el.style.width = `${c.largura}px`;
        const fe = elDaCamada(f.id);
        if (fe) { fe.style.left = `${f.x}px`; fe.style.width = `${f.largura}px`; }
        andarFileira(pilula, g.d, { naTela: true });
        props?.atualizarGeometria();
      }
      medirTextos();
      desenharSobre();
      props?.atualizarTexto?.(c);
      ed.sujar();
    };
    const aoTecla = (ev) => {
      // Ctrl+S salva o design (sem isso o navegador abre o "Salvar página")
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === 's' || ev.key === 'S')) {
        ev.preventDefault();
        ev.stopPropagation();
        const t = lerTexto();
        if (t !== c.texto) { c.texto = t; ed.sujar(); }
        salvar();
        return;
      }
      ev.stopPropagation();
      if (ev.key === 'Escape') { ev.preventDefault(); sairDoTexto(); els.palco.focus({ preventScroll: true }); }
    };
    const aoColar = (ev) => {
      if (el.contentEditable === 'plaintext-only') return;
      ev.preventDefault();
      document.execCommand('insertText', false, ev.clipboardData?.getData('text/plain') ?? '');
    };
    const aoSair = () => setTimeout(() => { if (ed.editando === id && document.activeElement !== el) sairDoTexto(); }, 0);
    el.addEventListener('input', aoDigitar);
    el.addEventListener('keydown', aoTecla);
    el.addEventListener('paste', aoColar);
    el.addEventListener('blur', aoSair);
    el.__sair = () => {
      el.removeEventListener('input', aoDigitar);
      el.removeEventListener('keydown', aoTecla);
      el.removeEventListener('paste', aoColar);
      el.removeEventListener('blur', aoSair);
      c.texto = lerTexto();
    };
    desenharSobre();
    props?.desenhar();
  }
  ed.editarTexto = editarTexto;
  function sairDoTexto() {
    const id = ed.editando;
    if (!id) return;
    const el = els.folha?.querySelector(`[data-camada="${CSS.escape(id)}"]`);
    if (el) {
      el.__sair?.();
      delete el.__sair;
      // regra dura: travessão e meia-risca não entram (o servidor tira também; aqui a arte exportada sai igual)
      const c = ed.camada(id);
      if (c && TRACO.test(c.texto)) { c.texto = semTraco(c.texto); ed.sujar(); toast('Travessão trocado por vírgula: regra dura da marca'); }
      el.removeAttribute('contenteditable');
      el.removeAttribute('spellcheck');
      el.__chaveTexto = null;
      if (c && antesDoTexto?.id === id && c.texto !== antesDoTexto.texto) {
        hist.antes.push(antesDoTexto.instantaneo);
        if (hist.antes.length > HIST_MAX) hist.antes.shift();
        hist.depois = [];
      }
    }
    antesDoTexto = null;
    ed.editando = null;
    hist.chave = null;
    getSelection()?.removeAllRanges();
    ed.redesenhar({ pagina: true, sobre: true, props: true, camadas: true });
  }
  ed.sairDoTexto = sairDoTexto;

  // ── operações ──
  ed.inserirCamadas = (novas, { selecionar = true, procurarLugar = true } = {}) => {
    if (!novas.length) return;
    const pag = ed.pagina();
    // camada nova nasce num lugar livre da área segura (nada atravessa nada). 22/10 (Pedro): sem vaga no tamanho cheio,
    // ela encolhe (até 40%) pra caber na maior vaga livre; sem vaga nenhuma, fica no meio e o aviso mostra. As novas
    // também desviam umas das outras
    const minimoTexto = Math.round((22 * ed.doc.largura) / 1080);
    const ja = { ...pag, camadas: [...pag.camadas] };
    // camada de fundo nova (a luz, o disco, a partícula) vai pra trás de tudo e pode ficar atrás do resto
    const deFundo = new Set(novas.filter(ehDeFundo).map((c) => c.id));
    for (const c of novas) {
      if (deFundo.has(c.id)) continue;
      const l = procurarLugar ? M.lugarLivreReduzindo(ed.doc, ja, c, ed.assetsPorId, { minimoTexto }) : null;
      if (l) {
        if (l.escala < 1) M.escalarCamada(c, l.escala);
        c.x = Math.round(l.x * 10) / 10;
        c.y = Math.round(l.y * 10) / 10;
      } else {
        let tentativas = 0;
        while (ja.camadas.some((o) => Math.abs(o.x - c.x) < 1 && Math.abs(o.y - c.y) < 1) && tentativas++ < 20) { c.x += 24; c.y += 24; }
      }
      ja.camadas.push(c);
    }
    ed.mudar((d) => {
      const cs = d.paginas[ed.idx].camadas;
      let atras = 0;
      while (atras < cs.length && ehDeFundo(cs[atras])) atras++;
      cs.splice(atras, 0, ...novas.filter((c) => deFundo.has(c.id)));
      cs.push(...novas.filter((c) => !deFundo.has(c.id)));
    });
    if (selecionar) ed.selecionar(novas.map((c) => c.id));
  };

  // ── fundo de imagem com a cor certa por trás ──
  // 22/10 (Pedro): o fundo de imagem guarda a cor média dela em fundo.cor (a "cor por trás"): o texto novo nasce claro no
  // fundo escuro e escuro no claro, e o contraste mede contra ela. Os fundos da marca já sabem o tom (nome e tags); a
  // imagem subida pelo time é medida no navegador (16 x 16 px, a média pesada pela transparência)
  const coresMedidas = new Map();
  function medirCorMedia(id) {
    if (!coresMedidas.has(id)) {
      coresMedidas.set(id, new Promise((ok) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          try {
            const cv = document.createElement('canvas');
            cv.width = 16;
            cv.height = 16;
            const ctx = cv.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, 16, 16);
            const px = ctx.getImageData(0, 0, 16, 16).data;
            let r = 0; let g = 0; let b = 0; let n = 0;
            for (let i = 0; i < px.length; i += 4) { const a = px[i + 3] / 255; r += px[i] * a; g += px[i + 1] * a; b += px[i + 2] * a; n += a; }
            if (!n) return ok(null);
            const h = (v) => Math.round(v / n).toString(16).padStart(2, '0');
            ok(`#${h(r)}${h(g)}${h(b)}`.toUpperCase());
          } catch { ok(null); }
        };
        img.onerror = () => ok(null);
        // a cor média sai de 16 x 16 px: a miniatura basta
        img.src = urlMiniaturaDoAsset(id);
      }));
    }
    return coresMedidas.get(id);
  }
  // põe o asset como fundo da página i (a cor por trás vem junto); a medida chega depois e entra no mesmo passo
  ed.usarComoFundo = (asset, i = ed.idx) => {
    if (!asset || destruido) return;
    const tom = M.corDoAssetDeFundo(asset);
    const escuroAntes = M.fundoEscuro(ed.doc.paginas[i]?.fundo);
    ed.mudar((d) => {
      const f = d.paginas[i].fundo;
      f.tipo = 'imagem';
      f.assetId = asset.id;
      f.ajuste = 'cobrir';
      if (tom) f.cor = tom;
    }, { redesenhar: { pagina: true, sobre: true, props: true, faixa: true } });
    if (tom) { oferecerTrocaDeCores(escuroAntes, i); return; }
    medirCorMedia(asset.id).then((cor) => {
      const f = ed.doc?.paginas[i]?.fundo;
      if (destruido || !cor || !f || f.tipo !== 'imagem' || f.assetId !== asset.id || f.cor === cor) return;
      f.cor = cor;
      ed.sujar();
      ed.redesenhar({ pagina: true, sobre: true, props: true });
      oferecerTrocaDeCores(escuroAntes, i);
    });
  };
  // o tipo do fundo volta pra imagem (o asset já estava lá): a cor por trás volta pra dela
  ed.corPorTrasDoFundo = (i = ed.idx) => {
    const f = ed.doc.paginas[i]?.fundo;
    if (f?.tipo !== 'imagem' || !f.assetId) return;
    const a = ed.assetsPorId.get(f.assetId);
    const tom = M.corDoAssetDeFundo(a);
    if (tom) { f.cor = tom; return; }
    medirCorMedia(f.assetId).then((cor) => {
      if (destruido || !cor || f.tipo !== 'imagem' || f.cor === cor) return;
      f.cor = cor;
      ed.sujar();
      ed.redesenhar({ pagina: true, sobre: true, props: true });
    });
  };

  // ── trocar as cores junto com o fundo ──
  // 22/10 (achado da revisão): o fundo rápido que vira de claro pra escuro (ou o contrário) deixava os textos e o logo
  // na cor de antes (o título em tinta sumia no escuro). Agora um aviso com o botão oferece trocar as cores também
  // (trocaDeCores: a tinta da marca do outro lado e o logo e o símbolo negativos). Recusar deixa como está
  function oferecerTrocaDeCores(escuroAntes, i = ed.idx) {
    const pag = ed.doc?.paginas[i];
    if (!pag || i !== ed.idx || ed.modo !== 'edicao') return;
    const escuro = M.fundoEscuro(pag.fundo);
    if (escuro === escuroAntes || !trocaDeCores(pag, escuro, ed.assetsPorId).length) return;
    mostrarOferta(`Fundo ${escuro ? 'escuro' : 'claro'}. Trocar as cores também?`, 'Trocar as cores', () => ed.trocarCores(escuro, i));
  }
  ed.trocarCores = (escuro, i = ed.idx) => {
    const pag = ed.doc?.paginas[i];
    const plano = pag ? trocaDeCores(pag, escuro, ed.assetsPorId) : [];
    if (!plano.length) return 0;
    ed.mudar(() => {
      for (const m of plano) {
        const c = pag.camadas.find((x) => x.id === m.id);
        if (!c) continue;
        if (m.cor) c.cor = m.cor;
        if (m.corDestaque) c.corDestaque = m.corDestaque;
        if (m.assetId) {
          // o nome que era o do asset acompanha; o que a pessoa deu fica
          if (c.nome === ed.assetsPorId.get(c.assetId)?.nome) c.nome = m.nome;
          const a = ed.assetsPorId.get(m.assetId);
          c.assetId = m.assetId;
          if (a?.largura && a?.altura) Object.assign(c, caixaContida(c, a.largura, a.altura));
        }
      }
    }, { redesenhar: { pagina: true, sobre: true, props: true, camadas: true } });
    toast(plano.length > 1 ? `${plano.length} camadas trocaram de cor` : 'A camada trocou de cor');
    return plano.length;
  };
  // o aviso com ação, no pé da página (o toast do core só tem texto); some sozinho em 12 s, no X ou ao trocar de página
  function mostrarOferta(texto, rotulo, acao) {
    fecharOferta();
    if (!els.palco) return;
    const o = document.createElement('div');
    o.className = 'est-oferta';
    o.setAttribute('role', 'status');
    o.innerHTML = `<span>${esc(texto)}</span><button type="button" class="btn btn-sm btn-primario" data-oferta="sim">${esc(rotulo)}</button><button type="button" class="btn-icone btn-sm" data-oferta="nao" aria-label="Agora não" title="Agora não">${ic('fechar', 14)}</button>`;
    // o clique no aviso não vira clique na página (escolher, desmarcar, arrastar)
    for (const ev of ['pointerdown', 'dblclick', 'wheel']) o.addEventListener(ev, (e) => e.stopPropagation());
    o.addEventListener('click', (e) => {
      const b = e.target instanceof Element ? e.target.closest('[data-oferta]') : null;
      if (!b) return;
      fecharOferta();
      if (b.dataset.oferta === 'sim') acao();
      els.palco?.focus({ preventScroll: true });
    });
    els.palco.append(o);
    tempoOferta = setTimeout(fecharOferta, 12000);
  }
  function fecharOferta() {
    clearTimeout(tempoOferta);
    no.querySelector('.est-oferta')?.remove();
  }

  ed.inserirAsset = (asset, pos = {}) => {
    if (!asset) return;
    if (ed.trocando) return ed.trocarPor(asset);
    if (M.ehFundoDePagina(asset) && pos.cx == null) {
      ed.usarComoFundo(asset);
      toast(`"${asset.nome}" virou o fundo da página`);
      return;
    }
    ed.inserirCamadas([M.camadaImagem(ed.doc, asset, pos)], { procurarLugar: pos.cx == null });
  };
  ed.trocarPor = (asset) => {
    const t = ed.trocando;
    ed.trocando = null;
    esq?.pintarTroca();
    if (!t || !asset) return;
    if (t.alvo === 'fundo') {
      ed.usarComoFundo(asset);
      return;
    }
    const c = ed.camada(t.id);
    if (!c) return;
    ed.mudar(() => {
      // 22/10 (achado da revisão): a imagem nova cabe dentro da caixa antiga (contain), com o mesmo centro e a proporção
      // dela, como o "Trocar objeto (mantém tamanho e posição)" do original. Antes ela mantinha a altura e a pose mais
      // larga do Léo saía da área segura e encostava na papelada; quem quiser maior usa a alça
      c.assetId = asset.id;
      c.nome = String(asset.nome ?? c.nome).slice(0, 80);
      if (asset.largura && asset.altura) Object.assign(c, caixaContida(c, asset.largura, asset.altura));
    });
  };
  ed.apagarSelecao = () => {
    const ids = new Set(ed.selecionadas().filter((c) => !c.travada).map((c) => c.id));
    if (!ids.size) { if (ed.sel.length) toast('Camada travada não apaga: destrave antes'); return; }
    ed.mudar((d) => { const p = d.paginas[ed.idx]; p.camadas = p.camadas.filter((c) => !ids.has(c.id)); });
    ed.sel = ed.sel.filter((id) => !ids.has(id));
    ed.redesenhar('tudo');
  };
  ed.duplicarSelecao = () => {
    const sel = ed.selecionadas();
    if (!sel.length) return;
    const copias = sel.map((c) => ({ ...M.clonar(c), id: M.novoId('cam'), x: c.x + 24, y: c.y + 24, travada: false }));
    ed.mudar((d) => {
      const p = d.paginas[ed.idx];
      const ult = Math.max(...sel.map((c) => p.camadas.indexOf(c)));
      p.camadas.splice(ult + 1, 0, ...copias);
    });
    ed.selecionar(copias.map((c) => c.id));
  };
  ed.copiar = (recortar = false) => {
    const sel = ed.selecionadas();
    if (!sel.length) return;
    ed.copiado = sel.map(M.clonar);
    ed.colagens = 0;
    toast(sel.length > 1 ? `${sel.length} camadas copiadas` : 'Camada copiada');
    if (recortar) ed.apagarSelecao();
  };
  ed.colar = () => {
    if (!ed.copiado?.length) return;
    ed.colagens += 1;
    const novas = ed.copiado.map((c) => ({ ...M.clonar(c), id: M.novoId('cam'), x: c.x + 24 * ed.colagens, y: c.y + 24 * ed.colagens, travada: false }));
    ed.mudar((d) => { d.paginas[ed.idx].camadas.push(...novas); });
    ed.selecionar(novas.map((c) => c.id));
  };
  // ordem: +1 sobe uma, -1 desce uma, 'frente' e 'tras' vão pro fim
  ed.ordenar = (dir, ids = ed.sel) => {
    const pag = ed.pagina();
    const alvo = new Set(ids);
    if (!alvo.size) return;
    ed.mudar(() => {
      const c = pag.camadas;
      if (dir === 'frente' || dir === 'tras') {
        const mov = c.filter((x) => alvo.has(x.id));
        const resto = c.filter((x) => !alvo.has(x.id));
        pag.camadas = dir === 'frente' ? [...resto, ...mov] : [...mov, ...resto];
        return;
      }
      const idxs = c.map((x, i) => (alvo.has(x.id) ? i : -1)).filter((i) => i >= 0);
      if (dir > 0) {
        for (const i of idxs.reverse()) if (i < c.length - 1 && !alvo.has(c[i + 1].id)) [c[i], c[i + 1]] = [c[i + 1], c[i]];
      } else {
        for (const i of idxs) if (i > 0 && !alvo.has(c[i - 1].id)) [c[i], c[i - 1]] = [c[i - 1], c[i]];
      }
    });
  };
  // 22/10 (Pedro): uma camada vai sozinha pro lugar; várias andam juntas como um bloco (a composição não desmonta) ou,
  // com "Entre si", alinham umas com as outras dentro da caixa da seleção
  ed.refAlinhar = lerLocal('est-ref-alinhar') === 'selecao' ? 'selecao' : 'pagina';
  ed.alinhar = (modo) => {
    const sel = ed.selecionadas();
    if (!sel.length) return;
    if (sel.length === 1) ed.mudar(() => M.alinhar(sel, modo, ed.doc));
    else if (ed.refAlinhar === 'selecao') ed.mudar(() => M.alinharEntreSi(sel, modo));
    else ed.mudar(() => M.alinharBloco(sel, modo, ed.doc));
  };
  ed.definirRefAlinhar = (ref) => {
    ed.refAlinhar = ref === 'selecao' ? 'selecao' : 'pagina';
    gravarLocal('est-ref-alinhar', ed.refAlinhar);
    props?.desenhar();
  };
  // 22/10 (Pedro): aumentar ou diminuir as escolhidas juntas (o Léo e os papéis do Destaque, a pílula com o ícone): cada
  // uma escala (letra, pílula, raio e sombra juntos) e o bloco fica com o mesmo centro, então a composição não desmonta
  // 22/10 (achado da revisão): o bloco cresce pelo centro sem estourar a área segura: o lado que passaria da margem
  // empurra o bloco pro lado que tem espaço; sem espaço, para na margem e avisa. O que é fundo (luz, partícula) não conta
  ed.escalarSelecao = (k) => {
    const sel = ed.selecionadas().filter((c) => !c.travada);
    if (!sel.length || !(k > 0)) return;
    const u = M.uniao(sel.map(M.caixaGirada));
    const cx = (u.x0 + u.x1) / 2;
    const cy = (u.y0 + u.y1) / 2;
    const seguras = sel.filter((c) => !ehDeFundo(c));
    const r = seguras.length ? escalaPeloCentro(M.uniao(seguras.map(M.caixaGirada)), k, M.areaSegura(ed.doc), cx, cy) : { k, dx: 0, dy: 0, parou: false };
    if (r.parou) toast('Chegou na área segura');
    if (Math.abs(r.k - 1) < 1e-6 && Math.abs(r.dx) < 0.05 && Math.abs(r.dy) < 0.05) return;
    ed.mudar(() => {
      for (const c of sel) {
        const ctr = M.centro(c);
        M.escalarCamada(c, r.k);
        c.x = Math.round((cx + (ctr.x - cx) * r.k - c.largura / 2 + r.dx) * 10) / 10;
        c.y = Math.round((cy + (ctr.y - cy) * r.k - c.altura / 2 + r.dy) * 10) / 10;
      }
    }, { chave: `escala-${sel.map((c) => c.id).join(',')}`, redesenhar: { pagina: true, sobre: true, props: true } });
  };
  // 22/10 (achado da revisão): o campo de % do painel. 100 é o tamanho das escolhidas quando a seleção foi feita; o
  // valor vem da largura de agora (o desfazer e a alça do grupo acompanham sem guardar nada à parte)
  let baseEscala = null;
  ed.tamanhoDaSelecao = () => {
    const sel = ed.selecionadas().filter((c) => !c.travada);
    if (!sel.length) return null;
    const u = M.uniao(sel.map(M.caixaGirada));
    const atual = Math.max(1e-6, u.x1 - u.x0);
    const chave = `${ed.doc.id ?? ''}|${ed.idx}|${sel.map((c) => c.id).sort().join(',')}`;
    if (baseEscala?.chave !== chave) baseEscala = { chave, largura: atual };
    return { pct: (atual / baseEscala.largura) * 100, base: baseEscala.largura, atual };
  };
  ed.escalarPara = (pct) => {
    const t = ed.tamanhoDaSelecao();
    const v = Math.min(200, Math.max(50, Number(pct)));
    if (!t || !Number.isFinite(v)) return;
    ed.escalarSelecao((t.base * v) / 100 / t.atual);
  };
  // espaço fixo entre as escolhidas (empilhar na vertical ou lado a lado)
  ed.empilhar = (eixo, vao) => {
    const sel = ed.selecionadas();
    if (sel.filter((c) => !c.travada).length < 2) return toast('Escolha 2 camadas ou mais (Shift + clique)');
    ed.mudar(() => M.empilhar(sel, eixo, Math.max(0, Number(vao) || 0)));
  };
  // estilo rápido de texto (Título, Subtítulo, Corpo, Kicker, Ênfase, Pílula): a tipografia muda, o texto e o lugar não
  ed.estiloTexto = (preset) => {
    const est = M.estiloDoPreset(ed.doc, preset);
    const sel = ed.selecionadas().filter((c) => c.tipo === 'texto' && !c.travada);
    if (!est || !sel.length) return;
    const escuro = M.fundoEscuro(ed.fundoAtual());
    ed.mudar(() => {
      for (const c of sel) {
        Object.assign(c, { tamanho: est.tamanho, peso: est.peso, fonte: est.fonte, italico: est.italico, alturaLinha: est.alturaLinha, espacamentoLetra: est.espacamentoLetra, caixa: est.caixa });
        if (est.destaqueCor) c.cor = escuro ? '#F2643C' : '#DD4E27';
        else if (['#f2643c', '#dd4e27', '#b83d1c'].includes(String(c.cor).toLowerCase())) c.cor = escuro ? '#F4F1EC' : '#1B1E24';
        if (est.pilula) {
          c.fundo = { cor: '#FEF3EE', raio: 999, padding: Math.round(est.tamanho * 0.6) };
          c.cor = '#B83D1C';
        } else c.fundo = null;
      }
    }, { redesenhar: { pagina: true, sobre: true, props: true, camadas: true } });
    // a pílula fica do tamanho do texto
    if (est.pilula && sel.length === 1) props?.ajustarLarguraAoTexto?.();
  };
  // A+ e A-: o próximo degrau da escada de tamanhos do formato
  ed.passoTamanho = (dir) => {
    const sel = ed.selecionadas().filter((c) => c.tipo === 'texto' && !c.travada);
    if (!sel.length) return;
    ed.mudar(() => { for (const c of sel) c.tamanho = M.proximoTamanho(ed.doc, c.tamanho, dir); }, { chave: `passo-${sel.map((c) => c.id).join(',')}`, redesenhar: { pagina: true, sobre: true, props: true } });
  };
  // fundo rápido (cor ou gradiente da marca) na página aberta. 22/10 (achado da revisão): virou de claro pra escuro (ou
  // o contrário), oferece trocar as cores dos textos e do logo também
  ed.fundoRapido = (fundo) => {
    const escuroAntes = M.fundoEscuro(ed.fundoAtual());
    ed.mudar((d) => Object.assign(d.paginas[ed.idx].fundo, { assetId: null, ...fundo }), { redesenhar: { pagina: true, sobre: true, props: true } });
    oferecerTrocaDeCores(escuroAntes);
  };
  ed.distribuir = (eixo) => {
    const sel = ed.selecionadas();
    if (sel.filter((c) => !c.travada).length < 3) return toast('Escolha 3 camadas ou mais (Shift + clique)');
    ed.mudar(() => M.distribuir(sel, eixo));
  };
  ed.moverSetas = (dx, dy) => {
    const sel = ed.selecionadas().filter((c) => !c.travada);
    if (!sel.length) return;
    ed.mudar(() => { for (const c of sel) { c.x += dx; c.y += dy; } }, { chave: 'setas', redesenhar: { pagina: true, sobre: true } });
  };
  ed.alternar = (id, campo) => {
    const c = ed.camada(id);
    if (!c) return;
    ed.mudar(() => { c[campo] = !c[campo]; });
    if (campo === 'oculta' && c.oculta && ed.sel.includes(id)) ed.selecionar(ed.sel.filter((x) => x !== id));
  };
  ed.renomear = (id, nome) => {
    const c = ed.camada(id);
    const n = String(nome ?? '').trim().slice(0, 80);
    if (!c || !n || n === c.nome) return;
    ed.mudar(() => { c.nome = n; }, { redesenhar: { camadas: true, props: true, avisos: true, sobre: true } });
  };

  // páginas (carrossel)
  ed.novaPagina = () => {
    const f = M.clonar(ed.pagina().fundo);
    ed.mudar((d) => { d.paginas.splice(ed.idx + 1, 0, M.paginaNova(f)); });
    ed.irPagina(ed.idx + 1);
  };
  // 22/10 (Pedro): as páginas de um modelo entram depois da aberta, já no formato deste design
  ed.inserirPaginasDoModelo = (modelo) => {
    if (destruido) return;
    const novas = M.paginasDoModelo(modelo, ed.doc, ed.assetsPorId);
    if (!novas.length) return;
    if (ed.doc.paginas.length + novas.length > 20) return toast('O design aceita no máximo 20 páginas');
    ed.mudar((d) => { d.paginas.splice(ed.idx + 1, 0, ...novas); });
    ed.irPagina(ed.idx + 1);
    toast(novas.length > 1 ? `${novas.length} páginas do modelo entraram` : 'A página do modelo entrou');
  };
  ed.duplicarPagina = (i = ed.idx) => {
    const p = M.clonar(ed.doc.paginas[i]);
    p.id = M.novoId('pag');
    for (const c of p.camadas) c.id = M.novoId('cam');
    ed.mudar((d) => { d.paginas.splice(i + 1, 0, p); });
    ed.irPagina(i + 1);
  };
  ed.apagarPagina = (i = ed.idx) => {
    if (ed.doc.paginas.length <= 1) return toast('O design precisa de pelo menos uma página');
    if (ed.doc.paginas[i].camadas.length && !window.confirm(`Apagar a página ${i + 1}? (Ctrl+Z volta)`)) return;
    ed.mudar((d) => { d.paginas.splice(i, 1); });
    ed.irPagina(Math.min(i, ed.doc.paginas.length - 1));
  };
  ed.moverPagina = (de, para) => {
    if (para < 0 || para >= ed.doc.paginas.length || de === para) return;
    ed.mudar((d) => { const [p] = d.paginas.splice(de, 1); d.paginas.splice(para, 0, p); });
    ed.irPagina(para);
  };

  // ── faixa de páginas ──
  function desenharFaixa() {
    const f = els.faixa;
    if (!f) return;
    const n = ed.doc.paginas.length;
    f.innerHTML = `
      <ol class="est-faixa-lista" aria-label="Páginas">
        ${ed.doc.paginas.map((p, i) => `
          <li class="est-pag${i === ed.idx ? ' ativa' : ''}" data-pag="${i}" draggable="true">
            <button type="button" class="est-pag-mini" data-ir="${i}" aria-label="Página ${i + 1}${i === ed.idx ? ', aberta' : ''}" aria-current="${i === ed.idx}"></button>
            <span class="est-pag-num">${i + 1}</span>
          </li>`).join('')}
      </ol>
      <div class="est-faixa-acoes">
        <button type="button" class="btn btn-sm" data-pag-acao="nova" title="Página nova depois desta">${ic('pagina-mais', 15)}Página</button>
        <button type="button" class="btn btn-sm" data-pag-acao="modelo" title="Página de um modelo pronto, depois desta">${ic('modelo', 15)}Modelo</button>
        <button type="button" class="btn-icone btn-sm" data-pag-acao="duplicar" title="Duplicar a página" aria-label="Duplicar a página">${ic('duplicar', 15)}</button>
        <button type="button" class="btn-icone btn-sm" data-pag-acao="esq" title="Mover pra esquerda" aria-label="Mover a página pra esquerda" ${ed.idx === 0 ? 'disabled' : ''}>${ic('chevron-esq', 15)}</button>
        <button type="button" class="btn-icone btn-sm" data-pag-acao="dir" title="Mover pra direita" aria-label="Mover a página pra direita" ${ed.idx === n - 1 ? 'disabled' : ''}>${ic('chevron-dir', 15)}</button>
        <button type="button" class="btn-icone btn-sm btn-perigo" data-pag-acao="apagar" title="Apagar a página" aria-label="Apagar a página" ${n <= 1 ? 'disabled' : ''}>${ic('lixo', 15)}</button>
        <span class="est-faixa-conta">${ed.idx + 1} de ${n}</span>
      </div>`;
    f.querySelectorAll('.est-pag-mini').forEach((b) => b.append(miniaturaEl(ed.doc, ed.doc.paginas[Number(b.dataset.ir)], 64)));
  }
  function agendarMiniatura() {
    clearTimeout(tempoFaixa);
    tempoFaixa = setTimeout(() => {
      const b = els.faixa?.querySelector(`[data-ir="${ed.idx}"]`);
      if (b && ed.pagina()) b.replaceChildren(miniaturaEl(ed.doc, ed.pagina(), 64));
    }, 350);
  }
  function ligarFaixa() {
    const f = els.faixa;
    f.addEventListener('click', (e) => {
      const b = e.target instanceof Element ? e.target.closest('[data-ir], [data-pag-acao]') : null;
      if (!b) return;
      if (b.dataset.ir != null) return ed.irPagina(Number(b.dataset.ir));
      const a = b.dataset.pagAcao;
      if (a === 'nova') ed.novaPagina();
      else if (a === 'modelo') abrirModelos({ formato: ed.doc.formato, aoEscolher: (m) => ed.inserirPaginasDoModelo(m), titulo: 'Página de um modelo' });
      else if (a === 'duplicar') ed.duplicarPagina();
      else if (a === 'apagar') ed.apagarPagina();
      else if (a === 'esq') ed.moverPagina(ed.idx, ed.idx - 1);
      else if (a === 'dir') ed.moverPagina(ed.idx, ed.idx + 1);
    });
    let arrastada = null;
    f.addEventListener('dragstart', (e) => {
      const li = e.target instanceof Element ? e.target.closest('[data-pag]') : null;
      if (!li) return;
      arrastada = Number(li.dataset.pag);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', `pagina ${arrastada + 1}`);
    });
    f.addEventListener('dragover', (e) => {
      if (arrastada == null) return;
      const li = e.target instanceof Element ? e.target.closest('[data-pag]') : null;
      if (!li) return;
      e.preventDefault();
      f.querySelectorAll('.est-pag').forEach((x) => x.classList.toggle('alvo', x === li));
    });
    f.addEventListener('drop', (e) => {
      const li = e.target instanceof Element ? e.target.closest('[data-pag]') : null;
      if (arrastada == null || !li) return;
      e.preventDefault();
      const para = Number(li.dataset.pag);
      const de = arrastada;
      arrastada = null;
      ed.moverPagina(de, para);
    });
    f.addEventListener('dragend', () => { arrastada = null; f.querySelectorAll('.est-pag.alvo').forEach((x) => x.classList.remove('alvo')); });
  }

  // ── barra de cima ──
  function pintarTopo() {
    if (!els.titulo) return;
    if (document.activeElement !== els.titulo) els.titulo.value = ed.doc.titulo;
    els.desfazer.disabled = !hist.antes.length;
    els.refazer.disabled = !hist.depois.length;
    els.segura.setAttribute('aria-pressed', String(ed.mostrarSegura));
    const peca = ed.doc.pecaId ? rotuloDaPeca(ed.doc.pecaId) : '';
    els.peca.innerHTML = `${ic('link', 15)}<span>${peca ? esc(peca.length > 34 ? `${peca.slice(0, 33)}…` : peca) : 'Vincular peça'}</span>`;
    els.peca.title = peca ? `Vinculado: ${peca}` : 'Vincular a uma peça do cronograma (a arte exportada pode ser anexada nela)';
    els.peca.classList.toggle('vinculado', Boolean(peca));
    pintarMecanismo();
    pintarRevisao();
  }
  // a conferência da copy do Ateliê (travessão, P39, concorrente, MEI sem contador, número com fonte...) roda no
  // servidor a cada gravação: o chip mostra o que ela achou na última
  function pintarRevisao() {
    const b = els.copy;
    if (!b) return;
    const falhas = ed.revisao?.textos?.falhas ?? [];
    b.hidden = !falhas.length;
    b.dataset.nivel = ed.revisao?.textos?.bloqueia ? 'bloqueante' : 'alerta';
    b.innerHTML = `${ic(ed.revisao?.textos?.bloqueia ? 'fechar' : 'alerta', 15)}<span>Copy: ${falhas.length}</span>`;
    b.title = 'Conferência da copy do Ateliê (regras duras), feita pelo servidor na última gravação';
  }
  // os avisos que a IA deixou ao gerar (aparece uma vez, quando o design gerado abre)
  function pintarNotaGeracao(g) {
    const n = els.nota;
    if (!n) return;
    const avisos = (g?.avisos ?? []).filter(Boolean);
    n.hidden = !avisos.length;
    if (!avisos.length) return;
    n.innerHTML = `${ic('ia', 16)}<div><strong>A IA terminou e deixou ${avisos.length} ponto${avisos.length > 1 ? 's' : ''} pra conferir</strong><ul>${avisos.slice(0, 6).map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div><button type="button" class="btn-icone btn-sm" data-fechar-nota aria-label="Fechar o aviso">${ic('fechar', 15)}</button>`;
    n.querySelector('[data-fechar-nota]').onclick = () => { n.hidden = true; };
  }
  function pintarMecanismo() {
    const b = els.mecanismo;
    if (!b) return;
    const n = ed.mecanismo?.length ?? 0;
    b.hidden = !n;
    b.innerHTML = `${ic('bandeira', 15)}<span>${n} do mecanismo</span>`;
    b.title = 'Repetição visual com outros designs (motor de não repetição e continuidade)';
  }
  function agendarMecanismo() {
    clearTimeout(tempoMecanismo);
    tempoMecanismo = setTimeout(carregarMecanismo, 2500);
  }
  async function carregarMecanismo() {
    try {
      ed.mecanismo = await A.alertasMecanismo(ed.id);
    } catch {
      ed.mecanismo = null; // rota ainda não existe ou falhou: o chip some
    }
    pintarMecanismo();
  }

  // balão discreto com a lista (avisos e mecanismo)
  function abrirBalao(botao, titulo, itens) {
    fecharBalao();
    const b = document.createElement('div');
    b.className = 'est-balao';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', titulo);
    b.innerHTML = `<strong>${esc(titulo)}</strong><ul>${itens.map((it, i) => `<li><button type="button" data-item="${i}" class="est-balao-item" data-nivel="${esc(it.nivel ?? 'revisar')}">${ic(it.nivel === 'alerta' ? 'alerta' : 'olho', 14)}<span>${esc(it.texto)}${it.extra ? `<small>${esc(it.extra)}</small>` : ''}</span></button></li>`).join('')}</ul>`;
    els.topo.append(b);
    const rb = botao.getBoundingClientRect();
    const rt = els.topo.getBoundingClientRect();
    b.style.left = `${Math.max(8, Math.min(rb.left - rt.left, rt.width - 380))}px`;
    b.addEventListener('click', (e) => {
      const i = e.target instanceof Element ? e.target.closest('[data-item]')?.dataset.item : null;
      if (i == null) return;
      itens[Number(i)].aoEscolher?.();
      fecharBalao();
    });
    setTimeout(() => document.addEventListener('pointerdown', fecharFora, true), 0);
    b.querySelector('button')?.focus();
  }
  function fecharFora(e) {
    if (e.target instanceof Element && (e.target.closest('.est-balao') || e.target.closest('[data-acao="avisos"], [data-acao="mecanismo"], [data-acao="copy"]'))) return;
    fecharBalao();
  }
  function fecharBalao() {
    els.topo?.querySelector('.est-balao')?.remove();
    document.removeEventListener('pointerdown', fecharFora, true);
  }

  function aoTopo(e) {
    const b = e.target instanceof Element ? e.target.closest('[data-acao], [data-conflito]') : null;
    if (!b) return;
    if (b.dataset.conflito) return resolverConflito(b.dataset.conflito);
    const a = b.dataset.acao;
    if (a === 'salvar') { ed.erroSalvar = null; if (ed.sujo) salvar(); else toast('Tudo salvo'); }
    else if (a === 'desfazer') ed.desfazer();
    else if (a === 'refazer') ed.refazer();
    else if (a === 'zoom-mais') ed.zoomPara(ed.zoom * 1.25);
    else if (a === 'zoom-menos') ed.zoomPara(ed.zoom / 1.25);
    else if (a === 'segura') {
      ed.mostrarSegura = !ed.mostrarSegura;
      gravarLocal('est-segura', ed.mostrarSegura ? '1' : '0');
      pintarTopo();
      desenharSobre();
    } else if (a === 'avisos') {
      if (els.topo.querySelector('.est-balao')) return fecharBalao();
      abrirBalao(b, 'Regras do Pedro nesta página', ed.avisos.map((av) => ({
        nivel: av.nivel, texto: av.texto,
        aoEscolher: () => { if (av.camadas.length) ed.selecionar(av.camadas.filter((id) => ed.camada(id))); },
      })));
    } else if (a === 'mecanismo') {
      if (els.topo.querySelector('.est-balao')) return fecharBalao();
      abrirBalao(b, 'Mecanismo: repetição visual', (ed.mecanismo ?? []).map((m) => {
        const p = m.parecidaCom;
        const titulo = p && typeof p === 'object' ? p.titulo : p;
        return {
          nivel: m.nivel === 'alerta' ? 'alerta' : 'revisar',
          texto: m.texto ?? String(m),
          extra: titulo ? `Parecido com "${titulo}"${p?.id ? ' (clique pra abrir)' : ''}` : '',
          aoEscolher: p?.id && p.id !== ed.id ? () => { location.hash = `#/atelie?design=${encodeURIComponent(p.id)}`; } : null,
        };
      }));
    } else if (a === 'copy') {
      if (els.topo.querySelector('.est-balao')) return fecharBalao();
      abrirBalao(b, 'Conferência da copy (última gravação)', (ed.revisao?.textos?.falhas ?? []).map((i) => ({
        nivel: i.nivel === 'bloqueante' || i.nivel === 'alerta' ? 'alerta' : 'revisar',
        texto: `${i.nome}${i.achados?.[0] ? `: ${i.achados[0].trecho}` : ''}`,
        extra: [i.achados?.[0]?.onde, i.dica].filter(Boolean).join(' · '),
      })));
    } else if (a === 'versoes') abrirVersoes(ed);
    else if (a === 'peca') abrirVincular(ed);
    else if (a === 'ia') abrirGerarIA({ doc: ed.doc, antes: () => { sairDoTexto(); return ed.salvarJa(); }, aoPronto: (novo) => ed.carregarNovaVersao(novo) });
    else if (a === 'exportar') abrirExportar(ed);
  }

  ed.carregarNovaVersao = (d) => {
    if (!d || destruido) return;
    if (d.id && d.id !== ed.id) { location.hash = `#/atelie?design=${encodeURIComponent(d.id)}`; return; }
    sairDoTexto();
    ed.guardarAntes();
    const n = M.normalizarDoc(d);
    ed.doc = n;
    ed.revisao = d.revisao ?? null;
    pintarNotaGeracao(d.geracao ?? null);
    ed.idx = Math.min(ed.idx, n.paginas.length - 1);
    ed.sel = [];
    ed.sujo = false;
    ed.conflito = false;
    pintarConflito();
    pintarEstadoSalvo();
    ed.redesenhar('tudo');
    agendarMecanismo();
  };
  ed.vincular = (pecaId) => {
    if (destruido || !ed.doc) return;
    ed.doc.pecaId = pecaId || null;
    ed.sujar();
    pintarTopo();
  };
  ed.mudarDocMeta = (fn) => {
    if (destruido || !ed.doc) return;
    fn(ed.doc);
    ed.sujar();
    pintarTopo();
  };

  // ── teclado ──
  function aoTeclar(e) {
    if (destruido || !no.isConnected || ed.modo !== 'edicao' || !ed.doc) return;
    if (document.getElementById('painel')?.hidden === false) return;
    const ctrl = e.ctrlKey || e.metaKey;
    const k = e.key;
    if (ctrl && (k === 's' || k === 'S')) { e.preventDefault(); salvar(); return; }
    if (ehCampo(e.target)) {
      if (k === 'Escape' && e.target === els.titulo) els.palco.focus();
      return;
    }
    // espaço, Enter, setas, Ctrl+A e PageUp/PageDown só valem com o foco na página (no botão, o teclado é do botão)
    const mesa = e.target === els.palco || e.target === document.body || e.target === document.documentElement;
    // setas também depois de clicar num botão do editor (alinhar, ordem...), menos nas abas e menus, que usam as setas
    const mesaSetas = mesa || (e.target instanceof HTMLButtonElement && no.contains(e.target) && !e.target.closest('[role="tablist"], [role="menu"], .est-balao'));
    if (k === ' ' && !espaco && mesa) { espaco = true; els.palco.dataset.espaco = ''; e.preventDefault(); return; }
    if (ctrl && !e.shiftKey && (k === 'z' || k === 'Z')) { e.preventDefault(); ed.desfazer(); return; }
    if (ctrl && ((e.shiftKey && (k === 'z' || k === 'Z')) || k === 'y' || k === 'Y')) { e.preventDefault(); ed.refazer(); return; }
    if (ctrl && (k === 'c' || k === 'C')) { if (ed.sel.length) { e.preventDefault(); ed.copiar(); } return; }
    if (ctrl && (k === 'x' || k === 'X')) { if (ed.sel.length) { e.preventDefault(); ed.copiar(true); } return; }
    if (ctrl && (k === 'd' || k === 'D')) { e.preventDefault(); ed.duplicarSelecao(); return; }
    if (ctrl && mesaSetas && (k === 'a' || k === 'A')) { e.preventDefault(); ed.selecionar(ed.pagina().camadas.filter((c) => !c.oculta && !ehDeFundo(c)).map((c) => c.id)); return; }
    if (ctrl && (k === '=' || k === '+')) { e.preventDefault(); ed.zoomPara(ed.zoom * 1.25); return; }
    if (ctrl && k === '-') { e.preventDefault(); ed.zoomPara(ed.zoom / 1.25); return; }
    if (ctrl && k === '0') { e.preventDefault(); ed.ajustar(); return; }
    if (ctrl && k === '1') { e.preventDefault(); ed.zoomPara(1); return; }
    if (ctrl && (k === ']' || k === '[')) { e.preventDefault(); ed.ordenar(e.shiftKey ? (k === ']' ? 'frente' : 'tras') : k === ']' ? 1 : -1); return; }
    if (k === 'Delete' || k === 'Backspace') { if (ed.sel.length) { e.preventDefault(); ed.apagarSelecao(); } return; }
    if (k === 'Escape') { if (ed.trocando) ed.cancelarTroca(); else if (ed.sel.length) ed.selecionar([]); return; }
    if (k === 'Enter' && mesa && ed.sel.length === 1 && ed.camada(ed.sel[0])?.tipo === 'texto') { e.preventDefault(); editarTexto(ed.sel[0]); return; }
    const passo = e.shiftKey ? 10 : 1;
    const setas = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] };
    if (setas[k] && mesaSetas && ed.sel.length) { e.preventDefault(); ed.moverSetas(...setas[k]); return; }
    if (!ctrl && !e.altKey && mesa && (k === 'PageDown' || k === 'PageUp')) { e.preventDefault(); ed.irPagina(ed.idx + (k === 'PageDown' ? 1 : -1)); }
  }
  function aoSoltarTecla(e) {
    if (e.key === ' ' && espaco) { espaco = false; if (els.palco) delete els.palco.dataset.espaco; }
  }
  function aoColar(e) {
    if (destruido || !no.isConnected || ed.modo !== 'edicao' || !ed.doc || ehCampo(e.target)) return;
    if (document.getElementById('painel')?.hidden === false) return;
    const arquivos = [...(e.clipboardData?.files ?? [])].filter((f) => /^image\/(png|jpeg|webp)$/.test(f.type));
    if (arquivos.length) { e.preventDefault(); esq?.subirArquivos(arquivos, { inserir: true }); return; }
    if (ed.copiado?.length) { e.preventDefault(); ed.colar(); }
  }
  function aoSairDaPagina(e) {
    if (!destruido && (ed.sujo || ed.salvando)) { e.preventDefault(); e.returnValue = ''; }
  }

  // ── montagem ──
  function montarEdicao() {
    no.dataset.modo = 'edicao';
    no.innerHTML = `
      <header class="est-topo">
        <a class="btn-icone btn-sm" href="#/atelie?area=design" aria-label="Voltar pros designs" title="Voltar pros designs">${ic('voltar', 17)}</a>
        <input class="est-titulo" aria-label="Título do design" maxlength="160" spellcheck="true">
        <button type="button" class="est-salvo" data-acao="salvar" aria-live="polite" title="Salva sozinho a cada mudança. Clique (ou Ctrl+S) pra salvar agora"></button>
        <span class="est-div" aria-hidden="true"></span>
        <button type="button" class="btn-icone btn-sm" data-acao="desfazer" aria-label="Desfazer" title="Desfazer (Ctrl+Z)">${ic('desfazer', 17)}</button>
        <button type="button" class="btn-icone btn-sm" data-acao="refazer" aria-label="Refazer" title="Refazer (Ctrl+Shift+Z)">${ic('refazer', 17)}</button>
        <span class="est-div" aria-hidden="true"></span>
        <div class="est-zoom" role="group" aria-label="Zoom">
          <button type="button" class="btn-icone btn-sm" data-acao="zoom-menos" aria-label="Diminuir o zoom" title="Diminuir (Ctrl e menos)">${ic('zoom-menos', 16)}</button>
          <select class="campo est-zoom-valor" aria-label="Zoom">
            <option value="ajustar">Ajustar</option>
            <option value="25">25%</option><option value="50">50%</option><option value="75">75%</option>
            <option value="100">100%</option><option value="150">150%</option><option value="200">200%</option>
            <option value="" data-atual hidden></option>
          </select>
          <button type="button" class="btn-icone btn-sm" data-acao="zoom-mais" aria-label="Aumentar o zoom" title="Aumentar (Ctrl e mais)">${ic('zoom-mais', 16)}</button>
        </div>
        <button type="button" class="btn-icone btn-sm" data-acao="segura" aria-label="Mostrar a área segura" title="Área segura (margem de segurança do Pedro)">${ic('segura', 17)}</button>
        <span class="espaco"></span>
        <button type="button" class="est-chip" data-acao="avisos" hidden></button>
        <button type="button" class="est-chip" data-acao="copy" hidden></button>
        <button type="button" class="est-chip est-chip-mec" data-acao="mecanismo" hidden></button>
        <button type="button" class="btn btn-sm btn-fantasma" data-acao="versoes" title="Versões guardadas (as 20 últimas)">${ic('relogio', 15)}Versões</button>
        <button type="button" class="btn btn-sm est-peca" data-acao="peca"></button>
        <button type="button" class="btn btn-sm" data-acao="ia" title="Pedir uma versão nova pra IA">${ic('ia', 15)}IA</button>
        <button type="button" class="btn btn-primario btn-sm" data-acao="exportar">${ic('baixar', 15)}Exportar</button>
      </header>
      <div class="est-conflito" role="alert" hidden></div>
      <div class="est-nota" role="status" hidden></div>
      <div class="est-corpo">
        <aside class="est-esq" aria-label="Assets e camadas"></aside>
        <section class="est-meio">
          <div class="est-palco" tabindex="0" aria-label="Página em edição. Setas movem, Delete apaga, Ctrl+Z desfaz">
            <div class="est-folha-caixa"><div class="est-folha"></div></div>
            <div class="est-sobre" aria-hidden="true"></div>
            <p class="est-palco-dica"${lerLocal('est-dica-vista') === '1' ? ' hidden' : ''}>Clique pra escolher · arraste pra mover · duplo clique no texto edita · Alt + clique pega o fundo (luz, partícula) · espaço + arrastar anda pela página</p>
          </div>
          <div class="est-faixa"></div>
        </section>
        <aside class="est-dir" aria-label="Propriedades"></aside>
      </div>`;
    const q = (s) => no.querySelector(s);
    els = {
      topo: q('.est-topo'), titulo: q('.est-titulo'), salvo: q('.est-salvo'), desfazer: q('[data-acao="desfazer"]'), refazer: q('[data-acao="refazer"]'),
      zoom: q('.est-zoom-valor'), segura: q('[data-acao="segura"]'), avisos: q('[data-acao="avisos"]'), mecanismo: q('[data-acao="mecanismo"]'),
      peca: q('[data-acao="peca"]'), copy: q('[data-acao="copy"]'), nota: q('.est-nota'), conflito: q('.est-conflito'), palco: q('.est-palco'), folhaCaixa: q('.est-folha-caixa'),
      folha: q('.est-folha'), sobre: q('.est-sobre'), faixa: q('.est-faixa'), esq: q('.est-esq'), dir: q('.est-dir'),
    };
    els.topo.addEventListener('click', aoTopo);
    els.conflito.addEventListener('click', aoTopo);
    els.titulo.addEventListener('input', () => {
      const t = els.titulo.value.trim();
      if (!t) return;
      ed.mudar((d) => { d.titulo = t.slice(0, 160); }, { chave: 'titulo', redesenhar: null });
    });
    els.titulo.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); els.palco.focus(); } });
    els.titulo.addEventListener('blur', () => { if (!els.titulo.value.trim()) els.titulo.value = ed.doc.titulo; });
    els.zoom.addEventListener('change', () => {
      const v = els.zoom.value;
      if (v === 'ajustar') ed.ajustar();
      else if (v) ed.zoomPara(Number(v) / 100);
      els.palco.focus({ preventScroll: true });
    });
    els.palco.addEventListener('pointerdown', aoApertar);
    // a dica de uso some depois do primeiro clique na página (e não volta mais neste navegador)
    els.palco.addEventListener('pointerdown', () => {
      const d = no.querySelector('.est-palco-dica');
      if (d && !d.hidden) { d.hidden = true; gravarLocal('est-dica-vista', '1'); }
    }, { once: true });
    els.palco.addEventListener('pointermove', aoMover);
    els.palco.addEventListener('pointerup', aoSoltar);
    els.palco.addEventListener('pointercancel', aoSoltar);
    els.palco.addEventListener('pointerleave', () => { if (!arr && ed.sobreId) { ed.sobreId = null; desenharSobre(); } });
    els.palco.addEventListener('dblclick', aoDuploClique);
    els.palco.addEventListener('wheel', aoRoda, { passive: false });
    els.palco.addEventListener('dragover', (e) => {
      const tipos = [...(e.dataTransfer?.types ?? [])];
      if (tipos.includes('application/x-estudio-asset') || tipos.includes('Files')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; els.palco.classList.add('soltando'); }
    });
    els.palco.addEventListener('dragleave', () => els.palco.classList.remove('soltando'));
    els.palco.addEventListener('drop', aoSoltarArrastado);
    els.palco.addEventListener('contextmenu', (e) => e.preventDefault());
    ligarFaixa();
    props = montarPropriedades(ed, els.dir);
    esq = montarEsquerda(ed, els.esq);
    ed.esq = esq;
    new ResizeObserver(() => { if (ed.ajustado) ed.ajustar(); else desenharSobre(); }).observe(els.palco);
    pintarEstadoSalvo();
    pintarConflito();
    ed.redesenhar('tudo');
    requestAnimationFrame(() => ed.ajustar());
  }

  // celular: prévia de todas as páginas, com exportar
  function montarPrevia() {
    no.dataset.modo = 'previa';
    els = {};
    props = null;
    esq = null;
    const n = ed.doc.paginas.length;
    no.innerHTML = `
      <header class="est-previa-topo">
        <a class="btn-icone btn-sm" href="#/atelie?area=design" aria-label="Voltar pros designs">${ic('voltar', 17)}</a>
        <div><h1>${esc(ed.doc.titulo)}</h1><p>${esc(M.formatoInfo(ed.doc.formato).nome)} · ${ed.doc.largura} × ${ed.doc.altura} · ${n} página${n > 1 ? 's' : ''}</p></div>
      </header>
      <p class="aviso info">${ic('info', 16)}<span>Pra editar, abra no computador. Aqui dá pra ver e exportar.</span></p>
      <div class="est-previa-acoes">
        <button type="button" class="btn btn-primario" data-previa="pdf">${ic('baixar', 15)}PDF com tudo</button>
        <button type="button" class="btn" data-previa="png-todas">${ic('baixar', 15)}PNG de cada página</button>
      </div>
      <ol class="est-previa-lista">${ed.doc.paginas.map((_, i) => `
        <li><div class="est-previa-pag" data-pag="${i}"></div>
        <div class="est-previa-rodape"><span>Página ${i + 1}</span><button type="button" class="btn btn-sm" data-previa="png" data-i="${i}">${ic('baixar', 14)}PNG</button></div></li>`).join('')}</ol>`;
    const largura = Math.min(520, Math.max(240, (no.clientWidth || window.innerWidth) - 32));
    no.querySelectorAll('.est-previa-pag').forEach((c) => c.append(miniaturaEl(ed.doc, ed.doc.paginas[Number(c.dataset.pag)], largura)));
    no.addEventListener('click', aoPrevia);
  }
  async function aoPrevia(e) {
    const b = e.target instanceof Element ? e.target.closest('[data-previa]') : null;
    if (!b || b.disabled) return;
    b.disabled = true;
    try { await exportarRapido(ed, b.dataset.previa, Number(b.dataset.i ?? 0)); } catch (err) { toast(err.message); } finally { b.disabled = false; }
  }

  function trocarModo() {
    const novo = CELULAR.matches ? 'previa' : 'edicao';
    if (novo === ed.modo || !ed.doc) return;
    sairDoTexto();
    no.removeEventListener('click', aoPrevia);
    ed.modo = novo;
    if (novo === 'edicao') montarEdicao(); else montarPrevia();
  }

  async function iniciar() {
    no.innerHTML = `<div class="est-carregando" aria-busy="true"><span class="est-girando" aria-hidden="true"></span><span role="status">Abrindo o design</span></div>`;
    try {
      const [d] = await Promise.all([A.lerDoc(docId), carregarFontes(), document.fonts?.ready]);
      if (destruido) return;
      if (!d || typeof d !== 'object' || !d.id) throw Object.assign(new Error('Esse design não existe mais'), { status: 404 });
      ed.doc = M.normalizarDoc(d);
      ed.revisao = d.revisao ?? null;
    } catch (e) {
      if (destruido) return;
      no.innerHTML = `
        <div class="card vazio est-erro">
          <span class="vazio-ico">${ic('alerta', 22)}</span>
          <strong>${e.status === 404 ? 'Esse design não existe mais' : 'O design não abriu'}</strong>
          <p>${esc(e.status === 404 ? 'Pode ter sido apagado por alguém do time.' : e.message)}</p>
          <a class="btn" href="#/atelie?area=design">${ic('voltar', 15)}Voltar pros designs</a>
        </div>`;
      return;
    }
    if (ed.modo === 'edicao') montarEdicao(); else montarPrevia();
    if (ed.modo === 'edicao') pintarNotaGeracao(avisosDaGeracao(ed.id, ed.doc.versao));
    carregarMecanismo();
    try {
      ed.assets = await A.listarAssets({ ocultos: true });
      ed.assetsPorId = new Map(ed.assets.map((a) => [a.id, a]));
    } catch (e) {
      ed.assets = [];
      ed.erroAssets = e.message;
    }
    // 22/10 (Pedro): até aqui a grade dizia "o banco está vazio" enquanto a lista ainda vinha
    ed.assetsProntos = true;
    if (destruido) return;
    esq?.desenharAssets();
    // 22/10 (Pedro): o painel da direita foi desenhado antes da lista de assets (o fundo aparecia só "Imagem"): redesenha
    if (ed.modo === 'edicao') ed.redesenhar({ avisos: true, sobre: true, props: true });
  }
  ed.atualizarAssets = (lista) => {
    ed.assets = lista;
    ed.assetsPorId = new Map(lista.map((a) => [a.id, a]));
    esq?.desenharAssets();
    ed.redesenhar({ pagina: true, avisos: true, sobre: true });
  };

  window.addEventListener('keydown', aoTeclar);
  window.addEventListener('keyup', aoSoltarTecla);
  window.addEventListener('blur', () => { espaco = false; });
  document.addEventListener('paste', aoColar);
  window.addEventListener('beforeunload', aoSairDaPagina);
  CELULAR.addEventListener('change', trocarModo);
  iniciar();

  return {
    id: docId,
    no,
    ativar() {
      // a vista foi redesenhada (recarga do estado) e o nó voltou pro lugar: as medidas da tela mudam
      if (ed.modo === 'edicao' && els.palco) requestAnimationFrame(() => { if (ed.ajustado) ed.ajustar(); else desenharSobre(); pintarTopo(); });
      if (CELULAR.matches !== (ed.modo === 'previa')) trocarModo();
    },
    async destruir() {
      if (destruido) return;
      sairDoTexto();
      // 22/10 (achado da revisão): a porta fecha antes do último salvo. Daqui pra frente ed.mudar, ed.sujar e o salvar
      // não gravam (o ouvinte velho de um diálogo mexia no design fechado); o que já estava por salvar vai uma vez,
      // depois do salvo que estiver no meio do caminho
      destruido = true;
      clearTimeout(tempoSalvar);
      clearTimeout(tempoFaixa);
      clearTimeout(tempoMecanismo);
      fecharOferta();
      window.removeEventListener('keydown', aoTeclar);
      window.removeEventListener('keyup', aoSoltarTecla);
      document.removeEventListener('paste', aoColar);
      window.removeEventListener('beforeunload', aoSairDaPagina);
      CELULAR.removeEventListener('change', trocarModo);
      fecharBalao();
      while (ed.salvando) await new Promise((r) => setTimeout(r, 120));
      if (ed.sujo && !ed.conflito) { try { await salvar({ ultimo: true }); } catch { /* fica o aviso */ } }
      clearTimeout(tempoSalvar);
    },
    // pro teste no navegador
    _ed: ed,
  };
}
