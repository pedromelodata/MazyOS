// 23/10 (Pedro): "os carrosséis estão vindo extremamente genéricos, preciso que ele seja criado de acordo com a skill
// MazyOS. Produzindo carrosséis com essa qualidade" (a referência é o "Giro Legalizaí" de 01/09,
// marketing/conteudo/carrossel-giro-noticias-2026-09-01). O "Criar no Ateliê" do carrossel (estudio.mjs, designDaPeca)
// e o "Remontar com o texto da peça" montam as páginas no visual da skill carrossel (.claude/skills/carrossel/SKILL.md,
// "Visual do Legalizaí"), em camadas que o editor mexe:
//  - a tag do público (ME, MEI ou ME / MEI) no canto de cima à esquerda e o contador (01 / 07) à direita, em todas
//  - o logo com "Contabilidade Digital" no rodapé à esquerda (no fim de Conversão, o logo vai no centro)
//  - capa: o kicker (LEGALIZAÍ · OUTUBRO 2026), o gancho grande com o trecho final em coral, a linha de apoio, a pill
//    "Arrasta pro lado", o ícone 3D e o quarto de círculo coral saindo pelo canto
//  - um slide por item: "1." em coral no começo do título e o trecho-chave em coral, a régua fina numa linha própria e
//    o parágrafo, com o ícone 3D de um lado, alternando o lado. Texto que não cabe na coluna ao lado do ícone vai na
//    largura inteira, sem ícone; sem título, o número fica grande (o layout NÚMERO da skill)
//  - o fim: na peça de Conversão, o logo no centro, o convite e o botão "Clica no link da bio" (sem botão quando o
//    convite já fala do link); nas outras, o ícone e o fechamento que a peça já tem (post de atração não leva convite
//    de venda)
// Duas variações da skill, alternando de um carrossel pro outro pela data no cronograma ("nunca duas capas iguais em
// sequência"; o mecanismo visual também acusa o mesmo fundo com os mesmos assets): o 1º escuro (o Giro: o gradiente ink,
// a luz coral na capa e no fim, o ícone de fundo escuro em card e o de fundo creme em círculo claro) e o 2º claro (o
// "5 sinais", o estilo vigente: papel quente, tinta, coral 600 no destaque, os ícones em card e o fim de Conversão na
// página coral, com o destaque e o botão em tinta).
// O ícone sai pelo assunto (as palavras de cada um abaixo), sem repetir no mesmo carrossel; sem nenhuma palavra, segue a
// ordem da lista. Só entra ícone que está no banco (lote "carrossel" do catalogo.json). O número do item fica só no
// título (a skill pede o número no começo do título; o selo repetido no ícone da referência saiu: a mesma informação
// não aparece duas vezes). Medidas no 1080x1350: 80 de margem nas laterais, todo texto dentro da área segura de 72 e
// nenhuma letra abaixo de 22 px (a regra do Estúdio vale por cima dos 15 a 17 px do kicker da skill).
// As funções de medir texto vêm do estudio.mjs (alturaEstimada e quebrarLinhas) pelo ctx, sem importar de volta.

const W = 1080;
const M = 80;
const TOPO = 72;
// a área do conteúdo: abaixo da tag e acima do logo do rodapé
const AREA = { topo: 172, base: 1136 };
const LOGO = { y: 1184, largura: 240, altura: 47 };
const FUNDO_ESCURO = 'ast_base_fundo-escuro-feed';
const LUZ = 'ast_base_brilho-coral';
const CORAL = '#F2643C';

const TEMAS = {
  escuro: {
    fundo: { tipo: 'imagem', cor: '#1F2228', cor2: '#1F2228', angulo: 160, assetId: FUNDO_ESCURO, ajuste: 'cobrir' },
    luz: true, logo: 'ast_base_logo-negativo-claro',
    titulo: '#F4F1EC', corpo: '#BDB8B0', apagado: '#BDB8B0', destaque: CORAL, kicker: CORAL,
    tag: { fundo: '#F2643C24', borda: CORAL, texto: CORAL },
    arrasta: { fundo: CORAL, texto: '#FFFFFF' },
    botao: { fundo: CORAL, texto: '#FFFFFF' },
    // o ícone de fundo escuro vira card; o de fundo creme, círculo claro (como no Giro)
    forma: (ic) => (ic.fundo === 'escuro' ? 'card' : 'circulo'),
  },
  claro: {
    fundo: { tipo: 'cor', cor: '#FAF8F5', cor2: '#F1EEE9', angulo: 160, assetId: null, ajuste: 'cobrir' },
    luz: false, logo: 'ast_base_logo-horizontal',
    titulo: '#1B1E24', corpo: '#524E48', apagado: '#524E48', destaque: '#DD4E27', kicker: '#DD4E27',
    tag: { fundo: '#FEF3EE', borda: CORAL, texto: '#B83D1C' },
    arrasta: { fundo: '#1B1E24', texto: '#FFFFFF' },
    botao: { fundo: '#DD4E27', texto: '#FFFFFF' },
    forma: () => 'card',
  },
};
// o fim de Conversão do claro: a página coral do "5 sinais"
const CORAL_CTA = {
  fundo: { tipo: 'cor', cor: CORAL, cor2: CORAL, angulo: 160, assetId: null, ajuste: 'cobrir' },
  luz: false, logo: 'ast_base_logo-negativo-claro',
  titulo: '#FFFFFF', corpo: '#1B1E24', apagado: '#FFFFFF', destaque: '#1B1E24', kicker: '#FFFFFF',
  tag: { fundo: '#FFFFFF33', borda: '#FFFFFF', texto: '#FFFFFF' },
  arrasta: { fundo: '#1B1E24', texto: '#FFFFFF' },
  botao: { fundo: '#1B1E24', texto: '#FFFFFF' },
  forma: () => 'card',
};

const BASE = { rotacao: 0, opacidade: 1, travada: false, oculta: false };
const BASE_TEXTO = { ...BASE, fonte: 'Sora', italico: false, corDestaque: CORAL, alinhamento: 'esquerda', caixa: 'normal', fundo: null, espacamentoLetra: 0 };
const estilos = (t) => ({
  kicker: { tamanho: 22, peso: 700, cor: t.kicker, espacamentoLetra: 0.22, caixa: 'alta', alturaLinha: 1.3 },
  tag: { tamanho: 22, peso: 700, cor: t.tag.texto, espacamentoLetra: 0.16, caixa: 'alta', alturaLinha: 1.2, alinhamento: 'centro' },
  contador: { tamanho: 22, peso: 600, cor: t.apagado, espacamentoLetra: 0.18, alturaLinha: 1.2, alinhamento: 'direita' },
  marca: { tamanho: 22, peso: 600, cor: t.apagado, espacamentoLetra: 0.06, alturaLinha: 1.2 },
  h1: { tamanho: 80, peso: 800, cor: t.titulo, corDestaque: t.destaque, espacamentoLetra: -0.03, alturaLinha: 1.06 },
  apoio: { tamanho: 30, peso: 500, cor: t.corpo, corDestaque: t.destaque, alturaLinha: 1.45 },
  h2: { tamanho: 56, peso: 800, cor: t.titulo, corDestaque: t.destaque, espacamentoLetra: -0.025, alturaLinha: 1.14 },
  corpo: { tamanho: 28, peso: 400, cor: t.corpo, corDestaque: t.destaque, alturaLinha: 1.5 },
  pill: { tamanho: 24, peso: 700, cor: t.arrasta.texto, alturaLinha: 1.2, alinhamento: 'centro' },
  botao: { tamanho: 28, peso: 700, cor: t.botao.texto, alturaLinha: 1.2, alinhamento: 'centro' },
  cta: { tamanho: 64, peso: 800, cor: t.titulo, corDestaque: t.destaque, espacamentoLetra: -0.03, alturaLinha: 1.1, alinhamento: 'centro' },
  sub: { tamanho: 26, peso: 500, cor: t.corpo, alturaLinha: 1.4, alinhamento: 'centro' },
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

const tem = (v) => Boolean(String(v ?? '').trim());
const dois = (n) => String(n).padStart(2, '0');
const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const MESES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

// a variação do carrossel: os carrosséis do cronograma pela data (e pela ordem no dia), o 1º escuro, o 2º claro e assim
// por diante (o mesmo carrossel cai sempre na mesma variação, a não ser que entre outro antes dele)
export function varianteDoCarrossel(db, p) {
  const lista = (db?.reels ?? []).filter((r) => r?.peca === 'carrossel')
    .sort((a, b) => String(a.data || '9999').localeCompare(String(b.data || '9999')) || (Number(a.ordem) || 0) - (Number(b.ordem) || 0) || String(a.id).localeCompare(String(b.id)));
  return lista.findIndex((r) => r.id === p?.id) % 2 === 1 ? 'claro' : 'escuro';
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

// a primeira frase (até max letras) e o resto
function partir(t, max = 90) {
  const s = String(t ?? '').trim();
  const m = /^(.{8,}?[.!?:])\s+(\S[\s\S]*)$/u.exec(s);
  return m && m[1].length <= max ? [m[1], m[2].trim()] : [s, ''];
}

function construtor(ctx) {
  const texto = (nome, txt, x, y, largura, estilo) => {
    const c = { tipo: 'texto', nome, texto: String(txt ?? '').trim(), x, y, largura, altura: 10, ...BASE_TEXTO, ...estilo };
    c.altura = ctx.alturaEstimada(c);
    return c;
  };
  // a largura do texto numa linha só (pill, tag e contador)
  const larguraDaLinha = (c) => {
    const { larguras, pad } = ctx.quebrarLinhas({ ...c, largura: 100000 });
    return Math.ceil(larguras.reduce((m, w) => Math.max(m, w), 0) * 1.04 + pad) + 2;
  };
  const imagem = (nome, assetId, x, y, largura, altura, extra = {}) => ({ tipo: 'imagem', nome, assetId, x, y, largura, altura, ...BASE, espelhar: false, raio: 0, sombra: null, ...extra });
  const forma = (nome, tipo, x, y, largura, altura, extra = {}) => ({ tipo: 'forma', nome, forma: tipo, x, y, largura, altura, ...BASE, cor: CORAL, borda: null, raio: 0, ...extra });
  const tem3 = (id) => ctx.assets.has(id);
  return { texto, larguraDaLinha, imagem, forma, tem3 };
}

export function montarCarrossel(p, ctx) {
  const k = construtor(ctx);
  const ca = p.carrossel ?? {};
  const usados = new Set();
  const tema = TEMAS[ctx.variante] ?? TEMAS.escuro;
  const E = estilos(tema);
  // a tag do público pelo que a peça e o carrossel falam: MEI e ME juntos, ME / MEI; só um deles, ele; nenhum, ME
  // quando fala de contador, pró-labore ou sócio (coisa de ME: no MEI não tem contador humano, P06) e ME / MEI no resto
  const todoTexto = [p.ideia, p.tema, p.pilarTexto, ca.capa?.titulo, ca.capa?.texto, ...(ca.slides ?? []).flatMap((s) => [s?.titulo, s?.texto]), ca.final?.titulo, ca.final?.texto].join(' ');
  const falaMei = /\bMEI\b/.test(todoTexto);
  const falaMe = /\bME\b/.test(todoTexto);
  const publico = falaMei && falaMe ? 'ME / MEI' : falaMei ? 'MEI' : falaMe ? 'ME'
    : /contador|\bCRC\b|pr[oó]-?labore|s[oó]cio/i.test(todoTexto) ? 'ME' : (ctx.publico ?? 'ME / MEI');
  const conversao = ctx.bloco === 'Conversão';
  const slides = (ca.slides ?? []).filter((s) => tem(s?.titulo) || tem(s?.texto)).slice(0, ctx.maxSlides ?? 10);
  const total = slides.length + 2;
  // o fundo da variação; o escuro sem a imagem no banco cai no gradiente ink
  const fundoDe = (t) => (t.fundo.assetId && !k.tem3(t.fundo.assetId) ? { tipo: 'gradiente', cor: '#2A2E37', cor2: '#15171C', angulo: 160, assetId: null, ajuste: 'cobrir' } : { ...t.fundo });
  const luz = (t) => (t.luz && k.tem3(LUZ) ? [k.imagem('Luz coral', LUZ, -420, -380, 1320, 1080, { opacidade: 0.9 })] : []);

  // a tag do público, o contador e o logo do rodapé
  function moldura(n, t, { rodape = true } = {}) {
    const e = estilos(t);
    const out = [];
    const tag = k.texto('Tag do público', publico, 0, 0, 1000, e.tag);
    const wTag = k.larguraDaLinha(tag);
    const pill = k.forma('Fundo da tag', 'retangulo', M, TOPO, wTag + 56, 60, { cor: t.tag.fundo, borda: { cor: t.tag.borda, largura: 2 }, raio: 999 });
    Object.assign(tag, { x: pill.x + 26, y: pill.y + Math.round((pill.altura - tag.altura) / 2), largura: wTag + 4 });
    out.push(pill, tag);
    const cont = k.texto('Contador', `${dois(n)} / ${dois(total)}`, 0, 0, 1000, e.contador);
    const wc = k.larguraDaLinha(cont);
    Object.assign(cont, { x: W - M - wc, y: pill.y + Math.round((pill.altura - cont.altura) / 2), largura: wc });
    out.push(cont);
    if (rodape && k.tem3(t.logo)) {
      out.push(k.imagem('Logo', t.logo, M, LOGO.y, LOGO.largura, LOGO.altura));
      out.push(k.texto('Contabilidade Digital', 'Contabilidade Digital', M, LOGO.y + LOGO.altura + 12, 420, e.marca));
    }
    return out;
  }
  // o ícone no tamanho pedido, em card (canto arredondado) ou em círculo
  const iconeEl = (ic, x, y, lado, forma = tema.forma(ic)) => k.imagem(forma === 'card' ? 'Ícone 3D' : 'Ícone 3D no círculo', ic.id, x, y, lado, lado, { raio: forma === 'card' ? Math.round(lado * 0.067) : 9999 });

  // ── capa ──
  function capa() {
    const tituloCapa = ca.capa?.titulo || p.ideia || '';
    const apoio = ca.capa?.texto && semAcento(ca.capa.texto).trim() !== semAcento(tituloCapa).trim() ? ca.capa.texto : '';
    const mes = /^\d{4}-(\d{2})-\d{2}$/.test(p.data ?? '') ? ` · ${MESES[Number(p.data.slice(5, 7)) - 1]} ${p.data.slice(0, 4)}` : '';
    const ic = escolherIcone(`${tituloCapa} ${apoio} ${p.ideia ?? ''} ${p.tema ?? ''}`, usados, ctx.assets, { preferir: /\?\s*$/.test(tituloCapa) ? 'duvida' : 'megafone' });
    const pillTxt = k.texto('Arrasta pro lado', 'Arrasta pro lado', 0, 0, 1000, E.pill);
    const wPill = k.larguraDaLinha(pillTxt);
    // o título desce de tamanho e o ícone diminui até o bloco caber na área
    let melhor = null;
    for (const [t1, lado] of [[80, 460], [76, 420], [72, 400], [66, 360], [60, 320], [56, 280]]) {
      const kicker = k.texto('Kicker', `Legalizaí${mes}`, M, 0, W - 2 * M, E.kicker);
      const h1 = k.texto('Título', destacar(tituloCapa), M, 0, W - 2 * M, { ...E.h1, tamanho: t1 });
      const sub = apoio ? k.texto('Linha de apoio', apoio, M, 0, 840, E.apoio) : null;
      const linha = ic ? lado : 76;
      const altura = kicker.altura + 30 + h1.altura + (sub ? 30 + sub.altura : 0) + 48 + linha;
      melhor = { kicker, h1, sub, lado, altura };
      if (altura <= AREA.base - AREA.topo) break;
    }
    const { kicker, h1, sub, lado, altura } = melhor;
    let y = AREA.topo + Math.max(0, Math.round((AREA.base - AREA.topo - altura) / 2));
    kicker.y = y; y += kicker.altura + 30;
    h1.y = y; y += h1.altura;
    if (sub) { y += 30; sub.y = y; y += sub.altura; }
    y += 48;
    const linha = ic ? lado : 76;
    const baseLinha = y + linha;
    const pillForma = k.forma('Fundo do arrasta', 'retangulo', M, baseLinha - 76, wPill + 72, 76, { cor: tema.arrasta.fundo, raio: 999 });
    Object.assign(pillTxt, { x: pillForma.x + 34, y: pillForma.y + Math.round((76 - pillTxt.altura) / 2), largura: wPill + 4 });
    const camadas = [...luz(tema)];
    // o quarto de círculo coral sai pelo canto de baixo, sem encostar no ícone
    camadas.push(k.forma('Quarto de círculo', 'circulo', W - 230, Math.max(baseLinha + 4, 1150), 400, 400, { opacidade: 0.92 }));
    camadas.push(...moldura(1, tema), kicker, h1);
    if (sub) camadas.push(sub);
    camadas.push(pillForma, pillTxt);
    // na capa clara, o ícone vai no círculo (o do 5 sinais)
    if (ic) camadas.push(iconeEl(ic, W - M + 20 - lado, y, lado, ctx.variante === 'claro' ? 'circulo' : tema.forma(ic)));
    return { fundo: fundoDe(tema), camadas };
  }

  // ── um item: o ícone de um lado, o texto do outro ──
  function item(s, i) {
    const n = i + 2;
    let titulo = String(s.titulo ?? '').trim();
    let corpo = String(s.texto ?? '').trim();
    // o título que é só o número (o modelo do kit) não conta. Sem título: com duas frases, a primeira vira o título e o
    // resto o parágrafo; uma frase curta vira o título; a longa fica no parágrafo, embaixo do número grande
    if (/^\d{1,2}\s*[.)]?$/.test(titulo)) titulo = '';
    if (!titulo) {
      const [a, b] = partir(corpo, 90);
      if (b) [titulo, corpo] = [a, b];
      else if (corpo.length <= 70) [titulo, corpo] = [corpo, ''];
    }
    const tituloFinal = titulo ? `*${i + 1}.* ${destacar(titulo)}` : `*${i + 1}.*`;
    const ic = escolherIcone(`${titulo} ${corpo}`, usados, ctx.assets);
    const esquerda = i % 2 === 0;
    const pilha = (colX, colW) => {
      const h2 = k.texto('Título', tituloFinal, colX, 0, colW, titulo ? E.h2 : { ...E.h2, tamanho: 140, alturaLinha: 1 });
      const regua = corpo ? k.forma('Régua', 'linha', colX, 0, 64, 4, { cor: tema.destaque, raio: 999 }) : null;
      const p2 = corpo ? k.texto('Texto', corpo, colX, 0, colW, E.corpo) : null;
      const altura = h2.altura + (p2 ? 32 + 4 + 32 + p2.altura : 0);
      return { h2, regua, p2, altura };
    };
    const assentar = ({ h2, regua, p2 }, y) => {
      h2.y = y; y += h2.altura;
      if (p2) { y += 32; regua.y = y; y += 4 + 32; p2.y = y; }
    };
    const camadas = [...moldura(n, tema)];
    const espaco = AREA.base - AREA.topo;
    if (ic) {
      for (const lado of [420, 360]) {
        const colW = W - 2 * M - lado - 56;
        const colX = esquerda ? M + lado + 56 : M;
        const b = pilha(colX, colW);
        if (b.altura > espaco && lado > 360) continue;
        if (b.altura > espaco) break;
        const altura = Math.max(lado, b.altura);
        const topo = AREA.topo + Math.round((espaco - altura) / 2);
        assentar(b, topo + Math.round((altura - b.altura) / 2));
        camadas.push(iconeEl(ic, esquerda ? M : W - M - lado, topo + Math.round((altura - lado) / 2), lado), b.h2);
        if (b.p2) camadas.push(b.regua, b.p2);
        return { fundo: fundoDe(tema), camadas };
      }
      usados.delete(ic.familia);
    }
    // o texto não cabe ao lado do ícone: largura inteira, sem ícone
    const b = pilha(M, W - 2 * M);
    assentar(b, AREA.topo + Math.max(0, Math.round((espaco - b.altura) / 2)));
    camadas.push(b.h2);
    if (b.p2) camadas.push(b.regua, b.p2);
    return { fundo: fundoDe(tema), camadas };
  }

  // ── o fim ──
  function fim() {
    const f = ca.final ?? {};
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
    let y = AREA.topo + Math.max(0, Math.round((AREA.base - AREA.topo - altura) / 2));
    if (ic) { camadas.push(iconeEl(ic, Math.round((W - lado) / 2), y, lado, ctx.variante === 'claro' ? 'card' : 'circulo')); y += lado + 48; }
    h.y = y; y += h.altura;
    camadas.push(h);
    if (p2) { p2.y = y + 34; camadas.push(p2); }
    return { fundo: fundoDe(tema), camadas };
  }

  return [capa(), ...slides.map(item), fim()];
}
