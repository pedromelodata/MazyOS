// Gera o monta.jsx: o reel de 09/10 ("O sufoco burocrático real"), versão 3, montado no After Effects a pedido do Pedro
// (06/10/2026): "uma linha que desça de cima para baixo e, conforme ela vai descendo, os motions vão acontecendo, de
// uma forma que tudo fique conectado nessa linha"; "a linha um pouco menos grossa, mais suave, sem rastro gigante,
// apenas uma sombra que acompanha ela"; "Faça no AE".
// Um mundo vertical só (null MUNDO, a câmera é a posição dele) e uma linha contínua, feita de camadas de forma em
// sequência (cada uma com o Aparar Demarcadores animado), que liga as cenas da v2, frase a frase, no tempo da voz.
// Uso: node gera.mjs   (depois: AfterFX.exe -r monta.jsx, com o AE aberto)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(AQUI, "assets").replace(/\\/g, "/");
const narr = JSON.parse(fs.readFileSync(path.join(AQUI, "assets/narracao.json"), "utf8"));
const FPS = 30;
const DUR = narr.duracao; // 24.8
// v5 (07/10): depois do "construindo o Legalizaí" entram 6 s de funcionalidades no celular 3D. Toda a montagem
// continua escrita no tempo da v4; no AE, qualquer tempo a partir de T_INS anda DELTA (função RT do JSX).
// 6 s = 12 batidas da trilha (120 BPM): a música segue no compasso.
const T_INS = 17.9, DELTA = 6;
const DUR_V = DUR + DELTA;
const TF = narr.tFecho; // 21.8

// ---------- palavras ----------
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
function iw(txt, n = 1) {
  let k = 0;
  for (const w of narr.words) if (norm(w.t) === norm(txt) && ++k === n) return w.i;
  throw new Error(`palavra não achada: ${txt} (${n})`);
}
const S = (t, n = 1) => narr.words[iw(t, n)].s;
const E = (t, n = 1) => narr.words[iw(t, n)].e;
const r3 = (x) => Math.round(x * 1000) / 1000;

const T = {
  tarde: S("tarde"), coisaFim: E("coisa"), simples: S("simples"),
  chega: S("Chega"), trava: S("trava"),
  liga: S("Liga"), cai: S("cai") - 0.02,
  vai: S("Vai"), fila: S("fila"),
  no2: S("No", 2), nada: S("nada"), resolvidoFim: E("resolvido"),
  parada: S("parada"), esperando: S("esperando"),
  e2: S("É", 2), construindo: S("construindo"), legalizai: S("Legalizaí"),
  segue: S("Segue"), e3: S("E", 3), clica: S("clica"), link: S("link"), bio: S("bio"),
};
T.B = T.chega - 0.11;
T.clique = T.B + 0.56;
T.C = T.liga - 0.2;
T.D = T.vai - 0.13;
T.anda = T.D + 0.06;
T.durAnda = T.fila - 0.1 - T.anda;
T.E = T.no2 - 0.1;
T.F = T.resolvidoFim - 0.04;
T.G = T.e2 - 0.05;
T.constr = T.construindo - 0.1;
T.durBlocos = T.legalizai - 0.06 - T.constr;
T.H = T.segue - 0.17;
T.segueClique = T.segue + 0.08;
T.clicaClique = T.clica + 0.04;

// ---------- cores ----------
const C = {
  ink: "#1B1E24", tinta: "#262931", papel: "#FAF8F5", branco: "#FFFFFF", coral: "#F2643C", coral6: "#DD4E27",
  coral1: "#FBDDD1", coral3: "#F5A184", cinza: "#C9C5BE", cinza2: "#D9D5CE", cinza3: "#ECE8E2", cinza4: "#F1EEE9",
  noite: "#1F212B", ceuNoite: "#232637", ceuBaixo: "#3A3045", predio: "#14151C", luz: "#FFD9A0", aco: "#9A9DA8",
  bezel: "#0E1014", claro: "#F4F1EC",
};

// ---------- monótona (Fritsch-Carlson) ----------
function monotona(xs, ys) {
  const n = xs.length;
  if (n === 1) return () => ys[0];
  const d = [];
  const m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(1e-6, xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(d[i]) < 1e-9) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const s = (x - xs[i]) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}

// ---------- traçado (vértices com tangentes, como o caminho do AE) ----------
class Trac {
  constructor(x, y) { this.V = [[x, y]]; this.I = [[0, 0]]; this.O = [[0, 0]]; this.m = { inicio: 0 }; }
  get u() { return this.V[this.V.length - 1]; }
  reta(x, y) { this.V.push([x, y]); this.I.push([0, 0]); this.O.push([0, 0]); return this; }
  curva(c1x, c1y, c2x, c2y, x, y) {
    const [px, py] = this.u;
    this.O[this.O.length - 1] = [c1x - px, c1y - py];
    this.V.push([x, y]); this.I.push([c2x - x, c2y - y]); this.O.push([0, 0]);
    return this;
  }
  // arco em graus (0 = direita, 90 = baixo), em pedaços de até 90 graus
  arco(cx, cy, r, a0, a1) {
    const rad = (g) => (g * Math.PI) / 180;
    const p0 = [cx + r * Math.cos(rad(a0)), cy + r * Math.sin(rad(a0))];
    const [ux, uy] = this.u;
    if (Math.hypot(ux - p0[0], uy - p0[1]) > 0.5) this.reta(p0[0], p0[1]);
    const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 90));
    const dd = (a1 - a0) / n;
    for (let i = 0; i < n; i++) {
      const s = rad(a0 + i * dd);
      const e = rad(a0 + (i + 1) * dd);
      const k = (4 / 3) * Math.tan((e - s) / 4);
      const q0 = [cx + r * Math.cos(s), cy + r * Math.sin(s)];
      const q3 = [cx + r * Math.cos(e), cy + r * Math.sin(e)];
      this.curva(q0[0] - k * r * Math.sin(s), q0[1] + k * r * Math.cos(s), q3[0] + k * r * Math.sin(e), q3[1] - k * r * Math.cos(e), q3[0], q3[1]);
    }
    return this;
  }
  marca(n) { this.m[n] = this.V.length - 1; return this; }
  comprimentos() {
    const L = [0];
    for (let i = 0; i < this.V.length - 1; i++) {
      const p0 = this.V[i];
      const p3 = this.V[i + 1];
      const c1 = [p0[0] + this.O[i][0], p0[1] + this.O[i][1]];
      const c2 = [p3[0] + this.I[i + 1][0], p3[1] + this.I[i + 1][1]];
      let ac = 0;
      let ant = p0;
      for (let k = 1; k <= 48; k++) {
        const t = k / 48;
        const a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, d = t ** 3;
        const q = [a * p0[0] + b * c1[0] + c * c2[0] + d * p3[0], a * p0[1] + b * c1[1] + c * c2[1] + d * p3[1]];
        ac += Math.hypot(q[0] - ant[0], q[1] - ant[1]);
        ant = q;
      }
      L.push(L[L.length - 1] + ac);
    }
    return L;
  }
}

// ---------- saída JSX ----------
const J = (v) => JSON.stringify(v, (k, x) => (typeof x === "number" ? Math.round(x * 1000) / 1000 : x));
const out = [];
// O AE trava numa montagem longa quando cada operação vira um passo de desfazer: a montagem inteira
// vai num grupo só e, a cada PURGA instruções, o cache é liberado (sem isso ele morre por volta da 980ª).
const PURGA = 150;
let nEmit = 0;
const emit = (s) => {
  out.push(s);
  if (++nEmit % PURGA === 0) out.push(`try { app.purge(PurgeTarget.ALL_CACHES); } catch (e) {}`);
};
let nVar = 0;
const nv = (p = "v") => `${p}${nVar++}`;

// chaves: [[t, valor, easeDoTrechoSeguinte], ...]; ease: "io" | "o" | "i" | "lin" | "hold" | [infSaida, infChegada]
const kf = (alvo, chaves) => emit(`kf(${alvo}, ${J(chaves.map(([t, v, e]) => [r3(t), v, e || "io"]))});`);
// muitas chaves lineares
const kfd = (alvo, ts, vs) => emit(`kfd(${alvo}, ${J(ts.map(r3))}, ${J(vs)});`);

// pulo (outBack): de a até b com passa
const pulo = (t0, d, a, b, passa = 0.08) => {
  const pk = Array.isArray(b) ? b.map((x, i) => x + (x - (Array.isArray(a) ? a[i] : a)) * passa) : b + (b - a) * passa;
  return [[t0, a, "o"], [t0 + d * 0.62, pk, "io"], [t0 + d, b, "io"]];
};

// ---------- a linha ----------
const LINHA = { larg: 9, sombra: { cor: C.ink, op: 52, dist: 7, suav: 16 } };
const segmentos = [];
const infoSeg = [];
function segmento(nome, tr, chavesTempo, opc = {}) {
  segmentos.push({ nome, tr, chavesTempo, opc });
}

// ---- cena 1: o relógio da tarde (a linha desce e abraça o relógio da 13h às 18h) ----
const REL = { x: 540, y: 1150, r: 290, rl: 345 };
// ---- cena 2: o site ----
const SITE = { x: 540, y: 2700, w: 860, h: 600 };
const BARRA = { y: SITE.y - SITE.h / 2 - 34, x0: 190, x1: 890 };
// ---- cena 3: o telefone ----
const FONE = { x: 540, y: 4040 };
const ONDA = { y: 4330, x0: 960, x1: 120 };
// ---- cena 4: a fila ----
const CHAO = { y: 5690, x0: 110, x1: 1000 };
// ---- cena 5: a cidade ----
const HORIZ = 7130;
const SKY = [[1050, 7120], [980, 7120], [980, 7010], [870, 7010], [870, 7080], [790, 7080], [790, 6950], [700, 6950], [700, 7060], [600, 7060], [600, 6990], [500, 6990],
  [500, 7100], [420, 7100], [420, 6970], [330, 6970], [330, 7040], [230, 7040], [230, 7110], [150, 7110], [150, 7000], [40, 7000]];
// ---- cena 6: a empresa ----
const EMP = { x0: 200, x1: 760, topo: 8170, chao: 8580 };
// ---- cena 7: o celular ----
const CEL = { x: 540, y: 9660, w: 400, h: 820, r: 64 };
// ---- cena 8: o cartão ----
const CART = { x: 540, y: 11120, w: 900, h: 520 };
const SEG = { x: 540, y: 11165, w: 760, h: 100 };
const LNK = { x: 540, y: 11335, w: 400, h: 80 };
// ---- fecho (tela) ----
const CAMF = 11450;
const LOGO = { w: 590, x0: 359, y0: 762 };
const kL = LOGO.w / 659.73;
const vis = (u, v) => [LOGO.x0 + u * kL, LOGO.y0 + v * kL];
const VISTO = [vis(27.66, 60.29), vis(60.76, 93.39), vis(121.42, 32.73)];

// L1: do alto até a onda do telefone
{
  const tr = new Trac(540, -140);
  tr.reta(540, REL.y - REL.rl).marca("topo");
  tr.arco(REL.x, REL.y, REL.rl, -90, -60).marca("h13");
  tr.arco(REL.x, REL.y, REL.rl, -60, 90).marca("h18");
  tr.curva(400, REL.y + REL.rl, 120, 1600, 120, 1900).reta(120, 2260).curva(120, BARRA.y - 30, 140, BARRA.y, BARRA.x0, BARRA.y).marca("barra0");
  tr.reta(BARRA.x0 + 0.82 * (BARRA.x1 - BARRA.x0), BARRA.y).marca("barra82");
  tr.reta(BARRA.x1, BARRA.y).marca("barra100");
  tr.curva(970, BARRA.y, 1010, BARRA.y + 30, 1010, BARRA.y + 110).reta(1010, ONDA.y - 120).curva(1010, ONDA.y - 40, 1000, ONDA.y, ONDA.x0, ONDA.y).marca("fim");
  segmento("Linha 1 (relógio e site)", tr, [
    ["inicio", 0.04], ["topo", 0.98], ["h13", T.tarde], ["h18", T.coisaFim], ["barra0", 3.7], ["barra0", T.clique + 0.06, 0], ["barra82", T.trava],
    ["barra82", T.trava + 0.62], ["barra100", 5.62], ["fim", 6.04],
  ]);
}
// L2: a onda da ligação (zigue-zague que vira linha reta quando a ligação cai)
{
  const tr = new Trac(ONDA.x0, ONDA.y);
  tr.reta(ONDA.x1, ONDA.y).marca("fim");
  segmento("Linha 2 (a ligação)", tr, [["inicio", 6.04], ["fim", 6.95]], { zigue: true });
}
// L3: da onda até a empresa (o chão da fila, o horizonte da cidade e o contorno da empresa)
{
  const tr = new Trac(ONDA.x1, ONDA.y);
  tr.curva(70, ONDA.y, 60, ONDA.y + 40, 60, ONDA.y + 120).reta(60, CHAO.y - 120).curva(60, CHAO.y - 30, 80, CHAO.y, CHAO.x0, CHAO.y).marca("chao0");
  tr.reta(CHAO.x1, CHAO.y).marca("chao1");
  tr.curva(1020, CHAO.y, 1040, CHAO.y + 30, 1040, CHAO.y + 120).reta(1040, SKY[0][1] - 110).curva(1040, SKY[0][1] - 40, 1050, SKY[0][1] - 20, SKY[0][0], SKY[0][1]).marca("ceu0");
  for (let i = 1; i < SKY.length; i++) tr.reta(SKY[i][0], SKY[i][1]);
  tr.marca("ceu1");
  tr.curva(20, SKY[SKY.length - 1][1], 10, SKY[SKY.length - 1][1] + 40, 10, SKY[SKY.length - 1][1] + 120).reta(10, EMP.chao - 110).curva(10, EMP.chao - 30, 40, EMP.chao, 100, EMP.chao).marca("emp0");
  tr.reta(EMP.x0, EMP.chao).reta(EMP.x0, EMP.topo).marca("emp1").reta(EMP.x1, EMP.topo).marca("emp2").reta(EMP.x1, EMP.chao).marca("emp3");
  tr.reta(990, EMP.chao).marca("emp4").curva(1025, EMP.chao, 1035, EMP.chao + 30, 1035, EMP.chao + 110).reta(1035, 8880).marca("fim");
  segmento("Linha 3 (fila, cidade e empresa)", tr, [
    ["inicio", 7.25], ["chao0", 8.62], ["chao1", 9.35], ["chao1", 10.25, 0], ["ceu0", 10.85], ["ceu1", 11.75], ["emp0", 12.95], ["emp1", 13.15], ["emp2", 13.42],
    ["emp3", 13.6], ["emp4", 13.95], ["fim", 15.24],
  ]);
}
// L4a (branca, intensa, no coral): a linha desenha o celular e some quando o corpo aparece
{
  const tr = new Trac(1035, 8880);
  const x0 = CEL.x - CEL.w / 2, x1 = CEL.x + CEL.w / 2, y0 = CEL.y - CEL.h / 2, y1 = CEL.y + CEL.h / 2, r = CEL.r;
  tr.curva(1035, 9060, CEL.x, 8990, CEL.x, 9140).reta(CEL.x, y0).marca("cel0");
  tr.reta(x1 - r, y0).arco(x1 - r, y0 + r, r, -90, 0).reta(x1, y1 - r).arco(x1 - r, y1 - r, r, 0, 90).reta(x0 + r, y1).arco(x0 + r, y1 - r, r, 90, 180)
    .reta(x0, y0 + r).arco(x0 + r, y0 + r, r, 180, 270).reta(CEL.x, y0).marca("fim");
  segmento("Linha 4a (constrói o celular)", tr, [["inicio", T.G + 0.02], ["cel0", T.G + 0.2], ["fim", 16.2]], { cor: C.branco, sombraCor: "#9E2F14", intensa: true, someEm: 16.24 });
}
// L4b: a linha sai de trás do celular, pela direita, e desce até a íris de papel (fica atrás do celular)
{
  const x1 = CEL.x + CEL.w / 2;
  const tr = new Trac(x1 - 40, CEL.y - 60);
  tr.reta(x1 - 40, CEL.y).curva(x1 - 40, CEL.y + 130, 1020, CEL.y + 60, 1020, CEL.y + 230).reta(1020, 10260).marca("fim");
  segmento("Linha 4b (sai do celular)", tr, [["inicio", 16.3], ["fim", 17.89]], { cor: C.branco, sombraCor: "#9E2F14", cedo: true }); // 17,89: termina antes do corte das funcionalidades
}
// L5: o Seguir e o link da bio (a linha contorna os dois botões)
{
  const tr = new Trac(1020, 10260);
  const pilula = (cx, cy, w, h, folga) => ({ x0: cx - w / 2 - folga + (h / 2 + folga), x1: cx + w / 2 + folga - (h / 2 + folga), y0: cy - h / 2 - folga, y1: cy + h / 2 + folga, r: h / 2 + folga, cy });
  const a = pilula(SEG.x, SEG.y, SEG.w, SEG.h, 14);
  const b = pilula(LNK.x, LNK.y, LNK.w, LNK.h, 14);
  tr.curva(1020, 10600, SEG.x, 10820, SEG.x, a.y0 - 90).reta(SEG.x, a.y0).marca("seg0");
  const voltaPilula = (p, cx) => {
    tr.reta(p.x1, p.y0).arco(p.x1, p.cy, p.r, -90, 90).reta(p.x0, p.y1).arco(p.x0, p.cy, p.r, 90, 270).reta(cx, p.y0);
  };
  voltaPilula(a, SEG.x);
  tr.marca("segFecha");
  tr.reta(a.x1, a.y0).arco(a.x1, a.cy, a.r, -90, 90).reta(SEG.x, a.y1).marca("segBase");
  tr.reta(LNK.x, b.y0).marca("lnk0");
  voltaPilula(b, LNK.x);
  tr.marca("lnkFecha");
  tr.reta(b.x1, b.y0).arco(b.x1, b.cy, b.r, -90, 90).reta(LNK.x, b.y1).marca("lnkBase");
  tr.marca("fim");
  segmento("Linha 5 (Seguir e link)", tr, [
    ["inicio", 17.9], ["seg0", 18.74], ["segFecha", 19.3], ["segBase", 19.45], ["segBase", T.e3 - 0.1, 0],
    ["lnk0", T.e3 + 0.04], ["lnkFecha", 20.75], ["fim", 20.86],
  ]);
  // L6: um cometa coral desce do link até o quadrado do logo e entra nele (não fica risco); o visto branco é a linha que chega
  const [v0] = VISTO.map(([x, y]) => [x, y + CAMF]);
  const tr6 = new Trac(LNK.x, b.y1);
  tr6.curva(LNK.x, b.y1 + 300, v0[0] - 120, v0[1] - 260, v0[0], v0[1]).marca("fim");
  segmento("Linha 6 (cometa até o logo)", tr6, [["inicio", 20.98], ["fim", 21.62]], { cometa: 0.22 });
}

// ---------- câmera ----------
const CAM = [[0, 0], [3.15, 0], [3.68, 1550], [5.5, 1550], [6.02, 2950], [7.95, 2950], [8.7, 4400], [10.3, 4400], [10.9, 5850], [12.85, 5850], [13.35, 7200],
  [14.95, 7200], [15.5, 8500], [18.15, 8500], [18.7, 10000], [21.0, 10000], [21.5, CAMF], [DUR, CAMF]];

// ---------- JSX: biblioteca ----------
const LIB = String.raw`
var LOG = [];
function log(s) { LOG.push(String(s)); }
function hx(c) { return [parseInt(c.substr(1, 2), 16) / 255, parseInt(c.substr(3, 2), 16) / 255, parseInt(c.substr(5, 2), 16) / 255]; }
function hx4(c) { var a = hx(c); a.push(1); return a; }
function raiz(L) { return L.property("ADBE Root Vectors Group"); }
function H(L, ix) { return { L: L, ix: ix }; }
function contDe(h) { var p = raiz(h.L); for (var k = 0; k < h.ix.length; k++) p = p.property(h.ix[k]).property("ADBE Vectors Group"); return p; }
function grupoDe(h) { var p = raiz(h.L), q = null; for (var k = 0; k < h.ix.length; k++) { q = p.property(h.ix[k]); p = q.property("ADBE Vectors Group"); } return q; }
function grp(pai, nome) { var c = contDe(pai); var q = c.addProperty("ADBE Vector Group"); if (nome) q.name = nome; var ix = q.propertyIndex; return H(pai.L, pai.ix.concat([ix])); }
function its(h) { return contDe(h); }
function tfg(h) { return grupoDe(h).property("ADBE Vector Transform Group"); }
function trimDe(h) { return its(h).property("ADBE Vector Filter - Trim"); }
function zigDe(h) { return its(h).property("ADBE Vector Filter - Zigzag"); }
function ret(g, w, h, r, x, y) { var p = its(g).addProperty("ADBE Vector Shape - Rect"); p.property("ADBE Vector Rect Size").setValue([w, h]); p.property("ADBE Vector Rect Position").setValue([x || 0, y || 0]); p.property("ADBE Vector Rect Roundness").setValue(r || 0); return p; }
function eli(g, w, h, x, y) { var p = its(g).addProperty("ADBE Vector Shape - Ellipse"); p.property("ADBE Vector Ellipse Size").setValue([w, h]); p.property("ADBE Vector Ellipse Position").setValue([x || 0, y || 0]); return p; }
function forma(v, it, ot, fech) { var s = new Shape(); s.vertices = v; s.inTangents = it; s.outTangents = ot; s.closed = fech; return s; }
function cam(g, v, it, ot, fech) { var p = its(g).addProperty("ADBE Vector Shape - Group"); p.property("ADBE Vector Shape").setValue(forma(v, it, ot, fech)); return p; }
function poli(g, v, fech) { var z = []; for (var i = 0; i < v.length; i++) z.push([0, 0]); return cam(g, v, z, z, fech); }
function fil(g, c, op) { var f = its(g).addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(hx(c)); if (op != null) f.property("ADBE Vector Fill Opacity").setValue(op); return f; }
function trc(g, c, w, op) { var s = its(g).addProperty("ADBE Vector Graphic - Stroke"); s.property("ADBE Vector Stroke Color").setValue(hx(c)); s.property("ADBE Vector Stroke Width").setValue(w); s.property("ADBE Vector Stroke Line Cap").setValue(2); s.property("ADBE Vector Stroke Line Join").setValue(2); if (op != null) s.property("ADBE Vector Stroke Opacity").setValue(op); return s; }
function apa(g) { return its(g).addProperty("ADBE Vector Filter - Trim"); }
function trcReto(g, c, w) { var s = its(g).addProperty("ADBE Vector Graphic - Stroke"); s.property("ADBE Vector Stroke Color").setValue(hx(c)); s.property("ADBE Vector Stroke Width").setValue(w); s.property("ADBE Vector Stroke Line Cap").setValue(1); return s; }
function tl(L) { return L.property("ADBE Transform Group"); }
function novaForma(nome, pai, x, y) { var L = ALVO.layers.addShape(); L.name = nome; if (pai) L.parent = pai; tl(L).property("ADBE Anchor Point").setValue([0, 0]); tl(L).property("ADBE Position").setValue([x || 0, y || 0]); return L; }
function inf(seg, lado) { if (seg == "io") return 62; if (seg == "o") return lado == 0 ? 14 : 84; if (seg == "i") return lado == 0 ? 84 : 14; if (seg instanceof Array) return seg[lado]; return 33.4; }
function kf(prop, keys) {
  var i;
  for (i = 0; i < keys.length; i++) prop.setValueAtTime(RT(keys[i][0]), keys[i][1]);
  for (i = 0; i < keys.length; i++) {
    var k = prop.nearestKeyIndex(RT(keys[i][0]));
    var so = keys[i][2] || "io";
    var si = i > 0 ? (keys[i - 1][2] || "io") : "io";
    var tOut = so == "lin" ? KeyframeInterpolationType.LINEAR : (so == "hold" ? KeyframeInterpolationType.HOLD : KeyframeInterpolationType.BEZIER);
    var tIn = si == "lin" ? KeyframeInterpolationType.LINEAR : KeyframeInterpolationType.BEZIER;
    try { prop.setInterpolationTypeAtKey(k, tIn, tOut); } catch (e) {}
    var n = 1;
    try { n = prop.keyInTemporalEase(k).length; } catch (e) {}
    var ei = [], eo = [];
    for (var d = 0; d < n; d++) { ei.push(new KeyframeEase(0, inf(si == "hold" ? "io" : si, 1))); eo.push(new KeyframeEase(0, inf(so, 0))); }
    try { prop.setTemporalEaseAtKey(k, ei, eo); } catch (e) {}
  }
}
function kfd(prop, ts, vs) {
  var tr = []; for (var q = 0; q < ts.length; q++) tr.push(RT(ts[q]));
  prop.setValuesAtTimes(tr, vs);
  for (var i = 1; i <= prop.numKeys; i++) { try { prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR); } catch (e) {} }
}
function efeito(L, nome) { return L.property("ADBE Effect Parade").addProperty(nome); }
function cor4(p, c) { try { p.setValue(hx4(c)); } catch (e) { p.setValue(hx(c)); } }
function sombra(L, c, op, dist, suav) { var f = efeito(L, "ADBE Drop Shadow"); cor4(f.property("ADBE Drop Shadow-0001"), c); f.property("ADBE Drop Shadow-0002").setValue(op); f.property("ADBE Drop Shadow-0003").setValue(180); f.property("ADBE Drop Shadow-0004").setValue(dist); f.property("ADBE Drop Shadow-0005").setValue(suav); return f; }
function texto(nome, txt, fonte, tam, c, just, track, entre) {
  var L = ALVO.layers.addText(txt); L.name = nome;
  var P = L.property("ADBE Text Properties").property("ADBE Text Document");
  var d = P.value;
  try { d.resetCharStyle(); d.resetParagraphStyle(); } catch (e) {}
  d.text = txt; d.font = fonte; d.fontSize = tam; d.applyFill = true; d.fillColor = hx(c); d.applyStroke = false;
  d.justification = just; d.tracking = track || 0;
  if (entre) { d.autoLeading = false; d.leading = entre; }
  P.setValue(d);
  return L;
}
function centra(L, x, y) { var r = L.sourceRectAtTime(0, false); tl(L).property("ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]); tl(L).property("ADBE Position").setValue([x, y]); return r; }
function importa(c) { return app.project.importFile(new ImportOptions(new File(c))); }
function mascara(L, v, it, ot, pena) { var m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); m.property("ADBE Mask Shape").setValue(forma(v, it, ot, true)); if (pena) m.property("ADBE Mask Feather").setValue(pena); return m; }
function solido(nome, c, w, h) { return ALVO.layers.addSolid(hx(c), nome, w, h, 1); }
function reordena(cont) {
  var n = cont.numProperties, k = 0, i, p;
  for (i = 1; i <= n; i++) if (cont.property(i).matchName == "ADBE Vector Group") k++;
  for (p = 1; p <= k; p++) {
    for (i = cont.numProperties; i >= p; i--) { if (cont.property(i).matchName == "ADBE Vector Group") { if (i != p) cont.property(i).moveTo(p); break; } }
  }
  for (i = 1; i <= k; i++) reordena(cont.property(i).property("ADBE Vectors Group"));
}
`;

// ---------- geradores de forma (lado do Node) ----------
const fmt = (v) => J(v);
// retângulo arredondado como caminho (pra máscara)
function retCaminho(cx, cy, w, h, r) {
  const k = 0.5523 * r;
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  const V = [[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]];
  const I = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]];
  const O = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]];
  return { V, I, O };
}
// polígono com os cantos arredondados, já como caminho (o filtro "Arredondar cantos" do AE derruba o programa)
function poliArred(pts, r) {
  const V = [], I = [], O = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const P = pts[(i - 1 + n) % n], Vt = pts[i], N = pts[(i + 1) % n];
    const un = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
    const u1 = un(P, Vt), u2 = un(N, Vt);
    const meio = Math.acos(Math.min(1, Math.max(-1, u1[0] * u2[0] + u1[1] * u2[1]))) / 2;
    const d = r / Math.tan(meio);
    const h = (4 / 3) * Math.tan((Math.PI - 2 * meio) / 4) * r;
    const Te = [Vt[0] + u1[0] * d, Vt[1] + u1[1] * d];      // entrada do canto
    const Tx = [Vt[0] + u2[0] * d, Vt[1] + u2[1] * d];      // saída do canto
    V.push(Tx, Te);                                          // a ordem do caminho começa na saída deste canto
    I.push([-u2[0] * h, -u2[1] * h], [0, 0]);
    O.push([0, 0], [-u1[0] * h, -u1[1] * h]);
  }
  // o primeiro ponto do caminho é a saída do canto 0; o par de cada canto fica (saída, entrada do próximo)
  const Vo = [], Io = [], Oo = [];
  for (let i = 0; i < n; i++) {
    Vo.push(V[i * 2]); Io.push(I[i * 2]); Oo.push(O[i * 2]);              // saída do canto i
    const j = ((i + 1) % n) * 2 + 1;
    Vo.push(V[j]); Io.push(I[j]); Oo.push(O[j]);                          // entrada do canto i+1
  }
  return { V: Vo, I: Io, O: Oo };
}
// arco aberto como caminho
function arcoCaminho(cx, cy, r, a0, a1) {
  const tr = new Trac(cx + r * Math.cos((a0 * Math.PI) / 180), cy + r * Math.sin((a0 * Math.PI) / 180));
  tr.arco(cx, cy, r, a0, a1);
  return tr;
}
// engrenagem
function engrenagem(r, dentes, prof) {
  const V = [];
  for (let i = 0; i < dentes; i++) {
    const a = (i / dentes) * 2 * Math.PI;
    const d = (Math.PI / dentes) * 0.55;
    const pts = [[a - d * 1.25, r - prof], [a - d * 0.7, r], [a + d * 0.7, r], [a + d * 1.25, r - prof]];
    for (const [ang, rr] of pts) V.push([rr * Math.cos(ang), rr * Math.sin(ang)]);
  }
  return V;
}
// estrela de quatro pontas (brilho)
function brilho(r) {
  const k = r * 0.22;
  return { V: [[0, -r], [k, -k], [r, 0], [k, k], [0, r], [-k, k], [-r, 0], [-k, -k]] };
}

// ---------- montagem ----------
emit(LIB);
emit(`var T_INS = ${T_INS}, DELTA = ${DELTA}, SEM_RT = false; function RT(t) { return !SEM_RT && t >= T_INS - 0.0001 ? t + DELTA : t; }`);
emit(`app.beginSuppressDialogs();`);
emit(`try {`);
emit(`app.beginUndoGroup("montagem");`);
emit(`app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);`);
emit(`app.newProject();`);
emit(`var COMP = app.project.items.addComp("SUFOCO-LINHA", 1080, 1920, 1, ${DUR_V}, ${FPS}); var ALVO = COMP;`);
emit(`COMP.bgColor = hx("${C.papel}"); COMP.motionBlur = true; COMP.shutterAngle = 180; COMP.motionBlurSamplesPerFrame = 12; COMP.motionBlurAdaptiveSampleLimit = 48;`);
emit(`var MUNDO = COMP.layers.addNull(); MUNDO.name = "MUNDO (câmera)"; tl(MUNDO).property("ADBE Anchor Point").setValue([0, 0]); tl(MUNDO).property("ADBE Position").setValue([0, 0]);`);
emit(`var FONTE = "Sora-Bold", FONTE8 = "Sora-ExtraBold";`);
emit(`var mundoCamadas = [];`);
// a camada nova entra no topo: a ordem do código é de baixo pra cima
const novaMundo = (nome, x = 0, y = 0, semDesfoque = false) => {
  const v = nv("L");
  emit(`var ${v} = novaForma(${J(nome)}, MUNDO, ${x}, ${y});${semDesfoque ? "" : ` mundoCamadas.push(${v});`}`);
  return v;
};
const novaEm = (nome, x = 0, y = 0) => {
  const v = nv("L");
  emit(`var ${v} = novaForma(${J(nome)}, null, ${x}, ${y});`);
  return v;
};
const novaTela = (nome, x = 0, y = 0) => {
  const v = nv("L");
  emit(`var ${v} = novaForma(${J(nome)}, null, ${x}, ${y});`);
  return v;
};
const g = (pai, nome) => {
  const v = nv("g");
  emit(`var ${v} = grp(${pai.startsWith("L") ? `H(${pai}, [])` : pai}, ${J(nome || "")});`);
  return v;
};
const opac = (L, chaves) => kf(`tl(${L}).property("ADBE Opacity")`, chaves);
const esc = (L, chaves) => kf(`tl(${L}).property("ADBE Scale")`, chaves.map(([t, s, e]) => [t, [s, s, 100], e]));
const rot = (L, chaves) => kf(`tl(${L}).property("ADBE Rotate Z")`, chaves);
const posY = (L) => { emit(`tl(${L}).property("ADBE Position").dimensionsSeparated = true;`); return `tl(${L}).property("ADBE Position_1")`; };
const posX = (L) => `tl(${L}).property("ADBE Position_0")`;
const gEsc = (gg, chaves) => kf(`tfg(${gg}).property("ADBE Vector Scale")`, chaves.map(([t, s, e]) => [t, [s, s], e]));
const gOp = (gg, chaves) => kf(`tfg(${gg}).property("ADBE Vector Group Opacity")`, chaves);
const gRot = (gg, chaves) => kf(`tfg(${gg}).property("ADBE Vector Rotation")`, chaves);
const gPos = (gg, x, y) => emit(`tfg(${gg}).property("ADBE Vector Position").setValue([${x}, ${y}]);`);
const gAnc = (gg, x, y) => emit(`tfg(${gg}).property("ADBE Vector Anchor").setValue([${x}, ${y}]);`);
const camada = (L, ini, fim) => emit(`${L}.inPoint = RT(${r3(ini)}); ${L}.outPoint = RT(${r3(fim)});`);
const sombraCartao = (L) => emit(`sombra(${L}, "${C.ink}", 34, 16, 38);`);
const sombraLeve = (L) => emit(`sombra(${L}, "${C.ink}", 28, 8, 18);`);

// ===== fundo do mundo =====
{
  const banda = (nome, y0, y1, c) => {
    const L = novaMundo(nome, 540, (y0 + y1) / 2, true);
    const gg = g(L, "faixa");
    emit(`ret(${gg}, 1400, ${y1 - y0}, 0, 0, 0); fil(${gg}, "${c}");`);
    return L;
  };
  // o céu do entardecer: papel -> pêssego -> coral queimado, em rampas
  const rampa = (nome, y0, y1, c0, c1) => {
    const v = nv("L");
    emit(`var ${v} = solido(${J(nome)}, "${c0}", 1400, ${y1 - y0}); ${v}.parent = MUNDO; tl(${v}).property("ADBE Position").setValue([540, ${(y0 + y1) / 2}]);`);
    emit(`var fr = efeito(${v}, "ADBE Ramp"); fr.property("ADBE Ramp-0001").setValue([700, 0]); cor4(fr.property("ADBE Ramp-0002"), "${c0}"); fr.property("ADBE Ramp-0003").setValue([700, ${y1 - y0}]); cor4(fr.property("ADBE Ramp-0004"), "${c1}");`);
    return v;
  };
  rampa("Céu 1 (papel ao pêssego)", 5900, 6480, C.papel, "#F9D2BC");
  rampa("Céu 2 (pêssego ao fim de tarde)", 6480, 7140, "#F9D2BC", "#EE8F6F");
  // a noite cai por cima do céu
  const noite = rampa("Céu da noite", 5000, 7140, C.ceuNoite, C.ceuBaixo);
  emit(`tl(${noite}).property("ADBE Opacity").setValue(0);`);
  opac(noite, [[T.E - 0.02, 0, "io"], [T.E + 1.3, 100, "io"]]);
  banda("Chão da noite", 7140, 11000, C.noite);
}
// trama de pontos (tela, anda com a câmera)
{
  const L = novaTela("Trama de pontos", 0, 0);
  const gg = g(L, "ponto");
  emit(`eli(${gg}, 4.6, 4.6, 20, 20); fil(${gg}, "#CBC5BC");`);
  emit(`its(${gg}).addProperty("ADBE Vector Filter - Repeater"); var rp1 = its(${gg}).property(its(${gg}).numProperties); rp1.property("ADBE Vector Repeater Copies").setValue(26); rp1.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([44, 0]);`);
  emit(`its(${gg}).addProperty("ADBE Vector Filter - Repeater"); var rp2 = its(${gg}).property(its(${gg}).numProperties); rp2.property("ADBE Vector Repeater Copies").setValue(48); rp2.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 44]);`);
  emit(`${L}.blendingMode = BlendingMode.MULTIPLY; tl(${L}).property("ADBE Opacity").setValue(55);`);
  emit(`tl(${L}).property("ADBE Position").expression = "var c = -thisComp.layer(\\"MUNDO (câmera)\\").transform.yPosition; [0, -44 - (c % 44)]";`);
}

// ===== cena 1: o relógio da tarde =====
function relogio(nome, noMundo, animado) {
  const L = noMundo ? novaMundo(nome, REL.x, REL.y) : novaTela(nome, REL.x, REL.y);
  sombraCartao(L);
  const face = g(L, "mostrador");
  emit(`eli(${face}, ${REL.r * 2}, ${REL.r * 2}, 0, 0); trc(${face}, "${C.ink}", 16); fil(${face}, "${C.branco}");`);
  // a fatia da tarde (traço grosso numa elipse, aparado do 13h até a hora)
  const fat = g(L, "fatia da tarde");
  emit(`eli(${fat}, 270, 270, 0, 0); apa(${fat}); trcReto(${fat}, "${C.coral}", 270);`);
  emit(`trimDe(${fat}).property("ADBE Vector Trim Start").setValue(${(30 / 360) * 100}); trimDe(${fat}).property("ADBE Vector Trim End").setValue(${(30 / 360) * 100});`);
  if (animado) kf(`trimDe(${fat}).property("ADBE Vector Trim End")`, [[0, (30 / 360) * 100, "hold"], [T.tarde, (30 / 360) * 100, "io"], [T.coisaFim, 50, "io"]]);
  for (let k = 0; k < 12; k++) {
    const tk = g(L, `marca ${k}`);
    const forte = k % 3 === 0;
    emit(`ret(${tk}, ${forte ? 10 : 6}, ${forte ? 30 : 18}, 3, 0, ${-(REL.r - (forte ? 34 : 28))}); fil(${tk}, "${forte ? C.ink : C.cinza}");`);
    emit(`tfg(${tk}).property("ADBE Vector Rotation").setValue(${k * 30});`);
  }
  const hHora = g(L, "ponteiro das horas");
  emit(`ret(${hHora}, 18, 150, 9, 0, -60); fil(${hHora}, "${C.ink}");`);
  const hMin = g(L, "ponteiro dos minutos");
  emit(`ret(${hMin}, 11, 222, 6, 0, -98); fil(${hMin}, "${C.ink}");`);
  const centro = g(L, "centro");
  emit(`eli(${centro}, 34, 34, 0, 0); fil(${centro}, "${C.ink}");`);
  const hh = (h) => h * 30;
  const mm = (h) => h * 360;
  emit(`tfg(${hHora}).property("ADBE Vector Rotation").setValue(${hh(9)}); tfg(${hMin}).property("ADBE Vector Rotation").setValue(${mm(9)});`);
  if (animado) {
    gRot(hHora, [[0.05, hh(9), "io"], [T.tarde - 0.12, hh(13), "hold"], [T.tarde, hh(13), "io"], [T.coisaFim, hh(18), "io"]]);
    gRot(hMin, [[0.05, mm(9), "io"], [T.tarde - 0.12, mm(13), "hold"], [T.tarde, mm(13), "io"], [T.coisaFim, mm(18), "io"]]);
    esc(L, [[0.05, 100, "o"], [0.2, 104.5, "io"], [0.42, 99, "io"], [0.6, 100, "io"], [T.tarde, 100, "o"], [T.tarde + 0.14, 105, "io"], [T.tarde + 0.36, 99, "io"], [T.tarde + 0.55, 100, "io"]]);
  }
  return L;
}
{
  relogio("Relógio", true, true);
  // o bilhete da "coisa simples"
  const B = novaMundo("Bilhete", 880, 1590);
  sombraLeve(B);
  const pap = g(B, "papel");
  emit(`ret(${pap}, 230, 230, 10, 0, 0); fil(${pap}, "${C.coral1}");`);
  const fita = g(B, "fita");
  emit(`ret(${fita}, 96, 30, 4, 0, -112); fil(${fita}, "${C.branco}", 75); tfg(${fita}).property("ADBE Vector Rotation").setValue(-6);`);
  const cx = g(B, "caixinha");
  emit(`ret(${cx}, 56, 56, 12, -58, -10); trc(${cx}, "${C.ink}", 7);`);
  const ln = g(B, "linhas");
  emit(`ret(${ln}, 74, 12, 6, 34, -20); ret(${ln}, 52, 12, 6, 23, 4); fil(${ln}, "#E7B6A2");`);
  const t0 = T.simples - 0.04;
  emit(`tl(${B}).property("ADBE Opacity").setValue(0);`);
  opac(B, [[t0, 0, "o"], [t0 + 0.12, 100, "io"]]);
  esc(B, pulo(t0, 0.42, 30, 100, 0.06));
  const by = posY(B);
  kf(by, [[t0, 1590 - 300, "o"], [t0 + 0.42, 1590, "io"]]);
  rot(B, [[t0, -40, "o"], [t0 + 0.42, 9, "io"], [T.simples + 0.5, 16, "io"], [T.simples + 0.7, 5, "io"], [T.simples + 0.9, 10.5, "io"], [T.simples + 1.1, 9, "io"]]);
  // brilhos
  [[170, 760, C.coral, T.coisaFim - 0.1], [925, 800, C.coral3, T.coisaFim]].forEach(([x, y, c, tb], i) => {
    const S1 = novaMundo(`Brilho ${i + 1}`, x, y);
    const gb = g(S1, "estrela");
    const b = brilho(26);
    emit(`poli(${gb}, ${fmt(b.V)}, true); fil(${gb}, "${c}");`);
    emit(`tl(${S1}).property("ADBE Scale").setValue([0, 0, 100]);`);
    esc(S1, [[tb, 0, "o"], [tb + 0.25, 120, "io"], [tb + 0.45, 90, "io"], [tb + 0.7, 110, "io"], [tb + 0.95, 95, "io"], [tb + 1.2, 105, "io"]]);
    rot(S1, [[tb, -40, "o"], [tb + 0.5, 0, "io"]]);
  });
}

// ===== cena 2: o site que trava =====
{
  const L = novaMundo("Site", SITE.x, SITE.y);
  sombraCartao(L);
  const jan = g(L, "janela");
  emit(`ret(${jan}, ${SITE.w}, ${SITE.h}, 34, 0, 0); fil(${jan}, "${C.branco}");`);
  const barra = g(L, "barra");
  emit(`ret(${barra}, ${SITE.w}, 104, 34, 0, ${-SITE.h / 2 + 52}); ret(${barra}, ${SITE.w}, 40, 0, 0, ${-SITE.h / 2 + 84}); fil(${barra}, "${C.cinza4}");`);
  const dots = g(L, "bolinhas");
  emit(`eli(${dots}, 18, 18, -386, ${-SITE.h / 2 + 52}); fil(${dots}, "${C.coral}");`);
  const dots2 = g(L, "bolinhas 2");
  emit(`eli(${dots2}, 18, 18, -354, ${-SITE.h / 2 + 52}); eli(${dots2}, 18, 18, -322, ${-SITE.h / 2 + 52}); fil(${dots2}, "${C.cinza2}");`);
  const end = g(L, "endereço");
  emit(`ret(${end}, 560, 48, 24, 40, ${-SITE.h / 2 + 52}); trc(${end}, "#E3DED7", 2); fil(${end}, "${C.branco}");`);
  const ende = g(L, "endereço texto");
  emit(`ret(${ende}, 220, 12, 6, -110, ${-SITE.h / 2 + 52}); fil(${ende}, "${C.cinza2}");`);
  const hero = g(L, "bloco");
  emit(`ret(${hero}, 760, 230, 22, 0, -54); fil(${hero}, "${C.cinza4}");`);
  const linhas = g(L, "linhas");
  emit(`ret(${linhas}, 600, 20, 10, -80, 100); ret(${linhas}, 520, 20, 10, -120, 138); ret(${linhas}, 380, 20, 10, -190, 176); fil(${linhas}, "${C.cinza3}");`);
  const bts = g(L, "botões");
  emit(`ret(${bts}, 330, 64, 32, -205, 242); ret(${bts}, 330, 64, 32, 205, 242); fil(${bts}, "${C.cinza3}");`);
  // o anel de carregando
  const anel = g(L, "anel");
  emit(`eli(${anel}, 112, 112, 0, -54); trc(${anel}, "${C.cinza2}", 11);`);
  const gira = g(L, "anel girando");
  emit(`eli(${gira}, 112, 112, 0, 0); apa(${gira}); trc(${gira}, "${C.coral}", 11); trimDe(${gira}).property("ADBE Vector Trim End").setValue(28);`);
  gPos(gira, 0, -54);
  gRot(gira, [[T.B - 0.15, 0, "lin"], [T.trava, 360 * 3.6, "o"], [T.trava + 0.3, 360 * 3.6 + 20, "io"]]);
  // as rachaduras, saindo do clique
  const rach = g(L, "rachaduras");
  const o = [-30, -60];
  const linhasR = [[o, [-120, -150], [-170, -175], [-260, -160]], [o, [60, -140], [140, -170]], [o, [-40, 40], [-110, 90], [-150, 160]], [o, [90, -10], [190, 40], [300, 20]], [o, [-160, -40], [-300, -20]]];
  linhasR.forEach((pts, ri) => {
    const gr = g(rach, "risco");
    emit(`poli(${gr}, ${fmt(pts)}, false); apa(${gr}); trc(${gr}, "${C.tinta}", 5);`);
    kf(`trimDe(${gr}).property("ADBE Vector Trim End")`, [[T.trava, 0, "o"], [T.trava + 0.2 + ri * 0.03, 100, "io"]]);
  });
  // o alerta
  const al = g(L, "alerta");
  emit(`eli(${al}, 70, 70, 0, 0); fil(${al}, "#E5482B");`);
  const alx = g(al, "ponto");
  emit(`ret(${alx}, 9, 26, 4.5, 0, -6); eli(${alx}, 10, 10, 0, 17); fil(${alx}, "${C.branco}");`);
  gPos(al, SITE.w / 2 - 50, -SITE.h / 2 + 52);
  emit(`tfg(${al}).property("ADBE Vector Scale").setValue([0, 0]);`);
  gEsc(al, pulo(T.trava + 0.05, 0.35, 0, 100, 0.25));
  // a janela treme no "trava"
  const sx = posX(L);
  emit(`tl(${L}).property("ADBE Position").dimensionsSeparated = true;`);
  kf(sx, [[T.trava, SITE.x, "o"], [T.trava + 0.05, SITE.x + 18, "io"], [T.trava + 0.11, SITE.x - 14, "io"], [T.trava + 0.17, SITE.x + 10, "io"], [T.trava + 0.24, SITE.x - 6, "io"], [T.trava + 0.32, SITE.x, "io"]]);
  // a janela entra
  esc(L, [[T.B, 94, "o"], [T.B + 0.3, 101, "io"], [T.B + 0.45, 100, "io"]]);
  // a seta do mouse
  const M = novaMundo("Seta", 0, 0);
  sombraLeve(M);
  const sg = g(M, "seta");
  emit(`poli(${sg}, [[0,0],[0,52],[13,40],[23,61],[33,56],[23,36],[41,36]], true); trc(${sg}, "${C.ink}", 4); fil(${sg}, "${C.branco}");`);
  emit(`tl(${M}).property("ADBE Position").dimensionsSeparated = true;`);
  const alvo1 = [SITE.x - 130, SITE.y - SITE.h / 2 + 60];
  const alvo2 = [SITE.x - 30, SITE.y - 60];
  kf(posX(M), [[T.B + 0.1, alvo1[0] + 420, "io"], [T.B + 0.52, alvo1[0], "hold"], [T.clique + 0.3, alvo1[0], "io"], [T.clique + 0.62, alvo2[0], "io"]]);
  kf(`tl(${M}).property("ADBE Position_1")`, [[T.B + 0.1, alvo1[1] + 720, "io"], [T.B + 0.52, alvo1[1], "hold"], [T.clique + 0.3, alvo1[1], "io"], [T.clique + 0.62, alvo2[1], "io"]]);
  const cliques = [T.clique, T.trava + 0.36, T.trava + 0.54, T.trava + 0.72];
  const ks = [];
  cliques.forEach((tc) => { ks.push([tc - 0.01, 100, "io"], [tc + 0.05, 84, "io"], [tc + 0.13, 100, "io"]); });
  esc(M, ks);
  camada(M, T.B, 6.2);
}

// ===== cena 3: a ligação que cai =====
{
  // ondas do toque
  const W = novaMundo("Ondas do toque", FONE.x, FONE.y - 20);
  emit(`var ondasG = [];`);
  [-1, 1].forEach((lado) => {
    [70, 112, 154].forEach((r, i) => {
      const gg = g(W, `onda ${lado} ${i}`);
      const a0 = lado < 0 ? 150 : -30;
      const a1 = lado < 0 ? 210 : 30;
      const tr = arcoCaminho(0, 0, r, a0, a1);
      emit(`cam(${gg}, ${fmt(tr.V)}, ${fmt(tr.I)}, ${fmt(tr.O)}, false); trc(${gg}, "${C.coral3}", 10);`);
      gPos(gg, lado * 230, 0);
      const ks = [[T.C, 0, "o"]];
      for (let c = 0; c < 3; c++) {
        const tb = T.liga + c * 0.38 + i * 0.07;
        ks.push([tb, 0, "o"], [tb + 0.1, 100, "io"], [tb + 0.32, 0, "io"]);
      }
      gOp(gg, ks);
    });
  });
  camada(W, T.C, T.cai + 0.2);
  // o fone
  const L = novaMundo("Telefone", FONE.x, FONE.y);
  sombraCartao(L);
  const cabo = g(L, "alça");
  emit(`cam(${cabo}, [[-165,34],[165,34]], [[0,0],[-60,-110]], [[60,-110],[0,0]], false); trc(${cabo}, "${C.coral}", 62);`);
  [[-1, -26], [1, 26]].forEach(([lado, ang]) => {
    const cp = g(L, lado < 0 ? "fone de ouvido" : "bocal");
    emit(`ret(${cp}, 132, 78, 34, 0, 0); fil(${cp}, "${C.coral}");`);
    gPos(cp, lado * 172, 62);
    emit(`tfg(${cp}).property("ADBE Vector Rotation").setValue(${ang});`);
  });
  const brilhoF = g(L, "reflexo");
  emit(`cam(${brilhoF}, [[-120,6],[110,6]], [[0,0],[-50,-76]], [[50,-76],[0,0]], false); trc(${brilhoF}, "#FF8F6E", 9);`);
  // toca (vibra) e cai
  const ks = [[T.C, -12, "io"]];
  for (let t = T.liga; t < T.cai - 0.2; t += 0.05) ks.push([t, -12 + (Math.round((t - T.liga) / 0.05) % 2 === 0 ? 6 : -6), "io"]);
  ks.push([T.cai - 0.15, -12, "io"], [T.cai, -12, "i"], [T.cai + 0.29, 6, "o"], [T.cai + 0.43, 2, "io"], [T.cai + 0.58, 6, "io"], [T.cai + 0.73, 5, "io"]);
  rot(L, ks);
  const fy = posY(L);
  const pousa = FONE.y + 180;
  kf(fy, [[T.cai, FONE.y, "i"], [T.cai + 0.29, pousa, "o"], [T.cai + 0.43, pousa - 46, "i"], [T.cai + 0.58, pousa, "o"], [T.cai + 0.65, pousa - 12, "i"], [T.cai + 0.73, pousa, "io"]]);
  esc(L, [[T.C, 92, "o"], [T.C + 0.3, 101, "io"], [T.C + 0.45, 100, "io"], [T.liga, 100, "io"], [T.liga + 0.1, 104, "io"], [T.liga + 0.3, 100, "io"]]);
}

// ===== cena 4: a fila =====
{
  // a porta
  const P = novaMundo("Porta", 940, CHAO.y);
  const pf = g(P, "batente");
  emit(`ret(${pf}, 150, 270, 8, 0, -135); trc(${pf}, "${C.tinta}", 8); fil(${pf}, "#3A3D44");`);
  const pm = g(P, "maçaneta");
  emit(`eli(${pm}, 15, 15, 44, -126); fil(${pm}, "${C.luz}");`);
  const ps = g(P, "placa");
  emit(`ret(${ps}, 90, 26, 10, 0, -300); fil(${ps}, "${C.tinta}");`);
  emit(`tl(${P}).property("ADBE Scale").setValue([0, 0, 100]);`);
  esc(P, pulo(T.D + 0.05, 0.36, 0, 100, 0.1));
  // as pessoas (a fila anda pra direita) e você no fim, em coral
  const xs = [];
  for (let i = 0; i < 6; i++) xs.push(300 + i * 104);
  const pessoa = (nome, x, cor, voce) => {
    const L = novaMundo(nome, x, CHAO.y - 5);
    emit(`tl(${L}).property("ADBE Scale").setValue([135, 135, 100]);`);
    const corpo = g(L, "corpo");
    emit(`ret(${corpo}, 74, 118, 34, 0, -62); fil(${corpo}, "${cor}");`);
    const cab = g(L, "cabeça");
    emit(`eli(${cab}, 54, 54, 0, -150); fil(${cab}, "${cor}");`);
    if (voce) {
      const olhos = g(L, "olhos");
      emit(`eli(${olhos}, 9, 12, -10, -152); eli(${olhos}, 9, 12, 10, -152); fil(${olhos}, "${C.branco}");`);
    }
    return L;
  };
  // quando a ponta da linha passa embaixo de cada x do chão (a mesma conta do Aparar)
  const pChao = (x) => T.D + 0.05 + ((x - CHAO.x0) / (CHAO.x1 - CHAO.x0)) * (9.35 - (T.D + 0.05));
  const andar = (L, x0) => {
    const px = posX(L);
    emit(`tl(${L}).property("ADBE Position").dimensionsSeparated = true;`);
    const passos = 7;
    const ks = [[T.anda, x0, "lin"]];
    const ky = [[T.anda, CHAO.y - 5, "io"]];
    for (let i = 1; i <= passos; i++) {
      const t = T.anda + (i / passos) * T.durAnda;
      ks.push([t, x0 + (36 * i) / passos, "lin"]);
      ky.push([t - (0.5 / passos) * T.durAnda, CHAO.y - 13, "io"], [t, CHAO.y - 5, "io"]);
    }
    kf(px, ks);
    kf(`tl(${L}).property("ADBE Position_1")`, ky);
  };
  xs.forEach((x, i) => {
    const L = pessoa(`Pessoa ${i + 1}`, x, i % 2 ? C.cinza : "#BDB8B0", false);
    emit(`tl(${L}).property("ADBE Scale").setValue([0, 0, 100]);`);
    esc(L, pulo(pChao(x) - 0.08, 0.3, 0, 135, 0.12));
    andar(L, x);
  });
  const V = pessoa("Você (na fila)", 170, C.coral, true);
  emit(`tl(${V}).property("ADBE Scale").setValue([0, 0, 100]);`);
  esc(V, [...pulo(pChao(170) - 0.06, 0.32, 0, 135, 0.14), [T.fila + 0.4, 135, "io"], [T.fila + 0.75, 129, "io"], [T.fila + 1.1, 135, "io"]]);
  andar(V, 170);
  // o suspiro: os três pontinhos
  const SP = novaMundo("Suspiro", 206, CHAO.y - 300);
  const bal = g(SP, "balão");
  emit(`ret(${bal}, 92, 50, 25, 0, 0); fil(${bal}, "${C.branco}");`);
  emit(`sombra(${SP}, "${C.ink}", 30, 5, 12);`);
  [-22, 0, 22].forEach((dx, i) => {
    const d = g(SP, `ponto ${i}`);
    emit(`eli(${d}, 11, 11, ${dx}, 0); fil(${d}, "${C.tinta}");`);
    gOp(d, [[T.fila + 0.5 + i * 0.12, 0, "o"], [T.fila + 0.62 + i * 0.12, 100, "io"]]);
  });
  emit(`tl(${SP}).property("ADBE Scale").setValue([0, 0, 100]);`);
  esc(SP, pulo(T.fila + 0.38, 0.3, 0, 100, 0.15));
  emit(`tl(${SP}).property("ADBE Position").dimensionsSeparated = true;`);
  kf(posX(SP), [[T.anda, 206, "lin"], [T.anda + T.durAnda, 242, "lin"]]);
}

// ===== cena 5: o fim do dia =====
{
  // o sol desce atrás dos prédios
  const SO = novaMundo("Sol", 560, 6720);
  const gl = g(SO, "brilho");
  emit(`eli(${gl}, 460, 460, 0, 0); fil(${gl}, "#F7A47C", 30);`);
  const sol = g(SO, "sol");
  emit(`eli(${sol}, 270, 270, 0, 0); fil(${sol}, "#F58A5E");`);
  const sy = posY(SO);
  kf(sy, [[T.E - 0.07, 6720, "i"], [T.E + 1.25, 7150, "io"]]);
  // estrelas
  const ES = novaMundo("Estrelas", 0, 0, true);
  const estrelas = [[120, 6150], [260, 6330], [410, 6110], [520, 6420], [690, 6200], [820, 6380], [960, 6140], [180, 6560], [880, 6620], [600, 6650], [330, 6700], [760, 6760], [80, 6800], [1000, 6820]];
  estrelas.forEach(([x, y], i) => {
    const gg = g(ES, `estrela ${i}`);
    emit(`eli(${gg}, ${i % 3 ? 5 : 8}, ${i % 3 ? 5 : 8}, ${x}, ${y}); fil(${gg}, "${C.branco}");`);
    const t = T.E + 0.6 + (i % 7) * 0.12;
    gOp(gg, [[t, 0, "o"], [t + 0.3, 90, "io"], [t + 0.8, 45, "io"], [t + 1.3, 90, "io"], [t + 1.9, 55, "io"], [t + 2.5, 90, "io"]]);
  });
  // os prédios: silhueta embaixo do horizonte que a linha desenha
  const PR = novaMundo("Prédios", 0, 0, true);
  const pg = g(PR, "silhueta");
  const sil = [...SKY, [40, HORIZ + 300], [1050, HORIZ + 300]];
  emit(`poli(${pg}, ${fmt(sil)}, true); fil(${pg}, "${C.predio}");`);
  emit(`tl(${PR}).property("ADBE Opacity").setValue(0);`);
  opac(PR, [[10.85, 0, "io"], [11.6, 100, "io"]]);
  // as janelas acendem
  const JA = novaMundo("Janelas", 0, 0, true);
  const janelas = [];
  for (let b = 0; b < SKY.length - 1; b++) {
    const [xa, ya] = SKY[b];
    const [xb, yb] = SKY[b + 1];
    if (Math.abs(ya - yb) > 0.5 || Math.abs(xa - xb) < 80) continue;
    const x0 = Math.min(xa, xb) + 22, x1 = Math.max(xa, xb) - 22;
    const nc = Math.max(1, Math.floor((x1 - x0) / 34));
    for (let c = 0; c <= nc; c++) for (let r = 0; r < 5; r++) janelas.push([x0 + ((x1 - x0) * c) / nc, ya + 34 + r * 46]);
  }
  janelas.forEach(([x, y], i) => {
    const gg = g(JA, `janela ${i}`);
    emit(`ret(${gg}, 14, 20, 3, ${x}, ${y}); fil(${gg}, "${C.luz}");`);
    const t = T.E + 0.5 + (((i * 37) % janelas.length) / janelas.length) * 0.9;
    emit(`tfg(${gg}).property("ADBE Vector Group Opacity").setValue(0);`);
    if ((i * 13) % 5 !== 0) gOp(gg, [[t, 0, "o"], [t + 0.08, 100, "io"]]);
  });
  // o bilhete de "nada resolvido": desenhado numa pré-composição e picotado em pedacinhos (máscaras), que caem girando
  emit(`var NB = app.project.items.addComp("Bilhete do fim do dia (desenho)", 360, 360, 1, ${DUR_V}, ${FPS}); ALVO = NB;`);
  const B = novaEm("Bilhete", 180, 180);
  const pap = g(B, "papel");
  emit(`ret(${pap}, 300, 300, 12, 0, 0); fil(${pap}, "${C.coral1}");`);
  const fita = g(B, "fita");
  emit(`ret(${fita}, 120, 34, 4, 0, -146); fil(${fita}, "${C.branco}", 75); tfg(${fita}).property("ADBE Vector Rotation").setValue(5);`);
  const cx = g(B, "caixinha");
  emit(`ret(${cx}, 74, 74, 16, -70, -20); trc(${cx}, "${C.ink}", 8);`);
  const vi = g(B, "visto que não fecha");
  emit(`poli(${vi}, [[-96,-22],[-74,2],[-38,-44]], false); apa(${vi}); trc(${vi}, "${C.coral6}", 10);`);
  kf(`trimDe(${vi}).property("ADBE Vector Trim End")`, [[T.nada + 0.18, 0, "o"], [T.nada + 0.34, 45, "hold"], [T.nada + 0.38, 45, "i"], [T.nada + 0.5, 0, "io"]]);
  const ln = g(B, "linhas");
  emit(`ret(${ln}, 96, 14, 7, 50, -32); ret(${ln}, 70, 14, 7, 37, -2); ret(${ln}, 200, 14, 7, 0, 70); fil(${ln}, "#E7B6A2");`);
  emit(`ALVO = COMP;`);
  // o bilhete inteiro: um nulo no mundo, com a entrada; os pedaços são filhos dele
  emit(`var NBN = COMP.layers.addNull(); NBN.name = "Bilhete do fim do dia"; NBN.parent = MUNDO; tl(NBN).property("ADBE Anchor Point").setValue([0, 0]); tl(NBN).property("ADBE Position").setValue([540, 7270]);`);
  esc("NBN", pulo(T.nada - 0.07, 0.36, 50, 100, 0.06));
  emit(`tl(NBN).property("ADBE Position").dimensionsSeparated = true;`);
  kf(`tl(NBN).property("ADBE Position_1")`, [[T.nada - 0.07, 7410, "o"], [T.nada + 0.29, 7270, "io"]]);
  // a tensão antes do corte
  const tc = T.nada + 0.58;
  kf(`tl(NBN).property("ADBE Position_0")`, [[tc - 0.14, 540, "io"], [tc - 0.1, 547, "io"], [tc - 0.06, 534, "io"], [tc - 0.02, 544, "io"], [tc, 540, "io"]]);
  // a grade dos cortes (pontos internos tortos e o meio de cada aresta torto, divididos entre os vizinhos)
  const rnd = (i, sx) => { const x = Math.sin(i * 12.9898 + sx * 78.233) * 43758.5453; return x - Math.floor(x); };
  const GX = [0, 128, 236, 360];
  const GY = [0, 98, 176, 262, 360];
  const P = (i, j) => {
    const borda = i === 0 || j === 0 || i === GX.length - 1 || j === GY.length - 1;
    if (borda) return [GX[i], GY[j]];
    return [GX[i] + (rnd(i * 7 + j, 1) - 0.5) * 36, GY[j] + (rnd(i * 7 + j, 2) - 0.5) * 30];
  };
  const meio = (a, b, k, borda) => {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (borda) return m;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const j = (rnd(k, 3) - 0.5) * 26;
    return [m[0] - (dy / l) * j, m[1] + (dx / l) * j];
  };
  const H = (i, j) => meio(P(i, j), P(i + 1, j), 100 + i * 9 + j, j === 0 || j === GY.length - 1);
  const V = (i, j) => meio(P(i, j), P(i, j + 1), 300 + i * 9 + j, i === 0 || i === GX.length - 1);
  // as linhas do corte riscam o bilhete antes de abrir
  const CORTE = [];
  for (let j = 1; j < GY.length - 1; j++) { const pts = []; for (let i = 0; i < GX.length - 1; i++) pts.push(P(i, j), H(i, j)); pts.push(P(GX.length - 1, j)); CORTE.push(pts); }
  for (let i = 1; i < GX.length - 1; i++) { const pts = []; for (let j = 0; j < GY.length - 1; j++) pts.push(P(i, j), V(i, j)); pts.push(P(i, GY.length - 1)); CORTE.push(pts); }
  const pedacos = [];
  for (let j = 0; j < GY.length - 1; j++) for (let i = 0; i < GX.length - 1; i++) {
    const pol = [P(i, j), H(i, j), P(i + 1, j), V(i + 1, j), P(i + 1, j + 1), H(i, j + 1), P(i, j + 1), V(i, j)];
    const c = pol.reduce((a, p) => [a[0] + p[0] / pol.length, a[1] + p[1] / pol.length], [0, 0]);
    pedacos.push({ pol, c, k: pedacos.length });
  }
  const zeros = (n) => Array.from({ length: n }, () => [0, 0]);
  pedacos.forEach(({ pol, c, k }) => {
    const v = nv("PB");
    emit(`var ${v} = COMP.layers.add(NB); ${v}.name = "Bilhete: pedaço ${k + 1}"; ${v}.parent = NBN; mundoCamadas.push(${v}); tl(${v}).property("ADBE Scale").setValue([100, 100, 100]); tl(${v}).property("ADBE Rotate Z").setValue(0);`);
    emit(`tl(${v}).property("ADBE Anchor Point").setValue([${c[0]}, ${c[1]}]); tl(${v}).property("ADBE Position").setValue([${c[0] - 180}, ${c[1] - 180}]);`);
    emit(`mascara(${v}, ${fmt(pol)}, ${fmt(zeros(pol.length))}, ${fmt(zeros(pol.length))}, null);`);
    emit(`sombra(${v}, "${C.ink}", 24, 6, 14);`);
    // a queda: estoura pra fora, sobe um pouco e cai com gravidade, girando, e some
    const dx = c[0] - 180, dy = c[1] - 180;
    const l = Math.hypot(dx, dy) || 1;
    const vel = 170 + rnd(k, 4) * 190;
    const vx = (dx / l) * vel, vy = (dy / l) * vel * 0.6 - 300 - rnd(k, 5) * 160;
    const giro = (rnd(k, 6) - 0.5) * 900;
    const ts = [], xs = [], ys = [], rs = [];
    for (let u = 0; u <= 0.95; u += 1 / FPS) {
      ts.push(tc + u);
      xs.push(c[0] - 180 + vx * u);
      ys.push(c[1] - 180 + vy * u + 0.5 * 2800 * u * u);
      rs.push(giro * u);
    }
    emit(`tl(${v}).property("ADBE Position").dimensionsSeparated = true;`);
    kfd(`tl(${v}).property("ADBE Position_0")`, ts, xs);
    kfd(`tl(${v}).property("ADBE Position_1")`, ts, ys);
    kfd(`tl(${v}).property("ADBE Rotate Z")`, ts, rs);
    emit(`tl(${v}).property("ADBE Opacity").setValue(0);`);
    opac(v, [[T.nada - 0.07, 0, "o"], [T.nada + 0.1, 100, "hold"], [tc + 0.3, 100, "io"], [tc + 0.85, 0, "io"]]);
    camada(v, T.nada - 0.1, tc + 1);
  });
  // os riscos do corte, por cima do bilhete, logo antes de abrir
  const RC = novaMundo("Bilhete: riscos do corte", 0, 0);
  emit(`${RC}.parent = NBN; tl(${RC}).property("ADBE Position").setValue([0, 0]); tl(${RC}).property("ADBE Scale").setValue([100, 100, 100]);`);
  CORTE.forEach((pts, i) => {
    const gc = g(RC, `corte ${i + 1}`);
    emit(`poli(${gc}, ${fmt(pts.map(([x, y]) => [x - 180, y - 180]))}, false); apa(${gc}); trc(${gc}, "${C.branco}", 5);`);
    kf(`trimDe(${gc}).property("ADBE Vector Trim End")`, [[tc - 0.13 + i * 0.02, 0, "o"], [tc - 0.03 + i * 0.02, 100, "io"]]);
  });
  camada(RC, tc - 0.15, tc + 0.04);
}

// ===== cena 6: a empresa parada =====
{
  const EM = novaMundo("Empresa", 0, 0);
  const corpo = g(EM, "fachada");
  emit(`ret(${corpo}, ${EMP.x1 - EMP.x0 - 10}, ${EMP.chao - EMP.topo - 70}, 6, ${(EMP.x0 + EMP.x1) / 2}, ${(EMP.topo + 70 + EMP.chao) / 2}); fil(${corpo}, "${C.claro}");`);
  const tol = g(EM, "toldo");
  const nT = 8;
  const wT = (EMP.x1 - EMP.x0 - 10) / nT;
  for (let i = 0; i < nT; i++) emit(`ret(${tol}, ${wT}, 64, 0, ${EMP.x0 + 5 + wT * (i + 0.5)}, ${EMP.topo + 40}); `);
  emit(`fil(${tol}, "${C.coral}");`);
  const tol2 = g(EM, "toldo listras");
  for (let i = 1; i < nT; i += 2) emit(`ret(${tol2}, ${wT}, 64, 0, ${EMP.x0 + 5 + wT * (i + 0.5)}, ${EMP.topo + 40});`);
  emit(`fil(${tol2}, "${C.branco}");`);
  const bordas = g(EM, "babado");
  for (let i = 0; i < nT; i++) emit(`eli(${bordas}, ${wT}, ${wT * 0.7}, ${EMP.x0 + 5 + wT * (i + 0.5)}, ${EMP.topo + 72});`);
  emit(`fil(${bordas}, "${C.coral}");`);
  const porta = g(EM, "porta");
  emit(`ret(${porta}, 118, 186, 8, ${(EMP.x0 + EMP.x1) / 2}, ${EMP.chao - 93}); fil(${porta}, "#3A3D44");`);
  const jan = g(EM, "janelas acesas");
  emit(`ret(${jan}, 150, 112, 10, ${EMP.x0 + 110}, ${EMP.chao - 175}); ret(${jan}, 150, 112, 10, ${EMP.x1 - 110}, ${EMP.chao - 175}); fil(${jan}, "${C.luz}");`);
  gOp(jan, [[T.parada + 0.08, 100, "lin"], [T.parada + 0.13, 15, "lin"], [T.parada + 0.16, 15, "lin"], [T.parada + 0.21, 75, "lin"], [T.parada + 0.24, 75, "o"], [T.parada + 0.42, 0, "io"]]);
  const jfr = g(EM, "janelas caixilho");
  emit(`ret(${jfr}, 150, 112, 10, ${EMP.x0 + 110}, ${EMP.chao - 175}); ret(${jfr}, 150, 112, 10, ${EMP.x1 - 110}, ${EMP.chao - 175}); trc(${jfr}, "#3A3D44", 8); fil(${jfr}, "#4A4D58");`);
  // a fachada aparece quando a linha fecha o contorno
  emit(`tl(${EM}).property("ADBE Opacity").setValue(0);`);
  opac(EM, [[13.35, 0, "io"], [13.62, 100, "io"]]);
  // engrenagens no telhado
  const ENG = (nome, x, y, r, dentes, sentido) => {
    const L = novaMundo(nome, x, y);
    const gg = g(L, "dentes");
    emit(`poli(${gg}, ${fmt(engrenagem(r, dentes, r * 0.22))}, true); fil(${gg}, "${C.aco}");`);
    const fu = g(L, "furo");
    emit(`eli(${fu}, ${r * 0.62}, ${r * 0.62}, 0, 0); fil(${fu}, "${C.noite}");`);
    emit(`tl(${L}).property("ADBE Scale").setValue([0, 0, 100]);`);
    esc(L, pulo(13.45, 0.3, 0, 100, 0.12));
    const vel = (sentido * 2.6 * 360) / (r / 50) / (T.parada - (T.F - 0.23));
    const tsG = [], vsG = [];
    for (let t = T.F - 0.23; t <= T.parada + 0.6; t += 1 / FPS) {
      const a = t <= T.parada ? vel * (t - (T.F - 0.23)) : vel * (T.parada - (T.F - 0.23)) + (vel / 7) * (1 - Math.exp(-7 * (t - T.parada)));
      tsG.push(t); vsG.push(a);
    }
    kfd(`tl(${L}).property("ADBE Rotate Z")`, tsG, vsG);
    return L;
  };
  ENG("Engrenagem grande", 330, EMP.topo - 52, 50, 10, 1);
  ENG("Engrenagem pequena", 420, EMP.topo - 74, 34, 8, -1);
  // pausado, como no YouTube: o play num círculo escuro por cima da fachada
  const PA = novaMundo("Pausado (como no YouTube)", (EMP.x0 + EMP.x1) / 2, (EMP.topo + EMP.chao) / 2 + 30);
  const pc = g(PA, "círculo");
  emit(`eli(${pc}, 168, 168, 0, 0); fil(${pc}, "#000000", 58);`);
  const pt = g(PA, "play");
  const play = poliArred([[-24, -38], [42, 0], [-24, 38]], 7);
  emit(`cam(${pt}, ${fmt(play.V)}, ${fmt(play.I)}, ${fmt(play.O)}, true); fil(${pt}, "${C.branco}");`);
  gPos(pt, 6, 0);
  emit(`tl(${PA}).property("ADBE Scale").setValue([0, 0, 100]);`);
  esc(PA, pulo(T.parada + 0.2, 0.42, 0, 100, 0.12));
  // a ampulheta
  const AM = novaMundo("Ampulheta", 880, EMP.chao - 104);
  const vid = g(AM, "vidro");
  emit(`poli(${vid}, [[-48,-84],[48,-84],[6,0],[48,84],[-48,84],[-6,0]], true); trc(${vid}, "${C.aco}", 7); fil(${vid}, "${C.branco}", 14);`);
  const areiaB = g(AM, "areia de baixo");
  emit(`poli(${areiaB}, [[-40,80],[40,80],[0,30]], true); fil(${areiaB}, "${C.coral}");`);
  gAnc(areiaB, 0, 80); gPos(areiaB, 0, 80);
  const areiaC = g(AM, "areia de cima");
  emit(`poli(${areiaC}, [[-38,-80],[38,-80],[0,-12]], true); fil(${areiaC}, "${C.coral}");`);
  gAnc(areiaC, 0, -12); gPos(areiaC, 0, -12);
  emit(`tfg(${areiaC}).property("ADBE Vector Scale").setValue([0, 0]);`);
  const fio = g(AM, "fio de areia");
  emit(`ret(${fio}, 5, 70, 2, 0, 44); fil(${fio}, "${C.coral}");`);
  emit(`tfg(${fio}).property("ADBE Vector Group Opacity").setValue(0);`);
  const tamp = g(AM, "tampas");
  emit(`ret(${tamp}, 128, 16, 8, 0, -92); ret(${tamp}, 128, 16, 8, 0, 92); fil(${tamp}, "#3A3D44");`);
  emit(`tl(${AM}).property("ADBE Opacity").setValue(0);`);
  opac(AM, [[T.esperando - 0.04, 0, "o"], [T.esperando + 0.1, 100, "io"]]);
  emit(`tl(${AM}).property("ADBE Position").dimensionsSeparated = true;`);
  kf(`tl(${AM}).property("ADBE Position_1")`, [[T.esperando - 0.04, EMP.chao - 34, "o"], [T.esperando + 0.3, EMP.chao - 104, "io"]]);
  rot(AM, [[T.esperando - 0.04, -14, "o"], [T.esperando + 0.3, 0, "io"], [T.esperando + 0.18 + 0.12, 0, "io"], [T.esperando + 0.75, 180, "io"]]);
  // depois da virada, a areia (agora em cima) escorre: a de "baixo" (local) esvazia, a de "cima" (local) enche
  gEsc(areiaB, [[T.esperando + 0.8, 100, "lin"], [T.esperando + 1.5, 0, "lin"]]);
  gEsc(areiaC, [[T.esperando + 0.8, 0, "lin"], [T.esperando + 1.5, 100, "lin"]]);
  gOp(fio, [[T.esperando + 0.78, 0, "lin"], [T.esperando + 0.82, 100, "hold"], [T.esperando + 1.5, 100, "lin"], [T.esperando + 1.55, 0, "lin"]]);
}

// ===== a íris coral (o Legalizaí) =====
{
  const IR = novaMundo("Íris coral", 1035, 8880, true);
  const gg = g(IR, "círculo");
  emit(`eli(${gg}, 5200, 5200, 0, 0); fil(${gg}, "${C.coral}");`);
  emit(`tl(${IR}).property("ADBE Scale").setValue([0, 0, 100]);`);
  esc(IR, [[T.G, 0, "o"], [T.G + 0.6, 100, "io"]]);
}
// ===== cena 7: o celular construído =====
{
  // raios
  const RA = novaMundo("Raios", CEL.x, CEL.y, true);
  for (let i = 0; i < 20; i++) {
    const gg = g(RA, `raio ${i}`);
    const a = (i / 20) * 2 * Math.PI;
    const w = 0.07;
    emit(`poli(${gg}, ${fmt([[0, 0], [1500 * Math.cos(a - w), 1500 * Math.sin(a - w)], [1500 * Math.cos(a + w), 1500 * Math.sin(a + w)]])}, true); fil(${gg}, "${C.branco}", ${i % 2 ? 9 : 14});`);
  }
  emit(`tl(${RA}).property("ADBE Opacity").setValue(0);`);
  opac(RA, [[T.legalizai - 0.03, 0, "o"], [T.legalizai + 0.35, 100, "io"]]);
  rot(RA, [[T.legalizai - 0.03, 0, "lin"], [DUR, 14 * (DUR - T.legalizai), "lin"]]);
  // as guias da construção: contorno duplo, linhas de projeto e marcas nos cantos (a construção mais intensa)
  {
    const GU = novaMundo("Construção do celular (guias)", 0, 0, true);
    const x0 = CEL.x - CEL.w / 2, x1 = CEL.x + CEL.w / 2, y0 = CEL.y - CEL.h / 2, y1 = CEL.y + CEL.h / 2;
    const guias = [[[-60, y0], [1140, y0]], [[1140, y1], [-60, y1]], [[x0, 8540], [x0, 10480]], [[x1, 10480], [x1, 8540]]];
    guias.forEach((pts, i) => {
      const gg = g(GU, `guia ${i + 1}`);
      emit(`poli(${gg}, ${fmt(pts)}, false); apa(${gg}); trc(${gg}, "${C.branco}", 3, 50);`);
      kf(`trimDe(${gg}).property("ADBE Vector Trim End")`, [[15.3 + i * 0.08, 0, "o"], [15.66 + i * 0.08, 100, "io"]]);
    });
    // o contorno de fora, no sentido contrário
    const rc = retCaminho(CEL.x, CEL.y, CEL.w + 70, CEL.h + 70, CEL.r + 35);
    const V = [...rc.V].reverse(), I = [...rc.O].reverse(), O = [...rc.I].reverse();
    const ct = g(GU, "contorno de fora");
    emit(`cam(${ct}, ${fmt(V)}, ${fmt(I)}, ${fmt(O)}, true); apa(${ct}); trc(${ct}, "${C.branco}", 5, 70);`);
    kf(`trimDe(${ct}).property("ADBE Vector Trim End")`, [[15.38, 0, "o"], [16.1, 100, "io"]]);
    // marcas nos cruzamentos
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(([x, y], i) => {
      const gm = g(GU, `marca ${i + 1}`);
      emit(`eli(${gm}, 18, 18, 0, 0); fil(${gm}, "${C.branco}");`);
      gPos(gm, x, y);
      emit(`tfg(${gm}).property("ADBE Vector Scale").setValue([0, 0]);`);
      gEsc(gm, pulo(15.72 + i * 0.05, 0.26, 0, 100, 0.3));
    });
    // o pulso quando o contorno fecha
    const pu = g(GU, "pulso");
    emit(`cam(${pu}, ${fmt(rc.V)}, ${fmt(rc.I)}, ${fmt(rc.O)}, true); trc(${pu}, "${C.branco}", 6);`);
    gAnc(pu, CEL.x, CEL.y); gPos(pu, CEL.x, CEL.y);
    gEsc(pu, [[16.18, 92, "o"], [16.6, 118, "io"]]);
    gOp(pu, [[16.17, 0, "lin"], [16.18, 90, "o"], [16.6, 0, "io"]]);
    opac(GU, [[16.25, 100, "io"], [16.7, 0, "io"]]);
    camada(GU, 15.25, 16.75);
  }
  // a linha que sai de trás do celular (criada antes dele, pra ficar atrás)
  criaSegmento(segmentos.find((sg) => sg.opc.cedo));
  // a luz atrás do produto
  {
    const LZ = novaMundo("Luz atrás do celular", CEL.x, CEL.y, true);
    const gl = g(LZ, "luz");
    emit(`eli(${gl}, 760, 1260, 0, 0); fil(${gl}, "${C.branco}");`);
    emit(`var blz = efeito(${LZ}, "ADBE Gaussian Blur 2"); blz.property("ADBE Gaussian Blur 2-0001").setValue(110); blz.property("ADBE Gaussian Blur 2-0003").setValue(0);`);
    emit(`tl(${LZ}).property("ADBE Opacity").setValue(0);`);
    opac(LZ, [[T.legalizai - 0.05, 0, "o"], [T.legalizai + 0.45, 26, "io"]]);
  }
  // v5: o celular é 3D (iPhone, three.js no Remotion; o AE desta máquina não renderiza modelo 3D). Sequência PNG
  // com alfa, em 2x, 30 fps, de 15,55 a 24,75 s do vídeo (já no tempo novo): as peças montando no contorno, a tela
  // acendendo com os blocos, a home, o giro de produto e as quatro telas das funcionalidades estão no próprio 3D.
  // Origem: precificacao-2026-10-02/remotion/src/sufoco/CelularSufoco.tsx + mistura-120-30.py (desfoque de movimento).
  emit(`var opSeq = new ImportOptions(new File("${ASSETS}/celular-3d/cel_0000.png")); opSeq.sequence = true; var seqCel = app.project.importFile(opSeq);`);
  emit(`seqCel.mainSource.conformFrameRate = ${FPS}; seqCel.mainSource.alphaMode = AlphaMode.STRAIGHT; seqCel.name = "celular-3d (iPhone, Remotion)";`);
  emit(`var CEP = COMP.layers.add(seqCel); CEP.name = "Celular 3D (iPhone)"; CEP.parent = MUNDO; CEP.startTime = 15.55; tl(CEP).property("ADBE Anchor Point").setValue([800, 1200]); tl(CEP).property("ADBE Position").setValue([${CEL.x}, ${CEL.y}]); tl(CEP).property("ADBE Scale").setValue([50, 50, 100]); mundoCamadas.push(CEP);`);
  emit(`sombra(CEP, "#9E2F14", 60, 36, 80);`);
  emit(`tl(CEP).property("ADBE Opacity").setValue(0);`);
  opac("CEP", [[15.6, 0, "io"], [15.72, 100, "io"]]);
  kf(`tl(CEP).property("ADBE Scale")`, [[T.construindo, [50, 50, 100], "io"], [T.construindo + 0.12, [51.5, 51.5, 100], "io"], [T.construindo + 0.3, [50, 50, 100], "io"],
    [T.legalizai, [50, 50, 100], "o"], [T.legalizai + 0.12, [52.5, 52.5, 100], "io"], [T.legalizai + 0.32, [50, 50, 100], "io"]]);
  // o clarão
  const CL = novaMundo("Clarão", CEL.x, CEL.y, true);
  const cg = g(CL, "clarão");
  emit(`eli(${cg}, 600, 600, 0, 0); fil(${cg}, "${C.branco}");`);
  emit(`tl(${CL}).property("ADBE Scale").setValue([0, 0, 100]); tl(${CL}).property("ADBE Opacity").setValue(0);`);
  esc(CL, [[T.legalizai - 0.02, 20, "o"], [T.legalizai + 0.5, 190, "io"]]);
  opac(CL, [[T.legalizai - 0.03, 0, "hold"], [T.legalizai - 0.02, 70, "o"], [T.legalizai + 0.5, 0, "io"]]);
  camada(CL, T.legalizai - 0.05, T.legalizai + 0.6);
  // brilhos
  [[300, 9330, 0.05], [800, 9440, 0.13], [280, 9900, 0.21], [820, 9960, 0.29]].forEach(([x, y, d], i) => {
    const S1 = novaMundo(`Brilho do app ${i + 1}`, x, y);
    const gb = g(S1, "estrela");
    emit(`poli(${gb}, ${fmt(brilho(i % 2 ? 22 : 30).V)}, true); fil(${gb}, "${C.branco}");`);
    emit(`tl(${S1}).property("ADBE Scale").setValue([0, 0, 100]);`);
    const tb = T.legalizai + d;
    esc(S1, [[tb, 0, "o"], [tb + 0.25, 125, "io"], [tb + 0.45, 90, "io"], [tb + 0.75, 110, "io"], [tb + 1.05, 95, "io"]]);
    rot(S1, [[tb, -45, "o"], [tb + 0.6, 0, "io"]]);
  });
}

// ===== a íris papel (o fim) =====
{
  const IR = novaMundo("Íris papel", 1020, 10260, true);
  const gg = g(IR, "círculo");
  emit(`eli(${gg}, 5200, 5200, 0, 0); fil(${gg}, "${C.papel}");`);
  emit(`tl(${IR}).property("ADBE Scale").setValue([0, 0, 100]);`);
  esc(IR, [[T.H - 0.22, 0, "o"], [T.H + 0.3, 100, "io"]]);
}
// ===== cena 8: o perfil, o Seguir e o link da bio =====
{
  const CA = novaMundo("Cartão do perfil", CART.x, CART.y);
  const av = g(CA, "avatar");
  emit(`ret(${av}, 124, 124, 30, -390, -150); fil(${av}, "${C.coral}");`);
  const avv = g(CA, "avatar visto");
  emit(`poli(${avv}, [[-423,-152],[-398,-128],[-356,-170]], false); trc(${avv}, "${C.branco}", 15);`);
  const sk = g(CA, "linhas");
  emit(`ret(${sk}, 220, 16, 8, -190, -104); ret(${sk}, 170, 16, 8, -215, -76); fil(${sk}, "${C.cinza2}");`);
  emit(`tl(${CA}).property("ADBE Opacity").setValue(0);`);
  opac(CA, [[T.H + 0.02, 0, "o"], [T.H + 0.22, 100, "io"]]);
  esc(CA, pulo(T.H + 0.02, 0.4, 92, 100, 0.04));
  // nome
  emit(`var NOME = texto("Nome no perfil", "Legalizaí", FONTE8, 50, "${C.ink}", ParagraphJustification.LEFT_JUSTIFY, -10); NOME.parent = MUNDO; mundoCamadas.push(NOME);`);
  emit(`tl(NOME).property("ADBE Position").setValue([${CART.x - 300}, ${CART.y - 132}]);`);
  emit(`tl(NOME).property("ADBE Opacity").setValue(0);`);
  kf(`tl(NOME).property("ADBE Opacity")`, [[T.H + 0.05, 0, "o"], [T.H + 0.25, 100, "io"]]);
  // o botão Seguir
  const BT = novaMundo("Botão Seguir", SEG.x, SEG.y);
  const bA = g(BT, "seguir");
  emit(`ret(${bA}, ${SEG.w}, ${SEG.h}, ${SEG.h / 2}, 0, 0); fil(${bA}, "${C.coral}");`);
  const bB = g(BT, "seguindo");
  emit(`ret(${bB}, ${SEG.w}, ${SEG.h}, ${SEG.h / 2}, 0, 0); trc(${bB}, "${C.coral}", 6); fil(${bB}, "${C.branco}");`);
  emit(`tfg(${bB}).property("ADBE Vector Group Opacity").setValue(0);`);
  gOp(bB, [[T.segueClique - 0.02, 0, "o"], [T.segueClique + 0.2, 100, "io"]]);
  gOp(bA, [[T.segueClique - 0.02, 100, "o"], [T.segueClique + 0.2, 0, "io"]]);
  emit(`tl(${BT}).property("ADBE Opacity").setValue(0);`);
  opac(BT, [[T.H + 0.06, 0, "o"], [T.H + 0.26, 100, "io"]]);
  esc(BT, [[T.segueClique - 0.04, 100, "io"], [T.segueClique + 0.04, 94, "io"], [T.segueClique + 0.2, 103, "io"], [T.segueClique + 0.38, 100, "io"]]);
  emit(`var TXS = texto("Seguir (texto)", "Seguir", FONTE8, 44, "${C.branco}", ParagraphJustification.CENTER_JUSTIFY, 0); TXS.parent = MUNDO; mundoCamadas.push(TXS); centra(TXS, ${SEG.x}, ${SEG.y});`);
  kf(`tl(TXS).property("ADBE Opacity")`, [[T.H + 0.06, 0, "o"], [T.H + 0.26, 100, "hold"], [T.segueClique - 0.02, 100, "o"], [T.segueClique + 0.15, 0, "io"]]);
  emit(`var TXD = texto("Seguindo (texto)", "Seguindo", FONTE8, 42, "${C.coral6}", ParagraphJustification.CENTER_JUSTIFY, 0); TXD.parent = MUNDO; mundoCamadas.push(TXD); centra(TXD, ${SEG.x + 22}, ${SEG.y});`);
  emit(`tl(TXD).property("ADBE Opacity").setValue(0);`);
  kf(`tl(TXD).property("ADBE Opacity")`, [[T.segueClique + 0.05, 0, "o"], [T.segueClique + 0.22, 100, "io"]]);
  const VS = novaMundo("Visto do Seguindo", SEG.x - 134, SEG.y + 2);
  const vsg = g(VS, "visto");
  emit(`poli(${vsg}, [[-16,0],[-5,11],[17,-11]], false); apa(${vsg}); trc(${vsg}, "${C.coral6}", 8);`);
  kf(`trimDe(${vsg}).property("ADBE Vector Trim End")`, [[T.segueClique + 0.08, 0, "o"], [T.segueClique + 0.3, 100, "io"]]);
  // o link da bio
  const LK = novaMundo("Link da bio", LNK.x, LNK.y);
  const lA = g(LK, "pílula");
  emit(`ret(${lA}, ${LNK.w}, ${LNK.h}, ${LNK.h / 2}, 0, 0); fil(${lA}, "${C.coral1}");`);
  const lB = g(LK, "pílula clicada");
  emit(`ret(${lB}, ${LNK.w}, ${LNK.h}, ${LNK.h / 2}, 0, 0); fil(${lB}, "${C.coral}");`);
  emit(`tfg(${lB}).property("ADBE Vector Group Opacity").setValue(0);`);
  gOp(lB, [[T.clicaClique - 0.02, 0, "o"], [T.clicaClique + 0.18, 100, "io"]]);
  const ic = g(LK, "ícone");
  emit(`ret(${ic}, 30, 16, 8, -8, -6); ret(${ic}, 30, 16, 8, 8, 6); trc(${ic}, "${C.coral6}", 5);`);
  gPos(ic, -118, 0);
  emit(`tfg(${ic}).property("ADBE Vector Rotation").setValue(-35);`);
  emit(`tl(${LK}).property("ADBE Opacity").setValue(0);`);
  opac(LK, [[T.H + 0.1, 0, "o"], [T.H + 0.3, 100, "io"]]);
  esc(LK, [[T.clicaClique - 0.04, 100, "io"], [T.clicaClique + 0.04, 94, "io"], [T.clicaClique + 0.2, 103, "io"], [T.clicaClique + 0.38, 100, "io"]]);
  emit(`var TXL = texto("link da bio (texto)", "link da bio", FONTE, 34, "${C.coral6}", ParagraphJustification.CENTER_JUSTIFY, 0); TXL.parent = MUNDO; mundoCamadas.push(TXL); centra(TXL, ${LNK.x + 22}, ${LNK.y});`);
  kf(`tl(TXL).property("ADBE Opacity")`, [[T.H + 0.1, 0, "o"], [T.H + 0.3, 100, "hold"], [T.clicaClique - 0.02, 100, "o"], [T.clicaClique + 0.18, 0, "io"]]);
  emit(`var TXL2 = texto("link da bio (texto clicado)", "link da bio", FONTE, 34, "${C.branco}", ParagraphJustification.CENTER_JUSTIFY, 0); TXL2.parent = MUNDO; mundoCamadas.push(TXL2); centra(TXL2, ${LNK.x + 22}, ${LNK.y});`);
  emit(`tl(TXL2).property("ADBE Opacity").setValue(0);`);
  kf(`tl(TXL2).property("ADBE Opacity")`, [[T.clicaClique - 0.02, 0, "o"], [T.clicaClique + 0.18, 100, "io"]]);
}

// ===== a linha (camadas em sequência, por cima das cenas) =====
function criaSegmento(sg) {
  const { nome, tr, chavesTempo, opc } = sg;
  const Ls = tr.comprimentos();
  const tot = Ls[Ls.length - 1];
  const ts = chavesTempo.map((c) => c[1]);
  const ss = chavesTempo.map((c) => Ls[tr.m[c[0]]] + (c[2] || 0));
  for (let i = 1; i < ts.length; i++) if (!(ts[i] > ts[i - 1])) throw new Error(`${nome}: tempos fora de ordem em ${chavesTempo[i][0]}`);
  const f = monotona(ts, ss);
  const L = novaMundo(nome, 0, 0);
  const gg = g(L, "traço");
  emit(`cam(${gg}, ${fmt(tr.V)}, ${fmt(tr.I)}, ${fmt(tr.O)}, false);`);
  if (opc.zigue) emit(`its(${gg}).addProperty("ADBE Vector Filter - Zigzag"); zigDe(${gg}).property("ADBE Vector Zigzag Detail").setValue(9); zigDe(${gg}).property("ADBE Vector Zigzag Points").setValue(2); zigDe(${gg}).property("ADBE Vector Zigzag Size").setValue(0);`);
  emit(`apa(${gg});`);
  if (opc.intensa) {
    // mais intensa: o traço mais grosso e um halo largo por baixo
    emit(`trc(${gg}, "${opc.cor || C.coral}", 14); trc(${gg}, "${opc.cor || C.coral}", 36, 24);`);
  } else {
    emit(`trc(${gg}, "${opc.cor || C.coral}", ${LINHA.larg});`);
  }
  emit(`sombra(${L}, "${opc.sombraCor || LINHA.sombra.cor}", ${LINHA.sombra.op}, ${LINHA.sombra.dist}, ${LINHA.sombra.suav});`);
  const t0 = ts[0];
  const t1 = ts[ts.length - 1];
  const tt = [];
  const vv = [];
  for (let t = t0; t < t1; t += 2 / FPS) { tt.push(t); vv.push(Math.min(100, Math.max(0, (100 * f(t)) / tot))); }
  tt.push(t1); vv.push(100);
  kfd(`trimDe(${gg}).property("ADBE Vector Trim End")`, tt, vv);
  if (opc.cometa) {
    // a cauda vem atrás da ponta e entra junto: não sobra risco
    const t2 = [];
    const v2 = [];
    for (let t = t0 + opc.cometa; t < t1 + opc.cometa; t += 2 / FPS) { t2.push(t); v2.push(Math.min(100, Math.max(0, (100 * f(t - opc.cometa)) / tot))); }
    t2.push(t1 + opc.cometa); v2.push(100);
    kfd(`trimDe(${gg}).property("ADBE Vector Trim Start")`, t2, v2);
  }
  if (opc.someEm) opac(L, [[opc.someEm, 100, "io"], [opc.someEm + 0.22, 0, "io"]]);
  if (opc.zigue) {
    const ks = [[T.C, 0, "o"], [T.liga + 0.05, 26, "io"]];
    for (let t = T.liga + 0.2, k = 0; t < T.cai - 0.05; t += 0.16, k++) ks.push([t, k % 2 ? 26 : 17, "io"]);
    ks.push([T.cai + 0.04, 24, "o"], [T.cai + 0.34, 0, "io"]);
    kf(`zigDe(${gg}).property("ADBE Vector Zigzag Size")`, ks);
  }
  infoSeg.push(`${nome}: ${Math.round(tot)} px, de ${r3(t0)} a ${r3(t1)} s, ${tt.length} chaves`);
}
segmentos.filter((sg) => !sg.opc.cedo).forEach(criaSegmento);

// ===== o toque e o confete (por cima da linha) =====
{
  const TQ = novaMundo("Toque", 0, 0);
  const anelg = g(TQ, "onda");
  emit(`eli(${anelg}, 64, 64, 0, 0); trc(${anelg}, "${C.branco}", 6);`);
  const dedo = g(TQ, "dedo");
  emit(`eli(${dedo}, 64, 64, 0, 0); trc(${dedo}, "#D8D3CC", 3); fil(${dedo}, "${C.branco}");`);
  const halo = g(TQ, "halo");
  emit(`eli(${halo}, 92, 92, 0, 0); fil(${halo}, "${C.branco}", 35);`);
  emit(`sombra(${TQ}, "${C.ink}", 60, 6, 12);`);
  emit(`tl(${TQ}).property("ADBE Position").dimensionsSeparated = true;`);
  const a1 = [SEG.x + 245, SEG.y];
  const a2 = [LNK.x + 168, LNK.y];
  kf(posX(TQ), [[T.H - 0.05, a1[0] + 160, "o"], [T.segueClique - 0.06, a1[0], "hold"], [T.e3 - 0.25, a1[0], "io"], [T.e3 + 0.05, a2[0], "io"]]);
  kf(`tl(${TQ}).property("ADBE Position_1")`, [[T.H - 0.05, a1[1] + 430, "o"], [T.segueClique - 0.06, a1[1], "hold"], [T.e3 - 0.25, a1[1], "io"], [T.e3 + 0.05, a2[1], "io"]]);
  emit(`tl(${TQ}).property("ADBE Opacity").setValue(0);`);
  opac(TQ, [[T.H - 0.05, 0, "o"], [T.H + 0.08, 100, "hold"], [T.segueClique + 0.12, 100, "io"], [T.segueClique + 0.32, 0, "hold"], [T.e3 - 0.28, 0, "o"], [T.e3 - 0.1, 100, "hold"], [T.clicaClique + 0.12, 100, "io"], [T.clicaClique + 0.32, 0, "io"]]);
  esc(TQ, [[T.segueClique - 0.04, 100, "io"], [T.segueClique + 0.04, 82, "io"], [T.segueClique + 0.16, 100, "io"], [T.clicaClique - 0.04, 100, "io"], [T.clicaClique + 0.04, 82, "io"], [T.clicaClique + 0.16, 100, "io"]]);
  gEsc(anelg, [[T.segueClique, 60, "o"], [T.segueClique + 0.45, 260, "io"], [T.clicaClique, 60, "o"], [T.clicaClique + 0.45, 260, "io"]]);
  gOp(anelg, [[T.segueClique - 0.01, 0, "lin"], [T.segueClique, 90, "o"], [T.segueClique + 0.45, 0, "io"], [T.clicaClique - 0.01, 0, "lin"], [T.clicaClique, 90, "o"], [T.clicaClique + 0.45, 0, "io"]]);
  // confete do Seguir
  const CF = novaMundo("Confete", SEG.x, SEG.y);
  const cores = [C.coral, C.coral3, C.coral1, C.coral6, C.branco];
  const rnd = (i, s) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < 34; i++) {
    const gg = g(CF, `papel ${i}`);
    emit(`ret(${gg}, ${7 + rnd(i, 1) * 6}, ${13 + rnd(i, 2) * 8}, 2, 0, 0); fil(${gg}, "${cores[i % cores.length]}");`);
    const a = rnd(i, 3) * 2 * Math.PI;
    const v = 260 + rnd(i, 4) * 340;
    const t0 = T.segueClique + 0.14;
    const ax = Math.cos(a) * v * 0.55, ay = Math.sin(a) * v * 0.55 - 180;
    const fx = Math.cos(a) * v, fy = Math.sin(a) * v * 0.6 + 380;
    kf(`tfg(${gg}).property("ADBE Vector Position")`, [[t0, [0, 0], "o"], [t0 + 0.55, [ax, ay], "io"], [t0 + 1.6, [fx, fy], "i"]]);
    gRot(gg, [[t0, 0, "lin"], [t0 + 1.6, (rnd(i, 5) - 0.5) * 900, "lin"]]);
    gOp(gg, [[t0 - 0.01, 0, "lin"], [t0, 100, "hold"], [t0 + 1.1, 100, "io"], [t0 + 1.6, 0, "io"]]);
  }
  camada(CF, T.segueClique, T.segueClique + 2);
}

// ===== o fecho (tela) =====
{
  const TL = TF - 0.4; // o logo chega antes da linha
  const opLogo = [[TL, 0, "o"], [TL + 0.15, 100, "hold"], [DUR - 0.4, 100, "io"], [DUR - 0.2, 0, "io"]];
  // o quadrado coral atrás do logo (no logo sem o visto, o visto é vazado)
  const QF = novaTela("Logo: fundo do quadrado", 0, 0);
  emit(`importa("${ASSETS}/logo-sem-visto.png");`);
  emit(`var logoItem = null; for (var ii = 1; ii <= app.project.numItems; ii++) { var it = app.project.item(ii); if (it.name == "logo-sem-visto.png") logoItem = it; }`);
  emit(`var LOGOL = COMP.layers.add(logoItem); LOGOL.name = "Logo (fecho, sem o visto)";`);
  const esL = (LOGO.w / 1980) * 100;
  emit(`tl(LOGOL).property("ADBE Anchor Point").setValue([0, 0]); tl(LOGOL).property("ADBE Position").setValue([${LOGO.x0}, ${LOGO.y0}]); tl(LOGOL).property("ADBE Scale").setValue([${esL}, ${esL}, 100]);`);
  emit(`tl(LOGOL).property("ADBE Opacity").setValue(0);`);
  kf(`tl(LOGOL).property("ADBE Opacity")`, opLogo);
  kf(`tl(LOGOL).property("ADBE Scale")`, pulo(TL, 0.4, [esL * 0.9, esL * 0.9, 100], [esL, esL, 100], 0.05));
  emit(`${QF}.parent = LOGOL; ${QF}.moveAfter(LOGOL); tl(${QF}).property("ADBE Position").setValue([0, 0]); tl(${QF}).property("ADBE Scale").setValue([100, 100, 100]);`);
  const qg = g(QF, "quadrado");
  emit(`ret(${qg}, ${121.44 * 3 - 4}, ${121.44 * 3 - 4}, ${19.23 * 3}, ${121.44 * 1.5}, ${121.44 * 1.5}); fil(${qg}, "${C.coral}");`);
  emit(`tl(${QF}).property("ADBE Opacity").setValue(0);`);
  kf(`tl(${QF}).property("ADBE Opacity")`, opLogo);
  // o visto branco: a linha chega e constrói o visto, recortado na forma exata do visto do logo
  const VB = novaTela("Logo: o visto que a linha constrói", 0, 0);
  emit(`${VB}.parent = LOGOL; ${VB}.moveBefore(LOGOL); tl(${VB}).property("ADBE Position").setValue([0, 0]); tl(${VB}).property("ADBE Scale").setValue([100, 100, 100]);`);
  const vg = g(VB, "visto");
  emit(`poli(${vg}, [[${27.66 * 3},${60.29 * 3}],[${60.76 * 3},${93.39 * 3}],[${121.42 * 3 + 30},${32.73 * 3 - 30}]], false); apa(${vg}); trc(${vg}, "${C.branco}", 84);`);
  kf(`trimDe(${vg}).property("ADBE Vector Trim End")`, [[TF - 0.18, 0, "o"], [TF + 0.08, 100, "io"]]);
  const mV = [[121.43, 18.95], [60.76, 79.62], [41.43, 60.29], [13.89, 60.29], [48.86, 95.26], [72.63, 95.26], [121.42, 46.47], [121.42, 18.93]].map(([x, y]) => [x * 3, y * 3]);
  const mI = [[0, 0], [0, 0], [0, 0], [7.61, -7.6], [0, 0], [-6.56, 6.56], [0, 0], [0, 0]].map(([x, y]) => [x * 3, y * 3]);
  const mO = [[0, 0], [0, 0], [-7.6, -7.6], [0, 0], [6.56, 6.56], [0, 0], [0, 0], [0, 0]].map(([x, y]) => [x * 3, y * 3]);
  emit(`mascara(${VB}, ${fmt(mV)}, ${fmt(mI)}, ${fmt(mO)}, null);`);
  emit(`tl(${VB}).property("ADBE Opacity").setValue(0);`);
  kf(`tl(${VB}).property("ADBE Opacity")`, [[TF - 0.19, 0, "hold"], [TF - 0.18, 100, "hold"], [DUR - 0.4, 100, "io"], [DUR - 0.2, 0, "io"]]);
  emit(`var VAI = texto("Vai, (fecho)", "Vai,", FONTE8, 106, "${C.ink}", ParagraphJustification.LEFT_JUSTIFY, -20);`);
  emit(`var rv = VAI.sourceRectAtTime(0, false); tl(VAI).property("ADBE Anchor Point").setValue([rv.left + rv.width, 0]); tl(VAI).property("ADBE Position").setValue([${LOGO.x0 - 26}, ${LOGO.y0 + 100}]);`);
  emit(`tl(VAI).property("ADBE Opacity").setValue(0);`);
  kf(`tl(VAI).property("ADBE Opacity")`, [[TF, 0, "o"], [TF + 0.18, 100, "hold"], [DUR - 0.4, 100, "io"], [DUR - 0.2, 0, "io"]]);
  emit(`tl(VAI).property("ADBE Position").dimensionsSeparated = true;`);
  kf(`tl(VAI).property("ADBE Position_0")`, [[TF, LOGO.x0 - 56, "o"], [TF + 0.3, LOGO.x0 - 26, "io"]]);
  // LINK DA BIO
  const PL = novaTela("LINK DA BIO (pílula)", 540, 958);
  const pg = g(PL, "pílula");
  emit(`ret(${pg}, 330, 76, 38, 0, 0); fil(${pg}, "${C.coral6}");`);
  emit(`sombra(${PL}, "${C.coral6}", 70, 8, 18);`);
  emit(`var TPL = texto("LINK DA BIO (texto)", "LINK DA BIO", FONTE8, 30, "${C.branco}", ParagraphJustification.CENTER_JUSTIFY, 60); centra(TPL, 540, 958);`);
  emit(`TPL.parent = ${PL}; `);
  emit(`tl(${PL}).property("ADBE Scale").setValue([0, 0, 100]);`);
  esc(PL, [...pulo(TF + 0.3, 0.38, 0, 100, 0.12), [DUR - 0.4, 100, "io"], [DUR - 0.2, 0, "io"]]);
}

// ===== a faixa da legenda (tela): esconde o mundo atrás da legenda, na cor do fundo de cada momento =====
{
  emit(`var FX = solido("Faixa da legenda", "${C.papel}", 1080, 1920); tl(FX).property("ADBE Position").setValue([540, 960]);`);
  emit(`mascara(FX, [[-60,-200],[1140,-200],[1140,500],[-60,500]], [[0,0],[0,0],[0,0],[0,0]], [[0,0],[0,0],[0,0],[0,0]], [0, 300]);`);
  emit(`var fFX = efeito(FX, "ADBE Fill");`);
  const cores = [[0, C.papel], [10.6, C.papel], [10.95, "#FBE3D6"], [T.E + 0.4, "#F6CDB9"], [T.E + 1.3, C.ceuNoite], [13.0, C.ceuNoite], [13.35, C.noite], [15.32, C.noite], [15.55, C.coral],
    [18.5, C.coral], [18.78, C.papel]];
  emit(`var corFX = fFX.property("ADBE Fill-0002");`);
  cores.forEach(([t, c]) => emit(`corFX.setValueAtTime(RT(${r3(t)}), hx4("${c}"));`));
}

// ===== a legenda (a frase apagada, cada palavra acende quando é dita, uma palavra-chave em cor) =====
const LINHAS_LEG = [
  ["Você separa a tarde inteira", "pra resolver uma coisa", "simples."], ["Chega no site, trava."], ["Liga pro telefone, cai a", "ligação."], ["Vai pessoalmente, fila."],
  ["No fim do dia, nada", "resolvido,"], ["e sua empresa parada", "esperando."], ["É por isso que a gente tá", "construindo o Legalizaí."], ["Segue a gente. E clica no", "link da bio."],
];
const MODO = { light: { base: C.ink, key: C.coral6, dim: 20 }, dark: { base: C.claro, key: C.coral, dim: 30 }, coral: { base: C.branco, key: C.ink, dim: 42 } };
const modos = ["light", "light", "light", "light", "light", "dark", "coral", "light"];
// v5: a legenda do "construindo o Legalizaí" sai logo depois da palavra, antes do corte (17,9 s); no lugar dela
// entram os nomes das funcionalidades
narr.phrases[6].out = 17.99;
narr.phrases.forEach((p, n) => {
  const md = MODO[modos[n]];
  const txt = LINHAS_LEG[n].join("\r");
  const tin = p.s - 0.1;
  const tout = p.out - 0.26;
  const L = nv("LG");
  emit(`var ${L} = texto("Legenda ${n + 1}", ${J(txt)}, FONTE, 68, "${md.base}", ParagraphJustification.CENTER_JUSTIFY, -25, 74.8); centra(${L}, 540, 371);`);
  emit(`${L}.inPoint = RT(${r3(Math.max(0, tin))}); ${L}.outPoint = RT(${r3(Math.min(DUR, tout + 0.16))});`);
  emit(`var anims = ${L}.property("ADBE Text Properties").property("ADBE Text Animators");`);
  // a virada do fim do dia: o texto clareia quando a noite cai
  if (n === 4) {
    emit(`var avR = anims.addProperty("ADBE Text Animator"); avR.name = "anoitece"; cor4(avR.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color"), "${C.claro}");`);
    emit(`var sR = avR.property("ADBE Text Selectors").addProperty("ADBE Text Selector");`);
    kf(`sR.property("ADBE Text Range Advanced").property("ADBE Text Selector Max Amount")`, [[T.E + 0.55, 0, "io"], [T.E + 0.95, 100, "io"]]);
  }
  // a palavra-chave
  const ik = p.key - p.w[0];
  const tk = narr.words[p.key].s - 0.04;
  emit(`var avK = anims.addProperty("ADBE Text Animator"); avK.name = "chave"; cor4(avK.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color"), "${md.key}");`);
  emit(`var sK = avK.property("ADBE Text Selectors").addProperty("ADBE Text Selector"); var advK = sK.property("ADBE Text Range Advanced");`);
  emit(`advK.property("ADBE Text Range Units").setValue(2); advK.property("ADBE Text Range Type2").setValue(3); sK.property("ADBE Text Index Start").setValue(${ik}); sK.property("ADBE Text Index End").setValue(${ik + 1});`);
  kf(`advK.property("ADBE Text Selector Max Amount")`, [[tk, 0, "o"], [tk + 0.2, 100, "io"]]);
  // as palavras ainda não ditas ficam apagadas
  emit(`var avD = anims.addProperty("ADBE Text Animator"); avD.name = "apagado"; avD.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(${md.dim});`);
  emit(`avD.property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D").setValue([0, 7, 0]);`);
  emit(`var sD = avD.property("ADBE Text Selectors").addProperty("ADBE Text Selector"); var advD = sD.property("ADBE Text Range Advanced");`);
  emit(`advD.property("ADBE Text Range Units").setValue(2); advD.property("ADBE Text Range Type2").setValue(3); sD.property("ADBE Text Index End").setValue(999);`);
  const ts = [];
  const vs = [];
  p.w.forEach((wi, j) => {
    const w = narr.words[wi];
    const a = Math.max(w.s - 0.04, ts.length ? ts[ts.length - 1] + 0.01 : -1);
    ts.push(a); vs.push(j);
    ts.push(Math.max(a + 0.02, w.s + 0.16)); vs.push(j + 1);
  });
  for (let i = 1; i < ts.length; i++) if (ts[i] <= ts[i - 1]) ts[i] = ts[i - 1] + 0.005;
  kfd(`sD.property("ADBE Text Index Start")`, ts, vs);
  // entra e sai: desfoque, opacidade e um deslize
  emit(`var bl = efeito(${L}, "ADBE Gaussian Blur 2"); bl.property("ADBE Gaussian Blur 2-0003").setValue(1);`);
  kf(`bl.property("ADBE Gaussian Blur 2-0001")`, [[tin, 9, "o"], [tin + 0.18, 0, "hold"], [tout, 0, "o"], [tout + 0.14, 9, "io"]]);
  kf(`tl(${L}).property("ADBE Opacity")`, [[tin, 0, "o"], [tin + 0.18, 100, "hold"], [tout, 100, "o"], [tout + 0.14, 0, "io"]]);
  emit(`tl(${L}).property("ADBE Position").dimensionsSeparated = true;`);
  kf(`tl(${L}).property("ADBE Position_1")`, [[tin, 371 + 18, "o"], [tin + 0.18, 371, "hold"], [tout, 371, "o"], [tout + 0.14, 371 - 22, "io"]]);
});

// ===== v5: as funcionalidades, no lugar da legenda, enquanto o celular 3D troca de tela =====
// Tempo NOVO (dentro dos 6 s inseridos): SEM_RT desliga o deslocamento. Cada nome entra na troca de tela, no tempo da
// trilha (a cada 3 batidas). Fatos: F087 (o sistema acompanha o Fator R e ajusta o pró-labore desde o mês 1) e
// F101/F102 (no plano ME o contador cuida da folha); as telas são as do app de 02/10. Sem emissão de nota (pedido
// do Pedro) e sem cadastro de funcionário (no app só existe no plano MEI, e a peça é ME).
{
  const FUNCOES = [
    { t: 18.035, linhas: ["Painel fácil", "de entender"], chave: 0 },
    { t: 19.535, linhas: ["Alíquota", "acompanhada"], chave: 0 },
    { t: 21.035, linhas: ["Folha e pró-labore", "em dia"], chave: 0 },
    { t: 22.535, linhas: ["Obrigações do mês", "à vista"], chave: 0 },
  ];
  const md = MODO.coral;
  emit(`SEM_RT = true;`);
  FUNCOES.forEach((f, i) => {
    const tin = f.t;
    const tout = i < FUNCOES.length - 1 ? FUNCOES[i + 1].t - 0.16 : 23.86;
    const L = nv("FN");
    emit(`var ${L} = texto("Funcionalidade ${i + 1}", ${J(f.linhas.join("\r"))}, FONTE, 68, "${md.base}", ParagraphJustification.CENTER_JUSTIFY, -25, 74.8); centra(${L}, 540, 371);`);
    emit(`${L}.inPoint = ${r3(tin)}; ${L}.outPoint = ${r3(tout + 0.16)};`);
    emit(`var animsF = ${L}.property("ADBE Text Properties").property("ADBE Text Animators");`);
    emit(`var avF = animsF.addProperty("ADBE Text Animator"); avF.name = "chave"; cor4(avF.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color"), "${md.key}");`);
    emit(`var sF = avF.property("ADBE Text Selectors").addProperty("ADBE Text Selector"); var advF = sF.property("ADBE Text Range Advanced");`);
    emit(`advF.property("ADBE Text Range Units").setValue(2); advF.property("ADBE Text Range Type2").setValue(3); sF.property("ADBE Text Index Start").setValue(${f.chave}); sF.property("ADBE Text Index End").setValue(${f.chave + 1});`);
    emit(`var blF = efeito(${L}, "ADBE Gaussian Blur 2"); blF.property("ADBE Gaussian Blur 2-0003").setValue(1);`);
    kf(`blF.property("ADBE Gaussian Blur 2-0001")`, [[tin, 9, "o"], [tin + 0.18, 0, "hold"], [tout, 0, "o"], [tout + 0.14, 9, "io"]]);
    kf(`tl(${L}).property("ADBE Opacity")`, [[tin, 0, "o"], [tin + 0.18, 100, "hold"], [tout, 100, "o"], [tout + 0.14, 0, "io"]]);
    emit(`tl(${L}).property("ADBE Position").dimensionsSeparated = true;`);
    kf(`tl(${L}).property("ADBE Position_1")`, [[tin, 371 + 18, "o"], [tin + 0.18, 371, "hold"], [tout, 371, "o"], [tout + 0.14, 371 - 22, "io"]]);
  });
  emit(`SEM_RT = false;`);
}

// ===== o loop: no fim, o relógio das 9h volta (igual ao quadro 0) =====
{
  const RLv = relogio("Relógio (volta do loop)", false, false);
  emit(`var RL = ${RLv}; RL.moveToBeginning();`);
  emit(`RL.inPoint = RT(${r3(DUR - 0.45)}); RL.outPoint = RT(${DUR});`);
  emit(`tl(RL).property("ADBE Opacity").setValue(0);`);
  kf(`tl(RL).property("ADBE Opacity")`, [[DUR - 0.42, 0, "io"], [DUR - 0.05, 100, "io"]]);
  emit(`var FUN = solido("Papel (volta do loop)", "${C.papel}", 1080, 1920); tl(FUN).property("ADBE Position").setValue([540, 960]); FUN.inPoint = RT(${r3(DUR - 0.45)}); FUN.outPoint = RT(${DUR}); FUN.moveAfter(RL);`);
  emit(`tl(FUN).property("ADBE Opacity").setValue(0);`);
  kf(`tl(FUN).property("ADBE Opacity")`, [[DUR - 0.42, 0, "io"], [DUR - 0.05, 100, "io"]]);
}

// ===== a câmera (com o zoom de produto no celular) e o desfoque de movimento =====
{
  // o ponto da tela (540, 1160) mostra o ponto do mundo W(t) = (540, câmera + 1160); o zoom s(t) é em volta dele
  emit(`tl(MUNDO).property("ADBE Position").dimensionsSeparated = true;`);
  const io4 = (u) => (u < 0.5 ? 8 * u ** 4 : 1 - 8 * (1 - u) ** 4);
  const camAt = (t) => {
    for (let i = 0; i < CAM.length - 1; i++) {
      const [t0, y0] = CAM[i];
      const [t1, y1] = CAM[i + 1];
      if (t >= t0 && t <= t1) return y0 === y1 ? y0 : y0 + (y1 - y0) * io4((t - t0) / (t1 - t0));
    }
    return CAM[CAM.length - 1][1];
  };
  const oc = (u) => 1 - (1 - u) ** 3;
  const ioc = (u) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);
  const ios = (u) => -(Math.cos(Math.PI * u) - 1) / 2;
  const zoomAt = (t) => {
    if (t < 17.12 || t > 18.5) return 1;
    if (t < 17.58) return 1 + 0.42 * oc((t - 17.12) / 0.46);
    if (t < 18.02) return 1.42 + 0.08 * ios((t - 17.58) / 0.44);
    return 1.5 - 0.5 * ioc((t - 18.02) / 0.48);
  };
  const ts = [], xs = [], ys = [], ss = [];
  for (let q = 0; q <= Math.round(DUR * FPS); q++) {
    const t = q / FPS;
    const s = zoomAt(t);
    const W = camAt(t) + 1160;
    ts.push(t); xs.push(540 - s * 540); ys.push(1160 - s * W); ss.push([s * 100, s * 100, 100]);
  }
  kfd(`tl(MUNDO).property("ADBE Position_0")`, ts, xs);
  kfd(`tl(MUNDO).property("ADBE Position_1")`, ts, ys);
  kfd(`tl(MUNDO).property("ADBE Scale")`, ts, ss);
  emit(`for (var mi = 0; mi < mundoCamadas.length; mi++) { try { mundoCamadas[mi].motionBlur = true; } catch (e) {} }`);
}

// ===== o som (o mix da v2: voz, trilha e efeitos, no mesmo tempo) =====
emit(`for (var ci = 1; ci <= app.project.numItems; ci++) { var CI = app.project.item(ci); if (!(CI instanceof CompItem)) continue; for (var li = 1; li <= CI.numLayers; li++) { var LL = CI.layer(li); if (LL.matchName == "ADBE Vector Layer") reordena(raiz(LL)); } }`);
emit(`var somItem = importa("${ASSETS}/mix-v5.wav"); var SOM = COMP.layers.add(somItem); SOM.name = "Mix v5 (voz, trilha e efeitos, com as funcionalidades)"; SOM.moveToEnd();`);
emit(`try { app.endUndoGroup(); } catch (e) {}`);
emit(`app.project.save(new File("${AQUI.replace(/\\/g, "/")}/SUFOCO-LINHA.aep"));`);
emit(`log("ok: " + COMP.numLayers + " camadas");`);
emit(`} catch (err) { log("ERRO: " + err.toString() + " (linha " + err.line + ")"); }`);
emit(`var flog = new File("${AQUI.replace(/\\/g, "/")}/monta.log"); flog.encoding = "UTF-8"; flog.open("w"); flog.write(LOG.join("\\n")); flog.close();`);
emit(`app.endSuppressDialogs(false);`);

const jsx = out.join("\n").replace(/[^\x00-\x7f]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
fs.writeFileSync(path.join(AQUI, "monta.jsx"), jsx, "utf8");
console.log(infoSeg.join("\n"));
console.log(`monta.jsx: ${out.length} linhas; câmera final ${CAMF}; visto do fecho ${J(VISTO)}`);
