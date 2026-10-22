// 22/10 (Pedro): importa os quadros do destaque "Comece por aqui" como documentos EDITÁVEIS do editor de Design do
// Ateliê (não imagem chapada). Abre o HTML de origem (marketing/destaques/comece-por-aqui/quadros/destaque.html) no
// Edge pelo Playwright do scripts/render-env (como o render.cjs ao lado dele), mede cada section.q (a capa e os
// quadros q1 a q10) e converte cada elemento visível em camada do contrato do editor:
//  - texto: fonte, peso, tamanho, cor, alinhamento, altura de linha, espaçamento e caixa; o trecho de outra cor (o
//    coral, ou a tinta no fundo coral) vira *asteriscos* com a cor de destaque. As quebras de linha do navegador
//    entram como \n (a linha sai igual mesmo se o editor quebrar por largura). Trechos com peso diferente na mesma
//    linha (o "100%" em 800 no meio de um texto em 700) viram camadas separadas, lado a lado
//  - imagem: o asset do banco base (estudio/base/catalogo.json) que veio do arquivo que o HTML usa, na posição e no
//    tamanho exatos (o recorte que o montar-banco.py fez é descontado pelo campo "fonte" do catálogo), com rotação,
//    opacidade e a sombra (drop-shadow) do CSS
//  - pílulas, cartões e a caixa da foto: forma retângulo com cor, borda e raio
//  - o grifo à mão, o símbolo e o símbolo negativo (SVG do próprio HTML): os assets SVG do banco
//  - a luz coral (quadro 2) e o disco de papel (quadro 6): os PNG do banco feitos pelo fundos.cjs
//  - o fundo da página: o PNG do fundo (papel, escuro, coral ou vinheta) com o grão, feito pelo fundos.cjs
// Grava um documento por quadro em estudio/base/docs/comece-por-aqui-<nn>.json (00 é a capa), sem id e sem datas:
// quem semeia no banco é o servidor.
// Convenções das camadas (as do contrato, anotadas aqui pra quem desenha o editor):
//  - x, y, largura e altura em px do documento, canto de cima à esquerda; rotacao em graus no sentido do CSS (positivo
//    gira no sentido horário), em volta do centro da caixa
//  - texto: y é o topo da caixa da primeira linha (como o CSS: cada linha ocupa tamanho x alturaLinha e o texto fica
//    centrado nela); alturaLinha é multiplicador do tamanho (1.04); espacamentoLetra é em em (-0.03 = -0,03em)
//  - cor com alfa vem em #RRGGBBAA (a pílula translúcida do quadro 2 e as sombras)
//  - forma com borda: a borda fica por dentro da caixa (box-sizing: border-box)
// O que muda de propósito em relação ao PNG final (e a conferência mede):
//  - o Léo que fundia no papel por darken com borda esfumada agora é o recorte com alfa do banco (o mesmo desenho)
//  - o símbolo 3D do quadro 8 tinha os cantos apagados pela máscara redonda; agora entra inteiro (a regra do Pedro:
//    o visto é o símbolo inteiro, nunca cortado)
//  - o grão de papel, que ficava por cima de tudo, agora fica só no fundo
//  - 22/10 (achado da revisão): os ajustes pra o Destaque aprovado abrir no editor com 0 avisos (AJUSTES, abaixo): o
//    Léo do q1 com a exceção de corte reto no nome e os brilhos acima dele, o grifo e o texto do q5 34 px acima e o
//    "O combinado é simples:" a 100% e a maleta do q6 na altura da linha
// Uso (neste PC, com o Edge instalado):
//   node scripts/importar-destaque.cjs                      importa e grava os 11 documentos
//   node scripts/importar-destaque.cjs --conferir <pasta>   importa, grava, desenha cada documento numa página de
//                                                           teste e compara com o PNG final (provas na pasta)
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');
const { fileURLToPath } = require('url');

const APP = path.resolve(__dirname, '..');
const RAIZ = path.resolve(APP, '..');
const { chromium } = require(path.join(RAIZ, 'scripts', 'render-env', 'node_modules', 'playwright'));

const HTML = path.join(RAIZ, 'marketing', 'destaques', 'comece-por-aqui', 'quadros', 'destaque.html');
const FINAL = path.join(RAIZ, 'marketing', 'final', '2026-10-21 Destaque Comece por aqui');
const BASE = path.join(APP, 'estudio', 'base');
const CATALOGO = path.join(BASE, 'catalogo.json');
const SAIDA = path.join(BASE, 'docs');

// quadro → [número do arquivo, nome do PNG final, título, o papel do quadro na sequência (ROTEIRO.md, "Lógica")]
const QUADROS = [
  ['capa', '00', '00-capa-do-destaque', 'Capa do destaque', 'a capa do destaque no perfil: o símbolo branco no coral'],
  ['q1', '01', '01-gancho', 'Gancho', 'o gancho (banco 105): promete a história que quase ninguém conhece'],
  ['q2', '02', '02-dor', 'Dor', 'a dor: ter empresa no Brasil cansa'],
  ['q3', '03', '03-virada', 'Virada', 'a resposta: por isso a gente criou a Legalizaí, com telas reais do app'],
  ['q4', '04', '04-time', 'Time', 'o rosto: quem tá por trás, o time de cinco'],
  ['q5', '05', '05-missao', 'Missão', 'a missão, dita sem rótulo: tirar a burocracia do CNPJ das costas'],
  ['q6', '06', '06-proposito', 'Propósito', 'o propósito, dito sem rótulo: você cuida do negócio, a gente da papelada'],
  ['q7', '07', '07-valores', 'Valores', 'os valores na frase do Pedro: contabilidade digital 100% Humana e o resto'],
  ['q8', '08', '08-em-dia', 'Em dia', 'a entrega: sua empresa em dia, pelo celular, sem contabilês'],
  ['q9', '09', '09-lista', 'Lista de espera', 'o fecho: entrar na lista não cobra nada e não compromete'],
  ['q10', '10', '10-vai-legalizai', 'Vai, Legalizaí', 'o fecho do Léo, num quadro só dele'],
];

// o fundo de cada classe de section (o PNG do banco e a cor de reserva) e a cor de destaque do texto
const FUNDOS = {
  papel: { assetId: 'ast_base_fundo-papel-stories', cor: '#FAF8F5', cor2: '#FAF8F5', angulo: 0, destaque: '#DD4E27' },
  escuro: { assetId: 'ast_base_fundo-escuro-stories', cor: '#15171C', cor2: '#2A2E37', angulo: 160, destaque: '#F2643C' },
  coralbg: { assetId: 'ast_base_fundo-coral-stories', cor: '#F2643C', cor2: '#F2643C', angulo: 0, destaque: '#1B1E24' },
  vinheta: { assetId: 'ast_base_fundo-vinheta-stories', cor: '#22222A', cor2: '#392829', angulo: 180, destaque: '#F2643C' },
};
// SVG do próprio HTML (<use href="#...">) → asset do banco
const SIMBOLOS = { '#simbolo': 'ast_base_simbolo', '#simbolo-neg': 'ast_base_simbolo-negativo', '#risco': 'ast_base_grifo-coral' };
// arquivos do destaque que são cópia idêntica de um asset do banco (o banco guarda o original do identidade/logos)
const MESMO_ARQUIVO = { 'marketing/destaques/comece-por-aqui/assets/legalizai-logo-horizontal.svg': 'ast_base_logo-horizontal' };
// elementos com fundo em degradê que viraram PNG no banco: a folga da imagem em volta da caixa do elemento
const DEGRADES = { brilho: { assetId: 'ast_base_brilho-coral', folga: 0 }, disco: { assetId: 'ast_base_disco-papel', folga: 100 } };

const ESTRATEGIA = (papel) => ({
  pilar: 3,
  bloco: 'Afeto',
  motivo: `Destaque fixo "Comece por aqui" (21/10/2026): a nossa origem, o time, a missão, o propósito e os valores, com fecho na lista de espera. Este quadro é ${papel}.`,
  gatilhoEmocional: 'cansaço da burocracia',
  gatilhoPsicologico: 'curiosidade',
});

const TRACOS = new RegExp(`[${String.fromCharCode(0x2014, 0x2013)}]`);
const arred = (n, casas = 2) => Math.round(n * 10 ** casas) / 10 ** casas;

// ---------- medida no navegador ----------

// roda na página: devolve, por section.q, os blocos de texto (linhas e caracteres medidos), as imagens, os SVG e as
// formas, cada um com a ordem de pintura (z-index do filho da section e a ordem no DOM)
function medir() {
  const hex = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    const a = p.length > 3 ? p[3] : 1;
    const h = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0').toUpperCase();
    return `#${h(p[0])}${h(p[1])}${h(p[2])}${a < 1 ? h(a * 255) : ''}`;
  };
  const alfa = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!m) return 0;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return p.length > 3 ? p[3] : 1;
  };
  const familia = (f) => f.split(',')[0].trim().replace(/^["']|["']$/g, '');
  const sombra = (filtro) => {
    const m = /drop-shadow\((rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\)/.exec(filtro || '');
    return m ? { cor: hex(m[1]), x: Number(m[2]), y: Number(m[3]), desfoque: Number(m[4]) } : null;
  };
  const sondas = new Map();
  // altura de linha "normal" da fonte: mede uma linha de verdade
  const linhaNormal = (cs) => {
    const chave = `${cs.fontFamily}|${cs.fontWeight}|${cs.fontStyle}|${cs.fontSize}`;
    if (!sondas.has(chave)) {
      const d = document.createElement('div');
      Object.assign(d.style, { position: 'absolute', visibility: 'hidden', fontFamily: cs.fontFamily, fontWeight: cs.fontWeight, fontStyle: cs.fontStyle, fontSize: cs.fontSize, lineHeight: 'normal', whiteSpace: 'nowrap' });
      d.textContent = 'Hg';
      document.body.appendChild(d);
      sondas.set(chave, d.getBoundingClientRect().height);
      d.remove();
    }
    return sondas.get(chave);
  };
  const quadros = [];
  for (const q of document.querySelectorAll('section.q')) {
    const base = q.getBoundingClientRect();
    const rel = (r) => ({ x0: r.left - base.left, y0: r.top - base.top, x1: r.right - base.left, y1: r.bottom - base.top });
    const todos = [...q.querySelectorAll('*')];
    const ordem = new Map(todos.map((el, i) => [el, i + 1]));
    const camadaZ = (el) => {
      let a = el;
      while (a.parentElement && a.parentElement !== q) a = a.parentElement;
      const z = getComputedStyle(a).zIndex;
      return z === 'auto' ? 0 : Number(z);
    };
    const opac = (el) => {
      let o = 1;
      for (let a = el; a && a !== q; a = a.parentElement) o *= Number(getComputedStyle(a).opacity);
      return o;
    };
    const visivel = (el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const itens = [];
    // imagens
    for (const img of q.querySelectorAll('img')) {
      if (!visivel(img)) continue;
      const cs = getComputedStyle(img);
      const r = img.getBoundingClientRect();
      const m = new DOMMatrixReadOnly(cs.transform === 'none' ? undefined : cs.transform);
      itens.push({
        tipo: 'imagem', classe: img.className, src: img.src, natural: [img.naturalWidth, img.naturalHeight],
        w: img.offsetWidth, h: img.offsetHeight, cx: (r.left + r.right) / 2 - base.left, cy: (r.top + r.bottom) / 2 - base.top,
        rot: (Math.atan2(m.b, m.a) * 180) / Math.PI, opacidade: opac(img), sombra: sombra(cs.filter), raio: parseFloat(cs.borderTopLeftRadius) || 0,
        mistura: cs.mixBlendMode, mascara: cs.webkitMaskImage && cs.webkitMaskImage !== 'none',
        z: camadaZ(img), ordem: ordem.get(img), sub: 0,
      });
    }
    // SVG com <use>
    for (const svg of q.querySelectorAll('svg')) {
      const use = svg.querySelector('use');
      if (!use || !visivel(svg)) continue;
      const r = rel(svg.getBoundingClientRect());
      itens.push({ tipo: 'svg', href: use.getAttribute('href'), ...r, opacidade: opac(svg), z: camadaZ(svg), ordem: ordem.get(svg), sub: 0 });
    }
    // formas (fundo, borda) e degradês
    for (const el of todos) {
      if (el.tagName === 'IMG' || el.closest('svg') || !visivel(el)) continue;
      const cs = getComputedStyle(el);
      const temFundo = alfa(cs.backgroundColor) > 0;
      const degrade = cs.backgroundImage !== 'none';
      const borda = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
      if (!temFundo && !degrade && !borda) continue;
      const r = rel(el.getBoundingClientRect());
      itens.push({
        tipo: degrade ? 'degrade' : 'forma', classe: el.className, ...r,
        cor: temFundo ? hex(cs.backgroundColor) : null, borda: borda ? { cor: hex(cs.borderTopColor), largura: parseFloat(cs.borderTopWidth) } : null,
        raio: parseFloat(cs.borderTopLeftRadius) || 0, opacidade: opac(el), z: camadaZ(el), ordem: ordem.get(el), sub: 0,
      });
    }
    // texto: cada nó de texto pertence ao primeiro ancestral que não é inline (o bloco)
    const blocos = new Map();
    const andar = document.createTreeWalker(q, NodeFilter.SHOW_TEXT);
    for (let n = andar.nextNode(); n; n = andar.nextNode()) {
      if (!n.textContent.trim() || n.parentElement.closest('svg')) continue;
      let b = n.parentElement;
      while (b !== q && getComputedStyle(b).display === 'inline') b = b.parentElement;
      if (!blocos.has(b)) blocos.set(b, []);
      blocos.get(b).push(n);
    }
    for (const [b, nos] of blocos) {
      const cb = getComputedStyle(b);
      const rb = b.getBoundingClientRect();
      const caixa = {
        x0: rb.left - base.left + parseFloat(cb.borderLeftWidth) + parseFloat(cb.paddingLeft),
        y0: rb.top - base.top + parseFloat(cb.borderTopWidth) + parseFloat(cb.paddingTop),
        x1: rb.right - base.left - parseFloat(cb.borderRightWidth) - parseFloat(cb.paddingRight),
      };
      const estilos = [];
      const chaveEstilo = new Map();
      const caracteres = [];
      for (const n of nos) {
        const cs = getComputedStyle(n.parentElement);
        const tamanho = parseFloat(cs.fontSize);
        const alturaLinha = cs.lineHeight === 'normal' ? linhaNormal(cs) : parseFloat(cs.lineHeight);
        const est = {
          fonte: familia(cs.fontFamily), peso: Number(cs.fontWeight), italico: cs.fontStyle === 'italic', tamanho,
          cor: hex(cs.color), alturaLinhaPx: alturaLinha, espacamentoPx: cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing),
          caixa: cs.textTransform === 'uppercase' ? 'alta' : 'normal',
        };
        const k = JSON.stringify(est);
        if (!chaveEstilo.has(k)) {
          chaveEstilo.set(k, estilos.length);
          estilos.push(est);
        }
        const s = chaveEstilo.get(k);
        const rg = document.createRange();
        const t = n.textContent;
        for (let i = 0; i < t.length; i++) {
          rg.setStart(n, i);
          rg.setEnd(n, i + 1);
          const rr = [...rg.getClientRects()].filter((x) => x.width > 0 || x.height > 0);
          if (!rr.length) continue;
          const r = rr[0];
          caracteres.push({ ch: t[i], x0: r.left - base.left, x1: r.right - base.left, y0: r.top - base.top, y1: r.bottom - base.top, s });
        }
      }
      itens.push({
        tipo: 'texto', alinhamento: cb.textAlign, corBase: hex(cb.color), opacidade: opac(b), caixa, estilos, caracteres,
        z: camadaZ(b), ordem: ordem.get(b) ?? 0, sub: 1,
      });
    }
    const classe = ['papel', 'escuro', 'coralbg', 'vinheta'].find((c) => q.classList.contains(c));
    quadros.push({ id: q.id, largura: base.width, altura: base.height, classe, itens });
  }
  return quadros;
}

// ---------- conversão pro contrato ----------

function lerCatalogo() {
  const cat = JSON.parse(fs.readFileSync(CATALOGO, 'utf8'));
  const porArquivo = new Map();
  const porId = new Map();
  for (const a of cat.assets) {
    porId.set(a.id, a);
    if (a.fonte?.arquivo) porArquivo.set(a.fonte.arquivo.toLowerCase(), a);
  }
  return { porArquivo, porId };
}

const relRaiz = (abs) => path.relative(RAIZ, abs).split(path.sep).join('/').toLowerCase();

let seq = 0;
const novoIdCamada = (quadro) => `cam_${quadro}_${String(++seq).padStart(2, '0')}`;
const comum = (quadro, tipo, nome, x, y, largura, altura, extra = {}) => ({
  // 3 casas: o navegador encaixa a linha de base no pixel, e com 2 casas um quadro descia 1 px
  id: novoIdCamada(quadro), tipo, nome, x: arred(x, 3), y: arred(y, 3), largura: arred(largura, 3), altura: arred(altura, 3),
  rotacao: arred(extra.rotacao ?? 0), opacidade: arred(extra.opacidade ?? 1, 3), travada: false, oculta: false,
});

function camadaImagem(quadro, it, cat, avisos) {
  const abs = fileURLToPath(it.src);
  const a = cat.porArquivo.get(relRaiz(abs)) ?? cat.porId.get(MESMO_ARQUIVO[relRaiz(abs)]);
  if (!a) {
    avisos.push(`${quadro}: imagem sem asset no banco: ${relRaiz(abs)}`);
    return null;
  }
  // SVG é vetor e não tem recorte: a caixa é a do elemento
  if (a.tipo === 'image/svg+xml') {
    return {
      ...comum(quadro, 'imagem', a.nome, it.cx - it.w / 2, it.cy - it.h / 2, it.w, it.h, { rotacao: it.rot, opacidade: it.opacidade }),
      assetId: a.id, espelhar: false, raio: arred(it.raio), sombra: it.sombra,
    };
  }
  // a imagem original ocupava w x h com o arquivo inteiro; o asset é o recorte (fonte.x, fonte.y) reduzido por escala
  const s = it.w / it.natural[0];
  const { x: fx, y: fy, escala } = a.fonte;
  const w2 = (a.largura / escala) * s;
  const h2 = (a.altura / escala) * s;
  // centro novo, no referencial da imagem sem girar, e girado em volta do centro antigo
  const dx = fx * s + w2 / 2 - it.w / 2;
  const dy = fy * s + h2 / 2 - it.h / 2;
  const t = (it.rot * Math.PI) / 180;
  const cx = it.cx + dx * Math.cos(t) - dy * Math.sin(t);
  const cy = it.cy + dx * Math.sin(t) + dy * Math.cos(t);
  return {
    ...comum(quadro, 'imagem', a.nome, cx - w2 / 2, cy - h2 / 2, w2, h2, { rotacao: it.rot, opacidade: it.opacidade }),
    assetId: a.id, espelhar: false, raio: arred(it.raio), sombra: it.sombra,
  };
}

function camadaSvg(quadro, it, cat, avisos) {
  const id = SIMBOLOS[it.href];
  if (!id) {
    avisos.push(`${quadro}: SVG sem asset: ${it.href}`);
    return null;
  }
  const a = cat.porId.get(id);
  return { ...comum(quadro, 'imagem', a.nome, it.x0, it.y0, it.x1 - it.x0, it.y1 - it.y0, { opacidade: it.opacidade }), assetId: id, espelhar: false, raio: 0, sombra: null };
}

function camadaDegrade(quadro, it, cat, avisos) {
  const chave = String(it.classe).split(/\s+/).find((c) => DEGRADES[c]);
  if (!chave) {
    avisos.push(`${quadro}: degradê sem asset: .${it.classe}`);
    return null;
  }
  const { assetId, folga } = DEGRADES[chave];
  const a = cat.porId.get(assetId);
  return {
    ...comum(quadro, 'imagem', a.nome, it.x0 - folga, it.y0 - folga, it.x1 - it.x0 + 2 * folga, it.y1 - it.y0 + 2 * folga, { opacidade: it.opacidade }),
    assetId, espelhar: false, raio: 0, sombra: null,
  };
}

function camadaForma(quadro, it) {
  const w = it.x1 - it.x0;
  const h = it.y1 - it.y0;
  const pilula = it.raio >= Math.min(w, h) / 2;
  const nome = String(it.classe).includes('valor') ? 'Cartão' : String(it.classe).includes('foto') ? 'Caixa da foto' : pilula ? 'Pílula' : 'Retângulo';
  return {
    ...comum(quadro, 'forma', nome, it.x0, it.y0, w, h, { opacidade: it.opacidade }),
    forma: 'retangulo', cor: it.cor ?? '#FFFFFF00', borda: it.borda, raio: arred(Math.min(it.raio, Math.min(w, h) / 2)),
  };
}

// linhas do bloco: os caracteres agrupados pela altura, sem os espaços das pontas
function linhasDoBloco(it) {
  const linhas = [];
  for (const c of it.caracteres) {
    const est = it.estilos[c.s];
    const ultima = linhas[linhas.length - 1];
    if (!ultima || c.y0 > ultima.y0 + est.tamanho * 0.5) linhas.push({ y0: c.y0, y1: c.y1, cs: [c] });
    else ultima.cs.push(c);
  }
  for (const l of linhas) {
    while (l.cs.length && !l.cs[0].ch.trim()) l.cs.shift();
    while (l.cs.length && !l.cs[l.cs.length - 1].ch.trim()) l.cs.pop();
  }
  return linhas.filter((l) => l.cs.length);
}

// o estilo da fonte sem a cor (o que tem de ser igual pra caber numa camada só)
const chaveFonte = (e) => `${e.fonte}|${e.peso}|${e.italico}|${e.tamanho}|${e.alturaLinhaPx}|${e.espacamentoPx}|${e.caixa}`;

// texto da linha com *destaque*: corBase normal, a outra cor entre asteriscos (espaços repetidos viram um)
function textoComDestaque(cs, estilos, corBase) {
  let s = '';
  let dentro = false;
  let espaco = false;
  for (const c of cs) {
    if (!c.ch.trim()) {
      espaco = true;
      continue;
    }
    const destaque = estilos[c.s].cor !== corBase;
    if (destaque !== dentro) {
      // o espaço entre um trecho e outro fica fora do destaque; entre duas palavras destacadas, dentro
      if (dentro) s += '*';
      if (espaco) s += ' ';
      if (destaque) s += '*';
      dentro = destaque;
    } else if (espaco) s += ' ';
    espaco = false;
    s += c.ch;
  }
  if (dentro) s += '*';
  return s;
}

// o nome da camada na lista do editor: o texto numa linha, cortado na palavra (até 40 letras)
function nomeDoTexto(texto) {
  const s = texto.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  if (s.length <= 40) return s;
  const corte = s.slice(0, 41).lastIndexOf(' ');
  return s.slice(0, corte > 15 ? corte : 40);
}

function camadasDeTexto(quadro, it, destaqueQuadro, avisos) {
  const linhas = linhasDoBloco(it);
  if (!linhas.length) return [];
  const est0 = it.estilos[linhas[0].cs[0].s];
  const cores = new Set(it.caracteres.filter((c) => c.ch.trim()).map((c) => it.estilos[c.s].cor));
  const corBase = cores.has(it.corBase) ? it.corBase : est0.cor;
  const outras = [...cores].filter((c) => c !== corBase);
  if (outras.length > 1) avisos.push(`${quadro}: texto com mais de uma cor de destaque (${outras.join(', ')}): vira camada por trecho`);
  const corDestaque = outras.length === 1 ? outras[0] : destaqueQuadro;
  const alinh = { center: 'centro', right: 'direita', end: 'direita' }[it.alinhamento] ?? 'esquerda';
  // pedaços de linha com a mesma fonte (o peso diferente no meio da linha separa)
  const pedacos = linhas.map((l) => {
    const ps = [];
    for (const c of l.cs) {
      const k = chaveFonte(it.estilos[c.s]);
      const p = ps[ps.length - 1];
      if (p && p.k === k) p.cs.push(c);
      else ps.push({ k, cs: [c] });
    }
    for (const p of ps) {
      while (p.cs.length && !p.cs[p.cs.length - 1].ch.trim()) p.cs.pop();
      while (p.cs.length && !p.cs[0].ch.trim()) p.cs.shift();
    }
    return { linha: l, ps: ps.filter((p) => p.cs.length) };
  });
  const grupos = [];
  for (const { linha, ps } of pedacos) {
    if (ps.length !== 1 || (outras.length > 1)) {
      // linha com fontes diferentes (ou cores demais): uma camada por pedaço, lado a lado
      ps.forEach((p, i) => grupos.push({ linhas: [{ y0: linha.y0, y1: linha.y1, cs: p.cs }], proximoX: ps[i + 1]?.cs[0].x0 ?? null, sozinho: true }));
      continue;
    }
    const g = grupos[grupos.length - 1];
    const l = { y0: linha.y0, y1: linha.y1, cs: ps[0].cs };
    const e = it.estilos[l.cs[0].s];
    if (g && !g.sozinho && g.k === ps[0].k) {
      const ant = g.linhas[g.linhas.length - 1];
      const passo = l.y0 - ant.y0;
      const ancora = (ln) => (alinh === 'esquerda' ? ln.cs[0].x0 : alinh === 'direita' ? ln.cs[ln.cs.length - 1].x1 : (ln.cs[0].x0 + ln.cs[ln.cs.length - 1].x1) / 2);
      // a linha entra no grupo se o passo é a altura de linha e a âncora do alinhamento bate
      if (Math.abs(passo - e.alturaLinhaPx) < 1.5 && Math.abs(ancora(l) - ancora(g.linhas[0])) < 2.5) {
        g.linhas.push(l);
        continue;
      }
    }
    grupos.push({ k: ps[0].k, linhas: [l], proximoX: null, sozinho: false });
  }
  const camadas = [];
  for (const g of grupos) {
    const e = it.estilos[g.linhas[0].cs[0].s];
    const L = e.alturaLinhaPx;
    const C = g.linhas[0].y1 - g.linhas[0].y0; // altura do conteúdo da fonte (ascendente + descendente)
    // topo da caixa da linha: a distância entre o topo da 1ª linha do bloco (o topo do conteúdo dele) e a letra é a
    // medida de verdade do navegador (com o arredondamento das métricas da fonte); só sem ela vale a conta do CSS
    // (texto centrado num flex, como o da pílula, não começa no topo do bloco: lá vale a conta)
    const e0 = it.estilos[linhas[0].cs[0].s];
    const medida = linhas[0].y0 - it.caixa.y0;
    const confiavel = chaveFonte(e0) === chaveFonte(e) && Math.abs(medida - (L - (linhas[0].y1 - linhas[0].y0)) / 2) < 2;
    const y = confiavel ? g.linhas[0].y0 - medida : g.linhas[0].y0 - (L - C) / 2;
    const x0s = g.linhas.map((l) => l.cs[0].x0);
    const x1s = g.linhas.map((l) => l.cs[l.cs.length - 1].x1);
    const maior = Math.max(...g.linhas.map((l, i) => x1s[i] - x0s[i]));
    const folga = Math.max(6, maior * 0.02);
    let x;
    let largura;
    if (alinh === 'esquerda') {
      x = Math.min(...x0s);
      largura = Math.max(it.caixa.x1 - x, maior + folga);
      // não passa da caixa do bloco nem encosta no pedaço seguinte da mesma linha
      if (g.proximoX != null) largura = Math.min(largura, g.proximoX - x - 1);
      else if (it.caixa.x1 - x >= maior + 1) largura = Math.min(largura, Math.max(it.caixa.x1 - x, maior + 1));
    } else if (alinh === 'centro') {
      const c = (Math.min(...x0s) + Math.max(...x1s)) / 2;
      largura = Math.max(it.caixa.x1 - it.caixa.x0, maior + folga);
      x = c - largura / 2;
    } else {
      const d = Math.max(...x1s);
      largura = Math.max(d - it.caixa.x0, maior + folga);
      x = d - largura;
    }
    const corLinha = g.sozinho ? it.estilos[g.linhas[0].cs[0].s].cor : corBase;
    const texto = g.linhas.map((l) => (g.sozinho ? l.cs.map((c) => c.ch).join('').replace(/\s+/g, ' ') : textoComDestaque(l.cs, it.estilos, corBase))).join('\n');
    if (TRACOS.test(texto)) avisos.push(`${quadro}: travessão no texto "${texto}"`);
    camadas.push({
      ...comum(quadro, 'texto', nomeDoTexto(texto), x, y, largura, g.linhas.length * L, { opacidade: it.opacidade }),
      texto, fonte: e.fonte === 'DM Serif Display' ? 'DM Serif Display' : 'Sora', peso: e.peso, italico: e.italico, tamanho: arred(e.tamanho),
      cor: corLinha, corDestaque: g.sozinho ? destaqueQuadro : corDestaque, alinhamento: alinh, alturaLinha: arred(L / e.tamanho, 4),
      espacamentoLetra: arred(e.espacamentoPx / e.tamanho, 4), caixa: e.caixa, fundo: null,
    });
  }
  return camadas;
}

// ---------- ajustes aprovados ----------
// 22/10 (achado da revisão): os Destaques aprovados abriam no editor com aviso (quem abre acha que tem erro numa peça
// já aprovada). Decidido na revisão do estúdio, medido no editor (a tinta das linhas e as caixas):
//  - q1: o Léo que sai pela base de propósito ganha a mesma exceção do busto de corte reto, marcada no USO dele (o nome
//    da camada leva "corte reto"; o asset de corpo inteiro continua sem a tag) e os brilhos sobem 170 px, pra cima
//    da cabeça dele: a caixa deles (girada) termina em 827,8 e a do Léo começa em 836,8
//  - q5: o grifo entra na área segura (a base é 1560): ele e o texto que ele grifa sobem 34 px juntos (o grifo sozinho
//    atravessaria a palavra "costas.") e o grifo começa na margem (x 96), com a ponta da direita onde estava
//  - q6: "O combinado é simples:" em branco a 100% (3,2:1 no coral; a 92% dava 2,9:1, abaixo do mínimo de 3) e a
//    maleta ao lado de "negócio." na altura da linha (108 px, o centro 2,7 px acima): a de 116 passava da faixa entre a
//    caixa de "Você cuida do" (até 484,2) e a tinta de "A gente cuida da" (de 594,8)
const AJUSTES = {
  q1: (cs) => {
    const leo = cs.find((c) => c.assetId === 'ast_base_leo-apontando-pra-cima');
    const brilho = cs.find((c) => c.assetId === 'ast_base_icone-brilho');
    if (!leo || !brilho) return false;
    if (!/corte reto/.test(leo.nome)) leo.nome = `${leo.nome} (corte reto)`;
    brilho.y = arred(brilho.y - 170, 3);
    return true;
  },
  q5: (cs) => {
    const grifo = cs.find((c) => c.assetId === 'ast_base_grifo-coral');
    const texto = cs.find((c) => c.tipo === 'texto' && /costas/.test(c.texto));
    if (!grifo || !texto) return false;
    const fim = grifo.x + grifo.largura;
    texto.y = arred(texto.y - 34, 3);
    grifo.x = 96;
    grifo.largura = arred(fim - 96, 3);
    grifo.y = arred(grifo.y - 34, 3);
    return true;
  },
  q6: (cs) => {
    const frase = cs.find((c) => c.tipo === 'texto' && /^O combinado/.test(c.texto));
    const maleta = cs.find((c) => c.assetId === 'ast_base_icone-maleta');
    if (!frase || !maleta) return false;
    frase.opacidade = 1;
    const cx = maleta.x + maleta.largura / 2;
    const cy = maleta.y + maleta.altura / 2 - 2.676;
    maleta.largura = 108;
    maleta.altura = 108;
    maleta.x = arred(cx - 54, 3);
    maleta.y = arred(cy - 54, 3);
    return true;
  },
};
function ajustarAprovados(qid, doc, avisos) {
  const f = AJUSTES[qid];
  if (f && !f(doc.paginas[0].camadas)) avisos.push(`${qid}: o ajuste aprovado não achou as camadas (confira o HTML de origem)`);
  return doc;
}

function paraDocumento(q, cat, avisos) {
  const [, nn, , titulo, papel] = QUADROS.find((x) => x[0] === q.id);
  const fundo = FUNDOS[q.classe];
  if (!fundo) throw new Error(`${q.id}: fundo desconhecido (${q.classe})`);
  seq = 0;
  const ordenados = [...q.itens].sort((a, b) => a.z - b.z || a.ordem - b.ordem || a.sub - b.sub);
  const camadas = [];
  for (const it of ordenados) {
    if (it.tipo === 'imagem') camadas.push(camadaImagem(q.id, it, cat, avisos));
    else if (it.tipo === 'svg') camadas.push(camadaSvg(q.id, it, cat, avisos));
    else if (it.tipo === 'degrade') camadas.push(camadaDegrade(q.id, it, cat, avisos));
    else if (it.tipo === 'forma') camadas.push(camadaForma(q.id, it));
    else if (it.tipo === 'texto') camadas.push(...camadasDeTexto(q.id, it, fundo.destaque, avisos));
  }
  return ajustarAprovados(q.id, {
    titulo: `Comece por aqui ${nn} · ${titulo}`,
    formato: 'stories',
    largura: Math.round(q.largura),
    altura: Math.round(q.altura),
    paginas: [{
      id: `pag_${q.id}`,
      fundo: { tipo: 'imagem', cor: fundo.cor, cor2: fundo.cor2, angulo: fundo.angulo, assetId: fundo.assetId, ajuste: 'cobrir' },
      camadas: camadas.filter(Boolean),
    }],
    pecaId: null,
    origem: 'importado',
    estrategia: ESTRATEGIA(papel),
    versao: 1,
  }, avisos);
}

// ---------- conferência: desenha o documento e compara com o PNG final ----------

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// o desenho de referência do contrato (o que o editor precisa fazer igual), em HTML e CSS
function htmlDoDocumento(doc, cat) {
  const pg = doc.paginas[0];
  const url = (id) => `/asset/${encodeURIComponent(cat.porId.get(id).arquivo)}`;
  const f = pg.fundo;
  const fundoCss = f.tipo === 'imagem' && f.assetId
    ? `background:${f.cor} url('${url(f.assetId)}') center/${f.ajuste === 'conter' ? 'contain' : 'cover'} no-repeat;`
    : f.tipo === 'gradiente' ? `background:linear-gradient(${f.angulo}deg, ${f.cor}, ${f.cor2});` : `background:${f.cor};`;
  const partes = [];
  for (const c of pg.camadas) {
    if (c.oculta) continue;
    const caixa = `position:absolute;left:${c.x}px;top:${c.y}px;width:${c.largura}px;height:${c.altura}px;opacity:${c.opacidade};transform:rotate(${c.rotacao}deg);`;
    if (c.tipo === 'texto') {
      const corpo = esc(c.texto).replace(/\*([^*]+)\*/g, `<span style="color:${c.corDestaque}">$1</span>`);
      partes.push(`<div style="${caixa}font-family:'${c.fonte}';font-weight:${c.peso};font-style:${c.italico ? 'italic' : 'normal'};font-size:${c.tamanho}px;line-height:${c.alturaLinha};letter-spacing:${c.espacamentoLetra}em;color:${c.cor};text-align:${{ esquerda: 'left', centro: 'center', direita: 'right' }[c.alinhamento]};text-transform:${c.caixa === 'alta' ? 'uppercase' : 'none'};white-space:pre-wrap;">${corpo}</div>`);
    } else if (c.tipo === 'imagem') {
      const s = c.sombra ? `filter:drop-shadow(${c.sombra.x}px ${c.sombra.y}px ${c.sombra.desfoque}px ${c.sombra.cor});` : '';
      const espelho = c.espelhar ? ' scaleX(-1)' : '';
      partes.push(`<img src="${url(c.assetId)}" style="${caixa}transform:rotate(${c.rotacao}deg)${espelho};border-radius:${c.raio}px;${s}display:block" alt="">`);
    } else if (c.tipo === 'forma') {
      const raio = c.forma === 'circulo' ? '50%' : `${c.raio}px`;
      const borda = c.borda ? `border:${c.borda.largura}px solid ${c.borda.cor};` : '';
      partes.push(`<div style="${caixa}box-sizing:border-box;background:${c.cor};${borda}border-radius:${raio};"></div>`);
    }
  }
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/public/css/fontes.css">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#888}#pagina{position:relative;overflow:hidden;width:${doc.largura}px;height:${doc.altura}px;${fundoCss}}</style>
</head><body><div id="pagina">${partes.join('\n')}</div></body></html>`;
}

// servidor de arquivos só pra conferência (porta livre no 127.0.0.1): assets, fontes, PNG finais e as provas
function servidorDeConferencia(pastaProvas) {
  const rotas = [
    ['/asset/', path.join(BASE, 'assets')],
    ['/public/', path.join(APP, 'public')],
    ['/final/', FINAL],
    ['/provas/', pastaProvas],
  ];
  const tipos = { '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.woff2': 'font/woff2', '.html': 'text/html; charset=utf-8', '.json': 'application/json' };
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const r = rotas.find(([pre]) => p.startsWith(pre));
    if (!r) return res.writeHead(404).end();
    const alvo = path.resolve(r[1], '.' + p.slice(r[0].length - 1));
    if (!alvo.startsWith(path.resolve(r[1]) + path.sep)) return res.writeHead(403).end();
    fs.readFile(alvo, (err, buf) => {
      if (err) return res.writeHead(404).end();
      res.writeHead(200, { 'content-type': tipos[path.extname(alvo).toLowerCase()] ?? 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

// na página: diferença por pixel entre o PNG final e o desenho do documento
async function comparar([final, desenho]) {
  const carregar = (src) => new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = src; });
  const [a, b] = await Promise.all([carregar(final), carregar(desenho)]);
  const w = a.width;
  const h = a.height;
  const ctx = (img) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x; };
  const da = ctx(a).getImageData(0, 0, w, h).data;
  const db = ctx(b).getImageData(0, 0, w, h).data;
  const mapa = document.createElement('canvas');
  mapa.width = w;
  mapa.height = h;
  const mx = mapa.getContext('2d');
  const out = mx.createImageData(w, h);
  let soma = 0;
  let acima = 0;
  const faixa = new Array(Math.ceil(h / 40)).fill(0);
  for (let i = 0; i < da.length; i += 4) {
    const d = (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])) / 3;
    soma += d;
    if (d > 24) {
      acima++;
      faixa[Math.floor(i / 4 / w / 40)]++;
    }
    const v = Math.min(255, d * 4);
    out.data[i] = 255;
    out.data[i + 1] = 255 - v;
    out.data[i + 2] = 255 - v;
    out.data[i + 3] = 255;
  }
  mx.putImageData(out, 0, 0);
  return { media: soma / (w * h), acima24: acima / (w * h), faixas: faixa.map((n, i) => [i * 40, n]).filter(([, n]) => n > w * 40 * 0.01), mapa: mapa.toDataURL('image/png') };
}

async function conferir(browser, docs, cat, pastaProvas) {
  fs.mkdirSync(pastaProvas, { recursive: true });
  const srv = await servidorDeConferencia(pastaProvas);
  const raiz = `http://127.0.0.1:${srv.address().port}`;
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const resultado = [];
  try {
    for (const [q, nn, nomeFinal] of QUADROS) {
      const doc = docs.get(q);
      fs.writeFileSync(path.join(pastaProvas, `${nn}-documento.html`), htmlDoDocumento(doc, cat));
      await page.goto(`${raiz}/provas/${nn}-documento.html`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const ok = await page.evaluate(() => document.fonts.check("800 100px 'Sora'") && [...document.images].every((i) => i.complete && i.naturalWidth > 0));
      if (!ok) throw new Error(`${q}: fonte ou imagem não carregou na página de conferência`);
      await page.locator('#pagina').screenshot({ path: path.join(pastaProvas, `${nn}-desenho.png`) });
      const r = await page.evaluate(comparar, [`${raiz}/final/${encodeURIComponent(nomeFinal)}.png`, `${raiz}/provas/${nn}-desenho.png`]);
      fs.writeFileSync(path.join(pastaProvas, `${nn}-diferenca.png`), Buffer.from(r.mapa.split(',')[1], 'base64'));
      resultado.push({ quadro: q, nn, media: arred(r.media, 2), acima24: arred(r.acima24 * 100, 2), faixas: r.faixas });
    }
  } finally {
    await page.close();
    srv.close();
  }
  return resultado;
}

// ---------- principal ----------

// 22/10 (achado da revisão): o ajuste dos Destaques aprovados serve também pra semente que já está no repo (sem abrir
// o Edge): require('./importar-destaque.cjs').ajustarAprovados
module.exports = { ajustarAprovados, AJUSTES };
if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  const iConf = args.indexOf('--conferir');
  const pastaProvas = iConf >= 0 ? path.resolve(args[iConf + 1] || path.join(os.tmpdir(), 'importar-destaque-provas')) : null;
  const cat = lerCatalogo();
  const browser = await chromium.launch({ channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    await page.goto('file:///' + HTML.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))));
    if (!(await page.evaluate(() => document.fonts.check('800 100px Sora')))) throw new Error('Sora não carregou no HTML de origem');
    const quadros = await page.evaluate(medir);
    await page.close();
    const avisos = [];
    const docs = new Map();
    fs.mkdirSync(SAIDA, { recursive: true });
    for (const q of quadros) {
      const def = QUADROS.find((x) => x[0] === q.id);
      if (!def) {
        avisos.push(`section #${q.id} fora da lista de quadros: ignorada`);
        continue;
      }
      const doc = paraDocumento(q, cat, avisos);
      const texto = JSON.stringify(doc, null, 2) + '\n';
      if (TRACOS.test(texto)) throw new Error(`${q.id}: travessão no documento`);
      fs.writeFileSync(path.join(SAIDA, `comece-por-aqui-${def[1]}.json`), texto);
      docs.set(q.id, doc);
      const n = doc.paginas[0].camadas;
      console.log(`ok comece-por-aqui-${def[1]}.json: ${n.length} camadas (${['texto', 'imagem', 'forma'].map((t) => `${n.filter((c) => c.tipo === t).length} ${t}`).join(', ')})`);
    }
    for (const a of avisos) console.log('AVISO', a);
    if (docs.size !== QUADROS.length) throw new Error(`esperava ${QUADROS.length} quadros, saíram ${docs.size}`);
    if (pastaProvas) {
      const r = await conferir(browser, docs, cat, pastaProvas);
      console.log('\nconferência contra o PNG final (média da diferença 0 a 255; % de pixels com diferença acima de 24):');
      for (const x of r) {
        console.log(`  ${x.nn} ${x.quadro.padEnd(4)} média ${String(x.media).padStart(5)}  acima de 24: ${String(x.acima24).padStart(5)}%${x.faixas.length ? `  faixas (y): ${x.faixas.map(([y, n]) => `${y}:${n}`).join(' ')}` : ''}`);
      }
      console.log(`provas em ${pastaProvas}`);
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
