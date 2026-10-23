// 23/10 (Pedro): "os carrosséis estão vindo extremamente genéricos, preciso que ele seja criado de acordo com a skill
// MazyOS. Produzindo carrosséis com essa qualidade" (a referência é o "Giro Legalizaí" de 01/09,
// marketing/conteudo/carrossel-giro-noticias-2026-09-01). O "Criar no Ateliê" do carrossel (estudio.mjs, designDaPeca)
// e o "Remontar com o texto da peça" montam as páginas no visual da skill carrossel (.claude/skills/carrossel/SKILL.md,
// "Visual do Legalizaí"), em camadas que o editor mexe.
// 23/10 (Pedro, 2ª rodada): "Tire a TAG MEI E ME da tag e deixe como asset, não como padrão" (as tags ficam no banco,
// estudio/base/assets/tag-*.png, lote "carrossel") e "A skill deve rodar identificando o post, o tipo de conteúdo e criar
// um carrossel com um design que converse com o post". O tipo sai da peça (tipoDoCarrossel: o pilar, o formato, a ideia,
// a capa e os slides) e cada tipo tem o design dele:
//  - mito (pilar 5, "mito", "não são verdade", o mito entre aspas): a pílula MITO, o mito com as aspas em coral, a
//    pílula VERDADE e a resposta com a primeira frase em coral; na capa, o Léo de braços cruzados
//  - comparativo ("MEI ou ME", "X vs Y"): os dois lados em pílulas no alto de cada slide, o lado do slide aceso, e o
//    número em coral; na capa, os dois lados em cards
//  - oferta (pilar 10, ou Conversão falando do plano ou do preço): o símbolo da marca como o visto de cada item (todo
//    visto é o símbolo, regra do Pedro) e o número em coral; na capa, o Léo comemorando
//  - pergunta ("Traduzindo o contabilês", a caixinha, os títulos com "?"): a pergunta num card com PERGUNTA e a
//    RESPOSTA embaixo; na capa, o busto do Léo explicando, colado na base
//  - notícia ("lei nova", "mudou", "acabou", "saiu"): a lista com o número da novidade em coral; na capa, o megafone
//  - tirinha (o formato "tirinha", os slides "Quadro N"): cada quadro num painel, com a fala de cada um num balão e o
//    Léo quando ele fala; o último quadro fecha a tirinha
//  - alerta (pilar 4, "trava", "cuidado", "atenção"): a pílula ATENÇÃO no alto de cada item; na capa, o Léo cansado
//  - lista (o resto): "1." em coral no título, a régua fina e o parágrafo, com o ícone 3D alternando o lado
// O Léo entra na capa como a skill manda (fora dos pilares 1 e 3, voz do Pedro ou da empresa; nos outros, no gancho), em
// cima do disco de papel; sem ele, o ícone 3D do assunto. Em todas as páginas: o contador e o logo com "Contabilidade
// Digital" no rodapé. O fim: na peça de Conversão, o logo no centro, o convite e o botão "Clica no link da bio" (sem botão
// quando o convite já fala do link); nas outras, o fechamento que a peça já tem, com o ícone.
// Duas variações da skill, alternando de um carrossel pro outro pela data no cronograma ("nunca duas capas iguais em
// sequência"; o mecanismo visual também acusa o mesmo fundo com os mesmos assets): o 1º escuro (o Giro) e o 2º claro (o
// "5 sinais", o estilo vigente: papel quente, tinta, coral 600 no destaque e o fim de Conversão na página coral).
// O ícone 3D sai pelo assunto (as palavras de cada um abaixo), sem repetir no mesmo carrossel. Medidas no 1080x1350: 80
// de margem nas laterais, todo texto dentro da área segura de 72 e nenhuma letra abaixo de 22 px (a regra do Estúdio
// vale por cima dos 15 a 17 px do kicker da skill). As funções de medir texto vêm do estudio.mjs pelo ctx.

const W = 1080;
const H_PAGINA = 1350;
const M = 80;
// a área do conteúdo: abaixo do contador e acima do logo do rodapé
const AREA = { topo: 160, base: 1136 };
const LOGO = { y: 1184, largura: 240, altura: 47 };
const FUNDO_ESCURO = 'ast_base_fundo-escuro-feed';
const LUZ = 'ast_base_brilho-coral';
const DISCO = 'ast_base_disco-papel';
const SIMBOLO = 'ast_base_simbolo';
const CORAL = '#F2643C';

const TEMAS = {
  escuro: {
    fundo: { tipo: 'imagem', cor: '#1F2228', cor2: '#1F2228', angulo: 160, assetId: FUNDO_ESCURO, ajuste: 'cobrir' },
    luz: true, logo: 'ast_base_logo-negativo-claro',
    titulo: '#F4F1EC', corpo: '#BDB8B0', apagado: '#BDB8B0', destaque: CORAL, kicker: CORAL,
    card: { cor: '#1F2228', borda: '#2E313A' }, balao: { cor: '#F4F1EC', texto: '#1B1E24' },
    arrasta: { fundo: CORAL, texto: '#FFFFFF' },
    botao: { fundo: CORAL, texto: '#FFFFFF' },
    cheia: { fundo: '#F4F1EC', texto: '#1B1E24' },
    // o ícone de fundo escuro vira card; o de fundo creme, círculo claro (como no Giro)
    forma: (ic) => (ic.fundo === 'escuro' ? 'card' : 'circulo'),
  },
  claro: {
    fundo: { tipo: 'cor', cor: '#FAF8F5', cor2: '#F1EEE9', angulo: 160, assetId: null, ajuste: 'cobrir' },
    luz: false, logo: 'ast_base_logo-horizontal',
    titulo: '#1B1E24', corpo: '#524E48', apagado: '#524E48', destaque: '#DD4E27', kicker: '#DD4E27',
    card: { cor: '#FFFFFF', borda: '#E3DED7' }, balao: { cor: '#1B1E24', texto: '#FFFFFF' },
    arrasta: { fundo: '#1B1E24', texto: '#FFFFFF' },
    botao: { fundo: '#DD4E27', texto: '#FFFFFF' },
    cheia: { fundo: '#1B1E24', texto: '#FFFFFF' },
    forma: () => 'card',
  },
};
// o fim de Conversão do claro: a página coral do "5 sinais"
const CORAL_CTA = {
  ...TEMAS.claro,
  fundo: { tipo: 'cor', cor: CORAL, cor2: CORAL, angulo: 160, assetId: null, ajuste: 'cobrir' },
  logo: 'ast_base_logo-negativo-claro',
  titulo: '#FFFFFF', corpo: '#1B1E24', apagado: '#FFFFFF', destaque: '#1B1E24', kicker: '#FFFFFF',
  botao: { fundo: '#1B1E24', texto: '#FFFFFF' },
};

const BASE = { rotacao: 0, opacidade: 1, travada: false, oculta: false };
const BASE_TEXTO = { ...BASE, fonte: 'Sora', italico: false, corDestaque: CORAL, alinhamento: 'esquerda', caixa: 'normal', fundo: null, espacamentoLetra: 0 };
const estilos = (t) => ({
  kicker: { tamanho: 22, peso: 700, cor: t.kicker, espacamentoLetra: 0.22, caixa: 'alta', alturaLinha: 1.3 },
  contador: { tamanho: 22, peso: 600, cor: t.apagado, espacamentoLetra: 0.18, alturaLinha: 1.2, alinhamento: 'direita' },
  marca: { tamanho: 22, peso: 600, cor: t.apagado, espacamentoLetra: 0.06, alturaLinha: 1.2 },
  pilula: { tamanho: 22, peso: 700, cor: t.kicker, espacamentoLetra: 0.16, caixa: 'alta', alturaLinha: 1.2, alinhamento: 'centro' },
  h1: { tamanho: 80, peso: 800, cor: t.titulo, corDestaque: t.destaque, espacamentoLetra: -0.03, alturaLinha: 1.06 },
  apoio: { tamanho: 30, peso: 500, cor: t.corpo, corDestaque: t.destaque, alturaLinha: 1.45 },
  h2: { tamanho: 56, peso: 800, cor: t.titulo, corDestaque: t.destaque, espacamentoLetra: -0.025, alturaLinha: 1.14 },
  corpo: { tamanho: 28, peso: 400, cor: t.corpo, corDestaque: t.destaque, alturaLinha: 1.5 },
  resposta: { tamanho: 30, peso: 500, cor: t.corpo, corDestaque: t.destaque, alturaLinha: 1.45 },
  pill: { tamanho: 24, peso: 700, cor: t.arrasta.texto, alturaLinha: 1.2, alinhamento: 'centro' },
  botao: { tamanho: 28, peso: 700, cor: t.botao.texto, alturaLinha: 1.2, alinhamento: 'centro' },
  cta: { tamanho: 64, peso: 800, cor: t.titulo, corDestaque: t.destaque, espacamentoLetra: -0.03, alturaLinha: 1.1, alinhamento: 'centro' },
  sub: { tamanho: 26, peso: 500, cor: t.corpo, alturaLinha: 1.4, alinhamento: 'centro' },
  // a fala do balão é o título do quadro (a escala do título do feed: 54 a 92)
  fala: { tamanho: 54, peso: 700, cor: t.balao.texto, espacamentoLetra: -0.02, alturaLinha: 1.15 },
});

// os ícones 3D do lote "carrossel" (estudio/base/assets), com o fundo que veio na imagem
const ICONES = [
  { id: 'ast_base_3d-guia-escuro', fundo: 'escuro', familia: 'guia', chaves: ['guia', 'das', 'escolha', 'escolher', 'opcao', 'optar', 'caminho', 'regime', 'simples', 'hibrido', 'tributo', 'separa', 'divide'] },
  { id: 'ast_base_3d-fatura-creme', fundo: 'creme', familia: 'fatura', chaves: ['imposto', 'calcul', 'conta', 'valor', 'nota', 'cobranc', 'pagar', 'paga', 'custo', 'declarac', 'contador', 'contabil'] },
  { id: 'ast_base_3d-grafico-escuro', fundo: 'escuro', familia: 'grafico', chaves: ['limite', 'teto', 'fatura', 'cresc', 'subir', 'sobe', 'aument', 'receita', 'lucro', 'ganh', 'cobrar', 'caro', 'preco'] },
  { id: 'ast_base_3d-recibo-creme', fundo: 'creme', familia: 'recibo', chaves: ['recibo', 'pro-labore', 'pro labore', 'salario', 'dinheiro', 'retirad', 'retirar', 'comprovante', 'moeda', 'reais', 'r$'] },
  { id: 'ast_base_3d-megafone-escuro', fundo: 'escuro', familia: 'megafone', chaves: ['novidade', 'noticia', 'mudou', 'mudanc', 'muda', 'nova', 'novo', 'lei', 'aviso', 'atencao', 'anuncio', 'lancamento', 'chegou', 'saiu'] },
  { id: 'ast_base_3d-porcento-creme', fundo: 'creme', familia: 'porcento', chaves: ['porcent', '%', 'aliquota', 'taxa', 'juros', 'desconto', 'multa', 'percentual', 'confer'] },
  { id: 'ast_base_3d-foguete-creme', fundo: 'creme', familia: 'foguete', chaves: ['abrir', 'abertura', 'comecar', 'comeco', 'inicio', 'lancar', 'primeir', 'sonho', 'decol', 'rapido'] },
  { id: 'ast_base_3d-duvida-creme', fundo: 'creme', familia: 'duvida', chaves: ['duvida', 'pergunta', 'por que', 'quanto', 'errad', 'erro', 'sabia', 'mito', 'verdade'] },
  { id: 'ast_base_3d-grafico-creme', fundo: 'creme', familia: 'grafico', chaves: ['grafico', 'resultado'] },
  { id: 'ast_base_3d-marcador-creme', fundo: 'creme', familia: 'marcador', chaves: ['salva', 'salvar', 'guarda', 'lembr', 'compartilh', 'manda pra'] },
];
// o Léo da capa de cada tipo (o busto fica colado na base: corte reto)
const LEO = {
  mito: 'ast_base_leo-bracos-cruzados', comparativo: 'ast_base_leo-apontando-pra-cima', oferta: 'ast_base_leo-comemorando-bracos',
  pergunta: 'ast_base_leo-busto-patas', noticia: 'ast_base_leo-apontando-pro-lado', tirinha: 'ast_base_leo-acenando',
  alerta: 'ast_base_leo-cansado', lista: 'ast_base_leo-apontando-pro-lado',
};
// o kicker da capa de cada tipo (sem ele, "Legalizaí"); o mês da peça vai junto
const KICKER = { mito: 'Mito ou verdade', pergunta: 'Traduzindo o contabilês', noticia: 'Novidade', alerta: 'Atenção', tirinha: 'Tirinha' };

const tem = (v) => Boolean(String(v ?? '').trim());
const dois = (n) => String(n).padStart(2, '0');
const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const MESES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
const ASPAS = /^["“”'‘’«]+|["“”'‘’»]+$/g;
const entreAspas = (t) => /^["“«]/.test(String(t ?? '').trim());
// o par do comparativo na capa: "MEI ou ME: ...", "PJ x PF", "Tradicional vs Legalizaí" (cada lado com até 3 palavras)
const PAR = /^\s*([\p{L}\p{N}][\p{L}\p{N}\s.-]{0,30}?)\s+(?:ou|x|vs\.?|versus)\s+([\p{L}\p{N}][\p{L}\p{N}\s.-]{0,30}?)\s*[:?]/iu;
function parDaCapa(t) {
  const m = PAR.exec(String(t ?? ''));
  if (!m) return null;
  const a = m[1].trim();
  const b = m[2].trim();
  return a.split(/\s+/).length <= 3 && b.split(/\s+/).length <= 3 ? [a, b] : null;
}
// o número que importa no texto (o preço, o limite, o prazo): o primeiro "R$ 81 mil", "40 horas", "60 dias", "11%"
const NUMERO = /R\$\s?\d[\d.,]*(?:\s?(?:mil|milh(?:ão|ões)|bi(?:lhão|lhões)?))?|\b\d[\d.,]*\s?(?:%|horas?|dias?|meses|anos?|mil\b)/iu;

// a variação do carrossel: os carrosséis do cronograma pela data (e pela ordem no dia), o 1º escuro, o 2º claro e assim
// por diante (o mesmo carrossel cai sempre na mesma variação, a não ser que entre outro antes dele)
export function varianteDoCarrossel(db, p) {
  const lista = (db?.reels ?? []).filter((r) => r?.peca === 'carrossel')
    .sort((a, b) => String(a.data || '9999').localeCompare(String(b.data || '9999')) || (Number(a.ordem) || 0) - (Number(b.ordem) || 0) || String(a.id).localeCompare(String(b.id)));
  return lista.findIndex((r) => r.id === p?.id) % 2 === 1 ? 'claro' : 'escuro';
}

// o tipo de conteúdo do carrossel pela peça (ver o topo)
export function tipoDoCarrossel(p) {
  const ca = p?.carrossel ?? {};
  const slides = (ca.slides ?? []).filter((s) => tem(s?.titulo) || tem(s?.texto));
  const capa = String(ca.capa?.titulo || p?.ideia || '');
  const sobre = semAcento([p?.ideia, p?.formatoTexto, p?.pilarTexto, capa].join(' '));
  const titulos = slides.map((s) => String(s.titulo ?? '').trim()).filter(Boolean);
  const metade = (f) => titulos.length > 0 && titulos.filter(f).length * 2 >= titulos.length;
  const pilar = Number(p?.pilar);
  if (/tirinha|quadrinho/.test(sobre) || titulos.filter((t) => /^quadro\s*\d/i.test(t)).length >= 2) return 'tirinha';
  if (parDaCapa(capa) || parDaCapa(p?.ideia)) return 'comparativo';
  if (/traduzindo o contabil|caixinha/.test(sobre) || metade((t) => /\?\s*$/.test(t) && !entreAspas(t))) return 'pergunta';
  if (pilar === 5 || /\bmitos?\b|crencas?|nao (sao|e) verdade|verdade ou mito/.test(sobre) || metade(entreAspas)) return 'mito';
  if (pilar === 10 || (p?.bloco === 'Conversão' && /plano|inclus|preco|quanto custa/.test(sobre))) return 'oferta';
  if (/lei nova|nova lei|mudou|mudanca|acabou|saiu|novidade|nova regra|o que muda/.test(sobre)) return 'noticia';
  if (pilar === 4 || /\btrava|cuidado|atencao|risco|pode barrar/.test(sobre)) return 'alerta';
  return 'lista';
}

// o ícone do assunto: o de mais palavras batendo (no começo de palavra), sem repetir a família no mesmo carrossel
export function escolherIcone(texto, usados, assets, { preferir = null } = {}) {
  const t = ` ${semAcento(texto).replace(/[^a-z0-9%$-]+/g, ' ')} `;
  const livres = ICONES.filter((i) => assets.has(i.id) && !usados.has(i.familia));
  if (!livres.length) return null;
  let melhor = null;
  let nota = 0;
  for (const i of livres) {
    const n = i.chaves.reduce((k, ch) => k + (t.includes(` ${ch}`) ? 1 : 0), 0);
    if (n > nota) { melhor = i; nota = n; }
  }
  const escolhido = melhor ?? livres.find((i) => i.familia === preferir) ?? livres[0];
  usados.add(escolhido.familia);
  return escolhido;
}

// o trecho final do título em coral (uma ou duas palavras; depois dos dois-pontos, o que vem depois), quando o texto
// ainda não tem destaque marcado com asteriscos
export function destacar(t) {
  const s = String(t ?? '').trim();
  if (!s || s.includes('*')) return s;
  const fim = /[.!?…:;,]+$/.exec(s)?.[0] ?? '';
  const corpo = fim ? s.slice(0, -fim.length).trimEnd() : s;
  const doisPontos = /^(.+?:\s+)(\S.*)$/.exec(corpo);
  if (doisPontos && doisPontos[2].split(/\s+/).length <= 4) return `${doisPontos[1]}*${doisPontos[2]}*${fim}`;
  const palavras = corpo.split(/\s+/);
  if (palavras.length < 3) return s;
  const n = palavras.length <= 4 ? 1 : 2;
  return `${palavras.slice(0, -n).join(' ')} *${palavras.slice(-n).join(' ')}*${fim}`;
}
// o número que importa em coral; sem número, o texto como veio
const destacarNumero = (t) => {
  const s = String(t ?? '');
  return s.includes('*') ? s : s.replace(NUMERO, (m) => `*${m}*`);
};
// a primeira frase em coral (a resposta do mito: "Não impede.", "Pode, sim.")
const destacarInicio = (t) => {
  const s = String(t ?? '').trim();
  const m = /^(.{2,60}?[.!])\s+(\S[\s\S]*)$/u.exec(s);
  return !s.includes('*') && m ? `*${m[1]}* ${m[2]}` : s;
};

// a primeira frase (até max letras) e o resto
function partir(t, max = 90) {
  const s = String(t ?? '').trim();
  const m = /^(.{8,}?[.!?:])\s+(\S[\s\S]*)$/u.exec(s);
  return m && m[1].length <= max ? [m[1], m[2].trim()] : [s, ''];
}

// as falas do quadro da tirinha: 'Carta: "DECLARE...". Bia: "Mas eu já paguei!"' vira [{ quem, fala }]
export function falasDoQuadro(t) {
  const s = String(t ?? '').trim();
  if (!s || /^sem fala\.?$/i.test(s)) return [];
  // cada "Nome: " no começo ou depois do fim de uma frase abre uma fala, que vai até o próximo nome
  const marcas = [...s.matchAll(/(^|[.!?"”]\s+)([A-ZÀ-Ý][\p{L}]{1,20}):\s+/gu)];
  if (!marcas.length) return [{ quem: '', fala: s }];
  return marcas.map((m, j) => {
    const ini = m.index + m[0].length;
    const fim = j + 1 < marcas.length ? marcas[j + 1].index + marcas[j + 1][1].length : s.length;
    const fala = s.slice(ini, fim).trim().replace(/^["“]/, '').replace(/["”]\.?$/, '').trim();
    return { quem: m[2], fala };
  }).filter((x) => x.fala);
}

function construtor(ctx) {
  const texto = (nome, txt, x, y, largura, estilo) => {
    const c = { tipo: 'texto', nome, texto: String(txt ?? '').trim(), x, y, largura, altura: 10, ...BASE_TEXTO, ...estilo };
    c.altura = ctx.alturaEstimada(c);
    return c;
  };
  // a largura do texto numa linha só (pílula e contador)
  const larguraDaLinha = (c) => {
    const { larguras, pad } = ctx.quebrarLinhas({ ...c, largura: 100000 });
    return Math.ceil(larguras.reduce((m, w) => Math.max(m, w), 0) * 1.04 + pad) + 2;
  };
  const imagem = (nome, assetId, x, y, largura, altura, extra = {}) => ({ tipo: 'imagem', nome, assetId, x, y, largura, altura, ...BASE, espelhar: false, raio: 0, sombra: null, ...extra });
  const forma = (nome, tipo, x, y, largura, altura, extra = {}) => ({ tipo: 'forma', nome, forma: tipo, x, y, largura, altura, ...BASE, cor: CORAL, borda: null, raio: 0, ...extra });
  const tem3 = (id) => ctx.assets.has(id);
  // a pílula (rótulo): a forma com o texto no meio; cheia ou só com a borda
  const pilula = (nome, txt, x, y, t, { cheia = false, cor = null } = {}) => {
    const e = estilos(t);
    const tx = texto(nome, txt, 0, 0, 1000, { ...e.pilula, cor: cheia ? (cor?.texto ?? '#FFFFFF') : (cor?.borda ?? t.kicker) });
    const w = larguraDaLinha(tx);
    const f = forma(`Fundo de ${nome.toLowerCase()}`, 'retangulo', x, y, w + 56, 56, cheia
      ? { cor: cor?.fundo ?? CORAL, raio: 999 }
      : { cor: '#00000000', borda: { cor: cor?.borda ?? t.kicker, largura: 2 }, raio: 999 });
    Object.assign(tx, { x: x + 26, y: y + Math.round((56 - tx.altura) / 2), largura: w + 4 });
    return { camadas: [f, tx], largura: w + 56, altura: 56 };
  };
  return { texto, larguraDaLinha, imagem, forma, tem3, pilula };
}

export function montarCarrossel(p, ctx) {
  const k = construtor(ctx);
  const ca = p.carrossel ?? {};
  const usados = new Set();
  const tema = TEMAS[ctx.variante] ?? TEMAS.escuro;
  const E = estilos(tema);
  const tipo = tipoDoCarrossel(p);
  const conversao = ctx.bloco === 'Conversão';
  const slides = (ca.slides ?? []).filter((s) => tem(s?.titulo) || tem(s?.texto)).slice(0, ctx.maxSlides ?? 10);
  // a tirinha fecha no último quadro (o "Quadro 4" que vem no fim da peça), sem a página de fim
  const fimEhQuadro = tipo === 'tirinha' && /^quadro/i.test(String(ca.final?.titulo ?? '').trim());
  const total = slides.length + 2;
  const par = tipo === 'comparativo' ? (parDaCapa(ca.capa?.titulo) ?? parDaCapa(p.ideia)) : null;
  const pilar = Number(p.pilar);
  // o Léo na capa: fora dos pilares 1 e 3 (a voz do Pedro ou da empresa), como a skill manda
  const comLeo = Number.isFinite(pilar) && pilar > 0 && pilar !== 1 && pilar !== 3;
  // o fundo da variação; o escuro sem a imagem no banco cai no gradiente ink
  const fundoDe = (t) => (t.fundo.assetId && !k.tem3(t.fundo.assetId) ? { tipo: 'gradiente', cor: '#2A2E37', cor2: '#15171C', angulo: 160, assetId: null, ajuste: 'cobrir' } : { ...t.fundo });
  const luz = (t) => (t.luz && k.tem3(LUZ) ? [k.imagem('Luz coral', LUZ, -420, -380, 1320, 1080, { opacidade: 0.9 })] : []);
  const espaco = AREA.base - AREA.topo;

  // o contador e o logo do rodapé (a tag do público saiu do padrão: está no banco, como asset)
  function moldura(n, t, { rodape = true } = {}) {
    const e = estilos(t);
    const out = [];
    const cont = k.texto('Contador', `${dois(n)} / ${dois(total)}`, 0, 0, 1000, e.contador);
    const wc = k.larguraDaLinha(cont);
    Object.assign(cont, { x: W - M - wc, y: 86, largura: wc });
    out.push(cont);
    if (rodape && k.tem3(t.logo)) {
      out.push(k.imagem('Logo', t.logo, M, LOGO.y, LOGO.largura, LOGO.altura));
      out.push(k.texto('Contabilidade Digital', 'Contabilidade Digital', M, LOGO.y + LOGO.altura + 12, 420, e.marca));
    }
    return out;
  }
  // o ícone no tamanho pedido, em card (canto arredondado) ou em círculo
  const iconeEl = (ic, x, y, lado, forma = tema.forma(ic)) => k.imagem(forma === 'card' ? 'Ícone 3D' : 'Ícone 3D no círculo', ic.id, x, y, lado, lado, { raio: forma === 'card' ? Math.round(lado * 0.067) : 9999 });
  // empilha os blocos ({ camadas, altura, mover(dy) }) de cima pra baixo com os vãos e devolve a altura
  const bloco = (camadas) => {
    const y0 = Math.min(...camadas.map((c) => c.y));
    const y1 = Math.max(...camadas.map((c) => c.y + c.altura));
    return { camadas, altura: y1 - y0, colocar: (y) => { const dy = y - y0; for (const c of camadas) c.y += dy; } };
  };
  const empilhar = (blocos, y, vaos) => {
    blocos.forEach((b, i) => { b.colocar(y); y += b.altura + (vaos[i] ?? 0); });
    return y;
  };
  const alturaDe = (blocos, vaos) => blocos.reduce((s, b, i) => s + b.altura + (i < blocos.length - 1 ? (vaos[i] ?? 0) : 0), 0);

  // ── capa ──
  function capa() {
    const tituloCapa = ca.capa?.titulo || p.ideia || '';
    const apoio = ca.capa?.texto && semAcento(ca.capa.texto).trim() !== semAcento(tituloCapa).trim() ? ca.capa.texto : '';
    const mes = /^\d{4}-(\d{2})-\d{2}$/.test(p.data ?? '') ? ` · ${MESES[Number(p.data.slice(5, 7)) - 1]} ${p.data.slice(0, 4)}` : '';
    const leo = comLeo && tipo !== 'comparativo' && k.tem3(LEO[tipo]) ? ctx.assets.get(LEO[tipo]) : null;
    if (leo) return capaComLeo(leo, tituloCapa, apoio, mes);
    const ic = par ? null : escolherIcone(`${tituloCapa} ${apoio} ${p.ideia ?? ''} ${p.tema ?? ''}`, usados, ctx.assets, { preferir: tipo === 'noticia' ? 'megafone' : /\?\s*$/.test(tituloCapa) ? 'duvida' : 'megafone' });
    const pillTxt = k.texto('Arrasta pro lado', 'Arrasta pro lado', 0, 0, 1000, E.pill);
    const wPill = k.larguraDaLinha(pillTxt);
    // o título desce de tamanho e o visual (o Léo, o ícone ou os cards do comparativo) diminui até tudo caber
    let melhor = null;
    for (const [t1, lado] of [[80, 460], [76, 420], [72, 400], [66, 360], [60, 320], [56, 280]]) {
      const kicker = k.texto('Kicker', `${KICKER[tipo] ?? 'Legalizaí'}${mes}`, M, 0, W - 2 * M, E.kicker);
      const h1 = k.texto('Título', destacar(tituloCapa), M, 0, W - 2 * M, { ...E.h1, tamanho: t1 });
      const sub = apoio ? k.texto('Linha de apoio', apoio, M, 0, 840, E.apoio) : null;
      const visual = leo ? Math.round(lado * 1.35) : par ? Math.round(lado * 0.72) : ic ? lado : 76;
      const altura = kicker.altura + 30 + h1.altura + (sub ? 30 + sub.altura : 0) + 48 + visual;
      melhor = { kicker, h1, sub, lado, visual, altura };
      if (altura <= espaco) break;
    }
    const { kicker, h1, sub, lado, visual, altura } = melhor;
    let y = AREA.topo + Math.max(0, Math.round((espaco - altura) / 2));
    kicker.y = y; y += kicker.altura + 30;
    h1.y = y; y += h1.altura;
    if (sub) { y += 30; sub.y = y; y += sub.altura; }
    y += 48;
    const baseLinha = y + visual;
    const pillForma = k.forma('Fundo do arrasta', 'retangulo', M, baseLinha - 76, wPill + 72, 76, { cor: tema.arrasta.fundo, raio: 999 });
    Object.assign(pillTxt, { x: pillForma.x + 34, y: pillForma.y + Math.round((76 - pillTxt.altura) / 2), largura: wPill + 4 });
    const camadas = [...luz(tema)];
    const vis = [];
    if (par) {
      // os dois lados do comparativo em cards: o primeiro coral, o segundo no tom da página (à direita do "Arrasta")
      const gap = 28;
      const lado2 = Math.min(visual, Math.floor((W - M - (M + wPill + 72 + 48) - gap) / 2));
      const x2 = W - M - lado2;
      const x1 = x2 - gap - lado2;
      for (const [i, nome] of par.entries()) {
        const card = k.forma(`Card ${nome}`, 'retangulo', i === 0 ? x1 : x2, y, lado2, lado2, i === 0
          ? { cor: CORAL, raio: 32 }
          : { cor: tema.cheia.fundo, raio: 32 });
        let tam = 92;
        let tx = k.texto(`Lado ${nome}`, nome, card.x + 16, 0, lado2 - 32, { ...E.h1, tamanho: tam, cor: i === 0 ? '#FFFFFF' : tema.cheia.texto, alinhamento: 'centro', caixa: 'alta' });
        while (tam > 56 && k.larguraDaLinha(tx) > lado2 - 40) { tam -= 8; tx = k.texto(`Lado ${nome}`, nome, card.x + 16, 0, lado2 - 32, { ...E.h1, tamanho: tam, cor: i === 0 ? '#FFFFFF' : tema.cheia.texto, alinhamento: 'centro', caixa: 'alta' }); }
        tx.y = card.y + Math.round((lado2 - tx.altura) / 2);
        vis.push(card, tx);
      }
    } else if (ic) {
      vis.push(iconeEl(ic, W - M + 20 - lado, y, lado, ctx.variante === 'claro' ? 'circulo' : tema.forma(ic)));
      // o quarto de círculo coral sai pelo canto de baixo, sem encostar no ícone
      camadas.push(k.forma('Quarto de círculo', 'circulo', W - 230, Math.max(baseLinha + 4, 1150), 400, 400, { opacidade: 0.92 }));
    }
    camadas.push(...moldura(1, tema), kicker, h1);
    if (sub) camadas.push(sub);
    camadas.push(pillForma, pillTxt, ...vis);
    return { fundo: fundoDe(tema), camadas };
  }

  // 23/10 (Pedro: "por padrão o Leozin está bem pequeno, quero que deixe ele maior, ocupando mais parte da tela"): na
  // capa com o Léo, ele ganha a coluna da direita inteira (até 1000 px de altura, os pés perto da base; o busto, colado
  // nela) em cima do disco de papel, e o texto vai na coluna da esquerda (pelo menos 500 px), com o "Arrasta pro lado"
  // embaixo. O Léo largo pode passar da borda da direita (até um quarto dele), nunca por cima do texto
  function capaComLeo(leo, tituloCapa, apoio, mes) {
    const busto = /busto/.test(leo.id);
    const razao = leo.largura / leo.altura;
    const MIN_TEXTO = 500;
    const livre = W - (M + MIN_TEXTO + 40);
    let hL = busto ? 1100 : 1000;
    let wL = Math.round(hL * razao);
    if (wL * 0.75 > livre) { wL = Math.round(livre / 0.75); hL = Math.round(wL / razao); }
    const xL = wL <= livre ? W - 30 - wL : W - livre;
    const yL = busto ? H_PAGINA - hL : H_PAGINA - 20 - hL;
    const colW = xL - 40 - M;
    const pillTxt = k.texto('Arrasta pro lado', 'Arrasta pro lado', 0, 0, 1000, E.pill);
    const wPill = k.larguraDaLinha(pillTxt);
    // o bloco de texto da coluna (kicker, gancho e apoio) acima do "Arrasta"; o gancho desce de tamanho até caber
    const topoPill = AREA.base - 76;
    let melhor = null;
    for (const t1 of [80, 76, 72, 66, 60, 56]) {
      const kicker = k.texto('Kicker', `${KICKER[tipo] ?? 'Legalizaí'}${mes}`, M, 0, colW, E.kicker);
      const h1 = k.texto('Título', destacar(tituloCapa), M, 0, colW, { ...E.h1, tamanho: t1 });
      const sub = apoio ? k.texto('Linha de apoio', apoio, M, 0, colW, E.apoio) : null;
      const altura = kicker.altura + 30 + h1.altura + (sub ? 30 + sub.altura : 0);
      melhor = { kicker, h1, sub, altura };
      if (altura <= topoPill - 48 - AREA.topo) break;
    }
    const { kicker, h1, sub, altura } = melhor;
    let y = AREA.topo + Math.max(0, Math.round((topoPill - 48 - AREA.topo - altura) / 2));
    kicker.y = y; y += kicker.altura + 30;
    h1.y = y; y += h1.altura;
    if (sub) { y += 30; sub.y = y; }
    const pillForma = k.forma('Fundo do arrasta', 'retangulo', M, topoPill, wPill + 72, 76, { cor: tema.arrasta.fundo, raio: 999 });
    Object.assign(pillTxt, { x: pillForma.x + 34, y: pillForma.y + Math.round((76 - pillTxt.altura) / 2), largura: wPill + 4 });
    const camadas = [...luz(tema)];
    if (k.tem3(DISCO)) {
      // o disco atrás do Léo, sem entrar na coluna do texto
      const cx = xL + wL / 2;
      const d = Math.round(Math.min(wL * 1.15, hL * 0.62, 2 * (cx - (M + colW + 20))));
      camadas.push(k.imagem('Disco de papel', DISCO, Math.round(cx - d / 2), Math.round(yL + hL * 0.4 - d / 2), d, d));
    }
    camadas.push(...moldura(1, tema), kicker, h1);
    if (sub) camadas.push(sub);
    camadas.push(pillForma, pillTxt, k.imagem(`Léo (${leo.nome.replace(/^Léo,?\s*/i, '')})`, leo.id, xL, yL, wL, hL));
    return { fundo: fundoDe(tema), camadas };
  }

  // ── os itens ──
  // o título e o parágrafo do slide: o título que é só o número não conta; sem título, as duas frases viram título e
  // parágrafo, a frase curta vira o título e a longa fica no parágrafo
  function textosDoSlide(s) {
    let titulo = String(s.titulo ?? '').trim();
    let corpo = String(s.texto ?? '').trim();
    if (/^\d{1,2}\s*[.)]?$/.test(titulo)) titulo = '';
    if (!titulo) {
      const [a, b] = partir(corpo, 90);
      if (b) [titulo, corpo] = [a, b];
      else if (corpo.length <= 70) [titulo, corpo] = [corpo, ''];
    }
    return { titulo, corpo };
  }
  // o miolo de lista: título, régua e parágrafo numa coluna, com o ícone do lado (alternando); sem caber, largura inteira
  function itemColuna(n, i, { tituloFinal, corpo, cabeca = null, ic = null, tamanhoTitulo = 56 }) {
    const esquerda = i % 2 === 0;
    const pilha = (colX, colW) => {
      const cab = cabeca ? cabeca(colX) : null;
      // sem título (a notícia sem cabeçalho), o parágrafo sozinho, sem a régua
      const h2 = tituloFinal ? k.texto('Título', tituloFinal, colX, 0, colW, { ...E.h2, tamanho: tamanhoTitulo, ...(tamanhoTitulo > 100 ? { alturaLinha: 1 } : {}) }) : null;
      const regua = corpo && h2 ? k.forma('Régua', 'linha', colX, 0, 64, 4, { cor: tema.destaque, raio: 999 }) : null;
      const p2 = corpo ? k.texto('Texto', corpo, colX, 0, colW, h2 ? E.corpo : E.resposta) : null;
      const blocos = [...(cab ? [cab] : []), ...(h2 ? [bloco([h2])] : []), ...(regua ? [bloco([regua])] : []), ...(p2 ? [bloco([p2])] : [])];
      const vaos = blocos.slice(1).map((b, j) => (j === 0 && cab ? 28 : 32));
      return { blocos, vaos, altura: alturaDe(blocos, vaos) };
    };
    const camadas = [...moldura(n, tema)];
    if (ic) {
      for (const lado of [420, 360]) {
        const colW = W - 2 * M - lado - 56;
        const colX = esquerda ? M + lado + 56 : M;
        const b = pilha(colX, colW);
        if (b.altura > espaco && lado > 360) continue;
        if (b.altura > espaco) break;
        const altura = Math.max(lado, b.altura);
        const topo = AREA.topo + Math.round((espaco - altura) / 2);
        empilhar(b.blocos, topo + Math.round((altura - b.altura) / 2), b.vaos);
        camadas.push(iconeEl(ic, esquerda ? M : W - M - lado, topo + Math.round((altura - lado) / 2), lado), ...b.blocos.flatMap((x) => x.camadas));
        return { fundo: fundoDe(tema), camadas };
      }
      usados.delete(ic.familia);
    }
    const b = pilha(M, W - 2 * M);
    empilhar(b.blocos, AREA.topo + Math.max(0, Math.round((espaco - b.altura) / 2)), b.vaos);
    camadas.push(...b.blocos.flatMap((x) => x.camadas));
    return { fundo: fundoDe(tema), camadas };
  }

  // o número do item: o título que já vem numerado ("1. O limite sobe") fica como veio, com o número em coral; a lista e
  // o alerta numeram os outros; a notícia não numera (os slides dela são cabeçalhos: "Quando começa", "De onde vem")
  const proprios = slides.some((s) => /^\d{1,2}[.)]\s+\S/.test(String(s.titulo ?? '').trim()));
  const numerar = !proprios && (tipo === 'lista' || tipo === 'alerta');
  function itemLista(s, i, { alerta = false, noticia = false } = {}) {
    const { titulo, corpo } = textosDoSlide(s);
    const proprio = /^(\d{1,2}[.)])\s+(\S[\s\S]*)$/.exec(titulo);
    const tituloFinal = proprio ? `*${proprio[1]}* ${destacar(proprio[2])}`
      : titulo ? (numerar ? `*${i + 1}.* ${destacar(titulo)}` : destacar(titulo))
        : numerar ? `*${i + 1}.*` : '';
    return itemColuna(i + 2, i, {
      tituloFinal, corpo: noticia ? destacarNumero(corpo) : corpo, ic: escolherIcone(`${titulo} ${corpo}`, usados, ctx.assets),
      tamanhoTitulo: titulo ? 56 : 140,
      // o alerta leva a pílula ATENÇÃO no alto do texto
      cabeca: alerta ? (x) => bloco(k.pilula('Atenção', 'Atenção', x, 0, tema).camadas) : null,
    });
  }

  // o mito: MITO, o mito com as aspas em coral, VERDADE e a resposta com a primeira frase em coral
  function itemMito(s, i) {
    let mito = String(s.titulo ?? '').trim();
    let resposta = String(s.texto ?? '').trim();
    if (/^\d{1,2}\s*[.)]?$/.test(mito) || !mito) [mito, resposta] = partir(resposta, 140);
    const limpo = mito.replace(ASPAS, '').trim();
    const blocos = [];
    const vaos = [];
    const p1 = k.pilula('Mito', 'Mito', M, 0, tema);
    blocos.push(bloco(p1.camadas)); vaos.push(26);
    const h2 = k.texto('Mito', `*“*${limpo}*”*`, M, 0, W - 2 * M, { ...E.h2, tamanho: 60 });
    blocos.push(bloco([h2]));
    if (resposta) {
      vaos.push(48);
      const p2 = k.pilula('Verdade', 'Verdade', M, 0, tema, { cheia: true, cor: tema.cheia });
      blocos.push(bloco(p2.camadas)); vaos.push(26);
      blocos.push(bloco([k.texto('Resposta', destacarInicio(resposta), M, 0, W - 2 * M, E.resposta)]));
    }
    const altura = alturaDe(blocos, vaos);
    empilhar(blocos, AREA.topo + Math.max(0, Math.round((espaco - altura) / 2)), vaos);
    return { fundo: fundoDe(tema), camadas: [...moldura(i + 2, tema), ...blocos.flatMap((b) => b.camadas)] };
  }

  // o comparativo: os dois lados em pílulas no alto, o lado do slide aceso, e o número em coral
  function itemComparativo(s, i) {
    const { titulo, corpo } = textosDoSlide(s);
    const texto = `${titulo} ${corpo}`;
    const fala = par.map((lado) => new RegExp(`(^|[^\\p{L}])${lado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'iu').test(texto));
    const aceso = fala[0] && !fala[1] ? 0 : fala[1] && !fala[0] ? 1 : -1;
    const cabeca = (x) => {
      const a = k.pilula(`Lado ${par[0]}`, par[0], x, 0, tema, aceso === 0 ? { cheia: true } : {});
      const b = k.pilula(`Lado ${par[1]}`, par[1], x + a.largura + 14, 0, tema, aceso === 1 ? { cheia: true } : {});
      return bloco([...a.camadas, ...b.camadas]);
    };
    const tit = destacarNumero(titulo);
    return itemColuna(i + 2, i, {
      tituloFinal: tit.includes('*') ? tit : destacar(titulo), corpo: destacarNumero(corpo), cabeca,
      ic: escolherIcone(texto, usados, ctx.assets),
    });
  }

  // a oferta: o símbolo da marca como o visto do item, o título com o número em coral e o parágrafo
  function itemOferta(s, i) {
    const { titulo, corpo } = textosDoSlide(s);
    const tit = destacarNumero(titulo);
    const lado = 132;
    const colX = M + lado + 40;
    const colW = W - M - colX;
    const h2 = k.texto('Título', tit.includes('*') ? tit : destacar(titulo), colX, 0, colW, { ...E.h2, tamanho: 60 });
    const p2 = corpo ? k.texto('Texto', destacarNumero(corpo), colX, 0, colW, { ...E.corpo, tamanho: 30 }) : null;
    const blocos = [bloco([h2]), ...(p2 ? [bloco([p2])] : [])];
    const vaos = [28];
    const altura = Math.max(lado, alturaDe(blocos, vaos));
    const topo = AREA.topo + Math.max(0, Math.round((espaco - altura) / 2));
    empilhar(blocos, topo, vaos);
    const camadas = [...moldura(i + 2, tema)];
    if (k.tem3(SIMBOLO)) camadas.push(k.imagem('Símbolo (o visto)', SIMBOLO, M, topo + Math.max(0, Math.round((h2.altura - lado) / 2)), lado, lado));
    camadas.push(...blocos.flatMap((b) => b.camadas));
    return { fundo: fundoDe(tema), camadas };
  }

  // a pergunta: num card, com PERGUNTA; embaixo, RESPOSTA e o texto
  function itemPergunta(s, i) {
    let pergunta = String(s.titulo ?? '').trim();
    let resposta = String(s.texto ?? '').trim();
    if (!pergunta || /^\d{1,2}\s*[.)]?$/.test(pergunta)) [pergunta, resposta] = partir(resposta, 140);
    const dentro = 48;
    const larg = W - 2 * M;
    const k1 = k.texto('Rótulo pergunta', 'Pergunta', M + dentro, 0, larg - 2 * dentro, E.kicker);
    const q = k.texto('Pergunta', destacar(pergunta.replace(ASPAS, '')), M + dentro, 0, larg - 2 * dentro, { ...E.h2, tamanho: 54 });
    k1.y = 0; q.y = k1.altura + 18;
    const card = k.forma('Card da pergunta', 'retangulo', M, -dentro, larg, k1.altura + 18 + q.altura + 2 * dentro, { cor: tema.card.cor, borda: { cor: tema.card.borda, largura: 2 }, raio: 32 });
    const blocos = [bloco([card, k1, q])];
    const vaos = [];
    if (resposta) {
      vaos.push(44);
      blocos.push(bloco([k.texto('Rótulo resposta', 'Resposta', M, 0, larg, E.kicker)])); vaos.push(16);
      blocos.push(bloco([k.texto('Resposta', destacarNumero(resposta), M, 0, larg, E.resposta)]));
    }
    const altura = alturaDe(blocos, vaos);
    empilhar(blocos, AREA.topo + Math.max(0, Math.round((espaco - altura) / 2)), vaos);
    return { fundo: fundoDe(tema), camadas: [...moldura(i + 2, tema), ...blocos.flatMap((b) => b.camadas)] };
  }

  // o quadro da tirinha: o painel, as falas em balões (o nome em cima) e o Léo quando ele fala; sem fala, o Léo sozinho
  function itemTirinha(s, n) {
    const falas = falasDoQuadro(s.texto);
    const camadas = [...moldura(n, tema)];
    const painel = k.forma('Painel do quadro', 'retangulo', M - 16, AREA.topo, W - 2 * M + 32, espaco, { cor: tema.card.cor, borda: { cor: tema.card.borda, largura: 2 }, raio: 32 });
    camadas.push(painel);
    const falaLeo = falas.some((f) => /^l[eé]o$/i.test(f.quem));
    // quem fala no quadro: o Léo (apontando); a carta, o papel ou o governo (a papelada 3D); sem fala, o Léo cansado
    const falaPapel = !falaLeo && falas.some((f) => /^(carta|papel|governo|receita|guia|prefeitura)$/i.test(f.quem));
    const leoId = falaLeo ? 'ast_base_leo-apontando-pro-lado' : falaPapel ? 'ast_base_papelada' : falas.length ? null : 'ast_base_leo-cansado';
    const leo = leoId && k.tem3(leoId) ? ctx.assets.get(leoId) : null;
    // as falas em balões, de cima pra baixo, na coluna de largura colW (o balão da fala curta encolhe até ela); sem
    // caber no painel, a letra de todas desce junto
    const montarFalas = (colW, tamanho) => {
      const out = [];
      let y = AREA.topo + 40;
      for (const f of falas.slice(0, 3)) {
        if (f.quem) {
          const nome = k.texto(`Quem fala (${f.quem})`, f.quem, M + 24, y, colW, E.kicker);
          out.push(nome);
          y += nome.altura + 10;
        }
        const tx = k.texto(`Fala${f.quem ? ` (${f.quem})` : ''}`, f.fala, M + 24 + 28, y + 22, colW - 56, { ...E.fala, tamanho });
        const wBalao = Math.min(colW, k.larguraDaLinha(tx) + 64);
        if (wBalao < colW) tx.largura = wBalao - 56;
        const balao = k.forma(`Balão${f.quem ? ` (${f.quem})` : ''}`, 'retangulo', M + 24, y, wBalao, tx.altura + 44, { cor: tema.balao.cor, raio: 28 });
        out.push(balao, tx);
        y += balao.altura + 30;
      }
      return { out, fundo: y };
    };
    const falasQueCabem = (colW, base = AREA.base - 24) => {
      let el = montarFalas(colW, 54);
      for (const t of [48, 42, 36]) {
        if (el.fundo <= base) break;
        el = montarFalas(colW, t);
      }
      return el;
    };
    const colInteira = W - M - 24 - (M + 24);
    let falasEl = null;
    if (leo) {
      // 23/10 (Pedro: o Léo maior): sem fala, quase o painel inteiro; com fala, de 600 a 760 px. O balão ao lado dele
      // nunca fica mais estreito que 440 px (a palavra não quebra no meio); quando as falas em cima, na largura toda,
      // deixam o Léo (ou a papelada) maior no espaço de baixo, o quadro vai assim
      const MIN_BALAO = 440;
      const hMax = !falas.length ? 900 : falas.length > 1 ? 600 : 760;
      const razao = leo.largura / leo.altura;
      let h = Math.min(hMax, Math.floor((W - M - 10 - 40 - (M + 24) - MIN_BALAO) / razao));
      let emCima = false;
      if (falas.length) {
        const cima = montarFalas(colInteira, 54);
        const hCima = Math.min(hMax, AREA.base - 24 - cima.fundo);
        if (hCima > h) { h = hCima; emCima = true; falasEl = cima; }
      } else h = hMax;
      const w = Math.round(h * razao);
      const box = { x: falas.length ? W - M - 10 - w : Math.round((W - w) / 2), y: AREA.base - 24 - h };
      camadas.push(k.imagem(falaPapel ? 'Papelada' : 'Léo', leo.id, box.x, box.y, w, h));
      if (falas.length && !emCima) falasEl = falasQueCabem(box.x - 40 - (M + 24));
    }
    camadas.push(...(falasEl ?? falasQueCabem(colInteira)).out);
    return { fundo: fundoDe(tema), camadas };
  }

  function item(s, i) {
    if (tipo === 'mito') return itemMito(s, i);
    if (tipo === 'comparativo' && par) return itemComparativo(s, i);
    if (tipo === 'oferta') return itemOferta(s, i);
    if (tipo === 'pergunta') return itemPergunta(s, i);
    if (tipo === 'tirinha') return itemTirinha(s, i + 2);
    return itemLista(s, i, { alerta: tipo === 'alerta', noticia: tipo === 'noticia' });
  }

  // ── o fim ──
  function fim() {
    const f = ca.final ?? {};
    if (fimEhQuadro) return itemTirinha(f, total);
    let titulo = String(f.titulo ?? '').trim();
    let texto = String(f.texto ?? '').trim();
    if (!titulo && texto) [titulo, texto] = partir(texto, 90);
    const n = total;
    if (conversao) {
      // o logo no centro, o convite e o botão do link da bio (só na peça de Conversão); no claro, a página coral
      const t = ctx.variante === 'claro' ? CORAL_CTA : tema;
      const e = estilos(t);
      const camadas = [...luz(t), ...moldura(n, t, { rodape: false })];
      const logoW = 380;
      const logoH = Math.round((logoW * LOGO.altura) / LOGO.largura);
      const tag = k.texto('Contabilidade Digital', 'Contabilidade Digital', M, 0, W - 2 * M, { ...e.marca, alinhamento: 'centro' });
      const convite = titulo || 'Deixa a burocracia com a gente.';
      const h = k.texto('Convite', destacar(convite), (W - 860) / 2, 0, 860, e.cta);
      const sub = k.texto('Linha de baixo', texto || 'Você cuida do negócio, a gente cuida da papelada.', (W - 840) / 2, 0, 840, e.sub);
      // o botão diz o link da bio; o convite que já fala dele fica sem botão (a mesma coisa não aparece duas vezes)
      const comBotao = !/link da bio/i.test(`${convite} ${sub.texto}`);
      const btTxt = comBotao ? k.texto('Botão', 'Clica no link da bio', 0, 0, 1000, e.botao) : null;
      const wBt = btTxt ? k.larguraDaLinha(btTxt) : 0;
      const altura = logoH + 14 + tag.altura + 56 + h.altura + (btTxt ? 52 + 96 : 0) + 36 + sub.altura;
      let y = AREA.topo + Math.max(0, Math.round((1278 - 40 - AREA.topo - altura) / 2));
      if (k.tem3(t.logo)) camadas.push(k.imagem('Logo', t.logo, Math.round((W - logoW) / 2), y, logoW, logoH));
      y += logoH + 14;
      tag.y = y; y += tag.altura + 56;
      h.y = y; y += h.altura;
      camadas.push(tag, h);
      if (btTxt) {
        const bt = k.forma('Fundo do botão', 'retangulo', Math.round((W - wBt - 120) / 2), y + 52, wBt + 120, 96, { cor: t.botao.fundo, raio: 12 });
        Object.assign(btTxt, { x: bt.x + 58, y: bt.y + Math.round((96 - btTxt.altura) / 2), largura: wBt + 4 });
        camadas.push(bt, btTxt);
        y += 52 + 96;
      }
      sub.y = y + 36;
      camadas.push(sub);
      return { fundo: fundoDe(t), camadas };
    }
    // o fechamento da peça, com o ícone (no escuro, o círculo claro; no claro, o card)
    const ic = escolherIcone(`${titulo} ${texto}`, usados, ctx.assets, { preferir: 'marcador' });
    const camadas = [...moldura(n, tema)];
    const h = k.texto('Fechamento', destacar(titulo || 'Salva pra não esquecer.'), (W - 860) / 2, 0, 860, { ...E.h2, alinhamento: 'centro' });
    const p2 = texto ? k.texto('Texto', texto, (W - 780) / 2, 0, 780, { ...E.corpo, alinhamento: 'centro' }) : null;
    const lado = 300;
    const altura = (ic ? lado + 48 : 0) + h.altura + (p2 ? 34 + p2.altura : 0);
    let y = AREA.topo + Math.max(0, Math.round((espaco - altura) / 2));
    if (ic) { camadas.push(iconeEl(ic, Math.round((W - lado) / 2), y, lado, ctx.variante === 'claro' ? 'card' : 'circulo')); y += lado + 48; }
    h.y = y; y += h.altura;
    camadas.push(h);
    if (p2) { p2.y = y + 34; camadas.push(p2); }
    return { fundo: fundoDe(tema), camadas };
  }

  return [capa(), ...slides.map(item), fim()];
}
