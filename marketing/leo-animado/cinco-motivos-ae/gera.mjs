// Gera o monta.jsx do reel "Cinco motivos pra ter CNPJ" (09/10/2026, After Effects).
// Referências do Pedro (YouTube Shorts de AE): fundo escuro com luz em gradiente, cards com brilho, grade de pontos
// acesos, ícone que se desenha no traço, explosão de luz, legenda forte. Tudo nas cores da marca.
// Regras que valem aqui: margem de segurança (96 px dos lados, 240 do topo, 360 da base), visto = símbolo da marca,
// legenda em blocos de 3 a 4 palavras com a ênfase na DM Serif Display Italic, nada atravessa nada, valor do DAS do
// MEI nunca aparece (F063), uma animação por frase.
// Uso: node gera.mjs   (grava monta.jsx; só ASCII, acentos em \uXXXX)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { legendaDaFrase } from "../sufoco-linha-ae/blocos.mjs";
import { simbolo } from "../sufoco-linha-ae/simbolo.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, "/");
const FPS = 30, OFF = 0.25, DUR = 43.3;
const C = {
  ink: "#15171C", ink2: "#1D2027", ink3: "#262A33", linha: "#383C48", papel: "#FAF8F5", creme: "#F3EDE4",
  coral: "#F2643C", coral6: "#DD4E27", coral7: "#B83D1C", coral1: "#FBDDD1", cinza: "#9AA0AA", cinzaPapel: "#DCD6CE",
};
const M = { l: 96, r: 984, t: 240, b: 1560 };
const Y_LEG = 1480, LARG_LEG = 888;
const r3 = (x) => Math.round(x * 1000) / 1000;
const J = (v) => JSON.stringify(v, (k, x) => (typeof x === "number" ? Math.round(x * 1000) / 1000 : x));

// ---------- a narração (tomada 1 do clone convertida pro Dylan; tempos do whisper + OFF) ----------
const FRASES = [
  { key: "CPF?", w: [["Ainda", 0], ["recebe", 0.42], ["pelo", 0.86], ["seu", 1.04], ["trabalho", 1.18], ["no", 1.52], ["CPF?", 1.68]], fim: 2.3 },
  { key: "CNPJ.", w: [["Cinco", 3.02], ["motivos", 3.52], ["pra", 4.0], ["ter", 4.18], ["CNPJ.", 4.32]], fim: 4.95 },
  { key: "fixa,", w: [["Um:", 5.4], ["no", 6.12], ["MEI,", 6.2], ["a", 6.98], ["guia", 7.1], ["é", 7.38], ["fixa,", 7.58], ["fature", 8.64], ["500", 8.76], ["ou", 9.18], ["5", 9.48], ["mil.", 9.72]], fim: 10.2 },
  { key: "6%,", w: [["Dois:", 10.36], ["numa", 11.34], ["microempresa", 11.48], ["que", 12.12], ["começa", 12.38], ["em", 12.7], ["6%,", 12.94]], fim: 13.5 },
  { key: "bolso.", w: [["de", 13.66], ["10", 14.32], ["mil,", 14.56], ["uns", 15.18], ["600", 15.3], ["de", 15.56], ["imposto", 15.9], ["e", 16.26], ["uns", 16.56], ["9.400", 16.74], ["no", 17.62], ["bolso.", 18.2]], fim: 18.7 },
  { key: "aposentadoria.", w: [["Três:", 18.9], ["na", 19.96], ["microempresa,", 20.04], ["seu", 21.2], ["salário", 21.32], ["de", 21.74], ["dono", 21.88], ["recolhe", 22.18], ["INSS", 22.64], ["pra", 23.44], ["sua", 23.9], ["aposentadoria.", 24.12]], fim: 24.9 },
  { key: "calcula.", w: [["Quatro:", 25.56], ["o", 26.46], ["app", 26.58], ["calcula.", 26.76]], fim: 27.3 },
  { key: "paga.", w: [["Você", 27.72], ["emite", 27.92], ["a", 28.28], ["nota", 28.38], ["e", 28.58], ["paga.", 28.78]], fim: 29.1 },
  { key: "gente,", w: [["Cinco:", 29.82], ["a", 30.76], ["abertura", 30.88], ["é", 31.36], ["com", 31.44], ["a", 31.54], ["gente,", 31.62], ["sem", 32.12], ["honorário.", 32.32]], fim: 33.0 },
  { key: "burocracia", w: [["Se", 33.26], ["você", 33.36], ["não", 33.6], ["quer", 33.72], ["se", 33.92], ["preocupar", 34.04], ["com", 34.5], ["toda", 34.66], ["a", 35.04], ["burocracia", 35.24], ["de", 35.76], ["abrir", 35.88], ["empresa,", 36.04]], fim: 36.65 },
  { key: "bio", w: [["clique", 36.82], ["no", 37.02], ["link", 37.24], ["da", 37.44], ["bio", 37.62]], fim: 37.85 },
  { key: "espera", w: [["e", 37.88], ["entre", 38.06], ["na", 38.26], ["lista", 38.42], ["de", 38.7], ["espera", 38.86], ["do", 39.18], ["app", 39.36], ["que", 39.54], ["tá", 39.66], ["chegando.", 39.76]], fim: 40.3 },
];
const words = [];
const phrases = FRASES.map((f, k) => {
  const idx = [];
  f.w.forEach(([t, s], j) => {
    const e = j < f.w.length - 1 ? f.w[j + 1][1] : f.fim;
    idx.push(words.length);
    words.push({ t, s: r3(s + OFF), e: r3(e + OFF) });
  });
  return { w: idx, key: idx[f.w.findIndex(([t]) => t === f.key)], s: words[idx[0]].s, fim: f.fim + OFF };
});
phrases.forEach((p, k) => { p.out = k < phrases.length - 1 ? r3(words[phrases[k + 1].w[0]].s - 0.02) : r3(40.55); });
const nrm = (s) => s.replace(/[^\p{L}\p{N}%.]/gu, "").replace(/\.$/, "").toLowerCase();
const S = (txt, n = 1) => { let c = 0; for (const w of words) if (nrm(w.t) === nrm(txt) && ++c === n) return w.s; throw new Error("palavra " + txt); };

// ---------- saída JSX ----------
const out = [];
let nEmit = 0;
const emit = (s) => { out.push(s); if (++nEmit % 150 === 0) out.push("try { app.purge(PurgeTarget.ALL_CACHES); } catch (e) {}"); };
let nVar = 0;
const nv = (p = "v") => `${p}${nVar++}`;
const kf = (alvo, ch) => emit(`kf(${alvo}, ${J(ch.map(([t, v, e]) => [r3(t), v, e || "io"]))});`);
const pulo = (t0, d, a, b, passa = 0.1) => {
  const pk = Array.isArray(b) ? b.map((x, i) => x + (x - a[i]) * passa) : b + (b - a) * passa;
  return [[t0, a, "o"], [t0 + d * 0.62, pk, "io"], [t0 + d, b, "io"]];
};

const LIB = String.raw`
var LOG = [];
var LOGF = new File(PECA + "/monta.log");
function log(s) { LOG.push(String(s)); try { LOGF.open("a"); LOGF.writeln(String(s)); LOGF.close(); } catch (e) {} }
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
function ret(g, w, h, r, x, y) { var p = its(g).addProperty("ADBE Vector Shape - Rect"); p.property("ADBE Vector Rect Size").setValue([w, h]); p.property("ADBE Vector Rect Position").setValue([x || 0, y || 0]); p.property("ADBE Vector Rect Roundness").setValue(r || 0); return p; }
function eli(g, w, h, x, y) { var p = its(g).addProperty("ADBE Vector Shape - Ellipse"); p.property("ADBE Vector Ellipse Size").setValue([w, h]); p.property("ADBE Vector Ellipse Position").setValue([x || 0, y || 0]); return p; }
function forma(v, it, ot, fech) { var s = new Shape(); s.vertices = v; s.inTangents = it; s.outTangents = ot; s.closed = fech; return s; }
function cam(g, v, it, ot, fech) { var p = its(g).addProperty("ADBE Vector Shape - Group"); p.property("ADBE Vector Shape").setValue(forma(v, it, ot, fech)); return p; }
function poli(g, v, fech) { var z = []; for (var i = 0; i < v.length; i++) z.push([0, 0]); return cam(g, v, z, z, fech); }
function fil(g, c, op) { var f = its(g).addProperty("ADBE Vector Graphic - Fill"); f.property("ADBE Vector Fill Color").setValue(hx(c)); if (op != null) f.property("ADBE Vector Fill Opacity").setValue(op); return f; }
function trc(g, c, w, op) { var s = its(g).addProperty("ADBE Vector Graphic - Stroke"); s.property("ADBE Vector Stroke Color").setValue(hx(c)); s.property("ADBE Vector Stroke Width").setValue(w); s.property("ADBE Vector Stroke Line Cap").setValue(2); s.property("ADBE Vector Stroke Line Join").setValue(2); if (op != null) s.property("ADBE Vector Stroke Opacity").setValue(op); return s; }
function apa(g) { return its(g).addProperty("ADBE Vector Filter - Trim"); }
function tl(L) { return L.property("ADBE Transform Group"); }
function novaForma(nome, x, y) { var L = COMP.layers.addShape(); L.name = nome; tl(L).property("ADBE Anchor Point").setValue([0, 0]); tl(L).property("ADBE Position").setValue([x || 0, y || 0]); return L; }
function inf(seg, lado) { if (seg == "io") return 62; if (seg == "o") return lado == 0 ? 14 : 84; if (seg == "i") return lado == 0 ? 84 : 14; if (seg instanceof Array) return seg[lado]; return 33.4; }
function kf(prop, keys) {
  var i;
  for (i = 0; i < keys.length; i++) prop.setValueAtTime(keys[i][0], keys[i][1]);
  for (i = 0; i < keys.length; i++) {
    var k = prop.nearestKeyIndex(keys[i][0]);
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
function kfd(prop, ts, vs) { prop.setValuesAtTimes(ts, vs); for (var i = 1; i <= prop.numKeys; i++) { try { prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR); } catch (e) {} } }
function efeito(L, nome) { return L.property("ADBE Effect Parade").addProperty(nome); }
function cor4(p, c) { try { p.setValue(hx4(c)); } catch (e) { p.setValue(hx(c)); } }
function sombra(L, c, op, dist, suav) { var f = efeito(L, "ADBE Drop Shadow"); cor4(f.property("ADBE Drop Shadow-0001"), c); f.property("ADBE Drop Shadow-0002").setValue(op); f.property("ADBE Drop Shadow-0003").setValue(180); f.property("ADBE Drop Shadow-0004").setValue(dist); f.property("ADBE Drop Shadow-0005").setValue(suav); return f; }
function desfoque(L, v) { var f = efeito(L, "ADBE Gaussian Blur 2"); f.property("ADBE Gaussian Blur 2-0001").setValue(v); try { f.property("ADBE Gaussian Blur 2-0003").setValue(1); } catch (e) {} return f; }
function brilhoFx(L, raio, intens, limiar) { try { var f = efeito(L, "ADBE Glo2"); f.property("ADBE Glo2-0002").setValue(limiar); f.property("ADBE Glo2-0003").setValue(raio); f.property("ADBE Glo2-0004").setValue(intens); return f; } catch (e) { log("brilho falhou: " + e); return null; } }
function texto(nome, txt, fonte, tam, c, just, track) {
  var L = COMP.layers.addText(txt); L.name = nome;
  var P = L.property("ADBE Text Properties").property("ADBE Text Document");
  var d = P.value;
  try { d.resetCharStyle(); d.resetParagraphStyle(); } catch (e) {}
  d.text = txt; d.font = fonte; d.fontSize = tam; d.applyFill = true; d.fillColor = hx(c); d.applyStroke = false;
  d.justification = just; d.tracking = track || 0;
  P.setValue(d);
  return L;
}
function centra(L, x, y) { var r = L.sourceRectAtTime(0, false); tl(L).property("ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]); tl(L).property("ADBE Position").setValue([x, y]); return r; }
function importa(c) { return app.project.importFile(new ImportOptions(new File(c))); }
function mascara(L, v, it, ot, pena) { var m = L.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); m.property("ADBE Mask Shape").setValue(forma(v, it, ot, true)); if (pena) m.property("ADBE Mask Feather").setValue([pena, pena]); return m; }
function enfase(L, a, b, e0, e1) { var P = L.property("ADBE Text Properties").property("ADBE Text Document"); var d = P.value; var cr = d.characterRange(a, b); cr.font = FONTE_ENF; cr.fontSize = TAM_ENF; cr.tracking = 0; if (e0) d.characterRange(a, a + 1).tracking = 140; if (e1) d.characterRange(b - 1, b).tracking = 140; P.setValue(d); }
function legPos(L, y, larg) { var r = L.sourceRectAtTime(0, false); tl(L).property("ADBE Anchor Point").setValue([r.left + r.width / 2, 0]); tl(L).property("ADBE Position").setValue([540, y]); if (r.width > larg) { var k = 100 * larg / r.width; tl(L).property("ADBE Scale").setValue([k, k, 100]); } var mo = L.property("ADBE Text Properties").property("ADBE Text More Options"); mo.property("ADBE Text Anchor Point Option").setValue(2); mo.property("ADBE Text Anchor Point Align").setValue([0, -30]); }
var MARGEM = [];
function confereMargem(L, ts) { MARGEM.push([L, ts]); }
`;

// ---------- ajudantes do lado do Node ----------
// entrada e saída padrão de uma camada (opacidade, escala com pulo, desfoque e um deslize vertical)
function anima(L, x, y, t0, t1, o = {}) {
  const de = o.de ?? 88, dy = o.dy ?? 36, bl = o.bl ?? 16, din = o.din ?? 0.42, dout = o.dout ?? 0.22;
  emit(`${L}.inPoint = ${r3(Math.max(0, t0))}; ${L}.outPoint = ${r3(Math.min(DUR, t1 + 0.02))};`);
  kf(`tl(${L}).property("ADBE Opacity")`, [[t0, 0, "o"], [t0 + Math.min(0.2, din), o.op ?? 100, "io"], [t1 - dout, o.op ?? 100, "io"], [t1, 0, "io"]]);
  kf(`tl(${L}).property("ADBE Scale")`, [...pulo(t0, din, [de, de, 100], [100, 100, 100], o.passa ?? 0.1), [t1 - dout, [100, 100, 100], "io"], [t1, [o.saiEsc ?? 94, o.saiEsc ?? 94, 100], "io"]]);
  if (bl) {
    const f = nv("bl");
    emit(`var ${f} = desfoque(${L}, 0);`);
    kf(`${f}.property("ADBE Gaussian Blur 2-0001")`, [[t0, bl, "o"], [t0 + din * 0.7, 0, "hold"], [t1 - dout, 0, "io"], [t1, bl, "io"]]);
  }
  if (dy) {
    emit(`tl(${L}).property("ADBE Position").dimensionsSeparated = true;`);
    kf(`tl(${L}).property("ADBE Position_1")`, [[t0, y + dy, "o"], [t0 + din, y, "io"], [t1 - dout, y, "io"], [t1, y - dy * 0.5, "io"]]);
  }
  if (o.margem) emit(`confereMargem(${L}, ${J(o.margem)});`);
}
function txt(nome, s, fonte, tam, cor, x, y, t0, t1, o = {}) {
  const L = nv("T");
  emit(`var ${L} = texto(${J(nome)}, ${J(s)}, ${fonte}, ${tam}, "${cor}", ParagraphJustification.CENTER_JUSTIFY, ${o.track ?? 0});`);
  emit(`centra(${L}, ${x}, ${y});`);
  if (o.brilho) emit(`brilhoFx(${L}, ${o.brilho[0]}, ${o.brilho[1]}, ${o.brilho[2] ?? 60});`);
  if (o.sombra) emit(`sombra(${L}, "${C.ink}", 60, 10, 30);`);
  anima(L, x, y, t0, t1, { margem: [t0 + 0.5, (t0 + t1) / 2], ...o });
  return L;
}
function camadaForma(nome, x, y) { const L = nv("F"); emit(`var ${L} = novaForma(${J(nome)}, ${x}, ${y});`); return L; }
function grupo(L, nome) { const g = nv("g"); emit(`var ${g} = grp(H(${L}, []), ${J(nome)});`); return g; }
// cartão de vidro escuro (o card das referências): corpo, filete claro no topo e contorno fino
function cartao(nome, x, y, w, h, r, t0, t1, o = {}) {
  const L = camadaForma(nome, x, y);
  const g1 = grupo(L, "brilho do topo"); emit(`ret(${g1}, ${w - 2 * r}, 2, 1, 0, ${-h / 2 + 2}); fil(${g1}, "#FFFFFF", 22);`);
  const g2 = grupo(L, "corpo"); emit(`ret(${g2}, ${w}, ${h}, ${r}, 0, 0); fil(${g2}, "${o.cor ?? C.ink2}", ${o.opCorpo ?? 94}); trc(${g2}, "${o.linha ?? C.linha}", 2, 100);`);
  emit(`sombra(${L}, "#000000", 55, 22, 60);`);
  anima(L, x, y, t0, t1, { margem: [t0 + 0.5, (t0 + t1) / 2], ...o });
  return L;
}
// o símbolo da marca (quadrado coral com o visto branco), inteiro, com pulo
function simboloCamada(nome, tam, x, y, t0, t1, o = {}) {
  const s = simbolo(tam, 0, 0);
  const L = camadaForma(nome, x, y);
  const g1 = grupo(L, "visto"); emit(`cam(${g1}, ${J(s.v)}, ${J(s.i)}, ${J(s.o)}, true); fil(${g1}, "${o.visto ?? C.papel}");`);
  const g2 = grupo(L, "quadrado"); emit(`ret(${g2}, ${tam}, ${tam}, ${s.raio}, 0, 0); fil(${g2}, "${o.cor ?? C.coral}");`);
  emit(`${L}.inPoint = ${r3(t0)}; ${L}.outPoint = ${r3(Math.min(DUR, t1 + 0.02))};`);
  kf(`tl(${L}).property("ADBE Scale")`, [...pulo(t0, 0.36, [0, 0, 100], [100, 100, 100], 0.12), [t1 - 0.18, [100, 100, 100], "io"], [t1, [80, 80, 100], "io"]]);
  kf(`tl(${L}).property("ADBE Rotate Z")`, [[t0, -18, "o"], [t0 + 0.36, 0, "io"]]);
  kf(`tl(${L}).property("ADBE Opacity")`, [[t0, 0, "o"], [t0 + 0.08, 100, "io"], [t1 - 0.18, 100, "io"], [t1, 0, "io"]]);
  if (o.brilho === true) emit(`brilhoFx(${L}, 24, 0.28, 78);`);
  emit(`confereMargem(${L}, ${J([t0 + 0.4])});`);
  return L;
}
// ícone de traço que se desenha (Trim Paths): cada item é [vértices, fechado]
function iconeTraco(nome, x, y, partes, t0, t1, o = {}) {
  const L = camadaForma(nome, x, y);
  const g = grupo(L, "traço");
  partes.forEach(([v, fech]) => emit(`poli(${g}, ${J(v)}, ${fech ? "true" : "false"});`));
  emit(`trc(${g}, "${o.cor ?? C.creme}", ${o.larg ?? 9}, 100);`);
  const tp = nv("tp");
  emit(`var ${tp} = apa(${g});`);
  kf(`${tp}.property("ADBE Vector Trim End")`, [[t0, 0, "o"], [t0 + (o.dur ?? 0.55), 100, "io"]]);
  emit(`${L}.inPoint = ${r3(t0)}; ${L}.outPoint = ${r3(Math.min(DUR, t1 + 0.02))};`);
  kf(`tl(${L}).property("ADBE Opacity")`, [[t0, 0, "o"], [t0 + 0.1, 100, "io"], [t1 - 0.2, 100, "io"], [t1, 0, "io"]]);
  if (o.brilho) emit(`brilhoFx(${L}, ${o.brilho}, 0.5, 50);`);
  return L;
}
const arco = (cx, cy, r, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; return [r3(cx + r * Math.cos(a)), r3(cy + r * Math.sin(a))]; });
const retV = (cx, cy, w, h, r) => [...arco(cx + w / 2 - r, cy - h / 2 + r, r, -90, 0, 4), ...arco(cx + w / 2 - r, cy + h / 2 - r, r, 0, 90, 4), ...arco(cx - w / 2 + r, cy + h / 2 - r, r, 90, 180, 4), ...arco(cx - w / 2 + r, cy - h / 2 + r, r, 180, 270, 4)];
// o selo do número do motivo: quadrado coral (raio da marca) com o número branco
function selo(n, t0, t1) {
  const x = 172, y = 432, tam = 124;
  const L = camadaForma(`Selo ${n}`, x, y);
  const g = grupo(L, "quadrado"); emit(`ret(${g}, ${tam}, ${tam}, ${r3(tam * 0.27)}, 0, 0); fil(${g}, "${C.coral}");`);
  emit(`${L}.inPoint = ${r3(t0)}; ${L}.outPoint = ${r3(t1 + 0.02)};`);
  kf(`tl(${L}).property("ADBE Scale")`, [...pulo(t0, 0.42, [0, 0, 100], [100, 100, 100], 0.14), [t1 - 0.2, [100, 100, 100], "io"], [t1, [0, 0, 100], "i"]]);
  kf(`tl(${L}).property("ADBE Rotate Z")`, [[t0, -90, "o"], [t0 + 0.42, 0, "io"]]);
  const T = nv("T");
  emit(`var ${T} = texto(${J(`Selo ${n} (número)`)}, "${n}", FONTE8, 88, "${C.papel}", ParagraphJustification.CENTER_JUSTIFY, 0);`);
  emit(`centra(${T}, ${x}, ${y + 2});`);
  emit(`${T}.parent = ${L}; tl(${T}).property("ADBE Position").setValue([0, 2]); ${T}.inPoint = ${r3(t0)}; ${T}.outPoint = ${r3(t1 + 0.02)};`);
  emit(`confereMargem(${L}, ${J([t0 + 0.5])});`);
}

// ---------- montagem ----------
emit(`var PECA = ${J(AQUI)};`);
emit(LIB);
emit(`app.beginSuppressDialogs();`);
emit(`try {`);
emit(`app.beginUndoGroup("montagem");`);
emit(`var LF0 = new File(PECA + "/monta.log"); if (LF0.exists) LF0.remove();`);
emit(`if (app.project.numItems > 0) throw new Error("o projeto aberto no AE não está vazio: salve ou feche antes de montar");`);
emit(`var COMP = app.project.items.addComp("CINCO-MOTIVOS", 1080, 1920, 1, ${DUR}, ${FPS});`);
emit(`COMP.bgColor = hx("${C.ink}"); COMP.motionBlur = true; COMP.shutterAngle = 180;`);
emit(`var FONTE = "Sora-Bold", FONTE8 = "Sora-ExtraBold", FONTE_ENF = "DMSerifDisplay-Italic", TAM_ENF = 96;`);
emit(`log("comp ok");`);

// ===== fundo (a ordem do código é de baixo pra cima: a camada nova entra no topo) =====
emit(`var FUNDO = COMP.layers.addSolid(hx("${C.ink}"), "Fundo", 1080, 1920, 1, ${DUR});`);
// a luz em gradiente das referências, em coral, que respira devagar
{
  const L = camadaForma("Luz coral", 0, 0);
  const g1 = grupo(L, "luz alta"); emit(`eli(${g1}, 1100, 1100, 0, 0); fil(${g1}, "${C.coral}", 60);`);
  emit(`tfg(${g1}).property("ADBE Vector Position").expression = "[230 + Math.sin(time*0.31)*140, 520 + Math.cos(time*0.27)*120]";`);
  const g2 = grupo(L, "luz baixa"); emit(`eli(${g2}, 1300, 1300, 0, 0); fil(${g2}, "${C.coral7}", 70);`);
  emit(`tfg(${g2}).property("ADBE Vector Position").expression = "[900 + Math.cos(time*0.23)*160, 1500 + Math.sin(time*0.29)*140]";`);
  emit(`desfoque(${L}, 320);`);
  emit(`${L}.blendingMode = BlendingMode.SCREEN;`);
  kf(`tl(${L}).property("ADBE Opacity")`, [[0, 34], [3.3, 38], [3.6, 60], [5.6, 46], [40.5, 46], [40.9, 0]]);
  emit(`${L}.outPoint = 41.0;`);
}
// a grade de pontos acesos (o LED das referências), bem apagada
{
  const L = camadaForma("Grade de pontos", 60, 64);
  const g = grupo(L, "ponto"); emit(`eli(${g}, 6, 6, 0, 0); fil(${g}, "${C.creme}", 100);`);
  emit(`try { var rp1 = its(${g}).addProperty("ADBE Vector Filter - Repeater"); rp1.property("ADBE Vector Repeater Copies").setValue(21); rp1.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([48, 0]);`);
  emit(`var rp2 = its(${g}).addProperty("ADBE Vector Filter - Repeater"); rp2.property("ADBE Vector Repeater Copies").setValue(38); rp2.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 48]); } catch (e) { log("repetidor falhou: " + e); }`);
  kf(`tl(${L}).property("ADBE Opacity")`, [[0, 0], [0.4, 9], [40.4, 9], [40.8, 0]]);
  emit(`tl(${L}).property("ADBE Position").expression = "value + [0, -((time*6) % 48)]";`);
  emit(`${L}.outPoint = 41.0;`);
}
// partículas: pontos de luz que sobem devagar, em coral e creme
{
  const L = camadaForma("Partículas", 0, 0);
  let seed = 11;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < 44; i++) {
    const g = grupo(L, `p${i}`);
    const s = 4 + Math.round(rnd() * 9), cor = rnd() < 0.55 ? C.coral : C.creme, op = 40 + Math.round(rnd() * 55);
    const x0 = Math.round(rnd() * 1080), y0 = Math.round(rnd() * 1920), vy = 14 + Math.round(rnd() * 36), f = r3(0.3 + rnd() * 0.9), ph = r3(rnd() * 6.28), amp = 10 + Math.round(rnd() * 34);
    emit(`eli(${g}, ${s}, ${s}, 0, 0); fil(${g}, "${cor}", ${op});`);
    emit(`tfg(${g}).property("ADBE Vector Position").expression = "var y = ((${y0} - time*${vy}) % 1980 + 1980) % 1980 - 30; [${x0} + Math.sin(time*${f} + ${ph})*${amp}, y]";`);
    emit(`tfg(${g}).property("ADBE Vector Group Opacity").expression = "55 + 45*Math.sin(time*${r3(f * 2.3)} + ${ph})";`);
  }
  emit(`brilhoFx(${L}, 24, 1.1, 30);`);
  kf(`tl(${L}).property("ADBE Opacity")`, [[0, 0], [0.5, 100]]);
}
// raios de luz (a explosão das referências): estrela de muitas pontas, borrada, em modo somar
const RAIOS = [3.27, 5.62, 10.62, 19.15, 25.81, 30.07, 31.87, 40.9];
{
  const L = camadaForma("Raios", 540, 820);
  const g = grupo(L, "raios");
  emit(`try { var st = its(${g}).addProperty("ADBE Vector Shape - Star"); st.property("ADBE Vector Star Type").setValue(1); st.property("ADBE Vector Star Points").setValue(18); st.property("ADBE Vector Star Inner Radius").setValue(40); st.property("ADBE Vector Star Outer Radius").setValue(1100); } catch (e) { log("estrela falhou: " + e); }`);
  emit(`fil(${g}, "${C.coral}", 100);`);
  emit(`desfoque(${L}, 46);`);
  emit(`${L}.blendingMode = BlendingMode.ADD;`);
  emit(`tl(${L}).property("ADBE Rotate Z").expression = "time*9";`);
  const ch = [[0, 0]];
  RAIOS.forEach((t) => ch.push([t - 0.08, 0, "o"], [t + 0.06, 42, "io"], [t + 0.9, 0, "io"]));
  kf(`tl(${L}).property("ADBE Opacity")`, ch);
  const es = [[0, [60, 60, 100]]];
  RAIOS.forEach((t) => es.push([t - 0.08, [60, 60, 100], "o"], [t + 0.9, [120, 120, 100], "io"]));
  kf(`tl(${L}).property("ADBE Scale")`, es);
}
emit(`log("fundo ok");`);

// ===== cena 0: o gancho ("Ainda recebe pelo seu trabalho no CPF?") =====
{
  const t0 = 0.05, t1 = 3.12;
  cartao("Gancho: cartão", 540, 830, 820, 600, 44, t0, t1, { de: 84 });
  // o documento do CPF se desenha: o cartão, a foto e as linhas
  iconeTraco("Gancho: documento", 540, 740, [
    [retV(0, 0, 420, 260, 34), true],
    [arco(-118, -20, 46, 0, 360, 24), true],
    [arco(-118, 88, 76, 200, 340, 12), false],
    [[[10, -60], [160, -60]], false], [[[10, -10], [130, -10]], false], [[[10, 40], [160, 40]], false],
  ], 0.35, t1 - 0.05, { dur: 1.2, larg: 10, brilho: 22 });
  // "CPF" grande no "CPF?", com o ponto de interrogação em DM Serif
  txt("Gancho: CPF", "CPF", "FONTE8", 190, C.papel, 500, 1010, S("CPF") - 0.06, t1, { brilho: [26, 0.3, 78], track: 40, dy: 50 });
  txt("Gancho: interrogação", "?", "FONTE_ENF", 230, C.coral, 762, 1010, S("CPF") + 0.18, t1, { brilho: [28, 0.35, 75], de: 40, passa: 0.18 });
}
emit(`log("cena 0 ok");`);

// ===== cena 1: "Cinco motivos pra ter CNPJ." =====
{
  const t0 = S("Cinco") - 0.05, t1 = 5.55;
  txt("Abertura: 5", "5", "FONTE8", 560, C.coral, 540, 760, t0, t1, { de: 30, passa: 0.16, dy: 0 });
  txt("Abertura: motivos", "motivos", "FONTE_ENF", 150, C.papel, 540, 1075, S("motivos") - 0.04, t1, {});
  txt("Abertura: pra ter CNPJ", "pra ter CNPJ", "FONTE", 66, C.creme, 540, 1195, S("pra") - 0.02, t1, { op: 82 });
}
// a barra dos cinco motivos no topo (o motivo da vez acende em coral)
const INI = [S("Um"), S("Dois"), S("Três"), S("Quatro"), S("Cinco", 2)];
{
  const tIn = 4.75, tOut = 33.4;
  for (let i = 0; i < 5; i++) {
    const x = 540 + (i - 2) * 132;
    const L = camadaForma(`Barra ${i + 1}`, x, 302);
    const g1 = grupo(L, "acesa"); emit(`ret(${g1}, 112, 12, 6, 0, 0); fil(${g1}, "${C.coral}", 100);`);
    kf(`tfg(${g1}).property("ADBE Vector Scale")`, [[INI[i] + 0.05, [0, 100], "o"], [INI[i] + 0.4, [100, 100], "io"]]);
    emit(`tfg(${g1}).property("ADBE Vector Anchor").setValue([-56, 0]); tfg(${g1}).property("ADBE Vector Position").setValue([-56, 0]);`);
    const g2 = grupo(L, "trilho"); emit(`ret(${g2}, 112, 12, 6, 0, 0); fil(${g2}, "${C.linha}", 100);`);
    emit(`${L}.inPoint = ${r3(tIn)}; ${L}.outPoint = ${r3(tOut + 0.02)};`);
    kf(`tl(${L}).property("ADBE Opacity")`, [[tIn + i * 0.05, 0, "o"], [tIn + 0.25 + i * 0.05, 100, "io"], [tOut - 0.25, 100, "io"], [tOut, 0, "io"]]);
    emit(`brilhoFx(${L}, 14, 0.35, 65);`);
  }
}
emit(`log("cena 1 ok");`);

// ===== cena 2: motivo 1 ("no MEI, a guia é fixa, fature 500 ou 5 mil") =====
{
  const t0 = S("Um") - 0.03, t1 = 10.52;
  selo(1, t0, t1);
  // a guia de papel (sem valor nenhum: F063), que fica do mesmo tamanho
  const tg = S("MEI") - 0.05;
  const L = camadaForma("Motivo 1: guia", 540, 820);
  const gl = grupo(L, "linhas");
  [[-60, 200], [-10, 250], [40, 170], [90, 230]].forEach(([y, w]) => emit(`ret(${gl}, ${w}, 18, 9, ${-150 + w / 2}, ${y}); fil(${gl}, "${C.cinzaPapel}", 100);`));
  const gb = grupo(L, "barras"); for (let i = 0; i < 18; i++) emit(`ret(${gb}, ${i % 3 === 0 ? 8 : 4}, 54, 0, ${-150 + i * 17}, 190); fil(${gb}, "${C.ink}", 85);`);
  const gc = grupo(L, "cabeça"); emit(`ret(${gc}, 300, 40, 12, 0, -170); fil(${gc}, "${C.coral}", 100);`);
  const gp = grupo(L, "papel"); emit(`ret(${gp}, 380, 500, 30, 0, 0); fil(${gp}, "${C.papel}", 100);`);
  emit(`sombra(${L}, "#000000", 60, 26, 70);`);
  anima(L, 540, 820, tg, t1, { de: 80, dy: 90, margem: [tg + 0.5] });
  kf(`tl(${L}).property("ADBE Rotate Z")`, [[tg, 9, "o"], [tg + 0.55, -2, "io"], [tg + 0.8, 0, "io"]]);
  // "fixa": o cadeado se desenha em cima da guia e trava
  const tf = S("fixa") - 0.05;
  const cad = iconeTraco("Motivo 1: cadeado", 540, 492, [[retV(0, 22, 92, 72, 16), true], [arco(0, -10, 28, 180, 360, 12), false]], tf, t1, { cor: C.coral, larg: 11, dur: 0.35, brilho: 30 });
  kf(`tl(${cad}).property("ADBE Scale")`, [[tf + 0.36, [100, 100, 100], "o"], [tf + 0.46, [114, 114, 100], "io"], [tf + 0.62, [100, 100, 100], "io"]]);
  // 500 ou 5 mil: os dois valores aparecem dos lados, e a guia não muda
  const pilula = (nome, s, x, t) => {
    const P = camadaForma(nome, x, 1210);
    const g = grupo(P, "pílula"); emit(`ret(${g}, 300, 104, 52, 0, 0); fil(${g}, "${C.ink3}", 100); trc(${g}, "${C.coral}", 3, 100);`);
    anima(P, x, 1210, t, t1, { de: 70, dy: 40, margem: [t + 0.5] });
    const T = txt(`${nome} (texto)`, s, "FONTE8", 58, C.papel, x, 1212, t, t1, { de: 70, dy: 40 });
    return T;
  };
  pilula("Motivo 1: R$ 500", "R$ 500", 252, S("500") - 0.05);
  pilula("Motivo 1: R$ 5 mil", "R$ 5 mil", 828, S("5") - 0.05);
}
emit(`log("cena 2 ok");`);

// ===== cena 3: motivo 2 ("numa microempresa que começa em 6%, de 10 mil, uns 600 de imposto e uns 9.400 no bolso") =====
{
  const t0 = S("Dois") - 0.03, t1 = 18.85;
  selo(2, t0, t1);
  // a maleta da microempresa se desenha, e dá lugar ao 6% contando
  const tm = S("Dois") + 0.35, t6 = S("6%") - 0.08;
  iconeTraco("Motivo 2: maleta", 540, 700, [[retV(0, 20, 300, 200, 30), true], [retV(0, -100, 110, 50, 18), false], [[[-150, 20], [150, 20]], false]], tm, t6 + 0.1, { larg: 12, dur: 0.6, brilho: 26 });
  const T6 = txt("Motivo 2: 6%", "6%", "FONTE8", 300, C.coral, 540, 690, t6, t1, { de: 50, passa: 0.14 });
  emit(`${T6}.property("ADBE Text Properties").property("ADBE Text Document").expression = "Math.round(linear(time, ${r3(t6)}, ${r3(t6 + 0.5)}, 0, 6)) + '%'";`);
  // a barra dos 10 mil enche da esquerda pra direita
  const tb = S("10") - 0.06, BX = 540, BY = 1000, BW = 820, BH = 112;
  const B = camadaForma("Motivo 2: barra 10 mil", BX, BY);
  const gf = grupo(B, "cheio"); emit(`ret(${gf}, ${BW}, ${BH}, ${BH / 2}, 0, 0); fil(${gf}, "${C.creme}", 100);`);
  emit(`tfg(${gf}).property("ADBE Vector Anchor").setValue([${-BW / 2}, 0]); tfg(${gf}).property("ADBE Vector Position").setValue([${-BW / 2}, 0]);`);
  kf(`tfg(${gf}).property("ADBE Vector Scale")`, [[tb, [0, 100], "o"], [tb + 0.55, [100, 100], "io"]]);
  emit(`brilhoFx(${B}, 22, 0.2, 85);`);
  anima(B, BX, BY, tb - 0.1, t1, { de: 96, dy: 30, bl: 0, margem: [tb + 0.7] });
  txt("Motivo 2: R$ 10.000", "R$ 10.000", "FONTE8", 56, C.ink, BX - 150, BY + 2, tb + 0.35, t1, { dy: 0, de: 90 });
  // os 600 do imposto: a fatia coral sai da ponta da barra e desce
  const t600 = S("600") - 0.1, FW = r3(BW * 0.06);
  const Fa = camadaForma("Motivo 2: fatia do imposto", BX + BW / 2 - FW / 2 - 6, BY);
  const gfa = grupo(Fa, "fatia"); emit(`ret(${gfa}, ${FW + 12}, ${BH}, 20, 0, 0); fil(${gfa}, "${C.coral}", 100);`);
  emit(`brilhoFx(${Fa}, 22, 0.3, 75);`);
  emit(`${Fa}.inPoint = ${r3(t600)}; ${Fa}.outPoint = ${r3(t1 + 0.02)};`);
  kf(`tl(${Fa}).property("ADBE Position")`, [[t600, [BX + BW / 2 - FW / 2 - 6, BY], "o"], [t600 + 0.5, [905, BY + 150], "io"]]);
  kf(`tl(${Fa}).property("ADBE Rotate Z")`, [[t600, 0, "o"], [t600 + 0.5, -12, "io"]]);
  kf(`tl(${Fa}).property("ADBE Opacity")`, [[t600, 0, "o"], [t600 + 0.08, 100, "io"], [t1 - 0.2, 100, "io"], [t1, 0, "io"]]);
  emit(`confereMargem(${Fa}, ${J([t600 + 0.6])});`);
  txt("Motivo 2: uns R$ 600", "uns R$ 600", "FONTE8", 54, C.coral, 790, BY + 268, t600 + 0.3, t1, { de: 80 });
  // os 9.400 no bolso: a barra que fica acende, com o símbolo da marca no "bolso"
  const t94 = S("9.400") - 0.1;
  txt("Motivo 2: uns R$ 9.400", "uns R$ 9.400", "FONTE8", 76, C.papel, 360, BY + 170, t94, t1, { brilho: [24, 0.28, 80], de: 70 });
  simboloCamada("Motivo 2: símbolo do bolso", 96, 360, BY + 290, S("bolso") - 0.05, t1);
}
emit(`log("cena 3 ok");`);

// ===== cena 4: motivo 3 ("na microempresa, seu salário de dono recolhe INSS pra sua aposentadoria") =====
{
  const t0 = S("Três") - 0.03, t1 = 25.18;
  selo(3, t0, t1);
  const CX = 540, CY = 900, CW = 800, CH = 560;
  cartao("Motivo 3: painel de pontos", CX, CY, CW, CH, 40, S("microempresa", 2) - 0.1, t1, { de: 90 });
  // a grade de LED: 12 colunas, os pontos apagados primeiro
  const COL = 12, LIN = 8, PX = 56, x0 = CX - ((COL - 1) * PX) / 2, y0 = CY + 230;
  {
    const L = camadaForma("Motivo 3: pontos apagados", 0, 0);
    const g = grupo(L, "pontos");
    for (let c = 0; c < COL; c++) for (let l = 0; l < LIN; l++) emit(`eli(${g}, 18, 18, ${r3(x0 + c * PX)}, ${r3(y0 - l * PX)});`);
    emit(`fil(${g}, "${C.creme}", 16);`);
    anima(L, 0, 0, S("microempresa", 2) + 0.15, t1, { de: 100, dy: 0, bl: 8 });
  }
  // as colunas acendem da esquerda pra direita, cada uma mais alta (o INSS que vai virando aposentadoria)
  const ALT = [1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 7, 8];
  const tA = S("recolhe") - 0.05, tZ = S("aposentadoria") + 0.25;
  for (let c = 0; c < COL; c++) {
    const L = camadaForma(`Motivo 3: coluna ${c + 1}`, 0, 0);
    const g = grupo(L, "pontos");
    for (let l = 0; l < ALT[c]; l++) emit(`eli(${g}, 20, 20, ${r3(x0 + c * PX)}, ${r3(y0 - l * PX)});`);
    emit(`fil(${g}, "${c >= COL - 2 ? C.papel : C.coral}", 100);`);
    emit(`brilhoFx(${L}, 20, 0.7, 45);`);
    const t = tA + ((tZ - tA) * c) / (COL - 1);
    emit(`${L}.inPoint = ${r3(t)}; ${L}.outPoint = ${r3(t1 + 0.02)};`);
    kf(`tl(${L}).property("ADBE Opacity")`, [[t, 0, "o"], [t + 0.12, 100, "io"], [t1 - 0.2, 100, "io"], [t1, 0, "io"]]);
  }
  // a pílula do INSS entra no "INSS" e o símbolo da marca fecha no "aposentadoria"
  const ti = S("INSS") - 0.06;
  const P = camadaForma("Motivo 3: pílula INSS", CX - CW / 2 + 140, CY - CH / 2 + 66);
  const gp = grupo(P, "pílula"); emit(`ret(${gp}, 190, 76, 38, 0, 0); fil(${gp}, "${C.coral}", 100);`);
  anima(P, CX - CW / 2 + 140, CY - CH / 2 + 66, ti, t1, { de: 60, dy: 20, margem: [ti + 0.4] });
  txt("Motivo 3: INSS (texto)", "INSS", "FONTE8", 44, C.papel, CX - CW / 2 + 140, CY - CH / 2 + 68, ti, t1, { de: 60, dy: 20, bl: 0 });
  simboloCamada("Motivo 3: símbolo", 92, CX + CW / 2 - 86, CY - CH / 2 + 64, S("aposentadoria") + 0.1, t1);
}
emit(`log("cena 4 ok");`);

// ===== cenas 5 a 7: o celular 3D (sequência PNG do Remotion, com alfa, 25,2 a 40,6 s) =====
emit(`var io = new ImportOptions(new File(PECA + "/assets/celular-3d/cel_0000.png")); io.sequence = true; io.forceAlphabetical = true;`);
emit(`var SEQ = app.project.importFile(io); SEQ.mainSource.conformFrameRate = ${FPS}; try { SEQ.mainSource.alphaMode = AlphaMode.STRAIGHT; } catch (e) {}`);
emit(`var CEL = COMP.layers.add(SEQ); CEL.name = "Celular 3D"; CEL.startTime = 25.2;`);
emit(`tl(CEL).property("ADBE Scale").setValue([50, 50, 100]);`);
kf(`tl(CEL).property("ADBE Position")`, [[25.2, [1460, 900], "o"], [25.85, [700, 830], "io"], [40.12, [700, 830], "i"], [40.6, [1420, 700], "io"]]);
kf(`tl(CEL).property("ADBE Opacity")`, [[25.2, 0, "o"], [25.32, 100, "io"], [40.4, 100, "io"], [40.6, 0, "io"]]);
emit(`sombra(CEL, "#000000", 50, 30, 80);`);
// a luz coral atrás do celular
{
  const L = camadaForma("Celular: luz atrás", 700, 830);
  const g = grupo(L, "luz"); emit(`eli(${g}, 620, 900, 0, 0); fil(${g}, "${C.coral}", 100);`);
  emit(`desfoque(${L}, 180);`);
  emit(`${L}.inPoint = 25.4; ${L}.outPoint = 40.62;`);
  kf(`tl(${L}).property("ADBE Opacity")`, [[25.4, 0, "o"], [26.0, 32, "io"], [40.2, 32, "io"], [40.6, 0, "io"]]);
  emit(`${L}.moveAfter(CEL);`);
}
emit(`log("celular ok");`);

// ===== cena 5: motivo 4 ("o app calcula. Você emite a nota e paga.") =====
{
  const t0 = S("Quatro") - 0.03, t1 = 30.0;
  selo(4, t0, t1);
  const X = 262;
  const card = (nome, y, t, partes) => {
    cartao(`${nome}: cartão`, X, y, 200, 200, 40, t, t1, { de: 70 });
    iconeTraco(`${nome}: ícone`, X, y - 6, partes, t + 0.12, t1, { larg: 9, dur: 0.45, brilho: 20 });
    simboloCamada(`${nome}: símbolo`, 46, X + 62, y + 62, t + 0.45, t1, { brilho: false });
  };
  card("Motivo 4: calcula", 600, S("calcula") - 0.1, [[retV(0, 0, 96, 120, 16), true], [retV(0, -30, 64, 26, 6), true], [[[-26, 14], [-26, 14.1]], false], [[[0, 14], [0, 14.1]], false], [[[26, 14], [26, 14.1]], false], [[[-26, 40], [-26, 40.1]], false], [[[0, 40], [0, 40.1]], false], [[[26, 40], [26, 40.1]], false]]);
  card("Motivo 4: nota", 840, S("nota") - 0.12, [[retV(0, 0, 88, 116, 14), true], [[[-24, -26], [24, -26]], false], [[[-24, 0], [24, 0]], false], [[[-24, 26], [10, 26]], false]]);
  card("Motivo 4: paga", 1080, S("paga") - 0.12, [[[[-42, -40], [-42, 40]], false], [[[-26, -40], [-26, 40]], false], [[[-14, -40], [-14, 40]], false], [[[4, -40], [4, 40]], false], [[[18, -40], [18, 40]], false], [[[30, -40], [30, 40]], false], [[[44, -40], [44, 40]], false]]);
}
emit(`log("cena 5 ok");`);

// ===== cena 6: motivo 5 ("a abertura é com a gente, sem honorário") =====
{
  const t0 = S("Cinco", 2) - 0.03, t1 = 33.42;
  selo(5, t0, t1);
  // o contrato se desenha e o carimbo da marca cai nele no "gente"
  const ta = S("abertura") - 0.1, tg = S("gente") - 0.06;
  iconeTraco("Motivo 5: contrato", 262, 840, [[retV(0, 0, 250, 320, 24), true], [[[-80, -100], [80, -100]], false], [[[-80, -50], [80, -50]], false], [[[-80, 0], [40, 0]], false], [[[-80, 110], [-10, 110]], false]], ta, t1, { larg: 9, dur: 0.6, brilho: 18 });
  const SB = simboloCamada("Motivo 5: carimbo da marca", 150, 262, 870, tg, t1);
  kf(`tl(${SB}).property("ADBE Position")`, [[tg, [262, 700], "i"], [tg + 0.16, [262, 870], "io"]]);
  // a onda do carimbo
  const L = camadaForma("Motivo 5: onda", 262, 870);
  const g = grupo(L, "anel"); emit(`eli(${g}, 200, 200, 0, 0); trc(${g}, "${C.coral}", 8, 100);`);
  emit(`${L}.inPoint = ${r3(tg + 0.14)}; ${L}.outPoint = ${r3(tg + 0.9)};`);
  kf(`tl(${L}).property("ADBE Scale")`, [[tg + 0.14, [80, 80, 100], "o"], [tg + 0.8, [160, 160, 100], "io"]]);
  kf(`tl(${L}).property("ADBE Opacity")`, [[tg + 0.14, 100, "o"], [tg + 0.8, 0, "io"]]);
  emit(`brilhoFx(${L}, 30, 1.0, 30);`);
}
emit(`log("cena 6 ok");`);

// ===== cena 7: o chamado ("Se você não quer se preocupar com toda a burocracia..., clique no link da bio e entre na lista de espera...") =====
{
  const t0 = S("Se") - 0.05, t1 = 40.5;
  // a pilha de papel da burocracia: as folhas caem uma a uma, tremem e voam pra fora no "burocracia"
  const tbur = S("burocracia");
  for (let i = 0; i < 6; i++) {
    const ti = t0 + 0.1 + i * 0.28, y = 1040 - i * 26, rz = [-6, 4, -3, 7, -5, 3][i];
    const L = camadaForma(`Burocracia: folha ${i + 1}`, 262, y);
    const gl = grupo(L, "linhas"); [-40, -10, 20].forEach((yy) => emit(`ret(${gl}, 150, 10, 5, -10, ${yy}); fil(${gl}, "${C.cinzaPapel}", 100);`));
    const gp = grupo(L, "papel"); emit(`ret(${gp}, 230, 150, 14, 0, 0); fil(${gp}, "${C.papel}", 100); trc(${gp}, "${C.cinzaPapel}", 2, 100);`);
    emit(`sombra(${L}, "#000000", 45, 8, 20);`);
    emit(`${L}.inPoint = ${r3(ti)}; ${L}.outPoint = ${r3(tbur + 1.0)};`);
    kf(`tl(${L}).property("ADBE Position")`, [[ti, [262 + (i % 2 ? 40 : -40), y - 420], "i"], [ti + 0.3, [262, y], "io"], [tbur + 0.05 + i * 0.04, [262, y], "i"], [tbur + 0.75 + i * 0.04, [-260, y - 360 - i * 60], "io"]]);
    kf(`tl(${L}).property("ADBE Rotate Z")`, [[ti, rz * 3, "o"], [ti + 0.3, rz, "io"], [tbur + 0.05 + i * 0.04, rz, "i"], [tbur + 0.75 + i * 0.04, rz - 70, "io"]]);
    emit(`tl(${L}).property("ADBE Rotate Z").expression = "value + (time > ${r3(tbur - 0.45)} && time < ${r3(tbur + 0.05)} ? Math.sin(time*70 + ${i})*3 : 0)";`);
    kf(`tl(${L}).property("ADBE Opacity")`, [[ti, 0, "o"], [ti + 0.08, 100, "io"]]);
  }
  // o link da bio: a pílula coral, com o toque no "clique" e no "bio"
  const tc = S("clique") - 0.1, X = 262, Y = 820;
  const P = camadaForma("Link da bio: pílula", X, Y);
  const gp = grupo(P, "pílula"); emit(`ret(${gp}, 330, 104, 52, 0, 0); fil(${gp}, "${C.coral6}", 100);`);
  emit(`brilhoFx(${P}, 26, 0.3, 78);`);
  anima(P, X, Y, tc, t1, { de: 60, dy: 30, margem: [tc + 0.5] });
  txt("Link da bio: texto", "LINK DA BIO", "FONTE8", 36, C.papel, X, Y + 2, tc + 0.02, t1, { de: 60, dy: 30, bl: 0, track: 30 });
  [S("clique"), S("bio")].forEach((tt, k) => {
    const R = camadaForma(`Link da bio: toque ${k + 1}`, X + 90, Y + 14);
    const g = grupo(R, "toque"); emit(`eli(${g}, 60, 60, 0, 0); fil(${g}, "${C.papel}", 55);`);
    emit(`${R}.inPoint = ${r3(tt)}; ${R}.outPoint = ${r3(tt + 0.55)};`);
    kf(`tl(${R}).property("ADBE Scale")`, [[tt, [40, 40, 100], "o"], [tt + 0.5, [260, 260, 100], "io"]]);
    kf(`tl(${R}).property("ADBE Opacity")`, [[tt, 100, "o"], [tt + 0.5, 0, "io"]]);
  });
  kf(`tl(${P}).property("ADBE Scale")`, [[S("clique"), [100, 100, 100], "o"], [S("clique") + 0.08, [92, 92, 100], "io"], [S("clique") + 0.22, [100, 100, 100], "io"], [S("bio"), [100, 100, 100], "o"], [S("bio") + 0.08, [92, 92, 100], "io"], [S("bio") + 0.22, [100, 100, 100], "io"]]);
  // a lista de espera: o cartão com três linhas e o símbolo da marca na primeira, no "espera"
  const te = S("lista") - 0.1, LY = 1110;
  cartao("Lista de espera: cartão", X, LY, 330, 250, 34, te, t1, { de: 80 });
  {
    const L = camadaForma("Lista de espera: linhas", X, LY);
    const g = grupo(L, "linhas");
    [[-70, 150], [0, 190], [70, 120]].forEach(([y, w]) => emit(`ret(${g}, ${w}, 18, 9, ${-40 + w / 2 - 60}, ${y}); fil(${g}, "${C.cinza}", 70);`));
    anima(L, X, LY, te + 0.15, t1, { de: 90, dy: 20, bl: 0 });
  }
  simboloCamada("Lista de espera: símbolo", 58, X - 115, LY - 70, S("espera") - 0.05, t1, { brilho: false });
}
emit(`log("cena 7 ok");`);

// ===== cena 8: o fecho ("Vai, Legalizaí!", do kit) no papel =====
{
  const tv = 40.9, tc = 40.45;
  // o papel abre do centro com um anel coral na frente
  const L = camadaForma("Fecho: papel", 540, 900);
  const g = grupo(L, "papel"); emit(`eli(${g}, 200, 200, 0, 0); fil(${g}, "${C.papel}", 100);`);
  emit(`${L}.inPoint = ${r3(tc)}; ${L}.outPoint = ${DUR};`);
  kf(`tl(${L}).property("ADBE Scale")`, [[tc, [0, 0, 100], "i"], [tc + 0.5, [1500, 1500, 100], "io"]]);
  const A = camadaForma("Fecho: anel", 540, 900);
  const ga = grupo(A, "anel"); emit(`eli(${ga}, 200, 200, 0, 0); trc(${ga}, "${C.coral}", 6, 100);`);
  emit(`${A}.inPoint = ${r3(tc)}; ${A}.outPoint = ${r3(tc + 0.62)};`);
  kf(`tl(${A}).property("ADBE Scale")`, [[tc, [0, 0, 100], "i"], [tc + 0.55, [1540, 1540, 100], "io"]]);
  kf(`tl(${A}).property("ADBE Opacity")`, [[tc, 100, "o"], [tc + 0.62, 0, "io"]]);
  // o logo da marca (o desenho oficial), que pousa e acende no "aí"
  const LOGO_ARQ = path.resolve(AQUI, "../sufoco-linha-ae/assets/logo-horizontal.png").split(path.sep).join("/");
  emit(`var LOGO = COMP.layers.add(importa(${J(LOGO_ARQ)})); LOGO.name = "Fecho: logo";`);
  emit(`var kLogo = 100 * 640 / LOGO.width; tl(LOGO).property("ADBE Position").setValue([540, 900]);`);
  emit(`LOGO.inPoint = ${r3(tv - 0.05)}; LOGO.outPoint = ${DUR};`);
  emit(`tl(LOGO).property("ADBE Scale").setValueAtTime(${r3(tv - 0.05)}, [kLogo * 0.6, kLogo * 0.6, 100]); tl(LOGO).property("ADBE Scale").setValueAtTime(${r3(tv + 0.25)}, [kLogo * 1.04, kLogo * 1.04, 100]); tl(LOGO).property("ADBE Scale").setValueAtTime(${r3(tv + 0.45)}, [kLogo, kLogo, 100]);`);
  kf(`tl(LOGO).property("ADBE Opacity")`, [[tv - 0.05, 0, "o"], [tv + 0.12, 100, "io"]]);
  emit(`var bLogo = brilhoFx(LOGO, 40, 0, 60); if (bLogo) { try { kf(bLogo.property("ADBE Glo2-0004"), [[${r3(tv + 0.9)}, 0, "o"], [${r3(tv + 1.0)}, 1.2, "io"], [${r3(tv + 1.6)}, 0, "io"]]); } catch (e) { log("brilho do logo: " + e); } }`);
  emit(`confereMargem(LOGO, [${r3(tv + 0.5)}]);`);
}
emit(`log("fecho ok");`);

// ===== legenda em blocos (3 a 4 palavras), a ênfase na DM Serif coral =====
phrases.forEach((p, n) => {
  legendaDaFrase(words, p).forEach(({ idx, ws, txt: tx, ik, tin, tout, dIn, dOut }, k) => {
    const L = nv("LG");
    emit(`var ${L} = texto(${J(`Legenda ${n + 1}.${k + 1}`)}, ${J(tx)}, FONTE, 72, "${C.papel}", ParagraphJustification.CENTER_JUSTIFY, -25);`);
    if (ik >= 0) {
      const c0 = ws.slice(0, ik).reduce((s, w) => s + w.length + 1, 0);
      const e0 = ik > 0 ? 1 : 0, e1 = ik < ws.length - 1 ? 1 : 0;
      emit(`enfase(${L}, ${c0 - e0}, ${c0 + ws[ik].length + e1}, ${e0}, ${e1});`);
    }
    emit(`legPos(${L}, ${Y_LEG}, ${LARG_LEG});`);
    emit(`${L}.inPoint = ${r3(Math.max(0, tin))}; ${L}.outPoint = ${r3(Math.min(40.6, tout + dOut + 0.02))};`);
    emit(`sombra(${L}, "#000000", 70, 6, 24);`);
    emit(`var anims = ${L}.property("ADBE Text Properties").property("ADBE Text Animators");`);
    const sel = (v, j) => `var ${v} = av${v}.property("ADBE Text Selectors").addProperty("ADBE Text Selector"); var adv${v} = ${v}.property("ADBE Text Range Advanced"); adv${v}.property("ADBE Text Range Units").setValue(2); adv${v}.property("ADBE Text Range Type2").setValue(3); ${v}.property("ADBE Text Index Start").setValue(${j}); ${v}.property("ADBE Text Index End").setValue(${j + 1});`;
    if (ik >= 0) {
      emit(`var avsK = anims.addProperty("ADBE Text Animator"); avsK.name = "chave"; cor4(avsK.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color"), "${C.coral}");`);
      emit(sel("sK", ik));
    }
    emit(`var avD = anims.addProperty("ADBE Text Animator"); avD.name = "apagado"; avD.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(32);`);
    emit(`avD.property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D").setValue([0, 7, 0]);`);
    emit(`var sD = avD.property("ADBE Text Selectors").addProperty("ADBE Text Selector"); var advD = sD.property("ADBE Text Range Advanced");`);
    emit(`advD.property("ADBE Text Range Units").setValue(2); advD.property("ADBE Text Range Type2").setValue(3); sD.property("ADBE Text Index End").setValue(999);`);
    const ts = [], vs = [];
    idx.forEach((wi, j) => {
      const w = words[wi];
      const t0 = Math.max(w.s - 0.04, ts.length ? ts[ts.length - 1] + 0.01 : -1);
      ts.push(t0); vs.push(j);
      ts.push(Math.max(t0 + 0.02, w.s + 0.16)); vs.push(j + 1);
    });
    for (let i = 1; i < ts.length; i++) if (ts[i] <= ts[i - 1]) ts[i] = ts[i - 1] + 0.005;
    emit(`kfd(sD.property("ADBE Text Index Start"), ${J(ts.map(r3))}, ${J(vs)});`);
    if (ik >= 0) {
      const tk = words[p.key].s - 0.03;
      emit(`var avsP = anims.addProperty("ADBE Text Animator"); avsP.name = "pulo"; avsP.property("ADBE Text Animator Properties").addProperty("ADBE Text Scale 3D").setValue([106, 106, 100]); avsP.property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D").setValue([0, -12, 0]);`);
      emit(sel("sP", ik));
      kf(`advsP.property("ADBE Text Selector Max Amount")`, [[tk, 0, "o"], [tk + 0.07, 100, "io"], [tk + 0.26, 0, "io"]]);
    }
    emit(`var bl = desfoque(${L}, 0);`);
    kf(`bl.property("ADBE Gaussian Blur 2-0001")`, [[tin, 8, "o"], [tin + dIn, 0, "hold"], [tout, 0, "o"], [tout + dOut, 7, "io"]]);
    kf(`tl(${L}).property("ADBE Opacity")`, [[tin, 0, "o"], [tin + dIn, 100, "hold"], [tout, 100, "o"], [tout + dOut, 0, "io"]]);
    emit(`tl(${L}).property("ADBE Position").dimensionsSeparated = true;`);
    kf(`tl(${L}).property("ADBE Position_1")`, [[tin, Y_LEG + 16, "o"], [tin + dIn, Y_LEG, "hold"], [tout, Y_LEG, "o"], [tout + dOut, Y_LEG - 14, "io"]]);
    emit(`confereMargem(${L}, [${r3(tin + dIn + 0.05)}]);`);
  });
});
emit(`log("legendas ok");`);

// ===== o som (a mixagem pronta) =====
emit(`try { var MIX = COMP.layers.add(importa(PECA + "/audio/mix.wav")); MIX.name = "Mix (voz, fecho, trilha e efeitos)"; } catch (e) { log("sem mix: " + e); }`);

// ===== a conferência da margem de segurança =====
emit(`var foraM = 0; for (var q = 0; q < MARGEM.length; q++) { var Lq = MARGEM[q][0], tq = MARGEM[q][1]; for (var u = 0; u < tq.length; u++) { try { var rr = Lq.sourceRectAtTime(tq[u], false); var a = Lq.sourcePointToComp ? null : null; var p0 = tl(Lq).property("ADBE Position").valueAtTime(tq[u], false); var an = tl(Lq).property("ADBE Anchor Point").valueAtTime(tq[u], false); var sc = tl(Lq).property("ADBE Scale").valueAtTime(tq[u], false); var px = Lq.parent ? null : p0; if (!px) continue; var x0 = px[0] + (rr.left - an[0]) * sc[0] / 100, x1 = px[0] + (rr.left + rr.width - an[0]) * sc[0] / 100, y0 = px[1] + (rr.top - an[1]) * sc[1] / 100, y1 = px[1] + (rr.top + rr.height - an[1]) * sc[1] / 100; if (x0 < ${M.l} - 0.5 || x1 > ${M.r} + 0.5 || y0 < ${M.t} - 0.5 || y1 > ${M.b} + 0.5) { foraM++; log("MARGEM " + Lq.name + " em " + tq[u] + ": x " + Math.round(x0) + " a " + Math.round(x1) + ", y " + Math.round(y0) + " a " + Math.round(y1)); } } catch (e) { log("margem: " + Lq.name + " " + e); } } } log("margem: " + foraM + " fora");`);

emit(`app.endUndoGroup();`);
emit(`app.project.save(new File(PECA + "/CINCO-MOTIVOS.aep"));`);
emit(`log("ok, " + COMP.numLayers + " camadas");`);
emit(`} catch (e) { log("ERRO: " + e + " linha " + e.line); }`);
emit(`app.endSuppressDialogs(false);`);

const js = out.join("\n").replace(/[^\x00-\x7F]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
fs.writeFileSync(path.join(AQUI, "monta.jsx"), js);
fs.writeFileSync(path.join(AQUI, "legenda-tempos.json"), JSON.stringify({ words, phrases }, null, 1));
console.log(`monta.jsx: ${out.length} linhas, ${nEmit} instruções`);
