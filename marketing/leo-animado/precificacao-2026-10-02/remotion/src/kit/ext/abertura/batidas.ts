// Extensão "abertura" do kit de motion: as batidas 2D da família da abertura e os metadados das camadas
// (dono K10; contrato: KIT/DESENHO.md, seções 4.3, 4.10 e 5, "Família 2D da abertura").
// Origem dos números: RM/src/abertura/Abertura.tsx (linhas 53 a 175, a peça "Abertura do mês" de 01/10).
// Origem dos sons: AB/mix_abertura.py (os mesmos instantes relativos, perfil v2).
//
// Puro: sem React, sem DOM, sem Remotion, sem SplitText e sem DrawSVGPlugin. Cada camada declara o texto e as
// linhas na cena (nada é medido no DOM); o estado vive em st.canais[id] (por palavra, por linha ou por peça) e o
// render.tsx só lê. Sem efeito colateral no import: nenhuma ease nova, nada de gsap.defaults, nenhum gancho global.
//
// Canais (o que cada camada lê em st.canais[id]):
// - texto:      vis (0 some, 1 aparece), w<i> (entrada da palavra i: 0 embaixo da máscara, 1 no lugar),
//               l<j> (saída da linha j: 0 no lugar, 1 subiu e sumiu com desfoque)
// - imagem:     op, x, y (px), s, rot (graus), sx, sy (achatamento)
// - selo:       os da imagem, mais sombraOp, sombraS, anel (0 a 1) e anelVis
// - marcaTexto: p (traço desenhado de 0 a 1)
// - pecas:      vis, v (voo de 0 a 1), f (sumiço de 0 a 1), cx, cy (centro em px)
// - cta:        op, x, y (px), s
// - palco:      st.canais.palco = {s, x, y}: o "palco" da abertura (soco e tremida), lido pelas camadas com
//               palco ligado e pelo objeto calendario-clay
// - objeto calendario-clay (st.canais[id do objeto]): virada, pagina, marca, pulso, sx, sy, giro
import type { Batida, CamadaProps, Ctx, Estado, ObjetoProps, Tempo } from "../../nucleo/tipos";
import { ancoras, vars } from "../../batidas/ajudantes";

type Canal = Record<string, number>;
type Vals = Record<string, number>;
type Mov = { dur: number; ease: string };

/** id do canal do palco (reservado: nenhuma camada pode se chamar assim) */
export const PALCO = "palco";

/** tipos de camada desta extensão */
export const TIPOS_CAMADA = ["texto", "imagem", "selo", "marcaTexto", "pecas", "cta"];

/** tipo de objeto desta extensão */
export const TIPO_CALENDARIO = "calendario-clay";

const nome = (x: unknown) => JSON.stringify(x);

/** os padrões que faltam no canal (o que a cena declarou em `estado` fica) */
export function garante(c: Canal, padroes: Vals): Canal {
  for (const k of Object.keys(padroes)) if (typeof c[k] !== "number") c[k] = padroes[k];
  return c;
}

/** canal pelo id (cria vazio quando não existe) */
export function canalDe(st: Estado, id: string): Canal {
  if (!st.canais[id]) st.canais[id] = {};
  return st.canais[id];
}

/** a camada declarada na cena, conferindo o tipo */
export function defCamada(ctx: Pick<Ctx, "props">, id: string, tipos: string[]): CamadaProps {
  const lista = ctx.props.camadas || [];
  const c = lista.filter((x) => x && x.id === id)[0];
  if (!c) throw new Error(`camada citada não existe: ${nome(id)} (a cena tem: ${lista.map((x) => x.id).join(", ") || "nenhuma"})`);
  if (tipos.indexOf(c.tipo) < 0) throw new Error(`a camada ${nome(id)} é do tipo ${nome(c.tipo)}; esta batida aceita: ${tipos.join(", ")}`);
  return c;
}

// ---------- texto: linhas explícitas, palavra-chave entre asteriscos ----------

export type PalavraTexto = { t: string; destaque: boolean };

/** linhas da camada texto: cada linha é um texto com as palavras separadas por espaço; "*palavra*" (ou
 *  "*duas palavras*") sai na cor de destaque. Nada de quebra automática: a linha é a que a cena escreveu. */
export function linhasDoTexto(linhas: unknown): PalavraTexto[][] {
  if (!Array.isArray(linhas)) return [];
  let aberto = false;
  return linhas.map((ln) => {
    const r: PalavraTexto[] = [];
    for (const tok of String(ln).split(/\s+/)) {
      if (!tok) continue;
      let s = tok;
      let d = aberto;
      if (s.charAt(0) === "*") {
        s = s.slice(1);
        d = true;
        aberto = true;
      }
      if (s.length && s.charAt(s.length - 1) === "*") {
        s = s.slice(0, -1);
        d = true;
        aberto = false;
      }
      if (s) r.push({ t: s, destaque: d });
    }
    return r;
  });
}

/** quantas palavras e linhas a camada texto tem */
export function contaTexto(c: CamadaProps): { palavras: number; linhas: number } {
  const ls = linhasDoTexto(c.linhas);
  let n = 0;
  for (const l of ls) n += l.length;
  return { palavras: n, linhas: ls.length };
}

// ---------- calendário clay (objeto) ----------

/** canais do calendário e os valores de partida: página do mês atual na frente, sem marca */
export const CANAIS_CALENDARIO: Vals = { virada: 0, pagina: 1, marca: 0, pulso: 0, sx: 1, sy: 1, giro: 0 };

/** valores de partida do calendário: os padrões, trocados pelos de objeto.conteudo.estado */
export function estadoInicialCalendario(o: Pick<ObjetoProps, "conteudo"> | undefined): Vals {
  const r: Vals = { ...CANAIS_CALENDARIO };
  const cont = o && o.conteudo && typeof o.conteudo === "object" ? (o.conteudo as Record<string, unknown>) : {};
  const est = cont.estado;
  if (est && typeof est === "object") {
    const e = est as Record<string, unknown>;
    for (const k of Object.keys(r)) if (typeof e[k] === "number") r[k] = e[k] as number;
  }
  return r;
}

function calendario(st: Estado, ctx: Ctx, id: string): Canal {
  const o = (ctx.props.objetos || []).filter((x) => x.id === id)[0];
  if (!o) throw new Error(`objeto citado não existe: ${nome(id)} (a cena tem: ${(ctx.props.objetos || []).map((x) => x.id).join(", ") || "nenhum"})`);
  if (o.tipo !== TIPO_CALENDARIO) throw new Error(`o objeto ${nome(id)} é do tipo ${nome(o.tipo)}; esta batida pede um ${TIPO_CALENDARIO}`);
  return garante(canalDe(st, id), estadoInicialCalendario(o));
}

// ---------- partes comuns: estouro e soco ----------

export type ParamsEstouroInterno = { camada: string; desloc: number; x?: number | null; y?: number | null };

/** o burst() da abertura: as peças aparecem juntas, voam em leque e somem a partir de +0,32 s */
export function animaEstouro(
  tl: gsap.core.Timeline, st: Estado, ctx: Ctx, camada: string, t0: number,
  o: { x?: number | null; y?: number | null; voo: Mov; some: Mov & { desloc: number } },
): void {
  const def = defCamada(ctx, camada, ["pecas"]);
  const c = garante(canalDe(st, camada), { vis: 0, v: 0, f: 0 });
  const x = typeof o.x === "number" ? o.x : typeof def.x === "number" ? (def.x as number) : 540;
  const y = typeof o.y === "number" ? o.y : typeof def.y === "number" ? (def.y as number) : 960;
  garante(c, { cx: x, cy: y });
  tl.set(c, { vis: 1, v: 0, f: 0, cx: x, cy: y }, Math.max(0, t0 - 0.001));
  tl.to(c, vars({ v: 1 }, o.voo.dur, o.voo.ease), t0);
  tl.to(c, vars({ f: 1 }, o.some.dur, o.some.ease), ctx.t({ desloc: o.some.desloc }, t0));
}

/** o punch() da abertura: o palco cresce 1 + amt e volta com mola */
export function animaSoco(tl: gsap.core.Timeline, st: Estado, ctx: Ctx, palco: string, t0: number, amt: number, o: { sobe: Mov; volta: Mov & { desloc: number } }): void {
  const pc = garante(canalDe(st, palco || PALCO), { s: 1, x: 0, y: 0 });
  tl.to(pc, vars({ s: 1 + amt }, o.sobe.dur, o.sobe.ease), t0);
  tl.to(pc, vars({ s: 1 }, o.volta.dur, o.volta.ease), ctx.t({ desloc: o.volta.desloc }, t0));
}

const VOO_PADRAO = { voo: { dur: 0.55, ease: "power3.out" }, some: { desloc: 0.32, dur: 0.25, ease: "power1.in" } };
const SOCO_PADRAO = { sobe: { dur: 0.07, ease: "power2.out" }, volta: { desloc: 0.07, dur: 0.45, ease: "elastic.out(1, 0.45)" } };

type EstouroOpcional = null | { camada: string; desloc: number; x?: number | null; y?: number | null };
type SocoOpcional = null | { palco: string; amt: number };

function estouroOpcional(tl: gsap.core.Timeline, st: Estado, ctx: Ctx, e: EstouroOpcional, t0: number) {
  if (!e || !e.camada) return;
  animaEstouro(tl, st, ctx, e.camada, ctx.t({ desloc: e.desloc || 0 }, t0), { x: e.x, y: e.y, ...VOO_PADRAO });
}

function socoOpcional(tl: gsap.core.Timeline, st: Estado, ctx: Ctx, s: SocoOpcional, t0: number) {
  if (!s) return;
  animaSoco(tl, st, ctx, s.palco || PALCO, t0, s.amt, SOCO_PADRAO);
}

// ---------- 1. texto-entra ----------

export type ParamsTextoEntra = { camada: string; t: Tempo; dur: number; ease: string; intervalo: number; yPercent: number; rotacao: number; aparece: number };

export const textoEntra: Batida<ParamsTextoEntra> = {
  id: "texto-entra",
  camada: "2d",
  descricao: "As palavras sobem da máscara da linha (yPercent 115, rotate 4, 0,42 s, lgEntra, intervalo de 0,055 s), como o textIn da abertura, sem SplitText.",
  ancoras: ["inicio"],
  padrao: { camada: "texto", t: 3.1, dur: 0.42, ease: "lgEntra", intervalo: 0.055, yPercent: 115, rotacao: 4, aparece: -0.01 },
  sons: { v2: [] },
  aplica(tl, st, p, ctx) {
    const def = defCamada(ctx, p.camada, ["texto"]);
    const { palavras, linhas } = contaTexto(def);
    if (!palavras) throw new Error(`a camada ${nome(p.camada)} não tem palavras (declare "linhas")`);
    const c = canalDe(st, p.camada);
    const padroes: Vals = { vis: 0 };
    for (let i = 0; i < palavras; i++) padroes["w" + i] = 1;
    for (let j = 0; j < linhas; j++) padroes["l" + j] = 0;
    garante(c, padroes);
    // o deslocamento e o giro de partida ficam na camada (o render lê), pra mesma batida servir a outro texto
    c.entraY = p.yPercent;
    c.entraRot = p.rotacao;
    const t0 = ctx.t(p.t);
    tl.set(c, { vis: 1 }, Math.max(0, t0 + p.aparece));
    for (let i = 0; i < palavras; i++) {
      const k = "w" + i;
      tl.fromTo(c, { [k]: 0 }, vars({ [k]: 1 }, p.dur, p.ease), t0 + i * p.intervalo);
    }
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// ---------- 2. texto-sai ----------

export type ParamsTextoSai = { camada: string; t: Tempo; dur: number; ease: string; intervalo: number };

export const textoSai: Batida<ParamsTextoSai> = {
  id: "texto-sai",
  camada: "2d",
  descricao: "As linhas sobem e somem com desfoque (yPercent -60, blur 6, 0,24 s, lgSai, intervalo de 0,03 s), como o textOut da abertura.",
  ancoras: ["inicio"],
  padrao: { camada: "texto", t: 2.72, dur: 0.24, ease: "lgSai", intervalo: 0.03 },
  sons: { v2: [{ som: "sint-s_whoosh", em: "inicio", desloc: -0.04, ganhoDb: -32, args: [0.3, 500, 6000] }] },
  aplica(tl, st, p, ctx) {
    const def = defCamada(ctx, p.camada, ["texto"]);
    const { linhas } = contaTexto(def);
    const c = canalDe(st, p.camada);
    const padroes: Vals = {};
    for (let j = 0; j < linhas; j++) padroes["l" + j] = 0;
    garante(c, padroes);
    const t0 = ctx.t(p.t);
    for (let j = 0; j < linhas; j++) tl.to(c, vars({ ["l" + j]: 1 }, p.dur, p.ease), t0 + j * p.intervalo);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// ---------- 3. soco ----------

export type ParamsSoco = { palco: string; t: Tempo; amt: number; sobe: Mov; volta: Mov & { desloc: number } };

export const soco: Batida<ParamsSoco> = {
  id: "soco",
  camada: "2d",
  descricao: "O palco cresce 1 + amt em 0,07 s e volta com elastic.out(1, 0.45) em 0,45 s (o punch da abertura). Mexe nas camadas com palco ligado e no calendário clay.",
  ancoras: ["inicio"],
  padrao: { palco: PALCO, t: 1.0, amt: 0.018, sobe: { dur: 0.07, ease: "power2.out" }, volta: { desloc: 0.07, dur: 0.45, ease: "elastic.out(1, 0.45)" } },
  sons: { v2: [] },
  aplica(tl, st, p, ctx) {
    const t0 = ctx.t(p.t);
    animaSoco(tl, st, ctx, p.palco || PALCO, t0, p.amt, p);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// ---------- 4. estouro ----------

export type ParamsEstouro = { camada: string; t: Tempo; x: number | null; y: number | null; voo: Mov; some: Mov & { desloc: number } };

export const estouro: Batida<ParamsEstouro> = {
  id: "estouro",
  camada: "2d",
  descricao: "Dez peças da paleta em leque (raio de 120 a 230 px, 0,55 s power3.out) que somem a partir de +0,32 s (o burst da abertura). Junto da virada-de-pagina, da marca-dia ou do carimbo, use o parâmetro estouro delas (o som já está nelas).",
  ancoras: ["inicio"],
  padrao: { camada: "pecas", t: 1.02, x: null, y: null, voo: { dur: 0.55, ease: "power3.out" }, some: { desloc: 0.32, dur: 0.25, ease: "power1.in" } },
  sons: { v2: [{ som: "sint-s_burst", em: "inicio", desloc: 0.02, ganhoDb: -29, args: [9, 0.3] }] },
  aplica(tl, st, p, ctx) {
    const t0 = ctx.t(p.t);
    animaEstouro(tl, st, ctx, p.camada, t0, p);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// ---------- 5. carimbo ----------

export type ParamsCarimbo = {
  selo: string;
  t: Tempo; // o impacto (4,5 s na abertura)
  queda: { desloc: number; de: Vals; para: Vals; dur: number; ease: string };
  sombra: null | { de: Vals; para: Vals; some: Vals };
  desce: { desloc: number; para: Vals; dur: number; ease: string };
  achata: { para: Vals; dur: number; ease: string };
  mola: { desloc: number; dur: number; ease: string };
  anel: null | { dur: number; ease: string };
  papel: null | { camada: string; afunda: Vals; dur: number; ease: string; volta: { desloc: number; dur: number; ease: string } };
  estouro: EstouroOpcional;
  tremida: null | { palco: string; x: number[]; y: number[]; dur: number };
};

export const carimbo: Batida<ParamsCarimbo> = {
  id: "carimbo",
  camada: "2d",
  descricao: "O selo aparece no alto, cai, achata (scaleX 1,18, scaleY 0,82) e volta com mola; o anel abre, o palco treme 0,32 s e o papel embaixo (opcional) afunda. Nunca na batida de pagar.",
  ancoras: ["queda", "impacto"],
  padrao: {
    selo: "selo",
    t: 4.5,
    queda: { desloc: -0.45, de: { op: 0, y: -260, s: 1.9, rot: -25 }, para: { op: 1, y: -170, s: 1.55, rot: -14 }, dur: 0.3, ease: "power2.out" },
    sombra: { de: { sombraOp: 0, sombraS: 1.8 }, para: { sombraOp: 0.35, sombraS: 1.3 }, some: { sombraOp: 0, sombraS: 1 } },
    desce: { desloc: -0.15, para: { y: 0, s: 1, rot: -6 }, dur: 0.15, ease: "power4.in" },
    achata: { para: { sx: 1.18, sy: 0.82 }, dur: 0.06, ease: "power2.out" },
    mola: { desloc: 0.06, dur: 0.5, ease: "elastic.out(1, 0.35)" },
    anel: { dur: 0.55, ease: "power2.out" },
    papel: null,
    estouro: null,
    tremida: { palco: PALCO, x: [0, 12, -9, 6, -3, 0], y: [0, -6, 7, -4, 2, 0], dur: 0.32 },
  },
  sons: {
    v2: [
      { som: "sint-s_swish", em: "queda", desloc: 0, ganhoDb: -34, args: [0.24] },
      { som: "sint-s_thump", em: "impacto", desloc: 0, ganhoDb: -19, args: [150, 60, 0.3] },
      { som: "sint-s_clack", em: "impacto", desloc: 0, ganhoDb: -22 },
      { som: "sint-s_burst", em: "impacto", desloc: 0.03, ganhoDb: -30, args: [8, 0.25] },
    ],
  },
  aplica(tl, st, p, ctx) {
    defCamada(ctx, p.selo, ["selo", "imagem"]);
    const c = garante(canalDe(st, p.selo), { op: 1, x: 0, y: 0, s: 1, rot: 0, sx: 1, sy: 1, sombraOp: 0, sombraS: 1.8, anel: 0, anelVis: 0 });
    const ti = ctx.t(p.t);
    const tq = ctx.t({ desloc: p.queda.desloc }, ti);
    const td = ctx.t({ desloc: p.desce.desloc }, ti);
    tl.fromTo(c, { ...p.queda.de }, vars(p.queda.para, p.queda.dur, p.queda.ease), tq);
    if (p.sombra) tl.fromTo(c, { ...p.sombra.de }, vars(p.sombra.para, p.queda.dur, p.queda.ease), tq);
    tl.to(c, vars(p.desce.para, p.desce.dur, p.desce.ease), td);
    if (p.sombra) tl.to(c, vars(p.sombra.some, p.desce.dur, p.desce.ease), td);
    tl.to(c, vars(p.achata.para, p.achata.dur, p.achata.ease), ti);
    tl.to(c, vars({ sx: 1, sy: 1 }, p.mola.dur, p.mola.ease), ctx.t({ desloc: p.mola.desloc }, ti));
    if (p.papel && p.papel.camada) {
      defCamada(ctx, p.papel.camada, ["imagem", "selo"]);
      const pp = garante(canalDe(st, p.papel.camada), { op: 1, x: 0, y: 0, s: 1, rot: 0, sx: 1, sy: 1 });
      tl.to(pp, vars(p.papel.afunda, p.papel.dur, p.papel.ease), ti);
      const volta: Vals = {};
      for (const k of Object.keys(p.papel.afunda)) volta[k] = k === "s" || k === "sx" || k === "sy" ? 1 : 0;
      tl.to(pp, vars(volta, p.papel.volta.dur, p.papel.volta.ease), ctx.t({ desloc: p.papel.volta.desloc }, ti));
    }
    if (p.anel) {
      // o círculo do burst: aparece no impacto e abre de r 70 a 190, com o traço e a opacidade indo a zero
      tl.set(c, { anelVis: 1, anel: 0 }, ti);
      tl.to(c, vars({ anel: 1 }, p.anel.dur, p.anel.ease), ti);
    }
    estouroOpcional(tl, st, ctx, p.estouro, ti);
    if (p.tremida) {
      const pc = garante(canalDe(st, p.tremida.palco || PALCO), { s: 1, x: 0, y: 0 });
      tl.to(pc, { keyframes: { x: p.tremida.x.slice(), y: p.tremida.y.slice() }, duration: p.tremida.dur, ease: "none" }, ti);
    }
    ctx.som(ancoras({ queda: tq, impacto: ti }));
  },
};

// ---------- 6. marca-texto ----------

export type ParamsMarcaTexto = { camada: string; t: Tempo; dur: number; ease: string };

export const marcaTexto: Batida<ParamsMarcaTexto> = {
  id: "marca-texto",
  camada: "2d",
  descricao: "O traço de marca-texto é desenhado atrás da palavra, da esquerda pra direita (0,4 s power2.inOut). Nunca antes da palavra na mesma linha.",
  ancoras: ["inicio"],
  padrao: { camada: "marca", t: 6.55, dur: 0.4, ease: "power2.inOut" },
  sons: { v2: [{ som: "sint-s_swish", em: "inicio", desloc: 0, ganhoDb: -31, args: [0.3] }] },
  aplica(tl, st, p, ctx) {
    const def = defCamada(ctx, p.camada, ["marcaTexto"]);
    const alvo = typeof def.texto === "string" ? (def.texto as string) : "";
    defCamada(ctx, alvo, ["texto"]);
    const c = garante(canalDe(st, p.camada), { p: 0 });
    const t0 = ctx.t(p.t);
    tl.fromTo(c, { p: 0 }, vars({ p: 1 }, p.dur, p.ease), t0);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// ---------- 7. entra-em-arco ----------

export type ParamsEntraEmArco = {
  alvo: string; // camada (imagem, selo ou cta) ou objeto 3D da cena
  t: Tempo;
  de: Vals; // camada: px e graus
  para: Vals;
  dur: number;
  ease: string;
  objeto: { de: Vals }; // objeto 3D: diferenças sobre a pose da cena (y em metros, s multiplica, rz e ry em radianos)
};

export const entraEmArco: Batida<ParamsEntraEmArco> = {
  id: "entra-em-arco",
  camada: "2d",
  descricao: "O elemento entra de baixo em arco (y 760, x 120, rotate -22, scale 0,6 até a pose, 0,6 s lgPousa). Com um objeto 3D, sobe da diferença de pose de objeto.de até a pose da cena.",
  ancoras: ["inicio"],
  padrao: {
    alvo: "imagem",
    t: 3.0,
    de: { op: 0, y: 760, x: 120, rot: -22, s: 0.6 },
    para: { op: 1, y: 0, x: 0, rot: -4, s: 1 },
    dur: 0.6,
    ease: "lgPousa",
    objeto: { de: { y: -0.166, s: 0.414, rz: -0.3, ry: -0.9 } },
  },
  sons: {
    v2: [
      { som: "sint-s_whoosh", em: "inicio", desloc: -0.02, ganhoDb: -29, args: [0.4, 400, 6000] },
      { som: "sint-s_papel", em: "inicio", desloc: 0.1, ganhoDb: -30, args: [0.3] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const t0 = ctx.t(p.t);
    const ob = st.obj[p.alvo];
    if (ob) {
      // objeto 3D: set na pose de partida e tween até a pose da cena (sem render imediato: a pose antes do
      // instante é a da cena, como o fromTo do calendário na abertura com immediateRender false)
      const d = p.objeto.de;
      const de: Record<string, number> = { vis: 1 };
      const para: Record<string, number> = {};
      for (const k of Object.keys(d)) {
        const atual = (ob as unknown as Record<string, number>)[k];
        if (typeof atual !== "number") continue;
        de[k] = k === "s" ? atual * d[k] : atual + d[k];
        para[k] = atual;
      }
      tl.set(ob, de, t0);
      tl.to(ob, vars(para, p.dur, p.ease), t0);
    } else {
      defCamada(ctx, p.alvo, ["imagem", "selo", "cta"]);
      const c = garante(canalDe(st, p.alvo), { op: 1, x: 0, y: 0, s: 1, rot: 0, sx: 1, sy: 1 });
      tl.fromTo(c, { ...p.de }, vars(p.para, p.dur, p.ease), t0);
    }
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// ---------- 8. guarda-na-pasta ----------

export type ParamsGuardaNaPasta = {
  elemento: string;
  pasta: string;
  t: Tempo; // a pasta entra (7,45 s na abertura)
  entra: { de: Vals; para: Vals; dur: number; ease: string };
  levanta: { desloc: number; para: Vals; dur: number; ease: string };
  mergulha: { desloc: number; para: Vals; dur: number; ease: string };
  some: { desloc: number };
  achata: { desloc: number; para: Vals; dur: number; ease: string };
  mola: { desloc: number; dur: number; ease: string };
  soco: SocoOpcional;
};

export const guardaNaPasta: Batida<ParamsGuardaNaPasta> = {
  id: "guarda-na-pasta",
  camada: "2d",
  descricao: "A pasta entra pela direita; o elemento levanta, mergulha encolhendo pra dentro dela e some; a pasta achata e volta com mola, com um soco leve.",
  ancoras: ["pasta", "mergulho", "pouso"],
  padrao: {
    elemento: "imagem",
    pasta: "pasta",
    t: 7.45,
    entra: { de: { op: 0, x: 560, rot: 18, s: 0.7 }, para: { op: 1, x: 0, rot: 0, s: 1 }, dur: 0.5, ease: "lgPousa" },
    levanta: { desloc: 0.3, para: { x: 150, y: -30, rot: 8, s: 0.86 }, dur: 0.25, ease: "power2.out" },
    mergulha: { desloc: 0.55, para: { x: 175, y: 210, s: 0.42, rot: 2 }, dur: 0.32, ease: "power3.in" },
    some: { desloc: 0.88 },
    achata: { desloc: 0.87, para: { sy: 0.88, sx: 1.07 }, dur: 0.07, ease: "power2.out" },
    mola: { desloc: 0.94, dur: 0.55, ease: "elastic.out(1, 0.35)" },
    soco: { palco: PALCO, amt: 0.012 },
  },
  sons: {
    v2: [
      { som: "sint-s_pop", em: "pasta", desloc: 0.02, ganhoDb: -26, args: [700, 300, 0.14, 26] },
      { som: "sint-s_whoosh", em: "mergulho", desloc: -0.05, ganhoDb: -30, args: [0.32, 500, 6000] },
      { som: "sint-s_pop", em: "pouso", desloc: 0, ganhoDb: -22, args: [300, 140, 0.18, 18] },
      { som: "sint-s_thump", em: "pouso", desloc: 0, ganhoDb: -29, args: [110, 50, 0.22] },
    ],
  },
  aplica(tl, st, p, ctx) {
    defCamada(ctx, p.elemento, ["imagem", "selo"]);
    defCamada(ctx, p.pasta, ["imagem"]);
    const el = garante(canalDe(st, p.elemento), { op: 1, x: 0, y: 0, s: 1, rot: 0, sx: 1, sy: 1 });
    const pa = garante(canalDe(st, p.pasta), { op: 1, x: 0, y: 0, s: 1, rot: 0, sx: 1, sy: 1 });
    const t0 = ctx.t(p.t);
    const tm = ctx.t({ desloc: p.mergulha.desloc }, t0);
    const tp = ctx.t({ desloc: p.achata.desloc }, t0);
    tl.fromTo(pa, { ...p.entra.de }, vars(p.entra.para, p.entra.dur, p.entra.ease), t0);
    tl.to(el, vars(p.levanta.para, p.levanta.dur, p.levanta.ease), ctx.t({ desloc: p.levanta.desloc }, t0));
    tl.to(el, vars(p.mergulha.para, p.mergulha.dur, p.mergulha.ease), tm);
    tl.set(el, { op: 0 }, ctx.t({ desloc: p.some.desloc }, t0));
    tl.to(pa, vars(p.achata.para, p.achata.dur, p.achata.ease), tp);
    tl.to(pa, vars({ sy: 1, sx: 1 }, p.mola.dur, p.mola.ease), ctx.t({ desloc: p.mola.desloc }, t0));
    socoOpcional(tl, st, ctx, p.soco, tp);
    ctx.som(ancoras({ pasta: t0, mergulho: tm, pouso: tp }));
  },
};

// ---------- 9. cta-pop ----------

export type ParamsCtaPop = {
  camada: string;
  t: Tempo;
  entra: { de: Vals; para: Vals; dur: number; ease: string };
  pulso: null | { desloc: number; s: number; dur: number; ease: string };
};

export const ctaPop: Batida<ParamsCtaPop> = {
  id: "cta-pop",
  camada: "2d",
  descricao: "O CTA entra com back.out(2.4) e pulsa uma vez 1,2 s depois.",
  ancoras: ["inicio", "pulso"],
  padrao: {
    camada: "cta",
    t: 16.3,
    entra: { de: { op: 0, s: 0.3, y: 30 }, para: { op: 1, s: 1, y: 0 }, dur: 0.45, ease: "back.out(2.4)" },
    pulso: { desloc: 1.2, s: 1.06, dur: 0.12, ease: "power2.out" },
  },
  sons: {
    v2: [
      { som: "sint-s_bubble", em: "inicio", desloc: 0, ganhoDb: -24 },
      { som: "sint-s_pop", em: "pulso", desloc: 0, ganhoDb: -31, args: [1300, 700, 0.08, 45] },
    ],
  },
  aplica(tl, st, p, ctx) {
    defCamada(ctx, p.camada, ["cta", "imagem", "selo"]);
    const c = garante(canalDe(st, p.camada), { op: 1, x: 0, y: 0, s: 1 });
    const t0 = ctx.t(p.t);
    tl.fromTo(c, { ...p.entra.de }, vars(p.entra.para, p.entra.dur, p.entra.ease), t0);
    let tp: number | undefined;
    if (p.pulso) {
      tp = ctx.t({ desloc: p.pulso.desloc }, t0);
      tl.to(c, vars({ s: p.pulso.s }, p.pulso.dur, p.pulso.ease, { yoyo: true, repeat: 1 }), tp);
    }
    ctx.som(ancoras({ inicio: t0, pulso: tp }));
  },
};

// ---------- 10. virada-de-pagina ----------

export type ParamsViradaDePagina = {
  objeto: string;
  t: Tempo;
  antecipacao: { desloc: number; para: Vals; dur: number; ease: string };
  virada: Mov;
  some: { desloc: number; dur: number; ease: string };
  estica: { para: Vals; dur: number; ease: string };
  mola: { desloc: number; dur: number; ease: string };
  giro: null | { amp: number; dur: number; ease: string; volta: { desloc: number; dur: number; ease: string } };
  estouro: EstouroOpcional;
  soco: SocoOpcional;
};

export const viradaDePagina: Batida<ParamsViradaDePagina> = {
  id: "virada-de-pagina",
  camada: "2d",
  descricao: "Calendário clay: antecipação (sy 0,95, sx 1,04), virada de 0,5 s power3.out, a página some atrás das argolas, achatamento e mola, um giro curto, estouro (opcional) e soco.",
  ancoras: ["inicio"],
  padrao: {
    objeto: "calendario",
    t: 1.0,
    antecipacao: { desloc: -0.4, para: { sy: 0.95, sx: 1.04, virada: 0.06 }, dur: 0.4, ease: "power2.in" },
    virada: { dur: 0.5, ease: "power3.out" },
    some: { desloc: 0.3, dur: 0.16, ease: "power2.in" },
    estica: { para: { sy: 1.07, sx: 0.97 }, dur: 0.12, ease: "power2.out" },
    mola: { desloc: 0.12, dur: 0.6, ease: "elastic.out(1, 0.35)" },
    giro: { amp: 0.22, dur: 0.18, ease: "power2.out", volta: { desloc: 0.18, dur: 0.7, ease: "elastic.out(1, 0.4)" } },
    estouro: null,
    soco: { palco: PALCO, amt: 0.025 },
  },
  sons: {
    v2: [
      { som: "sint-s_riser", em: "inicio", desloc: -0.45, ganhoDb: -31, args: [0.45, 420, 1250] },
      { som: "sint-s_whoosh", em: "inicio", desloc: -0.02, ganhoDb: -27, args: [0.34, 700, 8000] },
      { som: "sint-s_papel", em: "inicio", desloc: 0.02, ganhoDb: -27, args: [0.28] },
      { som: "sint-s_burst", em: "inicio", desloc: 0.04, ganhoDb: -29, args: [9, 0.3] },
      { som: "sint-s_thump", em: "inicio", desloc: 0, ganhoDb: -27, args: [120, 55, 0.25] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const c = calendario(st, ctx, p.objeto);
    const t0 = ctx.t(p.t);
    tl.to(c, vars(p.antecipacao.para, p.antecipacao.dur, p.antecipacao.ease), ctx.t({ desloc: p.antecipacao.desloc }, t0));
    tl.to(c, vars({ virada: 1 }, p.virada.dur, p.virada.ease), t0);
    tl.to(c, vars({ pagina: 0 }, p.some.dur, p.some.ease), ctx.t({ desloc: p.some.desloc }, t0));
    estouroOpcional(tl, st, ctx, p.estouro, t0);
    tl.to(c, vars(p.estica.para, p.estica.dur, p.estica.ease), t0);
    tl.to(c, vars({ sy: 1, sx: 1 }, p.mola.dur, p.mola.ease), ctx.t({ desloc: p.mola.desloc }, t0));
    if (p.giro) {
      tl.to(c, vars({ giro: p.giro.amp }, p.giro.dur, p.giro.ease), t0);
      tl.to(c, vars({ giro: 0 }, p.giro.volta.dur, p.giro.volta.ease), ctx.t({ desloc: p.giro.volta.desloc }, t0));
    }
    socoOpcional(tl, st, ctx, p.soco, t0);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// ---------- 11. marca-dia ----------

export type ParamsMarcaDia = {
  objeto: string;
  t: Tempo;
  marca: Mov;
  pulso: { dur: number; ease: string; volta: { desloc: number; dur: number; ease: string } };
  estouro: EstouroOpcional;
  soco: SocoOpcional;
};

export const marcaDia: Batida<ParamsMarcaDia> = {
  id: "marca-dia",
  camada: "2d",
  descricao: "Calendário clay: o anel coral abre em volta do dia (back.out(2.2)), a etiqueta aparece e o botão do dia pulsa com mola; estouro (opcional) e soco.",
  ancoras: ["inicio"],
  padrao: {
    objeto: "calendario",
    t: 10.0,
    marca: { dur: 0.45, ease: "back.out(2.2)" },
    pulso: { dur: 0.1, ease: "power2.out", volta: { desloc: 0.1, dur: 0.5, ease: "elastic.out(1, 0.35)" } },
    estouro: null,
    soco: { palco: PALCO, amt: 0.015 },
  },
  sons: {
    v2: [
      { som: "sint-s_check", em: "inicio", desloc: 0, ganhoDb: -24 },
      { som: "sint-s_burst", em: "inicio", desloc: 0.03, ganhoDb: -30, args: [9, 0.3] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const c = calendario(st, ctx, p.objeto);
    const t0 = ctx.t(p.t);
    tl.to(c, vars({ marca: 1 }, p.marca.dur, p.marca.ease), t0);
    estouroOpcional(tl, st, ctx, p.estouro, t0);
    tl.to(c, vars({ pulso: 1 }, p.pulso.dur, p.pulso.ease), t0);
    tl.to(c, vars({ pulso: 0 }, p.pulso.volta.dur, p.pulso.volta.ease), ctx.t({ desloc: p.pulso.volta.desloc }, t0));
    socoOpcional(tl, st, ctx, p.soco, t0);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// ---------- registro (seção 4.10) ----------

const LISTA: Array<Batida<any>> = [textoEntra, textoSai, soco, estouro, carimbo, marcaTexto, entraEmArco, guardaNaPasta, ctaPop, viradaDePagina, marcaDia];

export const batidas: Record<string, Batida<any>> = {};
for (const b of LISTA) batidas[b.id] = b;

/** metadados das camadas (o Node valida as camadas da cena por aqui) */
export const camadas: Record<string, { descricao: string; params: Record<string, unknown>; canais: string[] }> = {
  texto: {
    descricao: "Texto da abertura em Sora 800: linhas explícitas (sem quebra automática), cada palavra num span, máscara por linha; \"*palavra*\" sai na cor de destaque. Fora do palco.",
    params: {
      linhas: ["Mês novo,", "*hábito novo.*"], top: 205, altura: 420, esquerda: 70, largura: 940, tamanho: 100, peso: 800,
      cor: "#1B1E24", corDestaque: "#DD4E27", entrelinha: 1.04, espacamento: "-0.035em",
    },
    canais: ["vis", "w<i> (entrada da palavra i)", "l<j> (saída da linha j)"],
  },
  imagem: {
    descricao: "Imagem do public (src), centrada em x e y, com sombra suave; entra no palco.",
    params: { src: "marca/simbolo.svg", x: 540, y: 1160, largura: 520, sombra: true, origemAchata: "50% 100%", palco: true },
    canais: ["op", "x", "y", "s", "rot", "sx", "sy"],
  },
  selo: {
    descricao: "Selo vetorial (disco recortado na paleta) com o check branco ou o símbolo da marca (icone \"simbolo\"), ou uma imagem (src); sombra e anel do carimbo; entra no palco.",
    params: { x: 760, y: 1250, tamanho: 175, icone: "check", cor: "#F2643C", corAro: "#DD4E27", palco: true },
    canais: ["op", "x", "y", "s", "rot", "sx", "sy", "sombraOp", "sombraS", "anel", "anelVis"],
  },
  marcaTexto: {
    descricao: "Traço de marca-texto desenhado ATRÁS de uma palavra (ou de palavras seguidas da mesma linha) de uma camada texto; nunca antes dela na mesma linha.",
    params: { texto: "t3", palavra: 3, ate: null, cor: "#F2643C", espessura: 9, opacidade: 0.85 },
    canais: ["p"],
  },
  pecas: {
    descricao: "Dez peças vetoriais na paleta (coral, coral-200, coral-600 e areia) pro estouro, em volta de x e y; entra no palco.",
    params: { x: 540, y: 870, n: 10, raio: [120, 55], subida: 30, giro: 160, cores: ["#F2643C", "#F8C3B0", "#DD4E27", "#EAE1D6"], palco: true },
    canais: ["vis", "v", "f", "cx", "cy"],
  },
  cta: {
    descricao: "Pílula branca de CTA com o ícone de comentário (opcional) e o texto em Sora 800; fora do palco.",
    params: { texto: "Conta pra gente aqui", x: 540, y: 1450, largura: 600, tamanho: 40, icone: "comentario" },
    canais: ["op", "x", "y", "s"],
  },
};
