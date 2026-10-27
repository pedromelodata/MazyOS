// 22/10 (Pedro): estúdio de design do Ateliê ("um Canva básico dentro do sistema"). Este módulo é o modelo do
// documento, sem DOM: formatos e margens de segurança, a normalização do que chega do servidor ou da IA, as camadas
// novas (texto, forma, imagem), a geometria (caixa girada, encaixe, alinhar, distribuir) e os avisos das regras do
// Pedro (área segura, nada atravessa nada, barrinha antes de texto, travessão, grafia, símbolo inteiro).
// Quem usa: editor.js, render.js, lista.js e o teste do Node (server/testes/front-estudio.test.mjs).
// Coordenadas em pixels do documento, origem no canto de cima à esquerda; a rotação gira em volta do centro.

// ── Formatos e área segura ───────────────────────────────────────────────
export const FORMATOS = [
  { id: 'stories', nome: 'Stories', medida: '1080 × 1920', largura: 1080, altura: 1920 },
  { id: 'feed45', nome: 'Feed 4:5', medida: '1080 × 1350', largura: 1080, altura: 1350 },
  { id: 'quadrado', nome: 'Quadrado', medida: '1080 × 1080', largura: 1080, altura: 1080 },
  { id: 'personalizado', nome: 'Personalizado', medida: 'Você escolhe', largura: 1080, altura: 1350 },
];
export const formatoInfo = (id) => FORMATOS.find((f) => f.id === id) ?? FORMATOS[3];
// o mesmo teto dos assets (8000 px): página maior que isso não exporta em 2x em navegador nenhum
export const LADO_MIN = 100;
export const LADO_MAX = 8000;

// 09/10 (Pedro): stories e vídeo 1080x1920 com 96 nas laterais, 240 no topo e 360 na base; feed com 72 em volta.
// Personalizado: 72 na proporção do lado menor (no mínimo 8), a mesma conta do servidor (estudio.mjs, areaSegura)
export function margemSegura(doc) {
  const w = num(doc?.largura, 1080, 1);
  const h = num(doc?.altura, 1920, 1);
  if (doc?.formato === 'stories') {
    const k = w / 1080;
    return { esq: Math.round(96 * k), dir: Math.round(96 * k), topo: Math.round(240 * k), base: Math.round(360 * k) };
  }
  const m = Math.max(8, Math.round((72 * Math.min(w, h)) / 1080));
  return { esq: m, dir: m, topo: m, base: m };
}
export function areaSegura(doc) {
  const m = margemSegura(doc);
  return { x0: m.esq, y0: m.topo, x1: num(doc?.largura, 1080) - m.dir, y1: num(doc?.altura, 1920) - m.base };
}

// ── Cores da marca (design guide) ────────────────────────────────────────
export const PALETA = [
  { cor: '#FAF8F5', nome: 'Papel quente' },
  { cor: '#FFFFFF', nome: 'Branco (card)' },
  { cor: '#F1EEE9', nome: 'Papel alternativo' },
  { cor: '#FEF3EE', nome: 'Tint coral' },
  { cor: '#F2643C', nome: 'Coral' },
  { cor: '#DD4E27', nome: 'Coral 600' },
  { cor: '#B83D1C', nome: 'Coral 700' },
  { cor: '#1B1E24', nome: 'Ink' },
  { cor: '#524E48', nome: 'Ink secundário' },
  { cor: '#E3DED7', nome: 'Hairline' },
  { cor: '#15171C', nome: 'Escuro' },
  { cor: '#1F2228', nome: 'Card escuro' },
  { cor: '#F4F1EC', nome: 'Texto no escuro' },
  { cor: '#BDB8B0', nome: 'Secundário no escuro' },
];
// gradientes prontos do design guide (o contrato tem duas cores e um ângulo)
export const GRADIENTES = [
  { nome: 'Ink hero', cor: '#2A2E37', cor2: '#15171C', angulo: 160 },
  { nome: 'Coral', cor: '#F2643C', cor2: '#DD4E27', angulo: 160 },
  { nome: 'Papel', cor: '#FAF8F5', cor2: '#F1EEE9', angulo: 180 },
  { nome: 'Vinheta', cor: '#392829', cor2: '#1A1E24', angulo: 180 },
];

// ── Números, cores e ids ─────────────────────────────────────────────────
export function num(v, padrao = 0, min = -Infinity, max = Infinity) {
  const n = typeof v === 'string' && v.trim() === '' ? NaN : Number(v);
  if (!Number.isFinite(n)) return padrao;
  return Math.min(max, Math.max(min, n));
}
const COR_OK = /^(#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|rgba?\([\d.,%\s/]+\)|hsla?\([\d.,%\sdeg/]+\)|transparent)$/i;
export const corValida = (v) => typeof v === 'string' && COR_OK.test(v.trim());
export const cor = (v, padrao) => (corValida(v) ? v.trim() : padrao);

// luminância relativa (0 a 1) de #rgb, #rrggbb ou rgb(); o resto conta como claro
export function luminancia(c) {
  const s = String(c ?? '').trim();
  let r; let g; let b;
  let m = /^#([0-9a-f]{3,4})$/i.exec(s);
  if (m) [r, g, b] = [...m[1].slice(0, 3)].map((x) => parseInt(x + x, 16));
  else if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s))) [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  else if ((m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s))) [r, g, b] = [m[1], m[2], m[3]].map(Number);
  else return 1;
  const lin = (v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
export const corEscura = (c) => luminancia(c) < 0.22;
// fundo da página escuro? (gradiente: a média das duas pontas). Fundo de imagem: a "cor por trás", que o editor mantém
// igual à cor média da imagem (corDoAssetDeFundo ou a medida no navegador)
export function fundoEscuro(fundo) {
  if (!fundo) return false;
  if (fundo.tipo === 'gradiente') return (luminancia(fundo.cor) + luminancia(fundo.cor2)) / 2 < 0.22;
  return corEscura(fundo.cor);
}

// 22/10 (Pedro): cor com transparência. {r, g, b} de 0 a 255 e a de 0 a 1; o que não reconhece (hsl, nome) volta null
export function rgbaDe(c) {
  const s = String(c ?? '').trim();
  let m = /^#([0-9a-f]{3,4})$/i.exec(s);
  if (m) {
    const v = [...m[1]].map((x) => parseInt(x + x, 16));
    return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] / 255 : 1 };
  }
  if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s))) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
    return { r, g, b, a: m[2] ? parseInt(m[2], 16) / 255 : 1 };
  }
  if ((m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/i.exec(s))) {
    const a = m[4] == null ? 1 : Number(m[4]) / (m[5] ? 100 : 1);
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: Math.min(1, Math.max(0, a)) };
  }
  if (/^transparent$/i.test(s)) return { r: 0, g: 0, b: 0, a: 0 };
  return null;
}
const hex2 = (n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
// a cor de cima (com a transparência dela e a opacidade da camada) pintada sobre a de baixo: o que o olho vê.
// A de baixo conta como sólida; sem dar pra ler a de cima, fica a de baixo
export function comporCor(cima, baixo, opacidade = 1) {
  const t = rgbaDe(cima);
  const b = rgbaDe(baixo) ?? { r: 255, g: 255, b: 255, a: 1 };
  const a = t ? t.a * Math.min(1, Math.max(0, opacidade)) : 0;
  const p = t ?? b;
  return `#${hex2(p.r * a + b.r * (1 - a))}${hex2(p.g * a + b.g * (1 - a))}${hex2(p.b * a + b.b * (1 - a))}`;
}

// a cor que representa um asset de fundo (vira a "cor por trás" do fundo de imagem: o texto novo nasce na cor certa e o
// contraste é medido contra ela). A cor média que o servidor mandar (corMedia), senão o tom dos fundos da marca pelo
// nome e pelas tags; null quando não dá pra saber (o editor mede a imagem no navegador)
const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
export function corDoAssetDeFundo(a) {
  if (!a) return null;
  if (corValida(a.corMedia)) return a.corMedia.trim();
  const s = semAcento(`${a.id} ${a.nome} ${(a.tags ?? []).join(' ')}`);
  if (/vinheta/.test(s)) return '#2A2327';
  if (/escuro|ink|noite/.test(s)) return '#1F2228';
  if (/coral/.test(s) && !/brilho|luz/.test(s)) return '#F2643C';
  if (/papel|claro|creme/.test(s)) return '#FAF8F5';
  return null;
}

export function novoId(prefixo) {
  const b = new Uint8Array(8);
  globalThis.crypto?.getRandomValues ? globalThis.crypto.getRandomValues(b) : b.forEach((_, i) => { b[i] = Math.floor(Math.random() * 256); });
  return `${prefixo}_${[...b].map((x) => x.toString(36).padStart(2, '0')).join('').slice(0, 12)}`;
}

export const clonar = (x) => (typeof structuredClone === 'function' ? structuredClone(x) : JSON.parse(JSON.stringify(x)));

// ── Normalização (o que chega do servidor, da IA ou de uma versão antiga) ──
const FONTES_OK = ['Sora', 'DM Serif Display'];
const NOMES_TIPO = { texto: 'Texto', imagem: 'Imagem', forma: 'Forma' };

export function fundoPadrao() {
  return { tipo: 'cor', cor: '#FAF8F5', cor2: '#F1EEE9', angulo: 160, assetId: null, ajuste: 'cobrir' };
}
export function normalizarFundo(f) {
  const p = fundoPadrao();
  if (!f || typeof f !== 'object') return p;
  return {
    tipo: ['cor', 'gradiente', 'imagem'].includes(f.tipo) ? f.tipo : 'cor',
    cor: cor(f.cor, p.cor),
    cor2: cor(f.cor2, p.cor2),
    angulo: num(f.angulo, p.angulo, -360, 360),
    assetId: typeof f.assetId === 'string' && f.assetId ? f.assetId : null,
    ajuste: f.ajuste === 'conter' ? 'conter' : 'cobrir',
  };
}

export function normalizarCamada(c) {
  if (!c || typeof c !== 'object' || !NOMES_TIPO[c.tipo]) return null;
  const base = {
    id: typeof c.id === 'string' && c.id ? c.id : novoId('cam'),
    tipo: c.tipo,
    nome: String(c.nome ?? '').trim().slice(0, 80) || NOMES_TIPO[c.tipo],
    x: num(c.x, 0, -40000, 40000),
    y: num(c.y, 0, -40000, 40000),
    largura: num(c.largura, 200, 1, 40000),
    altura: num(c.altura, c.tipo === 'texto' ? 80 : 200, 1, 40000),
    rotacao: num(c.rotacao, 0, -360, 360),
    opacidade: num(c.opacidade, 1, 0, 1),
    travada: Boolean(c.travada),
    oculta: Boolean(c.oculta),
    // 23/10 (Pedro: Ctrl + G): as camadas com o mesmo grupo andam juntas
    ...(typeof c.grupo === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(c.grupo) ? { grupo: c.grupo } : {}),
  };
  if (c.tipo === 'texto') {
    const fonte = FONTES_OK.includes(c.fonte) ? c.fonte : 'Sora';
    const tamanho = num(c.tamanho, 64, 6, 1200);
    // espacamentoLetra é em "em" (fração do tamanho: -0.03 = -3%). Valor com módulo 1 ou mais só pode ter vindo em px
    // (ninguém usa 1em de espaço entre letras): vira em pelo tamanho
    let esp = num(c.espacamentoLetra, 0);
    if (Math.abs(esp) >= 1) esp /= tamanho;
    const f = c.fundo && typeof c.fundo === 'object' ? c.fundo : null;
    return {
      ...base,
      texto: String(c.texto ?? '').slice(0, 4000),
      fonte,
      // 22/10 (Pedro): Sora no máximo 800; a DM Serif Display só tem o 400
      peso: fonte === 'DM Serif Display' ? 400 : Math.min(800, Math.max(400, Math.round(num(c.peso, 700) / 100) * 100)),
      italico: fonte === 'DM Serif Display' ? true : Boolean(c.italico),
      tamanho,
      cor: cor(c.cor, '#1B1E24'),
      corDestaque: cor(c.corDestaque, '#DD4E27'),
      alinhamento: ['esquerda', 'centro', 'direita'].includes(c.alinhamento) ? c.alinhamento : 'esquerda',
      alturaLinha: num(c.alturaLinha, 1.15, 0.6, 4),
      espacamentoLetra: Math.max(-0.5, Math.min(1, Number(esp.toFixed(4)))),
      caixa: c.caixa === 'alta' ? 'alta' : 'normal',
      fundo: f ? { cor: cor(f.cor, '#FEF3EE'), raio: num(f.raio, 999, 0, 9999), padding: num(f.padding, 20, 0, 600) } : null,
    };
  }
  if (c.tipo === 'imagem') {
    const s = c.sombra && typeof c.sombra === 'object' ? c.sombra : null;
    return {
      ...base,
      assetId: typeof c.assetId === 'string' && c.assetId ? c.assetId : null,
      espelhar: Boolean(c.espelhar),
      raio: num(c.raio, 0, 0, 9999),
      sombra: s ? { cor: cor(s.cor, 'rgba(27,30,36,0.22)'), desfoque: num(s.desfoque, 24, 0, 600), x: num(s.x, 0, -600, 600), y: num(s.y, 18, -600, 600) } : null,
    };
  }
  const b = c.borda && typeof c.borda === 'object' ? c.borda : null;
  return {
    ...base,
    forma: ['retangulo', 'circulo', 'linha'].includes(c.forma) ? c.forma : 'retangulo',
    cor: cor(c.cor, '#F2643C'),
    borda: b ? { cor: cor(b.cor, '#E3DED7'), largura: num(b.largura, 2, 0, 400) } : null,
    raio: num(c.raio, 0, 0, 9999),
  };
}

export function paginaNova(fundo = null) {
  return { id: novoId('pag'), fundo: normalizarFundo(fundo), camadas: [] };
}
export function normalizarPagina(p) {
  const camadas = (Array.isArray(p?.camadas) ? p.camadas : []).map(normalizarCamada).filter(Boolean);
  // id repetido (cópia feita à mão no JSON) quebraria seleção e desenho: ganha outro
  const vistos = new Set();
  for (const c of camadas) { if (vistos.has(c.id)) c.id = novoId('cam'); vistos.add(c.id); }
  return { id: typeof p?.id === 'string' && p.id ? p.id : novoId('pag'), fundo: normalizarFundo(p?.fundo), camadas };
}

export function normalizarDoc(d = {}) {
  const formato = ['stories', 'feed45', 'quadrado', 'personalizado'].includes(d.formato) ? d.formato : 'personalizado';
  const f = formatoInfo(formato);
  const largura = Math.round(num(d.largura, f.largura, LADO_MIN, LADO_MAX));
  const altura = Math.round(num(d.altura, f.altura, LADO_MIN, LADO_MAX));
  const paginas = (Array.isArray(d.paginas) && d.paginas.length ? d.paginas : [paginaNova()]).map(normalizarPagina);
  const vistas = new Set();
  for (const p of paginas) { if (vistas.has(p.id)) p.id = novoId('pag'); vistas.add(p.id); }
  const e = d.estrategia && typeof d.estrategia === 'object' ? d.estrategia : null;
  return {
    ...d,
    guiasFixas: normalizarGuias(d.guiasFixas),
    titulo: String(d.titulo ?? '').trim().slice(0, 160) || 'Design sem título',
    formato,
    largura,
    altura,
    paginas,
    pecaId: typeof d.pecaId === 'string' && d.pecaId ? d.pecaId : null,
    origem: ['manual', 'ia', 'importado'].includes(d.origem) ? d.origem : 'manual',
    estrategia: e ? {
      pilar: e.pilar ?? null,
      bloco: e.bloco ?? null,
      motivo: String(e.motivo ?? ''),
      gatilhoEmocional: String(e.gatilhoEmocional ?? ''),
      gatilhoPsicologico: String(e.gatilhoPsicologico ?? ''),
    } : null,
    versao: Number.isFinite(Number(d.versao)) ? Number(d.versao) : 0,
  };
}

// 23/10 (Pedro: "régua horizontal e vertical que também aplica a regra dos artboards"): as guias puxadas da régua valem
// pro design inteiro, na mesma posição em todas as páginas. v = as verticais (x), h = as horizontais (y)
export const MAX_GUIAS = 40;
export function normalizarGuias(g) {
  const lista = (l) => [...new Set((Array.isArray(l) ? l : []).map(Number).filter(Number.isFinite).map((n) => Math.round(n * 10) / 10))].slice(0, MAX_GUIAS);
  return { v: lista(g?.v), h: lista(g?.h) };
}

// o que vai no PUT (o servidor cuida de id, autoria, datas e da versão nova)
export function corpoParaSalvar(doc) {
  return {
    titulo: doc.titulo,
    formato: doc.formato,
    largura: doc.largura,
    altura: doc.altura,
    paginas: doc.paginas,
    pecaId: doc.pecaId ?? null,
    origem: doc.origem,
    estrategia: doc.estrategia ?? null,
    guiasFixas: normalizarGuias(doc.guiasFixas),
    versao: doc.versao,
  };
}

// ── Texto com *destaque* ─────────────────────────────────────────────────
// trecho entre asteriscos ganha a cor de destaque; asterisco sem par fica como está
export function trechosDestaque(texto) {
  const s = String(texto ?? '');
  const out = [];
  let i = 0;
  const re = /\*([^*\n][^*]*?)\*/g;
  let m;
  while ((m = re.exec(s))) {
    if (m.index > i) out.push({ t: s.slice(i, m.index), destaque: false });
    out.push({ t: m[1], destaque: true });
    i = m.index + m[0].length;
  }
  if (i < s.length) out.push({ t: s.slice(i), destaque: false });
  return out;
}
export const textoSemMarcas = (texto) => trechosDestaque(texto).map((p) => p.t).join('');
// 22/10 (achado da revisão): a mesma conta de palavras do servidor (estudio.mjs, palavrasDaPagina): pedaço entre espaços
// com letra ou número ("31/12/2026" é uma palavra; antes o editor contava três)
export const contarPalavras = (texto) => String(texto ?? '').replace(/\*/g, ' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

// ── Escala do formato (a mesma da conferência do servidor) ───────────────
// 22/10 (achado da revisão): uma escala por formato, igual nos dois lados (estudio.mjs, revisarDesign), em 1080 de
// largura: o stories (a página alta, 1,7 vez a largura ou mais) pelos Destaques, título de 80 a 112 px (22/10: o Destaque 07 aprovado tem 80) e corpo de 36 a 44
// (o kicker é o de 30 do estilo rápido); o feed pelo design-guide, título de 54 a 92 e corpo de 24 a 32. O servidor
// usava a do feed no stories e gravava alerta que a tela não mostrava
export const ESCALA_TEXTO = {
  stories: { titulo: [80, 112], corpo: [36, 44] },
  feed: { titulo: [54, 92], corpo: [24, 32] },
};
export const escalaDoDoc = (doc) => (doc.altura / doc.largura >= 1.7 ? { nome: 'stories', ...ESCALA_TEXTO.stories } : { nome: 'feed', ...ESCALA_TEXTO.feed });
// o teto de palavras por página, o mesmo do servidor (estudio.mjs, LIMITE_PALAVRAS) e o dado à IA; a meta é umas 25
export const LIMITE_PALAVRAS = 35;
// o número em destaque (o preço do card de oferta, o número do slide, "R$ 81 mil"): pode passar da escala do título
const SO_NUMERO = /^(R\$\s*)?[+-]?\d[\d.,:/]*\s*(%|x|mil|milh[ãa]o|milh[õo]es|k|º|ª)?$/iu;
export const soNumero = (texto) => SO_NUMERO.test(String(texto ?? '').replace(/\*/g, '').replace(/\s+/g, ' ').trim());
// a maior letra da página (o título ou o gancho; com empate, todos os textos dela) nunca é texto corrido. Ela vai pra
// escala do título quando a página tem mais de um texto e não é um número em destaque nem a letra de 3 textos ou mais (a
// lista sem título, como os nomes do time no Destaque 04). textos: os visíveis com conteúdo
// 23/10: os textos da moldura do carrossel montado da peça (server/estudio-carrossel.mjs): o contador de páginas, a
// linha do logo e a tag do público (dos designs de antes): não contam na escala nem nas palavras (o mesmo do servidor)
export const MOLDURA = new Set(['Tag do público', 'Contador', 'Contabilidade Digital']);
export function tituloDaEscala(textos) {
  const max = textos.reduce((m, c) => Math.max(m, c.tamanho), -Infinity);
  const maiores = textos.filter((c) => Math.abs(c.tamanho - max) < 0.5);
  const titulo = textos.length >= 2 && maiores.length < 3 && !soNumero(maiores[0].texto) ? maiores[0] : null;
  return { titulo, maiores: new Set(maiores) };
}

// ── Camadas novas ────────────────────────────────────────────────────────
// tamanhos de referência: stories pelos Destaques (h1 80 a 112, kicker 30); feed pelo design guide (capa 76 a 92,
// H2 54 a 64, corpo 26 a 30, kicker 15 a 17), com folga pra leitura no celular
const PRESETS_TEXTO = {
  titulo: { nome: 'Título', texto: 'Um título com *destaque*', st: 96, fd: 80, peso: 800, alturaLinha: 1.06, esp: -0.03 },
  subtitulo: { nome: 'Subtítulo', texto: 'Uma frase de apoio', st: 56, fd: 52, peso: 700, alturaLinha: 1.15, esp: -0.02 },
  corpo: { nome: 'Corpo', texto: 'Texto em poucas palavras.', st: 40, fd: 30, peso: 500, alturaLinha: 1.45, esp: 0 },
  kicker: { nome: 'Kicker', texto: 'Comece por aqui', st: 30, fd: 18, peso: 700, alturaLinha: 1.2, esp: 0.22, caixa: 'alta', destaqueCor: true },
  enfase: { nome: 'Ênfase', texto: 'ênfase', st: 104, fd: 84, peso: 400, alturaLinha: 1.05, esp: -0.01, fonte: 'DM Serif Display', destaqueCor: true },
  pilula: { nome: 'Pílula', texto: 'ME / MEI', st: 30, fd: 17, peso: 700, alturaLinha: 1.2, esp: 0.16, caixa: 'alta', pilula: true },
};
export const LISTA_PRESETS_TEXTO = Object.entries(PRESETS_TEXTO).map(([id, p]) => ({ id, nome: p.nome }));

// 22/10 (Pedro, do Ateliê original): "estilo rápido" num clique. A tipografia de um preset (tamanho pelo formato, peso,
// altura da linha, espaço entre letras, caixa e fonte) aplicada num texto que já existe: o conteúdo e o lugar ficam.
// A pílula liga o fundo coral claro; os outros tiram
export function estiloDoPreset(doc, preset) {
  const p = PRESETS_TEXTO[preset];
  if (!p) return null;
  const grande = doc.altura / doc.largura >= 1.7;
  const tamanho = Math.round((grande ? p.st : p.fd) * (doc.largura / 1080));
  return {
    tamanho,
    peso: p.peso,
    fonte: p.fonte ?? 'Sora',
    italico: p.fonte === 'DM Serif Display',
    alturaLinha: p.alturaLinha,
    espacamentoLetra: p.esp,
    caixa: p.caixa ?? 'normal',
    destaqueCor: Boolean(p.destaqueCor),
    pilula: Boolean(p.pilula),
  };
}
// a escada de tamanhos do A+ e do A- (stories pelos Destaques, feed pelo design guide); fora dela, anda 10%
const ESCADA_STORIES = [30, 34, 40, 46, 52, 56, 64, 72, 80, 88, 96, 104, 120, 144, 168];
const ESCADA_FEED = [18, 22, 26, 30, 34, 40, 46, 52, 58, 64, 72, 80, 92, 110, 128];
export function proximoTamanho(doc, atual, dir = 1) {
  const k = doc.largura / 1080;
  const escada = (doc.altura / doc.largura >= 1.7 ? ESCADA_STORIES : ESCADA_FEED).map((v) => Math.round(v * k));
  const t = Number(atual) || escada[0];
  const prox = dir > 0 ? escada.find((v) => v > t + 0.5) : [...escada].reverse().find((v) => v < t - 0.5);
  return Math.max(6, Math.min(1200, prox ?? Math.round(t * (dir > 0 ? 1.1 : 0.9))));
}

// fundos rápidos (cor e gradiente) do design guide, a um clique; os de imagem vêm da categoria Fundos do banco
export const FUNDOS_RAPIDOS = [
  { nome: 'Papel quente', fundo: { tipo: 'cor', cor: '#FAF8F5' } },
  { nome: 'Branco', fundo: { tipo: 'cor', cor: '#FFFFFF' } },
  { nome: 'Tint coral', fundo: { tipo: 'cor', cor: '#FEF3EE' } },
  { nome: 'Coral', fundo: { tipo: 'cor', cor: '#F2643C' } },
  { nome: 'Escuro', fundo: { tipo: 'gradiente', cor: '#2A2E37', cor2: '#15171C', angulo: 160 } },
  { nome: 'Vinheta', fundo: { tipo: 'gradiente', cor: '#392829', cor2: '#1A1E24', angulo: 180 } },
];

export function camadaTexto(doc, preset = 'titulo', fundo = null) {
  const p = PRESETS_TEXTO[preset] ?? PRESETS_TEXTO.titulo;
  const a = areaSegura(doc);
  const escuro = fundoEscuro(fundo);
  const grande = doc.altura / doc.largura >= 1.7;
  const k = doc.largura / 1080;
  const tamanho = Math.round((grande ? p.st : p.fd) * k);
  const corTexto = escuro ? '#F4F1EC' : '#1B1E24';
  const coral = escuro ? '#F2643C' : '#DD4E27';
  const padding = Math.round(tamanho * 0.6);
  const largura = p.pilula
    ? Math.round(p.texto.length * tamanho * (0.62 + p.esp) + padding * 2 + 4)
    : preset === 'kicker' || preset === 'enfase' ? Math.round((a.x1 - a.x0) * 0.8) : a.x1 - a.x0;
  const altura = Math.round(tamanho * p.alturaLinha * (preset === 'titulo' ? 2 : 1) + (p.pilula ? padding * 2 : 0));
  return normalizarCamada({
    tipo: 'texto',
    nome: p.nome,
    x: a.x0,
    y: Math.round(a.y0 + (a.y1 - a.y0) / 2 - altura / 2),
    largura,
    altura,
    texto: p.texto,
    fonte: p.fonte ?? 'Sora',
    peso: p.peso,
    italico: p.fonte === 'DM Serif Display',
    tamanho,
    cor: p.pilula ? '#B83D1C' : p.destaqueCor ? coral : corTexto,
    corDestaque: coral,
    alinhamento: 'esquerda',
    alturaLinha: p.alturaLinha,
    espacamentoLetra: p.esp,
    caixa: p.caixa ?? 'normal',
    fundo: p.pilula ? { cor: '#FEF3EE', raio: 999, padding } : null,
  });
}

export function camadaForma(doc, forma = 'retangulo', fundo = null) {
  const a = areaSegura(doc);
  const escuro = fundoEscuro(fundo);
  const lado = Math.round(Math.min(a.x1 - a.x0, a.y1 - a.y0) * 0.4);
  const largura = forma === 'linha' ? Math.round(lado * 0.8) : lado;
  const altura = forma === 'linha' ? Math.max(4, Math.round(6 * (doc.largura / 1080))) : lado;
  return normalizarCamada({
    tipo: 'forma',
    nome: forma === 'circulo' ? 'Círculo' : forma === 'linha' ? 'Linha' : 'Retângulo',
    x: Math.round((a.x0 + a.x1) / 2 - largura / 2),
    y: Math.round((a.y0 + a.y1) / 2 - altura / 2),
    largura,
    altura,
    forma,
    cor: forma === 'linha' ? '#F2643C' : escuro ? '#1F2228' : '#FFFFFF',
    borda: forma === 'retangulo' ? { cor: escuro ? '#2E313A' : '#E3DED7', largura: 2 } : null,
    raio: forma === 'retangulo' ? Math.round(24 * (doc.largura / 1080)) : forma === 'linha' ? 999 : 0,
  });
}

// 22/10 (Pedro): da categoria Fundos, o que é fundo de página inteira (papel, escuro, coral, vinheta). A luz, o disco, a
// partícula e a mancha de meio-tom são camadas de fundo, mas entram como camada (atrás de um objeto), e a textura (meio-tom,
// papel amassado, com fundo transparente) entra como camada que cobre a página por cima do fundo; nenhuma troca o fundo
const CAMADA_DE_FUNDO = /brilho|luz|disco|part[ií]cula|textura|meio-tom|mancha/i;
const textoDoAsset = (a) => `${a?.id ?? ''} ${a?.nome ?? ''} ${(a?.tags ?? []).join(' ')}`;
export const ehFundoDePagina = (asset) => asset?.categoria === 'fundo' && !CAMADA_DE_FUNDO.test(textoDoAsset(asset));
// a imagem nova cobre a página inteira (fundo de página ou textura por cima dele)
const cobreAPagina = (asset) => ehFundoDePagina(asset) || (asset?.categoria === 'fundo' && /textura/i.test(textoDoAsset(asset)));

// imagem nova: cabe na área segura (no máximo 60% dela), mantém a proporção do arquivo; centro no ponto pedido
export function camadaImagem(doc, asset, { cx = null, cy = null } = {}) {
  const a = areaSegura(doc);
  const nw = num(asset?.largura, 800, 1);
  const nh = num(asset?.altura, 800, 1);
  const maxW = (a.x1 - a.x0) * 0.6;
  const maxH = (a.y1 - a.y0) * 0.6;
  const fundo = cobreAPagina(asset);
  const k = fundo ? Math.max(doc.largura / nw, doc.altura / nh) : Math.min(maxW / nw, maxH / nh, 1.5);
  const largura = Math.max(8, Math.round(nw * k));
  const altura = Math.max(8, Math.round(nh * k));
  const x = fundo ? Math.round((doc.largura - largura) / 2) : Math.round((cx ?? (a.x0 + a.x1) / 2) - largura / 2);
  const y = fundo ? Math.round((doc.altura - altura) / 2) : Math.round((cy ?? (a.y0 + a.y1) / 2) - altura / 2);
  return normalizarCamada({
    tipo: 'imagem',
    nome: String(asset?.nome ?? 'Imagem').slice(0, 80),
    x, y, largura, altura,
    assetId: asset?.id ?? null,
    espelhar: false,
    raio: 0,
    sombra: null,
  });
}

// ── Geometria ────────────────────────────────────────────────────────────
const RAD = Math.PI / 180;
export const centro = (c) => ({ x: c.x + c.largura / 2, y: c.y + c.altura / 2 });
export function cantos(c) {
  const { x: cx, y: cy } = centro(c);
  const t = (c.rotacao || 0) * RAD;
  const cos = Math.cos(t);
  const sen = Math.sin(t);
  const hw = c.largura / 2;
  const hh = c.altura / 2;
  return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => ({ x: cx + x * cos - y * sen, y: cy + x * sen + y * cos }));
}
// retângulo alinhado aos eixos que cobre a camada girada
export function caixaGirada(c) {
  if (!c.rotacao) return { x0: c.x, y0: c.y, x1: c.x + c.largura, y1: c.y + c.altura };
  const p = cantos(c);
  return { x0: Math.min(...p.map((q) => q.x)), y0: Math.min(...p.map((q) => q.y)), x1: Math.max(...p.map((q) => q.x)), y1: Math.max(...p.map((q) => q.y)) };
}
export function uniao(caixas) {
  if (!caixas.length) return null;
  return {
    x0: Math.min(...caixas.map((b) => b.x0)), y0: Math.min(...caixas.map((b) => b.y0)),
    x1: Math.max(...caixas.map((b) => b.x1)), y1: Math.max(...caixas.map((b) => b.y1)),
  };
}
// sobreposição de verdade (tolerância de meio pixel: encostar a borda na borda não conta)
export const cruzam = (a, b, tol = 0.5) => a.x0 < b.x1 - tol && b.x0 < a.x1 - tol && a.y0 < b.y1 - tol && b.y0 < a.y1 - tol;
export const contem = (fora, dentro, tol = 0.5) => dentro.x0 >= fora.x0 - tol && dentro.y0 >= fora.y0 - tol && dentro.x1 <= fora.x1 + tol && dentro.y1 <= fora.y1 + tol;
// ponto (do documento) dentro da camada, considerando a rotação
export function pontoNaCamada(c, px, py, folga = 0) {
  const { x: cx, y: cy } = centro(c);
  const t = -(c.rotacao || 0) * RAD;
  const dx = px - cx;
  const dy = py - cy;
  const lx = dx * Math.cos(t) - dy * Math.sin(t);
  const ly = dx * Math.sin(t) + dy * Math.cos(t);
  return Math.abs(lx) <= c.largura / 2 + folga && Math.abs(ly) <= c.altura / 2 + folga;
}
// a camada de cima que está debaixo do ponto (as ocultas não contam). pular(c): as que o clique atravessa (o editor
// pula as de fundo, como a luz coral dos Destaques, que cobre meia página e parece vazio)
export function camadaNoPonto(pagina, px, py, folga = 0, { pular = null } = {}) {
  for (let i = pagina.camadas.length - 1; i >= 0; i--) {
    const c = pagina.camadas[i];
    if (!c.oculta && !pular?.(c) && pontoNaCamada(c, px, py, folga)) return c;
  }
  return null;
}

// ── Encaixe (guias) ──────────────────────────────────────────────────────
// alvos: bordas e centro da página, margens da área segura e bordas e centros das outras camadas visíveis
// guias: as guias da régua também atraem (23/10; com a régua escondida, não)
export function alvosDeEncaixe(doc, pagina, ignorar = new Set(), { guias = true } = {}) {
  const a = areaSegura(doc);
  const xs = [
    { v: 0, tipo: 'pagina' }, { v: doc.largura / 2, tipo: 'centro' }, { v: doc.largura, tipo: 'pagina' },
    { v: a.x0, tipo: 'segura' }, { v: a.x1, tipo: 'segura' },
  ];
  const ys = [
    { v: 0, tipo: 'pagina' }, { v: doc.altura / 2, tipo: 'centro' }, { v: doc.altura, tipo: 'pagina' },
    { v: a.y0, tipo: 'segura' }, { v: a.y1, tipo: 'segura' },
  ];
  if (guias) {
    for (const v of doc.guiasFixas?.v ?? []) xs.push({ v, tipo: 'guia' });
    for (const v of doc.guiasFixas?.h ?? []) ys.push({ v, tipo: 'guia' });
  }
  for (const c of pagina.camadas) {
    if (c.oculta || ignorar.has(c.id)) continue;
    const b = caixaGirada(c);
    xs.push({ v: b.x0, tipo: 'camada' }, { v: (b.x0 + b.x1) / 2, tipo: 'camada' }, { v: b.x1, tipo: 'camada' });
    ys.push({ v: b.y0, tipo: 'camada' }, { v: (b.y0 + b.y1) / 2, tipo: 'camada' }, { v: b.y1, tipo: 'camada' });
  }
  return { xs, ys };
}
function melhor(pontos, alvos, limiar) {
  let d = null;
  for (const p of pontos) {
    for (const a of alvos) {
      const delta = a.v - p;
      if (Math.abs(delta) <= limiar && (d == null || Math.abs(delta) < Math.abs(d))) d = delta;
    }
  }
  return d;
}
// caixa {x0,y0,x1,y1} que está sendo arrastada: devolve o quanto ela pula pra encaixar e as guias a mostrar
export function encaixar(caixa, alvos, limiar, { eixoX = true, eixoY = true } = {}) {
  const px = [caixa.x0, (caixa.x0 + caixa.x1) / 2, caixa.x1];
  const py = [caixa.y0, (caixa.y0 + caixa.y1) / 2, caixa.y1];
  const dx = eixoX ? melhor(px, alvos.xs, limiar) : null;
  const dy = eixoY ? melhor(py, alvos.ys, limiar) : null;
  const guiasX = dx == null ? [] : [...new Set(px.map((p) => p + dx).filter((p) => alvos.xs.some((a) => Math.abs(a.v - p) < 0.01)))];
  const guiasY = dy == null ? [] : [...new Set(py.map((p) => p + dy).filter((p) => alvos.ys.some((a) => Math.abs(a.v - p) < 0.01)))];
  return { dx: dx ?? 0, dy: dy ?? 0, guiasX, guiasY };
}

// ── Alinhar e distribuir (mexe nas camadas recebidas) ────────────────────
// o quanto uma caixa anda pra ir pro lugar: centro horizontal e vertical na página; esquerda, direita, topo e base na
// área segura; 'centro' nos dois eixos
function deslocamento(b, modo, doc) {
  const a = areaSegura(doc);
  const d = { dx: 0, dy: 0 };
  if (modo === 'esquerda') d.dx = a.x0 - b.x0;
  else if (modo === 'direita') d.dx = a.x1 - b.x1;
  else if (modo === 'centroH' || modo === 'centro') d.dx = doc.largura / 2 - (b.x0 + b.x1) / 2;
  if (modo === 'topo') d.dy = a.y0 - b.y0;
  else if (modo === 'base') d.dy = a.y1 - b.y1;
  else if (modo === 'centroV' || modo === 'centro') d.dy = doc.altura / 2 - (b.y0 + b.y1) / 2;
  return d;
}
const r10 = (v) => Math.round(v * 10) / 10;
// cada camada sozinha vai pro lugar (pela caixa girada)
export function alinhar(camadas, modo, doc) {
  for (const c of camadas) {
    if (c.travada) continue;
    const { dx, dy } = deslocamento(caixaGirada(c), modo, doc);
    c.x = r10(c.x + dx);
    c.y = r10(c.y + dy);
  }
}
// 22/10 (Pedro): várias camadas como um bloco só (a pílula com o ícone e o texto, o card com o símbolo): a caixa da
// união vai pro lugar e todas andam o mesmo tanto, então a composição não desmonta
export function alinharBloco(camadas, modo, doc) {
  const livres = camadas.filter((c) => !c.travada);
  if (!livres.length) return;
  const { dx, dy } = deslocamento(uniao(livres.map(caixaGirada)), modo, doc);
  for (const c of livres) {
    c.x = r10(c.x + dx);
    c.y = r10(c.y + dy);
  }
}
// alinhar entre si: cada camada vai pra borda (ou pro centro) da caixa da seleção inteira (a travada não anda, mas
// conta pra caixa)
export function alinharEntreSi(camadas, modo) {
  if (camadas.length < 2) return;
  const u = uniao(camadas.map(caixaGirada));
  for (const c of camadas) {
    if (c.travada) continue;
    const b = caixaGirada(c);
    if (modo === 'esquerda') c.x += u.x0 - b.x0;
    else if (modo === 'direita') c.x += u.x1 - b.x1;
    else if (modo === 'centroH' || modo === 'centro') c.x += (u.x0 + u.x1) / 2 - (b.x0 + b.x1) / 2;
    if (modo === 'topo') c.y += u.y0 - b.y0;
    else if (modo === 'base') c.y += u.y1 - b.y1;
    else if (modo === 'centroV' || modo === 'centro') c.y += (u.y0 + u.y1) / 2 - (b.y0 + b.y1) / 2;
    c.x = r10(c.x);
    c.y = r10(c.y);
  }
}
// 22/10 (Pedro): espaço fixo entre as camadas (2 ou mais), na ordem em que estão na página; a primeira fica no lugar
export function empilhar(camadas, eixo = 'v', vao = 24) {
  const livres = camadas.filter((c) => !c.travada);
  if (livres.length < 2) return false;
  const k0 = eixo === 'h' ? 'x0' : 'y0';
  const k1 = eixo === 'h' ? 'x1' : 'y1';
  const pos = eixo === 'h' ? 'x' : 'y';
  const itens = livres.map((c) => ({ c, b: caixaGirada(c) })).sort((p, q) => p.b[k0] - q.b[k0]);
  let cursor = itens[0].b[k1] + vao;
  for (const it of itens.slice(1)) {
    it.c[pos] = r10(it.c[pos] + (cursor - it.b[k0]));
    cursor += it.b[k1] - it.b[k0] + vao;
  }
  return true;
}
// espaço igual entre as camadas (3 ou mais), mantendo a primeira e a última no lugar
export function distribuir(camadas, eixo = 'h') {
  const livres = camadas.filter((c) => !c.travada);
  if (livres.length < 3) return false;
  const k0 = eixo === 'h' ? 'x0' : 'y0';
  const k1 = eixo === 'h' ? 'x1' : 'y1';
  const pos = eixo === 'h' ? 'x' : 'y';
  const itens = livres.map((c) => ({ c, b: caixaGirada(c) })).sort((p, q) => (p.b[k0] + p.b[k1]) - (q.b[k0] + q.b[k1]));
  const ini = itens[0].b[k0];
  const fim = itens.at(-1).b[k1];
  const ocupado = itens.reduce((s, it) => s + (it.b[k1] - it.b[k0]), 0);
  const vao = (fim - ini - ocupado) / (itens.length - 1);
  let cursor = ini;
  for (const it of itens) {
    it.c[pos] = Math.round((it.c[pos] + (cursor - it.b[k0])) * 10) / 10;
    cursor += it.b[k1] - it.b[k0] + vao;
  }
  return true;
}

// lugar livre pra uma camada nova: a posição dela se já está livre; senão a primeira posição da área segura (de cima
// pra baixo, na coluna dela, na esquerda, no meio e na direita) que não cruza nenhuma camada visível (fundo não conta)
export function lugarLivre(doc, pagina, c, assetsPorId = new Map()) {
  const a = areaSegura(doc);
  const ocupadas = pagina.camadas.filter((o) => o.id !== c.id && !o.oculta && !camadaDeFundo(o, doc, assetsPorId)).map(caixaGirada);
  const livre = (x, y) => {
    const b = { x0: x, y0: y, x1: x + c.largura, y1: y + c.altura };
    return contem(a, b) && !ocupadas.some((o) => cruzam(o, b));
  };
  if (livre(c.x, c.y)) return { x: c.x, y: c.y };
  const passo = Math.max(6, Math.round(doc.altura / 160));
  const xs = [c.x, a.x0, Math.round((a.x0 + a.x1 - c.largura) / 2), a.x1 - c.largura]
    .filter((v, i, arr) => arr.indexOf(v) === i && v >= a.x0 - 0.5 && v + c.largura <= a.x1 + 0.5);
  for (const x of xs) {
    for (let y = a.y0; y + c.altura <= a.y1 + 0.5; y += passo) if (livre(x, y)) return { x, y };
  }
  return null;
}
// 22/10 (Pedro): sem vaga no tamanho cheio, tenta a camada menor (85%, 70%, 55% e 40%) antes de desistir: a maior vaga
// livre da área segura ganha. Texto não encolhe abaixo de "minimoTexto" (a letra some no celular). Devolve a posição
// e a escala, ou null (aí a camada fica no meio e o aviso mostra)
export function lugarLivreReduzindo(doc, pagina, c, assetsPorId = new Map(), { minimoTexto = 0 } = {}) {
  for (const k of [1, 0.85, 0.7, 0.55, 0.4]) {
    if (k < 1 && c.tipo === 'texto' && c.tamanho * k < minimoTexto) break;
    const t = k === 1 ? c : {
      ...c,
      largura: c.largura * k,
      altura: c.altura * k,
      x: c.x + (c.largura * (1 - k)) / 2,
      y: c.y + (c.altura * (1 - k)) / 2,
    };
    const l = lugarLivre(doc, pagina, t, assetsPorId);
    if (l) return { ...l, escala: k };
  }
  return null;
}
// muda o tamanho de uma camada pela escala (o canto de cima à esquerda fica): letra, pílula, raio e sombra juntos
export function escalarCamada(c, k) {
  c.largura = Math.max(1, Math.round(c.largura * k * 10) / 10);
  c.altura = Math.max(1, Math.round(c.altura * k * 10) / 10);
  if (c.tipo === 'texto') {
    c.tamanho = Math.max(6, Math.round(c.tamanho * k * 10) / 10);
    if (c.fundo) { c.fundo.padding = Math.round(c.fundo.padding * k * 10) / 10; if (c.fundo.raio < 999) c.fundo.raio = Math.round(c.fundo.raio * k); }
  } else {
    c.raio = c.raio >= 999 ? c.raio : Math.round((c.raio ?? 0) * k);
    if (c.tipo === 'imagem' && c.sombra) { c.sombra.desfoque = Math.round(c.sombra.desfoque * k); c.sombra.x = Math.round(c.sombra.x * k); c.sombra.y = Math.round(c.sombra.y * k); }
    if (c.tipo === 'forma' && c.borda) c.borda.largura = Math.max(1, Math.round(c.borda.largura * k));
  }
}

// contraste (WCAG) entre duas cores sólidas
export function contraste(c1, c2) {
  const l1 = luminancia(c1);
  const l2 = luminancia(c2);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ── Avisos das regras do Pedro ───────────────────────────────────────────
const TRACO = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
const GRAFIA = /legaliz(?:ai|ei)(?![\p{L}])/iu;
const NOME_FUNDO = /^\s*(fundo|part[ií]cula)/i;

// fundo e partícula podem ir até a borda e ficar atrás do texto: asset da categoria fundo, camada que cobre quase a
// página inteira ou camada com nome começando por "Fundo" ou "Partícula"
// As exceções são as mesmas da revisão do servidor (estudio.mjs, colisoes e sangra): efeito de fundo (asset da
// categoria Fundos), camada que não é texto e cobre a página inteira, forma que atravessa a largura ou a altura toda
// (faixa) e, só aqui no editor, a camada com nome começando por "Fundo" ou "Partícula"
export function camadaDeFundo(c, doc, assetsPorId = new Map()) {
  if (NOME_FUNDO.test(c.nome)) return true;
  if (c.tipo === 'imagem' && assetsPorId.get(c.assetId)?.categoria === 'fundo') return true;
  const b = caixaGirada(c);
  if (c.tipo !== 'texto' && b.x0 <= 0 && b.y0 <= 0 && b.x1 >= doc.largura && b.y1 >= doc.altura) return true;
  return c.tipo === 'forma' && ((b.x0 <= 0 && b.x1 >= doc.largura) || (b.y0 <= 0 && b.y1 >= doc.altura));
}
// o símbolo da marca pelo asset (o mesmo critério do servidor): nome ou id com "símbolo" (e não logo) ou a tag visto/check
// 22/10 (Pedro): o servidor apertou o critério (estudio.mjs, ehSimbolo): só o asset da base nas categorias Marca e 3D com
// "símbolo" no id ou no nome. A tag visto ou check sozinha não faz um ícone qualquer virar o símbolo
const ehSimboloAsset = (a) => Boolean(a) && a.origem !== 'upload' && ['marca', '3d'].includes(a.categoria)
  && !/logo/i.test(`${a.id} ${a.nome}`) && /s[ií]mbolo/i.test(`${a.id} ${a.nome}`);
// 22/10 (Pedro): o busto do Léo com corte reto embaixo (tag "corte reto") pode ficar colado na borda de baixo da página:
// a única exceção da área segura, só na base (a mesma regra do servidor, ehCorteReto e coladoNaBase)
// 22/10 (achado da revisão): ou marcado no uso, com "corte reto" no nome da camada (o Léo do Destaque 01, que sai pela
// base de propósito), igual no servidor (estudio.mjs)
const ehCorteReto = (c, assetsPorId) => c.tipo === 'imagem' && ((assetsPorId.get(c.assetId)?.tags ?? []).some((t) => semAcento(t).trim() === 'corte reto')
  || /\bcorte reto\b/.test(semAcento(c.nome ?? '')));
const ehSimbolo = (c, assetsPorId) => c.tipo === 'imagem' && ehSimboloAsset(assetsPorId.get(c.assetId));
// o grifo (sublinhado à mão) mora embaixo da palavra que ele marca: com texto não é colisão
const ehGrifo = (c, assetsPorId) => c.tipo === 'imagem'
  && /grifo|sublinhad|rabisco/i.test(`${c.assetId} ${assetsPorId.get(c.assetId)?.nome ?? ''} ${(assetsPorId.get(c.assetId)?.tags ?? []).join(' ')}`);
const ehCartao = (c) => c.tipo === 'forma' && c.forma !== 'linha';

const LADOS = { x0: 'esquerda', x1: 'direita', y0: 'topo', y1: 'base' };
const VISTO_ESCRITO = /[✓✔☑✅\u{1F5F8}]/u;
// a paleta do design guide (a mesma lista da conferência do servidor, estudio.mjs) e as pontas dos gradientes prontos
export const CORES_DA_MARCA = new Set([
  '#faf8f5', '#ffffff', '#f1eee9', '#15171c', '#1f2228', '#282b32', '#2a2e37', '#202433', '#f2643c', '#dd4e27', '#b83d1c', '#fef3ee',
  '#1b1e24', '#f4f1ec', '#524e48', '#bdb8b0', '#e3ded7', '#cbc5bc', '#2e313a', '#17a06a', '#f5a524', '#e03e43', '#000000', '#392829', '#1a1e24',
]);
const naPaleta = (c) => !/^#[0-9a-f]{6}/i.test(String(c ?? '')) || CORES_DA_MARCA.has(String(c).slice(0, 7).toLowerCase());
const aspas = (s) => `"${s}"`;

// algum retângulo de ra cruza algum de rb, as duas listas por y crescente. 22/10 (achado da revisão): a varredura pela
// altura do servidor (estudio.mjs, algumaSobrepoe), andando nas duas listas juntas: comparar todas com todas travava a
// aba por segundos num texto de 2000 linhas, e os avisos rodam a cada mudança no painel
function algumCruza(ra, rb) {
  let j0 = 0;
  for (const a of ra) {
    // o que termina antes de a começar não cruza a nem as próximas (que começam mais embaixo)
    while (j0 < rb.length && rb[j0].y1 <= a.y0 + 0.5) j0++;
    for (let j = j0; j < rb.length && rb[j].y0 < a.y1 - 0.5; j++) if (cruzam(a, rb[j])) return true;
  }
  return false;
}

// tintas (opcional): Map id do texto -> retângulos das linhas medidos no navegador (só a tinta, não a caixa inteira)
export function avisosDaPagina(doc, pagina, { assetsPorId = new Map(), limitePalavras = LIMITE_PALAVRAS, tintas = null } = {}) {
  const out = [];
  const a = areaSegura(doc);
  const pag = { x0: 0, y0: 0, x1: doc.largura, y1: doc.altura };
  const vis = pagina.camadas.filter((c) => !c.oculta && c.opacidade > 0);
  const idx = new Map(pagina.camadas.map((c, i) => [c.id, i]));
  const caixa = new Map(vis.map((c) => [c.id, caixaGirada(c)]));
  const deFundo = new Set(vis.filter((c) => camadaDeFundo(c, doc, assetsPorId)).map((c) => c.id));

  // 1. área segura. 22/10 (Pedro): "a margem de segurança é apenas para os textos": imagem, ícone, forma e objeto podem
  // passar da borda (estourar) de propósito
  for (const c of vis) {
    if (deFundo.has(c.id) || c.tipo !== 'texto') continue;
    const b = caixa.get(c.id);
    const fora = [];
    const naBase = ehCorteReto(c, assetsPorId) && b.y1 >= doc.altura - 1;
    if (b.x0 < a.x0 - 0.5) fora.push('x0');
    if (b.x1 > a.x1 + 0.5) fora.push('x1');
    if (b.y0 < a.y0 - 0.5) fora.push('y0');
    if (b.y1 > a.y1 + 0.5 && !naBase) fora.push('y1');
    if (fora.length) {
      out.push({
        regra: 'area-segura', nivel: 'alerta', camadas: [c.id],
        texto: `${aspas(c.nome)} sai da área segura (${fora.map((k) => LADOS[k]).join(', ')})`,
      });
    }
  }

  // 2. nada atravessa nada (vis está na ordem das camadas: p fica atrás de q). Texto pela tinta das linhas quando o
  // editor mediu; o resto pela caixa. Card atrás que contém a outra camada inteira pode; grifo com texto pode.
  // 22/10 (achado da revisão): os retângulos de cada camada vão uma vez só por y crescente, pra varredura (algumCruza)
  const ordenados = new Map();
  const ocupa = (c) => {
    if (!ordenados.has(c.id)) ordenados.set(c.id, [...(c.tipo === 'texto' && tintas?.get(c.id)?.length ? tintas.get(c.id) : [caixa.get(c.id)])].sort((u, v) => u.y0 - v.y0));
    return ordenados.get(c.id);
  };
  for (let i = 0; i < vis.length; i++) {
    for (let j = i + 1; j < vis.length; j++) {
      const p = vis[i];
      const q = vis[j];
      if (deFundo.has(p.id) || deFundo.has(q.id)) continue;
      const bp = caixa.get(p.id);
      const bq = caixa.get(q.id);
      if (!cruzam(bp, bq)) continue;
      if (ehCartao(p) && contem(bp, bq)) continue;
      if ((ehGrifo(p, assetsPorId) && q.tipo === 'texto') || (ehGrifo(q, assetsPorId) && p.tipo === 'texto')) continue;
      if (!algumCruza(ocupa(p), ocupa(q))) continue;
      const texto = q.tipo === 'texto' ? q : p.tipo === 'texto' ? p : null;
      if (texto) {
        const outro = texto === p ? q : p;
        out.push({ regra: 'colisao', nivel: 'alerta', camadas: [texto.id, outro.id], texto: `${aspas(texto.nome)} encosta em ${aspas(outro.nome)}` });
      } else {
        out.push({ regra: 'colisao', nivel: 'revisar', camadas: [p.id, q.id], texto: `${aspas(q.nome)} encosta em ${aspas(p.nome)} (pelo retângulo: confira o recorte)` });
      }
    }
  }

  // 3. barrinha antes de texto (lê como travessão, Pedro 23/09)
  const textos = vis.filter((c) => c.tipo === 'texto');
  for (const f of vis) {
    if (f.tipo !== 'forma' || f.forma === 'circulo') continue;
    const bf = caixa.get(f.id);
    if (bf.y1 - bf.y0 > 16 * (doc.largura / 1080) || bf.x1 - bf.x0 > 260 * (doc.largura / 1080)) continue;
    const meio = (bf.y0 + bf.y1) / 2;
    for (const t of textos) {
      const bt = caixa.get(t.id);
      const linha = t.tamanho * t.alturaLinha;
      const naLinha = meio >= bt.y0 - 2 && meio <= bt.y0 + linha + 2;
      if (naLinha && bf.x1 <= bt.x0 + 4 && bt.x0 - bf.x1 <= 90) {
        out.push({ regra: 'barrinha', nivel: 'alerta', camadas: [f.id, t.id], texto: `Barrinha antes de ${aspas(t.nome)}: lê como travessão (tire ou ponha numa linha própria)` });
      }
    }
  }

  // 4. copy: travessão, grafia, visto escrito e letra que some no celular
  const minimo = Math.round((22 * doc.largura) / 1080);
  for (const t of textos) {
    if (TRACO.test(t.texto)) out.push({ regra: 'travessao', nivel: 'alerta', camadas: [t.id], texto: `${aspas(t.nome)} tem travessão (regra dura: troque por ponto, vírgula ou "e")` });
    if (GRAFIA.test(t.texto)) out.push({ regra: 'grafia', nivel: 'alerta', camadas: [t.id], texto: `${aspas(t.nome)}: a grafia é "Legalizaí", com acento` });
    if (VISTO_ESCRITO.test(t.texto)) out.push({ regra: 'visto', nivel: 'alerta', camadas: [t.id], texto: `${aspas(t.nome)} tem um visto escrito: todo visto é o símbolo da marca (asset), inteiro` });
    if (t.tamanho < minimo && contarPalavras(t.texto)) out.push({ regra: 'letra-pequena', nivel: 'revisar', camadas: [t.id], texto: `${aspas(t.nome)} tem ${Math.round(t.tamanho)} px: abaixo de ${minimo} px some no celular` });
    for (const k of new Set([t.cor, ...(trechosDestaque(t.texto).some((x) => x.destaque) ? [t.corDestaque] : [])])) {
      if (!naPaleta(k)) out.push({ regra: 'paleta', nivel: 'revisar', camadas: [t.id], texto: `${aspas(t.nome)} usa ${k}, fora da paleta do design guide` });
    }
  }
  // contraste do texto com o que está atrás dele: o fundo da página (no de imagem, a cor por trás, que o editor mantém
  // na cor média da imagem), os cards que contêm o texto, de baixo pra cima, e a pílula. 22/10 (Pedro): cor com
  // transparência (a pílula #FFFFFF0F dos Destaques) é pintada sobre o que está atrás antes de medir
  const f0 = pagina.fundo;
  const fundoPag = f0.tipo === 'gradiente' ? [f0.cor, f0.cor2] : [f0.cor];
  for (const t of textos) {
    const i = idx.get(t.id);
    const cards = vis.filter((o) => o.tipo === 'forma' && o.forma !== 'linha' && idx.get(o.id) < i && contem(caixa.get(o.id), caixa.get(t.id)));
    let atras = fundoPag;
    for (const card of cards) atras = atras.map((b) => comporCor(card.cor, b, card.opacidade));
    if (t.fundo) atras = atras.map((b) => comporCor(t.fundo.cor, b, t.opacidade));
    if (!atras.length || atras.some((k) => !rgbaDe(k))) continue;
    const cores = [t.cor, ...(trechosDestaque(t.texto).some((x) => x.destaque) ? [t.corDestaque] : [])];
    if (cores.some((k) => !rgbaDe(k))) continue;
    const pior = Math.min(...cores.flatMap((k) => atras.map((b) => contraste(comporCor(k, b, t.opacidade), b))));
    const soImagem = f0.tipo === 'imagem' && !cards.length && !t.fundo;
    if (pior < 3) out.push({ regra: 'contraste', nivel: pior < 2 ? 'alerta' : 'revisar', camadas: [t.id], texto: `${aspas(t.nome)} tem pouco contraste com o que está atrás (${pior.toFixed(1).replace('.', ',')}:1${soImagem ? ', pela cor média do fundo' : ''}): não dá pra ler no celular` });
  }
  const f = pagina.fundo;
  for (const k of f.tipo === 'imagem' ? [] : f.tipo === 'gradiente' ? [f.cor, f.cor2] : [f.cor]) {
    if (!naPaleta(k)) out.push({ regra: 'paleta', nivel: 'revisar', camadas: [], texto: `O fundo usa ${k}, fora da paleta do design guide (a base não muda)` });
  }

  // 5. o símbolo da marca vai inteiro: nem saindo da página nem recortado pela caixa. As outras imagens: a caixa fora
  // da proporção do arquivo recorta a imagem (o desenho cobre a caixa, não estica)
  for (const c of vis) {
    if (!ehSimbolo(c, assetsPorId)) {
      const ast = c.tipo === 'imagem' ? assetsPorId.get(c.assetId) : null;
      const razao = ast?.largura && ast?.altura ? (c.largura / c.altura) / (ast.largura / ast.altura) : 1;
      if (Math.abs(razao - 1) > 0.03 && !deFundo.has(c.id) && !ehGrifo(c, assetsPorId)) out.push({ regra: 'proporcao', nivel: 'revisar', camadas: [c.id], texto: `${aspas(c.nome)} está fora da proporção do arquivo e sai recortada (use "Proporção original")` });
      continue;
    }
    const ast = assetsPorId.get(c.assetId);
    const cortadoPagina = !contem(pag, caixa.get(c.id));
    const prop = ast?.largura && ast?.altura ? Math.abs(c.largura / c.altura - ast.largura / ast.altura) / (ast.largura / ast.altura) : 0;
    if (cortadoPagina || prop > 0.03 || c.raio > 0) out.push({ regra: 'simbolo', nivel: 'alerta', camadas: [c.id], texto: `${aspas(c.nome)} aparece cortado: o símbolo vai sempre inteiro` });
  }

  // 6. a escala do formato (título e texto corrido), poucas palavras por slide e uma cor de destaque só. 22/10 (achado da
  // revisão): a escala e as palavras com a mesma conta da conferência gravada no servidor (estudio.mjs, revisarDesign)
  const escala = escalaDoDoc(doc);
  const pxE = (v) => Math.round((v * doc.largura) / 1080);
  const [t0, t1] = escala.titulo.map(pxE);
  const [c0, c1] = escala.corpo.map(pxE);
  // 23/10: a moldura do carrossel montado (o contador e a linha do logo) fica fora da escala e da conta de palavras
  const comTexto = textos.filter((t) => t.texto.trim() && !MOLDURA.has(t.nome));
  const { titulo, maiores } = tituloDaEscala(comTexto);
  for (const t of comTexto) {
    if (t === titulo && (t.tamanho < t0 || t.tamanho > t1)) out.push({ regra: 'escala', nivel: 'revisar', camadas: [t.id], texto: `${aspas(t.nome)} (o título) tem ${Math.round(t.tamanho)} px: no ${escala.nome} o título vai de ${t0} a ${t1} px` });
    else if (!maiores.has(t) && contarPalavras(t.texto) >= 10 && (t.tamanho < c0 || t.tamanho > c1)) out.push({ regra: 'escala', nivel: 'revisar', camadas: [t.id], texto: `${aspas(t.nome)} (texto corrido) tem ${Math.round(t.tamanho)} px: no ${escala.nome} o corpo vai de ${c0} a ${c1} px` });
  }
  const palavras = textos.filter((t) => !MOLDURA.has(t.nome)).reduce((s, t) => s + contarPalavras(t.texto), 0);
  if (palavras > limitePalavras) out.push({ regra: 'palavras', nivel: 'revisar', camadas: [], texto: `${palavras} palavras na página: o Pedro pede poucas por slide` });
  const destaques = new Set(textos.filter((t) => trechosDestaque(t.texto).some((x) => x.destaque)).map((t) => t.corDestaque.toLowerCase()));
  if (destaques.size > 1) out.push({ regra: 'destaque', nivel: 'revisar', camadas: [], texto: 'Duas cores de destaque na mesma página: fica uma só' });
  return out;
}

// onde a caixa fica no eixo novo (devolve a borda de começo): encostada na margem de começo ou de fim da área segura
// continua encostada, no centro da página continua no centro, e o resto vai na mesma proporção dentro da área segura.
// 22/10 (achado da revisão): pela âncora. 'ini' (texto alinhado à esquerda e quem divide a borda com ele) leva a borda de
// começo na proporção, 'fim' a de fim e 'meio' o centro: pelo centro, caixas de larguras diferentes com a mesma borda
// se separavam (os rótulos do Destaque 07, todos em 254, iam pra 251, 266, 256, 272 e 259 no feed)
function lugarNoEixo(lo, hi, s0, s1, meio0, t0, t1, meio1, tam, tol, ancora = 'meio') {
  const r = s1 > s0 ? (t1 - t0) / (s1 - s0) : 1;
  if (ancora === 'ini') return t0 + (lo - s0) * r;
  if (ancora === 'fim') return t1 - (s1 - hi) * r - tam;
  if (Math.abs(lo - s0) <= tol) return t0;
  if (Math.abs(hi - s1) <= tol) return t1 - tam;
  const c = (lo + hi) / 2;
  if (Math.abs(c - meio0) <= tol) return meio1 - tam / 2;
  return t0 + (c - s0) * r - tam / 2;
}
// 22/10 (achado da revisão): a âncora no eixo X. Texto pelo alinhamento; o resto pela borda que divide com outra camada
// do mesmo lugar (o ícone na borda do texto) e, dentro de um cartão, pelo centro dele ou pela borda mais perto
function ancoraX(c, b, irmas, antes, tol, cartao) {
  if (c.tipo === 'texto') return c.alinhamento === 'direita' ? 'fim' : c.alinhamento === 'centro' ? 'meio' : 'ini';
  const divide = (k) => irmas.some((o) => o !== c && Math.abs(antes.get(o.id)[k] - b[k]) <= tol);
  if (divide('x0')) return 'ini';
  if (divide('x1')) return 'fim';
  if (!cartao) return 'meio';
  if (Math.abs((b.x0 + b.x1) / 2 - (cartao.x0 + cartao.x1) / 2) <= tol) return 'meio';
  return b.x0 - cartao.x0 <= cartao.x1 - b.x1 ? 'ini' : 'fim';
}
// o par do asset de fundo no outro formato (ast_base_fundo-escuro-stories e ast_base_fundo-escuro-feed), se o banco tem
function fundoDoFormato(id, formato, assetsPorId) {
  const s = String(id ?? '');
  const alvo = formato === 'stories' ? '-stories' : '-feed';
  const outro = formato === 'stories' ? /-feed$/ : /-stories$/;
  if (!outro.test(s)) return null;
  const par = s.replace(outro, alvo);
  return assetsPorId.has(par) ? par : null;
}
// formato fixo que tem esse tamanho (o personalizado fica personalizado)
const formatoDoTamanho = (largura, altura) => FORMATOS.find((f) => f.id !== 'personalizado' && f.largura === largura && f.altura === altura)?.id ?? 'personalizado';

// trocar o formato de um documento: as camadas acompanham. 22/10 (Pedro): a área segura de antes vira a área segura
// de agora (as margens são diferentes no stories e no feed), o tamanho segue o fator da área útil (o menor dos dois
// eixos, pra nada atravessar nada), quem estava encostado na margem ou no centro continua, e a letra que estava no
// mínimo do celular não cai abaixo dele. Fundo e partícula acompanham a página inteira (o que cobria, continua cobrindo)
// 22/10 (achado da revisão): o que estava alinhado continua alinhado. No X cada camada vai pela âncora (ancoraX), e a
// camada dentro de um cartão (o menor cartão atrás que a contém inteira) vai pela posição dentro dele, no mesmo fator do
// tamanho: o cartão anda e estica, o que tem dentro fica no mesmo desenho (o "/mês" colado no "R$ 99")
export function redimensionarDoc(doc, largura, altura, { formato = null, assetsPorId = new Map() } = {}) {
  const novoFormato = formato ?? (doc.formato === 'personalizado' ? 'personalizado' : formatoDoTamanho(largura, altura));
  const W0 = doc.largura;
  const H0 = doc.altura;
  const a0 = areaSegura(doc);
  const a1 = areaSegura({ formato: novoFormato, largura, altura });
  const s = Math.min((a1.x1 - a1.x0) / Math.max(1, a0.x1 - a0.x0), (a1.y1 - a1.y0) / Math.max(1, a0.y1 - a0.y0));
  const sPag = Math.min(largura / W0, altura / H0);
  const sCobre = Math.max(largura / W0, altura / H0);
  const tol = Math.max(2, 4 * (W0 / 1080));
  const minimo0 = (22 * W0) / 1080;
  const minimo1 = (22 * largura) / 1080;
  for (const p of doc.paginas) {
    // o fundo de imagem da marca tem a versão de cada formato (fundo-papel-stories e fundo-papel-feed): troca junto
    const par = p.fundo?.tipo === 'imagem' ? fundoDoFormato(p.fundo.assetId, novoFormato, assetsPorId) : null;
    if (par) p.fundo.assetId = par;
    // tudo pela geometria de antes: a caixa, o que é fundo e o cartão de cada camada. O cartão vem antes na lista (fica
    // atrás), então já tem a caixa nova (novas) quando a camada de dentro chega
    const antes = new Map(p.camadas.map((c) => [c.id, caixaGirada(c)]));
    const deFundo = new Set(p.camadas.filter((c) => camadaDeFundo(c, doc, assetsPorId)).map((c) => c.id));
    const area = (q) => (q.x1 - q.x0) * (q.y1 - q.y0);
    const cartaoDe = new Map();
    p.camadas.forEach((c, i) => {
      if (deFundo.has(c.id)) return;
      let melhor = null;
      for (const o of p.camadas.slice(0, i)) {
        if (ehCartao(o) && !deFundo.has(o.id) && contem(antes.get(o.id), antes.get(c.id), tol) && (!melhor || area(antes.get(o.id)) < area(antes.get(melhor)))) melhor = o.id;
      }
      if (melhor) cartaoDe.set(c.id, melhor);
    });
    const novas = new Map();
    for (const c of p.camadas) {
      const b = antes.get(c.id);
      const fundo = deFundo.has(c.id);
      const cobre = fundo && b.x0 <= 0.5 && b.y0 <= 0.5 && b.x1 >= W0 - 0.5 && b.y1 >= H0 - 0.5;
      const k = cobre ? sCobre : fundo ? sPag : s;
      const tamanhoAntes = c.tipo === 'texto' ? c.tamanho : 0;
      const bw = (b.x1 - b.x0) * k;
      const bh = (b.y1 - b.y0) * k;
      // inicioX(w): a borda esquerda nova da caixa com largura w
      let inicioX;
      let ncy;
      const idCartao = cartaoDe.get(c.id);
      if (fundo) {
        inicioX = (w) => ((b.x0 + b.x1) / 2 / W0) * largura - w / 2;
        ncy = ((b.y0 + b.y1) / 2 / H0) * altura;
      } else if (idCartao && novas.has(idCartao)) {
        const B = antes.get(idCartao);
        const N = novas.get(idCartao);
        const ancora = ancoraX(c, b, p.camadas.filter((o) => cartaoDe.get(o.id) === idCartao), antes, tol, B);
        inicioX = (w) => (ancora === 'ini' ? N.x0 + (b.x0 - B.x0) * k
          : ancora === 'fim' ? N.x1 - (B.x1 - b.x1) * k - w
            : (N.x0 + N.x1) / 2 + ((b.x0 + b.x1) / 2 - (B.x0 + B.x1) / 2) * k - w / 2);
        ncy = N.y0 + ((b.y0 + b.y1) / 2 - B.y0) * ((N.y1 - N.y0) / Math.max(1, B.y1 - B.y0));
      } else {
        const ancora = ancoraX(c, b, p.camadas.filter((o) => !deFundo.has(o.id) && !cartaoDe.has(o.id)), antes, tol, null);
        inicioX = (w) => lugarNoEixo(b.x0, b.x1, a0.x0, a0.x1, W0 / 2, a1.x0, a1.x1, largura / 2, w, tol, ancora);
        ncy = lugarNoEixo(b.y0, b.y1, a0.y0, a0.y1, H0 / 2, a1.y0, a1.y1, altura / 2, bh, tol) + bh / 2;
      }
      // texto e card que ocupam a largura toda da área segura (encostados nas duas margens) continuam ocupando: o texto
      // centralizado não sai do centro e o card não fica mais estreito que a página
      const larguraToda = !fundo && !c.rotacao && c.tipo !== 'imagem' && Math.abs(b.x0 - a0.x0) <= tol && Math.abs(b.x1 - a0.x1) <= tol;
      escalarCamada(c, k);
      if (larguraToda) {
        c.largura = a1.x1 - a1.x0;
        inicioX = () => a1.x0;
      }
      if (c.tipo === 'texto' && tamanhoAntes >= minimo0 - 0.01 && c.tamanho < minimo1) {
        const f = minimo1 / c.tamanho;
        c.tamanho = Math.round(minimo1 * 10) / 10;
        c.largura = Math.min(Math.round(c.largura * f), Math.max(c.largura, a1.x1 - a1.x0));
      }
      // a caixa sem giro vai direto pela borda (a mesma borda de antes dá o mesmo x); a girada, pelo centro da caixa que a cobre.
      // A âncora vale pra largura nova (o texto que subiu pro mínimo do celular fica mais largo)
      c.x = c.rotacao ? Math.round(inicioX(bw) + bw / 2 - c.largura / 2) : Math.round(inicioX(c.largura));
      c.y = Math.round(ncy - c.altura / 2);
      if (ehCartao(c) && !fundo) novas.set(c.id, caixaGirada(c));
    }
  }
  doc.formato = novoFormato;
  doc.largura = largura;
  doc.altura = altura;
}

// ── Modelos (estudio/base/modelos/*.json) ─────────────────────────────────
// 22/10 (Pedro): o corpo do POST de um design novo a partir de um modelo: as páginas do modelo com ids novos (cada
// design é dono das camadas dele), sem peça nem estratégia
export function docDoModelo(modelo, { titulo = '' } = {}) {
  const n = normalizarDoc(modelo);
  const paginas = n.paginas.map((p) => ({ ...p, id: novoId('pag'), camadas: p.camadas.map((c) => ({ ...c, id: novoId('cam'), travada: false })) }));
  // o id do modelo (o nome do arquivo) vai junto: o servidor guarda de que modelo o design nasceu (modeloId)
  const modeloId = [modelo?.id, modelo?.modeloId].find((v) => typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(v));
  return {
    titulo: String(titulo || modelo?.titulo || modelo?.nome || 'Design').trim().slice(0, 160),
    formato: n.formato,
    largura: n.largura,
    altura: n.altura,
    paginas,
    pecaId: null,
    origem: 'manual',
    estrategia: null,
    ...(modeloId ? { modeloId } : {}),
    // os fatos (id do FATOS) dos números que o modelo traz: a conferência "Número com fonte" já nasce atendida
    ...(Array.isArray(modelo?.fontes) && modelo.fontes.length ? { fontes: modelo.fontes.filter((f) => typeof f === 'string' && f.trim()).slice(0, 40) } : {}),
  };
}
// as páginas de um modelo prontas pra entrar num design que já existe: no formato dele (o modelo de stories num feed
// passa pelo redimensionarDoc, área segura pra área segura)
export function paginasDoModelo(modelo, doc, assetsPorId = new Map()) {
  const m = docDoModelo(modelo);
  if (m.largura !== doc.largura || m.altura !== doc.altura) redimensionarDoc(m, doc.largura, doc.altura, { formato: doc.formato, assetsPorId });
  return m.paginas;
}

// nome de arquivo sem acento nem espaço ("Comece por aqui" vira "comece-por-aqui")
export function nomeArquivo(titulo) {
  return String(titulo ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'design';
}

// ── Editar várias páginas juntas ──
// 27/10 (Pedro: "coloque uma feature de editar várias imagens ao mesmo tempo, ao invés de uma por uma, apenas
// selecionando"): o que mudou na página aberta vai pras outras páginas marcadas. Vai a posição, o tamanho e o estilo
// (fonte, cor, fundo, borda...), o fundo da página, a camada apagada e a camada nova; o texto e a imagem de cada página
// ficam (cada slide tem o seu). A camada de lá que corresponde, nesta ordem: a do mesmo tipo e do mesmo nome; a da mesma
// família de nome (a IA numera: "Título do item 1" acha o "Título do item 2", e o celular "(emenda pra página 7)" acha o
// "(continuação)"); na imagem, a da mesma figura; senão, a do mesmo tipo mais perto da posição de antes, até PERTO px.
// A posição vai pelo deslocamento e o tamanho pela proporção, então a emenda entre dois slides continua casando e cada
// camada guarda o lugar e a forma dela; o resto do estilo vai como está
export const CAMPOS_JUNTOS = [
  'x', 'y', 'largura', 'altura', 'rotacao', 'opacidade', 'travada', 'oculta', 'fonte', 'peso', 'italico', 'tamanho', 'cor', 'corDestaque',
  'alinhamento', 'alturaLinha', 'espacamentoLetra', 'caixa', 'fundo', 'espelhar', 'raio', 'sombra', 'forma', 'borda',
];
const PERTO = 40;
const nomeProprio = (c) => {
  const n = String(c?.nome ?? '').trim();
  return n && n !== NOMES_TIPO[c?.tipo] ? n : '';
};
const familiaDoNome = (n) => n.toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\d+/g, ' ').replace(/\s+/g, ' ').trim();
const maisPerto = (lista, ref) => lista.reduce((m, c) => (Math.hypot(c.x - ref.x, c.y - ref.y) < Math.hypot(m.x - ref.x, m.y - ref.y) ? c : m));
export function camadasEquivalentes(pagina, ref) {
  const camadas = (pagina?.camadas ?? []).filter((c) => c.tipo === ref?.tipo);
  const nome = nomeProprio(ref);
  if (nome) {
    const doNome = camadas.filter((c) => nomeProprio(c) === nome);
    if (doNome.length) return doNome;
    const familia = familiaDoNome(nome);
    const daFamilia = familia ? camadas.filter((c) => familiaDoNome(nomeProprio(c)) === familia) : [];
    if (daFamilia.length) return daFamilia;
  }
  const daFigura = ref.tipo === 'imagem' && ref.assetId ? camadas.filter((c) => c.assetId === ref.assetId) : [];
  if (daFigura.length) return [maisPerto(daFigura, ref)];
  const perto = camadas.filter((c) => Math.abs(c.x - ref.x) <= PERTO && Math.abs(c.y - ref.y) <= PERTO);
  return perto.length ? [maisPerto(perto, ref)] : [];
}
// o que mudou de uma página (antes) pra ela mesma (depois), ou null quando nada que vá pras outras mudou
export function mudancasDaPagina(antes, depois) {
  const porId = new Map((antes?.camadas ?? []).map((c) => [c.id, c]));
  const ficaram = new Set((depois?.camadas ?? []).map((c) => c.id));
  const mudadas = [];
  const novas = [];
  for (const c of depois?.camadas ?? []) {
    const a = porId.get(c.id);
    if (!a) { novas.push(clonar(c)); continue; }
    const campos = {};
    for (const k of CAMPOS_JUNTOS) if (k in c && JSON.stringify(a[k]) !== JSON.stringify(c[k])) campos[k] = clonar(c[k]);
    // a altura do texto é a que o navegador mediu (cresce com o conteúdo de cada página): não vai
    if (c.tipo === 'texto') delete campos.altura;
    if (Object.keys(campos).length) mudadas.push({ antes: clonar(a), campos });
  }
  const removidas = (antes?.camadas ?? []).filter((a) => !ficaram.has(a.id)).map(clonar);
  const fundo = JSON.stringify(antes?.fundo) !== JSON.stringify(depois?.fundo) ? clonar(depois.fundo) : null;
  return mudadas.length || novas.length || removidas.length || fundo ? { mudadas, novas, removidas, fundo } : null;
}
// aplica as mudanças numa outra página; devolve quantas coisas mudaram nela
export function aplicarMudancas(pagina, m) {
  if (!pagina || !m) return 0;
  let n = 0;
  if (m.fundo) { pagina.fundo = clonar(m.fundo); n += 1; }
  for (const { antes, campos } of m.mudadas) {
    for (const c of camadasEquivalentes(pagina, antes)) {
      const { x, y, largura, altura, ...estilo } = clonar(campos);
      if (x != null) c.x = r10(c.x + x - antes.x);
      if (y != null) c.y = r10(c.y + y - antes.y);
      if (largura != null && antes.largura) c.largura = Math.max(1, r10(c.largura * (largura / antes.largura)));
      if (altura != null && antes.altura) c.altura = Math.max(1, r10(c.altura * (altura / antes.altura)));
      Object.assign(c, estilo);
      n += 1;
    }
  }
  for (const a of m.removidas) {
    const sai = new Set(camadasEquivalentes(pagina, a).map((c) => c.id));
    if (!sai.size) continue;
    pagina.camadas = pagina.camadas.filter((c) => !sai.has(c.id));
    n += sai.size;
  }
  for (const c of m.novas) {
    // o grupo (Ctrl + G) é da página de onde veio
    const nova = clonar(c);
    delete nova.grupo;
    pagina.camadas.push({ ...nova, id: novoId('cam') });
    n += 1;
  }
  return n;
}
